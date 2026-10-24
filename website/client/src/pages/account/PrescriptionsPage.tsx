import type { PrescriptionTab } from '@mediconnect/shared';
import { t } from '../../i18n';
import { Link, useSearchParams } from 'react-router-dom';
import { useApi } from '../../api/hooks';
import { prescriptionsApi } from '../../api/prescriptions';
import { Alert } from '../../components/forms';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui';
import a from '../../features/appointments/appointments.module.css';
import { StatusBadge } from '../../features/prescriptions/PrescriptionView';
import s from '../../features/prescriptions/prescriptions.module.css';
import { formatDate } from '../../lib/format';

// UC-602 — Reseptlərim: Aktiv / Keçmiş / Ləğv edilmiş (FR-602-05), kartda nömrə, tarix, həkim (FR-602-06).

const TABS: [PrescriptionTab, string][] = [
  ['ACTIVE', t('acc.rxActive')],
  ['PAST', t('acc.tabPast')],
  ['CANCELLED', t('acc.tabCancelled')],
];

const EMPTY: Record<string, string> = {
  ACTIVE: t('acc.rxEmptyActive'),
  PAST: t('acc.rxEmptyPast'),
  CANCELLED: t('acc.rxEmptyCancelled'),
};

export function PrescriptionsPage() {
  const [params, setParams] = useSearchParams();
  const tab = (TABS.some(([k]) => k === params.get('tab')) ? params.get('tab') : 'ACTIVE') as PrescriptionTab;
  const q = useApi((sig) => prescriptionsApi.list(tab, sig), [tab]);

  if (q.error?.errorType === 'ConsentRequired')
    return (
      <Alert tone="warning">
        {t('acc.rxLocked')} <Link to="/account/settings">{t('panel.patient.settings')}</Link>
      </Alert>
    );
  return (
    <div>
      <h1 className="page-title">{t('panel.patient.prescriptions')}</h1>
      <div className={a.tabs} role="tablist">
        {TABS.map(([k, label]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} className={a.tab} onClick={() => setParams(k === 'ACTIVE' ? {} : { tab: k }, { replace: true })}>
            {label}
            {q.data && <span className={a.tabCount}>{q.data.counts[k]}</span>}
          </button>
        ))}
      </div>
      {q.error && <ErrorState message={q.error.message} onRetry={q.reload} />}
      {!q.data && !q.error && <Skeleton height={180} radius={16} />}
      {q.data && q.data.prescriptions.length === 0 && (
        <div className="card">
          <EmptyState title={EMPTY[tab]} body={tab === 'ACTIVE' ? t('acc.rxEmptyBody') : undefined} />
        </div>
      )}
      <div className={s.cards}>
        {q.data?.prescriptions.map((p) => (
          <Link key={p.prescriptionId} to={`/account/prescriptions/${p.prescriptionId}`} className={s.card}>
            <div>
              <div className={s.cardTitle}>{p.prescriptionNumber}</div>
              <div className={s.cardMeta}>
                {formatDate(p.date)} · {p.doctorName} · {p.clinicName}
              </div>
              <div className={s.cardMeta}>{t('acc.medsCount', { n: p.medicationCount })}</div>
            </div>
            <div className={s.cardRight}>
              <StatusBadge status={p.status} />
              {p.validUntil && p.status === 'SIGNED' && <span>{t('acc.validUntilShort', { date: formatDate(p.validUntil) })}</span>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
