// Enum dəyərləri spec "Enum list" bölməsindən (UPPER_SNAKE). Hər enum həm tip, həm də dəyər massivi kimi ixrac olunur.

const e = <T extends string>(...values: T[]) => values;

export const APPOINTMENT_STATUS = e('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');
export type AppointmentStatus = (typeof APPOINTMENT_STATUS)[number];

export const SLOT_STATUS = e('AVAILABLE', 'SOFT_LOCKED', 'BOOKED', 'BLOCKED');
export type SlotStatus = (typeof SLOT_STATUS)[number];

export const PRESCRIPTION_STATUS = e('DRAFT', 'SIGNED', 'EXPIRED', 'CANCELLED', 'DISPENSED');
export type PrescriptionStatus = (typeof PRESCRIPTION_STATUS)[number];

export const DOCUMENT_CATEGORY = e('LAB_RESULT', 'IMAGING', 'EPICRISIS', 'PRESCRIPTION', 'OTHER');
export type DocumentCategory = (typeof DOCUMENT_CATEGORY)[number];

export const GRANT_STATUS = e('ACTIVE', 'EXPIRED', 'REVOKED');
export type GrantStatus = (typeof GRANT_STATUS)[number];

export const ACCESS_DURATION = e('TWENTY_FOUR_HOURS', 'SEVEN_DAYS', 'THIRTY_DAYS', 'APPOINTMENT_PERIOD');
export type AccessDuration = (typeof ACCESS_DURATION)[number];

export const USER_ROLE = e('PATIENT', 'DOCTOR', 'CLINIC_ADMIN', 'SUPER_ADMIN');
export type UserRole = (typeof USER_ROLE)[number];

export const USER_STATUS = e('PENDING_VERIFICATION', 'VERIFIED', 'SUSPENDED', 'BLOCKED', 'DELETED');
export type UserStatus = (typeof USER_STATUS)[number];

export const REVIEW_STATUS = e('PENDING_MODERATION', 'PUBLISHED', 'REJECTED', 'REPORTED', 'WITHDRAWN');
export type ReviewStatus = (typeof REVIEW_STATUS)[number];

export const NOTIFICATION_CHANNEL = e('SMS', 'PUSH', 'EMAIL', 'IN_APP');
export type NotificationChannel = (typeof NOTIFICATION_CHANNEL)[number];

export const DELIVERY_STATUS = e('QUEUED', 'SENT', 'DELIVERED', 'FAILED');
export type DeliveryStatus = (typeof DELIVERY_STATUS)[number];

export const CLINIC_STATUS = e('PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED', 'INACTIVE');
export type ClinicStatus = (typeof CLINIC_STATUS)[number];

export const DOCTOR_CLINIC_STATUS = e('INVITED', 'ACTIVE', 'INACTIVE', 'REMOVED');
export type DoctorClinicStatus = (typeof DOCTOR_CLINIC_STATUS)[number];

export const CLINIC_TYPE = e('POLYCLINIC', 'HOSPITAL', 'DIAGNOSTIC_CENTER', 'DENTAL', 'LABORATORY');
export type ClinicType = (typeof CLINIC_TYPE)[number];

export const GENDER = e('MALE', 'FEMALE');
export type Gender = (typeof GENDER)[number];

export const APPROVAL_MODE = e('AUTO', 'MANUAL');
export type ApprovalMode = (typeof APPROVAL_MODE)[number];

export const ALLERGY_SEVERITY = e('MILD', 'MODERATE', 'SEVERE');
export type AllergySeverity = (typeof ALLERGY_SEVERITY)[number];

export const INTERACTION_SEVERITY = e('MINOR', 'MODERATE', 'SEVERE');
export type InteractionSeverity = (typeof INTERACTION_SEVERITY)[number];

export const EXCEPTION_TYPE = e('VACATION', 'DAY_OFF', 'EXTRA_HOURS', 'HOLIDAY');
export type ExceptionType = (typeof EXCEPTION_TYPE)[number];

export const OTP_PURPOSE = e('REGISTRATION', 'PIN_RESET', 'PHONE_CHANGE');
export type OtpPurpose = (typeof OTP_PURPOSE)[number];

export const SIMA_PURPOSE = e('REGISTRATION', 'PIN_RESET', 'DOCTOR_ONBOARDING', 'CLINIC_ADMIN_ONBOARDING');
export type SimaPurpose = (typeof SIMA_PURPOSE)[number];

export const SIMA_SESSION_STATUS = e('PENDING', 'SUCCESS', 'FAILED', 'EXPIRED');
export type SimaSessionStatus = (typeof SIMA_SESSION_STATUS)[number];

export const SECURITY_EVENT_TYPE = e('FAILED_LOGIN', 'UNAUTHORIZED_ACCESS', 'MALWARE_DETECTED', 'SIMA_MISMATCH', 'DOCUMENT_FRAUD', 'ADMIN_ACTION');
export type SecurityEventType = (typeof SECURITY_EVENT_TYPE)[number];

export const SECURITY_SEVERITY = e('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
export type SecuritySeverity = (typeof SECURITY_SEVERITY)[number];

export const AVAILABILITY = e('TODAY', 'TOMORROW', 'THIS_WEEK');
export type Availability = (typeof AVAILABILITY)[number];

export const DOCTOR_SORT = e('RATING', 'EXPERIENCE', 'EARLIEST_SLOT');
export type DoctorSort = (typeof DOCTOR_SORT)[number];

export const CLINIC_SORT = e('RATING', 'DOCTOR_COUNT', 'DISTANCE');
export type ClinicSort = (typeof CLINIC_SORT)[number];

export const LANGUAGE = e('az', 'ru', 'en');
export type Language = (typeof LANGUAGE)[number];

export const NOTIFICATION_TYPE = e(
  'OTP_CODE',
  'APPOINTMENT_CONFIRMED',
  'APPOINTMENT_PENDING',
  'APPOINTMENT_REQUESTED',
  'NEW_APPOINTMENT',
  'RESCHEDULE_PROPOSED',
  'REMINDER_24H',
  'REMINDER_2H',
  'APPOINTMENT_CANCELLED',
  'APPOINTMENT_RESCHEDULED',
  'APPOINTMENT_REJECTED',
  'PRESCRIPTION_CREATED',
  'PRESCRIPTION_CANCELLED',
  'PRESCRIPTION_RENEWAL_REQUESTED',
  'PRESCRIPTION_RENEWAL_REJECTED',
  'DOCUMENT_SHARED',
  'REVIEW_INVITE',
  'REVIEW_PUBLISHED',
  'REVIEW_MODERATED',
  'REVIEW_REPLY_MODERATED',
  'DOCTOR_INVITE',
  'DOCTOR_INVITE_ACCEPTED',
  'DOCTOR_INVITE_DECLINED',
  'CLINIC_DOCTOR_STATUS_CHANGED',
  'CLINIC_ADMIN_INVITE',
  'CLINIC_STATUS_CHANGED',
  'SCHEDULE_CHANGED',
  'LICENSE_EXPIRY_WARNING',
  'SECURITY_NEW_DEVICE',
  'ACCOUNT_STATUS_CHANGED',
  'NO_SHOW_RECORDED',
  'PIN_CHANGED',
  'REGISTRATION_COMPLETED',
  'DOCTOR_PROFILE_COMPLETED',
);
export type NotificationType = (typeof NOTIFICATION_TYPE)[number];
