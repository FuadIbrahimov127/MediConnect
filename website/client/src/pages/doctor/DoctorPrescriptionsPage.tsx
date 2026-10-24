import type { PrescriptionTab, RenewalRequestDto } from '@mediconnect/shared';
import { t } from '../../i18n';
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useApi } from '../../api/hooks';
import { prescriptionsApi } from '../../api/prescriptions';
import { Field, Modal } from '../../components/forms';
import { Badge, Button, EmptyState, ErrorState, Skeleton } from '../../components/ui';
import { useToast } from '../../components/Toast';
import a from '../../features/appointments/appointments.module.css';
import { StatusBadge } from '../../features/prescriptions/PrescriptionView';
import s from '../../features/prescriptions/prescriptions.module.css';
import { formatDate, formatDateTime } from '../../lib/format';

// UC-601 — həkimin yazdığı reseptlər (yalnız özününkü) + təkrar resept sorğuları (UC-602 alt 2, BR-602-07).

type Tab = PrescriptionTab | 'RENEWALS';
const TABS: [Tab, string][] = [
  ['ACTIVE', t('acc.rxActive')],
  ['DRAFT', t('docRx.drafts')],
  ['RENEWALS', t('docRx.renewals')],
  ['PAST', t('acc.tabPast')],
  ['CANCELLED', t('acc.tabCancelled')],
];

