import type { ClinicDashboardDto, ClinicProfileDto, ClinicProfileSaveDto, WorkingHoursResultDto } from '@mediconnect/shared';
import type { Actor } from '../core/actor';
import { denyAccess } from '../core/access';
import { audit } from '../core/audit';
import { addDaysToDate, bakuDate, bakuTime, clock, timeToMinutes } from '../core/clock';
import { ApiError } from '../core/errors';
import { getSetting } from '../core/settings';
import { sniffMime } from '../integrations/antivirus';
import { db } from '../store/db';
import { newId } from '../store/repo';
import type { Appointment, Clinic, DoctorClinic } from '../store/types';
import { cancelAppointment, toAppointmentDto } from './appointments.service';
import { overview } from './doctor-appointments.service';
import { regenerateSlots } from './schedule.service';
import { doctorFullName } from './visibility';

// UC-801 — klinika profili, iş saatları, bayramlar, müvəqqəti bağlama, fotolar; panel icmalı.
// Admin yalnız öz klinikası ilə işləyir (BR-801-01, BR-800-02) — klinika actor-dan müəyyən olunur, URL-dən yox.

export function adminClinic(actor: Actor): Clinic {
  const link = db.clinic_admins.find((a) => a.userId === actor.userId && a.status === 'ACTIVE');
  const clinic = link && db.clinics.find((c) => c.clinicId === link.clinicId);
  if (!clinic) throw new ApiError('Forbidden');
  return clinic;
}

/** Klinikanın bu admin-ə aid olduğunu yoxlayır; başqa klinika → 404 + security event (EF-801-5, EF-805-2). */
export function assertOwnClinic(actor: Actor, clinicId: string) {
  if (adminClinic(actor).clinicId !== clinicId) denyAccess(actor, `klinika ${clinicId}`);
}

export const clinicDcs = (clinicId: string) => db.doctor_clinics.filter((x) => x.clinicId === clinicId);
const ACTIVE_STATUSES = ['PENDING', 'CONFIRMED'];
const dayOf = (a: Appointment) => bakuDate(new Date(a.startAt));
const timeOf = (a: Appointment) => bakuTime(new Date(a.startAt));
const horizon = () => addDaysToDate(bakuDate(), getSetting('slot_generation_days'));

function patientName(a: Appointment) {
  const p = db.patients.find((x) => x.patientId === a.patientId)!;
  const u = db.users.find((x) => x.userId === p.userId)!;
  return `${u.firstName} ${u.lastName}`;
}

const doctorNameOfDc = (dcId: string) => doctorFullName(db.doctors.find((d) => d.doctorId === db.doctor_clinics.find((x) => x.doctorClinicId === dcId)!.doctorId)!);

function futureActive(clinicId: string) {
  const ids = new Set(clinicDcs(clinicId).map((x) => x.doctorClinicId));
  return db.appointments.filter((a) => ids.has(a.doctorClinicId) && ACTIVE_STATUSES.includes(a.status) && new Date(a.startAt).getTime() > clock.nowMs());
}

function regenerateClinic(clinicId: string, from = bakuDate(), to = horizon()) {
  for (const dc of clinicDcs(clinicId).filter((x) => x.status === 'ACTIVE')) regenerateSlots(dc.doctorClinicId, from, to);
}

// ── Profil ──

export function getClinicProfile(actor: Actor): ClinicProfileDto {
  const c = adminClinic(actor);
  return {
    clinicId: c.clinicId, name: c.name, clinicType: c.clinicType, registrationNumber: c.registrationNumber, licenseNumber: c.licenseNumber,
    licenseExpiryDate: c.licenseExpiryDate, status: c.status, description: c.description,
    cityName: db.cities.find((x) => x.cityId === c.cityId)?.nameAz ?? '', district: c.district, address: c.address,
    latitude: c.latitude, longitude: c.longitude, phone: c.phone, email: c.email, website: c.website, logoUrl: c.logoUrl,
    acceptingAppointments: c.acceptingAppointments, is24x7: c.is24x7, insurances: c.insurances,
    workingHours: [1, 2, 3, 4, 5, 6, 7].map((d) => {
      const h = db.clinic_working_hours.find((x) => x.clinicId === c.clinicId && x.dayOfWeek === d);
      return { dayOfWeek: d, isClosed: h ? h.isClosed : true, opensAt: h?.opensAt ?? null, closesAt: h?.closesAt ?? null };
    }),
    holidays: db.clinic_holidays.filter((h) => h.clinicId === c.clinicId && h.date >= bakuDate()).sort((a, b) => a.date.localeCompare(b.date)).map((h) => ({ holidayId: h.holidayId, date: h.date, name: h.name })),
    photos: db.clinic_photos.filter((p) => p.clinicId === c.clinicId).sort((a, b) => a.displayOrder - b.displayOrder).map((p) => ({ photoId: p.photoId, photoUrl: p.photoUrl, displayOrder: p.displayOrder })),
  };
}

