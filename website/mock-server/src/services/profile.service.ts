import {
  CONSENT_VERSION,
  SIMA_FIELDS,
  type NotificationPreferenceDto,
  type NotificationType,
  type ProfileDto,
  type ProfileUpdateInput,
  type SessionDto,
  type SettingsResultDto,
  type UserRole,
  isWeakPin,
} from '@mediconnect/shared';
import type { z } from 'zod';
import type { allergyCreateSchema, chronicConditionCreateSchema, medicationsUpdateSchema } from '@mediconnect/shared';
import type { Actor } from '../core/actor';
import { audit } from '../core/audit';
import { revokeUserSessions } from '../core/auth';
import { addMinutes, clock } from '../core/clock';
import { hashSecret, verifySecret } from '../core/crypto';
import { ApiError } from '../core/errors';
import { db } from '../store/db';
import { newId } from '../store/repo';
import type { Patient, User } from '../store/types';
import { checkOtp, issueDeviceToken, maskNumber, revokeDeviceTokens, sendOtp } from './auth.service';
import { notify } from './notifications.service';
import { NOTIFICATION_CONFIG } from './notifications.config';

// UC-104 — profil, tibbi profil, parametrlər. Burada həmişə actor-un ÖZ datası ilə işlənir (sahiblik təbii təmin olunur).

function me(actor: Actor): User {
  const u = db.users.find((x) => x.userId === actor.userId);
  if (!u) throw new ApiError('Unauthorized');
  return u;
}

function myPatient(actor: Actor): Patient {
  const p = db.patients.find((x) => x.userId === actor.userId);
  if (!p) throw new ApiError('Forbidden');
  return p;
}

export function getProfile(actor: Actor): ProfileDto {
  const u = me(actor);
  const p = db.patients.find((x) => x.userId === u.userId) ?? null;
  return {
    userId: u.userId,
    role: u.role,
    fin: u.fin,
    firstName: u.firstName,
    lastName: u.lastName,
    fatherName: u.fatherName,
    birthDate: u.birthDate,
    gender: u.gender,
    mobileNumber: u.mobileNumber,
    email: u.email,
    photoUrl: u.photoUrl,
    preferredLanguage: u.preferredLanguage,
    biometricEnabled: u.biometricEnabled,
    deletionRequestedAt: u.deletionRequestedAt ?? null,
    patient: p && {
      bloodType: p.bloodType,
      address: p.address,
      secondaryPhone: p.secondaryPhone,
      emergencyContactName: p.emergencyContactName,
      emergencyContactPhone: p.emergencyContactPhone,
      medicalConsent: p.medicalConsent,
      consentGivenAt: p.consentGivenAt,
      consentVersion: p.consentVersion,
      regularMedications: p.regularMedications.map((m) => ({ name: m.name, drugId: m.drugId })),
      allergies: db.patient_allergies
        .filter((a) => a.patientId === p.patientId)
        .map(({ allergyId, allergenName, drugId, severity, notes }) => ({ allergyId, allergenName, drugId, severity, notes })),
      chronicConditions: db.patient_chronic_conditions
        .filter((c) => c.patientId === p.patientId)
        .map(({ conditionId, conditionName, icd10Code, diagnosedDate }) => ({ conditionId, conditionName, icd10Code, diagnosedDate })),
    },
  };
}

/** EF-104-1: SİMA sahələrinin redaktəsi cəhdi — açıq xəta (sxemin strict rejimindən əvvəl). */
export function rejectSimaFields(body: unknown) {
  if (!body || typeof body !== 'object') return;
  const touched = SIMA_FIELDS.filter((f) => f in body);
  if (touched.length) {
    throw new ApiError('ValidationError', { fields: Object.fromEntries(touched.map((f) => [f, 'validation.simaReadonly'])) });
  }
}

