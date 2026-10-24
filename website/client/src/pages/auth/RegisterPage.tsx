import { finSchema, mobileNumberSchema, type FlowStartedDto, type SimaProfileDto } from '@mediconnect/shared';
import { Rich } from '../../i18n/Rich';
import { useCallback, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ApiClientError } from '../../api/client';
import { authApi } from '../../api/auth';
import { useAuth } from '../../auth/AuthContext';
import { Alert, Checkbox, Field, Steps, Switch } from '../../components/forms';
import { Button } from '../../components/ui';
import { useToast } from '../../components/Toast';
import { PhoneInput, phoneComplete } from '../../features/auth/PhoneInput';
import { errorText, OtpStep, PinFields, pinValid, safeReturnUrl, SimaStep } from '../../features/auth/steps';
import s from '../../features/auth/auth.module.css';
import { biometricStore, deviceId } from '../../lib/device';
import { formatDate } from '../../lib/format';
import { t, tValidation } from '../../i18n';

// UC-101 — Pasient qeydiyyatı: telefon + FIN → OTP → SİMA (QR + üz tanıma) → PIN → biometrik + razılıq → hesab.
// Return URL (məs. /booking/{doctorId}) qeydiyyatdan sonra istifadə olunur (FR-101-46).

type Step = 1 | 2 | 3 | 4 | 5;
const STEP_LABELS = [t('auth.stepData'), t('auth.stepPhone'), t('auth.stepIdentity'), t('auth.pinCode'), t('auth.stepConsent')];

