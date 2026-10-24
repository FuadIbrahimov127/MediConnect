import { type ClinicProfileDto, type WorkingHoursResultDto } from '@mediconnect/shared';
import { CLINIC_TYPE_LABEL } from '../../i18n/labels';
import { useEffect, useState, type FormEvent } from 'react';
import { clinicAdminApi, readAsDataUrl } from '../../api/clinicAdmin';
import { ApiClientError } from '../../api/client';
import { useApi } from '../../api/hooks';
import { Alert, Field, Modal, Switch } from '../../components/forms';
import { Button, ErrorState, Skeleton } from '../../components/ui';
import { useToast } from '../../components/Toast';
import s from '../../features/clinicAdmin/clinicAdmin.module.css';
import { tValidation, t } from '../../i18n';
import { dayName, dayShort, formatDate } from '../../lib/format';

// UC-801 — klinika profili. SA sahələri read-only (BR-801-02/03), qalanları admin idarə edir; iş saatları həkim
// cədvəlləri üçün yuxarı sərhəddir (BR-801-05) — konfliktlər server dryRun ilə əvvəlcədən göstərilir.

type Conflicts = { appointments: { appointmentId: string; date: string; startTime: string; patientName: string; doctorName?: string }[] };

export function ClinicProfilePage() {
  const q = useApi((sig) => clinicAdminApi.profile(sig), []);
  if (q.error) return <ErrorState message={q.error.message} onRetry={q.reload} />;
  if (!q.data) return <Skeleton height={520} radius={18} />;
  return <Profile p={q.data} onChange={q.setData} />;
}

function Profile({ p, onChange }: { p: ClinicProfileDto; onChange: (p: ClinicProfileDto) => void }) {
  return (
    <div className={s.stack}>
      <h1 className="page-title">{t('panel.clinicAdmin.profile')}</h1>
      <section className={s.section}>
        <div>
          <h2 className={s.sectionTitle}>{t('caProf.regInfo')}</h2>
          <div className={s.sectionSub}>{t('caProf.regInfoSub')}</div>
        </div>
        <div className={s.ro}>
          {(
            [
              [t('caProf.name'), p.name],
              [t('caProf.type'), CLINIC_TYPE_LABEL[p.clinicType]],
              [t('caProf.regNo'), p.registrationNumber],
              [t('docProf.license'), p.licenseNumber],
              [t('caDoc.licenseEnds'), formatDate(p.licenseExpiryDate)],
              [t('caProf.city'), p.cityName],
            ] as const
          ).map(([k, v]) => (
            <div key={k}>
              <div className={s.roLabel}>{k}</div>
              <div className={s.roValue}>{v}</div>
            </div>
          ))}
        </div>
      </section>
      <BasicInfo p={p} onChange={onChange} />
      <Photos p={p} onChange={onChange} />
      <WorkingHours p={p} onChange={onChange} />
      <Holidays p={p} onChange={onChange} />
      <StatusSection p={p} onChange={onChange} />
    </div>
  );
}

