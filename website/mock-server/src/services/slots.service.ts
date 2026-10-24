import type { DoctorSlotsDto, SlotDayDto } from '@mediconnect/shared';
import { addDaysToDate, addHours, bakuDate, bakuToUtc, clock, timeToMinutes } from '../core/clock';
import { ApiError } from '../core/errors';
import { getSetting } from '../core/settings';
import { db } from '../store/db';
import type { AppointmentSlot, DoctorClinic } from '../store/types';

// Slot mövcudluğu: AVAILABLE, gələcəkdə, başlanğıca ≥ min_booking_lead_hours (BR-401-05), klinika randevu qəbul edir.
// Xidmət müddəti slotdan uzundursa ardıcıl slotlar zəncir kimi tutulur (EF-804-3, mock-backend.md).

export const slotStart = (s: AppointmentSlot) => bakuToUtc(s.slotDate, s.startTime);
const slotMinutes = (s: AppointmentSlot) => timeToMinutes(s.endTime) - timeToMinutes(s.startTime);

export function clinicAccepting(clinicId: string): boolean {
  const c = db.clinics.find((x) => x.clinicId === clinicId);
  return !!c && c.status === 'ACTIVE' && c.acceptingAppointments;
}

/** Tək slotun seçilə bilməsi (lock sahibi üçün öz lock-u da "seçilə bilən" sayılır). */
export function isSlotFree(s: AppointmentSlot, forUserId?: string | null): boolean {
  if (s.status === 'AVAILABLE') return true;
  if (s.status !== 'SOFT_LOCKED') return false;
  const expired = !s.lockedUntil || new Date(s.lockedUntil).getTime() <= clock.nowMs();
  return expired || (!!forUserId && s.lockedBy === forUserId);
}

export const tooSoon = (s: AppointmentSlot) => slotStart(s).getTime() < addHours(clock.now(), getSetting('min_booking_lead_hours')).getTime();

/** Gün üzrə sıralanmış slotlar (doctor–clinic). */
function daySlots(doctorClinicId: string, date: string) {
  return db.appointment_slots.filter((s) => s.doctorClinicId === doctorClinicId && s.slotDate === date).sort((a, b) => a.startTime.localeCompare(b.startTime));
}

/**
 * `first` slotundan başlayan, `durationMinutes`-ı örtən ardıcıl slot zənciri. Boşluq (fasilə) varsa və ya slot boş deyilsə null.
 * Bufer vaxtı ardıcıllığı pozmur (növbəti slot əvvəlkinin sonu + bufer daxilində başlaya bilər).
 */
export function slotChain(first: AppointmentSlot, durationMinutes: number | null, forUserId?: string | null, sorted?: AppointmentSlot[]): AppointmentSlot[] | null {
  if (!isSlotFree(first, forUserId)) return null;
  const len = slotMinutes(first);
  const need = durationMinutes ? Math.max(1, Math.ceil(durationMinutes / len)) : 1;
  if (need === 1) return [first];
  const all = sorted ?? daySlots(first.doctorClinicId, first.slotDate);
  const i = all.findIndex((s) => s.slotId === first.slotId);
  const chain = [first];
  for (let k = i + 1; k < all.length && chain.length < need; k++) {
    const prev = chain[chain.length - 1];
    const gap = timeToMinutes(all[k].startTime) - timeToMinutes(prev.endTime);
    if (gap < 0 || gap > 15 || !isSlotFree(all[k], forUserId)) return null;
    chain.push(all[k]);
  }
  return chain.length === need ? chain : null;
}

export function serviceDuration(doctorClinicId: string, serviceId: string | undefined | null): number | null {
  if (!serviceId) return null;
  const cds = db.clinic_doctor_services.find((x) => x.doctorClinicId === doctorClinicId && x.serviceId === serviceId && x.isActive);
  if (!cds) throw new ApiError('NotFound');
  return cds.durationMinutes;
}

/** Ən yaxın boş vaxt (FR-201-24) — UTC ISO. */
export function earliestSlot(dc: DoctorClinic, durationMinutes: number | null = null, untilDate?: string): string | null {
  if (!clinicAccepting(dc.clinicId)) return null;
  const today = bakuDate();
  const candidates = db.appointment_slots
    .filter((s) => s.doctorClinicId === dc.doctorClinicId && s.slotDate >= today && (!untilDate || s.slotDate <= untilDate) && isSlotFree(s) && !tooSoon(s))
    .sort((a, b) => (a.slotDate + a.startTime).localeCompare(b.slotDate + b.startTime));
  for (const s of candidates) {
    if (slotChain(s, durationMinutes)) return slotStart(s).toISOString();
  }
  return null;
}

/** GET /v1/doctors/{id}/slots — klinika üzrə günlərə bölünmüş slotlar (FR-301-16/17/18). */
export function doctorSlots(dc: DoctorClinic, opts: { serviceId?: string; from?: string; days: number }, forUserId?: string | null): DoctorSlotsDto {
  const today = bakuDate();
  const from = opts.from && opts.from > today ? opts.from : today;
  const horizon = addDaysToDate(today, getSetting('slot_generation_days'));
  const to = addDaysToDate(from, opts.days - 1) > horizon ? horizon : addDaysToDate(from, opts.days - 1);
  const duration = serviceDuration(dc.doctorClinicId, opts.serviceId);
  const accepting = clinicAccepting(dc.clinicId);
  const days: SlotDayDto[] = [];

  for (let date = from; date <= to; date = addDaysToDate(date, 1)) {
    const all = daySlots(dc.doctorClinicId, date).filter((s) => s.status !== 'BLOCKED' && slotStart(s).getTime() > clock.nowMs());
    days.push({
      date,
      slots: all.map((s) => ({
        slotId: s.slotId,
        startTime: s.startTime,
        endTime: s.endTime,
        startAt: slotStart(s).toISOString(),
        available: accepting && !tooSoon(s) && !!slotChain(s, duration, forUserId, all),
      })),
    });
  }
  const hasAny = days.some((d) => d.slots.some((s) => s.available));
  let nextAvailableDate: string | null = null;
  if (!hasAny && accepting) {
    const next = earliestSlot(dc, duration);
    nextAvailableDate = next ? bakuDate(new Date(next)) : null;
  }
  return { clinicId: dc.clinicId, serviceId: opts.serviceId ?? null, durationMinutes: duration, acceptingAppointments: accepting, days, nextAvailableDate };
}
