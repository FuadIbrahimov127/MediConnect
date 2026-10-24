import { ROLE_LABEL } from '../../i18n/labels';
import { t } from '../../i18n';
import { useSearchParams } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import { useApi } from '../../api/hooks';
import { Alert } from '../../components/forms';
import { Button, EmptyState, ErrorState, Skeleton } from '../../components/ui';
import { useToast } from '../../components/Toast';
import s from '../../features/clinicAdmin/clinicAdmin.module.css';
import { formatDateTime } from '../../lib/format';

// UC-904 alt 5 — audit log: bütün əməliyyatlar, filtr (istifadəçi, əməliyyat, obyekt, tarix), CSV export.
// Jurnal dəyişdirilə bilməz (BR-904-04) — səhifədə redaktə/silmə elementi yoxdur. Dəyərlər göstərilmir, yalnız sahə adları.

const SIZE = 50;

export function AdminAuditPage() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const f = Object.fromEntries(['userId', 'action', 'entityType', 'from', 'to', 'page'].map((k) => [k, params.get(k) ?? '']));
  const set = (k: string, v: string) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v);
    else next.delete(k);
    if (k !== 'page') next.delete('page');
    setParams(next, { replace: true });
  };
  const filters = { userId: f.userId || undefined, action: f.action || undefined, entityType: f.entityType || undefined, from: f.from || undefined, to: f.to || undefined };
  const q = useApi((sig) => adminApi.audit({ ...filters, page: Number(f.page || 1), size: SIZE }, sig), [params.toString()]);
  const page = Number(f.page || 1);
  const pages = q.data ? Math.max(1, Math.ceil(q.data.totalCount / SIZE)) : 1;
  const exp = () =>
    void adminApi.exportAudit(Object.fromEntries(Object.entries(filters).filter((e): e is [string, string] => !!e[1]))).catch((e: Error) => toast.error(t('rep.notDownloaded'), e.message));

  return (
    <div className={s.stack}>
      <div className={s.sectionHead}>
        <h1 className="page-title" style={{ margin: 0 }}>
          {t('panel.admin.audit')}
        </h1>
        <Button size="small" variant="ghost" onClick={exp}>
          {t('audit.csv')}
        </Button>
      </div>
      <Alert tone="info">{t('audit.readonly')}</Alert>
      <div className={s.toolbar} style={{ marginBottom: 0 }}>
        <label>
          {t('audit.action')}
          <select className="input" value={f.action} onChange={(e) => set('action', e.target.value)}>
            <option value="">{t('shares.all')}</option>
            {q.data?.actions.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t('audit.entity')}
          <select className="input" value={f.entityType} onChange={(e) => set('entityType', e.target.value)}>
            <option value="">{t('shares.all')}</option>
            {q.data?.entityTypes.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t('caAppt.from')}
          <input type="date" className="input" value={f.from} onChange={(e) => set('from', e.target.value)} />
        </label>
        <label>
          {t('caAppt.to')}
          <input type="date" className="input" value={f.to} onChange={(e) => set('to', e.target.value)} />
        </label>
        {f.userId && (
          <Button size="small" variant="ghost" onClick={() => set('userId', '')}>
            {t('audit.clearUser')}
          </Button>
        )}
      </div>
      {q.error && <ErrorState message={q.error.message} onRetry={q.reload} />}
      {!q.data && !q.error && <Skeleton height={400} radius={16} />}
      {q.data && q.data.rows.length === 0 && (
        <div className="card">
          <EmptyState title={t('audit.empty')} />
        </div>
      )}
      {q.data && q.data.rows.length > 0 && (
        <>
          <div className={s.sub}>{t('audit.count', { n: q.data.totalCount })}</div>
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>{t('audit.time')}</th>
                  <th>{t('audit.user')}</th>
                  <th>{t('audit.action')}</th>
                  <th>{t('audit.entity')}</th>
                  <th>{t('audit.fields')}</th>
                  <th>{t('docRx.reason')}</th>
                  <th>IP</th>
                </tr>
              </thead>
              <tbody>
                {q.data.rows.map((r) => (
                  <tr key={r.auditId}>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatDateTime(r.createdAt)}</td>
                    <td>
                      {r.actorName ?? t('apptDetail.bySYSTEM')}
                      {r.actorRole && <div className={s.sub}>{ROLE_LABEL[r.actorRole]}</div>}
                    </td>
                    <td className="mono" style={{ fontSize: 12 }}>
                      {r.action}
                    </td>
                    <td>
                      {r.entityType}
                      {r.entityId && <div className={`${s.sub} mono`}>{r.entityId.slice(0, 8)}…</div>}
                    </td>
                    <td className={s.sub}>{r.changedFields.join(', ') || '—'}</td>
                    <td>{r.reason ?? '—'}</td>
                    <td className={`${s.sub} mono`}>{r.ipAddress ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
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
