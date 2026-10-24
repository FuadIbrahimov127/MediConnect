# Domen qaydaları — xülasə

Bu fayl `spec-full.md`-dən distillə olunub. Detal və ID-lər üçün həmişə spec-ə qayıt. Sonda **Fərziyyələr** bölməsi var: spec-in açıq buraxdığı yerlərdə qəbul olunmuş qərarlar.

## 1. Rollar və platforma zənciri

| Rol (`userRole`) | Əhatə | Qeyd |
|---|---|---|
| Guest | Public | Axtarış, həkim/klinika səhifəsi. Randevu üçün qeydiyyat lazımdır |
| PATIENT | Öz datası | SİMA ilə doğrulanmış. Randevu, sənəd, resept, rəy |
| DOCTOR | Clinic-scoped | Özü qeydiyyatdan keçə bilmir; klinika admini dəvət edir. Bir neçə klinikada işləyə bilər |
| CLINIC_ADMIN | Yalnız öz klinikası | Operativ idarəetmə; **tibbi məzmun görmür** |
| SUPER_ADMIN | Global | Klinika verifikasiyası, istifadəçilər, moderasiya, parametrlər, audit; **tibbi məzmun görmür** |

Zəncir: müqavilə → Super Admin klinikanı yaradır və klinika admini dəvət edir (SMS) → admin SİMA ilə təsdiqlənir və PIN qoyur → admin həkimi dəvət edir (SMS, 7 gün) → həkim SİMA ilə təsdiqlənir → profilini tamamlayır (UC-701) → cədvəlini qurur (UC-702) → həkim axtarışda görünür → pasient randevu alır.

Login-dən sonra yönləndirmə: PATIENT → `/account`, DOCTOR → `/doctor`, CLINIC_ADMIN → `/clinic-admin`, SUPER_ADMIN → `/admin`.

### Həkimin axtarışda görünmə şərti (hamısı eyni anda doğru olmalıdır)
`users.status = VERIFIED` ∧ `doctors.profileCompleted` ∧ `licenseExpiryDate >= today` ∧ ən azı bir `doctor_clinics.status = ACTIVE` olan bağlantı, harada ki `clinics.status = ACTIVE`. Klinika üzrə slotlar yalnız ACTIVE bağlantı + ACTIVE klinika üçün göstərilir. Klinika axtarışda görünür, əgər ACTIVE-dirsə və ən azı bir görünən həkimi varsa (BR-202-04).

## 2. Görmə matrisləri (serializer-lər bunlara uyğun yazılır)

**Həkim (DOCTOR):** öz randevuları — bəli; pasientin şikayəti — yalnız öz randevusunda; allergiyalar — randevu kontekstində bəli; tibbi sənədlər — yalnız ACTIVE grant ilə, yalnız baxış (download yoxdur); tibbi tarixçə — yalnız icazə verilmiş elementlər; öz reseptləri — bəli; başqa həkimin resepti və randevuları — xeyr; qiymət təyini — xeyr. "Pasient konteksti" = bu həkimin həmin pasientlə keçmiş randevuları + icazəli sənədlər.

**Clinic Admin:** öz klinikasının randevuları (booking reference, pasient adı, həkim, tarix, saat, xidmət, status) — bəli. Şikayət mətni, diaqnoz, resept, sənəd, müayinə qeydi — **heç vaxt**. Həkimin bu klinikadakı cədvəli — redaktə hüququ ilə; həkimin başqa klinikadakı cədvəli — xeyr. Lisenziya sənədləri — bəli. Klinika statistikası — bəli. Başqa klinika — xeyr (cəhd log-a yazılır).

**Super Admin:** bütün klinikalar və istifadəçilər (hesab metadata-sı); sənəd yalnız metadata (ad, tarix, ölçü); resept, diaqnoz, müayinə qeydi — xeyr; randevu metadata-sı — bəli; lisenziya sənədləri — bəli; moderasiyadan əvvəlki rəylər — bəli; audit log — yalnız oxumaq; öz hesabını bloklamaq — xeyr.

**Pasient:** yalnız öz datası. Başqasının resursu → 404 + `security_events` (`UNAUTHORIZED_ACCESS`).

## 3. Status maşınları

