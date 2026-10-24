import { describe, expect, it } from 'vitest';
import { addDaysToDate, bakuDate, clock } from '../src/core/clock';
import { runJobs } from '../src/jobs/scheduler';
import { db } from '../src/store/db';
import { makePdf } from '../src/store/seed-data/files';
import { api, PHONES, tokenFor } from './helpers';

const auth = (t: string) => ({ Authorization: `Bearer ${t}` });
const KASPI_ADMIN = '+994500000003';
const clinicId = (name: string) => db.clinics.find((c) => c.name === name)!.clinicId;
const MERKEZI = () => clinicId('Mərkəzi Klinika');
const userIdOfFin = (fin: string) => db.users.find((u) => u.fin === fin)!.userId;
const doctorIdOf = (fin: string) => db.doctors.find((d) => d.userId === userIdOfFin(fin))!.doctorId;
const serviceId = (name: string) => db.services.find((s) => s.nameAz === name)!.serviceId;
const specialtyId = (name: string) => db.specialties.find((s) => s.nameAz === name)!.specialtyId;
const pdfDoc = (kind: 'LICENSE' | 'DIPLOMA' = 'LICENSE') => ({ kind, fileName: 'lisenziya.pdf', dataUrl: `data:application/pdf;base64,${makePdf('Lisenziya', ['test']).toString('base64')}` });
/** Dr. Aygünün Mərkəzi Klinikada aktiv randevusu olan ilk gələcək gün (seed: ilk iş günü). */
const apptDay = () => {
  const dc = db.doctor_clinics.find((x) => x.doctorId === doctorIdOf(AYGUN) && x.clinicId === MERKEZI())!;
  return db.appointments
    .filter((a) => a.doctorClinicId === dc.doctorClinicId && ['PENDING', 'CONFIRMED'].includes(a.status) && bakuDate(new Date(a.startAt)) > bakuDate())
    .map((a) => bakuDate(new Date(a.startAt)))
    .sort()[0];
};
const tomorrow = () => addDaysToDate(bakuDate(), 1);
const admin = () => tokenFor(PHONES.clinicAdmin);
const AYGUN = '3KL88MN';

/** Mərkəzi Klinikada aktiv, Dr. Aygündən fərqli həkim. */
const otherMerkeziDoctor = () =>
  db.doctor_clinics.find((x) => x.clinicId === MERKEZI() && x.status === 'ACTIVE' && x.doctorId !== doctorIdOf(AYGUN) && db.doctors.find((d) => d.doctorId === x.doctorId)!.profileCompleted)!;

const newInvite = (over: Record<string, unknown> = {}) => ({
  fin: '7QW2ER5', mobileNumber: '+994500000044', firstName: 'Günel', lastName: 'Kərimova', licenseNumber: 'AZ-NEW-55501',
  licenseExpiryDate: addDaysToDate(bakuDate(), 400), specialtyIds: [specialtyId('Terapevt')], roomNumber: '101',
  services: [{ serviceId: serviceId('İlkin müayinə'), durationMinutes: 30 }], documents: [pdfDoc()], ...over,
});

