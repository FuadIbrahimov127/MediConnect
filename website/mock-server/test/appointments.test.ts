import { beforeEach, describe, expect, it } from 'vitest';
import { bakuToUtc, clock } from '../src/core/clock';
import { runJobs } from '../src/jobs/scheduler';
import { db } from '../src/store/db';
import { seed } from '../src/store/seed';
import { api, PHONES, tokenFor } from './helpers';

// 2026-10-26 bazar ertəsi 08:00 (Bakı). Dr. Aygün: Mərkəzi Klinika B.e. 09:00–18:00 (nahar 13–14), AUTO təsdiq.
const MON = '2026-10-26';
beforeEach(() => {
  clock.set(bakuToUtc(MON, '08:00'));
  seed({ keepClock: true });
});

const ids = () => {
  const doc = (fin: string) => db.doctors.find((d) => d.userId === db.users.find((u) => u.fin === fin)!.userId)!;
  const clinic = (name: string) => db.clinics.find((c) => c.name === name)!;
  const service = (name: string) => db.services.find((s) => s.nameAz === name)!.serviceId;
  return {
    aygun: doc('3KL88MN'),
    resad: doc('7RH21KL'),
    merkezi: clinic('Mərkəzi Klinika'),
    kaspi: clinic('Kaspi Tibb Mərkəzi'),
    initial: service('İlkin müayinə'),
    echo: service('Exokardioqrafiya'),
    followUp: service('Təkrar müayinə'),
  };
};

function slotAt(doctorId: string, clinicId: string, date: string, time: string) {
  const dc = db.doctor_clinics.find((x) => x.doctorId === doctorId && x.clinicId === clinicId)!;
  const s = db.appointment_slots.find((x) => x.doctorClinicId === dc.doctorClinicId && x.slotDate === date && x.startTime === time);
  if (!s) throw new Error(`slot yoxdur ${date} ${time}`);
  return s;
}

const auth = (t: string) => ({ Authorization: `Bearer ${t}` });
const SEBINE = '+994500000022'; // boş kabinet
const ORXAN = '+994500000021'; // no-show limiti aşıb

async function book(token: string, opts: { time?: string; date?: string; serviceId?: string; doctor?: 'aygun' | 'resad'; note?: string } = {}) {
  const i = ids();
  const doctor = opts.doctor === 'resad' ? i.resad : i.aygun;
  const clinic = opts.doctor === 'resad' ? i.kaspi : i.merkezi;
  const slot = slotAt(doctor.doctorId, clinic.clinicId, opts.date ?? MON, opts.time ?? '10:00');
  const serviceId = opts.serviceId ?? i.initial;
  const lock = await api().post(`/v1/slots/${slot.slotId}/lock`).set(auth(token)).send({ serviceId });
  expect(lock.status).toBe(200);
  const res = await api().post('/v1/appointments').set(auth(token)).send({ doctorId: doctor.doctorId, clinicId: clinic.clinicId, serviceId, slotId: slot.slotId, patientNote: opts.note ?? 'Baş ağrısı' });
  return { res, slot, lock };
}

