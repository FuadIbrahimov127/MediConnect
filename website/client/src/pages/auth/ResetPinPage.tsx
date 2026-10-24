import { mobileNumberSchema, type FlowStartedDto } from '@mediconnect/shared';
import { useCallback, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ApiClientError } from '../../api/client';
import { authApi } from '../../api/auth';
import { Alert, Steps } from '../../components/forms';
import { Button } from '../../components/ui';
import { useToast } from '../../components/Toast';
import { PhoneInput, phoneComplete } from '../../features/auth/PhoneInput';
import { errorText, OtpStep, PinFields, pinValid, SimaStep } from '../../features/auth/steps';
import s from '../../features/auth/auth.module.css';
import { biometricStore } from '../../lib/device';
import { tValidation, t } from '../../i18n';

// UC-103 — PIN bərpası: telefon → OTP → SİMA (FIN hesabdakı ilə eyni olmalıdır) → yeni PIN → bütün sessiyalar bağlanır.

type Step = 1 | 2 | 3 | 4;
const LABELS = [t('auth.phone'), t('auth.smsCode'), t('auth.stepIdentity'), t('auth.newPin')];

export function ResetPinPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [step, setStep] = useState<Step>(1);
  const [mobileNumber, setMobileNumber] = useState(params.get('phone') ?? '+994');
  const [flow, setFlow] = useState<FlowStartedDto | null>(null);
  const [simaSessionId, setSimaSessionId] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const start = async (e: FormEvent) => {
    e.preventDefault();
    const v = mobileNumberSchema.safeParse(mobileNumber);
    if (!v.success) return setError(tValidation(v.error.issues[0].message));
    setPending(true);
    setError(null);
    try {
      setFlow(await authApi.pinResetInitiate(mobileNumber));
      setStep(2);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setPending(false);
    }
  };

  const createSima = useCallback(async () => {
    const dto = await authApi.simaSession({ resetId: flow!.flowId });
    setSimaSessionId(dto.simaSessionId);
    return dto;
  }, [flow]);
  const onSimaSuccess = useCallback(() => setStep(4), []);
  const onSimaFailed = useCallback((reason: string) => setFailed(reason), []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!flow || !simaSessionId) return;
    setPending(true);
    setError(null);
    try {
      await authApi.pinReset({ resetId: flow.flowId, simaSessionId, newPin: pin, newPinConfirm: confirm });
      biometricStore.set(mobileNumber, null);
      toast.success(t('auth.pinUpdated'), t('auth.pinUpdatedBody'));
      navigate(`/login?phone=${encodeURIComponent(mobileNumber)}`, { replace: true });
    } catch (err) {
      setError(errorText(err));
      if ((err as ApiClientError).errorType !== 'PinSameAsOld') {
        setPin('');
        setConfirm('');
      }
    } finally {
      setPending(false);
    }
  };

  if (failed) {
    return (
      <div className={s.success}>
        <h1 className={s.title}>{t('auth.pinNotChanged')}</h1>
        <Alert tone="error">{failed}. {t('auth.opStopped')}</Alert>
        <Button onClick={() => window.location.reload()}>{t('auth.restart')}</Button>
      </div>
    );
  }

  return (
    <div>
      <Steps total={4} current={step} label={LABELS[step - 1]} />
      <h1 className={s.title}>{t('auth.resetTitle')}</h1>

      {step === 1 && (
        <form className={s.form} onSubmit={start} noValidate>
          <p className={s.lead} style={{ margin: 0 }}>
            {t('auth.resetLead')}
          </p>
          <PhoneInput value={mobileNumber} onChange={setMobileNumber} autoFocus />
          {error && <Alert tone="error">{error}</Alert>}
          <Button type="submit" block arrow loading={pending} disabled={!phoneComplete(mobileNumber)}>
            {t('common.next')}
          </Button>
        </form>
      )}

      {step === 2 && flow && (
        <OtpStep
          flow={flow}
          onVerify={async (otpCode) => {
            await authApi.otpVerify({ resetId: flow.flowId, otpCode });
            setStep(3);
          }}
          onResend={async () => {
            const next = await authApi.otpResend({ resetId: flow.flowId });
            setFlow(next);
            return next;
          }}
        />
      )}

      {step === 3 && flow && <SimaStep createSession={createSima} onSuccess={onSimaSuccess} onFailed={onSimaFailed} />}

      {step === 4 && (
        <form className={s.form} onSubmit={submit}>
          <PinFields pin={pin} confirm={confirm} onPin={setPin} onConfirm={setConfirm} error={error} />
          <Button type="submit" block loading={pending} disabled={!pinValid(pin, confirm)}>
            {t('auth.updatePin')}
          </Button>
        </form>
      )}

      <div className={s.foot}>
        <Link to="/login">{t('auth.backToLogin')}</Link>
      </div>
    </div>
  );
}
