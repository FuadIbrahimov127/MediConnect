import type {
  AppointmentAction,
  AppointmentCreateInput,
  AppointmentCreatedDto,
  AppointmentDto,
  AppointmentListDto,
  AppointmentStatus,
  NotificationType,
  SlotLockDto,
  UserRole,
} from '@mediconnect/shared';
import type { Actor } from '../core/actor';
import { denyAccess } from '../core/access';
import { audit } from '../core/audit';
import { addHours, addMinutes, bakuDate, clock } from '../core/clock';
import { randomDigits } from '../core/crypto';
import { ApiError } from '../core/errors';
import { azDate } from '../core/format';
import { getSetting } from '../core/settings';
import { db } from '../store/db';
import { newId } from '../store/repo';
import type { Appointment, AppointmentSlot, DoctorClinic, Patient } from '../store/types';
import { createGrant, refreshAppointmentGrants, revokeGrantsForAppointment } from './grants.service';
import { cancelScheduledForAppointment, notify, scheduleNotification } from './notifications.service';
import { requireMedicalConsent } from './profile.service';
import { visibleDoctorClinic } from './search.service';
import { clinicAccepting, serviceDuration, slotChain, slotStart, tooSoon } from './slots.service';
import { patientContext } from './patient-context.service';
import { doctorFullName } from './visibility';

// UC-401 randevu, UC-402 ləğv, UC-403 köçürmə, UC-404 siyahı/detal, UC-405 tamamlama/no-show.
// Status maşını: domain-rules.md §3. Hər keçid appointment_status_history-yə yazılır, randevu silinmir (BR-402-05).

const ACTIVE: AppointmentStatus[] = ['PENDING', 'CONFIRMED'];

// ── Kontekst və giriş ──

export function patientOf(actor: Actor): Patient {
  const p = db.patients.find((x) => x.userId === actor.userId);
  if (!p) throw new ApiError('Forbidden');
  return p;
}

const doctorOf = (actor: Actor) => db.doctors.find((d) => d.userId === actor.userId);
const adminClinicIds = (actor: Actor) => db.clinic_admins.filter((a) => a.userId === actor.userId && a.status === 'ACTIVE').map((a) => a.clinicId);
const dcOf = (appt: Appointment) => db.doctor_clinics.find((x) => x.doctorClinicId === appt.doctorClinicId)!;

/** Sahiblik / klinika sərhədi yoxlaması (BR-404-01, BR-703-01, BR-805-01). Uğursuz cəhd → 404 + security event. */
export function loadAppointment(actor: Actor, appointmentId: string): Appointment {
  const appt = db.appointments.find((a) => a.appointmentId === appointmentId);
  if (!appt) throw new ApiError('NotFound');
  const dc = dcOf(appt);
  const ok =
    (actor.role === 'PATIENT' && db.patients.find((p) => p.userId === actor.userId)?.patientId === appt.patientId) ||
    (actor.role === 'DOCTOR' && doctorOf(actor)?.doctorId === dc.doctorId) ||
    (actor.role === 'CLINIC_ADMIN' && adminClinicIds(actor).includes(dc.clinicId)) ||
    // Super Admin: randevu metadata-sı (görmə matrisi) — hesab/klinika əməliyyatlarında ləğv üçün; tibbi sahələr serializer-də boşdur.
    actor.role === 'SUPER_ADMIN';
  if (!ok) denyAccess(actor, `randevu ${appointmentId}`);
  return appt;
}

// ── Köməkçilər ──

const startMs = (a: Appointment) => new Date(a.startAt).getTime();
const hoursUntil = (a: Appointment) => (startMs(a) - clock.nowMs()) / 3_600_000;

function history(appt: Appointment, oldStatus: AppointmentStatus | null, newStatus: AppointmentStatus, actor: Actor | null, reason: string | null = null, oldSlotId: string | null = null) {
  db.appointment_status_history.push({
    historyId: newId(), appointmentId: appt.appointmentId, oldStatus, newStatus, changedBy: actor?.userId ?? null,
    changeReason: reason, oldSlotId, changedAt: clock.nowIso(),
  });
}

function setSlots(slotIds: string[], status: AppointmentSlot['status'], blockedReason: string | null = null) {
  for (const id of slotIds) {
    const s = db.appointment_slots.find((x) => x.slotId === id);
    if (s) Object.assign(s, { status, lockedBy: null, lockedUntil: null, blockedReason, updatedAt: clock.nowIso() });
  }
}

/** Ləğv / köçürmə zamanı köhnə slotlar boşaldılır — yalnız gələcəkdədirsə (BR-402-04). */
function releaseSlots(slotIds: string[]) {
  const future = slotIds.filter((id) => {
    const s = db.appointment_slots.find((x) => x.slotId === id);
    return s && slotStart(s).getTime() > clock.nowMs();
  });
  setSlots(future, 'AVAILABLE');
}

function names(appt: Appointment) {
  const dc = dcOf(appt);
  const doc = db.doctors.find((d) => d.doctorId === dc.doctorId)!;
  const clinic = db.clinics.find((c) => c.clinicId === dc.clinicId)!;
  const patient = db.patients.find((p) => p.patientId === appt.patientId)!;
  const pUser = db.users.find((u) => u.userId === patient.userId)!;
  const start = new Date(appt.startAt);
  return {
    doc,
    clinic,
    patient,
    pUser,
    vars: {
      doctorName: doctorFullName(doc),
      patientName: `${pUser.firstName} ${pUser.lastName}`,
      clinicName: clinic.name,
      date: azDate(bakuDate(start)),
      time: appt.startAt ? new Date(start.getTime() + 4 * 3_600_000).toISOString().slice(11, 16) : '',
      bookingReference: appt.bookingReference,
    },
  };
}

