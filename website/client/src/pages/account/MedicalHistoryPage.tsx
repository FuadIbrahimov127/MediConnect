import { Link, useSearchParams } from 'react-router-dom';
import { t } from '../../i18n';
import { documentsApi } from '../../api/documents';
import { useApi } from '../../api/hooks';
import { Alert } from '../../components/forms';
import { Button, EmptyState, ErrorState, Skeleton } from '../../components/ui';
import { Timeline } from '../../features/documents/Timeline';
import s from '../../features/documents/documents.module.css';
import { formatDate } from '../../lib/format';

// UC-504 — tibbi tarixçəm: bütün qəbullar, reseptlər, sənədlər bir yerdə; filtr (FR-504-06..08), PDF/çap (FR-504-10).

export function MedicalHistoryPage() {
  const [params, setParams] = useSearchParams();
  const q = Object.fromEntries(['type', 'from', 'to', 'doctorId', 'clinicId'].map((k) => [k, params.get(k) ?? undefined]));
  const res = useApi((sig) => documentsApi.timeline(q, sig), [params.toString()]);
  const set = (k: string, v: string) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v);
    else next.delete(k);
    setParams(next, { replace: true });
  };

  if (res.error?.errorType === 'ConsentRequired')
    return (
      <Alert tone="warning">
        {t('acc.historyLocked')} <Link to="/account/settings">{t('panel.patient.settings')}</Link>
      </Alert>
    );
  if (res.error) return <ErrorState message={res.error.message} onRetry={res.reload} />;
  const d = res.data;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <h1 className="page-title">{t('panel.patient.history')}</h1>
        <Button variant="ghost" className={s.noPrint} onClick={() => window.print()}>
          {t('acc.printPdf')}
        </Button>
      </div>
      {d && (
        <div className="card" style={{ marginBottom: 18 }}>
          <strong>{d.patient.fullName}</strong> · {formatDate(d.patient.birthDate)}
          {d.patient.bloodType && ` · ${t('acc.bloodType', { v: d.patient.bloodType })}`}
          <div className="ink-soft" style={{ fontSize: 14, marginTop: 6 }}>
            {t('acc.allergiesLine', { a: d.patient.allergies.join(', ') || t('acc.none'), c: d.patient.chronicConditions.join(', ') || t('acc.none') })}
          </div>
        </div>
      )}
      <div className={`${s.toolbar} ${s.noPrint}`}>
        <select className="input" value={params.get('type') ?? ''} onChange={(e) => set('type', e.target.value)} aria-label={t('acc.type')}>
          <option value="">{t('acc.allTypes')}</option>
          <option value="APPOINTMENT">{t('acc.visits')}</option>
          <option value="PRESCRIPTION">{t('acc.rxTitle')}</option>
          <option value="DOCUMENT">{t('acc.documents')}</option>
        </select>
        <input type="date" className="input" value={params.get('from') ?? ''} onChange={(e) => set('from', e.target.value)} aria-label={t('acc.fromDate')} />
        <input type="date" className="input" value={params.get('to') ?? ''} onChange={(e) => set('to', e.target.value)} aria-label={t('acc.toDate')} />
        {d && d.filters.doctors.length > 0 && (
          <select className="input" value={params.get('doctorId') ?? ''} onChange={(e) => set('doctorId', e.target.value)} aria-label={t('booking.doctor')}>
            <option value="">{t('acc.allDoctors')}</option>
            {d.filters.doctors.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </select>
        )}
        {d && d.filters.clinics.length > 0 && (
          <select className="input" value={params.get('clinicId') ?? ''} onChange={(e) => set('clinicId', e.target.value)} aria-label={t('booking.clinic')}>
            <option value="">{t('acc.allClinics')}</option>
            {d.filters.clinics.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </select>
        )}
      </div>
      {!d && <Skeleton height={300} radius={18} />}
      {d && d.events.length === 0 && !params.toString() ? (
        <div className="card">
          <EmptyState title={t('acc.historyEmpty')} body={t('acc.historyEmptyBody')} />
        </div>
      ) : (
        d && <Timeline data={d} />
      )}
    </div>
  );
}