describe('UC-801 klinika profili', () => {
  it('SA sahələri dəyişdirilə bilməz (EF-801-1); redaktə audit olunur; koordinat xəbərdarlığı (EF-801-4)', async () => {
    const t = await admin();
    const locked = await api().patch('/v1/clinic-admin/profile').set(auth(t)).send({ licenseNumber: 'X-1', description: 'yeni' });
    expect(locked.status).toBe(400);
    expect(locked.body.details.fields.licenseNumber).toBeTruthy();
    const res = await api().patch('/v1/clinic-admin/profile').set(auth(t)).send({ description: 'Yeni təsvir — 24 saat təcili yardım.', latitude: 55.75, longitude: 37.6 });
    expect(res.status).toBe(200);
    expect(res.body.data.warnings[0]).toMatch(/Azərbaycan/);
    expect(db.audit_logs.some((a) => a.action === 'UPDATE_CLINIC_PROFILE')).toBe(true);
    // FR-801-19: pasient tərəfində dərhal görünür.
    const pub = await api().get(`/v1/clinics/${MERKEZI()}`);
    expect(pub.body.data.description).toBe('Yeni təsvir — 24 saat təcili yardım.');
  });

  it('iş saatları: həkim cədvəli konflikti təsdiq tələb edir, randevu konflikti qərar tələb edir (EF-801-2/3)', async () => {
    const t = await admin();
    const profile = (await api().get('/v1/clinic-admin/profile').set(auth(t))).body.data;
    const days = profile.workingHours.map((d: { dayOfWeek: number; isClosed: boolean; opensAt: string; closesAt: string }) => ({ ...d, ...(d.isClosed ? {} : { opensAt: d.opensAt, closesAt: '12:00' }) }));
    const dry = await api().put('/v1/clinic-admin/working-hours').set(auth(t)).send({ days, dryRun: true });
    expect(dry.body.data.saved).toBe(false);
    expect(dry.body.data.doctorConflicts.length).toBeGreaterThan(0);
    const blocked = await api().put('/v1/clinic-admin/working-hours').set(auth(t)).send({ days });
    expect(blocked.body.errorType).toBe('ScheduleOutsideClinicHours');
    const res = await api().put('/v1/clinic-admin/working-hours').set(auth(t)).send({ days, confirmDoctorConflicts: true, conflictResolution: 'CANCEL_AND_NOTIFY' });
    expect(res.body.data.saved).toBe(true);
    const dcIds = new Set(db.doctor_clinics.filter((x) => x.clinicId === MERKEZI()).map((x) => x.doctorClinicId));
    const late = db.appointment_slots.filter((s) => dcIds.has(s.doctorClinicId) && s.status === 'AVAILABLE' && s.slotDate > bakuDate() && s.startTime >= '12:00');
    expect(late).toHaveLength(0); // BR-801-05: klinika saatları yuxarı sərhəddir
  });

  it('bayram günü: randevular üçün qərar, sonra bütün həkimlərin slotları bağlanır (BR-801-07)', async () => {
    const t = await admin();
    const day = apptDay();
    const blocked = await api().post('/v1/clinic-admin/holidays').set(auth(t)).send({ date: day, name: 'Respublika günü' });
    expect(blocked.body.errorType).toBe('ScheduleConflict');
    const res = await api().post('/v1/clinic-admin/holidays').set(auth(t)).send({ date: day, name: 'Respublika günü', conflictResolution: 'CANCEL_AND_NOTIFY' });
    expect(res.status).toBe(201);
    const dcIds = new Set(db.doctor_clinics.filter((x) => x.clinicId === MERKEZI()).map((x) => x.doctorClinicId));
    expect(db.appointment_slots.filter((s) => dcIds.has(s.doctorClinicId) && s.slotDate === day && s.status === 'AVAILABLE')).toHaveLength(0);
    expect(db.appointments.filter((a) => dcIds.has(a.doctorClinicId) && bakuDate(new Date(a.startAt)) === day && a.status === 'CONFIRMED')).toHaveLength(0);
  });

  it('müvəqqəti bağlama yeni randevunu dayandırır (BR-801-06)', async () => {
    const t = await admin();
    await api().patch('/v1/clinic-admin/accepting').set(auth(t)).send({ acceptingAppointments: false, reason: 'Təmir' }).expect(200);
    const p = await tokenFor(PHONES.patient);
    const dc = db.doctor_clinics.find((x) => x.clinicId === MERKEZI() && x.status === 'ACTIVE')!;
    const slot = db.appointment_slots.find((s) => s.doctorClinicId === dc.doctorClinicId && s.status === 'AVAILABLE' && s.slotDate > tomorrow())!;
    const lock = await api().post(`/v1/slots/${slot.slotId}/lock`).set(auth(p)).send({});
    expect(lock.body.errorType).toBe('ClinicNotAccepting');
  });
});

