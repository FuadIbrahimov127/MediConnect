import { type AppointmentDto, type PrescriptionStatus, type SlotDto } from '@mediconnect/shared';
import { t } from '../../i18n';
import { ALLERGY_SEVERITY_LABEL, PRESCRIPTION_STATUS_LABEL } from '../../i18n/labels';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { appointmentsApi } from '../../api/appointments';
import { useApi } from '../../api/hooks';
import { Alert, Modal } from '../../components/forms';
import { Avatar, Button, ButtonLink, EmptyState, ErrorState, Skeleton } from '../../components/ui';
import { useToast } from '../../components/Toast';
import { BLOCKED_TEXT, STATUS_LABEL, StatusBadge } from '../../features/appointments/status';
import a from '../../features/appointments/appointments.module.css';
import { SlotPicker } from '../../features/directory/SlotPicker';
import { formatDate, formatDateTime } from '../../lib/format';
import s from './doctor.module.css';

// UC-703 / UC-405 — həkimin randevu ekranı: pasient konteksti (allergiya, xroniki xəstəlik, öz tarixçəsi),
// təsdiq / rədd (səbəb məcburi), ləğv, köçürmə təklifi, tamamlama (müayinə qeydi), gəlmədi, resept yazma keçidi.

const SEVERITY: Record<string, string> = { MILD: ALLERGY_SEVERITY_LABEL.MILD.toLowerCase(), MODERATE: ALLERGY_SEVERITY_LABEL.MODERATE.toLowerCase(), SEVERE: ALLERGY_SEVERITY_LABEL.SEVERE.toLowerCase() };

export function DoctorAppointmentDetailPage() {
  const { appointmentId = '' } = useParams();
  const q = useApi((sig) => appointmentsApi.get(appointmentId, sig), [appointmentId]);
  if (q.error?.errorType === 'NotFound')
    return (
      <div className="card">
        <EmptyState title={t('apptDetail.notFound')} action={<ButtonLink to="/doctor/appointments">{t('panel.doctor.appointments')}</ButtonLink>} />
      </div>
    );
  if (q.error) return <ErrorState message={q.error.message} onRetry={q.reload} />;
  if (!q.data) return <Skeleton height={420} radius={18} />;
  return <Detail ap={q.data} onChange={(x) => q.setData(x)} />;
}

type Dialog = null | 'reject' | 'cancel' | 'complete' | 'move' | 'noshow';