export function DoctorPrescriptionsPage() {
  const [params, setParams] = useSearchParams();
  const tab = (TABS.some(([k]) => k === params.get('tab')) ? params.get('tab') : 'ACTIVE') as Tab;
  const list = useApi((sig) => prescriptionsApi.list(tab === 'RENEWALS' ? 'ACTIVE' : tab, sig), [tab]);
  const renewals = useApi((sig) => prescriptionsApi.renewals(undefined, sig), []);
  const pendingCount = renewals.data?.filter((r) => r.status === 'PENDING').length ?? 0;

  return (
    <div>
      <h1 className="page-title">{t('panel.doctor.prescriptions')}</h1>
      <div className={a.tabs} role="tablist">
        {TABS.map(([k, label]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} className={a.tab} onClick={() => setParams(k === 'ACTIVE' ? {} : { tab: k }, { replace: true })}>
            {label}
            {k === 'RENEWALS' ? pendingCount > 0 && <span className={a.tabCount}>{pendingCount}</span> : list.data && <span className={a.tabCount}>{list.data.counts[k]}</span>}
          </button>
        ))}
      </div>
      {tab === 'RENEWALS' ? (
        <Renewals q={renewals} />
      ) : (
        <>
          {list.error && <ErrorState message={list.error.message} onRetry={list.reload} />}
          {!list.data && !list.error && <Skeleton height={180} radius={16} />}
          {list.data && list.data.prescriptions.length === 0 && (
            <div className="card">
              <EmptyState title={t('docRx.empty')} body={t('docRx.emptyBody')} />
            </div>
          )}
          <div className={s.cards}>
            {list.data?.prescriptions.map((p) => (
              <Link
                key={p.prescriptionId}
                to={p.status === 'DRAFT' ? `/doctor/appointments/${p.appointmentId}/prescription?id=${p.prescriptionId}` : `/doctor/prescriptions/${p.prescriptionId}`}
                className={s.card}
              >
                <div>
                  <div className={s.cardTitle}>{p.prescriptionNumber ?? t('rx.draft')}</div>
                  <div className={s.cardMeta}>
                    {p.patientName} · {formatDate(p.date)} · {p.clinicName}
                  </div>
                  <div className={s.cardMeta}>{t('acc.medsCount', { n: p.medicationCount })}</div>
                </div>
                <div className={s.cardRight}>
                  <StatusBadge status={p.status} />
                  {p.validUntil && p.status === 'SIGNED' && <span>{t('docRx.until', { date: formatDate(p.validUntil) })}</span>}
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Renewals({ q }: { q: ReturnType<typeof useApi<RenewalRequestDto[]>> }) {
  const toast = useToast();
  const navigate = useNavigate();
  const [rejecting, setRejecting] = useState<RenewalRequestDto | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  if (q.error) return <ErrorState message={q.error.message} onRetry={q.reload} />;
  if (!q.data) return <Skeleton height={180} radius={16} />;
  if (q.data.length === 0)
    return (
      <div className="card">
        <EmptyState title={t('docRx.noRenewals')} body={t('docRx.noRenewalsBody')} />
      </div>
    );

  const approve = async (r: RenewalRequestDto) => {
    setBusy(r.requestId);
    try {
      const res = await prescriptionsApi.resolveRenewal(r.requestId, { decision: 'APPROVE' });
      toast.success(t('docRx.approved'), t('docRx.approvedBody'));
      navigate(`/doctor/appointments/${res.newAppointmentId}/prescription?id=${res.newPrescriptionId}`);
    } catch (e) {
      toast.error(t('common.failed'), (e as Error).message);
    } finally {
      setBusy(null);
    }
  };
  const reject = async () => {
    if (!rejecting) return;
    setBusy(rejecting.requestId);
    try {
      await prescriptionsApi.resolveRenewal(rejecting.requestId, { decision: 'REJECT', reason: reason.trim() });
      toast.success(t('docRx.rejected'), t('docRx.rejectedBody'));
      setRejecting(null);
      setReason('');
      q.reload();
    } catch (e) {
      toast.error(t('common.failed'), (e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className={s.cards}>
      {q.data.map((r) => (
        <div key={r.requestId} className={s.card}>
          <div>
            <div style={{ fontWeight: 700 }}>{r.patientName}</div>
            <div className={s.cardMeta}>
              <Link to={`/doctor/prescriptions/${r.prescriptionId}`}>{r.prescriptionNumber}</Link> · {r.medications.join(', ')}
            </div>
            <div className={s.cardMeta}>{formatDateTime(r.createdAt)}</div>
            {r.note && <div style={{ fontSize: 14, marginTop: 6 }}>“{r.note}”</div>}
            {r.status === 'REJECTED' && <div className={s.cardMeta}>{t('docRx.rejectReason', { reason: r.reason ?? '' })}</div>}
          </div>
          <div className={s.cardRight}>
            {r.status === 'PENDING' ? (
              <>
                <Button size="small" loading={busy === r.requestId} onClick={() => void approve(r)}>
                  {t('docRx.approveWrite')}
                </Button>
                <Button size="small" variant="ghost" onClick={() => setRejecting(r)}>
                  {t('docAppt.reject')}
                </Button>
              </>
            ) : (
              <>
                <Badge tone={r.status === 'APPROVED' ? 'success' : 'danger'}>{r.status === 'APPROVED' ? t('docRx.statusApproved') : t('docRx.statusRejected')}</Badge>
                {r.newPrescriptionId && <Link to={`/doctor/prescriptions/${r.newPrescriptionId}`}>{t('docRx.newRx')}</Link>}
              </>
            )}
          </div>
        </div>
      ))}
      <Modal
        open={!!rejecting}
        title={t('docRx.rejectTitle')}
        onClose={() => setRejecting(null)}
        actions={
          <>
            <Button variant="ghost" onClick={() => setRejecting(null)}>
              {t('common.cancel')}
            </Button>
            <Button variant="danger" loading={!!busy} disabled={reason.trim().length < 5} onClick={() => void reject()}>
              {t('docAppt.reject')}
            </Button>
          </>
        }
      >
        <Field label={t('docRx.reasonShown')} htmlFor="rej" hint={t('docRx.reasonShownHint')}>
          <textarea id="rej" className="input" rows={3} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t('docRx.reasonPh')} />
        </Field>
      </Modal>
    </div>
  );
}
