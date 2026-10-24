import type { Language, UserRole } from '@mediconnect/shared';
import { config } from '../config';
import type { NextFunction, Request, Response } from 'express';
import { db } from '../store/db';
import { newId } from '../store/repo';
import type { User, UserSession } from '../store/types';
import { addMinutes, clock } from './clock';
import { randomToken, sha256 } from './crypto';
import { ApiError } from './errors';
import { getSetting } from './settings';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: { user: User; session: UserSession };
      rawBody?: string;
      lang: Language;
    }
  }
}

// Sessiya: opaque Bearer token (F10), serverdə yalnız sha256 hash saxlanır. 15 dəq fəaliyyətsizlik (sliding) — BR-102-04.
// Lokal demoda config.sessionTimeout=false — timeout söndürülür (30 gün), prod/testdə parametr tətbiq olunur.

const DEMO_SESSION_MINUTES = 30 * 24 * 60;
const sessionMinutes = () => (config.sessionTimeout ? getSetting('session_timeout_minutes') : DEMO_SESSION_MINUTES);

export function createSession(user: User, deviceInfo: string | null, ip: string | null): { token: string; session: UserSession } {
  const token = randomToken();
  const now = clock.now();
  const session: UserSession = {
    sessionId: newId(),
    userId: user.userId,
    tokenHash: sha256(token),
    deviceInfo,
    ipAddress: ip,
    expiresAt: addMinutes(now, sessionMinutes()).toISOString(),
    revokedAt: null,
    createdAt: now.toISOString(),
    lastSeenAt: now.toISOString(),
  };
  db.user_sessions.push(session);
  return { token, session };
}

export function revokeUserSessions(userId: string, exceptSessionId?: string) {
  const now = clock.nowIso();
  for (const s of db.user_sessions) {
    if (s.userId === userId && !s.revokedAt && s.sessionId !== exceptSessionId) s.revokedAt = now;
  }
}

export const isSessionActive = (s: UserSession) => !s.revokedAt && new Date(s.expiresAt).getTime() > clock.nowMs();

/** Token varsa req.auth təyin edir (yoxdursa sakitcə keçir — public endpoint-lər üçün). */
export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.get('authorization');
  if (header?.startsWith('Bearer ')) {
    const hash = sha256(header.slice(7));
    const session = db.user_sessions.find((s) => s.tokenHash === hash);
    if (session && isSessionActive(session)) {
      const user = db.users.find((u) => u.userId === session.userId);
      if (user && user.status !== 'BLOCKED' && user.status !== 'DELETED') {
        const now = clock.now();
        session.lastSeenAt = now.toISOString();
        session.expiresAt = addMinutes(now, sessionMinutes()).toISOString();
        req.auth = { user, session };
      }
    }
  }
  next();
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  if (!req.auth) throw new ApiError('Unauthorized');
  next();
}

/** Rol yoxlaması. Səhv rol → 403 (resursun varlığı gizli deyil, çünki path rola xasdır). */
export const requireRole =
  (...roles: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) throw new ApiError('Unauthorized');
    if (!roles.includes(req.auth.user.role)) throw new ApiError('Forbidden');
    next();
  };

export function languageMiddleware(req: Request, _res: Response, next: NextFunction) {
  const h = (req.get('accept-language') ?? '').toLowerCase();
  req.lang = h.startsWith('ru') ? 'ru' : h.startsWith('en') ? 'en' : 'az';
  next();
}
