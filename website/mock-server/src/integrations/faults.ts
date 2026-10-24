// Xarici servislərin nasazlıq simulyasiyası (dev panel → "Nasazlıqlar"). 'down' = cavab vermir (503), 'error' = xəta qaytarır.

export type FaultMode = 'ok' | 'down' | 'error';
export const FAULT_TARGETS = ['sima', 'sms', 'push', 'email', 'signature', 'storage', 'antivirus'] as const;
export type FaultTarget = (typeof FAULT_TARGETS)[number];

const state: Record<FaultTarget, FaultMode> = Object.fromEntries(FAULT_TARGETS.map((t) => [t, 'ok'])) as Record<FaultTarget, FaultMode>;

export const faults = {
  get: (t: FaultTarget) => state[t],
  all: () => ({ ...state }),
  set(t: FaultTarget, mode: FaultMode) {
    state[t] = mode;
  },
  reset() {
    for (const t of FAULT_TARGETS) state[t] = 'ok';
  },
};
