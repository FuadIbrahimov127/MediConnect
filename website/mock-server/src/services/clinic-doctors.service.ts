import type {
  AuthResultDto,
  ClinicDoctorDetailDto,
  ClinicDoctorRowDto,
  CloseDayPreviewDto,
  CloseDayResultDto,
  DoctorLookupDto,
  DoctorUpdateResultDto,
  InviteInfoDto,
  SimaSessionDto,
} from '@mediconnect/shared';
import { isWeakPin } from '@mediconnect/shared';
import { SYSTEM_ACTOR, type Actor } from '../core/actor';
import { denyAccess } from '../core/access';
import { audit } from '../core/audit';
import { createSession } from '../core/auth';
import { addDays, addDaysToDate, bakuDate, bakuTime, clock } from '../core/clock';
import { hashSecret, randomToken, verifySecret } from '../core/crypto';
import { ApiError } from '../core/errors';
import { getSetting } from '../core/settings';
import { scan, sniffMime } from '../integrations/antivirus';
import { putEncrypted } from '../integrations/storage';
import { currentUserDto } from '../serializers/user';
import { db } from '../store/db';
import { newId } from '../store/repo';
import type { Appointment, Doctor, DoctorClinic, User } from '../store/types';
import { cancelAppointment, proposeTransfer } from './appointments.service';
import { maskNumber, redirectFor } from './auth.service';
import { adminClinic, clinicDcs } from './clinic-admin.service';
import { revokeGrantsForDoctor } from './grants.service';
import { notify } from './notifications.service';
import { regenerateSlots } from './schedule.service';
import { resolveDoctorClinic } from './schedule-edit.service';
import { createSimaSession, findSession } from './sima.service';
import { slotStart, tooSoon } from './slots.service';
import { doctorFullName } from './visibility';

// UC-802 — həkimlərin idarəsi (dəvət → SİMA → aktiv bağlantı), status, lisenziya, çıxarma; dəvətin qəbulu;
// UC-803 alt 1/2 — təcili gün bağlama və randevuların başqa həkimə köçürülməsi.
// Klinika admini həkimin tibbi məzmununu görmür (BR-802-10) — burada yalnız əməliyyat məlumatı var.

const ACTIVE_APPT = ['PENDING', 'CONFIRMED'];
const today = () => bakuDate();
const daysUntil = (d: string) => Math.round((new Date(`${d}T00:00:00Z`).getTime() - new Date(`${today()}T00:00:00Z`).getTime()) / 86_400_000);
const userOf = (d: Doctor) => db.users.find((u) => u.userId === d.userId)!;
const specialtiesOf = (doctorId: string) =>
  db.doctor_specialties
    .filter((x) => x.doctorId === doctorId)
    .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary))
    .map((x) => db.specialties.find((s) => s.specialtyId === x.specialtyId)!.nameAz);
const clinicName = (clinicId: string) => db.clinics.find((c) => c.clinicId === clinicId)!.name;

/** Admin-in klinikasındakı (çıxarılmamış) bağlantı; başqa klinikanın həkimi → 404 + security event (EF-803-4). */
function ownDc(actor: Actor, doctorId: string): DoctorClinic {
  const c = adminClinic(actor);
  const dc = db.doctor_clinics.find((x) => x.doctorId === doctorId && x.clinicId === c.clinicId && x.status !== 'REMOVED');
  if (!dc) denyAccess(actor, `həkim ${doctorId}@${c.clinicId}`);
  return dc;
}

function futureActive(dc: DoctorClinic) {
  return db.appointments.filter((a) => a.doctorClinicId === dc.doctorClinicId && ACTIVE_APPT.includes(a.status) && new Date(a.startAt).getTime() > clock.nowMs());
}

function patientName(a: Appointment) {
  const p = db.patients.find((x) => x.patientId === a.patientId)!;
  const u = db.users.find((x) => x.userId === p.userId)!;
  return `${u.firstName} ${u.lastName}`;
}

function notifyAdmins(clinicId: string, type: 'DOCTOR_INVITE_ACCEPTED' | 'DOCTOR_INVITE_DECLINED' | 'LICENSE_EXPIRY_WARNING' | 'CLINIC_DOCTOR_STATUS_CHANGED', vars: Record<string, string>, deepLink: string) {
  for (const a of db.clinic_admins.filter((x) => x.clinicId === clinicId && x.status === 'ACTIVE')) notify({ type, userId: a.userId, vars, deepLink });
}

// ── Siyahı və detal (FR-802-17/18) ──

