import type { CloseDayPreviewDto } from '@mediconnect/shared';
import { t } from '../../i18n';
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { clinicAdminApi, clinicScheduleApi } from '../../api/clinicAdmin';
import { useApi } from '../../api/hooks';
import { Alert, Field, Modal } from '../../components/forms';
import { Button, ButtonLink, EmptyState, ErrorState, Skeleton } from '../../components/ui';
import { useToast } from '../../components/Toast';
import s from '../../features/clinicAdmin/clinicAdmin.module.css';
import { ScheduleEditor } from '../../features/schedule/ScheduleEditor';
import { formatDate } from '../../lib/format';

// UC-803 — admin həkimin bu klinikadakı cədvəlini görür və redaktə edir (həkim paneli ilə eyni redaktor, BR-803-07:
// başqa klinikadakı cədvəl görünmür). Alt 1/2: təcili gün bağlama — hər randevu üçün ləğv və ya başqa həkimə köçürmə.

export function ClinicDoctorSchedulePage() {
  const { doctorId = '' } = useParams();
  const doctor = useApi((sig) => clinicAdminApi.doctor(doctorId, sig), [doctorId]);
  const profile = useApi((sig) => clinicAdminApi.profile(sig), []);
  const api = useMemo(() => clinicScheduleApi(doctorId), [doctorId]);
  const [closing, setClosing] = useState(false);
  const [key, setKey] = useState(0);

  if (doctor.error?.errorType === 'NotFound')
    return (
      <div className="card">
        <EmptyState title={t('ca.noDoctors')} action={<ButtonLink to="/clinic-admin/doctors">{t('panel.clinicAdmin.doctors')}</ButtonLink>} />
      </div>
    );
  if (doctor.error) return <ErrorState message={doctor.error.message} onRetry={doctor.reload} />;
  if (!doctor.data || !profile.data) return <Skeleton height={420} radius={18} />;
  const d = doctor.data;

  return (
    <div>
      <nav style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 18 }}>
        <Link to="/clinic-admin/doctors" style={{ color: 'var(--muted)' }}>
          {t('panel.clinicAdmin.doctors')}
        </Link>{' '}
        ·{' '}
        <Link to={`/clinic-admin/doctors/${d.doctorId}`} style={{ color: 'var(--muted)' }}>
          {d.fullName}
        </Link>{' '}
        · {t('caSched.crumb')}
      </nav>
      <div className={s.sectionHead} style={{ marginBottom: 18 }}>
        <h1 className="page-title" style={{ margin: 0 }}>
          {t('caSched.title', { name: d.fullName })}
        </h1>
        <Button variant="danger" onClick={() => setClosing(true)}>
          {t('caSched.closeDay')}
        </Button>
      </div>
      <p className="ink-soft" style={{ marginTop: 0 }}>
        {t('caSched.auditHint')}
        {d.otherClinics.length > 0 && t('caSched.otherClinics', { list: d.otherClinics.join(', ') })}
      </p>
      <ScheduleEditor key={key} api={api} clinics={[{ clinicId: profile.data.clinicId, name: profile.data.name }]} role="CLINIC_ADMIN" />
      {closing && <CloseDayDialog doctorId={d.doctorId} doctorName={d.fullName} onClose={() => setClosing(false)} onDone={() => (setClosing(false), setKey((k) => k + 1))} />}
    </div>
  );
}

type Decision = { action: 'CANCEL' | 'TRANSFER'; targetSlotId?: string };

