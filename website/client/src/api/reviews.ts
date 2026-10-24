import type { DoctorReviewsDto, FilterRulesDto, ModerationItemDto, ModerationQueue, ModerationQueueDto, MyReviewDto, ReviewEligibilityDto } from '@mediconnect/shared';
import { api } from './client';

// Modul 11 — rəylər (UC-1101) və UC-903 moderasiya (api-contract.md → Bildiriş və rəy, Super admin).

export type ReviewBody = {
  overallRating: number;
  professionalismRating: number | null;
  attitudeRating: number | null;
  waitingTimeRating: number | null;
  comment: string | null;
  isAnonymous: boolean;
};

export const reviewsApi = {
  eligibility: (appointmentId: string, signal?: AbortSignal) => api.get<ReviewEligibilityDto>(`/v1/reviews/eligibility/${appointmentId}`, undefined, signal),
  submit: (appointmentId: string, body: ReviewBody) => api.post<MyReviewDto>('/v1/reviews', { appointmentId, ...body }),
  update: (reviewId: string, body: ReviewBody) => api.patch<MyReviewDto>(`/v1/reviews/${reviewId}`, body),
  report: (reviewId: string, reason: string) => api.post<{ reported: boolean }>(`/v1/reviews/${reviewId}/report`, { reason }),
  reply: (reviewId: string, replyText: string) => api.post<DoctorReviewsDto>(`/v1/reviews/${reviewId}/reply`, { replyText }),
  doctorReviews: (signal?: AbortSignal) => api.get<DoctorReviewsDto>('/v1/doctor/reviews', undefined, signal),
};

export const moderationApi = {
  queue: (queue: ModerationQueue, page: number, signal?: AbortSignal) => api.get<ModerationQueueDto>('/v1/admin/moderation/reviews', { queue, page, size: 20 }, signal),
  moderate: (reviewId: string, body: { decision: 'APPROVE' | 'REJECT' | 'WITHDRAW' | 'DISMISS_REPORT'; reason?: string; redactedComment?: string }) =>
    api.patch<ModerationItemDto>(`/v1/admin/reviews/${reviewId}/moderate`, body),
  moderateReply: (replyId: string, body: { decision: 'APPROVE' | 'REJECT'; reason?: string }) => api.patch<ModerationItemDto>(`/v1/admin/review-replies/${replyId}/moderate`, body),
  bulkApprove: (reviewIds: string[]) => api.post<{ approved: number; skipped: number }>('/v1/admin/reviews/bulk-approve', { reviewIds }),
  rules: (signal?: AbortSignal) => api.get<FilterRulesDto>('/v1/admin/moderation/filter-rules', undefined, signal),
  saveRules: (body: { bannedWords: string[]; sensitivity: 'LOW' | 'MEDIUM' | 'HIGH' }) => api.put<FilterRulesDto>('/v1/admin/moderation/filter-rules', body),
};
