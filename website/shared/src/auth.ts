import { z } from 'zod';
import type { AllergySeverity, Gender, Language, NotificationType, SimaSessionStatus, UserRole, UserStatus } from './enums';
import { ALLERGY_SEVERITY, LANGUAGE } from './enums';
import { finSchema, mobileNumberSchema, otpCodeSchema, returnUrlSchema, userPinSchema } from './schemas';

// Modul 1 — Authentication & User Management (UC-101..104). Request sxemləri + cavab DTO-ları.

// ── UC-101 qeydiyyat ──
export const registerInitiateSchema = z.object({
  mobileNumber: mobileNumberSchema,
  /** FIN — spec API adı `pin`. */
  pin: finSchema,
  returnUrl: returnUrlSchema.optional().nullable(),
});
export type RegisterInitiateInput = z.infer<typeof registerInitiateSchema>;

/** Çoxaddımlı axın identifikatoru: qeydiyyatda registrationId, PIN bərpasında resetId. */
const flowRef = {
  registrationId: z.string().uuid().optional(),
  resetId: z.string().uuid().optional(),
};

export const otpVerifySchema = z.object({ ...flowRef, otpCode: otpCodeSchema });
export const otpResendSchema = z.object({ ...flowRef });
export const simaSessionCreateSchema = z.object({ ...flowRef, inviteToken: z.string().optional() });

export const registerCompleteSchema = z.object({
  registrationId: z.string().uuid(),
  simaSessionId: z.string().uuid(),
  userPin: userPinSchema,
  userPinConfirm: userPinSchema,
  medicalConsent: z.boolean(),
  consentVersion: z.string().max(10).default('1.0'),
  biometricEnabled: z.boolean().default(false),
  deviceId: z.string().max(100).optional(),
});
export type RegisterCompleteInput = z.infer<typeof registerCompleteSchema>;

export interface FlowStartedDto {
  /** registrationId və ya resetId (endpoint-ə görə). */
  flowId: string;
  otpExpiresAt: string;
  resendAvailableAt: string;
  /** Maskalanmış nömrə: +994 50 *** ** 20 */
  maskedNumber: string;
}

export interface OtpVerifiedDto {
  verified: true;
}

export interface SimaSessionDto {
  simaSessionId: string;
  qrToken: string;
  qrPayload: string;
  expiresAt: string;
}

export interface SimaProfileDto {
  fin: string;
  firstName: string;
  lastName: string;
  fatherName: string | null;
  birthDate: string;
  gender: Gender;
}

export interface SimaSessionStatusDto {
  simaSessionId: string;
  sessionStatus: SimaSessionStatus;
  expiresAt: string;
  /** SUCCESS olanda SİMA-dan gələn məlumatlar (read-only göstərilir). */
  profile: SimaProfileDto | null;
  /** FAILED olanda səbəb (FIN uyğunsuzluğu, üz tanıma uğursuz). */
  failureReason: string | null;
}

// ── UC-102 giriş ──
export const loginLookupSchema = z.object({ mobileNumber: mobileNumberSchema });

export interface LoginLookupDto {
  exists: true;
  firstName: string;
  status: UserStatus;
  lockedUntil: string | null;
  biometricEnabled: boolean;
}

export const loginSchema = z
  .object({
    mobileNumber: mobileNumberSchema,
    userPin: userPinSchema.optional(),
    /** Biometrik giriş (F9): cihazda saxlanan etibarlı cihaz tokeni. */
    deviceToken: z.string().max(200).optional(),
    deviceId: z.string().max(100).optional(),
  })
  .refine((v) => v.userPin || v.deviceToken, { message: 'validation.userPin', path: ['userPin'] });
export type LoginInput = z.infer<typeof loginSchema>;

// ── UC-103 PIN bərpası ──
export const pinResetInitiateSchema = z.object({ mobileNumber: mobileNumberSchema });
export const pinResetSchema = z.object({
  resetId: z.string().uuid(),
  simaSessionId: z.string().uuid(),
  newPin: userPinSchema,
  newPinConfirm: userPinSchema,
});

// ── UC-104 profil ──
/** SİMA-dan gələn, redaktə olunmayan sahələr (BR-101-07, BR-104-01). */
export const SIMA_FIELDS = ['fin', 'pin', 'firstName', 'lastName', 'fatherName', 'birthDate', 'gender'] as const;

export const BLOOD_TYPES = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'] as const;

const optionalText = (max: number) => z.string().trim().max(max).nullable().optional().transform((v) => (v ? v : null));

