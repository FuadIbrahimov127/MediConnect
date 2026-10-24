import type {
  AccessDuration,
  AllergySeverity,
  AppointmentStatus,
  ApprovalMode,
  ClinicStatus,
  ClinicType,
  DeliveryStatus,
  DocumentCategory,
  DoctorClinicStatus,
  ExceptionType,
  Gender,
  GrantStatus,
  InteractionSeverity,
  Language,
  NotificationChannel,
  NotificationType,
  OtpPurpose,
  PrescriptionStatus,
  ReviewStatus,
  SecurityEventType,
  SecuritySeverity,
  SimaPurpose,
  SimaSessionStatus,
  SlotStatus,
  UserRole,
  UserStatus,
} from '@mediconnect/shared';

// Kolleksiya qeydləri — data-model.md (mediconnect_db cədvəllərinin camelCase güzgüsü).
// Vaxtlar ISO UTC string, tarixlər 'YYYY-MM-DD', saatlar 'HH:mm' (Bakı vaxtı).

type Ts = string;
type DateStr = string;
type TimeStr = string;

export interface Timestamps {
  createdAt: Ts;
  updatedAt: Ts;
}

// ── Modul 1 — istifadəçi və autentifikasiya ──
export interface User extends Timestamps {
  userId: string;
  fin: string;
  mobileNumber: string;
  firstName: string;
  lastName: string;
  fatherName: string | null;
  birthDate: DateStr;
  gender: Gender;
  pinHash: string;
  role: UserRole;
  status: UserStatus;
  email: string | null;
  photoUrl: string | null;
  biometricEnabled: boolean;
  preferredLanguage: Language;
  failedLoginAttempts: number;
  lockedUntil: Ts | null;
  lastLoginAt: Ts | null;
  blockedReason: string | null;
  /** Əlavə: pasientin hesab silmə tələbi (FR-104-19) — Super Admin emal edir (UC-902). */
  deletionRequestedAt: Ts | null;
  deletedAt: Ts | null;
}

export interface Patient extends Timestamps {
  patientId: string;
  userId: string;
  bloodType: string | null;
  address: string | null;
  secondaryPhone: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  medicalConsent: boolean;
  consentGivenAt: Ts | null;
  consentVersion: string | null;
  noShowCount: number;
  /** Əlavə: daimi qəbul edilən dərmanlar (UC-104). */
  regularMedications: { drugId: string | null; name: string }[];
}

export interface PatientAllergy {
  allergyId: string;
  patientId: string;
  allergenName: string;
  drugId: string | null;
  severity: AllergySeverity;
  notes: string | null;
  createdAt: Ts;
}

export interface PatientChronicCondition {
  conditionId: string;
  patientId: string;
  conditionName: string;
  icd10Code: string | null;
  diagnosedDate: DateStr | null;
  createdAt: Ts;
}

export interface UserSession {
  sessionId: string;
  userId: string;
  tokenHash: string;
  deviceInfo: string | null;
  ipAddress: string | null;
  expiresAt: Ts;
  revokedAt: Ts | null;
  createdAt: Ts;
  lastSeenAt: Ts;
}

export interface OtpVerification {
  otpId: string;
  mobileNumber: string;
  otpHash: string;
  purpose: OtpPurpose;
  attemptCount: number;
  isVerified: boolean;
  expiresAt: Ts;
  createdAt: Ts;
}

export interface SimaVerificationSession {
  simaSessionId: string;
  fin: string;
  mobileNumber: string;
  qrToken: string;
  purpose: SimaPurpose;
  sessionStatus: SimaSessionStatus;
  returnUrl: string | null;
  callbackPayload: Record<string, unknown> | null;
  signatureVerified: boolean;
  /** Əlavə: FAILED səbəbi (üz tanıma uğursuz, FIN uyğunsuzluğu). */
  failureReason: string | null;
  /** Əlavə: hansı axına aiddir (auth_flows.flowId və ya dəvət tokeni). */
  flowId: string | null;
  expiresAt: Ts;
  createdAt: Ts;
}