function toRow(dc: DoctorClinic): ClinicDoctorRowDto {
  const d = db.doctors.find((x) => x.doctorId === dc.doctorId)!;
  const u = userOf(d);
  const since = addDays(clock.now(), -30).getTime();
  const mine = db.appointments.filter((a) => a.doctorClinicId === dc.doctorClinicId);
  return {
    doctorId: d.doctorId, fullName: doctorFullName(d), photoUrl: u.photoUrl, specialties: specialtiesOf(d.doctorId), status: dc.status,
    inactiveReason: dc.status === 'INACTIVE' ? (dc.inactiveReason === 'LICENSE_EXPIRED' ? 'Lisenziya müddəti bitib' : 'Administrator passiv edib') : null,
    userStatus: u.status, profileCompleted: d.profileCompleted, roomNumber: dc.roomNumber, licenseNumber: d.licenseNumber,
    licenseExpiryDate: d.licenseExpiryDate, licenseDaysLeft: daysUntil(d.licenseExpiryDate), inviteExpiresAt: dc.status === 'INVITED' ? dc.inviteExpiresAt : null,
    upcomingCount: mine.filter((a) => ACTIVE_APPT.includes(a.status) && new Date(a.startAt).getTime() > clock.nowMs()).length,
    completedLast30: mine.filter((a) => a.status === 'COMPLETED' && new Date(a.startAt).getTime() >= since).length,
    avgRating: d.avgRating, reviewCount: d.reviewCount,
  };
}

export function listClinicDoctors(actor: Actor, q: { status?: string; q?: string }): ClinicDoctorRowDto[] {
  const c = adminClinic(actor);
  const needle = q.q?.toLocaleLowerCase('az');
  return clinicDcs(c.clinicId)
    .filter((dc) => (q.status ? dc.status === q.status : dc.status !== 'REMOVED'))
    .map(toRow)
    .filter((r) => !needle || r.fullName.toLocaleLowerCase('az').includes(needle) || r.specialties.some((s) => s.toLocaleLowerCase('az').includes(needle)))
    .sort((a, b) => a.fullName.localeCompare(b.fullName, 'az'));
}

function roomConflict(dc: DoctorClinic): string | null {
  if (!dc.roomNumber) return null;
  const other = clinicDcs(dc.clinicId).find((x) => x.doctorClinicId !== dc.doctorClinicId && x.status !== 'REMOVED' && x.roomNumber === dc.roomNumber);
  return other ? `${dc.roomNumber} nömrəli kabinet ${doctorFullName(db.doctors.find((d) => d.doctorId === other.doctorId)!)} ilə paylaşılır` : null; // EF-803-5
}

export function clinicDoctorDetail(actor: Actor, doctorId: string): ClinicDoctorDetailDto {
  const dc = ownDc(actor, doctorId);
  const d = db.doctors.find((x) => x.doctorId === doctorId)!;
  const actions: ClinicDoctorDetailDto['allowedActions'] = [];
  if (dc.status === 'INVITED') actions.push('RESEND_INVITE', 'REMOVE');
  if (dc.status === 'ACTIVE') actions.push('DEACTIVATE', 'EDIT_SCHEDULE', 'RENEW_LICENSE', 'REMOVE');
  if (dc.status === 'INACTIVE') actions.push('ACTIVATE', 'EDIT_SCHEDULE', 'RENEW_LICENSE', 'REMOVE');
  return {
    ...toRow(dc),
    mobileNumber: userOf(d).mobileNumber,
    services: db.clinic_doctor_services
      .filter((x) => x.doctorClinicId === dc.doctorClinicId)
      .map((x) => {
        const s = db.services.find((y) => y.serviceId === x.serviceId)!;
        return { serviceId: s.serviceId, name: s.nameAz, category: s.category, durationMinutes: x.durationMinutes, isActive: x.isActive && s.isActive };
      }),
    documents: db.doctor_credentials
      .filter((x) => x.doctorId === doctorId && x.clinicId === dc.clinicId)
      .map((x) => ({ credentialId: x.credentialId, kind: x.kind, fileName: x.fileName, uploadedAt: x.createdAt })),
    // BR-803-07: digər klinikaların yalnız adı (cədvəli yox).
    otherClinics: db.doctor_clinics.filter((x) => x.doctorId === doctorId && x.clinicId !== dc.clinicId && x.status === 'ACTIVE').map((x) => clinicName(x.clinicId)),
    roomConflict: roomConflict(dc),
    allowedActions: actions,
  };
}

// ── Dəvət (FR-802-01..16) ──

export function lookupDoctor(actor: Actor, fin: string): DoctorLookupDto {
  const c = adminClinic(actor);
  const u = db.users.find((x) => x.fin === fin.toUpperCase() && !x.deletedAt);
  if (!u) return { exists: false, doctor: null, alreadyInClinic: false, blockedReason: null };
  if (u.role !== 'DOCTOR') return { exists: true, doctor: null, alreadyInClinic: false, blockedReason: 'Bu FIN ilə platformada başqa rolda hesab var — həkim kimi əlavə etmək mümkün deyil.' };
  const d = db.doctors.find((x) => x.userId === u.userId)!;
  const links = db.doctor_clinics.filter((x) => x.doctorId === d.doctorId && x.status !== 'REMOVED');
  return {
    exists: true,
    doctor: { doctorId: d.doctorId, fullName: doctorFullName(d), licenseNumber: d.licenseNumber, licenseExpiryDate: d.licenseExpiryDate, specialties: specialtiesOf(d.doctorId), clinics: links.map((x) => clinicName(x.clinicId)) },
    alreadyInClinic: links.some((x) => x.clinicId === c.clinicId),
    blockedReason: null,
  };
}