export const profileUpdateSchema = z
  .object({
    email: z.string().trim().email('validation.email').max(100).nullable().optional().or(z.literal('').transform(() => null)),
    secondaryPhone: mobileNumberSchema.nullable().optional().or(z.literal('').transform(() => null)),
    address: optionalText(300),
    bloodType: z.enum(BLOOD_TYPES).nullable().optional(),
    emergencyContactName: optionalText(100),
    emergencyContactPhone: mobileNumberSchema.nullable().optional().or(z.literal('').transform(() => null)),
    /** data: URL (≤ 300 KB) — mock-da şəkil storage yoxdur. */
    photoUrl: z.string().max(400_000).startsWith('data:image/', 'validation.photo').nullable().optional(),
  })
  .strict();
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

export const allergyCreateSchema = z.object({
  allergenName: z.string().trim().min(2, 'validation.required').max(150),
  drugId: z.string().uuid().nullable().optional(),
  severity: z.enum(ALLERGY_SEVERITY),
  notes: optionalText(300),
});

export const chronicConditionCreateSchema = z.object({
  conditionName: z.string().trim().min(2, 'validation.required').max(150),
  icd10Code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]\d{2}(\.\d{1,2})?$/, 'validation.icd10')
    .nullable()
    .optional()
    .or(z.literal('').transform(() => null)),
  diagnosedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional().or(z.literal('').transform(() => null)),
});

export const medicationsUpdateSchema = z.object({
  regularMedications: z.array(z.object({ name: z.string().trim().min(2).max(150), drugId: z.string().uuid().nullable().optional() })).max(30),
});

export const phoneChangeInitiateSchema = z.object({ mobileNumber: mobileNumberSchema });
export const phoneChangeConfirmSchema = z.object({ changeId: z.string().uuid(), otpCode: otpCodeSchema });

export const consentUpdateSchema = z.object({ medicalConsent: z.boolean(), consentVersion: z.string().max(10).default('1.0') });

export const settingsUpdateSchema = z.object({
  preferredLanguage: z.enum(LANGUAGE).optional(),
  biometricEnabled: z.boolean().optional(),
  deviceId: z.string().max(100).optional(),
});

export const pinChangeSchema = z.object({ currentPin: userPinSchema, newPin: userPinSchema, newPinConfirm: userPinSchema });

export const notificationPreferencesUpdateSchema = z.object({
  preferences: z.array(
    z.object({
      notificationType: z.string(),
      smsEnabled: z.boolean(),
      pushEnabled: z.boolean(),
      emailEnabled: z.boolean(),
    }),
  ),
});

export const accountDeletionSchema = z.object({ reason: z.string().trim().max(500).optional() });

export interface AllergyDto {
  allergyId: string;
  allergenName: string;
  drugId: string | null;
  severity: AllergySeverity;
  notes: string | null;
}

export interface ChronicConditionDto {
  conditionId: string;
  conditionName: string;
  icd10Code: string | null;
  diagnosedDate: string | null;
}

export interface ProfileDto {
  userId: string;
  role: UserRole;
  /** SİMA sahələri — read-only. */
  fin: string;
  firstName: string;
  lastName: string;
  fatherName: string | null;
  birthDate: string;
  gender: Gender;
  mobileNumber: string;
  email: string | null;
  photoUrl: string | null;
  preferredLanguage: Language;
  biometricEnabled: boolean;
  deletionRequestedAt: string | null;
  /** Yalnız PATIENT */
  patient: {
    bloodType: string | null;
    address: string | null;
    secondaryPhone: string | null;
    emergencyContactName: string | null;
    emergencyContactPhone: string | null;
    medicalConsent: boolean;
    consentGivenAt: string | null;
    consentVersion: string | null;
    regularMedications: { name: string; drugId: string | null }[];
    allergies: AllergyDto[];
    chronicConditions: ChronicConditionDto[];
  } | null;
}

export interface NotificationPreferenceDto {
  notificationType: NotificationType;
  label: string;
  channels: ('SMS' | 'PUSH' | 'EMAIL')[];
  smsEnabled: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
  isMandatory: boolean;
}

export interface SessionDto {
  sessionId: string;
  deviceInfo: string | null;
  ipAddress: string | null;
  createdAt: string;
  lastSeenAt: string;
  current: boolean;
}

export interface SettingsResultDto {
  preferredLanguage: Language;
  biometricEnabled: boolean;
  /** Biometrik aktivləşdiriləndə cihazda saxlanacaq token (F9). */
  deviceToken: string | null;
}

export const CONSENT_VERSION = '1.0';
