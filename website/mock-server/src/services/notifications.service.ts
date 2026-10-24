import type { Language, NotificationChannel, NotificationDto, NotificationType } from '@mediconnect/shared';
import type { Actor } from '../core/actor';
import { addDaysToDate, bakuDate, bakuHour, bakuToUtc, clock } from '../core/clock';
import { ApiError } from '../core/errors';
import { getSetting } from '../core/settings';
import { sendExternal, type ExternalChannel } from '../integrations/messaging';
import { db } from '../store/db';
import { newId, paginate } from '../store/repo';
import type { NotificationDelivery, NotificationTemplate, User } from '../store/types';
import { NOTIFICATION_CONFIG } from './notifications.config';

// UC-1001. Bildiriş servisi heç vaxt xəta atmır — əsas əməliyyatı bloklamamalıdır (BR-1000-04, NFR-22).
// Şablonlarda tibbi sirr yoxdur (BR-1001-05): çağıranlar diaqnoz/dərman adı ötürmür.

export interface NotifyInput {
  type: NotificationType;
  /** Alıcı istifadəçi. Yoxdursa (OTP, dəvət) `to` telefon nömrəsi verilməlidir. */
  userId?: string | null;
  to?: string;
  vars?: Record<string, string>;
  deepLink?: string | null;
  entity?: { type: string; id: string } | null;
  /** Quiet hours yoxlamasını ötür (təxirə salınmış bildirişin özü göndəriləndə). */
  ignoreQuietHours?: boolean;
}

const FALLBACK_ORDER: ExternalChannel[] = ['PUSH', 'SMS', 'EMAIL'];

function render(text: string, vars: Record<string, string>) {
  return text.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? '');
}

function findTemplate(type: NotificationType, lang: Language, channel: NotificationChannel): NotificationTemplate | undefined {
  const active = db.notification_templates.filter((t) => t.isActive && t.notificationType === type);
  return (
    active.find((t) => t.languageCode === lang && t.channel === channel) ??
    active.find((t) => t.languageCode === 'az' && t.channel === channel) ??
    active.find((t) => t.languageCode === lang && t.channel === 'IN_APP') ??
    active.find((t) => t.languageCode === 'az')
  );
}

function renderFor(type: NotificationType, lang: Language, channel: NotificationChannel, vars: Record<string, string>) {
  const tpl = findTemplate(type, lang, channel);
  if (!tpl) {
    // EF-1001-7: şablon tapılmadı → default şablon + log.
    console.warn(`[notify] şablon tapılmadı: ${type}/${lang}/${channel}`);
    return { title: NOTIFICATION_CONFIG[type].label, body: NOTIFICATION_CONFIG[type].label };
  }
  return { title: tpl.titleTemplate ? render(tpl.titleTemplate, vars) : null, body: render(tpl.bodyTemplate, vars) };
}

function inQuietHours(): boolean {
  const h = bakuHour(clock.now());
  const start = getSetting('quiet_hours_start');
  const end = getSetting('quiet_hours_end');
  return start > end ? h >= start || h < end : h >= start && h < end;
}

function nextQuietEnd(): Date {
  const end = getSetting('quiet_hours_end');
  const today = bakuDate(clock.now());
  const candidate = bakuToUtc(today, `${String(end).padStart(2, '0')}:00`);
  return candidate.getTime() > clock.nowMs() ? candidate : bakuToUtc(addDaysToDate(today, 1), `${String(end).padStart(2, '0')}:00`);
}

/** İstifadəçinin bu növ üçün açıq kanalları (məcburi növlərdə tərcih nəzərə alınmır). */
function channelsFor(user: User | null, type: NotificationType): NotificationChannel[] {
  const cfg = NOTIFICATION_CONFIG[type];
  if (!user || cfg.mandatory) return cfg.channels;
  const pref = db.notification_preferences.find((p) => p.userId === user.userId && p.notificationType === type);
  if (!pref) return cfg.channels;
  return cfg.channels.filter((c) => c === 'IN_APP' || (c === 'SMS' && pref.smsEnabled) || (c === 'PUSH' && pref.pushEnabled) || (c === 'EMAIL' && pref.emailEnabled));
}

function addressFor(user: User | null, channel: ExternalChannel, fallbackPhone?: string): string | null {
  if (channel === 'SMS') return user?.mobileNumber ?? fallbackPhone ?? null;
  if (channel === 'EMAIL') return user?.email ?? null;
  return user ? `device:${user.firstName} ${user.lastName}` : null;
}

