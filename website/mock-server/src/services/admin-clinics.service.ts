import type { AdminClinicDetailDto, AdminClinicRowDto, AuthResultDto, ClinicAction, InviteInfoDto, LicenseCheckDto, SimaSessionDto } from '@mediconnect/shared';
import { CLINIC_STATUS_LABEL, isWeakPin } from '@mediconnect/shared';
import { SYSTEM_ACTOR, type Actor } from '../core/actor';
import { denyAccess } from '../core/access';
import { audit, securityEvent } from '../core/audit';
import { createSession } from '../core/auth';
import { addDays, addDaysToDate, bakuDate, clock } from '../core/clock';
import { hashSecret, randomToken } from '../core/crypto';
import { ApiError } from '../core/errors';
import { getSetting } from '../core/settings';
import { scan, sniffMime } from '../integrations/antivirus';
import { getDecrypted, putEncrypted } from '../integrations/storage';
import { currentUserDto } from '../serializers/user';
import { db } from '../store/db';
import { newId } from '../store/repo';
import type { Clinic, ClinicAdmin, User } from '../store/types';
import { cancelAppointment } from './appointments.service';
import { maskNumber, redirectFor } from './auth.service';
import { notify } from './notifications.service';
import { regenerateSlots } from './schedule.service';
import { createSimaSession, findSession } from './sima.service';

// UC-901 — klinikanın platformaya əlavəsi, verifikasiyası və həyat dövrü. Klinika yalnız Super Admin tərəfindən
// yaradılır (BR-901-01); verifikasiya edilməmiş klinika görünmür (BR-901-02 — visibility.isClinicActive).
// Status maşını: PENDING_VERIFICATION → ACTIVE ⇄ SUSPENDED → INACTIVE (domain-rules.md, F29).

const today = () => bakuDate();
const daysUntil = (d: string) => Math.round((new Date(`${d}T00:00:00Z`).getTime() - new Date(`${today()}T00:00:00Z`).getTime()) / 86_400_000);
const ACTIVE_APPT = ['PENDING', 'CONFIRMED'];
const userName = (id: string | null) => {
  const u = id ? db.users.find((x) => x.userId === id) : null;
  return u ? `${u.firstName} ${u.lastName}` : null;
};

function assertSuperAdmin(actor: Actor) {
  if (actor.role !== 'SUPER_ADMIN') throw new ApiError('Forbidden');
}

function loadClinic(actor: Actor, clinicId: string): Clinic {
  assertSuperAdmin(actor);
  const c = db.clinics.find((x) => x.clinicId === clinicId);
  if (!c) throw new ApiError('NotFound');
  return c;
}

const futureActive = (clinicId: string) => {
  const ids = new Set(db.doctor_clinics.filter((x) => x.clinicId === clinicId).map((x) => x.doctorClinicId));
  return db.appointments.filter((a) => ids.has(a.doctorClinicId) && ACTIVE_APPT.includes(a.status) && new Date(a.startAt).getTime() > clock.nowMs());
};

/**
 * EF-901-2 — Səhiyyə Nazirliyinin lisenziya reyestrinin mock-u. Nazirlik formatı "TF-…" (məs. TF-MERKEZI-2024);
 * bu formatda olmayan nömrə reyestrdə "tapılmır" (F30).
 */
export function licenseRegistryCheck(licenseNumber: string): LicenseCheckDto {
  const n = licenseNumber.trim().toUpperCase();
  const found = /^TF-[A-Z0-9-]{2,}$/.test(n);
  return found
    ? { found: true, message: 'Lisenziya Səhiyyə Nazirliyinin reyestrində tapıldı və qüvvədədir.' }
    : { found: false, message: 'Lisenziya reyestrdə tapılmadı — klinikadan izahat tələb edin.' };
}

// ── Siyahı və detal ──

