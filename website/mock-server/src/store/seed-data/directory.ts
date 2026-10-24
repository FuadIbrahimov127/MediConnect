import type { ApprovalMode, ClinicStatus, ClinicType, DoctorClinicStatus, Gender } from '@mediconnect/shared';

// Demo kataloqu: klinikalar, həkimlər, cədvəllər, xidmətlər. Adlar prototiplərdən götürülüb.
// Açar sözlər (key) seed daxilində əlaqə üçündür; ID-lər seed zamanı yaradılır.

export type CityKey = 'baku' | 'ganja' | 'sumgait';

export interface ClinicSeed {
  key: string;
  name: string;
  clinicType: ClinicType;
  city: CityKey;
  district: string;
  address: string;
  lat: number;
  lng: number;
  phone: string;
  email?: string;
  website?: string;
  description: string;
  foundedYear: number;
  insurances: string[];
  status?: ClinicStatus;
  is24x7?: boolean;
  /** [günlər (1=B.e.), açılış, bağlanış] */
  hours: [number[], string, string][];
  admin?: { fin: string; firstName: string; lastName: string; fatherName: string; birthDate: string; gender: Gender; email?: string; phone?: string };
}

export const CLINICS: ClinicSeed[] = [
  {
    key: 'merkezi', name: 'Mərkəzi Klinika', clinicType: 'POLYCLINIC', city: 'baku', district: 'Nəsimi', address: 'Bakı, Nəsimi r., Azadlıq pr. 24',
    lat: 40.3893, lng: 49.8474, phone: '+994124400024', email: 'info@merkezi.az', website: 'https://merkezi.az',
    description: 'Kardiologiya, nevrologiya, pediatriya və endokrinologiya üzrə ixtisaslaşmış çoxprofilli poliklinika. Öz laboratoriyası və exokardioqrafiya kabineti var.',
    foundedYear: 2009, insurances: ['Paşa Sığorta', 'İcbari Tibbi Sığorta'],
    hours: [[[1, 2, 3, 4, 5], '09:00', '18:00'], [[6], '10:00', '14:00']],
    admin: { fin: '2BB2BB2', firstName: 'Elnur', lastName: 'Rəhimov', fatherName: 'Tofiq', birthDate: '1983-08-01', gender: 'MALE', email: 'elnur@merkezi.az', phone: '+994500000002' },
  },
  {
    key: 'kaspi', name: 'Kaspi Tibb Mərkəzi', clinicType: 'DIAGNOSTIC_CENTER', city: 'baku', district: 'Yasamal', address: 'Bakı, Yasamal r., Şərifzadə küç. 7',
    lat: 40.3779, lng: 49.8125, phone: '+994125100007', email: 'qeydiyyat@kaspitibb.az',
    description: 'MRT, KT, USM və funksional diaqnostika mərkəzi. Axşam saatlarında da qəbul aparılır.',
    foundedYear: 2015, insurances: ['Ateşgah Sığorta', 'Paşa Sığorta'],
    hours: [[[1, 2, 3, 4, 5, 6], '08:00', '20:00']],
    admin: { fin: '3CC3CC3', firstName: 'Aysel', lastName: 'Novruzova', fatherName: 'Kamal', birthDate: '1990-12-11', gender: 'FEMALE', phone: '+994500000003' },
  },
  {
    key: 'sefa', name: 'Şəfa Hospital', clinicType: 'HOSPITAL', city: 'ganja', district: 'Kəpəz', address: 'Gəncə, Kəpəz r., Atatürk pr. 112',
    lat: 40.6828, lng: 46.3606, phone: '+994222550112',
    description: 'Gəncədə 24 saat fəaliyyət göstərən çoxprofilli xəstəxana: travmatologiya, ortopediya, nevrologiya.',
    foundedYear: 2004, insurances: ['İcbari Tibbi Sığorta', 'Meqa Sığorta'], is24x7: true,
    hours: [[[1, 2, 3, 4, 5, 6, 7], '00:00', '23:59']],
    admin: { fin: '4DD4DD4', firstName: 'Ramin', lastName: 'Cəfərov', fatherName: 'Sabir', birthDate: '1979-04-22', gender: 'MALE' },
  },
  {
    key: 'nur', name: 'Nur Diaqnostika', clinicType: 'LABORATORY', city: 'baku', district: 'Nərimanov', address: 'Bakı, Nərimanov r., Təbriz küç. 44',
    lat: 40.4049, lng: 49.8678, phone: '+994124080044',
    description: 'Laborator analizlər və terapevt qəbulu. Həftənin 7 günü səhər 07:30-dan.',
    foundedYear: 2018, insurances: ['Paşa Sığorta'],
    hours: [[[1, 2, 3, 4, 5, 6, 7], '07:30', '20:00']],
    admin: { fin: '5EE5EE5', firstName: 'Lamiyə', lastName: 'Səmədova', fatherName: 'Vüqar', birthDate: '1992-07-30', gender: 'FEMALE' },
  },
  {
    key: 'dentart', name: 'DentArt Klinika', clinicType: 'DENTAL', city: 'baku', district: 'Xətai', address: 'Bakı, Xətai r., Babək pr. 18',
    lat: 40.3830, lng: 49.8890, phone: '+994124900018',
    description: 'Terapevtik və estetik stomatologiya, uşaq stomatologiyası.',
    foundedYear: 2016, insurances: [],
    hours: [[[1, 2, 3, 4, 5, 6], '10:00', '21:00']],
  },
  {
    key: 'saglam', name: 'Sağlam Ailə', clinicType: 'POLYCLINIC', city: 'sumgait', district: 'Mərkəz', address: 'Sumqayıt, Sülh küç. 5',
    lat: 40.5897, lng: 49.6686, phone: '+994182200005', status: 'PENDING_VERIFICATION',
    description: 'Ailə həkimliyi poliklinikası (sənədləri yoxlanılır).', foundedYear: 2021, insurances: [],
    hours: [[[1, 2, 3, 4, 5], '09:00', '17:00']],
  },
];

