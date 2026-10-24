import { z } from 'zod';
import type { ClinicStatus, ClinicType, NotificationType, SecuritySeverity, SecurityEventType, UserRole, UserStatus } from './enums';
import { CLINIC_TYPE, INTERACTION_SEVERITY, LANGUAGE } from './enums';
import { finSchema, mobileNumberSchema } from './schemas';
import { dataUrlFileSchema } from './clinicAdmin';

// Modul 9 — Super Admin Panel (UC-901, 902, 904). Super Admin tibbi məzmun almır (BR-900-01): istifadəçi detalında
// yalnız hesab metadata-sı və statistika, audit-də tibbi sahələr yoxdur.

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'validation.date');
const reason = z.string().trim().min(5, 'validation.reasonRequired').max(500);

export const CLINIC_STATUS_LABEL: Record<ClinicStatus, string> = {
  PENDING_VERIFICATION: 'Verifikasiya gözləyir',
  ACTIVE: 'Aktiv',
  SUSPENDED: 'Dayandırılıb',
  INACTIVE: 'Deaktiv',
};

export const USER_STATUS_LABEL: Record<UserStatus, string> = {
  PENDING_VERIFICATION: 'Təsdiq gözləyir',
  VERIFIED: 'Aktiv',
  SUSPENDED: 'Dayandırılıb',
  BLOCKED: 'Bloklanıb',
  DELETED: 'Silinib (anonim)',
};

export const ROLE_LABEL: Record<UserRole, string> = { PATIENT: 'Pasient', DOCTOR: 'Həkim', CLINIC_ADMIN: 'Klinika admini', SUPER_ADMIN: 'Super admin' };

export const CLINIC_DOCUMENT_KIND = ['REGISTRATION', 'LICENSE', 'CONTRACT', 'OTHER'] as const;
export type ClinicDocumentKind = (typeof CLINIC_DOCUMENT_KIND)[number];
export const CLINIC_DOCUMENT_LABEL: Record<ClinicDocumentKind, string> = { REGISTRATION: 'Qeydiyyat şəhadətnaməsi', LICENSE: 'Fəaliyyət lisenziyası', CONTRACT: 'Müqavilə', OTHER: 'Digər' };

// ── UC-901 klinikalar ──

const adminPerson = z.object({
  fin: finSchema,
  mobileNumber: mobileNumberSchema,
  firstName: z.string().trim().min(2, 'validation.required').max(50),
  lastName: z.string().trim().min(2, 'validation.required').max(50),
});

export const clinicCreateSchema = z.object({
  name: z.string().trim().min(3, 'validation.required').max(150),
  clinicType: z.enum(CLINIC_TYPE),
  cityId: z.string().uuid(),
  district: z.string().trim().max(100).nullable().optional(),
  address: z.string().trim().min(5, 'validation.required').max(300),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  phone: z.string().trim().regex(/^\+994\d{9}$/, 'validation.mobileNumber'),
  email: z.string().trim().email('validation.email').nullable().optional().or(z.literal('').transform(() => null)),
  registrationNumber: z.string().trim().min(5, 'validation.required').max(30),
  licenseNumber: z.string().trim().min(4, 'validation.required').max(30),
  licenseExpiryDate: date,
  documents: z.array(dataUrlFileSchema.extend({ kind: z.enum(CLINIC_DOCUMENT_KIND) })).max(8).default([]),
  admin: adminPerson,
  /** true → "Klinikanı yarat və təsdiqlə" (ACTIVE), false → "verifikasiya gözləyir" (alt 2). */
  verify: z.boolean().default(true),
});

export const CLINIC_ACTIONS = ['VERIFY', 'REQUEST_DOCUMENTS', 'REJECT', 'SUSPEND', 'REACTIVATE', 'DEACTIVATE'] as const;
export type ClinicAction = (typeof CLINIC_ACTIONS)[number];
export const clinicActionSchema = z.object({ action: z.enum(CLINIC_ACTIONS), reason, conflictResolution: z.enum(['CANCEL_AND_NOTIFY']).optional() });
export const clinicLicenseRenewSchema = z.object({ licenseExpiryDate: date, document: dataUrlFileSchema, reason: z.string().trim().max(500).optional() });
export const clinicDocumentAddSchema = z.object({ document: dataUrlFileSchema.extend({ kind: z.enum(CLINIC_DOCUMENT_KIND) }) });
export const clinicAdminAddSchema = adminPerson;
export const adminClinicsQuerySchema = z.object({ status: z.string().optional(), q: z.string().trim().max(80).optional() });