/** Hər iki tərəfə bildiriş: pasientə (həkim adı ilə), həkimə (pasient adı ilə). Tibbi məzmun ötürülmür. */
function notifyBoth(appt: Appointment, type: NotificationType, extra: Record<string, string> = {}, opts: { patient?: boolean; doctor?: boolean } = {}) {
  const { doc, pUser, vars } = names(appt);
  const docUser = db.users.find((u) => u.userId === doc.userId)!;
  if (opts.patient !== false)
    notify({ type, userId: pUser.userId, vars: { ...vars, counterpart: vars.doctorName, ...extra }, deepLink: `/account/appointments/${appt.appointmentId}`, entity: { type: 'APPOINTMENT', id: appt.appointmentId } });
  if (opts.doctor !== false)
    notify({ type, userId: docUser.userId, vars: { ...vars, counterpart: vars.patientName, ...extra }, deepLink: `/doctor/appointments/${appt.appointmentId}`, entity: { type: 'APPOINTMENT', id: appt.appointmentId } });
}

/** Xatırlatmalar: 24 saat və 2 saat əvvəl (BR-401-08, BR-1001-03). Keçmişə düşənlər planlaşdırılmır. */
function scheduleReminders(appt: Appointment) {
  const { pUser, vars } = names(appt);
  for (const [type, hours] of [['REMINDER_24H', getSetting('reminder_first_hours')], ['REMINDER_2H', getSetting('reminder_second_hours')]] as const) {
    const at = addHours(new Date(appt.startAt), -hours);
    if (at.getTime() > clock.nowMs()) scheduleNotification({ userId: pUser.userId, type, at, appointmentId: appt.appointmentId, vars, deepLink: `/account/appointments/${appt.appointmentId}` });
  }
}

function bookingReference(slotDate: string): string {
  const base = `MC-${slotDate.slice(0, 4)}-${slotDate.slice(5, 7)}${slotDate.slice(8, 10)}-`;
  for (;;) {
    const ref = base + randomDigits(4);
    if (!db.appointments.some((a) => a.bookingReference === ref)) return ref; // BR-401-09 (F1)
  }
}

// ── UC-401 slot lock ──

/** Pasientin bütün aktiv lock-larını buraxır (bir anda bir seçim). */
export function releaseLocksOf(userId: string) {
  for (const s of db.appointment_slots) {
    if (s.status === 'SOFT_LOCKED' && s.lockedBy === userId) Object.assign(s, { status: 'AVAILABLE', lockedBy: null, lockedUntil: null, updatedAt: clock.nowIso() });
  }
}

/**
 * Soft lock (BR-401-03, FR-401-14..17). Sinxron "yoxla → yaz" — Node tək thread olduğu üçün paralel sorğulardan
 * yalnız biri uğurlu olur (FR-401-16, EF-401-1). Uzun xidmətdə bütün slot zənciri birlikdə tutulur.
 */
export function lockSlot(actor: Actor, slotId: string, serviceId?: string): SlotLockDto {
  const slot = db.appointment_slots.find((s) => s.slotId === slotId);
  if (!slot) throw new ApiError('NotFound');
  const dc = db.doctor_clinics.find((x) => x.doctorClinicId === slot.doctorClinicId)!;
  visibleDoctorClinic(dc.doctorId, dc.clinicId);
  if (!clinicAccepting(dc.clinicId)) throw new ApiError('ClinicNotAccepting');
  if (slotStart(slot).getTime() <= clock.nowMs() || tooSoon(slot)) throw new ApiError('BookingTooSoon'); // EF-401-7/8
  const chain = slotChain(slot, serviceDuration(dc.doctorClinicId, serviceId), actor.userId);
  if (!chain) throw new ApiError('SlotUnavailable');
  releaseLocksOf(actor.userId!);
  const lockedUntil = addMinutes(clock.now(), getSetting('slot_soft_lock_minutes')).toISOString();
  for (const s of chain) Object.assign(s, { status: 'SOFT_LOCKED', lockedBy: actor.userId, lockedUntil, updatedAt: clock.nowIso() });
  return { slotId, slotIds: chain.map((s) => s.slotId), lockedUntil };
}

export function unlockSlot(actor: Actor) {
  releaseLocksOf(actor.userId!); // FR-401-18
}

// ── UC-401 randevu yaratma ──

/** Seçilmiş zəncir: hamısı bu istifadəçinin aktiv lock-unda olmalıdır. */
function lockedChain(actor: Actor, slot: AppointmentSlot, duration: number): AppointmentSlot[] {
  if (slot.status === 'BOOKED' || slot.status === 'BLOCKED') throw new ApiError('SlotUnavailable');
  if (slot.status === 'SOFT_LOCKED' && slot.lockedBy !== actor.userId && slot.lockedUntil && new Date(slot.lockedUntil).getTime() > clock.nowMs()) throw new ApiError('SlotUnavailable');
  const mine = (s: AppointmentSlot) => s.status === 'SOFT_LOCKED' && s.lockedBy === actor.userId && !!s.lockedUntil && new Date(s.lockedUntil).getTime() > clock.nowMs();
  if (!mine(slot)) throw new ApiError('SlotLockExpired'); // EF-401-2
  const chain = slotChain(slot, duration, actor.userId);
  if (!chain || !chain.every(mine)) throw new ApiError('SlotLockExpired');
  return chain;
}