export function RegisterPage() {
  const [params] = useSearchParams();
  const returnUrl = safeReturnUrl(params.get('returnUrl'));
  const navigate = useNavigate();
  const toast = useToast();
  const { signIn } = useAuth();

  const [step, setStep] = useState<Step>(1);
  const [mobileNumber, setMobileNumber] = useState('+994');
  const [fin, setFin] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [flow, setFlow] = useState<FlowStartedDto | null>(null);
  const [simaSessionId, setSimaSessionId] = useState<string | null>(null);
  const [person, setPerson] = useState<SimaProfileDto | null>(null);
  const [simaFailed, setSimaFailed] = useState<string | null>(null);
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [biometric, setBiometric] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [medical, setMedical] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const start = async (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    const m = mobileNumberSchema.safeParse(mobileNumber);
    if (!m.success) errs.mobileNumber = tValidation(m.error.issues[0].message);
    const f = finSchema.safeParse(fin);
    if (!f.success) errs.pin = tValidation(f.error.issues[0].message);
    setFieldErrors(errs);
    if (Object.keys(errs).length) return;
    setPending(true);
    setError(null);
    try {
      setFlow(await authApi.registerInitiate({ mobileNumber, pin: fin, returnUrl }));
      setStep(2);
    } catch (err) {
      if (err instanceof ApiClientError && err.errorType === 'DuplicateAccount') {
        // EF-101-1: mövcud hesab → login.
        toast.show(t('auth.alreadyTitle'), t('auth.alreadyBody'));
        navigate(`/login?phone=${encodeURIComponent(mobileNumber)}${returnUrl ? `&returnUrl=${encodeURIComponent(returnUrl)}` : ''}`);
        return;
      }
      if (err instanceof ApiClientError) setFieldErrors(err.fieldErrors);
      setError(errorText(err));
    } finally {
      setPending(false);
    }
  };

  const createSima = useCallback(async () => {
    const dto = await authApi.simaSession({ registrationId: flow!.flowId });
    setSimaSessionId(dto.simaSessionId);
    return dto;
  }, [flow]);

  const onSimaSuccess = useCallback((st: { profile: SimaProfileDto | null }) => {
    setPerson(st.profile);
    setStep(4);
  }, []);
  const onSimaFailed = useCallback((reason: string) => setSimaFailed(reason), []);

  const complete = async () => {
    if (!flow || !simaSessionId) return;
    setPending(true);
    setError(null);
    try {
      const res = await authApi.registerComplete({
        registrationId: flow.flowId,
        simaSessionId,
        userPin: pin,
        userPinConfirm: pinConfirm,
        medicalConsent: medical,
        consentVersion: '1.0',
        biometricEnabled: biometric,
        deviceId: deviceId(),
      });
      if (res.deviceToken) biometricStore.set(mobileNumber, res.deviceToken);
      signIn(res);
      toast.success(t('auth.registered'), t('auth.welcome', { name: res.user.firstName }));
      navigate(res.redirectTo, { replace: true });
    } catch (err) {
      const e = err as ApiClientError;
      if (e.errorType === 'WeakPin' || e.errorType === 'PinMismatch') {
        setPin('');
        setPinConfirm('');
        setStep(4);
      }
      setError(errorText(err));
    } finally {
      setPending(false);
    }
  };

  // EF-101-3: SİMA uğursuz → hesab yaradılmır, məlumatlar silinir.
  if (simaFailed) {
    return (
      <div className={s.success}>
        <h1 className={s.title}>{t('auth.verifyFailed')}</h1>
        <Alert tone="error">{simaFailed}. {t('auth.regDataDeleted')}</Alert>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Button onClick={() => window.location.reload()}>{t('auth.restart')}</Button>
          <Button variant="ghost" onClick={() => navigate('/')}>
            {t('common.goHome')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Steps total={5} current={step} label={STEP_LABELS[step - 1]} />
      <h1 className={s.title}>{t('auth.register')}</h1>

      {step === 1 && (
        <form className={s.form} onSubmit={start} noValidate>
          <p className={s.lead} style={{ margin: 0 }}>
            {t('auth.simaLead')}
          </p>
          <PhoneInput value={mobileNumber} onChange={setMobileNumber} error={fieldErrors.mobileNumber} autoFocus />
          <Field label={t('auth.fin')} htmlFor="fin" error={fieldErrors.pin} hint={t('auth.finHint')}>
            <input
              id="fin"
              className="input"
              value={fin}
              maxLength={7}
              autoComplete="off"
              aria-invalid={!!fieldErrors.pin || undefined}
              style={{ textTransform: 'uppercase', letterSpacing: '.12em', fontFamily: 'var(--font-mono)' }}
              onChange={(e) => setFin(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
            />
          </Field>
          {error && <Alert tone="error">{error}</Alert>}
          <Button type="submit" block arrow loading={pending} disabled={!phoneComplete(mobileNumber) || fin.length !== 7}>
            {t('common.next')}
          </Button>
        </form>
      )}

      {step === 2 && flow && (
        <OtpStep
          flow={flow}
          onVerify={async (otpCode) => {
            await authApi.otpVerify({ registrationId: flow.flowId, otpCode });
            setStep(3);
          }}
          onResend={async () => {
            const next = await authApi.otpResend({ registrationId: flow.flowId });
            setFlow(next);
            return next;
          }}
        />
      )}

      {step === 3 && flow && <SimaStep createSession={createSima} onSuccess={onSimaSuccess} onFailed={onSimaFailed} />}

      {step === 4 && person && (
        <form
          className={s.form}
          onSubmit={(e) => {
            e.preventDefault();
            if (pinValid(pin, pinConfirm)) {
              setError(null);
              setStep(5);
            }
          }}
        >
          <div>
            <p className={s.hello}>
              <Rich text={t('auth.verifiedHello')} b={person.firstName} />
            </p>
            <SimaSummary person={person} />
          </div>
          <PinFields pin={pin} confirm={pinConfirm} onPin={setPin} onConfirm={setPinConfirm} error={error} />
          <Button type="submit" block arrow disabled={!pinValid(pin, pinConfirm)}>
            {t('common.next')}
          </Button>
        </form>
      )}

      {step === 5 && (
        <div className={s.form}>
          <div className="card" style={{ padding: 18 }}>
            <Switch checked={biometric} onChange={setBiometric} label={t('auth.bioSwitch')} />
            <p className="field-hint" style={{ margin: '8px 0 0' }}>
              {t('auth.bioLocal')}
            </p>
          </div>
          <Checkbox checked={privacy} onChange={setPrivacy}>
            <Rich
              text={t('auth.privacyAgree')}
              a={(x) => (
                <Link to="/#necə-işləyir" target="_blank">
                  {x}
                </Link>
              )}
            />
          </Checkbox>
          <Checkbox checked={medical} onChange={setMedical}>
            <Rich text={t('auth.medicalConsent')} />
          </Checkbox>
          {error && <Alert tone="error">{error}</Alert>}
          <Button block loading={pending} disabled={!privacy || !medical} onClick={() => void complete()}>
            {t('auth.finishRegistration')}
          </Button>
          <Button variant="link" onClick={() => setStep(4)}>
            {t('common.back')}
          </Button>
        </div>
      )}

      <div className={s.foot}>
        {t('auth.haveAccount')} <Link to={`/login${returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''}`}>{t('auth.loginLink')}</Link>
      </div>
    </div>
  );
}

function SimaSummary({ person }: { person: SimaProfileDto }) {
  const lock = (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
  const items: [string, string][] = [
    [t('auth.firstName'), person.firstName],
    [t('auth.lastName'), person.lastName],
    [t('auth.fatherName'), person.fatherName ?? '—'],
    [t('auth.birthDate'), formatDate(person.birthDate)],
    [t('auth.gender'), person.gender === 'MALE' ? t('auth.male') : t('auth.female')],
    ['FIN', person.fin],
  ];
  return (
    <div className={s.readonly} aria-label={t('auth.simaData')}>
      {items.map(([label, value]) => (
        <div key={label} className={s.readonlyItem}>
          <div className={s.readonlyLabel}>
            {lock} {label}
          </div>
          <div className={s.readonlyValue}>{value}</div>
        </div>
      ))}
    </div>
  );
}

export { SimaSummary };
