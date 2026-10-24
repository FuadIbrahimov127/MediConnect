import fs from 'node:fs';
import path from 'node:path';
import { ROLE_HOME, uuidSchema, type AuthResultDto, type DevStateDto, type DevUserDto, type OutboxMessageDto } from '@mediconnect/shared';
import { Router } from 'express';
import { z } from 'zod';
import { config } from '../config';
import { actorOf } from '../core/actor';
import { audit } from '../core/audit';
import { createSession } from '../core/auth';
import { clock } from '../core/clock';
import { ApiError } from '../core/errors';
import { ok } from '../core/respond';
import { parseBody, parseQuery } from '../core/validate';
import { FAULT_TARGETS, faults } from '../integrations/faults';
import { listJobs, runJobs } from '../jobs/scheduler';
import { buildSignedCallback, handleCallback, pendingSessions } from '../services/sima.service';
import { currentUserDto } from '../serializers/user';
import { db } from '../store/db';
import { DEMO_DESCRIPTIONS, DEMO_PIN, seed } from '../store/seed';

// /__dev — yalnız lokal nümayiş üçün (MOCK_DEV_TOOLS=true). Real backenddə mövcud deyil.
export const devRouter = Router();

devRouter.get('/state', (req, res) => {
  const counts: Record<string, number> = {};
  for (const [k, v] of Object.entries(db)) counts[k] = (v as unknown[]).length;
  const state: DevStateDto = { now: clock.nowIso(), offsetMinutes: clock.offsetMinutes, faults: faults.all(), counts };
  ok(req, res, state);
});

devRouter.post('/reset', (req, res) => {
  fs.rmSync(path.join(config.dataDir, 'storage'), { recursive: true, force: true });
  faults.reset();
  seed();
  ok(req, res, { now: clock.nowIso() });
});

devRouter.get('/users', (req, res) => {
  const users: DevUserDto[] = db.users
    .filter((u) => u.status !== 'DELETED')
    .map((u) => ({
      userId: u.userId,
      role: u.role,
      fullName: `${u.firstName} ${u.lastName}`,
      mobileNumber: u.mobileNumber,
      pin: u.fin in DEMO_DESCRIPTIONS ? DEMO_PIN : '—',
      description: DEMO_DESCRIPTIONS[u.fin] ?? 'Demo zamanı yaradılıb',
    }));
  ok(req, res, users);
});

devRouter.post('/login-as', (req, res) => {
  const { userId } = parseBody(req, z.object({ userId: uuidSchema }));
  const user = db.users.find((u) => u.userId === userId);
  if (!user) throw new ApiError('NotFound');
  const { token } = createSession(user, 'dev-panel', req.ip ?? null);
  audit({ ...actorOf(req), userId: user.userId, role: user.role }, { action: 'DEV_LOGIN_AS', entityType: 'USER', entityId: user.userId });
  const result: AuthResultDto = { token, user: currentUserDto(user), redirectTo: ROLE_HOME[user.role] };
  ok(req, res, result);
});

devRouter.get('/outbox', (req, res) => {
  const { channel } = parseQuery(req, z.object({ channel: z.enum(['SMS', 'PUSH', 'EMAIL']).optional() }));
  const items: OutboxMessageDto[] = db.dev_outbox
    .filter((m) => !channel || m.channel === channel)
    .slice(-100)
    .reverse()
    .map(({ id, channel: ch, to, title, body, status, createdAt }) => ({ id, channel: ch, to, title, body, status, createdAt }));
  ok(req, res, items);
});

devRouter.get('/clock', (req, res) => ok(req, res, { now: clock.nowIso(), offsetMinutes: clock.offsetMinutes }));

devRouter.post('/clock', (req, res) => {
  const body = parseBody(req, z.object({ advanceMinutes: z.number().int().optional(), offsetMinutes: z.number().int().optional(), reset: z.boolean().optional() }));
  if (body.reset) clock.reset();
  else if (body.offsetMinutes !== undefined) clock.setOffsetMinutes(body.offsetMinutes);
  else if (body.advanceMinutes !== undefined) clock.advanceMinutes(body.advanceMinutes);
  // Vaxt dəyişəndə vaxtı çatmış hadisələr dərhal işlənsin.
  const jobs = runJobs();
  ok(req, res, { now: clock.nowIso(), offsetMinutes: clock.offsetMinutes, jobs });
});

devRouter.get('/jobs', (req, res) => ok(req, res, listJobs()));

devRouter.post('/jobs/run', (req, res) => {
  const { job } = parseBody(req, z.object({ job: z.string().optional() }));
  ok(req, res, runJobs(job));
});

devRouter.get('/faults', (req, res) => ok(req, res, faults.all()));

devRouter.post('/faults', (req, res) => {
  const body = parseBody(req, z.object({ target: z.enum(FAULT_TARGETS), mode: z.enum(['ok', 'down', 'error']) }));
  faults.set(body.target, body.mode);
  ok(req, res, faults.all());
});

// ── SİMA simulyatoru: "telefonda QR skan + üz tanıma" əvəzinə. İmzalı callback-i real handler-ə ötürür. ──
devRouter.get('/sima/pending', (req, res) => ok(req, res, pendingSessions()));

devRouter.post('/sima/:qrToken/scan', (req, res) => {
  const { outcome } = parseBody(req, z.object({ outcome: z.enum(['SUCCESS', 'FAILED', 'FIN_MISMATCH']) }));
  const { raw, signature } = buildSignedCallback(req.params.qrToken, outcome);
  const session = handleCallback({ userId: null, role: null, ip: 'sima-mock', userAgent: 'SIMA' }, raw, signature);
  ok(req, res, { sessionStatus: session.sessionStatus, failureReason: session.failureReason });
});
