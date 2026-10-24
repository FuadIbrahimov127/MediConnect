import { type ClinicStatus } from '@mediconnect/shared';
import { t } from '../../i18n';
import { CLINIC_STATUS_LABEL, CLINIC_TYPE_LABEL } from '../../i18n/labels';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import { useApi } from '../../api/hooks';
import { Badge, ButtonLink, EmptyState, ErrorState, Skeleton, type Tone } from '../../components/ui';
import s from '../../features/clinicAdmin/clinicAdmin.module.css';
import { formatDate } from '../../lib/format';

// UC-901 — bütün klinikalar: ad, növ, şəhər, status, həkim sayı, qeydiyyat tarixi; verifikasiya gözləyənlər yuxarıda.

export const CLINIC_TONE: Record<ClinicStatus, Tone> = { PENDING_VERIFICATION: 'accent', ACTIVE: 'success', SUSPENDED: 'warning', INACTIVE: 'neutral' };

export function AdminClinicsPage() {
  const [params, setParams] = useSearchParams();
  const status = params.get('status') ?? '';
  const [text, setText] = useState('');
  const q = useApi((sig) => adminApi.clinics({ status: status || undefined, q: text || undefined }, sig), [status, text]);

  return (
    <div>
      <div className={s.sectionHead} style={{ marginBottom: 18 }}>
        <h1 className="page-title" style={{ margin: 0 }}>
          {t('panel.admin.clinics')}
        </h1>
        <ButtonLink to="/admin/clinics/new">{t('adm.addClinic')}</ButtonLink>
      </div>
      <div className={s.toolbar}>
        <div className={s.chips} role="group" aria-label={t('ca.statusFilter')}>
          <button type="button" className={s.chipToggle} aria-pressed={!status} onClick={() => setParams({}, { replace: true })}>
            {t('shares.all')}
          </button>
          {(Object.keys(CLINIC_STATUS_LABEL) as ClinicStatus[]).map((st) => (
            <button key={st} type="button" className={s.chipToggle} aria-pressed={status === st} onClick={() => setParams({ status: st }, { replace: true })}>
              {CLINIC_STATUS_LABEL[st]}
            </button>
          ))}
        </div>
        <input className="input" type="search" placeholder={t('adm.clinicSearchPh')} value={text} onChange={(e) => setText(e.target.value)} aria-label={t('ca.searchAria')} />
      </div>
      {q.error && <ErrorState message={q.error.message} onRetry={q.reload} />}
      {!q.data && !q.error && <Skeleton height={300} radius={16} />}
      {q.data && q.data.length === 0 && (
        <div className="card">
          <EmptyState title={t('adm.noClinic')} />
        </div>
      )}
      {q.data && q.data.length > 0 && (
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>
                <th>{t('booking.clinic')}</th>
                <th>{t('caProf.type')}</th>
                <th>{t('caProf.city')}</th>
                <th>{t('ca.status')}</th>
                <th className={s.num}>{t('booking.doctor')}</th>
                <th>{t('docProf.license')}</th>
                <th>{t('adm.registered')}</th>
              </tr>
            </thead>
            <tbody>
              {q.data.map((c) => (
                <tr key={c.clinicId}>
                  <td className={s.nameCell}>
                    <Link to={`/admin/clinics/${c.clinicId}/verify`}>{c.name}</Link>
                  </td>
                  <td>{CLINIC_TYPE_LABEL[c.clinicType]}</td>
                  <td>{c.cityName}</td>
                  <td>
                    <Badge tone={CLINIC_TONE[c.status]}>{CLINIC_STATUS_LABEL[c.status]}</Badge>
                  </td>
                  <td className={s.num}>{c.doctorCount}</td>
                  <td className={c.licenseDaysLeft < 0 ? s.dangerText : c.licenseDaysLeft <= 30 ? s.warnText : undefined}>{formatDate(c.licenseExpiryDate)}</td>
                  <td>{formatDate(c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