// ── Modul 2–3 — həkim və klinika ──
export interface Doctor extends Timestamps {
  doctorId: string;
  userId: string;
  licenseNumber: string;
  licenseExpiryDate: DateStr;
  licenseDocumentUrl: string | null;
  bio: string | null;
  education: string | null;
  experienceYears: number | null;
  academicDegree: string | null;
  approvalMode: ApprovalMode;
  profileCompleted: boolean;
  avgRating: number | null;
  reviewCount: number;
  /** Əlavə */
  specializationAreas: string[];
  certificates: { title: string; year: number | null }[];
  signatureCertExpiry: DateStr | null;
}

export interface Specialty {
  specialtyId: string;
  nameAz: string;
  nameRu: string | null;
  nameEn: string | null;
  isActive: boolean;
  createdAt: Ts;
}

export interface DoctorSpecialty {
  doctorSpecialtyId: string;
  doctorId: string;
  specialtyId: string;
  isPrimary: boolean;
}

export interface DoctorLanguage {
  doctorLanguageId: string;
  doctorId: string;
  languageCode: string;
}

export interface Clinic extends Timestamps {
  clinicId: string;
  name: string;
  clinicType: ClinicType;
  registrationNumber: string;
  licenseNumber: string;
  licenseExpiryDate: DateStr;
  description: string | null;
  cityId: string;
  district: string | null;
  address: string;
  latitude: number | null;
  longitude: number | null;
  phone: string;
  email: string | null;
  website: string | null;
  logoUrl: string | null;
  status: ClinicStatus;
  verifiedBy: string | null;
  verifiedAt: Ts | null;
  avgRating: number | null;
  /** Əlavə (F7, UC-202, UC-302) */
  acceptingAppointments: boolean;
  insurances: string[];
  foundedYear: number | null;
  is24x7: boolean;
  /** Əlavə: dayandırılmanın səbəbi — lisenziya yenilənəndə yalnız LICENSE_EXPIRED avtomatik bərpa olunur (alt 6). */
  suspendedReason?: 'LICENSE_EXPIRED' | 'ADMIN' | null;
}

export interface ClinicAdmin {
  clinicAdminId: string;
  userId: string;
  clinicId: string;
  status: 'INVITED' | 'ACTIVE' | 'REMOVED';
  inviteToken: string | null;
  inviteExpiresAt: Ts | null;
  createdAt: Ts;
}

export interface ClinicWorkingHour {
  workingHourId: string;
  clinicId: string;
  dayOfWeek: number; // 1 = bazar ertəsi … 7 = bazar
  opensAt: TimeStr | null;
  closesAt: TimeStr | null;
  isClosed: boolean;
}

/** Əlavə: klinika üzrə bayram / qeyri-iş günü (UC-801 alt 2) — bütün həkimlərin slotları bağlanır (BR-801-07). */
export interface ClinicHoliday {
  holidayId: string;
  clinicId: string;
  date: DateStr;
  name: string;
  createdBy: string | null;
  createdAt: Ts;
}

/** Əlavə: klinikanın rəsmi sənədləri (UC-901) — şifrələnmiş storage-da, yalnız Super Admin görür. */
export interface ClinicDocument {
  documentId: string;
  clinicId: string;
  kind: 'REGISTRATION' | 'LICENSE' | 'CONTRACT' | 'OTHER';
  fileName: string;
  mimeType: string;
  storagePath: string;
  encryptionKeyId: string;
  uploadedBy: string;
  createdAt: Ts;
}

/** Əlavə: mərkəzi kataloqa yeni xidmət tələbi (UC-804 alt 4). */
export interface ServiceRequest {
  requestId: string;
  clinicId: string;
  name: string;
  category: string | null;
  note: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedBy: string;
  createdAt: Ts;
  resolvedAt: Ts | null;
}

/** Əlavə: həkimin lisenziya / diplom sənədi (FR-802-08) — şifrələnmiş storage-da. */
export interface DoctorCredential {
  credentialId: string;
  doctorId: string;
  clinicId: string;
  kind: 'LICENSE' | 'DIPLOMA';
  fileName: string;
  mimeType: string;
  storagePath: string;
  encryptionKeyId: string;
  uploadedBy: string;
  createdAt: Ts;
}

export interface ClinicPhoto {
  photoId: string;
  clinicId: string;
  photoUrl: string;
  displayOrder: number;
  createdAt: Ts;
}