### appointmentStatus
```
            (AUTO təsdiq rejimi)
  create ──────────────────────────► CONFIRMED ──complete (start ≤ now)──► COMPLETED
    │ (MANUAL)                           │  ▲                                  ▲
    ▼                                    │  │ no-show düzəlişi (≤24h, admin)    │ auto (start+24h, job)
  PENDING ──confirm (həkim)──────────────┘  │                                  │
    │                                    ├──no-show (start ≤ now)──► NO_SHOW ───┘ (düzəliş: NO_SHOW→COMPLETED, sayğac −1)
    └──reject/cancel──► CANCELLED ◄──────┘ cancel
```
- Pasient ləğvi: yalnız PENDING/CONFIRMED, başlanğıca ≥ `min_cancel_lead_hours` (1) qalıbsa; səbəb məcburidir. Həkim/admin ləğvi: səbəb məcburidir, pasientin no-show sayğacına təsir etmir.
- Reschedule: status dəyişmir; `rescheduleCount < max_reschedule_count` (2); başlanğıca ≥ 2 saat; eyni həkim (və ya həkimin başqa klinikası); yeni slot SOFT_LOCKED olmalı, köhnə slot yalnız uğurdan sonra AVAILABLE olur. Həkim/admin köçürməsi pasient təsdiqi tələb edir (`pendingReschedule` — Fərziyyələr §F4).
- COMPLETED → rəy dəvəti (2 saat sonra), tibbi tarixçəyə əlavə. NO_SHOW → `patients.noShowCount++` + bildiriş.
- Hər keçid `appointment_status_history`-yə yazılır (`changedBy` null = sistem).

### slotStatus
`AVAILABLE ⇄ SOFT_LOCKED` (lock: `lockedBy`, `lockedUntil = now + slot_soft_lock_minutes`; vaxt bitəndə job və ya oxu zamanı yoxlama AVAILABLE-a qaytarır) → `BOOKED` (randevu yarandı) → `AVAILABLE` (gələcək randevu ləğv/köçürmə). `AVAILABLE ⇄ BLOCKED` (həkim/admin; BOOKED slot birbaşa BLOCKED edilə bilməz — əvvəl randevu idarə olunmalıdır). Bir istifadəçinin eyni anda yalnız bir aktiv lock-u olur (yenisini alanda köhnəsi buraxılır).

### prescriptionStatus
`DRAFT` (pasient görmür) → `SIGNED` (imza servisi uğurlu; `prescriptionNumber`, `qrCodeToken`, `validUntil = signedAt + prescription_validity_days`) → `EXPIRED` (job). `DRAFT|SIGNED → CANCELLED` (həkim, səbəb; silinmir). `DISPENSED` — Phase 2, implement etmə. SIGNED resept redaktə olunmur.

### grantStatus
`ACTIVE` → `EXPIRED` (`expiresAt` keçdi; job + hər girişdə yoxlama) / `REVOKED` (pasient, yaxud randevu ləğvi, yaxud həkim deaktiv). Müddət: TWENTY_FOUR_HOURS, SEVEN_DAYS, THIRTY_DAYS, APPOINTMENT_PERIOD = randevu tarixi + 7 gün. Randevuya sənəd əlavə olunanda avtomatik APPOINTMENT_PERIOD grant yaranır.

### reviewStatus
`PENDING_MODERATION → PUBLISHED | REJECTED`; `PUBLISHED → REPORTED → PUBLISHED (şikayət rədd) | WITHDRAWN`; `PUBLISHED → WITHDRAWN`. 24 saat ərzində redaktə → yeni mətn moderasiyaya düşür, təsdiqlənənə qədər köhnə dərc olunmuş versiya göstərilir. Reytinq yalnız PUBLISHED rəylərdən hesablanır.

### clinicStatus / doctorClinicStatus / userStatus
- Klinika: `PENDING_VERIFICATION → ACTIVE ⇄ SUSPENDED`; `→ INACTIVE` (aktiv randevular varsa bloklanır). Lisenziya bitəndə job klinikanı avtomatik SUSPENDED edir.
- Həkim–klinika: `INVITED → ACTIVE` (dəvət qəbul + SİMA) `⇄ INACTIVE`; `→ REMOVED` (gələcək randevu varsa qərar tələb olunur); dəvət rədd və ya vaxtı keçibsə `REMOVED`.
- İstifadəçi: `PENDING_VERIFICATION → VERIFIED ⇄ SUSPENDED/BLOCKED`; `DELETED` (anonimləşdirmə, tibbi data saxlanır). BLOCKED olanda bütün sessiyalar revoke olunur.

