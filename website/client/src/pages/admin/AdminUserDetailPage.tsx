import { type AdminUserDetailDto } from '@mediconnect/shared';
import { t } from '../../i18n';
import { ROLE_LABEL, USER_STATUS_LABEL } from '../../i18n/labels';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import { ApiClientError } from '../../api/client';
import { useApi } from '../../api/hooks';
import { Alert, Field, Modal } from '../../components/forms';
import { Badge, Button, ButtonLink, EmptyState, ErrorState, Skeleton } from '../../components/ui';
import { useToast } from '../../components/Toast';
import s from '../../features/clinicAdmin/clinicAdmin.module.css';
import { formatDate, formatDateTime } from '../../lib/format';
import { USER_TONE } from './AdminUsersPage';

// UC-902 — hesab detalı: metadata, aktiv sessiyalar, statistika, audit tarixçəsi (tibbi məzmun yoxdur — BR-902-02).
// Əməliyyatlar səbəb tələb edir (BR-902-03): blokla / blokdan çıxar, sessiyaları bağla, anonimləşdir (silmə).

type Op = 'BLOCK' | 'UNBLOCK' | 'REVOKE_SESSIONS' | 'ANONYMIZE';
const OP_LABEL: Record<Op, string> = { BLOCK: t('admUser.BLOCK'), UNBLOCK: t('admUser.UNBLOCK'), REVOKE_SESSIONS: t('admUser.REVOKE_SESSIONS'), ANONYMIZE: t('admUser.ANONYMIZE') };
const OP_HINT: Record<Op, string> = {
  BLOCK: t('admUser.hBLOCK'),
  UNBLOCK: t('admUser.hUNBLOCK'),
  REVOKE_SESSIONS: t('admUser.hREVOKE_SESSIONS'),
  ANONYMIZE: t('admUser.hANONYMIZE'),
};

