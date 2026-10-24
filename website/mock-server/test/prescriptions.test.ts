import { describe, expect, it } from 'vitest';
import { addDays, clock } from '../src/core/clock';
import { faults } from '../src/integrations/faults';
import { runJobs } from '../src/jobs/scheduler';
import { db } from '../src/store/db';
import { api, PHONES, tokenFor } from './helpers';

const auth = (t: string) => ({ Authorization: `Bearer ${t}` });
const userIdOfFin = (fin: string) => db.users.find((u) => u.fin === fin)!.userId;
const doctorIdOf = (fin: string) => db.doctors.find((d) => d.userId === userIdOfFin(fin))!.doctorId;
const nigarPatientId = () => db.patients.find((p) => p.userId === userIdOfFin('6NS35AA'))!.patientId;
const drug = (tradeName: string) => db.drugs.find((d) => d.tradeName === tradeName)!.drugId;
type Med = { drugId: string | null; drugNameManual: string | null; dosage: string; frequency: string; durationDays: number | null; instructions: string | null };
const med = (tradeName: string): Med => ({ drugId: drug(tradeName), drugNameManual: null, dosage: '1 tablet', frequency: 'gündə 2 dəfə', durationDays: 7, instructions: null });

async function tokenForFin(fin: string) {
  const res = await api().post('/__dev/login-as').send({ userId: userIdOfFin(fin) });
  return res.body.data.token as string;
}

/** Nigarın sabahkı Dr. Aygün randevusu (CONFIRMED, seed ssenarisi 1). */
const nigarAygunUpcoming = () =>
  db.appointments.find(
    (a) => a.patientId === nigarPatientId() && a.status === 'CONFIRMED' && db.doctor_clinics.find((x) => x.doctorClinicId === a.doctorClinicId)!.doctorId === doctorIdOf('3KL88MN'),
  )!;

async function draftFor(t: string, medications: Med[], diagnosis = 'Kəskin respirator infeksiya') {
  const created = await api().post('/v1/prescriptions').set(auth(t)).send({ appointmentId: nigarAygunUpcoming().appointmentId });
  expect(created.status).toBe(201);
  const id = created.body.data.prescriptionId as string;
  const patched = await api().patch(`/v1/prescriptions/${id}`).set(auth(t)).send({ diagnosis, icd10Code: 'j06.9', medications });
  expect(patched.status).toBe(200);
  return id;
}

const sign = (t: string, id: string, body: Record<string, unknown> = {}) => api().post(`/v1/prescriptions/${id}/sign`).set(auth(t)).send({ confirmationPin: '2580', ...body });

describe('UC-602 seed reseptləri', () => {
  it('pasient aktiv/keçmiş/ləğv qruplarını görür, imza doğrulanır, draft görünmür', async () => {
    const t = await tokenFor(PHONES.patient);
    const res = await api().get('/v1/prescriptions?tab=ACTIVE').set(auth(t));
    expect(res.body.data.counts).toMatchObject({ ACTIVE: 1, PAST: 1, CANCELLED: 1, DRAFT: 0 });
    const id = res.body.data.prescriptions[0].prescriptionId;
    const detail = await api().get(`/v1/prescriptions/${id}`).set(auth(t));
    expect(detail.body.data).toMatchObject({ status: 'SIGNED', signatureValid: true, icd10Code: 'I10' });
    expect(detail.body.data.prescriptionNumber).toMatch(/^RX-\d{4}-\d{6}$/);
    expect(detail.body.data.allowedActions).toContain('REQUEST_RENEWAL');
    const cancelled = (await api().get('/v1/prescriptions?tab=CANCELLED').set(auth(t))).body.data.prescriptions[0];
    const c = await api().get(`/v1/prescriptions/${cancelled.prescriptionId}`).set(auth(t));
    expect(c.body.data.cancelledReason).toMatch(/Doza/);
  });
});

