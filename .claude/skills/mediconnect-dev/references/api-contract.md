# API müqaviləsi

Base: `https://api.mediconnect.az/v1` (lokal mock: `http://localhost:4000/v1`). REST + JSON. Auth: `Authorization: Bearer {token}`. Dil: `Accept-Language: az|ru|en` (default `az`) — `message` bu dildə qaytarılır.

## Cavab zərfi

```jsonc
// uğur
{ "status": "SUCCESS", "message": "Randevu uğurla yaradıldı", "data": { ... } }
// siyahı (səhifələnmiş)
{ "status": "SUCCESS", "data": { "totalCount": 47, "page": 1, "size": 20, "<items>": [ ... ] } }
// xəta
{ "status": "ERROR", "errorType": "SlotUnavailable", "message": "Bu vaxt artıq doludur", "timestamp": "2026-09-14T10:35:12Z",
  "details": { "fields": { "mobileNumber": "..." } } }   // details opsional: validasiya sahələri, konflikt siyahısı, qalan cəhd
```
Mock server hər cavaba `X-Server-Time` header-i qoyur — client geri sayımları server saatına (dev time travel daxil) uyğunlaşdırır.

Sahələr camelCase, enum-lar UPPER_SNAKE, ID-lər UUID v4, vaxt ISO 8601 UTC (`...Z`), tarix `YYYY-MM-DD`, saat `HH:mm` (Bakı vaxtı).

## Xəta kataloqu (`errorType`)

Ümumi: 400 `ValidationError` · 401 `Unauthorized` · 403 `Forbidden` · 404 `NotFound` · 409 `Conflict` · 422 `BusinessRuleViolation` · 429 `TooManyRequests` · 500 `ServerError` · 503 `ServiceUnavailable` (SİMA/SMS/imza servisi işləmir).

Biznes xətaları:

| HTTP | errorType | UC |
|---|---|---|
| 409 | DuplicateAccount | 101 |
| 422 | InvalidOtp | 101/103 |
| 429 | OtpResendTooSoon *(əlavə)* | 101 |
| 422 | SimaVerificationFailed | 101/103 |
| 409 | SimaSessionExpired *(əlavə)* | 101 |
| 422 | WeakPin | 101/103 |
| 422 | PinMismatch *(əlavə)* | 101 |
| 422 | PinSameAsOld *(əlavə)* | 103 |
| 422 | FinMismatch *(əlavə)* | 103 |
| 404 | AccountNotFound *(əlavə)* | 102/103 |
| 401 | InvalidPin *(əlavə; details.remainingAttempts)* | 102 |
| 429 | AccountLocked | 102 |
| 403 | AccountBlocked *(əlavə)* | 102 |
| 403 | ConsentRequired *(əlavə)* | 104/501 |
| 409 | SlotUnavailable | 401/403 |
| 409 | SlotLockExpired | 401/403 |
| 422 | BookingTooSoon *(əlavə)* | 401 |
| 422 | DuplicateAppointment | 401 |
| 422 | NoShowLimitExceeded | 401 |
| 422 | ClinicNotAccepting *(əlavə)* | 401 |
| 422 | CancellationTooLate | 402 |
| 422 | InvalidStatusTransition *(əlavə)* | 402–405 |
| 422 | RescheduleLimitExceeded | 403 |
| 422 | RescheduleTooLate *(əlavə)* | 403 |
| 422 | AppointmentNotStarted *(əlavə)* | 405 |
| 413 | FileTooLarge | 501 |
| 415 | UnsupportedFileType | 501 |
| 422 | MalwareDetected | 501 |
| 403 | NoAppointmentWithDoctor *(əlavə)* | 502 |
| 409 | GrantAlreadyExists *(əlavə; details.grant)* | 502 |
| 403 | AccessGrantExpired | 503 |
| 403 | DownloadNotAllowed | 503 |
| 403 | LicenseInvalid | 601 |
| 403 | SignatureCertificateInvalid *(əlavə)* | 601 |
| 422 | AllergyConflict | 601 |
| 422 | DrugInteraction | 601 |
| 422 | ControlledDrugJustificationRequired *(əlavə)* | 601 |
| 422 | PrescriptionNotSigned | 601 |
| 422 | PrescriptionNotEditable *(əlavə)* | 601 |
| 409 | ScheduleConflict *(details.appointments)* | 702/803 |
| 422 | ScheduleOverlap *(əlavə)* | 702 |
| 422 | ScheduleOutsideClinicHours *(əlavə)* | 702 |
| 409 | DoctorBusyInOtherClinic *(əlavə)* | 702 |
| 409 | DuplicateLicense | 802 |
| 409 | DoctorAlreadyInClinic *(əlavə)* | 802 |
| 410 | InviteExpired *(əlavə)* | 802/901 |
| 409 | HasActiveAppointments *(əlavə; details.count)* | 802/804/901/902 |
| 409 | DuplicateRegistrationNumber *(əlavə)* | 901 |
| 422 | LicenseExpired *(əlavə)* | 802/901 |
| 422 | ReasonRequired *(əlavə)* | 9xx |
| 422 | CannotModifySelf *(əlavə)* | 902 |
| 422 | ReviewNotEligible | 1101 |
| 409 | DuplicateReview | 1101 |
| 422 | ReviewWindowClosed *(əlavə)* | 1101 |
| 422 | ReviewEditWindowClosed *(əlavə)* | 1101 |

