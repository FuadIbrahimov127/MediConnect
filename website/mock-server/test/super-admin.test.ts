import { describe, expect, it } from 'vitest';
import { addDaysToDate, bakuDate, clock } from '../src/core/clock';
import { runJobs } from '../src/jobs/scheduler';
import { db } from '../src/store/db';
import { makePdf } from '../src/store/seed-data/files';
import { api, PHONES, tokenFor } from './helpers';

const auth = (t: string) => ({ Authorization: `Bearer ${t}` });
const sa = () => tokenFor(PHONES.superAdmin);
const pdf = (kind: string) => ({ kind, fileName: `${kind.toLowerCase()}.pdf`, dataUrl: `data:application/pdf;base64,${makePdf(kind, ['test']).toString('base64')}` });
const cityId = () => db.cities[0].cityId;
const clinicByName = (n: string) => db.clinics.find((c) => c.name === n)!;
const userByFin = (fin: string) => db.users.find((u) => u.fin === fin)!;

const newClinic = (over: Record<string, unknown> = {}) => ({
  name: 'Yeni Həyat Klinikası', clinicType: 'POLYCLINIC', cityId: cityId(), district: 'Yasamal', address: 'Bakı, Yasamal r., Şərifzadə 12', phone: '+994124445566',
  email: 'info@yenihayat.az', registrationNumber: 'VÖEN-1999888777', licenseNumber: 'TF-YENIHAYAT-2026', licenseExpiryDate: addDaysToDate(bakuDate(), 700),
  documents: [pdf('REGISTRATION'), pdf('LICENSE'), pdf('CONTRACT')],
  admin: { fin: '5AB7CD2', mobileNumber: '+994500000077', firstName: 'Fuad', lastName: 'İbrahimov' }, verify: true, ...over,
});

