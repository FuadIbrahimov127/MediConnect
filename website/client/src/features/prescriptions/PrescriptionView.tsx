import { type PrescriptionDto, type PrescriptionStatus } from '@mediconnect/shared';
import { t } from '../../i18n';
import { PRESCRIPTION_STATUS_LABEL } from '../../i18n/labels';
import { Alert } from '../../components/forms';
import { Badge, type Tone } from '../../components/ui';
import { formatDate, formatDateTime } from '../../lib/format';
import s from './prescriptions.module.css';

// Reseptin "kağız" görünüşü — pasient detalı, həkim detalı, imza önizləməsi və çap üçün eyni komponent.

export const STATUS_TONE: Record<PrescriptionStatus, Tone> = { DRAFT: 'neutral', SIGNED: 'success', EXPIRED: 'warning', CANCELLED: 'danger', DISPENSED: 'accent' };
export const GENDER_LABEL = { MALE: t('rx.male'), FEMALE: t('rx.female') } as const;

export function StatusBadge({ status }: { status: PrescriptionStatus }) {
  return <Badge tone={STATUS_TONE[status]}>{PRESCRIPTION_STATUS_LABEL[status]}</Badge>;
}

export function PrescriptionView({ p, onDrugInfo, showOverrides }: { p: PrescriptionDto; onDrugInfo?: (drugId: string) => void; showOverrides?: boolean }) {
  return (
    <article className={s.paper} aria-label={`Resept ${p.prescriptionNumber ?? ''}`}>
      <header className={s.paperHead}>
        <div>
          <div className={s.kicker}>{t('rx.eRx')}</div>
          <div className={s.number}>{p.prescriptionNumber ?? t('rx.draft')}</div>
        </div>
        <StatusBadge status={p.status} />
      </header>

      {p.status === 'EXPIRED' && <Alert tone="warning">{t('rx.expiredAlert')}</Alert>}
      {p.status === 'CANCELLED' && (
        <Alert tone="error">
          {t('rx.cancelledAlert')}{p.cancelledAt ? ` (${formatDateTime(p.cancelledAt)})` : ''}. {t('common.reasonColon', { reason: p.cancelledReason ?? '' })}
        </Alert>
      )}
      {p.status === 'DRAFT' && <Alert tone="info">{t('rx.draftAlert')}</Alert>}

      <div className={s.parties}>
        <div>
          <div className={s.label}>{t('rx.patient')}</div>
          <div className={s.value}>{p.patient.fullName}</div>
          <div className={s.sub}>
            FIN {p.patient.fin} · {t('common.age', { n: p.patient.age })} · {GENDER_LABEL[p.patient.gender]}
          </div>
        </div>
        <div>
          <div className={s.label}>{t('booking.doctor')}</div>
          <div className={s.value}>{p.doctor.fullName}</div>
          <div className={s.sub}>
            {p.doctor.specialties.join(', ')} · {t('rx.license', { n: p.doctor.licenseNumber })}
          </div>
        </div>
        <div>
          <div className={s.label}>{t('booking.clinic')}</div>
          <div className={s.value}>{p.clinic.name}</div>
          <div className={s.sub}>{p.clinic.address}</div>
        </div>
        <div>
          <div className={s.label}>{t('rx.dateValidity')}</div>
          <div className={s.value}>{p.signedAt ? formatDate(p.signedAt) : formatDate(p.createdAt)}</div>
          <div className={s.sub}>{p.validUntil ? t('rx.validUntil', { date: formatDate(p.validUntil) }) : t('rx.validDays', { n: p.validDays })}</div>
        </div>
      </div>

      <div className={s.diagnosis}>
        <div className={s.label}>{t('rx.diagnosis')}</div>
        <div className={s.value}>
          {p.diagnosis || '—'}
          {p.icd10Code && <span className={s.icd}>ICD-10 {p.icd10Code}</span>}
        </div>
      </div>

      <div>
        <div className={s.label} style={{ marginBottom: 10 }}>
          {t('rx.medications', { n: p.medications.length })}
        </div>
        <ol className={s.meds} style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {p.medications.map((m, i) => (
            <li key={i} className={s.med}>
              <span className={s.medNo}>{i + 1}</span>
              <div>
                <div className={s.medName}>
                  {m.drugId && onDrugInfo ? (
                    <button type="button" onClick={() => onDrugInfo(m.drugId!)} title={t('rx.drugInfo')}>
                      {m.name}
                    </button>
                  ) : (
                    m.name
                  )}
                  {m.form && <span className="muted" style={{ fontSize: 13, fontWeight: 500 }}>{m.form}</span>}
                  {m.isControlled && <Badge tone="warning">{t('rx.controlled')}</Badge>}
                  {!m.drugId && <Badge tone="neutral">{t('rx.manual')}</Badge>}
                </div>
                <div className={s.medDose}>
                  {m.dosage} · {m.frequency}
                  {m.durationDays ? ` · ${t('common.days', { n: m.durationDays })}` : ''}
                </div>
                {m.instructions && <div className={s.medNote}>{m.instructions}</div>}
                {showOverrides && m.warningOverridden && <div className={s.override}>{t('rx.overridden', { reason: m.overrideReason ?? '' })}</div>}
              </div>
            </li>
          ))}
        </ol>
      </div>

      {p.generalNotes && (
        <div>
          <div className={s.label}>{t('rx.generalNotes')}</div>
          <div style={{ whiteSpace: 'pre-line' }}>{p.generalNotes}</div>
        </div>
      )}

      {p.signedAt && (
        <footer className={s.signature}>
          {p.signatureValid ? <span className={s.sigOk}>{t('rx.sigOk')}</span> : <span className={s.sigBad}>{t('rx.sigBad')}</span>}
          <span>
            {p.doctor.fullName} · {formatDateTime(p.signedAt)}
          </span>
        </footer>
      )}
    </article>
  );
}

