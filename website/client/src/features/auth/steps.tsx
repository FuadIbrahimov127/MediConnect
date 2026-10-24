import { isWeakPin, type FlowStartedDto, type SimaSessionDto, type SimaSessionStatusDto } from '@mediconnect/shared';
import { Rich } from '../../i18n/Rich';
import { QRCodeSVG } from 'qrcode.react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiClientError } from '../../api/client';
import { authApi } from '../../api/auth';
import { Alert, CodeInput, useCountdown } from '../../components/forms';
import { Button } from '../../components/ui';
import { formatCountdown } from '../../lib/format';
import { t } from '../../i18n';
import s from './auth.module.css';

// Qeydiyyat (UC-101) və PIN bərpasının (UC-103) ortaq addımları: OTP, SİMA QR, PIN təyini.

export function errorText(e: unknown) {
  return e instanceof ApiClientError ? e.message : t('common.errorTitle');
}

/** 6 rəqəmli SMS kodu: 120 s geri sayım, 60 s sonra təkrar göndərmə (FR-101-10..15). */
export function OtpStep({
  flow,
  onVerify,
  onResend,
}: {
  flow: FlowStartedDto;
  onVerify: (code: string) => Promise<void>;
  onResend: () => Promise<FlowStartedDto>;
}) {
  const [current, setCurrent] = useState(flow);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const left = useCountdown(current.otpExpiresAt);
  const resendLeft = useCountdown(current.resendAvailableAt);

  const submit = async (value = code) => {
    if (value.length !== 6 || pending) return;
    setPending(true);
    setError(null);
    try {
      await onVerify(value);
    } catch (e) {
      setError(errorText(e));
      setCode('');
    } finally {
      setPending(false);
    }
  };

  const resend = async () => {
    setError(null);
    try {
      setCurrent(await onResend());
      setCode('');
    } catch (e) {
      setError(errorText(e));
    }
  };

  return (
    <form
      className={s.form}
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <p className={s.lead} style={{ margin: 0 }}>
        <Rich text={t('auth.otpSent')} b={current.maskedNumber} />
      </p>
      <CodeInput length={6} value={code} onChange={setCode} onComplete={(v) => void submit(v)} invalid={!!error} autoFocus label={t('auth.smsCode')} disabled={pending} />
      {error && <Alert tone="error">{error}</Alert>}
      <div className={s.row}>
        <span className={`${s.timer} ${left < 20 ? s.timerLow : ''}`} aria-live="polite">
          {left > 0 ? t('auth.otpValid', { time: formatCountdown(left) }) : t('auth.otpExpired')}
        </span>
        <Button variant="link" onClick={() => void resend()} disabled={resendLeft > 0}>
          {resendLeft > 0 ? t('auth.resendIn', { n: resendLeft }) : t('auth.resend')}
        </Button>
      </div>
      <Button type="submit" block loading={pending} disabled={code.length !== 6 || left === 0}>
        {t('common.confirm')}
      </Button>
    </form>
  );
}

