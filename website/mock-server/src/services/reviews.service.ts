import type { DoctorReviewsDto, MyReviewDto, ReviewEligibilityDto } from '@mediconnect/shared';
import type { Actor } from '../core/actor';
import { denyAccess } from '../core/access';
import { audit } from '../core/audit';
import { addDays, addHours, bakuDate, clock } from '../core/clock';
import { ApiError } from '../core/errors';
import { ERROR_MESSAGES } from '../core/messages';
import { getSetting } from '../core/settings';
import { db } from '../store/db';
import { newId } from '../store/repo';
import type { Appointment, Review } from '../store/types';
import { checkText } from './moderation.service';
import { isPublic, publishedReviews, ratingSummary, shownVersion } from './ratings.service';
import { doctorFullName } from './visibility';

// UC-1101 — rəy və reytinq. Bir randevu = bir rəy (BR-1101-02), yalnız COMPLETED (BR-1101-01, no-show — BR-1101-08),
// 30 günlük pəncərə (BR-1101-03), 24 saat redaktə (BR-1101-04). Hər rəy moderasiyadan keçir (BR-1101-05).
// Həkim rəyi silə/dəyişə bilməz (BR-1101-06) — yalnız cavab yazır və şikayət edir.

type RatingInput = { overallRating: number; professionalismRating?: number | null; attitudeRating?: number | null; waitingTimeRating?: number | null; comment: string | null; isAnonymous: boolean };

function patientOf(actor: Actor) {
  const p = db.patients.find((x) => x.userId === actor.userId);
  if (!p) throw new ApiError('Forbidden');
  return p;
}

function ownAppointment(actor: Actor, appointmentId: string): Appointment {
  const p = patientOf(actor);
  const a = db.appointments.find((x) => x.appointmentId === appointmentId);
  if (!a || a.patientId !== p.patientId) denyAccess(actor, `rəy üçün randevu ${appointmentId}`); // EF-1101-6
  return a;
}

const windowEnd = (a: Appointment) => addDays(new Date(a.completedAt ?? a.endAt), getSetting('review_window_days'));
const editEnd = (r: Review) => addHours(new Date(r.createdAt), getSetting('review_edit_hours'));

function apptContext(a: Appointment) {
  const dc = db.doctor_clinics.find((x) => x.doctorClinicId === a.doctorClinicId)!;
  return {
    doctor: db.doctors.find((d) => d.doctorId === dc.doctorId)!,
    clinicName: db.clinics.find((c) => c.clinicId === dc.clinicId)!.name,
    serviceName: db.services.find((s) => s.serviceId === a.serviceId)!.nameAz,
  };
}

function myReviewDto(r: Review): MyReviewDto {
  const reply = db.review_replies.find((x) => x.reviewId === r.reviewId && x.status === 'PUBLISHED');
  return {
    reviewId: r.reviewId, status: r.status, overallRating: r.overallRating, professionalismRating: r.professionalismRating, attitudeRating: r.attitudeRating,
    waitingTimeRating: r.waitingTimeRating, comment: r.comment, isAnonymous: r.isAnonymous, rejectionReason: r.rejectionReason, createdAt: r.createdAt,
    editPending: !!r.publishedSnapshot, canEdit: r.status !== 'WITHDRAWN' && r.status !== 'REPORTED' && editEnd(r).getTime() > clock.nowMs(), editableUntil: editEnd(r).toISOString(),
    reply: reply ? { text: reply.replyText, createdAt: reply.createdAt } : null,
  };
}

/** Rəy yazma şərtləri — server qaydaları ilə eynidir, UI yalnız əks etdirir. */
function eligibility(a: Appointment): { reason: string | null } {
  if (db.reviews.some((r) => r.appointmentId === a.appointmentId)) return { reason: 'DuplicateReview' }; // EF-1101-2
  if (a.status === 'NO_SHOW') return { reason: 'ReviewNotEligible' }; // EF-1101-5
  if (a.status !== 'COMPLETED') return { reason: 'ReviewNotEligible' }; // EF-1101-1
  if (windowEnd(a).getTime() < clock.nowMs()) return { reason: 'ReviewWindowClosed' }; // EF-1101-4
  return { reason: null };
}

export function reviewEligibility(actor: Actor, appointmentId: string): ReviewEligibilityDto {
  const a = ownAppointment(actor, appointmentId);
  const c = apptContext(a);
  const e = eligibility(a);
  const existing = db.reviews.find((r) => r.appointmentId === a.appointmentId);
  return {
    appointmentId, eligible: !e.reason, reason: e.reason,
    message: e.reason === 'DuplicateReview' ? null : a.status === 'NO_SHOW' ? 'Qəbula gəlinmədiyi üçün rəy yazıla bilməz' : e.reason ? ERROR_MESSAGES[e.reason as 'ReviewNotEligible'].az : null,
    doctorName: doctorFullName(c.doctor), clinicName: c.clinicName, serviceName: c.serviceName, date: bakuDate(new Date(a.startAt)),
    windowEndsAt: a.status === 'COMPLETED' ? windowEnd(a).toISOString() : null, existing: existing ? myReviewDto(existing) : null,
  };
}

