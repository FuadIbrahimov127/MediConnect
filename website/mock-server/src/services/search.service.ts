import type {
  AutocompleteItemDto,
  ClinicCardDto,
  ClinicDetailDto,
  ClinicSearchParams,
  ClinicSearchResultDto,
  DoctorCardDto,
  DoctorClinicDto,
  DoctorDetailDto,
  DoctorSearchParams,
  DoctorSearchResultDto,
  FacetDto,
  Language,
  ReviewListDto,
  UnavailableDetailsDto,
} from '@mediconnect/shared';
import { addDaysToDate, bakuDate, timeToMinutes } from '../core/clock';
import { ApiError } from '../core/errors';
import { db } from '../store/db';
import { paginate } from '../store/repo';
import type { Clinic, Doctor, Review } from '../store/types';
import { isPublic, publishedReviews, ratingSummary, shownVersion } from './ratings.service';
import { earliestSlot } from './slots.service';
import { doctorFullName, doctorUser, isClinicVisible, isDoctorVisible, visibleDoctorClinics, visibleDoctors, visibleDoctorsInClinic } from './visibility';

// UC-201, UC-202, UC-301, UC-302 — public axtarış və detal səhifələri. Qiymət heç bir cavabda yoxdur (BR-201-05).

const localized = (r: { nameAz: string; nameRu: string | null; nameEn: string | null }, lang: Language) => (lang === 'ru' ? r.nameRu : lang === 'en' ? r.nameEn : null) ?? r.nameAz;

export const LANGUAGE_NAMES: Record<string, string> = { az: 'Azərbaycanca', ru: 'Rusca', en: 'İngiliscə', tr: 'Türkcə' };

// ── Fuzzy axtarış (FR-201-07) ──
const AZ_MAP: Record<string, string> = { ə: 'e', ı: 'i', i̇: 'i', ö: 'o', ü: 'u', ş: 's', ç: 'c', ğ: 'g' };
export const normalize = (s: string) =>
  s
    .toLocaleLowerCase('az')
    .replace(/[əıöüşçğ]/g, (c) => AZ_MAP[c] ?? c)
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

function levenshtein(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 2) return 3;
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[b.length];
}

/** Hər sorğu sözü mətnin hansısa sözünün başlanğıcı ilə uyğun gəlməli və ya 1 hərf səhvi ilə oxşar olmalıdır. */
export function fuzzyMatch(haystack: string, query: string): boolean {
  const words = normalize(haystack).split(' ');
  return normalize(query)
    .split(' ')
    .filter(Boolean)
    .every((q) => words.some((w) => w.includes(q) || (q.length >= 4 && levenshtein(w.slice(0, q.length + 1), q) <= 1) || (q.length >= 4 && levenshtein(w, q) <= 1)));
}

// ── Kartlar ──

function specialtyNames(doctorId: string, lang: Language) {
  return db.doctor_specialties
    .filter((ds) => ds.doctorId === doctorId)
    .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary))
    .map((ds) => db.specialties.find((s) => s.specialtyId === ds.specialtyId))
    .filter((s): s is NonNullable<typeof s> => !!s)
    .map((s) => ({ id: s.specialtyId, name: localized(s, lang) }));
}

const cityName = (cityId: string, lang: Language) => {
  const c = db.cities.find((x) => x.cityId === cityId);
  return c ? localized(c, lang) : '';
};

function doctorCard(doc: Doctor, lang: Language, onlyClinicId?: string): DoctorCardDto {
  const u = doctorUser(doc);
  const dcs = visibleDoctorClinics(doc.doctorId).filter((dc) => !onlyClinicId || dc.clinicId === onlyClinicId);
  const clinics = dcs.map((dc) => db.clinics.find((c) => c.clinicId === dc.clinicId)!);
  const earliest = dcs.map((dc) => earliestSlot(dc)).filter((x): x is string => !!x).sort()[0] ?? null;
  return {
    doctorId: doc.doctorId,
    fullName: doctorFullName(doc),
    photoUrl: u.photoUrl,
    gender: u.gender,
    specialties: specialtyNames(doc.doctorId, lang).map((s) => s.name),
    clinics: clinics.map((c) => ({ clinicId: c.clinicId, name: c.name, cityName: cityName(c.cityId, lang) })),
    academicDegree: doc.academicDegree,
    rating: doc.avgRating,
    reviewCount: doc.reviewCount,
    experienceYears: doc.experienceYears,
    languages: db.doctor_languages.filter((l) => l.doctorId === doc.doctorId).map((l) => l.languageCode),
    earliestSlot: earliest,
    isNew: doc.reviewCount === 0,
  };
}