function toRow(c: Clinic): AdminClinicRowDto {
  return {
    clinicId: c.clinicId, name: c.name, clinicType: c.clinicType, cityName: db.cities.find((x) => x.cityId === c.cityId)?.nameAz ?? '',
    status: c.status, doctorCount: db.doctor_clinics.filter((x) => x.clinicId === c.clinicId && (x.status === 'ACTIVE' || x.status === 'INACTIVE')).length,
    licenseExpiryDate: c.licenseExpiryDate, licenseDaysLeft: daysUntil(c.licenseExpiryDate), createdAt: c.createdAt,
  };
}

export function listClinics(actor: Actor, q: { status?: string; q?: string }): AdminClinicRowDto[] {
  assertSuperAdmin(actor);
  const needle = q.q?.toLocaleLowerCase('az');
  return db.clinics
    .filter((c) => (!q.status || c.status === q.status) && (!needle || c.name.toLocaleLowerCase('az').includes(needle) || c.registrationNumber.toLowerCase().includes(needle)))
    .map(toRow)
    .sort((a, b) => Number(b.status === 'PENDING_VERIFICATION') - Number(a.status === 'PENDING_VERIFICATION') || a.name.localeCompare(b.name, 'az'));
}

const CLINIC_ACTIONS_AUDIT = ['CREATE_CLINIC', 'VERIFY_CLINIC', 'REQUEST_CLINIC_DOCUMENTS', 'REJECT_CLINIC', 'SUSPEND_CLINIC', 'REACTIVATE_CLINIC', 'DEACTIVATE_CLINIC', 'RENEW_CLINIC_LICENSE', 'AUTO_SUSPEND_CLINIC_LICENSE', 'ADD_CLINIC_ADMIN', 'ADD_CLINIC_DOCUMENT'];

function allowedActions(c: Clinic): ClinicAction[] {
  switch (c.status) {
    case 'PENDING_VERIFICATION':
      return ['VERIFY', 'REQUEST_DOCUMENTS', 'REJECT'];
    case 'ACTIVE':
      return ['SUSPEND', 'DEACTIVATE'];
    case 'SUSPENDED':
      return ['REACTIVATE', 'DEACTIVATE'];
    default:
      return ['REACTIVATE'];
  }
}

export function clinicDetail(actor: Actor, clinicId: string): AdminClinicDetailDto {
  const c = loadClinic(actor, clinicId);
  return {
    ...toRow(c),
    registrationNumber: c.registrationNumber, licenseNumber: c.licenseNumber, district: c.district, address: c.address, phone: c.phone, email: c.email,
    verifiedBy: userName(c.verifiedBy), verifiedAt: c.verifiedAt, acceptingAppointments: c.acceptingAppointments, upcomingAppointments: futureActive(c.clinicId).length,
    documents: db.clinic_documents
      .filter((d) => d.clinicId === c.clinicId)
      .map((d) => ({ documentId: d.documentId, kind: d.kind, fileName: d.fileName, mimeType: d.mimeType, uploadedAt: d.createdAt })),
    admins: db.clinic_admins
      .filter((a) => a.clinicId === c.clinicId)
      .map((a) => {
        const u = db.users.find((x) => x.userId === a.userId)!;
        return { userId: u.userId, fullName: `${u.firstName} ${u.lastName}`, mobileNumber: u.mobileNumber, status: a.status, inviteExpiresAt: a.status === 'INVITED' ? a.inviteExpiresAt : null };
      }),
    history: db.audit_logs
      .filter((l) => l.entityType === 'CLINIC' && l.entityId === c.clinicId && CLINIC_ACTIONS_AUDIT.includes(l.action))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((l) => ({ action: l.action, reason: l.reason, actorName: userName(l.userId) ?? 'Sistem', createdAt: l.createdAt })),
    registryCheck: licenseRegistryCheck(c.licenseNumber),
    allowedActions: allowedActions(c),
  };
}

// ── Sənədlər (FR-901-A) ──