function applyFilter(r: Review, actor: Actor) {
  const f = checkText(r.comment);
  r.filterFlags = f.flags;
  if (f.autoReject) {
    // EF-1101-3: təhqir/spam — avtomatik rədd, pasientə səbəb.
    Object.assign(r, { status: 'REJECTED', rejectionReason: f.autoReject, moderatedBy: null, moderatedAt: clock.nowIso() });
    audit(actor, { action: 'REVIEW_AUTO_REJECTED', entityType: 'REVIEW', entityId: r.reviewId, newValue: { flags: f.flags }, reason: f.autoReject });
  }
  return f;
}

export function submitReview(actor: Actor, input: RatingInput & { appointmentId: string }): MyReviewDto {
  const a = ownAppointment(actor, input.appointmentId);
  const e = eligibility(a);
  if (e.reason) throw new ApiError(e.reason as 'ReviewNotEligible' | 'DuplicateReview' | 'ReviewWindowClosed');
  const now = clock.nowIso();
  const r: Review = {
    reviewId: newId(), appointmentId: a.appointmentId, patientId: a.patientId, doctorId: apptContext(a).doctor.doctorId, overallRating: input.overallRating,
    professionalismRating: input.professionalismRating ?? null, attitudeRating: input.attitudeRating ?? null, waitingTimeRating: input.waitingTimeRating ?? null,
    comment: input.comment, isAnonymous: input.isAnonymous, status: 'PENDING_MODERATION', filterFlags: [], moderatedBy: null, moderatedAt: null,
    rejectionReason: null, publishedSnapshot: null, createdAt: now, updatedAt: now,
  };
  db.reviews.push(r);
  applyFilter(r, actor);
  audit(actor, { action: 'SUBMIT_REVIEW', entityType: 'REVIEW', entityId: r.reviewId, newValue: { overallRating: r.overallRating, anonymous: r.isAnonymous, flags: r.filterFlags, status: r.status } });
  return myReviewDto(r);
}

/** Alt 1: 24 saat ərzində redaktə; dərc olunmuş rəydə köhnə versiya moderasiyaya qədər görünür. */
export function updateReview(actor: Actor, reviewId: string, input: RatingInput): MyReviewDto {
  const p = patientOf(actor);
  const r = db.reviews.find((x) => x.reviewId === reviewId);
  if (!r || r.patientId !== p.patientId) return denyAccess(actor, `rəy ${reviewId}`);
  if (editEnd(r).getTime() < clock.nowMs()) throw new ApiError('ReviewEditWindowClosed');
  if (r.status === 'WITHDRAWN' || r.status === 'REPORTED') throw new ApiError('InvalidStatusTransition');
  const wasPublished = r.status === 'PUBLISHED';
  if (wasPublished && !r.publishedSnapshot)
    r.publishedSnapshot = { overallRating: r.overallRating, professionalismRating: r.professionalismRating, attitudeRating: r.attitudeRating, waitingTimeRating: r.waitingTimeRating, comment: r.comment };
  Object.assign(r, {
    overallRating: input.overallRating, professionalismRating: input.professionalismRating ?? null, attitudeRating: input.attitudeRating ?? null,
    waitingTimeRating: input.waitingTimeRating ?? null, comment: input.comment, isAnonymous: input.isAnonymous, rejectionReason: null, updatedAt: clock.nowIso(),
    // Rədd edilmiş və ya gözləyən rəy yenidən moderasiyaya düşür; dərc olunmuş qalır (redaktə gözləyir).
    status: wasPublished ? 'PUBLISHED' : 'PENDING_MODERATION',
  });
  const f = applyFilter(r, actor);
  if (f.autoReject && wasPublished) {
    // Dərc olunmuş versiya qorunur, təhqiredici redaktə tətbiq olunmur.
    Object.assign(r, { ...r.publishedSnapshot!, publishedSnapshot: null, status: 'PUBLISHED' });
    throw new ApiError('BusinessRuleViolation', { flags: f.flags }, f.autoReject);
  }
  audit(actor, { action: 'UPDATE_REVIEW', entityType: 'REVIEW', entityId: r.reviewId, newValue: { overallRating: r.overallRating, flags: r.filterFlags } });
  return myReviewDto(r);
}

// ── Həkim (alt 3, alt 4) ──

