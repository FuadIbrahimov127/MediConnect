import { Link } from 'react-router-dom';
import { t } from '../../i18n';
import { doctorApi } from '../../api/doctor';
import { useApi } from '../../api/hooks';
import { Alert } from '../../components/forms';
import { ButtonLink, ErrorState, Skeleton } from '../../components/ui';
import { DoctorAppointmentRow } from '../../features/appointments/DoctorAppointmentRow';
import { formatDate, formatSlotLabel } from '../../lib/format';
import s from './doctor.module.css';

// /doctor — günün icmalı (UC-703 alt 3): ümumi, tamamlanan, qalan, gəlməyən; təsdiq gözləyənlər; lisenziya xəbərdarlığı.

export function DoctorDashboardPage() {
  const q = useApi((sig) => doctorApi.dashboard(sig), []);
  if (q.error) return <ErrorState message={q.error.message} onRetry={q.reload} />;
  if (!q.data) return <Skeleton height={360} radius={18} />;
  const d = q.data;
  return (
    <div>
      <h1 className="page-title">{t('panel.doctor.dashboard')}</h1>
      <div style={{ display: 'grid', gap: 18 }}>
        {!d.profileCompleted && (
          <Alert tone="warning">
            {t('doc.incomplete')} <Link to="/doctor/profile">{t('doc.completeProfile')}</Link>
          </Alert>
        )}
        {d.licenseDaysLeft <= 30 && (
          <Alert tone={d.licenseDaysLeft < 0 ? 'error' : 'warning'}>
            {d.licenseDaysLeft < 0 ? t('doc.licenseExpired', { date: formatDate(d.licenseExpiryDate) }) : t('doc.licenseSoon', { date: formatDate(d.licenseExpiryDate), n: d.licenseDaysLeft })}
          </Alert>
        )}
        <div className={s.stats}>
          {(
            [
              [t('doc.total'), d.today.total],
              [t('doc.completed'), d.today.completed],
              [t('doc.remaining'), d.today.remaining],
              [t('doc.noShow'), d.today.noShow],
            ] as const
          ).map(([k, v]) => (
            <div key={k} className={s.stat}>
              <div className={s.statValue}>{v}</div>
              <div className={s.statLabel}>{k}</div>
            </div>
          ))}
          <Link to="/doctor/appointments?tab=PENDING" className={`${s.stat} ${d.pendingCount ? s.statAccent : ''}`}>
            <div className={s.statValue}>{d.pendingCount}</div>
            <div className={s.statLabel}>{t('doc.pending')}</div>
          </Link>
        </div>
        {d.next && (
          <section className="card">
            <div className={s.sectionHead}>
              <h2 className={s.h2}>{t('doc.nextVisit', { time: formatSlotLabel(d.next.startAt) })}</h2>
              <ButtonLink to={`/doctor/appointments/${d.next.appointmentId}`} size="small">
                {t('doc.open')}
              </ButtonLink>
            </div>
            <DoctorAppointmentRow a={d.next} />
            {d.next.patientNote && <p className="ink-soft" style={{ margin: '12px 0 0' }}>{t('doc.complaint', { text: d.next.patientNote })}</p>}
          </section>
        )}
        <section className="card">
          <div className={s.sectionHead}>
            <h2 className={s.h2}>{t('doc.todayAppts')}</h2>
            <Link to="/doctor/appointments" style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent)' }}>
              {t('shares.all')}
            </Link>
          </div>
          {d.todayList.length === 0 ? (
            <p className="ink-soft" style={{ margin: 0 }}>
              {t('doc.noToday')}
            </p>
          ) : (
            <div className={s.list}>
              {d.todayList.map((a) => (
                <DoctorAppointmentRow key={a.appointmentId} a={a} showClinic />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
