import { clock } from '../core/clock';
import { db } from '../store/db';
import { newId } from '../store/repo';
import { faults } from './faults';

// SMS Gateway / Push / Email provayderlərinin mock-u. Real göndərmə yoxdur: mesaj dev_outbox-a yazılır
// (dev panel → "Mesajlar") və konsola çıxır. Çatdırılma bir az sonra DELIVERED olur.

export type ExternalChannel = 'SMS' | 'PUSH' | 'EMAIL';

const FAULT_KEY = { SMS: 'sms', PUSH: 'push', EMAIL: 'email' } as const;

export interface SendResult {
  ok: boolean;
  providerMessageId: string | null;
  error: string | null;
}

export function sendExternal(
  channel: ExternalChannel,
  msg: { to: string; userId: string | null; title: string | null; body: string; deliveryId: string | null },
): SendResult {
  const fault = faults.get(FAULT_KEY[channel]);
  const id = newId();
  const failed = fault !== 'ok';
  db.dev_outbox.push({
    id,
    channel,
    to: msg.to,
    userId: msg.userId,
    title: msg.title,
    body: msg.body,
    status: failed ? 'FAILED' : 'SENT',
    deliveryId: msg.deliveryId,
    createdAt: clock.nowIso(),
  });
  if (failed) {
    console.log(`[${channel}] ✗ ${msg.to}: provayder əlçatan deyil`);
    return { ok: false, providerMessageId: null, error: `${channel} provider ${fault}` };
  }
  console.log(`[${channel}] → ${msg.to}: ${msg.title ? `${msg.title} — ` : ''}${msg.body}`);
  // Provayderdən "delivered" callback-i simulyasiyası.
  setTimeout(() => markDelivered(id), 800).unref?.();
  return { ok: true, providerMessageId: id, error: null };
}

function markDelivered(outboxId: string) {
  const m = db.dev_outbox.find((o) => o.id === outboxId);
  if (!m || m.status !== 'SENT') return;
  m.status = 'DELIVERED';
  const d = m.deliveryId ? db.notification_deliveries.find((x) => x.deliveryId === m.deliveryId) : null;
  if (d && d.status === 'SENT') {
    d.status = 'DELIVERED';
    d.deliveredAt = clock.nowIso();
  }
}