/** Sənəd (lisenziya/diplom): PDF/JPG/PNG, ≤ 10 MB, antivirus — şifrələnmiş storage-a (EF-802-7). */
function storeCredential(actor: Actor, doctorId: string, clinicId: string, kind: 'LICENSE' | 'DIPLOMA', file: { fileName: string; dataUrl: string }) {
  const buf = Buffer.from(file.dataUrl.slice(file.dataUrl.indexOf(',') + 1), 'base64');
  if (buf.length > 10 * 1024 * 1024) throw new ApiError('FileTooLarge');
  const mime = sniffMime(buf);
  if (!mime) throw new ApiError('UnsupportedFileType');
  if (scan(buf, file.fileName) === 'INFECTED') throw new ApiError('MalwareDetected');
  const { storagePath, encryptionKeyId } = putEncrypted(buf);
  db.doctor_credentials.push({ credentialId: newId(), doctorId, clinicId, kind, fileName: file.fileName, mimeType: mime, storagePath, encryptionKeyId, uploadedBy: actor.userId!, createdAt: clock.nowIso() });
}

function assertServices(services: { serviceId: string }[]) {
  for (const s of services) if (!db.services.some((x) => x.serviceId === s.serviceId && x.isActive)) throw new ApiError('ValidationError', { fields: { services: 'Xidmət mərkəzi kataloqda yoxdur' } }); // BR-804-02
}

function sendInvite(dc: DoctorClinic, user: User, origin: string) {
  const days = getSetting('doctor_invite_validity_days');
  dc.inviteToken = randomToken(24);
  dc.inviteExpiresAt = addDays(clock.now(), days).toISOString(); // BR-802-09
  notify({ type: 'DOCTOR_INVITE', to: user.mobileNumber, userId: user.status === 'VERIFIED' ? user.userId : null, vars: { clinicName: clinicName(dc.clinicId), link: `${origin}/invite/${dc.inviteToken}`, days: String(days) } });
}