export function updateProfile(actor: Actor, input: ProfileUpdateInput): ProfileDto {
  const u = me(actor);
  const old: Record<string, unknown> = {};
  const userKeys = ['email', 'photoUrl'] as const;
  for (const k of userKeys) {
    if (input[k] !== undefined) {
      old[k] = k === 'photoUrl' ? (u.photoUrl ? '[şəkil]' : null) : u[k];
      u[k] = input[k] ?? null;
    }
  }
  const patientKeys = ['secondaryPhone', 'address', 'bloodType', 'emergencyContactName', 'emergencyContactPhone'] as const;
  if (patientKeys.some((k) => input[k] !== undefined)) {
    const p = myPatient(actor);
    for (const k of patientKeys) {
      if (input[k] !== undefined) {
        old[k] = p[k];
        p[k] = input[k] ?? null;
      }
    }
    p.updatedAt = clock.nowIso();
  }
  u.updatedAt = clock.nowIso();
  const newValue = { ...input, ...(input.photoUrl ? { photoUrl: '[şəkil]' } : {}) };
  audit(actor, { action: 'UPDATE_PROFILE', entityType: 'USER', entityId: u.userId, oldValue: old, newValue });
  return getProfile(actor);
}

// ── Tibbi profil (FR-104-07..12) ──

export function addAllergy(actor: Actor, input: z.infer<typeof allergyCreateSchema>) {
  const p = myPatient(actor);
  const row = { allergyId: newId(), patientId: p.patientId, allergenName: input.allergenName, drugId: input.drugId ?? null, severity: input.severity, notes: input.notes ?? null, createdAt: clock.nowIso() };
  db.patient_allergies.push(row);
  audit(actor, { action: 'ADD_ALLERGY', entityType: 'PATIENT', entityId: p.patientId, newValue: { allergenName: row.allergenName, severity: row.severity } });
  return getProfile(actor);
}

export function removeAllergy(actor: Actor, allergyId: string) {
  const p = myPatient(actor);
  const i = db.patient_allergies.findIndex((a) => a.allergyId === allergyId && a.patientId === p.patientId);
  if (i < 0) throw new ApiError('NotFound');
  const [row] = db.patient_allergies.splice(i, 1);
  audit(actor, { action: 'REMOVE_ALLERGY', entityType: 'PATIENT', entityId: p.patientId, oldValue: { allergenName: row.allergenName } });
  return getProfile(actor);
}

export function addChronicCondition(actor: Actor, input: z.infer<typeof chronicConditionCreateSchema>) {
  const p = myPatient(actor);
  db.patient_chronic_conditions.push({ conditionId: newId(), patientId: p.patientId, conditionName: input.conditionName, icd10Code: input.icd10Code ?? null, diagnosedDate: input.diagnosedDate ?? null, createdAt: clock.nowIso() });
  audit(actor, { action: 'ADD_CHRONIC_CONDITION', entityType: 'PATIENT', entityId: p.patientId, newValue: { conditionName: input.conditionName } });
  return getProfile(actor);
}

export function removeChronicCondition(actor: Actor, conditionId: string) {
  const p = myPatient(actor);
  const i = db.patient_chronic_conditions.findIndex((c) => c.conditionId === conditionId && c.patientId === p.patientId);
  if (i < 0) throw new ApiError('NotFound');
  db.patient_chronic_conditions.splice(i, 1);
  audit(actor, { action: 'REMOVE_CHRONIC_CONDITION', entityType: 'PATIENT', entityId: p.patientId });
  return getProfile(actor);
}

export function updateMedications(actor: Actor, input: z.infer<typeof medicationsUpdateSchema>) {
  const p = myPatient(actor);
  const old = p.regularMedications;
  p.regularMedications = input.regularMedications.map((m) => ({ name: m.name, drugId: m.drugId ?? null }));
  p.updatedAt = clock.nowIso();
  audit(actor, { action: 'UPDATE_MEDICATIONS', entityType: 'PATIENT', entityId: p.patientId, oldValue: old, newValue: p.regularMedications });
  return getProfile(actor);
}