function Detail({ ap, onChange }: { ap: AppointmentDto; onChange: (a: AppointmentDto) => void }) {
  const toast = useToast();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [text, setText] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [moveTo, setMoveTo] = useState<{ slot: SlotDto; date: string } | null>(null);
  const can = (x: AppointmentDto['allowedActions'][number]) => ap.allowedActions.includes(x);
  const ctx = ap.patientContext;

  const run = async (fn: () => Promise<AppointmentDto>, ok: string) => {
    setPending(true);
    setError(null);
    try {
      onChange(await fn());
      toast.success(ok);
      setDialog(null);
      setText('');
      setMoveTo(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  };

  const open = (d: Dialog) => {
    setError(null);
    setText(d === 'complete' ? ap.doctorNote ?? '' : '');
    setDialog(d);
  };

  return (
    <div>
      <nav style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 18 }}>
        <Link to="/doctor/appointments" style={{ color: 'var(--muted)' }}>
          {t('panel.doctor.appointments')}
        </Link>{' '}
        · {ap.bookingReference}
      </nav>
      <div className={a.detailGrid}>
        <section className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <Avatar name={ap.patient?.fullName ?? ''} size={64} />
              <div>
                <h1 style={{ fontSize: 24, fontWeight: 700 }}>{ap.patient?.fullName}</h1>
                <div className="muted" style={{ fontSize: 14, marginTop: 4 }}>
                  {t('common.age', { n: ap.patient?.age ?? '—' })} · {ap.patient?.gender === 'FEMALE' ? t('auth.female') : t('auth.male')}
                  {ctx?.bloodType ? ` · ${t('acc.bloodType', { v: ctx.bloodType })}` : ''}
                </div>
              </div>
            </div>
            <StatusBadge status={ap.status} />
          </div>

          <div className={a.rows} style={{ marginTop: 18 }}>
            <div className={a.row}>
              <span>{t('docAppt.time')}</span>
              <span>
                {formatDate(ap.slotDate)}, {ap.startTime}–{ap.endTime}
              </span>
            </div>
            <div className={a.row}>
              <span>{t('booking.stepService')}</span>
              <span>
                {ap.service.name} · {t('common.minShort', { n: ap.service.durationMinutes })}
              </span>
            </div>
            <div className={a.row}>
              <span>{t('booking.clinic')}</span>
              <span>
                {ap.clinic.name}
                {ap.clinic.roomNumber && `, ${t('booking.room', { n: ap.clinic.roomNumber })}`}
              </span>
            </div>
            <div className={a.row}>
              <span>{t('docAppt.complaintNote')}</span>
              <span>{ap.patientNote ?? <span className="muted">{t('docAppt.noNote')}</span>}</span>
            </div>
            {ap.doctorNote && (
              <div className={a.row}>
                <span>{t('docAppt.examNote')}</span>
                <span>{ap.doctorNote}</span>
              </div>
            )}
            {ap.pendingReschedule && (
              <div className={a.row}>
                <span>{t('docAppt.proposal')}</span>
                <span>{t('docAppt.awaitPatient', { date: formatDateTime(ap.pendingReschedule.newStartAt) })}</span>
              </div>
            )}
            {ap.status === 'CANCELLED' && (
              <div className={a.row}>
                <span>{t('docAppt.cancelReason')}</span>
                <span>{ap.cancellationReason}</span>
              </div>
            )}
          </div>

          {ctx && (
            <div className={s.context} style={{ marginTop: 18 }}>
              <div className={`${s.ctxBlock} ${ctx.allergies.length ? s.allergyBox : ''}`}>
                <div className={s.ctxTitle}>{t('profile.allergies')}</div>
                {ctx.allergies.length ? ctx.allergies.map((x) => `${x.allergenName} (${SEVERITY[x.severity] ?? x.severity})`).join(', ') : t('docAppt.notRecorded')}
              </div>
              {(ctx.chronicConditions.length > 0 || ctx.regularMedications.length > 0) && (
                <div className={s.ctxBlock}>
                  <div className={s.ctxTitle}>{t('docAppt.chronicMeds')}</div>
                  {ctx.chronicConditions.map((c) => `${c.conditionName}${c.icd10Code ? ` (${c.icd10Code})` : ''}`).join(', ') || '—'}
                  {ctx.regularMedications.length > 0 && <div style={{ marginTop: 6 }}>{t('docAppt.meds', { list: ctx.regularMedications.join(', ') })}</div>}
                </div>
              )}
              <div className={s.ctxBlock}>
                <div className={s.ctxTitle}>{t('docAppt.pastWithYou')}</div>
                {ctx.history.length === 0 ? (
                  t('docAppt.firstVisit')
                ) : (
                  <div className={s.hist}>
                    {ctx.history.map((h) => (
                      <div key={h.appointmentId}>
                        <span>
                          {formatDate(h.date)} · {h.serviceName}
                          {h.doctorNote && <span className="muted"> — {h.doctorNote}</span>}
                        </span>
                        <span className="muted">{STATUS_LABEL[h.status as keyof typeof STATUS_LABEL]}</span>
                      </div>
                    ))}
                  </div>
                )}
                {ctx.noShowCount > 0 && <div className="field-hint" style={{ marginTop: 6 }}>{t('docAppt.noShowCount', { n: ctx.noShowCount })}</div>}
                <div className="field-hint" style={{ marginTop: 6 }}>
                  {t('docAppt.privacyHint')}
                </div>
              </div>
              <div className={s.ctxBlock}>
                <div className={s.ctxTitle}>{t('docAppt.sharedDocs')}</div>
                {ap.documents.length ? ap.documents.map((d) => d.fileName).join(', ') : t('docAppt.noDocs')}
                {ap.patient && (
                  <div style={{ marginTop: 8 }}>
                    <Link to={`/doctor/patients/${ap.patient.patientId}/documents`} style={{ fontWeight: 600, color: 'var(--accent)' }}>
                      {t('docAppt.allDocs')}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        <aside className="card">
          <div className={a.actionsCol} style={{ marginTop: 0 }}>
            {can('CONFIRM') && (
              <Button block loading={pending} onClick={() => void run(() => appointmentsApi.confirm(ap.appointmentId), t('docAppt.confirmed'))}>
                {t('common.confirm')}
              </Button>
            )}
            {can('REJECT') && (
              <Button block variant="ghost" onClick={() => open('reject')}>
                {t('docAppt.reject')}
              </Button>
            )}
            {can('COMPLETE') && (
              <Button block onClick={() => open('complete')}>
                {t('docAppt.complete')}
              </Button>
            )}
            {can('NO_SHOW') && (
              <Button block variant="ghost" onClick={() => open('noshow')}>
                {t('appt.NO_SHOW')}
              </Button>
            )}
            {can('WRITE_PRESCRIPTION') && (
              <ButtonLink to={`/doctor/appointments/${ap.appointmentId}/prescription`} block variant="secondary">
                {ap.prescriptions.some((p) => p.status === 'DRAFT') ? t('docAppt.continueDraft') : t('docAppt.writeRx')}
              </ButtonLink>
            )}
            {ap.prescriptions
              .filter((p) => p.status !== 'DRAFT')
              .map((p) => (
                <ButtonLink key={p.prescriptionId} to={`/doctor/prescriptions/${p.prescriptionId}`} block variant="ghost">
                  {p.prescriptionNumber} · {PRESCRIPTION_STATUS_LABEL[p.status as PrescriptionStatus].toLowerCase()}
                </ButtonLink>
              ))}
            {can('RESCHEDULE') && (
              <Button block variant="ghost" onClick={() => open('move')}>
                {t('docAppt.proposeMove')}
              </Button>
            )}
            {can('CANCEL') && (
              <Button block variant="ghost" onClick={() => open('cancel')}>
                {t('apptDetail.cancelBtn')}
              </Button>
            )}
            {Object.entries(ap.blockedReasons).map(([k, v]) => (
              <p key={k} className={a.blocked}>
                {BLOCKED_TEXT[v] ?? v}
              </p>
            ))}
            {ap.allowedActions.length === 0 && <p className={a.blocked}>{t('docAppt.noActions')}</p>}
          </div>
        </aside>
      </div>

      <Modal
        open={dialog === 'reject' || dialog === 'cancel'}
        title={dialog === 'reject' ? t('docAppt.rejectTitle') : t('apptDetail.cancelTitle')}
        onClose={() => setDialog(null)}
        actions={
          <>
            <Button variant="ghost" onClick={() => setDialog(null)}>
              {t('common.back')}
            </Button>
            <Button
              variant="danger"
              loading={pending}
              disabled={text.trim().length < 3}
              onClick={() =>
                void run(() => (dialog === 'reject' ? appointmentsApi.reject(ap.appointmentId, text.trim()) : appointmentsApi.cancel(ap.appointmentId, text.trim())), dialog === 'reject' ? t('docAppt.rejected') : t('apptDetail.cancelled'))
              }
            >
              {dialog === 'reject' ? t('docAppt.reject') : t('apptDetail.cancelBtn')}
            </Button>
          </>
        }
      >
        {t('docAppt.reasonHint')}
        <textarea className="input" rows={3} style={{ marginTop: 12 }} value={text} onChange={(e) => setText(e.target.value)} placeholder={t('docAppt.reasonPh')} autoFocus />
        {error && <Alert tone="error">{error}</Alert>}
      </Modal>

      <Modal
        open={dialog === 'complete'}
        title={t('docAppt.complete')}
        onClose={() => setDialog(null)}
        actions={
          <>
            <Button variant="ghost" onClick={() => setDialog(null)}>
              {t('common.back')}
            </Button>
            <Button loading={pending} onClick={() => void run(() => appointmentsApi.complete(ap.appointmentId, text.trim() || undefined), t('docAppt.completed'))}>
              {t('docAppt.finish')}
            </Button>
          </>
        }
      >
        {t('docAppt.noteHint')}
        <textarea className="input" rows={4} style={{ marginTop: 12 }} value={text} maxLength={2000} onChange={(e) => setText(e.target.value)} />
        {error && <Alert tone="error">{error}</Alert>}
      </Modal>

      <Modal
        open={dialog === 'noshow'}
        title={t('docAppt.noShowTitle')}
        onClose={() => setDialog(null)}
        actions={
          <>
            <Button variant="ghost" onClick={() => setDialog(null)}>
              {t('common.back')}
            </Button>
            <Button variant="danger" loading={pending} onClick={() => void run(() => appointmentsApi.noShow(ap.appointmentId), t('docAppt.noShowSaved'))}>
              {t('docAppt.markNoShow')}
            </Button>
          </>
        }
      >
        {t('docAppt.noShowHint')}
        {error && <Alert tone="error">{error}</Alert>}
      </Modal>

      <Modal
        open={dialog === 'move'}
        title={t('docAppt.moveTitle')}
        onClose={() => setDialog(null)}
        actions={
          <>
            <Button variant="ghost" onClick={() => setDialog(null)}>
              {t('common.back')}
            </Button>
            <Button loading={pending} disabled={!moveTo} onClick={() => void run(() => appointmentsApi.reschedule(ap.appointmentId, moveTo!.slot.slotId), t('docAppt.proposalSent'))}>
              {t('docAppt.sendProposal')}
            </Button>
          </>
        }
      >
        <div style={{ minWidth: 'min(560px, 80vw)' }}>
          {t('docAppt.moveHint')}
          <div style={{ marginTop: 14 }}>
            <SlotPicker doctorId={ap.doctor.doctorId} clinicId={ap.clinic.clinicId} serviceId={ap.service.serviceId} days={14} selectedSlotId={moveTo?.slot.slotId} onPick={(slot, date) => setMoveTo({ slot, date })} />
          </div>
          {moveTo && (
            <div className={a.move}>
              <del>
                {formatDate(ap.slotDate)} {ap.startTime}
              </del>
              → <strong>{formatDate(moveTo.date)} {moveTo.slot.startTime}</strong>
            </div>
          )}
          {error && <Alert tone="error">{error}</Alert>}
        </div>
      </Modal>
    </div>
  );
}