export function inviteDoctor(
  actor: Actor,
  input: {
    fin: string; mobileNumber: string; firstName?: string; lastName?: string; licenseNumber?: string; licenseExpiryDate?: string; specialtyIds?: string[];
    roomNumber?: string | null; services: { serviceId: string; durationMinutes: number }[]; documents: { kind: 'LICENSE' | 'DIPLOMA'; fileName: string; dataUrl: string }[];
  },
  origin: string,
): ClinicDoctorDetailDto {
  const c = adminClinic(actor);
  if (c.status !== 'ACTIVE') throw new ApiError('BusinessRuleViolation', undefined, 'Klinika aktiv deyil — həkim əlavə etmək mümkün deyil');
  const fin = input.fin.toUpperCase();
  const found = lookupDoctor(actor, fin);
  if (found.blockedReason) throw new ApiError('Conflict', undefined, found.blockedReason);
  if (found.alreadyInClinic) throw new ApiError('DoctorAlreadyInClinic'); // EF-802-5
  assertServices(input.services);
  const now = clock.nowIso();
  let doctor: Doctor;
  let user: User;

  if (found.doctor) {
    // Alt 1: mövcud həkim — profil toxunulmur, yalnız bu klinikanın bağlantısı yaradılır (FR-802-03).
    doctor = db.doctors.find((x) => x.doctorId === found.doctor!.doctorId)!;
    user = userOf(doctor);
  } else {
    const fields: Record<string, string> = {};
    for (const k of ['firstName', 'lastName', 'licenseNumber', 'licenseExpiryDate'] as const) if (!input[k]) fields[k] = 'validation.required';
    if (!input.specialtyIds?.length) fields.specialtyIds = 'validation.required';
    if (!input.documents.some((x) => x.kind === 'LICENSE')) fields.documents = 'Lisenziya sənədini yükləyin';
    if (Object.keys(fields).length) throw new ApiError('ValidationError', { fields });
    if (db.doctors.some((x) => x.licenseNumber.toUpperCase() === input.licenseNumber!.toUpperCase())) throw new ApiError('DuplicateLicense'); // EF-802-2
    if (input.licenseExpiryDate! < today()) throw new ApiError('LicenseExpired'); // EF-802-3
    if (db.users.some((u) => u.mobileNumber === input.mobileNumber && !u.deletedAt)) throw new ApiError('Conflict', undefined, 'Bu telefon nömrəsi başqa hesaba aiddir');
    for (const id of input.specialtyIds!) if (!db.specialties.some((s) => s.specialtyId === id && s.isActive)) throw new ApiError('ValidationError', { fields: { specialtyIds: 'validation.uuid' } });
    // Şəxsi məlumat SİMA ilə təsdiqlənəndə dövlət reyestrindən yenilənir (BR-802-02); indilik admin-in daxil etdiyi ad.
    user = {
      userId: newId(), fin, mobileNumber: input.mobileNumber, firstName: input.firstName!, lastName: input.lastName!, fatherName: null, birthDate: '1900-01-01', gender: 'MALE',
      pinHash: '', role: 'DOCTOR', status: 'PENDING_VERIFICATION', email: null, photoUrl: null, biometricEnabled: false, preferredLanguage: 'az', failedLoginAttempts: 0,
      lockedUntil: null, lastLoginAt: null, blockedReason: null, deletionRequestedAt: null, deletedAt: null, createdAt: now, updatedAt: now,
    };
    db.users.push(user);
    doctor = {
      doctorId: newId(), userId: user.userId, licenseNumber: input.licenseNumber!.toUpperCase(), licenseExpiryDate: input.licenseExpiryDate!, licenseDocumentUrl: null,
      bio: null, education: null, experienceYears: null, academicDegree: null, approvalMode: 'AUTO', profileCompleted: false, avgRating: null, reviewCount: 0,
      specializationAreas: [], certificates: [], signatureCertExpiry: bakuDate(addDays(clock.now(), 365)), createdAt: now, updatedAt: now,
    };
    db.doctors.push(doctor);
    input.specialtyIds!.forEach((specialtyId, i) => db.doctor_specialties.push({ doctorSpecialtyId: newId(), doctorId: doctor.doctorId, specialtyId, isPrimary: i === 0 }));
  }

  const dc: DoctorClinic = {
    doctorClinicId: newId(), doctorId: doctor.doctorId, clinicId: c.clinicId, status: 'INVITED', roomNumber: input.roomNumber || null, invitedBy: actor.userId,
    inviteToken: null, inviteExpiresAt: null, joinedAt: null, removedAt: null, slotsGeneratedUntil: null, inactiveReason: null, createdAt: now,
  };
  db.doctor_clinics.push(dc);
  for (const s of input.services) db.clinic_doctor_services.push({ clinicDoctorServiceId: newId(), doctorClinicId: dc.doctorClinicId, serviceId: s.serviceId, durationMinutes: s.durationMinutes, isActive: true, createdAt: now });
  for (const f of input.documents) storeCredential(actor, doctor.doctorId, c.clinicId, f.kind, f);
  sendInvite(dc, user, origin);
  audit(actor, { action: 'INVITE_DOCTOR', entityType: 'DOCTOR_CLINIC', entityId: dc.doctorClinicId, newValue: { doctorId: doctor.doctorId, existing: !!found.doctor, services: input.services.length } });
  return clinicDoctorDetail(actor, doctor.doctorId);
}

export function resendInvite(actor: Actor, doctorId: string, origin: string): ClinicDoctorDetailDto {
  const dc = ownDc(actor, doctorId);
  if (dc.status !== 'INVITED') throw new ApiError('InvalidStatusTransition');
  sendInvite(dc, userOf(db.doctors.find((d) => d.doctorId === doctorId)!), origin);
  audit(actor, { action: 'RESEND_DOCTOR_INVITE', entityType: 'DOCTOR_CLINIC', entityId: dc.doctorClinicId });
  return clinicDoctorDetail(actor, doctorId);
}

// ── Status, lisenziya, xidmətlər (FR-802-19..29) ──

function replaceServices(dc: DoctorClinic, services: { serviceId: string; durationMinutes: number }[]) {
  assertServices(services);
  const now = clock.nowIso();
  for (const row of db.clinic_doctor_services.filter((x) => x.doctorClinicId === dc.doctorClinicId)) {
    const next = services.find((s) => s.serviceId === row.serviceId);
    row.isActive = !!next;
    if (next) row.durationMinutes = next.durationMinutes; // BR-804-07: mövcud randevulara təsir etmir
  }
  for (const s of services.filter((x) => !db.clinic_doctor_services.some((r) => r.doctorClinicId === dc.doctorClinicId && r.serviceId === x.serviceId)))
    db.clinic_doctor_services.push({ clinicDoctorServiceId: newId(), doctorClinicId: dc.doctorClinicId, serviceId: s.serviceId, durationMinutes: s.durationMinutes, isActive: true, createdAt: now });
}

function setStatus(dc: DoctorClinic, status: 'ACTIVE' | 'INACTIVE', reason: 'ADMIN' | 'LICENSE_EXPIRED' | null) {
  dc.status = status;
  dc.inactiveReason = status === 'INACTIVE' ? reason : null;
  if (status === 'ACTIVE') regenerateSlots(dc.doctorClinicId, today(), addDaysToDate(today(), getSetting('slot_generation_days'))); // alt 3
}

