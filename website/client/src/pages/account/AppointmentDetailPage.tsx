import { type AppointmentDto, type SlotDto, type SlotLockDto } from '@mediconnect/shared';
import { t } from '../../i18n';
import { Rich } from '../../i18n/Rich';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { appointmentsApi, downloadAuthorized } from '../../api/appointments';
import { documentsApi } from '../../api/documents';
import { ApiClientError, serverNow } from '../../api/client';
import { useApi } from '../../api/hooks';
import { searchApi } from '../../api/search';
import { Alert, Modal, useCountdown } from '../../components/forms';
import { Avatar, Button, ButtonLink, EmptyState, ErrorState, Skeleton } from '../../components/ui';
import { useToast } from '../../components/Toast';
import { BLOCKED_TEXT, StatusBadge } from '../../features/appointments/status';
import s from '../../features/appointments/appointments.module.css';
import { mapsDirectionsUrl } from '../../features/directory/MapEmbed';
import { SlotPicker } from '../../features/directory/SlotPicker';
import d from '../../features/directory/directory.module.css';
import { formatCountdown, formatDate, formatDateTime } from '../../lib/format';

// UC-404 detal + UC-402 ləğv + UC-403 köçürmə (pasient). Əməliyyat düymələri server `allowedActions`-a görədir (FR-404-12).

const CANCELLED_BY: Record<string, string> = { PATIENT: t('apptDetail.byPATIENT'), DOCTOR: t('apptDetail.byDOCTOR'), CLINIC_ADMIN: t('apptDetail.byCLINIC_ADMIN'), SUPER_ADMIN: t('apptDetail.bySUPER_ADMIN'), SYSTEM: t('apptDetail.bySYSTEM') };
const CANCEL_REASONS = [t('apptDetail.r1'), t('apptDetail.r2'), t('apptDetail.r3'), t('apptDetail.r4')];

export function AppointmentDetailPage() {
  const { appointmentId = '' } = useParams();
  const q = useApi((sig) => appointmentsApi.get(appointmentId, sig), [appointmentId]);
  if (q.error?.errorType === 'NotFound')
    return (
      <div className="card">
        <EmptyState title={t('apptDetail.notFound')} action={<ButtonLink to="/account/appointments">{t('panel.patient.appointments')}</ButtonLink>} />
      </div>
    );
  if (q.error) return <ErrorState message={q.error.message} onRetry={q.reload} />;
  if (!q.data) return <Skeleton height={420} radius={18} />;
  return <Detail a={q.data} onChange={(x) => q.setData(x)} />;
}