describe('UC-601 resept yazma', () => {
  it('kontekst: allergiya, xroniki xəstəlik, aktiv dərmanlar, şablon; pasient qaralamanı görmür', async () => {
    const d = await tokenFor(PHONES.doctor);
    const id = await draftFor(d, [med('Panadol')]);
    const ctx = await api().get(`/v1/prescriptions/${id}/context`).set(auth(d));
    expect(ctx.body.data.allergies[0]).toMatchObject({ allergenName: 'Penisilin', severity: 'SEVERE' });
    expect(ctx.body.data.activeMedications.map((m: { name: string }) => m.name)).toEqual(expect.arrayContaining(['Lizinopril 10 mq', 'Norvask 5 mq', 'Atoris 20 mq']));
    expect(ctx.body.data.templates).toHaveLength(1);
    expect(ctx.body.data.patient.fin).toBe('6NS35AA');
    const p = await tokenFor(PHONES.patient);
    expect((await api().get(`/v1/prescriptions/${id}`).set(auth(p))).status).toBe(404);
    const appt = await api().get(`/v1/appointments/${nigarAygunUpcoming().appointmentId}`).set(auth(p));
    expect(appt.body.data.prescriptions).toHaveLength(0);
  });

  it('allergiya konflikti səbəbsiz imzalanmır; səbəblə imzalanır, audit + bildiriş (EF-601-3, BR-601-09)', async () => {
    const d = await tokenFor(PHONES.doctor);
    const id = await draftFor(d, [med('Amoksiklav')]);
    const check = await api().post(`/v1/prescriptions/${id}/check`).set(auth(d));
    expect(check.body.data.warnings[0]).toMatchObject({ type: 'ALLERGY', severity: 'SEVERE', requiresOverride: true });
    const blocked = await sign(d, id);
    expect(blocked.body.errorType).toBe('AllergyConflict');
    expect(blocked.body.details.warnings).toHaveLength(1);
    const ok = await sign(d, id, { overrides: [{ medicationIndex: 0, reason: 'Allergiya testi mənfi çıxıb, nəzarət altında' }] });
    expect(ok.status).toBe(200);
    expect(ok.body.data).toMatchObject({ status: 'SIGNED', signatureValid: true });
    expect(ok.body.data.medications[0]).toMatchObject({ warningOverridden: true });
    expect(db.audit_logs.some((a) => a.action === 'PRESCRIPTION_WARNING_OVERRIDDEN' && a.reason?.includes('Allergiya'))).toBe(true);
    expect(db.notifications.some((n) => n.notificationType === 'PRESCRIPTION_CREATED')).toBe(true);
    // BR-601-04: imzalanmış resept redaktə olunmur.
    expect((await api().patch(`/v1/prescriptions/${id}`).set(auth(d)).send({ diagnosis: 'dəyiş' })).body.errorType).toBe('PrescriptionNotEditable');
  });

  it('ağır qarşılıqlı təsir səbəb tələb edir, orta yalnız xəbərdarlıqdır (EF-601-4)', async () => {
    const d = await tokenFor(PHONES.doctor);
    const severe = await draftFor(d, [med('Varfarin'), med('Aspirin Kardio')]);
    expect((await sign(d, severe)).body.errorType).toBe('DrugInteraction');
    const moderate = await draftFor(d, [med('Nurofen')]);
    const w = (await api().post(`/v1/prescriptions/${moderate}/check`).set(auth(d))).body.data.warnings;
    expect(w[0]).toMatchObject({ type: 'INTERACTION', severity: 'MODERATE', requiresOverride: false });
    expect(w[0].message).toMatch(/Lizinopril/);
    expect((await sign(d, moderate)).status).toBe(200);
  });

  it('nəzarətdə olan dərman əsaslandırma tələb edir (EF-601-8), əl ilə dərman xəbərdarlıq verir', async () => {
    const d = await tokenFor(PHONES.doctor);
    const id = await draftFor(d, [med('Tramadol'), { drugId: null, drugNameManual: 'Xüsusi məlhəm', dosage: 'nazik qat', frequency: 'gündə 2 dəfə', durationDays: null, instructions: null }]);
    const w = (await api().post(`/v1/prescriptions/${id}/check`).set(auth(d))).body.data.warnings.map((x: { type: string }) => x.type);
    expect(w).toEqual(expect.arrayContaining(['CONTROLLED', 'MANUAL_DRUG']));
    expect((await sign(d, id)).body.errorType).toBe('ControlledDrugJustificationRequired');
    const ok = await sign(d, id, { controlledJustification: 'Əməliyyatdan sonrakı kəskin ağrı, 3 günlük kurs' });
    expect(ok.body.data.status).toBe('SIGNED');
  });

  it('məcburi sahələr boşdursa imza yoxdur (EF-601-5), PIN yanlışdırsa 401', async () => {
    const d = await tokenFor(PHONES.doctor);
    const id = await draftFor(d, [{ ...med('Panadol'), dosage: '' }], '');
    const res = await sign(d, id);
    expect(res.status).toBe(400);
    expect(res.body.details.fields).toHaveProperty('diagnosis');
    expect(res.body.details.fields).toHaveProperty('medications.0.dosage');
    await api().patch(`/v1/prescriptions/${id}`).set(auth(d)).send({ diagnosis: 'Baş ağrısı', medications: [med('Panadol')] });
    expect((await sign(d, id, { confirmationPin: '1111' })).body.errorType).toBe('InvalidPin');
  });

  it('imza servisi xətası → qaralama qalır, pasientə heç nə getmir (EF-601-6)', async () => {
    const d = await tokenFor(PHONES.doctor);
    const id = await draftFor(d, [med('Panadol')]);
    faults.set('signature', 'down');
    const before = db.notifications.length;
    const res = await sign(d, id);
    expect(res.status).toBe(503);
    expect(res.body.details.savedAsDraft).toBe(true);
    expect(db.prescriptions.find((p) => p.prescriptionId === id)!.status).toBe('DRAFT');
    expect(db.notifications.length).toBe(before);
    faults.reset();
    expect((await sign(d, id)).body.data.status).toBe('SIGNED');
  });

  it('lisenziya bitib → LicenseInvalid (EF-601-1); sertifikat bitib → SignatureCertificateInvalid (EF-601-2)', async () => {
    const d = await tokenFor(PHONES.doctor);
    const aygun = db.doctors.find((x) => x.doctorId === doctorIdOf('3KL88MN'))!;
    const real = aygun.licenseExpiryDate;
    aygun.licenseExpiryDate = '2020-01-01';
    expect((await api().post('/v1/prescriptions').set(auth(d)).send({ appointmentId: nigarAygunUpcoming().appointmentId })).body.errorType).toBe('LicenseInvalid');
    aygun.licenseExpiryDate = real;
    const id = await draftFor(d, [med('Panadol')]);
    aygun.signatureCertExpiry = '2020-01-01';
    expect((await sign(d, id)).body.errorType).toBe('SignatureCertificateInvalid');
  });

  it('randevusu olmayan / PENDING randevu / başqasının randevusu (EF-601-7, BR-601-02)', async () => {
    const resad = await tokenForFin('7RH21KL');
    const pending = db.appointments.find((a) => a.status === 'PENDING' && db.doctor_clinics.find((x) => x.doctorClinicId === a.doctorClinicId)!.doctorId === doctorIdOf('7RH21KL'))!;
    expect((await api().post('/v1/prescriptions').set(auth(resad)).send({ appointmentId: pending.appointmentId })).status).toBe(422);
    const res = await api().post('/v1/prescriptions').set(auth(resad)).send({ appointmentId: nigarAygunUpcoming().appointmentId });
    expect(res.status).toBe(404);
    expect(db.security_events.some((e) => e.eventType === 'UNAUTHORIZED_ACCESS')).toBe(true);
  });

  it('şablondan və əvvəlki reseptdən doldurma (alt 1, alt 2)', async () => {
    const d = await tokenFor(PHONES.doctor);
    const tpl = (await api().get('/v1/doctor/prescription-templates').set(auth(d))).body.data[0];
    const fromTpl = await api().post('/v1/prescriptions').set(auth(d)).send({ appointmentId: nigarAygunUpcoming().appointmentId, templateId: tpl.templateId });
    expect(fromTpl.body.data.medications.map((m: { name: string }) => m.name)).toEqual(['Lizinopril 10 mq', 'Norvask 5 mq']);
    const prev = db.prescriptions.find((p) => p.status === 'SIGNED' && p.doctorId === doctorIdOf('3KL88MN'))!;
    const copy = await api().post('/v1/prescriptions').set(auth(d)).send({ appointmentId: nigarAygunUpcoming().appointmentId, copyFromPrescriptionId: prev.prescriptionId });
    expect(copy.body.data).toMatchObject({ status: 'DRAFT', diagnosis: prev.diagnosis });
    expect(copy.body.data.medications).toHaveLength(2);
  });
});