Bütün mesajlar `mock-server/src/core/messages.ts`-də `errorType → {az, ru, en}` kimi saxlanır.

## Enum-lar

- `appointmentStatus`: PENDING, CONFIRMED, COMPLETED, CANCELLED, NO_SHOW
- `slotStatus`: AVAILABLE, SOFT_LOCKED, BOOKED, BLOCKED
- `prescriptionStatus`: DRAFT, SIGNED, EXPIRED, CANCELLED, DISPENSED
- `documentCategory`: LAB_RESULT, IMAGING, EPICRISIS, PRESCRIPTION, OTHER
- `grantStatus`: ACTIVE, EXPIRED, REVOKED · `accessDuration`: TWENTY_FOUR_HOURS, SEVEN_DAYS, THIRTY_DAYS, APPOINTMENT_PERIOD
- `userRole`: PATIENT, DOCTOR, CLINIC_ADMIN, SUPER_ADMIN
- `userStatus`: PENDING_VERIFICATION, VERIFIED, SUSPENDED, BLOCKED, DELETED
- `reviewStatus`: PENDING_MODERATION, PUBLISHED, REJECTED, REPORTED, WITHDRAWN
- `notificationChannel`: SMS, PUSH, EMAIL, IN_APP · `deliveryStatus`: QUEUED, SENT, DELIVERED, FAILED
- `clinicStatus`: PENDING_VERIFICATION, ACTIVE, SUSPENDED, INACTIVE · `doctorClinicStatus`: INVITED, ACTIVE, INACTIVE, REMOVED
- `clinicType`: POLYCLINIC, HOSPITAL, DIAGNOSTIC_CENTER, DENTAL, LABORATORY
- `gender`: MALE, FEMALE · `approvalMode`: AUTO, MANUAL
- `severity` (allergiya): MILD, MODERATE, SEVERE · (qarşılıqlı təsir): MINOR, MODERATE, SEVERE
- `exceptionType`: VACATION, DAY_OFF, EXTRA_HOURS, HOLIDAY
- `otpPurpose`: REGISTRATION, PIN_RESET, PHONE_CHANGE · `simaPurpose`: REGISTRATION, PIN_RESET, DOCTOR_ONBOARDING (+ CLINIC_ADMIN_ONBOARDING əlavə)
- `availability`: TODAY, TOMORROW, THIS_WEEK · `sortBy` (həkim): RATING, EXPERIENCE, EARLIEST_SLOT · (klinika): RATING, DOCTOR_COUNT, DISTANCE

## Request parametrləri (spec-dən)

**Qeydiyyat:** `mobileNumber` (`^\+994\d{9}$`), `pin` = FIN (`^[A-Z0-9]{7}$`, böyük hərfə çevir), `otpCode` (`^\d{6}$`), `userPin` (`^\d{4}$`, zəif deyil), `userPinConfirm` (= userPin), `medicalConsent` (true). `firstName`, `lastName`, `birthDate`, `gender` SİMA-dan gəlir, client göndərmir.

