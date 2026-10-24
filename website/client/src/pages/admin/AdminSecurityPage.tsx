import { SECURITY_EVENT_TYPE, SECURITY_SEVERITY, type SecuritySeverity } from '@mediconnect/shared';
import { t } from '../../i18n';
import { useSearchParams } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import { useApi } from '../../api/hooks';
import { Badge, Button, EmptyState, ErrorState, Skeleton, type Tone } from '../../components/ui';
import s from '../../features/clinicAdmin/clinicAdmin.module.css';
import { formatDateTime } from '../../lib/format';

// UC-904 alt 7 — təhlükəsizlik hadisələri: uğursuz girişlər, icazəsiz giriş cəhdləri, SİMA uyğunsuzluğu, zərərli fayl,
// saxta sənəd, audit jurnalını dəyişdirmə cəhdi. Son 24 saatın xülasəsi yuxarıda.

const TYPE_LABEL: Record<string, string> = {
  FAILED_LOGIN: t('sec.FAILED_LOGIN'), UNAUTHORIZED_ACCESS: t('sec.UNAUTHORIZED_ACCESS'), MALWARE_DETECTED: t('sec.MALWARE_DETECTED'), SIMA_MISMATCH: t('sec.SIMA_MISMATCH'),
  DOCUMENT_FRAUD: t('sec.DOCUMENT_FRAUD'), ADMIN_ACTION: t('sec.ADMIN_ACTION'),
};
const SEV_TONE: Record<SecuritySeverity, Tone> = { LOW: 'neutral', MEDIUM: 'warning', HIGH: 'danger', CRITICAL: 'danger' };
const SIZE = 50;

export function AdminSecurityPage() {
  const [params, setParams] = useSearchParams();
  const eventType = params.get('eventType') ?? '';
  const severity = params.get('severity') ?? '';
  const page = Number(params.get('page') ?? 1);
  const set = (k: string, v: string) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v);
    else next.delete(k);
    if (k !== 'page') next.delete('page');
    setParams(next, { replace: true });
  };
  const q = useApi((sig) => adminApi.security({ eventType: eventType || undefined, severity: severity || undefined, page, size: SIZE }, sig), [params.toString()]);
  const pages = q.data ? Math.max(1, Math.ceil(q.data.totalCount / SIZE)) : 1;

  return (
    <div className={s.stack}>
      <h1 className="page-title" style={{ margin: 0 }}>
        {t('sec.title')}
      </h1>
      {q.data && (
        <div className={s.stats}>
          {SECURITY_EVENT_TYPE.map((ev) => (
            <button key={ev} type="button" className={s.stat} style={{ textAlign: 'left', cursor: 'pointer', font: 'inherit' }} onClick={() => set('eventType', eventType === ev ? '' : ev)} aria-pressed={eventType === ev}>
              <div className={s.statValue}>{q.data!.last24h[ev] ?? 0}</div>
              <div className={s.statLabel}>{t('sec.last24', { type: TYPE_LABEL[ev] })}</div>
            </button>
          ))}
        </div>
      )}
      <div className={s.toolbar} style={{ marginBottom: 0 }}>
        <label>
          {t('caProf.type')}
          <select className="input" value={eventType} onChange={(e) => set('eventType', e.target.value)}>
            <option value="">{t('shares.all')}</option>
            {SECURITY_EVENT_TYPE.map((ev) => (
              <option key={ev} value={ev}>
                {TYPE_LABEL[ev]}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t('profile.severity')}
          <select className="input" value={severity} onChange={(e) => set('severity', e.target.value)}>
            <option value="">{t('shares.all')}</option>
            {SECURITY_SEVERITY.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </label>
      </div>
      {q.error && <ErrorState message={q.error.message} onRetry={q.reload} />}
      {!q.data && !q.error && <Skeleton height={360} radius={16} />}
      {q.data && q.data.rows.length === 0 && (
        <div className="card">
          <EmptyState title={t('sec.none')} />
        </div>
      )}
      {q.data && q.data.rows.length > 0 && (
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>
                <th>{t('audit.time')}</th>
                <th>{t('caProf.type')}</th>
                <th>{t('profile.severity')}</th>
                <th>{t('sec.description')}</th>
                <th>{t('audit.user')}</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {q.data.rows.map((e) => (
                <tr key={e.eventId}>
                  <td style={{ whiteSpace: 'nowrap' }}>{formatDateTime(e.createdAt)}</td>
                  <td>{TYPE_LABEL[e.eventType] ?? e.eventType}</td>
                  <td>
                    <Badge tone={SEV_TONE[e.severity]}>{e.severity}</Badge>
                  </td>
                  <td>{e.description}</td>
                  <td>{e.userName ?? '—'}</td>
                  <td className={`${s.sub} mono`}>{e.ipAddress ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {pages > 1 && (
        <div className={s.actions} style={{ justifyContent: 'center', alignItems: 'center' }}>
          <Button size="small" variant="ghost" disabled={page <= 1} onClick={() => set('page', String(page - 1))}>
            {t('caAppt.prev')}
          </Button>
          <span className="muted" style={{ fontSize: 14 }}>
            {page} / {pages}
          </span>
          <Button size="small" variant="ghost" disabled={page >= pages} onClick={() => set('page', String(page + 1))}>
            {t('caAppt.next')}
          </Button>
        </div>
      )}
    </div>
  );
}
