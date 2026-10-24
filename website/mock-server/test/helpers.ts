import request from 'supertest';
import { createApp } from '../src/app';
import { db } from '../src/store/db';

export const app = createApp();
export const api = () => request(app);

export const userByPhone = (phone: string) => {
  const u = db.users.find((x) => x.mobileNumber === phone);
  if (!u) throw new Error(`seed-də ${phone} yoxdur`);
  return u;
};

/** Dev login-as ilə Bearer token qaytarır. */
export async function tokenFor(phone: string): Promise<string> {
  const res = await api().post('/__dev/login-as').send({ userId: userByPhone(phone).userId });
  if (res.status !== 200) throw new Error(`login-as alınmadı: ${res.status}`);
  return res.body.data.token as string;
}

export const PHONES = {
  superAdmin: '+994500000001',
  clinicAdmin: '+994500000002',
  doctor: '+994500000010',
  patient: '+994500000020',
};
