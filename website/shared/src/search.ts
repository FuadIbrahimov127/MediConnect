import { z } from 'zod';
import { AVAILABILITY, CLINIC_SORT, CLINIC_TYPE, DOCTOR_SORT, GENDER, type ApprovalMode, type ClinicType, type Gender } from './enums';
import { csvArray } from './schemas';

// Modul 2–3 — axtarış (UC-201, UC-202) və detal səhifələri (UC-301, UC-302).

export const WORK_MODE = ['TWENTY_FOUR_SEVEN', 'WEEKEND', 'EVENING'] as const;
export type WorkMode = (typeof WORK_MODE)[number];

const id = z.string().uuid();
const optionalNumber = (min: number, max: number) => z.coerce.number().min(min).max(max).optional();

/** GET /v1/doctors — spec "Həkim axtarışı ekranı" parametrləri. */
export const doctorSearchSchema = z.object({
  query: z.string().trim().max(100).optional(),
  specialtyIds: csvArray(id).optional(),
  cityIds: csvArray(id).optional(),
  clinicIds: csvArray(id).optional(),
  minRating: optionalNumber(0, 5),
  gender: z.enum(GENDER).optional(),
  languageCodes: csvArray(z.string().length(2)).optional(),
  minExperience: optionalNumber(0, 60),
  availability: z.enum(AVAILABILITY).optional(),
  /** Ana səhifədən gələn konkret tarix (YYYY-MM-DD) — həmin gün boş slotu olan həkimlər. */
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  academicDegrees: csvArray(z.string().max(100)).optional(),
  sortBy: z.enum(DOCTOR_SORT).default('RATING'),
  page: z.coerce.number().int().min(1).default(1),
  size: z.coerce.number().int().min(1).max(20).default(20),
});
export type DoctorSearchParams = z.infer<typeof doctorSearchSchema>;

/** GET /v1/clinics */
export const clinicSearchSchema = z.object({
  query: z.string().trim().max(100).optional(),
  cityIds: csvArray(id).optional(),
  clinicTypes: csvArray(z.enum(CLINIC_TYPE)).optional(),
  specialtyIds: csvArray(id).optional(),
  serviceIds: csvArray(id).optional(),
  workModes: csvArray(z.enum(WORK_MODE)).optional(),
  minRating: optionalNumber(0, 5),
  insurances: csvArray(z.string().max(100)).optional(),
  sortBy: z.enum(CLINIC_SORT).default('RATING'),
  /** DISTANCE çeşidləməsi üçün istifadəçinin koordinatları. */
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  page: z.coerce.number().int().min(1).default(1),
  size: z.coerce.number().int().min(1).max(20).default(20),
});
export type ClinicSearchParams = z.infer<typeof clinicSearchSchema>;

export const slotsQuerySchema = z.object({
  clinicId: id,
  serviceId: id.optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  days: z.coerce.number().int().min(1).max(60).default(7),
});

export const reviewsQuerySchema = z.object({
  sort: z.enum(['NEWEST', 'HIGHEST', 'LOWEST']).default('NEWEST'),
  page: z.coerce.number().int().min(1).default(1),
  size: z.coerce.number().int().min(1).max(20).default(10),
});

export interface DoctorCardDto {
  doctorId: string;
  fullName: string;
  photoUrl: string | null;
  gender: Gender;
  specialties: string[];
  clinics: { clinicId: string; name: string; cityName: string }[];
  academicDegree: string | null;
  rating: number | null;
  reviewCount: number;
  experienceYears: number | null;
  languages: string[];
  /** ISO UTC; boş slot yoxdursa null. */
  earliestSlot: string | null;
  /** Rəyi olmayan həkim — "Yeni həkim" etiketi. */
  isNew: boolean;
}

export interface FacetDto {
  id: string;
  name: string;
  count: number;
}

export interface DoctorSearchResultDto {
  totalCount: number;
  page: number;
  size: number;
  doctors: DoctorCardDto[];
  /** Filtr panelindəki saylar (cari digər filtrlər nəzərə alınmadan). */
  facets: { specialties: FacetDto[]; clinics: FacetDto[]; cities: FacetDto[]; academicDegrees: FacetDto[] };
  /** EF-201-1: nəticə yoxdursa təkliflər. */
  suggestions: string[];
}

