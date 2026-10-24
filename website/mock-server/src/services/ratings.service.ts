import { db } from '../store/db';
import type { Review } from '../store/types';

// Reytinq hesablanması (spec "Reytinq hesablanması", BR-1101-07, BR-1101-10, BR-202-03).
// Həkim: yalnız PUBLISHED rəylərin ortası (1 onluq). Klinika: aktiv həkimlərin reytinqlərinin ortası.

const round1 = (n: number) => Math.round(n * 10) / 10;
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

/** Profildə görünən rəylər: PUBLISHED və baxılan şikayətli (REPORTED) — F33. */
export const isPublic = (r: { status: string }) => r.status === 'PUBLISHED' || r.status === 'REPORTED';
export const publishedReviews = (doctorId: string) => db.reviews.filter((r) => r.doctorId === doctorId && isPublic(r));
/** Redaktə moderasiyadadırsa köhnə (dərc olunmuş) versiya göstərilir və sayılır (UC-1101 alt 1). */
export const shownVersion = <T extends { publishedSnapshot: unknown }>(r: T) => (r.publishedSnapshot ?? r) as Pick<Review, 'overallRating' | 'professionalismRating' | 'attitudeRating' | 'waitingTimeRating' | 'comment'>;

export function recalculateDoctor(doctorId: string) {
  const doc = db.doctors.find((d) => d.doctorId === doctorId);
  if (!doc) return;
  const reviews = publishedReviews(doctorId);
  const a = avg(reviews.map((r) => shownVersion(r).overallRating));
  doc.avgRating = a === null ? null : round1(a);
  doc.reviewCount = reviews.length;
  for (const dc of db.doctor_clinics.filter((x) => x.doctorId === doctorId)) recalculateClinic(dc.clinicId);
}

export function recalculateClinic(clinicId: string) {
  const clinic = db.clinics.find((c) => c.clinicId === clinicId);
  if (!clinic) return;
  const ratings = db.doctor_clinics
    .filter((dc) => dc.clinicId === clinicId && dc.status === 'ACTIVE')
    .map((dc) => db.doctors.find((d) => d.doctorId === dc.doctorId)?.avgRating)
    .filter((r): r is number => typeof r === 'number');
  const a = avg(ratings);
  clinic.avgRating = a === null ? null : round1(a);
}

export function recalculateAll() {
  for (const d of db.doctors) recalculateDoctor(d.doctorId);
  for (const c of db.clinics) recalculateClinic(c.clinicId);
}

/** Reytinq paylanması və alt kateqoriyalar (FR-301-24, spec "Alt kateqoriya reytinqləri"). */
export function ratingSummary(reviews: { overallRating: number; professionalismRating: number | null; attitudeRating: number | null; waitingTimeRating: number | null }[]) {
  const distribution: Record<'1' | '2' | '3' | '4' | '5', number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of reviews) distribution[String(r.overallRating) as '1'] += 1;
  const sub = (k: 'professionalismRating' | 'attitudeRating' | 'waitingTimeRating') => {
    const a = avg(reviews.map((r) => r[k]).filter((x): x is number => typeof x === 'number'));
    return a === null ? null : round1(a);
  };
  const overall = avg(reviews.map((r) => r.overallRating));
  return {
    average: overall === null ? null : round1(overall),
    count: reviews.length,
    distribution,
    professionalism: sub('professionalismRating'),
    attitude: sub('attitudeRating'),
    waitingTime: sub('waitingTimeRating'),
  };
}
