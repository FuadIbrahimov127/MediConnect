import type { AccessLogDto, DocumentDto, EligibleDoctorDto, GrantDto, SharedDocumentsDto, SignedUrlDto, TimelineDto } from '@mediconnect/shared';
import { currentLanguage, t } from '../i18n';
import { api, ApiClientError, tokenStore } from './client';

// Modul 5 — sənədlər, paylaşımlar, tibbi tarixçə (api-contract.md → Sənədlər).

const BASE = import.meta.env.VITE_API_BASE_URL ?? '';

/** Multipart yükləmə + irəliləyiş (FR-501-08). fetch irəliləyiş vermədiyi üçün XHR. */
export function uploadDocument(file: File, meta: { category: string; documentDate?: string; description?: string }, onProgress?: (pct: number) => void): Promise<DocumentDto> {
  return new Promise((resolve, reject) => {
    const fd = new FormData();
    fd.append('category', meta.category);
    if (meta.documentDate) fd.append('documentDate', meta.documentDate);
    if (meta.description) fd.append('description', meta.description);
    fd.append('file', file, file.name);
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${BASE}/v1/documents`);
    xhr.setRequestHeader('Authorization', `Bearer ${tokenStore.get() ?? ''}`);
    xhr.setRequestHeader('Accept-Language', currentLanguage());
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      try {
        const json = JSON.parse(xhr.responseText);
        if (xhr.status < 300 && json.status === 'SUCCESS') resolve(json.data);
        else reject(new ApiClientError(xhr.status, json.errorType ?? 'ServerError', json.message ?? t('net.uploadFailed'), json.details));
      } catch {
        reject(new ApiClientError(xhr.status, 'ServerError', t('net.uploadFailed')));
      }
    };
    // EF-501-4: yükləmə kəsilir — server natamam faylı saxlamır (fayl tam gəlməsə heç nə yazılmır).
    xhr.onerror = () => reject(new ApiClientError(0, 'NetworkError', t('net.uploadAborted')));
    xhr.send(fd);
  });
}

export const documentsApi = {
  list: (q: { category?: string; archived?: string; deleted?: string; q?: string; sort?: string }, signal?: AbortSignal) => api.get<DocumentDto[]>('/v1/documents', q, signal),
  update: (id: string, body: Record<string, unknown>) => api.patch<DocumentDto>(`/v1/documents/${id}`, body),
  remove: (id: string) => api.del<DocumentDto>(`/v1/documents/${id}`),
  restore: (id: string) => api.post<DocumentDto>(`/v1/documents/${id}/restore`),
  eligibleDoctors: (id: string) => api.get<EligibleDoctorDto[]>(`/v1/documents/${id}/eligible-doctors`),
  accessLog: (id: string) => api.get<AccessLogDto[]>(`/v1/documents/${id}/access-log`),
  grant: (id: string, doctorId: string, accessDuration: string) => api.post<GrantDto>(`/v1/documents/${id}/grants`, { doctorId, accessDuration }),
  grantBulk: (documentIds: string[], doctorId: string, accessDuration: string) => api.post<{ created: GrantDto[]; skipped: string[] }>('/v1/grants/bulk', { documentIds, doctorId, accessDuration }),
  grants: (status?: string, signal?: AbortSignal) => api.get<GrantDto[]>('/v1/grants', { status }, signal),
  extendGrant: (id: string, accessDuration: string) => api.patch<GrantDto>(`/v1/grants/${id}`, { accessDuration }),
  revokeGrant: (id: string) => api.del<GrantDto>(`/v1/grants/${id}`),
  view: (id: string) => api.get<SignedUrlDto>(`/v1/documents/${id}/view`),
  downloadAttempt: (id: string) => api.post<never>(`/v1/documents/${id}/download-attempt`),
  timeline: (q: Record<string, string | undefined>, signal?: AbortSignal) => api.get<TimelineDto>('/v1/medical-history', q, signal),
  doctorShared: (patientId: string, signal?: AbortSignal) => api.get<SharedDocumentsDto>(`/v1/doctor/patients/${patientId}/documents`, undefined, signal),
  doctorTimeline: (patientId: string, signal?: AbortSignal) => api.get<TimelineDto>(`/v1/doctor/patients/${patientId}/medical-history`, undefined, signal),
  attachToAppointment: (appointmentId: string, documentIds: string[]) => api.post(`/v1/appointments/${appointmentId}/documents`, { documentIds }),
};

/** Signed URL-i bir dəfə yükləyib blob URL qaytarır (URL birdəfəlikdir — brauzer görüntüləyicisi ikinci sorğu atmasın). */
export async function fetchSigned(url: string): Promise<string> {
  const res = await fetch(`${BASE}${url}`);
  if (!res.ok) throw new ApiClientError(res.status, 'Forbidden', t('net.linkExpired'));
  return URL.createObjectURL(await res.blob());
}
