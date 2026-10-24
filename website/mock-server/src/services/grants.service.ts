import type { AccessDuration, EligibleDoctorDto, GrantDto, GrantStatus } from '@mediconnect/shared';
import type { Actor } from '../core/actor';
import { denyAccess } from '../core/access';
import { audit } from '../core/audit';
import { addDays, addDaysToDate, addHours, bakuDate, bakuToUtc, clock } from '../core/clock';
import { ApiError } from '../core/errors';
import { db } from '../store/db';
import { newId } from '../store/repo';
import type { Appointment, DocumentAccessGrant, MedicalDocument, Patient } from '../store/types';
import { notify } from './notifications.service';
import { doctorFullName, isDoctorVisible } from './visibility';

// UC-502 — sənədə giriş icazələri. Pasientin datası pasientindir (BR-501-01): həkim yalnız pasientin açdığı qapıdan
// və yalnız icazə müddətində baxa bilər (BR-502-01..07). Klinika admini və Super Admin məzmunu görmür (BR-502-08/09).

/** APPOINTMENT_PERIOD = randevu tarixindən 7 gün sonranın sonuna qədər. */
export function appointmentPeriodEnd(appt: Appointment): Date {
  const date = bakuDate(new Date(appt.startAt));
  return bakuToUtc(addDaysToDate(date, 8), '00:00');
}

export function expiryFor(duration: AccessDuration, appt?: Appointment | null): Date {
  const now = clock.now();
  if (duration === 'TWENTY_FOUR_HOURS') return addHours(now, 24);
  if (duration === 'SEVEN_DAYS') return addDays(now, 7);
  if (duration === 'THIRTY_DAYS') return addDays(now, 30);
  return appt ? appointmentPeriodEnd(appt) : addDays(now, 7);
}

export function createGrant(p: { documentId: string; doctorId: string; patientId: string; duration: AccessDuration; appointment?: Appointment | null }): DocumentAccessGrant {
  const grant: DocumentAccessGrant = {
    grantId: newId(),
    documentId: p.documentId,
    doctorId: p.doctorId,
    grantedBy: p.patientId,
    accessDuration: p.duration,
    status: 'ACTIVE',
    appointmentId: p.appointment?.appointmentId ?? null,
    viewCount: 0,
    grantedAt: clock.nowIso(),
    expiresAt: expiryFor(p.duration, p.appointment).toISOString(),
    revokedAt: null,
  };
  db.document_access_grants.push(grant);
  return grant;
}

/** Randevu ləğv olunanda onunla yaradılmış icazələr bağlanır (BR-402-07, BR-502-07). */
export function revokeGrantsForAppointment(appointmentId: string) {
  for (const g of db.document_access_grants) {
    if (g.appointmentId === appointmentId && g.status === 'ACTIVE') Object.assign(g, { status: 'REVOKED', revokedAt: clock.nowIso() });
  }
}

/** Həkim deaktiv olunanda mövcud icazələr bağlanır (EF-502-4, FR-502-14). */
export function revokeGrantsForDoctor(doctorId: string) {
  for (const g of db.document_access_grants) {
    if (g.doctorId === doctorId && g.status === 'ACTIVE') Object.assign(g, { status: 'REVOKED', revokedAt: clock.nowIso() });
  }
}

/** Randevu köçürüləndə APPOINTMENT_PERIOD icazələrinin bitmə vaxtı yenilənir. */
export function refreshAppointmentGrants(appt: Appointment) {
  for (const g of db.document_access_grants) {
    if (g.appointmentId === appt.appointmentId && g.status === 'ACTIVE' && g.accessDuration === 'APPOINTMENT_PERIOD') g.expiresAt = appointmentPeriodEnd(appt).toISOString();
  }
}

/** Müddəti bitmiş icazəni EXPIRED edir (oxu zamanı da çağırılır — job gözlənilmir). */
export function refreshGrant(g: DocumentAccessGrant): DocumentAccessGrant {
  if (g.status === 'ACTIVE' && new Date(g.expiresAt).getTime() <= clock.nowMs()) g.status = 'EXPIRED';
  return g;
}

/** Scheduled job (BR-502-02). */
export function expireGrants(): number {
  let n = 0;
  for (const g of db.document_access_grants) {
    const before = g.status;
    if (refreshGrant(g).status !== before) n++;
  }
  return n;
}

// ── Pasientin paylaşım əməliyyatları ──