export function createAppointment(actor: Actor, input: AppointmentCreateInput): AppointmentCreatedDto {
  const patient = patientOf(actor);
  const user = db.users.find((u) => u.userId === actor.userId)!;
  if (user.status !== 'VERIFIED') throw new ApiError('Forbidden'); // BR-401-01
  const dc = visibleDoctorClinic(input.doctorId, input.clinicId);
  if (!clinicAccepting(dc.clinicId)) throw new ApiError('ClinicNotAccepting'); // EF-401-6
  const duration = serviceDuration(dc.doctorClinicId, input.serviceId)!;
  const slot = db.appointment_slots.find((s) => s.slotId === input.slotId);
  if (!slot || slot.doctorClinicId !== dc.doctorClinicId) throw new ApiError('NotFound');
  // FR-401-25: slot statusu yenidən yoxlanılır.
  const chain = lockedChain(actor, slot, duration);
  if (tooSoon(slot)) throw new ApiError('BookingTooSoon');

  // BR-401-06: eyni həkimlə eyni gündə bir aktiv randevu.
  const sameDoctorDcIds = new Set(db.doctor_clinics.filter((x) => x.doctorId === dc.doctorId).map((x) => x.doctorClinicId));
  if (db.appointments.some((a) => a.patientId === patient.patientId && ACTIVE.includes(a.status) && sameDoctorDcIds.has(a.doctorClinicId) && bakuDate(new Date(a.startAt)) === slot.slotDate)) {
    throw new ApiError('DuplicateAppointment');
  }
  // BR-401-10 (F2): no-show sayı limiti aşıbsa.
  if (patient.noShowCount > getSetting('no_show_limit')) throw new ApiError('NoShowLimitExceeded');

  // Əlavə sənədlər pasientə məxsus olmalıdır; tibbi razılıq tələb olunur.
  const docIds = [...new Set(input.documentIds ?? [])];
  if (docIds.length) {
    requireMedicalConsent(actor.userId!);
    for (const id of docIds) {
      const doc = db.medical_documents.find((d) => d.documentId === id);
      if (!doc || doc.patientId !== patient.patientId || doc.deletedAt) throw new ApiError('ValidationError', { fields: { documentIds: 'Sənəd tapılmadı' } });
    }
  }

  const doc = db.doctors.find((d) => d.doctorId === dc.doctorId)!;
  const status: AppointmentStatus = doc.approvalMode === 'AUTO' ? 'CONFIRMED' : 'PENDING'; // FR-401-29
  const start = slotStart(slot);
  const now = clock.nowIso();
  const appt: Appointment = {
    appointmentId: newId(),
    bookingReference: bookingReference(slot.slotDate),
    patientId: patient.patientId,
    doctorClinicId: dc.doctorClinicId,
    slotId: slot.slotId,
    slotIds: chain.map((s) => s.slotId),
    serviceId: input.serviceId,
    status,
    startAt: start.toISOString(),
    endAt: addMinutes(start, duration).toISOString(),
    patientNote: input.patientNote?.trim() || null,
    doctorNote: null,
    rescheduleCount: 0,
    cancelledBy: null,
    cancellationReason: null,
    cancelledAt: null,
    completedAt: null,
    pendingReschedule: null,
    reviewInvited: false,
    createdAt: now,
    updatedAt: now,
  };
  db.appointments.push(appt);
  setSlots(appt.slotIds, 'BOOKED'); // FR-401-30
  history(appt, null, status, actor);

  // FR-401-24: əlavə sənədlər üçün həkimə avtomatik icazə (randevudan 7 gün sonraya qədər).
  for (const documentId of docIds) {
    const grant = createGrant({ documentId, doctorId: dc.doctorId, patientId: patient.patientId, duration: 'APPOINTMENT_PERIOD', appointment: appt });
    db.appointment_documents.push({ appointmentDocumentId: newId(), appointmentId: appt.appointmentId, documentId, grantId: grant.grantId, createdAt: now });
  }

  audit(actor, { action: 'CREATE_APPOINTMENT', entityType: 'APPOINTMENT', entityId: appt.appointmentId, newValue: { bookingReference: appt.bookingReference, status, slotDate: slot.slotDate, startTime: slot.startTime, documents: docIds.length } });

  // FR-401-33/34: pasientə təsdiq (və ya "sorğu göndərildi"), həkimə yeni randevu / təsdiq sorğusu.
  notifyBoth(appt, status === 'CONFIRMED' ? 'APPOINTMENT_CONFIRMED' : 'APPOINTMENT_REQUESTED', {}, { doctor: false });
  notifyBoth(appt, status === 'CONFIRMED' ? 'NEW_APPOINTMENT' : 'APPOINTMENT_PENDING', {}, { patient: false });
  scheduleReminders(appt);

  const { clinic } = names(appt);
  const sv = db.services.find((s) => s.serviceId === input.serviceId)!;
  return {
    appointmentId: appt.appointmentId,
    bookingReference: appt.bookingReference,
    appointmentStatus: status,
    slotDate: slot.slotDate,
    startTime: slot.startTime,
    endTime: chain[chain.length - 1].endTime,
    doctorName: doctorFullName(doc),
    clinicName: clinic.name,
    clinicAddress: clinic.address,
    serviceName: sv.nameAz,
    createdAt: now,
  };
}

// ── UC-402 ləğv ──

function assertActive(appt: Appointment) {
  if (!ACTIVE.includes(appt.status) || startMs(appt) <= clock.nowMs()) throw new ApiError('InvalidStatusTransition'); // EF-402-1..3
}

export function cancelAppointment(actor: Actor, appointmentId: string, reason: string, opts: { silentPatientNotify?: boolean } = {}) {
  const appt = loadAppointment(actor, appointmentId);
  assertActive(appt);
  // BR-402-02: pasient üçün 1 saat qaydası (həkim/admin üçün tətbiq olunmur — F6).
  if (actor.role === 'PATIENT' && hoursUntil(appt) < getSetting('min_cancel_lead_hours')) throw new ApiError('CancellationTooLate');
  const old = appt.status;
  const proposed = appt.pendingReschedule?.newSlotIds ?? [];
  Object.assign(appt, { status: 'CANCELLED', cancelledBy: actor.userId, cancellationReason: reason, cancelledAt: clock.nowIso(), pendingReschedule: null, updatedAt: clock.nowIso() });
  releaseSlots(appt.slotIds); // BR-402-04
  setSlots(proposed, 'AVAILABLE'); // cavabsız köçürmə təklifinin bloklanmış slotları
  cancelScheduledForAppointment(appt.appointmentId, 'Randevu ləğv edildi'); // BR-402-06
  revokeGrantsForAppointment(appt.appointmentId); // BR-402-07
  history(appt, old, 'CANCELLED', actor, reason);
  audit(actor, { action: 'CANCEL_APPOINTMENT', entityType: 'APPOINTMENT', entityId: appt.appointmentId, oldValue: { status: old }, newValue: { status: 'CANCELLED' }, reason });
  // FR-402-11: hər iki tərəfə; ləğv edən özü üçün də təsdiq bildirişi alır.
  notifyBoth(appt, 'APPOINTMENT_CANCELLED', { reason }, { patient: !opts.silentPatientNotify });
  return appt;
}

