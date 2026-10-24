import type { NotificationChannel, NotificationType } from '@mediconnect/shared';

// Bildiriş növləri (domain-rules.md §6, spec "Bildiriş növləri").
// mandatory: istifadəçi söndürə bilməz (BR-1001-01/02). critical: gecə saatlarında da göndərilir (BR-1001-08).

export interface NotificationTypeConfig {
  channels: NotificationChannel[];
  mandatory: boolean;
  critical: boolean;
  /** Bildiriş mərkəzində göstərilməsin (məs. OTP). */
  noInApp?: boolean;
  label: string;
}

export const NOTIFICATION_CONFIG: Record<NotificationType, NotificationTypeConfig> = {
  OTP_CODE: { channels: ['SMS'], mandatory: true, critical: true, noInApp: true, label: 'Təsdiq kodu' },
  APPOINTMENT_CONFIRMED: { channels: ['SMS', 'PUSH', 'IN_APP'], mandatory: true, critical: true, label: 'Randevu təsdiqi' },
  APPOINTMENT_PENDING: { channels: ['PUSH', 'IN_APP'], mandatory: false, critical: false, label: 'Təsdiq gözləyən randevu' },
  APPOINTMENT_REQUESTED: { channels: ['SMS', 'PUSH', 'IN_APP'], mandatory: true, critical: true, label: 'Randevu sorğusu göndərildi' },
  NEW_APPOINTMENT: { channels: ['PUSH', 'IN_APP'], mandatory: false, critical: false, label: 'Yeni randevu' },
  RESCHEDULE_PROPOSED: { channels: ['SMS', 'PUSH', 'IN_APP'], mandatory: true, critical: true, label: 'Vaxt dəyişikliyi təklifi' },
  REMINDER_24H: { channels: ['SMS', 'PUSH'], mandatory: false, critical: false, label: 'Xatırlatma (24 saat)' },
  REMINDER_2H: { channels: ['PUSH'], mandatory: false, critical: false, label: 'Xatırlatma (2 saat)' },
  APPOINTMENT_CANCELLED: { channels: ['SMS', 'PUSH', 'IN_APP'], mandatory: true, critical: true, label: 'Randevu ləğvi' },
  APPOINTMENT_RESCHEDULED: { channels: ['SMS', 'PUSH', 'IN_APP'], mandatory: true, critical: true, label: 'Vaxt dəyişikliyi' },
  APPOINTMENT_REJECTED: { channels: ['SMS', 'PUSH', 'IN_APP'], mandatory: true, critical: true, label: 'Randevu rəddi' },
  PRESCRIPTION_CREATED: { channels: ['PUSH', 'IN_APP'], mandatory: false, critical: false, label: 'Yeni resept' },
  PRESCRIPTION_CANCELLED: { channels: ['PUSH', 'IN_APP'], mandatory: true, critical: false, label: 'Resept ləğv edildi' },
  PRESCRIPTION_RENEWAL_REQUESTED: { channels: ['PUSH', 'IN_APP'], mandatory: false, critical: false, label: 'Təkrar resept sorğusu' },
  PRESCRIPTION_RENEWAL_REJECTED: { channels: ['PUSH', 'IN_APP'], mandatory: false, critical: false, label: 'Təkrar resept sorğusu rədd edildi' },
  DOCUMENT_SHARED: { channels: ['PUSH', 'IN_APP'], mandatory: false, critical: false, label: 'Sənəd paylaşıldı' },
  REVIEW_INVITE: { channels: ['PUSH', 'IN_APP'], mandatory: false, critical: false, label: 'Rəy dəvəti' },
  REVIEW_MODERATED: { channels: ['PUSH', 'IN_APP'], mandatory: false, critical: false, label: 'Rəyinizin moderasiya nəticəsi' },
  REVIEW_REPLY_MODERATED: { channels: ['IN_APP'], mandatory: false, critical: false, label: 'Rəyə cavabın moderasiya nəticəsi' },
  REVIEW_PUBLISHED: { channels: ['IN_APP'], mandatory: false, critical: false, label: 'Rəy dərc olundu' },
  DOCTOR_INVITE: { channels: ['SMS'], mandatory: true, critical: true, noInApp: true, label: 'Həkim dəvəti' },
  DOCTOR_INVITE_ACCEPTED: { channels: ['PUSH', 'IN_APP'], mandatory: false, critical: false, label: 'Həkim dəvəti qəbul etdi' },
  DOCTOR_INVITE_DECLINED: { channels: ['PUSH', 'IN_APP'], mandatory: false, critical: false, label: 'Həkim dəvəti rədd etdi' },
  CLINIC_DOCTOR_STATUS_CHANGED: { channels: ['PUSH', 'IN_APP'], mandatory: true, critical: false, label: 'Klinikada statusunuz dəyişdi' },
  CLINIC_STATUS_CHANGED: { channels: ['EMAIL', 'IN_APP'], mandatory: true, critical: true, label: 'Klinikanın statusu dəyişdi' },
  CLINIC_ADMIN_INVITE: { channels: ['SMS'], mandatory: true, critical: true, noInApp: true, label: 'Klinika admin dəvəti' },
  SCHEDULE_CHANGED: { channels: ['PUSH', 'IN_APP'], mandatory: false, critical: false, label: 'Cədvəl dəyişdirildi' },
  LICENSE_EXPIRY_WARNING: { channels: ['EMAIL', 'IN_APP'], mandatory: false, critical: false, label: 'Lisenziya xəbərdarlığı' },
  SECURITY_NEW_DEVICE: { channels: ['SMS', 'PUSH', 'IN_APP'], mandatory: true, critical: true, label: 'Təhlükəsizlik xəbərdarlığı' },
  ACCOUNT_STATUS_CHANGED: { channels: ['SMS', 'EMAIL', 'IN_APP'], mandatory: true, critical: true, label: 'Hesab statusu' },
  NO_SHOW_RECORDED: { channels: ['PUSH', 'IN_APP'], mandatory: false, critical: false, label: 'Gəlməmə qeydə alındı' },
  PIN_CHANGED: { channels: ['SMS', 'IN_APP'], mandatory: true, critical: true, label: 'PIN dəyişdirildi' },
  DOCTOR_PROFILE_COMPLETED: { channels: ['PUSH', 'IN_APP'], mandatory: false, critical: false, label: 'Həkim profilini tamamladı' },
  REGISTRATION_COMPLETED: { channels: ['SMS', 'IN_APP'], mandatory: false, critical: false, label: 'Qeydiyyat tamamlandı' },
};
