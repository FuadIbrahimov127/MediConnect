import { type ClinicStatus, type UserRole } from '@mediconnect/shared';
import { t } from '../../i18n';
import { CLINIC_STATUS_LABEL, ROLE_LABEL } from '../../i18n/labels';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import { useApi } from '../../api/hooks';
import { Badge, ErrorState, Skeleton } from '../../components/ui';
import { BarChart, shortDate } from '../../features/charts/BarChart';
import s from '../../features/clinicAdmin/clinicAdmin.module.css';
import { formatDate } from '../../lib/format';

// /admin — platforma statistikası (UC-904 alt 6): istifadəçilər, klinikalar, həkimlər, randevu həcmi, gözləyən işlər,
// sistem sağlamlığı (xarici servislər), klinika lisenziyası xəbərdarlıqları.

const HEALTH_LABEL: Record<string, string> = { sima: 'SİMA', sms: 'SMS', push: 'Push', email: 'Email', signature: t('admDash.signature'), storage: t('admDash.storage'), antivirus: 'Antivirus' };

export function AdminDashboardPage() {
  const q = useApi((sig) => adminApi.stats(sig), []);
  if (q.error) return <ErrorState message={q.error.message} onRetry={q.reload} />;
  if (!q.data) return <Skeleton height={480} radius={18} />;
  const d = q.data;
  const pending = [
    [t('admDash.pClinics'), d.pending.clinicsToVerify, '/admin/clinics?status=PENDING_VERIFICATION'],
    [t('admDash.pDeletion'), d.pending.deletionRequests, '/admin/users?status=DELETION_REQUESTED'],
    [t('admDash.pCatalog'), d.pending.serviceRequests, '/admin/catalogs?tab=requests'],
    [t('admDash.pReviews'), d.pending.reviewsToModerate, '/admin/moderation/reviews'],
    [t('admDash.pSecurity'), d.security24h, '/admin/security'],
  ] as const;

  return (
    <div className={s.stack}>
      <h1 className="page-title" style={{ margin: 0 }}>
        {t('admDash.title')}
      </h1>
      <div className={s.stats}>
        {(Object.keys(d.users) as UserRole[]).map((r) => (
          <Link key={r} to={`/admin/users?role=${r}`} className={s.stat}>
            <div className={s.statValue}>{d.users[r]}</div>
            <div className={s.statLabel}>{ROLE_LABEL[r]}</div>
          </Link>
        ))}
        <div className={s.stat}>
          <div className={s.statValue}>{d.activeUsers30d}</div>
          <div className={s.statLabel}>{t('admDash.active30')}</div>
        </div>
        <div className={s.stat}>
          <div className={s.statValue}>
            {d.doctors.visible}
            <span className="muted" style={{ fontSize: 16 }}> / {d.doctors.total}</span>
          </div>
          <div className={s.statLabel}>{t('admDash.visibleDoctors')}</div>
        </div>
      </div>

      <div className={s.twoCol}>
        <section className={s.section}>
          <h2 className={s.sectionTitle}>{t('admDash.pending')}</h2>
          <div className={s.list}>
            {pending.map(([label, n, to]) => (
              <Link key={label} to={to} className={s.row}>
                <span>{label}</span>
                <strong className={n > 0 ? s.warnText : 'muted'}>{n}</strong>
              </Link>
            ))}
          </div>
        </section>
        <section className={s.section}>
          <h2 className={s.sectionTitle}>{t('panel.admin.clinics')}</h2>
          <div className={s.list}>
            {(Object.keys(d.clinics) as ClinicStatus[]).map((st) => (
              <Link key={st} to={`/admin/clinics?status=${st}`} className={s.row}>
                <span>{CLINIC_STATUS_LABEL[st]}</span>
                <strong>{d.clinics[st]}</strong>
              </Link>
            ))}
          </div>
          {d.licenseAlerts.length > 0 && (
            <>
              <div className={s.roLabel}>{t('admDash.licenseExpiring')}</div>
              <div className={s.list}>
                {d.licenseAlerts.map((c) => (
                  <Link key={c.clinicId} to={`/admin/clinics/${c.clinicId}/verify`} className={s.row}>
                    <span>{c.name}</span>
                    <span className={s.warnText}>
                      {formatDate(c.licenseExpiryDate)} · {t('admDash.daysShort', { n: c.daysLeft })}
                    </span>
                  </Link>
                ))}
              </div>
            </>
          )}
        </section>
      </div>

      <section className={s.section}>
        <div className={s.sectionHead}>
          <div>
            <h2 className={s.sectionTitle}>{t('admDash.newAppts')}</h2>
            <div className={s.sectionSub}>
              {t('admDash.apptSummary', { today: d.appointments.today, upcoming: d.appointments.upcoming, done: d.appointments.completed30d, cancelled: d.appointments.cancelled30d })}
            </div>
          </div>
        </div>
        <BarChart
          height={200}
          ariaLabel={t('admDash.chartAria')}
          bars={d.daily.map((x) => ({ key: x.date, label: shortDate(x.date), value: x.count, tip: <><strong>{formatDate(x.date)}</strong><div>{t('admDash.created', { n: x.count })}</div></> }))}
        />
      </section>

      <section className={s.section}>
        <div className={s.sectionHead}>
          <h2 className={s.sectionTitle}>{t('admDash.health')}</h2>
          <span className={s.sub}>{t('admDash.healthSub')}</span>
        </div>
        <div className={s.chips}>
          {d.health.map((h) => (
            <span key={h.name} className={s.chip}>
              {HEALTH_LABEL[h.name] ?? h.name}
              <Badge tone={h.status === 'ok' ? 'success' : 'danger'}>{h.status === 'ok' ? t('admDash.ok') : h.status === 'down' ? t('admDash.down') : t('admDash.error')}</Badge>
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