export function updateClinicDoctor(
  actor: Actor,
  doctorId: string,
  input: Partial<{
    status: 'ACTIVE' | 'INACTIVE'; roomNumber: string | null; licenseExpiryDate: string; licenseDocument: { fileName: string; dataUrl: string };
    specialtyIds: string[]; services: { serviceId: string; durationMinutes: number }[]; reason: string;
  }>,
): DoctorUpdateResultDto {
  const dc = ownDc(actor, doctorId);
  const d = db.doctors.find((x) => x.doctorId === doctorId)!;
  const warnings: string[] = [];
  const changes: Record<string, unknown> = {};

  if (input.licenseExpiryDate !== undefined) {
    // Alt 5: lisenziyanın yenilənməsi — keçmiş tarix qəbul edilmir (EF-802-3); avtomatik dayandırılmış bağlantılar bərpa olunur.
    if (input.licenseExpiryDate < today()) throw new ApiError('LicenseExpired');
    if (input.licenseExpiryDate !== d.licenseExpiryDate && !input.licenseDocument) throw new ApiError('ValidationError', { fields: { licenseDocument: 'Yeni lisenziya sənədini yükləyin' } });
    changes.licenseExpiryDate = { from: d.licenseExpiryDate, to: input.licenseExpiryDate };
    d.licenseExpiryDate = input.licenseExpiryDate;
    d.updatedAt = clock.nowIso();
    for (const x of db.doctor_clinics.filter((y) => y.doctorId === doctorId && y.status === 'INACTIVE' && y.inactiveReason === 'LICENSE_EXPIRED')) {
      setStatus(x, 'ACTIVE', null);
      warnings.push(`${clinicName(x.clinicId)}: həkim yenidən aktivləşdirildi`);
    }
  }
  if (input.licenseDocument) storeCredential(actor, doctorId, dc.clinicId, 'LICENSE', input.licenseDocument);

  if (input.status && input.status !== dc.status) {
    if (dc.status === 'INVITED') throw new ApiError('InvalidStatusTransition', undefined, 'Həkim dəvəti hələ qəbul etməyib (BR-802-04)');
    if (input.status === 'ACTIVE' && d.licenseExpiryDate < today()) throw new ApiError('LicenseExpired', undefined, 'Lisenziya müddəti bitib — əvvəlcə lisenziyanı yeniləyin');
    changes.status = { from: dc.status, to: input.status };
    setStatus(dc, input.status, 'ADMIN');
    notify({
      type: 'CLINIC_DOCTOR_STATUS_CHANGED', userId: d.userId, deepLink: '/doctor',
      vars: { clinicName: clinicName(dc.clinicId), status: input.status === 'ACTIVE' ? 'yenidən aktivsiniz' : 'passiv statusa keçirildiniz — yeni randevu qəbul olunmur', reason: input.reason ?? '' },
    });
    if (input.status === 'INACTIVE' && futureActive(dc).length) warnings.push(`${futureActive(dc).length} mövcud randevu qüvvədə qalır (alt 2)`);
  }
  if (input.roomNumber !== undefined) {
    changes.roomNumber = { from: dc.roomNumber, to: input.roomNumber || null };
    dc.roomNumber = input.roomNumber || null;
  }
  if (input.specialtyIds) {
    for (const id of input.specialtyIds) if (!db.specialties.some((s) => s.specialtyId === id && s.isActive)) throw new ApiError('ValidationError', { fields: { specialtyIds: 'validation.uuid' } });
    db.doctor_specialties = db.doctor_specialties.filter((x) => x.doctorId !== doctorId);
    input.specialtyIds.forEach((specialtyId, i) => db.doctor_specialties.push({ doctorSpecialtyId: newId(), doctorId, specialtyId, isPrimary: i === 0 }));
    changes.specialtyIds = input.specialtyIds;
  }
  if (input.services) {
    replaceServices(dc, input.services);
    changes.services = input.services;
  }
  const room = roomConflict(dc);
  if (room && input.roomNumber !== undefined) warnings.push(room);
  audit(actor, { action: 'UPDATE_CLINIC_DOCTOR', entityType: 'DOCTOR_CLINIC', entityId: dc.doctorClinicId, newValue: changes, reason: input.reason ?? null });
  return { doctor: clinicDoctorDetail(actor, doctorId), warnings };
}

