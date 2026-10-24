import { CLINIC_DOCUMENT_KIND, type AdminClinicDetailDto, type ClinicAction, type ClinicDocumentKind } from '@mediconnect/shared';
import { CLINIC_DOCUMENT_LABEL, CLINIC_STATUS_LABEL, CLINIC_TYPE_LABEL, DOCTOR_CLINIC_STATUS_LABEL } from '../../i18n/labels';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { adminApi, openAuthorized } from '../../api/admin';
import { ApiClientError } from '../../api/client';
import { readAsDataUrl, type DataUrlFile } from '../../api/clinicAdmin';
import { useApi } from '../../api/hooks';
import { Alert, Field, Modal } from '../../components/forms';
import { Badge, Button, ButtonLink, EmptyState, ErrorState, Skeleton } from '../../components/ui';
import { useToast } from '../../components/Toast';
import s from '../../features/clinicAdmin/clinicAdmin.module.css';
import { formatDate, formatDateTime } from '../../lib/format';
import { t, type TKey } from '../../i18n';
import { CLINIC_TONE } from './AdminClinicsPage';

// UC-901 — klinikanın detalı və verifikasiyası: sənədlər, reyestr yoxlaması, adminlər, status əməliyyatları
// (təsdiq, əlavə sənəd tələbi, rədd, dayandırma, bərpa, deaktivləşdirmə), lisenziyanın yenilənməsi, qərar tarixçəsi.

const ACTIONS = ['VERIFY', 'REQUEST_DOCUMENTS', 'REJECT', 'SUSPEND', 'REACTIVATE', 'DEACTIVATE'] as const satisfies readonly ClinicAction[];
const ACTION_LABEL = Object.fromEntries(ACTIONS.map((a) => [a, t(`admClinic.a${a}` as TKey)])) as Record<ClinicAction, string>;
const ACTION_HINT = Object.fromEntries(ACTIONS.map((a) => [a, t(`admClinic.h${a}` as TKey)])) as Record<ClinicAction, string>;
const HISTORY_EVENTS = ['CREATE_CLINIC', 'VERIFY_CLINIC', 'REQUEST_CLINIC_DOCUMENTS', 'REJECT_CLINIC', 'SUSPEND_CLINIC', 'REACTIVATE_CLINIC', 'DEACTIVATE_CLINIC', 'RENEW_CLINIC_LICENSE', 'AUTO_SUSPEND_CLINIC_LICENSE', 'ADD_CLINIC_ADMIN', 'ADD_CLINIC_DOCUMENT'];
const HISTORY_LABEL: Record<string, string> = Object.fromEntries(HISTORY_EVENTS.map((e) => [e, t(`admClinic.ev${e}` as TKey)]));

