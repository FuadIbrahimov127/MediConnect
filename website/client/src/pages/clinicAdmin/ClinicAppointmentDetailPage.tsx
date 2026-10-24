import type { AppointmentDto, SlotDto } from '@mediconnect/shared';
import { t } from '../../i18n';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { appointmentsApi } from '../../api/appointments';
import { useApi } from '../../api/hooks';
import { Alert, Field, Modal } from '../../components/forms';
import { Button, ButtonLink, EmptyState, ErrorState, Skeleton } from '../../components/ui';
import { useToast } from '../../components/Toast';
import a from '../../features/appointments/appointments.module.css';
import { BLOCKED_TEXT, StatusBadge } from '../../features/appointments/status';
import { SlotPicker } from '../../features/directory/SlotPicker';
import { formatDate, formatDateTime, formatTime } from '../../lib/format';

// UC-805 — randevunun əməliyyat detalları (tibbi məzmun istisna — BR-805-02): ləğv, vaxt dəyişikliyi təklifi,
// no-show və 24 saat ərzində düzəlişi (BR-805-06). Keçmiş randevuda düymələr yoxdur (EF-805-3).

const BY_ROLE: Record<string, string> = { PATIENT: t('rx.patient'), DOCTOR: t('apptDetail.byDOCTOR'), CLINIC_ADMIN: t('apptDetail.byCLINIC_ADMIN'), SUPER_ADMIN: t('apptDetail.bySUPER_ADMIN'), SYSTEM: t('apptDetail.bySYSTEM') };
type Dialog = null | 'cancel' | 'move' | 'noshow' | 'revert';

export function ClinicAppointmentDetailPage() {
  const { appointmentId = '' } = useParams();
  const q = useApi((sig) => appointmentsApi.get(appointmentId, sig), [appointmentId]);
  if (q.error?.errorType === 'NotFound')
    return (
      <div className="card">
        <EmptyState title={t('apptDetail.notFound')} body={t('caAppt.notOurs')} action={<ButtonLink to="/clinic-admin/appointments">{t('panel.clinicAdmin.appointments')}</ButtonLink>} />
      </div>
    );
  if (q.error) return <ErrorState message={q.error.message} onRetry={q.reload} />;
  if (!q.data) return <Skeleton height={420} radius={18} />;
  return <Detail ap={q.data} onChange={q.setData} />;
}

