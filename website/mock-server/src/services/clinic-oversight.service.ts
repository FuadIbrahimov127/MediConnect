import type { BulkCancelResultDto, ClinicAppointmentsDto, ReportDto, ReportType } from '@mediconnect/shared';
import type { Actor } from '../core/actor';
import { audit } from '../core/audit';
import { addDaysToDate, bakuDate, bakuDayOfWeek, bakuTime } from '../core/clock';
import { ApiError } from '../core/errors';
import { ERROR_MESSAGES } from '../core/messages';
import { db } from '../store/db';
import { paginate } from '../store/repo';
import { makePdf } from '../store/seed-data/files';
import type { Appointment } from '../store/types';
import { cancelAppointment, toAppointmentDto } from './appointments.service';
import { adminClinic, clinicDcs } from './clinic-admin.service';
import { overview } from './doctor-appointments.service';
import { doctorFullName } from './visibility';

// UC-805 — randevulara nəzarət və hesabatlar. Admin yalnız əməliyyat məlumatını görür (BR-805-02/03):
// randevular toAppointmentDto ilə CLINIC_ADMIN rolunda serializasiya olunur (patientNote, doctorNote, sənəd, resept boşdur).

const dayOf = (a: Appointment) => bakuDate(new Date(a.startAt));
const pct = (n: number, d: number) => (d ? Math.round((n / d) * 1000) / 10 : null);

function clinicAppointments(actor: Actor) {
  const c = adminClinic(actor);
  const ids = new Set(clinicDcs(c.clinicId).map((x) => x.doctorClinicId));
  return { clinic: c, list: db.appointments.filter((a) => ids.has(a.doctorClinicId)) };
}

const doctorIdOf = (a: Appointment) => db.doctor_clinics.find((x) => x.doctorClinicId === a.doctorClinicId)!.doctorId;
function patientName(a: Appointment) {
  const p = db.patients.find((x) => x.patientId === a.patientId)!;
  const u = db.users.find((x) => x.userId === p.userId)!;
  return `${u.firstName} ${u.lastName}`;
}

export function listClinicAppointments(
  actor: Actor,
  q: { from?: string; to?: string; doctorId?: string; status?: string; serviceId?: string; q?: string; page: number; size: number },
): ClinicAppointmentsDto {
  const { list } = clinicAppointments(actor);
  const statuses = q.status ? q.status.split(',') : null;
  const needle = q.q?.toLocaleLowerCase('az');
  const filtered = list
    .filter(
      (a) =>
        (!q.from || dayOf(a) >= q.from) &&
        (!q.to || dayOf(a) <= q.to) &&
        (!q.doctorId || doctorIdOf(a) === q.doctorId) &&
        (!statuses || statuses.includes(a.status)) &&
        (!q.serviceId || a.serviceId === q.serviceId) &&
        (!needle || a.bookingReference.toLowerCase().includes(needle) || patientName(a).toLocaleLowerCase('az').includes(needle)),
    )
    .sort((a, b) => a.startAt.localeCompare(b.startAt));
  const page = paginate(filtered, q.page, q.size);
  return { totalCount: page.totalCount, page: page.page, size: page.size, appointments: page.items.map((a) => toAppointmentDto(actor, a)), summary: overview(filtered) };
}

/** Alt 6: fövqəladə hallarda toplu ləğv — hər biri ayrıca (bildiriş, audit, slot), xətalar toplanır. */
export function bulkCancel(actor: Actor, input: { appointmentIds: string[]; reason: string }): BulkCancelResultDto {
  const { list } = clinicAppointments(actor);
  let cancelled = 0;
  const failed: BulkCancelResultDto['failed'] = [];
  for (const id of input.appointmentIds) {
    const a = list.find((x) => x.appointmentId === id);
    try {
      cancelAppointment(actor, id, input.reason); // başqa klinikanın randevusu → loadAppointment 404 + security event
      cancelled++;
    } catch (e) {
      failed.push({ appointmentId: id, bookingReference: a?.bookingReference ?? '—', message: e instanceof ApiError ? (e.messageOverride ?? ERROR_MESSAGES[e.errorType].az) : 'Gözlənilməz xəta' });
    }
  }
  audit(actor, { action: 'BULK_CANCEL_APPOINTMENTS', entityType: 'CLINIC', entityId: adminClinic(actor).clinicId, reason: input.reason, newValue: { requested: input.appointmentIds.length, cancelled } });
  return { cancelled, failed };
}