describe('UC-802 həkimlərin idarəsi', () => {
  it('FIN yoxlaması: yeni / başqa rol / artıq klinikada', async () => {
    const t = await admin();
    expect((await api().post('/v1/clinic-admin/doctors/lookup').set(auth(t)).send({ fin: '7QW2ER5' })).body.data.exists).toBe(false);
    expect((await api().post('/v1/clinic-admin/doctors/lookup').set(auth(t)).send({ fin: '6NS35AA' })).body.data.blockedReason).toMatch(/başqa rolda/);
    expect((await api().post('/v1/clinic-admin/doctors/lookup').set(auth(t)).send({ fin: AYGUN })).body.data.alreadyInClinic).toBe(true);
    expect((await api().post('/v1/clinic-admin/doctors').set(auth(t)).send(newInvite({ fin: AYGUN }))).body.errorType).toBe('DoctorAlreadyInClinic');
  });

  it('lisenziya təkrarlanır / keçmiş tarix / sənəd yoxdur (EF-802-2, 3, 7)', async () => {
    const t = await admin();
    const taken = db.doctors.find((d) => d.doctorId === doctorIdOf(AYGUN))!.licenseNumber;
    expect((await api().post('/v1/clinic-admin/doctors').set(auth(t)).send(newInvite({ licenseNumber: taken }))).body.errorType).toBe('DuplicateLicense');
    expect((await api().post('/v1/clinic-admin/doctors').set(auth(t)).send(newInvite({ licenseExpiryDate: '2020-01-01' }))).body.errorType).toBe('LicenseExpired');
    expect((await api().post('/v1/clinic-admin/doctors').set(auth(t)).send(newInvite({ documents: [] }))).body.details.fields.documents).toBeTruthy();
    const bad = await api().post('/v1/clinic-admin/doctors').set(auth(t)).send(newInvite({ documents: [{ kind: 'LICENSE', fileName: 'x.pdf', dataUrl: `data:application/pdf;base64,${Buffer.from('salam').toString('base64')}` }] }));
    expect(bad.body.errorType).toBe('UnsupportedFileType');
  });

  it('dəvət → SMS → SİMA → PIN → aktiv bağlantı, admin-ə bildiriş, profil tamamlamaya yönləndirmə', async () => {
    const t = await admin();
    const res = await api().post('/v1/clinic-admin/doctors').set(auth(t)).set('Origin', 'http://localhost:5174').send(newInvite());
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ status: 'INVITED', userStatus: 'PENDING_VERIFICATION' });
    const sms = db.dev_outbox.filter((m) => m.channel === 'SMS' && m.to === '+994500000044').at(-1)!;
    const token = sms.body.match(/invite\/([\w-]+)/)![1];
    expect(sms.body).toContain('http://localhost:5174/invite/');
    // Dəvət qəbul edilmədən həkim daxil ola bilmir (BR-802-02, BR-802-04).
    expect((await api().post('/v1/auth/login').send({ mobileNumber: '+994500000044', userPin: '2580' })).status).not.toBe(200);
    const info = await api().get(`/v1/invites/${token}`);
    expect(info.body.data).toMatchObject({ clinicName: 'Mərkəzi Klinika', existingAccount: false });
    const s = await api().post(`/v1/invites/${token}/sima`);
    await api().post(`/__dev/sima/${s.body.data.qrToken}/scan`).send({ outcome: 'SUCCESS' }).expect(200);
    const accepted = await api().post(`/v1/invites/${token}/accept`).send({ simaSessionId: s.body.data.simaSessionId, userPin: '1357', userPinConfirm: '1357' });
    expect(accepted.status).toBe(200);
    expect(accepted.body.data.redirectTo).toBe('/doctor/profile');
    const dc = db.doctor_clinics.find((x) => x.doctorId === res.body.data.doctorId)!;
    expect(dc.status).toBe('ACTIVE');
    const u = db.users.find((x) => x.fin === '7QW2ER5')!;
    expect(u).toMatchObject({ status: 'VERIFIED', birthDate: '1994-11-02' }); // SİMA reyestrindən
    expect(db.notifications.some((n) => n.notificationType === 'DOCTOR_INVITE_ACCEPTED')).toBe(true);
    // Token birdəfəlikdir.
    expect((await api().get(`/v1/invites/${token}`)).status).toBe(404);
  });

  it('mövcud həkim yalnız yeni bağlantı alır və PIN ilə qəbul edir (alt 1)', async () => {
    const kaspiOnly = db.doctor_clinics.find((x) => x.clinicId === clinicId('Kaspi Tibb Mərkəzi') && x.status === 'ACTIVE' && !db.doctor_clinics.some((y) => y.doctorId === x.doctorId && y.clinicId === MERKEZI()))!;
    const doc = db.doctors.find((d) => d.doctorId === kaspiOnly.doctorId)!;
    const u = db.users.find((x) => x.userId === doc.userId)!;
    const t = await admin();
    const lookup = await api().post('/v1/clinic-admin/doctors/lookup').set(auth(t)).send({ fin: u.fin });
    expect(lookup.body.data.doctor.licenseNumber).toBe(doc.licenseNumber);
    const res = await api().post('/v1/clinic-admin/doctors').set(auth(t)).send({ fin: u.fin, mobileNumber: u.mobileNumber, services: [{ serviceId: serviceId('Konsultasiya'), durationMinutes: 20 }], documents: [] });
    expect(res.status).toBe(201);
    expect(db.doctors.filter((d) => d.userId === u.userId)).toHaveLength(1);
    const dc = db.doctor_clinics.find((x) => x.doctorId === doc.doctorId && x.clinicId === MERKEZI())!;
    const info = await api().get(`/v1/invites/${dc.inviteToken}`);
    expect(info.body.data.existingAccount).toBe(true);
    expect((await api().post(`/v1/invites/${dc.inviteToken}/accept`).send({ userPin: '0000' })).body.errorType).toBe('InvalidPin');
    expect((await api().post(`/v1/invites/${dc.inviteToken}/accept`).send({ userPin: '2580' })).status).toBe(200);
    expect(dc.status).toBe('ACTIVE');
  });

  it('dəvət 7 gündən sonra etibarsızdır (EF-802-6); rədd → ləğv və admin-ə bildiriş (EF-802-1); təkrar göndərmə', async () => {
    const invited = db.doctor_clinics.find((x) => x.clinicId === MERKEZI() && x.status === 'INVITED')!; // seed: Samirə Rzayeva
    const token = invited.inviteToken!;
    clock.advanceMinutes(8 * 24 * 60);
    expect((await api().get(`/v1/invites/${token}`)).status).toBe(410);
    const t = await admin();
    const resent = await api().post(`/v1/clinic-admin/doctors/${invited.doctorId}/resend-invite`).set(auth(t));
    expect(resent.status).toBe(200);
    expect(invited.inviteToken).not.toBe(token);
    await api().post(`/v1/invites/${invited.inviteToken}/decline`).expect(200);
    expect(invited.status).toBe('REMOVED');
    expect(db.notifications.some((n) => n.notificationType === 'DOCTOR_INVITE_DECLINED')).toBe(true);
  });

  it('passiv həkim axtarışda görünmür, panelə girir; yenidən aktivləşmə (alt 2, 3)', async () => {
    const t = await admin();
    const other = otherMerkeziDoctor();
    const res = await api().patch(`/v1/clinic-admin/doctors/${other.doctorId}`).set(auth(t)).send({ status: 'INACTIVE', reason: 'Məzuniyyət' });
    expect(res.body.data.doctor.status).toBe('INACTIVE');
    // BR-802-07: başqa aktiv klinikası yoxdursa ictimai profil gizlənir; varsa bu klinika siyahıdan çıxır.
    const pub = await api().get(`/v1/doctors/${other.doctorId}`);
    const stillElsewhere = db.doctor_clinics.some((x) => x.doctorId === other.doctorId && x.clinicId !== MERKEZI() && x.status === 'ACTIVE');
    if (stillElsewhere) expect(JSON.stringify(pub.body.data)).not.toContain('Mərkəzi Klinika');
    else expect(pub.status).toBe(404);
    const u = db.users.find((x) => x.userId === db.doctors.find((d) => d.doctorId === other.doctorId)!.userId)!;
    expect((await api().post('/v1/auth/login').send({ mobileNumber: u.mobileNumber, userPin: '2580' })).status).toBe(200);
    await api().patch(`/v1/clinic-admin/doctors/${other.doctorId}`).set(auth(t)).send({ status: 'ACTIVE' }).expect(200);
    expect(db.appointment_slots.some((s) => s.doctorClinicId === other.doctorClinicId && s.status === 'AVAILABLE')).toBe(true);
  });

  it('lisenziya bitəndə job avtomatik dayandırır (BR-802-08); yeniləmə bərpa edir (alt 5)', async () => {
    const t = await admin();
    const other = otherMerkeziDoctor();
    const doc = db.doctors.find((d) => d.doctorId === other.doctorId)!;
    doc.licenseExpiryDate = addDaysToDate(bakuDate(), -1);
    runJobs();
    expect(other).toMatchObject({ status: 'INACTIVE', inactiveReason: 'LICENSE_EXPIRED' });
    expect((await api().patch(`/v1/clinic-admin/doctors/${other.doctorId}`).set(auth(t)).send({ status: 'ACTIVE' })).body.errorType).toBe('LicenseExpired');
    expect((await api().patch(`/v1/clinic-admin/doctors/${other.doctorId}`).set(auth(t)).send({ licenseExpiryDate: addDaysToDate(bakuDate(), 365) })).status).toBe(400); // yeni sənəd tələb olunur
    const res = await api().patch(`/v1/clinic-admin/doctors/${other.doctorId}`).set(auth(t)).send({ licenseExpiryDate: addDaysToDate(bakuDate(), 365), licenseDocument: { fileName: 'yeni.pdf', dataUrl: pdfDoc().dataUrl } });
    expect(res.body.data.doctor.status).toBe('ACTIVE');
  });

  it('lisenziyaya 30 gün qalmış xəbərdarlıq bir dəfə göndərilir (FR-802-26)', () => {
    const other = otherMerkeziDoctor();
    db.doctors.find((d) => d.doctorId === other.doctorId)!.licenseExpiryDate = addDaysToDate(bakuDate(), 30);
    runJobs();
    runJobs();
    const sent = db.audit_logs.filter((a) => a.action === 'LICENSE_EXPIRY_WARNING_SENT' && a.entityId === other.doctorId);
    expect(sent).toHaveLength(1);
    expect(db.notifications.some((n) => n.notificationType === 'LICENSE_EXPIRY_WARNING')).toBe(true);
  });

  it('aktiv randevusu olan həkim birbaşa çıxarılmır (EF-802-4); qərarla çıxarılır', async () => {
    const t = await admin();
    const aygun = doctorIdOf(AYGUN);
    const blocked = await api().delete(`/v1/clinic-admin/doctors/${aygun}`).set(auth(t)).send({ reason: 'Müqavilə bitib' });
    expect(blocked.body.errorType).toBe('HasActiveAppointments');
    expect(blocked.body.details.count).toBeGreaterThan(0);
    const res = await api().delete(`/v1/clinic-admin/doctors/${aygun}`).set(auth(t)).send({ reason: 'Müqavilə bitib', conflictResolution: 'CANCEL_AND_NOTIFY' });
    expect(res.body.data.cancelledCount).toBeGreaterThan(0);
    expect(db.doctor_clinics.find((x) => x.doctorId === aygun && x.clinicId === MERKEZI())!.status).toBe('REMOVED');
  });

  it('başqa klinikanın həkiminə giriş 404 + security event (EF-803-4)', async () => {
    const kaspi = await tokenFor(KASPI_ADMIN);
    const merkeziOnly = db.doctor_clinics.find((x) => x.clinicId === MERKEZI() && x.status === 'ACTIVE' && !db.doctor_clinics.some((y) => y.doctorId === x.doctorId && y.clinicId !== MERKEZI()))!;
    expect((await api().get(`/v1/clinic-admin/doctors/${merkeziOnly.doctorId}`).set(auth(kaspi))).status).toBe(404);
    expect((await api().get(`/v1/clinic-admin/doctors/${merkeziOnly.doctorId}/schedule`).set(auth(kaspi))).status).toBe(404);
    expect(db.security_events.some((e) => e.eventType === 'UNAUTHORIZED_ACCESS')).toBe(true);
    const p = await tokenFor(PHONES.patient);
    expect((await api().get('/v1/clinic-admin/doctors').set(auth(p))).status).toBe(403);
  });
});

