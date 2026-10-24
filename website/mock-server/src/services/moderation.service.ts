import type { FilterRulesDto, ModerationItemDto, ModerationQueue, ModerationQueueDto, RatingsDto } from '@mediconnect/shared';
import type { Actor } from '../core/actor';
import { audit } from '../core/audit';
import { clock } from '../core/clock';
import { ApiError } from '../core/errors';
import { db } from '../store/db';
import { newId, paginate } from '../store/repo';
import type { ModerationFilterRule, Review, ReviewReply } from '../store/types';
import { notify } from './notifications.service';
import { recalculateDoctor } from './ratings.service';
import { doctorFullName } from './visibility';

// UC-903 — məzmun moderasiyası. Bütün rəylər dərcdən əvvəl moderasiyadan keçir (BR-903-01); avtomatik filtr şəxsi
// məlumatı, tibbi detalı, təhqiri və spamı işarələyir (FR-903-B). Reytinq yalnız dərc olunmuş rəylərdən (BR-903-05).

// ── Avtomatik filtr ──

export const DEFAULT_BANNED = ['axmaq', 'alçaq', 'dələduz', 'fırıldaqçı', 'yalançı', 'idiot', 'əclaf', 'rəzil'];
const MEDICAL_WORDS = ['diaqnoz', 'xərçəng', 'onkoloji', 'şiş', 'hiv', 'qiçs', 'diabet', 'şəkərli', 'hipertenziya', 'depressiya', 'şizofreniya', 'hamiləlik', 'abort', 'infarkt', 'insult', 'hepatit', 'vərəm', 'epilepsiya'];

export function filterRules(): ModerationFilterRule {
  let r = db.moderation_filter_rules[0];
  if (!r) {
    r = { ruleId: newId(), bannedWords: [...DEFAULT_BANNED], sensitivity: 'MEDIUM', updatedBy: null, updatedAt: clock.nowIso() };
    db.moderation_filter_rules.push(r);
  }
  return r;
}

const lower = (s: string) => s.toLocaleLowerCase('az');

