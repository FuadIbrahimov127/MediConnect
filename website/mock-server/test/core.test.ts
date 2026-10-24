import { beforeEach, describe, expect, it } from 'vitest';
import { bakuToUtc, clock } from '../src/core/clock';
import { getSetting } from '../src/core/settings';
import { faults } from '../src/integrations/faults';
import { runJobs } from '../src/jobs/scheduler';
import { notify } from '../src/services/notifications.service';
import { db } from '../src/store/db';
import { api, PHONES, tokenFor, userByPhone } from './helpers';

describe('cavab zərfi', () => {
  it('naməlum endpoint → 404 NotFound zərfi', async () => {
    const res = await api().get('/v1/yoxdur');
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ status: 'ERROR', errorType: 'NotFound', message: 'Məlumat tapılmadı' });
    expect(res.body.timestamp).toBeTypeOf('string');
  });

  it('Accept-Language mesaj dilini dəyişir', async () => {
    const res = await api().get('/v1/auth/me').set('Accept-Language', 'en');
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/session/i);
  });

  it('kataloqlar public-dir', async () => {
    const res = await api().get('/v1/specialties');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('SUCCESS');
    expect(res.body.data.map((s: { name: string }) => s.name)).toContain('Kardioloq');
  });
});

describe('sessiya', () => {
  it('token ilə /auth/me cari istifadəçini qaytarır, logout sessiyanı bağlayır', async () => {
    const token = await tokenFor(PHONES.doctor);
    const me = await api().get('/v1/auth/me').set('Authorization', `Bearer ${token}`);
    expect(me.body.data).toMatchObject({ role: 'DOCTOR', firstName: 'Aygün' });
    expect(me.body.data.clinicIds).toHaveLength(2);

    await api().post('/v1/auth/logout').set('Authorization', `Bearer ${token}`).expect(200);
    await api().get('/v1/auth/me').set('Authorization', `Bearer ${token}`).expect(401);
  });

  it('15 dəqiqə fəaliyyətsizlikdən sonra sessiya bitir (BR-102-04)', async () => {
    const token = await tokenFor(PHONES.patient);
    clock.advanceMinutes(getSetting('session_timeout_minutes') + 1);
    await api().get('/v1/auth/me').set('Authorization', `Bearer ${token}`).expect(401);
  });

  it('fəaliyyət sessiyanı uzadır (sliding)', async () => {
    const token = await tokenFor(PHONES.patient);
    clock.advanceMinutes(10);
    await api().get('/v1/auth/me').set('Authorization', `Bearer ${token}`).expect(200);
    clock.advanceMinutes(10);
    await api().get('/v1/auth/me').set('Authorization', `Bearer ${token}`).expect(200);
  });
});

describe('bildirişlər', () => {
  const patient = () => userByPhone(PHONES.patient);
  // Seed-in öz mesajları (məs. gözləyən həkim dəvətinin SMS-i) yoxlamalara qarışmasın.
  beforeEach(() => {
    db.dev_outbox = [];
    db.notification_deliveries = [];
  });

  it('kritik bildiriş SMS + push + in-app göndərilir', () => {
    notify({ type: 'APPOINTMENT_CONFIRMED', userId: patient().userId, vars: { doctorName: 'Dr. Aygün Məmmədova', date: '22 sentyabr', time: '14:30', clinicName: 'Mərkəzi Klinika', bookingReference: 'MC-1' } });
    expect(db.notifications.filter((n) => n.userId === patient().userId)).toHaveLength(1);
    const channels = db.dev_outbox.map((m) => m.channel).sort();
    expect(channels).toEqual(['PUSH', 'SMS']);
    expect(db.dev_outbox[0].body).toContain('Dr. Aygün Məmmədova');
  });

  it('SMS uğursuz olanda alternativ kanal sınanır (EF-1001-1)', () => {
    faults.set('sms', 'down');
    notify({ type: 'REMINDER_24H', userId: patient().userId, vars: {} });
    const sms = db.notification_deliveries.find((d) => d.channel === 'SMS')!;
    expect(sms.status).toBe('FAILED');
    // Push yalnız bir dəfə göndərilir (fallback olaraq), təkrarlanmır.
    expect(db.notification_deliveries.filter((d) => d.channel === 'PUSH' && d.status === 'SENT')).toHaveLength(1);
  });

  it('gecə saatlarında kritik olmayan bildiriş səhərə saxlanılır (BR-1001-08)', () => {
    clock.set(bakuToUtc('2026-10-23', '23:30'));
    notify({ type: 'PRESCRIPTION_CREATED', userId: patient().userId, vars: { doctorName: 'Dr. X' } });
    const rx = () => db.notifications.filter((n) => n.notificationType === 'PRESCRIPTION_CREATED');
    const deferred = () => db.scheduled_notifications.filter((n) => n.notificationType === 'PRESCRIPTION_CREATED');
    expect(rx()).toHaveLength(0);
    expect(deferred()).toHaveLength(1);

    clock.set(bakuToUtc('2026-10-24', '08:01'));
    runJobs('sendScheduledNotifications');
    expect(rx()).toHaveLength(1);
    expect(deferred()[0].status).toBe('SENT');
  });

  it('istifadəçi yalnız öz bildirişlərini görür və oxunmuş edə bilir', async () => {
    notify({ type: 'REVIEW_INVITE', userId: patient().userId, vars: { doctorName: 'Dr. X' } });
    const token = await tokenFor(PHONES.patient);
    const list = await api().get('/v1/notifications').set('Authorization', `Bearer ${token}`);
    expect(list.body.data.unreadCount).toBe(1);
    const id = list.body.data.notifications[0].notificationId;

    const other = await tokenFor(PHONES.doctor);
    await api().patch(`/v1/notifications/${id}/read`).set('Authorization', `Bearer ${other}`).expect(404);

    await api().patch(`/v1/notifications/${id}/read`).set('Authorization', `Bearer ${token}`).expect(200);
    const count = await api().get('/v1/notifications/unread-count').set('Authorization', `Bearer ${token}`);
    expect(count.body.data.unreadCount).toBe(0);
  });
});