describe('UC-803 təcili gün bağlama və köçürmə', () => {
  it('hər randevu üçün qərar tələb olunur; köçürmə pasient təsdiqi ilə; ləğv bildirişlə', async () => {
    const t = await admin();
    const aygun = doctorIdOf(AYGUN);
    // Köçürmə namizədi: başqa həkimə kardiologiya ixtisası və lazımi xidmətlər əlavə olunur.
    const other = otherMerkeziDoctor();
    const day = apptDay();
    const prev = await api().get(`/v1/clinic-admin/doctors/${aygun}/close-day`).query({ date: day }).set(auth(t));
    const appts = prev.body.data.appointments as { appointmentId: string; serviceName: string }[];
    expect(appts.length).toBeGreaterThan(0);
    const servicesNeeded = [...new Set(appts.map((a) => a.serviceName))].map((n) => ({ serviceId: serviceId(n), durationMinutes: 30 }));
    await api().patch(`/v1/clinic-admin/doctors/${other.doctorId}`).set(auth(t)).send({ specialtyIds: [specialtyId('Kardioloq')], services: servicesNeeded }).expect(200);
    const preview = (await api().get(`/v1/clinic-admin/doctors/${aygun}/close-day`).query({ date: day }).set(auth(t))).body.data;
    const withOption = preview.appointments.find((a: { transferOptions: unknown[] }) => a.transferOptions.length > 0);

    expect((await api().post(`/v1/clinic-admin/doctors/${aygun}/close-day`).set(auth(t)).send({ date: day, reason: 'Həkim xəstədir', decisions: [] })).body.errorType).toBe('ScheduleConflict');
    const decisions = preview.appointments.map((a: { appointmentId: string; transferOptions: { slots: { slotId: string }[] }[] }) =>
      withOption && a.appointmentId === withOption.appointmentId ? { appointmentId: a.appointmentId, action: 'TRANSFER', targetSlotId: a.transferOptions[0].slots[0].slotId } : { appointmentId: a.appointmentId, action: 'CANCEL' },
    );
    const res = await api().post(`/v1/clinic-admin/doctors/${aygun}/close-day`).set(auth(t)).send({ date: day, reason: 'Həkim xəstədir', decisions });
    expect(res.status).toBe(200);
    expect(res.body.data.cancelled + res.body.data.transferProposed).toBe(preview.appointments.length);
    const dc = db.doctor_clinics.find((x) => x.doctorId === aygun && x.clinicId === MERKEZI())!;
    expect(db.schedule_exceptions.some((e) => e.doctorClinicId === dc.doctorClinicId && e.exceptionType === 'DAY_OFF' && e.startDate === day)).toBe(true);
    expect(db.notifications.some((n) => n.notificationType === 'SCHEDULE_CHANGED')).toBe(true);

    if (withOption) {
      const appt = db.appointments.find((a) => a.appointmentId === withOption.appointmentId)!;
      const patientUser = db.users.find((u) => u.userId === db.patients.find((p) => p.patientId === appt.patientId)!.userId)!;
      const pt = await tokenFor(patientUser.mobileNumber);
      const dto = await api().get(`/v1/appointments/${appt.appointmentId}`).set(auth(pt));
      expect(dto.body.data.pendingReschedule.newDoctorName).toBeTruthy();
      await api().patch(`/v1/appointments/${appt.appointmentId}/reschedule/respond`).set(auth(pt)).send({ accept: true }).expect(200);
      expect(appt.doctorClinicId).toBe(other.doctorClinicId); // BR-803-06: pasient təsdiqindən sonra köçürülür
    }
  });
});

