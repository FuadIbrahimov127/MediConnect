import { beforeEach, describe, expect, it } from 'vitest';
import { bakuToUtc, clock } from '../src/core/clock';
import { db } from '../src/store/db';
import { seed } from '../src/store/seed';
import { api, PHONES, tokenFor } from './helpers';

// Bazar ertəsi 2026-10-26 08:00. Dr. Aygün Mərkəzi: B.e./Ç./C.a. 09–18 (nahar 13–14), Ç.a./C. 09–13; Kaspi: Ç.a./C. 14–19.
const MON = '2026-10-26';
beforeEach(() => {
  clock.set(bakuToUtc(MON, '08:00'));
  seed({ keepClock: true });
});

const auth = (t: string) => ({ Authorization: `Bearer ${t}` });
const clinicId = (name: string) => db.clinics.find((c) => c.name === name)!.clinicId;
const userByFin = (fin: string) => db.users.find((u) => u.fin === fin)!;
const loginAs = async (fin: string) => (await api().post('/__dev/login-as').send({ userId: userByFin(fin).userId })).body.data.token as string;

const AYGUN_WEEK = [
  { dayOfWeek: 1, startTime: '09:00', endTime: '18:00', slotDurationMinutes: 30, bufferMinutes: 0, breaks: [{ breakStart: '13:00', breakEnd: '14:00', breakName: 'Nahar' }] },
  { dayOfWeek: 2, startTime: '09:00', endTime: '13:00', slotDurationMinutes: 30, bufferMinutes: 0, breaks: [] },
  { dayOfWeek: 3, startTime: '09:00', endTime: '18:00', slotDurationMinutes: 30, bufferMinutes: 0, breaks: [] },
];

describe('UC-701 həkim profili', () => {
  it('lisenziya / klinika / qiymət sahələrini dəyişmək olmur (EF-701-2/3/5)', async () => {
    const t = await tokenFor(PHONES.doctor);
    const res = await api().patch('/v1/doctor/profile').set(auth(t)).send({ licenseNumber: 'X', price: 50, bio: 'x' });
    expect(res.status).toBe(400);
    expect(Object.keys(res.body.details.fields)).toEqual(expect.arrayContaining(['licenseNumber', 'price']));
  });

  it('ilk giriş profil səhifəsinə yönləndirir; profil tamamlananda axtarışda görünür və adminə bildiriş gedir', async () => {
    const login = await api().post('/v1/auth/login').send({ mobileNumber: userByFin('7FM22OP').mobileNumber, userPin: '2580' });
    expect(login.body.data.redirectTo).toBe('/doctor/profile');
    const t = login.body.data.token;
    const p = await api().get('/v1/doctor/profile').set(auth(t));
    expect(p.body.data.profileCompleted).toBe(false);
    expect(p.body.data.missingFields).toEqual(['bio', 'education']); // seed-də dil (az) artıq var
    const before = (await api().get('/v1/doctors').query({ query: 'Məlikov' })).body.data.totalCount;
    expect(before).toBe(0);

    const done = await api()
      .patch('/v1/doctor/profile')
      .set(auth(t))
      .send({ bio: 'Gənc kardioloq, ürək ritmi pozğunluqları üzrə ixtisaslaşır.', education: ['2010 — 2016 | ATU'], experienceYears: 2, languages: ['az', 'ru'], approvalMode: 'MANUAL' });
    expect(done.body.data).toMatchObject({ profileCompleted: true, missingFields: [], approvalMode: 'MANUAL' });
    expect(db.notifications.some((n) => n.notificationType === 'DOCTOR_PROFILE_COMPLETED')).toBe(true);
    expect(db.audit_logs.some((a) => a.action === 'UPDATE_DOCTOR_PROFILE')).toBe(true);
  });
});

