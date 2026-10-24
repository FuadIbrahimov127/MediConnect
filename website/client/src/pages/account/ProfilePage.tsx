import { ALLERGY_SEVERITY, BLOOD_TYPES, type AllergySeverity, type ProfileDto } from '@mediconnect/shared';
import { t } from '../../i18n';
import { Rich } from '../../i18n/Rich';
import { ALLERGY_SEVERITY_LABEL as SEVERITY_LABEL } from '../../i18n/labels';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ApiClientError } from '../../api/client';
import { profileApi } from '../../api/auth';
import { useApi } from '../../api/hooks';
import { useAuth } from '../../auth/AuthContext';
import { Alert, CodeInput, Field, Modal, useCountdown } from '../../components/forms';
import { Avatar, Badge, Button, ErrorState, Skeleton } from '../../components/ui';
import { useToast } from '../../components/Toast';
import { PhoneInput, phoneComplete } from '../../features/auth/PhoneInput';
import { errorText } from '../../features/auth/steps';
import { formatCountdown, formatDate } from '../../lib/format';
import s from './account.module.css';

// UC-104 — Profil: SİMA sahələri read-only (BR-104-01), əlaqə, tibbi profil (allergiya resept zamanı həkimə göstərilir — BR-104-03).

const SEVERITY_TONE = { MILD: 'neutral', MODERATE: 'warning', SEVERE: 'danger' } as const;

const Lock = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);

export function ProfilePage() {
  const q = useApi((sig) => profileApi.get(sig), []);
  if (q.error) return <ErrorState message={q.error.message} onRetry={q.reload} />;
  if (!q.data)
    return (
      <div className={s.sections}>
        <Skeleton width="30%" height={34} />
        <Skeleton height={180} radius={18} />
        <Skeleton height={260} radius={18} />
      </div>
    );
  return <ProfileView profile={q.data} onChange={(p) => q.setData(p)} />;
}

function ProfileView({ profile, onChange }: { profile: ProfileDto; onChange: (p: ProfileDto) => void }) {
  const p = profile.patient;
  return (
    <div>
      <h1 className="page-title">{t('panel.patient.profile')}</h1>
      <div className={s.sections}>
        <IdentitySection profile={profile} onChange={onChange} />
        <ContactSection profile={profile} onChange={onChange} />
        {p && <MedicalSection profile={profile} onChange={onChange} />}
      </div>
    </div>
  );
}