export interface ScheduleSeed {
  days: number[];
  start: string;
  end: string;
  slot: 15 | 20 | 30 | 45 | 60;
  breaks?: [string, string, string][];
}

export interface DoctorSeed {
  key: string;
  fin: string;
  firstName: string;
  lastName: string;
  fatherName: string;
  birthDate: string;
  gender: Gender;
  phone?: string;
  email?: string;
  specialties: string[]; // specialty açarları, birincisi əsas
  languages: string[];
  experienceYears: number;
  academicDegree: string | null;
  approvalMode: ApprovalMode;
  bio: string;
  education: string[];
  areas: string[];
  certificates?: { title: string; year: number }[];
  profileCompleted?: boolean;
  /** Lisenziyanın bitməsinə qalan gün (default 500). */
  licenseDays?: number;
  /** Seed rəylərinin hədəf orta reytinqi və sayı (0 → "Yeni həkim"). */
  targetRating: number;
  reviews: number;
  clinics: {
    clinic: string;
    room: string;
    status?: DoctorClinicStatus;
    schedule: ScheduleSeed[];
    services: [string, number][]; // [xidmət açarı, müddət dəq]
  }[];
}

const LUNCH: [string, string, string] = ['13:00', '14:00', 'Nahar'];

export const DOCTORS: DoctorSeed[] = [
  {
    key: 'aygun', fin: '3KL88MN', firstName: 'Aygün', lastName: 'Məmmədova', fatherName: 'Rasim', birthDate: '1982-05-19', gender: 'FEMALE',
    phone: '+994500000010', email: 'aygun@merkezi.az', specialties: ['cardiology'], languages: ['az', 'ru', 'en'], experienceYears: 12,
    academicDegree: 'Tibb üzrə fəlsəfə doktoru', approvalMode: 'AUTO', targetRating: 4.7, reviews: 14,
    bio: 'Dr. Aygün Məmmədova 2011-ci ildən kardioloq kimi çalışır. Əsas iş sahəsi arterial hipertenziya, ürək ritmi pozğunluqları və ürək çatışmazlığıdır. Müayinədə exokardioqrafiya və Holter monitorinqinin nəticələrini özü qiymətləndirir.',
    education: ['2003 — 2009 | Azərbaycan Tibb Universiteti, müalicə işi', '2009 — 2011 | Rezidentura, kardiologiya — Elmi-Tədqiqat Terapiya İnstitutu', '2011 — 2016 | Kardioloq — Kaspi Tibb Mərkəzi', '2016 — indi | Baş kardioloq — Mərkəzi Klinika', '2018 | Tibb üzrə fəlsəfə doktoru dissertasiyası'],
    areas: ['Arterial hipertenziya', 'Ürək ritmi pozğunluqları', 'Ürək çatışmazlığı', 'Exokardioqrafiya', 'Holter monitorinqi'],
    certificates: [{ title: 'ESC — Avropa Kardiologiya Cəmiyyəti sertifikatı', year: 2019 }],
    clinics: [
      {
        clinic: 'merkezi', room: '204',
        schedule: [{ days: [1, 3, 4], start: '09:00', end: '18:00', slot: 30, breaks: [LUNCH] }, { days: [2, 5], start: '09:00', end: '13:00', slot: 30 }],
        services: [['initial', 30], ['followUp', 20], ['echo', 40], ['holter', 25]],
      },
      {
        clinic: 'kaspi', room: '12',
        schedule: [{ days: [2, 5], start: '14:00', end: '19:00', slot: 30 }],
        services: [['initial', 30], ['results', 20]],
      },
    ],
  },
  {
    key: 'resad', fin: '7RH21KL', firstName: 'Rəşad', lastName: 'Hüseynov', fatherName: 'Elman', birthDate: '1985-11-03', gender: 'MALE',
    specialties: ['neurology'], languages: ['az', 'ru'], experienceYears: 9, academicDegree: null, approvalMode: 'MANUAL', targetRating: 4.8, reviews: 11,
    bio: 'Baş ağrıları, miqren, bel-boyun ağrıları və yuxu pozğunluqları üzrə nevroloq. Hər pasient üçün ətraflı nevroloji müayinə aparır.',
    education: ['2004 — 2010 | Azərbaycan Tibb Universiteti', '2010 — 2013 | Rezidentura, nevrologiya'],
    areas: ['Miqren', 'Bel və boyun ağrıları', 'Yuxu pozğunluqları'],
    clinics: [{ clinic: 'kaspi', room: '7', schedule: [{ days: [1, 3, 4], start: '10:00', end: '17:00', slot: 30, breaks: [LUNCH] }], services: [['initial', 30], ['followUp', 20], ['consult', 30]] }],
  },
  {
    key: 'leyla', fin: '8LE33AB', firstName: 'Leyla', lastName: 'Əliyeva', fatherName: 'Nazim', birthDate: '1988-02-14', gender: 'FEMALE',
    specialties: ['pediatrics'], languages: ['az', 'ru'], experienceYears: 7, academicDegree: null, approvalMode: 'AUTO', targetRating: 4.6, reviews: 9,
    bio: 'Uşaqların böyümə və inkişafının izlənməsi, peyvənd təqvimi və tez-tez xəstələnən uşaqlar üzrə pediatr.',
    education: ['2006 — 2012 | Azərbaycan Tibb Universiteti, pediatriya', '2012 — 2015 | Rezidentura, pediatriya'],
    areas: ['Peyvənd təqvimi', 'Allergik xəstəliklər', 'Yenidoğulmuşlar'],
    clinics: [{ clinic: 'merkezi', room: '108', schedule: [{ days: [1, 2, 3, 4, 5], start: '09:00', end: '15:00', slot: 20, breaks: [LUNCH] }], services: [['initial', 20], ['followUp', 20]] }],
  },
  {
    key: 'kamran', fin: '9XY44ZW', firstName: 'Kamran', lastName: 'Quliyev', fatherName: 'Fikrət', birthDate: '1974-09-08', gender: 'MALE',
    specialties: ['orthopedics'], languages: ['az'], experienceYears: 21, academicDegree: 'Tibb elmləri doktoru', approvalMode: 'AUTO', targetRating: 4.7, reviews: 8, licenseDays: 13,
    bio: 'Oynaq xəstəlikləri, idman travmaları və onurğa deformasiyaları üzrə ortoped-travmatoloq.',
    education: ['1991 — 1997 | Azərbaycan Tibb Universiteti', '1997 — 2001 | Ortopediya üzrə klinik ordinatura'],
    areas: ['İdman travmaları', 'Artroz', 'Skolioz'],
    clinics: [{ clinic: 'sefa', room: '3-15', schedule: [{ days: [1, 2, 3, 4, 5, 6], start: '09:00', end: '16:00', slot: 30, breaks: [LUNCH] }], services: [['initial', 30], ['xray', 30], ['followUp', 20]] }],
  },
  {
    key: 'tural', fin: '1TI55CD', firstName: 'Tural', lastName: 'İsmayılov', fatherName: 'Akif', birthDate: '1990-06-21', gender: 'MALE',
    specialties: ['neurology'], languages: ['az', 'tr'], experienceYears: 5, academicDegree: null, approvalMode: 'AUTO', targetRating: 4.4, reviews: 6,
    bio: 'Gənc nevroloq; baş gicəllənməsi, nevropatiyalar və insultdan sonrakı reabilitasiya.',
    education: ['2008 — 2014 | Hacettepe Universiteti, tibb fakültəsi', '2014 — 2019 | Nevrologiya rezidenturası'],
    areas: ['Nevropatiya', 'İnsultdan sonrakı reabilitasiya'],
    clinics: [
      { clinic: 'sefa', room: '2-04', schedule: [{ days: [2, 4], start: '10:00', end: '18:00', slot: 30, breaks: [LUNCH] }], services: [['initial', 30], ['followUp', 20]] },
      { clinic: 'merkezi', room: '210', schedule: [{ days: [1, 3], start: '14:00', end: '18:00', slot: 30 }], services: [['initial', 30], ['consult', 30]] },
    ],
  },
  {
    key: 'sebine', fin: '2SQ66EF', firstName: 'Səbinə', lastName: 'Qasımova', fatherName: 'Rauf', birthDate: '1978-12-01', gender: 'FEMALE',
    specialties: ['endocrinology', 'therapist'], languages: ['az', 'ru', 'en'], experienceYears: 15, academicDegree: 'Tibb elmləri doktoru', approvalMode: 'AUTO', targetRating: 4.9, reviews: 12,
    bio: 'Şəkərli diabet, qalxanabənzər vəz xəstəlikləri və piylənmə üzrə endokrinoloq.',
    education: ['1995 — 2001 | Azərbaycan Tibb Universiteti', '2001 — 2004 | Endokrinologiya üzrə ordinatura', '2012 | Doktorluq dissertasiyası'],
    areas: ['Şəkərli diabet', 'Tiroid xəstəlikləri', 'Piylənmə'],
    clinics: [{ clinic: 'merkezi', room: '305', schedule: [{ days: [2, 4], start: '09:00', end: '17:00', slot: 30, breaks: [LUNCH] }], services: [['initial', 30], ['followUp', 20], ['results', 20]] }],
  },
  {
    key: 'elvin', fin: '3EB77GH', firstName: 'Elvin', lastName: 'Babayev', fatherName: 'Rəşid', birthDate: '1995-03-17', gender: 'MALE',
    specialties: ['therapist'], languages: ['az', 'ru'], experienceYears: 3, academicDegree: null, approvalMode: 'AUTO', targetRating: 0, reviews: 0,
    bio: 'Terapevt: ümumi müayinə, analiz nəticələrinin şərhi və profilaktik yoxlamalar.',
    education: ['2012 — 2018 | Azərbaycan Tibb Universiteti', '2018 — 2021 | Rezidentura, daxili xəstəliklər'],
    areas: ['Profilaktik müayinə', 'Analizlərin şərhi'],
    clinics: [{ clinic: 'nur', room: '1', schedule: [{ days: [1, 2, 3, 4, 5, 6], start: '08:00', end: '14:00', slot: 15 }], services: [['initial', 15], ['results', 15], ['lab', 15]] }],
  },
  {
    key: 'gunay', fin: '4GR88IJ', firstName: 'Günay', lastName: 'Rəsulova', fatherName: 'Tahir', birthDate: '1986-08-09', gender: 'FEMALE',
    specialties: ['dermatology'], languages: ['az', 'ru', 'en'], experienceYears: 11, academicDegree: null, approvalMode: 'AUTO', targetRating: 4.5, reviews: 7,
    bio: 'Akne, ekzema, psoriaz və dermatoskopiya üzrə dermatoloq.',
    education: ['2003 — 2009 | Azərbaycan Tibb Universiteti', '2009 — 2012 | Dermatovenerologiya rezidenturası'],
    areas: ['Akne', 'Psoriaz', 'Dermatoskopiya'],
    clinics: [{ clinic: 'kaspi', room: '15', schedule: [{ days: [1, 5], start: '09:00', end: '13:00', slot: 30 }, { days: [3], start: '15:00', end: '20:00', slot: 30 }], services: [['initial', 30], ['followUp', 20]] }],
  },
  {
    key: 'orxan', fin: '5ON99KL', firstName: 'Orxan', lastName: 'Nəbiyev', fatherName: 'Zakir', birthDate: '1989-01-25', gender: 'MALE',
    specialties: ['dentistry'], languages: ['az', 'ru'], experienceYears: 8, academicDegree: null, approvalMode: 'AUTO', targetRating: 4.6, reviews: 8,
    bio: 'Terapevtik stomatologiya: kariyes müalicəsi, kanal müalicəsi, peşəkar gigiyena.',
    education: ['2007 — 2012 | Azərbaycan Tibb Universiteti, stomatologiya'],
    areas: ['Kanal müalicəsi', 'Estetik plomb', 'Peşəkar gigiyena'],
    clinics: [{ clinic: 'dentart', room: 'A2', schedule: [{ days: [1, 2, 3, 4, 5, 6], start: '10:00', end: '19:00', slot: 45, breaks: [['14:00', '15:00', 'Nahar']] }], services: [['consult', 45], ['initial', 45]] }],
  },
  {
    key: 'nermin', fin: '6NH11MN', firstName: 'Nərmin', lastName: 'Hüseynli', fatherName: 'Əli', birthDate: '1981-10-12', gender: 'FEMALE',
    specialties: ['gynecology'], languages: ['az', 'ru'], experienceYears: 14, academicDegree: 'Tibb üzrə fəlsəfə doktoru', approvalMode: 'MANUAL', targetRating: 4.8, reviews: 10,
    bio: 'Hamiləliyin aparılması, ginekoloji USM və reproduktiv sağlamlıq.',
    education: ['1998 — 2004 | Azərbaycan Tibb Universiteti', '2004 — 2008 | Mamalıq və ginekologiya ordinaturası'],
    areas: ['Hamiləliyin aparılması', 'Ginekoloji USM'],
    clinics: [{ clinic: 'merkezi', room: '112', schedule: [{ days: [1, 3, 5], start: '10:00', end: '16:00', slot: 30, breaks: [LUNCH] }], services: [['initial', 30], ['usm', 30], ['followUp', 20]] }],
  },
  // ── Axtarışda görünməyənlər (görünmə qaydalarının demosu) ──
  {
    key: 'ferid', fin: '7FM22OP', firstName: 'Fərid', lastName: 'Məlikov', fatherName: 'Arif', birthDate: '1992-04-04', gender: 'MALE',
    specialties: ['cardiology'], languages: ['az'], experienceYears: 2, academicDegree: null, approvalMode: 'AUTO', targetRating: 0, reviews: 0, profileCompleted: false,
    bio: '', education: [], areas: [],
    clinics: [{ clinic: 'merkezi', room: '206', schedule: [], services: [['initial', 30]] }],
  },
  {
    key: 'zaur', fin: '8ZE33QR', firstName: 'Zaur', lastName: 'Əhmədov', fatherName: 'Vasif', birthDate: '1980-07-19', gender: 'MALE',
    specialties: ['urology'], languages: ['az', 'ru'], experienceYears: 16, academicDegree: null, approvalMode: 'AUTO', targetRating: 4.3, reviews: 5,
    bio: 'Uroloq.', education: ['1997 — 2003 | Azərbaycan Tibb Universiteti'], areas: ['Uroloji müayinə'],
    clinics: [{ clinic: 'kaspi', room: '9', status: 'INACTIVE', schedule: [{ days: [2, 4], start: '09:00', end: '13:00', slot: 30 }], services: [['initial', 30]] }],
  },
];