function facet<T>(items: T[], keyOf: (x: T) => { id: string; name: string }[]): FacetDto[] {
  const map = new Map<string, FacetDto>();
  for (const x of items) {
    for (const k of keyOf(x)) {
      const f = map.get(k.id) ?? { id: k.id, name: k.name, count: 0 };
      f.count++;
      map.set(k.id, f);
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'az'));
}

// ── UC-201 həkim axtarışı ──

/** Boş nəticədə məsləhətlər (FR-201-21) — istifadəçinin dilində (NFR-28). */
const SUGGESTION: Record<string, Record<Language, string>> = {
  minRating: { az: 'Minimum reytinq həddini aşağı salın', ru: 'Снизьте минимальный рейтинг', en: 'Lower the minimum rating' },
  availability: { az: 'Boş vaxt filtrini götürün və ya başqa tarix seçin', ru: 'Уберите фильтр по времени или выберите другую дату', en: 'Remove the free-time filter or pick another date' },
  city: { az: 'Qonşu şəhər və rayonlara baxın', ru: 'Посмотрите соседние города и районы', en: 'Try nearby cities and districts' },
  query: { az: 'Adı qısaldın və ya ixtisas üzrə axtarın', ru: 'Сократите запрос или ищите по специальности', en: 'Shorten the name or search by specialty' },
  fewerFilters: { az: 'Filtrlərin sayını azaldın', ru: 'Уменьшите количество фильтров', en: 'Use fewer filters' },
  otherCity: { az: 'Başqa şəhər seçin', ru: 'Выберите другой город', en: 'Choose another city' },
};