const LOCKED = ['name', 'clinicType', 'registrationNumber', 'licenseNumber', 'licenseExpiryDate', 'status', 'cityId'];

/** EF-801-1: SA sahələrinin dəyişdirilməsi cəhdi — sahə adı ilə 400. */
export function rejectLockedClinicFields(body: unknown) {
  if (!body || typeof body !== 'object') return;
  const hit = LOCKED.filter((k) => k in body);
  if (hit.length) throw new ApiError('ValidationError', { fields: Object.fromEntries(hit.map((k) => [k, 'validation.adminLocked'])) });
}

/** Şəkil data URL-i: yalnız PNG/JPEG, məzmuna görə yoxlanılır, ≤ 2 MB. */
export function imageFromDataUrl(dataUrl: string, maxBytes = 2 * 1024 * 1024): string {
  const buf = Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64');
  if (buf.length > maxBytes) throw new ApiError('FileTooLarge', undefined, `Şəkil ${Math.round(maxBytes / 1024 / 1024)} MB-dan böyük ola bilməz`);
  const mime = sniffMime(buf);
  if (mime !== 'image/png' && mime !== 'image/jpeg') throw new ApiError('UnsupportedFileType', undefined, 'Yalnız JPG və ya PNG şəkil yükləyin');
  return `data:${mime};base64,${buf.toString('base64')}`;
}

// Azərbaycanın təxmini sərhədləri — koordinat ünvanla uyğun gəlməyəndə xəbərdarlıq (EF-801-4).
const AZ_BOUNDS = { minLat: 38.3, maxLat: 41.95, minLng: 44.7, maxLng: 50.9 };

export function updateClinicProfile(
  actor: Actor,
  input: Partial<{ description: string | null; phone: string; email: string | null; website: string | null; address: string; district: string | null; latitude: number | null; longitude: number | null; insurances: string[]; logo: { fileName: string; dataUrl: string } | null }>,
): ClinicProfileSaveDto {
  const c = adminClinic(actor);
  const warnings: string[] = [];
  const { logo, ...fields } = input;
  const old = Object.fromEntries(Object.keys(fields).map((k) => [k, (c as unknown as Record<string, unknown>)[k]]));
  Object.assign(c, fields);
  if (logo !== undefined) c.logoUrl = logo ? imageFromDataUrl(logo.dataUrl, 1024 * 1024) : null;
  if (input.insurances) c.insurances = [...new Set(input.insurances)];
  const lat = c.latitude;
  const lng = c.longitude;
  if (lat != null && lng != null && (lat < AZ_BOUNDS.minLat || lat > AZ_BOUNDS.maxLat || lng < AZ_BOUNDS.minLng || lng > AZ_BOUNDS.maxLng))
    warnings.push('Xəritə koordinatları Azərbaycan ərazisindən kənardadır — ünvanla uyğunluğunu yoxlayın.');
  if ((lat == null) !== (lng == null)) warnings.push('Xəritədə göstərmək üçün həm enlik, həm uzunluq daxil edilməlidir.');
  c.updatedAt = clock.nowIso();
  audit(actor, { action: 'UPDATE_CLINIC_PROFILE', entityType: 'CLINIC', entityId: c.clinicId, oldValue: old, newValue: { ...fields, ...(logo !== undefined ? { logo: logo ? '[şəkil]' : null } : {}) } }); // BR-801-08
  return { profile: getClinicProfile(actor), warnings };
}

// ── İş saatları (FR-801-10..15) ──

type DayInput = { dayOfWeek: number; isClosed: boolean; opensAt: string | null; closesAt: string | null };

