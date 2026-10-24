import { addDaysToDate, bakuDate, bakuDayOfWeek, bakuToUtc, clock, minutesToTime, timeToMinutes } from '../core/clock';
import { getSetting } from '../core/settings';
import { db } from '../store/db';
import { newId } from '../store/repo';
import type { AppointmentSlot, DoctorClinic } from '../store/types';

// UC-702 — slot generasiyası. Cədvəl şablon kimi işləyir: həftəlik iş rejimi + fasilələr + bufer + istisnalar
// (məzuniyyət, bağlı gün, bayram, əlavə iş saatı) və klinikanın iş saatları (yuxarı sərhəd — BR-801-05).
// Generasiya yalnız gələcəyə tətbiq olunur (BR-702-05) və BOOKED/BLOCKED/aktiv SOFT_LOCKED slotlara toxunmur (BR-702-04).

interface Interval {
  start: number; // dəqiqə (gün başlanğıcından)
  end: number;
  slotDuration: number;
  buffer: number;
  breaks: { start: number; end: number }[];
}

/** Doctor–clinic üçün konkret gündə iş intervalları (istisnalar nəzərə alınmaqla). */
export function workIntervals(dc: DoctorClinic, date: string): Interval[] {
  const dow = bakuDayOfWeek(date);
  const exceptions = db.schedule_exceptions.filter((e) => e.doctorClinicId === dc.doctorClinicId && e.startDate <= date && e.endDate >= date);
  if (exceptions.some((e) => e.exceptionType === 'VACATION' || e.exceptionType === 'DAY_OFF' || e.exceptionType === 'HOLIDAY')) return [];
  if (db.clinic_holidays.some((h) => h.clinicId === dc.clinicId && h.date === date)) return []; // BR-801-07

  const hours = db.clinic_working_hours.find((h) => h.clinicId === dc.clinicId && h.dayOfWeek === dow);
  const clinicOpen = hours && !hours.isClosed && hours.opensAt && hours.closesAt ? { start: timeToMinutes(hours.opensAt), end: timeToMinutes(hours.closesAt) } : null;

  const schedules = db.doctor_schedules.filter((s) => s.doctorClinicId === dc.doctorClinicId && s.isActive);
  const result: Interval[] = [];
  for (const s of schedules.filter((x) => x.dayOfWeek === dow)) {
    if (!clinicOpen) continue;
    const start = Math.max(timeToMinutes(s.startTime), clinicOpen.start);
    const end = Math.min(timeToMinutes(s.endTime), clinicOpen.end);
    if (end <= start) continue;
    const breaks = db.schedule_breaks.filter((b) => b.scheduleId === s.scheduleId).map((b) => ({ start: timeToMinutes(b.breakStart), end: timeToMinutes(b.breakEnd) }));
    result.push({ start, end, slotDuration: s.slotDurationMinutes, buffer: s.bufferMinutes, breaks });
  }
  // Əlavə iş saatı (UC-702 alt 3) — standart cədvəldən kənar, klinika saatı ilə məhdudlaşmır (admin təsdiqi ilə açılır).
  for (const e of exceptions.filter((x) => x.exceptionType === 'EXTRA_HOURS' && x.startTime && x.endTime)) {
    const ref = schedules[0];
    result.push({ start: timeToMinutes(e.startTime!), end: timeToMinutes(e.endTime!), slotDuration: ref?.slotDurationMinutes ?? 30, buffer: ref?.bufferMinutes ?? 0, breaks: [] });
  }
  return result;
}

function slotTimes(iv: Interval): { start: number; end: number }[] {
  const out: { start: number; end: number }[] = [];
  let t = iv.start;
  while (t + iv.slotDuration <= iv.end) {
    const clash = iv.breaks.find((b) => t < b.end && t + iv.slotDuration > b.start);
    if (clash) {
      t = clash.end;
      continue;
    }
    out.push({ start: t, end: t + iv.slotDuration });
    t += iv.slotDuration + iv.buffer;
  }
  return out;
}