describe('UC-901 klinikanın əlavəsi', () => {
  it('yarat və təsdiqlə → ACTIVE, admin dəvəti, SİMA ilə aktivləşmə, /clinic-admin-ə yönləndirmə', async () => {
    const t = await sa();
    const res = await api().post('/v1/admin/clinics').set(auth(t)).set('Origin', 'http://localhost:5174').send(newClinic());
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ status: 'ACTIVE', registryCheck: { found: true } });
    expect(res.body.data.documents).toHaveLength(3);
    expect(res.body.data.admins[0]).toMatchObject({ status: 'INVITED', fullName: 'Fuad İbrahimov' });
    expect(db.audit_logs.some((l) => l.action === 'VERIFY_CLINIC' && l.entityId === res.body.data.clinicId)).toBe(true);
    // Klinika adminə SMS dəvəti → SİMA → PIN.
    const sms = db.dev_outbox.filter((m) => m.to === '+994500000077').at(-1)!;
    const token = sms.body.match(/invite\/([\w-]+)/)![1];
    const info = await api().get(`/v1/invites/${token}`);
    expect(info.body.data).toMatchObject({ kind: 'CLINIC_ADMIN', clinicName: 'Yeni Həyat Klinikası' });
    const s = await api().post(`/v1/invites/${token}/sima`);
    await api().post(`/__dev/sima/${s.body.data.qrToken}/scan`).send({ outcome: 'SUCCESS' }).expect(200);
    const acc = await api().post(`/v1/invites/${token}/accept`).send({ simaSessionId: s.body.data.simaSessionId, userPin: '1357', userPinConfirm: '1357' });
    expect(acc.status).toBe(200);
    expect(acc.body.data.redirectTo).toBe('/clinic-admin');
    const prof = await api().get('/v1/clinic-admin/profile').set(auth(acc.body.data.token));
    expect(prof.body.data.name).toBe('Yeni Həyat Klinikası');
  });

  it('qeydiyyat nömrəsi təkrarı (EF-901-1), keçmiş lisenziya (EF-901-3), reyestrdə yoxdur (EF-901-2), admin FIN konflikti (EF-901-5)', async () => {
    const t = await sa();
    const existing = db.clinics[0];
    const dup = await api().post('/v1/admin/clinics').set(auth(t)).send(newClinic({ registrationNumber: existing.registrationNumber }));
    expect(dup.body.errorType).toBe('DuplicateRegistrationNumber');
    expect(dup.body.details.name).toBe(existing.name);
    expect((await api().post('/v1/admin/clinics').set(auth(t)).send(newClinic({ licenseExpiryDate: '2020-01-01' }))).body.errorType).toBe('LicenseExpired');
    const reg = await api().post('/v1/admin/clinics').set(auth(t)).send(newClinic({ licenseNumber: 'XYZ-123' }));
    expect(reg.status).toBe(422);
    expect(reg.body.message).toMatch(/reyestrdə tapılmadı/);
    // Pasientin FIN-i admin üçün → rol konflikti, klinika yaranmır.
    const before = db.clinics.length;
    const conflict = await api().post('/v1/admin/clinics').set(auth(t)).send(newClinic({ admin: { fin: '6NS35AA', mobileNumber: '+994500000078', firstName: 'Nigar', lastName: 'Səlimova' } }));
    expect(conflict.status).toBe(409);
    expect(db.clinics.length).toBe(before);
  });

  it('gözləmə statusu → əlavə sənəd tələbi → verifikasiya; verifikasiyasız klinika görünmür (BR-901-02)', async () => {
    const t = await sa();
    const res = await api().post('/v1/admin/clinics').set(auth(t)).send(newClinic({ verify: false, documents: [pdf('CONTRACT')], licenseNumber: 'LIC-77', admin: { fin: '2ZX9CV4', mobileNumber: '+994500000079', firstName: 'Murad', lastName: 'Əsgərov' } }));
    expect(res.body.data.status).toBe('PENDING_VERIFICATION');
    const id = res.body.data.clinicId;
    expect((await api().get(`/v1/clinics/${id}`)).status).toBe(404);
    expect((await api().patch(`/v1/admin/clinics/${id}`).set(auth(t)).send({ action: 'VERIFY', reason: 'Sənədlər yoxlanıldı' })).status).toBe(422); // sənəd yoxdur
    await api().patch(`/v1/admin/clinics/${id}`).set(auth(t)).send({ action: 'REQUEST_DOCUMENTS', reason: 'Lisenziyanın surətini göndərin' }).expect(200);
    await api().post(`/v1/admin/clinics/${id}/documents`).set(auth(t)).send({ document: pdf('REGISTRATION') }).expect(201);
    await api().post(`/v1/admin/clinics/${id}/documents`).set(auth(t)).send({ document: pdf('LICENSE') }).expect(201);
    const stillBad = await api().patch(`/v1/admin/clinics/${id}`).set(auth(t)).send({ action: 'VERIFY', reason: 'Sənədlər yoxlanıldı' });
    expect(stillBad.body.message).toMatch(/reyestrdə tapılmadı/); // LIC-77 Nazirlik formatında deyil
  });

  it('saxta sənəd → rədd + təhlükəsizlik hadisəsi (EF-901-4); sənədə baxış audit olunur', async () => {
    const t = await sa();
    const pending = db.clinics.find((c) => c.status === 'PENDING_VERIFICATION')!;
    const res = await api().patch(`/v1/admin/clinics/${pending.clinicId}`).set(auth(t)).send({ action: 'REJECT', reason: 'Lisenziya sənədi saxtadır' });
    expect(res.body.data.status).toBe('INACTIVE');
    expect(db.security_events.some((e) => e.eventType === 'DOCUMENT_FRAUD')).toBe(true);
    const created = await api().post('/v1/admin/clinics').set(auth(t)).send(newClinic());
    const doc = created.body.data.documents[0];
    const file = await api().get(`/v1/admin/clinics/${created.body.data.clinicId}/documents/${doc.documentId}`).set(auth(t));
    expect(file.headers['content-type']).toBe('application/pdf');
    expect(db.audit_logs.some((l) => l.action === 'VIEW_CLINIC_DOCUMENT')).toBe(true);
  });

  it('dayandırma həkimləri axtarışdan çıxarır (BR-901-07); aktiv randevulu deaktivləşdirmə bloklanır (EF-901-6)', async () => {
    const t = await sa();
    const m = clinicByName('Mərkəzi Klinika');
    await api().patch(`/v1/admin/clinics/${m.clinicId}`).set(auth(t)).send({ action: 'SUSPEND', reason: 'Qayda pozuntusu yoxlanılır' }).expect(200);
    expect((await api().get(`/v1/clinics/${m.clinicId}`)).status).toBe(404);
    // Yalnız bu klinikada işləyən həkim tamamilə gizlənir; başqa klinikada da işləyən həkimin profilində bu klinika görünmür.
    const only = db.doctor_clinics.find((dc) => dc.clinicId === m.clinicId && dc.status === 'ACTIVE' && !db.doctor_clinics.some((o) => o.doctorId === dc.doctorId && o.clinicId !== m.clinicId))!;
    expect((await api().get(`/v1/doctors/${only.doctorId}`)).status).toBe(404);
    const aygun = db.doctors.find((d) => d.userId === userByFin('3KL88MN').userId)!;
    const clinics = (await api().get(`/v1/doctors/${aygun.doctorId}`)).body.data.clinics.map((c: { name: string }) => c.name);
    expect(clinics).not.toContain('Mərkəzi Klinika');
    expect(clinics.length).toBeGreaterThan(0);
    expect(db.notifications.some((n) => n.notificationType === 'CLINIC_STATUS_CHANGED')).toBe(true);
    const blocked = await api().patch(`/v1/admin/clinics/${m.clinicId}`).set(auth(t)).send({ action: 'DEACTIVATE', reason: 'Müqavilə bitib' });
    expect(blocked.body.errorType).toBe('HasActiveAppointments');
    const ok = await api().patch(`/v1/admin/clinics/${m.clinicId}`).set(auth(t)).send({ action: 'DEACTIVATE', reason: 'Müqavilə bitib', conflictResolution: 'CANCEL_AND_NOTIFY' });
    expect(ok.body.data.status).toBe('INACTIVE');
    expect(ok.body.data.upcomingAppointments).toBe(0);
  });

  it('lisenziya bitəndə job dayandırır (EF-901-7); yeniləmə bərpa edir (alt 6)', async () => {
    const t = await sa();
    const m = clinicByName('Mərkəzi Klinika');
    m.licenseExpiryDate = addDaysToDate(bakuDate(), -1);
    runJobs();
    expect(m).toMatchObject({ status: 'SUSPENDED', suspendedReason: 'LICENSE_EXPIRED' });
    const res = await api().post(`/v1/admin/clinics/${m.clinicId}/license`).set(auth(t)).send({ licenseExpiryDate: addDaysToDate(bakuDate(), 365), document: { fileName: 'lic.pdf', dataUrl: pdf('LICENSE').dataUrl } });
    expect(res.body.data.status).toBe('ACTIVE');
  });

  it('ikinci admin təyini (alt 5, BR-901-09)', async () => {
    const t = await sa();
    const m = clinicByName('Mərkəzi Klinika');
    const res = await api().post(`/v1/admin/clinics/${m.clinicId}/admins`).set(auth(t)).send({ fin: '7QW2ER5', mobileNumber: '+994500000081', firstName: 'Günel', lastName: 'Kərimova' });
    expect(res.status).toBe(201);
    expect(res.body.data.admins.filter((a: { status: string }) => a.status !== 'REMOVED').length).toBeGreaterThanOrEqual(2);
  });
});

