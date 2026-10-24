import type { AuthResultDto, DevStateDto, DevUserDto, OutboxMessageDto } from '@mediconnect/shared';
import { api } from './client';

// /__dev — yalnız lokal mock serverdə var (dev panel). Real backenddə istifadə olunmur.

export interface PendingSima {
  qrToken: string;
  purpose: string;
  fin: string;
  mobileNumber: string;
  expiresAt: string;
}

export const devApi = {
  state: () => api.get<DevStateDto>('/__dev/state'),
  reset: () => api.post<{ now: string }>('/__dev/reset'),
  users: () => api.get<DevUserDto[]>('/__dev/users'),
  loginAs: (userId: string) => api.post<AuthResultDto>('/__dev/login-as', { userId }),
  outbox: (channel?: 'SMS' | 'PUSH' | 'EMAIL') => api.get<OutboxMessageDto[]>('/__dev/outbox', { channel }),
  advanceClock: (advanceMinutes: number) => api.post<{ now: string; offsetMinutes: number }>('/__dev/clock', { advanceMinutes }),
  resetClock: () => api.post<{ now: string; offsetMinutes: number }>('/__dev/clock', { reset: true }),
  runJobs: () => api.post<Record<string, number>>('/__dev/jobs/run', {}),
  simaPending: () => api.get<PendingSima[]>('/__dev/sima/pending'),
  simaScan: (qrToken: string, outcome: 'SUCCESS' | 'FAILED' | 'FIN_MISMATCH') =>
    api.post<{ sessionStatus: string; failureReason: string | null }>(`/__dev/sima/${qrToken}/scan`, { outcome }),
  setFault: (target: string, mode: 'ok' | 'down' | 'error') => api.post<Record<string, string>>('/__dev/faults', { target, mode }),
};