export interface LicenseCheckDto {
  found: boolean;
  message: string;
}

export interface AdminClinicRowDto {
  clinicId: string;
  name: string;
  clinicType: ClinicType;
  cityName: string;
  status: ClinicStatus;
  doctorCount: number;
  licenseExpiryDate: string;
  licenseDaysLeft: number;
  createdAt: string;
}

export interface AdminClinicDetailDto extends AdminClinicRowDto {
  registrationNumber: string;
  licenseNumber: string;
  district: string | null;
  address: string;
  phone: string;
  email: string | null;
  verifiedBy: string | null;
  verifiedAt: string | null;
  acceptingAppointments: boolean;
  upcomingAppointments: number;
  documents: { documentId: string; kind: ClinicDocumentKind; fileName: string; mimeType: string; uploadedAt: string }[];
  admins: { userId: string; fullName: string; mobileNumber: string; status: 'INVITED' | 'ACTIVE' | 'REMOVED'; inviteExpiresAt: string | null }[];
  history: { action: string; reason: string | null; actorName: string | null; createdAt: string }[];
  registryCheck: LicenseCheckDto;
  allowedActions: ClinicAction[];
}

// ── UC-902 istifadəçilər ──

export const adminUsersQuerySchema = z.object({
  role: z.string().optional(),
  status: z.string().optional(),
  clinicId: z.string().uuid().optional(),
  q: z.string().trim().max(80).optional(),
  from: date.optional(),
  to: date.optional(),
  page: z.coerce.number().int().min(1).default(1),
  size: z.coerce.number().int().min(1).max(100).default(25),
});
export const userStatusSchema = z.object({ status: z.enum(['BLOCKED', 'VERIFIED']), reason, conflictResolution: z.enum(['CANCEL_AND_NOTIFY']).optional(), confirm: z.boolean().optional() });
export const adminReasonSchema = z.object({ reason });

export interface AdminUserRowDto {
  userId: string;
  fullName: string;
  fin: string;
  mobileNumber: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  lastLoginAt: string | null;
  clinics: string[];
  deletionRequested: boolean;
}

export interface AdminUsersDto {
  totalCount: number;
  page: number;
  size: number;
  users: AdminUserRowDto[];
}

/** BR-902-02: yalnız metadata — tibbi məzmun yoxdur. */
export interface AdminUserDetailDto extends AdminUserRowDto {
  email: string | null;
  birthDate: string;
  gender: string;
  blockedReason: string | null;
  lockedUntil: string | null;
  failedLoginAttempts: number;
  deletionRequestedAt: string | null;
  sessions: { sessionId: string; deviceInfo: string | null; ipAddress: string | null; createdAt: string; lastSeenAt: string; expiresAt: string }[];
  stats: { label: string; value: number | string }[];
  audit: { action: string; entityType: string; reason: string | null; byUser: boolean; actorName: string | null; createdAt: string }[];
  allowedActions: ('BLOCK' | 'UNBLOCK' | 'REVOKE_SESSIONS' | 'ANONYMIZE')[];
  warnings: string[];
}

// ── UC-904 parametrlər, kataloqlar, audit ──

export const settingUpdateSchema = z.object({ value: z.number().int(), confirm: z.boolean().optional(), reason: z.string().trim().max(500).optional() });

export interface AdminSettingDto {
  key: string;
  value: number;
  defaultValue: number;
  category: string;
  description: string;
  min: number;
  max: number;
  isCritical: boolean;
  updatedAt: string;
  updatedBy: string | null;
}