describe('UC-902 istifadəçilər', () => {
  it('axtarış FIN/telefon/ad; detalda tibbi məzmun yoxdur (BR-902-02)', async () => {
    const t = await sa();
    const byFin = await api().get('/v1/admin/users').set(auth(t)).query({ q: '6NS35AA' });
    expect(byFin.body.data.users[0].fullName).toBe('Nigar Səlimova');
    const byPhone = await api().get('/v1/admin/users').set(auth(t)).query({ q: '+994500000020' });
    expect(byPhone.body.data.totalCount).toBe(1);
    const doctors = await api().get('/v1/admin/users').set(auth(t)).query({ role: 'DOCTOR', clinicId: clinicByName('Mərkəzi Klinika').clinicId });
    expect(doctors.body.data.users.every((u: { role: string }) => u.role === 'DOCTOR')).toBe(true);
    const detail = await api().get(`/v1/admin/users/${userByFin('6NS35AA').userId}`).set(auth(t));
    const json = JSON.stringify(detail.body.data);
    expect(json).not.toMatch(/Penisilin|hipertenziya|Təzyiq səhərlər|Qan analizi/i);
    expect(detail.body.data.stats.find((s: { label: string }) => s.label.includes('sənəd')).value).toBeGreaterThan(0);
  });

  it('bloklama: səbəb məcburi (EF-902-6), sessiyalar bağlanır, giriş dayanır; blokdan çıxarma', async () => {
    const t = await sa();
    const nigar = userByFin('6NS35AA');
    const pt = await tokenFor(PHONES.patient);
    expect((await api().patch(`/v1/admin/users/${nigar.userId}/status`).set(auth(t)).send({ status: 'BLOCKED', reason: '' })).status).toBe(400);
    const res = await api().patch(`/v1/admin/users/${nigar.userId}/status`).set(auth(t)).send({ status: 'BLOCKED', reason: 'Saxta rəylər yazır' });
    expect(res.body.data.status).toBe('BLOCKED');
    expect((await api().get('/v1/auth/me').set(auth(pt))).status).toBe(401); // BR-902-08
    expect((await api().post('/v1/auth/login').send({ mobileNumber: nigar.mobileNumber, userPin: '2580' })).body.errorType).toBe('AccountBlocked');
    expect(db.notifications.some((n) => n.userId === nigar.userId && n.notificationType === 'ACCOUNT_STATUS_CHANGED')).toBe(true);
    await api().patch(`/v1/admin/users/${nigar.userId}/status`).set(auth(t)).send({ status: 'VERIFIED', reason: 'Yoxlama bitdi' }).expect(200);
    expect((await api().post('/v1/auth/login').send({ mobileNumber: nigar.mobileNumber, userPin: '2580' })).status).toBe(200);
  });

  it('öz hesabı (EF-902-4), aktiv randevulu həkim (EF-902-1), yeganə klinika admini (EF-902-2)', async () => {
    const t = await sa();
    const me = db.users.find((u) => u.mobileNumber === PHONES.superAdmin)!;
    expect((await api().patch(`/v1/admin/users/${me.userId}/status`).set(auth(t)).send({ status: 'BLOCKED', reason: 'test test' })).body.errorType).toBe('CannotModifySelf');
    const aygun = userByFin('3KL88MN');
    expect((await api().patch(`/v1/admin/users/${aygun.userId}/status`).set(auth(t)).send({ status: 'BLOCKED', reason: 'Şikayət' })).body.errorType).toBe('HasActiveAppointments');
    const elnur = db.users.find((u) => u.mobileNumber === PHONES.clinicAdmin)!;
    const sole = await api().patch(`/v1/admin/users/${elnur.userId}/status`).set(auth(t)).send({ status: 'BLOCKED', reason: 'Yoxlama' });
    expect(sole.status).toBe(409);
    expect(sole.body.message).toMatch(/başqa administratoru yoxdur/);
    expect((await api().patch(`/v1/admin/users/${elnur.userId}/status`).set(auth(t)).send({ status: 'BLOCKED', reason: 'Yoxlama', confirm: true })).body.data.status).toBe('BLOCKED');
  });

  it('sessiyaların bağlanması (alt 5) və anonimləşdirmə (alt 4): tibbi qeydlər qalır (BR-902-05)', async () => {
    const t = await sa();
    const nigar = userByFin('6NS35AA');
    const pt = await tokenFor(PHONES.patient);
    await api().delete(`/v1/admin/users/${nigar.userId}/sessions`).set(auth(t)).send({ reason: 'Şübhəli giriş' }).expect(200);
    expect((await api().get('/v1/auth/me').set(auth(pt))).status).toBe(401);
    const patientId = db.patients.find((p) => p.userId === nigar.userId)!.patientId;
    const docs = db.medical_documents.filter((d) => d.patientId === patientId).length;
    expect((await api().delete(`/v1/admin/users/${nigar.userId}`).set(auth(t)).send({ reason: 'Pasientin tələbi' })).body.errorType).toBe('HasActiveAppointments');
    const res = await api().delete(`/v1/admin/users/${nigar.userId}`).set(auth(t)).send({ reason: 'Pasientin tələbi', conflictResolution: 'CANCEL_AND_NOTIFY' });
    expect(res.body.data).toMatchObject({ status: 'DELETED', fullName: 'Silinmiş istifadəçi' });
    expect(db.medical_documents.filter((d) => d.patientId === patientId).length).toBe(docs);
    const log = db.audit_logs.find((l) => l.action === 'ANONYMIZE_USER')!;
    expect(JSON.stringify(log)).not.toContain('Nigar');
  });

  it('klinika admini və pasient /admin-ə daxil ola bilmir', async () => {
    for (const phone of [PHONES.clinicAdmin, PHONES.patient, PHONES.doctor]) {
      const t = await tokenFor(phone);
      expect((await api().get('/v1/admin/users').set(auth(t))).status).toBe(403);
    }
  });
});