describe('UC-401 randevu yaratma', () => {
  it('lock → təsdiq: CONFIRMED, booking reference, slot BOOKED, xatırlatmalar, bildirişlər, audit', async () => {
    const t = await tokenFor(SEBINE);
    const { res, slot } = await book(t, { time: '11:00' });
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ appointmentStatus: 'CONFIRMED', slotDate: MON, startTime: '11:00', endTime: '11:30', clinicName: 'Mərkəzi Klinika' });
    expect(res.body.data.bookingReference).toMatch(/^MC-2026-1026-\d{4}$/);
    expect(slot.status).toBe('BOOKED');
    const appt = db.appointments.find((a) => a.appointmentId === res.body.data.appointmentId)!;
    // 11:00 randevusu: 24 saat əvvəl keçmişdədir → yalnız 2 saatlıq xatırlatma (09:00).
    expect(db.scheduled_notifications.filter((n) => n.appointmentId === appt.appointmentId).map((n) => n.notificationType)).toEqual(['REMINDER_2H']);
    expect(db.notifications.some((n) => n.notificationType === 'APPOINTMENT_CONFIRMED')).toBe(true);
    expect(db.notifications.some((n) => n.notificationType === 'NEW_APPOINTMENT')).toBe(true);
    expect(db.audit_logs.some((a) => a.action === 'CREATE_APPOINTMENT' && a.entityId === appt.appointmentId)).toBe(true);
  });

  it('manual təsdiq rejimində PENDING; həkim təsdiqləyir (UC-401 alt 2, UC-703 alt 1)', async () => {
    const t = await tokenFor(SEBINE);
    const { res } = await book(t, { doctor: 'resad', time: '11:00' });
    expect(res.body.data.appointmentStatus).toBe('PENDING');
    expect(db.notifications.some((n) => n.notificationType === 'APPOINTMENT_REQUESTED')).toBe(true);
    const doctor = db.users.find((u) => u.fin === '7RH21KL')!;
    const dt = (await api().post('/__dev/login-as').send({ userId: doctor.userId })).body.data.token;
    const ok = await api().patch(`/v1/appointments/${res.body.data.appointmentId}/confirm`).set(auth(dt));
    expect(ok.body.data.status).toBe('CONFIRMED');
  });

  it('paralel lock-dan yalnız biri qəbul edilir (FR-401-16, EF-401-1)', async () => {
    const i = ids();
    const slot = slotAt(i.aygun.doctorId, i.merkezi.clinicId, MON, '11:00');
    const [a, b] = await Promise.all([tokenFor(SEBINE), tokenFor(PHONES.patient)]);
    const r = await Promise.all([api().post(`/v1/slots/${slot.slotId}/lock`).set(auth(a)).send({}), api().post(`/v1/slots/${slot.slotId}/lock`).set(auth(b)).send({})]);
    expect(r.map((x) => x.status).sort()).toEqual([200, 409]);
    expect(r.find((x) => x.status === 409)!.body.errorType).toBe('SlotUnavailable');
  });

  it('lock 10 dəqiqədən sonra bitir → SlotLockExpired, job slotu buraxır (EF-401-2)', async () => {
    const i = ids();
    const t = await tokenFor(SEBINE);
    const slot = slotAt(i.aygun.doctorId, i.merkezi.clinicId, MON, '11:30');
    await api().post(`/v1/slots/${slot.slotId}/lock`).set(auth(t)).send({}).expect(200);
    clock.advanceMinutes(11);
    const t2 = await tokenFor(SEBINE); // sessiya fəallığı ilə uzanır, yenisi də olar
    const res = await api().post('/v1/appointments').set(auth(t2)).send({ doctorId: i.aygun.doctorId, clinicId: i.merkezi.clinicId, serviceId: i.initial, slotId: slot.slotId });
    expect(res.body.errorType).toBe('SlotLockExpired');
    runJobs('releaseExpiredLocks');
    expect(slot.status).toBe('AVAILABLE');
  });

  it('1 saatdan az qalan slot seçilmir (BR-401-05)', async () => {
    const i = ids();
    clock.set(bakuToUtc(MON, '09:10'));
    const t = await tokenFor(SEBINE);
    const slot = slotAt(i.aygun.doctorId, i.merkezi.clinicId, MON, '10:00');
    const res = await api().post(`/v1/slots/${slot.slotId}/lock`).set(auth(t)).send({});
    expect(res.body.errorType).toBe('BookingTooSoon');
  });

  it('eyni həkimlə eyni gündə ikinci randevu qadağandır (BR-401-06)', async () => {
    const t = await tokenFor(SEBINE);
    await book(t, { time: '10:00' });
    const { res } = await book(t, { time: '15:00' });
    expect(res.body.errorType).toBe('DuplicateAppointment');
  });

  it('no-show limiti aşılıbsa bloklanır (BR-401-10)', async () => {
    const t = await tokenFor(ORXAN);
    const { res } = await book(t);
    expect(res.body.errorType).toBe('NoShowLimitExceeded');
  });

  it('40 dəqiqəlik xidmət iki ardıcıl slotu tutur', async () => {
    const t = await tokenFor(SEBINE);
    const i = ids();
    const { res, lock } = await book(t, { time: '10:00', serviceId: i.echo });
    expect(lock.body.data.slotIds).toHaveLength(2);
    expect(res.body.data.endTime).toBe('11:00');
    expect(slotAt(i.aygun.doctorId, i.merkezi.clinicId, MON, '10:30').status).toBe('BOOKED');
  });

  it('klinika randevu qəbul etmirsə yaradılmır (EF-401-6)', async () => {
    const t = await tokenFor(SEBINE);
    const i = ids();
    const slot = slotAt(i.aygun.doctorId, i.merkezi.clinicId, MON, '12:00');
    db.clinics.find((c) => c.clinicId === i.merkezi.clinicId)!.acceptingAppointments = false;
    expect((await api().post(`/v1/slots/${slot.slotId}/lock`).set(auth(t)).send({})).body.errorType).toBe('ClinicNotAccepting');
  });
});