export function searchDoctors(p: DoctorSearchParams, lang: Language): DoctorSearchResultDto {
  const all = visibleDoctors();
  const today = bakuDate();
  const availabilityUntil = p.availability === 'TODAY' ? today : p.availability === 'TOMORROW' ? addDaysToDate(today, 1) : p.availability === 'THIS_WEEK' ? addDaysToDate(today, 6) : undefined;

  const matches = all.filter((doc) => {
    const u = doctorUser(doc);
    const dcs = visibleDoctorClinics(doc.doctorId);
    const clinicIds = dcs.map((dc) => dc.clinicId);
    const specIds = db.doctor_specialties.filter((ds) => ds.doctorId === doc.doctorId).map((ds) => ds.specialtyId);
    if (p.query && !fuzzyMatch(`${u.firstName} ${u.lastName} ${specialtyNames(doc.doctorId, lang).map((s) => s.name).join(' ')}`, p.query)) return false;
    if (p.specialtyIds?.length && !p.specialtyIds.some((id) => specIds.includes(id))) return false;
    if (p.clinicIds?.length && !p.clinicIds.some((id) => clinicIds.includes(id))) return false;
    if (p.cityIds?.length && !dcs.some((dc) => p.cityIds!.includes(db.clinics.find((c) => c.clinicId === dc.clinicId)!.cityId))) return false;
    if (p.minRating !== undefined && (doc.avgRating ?? 0) < p.minRating) return false;
    if (p.gender && u.gender !== p.gender) return false;
    if (p.languageCodes?.length && !p.languageCodes.some((l) => db.doctor_languages.some((dl) => dl.doctorId === doc.doctorId && dl.languageCode === l))) return false;
    if (p.minExperience !== undefined && (doc.experienceYears ?? 0) < p.minExperience) return false;
    if (p.academicDegrees?.length && !p.academicDegrees.includes(doc.academicDegree ?? '')) return false;
    if (availabilityUntil && !dcs.some((dc) => earliestSlot(dc, null, availabilityUntil))) return false;
    if (p.date && !dcs.some((dc) => {
      const e = earliestSlot(dc, null, p.date);
      return e && bakuDate(new Date(e)) === p.date;
    })) return false;
    return true;
  });

  const cards = matches.map((d) => doctorCard(d, lang));
  const byRating = (a: DoctorCardDto, b: DoctorCardDto) => (b.rating ?? -1) - (a.rating ?? -1) || b.reviewCount - a.reviewCount;
  if (p.sortBy === 'EXPERIENCE') cards.sort((a, b) => (b.experienceYears ?? 0) - (a.experienceYears ?? 0) || byRating(a, b));
  else if (p.sortBy === 'EARLIEST_SLOT') cards.sort((a, b) => (a.earliestSlot ?? '9999').localeCompare(b.earliestSlot ?? '9999') || byRating(a, b));
  else cards.sort(byRating);

  const page = paginate(cards, p.page, p.size);
  const suggestions: string[] = [];
  if (!cards.length) {
    if (p.minRating) suggestions.push(SUGGESTION.minRating[lang]);
    if (p.availability || p.date) suggestions.push(SUGGESTION.availability[lang]);
    if (p.cityIds?.length) suggestions.push(SUGGESTION.city[lang]);
    if (p.query) suggestions.push(SUGGESTION.query[lang]);
    suggestions.push(SUGGESTION.fewerFilters[lang]);
  }
  return {
    totalCount: page.totalCount,
    page: page.page,
    size: page.size,
    doctors: page.items,
    facets: {
      specialties: facet(all, (d) => specialtyNames(d.doctorId, lang)),
      clinics: facet(all, (d) => visibleDoctorClinics(d.doctorId).map((dc) => ({ id: dc.clinicId, name: db.clinics.find((c) => c.clinicId === dc.clinicId)!.name }))),
      cities: facet(all, (d) => {
        const ids = [...new Set(visibleDoctorClinics(d.doctorId).map((dc) => db.clinics.find((c) => c.clinicId === dc.clinicId)!.cityId))];
        return ids.map((id) => ({ id, name: cityName(id, lang) }));
      }),
      academicDegrees: facet(all, (d) => (d.academicDegree ? [{ id: d.academicDegree, name: d.academicDegree }] : [])),
    },
    suggestions,
  };
}

export function autocomplete(query: string, lang: Language, mode: 'DOCTOR' | 'CLINIC'): AutocompleteItemDto[] {
  if (query.trim().length < 2) return [];
  const out: AutocompleteItemDto[] = [];
  if (mode === 'DOCTOR') {
    for (const sp of db.specialties.filter((s) => s.isActive && fuzzyMatch(localized(s, lang), query)).slice(0, 3)) {
      out.push({ type: 'SPECIALTY', id: sp.specialtyId, label: localized(sp, lang), sub: 'İxtisas' });
    }
    for (const d of visibleDoctors()) {
      const u = doctorUser(d);
      if (!fuzzyMatch(`${u.firstName} ${u.lastName}`, query)) continue;
      out.push({ type: 'DOCTOR', id: d.doctorId, label: doctorFullName(d), sub: specialtyNames(d.doctorId, lang).map((s) => s.name).join(', ') });
    }
  } else {
    for (const c of db.clinics.filter(isClinicVisible)) {
      if (fuzzyMatch(c.name, query)) out.push({ type: 'CLINIC', id: c.clinicId, label: c.name, sub: c.address });
    }
  }
  return out.slice(0, 8);
}

// ── UC-301 həkim detalı ──

function unavailable(name: string, alternatives: DoctorCardDto[]): never {
  const details: UnavailableDetailsDto = { inactive: true, name, alternatives };
  throw new ApiError('NotFound', details as unknown as Record<string, unknown>, 'Bu həkim hazırda qəbul aparmır');
}

