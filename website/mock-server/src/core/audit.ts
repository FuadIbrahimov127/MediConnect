import { db } from '../store/db';
import { newId } from '../store/repo';
import type { SecurityEventType, SecuritySeverity } from '@mediconnect/shared';
import type { Actor } from './actor';
import { clock } from './clock';

// Audit log append-only-dir (BR-904-04, NFR-14): bu modulda yalnız insert var, update/delete funksiyası yazılmır.

export interface AuditInput {
  action: string;
  entityType: string;
  entityId?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
  reason?: string | null;
}

export function audit(actor: Actor, input: AuditInput) {
  db.audit_logs.push({
    auditId: newId(),
    userId: actor.userId,
    userRole: actor.role,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId ?? null,
    oldValue: input.oldValue ?? null,
    newValue: input.newValue ?? null,
    reason: input.reason ?? null,
    ipAddress: actor.ip,
    userAgent: actor.userAgent,
    createdAt: clock.nowIso(),
  });
}

export function securityEvent(actor: Actor, eventType: SecurityEventType, severity: SecuritySeverity, description: string, userId = actor.userId) {
  db.security_events.push({
    eventId: newId(),
    userId,
    eventType,
    severity,
    description,
    ipAddress: actor.ip,
    createdAt: clock.nowIso(),
  });
}
