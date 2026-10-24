import { type UserRole, type UserStatus } from '@mediconnect/shared';
import { t } from '../../i18n';
import { ROLE_LABEL, USER_STATUS_LABEL } from '../../i18n/labels';
import { Link, useSearchParams } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import { useApi } from '../../api/hooks';
import { Badge, Button, EmptyState, ErrorState, Skeleton, type Tone } from '../../components/ui';
import s from '../../features/clinicAdmin/clinicAdmin.module.css';
import { formatDate, formatDateTime } from '../../lib/format';

// UC-902 — bütün istifadəçilər: rol, status, klinika, qeydiyyat tarixi filtri; FIN/telefon/ad axtarışı (alt 1).

export const USER_TONE: Record<UserStatus, Tone> = { PENDING_VERIFICATION: 'accent', VERIFIED: 'success', SUSPENDED: 'warning', BLOCKED: 'danger', DELETED: 'neutral' };
const SIZE = 25;

export function AdminUsersPage() {
  const [params, setParams] = useSearchParams();
  const f = Object.fromEntries(['role', 'status', 'clinicId', 'q', 'from', 'to', 'page'].map((k) => [k, params.get(k) ?? '']));
  const set = (k: string, v: string) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v);
    else next.delete(k);
    if (k !== 'page') next.delete('page');
    setParams(next, { replace: true });
  };
  const clinics = useApi((sig) => adminApi.clinics({}, sig), []);
  const q = useApi(
    (sig) => adminApi.users({ role: f.role || undefined, status: f.status || undefined, clinicId: f.clinicId || undefined, q: f.q || undefined, from: f.from || undefined, to: f.to || undefined, page: Number(f.page || 1), size: SIZE }, sig),
    [params.toString()],
  );
  const page = Number(f.page || 1);
  const pages = q.data ? Math.max(1, Math.ceil(q.data.totalCount / SIZE)) : 1;

  return (
    <div>
      <h1 className="page-title">{t('panel.admin.users')}</h1>
      <div className={s.toolbar}>
        <label style={{ flex: 1, minWidth: 220 }}>
          {t('ca.searchAria')}
          <input
            type="search"
            className="input"
            style={{ width: '100%' }}
            placeholder={t('adm.userSearchPh')}
            defaultValue={f.q}
            onKeyDown={(e) => e.key === 'Enter' && set('q', (e.target as HTMLInputElement).value.trim())}
          />
        </label>
        <label>
          {t('adm.role')}
          <select className="input" value={f.role} onChange={(e) => set('role', e.target.value)}>
            <option value="">{t('shares.all')}</option>
            {(Object.keys(ROLE_LABEL) as UserRole[]).map((r) => (
              <option key={r} value={r}>
                {ROLE_LABEL[r]}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t('ca.status')}
          <select className="input" value={f.status} onChange={(e) => set('status', e.target.value)}>
            <option value="">{t('shares.all')}</option>
            {(Object.keys(USER_STATUS_LABEL) as UserStatus[]).map((st) => (
              <option key={st} value={st}>
                {USER_STATUS_LABEL[st]}
              </option>
            ))}
            <option value="DELETION_REQUESTED">{t('adm.deletionRequested')}</option>
          </select>
        </label>
        <label>
          {t('booking.clinic')}
          <select className="input" value={f.clinicId} onChange={(e) => set('clinicId', e.target.value)}>
            <option value="">{t('shares.all')}</option>
            {clinics.data?.map((c) => (
              <option key={c.clinicId} value={c.clinicId}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t('adm.regFrom')}
          <input type="date" className="input" value={f.from} onChange={(e) => set('from', e.target.value)} />
        </label>
        <label>
          {t('adm.regTo')}
          <input type="date" className="input" value={f.to} onChange={(e) => set('to', e.target.value)} />
        </label>
      </div>
      {q.error && <ErrorState message={q.error.message} onRetry={q.reload} />}
      {!q.data && !q.error && <Skeleton height={320} radius={16} />}
      {q.data && q.data.users.length === 0 && (
        <div className="card">
          <EmptyState title={t('adm.noUser')} />
        </div>
      )}
      {q.data && q.data.users.length > 0 && (
        <>
          <div className={s.sub} style={{ marginBottom: 8 }}>
            {t('adm.usersCount', { n: q.data.totalCount })}
          </div>
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>{t('adm.name')}</th>
                  <th>{t('adm.role')}</th>
                  <th>{t('auth.phone')}</th>
                  <th>{t('ca.status')}</th>
                  <th>{t('adm.registered')}</th>
                  <th>{t('adm.lastLogin')}</th>
                </tr>
              </thead>
              <tbody>
                {q.data.users.map((u) => (
                  <tr key={u.userId}>
                    <td className={s.nameCell}>
                      <div>
                        <Link to={`/admin/users/${u.userId}`}>{u.fullName}</Link>
                        <div className={s.sub}>
                          FIN {u.fin}
                          {u.clinics.length > 0 && ` · ${u.clinics.join(', ')}`}
                        </div>
                      </div>
                    </td>
                    <td>{ROLE_LABEL[u.role]}</td>
                    <td className="mono">{u.mobileNumber}</td>
                    <td>
                      <Badge tone={USER_TONE[u.status]}>{USER_STATUS_LABEL[u.status]}</Badge>
                      {u.deletionRequested && <div className={s.warnText} style={{ fontSize: 12 }}>{t('adm.deletionShort')}</div>}
                    </td>
                    <td>{formatDate(u.createdAt)}</td>
                    <td>{u.lastLoginAt ? formatDateTime(u.lastLoginAt) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {pages > 1 && (
        <div className={s.actions} style={{ marginTop: 12, justifyContent: 'center', alignItems: 'center' }}>
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
