import { useApi } from '../../api/hooks';
import { t } from '../../i18n';
import { prescriptionsApi } from '../../api/prescriptions';
import { Alert, Modal } from '../../components/forms';
import { Button, Skeleton } from '../../components/ui';

// FR-602-12 — dərman haqqında ümumi məlumat (məlumatlandırma, tibbi məsləhət deyil).

export function DrugInfoDialog({ drugId, onClose }: { drugId: string; onClose: () => void }) {
  const q = useApi((sig) => prescriptionsApi.drug(drugId, sig), [drugId]);
  const d = q.data;
  return (
    <Modal open title={d ? d.tradeName : t('rx.drug')} onClose={onClose} actions={<Button onClick={onClose}>{t('common.close')}</Button>}>
      {q.error && <Alert tone="error">{q.error.message}</Alert>}
      {!d && !q.error && <Skeleton height={100} />}
      {d && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="ink-soft" style={{ fontSize: 14 }}>
            {[d.genericName, d.form, d.strength, d.drugClass].filter(Boolean).join(' · ')}
          </div>
          <p style={{ margin: 0, lineHeight: 1.55 }}>{d.patientInfo ?? t('rx.noInfo')}</p>
          <Alert tone="info">{t('rx.notAdvice')}</Alert>
        </div>
      )}
    </Modal>
  );
}
