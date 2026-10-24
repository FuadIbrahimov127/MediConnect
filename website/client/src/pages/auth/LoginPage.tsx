import { mobileNumberSchema, type LoginLookupDto } from '@mediconnect/shared';
import { Rich } from '../../i18n/Rich';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ApiClientError, serverNow } from '../../api/client';
import { authApi } from '../../api/auth';
import { useAuth } from '../../auth/AuthContext';
import { Alert, CodeInput, Modal } from '../../components/forms';
import { Button } from '../../components/ui';
import { PhoneInput, phoneComplete } from '../../features/auth/PhoneInput';
import { errorText, safeReturnUrl } from '../../features/auth/steps';
import s from '../../features/auth/auth.module.css';
import { biometricStore, deviceId } from '../../lib/device';
import { formatTime } from '../../lib/format';
import { tValidation, t } from '../../i18n';

// UC-102 — telefon → PIN (və ya biometrik) → rola görə panel / return URL.

export function LoginPage() {
  const [params] = useSearchParams();
  const returnUrl = safeReturnUrl(params.get('returnUrl'));
  const navigate = useNavigate();
  const { signIn, expired } = useAuth();

  const [mobileNumber, setMobileNumber] = useState(params.get('phone') ?? '+994');
  const [account, setAccount] = useState<LoginLookupDto | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [lockedUntil, setLockedUntil] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [bioPrompt, setBioPrompt] = useState(false);
  const bioToken = account ? biometricStore.get(mobileNumber) : null;

  const lookup = async (e: FormEvent) => {
    e.preventDefault();
    const v = mobileNumberSchema.safeParse(mobileNumber);
    if (!v.success) return setError(tValidation(v.error.issues[0].message));
    setPending(true);
    setError(null);
    setNotFound(false);
    try {
      const acc = await authApi.lookup(mobileNumber);
      setAccount(acc);
      setLockedUntil(acc.lockedUntil);
    } catch (err) {
      if (err instanceof ApiClientError && err.errorType === 'AccountNotFound') setNotFound(true);
      setError(errorText(err));
    } finally {
      setPending(false);
    }
  };

  const finish = (res: Awaited<ReturnType<typeof authApi.login>>) => {
    signIn(res);
    // Return URL yalnız pasient üçün mənalıdır (qorunan pasient səhifəsi); digər rollar öz panelinə.
    navigate(returnUrl && res.user.role === 'PATIENT' ? returnUrl : res.redirectTo, { replace: true });
  };

  const loginWithPin = async (value = pin) => {
    if (value.length !== 4 || pending) return;
    setPending(true);
    setError(null);
    try {
      finish(await authApi.login({ mobileNumber, userPin: value, deviceId: deviceId() }));
    } catch (err) {
      const e = err as ApiClientError;
      setPin('');
      if (e.errorType === 'AccountLocked') setLockedUntil(String(e.details?.lockedUntil ?? ''));
      setError(e.errorType === 'InvalidPin' ? t('auth.invalidPin', { n: String(e.details?.remainingAttempts ?? '—') }) : errorText(err));
    } finally {
      setPending(false);
    }
  };

  const loginWithBiometric = async (success: boolean) => {
    setBioPrompt(false);
    if (!success || !bioToken) {
      setError(t('auth.bioFailed')); // EF-102-5
      return;
    }
    setPending(true);
    try {
      finish(await authApi.login({ mobileNumber, deviceToken: bioToken, deviceId: deviceId() }));
    } catch (err) {
      biometricStore.set(mobileNumber, null);
      setError(`${errorText(err)} ${t('auth.usePin')}`);
    } finally {
      setPending(false);
    }
  };

  return (
    <div>
      <h1 className={s.title}>{t('auth.login')}</h1>
      {expired && !account && <Alert tone="warning">{t('auth.sessionExpired')}</Alert>}

      {!account ? (
        <form className={s.form} onSubmit={lookup} noValidate style={{ marginTop: expired ? 18 : 0 }}>
          <p className={s.lead} style={{ margin: 0 }}>
            {t('auth.enterPhone')}
          </p>
          <PhoneInput value={mobileNumber} onChange={setMobileNumber} autoFocus />
          {error && (
            <Alert tone="error">
              {error}
              {notFound && (
                <>
                  {' '}
                  <Link to={`/register${returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''}`} style={{ fontWeight: 700, color: 'inherit', textDecoration: 'underline' }}>
                    {t('auth.registerLink')}
                  </Link>
                </>
              )}
            </Alert>
          )}
          <Button type="submit" block arrow loading={pending} disabled={!phoneComplete(mobileNumber)}>
            {t('common.next')}
          </Button>
        </form>
      ) : (
        <form
          className={s.form}
          onSubmit={(e) => {
            e.preventDefault();
            void loginWithPin();
          }}
        >
          <p className={s.hello}>
            <Rich text={t('auth.hello')} b={account.firstName} />
          </p>
          {lockedUntil && new Date(lockedUntil).getTime() > serverNow() ? (
            <Alert tone="error">{t('auth.locked', { time: formatTime(lockedUntil) })}</Alert>
          ) : (
            <CodeInput length={4} masked value={pin} onChange={setPin} onComplete={(v) => void loginWithPin(v)} autoFocus invalid={!!error} label={t('auth.pinCode')} disabled={pending} />
          )}
          {error && !lockedUntil && <Alert tone="error">{error}</Alert>}
          <Button type="submit" block loading={pending} disabled={pin.length !== 4}>
            {t('auth.login')}
          </Button>
          {account.biometricEnabled && bioToken && (
            <Button variant="ghost" block onClick={() => setBioPrompt(true)}>
              {t('auth.bioLogin')}
            </Button>
          )}
          <div className={s.row}>
            <Button
              variant="link"
              onClick={() => {
                setAccount(null);
                setPin('');
                setError(null);
                setLockedUntil(null);
              }}
            >
              {t('auth.otherNumber')}
            </Button>
            <Link to={`/login/reset-pin?phone=${encodeURIComponent(mobileNumber)}`} style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent)' }}>
              {t('auth.forgotPin')}
            </Link>
          </div>
        </form>
      )}

      <Modal
        open={bioPrompt}
        title={t('auth.bioTitle')}
        onClose={() => setBioPrompt(false)}
        actions={
          <>
            <Button variant="ghost" onClick={() => void loginWithBiometric(false)}>
              {t('auth.bioFail')}
            </Button>
            <Button onClick={() => void loginWithBiometric(true)}>{t('auth.bioOk')}</Button>
          </>
        }
      >
        {t('auth.bioDemo')}
      </Modal>

      <div className={s.foot}>
        {t('auth.noAccount')} <Link to={`/register${returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''}`}>{t('auth.registerLink')}</Link>
      </div>
    </div>
  );
}