// ── Hesabatlar (FR-805-13..18) ──

export function clinicReport(actor: Actor, type: ReportType, from: string, to: string): ReportDto {
  if (to < from) throw new ApiError('ValidationError', { fields: { to: 'Son tarix başlanğıcdan əvvəl ola bilməz' } });
  if (addDaysToDate(from, 366) < to) throw new ApiError('ValidationError', { fields: { to: 'Maksimum 1 illik aralıq' } });
  const { list } = clinicAppointments(actor);
  const inRange = list.filter((a) => dayOf(a) >= from && dayOf(a) <= to);
  // Tamamlanma/no-show faizi yalnız vaxtı keçmiş və ləğv edilməmiş qəbullardan hesablanır.
  const finished = (xs: Appointment[]) => xs.filter((a) => a.status === 'COMPLETED' || a.status === 'NO_SHOW');
  const count = (xs: Appointment[], s: string) => xs.filter((a) => a.status === s).length;
  const totals = {
    total: inRange.length,
    completed: count(inRange, 'COMPLETED'),
    cancelled: count(inRange, 'CANCELLED'),
    noShow: count(inRange, 'NO_SHOW'),
    completionRate: pct(count(inRange, 'COMPLETED'), finished(inRange).length),
    noShowRate: pct(count(inRange, 'NO_SHOW'), finished(inRange).length),
  };
  const out: ReportDto = { type, from, to, totals };
  audit(actor, { action: 'VIEW_CLINIC_REPORT', entityType: 'CLINIC', entityId: adminClinic(actor).clinicId, newValue: { type, from, to } });

  if (type === 'daily') {
    const days: string[] = [];
    for (let d = from; d <= to; d = addDaysToDate(d, 1)) days.push(d);
    out.daily = days.map((date) => {
      const xs = inRange.filter((a) => dayOf(a) === date);
      return { date, total: xs.length, confirmed: count(xs, 'CONFIRMED'), completed: count(xs, 'COMPLETED'), cancelled: count(xs, 'CANCELLED'), noShow: count(xs, 'NO_SHOW') };
    });
  }
  if (type === 'doctors') {
    const ids = [...new Set(inRange.map(doctorIdOf))];
    out.doctors = ids
      .map((doctorId) => {
        const d = db.doctors.find((x) => x.doctorId === doctorId)!;
        const xs = inRange.filter((a) => doctorIdOf(a) === doctorId);
        return {
          doctorId, fullName: doctorFullName(d), total: xs.length, completed: count(xs, 'COMPLETED'), noShow: count(xs, 'NO_SHOW'),
          completionRate: pct(count(xs, 'COMPLETED'), finished(xs).length), noShowRate: pct(count(xs, 'NO_SHOW'), finished(xs).length), avgRating: d.avgRating,
        };
      })
      .sort((a, b) => b.total - a.total);
  }
  if (type === 'no-show') {
    out.noShows = inRange
      .filter((a) => a.status === 'NO_SHOW')
      .sort((a, b) => b.startAt.localeCompare(a.startAt))
      .map((a) => ({
        appointmentId: a.appointmentId, bookingReference: a.bookingReference, date: dayOf(a), time: bakuTime(new Date(a.startAt)), patientName: patientName(a),
        doctorName: doctorFullName(db.doctors.find((d) => d.doctorId === doctorIdOf(a))!), serviceName: db.services.find((s) => s.serviceId === a.serviceId)!.nameAz,
      }));
  }
  if (type === 'load') {
    // Alt 4: gün × saat sıxlığı (ləğv edilənlər daxil deyil).
    const cells = new Map<string, number>();
    for (const a of inRange.filter((x) => x.status !== 'CANCELLED')) {
      const key = `${bakuDayOfWeek(dayOf(a))}|${Number(bakuTime(new Date(a.startAt)).slice(0, 2))}`;
      cells.set(key, (cells.get(key) ?? 0) + 1);
    }
    out.load = [...cells.entries()].map(([k, n]) => {
      const [dow, hour] = k.split('|').map(Number);
      return { dayOfWeek: dow, hour, count: n };
    });
  }
  return out;
}