describe('UC-702 cədvəl', () => {
  it('klinika üzrə cədvəl + həftəlik təqvim + digər klinikanın saatları', async () => {
    const t = await tokenFor(PHONES.doctor);
    const res = await api().get('/v1/doctor/schedule').set(auth(t)).query({ clinicId: clinicId('Mərkəzi Klinika') });
    expect(res.status).toBe(200);
    expect(res.body.data.calendar).toHaveLength(7);
    expect(res.body.data.days.find((d: { dayOfWeek: number }) => d.dayOfWeek === 1).breaks).toHaveLength(1);
    expect(res.body.data.otherClinics.some((o: { clinicName: string }) => o.clinicName === 'Kaspi Tibb Mərkəzi')).toBe(true);
  });

  it('validasiya: məntiqsiz vaxt, klinika saatından kənar, başqa klinika ilə üst-üstə (EF-702-3/4/5)', async () => {
    const t = await tokenFor(PHONES.doctor);
    const put = (days: unknown[]) => api().put('/v1/doctor/schedule').set(auth(t)).send({ clinicId: clinicId('Mərkəzi Klinika'), days });
    expect((await put([{ ...AYGUN_WEEK[0], startTime: '12:00', endTime: '10:00' }])).body.errorType).toBe('ScheduleOverlap');
    expect((await put([{ ...AYGUN_WEEK[0], endTime: '19:00' }])).body.errorType).toBe('ScheduleOutsideClinicHours');
    expect((await put([{ ...AYGUN_WEEK[1], endTime: '16:00' }])).body.errorType).toBe('DoctorBusyInOtherClinic'); // Ç.a. 14:00+ Kaspidədir
    expect((await put([AYGUN_WEEK[0], { ...AYGUN_WEEK[0], startTime: '17:00', endTime: '18:00', breaks: [] }])).body.errorType).toBe('ScheduleOverlap');
  });

  it('mövcud randevu ilə konflikt: dryRun siyahı, sonra "ləğv et və xəbərdar et" (EF-702-1, BR-702-11)', async () => {
    const patient = await tokenFor('+994500000022');
    const merkezi = clinicId('Mərkəzi Klinika');
    const aygun = db.doctors.find((d) => d.userId === userByFin('3KL88MN').userId)!;
    const dc = db.doctor_clinics.find((x) => x.doctorId === aygun.doctorId && x.clinicId === merkezi)!;
    const slot = db.appointment_slots.find((s) => s.doctorClinicId === dc.doctorClinicId && s.slotDate === MON && s.startTime === '16:00')!;
    await api().post(`/v1/slots/${slot.slotId}/lock`).set(auth(patient)).send({}).expect(200);
    const appt = await api().post('/v1/appointments').set(auth(patient)).send({ doctorId: aygun.doctorId, clinicId: merkezi, serviceId: db.services.find((s) => s.nameAz === 'İlkin müayinə')!.serviceId, slotId: slot.slotId });
    expect(appt.status).toBe(201);

    const t = await tokenFor(PHONES.doctor);
    const shorter = [{ ...AYGUN_WEEK[0], endTime: '15:00' }, AYGUN_WEEK[1], AYGUN_WEEK[2]];
    const dry = await api().put('/v1/doctor/schedule').set(auth(t)).send({ clinicId: merkezi, days: shorter, dryRun: true });
    expect(dry.body.data.conflicts.map((c: { startTime: string; date: string }) => `${c.date} ${c.startTime}`)).toContain(`${MON} 16:00`);
    const blocked = await api().put('/v1/doctor/schedule').set(auth(t)).send({ clinicId: merkezi, days: shorter });
    expect(blocked.status).toBe(409);
    expect(blocked.body.errorType).toBe('ScheduleConflict');
    const saved = await api().put('/v1/doctor/schedule').set(auth(t)).send({ clinicId: merkezi, days: shorter, conflictResolution: 'CANCEL_AND_NOTIFY' });
    expect(saved.body.data.cancelledCount).toBeGreaterThanOrEqual(1);
    expect(db.appointments.find((a) => a.appointmentId === appt.body.data.appointmentId)!.status).toBe('CANCELLED');
    // Yeni şablonda B.e. 15:00-dan sonra boş slot yoxdur; keçmiş slotlara toxunulmayıb.
    expect(db.appointment_slots.some((s) => s.doctorClinicId === dc.doctorClinicId && s.slotDate === '2026-11-02' && s.startTime >= '15:00' && s.status === 'AVAILABLE')).toBe(false);
  });

  it('slot müddətini dəyişəndə saxlanılan randevu ilə kəsişən slot yaranmır', async () => {
    const t = await tokenFor(PHONES.doctor);
    const merkezi = clinicId('Mərkəzi Klinika');
    const days = [{ ...AYGUN_WEEK[0], slotDurationMinutes: 20 }, AYGUN_WEEK[1], AYGUN_WEEK[2]];
    await api().put('/v1/doctor/schedule').set(auth(t)).send({ clinicId: merkezi, days, conflictResolution: 'CANCEL_AND_NOTIFY' }).expect(200);
    const aygun = db.doctors.find((d) => d.userId === userByFin('3KL88MN').userId)!;
    const dc = db.doctor_clinics.find((x) => x.doctorId === aygun.doctorId && x.clinicId === merkezi)!;
    const nov2 = db.appointment_slots.filter((s) => s.doctorClinicId === dc.doctorClinicId && s.slotDate === '2026-11-02').sort((a, b) => a.startTime.localeCompare(b.startTime));
    for (let i = 1; i < nov2.length; i++) expect(nov2[i].startTime >= nov2[i - 1].endTime).toBe(true);
    expect(nov2.some((s) => s.startTime === '09:20')).toBe(true);
  });

  it('məzuniyyət: həmin günlərdə slot qalmır, randevu varsa qərar tələb olunur (FR-702-12/13)', async () => {
    const t = await tokenFor(PHONES.doctor);
    const merkezi = clinicId('Mərkəzi Klinika');
    const res = await api().post('/v1/doctor/schedule/exceptions').set(auth(t)).send({ clinicId: merkezi, exceptionType: 'VACATION', startDate: '2026-11-09', endDate: '2026-11-13', reason: 'Konfrans' });
    expect(res.status).toBe(201);
    const aygun = db.doctors.find((d) => d.userId === userByFin('3KL88MN').userId)!;
    const dc = db.doctor_clinics.find((x) => x.doctorId === aygun.doctorId && x.clinicId === merkezi)!;
    expect(db.appointment_slots.some((s) => s.doctorClinicId === dc.doctorClinicId && s.slotDate >= '2026-11-09' && s.slotDate <= '2026-11-13')).toBe(false);
    // Nigarın seed randevusu (ən yaxın iş günü) olan günü bağlamaq → 409.
    const nigarAppt = db.appointments.find((a) => a.doctorClinicId === dc.doctorClinicId && a.status === 'CONFIRMED' && new Date(a.startAt).getTime() > clock.nowMs())!;
    const day = new Date(new Date(nigarAppt.startAt).getTime() + 4 * 3_600_000).toISOString().slice(0, 10);
    const conflict = await api().post('/v1/doctor/schedule/exceptions').set(auth(t)).send({ clinicId: merkezi, exceptionType: 'DAY_OFF', startDate: day, endDate: day });
    expect(conflict.body.errorType).toBe('ScheduleConflict');
    // Silinəndə slotlar geri qayıdır.
    await api().delete(`/v1/doctor/schedule/exceptions/${res.body.data.exceptionId}`).set(auth(t)).query({ clinicId: merkezi }).expect(200);
    expect(db.appointment_slots.some((s) => s.doctorClinicId === dc.doctorClinicId && s.slotDate === '2026-11-09')).toBe(true);
  });

  it('tək slot bloklanır; randevulu slot bloklanmır (EF-702-6)', async () => {
    const t = await tokenFor(PHONES.doctor);
    const aygun = db.doctors.find((d) => d.userId === userByFin('3KL88MN').userId)!;
    const dc = db.doctor_clinics.find((x) => x.doctorId === aygun.doctorId && x.clinicId === clinicId('Mərkəzi Klinika'))!;
    const free = db.appointment_slots.find((s) => s.doctorClinicId === dc.doctorClinicId && s.slotDate === MON && s.startTime === '17:00')!;
    await api().patch(`/v1/slots/${free.slotId}/block`).set(auth(t)).send({ reason: 'Şəxsi' }).expect(200);
    expect(free.status).toBe('BLOCKED');
    await api().patch(`/v1/slots/${free.slotId}/unblock`).set(auth(t)).send({}).expect(200);
    const booked = db.appointment_slots.find((s) => s.doctorClinicId === dc.doctorClinicId && s.status === 'BOOKED' && s.slotDate >= MON)!;
    expect((await api().patch(`/v1/slots/${booked.slotId}/block`).set(auth(t)).send({})).body.errorType).toBe('ScheduleConflict');
  });

  it('başqa həkimin cədvəlinə giriş yoxdur', async () => {
    const t = await loginAs('7RH21KL'); // Dr. Rəşad — Mərkəzi Klinikada işləmir
    expect((await api().get('/v1/doctor/schedule').set(auth(t)).query({ clinicId: clinicId('Mərkəzi Klinika') })).status).toBe(404);
  });
});

