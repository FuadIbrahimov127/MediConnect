import { describe, expect, it } from 'vitest';
import { clock } from '../src/core/clock';
import { runJobs } from '../src/jobs/scheduler';
import { db } from '../src/store/db';
import { api, PHONES, tokenFor } from './helpers';

const auth = (t: string) => ({ Authorization: `Bearer ${t}` });
const nigarPatientId = () => db.patients.find((p) => p.userId === db.users.find((u) => u.fin === '6NS35AA')!.userId)!.patientId;
const doctorIdOf = (fin: string) => db.doctors.find((d) => d.userId === db.users.find((u) => u.fin === fin)!.userId)!.doctorId;
/** Nigarın rəy yazılmamış tamamlanmış qəbulu (seed: Dr. Leyla). */
const unreviewed = () => db.appointments.find((a) => a.patientId === nigarPatientId() && a.status === 'COMPLETED' && !db.reviews.some((r) => r.appointmentId === a.appointmentId))!;
const body = (over: Record<string, unknown> = {}) => ({ overallRating: 5, professionalismRating: 5, attitudeRating: 4, waitingTimeRating: 3, comment: 'Diqqətli və peşəkar həkimdir.', isAnonymous: false, ...over });

async function submit(over: Record<string, unknown> = {}) {
  const p = await tokenFor(PHONES.patient);
  const a = unreviewed();
  const res = await api().post('/v1/reviews').set(auth(p)).send({ appointmentId: a.appointmentId, ...body(over) });
  return { p, a, res };
}