/** Alt 4 / EF-802-4: gələcək randevusu olan həkim birbaşa çıxarılmır (BR-802-06) — qərar tələb olunur. */
export function removeClinicDoctor(actor: Actor, doctorId: string, input: { reason: string; conflictResolution?: 'CANCEL_AND_NOTIFY' }) {
  const dc = ownDc(actor, doctorId);
  const d = db.doctors.find((x) => x.doctorId === doctorId)!;
  const active = futureActive(dc);
  if (active.length && !input.conflictResolution)
    throw new ApiError('HasActiveAppointments', {
      count: active.length,
      appointments: active.map((a) => ({ appointmentId: a.appointmentId, date: bakuDate(new Date(a.startAt)), startTime: bakuTime(new Date(a.startAt)), patientName: patientName(a), status: a.status })),
    }, `Bu həkimin ${active.length} aktiv randevusu var`);
  for (const a of active) cancelAppointment(actor, a.appointmentId, 'Həkim artıq bu klinikada qəbul aparmır');
  const wasInvited = dc.status === 'INVITED';
  Object.assign(dc, { status: 'REMOVED', removedAt: clock.nowIso(), inviteToken: null, inviteExpiresAt: null, inactiveReason: null });
  db.appointment_slots = db.appointment_slots.filter((s) => s.doctorClinicId !== dc.doctorClinicId || s.status === 'BOOKED' || slotStart(s).getTime() <= clock.nowMs());
  // Başqa aktiv klinikası qalmayıbsa sənəd icazələri bağlanır (həkim artıq heç bir pasientə qulluq etmir).
  if (!db.doctor_clinics.some((x) => x.doctorId === doctorId && (x.status === 'ACTIVE' || x.status === 'INACTIVE'))) revokeGrantsForDoctor(doctorId);
  if (!wasInvited)
    notify({ type: 'CLINIC_DOCTOR_STATUS_CHANGED', userId: d.userId, deepLink: '/doctor', vars: { clinicName: clinicName(dc.clinicId), status: 'klinikadan çıxarıldınız', reason: input.reason } });
  audit(actor, { action: wasInvited ? 'CANCEL_DOCTOR_INVITE' : 'REMOVE_CLINIC_DOCTOR', entityType: 'DOCTOR_CLINIC', entityId: dc.doctorClinicId, reason: input.reason, newValue: { cancelledAppointments: active.length } });
  return { removed: true, cancelledCount: active.length };
}

// ── Dəvətin qəbulu (/invite/{token}) — autentifikasiyasız, token özü icazədir ──

function findInvite(token: string) {
  const dc = db.doctor_clinics.find((x) => x.inviteToken === token && x.status === 'INVITED');
  if (!dc) throw new ApiError('NotFound');
  if (!dc.inviteExpiresAt || new Date(dc.inviteExpiresAt).getTime() < clock.nowMs()) throw new ApiError('InviteExpired'); // EF-802-6
  const doctor = db.doctors.find((d) => d.doctorId === dc.doctorId)!;
  return { dc, doctor, user: userOf(doctor) };
}

export function inviteInfo(token: string): InviteInfoDto {
  const { dc, user } = findInvite(token);
  const clinic = db.clinics.find((c) => c.clinicId === dc.clinicId)!;
  return {
    kind: 'DOCTOR', clinicName: clinic.name, clinicAddress: clinic.address, fullName: `${user.firstName} ${user.lastName}`,
    maskedMobile: maskNumber(user.mobileNumber), expiresAt: dc.inviteExpiresAt!, existingAccount: user.status === 'VERIFIED',
  };
}

export function startInviteSima(token: string): SimaSessionDto {
  const { dc, user } = findInvite(token);
  if (user.status === 'VERIFIED') throw new ApiError('Conflict', undefined, 'Hesabınız artıq təsdiqlənib — PIN ilə qəbul edin');
  return createSimaSession({ fin: user.fin, mobileNumber: user.mobileNumber, purpose: 'DOCTOR_ONBOARDING', flowId: dc.doctorClinicId });
}

export function acceptInvite(actor: Actor, token: string, input: { simaSessionId?: string; userPin: string; userPinConfirm?: string }, deviceInfo: string | null): AuthResultDto {
  const { dc, doctor, user } = findInvite(token);
  if (user.status === 'VERIFIED') {
    // Alt 1: mövcud həkim — kimliyi PIN ilə təsdiqləyir.
    if (!verifySecret(input.userPin, user.pinHash)) throw new ApiError('InvalidPin');
  } else {
    // BR-802-02: yeni həkim — SİMA doğrulaması məcburidir, məlumatlar dövlət reyestrindən gəlir.
    if (!input.simaSessionId) throw new ApiError('SimaVerificationFailed');
    const s = findSession(input.simaSessionId);
    if (s.flowId !== dc.doctorClinicId) throw new ApiError('NotFound');
    if (s.sessionStatus === 'EXPIRED') throw new ApiError('SimaSessionExpired');
    if (s.sessionStatus !== 'SUCCESS') throw new ApiError('SimaVerificationFailed');
    if (input.userPin !== input.userPinConfirm) throw new ApiError('PinMismatch');
    if (isWeakPin(input.userPin)) throw new ApiError('WeakPin'); // qeydiyyatdakı PIN qaydası ilə eyni
    const p = s.callbackPayload as { firstName: string; lastName: string; fatherName: string | null; birthDate: string; gender: User['gender'] };
    Object.assign(user, { firstName: p.firstName, lastName: p.lastName, fatherName: p.fatherName, birthDate: p.birthDate, gender: p.gender, pinHash: hashSecret(input.userPin), status: 'VERIFIED', updatedAt: clock.nowIso() });
    audit(actor, { action: 'SIMA_VERIFIED', entityType: 'USER', entityId: user.userId, newValue: { simaSessionId: s.simaSessionId, purpose: 'DOCTOR_ONBOARDING' } });
  }
  Object.assign(dc, { status: 'ACTIVE', joinedAt: clock.nowIso(), inviteToken: null, inviteExpiresAt: null });
  regenerateSlots(dc.doctorClinicId, today(), addDaysToDate(today(), getSetting('slot_generation_days')));
  const a: Actor = { ...actor, userId: user.userId, role: 'DOCTOR' };
  audit(a, { action: 'ACCEPT_DOCTOR_INVITE', entityType: 'DOCTOR_CLINIC', entityId: dc.doctorClinicId });
  notifyAdmins(dc.clinicId, 'DOCTOR_INVITE_ACCEPTED', { doctorName: doctorFullName(doctor), clinicName: clinicName(dc.clinicId) }, `/clinic-admin/doctors/${doctor.doctorId}`); // FR-802-16
  user.lastLoginAt = clock.nowIso();
  const { token: sessionToken } = createSession(user, deviceInfo, actor.ip);
  return { token: sessionToken, user: currentUserDto(user), redirectTo: redirectFor(user) };
}