function storeDocument(actor: Actor, clinicId: string, doc: { kind: 'REGISTRATION' | 'LICENSE' | 'CONTRACT' | 'OTHER'; fileName: string; dataUrl: string }) {
  const buf = Buffer.from(doc.dataUrl.slice(doc.dataUrl.indexOf(',') + 1), 'base64');
  if (buf.length > 10 * 1024 * 1024) throw new ApiError('FileTooLarge');
  const mime = sniffMime(buf);
  if (!mime) throw new ApiError('UnsupportedFileType');
  if (scan(buf, doc.fileName) === 'INFECTED') {
    securityEvent(actor, 'MALWARE_DETECTED', 'HIGH', `Klinika sənədində zərərli fayl: ${doc.fileName}`);
    throw new ApiError('MalwareDetected');
  }
  const { storagePath, encryptionKeyId } = putEncrypted(buf);
  const row = { documentId: newId(), clinicId, kind: doc.kind, fileName: doc.fileName, mimeType: mime, storagePath, encryptionKeyId, uploadedBy: actor.userId!, createdAt: clock.nowIso() };
  db.clinic_documents.push(row);
  return row;
}

export function addClinicDocument(actor: Actor, clinicId: string, doc: { kind: 'REGISTRATION' | 'LICENSE' | 'CONTRACT' | 'OTHER'; fileName: string; dataUrl: string }) {
  const c = loadClinic(actor, clinicId);
  const row = storeDocument(actor, c.clinicId, doc);
  audit(actor, { action: 'ADD_CLINIC_DOCUMENT', entityType: 'CLINIC', entityId: c.clinicId, newValue: { kind: row.kind, fileName: row.fileName } });
  return clinicDetail(actor, clinicId);
}

/** Super Admin klinika sənədinə baxır (verifikasiya üçün zəruridir — görmə matrisi). */
export function clinicDocumentFile(actor: Actor, clinicId: string, documentId: string) {
  loadClinic(actor, clinicId);
  const d = db.clinic_documents.find((x) => x.documentId === documentId && x.clinicId === clinicId);
  if (!d) throw new ApiError('NotFound');
  audit(actor, { action: 'VIEW_CLINIC_DOCUMENT', entityType: 'CLINIC', entityId: clinicId, newValue: { documentId } });
  return { doc: d, body: getDecrypted(d.storagePath, d.encryptionKeyId) };
}

// ── Klinika admini (FR-901-C) ──

/** EF-901-5: FIN başqa hesaba (başqa rol və ya başqa klinikanın admini) aiddir — rol konflikti (F31: bir admin = bir klinika). */
function assertAdminFree(person: { fin: string; mobileNumber: string }) {
  const existing = db.users.find((u) => u.fin === person.fin.toUpperCase() && !u.deletedAt);
  if (existing) {
    const where = existing.role === 'CLINIC_ADMIN' ? db.clinic_admins.find((a) => a.userId === existing.userId && a.status !== 'REMOVED') : null;
    throw new ApiError('Conflict', { role: existing.role }, where ? `Bu FIN artıq ${db.clinics.find((c) => c.clinicId === where.clinicId)?.name} klinikasının admininə aiddir` : 'Bu FIN ilə platformada başqa rolda hesab var (rol konflikti)');
  }
  if (db.users.some((u) => u.mobileNumber === person.mobileNumber && !u.deletedAt)) throw new ApiError('Conflict', { fields: { mobileNumber: 'Bu telefon nömrəsi başqa hesaba aiddir' } }, 'Bu telefon nömrəsi başqa hesaba aiddir');
}