describe('Məxfilik, ləğv, müddət, doğrulama', () => {
  it('klinika admini və super admin resept görmür (BR-600-04); başqa pasient 404 + security event', async () => {
    const id = db.prescriptions.find((p) => p.status === 'SIGNED')!.prescriptionId;
    for (const phone of [PHONES.clinicAdmin, PHONES.superAdmin]) {
      const t = await tokenFor(phone);
      expect((await api().get(`/v1/prescriptions/${id}`).set(auth(t))).status).toBe(403);
    }
    const orxan = await tokenFor('+994500000021');
    expect((await api().get(`/v1/prescriptions/${id}`).set(auth(orxan))).status).toBe(404);
    expect(db.security_events.some((e) => e.description.includes(id))).toBe(true);
    // Klinika admininin randevu detalında resept siyahısı boşdur.
    const admin = await tokenFor(PHONES.clinicAdmin);
    const p = db.prescriptions.find((x) => x.prescriptionId === id)!;
    const appt = await api().get(`/v1/appointments/${p.appointmentId}`).set(auth(admin));
    if (appt.status === 200) expect(appt.body.data.prescriptions).toEqual([]);
  });

  it('ləğv: status CANCELLED, qeyd qalır, pasientə bildiriş (alt 6)', async () => {
    const d = await tokenFor(PHONES.doctor);
    const id = await draftFor(d, [med('Panadol')]);
    await sign(d, id);
    const res = await api().patch(`/v1/prescriptions/${id}/cancel`).set(auth(d)).send({ reason: 'Səhv pasient seçilib' });
    expect(res.body.data).toMatchObject({ status: 'CANCELLED', cancelledReason: 'Səhv pasient seçilib' });
    expect(db.prescriptions.some((p) => p.prescriptionId === id)).toBe(true);
    expect(db.notifications.some((n) => n.notificationType === 'PRESCRIPTION_CANCELLED')).toBe(true);
    expect((await api().patch(`/v1/prescriptions/${id}/cancel`).set(auth(d)).send({ reason: 'yenə ləğv' })).status).toBe(422);
  });

  it('etibarlılıq bitəndə job EXPIRED edir (BR-602-04); doğrulama tibbi detal qaytarmır', async () => {
    const active = db.prescriptions.find((p) => p.status === 'SIGNED')!;
    const v = await api().get(`/v1/prescriptions/verify/${active.qrCodeToken}`);
    expect(v.status).toBe(200);
    expect(v.body.data).toMatchObject({ valid: true, status: 'SIGNED', patientInitials: 'N. S.' });
    expect(JSON.stringify(v.body.data)).not.toMatch(/hipertenziya|Norvask/i);
    clock.set(addDays(clock.now(), 70));
    runJobs();
    expect(active.status).toBe('EXPIRED');
    expect((await api().get(`/v1/prescriptions/verify/${active.qrCodeToken}`)).body.data.valid).toBe(false);
  });

  it('PDF yüklənir; imzasız resept üçün PDF yoxdur', async () => {
    const p = await tokenFor(PHONES.patient);
    const id = db.prescriptions.find((x) => x.status === 'SIGNED')!.prescriptionId;
    const res = await api().get(`/v1/prescriptions/${id}/pdf`).set(auth(p));
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('application/pdf');
    const d = await tokenFor(PHONES.doctor);
    const draft = await draftFor(d, [med('Panadol')]);
    expect((await api().get(`/v1/prescriptions/${draft}/pdf`).set(auth(d))).body.errorType).toBe('PrescriptionNotSigned');
  });
});

