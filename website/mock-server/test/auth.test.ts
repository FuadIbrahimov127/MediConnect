import { describe, expect, it } from 'vitest';
import { clock } from '../src/core/clock';
import { hmac } from '../src/core/crypto';
import { faults } from '../src/integrations/faults';
import { db } from '../src/store/db';
import { DEMO_PIN } from '../src/store/seed';
import { api, PHONES, tokenFor } from './helpers';

const NEW_PHONE = '+994551112233';
const NEW_FIN = '5AB7CD2'; // GOV_REGISTRY: Fuad İbrahimov

const lastOtpCode = (phone: string) => {
  const m = [...db.dev_outbox].reverse().find((x) => x.channel === 'SMS' && x.to === phone);
  return /(\d{6})/.exec(m?.body ?? '')?.[1] ?? '';
};

async function startRegistration(phone = NEW_PHONE, fin = NEW_FIN) {
  const res = await api().post('/v1/auth/register/initiate').send({ mobileNumber: phone, pin: fin, returnUrl: '/booking/abc' });
  expect(res.status).toBe(200);
  return res.body.data.flowId as string;
}

async function verifyOtp(registrationId: string, phone = NEW_PHONE) {
  await api().post('/v1/auth/otp/verify').send({ registrationId, otpCode: lastOtpCode(phone) }).expect(200);
}

async function simaScan(registrationId: string, outcome: 'SUCCESS' | 'FAILED' | 'FIN_MISMATCH' = 'SUCCESS') {
  const s = await api().post('/v1/auth/sima/session').send({ registrationId });
  expect(s.status).toBe(201);
  await api().post(`/__dev/sima/${s.body.data.qrToken}/scan`).send({ outcome }).expect(200);
  return s.body.data.simaSessionId as string;
}