describe('UC-703 həkimin randevuları', () => {
  it('tab-lar, günlük icmal və pasient konteksti (allergiya, yalnız öz tarixçəsi)', async () => {
    const t = await tokenFor(PHONES.doctor);
    const today = await api().get('/v1/doctor/appointments').set(auth(t)).query({ tab: 'TODAY' });
    expect(today.body.data.today.total).toBeGreaterThanOrEqual(1); // seed: 25 dəq sonra başlayan qəbul
    const upcoming = await api().get('/v1/doctor/appointments').set(auth(t)).query({ tab: 'UPCOMING' });
    const nigarAppt = upcoming.body.data.appointments.find((a: { patient: { fullName: string } }) => a.patient.fullName === 'Nigar Səlimova');
    const detail = await api().get(`/v1/appointments/${nigarAppt.appointmentId}`).set(auth(t));
    expect(detail.body.data.patientContext.allergies).toEqual([{ allergenName: 'Penisilin', severity: 'SEVERE' }]);
    // Nigarın Dr. Leyla ilə keçmiş qəbulu Dr. Aygünün kontekstində görünmür (BR-703-03).
    const all = detail.body.data.patientContext.history.map((h: { appointmentId: string }) => h.appointmentId);
    const leylaAppt = db.appointments.find((a) => a.patientId === db.patients.find((p) => p.userId === userByFin('6NS35AA').userId)!.patientId && a.status === 'COMPLETED' && db.doctor_clinics.find((x) => x.doctorClinicId === a.doctorClinicId)!.doctorId !== db.doctors.find((d) => d.userId === userByFin('3KL88MN').userId)!.doctorId);
    expect(all).not.toContain(leylaAppt?.appointmentId);
  });

  it('dashboard: lisenziya, bugünkü icmal, növbəti randevu', async () => {
    const t = await tokenFor(PHONES.doctor);
    const res = await api().get('/v1/doctor/dashboard').set(auth(t));
    expect(res.body.data).toMatchObject({ doctorName: 'Dr. Aygün Məmmədova', profileCompleted: true });
    expect(res.body.data.next).not.toBeNull();
  });

  it('pasient həkim endpoint-lərinə girə bilmir', async () => {
    const t = await tokenFor(PHONES.patient);
    expect((await api().get('/v1/doctor/appointments').set(auth(t))).status).toBe(403);
  });
});