// ── Telefon dəyişikliyi (BR-104-02: OTP tələb olunur) ──

export function phoneChangeInitiate(actor: Actor, mobileNumber: string) {
  const u = me(actor);
  if (u.mobileNumber === mobileNumber) throw new ApiError('ValidationError', { fields: { mobileNumber: 'Yeni nömrə cari nömrə ilə eynidir' } });
  if (db.users.some((x) => x.mobileNumber === mobileNumber && x.status !== 'DELETED')) throw new ApiError('DuplicateAccount');
  const otp = sendOtp(mobileNumber, 'PHONE_CHANGE');
  const flow = {
    flowId: newId(), kind: 'PHONE_CHANGE' as const, mobileNumber, fin: null, userId: u.userId, otpId: otp.otpId, otpVerified: false,
    simaSessionId: null, returnUrl: null, expiresAt: addMinutes(clock.now(), 30).toISOString(), completedAt: null, createdAt: clock.nowIso(),
  };
  db.auth_flows.push(flow);
  return { changeId: flow.flowId, otpExpiresAt: otp.expiresAt, maskedNumber: maskNumber(mobileNumber) };
}

export function phoneChangeConfirm(actor: Actor, changeId: string, otpCode: string) {
  const u = me(actor);
  const flow = db.auth_flows.find((f) => f.flowId === changeId && f.kind === 'PHONE_CHANGE' && f.userId === u.userId && !f.completedAt);
  if (!flow || new Date(flow.expiresAt).getTime() <= clock.nowMs()) throw new ApiError('NotFound');
  checkOtp(flow.otpId, otpCode);
  if (db.users.some((x) => x.mobileNumber === flow.mobileNumber && x.status !== 'DELETED')) throw new ApiError('DuplicateAccount');
  const old = u.mobileNumber;
  u.mobileNumber = flow.mobileNumber;
  u.updatedAt = clock.nowIso();
  flow.completedAt = clock.nowIso();
  audit(actor, { action: 'CHANGE_PHONE', entityType: 'USER', entityId: u.userId, oldValue: { mobileNumber: maskNumber(old) }, newValue: { mobileNumber: maskNumber(u.mobileNumber) } });
  return getProfile(actor);
}

// ── Razılıq (FR-104-18, BR-104-04) ──

export function updateConsent(actor: Actor, medicalConsent: boolean, consentVersion = CONSENT_VERSION) {
  const p = myPatient(actor);
  const old = p.medicalConsent;
  p.medicalConsent = medicalConsent;
  p.consentGivenAt = medicalConsent ? clock.nowIso() : p.consentGivenAt;
  p.consentVersion = medicalConsent ? consentVersion : p.consentVersion;
  p.updatedAt = clock.nowIso();
  audit(actor, { action: medicalConsent ? 'GIVE_CONSENT' : 'WITHDRAW_CONSENT', entityType: 'PATIENT', entityId: p.patientId, oldValue: { medicalConsent: old }, newValue: { medicalConsent, consentVersion } });
  return getProfile(actor);
}

/** Tibbi funksiyalar (sənəd, resept) üçün razılıq tələbi — EF-501-6. Sonrakı mərhələlər istifadə edir. */
export function requireMedicalConsent(userId: string) {
  const p = db.patients.find((x) => x.userId === userId);
  if (p && !p.medicalConsent) throw new ApiError('ConsentRequired', { redirectTo: '/account/settings' });
}

// ── Parametrlər ──

export function updateSettings(actor: Actor, input: { preferredLanguage?: 'az' | 'ru' | 'en'; biometricEnabled?: boolean; deviceId?: string }): SettingsResultDto {
  const u = me(actor);
  let deviceToken: string | null = null;
  if (input.preferredLanguage) u.preferredLanguage = input.preferredLanguage;
  if (input.biometricEnabled !== undefined) {
    if (input.biometricEnabled) deviceToken = issueDeviceToken(u.userId, input.deviceId ?? null);
    else revokeDeviceTokens(u.userId);
    u.biometricEnabled = input.biometricEnabled;
  }
  u.updatedAt = clock.nowIso();
  audit(actor, { action: 'UPDATE_SETTINGS', entityType: 'USER', entityId: u.userId, newValue: { preferredLanguage: input.preferredLanguage, biometricEnabled: input.biometricEnabled } });
  return { preferredLanguage: u.preferredLanguage, biometricEnabled: u.biometricEnabled, deviceToken };
}