describe('UC-804 xidmətlər', () => {
  it('kataloqdan əlavə, ixtisas uyğunsuzluğu xəbərdarlığı, həkimsiz saxlanmır, aktiv randevulu silinmir', async () => {
    const t = await admin();
    const list = (await api().get('/v1/clinic-admin/services').set(auth(t))).body.data;
    expect(list.catalog.find((c: { name: string }) => c.name === 'Dermatoskopiya').added).toBe(false);
    expect(JSON.stringify(list)).not.toMatch(/price|qiymət/i); // BR-804-03
    const none = await api().post('/v1/clinic-admin/services').set(auth(t)).send({ serviceId: serviceId('Dermatoskopiya'), doctors: [] });
    expect(none.status).toBe(400);
    const add = await api().post('/v1/clinic-admin/services').set(auth(t)).send({ serviceId: serviceId('Dermatoskopiya'), doctors: [{ doctorId: doctorIdOf(AYGUN), durationMinutes: 45 }] });
    expect(add.status).toBe(201);
    expect(add.body.data.warnings.join(' ')).toMatch(/ixtisası ilə uyğun gəlmir/);
    expect(add.body.data.warnings.join(' ')).toMatch(/slot birləşdiriləcək/);
    const busy = list.services.find((s: { upcomingAppointments: number }) => s.upcomingAppointments > 0);
    expect((await api().delete(`/v1/clinic-admin/services/${busy.serviceId}`).set(auth(t))).body.errorType).toBe('HasActiveAppointments');
    expect((await api().delete(`/v1/clinic-admin/services/${serviceId('Dermatoskopiya')}`).set(auth(t))).status).toBe(200);
    const req = await api().post('/v1/clinic-admin/service-requests').set(auth(t)).send({ name: 'Akupunktura', category: 'prosedur' });
    expect(req.body.data.requests[0]).toMatchObject({ name: 'Akupunktura', status: 'PENDING' });
  });

  it('deaktiv xidmət yeni randevu üçün seçilmir (alt 1)', async () => {
    const t = await admin();
    const sid = serviceId('Konsultasiya');
    const has = db.clinic_doctor_services.some((r) => r.serviceId === sid && db.doctor_clinics.find((x) => x.doctorClinicId === r.doctorClinicId)!.clinicId === MERKEZI());
    if (!has) return;
    await api().patch(`/v1/clinic-admin/services/${sid}`).set(auth(t)).send({ isActive: false }).expect(200);
    const rows = db.clinic_doctor_services.filter((r) => r.serviceId === sid && db.doctor_clinics.find((x) => x.doctorClinicId === r.doctorClinicId)!.clinicId === MERKEZI());
    expect(rows.every((r) => !r.isActive)).toBe(true);
  });
});

