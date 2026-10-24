import { ACCESS_DURATION, type GrantDto } from '@mediconnect/shared';
import { t } from '../../i18n';
import { ACCESS_DURATION_LABEL, DOCUMENT_CATEGORY_LABEL } from '../../i18n/labels';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { serverNow } from '../../api/client';
import { documentsApi } from '../../api/documents';
import { useApi } from '../../api/hooks';
import { ConfirmDialog, Modal } from '../../components/forms';
import { Badge, Button, EmptyState, ErrorState, Skeleton } from '../../components/ui';
import { useToast } from '../../components/Toast';
import a from '../../features/appointments/appointments.module.css';
import { formatDateTime } from '../../lib/format';

// UC-502 alt 1/2/4 — paylaşımlar: aktiv icazələr, qalan vaxt (FR-502-16), baxış sayı (FR-502-18), ləğv, uzatma.

function remaining(iso: string) {
  const ms = new Date(iso).getTime() - serverNow();
  if (ms <= 0) return t('shares.ended');
  const h = Math.floor(ms / 3_600_000);
  return h >= 48 ? t('shares.daysLeft', { n: Math.floor(h / 24) }) : h >= 1 ? t('shares.hoursLeft', { n: h }) : t('shares.minLeft', { n: Math.max(1, Math.floor(ms / 60_000)) });
}

const TONE = { ACTIVE: 'success', EXPIRED: 'neutral', REVOKED: 'danger' } as const;
const LABEL = { ACTIVE: t('shares.ACTIVE'), EXPIRED: t('shares.EXPIRED'), REVOKED: t('shares.REVOKED') } as const;

export function SharesPage() {
  const toast = useToast();
  const [tab, setTab] = useState<'ACTIVE' | 'ALL'>('ACTIVE');
  const q = useApi((sig) => documentsApi.grants(tab === 'ACTIVE' ? 'ACTIVE' : undefined, sig), [tab]);
  const [revoking, setRevoking] = useState<GrantDto | null>(null);
  const [extending, setExtending] = useState<GrantDto | null>(null);
  const [duration, setDuration] = useState('SEVEN_DAYS');

  const run = async (fn: () => Promise<unknown>, msg: string) => {
    try {
      await fn();
      toast.success(msg);
      q.reload();
    } catch (e) {
      toast.error(t('common.failed'), (e as Error).message);
    }
  };

  return (
    <div>
      <h1 className="page-title">{t('panel.patient.shares')}</h1>
      <p className="ink-soft" style={{ marginTop: -10 }}>
        {t('shares.lead')}
      </p>
      <div className={a.tabs} role="tablist">
        <button type="button" role="tab" className={a.tab} aria-selected={tab === 'ACTIVE'} onClick={() => setTab('ACTIVE')}>
          {t('shares.ACTIVE')}
        </button>
        <button type="button" role="tab" className={a.tab} aria-selected={tab === 'ALL'} onClick={() => setTab('ALL')}>
          {t('shares.all')}
        </button>
      </div>
      {q.error && <ErrorState message={q.error.message} onRetry={q.reload} />}
      {!q.data && !q.error && <Skeleton height={200} radius={18} />}
      {q.data && q.data.length === 0 && (
        <div className="card">
          <EmptyState title={t('shares.empty')} action={<Link to="/account/documents">{t('shares.goDocs')}</Link>} />
        </div>
      )}
      <div className={a.list}>
        {q.data?.map((g) => (
          <article key={g.grantId} className={a.card}>
            <div className={a.cardGrid}>
              <div>
                <h3 className={a.title}>{g.documentName}</h3>
                <div className={a.meta}>
                  {DOCUMENT_CATEGORY_LABEL[g.category]} · {g.doctorName}
                  {g.viaAppointment && t('shares.viaAppt')}
                </div>
                <div className={a.place}>
                  {t('shares.granted', { date: formatDateTime(g.grantedAt) })} · {ACCESS_DURATION_LABEL[g.accessDuration]}
                  <br />
                  {g.status === 'ACTIVE' ? t('shares.ends', { date: formatDateTime(g.expiresAt), left: remaining(g.expiresAt) }) : g.revokedAt ? t('shares.revokedAt', { date: formatDateTime(g.revokedAt) }) : t('shares.endedAt', { date: formatDateTime(g.expiresAt) })}
                  <br />
                  {t('shares.viewCount', { n: g.viewCount })}
                  {g.lastViewedAt && t('shares.lastView', { date: formatDateTime(g.lastViewedAt) })}
                </div>
              </div>
              <Badge tone={TONE[g.status]}>{LABEL[g.status]}</Badge>
            </div>
            {g.status !== 'REVOKED' && (
              <div className={a.actions}>
                <Button size="small" variant="ghost" onClick={() => (setDuration('SEVEN_DAYS'), setExtending(g))}>
                  {g.status === 'ACTIVE' ? t('docPage.extend') : t('shares.reopen')}
                </Button>
                {g.status === 'ACTIVE' && (
                  <Button size="small" variant="danger" onClick={() => setRevoking(g)}>
                    {t('shares.revoke')}
                  </Button>
                )}
              </div>
            )}
          </article>
        ))}
      </div>

      <ConfirmDialog
        open={!!revoking}
        danger
        title={t('shares.revokeTitle')}
        body={t('shares.revokeBody', { doctor: revoking?.doctorName ?? '', doc: revoking?.documentName ?? '' })}
        confirmLabel={t('apptDetail.cancelBtn')}
        onClose={() => setRevoking(null)}
        onConfirm={() => {
          const g = revoking!;
          setRevoking(null);
          void run(() => documentsApi.revokeGrant(g.grantId), t('shares.revoked'));
        }}
      />
      <Modal
        open={!!extending}
        title={t('shares.durationTitle')}
        onClose={() => setExtending(null)}
        actions={
          <>
            <Button variant="ghost" onClick={() => setExtending(null)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={() => {
                const g = extending!;
                setExtending(null);
                void run(() => documentsApi.extendGrant(g.grantId, duration), t('shares.renewed'));
              }}
            >
              {t('common.save')}
            </Button>
          </>
        }
      >
        {t('shares.fromNow')}
        <select className="input" style={{ marginTop: 12 }} value={duration} onChange={(e) => setDuration(e.target.value)}>
          {ACCESS_DURATION.map((d) => (
            <option key={d} value={d}>
              {ACCESS_DURATION_LABEL[d]}
            </option>
          ))}
        </select>
      </Modal>
    </div>
  );
}
