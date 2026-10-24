import { bakuDate } from '../core/clock';
import { db } from '../store/db';
import type { Clinic, Doctor, DoctorClinic } from '../store/types';

// Kim public axtarışda görünür (domain-rules.md §1 "Həkimin axtarışda görünmə şərti"):
// VERIFIED istifadəçi ∧ profil tamamlanıb ∧ lisenziya etibarlı ∧ ACTIVE bağlantı ∧ ACTIVE klinika.
// BR-201-02/03, BR-202-01/02/04, BR-302-05, BR-701-05, BR-802-07/08, BR-901-07.

export const isClinicActive = (c: Clinic | undefined): c is Clinic => !!c && c.status === 'ACTIVE';

export function visibleDoctorClinics(doctorId: string): DoctorClinic[] {
  return db.doctor_clinics.filter((dc) => dc.doctorId === doctorId && dc.status === 'ACTIVE' && isClinicActive(db.clinics.find((c) => c.clinicId === dc.clinicId)));
}

export function isDoctorVisible(doc: Doctor): boolean {
  const user = db.users.find((u) => u.userId === doc.userId);
  if (!user || user.status !== 'VERIFIED') return false;
  if (!doc.profileCompleted) return false;
  if (doc.licenseExpiryDate < bakuDate()) return false;
  return visibleDoctorClinics(doc.doctorId).length > 0;
}

export const visibleDoctors = () => db.doctors.filter(isDoctorVisible);

/** Klinikada görünən həkimlər (aktiv bağlantı + görünən həkim). */
export function visibleDoctorsInClinic(clinicId: string): Doctor[] {
  return db.doctor_clinics
    .filter((dc) => dc.clinicId === clinicId && dc.status === 'ACTIVE')
    .map((dc) => db.doctors.find((d) => d.doctorId === dc.doctorId))
    .filter((d): d is Doctor => !!d && isDoctorVisible(d));
}

export function isClinicVisible(c: Clinic): boolean {
  return isClinicActive(c) && visibleDoctorsInClinic(c.clinicId).length > 0;
}

export const doctorUser = (doc: Doctor) => db.users.find((u) => u.userId === doc.userId)!;
export const doctorFullName = (doc: Doctor) => {
  const u = doctorUser(doc);
  return `Dr. ${u.firstName} ${u.lastName}`;
};
