import { DOCTOR_LOCKED_FIELDS, type DoctorDashboardDto, type DoctorProfileDto, type DoctorProfileUpdateInput } from '@mediconnect/shared';
import type { Actor } from '../core/actor';
import { audit } from '../core/audit';
import { bakuDate, clock } from '../core/clock';
import { ApiError } from '../core/errors';
import { db } from '../store/db';
import { newId } from '../store/repo';
import type { Doctor } from '../store/types';
import { listDoctorAppointments } from './doctor-appointments.service';
import { notify } from './notifications.service';
import { recalculateClinic } from './ratings.service';
import { doctorFullName } from './visibility';

// UC-701 — həkim profili. Üç qat məlumat: SİMA (read-only), klinika admini (lisenziya, klinika, ixtisas — read-only),
// həkimin özü (bio, təhsil, təcrübə, dillər, foto, təsdiq rejimi). Qiymət anlayışı yoxdur (BR-701-06).

export function doctorOf(actor: Actor): Doctor {
  const d = db.doctors.find((x) => x.userId === actor.userId);
  if (!d) throw new ApiError('Forbidden');
  return d;
}

/** Profilin tamamlanması üçün məcburi sahələr (FR-701-12) — həkim axtarışda yalnız bundan sonra görünür. */
export function missingFields(d: Doctor): string[] {
  const missing: string[] = [];
  if (!d.bio || d.bio.trim().length < 30) missing.push('bio');
  if (!d.education || !d.education.trim()) missing.push('education');
  if (d.experienceYears === null || d.experienceYears === undefined) missing.push('experienceYears');
  if (!db.doctor_languages.some((l) => l.doctorId === d.doctorId)) missing.push('languages');
  return missing;
}

export function getDoctorProfile(actor: Actor): DoctorProfileDto {
  const d = doctorOf(actor);
  const u = db.users.find((x) => x.userId === d.userId)!;
  return {
    doctorId: d.doctorId,
    fin: u.fin,
    firstName: u.firstName,
    lastName: u.lastName,
    fatherName: u.fatherName,
    birthDate: u.birthDate,
    gender: u.gender,
    licenseNumber: d.licenseNumber,
    licenseExpiryDate: d.licenseExpiryDate,
    specialties: db.doctor_specialties
      .filter((x) => x.doctorId === d.doctorId)
      .map((x) => ({ id: x.specialtyId, name: db.specialties.find((s) => s.specialtyId === x.specialtyId)!.nameAz, isPrimary: x.isPrimary })),
    clinics: db.doctor_clinics
      .filter((x) => x.doctorId === d.doctorId && x.status !== 'REMOVED')
      .map((x) => ({ clinicId: x.clinicId, name: db.clinics.find((c) => c.clinicId === x.clinicId)!.name, roomNumber: x.roomNumber, status: x.status })),
    photoUrl: u.photoUrl,
    bio: d.bio,
    education: (d.education ?? '').split('\n').filter(Boolean),
    experienceYears: d.experienceYears,
    specializationAreas: d.specializationAreas,
    languages: db.doctor_languages.filter((l) => l.doctorId === d.doctorId).map((l) => l.languageCode),
    academicDegree: d.academicDegree,
    certificates: d.certificates,
    approvalMode: d.approvalMode,
    profileCompleted: d.profileCompleted,
    missingFields: missingFields(d),
  };
}

/** EF-701-2/3/5: lisenziya, klinika bağlılığı, ixtisas və qiymət sahələrini həkim dəyişə bilməz. */
export function rejectLockedFields(body: unknown) {
  if (!body || typeof body !== 'object') return;
  const touched = DOCTOR_LOCKED_FIELDS.filter((f) => f in body);
  if (touched.length) throw new ApiError('ValidationError', { fields: Object.fromEntries(touched.map((f) => [f, 'validation.doctorLocked'])) });
}

export function updateDoctorProfile(actor: Actor, input: DoctorProfileUpdateInput): DoctorProfileDto {
  const d = doctorOf(actor);
  const u = db.users.find((x) => x.userId === d.userId)!;
  const before = getDoctorProfile(actor);

  if (input.bio !== undefined) d.bio = input.bio || null;
  if (input.education !== undefined) d.education = input.education.join('\n') || null;
  if (input.experienceYears !== undefined) d.experienceYears = input.experienceYears;
  if (input.specializationAreas !== undefined) d.specializationAreas = input.specializationAreas;
  if (input.academicDegree !== undefined) d.academicDegree = input.academicDegree || null;
  if (input.certificates !== undefined) d.certificates = input.certificates;
  if (input.approvalMode !== undefined) d.approvalMode = input.approvalMode; // BR-701-08
  if (input.photoUrl !== undefined) u.photoUrl = input.photoUrl;
  if (input.languages !== undefined) {
    db.doctor_languages = db.doctor_languages.filter((l) => l.doctorId !== d.doctorId);
    for (const code of [...new Set(input.languages)]) db.doctor_languages.push({ doctorLanguageId: newId(), doctorId: d.doctorId, languageCode: code });
  }
  d.updatedAt = clock.nowIso();

  // FR-701-12/13: məcburi sahələr tamamdırsa profil "tamamlanmış" olur və həkim axtarışda görünür.
  const wasCompleted = d.profileCompleted;
  d.profileCompleted = missingFields(d).length === 0;
  if (!wasCompleted && d.profileCompleted) {
    // FR-701-21: klinika adminlərinə bildiriş.
    const clinicIds = db.doctor_clinics.filter((x) => x.doctorId === d.doctorId && x.status === 'ACTIVE').map((x) => x.clinicId);
    for (const a of db.clinic_admins.filter((x) => clinicIds.includes(x.clinicId) && x.status === 'ACTIVE')) {
      notify({ type: 'DOCTOR_PROFILE_COMPLETED', userId: a.userId, vars: { doctorName: doctorFullName(d) }, deepLink: `/clinic-admin/doctors/${d.doctorId}` });
    }
    for (const id of clinicIds) recalculateClinic(id);
  }

  const after = getDoctorProfile(actor);
  const diff = (o: object) => ({ ...o, photoUrl: (o as { photoUrl: string | null }).photoUrl ? '[şəkil]' : null });
  audit(actor, { action: 'UPDATE_DOCTOR_PROFILE', entityType: 'DOCTOR', entityId: d.doctorId, oldValue: diff(before), newValue: diff(after) });
  return after;
}

export function doctorDashboard(actor: Actor): DoctorDashboardDto {
  const d = doctorOf(actor);
  const list = listDoctorAppointments(actor, { tab: 'TODAY' });
  const pending = listDoctorAppointments(actor, { tab: 'PENDING' });
  const today = bakuDate();
  const daysLeft = Math.round((new Date(`${d.licenseExpiryDate}T00:00:00Z`).getTime() - new Date(`${today}T00:00:00Z`).getTime()) / 86_400_000);
  const upcoming = listDoctorAppointments(actor, { tab: 'UPCOMING' });
  const nowMs = clock.nowMs();
  const next = [...list.appointments, ...upcoming.appointments].find((a) => ['PENDING', 'CONFIRMED'].includes(a.status) && new Date(a.endAt).getTime() > nowMs) ?? null;
  return {
    doctorName: doctorFullName(d),
    profileCompleted: d.profileCompleted,
    licenseExpiryDate: d.licenseExpiryDate,
    licenseDaysLeft: daysLeft,
    today: list.today,
    pendingCount: pending.appointments.length,
    next,
    todayList: list.appointments,
  };
}
