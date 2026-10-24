# Data model (mock store = `mediconnect_db` güzgüsü)

Spec PostgreSQL sxemini təsvir edir (`spec-full.md` → "Database ümumi məlumatı" və cədvəl bölmələri, tam sahə siyahısı oradadır). Mock store eyni cədvəlləri **eyni adlı kolleksiyalar** kimi saxlayır (`db.users`, `db.appointment_slots`, ...). Sahə adları camelCase-dir (`user_id` → `userId`). Beləliklə sonra real DB-yə keçid mexaniki olur.

Ümumi: PK UUID v4 (`crypto.randomUUID()`); `createdAt` və `updatedAt` ISO string; soft delete `deletedAt`; tibbi fayllar store-da deyil, `data/storage/`-da şifrələnmiş saxlanır (store-da yalnız metadata və `encryptionKeyId` olur).

## Kolleksiyalar və açar constraint-lər

| # | Kolleksiya | Əsas sahələr / constraint |
|---|---|---|
| 1 | users | fin UNIQUE, mobileNumber UNIQUE, pinHash (bcrypt), role, status, failedLoginAttempts, lockedUntil, preferredLanguage, biometricEnabled, blockedReason |
| 2 | patients | userId UNIQUE (1:1), bloodType, address, secondaryPhone, emergencyContact*, medicalConsent, consentGivenAt, consentVersion, noShowCount |
| 3 | patient_allergies | patientId, allergenName, drugId?, severity |
| 4 | patient_chronic_conditions | patientId, conditionName, icd10Code? |
| 5 | user_sessions | userId, tokenHash, deviceInfo, ipAddress, expiresAt (sliding 15 dəq), revokedAt |
| 6 | otp_verifications | mobileNumber, otpHash, purpose, attemptCount, isVerified, expiresAt |
| 7 | sima_verification_sessions | fin, mobileNumber, qrToken UNIQUE, purpose, sessionStatus, returnUrl, callbackPayload, signatureVerified, expiresAt |
| 8 | doctors | userId UNIQUE, licenseNumber UNIQUE, licenseExpiryDate, bio, education, experienceYears, academicDegree, approvalMode, profileCompleted, avgRating, reviewCount |
| 9 | specialties | nameAz/Ru/En, isActive |
| 10 | doctor_specialties | UNIQUE(doctorId, specialtyId), isPrimary |
| 11 | doctor_languages | doctorId, languageCode |
| 12 | clinics | registrationNumber UNIQUE, clinicType, licenseNumber, licenseExpiryDate, cityId, district, address, lat/lng, phone, status, verifiedBy/At, avgRating |
| 13 | clinic_working_hours | UNIQUE(clinicId, dayOfWeek 1–7), opensAt, closesAt, isClosed |
| 14 | clinic_photos | clinicId, photoUrl, displayOrder |
| 15 | doctor_clinics | **açar cədvəl**; UNIQUE(doctorId, clinicId), status, roomNumber, invitedBy, inviteToken, inviteExpiresAt, joinedAt |
| 16 | services | kataloq; nameAz/Ru/En, category, isActive |
| 17 | clinic_doctor_services | UNIQUE(doctorClinicId, serviceId), durationMinutes, isActive |
| 18 | doctor_schedules | doctorClinicId, dayOfWeek, startTime < endTime, slotDurationMinutes ∈ {15,20,30,45,60}, bufferMinutes, updatedBy |
| 19 | schedule_breaks | scheduleId, breakStart, breakEnd, breakName |
| 20 | schedule_exceptions | doctorClinicId, exceptionType, startDate, endDate, startTime?/endTime? (EXTRA_HOURS), reason, createdBy |
| 21 | appointment_slots | UNIQUE(doctorClinicId, slotDate, startTime) — double-booking qadağası; status, lockedBy, lockedUntil, blockedReason |
| 22 | appointments | bookingReference UNIQUE, patientId, doctorClinicId, slotId UNIQUE, serviceId, status, patientNote, doctorNote, rescheduleCount, cancelledBy/Reason/At, completedAt |
| 23 | appointment_status_history | appointmentId, oldStatus, newStatus, changedBy (null=sistem), changeReason, oldSlotId |
| 24 | appointment_documents | UNIQUE(appointmentId, documentId), grantId |
| 25 | medical_documents | patientId, category, fileName, storagePath, fileSizeBytes, mimeType, encryptionKeyId, documentDate, description, virusScanStatus, isArchived, deletedAt |
| 26 | document_access_grants | documentId, doctorId, grantedBy, accessDuration, status, appointmentId?, viewCount, grantedAt, expiresAt, revokedAt |
| 27 | document_access_log | documentId, grantId?, accessedBy, accessType (VIEW/DOWNLOAD_ATTEMPT/DENIED), ipAddress |
| 28 | drugs | tradeName, genericName, form, strength, isControlled, isActive |
| 29 | drug_interactions | UNIQUE(drugId1, drugId2) (sıralanmış cüt saxla), severity, description |
| 30 | prescriptions | prescriptionNumber UNIQUE (imzada), appointmentId, patientId, doctorId, diagnosis, icd10Code, generalNotes, status, digitalSignature, signedAt, qrCodeToken, validUntil, cancelledReason/At |
| 31 | prescription_medications | prescriptionId, drugId? / drugNameManual?, dosage, frequency, durationDays, instructions, warningOverridden, overrideReason |
| 32 | reviews | appointmentId UNIQUE, patientId, doctorId, overallRating 1–5, professionalism/attitude/waitingTime, comment, isAnonymous, status, filterFlags, moderatedBy/At, rejectionReason |
| 33 | review_replies | reviewId UNIQUE, doctorId, replyText, status |
| 34 | review_reports | reviewId, reportedBy, reportReason, resolution, resolvedBy |
| 35 | notifications | userId, notificationType, title, body (tibbi data yoxdur), deepLink, relatedEntityType/Id, isRead, readAt |
| 36 | notification_deliveries | notificationId, channel, status, providerMessageId, errorMessage, retryCount, sentAt, deliveredAt |
| 37 | scheduled_notifications | userId, appointmentId?, notificationType, scheduledAt, status (PENDING/SENT/CANCELLED/SKIPPED), cancelledReason |
| 38 | notification_preferences | UNIQUE(userId, notificationType), smsEnabled, pushEnabled, emailEnabled, isMandatory |
| 39 | notification_templates | UNIQUE(notificationType, languageCode, channel), titleTemplate, bodyTemplate (`{doctorName}` dəyişənləri) |
| 40 | audit_logs | **append-only**; userId?, userRole, action, entityType, entityId, oldValue, newValue, reason, ipAddress, userAgent |
| 41 | security_events | userId?, eventType (FAILED_LOGIN/UNAUTHORIZED_ACCESS/MALWARE_DETECTED/SIMA_MISMATCH), severity, description |
| 42 | system_settings | settingKey UNIQUE, settingValue, dataType, category, isCritical, updatedBy |
| 43 | cities | nameAz/Ru/En, isActive |