/** Rəy yazan sintetik pasientlər (keçmiş qəbullar üçün). */
export const REVIEWER_PATIENTS: { fin: string; firstName: string; lastName: string; fatherName: string; birthDate: string; gender: Gender }[] = [
  { fin: '1PA01AA', firstName: 'Elçin', lastName: 'Məmmədov', fatherName: 'Qasım', birthDate: '1970-02-11', gender: 'MALE' },
  { fin: '1PA02AA', firstName: 'Səbinə', lastName: 'Abbasova', fatherName: 'İlham', birthDate: '1993-05-02', gender: 'FEMALE' },
  { fin: '1PA03AA', firstName: 'Ramil', lastName: 'Quliyev', fatherName: 'Sərdar', birthDate: '1987-08-19', gender: 'MALE' },
  { fin: '1PA04AA', firstName: 'Aytən', lastName: 'Həsənli', fatherName: 'Məmməd', birthDate: '1996-12-30', gender: 'FEMALE' },
  { fin: '1PA05AA', firstName: 'Kənan', lastName: 'İsmayılzadə', fatherName: 'Rafiq', birthDate: '1984-03-07', gender: 'MALE' },
  { fin: '1PA06AA', firstName: 'Lalə', lastName: 'Novruzova', fatherName: 'Elxan', birthDate: '1979-09-23', gender: 'FEMALE' },
  { fin: '1PA07AA', firstName: 'Fidan', lastName: 'Əliyeva', fatherName: 'Tofiq', birthDate: '2001-01-15', gender: 'FEMALE' },
  { fin: '1PA08AA', firstName: 'Tofiq', lastName: 'Rzayev', fatherName: 'Nadir', birthDate: '1965-06-04', gender: 'MALE' },
];