export interface ClinicCardDto {
  clinicId: string;
  name: string;
  logoUrl: string | null;
  clinicType: ClinicType;
  address: string;
  cityName: string;
  district: string | null;
  hoursSummary: string;
  rating: number | null;
  doctorCount: number;
  specialtyCount: number;
  latitude: number | null;
  longitude: number | null;
  acceptingAppointments: boolean;
  is24x7: boolean;
  distanceKm: number | null;
}

export interface ClinicSearchResultDto {
  totalCount: number;
  page: number;
  size: number;
  clinics: ClinicCardDto[];
  facets: { cities: FacetDto[]; clinicTypes: FacetDto[]; specialties: FacetDto[]; services: FacetDto[]; insurances: FacetDto[] };
  suggestions: string[];
}

export interface AutocompleteItemDto {
  type: 'DOCTOR' | 'CLINIC' | 'SPECIALTY';
  id: string;
  label: string;
  sub: string;
}

export interface ServiceOfferDto {
  serviceId: string;
  name: string;
  durationMinutes: number;
}

export interface DoctorClinicDto {
  clinicId: string;
  name: string;
  clinicType: ClinicType;
  address: string;
  cityName: string;
  district: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string;
  roomNumber: string | null;
  acceptingAppointments: boolean;
  services: ServiceOfferDto[];
  earliestSlot: string | null;
}

export interface RatingSummaryDto {
  average: number | null;
  count: number;
  distribution: Record<'1' | '2' | '3' | '4' | '5', number>;
  professionalism: number | null;
  attitude: number | null;
  waitingTime: number | null;
}

export interface DoctorDetailDto {
  doctorId: string;
  fullName: string;
  photoUrl: string | null;
  gender: Gender;
  specialties: { id: string; name: string; isPrimary: boolean }[];
  academicDegree: string | null;
  bio: string | null;
  /** Sətirlər: "2003 — 2009 | Azərbaycan Tibb Universiteti" */
  education: string[];
  experienceYears: number | null;
  specializationAreas: string[];
  languages: { code: string; name: string }[];
  certificates: { title: string; year: number | null }[];
  approvalMode: ApprovalMode;
  rating: RatingSummaryDto;
  isNew: boolean;
  clinics: DoctorClinicDto[];
}

export interface SlotDto {
  slotId: string;
  startTime: string;
  endTime: string;
  /** ISO UTC başlanğıc. */
  startAt: string;
  available: boolean;
}

export interface SlotDayDto {
  date: string;
  slots: SlotDto[];
}

export interface DoctorSlotsDto {
  clinicId: string;
  serviceId: string | null;
  durationMinutes: number | null;
  acceptingAppointments: boolean;
  days: SlotDayDto[];
  /** FR-301-20: yaxın günlərdə boş yer yoxdursa növbəti boş tarix. */
  nextAvailableDate: string | null;
}

export interface ReviewItemDto {
  reviewId: string;
  authorName: string;
  overallRating: number;
  comment: string | null;
  createdAt: string;
  doctorName: string;
  clinicName: string | null;
  serviceName: string | null;
  reply: { text: string; createdAt: string } | null;
}

export interface ReviewListDto {
  summary: RatingSummaryDto;
  totalCount: number;
  page: number;
  size: number;
  reviews: ReviewItemDto[];
}

export interface WorkingHourDto {
  dayOfWeek: number;
  opensAt: string | null;
  closesAt: string | null;
  isClosed: boolean;
}

export interface ClinicDetailDto {
  clinicId: string;
  name: string;
  clinicType: ClinicType;
  logoUrl: string | null;
  description: string | null;
  foundedYear: number | null;
  address: string;
  cityName: string;
  district: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string;
  email: string | null;
  website: string | null;
  rating: number | null;
  reviewCount: number;
  is24x7: boolean;
  acceptingAppointments: boolean;
  insurances: string[];
  specialties: { id: string; name: string }[];
  workingHours: WorkingHourDto[];
  photos: string[];
  services: { serviceId: string; name: string; category: string | null }[];
  doctors: DoctorCardDto[];
}

/** Həkim deaktivdir / klinika deaktivdir (EF-301-2, EF-302-2) — 404 cavabının details hissəsi. */
export interface UnavailableDetailsDto {
  inactive: true;
  name: string;
  alternatives: DoctorCardDto[];
}
