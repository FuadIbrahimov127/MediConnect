import type { ScheduleConflictDto, ScheduleDayInput, ScheduleDto, ScheduleSaveResultDto } from '@mediconnect/shared';
import type { Actor } from '../core/actor';
import { denyAccess } from '../core/access';
import { audit } from '../core/audit';
import { addDaysToDate, bakuDate, bakuDayOfWeek, clock, minutesToTime, timeToMinutes } from '../core/clock';
import { ApiError } from '../core/errors';
import { getSetting } from '../core/settings';
import { db } from '../store/db';
import { newId } from '../store/repo';
import type { Appointment, DoctorClinic } from '../store/types';
import { cancelAppointment } from './appointments.service';
import { notify } from './notifications.service';
import { regenerateSlots, workIntervals } from './schedule.service';
import { slotStart } from './slots.service';
import { doctorFullName } from './visibility';

// UC-702 (həkim) və UC-803 (klinika admini) — cədvəlin idarəsi. Hər iki rol eyni qaydalara tabedir:
// validasiya (EF-702-2..5), klinika saatları (BR-702-02), iki klinika qadağası (BR-702-07), mövcud randevularla konflikt
// (EF-702-1, BR-702-04) və yalnız gələcəyə tətbiq (BR-702-05). Admin dəyişikliyi həkimə bildirilir (BR-702-09).

/** Rola görə həkim–klinika bağlantısı: həkim — öz bağlantısı, klinika admini — öz klinikasındakı həkim (BR-803-01). */
export function resolveDoctorClinic(actor: Actor, clinicId: string, doctorId?: string): DoctorClinic {
  if (actor.role === 'DOCTOR') {
    const d = db.doctors.find((x) => x.userId === actor.userId);
    const dc = d && db.doctor_clinics.find((x) => x.doctorId === d.doctorId && x.clinicId === clinicId && x.status !== 'REMOVED' && x.status !== 'INVITED');
    if (!dc) denyAccess(actor, `cədvəl ${clinicId}`);
    return dc;
  }
  if (actor.role === 'CLINIC_ADMIN') {
    const mine = db.clinic_admins.some((a) => a.userId === actor.userId && a.clinicId === clinicId && a.status === 'ACTIVE');
    const dc = mine && doctorId ? db.doctor_clinics.find((x) => x.doctorId === doctorId && x.clinicId === clinicId && x.status !== 'REMOVED') : undefined;
    if (!dc) denyAccess(actor, `həkim cədvəli ${doctorId}@${clinicId}`); // EF-803-4
    return dc;
  }
  throw new ApiError('Forbidden');
}

const ACTIVE = ['PENDING', 'CONFIRMED'];
const dayOf = (a: Appointment) => bakuDate(new Date(a.startAt));
const minutesOf = (iso: string) => timeToMinutes(new Date(new Date(iso).getTime() + 4 * 3_600_000).toISOString().slice(11, 16));

function patientName(a: Appointment) {
  const p = db.patients.find((x) => x.patientId === a.patientId)!;
  const u = db.users.find((x) => x.userId === p.userId)!;
  return `${u.firstName} ${u.lastName}`;
}

const conflictDto = (a: Appointment): ScheduleConflictDto => ({ appointmentId: a.appointmentId, date: dayOf(a), startTime: minutesToTime(minutesOf(a.startAt)), patientName: patientName(a), status: a.status });

function futureActive(dc: DoctorClinic) {
  return db.appointments.filter((a) => a.doctorClinicId === dc.doctorClinicId && ACTIVE.includes(a.status) && new Date(a.startAt).getTime() > clock.nowMs());
}

// ── Oxumaq ──

