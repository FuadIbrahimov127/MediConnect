import type {
  DrugDto,
  DrugInfoDto,
  MedicationInput,
  PrescriptionCheckDto,
  PrescriptionContextDto,
  PrescriptionDto,
  PrescriptionListDto,
  PrescriptionTab,
  PrescriptionVerifyDto,
  RenewalRequestDto,
  TemplateDto,
} from '@mediconnect/shared';
import { downloadAuthorized } from './appointments';
import { api } from './client';

// Modul 6 — e-resept (api-contract.md → Reseptlər).

export type PrescriptionPatch = Partial<{ diagnosis: string; icd10Code: string | null; generalNotes: string | null; validDays: number; medications: MedicationInput[] }>;

export const prescriptionsApi = {
  list: (tab: PrescriptionTab, signal?: AbortSignal, patientId?: string) => api.get<PrescriptionListDto>('/v1/prescriptions', { tab, patientId }, signal),
  get: (id: string, signal?: AbortSignal) => api.get<PrescriptionDto>(`/v1/prescriptions/${id}`, undefined, signal),
  create: (body: { appointmentId: string; templateId?: string; copyFromPrescriptionId?: string }) => api.post<PrescriptionDto>('/v1/prescriptions', body),
  context: (id: string, signal?: AbortSignal) => api.get<PrescriptionContextDto>(`/v1/prescriptions/${id}/context`, undefined, signal),
  update: (id: string, body: PrescriptionPatch) => api.patch<PrescriptionDto>(`/v1/prescriptions/${id}`, body),
  check: (id: string) => api.post<PrescriptionCheckDto>(`/v1/prescriptions/${id}/check`),
  sign: (id: string, body: { confirmationPin: string; overrides: { medicationIndex: number; reason: string }[]; controlledJustification?: string }) =>
    api.post<PrescriptionDto>(`/v1/prescriptions/${id}/sign`, body),
  cancel: (id: string, reason: string) => api.patch<PrescriptionDto>(`/v1/prescriptions/${id}/cancel`, { reason }),
  pdf: (p: { prescriptionId: string; prescriptionNumber: string | null }) => downloadAuthorized(`/v1/prescriptions/${p.prescriptionId}/pdf`, `${p.prescriptionNumber ?? 'resept'}.pdf`),
  verify: (qrToken: string, signal?: AbortSignal) => api.get<PrescriptionVerifyDto>(`/v1/prescriptions/verify/${qrToken}`, undefined, signal),
  requestRenewal: (id: string, note?: string) => api.post<PrescriptionDto>(`/v1/prescriptions/${id}/renewal-requests`, { note }),
  renewals: (status?: 'PENDING' | 'APPROVED' | 'REJECTED', signal?: AbortSignal) => api.get<RenewalRequestDto[]>('/v1/renewal-requests', { status }, signal),
  resolveRenewal: (id: string, body: { decision: 'APPROVE' | 'REJECT'; reason?: string }) => api.patch<RenewalRequestDto>(`/v1/renewal-requests/${id}`, body),
  drugs: (query: string, signal?: AbortSignal) => api.get<DrugDto[]>('/v1/drugs', { query }, signal),
  drug: (id: string, signal?: AbortSignal) => api.get<DrugInfoDto>(`/v1/drugs/${id}`, undefined, signal),
  templates: (signal?: AbortSignal) => api.get<TemplateDto[]>('/v1/doctor/prescription-templates', undefined, signal),
  saveTemplate: (body: { name: string; medications: MedicationInput[] }) => api.post<TemplateDto[]>('/v1/doctor/prescription-templates', body),
  deleteTemplate: (id: string) => api.del<TemplateDto[]>(`/v1/doctor/prescription-templates/${id}`),
};

/** Reseptin pasient və aptek üçün doğrulama ünvanı (QR-ın məzmunu). */
export const verifyUrl = (qrToken: string) => `${window.location.origin}/prescriptions/verify/${qrToken}`;
