import { Link } from 'react-router-dom';
import { t } from '../../i18n';
import { CLINIC_STATUS_LABEL, DOCTOR_CLINIC_STATUS_LABEL } from '../../i18n/labels';
import { clinicAdminApi } from '../../api/clinicAdmin';
import { useApi } from '../../api/hooks';
import { Alert } from '../../components/forms';
import { ButtonLink, EmptyState, ErrorState, Skeleton } from '../../components/ui';
import { StatusBadge } from '../../features/appointments/status';
import s from '../../features/clinicAdmin/clinicAdmin.module.css';
import { formatDate, formatTime } from '../../lib/format';

// /clinic-admin — icmal (UC-805 alt 1): bugünkü göstəricilər, növbəti qəbullar, həkim statusları,
// lisenziya xəbərdarlıqları (FR-802-26), gözləyən dəvətlər.

export function ClinicDashboardPage() {
  const q = useApi((sig) => clinicAdminApi.dashboard(sig), []);
  if (q.error) return <ErrorState message={q.error.message} onRetry={q.reload} />;
  if (!q.data) return <Skeleton height={420} radius={18} />;
  const d = q.data;
  return (
    <div className={s.stack}>
      <div>
        <div className="eyebrow">{t('ca.panel')}</div>
        <h1 className="page-title">{d.clinic.name}</h1>
      </div>
      {!d.clinic.acceptingAppointments && (
        <Alert tone="warning">
          {t('ca.closedTemp')} <Link to="/clinic-admin/profile#status">{t('ca.changeStatus')}</Link>
        </Alert>
      )}
      {d.clinic.status !== 'ACTIVE' && <Alert tone="error">{t('ca.statusIs', { s: CLINIC_STATUS_LABEL[d.clinic.status] ?? d.clinic.status })}</Alert>}

      <div className={s.stats}>
        {(
          [
            [t('ca.todayAppts'), d.today.total, `/clinic-admin/appointments`],
            [t('ca.done'), d.today.completed, null],
            [t('ca.left'), d.today.remaining, null],
            [t('ca.noShow'), d.today.noShow, null],
            [t('ca.cancelled'), d.today.cancelled, null],
          ] as const
        ).map(([label, value, to]) =>
          to ? (
            <Link key={label} to={to} className={s.stat}>
              <div className={s.statValue}>{value}</div>
              <div className={s.statLabel}>{label}</div>
            </Link>
          ) : (
            <div key={label} className={s.stat}>
              <div className={s.statValue}>{value}</div>
              <div className={s.statLabel}>{label}</div>
            </div>
          ),
        )}
      </div>

      <div className={s.twoCol}>
        <section className={s.section}>
          <div className={s.sectionHead}>
            <h2 className={s.sectionTitle}>{t('ca.nextToday')}</h2>
            <Link to="/clinic-admin/appointments">{t('shares.all')}</Link>
          </div>
          {d.next.length === 0 ? (
            <EmptyState title={t('ca.noneLeft')} />
          ) : (
            <div className={s.list}>
              {d.next.map((a) => (
                <Link key={a.appointmentId} to={`/clinic-admin/appointments/${a.appointmentId}`} className={s.row}>
                  <span>
                    <strong>{formatTime(a.startAt)}</strong> · {a.patient?.fullName}
                    <div className={s.sub}>
                      {a.doctor.fullName} · {a.service.name}
                    </div>
                  </span>
                  <StatusBadge status={a.status} />
                </Link>
              ))}
            </div>
          )}
        </section>

        <div className={s.stack}>
          <section className={s.section}>
            <div className={s.sectionHead}>
              <h2 className={s.sectionTitle}>{t('panel.clinicAdmin.doctors')}</h2>
              <ButtonLink to="/clinic-admin/doctors/new" size="small">
                {t('ca.addDoctor')}
              </ButtonLink>
            </div>
            <div className={s.stats}>
              {(
                [
                  [DOCTOR_CLINIC_STATUS_LABEL.ACTIVE, d.doctors.active, 'ACTIVE'],
                  [DOCTOR_CLINIC_STATUS_LABEL.INACTIVE, d.doctors.inactive, 'INACTIVE'],
                  [DOCTOR_CLINIC_STATUS_LABEL.INVITED, d.doctors.invited, 'INVITED'],
                ] as const
              ).map(([label, value, status]) => (
                <Link key={label} to={`/clinic-admin/doctors?status=${status}`} className={s.stat}>
                  <div className={s.statValue}>{value}</div>
                  <div className={s.statLabel}>{label}</div>
                </Link>
              ))}
            </div>
            {d.doctors.profileIncomplete > 0 && <Alert tone="info">{t('ca.incomplete', { n: d.doctors.profileIncomplete })}</Alert>}
          </section>

          {d.licenseAlerts.length > 0 && (
            <section className={s.section}>
              <h2 className={s.sectionTitle}>{t('ca.licenseAlerts')}</h2>
              <div className={s.list}>
                {d.licenseAlerts.map((x) => (
                  <Link key={x.doctorId} to={`/clinic-admin/doctors/${x.doctorId}`} className={s.row}>
                    <span>{x.fullName}</span>
                    <span className={x.daysLeft < 0 ? s.dangerText : s.warnText}>
                      {x.daysLeft < 0 ? t('ca.expiredOn', { date: formatDate(x.licenseExpiryDate) }) : t('shares.daysLeft', { n: x.daysLeft })}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {d.pendingInvites.length > 0 && (
            <section className={s.section}>
              <h2 className={s.sectionTitle}>{t('ca.pendingInvites')}</h2>
              <div className={s.list}>
                {d.pendingInvites.map((x) => (
                  <Link key={x.doctorId} to={`/clinic-admin/doctors/${x.doctorId}`} className={s.row}>
                    <span>{x.fullName}</span>
                    <span className={x.expired ? s.dangerText : s.sub}>{x.expired ? t('ca.inviteExpired') : x.inviteExpiresAt ? t('docRx.until', { date: formatDate(x.inviteExpiresAt) }) : ''}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className={s.section}>
            <div className={s.sectionHead}>
              <h2 className={s.sectionTitle}>{t('detail.services')}</h2>
              <Link to="/clinic-admin/services">{t('ca.manage')}</Link>
            </div>
            <span className="ink-soft">{t('ca.servicesInfo', { n: d.services })}</span>
          </section>
        </div>
      </div>
    </div>
  );
}