function inviteAdmin(clinic: Clinic, person: { fin: string; mobileNumber: string; firstName: string; lastName: string }, origin: string): ClinicAdmin {
  assertAdminFree(person);
  const fin = person.fin.toUpperCase();
  const now = clock.nowIso();
  const user: User = {
    userId: newId(), fin, mobileNumber: person.mobileNumber, firstName: person.firstName, lastName: person.lastName, fatherName: null, birthDate: '1900-01-01', gender: 'MALE',
    pinHash: '', role: 'CLINIC_ADMIN', status: 'PENDING_VERIFICATION', email: null, photoUrl: null, biometricEnabled: false, preferredLanguage: 'az', failedLoginAttempts: 0,
    lockedUntil: null, lastLoginAt: null, blockedReason: null, deletionRequestedAt: null, deletedAt: null, createdAt: now, updatedAt: now,
  };
  db.users.push(user);
  const link: ClinicAdmin = { clinicAdminId: newId(), userId: user.userId, clinicId: clinic.clinicId, status: 'INVITED', inviteToken: null, inviteExpiresAt: null, createdAt: now };
  db.clinic_admins.push(link);
  sendAdminInvite(link, user, clinic, origin);
  return link;
}

function sendAdminInvite(link: ClinicAdmin, user: User, clinic: Clinic, origin: string) {
  link.inviteToken = randomToken(24);
  link.inviteExpiresAt = addDays(clock.now(), getSetting('doctor_invite_validity_days')).toISOString();
  notify({ type: 'CLINIC_ADMIN_INVITE', to: user.mobileNumber, vars: { clinicName: clinic.name, link: `${origin}/invite/${link.inviteToken}` } });
}

export function addClinicAdmin(actor: Actor, clinicId: string, person: { fin: string; mobileNumber: string; firstName: string; lastName: string }, origin: string) {
  const c = loadClinic(actor, clinicId);
  if (c.status === 'INACTIVE') throw new ApiError('BusinessRuleViolation', undefined, 'Deaktiv klinikaya admin təyin edilmir');
  const link = inviteAdmin(c, person, origin); // alt 5, BR-901-09
  audit(actor, { action: 'ADD_CLINIC_ADMIN', entityType: 'CLINIC', entityId: c.clinicId, newValue: { userId: link.userId } });
  return clinicDetail(actor, clinicId);
}

export function resendAdminInvite(actor: Actor, clinicId: string, userId: string, origin: string) {
  const c = loadClinic(actor, clinicId);
  const link = db.clinic_admins.find((a) => a.clinicId === clinicId && a.userId === userId && a.status === 'INVITED');
  if (!link) throw new ApiError('NotFound');
  sendAdminInvite(link, db.users.find((u) => u.userId === userId)!, c, origin);
  audit(actor, { action: 'RESEND_CLINIC_ADMIN_INVITE', entityType: 'CLINIC', entityId: clinicId, newValue: { userId } });
  return clinicDetail(actor, clinicId);
}

// ── Yaratma (FR-901-A..C) ──

