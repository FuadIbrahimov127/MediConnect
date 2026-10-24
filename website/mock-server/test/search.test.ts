import { describe, expect, it } from 'vitest';
import { bakuToUtc, clock } from '../src/core/clock';
import { db } from '../src/store/db';
import { seed } from '../src/store/seed';
import { api } from './helpers';

// 2026-10-26 bazar ertəsidir — cədvəllər həftə günlərinə bağlı olduğu üçün saatı sabit Bazar ertəsi 08:00-a qoyuruq.
const MONDAY = '2026-10-26';
function atMonday(time = '08:00') {
  clock.set(bakuToUtc(MONDAY, time));
  seed({ keepClock: true });
}

const doctorByName = (last: string) => {
  const u = db.users.find((x) => x.lastName === last && x.role === 'DOCTOR')!;
  return db.doctors.find((d) => d.userId === u.userId)!;
};
const clinicByName = (name: string) => db.clinics.find((c) => c.name === name)!;
const specialtyId = (name: string) => db.specialties.find((s) => s.nameAz === name)!.specialtyId;
const names = (body: { data: { doctors: { fullName: string }[] } }) => body.data.doctors.map((d) => d.fullName);

describe('UC-201 həkim axtarışı', () => {
  it('Guest axtarış edə bilir; yalnız görünən həkimlər qaytarılır (FR-201-34..36)', async () => {
    const res = await api().get('/v1/doctors');
    expect(res.status).toBe(200);
    const list = names(res.body);
    expect(list).toContain('Dr. Aygün Məmmədova');
    expect(list).not.toContain('Dr. Fərid Məlikov'); // profil tamamlanmayıb
    expect(list).not.toContain('Dr. Zaur Əhmədov'); // klinika bağlantısı INACTIVE
    expect(res.body.data.totalCount).toBe(10);
    expect(JSON.stringify(res.body)).not.toMatch(/price|qiymət/i); // BR-201-05
  });

  it('lisenziyası bitmiş həkim görünmür (BR-802-08)', async () => {
    doctorByName('Quliyev').licenseExpiryDate = '2020-01-01';
    expect(names((await api().get('/v1/doctors')).body)).not.toContain('Dr. Kamran Quliyev');
  });

  it('klinika dayandırılanda onun həkimləri axtarışdan çıxır (BR-302-05)', async () => {
    clinicByName('Şəfa Hospital').status = 'SUSPENDED';
    const list = names((await api().get('/v1/doctors')).body);
    expect(list).not.toContain('Dr. Kamran Quliyev');
    expect(list).toContain('Dr. Tural İsmayılov'); // Mərkəzi Klinikada da işləyir
  });

  it('filtrlər birləşir: ixtisas + cins + dil + reytinq', async () => {
    const res = await api().get('/v1/doctors').query({ specialtyIds: specialtyId('Nevroloq'), gender: 'MALE', languageCodes: 'tr' });
    expect(names(res.body)).toEqual(['Dr. Tural İsmayılov']);
    const rated = await api().get('/v1/doctors').query({ minRating: 4.8 });
    expect(rated.body.data.doctors.every((d: { rating: number }) => d.rating >= 4.8)).toBe(true);
  });

  it('şəhər filtri klinikanın şəhərinə görə işləyir', async () => {
    const ganja = db.cities.find((c) => c.nameAz === 'Gəncə')!.cityId;
    expect(names((await api().get('/v1/doctors').query({ cityIds: ganja })).body).sort()).toEqual(['Dr. Kamran Quliyev', 'Dr. Tural İsmayılov']);
  });

  it('ad üzrə fuzzy axtarış: diakritikasız və 1 hərf səhvi ilə (FR-201-07)', async () => {
    expect(names((await api().get('/v1/doctors').query({ query: 'Memmedova' })).body)).toContain('Dr. Aygün Məmmədova');
    expect(names((await api().get('/v1/doctors').query({ query: 'kardiolq' })).body)).toContain('Dr. Aygün Məmmədova');
  });

  it('nəticə yoxdursa təkliflər qaytarılır (EF-201-1)', async () => {
    const res = await api().get('/v1/doctors').query({ query: 'qwertyzz' });
    expect(res.body.data.totalCount).toBe(0);
    expect(res.body.data.suggestions.length).toBeGreaterThan(0);
  });

  it('çeşidləmə: təcrübə üzrə', async () => {
    const res = await api().get('/v1/doctors').query({ sortBy: 'EXPERIENCE' });
    expect(res.body.data.doctors[0].fullName).toBe('Dr. Kamran Quliyev');
  });

  it('səhifə ölçüsü maksimum 20-dir (BR-201-06)', async () => {
    expect((await api().get('/v1/doctors').query({ size: 50 })).status).toBe(400);
  });

  it('rəyi olmayan həkim "Yeni həkim"dir, reytinqi null (spec "Yeni həkim")', async () => {
    const res = await api().get('/v1/doctors').query({ query: 'Babayev' });
    expect(res.body.data.doctors[0]).toMatchObject({ rating: null, reviewCount: 0, isNew: true });
  });

  it('boş vaxt filtri: bu gün (TODAY)', async () => {
    atMonday('08:00');
    const today = names((await api().get('/v1/doctors').query({ availability: 'TODAY' })).body);
    // Bazar ertəsi işləyənlər: Aygün, Leyla, Rəşad, Kamran, Tural, Elvin, Günay, Orxan, Nərmin; Səbinə Q. yalnız Ç.a./C.a.
    expect(today).toContain('Dr. Aygün Məmmədova');
    expect(today).not.toContain('Dr. Səbinə Qasımova');
  });
});

