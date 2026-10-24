import type {
  AuthResultDto,
  BulkCancelResultDto,
  ClinicAppointmentsDto,
  ClinicDashboardDto,
  ClinicDoctorDetailDto,
  ClinicDoctorRowDto,
  ClinicProfileDto,
  ClinicProfileSaveDto,
  ClinicServiceSaveDto,
  ClinicServicesDto,
  CloseDayPreviewDto,
  CloseDayResultDto,
  DoctorLookupDto,
  DoctorUpdateResultDto,
  InviteInfoDto,
  ReportDto,
  ReportType,
  ScheduleDto,
  ScheduleSaveResultDto,
  SimaSessionDto,
  WorkingHoursResultDto,
} from '@mediconnect/shared';
import { t } from '../i18n';
import { downloadAuthorized } from './appointments';
import { api } from './client';
import type { ScheduleApi } from './doctor';

// Modul 8 — klinika admini (api-contract.md → Klinika admin). Klinika server tərəfində actor-dan müəyyən olunur.

const B = '/v1/clinic-admin';
export type DataUrlFile = { fileName: string; dataUrl: string };

export const clinicAdminApi = {
  dashboard: (signal?: AbortSignal) => api.get<ClinicDashboardDto>(`${B}/dashboard`, undefined, signal),

  profile: (signal?: AbortSignal) => api.get<ClinicProfileDto>(`${B}/profile`, undefined, signal),
  updateProfile: (body: Record<string, unknown>) => api.patch<ClinicProfileSaveDto>(`${B}/profile`, body),
  saveHours: (body: { days: { dayOfWeek: number; isClosed: boolean; opensAt: string | null; closesAt: string | null }[]; dryRun?: boolean; confirmDoctorConflicts?: boolean; conflictResolution?: 'CANCEL_AND_NOTIFY' }) =>
    api.put<WorkingHoursResultDto>(`${B}/working-hours`, body),
  addHoliday: (body: { date: string; name: string; conflictResolution?: 'CANCEL_AND_NOTIFY' }) => api.post<ClinicProfileDto>(`${B}/holidays`, body),
  removeHoliday: (id: string) => api.del<ClinicProfileDto>(`${B}/holidays/${id}`),
  setAccepting: (acceptingAppointments: boolean, reason?: string) => api.patch<ClinicProfileDto>(`${B}/accepting`, { acceptingAppointments, reason }),
  addPhoto: (photo: DataUrlFile) => api.post<ClinicProfileDto>(`${B}/photos`, { photo }),
  removePhoto: (id: string) => api.del<ClinicProfileDto>(`${B}/photos/${id}`),
  reorderPhotos: (photoIds: string[]) => api.patch<ClinicProfileDto>(`${B}/photos/order`, { photoIds }),

  doctors: (q: { status?: string; q?: string }, signal?: AbortSignal) => api.get<ClinicDoctorRowDto[]>(`${B}/doctors`, q, signal),
  lookup: (fin: string) => api.post<DoctorLookupDto>(`${B}/doctors/lookup`, { fin }),
  invite: (body: Record<string, unknown>) => api.post<ClinicDoctorDetailDto>(`${B}/doctors`, body),
  doctor: (id: string, signal?: AbortSignal) => api.get<ClinicDoctorDetailDto>(`${B}/doctors/${id}`, undefined, signal),
  updateDoctor: (id: string, body: Record<string, unknown>) => api.patch<DoctorUpdateResultDto>(`${B}/doctors/${id}`, body),
  resendInvite: (id: string) => api.post<ClinicDoctorDetailDto>(`${B}/doctors/${id}/resend-invite`),
  removeDoctor: (id: string, body: { reason: string; conflictResolution?: 'CANCEL_AND_NOTIFY' }) => api.del<{ removed: boolean; cancelledCount: number }>(`${B}/doctors/${id}`, body),
  closeDayPreview: (id: string, date: string, signal?: AbortSignal) => api.get<CloseDayPreviewDto>(`${B}/doctors/${id}/close-day`, { date }, signal),
  closeDay: (id: string, body: { date: string; reason: string; decisions: { appointmentId: string; action: 'CANCEL' | 'TRANSFER'; targetSlotId?: string }[] }) =>
    api.post<CloseDayResultDto>(`${B}/doctors/${id}/close-day`, body),

  services: (signal?: AbortSignal) => api.get<ClinicServicesDto>(`${B}/services`, undefined, signal),
  addService: (body: { serviceId: string; doctors: { doctorId: string; durationMinutes: number }[] }) => api.post<ClinicServiceSaveDto>(`${B}/services`, body),
  updateService: (id: string, body: { doctors?: { doctorId: string; durationMinutes: number }[]; isActive?: boolean }) => api.patch<ClinicServiceSaveDto>(`${B}/services/${id}`, body),
  removeService: (id: string) => api.del<ClinicServicesDto>(`${B}/services/${id}`),
  requestService: (body: { name: string; category?: string; note?: string }) => api.post<ClinicServicesDto>(`${B}/service-requests`, body),

  appointments: (q: Record<string, string | number | undefined>, signal?: AbortSignal) => api.get<ClinicAppointmentsDto>(`${B}/appointments`, q, signal),
  bulkCancel: (appointmentIds: string[], reason: string) => api.post<BulkCancelResultDto>(`${B}/appointments/bulk-cancel`, { appointmentIds, reason }),

  report: (type: ReportType, from: string, to: string, signal?: AbortSignal) => api.get<ReportDto>(`${B}/reports/${type}`, { from, to }, signal),
  exportReport: (type: ReportType, from: string, to: string, format: 'csv' | 'pdf') =>
    downloadAuthorized(`${B}/reports/${type}/export?from=${from}&to=${to}&format=${format}`, `hesabat-${type}-${from}_${to}.${format}`),
};