function doctorOf(actor: Actor) {
  const d = db.doctors.find((x) => x.userId === actor.userId);
  if (!d) throw new ApiError('Forbidden');
  return d;
}

export function doctorReviews(actor: Actor): DoctorReviewsDto {
  const d = doctorOf(actor);
  const visible = db.reviews.filter((r) => r.doctorId === d.doctorId && (isPublic(r) || r.status === 'WITHDRAWN'));
  const summary = ratingSummary(publishedReviews(d.doctorId).map(shownVersion));
  return {
    avgRating: d.avgRating, reviewCount: d.reviewCount, distribution: summary.distribution,
    reviews: visible
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((r) => {
        const shown = shownVersion(r);
        const appt = db.appointments.find((a) => a.appointmentId === r.appointmentId);
        const c = appt ? apptContext(appt) : null;
        const reply = [...db.review_replies].reverse().find((x) => x.reviewId === r.reviewId) ?? null;
        const p = db.patients.find((x) => x.patientId === r.patientId);
        const u = p && db.users.find((x) => x.userId === p.userId);
        const reportedByMe = db.review_reports.some((x) => x.reviewId === r.reviewId && x.reportedBy === actor.userId);
        return {
          reviewId: r.reviewId, authorName: r.isAnonymous || !u ? 'Anonim pasient' : `${u.firstName} ${u.lastName[0]}.`, status: r.status, createdAt: r.createdAt,
          overallRating: shown.overallRating, professionalismRating: shown.professionalismRating, attitudeRating: shown.attitudeRating, waitingTimeRating: shown.waitingTimeRating,
          comment: shown.comment, serviceName: c?.serviceName ?? null, clinicName: c?.clinicName ?? null,
          reply: reply ? { replyId: reply.replyId, text: reply.replyText, status: reply.status, createdAt: reply.createdAt } : null,
          reportedByMe, canReply: isPublic(r) && (!reply || reply.status === 'REJECTED'), canReport: r.status === 'PUBLISHED' && !reportedByMe,
        };
      }),
  };
}

export function replyToReview(actor: Actor, reviewId: string, replyText: string) {
  const d = doctorOf(actor);
  const r = db.reviews.find((x) => x.reviewId === reviewId);
  if (!r || r.doctorId !== d.doctorId) return denyAccess(actor, `rəy ${reviewId}`);
  if (!isPublic(r)) throw new ApiError('InvalidStatusTransition');
  const existing = db.review_replies.find((x) => x.reviewId === reviewId && x.status !== 'REJECTED');
  if (existing) throw new ApiError('Conflict', undefined, 'Bu rəyə artıq cavab yazmısınız');
  const f = checkText(replyText);
  if (f.autoReject) throw new ApiError('BusinessRuleViolation', { flags: f.flags }, f.autoReject);
  const reply = { replyId: newId(), reviewId, doctorId: d.doctorId, replyText, status: 'PENDING_MODERATION' as const, createdAt: clock.nowIso(), filterFlags: f.flags, rejectionReason: null };
  db.review_replies.push(reply);
  audit(actor, { action: 'REPLY_TO_REVIEW', entityType: 'REVIEW', entityId: reviewId, newValue: { replyId: reply.replyId, flags: f.flags } });
  return doctorReviews(actor);
}

/** Alt 4: həkim (öz rəyinə) və ya pasient uyğunsuz rəyi şikayət edir → REPORTED, Super Admin yenidən baxır. */
export function reportReview(actor: Actor, reviewId: string, reason: string) {
  const r = db.reviews.find((x) => x.reviewId === reviewId);
  if (!r) throw new ApiError('NotFound');
  if (actor.role === 'DOCTOR' && r.doctorId !== doctorOf(actor).doctorId) return denyAccess(actor, `rəy ${reviewId}`);
  if (actor.role !== 'DOCTOR' && actor.role !== 'PATIENT') throw new ApiError('Forbidden');
  if (!isPublic(r)) throw new ApiError('NotFound');
  if (db.review_reports.some((x) => x.reviewId === reviewId && x.reportedBy === actor.userId)) throw new ApiError('Conflict', undefined, 'Bu rəyi artıq şikayət etmisiniz');
  db.review_reports.push({ reportId: newId(), reviewId, reportedBy: actor.userId!, reportReason: reason, resolution: 'PENDING', resolvedBy: null, createdAt: clock.nowIso() });
  r.status = 'REPORTED';
  r.updatedAt = clock.nowIso();
  audit(actor, { action: 'REPORT_REVIEW', entityType: 'REVIEW', entityId: reviewId, reason });
  return { reported: true };
}

/** Alt 5: rəy yazılmayıbsa, dəvətdən 3 gün sonra bir dəfə xatırlatma (BR-1101-12). */
export const REVIEW_REMINDER_DAYS = 3;
