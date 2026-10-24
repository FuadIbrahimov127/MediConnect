import type { DoctorProfileDto } from '@mediconnect/shared';
import { t } from '../../i18n';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiClientError } from '../../api/client';
import { profileApi } from '../../api/auth';
import { doctorApi } from '../../api/doctor';
import { useApi } from '../../api/hooks';
import { useAuth } from '../../auth/AuthContext';
import { Alert, Field, Switch } from '../../components/forms';
import { Avatar, Badge, Button, ErrorState, Skeleton } from '../../components/ui';
import { useToast } from '../../components/Toast';
import { LANGUAGE_CODES, languageLabel } from '../../features/directory/cards';
import { formatDate } from '../../lib/format';
import s from '../account/account.module.css';
import { NotificationsSection, SecuritySection, SessionsSection } from '../account/SettingsPage';

// UC-701 — həkimin profili: SİMA və klinika admini sahələri kilidli, həkim bio/təhsil/təcrübə/dillər/foto/təsdiq rejimini idarə edir.
// Məcburi sahələr tamamlanmayana qədər həkim axtarışda görünmür (BR-701-05).

const MISSING_LABEL: Record<string, string> = { bio: t('docProf.mBio'), education: t('docProf.mEducation'), experienceYears: t('docProf.mExperience'), languages: t('docProf.mLanguages') };

const Lock = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);

export function DoctorProfilePage() {
  const q = useApi((sig) => doctorApi.profile(sig), []);
  const account = useApi((sig) => profileApi.get(sig), []);
  if (q.error) return <ErrorState message={q.error.message} onRetry={q.reload} />;
  if (!q.data) return <Skeleton height={420} radius={18} />;
  return (
    <div>
      <h1 className="page-title">{t('panel.doctor.profile')}</h1>
      <div className={s.sections}>
        <ProfileForm p={q.data} onSaved={(x) => q.setData(x)} />
        <NotificationsSection />
        {account.data && <SecuritySection biometricEnabled={account.data.biometricEnabled} mobileNumber={account.data.mobileNumber} onChanged={account.reload} />}
        <SessionsSection />
      </div>
    </div>
  );
}

