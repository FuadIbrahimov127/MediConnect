import { z } from 'zod';
import type { AppointmentStatus, ClinicStatus, ClinicType, DoctorClinicStatus, UserStatus } from './enums';
import { finSchema, mobileNumberSchema, userPinSchema } from './schemas';
import type { AppointmentDto } from './appointments';
import type { DayOverviewDto } from './doctor';

// Modul 8 — Clinic Admin Panel (UC-801..805). Klinika admini tibbi məzmun almır (BR-805-02) — bu DTO-larda
// şikayət, diaqnoz, resept, sənəd sahəsi yoxdur; randevu detalı rola görə serializer-dən keçir.

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'validation.time');
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'validation.date');
const resolution = z.enum(['CANCEL_AND_NOTIFY']).optional();

export const CLINIC_TYPE_LABEL: Record<ClinicType, string> = {
  POLYCLINIC: 'Poliklinika',
  HOSPITAL: 'Xəstəxana',
  DIAGNOSTIC_CENTER: 'Diaqnostika mərkəzi',
  DENTAL: 'Stomatologiya',
  LABORATORY: 'Laboratoriya',
};

export const DOCTOR_CLINIC_STATUS_LABEL: Record<DoctorClinicStatus, string> = {
  INVITED: 'Dəvət edilib',
  ACTIVE: 'Aktiv',
  INACTIVE: 'Passiv',
  REMOVED: 'Çıxarılıb',
};

/** Şəkil (loqo, qalereya, lisenziya sənədi) JSON-da data URL kimi göndərilir — mock sadələşdirməsi. */
export const dataUrlFileSchema = z.object({
  fileName: z.string().trim().min(1).max(200),
  dataUrl: z.string().regex(/^data:[\w/+.-]+;base64,/, 'validation.photo').max(14_000_000),
});

// ── UC-801 profil ──

/** SA sahələri (ad, qeydiyyat, lisenziya, növ) burada yoxdur; göndərilsə 400 (EF-801-1, BR-801-02/03). */
export const clinicProfileUpdateSchema = z
  .object({
    description: z.string().trim().max(2000).nullable(),
    phone: z.string().trim().regex(/^\+994\d{9}$/, 'validation.mobileNumber'),
    email: z.string().trim().email('validation.email').nullable().or(z.literal('').transform(() => null)),
    website: z.string().trim().url('validation.url').max(200).nullable().or(z.literal('').transform(() => null)),
    address: z.string().trim().min(5, 'validation.required').max(300),
    district: z.string().trim().max(100).nullable(),
    latitude: z.number().min(-90).max(90).nullable(),
    longitude: z.number().min(-180).max(180).nullable(),
    insurances: z.array(z.string().trim().min(2).max(80)).max(30),
    logo: dataUrlFileSchema.nullable(),
  })
  .partial();

export const workingHoursSchema = z.object({
  days: z
    .array(z.object({ dayOfWeek: z.number().int().min(1).max(7), isClosed: z.boolean(), opensAt: time.nullable(), closesAt: time.nullable() }))
    .length(7),
  dryRun: z.boolean().default(false),
  confirmDoctorConflicts: z.boolean().optional(),
  conflictResolution: resolution,
});

export const holidayCreateSchema = z.object({ date, name: z.string().trim().min(2, 'validation.required').max(100), conflictResolution: resolution });
export const acceptingSchema = z.object({ acceptingAppointments: z.boolean(), reason: z.string().trim().max(300).optional() });
export const photoCreateSchema = z.object({ photo: dataUrlFileSchema });
export const photoOrderSchema = z.object({ photoIds: z.array(z.string().uuid()).min(1).max(12) });

export interface ClinicProfileDto {
  clinicId: string;
  name: string;
  clinicType: ClinicType;
  registrationNumber: string;
  licenseNumber: string;
  licenseExpiryDate: string;
  status: ClinicStatus;
  description: string | null;
  cityName: string;
  district: string | null;
  address: string;
  latitude: number | null;
  longitude: number | null;
  phone: string;
  email: string | null;
  website: string | null;
  logoUrl: string | null;
  acceptingAppointments: boolean;
  is24x7: boolean;
  insurances: string[];
  workingHours: { dayOfWeek: number; isClosed: boolean; opensAt: string | null; closesAt: string | null }[];
  holidays: { holidayId: string; date: string; name: string }[];
  photos: { photoId: string; photoUrl: string; displayOrder: number }[];
}

export interface ClinicProfileSaveDto {
  profile: ClinicProfileDto;
  /** EF-801-4 kimi bloklamayan xəbərdarlıqlar. */
  warnings: string[];
}