export function createClinic(
  actor: Actor,
  input: {
    name: string; clinicType: Clinic['clinicType']; cityId: string; district?: string | null; address: string; latitude?: number | null; longitude?: number | null;
    phone: string; email?: string | null; registrationNumber: string; licenseNumber: string; licenseExpiryDate: string;
    documents: { kind: 'REGISTRATION' | 'LICENSE' | 'CONTRACT' | 'OTHER'; fileName: string; dataUrl: string }[];
    admin: { fin: string; mobileNumber: string; firstName: string; lastName: string }; verify: boolean;
  },
  origin: string,
): AdminClinicDetailDto {
  assertSuperAdmin(actor);
  const reg = input.registrationNumber.trim().toUpperCase();
  const dup = db.clinics.find((c) => c.registrationNumber.toUpperCase() === reg);
  if (dup) throw new ApiError('DuplicateRegistrationNumber', { clinicId: dup.clinicId, name: dup.name }); // EF-901-1
  if (input.licenseExpiryDate < today()) throw new ApiError('LicenseExpired'); // EF-901-3
  if (!db.cities.some((c) => c.cityId === input.cityId)) throw new ApiError('ValidationError', { fields: { cityId: 'validation.uuid' } });
  if (input.verify) {
    // Verifikasiya üçün: qeydiyyat və lisenziya sənədi + reyestr yoxlaması (EF-901-2).
    const kinds = new Set(input.documents.map((d) => d.kind));
    if (!kinds.has('REGISTRATION') || !kinds.has('LICENSE')) throw new ApiError('ValidationError', { fields: { documents: 'Verifikasiya üçün qeydiyyat şəhadətnaməsi və lisenziya sənədi yüklənməlidir' } });
    const reg2 = licenseRegistryCheck(input.licenseNumber);
    if (!reg2.found) throw new ApiError('BusinessRuleViolation', { registry: reg2 }, `${reg2.message} Klinikanı "verifikasiya gözləyir" statusunda saxlaya bilərsiniz.`);
  }
  const now = clock.nowIso();
  const clinic: Clinic = {
    clinicId: newId(), name: input.name.trim(), clinicType: input.clinicType, registrationNumber: reg, licenseNumber: input.licenseNumber.trim().toUpperCase(),
    licenseExpiryDate: input.licenseExpiryDate, description: null, cityId: input.cityId, district: input.district ?? null, address: input.address, latitude: input.latitude ?? null,
    longitude: input.longitude ?? null, phone: input.phone, email: input.email ?? null, website: null, logoUrl: null,
    status: input.verify ? 'ACTIVE' : 'PENDING_VERIFICATION', verifiedBy: input.verify ? actor.userId : null, verifiedAt: input.verify ? now : null, avgRating: null,
    acceptingAppointments: true, insurances: [], foundedYear: null, is24x7: false, createdAt: now, updatedAt: now,
  };
  assertAdminFree(input.admin); // klinika yaranmazdan əvvəl — rol konfliktində heç nə yazılmır
  db.clinics.push(clinic);
  // Standart iş saatları (B.e.–C. 09:00–18:00) — klinika admini sonra dəqiqləşdirir (UC-801).
  for (let d = 1; d <= 7; d++) db.clinic_working_hours.push({ workingHourId: newId(), clinicId: clinic.clinicId, dayOfWeek: d, isClosed: d > 5, opensAt: d > 5 ? null : '09:00', closesAt: d > 5 ? null : '18:00' });
  for (const doc of input.documents) storeDocument(actor, clinic.clinicId, doc);
  inviteAdmin(clinic, input.admin, origin);
  audit(actor, { action: 'CREATE_CLINIC', entityType: 'CLINIC', entityId: clinic.clinicId, newValue: { name: clinic.name, status: clinic.status, documents: input.documents.length } });
  if (input.verify) audit(actor, { action: 'VERIFY_CLINIC', entityType: 'CLINIC', entityId: clinic.clinicId, reason: 'Sənədlər və reyestr yoxlanıldı' }); // BR-901-10
  return clinicDetail(actor, clinic.clinicId);
}

// ── Status (FR-901-B, FR-901-D) ──

function notifyClinicAdmins(c: Clinic, status: string, reason: string) {
  for (const a of db.clinic_admins.filter((x) => x.clinicId === c.clinicId && x.status !== 'REMOVED')) notify({ type: 'CLINIC_STATUS_CHANGED', userId: a.userId, vars: { clinicName: c.name, status, reason }, deepLink: '/clinic-admin' });
}

function regenerateClinic(c: Clinic) {
  for (const dc of db.doctor_clinics.filter((x) => x.clinicId === c.clinicId && x.status === 'ACTIVE')) regenerateSlots(dc.doctorClinicId, today(), addDaysToDate(today(), getSetting('slot_generation_days')));
}