**Randevu:** `doctorId`, `clinicId` (həkimə bağlı), `serviceId` (həmin klinikada həkimə bağlı), `slotId` (SOFT_LOCKED + lock sahibi cari istifadəçi), `patientNote?` (≤500), `documentIds?` (≤10, pasientə məxsus).

**Həkim axtarışı:** `query?` (2–100), `specialtyIds[]`, `cityIds[]`, `clinicIds[]`, `minRating` (0–5), `gender`, `languageCodes[]` (ISO 639-1), `minExperience` (0–60), `availability`, `academicDegrees[]`, `sortBy`, `page` (≥1, default 1), `size` (≤20, default 20). Array-lər query-də vergüllə: `?specialtyIds=a,b`.

## Endpoint-lər

✱ = spec-in "Endpoint xülasəsi"ndə var. Qalanları əlavədir, amma eyni konvensiyaya tabedir. Yeni endpoint əlavə edəndə bu siyahını yenilə.
Rol: G=Guest, P=Patient, D=Doctor, CA=Clinic Admin, SA=Super Admin.

### Auth (UC-101..103)
| Method | Path | Rol | Qeyd |
|---|---|---|---|
| POST | ✱ /auth/register/initiate | G | `{mobileNumber, pin, returnUrl?}` → `{registrationId, otpExpiresAt, resendAvailableAt}`; dublikatı yoxlayır, OTP göndərir |
| POST | /auth/otp/resend | G | `{registrationId \| resetId}` |
| POST | ✱ /auth/otp/verify | G | `{registrationId \| resetId, otpCode}` |
| POST | ✱ /auth/sima/session | G | `{registrationId \| resetId \| inviteToken}` → `{simaSessionId, qrToken, qrPayload, expiresAt}` |
| GET | /auth/sima/session/{id} | G | polling: `{sessionStatus, profile?}` (SUCCESS olanda SİMA sahələri) |
| POST | ✱ /auth/sima/callback | (SİMA) | `X-Sima-Signature` HMAC; mock-da dev simulyatoru çağırır |
| POST | ✱ /auth/register/complete | G | `{simaSessionId, userPin, userPinConfirm, medicalConsent, consentVersion, biometricEnabled?}` → `{token, user, returnUrl}` |
| POST | /auth/login/lookup | G | `{mobileNumber}` → `{exists, status, biometricAvailable}` (EF-102-1/3) |
| POST | ✱ /auth/login | G | `{mobileNumber, userPin \| deviceToken}` → `{token, user, redirectTo}` |
| POST | /auth/logout | auth | |
| POST | /auth/pin/reset/initiate | G | `{mobileNumber}` → `{resetId}` + OTP |
| POST | ✱ /auth/pin/reset | G | `{resetId, simaSessionId, newPin, newPinConfirm}` |
| GET | /auth/sessions · DELETE /auth/sessions/{id} | auth | aktiv sessiyalar |
| GET | /auth/me | auth | cari istifadəçi + rol konteksti (clinicId-lər) |

### Profil (UC-104)
| Method | Path | Rol | Qeyd |
|---|---|---|---|
| GET/PATCH | ✱ /profile | P | SİMA sahələrini PATCH etmək → 400 |
| POST | /profile/phone-change/initiate · /profile/phone-change/confirm | P | OTP ilə |
| GET/POST/DELETE | /profile/allergies[/{id}] | P | |
| GET/POST/DELETE | /profile/chronic-conditions[/{id}] | P | |
| PATCH | /profile/medications | P | daimi dərmanlar |
| PUT | /profile/consent | P | `{medicalConsent, consentVersion}` |
| GET/PUT | /profile/notification-preferences | auth | məcburi növlər dəyişmir |
| PATCH | /profile/pin | auth | `{currentPin, newPin, newPinConfirm}` |
| PATCH | /profile/settings | auth | `{preferredLanguage, biometricEnabled}` |
| DELETE | /profile | P | silinmə **tələbi** (F11); aktiv randevu varsa 409 HasActiveAppointments |
| POST | /profile/deletion/cancel | P | tələbi geri götürmək |

