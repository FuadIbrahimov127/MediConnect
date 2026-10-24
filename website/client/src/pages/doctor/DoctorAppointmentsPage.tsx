import type { AppointmentDto } from '@mediconnect/shared';
import { t } from '../../i18n';
import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { serverNow } from '../../api/client';
import { doctorApi } from '../../api/doctor';
import { useApi } from '../../api/hooks';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui';
import { DoctorAppointmentRow } from '../../features/appointments/DoctorAppointmentRow';
import a from '../../features/appointments/appointments.module.css';
import { bakuDateKey, dayLabel, formatTime } from '../../lib/format';
import s from './doctor.module.css';

// UC-703 — həkimin randevuları: Bu gün / Yaxınlaşan / Təsdiq gözləyən / Keçmiş (FR-703-01), klinika və tarix filtri (FR-703-05),
// həftəlik təqvim görünüşü (FR-703-06).

const TABS = [
  ['TODAY', t('doc.tabToday')],
  ['UPCOMING', t('acc.tabUpcoming')],
  ['PENDING', t('doc.tabPending')],
  ['PAST', t('acc.tabPast')],
] as const;

export function DoctorAppointmentsPage() {
  const [params, setParams] = useSearchParams();
  const tab = (TABS.find(([k]) => k === params.get('tab'))?.[0] ?? 'TODAY') as (typeof TABS)[number][0];
  const view = params.get('view') === 'week' ? 'week' : 'list';
  const clinicId = params.get('clinicId') ?? undefined;
  const profile = useApi((sig) => doctorApi.profile(sig), []);
  const q = useApi((sig) => doctorApi.appointments({ tab: view === 'week' ? 'UPCOMING' : tab, clinicId }, sig), [tab, clinicId, view]);
  const todayQ = useApi((sig) => doctorApi.appointments({ tab: 'TODAY', clinicId }, sig), [clinicId, view], { enabled: view === 'week' });
  const multiClinic = (profile.data?.clinics.length ?? 0) > 1;
  const set = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) v ? next.set(k, v) : next.delete(k);
    setParams(next, { replace: true });
  };

  return (
    <div>
      <h1 className="page-title">{t('panel.doctor.appointments')}</h1>
      <div className={s.filters}>
        <div className={a.tabs} role="tablist" style={{ marginBottom: 0 }}>
          {TABS.map(([k, label]) => (
            <button key={k} type="button" role="tab" aria-selected={view === 'list' && tab === k} className={a.tab} onClick={() => set({ tab: k === 'TODAY' ? null : k, view: null })}>
              {label}
              {q.data && <span className={a.tabCount}>{q.data.counts[k]}</span>}
            </button>
          ))}
          <button type="button" role="tab" aria-selected={view === 'week'} className={a.tab} onClick={() => set({ view: 'week', tab: null })}>
            {t('doc.weekCal')}
          </button>
        </div>
        {multiClinic && (
          <label>
            {t('booking.clinic')}
            <select className="input" value={clinicId ?? ''} onChange={(e) => set({ clinicId: e.target.value || null })}>
              <option value="">{t('shares.all')}</option>
              {profile.data!.clinics.map((c) => (
                <option key={c.clinicId} value={c.clinicId}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {view === 'list' && q.data && tab === 'TODAY' && (
        <p className="ink-soft" style={{ marginTop: 0 }}>
          {t('doc.todaySummary', { total: q.data.today.total, completed: q.data.today.completed, remaining: q.data.today.remaining, noShow: q.data.today.noShow })}
        </p>
      )}
      {q.error && <ErrorState message={q.error.message} onRetry={q.reload} />}
      {!q.data && !q.error && <Skeleton height={240} radius={18} />}

      {view === 'week' && q.data && <WeekView list={[...(todayQ.data?.appointments ?? []), ...q.data.appointments]} />}

      {view === 'list' && q.data && (
        <>
          {q.data.appointments.length === 0 ? (
            <div className="card">
              <EmptyState title={t('doc.noAppts')} />
            </div>
          ) : (
            <div className={s.list}>
              {q.data.appointments.map((x) => (
                <DoctorAppointmentRow key={x.appointmentId} a={x} showDate={tab !== 'TODAY'} showClinic={multiClinic && !clinicId} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function WeekView({ list }: { list: AppointmentDto[] }) {
  const days = useMemo(() => {
    const start = bakuDateKey(new Date(serverNow()));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(`${start}T00:00:00Z`);
      d.setUTCDate(d.getUTCDate() + i);
      return d.toISOString().slice(0, 10);
    });
  }, []);
  return (
    <section className="card">
      <div className={s.weekGrid}>
        {days.map((day) => {
          const l = dayLabel(day);
          const items = list.filter((x) => x.slotDate === day && x.status !== 'CANCELLED').sort((x, y) => x.startAt.localeCompare(y.startAt));
          return (
            <div key={day} className={s.weekDay}>
              <div className={s.weekHead}>
                {l.weekday} · {l.date}
              </div>
              {items.length === 0 && <span className="muted" style={{ fontSize: 12 }}>—</span>}
              {items.map((x) => (
                <Link key={x.appointmentId} to={`/doctor/appointments/${x.appointmentId}`} className={`${s.weekItem} ${x.status === 'PENDING' ? s.weekItemPending : ''}`}>
                  <strong>{formatTime(x.startAt)}</strong> {x.patient?.fullName}
                </Link>
              ))}
            </div>
          );
        })}
      </div>
    </section>
  );
}
