import { describe, expect, it } from 'vitest';
import { clock } from '../src/core/clock';
import { rawBlob } from '../src/integrations/storage';
import { faults } from '../src/integrations/faults';
import { runJobs } from '../src/jobs/scheduler';
import { db } from '../src/store/db';
import { makePdf } from '../src/store/seed-data/files';
import { api, PHONES, tokenFor } from './helpers';

const auth = (t: string) => ({ Authorization: `Bearer ${t}` });
const pdf = makePdf('Test analiz', ['Hemoqlobin 130']);
const nigarId = () => db.patients.find((p) => p.userId === db.users.find((u) => u.mobileNumber === PHONES.patient)!.userId)!.patientId;
const doc = (name: string) => db.medical_documents.find((d) => d.fileName === name)!;
const doctorId = (fin: string) => db.doctors.find((d) => d.userId === db.users.find((u) => u.fin === fin)!.userId)!.doctorId;

async function upload(t: string, buf: Buffer, name: string, category = 'LAB_RESULT') {
  return api().post('/v1/documents').set(auth(t)).field('category', category).field('documentDate', '2026-10-01').field('description', 'test').attach('file', buf, name);
}

describe('UC-501 yükləmə', () => {
  it('PDF yüklənir, AES-256 ilə şifrələnir, audit yazılır', async () => {
    const t = await tokenFor(PHONES.patient);
    const res = await upload(t, pdf, 'analiz.pdf');
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ category: 'LAB_RESULT', mimeType: 'application/pdf', fileName: 'analiz.pdf' });
    const row = db.medical_documents.find((d) => d.documentId === res.body.data.documentId)!;
    expect(row.encryptionKeyId).toMatch(/^key_/);
    const blob = rawBlob(row.storagePath)!;
    expect(blob.includes(Buffer.from('%PDF'))).toBe(false); // diskdə açıq mətn yoxdur
    expect(db.audit_logs.some((a) => a.action === 'UPLOAD_DOCUMENT')).toBe(true);
  });

  it('format məzmuna görə yoxlanılır: .pdf adlı mətn faylı rədd edilir (EF-501-1)', async () => {
    const t = await tokenFor(PHONES.patient);
    const res = await upload(t, Buffer.from('salam dünya'), 'saxta.pdf');
    expect(res.status).toBe(415);
  });

  it('10 MB-dan böyük fayl 413 (EF-501-2)', async () => {
    const t = await tokenFor(PHONES.patient);
    const big = Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.alloc(10 * 1024 * 1024 + 10)]);
    expect((await upload(t, big, 'boyuk.pdf')).status).toBe(413);
  });

  it('zərərli fayl rədd edilir və security log-a yazılır (EF-501-3)', async () => {
    const t = await tokenFor(PHONES.patient);
    const res = await upload(t, Buffer.concat([pdf, Buffer.from('EICAR-STANDARD-ANTIVIRUS-TEST-FILE')]), 'x.pdf');
    expect(res.body.errorType).toBe('MalwareDetected');
    expect(db.security_events.some((e) => e.eventType === 'MALWARE_DETECTED')).toBe(true);
  });

  it('storage əlçatmaz → 503 (EF-501-5); razılıq yoxdursa → ConsentRequired (EF-501-6)', async () => {
    const t = await tokenFor(PHONES.patient);
    faults.set('storage', 'down');
    expect((await upload(t, pdf, 'a.pdf')).status).toBe(503);
    faults.reset();
    await api().put('/v1/profile/consent').set(auth(t)).send({ medicalConsent: false });
    expect((await upload(t, pdf, 'a.pdf')).body.errorType).toBe('ConsentRequired');
  });

  it('siyahı kateqoriya üzrə, arxiv ayrıca; silinən 30 gün bərpa oluna bilir, sonra tam silinir', async () => {
    const t = await tokenFor(PHONES.patient);
    const list = await api().get('/v1/documents').set(auth(t)).query({ archived: 'false' });
    expect(list.body.data.map((d: { fileName: string }) => d.fileName)).not.toContain('Epikriz 2024.pdf');
    const id = doc('Exokardioqrafiya protokolu.pdf').documentId;
    await api().delete(`/v1/documents/${id}`).set(auth(t)).expect(200);
    expect((await api().get('/v1/documents').set(auth(t)).query({ deleted: 'true' })).body.data).toHaveLength(1);
    await api().post(`/v1/documents/${id}/restore`).set(auth(t)).expect(200);
    await api().delete(`/v1/documents/${id}`).set(auth(t)).expect(200);
    clock.advanceMinutes(31 * 24 * 60);
    runJobs('purgeDeletedDocuments');
    expect(db.medical_documents.some((d) => d.documentId === id)).toBe(false);
  });

  it('başqa pasientin sənədi görünmür', async () => {
    const other = await tokenFor('+994500000022');
    expect((await api().get(`/v1/documents/${doc('Qan analizi.pdf').documentId}/view`).set(auth(other))).status).toBe(404);
  });
});