describe('UC-805 nəzarət və hesabatlar', () => {
  it('admin klinikanın randevularını tibbi məzmunsuz görür; filtr işləyir', async () => {
    const t = await admin();
    const res = await api().get('/v1/clinic-admin/appointments').set(auth(t)).query({ from: bakuDate(), to: addDaysToDate(bakuDate(), 7) });
    expect(res.body.data.totalCount).toBeGreaterThan(0);
    for (const a of res.body.data.appointments) expect(a).toMatchObject({ patientNote: null, doctorNote: null, documents: [], prescriptions: [] }); // BR-805-02
    expect(JSON.stringify(res.body.data)).not.toContain('Təzyiq səhərlər'); // Nigarın şikayət mətni
    const byDoctor = await api().get('/v1/clinic-admin/appointments').set(auth(t)).query({ doctorId: doctorIdOf(AYGUN) });
    expect(byDoctor.body.data.appointments.every((a: { doctor: { doctorId: string } }) => a.doctor.doctorId === doctorIdOf(AYGUN))).toBe(true);
  });

  it('başqa klinikanın randevusu ləğv edilmir (EF-805-2); toplu ləğv', async () => {
    const kaspi = await tokenFor(KASPI_ADMIN);
    const dcIds = new Set(db.doctor_clinics.filter((x) => x.clinicId === MERKEZI()).map((x) => x.doctorClinicId));
    const merkeziAppt = db.appointments.find((a) => dcIds.has(a.doctorClinicId) && a.status === 'CONFIRMED' && new Date(a.startAt).getTime() > clock.nowMs())!;
    const bulkOther = await api().post('/v1/clinic-admin/appointments/bulk-cancel').set(auth(kaspi)).send({ appointmentIds: [merkeziAppt.appointmentId], reason: 'Fövqəladə hal' });
    expect(bulkOther.body.data).toMatchObject({ cancelled: 0 });
    expect(merkeziAppt.status).toBe('CONFIRMED');
    const t = await admin();
    const ok = await api().post('/v1/clinic-admin/appointments/bulk-cancel').set(auth(t)).send({ appointmentIds: [merkeziAppt.appointmentId], reason: 'Fövqəladə hal' });
    expect(ok.body.data.cancelled).toBe(1);
    expect(merkeziAppt.status).toBe('CANCELLED');
  });

  it('hesabatlar: gündəlik, həkimlər, no-show, yük; CSV və PDF export', async () => {
    const t = await admin();
    const from = addDaysToDate(bakuDate(), -90);
    const to = bakuDate();
    const daily = await api().get('/v1/clinic-admin/reports/daily').set(auth(t)).query({ from, to });
    expect(daily.body.data.daily).toHaveLength(91);
    expect(daily.body.data.totals.completed).toBeGreaterThan(0);
    const docs = await api().get('/v1/clinic-admin/reports/doctors').set(auth(t)).query({ from, to });
    expect(docs.body.data.doctors[0]).toHaveProperty('completionRate');
    expect((await api().get('/v1/clinic-admin/reports/load').set(auth(t)).query({ from, to })).body.data.load.length).toBeGreaterThan(0);
    expect((await api().get('/v1/clinic-admin/reports/no-show').set(auth(t)).query({ from, to })).body.data.noShows).toBeDefined();
    expect((await api().get('/v1/clinic-admin/reports/foo').set(auth(t)).query({ from, to })).status).toBe(404);
    const csv = await api().get('/v1/clinic-admin/reports/doctors/export').set(auth(t)).query({ from, to, format: 'csv' }).buffer(true);
    expect(csv.headers['content-type']).toContain('text/csv');
    expect(csv.text.charCodeAt(0)).toBe(0xfeff);
    const pdf = await api().get('/v1/clinic-admin/reports/daily/export').set(auth(t)).query({ from, to, format: 'pdf' });
    expect(pdf.headers['content-type']).toBe('application/pdf');
  });

  it('icmal: bugünkü göstəricilər, gözləyən dəvətlər', async () => {
    const t = await admin();
    const res = await api().get('/v1/clinic-admin/dashboard').set(auth(t));
    expect(res.body.data.clinic.name).toBe('Mərkəzi Klinika');
    expect(res.body.data.pendingInvites[0].fullName).toMatch(/Samirə Rzayeva/);
    expect(res.body.data.today).toHaveProperty('total');
  });
});