describe('UC-101 qeydiyyat', () => {
  it('tam axın: OTP → SİMA → PIN → razılıq → hesab VERIFIED, return URL-ə qayıdış', async () => {
    const registrationId = await startRegistration();
    // OTP API cavabında qaytarılmır (FR-101-16), yalnız hash saxlanılır.
    expect(JSON.stringify(db.otp_verifications)).not.toContain(lastOtpCode(NEW_PHONE));
    await verifyOtp(registrationId);
    const simaSessionId = await simaScan(registrationId);

    const status = await api().get(`/v1/auth/sima/session/${simaSessionId}`);
    expect(status.body.data).toMatchObject({ sessionStatus: 'SUCCESS', profile: { firstName: 'Fuad', lastName: 'İbrahimov' } });

    const done = await api()
      .post('/v1/auth/register/complete')
      .send({ registrationId, simaSessionId, userPin: '8352', userPinConfirm: '8352', medicalConsent: true, consentVersion: '1.0' });
    expect(done.status).toBe(201);
    expect(done.body.data.redirectTo).toBe('/booking/abc');
    expect(done.body.data.user).toMatchObject({ role: 'PATIENT', status: 'VERIFIED', firstName: 'Fuad' });

    const me = await api().get('/v1/auth/me').set('Authorization', `Bearer ${done.body.data.token}`);
    expect(me.body.data.medicalConsent).toBe(true);
    expect(db.audit_logs.some((a) => a.action === 'REGISTER')).toBe(true);
  });

  it('mövcud FIN və ya telefon → 409 DuplicateAccount (EF-101-1)', async () => {
    const r1 = await api().post('/v1/auth/register/initiate').send({ mobileNumber: PHONES.patient, pin: NEW_FIN });
    expect(r1.body.errorType).toBe('DuplicateAccount');
    const r2 = await api().post('/v1/auth/register/initiate').send({ mobileNumber: NEW_PHONE, pin: '6NS35AA' });
    expect(r2.status).toBe(409);
  });

  it('format validasiyası sahə xətası qaytarır', async () => {
    const res = await api().post('/v1/auth/register/initiate').send({ mobileNumber: '0501234567', pin: 'abc' });
    expect(res.status).toBe(400);
    expect(Object.keys(res.body.details.fields)).toEqual(expect.arrayContaining(['mobileNumber', 'pin']));
  });

  it('yanlış OTP və 120 saniyədən sonra vaxtı keçmiş OTP rədd edilir (EF-101-2, BR-101-03)', async () => {
    const id = await startRegistration();
    const wrong = await api().post('/v1/auth/otp/verify').send({ registrationId: id, otpCode: '000000' });
    expect(wrong.body).toMatchObject({ errorType: 'InvalidOtp', details: { remainingAttempts: 4 } });
    const code = lastOtpCode(NEW_PHONE);
    clock.advanceMinutes(3);
    const late = await api().post('/v1/auth/otp/verify').send({ registrationId: id, otpCode: code });
    expect(late.body.errorType).toBe('InvalidOtp');
  });

  it('OTP təkrar göndərmə 60 saniyə ilə məhdudlaşdırılır', async () => {
    const id = await startRegistration();
    const soon = await api().post('/v1/auth/otp/resend').send({ registrationId: id });
    expect(soon.status).toBe(429);
    clock.advanceMinutes(1.1);
    await api().post('/v1/auth/otp/resend').send({ registrationId: id }).expect(200);
  });

  it('SMS çatdırılmırsa 503 (EF-101-6)', async () => {
    faults.set('sms', 'down');
    const res = await api().post('/v1/auth/register/initiate').send({ mobileNumber: NEW_PHONE, pin: NEW_FIN });
    expect(res.status).toBe(503);
  });

  it('OTP təsdiqlənmədən SİMA sessiyası açılmır', async () => {
    const id = await startRegistration();
    const res = await api().post('/v1/auth/sima/session').send({ registrationId: id });
    expect(res.body.errorType).toBe('InvalidStatusTransition');
  });

  it('SİMA əlçatmazdırsa 503 (EF-101-5)', async () => {
    const id = await startRegistration();
    await verifyOtp(id);
    faults.set('sima', 'down');
    const res = await api().post('/v1/auth/sima/session').send({ registrationId: id });
    expect(res.status).toBe(503);
  });

  it('SİMA uğursuz → hesab yaradılmır, axın silinir (EF-101-3, BR-101-05)', async () => {
    const id = await startRegistration();
    await verifyOtp(id);
    const simaSessionId = await simaScan(id, 'FAILED');
    const st = await api().get(`/v1/auth/sima/session/${simaSessionId}`);
    expect(st.body.data.sessionStatus).toBe('FAILED');
    const done = await api().post('/v1/auth/register/complete').send({ registrationId: id, simaSessionId, userPin: '8352', userPinConfirm: '8352', medicalConsent: true });
    expect(done.status).toBe(404);
    expect(db.users.some((u) => u.fin === NEW_FIN)).toBe(false);
  });

  it('başqa şəxsin üzü (FIN uyğunsuzluğu) qeydiyyatı dayandırır', async () => {
    const id = await startRegistration();
    await verifyOtp(id);
    const simaSessionId = await simaScan(id, 'FIN_MISMATCH');
    const st = await api().get(`/v1/auth/sima/session/${simaSessionId}`);
    expect(st.body.data.sessionStatus).toBe('FAILED');
    expect(db.security_events.some((e) => e.eventType === 'SIMA_MISMATCH')).toBe(true);
  });

  it('QR 5 dəqiqədən sonra etibarsızdır (EF-101-4)', async () => {
    const id = await startRegistration();
    await verifyOtp(id);
    const s = await api().post('/v1/auth/sima/session').send({ registrationId: id });
    clock.advanceMinutes(6);
    const scan = await api().post(`/__dev/sima/${s.body.data.qrToken}/scan`).send({ outcome: 'SUCCESS' });
    expect(scan.body.errorType).toBe('SimaSessionExpired');
  });

  it('saxta (imzasız) SİMA callback rədd edilir (FR-101-25)', async () => {
    const id = await startRegistration();
    await verifyOtp(id);
    const s = await api().post('/v1/auth/sima/session').send({ registrationId: id });
    const body = JSON.stringify({ qrToken: s.body.data.qrToken, status: 'SUCCESS', person: { fin: NEW_FIN, firstName: 'X', lastName: 'Y', fatherName: null, birthDate: '2000-01-01', gender: 'MALE' }, reason: null, issuedAt: clock.nowIso() });
    const forged = await api().post('/v1/auth/sima/callback').set('Content-Type', 'application/json').set('X-Sima-Signature', 'deadbeef').send(body);
    expect(forged.status).toBe(401);
    const signed = await api().post('/v1/auth/sima/callback').set('Content-Type', 'application/json').set('X-Sima-Signature', hmac(body)).send(body);
    expect(signed.body.data.sessionStatus).toBe('SUCCESS');
  });

  it('zəif PIN, uyğunsuz PIN və razılıqsız qeydiyyat rədd edilir', async () => {
    const id = await startRegistration();
    await verifyOtp(id);
    const simaSessionId = await simaScan(id);
    const base = { registrationId: id, simaSessionId, medicalConsent: true };
    expect((await api().post('/v1/auth/register/complete').send({ ...base, userPin: '1234', userPinConfirm: '1234' })).body.errorType).toBe('WeakPin');
    expect((await api().post('/v1/auth/register/complete').send({ ...base, userPin: '8352', userPinConfirm: '8353' })).body.errorType).toBe('PinMismatch');
    const noConsent = await api().post('/v1/auth/register/complete').send({ ...base, medicalConsent: false, userPin: '8352', userPinConfirm: '8352' });
    expect(noConsent.body.details.fields.medicalConsent).toBeTruthy();
  });
});

