// Cihaz identifikatoru (yeni cihaz aşkarlanması — FR-102-13) və biometrik giriş tokenləri (F9).
// Biometrik data heç vaxt serverə getmir (FR-101-40): cihazda yalnız server verdiyi etibarlı-cihaz tokeni saxlanır.

const DEVICE_KEY = 'mc.device';
const BIO_KEY = 'mc.bio';

const safeGet = (k: string) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
const safeSet = (k: string, v: string) => {
  try {
    localStorage.setItem(k, v);
  } catch {
    /* yaddaş əlçatmaz */
  }
};

let memoryDeviceId: string | null = null;

export function deviceId(): string {
  const saved = safeGet(DEVICE_KEY);
  if (saved) return saved;
  memoryDeviceId ??= `web-${crypto.randomUUID().slice(0, 8)}`;
  safeSet(DEVICE_KEY, memoryDeviceId);
  return memoryDeviceId;
}

function bioMap(): Record<string, string> {
  try {
    return JSON.parse(safeGet(BIO_KEY) ?? '{}') as Record<string, string>;
  } catch {
    return {};
  }
}

export const biometricStore = {
  get: (phone: string): string | null => bioMap()[phone] ?? null,
  set(phone: string, token: string | null) {
    const m = bioMap();
    if (token) m[phone] = token;
    else delete m[phone];
    safeSet(BIO_KEY, JSON.stringify(m));
  },
};