export interface WorkingHoursResultDto {
  saved: boolean;
  /** EF-801-2: cədvəli yeni saatlardan kənara çıxan həkimlər. */
  doctorConflicts: { doctorId: string; fullName: string; days: number[] }[];
  /** EF-801-3: bağlanan saatlara düşən aktiv randevular. */
  appointmentConflicts: { appointmentId: string; date: string; startTime: string; patientName: string; doctorName: string }[];
  cancelledCount: number;
}

// ── UC-802 həkimlər ──

export const doctorLookupSchema = z.object({ fin: finSchema });

export const clinicServiceAssignSchema = z.object({ serviceId: z.string().uuid(), durationMinutes: z.number().int().min(5).max(240) });

export const doctorInviteSchema = z.object({
  fin: finSchema,
  mobileNumber: mobileNumberSchema,
  firstName: z.string().trim().min(2, 'validation.required').max(50).optional(),
  lastName: z.string().trim().min(2, 'validation.required').max(50).optional(),
  licenseNumber: z.string().trim().min(4, 'validation.required').max(30).optional(),
  licenseExpiryDate: date.optional(),
  specialtyIds: z.array(z.string().uuid()).max(5).optional(),
  roomNumber: z.string().trim().max(20).nullable().optional(),
  services: z.array(clinicServiceAssignSchema).min(1, 'validation.required').max(30),
  documents: z.array(dataUrlFileSchema.extend({ kind: z.enum(['LICENSE', 'DIPLOMA']) })).max(4).default([]),
});

export const clinicDoctorUpdateSchema = z
  .object({
    status: z.enum(['ACTIVE', 'INACTIVE']),
    roomNumber: z.string().trim().max(20).nullable(),
    licenseExpiryDate: date,
    licenseDocument: dataUrlFileSchema,
    specialtyIds: z.array(z.string().uuid()).min(1).max(5),
    services: z.array(clinicServiceAssignSchema).min(1, 'validation.required').max(30),
    reason: z.string().trim().max(300),
  })
  .partial();

export const doctorRemoveSchema = z.object({ reason: z.string().trim().min(5, 'validation.reasonRequired').max(300), conflictResolution: resolution });

export interface DoctorLookupDto {
  exists: boolean;
  /** Mövcud həkim (başqa klinikada işləyir) — yalnız bağlantı yaradılır (alt 1, FR-802-03). */
  doctor: { doctorId: string; fullName: string; licenseNumber: string; licenseExpiryDate: string; specialties: string[]; clinics: string[] } | null;
  alreadyInClinic: boolean;
  /** FIN başqa rolda (məs. pasient) qeydiyyatdadırsa həkim kimi əlavə olunmur. */
  blockedReason: string | null;
}

export interface ClinicDoctorRowDto {
  doctorId: string;
  fullName: string;
  photoUrl: string | null;
  specialties: string[];
  status: DoctorClinicStatus;
  inactiveReason: string | null;
  userStatus: UserStatus;
  profileCompleted: boolean;
  roomNumber: string | null;
  licenseNumber: string;
  licenseExpiryDate: string;
  licenseDaysLeft: number;
  inviteExpiresAt: string | null;
  upcomingCount: number;
  completedLast30: number;
  avgRating: number | null;
  reviewCount: number;
}

export interface ClinicDoctorDetailDto extends ClinicDoctorRowDto {
  mobileNumber: string;
  services: { serviceId: string; name: string; category: string | null; durationMinutes: number; isActive: boolean }[];
  documents: { credentialId: string; kind: 'LICENSE' | 'DIPLOMA'; fileName: string; uploadedAt: string }[];
  otherClinics: string[];
  roomConflict: string | null;
  allowedActions: ('DEACTIVATE' | 'ACTIVATE' | 'REMOVE' | 'RESEND_INVITE' | 'RENEW_LICENSE' | 'EDIT_SCHEDULE')[];
}

export interface DoctorUpdateResultDto {
  doctor: ClinicDoctorDetailDto;
  warnings: string[];
}

// ── Dəvətin qəbulu (/invite/{token}) ──

export const inviteAcceptSchema = z.object({
  simaSessionId: z.string().uuid().optional(),
  userPin: userPinSchema,
  userPinConfirm: userPinSchema.optional(),
});

export interface InviteInfoDto {
  kind: 'DOCTOR' | 'CLINIC_ADMIN';
  clinicName: string;
  clinicAddress: string;
  fullName: string;
  maskedMobile: string;
  expiresAt: string;
  /** true — artıq SİMA-dan keçmiş hesab (başqa klinikanın həkimi): yalnız PIN ilə qəbul. */
  existingAccount: boolean;
}

// ── UC-803 gün bağlama və köçürmə ──

