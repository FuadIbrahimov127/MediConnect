import { serverNow } from '../api/client';
import { currentLanguage, t, type TKey } from '../i18n';

// Tarix formatı Bakı vaxtı ilə: "22 sentyabr 2026, 14:30" (ui-guide.md). Ay və gün adları interfeys dilinə görədir.

const TZ = 'Asia/Baku';
const NAMES = {
  az: {
    months: ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avqust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr'],
    short: ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avq', 'sen', 'okt', 'noy', 'dek'],
    weekdays: ['B.', 'B.e.', 'Ç.a.', 'Ç.', 'C.a.', 'C.', 'Ş.'],
    today: 'bu gün', tomorrow: 'sabah', Today: 'Bu gün', Tomorrow: 'Sabah',
  },
  ru: {
    months: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'],
    short: ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'],
    weekdays: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
    today: 'сегодня', tomorrow: 'завтра', Today: 'Сегодня', Tomorrow: 'Завтра',
  },
  en: {
    months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    short: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    today: 'today', tomorrow: 'tomorrow', Today: 'Today', Tomorrow: 'Tomorrow',
  },
} as const;
const L = () => NAMES[currentLanguage()];
/** getDay() sırası: bazar = 0. */
export const weekdaysShort = () => L().weekdays;
/** ISO həftə günü (1 = bazar ertəsi … 7 = bazar): tam və qısa ad. */
export const dayName = (dow: number) => t(`clinicDetail.day${dow}` as TKey);
export const dayShort = (dow: number) => L().weekdays[dow % 7];

function parts(iso: string | Date) {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  const p = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', weekday: 'short' }).formatToParts(d);
  const get = (t: string) => p.find((x) => x.type === t)?.value ?? '';
  const wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
  return { y: Number(get('year')), m: Number(get('month')) - 1, d: Number(get('day')), hh: get('hour'), mm: get('minute'), wd };
}

/** "22 sentyabr 2026" — ISO an və ya 'YYYY-MM-DD' tarix. */
export function formatDate(value: string | Date): string {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map(Number);
    return `${d} ${L().months[m - 1]} ${y}`;
  }
  const p = parts(value);
  return `${p.d} ${L().months[p.m]} ${p.y}`;
}

export function formatDateTime(iso: string | Date): string {
  const p = parts(iso);
  return `${p.d} ${L().months[p.m]} ${p.y}, ${p.hh}:${p.mm}`;
}

export function formatTime(iso: string | Date): string {
  const p = parts(iso);
  return `${p.hh}:${p.mm}`;
}

/** Geri sayım "09:41". */
export function formatCountdown(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

/** Bakı vaxtı ilə YYYY-MM-DD. */
export function bakuDateKey(iso: string | Date): string {
  const p = parts(iso);
  return `${p.y}-${String(p.m + 1).padStart(2, '0')}-${String(p.d).padStart(2, '0')}`;
}

/** "bu gün 10:00", "sabah 14:30", "C.a., 30 okt 09:00" — server saatına görə. */
export function formatSlotLabel(iso: string, now: number = serverNow()): string {
  const key = bakuDateKey(iso);
  const today = bakuDateKey(new Date(now));
  const tomorrow = bakuDateKey(new Date(now + 86_400_000));
  const p = parts(iso);
  const time = `${p.hh}:${p.mm}`;
  if (key === today) return `${L().today} ${time}`;
  if (key === tomorrow) return `${L().tomorrow} ${time}`;
  return `${L().weekdays[p.wd]}, ${p.d} ${L().short[p.m]} ${time}`;
}

/** Gün başlığı: "Bu gün" / "Sabah" / "B.e." + "26 okt". */
export function dayLabel(dateKey: string, now: number = serverNow()): { weekday: string; date: string } {
  const [y, m, d] = dateKey.split('-').map(Number);
  const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  const weekday = dateKey === bakuDateKey(new Date(now)) ? L().Today : dateKey === bakuDateKey(new Date(now + 86_400_000)) ? L().Tomorrow : L().weekdays[wd];
  return { weekday, date: `${d} ${L().short[m - 1]}` };
}