describe('UC-102 giriş', () => {
  it('telefon + PIN ilə giriş rola görə yönləndirir', async () => {
    const res = await api().post('/v1/auth/login').send({ mobileNumber: PHONES.doctor, userPin: DEMO_PIN });
    expect(res.status).toBe(200);
    expect(res.body.data.redirectTo).toBe('/doctor');
    const admin = await api().post('/v1/auth/login').send({ mobileNumber: PHONES.superAdmin, userPin: DEMO_PIN });
    expect(admin.body.data.redirectTo).toBe('/admin');
  });

  it('naməlum nömrə → AccountNotFound (EF-102-1)', async () => {
    const res = await api().post('/v1/auth/login/lookup').send({ mobileNumber: '+994509999999' });
    expect(res.body.errorType).toBe('AccountNotFound');
  });

  it('5 yanlış PIN → 30 dəqiqə blok + bildiriş, sonra açılır (BR-102-02)', async () => {
    for (let i = 1; i <= 4; i++) {
      const r = await api().post('/v1/auth/login').send({ mobileNumber: PHONES.patient, userPin: '9090' });
      expect(r.body).toMatchObject({ errorType: 'InvalidPin', details: { remainingAttempts: 5 - i } });
    }
    const fifth = await api().post('/v1/auth/login').send({ mobileNumber: PHONES.patient, userPin: '9090' });
    expect(fifth.status).toBe(429);
    expect(fifth.body.errorType).toBe('AccountLocked');
    // Bloklu ikən doğru PIN də qəbul edilmir.
    expect((await api().post('/v1/auth/login').send({ mobileNumber: PHONES.patient, userPin: DEMO_PIN })).status).toBe(429);
    expect(db.notifications.some((n) => n.notificationType === 'ACCOUNT_STATUS_CHANGED')).toBe(true);
    clock.advanceMinutes(31);
    expect((await api().post('/v1/auth/login').send({ mobileNumber: PHONES.patient, userPin: DEMO_PIN })).status).toBe(200);
  });

  it('bloklanmış hesab daxil ola bilmir (EF-102-3)', async () => {
    db.users.find((u) => u.mobileNumber === PHONES.patient)!.status = 'BLOCKED';
    const res = await api().post('/v1/auth/login').send({ mobileNumber: PHONES.patient, userPin: DEMO_PIN });
    expect(res.body.errorType).toBe('AccountBlocked');
  });

  it('yeni cihazdan giriş təhlükəsizlik bildirişi yaradır (FR-102-13)', async () => {
    await api().post('/v1/auth/login').send({ mobileNumber: PHONES.patient, userPin: DEMO_PIN, deviceId: 'laptop-1' }).expect(200);
    await api().post('/v1/auth/login').send({ mobileNumber: PHONES.patient, userPin: DEMO_PIN, deviceId: 'laptop-1' }).expect(200);
    expect(db.notifications.filter((n) => n.notificationType === 'SECURITY_NEW_DEVICE')).toHaveLength(0);
    await api().post('/v1/auth/login').send({ mobileNumber: PHONES.patient, userPin: DEMO_PIN, deviceId: 'phone-2' }).expect(200);
    expect(db.notifications.filter((n) => n.notificationType === 'SECURITY_NEW_DEVICE')).toHaveLength(1);
  });

  it('biometrik giriş: etibarlı cihaz tokeni ilə PIN tələb olunmur (alt 1)', async () => {
    const token = await tokenFor(PHONES.patient);
    const s = await api().patch('/v1/profile/settings').set('Authorization', `Bearer ${token}`).send({ biometricEnabled: true, deviceId: 'phone-1' });
    const deviceToken = s.body.data.deviceToken as string;
    expect(deviceToken).toBeTruthy();
    await api().post('/v1/auth/login').send({ mobileNumber: PHONES.patient, deviceToken }).expect(200);
    const bad = await api().post('/v1/auth/login').send({ mobileNumber: PHONES.patient, deviceToken: 'xxx' });
    expect(bad.body.details.fallbackToPin).toBe(true);
  });
});