function Detail({ a, onChange }: { a: AppointmentDto; onChange: (a: AppointmentDto) => void }) {
  const toast = useToast();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [docsOpen, setDocsOpen] = useState(false);
  const [responding, setResponding] = useState(false);
  const can = (x: AppointmentDto['allowedActions'][number]) => a.allowedActions.includes(x);

  const respond = async (accept: boolean) => {
    setResponding(true);
    try {
      onChange(await appointmentsApi.respondReschedule(a.appointmentId, accept));
      toast.success(accept ? t('apptDetail.newTimeOk') : t('apptDetail.cancelled'));
    } catch (e) {
      toast.error(t('common.failed'), (e as Error).message);
    } finally {
      setResponding(false);
    }
  };

  return (
    <div>
      <nav className={d.crumbs} style={{ marginTop: 0 }}>
        <Link to="/account/appointments">{t('panel.patient.appointments')}</Link> · {a.bookingReference}
      </nav>
      <div className={s.detailGrid}>
        <section className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <Avatar name={a.doctor.fullName} src={a.doctor.photoUrl} size={64} />
              <div>
                <h1 style={{ fontSize: 24, fontWeight: 700 }}>
                  <Link to={`/doctors/${a.doctor.doctorId}`} style={{ color: 'var(--ink)' }}>
                    {a.doctor.fullName}
                  </Link>
                </h1>
                <div className="muted" style={{ fontSize: 14, marginTop: 4 }}>
                  {a.doctor.specialties.join(', ')}
                </div>
              </div>
            </div>
            <StatusBadge status={a.status} />
          </div>

          {a.pendingReschedule && (
            <div style={{ marginTop: 18 }}>
              <Alert tone="warning">
                <div>
                  <Rich
                    text={t(a.pendingReschedule.requestedByRole === 'DOCTOR' ? 'apptDetail.proposeDoctor' : 'apptDetail.proposeClinic')}
                    b={`${formatDateTime(a.pendingReschedule.newStartAt)}${a.pendingReschedule.newDoctorName ? ` (${t('apptDetail.newDoctor', { name: a.pendingReschedule.newDoctorName })})` : ''}`}
                  />
                  <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
                    <Button size="small" loading={responding} onClick={() => void respond(true)}>
                      {t('apptDetail.acceptNew')}
                    </Button>
                    <Button size="small" variant="ghost" disabled={responding} onClick={() => void respond(false)}>
                      {t('apptDetail.declineCancel')}
                    </Button>
                  </div>
                </div>
              </Alert>
            </div>
          )}

          <div className={s.rows} style={{ marginTop: 18 }}>
            <div className={s.row}>
              <span>{t('apptDetail.dateTime')}</span>
              <span>
                {formatDate(a.slotDate)}, {a.startTime}–{a.endTime}
              </span>
            </div>
            <div className={s.row}>
              <span>{t('booking.stepService')}</span>
              <span>
                {a.service.name} · {t('common.minShort', { n: a.service.durationMinutes })}
              </span>
            </div>
            <div className={s.row}>
              <span>{t('booking.clinic')}</span>
              <span>
                <Link to={`/clinics/${a.clinic.clinicId}`}>{a.clinic.name}</Link>
                <br />
                {a.clinic.address}
                {a.clinic.roomNumber && `, ${t('booking.room', { n: a.clinic.roomNumber })}`}
                <br />
                <a href={`tel:${a.clinic.phone}`}>{a.clinic.phone}</a>
              </span>
            </div>
            {a.patientNote && (
              <div className={s.row}>
                <span>{t('apptDetail.yourComplaint')}</span>
                <span>{a.patientNote}</span>
              </div>
            )}
            {a.doctorNote && (
              <div className={s.row}>
                <span>{t('apptDetail.doctorNote')}</span>
                <span>{a.doctorNote}</span>
              </div>
            )}
            {a.rescheduleCount > 0 && (
              <div className={s.row}>
                <span>{t('apptDetail.reschedules')}</span>
                <span>{t('apptDetail.times', { n: a.rescheduleCount })}</span>
              </div>
            )}
            {a.status === 'CANCELLED' && (
              <div className={s.row}>
                <span>{t('apptDetail.cancellation')}</span>
                <span>
                  {CANCELLED_BY[a.cancelledByRole ?? 'SYSTEM']} · {a.cancelledAt && formatDateTime(a.cancelledAt)}
                  <br />
                  <span className="muted">{a.cancellationReason}</span>
                </span>
              </div>
            )}
            {a.documents.length > 0 && (
              <div className={s.row}>
                <span>{t('apptDetail.sharedDocs')}</span>
                <span>{a.documents.map((x) => x.fileName).join(', ')}</span>
              </div>
            )}
            {a.prescriptions.length > 0 && (
              <div className={s.row}>
                <span>{t('acc.rxTitle')}</span>
                <span>
                  {a.prescriptions.map((p) => (
                    <Link key={p.prescriptionId} to={`/account/prescriptions/${p.prescriptionId}`} style={{ display: 'block' }}>
                      {p.prescriptionNumber ?? t('docs.tlPRESCRIPTION')}
                    </Link>
                  ))}
                </span>
              </div>
            )}
          </div>
          <p className="muted" style={{ fontSize: 13, marginBottom: 0 }}>
            {t('common.priceNote')}.
          </p>
        </section>

        <aside className="card">
          <div className={s.qr}>
            <div className="muted" style={{ fontSize: 13, fontWeight: 600 }}>
              {t('apptDetail.refNumber')}
            </div>
            <div className={s.bigRef}>{a.bookingReference}</div>
            {(a.status === 'CONFIRMED' || a.status === 'PENDING') && (
              <div className={s.qrBox}>
                <QRCodeSVG value={a.bookingReference} size={140} />
              </div>
            )}
          </div>
          <div className={s.actionsCol}>
            {can('RESCHEDULE') && (
              <Button variant="secondary" block onClick={() => setMoveOpen(true)}>
                {t('apptDetail.changeTime')}
              </Button>
            )}
            {can('CANCEL') && (
              <Button variant="ghost" block onClick={() => setCancelOpen(true)}>
                {t('apptDetail.cancelAppt')}
              </Button>
            )}
            {can('ADD_DOCUMENTS') && (
              <Button variant="ghost" block onClick={() => setDocsOpen(true)}>
                {t('apptDetail.addDoc')}
              </Button>
            )}
            {can('ADD_TO_CALENDAR') && (
              <Button variant="ghost" block onClick={() => downloadAuthorized(`/v1/appointments/${a.appointmentId}/calendar.ics`, `randevu-${a.bookingReference}.ics`).catch((e) => toast.error((e as Error).message))}>
                {t('booking.addCalendar')}
              </Button>
            )}
            {can('DIRECTIONS') && a.clinic.latitude !== null && a.clinic.longitude !== null && (
              <a className="ink-soft" style={{ textAlign: 'center', fontWeight: 600, fontSize: 14 }} href={mapsDirectionsUrl(a.clinic.latitude, a.clinic.longitude)} target="_blank" rel="noopener noreferrer">
                {t('detail.directions')}
              </a>
            )}
            {can('REVIEW') && (
              <ButtonLink to={`/account/appointments/${a.appointmentId}/review`} block>
                {t('appt.writeReview')}
              </ButtonLink>
            )}
            {Object.entries(a.blockedReasons).map(([k, v]) => (
              <p key={k} className={s.blocked}>
                {BLOCKED_TEXT[v] ?? v}
              </p>
            ))}
          </div>
        </aside>
      </div>

      <CancelDialog open={cancelOpen} a={a} onClose={() => setCancelOpen(false)} onDone={onChange} />
      {moveOpen && <RescheduleDialog a={a} onClose={() => setMoveOpen(false)} onDone={onChange} />}
      {docsOpen && <AttachDocsDialog a={a} onClose={() => setDocsOpen(false)} onDone={onChange} />}
    </div>
  );
}