export function AdminClinicDetailPage() {
  const { clinicId = '' } = useParams();
  const toast = useToast();
  const q = useApi((sig) => adminApi.clinic(clinicId, sig), [clinicId]);
  const [action, setAction] = useState<ClinicAction | null>(null);
  const [dialog, setDialog] = useState<null | 'license' | 'admin' | 'doc'>(null);

  if (q.error?.errorType === 'NotFound')
    return (
      <div className="card">
        <EmptyState title={t('adm.noClinic')} action={<ButtonLink to="/admin/clinics">{t('panel.admin.clinics')}</ButtonLink>} />
      </div>
    );
  if (q.error) return <ErrorState message={q.error.message} onRetry={q.reload} />;
  if (!q.data) return <Skeleton height={480} radius={18} />;
  const c = q.data;
  const done = (d: AdminClinicDetailDto, msg: string) => (q.setData(d), setAction(null), setDialog(null), toast.success(msg));
  const kinds = new Set(c.documents.map((d) => d.kind));

  return (
    <div className={s.stack}>
      <nav style={{ fontSize: 13, color: 'var(--muted)' }}>
        <Link to="/admin/clinics" style={{ color: 'var(--muted)' }}>
          {t('panel.admin.clinics')}
        </Link>{' '}
        · {c.name}
      </nav>
      <div className={s.sectionHead}>
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>
            {c.name}
          </h1>
          <div className="ink-soft" style={{ marginTop: 4 }}>
            {CLINIC_TYPE_LABEL[c.clinicType]} · {c.cityName} · <Badge tone={CLINIC_TONE[c.status]}>{CLINIC_STATUS_LABEL[c.status]}</Badge>
          </div>
        </div>
        <div className={s.actions}>
          {c.allowedActions.map((a) => (
            <Button key={a} variant={a === 'VERIFY' || a === 'REACTIVATE' ? 'primary' : a === 'REQUEST_DOCUMENTS' ? 'ghost' : 'danger'} onClick={() => setAction(a)}>
              {ACTION_LABEL[a]}
            </Button>
          ))}
        </div>
      </div>
      {c.status === 'PENDING_VERIFICATION' && (
        <Alert tone="info">
          {t('admClinic.checklist', { reg: kinds.has('REGISTRATION') ? '✓' : '✕', lic: kinds.has('LICENSE') ? '✓' : '✕', registry: c.registryCheck.found ? '✓' : '✕' })}
        </Alert>
      )}
      {c.licenseDaysLeft <= 30 && c.status !== 'INACTIVE' && (
        <Alert tone={c.licenseDaysLeft < 0 ? 'error' : 'warning'}>
          {c.licenseDaysLeft < 0 ? t('admClinic.licExpired', { date: formatDate(c.licenseExpiryDate) }) : t('admClinic.licSoon', { date: formatDate(c.licenseExpiryDate), n: c.licenseDaysLeft })}
        </Alert>
      )}

      <div className={s.twoCol}>
        <section className={s.section}>
          <h2 className={s.sectionTitle}>{t('caDoc.info')}</h2>
          <div className={s.ro}>
            {(
              [
                [t('caProf.regNo'), c.registrationNumber],
                [t('docProf.license'), c.licenseNumber],
                [t('caDoc.licenseEnds'), formatDate(c.licenseExpiryDate)],
                [t('booking.address'), [c.district, c.address].filter(Boolean).join(', ')],
                [t('auth.phone'), c.phone],
                ['Email', c.email ?? '—'],
                [t('booking.doctor'), String(c.doctorCount)],
                [t('caSvc.upcoming'), String(c.upcomingAppointments)],
                [t('caProf.booking'), c.acceptingAppointments ? t('admClinic.acceptOpen') : t('admClinic.acceptClosed')],
                [t('admClinic.verification'), c.verifiedAt ? `${c.verifiedBy ?? ''}, ${formatDateTime(c.verifiedAt)}` : '—'],
              ] as const
            ).map(([k, v]) => (
              <div key={k}>
                <div className={s.roLabel}>{k}</div>
                <div className={s.roValue}>{v}</div>
              </div>
            ))}
          </div>
          <Alert tone={c.registryCheck.found ? 'success' : 'warning'}>{t('admClinic.registry', { msg: c.registryCheck.message })}</Alert>
          {c.status !== 'INACTIVE' && (
            <div>
              <Button size="small" variant="ghost" onClick={() => setDialog('license')}>
                {t('caDoc.renewLicense')}
              </Button>
            </div>
          )}
        </section>

        <div className={s.stack}>
          <section className={s.section}>
            <div className={s.sectionHead}>
              <h2 className={s.sectionTitle}>{t('caInvite.documents')}</h2>
              <Button size="small" variant="ghost" onClick={() => setDialog('doc')}>
                {t('admClinic.addDoc')}
              </Button>
            </div>
            {c.documents.length === 0 ? (
              <span className="muted">{t('admClinic.noDocs')}</span>
            ) : (
              <div className={s.list}>
                {c.documents.map((d) => (
                  <button
                    key={d.documentId}
                    type="button"
                    className={s.row}
                    style={{ cursor: 'pointer', textAlign: 'left', font: 'inherit' }}
                    onClick={() => void openAuthorized(`/v1/admin/clinics/${c.clinicId}/documents/${d.documentId}`).catch((e: Error) => toast.error(t('admClinic.notOpened'), e.message))}
                  >
                    <span>
                      <strong>{CLINIC_DOCUMENT_LABEL[d.kind]}</strong>
                      <div className={s.sub}>{d.fileName}</div>
                    </span>
                    <span className={s.sub}>{formatDate(d.uploadedAt)} · {t('admClinic.open')}</span>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className={s.section}>
            <div className={s.sectionHead}>
              <h2 className={s.sectionTitle}>{t('admClinic.admins')}</h2>
              {c.status !== 'INACTIVE' && (
                <Button size="small" variant="ghost" onClick={() => setDialog('admin')}>
                  {t('admClinic.addAdmin')}
                </Button>
              )}
            </div>
            <div className={s.list}>
              {c.admins.map((a) => (
                <div key={a.userId} className={s.row}>
                  <span>
                    <Link to={`/admin/users/${a.userId}`}>{a.fullName}</Link>
                    <div className={s.sub}>{a.mobileNumber}</div>
                  </span>
                  <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Badge tone={a.status === 'ACTIVE' ? 'success' : a.status === 'INVITED' ? 'accent' : 'neutral'}>{a.status === 'ACTIVE' ? DOCTOR_CLINIC_STATUS_LABEL.ACTIVE : a.status === 'INVITED' ? DOCTOR_CLINIC_STATUS_LABEL.INVITED : DOCTOR_CLINIC_STATUS_LABEL.REMOVED}</Badge>
                    {a.status === 'INVITED' && (
                      <Button size="small" variant="ghost" onClick={() => void adminApi.resendAdminInvite(c.clinicId, a.userId).then((d) => done(d, t('caDoc.resent'))).catch((e: Error) => toast.error(t('common.failed'), e.message))}>
                        {t('admClinic.resendShort')}
                      </Button>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <section className={s.section}>
        <h2 className={s.sectionTitle}>{t('admClinic.history')}</h2>
        {c.history.length === 0 ? (
          <span className="muted">{t('docAppt.noNote')}</span>
        ) : (
          <div className={s.list}>
            {c.history.map((h, i) => (
              <div key={i} className={s.row}>
                <span>
                  <strong>{HISTORY_LABEL[h.action] ?? h.action}</strong>
                  {h.reason && <div className={s.sub}>{h.reason}</div>}
                </span>
                <span className={s.sub}>
                  {h.actorName} · {formatDateTime(h.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {action && <ActionDialog c={c} action={action} onClose={() => setAction(null)} onDone={(d) => done(d, t('admClinic.actionDone', { action: ACTION_LABEL[action] }))} />}
      {dialog === 'license' && <LicenseDialog c={c} onClose={() => setDialog(null)} onDone={(d) => done(d, t('caDoc.licenseRenewed'))} />}
      {dialog === 'admin' && <AdminDialog c={c} onClose={() => setDialog(null)} onDone={(d) => done(d, t('admClinic.adminInvited'))} />}
      {dialog === 'doc' && <DocDialog c={c} onClose={() => setDialog(null)} onDone={(d) => done(d, t('admClinic.evADD_CLINIC_DOCUMENT'))} />}
    </div>
  );
}

type DoneFn = (d: AdminClinicDetailDto) => void;

function ActionDialog({ c, action, onClose, onDone }: { c: AdminClinicDetailDto; action: ClinicAction; onClose: () => void; onDone: DoneFn }) {
  const [reason, setReason] = useState('');
  const [conflict, setConflict] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      onDone(await adminApi.clinicAction(c.clinicId, { action, reason: reason.trim(), ...(conflict ? { conflictResolution: 'CANCEL_AND_NOTIFY' as const } : {}) }));
    } catch (e) {
      const x = e as ApiClientError;
      if (x.errorType === 'HasActiveAppointments') setConflict(Number(x.details?.count ?? 0));
      setError(x.message);
    } finally {
      setBusy(false);
    }
  };
  const danger = action === 'REJECT' || action === 'SUSPEND' || action === 'DEACTIVATE';
  return (
    <Modal
      open
      title={`${ACTION_LABEL[action]} — ${c.name}`}
      onClose={onClose}
      actions={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} loading={busy} disabled={reason.trim().length < 5} onClick={() => void submit()}>
            {conflict ? t('admClinic.cancelAndGo', { n: conflict }) : ACTION_LABEL[action]}
          </Button>
        </>
      }
    >
      <p className="ink-soft" style={{ marginTop: 0 }}>
        {ACTION_HINT[action]}
      </p>
      <Field label={t('admClinic.reasonAudit')} htmlFor="ca-reason">
        <textarea id="ca-reason" className="input" rows={3} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} />
      </Field>
      {error && <Alert tone={conflict ? 'warning' : 'error'}>{error}</Alert>}
    </Modal>
  );
}

function LicenseDialog({ c, onClose, onDone }: { c: AdminClinicDetailDto; onClose: () => void; onDone: DoneFn }) {
  const toast = useToast();
  const [date, setDate] = useState('');
  const [file, setFile] = useState<DataUrlFile | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    try {
      onDone(await adminApi.renewLicense(c.clinicId, { licenseExpiryDate: date, document: file! }));
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
        {t('admClinic.renewInfo')}
      </p>
      <Field label={t('caDoc.newExpiry')} htmlFor="cl-date">
        <input id="cl-date" type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
      </Field>
      <Field label={t('caDoc.newLicenseDoc')} htmlFor="cl-file">
        <input id="cl-file" type="file" className="input" accept="application/pdf,image/png,image/jpeg" onChange={(e) => e.target.files?.[0] && void readAsDataUrl(e.target.files[0]).then(setFile)} />
      </Field>
    </Modal>
  );
}

function AdminDialog({ c, onClose, onDone }: { c: AdminClinicDetailDto; onClose: () => void; onDone: DoneFn }) {
  const [p, setP] = useState({ fin: '', mobileNumber: '+994', firstName: '', lastName: '' });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      onDone(await adminApi.addAdmin(c.clinicId, { ...p, fin: p.fin.toUpperCase() }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      open
      title={t('admClinic.assignAdmin')}
      onClose={onClose}
      actions={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button loading={busy} disabled={p.fin.length !== 7 || p.firstName.length < 2 || p.lastName.length < 2} onClick={() => void submit()}>
            {t('caInvite.send')}
          </Button>
        </>
      }
    >
      <div className={s.formGrid}>
        <Field label="FIN" htmlFor="ad-fin">
          <input id="ad-fin" className="input mono" maxLength={7} value={p.fin} onChange={(e) => setP((x) => ({ ...x, fin: e.target.value.toUpperCase() }))} />
        </Field>
        <Field label={t('caDoc.mobile')} htmlFor="ad-mob">
          <input id="ad-mob" className="input" maxLength={13} value={p.mobileNumber} onChange={(e) => setP((x) => ({ ...x, mobileNumber: e.target.value }))} />
        </Field>
        <Field label={t('auth.firstName')} htmlFor="ad-fn">
          <input id="ad-fn" className="input" value={p.firstName} onChange={(e) => setP((x) => ({ ...x, firstName: e.target.value }))} />
        </Field>
        <Field label={t('auth.lastName')} htmlFor="ad-ln">
          <input id="ad-ln" className="input" value={p.lastName} onChange={(e) => setP((x) => ({ ...x, lastName: e.target.value }))} />
        </Field>
      </div>
      {error && <Alert tone="error">{error}</Alert>}
    </Modal>
  );
}

function DocDialog({ c, onClose, onDone }: { c: AdminClinicDetailDto; onClose: () => void; onDone: DoneFn }) {
  const toast = useToast();
  const [kind, setKind] = useState<ClinicDocumentKind>('LICENSE');
  const [file, setFile] = useState<DataUrlFile | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    try {
      onDone(await adminApi.addDocument(c.clinicId, { ...file!, kind }));
    } catch (e) {
      toast.error(t('rep.notDownloaded'), (e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      open
      title={t('admClinic.addDocTitle')}
      onClose={onClose}
      actions={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button loading={busy} disabled={!file} onClick={() => void submit()}>
            {t('common.download')}
          </Button>
        </>
      }
    >
      <Field label={t('caProf.type')} htmlFor="doc-kind">
        <select id="doc-kind" className="input" value={kind} onChange={(e) => setKind(e.target.value as ClinicDocumentKind)}>
          {CLINIC_DOCUMENT_KIND.map((k) => (
            <option key={k} value={k}>
              {CLINIC_DOCUMENT_LABEL[k]}
            </option>
          ))}
        </select>
      </Field>
      <Field label={t('admClinic.file')} htmlFor="doc-file" hint={t('caInvite.fileHint')}>
        <input id="doc-file" type="file" className="input" accept="application/pdf,image/png,image/jpeg" onChange={(e) => e.target.files?.[0] && void readAsDataUrl(e.target.files[0]).then(setFile)} />
      </Field>
    </Modal>
  );
}
