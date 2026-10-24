import { QRCodeSVG } from 'qrcode.react';
import { t } from '../../i18n';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApi } from '../../api/hooks';
import { prescriptionsApi, verifyUrl } from '../../api/prescriptions';
import { Alert, Field, Modal } from '../../components/forms';
import { Button, ButtonLink, EmptyState, ErrorState, Skeleton } from '../../components/ui';
import { useToast } from '../../components/Toast';
import { DrugInfoDialog } from '../../features/prescriptions/DrugInfoDialog';
import { PrescriptionView } from '../../features/prescriptions/PrescriptionView';
import s from '../../features/prescriptions/prescriptions.module.css';
import { formatDateTime } from '../../lib/format';

// UC-602 — reseptin tam detalı, QR doğrulama (FR-602-13), PDF (FR-602-14), dərman məlumatı (FR-602-12),
// təkrar resept sorğusu (FR-602-16). Resept yalnız oxunaqlıdır (BR-602-02) — redaktə elementi yoxdur.

export function PrescriptionDetailPage() {
  const { prescriptionId = '' } = useParams();
  const toast = useToast();
  const q = useApi((sig) => prescriptionsApi.get(prescriptionId, sig), [prescriptionId]);
  const [drugId, setDrugId] = useState<string | null>(null);
  const [renewOpen, setRenewOpen] = useState(false);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  if (q.error?.errorType === 'NotFound')
    return (
      <div className="card">
        <EmptyState title={t('rxDetail.notFound')} action={<ButtonLink to="/account/prescriptions">{t('panel.patient.prescriptions')}</ButtonLink>} />
      </div>
    );
  if (q.error) return <ErrorState message={q.error.message} onRetry={q.reload} />;
  if (!q.data) return <Skeleton height={520} radius={18} />;
  const p = q.data;
  const can = (x: (typeof p.allowedActions)[number]) => p.allowedActions.includes(x);

  const pdf = async () => {
    try {
      await prescriptionsApi.pdf(p);
    } catch (e) {
      toast.error(t('rxDetail.pdfFailed'), (e as Error).message);
    }
  };
  const renew = async () => {
    setBusy(true);
    try {
      q.setData(await prescriptionsApi.requestRenewal(p.prescriptionId, note.trim() || undefined));
      toast.success(t('rxDetail.requestSent'), t('rxDetail.requestSentBody', { name: p.doctor.fullName }));
      setRenewOpen(false);
    } catch (e) {
      toast.error(t('common.failed'), (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <nav className={s.noPrint} style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 18 }}>
        <Link to="/account/prescriptions" style={{ color: 'var(--muted)' }}>
          {t('panel.patient.prescriptions')}
        </Link>{' '}
        · {p.prescriptionNumber}
      </nav>
      <div className={s.layout}>
        <PrescriptionView p={p} onDrugInfo={setDrugId} />
        <aside className={`${s.side} ${s.noPrint}`}>
          {p.qrCodeToken && p.status !== 'CANCELLED' && (
            <div className={`card ${s.qr}`}>
              <strong>{t('rxDetail.showPharmacy')}</strong>
              <div className={s.qrBox}>
                <QRCodeSVG value={verifyUrl(p.qrCodeToken)} size={168} />
              </div>
              <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>
                {t('rxDetail.qrHint')}
              </div>
            </div>
          )}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {can('DOWNLOAD_PDF') && (
              <Button block onClick={() => void pdf()}>
                {t('rxDetail.pdf')}
              </Button>
            )}
            <Button block variant="ghost" onClick={() => window.print()}>
              {t('rxDetail.print')}
            </Button>
            {can('REQUEST_RENEWAL') && (
              <Button block variant="secondary" onClick={() => setRenewOpen(true)}>
                {t('rxDetail.requestRenewal')}
              </Button>
            )}
            <ButtonLink to={`/account/appointments/${p.appointmentId}`} block variant="ghost">
              {t('rxDetail.goAppt')}
            </ButtonLink>
          </div>
          {p.renewal && (
            <Alert tone={p.renewal.status === 'REJECTED' ? 'warning' : p.renewal.status === 'APPROVED' ? 'success' : 'info'}>
              {p.renewal.status === 'PENDING' && t('rxDetail.pending', { date: formatDateTime(p.renewal.createdAt) })}
              {p.renewal.status === 'APPROVED' && t('rxDetail.approved')}
              {p.renewal.status === 'REJECTED' && t('rxDetail.rejected', { reason: p.renewal.reason ?? '' })}
            </Alert>
          )}
        </aside>
      </div>
      {drugId && <DrugInfoDialog drugId={drugId} onClose={() => setDrugId(null)} />}
      <Modal
        open={renewOpen}
        title={t('rxDetail.renewTitle')}
        onClose={() => setRenewOpen(false)}
        actions={
          <>
            <Button variant="ghost" onClick={() => setRenewOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button loading={busy} onClick={() => void renew()}>
              {t('reviewList.send')}
            </Button>
          </>
        }
      >
        <p className="ink-soft" style={{ marginTop: 0 }}>
          {t('rxDetail.renewLead', { name: p.doctor.fullName })}
        </p>
        <Field label={t('rxDetail.noteOptional')} htmlFor="renew-note">
          <textarea id="renew-note" className="input" rows={3} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('rxDetail.notePh')} />
        </Field>
      </Modal>
    </div>
  );
}
