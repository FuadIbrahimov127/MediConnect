import { useState } from 'react';
import { t } from '../../i18n';
import { Link, useSearchParams } from 'react-router-dom';
import { clinicAdminApi } from '../../api/clinicAdmin';
import { serverNow } from '../../api/client';
import { useApi } from '../../api/hooks';
import { Alert, Field, Modal } from '../../components/forms';
import { Button, EmptyState, ErrorState, Skeleton } from '../../components/ui';
import { useToast } from '../../components/Toast';
import { StatusBadge, STATUS_LABEL } from '../../features/appointments/status';
import s from '../../features/clinicAdmin/clinicAdmin.module.css';
import { bakuDateKey, formatDate, formatTime } from '../../lib/format';

// UC-805 — klinikanın bütün randevuları: yalnız əməliyyat məlumatı (BR-805-03), filtrlər (FR-805-05..07),
// toplu ləğv (alt 6). Şikayət mətni, diaqnoz, resept və sənəd bu səhifəyə heç vaxt gəlmir.

const addDays = (d: string, n: number) => {
  const x = new Date(`${d}T00:00:00Z`);
  x.setUTCDate(x.getUTCDate() + n);
  return x.toISOString().slice(0, 10);
};
const SIZE = 25;

export function ClinicAppointmentsPage() {
  const toast = useToast();
  const today = bakuDateKey(new Date(serverNow()));
  const [params, setParams] = useSearchParams();
  const f = {
    from: params.get('from') ?? today,
    to: params.get('to') ?? addDays(today, 7),
    doctorId: params.get('doctorId') ?? '',
    status: params.get('status') ?? '',
    serviceId: params.get('serviceId') ?? '',
    q: params.get('q') ?? '',
    page: Number(params.get('page') ?? 1),
  };
  const set = (k: string, v: string) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v);
    else next.delete(k);
    if (k !== 'page') next.delete('page');
    setParams(next, { replace: true });
  };
  const doctors = useApi((sig) => clinicAdminApi.doctors({}, sig), []);
  const services = useApi((sig) => clinicAdminApi.services(sig), []);
  const q = useApi(
    (sig) => clinicAdminApi.appointments({ from: f.from, to: f.to, doctorId: f.doctorId || undefined, status: f.status || undefined, serviceId: f.serviceId || undefined, q: f.q || undefined, page: f.page, size: SIZE }, sig),
    [params.toString()],
  );
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const bulk = async () => {
    setBusy(true);
    try {
      const r = await clinicAdminApi.bulkCancel(selected, reason.trim());
      if (r.failed.length) toast.error(t('caAppt.partFail', { ok: r.cancelled, fail: r.failed.length }), r.failed.map((x) => `${x.bookingReference}: ${x.message}`).join(' · '));
      else toast.success(t('caAppt.bulkOk', { n: r.cancelled }), t('caAppt.bulkOkBody'));
      setSelected([]);
      setBulkOpen(false);
      setReason('');
      q.reload();
    } catch (e) {
      toast.error(t('common.failed'), (e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const cancellable = (q.data?.appointments ?? []).filter((a) => a.allowedActions.includes('CANCEL'));
  const pages = q.data ? Math.max(1, Math.ceil(q.data.totalCount / SIZE)) : 1;

  return (
    <div>
      <h1 className="page-title">{t('panel.clinicAdmin.appointments')}</h1>
      <div className={s.toolbar}>
        <label>
          {t('caAppt.from')}
          <input type="date" className="input" value={f.from} onChange={(e) => set('from', e.target.value)} />
        </label>
        <label>
          {t('caAppt.to')}
          <input type="date" className="input" value={f.to} onChange={(e) => set('to', e.target.value)} />
        </label>
        <label>
          {t('booking.doctor')}
          <select className="input" value={f.doctorId} onChange={(e) => set('doctorId', e.target.value)}>
            <option value="">{t('shares.all')}</option>
            {doctors.data?.map((d) => (
              <option key={d.doctorId} value={d.doctorId}>
                {d.fullName}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t('ca.status')}
          <select className="input" value={f.status} onChange={(e) => set('status', e.target.value)}>
            <option value="">{t('shares.all')}</option>
            {Object.entries(STATUS_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t('booking.stepService')}
          <select className="input" value={f.serviceId} onChange={(e) => set('serviceId', e.target.value)}>
            <option value="">{t('shares.all')}</option>
            {services.data?.services.map((x) => (
              <option key={x.serviceId} value={x.serviceId}>
                {x.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t('ca.searchAria')}
          <input type="search" className="input" placeholder={t('caAppt.searchPh')} defaultValue={f.q} onKeyDown={(e) => e.key === 'Enter' && set('q', (e.target as HTMLInputElement).value.trim())} />
        </label>
      </div>
      {q.data && (
        <div className={s.chips} style={{ marginBottom: 14 }}>
          <span className={s.chip}>{t('caAppt.total', { n: q.data.totalCount })}</span>
          <span className={s.chip}>{t('caAppt.done', { n: q.data.summary.completed })}</span>
          <span className={s.chip}>{t('caAppt.left', { n: q.data.summary.remaining })}</span>
          <span className={s.chip}>{t('caAppt.noShow', { n: q.data.summary.noShow })}</span>
          <span className={s.chip}>{t('caAppt.cancelled', { n: q.data.summary.cancelled })}</span>
        </div>
      )}
      {q.error && <ErrorState message={q.error.message} onRetry={q.reload} />}
      {!q.data && !q.error && <Skeleton height={320} radius={16} />}
      {q.data && q.data.appointments.length === 0 && (
        <div className="card">
          <EmptyState title={t('caAppt.empty')} />
        </div>
      )}
      {q.data && q.data.appointments.length > 0 && (
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    aria-label={t('caAppt.selectAll')}
                    disabled={!cancellable.length}
                    checked={cancellable.length > 0 && cancellable.every((a) => selected.includes(a.appointmentId))}
                    onChange={(e) => setSelected(e.target.checked ? cancellable.map((a) => a.appointmentId) : [])}
                  />
                </th>
                <th>{t('caAppt.number')}</th>
                <th>{t('booking.date')}</th>
                <th>{t('rx.patient')}</th>
                <th>{t('booking.doctor')}</th>
                <th>{t('booking.stepService')}</th>
                <th>{t('ca.status')}</th>
              </tr>
            </thead>
            <tbody>
              {q.data.appointments.map((a) => (
                <tr key={a.appointmentId}>
                  <td>
                    {a.allowedActions.includes('CANCEL') && (
                      <input
                        type="checkbox"
                        aria-label={t('caAppt.select', { ref: a.bookingReference })}
                        checked={selected.includes(a.appointmentId)}
                        onChange={(e) => setSelected((l) => (e.target.checked ? [...l, a.appointmentId] : l.filter((x) => x !== a.appointmentId)))}
                      />
                    )}
                  </td>
                  <td>
                    <Link to={`/clinic-admin/appointments/${a.appointmentId}`} className="mono">
                      {a.bookingReference}
                    </Link>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {formatDate(a.startAt)}, {formatTime(a.startAt)}
                  </td>
                  <td>{a.patient?.fullName}</td>
                  <td>
                    {a.doctor.fullName}
                    {a.clinic.roomNumber && <div className={s.sub}>{t('booking.room', { n: a.clinic.roomNumber })}</div>}
                  </td>
                  <td>{a.service.name}</td>
                  <td>
                    <StatusBadge status={a.status} />
                    {a.pendingReschedule && <div className={s.sub}>{t('caAppt.proposalShort')}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {pages > 1 && (
        <div className={s.actions} style={{ marginTop: 12, justifyContent: 'center', alignItems: 'center' }}>
          <Button size="small" variant="ghost" disabled={f.page <= 1} onClick={() => set('page', String(f.page - 1))}>
            {t('caAppt.prev')}
          </Button>
          <span className="muted" style={{ fontSize: 14 }}>
            {f.page} / {pages}
          </span>
          <Button size="small" variant="ghost" disabled={f.page >= pages} onClick={() => set('page', String(f.page + 1))}>
            {t('caAppt.next')}
          </Button>
        </div>
      )}
      {selected.length > 0 && (
        <div className={s.selectBar}>
          <span>{t('caAppt.selected', { n: selected.length })}</span>
          <span className={s.actions}>
            <Button size="small" variant="ghost" onClick={() => setSelected([])}>
              {t('caAppt.clearSel')}
            </Button>
            <Button size="small" variant="danger" onClick={() => setBulkOpen(true)}>
              {t('caAppt.bulkCancel')}
            </Button>
          </span>
        </div>
      )}
      <Modal
        open={bulkOpen}
        title={t('caAppt.bulkTitle', { n: selected.length })}
        onClose={() => setBulkOpen(false)}
        actions={
          <>
            <Button variant="ghost" onClick={() => setBulkOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="danger" loading={busy} disabled={reason.trim().length < 5} onClick={() => void bulk()}>
              {t('apptDetail.cancelBtn')}
            </Button>
          </>
        }
      >
        <Alert tone="warning">{t('caAppt.bulkWarn')}</Alert>
        <Field label={t('docRx.reason')} htmlFor="bulk-reason">
          <input id="bulk-reason" className="input" value={reason} maxLength={300} onChange={(e) => setReason(e.target.value)} placeholder={t('caAppt.bulkPh')} />
        </Field>
      </Modal>
    </div>
  );
}