function CancelDialog({ open, a, onClose, onDone }: { open: boolean; a: AppointmentDto; onClose: () => void; onDone: (a: AppointmentDto) => void }) {
  const toast = useToast();
  const [choice, setChoice] = useState<string>(CANCEL_REASONS[0]);
  const [other, setOther] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const reason = choice === 'OTHER' ? other.trim() : choice;

  const submit = async () => {
    setPending(true);
    setError(null);
    try {
      onDone(await appointmentsApi.cancel(a.appointmentId, reason));
      toast.success(t('apptDetail.cancelled'), t('apptDetail.cancelledBody'));
      onClose();
    } catch (e) {
      setError((e as ApiClientError).fieldErrors.reason ?? (e as Error).message);
    } finally {
      setPending(false);
    }
  };

  return (
    <Modal
      open={open}
      title={t('apptDetail.cancelTitle')}
      onClose={onClose}
      actions={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common.back')}
          </Button>
          <Button variant="danger" loading={pending} disabled={reason.length < 3} onClick={() => void submit()}>
            {t('apptDetail.cancelBtn')}
          </Button>
        </>
      }
    >
      {a.doctor.fullName}, {formatDate(a.slotDate)} {a.startTime}. {t('apptDetail.pickReason')}
      <div className={s.radios} role="radiogroup">
        {[...CANCEL_REASONS, 'OTHER'].map((r) => (
          <label key={r} className={s.radio}>
            <input type="radio" name="reason" checked={choice === r} onChange={() => setChoice(r)} />
            {r === 'OTHER' ? t('apptDetail.other') : r}
          </label>
        ))}
      </div>
      {choice === 'OTHER' && <textarea className="input" rows={3} maxLength={500} value={other} onChange={(e) => setOther(e.target.value)} placeholder={t('apptDetail.writeReason')} autoFocus />}
      {error && (
        <div style={{ marginTop: 12 }}>
          <Alert tone="error">{error}</Alert>
        </div>
      )}
    </Modal>
  );
}