export function saveWorkingHours(
  actor: Actor,
  input: { days: DayInput[]; dryRun: boolean; confirmDoctorConflicts?: boolean; conflictResolution?: 'CANCEL_AND_NOTIFY' },
): WorkingHoursResultDto {
  const c = adminClinic(actor);
  const days = [...input.days].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  if (new Set(days.map((d) => d.dayOfWeek)).size !== 7) throw new ApiError('ValidationError', { fields: { days: 'Hər gün bir dəfə göstərilməlidir' } });
  const fields: Record<string, string> = {};
  for (const d of days) {
    if (d.isClosed) continue;
    if (!d.opensAt || !d.closesAt) fields[`days.${d.dayOfWeek}`] = 'validation.time';
    else if (timeToMinutes(d.closesAt) <= timeToMinutes(d.opensAt)) fields[`days.${d.dayOfWeek}`] = 'Bağlanma saatı açılışdan sonra olmalıdır';
  }
  if (Object.keys(fields).length) throw new ApiError('ValidationError', { fields });
  const open = (dow: number) => {
    const d = days.find((x) => x.dayOfWeek === dow)!;
    return d.isClosed ? null : { s: timeToMinutes(d.opensAt!), e: timeToMinutes(d.closesAt!) };
  };

  // EF-801-2: həkim cədvəlləri yeni saatlardan kənara çıxırmı (BR-801-05: klinika saatları yuxarı sərhəddir).
  const doctorConflicts: WorkingHoursResultDto['doctorConflicts'] = [];
  for (const dc of clinicDcs(c.clinicId).filter((x) => x.status === 'ACTIVE' || x.status === 'INACTIVE')) {
    const bad = db.doctor_schedules
      .filter((s) => s.doctorClinicId === dc.doctorClinicId && s.isActive)
      .filter((s) => {
        const o = open(s.dayOfWeek);
        return !o || timeToMinutes(s.startTime) < o.s || timeToMinutes(s.endTime) > o.e;
      })
      .map((s) => s.dayOfWeek);
    if (bad.length) doctorConflicts.push({ doctorId: dc.doctorId, fullName: doctorFullName(db.doctors.find((d) => d.doctorId === dc.doctorId)!), days: [...new Set(bad)].sort() });
  }
  // EF-801-3: bağlanan saatlara düşən aktiv randevular.
  const isoDow = (dateStr: string) => ((new Date(`${dateStr}T00:00:00Z`).getUTCDay() + 6) % 7) + 1;
  const hit = futureActive(c.clinicId).filter((a) => {
    const o = open(isoDow(dayOf(a)));
    const s = timeToMinutes(timeOf(a));
    const e = s + Math.round((new Date(a.endAt).getTime() - new Date(a.startAt).getTime()) / 60_000);
    return !o || s < o.s || e > o.e;
  });
  const appointmentConflicts = hit.map((a) => ({ appointmentId: a.appointmentId, date: dayOf(a), startTime: timeOf(a), patientName: patientName(a), doctorName: doctorNameOfDc(a.doctorClinicId) }));
  const result = { doctorConflicts, appointmentConflicts, cancelledCount: 0 };
  if (input.dryRun) return { saved: false, ...result };
  if (doctorConflicts.length && !input.confirmDoctorConflicts)
    throw new ApiError('ScheduleOutsideClinicHours', { doctorConflicts }, `${doctorConflicts.length} həkimin cədvəli bu saatlardan kənardır — təsdiq tələb olunur`);
  if (hit.length && !input.conflictResolution) throw new ApiError('ScheduleConflict', { count: hit.length, appointments: appointmentConflicts });

  for (const a of hit) cancelAppointment(actor, a.appointmentId, 'Klinikanın iş saatları dəyişdirildi');
  const old = getClinicProfile(actor).workingHours;
  db.clinic_working_hours = db.clinic_working_hours.filter((h) => h.clinicId !== c.clinicId);
  for (const d of days)
    db.clinic_working_hours.push({ workingHourId: newId(), clinicId: c.clinicId, dayOfWeek: d.dayOfWeek, isClosed: d.isClosed, opensAt: d.isClosed ? null : d.opensAt, closesAt: d.isClosed ? null : d.closesAt });
  c.is24x7 = days.every((d) => !d.isClosed && d.opensAt === '00:00' && d.closesAt === '23:59');
  regenerateClinic(c.clinicId);
  audit(actor, { action: 'UPDATE_WORKING_HOURS', entityType: 'CLINIC', entityId: c.clinicId, oldValue: old, newValue: days, reason: hit.length ? `${hit.length} randevu ləğv edildi` : null });
  return { saved: true, ...result, cancelledCount: hit.length };
}