function BasicInfo({ p, onChange }: { p: ClinicProfileDto; onChange: (p: ClinicProfileDto) => void }) {
  const toast = useToast();
  const [f, setF] = useState({
    description: p.description ?? '', phone: p.phone, email: p.email ?? '', website: p.website ?? '', address: p.address, district: p.district ?? '',
    latitude: p.latitude?.toString() ?? '', longitude: p.longitude?.toString() ?? '',
  });
  const [insurances, setInsurances] = useState(p.insurances);
  const [ins, setIns] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));
  const num = (v: string) => (v.trim() === '' ? null : Number(v.replace(',', '.')));

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      const r = await clinicAdminApi.updateProfile({
        description: f.description.trim() || null, phone: f.phone.trim(), email: f.email.trim(), website: f.website.trim(), address: f.address.trim(),
        district: f.district.trim() || null, latitude: num(f.latitude), longitude: num(f.longitude), insurances,
      });
      onChange(r.profile);
      if (r.warnings.length) toast.error(t('caProf.savedWarn'), r.warnings.join(' '));
      else toast.success(t('caDoc.saved'), t('docProf.savedBody'));
    } catch (err) {
      const x = err as ApiClientError;
      if (x.details?.fields) setErrors(x.details.fields);
      toast.error(t('rxEdit.notSaved'), x.message);
    } finally {
      setBusy(false);
    }
  };
  const logo = async (file: File | undefined) => {
    if (!file) return;
    try {
      onChange((await clinicAdminApi.updateProfile({ logo: await readAsDataUrl(file) })).profile);
      toast.success(t('caProf.logoUpdated'));
    } catch (err) {
      toast.error(t('caProf.logoFailed'), (err as Error).message);
    }
  };
  const err = (k: string) => (errors[k] ? tValidation(errors[k]) : undefined);

  return (
    <form className={s.section} onSubmit={(e) => void save(e)}>
      <h2 className={s.sectionTitle}>{t('caProf.basic')}</h2>
      <div className={s.logoRow}>
        {p.logoUrl ? <img src={p.logoUrl} alt={t('caProf.logoAlt')} className={s.logo} /> : <div className={s.logo}>LOGO</div>}
        <label className="ink-soft" style={{ fontSize: 14, cursor: 'pointer' }}>
          <input type="file" accept="image/png,image/jpeg" className="visually-hidden" onChange={(e) => void logo(e.target.files?.[0])} />
          <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{t('caProf.uploadLogo')}</span> · PNG/JPG, ≤ 1 MB
        </label>
      </div>
      <div className={s.formGrid}>
        <div className={s.full}>
          <Field label={t('caProf.desc')} htmlFor="desc">
            <textarea id="desc" className="input" rows={4} maxLength={2000} value={f.description} onChange={set('description')} />
          </Field>
        </div>
        <Field label={t('caProf.phone')} htmlFor="phone" error={err('phone')}>
          <input id="phone" className="input" value={f.phone} onChange={set('phone')} placeholder="+994121234567" />
        </Field>
        <Field label="Email" htmlFor="email" error={err('email')}>
          <input id="email" className="input" type="email" value={f.email} onChange={set('email')} />
        </Field>
        <Field label={t('caProf.website')} htmlFor="web" error={err('website')}>
          <input id="web" className="input" value={f.website} onChange={set('website')} placeholder="https://" />
        </Field>
        <Field label={t('caProf.district')} htmlFor="district">
          <input id="district" className="input" value={f.district} onChange={set('district')} />
        </Field>
        <div className={s.full}>
          <Field label={t('booking.address')} htmlFor="address" error={err('address')}>
            <input id="address" className="input" value={f.address} onChange={set('address')} />
          </Field>
        </div>
        <Field label={t('caProf.lat')} htmlFor="lat" hint={t('caProf.latHint')}>
          <input id="lat" className="input" inputMode="decimal" value={f.latitude} onChange={set('latitude')} />
        </Field>
        <Field label={t('caProf.lng')} htmlFor="lng" hint={t('caProf.lngHint')}>
          <input id="lng" className="input" inputMode="decimal" value={f.longitude} onChange={set('longitude')} />
        </Field>
        <div className={s.full}>
          <Field label={t('caProf.insurers')} htmlFor="ins">
            <div className={s.chips} style={{ marginBottom: 8 }}>
              {insurances.map((x) => (
                <span key={x} className={s.chip}>
                  {x}
                  <button type="button" aria-label={t('caProf.removeX', { name: x })} onClick={() => setInsurances((l) => l.filter((y) => y !== x))}>
                    ×
                  </button>
                </span>
              ))}
            </div>
            <input
              id="ins"
              className="input"
              value={ins}
              placeholder={t('caProf.insPh')}
              onChange={(e) => setIns(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && ins.trim().length >= 2) {
                  e.preventDefault();
                  setInsurances((l) => [...new Set([...l, ins.trim()])]);
                  setIns('');
                }
              }}
            />
          </Field>
        </div>
      </div>
      <div className={s.actions}>
        <Button type="submit" loading={busy}>
          {t('common.save')}
        </Button>
      </div>
    </form>
  );
}