export function AdminUserDetailPage() {
  const { userId = '' } = useParams();
  const toast = useToast();
  const q = useApi((sig) => adminApi.user(userId, sig), [userId]);
  const [op, setOp] = useState<Op | null>(null);

  if (q.error?.errorType === 'NotFound')
    return (
      <div className="card">
        <EmptyState title={t('adm.noUser')} action={<ButtonLink to="/admin/users">{t('panel.admin.users')}</ButtonLink>} />
      </div>
    );
  if (q.error) return <ErrorState message={q.error.message} onRetry={q.reload} />;
  if (!q.data) return <Skeleton height={480} radius={18} />;
  const u = q.data;

  return (
    <div className={s.stack}>
      <nav style={{ fontSize: 13, color: 'var(--muted)' }}>
        <Link to="/admin/users" style={{ color: 'var(--muted)' }}>
          {t('panel.admin.users')}
        </Link>{' '}
        · {u.fullName}
      </nav>
      <div className={s.sectionHead}>
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>
            {u.fullName}
          </h1>
          <div className="ink-soft" style={{ marginTop: 4 }}>
            {ROLE_LABEL[u.role]} · <Badge tone={USER_TONE[u.status]}>{USER_STATUS_LABEL[u.status]}</Badge>
          </div>
        </div>
        <div className={s.actions}>
          {u.allowedActions.map((a) => (
            <Button key={a} variant={a === 'UNBLOCK' ? 'primary' : a === 'REVOKE_SESSIONS' ? 'ghost' : 'danger'} onClick={() => setOp(a)}>
              {OP_LABEL[a]}
            </Button>
          ))}
        </div>
      </div>
      {u.warnings.map((w) => (
        <Alert key={w} tone="warning">
          {w}
        </Alert>
      ))}
      {u.blockedReason && <Alert tone="error">{t('admUser.blockedReason', { reason: u.blockedReason })}</Alert>}

      <div className={s.twoCol}>
        <section className={s.section}>
          <h2 className={s.sectionTitle}>{t('admUser.account')}</h2>
          <div className={s.ro}>
            {(
              [
                ['FIN', u.fin],
                [t('auth.phone'), u.mobileNumber],
                ['Email', u.email ?? '—'],
                [t('auth.birthDate'), u.status === 'DELETED' ? '—' : formatDate(u.birthDate)],
                [t('adm.registered'), formatDateTime(u.createdAt)],
                [t('adm.lastLogin'), u.lastLoginAt ? formatDateTime(u.lastLoginAt) : '—'],
                [t('admUser.failedAttempts'), String(u.failedLoginAttempts)],
                [t('admUser.lock'), u.lockedUntil && new Date(u.lockedUntil).getTime() > Date.now() ? t('docRx.until', { date: formatDateTime(u.lockedUntil) }) : '—'],
                [t('booking.clinic'), u.clinics.join(', ') || '—'],
              ] as const
            ).map(([k, v]) => (
              <div key={k}>
                <div className={s.roLabel}>{k}</div>
                <div className={s.roValue}>{v}</div>
              </div>
            ))}
          </div>
          {u.stats.length > 0 && (
            <>
              <div className={s.roLabel}>{t('admUser.stats')}</div>
              <div className={s.stats}>
                {u.stats.map((x) => (
                  <div key={x.label} className={s.stat}>
                    <div className={s.statValue} style={{ fontSize: typeof x.value === 'number' ? 26 : 15 }}>
                      {x.value}
                    </div>
                    <div className={s.statLabel}>{x.label}</div>
                  </div>
                ))}
              </div>
            </>
          )}
          <p className="muted" style={{ fontSize: 13, margin: 0 }}>
            {t('admUser.noMedical')}
          </p>
        </section>

        <section className={s.section}>
          <h2 className={s.sectionTitle}>{t('admUser.sessions', { n: u.sessions.length })}</h2>
          {u.sessions.length === 0 ? (
            <span className="muted">{t('admUser.noSessions')}</span>
          ) : (
            <div className={s.list}>
              {u.sessions.map((x) => (
                <div key={x.sessionId} className={s.row}>
                  <span>
                    {x.deviceInfo ?? t('settings.unknownDevice')}
                    <div className={s.sub}>
                      {t('admUser.opened', { ip: x.ipAddress ?? '—', date: formatDateTime(x.createdAt) })}
                    </div>
                  </span>
                  <span className={s.sub}>{t('admUser.last', { date: formatDateTime(x.lastSeenAt) })}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className={s.section}>
        <h2 className={s.sectionTitle}>{t('admUser.auditHistory')}</h2>
        {u.audit.length === 0 ? (
          <span className="muted">{t('docAppt.noNote')}</span>
        ) : (
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>{t('audit.time')}</th>
                  <th>{t('audit.action')}</th>
                  <th>{t('audit.entity')}</th>
                  <th>{t('admUser.who')}</th>
                  <th>{t('docRx.reason')}</th>
                </tr>
              </thead>
              <tbody>
                {u.audit.map((a, i) => (
                  <tr key={i}>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatDateTime(a.createdAt)}</td>
                    <td className="mono" style={{ fontSize: 12 }}>
                      {a.action}
                    </td>
                    <td>{a.entityType}</td>
                    <td>{a.byUser ? t('admUser.self') : a.actorName}</td>
                    <td>{a.reason ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {op && <OpDialog u={u} op={op} onClose={() => setOp(null)} onDone={(d) => (q.setData(d), setOp(null), toast.success(t('admClinic.actionDone', { action: OP_LABEL[op] })))} />}
    </div>
  );
}

function OpDialog({ u, op, onClose, onDone }: { u: AdminUserDetailDto; op: Op; onClose: () => void; onDone: (d: AdminUserDetailDto) => void }) {
  const [reason, setReason] = useState('');
  const [need, setNeed] = useState<null | 'appointments' | 'soleAdmin'>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    setError(null);
    const r = reason.trim();
    const extra = { ...(need === 'appointments' ? { conflictResolution: 'CANCEL_AND_NOTIFY' as const } : {}), ...(need === 'soleAdmin' ? { confirm: true } : {}) };
    try {
      if (op === 'BLOCK' || op === 'UNBLOCK') onDone(await adminApi.setUserStatus(u.userId, { status: op === 'BLOCK' ? 'BLOCKED' : 'VERIFIED', reason: r, ...extra }));
      else if (op === 'REVOKE_SESSIONS') onDone(await adminApi.revokeSessions(u.userId, r));
      else onDone(await adminApi.anonymize(u.userId, { reason: r, ...(need === 'appointments' ? { conflictResolution: 'CANCEL_AND_NOTIFY' as const } : {}) }));
    } catch (e) {
      const x = e as ApiClientError;
      if (x.errorType === 'HasActiveAppointments') setNeed('appointments');
      else if (x.errorType === 'Conflict' && x.details?.soleAdmin) setNeed('soleAdmin');
      setError(x.message);
    } finally {
      setBusy(false);
    }
  };
  const danger = op === 'BLOCK' || op === 'ANONYMIZE';
  return (
    <Modal
      open
      title={`${OP_LABEL[op]} — ${u.fullName}`}
      onClose={onClose}
      actions={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} loading={busy} disabled={reason.trim().length < 5} onClick={() => void submit()}>
            {need === 'appointments' ? t('admUser.cancelAndGo') : need === 'soleAdmin' ? t('admUser.blockAnyway') : OP_LABEL[op]}
          </Button>
        </>
      }
    >
      <p className="ink-soft" style={{ marginTop: 0 }}>
        {OP_HINT[op]}
      </p>
      <Field label={t('admUser.reasonRequired')} htmlFor="op-reason">
        <textarea id="op-reason" className="input" rows={3} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} />
      </Field>
      {error && <Alert tone={need ? 'warning' : 'error'}>{error}</Alert>}
    </Modal>
  );
}