// ── UC-403 köçürmə ──

function rescheduleChecks(appt: Appointment) {
  assertActive(appt);
  if (appt.rescheduleCount >= getSetting('max_reschedule_count')) throw new ApiError('RescheduleLimitExceeded'); // BR-403-01
  if (hoursUntil(appt) < getSetting('min_reschedule_lead_hours')) throw new ApiError('RescheduleTooLate'); // BR-403-02
}

/** Köçürmə: yeni slot həmin həkimin istənilən görünən klinikasında ola bilər (UC-403 alt 2); xidmət orada da göstərilməlidir. */
function targetFor(appt: Appointment, newSlotId: string) {
  const newSlot = db.appointment_slots.find((s) => s.slotId === newSlotId);
  if (!newSlot) throw new ApiError('NotFound');
  const oldDc = dcOf(appt);
  const newDc = db.doctor_clinics.find((x) => x.doctorClinicId === newSlot.doctorClinicId)!;
  if (newDc.doctorId !== oldDc.doctorId) throw new ApiError('ValidationError', { fields: { newSlotId: 'Slot başqa həkimə aiddir' } });
  visibleDoctorClinic(newDc.doctorId, newDc.clinicId);
  if (!clinicAccepting(newDc.clinicId)) throw new ApiError('ClinicNotAccepting');
  const duration = serviceDuration(newDc.doctorClinicId, appt.serviceId)!;
  if (slotStart(newSlot).getTime() <= clock.nowMs() || tooSoon(newSlot)) throw new ApiError('BookingTooSoon');
  return { newSlot, newDc, duration };
}

function applyMove(appt: Appointment, newDc: DoctorClinic, chain: AppointmentSlot[], duration: number, actor: Actor | null) {
  const oldSlotId = appt.slotId;
  // BR-403-03: köhnə slot yalnız yeni slot təsdiqləndikdən sonra buraxılır.
  setSlots(chain.map((s) => s.slotId), 'BOOKED');
  releaseSlots(appt.slotIds);
  const start = slotStart(chain[0]);
  Object.assign(appt, {
    doctorClinicId: newDc.doctorClinicId,
    slotId: chain[0].slotId,
    slotIds: chain.map((s) => s.slotId),
    startAt: start.toISOString(),
    endAt: addMinutes(start, duration).toISOString(),
    rescheduleCount: appt.rescheduleCount + 1,
    pendingReschedule: null,
    updatedAt: clock.nowIso(),
  });
  history(appt, appt.status, appt.status, actor, 'Köçürmə', oldSlotId); // BR-403-04: status dəyişmir
  cancelScheduledForAppointment(appt.appointmentId, 'Randevu köçürüldü', ['REMINDER_24H', 'REMINDER_2H']);
  scheduleReminders(appt);
  refreshAppointmentGrants(appt);
}

export function rescheduleAppointment(actor: Actor, appointmentId: string, newSlotId: string) {
  const appt = loadAppointment(actor, appointmentId);
  rescheduleChecks(appt);
  const { newSlot, newDc, duration } = targetFor(appt, newSlotId);

  if (actor.role === 'PATIENT') {
    const chain = lockedChain(actor, newSlot, duration); // yeni slot pasientin lock-unda olmalıdır (FR-403-05)
    // BR-401-06 köçürmədə də: həmin gün bu həkimlə başqa aktiv randevu olmamalıdır.
    const sameDoctor = new Set(db.doctor_clinics.filter((x) => x.doctorId === newDc.doctorId).map((x) => x.doctorClinicId));
    if (db.appointments.some((a) => a.appointmentId !== appt.appointmentId && a.patientId === appt.patientId && ACTIVE.includes(a.status) && sameDoctor.has(a.doctorClinicId) && bakuDate(new Date(a.startAt)) === newSlot.slotDate)) {
      throw new ApiError('DuplicateAppointment');
    }
    const oldStart = appt.startAt;
    applyMove(appt, newDc, chain, duration, actor);
    audit(actor, { action: 'RESCHEDULE_APPOINTMENT', entityType: 'APPOINTMENT', entityId: appt.appointmentId, oldValue: { startAt: oldStart }, newValue: { startAt: appt.startAt } });
    notifyBoth(appt, 'APPOINTMENT_RESCHEDULED');
    return appt;
  }

  // Həkim / klinika admini: təklif (F4) — yeni slot pasient cavab verənə qədər bloklanır (BR-403-06).
  const chain = slotChain(newSlot, duration, null);
  if (!chain) throw new ApiError('SlotUnavailable');
  if (appt.pendingReschedule) setSlots(appt.pendingReschedule.newSlotIds, 'AVAILABLE');
  setSlots(chain.map((s) => s.slotId), 'BLOCKED', 'Köçürmə təklifi');
  appt.pendingReschedule = { newSlotIds: chain.map((s) => s.slotId), requestedBy: actor.userId!, requestedAt: clock.nowIso() };
  appt.updatedAt = clock.nowIso();
  audit(actor, { action: 'PROPOSE_RESCHEDULE', entityType: 'APPOINTMENT', entityId: appt.appointmentId, newValue: { newStart: slotStart(chain[0]).toISOString() } });
  const st = slotStart(chain[0]);
  notifyBoth(appt, 'RESCHEDULE_PROPOSED', { date: azDate(bakuDate(st)), time: chain[0].startTime }, { doctor: false });
  return appt;
}

/**
 * UC-803 alt 2: klinika admini randevunu eyni klinikada başqa həkimə köçürməyi təklif edir (həkim xəstələnəndə).
 * Mexanizm vaxt dəyişikliyi təklifi ilə eynidir: yeni slot bloklanır, pasient qəbul etsə köçürülür, imtina etsə
 * ləğv olunur (BR-803-06). Köçürmə limiti (BR-403-01) admin təşəbbüsü olduğu üçün tətbiq olunmur.
 */