### Kataloq və axtarış (UC-201, 202, 301, 302)
| Method | Path | Rol | Qeyd |
|---|---|---|---|
| GET | /specialties · /cities · /languages · /services · /insurances | G | |
| GET | ✱ /doctors | G | axtarış (+ `date` əlavə parametri); cavabda əlavə `facets` (filtr sayları) və `suggestions` (EF-201-1); item: `{doctorId, fullName, photoUrl, specialties[], clinics[], rating, reviewCount, experienceYears, gender, languages[], earliestSlot, isNew}` |
| GET | /doctors/autocomplete?query= | G | ad, ixtisas |
| GET | ✱ /doctors/{doctorId} | G | tam profil + klinikalar + klinika üzrə xidmətlər; deaktivdirsə 404/410 + `similarDoctors` |
| GET | ✱ /doctors/{doctorId}/slots?clinicId&serviceId&from&to | G | gün üzrə qruplaşdırılmış AVAILABLE slotlar; xidmət müddəti nəzərə alınır |
| GET | /doctors/{doctorId}/reviews?page&sort | G | `distribution`, alt reytinqlər |
| GET | ✱ /clinics | G | axtarış |
| GET | ✱ /clinics/{clinicId} | G | |
| GET | /clinics/{clinicId}/services · /clinics/{clinicId}/doctors?specialtyId · /clinics/{clinicId}/reviews | G | |
| GET | /clinics/autocomplete?query= | G | klinika adı |

Klinika axtarışı parametrləri (əlavə, spec yalnız həkim axtarışını təsvir edir): `query`, `cityIds[]`, `clinicTypes[]`, `specialtyIds[]`, `serviceIds[]`, `workModes[]` (TWENTY_FOUR_SEVEN, WEEKEND, EVENING), `minRating`, `insurances[]`, `sortBy`, `lat`/`lng` (DISTANCE üçün), `page`, `size`.

Slotlar: `GET /doctors/{id}/slots?clinicId&serviceId&from&days(≤60, default 7)` → `{days:[{date, slots:[{slotId, startTime, endTime, startAt, available}]}], durationMinutes, acceptingAppointments, nextAvailableDate}`; `available` xidmət müddətinə görə ardıcıl boş slotları və 1 saat qaydasını nəzərə alır.

### Randevu (UC-401..405)
| Method | Path | Rol | Qeyd |
|---|---|---|---|
| POST | ✱ /slots/{slotId}/lock | P | body `{serviceId?}` → `{slotId, slotIds, lockedUntil}`; uzun xidmətdə zəncir tutulur; əvvəlki lock buraxılır |
| DELETE | /slots/{slotId}/lock | P | |
| POST | ✱ /appointments | P | 201 (nümunə spec-də) |
| GET | ✱ /appointments?tab=UPCOMING\|PAST\|CANCELLED | P | |
| GET | ✱ /appointments/{id} | P/D/CA | rola görə serializer; `allowedActions[]` qaytarır |
| PATCH | ✱ /appointments/{id}/cancel | P/D/CA | `{reason}` |
| PATCH | ✱ /appointments/{id}/reschedule | P/D/CA | `{newSlotId}`; D/CA üçün pending (F4) |
| PATCH | /appointments/{id}/reschedule/respond | P | `{accept: boolean}` |
| PATCH | /appointments/{id}/confirm · /reject | D | reject `{reason}` |
| PATCH | ✱ /appointments/{id}/complete | D | `{doctorNote?}` |
| PATCH | /appointments/{id}/no-show · /no-show/revert | D/CA | revert ≤24h, CA |
| POST | /appointments/{id}/documents | P | `{documentIds}` → avtomatik grant-lar |
| GET | /appointments/{id}/calendar.ics | P | "Təqvimə əlavə et" |

