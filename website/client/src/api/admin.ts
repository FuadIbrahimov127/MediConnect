import type {
  AdminClinicDetailDto,
  AdminClinicRowDto,
  AdminDrugDto,
  AdminInteractionDto,
  AdminServiceRequestDto,
  AdminSettingDto,
  AdminTemplateDto,
  AdminUserDetailDto,
  AdminUsersDto,
  AuditPageDto,
  CatalogRowDto,
  ClinicAction,
  LicenseCheckDto,
  PlatformStatsDto,
  SecurityPageDto,
} from '@mediconnect/shared';
import { currentLanguage, t } from '../i18n';
import { downloadAuthorized } from './appointments';
import { api, ApiClientError, tokenStore } from './client';
import type { DataUrlFile } from './clinicAdmin';

// Modul 9 — Super Admin (api-contract.md → Super admin).

const B = '/v1/admin';
type Q = Record<string, string | number | undefined>;

export const adminApi = {
  stats: (signal?: AbortSignal) => api.get<PlatformStatsDto>(`${B}/stats`, undefined, signal),

  clinics: (q: Q, signal?: AbortSignal) => api.get<AdminClinicRowDto[]>(`${B}/clinics`, q, signal),
  licenseCheck: (licenseNumber: string) => api.post<LicenseCheckDto>(`${B}/clinics/license-check`, { licenseNumber }),
  createClinic: (body: Record<string, unknown>) => api.post<AdminClinicDetailDto>(`${B}/clinics`, body),
  clinic: (id: string, signal?: AbortSignal) => api.get<AdminClinicDetailDto>(`${B}/clinics/${id}`, undefined, signal),
  clinicAction: (id: string, body: { action: ClinicAction; reason: string; conflictResolution?: 'CANCEL_AND_NOTIFY' }) => api.patch<AdminClinicDetailDto>(`${B}/clinics/${id}`, body),
  renewLicense: (id: string, body: { licenseExpiryDate: string; document: DataUrlFile; reason?: string }) => api.post<AdminClinicDetailDto>(`${B}/clinics/${id}/license`, body),
  addDocument: (id: string, document: DataUrlFile & { kind: string }) => api.post<AdminClinicDetailDto>(`${B}/clinics/${id}/documents`, { document }),
  addAdmin: (id: string, body: { fin: string; mobileNumber: string; firstName: string; lastName: string }) => api.post<AdminClinicDetailDto>(`${B}/clinics/${id}/admins`, body),
  resendAdminInvite: (id: string, userId: string) => api.post<AdminClinicDetailDto>(`${B}/clinics/${id}/admins/${userId}/resend-invite`),

  users: (q: Q, signal?: AbortSignal) => api.get<AdminUsersDto>(`${B}/users`, q, signal),
  user: (id: string, signal?: AbortSignal) => api.get<AdminUserDetailDto>(`${B}/users/${id}`, undefined, signal),
  setUserStatus: (id: string, body: { status: 'BLOCKED' | 'VERIFIED'; reason: string; conflictResolution?: 'CANCEL_AND_NOTIFY'; confirm?: boolean }) =>
    api.patch<AdminUserDetailDto>(`${B}/users/${id}/status`, body),
  revokeSessions: (id: string, reason: string) => api.del<AdminUserDetailDto>(`${B}/users/${id}/sessions`, { reason }),
  anonymize: (id: string, body: { reason: string; conflictResolution?: 'CANCEL_AND_NOTIFY' }) => api.del<AdminUserDetailDto>(`${B}/users/${id}`, body),

  settings: (signal?: AbortSignal) => api.get<AdminSettingDto[]>(`${B}/settings`, undefined, signal),
  updateSetting: (key: string, body: { value: number; confirm?: boolean; reason?: string }) => api.patch<AdminSettingDto[]>(`${B}/settings/${key}`, body),
  settingHistory: (key: string, signal?: AbortSignal) =>
    api.get<{ from: string | null; to: number | null; by: string | null; reason: string | null; at: string }[]>(`${B}/settings/${key}/history`, undefined, signal),

  specialties: (signal?: AbortSignal) => api.get<CatalogRowDto[]>(`${B}/specialties`, undefined, signal),
  saveSpecialty: (id: string | null, body: Record<string, unknown>) => (id ? api.patch<CatalogRowDto[]>(`${B}/specialties/${id}`, body) : api.post<CatalogRowDto[]>(`${B}/specialties`, body)),
  deleteSpecialty: (id: string) => api.del<CatalogRowDto[]>(`${B}/specialties/${id}`),
  services: (signal?: AbortSignal) => api.get<CatalogRowDto[]>(`${B}/services`, undefined, signal),
  saveService: (id: string | null, body: Record<string, unknown>) => (id ? api.patch<CatalogRowDto[]>(`${B}/services/${id}`, body) : api.post<CatalogRowDto[]>(`${B}/services`, body)),
  deleteService: (id: string) => api.del<CatalogRowDto[]>(`${B}/services/${id}`),
  serviceRequests: (signal?: AbortSignal) => api.get<AdminServiceRequestDto[]>(`${B}/service-requests`, undefined, signal),
  resolveServiceRequest: (id: string, body: { decision: 'APPROVE' | 'REJECT'; reason?: string }) => api.patch<AdminServiceRequestDto[]>(`${B}/service-requests/${id}`, body),
  drugs: (q: string, signal?: AbortSignal) => api.get<AdminDrugDto[]>(`${B}/drugs`, { q }, signal),
  saveDrug: (id: string | null, body: Record<string, unknown>) => (id ? api.patch<AdminDrugDto[]>(`${B}/drugs/${id}`, body) : api.post<AdminDrugDto[]>(`${B}/drugs`, body)),
  interactions: (signal?: AbortSignal) => api.get<AdminInteractionDto[]>(`${B}/drug-interactions`, undefined, signal),
  addInteraction: (body: { drugId1: string; drugId2: string; severity: string; description: string }) => api.post<AdminInteractionDto[]>(`${B}/drug-interactions`, body),
  deleteInteraction: (id: string) => api.del<AdminInteractionDto[]>(`${B}/drug-interactions/${id}`),
  templates: (signal?: AbortSignal) => api.get<AdminTemplateDto[]>(`${B}/notification-templates`, undefined, signal),
  updateTemplate: (id: string, body: { titleTemplate: string | null; bodyTemplate: string; isActive?: boolean }) => api.patch<AdminTemplateDto[]>(`${B}/notification-templates/${id}`, body),

  audit: (q: Q, signal?: AbortSignal) => api.get<AuditPageDto>(`${B}/audit-logs`, q, signal),
  exportAudit: (q: Record<string, string>) => downloadAuthorized(`${B}/audit-logs/export?${new URLSearchParams(q).toString()}`, 'audit-log.csv'),
  security: (q: Q, signal?: AbortSignal) => api.get<SecurityPageDto>(`${B}/security-events`, q, signal),
};

/** Qorunan faylı (klinika sənədi) yeni tabda açır — Bearer token ilə yüklənir, blob URL verilir. */
export async function openAuthorized(path: string) {
  const win = window.open('', '_blank');
  const res = await fetch(`${import.meta.env.VITE_API_BASE_URL ?? ''}${path}`, { headers: { Authorization: `Bearer ${tokenStore.get() ?? ''}`, 'Accept-Language': currentLanguage() } });
  if (!res.ok) {
    win?.close();
    throw new ApiClientError(res.status, 'ServerError', t('net.docNotOpened'));
  }
  const url = URL.createObjectURL(await res.blob());
  if (win) win.location.href = url;
  else window.location.href = url;
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