/** SİMA QR sessiyası: 5 dəq geri sayım, status polling, müddət bitəndə yeniləmə (UC-101 alt 2). */
export function SimaStep({
  createSession,
  onSuccess,
  onFailed,
}: {
  createSession: () => Promise<SimaSessionDto>;
  onSuccess: (status: SimaSessionStatusDto) => void;
  onFailed: (reason: string) => void;
}) {
  const [session, setSession] = useState<SimaSessionDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);
  const left = useCountdown(session?.expiresAt);
  const done = useRef(false);
  const createRef = useRef(createSession);
  createRef.current = createSession;

  const start = useCallback(async () => {
    setError(null);
    setExpired(false);
    try {
      setSession(await createRef.current());
    } catch (e) {
      setError(errorText(e));
    }
  }, []);

  useEffect(() => {
    void start();
  }, [start]);

  // Callback nəticəsini gözləyirik (SİMA → server → burada polling).
  useEffect(() => {
    if (!session || expired) return;
    const timer = setInterval(async () => {
      if (done.current) return;
      try {
        const st = await authApi.simaStatus(session.simaSessionId);
        if (st.sessionStatus === 'SUCCESS') {
          done.current = true;
          onSuccess(st);
        } else if (st.sessionStatus === 'FAILED') {
          done.current = true;
          onFailed(st.failureReason ?? t('auth.simaFailedDefault'));
        } else if (st.sessionStatus === 'EXPIRED') setExpired(true);
      } catch {
        /* növbəti cəhd */
      }
    }, 1500);
    return () => clearInterval(timer);
  }, [session, expired, onSuccess, onFailed]);

  useEffect(() => {
    if (session && left === 0) setExpired(true);
  }, [session, left]);

  if (error) {
    return (
      <div className={s.form}>
        <Alert tone="error">{error}</Alert>
        <Button variant="ghost" onClick={() => void start()}>
          {t('common.retry')}
        </Button>
      </div>
    );
  }

  return (
    <div className={s.form}>
      <p className={s.lead} style={{ margin: 0 }}>
        {t('auth.simaLeadA')} <strong>SİMA</strong> {t('auth.simaLeadB')}
      </p>
      <div className={s.qrBox}>
        <div className={`${s.qr} ${expired ? s.qrExpired : ''}`}>
          {session ? <QRCodeSVG value={session.qrPayload} size={196} level="M" /> : <div style={{ width: 196, height: 196 }} />}
        </div>
        {expired ? (
          <>
            <strong>{t('auth.qrExpired')}</strong>
            <Button variant="secondary" size="small" onClick={() => void start()}>
              {t('auth.refresh')}
            </Button>
          </>
        ) : (
          <>
            <div className={s.qrStatus} aria-live="polite">
              <span className={s.pulse} aria-hidden="true" /> {t('auth.waiting')}
            </div>
            <span className={`${s.timer} ${left < 30 ? s.timerLow : ''}`}>{formatCountdown(left)}</span>
          </>
        )}
      </div>
      {import.meta.env.DEV && (
        <Alert tone="info">{t('auth.simaDemo')}</Alert>
      )}
    </div>
  );
}

/** 4 rəqəmli PIN + təkrar (FR-101-32..37). Zəif PIN dərhal göstərilir, server də yoxlayır. */
export function PinFields({
  pin,
  confirm,
  onPin,
  onConfirm,
  error,
}: {
  pin: string;
  confirm: string;
  onPin: (v: string) => void;
  onConfirm: (v: string) => void;
  error?: string | null;
}) {
  const weak = pin.length === 4 && isWeakPin(pin);
  const mismatch = confirm.length === 4 && pin !== confirm;
  return (
    <>
      <div className="field">
        <span className="field-label">{t('auth.pinCode')}</span>
        <CodeInput length={4} masked value={pin} onChange={onPin} invalid={weak} autoFocus label={t('auth.pinCode')} />
        {weak ? <span className="field-error">{t('validation.weakPin')}</span> : <span className="field-hint">{t('auth.weakHint')}</span>}
      </div>
      <div className="field">
        <span className="field-label">{t('auth.repeatPin')}</span>
        <CodeInput length={4} masked value={confirm} onChange={onConfirm} invalid={mismatch} label={t('auth.pinRepeat')} />
        {mismatch && <span className="field-error">{t('validation.pinMismatch')}</span>}
      </div>
      {error && <Alert tone="error">{error}</Alert>}
    </>
  );
}

export const pinValid = (pin: string, confirm: string) => pin.length === 4 && pin === confirm && !isWeakPin(pin);

/** returnUrl yalnız daxili yol ola bilər (açıq yönləndirmənin qarşısı). */
export function safeReturnUrl(v: string | null): string | null {
  return v && v.startsWith('/') && !v.startsWith('//') ? v : null;
}