describe('UC-404 / məxfilik', () => {
  it('başqa pasientin randevusu 404 + security event (EF-404-3)', async () => {
    const t = await tokenFor(SEBINE);
    const { res } = await book(t);
    const other = await tokenFor(PHONES.patient);
    expect((await api().get(`/v1/appointments/${res.body.data.appointmentId}`).set(auth(other))).status).toBe(404);
    expect(db.security_events.some((e) => e.eventType === 'UNAUTHORIZED_ACCESS')).toBe(true);
  });

  it('klinika admini şikayət mətnini görmür, həkim görür (BR-805-02)', async () => {
    const t = await tokenFor(SEBINE);
    const { res } = await book(t, { note: 'Gizli simptom' });
    const id = res.body.data.appointmentId;
    const admin = await tokenFor(PHONES.clinicAdmin);
    const a = await api().get(`/v1/appointments/${id}`).set(auth(admin));
    expect(a.body.data.patientNote).toBeNull();
    expect(JSON.stringify(a.body)).not.toContain('Gizli simptom');
    const doctor = await tokenFor(PHONES.doctor);
    expect((await api().get(`/v1/appointments/${id}`).set(auth(doctor))).body.data.patientNote).toBe('Gizli simptom');
  });

  it('tab-lar və saylar', async () => {
    const t = await tokenFor(PHONES.patient);
    const up = await api().get('/v1/appointments?tab=UPCOMING').set(auth(t));
    expect(up.body.data.counts.UPCOMING).toBe(2); // seed: Dr. Aygün (təsdiqlənmiş) + Dr. Rəşad (gözləyir)
    expect(up.body.data.counts.CANCELLED).toBe(1);
    expect(up.body.data.appointments[0].allowedActions).toEqual(expect.arrayContaining(['CANCEL', 'RESCHEDULE', 'ADD_TO_CALENDAR']));
    const past = await api().get('/v1/appointments?tab=PAST').set(auth(t));
    expect(past.body.data.appointments.some((a: { allowedActions: string[] }) => a.allowedActions.includes('REVIEW'))).toBe(true);
  });

  it('.ics faylı', async () => {
    const t = await tokenFor(SEBINE);
    const { res } = await book(t);
    const ics = await api().get(`/v1/appointments/${res.body.data.appointmentId}/calendar.ics`).set(auth(t));
    expect(ics.headers['content-type']).toContain('text/calendar');
    expect(ics.text).toContain('DTSTART:20261026T060000Z');
  });
});

describe('UC-402 ləğv', () => {
  it('pasient ləğvi: slot boşalır, xatırlatmalar ləğv, hər iki tərəf xəbərdar, tarixçə qalır', async () => {
    const t = await tokenFor(SEBINE);
    const { res, slot } = await book(t, { time: '16:00' });
    const id = res.body.data.appointmentId;
    const c = await api().patch(`/v1/appointments/${id}/cancel`).set(auth(t)).send({ reason: 'Planlarım dəyişdi' });
    expect(c.body.data.status).toBe('CANCELLED');
    expect(slot.status).toBe('AVAILABLE');
    expect(db.scheduled_notifications.filter((n) => n.appointmentId === id).every((n) => n.status === 'CANCELLED')).toBe(true);
    expect(db.notifications.filter((n) => n.notificationType === 'APPOINTMENT_CANCELLED')).toHaveLength(2);
    expect(db.appointments.some((a) => a.appointmentId === id)).toBe(true);
    expect((await api().patch(`/v1/appointments/${id}/cancel`).set(auth(t)).send({ reason: 'yenə' })).body.errorType).toBe('InvalidStatusTransition');
  });

  it('1 saatdan az qalıbsa pasient ləğv edə bilməz (BR-402-02), səbəb məcburidir', async () => {
    const t = await tokenFor(SEBINE);
    const { res } = await book(t, { time: '10:00' });
    expect((await api().patch(`/v1/appointments/${res.body.data.appointmentId}/cancel`).set(auth(t)).send({})).status).toBe(400);
    clock.set(bakuToUtc(MON, '09:15'));
    const t2 = await tokenFor(SEBINE);
    const r = await api().patch(`/v1/appointments/${res.body.data.appointmentId}/cancel`).set(auth(t2)).send({ reason: 'Gecikirəm' });
    expect(r.body.errorType).toBe('CancellationTooLate');
  });

  it('həkim ləğvi pasientin no-show sayına təsir etmir (BR-402-08)', async () => {
    const t = await tokenFor(SEBINE);
    const { res } = await book(t);
    const d = await tokenFor(PHONES.doctor);
    await api().patch(`/v1/appointments/${res.body.data.appointmentId}/cancel`).set(auth(d)).send({ reason: 'Həkim xəstələnib' }).expect(200);
    expect(db.patients.find((p) => p.userId === db.users.find((u) => u.mobileNumber === SEBINE)!.userId)!.noShowCount).toBe(0);
  });
});