## Əlavə kolleksiyalar və sahələr (spec-də yoxdur, funksionallıq tələb edir)

Bunları real backend komandasına ötürmək üçün burada saxla.

| Kolleksiya / sahə | Niyə |
|---|---|
| `auth_flows` {flowId, kind: REGISTRATION/PIN_RESET/PHONE_CHANGE, mobileNumber, fin, userId, otpId, otpVerified, simaSessionId, returnUrl, expiresAt, completedAt} | UC-101/103/104 çoxaddımlı axınların vəziyyəti (registrationId/resetId/changeId = flowId) |
| `users.deletionRequestedAt` | F11 hesab silmə tələbi |
| `sima_verification_sessions.failureReason`, `.flowId` | FAILED səbəbi, axınla əlaqə |
| `doctors.signatureCertExpiry`, `doctors.certificates[]`, `doctors.specializationAreas[]` | UC-601 sertifikat yoxlaması, UC-701 |
| `patients.regularMedications[]` | UC-104 daimi dərmanlar (qarşılıqlı təsir yoxlaması) |
| `clinics.acceptingAppointments`, `clinics.insurances[]`, `clinics.foundedYear`, `clinics.documents[]` | F7, UC-202 sığorta filtri, UC-302, UC-901 |
| `clinic_admins` {userId, clinicId, status} | Klinika admini ↔ klinika əlaqəsi (bir klinikada çox admin) |
| `appointments.startAt` (UTC ISO, denormalizasiya), `appointments.pendingReschedule`, `appointments.reviewInvited` | Sorğular, F4 |
| `prescription_templates` {doctorId, name, medications[]} | UC-601 alt 1 |
| `prescription_renewal_requests` {prescriptionId, patientId, doctorId, status, note, reason, newPrescriptionId} | UC-602 alt 2 |
| `reviews.publishedSnapshot` | 24 saatlıq redaktədə köhnə versiyanın göstərilməsi |
| `signed_urls` {token, documentId, userId, expiresAt, usedAt} | Birdəfəlik signed URL |
| `doctor_clinics.slotsGeneratedUntil` | Rolling slot generasiyası (60 gün) üçün işarə |
| `moderation_filter_rules` {bannedWords[], sensitivity LOW/MEDIUM/HIGH} | UC-903 alt 5 (tək sətir) |
| `review_replies.filterFlags[]`, `.rejectionReason` | UC-903 alt 2 |
| `clinic_documents` {clinicId, kind REGISTRATION/LICENSE/CONTRACT/OTHER, fileName, mimeType, storagePath, encryptionKeyId} | UC-901 rəsmi sənədlər |
| `clinics.suspendedReason` | F29 |
| `clinic_holidays` {clinicId, date, name, createdBy} | UC-801 alt 2 bayram / qeyri-iş günləri |
| `service_requests` {clinicId, name, category, note, status} | UC-804 alt 4 kataloqa tələb (UC-904-də emal olunur) |
| `doctor_credentials` {doctorId, clinicId, kind LICENSE/DIPLOMA, fileName, mimeType, storagePath, encryptionKeyId} | FR-802-08 sənədlər (şifrələnmiş storage) |
| `doctor_clinics.inactiveReason` (LICENSE_EXPIRED / ADMIN) | F26 |
| `services.specialtyIds[]` | EF-804-2 ixtisas uyğunluğu |
| `drugs.drugClass`, `drugs.patientInfo` | Allergiya qrupu üzrə uyğunluq (məs. penisilin qrupu); pasientə ümumi məlumat (FR-602-12) |
| `prescriptions.validDays`, `prescriptions.controlledJustification` | İmzaya qədər etibarlılıq günü; BR-601-08 əsaslandırma |
| `trusted_devices` {userId, deviceId, tokenHash, revokedAt} | F9 biometrik simulyasiya |
| `service_requests` {clinicId, name, status} | UC-804 alt 4 |
| `moderation_filter_rules` {bannedWords[], sensitivity} | UC-903 alt 5 |

## Əsas əlaqələr
users 1:1 patients/doctors · doctors M:N clinics (doctor_clinics) · doctor_clinics 1:N doctor_schedules, appointment_slots, schedule_exceptions, clinic_doctor_services · appointment_slots 1:1 appointments · patients 1:N medical_documents · medical_documents M:N doctors (document_access_grants) · appointments 1:N prescriptions 1:N prescription_medications · appointments 1:1 reviews.
