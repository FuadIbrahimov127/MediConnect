import { z } from 'zod';
import type { AppointmentDto } from './appointments';
import type { ApprovalMode, DoctorClinicStatus, ExceptionType, Gender, SlotStatus } from './enums';
import { APPROVAL_MODE } from './enums';

// Modul 7 — Doctor Panel (UC-701..703). Cədvəl tipləri klinika admini (UC-803) tərəfindən də istifadə olunur.

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'validation.time');
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'validation.date');

// ── UC-701 profil ──

/** Həkimin özünün dəyişə bilmədiyi sahələr (EF-701-2/3/5): lisenziya, klinika bağlılığı, ixtisas, qiymət. */
export const DOCTOR_LOCKED_FIELDS = ['licenseNumber', 'licenseExpiryDate', 'clinicIds', 'clinics', 'specialties', 'specialtyIds', 'price', 'fin', 'firstName', 'lastName', 'birthDate', 'gender'] as const;

export const doctorProfileUpdateSchema = z
  .object({
    bio: z.string().trim().max(2000).optional(),
    education: z.array(z.string().trim().min(3).max(200)).max(15).optional(),
    experienceYears: z.coerce.number().int().min(0).max(60).optional(),
    specializationAreas: z.array(z.string().trim().min(2).max(80)).max(20).optional(),
    languages: z.array(z.string().length(2)).max(8).optional(),
    academicDegree: z.string().trim().max(100).nullable().optional(),
    certificates: z.array(z.object({ title: z.string().trim().min(2).max(150), year: z.number().int().min(1950).max(2100).nullable() })).max(20).optional(),
    approvalMode: z.enum(APPROVAL_MODE).optional(),
    photoUrl: z.string().max(400_000).startsWith('data:image/', 'validation.photo').nullable().optional(),
  })
  .strict();
export type DoctorProfileUpdateInput = z.infer<typeof doctorProfileUpdateSchema>;

export interface DoctorProfileDto {
  doctorId: string;
  /** SİMA — read-only */
  fin: string;
  firstName: string;
  lastName: string;
  fatherName: string | null;
  birthDate: string;
  gender: Gender;
  /** Klinika admini tərəfindən — read-only */
  licenseNumber: string;
  licenseExpiryDate: string;
  specialties: { id: string; name: string; isPrimary: boolean }[];
  clinics: { clinicId: string; name: string; roomNumber: string | null; status: DoctorClinicStatus }[];
  /** Həkimin özü */
  photoUrl: string | null;
  bio: string | null;
  education: string[];
  experienceYears: number | null;
  specializationAreas: string[];
  languages: string[];
  academicDegree: string | null;
  certificates: { title: string; year: number | null }[];
  approvalMode: ApprovalMode;
  profileCompleted: boolean;
  /** Tamamlanma üçün çatışmayan məcburi sahələr (FR-701-12). */
  missingFields: string[];
}

// ── UC-702 cədvəl ──

export const SLOT_DURATIONS = [15, 20, 30, 45, 60] as const;

export const scheduleDaySchema = z.object({
  dayOfWeek: z.number().int().min(1).max(7),
  startTime: time,
  endTime: time,
  slotDurationMinutes: z.union([z.literal(15), z.literal(20), z.literal(30), z.literal(45), z.literal(60)]),
  bufferMinutes: z.number().int().min(0).max(30).default(0),
  breaks: z.array(z.object({ breakStart: time, breakEnd: time, breakName: z.string().trim().max(50).nullable().optional() })).max(5).default([]),
});
export type ScheduleDayInput = z.infer<typeof scheduleDaySchema>;

export const schedulePutSchema = z.object({
  clinicId: z.string().uuid(),
  days: z.array(scheduleDaySchema).max(21),
  /** true → yalnız yoxla (konfliktləri qaytar), saxlama. */
  dryRun: z.boolean().default(false),
  /** Konflikt varsa: təsirlənən randevuları ləğv et və pasientləri xəbərdar et (EF-702-1). */
  conflictResolution: z.literal('CANCEL_AND_NOTIFY').optional(),
});