describe('UC-403 köçürmə', () => {
  it('pasient köçürməsi: yeni slot lock → köhnə slot boşalır, sayğac artır, limit 2', async () => {
    const t = await tokenFor(SEBINE);
    const i = ids();
    const { res, slot: first } = await book(t, { time: '14:00' });
    const id = res.body.data.appointmentId;
    const move = async (time: string) => {
      const s = slotAt(i.aygun.doctorId, i.merkezi.clinicId, '2026-10-28', time);
      await api().post(`/v1/slots/${s.slotId}/lock`).set(auth(t)).send({ serviceId: i.initial }).expect(200);
      return { r: await api().patch(`/v1/appointments/${id}/reschedule`).set(auth(t)).send({ newSlotId: s.slotId }), s };
    };
    const m1 = await move('10:00');
    expect(m1.r.body.data).toMatchObject({ status: 'CONFIRMED', rescheduleCount: 1, startTime: '10:00' });
    expect(first.status).toBe('AVAILABLE');
    expect(m1.s.status).toBe('BOOKED');
    await move('11:00');
    const s3 = slotAt(i.aygun.doctorId, i.merkezi.clinicId, '2026-10-28', '15:00');
    await api().post(`/v1/slots/${s3.slotId}/lock`).set(auth(t)).send({}).expect(200);
    expect((await api().patch(`/v1/appointments/${id}/reschedule`).set(auth(t)).send({ newSlotId: s3.slotId })).body.errorType).toBe('RescheduleLimitExceeded');
  });

  it('2 saatdan az qalıbsa köçürmə mümkün deyil (BR-403-02)', async () => {
    const t = await tokenFor(SEBINE);
    const { res } = await book(t, { time: '10:00' });
    const i = ids();
    const s = slotAt(i.aygun.doctorId, i.merkezi.clinicId, '2026-10-28', '10:00');
    await api().post(`/v1/slots/${s.slotId}/lock`).set(auth(t)).send({}).expect(200);
    expect((await api().patch(`/v1/appointments/${res.body.data.appointmentId}/reschedule`).set(auth(t)).send({ newSlotId: s.slotId })).body.errorType).toBe('RescheduleTooLate');
  });

  it('həkim təklifi pasientin təsdiqini gözləyir; imtina → ləğv (BR-403-06, F4)', async () => {
    const t = await tokenFor(SEBINE);
    const i = ids();
    const { res } = await book(t, { time: '16:00' });
    const id = res.body.data.appointmentId;
    const d = await tokenFor(PHONES.doctor);
    const target = slotAt(i.aygun.doctorId, i.merkezi.clinicId, '2026-10-29', '09:30');
    const p = await api().patch(`/v1/appointments/${id}/reschedule`).set(auth(d)).send({ newSlotId: target.slotId });
    expect(p.body.data.pendingReschedule).toMatchObject({ newDate: '2026-10-29', newTime: '09:30', requestedByRole: 'DOCTOR' });
    expect(target.status).toBe('BLOCKED');
    const view = await api().get(`/v1/appointments/${id}`).set(auth(t));
    expect(view.body.data.allowedActions).toContain('RESPOND_RESCHEDULE');
    const accept = await api().patch(`/v1/appointments/${id}/reschedule/respond`).set(auth(t)).send({ accept: true });
    expect(accept.body.data).toMatchObject({ slotDate: '2026-10-29', startTime: '09:30', pendingReschedule: null });

    const { res: r2 } = await book(t, { time: '16:00' });
    const t2 = slotAt(i.aygun.doctorId, i.merkezi.clinicId, '2026-10-29', '10:30');
    await api().patch(`/v1/appointments/${r2.body.data.appointmentId}/reschedule`).set(auth(d)).send({ newSlotId: t2.slotId }).expect(200);
    const decline = await api().patch(`/v1/appointments/${r2.body.data.appointmentId}/reschedule/respond`).set(auth(t)).send({ accept: false });
    expect(decline.body.data.status).toBe('CANCELLED');
    expect(t2.status).toBe('AVAILABLE');
  });
});