const REPORT_TITLE: Record<ReportType, string> = { daily: 'Gundelik icmal', doctors: 'Hekimler uzre statistika', 'no-show': 'Gelmeyen pasientler', load: 'Yuk analizi' };
const DOW = ['', 'B.e.', 'C.a.', 'C.', 'C.a.', 'C.', 'S.', 'B.'];

function rows(r: ReportDto): (string | number | null)[][] {
  if (r.daily) return [['Tarix', 'Cemi', 'Tesdiqlenmis', 'Tamamlanmis', 'Legv', 'Gelmeyib'], ...r.daily.map((d) => [d.date, d.total, d.confirmed, d.completed, d.cancelled, d.noShow])];
  if (r.doctors) return [['Hekim', 'Cemi', 'Tamamlanmis', 'Gelmeyib', 'Tamamlanma %', 'No-show %', 'Reytinq'], ...r.doctors.map((d) => [d.fullName, d.total, d.completed, d.noShow, d.completionRate, d.noShowRate, d.avgRating])];
  if (r.noShows) return [['Nomre', 'Tarix', 'Saat', 'Pasient', 'Hekim', 'Xidmet'], ...r.noShows.map((n) => [n.bookingReference, n.date, n.time, n.patientName, n.doctorName, n.serviceName])];
  return [['Gun', 'Saat', 'Randevu'], ...(r.load ?? []).sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.hour - b.hour).map((l) => [DOW[l.dayOfWeek], `${String(l.hour).padStart(2, '0')}:00`, l.count])];
}

/** FR-805-17/18: Excel (CSV, UTF-8 BOM, ";" — Excel-də birbaşa açılır) və PDF. Mock-da xlsx əvəzinə CSV. */
export function exportReport(actor: Actor, type: ReportType, from: string, to: string, format: 'csv' | 'pdf'): { fileName: string; contentType: string; body: Buffer } {
  const r = clinicReport(actor, type, from, to);
  const table = rows(r);
  const base = `hesabat-${type}-${from}_${to}`;
  audit(actor, { action: 'EXPORT_CLINIC_REPORT', entityType: 'CLINIC', entityId: adminClinic(actor).clinicId, newValue: { type, from, to, format } });
  if (format === 'csv') {
    const esc = (v: string | number | null) => {
      const s = v == null ? '' : String(v);
      return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = '﻿' + table.map((row) => row.map(esc).join(';')).join('\r\n');
    return { fileName: `${base}.csv`, contentType: 'text/csv; charset=utf-8', body: Buffer.from(csv, 'utf8') };
  }
  const t = r.totals;
  const lines = [
    `${adminClinic(actor).name} | ${from} - ${to}`,
    `Cemi: ${t.total}  Tamamlanmis: ${t.completed}  Legv: ${t.cancelled}  Gelmeyib: ${t.noShow}  Tamamlanma: ${t.completionRate ?? '-'}%  No-show: ${t.noShowRate ?? '-'}%`,
    '',
    ...table.slice(0, 28).map((row) => row.map((v) => (v == null ? '-' : String(v))).join('  |  ')),
    ...(table.length > 28 ? [`... daha ${table.length - 28} setir (tam siyahi CSV-de)`] : []),
  ];
  return { fileName: `${base}.pdf`, contentType: 'application/pdf', body: makePdf(REPORT_TITLE[type], lines) };
}