export const REVIEW_COMMENTS: Record<number, string[]> = {
  5: [
    'Müayinə vaxtında başladı. Bütün analizlərimi sətir-sətir izah etdi, dərman dozasını dəyişdi və nə üçün dəyişdiyini yazılı verdi.',
    'Çox diqqətli həkimdir, tələsmədən dinlədi və bütün suallarıma cavab verdi.',
    'Atamı müayinəyə gətirdik. Nəticəni iki gün sonra özü zəng edib izah etdi.',
    'Peşəkar və mehriban yanaşma. Tövsiyə edirəm.',
    'Randevu sistemi rahatdır, klinikada gözləmədən qəbul olundum.',
  ],
  4: [
    'Həkimdən razıyam, amma qeydiyyatda 15 dəqiqə gözlədim. Müayinənin özü isə tələsik keçmədi.',
    'Yaxşı mütəxəssisdir, sadəcə növbəti randevu üçün boş vaxt tapmaq çətindir.',
    'Ətraflı müayinə etdi, tövsiyələri aydın idi.',
  ],
  3: ['Müayinə normal keçdi, amma daha ətraflı izah gözləyirdim.', 'Qəbul gecikdi, həkim isə yorğun görünürdü.'],
  2: ['Qəbul çox qısa çəkdi, suallarıma tam cavab ala bilmədim.'],
};