describe('UC-904 parametrlər, kataloqlar, audit', () => {
  it('parametr diapazonu (EF-904-1), kritik təsdiq (EF-904-2), dərhal tətbiq və tarixçə', async () => {
    const t = await sa();
    expect((await api().patch('/v1/admin/settings/no_show_limit').set(auth(t)).send({ value: -1 })).status).toBe(400);
    await api().patch('/v1/admin/settings/no_show_limit').set(auth(t)).send({ value: 5 }).expect(200);
    const crit = await api().patch('/v1/admin/settings/max_login_attempts').set(auth(t)).send({ value: 3, reason: 'Hücum dalğası' });
    expect(crit.body.details.requiresConfirmation).toBe(true);
    expect((await api().patch('/v1/admin/settings/max_login_attempts').set(auth(t)).send({ value: 3, confirm: true })).body.errorType).toBe('ReasonRequired');
    await api().patch('/v1/admin/settings/max_login_attempts').set(auth(t)).send({ value: 3, confirm: true, reason: 'Hücum dalğası' }).expect(200);
    // Dərhal tətbiq: 3 yanlış PIN → blok.
    for (let i = 0; i < 3; i++) await api().post('/v1/auth/login').send({ mobileNumber: '+994500000022', userPin: '0000' });
    expect((await api().post('/v1/auth/login').send({ mobileNumber: '+994500000022', userPin: '2580' })).body.errorType).toBe('AccountLocked');
    const hist = await api().get('/v1/admin/settings/max_login_attempts/history').set(auth(t));
    expect(hist.body.data[0]).toMatchObject({ from: '5', to: 3, reason: 'Hücum dalğası' });
  });

  it('kataloq: istifadə olunan ixtisas/xidmət silinmir (EF-904-3); yeni element; xidmət tələbinin təsdiqi', async () => {
    const t = await sa();
    const card = db.specialties.find((s) => s.nameAz === 'Kardioloq')!;
    const del = await api().delete(`/v1/admin/specialties/${card.specialtyId}`).set(auth(t));
    expect(del.status).toBe(409);
    expect(del.body.details.usage).toContain('Mərkəzi Klinika');
    const add = await api().post('/v1/admin/specialties').set(auth(t)).send({ nameAz: 'Revmatoloq', nameRu: 'Ревматолог', nameEn: 'Rheumatologist' });
    const newId = add.body.data.find((s: { nameAz: string }) => s.nameAz === 'Revmatoloq').id;
    await api().delete(`/v1/admin/specialties/${newId}`).set(auth(t)).expect(200);
    // Klinika tələbi → təsdiq → kataloqda.
    const ca = await tokenFor(PHONES.clinicAdmin);
    await api().post('/v1/clinic-admin/service-requests').set(auth(ca)).send({ name: 'Akupunktura', category: 'prosedur' }).expect(201);
    const reqs = await api().get('/v1/admin/service-requests').set(auth(t));
    await api().patch(`/v1/admin/service-requests/${reqs.body.data[0].requestId}`).set(auth(t)).send({ decision: 'APPROVE' }).expect(200);
    expect(db.services.some((s) => s.nameAz === 'Akupunktura')).toBe(true);
  });

  it('dərman kataloqu: nəzarətdə olan işarəsi və qarşılıqlı təsir resept yoxlamasını qidalandırır', async () => {
    const t = await sa();
    const panadol = db.drugs.find((d) => d.tradeName === 'Panadol')!;
    await api().patch(`/v1/admin/drugs/${panadol.drugId}`).set(auth(t)).send({ tradeName: 'Panadol', isControlled: true }).expect(200);
    expect(panadol.isControlled).toBe(true);
    const nurofen = db.drugs.find((d) => d.tradeName === 'Nurofen')!;
    const add = await api().post('/v1/admin/drug-interactions').set(auth(t)).send({ drugId1: panadol.drugId, drugId2: nurofen.drugId, severity: 'MINOR', description: 'Test qarşılıqlı təsiri' });
    expect(add.status).toBe(201);
    expect((await api().post('/v1/admin/drug-interactions').set(auth(t)).send({ drugId1: nurofen.drugId, drugId2: panadol.drugId, severity: 'MINOR', description: 'Təkrar cüt' })).status).toBe(409);
  });

  it('bildiriş şablonu: yalnız icazəli dəyişənlər; dəyişiklik göndərilən mətnə tətbiq olunur', async () => {
    const t = await sa();
    const tpl = db.notification_templates.find((x) => x.notificationType === 'ACCOUNT_STATUS_CHANGED' && x.languageCode === 'az' && x.channel === 'IN_APP')!;
    expect((await api().patch(`/v1/admin/notification-templates/${tpl.templateId}`).set(auth(t)).send({ titleTemplate: 'X', bodyTemplate: 'Diaqnoz: {diagnosis}' })).status).toBe(400);
    await api().patch(`/v1/admin/notification-templates/${tpl.templateId}`).set(auth(t)).send({ titleTemplate: 'Hesab', bodyTemplate: 'Yeni status: {status}!' }).expect(200);
    const nigar = userByFin('6NS35AA');
    await api().patch(`/v1/admin/users/${nigar.userId}/status`).set(auth(t)).send({ status: 'BLOCKED', reason: 'Test bloku' });
    expect(db.notifications.some((n) => n.userId === nigar.userId && n.body === 'Yeni status: bloklanıb!')).toBe(true);
  });

  it('audit: filtr, export, dəyişdirmək mümkün deyil (BR-904-04, EF-904-4); statistika', async () => {
    const t = await sa();
    await api().patch('/v1/admin/settings/no_show_limit').set(auth(t)).send({ value: 4 });
    const res = await api().get('/v1/admin/audit-logs').set(auth(t)).query({ action: 'UPDATE_SETTING' });
    expect(res.body.data.rows[0]).toMatchObject({ action: 'UPDATE_SETTING', actorRole: 'SUPER_ADMIN', changedFields: ['no_show_limit'] });
    const csv = await api().get('/v1/admin/audit-logs/export').set(auth(t)).query({ action: 'UPDATE_SETTING' }).buffer(true);
    expect(csv.text).toContain('UPDATE_SETTING');
    const n = db.audit_logs.length;
    expect((await api().delete(`/v1/admin/audit-logs/${res.body.data.rows[0].auditId}`).set(auth(t))).status).toBe(405);
    expect((await api().patch(`/v1/admin/audit-logs/${res.body.data.rows[0].auditId}`).set(auth(t)).send({ reason: 'x' })).status).toBe(405);
    expect(db.audit_logs.length).toBeGreaterThanOrEqual(n);
    expect(db.security_events.some((e) => e.description.includes('Audit jurnalını dəyişdirmə'))).toBe(true);
    const stats = await api().get('/v1/admin/stats').set(auth(t));
    expect(stats.body.data.users.PATIENT).toBeGreaterThan(0);
    expect(stats.body.data.pending.clinicsToVerify).toBe(1);
    expect(stats.body.data.daily).toHaveLength(30);
    const sec = await api().get('/v1/admin/security-events').set(auth(t));
    expect(sec.body.data.totalCount).toBeGreaterThan(0);
  });

  it('klinika lisenziyası xəbərdarlığı bir dəfə (FR-901-D)', () => {
    const m = clinicByName('Mərkəzi Klinika');
    m.licenseExpiryDate = addDaysToDate(bakuDate(), 30);
    runJobs();
    runJobs();
    expect(db.audit_logs.filter((l) => l.action === 'CLINIC_LICENSE_WARNING_SENT' && l.entityId === m.clinicId)).toHaveLength(1);
    void clock;
  });
});