describe('UC-405 tamamlama və no-show', () => {
  async function bookedAndStarted() {
    const t = await tokenFor(SEBINE);
    const { res } = await book(t, { time: '10:00' });
    return { id: res.body.data.appointmentId as string, patientToken: t };
  }

  it('vaxtından əvvəl tamamlanmır; sonra COMPLETED + rəy dəvəti 2 saat sonra', async () => {
    const { id } = await bookedAndStarted();
    const d = await tokenFor(PHONES.doctor);
    expect((await api().patch(`/v1/appointments/${id}/complete`).set(auth(d)).send({})).body.errorType).toBe('AppointmentNotStarted');
    clock.set(bakuToUtc(MON, '10:20'));
    const d2 = await tokenFor(PHONES.doctor);
    const r = await api().patch(`/v1/appointments/${id}/complete`).set(auth(d2)).send({ doctorNote: 'Təzyiq normaldır' });
    expect(r.body.data.status).toBe('COMPLETED');
    const invite = db.scheduled_notifications.find((n) => n.appointmentId === id && n.notificationType === 'REVIEW_INVITE')!;
    const delta = new Date(invite.scheduledAt).getTime() - clock.nowMs();
    expect(Math.abs(delta - 2 * 3_600_000)).toBeLessThan(1000); // saat real vaxtla irəliləyir
  });

  it('no-show sayğacı artırır; klinika admini 24 saat ərzində düzəldir', async () => {
    const { id } = await bookedAndStarted();
    clock.set(bakuToUtc(MON, '10:40'));
    const d = await tokenFor(PHONES.doctor);
    await api().patch(`/v1/appointments/${id}/no-show`).set(auth(d)).expect(200);
    const patient = db.patients.find((p) => p.userId === db.users.find((u) => u.mobileNumber === SEBINE)!.userId)!;
    expect(patient.noShowCount).toBe(1);
    const admin = await tokenFor(PHONES.clinicAdmin);
    const r = await api().patch(`/v1/appointments/${id}/no-show/revert`).set(auth(admin));
    expect(r.body.data.status).toBe('COMPLETED');
    expect(patient.noShowCount).toBe(0);
  });

  it('24 saat sonra avtomatik tamamlanma (BR-405-07); təsdiqlənməmiş PENDING ləğv olunur (F3)', async () => {
    const { id } = await bookedAndStarted();
    const t = await tokenFor(SEBINE);
    const { res } = await book(t, { doctor: 'resad', time: '11:00' });
    clock.set(bakuToUtc(MON, '11:05'));
    runJobs('cancelUnconfirmedPending');
    expect(db.appointments.find((a) => a.appointmentId === res.body.data.appointmentId)!.status).toBe('CANCELLED');
    clock.set(bakuToUtc('2026-10-27', '10:01'));
    runJobs('autoCompleteAppointments');
    expect(db.appointments.find((a) => a.appointmentId === id)!.status).toBe('COMPLETED');
  });

  it('ləğv edilmiş randevu üçün xatırlatma göndərilmir (EF-1001-3)', async () => {
    const t = await tokenFor(SEBINE);
    const { res } = await book(t, { date: '2026-10-28', time: '10:00' });
    await api().patch(`/v1/appointments/${res.body.data.appointmentId}/cancel`).set(auth(t)).send({ reason: 'Planlarım dəyişdi' });
    clock.set(bakuToUtc('2026-10-27', '10:05'));
    runJobs('sendScheduledNotifications');
    expect(db.notifications.some((n) => n.notificationType === 'REMINDER_24H' && n.relatedEntityId === res.body.data.appointmentId)).toBe(false);
  });

  it('təsdiqlənmiş randevuya 24 saat qalmış xatırlatma gedir', async () => {
    const t = await tokenFor(SEBINE);
    const { res } = await book(t, { date: '2026-10-28', time: '10:00' });
    clock.set(bakuToUtc('2026-10-27', '10:05'));
    runJobs('sendScheduledNotifications');
    expect(db.notifications.some((n) => n.notificationType === 'REMINDER_24H' && n.relatedEntityId === res.body.data.appointmentId)).toBe(false); // REMINDER_24H yalnız SMS+PUSH (in-app yox)
    expect(db.scheduled_notifications.find((n) => n.appointmentId === res.body.data.appointmentId && n.notificationType === 'REMINDER_24H')!.status).toBe('SENT');
  });
});
