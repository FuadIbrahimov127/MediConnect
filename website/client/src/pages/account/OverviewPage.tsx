import { Link } from 'react-router-dom';
import { t } from '../../i18n';
import { appointmentsApi } from '../../api/appointments';
import { profileApi } from '../../api/auth';
import { useApi } from '../../api/hooks';
import { useAuth } from '../../auth/AuthContext';
import { Alert } from '../../components/forms';
import { ButtonLink, Skeleton } from '../../components/ui';
import { AppointmentCard } from '../../features/appointments/AppointmentCard';
import s from '../../features/appointments/appointments.module.css';

// /account — şəxsi kabinetin ümumi baxışı: yaxınlaşan randevu, xəbərdarlıqlar, sürətli keçidlər.

export function OverviewPage() {
  const { user } = useAuth();
  const upcoming = useApi((sig) => appointmentsApi.list('UPCOMING', sig), []);
  const profile = useApi((sig) => profileApi.get(sig), []);
  const next = upcoming.data?.appointments[0];
  const p = profile.data?.patient;

  return (
    <div>
      <h1 className="page-title">{t('acc.hello', { name: user?.firstName ?? '' })}</h1>
      <div style={{ display: 'grid', gap: 20 }}>
        {p && !p.medicalConsent && (
          <Alert tone="warning">
            {t('acc.consentRevoked')} <Link to="/account/settings">{t('panel.patient.settings')}</Link>
          </Alert>
        )}
        {p && p.allergies.length === 0 && (
          <Alert tone="info">
            {t('acc.addAllergies')} <Link to="/account/profile">{t('acc.goProfile')}</Link>
          </Alert>
        )}

        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, marginBottom: 12 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700 }}>{t('acc.nextAppt')}</h2>
            {upcoming.data && upcoming.data.counts.UPCOMING > 1 && (
              <Link to="/account/appointments" style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent)' }}>
                {t('acc.allCount', { n: upcoming.data.counts.UPCOMING })}
              </Link>
            )}
          </div>
          {!upcoming.data ? (
            <Skeleton height={190} radius={18} />
          ) : next ? (
            <AppointmentCard a={next} />
          ) : (
            <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <span className="ink-soft">{t('acc.noUpcoming')}</span>
              <ButtonLink to="/search/doctors" arrow>
                {t('acc.findDoctor')}
              </ButtonLink>
            </div>
          )}
        </section>

        <section className={s.list} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
          {[
            ['/account/appointments?tab=PAST', t('acc.pastVisits'), upcoming.data ? t('acc.visitsCount', { n: upcoming.data.counts.PAST }) : '…'],
            ['/account/documents', t('acc.medDocs'), t('acc.medDocsSub')],
            ['/account/prescriptions', t('acc.rxTitle'), t('acc.rxSub')],
            ['/account/medical-history', t('acc.historyTitle'), t('acc.historySub')],
          ].map(([to, title, sub]) => (
            <Link key={to} to={to} className="card" style={{ color: 'var(--ink)' }}>
              <div style={{ fontWeight: 700 }}>{title}</div>
              <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                {sub}
              </div>
            </Link>
          ))}
        </section>
      </div>
    </div>
  );
}