/** Rəy və ya cavab mətnini yoxlayır. Təhqir (MEDIUM/HIGH həssaslıqda) və spam (HIGH) avtomatik rədd səbəbidir (EF-1101-3). */
export function checkText(text: string | null): { flags: string[]; autoReject: string | null } {
  if (!text) return { flags: [], autoReject: null };
  const rules = filterRules();
  const t = lower(text);
  const flags = new Set<string>();
  // EF-903-1 / EF-1101-7: telefon, FIN, email.
  if (/(\+?994|\b0)[\s(-]*(10|12|50|51|55|60|70|77|99)[\s)-]*\d{3}[\s-]*\d{2}[\s-]*\d{2}/.test(text)) flags.add('PERSONAL_DATA');
  if (/\b(?=[A-Za-z0-9]*\d)(?=[A-Za-z0-9]*[A-Za-z])[A-Za-z0-9]{7}\b/.test(text)) flags.add('PERSONAL_DATA'); // FIN: 7 simvol, hərf + rəqəm
  if (/[\w.+-]+@[\w-]+\.[\w.]+/.test(text)) flags.add('PERSONAL_DATA');
  // EF-903-2: həssas tibbi detal (diaqnoz, xəstəlik adları, dərman adları).
  const drugNames = db.drugs.map((d) => lower(d.tradeName));
  if (MEDICAL_WORDS.some((w) => t.includes(w)) || drugNames.some((d) => d.length > 3 && t.includes(d))) flags.add('MEDICAL_DETAIL');
  // EF-903-3: qadağan olunmuş sözlər.
  if (rules.bannedWords.some((w) => new RegExp(`(^|[^\\p{L}])${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'iu').test(t))) flags.add('PROFANITY');
  if (/https?:\/\/|www\./i.test(text) || /(.)\1{7,}/.test(text)) flags.add('SPAM');
  let autoReject: string | null = null;
  if (flags.has('PROFANITY') && rules.sensitivity !== 'LOW') autoReject = 'Rəydə təhqiredici ifadə var — qaydalara uyğun yenidən yazın';
  else if (flags.has('SPAM') && rules.sensitivity === 'HIGH') autoReject = 'Rəydə link və ya spam əlaməti var';
  return { flags: [...flags], autoReject };
}

export function getFilterRules(actor: Actor): FilterRulesDto {
  assertSuperAdmin(actor);
  const r = filterRules();
  return { bannedWords: r.bannedWords, sensitivity: r.sensitivity, updatedAt: r.updatedBy ? r.updatedAt : null };
}

export function updateFilterRules(actor: Actor, input: { bannedWords: string[]; sensitivity: 'LOW' | 'MEDIUM' | 'HIGH' }): FilterRulesDto {
  assertSuperAdmin(actor);
  const r = filterRules();
  const old = { bannedWords: r.bannedWords, sensitivity: r.sensitivity };
  Object.assign(r, { bannedWords: [...new Set(input.bannedWords.map(lower))], sensitivity: input.sensitivity, updatedBy: actor.userId, updatedAt: clock.nowIso() });
  audit(actor, { action: 'UPDATE_MODERATION_RULES', entityType: 'MODERATION_RULES', entityId: r.ruleId, oldValue: old, newValue: { bannedWords: r.bannedWords.length, sensitivity: r.sensitivity } });
  return getFilterRules(actor);
}

// ── Növbə ──

function assertSuperAdmin(actor: Actor) {
  if (actor.role !== 'SUPER_ADMIN') throw new ApiError('Forbidden');
}

const ratingsOf = (r: Pick<Review, 'overallRating' | 'professionalismRating' | 'attitudeRating' | 'waitingTimeRating' | 'comment'>): RatingsDto => ({
  overallRating: r.overallRating, professionalismRating: r.professionalismRating, attitudeRating: r.attitudeRating, waitingTimeRating: r.waitingTimeRating, comment: r.comment,
});

function contextOf(r: Review) {
  const appt = db.appointments.find((a) => a.appointmentId === r.appointmentId);
  const dc = appt && db.doctor_clinics.find((x) => x.doctorClinicId === appt.doctorClinicId);
  const clinic = dc && db.clinics.find((c) => c.clinicId === dc.clinicId);
  const p = db.patients.find((x) => x.patientId === r.patientId);
  const u = p && db.users.find((x) => x.userId === p.userId);
  return { doctorName: doctorFullName(db.doctors.find((d) => d.doctorId === r.doctorId)!), clinicName: clinic?.name ?? null, patientName: u ? `${u.firstName} ${u.lastName}` : null };
}

/** Anonim rəydə müəllif sistem daxilində qeydə alınır (BR-1101-09), moderatora isə göstərilmir (spec: "pasient (anonim deyilsə)"). */
function reviewItem(r: Review): ModerationItemDto {
  const c = contextOf(r);
  const editPending = r.status !== 'PENDING_MODERATION' && !!r.publishedSnapshot;
  return {
    kind: 'REVIEW', reviewId: r.reviewId, replyId: null, status: editPending ? 'EDIT_PENDING' : r.status, text: r.comment, ratings: ratingsOf(r),
    previous: r.publishedSnapshot ? ratingsOf(r.publishedSnapshot) : null, patientName: r.isAnonymous ? null : c.patientName, isAnonymous: r.isAnonymous,
    doctorName: c.doctorName, clinicName: c.clinicName, createdAt: r.updatedAt, filterFlags: r.filterFlags ?? [],
    reports: db.review_reports
      .filter((x) => x.reviewId === r.reviewId && x.resolution === 'PENDING')
      .map((x) => ({ reason: x.reportReason, reporterRole: db.users.find((u) => u.userId === x.reportedBy)?.role ?? 'USER', createdAt: x.createdAt })),
    rejectionReason: r.rejectionReason, reviewText: null,
  };
}

function replyItem(x: ReviewReply): ModerationItemDto {
  const r = db.reviews.find((y) => y.reviewId === x.reviewId)!;
  const c = contextOf(r);
  return {
    kind: 'REPLY', reviewId: r.reviewId, replyId: x.replyId, status: x.status, text: x.replyText, ratings: null, previous: null, patientName: null, isAnonymous: r.isAnonymous,
    doctorName: c.doctorName, clinicName: c.clinicName, createdAt: x.createdAt, filterFlags: x.filterFlags ?? [], reports: [], rejectionReason: x.rejectionReason ?? null,
    reviewText: r.comment,
  };
}

const inQueue: Record<Exclude<ModerationQueue, 'REPLIES'>, (r: Review) => boolean> = {
  PENDING: (r) => r.status === 'PENDING_MODERATION' || (r.status === 'PUBLISHED' && !!r.publishedSnapshot),
  REPORTED: (r) => r.status === 'REPORTED',
  REJECTED: (r) => r.status === 'REJECTED' || r.status === 'WITHDRAWN',
  PUBLISHED: (r) => r.status === 'PUBLISHED' && !r.publishedSnapshot,
};

export function moderationQueue(actor: Actor, q: { queue: ModerationQueue; page: number; size: number }): ModerationQueueDto {
  assertSuperAdmin(actor);
  const pendingReplies = db.review_replies.filter((x) => x.status === 'PENDING_MODERATION');
  const counts = {
    PENDING: db.reviews.filter(inQueue.PENDING).length, REPORTED: db.reviews.filter(inQueue.REPORTED).length, REPLIES: pendingReplies.length,
    REJECTED: db.reviews.filter(inQueue.REJECTED).length, PUBLISHED: db.reviews.filter(inQueue.PUBLISHED).length,
  };
  const items =
    q.queue === 'REPLIES'
      ? pendingReplies.sort((a, b) => a.createdAt.localeCompare(b.createdAt)).map(replyItem)
      : db.reviews
          .filter(inQueue[q.queue])
          .sort((a, b) => (q.queue === 'PENDING' || q.queue === 'REPORTED' ? a.updatedAt.localeCompare(b.updatedAt) : b.updatedAt.localeCompare(a.updatedAt)))
          .map(reviewItem);
  const page = paginate(items, q.page, q.size);
  return { queue: q.queue, counts, totalCount: page.totalCount, page: page.page, size: page.size, items: page.items };
}

// ── Qərarlar ──

const patientUserId = (r: Review) => db.patients.find((p) => p.patientId === r.patientId)!.userId;
const doctorUserId = (doctorId: string) => db.doctors.find((d) => d.doctorId === doctorId)!.userId;

function notifyPatient(r: Review, status: string, reason = '') {
  notify({ type: 'REVIEW_MODERATED', userId: patientUserId(r), vars: { doctorName: contextOf(r).doctorName, status, reason }, deepLink: `/account/appointments/${r.appointmentId}/review`, entity: { type: 'review', id: r.reviewId } });
}

export function moderateReview(actor: Actor, reviewId: string, input: { decision: 'APPROVE' | 'REJECT' | 'WITHDRAW' | 'DISMISS_REPORT'; reason?: string; redactedComment?: string }): ModerationItemDto {
  assertSuperAdmin(actor);
  const r = db.reviews.find((x) => x.reviewId === reviewId);
  if (!r) throw new ApiError('NotFound');
  const reason = input.reason?.trim();
  const needReason = input.decision === 'REJECT' || input.decision === 'WITHDRAW';
  if (needReason && (!reason || reason.length < 5)) throw new ApiError('ReasonRequired'); // BR-903-04
  const editPending = r.status === 'PUBLISHED' && !!r.publishedSnapshot;
  const old = { status: r.status, editPending };
  const now = clock.nowIso();
  const resolveReports = (resolution: 'UPHELD' | 'DISMISSED') => {
    for (const x of db.review_reports.filter((y) => y.reviewId === r.reviewId && y.resolution === 'PENDING')) Object.assign(x, { resolution, resolvedBy: actor.userId });
  };

  switch (input.decision) {
    case 'APPROVE': {
      if (r.status !== 'PENDING_MODERATION' && !editPending) throw new ApiError('InvalidStatusTransition');
      if (input.redactedComment !== undefined) r.comment = input.redactedComment || null; // EF-903-1: redaktə edilmiş versiya
      const first = r.status === 'PENDING_MODERATION';
      Object.assign(r, { status: 'PUBLISHED', publishedSnapshot: null, rejectionReason: null, moderatedBy: actor.userId, moderatedAt: now, updatedAt: now });
      notifyPatient(r, 'dərc olundu');
      if (first) notify({ type: 'REVIEW_PUBLISHED', userId: doctorUserId(r.doctorId), vars: {}, deepLink: '/doctor/reviews', entity: { type: 'review', id: r.reviewId } });
      break;
    }
    case 'REJECT':
      if (editPending) {
        // Redaktə rədd edilir — dərc olunmuş versiya qalır.
        Object.assign(r, { ...r.publishedSnapshot!, publishedSnapshot: null, moderatedBy: actor.userId, moderatedAt: now, updatedAt: now });
        notifyPatient(r, 'redaktəsi qəbul edilmədi (əvvəlki versiya qalır)', `Səbəb: ${reason}`);
      } else {
        if (r.status !== 'PENDING_MODERATION') throw new ApiError('InvalidStatusTransition');
        Object.assign(r, { status: 'REJECTED', rejectionReason: reason, moderatedBy: actor.userId, moderatedAt: now, updatedAt: now });
        notifyPatient(r, 'dərc edilmədi', `Səbəb: ${reason}`);
      }
      break;
    case 'WITHDRAW':
      // Alt 4 və alt 3 (şikayət əsaslıdır): dərc olunmuş rəy geri çəkilir, reytinq yenidən hesablanır.
      if (r.status !== 'PUBLISHED' && r.status !== 'REPORTED') throw new ApiError('InvalidStatusTransition');
      Object.assign(r, { status: 'WITHDRAWN', rejectionReason: reason, publishedSnapshot: null, moderatedBy: actor.userId, moderatedAt: now, updatedAt: now });
      resolveReports('UPHELD');
      notifyPatient(r, 'geri çəkildi', `Səbəb: ${reason}`);
      break;
    case 'DISMISS_REPORT':
      if (r.status !== 'REPORTED') throw new ApiError('InvalidStatusTransition');
      Object.assign(r, { status: 'PUBLISHED', moderatedBy: actor.userId, moderatedAt: now, updatedAt: now });
      resolveReports('DISMISSED');
      break;
  }
  recalculateDoctor(r.doctorId); // həkim + klinika reytinqi (BR-1101-10)
  audit(actor, { action: `MODERATE_REVIEW_${input.decision}`, entityType: 'REVIEW', entityId: r.reviewId, oldValue: old, newValue: { status: r.status, redacted: input.redactedComment !== undefined }, reason: reason ?? null }); // BR-903-07
  return reviewItem(r);
}

/** Alt 1: avtomatik filtrdən təmiz keçmiş gözləyən rəylərin toplu təsdiqi. */
export function bulkApprove(actor: Actor, reviewIds: string[]) {
  assertSuperAdmin(actor);
  let approved = 0;
  const skipped: string[] = [];
  for (const id of reviewIds) {
    const r = db.reviews.find((x) => x.reviewId === id);
    if (!r || r.status !== 'PENDING_MODERATION' || (r.filterFlags ?? []).length) {
      skipped.push(id);
      continue;
    }
    moderateReview(actor, id, { decision: 'APPROVE' });
    approved++;
  }
  audit(actor, { action: 'BULK_APPROVE_REVIEWS', entityType: 'REVIEW', newValue: { approved, skipped: skipped.length } });
  return { approved, skipped: skipped.length };
}

/** Alt 2: həkim cavabının moderasiyası. */
export function moderateReply(actor: Actor, replyId: string, input: { decision: 'APPROVE' | 'REJECT'; reason?: string }): ModerationItemDto {
  assertSuperAdmin(actor);
  const x = db.review_replies.find((y) => y.replyId === replyId);
  if (!x) throw new ApiError('NotFound');
  if (x.status !== 'PENDING_MODERATION') throw new ApiError('InvalidStatusTransition');
  const reason = input.reason?.trim();
  if (input.decision === 'REJECT' && (!reason || reason.length < 5)) throw new ApiError('ReasonRequired');
  Object.assign(x, { status: input.decision === 'APPROVE' ? 'PUBLISHED' : 'REJECTED', rejectionReason: input.decision === 'REJECT' ? reason : null });
  notify({ type: 'REVIEW_REPLY_MODERATED', userId: doctorUserId(x.doctorId), vars: { status: input.decision === 'APPROVE' ? 'dərc olundu' : 'dərc edilmədi', reason: reason ? `Səbəb: ${reason}` : '' }, deepLink: '/doctor/reviews' });
  audit(actor, { action: `MODERATE_REPLY_${input.decision}`, entityType: 'REVIEW_REPLY', entityId: replyId, reason: reason ?? null });
  return replyItem(x);
}