function similarDoctors(doc: Doctor, lang: Language): DoctorCardDto[] {
  const specIds = db.doctor_specialties.filter((ds) => ds.doctorId === doc.doctorId).map((ds) => ds.specialtyId);
  return visibleDoctors()
    .filter((d) => d.doctorId !== doc.doctorId && db.doctor_specialties.some((ds) => ds.doctorId === d.doctorId && specIds.includes(ds.specialtyId)))
    .slice(0, 3)
    .map((d) => doctorCard(d, lang));
}

export function findDoctor(doctorId: string) {
  const doc = db.doctors.find((d) => d.doctorId === doctorId);
  if (!doc) throw new ApiError('NotFound');
  return doc;
}

export function doctorDetail(doctorId: string, lang: Language): DoctorDetailDto {
  const doc = findDoctor(doctorId);
  if (!isDoctorVisible(doc)) unavailable(doctorFullName(doc), similarDoctors(doc, lang)); // EF-301-2
  const u = doctorUser(doc);
  const clinics: DoctorClinicDto[] = visibleDoctorClinics(doc.doctorId).map((dc) => {
    const c = db.clinics.find((x) => x.clinicId === dc.clinicId)!;
    return {
      clinicId: c.clinicId,
      name: c.name,
      clinicType: c.clinicType,
      address: c.address,
      cityName: cityName(c.cityId, lang),
      district: c.district,
      latitude: c.latitude,
      longitude: c.longitude,
      phone: c.phone,
      roomNumber: dc.roomNumber,
      acceptingAppointments: c.acceptingAppointments,
      services: db.clinic_doctor_services
        .filter((x) => x.doctorClinicId === dc.doctorClinicId && x.isActive)
        .map((x) => {
          const sv = db.services.find((s) => s.serviceId === x.serviceId)!;
          return { serviceId: sv.serviceId, name: localized(sv, lang), durationMinutes: x.durationMinutes };
        }),
      earliestSlot: earliestSlot(dc),
    };
  });
  return {
    doctorId: doc.doctorId,
    fullName: doctorFullName(doc),
    photoUrl: u.photoUrl,
    gender: u.gender,
    specialties: db.doctor_specialties
      .filter((ds) => ds.doctorId === doc.doctorId)
      .map((ds) => {
        const s = db.specialties.find((x) => x.specialtyId === ds.specialtyId)!;
        return { id: s.specialtyId, name: localized(s, lang), isPrimary: ds.isPrimary };
      })
      .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary)),
    academicDegree: doc.academicDegree,
    bio: doc.bio,
    education: (doc.education ?? '').split('\n').filter(Boolean),
    experienceYears: doc.experienceYears,
    specializationAreas: doc.specializationAreas,
    languages: db.doctor_languages.filter((l) => l.doctorId === doc.doctorId).map((l) => ({ code: l.languageCode, name: LANGUAGE_NAMES[l.languageCode] ?? l.languageCode })),
    certificates: doc.certificates,
    approvalMode: doc.approvalMode,
    rating: ratingSummary(publishedReviews(doc.doctorId).map(shownVersion)),
    isNew: doc.reviewCount === 0,
    clinics,
  };
}

/** Həkimin konkret klinikadakı görünən bağlantısı (slot və randevu üçün). */
export function visibleDoctorClinic(doctorId: string, clinicId: string) {
  const doc = findDoctor(doctorId);
  if (!isDoctorVisible(doc)) throw new ApiError('NotFound');
  const dc = visibleDoctorClinics(doctorId).find((x) => x.clinicId === clinicId);
  if (!dc) throw new ApiError('NotFound'); // EF-301-4: deaktiv klinika üzrə slot göstərilmir
  return dc;
}

// ── Rəylər (yalnız PUBLISHED — BR-301-04) ──

function authorName(r: Review): string {
  if (r.isAnonymous) return 'Anonim pasient';
  const p = db.patients.find((x) => x.patientId === r.patientId);
  const u = p && db.users.find((x) => x.userId === p.userId);
  return u ? `${u.firstName} ${u.lastName[0]}.` : 'Pasient';
}