export function getSchedule(actor: Actor, dc: DoctorClinic, from?: string, days = 7): ScheduleDto {
  const clinic = db.clinics.find((c) => c.clinicId === dc.clinicId)!;
  const schedules = db.doctor_schedules.filter((s) => s.doctorClinicId === dc.doctorClinicId && s.isActive).sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime));
  const start = from ?? bakuDate();
  const end = addDaysToDate(start, days - 1);
  const apptBySlot = new Map<string, Appointment>();
  for (const a of db.appointments) if (a.doctorClinicId === dc.doctorClinicId && a.status !== 'CANCELLED') for (const id of a.slotIds) apptBySlot.set(id, a);

  const calendar: ScheduleDto['calendar'] = [];
  for (let date = start; date <= end; date = addDaysToDate(date, 1)) {
    calendar.push({
      date,
      slots: db.appointment_slots
        .filter((s) => s.doctorClinicId === dc.doctorClinicId && s.slotDate === date)
        .sort((a, b) => a.startTime.localeCompare(b.startTime))
        .map((s) => {
          const a = s.status === 'BOOKED' ? apptBySlot.get(s.slotId) : undefined;
          return {
            slotId: s.slotId,
            startTime: s.startTime,
            endTime: s.endTime,
            status: s.status,
            patientName: a ? patientName(a) : null,
            appointmentId: a?.appointmentId ?? null,
            blockedReason: s.blockedReason,
            past: slotStart(s).getTime() <= clock.nowMs(),
          };
        }),
    });
  }

  const others = db.doctor_clinics.filter((x) => x.doctorId === dc.doctorId && x.doctorClinicId !== dc.doctorClinicId && (x.status === 'ACTIVE' || x.status === 'INACTIVE'));
  const otherClinics =
    actor.role === 'DOCTOR'
      ? others.flatMap((o) =>
          db.doctor_schedules
            .filter((s) => s.doctorClinicId === o.doctorClinicId && s.isActive)
            .map((s) => ({ clinicName: db.clinics.find((c) => c.clinicId === o.clinicId)!.name, dayOfWeek: s.dayOfWeek, startTime: s.startTime, endTime: s.endTime })),
        )
      : []; // BR-803-07: admin həkimin başqa klinikadakı cədvəlini görmür

  return {
    clinicId: clinic.clinicId,
    clinicName: clinic.name,
    doctorClinicId: dc.doctorClinicId,
    clinicHours: db.clinic_working_hours
      .filter((h) => h.clinicId === clinic.clinicId)
      .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
      .map(({ dayOfWeek, opensAt, closesAt, isClosed }) => ({ dayOfWeek, opensAt, closesAt, isClosed })),
    days: schedules.map((s) => ({
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      slotDurationMinutes: s.slotDurationMinutes as ScheduleDayInput['slotDurationMinutes'],
      bufferMinutes: s.bufferMinutes,
      breaks: db.schedule_breaks.filter((b) => b.scheduleId === s.scheduleId).map((b) => ({ breakStart: b.breakStart, breakEnd: b.breakEnd, breakName: b.breakName })),
    })),
    exceptions: db.schedule_exceptions
      .filter((e) => e.doctorClinicId === dc.doctorClinicId && e.endDate >= bakuDate())
      .sort((a, b) => a.startDate.localeCompare(b.startDate))
      .map(({ exceptionId, exceptionType, startDate, endDate, startTime, endTime, reason }) => ({ exceptionId, exceptionType, startDate, endDate, startTime, endTime, reason })),
    calendar,
    otherClinics,
    updatedAt: schedules.reduce<string | null>((m, s) => (!m || s.updatedAt > m ? s.updatedAt : m), null),
  };
}

// ── Validasiya ──

const DAY = ['', 'Bazar ertəsi', 'Çərşənbə axşamı', 'Çərşənbə', 'Cümə axşamı', 'Cümə', 'Şənbə', 'Bazar'];
const overlap = (a: { s: number; e: number }, b: { s: number; e: number }) => a.s < b.e && b.s < a.e;