describe('UC-1101 rəy yazma', () => {
  it('uyğunluq: tamamlanmış qəbul uyğundur; ulduz məcburidir (EF-1101-8); rəy moderasiyaya düşür, profildə görünmür', async () => {
    const p = await tokenFor(PHONES.patient);
    const a = unreviewed();
    const el = await api().get(`/v1/reviews/eligibility/${a.appointmentId}`).set(auth(p));
    expect(el.body.data).toMatchObject({ eligible: true, existing: null });
    expect((await api().post('/v1/reviews').set(auth(p)).send({ appointmentId: a.appointmentId, comment: 'test' })).status).toBe(400);
    const res = await api().post('/v1/reviews').set(auth(p)).send({ appointmentId: a.appointmentId, ...body() });
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ status: 'PENDING_MODERATION', canEdit: true });
    const docId = db.reviews.find((r) => r.reviewId === res.body.data.reviewId)!.doctorId;
    const pub = await api().get(`/v1/doctors/${docId}/reviews`);
    expect(pub.body.data.reviews.some((r: { reviewId: string }) => r.reviewId === res.body.data.reviewId)).toBe(false); // BR-1101-05
    // EF-1101-2: təkrar rəy.
    expect((await api().post('/v1/reviews').set(auth(p)).send({ appointmentId: a.appointmentId, ...body() })).body.errorType).toBe('DuplicateReview');
    expect((await api().get(`/v1/reviews/eligibility/${a.appointmentId}`).set(auth(p))).body.data.existing.reviewId).toBe(res.body.data.reviewId);
  });

  it('tamamlanmamış / no-show / 30 gün keçib / başqasının randevusu (EF-1101-1, 4, 5, 6)', async () => {
    const p = await tokenFor(PHONES.patient);
    const upcoming = db.appointments.find((a) => a.patientId === nigarPatientId() && a.status === 'CONFIRMED')!;
    expect((await api().post('/v1/reviews').set(auth(p)).send({ appointmentId: upcoming.appointmentId, ...body() })).body.errorType).toBe('ReviewNotEligible');
    const a = unreviewed();
    a.status = 'NO_SHOW';
    const ns = await api().get(`/v1/reviews/eligibility/${a.appointmentId}`).set(auth(p));
    expect(ns.body.data.message).toMatch(/gəlinmədiyi/);
    a.status = 'COMPLETED';
    clock.advanceMinutes(31 * 24 * 60);
    const p2 = await tokenFor(PHONES.patient);
    expect((await api().post('/v1/reviews').set(auth(p2)).send({ appointmentId: a.appointmentId, ...body() })).body.errorType).toBe('ReviewWindowClosed');
    const other = db.appointments.find((x) => x.patientId !== nigarPatientId() && x.status === 'COMPLETED')!;
    expect((await api().get(`/v1/reviews/eligibility/${other.appointmentId}`).set(auth(p2))).status).toBe(404);
    expect(db.security_events.some((e) => e.eventType === 'UNAUTHORIZED_ACCESS')).toBe(true);
  });

  it('avtomatik filtr: təhqir rədd olunur (EF-1101-3), telefon/tibbi detal işarələnir (EF-1101-7, EF-903-2)', async () => {
    const r1 = await submit({ comment: 'Həkim dələduz və yalançıdır!' });
    expect(r1.res.body.data).toMatchObject({ status: 'REJECTED' });
    expect(r1.res.body.data.rejectionReason).toMatch(/təhqiredici/);
    // Rədd edilmiş rəy 24 saat ərzində düzəldilə bilər → yenidən moderasiyaya.
    const fixed = await api().patch(`/v1/reviews/${r1.res.body.data.reviewId}`).set(auth(r1.p)).send(body({ comment: 'Telefonum 050 123 45 67, FIN 6NS35AA. Diaqnoz düzgün qoyuldu.' }));
    expect(fixed.body.data.status).toBe('PENDING_MODERATION');
    const row = db.reviews.find((r) => r.reviewId === r1.res.body.data.reviewId)!;
    expect(row.filterFlags).toEqual(expect.arrayContaining(['PERSONAL_DATA', 'MEDICAL_DETAIL']));
  });

  it('24 saatdan sonra redaktə yoxdur (BR-1101-04); dərc olunmuş rəyin redaktəsində köhnə versiya görünür (alt 1)', async () => {
    const { p, res } = await submit({ overallRating: 5, comment: 'Əla qəbul idi.' });
    const id = res.body.data.reviewId;
    const sa = await tokenFor(PHONES.superAdmin);
    await api().patch(`/v1/admin/reviews/${id}/moderate`).set(auth(sa)).send({ decision: 'APPROVE' }).expect(200);
    const doctorId = db.reviews.find((r) => r.reviewId === id)!.doctorId;
    const before = db.doctors.find((d) => d.doctorId === doctorId)!.avgRating;
    const edit = await api().patch(`/v1/reviews/${id}`).set(auth(p)).send(body({ overallRating: 1, comment: 'Fikrimi dəyişdim.' }));
    expect(edit.body.data).toMatchObject({ status: 'PUBLISHED', editPending: true });
    const pub = await api().get(`/v1/doctors/${doctorId}/reviews`);
    const shown = pub.body.data.reviews.find((r: { reviewId: string }) => r.reviewId === id);
    expect(shown).toMatchObject({ overallRating: 5, comment: 'Əla qəbul idi.' });
    expect(db.doctors.find((d) => d.doctorId === doctorId)!.avgRating).toBe(before);
    clock.advanceMinutes(25 * 60);
    const p2 = await tokenFor(PHONES.patient);
    expect((await api().patch(`/v1/reviews/${id}`).set(auth(p2)).send(body())).body.errorType).toBe('ReviewEditWindowClosed');
  });

  it('anonim rəy profildə "Anonim pasient", sistemdə müəllif saxlanılır (BR-1101-09)', async () => {
    const { res } = await submit({ isAnonymous: true, comment: null });
    const sa = await tokenFor(PHONES.superAdmin);
    const q = await api().get('/v1/admin/moderation/reviews').set(auth(sa));
    const item = q.body.data.items.find((x: { reviewId: string }) => x.reviewId === res.body.data.reviewId);
    expect(item).toMatchObject({ patientName: null, isAnonymous: true });
    expect(db.reviews.find((r) => r.reviewId === res.body.data.reviewId)!.patientId).toBe(nigarPatientId());
    await api().patch(`/v1/admin/reviews/${res.body.data.reviewId}/moderate`).set(auth(sa)).send({ decision: 'APPROVE' }).expect(200);
    const docId = db.reviews.find((r) => r.reviewId === res.body.data.reviewId)!.doctorId;
    const pub = await api().get(`/v1/doctors/${docId}/reviews`);
    expect(pub.body.data.reviews.find((r: { reviewId: string }) => r.reviewId === res.body.data.reviewId).authorName).toBe('Anonim pasient');
  });

  it('rəy dəvəti + bir dəfəlik xatırlatma (alt 5); rəy yazılıbsa xatırlatma getmir', async () => {
    const near = db.appointments.find((a) => a.status === 'CONFIRMED' && a.bookingReference.endsWith('-7001'))!;
    clock.advanceMinutes(40);
    const d = await tokenFor(PHONES.doctor);
    await api().patch(`/v1/appointments/${near.appointmentId}/complete`).set(auth(d)).send({ doctorNote: 'Müayinə aparıldı' }).expect(200);
    const invites = db.scheduled_notifications.filter((s) => s.appointmentId === near.appointmentId && s.notificationType === 'REVIEW_INVITE');
    expect(invites).toHaveLength(2);
    clock.advanceMinutes(4 * 24 * 60);
    runJobs();
    const sent = db.notifications.filter((n) => n.notificationType === 'REVIEW_INVITE' && n.relatedEntityId === near.appointmentId);
    expect(sent.length).toBeLessThanOrEqual(2);
    expect(db.scheduled_notifications.filter((s) => s.appointmentId === near.appointmentId && s.notificationType === 'REVIEW_INVITE' && s.status === 'PENDING')).toHaveLength(0);
  });
});