## 4. Açar biznes qaydaları (modul üzrə ən vacibləri)

**Auth:** FIN unikal, telefon unikal; OTP 6 rəqəm, 120 s, təkrar göndərmə 60 s, hash saxlanır, cavabda qaytarılmır; SİMA QR 5 dəq, callback imzası yoxlanır, SİMA sahələri (ad, soyad, ata adı, doğum tarixi, cins, FIN) redaktə olunmur; PIN 4 rəqəm, bcrypt, zəif PIN-lər (1111, 1234, 0000 və ümumiyyətlə bütün eyni rəqəmlər/ardıcıllıqlar) rədd; tibbi razılıq olmadan hesab aktivləşmir (razılığın tarixi və versiyası saxlanır); 5 uğursuz giriş → 30 dəq lock (429 `AccountLocked`); 15 dəq fəaliyyətsizlik → sessiya bitir (sliding); yeni cihazdan giriş → təhlükəsizlik bildirişi; PIN bərpası = OTP + SİMA + FIN uyğunluğu, yeni PIN köhnə ilə eyni ola bilməz, bütün sessiyalar bağlanır. Return URL saxlanır və qeydiyyat/login-dən sonra istifadə olunur.

**Axtarış:** Guest də istifadə edir; filtrlər URL query-də saxlanır; səhifə başına max 20; default çeşidləmə reytinq üzrədir; reytinqi olmayan həkim üçün "Yeni həkim". Klinika reytinqi = aktiv həkimlərin reytinqlərinin ortası. Həkim filtrləri: ixtisas, şəhər, klinika, minRating (3/4/4.5), cins, dil, təcrübə, boş vaxt (TODAY/TOMORROW/THIS_WEEK), akademik dərəcə. Klinika filtrləri: şəhər, klinika növü, ixtisaslar, xidmətlər, iş rejimi (24/7, həftə sonu, axşam), reytinq, sığorta.

**Randevu:** yalnız VERIFIED pasient; slotun başlanğıcına ≥1 saat qalmalıdır; keçmiş tarix olmaz; max 60 gün irəli; eyni həkimlə eyni gündə bir aktiv randevu; `noShowCount > no_show_limit` olarsa bloklanır; booking reference unikaldır (`MC-YYYY-MMDD-NNNN`); AUTO → CONFIRMED, MANUAL → PENDING; xatırlatmalar 24 saat və 2 saat əvvələ planlaşdırılır; həkimə və pasientə bildiriş gedir. Klinika müvəqqəti bağlıdırsa (və ya SUSPENDED) yeni randevu qəbul olunmur.

**Sənədlər:** PDF/JPG/PNG, ≤10 MB, antivirus, AES-256 at rest, giriş yalnız qısamüddətli və birdəfəlik signed URL ilə; kateqoriya + tarix + təsvir; arxiv; silinmə 30 gün soft delete, sonra purge; tibbi razılıq yoxdursa yükləmə yoxdur. Paylaşmaq yalnız pasientin randevusu olan (aktiv və ya keçmiş) həkimlə olur; təkrar grant cəhdi mövcud grant-ı qaytarır və uzatmağı təklif edir; həkim download edə bilmir (`DOWNLOAD_ATTEMPT` log-a yazılır); hər baxış `document_access_log` + `viewCount`; pasient kimin nə vaxt baxdığını görür.

**Resept:** həkimin lisenziyası aktiv olmalı, imza sertifikatı etibarlı olmalı; pasientlə CONFIRMED/COMPLETED randevu tələb olunur; ICD-10 kodu; hər dərman allergiya və qarşılıqlı təsir üzrə yoxlanır (SEVERE əlavə təsdiq istəyir); xəbərdarlığı keçmək üçün səbəb məcburidir (`warningOverridden`, `overrideReason`, audit); nəzarətdə olan dərman (`isControlled`) əlavə əsaslandırma istəyir; kataloqda olmayan dərman əl ilə yazılır, amma qarşılıqlı təsir yoxlanmadığı barədə xəbərdarlıq çıxır; imza xətası verərsə resept DRAFT qalır; default etibarlılıq 30 gündür; şablon və "təkrarla" funksiyası var; pasient təkrar resept istəyə bilər (həkim təsdiqləyir və ya səbəb göstərib rədd edir); QR ilə public doğrulama.