function reviewList(reviews: Review[], sort: 'NEWEST' | 'HIGHEST' | 'LOWEST', page: number, size: number, lang: Language): ReviewListDto {
  const sorted = [...reviews].sort((a, b) =>
    sort === 'HIGHEST' ? b.overallRating - a.overallRating || b.createdAt.localeCompare(a.createdAt) : sort === 'LOWEST' ? a.overallRating - b.overallRating || b.createdAt.localeCompare(a.createdAt) : b.createdAt.localeCompare(a.createdAt),
  );
  const p = paginate(sorted, page, size);
  return {
    summary: ratingSummary(reviews.map(shownVersion)),
    totalCount: p.totalCount,
    page: p.page,
    size: p.size,
    reviews: p.items.map((r) => {
      const appt = db.appointments.find((a) => a.appointmentId === r.appointmentId);
      const dc = appt && db.doctor_clinics.find((x) => x.doctorClinicId === appt.doctorClinicId);
      const clinic = dc && db.clinics.find((c) => c.clinicId === dc.clinicId);
      const sv = appt && db.services.find((s) => s.serviceId === appt.serviceId);
      const reply = db.review_replies.find((x) => x.reviewId === r.reviewId && x.status === 'PUBLISHED');
      const doc = db.doctors.find((d) => d.doctorId === r.doctorId)!;
      const shown = r.publishedSnapshot ?? r;
      return {
        reviewId: r.reviewId,
        authorName: authorName(r),
        overallRating: shown.overallRating,
        comment: shown.comment,
        createdAt: r.createdAt,
        doctorName: doctorFullName(doc),
        clinicName: clinic?.name ?? null,
        serviceName: sv ? localized(sv, lang) : null,
        reply: reply ? { text: reply.replyText, createdAt: reply.createdAt } : null,
      };
    }),
  };
}

export function doctorReviews(doctorId: string, q: { sort: 'NEWEST' | 'HIGHEST' | 'LOWEST'; page: number; size: number }, lang: Language) {
  findDoctor(doctorId);
  return reviewList(publishedReviews(doctorId), q.sort, q.page, q.size, lang);
}

export function clinicReviews(clinicId: string, q: { sort: 'NEWEST' | 'HIGHEST' | 'LOWEST'; page: number; size: number }, lang: Language) {
  findClinic(clinicId);
  const dcIds = new Set(db.doctor_clinics.filter((dc) => dc.clinicId === clinicId).map((dc) => dc.doctorClinicId));
  const reviews = db.reviews.filter((r) => isPublic(r) && dcIds.has(db.appointments.find((a) => a.appointmentId === r.appointmentId)?.doctorClinicId ?? ''));
  return reviewList(reviews, q.sort, q.page, q.size, lang);
}

// ── UC-202 klinika axtarışı ──

const DAY_SHORT = ['', 'B.e.', 'Ç.a.', 'Ç.', 'C.a.', 'C.', 'Ş.', 'B.'];

export function hoursSummary(clinic: Clinic): string {
  if (clinic.is24x7) return '24/7';
  const rows = db.clinic_working_hours.filter((h) => h.clinicId === clinic.clinicId).sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  const groups: { from: number; to: number; hours: string }[] = [];
  for (const r of rows) {
    if (r.isClosed || !r.opensAt || !r.closesAt) continue;
    const hours = `${r.opensAt}–${r.closesAt}`;
    const last = groups.at(-1);
    if (last && last.hours === hours && last.to === r.dayOfWeek - 1) last.to = r.dayOfWeek;
    else groups.push({ from: r.dayOfWeek, to: r.dayOfWeek, hours });
  }
  return groups.map((g) => `${DAY_SHORT[g.from]}${g.to !== g.from ? `–${DAY_SHORT[g.to]}` : ''} ${g.hours}`).join(', ') || 'Bağlıdır';
}