function validateDays(dc: DoctorClinic, days: ScheduleDayInput[]) {
  const byDay = new Map<number, { s: number; e: number }[]>();
  for (const d of days) {
    const s = timeToMinutes(d.startTime);
    const e = timeToMinutes(d.endTime);
    // EF-702-3: bitmə başlanğıcdan əvvəl ola bilməz; ən azı bir slot sığmalıdır.
    if (e <= s) throw new ApiError('ScheduleOverlap', { dayOfWeek: d.dayOfWeek }, `${DAY[d.dayOfWeek]}: bitmə saatı başlama saatından sonra olmalıdır`);
    if (e - s < d.slotDurationMinutes) throw new ApiError('ScheduleOverlap', { dayOfWeek: d.dayOfWeek }, `${DAY[d.dayOfWeek]}: interval slot müddətindən qısadır`);
    // EF-702-2: eyni gündə intervallar üst-üstə düşməməlidir.
    const list = byDay.get(d.dayOfWeek) ?? [];
    if (list.some((x) => overlap(x, { s, e }))) throw new ApiError('ScheduleOverlap', { dayOfWeek: d.dayOfWeek }, `${DAY[d.dayOfWeek]}: vaxt aralıqları üst-üstə düşür`);
    list.push({ s, e });
    byDay.set(d.dayOfWeek, list);
    const brs: { s: number; e: number }[] = [];
    for (const b of d.breaks) {
      const bs = timeToMinutes(b.breakStart);
      const be = timeToMinutes(b.breakEnd);
      if (be <= bs || bs < s || be > e || brs.some((x) => overlap(x, { s: bs, e: be }))) {
        throw new ApiError('ScheduleOverlap', { dayOfWeek: d.dayOfWeek }, `${DAY[d.dayOfWeek]}: fasilə iş saatları daxilində olmalı və üst-üstə düşməməlidir`);
      }
      brs.push({ s: bs, e: be });
    }
    // BR-702-02 / EF-702-4: klinikanın iş saatları yuxarı sərhəddir.
    const h = db.clinic_working_hours.find((x) => x.clinicId === dc.clinicId && x.dayOfWeek === d.dayOfWeek);
    if (!h || h.isClosed || !h.opensAt || !h.closesAt || s < timeToMinutes(h.opensAt) || e > timeToMinutes(h.closesAt)) {
      throw new ApiError(
        'ScheduleOutsideClinicHours',
        { dayOfWeek: d.dayOfWeek, opensAt: h?.opensAt ?? null, closesAt: h?.closesAt ?? null },
        `${DAY[d.dayOfWeek]}: cədvəl klinikanın iş saatlarından kənardadır (${h && !h.isClosed ? `${h.opensAt}–${h.closesAt}` : 'klinika bağlıdır'}). Klinika administratorundan iş saatlarını genişləndirməyi xahiş edin.`,
      );
    }
    // BR-702-07 / EF-702-5: həkim eyni vaxtda başqa klinikada ola bilməz.
    for (const other of db.doctor_clinics.filter((x) => x.doctorId === dc.doctorId && x.doctorClinicId !== dc.doctorClinicId && (x.status === 'ACTIVE' || x.status === 'INACTIVE'))) {
      for (const os of db.doctor_schedules.filter((x) => x.doctorClinicId === other.doctorClinicId && x.isActive && x.dayOfWeek === d.dayOfWeek)) {
        if (overlap({ s, e }, { s: timeToMinutes(os.startTime), e: timeToMinutes(os.endTime) })) {
          const cn = db.clinics.find((c) => c.clinicId === other.clinicId)!.name;
          throw new ApiError('DoctorBusyInOtherClinic', { dayOfWeek: d.dayOfWeek, clinicName: cn }, `${DAY[d.dayOfWeek]}: həkimin bu vaxtda ${cn}-da cədvəli var`);
        }
      }
    }
  }
}

/** Randevu yeni şablona sığırmı (iş intervalı daxilində və fasiləyə düşmür)? */
function fits(a: Appointment, days: ScheduleDayInput[]) {
  const dow = bakuDayOfWeek(dayOf(a));
  const s = minutesOf(a.startAt);
  const e = minutesOf(a.endAt) || 24 * 60;
  return days.some(
    (d) =>
      d.dayOfWeek === dow &&
      s >= timeToMinutes(d.startTime) &&
      e <= timeToMinutes(d.endTime) &&
      !d.breaks.some((b) => overlap({ s, e }, { s: timeToMinutes(b.breakStart), e: timeToMinutes(b.breakEnd) })),
  );
}

function cancelConflicts(actor: Actor, list: Appointment[], reason: string) {
  for (const a of list) cancelAppointment(actor, a.appointmentId, reason); // BR-702-11: pasientlərə bildiriş gedir
}

function notifyDoctorIfAdmin(actor: Actor, dc: DoctorClinic) {
  if (actor.role !== 'CLINIC_ADMIN') return;
  const doc = db.doctors.find((d) => d.doctorId === dc.doctorId)!;
  notify({ type: 'SCHEDULE_CHANGED', userId: doc.userId, vars: { clinicName: db.clinics.find((c) => c.clinicId === dc.clinicId)!.name, doctorName: doctorFullName(doc) }, deepLink: '/doctor/schedule' });
}

const horizon = () => addDaysToDate(bakuDate(), getSetting('slot_generation_days'));

// ── Şablonun saxlanması (FR-702-01..10, 16..27) ──