function IdentitySection({ profile, onChange }: { profile: ProfileDto; onChange: (p: ProfileDto) => void }) {
  const toast = useToast();
  const { refresh } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const fullName = `${profile.firstName} ${profile.lastName}`;
  const items: [string, string][] = [
    [t('auth.firstName'), profile.firstName],
    [t('auth.lastName'), profile.lastName],
    [t('auth.fatherName'), profile.fatherName ?? '—'],
    [t('auth.birthDate'), formatDate(profile.birthDate)],
    [t('auth.gender'), profile.gender === 'MALE' ? t('auth.male') : t('auth.female')],
    ['FIN', profile.fin],
  ];

  const onPhoto = async (file: File | undefined) => {
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return toast.error(t('profile.photoFormat'), t('profile.photoFormatBody'));
    try {
      const dataUrl = await resizeImage(file, 256);
      onChange(await profileApi.update({ photoUrl: dataUrl }));
      await refresh();
      toast.success(t('profile.photoUpdated'));
    } catch (e) {
      toast.error(t('profile.photoFailed'), errorText(e));
    }
  };

  return (
    <section className={s.section} aria-labelledby="identity">
      <div className={s.sectionHead}>
        <div>
          <h2 id="identity" className={s.sectionTitle}>
            {t('profile.identity')}
          </h2>
          <div className={s.sectionSub}>{t('profile.identitySub')}</div>
        </div>
        <Badge tone="success">{t('profile.simaVerified')}</Badge>
      </div>
      <div className={s.photoRow}>
        <Avatar name={fullName} src={profile.photoUrl} size={72} />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button variant="ghost" size="small" onClick={() => fileRef.current?.click()}>
            {profile.photoUrl ? t('profile.changePhoto') : t('profile.uploadPhoto')}
          </Button>
          {profile.photoUrl && (
            <Button variant="link" onClick={async () => onChange(await profileApi.update({ photoUrl: null }))}>
              {t('common.delete')}
            </Button>
          )}
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => void onPhoto(e.target.files?.[0])} />
        </div>
      </div>
      <div className={s.grid3}>
        {items.map(([label, value]) => (
          <div key={label} className={s.ro}>
            <div className={s.roLabel}>
              <Lock /> {label}
            </div>
            <div className={s.roValue}>{value}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ContactSection({ profile, onChange }: { profile: ProfileDto; onChange: (p: ProfileDto) => void }) {
  const toast = useToast();
  const p = profile.patient;
  const [form, setForm] = useState({
    email: profile.email ?? '',
    secondaryPhone: p?.secondaryPhone ?? '',
    address: p?.address ?? '',
    emergencyContactName: p?.emergencyContactName ?? '',
    emergencyContactPhone: p?.emergencyContactPhone ?? '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [phoneModal, setPhoneModal] = useState(false);
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));
  const phoneOrNull = (v: string) => (v === '+994' || v === '' ? null : v);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setPending(true);
    setErrors({});
    try {
      const body: Record<string, unknown> = { email: form.email || null };
      if (p) Object.assign(body, { secondaryPhone: phoneOrNull(form.secondaryPhone), address: form.address || null, emergencyContactName: form.emergencyContactName || null, emergencyContactPhone: phoneOrNull(form.emergencyContactPhone) });
      onChange(await profileApi.update(body));
      toast.success(t('profile.saved'));
    } catch (err) {
      if (err instanceof ApiClientError) setErrors(err.fieldErrors);
      toast.error(t('settings.notSaved'), errorText(err));
    } finally {
      setPending(false);
    }
  };

  return (
    <section className={s.section} aria-labelledby="contact">
      <div className={s.sectionHead}>
        <h2 id="contact" className={s.sectionTitle}>
          {t('profile.contact')}
        </h2>
      </div>
      <form onSubmit={save} noValidate>
        <div className={s.grid2}>
          <div className="field">
            <span className="field-label">{t('profile.mainPhone')}</span>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input className="input" value={profile.mobileNumber} readOnly aria-readonly="true" style={{ flex: 1 }} />
              <Button variant="ghost" size="small" onClick={() => setPhoneModal(true)}>
                {t('profile.change')}
              </Button>
            </div>
            <span className="field-hint">{t('profile.phoneHint')}</span>
          </div>
          <Field label="Email" htmlFor="email" error={errors.email}>
            <input id="email" type="email" className="input" value={form.email} onChange={(e) => set('email')(e.target.value)} aria-invalid={!!errors.email || undefined} />
          </Field>
          {p && (
            <>
              <PhoneInput label={t('profile.extraPhone')} value={form.secondaryPhone || '+994'} onChange={set('secondaryPhone')} error={errors.secondaryPhone} />
              <Field label={t('booking.address')} htmlFor="address" error={errors.address}>
                <input id="address" className="input" value={form.address} onChange={(e) => set('address')(e.target.value)} />
              </Field>
              <Field label={t('profile.emergencyName')} htmlFor="ecn" error={errors.emergencyContactName}>
                <input id="ecn" className="input" value={form.emergencyContactName} onChange={(e) => set('emergencyContactName')(e.target.value)} />
              </Field>
              <PhoneInput label={t('profile.emergencyPhone')} value={form.emergencyContactPhone || '+994'} onChange={set('emergencyContactPhone')} error={errors.emergencyContactPhone} />
            </>
          )}
        </div>
        <div className={s.actions}>
          <Button type="submit" loading={pending}>
            {t('common.save')}
          </Button>
        </div>
      </form>
      <PhoneChangeModal open={phoneModal} onClose={() => setPhoneModal(false)} onDone={onChange} />
    </section>
  );
}

function PhoneChangeModal({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: (p: ProfileDto) => void }) {
  const toast = useToast();
  const { refresh } = useAuth();
  const [phone, setPhone] = useState('+994');
  const [change, setChange] = useState<{ changeId: string; otpExpiresAt: string; maskedNumber: string } | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const left = useCountdown(change?.otpExpiresAt);

  useEffect(() => {
    if (!open) {
      setPhone('+994');
      setChange(null);
      setCode('');
      setError(null);
    }
  }, [open]);

  const run = async (fn: () => Promise<void>) => {
    setPending(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setPending(false);
    }
  };

  return (
    <Modal
      open={open}
      title={t('profile.phoneTitle')}
      onClose={onClose}
      actions={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          {!change ? (
            <Button loading={pending} disabled={!phoneComplete(phone)} onClick={() => void run(async () => setChange(await profileApi.phoneChangeInitiate(phone)))}>
              {t('profile.sendCode')}
            </Button>
          ) : (
            <Button
              loading={pending}
              disabled={code.length !== 6}
              onClick={() =>
                void run(async () => {
                  onDone(await profileApi.phoneChangeConfirm(change.changeId, code));
                  await refresh();
                  toast.success(t('profile.phoneChanged'));
                  onClose();
                })
              }
            >
              {t('common.confirm')}
            </Button>
          )}
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8 }}>
        {!change ? (
          <PhoneInput label={t('profile.newNumber')} value={phone} onChange={setPhone} autoFocus />
        ) : (
          <>
            <span>
              <Rich text={t('profile.enterCode', { time: formatCountdown(left) })} b={change.maskedNumber} />
            </span>
            <CodeInput length={6} value={code} onChange={setCode} autoFocus label={t('auth.smsCode')} invalid={!!error} />
          </>
        )}
        {error && <Alert tone="error">{error}</Alert>}
      </div>
    </Modal>
  );
}

function MedicalSection({ profile, onChange }: { profile: ProfileDto; onChange: (p: ProfileDto) => void }) {
  const toast = useToast();
  const p = profile.patient!;
  const [allergy, setAllergy] = useState({ name: '', severity: 'MODERATE' as AllergySeverity });
  const [condition, setCondition] = useState({ name: '', icd: '', date: '' });
  const [med, setMed] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const run = async (fn: () => Promise<ProfileDto>, success?: string) => {
    setErrors({});
    try {
      onChange(await fn());
      if (success) toast.success(success);
      return true;
    } catch (e) {
      if (e instanceof ApiClientError) setErrors(e.fieldErrors);
      toast.error(t('profile.opFailed'), errorText(e));
      return false;
    }
  };

  return (
    <section className={s.section} aria-labelledby="medical">
      <div className={s.sectionHead}>
        <div>
          <h2 id="medical" className={s.sectionTitle}>
            {t('profile.health')}
          </h2>
          <div className={s.sectionSub}>{t('profile.healthSub')}</div>
        </div>
      </div>

      <div style={{ maxWidth: 260 }}>
        <Field label={t('profile.bloodType')} htmlFor="blood">
          <select id="blood" className="input" value={p.bloodType ?? ''} onChange={(e) => void run(() => profileApi.update({ bloodType: e.target.value || null }), t('profile.bloodSaved'))}>
            <option value="">{t('stars.notChosen')}</option>
            {BLOOD_TYPES.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <h3 className={s.subTitle}>{t('profile.allergies')}</h3>
      <div className={s.list}>
        {p.allergies.length === 0 && <div className="muted">{t('profile.noAllergies')}</div>}
        {p.allergies.map((a) => (
          <div key={a.allergyId} className={s.item}>
            <div className={s.itemMain}>
              <div className={s.itemTitle}>{a.allergenName}</div>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <Badge tone={SEVERITY_TONE[a.severity]}>{SEVERITY_LABEL[a.severity]}</Badge>
              <Button variant="link" onClick={() => void run(() => profileApi.removeAllergy(a.allergyId))} aria-label={t('profile.removeAllergy', { name: a.allergenName })}>
                {t('common.delete')}
              </Button>
            </div>
          </div>
        ))}
      </div>
      <form
        className={s.addRow}
        onSubmit={async (e) => {
          e.preventDefault();
          if (await run(() => profileApi.addAllergy({ allergenName: allergy.name, severity: allergy.severity }), t('profile.allergyAdded'))) setAllergy({ name: '', severity: 'MODERATE' });
        }}
      >
        <Field label={t('profile.allergen')} htmlFor="allergen" error={errors.allergenName}>
          <input id="allergen" className="input" value={allergy.name} placeholder={t('profile.allergenPh')} onChange={(e) => setAllergy((x) => ({ ...x, name: e.target.value }))} />
        </Field>
        <Field label={t('profile.severity')} htmlFor="sev">
          <select id="sev" className="input" value={allergy.severity} onChange={(e) => setAllergy((x) => ({ ...x, severity: e.target.value as AllergySeverity }))}>
            {ALLERGY_SEVERITY.map((v) => (
              <option key={v} value={v}>
                {SEVERITY_LABEL[v]}
              </option>
            ))}
          </select>
        </Field>
        <Button type="submit" variant="secondary" disabled={allergy.name.trim().length < 2}>
          {t('common.add')}
        </Button>
      </form>

      <h3 className={s.subTitle}>{t('profile.chronic')}</h3>
      <div className={s.list}>
        {p.chronicConditions.length === 0 && <div className="muted">{t('profile.noRecords')}</div>}
        {p.chronicConditions.map((c) => (
          <div key={c.conditionId} className={s.item}>
            <div className={s.itemMain}>
              <div className={s.itemTitle}>{c.conditionName}</div>
              <div className={s.itemSub}>{[c.icd10Code, c.diagnosedDate && t('profile.diagnosedOn', { date: formatDate(c.diagnosedDate) })].filter(Boolean).join(' · ') || '—'}</div>
            </div>
            <Button variant="link" onClick={() => void run(() => profileApi.removeCondition(c.conditionId))}>
              {t('common.delete')}
            </Button>
          </div>
        ))}
      </div>
      <form
        className={s.addRow3}
        onSubmit={async (e) => {
          e.preventDefault();
          if (await run(() => profileApi.addCondition({ conditionName: condition.name, icd10Code: condition.icd || null, diagnosedDate: condition.date || null }), t('profile.added')))
            setCondition({ name: '', icd: '', date: '' });
        }}
      >
        <Field label={t('profile.condition')} htmlFor="cond" error={errors.conditionName}>
          <input id="cond" className="input" value={condition.name} placeholder={t('profile.conditionPh')} onChange={(e) => setCondition((x) => ({ ...x, name: e.target.value }))} />
        </Field>
        <Field label="ICD-10" htmlFor="icd" error={errors.icd10Code}>
          <input id="icd" className="input" value={condition.icd} placeholder="I10" onChange={(e) => setCondition((x) => ({ ...x, icd: e.target.value.toUpperCase() }))} />
        </Field>
        <Field label={t('profile.diagnosisDate')} htmlFor="cdate">
          <input id="cdate" type="date" className="input" value={condition.date} onChange={(e) => setCondition((x) => ({ ...x, date: e.target.value }))} />
        </Field>
        <Button type="submit" variant="secondary" disabled={condition.name.trim().length < 2}>
          {t('common.add')}
        </Button>
      </form>

      <h3 className={s.subTitle}>{t('profile.regularMeds')}</h3>
      <div className={s.chips}>
        {p.regularMedications.length === 0 && <span className="muted">{t('profile.noRecords')}</span>}
        {p.regularMedications.map((m, i) => (
          <span key={`${m.name}-${i}`} className={s.chip}>
            {m.name}
            <button
              type="button"
              className={s.chipX}
              aria-label={t('profile.removeMed', { name: m.name })}
              onClick={() => void run(() => profileApi.updateMedications(p.regularMedications.filter((_, j) => j !== i)))}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <form
        className={s.addRow}
        style={{ gridTemplateColumns: '1fr auto' }}
        onSubmit={async (e) => {
          e.preventDefault();
          if (await run(() => profileApi.updateMedications([...p.regularMedications, { name: med.trim() }]))) setMed('');
        }}
      >
        <Field label={t('profile.medName')} htmlFor="med">
          <input id="med" className="input" value={med} placeholder={t('profile.medPh')} onChange={(e) => setMed(e.target.value)} />
        </Field>
        <Button type="submit" variant="secondary" disabled={med.trim().length < 2}>
          {t('common.add')}
        </Button>
      </form>
    </section>
  );
}

/** Profil şəklini kiçildib data URL-ə çevirir (mock-da fayl storage yoxdur). */
function resizeImage(file: File, max: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(img.src);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}