export function proposeTransfer(actor: Actor, appointmentId: string, newSlotId: string) {
  const appt = loadAppointment(actor, appointmentId);
  assertActive(appt);
  const newSlot = db.appointment_slots.find((s) => s.slotId === newSlotId);
  if (!newSlot) throw new ApiError('NotFound');
  const oldDc = dcOf(appt);
  const newDc = db.doctor_clinics.find((x) => x.doctorClinicId === newSlot.doctorClinicId)!;
  if (newDc.clinicId !== oldDc.clinicId || newDc.doctorId === oldDc.doctorId || newDc.status !== 'ACTIVE')
    throw new ApiError('ValidationError', { fields: { targetSlotId: 'Slot bu klinikadakı başqa aktiv həkimə aid olmalıdır' } });
  let duration: number | null;
  try {
    duration = serviceDuration(newDc.doctorClinicId, appt.serviceId);
  } catch {
    throw new ApiError('ValidationError', { fields: { targetSlotId: 'Seçilmiş həkim bu xidməti göstərmir' } });
  }
  if (slotStart(newSlot).getTime() <= clock.nowMs()) throw new ApiError('BookingTooSoon');
  const chain = slotChain(newSlot, duration, null);
  if (!chain) throw new ApiError('SlotUnavailable');
  if (appt.pendingReschedule) setSlots(appt.pendingReschedule.newSlotIds, 'AVAILABLE');
  setSlots(chain.map((s) => s.slotId), 'BLOCKED', 'Köçürmə təklifi');
  appt.pendingReschedule = { newSlotIds: chain.map((s) => s.slotId), requestedBy: actor.userId!, requestedAt: clock.nowIso() };
  appt.updatedAt = clock.nowIso();
  const newDoctor = db.doctors.find((d) => d.doctorId === newDc.doctorId)!;
  audit(actor, { action: 'PROPOSE_TRANSFER', entityType: 'APPOINTMENT', entityId: appt.appointmentId, newValue: { doctorId: newDoctor.doctorId, newStart: slotStart(chain[0]).toISOString() } });
  notifyBoth(appt, 'RESCHEDULE_PROPOSED', { date: azDate(newSlot.slotDate), time: chain[0].startTime }, { doctor: false });
  return appt;
}

/** Pasient həkim/admin təklifinə cavab verir: qəbul → köçürülür; imtina → randevu ləğv olunur (F4). */
export function respondReschedule(actor: Actor, appointmentId: string, accept: boolean) {
  const appt = loadAppointment(actor, appointmentId);
  if (actor.role !== 'PATIENT' || !appt.pendingReschedule) throw new ApiError('InvalidStatusTransition');
  const slots = appt.pendingReschedule.newSlotIds.map((id) => db.appointment_slots.find((s) => s.slotId === id)!);
  if (!accept) {
    setSlots(slots.map((s) => s.slotId), 'AVAILABLE');
    appt.pendingReschedule = null;
    return cancelAppointment(actor, appointmentId, 'Pasient təklif olunan yeni vaxtdan imtina etdi');
  }
  assertActive(appt);
  const newDc = db.doctor_clinics.find((x) => x.doctorClinicId === slots[0].doctorClinicId)!;
  const duration = serviceDuration(newDc.doctorClinicId, appt.serviceId)!;
  const oldStart = appt.startAt;
  applyMove(appt, newDc, slots, duration, actor);
  audit(actor, { action: 'ACCEPT_RESCHEDULE', entityType: 'APPOINTMENT', entityId: appt.appointmentId, oldValue: { startAt: oldStart }, newValue: { startAt: appt.startAt } });
  notifyBoth(appt, 'APPOINTMENT_RESCHEDULED');
  return appt;
}

// ── UC-703 / UC-405 həkim əməliyyatları ──

function assertDoctorOrAdmin(actor: Actor, roles: UserRole[]) {
  if (!actor.role || !roles.includes(actor.role)) throw new ApiError('Forbidden');
}

export function confirmAppointment(actor: Actor, appointmentId: string) {
  assertDoctorOrAdmin(actor, ['DOCTOR']);
  const appt = loadAppointment(actor, appointmentId);
  if (appt.status !== 'PENDING' || startMs(appt) <= clock.nowMs()) throw new ApiError('InvalidStatusTransition'); // EF-703-2
  appt.status = 'CONFIRMED';
  appt.updatedAt = clock.nowIso();
  history(appt, 'PENDING', 'CONFIRMED', actor);
  audit(actor, { action: 'CONFIRM_APPOINTMENT', entityType: 'APPOINTMENT', entityId: appt.appointmentId });
  notifyBoth(appt, 'APPOINTMENT_CONFIRMED', {}, { doctor: false });
  return appt;
}

/** Rədd: səbəb məcburi (BR-703-05), slot dərhal boşalır, no-show statistikasına təsir etmir (BR-703-07). */
export function rejectAppointment(actor: Actor, appointmentId: string, reason: string) {
  assertDoctorOrAdmin(actor, ['DOCTOR']);
  const appt = loadAppointment(actor, appointmentId);
  if (appt.status !== 'PENDING') throw new ApiError('InvalidStatusTransition');
  Object.assign(appt, { status: 'CANCELLED', cancelledBy: actor.userId, cancellationReason: reason, cancelledAt: clock.nowIso(), updatedAt: clock.nowIso() });
  releaseSlots(appt.slotIds);
  cancelScheduledForAppointment(appt.appointmentId, 'Həkim rədd etdi');
  revokeGrantsForAppointment(appt.appointmentId);
  history(appt, 'PENDING', 'CANCELLED', actor, reason);
  audit(actor, { action: 'REJECT_APPOINTMENT', entityType: 'APPOINTMENT', entityId: appt.appointmentId, reason });
  notifyBoth(appt, 'APPOINTMENT_REJECTED', { reason }, { doctor: false });
  return appt;
}