describe('UC-103 PIN bərpası', () => {
  async function startReset() {
    const r = await api().post('/v1/auth/pin/reset/initiate').send({ mobileNumber: PHONES.patient });
    const resetId = r.body.data.flowId as string;
    await api().post('/v1/auth/otp/verify').send({ resetId, otpCode: lastOtpCode(PHONES.patient) }).expect(200);
    const s = await api().post('/v1/auth/sima/session').send({ resetId });
    return { resetId, qrToken: s.body.data.qrToken as string, simaSessionId: s.body.data.simaSessionId as string };
  }

  it('OTP + SİMA ilə yeni PIN, bütün sessiyalar bağlanır (BR-103-03)', async () => {
    const old = await tokenFor(PHONES.patient);
    const { resetId, qrToken, simaSessionId } = await startReset();
    await api().post(`/__dev/sima/${qrToken}/scan`).send({ outcome: 'SUCCESS' });
    const same = await api().post('/v1/auth/pin/reset').send({ resetId, simaSessionId, newPin: DEMO_PIN, newPinConfirm: DEMO_PIN });
    expect(same.body.errorType).toBe('PinSameAsOld');
    await api().post('/v1/auth/pin/reset').send({ resetId, simaSessionId, newPin: '7395', newPinConfirm: '7395' }).expect(200);
    await api().get('/v1/auth/me').set('Authorization', `Bearer ${old}`).expect(401);
    await api().post('/v1/auth/login').send({ mobileNumber: PHONES.patient, userPin: '7395' }).expect(200);
  });

  it('FIN uyğunsuzluğu → əməliyyat bloklanır və təhlükəsizlik log-una yazılır (EF-103-2)', async () => {
    const { resetId, qrToken, simaSessionId } = await startReset();
    await api().post(`/__dev/sima/${qrToken}/scan`).send({ outcome: 'FIN_MISMATCH' });
    const res = await api().post('/v1/auth/pin/reset').send({ resetId, simaSessionId, newPin: '7395', newPinConfirm: '7395' });
    expect(res.body.errorType).toBe('FinMismatch');
    expect(db.security_events.some((e) => e.eventType === 'SIMA_MISMATCH' && e.severity === 'HIGH')).toBe(true);
  });
});

