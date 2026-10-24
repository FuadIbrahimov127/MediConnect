import { type ClinicDoctorDetailDto } from '@mediconnect/shared';
import { t } from '../../i18n';
import { DOCTOR_CLINIC_STATUS_LABEL } from '../../i18n/labels';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { clinicAdminApi, readAsDataUrl, type DataUrlFile } from '../../api/clinicAdmin';
import { ApiClientError } from '../../api/client';
import { catalogApi } from '../../api/endpoints';
import { useApi } from '../../api/hooks';
import { Alert, Field, Modal } from '../../components/forms';
import { Avatar, Badge, Button, ButtonLink, EmptyState, ErrorState, Skeleton } from '../../components/ui';
import { useToast } from '../../components/Toast';
import s from '../../features/clinicAdmin/clinicAdmin.module.css';
import { formatDate, formatDateTime } from '../../lib/format';
import { DC_TONE } from './ClinicDoctorsPage';

// UC-802 — həkimin detalı: status (passiv/aktiv — alt 2/3), lisenziya yenilənməsi (alt 5), xidmətlər və kabinet
// (FR-802-29, EF-803-5), dəvətin təkrar göndərilməsi (alt 6), klinikadan çıxarma (alt 4, EF-802-4).
// Tibbi məzmun yoxdur (BR-802-10).

type Dialog = null | 'status' | 'license' | 'services' | 'remove';