describe('Təkrar resept sorğusu (UC-602 alt 2)', () => {
  it('pasient sorğu göndərir, təkrar sorğu 409; həkim təsdiqləyir → yeni qaralama', async () => {
    const p = await tokenFor(PHONES.patient);
    const id = db.prescriptions.find((x) => x.status === 'SIGNED' && x.doctorId === doctorIdOf('3KL88MN'))!.prescriptionId;
    expect((await api().post(`/v1/prescriptions/${id}/renewal-requests`).set(auth(p)).send({ note: 'Dərman bitir' })).status).toBe(201);
    expect((await api().post(`/v1/prescriptions/${id}/renewal-requests`).set(auth(p)).send({})).status).toBe(409);
    expect(db.notifications.some((n) => n.notificationType === 'PRESCRIPTION_RENEWAL_REQUESTED')).toBe(true);
    const d = await tokenFor(PHONES.doctor);
    const list = await api().get('/v1/renewal-requests?status=PENDING').set(auth(d));
    expect(list.body.data[0]).toMatchObject({ note: 'Dərman bitir', patientName: 'Nigar Səlimova' });
    const res = await api().patch(`/v1/renewal-requests/${list.body.data[0].requestId}`).set(auth(d)).send({ decision: 'APPROVE' });
    expect(res.body.data.status).toBe('APPROVED');
    const draft = db.prescriptions.find((x) => x.prescriptionId === res.body.data.newPrescriptionId)!;
    expect(draft.status).toBe('DRAFT'); // BR-602-07: yalnız həkim imzalayanda etibarlıdır
  });

  it('rədd səbəbsiz olmur; rədd pasientə səbəblə bildirilir', async () => {
    const p = await tokenFor(PHONES.patient);
    const id = db.prescriptions.find((x) => x.status === 'SIGNED')!.prescriptionId;
    await api().post(`/v1/prescriptions/${id}/renewal-requests`).set(auth(p)).send({});
    const d = await tokenFor(PHONES.doctor);
    const rid = (await api().get('/v1/renewal-requests').set(auth(d))).body.data[0].requestId;
    expect((await api().patch(`/v1/renewal-requests/${rid}`).set(auth(d)).send({ decision: 'REJECT' })).status).toBe(400);
    const res = await api().patch(`/v1/renewal-requests/${rid}`).set(auth(d)).send({ decision: 'REJECT', reason: 'Əvvəlcə qəbula gəlin' });
    expect(res.body.data).toMatchObject({ status: 'REJECTED', reason: 'Əvvəlcə qəbula gəlin' });
    expect(db.notifications.some((n) => n.notificationType === 'PRESCRIPTION_RENEWAL_REJECTED')).toBe(true);
  });
});
