import { CLINIC_DOCUMENT_KIND, CLINIC_TYPE, type ClinicDocumentKind, type LicenseCheckDto } from '@mediconnect/shared';
import { CLINIC_DOCUMENT_LABEL, CLINIC_TYPE_LABEL } from '../../i18n/labels';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import { ApiClientError } from '../../api/client';
import { readAsDataUrl, type DataUrlFile } from '../../api/clinicAdmin';
import { catalogApi } from '../../api/endpoints';
import { useApi } from '../../api/hooks';
import { Alert, Field } from '../../components/forms';
import { Button } from '../../components/ui';
import { useToast } from '../../components/Toast';
import s from '../../features/clinicAdmin/clinicAdmin.module.css';
import { tValidation, t } from '../../i18n';

// UC-901 — klinikanın əlavəsi: əsas məlumatlar, qeydiyyat və lisenziya (unikallıq, tarix, reyestr yoxlaması),
// rəsmi sənədlər, klinika admini (SMS dəvəti → SİMA). "Yarat və təsdiqlə" və ya "gözləmə statusunda saxla" (alt 2).

export function ClinicCreatePage() {
  const toast = useToast();
  const navigate = useNavigate();
  const cities = useApi((sig) => catalogApi.cities(sig), []);
  const [f, setF] = useState({
    name: '', clinicType: 'POLYCLINIC', cityId: '', district: '', address: '', latitude: '', longitude: '', phone: '+994', email: '',
    registrationNumber: '', licenseNumber: '', licenseExpiryDate: '',
  });
  const [admin, setAdmin] = useState({ fin: '', mobileNumber: '+994', firstName: '', lastName: '' });
  const [docs, setDocs] = useState<(DataUrlFile & { kind: ClinicDocumentKind })[]>([]);
  const [registry, setRegistry] = useState<LicenseCheckDto | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dupClinic, setDupClinic] = useState<{ clinicId: string; name: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));
  const setA = (k: keyof typeof admin) => (e: { target: { value: string } }) => setAdmin((x) => ({ ...x, [k]: e.target.value }));
  const err = (k: string) => (errors[k] ? tValidation(errors[k]) : undefined);

  const checkRegistry = async () => {
    if (!f.licenseNumber.trim()) return;
    try {
      setRegistry(await adminApi.licenseCheck(f.licenseNumber));
    } catch (e) {
      toast.error(t('caInvite.notChecked'), (e as Error).message);
    }
  };
  const addDoc = async (file: File | undefined, kind: ClinicDocumentKind) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) return toast.error(t('create.tooBig'), t('caInvite.max10'));
    const d = await readAsDataUrl(file);
    setDocs((l) => [...l.filter((x) => x.kind !== kind || kind === 'OTHER'), { ...d, kind }]);
  };

  const submit = async (e: FormEvent, verify: boolean) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    setDupClinic(null);
    const num = (v: string) => (v.trim() ? Number(v.replace(',', '.')) : null);
    try {
      const c = await adminApi.createClinic({
        ...f, district: f.district || null, email: f.email, latitude: num(f.latitude), longitude: num(f.longitude),
        documents: docs, admin: { ...admin, fin: admin.fin.toUpperCase() }, verify,
      });
      toast.success(verify ? t('create.createdVerified') : t('create.createdPending'), t('create.adminInvited', { name: `${admin.firstName} ${admin.lastName}` }));
      navigate(`/admin/clinics/${c.clinicId}/verify`);
    } catch (x) {
      const er = x as ApiClientError;
      if (er.details?.fields) setErrors(er.details.fields as Record<string, string>);
      if (er.errorType === 'DuplicateRegistrationNumber') setDupClinic(er.details as unknown as { clinicId: string; name: string });
      toast.error(t('create.failed'), er.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form style={{ maxWidth: 880 }} className={s.stack} onSubmit={(e) => void submit(e, true)}>
      <nav style={{ fontSize: 13, color: 'var(--muted)' }}>
        <Link to="/admin/clinics" style={{ color: 'var(--muted)' }}>
          {t('panel.admin.clinics')}
        </Link>{' '}
        · {t('create.newClinic')}
      </nav>
      <h1 className="page-title" style={{ margin: 0 }}>
        {t('create.title')}
      </h1>
      <Alert tone="info">{t('create.info')}</Alert>

      <section className={s.section}>
        <h2 className={s.sectionTitle}>{t('caProf.basic')}</h2>
        <div className={s.formGrid}>
          <div className={s.full}>
            <Field label={t('create.clinicName')} htmlFor="name" error={err('name')}>
              <input id="name" className="input" value={f.name} onChange={set('name')} />
            </Field>
          </div>
          <Field label={t('caProf.type')} htmlFor="type">
            <select id="type" className="input" value={f.clinicType} onChange={set('clinicType')}>
              {CLINIC_TYPE.map((ct) => (
                <option key={ct} value={ct}>
                  {CLINIC_TYPE_LABEL[ct]}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t('caProf.city')} htmlFor="city" error={err('cityId')}>
            <select id="city" className="input" value={f.cityId} onChange={set('cityId')}>
              <option value="">{t('stars.choose')}</option>
              {cities.data?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t('caProf.district')} htmlFor="district">
            <input id="district" className="input" value={f.district} onChange={set('district')} />
          </Field>
          <Field label={t('booking.address')} htmlFor="address" error={err('address')}>
            <input id="address" className="input" value={f.address} onChange={set('address')} />
          </Field>
          <Field label={t('create.lat')} htmlFor="lat">
            <input id="lat" className="input" inputMode="decimal" value={f.latitude} onChange={set('latitude')} placeholder="40.3777" />
          </Field>
          <Field label={t('create.lng')} htmlFor="lng">
            <input id="lng" className="input" inputMode="decimal" value={f.longitude} onChange={set('longitude')} placeholder="49.8920" />
          </Field>
          <Field label={t('auth.phone')} htmlFor="phone" error={err('phone')}>
            <input id="phone" className="input" value={f.phone} maxLength={13} onChange={set('phone')} />
          </Field>
          <Field label="Email" htmlFor="email" error={err('email')}>
            <input id="email" className="input" type="email" value={f.email} onChange={set('email')} />
          </Field>
        </div>
      </section>

      <section className={s.section}>
        <h2 className={s.sectionTitle}>{t('create.regLicense')}</h2>
        {dupClinic && (
          <Alert tone="error">
            {t('create.dup')} <Link to={`/admin/clinics/${dupClinic.clinicId}/verify`}>{dupClinic.name}</Link>
          </Alert>
        )}
        <div className={s.formGrid}>
          <Field label={t('create.regNo')} htmlFor="reg" error={err('registrationNumber')}>
            <input id="reg" className="input mono" value={f.registrationNumber} onChange={set('registrationNumber')} />
          </Field>
          <Field label={t('caInvite.licenseExp')} htmlFor="licd" error={err('licenseExpiryDate')} hint={t('caInvite.noPast')}>
            <input id="licd" type="date" className="input" value={f.licenseExpiryDate} onChange={set('licenseExpiryDate')} />
          </Field>
          <div className={s.full}>
            <Field label={t('create.licNo')} htmlFor="lic" error={err('licenseNumber')} hint={t('create.licHint')}>
              <div style={{ display: 'flex', gap: 8 }}>
                <input id="lic" className="input mono" value={f.licenseNumber} onChange={(e) => (set('licenseNumber')(e), setRegistry(null))} onBlur={() => void checkRegistry()} />
                <Button variant="ghost" onClick={() => void checkRegistry()}>
                  {t('create.checkRegistry')}
                </Button>
              </div>
            </Field>
            {registry && <Alert tone={registry.found ? 'success' : 'warning'}>{registry.message}</Alert>}
          </div>
        </div>
      </section>

      <section className={s.section}>
        <div>
          <h2 className={s.sectionTitle}>{t('create.officialDocs')}</h2>
          <div className={s.sectionSub}>{t('create.docsSub')}</div>
        </div>
        <div className={s.formGrid}>
          {CLINIC_DOCUMENT_KIND.map((k) => (
            <Field key={k} label={CLINIC_DOCUMENT_LABEL[k]} htmlFor={`doc-${k}`} error={k === 'REGISTRATION' ? err('documents') : undefined}>
              <input id={`doc-${k}`} type="file" className="input" accept="application/pdf,image/png,image/jpeg" onChange={(e) => void addDoc(e.target.files?.[0], k)} />
            </Field>
          ))}
        </div>
        {docs.length > 0 && <div className={s.sub}>{docs.map((d) => `${CLINIC_DOCUMENT_LABEL[d.kind]}: ${d.fileName}`).join(' · ')}</div>}
      </section>

      <section className={s.section}>
        <div>
          <h2 className={s.sectionTitle}>{t('create.clinicAdmin')}</h2>
          <div className={s.sectionSub}>{t('create.adminSub')}</div>
        </div>
        <div className={s.formGrid}>
          <Field label="FIN" htmlFor="afin" error={err('admin.fin') ?? err('fin')}>
            <input id="afin" className="input mono" maxLength={7} value={admin.fin} onChange={(e) => setAdmin((x) => ({ ...x, fin: e.target.value.toUpperCase() }))} />
          </Field>
          <Field label={t('caInvite.mobile')} htmlFor="amob" error={err('admin.mobileNumber') ?? err('mobileNumber')}>
            <input id="amob" className="input" maxLength={13} value={admin.mobileNumber} onChange={setA('mobileNumber')} />
          </Field>
          <Field label={t('auth.firstName')} htmlFor="afn" error={err('admin.firstName')}>
            <input id="afn" className="input" value={admin.firstName} onChange={setA('firstName')} />
          </Field>
          <Field label={t('auth.lastName')} htmlFor="aln" error={err('admin.lastName')}>
            <input id="aln" className="input" value={admin.lastName} onChange={setA('lastName')} />
          </Field>
        </div>
      </section>

      <div className={s.actions}>
        <Button variant="ghost" loading={busy} onClick={(e) => void submit(e, false)}>
          {t('create.savePending')}
        </Button>
        <Button type="submit" loading={busy}>
          {t('create.createVerify')}
        </Button>
      </div>
    </form>
  );
}
