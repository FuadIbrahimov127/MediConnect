import type { Gender, Language, NotificationChannel, NotificationType, UserRole, UserStatus } from './enums';

// API DTO-ları. Mərhələ irəlilədikcə modul üzrə genişlənir.

export interface CurrentUserDto {
  userId: string;
  role: UserRole;
  status: UserStatus;
  firstName: string;
  lastName: string;
  fatherName: string | null;
  mobileNumber: string;
  email: string | null;
  photoUrl: string | null;
  preferredLanguage: Language;
  gender: Gender;
  /** DOCTOR: bağlı olduğu klinikalar; CLINIC_ADMIN: idarə etdiyi klinika(lar). */
  clinicIds: string[];
  /** Pasient tibbi razılığı (yalnız PATIENT). */
  medicalConsent?: boolean;
  /** Həkim profili tamamlanıbmı (yalnız DOCTOR). */
  profileCompleted?: boolean;
}

export interface AuthResultDto {
  token: string;
  user: CurrentUserDto;
  redirectTo: string;
  /** Biometrik giriş aktivləşdiriləndə cihazda saxlanacaq token (F9). */
  deviceToken?: string | null;
}

export interface CatalogItemDto {
  id: string;
  name: string;
  /** Yalnız ixtisaslar: görünən həkim sayı. */
  doctorCount?: number;
}

export interface ServiceCatalogItemDto extends CatalogItemDto {
  category: string | null;
}

export interface LanguageItemDto {
  code: string;
  name: string;
}

export interface NotificationDto {
  notificationId: string;
  notificationType: NotificationType;
  title: string;
  body: string;
  deepLink: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface OutboxMessageDto {
  id: string;
  channel: Exclude<NotificationChannel, 'IN_APP'>;
  to: string;
  title: string | null;
  body: string;
  status: 'SENT' | 'DELIVERED' | 'FAILED';
  createdAt: string;
}

export interface DevUserDto {
  userId: string;
  role: UserRole;
  fullName: string;
  mobileNumber: string;
  pin: string;
  description: string;
}

export interface DevStateDto {
  now: string;
  offsetMinutes: number;
  faults: Record<string, 'ok' | 'down' | 'error'>;
  counts: Record<string, number>;
}

export const ROLE_HOME: Record<UserRole, string> = {
  PATIENT: '/account',
  DOCTOR: '/doctor',
  CLINIC_ADMIN: '/clinic-admin',
  SUPER_ADMIN: '/admin',
};
