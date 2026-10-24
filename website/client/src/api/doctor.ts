import type {
  DoctorAppointmentsDto,
  DoctorDashboardDto,
  DoctorProfileDto,
  ScheduleDayInput,
  ScheduleDto,
  ScheduleSaveResultDto,
} from '@mediconnect/shared';
import { api } from './client';

// Modul 7 — həkim paneli (UC-701..703).

export interface ScheduleApi {
  load: (clinicId: string, from?: string, signal?: AbortSignal) => Promise<ScheduleDto>;
  save: (body: { clinicId: string; days: ScheduleDayInput[]; dryRun?: boolean; conflictResolution?: 'CANCEL_AND_NOTIFY' }) => Promise<ScheduleSaveResultDto>;
  addException: (body: { clinicId: string; exceptionType: 'DAY_OFF' | 'VACATION' | 'EXTRA_HOURS'; startDate: string; endDate: string; startTime?: string | null; endTime?: string | null; reason?: string | null; conflictResolution?: 'CANCEL_AND_NOTIFY' }) => Promise<unknown>;
  removeException: (clinicId: string, exceptionId: string) => Promise<unknown>;
  block: (slotId: string, reason?: string) => Promise<unknown>;
  unblock: (slotId: string) => Promise<unknown>;
}

/** Həkimin öz cədvəli (UC-702). Klinika admini üçün eyni interfeys clinicAdmin.ts-də (UC-803). */
export const doctorScheduleApi: ScheduleApi = {
  load: (clinicId, from, signal) => api.get<ScheduleDto>('/v1/doctor/schedule', { clinicId, from, days: 7 }, signal),
  save: (body) => api.put<ScheduleSaveResultDto>('/v1/doctor/schedule', body),
  addException: (body) => api.post('/v1/doctor/schedule/exceptions', body),
  removeException: (clinicId, exceptionId) => api.del(`/v1/doctor/schedule/exceptions/${exceptionId}?clinicId=${clinicId}`),
  block: (slotId, reason) => api.patch(`/v1/slots/${slotId}/block`, { reason }),
  unblock: (slotId) => api.patch(`/v1/slots/${slotId}/unblock`, {}),
};

export const doctorApi = {
  dashboard: (signal?: AbortSignal) => api.get<DoctorDashboardDto>('/v1/doctor/dashboard', undefined, signal),
  profile: (signal?: AbortSignal) => api.get<DoctorProfileDto>('/v1/doctor/profile', undefined, signal),
  updateProfile: (body: Record<string, unknown>) => api.patch<DoctorProfileDto>('/v1/doctor/profile', body),
  appointments: (q: { tab: string; clinicId?: string; from?: string; to?: string }, signal?: AbortSignal) => api.get<DoctorAppointmentsDto>('/v1/doctor/appointments', q, signal),
};