### Sənədlər (UC-501..504)
| Method | Path | Rol | Qeyd |
|---|---|---|---|
| POST | ✱ /documents | P | multipart: `file`, `category`, `documentDate`, `description?` |
| GET | ✱ /documents?category&archived&q&sort | P | |
| PATCH | /documents/{id} | P | metadata, `isArchived` |
| DELETE | /documents/{id} | P | soft delete (30 gün) |
| GET | /documents/{id}/eligible-doctors | P | yalnız randevusu olan həkimlər |
| POST | ✱ /documents/{id}/grants | P | `{doctorId, accessDuration}` → 201 |
| GET | /grants?status | P | aktiv paylaşımlar, `viewCount`, qalan vaxt |
| PATCH | /grants/{grantId} | P | `{accessDuration}` uzatma |
| DELETE | ✱ /grants/{grantId} | P | REVOKED |
| GET | /documents/{id}/access-log | P | kim, nə vaxt baxıb |
| GET | ✱ /documents/{id}/view | P/D | → `{url, expiresAt}` signed URL (D: aktiv grant tələb olunur) |
| GET | /files/{signedToken} | (signed) | birdəfəlik, deşifrə edilmiş axın; `Content-Disposition: inline`; D üçün download headeri yoxdur |
| GET | ✱ /medical-history?type&from&to&doctorId&clinicId | P | |
| GET | /medical-history/export | P | PDF |
| GET | /doctor/patients/{patientId}/documents · /doctor/patients/{patientId}/medical-history | D | yalnız icazəlilər |

### Resept (UC-601, 602)
| Method | Path | Rol | Qeyd |
|---|---|---|---|
| POST | ✱ /prescriptions | D | DRAFT yaradır `{appointmentId}` |
| GET | /prescriptions/{id}/context | D | pasient məlumatı, allergiyalar, xroniki xəstəliklər, aktiv dərmanlar |
| PATCH | /prescriptions/{id} | D | yalnız DRAFT: diaqnoz, icd10, dərmanlar, tövsiyələr, `validDays` |
| POST | /prescriptions/{id}/check | D | → `{warnings:[{type: ALLERGY\|INTERACTION\|CONTROLLED\|MANUAL_DRUG\|AGE, severity, message, medicationIndex, requiresOverride}], missingFields}` |
| POST | ✱ /prescriptions/{id}/sign | D | `{confirmationPin, overrides:[{medicationIndex, reason}], controlledJustification?}` |
| PATCH | /prescriptions/{id}/cancel | D | `{reason}` |
| GET | ✱ /prescriptions?tab=ACTIVE\|PAST\|CANCELLED\|DRAFT&patientId | P/D | P yalnız imzalanmışları görür (DRAFT tabı yalnız D) |
| GET | /prescriptions/{id} · /prescriptions/{id}/pdf | P/D | |
| POST | /prescriptions/{id}/renewal-requests | P | `{note?}`; PENDING varsa 409 |
| GET | /renewal-requests?status | D | *(əlavə)* həkimin sorğuları |
| PATCH | /renewal-requests/{id} | D | `{decision: APPROVE\|REJECT, reason?}` (REJECT-də səbəb məcburi); APPROVE → yeni DRAFT, cavabda `newPrescriptionId` |
| GET | /prescriptions/verify/{qrToken} | G | aptek doğrulaması: nömrə, status, etibarlılıq (tibbi detal yoxdur) |
| GET/POST | /doctor/prescription-templates · DELETE /doctor/prescription-templates/{id} | D | |
| POST | /prescriptions `{appointmentId, templateId?, copyFromPrescriptionId?}` | D | şablon / təkrar (alt 1, 2); şablonsuz çağırış mövcud qaralamanı qaytarır |
| GET | /drugs?query= · /drugs/{id} | D · P/D | `/drugs/{id}` — ümumi məlumat (FR-602-12) |

### Həkim paneli (UC-701..703)
| Method | Path | Rol | Qeyd |
|---|---|---|---|
| GET | /doctor/dashboard | D | günün icmalı, növbəti qəbul, gözləyənlərin sayı, lisenziya günləri |
| GET/PATCH | /doctor/profile | D | lisenziya, klinika, ixtisas, qiymət sahələri göndərilsə 400 (EF-701-2/3/5); cavabda `profileCompleted`, `missingFields` |
| GET | /doctor/schedule?clinicId&from&to | D | şablon + slotlar + istisnalar |
| PUT | ✱ /doctor/schedule | D | `{clinicId, days:[{dayOfWeek,startTime,endTime,slotDurationMinutes,bufferMinutes,breaks[]}], dryRun?, conflictResolution?: CANCEL_AND_NOTIFY}`; dryRun konfliktləri qaytarır |
| POST/DELETE | /doctor/schedule/exceptions[/{id}] | D | `{clinicId, exceptionType: DAY_OFF|VACATION|EXTRA_HOURS, startDate, endDate, startTime?, endTime?, reason?, conflictResolution?}`; DELETE `?clinicId=` |
| PATCH | /slots/{slotId}/block · /unblock | D/CA | `{reason?, doctorId?}`; BOOKED slot → 409 ScheduleConflict |
| GET | /doctor/appointments?tab=TODAY\|UPCOMING\|PENDING\|PAST&clinicId&from&to&status | D | |