export const closeDaySchema = z.object({
  date,
  reason: z.string().trim().min(3, 'validation.reasonRequired').max(300),
  decisions: z.array(z.object({ appointmentId: z.string().uuid(), action: z.enum(['CANCEL', 'TRANSFER']), targetSlotId: z.string().uuid().optional() })).default([]),
});

export interface CloseDayPreviewDto {
  date: string;
  appointments: {
    appointmentId: string;
    bookingReference: string;
    startTime: string;
    patientName: string;
    serviceName: string;
    status: AppointmentStatus;
    /** Eyni ixtisaslı, eyni xidməti göstərən həkimlərin həmin gün boş slotları (FR-803-11). */
    transferOptions: { doctorId: string; doctorName: string; slots: { slotId: string; startTime: string }[] }[];
  }[];
}

export interface CloseDayResultDto {
  cancelled: number;
  transferProposed: number;
}

// ── UC-804 xidmətlər ──

export const clinicServiceCreateSchema = z.object({
  serviceId: z.string().uuid(),
  doctors: z.array(z.object({ doctorId: z.string().uuid(), durationMinutes: z.number().int().min(5).max(240) })).min(1, 'validation.serviceDoctors'),
});
export const clinicServiceUpdateSchema = z
  .object({
    doctors: z.array(z.object({ doctorId: z.string().uuid(), durationMinutes: z.number().int().min(5).max(240) })).min(1, 'validation.serviceDoctors'),
    isActive: z.boolean(),
  })
  .partial();
export const serviceRequestSchema = z.object({ name: z.string().trim().min(3, 'validation.required').max(150), category: z.string().trim().max(80).optional(), note: z.string().trim().max(500).optional() });

export interface ClinicServiceDto {
  serviceId: string;
  name: string;
  category: string | null;
  isActive: boolean;
  doctors: { doctorId: string; fullName: string; durationMinutes: number; slotDurationMinutes: number | null }[];
  upcomingAppointments: number;
}

export interface ClinicServicesDto {
  services: ClinicServiceDto[];
  catalog: { serviceId: string; name: string; category: string | null; added: boolean }[];
  doctors: { doctorId: string; fullName: string; specialties: string[] }[];
  requests: { requestId: string; name: string; status: 'PENDING' | 'APPROVED' | 'REJECTED'; createdAt: string }[];
}

export interface ClinicServiceSaveDto {
  services: ClinicServicesDto;
  warnings: string[];
}

// ── UC-805 nəzarət və hesabatlar ──

export const clinicAppointmentsQuerySchema = z.object({
  from: date.optional(),
  to: date.optional(),
  doctorId: z.string().uuid().optional(),
  status: z.string().optional(),
  serviceId: z.string().uuid().optional(),
  q: z.string().trim().max(50).optional(),
  page: z.coerce.number().int().min(1).default(1),
  size: z.coerce.number().int().min(1).max(100).default(25),
});

export const bulkCancelSchema = z.object({ appointmentIds: z.array(z.string().uuid()).min(1).max(100), reason: z.string().trim().min(5, 'validation.reasonRequired').max(300) });

export interface ClinicAppointmentsDto {
  totalCount: number;
  page: number;
  size: number;
  appointments: AppointmentDto[];
  summary: DayOverviewDto;
}

export interface BulkCancelResultDto {
  cancelled: number;
  failed: { appointmentId: string; bookingReference: string; message: string }[];
}

export const REPORT_TYPES = ['daily', 'doctors', 'no-show', 'load'] as const;
export type ReportType = (typeof REPORT_TYPES)[number];
export const reportQuerySchema = z.object({ from: date, to: date });

export interface ReportDto {
  type: ReportType;
  from: string;
  to: string;
  totals: { total: number; completed: number; cancelled: number; noShow: number; completionRate: number | null; noShowRate: number | null };
  daily?: { date: string; total: number; confirmed: number; completed: number; cancelled: number; noShow: number }[];
  doctors?: { doctorId: string; fullName: string; total: number; completed: number; noShow: number; completionRate: number | null; noShowRate: number | null; avgRating: number | null }[];
  noShows?: { appointmentId: string; bookingReference: string; date: string; time: string; patientName: string; doctorName: string; serviceName: string }[];
  /** [dayOfWeek 1..7][saat] → say. */
  load?: { dayOfWeek: number; hour: number; count: number }[];
}

export interface ClinicDashboardDto {
  clinic: { name: string; status: ClinicStatus; acceptingAppointments: boolean };
  today: DayOverviewDto;
  next: AppointmentDto[];
  doctors: { active: number; inactive: number; invited: number; profileIncomplete: number };
  licenseAlerts: { doctorId: string; fullName: string; licenseExpiryDate: string; daysLeft: number }[];
  pendingInvites: { doctorId: string; fullName: string; inviteExpiresAt: string | null; expired: boolean }[];
  services: number;
}