export function ClinicDoctorDetailPage() {
  const { doctorId = '' } = useParams();
  const q = useApi((sig) => clinicAdminApi.doctor(doctorId, sig), [doctorId]);
  const [dialog, setDialog] = useState<Dialog>(null);
  const toast = useToast();

  if (q.error?.errorType === 'NotFound')
    return (
      <div className="card">
        <EmptyState title={t('ca.noDoctors')} body={t('caDoc.notHere')} action={<ButtonLink to="/clinic-admin/doctors">{t('panel.clinicAdmin.doctors')}</ButtonLink>} />
      </div>
    );
  if (q.error) return <ErrorState message={q.error.message} onRetry={q.reload} />;
  if (!q.data) return <Skeleton height={420} radius={18} />;
  const d = q.data;
  const can = (x: ClinicDoctorDetailDto['allowedActions'][number]) => d.allowedActions.includes(x);
  const done = (next: ClinicDoctorDetailDto, warnings: string[] = [], msg = t('caDoc.saved')) => {
    q.setData(next);
    setDialog(null);
    if (warnings.length) toast.error(msg, warnings.join(' '));
    else toast.success(msg);
  };
  const resend = async () => {
    try {
      done(await clinicAdminApi.resendInvite(d.doctorId), [], t('caDoc.resent'));
    } catch (e) {
      toast.error(t('common.failed'), (e as Error).message);
    }
  };

  return (
    <div className={s.stack}>
      <nav style={{ fontSize: 13, color: 'var(--muted)' }}>
        <Link to="/clinic-admin/doctors" style={{ color: 'var(--muted)' }}>
          {t('panel.clinicAdmin.doctors')}
        </Link>{' '}
        · {d.fullName}
      </nav>
      <div className={s.sectionHead}>
        <div className={s.nameCell}>
          <Avatar name={d.fullName.replace('Dr. ', '')} src={d.photoUrl} size={64} />
          <div>
            <h1 className="page-title" style={{ margin: 0 }}>
              {d.fullName}
            </h1>
            <div className="ink-soft">{d.specialties.join(', ')}</div>
            <div style={{ marginTop: 6 }}>
              <Badge tone={DC_TONE[d.status]}>{DOCTOR_CLINIC_STATUS_LABEL[d.status]}</Badge> {d.inactiveReason && <span className={s.sub}>{d.inactiveReason}</span>}
            </div>
          </div>
        </div>
        <div className={s.actions}>
          {can('EDIT_SCHEDULE') && <ButtonLink to={`/clinic-admin/doctors/${d.doctorId}/schedule`}>{t('caDoc.viewSchedule')}</ButtonLink>}
          {can('RESEND_INVITE') && <Button onClick={() => void resend()}>{t('caDoc.resend')}</Button>}
          {can('DEACTIVATE') && (
            <Button variant="ghost" onClick={() => setDialog('status')}>
              {t('caDoc.deactivate')}
            </Button>
          )}
          {can('ACTIVATE') && <Button onClick={() => setDialog('status')}>{t('caDoc.activate')}</Button>}
        </div>
      </div>

      {d.status === 'INVITED' && (
        <Alert tone="info">
          {t('caDoc.inviteInfo', { phone: d.mobileNumber, until: d.inviteExpiresAt ? t('caDoc.inviteUntil', { date: formatDateTime(d.inviteExpiresAt) }) : '' })}
        </Alert>
      )}
      {d.status === 'ACTIVE' && !d.profileCompleted && <Alert tone="warning">{t('caDoc.profileIncomplete')}</Alert>}
      {d.licenseDaysLeft <= 30 && (
        <Alert tone={d.licenseDaysLeft < 0 ? 'error' : 'warning'}>
          {d.licenseDaysLeft < 0 ? t('caDoc.licExpired', { date: formatDate(d.licenseExpiryDate) }) : t('caDoc.licSoon', { date: formatDate(d.licenseExpiryDate), n: d.licenseDaysLeft })}{' '}
          {can('RENEW_LICENSE') && (
            <button type="button" className={s.chip} style={{ cursor: 'pointer' }} onClick={() => setDialog('license')}>
              {t('caDoc.renewLicense')}
            </button>
          )}
        </Alert>
      )}
      {d.roomConflict && <Alert tone="warning">{d.roomConflict}</Alert>}

      <div className={s.twoCol}>
        <section className={s.section}>
          <h2 className={s.sectionTitle}>{t('caDoc.info')}</h2>
          <div className={s.ro}>
            {(
              [
                [t('caDoc.mobile'), d.mobileNumber],
                [t('docProf.license'), d.licenseNumber],
                [t('caDoc.licenseEnds'), formatDate(d.licenseExpiryDate)],
                [t('ca.room'), d.roomNumber ?? '—'],
                [t('caDoc.upcoming'), String(d.upcomingCount)],
                [t('ca.visits30'), String(d.completedLast30)],
                [t('ca.rating'), d.avgRating ? t('caDoc.ratingVal', { r: d.avgRating.toFixed(1), n: d.reviewCount }) : t('directory.newDoctor')],
                [t('caDoc.otherClinics'), d.otherClinics.join(', ') || '—'],
              ] as const
            ).map(([k, v]) => (
              <div key={k}>
                <div className={s.roLabel}>{k}</div>
                <div className={s.roValue}>{v}</div>
              </div>
            ))}
          </div>
          {can('RENEW_LICENSE') && d.licenseDaysLeft > 30 && (
            <div>
              <Button size="small" variant="ghost" onClick={() => setDialog('license')}>
                {t('caDoc.renewLicense')}
              </Button>
            </div>
          )}
          <div>
            <div className={s.roLabel} style={{ marginBottom: 6 }}>
              {t('caInvite.documents')}
            </div>
            {d.documents.length === 0 ? (
              <span className="muted">{t('caDoc.notUploaded')}</span>
            ) : (
              <div className={s.list}>
                {d.documents.map((x) => (
                  <div key={x.credentialId} className={s.row}>
                    <span>
                      {x.kind === 'LICENSE' ? t('docProf.license') : t('caInvite.diploma')} · {x.fileName}
                    </span>
                    <span className={s.sub}>{formatDate(x.uploadedAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className={s.section}>
          <div className={s.sectionHead}>
            <h2 className={s.sectionTitle}>{t('caDoc.servicesRoom')}</h2>
            {d.status !== 'REMOVED' && (
              <Button size="small" variant="ghost" onClick={() => setDialog('services')}>
                {t('review.edit')}
              </Button>
            )}
          </div>
          <div className={s.list}>
            {d.services.filter((x) => x.isActive).map((x) => (
              <div key={x.serviceId} className={s.row}>
                <span>{x.name}</span>
                <span className={s.sub}>{t('caAppt.minDot', { n: x.durationMinutes })}</span>
              </div>
            ))}
            {!d.services.some((x) => x.isActive) && <span className="muted">{t('caDoc.noActiveSvc')}</span>}
          </div>
          {can('REMOVE') && (
            <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--line)' }}>
              <Button variant="danger" size="small" onClick={() => setDialog('remove')}>
                {d.status === 'INVITED' ? t('caDoc.cancelInvite') : t('caDoc.removeFromClinic')}
              </Button>
            </div>
          )}
        </section>
      </div>

      {dialog === 'status' && <StatusDialog d={d} onClose={() => setDialog(null)} onDone={(x, w) => done(x, w, d.status === 'ACTIVE' ? t('caDoc.deactivated') : t('caDoc.activated'))} />}
      {dialog === 'license' && <LicenseDialog d={d} onClose={() => setDialog(null)} onDone={(x, w) => done(x, w, t('caDoc.licenseRenewed'))} />}
      {dialog === 'services' && <ServicesDialog d={d} onClose={() => setDialog(null)} onDone={(x, w) => done(x, w)} />}
      {dialog === 'remove' && <RemoveDialog d={d} onClose={() => setDialog(null)} />}
    </div>
  );
}

type DoneFn = (d: ClinicDoctorDetailDto, warnings: string[]) => void;

function StatusDialog({ d, onClose, onDone }: { d: ClinicDoctorDetailDto; onClose: () => void; onDone: DoneFn }) {
  const toast = useToast();
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const next = d.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
  const submit = async () => {
    setBusy(true);
    try {
      const r = await clinicAdminApi.updateDoctor(d.doctorId, { status: next, reason: reason.trim() || undefined });
      onDone(r.doctor, r.warnings);
    } catch (e) {
      toast.error(t('common.failed'), (e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      open
      title={next === 'INACTIVE' ? t('caDoc.deactivateTitle') : t('caDoc.activateTitle')}
      onClose={onClose}
      actions={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button variant={next === 'INACTIVE' ? 'danger' : 'primary'} loading={busy} onClick={() => void submit()}>
            {next === 'INACTIVE' ? t('caDoc.deactivate') : t('caDoc.activate')}
          </Button>
        </>
      }
    >
      <p className="ink-soft" style={{ marginTop: 0 }}>
        {next === 'INACTIVE'
          ? t('caDoc.deactivateInfo')
          : t('caDoc.activateInfo')}
      </p>
      <Field label={t('caDoc.reasonToDoctor')} htmlFor="st-reason">
        <input id="st-reason" className="input" value={reason} maxLength={300} onChange={(e) => setReason(e.target.value)} />
      </Field>
    </Modal>
  );
}

function LicenseDialog({ d, onClose, onDone }: { d: ClinicDoctorDetailDto; onClose: () => void; onDone: DoneFn }) {
  const toast = useToast();
  const [date, setDate] = useState('');
  const [file, setFile] = useState<DataUrlFile | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    try {
      const r = await clinicAdminApi.updateDoctor(d.doctorId, { licenseExpiryDate: date, licenseDocument: file });
      onDone(r.doctor, r.warnings);
    } catch (e) {
      toast.error(t('common.failed'), (e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      open
      title={t('caDoc.renewTitle')}
      onClose={onClose}
      actions={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button loading={busy} disabled={!date || !file} onClick={() => void submit()}>
            {t('caDoc.renew')}
          </Button>
        </>
      }
    >
      <p className="ink-soft" style={{ marginTop: 0 }}>
        {t('caDoc.currentLicense', { n: d.licenseNumber, date: formatDate(d.licenseExpiryDate) })}
      </p>
      <Field label={t('caDoc.newExpiry')} htmlFor="lic-date">
        <input id="lic-date" type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
      </Field>
      <Field label={t('caDoc.newLicenseDoc')} htmlFor="lic-file" hint={t('caInvite.fileHint')}>
        <input id="lic-file" type="file" className="input" accept="application/pdf,image/png,image/jpeg" onChange={(e) => e.target.files?.[0] && void readAsDataUrl(e.target.files[0]).then(setFile)} />
      </Field>
    </Modal>
  );
}

function ServicesDialog({ d, onClose, onDone }: { d: ClinicDoctorDetailDto; onClose: () => void; onDone: DoneFn }) {
  const toast = useToast();
  const catalog = useApi((sig) => catalogApi.services(sig), []);
  const [room, setRoom] = useState(d.roomNumber ?? '');
  const [svcs, setSvcs] = useState(d.services.filter((x) => x.isActive).map((x) => ({ serviceId: x.serviceId, durationMinutes: x.durationMinutes })));
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    try {
      const r = await clinicAdminApi.updateDoctor(d.doctorId, { roomNumber: room.trim() || null, services: svcs });
      onDone(r.doctor, r.warnings);
    } catch (e) {
      toast.error(t('common.failed'), (e as ApiClientError).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      open
      title={t('caDoc.servicesRoom')}
      onClose={onClose}
      actions={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button loading={busy} disabled={!svcs.length} onClick={() => void submit()}>
            {t('common.save')}
          </Button>
        </>
      }
    >
      <Field label={t('caDoc.roomNo')} htmlFor="room-e">
        <input id="room-e" className="input" style={{ maxWidth: 160 }} value={room} maxLength={20} onChange={(e) => setRoom(e.target.value)} />
      </Field>
      <div style={{ maxHeight: 300, overflowY: 'auto' }}>
        {(catalog.data ?? []).map((c) => {
          const sel = svcs.find((x) => x.serviceId === c.id);
          return (
            <label key={c.id} className={s.svcRow}>
              <input type="checkbox" checked={!!sel} onChange={() => setSvcs((l) => (sel ? l.filter((x) => x.serviceId !== c.id) : [...l, { serviceId: c.id, durationMinutes: 30 }]))} />
              <span>{c.name}</span>
              {sel ? (
                <select className="input" aria-label={t('caInvite.svcDurAria', { name: c.name })} value={sel.durationMinutes} onChange={(e) => setSvcs((l) => l.map((x) => (x.serviceId === c.id ? { ...x, durationMinutes: Number(e.target.value) } : x)))}>
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
      <p className="muted" style={{ fontSize: 13, marginBottom: 0 }}>
        {t('caDoc.durationNote')}
      </p>
    </Modal>
  );
}

function RemoveDialog({ d, onClose }: { d: ClinicDoctorDetailDto; onClose: () => void }) {
  const toast = useToast();
  const navigate = useNavigate();
  const [reason, setReason] = useState('');
  const [conflicts, setConflicts] = useState<{ appointmentId: string; date: string; startTime: string; patientName: string }[] | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    try {
      const r = await clinicAdminApi.removeDoctor(d.doctorId, { reason: reason.trim(), ...(conflicts ? { conflictResolution: 'CANCEL_AND_NOTIFY' as const } : {}) });
      toast.success(d.status === 'INVITED' ? t('caDoc.inviteCancelled') : t('caDoc.removed'), r.cancelledCount ? t('caDoc.removedBody', { n: r.cancelledCount }) : undefined);
      navigate('/clinic-admin/doctors');
    } catch (e) {
      const x = e as ApiClientError;
      if (x.errorType === 'HasActiveAppointments') setConflicts((x.details?.appointments as typeof conflicts) ?? []);
      else toast.error(t('common.failed'), x.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      open
      title={d.status === 'INVITED' ? t('caDoc.cancelInvite') : t('caDoc.removeFromClinic')}
      onClose={onClose}
      actions={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button variant="danger" loading={busy} disabled={reason.trim().length < 5} onClick={() => void submit()}>
            {conflicts ? t('caDoc.cancelAndRemove') : t('common.confirm')}
          </Button>
        </>
      }
    >
      {conflicts ? (
        <Alert tone="warning">
          {t('caDoc.hasAppts', { n: conflicts.length })}
          <ul style={{ margin: '8px 0 0', paddingLeft: 18, maxHeight: 180, overflowY: 'auto' }}>
            {conflicts.map((a) => (
              <li key={a.appointmentId}>
                {formatDate(a.date)}, {a.startTime} — {a.patientName}
              </li>
            ))}
          </ul>
        </Alert>
      ) : (
        <p className="ink-soft" style={{ marginTop: 0 }}>
          {t('caDoc.removeInfo')}
        </p>
      )}
      <Field label={t('caDoc.reasonAudit')} htmlFor="rm-reason">
        <input id="rm-reason" className="input" value={reason} maxLength={300} onChange={(e) => setReason(e.target.value)} />
      </Field>
    </Modal>
  );
}