export function changePin(actor: Actor, currentSessionId: string, input: { currentPin: string; newPin: string; newPinConfirm: string }) {
  const u = me(actor);
  if (!verifySecret(input.currentPin, u.pinHash)) throw new ApiError('InvalidPin');
  if (input.newPin !== input.newPinConfirm) throw new ApiError('PinMismatch');
  if (isWeakPin(input.newPin)) throw new ApiError('WeakPin');
  if (input.newPin === input.currentPin) throw new ApiError('PinSameAsOld');
  u.pinHash = hashSecret(input.newPin);
  u.updatedAt = clock.nowIso();
  revokeUserSessions(u.userId, currentSessionId); // digər cihazlardakı sessiyalar bağlanır
  notify({ type: 'PIN_CHANGED', userId: u.userId });
  audit(actor, { action: 'CHANGE_PIN', entityType: 'USER', entityId: u.userId });
}

// ── Bildiriş tərcihləri (FR-104-13/14, UC-1001 alt 3) ──

const ROLE_TYPES: Record<UserRole, NotificationType[]> = {
  PATIENT: ['APPOINTMENT_CONFIRMED', 'APPOINTMENT_REQUESTED', 'RESCHEDULE_PROPOSED', 'APPOINTMENT_CANCELLED', 'APPOINTMENT_RESCHEDULED', 'APPOINTMENT_REJECTED', 'REMINDER_24H', 'REMINDER_2H', 'PRESCRIPTION_CREATED', 'PRESCRIPTION_CANCELLED', 'PRESCRIPTION_RENEWAL_REJECTED', 'REVIEW_INVITE', 'REVIEW_MODERATED', 'NO_SHOW_RECORDED', 'SECURITY_NEW_DEVICE', 'PIN_CHANGED', 'ACCOUNT_STATUS_CHANGED'],
  DOCTOR: ['CLINIC_DOCTOR_STATUS_CHANGED', 'NEW_APPOINTMENT', 'APPOINTMENT_PENDING', 'APPOINTMENT_CANCELLED', 'APPOINTMENT_RESCHEDULED', 'DOCUMENT_SHARED', 'PRESCRIPTION_RENEWAL_REQUESTED', 'REVIEW_PUBLISHED', 'REVIEW_REPLY_MODERATED', 'SCHEDULE_CHANGED', 'LICENSE_EXPIRY_WARNING', 'SECURITY_NEW_DEVICE', 'PIN_CHANGED', 'ACCOUNT_STATUS_CHANGED'],
  CLINIC_ADMIN: ['CLINIC_STATUS_CHANGED', 'DOCTOR_INVITE_ACCEPTED', 'DOCTOR_INVITE_DECLINED', 'DOCTOR_PROFILE_COMPLETED', 'LICENSE_EXPIRY_WARNING', 'SECURITY_NEW_DEVICE', 'PIN_CHANGED', 'ACCOUNT_STATUS_CHANGED'],
  SUPER_ADMIN: ['CLINIC_STATUS_CHANGED', 'LICENSE_EXPIRY_WARNING', 'SECURITY_NEW_DEVICE', 'PIN_CHANGED', 'ACCOUNT_STATUS_CHANGED'],
};

