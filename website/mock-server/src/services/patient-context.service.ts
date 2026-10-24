import type { PatientContextDto } from '@mediconnect/shared';
import { bakuDate, clock } from '../core/clock';
import { db } from '../store/db';
import type { Appointment } from '../store/types';

const dayOf = (a: Appointment) => bakuDate(new Date(a.startAt));

/** FR-703-16..20: allergiyalar klinik təhlükəsizlik üçün göstərilir (BR-703-06); tarixçə yalnız bu həkimlədir. */
export function patientContext(doctorId: string, appt: Appointment): PatientContextDto {
  const p = db.patients.find((x) => x.patientId === appt.patientId)!;
  const myDc = new Set(db.doctor_clinics.filter((x) => x.doctorId === doctorId).map((x) => x.doctorClinicId));
  return {
    bloodType: p.bloodType,
    allergies: db.patient_allergies.filter((a) => a.patientId === p.patientId).map((a) => ({ allergenName: a.allergenName, severity: a.severity })),
    chronicConditions: db.patient_chronic_conditions.filter((c) => c.patientId === p.patientId).map((c) => ({ conditionName: c.conditionName, icd10Code: c.icd10Code })),
    regularMedications: p.regularMedications.map((m) => m.name),
    history: db.appointments
      .filter((a) => a.patientId === p.patientId && myDc.has(a.doctorClinicId) && a.appointmentId !== appt.appointmentId && new Date(a.startAt).getTime() < clock.nowMs())
      .sort((a, b) => b.startAt.localeCompare(a.startAt))
      .slice(0, 10)
      .map((a) => ({ appointmentId: a.appointmentId, date: dayOf(a), serviceName: db.services.find((s) => s.serviceId === a.serviceId)!.nameAz, status: a.status, doctorNote: a.doctorNote })),
    noShowCount: p.noShowCount,
  };
}
