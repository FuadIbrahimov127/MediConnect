import type { DoctorLookupDto } from '@mediconnect/shared';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { clinicAdminApi, readAsDataUrl, type DataUrlFile } from '../../api/clinicAdmin';
import { ApiClientError } from '../../api/client';
import { catalogApi } from '../../api/endpoints';
import { useApi } from '../../api/hooks';
import { Alert, Field } from '../../components/forms';
import { Button } from '../../components/ui';
import { useToast } from '../../components/Toast';
import s from '../../features/clinicAdmin/clinicAdmin.module.css';
import { tValidation, t } from '../../i18n';

// UC-802 — həkim əlavə etmə: FIN üzrə yoxlama (FR-802-02) → yeni istifadəçi və ya mövcud həkimin yeni klinika
// bağlantısı (alt 1) → lisenziya, ixtisas, sənədlər, kabinet, xidmətlər → SMS dəvəti (7 gün).

type Svc = { serviceId: string; durationMinutes: number };

export function DoctorInvitePage() {
  const toast = useToast();
  const navigate = useNavigate();
  const specialties = useApi((sig) => catalogApi.specialties(sig), []);
  const catalog = useApi((sig) => catalogApi.services(sig), []);
  const [fin, setFin] = useState('');
  const [mobile, setMobile] = useState('+994');
  const [found, setFound] = useState<DoctorLookupDto | null>(null);
  const [f, setF] = useState({ firstName: '', lastName: '', licenseNumber: '', licenseExpiryDate: '', roomNumber: '' });
  const [specIds, setSpecIds] = useState<string[]>([]);
  const [services, setServices] = useState<Svc[]>([]);
  const [docs, setDocs] = useState<(DataUrlFile & { kind: 'LICENSE' | 'DIPLOMA' })[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const lookup = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      setFound(await clinicAdminApi.lookup(fin.trim().toUpperCase()));
    } catch (err) {
      const x = err as ApiClientError;
      if (x.details?.fields) setErrors(x.details.fields);
      toast.error(t('caInvite.notChecked'), x.message);
    } finally {
      setBusy(false);
    }
  };
  const addDoc = async (kind: 'LICENSE' | 'DIPLOMA', file: File | undefined) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) return toast.error(t('caInvite.tooBig'), t('caInvite.max10'));
    const d = await readAsDataUrl(file);
    setDocs((l) => [...l.filter((x) => x.kind !== kind || kind === 'DIPLOMA'), { ...d, kind }]);
  };
  const toggleService = (id: string) => setServices((l) => (l.some((x) => x.serviceId === id) ? l.filter((x) => x.serviceId !== id) : [...l, { serviceId: id, durationMinutes: 30 }]));
  const existing = found?.doctor ?? null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      const body = existing
        ? { fin: fin.trim().toUpperCase(), mobileNumber: mobile.trim(), roomNumber: f.roomNumber || null, services, documents: docs }
        : { fin: fin.trim().toUpperCase(), mobileNumber: mobile.trim(), ...f, roomNumber: f.roomNumber || null, specialtyIds: specIds, services, documents: docs };
      const d = await clinicAdminApi.invite(body);
      toast.success(t('caInvite.sent'), t('caInvite.sentBody', { name: d.fullName }));
      navigate(`/clinic-admin/doctors/${d.doctorId}`);
    } catch (err) {
      const x = err as ApiClientError;
      if (x.details?.fields) setErrors(x.details.fields);
      toast.error(t('caInvite.notSent'), x.message);
    } finally {
      setBusy(false);
    }
  };
  const err = (k: string) => (errors[k] ? tValidation(errors[k]) : undefined);
  const categories = [...new Set((catalog.data ?? []).map((c) => c.category ?? t('clinicDetail.other')))];

  return (
    <div style={{ maxWidth: 820 }}>
      <nav style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 18 }}>
        <Link to="/clinic-admin/doctors" style={{ color: 'var(--muted)' }}>
          {t('panel.clinicAdmin.doctors')}
        </Link>{' '}
        · {t('caInvite.newDoctor')}
      </nav>
      <h1 className="page-title">{t('ca.addDoctorPlain')}</h1>
      <div className={s.steps}>
        <span aria-current={!found ? 'step' : undefined}>{t('caInvite.step1')}</span>
        <span>→</span>
        <span aria-current={found ? 'step' : undefined}>{t('caInvite.step2')}</span>
      </div>

      <form className={s.section} onSubmit={(e) => void lookup(e)}>
        <div className={s.formGrid}>
          <Field label="FIN" htmlFor="fin" error={err('fin')} hint={t('caInvite.finHint')}>
            <input id="fin" className="input mono" value={fin} maxLength={7} onChange={(e) => (setFin(e.target.value.toUpperCase()), setFound(null))} autoFocus />
          </Field>
          <Field label={t('caInvite.mobile')} htmlFor="mobile" error={err('mobileNumber')} hint={t('caInvite.mobileHint')}>
            <input id="mobile" className="input" value={mobile} maxLength={13} onChange={(e) => setMobile(e.target.value)} />
          </Field>
        </div>
        {!found && (
          <div className={s.actions}>
            <Button type="submit" loading={busy} disabled={fin.trim().length !== 7}>
              {t('caInvite.check')}
            </Button>
          </div>
        )}
      </form>

      {found?.blockedReason && (
        <div style={{ marginTop: 18 }}>
          <Alert tone="error">{found.blockedReason}</Alert>
        </div>
      )}
      {found?.alreadyInClinic && (
        <div style={{ marginTop: 18 }}>
          <Alert tone="warning">
            {t('caInvite.alreadyHere')} {existing && <Link to={`/clinic-admin/doctors/${existing.doctorId}`}>{t('caInvite.doctorPage')}</Link>}
          </Alert>
        </div>
      )}

      {found && !found.blockedReason && !found.alreadyInClinic && (
        <form className={s.stack} style={{ marginTop: 18 }} onSubmit={(e) => void submit(e)}>
          {existing ? (
            <div className={s.found}>
              <strong>{t('caInvite.existingFound', { name: existing.fullName })}</strong>
              <div className={s.sub} style={{ marginTop: 4 }}>
                {existing.specialties.join(', ')} · {t('rx.license', { n: existing.licenseNumber })} · {existing.clinics.join(', ') || t('caInvite.noOtherClinic')}
              </div>
              <div style={{ fontSize: 14, marginTop: 8 }}>{t('caInvite.existingHint')}</div>
            </div>
          ) : (
            <section className={s.section}>
              <h2 className={s.sectionTitle}>{t('caInvite.newDoctor')}</h2>
              <Alert tone="info">{t('caInvite.newAccountInfo')}</Alert>
              <div className={s.formGrid}>
                <Field label={t('auth.firstName')} htmlFor="fn" error={err('firstName')}>
                  <input id="fn" className="input" value={f.firstName} onChange={(e) => setF((x) => ({ ...x, firstName: e.target.value }))} />
                </Field>
                <Field label={t('auth.lastName')} htmlFor="ln" error={err('lastName')}>
                  <input id="ln" className="input" value={f.lastName} onChange={(e) => setF((x) => ({ ...x, lastName: e.target.value }))} />
                </Field>
                <Field label={t('caInvite.licenseNo')} htmlFor="lic" error={err('licenseNumber')}>
                  <input id="lic" className="input mono" value={f.licenseNumber} onChange={(e) => setF((x) => ({ ...x, licenseNumber: e.target.value.toUpperCase() }))} placeholder="AZ-KAR-12345" />
                </Field>
                <Field label={t('caInvite.licenseExp')} htmlFor="licd" error={err('licenseExpiryDate')} hint={t('caInvite.noPast')}>
                  <input id="licd" className="input" type="date" value={f.licenseExpiryDate} onChange={(e) => setF((x) => ({ ...x, licenseExpiryDate: e.target.value }))} />
                </Field>
                <div className={s.full}>
                  <Field label={t('caInvite.specialties')} htmlFor="spec" error={err('specialtyIds')} hint={t('caInvite.specHint')}>
                    <div className={s.chips} id="spec">
                      {(specialties.data ?? []).map((x) => (
                        <button
                          key={x.id}
                          type="button"
                          className={s.chipToggle}
                          aria-pressed={specIds.includes(x.id)}
                          onClick={() => setSpecIds((l) => (l.includes(x.id) ? l.filter((y) => y !== x.id) : [...l, x.id].slice(0, 5)))}
                        >
                          {x.name}
                        </button>
                      ))}
                    </div>
                  </Field>
                </div>
              </div>
            </section>
          )}

          <section className={s.section}>
            <h2 className={s.sectionTitle}>{t('caInvite.documents')}</h2>
            <div className={s.formGrid}>
              <Field label={existing ? t('caInvite.licenseDocOpt') : t('caInvite.licenseDoc')} htmlFor="doc-lic" error={err('documents')} hint={t('caInvite.fileHint')}>
                <input id="doc-lic" type="file" className="input" accept="application/pdf,image/png,image/jpeg" onChange={(e) => void addDoc('LICENSE', e.target.files?.[0])} />
              </Field>
              <Field label={t('caInvite.diplomaOpt')} htmlFor="doc-dip">
                <input id="doc-dip" type="file" className="input" accept="application/pdf,image/png,image/jpeg" onChange={(e) => void addDoc('DIPLOMA', e.target.files?.[0])} />
              </Field>
            </div>
            {docs.length > 0 && <div className={s.sub}>{docs.map((d) => `${d.kind === 'LICENSE' ? t('docProf.license') : t('caInvite.diploma')}: ${d.fileName}`).join(' · ')}</div>}
          </section>

          <section className={s.section}>
            <h2 className={s.sectionTitle}>{t('caInvite.atClinic')}</h2>
            <Field label={t('caInvite.roomOpt')} htmlFor="room">
              <input id="room" className="input" style={{ maxWidth: 200 }} value={f.roomNumber} maxLength={20} onChange={(e) => setF((x) => ({ ...x, roomNumber: e.target.value }))} />
            </Field>
            <Field label={t('caInvite.svcDuration')} htmlFor="svc" error={err('services')} hint={t('caInvite.svcHint')}>
              <div id="svc">
                {categories.map((cat) => (
                  <div key={cat} style={{ marginBottom: 10 }}>
                    <div className={s.roLabel} style={{ textTransform: 'capitalize', marginBottom: 4 }}>
                      {cat}
                    </div>
                    {(catalog.data ?? [])
                      .filter((c) => (c.category ?? t('clinicDetail.other')) === cat)
                      .map((c) => {
                        const sel = services.find((x) => x.serviceId === c.id);
                        return (
                          <label key={c.id} className={s.svcRow}>
                            <input type="checkbox" checked={!!sel} onChange={() => toggleService(c.id)} />
                            <span>{c.name}</span>
                            {sel ? (
                              <select
                                className="input"
                                aria-label={t('caInvite.svcDurAria', { name: c.name })}
                                value={sel.durationMinutes}
                                onChange={(e) => setServices((l) => l.map((x) => (x.serviceId === c.id ? { ...x, durationMinutes: Number(e.target.value) } : x)))}
                              >
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
                ))}
              </div>
            </Field>
          </section>
          <div className={s.actions}>
            <Button variant="ghost" onClick={() => setFound(null)}>
              {t('common.back')}
            </Button>
            <Button type="submit" loading={busy} disabled={!services.length}>
              {t('caInvite.send')}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
