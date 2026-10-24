import { SLOT_DURATIONS, type ScheduleConflictDto, type ScheduleDayInput, type ScheduleDto, type ScheduleSlotDto } from '@mediconnect/shared';
import { t } from '../../i18n';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiClientError, serverNow } from '../../api/client';
import type { ScheduleApi } from '../../api/doctor';
import { useApi } from '../../api/hooks';
import { Alert, ConfirmDialog, Modal } from '../../components/forms';
import { Button, ErrorState, Skeleton } from '../../components/ui';
import { useToast } from '../../components/Toast';
import { bakuDateKey, dayLabel, dayName, dayShort, formatDate } from '../../lib/format';
import s from './schedule.module.css';

// UC-702 / UC-803 — cədvəl redaktoru: həftəlik təqvim (slotlar statusa görə rənglənir), şablon redaktəsi,
// istisnalar (bağlı gün, məzuniyyət, əlavə saat), tək slotun bloklanması. Konflikt olanda təsirlənən randevular göstərilir.


const addDays = (date: string, n: number) => {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

type Draft = Record<number, (ScheduleDayInput & { key: number })[]>;
let keySeq = 0;
const toDraft = (days: ScheduleDayInput[]): Draft => {
  const d: Draft = {};
  for (let i = 1; i <= 7; i++) d[i] = days.filter((x) => x.dayOfWeek === i).map((x) => ({ ...x, key: ++keySeq }));
  return d;
};
const fromDraft = (d: Draft): ScheduleDayInput[] => Object.values(d).flat().map(({ key: _k, ...rest }) => rest);

export function ScheduleEditor({ api, clinics, role }: { api: ScheduleApi; clinics: { clinicId: string; name: string }[]; role: 'DOCTOR' | 'CLINIC_ADMIN' }) {
  const [clinicId, setClinicId] = useState(clinics[0]?.clinicId ?? '');
  const [from, setFrom] = useState(() => bakuDateKey(new Date(serverNow())));
  const q = useApi((sig) => api.load(clinicId, from, sig), [clinicId, from], { enabled: !!clinicId });
  const [editing, setEditing] = useState(false);

  if (!clinicId) return <Alert tone="info">{t('sched.noClinic')}</Alert>;

  return (
    <div className={s.wrap}>
      {clinics.length > 1 && (
        <div className={s.tabs} role="tablist" aria-label={t('sched.clinicTabs')}>
          {clinics.map((c) => (
            <button key={c.clinicId} type="button" role="tab" aria-selected={c.clinicId === clinicId} className={s.tab} onClick={() => (setClinicId(c.clinicId), setEditing(false))}>
              {c.name}
            </button>
          ))}
        </div>
      )}
      {q.error && <ErrorState message={q.error.message} onRetry={q.reload} />}
      {!q.data && !q.error && <Skeleton height={420} radius={18} />}
      {q.data && (
        <>
          <WeekCalendar data={q.data} from={from} setFrom={setFrom} api={api} onChanged={q.reload} role={role} />
          {editing ? (
            <TemplateForm data={q.data} api={api} onCancel={() => setEditing(false)} onSaved={() => (setEditing(false), q.reload())} />
          ) : (
            <TemplateSummary data={q.data} onEdit={() => setEditing(true)} />
          )}
          <Exceptions data={q.data} api={api} onChanged={q.reload} />
        </>
      )}
    </div>
  );
}

// ── Həftəlik təqvim (FR-702-08, FR-803-A) ──

function WeekCalendar({ data, from, setFrom, api, onChanged, role }: { data: ScheduleDto; from: string; setFrom: (d: string) => void; api: ScheduleApi; onChanged: () => void; role: string }) {
  const toast = useToast();
  const [selected, setSelected] = useState<{ slot: ScheduleSlotDto; date: string } | null>(null);
  const today = bakuDateKey(new Date(serverNow()));
  const stats = useMemo(() => {
    const all = data.calendar.flatMap((d) => d.slots.filter((x) => !x.past));
    return { free: all.filter((x) => x.status === 'AVAILABLE').length, booked: all.filter((x) => x.status === 'BOOKED').length, blocked: all.filter((x) => x.status === 'BLOCKED').length };
  }, [data]);

  const toggleBlock = async () => {
    if (!selected) return;
    try {
      if (selected.slot.status === 'BLOCKED') await api.unblock(selected.slot.slotId);
      else await api.block(selected.slot.slotId, 'Bağlanıb');
      toast.success(selected.slot.status === 'BLOCKED' ? t('sched.slotOpened') : t('sched.slotBlocked'));
      setSelected(null);
      onChanged();
    } catch (e) {
      toast.error(t('common.failed'), (e as Error).message);
    }
  };

  return (
    <section className="card">
      <div className={s.calHead}>
        <div>
          <h2 className={s.h2}>{t('sched.weekView', { clinic: data.clinicName })}</h2>
          <div className={s.legend}>
            <span className={s.lFree}>{t('sched.free', { n: stats.free })}</span>
            <span className={s.lBooked}>{t('sched.booked', { n: stats.booked })}</span>
            <span className={s.lBlocked}>{t('sched.blocked', { n: stats.blocked })}</span>
          </div>
        </div>
        <div className={s.nav}>
          <Button variant="ghost" size="small" disabled={from <= today} onClick={() => setFrom(addDays(from, -7) < today ? today : addDays(from, -7))}>
            ←
          </Button>
          <span>
            {formatDate(from)} — {formatDate(addDays(from, 6))}
          </span>
          <Button variant="ghost" size="small" onClick={() => setFrom(addDays(from, 7))}>
            →
          </Button>
        </div>
      </div>
      <div className={s.week}>
        {data.calendar.map((day) => {
          const l = dayLabel(day.date);
          return (
            <div key={day.date} className={s.dayCol}>
              <div className={s.dayHead}>
                <strong>{l.weekday}</strong>
                <span>{l.date}</span>
              </div>
              {day.slots.length === 0 && <div className={s.off}>{t('sched.noVisits')}</div>}
              {day.slots.map((slot) => (
                <button
                  key={slot.slotId}
                  type="button"
                  className={`${s.slot} ${s[`st_${slot.status}`] ?? ''} ${slot.past ? s.past : ''}`}
                  title={slot.patientName ?? slot.blockedReason ?? ''}
                  onClick={() => setSelected({ slot, date: day.date })}
                >
                  <span>{slot.startTime}</span>
                  {slot.patientName && <small>{slot.patientName}</small>}
                </button>
              ))}
            </div>
          );
        })}
      </div>
      <Modal
        open={!!selected}
        title={selected ? `${formatDate(selected.date)}, ${selected.slot.startTime}–${selected.slot.endTime}` : ''}
        onClose={() => setSelected(null)}
        actions={
          selected && !selected.slot.past && (selected.slot.status === 'AVAILABLE' || (selected.slot.status === 'BLOCKED' && selected.slot.blockedReason !== 'Köçürmə təklifi')) ? (
            <Button variant={selected.slot.status === 'BLOCKED' ? 'primary' : 'danger'} onClick={() => void toggleBlock()}>
              {selected.slot.status === 'BLOCKED' ? t('sched.openSlot') : t('sched.blockSlot')}
            </Button>
          ) : undefined
        }
      >
        {selected?.slot.status === 'BOOKED' && (
          <>
            {t('sched.patient')} <strong>{selected.slot.patientName}</strong>.{' '}
            {selected.slot.appointmentId && (
              <Link to={role === 'DOCTOR' ? `/doctor/appointments/${selected.slot.appointmentId}` : `/clinic-admin/appointments/${selected.slot.appointmentId}`}>{t('sched.openAppt')}</Link>
            )}
            <p className="field-hint">{t('sched.bookedHint')}</p>
          </>
        )}
        {selected?.slot.status === 'AVAILABLE' && t('sched.freeHint')}
        {selected?.slot.status === 'BLOCKED' && t('sched.blockedHint', { reason: selected.slot.blockedReason ?? '' })}
        {selected?.slot.status === 'SOFT_LOCKED' && t('sched.lockedHint')}
        {selected?.slot.past && <p className="field-hint">{t('sched.past')}</p>}
      </Modal>
    </section>
  );
}

// ── Şablon ──

function TemplateSummary({ data, onEdit }: { data: ScheduleDto; onEdit: () => void }) {
  return (
    <section className="card">
      <div className={s.calHead}>
        <h2 className={s.h2}>{t('sched.weekly')}</h2>
        <Button variant="secondary" size="small" onClick={onEdit}>
          {t('sched.edit')}
        </Button>
      </div>
      <table className={s.table}>
        <thead>
          <tr>
            <th>{t('sched.day')}</th>
            <th>{t('sched.doctorHours')}</th>
            <th>{t('sched.slot')}</th>
            <th>{t('sched.break')}</th>
            <th>{t('sched.clinicHours')}</th>
          </tr>
        </thead>
        <tbody>
          {[1, 2, 3, 4, 5, 6, 7].map((dow) => {
            const rows = data.days.filter((d) => d.dayOfWeek === dow);
            const h = data.clinicHours.find((x) => x.dayOfWeek === dow);
            return (
              <tr key={dow}>
                <td>{dayName(dow)}</td>
                <td>{rows.length ? rows.map((r) => `${r.startTime}–${r.endTime}`).join(', ') : <span className="muted">{t('sched.off')}</span>}</td>
                <td>{rows.length ? `${t('common.minShort', { n: rows[0].slotDurationMinutes })}${rows[0].bufferMinutes ? ` + ${t('sched.buffer', { n: rows[0].bufferMinutes })}` : ''}` : '—'}</td>
                <td>{rows.flatMap((r) => r.breaks).map((b) => `${b.breakStart}–${b.breakEnd}`).join(', ') || '—'}</td>
                <td className="muted">{h && !h.isClosed ? `${h.opensAt}–${h.closesAt}` : t('sched.closed')}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {data.otherClinics.length > 0 && (
        <p className="field-hint" style={{ marginTop: 12 }}>
          {t('sched.otherClinics', { list: data.otherClinics.map((o) => `${o.clinicName} — ${dayShort(o.dayOfWeek)} ${o.startTime}–${o.endTime}`).join('; ') })}
        </p>
      )}
      {data.updatedAt && <p className="field-hint">{t('sched.lastChange', { date: formatDate(data.updatedAt) })}</p>}
    </section>
  );
}

function TemplateForm({ data, api, onCancel, onSaved }: { data: ScheduleDto; api: ScheduleApi; onCancel: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [draft, setDraft] = useState<Draft>(() => toDraft(data.days));
  const [error, setError] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<ScheduleConflictDto[] | null>(null);
  const [pending, setPending] = useState(false);

  const update = (dow: number, key: number, patch: Partial<ScheduleDayInput>) => setDraft((d) => ({ ...d, [dow]: d[dow].map((r) => (r.key === key ? { ...r, ...patch } : r)) }));
  const addRow = (dow: number) => {
    const h = data.clinicHours.find((x) => x.dayOfWeek === dow);
    const ref = Object.values(draft).flat()[0];
    setDraft((d) => ({
      ...d,
      [dow]: [...d[dow], { key: ++keySeq, dayOfWeek: dow, startTime: h?.opensAt && !h.isClosed ? h.opensAt : '09:00', endTime: h?.closesAt && !h.isClosed ? (h.closesAt > '18:00' ? '18:00' : h.closesAt) : '13:00', slotDurationMinutes: ref?.slotDurationMinutes ?? 30, bufferMinutes: ref?.bufferMinutes ?? 0, breaks: [] }],
    }));
  };
  const removeRow = (dow: number, key: number) => setDraft((d) => ({ ...d, [dow]: d[dow].filter((r) => r.key !== key) }));
  const copyToWeekdays = (dow: number) => {
    const src = draft[dow];
    setDraft((d) => {
      const next = { ...d };
      for (const day of [1, 2, 3, 4, 5]) if (day !== dow) next[day] = src.map((r) => ({ ...r, dayOfWeek: day, key: ++keySeq, breaks: r.breaks.map((b) => ({ ...b })) }));
      return next;
    });
  };

  const save = async (resolution?: 'CANCEL_AND_NOTIFY') => {
    setPending(true);
    setError(null);
    try {
      const days = fromDraft(draft);
      if (!resolution) {
        const dry = await api.save({ clinicId: data.clinicId, days, dryRun: true });
        if (dry.conflicts.length) {
          setConflicts(dry.conflicts);
          return;
        }
      }
      const r = await api.save({ clinicId: data.clinicId, days, conflictResolution: resolution });
      toast.success(t('sched.saved'), `${t('sched.savedBody', { n: r.slotsGenerated })}${r.cancelledCount ? t('sched.savedCancelled', { n: r.cancelledCount }) : ''}.`);
      setConflicts(null);
      onSaved();
    } catch (e) {
      setError((e as ApiClientError).message);
    } finally {
      setPending(false);
    }
  };

  return (
    <section className="card">
      <div className={s.calHead}>
        <h2 className={s.h2}>{t('sched.editTitle', { clinic: data.clinicName })}</h2>
      </div>
      <p className="field-hint" style={{ marginTop: 0 }}>
        {t('sched.editHint')}
      </p>
      <div className={s.form}>
        {[1, 2, 3, 4, 5, 6, 7].map((dow) => {
          const h = data.clinicHours.find((x) => x.dayOfWeek === dow);
          return (
            <div key={dow} className={s.dayRow}>
              <div className={s.dayName}>
                <strong>{dayName(dow)}</strong>
                <span className="muted">{h && !h.isClosed ? t('sched.clinicOpen', { from: h.opensAt ?? '', to: h.closesAt ?? '' }) : t('sched.clinicClosed')}</span>
              </div>
              <div className={s.intervals}>
                {draft[dow].length === 0 && <span className="muted">{t('sched.off')}</span>}
                {draft[dow].map((r) => (
                  <div key={r.key} className={s.interval}>
                    <label>
                      <span>{t('sched.start')}</span>
                      <input type="time" className="input" value={r.startTime} onChange={(e) => update(dow, r.key, { startTime: e.target.value })} />
                    </label>
                    <label>
                      <span>{t('sched.end')}</span>
                      <input type="time" className="input" value={r.endTime} onChange={(e) => update(dow, r.key, { endTime: e.target.value })} />
                    </label>
                    <label>
                      <span>{t('sched.slot')}</span>
                      <select className="input" value={r.slotDurationMinutes} onChange={(e) => update(dow, r.key, { slotDurationMinutes: Number(e.target.value) as ScheduleDayInput['slotDurationMinutes'] })}>
                        {SLOT_DURATIONS.map((m) => (
                          <option key={m} value={m}>
                            {t('common.minShort', { n: m })}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <span>{t('sched.bufferLabel')}</span>
                      <select className="input" value={r.bufferMinutes} onChange={(e) => update(dow, r.key, { bufferMinutes: Number(e.target.value) })}>
                        {[0, 5, 10, 15].map((m) => (
                          <option key={m} value={m}>
                            {t('common.minShort', { n: m })}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className={s.breaks}>
                      {r.breaks.map((b, i) => (
                        <span key={i} className={s.break}>
                          <input type="time" className="input" value={b.breakStart} aria-label={t('sched.breakStart')} onChange={(e) => update(dow, r.key, { breaks: r.breaks.map((x, j) => (j === i ? { ...x, breakStart: e.target.value } : x)) })} />–
                          <input type="time" className="input" value={b.breakEnd} aria-label={t('sched.breakEnd')} onChange={(e) => update(dow, r.key, { breaks: r.breaks.map((x, j) => (j === i ? { ...x, breakEnd: e.target.value } : x)) })} />
                          <button type="button" className={s.x} aria-label={t('sched.removeBreak')} onClick={() => update(dow, r.key, { breaks: r.breaks.filter((_, j) => j !== i) })}>
                            ×
                          </button>
                        </span>
                      ))}
                      <button type="button" className={s.link} onClick={() => update(dow, r.key, { breaks: [...r.breaks, { breakStart: '13:00', breakEnd: '14:00', breakName: 'Nahar' }] })}>
                        {t('sched.addBreak')}
                      </button>
                    </div>
                    <button type="button" className={s.x} aria-label={t('sched.removeInterval')} onClick={() => removeRow(dow, r.key)}>
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div className={s.rowActions}>
                <button type="button" className={s.link} disabled={!h || h.isClosed} onClick={() => addRow(dow)}>
                  {t('sched.addInterval')}
                </button>
                {draft[dow].length > 0 && dow <= 5 && (
                  <button type="button" className={s.link} onClick={() => copyToWeekdays(dow)}>
                    {t('sched.copyWeekdays')}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {error && <Alert tone="error">{error}</Alert>}
      <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
        <Button loading={pending} onClick={() => void save()}>
          {t('common.save')}
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
      </div>
      <ConfirmDialog
        open={!!conflicts}
        danger
        pending={pending}
        title={t('sched.conflictTitle', { n: conflicts?.length ?? 0 })}
        body={
          <>
            {t('sched.conflictLead')}
            <ul style={{ margin: '10px 0', paddingLeft: 18 }}>
              {conflicts?.map((c) => (
                <li key={c.appointmentId}>
                  {formatDate(c.date)}, {c.startTime} — {c.patientName}
                </li>
              ))}
            </ul>
            {t('sched.conflictWarn')}
          </>
        }
        confirmLabel={t('sched.cancelNotify')}
        onConfirm={() => void save('CANCEL_AND_NOTIFY')}
        onClose={() => setConflicts(null)}
      />
    </section>
  );
}

// ── İstisnalar (FR-702-11..14) ──

const EX_LABEL = { DAY_OFF: t('sched.exDAY_OFF'), VACATION: t('sched.exVACATION'), EXTRA_HOURS: t('sched.exEXTRA_HOURS'), HOLIDAY: t('sched.exHOLIDAY') } as const;

function Exceptions({ data, api, onChanged }: { data: ScheduleDto; api: ScheduleApi; onChanged: () => void }) {
  const toast = useToast();
  const today = bakuDateKey(new Date(serverNow()));
  const [type, setType] = useState<'DAY_OFF' | 'VACATION' | 'EXTRA_HOURS'>('DAY_OFF');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('14:00');
  const [reason, setReason] = useState('');
  const [conflicts, setConflicts] = useState<ScheduleConflictDto[] | null>(null);
  const [pending, setPending] = useState(false);
  useEffect(() => {
    if (type !== 'VACATION') setEndDate(startDate);
  }, [type, startDate]);

  const submit = async (resolution?: 'CANCEL_AND_NOTIFY') => {
    setPending(true);
    try {
      await api.addException({ clinicId: data.clinicId, exceptionType: type, startDate, endDate: type === 'VACATION' ? endDate : startDate, startTime: type === 'EXTRA_HOURS' ? startTime : null, endTime: type === 'EXTRA_HOURS' ? endTime : null, reason: reason || null, conflictResolution: resolution });
      toast.success(t('sched.exAdded', { type: EX_LABEL[type] }));
      setConflicts(null);
      setReason('');
      onChanged();
    } catch (e) {
      const err = e as ApiClientError;
      if (err.errorType === 'ScheduleConflict') setConflicts((err.details?.appointments as ScheduleConflictDto[]) ?? []);
      else toast.error(t('sched.notAdded'), err.message);
    } finally {
      setPending(false);
    }
  };

  return (
    <section className="card">
      <h2 className={s.h2}>{t('sched.exTitle')}</h2>
      {data.exceptions.length > 0 && (
        <div className={s.exList}>
          {data.exceptions.map((e) => (
            <div key={e.exceptionId} className={s.exItem}>
              <div>
                <strong>{EX_LABEL[e.exceptionType]}</strong> · {formatDate(e.startDate)}
                {e.endDate !== e.startDate && ` — ${formatDate(e.endDate)}`}
                {e.startTime && ` · ${e.startTime}–${e.endTime}`}
                {e.reason && <span className="muted"> · {e.reason}</span>}
              </div>
              {e.exceptionType !== 'HOLIDAY' && (
                <button
                  type="button"
                  className={s.link}
                  onClick={async () => {
                    await api.removeException(data.clinicId, e.exceptionId).catch((x) => toast.error((x as Error).message));
                    onChanged();
                  }}
                >
                  {t('common.delete')}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      <div className={s.exForm}>
        <label>
          <span>{t('sched.type')}</span>
          <select className="input" value={type} onChange={(e) => setType(e.target.value as typeof type)}>
            <option value="DAY_OFF">{t('sched.exDAY_OFF')}</option>
            <option value="VACATION">{t('sched.exVACATION')}</option>
            <option value="EXTRA_HOURS">{t('sched.exEXTRA_HOURS')}</option>
          </select>
        </label>
        <label>
          <span>{type === 'VACATION' ? t('sched.startDate') : t('sched.date')}</span>
          <input type="date" className="input" min={today} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </label>
        {type === 'VACATION' && (
          <label>
            <span>{t('sched.endDate')}</span>
            <input type="date" className="input" min={startDate} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </label>
        )}
        {type === 'EXTRA_HOURS' && (
          <>
            <label>
              <span>{t('sched.start')}</span>
              <input type="time" className="input" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </label>
            <label>
              <span>{t('sched.end')}</span>
              <input type="time" className="input" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </label>
          </>
        )}
        <label style={{ flex: 2 }}>
          <span>{t('common.reasonOptional')}</span>
          <input className="input" value={reason} maxLength={255} onChange={(e) => setReason(e.target.value)} />
        </label>
        <Button variant="secondary" loading={pending} onClick={() => void submit()}>
          {t('common.add')}
        </Button>
      </div>
      <ConfirmDialog
        open={!!conflicts}
        danger
        pending={pending}
        title={t('sched.exConflictTitle', { n: conflicts?.length ?? 0 })}
        body={
          <>
            <ul style={{ margin: '0 0 10px', paddingLeft: 18 }}>
              {conflicts?.map((c) => (
                <li key={c.appointmentId}>
                  {formatDate(c.date)}, {c.startTime} — {c.patientName}
                </li>
              ))}
            </ul>
            {t('sched.exConflictWarn')}
          </>
        }
        confirmLabel={t('sched.cancelClose')}
        onConfirm={() => void submit('CANCEL_AND_NOTIFY')}
        onClose={() => setConflicts(null)}
      />
    </section>
  );
}
