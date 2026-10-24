import type { DayOverviewDto, DoctorAppointmentsDto } from '@mediconnect/shared';
import type { Actor } from '../core/actor';
import { bakuDate, clock } from '../core/clock';
import { ApiError } from '../core/errors';
import { db } from '../store/db';
import type { Appointment } from '../store/types';
import { toAppointmentDto } from './appointments.service';

// UC-703 — həkimin randevu siyahısı və pasient konteksti. Həkim yalnız öz randevularını görür (BR-703-01);
// pasientin başqa həkimlərdəki randevu və qeydləri gizlidir (BR-703-03, FR-703-23).

type Tab = DoctorAppointmentsDto['tab'];

function myDcIds(actor: Actor): string[] {
  const d = db.doctors.find((x) => x.userId === actor.userId);
  if (!d) throw new ApiError('Forbidden');
  return db.doctor_clinics.filter((x) => x.doctorId === d.doctorId).map((x) => x.doctorClinicId);
}

const dayOf = (a: Appointment) => bakuDate(new Date(a.startAt));

function tabMatch(a: Appointment, tab: Tab, today: string, nowMs: number): boolean {
  const start = new Date(a.startAt).getTime();
  const active = a.status === 'PENDING' || a.status === 'CONFIRMED';
  if (tab === 'TODAY') return dayOf(a) === today && a.status !== 'CANCELLED';
  if (tab === 'PENDING') return a.status === 'PENDING' && start > nowMs;
  if (tab === 'UPCOMING') return active && dayOf(a) > today;
  return dayOf(a) < today || (dayOf(a) === today && a.status === 'CANCELLED');
}

export function overview(list: Appointment[]): DayOverviewDto {
  return {
    total: list.filter((a) => a.status !== 'CANCELLED').length,
    completed: list.filter((a) => a.status === 'COMPLETED').length,
    remaining: list.filter((a) => a.status === 'PENDING' || a.status === 'CONFIRMED').length,
    noShow: list.filter((a) => a.status === 'NO_SHOW').length,
    cancelled: list.filter((a) => a.status === 'CANCELLED').length,
  };
}

export function listDoctorAppointments(actor: Actor, q: { tab: Tab; clinicId?: string; from?: string; to?: string }): DoctorAppointmentsDto {
  const dcIds = new Set(myDcIds(actor));
  const today = bakuDate();
  const nowMs = clock.nowMs();
  const clinicDc = q.clinicId ? new Set(db.doctor_clinics.filter((x) => x.clinicId === q.clinicId).map((x) => x.doctorClinicId)) : null;
  const mine = db.appointments.filter((a) => dcIds.has(a.doctorClinicId) && (!clinicDc || clinicDc.has(a.doctorClinicId)) && (!q.from || dayOf(a) >= q.from) && (!q.to || dayOf(a) <= q.to));
  const counts = { TODAY: 0, UPCOMING: 0, PENDING: 0, PAST: 0 };
  for (const a of mine) for (const t of ['TODAY', 'UPCOMING', 'PENDING', 'PAST'] as Tab[]) if (tabMatch(a, t, today, nowMs)) counts[t]++;
  const list = mine.filter((a) => tabMatch(a, q.tab, today, nowMs)).sort((a, b) => (q.tab === 'PAST' ? b.startAt.localeCompare(a.startAt) : a.startAt.localeCompare(b.startAt)));
  const todays = db.appointments.filter((a) => dcIds.has(a.doctorClinicId) && dayOf(a) === today);
  return { tab: q.tab, counts, today: overview(todays), appointments: list.slice(0, 100).map((a) => toAppointmentDto(actor, a)) };
}