**Həkim cədvəli:** cədvəl hər klinika üçün ayrıdır; şablon = iş günləri + saatlar + slot müddəti (15/20/30/45/60) + fasilələr + bufer; klinika iş saatları yuxarı sərhəddir (kənara çıxanda xəbərdarlıq + admin təsdiqi); həkim eyni vaxtda iki klinikada ola bilməz (blok); bir günün içində vaxtlar üst-üstə düşə bilməz, bitmə başlanğıcdan sonra olmalıdır; BOOKED slot silinmir — konflikt siyahısı göstərilir və qərar tələb olunur (ləğv et + bildir, ya da dəyişikliyi geri al); dəyişiklik yalnız gələcəyə tətbiq olunur; slotlar 60 gün irəli generasiya olunur (rolling job); istisnalar: DAY_OFF, VACATION, EXTRA_HOURS, HOLIDAY (klinika bayramı bütün həkimlərə tətbiq olunur); admin dəyişikliyi həkimə bildirilir.

**Xidmətlər:** mərkəzi kataloqdan seçilir; müddət `clinic_doctor_services.durationMinutes`-dir; xidmət müddəti slotdan uzundursa ardıcıl slotlar birləşdirilir; hər xidmət ən azı bir həkimə bağlıdır; aktiv randevusu olan xidmət silinmir (deaktiv etmək olar); müddət dəyişikliyi mövcud randevulara təsir etmir.

**Super Admin:** qeydiyyat nömrəsi unikal; keçmiş tarixli lisenziya qəbul olunmur; lisenziya gündəlik yoxlanır, 30 gün qalmış xəbərdarlıq gedir; hər admin əməliyyatı səbəb tələb edir; yeganə klinika admini bloklananda xəbərdarlıq çıxır; aktiv randevusu olan həkim bloklanmazdan əvvəl randevuları idarə olunmalıdır; kritik parametrlər əlavə təsdiq tələb edir; istifadədə olan kataloq elementi silinmir.

**Bildirişlər:** event-driven + scheduled; şablon (növ × dil × kanal) seçilir; istifadəçi tərcihləri nəzərə alınır (məcburi növlər söndürülmür); kanal uğursuz olarsa fallback; 23:00–08:00 arası kritik olmayan bildirişlər səhərə saxlanır; rate limit; deep link; oxunmamış sayğac.

**Rəy:** yalnız COMPLETED randevu üçün, bir randevu = bir rəy, 30 gün ərzində; ulduz məcburi, mətn opsional; alt reytinqlər (peşəkarlıq, münasibət, gözləmə vaxtı); anonim seçim (müəllif daxildə saxlanır); avtomatik filtr (təhqir, spam, telefon/FIN, tibbi detal) → `filterFlags`; dəvət 1 dəfə xatırladılır (3 gün sonra); həkim rəyə cavab yazır (o da moderasiyadan keçir) və rəyi şikayət edə bilir; heç kim rəyi silə bilməz.

## 5. Sistem parametrləri (`system_settings` seed)

| key | default | kateqoriya |
|---|---|---|
| otp_validity_seconds | 120 | security |
| otp_resend_interval_seconds | 60 | security |
| sima_qr_validity_seconds | 300 | security |
| slot_soft_lock_minutes | 10 | appointment |
| min_booking_lead_hours | 1 | appointment |
| max_reschedule_count | 2 | appointment |
| min_cancel_lead_hours | 1 | appointment |
| slot_generation_days | 60 | appointment |
| reminder_first_hours | 24 | notification |
| reminder_second_hours | 2 | notification |
| review_window_days | 30 | review |
| review_edit_hours | 24 | review |
| no_show_limit | 3 | appointment |
| max_file_size_mb | 10 | document |
| document_soft_delete_days | 30 | document |
| prescription_validity_days | 30 | prescription |
| session_timeout_minutes | 15 | security (critical) |
| max_login_attempts | 5 | security (critical) |
| login_lockout_minutes | 30 | security (critical) |
| doctor_invite_validity_days | 7 | clinic |
| license_expiry_warning_days | 30 | clinic |
| auto_complete_after_hours | 24 | appointment |

