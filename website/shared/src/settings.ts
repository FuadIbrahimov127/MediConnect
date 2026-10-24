// system_settings açarları və default dəyərlər (domain-rules.md §5). Server seed-i bunu istifadə edir.

export interface SettingDef {
  value: number;
  category: 'security' | 'appointment' | 'notification' | 'review' | 'document' | 'prescription' | 'clinic';
  description: string;
  isCritical?: boolean;
  min: number;
  max: number;
}

export const SETTINGS = {
  otp_validity_seconds: { value: 120, category: 'security', description: 'OTP kodunun etibarlılıq müddəti (saniyə)', min: 30, max: 600 },
  otp_resend_interval_seconds: { value: 60, category: 'security', description: 'OTP təkrar göndərmə intervalı (saniyə)', min: 10, max: 600 },
  sima_qr_validity_seconds: { value: 300, category: 'security', description: 'SİMA QR kodunun müddəti (saniyə)', min: 60, max: 900 },
  slot_soft_lock_minutes: { value: 10, category: 'appointment', description: 'Slotun müvəqqəti bloklanma müddəti (dəqiqə)', min: 1, max: 30 },
  min_booking_lead_hours: { value: 1, category: 'appointment', description: 'Minimum əvvəlcədən randevu vaxtı (saat)', min: 0, max: 72 },
  max_reschedule_count: { value: 2, category: 'appointment', description: 'Maksimum yenidən planlaşdırma sayı', min: 0, max: 10 },
  min_cancel_lead_hours: { value: 1, category: 'appointment', description: 'Minimum ləğv vaxtı (saat)', min: 0, max: 72 },
  min_reschedule_lead_hours: { value: 2, category: 'appointment', description: 'Minimum köçürmə vaxtı (saat)', min: 0, max: 72 },
  slot_generation_days: { value: 60, category: 'appointment', description: 'Neçə gün irəli slot generasiya olunur', min: 7, max: 180 },
  no_show_limit: { value: 3, category: 'appointment', description: 'No-show limiti', min: 1, max: 20 },
  auto_complete_after_hours: { value: 24, category: 'appointment', description: 'Randevunun avtomatik tamamlanma müddəti (saat)', min: 1, max: 168 },
  reminder_first_hours: { value: 24, category: 'notification', description: 'Birinci xatırlatma (saat əvvəl)', min: 1, max: 72 },
  reminder_second_hours: { value: 2, category: 'notification', description: 'İkinci xatırlatma (saat əvvəl)', min: 1, max: 24 },
  quiet_hours_start: { value: 23, category: 'notification', description: 'Sakit saatların başlanğıcı', min: 0, max: 23 },
  quiet_hours_end: { value: 8, category: 'notification', description: 'Sakit saatların sonu', min: 0, max: 23 },
  review_window_days: { value: 30, category: 'review', description: 'Rəy yazma müddəti (gün)', min: 1, max: 180 },
  review_edit_hours: { value: 24, category: 'review', description: 'Rəy redaktə müddəti (saat)', min: 0, max: 168 },
  review_invite_delay_hours: { value: 2, category: 'review', description: 'Rəy dəvətinin gecikməsi (saat)', min: 0, max: 72 },
  review_reminder_days: { value: 3, category: 'review', description: 'Rəy xatırlatması (gün)', min: 1, max: 30 },
  max_file_size_mb: { value: 10, category: 'document', description: 'Maksimum fayl ölçüsü (MB)', min: 1, max: 50 },
  document_soft_delete_days: { value: 30, category: 'document', description: 'Sənəd soft delete müddəti (gün)', min: 1, max: 365 },
  signed_url_ttl_seconds: { value: 60, category: 'document', description: 'Signed URL müddəti (saniyə)', min: 10, max: 600 },
  prescription_validity_days: { value: 30, category: 'prescription', description: 'Reseptin standart etibarlılıq müddəti (gün)', min: 1, max: 365 },
  session_timeout_minutes: { value: 15, category: 'security', description: 'Sessiya timeout müddəti (dəqiqə)', isCritical: true, min: 5, max: 240 },
  max_login_attempts: { value: 5, category: 'security', description: 'Maksimum giriş cəhdi', isCritical: true, min: 3, max: 20 },
  login_lockout_minutes: { value: 30, category: 'security', description: 'Bloklama müddəti (dəqiqə)', isCritical: true, min: 1, max: 1440 },
  doctor_invite_validity_days: { value: 7, category: 'clinic', description: 'Həkim dəvətinin etibarlılıq müddəti (gün)', min: 1, max: 30 },
  license_expiry_warning_days: { value: 30, category: 'clinic', description: 'Lisenziya bitməsinə xəbərdarlıq müddəti (gün)', min: 1, max: 180 },
} satisfies Record<string, SettingDef>;

export type SettingKey = keyof typeof SETTINGS;
