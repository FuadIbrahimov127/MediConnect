import { useCallback, useState, type FormEvent } from 'react';
import { t } from '../../i18n';
import { useNavigate, useParams } from 'react-router-dom';
import { invitesApi } from '../../api/clinicAdmin';
import { ApiClientError } from '../../api/client';
import { useApi } from '../../api/hooks';
import { useAuth } from '../../auth/AuthContext';
import { Alert, Field, Steps } from '../../components/forms';
import { Button, Skeleton } from '../../components/ui';
import { useToast } from '../../components/Toast';
import { errorText, PinFields, pinValid, SimaStep } from '../../features/auth/steps';
import s from '../../features/auth/auth.module.css';
import { formatDateTime } from '../../lib/format';

// UC-802 / UC-901 — həkim və klinika admini dəvətinin qəbulu: yeni həkim SİMA ilə şəxsiyyətini təsdiqləyir (BR-802-02) və PIN qurur;
// mövcud həkim (başqa klinikada işləyir) PIN ilə qəbul edir (alt 1). Rədd → bağlantı ləğv olunur (EF-802-1).

export function InvitePage() {
  const { token = '' } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { signIn } = useAuth();
  const info = useApi((sig) => invitesApi.info(token, sig), [token]);
  const [step, setStep] = useState<'intro' | 'sima' | 'pin' | 'declined'>('intro');
  const [simaSessionId, setSimaSessionId] = useState<string | null>(null);
  const [simaFailed, setSimaFailed] = useState<string | null>(null);
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const createSima = useCallback(async () => {
    const sess = await invitesApi.startSima(token);
    setSimaSessionId(sess.simaSessionId);
    return sess;
  }, [token]);
  const onSimaSuccess = useCallback(() => setStep('pin'), []);
  const onSimaFailed = useCallback((reason: string) => setSimaFailed(reason), []);

  const accept = async (e: FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const res = await invitesApi.accept(token, { simaSessionId: simaSessionId ?? undefined, userPin: pin, userPinConfirm: info.data?.existingAccount ? undefined : pinConfirm });
      signIn(res);
      toast.success(t('auth.inviteAccepted'), t('auth.inviteLinked', { clinic: info.data?.clinicName ?? '' }));
      navigate(res.redirectTo, { replace: true });
    } catch (err) {
      const x = err as ApiClientError;
      if (x.errorType === 'WeakPin' || x.errorType === 'PinMismatch' || x.errorType === 'InvalidPin') (setPin(''), setPinConfirm(''));
      setError(errorText(err));
    } finally {
      setPending(false);
    }
  };
  const decline = async () => {
    setPending(true);
    try {
      await invitesApi.decline(token);
      setStep('declined');
    } catch (err) {
      setError(errorText(err));
    } finally {
      setPending(false);
    }
  };

  if (info.error)
    return (
      <div className={s.success}>
        <h1 className={s.title}>{info.error.errorType === 'InviteExpired' ? t('auth.inviteExpired') : t('auth.inviteNotFound')}</h1>
        <Alert tone="warning">
          {info.error.errorType === 'InviteExpired'
            ? t('auth.inviteExpiredBody')
            : t('auth.inviteInvalidBody')}
        </Alert>
        <Button variant="ghost" onClick={() => navigate('/login')}>
          {t('auth.goLogin')}
        </Button>
      </div>
    );
  if (!info.data) return <Skeleton height={300} radius={18} />;
  const d = info.data;

  if (step === 'declined')
    return (
      <div className={s.success}>
        <h1 className={s.title}>{t('auth.inviteDeclined')}</h1>
        <p className="ink-soft">{t('auth.inviteDeclinedBody', { clinic: d.clinicName })}</p>
      </div>
    );
  if (simaFailed)
    return (
      <div className={s.success}>
        <h1 className={s.title}>{t('auth.verifyFailed')}</h1>
        <Alert tone="error">{simaFailed}. {t('auth.inviteStillValid')}</Alert>
        <Button onClick={() => (setSimaFailed(null), setStep('sima'))}>{t('common.retry')}</Button>
      </div>
    );

  return (
    <div>
      {!d.existingAccount && <Steps total={3} current={step === 'intro' ? 1 : step === 'sima' ? 2 : 3} label={step === 'intro' ? t('auth.invite') : step === 'sima' ? t('auth.stepIdentity') : t('auth.pinCode')} />}
      <h1 className={s.title}>{d.kind === 'CLINIC_ADMIN' ? t('auth.inviteAdminTitle') : t('auth.inviteDoctorTitle')}</h1>
      {step === 'intro' && (
        <div className={s.form}>
          <div className="card" style={{ padding: 18 }}>
            <strong>{d.clinicName}</strong>
            <div className="ink-soft" style={{ fontSize: 14 }}>
              {d.clinicAddress}
            </div>
            <p style={{ marginBottom: 0 }}>
              {d.fullName}, {d.kind === 'CLINIC_ADMIN' ? t('auth.inviteAdminBody') : t('auth.inviteDoctorBody')} {t('auth.inviteSent', { phone: d.maskedMobile, date: formatDateTime(d.expiresAt) })}
            </p>
          </div>
          {d.existingAccount ? (
            <form className={s.form} onSubmit={(e) => void accept(e)}>
              <Alert tone="info">{t('auth.inviteExisting')}</Alert>
              <Field label="PIN" htmlFor="inv-pin">
                <input id="inv-pin" className="input" type="password" inputMode="numeric" maxLength={4} autoComplete="current-password" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} />
              </Field>
              {error && <Alert tone="error">{error}</Alert>}
              <Button type="submit" block loading={pending} disabled={pin.length !== 4}>
                {t('auth.acceptInvite')}
              </Button>
            </form>
          ) : (
            <>
              <p className="ink-soft" style={{ margin: 0 }}>
                {t('auth.inviteSimaLead')}
              </p>
              <Button block onClick={() => setStep('sima')}>
                {t('auth.verifySima')}
              </Button>
            </>
          )}
          <Button variant="ghost" block loading={pending} onClick={() => void decline()}>
            {t('auth.declineInvite')}
          </Button>
        </div>
      )}
      {step === 'sima' && <SimaStep createSession={createSima} onSuccess={onSimaSuccess} onFailed={onSimaFailed} />}
      {step === 'pin' && (
        <form className={s.form} onSubmit={(e) => void accept(e)}>
          <Alert tone="success">{t('auth.setPinLead')}</Alert>
          <PinFields pin={pin} confirm={pinConfirm} onPin={setPin} onConfirm={setPinConfirm} error={error} />
          <Button type="submit" block loading={pending} disabled={!pinValid(pin, pinConfirm)}>
            {t('auth.activate')}
          </Button>
        </form>
      )}
    </div>
  );
}