Əlavə (fərziyyə): `min_reschedule_lead_hours = 2`, `review_invite_delay_hours = 2`, `review_reminder_days = 3`, `quiet_hours_start = 23`, `quiet_hours_end = 8`, `signed_url_ttl_seconds = 60`.

## 6. Bildiriş növləri (`notificationType`)

| type | alıcı | kanal | məcburi |
|---|---|---|---|
| APPOINTMENT_CONFIRMED | Patient, Doctor | SMS+PUSH+IN_APP | ✔ |
| APPOINTMENT_PENDING (sorğu həkimə) | Doctor | PUSH+IN_APP | |
| APPOINTMENT_REQUESTED *(əlavə)* | Patient | SMS+PUSH+IN_APP | ✔ |
| NEW_APPOINTMENT *(əlavə)* | Doctor | PUSH+IN_APP | |
| RESCHEDULE_PROPOSED *(əlavə)* | Patient | SMS+PUSH+IN_APP | ✔ |
| REMINDER_24H | Patient | SMS+PUSH | |
| REMINDER_2H | Patient | PUSH | |
| APPOINTMENT_CANCELLED | Patient, Doctor | SMS+PUSH+IN_APP | ✔ |
| APPOINTMENT_RESCHEDULED | Patient, Doctor | SMS+PUSH+IN_APP | ✔ |
| APPOINTMENT_REJECTED | Patient | SMS+PUSH | ✔ |
| PRESCRIPTION_CREATED | Patient | PUSH+IN_APP | |
| DOCUMENT_SHARED | Doctor | PUSH+IN_APP | |
| REVIEW_INVITE | Patient | PUSH+IN_APP | |
| REVIEW_PUBLISHED | Doctor (+Patient) | IN_APP | |
| DOCTOR_INVITE | Doctor | SMS | ✔ |
| CLINIC_ADMIN_INVITE | Clinic Admin | SMS | ✔ |
| SCHEDULE_CHANGED | Doctor | PUSH+IN_APP | |
| LICENSE_EXPIRY_WARNING | Doctor, Clinic Admin | EMAIL+IN_APP | |
| SECURITY_NEW_DEVICE | all | SMS+PUSH | ✔ |
| ACCOUNT_STATUS_CHANGED | all | SMS+EMAIL | ✔ |
| NO_SHOW_RECORDED | Patient | PUSH+IN_APP | |
| PIN_CHANGED | all | SMS | ✔ |
| OTP_CODE | (telefon) | SMS | ✔ (şablon, istifadəçi olmaya bilər) |

## 7. Fərziyyələr (spec boşluqları üçün qəbul edilmiş qərarlar)

Yeni fərziyyəni bura əlavə et (ID ilə). Real backend komandası və BA bunları təsdiqləməlidir.

