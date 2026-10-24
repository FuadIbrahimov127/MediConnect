
import type { Language, NotificationPreferenceDto } from '@mediconnect/shared';
import { useState, type FormEvent } from 'react';
import { authApi, profileApi } from '../../api/auth';
import { useApi } from '../../api/hooks';
import { useAuth } from '../../auth/AuthContext';
import { Alert, CodeInput, ConfirmDialog, Switch } from '../../components/forms';
import { Badge, Button, ErrorState, Skeleton } from '../../components/ui';
import { useToast } from '../../components/Toast';
import { errorText, PinFields, pinValid } from '../../features/auth/steps';
import { biometricStore, deviceId } from '../../lib/device';
import { formatDateTime } from '../../lib/format';
import { setLanguage, t } from '../../i18n';
import s from './account.module.css';

// UC-104 alt 1/2 — parametrlər: dil, bildiriş kanalları, biometrik, PIN, sessiyalar, razılıq, hesabın silinməsi.

export function SettingsPage() {
  const profile = useApi((sig) => profileApi.get(sig), []);
  if (profile.error) return <ErrorState message={profile.error.message} onRetry={profile.reload} />;
  if (!profile.data)
    return (
      <div className={s.sections}>
        <Skeleton width="30%" height={34} />
        <Skeleton height={220} radius={18} />
      </div>
    );
  const p = profile.data;
  return (
    <div>
      <h1 className="page-title">{t('panel.patient.settings')}</h1>
      <div className={s.sections}>
        <LanguageSection current={p.preferredLanguage} />
        <NotificationsSection />
        <SecuritySection biometricEnabled={p.biometricEnabled} mobileNumber={p.mobileNumber} onChanged={profile.reload} />
        <SessionsSection />
        {p.patient && <ConsentSection consent={p.patient.medicalConsent} consentGivenAt={p.patient.consentGivenAt} onChanged={(x) => profile.setData(x)} />}
        {p.patient && <DeletionSection requestedAt={p.deletionRequestedAt} onChanged={(x) => profile.setData(x)} />}
      </div>
    </div>
  );
}