function scheduleReviewInvite(appt: Appointment) {
  const { pUser, vars } = names(appt);
  const at = addHours(clock.now(), getSetting('review_invite_delay_hours'));
  const deepLink = `/account/appointments/${appt.appointmentId}/review`;
  scheduleNotification({ userId: pUser.userId, type: 'REVIEW_INVITE', at, appointmentId: appt.appointmentId, vars, deepLink });
  // UC-1101 alt 5: rəy yazılmayıbsa 3 gün sonra bir dəfə xatırlatma (BR-1101-12). Göndərmə anında rəy varsa ötürülür.
  scheduleNotification({ userId: pUser.userId, type: 'REVIEW_INVITE', at: addHours(at, 72), appointmentId: appt.appointmentId, vars, deepLink });
  appt.reviewInvited = true;
}

/** UC-405: yalnız vaxtı gəldikdən sonra (BR-405-01). */
export function completeAppointment(actor: Actor, appointmentId: string, doctorNote?: string | null) {
  assertDoctorOrAdmin(actor, ['DOCTOR']);
  const appt = loadAppointment(actor, appointmentId);
  if (appt.status !== 'CONFIRMED') throw new ApiError('InvalidStatusTransition'); // EF-405-2
  if (startMs(appt) > clock.nowMs()) throw new ApiError('AppointmentNotStarted'); // EF-405-1
  Object.assign(appt, { status: 'COMPLETED', completedAt: clock.nowIso(), doctorNote: doctorNote?.trim() || appt.doctorNote, updatedAt: clock.nowIso() });
  history(appt, 'CONFIRMED', 'COMPLETED', actor);
  scheduleReviewInvite(appt); // FR-405-07: 2 saat sonra
  audit(actor, { action: 'COMPLETE_APPOINTMENT', entityType: 'APPOINTMENT', entityId: appt.appointmentId });
  return appt;
}

export function markNoShow(actor: Actor, appointmentId: string) {
  assertDoctorOrAdmin(actor, ['DOCTOR', 'CLINIC_ADMIN']);
  const appt = loadAppointment(actor, appointmentId);
  if (appt.status !== 'CONFIRMED') throw new ApiError('InvalidStatusTransition');
  if (startMs(appt) > clock.nowMs()) throw new ApiError('AppointmentNotStarted');
  appt.status = 'NO_SHOW';
  appt.updatedAt = clock.nowIso();
  const patient = db.patients.find((p) => p.patientId === appt.patientId)!;
  patient.noShowCount++; // BR-405-03
  cancelScheduledForAppointment(appt.appointmentId, 'No-show');
  history(appt, 'CONFIRMED', 'NO_SHOW', actor);
  audit(actor, { action: 'MARK_NO_SHOW', entityType: 'APPOINTMENT', entityId: appt.appointmentId });
  const { pUser, vars } = names(appt);
  notify({ type: 'NO_SHOW_RECORDED', userId: pUser.userId, vars, deepLink: `/account/appointments/${appt.appointmentId}`, entity: { type: 'APPOINTMENT', id: appt.appointmentId } });
  return appt;
}

/** No-show düzəlişi: klinika admini, 24 saat ərzində (BR-405-04) → COMPLETED, sayğac azalır. */
export function revertNoShow(actor: Actor, appointmentId: string) {
  assertDoctorOrAdmin(actor, ['CLINIC_ADMIN']);
  const appt = loadAppointment(actor, appointmentId);
  if (appt.status !== 'NO_SHOW') throw new ApiError('InvalidStatusTransition');
  const marked = [...db.appointment_status_history].reverse().find((h) => h.appointmentId === appt.appointmentId && h.newStatus === 'NO_SHOW');
  if (!marked || clock.nowMs() - new Date(marked.changedAt).getTime() > 24 * 3_600_000) throw new ApiError('BusinessRuleViolation');
  appt.status = 'COMPLETED';
  appt.completedAt = clock.nowIso();
  appt.updatedAt = clock.nowIso();
  const patient = db.patients.find((p) => p.patientId === appt.patientId)!;
  patient.noShowCount = Math.max(0, patient.noShowCount - 1);
  history(appt, 'NO_SHOW', 'COMPLETED', actor, 'No-show düzəlişi');
  audit(actor, { action: 'REVERT_NO_SHOW', entityType: 'APPOINTMENT', entityId: appt.appointmentId });
  return appt;
}

// ── FR-404-15: yaxınlaşan randevuya sonradan sənəd əlavə etmək (avtomatik icazə — FR-502-06) ──

export function addDocumentsToAppointment(actor: Actor, appointmentId: string, documentIds: string[]) {
  const appt = loadAppointment(actor, appointmentId);
  if (actor.role !== 'PATIENT') throw new ApiError('Forbidden');
  assertActive(appt);
  requireMedicalConsent(actor.userId!);
  const dc = dcOf(appt);
  const attached = new Set(db.appointment_documents.filter((x) => x.appointmentId === appointmentId).map((x) => x.documentId));
  let added = 0;
  for (const documentId of [...new Set(documentIds)]) {
    const doc = db.medical_documents.find((d) => d.documentId === documentId);
    if (!doc || doc.patientId !== appt.patientId || doc.deletedAt) throw new ApiError('ValidationError', { fields: { documentIds: 'Sənəd tapılmadı' } });
    if (attached.has(documentId)) continue;
    const grant = createGrant({ documentId, doctorId: dc.doctorId, patientId: appt.patientId, duration: 'APPOINTMENT_PERIOD', appointment: appt });
    db.appointment_documents.push({ appointmentDocumentId: newId(), appointmentId, documentId, grantId: grant.grantId, createdAt: clock.nowIso() });
    added++;
  }
  if (added) {
    audit(actor, { action: 'ATTACH_DOCUMENTS', entityType: 'APPOINTMENT', entityId: appointmentId, newValue: { count: added } });
    const { doc, vars } = names(appt);
    notify({ type: 'DOCUMENT_SHARED', userId: doc.userId, vars: { patientName: vars.patientName, expiresAt: 'randevudan 7 gün sonra' }, deepLink: `/doctor/appointments/${appointmentId}` });
  }
  return appt;
}