- **F1** — Booking reference-dəki tarix **randevunun tarixidir** (prototipdəki kimi); NNNN həmin gün üzrə təsadüfi və unikal 4 rəqəmdir. (Spec nümunəsi heç bir tarixlə üst-üstə düşmür.)
- **F2** — No-show bloku `noShowCount > no_show_limit` olanda tətbiq olunur (BR-401-10: "3-dən çox").
- **F3** — Slotun başlanğıc vaxtına qədər təsdiqlənməmiş PENDING randevu job tərəfindən CANCELLED edilir (səbəb: "Həkim təsdiqləmədi"), slot boşalır, pasientə bildiriş gedir.
- **F4** — Həkim/admin köçürməsi randevuda `pendingReschedule {newSlotId, requestedBy}` yaradır, yeni slot BLOCKED kimi saxlanır; pasient qəbul edəndə köçürmə tətbiq olunur, rədd edəndə randevu ləğv olunur.
- **F5** — Resept nömrəsi formatı: `RX-YYYY-NNNNNN`.
- **F6** — Həkim/admin ləğvində 1 saat limiti tətbiq olunmur (yalnız başlanğıc vaxtından əvvəl olmalıdır).
- **F7** — Klinika adminin "müvəqqəti bağlama"sı (UC-801 alt 3) `clinics.acceptingAppointments = false` bayrağıdır və SUSPENDED-dən fərqlidir: klinika axtarışda görünür, amma slot göstərilmir.
- **F8** — Mətnsiz rəy də moderasiya növbəsinə düşür, amma `filterFlags` boş olduğu üçün toplu təsdiqə uyğundur.
- **F9** — Biometrik giriş (WebAuthn) mock-da "bu cihazı yadda saxla" tokeni ilə simulyasiya olunur; biometrik data serverə getmir.
- **F10** — Sessiya tokeni opaque random stringdir (server `user_sessions`-də hash-ini saxlayır); spec JWT deyir, amma mock üçün davranış eynidir, header də `Authorization: Bearer`-dir.
- **F11** — Hesabın silinməsi pasient tərəfindən **tələb** kimi qeydə alınır (`users.deletionRequestedAt`); anonimləşdirməni Super Admin edir (UC-902 alt 4).
- **F12** — Bir OTP kodu üçün maksimum 5 yanlış cəhd; sonra yeni kod tələb olunur. Çoxaddımlı auth axını (qeydiyyat, PIN bərpası) 30 dəqiqə etibarlıdır.
- **F13** — Qeydiyyatda da SİMA-dan gələn FIN daxil edilmiş FIN ilə eyni olmalıdır (başqa şəxsin üzü → FAILED + security event).
- **F15** — Seed reytinqləri sintetik keçmiş qəbullar və onlara yazılmış PUBLISHED rəylərdən hesablanır (BR-1101-07 pozulmur).
- **F16** — Uzun xidmət üçün slot zəncirində ardıcıl slotlar arasında ≤15 dəq boşluq (bufer) olmalıdır; fasilə zənciri qırır.
- **F17** — 24/7 klinikanın iş saatı 00:00–23:59 kimi saxlanılır (`clinics.is24x7 = true`).
- **F18** — Ana səhifədəki konkret tarix axtarışı (`date` parametri) həmin gün boş slotu olan həkimləri qaytarır (spec-də yalnız TODAY/TOMORROW/THIS_WEEK var).
- **F19** — Xatırlatmalar yalnız CONFIRMED randevu üçün göndərilir (PENDING üçün planlaşdırılır, amma göndərmə anında yoxlanılır).
- **F20** — Manual rejimdə pasientə `APPOINTMENT_REQUESTED` (sorğu göndərildi), həkimə `APPOINTMENT_PENDING`; AUTO rejimdə pasientə `APPOINTMENT_CONFIRMED`, həkimə `NEW_APPOINTMENT` gedir. Həkim/admin köçürmə təklifi üçün `RESCHEDULE_PROPOSED`.
- **F21** — Səbəbli ötürmə (BR-601-09) tələb edən xəbərdarlıqlar: hər allergiya uyğunluğu və SEVERE qarşılıqlı təsir. MODERATE/MINOR qarşılıqlı təsir, əl ilə dərman və yaş xəbərdarlığı yalnız göstərilir. Nəzarətdə olan dərman üçün ayrıca `controlledJustification` (≥10 simvol).
- **F22** — Qarşılıqlı təsir yoxlamasında "aktiv dərmanlar" = pasientin özünün qeyd etdiyi daimi dərmanlar + bu həkimin aktiv (SIGNED) reseptləri. Başqa həkimlərin reseptləri görmə matrisinə görə nəzərə alınmır.
- **F23** — Resept nömrəsi `RX-İİİİ-NNNNNN` (il üzrə ardıcıl). İmza = HMAC(həkim + məzmun hash-i); məzmun dəyişsə imza etibarsız görünür. QR məzmunu açıq doğrulama URL-idir (`/prescriptions/verify/{qrToken}`), tibbi detal qaytarmır.
- **F24** — Təkrar resept sorğusu təsdiqlənəndə köhnə reseptin dərmanları ilə **qaralama** yaranır (orijinal randevuya bağlı); etibarlı olması üçün həkim yenidən imzalayır (BR-602-07). Pasient imzalanmamış resepti heç vaxt görmür; imzadan sonra ləğv edilən görünür.
- **F25** — Həkim dəvəti: yeni həkim üçün istifadəçi `PENDING_VERIFICATION` statusunda yaradılır (daxil ola bilmir); SİMA uğurlu olanda ad, ata adı, doğum tarixi, cins reyestrdən yazılır, PIN təyin olunur, status `VERIFIED`. Mövcud həkim (başqa klinikada) dəvəti PIN ilə qəbul edir, profilinə toxunulmur. FIN başqa rolda (məs. pasient) qeydiyyatdadırsa həkim kimi əlavə olunmur.
- **F26** — Lisenziya bitəndə (BR-802-08) həkimin bütün ACTIVE bağlantıları `INACTIVE` (`inactiveReason = LICENSE_EXPIRED`) olur; hesab bloklanmır (panelə girə bilir). Lisenziya yeniləndikdə (yeni sənəd məcburi) yalnız bu səbəblə dayandırılmış bağlantılar avtomatik bərpa olunur. Xəbərdarlıq 30 (parametr), 7 və 1 gün qalmış bir dəfə gedir.
- **F27** — Təcili gün bağlamada "başqa həkimə köçürmə" mövcud köçürmə təklifi mexanizmidir: yeni slot bloklanır, pasient qəbul etsə randevu yeni həkimə keçir, imtina etsə ləğv olunur. Köçürmə limiti (BR-403-01) tətbiq olunmur. Gün həkim üçün DAY_OFF istisnası kimi qeyd olunur.
- **F28** — Klinika iş saatlarının daralması: həkim cədvəlinin kənarda qalan hissəsi silinmir (workIntervals klinika saatı ilə kəsir), amma admin açıq təsdiq verməlidir; kənarda qalan aktiv randevular üçün ləğv qərarı tələb olunur. Bayram günü ayrıca `clinic_holidays` kolleksiyasındadır.
- **F29** — Klinika status maşını: PENDING_VERIFICATION → (VERIFY) ACTIVE ⇄ (SUSPEND/REACTIVATE) SUSPENDED → (DEACTIVATE) INACTIVE; PENDING → (REJECT) INACTIVE + DOCUMENT_FRAUD hadisəsi. REQUEST_DOCUMENTS statusu dəyişmir. Verifikasiya üçün qeydiyyat + lisenziya sənədi və reyestr təsdiqi məcburidir. `suspendedReason` (LICENSE_EXPIRED/ADMIN) lisenziya yenilənəndə avtomatik bərpanı müəyyən edir.
- **F30** — Səhiyyə Nazirliyinin lisenziya reyestri mock-u: "TF-…" formatlı nömrə tapılır, digərləri tapılmır (EF-901-2 demosu).
- **F31** — Bir klinika admini hesabı = bir klinika. İkinci klinikaya admin lazımdırsa başqa şəxs təyin olunur; FIN başqa rolda qeydiyyatdadırsa rol konflikti (EF-901-5). Super Admin randevu metadata-sını görür və hesab/klinika əməliyyatlarında randevunu ləğv edə bilər (tibbi sahələr serializer-də boşdur). Anonimləşdirmədə audit-ə şəxsi məlumat yazılmır.
- **F32** — Mətnsiz rəy də moderasiyadan keçir (BR-1101-05), amma filtr işarəsi olmadığı üçün toplu təsdiqə düşür ("daha sürətli dərc"). Avtomatik filtr: telefon/FIN/email → PERSONAL_DATA, xəstəlik və dərman adları → MEDICAL_DETAIL, qadağan olunmuş sözlər → PROFANITY (MEDIUM/HIGH-da avtomatik rədd), link/təkrar simvol → SPAM (HIGH-da rədd).
- **F33** — Şikayət edilmiş rəy (REPORTED) qərar verilənə qədər profildə görünür və reytinqə daxildir; WITHDRAW edilsə çıxarılır. Dərc olunmuş rəyin redaktəsi `publishedSnapshot`-da köhnə versiyanı saxlayır: profil və reytinq köhnəni göstərir, təsdiqdə yeni versiya, rəddə köhnə qalır.
- **F14** — Klinika admini, həkim və super admin üçün return URL nəzərə alınmır — həmişə öz panelinə yönləndirilir.
