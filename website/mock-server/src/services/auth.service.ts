import {
  CONSENT_VERSION,
  isWeakPin,
  ROLE_HOME,
  type AuthResultDto,
  type FlowStartedDto,
  type LoginInput,
  type LoginLookupDto,
  type OtpPurpose,
  type RegisterCompleteInput,
  type RegisterInitiateInput,
  type SimaSessionDto,
} from '@mediconnect/shared';
import type { Actor } from '../core/actor';
import { audit, securityEvent } from '../core/audit';
import { createSession, revokeUserSessions } from '../core/auth';
import { addMinutes, clock } from '../core/clock';
import { hashSecret, randomDigits, randomToken, sha256, verifySecret } from '../core/crypto';
import { ApiError } from '../core/errors';
import { getSetting } from '../core/settings';
import { currentUserDto } from '../serializers/user';
import { db } from '../store/db';
import { newId } from '../store/repo';
import type { AuthFlow, OtpVerification, User } from '../store/types';
import { notify } from './notifications.service';
import { createSimaSession, findSession } from './sima.service';

// UC-101 qeydiyyat, UC-102 giriş, UC-103 PIN bərpası. Axın vəziyyəti auth_flows-da saxlanılır.

const FLOW_TTL_MINUTES = 30;
const MAX_OTP_ATTEMPTS = 5;

export const maskNumber = (n: string) => `${n.slice(0, 4)} ${n.slice(4, 6)} *** ** ${n.slice(-2)}`;

const activeUsers = () => db.users.filter((u) => u.status !== 'DELETED');

// ── OTP ──

function lastOtp(mobileNumber: string, purpose: OtpPurpose) {
  return db.otp_verifications.filter((o) => o.mobileNumber === mobileNumber && o.purpose === purpose).at(-1);
}

/** OTP yaradır və SMS-lə göndərir. Kod heç vaxt API cavabında qaytarılmır (FR-101-16), yalnız hash saxlanılır (FR-101-17). */
export function sendOtp(mobileNumber: string, purpose: OtpPurpose): OtpVerification {
  const prev = lastOtp(mobileNumber, purpose);
  const interval = getSetting('otp_resend_interval_seconds');
  if (prev && clock.nowMs() - new Date(prev.createdAt).getTime() < interval * 1000) {
    throw new ApiError('OtpResendTooSoon', { resendAvailableAt: new Date(new Date(prev.createdAt).getTime() + interval * 1000).toISOString() });
  }
  const code = randomDigits(6);
  const otp: OtpVerification = {
    otpId: newId(),
    mobileNumber,
    otpHash: hashSecret(code),
    purpose,
    attemptCount: 0,
    isVerified: false,
    expiresAt: addMinutes(clock.now(), getSetting('otp_validity_seconds') / 60).toISOString(),
    createdAt: clock.nowIso(),
  };
  // EF-101-6: SMS çatdırılmırsa xəta qaytarılır, istifadəçi yenidən cəhd edir.
  const { delivered } = notify({ type: 'OTP_CODE', to: mobileNumber, vars: { code } });
  if (!delivered) throw new ApiError('ServiceUnavailable');
  db.otp_verifications.push(otp);
  return otp;
}

function flowStarted(flow: AuthFlow, otp: OtpVerification): FlowStartedDto {
  return {
    flowId: flow.flowId,
    otpExpiresAt: otp.expiresAt,
    resendAvailableAt: new Date(new Date(otp.createdAt).getTime() + getSetting('otp_resend_interval_seconds') * 1000).toISOString(),
    maskedNumber: maskNumber(flow.mobileNumber),
  };
}

function findFlow(flowId: string | undefined, kind: AuthFlow['kind']): AuthFlow {
  const flow = flowId ? db.auth_flows.find((f) => f.flowId === flowId && f.kind === kind) : undefined;
  if (!flow || flow.completedAt || new Date(flow.expiresAt).getTime() <= clock.nowMs()) throw new ApiError('NotFound');
  return flow;
}