describe('UC-502 paylaşım', () => {
  it('yalnız randevusu olan həkimlər (EF-502-1); paylaşım + bildiriş; təkrar → mövcud icazə (EF-502-2)', async () => {
    const t = await tokenFor(PHONES.patient);
    const id = doc('Exokardioqrafiya protokolu.pdf').documentId;
    const el = await api().get(`/v1/documents/${id}/eligible-doctors`).set(auth(t));
    const names = el.body.data.map((d: { fullName: string }) => d.fullName);
    expect(names).toEqual(expect.arrayContaining(['Dr. Aygün Məmmədova', 'Dr. Leyla Əliyeva']));
    expect(names).not.toContain('Dr. Kamran Quliyev');
    const r = await api().post(`/v1/documents/${id}/grants`).set(auth(t)).send({ doctorId: doctorId('8LE33AB'), accessDuration: 'SEVEN_DAYS' });
    expect(r.status).toBe(201);
    expect(db.notifications.some((n) => n.notificationType === 'DOCUMENT_SHARED')).toBe(true);
    const again = await api().post(`/v1/documents/${id}/grants`).set(auth(t)).send({ doctorId: doctorId('8LE33AB'), accessDuration: 'THIRTY_DAYS' });
    expect(again.body.errorType).toBe('GrantAlreadyExists');
    expect(again.body.details.grant.grantId).toBe(r.body.data.grantId);
    const notEligible = await api().post(`/v1/documents/${id}/grants`).set(auth(t)).send({ doctorId: doctorId('9XY44ZW'), accessDuration: 'SEVEN_DAYS' });
    expect(notEligible.body.errorType).toBe('NoAppointmentWithDoctor');
  });

  it('randevu ilə əlavə olunan sənəd üçün avtomatik icazə (FR-401-24)', () => {
    const g = db.document_access_grants.find((x) => x.documentId === doc('EKQ nəticəsi.png').documentId)!;
    expect(g).toMatchObject({ accessDuration: 'APPOINTMENT_PERIOD', status: 'ACTIVE', doctorId: doctorId('3KL88MN') });
    expect(g.appointmentId).not.toBeNull();
  });
});