function CloseDayDialog({ doctorId, doctorName, onClose, onDone }: { doctorId: string; doctorName: string; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const [date, setDate] = useState('');
  const [reason, setReason] = useState(t('caSched.defaultReason'));
  const [preview, setPreview] = useState<CloseDayPreviewDto | null>(null);
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setBusy(true);
    try {
      const p = await clinicAdminApi.closeDayPreview(doctorId, date);
      setPreview(p);
      setDecisions(Object.fromEntries(p.appointments.map((a) => [a.appointmentId, { action: 'CANCEL' as const }])));
    } catch (e) {
      toast.error(t('common.failed'), (e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const submit = async () => {
    setBusy(true);
    try {
      const r = await clinicAdminApi.closeDay(doctorId, { date, reason: reason.trim(), decisions: Object.entries(decisions).map(([appointmentId, d]) => ({ appointmentId, ...d })) });
      toast.success(t('caSched.dayClosed'), `${t('caSched.dayClosedBody', { n: r.cancelled })}${r.transferProposed ? t('caSched.transferred', { n: r.transferProposed }) : ''}${t('caSched.notified')}`);
      onDone();
    } catch (e) {
      toast.error(t('common.failed'), (e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const ready = preview && preview.appointments.every((a) => decisions[a.appointmentId]?.action === 'CANCEL' || decisions[a.appointmentId]?.targetSlotId);

  return (
    <Modal
      open
      title={t('caSched.dialogTitle', { name: doctorName })}
      onClose={onClose}
      actions={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          {preview ? (
            <Button variant="danger" loading={busy} disabled={!ready || reason.trim().length < 3} onClick={() => void submit()}>
              {t('caSched.closeBtn')}
            </Button>
          ) : (
            <Button loading={busy} disabled={!date} onClick={() => void load()}>
              {t('caSched.showAppts')}
            </Button>
          )}
        </>
      }
    >
      <div className={s.formGrid}>
        <Field label={t('booking.date')} htmlFor="cd-date">
          <input id="cd-date" type="date" className="input" value={date} onChange={(e) => (setDate(e.target.value), setPreview(null))} />
        </Field>
        <Field label={t('caSched.reasonNotified')} htmlFor="cd-reason">
          <input id="cd-reason" className="input" value={reason} maxLength={300} onChange={(e) => setReason(e.target.value)} />
        </Field>
      </div>
      {preview && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12, maxHeight: '50vh', overflowY: 'auto' }}>
          {preview.appointments.length === 0 ? (
            <Alert tone="info">{t('caSched.noAppts', { date: formatDate(preview.date) })}</Alert>
          ) : (
            preview.appointments.map((a) => {
              const dec = decisions[a.appointmentId];
              const set = (patch: Decision) => setDecisions((x) => ({ ...x, [a.appointmentId]: patch }));
              return (
                <div key={a.appointmentId} className={s.decision}>
                  <div className={s.decisionHead}>
                    <span>
                      {a.startTime} · {a.patientName}
                    </span>
                    <span className={s.sub}>
                      {a.serviceName} · {a.bookingReference}
                    </span>
                  </div>
                  <div className={s.radioRow} role="radiogroup" aria-label={t('caSched.decision', { name: a.patientName })}>
                    <label>
                      <input type="radio" checked={dec?.action === 'CANCEL'} onChange={() => set({ action: 'CANCEL' })} />
                      {t('sched.cancelNotify')}
                    </label>
                    <label>
                      <input type="radio" disabled={!a.transferOptions.length} checked={dec?.action === 'TRANSFER'} onChange={() => set({ action: 'TRANSFER' })} />
                      {t('caSched.transferTo')} {!a.transferOptions.length && <span className="muted">{t('caSched.noSlot')}</span>}
                    </label>
                  </div>
                  {dec?.action === 'TRANSFER' && (
                    <select className="input" value={dec.targetSlotId ?? ''} onChange={(e) => set({ action: 'TRANSFER', targetSlotId: e.target.value || undefined })} aria-label={t('caSched.newDoctorTime')}>
                      <option value="">{t('caSched.pickDoctorTime')}</option>
                      {a.transferOptions.map((o) => (
                        <optgroup key={o.doctorId} label={o.doctorName}>
                          {o.slots.map((sl) => (
                            <option key={sl.slotId} value={sl.slotId}>
                              {o.doctorName} — {sl.startTime}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  )}
                </div>
              );
            })
          )}
          {preview.appointments.some((a) => decisions[a.appointmentId]?.action === 'TRANSFER') && (
            <p className="muted" style={{ fontSize: 13, margin: 0 }}>
              {t('caSched.transferHint')}
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}
