import type { UserRole } from '@mediconnect/shared';
import type { Request } from 'express';

/** Əməliyyatı kim edir — service funksiyaları req əvəzinə bunu alır (audit, sahiblik, security event üçün). */
export interface Actor {
  userId: string | null;
  role: UserRole | null;
  ip: string | null;
  userAgent: string | null;
}

export const SYSTEM_ACTOR: Actor = { userId: null, role: null, ip: null, userAgent: null };

export function actorOf(req: Request): Actor {
  return {
    userId: req.auth?.user.userId ?? null,
    role: req.auth?.user.role ?? null,
    ip: req.ip ?? null,
    userAgent: req.get('user-agent') ?? null,
  };
}
