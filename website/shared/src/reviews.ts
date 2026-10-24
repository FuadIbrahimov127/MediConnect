import { z } from 'zod';
import type { ReviewStatus } from './enums';

// Modul 11 — Feedback & Rating (UC-1101) və UC-903 Content Moderation.

const stars = z.number({ error: 'validation.rating' }).int().min(1, 'validation.rating').max(5, 'validation.rating');
const optStars = z.number().int().min(1).max(5).nullable().optional();

export const REVIEW_STATUS_LABEL: Record<ReviewStatus, string> = {
  PENDING_MODERATION: 'Moderasiya gözləyir',
  PUBLISHED: 'Dərc olunub',
  REJECTED: 'Rədd edilib',
  REPORTED: 'Şikayət edilib',
  WITHDRAWN: 'Geri çəkilib',
};

export const FILTER_FLAG_LABEL: Record<string, string> = {
  PERSONAL_DATA: 'Şəxsi məlumat (telefon, FIN, email)',
  MEDICAL_DETAIL: 'Həssas tibbi detal',
  PROFANITY: 'Təhqiredici ifadə',
  SPAM: 'Spam / link',
};

export const reviewBodySchema = z.object({
  overallRating: stars,
  professionalismRating: optStars,
  attitudeRating: optStars,
  waitingTimeRating: optStars,
  comment: z.string().trim().max(2000).nullable().optional().transform((v) => (v ? v : null)),
  isAnonymous: z.boolean().default(false),
});
export const reviewCreateSchema = reviewBodySchema.extend({ appointmentId: z.string().uuid() });
export const reviewReplySchema = z.object({ replyText: z.string().trim().min(10, 'validation.replyLength').max(1000) });
export const reviewReportSchema = z.object({ reason: z.string().trim().min(5, 'validation.reasonRequired').max(500) });

export const MODERATION_QUEUES = ['PENDING', 'REPORTED', 'REPLIES', 'REJECTED', 'PUBLISHED'] as const;
export type ModerationQueue = (typeof MODERATION_QUEUES)[number];
export const moderationQuerySchema = z.object({
  queue: z.enum(MODERATION_QUEUES).default('PENDING'),
  page: z.coerce.number().int().min(1).default(1),
  size: z.coerce.number().int().min(1).max(100).default(20),
});
export const moderateSchema = z.object({
  decision: z.enum(['APPROVE', 'REJECT', 'WITHDRAW', 'DISMISS_REPORT']),
  reason: z.string().trim().max(500).optional(),
  /** EF-903-1: şəxsi məlumat silinmiş versiya ilə dərc etmək. */
  redactedComment: z.string().trim().max(2000).optional(),
});
export const replyModerateSchema = z.object({ decision: z.enum(['APPROVE', 'REJECT']), reason: z.string().trim().max(500).optional() });
export const bulkApproveSchema = z.object({ reviewIds: z.array(z.string().uuid()).min(1).max(200) });
export const filterRulesSchema = z.object({
  bannedWords: z.array(z.string().trim().min(2).max(40)).max(300),
  sensitivity: z.enum(['LOW', 'MEDIUM', 'HIGH']),
});

export interface RatingsDto {
  overallRating: number;
  professionalismRating: number | null;
  attitudeRating: number | null;
  waitingTimeRating: number | null;
  comment: string | null;
}

export interface MyReviewDto extends RatingsDto {
  reviewId: string;
  status: ReviewStatus;
  isAnonymous: boolean;
  rejectionReason: string | null;
  createdAt: string;
  /** Redaktə moderasiya gözləyir — profildə köhnə versiya görünür (alt 1). */
  editPending: boolean;
  canEdit: boolean;
  editableUntil: string;
  reply: { text: string; createdAt: string } | null;
}

export interface ReviewEligibilityDto {
  appointmentId: string;
  eligible: boolean;
  /** ReviewNotEligible / NoShow / ReviewWindowClosed / DuplicateReview */
  reason: string | null;
  message: string | null;
  doctorName: string;
  clinicName: string;
  serviceName: string;
  date: string;
  windowEndsAt: string | null;
  existing: MyReviewDto | null;
}

export interface DoctorReviewDto extends RatingsDto {
  reviewId: string;
  authorName: string;
  status: ReviewStatus;
  createdAt: string;
  serviceName: string | null;
  clinicName: string | null;
  reply: { replyId: string; text: string; status: 'PENDING_MODERATION' | 'PUBLISHED' | 'REJECTED'; createdAt: string } | null;
  reportedByMe: boolean;
  canReply: boolean;
  canReport: boolean;
}

export interface DoctorReviewsDto {
  avgRating: number | null;
  reviewCount: number;
  distribution: Record<'1' | '2' | '3' | '4' | '5', number>;
  reviews: DoctorReviewDto[];
}

export interface ModerationItemDto {
  kind: 'REVIEW' | 'REPLY';
  reviewId: string;
  replyId: string | null;
  status: string;
  text: string | null;
  ratings: RatingsDto | null;
  /** Dərc olunmuş versiya (redaktə gözləyəndə müqayisə üçün). */
  previous: RatingsDto | null;
  patientName: string | null;
  isAnonymous: boolean;
  doctorName: string;
  clinicName: string | null;
  createdAt: string;
  filterFlags: string[];
  reports: { reason: string; reporterRole: string; createdAt: string }[];
  rejectionReason: string | null;
  /** Rəyə aid kontekst (cavab moderasiyasında). */
  reviewText: string | null;
}

export interface ModerationQueueDto {
  queue: ModerationQueue;
  counts: Record<ModerationQueue, number>;
  totalCount: number;
  page: number;
  size: number;
  items: ModerationItemDto[];
}

export interface FilterRulesDto {
  bannedWords: string[];
  sensitivity: 'LOW' | 'MEDIUM' | 'HIGH';
  updatedAt: string | null;
}
