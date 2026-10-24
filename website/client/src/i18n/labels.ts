import * as shared from '@mediconnect/shared';
import { currentLanguage } from './index';

// shared/-dəki enum etiketləri (AZ) + RU/EN tərcümələri. Client bu modulu '@mediconnect/shared' əvəzinə import edir,
// beləliklə status/rol/kateqoriya adları istifadəçinin dilində göstərilir (NFR-28). Açarlar tip səviyyəsində tam yoxlanır.

type Tr<T extends Record<string, string>> = { ru: Record<keyof T, string>; en: Record<keyof T, string> };
function localized<T extends Record<string, string>>(az: T, tr: Tr<T>): Record<keyof T, string> {
  const lang = currentLanguage();
  return lang === 'az' ? az : tr[lang];
}

export const CLINIC_TYPE_LABEL = localized(shared.CLINIC_TYPE_LABEL, {
  ru: { POLYCLINIC: 'Поликлиника', HOSPITAL: 'Больница', DIAGNOSTIC_CENTER: 'Диагностический центр', DENTAL: 'Стоматология', LABORATORY: 'Лаборатория' },
  en: { POLYCLINIC: 'Polyclinic', HOSPITAL: 'Hospital', DIAGNOSTIC_CENTER: 'Diagnostic center', DENTAL: 'Dental clinic', LABORATORY: 'Laboratory' },
});

export const DOCTOR_CLINIC_STATUS_LABEL = localized(shared.DOCTOR_CLINIC_STATUS_LABEL, {
  ru: { INVITED: 'Приглашён', ACTIVE: 'Активен', INACTIVE: 'Неактивен', REMOVED: 'Удалён' },
  en: { INVITED: 'Invited', ACTIVE: 'Active', INACTIVE: 'Inactive', REMOVED: 'Removed' },
});

export const DOCUMENT_CATEGORY_LABEL = localized(shared.DOCUMENT_CATEGORY_LABEL, {
  ru: { LAB_RESULT: 'Результат анализа', IMAGING: 'Визуализация', EPICRISIS: 'Эпикриз / выписка', PRESCRIPTION: 'Рецепт', OTHER: 'Другое' },
  en: { LAB_RESULT: 'Lab result', IMAGING: 'Imaging', EPICRISIS: 'Discharge summary', PRESCRIPTION: 'Prescription', OTHER: 'Other' },
});

export const ACCESS_DURATION_LABEL = localized(shared.ACCESS_DURATION_LABEL, {
  ru: { TWENTY_FOUR_HOURS: '24 часа', SEVEN_DAYS: '7 дней', THIRTY_DAYS: '30 дней', APPOINTMENT_PERIOD: 'На период приёма (+7 дней)' },
  en: { TWENTY_FOUR_HOURS: '24 hours', SEVEN_DAYS: '7 days', THIRTY_DAYS: '30 days', APPOINTMENT_PERIOD: 'For the appointment period (+7 days)' },
});

export const PRESCRIPTION_STATUS_LABEL = localized(shared.PRESCRIPTION_STATUS_LABEL, {
  ru: { DRAFT: 'Черновик', SIGNED: 'Активен', EXPIRED: 'Истёк', CANCELLED: 'Отменён', DISPENSED: 'Выдан' },
  en: { DRAFT: 'Draft', SIGNED: 'Active', EXPIRED: 'Expired', CANCELLED: 'Cancelled', DISPENSED: 'Dispensed' },
});

export const ALLERGY_SEVERITY_LABEL = localized(shared.ALLERGY_SEVERITY_LABEL, {
  ru: { MILD: 'Лёгкая', MODERATE: 'Средняя', SEVERE: 'Тяжёлая' },
  en: { MILD: 'Mild', MODERATE: 'Moderate', SEVERE: 'Severe' },
});

export const INTERACTION_SEVERITY_LABEL = localized(shared.INTERACTION_SEVERITY_LABEL, {
  ru: { MINOR: 'Слабое', MODERATE: 'Среднее', SEVERE: 'Тяжёлое' },
  en: { MINOR: 'Minor', MODERATE: 'Moderate', SEVERE: 'Severe' },
});

export const REVIEW_STATUS_LABEL = localized(shared.REVIEW_STATUS_LABEL, {
  ru: { PENDING_MODERATION: 'На модерации', PUBLISHED: 'Опубликован', REJECTED: 'Отклонён', REPORTED: 'Есть жалоба', WITHDRAWN: 'Отозван' },
  en: { PENDING_MODERATION: 'Awaiting moderation', PUBLISHED: 'Published', REJECTED: 'Rejected', REPORTED: 'Reported', WITHDRAWN: 'Withdrawn' },
});

export const FILTER_FLAG_LABEL = localized(shared.FILTER_FLAG_LABEL as Record<'PERSONAL_DATA' | 'MEDICAL_DETAIL' | 'PROFANITY' | 'SPAM', string>, {
  ru: { PERSONAL_DATA: 'Личные данные (телефон, FIN, email)', MEDICAL_DETAIL: 'Чувствительная медицинская деталь', PROFANITY: 'Оскорбительное выражение', SPAM: 'Спам / ссылка' },
  en: { PERSONAL_DATA: 'Personal data (phone, FIN, email)', MEDICAL_DETAIL: 'Sensitive medical detail', PROFANITY: 'Offensive language', SPAM: 'Spam / link' },
}) as Record<string, string>;

export const CLINIC_STATUS_LABEL = localized(shared.CLINIC_STATUS_LABEL, {
  ru: { PENDING_VERIFICATION: 'Ожидает проверки', ACTIVE: 'Активна', SUSPENDED: 'Приостановлена', INACTIVE: 'Деактивирована' },
  en: { PENDING_VERIFICATION: 'Pending verification', ACTIVE: 'Active', SUSPENDED: 'Suspended', INACTIVE: 'Deactivated' },
});

export const USER_STATUS_LABEL = localized(shared.USER_STATUS_LABEL, {
  ru: { PENDING_VERIFICATION: 'Ожидает подтверждения', VERIFIED: 'Активен', SUSPENDED: 'Приостановлен', BLOCKED: 'Заблокирован', DELETED: 'Удалён (анонимно)' },
  en: { PENDING_VERIFICATION: 'Pending verification', VERIFIED: 'Active', SUSPENDED: 'Suspended', BLOCKED: 'Blocked', DELETED: 'Deleted (anonymized)' },
});

export const ROLE_LABEL = localized(shared.ROLE_LABEL, {
  ru: { PATIENT: 'Пациент', DOCTOR: 'Врач', CLINIC_ADMIN: 'Администратор клиники', SUPER_ADMIN: 'Супер-админ' },
  en: { PATIENT: 'Patient', DOCTOR: 'Doctor', CLINIC_ADMIN: 'Clinic admin', SUPER_ADMIN: 'Super admin' },
});

export const CLINIC_DOCUMENT_LABEL = localized(shared.CLINIC_DOCUMENT_LABEL, {
  ru: { REGISTRATION: 'Свидетельство о регистрации', LICENSE: 'Лицензия на деятельность', CONTRACT: 'Договор', OTHER: 'Другое' },
  en: { REGISTRATION: 'Registration certificate', LICENSE: 'Operating license', CONTRACT: 'Contract', OTHER: 'Other' },
});