/** EF-802-1: həkim dəvəti rədd edir — bağlantı ləğv olunur, admin xəbərdar edilir. */
export function declineInvite(actor: Actor, token: string) {
  const { dc, doctor, user } = findInvite(token);
  Object.assign(dc, { status: 'REMOVED', removedAt: clock.nowIso(), inviteToken: null, inviteExpiresAt: null });
  audit(actor, { action: 'DECLINE_DOCTOR_INVITE', entityType: 'DOCTOR_CLINIC', entityId: dc.doctorClinicId });
  notifyAdmins(dc.clinicId, 'DOCTOR_INVITE_DECLINED', { doctorName: user.status === 'VERIFIED' ? doctorFullName(doctor) : `${user.firstName} ${user.lastName}`, clinicName: clinicName(dc.clinicId) }, `/clinic-admin/doctors/${doctor.doctorId}`);
  return { declined: true };
}

// ── UC-803 alt 1/2: təcili gün bağlama ──

export function closeDayPreview(actor: Actor, doctorId: string, date: string): CloseDayPreviewDto {
  const c = adminClinic(actor);
  const dc = resolveDoctorClinic(actor, c.clinicId, doctorId);
  const mySpecs = new Set(db.doctor_specialties.filter((x) => x.doctorId === doctorId).map((x) => x.specialtyId));
  const appts = db.appointments
    .filter((a) => a.doctorClinicId === dc.doctorClinicId && ACTIVE_APPT.includes(a.status) && bakuDate(new Date(a.startAt)) === date && new Date(a.startAt).getTime() > clock.nowMs())
    .sort((a, b) => a.startAt.localeCompare(b.startAt));
  // FR-803-11: eyni ixtisaslı, eyni xidməti göstərən aktiv həkimlər və onların həmin gün boş slotları.
  const peers = clinicDcs(c.clinicId).filter(
    (x) => x.status === 'ACTIVE' && x.doctorId !== doctorId && db.doctor_specialties.some((s) => s.doctorId === x.doctorId && mySpecs.has(s.specialtyId)),
  );
  return {
    date,
    appointments: appts.map((a) => ({
      appointmentId: a.appointmentId, bookingReference: a.bookingReference, startTime: bakuTime(new Date(a.startAt)), patientName: patientName(a),
      serviceName: db.services.find((s) => s.serviceId === a.serviceId)!.nameAz, status: a.status,
      transferOptions: peers
        .filter((p) => db.clinic_doctor_services.some((s) => s.doctorClinicId === p.doctorClinicId && s.serviceId === a.serviceId && s.isActive))
        .map((p) => ({
          doctorId: p.doctorId,
          doctorName: doctorFullName(db.doctors.find((d) => d.doctorId === p.doctorId)!),
          slots: db.appointment_slots
            .filter((s) => s.doctorClinicId === p.doctorClinicId && s.slotDate === date && s.status === 'AVAILABLE' && !tooSoon(s))
            .sort((x, y) => x.startTime.localeCompare(y.startTime))
            .slice(0, 16)
            .map((s) => ({ slotId: s.slotId, startTime: s.startTime })),
        }))
        .filter((o) => o.slots.length > 0),
    })),
  };
}

