import type { SimaProfileDto, SimaPurpose, SimaSessionDto, SimaSessionStatusDto } from '@mediconnect/shared';
import type { Actor } from '../core/actor';
import { securityEvent } from '../core/audit';
import { addMinutes, clock } from '../core/clock';
import { hmac, randomToken, verifyHmac } from '../core/crypto';
import { ApiError } from '../core/errors';
import { getSetting } from '../core/settings';
import { faults } from '../integrations/faults';
import { db } from '../store/db';
import { newId } from '../store/repo';
import { GOV_REGISTRY } from '../store/seed-data/registry';
import type { SimaVerificationSession } from '../store/types';

// SİMA inteqrasiyası (UC-101, UC-103, həkim/admin dəvəti). Real SİMA: QR → telefonda üz tanıma → imzalı callback.
// Mock: dev panel "SİMA" tabı mockScan()-i çağırır, o da SİMA kimi imzalı payload qurub handleCallback()-ə ötürür.
// Callback imzası həmişə yoxlanılır (FR-101-25, NFR-07) — saxta callback 401 ilə rədd edilir.

export interface SimaCallbackBody {
  qrToken: string;
  status: 'SUCCESS' | 'FAILED';
  person: SimaProfileDto | null;
  reason: string | null;
  issuedAt: string;
}

export function createSimaSession(p: { fin: string; mobileNumber: string; purpose: SimaPurpose; flowId: string; returnUrl?: string | null }): SimaSessionDto {
  // EF-101-5: SİMA əlçatan deyil.
  if (faults.get('sima') === 'down') throw new ApiError('ServiceUnavailable');
  // Eyni axın üçün köhnə gözləyən sessiyalar etibarsız olur (QR yeniləmə — UC-101 alt 2).
  for (const s of db.sima_verification_sessions) {
    if (s.flowId === p.flowId && s.sessionStatus === 'PENDING') s.sessionStatus = 'EXPIRED';
  }
  const session: SimaVerificationSession = {
    simaSessionId: newId(),
    fin: p.fin,
    mobileNumber: p.mobileNumber,
    qrToken: randomToken(18),
    purpose: p.purpose,
    sessionStatus: 'PENDING',
    returnUrl: p.returnUrl ?? null,
    callbackPayload: null,
    signatureVerified: false,
    failureReason: null,
    flowId: p.flowId,
    expiresAt: addMinutes(clock.now(), getSetting('sima_qr_validity_seconds') / 60).toISOString(),
    createdAt: clock.nowIso(),
  };
  db.sima_verification_sessions.push(session);
  return toSessionDto(session);
}

const toSessionDto = (s: SimaVerificationSession): SimaSessionDto => ({
  simaSessionId: s.simaSessionId,
  qrToken: s.qrToken,
  qrPayload: `sima://verify?token=${s.qrToken}&rp=mediconnect`,
  expiresAt: s.expiresAt,
});

/** Vaxtı keçmiş PENDING sessiyanı EXPIRED edir (EF-101-4). */
function refresh(s: SimaVerificationSession) {
  if (s.sessionStatus === 'PENDING' && new Date(s.expiresAt).getTime() <= clock.nowMs()) s.sessionStatus = 'EXPIRED';
  return s;
}

export function findSession(simaSessionId: string): SimaVerificationSession {
  const s = db.sima_verification_sessions.find((x) => x.simaSessionId === simaSessionId);
  if (!s) throw new ApiError('NotFound');
  return refresh(s);
}

export function sessionStatus(simaSessionId: string): SimaSessionStatusDto {
  const s = findSession(simaSessionId);
  return {
    simaSessionId: s.simaSessionId,
    sessionStatus: s.sessionStatus,
    expiresAt: s.expiresAt,
    profile: s.sessionStatus === 'SUCCESS' ? (s.callbackPayload as unknown as SimaProfileDto) : null,
    failureReason: s.failureReason,
  };
}