function newFlow(p: Pick<AuthFlow, 'kind' | 'mobileNumber' | 'fin' | 'userId' | 'returnUrl'>): AuthFlow {
  const flow: AuthFlow = {
    flowId: newId(),
    ...p,
    otpId: null,
    otpVerified: false,
    simaSessionId: null,
    expiresAt: addMinutes(clock.now(), FLOW_TTL_MINUTES).toISOString(),
    completedAt: null,
    createdAt: clock.nowIso(),
  };
  db.auth_flows.push(flow);
  return flow;
}

const flowKindOf = (ref: { registrationId?: string; resetId?: string }) =>
  ref.registrationId ? { id: ref.registrationId, kind: 'REGISTRATION' as const } : { id: ref.resetId, kind: 'PIN_RESET' as const };

export function resendOtp(ref: { registrationId?: string; resetId?: string }): FlowStartedDto {
  const { id, kind } = flowKindOf(ref);
  const flow = findFlow(id, kind);
  const otp = sendOtp(flow.mobileNumber, kind === 'REGISTRATION' ? 'REGISTRATION' : 'PIN_RESET');
  flow.otpId = otp.otpId;
  flow.otpVerified = false;
  return flowStarted(flow, otp);
}

/** OTP yoxlaması (UC-101, UC-103, UC-104 telefon dəyişikliyi). */
export function checkOtp(otpId: string | null, code: string) {
  const otp = db.otp_verifications.find((o) => o.otpId === otpId);
  if (!otp || otp.isVerified) throw new ApiError('InvalidOtp');
  if (new Date(otp.expiresAt).getTime() <= clock.nowMs()) throw new ApiError('InvalidOtp', { expired: true });
  if (otp.attemptCount >= MAX_OTP_ATTEMPTS) throw new ApiError('InvalidOtp', { resendRequired: true });
  if (!verifySecret(code, otp.otpHash)) {
    otp.attemptCount++;
    throw new ApiError('InvalidOtp', { remainingAttempts: MAX_OTP_ATTEMPTS - otp.attemptCount });
  }
  otp.isVerified = true;
}

export function verifyOtp(ref: { registrationId?: string; resetId?: string; otpCode: string }) {
  const { id, kind } = flowKindOf(ref);
  const flow = findFlow(id, kind);
  checkOtp(flow.otpId, ref.otpCode);
  flow.otpVerified = true;
  return { verified: true as const };
}

export function startSima(ref: { registrationId?: string; resetId?: string }): SimaSessionDto {
  const { id, kind } = flowKindOf(ref);
  const flow = findFlow(id, kind);
  // SİMA mərhələsinə yalnız telefon təsdiqləndikdən sonra keçilir.
  if (!flow.otpVerified || !flow.fin) throw new ApiError('InvalidStatusTransition');
  const dto = createSimaSession({ fin: flow.fin, mobileNumber: flow.mobileNumber, purpose: kind, flowId: flow.flowId, returnUrl: flow.returnUrl });
  flow.simaSessionId = dto.simaSessionId;
  return dto;
}

/** Axına aid uğurlu SİMA sessiyası olmalıdır (BR-101-05, BR-103-01). */
function requireSimaSuccess(flow: AuthFlow, simaSessionId: string) {
  const s = findSession(simaSessionId);
  if (s.flowId !== flow.flowId) throw new ApiError('NotFound');
  if (s.sessionStatus === 'FAILED') throw new ApiError(s.purpose === 'PIN_RESET' && s.failureReason?.includes('FIN') ? 'FinMismatch' : 'SimaVerificationFailed');
  if (s.sessionStatus === 'EXPIRED') throw new ApiError('SimaSessionExpired');
  if (s.sessionStatus !== 'SUCCESS') throw new ApiError('SimaVerificationFailed');
  return s;
}

function checkNewPin(pin: string, confirm: string) {
  if (pin !== confirm) throw new ApiError('PinMismatch');
  if (isWeakPin(pin)) throw new ApiError('WeakPin');
}

