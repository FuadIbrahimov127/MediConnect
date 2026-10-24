import type {
  AuthResultDto,
  FlowStartedDto,
  LoginLookupDto,
  NotificationPreferenceDto,
  ProfileDto,
  SessionDto,
  SettingsResultDto,
  SimaSessionDto,
  SimaSessionStatusDto,
} from '@mediconnect/shared';
import { api, request } from './client';

// Modul 1 — UC-101..104 endpoint-ləri (api-contract.md → Auth, Profil).

type FlowRef = { registrationId: string } | { resetId: string };

export const authApi = {
  registerInitiate: (body: { mobileNumber: string; pin: string; returnUrl?: string | null }) => api.post<FlowStartedDto>('/v1/auth/register/initiate', body),
  otpResend: (ref: FlowRef) => api.post<FlowStartedDto>('/v1/auth/otp/resend', ref),
  otpVerify: (ref: FlowRef & { otpCode: string }) => api.post<{ verified: true }>('/v1/auth/otp/verify', ref),
  simaSession: (ref: FlowRef) => api.post<SimaSessionDto>('/v1/auth/sima/session', ref),
  simaStatus: (id: string) => api.get<SimaSessionStatusDto>(`/v1/auth/sima/session/${id}`),
  registerComplete: (body: {
    registrationId: string;
    simaSessionId: string;
    userPin: string;
    userPinConfirm: string;
    medicalConsent: boolean;
    consentVersion: string;
    biometricEnabled: boolean;
    deviceId: string;
  }) => api.post<AuthResultDto>('/v1/auth/register/complete', body),
  lookup: (mobileNumber: string) => api.post<LoginLookupDto>('/v1/auth/login/lookup', { mobileNumber }),
  login: (body: { mobileNumber: string; userPin?: string; deviceToken?: string; deviceId: string }) =>
    request<AuthResultDto>('/v1/auth/login', { method: 'POST', body, silentUnauthorized: true }),
  pinResetInitiate: (mobileNumber: string) => api.post<FlowStartedDto>('/v1/auth/pin/reset/initiate', { mobileNumber }),
  pinReset: (body: { resetId: string; simaSessionId: string; newPin: string; newPinConfirm: string }) => api.post<{ redirectTo: string }>('/v1/auth/pin/reset', body),
  sessions: () => api.get<SessionDto[]>('/v1/auth/sessions'),
  revokeSession: (id: string) => api.del<null>(`/v1/auth/sessions/${id}`),
};

export const profileApi = {
  get: (signal?: AbortSignal) => api.get<ProfileDto>('/v1/profile', undefined, signal),
  update: (body: Record<string, unknown>) => api.patch<ProfileDto>('/v1/profile', body),
  addAllergy: (body: { allergenName: string; severity: string; notes?: string | null }) => api.post<ProfileDto>('/v1/profile/allergies', body),
  removeAllergy: (id: string) => api.del<ProfileDto>(`/v1/profile/allergies/${id}`),
  addCondition: (body: { conditionName: string; icd10Code?: string | null; diagnosedDate?: string | null }) => api.post<ProfileDto>('/v1/profile/chronic-conditions', body),
  removeCondition: (id: string) => api.del<ProfileDto>(`/v1/profile/chronic-conditions/${id}`),
  updateMedications: (regularMedications: { name: string }[]) => api.patch<ProfileDto>('/v1/profile/medications', { regularMedications }),
  phoneChangeInitiate: (mobileNumber: string) => api.post<{ changeId: string; otpExpiresAt: string; maskedNumber: string }>('/v1/profile/phone-change/initiate', { mobileNumber }),
  phoneChangeConfirm: (changeId: string, otpCode: string) => api.post<ProfileDto>('/v1/profile/phone-change/confirm', { changeId, otpCode }),
  consent: (medicalConsent: boolean) => api.put<ProfileDto>('/v1/profile/consent', { medicalConsent, consentVersion: '1.0' }),
  settings: (body: { preferredLanguage?: string; biometricEnabled?: boolean; deviceId?: string }) => api.patch<SettingsResultDto>('/v1/profile/settings', body),
  changePin: (body: { currentPin: string; newPin: string; newPinConfirm: string }) => api.patch<null>('/v1/profile/pin', body),
  preferences: (signal?: AbortSignal) => api.get<NotificationPreferenceDto[]>('/v1/profile/notification-preferences', undefined, signal),
  updatePreferences: (preferences: { notificationType: string; smsEnabled: boolean; pushEnabled: boolean; emailEnabled: boolean }[]) =>
    api.put<NotificationPreferenceDto[]>('/v1/profile/notification-preferences', { preferences }),
  requestDeletion: (reason?: string) => api.del<ProfileDto>('/v1/profile', { reason }),
  cancelDeletion: () => api.post<ProfileDto>('/v1/profile/deletion/cancel'),
};