/** Nəticə: ən azı bir xarici kanal (və ya yalnız in-app olan növlərdə mərkəz) uğurlu oldumu. Heç vaxt xəta atmır. */
export function notify(input: NotifyInput): { delivered: boolean } {
  try {
    return { delivered: notifyUnsafe(input) };
  } catch (e) {
    console.error('[notify] bildiriş göndərilmədi:', e);
    return { delivered: false };
  }
}

function notifyUnsafe(input: NotifyInput): boolean {
  const cfg = NOTIFICATION_CONFIG[input.type];
  const user = input.userId ? db.users.find((u) => u.userId === input.userId) ?? null : null;
  const lang: Language = user?.preferredLanguage ?? 'az';
  const vars = { ...(user ? { firstName: user.firstName, fullName: `${user.firstName} ${user.lastName}` } : {}), ...input.vars };

  // BR-1001-08: gecə saatlarında kritik olmayan bildirişlər səhərə saxlanılır.
  if (!cfg.critical && !input.ignoreQuietHours && user && inQuietHours()) {
    db.scheduled_notifications.push({
      scheduledId: newId(),
      userId: user.userId,
      appointmentId: input.entity?.type === 'APPOINTMENT' ? input.entity.id : null,
      notificationType: input.type,
      scheduledAt: nextQuietEnd().toISOString(),
      status: 'PENDING',
      cancelledReason: null,
      payload: { vars, deepLink: input.deepLink ?? null, relatedEntityType: input.entity?.type ?? null, relatedEntityId: input.entity?.id ?? null },
      createdAt: clock.nowIso(),
    });
    return true;
  }

  const channels = channelsFor(user, input.type);
  let notificationId: string | null = null;

  if (user && !cfg.noInApp && channels.includes('IN_APP')) {
    const { title, body } = renderFor(input.type, lang, 'IN_APP', vars);
    notificationId = newId();
    db.notifications.push({
      notificationId,
      userId: user.userId,
      notificationType: input.type,
      title: title ?? cfg.label,
      body,
      deepLink: input.deepLink ?? null,
      relatedEntityType: input.entity?.type ?? null,
      relatedEntityId: input.entity?.id ?? null,
      isRead: false,
      readAt: null,
      deletedAt: null,
      createdAt: clock.nowIso(),
    });
    db.notification_deliveries.push({
      deliveryId: newId(), notificationId, channel: 'IN_APP', status: 'DELIVERED', providerMessageId: null,
      errorMessage: null, retryCount: 0, sentAt: clock.nowIso(), deliveredAt: clock.nowIso(),
    });
  }

  const attempted = new Set<ExternalChannel>();
  const external = channels.filter((c): c is ExternalChannel => c !== 'IN_APP');
  let anyDelivered = external.length === 0;

  const attempt = (channel: ExternalChannel, isFallback: boolean): boolean => {
    attempted.add(channel);
    const to = addressFor(user, channel, input.to);
    if (!to) return false;
    const { title, body } = renderFor(input.type, lang, channel, vars);
    const delivery: NotificationDelivery = {
      deliveryId: newId(), notificationId, channel, status: 'QUEUED', providerMessageId: null,
      errorMessage: null, retryCount: isFallback ? 1 : 0, sentAt: null, deliveredAt: null,
    };
    db.notification_deliveries.push(delivery);
    const r = sendExternal(channel, { to, userId: user?.userId ?? null, title, body, deliveryId: delivery.deliveryId });
    if (r.ok) Object.assign(delivery, { status: 'SENT', providerMessageId: r.providerMessageId, sentAt: clock.nowIso() });
    else Object.assign(delivery, { status: 'FAILED', errorMessage: r.error });
    return r.ok;
  };

  for (const ch of external) {
    if (attempted.has(ch)) continue; // artıq fallback kimi sınanıb
    if (attempt(ch, false)) {
      anyDelivered = true;
      continue;
    }
    // BR-1001-06 / EF-1001-1: kanal uğursuz → alternativ kanal.
    const alt = FALLBACK_ORDER.find((c) => !attempted.has(c) && addressFor(user, c, input.to));
    if (alt && attempt(alt, true)) anyDelivered = true;
  }
  // EF-1001-2: bütün xarici kanallar uğursuz → yalnız bildiriş mərkəzində qalır.
  if (!anyDelivered) console.warn(`[notify] ${input.type}: bütün kanallar uğursuz oldu`);
  return anyDelivered;
}