function myPatient(actor: Actor): Patient {
  const p = db.patients.find((x) => x.userId === actor.userId);
  if (!p) throw new ApiError('Forbidden');
  return p;
}

export function ownDocument(actor: Actor, documentId: string): MedicalDocument {
  const p = myPatient(actor);
  const doc = db.medical_documents.find((d) => d.documentId === documentId);
  if (!doc || doc.patientId !== p.patientId) denyAccess(actor, `sənəd ${documentId}`);
  return doc;
}

/** Pasientin randevusu olan (aktiv və ya keçmiş) həkimlər — yalnız bunlarla paylaşmaq olar (BR-502-01, EF-502-1). */
export function eligibleDoctors(actor: Actor, documentId?: string): EligibleDoctorDto[] {
  const p = myPatient(actor);
  const byDoctor = new Map<string, string>();
  for (const a of db.appointments.filter((x) => x.patientId === p.patientId && x.status !== 'CANCELLED')) {
    const dc = db.doctor_clinics.find((x) => x.doctorClinicId === a.doctorClinicId)!;
    const date = bakuDate(new Date(a.startAt));
    if ((byDoctor.get(dc.doctorId) ?? '') < date) byDoctor.set(dc.doctorId, date);
  }
  return [...byDoctor.entries()]
    .map(([doctorId]) => db.doctors.find((d) => d.doctorId === doctorId)!)
    .filter((d) => isDoctorVisible(d)) // EF-502-4: deaktiv həkimə yeni icazə yoxdur
    .map((d) => ({
      doctorId: d.doctorId,
      fullName: doctorFullName(d),
      specialties: db.doctor_specialties.filter((x) => x.doctorId === d.doctorId).map((x) => db.specialties.find((s) => s.specialtyId === x.specialtyId)!.nameAz),
      lastAppointmentDate: byDoctor.get(d.doctorId)!,
      existingGrantId: documentId ? db.document_access_grants.find((g) => g.documentId === documentId && g.doctorId === d.doctorId && refreshGrant(g).status === 'ACTIVE')?.grantId ?? null : null,
    }));
}

export function toGrantDto(g: DocumentAccessGrant): GrantDto {
  refreshGrant(g);
  const doc = db.medical_documents.find((d) => d.documentId === g.documentId)!;
  const doctor = db.doctors.find((d) => d.doctorId === g.doctorId)!;
  const lastView = db.document_access_log.filter((l) => l.grantId === g.grantId && l.accessType === 'VIEW').at(-1);
  return {
    grantId: g.grantId,
    documentId: g.documentId,
    documentName: doc.fileName,
    category: doc.category,
    doctorId: g.doctorId,
    doctorName: doctorFullName(doctor),
    accessDuration: g.accessDuration,
    status: g.status,
    grantedAt: g.grantedAt,
    expiresAt: g.expiresAt,
    revokedAt: g.revokedAt,
    viewCount: g.viewCount,
    lastViewedAt: lastView?.accessedAt ?? null,
    viaAppointment: !!g.appointmentId,
  };
}

/** UC-502 əsas axın: icazə ver. Təkrar cəhd → mövcud icazə + uzatma təklifi (EF-502-2). */
export function grantAccess(actor: Actor, documentId: string, doctorId: string, duration: AccessDuration): GrantDto {
  const p = myPatient(actor);
  const doc = ownDocument(actor, documentId);
  if (doc.deletedAt) throw new ApiError('NotFound'); // EF-502-3
  const eligible = eligibleDoctors(actor).find((d) => d.doctorId === doctorId);
  if (!eligible) throw new ApiError('NoAppointmentWithDoctor');
  const existing = db.document_access_grants.find((g) => g.documentId === documentId && g.doctorId === doctorId && refreshGrant(g).status === 'ACTIVE');
  if (existing) throw new ApiError('GrantAlreadyExists', { grant: toGrantDto(existing) });

  const appt = duration === 'APPOINTMENT_PERIOD' ? latestAppointment(p.patientId, doctorId) : null;
  const grant = createGrant({ documentId, doctorId, patientId: p.patientId, duration, appointment: appt });
  grant.appointmentId = null; // əl ilə paylaşım — randevu ləğvi bu icazəni bağlamır
  audit(actor, { action: 'GRANT_DOCUMENT_ACCESS', entityType: 'DOCUMENT', entityId: documentId, newValue: { grantId: grant.grantId, doctorId, duration, expiresAt: grant.expiresAt } });
  notifyShared(p, doctorId, grant.expiresAt);
  return toGrantDto(grant);
}