### Klinika admin (UC-801..805)
| Method | Path | Rol | Qeyd |
|---|---|---|---|
| GET/PATCH | /clinic-admin/profile | CA | SA sahələri read-only |
| PUT | /clinic-admin/working-hours | CA | konflikt xəbərdarlığı |
| POST/DELETE | /clinic-admin/holidays[/{id}] | CA | |
| PATCH | /clinic-admin/accepting | CA | F7 |
| POST/DELETE/PATCH | /clinic-admin/photos[/{id}] · /photos/order | CA | |
| GET | /clinic-admin/doctors | CA | |
| POST | /clinic-admin/doctors/lookup | CA | `{fin}` → mövcud həkim/istifadəçi |
| POST | ✱ /clinic-admin/doctors | CA | dəvət; sənədlər JSON-da `documents:[{kind, fileName, dataUrl}]` (mock) |
| GET/PATCH | /clinic-admin/doctors/{doctorId} | CA | status ACTIVE/INACTIVE, lisenziya yeniləmə, xidmətlər, kabinet |
| POST | /clinic-admin/doctors/{doctorId}/resend-invite | CA | |
| DELETE | /clinic-admin/doctors/{doctorId} | CA | `{reason, conflictResolution?}` |
| GET/PUT | /clinic-admin/doctors/{doctorId}/schedule | CA | PUT /doctor/schedule ilə eyni body |
| POST | /clinic-admin/doctors/{doctorId}/close-day | CA | `{date, reason, decisions:[{appointmentId, action: CANCEL\|TRANSFER, targetSlotId?}]}` — TRANSFER pasientə köçürmə təklifidir (BR-803-06) |
| GET/POST/PATCH/DELETE | /clinic-admin/services[/{id}] | CA | |
| POST | /clinic-admin/service-requests | CA | kataloqa əlavə tələbi |
| GET | /clinic-admin/appointments?from&to&doctorId&status&serviceId | CA | tibbi sahə YOX |
| POST | /clinic-admin/appointments/bulk-cancel | CA | `{appointmentIds, reason}` |
| GET | /clinic-admin/reports/{daily\|doctors\|no-show\|load}?from&to | CA | |
| GET | /clinic-admin/reports/{type}/export?from&to&format=csv\|pdf | CA | mock: xlsx əvəzinə CSV (UTF-8 BOM, `;`) |
| GET | /invites/{token} · POST /invites/{token}/sima · /accept · /decline | G | həkim dəvəti: `/sima` → SİMA sessiyası (DOCTOR_ONBOARDING), `/accept` `{simaSessionId?, userPin, userPinConfirm?}` → AuthResult; mövcud həkim yalnız PIN ilə |
| GET | /clinic-admin/dashboard | CA | *(əlavə)* bugünkü icmal, həkim statusları, lisenziya xəbərdarlıqları, gözləyən dəvətlər |
| GET | /clinic-admin/doctors/{doctorId}/close-day?date | CA | *(əlavə)* təsirlənən randevular + köçürmə variantları (eyni ixtisas, eyni xidmət, boş slot) |
| POST/DELETE | /clinic-admin/doctors/{doctorId}/schedule/exceptions[/{id}] | CA | *(əlavə)* həkim paneli ilə eyni body (clinicId-siz) |