/** UC-803: həkim panelindəki cədvəl redaktoru eyni interfeysi admin endpoint-ləri ilə istifadə edir. */
export const clinicScheduleApi = (doctorId: string): ScheduleApi => ({
  load: (_clinicId, from, signal) => api.get<ScheduleDto>(`${B}/doctors/${doctorId}/schedule`, { from, days: 7 }, signal),
  save: ({ clinicId: _c, ...body }) => api.put<ScheduleSaveResultDto>(`${B}/doctors/${doctorId}/schedule`, body),
  addException: ({ clinicId: _c, ...body }) => api.post(`${B}/doctors/${doctorId}/schedule/exceptions`, body),
  removeException: (_clinicId, exceptionId) => api.del(`${B}/doctors/${doctorId}/schedule/exceptions/${exceptionId}`),
  block: (slotId, reason) => api.patch(`/v1/slots/${slotId}/block`, { reason, doctorId }),
  unblock: (slotId) => api.patch(`/v1/slots/${slotId}/unblock`, { doctorId }),
});

/** Dəvətin qəbulu (/invite/{token}) — autentifikasiyasız. */
export const invitesApi = {
  info: (token: string, signal?: AbortSignal) => api.get<InviteInfoDto>(`/v1/invites/${token}`, undefined, signal),
  startSima: (token: string) => api.post<SimaSessionDto>(`/v1/invites/${token}/sima`),
  accept: (token: string, body: { simaSessionId?: string; userPin: string; userPinConfirm?: string }) => api.post<AuthResultDto>(`/v1/invites/${token}/accept`, body),
  decline: (token: string) => api.post<{ declined: boolean }>(`/v1/invites/${token}/decline`),
};

/** Fayl → data URL (şəkil və lisenziya sənədi JSON-da göndərilir). */
export function readAsDataUrl(file: File): Promise<DataUrlFile> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve({ fileName: file.name, dataUrl: String(r.result) });
    r.onerror = () => reject(new Error(t('net.fileNotRead')));
    r.readAsDataURL(file);
  });
}