export function saveSchedule(actor: Actor, dc: DoctorClinic, input: { days: ScheduleDayInput[]; dryRun: boolean; conflictResolution?: 'CANCEL_AND_NOTIFY' }): ScheduleSaveResultDto {
  validateDays(dc, input.days);
  const conflicts = futureActive(dc).filter((a) => !fits(a, input.days));
  const dtos = conflicts.map(conflictDto);
  if (input.dryRun) return { saved: false, conflicts: dtos, cancelledCount: 0, slotsGenerated: 0 };
  // EF-702-1: təsdiqlənmiş randevularla konflikt → qərar tələb olunur.
  if (conflicts.length && !input.conflictResolution) throw new ApiError('ScheduleConflict', { count: conflicts.length, appointments: dtos });
  if (conflicts.length) cancelConflicts(actor, conflicts, 'Həkimin iş cədvəli dəyişdirildi');

  const old = getSchedule(actor, dc).days;
  const oldIds = new Set(db.doctor_schedules.filter((s) => s.doctorClinicId === dc.doctorClinicId).map((s) => s.scheduleId));
  db.schedule_breaks = db.schedule_breaks.filter((b) => !oldIds.has(b.scheduleId));
  db.doctor_schedules = db.doctor_schedules.filter((s) => s.doctorClinicId !== dc.doctorClinicId);
  const now = clock.nowIso();
  for (const d of input.days) {
    const scheduleId = newId();
    db.doctor_schedules.push({ scheduleId, doctorClinicId: dc.doctorClinicId, dayOfWeek: d.dayOfWeek, startTime: d.startTime, endTime: d.endTime, slotDurationMinutes: d.slotDurationMinutes, bufferMinutes: d.bufferMinutes, isActive: true, updatedBy: actor.userId, createdAt: now, updatedAt: now });
    for (const b of d.breaks) db.schedule_breaks.push({ breakId: newId(), scheduleId, breakStart: b.breakStart, breakEnd: b.breakEnd, breakName: b.breakName ?? null });
  }
  // BR-702-05: yalnız gələcək — regenerateSlots keçmiş slotlara toxunmur.
  const generated = regenerateSlots(dc.doctorClinicId, bakuDate(), horizon());
  audit(actor, { action: 'UPDATE_SCHEDULE', entityType: 'DOCTOR_CLINIC', entityId: dc.doctorClinicId, oldValue: old, newValue: input.days, reason: conflicts.length ? `${conflicts.length} randevu ləğv edildi` : null });
  notifyDoctorIfAdmin(actor, dc);
  return { saved: true, conflicts: dtos, cancelledCount: conflicts.length, slotsGenerated: generated };
}

// ── İstisnalar: bağlı gün, məzuniyyət, əlavə iş saatı (FR-702-11..14) ──

export function addException(
  actor: Actor,
  dc: DoctorClinic,
  input: { exceptionType: 'DAY_OFF' | 'VACATION' | 'EXTRA_HOURS'; startDate: string; endDate: string; startTime?: string | null; endTime?: string | null; reason?: string | null; conflictResolution?: 'CANCEL_AND_NOTIFY' },
) {
  const today = bakuDate();
  if (input.startDate < today || input.endDate < input.startDate) throw new ApiError('ValidationError', { fields: { startDate: 'Tarix aralığı gələcəkdə olmalıdır' } });
  if (input.endDate > horizon()) throw new ApiError('ValidationError', { fields: { endDate: `Maksimum ${getSetting('slot_generation_days')} gün irəli` } });

  if (input.exceptionType === 'EXTRA_HOURS') {
    if (!input.startTime || !input.endTime || timeToMinutes(input.endTime) <= timeToMinutes(input.startTime)) throw new ApiError('ScheduleOverlap', undefined, 'Əlavə iş saatı üçün başlama və bitmə saatı düzgün olmalıdır');
    if (input.endDate !== input.startDate) throw new ApiError('ValidationError', { fields: { endDate: 'Əlavə iş saatı bir gün üçündür' } });
    const s = timeToMinutes(input.startTime);
    const e = timeToMinutes(input.endTime);
    // Mövcud iş saatı ilə və həkimin digər klinikası ilə kəsişməsin.
    if (workIntervals(dc, input.startDate).some((iv) => overlap({ s, e }, { s: iv.start, e: iv.end }))) throw new ApiError('ScheduleOverlap', undefined, 'Bu vaxt artıq iş saatına daxildir');
    for (const other of db.doctor_clinics.filter((x) => x.doctorId === dc.doctorId && x.doctorClinicId !== dc.doctorClinicId && x.status === 'ACTIVE')) {
      if (workIntervals(other, input.startDate).some((iv) => overlap({ s, e }, { s: iv.start, e: iv.end }))) {
        throw new ApiError('DoctorBusyInOtherClinic', undefined, `Həkimin bu vaxtda ${db.clinics.find((c) => c.clinicId === other.clinicId)!.name}-da cədvəli var`);
      }
    }
  } else {
    // FR-702-13: məzuniyyətdə randevu qəbulu dayanır — mövcud randevular üçün qərar tələb olunur.
    const conflicts = futureActive(dc).filter((a) => dayOf(a) >= input.startDate && dayOf(a) <= input.endDate);
    if (conflicts.length && !input.conflictResolution) throw new ApiError('ScheduleConflict', { count: conflicts.length, appointments: conflicts.map(conflictDto) });
    cancelConflicts(actor, conflicts, input.exceptionType === 'VACATION' ? 'Həkim məzuniyyətdədir' : 'Həkim bu gün qəbul aparmır');
  }

  const ex = {
    exceptionId: newId(), doctorClinicId: dc.doctorClinicId, exceptionType: input.exceptionType, startDate: input.startDate, endDate: input.endDate,
    startTime: input.exceptionType === 'EXTRA_HOURS' ? input.startTime ?? null : null, endTime: input.exceptionType === 'EXTRA_HOURS' ? input.endTime ?? null : null,
    reason: input.reason ?? null, createdBy: actor.userId, createdAt: clock.nowIso(),
  };
  db.schedule_exceptions.push(ex);
  regenerateSlots(dc.doctorClinicId, input.startDate, input.endDate);
  audit(actor, { action: 'ADD_SCHEDULE_EXCEPTION', entityType: 'DOCTOR_CLINIC', entityId: dc.doctorClinicId, newValue: ex });
  notifyDoctorIfAdmin(actor, dc);
  return ex;
}

