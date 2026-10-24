import type { Language, NotificationType } from '@mediconnect/shared';

// Bildiriş şablonları (BR-1001-10, BR-904-07). Dəyişənlər: {doctorName} {patientName} {clinicName} {date} {time}
// {bookingReference} {code} {link} {reason} {expiresAt} {days}. Tibbi məlumat (diaqnoz, dərman) olmamalıdır.

type T = { title: string; body: string };
export const TEMPLATES: Record<NotificationType, Record<Language, T>> = {
  OTP_CODE: {
    az: { title: 'MediConnect', body: 'MediConnect təsdiq kodunuz: {code}. Kodu heç kimlə paylaşmayın.' },
    ru: { title: 'MediConnect', body: 'Ваш код подтверждения MediConnect: {code}. Никому его не сообщайте.' },
    en: { title: 'MediConnect', body: 'Your MediConnect verification code: {code}. Do not share it.' },
  },
  APPOINTMENT_CONFIRMED: {
    az: { title: 'Randevu təsdiqləndi', body: '{doctorName} ilə {date}, {time} randevunuz təsdiqləndi. Klinika: {clinicName}. Nömrə: {bookingReference}' },
    ru: { title: 'Запись подтверждена', body: 'Ваша запись к {doctorName} на {date}, {time} подтверждена. Клиника: {clinicName}. Номер: {bookingReference}' },
    en: { title: 'Appointment confirmed', body: 'Your appointment with {doctorName} on {date} at {time} is confirmed. Clinic: {clinicName}. Ref: {bookingReference}' },
  },
  APPOINTMENT_PENDING: {
    az: { title: 'Yeni randevu sorğusu', body: '{patientName} {date}, {time} üçün randevu istəyir. Təsdiqiniz gözlənilir.' },
    ru: { title: 'Новый запрос на запись', body: '{patientName} просит запись на {date}, {time}. Ожидается подтверждение.' },
    en: { title: 'New appointment request', body: '{patientName} requested {date} at {time}. Awaiting your confirmation.' },
  },
  APPOINTMENT_REQUESTED: {
    az: { title: 'Randevu sorğunuz göndərildi', body: '{doctorName} ilə {date}, {time} üçün sorğunuz həkimə göndərildi. Təsdiq gözlənilir. Nömrə: {bookingReference}' },
    ru: { title: 'Запрос на запись отправлен', body: 'Запрос к {doctorName} на {date}, {time} отправлен врачу. Ожидается подтверждение. Номер: {bookingReference}' },
    en: { title: 'Appointment request sent', body: 'Your request with {doctorName} for {date} at {time} was sent. Awaiting confirmation. Ref: {bookingReference}' },
  },
  NEW_APPOINTMENT: {
    az: { title: 'Yeni randevu', body: '{patientName} — {date}, {time} ({clinicName}).' },
    ru: { title: 'Новая запись', body: '{patientName} — {date}, {time} ({clinicName}).' },
    en: { title: 'New appointment', body: '{patientName} — {date} at {time} ({clinicName}).' },
  },
  RESCHEDULE_PROPOSED: {
    az: { title: 'Randevu vaxtının dəyişdirilməsi təklifi', body: '{doctorName} ilə randevunuzun {date}, {time} vaxtına köçürülməsi təklif olunur. Təsdiqləyin və ya imtina edin.' },
    ru: { title: 'Предложен перенос записи', body: 'Предлагается перенести запись к {doctorName} на {date}, {time}. Подтвердите или откажитесь.' },
    en: { title: 'Reschedule proposed', body: 'Your appointment with {doctorName} is proposed to move to {date} at {time}. Please accept or decline.' },
  },
  REMINDER_24H: {
    az: { title: 'Sabah randevunuz var', body: '{doctorName} ilə {date}, {time}. Ünvan: {clinicName}.' },
    ru: { title: 'Завтра у вас приём', body: '{doctorName}, {date}, {time}. Адрес: {clinicName}.' },
    en: { title: 'Appointment tomorrow', body: '{doctorName}, {date} at {time}. Clinic: {clinicName}.' },
  },
  REMINDER_2H: {
    az: { title: 'Randevuya 2 saat qalıb', body: '{doctorName} ilə {time} randevunuz var — {clinicName}.' },
    ru: { title: 'До приёма 2 часа', body: 'У вас приём у {doctorName} в {time} — {clinicName}.' },
    en: { title: '2 hours to your appointment', body: 'Appointment with {doctorName} at {time} — {clinicName}.' },
  },
  APPOINTMENT_CANCELLED: {
    az: { title: 'Randevu ləğv edildi', body: '{counterpart} ilə {date}, {time} tarixli randevu ləğv edildi. Səbəb: {reason}' },
    ru: { title: 'Запись отменена', body: 'Запись ({counterpart}) на {date}, {time} отменена. Причина: {reason}' },
    en: { title: 'Appointment cancelled', body: 'The appointment ({counterpart}) on {date} at {time} was cancelled. Reason: {reason}' },
  },
  APPOINTMENT_RESCHEDULED: {
    az: { title: 'Randevunun vaxtı dəyişdi', body: '{counterpart} ilə randevu {date}, {time} vaxtına keçirildi.' },
    ru: { title: 'Время записи изменено', body: 'Запись ({counterpart}) перенесена на {date}, {time}.' },
    en: { title: 'Appointment rescheduled', body: 'The appointment ({counterpart}) moved to {date} at {time}.' },
  },
  APPOINTMENT_REJECTED: {
    az: { title: 'Randevu təsdiqlənmədi', body: '{doctorName} {date}, {time} randevunu təsdiqləyə bilmədi. Səbəb: {reason}. Başqa vaxt seçə bilərsiniz.' },
    ru: { title: 'Запись не подтверждена', body: '{doctorName} не смог подтвердить запись на {date}, {time}. Причина: {reason}.' },
    en: { title: 'Appointment declined', body: '{doctorName} could not confirm {date} at {time}. Reason: {reason}.' },
  },
  PRESCRIPTION_CREATED: {
    az: { title: 'Yeni resept', body: '{doctorName} sizin üçün elektron resept yazdı. Reseptlərim bölməsində baxın.' },
    ru: { title: 'Новый рецепт', body: '{doctorName} выписал(а) вам электронный рецепт.' },
    en: { title: 'New prescription', body: '{doctorName} issued you an e-prescription.' },
  },
  PRESCRIPTION_CANCELLED: {
    az: { title: 'Resept ləğv edildi', body: '{doctorName} {prescriptionNumber} nömrəli resepti ləğv etdi. Səbəb: {reason}.' },
    ru: { title: 'Рецепт аннулирован', body: '{doctorName} аннулировал(а) рецепт {prescriptionNumber}. Причина: {reason}.' },
    en: { title: 'Prescription cancelled', body: '{doctorName} cancelled prescription {prescriptionNumber}. Reason: {reason}.' },
  },
  PRESCRIPTION_RENEWAL_REQUESTED: {
    az: { title: 'Təkrar resept sorğusu', body: '{patientName} {prescriptionNumber} nömrəli resept üçün təkrar resept istəyir.' },
    ru: { title: 'Запрос на повторный рецепт', body: '{patientName} просит повторить рецепт {prescriptionNumber}.' },
    en: { title: 'Renewal request', body: '{patientName} asks to renew prescription {prescriptionNumber}.' },
  },
  PRESCRIPTION_RENEWAL_REJECTED: {
    az: { title: 'Təkrar resept sorğusu', body: '{doctorName} təkrar resept sorğunuzu təsdiqləmədi. Səbəb: {reason}.' },
    ru: { title: 'Запрос на повторный рецепт', body: '{doctorName} отклонил(а) запрос. Причина: {reason}.' },
    en: { title: 'Renewal request', body: '{doctorName} declined your renewal request. Reason: {reason}.' },
  },
  DOCUMENT_SHARED: {
    az: { title: 'Sənəd paylaşıldı', body: '{patientName} sizinlə tibbi sənəd paylaşdı. Giriş {expiresAt} tarixinədək açıqdır.' },
    ru: { title: 'Документ открыт', body: '{patientName} открыл(а) вам медицинский документ до {expiresAt}.' },
    en: { title: 'Document shared', body: '{patientName} shared a medical document with you until {expiresAt}.' },
  },
  REVIEW_INVITE: {
    az: { title: 'Qəbul necə keçdi?', body: '{doctorName} ilə qəbulunuzu qiymətləndirin — rəyiniz digər pasientlərə kömək edir.' },
    ru: { title: 'Как прошёл приём?', body: 'Оцените приём у {doctorName} — ваш отзыв поможет другим.' },
    en: { title: 'How was your visit?', body: 'Rate your visit with {doctorName} — it helps other patients.' },
  },
  REVIEW_MODERATED: {
    az: { title: 'Rəyiniz haqqında', body: '{doctorName} haqqında rəyiniz {status}. {reason}' },
    ru: { title: 'О вашем отзыве', body: 'Ваш отзыв о {doctorName}: {status}. {reason}' },
    en: { title: 'About your review', body: 'Your review of {doctorName}: {status}. {reason}' },
  },
  REVIEW_REPLY_MODERATED: {
    az: { title: 'Rəyə cavabınız', body: 'Pasient rəyinə cavabınız {status}. {reason}' },
    ru: { title: 'Ваш ответ на отзыв', body: 'Ваш ответ на отзыв: {status}. {reason}' },
    en: { title: 'Your reply to a review', body: 'Your reply to a review: {status}. {reason}' },
  },
  REVIEW_PUBLISHED: {
    az: { title: 'Yeni rəy dərc olundu', body: 'Profilinizdə yeni pasient rəyi dərc olundu.' },
    ru: { title: 'Опубликован новый отзыв', body: 'В вашем профиле опубликован новый отзыв.' },
    en: { title: 'New review published', body: 'A new patient review was published on your profile.' },
  },
  DOCTOR_INVITE: {
    az: { title: 'MediConnect dəvəti', body: '{clinicName} sizi MediConnect platformasına həkim kimi dəvət edir: {link} (7 gün etibarlıdır)' },
    ru: { title: 'Приглашение MediConnect', body: '{clinicName} приглашает вас в MediConnect как врача: {link} (7 дней)' },
    en: { title: 'MediConnect invitation', body: '{clinicName} invites you to MediConnect as a doctor: {link} (valid 7 days)' },
  },
  DOCTOR_INVITE_ACCEPTED: {
    az: { title: 'Həkim dəvəti qəbul etdi', body: '{doctorName} {clinicName} dəvətini qəbul etdi və şəxsiyyətini SİMA ilə təsdiqlədi.' },
    ru: { title: 'Врач принял приглашение', body: '{doctorName} принял(а) приглашение в {clinicName}.' },
    en: { title: 'Doctor accepted the invite', body: '{doctorName} accepted the invitation to {clinicName}.' },
  },
  DOCTOR_INVITE_DECLINED: {
    az: { title: 'Həkim dəvəti rədd etdi', body: '{doctorName} {clinicName} dəvətini rədd etdi.' },
    ru: { title: 'Врач отклонил приглашение', body: '{doctorName} отклонил(а) приглашение в {clinicName}.' },
    en: { title: 'Doctor declined the invite', body: '{doctorName} declined the invitation to {clinicName}.' },
  },
  CLINIC_DOCTOR_STATUS_CHANGED: {
    az: { title: 'Klinikada statusunuz dəyişdi', body: '{clinicName}: {status}. {reason}' },
    ru: { title: 'Ваш статус в клинике изменён', body: '{clinicName}: {status}. {reason}' },
    en: { title: 'Your clinic status changed', body: '{clinicName}: {status}. {reason}' },
  },
  CLINIC_STATUS_CHANGED: {
    az: { title: 'Klinikanın statusu dəyişdi', body: '{clinicName}: {status}. {reason}' },
    ru: { title: 'Статус клиники изменён', body: '{clinicName}: {status}. {reason}' },
    en: { title: 'Clinic status changed', body: '{clinicName}: {status}. {reason}' },
  },
  CLINIC_ADMIN_INVITE: {
    az: { title: 'MediConnect dəvəti', body: '{clinicName} üçün administrator hesabınız yaradıldı. Aktivləşdirin: {link}' },
    ru: { title: 'Приглашение MediConnect', body: 'Для {clinicName} создан аккаунт администратора. Активируйте: {link}' },
    en: { title: 'MediConnect invitation', body: 'An administrator account for {clinicName} was created. Activate: {link}' },
  },
  SCHEDULE_CHANGED: {
    az: { title: 'Cədvəliniz dəyişdirildi', body: '{clinicName} üzrə cədvəliniz administrator tərəfindən dəyişdirildi.' },
    ru: { title: 'Ваше расписание изменено', body: 'Администратор изменил ваше расписание в {clinicName}.' },
    en: { title: 'Your schedule was changed', body: 'An administrator changed your schedule at {clinicName}.' },
  },
  LICENSE_EXPIRY_WARNING: {
    az: { title: 'Lisenziya müddəti bitir', body: '{doctorName}: lisenziyanın bitməsinə {days} gün qalıb ({expiresAt}). Vaxtında yeniləyin.' },
    ru: { title: 'Срок лицензии истекает', body: 'До окончания лицензии {days} дн. ({expiresAt}).' },
    en: { title: 'License expiring', body: 'The license expires in {days} days ({expiresAt}).' },
  },
  SECURITY_NEW_DEVICE: {
    az: { title: 'Yeni cihazdan giriş', body: 'Hesabınıza yeni cihazdan daxil olundu. Siz deyilsinizsə, PIN-i dərhal dəyişin.' },
    ru: { title: 'Вход с нового устройства', body: 'В ваш аккаунт вошли с нового устройства. Если это не вы — смените PIN.' },
    en: { title: 'New device sign-in', body: 'Your account was accessed from a new device. If this was not you, change your PIN.' },
  },
  ACCOUNT_STATUS_CHANGED: {
    az: { title: 'Hesab statusu dəyişdi', body: 'Hesabınızın statusu dəyişdirildi: {status}.' },
    ru: { title: 'Статус аккаунта изменён', body: 'Статус вашего аккаунта: {status}.' },
    en: { title: 'Account status changed', body: 'Your account status is now: {status}.' },
  },
  NO_SHOW_RECORDED: {
    az: { title: 'Qəbula gəlmədiniz', body: '{date}, {time} randevusu "gəlmədi" kimi qeyd olundu. Ləğv etmək lazım olanda öncədən bildirin.' },
    ru: { title: 'Вы не пришли на приём', body: 'Запись на {date}, {time} отмечена как неявка.' },
    en: { title: 'Missed appointment', body: 'The appointment on {date} at {time} was recorded as a no-show.' },
  },
  PIN_CHANGED: {
    az: { title: 'PIN dəyişdirildi', body: 'MediConnect PIN kodunuz dəyişdirildi. Bu siz deyilsinizsə, dəstəyə müraciət edin.' },
    ru: { title: 'PIN изменён', body: 'Ваш PIN MediConnect изменён. Если это не вы — обратитесь в поддержку.' },
    en: { title: 'PIN changed', body: 'Your MediConnect PIN was changed. If this was not you, contact support.' },
  },
  DOCTOR_PROFILE_COMPLETED: {
    az: { title: 'Həkim profilini tamamladı', body: '{doctorName} profilini tamamladı və axtarışda görünür. İndi cədvəlini qura bilər.' },
    ru: { title: 'Врач заполнил профиль', body: '{doctorName} заполнил(а) профиль и виден(а) в поиске.' },
    en: { title: 'Doctor completed profile', body: '{doctorName} completed the profile and is now visible in search.' },
  },
  REGISTRATION_COMPLETED: {
    az: { title: 'Xoş gəldiniz!', body: 'MediConnect qeydiyyatınız tamamlandı. İndi həkim tapıb randevu ala bilərsiniz.' },
    ru: { title: 'Добро пожаловать!', body: 'Регистрация в MediConnect завершена.' },
    en: { title: 'Welcome!', body: 'Your MediConnect registration is complete.' },
  },
};
