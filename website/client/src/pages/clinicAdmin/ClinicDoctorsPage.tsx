import { type DoctorClinicStatus } from '@mediconnect/shared';
import { t } from '../../i18n';
import { DOCTOR_CLINIC_STATUS_LABEL } from '../../i18n/labels';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { clinicAdminApi } from '../../api/clinicAdmin';
import { useApi } from '../../api/hooks';
import { Avatar, Badge, ButtonLink, EmptyState, ErrorState, Skeleton, type Tone } from '../../components/ui';
import s from '../../features/clinicAdmin/clinicAdmin.module.css';
import { formatDate } from '../../lib/format';

// UC-802 — klinikadakı həkimlər: foto, ad, ixtisas, status, randevu sayı, reytinq (FR-802-17/18), lisenziya izləməsi.

export const DC_TONE: Record<DoctorClinicStatus, Tone> = { INVITED: 'accent', ACTIVE: 'success', INACTIVE: 'warning', REMOVED: 'neutral' };
const FILTERS: [string, string][] = [
  ['', t('shares.all')],
  ['ACTIVE', DOCTOR_CLINIC_STATUS_LABEL.ACTIVE],
  ['INACTIVE', DOCTOR_CLINIC_STATUS_LABEL.INACTIVE],
  ['INVITED', DOCTOR_CLINIC_STATUS_LABEL.INVITED],
  ['REMOVED', DOCTOR_CLINIC_STATUS_LABEL.REMOVED],
];

export function ClinicDoctorsPage() {
  const [params, setParams] = useSearchParams();
  const status = params.get('status') ?? '';
  const [text, setText] = useState('');
  const q = useApi((sig) => clinicAdminApi.doctors({ status: status || undefined, q: text || undefined }, sig), [status, text]);

  return (
    <div>
      <div className={s.sectionHead} style={{ marginBottom: 18 }}>
        <h1 className="page-title" style={{ margin: 0 }}>
          {t('panel.clinicAdmin.doctors')}
        </h1>
        <ButtonLink to="/clinic-admin/doctors/new">{t('ca.addDoctor')}</ButtonLink>
      </div>
      <div className={s.toolbar}>
        <div className={s.chips} role="group" aria-label={t('ca.statusFilter')}>
          {FILTERS.map(([v, label]) => (
            <button key={v} type="button" className={s.chipToggle} aria-pressed={status === v} onClick={() => setParams(v ? { status: v } : {}, { replace: true })}>
              {label}
            </button>
          ))}
        </div>
        <input className="input" type="search" placeholder={t('ca.searchPh')} value={text} onChange={(e) => setText(e.target.value)} aria-label={t('ca.searchAria')} />
      </div>
      {q.error && <ErrorState message={q.error.message} onRetry={q.reload} />}
      {!q.data && !q.error && <Skeleton height={300} radius={16} />}
      {q.data && q.data.length === 0 && (
        <div className="card">
          <EmptyState title={t('ca.noDoctors')} body={t('ca.noDoctorsBody')} action={<ButtonLink to="/clinic-admin/doctors/new">{t('ca.addDoctorPlain')}</ButtonLink>} />
        </div>
      )}
      {q.data && q.data.length > 0 && (
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>
                <th>{t('booking.doctor')}</th>
                <th>{t('ca.status')}</th>
                <th>{t('ca.room')}</th>
                <th>{t('docProf.license')}</th>
                <th className={s.num}>{t('ca.upcoming')}</th>
                <th className={s.num}>{t('ca.visits30')}</th>
                <th className={s.num}>{t('ca.rating')}</th>
              </tr>
            </thead>
            <tbody>
              {q.data.map((d) => (
                <tr key={d.doctorId}>
                  <td>
                    <div className={s.nameCell}>
                      <Avatar name={d.fullName.replace('Dr. ', '')} src={d.photoUrl} size={36} />
                      <div>
                        <Link to={`/clinic-admin/doctors/${d.doctorId}`}>{d.fullName}</Link>
                        <div className={s.sub}>
                          {d.specialties.join(', ')}
                          {!d.profileCompleted && d.status === 'ACTIVE' && t('ca.profileIncomplete')}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <Badge tone={DC_TONE[d.status]}>{DOCTOR_CLINIC_STATUS_LABEL[d.status]}</Badge>
                    {d.inactiveReason && <div className={s.sub}>{d.inactiveReason}</div>}
                    {d.inviteExpiresAt && <div className={s.sub}>{t('docRx.until', { date: formatDate(d.inviteExpiresAt) })}</div>}
                  </td>
                  <td>{d.roomNumber ?? '—'}</td>
                  <td>
                    <span className={d.licenseDaysLeft < 0 ? s.dangerText : d.licenseDaysLeft <= 30 ? s.warnText : undefined}>{formatDate(d.licenseExpiryDate)}</span>
                    <div className={s.sub}>{d.licenseNumber}</div>
                  </td>
                  <td className={s.num}>{d.upcomingCount}</td>
                  <td className={s.num}>{d.completedLast30}</td>
                  <td className={s.num}>{d.avgRating ? `${d.avgRating.toFixed(1)} (${d.reviewCount})` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