// ── Bayram günləri (alt 2, FR-801-13/14) ──

export function addHoliday(actor: Actor, input: { date: string; name: string; conflictResolution?: 'CANCEL_AND_NOTIFY' }) {
  const c = adminClinic(actor);
  if (input.date < bakuDate()) throw new ApiError('ValidationError', { fields: { date: 'Tarix gələcəkdə olmalıdır' } });
  if (db.clinic_holidays.some((h) => h.clinicId === c.clinicId && h.date === input.date)) throw new ApiError('Conflict', undefined, 'Bu tarix artıq qeyri-iş günü kimi qeyd olunub');
  const hit = futureActive(c.clinicId).filter((a) => dayOf(a) === input.date);
  if (hit.length && !input.conflictResolution)
    throw new ApiError('ScheduleConflict', {
      count: hit.length,
      appointments: hit.map((a) => ({ appointmentId: a.appointmentId, date: dayOf(a), startTime: timeOf(a), patientName: patientName(a), doctorName: doctorNameOfDc(a.doctorClinicId) })),
    });
  for (const a of hit) cancelAppointment(actor, a.appointmentId, `Klinika bu gün işləmir (${input.name})`);
  const h = { holidayId: newId(), clinicId: c.clinicId, date: input.date, name: input.name, createdBy: actor.userId, createdAt: clock.nowIso() };
  db.clinic_holidays.push(h);
  regenerateClinic(c.clinicId, input.date, input.date);
  audit(actor, { action: 'ADD_CLINIC_HOLIDAY', entityType: 'CLINIC', entityId: c.clinicId, newValue: h, reason: hit.length ? `${hit.length} randevu ləğv edildi` : null });
  return getClinicProfile(actor);
}

export function removeHoliday(actor: Actor, holidayId: string) {
  const c = adminClinic(actor);
  const h = db.clinic_holidays.find((x) => x.holidayId === holidayId);
  if (!h || h.clinicId !== c.clinicId) denyAccess(actor, `bayram ${holidayId}`);
  db.clinic_holidays = db.clinic_holidays.filter((x) => x !== h);
  if (h.date >= bakuDate()) regenerateClinic(c.clinicId, h.date, h.date);
  audit(actor, { action: 'REMOVE_CLINIC_HOLIDAY', entityType: 'CLINIC', entityId: c.clinicId, oldValue: h });
  return getClinicProfile(actor);
}

// ── Müvəqqəti bağlama (alt 3, BR-801-06): yeni randevu dayanır, mövcudlar qalır ──

export function setAccepting(actor: Actor, accepting: boolean, reason?: string) {
  const c = adminClinic(actor);
  if (c.acceptingAppointments === accepting) return getClinicProfile(actor);
  c.acceptingAppointments = accepting;
  c.updatedAt = clock.nowIso();
  audit(actor, { action: accepting ? 'CLINIC_REOPENED' : 'CLINIC_TEMPORARILY_CLOSED', entityType: 'CLINIC', entityId: c.clinicId, reason: reason ?? null });
  return getClinicProfile(actor);
}

// ── Fotolar (FR-801-07/08) ──

const MAX_PHOTOS = 12;

export function addPhoto(actor: Actor, photo: { fileName: string; dataUrl: string }) {
  const c = adminClinic(actor);
  const mine = db.clinic_photos.filter((p) => p.clinicId === c.clinicId);
  if (mine.length >= MAX_PHOTOS) throw new ApiError('BusinessRuleViolation', undefined, `Ən çox ${MAX_PHOTOS} foto əlavə etmək olar`);
  const row = { photoId: newId(), clinicId: c.clinicId, photoUrl: imageFromDataUrl(photo.dataUrl), displayOrder: mine.length, createdAt: clock.nowIso() };
  db.clinic_photos.push(row);
  audit(actor, { action: 'ADD_CLINIC_PHOTO', entityType: 'CLINIC', entityId: c.clinicId, newValue: { photoId: row.photoId, fileName: photo.fileName } });
  return getClinicProfile(actor);
}

