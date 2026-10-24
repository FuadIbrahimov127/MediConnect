import { useState } from 'react';
import { t } from '../../i18n';
import { Link, useParams } from 'react-router-dom';
import { useApi } from '../../api/hooks';
import { prescriptionsApi } from '../../api/prescriptions';
import { Field, Modal } from '../../components/forms';
import { Button, ButtonLink, EmptyState, ErrorState, Skeleton } from '../../components/ui';
import { useToast } from '../../components/Toast';
import { PrescriptionView } from '../../features/prescriptions/PrescriptionView';
import s from '../../features/prescriptions/prescriptions.module.css';

// UC-601 — həkimin öz reseptinə baxışı: imzalanmış resept redaktə olunmur (BR-601-04), səhv olarsa ləğv edilib
// yenisi yazılır (BR-601-05). Ötürülmüş xəbərdarlıqlar və səbəbləri həkimə görünür (BR-601-09).

export function DoctorPrescriptionDetailPage() {
  const { prescriptionId = '' } = useParams();
  const toast = useToast();
  const q = useApi((sig) => prescriptionsApi.get(prescriptionId, sig), [prescriptionId]);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  if (q.error?.errorType === 'NotFound')
    return (
      <div className="card">
        <EmptyState title={t('rxDetail.notFound')} action={<ButtonLink to="/doctor/prescriptions">{t('panel.doctor.prescriptions')}</ButtonLink>} />
      </div>
    );
  if (q.error) return <ErrorState message={q.error.message} onRetry={q.reload} />;
  if (!q.data) return <Skeleton height={520} radius={18} />;
  const p = q.data;
  const can = (x: (typeof p.allowedActions)[number]) => p.allowedActions.includes(x);

  const cancel = async () => {
    setBusy(true);
    try {
      q.setData(await prescriptionsApi.cancel(p.prescriptionId, reason.trim()));
      toast.success(t('docRx.cancelled'), p.status === 'SIGNED' ? t('docRx.patientNotified') : undefined);
      setCancelOpen(false);
    } catch (e) {
      toast.error(t('common.failed'), (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <nav className={s.noPrint} style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 18 }}>
        <Link to="/doctor/prescriptions" style={{ color: 'var(--muted)' }}>
          {t('panel.doctor.prescriptions')}
        </Link>{' '}
        · {p.prescriptionNumber ?? t('rx.draft')}
      </nav>
      <div className={s.layout}>
        <PrescriptionView p={p} showOverrides />
        <aside className={`${s.side} ${s.noPrint}`}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {can('EDIT') && (
              <ButtonLink to={`/doctor/appointments/${p.appointmentId}/prescription?id=${p.prescriptionId}`} block>
                {t('docRx.continueEdit')}
              </ButtonLink>
            )}
            {can('DOWNLOAD_PDF') && (
              <Button block variant="secondary" onClick={() => void prescriptionsApi.pdf(p).catch((e: Error) => toast.error(t('rxDetail.pdfFailed'), e.message))}>
                {t('rxDetail.pdf')}
              </Button>
            )}
            {p.signedAt && (
              <Button block variant="ghost" onClick={() => window.print()}>
                {t('rxDetail.print')}
              </Button>
            )}
            <ButtonLink to={`/doctor/appointments/${p.appointmentId}`} block variant="ghost">
              {t('rxDetail.goAppt')}
            </ButtonLink>
            {can('CANCEL') && (
              <Button block variant="danger" onClick={() => setCancelOpen(true)}>
                {p.status === 'DRAFT' ? t('rxEdit.discard') : t('docRx.cancelRx')}
              </Button>
            )}
          </div>
          {can('COPY') && (
            <p className="muted" style={{ fontSize: 13, margin: 0 }}>
              {t('docRx.copyHint')}
            </p>
          )}
        </aside>
      </div>
      <Modal
        open={cancelOpen}
        title={t('docRx.cancelRx')}
        onClose={() => setCancelOpen(false)}
        actions={
          <>
            <Button variant="ghost" onClick={() => setCancelOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="danger" loading={busy} disabled={reason.trim().length < 5} onClick={() => void cancel()}>
              {t('apptDetail.cancelBtn')}
            </Button>
          </>
        }
      >
        <p className="ink-soft" style={{ marginTop: 0 }}>
          {t('docRx.cancelLead')} {p.status === 'SIGNED' && t('docRx.cancelLeadSigned')}
        </p>
        <Field label={t('docRx.reason')} htmlFor="cxl">
          <textarea id="cxl" className="input" rows={3} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t('docRx.cancelPh')} />
        </Field>
      </Modal>
    </div>
  );
}