describe('UC-903 moderasiya', () => {
  it('növbə: gözləyən, şikayət edilmiş, cavablar; təsdiq reytinqi yeniləyir, həkimə və pasientə bildiriş', async () => {
    const sa = await tokenFor(PHONES.superAdmin);
    const q = await api().get('/v1/admin/moderation/reviews').set(auth(sa));
    expect(q.body.data.counts.PENDING).toBeGreaterThanOrEqual(4);
    expect(q.body.data.counts.REPORTED).toBe(1);
    expect(q.body.data.counts.REPLIES).toBe(1);
    const flagged = q.body.data.items.find((x: { filterFlags: string[] }) => x.filterFlags.includes('PERSONAL_DATA'));
    expect(flagged).toBeTruthy();
    const clean = q.body.data.items.find((x: { filterFlags: string[]; text: string | null }) => !x.filterFlags.length && x.text);
    const docId = db.reviews.find((r) => r.reviewId === clean.reviewId)!.doctorId;
    const count = db.doctors.find((d) => d.doctorId === docId)!.reviewCount;
    await api().patch(`/v1/admin/reviews/${clean.reviewId}/moderate`).set(auth(sa)).send({ decision: 'APPROVE' }).expect(200);
    expect(db.doctors.find((d) => d.doctorId === docId)!.reviewCount).toBe(count + 1);
    expect(db.notifications.some((n) => n.notificationType === 'REVIEW_PUBLISHED')).toBe(true);
    expect(db.notifications.some((n) => n.notificationType === 'REVIEW_MODERATED')).toBe(true);
    expect(db.audit_logs.some((l) => l.action === 'MODERATE_REVIEW_APPROVE')).toBe(true);
  });

  it('şəxsi məlumat: redaktə edilmiş versiya ilə dərc (EF-903-1); rədd səbəbsiz olmur (BR-903-04)', async () => {
    const sa = await tokenFor(PHONES.superAdmin);
    const flagged = db.reviews.find((r) => r.status === 'PENDING_MODERATION' && (r.filterFlags ?? []).includes('PERSONAL_DATA'))!;
    expect((await api().patch(`/v1/admin/reviews/${flagged.reviewId}/moderate`).set(auth(sa)).send({ decision: 'REJECT' })).body.errorType).toBe('ReasonRequired');
    await api().patch(`/v1/admin/reviews/${flagged.reviewId}/moderate`).set(auth(sa)).send({ decision: 'APPROVE', redactedComment: 'Yaxşı qəbul idi.' }).expect(200);
    expect(flagged).toMatchObject({ status: 'PUBLISHED', comment: 'Yaxşı qəbul idi.' });
  });

  it('toplu təsdiq yalnız filtrdən təmiz keçənləri dərc edir (alt 1)', async () => {
    const sa = await tokenFor(PHONES.superAdmin);
    const ids = db.reviews.filter((r) => r.status === 'PENDING_MODERATION').map((r) => r.reviewId);
    const res = await api().post('/v1/admin/reviews/bulk-approve').set(auth(sa)).send({ reviewIds: ids });
    expect(res.body.data.approved).toBeGreaterThan(0);
    expect(res.body.data.skipped).toBeGreaterThan(0);
    expect(db.reviews.filter((r) => r.status === 'PENDING_MODERATION').every((r) => (r.filterFlags ?? []).length > 0)).toBe(true);
  });

  it('şikayət: həkim yalnız öz rəyini şikayət edir; geri çəkmə reytinqi yeniləyir, rədd etmə dərcə qaytarır (alt 3, 4)', async () => {
    const sa = await tokenFor(PHONES.superAdmin);
    const reported = db.reviews.find((r) => r.status === 'REPORTED')!;
    await api().patch(`/v1/admin/reviews/${reported.reviewId}/moderate`).set(auth(sa)).send({ decision: 'DISMISS_REPORT' }).expect(200);
    expect(reported.status).toBe('PUBLISHED');
    const d = await tokenFor(PHONES.doctor);
    const mine = db.reviews.find((r) => r.doctorId === doctorIdOf('3KL88MN') && r.status === 'PUBLISHED' && !db.review_reports.some((x) => x.reviewId === r.reviewId))!;
    const notMine = db.reviews.find((r) => r.doctorId !== doctorIdOf('3KL88MN') && r.status === 'PUBLISHED')!;
    expect((await api().post(`/v1/reviews/${notMine.reviewId}/report`).set(auth(d)).send({ reason: 'Saxta rəydir' })).status).toBe(404);
    await api().post(`/v1/reviews/${mine.reviewId}/report`).set(auth(d)).send({ reason: 'Saxta rəydir' }).expect(200);
    expect((await api().post(`/v1/reviews/${mine.reviewId}/report`).set(auth(d)).send({ reason: 'Yenə' + ' şikayət' })).status).toBe(409);
    const count = db.doctors.find((x) => x.doctorId === mine.doctorId)!.reviewCount;
    await api().patch(`/v1/admin/reviews/${mine.reviewId}/moderate`).set(auth(sa)).send({ decision: 'WITHDRAW', reason: 'Şikayət əsaslıdır' }).expect(200);
    expect(mine.status).toBe('WITHDRAWN');
    expect(db.doctors.find((x) => x.doctorId === mine.doctorId)!.reviewCount).toBe(count - 1); // BR-903-05
  });

  it('həkim cavabı moderasiyadan keçir, təsdiqdən sonra rəyin altında görünür (alt 2); həkim rəyi dəyişə bilməz', async () => {
    const d = await tokenFor(PHONES.doctor);
    const list = await api().get('/v1/doctor/reviews').set(auth(d));
    const target = list.body.data.reviews.find((r: { canReply: boolean }) => r.canReply);
    expect((await api().post(`/v1/reviews/${target.reviewId}/reply`).set(auth(d)).send({ replyText: 'qısa' })).status).toBe(400);
    expect((await api().post(`/v1/reviews/${target.reviewId}/reply`).set(auth(d)).send({ replyText: 'Siz axmaq danışırsınız, gəlməyin.' })).status).toBe(422);
    await api().post(`/v1/reviews/${target.reviewId}/reply`).set(auth(d)).send({ replyText: 'Rəyiniz üçün təşəkkür edirik, gözləmə vaxtını azaldacağıq.' }).expect(201);
    const sa = await tokenFor(PHONES.superAdmin);
    const replies = await api().get('/v1/admin/moderation/reviews').set(auth(sa)).query({ queue: 'REPLIES' });
    const mine = replies.body.data.items.find((x: { reviewId: string }) => x.reviewId === target.reviewId);
    await api().patch(`/v1/admin/review-replies/${mine.replyId}/moderate`).set(auth(sa)).send({ decision: 'APPROVE' }).expect(200);
    const pub = await api().get(`/v1/doctors/${doctorIdOf('3KL88MN')}/reviews`).query({ size: 20 });
    const all = pub.body.data.reviews as { reviewId: string; reply: { text: string } | null }[];
    const shown = all.find((r) => r.reviewId === target.reviewId);
    if (shown) expect(shown.reply?.text).toMatch(/təşəkkür/);
    // BR-1101-06: həkim rəyi redaktə edə bilməz.
    expect((await api().patch(`/v1/reviews/${target.reviewId}`).set(auth(d)).send(body())).status).toBe(403);
    expect(db.notifications.some((n) => n.notificationType === 'REVIEW_REPLY_MODERATED')).toBe(true);
  });

  it('filtr qaydaları: həssaslıq LOW olanda təhqir rədd edilmir, yalnız işarələnir (alt 5); yalnız Super Admin', async () => {
    const sa = await tokenFor(PHONES.superAdmin);
    const ca = await tokenFor(PHONES.clinicAdmin);
    expect((await api().get('/v1/admin/moderation/filter-rules').set(auth(ca))).status).toBe(403);
    const rules = (await api().get('/v1/admin/moderation/filter-rules').set(auth(sa))).body.data;
    await api().put('/v1/admin/moderation/filter-rules').set(auth(sa)).send({ bannedWords: [...rules.bannedWords, 'biabır'], sensitivity: 'LOW' }).expect(200);
    const { res } = await submit({ comment: 'Biabır xidmət idi.' });
    expect(res.body.data.status).toBe('PENDING_MODERATION');
    expect(db.reviews.find((r) => r.reviewId === res.body.data.reviewId)!.filterFlags).toContain('PROFANITY');
  });
});