export function getNotificationPreferences(actor: Actor): NotificationPreferenceDto[] {
  const u = me(actor);
  return ROLE_TYPES[u.role].map((type) => {
    const cfg = NOTIFICATION_CONFIG[type];
    const pref = db.notification_preferences.find((p) => p.userId === u.userId && p.notificationType === type);
    const channels = cfg.channels.filter((c): c is 'SMS' | 'PUSH' | 'EMAIL' => c !== 'IN_APP');
    return {
      notificationType: type,
      label: cfg.label,
      channels,
      smsEnabled: cfg.mandatory || (pref?.smsEnabled ?? true),
      pushEnabled: cfg.mandatory || (pref?.pushEnabled ?? true),
      emailEnabled: cfg.mandatory || (pref?.emailEnabled ?? true),
      isMandatory: cfg.mandatory,
    };
  });
}

export function updateNotificationPreferences(actor: Actor, prefs: { notificationType: string; smsEnabled: boolean; pushEnabled: boolean; emailEnabled: boolean }[]) {
  const u = me(actor);
  const allowed = new Set(ROLE_TYPES[u.role]);
  for (const p of prefs) {
    const type = p.notificationType as NotificationType;
    if (!allowed.has(type)) continue;
    // BR-1001-01/02: məcburi bildirişlər söndürülə bilməz — dəyişiklik sakitcə nəzərə alınmır.
    if (NOTIFICATION_CONFIG[type].mandatory) continue;
    const row = db.notification_preferences.find((x) => x.userId === u.userId && x.notificationType === type);
    if (row) Object.assign(row, { smsEnabled: p.smsEnabled, pushEnabled: p.pushEnabled, emailEnabled: p.emailEnabled });
    else db.notification_preferences.push({ preferenceId: newId(), userId: u.userId, notificationType: type, smsEnabled: p.smsEnabled, pushEnabled: p.pushEnabled, emailEnabled: p.emailEnabled, isMandatory: false });
  }
  audit(actor, { action: 'UPDATE_NOTIFICATION_PREFERENCES', entityType: 'USER', entityId: u.userId });
  return getNotificationPreferences(actor);
}

// ── Sessiyalar (FR-102-10) ──

export function listSessions(actor: Actor, currentSessionId: string): SessionDto[] {
  return db.user_sessions
    .filter((s) => s.userId === actor.userId && !s.revokedAt && new Date(s.expiresAt).getTime() > clock.nowMs())
    .sort((a, b) => b.lastSeenAt.localeCompare(a.lastSeenAt))
    .map((s) => ({ sessionId: s.sessionId, deviceInfo: s.deviceInfo, ipAddress: s.ipAddress, createdAt: s.createdAt, lastSeenAt: s.lastSeenAt, current: s.sessionId === currentSessionId }));
}

export function revokeSession(actor: Actor, sessionId: string) {
  const s = db.user_sessions.find((x) => x.sessionId === sessionId && x.userId === actor.userId);
  if (!s) throw new ApiError('NotFound');
  s.revokedAt = clock.nowIso();
  audit(actor, { action: 'REVOKE_SESSION', entityType: 'USER_SESSION', entityId: sessionId });
}

// ── Hesabın silinməsi tələbi (FR-104-19/20, BR-104-05) ──

export function requestAccountDeletion(actor: Actor, reason?: string) {
  const u = me(actor);
  const p = myPatient(actor);
  const active = db.appointments.filter((a) => a.patientId === p.patientId && ['PENDING', 'CONFIRMED'].includes(a.status) && new Date(a.startAt).getTime() > clock.nowMs());
  if (active.length) throw new ApiError('HasActiveAppointments', { count: active.length }); // EF-104-3
  u.deletionRequestedAt = clock.nowIso();
  audit(actor, { action: 'REQUEST_ACCOUNT_DELETION', entityType: 'USER', entityId: u.userId, reason: reason ?? null });
  return getProfile(actor);
}

export function cancelAccountDeletion(actor: Actor) {
  const u = me(actor);
  u.deletionRequestedAt = null;
  audit(actor, { action: 'CANCEL_ACCOUNT_DELETION', entityType: 'USER', entityId: u.userId });
  return getProfile(actor);
}