describe('UC-104 profil', () => {
  it('SİMA sahələri redaktə edilə bilmir (EF-104-1)', async () => {
    const token = await tokenFor(PHONES.patient);
    const res = await api().patch('/v1/profile').set('Authorization', `Bearer ${token}`).send({ firstName: 'Başqa', email: 'a@b.az' });
    expect(res.status).toBe(400);
    expect(res.body.details.fields.firstName).toMatch(/SİMA/);
  });

  it('əlaqə və tibbi məlumatlar yenilənir, audit yazılır', async () => {
    const token = await tokenFor(PHONES.patient);
    const auth = { Authorization: `Bearer ${token}` };
    const p = await api().patch('/v1/profile').set(auth).send({ email: 'nigar@new.az', bloodType: 'B+' });
    expect(p.body.data).toMatchObject({ email: 'nigar@new.az', patient: { bloodType: 'B+' } });
    const a = await api().post('/v1/profile/allergies').set(auth).send({ allergenName: 'Yerfındığı', severity: 'MODERATE' });
    expect(a.body.data.patient.allergies.map((x: { allergenName: string }) => x.allergenName)).toContain('Yerfındığı');
    expect(db.audit_logs.filter((x) => ['UPDATE_PROFILE', 'ADD_ALLERGY'].includes(x.action))).toHaveLength(2);
  });

  it('yanlış email formatı rədd edilir (EF-104-2)', async () => {
    const token = await tokenFor(PHONES.patient);
    const res = await api().patch('/v1/profile').set('Authorization', `Bearer ${token}`).send({ email: 'yanlış' });
    expect(res.body.details.fields.email).toBeTruthy();
  });

  it('telefon dəyişikliyi OTP tələb edir (BR-104-02)', async () => {
    const token = await tokenFor(PHONES.patient);
    const auth = { Authorization: `Bearer ${token}` };
    const init = await api().post('/v1/profile/phone-change/initiate').set(auth).send({ mobileNumber: NEW_PHONE });
    const changeId = init.body.data.changeId;
    expect((await api().post('/v1/profile/phone-change/confirm').set(auth).send({ changeId, otpCode: '000000' })).body.errorType).toBe('InvalidOtp');
    const ok = await api().post('/v1/profile/phone-change/confirm').set(auth).send({ changeId, otpCode: lastOtpCode(NEW_PHONE) });
    expect(ok.body.data.mobileNumber).toBe(NEW_PHONE);
  });

  it('razılığın geri götürülməsi qeyd olunur (BR-104-04)', async () => {
    const token = await tokenFor(PHONES.patient);
    const res = await api().put('/v1/profile/consent').set('Authorization', `Bearer ${token}`).send({ medicalConsent: false });
    expect(res.body.data.patient.medicalConsent).toBe(false);
    expect(db.audit_logs.some((x) => x.action === 'WITHDRAW_CONSENT')).toBe(true);
  });

  it('məcburi bildirişlər söndürülə bilmir (BR-1001-01)', async () => {
    const token = await tokenFor(PHONES.patient);
    const res = await api()
      .put('/v1/profile/notification-preferences')
      .set('Authorization', `Bearer ${token}`)
      .send({ preferences: [{ notificationType: 'APPOINTMENT_CONFIRMED', smsEnabled: false, pushEnabled: false, emailEnabled: false }, { notificationType: 'REMINDER_2H', smsEnabled: false, pushEnabled: false, emailEnabled: false }] });
    const byType = Object.fromEntries(res.body.data.map((p: { notificationType: string; pushEnabled: boolean }) => [p.notificationType, p.pushEnabled]));
    expect(byType.APPOINTMENT_CONFIRMED).toBe(true);
    expect(byType.REMINDER_2H).toBe(false);
  });

  it('PIN dəyişikliyi digər sessiyaları bağlayır, cari sessiya qalır', async () => {
    const t1 = await tokenFor(PHONES.patient);
    const t2 = await tokenFor(PHONES.patient);
    await api().patch('/v1/profile/pin').set('Authorization', `Bearer ${t1}`).send({ currentPin: DEMO_PIN, newPin: '7395', newPinConfirm: '7395' }).expect(200);
    await api().get('/v1/auth/me').set('Authorization', `Bearer ${t1}`).expect(200);
    await api().get('/v1/auth/me').set('Authorization', `Bearer ${t2}`).expect(401);
  });

  it('tibbi profil endpoint-ləri yalnız pasient üçündür', async () => {
    const token = await tokenFor(PHONES.doctor);
    const res = await api().post('/v1/profile/allergies').set('Authorization', `Bearer ${token}`).send({ allergenName: 'X', severity: 'MILD' });
    expect(res.status).toBe(403);
  });
});
