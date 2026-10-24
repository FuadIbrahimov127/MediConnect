import { z } from 'zod';
import type { AppointmentStatus, ClinicType, UserRole } from './enums';
import { reasonSchema } from './schemas';

// Modul 4 — Appointment Management (UC-401..405).

const id = z.string().uuid();

export const slotLockSchema = z.object({ serviceId: id.optional() });

/** POST /v1/appointments — spec "Randevu yaratma ekranı" + Success Nümunə 1. */
export const appointmentCreateSchema = z.object({
  doctorId: id,
  clinicId: id,
  serviceId: id,
  slotId: id,
  patientNote: z.string().trim().max(500).optional().nullable(),
  documentIds: z.array(id).max(10).optional(),
});
export type AppointmentCreateInput = z.infer<typeof appointmentCreateSchema>;

export const appointmentListSchema = z.object({ tab: z.enum(['UPCOMING', 'PAST', 'CANCELLED']).default('UPCOMING') });
export const cancelSchema = z.object({ reason: reasonSchema });
export const rescheduleSchema = z.object({ newSlotId: id });
export const rescheduleRespondSchema = z.object({ accept: z.boolean() });
export const completeSchema = z.object({ doctorNote: z.string().trim().max(2000).optional().nullable() });
export const rejectSchema = z.object({ reason: reasonSchema });

/** Pasient ləğv səbəbləri (UI seçimi; "Digər" — sərbəst mətn). */
export const CANCEL_REASONS = ['Planlarım dəyişdi', 'Özümü daha yaxşı hiss edirəm', 'Başqa həkimə müraciət etdim', 'Vaxt uyğun deyil'] as const;

export interface SlotLockDto {
  slotId: string;
  slotIds: string[];
  lockedUntil: string;
}

/** Spec Nümunə 1 cavabı. */
export interface AppointmentCreatedDto {
  appointmentId: string;
  bookingReference: string;
  appointmentStatus: AppointmentStatus;
  slotDate: string;
  startTime: string;
  endTime: string;
  doctorName: string;
  clinicName: string;
  clinicAddress: string;
  serviceName: string;
  createdAt: string;
}

export type AppointmentAction =
  | 'CANCEL'
  | 'RESCHEDULE'
  | 'RESPOND_RESCHEDULE'
  | 'ADD_TO_CALENDAR'
  | 'DIRECTIONS'
  | 'REVIEW'
  | 'VIEW_PRESCRIPTION'
  | 'ADD_DOCUMENTS'
  | 'CONFIRM'
  | 'REJECT'
  | 'COMPLETE'
  | 'NO_SHOW'
  | 'REVERT_NO_SHOW'
  | 'WRITE_PRESCRIPTION';

export interface AppointmentDto {
  appointmentId: string;
  bookingReference: string;
  status: AppointmentStatus;
  slotDate: string;
  startTime: string;
  endTime: string;
  startAt: string;
  endAt: string;
  createdAt: string;
  doctor: { doctorId: string; fullName: string; photoUrl: string | null; specialties: string[] };
  clinic: { clinicId: string; name: string; clinicType: ClinicType; address: string; phone: string; latitude: number | null; longitude: number | null; roomNumber: string | null };
  service: { serviceId: string; name: string; durationMinutes: number };
  /** Pasient: id + ad. Klinika admini üçün də göstərilir (əməliyyat məlumatı). */
  patient: { patientId: string; fullName: string; age: number | null; gender: 'MALE' | 'FEMALE' | null } | null;
  /** Tibbi məzmun — yalnız pasient və həkim (BR-405-05, BR-805-02). Klinika admininə null. */
  patientNote: string | null;
  doctorNote: string | null;
  rescheduleCount: number;
  cancellationReason: string | null;
  cancelledByRole: UserRole | 'SYSTEM' | null;
  cancelledAt: string | null;
  completedAt: string | null;
  pendingReschedule: { newStartAt: string; newDate: string; newTime: string; requestedByRole: UserRole; newDoctorName: string | null } | null;
  review: { reviewId: string; status: string } | null;
  documents: { documentId: string; fileName: string }[];
  prescriptions: { prescriptionId: string; prescriptionNumber: string | null; status: string }[];
  /** Yalnız həkim baxışında (FR-703-16..20). */
  patientContext?: import('./doctor').PatientContextDto;
  allowedActions: AppointmentAction[];
  /** Deaktiv əməliyyatın səbəbi (UI izahı üçün), məs. { CANCEL: 'CancellationTooLate' }. */
  blockedReasons: Partial<Record<AppointmentAction, string>>;
}

export interface AppointmentListDto {
  tab: 'UPCOMING' | 'PAST' | 'CANCELLED';
  counts: { UPCOMING: number; PAST: number; CANCELLED: number };
  appointments: AppointmentDto[];
}