function clinicSpecialties(clinicId: string, lang: Language) {
  const ids = new Set(visibleDoctorsInClinic(clinicId).flatMap((d) => db.doctor_specialties.filter((ds) => ds.doctorId === d.doctorId).map((ds) => ds.specialtyId)));
  return [...ids].map((id) => db.specialties.find((s) => s.specialtyId === id)!).map((s) => ({ id: s.specialtyId, name: localized(s, lang) }));
}

function clinicServices(clinicId: string, lang: Language) {
  const dcIds = new Set(
    db.doctor_clinics.filter((dc) => dc.clinicId === clinicId && dc.status === 'ACTIVE' && visibleDoctorsInClinic(clinicId).some((d) => d.doctorId === dc.doctorId)).map((dc) => dc.doctorClinicId),
  );
  const ids = new Set(db.clinic_doctor_services.filter((x) => dcIds.has(x.doctorClinicId) && x.isActive).map((x) => x.serviceId));
  return [...ids].map((id) => db.services.find((s) => s.serviceId === id)!).map((s) => ({ serviceId: s.serviceId, name: localized(s, lang), category: s.category }));
}

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const r = (x: number) => (x * Math.PI) / 180;
  const a = Math.sin(r(lat2 - lat1) / 2) ** 2 + Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(r(lng2 - lng1) / 2) ** 2;
  return Math.round(6371 * 2 * Math.asin(Math.sqrt(a)) * 10) / 10;
}

function clinicCard(c: Clinic, lang: Language, origin?: { lat: number; lng: number }): ClinicCardDto {
  return {
    clinicId: c.clinicId,
    name: c.name,
    logoUrl: c.logoUrl,
    clinicType: c.clinicType,
    address: c.address,
    cityName: cityName(c.cityId, lang),
    district: c.district,
    hoursSummary: hoursSummary(c),
    rating: c.avgRating,
    doctorCount: visibleDoctorsInClinic(c.clinicId).length,
    specialtyCount: clinicSpecialties(c.clinicId, lang).length,
    latitude: c.latitude,
    longitude: c.longitude,
    acceptingAppointments: c.acceptingAppointments,
    is24x7: c.is24x7,
    distanceKm: origin && c.latitude !== null && c.longitude !== null ? distanceKm(origin.lat, origin.lng, c.latitude, c.longitude) : null,
  };
}

function workModeMatch(c: Clinic, mode: 'TWENTY_FOUR_SEVEN' | 'WEEKEND' | 'EVENING') {
  const rows = db.clinic_working_hours.filter((h) => h.clinicId === c.clinicId && !h.isClosed);
  if (mode === 'TWENTY_FOUR_SEVEN') return c.is24x7;
  if (mode === 'WEEKEND') return c.is24x7 || rows.some((h) => h.dayOfWeek >= 6);
  return c.is24x7 || rows.some((h) => h.closesAt && timeToMinutes(h.closesAt) >= 19 * 60);
}

export const CLINIC_TYPE_LABELS: Record<string, string> = {
  POLYCLINIC: 'Poliklinika',
  HOSPITAL: 'Xəstəxana',
  DIAGNOSTIC_CENTER: 'Diaqnostik mərkəz',
  DENTAL: 'Dental klinika',
  LABORATORY: 'Laboratoriya',
};