function RescheduleDialog({ a, onClose, onDone }: { a: AppointmentDto; onClose: () => void; onDone: (a: AppointmentDto) => void }) {
  const toast = useToast();
  const doctor = useApi((sig) => searchApi.doctor(a.doctor.doctorId, sig), [a.doctor.doctorId]);
  // Yalnız eyni xidməti göstərən klinikalar (UC-403 alt 2: başqa klinikaya köçürmə).
  const clinics = doctor.data?.clinics.filter((c) => c.services.some((sv) => sv.serviceId === a.service.serviceId)) ?? [];
  const [clinicId, setClinicId] = useState(a.clinic.clinicId);
  const [picked, setPicked] = useState<{ slot: SlotDto; date: string; lock: SlotLockDto } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const left = useCountdown(picked?.lock.lockedUntil);

  useEffect(() => {
    if (picked && new Date(picked.lock.lockedUntil).getTime() <= serverNow()) {
      setPicked(null);
      setRefreshKey((k) => k + 1);
      setError(t('apptDetail.lockLost'));
    }
  }, [left, picked]);

  const close = () => {
    if (picked) void appointmentsApi.unlock(picked.slot.slotId).catch(() => undefined);
    onClose();
  };

  const pick = async (slot: SlotDto, date: string) => {
    setError(null);
    try {
      const lock = await appointmentsApi.lock(slot.slotId, a.service.serviceId);
      setPicked({ slot, date, lock });
    } catch (e) {
      setError((e as Error).message);
      setRefreshKey((k) => k + 1);
    }
  };

  const submit = async () => {
    if (!picked) return;
    setPending(true);
    try {
      onDone(await appointmentsApi.reschedule(a.appointmentId, picked.slot.slotId));
      toast.success(t('apptDetail.moved'), t('apptDetail.movedBody'));
      onClose();
    } catch (e) {
      setError((e as Error).message);
      setPicked(null);
      setRefreshKey((k) => k + 1);
    } finally {
      setPending(false);
    }
  };

  const target = clinics.find((c) => c.clinicId === clinicId);

  return (
    <Modal
      open
      title={t('apptDetail.moveTitle')}
      onClose={close}
      actions={
        <>
          <Button variant="ghost" onClick={close}>
            {t('common.cancel')}
          </Button>
          <Button loading={pending} disabled={!picked} onClick={() => void submit()}>
            {t('common.confirm')}
          </Button>
        </>
      }
    >
      <div style={{ minWidth: 'min(560px, 80vw)' }}>
        <Rich text={t('apptDetail.current')} b={`${formatDate(a.slotDate)}, ${a.startTime}`} /> {t('apptDetail.moveCount', { n: a.rescheduleCount })}
        {clinics.length > 1 && (
          <div className={d.clinicTabs} style={{ marginTop: 14 }}>
            {clinics.map((c) => (
              <button
                key={c.clinicId}
                type="button"
                className={d.seg}
                aria-pressed={c.clinicId === clinicId}
                onClick={() => {
                  if (picked) void appointmentsApi.unlock(picked.slot.slotId).catch(() => undefined);
                  setPicked(null);
                  setClinicId(c.clinicId);
                }}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
        {clinicId !== a.clinic.clinicId && target && <p className="field-hint">{t('apptDetail.newClinic', { address: target.address })}</p>}
        <div style={{ marginTop: 14 }}>
          {doctor.data ? (
            <SlotPicker doctorId={a.doctor.doctorId} clinicId={clinicId} serviceId={a.service.serviceId} days={14} selectedSlotId={picked?.slot.slotId} onPick={(sl, date) => void pick(sl, date)} refreshKey={refreshKey} />
          ) : (
            <Skeleton height={140} />
          )}
        </div>
        {picked && (
          <div className={s.move}>
            <del>
              {formatDate(a.slotDate)} {a.startTime}
            </del>
            →
            <strong>
              {formatDate(picked.date)} {picked.slot.startTime}
            </strong>
            <span className="muted" style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)' }}>
              {formatCountdown(left)}
            </span>
          </div>
        )}
        {error && (
          <div style={{ marginTop: 12 }}>
            <Alert tone="error">{error}</Alert>
          </div>
        )}
      </div>
    </Modal>
  );
}

/** FR-404-15: yaxınlaşan randevuya sənəd əlavə etmək — həkimə avtomatik müddətli icazə. */
function AttachDocsDialog({ a, onClose, onDone }: { a: AppointmentDto; onClose: () => void; onDone: (a: AppointmentDto) => void }) {
  const toast = useToast();
  const docs = useApi((sig) => documentsApi.list({ archived: 'false' }, sig), []);
  const attached = new Set(a.documents.map((d) => d.documentId));
  const [ids, setIds] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const submit = async () => {
    setPending(true);
    try {
      await documentsApi.attachToAppointment(a.appointmentId, ids);
      onDone(await appointmentsApi.get(a.appointmentId));
      toast.success(t('apptDetail.docsAdded'), t('apptDetail.docsAddedBody', { name: a.doctor.fullName }));
      onClose();
    } catch (e) {
      toast.error(t('common.failed'), (e as Error).message);
    } finally {
      setPending(false);
    }
  };
  return (
    <Modal
      open
      title={t('apptDetail.attachTitle')}
      onClose={onClose}
      actions={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button loading={pending} disabled={!ids.length} onClick={() => void submit()}>
            {t('common.add')}
          </Button>
        </>
      }
    >
      {docs.error ? (
        <Alert tone="warning">{docs.error.message}</Alert>
      ) : !docs.data ? (
        <Skeleton height={100} />
      ) : docs.data.length === 0 ? (
        <span>
          {t('apptDetail.noDocs')} <Link to="/account/documents">{t('apptDetail.uploadDoc')}</Link>.
        </span>
      ) : (
        <div className={s.radios}>
          {docs.data.map((d) => (
            <label key={d.documentId} className={s.radio}>
              <input type="checkbox" disabled={attached.has(d.documentId)} checked={attached.has(d.documentId) || ids.includes(d.documentId)} onChange={(e) => setIds((x) => (e.target.checked ? [...x, d.documentId] : x.filter((y) => y !== d.documentId)))} />
              {d.fileName}
              {attached.has(d.documentId) && <span className="muted">{t('apptDetail.alreadyAdded')}</span>}
            </label>
          ))}
        </div>
      )}
    </Modal>
  );
}