export const specialtyUpsertSchema = z.object({
  nameAz: z.string().trim().min(2, 'validation.required').max(100),
  nameRu: z.string().trim().max(100).nullable().optional(),
  nameEn: z.string().trim().max(100).nullable().optional(),
  isActive: z.boolean().optional(),
});
export const catalogServiceUpsertSchema = specialtyUpsertSchema.extend({ category: z.string().trim().max(80).nullable().optional() });
export const drugUpsertSchema = z.object({
  tradeName: z.string().trim().min(2, 'validation.required').max(150),
  genericName: z.string().trim().max(150).nullable().optional(),
  drugClass: z.string().trim().max(80).nullable().optional(),
  form: z.string().trim().max(50).nullable().optional(),
  strength: z.string().trim().max(50).nullable().optional(),
  isControlled: z.boolean().optional(),
  isActive: z.boolean().optional(),
  patientInfo: z.string().trim().max(1000).nullable().optional(),
});
export const interactionCreateSchema = z.object({
  drugId1: z.string().uuid(),
  drugId2: z.string().uuid(),
  severity: z.enum(INTERACTION_SEVERITY),
  description: z.string().trim().min(5, 'validation.required').max(500),
});
export const templateUpdateSchema = z.object({
  titleTemplate: z.string().trim().max(150).nullable(),
  bodyTemplate: z.string().trim().min(5, 'validation.required').max(1000),
  isActive: z.boolean().optional(),
});
export const serviceRequestResolveSchema = z.object({ decision: z.enum(['APPROVE', 'REJECT']), reason: z.string().trim().max(300).optional() });
export const auditQuerySchema = z.object({
  userId: z.string().uuid().optional(),
  action: z.string().trim().max(60).optional(),
  entityType: z.string().trim().max(60).optional(),
  from: date.optional(),
  to: date.optional(),
  page: z.coerce.number().int().min(1).default(1),
  size: z.coerce.number().int().min(1).max(200).default(50),
});
export const securityQuerySchema = z.object({ eventType: z.string().optional(), severity: z.string().optional(), page: z.coerce.number().int().min(1).default(1), size: z.coerce.number().int().min(1).max(200).default(50) });

export interface CatalogRowDto {
  id: string;
  nameAz: string;
  nameRu: string | null;
  nameEn: string | null;
  category?: string | null;
  isActive: boolean;
  /** EF-904-3: istifadə edən klinika/həkim sayı. */
  usage: number;
  usageDetail: string[];
}

export interface AdminDrugDto {
  drugId: string;
  tradeName: string;
  genericName: string | null;
  drugClass: string | null;
  form: string | null;
  strength: string | null;
  isControlled: boolean;
  isActive: boolean;
  patientInfo: string | null;
  usage: number;
}

export interface AdminInteractionDto {
  interactionId: string;
  drug1: string;
  drug2: string;
  drugId1: string;
  drugId2: string;
  severity: (typeof INTERACTION_SEVERITY)[number];
  description: string;
}

export interface AdminTemplateDto {
  templateId: string;
  notificationType: NotificationType;
  languageCode: (typeof LANGUAGE)[number];
  channel: string;
  titleTemplate: string | null;
  bodyTemplate: string;
  isActive: boolean;
  updatedAt: string;
}

export interface AdminServiceRequestDto {
  requestId: string;
  clinicName: string;
  name: string;
  category: string | null;
  note: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export interface AuditRowDto {
  auditId: string;
  createdAt: string;
  actorName: string | null;
  actorRole: UserRole | null;
  action: string;
  entityType: string;
  entityId: string | null;
  reason: string | null;
  ipAddress: string | null;
  /** Dəyişən sahələrin adları (dəyərlər tibbi məzmun daşıya bilər — göstərilmir). */
  changedFields: string[];
}

export interface AuditPageDto {
  totalCount: number;
  page: number;
  size: number;
  rows: AuditRowDto[];
  actions: string[];
  entityTypes: string[];
}

export interface SecurityEventRowDto {
  eventId: string;
  createdAt: string;
  eventType: SecurityEventType;
  severity: SecuritySeverity;
  description: string;
  userName: string | null;
  ipAddress: string | null;
}

export interface SecurityPageDto {
  totalCount: number;
  page: number;
  size: number;
  rows: SecurityEventRowDto[];
  last24h: Record<string, number>;
}

export interface PlatformStatsDto {
  users: Record<UserRole, number>;
  activeUsers30d: number;
  clinics: Record<ClinicStatus, number>;
  doctors: { visible: number; total: number };
  appointments: { today: number; last30d: number; upcoming: number; completed30d: number; cancelled30d: number };
  daily: { date: string; count: number }[];
  pending: { clinicsToVerify: number; deletionRequests: number; serviceRequests: number; reviewsToModerate: number };
  security24h: number;
  health: { name: string; status: 'ok' | 'down' | 'error' }[];
  licenseAlerts: { clinicId: string; name: string; licenseExpiryDate: string; daysLeft: number }[];
}