### Super admin (UC-901..904)
| Method | Path | Rol | Qeyd |
|---|---|---|---|
| GET | /admin/stats | SA | platforma statistikası, gözləyən işlər, sistem sağlamlığı |
| GET | /admin/clinics?status&q | SA | |
| POST | /admin/clinics/license-check | SA | *(əlavə)* `{licenseNumber}` → Nazirlik reyestri mock-u (F30) |
| POST | /admin/clinics/{id}/documents · GET /admin/clinics/{id}/documents/{docId} | SA | *(əlavə)* sənəd əlavə et / bax (audit olunur) |
| POST | /admin/clinics/{id}/license | SA | *(əlavə)* `{licenseExpiryDate, document}` alt 6 |
| POST | /admin/clinics/{id}/admins/{userId}/resend-invite | SA | *(əlavə)* |
| GET/PATCH | /admin/settings/{key}/history | SA | *(əlavə)* dəyişiklik tarixçəsi |
| GET/PATCH | /admin/service-requests[/{id}] | SA | *(əlavə)* klinika tələbləri `{decision}` |
| POST | ✱ /admin/clinics | SA | JSON: məlumat + `documents:[{kind, fileName, dataUrl}]` + `admin{fin, mobileNumber, firstName, lastName}` + `verify` |
| GET/PATCH | /admin/clinics/{id} | SA | PATCH `{action: VERIFY\|REQUEST_DOCUMENTS\|REJECT\|SUSPEND\|REACTIVATE\|DEACTIVATE, reason, conflictResolution?}` |
| POST | /admin/clinics/{id}/admins | SA | əlavə admin |
| GET | /admin/users?role&status&clinicId&q | SA | q: FIN/telefon/ad |
| GET | /admin/users/{id} | SA | metadata + sessiyalar + audit |
| PATCH | /admin/users/{id}/status | SA | `{status: BLOCKED\|VERIFIED, reason, conflictResolution?, confirm?}` (confirm — yeganə admin) |
| DELETE | /admin/users/{id}/sessions | SA | `{reason}` |
| DELETE | /admin/users/{id} | SA | anonimləşdirmə |
| GET | /admin/moderation/reviews?queue=PENDING\|REPORTED\|REPLIES\|REJECTED\|PUBLISHED | SA | PENDING redaktəsi gözləyən dərc olunmuşları da daxil edir |
| PATCH | /admin/reviews/{id}/moderate | SA | `{decision: APPROVE\|REJECT\|WITHDRAW\|DISMISS_REPORT, reason?, redactedComment?}` — REJECT/WITHDRAW səbəb tələb edir |
| POST | /admin/reviews/bulk-approve | SA | yalnız `filterFlags` boş olanlar |
| GET/PUT | /admin/moderation/filter-rules | SA | |
| GET | /admin/settings · PATCH /admin/settings/{key} | SA | `{value, confirm?}` kritik üçün |
| CRUD | /admin/specialties · /admin/services · /admin/drugs · /admin/drug-interactions · /admin/notification-templates · /admin/cities | SA | |
| GET | /admin/audit-logs?userId&action&entityType&from&to · /export | SA | read-only; PATCH/DELETE → 405 + təhlükəsizlik hadisəsi |
| GET | /admin/security-events · /admin/stats | SA | |

### Bildiriş və rəy (UC-1001, 1101)
| Method | Path | Rol | Qeyd |
|---|---|---|---|
| GET | ✱ /notifications?page · /notifications/unread-count | auth | |
| PATCH | /notifications/{id}/read · POST /notifications/read-all · DELETE /notifications/{id} | auth | |
| POST | ✱ /reviews | P | `{appointmentId, overallRating, professionalismRating?, attitudeRating?, waitingTimeRating?, comment?, isAnonymous}` |
| PATCH | /reviews/{id} | P | ≤24h |
| GET | /reviews/eligibility/{appointmentId} | P | → `{eligible, reason, message, existing}` |
| POST | /reviews/{id}/report | P/D | `{reason}` → REPORTED (D yalnız öz rəyini) |
| POST | /reviews/{id}/reply | D | `{replyText}` → cavab PENDING_MODERATION |
| GET | /doctor/reviews | D | *(əlavə)* həkimin rəyləri, cavab/şikayət statusu |
| PATCH | /admin/review-replies/{id}/moderate | SA | *(əlavə)* `{decision: APPROVE\|REJECT, reason?}` |
| POST | /reviews/{id}/replies | D | |
| POST | /reviews/{id}/reports | D/P | `{reason}` |

### Dev (yalnız mock, `/__dev`, auth yoxdur) — `mock-backend.md`-ə bax