export function clinicAction(actor: Actor, clinicId: string, input: { action: ClinicAction; reason: string; conflictResolution?: 'CANCEL_AND_NOTIFY' }): AdminClinicDetailDto {
  const c = loadClinic(actor, clinicId);
  if (!allowedActions(c).includes(input.action)) throw new ApiError('InvalidStatusTransition');
  const old = c.status;
  const set = (status: Clinic['status']) => Object.assign(c, { status, updatedAt: clock.nowIso() });

  switch (input.action) {
    case 'VERIFY': {
      const kinds = new Set(db.clinic_documents.filter((d) => d.clinicId === c.clinicId).map((d) => d.kind));
      if (!kinds.has('REGISTRATION') || !kinds.has('LICENSE')) throw new ApiError('BusinessRuleViolation', undefined, 'Qeydiyyat şəhadətnaməsi və lisenziya sənədi olmadan verifikasiya edilmir — əlavə sənəd tələb edin');
      const r = licenseRegistryCheck(c.licenseNumber);
      if (!r.found) throw new ApiError('BusinessRuleViolation', { registry: r }, r.message); // EF-901-2
      if (c.licenseExpiryDate < today()) throw new ApiError('LicenseExpired');
      set('ACTIVE');
      Object.assign(c, { verifiedBy: actor.userId, verifiedAt: clock.nowIso() });
      regenerateClinic(c);
      break;
    }
    case 'REQUEST_DOCUMENTS':
      // Alt 2: status dəyişmir, səbəb klinikaya bildirilir.
      notifyClinicAdmins(c, 'əlavə sənəd tələb olunur', input.reason);
      audit(actor, { action: 'REQUEST_CLINIC_DOCUMENTS', entityType: 'CLINIC', entityId: c.clinicId, reason: input.reason });
      return clinicDetail(actor, clinicId);
    case 'REJECT':
      // EF-901-4: saxta sənəd şübhəsi — müraciət rədd olunur, hadisə təhlükəsizlik reyestrinə yazılır.
      set('INACTIVE');
      securityEvent(actor, 'DOCUMENT_FRAUD', 'HIGH', `Klinika müraciəti rədd edildi (${c.name}): ${input.reason}`, null);
      for (const a of db.clinic_admins.filter((x) => x.clinicId === c.clinicId && x.status === 'INVITED')) Object.assign(a, { status: 'REMOVED', inviteToken: null, inviteExpiresAt: null });
      break;
    case 'SUSPEND':
      // Alt 3, BR-901-07: həkimlər axtarışdan çıxır (visibility), yeni randevu dayanır; mövcud randevular qalır.
      set('SUSPENDED');
      c.suspendedReason = 'ADMIN';
      break;
    case 'REACTIVATE':
      if (c.licenseExpiryDate < today()) throw new ApiError('LicenseExpired', undefined, 'Lisenziya müddəti bitib — əvvəlcə lisenziyanı yeniləyin');
      set('ACTIVE');
      c.suspendedReason = null;
      regenerateClinic(c);
      break;
    case 'DEACTIVATE': {
      // Alt 4, BR-901-08 / EF-901-6: aktiv randevusu olan klinika birbaşa deaktiv edilmir.
      const active = futureActive(c.clinicId);
      if (active.length && !input.conflictResolution) throw new ApiError('HasActiveAppointments', { count: active.length }, `Klinikanın ${active.length} aktiv randevusu var — əvvəlcə onları idarə edin`);
      for (const a of active) cancelAppointment(actor, a.appointmentId, 'Klinika platformada fəaliyyətini dayandırdı');
      set('INACTIVE');
      break;
    }
  }
  if (input.action !== 'VERIFY' || old !== 'ACTIVE') notifyClinicAdmins(c, CLINIC_STATUS_LABEL[c.status].toLowerCase(), input.reason);
  audit(actor, { action: `${input.action}_CLINIC`, entityType: 'CLINIC', entityId: c.clinicId, oldValue: { status: old }, newValue: { status: c.status }, reason: input.reason });
  return clinicDetail(actor, clinicId);
}