export interface DoctorClinic {
  doctorClinicId: string;
  doctorId: string;
  clinicId: string;
  status: DoctorClinicStatus;
  roomNumber: string | null;
  invitedBy: string | null;
  inviteToken: string | null;
  inviteExpiresAt: Ts | null;
  joinedAt: Ts | null;
  removedAt: Ts | null;
  /** Əlavə: slotların generasiya olunduğu son tarix (rolling job üçün). */
  slotsGeneratedUntil: DateStr | null;
  /** Əlavə: passiv olmanın səbəbi — lisenziya bitəndə avtomatik (BR-802-08), yenilənəndə avtomatik bərpa olunur. */
  inactiveReason?: 'LICENSE_EXPIRED' | 'ADMIN' | null;
  createdAt: Ts;
}

export interface Service {
  serviceId: string;
  nameAz: string;
  nameRu: string | null;
  nameEn: string | null;
  category: string | null;
  isActive: boolean;
  createdAt: Ts;
  /** Əlavə: xidmətə uyğun ixtisaslar (EF-804-2 xəbərdarlığı üçün); boş/yoxdur = istənilən ixtisas. */
  specialtyIds?: string[];
}

export interface ClinicDoctorService {
  clinicDoctorServiceId: string;
  doctorClinicId: string;
  serviceId: string;
  durationMinutes: number;
  isActive: boolean;
  createdAt: Ts;
}

// ── Modul 4 — cədvəl və randevu ──
export interface DoctorSchedule extends Timestamps {
  scheduleId: string;
  doctorClinicId: string;
  dayOfWeek: number;
  startTime: TimeStr;
  endTime: TimeStr;
  slotDurationMinutes: number;
  bufferMinutes: number;
  isActive: boolean;
  updatedBy: string | null;
}

export interface ScheduleBreak {
  breakId: string;
  scheduleId: string;
  breakStart: TimeStr;
  breakEnd: TimeStr;
  breakName: string | null;
}

export interface ScheduleException {
  exceptionId: string;
  doctorClinicId: string;
  exceptionType: ExceptionType;
  startDate: DateStr;
  endDate: DateStr;
  startTime: TimeStr | null;
  endTime: TimeStr | null;
  reason: string | null;
  createdBy: string | null;
  createdAt: Ts;
}

export interface AppointmentSlot extends Timestamps {
  slotId: string;
  doctorClinicId: string;
  slotDate: DateStr;
  startTime: TimeStr;
  endTime: TimeStr;
  status: SlotStatus;
  lockedBy: string | null;
  lockedUntil: Ts | null;
  blockedReason: string | null;
}

export interface Appointment extends Timestamps {
  appointmentId: string;
  bookingReference: string;
  patientId: string;
  doctorClinicId: string;
  slotId: string;
  /** Əlavə: uzun xidmətlər üçün tutulan bütün slotlar (slotId birincidir). */
  slotIds: string[];
  serviceId: string;
  status: AppointmentStatus;
  /** Əlavə: denormalizasiya — slotun UTC başlanğıcı və sonu. */
  startAt: Ts;
  endAt: Ts;
  patientNote: string | null;
  doctorNote: string | null;
  rescheduleCount: number;
  cancelledBy: string | null;
  cancellationReason: string | null;
  cancelledAt: Ts | null;
  completedAt: Ts | null;
  /** Əlavə (F4) */
  pendingReschedule: { newSlotIds: string[]; requestedBy: string; requestedAt: Ts } | null;
  reviewInvited: boolean;
}

export interface AppointmentStatusHistory {
  historyId: string;
  appointmentId: string;
  oldStatus: AppointmentStatus | null;
  newStatus: AppointmentStatus;
  changedBy: string | null;
  changeReason: string | null;
  oldSlotId: string | null;
  changedAt: Ts;
}

export interface AppointmentDocument {
  appointmentDocumentId: string;
  appointmentId: string;
  documentId: string;
  grantId: string | null;
  createdAt: Ts;
}

// ── Modul 5 — tibbi sənədlər ──
export interface MedicalDocument {
  documentId: string;
  patientId: string;
  category: DocumentCategory;
  fileName: string;
  storagePath: string;
  fileSizeBytes: number;
  mimeType: string;
  encryptionKeyId: string;
  documentDate: DateStr | null;
  description: string | null;
  virusScanStatus: 'PENDING' | 'CLEAN' | 'INFECTED';
  isArchived: boolean;
  uploadedAt: Ts;
  deletedAt: Ts | null;
}