export function removeException(actor: Actor, dc: DoctorClinic, exceptionId: string) {
  const i = db.schedule_exceptions.findIndex((e) => e.exceptionId === exceptionId && e.doctorClinicId === dc.doctorClinicId);
  if (i < 0) throw new ApiError('NotFound');
  const [ex] = db.schedule_exceptions.splice(i, 1);
  const from = ex.startDate < bakuDate() ? bakuDate() : ex.startDate;
  if (ex.endDate >= from) regenerateSlots(dc.doctorClinicId, from, ex.endDate);
  audit(actor, { action: 'REMOVE_SCHEDULE_EXCEPTION', entityType: 'DOCTOR_CLINIC', entityId: dc.doctorClinicId, oldValue: ex });
  notifyDoctorIfAdmin(actor, dc);
}

// ── Tək slotun bloklanması (FR-702-15, EF-702-6) ──

export function setSlotBlocked(actor: Actor, slotId: string, blocked: boolean, reason?: string | null, doctorId?: string) {
  const slot = db.appointment_slots.find((s) => s.slotId === slotId);
  if (!slot) throw new ApiError('NotFound');
  const owner = db.doctor_clinics.find((x) => x.doctorClinicId === slot.doctorClinicId)!;
  const dc = resolveDoctorClinic(actor, owner.clinicId, doctorId ?? owner.doctorId);
  if (dc.doctorClinicId !== slot.doctorClinicId) denyAccess(actor, `slot ${slotId}`);
  if (slotStart(slot).getTime() <= clock.nowMs()) throw new ApiError('InvalidStatusTransition');
  if (blocked) {
    if (slot.status === 'BOOKED') throw new ApiError('ScheduleConflict', undefined, 'Bu slotda randevu var — əvvəlcə randevunu idarə edin'); // EF-702-6
    if (slot.status === 'SOFT_LOCKED' && slot.lockedUntil && new Date(slot.lockedUntil).getTime() > clock.nowMs()) throw new ApiError('SlotUnavailable');
    Object.assign(slot, { status: 'BLOCKED', blockedReason: reason ?? 'Həkim tərəfindən bağlanıb', lockedBy: null, lockedUntil: null, updatedAt: clock.nowIso() });
  } else {
    if (slot.status !== 'BLOCKED' || slot.blockedReason === 'Köçürmə təklifi') throw new ApiError('InvalidStatusTransition');
    Object.assign(slot, { status: 'AVAILABLE', blockedReason: null, updatedAt: clock.nowIso() });
  }
  audit(actor, { action: blocked ? 'BLOCK_SLOT' : 'UNBLOCK_SLOT', entityType: 'SLOT', entityId: slot.slotId, reason: reason ?? null });
  return slot;
}