export const exceptionCreateSchema = z.object({
  clinicId: z.string().uuid(),
  exceptionType: z.enum(['DAY_OFF', 'VACATION', 'EXTRA_HOURS']),
  startDate: date,
  endDate: date,
  startTime: time.nullable().optional(),
  endTime: time.nullable().optional(),
  reason: z.string().trim().max(255).nullable().optional(),
  conflictResolution: z.literal('CANCEL_AND_NOTIFY').optional(),
});

export const slotBlockSchema = z.object({ reason: z.string().trim().max(255).nullable().optional() });

export const scheduleQuerySchema = z.object({
  clinicId: z.string().uuid(),
  from: date.optional(),
  days: z.coerce.number().int().min(1).max(31).default(7),
});

export interface ScheduleConflictDto {
  appointmentId: string;
  date: string;
  startTime: string;
  patientName: string;
  status: string;
}

export interface ScheduleSlotDto {
  slotId: string;
  startTime: string;
  endTime: string;
  status: SlotStatus;
  /** BOOKED slotda pasientin adı (UC-803 də göstərir) — tibbi məzmun yoxdur. */
  patientName: string | null;
  appointmentId: string | null;
  blockedReason: string | null;
  past: boolean;
}

export interface ScheduleDto {
  clinicId: string;
  clinicName: string;
  doctorClinicId: string;
  /** Klinika iş saatları — yuxarı sərhəd (FR-702-09). */
  clinicHours: { dayOfWeek: number; opensAt: string | null; closesAt: string | null; isClosed: boolean }[];
  days: ScheduleDayInput[];
  exceptions: { exceptionId: string; exceptionType: ExceptionType; startDate: string; endDate: string; startTime: string | null; endTime: string | null; reason: string | null }[];
  calendar: { date: string; slots: ScheduleSlotDto[] }[];
  /** Həkimin digər klinikalardakı iş vaxtları (eyni vaxta açmamaq üçün — BR-702-07). */
  otherClinics: { clinicName: string; dayOfWeek: number; startTime: string; endTime: string }[];
  updatedAt: string | null;
}

export interface ScheduleSaveResultDto {
  saved: boolean;
  conflicts: ScheduleConflictDto[];
  cancelledCount: number;
  slotsGenerated: number;
}

// ── UC-703 randevular ──

export const doctorAppointmentsQuerySchema = z.object({
  tab: z.enum(['TODAY', 'UPCOMING', 'PENDING', 'PAST']).default('TODAY'),
  clinicId: z.string().uuid().optional(),
  from: date.optional(),
  to: date.optional(),
});

export interface DayOverviewDto {
  total: number;
  completed: number;
  remaining: number;
  noShow: number;
  cancelled: number;
}

export interface DoctorAppointmentsDto {
  tab: 'TODAY' | 'UPCOMING' | 'PENDING' | 'PAST';
  counts: { TODAY: number; UPCOMING: number; PENDING: number; PAST: number };
  today: DayOverviewDto;
  appointments: AppointmentDto[];
}

/** Həkimin randevu ekranında pasient konteksti (FR-703-16..20). Başqa həkimlərin qeydləri yoxdur (BR-703-03). */
export interface PatientContextDto {
  bloodType: string | null;
  allergies: { allergenName: string; severity: string }[];
  chronicConditions: { conditionName: string; icd10Code: string | null }[];
  regularMedications: string[];
  /** Yalnız BU həkimin bu pasientlə keçmiş randevuları. */
  history: { appointmentId: string; date: string; serviceName: string; status: string; doctorNote: string | null }[];
  noShowCount: number;
}

export interface DoctorDashboardDto {
  doctorName: string;
  profileCompleted: boolean;
  licenseExpiryDate: string;
  licenseDaysLeft: number;
  today: DayOverviewDto;
  pendingCount: number;
  next: AppointmentDto | null;
  todayList: AppointmentDto[];
}