// ── UC-101 qeydiyyat ──

export function registerInitiate(actor: Actor, input: RegisterInitiateInput): FlowStartedDto {
  // BR-101-01, BR-101-02 / EF-101-1: mövcud hesab → login-ə yönləndirmə (client).
  if (activeUsers().some((u) => u.fin === input.pin || u.mobileNumber === input.mobileNumber)) {
    throw new ApiError('DuplicateAccount', { redirectTo: '/login' });
  }
  const flow = newFlow({ kind: 'REGISTRATION', mobileNumber: input.mobileNumber, fin: input.pin, userId: null, returnUrl: input.returnUrl ?? null });
  const otp = sendOtp(flow.mobileNumber, 'REGISTRATION');
  flow.otpId = otp.otpId;
  audit(actor, { action: 'REGISTRATION_STARTED', entityType: 'AUTH_FLOW', entityId: flow.flowId, newValue: { mobileNumber: maskNumber(flow.mobileNumber) } });
  return flowStarted(flow, otp);
}

/** SİMA uğursuz olanda qeydiyyat məlumatları silinir (EF-101-3). Status sorğusu bunu çağırır. */
export function discardFailedRegistration(flowId: string | null) {
  const flow = flowId ? db.auth_flows.find((f) => f.flowId === flowId && f.kind === 'REGISTRATION') : null;
  if (flow && !flow.completedAt) {
    flow.fin = null;
    flow.expiresAt = clock.nowIso();
  }
}

export function registerComplete(actor: Actor, input: RegisterCompleteInput, deviceInfo: string | null): AuthResultDto {
  const flow = findFlow(input.registrationId, 'REGISTRATION');
  const sima = requireSimaSuccess(flow, input.simaSessionId);
  checkNewPin(input.userPin, input.userPinConfirm);
  // BR-101-08: tibbi razılıq olmadan hesab aktivləşmir.
  if (!input.medicalConsent) throw new ApiError('ValidationError', { fields: { medicalConsent: 'validation.consent' } });
  if (activeUsers().some((u) => u.fin === flow.fin || u.mobileNumber === flow.mobileNumber)) throw new ApiError('DuplicateAccount', { redirectTo: '/login' });

  const person = sima.callbackPayload as { fin: string; firstName: string; lastName: string; fatherName: string | null; birthDate: string; gender: 'MALE' | 'FEMALE' };
  const now = clock.nowIso();
  const user: User = {
    userId: newId(),
    fin: person.fin,
    mobileNumber: flow.mobileNumber,
    firstName: person.firstName,
    lastName: person.lastName,
    fatherName: person.fatherName,
    birthDate: person.birthDate,
    gender: person.gender,
    pinHash: hashSecret(input.userPin),
    role: 'PATIENT',
    status: 'VERIFIED',
    email: null,
    photoUrl: null,
    biometricEnabled: input.biometricEnabled,
    preferredLanguage: 'az',
    failedLoginAttempts: 0,
    lockedUntil: null,
    lastLoginAt: now,
    blockedReason: null,
    deletionRequestedAt: null,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
  };
  db.users.push(user);
  db.patients.push({
    patientId: newId(),
    userId: user.userId,
    bloodType: null,
    address: null,
    secondaryPhone: null,
    emergencyContactName: null,
    emergencyContactPhone: null,
    medicalConsent: true,
    consentGivenAt: now,
    consentVersion: input.consentVersion || CONSENT_VERSION,
    noShowCount: 0,
    regularMedications: [],
    createdAt: now,
    updatedAt: now,
  });
  flow.completedAt = now;
  flow.userId = user.userId;

  const { token } = createSession(user, deviceInfo, actor.ip);
  const deviceToken = input.biometricEnabled ? issueDeviceToken(user.userId, input.deviceId ?? null) : null;
  const a = { ...actor, userId: user.userId, role: user.role };
  audit(a, { action: 'SIMA_VERIFIED', entityType: 'USER', entityId: user.userId, newValue: { simaSessionId: sima.simaSessionId } });
  audit(a, { action: 'REGISTER', entityType: 'USER', entityId: user.userId, newValue: { role: 'PATIENT', consentVersion: input.consentVersion } });
  notify({ type: 'REGISTRATION_COMPLETED', userId: user.userId, deepLink: '/search/doctors' });
  return { token, user: currentUserDto(user), redirectTo: flow.returnUrl ?? ROLE_HOME.PATIENT, deviceToken };
}

