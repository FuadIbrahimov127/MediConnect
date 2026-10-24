import type { AppointmentCreatedDto, AppointmentDto, AppointmentListDto, SlotLockDto } from '@mediconnect/shared';
import { currentLanguage, t } from '../i18n';
import { api, ApiClientError, tokenStore } from './client';

// Modul 4 — randevu endpoint-ləri (api-contract.md → Randevu).

export const appointmentsApi = {
  lock: (slotId: string, serviceId?: string) => api.post<SlotLockDto>(`/v1/slots/${slotId}/lock`, { serviceId }),
  unlock: (slotId: string) => api.del<null>(`/v1/slots/${slotId}/lock`),
  create: (body: { doctorId: string; clinicId: string; serviceId: string; slotId: string; patientNote?: string | null; documentIds?: string[] }) =>
    api.post<AppointmentCreatedDto>('/v1/appointments', body),
  list: (tab: 'UPCOMING' | 'PAST' | 'CANCELLED', signal?: AbortSignal) => api.get<AppointmentListDto>('/v1/appointments', { tab }, signal),
  get: (id: string, signal?: AbortSignal) => api.get<AppointmentDto>(`/v1/appointments/${id}`, undefined, signal),
  cancel: (id: string, reason: string) => api.patch<AppointmentDto>(`/v1/appointments/${id}/cancel`, { reason }),
  reschedule: (id: string, newSlotId: string) => api.patch<AppointmentDto>(`/v1/appointments/${id}/reschedule`, { newSlotId }),
  respondReschedule: (id: string, accept: boolean) => api.patch<AppointmentDto>(`/v1/appointments/${id}/reschedule/respond`, { accept }),
  confirm: (id: string) => api.patch<AppointmentDto>(`/v1/appointments/${id}/confirm`),
  reject: (id: string, reason: string) => api.patch<AppointmentDto>(`/v1/appointments/${id}/reject`, { reason }),
  complete: (id: string, doctorNote?: string) => api.patch<AppointmentDto>(`/v1/appointments/${id}/complete`, { doctorNote }),
  noShow: (id: string) => api.patch<AppointmentDto>(`/v1/appointments/${id}/no-show`),
  revertNoShow: (id: string) => api.patch<AppointmentDto>(`/v1/appointments/${id}/no-show/revert`),
};

/** Qorunan fayl endpoint-i (məs. .ics) — Bearer token ilə yükləyib brauzerdə "saxla" dialoqunu açır. */
export async function downloadAuthorized(path: string, filename: string) {
  const res = await fetch(`${import.meta.env.VITE_API_BASE_URL ?? ''}${path}`, {
    headers: { Authorization: `Bearer ${tokenStore.get() ?? ''}`, 'Accept-Language': currentLanguage() },
  });
  if (!res.ok) throw new ApiClientError(res.status, 'ServerError', t('net.fileNotDownloaded'));
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