function Detail({ ap, onChange }: { ap: AppointmentDto; onChange: (a: AppointmentDto) => void }) {
  const toast = useToast();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [reason, setReason] = useState('');
  const [moveTo, setMoveTo] = useState<{ slot: SlotDto; date: string } | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const can = (x: AppointmentDto['allowedActions'][number]) => ap.allowedActions.includes(x);

  const run = async (fn: () => Promise<AppointmentDto>, ok: string) => {
    setPending(true);
    setError(null);
    try {
      onChange(await fn());
      toast.success(ok);
      setDialog(null);
      setReason('');
      setMoveTo(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  };
  const open = (d: Dialog) => (setError(null), setDialog(d));

  return (
    <div>
      <nav style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 18 }}>
        <Link to="/clinic-admin/appointments" style={{ color: 'var(--muted)' }}>
          {t('panel.clinicAdmin.appointments')}
        </Link>{' '}
        · {ap.bookingReference}
      </nav>
      <div className={a.detailGrid}>
        <section className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div>
              <div className="eyebrow">{t('review.appointment')}</div>
              <div className={a.bigRef}>{ap.bookingReference}</div>
            </div>
            <StatusBadge status={ap.status} />
          </div>
          <div className={a.rows} style={{ marginTop: 18 }}>
            {(
              [
                [t('rx.patient'), ap.patient?.fullName ?? '—'],
                [t('booking.doctor'), ap.doctor.fullName],
                [t('booking.stepService'), `${ap.service.name} · ${t('caAppt.minDot', { n: ap.service.durationMinutes })}`],
                [t('apptDetail.dateTime'), `${formatDate(ap.startAt)}, ${formatTime(ap.startAt)}–${ap.endTime}`],
                [t('ca.room'), ap.clinic.roomNumber ?? '—'],
                [t('caAppt.created'), formatDateTime(ap.createdAt)],
                [t('apptDetail.reschedules'), t('apptDetail.times', { n: ap.rescheduleCount })],
              ] as const
            ).map(([k, v]) => (
              <div key={k} className={a.row}>
                <span>{k}</span>
                <span>{v}</span>
              </div>
            ))}
            {ap.status === 'CANCELLED' && (
              <div className={a.row}>
                <span>{t('apptDetail.cancellation')}</span>
                <span>
                  {BY_ROLE[ap.cancelledByRole ?? 'SYSTEM']} · {ap.cancelledAt ? formatDateTime(ap.cancelledAt) : ''}
                  <div className={a.reason}>{ap.cancellationReason}</div>
                </span>
              </div>
            )}
          </div>
          {ap.pendingReschedule && (
            <div className={a.notice}>
              {t('caAppt.proposalWait', { date: formatDate(ap.pendingReschedule.newDate), time: ap.pendingReschedule.newTime })}
              {ap.pendingReschedule.newDoctorName && ` — ${ap.pendingReschedule.newDoctorName}`}.
            </div>
          )}
          <p className="muted" style={{ fontSize: 13, marginBottom: 0, marginTop: 16 }}>
            {t('caAppt.privacy')}
          </p>
        </section>

        <aside className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <strong>{t('caAppt.actions')}</strong>
          {can('RESCHEDULE') && (
            <Button block onClick={() => open('move')}>
              {t('docAppt.proposeMove')}
            </Button>
          )}
          {can('NO_SHOW') && (
            <Button block variant="ghost" onClick={() => open('noshow')}>
              {t('docAppt.markNoShow')}
            </Button>
          )}
          {can('REVERT_NO_SHOW') && (
            <Button block variant="ghost" onClick={() => open('revert')}>
              {t('caAppt.revertNoShow')}
            </Button>
          )}
          {can('CANCEL') && (
            <Button block variant="danger" onClick={() => open('cancel')}>
              {t('apptDetail.cancelBtn')}
            </Button>
          )}
          {!ap.allowedActions.length && <span className="muted" style={{ fontSize: 14 }}>{t('caAppt.noActions')}</span>}
          {Object.entries(ap.blockedReasons).map(([k, v]) => (
            <p key={k} className={a.blocked}>
              {BLOCKED_TEXT[v] ?? v}
            </p>
          ))}
          <ButtonLink to={`/clinic-admin/doctors/${ap.doctor.doctorId}/schedule`} block variant="ghost">
            {t('caAppt.doctorSchedule')}
          </ButtonLink>
        </aside>
      </div>

      <Modal
        open={dialog === 'cancel'}
        title={t('caAppt.cancelTitle')}
        onClose={() => setDialog(null)}
        actions={
          <>
            <Button variant="ghost" onClick={() => setDialog(null)}>
              {t('common.cancel')}
            </Button>
            <Button variant="danger" loading={pending} disabled={reason.trim().length < 5} onClick={() => void run(() => appointmentsApi.cancel(ap.appointmentId, reason.trim()), t('apptDetail.cancelled'))}>
              {t('apptDetail.cancelBtn')}
            </Button>
          </>
        }
      >
        <p className="ink-soft" style={{ marginTop: 0 }}>
          {t('caAppt.cancelHint')}
        </p>
        <Field label={t('docRx.reason')} htmlFor="cx-reason">
          <input id="cx-reason" className="input" value={reason} maxLength={300} onChange={(e) => setReason(e.target.value)} />
        </Field>
        {error && <Alert tone="error">{error}</Alert>}
      </Modal>

      <Modal
        open={dialog === 'move'}
        title={t('docAppt.moveTitle')}
        onClose={() => setDialog(null)}
        actions={
          <>
            <Button variant="ghost" onClick={() => setDialog(null)}>
              {t('common.cancel')}
            </Button>
            <Button loading={pending} disabled={!moveTo} onClick={() => void run(() => appointmentsApi.reschedule(ap.appointmentId, moveTo!.slot.slotId), t('docAppt.proposalSent'))}>
              {t('docAppt.sendProposal')}
            </Button>
          </>
        }
      >
        <p className="ink-soft" style={{ marginTop: 0 }}>
          {t('caAppt.moveHint')}
        </p>
        <SlotPicker doctorId={ap.doctor.doctorId} clinicId={ap.clinic.clinicId} serviceId={ap.service.serviceId} days={14} selectedSlotId={moveTo?.slot.slotId} onPick={(slot, date) => setMoveTo({ slot, date })} />
        {error && <Alert tone="error">{error}</Alert>}
      </Modal>

      <Modal
        open={dialog === 'noshow' || dialog === 'revert'}
        title={dialog === 'noshow' ? t('caAppt.patientNoShow') : t('caAppt.revertNoShow')}
        onClose={() => setDialog(null)}
        actions={
          <>
            <Button variant="ghost" onClick={() => setDialog(null)}>
              {t('common.cancel')}
            </Button>
            <Button
              loading={pending}
              onClick={() =>
                void (dialog === 'noshow'
                  ? run(() => appointmentsApi.noShow(ap.appointmentId), t('caAppt.markedNoShow'))
                  : run(() => appointmentsApi.revertNoShow(ap.appointmentId), t('caAppt.reverted')))
              }
            >
              {t('common.confirm')}
            </Button>
          </>
        }
      >
        <p className="ink-soft" style={{ margin: 0 }}>
          {dialog === 'noshow'
            ? t('caAppt.noShowInfo')
            : t('caAppt.revertInfo')}
        </p>
        {error && <Alert tone="error">{error}</Alert>}
      </Modal>
    </div>
  );
}