const isLiveLock = (s: AppointmentSlot) => s.status === 'SOFT_LOCKED' && !!s.lockedUntil && new Date(s.lockedUntil).getTime() > clock.nowMs();

/**
 * [fromDate, toDate] aralığında slotları yenidən generasiya edir. Gələcək AVAILABLE (və vaxtı keçmiş lock) slotlar
 * silinib şablona görə yenidən yaradılır; BOOKED, BLOCKED və aktiv lock-lar saxlanılır.
 */
export function regenerateSlots(doctorClinicId: string, fromDate: string, toDate: string): number {
  const dc = db.doctor_clinics.find((x) => x.doctorClinicId === doctorClinicId);
  if (!dc) return 0;
  const nowMs = clock.nowMs();
  const inRange = (s: AppointmentSlot) => s.doctorClinicId === doctorClinicId && s.slotDate >= fromDate && s.slotDate <= toDate;
  const startMs = (s: AppointmentSlot) => bakuToUtc(s.slotDate, s.startTime).getTime();

  db.appointment_slots = db.appointment_slots.filter((s) => !(inRange(s) && startMs(s) > nowMs && (s.status === 'AVAILABLE' || (s.status === 'SOFT_LOCKED' && !isLiveLock(s)))));
  // Saxlanılan slotlar (BOOKED, BLOCKED, aktiv lock) — yeni slot onlarla kəsişməməlidir (cədvəl dəyişəndə grid sürüşə bilər).
  const kept = new Map<string, { start: number; end: number }[]>();
  for (const s of db.appointment_slots.filter(inRange)) {
    const list = kept.get(s.slotDate) ?? [];
    list.push({ start: timeToMinutes(s.startTime), end: timeToMinutes(s.endTime) });
    kept.set(s.slotDate, list);
  }

  let created = 0;
  const now = clock.nowIso();
  for (let date = fromDate; date <= toDate; date = addDaysToDate(date, 1)) {
    for (const iv of workIntervals(dc, date)) {
      for (const t of slotTimes(iv)) {
        const startTime = minutesToTime(t.start);
        // Double-booking qadağası (BR-401-02): mövcud slotla kəsişən slot yaradılmır.
        const dayKept = kept.get(date) ?? [];
        if (dayKept.some((k) => t.start < k.end && t.end > k.start)) continue;
        if (bakuToUtc(date, startTime).getTime() <= nowMs) continue;
        db.appointment_slots.push({
          slotId: newId(), doctorClinicId, slotDate: date, startTime, endTime: minutesToTime(t.end),
          status: 'AVAILABLE', lockedBy: null, lockedUntil: null, blockedReason: null, createdAt: now, updatedAt: now,
        });
        dayKept.push({ start: t.start, end: t.end });
        kept.set(date, dayKept);
        created++;
      }
    }
  }
  if (!dc.slotsGeneratedUntil || dc.slotsGeneratedUntil < toDate) dc.slotsGeneratedUntil = toDate;
  return created;
}

/** Rolling generasiya (scheduled job): hər aktiv həkim–klinika üçün gələcək `slot_generation_days` gün (BR-702-06). */
export function rollSlotGeneration(): number {
  const today = bakuDate();
  const horizon = addDaysToDate(today, getSetting('slot_generation_days'));
  let created = 0;
  for (const dc of db.doctor_clinics) {
    if (dc.status !== 'ACTIVE') continue;
    const from = dc.slotsGeneratedUntil && dc.slotsGeneratedUntil >= today ? addDaysToDate(dc.slotsGeneratedUntil, 1) : today;
    if (from > horizon) continue;
    created += regenerateSlots(dc.doctorClinicId, from, horizon);
  }
  return created;
}

/** Vaxtı keçmiş soft lock-ları buraxır (EF-401-2). */
export function releaseExpiredLocks(): number {
  let n = 0;
  for (const s of db.appointment_slots) {
    if (s.status === 'SOFT_LOCKED' && !isLiveLock(s)) {
      Object.assign(s, { status: 'AVAILABLE', lockedBy: null, lockedUntil: null, updatedAt: clock.nowIso() });
      n++;
    }
  }
  return n;
}