describe('UC-503 həkimin baxışı', () => {
  it('aktiv icazə ilə baxış: signed URL birdəfəlikdir, baxış log-a yazılır və sayılır', async () => {
    const d = await tokenFor(PHONES.doctor);
    const id = doc('Qan analizi.pdf').documentId;
    const v = await api().get(`/v1/documents/${id}/view`).set(auth(d));
    expect(v.body.data).toMatchObject({ downloadAllowed: false, mimeType: 'application/pdf' });
    const file = await api().get(v.body.data.url);
    expect(file.status).toBe(200);
    expect(file.headers['content-disposition']).toMatch(/^inline/);
    expect(Buffer.from(file.body).subarray(0, 4).toString()).toBe('%PDF');
    expect((await api().get(v.body.data.url)).status).toBe(403); // təkrar istifadə yoxdur (BR-503-05)
    const g = db.document_access_grants.find((x) => x.documentId === id)!;
    expect(g.viewCount).toBe(3);
    const pt = await tokenFor(PHONES.patient);
    const log = await api().get(`/v1/documents/${id}/access-log`).set(auth(pt));
    expect(log.body.data[0]).toMatchObject({ accessedBy: 'Dr. Aygün Məmmədova', accessType: 'VIEW' });
  });

  it('signed URL 60 saniyədən sonra etibarsızdır', async () => {
    const d = await tokenFor(PHONES.doctor);
    const v = await api().get(`/v1/documents/${doc('Qan analizi.pdf').documentId}/view`).set(auth(d));
    clock.advanceMinutes(2);
    expect((await api().get(v.body.data.url)).status).toBe(403);
  });

  it('download cəhdi bloklanır və log-a yazılır (EF-503-3)', async () => {
    const d = await tokenFor(PHONES.doctor);
    const id = doc('Qan analizi.pdf').documentId;
    const r = await api().post(`/v1/documents/${id}/download-attempt`).set(auth(d));
    expect(r.body.errorType).toBe('DownloadNotAllowed');
    expect(db.document_access_log.some((l) => l.accessType === 'DOWNLOAD_ATTEMPT')).toBe(true);
  });

  it('icazə müddəti bitəndə giriş bağlanır (EF-503-1); ləğv dərhal bağlayır (EF-503-2)', async () => {
    const id = doc('Qan analizi.pdf').documentId;
    clock.advanceMinutes(3 * 24 * 60); // seed icazəsi 2 gün sonra bitir
    runJobs('expireGrants');
    const d = await tokenFor(PHONES.doctor);
    expect((await api().get(`/v1/documents/${id}/view`).set(auth(d))).body.errorType).toBe('AccessGrantExpired');
    expect(db.document_access_log.some((l) => l.accessType === 'DENIED')).toBe(true);

    const pt = await tokenFor(PHONES.patient);
    const ecgGrant = db.document_access_grants.find((x) => x.documentId === doc('EKQ nəticəsi.png').documentId)!;
    await api().delete(`/v1/grants/${ecgGrant.grantId}`).set(auth(pt)).expect(200);
    expect((await api().get(`/v1/documents/${doc('EKQ nəticəsi.png').documentId}/view`).set(auth(d))).body.errorType).toBe('AccessGrantExpired');
  });

  it('icazəsi olmayan həkim və klinika admini görmür (FR-502-11, FR-502-19)', async () => {
    const id = doc('Exokardioqrafiya protokolu.pdf').documentId;
    const d = await tokenFor(PHONES.doctor);
    expect((await api().get(`/v1/documents/${id}/view`).set(auth(d))).status).toBe(404);
    const admin = await tokenFor(PHONES.clinicAdmin);
    expect((await api().get(`/v1/documents/${id}/view`).set(auth(admin))).status).toBe(404);
  });

  it('həkimin pasient sənədləri səhifəsi yalnız aktiv icazəliləri göstərir', async () => {
    const d = await tokenFor(PHONES.doctor);
    const r = await api().get(`/v1/doctor/patients/${nigarId()}/documents`).set(auth(d));
    expect(r.body.data.documents.map((x: { fileName: string }) => x.fileName).sort()).toEqual(['EKQ nəticəsi.png', 'Qan analizi.pdf']);
  });

  it('randevuya sonradan sənəd əlavə etmək (FR-404-15)', async () => {
    const pt = await tokenFor(PHONES.patient);
    const up = await api().get('/v1/appointments?tab=UPCOMING').set(auth(pt));
    const appt = up.body.data.appointments.find((a: { doctor: { fullName: string } }) => a.doctor.fullName === 'Dr. Rəşad Hüseynov');
    const r = await api().post(`/v1/appointments/${appt.appointmentId}/documents`).set(auth(pt)).send({ documentIds: [doc('Exokardioqrafiya protokolu.pdf').documentId] });
    expect(r.body.data.documents.map((x: { fileName: string }) => x.fileName)).toContain('Exokardioqrafiya protokolu.pdf');
  });
});

describe('UC-504 tibbi tarixçə', () => {
  it('pasient: randevu + sənədlər xronoloji; filtr işləyir', async () => {
    const pt = await tokenFor(PHONES.patient);
    const r = await api().get('/v1/medical-history').set(auth(pt));
    const types = new Set(r.body.data.events.map((e: { type: string }) => e.type));
    expect(types).toEqual(new Set(['APPOINTMENT', 'DOCUMENT', 'PRESCRIPTION'])); // BR-504-06: imzalanmış reseptlər də düşür
    const dates = r.body.data.events.map((e: { date: string }) => e.date);
    expect([...dates].sort().reverse()).toEqual(dates);
    const onlyDocs = await api().get('/v1/medical-history').set(auth(pt)).query({ type: 'DOCUMENT' });
    expect(onlyDocs.body.data.events.every((e: { type: string }) => e.type === 'DOCUMENT')).toBe(true);
    expect(r.body.data.patient.allergies).toContain('Penisilin');
  });

  it('həkim yalnız icazəli elementləri görür (BR-504-03)', async () => {
    const d = await tokenFor(PHONES.doctor);
    const r = await api().get(`/v1/doctor/patients/${nigarId()}/medical-history`).set(auth(d));
    const titles = r.body.data.events.map((e: { title: string }) => e.title);
    expect(titles).toContain('Qan analizi.pdf');
    expect(titles).not.toContain('Exokardioqrafiya protokolu.pdf');
    expect(r.body.data.events.filter((e: { type: string; doctorName: string }) => e.type === 'APPOINTMENT').every((e: { doctorName: string }) => e.doctorName === 'Dr. Aygün Məmmədova')).toBe(true);
  });
});