/** FR-801-07/08 — fotoqalereya, drag-and-drop ilə sıralama (alt 4). */
function Photos({ p, onChange }: { p: ClinicProfileDto; onChange: (p: ClinicProfileDto) => void }) {
  const toast = useToast();
  const [drag, setDrag] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    try {
      let last = p;
      for (const file of Array.from(files)) last = await clinicAdminApi.addPhoto(await readAsDataUrl(file));
      onChange(last);
    } catch (e) {
      toast.error(t('caProf.photoFailed'), (e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const drop = async (targetId: string) => {
    if (!drag || drag === targetId) return;
    const ids = p.photos.map((x) => x.photoId).filter((x) => x !== drag);
    ids.splice(ids.indexOf(targetId), 0, drag);
    onChange({ ...p, photos: ids.map((id, i) => ({ ...p.photos.find((x) => x.photoId === id)!, displayOrder: i })) });
    try {
      onChange(await clinicAdminApi.reorderPhotos(ids));
    } catch (e) {
      toast.error(t('caProf.orderFailed'), (e as Error).message);
    }
  };
  const move = (id: string, dir: -1 | 1) => {
    const ids = p.photos.map((x) => x.photoId);
    const i = ids.indexOf(id);
    if (i + dir < 0 || i + dir >= ids.length) return;
    [ids[i], ids[i + dir]] = [ids[i + dir], ids[i]];
    void clinicAdminApi.reorderPhotos(ids).then(onChange).catch((e: Error) => toast.error(t('common.failed'), e.message));
  };

  return (
    <section className={s.section}>
      <div className={s.sectionHead}>
        <div>
          <h2 className={s.sectionTitle}>{t('clinicDetail.gallery')}</h2>
          <div className={s.sectionSub}>{t('caProf.gallerySub')}</div>
        </div>
        <label>
          <input type="file" accept="image/png,image/jpeg" multiple className="visually-hidden" onChange={(e) => void upload(e.target.files)} disabled={busy} />
          <span className="card" style={{ padding: '8px 14px', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
            {busy ? t('common.loading') : t('caProf.addPhoto')}
          </span>
        </label>
      </div>
      {p.photos.length === 0 ? (
        <span className="muted">{t('caProf.noPhotos')}</span>
      ) : (
        <div className={s.photos}>
          {p.photos.map((ph, i) => (
            <div
              key={ph.photoId}
              className={`${s.photo} ${drag === ph.photoId ? s.photoDragging : ''} ${over === ph.photoId ? s.photoOver : ''}`}
              draggable
              onDragStart={() => setDrag(ph.photoId)}
              onDragEnd={() => (setDrag(null), setOver(null))}
              onDragOver={(e) => (e.preventDefault(), setOver(ph.photoId))}
              onDragLeave={() => setOver(null)}
              onDrop={(e) => (e.preventDefault(), setOver(null), void drop(ph.photoId))}
            >
              <img src={ph.photoUrl} alt={t('caProf.photoAlt', { n: i + 1 })} />
              <div className={s.photoBar}>
                <span>
                  <button type="button" aria-label={t('caProf.left')} onClick={() => move(ph.photoId, -1)}>
                    ‹
                  </button>
                  {i + 1}
                  <button type="button" aria-label={t('caProf.right')} onClick={() => move(ph.photoId, 1)}>
                    ›
                  </button>
                </span>
                <button type="button" aria-label={t('caProf.removePhoto')} onClick={() => void clinicAdminApi.removePhoto(ph.photoId).then(onChange).catch((e: Error) => toast.error(t('common.failed'), e.message))}>
                  {t('common.delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

type Day = ClinicProfileDto['workingHours'][number];

function WorkingHours({ p, onChange }: { p: ClinicProfileDto; onChange: (p: ClinicProfileDto) => void }) {
  const toast = useToast();
  const [days, setDays] = useState<Day[]>(p.workingHours);
  const [busy, setBusy] = useState(false);
  const [review, setReview] = useState<WorkingHoursResultDto | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  useEffect(() => setDays(p.workingHours), [p.workingHours]);
  const setDay = (dow: number, patch: Partial<Day>) => setDays((l) => l.map((d) => (d.dayOfWeek === dow ? { ...d, ...patch } : d)));
  /** Alt 1: bir günün saatlarını B.e.–C. üçün kopyala. */
  const applyWeekdays = () => {
    const src = days.find((d) => !d.isClosed && d.dayOfWeek <= 5);
    if (!src) return;
    setDays((l) => l.map((d) => (d.dayOfWeek <= 5 ? { ...d, isClosed: false, opensAt: src.opensAt, closesAt: src.closesAt } : d)));
  };
  const payload = () => days.map((d) => ({ ...d, opensAt: d.isClosed ? null : d.opensAt, closesAt: d.isClosed ? null : d.closesAt }));

  const check = async () => {
    setBusy(true);
    setErrors({});
    try {
      const r = await clinicAdminApi.saveHours({ days: payload(), dryRun: true });
      if (r.doctorConflicts.length || r.appointmentConflicts.length) setReview(r);
      else await commit(false);
    } catch (e) {
      const x = e as ApiClientError;
      if (x.details?.fields) setErrors(x.details.fields);
      toast.error(t('rxEdit.notSaved'), x.message);
    } finally {
      setBusy(false);
    }
  };
  const commit = async (withConflicts: boolean) => {
    setBusy(true);
    try {
      const r = await clinicAdminApi.saveHours({ days: payload(), ...(withConflicts ? { confirmDoctorConflicts: true, conflictResolution: 'CANCEL_AND_NOTIFY' as const } : {}) });
      onChange(await clinicAdminApi.profile());
      setReview(null);
      toast.success(t('caProf.hoursUpdated'), r.cancelledCount ? t('caDoc.removedBody', { n: r.cancelledCount }) : t('caProf.slotsAdjusted'));
    } catch (e) {
      toast.error(t('rxEdit.notSaved'), (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={s.section}>
      <div className={s.sectionHead}>
        <div>
          <h2 className={s.sectionTitle}>{t('clinicDetail.hours')}</h2>
          <div className={s.sectionSub}>{t('caProf.hoursSub')}</div>
        </div>
        <Button size="small" variant="ghost" onClick={applyWeekdays}>
          {t('caProf.applyWeekdays')}
        </Button>
      </div>
      <div className={s.hours}>
        {days.map((d) => (
          <div key={d.dayOfWeek} className={s.hourRow}>
            <strong>{dayName(d.dayOfWeek)}</strong>
            <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 14 }}>
              <input type="checkbox" checked={d.isClosed} onChange={(e) => setDay(d.dayOfWeek, { isClosed: e.target.checked, opensAt: d.opensAt ?? '09:00', closesAt: d.closesAt ?? '18:00' })} />
              {t('caProf.closed')}
            </label>
            {d.isClosed ? (
              <span className="muted">{t('caProf.dayOff')}</span>
            ) : (
              <div>
                <div className={s.times}>
                  <input type="time" className="input" aria-label={t('caProf.opens', { day: dayName(d.dayOfWeek) })} value={d.opensAt ?? ''} onChange={(e) => setDay(d.dayOfWeek, { opensAt: e.target.value })} />
                  —
                  <input type="time" className="input" aria-label={t('caProf.closes', { day: dayName(d.dayOfWeek) })} value={d.closesAt ?? ''} onChange={(e) => setDay(d.dayOfWeek, { closesAt: e.target.value })} />
                </div>
                {errors[`days.${d.dayOfWeek}`] && <span className="field-error">{tValidation(errors[`days.${d.dayOfWeek}`])}</span>}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className={s.actions}>
        <Button loading={busy} onClick={() => void check()}>
          {t('caProf.saveHours')}
        </Button>
      </div>
      <Modal
        open={!!review}
        title={t('caProf.impactTitle')}
        onClose={() => setReview(null)}
        actions={
          <>
            <Button variant="ghost" onClick={() => setReview(null)}>
              {t('common.cancel')}
            </Button>
            <Button variant="danger" loading={busy} onClick={() => void commit(true)}>
              {review?.appointmentConflicts.length ? t('caProf.confirmCancel') : t('common.confirm')}
            </Button>
          </>
        }
      >
        {review && review.doctorConflicts.length > 0 && (
          <Alert tone="warning">
            {t('caProf.doctorConflicts', { n: review.doctorConflicts.length, list: review.doctorConflicts.map((d) => `${d.fullName} (${d.days.map((x) => dayShort(x)).join(', ')})`).join('; ') })}
          </Alert>
        )}
        {review && review.appointmentConflicts.length > 0 && <ConflictList c={{ appointments: review.appointmentConflicts }} note={t('caProf.apptConflicts')} />}
      </Modal>
    </section>
  );
}

function ConflictList({ c, note }: { c: Conflicts; note: string }) {
  return (
    <div style={{ marginTop: 12 }}>
      <p className="ink-soft" style={{ marginTop: 0 }}>
        {note}
      </p>
      <ul style={{ margin: 0, paddingLeft: 18, maxHeight: 220, overflowY: 'auto', fontSize: 14 }}>
        {c.appointments.map((a) => (
          <li key={a.appointmentId}>
            {formatDate(a.date)}, {a.startTime} — {a.patientName}
            {a.doctorName && <span className="muted"> ({a.doctorName})</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Alt 2 — bayram / texniki fasilə günləri: bütün həkimlərin slotları bağlanır (BR-801-07). */
function Holidays({ p, onChange }: { p: ClinicProfileDto; onChange: (p: ClinicProfileDto) => void }) {
  const toast = useToast();
  const [date, setDate] = useState('');
  const [name, setName] = useState('');
  const [conflict, setConflict] = useState<Conflicts | null>(null);
  const [busy, setBusy] = useState(false);

  const add = async (resolve: boolean) => {
    setBusy(true);
    try {
      onChange(await clinicAdminApi.addHoliday({ date, name: name.trim(), ...(resolve ? { conflictResolution: 'CANCEL_AND_NOTIFY' as const } : {}) }));
      toast.success(t('caProf.holidayAdded'), resolve ? t('caProf.holidayCancelled') : undefined);
      setDate('');
      setName('');
      setConflict(null);
    } catch (e) {
      const x = e as ApiClientError;
      if (x.errorType === 'ScheduleConflict') setConflict(x.details as unknown as Conflicts);
      else toast.error(t('sched.notAdded'), x.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={s.section}>
      <div>
        <h2 className={s.sectionTitle}>{t('caProf.holidays')}</h2>
        <div className={s.sectionSub}>{t('caProf.holidaysSub')}</div>
      </div>
      {p.holidays.length > 0 && (
        <div className={s.list}>
          {p.holidays.map((h) => (
            <div key={h.holidayId} className={s.row}>
              <span>
                <strong>{formatDate(h.date)}</strong> · {h.name}
              </span>
              <Button size="small" variant="ghost" onClick={() => void clinicAdminApi.removeHoliday(h.holidayId).then(onChange).catch((e: Error) => toast.error(t('common.failed'), e.message))}>
                {t('common.delete')}
              </Button>
            </div>
          ))}
        </div>
      )}
      <div className={s.toolbar} style={{ marginBottom: 0 }}>
        <label>
          {t('booking.date')}
          <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label style={{ flex: 1 }}>
          {t('caProf.name')}
          <input className="input" style={{ width: '100%' }} value={name} maxLength={100} onChange={(e) => setName(e.target.value)} placeholder={t('caProf.holidayPh')} />
        </label>
        <Button loading={busy} disabled={!date || name.trim().length < 2} onClick={() => void add(false)}>
          {t('common.add')}
        </Button>
      </div>
      <Modal
        open={!!conflict}
        title={t('caProf.hasAppts')}
        onClose={() => setConflict(null)}
        actions={
          <>
            <Button variant="ghost" onClick={() => setConflict(null)}>
              {t('common.cancel')}
            </Button>
            <Button variant="danger" loading={busy} onClick={() => void add(true)}>
              {t('sched.cancelNotify')}
            </Button>
          </>
        }
      >
        {conflict && <ConflictList c={conflict} note={t('caProf.willCancel', { n: conflict.appointments.length })} />}
      </Modal>
    </section>
  );
}

/** Alt 3 — müvəqqəti bağlama: yeni randevu dayanır, mövcudlar qalır (BR-801-06). */
function StatusSection({ p, onChange }: { p: ClinicProfileDto; onChange: (p: ClinicProfileDto) => void }) {
  const toast = useToast();
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const toggle = async (accepting: boolean) => {
    setBusy(true);
    try {
      onChange(await clinicAdminApi.setAccepting(accepting, accepting ? undefined : reason.trim() || undefined));
      toast.success(accepting ? t('caProf.resumed') : t('caProf.paused'), accepting ? undefined : t('caProf.pausedBody'));
    } catch (e) {
      toast.error(t('common.failed'), (e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className={s.section} id="status">
      <h2 className={s.sectionTitle}>{t('caProf.booking')}</h2>
      {!p.acceptingAppointments && <Alert tone="warning">{t('caProf.closedWarn')}</Alert>}
      {p.acceptingAppointments && (
        <Field label={t('caProf.closeReason')} htmlFor="close-reason">
          <input id="close-reason" className="input" value={reason} maxLength={300} onChange={(e) => setReason(e.target.value)} placeholder={t('caProf.closePh')} />
        </Field>
      )}
      <Switch checked={p.acceptingAppointments} disabled={busy} onChange={(v) => void toggle(v)} label={t('caProf.accepting')} hint={t('caProf.acceptingHint')} />
    </section>
  );
}