/** Alt 6: lisenziyanın yenilənməsi — lisenziya səbəbi ilə dayandırılmış klinika yenidən aktivləşir. */
export function renewClinicLicense(actor: Actor, clinicId: string, input: { licenseExpiryDate: string; document: { fileName: string; dataUrl: string }; reason?: string }) {
  const c = loadClinic(actor, clinicId);
  if (input.licenseExpiryDate < today()) throw new ApiError('LicenseExpired');
  storeDocument(actor, c.clinicId, { kind: 'LICENSE', ...input.document });
  const old = c.licenseExpiryDate;
  c.licenseExpiryDate = input.licenseExpiryDate;
  const reactivate = c.status === 'SUSPENDED' && c.suspendedReason === 'LICENSE_EXPIRED';
  if (reactivate) {
    c.status = 'ACTIVE';
    c.suspendedReason = null;
    regenerateClinic(c);
    notifyClinicAdmins(c, 'yenidən aktivdir', 'Lisenziya yeniləndi');
  }
  c.updatedAt = clock.nowIso();
  audit(actor, { action: 'RENEW_CLINIC_LICENSE', entityType: 'CLINIC', entityId: c.clinicId, oldValue: { licenseExpiryDate: old }, newValue: { licenseExpiryDate: c.licenseExpiryDate, reactivated: reactivate }, reason: input.reason ?? null });
  return clinicDetail(actor, clinicId);
}

// ── Job: klinika lisenziyası (EF-901-7, BR-901-06, FR-901-D) ──

export function checkClinicLicenses(): number {
  let changed = 0;
  const warnDays = getSetting('license_expiry_warning_days');
  const superAdmins = db.users.filter((u) => u.role === 'SUPER_ADMIN' && u.status === 'VERIFIED');
  for (const c of db.clinics.filter((x) => x.status === 'ACTIVE')) {
    const left = daysUntil(c.licenseExpiryDate);
    if (left < 0) {
      c.status = 'SUSPENDED';
      c.suspendedReason = 'LICENSE_EXPIRED';
      c.updatedAt = clock.nowIso();
      audit(SYSTEM_ACTOR, { action: 'AUTO_SUSPEND_CLINIC_LICENSE', entityType: 'CLINIC', entityId: c.clinicId, reason: `Lisenziya ${c.licenseExpiryDate} tarixində bitib` });
      notifyClinicAdmins(c, 'avtomatik dayandırıldı', 'Fəaliyyət lisenziyasının müddəti bitib');
      for (const u of superAdmins) notify({ type: 'CLINIC_STATUS_CHANGED', userId: u.userId, vars: { clinicName: c.name, status: 'avtomatik dayandırıldı', reason: 'Lisenziyanın müddəti bitib' }, deepLink: `/admin/clinics/${c.clinicId}` });
      changed++;
      continue;
    }
    if (![warnDays, 7, 1].includes(left)) continue;
    const key = `${c.licenseExpiryDate}:${left}`;
    if (db.audit_logs.some((l) => l.action === 'CLINIC_LICENSE_WARNING_SENT' && l.entityId === c.clinicId && (l.newValue as { key?: string } | null)?.key === key)) continue;
    const vars = { doctorName: c.name, days: String(left), expiresAt: c.licenseExpiryDate };
    for (const a of db.clinic_admins.filter((x) => x.clinicId === c.clinicId && x.status === 'ACTIVE')) notify({ type: 'LICENSE_EXPIRY_WARNING', userId: a.userId, vars, deepLink: '/clinic-admin/profile' });
    for (const u of superAdmins) notify({ type: 'LICENSE_EXPIRY_WARNING', userId: u.userId, vars, deepLink: `/admin/clinics/${c.clinicId}` });
    audit(SYSTEM_ACTOR, { action: 'CLINIC_LICENSE_WARNING_SENT', entityType: 'CLINIC', entityId: c.clinicId, newValue: { key } });
    changed++;
  }
  return changed;
}

// ── Klinika admini dəvətinin qəbulu (/invite/{token}, BR-901-05) ──