describe('UC-202 klinika axtarışı', () => {
  it('verifikasiya edilməmiş klinika görünmür (BR-202-01)', async () => {
    const res = await api().get('/v1/clinics');
    const list = res.body.data.clinics.map((c: { name: string }) => c.name);
    expect(list).not.toContain('Sağlam Ailə');
    expect(list).toContain('Mərkəzi Klinika');
    const saglam = clinicByName('Sağlam Ailə');
    expect((await api().get(`/v1/clinics/${saglam.clinicId}`)).status).toBe(404);
  });

  it('iş rejimi filtri: axşam qəbulu və 24/7', async () => {
    const evening = (await api().get('/v1/clinics').query({ workModes: 'EVENING' })).body.data.clinics.map((c: { name: string }) => c.name);
    expect(evening).toEqual(expect.arrayContaining(['Kaspi Tibb Mərkəzi', 'DentArt Klinika', 'Şəfa Hospital']));
    expect(evening).not.toContain('Mərkəzi Klinika');
    const h24 = (await api().get('/v1/clinics').query({ workModes: 'TWENTY_FOUR_SEVEN' })).body.data.clinics.map((c: { name: string }) => c.name);
    expect(h24).toEqual(['Şəfa Hospital']);
  });

  it('klinika reytinqi həkim reytinqlərinin ortasıdır (BR-202-03)', async () => {
    const res = await api().get('/v1/clinics').query({ query: 'Mərkəzi' });
    const card = res.body.data.clinics[0];
    const ratings = db.doctor_clinics
      .filter((dc) => dc.clinicId === card.clinicId && dc.status === 'ACTIVE')
      .map((dc) => db.doctors.find((d) => d.doctorId === dc.doctorId)!.avgRating)
      .filter((r): r is number => r !== null);
    expect(card.rating).toBeCloseTo(ratings.reduce((a, b) => a + b, 0) / ratings.length, 1);
    expect(card.hoursSummary).toBe('B.e.–C. 09:00–18:00, Ş. 10:00–14:00');
  });
});