/** Randevuya bağlı planlaşdırılmış bildiriş (xatırlatma, rəy dəvəti). */
export function scheduleNotification(input: { userId: string; type: NotificationType; at: Date; appointmentId?: string | null; vars?: Record<string, string>; deepLink?: string | null }) {
  db.scheduled_notifications.push({
    scheduledId: newId(),
    userId: input.userId,
    appointmentId: input.appointmentId ?? null,
    notificationType: input.type,
    scheduledAt: input.at.toISOString(),
    status: 'PENDING',
    cancelledReason: null,
    payload: { vars: input.vars ?? {}, deepLink: input.deepLink ?? null, relatedEntityType: input.appointmentId ? 'APPOINTMENT' : null, relatedEntityId: input.appointmentId ?? null },
    createdAt: clock.nowIso(),
  });
}

export function cancelScheduledForAppointment(appointmentId: string, reason: string, types?: NotificationType[]) {
  for (const s of db.scheduled_notifications) {
    if (s.appointmentId === appointmentId && s.status === 'PENDING' && (!types || types.includes(s.notificationType))) {
      s.status = 'CANCELLED';
      s.cancelledReason = reason;
    }
  }
}

/**
 * Planlaşdırılmış bildirişlərin göndərilməsi (scheduler job). Göndərməzdən əvvəl şərt yoxlanılır:
 * xatırlatma yalnız aktiv randevu üçün (BR-1001-04, EF-1001-3), rəy dəvəti yalnız rəy yazılmayıbsa.
 */
export function sendDueScheduledNotifications(): number {
  const now = clock.nowMs();
  let sent = 0;
  for (const s of db.scheduled_notifications) {
    if (s.status !== 'PENDING' || new Date(s.scheduledAt).getTime() > now) continue;
    const appt = s.appointmentId ? db.appointments.find((a) => a.appointmentId === s.appointmentId) : null;
    if (s.notificationType.startsWith('REMINDER_') && (!appt || appt.status !== 'CONFIRMED')) {
      s.status = 'SKIPPED';
      s.cancelledReason = 'Randevu artıq aktiv deyil';
      continue;
    }
    if (s.notificationType === 'REVIEW_INVITE' && (!appt || appt.status !== 'COMPLETED' || db.reviews.some((r) => r.appointmentId === appt.appointmentId))) {
      s.status = 'SKIPPED';
      s.cancelledReason = 'Rəy artıq yazılıb və ya randevu tamamlanmayıb';
      continue;
    }
    notify({
      type: s.notificationType,
      userId: s.userId,
      vars: s.payload?.vars,
      deepLink: s.payload?.deepLink ?? null,
      entity: s.payload?.relatedEntityType && s.payload.relatedEntityId ? { type: s.payload.relatedEntityType, id: s.payload.relatedEntityId } : null,
      ignoreQuietHours: true,
    });
    s.status = 'SENT';
    sent++;
  }
  return sent;
}

// ── Bildiriş mərkəzi (UC-1001 alt 1) ──

const toDto = (n: (typeof db.notifications)[number]): NotificationDto => ({
  notificationId: n.notificationId,
  notificationType: n.notificationType,
  title: n.title,
  body: n.body,
  deepLink: n.deepLink,
  isRead: n.isRead,
  createdAt: n.createdAt,
});

const mine = (actor: Actor) =>
  db.notifications.filter((n) => n.userId === actor.userId && !n.deletedAt).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

export function listNotifications(actor: Actor, page: number, size: number) {
  const p = paginate(mine(actor), page, size);
  return { totalCount: p.totalCount, page: p.page, size: p.size, unreadCount: mine(actor).filter((n) => !n.isRead).length, notifications: p.items.map(toDto) };
}

export const unreadCount = (actor: Actor) => mine(actor).filter((n) => !n.isRead).length;

function own(actor: Actor, id: string) {
  const n = db.notifications.find((x) => x.notificationId === id && x.userId === actor.userId && !x.deletedAt);
  if (!n) throw new ApiError('NotFound');
  return n;
}

export function markRead(actor: Actor, id: string) {
  const n = own(actor, id);
  if (!n.isRead) Object.assign(n, { isRead: true, readAt: clock.nowIso() });
  return toDto(n);
}

export function markAllRead(actor: Actor) {
  const now = clock.nowIso();
  for (const n of mine(actor)) if (!n.isRead) Object.assign(n, { isRead: true, readAt: now });
}

export function deleteNotification(actor: Actor, id: string) {
  own(actor, id).deletedAt = clock.nowIso();
}