// ── Biometrik giriş (F9) ──

export function issueDeviceToken(userId: string, deviceId: string | null): string {
  const token = randomToken();
  db.trusted_devices.push({ trustedDeviceId: newId(), userId, deviceId, tokenHash: sha256(token), revokedAt: null, createdAt: clock.nowIso() });
  return token;
}

export function revokeDeviceTokens(userId: string) {
  for (const d of db.trusted_devices) if (d.userId === userId && !d.revokedAt) d.revokedAt = clock.nowIso();
}

// ── UC-102 giriş ──

function assertCanLogin(user: User) {
  if (user.status === 'BLOCKED' || user.status === 'SUSPENDED' || user.status === 'DELETED') throw new ApiError('AccountBlocked');
  if (user.lockedUntil && new Date(user.lockedUntil).getTime() > clock.nowMs()) throw new ApiError('AccountLocked', { lockedUntil: user.lockedUntil });
}

export function loginLookup(mobileNumber: string): LoginLookupDto {
  const user = activeUsers().find((u) => u.mobileNumber === mobileNumber);
  if (!user) throw new ApiError('AccountNotFound', { registerUrl: '/register' });
  if (user.status === 'BLOCKED' || user.status === 'SUSPENDED') throw new ApiError('AccountBlocked');
  const locked = user.lockedUntil && new Date(user.lockedUntil).getTime() > clock.nowMs() ? user.lockedUntil : null;
  return { exists: true, firstName: user.firstName, status: user.status, lockedUntil: locked, biometricEnabled: user.biometricEnabled };
}

export function redirectFor(user: User): string {
  if (user.role === 'DOCTOR') {
    const doc = db.doctors.find((d) => d.userId === user.userId);
    if (doc && !doc.profileCompleted) return '/doctor/profile'; // UC-701: ilk girişdə profil tamamlama
  }
  return ROLE_HOME[user.role];
}