describe('UC-301 / UC-302 detal səhifələri', () => {
  it('həkim detalı: klinikalar, xidmətlər (müddət ilə), qiymət yoxdur', async () => {
    const aygun = doctorByName('Məmmədova');
    const res = await api().get(`/v1/doctors/${aygun.doctorId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.clinics.map((c: { name: string }) => c.name).sort()).toEqual(['Kaspi Tibb Mərkəzi', 'Mərkəzi Klinika']);
    const merkezi = res.body.data.clinics.find((c: { name: string }) => c.name === 'Mərkəzi Klinika');
    expect(merkezi.services).toEqual(expect.arrayContaining([{ serviceId: expect.any(String), name: 'Exokardioqrafiya', durationMinutes: 40 }]));
    expect(res.body.data.rating.count).toBe(14);
    expect(res.body.data.education[0]).toContain('Azərbaycan Tibb Universiteti');
  });

  it('deaktiv həkim → "qəbul aparmır" + oxşar həkimlər (EF-301-2)', async () => {
    const ferid = doctorByName('Məlikov');
    const res = await api().get(`/v1/doctors/${ferid.doctorId}`);
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Bu həkim hazırda qəbul aparmır');
    expect(res.body.details.alternatives.map((d: { fullName: string }) => d.fullName)).toContain('Dr. Aygün Məmmədova');
  });

  it('slotlar: 7 gün, yalnız gələcək, 1 saatdan az qalan seçilmir (BR-301-05, BR-401-05)', async () => {
    atMonday('09:10');
    const aygun = doctorByName('Məmmədova');
    const merkezi = clinicByName('Mərkəzi Klinika');
    const res = await api().get(`/v1/doctors/${aygun.doctorId}/slots`).query({ clinicId: merkezi.clinicId });
    expect(res.body.data.days).toHaveLength(7);
    const monday = res.body.data.days[0];
    expect(monday.date).toBe(MONDAY);
    expect(monday.slots[0].startTime).toBe('09:30'); // 09:00 keçib
    expect(monday.slots.find((s: { startTime: string }) => s.startTime === '09:30').available).toBe(false); // <1 saat
    expect(monday.slots.find((s: { startTime: string }) => s.startTime === '10:30').available).toBe(true);
    expect(monday.slots.some((s: { startTime: string }) => s.startTime === '13:00')).toBe(false); // nahar fasiləsi
    const saturday = res.body.data.days.find((d: { date: string }) => d.date === '2026-10-31');
    expect(saturday.slots).toHaveLength(0); // həkim şənbə işləmir
  });

  it('uzun xidmət ardıcıl slotlar tələb edir: fasilədən əvvəlki son slot Exo (40 dəq) üçün uyğun deyil', async () => {
    atMonday('08:00');
    const aygun = doctorByName('Məmmədova');
    const merkezi = clinicByName('Mərkəzi Klinika');
    const echo = db.services.find((s) => s.nameAz === 'Exokardioqrafiya')!.serviceId;
    const res = await api().get(`/v1/doctors/${aygun.doctorId}/slots`).query({ clinicId: merkezi.clinicId, serviceId: echo });
    const monday = res.body.data.days[0].slots;
    expect(res.body.data.durationMinutes).toBe(40);
    expect(monday.find((s: { startTime: string }) => s.startTime === '12:00').available).toBe(true);
    expect(monday.find((s: { startTime: string }) => s.startTime === '12:30').available).toBe(false);
    expect(monday.find((s: { startTime: string }) => s.startTime === '17:30').available).toBe(false); // gün sonu
  });

  it('başqa həkimin klinikası üzrə slot sorğusu 404', async () => {
    const leyla = doctorByName('Əliyeva');
    const kaspi = clinicByName('Kaspi Tibb Mərkəzi');
    expect((await api().get(`/v1/doctors/${leyla.doctorId}/slots`).query({ clinicId: kaspi.clinicId })).status).toBe(404);
  });

  it('rəylər yalnız PUBLISHED, anonim rəydə ad gizlidir', async () => {
    const aygun = doctorByName('Məmmədova');
    const r = db.reviews.find((x) => x.doctorId === aygun.doctorId)!;
    r.status = 'PENDING_MODERATION';
    r.isAnonymous = false;
    const res = await api().get(`/v1/doctors/${aygun.doctorId}/reviews`).query({ size: 20 });
    expect(res.body.data.totalCount).toBe(13);
    expect(res.body.data.reviews.some((x: { reviewId: string }) => x.reviewId === r.reviewId)).toBe(false);
    const anon = db.reviews.find((x) => x.doctorId === aygun.doctorId && x.status === 'PUBLISHED' && x.isAnonymous);
    if (anon) {
      const item = res.body.data.reviews.find((x: { reviewId: string }) => x.reviewId === anon.reviewId);
      expect(item.authorName).toBe('Anonim pasient');
    }
  });

  it('klinika detalı: yalnız görünən həkimlər, 7 günlük iş saatları', async () => {
    const merkezi = clinicByName('Mərkəzi Klinika');
    const res = await api().get(`/v1/clinics/${merkezi.clinicId}`);
    const docs = res.body.data.doctors.map((d: { fullName: string }) => d.fullName);
    expect(docs).toContain('Dr. Aygün Məmmədova');
    expect(docs).not.toContain('Dr. Fərid Məlikov');
    expect(res.body.data.workingHours).toHaveLength(7);
    expect(res.body.data.services.map((s: { name: string }) => s.name)).toContain('Exokardioqrafiya');
  });

  it('slot generasiyası 60 gün irəli (BR-702-06)', async () => {
    atMonday('08:00');
    const dates = db.appointment_slots.filter((s) => s.status === 'AVAILABLE').map((s) => s.slotDate).sort();
    expect(dates.at(-1)! <= '2026-12-25').toBe(true);
    expect(dates.at(-1)! >= '2026-12-20').toBe(true);
  });
});
