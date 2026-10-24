// Cavab zərfi və xəta kataloqu — api-contract.md ilə sinxron saxla.

export interface ApiSuccess<T> {
  status: 'SUCCESS';
  message?: string;
  data: T;
}

export interface ApiErrorBody {
  status: 'ERROR';
  errorType: ErrorType;
  message: string;
  timestamp: string;
  details?: {
    fields?: Record<string, string>;
    [key: string]: unknown;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiErrorBody;

export interface PageMeta {
  totalCount: number;
  page: number;
  size: number;
}
/** Səhifələnmiş siyahı: `Paged<'doctors', DoctorCardDto>` → `{totalCount, page, size, doctors: [...]}` */
export type Paged<K extends string, T> = PageMeta & { [P in K]: T[] };

/** errorType → HTTP kodu. Yeni xəta əlavə edəndə messages.ts-ə də mətn yaz. */
export const ERROR_HTTP = {
  ValidationError: 400,
  Unauthorized: 401,
  Forbidden: 403,
  NotFound: 404,
  Conflict: 409,
  BusinessRuleViolation: 422,
  TooManyRequests: 429,
  ServerError: 500,
  ServiceUnavailable: 503,

  DuplicateAccount: 409,
  InvalidOtp: 422,
  OtpResendTooSoon: 429,
  SimaVerificationFailed: 422,
  SimaSessionExpired: 409,
  WeakPin: 422,
  PinMismatch: 422,
  PinSameAsOld: 422,
  FinMismatch: 422,
  AccountNotFound: 404,
  InvalidPin: 401,
  AccountLocked: 429,
  AccountBlocked: 403,
  ConsentRequired: 403,
  SlotUnavailable: 409,
  SlotLockExpired: 409,
  BookingTooSoon: 422,
  DuplicateAppointment: 422,
  NoShowLimitExceeded: 422,
  ClinicNotAccepting: 422,
  CancellationTooLate: 422,
  InvalidStatusTransition: 422,
  RescheduleLimitExceeded: 422,
  RescheduleTooLate: 422,
  AppointmentNotStarted: 422,
  FileTooLarge: 413,
  UnsupportedFileType: 415,
  MalwareDetected: 422,
  NoAppointmentWithDoctor: 403,
  GrantAlreadyExists: 409,
  AccessGrantExpired: 403,
  DownloadNotAllowed: 403,
  LicenseInvalid: 403,
  SignatureCertificateInvalid: 403,
  AllergyConflict: 422,
  DrugInteraction: 422,
  ControlledDrugJustificationRequired: 422,
  PrescriptionNotSigned: 422,
  PrescriptionNotEditable: 422,
  ScheduleConflict: 409,
  ScheduleOverlap: 422,
  ScheduleOutsideClinicHours: 422,
  DoctorBusyInOtherClinic: 409,
  DuplicateLicense: 409,
  DoctorAlreadyInClinic: 409,
  InviteExpired: 410,
  HasActiveAppointments: 409,
  DuplicateRegistrationNumber: 409,
  LicenseExpired: 422,
  ReasonRequired: 422,
  CannotModifySelf: 422,
  ReviewNotEligible: 422,
  DuplicateReview: 409,
  ReviewWindowClosed: 422,
  ReviewEditWindowClosed: 422,
} as const;

export type ErrorType = keyof typeof ERROR_HTTP;