export function findAdminInvite(token: string) {
  const link = db.clinic_admins.find((a) => a.inviteToken === token && a.status === 'INVITED');
  if (!link) return null;
  if (!link.inviteExpiresAt || new Date(link.inviteExpiresAt).getTime() < clock.nowMs()) throw new ApiError('InviteExpired');
  return { link, user: db.users.find((u) => u.userId === link.userId)!, clinic: db.clinics.find((c) => c.clinicId === link.clinicId)! };
}

export function adminInviteInfo(inv: NonNullable<ReturnType<typeof findAdminInvite>>): InviteInfoDto {
  return {
    kind: 'CLINIC_ADMIN', clinicName: inv.clinic.name, clinicAddress: inv.clinic.address, fullName: `${inv.user.firstName} ${inv.user.lastName}`,
    maskedMobile: maskNumber(inv.user.mobileNumber), expiresAt: inv.link.inviteExpiresAt!, existingAccount: false,
  };
}

export function startAdminInviteSima(inv: NonNullable<ReturnType<typeof findAdminInvite>>): SimaSessionDto {
  return createSimaSession({ fin: inv.user.fin, mobileNumber: inv.user.mobileNumber, purpose: 'CLINIC_ADMIN_ONBOARDING', flowId: inv.link.clinicAdminId });
}

export function acceptAdminInvite(actor: Actor, inv: NonNullable<ReturnType<typeof findAdminInvite>>, input: { simaSessionId?: string; userPin: string; userPinConfirm?: string }, deviceInfo: string | null): AuthResultDto {
  const { link, user, clinic } = inv;
  if (!input.simaSessionId) throw new ApiError('SimaVerificationFailed');
  const s = findSession(input.simaSessionId);
  if (s.flowId !== link.clinicAdminId) denyAccess(actor, `sima ${input.simaSessionId}`);
  if (s.sessionStatus === 'EXPIRED') throw new ApiError('SimaSessionExpired');
  if (s.sessionStatus !== 'SUCCESS') throw new ApiError('SimaVerificationFailed');
  if (input.userPin !== input.userPinConfirm) throw new ApiError('PinMismatch');
  if (isWeakPin(input.userPin)) throw new ApiError('WeakPin');
  const p = s.callbackPayload as { firstName: string; lastName: string; fatherName: string | null; birthDate: string; gender: User['gender'] };
  Object.assign(user, { firstName: p.firstName, lastName: p.lastName, fatherName: p.fatherName, birthDate: p.birthDate, gender: p.gender, pinHash: hashSecret(input.userPin), status: 'VERIFIED', lastLoginAt: clock.nowIso(), updatedAt: clock.nowIso() });
  Object.assign(link, { status: 'ACTIVE', inviteToken: null, inviteExpiresAt: null });
  const a: Actor = { ...actor, userId: user.userId, role: 'CLINIC_ADMIN' };
  audit(a, { action: 'ACCEPT_CLINIC_ADMIN_INVITE', entityType: 'CLINIC', entityId: clinic.clinicId, newValue: { simaSessionId: s.simaSessionId } });
  const { token } = createSession(user, deviceInfo, actor.ip);
  return { token, user: currentUserDto(user), redirectTo: redirectFor(user) };
}

export function declineAdminInvite(actor: Actor, inv: NonNullable<ReturnType<typeof findAdminInvite>>) {
  Object.assign(inv.link, { status: 'REMOVED', inviteToken: null, inviteExpiresAt: null });
  audit(actor, { action: 'DECLINE_CLINIC_ADMIN_INVITE', entityType: 'CLINIC', entityId: inv.clinic.clinicId });
  for (const u of db.users.filter((x) => x.role === 'SUPER_ADMIN' && x.status === 'VERIFIED'))
    notify({ type: 'CLINIC_STATUS_CHANGED', userId: u.userId, vars: { clinicName: inv.clinic.name, status: 'admin dəvəti rədd edildi', reason: `${inv.user.firstName} ${inv.user.lastName}` }, deepLink: `/admin/clinics/${inv.clinic.clinicId}` });
  return { declined: true };
}