export function removePhoto(actor: Actor, photoId: string) {
  const c = adminClinic(actor);
  const p = db.clinic_photos.find((x) => x.photoId === photoId);
  if (!p || p.clinicId !== c.clinicId) denyAccess(actor, `foto ${photoId}`);
  db.clinic_photos = db.clinic_photos.filter((x) => x !== p);
  db.clinic_photos.filter((x) => x.clinicId === c.clinicId).sort((a, b) => a.displayOrder - b.displayOrder).forEach((x, i) => (x.displayOrder = i));
  audit(actor, { action: 'REMOVE_CLINIC_PHOTO', entityType: 'CLINIC', entityId: c.clinicId, oldValue: { photoId } });
  return getClinicProfile(actor);
}

export function reorderPhotos(actor: Actor, photoIds: string[]) {
  const c = adminClinic(actor);
  const mine = db.clinic_photos.filter((p) => p.clinicId === c.clinicId);
  if (photoIds.length !== mine.length || !mine.every((p) => photoIds.includes(p.photoId))) throw new ApiError('ValidationError', { fields: { photoIds: 'Bütün fotolar sıralamada olmalıdır' } });
  for (const p of mine) p.displayOrder = photoIds.indexOf(p.photoId);
  audit(actor, { action: 'REORDER_CLINIC_PHOTOS', entityType: 'CLINIC', entityId: c.clinicId, newValue: photoIds });
  return getClinicProfile(actor);
}

// ── Panel icmalı ──

export function clinicDashboard(actor: Actor): ClinicDashboardDto {
  const c = adminClinic(actor);
  const dcs = clinicDcs(c.clinicId);
  const ids = new Set(dcs.map((x) => x.doctorClinicId));
  const today = bakuDate();
  const todays = db.appointments.filter((a) => ids.has(a.doctorClinicId) && dayOf(a) === today);
  const next = todays
    .filter((a) => ACTIVE_STATUSES.includes(a.status) && new Date(a.endAt).getTime() > clock.nowMs())
    .sort((a, b) => a.startAt.localeCompare(b.startAt))
    .slice(0, 8);
  const live = dcs.filter((x) => x.status !== 'REMOVED');
  const doctorOf = (dc: DoctorClinic) => db.doctors.find((d) => d.doctorId === dc.doctorId)!;
  const warnDays = getSetting('license_expiry_warning_days');
  const daysLeft = (d: string) => Math.round((new Date(`${d}T00:00:00Z`).getTime() - new Date(`${today}T00:00:00Z`).getTime()) / 86_400_000);
  return {
    clinic: { name: c.name, status: c.status, acceptingAppointments: c.acceptingAppointments },
    today: overview(todays),
    next: next.map((a) => toAppointmentDto(actor, a)),
    doctors: {
      active: live.filter((x) => x.status === 'ACTIVE').length,
      inactive: live.filter((x) => x.status === 'INACTIVE').length,
      invited: live.filter((x) => x.status === 'INVITED').length,
      profileIncomplete: live.filter((x) => x.status === 'ACTIVE' && !doctorOf(x).profileCompleted).length,
    },
    licenseAlerts: live
      .map((x) => doctorOf(x))
      .filter((d) => daysLeft(d.licenseExpiryDate) <= warnDays)
      .map((d) => ({ doctorId: d.doctorId, fullName: doctorFullName(d), licenseExpiryDate: d.licenseExpiryDate, daysLeft: daysLeft(d.licenseExpiryDate) }))
      .sort((a, b) => a.daysLeft - b.daysLeft),
    pendingInvites: live
      .filter((x) => x.status === 'INVITED')
      .map((x) => ({ doctorId: x.doctorId, fullName: doctorFullName(doctorOf(x)), inviteExpiresAt: x.inviteExpiresAt, expired: !!x.inviteExpiresAt && new Date(x.inviteExpiresAt).getTime() < clock.nowMs() })),
    services: new Set(db.clinic_doctor_services.filter((s) => ids.has(s.doctorClinicId) && s.isActive).map((s) => s.serviceId)).size,
  };
}

