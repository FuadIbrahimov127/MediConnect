import type { CurrentUserDto } from '@mediconnect/shared';
import { db } from '../store/db';
import type { User } from '../store/types';

/** Cari istifadəçi — rol kontekstinə görə əlavə sahələrlə. */
export function currentUserDto(u: User): CurrentUserDto {
  const dto: CurrentUserDto = {
    userId: u.userId,
    role: u.role,
    status: u.status,
    firstName: u.firstName,
    lastName: u.lastName,
    fatherName: u.fatherName,
    mobileNumber: u.mobileNumber,
    email: u.email,
    photoUrl: u.photoUrl,
    preferredLanguage: u.preferredLanguage,
    gender: u.gender,
    clinicIds: [],
  };
  if (u.role === 'PATIENT') {
    dto.medicalConsent = db.patients.find((p) => p.userId === u.userId)?.medicalConsent ?? false;
  } else if (u.role === 'DOCTOR') {
    const doc = db.doctors.find((x) => x.userId === u.userId);
    dto.profileCompleted = doc?.profileCompleted ?? false;
    dto.clinicIds = doc ? db.doctor_clinics.filter((dc) => dc.doctorId === doc.doctorId && dc.status === 'ACTIVE').map((dc) => dc.clinicId) : [];
  } else if (u.role === 'CLINIC_ADMIN') {
    dto.clinicIds = db.clinic_admins.filter((a) => a.userId === u.userId && a.status === 'ACTIVE').map((a) => a.clinicId);
  }
  return dto;
}