function Section({ title, sub, children, aside }: { title: string; sub?: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <section className={s.section}>
      <div className={s.sectionHead}>
        <div>
          <h2 className={s.sectionTitle}>{title}</h2>
          {sub && <div className={s.sectionSub}>{sub}</div>}
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}

function LanguageSection({ current }: { current: Language }) {
  const toast = useToast();
  return (
    <Section title={t('settings.lang')} sub={t('settings.langSub')}>
      <select
        className="input"
        style={{ maxWidth: 260 }}
        value={current}
        aria-label={t('settings.lang')}
        onChange={async (e) => {
          const lang = e.target.value as Language;
          try {
            await profileApi.settings({ preferredLanguage: lang });
            setLanguage(lang);
            toast.success(t('settings.langChanged'));
            setTimeout(() => window.location.reload(), 600);
          } catch (err) {
            toast.error(t('common.failed'), errorText(err));
          }
        }}
      >
        <option value="az">Azərbaycanca</option>
        <option value="ru">Русский</option>
        <option value="en">English</option>
      </select>
    </Section>
  );
}

export function NotificationsSection() {
  const toast = useToast();
  const q = useApi((sig) => profileApi.preferences(sig), []);
  const [saving, setSaving] = useState(false);

  const toggle = async (pref: NotificationPreferenceDto, key: 'smsEnabled' | 'pushEnabled' | 'emailEnabled', value: boolean) => {
    if (!q.data) return;
    const next = q.data.map((p) => (p.notificationType === pref.notificationType ? { ...p, [key]: value } : p));
    q.setData(next);
    setSaving(true);
    try {
      q.setData(await profileApi.updatePreferences(next.map(({ notificationType, smsEnabled, pushEnabled, emailEnabled }) => ({ notificationType, smsEnabled, pushEnabled, emailEnabled }))));
    } catch (err) {
      toast.error(t('settings.notSaved'), errorText(err));
      q.reload();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Section title={t('settings.notifications')} sub={t('settings.notifSub')} aside={saving ? <span className="muted">{t('settings.saving')}</span> : null}>
      {!q.data ? (
        <Skeleton height={200} />
      ) : (
        <div className={s.tableWrap}>
          <table className={s.prefTable}>
            <thead>
              <tr>
                <th>{t('settings.notification')}</th>
                <th className={s.center}>SMS</th>
                <th className={s.center}>Push</th>
                <th className={s.center}>Email</th>
              </tr>
            </thead>
            <tbody>
              {q.data.map((p) => (
                <tr key={p.notificationType}>
                  <td>
                    {p.label}
                    {p.isMandatory && <span className={s.mandatory}>{t('settings.mandatory')}</span>}
                  </td>
                  {(['SMS', 'PUSH', 'EMAIL'] as const).map((ch) => {
                    const key = ch === 'SMS' ? 'smsEnabled' : ch === 'PUSH' ? 'pushEnabled' : 'emailEnabled';
                    const available = p.channels.includes(ch);
                    return (
                      <td key={ch} className={s.center}>
                        {available ? (
                          <input type="checkbox" checked={p[key]} disabled={p.isMandatory} aria-label={`${p.label} — ${ch}`} onChange={(e) => void toggle(p, key, e.target.checked)} />
                        ) : (
                          <span className="muted" aria-label={t('settings.channelUnused')}>
                            —
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  );
}

export function SecuritySection({ biometricEnabled, mobileNumber, onChanged }: { biometricEnabled: boolean; mobileNumber: string; onChanged: () => void }) {
  const toast = useToast();
  const [current, setCurrent] = useState('');
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const toggleBio = async (v: boolean) => {
    try {
      const r = await profileApi.settings({ biometricEnabled: v, deviceId: deviceId() });
      biometricStore.set(mobileNumber, r.deviceToken);
      toast.success(v ? t('settings.bioOn') : t('settings.bioOff'), v ? t('settings.bioOnBody') : undefined);
      onChanged();
    } catch (err) {
      toast.error(t('common.failed'), errorText(err));
    }
  };

  const changePin = async (e: FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      await profileApi.changePin({ currentPin: current, newPin: pin, newPinConfirm: confirm });
      toast.success(t('settings.pinChanged'), t('settings.pinChangedBody'));
      setCurrent('');
      setPin('');
      setConfirm('');
      setFormKey((k) => k + 1);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setPending(false);
    }
  };

  return (
    <Section title={t('settings.security')}>
      <Switch checked={biometricEnabled} onChange={(v) => void toggleBio(v)} label={t('settings.bioSwitch')} />
      <h3 className={s.subTitle} style={{ marginTop: 24 }}>
        {t('settings.changePinTitle')}
      </h3>
      <form key={formKey} onSubmit={changePin} style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 360 }}>
        <div className="field">
          <span className="field-label">{t('settings.currentPin')}</span>
          <CodeInput length={4} masked value={current} onChange={setCurrent} label={t('settings.currentPin')} />
        </div>
        <PinFields pin={pin} confirm={confirm} onPin={setPin} onConfirm={setConfirm} error={error} />
        <div>
          <Button type="submit" loading={pending} disabled={current.length !== 4 || !pinValid(pin, confirm)}>
            {t('settings.changePin')}
          </Button>
        </div>
      </form>
    </Section>
  );
}

export function SessionsSection() {
  const toast = useToast();
  const q = useApi(() => authApi.sessions(), []);
  return (
    <Section title={t('settings.sessions')} sub={t('settings.sessionsSub')}>
      {!q.data ? (
        <Skeleton height={80} />
      ) : (
        <div className={s.list}>
          {q.data.map((x) => (
            <div key={x.sessionId} className={s.item}>
              <div className={s.itemMain}>
                <div className={s.itemTitle}>{x.deviceInfo ?? t('settings.unknownDevice')}</div>
                <div className={s.itemSub}>
                  {t('settings.lastSeen', { time: formatDateTime(x.lastSeenAt) })} · {x.ipAddress ?? '—'}
                </div>
              </div>
              {x.current ? (
                <Badge tone="success">{t('settings.thisDevice')}</Badge>
              ) : (
                <Button
                  variant="link"
                  onClick={async () => {
                    await authApi.revokeSession(x.sessionId).catch((e) => toast.error(t('common.failed'), errorText(e)));
                    q.reload();
                  }}
                >
                  {t('common.close')}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

function ConsentSection({ consent, consentGivenAt, onChanged }: { consent: boolean; consentGivenAt: string | null; onChanged: (p: Awaited<ReturnType<typeof profileApi.consent>>) => void }) {
  const toast = useToast();
  const { refresh } = useAuth();
  const [confirm, setConfirm] = useState(false);
  const [pending, setPending] = useState(false);

  const apply = async (value: boolean) => {
    setPending(true);
    try {
      onChanged(await profileApi.consent(value));
      await refresh();
      toast.success(value ? t('settings.consentGiven') : t('settings.consentRevoked'));
      setConfirm(false);
    } catch (err) {
      toast.error(t('common.failed'), errorText(err));
    } finally {
      setPending(false);
    }
  };

  return (
    <Section title={t('settings.consentTitle')} aside={<Badge tone={consent ? 'success' : 'danger'}>{consent ? t('settings.given') : t('settings.revoked')}</Badge>}>
      {consent ? (
        <>
          <p className="ink-soft" style={{ marginTop: 0 }}>
            {t('settings.givenAt', { date: consentGivenAt ? formatDateTime(consentGivenAt) : '' })}
          </p>
          <Button variant="ghost" onClick={() => setConfirm(true)}>
            {t('settings.revoke')}
          </Button>
        </>
      ) : (
        <>
          <Alert tone="warning">{t('settings.noConsentWarn')}</Alert>
          <div style={{ marginTop: 14 }}>
            <Button loading={pending} onClick={() => void apply(true)}>
              {t('settings.give')}
            </Button>
          </div>
        </>
      )}
      <ConfirmDialog
        open={confirm}
        danger
        pending={pending}
        title={t('settings.revokeTitle')}
        body={t('settings.revokeBody')}
        confirmLabel={t('settings.revokeConfirm')}
        onConfirm={() => void apply(false)}
        onClose={() => setConfirm(false)}
      />
    </Section>
  );
}

function DeletionSection({ requestedAt, onChanged }: { requestedAt: string | null; onChanged: (p: Awaited<ReturnType<typeof profileApi.requestDeletion>>) => void }) {
  const toast = useToast();
  const [confirm, setConfirm] = useState(false);
  const [pending, setPending] = useState(false);
  return (
    <Section title={t('settings.deletion')}>
      {requestedAt ? (
        <>
          <Alert tone="warning">{t('settings.deletionRequested', { date: formatDateTime(requestedAt) })}</Alert>
          <div style={{ marginTop: 14 }}>
            <Button variant="ghost" onClick={async () => onChanged(await profileApi.cancelDeletion())}>
              {t('settings.withdrawRequest')}
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="ink-soft" style={{ marginTop: 0 }}>
            {t('settings.deletionHint')}
          </p>
          <Button variant="danger" onClick={() => setConfirm(true)}>
            {t('settings.requestDeletion')}
          </Button>
        </>
      )}
      <ConfirmDialog
        open={confirm}
        danger
        pending={pending}
        title={t('settings.deleteTitle')}
        body={t('settings.deleteBody')}
        confirmLabel={t('settings.send')}
        onClose={() => setConfirm(false)}
        onConfirm={async () => {
          setPending(true);
          try {
            onChanged(await profileApi.requestDeletion());
            toast.success(t('settings.sent'));
            setConfirm(false);
          } catch (err) {
            toast.error(t('settings.notSent'), errorText(err));
            setConfirm(false);
          } finally {
            setPending(false);
          }
        }}
      />
    </Section>
  );
}
