import { type AppointmentCreatedDto, type DoctorDetailDto, type SlotDto, type SlotLockDto } from '@mediconnect/shared';
import { t } from '../../i18n';
import { DOCUMENT_CATEGORY_LABEL } from '../../i18n/labels';
import { documentsApi } from '../../api/documents';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { appointmentsApi, downloadAuthorized } from '../../api/appointments';
import { ApiClientError, serverNow } from '../../api/client';
import { useApi } from '../../api/hooks';
import { searchApi } from '../../api/search';
import { Alert, useCountdown } from '../../components/forms';
import { Avatar, Button, ButtonLink, EmptyState, Skeleton } from '../../components/ui';
import { useToast } from '../../components/Toast';
import { SlotPicker } from '../../features/directory/SlotPicker';
import d from '../../features/directory/directory.module.css';
import { formatCountdown, formatDate } from '../../lib/format';
import s from './BookingPage.module.css';

// UC-401 — randevu yaratma (prototip "MediConnect Randevu"): klinika + xidmət → vaxt (10 dəq soft lock) → təsdiq.
// Lock-un etibarlılığını server yoxlayır; taymer yalnız göstəricidir.

type Step = 1 | 2 | 3;

export function BookingPage() {
  const { doctorId = '' } = useParams();
  const q = useApi((sig) => searchApi.doctor(doctorId, sig), [doctorId]);
  if (q.error)
    return (
      <div className="container" style={{ paddingTop: 40 }}>
        <div className="card">
          <EmptyState title={t('booking.unavailable')} body={q.error.message} action={<ButtonLink to="/search/doctors">{t('booking.findOther')}</ButtonLink>} />
        </div>
      </div>
    );
  if (!q.data)
    return (
      <div className="container" style={{ paddingTop: 40 }}>
        <Skeleton height={360} radius={18} />
      </div>
    );
  return <Booking doc={q.data} />;
}