function ProfileForm({ p, onSaved }: { p: DoctorProfileDto; onSaved: (p: DoctorProfileDto) => void }) {
  const toast = useToast();
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [bio, setBio] = useState(p.bio ?? '');
  const [education, setEducation] = useState(p.education.join('\n'));
  const [experience, setExperience] = useState(p.experienceYears === null ? '' : String(p.experienceYears));
  const [areas, setAreas] = useState(p.specializationAreas.join(', '));
  const [languages, setLanguages] = useState<string[]>(p.languages);
  const [degree, setDegree] = useState(p.academicDegree ?? '');
  const [certs, setCerts] = useState(p.certificates.map((c) => `${c.title}${c.year ? ` | ${c.year}` : ''}`).join('\n'));
  const [approvalMode, setApprovalMode] = useState(p.approvalMode);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  const save = async () => {
    setPending(true);
    setErrors({});
    const wasComplete = p.profileCompleted;
    try {
      const res = await doctorApi.updateProfile({
        bio,
        education: education.split('\n').map((x) => x.trim()).filter(Boolean),
        experienceYears: experience === '' ? undefined : Number(experience),
        specializationAreas: areas.split(',').map((x) => x.trim()).filter(Boolean),
        languages,
        academicDegree: degree.trim() || null,
        certificates: certs
          .split('\n')
          .map((x) => x.trim())
          .filter(Boolean)
          .map((line) => {
            const [title, year] = line.split('|').map((x) => x.trim());
            return { title, year: year ? Number(year) : null };
          }),
        approvalMode,
      });
      onSaved(res);
      await refresh();
      if (!wasComplete && res.profileCompleted) {
        toast.success(t('docProf.completed'), t('docProf.completedBody'));
        navigate('/doctor/schedule'); // UC-701: tamamlandıqdan sonra cədvələ yönləndirmə
      } else toast.success(t('docProf.saved'), t('docProf.savedBody'));
    } catch (e) {
      if (e instanceof ApiClientError) setErrors(e.fieldErrors);
      toast.error(t('settings.notSaved'), (e as Error).message);
    } finally {
      setPending(false);
    }
  };

  const onPhoto = async (file?: File) => {
    if (!file) return;
    const url = await new Promise<string>((resolve) => {
      const img = new Image();
      img.onload = () => {
        const k = Math.min(1, 320 / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = img.width * k;
        c.height = img.height * k;
        c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/jpeg', 0.85));
      };
      img.src = URL.createObjectURL(file);
    });
    try {
      onSaved(await doctorApi.updateProfile({ photoUrl: url }));
      await refresh();
    } catch (e) {
      toast.error(t('profile.photoFailed'), (e as Error).message);
    }
  };

  const fullName = `Dr. ${p.firstName} ${p.lastName}`;
  return (
    <>
      {!p.profileCompleted && (
        <Alert tone="warning">
          <div>
            <strong>{t('docProf.incompleteTitle')}</strong> {t('docProf.incompleteBody', { list: p.missingFields.map((f) => MISSING_LABEL[f] ?? f).join(', ') })}
          </div>
        </Alert>
      )}
      <section className={s.section}>
        <div className={s.sectionHead}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <Avatar name={fullName} src={p.photoUrl} size={72} />
            <div>
              <h2 className={s.sectionTitle}>{fullName}</h2>
              <label className="field-hint" style={{ cursor: 'pointer', color: 'var(--accent)', fontWeight: 600 }}>
                {t('profile.changePhoto')}
                <input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => void onPhoto(e.target.files?.[0])} />
              </label>
            </div>
          </div>
          <Badge tone={p.profileCompleted ? 'success' : 'warning'}>{p.profileCompleted ? t('docProf.visible') : t('docProf.hidden')}</Badge>
        </div>
        <div className={s.grid3}>
          {(
            [
              [t('docProf.finSima'), p.fin],
              [t('docProf.birthSima'), formatDate(p.birthDate)],
              [t('docProf.license'), t('docProf.licenseUntil', { n: p.licenseNumber, date: formatDate(p.licenseExpiryDate) })],
              [t('booking.specialty'), p.specialties.map((x) => x.name).join(', ')],
              [t('docProf.clinics'), p.clinics.map((c) => `${c.name}${c.roomNumber ? ` (${t('docProf.roomShort', { n: c.roomNumber })})` : ''}${c.status !== 'ACTIVE' ? ` — ${c.status === 'INACTIVE' ? t('docProf.inactive') : c.status}` : ''}`).join(', ')],
            ] as const
          ).map(([k, v]) => (
            <div key={k} className={s.ro}>
              <div className={s.roLabel}>
                <Lock /> {k}
              </div>
              <div className={s.roValue}>{v}</div>
            </div>
          ))}
        </div>
        <p className="field-hint">{t('docProf.lockedHint')}</p>
      </section>

      <section className={s.section}>
        <h2 className={s.sectionTitle} style={{ marginBottom: 16 }}>
          {t('docProf.professional')}
        </h2>
        <div style={{ display: 'grid', gap: 16 }}>
          <Field label={t('docProf.bio')} htmlFor="bio" error={errors.bio} hint={t('docProf.bioHint', { n: bio.trim().length })}>
            <textarea id="bio" className="input" rows={4} value={bio} maxLength={2000} onChange={(e) => setBio(e.target.value)} />
          </Field>
          <Field label={t('docProf.education')} htmlFor="edu" error={errors.education}>
            <textarea id="edu" className="input" rows={4} value={education} onChange={(e) => setEducation(e.target.value)} placeholder={t('docProf.eduPh')} />
          </Field>
          <div className={s.grid2}>
            <Field label={t('docProf.experience')} htmlFor="exp" error={errors.experienceYears}>
              <input id="exp" type="number" min={0} max={60} className="input" value={experience} onChange={(e) => setExperience(e.target.value)} />
            </Field>
            <Field label={t('docProf.degree')} htmlFor="deg">
              <input id="deg" className="input" value={degree} onChange={(e) => setDegree(e.target.value)} placeholder={t('docProf.degreePh')} />
            </Field>
          </div>
          <div className="field">
            <span className="field-label">{t('docProf.languages')}</span>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              {LANGUAGE_CODES.map((code) => (
                <label key={code} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 15 }}>
                  <input type="checkbox" checked={languages.includes(code)} style={{ width: 18, height: 18, accentColor: 'var(--accent)' }} onChange={(e) => setLanguages((l) => (e.target.checked ? [...l, code] : l.filter((x) => x !== code)))} />
                  {languageLabel(code)}
                </label>
              ))}
            </div>
          </div>
          <Field label={t('docProf.areas')} htmlFor="areas">
            <input id="areas" className="input" value={areas} onChange={(e) => setAreas(e.target.value)} />
          </Field>
          <Field label={t('docProf.certs')} htmlFor="certs">
            <textarea id="certs" className="input" rows={3} value={certs} onChange={(e) => setCerts(e.target.value)} />
          </Field>
          <div className="card" style={{ padding: 16, background: 'var(--bg-warm)' }}>
            <Switch checked={approvalMode === 'MANUAL'} onChange={(v) => setApprovalMode(v ? 'MANUAL' : 'AUTO')} label={t('docProf.manual')} />
            <p className="field-hint" style={{ margin: '8px 0 0' }}>
              {approvalMode === 'AUTO' ? t('docProf.autoHint') : t('docProf.manualHint')}
            </p>
          </div>
        </div>
        <div className={s.actions}>
          <Button loading={pending} onClick={() => void save()}>
            {t('common.save')}
          </Button>
        </div>
      </section>
    </>
  );
}