export function closeDay(actor: Actor, doctorId: string, input: { date: string; reason: string; decisions: { appointmentId: string; action: 'CANCEL' | 'TRANSFER'; targetSlotId?: string }[] }): CloseDayResultDto {
  const c = adminClinic(actor);
  const dc = resolveDoctorClinic(actor, c.clinicId, doctorId);
  if (input.date < today()) throw new ApiError('ValidationError', { fields: { date: 'Tarix gələcəkdə olmalıdır' } });
  const preview = closeDayPreview(actor, doctorId, input.date);
  // FR-803-10: hər randevu üçün qərar məcburidir.
  const missing = preview.appointments.filter((a) => !input.decisions.some((d) => d.appointmentId === a.appointmentId));
  if (missing.length) throw new ApiError('ScheduleConflict', { count: missing.length, appointments: missing }, 'Hər randevu üçün qərar seçin: ləğv et və ya köçür');
  let cancelled = 0;
  let transferred = 0;
  for (const d of input.decisions) {
    if (!preview.appointments.some((a) => a.appointmentId === d.appointmentId)) continue;
    if (d.action === 'TRANSFER') {
      if (!d.targetSlotId) throw new ApiError('ValidationError', { fields: { targetSlotId: 'validation.required' } });
      proposeTransfer(actor, d.appointmentId, d.targetSlotId);
      transferred++;
    } else {
      cancelAppointment(actor, d.appointmentId, input.reason);
      cancelled++;
    }
  }
  if (!db.schedule_exceptions.some((e) => e.doctorClinicId === dc.doctorClinicId && e.exceptionType === 'DAY_OFF' && e.startDate === input.date))
    db.schedule_exceptions.push({ exceptionId: newId(), doctorClinicId: dc.doctorClinicId, exceptionType: 'DAY_OFF', startDate: input.date, endDate: input.date, startTime: null, endTime: null, reason: input.reason, createdBy: actor.userId, createdAt: clock.nowIso() });
  regenerateSlots(dc.doctorClinicId, input.date, input.date);
  const doctor = db.doctors.find((x) => x.doctorId === doctorId)!;
  notify({ type: 'SCHEDULE_CHANGED', userId: doctor.userId, vars: { clinicName: c.name, doctorName: doctorFullName(doctor) }, deepLink: '/doctor/schedule' }); // BR-803-02
  audit(actor, { action: 'CLOSE_DOCTOR_DAY', entityType: 'DOCTOR_CLINIC', entityId: dc.doctorClinicId, reason: input.reason, newValue: { date: input.date, cancelled, transferred } }); // BR-803-05
  return { cancelled, transferProposed: transferred };
}

// ── Job: lisenziya izləməsi (FR-802-25..27, BR-802-08) ──

export function checkDoctorLicenses(): number {
  let changed = 0;
  const warnDays = getSetting('license_expiry_warning_days');
  for (const d of db.doctors) {
    const left = daysUntil(d.licenseExpiryDate);
    const links = db.doctor_clinics.filter((x) => x.doctorId === d.doctorId && (x.status === 'ACTIVE' || x.status === 'INACTIVE'));
    if (left < 0) {
      for (const dc of links.filter((x) => x.status === 'ACTIVE')) {
        setStatus(dc, 'INACTIVE', 'LICENSE_EXPIRED');
        audit(SYSTEM_ACTOR, { action: 'AUTO_SUSPEND_LICENSE_EXPIRED', entityType: 'DOCTOR_CLINIC', entityId: dc.doctorClinicId, reason: `Lisenziya ${d.licenseExpiryDate} tarixində bitib` });
        notify({ type: 'CLINIC_DOCTOR_STATUS_CHANGED', userId: d.userId, deepLink: '/doctor', vars: { clinicName: clinicName(dc.clinicId), status: 'avtomatik dayandırıldınız', reason: 'Lisenziyanın müddəti bitib' } });
        notifyAdmins(dc.clinicId, 'CLINIC_DOCTOR_STATUS_CHANGED', { clinicName: doctorFullName(d), status: 'avtomatik dayandırıldı', reason: 'Lisenziyanın müddəti bitib' }, `/clinic-admin/doctors/${d.doctorId}`);
        changed++;
      }
      continue;
    }
    // Xəbərdarlıq: 30 (parametr), 7 və 1 gün qalmış — hər həddə bir dəfə.
    if (![warnDays, 7, 1].includes(left) || !links.length) continue;
    const key = `${d.licenseExpiryDate}:${left}`;
    if (db.audit_logs.some((x) => x.action === 'LICENSE_EXPIRY_WARNING_SENT' && x.entityId === d.doctorId && (x.newValue as { key?: string } | null)?.key === key)) continue;
    const vars = { days: String(left), expiresAt: d.licenseExpiryDate, doctorName: doctorFullName(d) };
    notify({ type: 'LICENSE_EXPIRY_WARNING', userId: d.userId, vars, deepLink: '/doctor/profile' });
    for (const cid of new Set(links.map((x) => x.clinicId))) notifyAdmins(cid, 'LICENSE_EXPIRY_WARNING', vars, `/clinic-admin/doctors/${d.doctorId}`);
    audit(SYSTEM_ACTOR, { action: 'LICENSE_EXPIRY_WARNING_SENT', entityType: 'DOCTOR', entityId: d.doctorId, newValue: { key } });
    changed++;
  }
  return changed;
}