function Booking({ doc }: { doc: DoctorDetailDto }) {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [step, setStep] = useState<Step>(1);
  const [clinicId, setClinicId] = useState(() => (doc.clinics.some((c) => c.clinicId === params.get('clinicId')) ? params.get('clinicId')! : doc.clinics.length === 1 ? doc.clinics[0].clinicId : ''));
  const [serviceId, setServiceId] = useState('');
  const [slot, setSlot] = useState<(SlotDto & { date: string }) | null>(null);
  const [lock, setLock] = useState<SlotLockDto | null>(null);
  const [note, setNote] = useState('');
  const [docIds, setDocIds] = useState<string[]>([]);
  // FR-401-23: pasientin sənədləri (razılıq yoxdursa blok gizlənir).
  const myDocs = useApi((sig) => documentsApi.list({ archived: 'false' }, sig), []);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [done, setDone] = useState<AppointmentCreatedDto | null>(null);
  const preselected = useRef(params.get('slotId'));
  const lockRef = useRef<SlotLockDto | null>(null);
  lockRef.current = done ? null : lock;
  const left = useCountdown(lock?.lockedUntil);

  const clinic = doc.clinics.find((c) => c.clinicId === clinicId);
  const service = clinic?.services.find((x) => x.serviceId === serviceId);

  // FR-401-18: səhifədən çıxanda lock dərhal buraxılır.
  useEffect(() => () => void (lockRef.current && appointmentsApi.unlock(lockRef.current.slotId).catch(() => undefined)), []);

  // EF-401-2: lock müddəti bitdi.
  useEffect(() => {
    // Diqqət: `left` yeni lock gələndə bir render gecikir (0 qalır) — müddəti birbaşa server saatı ilə yoxlayırıq.
    if (lock && !done && new Date(lock.lockedUntil).getTime() <= serverNow()) {
      toast.show(t('booking.lockExpired'), t('booking.lockExpiredBody'));
      setLock(null);
      setSlot(null);
      setStep(2);
      setRefreshKey((k) => k + 1);
    }
  }, [left, lock, done, toast]);

  const pick = async (sl: SlotDto, date: string) => {
    setError(null);
    try {
      const l = await appointmentsApi.lock(sl.slotId, serviceId);
      setLock(l);
      setSlot({ ...sl, date });
    } catch (e) {
      const err = e as ApiClientError;
      toast.error(err.errorType === 'SlotUnavailable' ? t('booking.slotTaken') : t('booking.slotNotPicked'), err.message);
      setRefreshKey((k) => k + 1);
    }
  };

  // Həkim profilindən konkret slotla gəlibsə — xidmət seçiləndə həmin slotu tutmağa cəhd et (UC-301 alt 2).
  useEffect(() => {
    if (step !== 2 || !preselected.current || !serviceId) return;
    const id = preselected.current;
    preselected.current = null;
    searchApi
      .slots(doc.doctorId, { clinicId, serviceId, days: 14 })
      .then((r) => {
        for (const day of r.days) {
          const sl = day.slots.find((x) => x.slotId === id);
          if (sl?.available) return pick(sl, day.date);
          if (sl) toast.show(t('booking.slotNotForService'), t('booking.pickOther'));
        }
      })
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, serviceId]);

  const changeSelection = () => {
    if (lock) void appointmentsApi.unlock(lock.slotId).catch(() => undefined);
    setLock(null);
    setSlot(null);
  };

  const confirm = async () => {
    if (!slot || !clinic || !service) return;
    setPending(true);
    setError(null);
    try {
      const res = await appointmentsApi.create({ doctorId: doc.doctorId, clinicId: clinic.clinicId, serviceId: service.serviceId, slotId: slot.slotId, patientNote: note.trim() || null, documentIds: docIds });
      setDone(res);
      window.scrollTo({ top: 0 });
    } catch (e) {
      const err = e as ApiClientError;
      if (err.errorType === 'SlotLockExpired' || err.errorType === 'SlotUnavailable' || err.errorType === 'BookingTooSoon') {
        toast.error(err.message);
        setLock(null);
        setSlot(null);
        setStep(2);
        setRefreshKey((k) => k + 1);
      } else setError(err.message);
    } finally {
      setPending(false);
    }
  };

  if (done) return <Success doc={doc} done={done} />;

  const steps: [Step, string][] = [
    [1, doc.clinics.length > 1 ? t('booking.stepClinicService') : t('booking.stepService')],
    [2, t('booking.stepTime')],
    [3, t('booking.stepConfirm')],
  ];
  const canGo = (st: Step) => st === 1 || (st === 2 && !!service) || (st === 3 && !!lock);

  return (
    <div className="container" style={{ paddingTop: 36 }}>
      <h1 className="page-title">{t('detail.bookCta')}</h1>
      <div className={s.steps}>
        {steps.map(([n, label]) => (
          <button key={n} type="button" className={s.step} aria-current={step === n ? 'step' : undefined} data-done={step > n || undefined} disabled={!canGo(n)} onClick={() => setStep(n)}>
            <span className={s.badge}>{step > n ? '✓' : n}</span>
            {label}
          </button>
        ))}
      </div>

      <div className={s.layout}>
        <div>
          {step === 1 && (
            <section className="card">
              {doc.clinics.length > 1 && (
                <>
                  <h2 className={d.h2} style={{ marginBottom: 4 }}>
                    {t('booking.chooseClinic')}
                  </h2>
                  <p className={d.p}>
                    {t('booking.clinicsLead', { name: doc.fullName, n: doc.clinics.length })}
                  </p>
                  <div className={s.choiceGrid}>
                    {doc.clinics.map((c) => (
                      <button
                        key={c.clinicId}
                        type="button"
                        className={s.choice}
                        aria-pressed={c.clinicId === clinicId}
                        onClick={() => {
                          setClinicId(c.clinicId);
                          setServiceId('');
                          changeSelection();
                        }}
                      >
                        <strong>{c.name}</strong>
                        <span>{c.address}</span>
                        {!c.acceptingAppointments && <span style={{ color: 'var(--danger)' }}>{t('booking.tempNotAccepting')}</span>}
                      </button>
                    ))}
                  </div>
                </>
              )}
              {clinic && (
                <>
                  <h2 className={d.h2} style={{ margin: doc.clinics.length > 1 ? '28px 0 14px' : '0 0 14px' }}>
                    {t('booking.chooseService')}
                  </h2>
                  <div className={s.serviceList}>
                    {clinic.services.map((sv) => (
                      <button
                        key={sv.serviceId}
                        type="button"
                        className={s.service}
                        aria-pressed={sv.serviceId === serviceId}
                        onClick={() => {
                          setServiceId(sv.serviceId);
                          changeSelection();
                        }}
                      >
                        <span>{sv.name}</span>
                        <span className="muted">{t('detail.minutes', { n: sv.durationMinutes })}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
              <div className={s.actions}>
                <Button arrow disabled={!service} onClick={() => setStep(2)}>
                  {t('booking.goTime')}
                </Button>
                {!service && <span className="muted">{clinic ? t('booking.pickService') : t('booking.pickClinic')}</span>}
              </div>
            </section>
          )}

          {step === 2 && clinic && service && (
            <section className="card">
              <h2 className={d.h2} style={{ marginBottom: 4 }}>
                {t('booking.chooseTime')}
              </h2>
              <p className={d.p}>
                {t('booking.timeLead', { clinic: clinic.name, service: service.name, min: service.durationMinutes })}
              </p>
              <SlotPicker doctorId={doc.doctorId} clinicId={clinic.clinicId} serviceId={service.serviceId} days={14} selectedSlotId={slot?.slotId} onPick={(sl, date) => void pick(sl, date)} refreshKey={refreshKey} />
              {lock && slot && (
                <div className={s.hold} role="status">
                  <span>
                    <strong>{formatDate(slot.date)}, {slot.startTime}</strong> {t('booking.heldFor')}
                  </span>
                  <span className={`${s.timer} ${left < 60 ? s.timerLow : ''}`}>{formatCountdown(left)}</span>
                </div>
              )}
              <div className={s.actions}>
                <Button arrow disabled={!lock} onClick={() => setStep(3)}>
                  {t('booking.goConfirm')}
                </Button>
                <button type="button" className={d.reset} onClick={() => setStep(1)}>
                  {t('common.back')}
                </button>
              </div>
            </section>
          )}

          {step === 3 && clinic && service && slot && lock && (
            <section className="card">
              <h2 className={d.h2}>{t('booking.confirmTitle')}</h2>
              <div>
                {[
                  [t('booking.doctor'), doc.fullName],
                  [t('booking.specialty'), doc.specialties.map((x) => x.name).join(', ')],
                  [t('booking.clinic'), clinic.name],
                  [t('booking.address'), `${clinic.address}${clinic.roomNumber ? `, ${t('booking.room', { n: clinic.roomNumber })}` : ''}`],
                  [t('booking.date'), formatDate(slot.date)],
                  [t('booking.hour'), slot.startTime],
                  [t('booking.stepService'), `${service.name} · ${t('detail.minutes', { n: service.durationMinutes })}`],
                ].map(([k, v]) => (
                  <div key={k} className={s.summaryRow}>
                    <span>{k}</span>
                    <span>{v}</span>
                  </div>
                ))}
              </div>
              <div className={s.priceNote}>{t('booking.noPayment')}</div>
              <div style={{ marginTop: 24 }}>
                <label htmlFor="note" style={{ display: 'block', fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
                  {t('booking.noteLabel')} <span className="muted" style={{ fontSize: 13, fontWeight: 500 }}>{t('booking.optional')}</span>
                </label>
                <div className="field-hint" style={{ marginBottom: 10 }}>
                  {t('booking.noteHint')}
                </div>
                <textarea id="note" className="input" rows={4} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('booking.notePh')} />
                <div className="field-hint" style={{ textAlign: 'right' }}>
                  {note.length}/500
                </div>
              </div>
              {myDocs.data && myDocs.data.length > 0 && (
                <div style={{ marginTop: 20 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{t('booking.attachDocs')}</div>
                  <div className="field-hint" style={{ marginBottom: 10 }}>
                    {t('booking.attachHint')}
                  </div>
                  <div style={{ display: 'grid', gap: 8 }}>
                    {myDocs.data.map((doc) => (
                      <label key={doc.documentId} className={s.service} style={{ alignItems: 'center', justifyContent: 'flex-start', gap: 12 }}>
                        <input type="checkbox" style={{ width: 16, height: 16, accentColor: 'var(--accent)' }} checked={docIds.includes(doc.documentId)} disabled={!docIds.includes(doc.documentId) && docIds.length >= 10} onChange={(e) => setDocIds((x) => (e.target.checked ? [...x, doc.documentId] : x.filter((y) => y !== doc.documentId)))} />
                        <span style={{ display: 'flex', flexDirection: 'column' }}>
                          {doc.fileName}
                          <span className="muted" style={{ fontSize: 13, fontWeight: 500 }}>
                            {DOCUMENT_CATEGORY_LABEL[doc.category]}
                            {doc.documentDate ? ` · ${formatDate(doc.documentDate)}` : ''}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div className={s.hold} role="status" style={{ marginTop: 16 }}>
                <span>{t('booking.timeHeld')}</span>
                <span className={`${s.timer} ${left < 60 ? s.timerLow : ''}`}>{formatCountdown(left)}</span>
              </div>
              {error && (
                <div style={{ marginTop: 16 }}>
                  <Alert tone="error">{error}</Alert>
                </div>
              )}
              <div className={s.actions}>
                <Button arrow loading={pending} onClick={() => void confirm()}>
                  {t('booking.confirmCta')}
                </Button>
                <button
                  type="button"
                  className={d.reset}
                  onClick={() => {
                    changeSelection();
                    navigate(`/doctors/${doc.doctorId}`);
                  }}
                >
                  {t('booking.cancelCta')}
                </button>
              </div>
            </section>
          )}
        </div>

        <aside className={s.side}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <Avatar name={doc.fullName} src={doc.photoUrl} size={64} />
            <div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{doc.fullName}</div>
              <div className="muted" style={{ fontSize: 13, fontWeight: 500, marginTop: 4 }}>
                {doc.specialties.map((x) => x.name).join(', ')}
                {doc.experienceYears ? ` · ${t('directory.yearsExp', { n: doc.experienceYears })}` : ''}
              </div>
              {doc.rating.average !== null && (
                <div style={{ fontSize: 13, fontWeight: 600, marginTop: 6 }}>
                  <span style={{ color: 'var(--accent)' }}>★</span> {doc.rating.average.toFixed(1)}
                </div>
              )}
            </div>
          </div>
          <div className={s.picks}>
            {[
              [t('booking.clinic'), clinic?.name ?? '—'],
              [t('booking.stepService'), service?.name ?? '—'],
              [t('booking.date'), slot ? formatDate(slot.date) : '—'],
              [t('booking.hour'), slot?.startTime ?? '—'],
            ].map(([k, v]) => (
              <div key={k}>
                <span>{k}</span>
                <span>{v}</span>
              </div>
            ))}
          </div>
          <p className="muted" style={{ margin: '18px 0 0', fontSize: 13, lineHeight: 1.6 }}>
            {t('booking.sideNote')}
          </p>
          <Link to={`/doctors/${doc.doctorId}`} style={{ display: 'inline-block', marginTop: 14, fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>
            {t('booking.doctorProfile')}
          </Link>
        </aside>
      </div>
    </div>
  );
}

function Success({ doc, done }: { doc: DoctorDetailDto; done: AppointmentCreatedDto }) {
  const toast = useToast();
  const confirmed = done.appointmentStatus === 'CONFIRMED';
  return (
    <div className="container" style={{ paddingTop: 36, maxWidth: 720 }}>
      <section className="card" style={{ textAlign: 'center', padding: 36 }}>
        <div className={s.successIcon} aria-hidden="true">
          ✓
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginTop: 16 }}>{confirmed ? t('booking.confirmed') : t('booking.requested')}</h1>
        <p className="ink-soft" style={{ margin: '10px auto 0', maxWidth: 52 + 'ch' }}>
          {confirmed
            ? t('booking.confirmedBody', { name: doc.fullName, date: formatDate(done.slotDate), time: done.startTime, clinic: done.clinicName })
            : t('booking.requestedBody', { name: doc.fullName })}
        </p>
        <div className={s.refBox}>
          <div className="muted" style={{ fontSize: 13, fontWeight: 600 }}>
            {t('booking.refLabel')}
          </div>
          <div className={s.ref}>{done.bookingReference}</div>
          <div style={{ background: '#fff', padding: 12, borderRadius: 12, display: 'inline-block', lineHeight: 0 }}>
            <QRCodeSVG value={done.bookingReference} size={132} />
          </div>
          <div className="field-hint" style={{ marginTop: 8 }}>
            {t('booking.refHint')}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: 24 }}>
          <ButtonLink to={`/account/appointments/${done.appointmentId}`} arrow>
            {t('booking.viewAppointment')}
          </ButtonLink>
          <Button
            variant="ghost"
            onClick={() => downloadAuthorized(`/v1/appointments/${done.appointmentId}/calendar.ics`, 'mediconnect-randevu.ics').catch((e) => toast.error((e as Error).message))}
          >
            {t('booking.addCalendar')}
          </Button>
        </div>
        <p className="muted" style={{ fontSize: 13, marginTop: 18 }}>
          {done.clinicAddress} · {t('common.priceNote')}.
        </p>
      </section>
    </div>
  );
}
