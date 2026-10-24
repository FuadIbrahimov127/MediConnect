import type { ClinicServiceDto, ClinicServicesDto } from '@mediconnect/shared';
import { useState } from 'react';
import { clinicAdminApi } from '../../api/clinicAdmin';
import { ApiClientError } from '../../api/client';
import { useApi } from '../../api/hooks';
import { Alert, Field, Modal } from '../../components/forms';
import { Badge, Button, EmptyState, ErrorState, Skeleton } from '../../components/ui';
import { useToast } from '../../components/Toast';
import s from '../../features/clinicAdmin/clinicAdmin.module.css';
import { tValidation, t } from '../../i18n';
import { formatDate } from '../../lib/format';

// UC-804 — xidmətlər: yalnız mərkəzi kataloqdan seçim (BR-804-02), həkimlərə bağlama (ən azı bir — BR-804-06),
// müddət (slot planlaşdırması), deaktiv/sil (aktiv randevu bloklaması — BR-804-05), kataloqa yeni xidmət tələbi.
// Qiymət sahəsi yoxdur (BR-804-03).

type Editing = { mode: 'add' } | { mode: 'edit'; service: ClinicServiceDto } | null;

export function ClinicServicesPage() {
  const toast = useToast();
  const q = useApi((sig) => clinicAdminApi.services(sig), []);
  const [editing, setEditing] = useState<Editing>(null);
  const [requestOpen, setRequestOpen] = useState(false);

  if (q.error) return <ErrorState message={q.error.message} onRetry={q.reload} />;
  if (!q.data) return <Skeleton height={420} radius={18} />;
  const data = q.data;
  const categories = [...new Set(data.services.map((x) => x.category ?? t('clinicDetail.other')))];

  const toggle = async (svc: ClinicServiceDto) => {
    try {
      q.setData((await clinicAdminApi.updateService(svc.serviceId, { isActive: !svc.isActive })).services);
      toast.success(svc.isActive ? t('caSvc.paused') : t('caSvc.activated'), svc.isActive ? t('caSvc.pausedBody') : undefined);
    } catch (e) {
      toast.error(t('common.failed'), (e as Error).message);
    }
  };
  const remove = async (svc: ClinicServiceDto) => {
    try {
      q.setData(await clinicAdminApi.removeService(svc.serviceId));
      toast.success(t('caSvc.deleted'));
    } catch (e) {
      toast.error(t('caSvc.notDeleted'), (e as Error).message);
    }
  };

  return (
    <div className={s.stack}>
      <div className={s.sectionHead}>
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>
            {t('panel.clinicAdmin.services')}
          </h1>
          <div className="ink-soft" style={{ marginTop: 6 }}>
            {t('caSvc.priceNote')}
          </div>
        </div>
        <div className={s.actions}>
          <Button variant="ghost" onClick={() => setRequestOpen(true)}>
            {t('caSvc.notInCatalog')}
          </Button>
          <Button onClick={() => setEditing({ mode: 'add' })}>{t('caSvc.add')}</Button>
        </div>
      </div>

      {data.services.length === 0 && (
        <div className="card">
          <EmptyState title={t('caSvc.empty')} body={t('caSvc.emptyBody')} />
        </div>
      )}
      {categories.map((cat) => (
        <section key={cat} className={s.section}>
          <h2 className={s.sectionTitle} style={{ textTransform: 'capitalize' }}>
            {cat}
          </h2>
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>{t('booking.stepService')}</th>
                  <th>{t('caSvc.doctorsDuration')}</th>
                  <th className={s.num}>{t('caSvc.upcoming')}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.services
                  .filter((x) => (x.category ?? t('clinicDetail.other')) === cat)
                  .map((svc) => (
                    <tr key={svc.serviceId}>
                      <td>
                        <strong>{svc.name}</strong> {!svc.isActive && <Badge tone="warning">{t('caSvc.pausedBadge')}</Badge>}
                      </td>
                      <td>
                        {svc.doctors.map((d) => (
                          <div key={d.doctorId} className={s.sub} style={{ color: 'var(--ink-soft)' }}>
                            {d.fullName} — {t('caAppt.minDot', { n: d.durationMinutes })}
                            {d.slotDurationMinutes && d.durationMinutes > d.slotDurationMinutes && <span className={s.warnText}>{t('caSvc.slots', { n: Math.ceil(d.durationMinutes / d.slotDurationMinutes) })}</span>}
                          </div>
                        ))}
                      </td>
                      <td className={s.num}>{svc.upcomingAppointments}</td>
                      <td>
                        <div className={s.actions} style={{ flexWrap: 'nowrap' }}>
                          <Button size="small" variant="ghost" onClick={() => setEditing({ mode: 'edit', service: svc })}>
                            {t('caSvc.edit')}
                          </Button>
                          <Button size="small" variant="ghost" onClick={() => void toggle(svc)}>
                            {svc.isActive ? t('caSvc.pause') : t('caDoc.activate')}
                          </Button>
                          <Button size="small" variant="ghost" disabled={svc.upcomingAppointments > 0} title={svc.upcomingAppointments ? t('caSvc.cantDelete') : undefined} onClick={() => void remove(svc)}>
                            {t('common.delete')}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      {data.requests.length > 0 && (
        <section className={s.section}>
          <h2 className={s.sectionTitle}>{t('caSvc.requests')}</h2>
          <div className={s.list}>
            {data.requests.map((r) => (
              <div key={r.requestId} className={s.row}>
                <span>
                  {r.name} <span className={s.sub}>· {formatDate(r.createdAt)}</span>
                </span>
                <Badge tone={r.status === 'PENDING' ? 'accent' : r.status === 'APPROVED' ? 'success' : 'danger'}>
                  {r.status === 'PENDING' ? t('caSvc.reqPending') : r.status === 'APPROVED' ? t('caSvc.reqApproved') : t('caSvc.reqRejected')}
                </Badge>
              </div>
            ))}
          </div>
        </section>
      )}

      {editing && <ServiceDialog data={data} editing={editing} onClose={() => setEditing(null)} onSaved={(d) => (q.setData(d), setEditing(null))} />}
      {requestOpen && <RequestDialog onClose={() => setRequestOpen(false)} onSaved={(d) => (q.setData(d), setRequestOpen(false))} />}
    </div>
  );
}

function ServiceDialog({ data, editing, onClose, onSaved }: { data: ClinicServicesDto; editing: NonNullable<Editing>; onClose: () => void; onSaved: (d: ClinicServicesDto) => void }) {
  const toast = useToast();
  const svc = editing.mode === 'edit' ? editing.service : null;
  const [serviceId, setServiceId] = useState(svc?.serviceId ?? '');
  const [doctors, setDoctors] = useState(svc?.doctors.map((d) => ({ doctorId: d.doctorId, durationMinutes: d.durationMinutes })) ?? []);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const available = data.catalog.filter((c) => !c.added);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = svc ? await clinicAdminApi.updateService(svc.serviceId, { doctors }) : await clinicAdminApi.addService({ serviceId, doctors });
      if (r.warnings.length) toast.error(t('caSvc.savedWarn'), r.warnings.join(' · '));
      else toast.success(t('caDoc.saved'), t('caSvc.savedBody'));
      onSaved(r.services);
    } catch (e) {
      const x = e as ApiClientError;
      setError(x.details?.fields ? Object.values(x.details.fields).map(tValidation).join(' ') : x.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      title={svc ? svc.name : t('caSvc.addTitle')}
      onClose={onClose}
      actions={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button loading={busy} disabled={!serviceId || !doctors.length} onClick={() => void submit()}>
            {t('common.save')}
          </Button>
        </>
      }
    >
      {!svc && (
        <Field label={t('caSvc.pickLabel')} htmlFor="svc-pick">
          <select id="svc-pick" className="input" value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
            <option value="">{t('stars.choose')}</option>
            {[...new Set(available.map((c) => c.category ?? t('clinicDetail.other')))].map((cat) => (
              <optgroup key={cat} label={cat}>
                {available
                  .filter((c) => (c.category ?? t('clinicDetail.other')) === cat)
                  .map((c) => (
                    <option key={c.serviceId} value={c.serviceId}>
                      {c.name}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        </Field>
      )}
      <div className={s.roLabel} style={{ margin: '12px 0 4px' }}>
        {t('caSvc.doctorsLabel')}
      </div>
      <div style={{ maxHeight: 280, overflowY: 'auto' }}>
        {data.doctors.map((d) => {
          const sel = doctors.find((x) => x.doctorId === d.doctorId);
          return (
            <label key={d.doctorId} className={s.svcRow}>
              <input type="checkbox" checked={!!sel} onChange={() => setDoctors((l) => (sel ? l.filter((x) => x.doctorId !== d.doctorId) : [...l, { doctorId: d.doctorId, durationMinutes: 30 }]))} />
              <span>
                {d.fullName}
                <div className={s.sub}>{d.specialties.join(', ')}</div>
              </span>
              {sel ? (
                <select className="input" aria-label={t('caSvc.durationFor', { name: d.fullName })} value={sel.durationMinutes} onChange={(e) => setDoctors((l) => l.map((x) => (x.doctorId === d.doctorId ? { ...x, durationMinutes: Number(e.target.value) } : x)))}>
                  {[10, 15, 20, 30, 45, 60, 90, 120].map((m) => (
                    <option key={m} value={m}>
                      {t('caAppt.minDot', { n: m })}
                    </option>
                  ))}
                </select>
              ) : (
                <span />
              )}
            </label>
          );
        })}
      </div>
      {error && <Alert tone="error">{error}</Alert>}
    </Modal>
  );
}

function RequestDialog({ onClose, onSaved }: { onClose: () => void; onSaved: (d: ClinicServicesDto) => void }) {
  const toast = useToast();
  const [f, setF] = useState({ name: '', category: '', note: '' });
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    try {
      onSaved(await clinicAdminApi.requestService({ name: f.name.trim(), category: f.category.trim() || undefined, note: f.note.trim() || undefined }));
      toast.success(t('caSvc.reqSent'), t('caSvc.reqSentBody'));
    } catch (e) {
      toast.error(t('common.failed'), (e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      open
      title={t('caSvc.reqTitle')}
      onClose={onClose}
      actions={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button loading={busy} disabled={f.name.trim().length < 3} onClick={() => void submit()}>
            {t('reviewList.send')}
          </Button>
        </>
      }
    >
      <Field label={t('caSvc.svcName')} htmlFor="rq-name">
        <input id="rq-name" className="input" value={f.name} maxLength={150} onChange={(e) => setF((x) => ({ ...x, name: e.target.value }))} />
      </Field>
      <Field label={t('caSvc.catOpt')} htmlFor="rq-cat">
        <input id="rq-cat" className="input" value={f.category} maxLength={80} onChange={(e) => setF((x) => ({ ...x, category: e.target.value }))} placeholder={t('caSvc.catPh')} />
      </Field>
      <Field label={t('rxDetail.noteOptional')} htmlFor="rq-note">
        <textarea id="rq-note" className="input" rows={3} maxLength={500} value={f.note} onChange={(e) => setF((x) => ({ ...x, note: e.target.value }))} />
      </Field>
    </Modal>
  );
}
