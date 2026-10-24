import { useSearchParams } from 'react-router-dom';
import { t } from '../../i18n';
import { appointmentsApi } from '../../api/appointments';
import { useApi } from '../../api/hooks';
import { ButtonLink, EmptyState, ErrorState, Skeleton } from '../../components/ui';
import { AppointmentCard } from '../../features/appointments/AppointmentCard';
import s from '../../features/appointments/appointments.module.css';

// UC-404 — Randevularım: Yaxınlaşan / Keçmiş / Ləğv edilmiş (FR-404-02), empty state t('acc.findDoctor') (EF-404-1).

const TABS = [
  ['UPCOMING', t('acc.tabUpcoming')],
  ['PAST', t('acc.tabPast')],
  ['CANCELLED', t('acc.tabCancelled')],
] as const;
type Tab = (typeof TABS)[number][0];

export function AppointmentsPage() {
  const [params, setParams] = useSearchParams();
  const tab = (TABS.some(([k]) => k === params.get('tab')) ? params.get('tab') : 'UPCOMING') as Tab;
  const q = useApi((sig) => appointmentsApi.list(tab, sig), [tab]);

  return (
    <div>
      <h1 className="page-title">{t('panel.patient.appointments')}</h1>
      <div className={s.tabs} role="tablist">
        {TABS.map(([k, label]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} className={s.tab} onClick={() => setParams(k === 'UPCOMING' ? {} : { tab: k }, { replace: true })}>
            {label}
            {q.data && <span className={s.tabCount}>{q.data.counts[k]}</span>}
          </button>
        ))}
      </div>
      {q.error && <ErrorState message={q.error.message} onRetry={q.reload} />}
      {!q.data && !q.error && (
        <div className={s.list}>
          {[0, 1].map((i) => (
            <Skeleton key={i} height={190} radius={18} />
          ))}
        </div>
      )}
      {q.data && q.data.appointments.length === 0 && (
        <div className="card">
          <EmptyState
            title={tab === 'UPCOMING' ? t('acc.emptyUpcoming') : tab === 'PAST' ? t('acc.emptyPast') : t('acc.emptyCancelled')}
            body={tab === 'UPCOMING' ? t('acc.emptyUpcomingBody') : undefined}
            action={tab === 'UPCOMING' ? <ButtonLink to="/search/doctors" arrow>{t('acc.findDoctor')}</ButtonLink> : undefined}
          />
        </div>
      )}
      <div className={s.list}>
        {q.data?.appointments.map((a) => (
          <AppointmentCard key={a.appointmentId} a={a} />
        ))}
      </div>
    </div>
  );
}
