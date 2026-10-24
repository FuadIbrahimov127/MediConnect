import { useParams } from 'react-router-dom';
import { t } from '../../i18n';
import { useApi } from '../../api/hooks';
import { prescriptionsApi } from '../../api/prescriptions';
import { Alert } from '../../components/forms';
import { EmptyState, Skeleton } from '../../components/ui';
import { StatusBadge } from '../../features/prescriptions/PrescriptionView';
import s from '../../features/prescriptions/prescriptions.module.css';
import { formatDate, formatDateTime } from '../../lib/format';

// BR-602-06 — QR ilə reseptin həqiqiliyinin yoxlanılması (aptek). Açıq səhifədir: diaqnoz və dərman adları göstərilmir.

export function VerifyPrescriptionPage() {
  const { qrToken = '' } = useParams();
  const q = useApi((sig) => prescriptionsApi.verify(qrToken, sig), [qrToken]);

  return (
    <div className="container" style={{ paddingTop: 40, maxWidth: 640 }}>
      <h1 className="page-title">{t('verify.title')}</h1>
      {q.error && (
        <div className="card">
          <EmptyState title={t('rxDetail.notFound')} body={t('verify.notFoundBody')} />
        </div>
      )}
      {!q.data && !q.error && <Skeleton height={260} radius={18} />}
      {q.data && (
        <article className={s.paper}>
          <header className={s.paperHead}>
            <div>
              <div className={s.kicker}>{t('rx.eRx')}</div>
              <div className={s.number}>{q.data.prescriptionNumber}</div>
            </div>
            <StatusBadge status={q.data.status} />
          </header>
          {q.data.valid ? (
            <Alert tone="success">{t('verify.valid')}</Alert>
          ) : (
            <Alert tone="error">
              {t('verify.invalid')}{' '}
              {q.data.status === 'EXPIRED' ? t('verify.expired') : q.data.status === 'CANCELLED' ? t('verify.cancelled') : t('verify.badSig')}.
            </Alert>
          )}
          <div className={s.parties}>
            <div>
              <div className={s.label}>{t('rx.patient')}</div>
              <div className={s.value}>{q.data.patientInitials}</div>
            </div>
            <div>
              <div className={s.label}>{t('booking.doctor')}</div>
              <div className={s.value}>{q.data.doctorName}</div>
              <div className={s.sub}>{q.data.clinicName}</div>
            </div>
            <div>
              <div className={s.label}>{t('verify.signedAt')}</div>
              <div className={s.value}>{formatDateTime(q.data.signedAt)}</div>
            </div>
            <div>
              <div className={s.label}>{t('verify.validUntil')}</div>
              <div className={s.value}>{t('docRx.until', { date: formatDate(q.data.validUntil) })}</div>
              <div className={s.sub}>{t('acc.medsCount', { n: q.data.medicationCount })}</div>
            </div>
          </div>
          <p className="muted" style={{ fontSize: 13, margin: 0 }}>
            {t('verify.privacy')}
          </p>
        </article>
      )}
    </div>
  );
}