// ── Scheduled job-lar ──

/** BR-405-07: 24 saat ərzində status təyin olunmayıbsa avtomatik tamamlanır. */
export function autoCompleteAppointments(): number {
  const limit = getSetting('auto_complete_after_hours') * 3_600_000;
  let n = 0;
  for (const a of db.appointments) {
    if (a.status === 'CONFIRMED' && clock.nowMs() - startMs(a) >= limit) {
      Object.assign(a, { status: 'COMPLETED', completedAt: clock.nowIso(), updatedAt: clock.nowIso() });
      history(a, 'CONFIRMED', 'COMPLETED', null, 'Avtomatik tamamlanma');
      scheduleReviewInvite(a);
      n++;
    }
  }
  return n;
}

/** F3: başlanğıc vaxtına qədər təsdiqlənməmiş PENDING randevu ləğv olunur. */
export function cancelUnconfirmedPending(): number {
  let n = 0;
  for (const a of db.appointments) {
    if (a.status === 'PENDING' && startMs(a) <= clock.nowMs()) {
      Object.assign(a, { status: 'CANCELLED', cancelledBy: null, cancellationReason: 'Həkim təsdiqləmədi', cancelledAt: clock.nowIso(), updatedAt: clock.nowIso() });
      cancelScheduledForAppointment(a.appointmentId, 'Təsdiqlənmədi');
      revokeGrantsForAppointment(a.appointmentId);
      history(a, 'PENDING', 'CANCELLED', null, 'Həkim təsdiqləmədi');
      notifyBoth(a, 'APPOINTMENT_CANCELLED', { reason: 'Həkim vaxtında təsdiqləmədi' }, { doctor: false });
      n++;
    }
  }
  return n;
}

// ── UC-404 siyahı və detal (serializer) ──

function age(birthDate: string) {
  const b = new Date(`${birthDate}T00:00:00Z`);
  const n = clock.now();
  let a = n.getUTCFullYear() - b.getUTCFullYear();
  if (n.getUTCMonth() < b.getUTCMonth() || (n.getUTCMonth() === b.getUTCMonth() && n.getUTCDate() < b.getUTCDate())) a--;
  return a;
}

function actionsFor(actor: Actor, appt: Appointment) {
  const allowed: AppointmentAction[] = [];
  const blocked: Partial<Record<AppointmentAction, string>> = {};
  const future = startMs(appt) > clock.nowMs();
  const active = ACTIVE.includes(appt.status) && future;
  const role = actor.role;

  if (role === 'PATIENT') {
    if (active) {
      if (hoursUntil(appt) >= getSetting('min_cancel_lead_hours')) allowed.push('CANCEL');
      else blocked.CANCEL = 'CancellationTooLate';
      if (appt.rescheduleCount >= getSetting('max_reschedule_count')) blocked.RESCHEDULE = 'RescheduleLimitExceeded';
      else if (hoursUntil(appt) < getSetting('min_reschedule_lead_hours')) blocked.RESCHEDULE = 'RescheduleTooLate';
      else if (!appt.pendingReschedule) allowed.push('RESCHEDULE');
      if (appt.pendingReschedule) allowed.push('RESPOND_RESCHEDULE');
      allowed.push('ADD_TO_CALENDAR', 'DIRECTIONS', 'ADD_DOCUMENTS');
    }
    if (db.prescriptions.some((p) => p.appointmentId === appt.appointmentId && p.signedAt)) allowed.push('VIEW_PRESCRIPTION'); // FR-602-15
    if (appt.status === 'COMPLETED') {
      const reviewed = db.reviews.some((r) => r.appointmentId === appt.appointmentId);
      const within = clock.nowMs() - new Date(appt.completedAt ?? appt.startAt).getTime() <= getSetting('review_window_days') * 86_400_000;
      if (!reviewed && within) allowed.push('REVIEW');
    }
  } else if (role === 'DOCTOR') {
    if (appt.status === 'PENDING' && future) allowed.push('CONFIRM', 'REJECT');
    if (appt.status === 'CONFIRMED' && future) allowed.push('CANCEL', 'RESCHEDULE');
    if (appt.status === 'CONFIRMED' && !future) allowed.push('COMPLETE', 'NO_SHOW');
    if (appt.status === 'CONFIRMED' && future) blocked.COMPLETE = 'AppointmentNotStarted';
    if (appt.status === 'CONFIRMED' || appt.status === 'COMPLETED') allowed.push('WRITE_PRESCRIPTION'); // BR-601-02
  } else if (role === 'CLINIC_ADMIN') {
    if (active) allowed.push('CANCEL', 'RESCHEDULE');
    if (appt.status === 'CONFIRMED' && !future) allowed.push('NO_SHOW');
    if (appt.status === 'NO_SHOW') allowed.push('REVERT_NO_SHOW');
  }
  return { allowed, blocked };
}