function latestAppointment(patientId: string, doctorId: string) {
  const dcIds = new Set(db.doctor_clinics.filter((x) => x.doctorId === doctorId).map((x) => x.doctorClinicId));
  return db.appointments.filter((a) => a.patientId === patientId && dcIds.has(a.doctorClinicId) && a.status !== 'CANCELLED').sort((a, b) => b.startAt.localeCompare(a.startAt))[0] ?? null;
}

function notifyShared(p: Patient, doctorId: string, expiresAt: string) {
  const u = db.users.find((x) => x.userId === p.userId)!;
  const doctor = db.doctors.find((d) => d.doctorId === doctorId)!;
  const exp = new Date(new Date(expiresAt).getTime() + 4 * 3_600_000).toISOString();
  notify({
    type: 'DOCUMENT_SHARED',
    userId: doctor.userId,
    vars: { patientName: `${u.firstName} ${u.lastName}`, expiresAt: `${exp.slice(8, 10)}.${exp.slice(5, 7)}.${exp.slice(0, 4)} ${exp.slice(11, 16)}` },
    deepLink: `/doctor/patients/${p.patientId}/documents`,
  });
}

/** FR-502-05: bir neçə sənədi eyni həkimlə paylaşmaq. Artıq paylaşılanlar ötürülür. */
export function grantBulk(actor: Actor, documentIds: string[], doctorId: string, duration: AccessDuration) {
  const created: GrantDto[] = [];
  const skipped: string[] = [];
  for (const id of documentIds) {
    try {
      created.push(grantAccess(actor, id, doctorId, duration));
    } catch (e) {
      if (e instanceof ApiError && e.errorType === 'GrantAlreadyExists') skipped.push(id);
      else throw e;
    }
  }
  return { created, skipped };
}

function ownGrant(actor: Actor, grantId: string) {
  const p = myPatient(actor);
  const g = db.document_access_grants.find((x) => x.grantId === grantId);
  if (!g || g.grantedBy !== p.patientId) denyAccess(actor, `icazə ${grantId}`);
  return g;
}

/** FR-502-09/10: pasient icazəni istənilən vaxt ləğv edir — giriş dərhal bağlanır. */
export function revokeGrant(actor: Actor, grantId: string): GrantDto {
  const g = ownGrant(actor, grantId);
  if (refreshGrant(g).status !== 'ACTIVE') throw new ApiError('InvalidStatusTransition');
  Object.assign(g, { status: 'REVOKED', revokedAt: clock.nowIso() });
  audit(actor, { action: 'REVOKE_DOCUMENT_ACCESS', entityType: 'DOCUMENT', entityId: g.documentId, newValue: { grantId } });
  return toGrantDto(g);
}

/** FR-502-12: müddəti uzatmaq (yeni müddət indidən hesablanır). */
export function extendGrant(actor: Actor, grantId: string, duration: AccessDuration): GrantDto {
  const g = ownGrant(actor, grantId);
  if (g.status === 'REVOKED') throw new ApiError('InvalidStatusTransition');
  const appt = g.appointmentId ? db.appointments.find((a) => a.appointmentId === g.appointmentId) : duration === 'APPOINTMENT_PERIOD' ? latestAppointment(g.grantedBy, g.doctorId) : null;
  const old = g.expiresAt;
  Object.assign(g, { status: 'ACTIVE', accessDuration: duration, expiresAt: expiryFor(duration, appt).toISOString() });
  audit(actor, { action: 'EXTEND_DOCUMENT_ACCESS', entityType: 'DOCUMENT', entityId: g.documentId, oldValue: { expiresAt: old }, newValue: { expiresAt: g.expiresAt } });
  return toGrantDto(g);
}

export function listGrants(actor: Actor, status?: GrantStatus): GrantDto[] {
  const p = myPatient(actor);
  return db.document_access_grants
    .filter((g) => g.grantedBy === p.patientId && !db.medical_documents.find((d) => d.documentId === g.documentId)?.deletedAt)
    .map(toGrantDto)
    .filter((g) => !status || g.status === status)
    .sort((a, b) => (a.status === 'ACTIVE' ? 0 : 1) - (b.status === 'ACTIVE' ? 0 : 1) || b.grantedAt.localeCompare(a.grantedAt));
}