export interface DocumentAccessGrant {
  grantId: string;
  documentId: string;
  doctorId: string;
  grantedBy: string;
  accessDuration: AccessDuration;
  status: GrantStatus;
  appointmentId: string | null;
  viewCount: number;
  grantedAt: Ts;
  expiresAt: Ts;
  revokedAt: Ts | null;
}

export interface DocumentAccessLog {
  accessLogId: string;
  documentId: string;
  grantId: string | null;
  accessedBy: string;
  accessType: 'VIEW' | 'DOWNLOAD_ATTEMPT' | 'DENIED';
  ipAddress: string | null;
  accessedAt: Ts;
}

export interface SignedUrl {
  token: string;
  documentId: string;
  userId: string;
  expiresAt: Ts;
  usedAt: Ts | null;
}

// ── Modul 6 — resept ──
export interface Drug {
  drugId: string;
  tradeName: string;
  genericName: string | null;
  /** Əlavə: allergiya uyğunluğu üçün qrup (məs. "penicillin"). */
  drugClass: string | null;
  /** Əlavə: pasientə ümumi məlumat (FR-602-12). */
  patientInfo: string | null;
  form: string | null;
  strength: string | null;
  isControlled: boolean;
  isActive: boolean;
  createdAt: Ts;
}

export interface DrugInteraction {
  interactionId: string;
  drugId1: string;
  drugId2: string;
  severity: InteractionSeverity;
  description: string;
  createdAt: Ts;
}

export interface Prescription extends Timestamps {
  prescriptionId: string;
  prescriptionNumber: string | null;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  diagnosis: string;
  icd10Code: string | null;
  generalNotes: string | null;
  status: PrescriptionStatus;
  digitalSignature: string | null;
  signedAt: Ts | null;
  qrCodeToken: string | null;
  validUntil: DateStr | null;
  validDays: number;
  /** Əlavə: nəzarətdə olan dərman üçün əsaslandırma (BR-601-08). */
  controlledJustification: string | null;
  cancelledReason: string | null;
  cancelledAt: Ts | null;
}

export interface PrescriptionMedication {
  prescriptionMedicationId: string;
  prescriptionId: string;
  drugId: string | null;
  drugNameManual: string | null;
  dosage: string;
  frequency: string;
  durationDays: number | null;
  instructions: string | null;
  warningOverridden: boolean;
  overrideReason: string | null;
  createdAt: Ts;
}

export interface PrescriptionTemplate {
  templateId: string;
  doctorId: string;
  name: string;
  medications: Omit<PrescriptionMedication, 'prescriptionMedicationId' | 'prescriptionId' | 'createdAt' | 'warningOverridden' | 'overrideReason'>[];
  createdAt: Ts;
}

export interface PrescriptionRenewalRequest {
  requestId: string;
  prescriptionId: string;
  patientId: string;
  doctorId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  note: string | null;
  reason: string | null;
  newPrescriptionId: string | null;
  createdAt: Ts;
  resolvedAt: Ts | null;
}

// ── Modul 11 — rəylər ──
export interface Review extends Timestamps {
  reviewId: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  overallRating: number;
  professionalismRating: number | null;
  attitudeRating: number | null;
  waitingTimeRating: number | null;
  comment: string | null;
  isAnonymous: boolean;
  status: ReviewStatus;
  filterFlags: string[] | null;
  moderatedBy: string | null;
  moderatedAt: Ts | null;
  rejectionReason: string | null;
  /** Əlavə: redaktə moderasiyada olarkən göstərilən dərc olunmuş versiya. */
  publishedSnapshot: { overallRating: number; professionalismRating: number | null; attitudeRating: number | null; waitingTimeRating: number | null; comment: string | null } | null;
}

export interface ReviewReply {
  replyId: string;
  reviewId: string;
  doctorId: string;
  replyText: string;
  status: 'PENDING_MODERATION' | 'PUBLISHED' | 'REJECTED';
  createdAt: Ts;
  /** Əlavə */
  filterFlags?: string[];
  rejectionReason?: string | null;
}

/** Əlavə: avtomatik məzmun filtrinin qaydaları (UC-903 alt 5). Tək sətir. */
export interface ModerationFilterRule {
  ruleId: string;
  bannedWords: string[];
  sensitivity: 'LOW' | 'MEDIUM' | 'HIGH';
  updatedBy: string | null;
  updatedAt: Ts;
}