/** /v1/auth/sima/callback — imza yoxlaması + nəticənin emalı. */
export function handleCallback(actor: Actor, rawBody: string, signature: string | undefined) {
  if (!signature || !verifyHmac(rawBody, signature)) {
    securityEvent(actor, 'SIMA_MISMATCH', 'HIGH', 'SİMA callback imzası yanlışdır — saxta cavab rədd edildi');
    throw new ApiError('Unauthorized');
  }
  const body = JSON.parse(rawBody) as SimaCallbackBody;
  const s = db.sima_verification_sessions.find((x) => x.qrToken === body.qrToken);
  if (!s) throw new ApiError('NotFound');
  refresh(s);
  if (s.sessionStatus === 'EXPIRED') throw new ApiError('SimaSessionExpired');
  if (s.sessionStatus !== 'PENDING') throw new ApiError('Conflict');

  s.signatureVerified = true;
  if (body.status === 'FAILED' || !body.person) {
    s.sessionStatus = 'FAILED';
    s.failureReason = body.reason ?? 'Üz tanıma uğursuz oldu';
    return s;
  }
  // FIN uyğunluğu: QR-ı skan edən şəxs axındakı FIN-in sahibi olmalıdır (BR-103-02; qeydiyyatda da eyni qayda).
  if (body.person.fin !== s.fin) {
    s.sessionStatus = 'FAILED';
    s.failureReason = 'Doğrulanan şəxsin FIN-i daxil edilmiş FIN ilə uyğun gəlmir';
    s.callbackPayload = { fin: body.person.fin };
    const user = db.users.find((u) => u.fin === s.fin);
    securityEvent(actor, 'SIMA_MISMATCH', s.purpose === 'PIN_RESET' ? 'HIGH' : 'MEDIUM', `SİMA FIN uyğunsuzluğu (${s.purpose}): gözlənilən ${s.fin}`, user?.userId ?? null);
    return s;
  }
  s.sessionStatus = 'SUCCESS';
  s.callbackPayload = { ...body.person };
  return s;
}

// ── Mock SİMA tətbiqi (yalnız dev panel) ──

export type ScanOutcome = 'SUCCESS' | 'FAILED' | 'FIN_MISMATCH';

/** "Dövlət Şəxsiyyət Bazası"ndan şəxs (reyestrdə yoxdursa sintetik). */
function personFor(fin: string): SimaProfileDto {
  const known = GOV_REGISTRY.find((p) => p.fin === fin) ?? db.users.find((u) => u.fin === fin);
  if (known) {
    const { firstName, lastName, fatherName, birthDate, gender } = known;
    return { fin, firstName, lastName, fatherName, birthDate, gender };
  }
  return { fin, firstName: 'Test', lastName: 'İstifadəçi', fatherName: 'Demo', birthDate: '1995-06-15', gender: 'MALE' };
}

export function buildSignedCallback(qrToken: string, outcome: ScanOutcome): { raw: string; signature: string } {
  const s = db.sima_verification_sessions.find((x) => x.qrToken === qrToken);
  if (!s) throw new ApiError('NotFound');
  const other = GOV_REGISTRY.find((p) => p.fin !== s.fin) ?? GOV_REGISTRY[0];
  // faults.sima === 'error' → SİMA üz tanımanı uğursuz qaytarır.
  const failed = outcome === 'FAILED' || faults.get('sima') === 'error';
  const body: SimaCallbackBody = {
    qrToken,
    status: failed ? 'FAILED' : 'SUCCESS',
    person: failed ? null : outcome === 'FIN_MISMATCH' ? personFor(other.fin) : personFor(s.fin),
    reason: failed ? 'Liveness yoxlaması uğursuz oldu' : null,
    issuedAt: clock.nowIso(),
  };
  const raw = JSON.stringify(body);
  return { raw, signature: hmac(raw) };
}

export function pendingSessions() {
  return db.sima_verification_sessions
    .map(refresh)
    .filter((s) => s.sessionStatus === 'PENDING')
    .map((s) => ({ qrToken: s.qrToken, purpose: s.purpose, fin: s.fin, mobileNumber: s.mobileNumber, expiresAt: s.expiresAt }));
}
