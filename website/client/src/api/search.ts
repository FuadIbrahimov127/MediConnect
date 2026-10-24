import type {
  AutocompleteItemDto,
  ClinicDetailDto,
  ClinicSearchResultDto,
  DoctorDetailDto,
  DoctorSearchResultDto,
  DoctorSlotsDto,
  ReviewListDto,
} from '@mediconnect/shared';
import { api } from './client';

// Modul 2–3 — public axtarış və detal səhifələri (Guest də istifadə edir).

type Q = Record<string, string | number | string[] | undefined>;

export const searchApi = {
  doctors: (q: Q, signal?: AbortSignal) => api.get<DoctorSearchResultDto>('/v1/doctors', q, signal),
  doctorAutocomplete: (query: string, signal?: AbortSignal) => api.get<AutocompleteItemDto[]>('/v1/doctors/autocomplete', { query }, signal),
  doctor: (id: string, signal?: AbortSignal) => api.get<DoctorDetailDto>(`/v1/doctors/${id}`, undefined, signal),
  slots: (id: string, q: { clinicId: string; serviceId?: string; from?: string; days?: number }, signal?: AbortSignal) =>
    api.get<DoctorSlotsDto>(`/v1/doctors/${id}/slots`, q, signal),
  doctorReviews: (id: string, q: { sort?: string; page?: number; size?: number }, signal?: AbortSignal) => api.get<ReviewListDto>(`/v1/doctors/${id}/reviews`, q, signal),
  clinics: (q: Q, signal?: AbortSignal) => api.get<ClinicSearchResultDto>('/v1/clinics', q, signal),
  clinicAutocomplete: (query: string, signal?: AbortSignal) => api.get<AutocompleteItemDto[]>('/v1/clinics/autocomplete', { query }, signal),
  clinic: (id: string, signal?: AbortSignal) => api.get<ClinicDetailDto>(`/v1/clinics/${id}`, undefined, signal),
  clinicReviews: (id: string, q: { sort?: string; page?: number; size?: number }, signal?: AbortSignal) => api.get<ReviewListDto>(`/v1/clinics/${id}/reviews`, q, signal),
};