export function searchClinics(p: ClinicSearchParams, lang: Language): ClinicSearchResultDto {
  const all = db.clinics.filter(isClinicVisible);
  const matches = all.filter((c) => {
    if (p.query && !fuzzyMatch(`${c.name} ${c.district ?? ''}`, p.query)) return false;
    if (p.cityIds?.length && !p.cityIds.includes(c.cityId)) return false;
    if (p.clinicTypes?.length && !p.clinicTypes.includes(c.clinicType)) return false;
    if (p.specialtyIds?.length && !clinicSpecialties(c.clinicId, lang).some((s) => p.specialtyIds!.includes(s.id))) return false;
    if (p.serviceIds?.length && !clinicServices(c.clinicId, lang).some((s) => p.serviceIds!.includes(s.serviceId))) return false;
    if (p.workModes?.length && !p.workModes.every((m) => workModeMatch(c, m))) return false;
    if (p.minRating !== undefined && (c.avgRating ?? 0) < p.minRating) return false;
    if (p.insurances?.length && !p.insurances.some((i) => c.insurances.includes(i))) return false;
    return true;
  });
  const origin = p.lat !== undefined && p.lng !== undefined ? { lat: p.lat, lng: p.lng } : undefined;
  const cards = matches.map((c) => clinicCard(c, lang, origin));
  if (p.sortBy === 'DOCTOR_COUNT') cards.sort((a, b) => b.doctorCount - a.doctorCount);
  else if (p.sortBy === 'DISTANCE' && origin) cards.sort((a, b) => (a.distanceKm ?? 1e9) - (b.distanceKm ?? 1e9));
  else cards.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1));
  const page = paginate(cards, p.page, p.size);
  return {
    totalCount: page.totalCount,
    page: page.page,
    size: page.size,
    clinics: page.items,
    facets: {
      cities: facet(all, (c) => [{ id: c.cityId, name: cityName(c.cityId, lang) }]),
      clinicTypes: facet(all, (c) => [{ id: c.clinicType, name: CLINIC_TYPE_LABELS[c.clinicType] }]),
      specialties: facet(all, (c) => clinicSpecialties(c.clinicId, lang)),
      services: facet(all, (c) => clinicServices(c.clinicId, lang).map((s) => ({ id: s.serviceId, name: s.name }))),
      insurances: facet(all, (c) => c.insurances.map((i) => ({ id: i, name: i }))),
    },
    suggestions: cards.length ? [] : [SUGGESTION.fewerFilters[lang], SUGGESTION.otherCity[lang]],
  };
}

// ── UC-302 klinika detalı ──

export function findClinic(clinicId: string) {
  const c = db.clinics.find((x) => x.clinicId === clinicId);
  if (!c || c.status === 'PENDING_VERIFICATION') throw new ApiError('NotFound'); // verifikasiyasız klinika görünmür (BR-901-02)
  return c;
}

export function clinicDetail(clinicId: string, lang: Language): ClinicDetailDto {
  const c = findClinic(clinicId);
  if (c.status !== 'ACTIVE') throw new ApiError('NotFound', { inactive: true, name: c.name, alternatives: [] }, 'Bu klinika hazırda platformada aktiv deyil'); // EF-302-2
  const doctors = visibleDoctorsInClinic(c.clinicId).map((d) => doctorCard(d, lang, c.clinicId));
  doctors.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1));
  const dcIds = new Set(db.doctor_clinics.filter((dc) => dc.clinicId === clinicId).map((dc) => dc.doctorClinicId));
  return {
    clinicId: c.clinicId,
    name: c.name,
    clinicType: c.clinicType,
    logoUrl: c.logoUrl,
    description: c.description,
    foundedYear: c.foundedYear,
    address: c.address,
    cityName: cityName(c.cityId, lang),
    district: c.district,
    latitude: c.latitude,
    longitude: c.longitude,
    phone: c.phone,
    email: c.email,
    website: c.website,
    rating: c.avgRating,
    reviewCount: db.reviews.filter((r) => isPublic(r) && dcIds.has(db.appointments.find((a) => a.appointmentId === r.appointmentId)?.doctorClinicId ?? '')).length,
    is24x7: c.is24x7,
    acceptingAppointments: c.acceptingAppointments,
    insurances: c.insurances,
    specialties: clinicSpecialties(c.clinicId, lang),
    workingHours: db.clinic_working_hours
      .filter((h) => h.clinicId === c.clinicId)
      .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
      .map(({ dayOfWeek, opensAt, closesAt, isClosed }) => ({ dayOfWeek, opensAt, closesAt, isClosed })),
    photos: db.clinic_photos.filter((p) => p.clinicId === c.clinicId).sort((a, b) => a.displayOrder - b.displayOrder).map((p) => p.photoUrl),
    services: clinicServices(c.clinicId, lang),
    doctors,
  };
}