export interface ReviewReport {
  reportId: string;
  reviewId: string;
  reportedBy: string;
  reportReason: string;
  resolution: 'PENDING' | 'UPHELD' | 'DISMISSED';
  resolvedBy: string | null;
  createdAt: Ts;
}

// ── Modul 10 — bildirişlər ──
export interface Notification {
  notificationId: string;
  userId: string;
  notificationType: NotificationType;
  title: string;
  body: string;
  deepLink: string | null;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  isRead: boolean;
  readAt: Ts | null;
  deletedAt: Ts | null;
  createdAt: Ts;
}

export interface NotificationDelivery {
  deliveryId: string;
  notificationId: string | null;
  channel: NotificationChannel;
  status: DeliveryStatus;
  providerMessageId: string | null;
  errorMessage: string | null;
  retryCount: number;
  sentAt: Ts | null;
  deliveredAt: Ts | null;
}

export interface ScheduledNotification {
  scheduledId: string;
  userId: string;
  appointmentId: string | null;
  notificationType: NotificationType;
  scheduledAt: Ts;
  status: 'PENDING' | 'SENT' | 'CANCELLED' | 'SKIPPED';
  cancelledReason: string | null;
  /** Əlavə: şablon dəyişənləri və deep link (quiet hours üçün təxirə salınmış bildirişlər). */
  payload: { vars: Record<string, string>; deepLink: string | null; relatedEntityType: string | null; relatedEntityId: string | null } | null;
  createdAt: Ts;
}

export interface NotificationPreference {
  preferenceId: string;
  userId: string;
  notificationType: NotificationType;
  smsEnabled: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
  isMandatory: boolean;
}

export interface NotificationTemplate {
  templateId: string;
  notificationType: NotificationType;
  languageCode: Language;
  channel: NotificationChannel;
  titleTemplate: string | null;
  bodyTemplate: string;
  isActive: boolean;
  updatedAt: Ts;
}

// ── Sistem ──
export interface AuditLog {
  auditId: string;
  userId: string | null;
  userRole: UserRole | null;
  action: string;
  entityType: string;
  entityId: string | null;
  oldValue: unknown;
  newValue: unknown;
  reason: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Ts;
}

export interface SecurityEvent {
  eventId: string;
  userId: string | null;
  eventType: SecurityEventType;
  severity: SecuritySeverity;
  description: string;
  ipAddress: string | null;
  createdAt: Ts;
}

export interface SystemSetting {
  settingId: string;
  settingKey: string;
  settingValue: string;
  dataType: 'INTEGER' | 'STRING' | 'BOOLEAN' | 'DECIMAL';
  category: string | null;
  description: string | null;
  isCritical: boolean;
  updatedBy: string | null;
  updatedAt: Ts;
}

export interface City {
  cityId: string;
  nameAz: string;
  nameRu: string | null;
  nameEn: string | null;
  isActive: boolean;
}

/** Əlavə: çoxaddımlı auth axınları — qeydiyyat (UC-101), PIN bərpası (UC-103), telefon dəyişikliyi (UC-104). */
export interface AuthFlow {
  flowId: string;
  kind: 'REGISTRATION' | 'PIN_RESET' | 'PHONE_CHANGE';
  mobileNumber: string;
  fin: string | null;
  userId: string | null;
  otpId: string | null;
  otpVerified: boolean;
  simaSessionId: string | null;
  returnUrl: string | null;
  expiresAt: Ts;
  completedAt: Ts | null;
  createdAt: Ts;
}

/** Əlavə (F9): biometrik giriş üçün etibarlı cihaz. Biometrik data serverə getmir — yalnız cihaz tokeni. */
export interface TrustedDevice {
  trustedDeviceId: string;
  userId: string;
  deviceId: string | null;
  tokenHash: string;
  revokedAt: Ts | null;
  createdAt: Ts;
}

// ── Mock-a xas (dev alətləri) ──
export interface OutboxMessage {
  id: string;
  channel: 'SMS' | 'PUSH' | 'EMAIL';
  to: string;
  userId: string | null;
  title: string | null;
  body: string;
  status: 'SENT' | 'DELIVERED' | 'FAILED';
  deliveryId: string | null;
  createdAt: Ts;
}