export function login(actor: Actor, input: LoginInput, userAgent: string | null): AuthResultDto {
  const user = activeUsers().find((u) => u.mobileNumber === input.mobileNumber);
  if (!user) throw new ApiError('AccountNotFound', { registerUrl: '/register' });
  const a: Actor = { ...actor, userId: user.userId, role: user.role };
  assertCanLogin(user);

  let ok = false;
  let method: 'PIN' | 'BIOMETRIC' = 'PIN';
  if (input.deviceToken) {
    const hash = sha256(input.deviceToken);
    ok = user.biometricEnabled && db.trusted_devices.some((d) => d.userId === user.userId && !d.revokedAt && d.tokenHash === hash);
    method = 'BIOMETRIC';
    // EF-102-5: biometrik uğursuzdursa PIN-ə keçid (cəhd sayılmır).
    if (!ok) throw new ApiError('Unauthorized', { fallbackToPin: true });
  } else if (input.userPin) {
    ok = verifySecret(input.userPin, user.pinHash);
  }

  if (!ok) {
    // BR-102-02 / EF-102-4: 5 uğursuz cəhd → 30 dəqiqə blok + bildiriş.
    user.failedLoginAttempts++;
    const max = getSetting('max_login_attempts');
    securityEvent(a, 'FAILED_LOGIN', user.failedLoginAttempts >= max ? 'HIGH' : 'LOW', `Yanlış PIN (${user.failedLoginAttempts}/${max})`);
    audit(a, { action: 'LOGIN_FAILED', entityType: 'USER', entityId: user.userId, newValue: { attempt: user.failedLoginAttempts } });
    if (user.failedLoginAttempts >= max) {
      user.failedLoginAttempts = 0;
      user.lockedUntil = addMinutes(clock.now(), getSetting('login_lockout_minutes')).toISOString();
      notify({ type: 'ACCOUNT_STATUS_CHANGED', userId: user.userId, vars: { status: `${getSetting('login_lockout_minutes')} dəqiqəlik müvəqqəti blok (çoxsaylı yanlış PIN)` } });
      throw new ApiError('AccountLocked', { lockedUntil: user.lockedUntil });
    }
    throw new ApiError('InvalidPin', { remainingAttempts: max - user.failedLoginAttempts });
  }

  user.failedLoginAttempts = 0;
  user.lockedUntil = null;
  user.lastLoginAt = clock.nowIso();
  const deviceId = input.deviceId ?? null;
  const knownDevice = deviceId ? db.user_sessions.some((s) => s.userId === user.userId && s.deviceInfo?.startsWith(deviceId)) : false;
  const hadSessions = db.user_sessions.some((s) => s.userId === user.userId);
  const deviceInfo = [deviceId, userAgent?.slice(0, 120)].filter(Boolean).join(' · ') || null;
  const { token } = createSession(user, deviceInfo, actor.ip);
  // FR-102-13: yeni cihazdan girişdə təhlükəsizlik bildirişi.
  if (hadSessions && !knownDevice) notify({ type: 'SECURITY_NEW_DEVICE', userId: user.userId, deepLink: settingsPath(user) });
  audit(a, { action: 'LOGIN', entityType: 'USER', entityId: user.userId, newValue: { method } });
  return { token, user: currentUserDto(user), redirectTo: redirectFor(user) };
}

const settingsPath = (u: User) => (u.role === 'PATIENT' ? '/account/settings' : null);

// ── UC-103 PIN bərpası ──

export function pinResetInitiate(actor: Actor, mobileNumber: string): FlowStartedDto {
  const user = activeUsers().find((u) => u.mobileNumber === mobileNumber);
  if (!user) throw new ApiError('AccountNotFound'); // EF-103-3
  if (user.status === 'BLOCKED' || user.status === 'SUSPENDED') throw new ApiError('AccountBlocked');
  const flow = newFlow({ kind: 'PIN_RESET', mobileNumber, fin: user.fin, userId: user.userId, returnUrl: null });
  const otp = sendOtp(mobileNumber, 'PIN_RESET');
  flow.otpId = otp.otpId;
  audit({ ...actor, userId: user.userId, role: user.role }, { action: 'PIN_RESET_STARTED', entityType: 'USER', entityId: user.userId });
  return flowStarted(flow, otp);
}

export function pinReset(actor: Actor, input: { resetId: string; simaSessionId: string; newPin: string; newPinConfirm: string }) {
  const flow = findFlow(input.resetId, 'PIN_RESET');
  requireSimaSuccess(flow, input.simaSessionId);
  const user = db.users.find((u) => u.userId === flow.userId);
  if (!user) throw new ApiError('NotFound');
  checkNewPin(input.newPin, input.newPinConfirm);
  if (verifySecret(input.newPin, user.pinHash)) throw new ApiError('PinSameAsOld'); // BR-103-04
  user.pinHash = hashSecret(input.newPin);
  user.failedLoginAttempts = 0;
  user.lockedUntil = null;
  user.updatedAt = clock.nowIso();
  revokeUserSessions(user.userId); // BR-103-03
  revokeDeviceTokens(user.userId);
  flow.completedAt = clock.nowIso();
  notify({ type: 'PIN_CHANGED', userId: user.userId });
  audit({ ...actor, userId: user.userId, role: user.role }, { action: 'PIN_RESET', entityType: 'USER', entityId: user.userId });
  return { redirectTo: '/login' };
}
