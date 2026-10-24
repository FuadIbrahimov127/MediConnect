import type { Actor } from './actor';
import { securityEvent } from './audit';
import { ApiError } from './errors';

// Sahiblik / sərhəd yoxlamaları. Uğursuz cəhd təhlükəsizlik log-una yazılır və resursun varlığı gizlədilir (404).

export function denyAccess(actor: Actor, what: string): never {
  securityEvent(actor, 'UNAUTHORIZED_ACCESS', 'MEDIUM', `İcazəsiz giriş cəhdi: ${what}`);
  throw new ApiError('NotFound');
}

export function assertOwner(actor: Actor, ownerUserId: string | null | undefined, what: string) {
  if (!actor.userId || actor.userId !== ownerUserId) denyAccess(actor, what);
}
