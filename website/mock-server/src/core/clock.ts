// Bütün server kodu vaxtı buradan alır (Date.now() birbaşa istifadə olunmur) — dev panel vaxtı irəli çəkə bilir.
// Azərbaycan 2016-dan bəri yay vaxtına keçmir, ona görə Bakı = sabit UTC+4.

const BAKU_OFFSET_MS = 4 * 60 * 60 * 1000;
let offsetMs = 0;

export const clock = {
  now: () => new Date(Date.now() + offsetMs),
  nowIso: () => new Date(Date.now() + offsetMs).toISOString(),
  nowMs: () => Date.now() + offsetMs,
  get offsetMinutes() {
    return Math.round(offsetMs / 60_000);
  },
  setOffsetMinutes(minutes: number) {
    offsetMs = minutes * 60_000;
  },
  advanceMinutes(minutes: number) {
    offsetMs += minutes * 60_000;
  },
  /** Vaxtı konkret ana qoyur (testlər üçün). */
  set(date: Date | string) {
    offsetMs = new Date(date).getTime() - Date.now();
  },
  reset() {
    offsetMs = 0;
  },
};

export const addMinutes = (d: Date, m: number) => new Date(d.getTime() + m * 60_000);
export const addHours = (d: Date, h: number) => addMinutes(d, h * 60);
export const addDays = (d: Date, days: number) => addMinutes(d, days * 1440);

const pad = (n: number) => String(n).padStart(2, '0');

/** UTC an → Bakı tarixi 'YYYY-MM-DD'. */
export function bakuDate(d: Date = clock.now()): string {
  const b = new Date(d.getTime() + BAKU_OFFSET_MS);
  return `${b.getUTCFullYear()}-${pad(b.getUTCMonth() + 1)}-${pad(b.getUTCDate())}`;
}

/** UTC an → Bakı saatı 'HH:mm'. */
export function bakuTime(d: Date = clock.now()): string {
  const b = new Date(d.getTime() + BAKU_OFFSET_MS);
  return `${pad(b.getUTCHours())}:${pad(b.getUTCMinutes())}`;
}

/** Bakı saatı (0–23). */
export function bakuHour(d: Date = clock.now()): number {
  return new Date(d.getTime() + BAKU_OFFSET_MS).getUTCHours();
}

/** Həftənin günü Bakı vaxtı ilə: 1 = bazar ertəsi … 7 = bazar. */
export function bakuDayOfWeek(dateStr: string): number {
  const dow = new Date(`${dateStr}T00:00:00Z`).getUTCDay();
  return dow === 0 ? 7 : dow;
}

/** Bakı tarixi + saatı → UTC Date. */
export function bakuToUtc(dateStr: string, timeStr = '00:00'): Date {
  return new Date(new Date(`${dateStr}T${timeStr}:00Z`).getTime() - BAKU_OFFSET_MS);
}

/** 'YYYY-MM-DD' + gün. */
export function addDaysToDate(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export const timeToMinutes = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};
export const minutesToTime = (m: number) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