/** Rola görə serializer: klinika admini tibbi məzmun almır (BR-805-02), pasient müayinə qeydini görür (BR-405-05). */
export function toAppointmentDto(actor: Actor, appt: Appointment): AppointmentDto {
  const { doc, clinic, pUser, patient } = names(appt);
  const dc = dcOf(appt);
  const docUser = db.users.find((u) => u.userId === doc.userId)!;
  const sv = db.services.find((s) => s.serviceId === appt.serviceId)!;
  const cds = db.clinic_doctor_services.find((x) => x.doctorClinicId === dc.doctorClinicId && x.serviceId === appt.serviceId);
  const slot = db.appointment_slots.find((s) => s.slotId === appt.slotId);
  const lastSlot = db.appointment_slots.find((s) => s.slotId === appt.slotIds[appt.slotIds.length - 1]);
  const medical = actor.role === 'PATIENT' || actor.role === 'DOCTOR';
  const cancelledByUser = appt.cancelledBy ? db.users.find((u) => u.userId === appt.cancelledBy) : null;
  const review = db.reviews.find((r) => r.appointmentId === appt.appointmentId);
  const pr = appt.pendingReschedule ? db.appointment_slots.find((s) => s.slotId === appt.pendingReschedule!.newSlotIds[0]) : null;
  const requestedBy = appt.pendingReschedule ? db.users.find((u) => u.userId === appt.pendingReschedule!.requestedBy) : null;
  const { allowed, blocked } = actionsFor(actor, appt);
  return {
    appointmentId: appt.appointmentId,
    bookingReference: appt.bookingReference,
    status: appt.status,
    slotDate: slot?.slotDate ?? bakuDate(new Date(appt.startAt)),
    startTime: slot?.startTime ?? '',
    endTime: lastSlot?.endTime ?? '',
    startAt: appt.startAt,
    endAt: appt.endAt,
    createdAt: appt.createdAt,
    doctor: {
      doctorId: doc.doctorId,
      fullName: doctorFullName(doc),
      photoUrl: docUser.photoUrl,
      specialties: db.doctor_specialties.filter((x) => x.doctorId === doc.doctorId).map((x) => db.specialties.find((s) => s.specialtyId === x.specialtyId)!.nameAz),
    },
    clinic: { clinicId: clinic.clinicId, name: clinic.name, clinicType: clinic.clinicType, address: clinic.address, phone: clinic.phone, latitude: clinic.latitude, longitude: clinic.longitude, roomNumber: dc.roomNumber },
    service: { serviceId: sv.serviceId, name: sv.nameAz, durationMinutes: cds?.durationMinutes ?? Math.round((new Date(appt.endAt).getTime() - startMs(appt)) / 60_000) },
    patient: actor.role === 'PATIENT' ? null : { patientId: patient.patientId, fullName: `${pUser.firstName} ${pUser.lastName}`, age: actor.role === 'DOCTOR' ? age(pUser.birthDate) : null, gender: actor.role === 'DOCTOR' ? pUser.gender : null },
    patientNote: medical ? appt.patientNote : null,
    doctorNote: medical ? appt.doctorNote : null,
    rescheduleCount: appt.rescheduleCount,
    cancellationReason: appt.cancellationReason,
    cancelledByRole: appt.status === 'CANCELLED' ? (cancelledByUser?.role ?? 'SYSTEM') : null,
    cancelledAt: appt.cancelledAt,
    completedAt: appt.completedAt,
    pendingReschedule:
      pr && requestedBy
        ? {
            newStartAt: slotStart(pr).toISOString(), newDate: pr.slotDate, newTime: pr.startTime, requestedByRole: requestedBy.role,
            // UC-803 alt 2: başqa həkimə köçürmə təklifi — pasient yeni həkimin adını görür.
            newDoctorName: pr.doctorClinicId !== appt.doctorClinicId && db.doctor_clinics.find((x) => x.doctorClinicId === pr.doctorClinicId)!.doctorId !== dc.doctorId
              ? doctorFullName(db.doctors.find((d) => d.doctorId === db.doctor_clinics.find((x) => x.doctorClinicId === pr.doctorClinicId)!.doctorId)!)
              : null,
          }
        : null,
    review: review ? { reviewId: review.reviewId, status: review.status } : null,
    documents: medical
      ? db.appointment_documents
          .filter((d) => d.appointmentId === appt.appointmentId)
          .map((d) => ({ documentId: d.documentId, fileName: db.medical_documents.find((m) => m.documentId === d.documentId)?.fileName ?? 'Sənəd' }))
      : [],
    prescriptions: medical
      ? db.prescriptions
          .filter((p) => p.appointmentId === appt.appointmentId && (actor.role === 'DOCTOR' || p.signedAt))
          .map((p) => ({ prescriptionId: p.prescriptionId, prescriptionNumber: p.prescriptionNumber, status: p.status }))
      : [],
    ...(actor.role === 'DOCTOR' ? { patientContext: patientContext(doc.doctorId, appt) } : {}),
    allowedActions: allowed,
    blockedReasons: blocked,
  };
}

function tabOf(a: Appointment): 'UPCOMING' | 'PAST' | 'CANCELLED' {
  if (a.status === 'CANCELLED') return 'CANCELLED';
  if (ACTIVE.includes(a.status) && new Date(a.endAt).getTime() > clock.nowMs()) return 'UPCOMING';
  return 'PAST';
}

export function listPatientAppointments(actor: Actor, tab: 'UPCOMING' | 'PAST' | 'CANCELLED'): AppointmentListDto {
  const patient = patientOf(actor);
  const mine = db.appointments.filter((a) => a.patientId === patient.patientId);
  const counts = { UPCOMING: 0, PAST: 0, CANCELLED: 0 };
  for (const a of mine) counts[tabOf(a)]++;
  const list = mine.filter((a) => tabOf(a) === tab).sort((a, b) => (tab === 'UPCOMING' ? a.startAt.localeCompare(b.startAt) : b.startAt.localeCompare(a.startAt)));
  return { tab, counts, appointments: list.map((a) => toAppointmentDto(actor, a)) };
}

/** "Təqvimə əlavə et" (FR-401-39) — iCalendar faylı. */
export function calendarIcs(actor: Actor, appointmentId: string): string {
  const appt = loadAppointment(actor, appointmentId);
  const { doc, clinic } = names(appt);
  const fmt = (iso: string) => iso.replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const esc = (s: string) => s.replace(/[,;\\]/g, (m) => `\\${m}`);
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MediConnect//AZ',
    'BEGIN:VEVENT',
    `UID:${appt.appointmentId}@mediconnect.az`,
    `DTSTAMP:${fmt(clock.nowIso())}`,
    `DTSTART:${fmt(appt.startAt)}`,
    `DTEND:${fmt(appt.endAt)}`,
    `SUMMARY:${esc(`Qəbul: ${doctorFullName(doc)}`)}`,
    `LOCATION:${esc(`${clinic.name}, ${clinic.address}`)}`,
    `DESCRIPTION:${esc(`Randevu nömrəsi: ${appt.bookingReference}`)}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT2H',
    'ACTION:DISPLAY',
    'DESCRIPTION:MediConnect xatırlatma',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

