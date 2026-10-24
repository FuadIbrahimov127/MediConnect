import { DOCUMENT_CATEGORY_LABEL, type TimelineDto, type TimelineEventDto } from '@mediconnect/shared';
import type { Actor } from '../core/actor';
import { denyAccess } from '../core/access';
import { audit } from '../core/audit';
import { bakuDate } from '../core/clock';
import { ApiError } from '../core/errors';
import { db } from '../store/db';
import type { Patient } from '../store/types';
import { refreshGrant } from './grants.service';
import { requireMedicalConsent } from './profile.service';
import { doctorFullName } from './visibility';

// UC-504 — tibbi tarixçə: randevular, reseptlər, sənədlər xronoloji (ən yenidən köhnəyə).
// Pasient hamısını görür (BR-504-02); həkim yalnız ona icazə verilmiş elementləri (BR-504-03); klinika admini heç nə (BR-504-04).

type Query = { type?: 'APPOINTMENT' | 'PRESCRIPTION' | 'DOCUMENT'; from?: string; to?: string; doctorId?: string; clinicId?: string };

function dcInfo(doctorClinicId: string) {
  const dc = db.doctor_clinics.find((x) => x.doctorClinicId === doctorClinicId)!;
  const doctor = db.doctors.find((d) => d.doctorId === dc.doctorId)!;
  const clinic = db.clinics.find((c) => c.clinicId === dc.clinicId)!;
  return { doctorId: doctor.doctorId, doctorName: doctorFullName(doctor), clinicId: clinic.clinicId, clinicName: clinic.name };
}

function build(patient: Patient, scope: { doctorId?: string; linkBase: 'account' | 'doctor' }): TimelineEventDto[] {
  const events: TimelineEventDto[] = [];
  const allowed = (doctorId: string | null) => !scope.doctorId || doctorId === scope.doctorId;

  for (const a of db.appointments.filter((x) => x.patientId === patient.patientId && x.status === 'COMPLETED')) {
    const info = dcInfo(a.doctorClinicId);
    if (!allowed(info.doctorId)) continue;
    const sv = db.services.find((s) => s.serviceId === a.serviceId)!;
    events.push({
      eventId: `a-${a.appointmentId}`, type: 'APPOINTMENT', date: bakuDate(new Date(a.startAt)), title: `Qəbul: ${sv.nameAz}`, description: a.doctorNote, ...info,
      link: scope.linkBase === 'account' ? `/account/appointments/${a.appointmentId}` : `/doctor/appointments/${a.appointmentId}`,
    });
  }
  for (const p of db.prescriptions.filter((x) => x.patientId === patient.patientId && (x.status === 'SIGNED' || x.status === 'EXPIRED' || x.status === 'DISPENSED'))) {
    if (!allowed(p.doctorId)) continue;
    const appt = db.appointments.find((a) => a.appointmentId === p.appointmentId);
    const info = appt ? dcInfo(appt.doctorClinicId) : { doctorId: p.doctorId, doctorName: doctorFullName(db.doctors.find((d) => d.doctorId === p.doctorId)!), clinicId: null, clinicName: null };
    events.push({
      eventId: `p-${p.prescriptionId}`, type: 'PRESCRIPTION', date: bakuDate(new Date(p.signedAt ?? p.createdAt)), title: `Resept ${p.prescriptionNumber ?? ''}`.trim(),
      description: p.diagnosis, ...info, link: scope.linkBase === 'account' ? `/account/prescriptions/${p.prescriptionId}` : p.doctorId === scope.doctorId ? `/doctor/prescriptions/${p.prescriptionId}` : null,
    });
  }
  for (const d of db.medical_documents.filter((x) => x.patientId === patient.patientId && !x.deletedAt)) {
    if (scope.doctorId && !db.document_access_grants.some((g) => g.documentId === d.documentId && g.doctorId === scope.doctorId && refreshGrant(g).status === 'ACTIVE')) continue;
    events.push({
      eventId: `d-${d.documentId}`, type: 'DOCUMENT', date: d.documentDate ?? bakuDate(new Date(d.uploadedAt)), title: d.fileName, description: DOCUMENT_CATEGORY_LABEL[d.category],
      doctorId: null, doctorName: null, clinicId: null, clinicName: null,
      link: scope.linkBase === 'account' ? `/account/documents?focus=${d.documentId}` : `/doctor/patients/${patient.patientId}/documents`,
    });
  }
  return events.sort((a, b) => b.date.localeCompare(a.date));
}

function result(patient: Patient, events: TimelineEventDto[], q: Query): TimelineDto {
  const u = db.users.find((x) => x.userId === patient.userId)!;
  const doctors = new Map<string, string>();
  const clinics = new Map<string, string>();
  for (const e of events) {
    if (e.doctorId && e.doctorName) doctors.set(e.doctorId, e.doctorName);
    if (e.clinicId && e.clinicName) clinics.set(e.clinicId, e.clinicName);
  }
  const filtered = events.filter(
    (e) => (!q.type || e.type === q.type) && (!q.from || e.date >= q.from) && (!q.to || e.date <= q.to) && (!q.doctorId || e.doctorId === q.doctorId) && (!q.clinicId || e.clinicId === q.clinicId),
  );
  return {
    patient: {
      fullName: `${u.firstName} ${u.lastName}`,
      birthDate: u.birthDate,
      bloodType: patient.bloodType,
      allergies: db.patient_allergies.filter((a) => a.patientId === patient.patientId).map((a) => a.allergenName),
      chronicConditions: db.patient_chronic_conditions.filter((c) => c.patientId === patient.patientId).map((c) => c.conditionName),
    },
    events: filtered,
    filters: { doctors: [...doctors].map(([id, name]) => ({ id, name })), clinics: [...clinics].map(([id, name]) => ({ id, name })) },
  };
}

export function patientTimeline(actor: Actor, q: Query): TimelineDto {
  const patient = db.patients.find((p) => p.userId === actor.userId);
  if (!patient) throw new ApiError('Forbidden');
  requireMedicalConsent(actor.userId!);
  return result(patient, build(patient, { linkBase: 'account' }), q);
}

/** UC-504 alt 1: həkim yalnız öz qəbulları, öz reseptləri və ona açılmış sənədləri görür. */
export function doctorTimeline(actor: Actor, patientId: string, q: Query): TimelineDto {
  const doctor = db.doctors.find((d) => d.userId === actor.userId);
  const patient = db.patients.find((p) => p.patientId === patientId);
  if (!doctor || !patient) throw new ApiError('NotFound');
  const dcIds = new Set(db.doctor_clinics.filter((x) => x.doctorId === doctor.doctorId).map((x) => x.doctorClinicId));
  if (!db.appointments.some((a) => a.patientId === patientId && dcIds.has(a.doctorClinicId))) denyAccess(actor, `pasient tarixçəsi ${patientId}`);
  audit(actor, { action: 'VIEW_MEDICAL_HISTORY', entityType: 'PATIENT', entityId: patientId });
  return result(patient, build(patient, { doctorId: doctor.doctorId, linkBase: 'doctor' }), q);
}
