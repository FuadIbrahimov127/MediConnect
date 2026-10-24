<!-- Confluence "Mediconnect Final" səhifəsinin tam mətni (Mediconnect+Final.doc exportundan çıxarılıb, 2026-10-23). Cədvəllər "a | b |" sətirləri kimidir. FR/BR/EF ID-ləri ilə grep edin. -->

# Ümumi məlumat
MediConnect - pasientlərin həkim axtarışı, randevu planlaşdırması, tibbi sənədlərin idarəsi və elektron reseptlərin alınması proseslərini vahid rəqəmsal platformada birləşdirən səhiyyə həllidir. Hazırda Azərbaycanda tibbi randevu prosesi əsasən telefon zəngləri və resepsiya növbələri vasitəsilə həyata keçirilir ki, bu da həm pasientlər, həm də klinikalar üçün vaxt itkisinə və səmərəsizliyə səbəb olur. Pasientlərin tibbi tarixçəsi, analiz nəticələri və reseptləri müxtəlif klinika və laboratoriyalarda dağınıq şəkildə saxlanılır, bu isə müalicənin davamlılığını çətinləşdirir. MediConnect bu problemləri aradan qaldırmaq üçün pasientlərə online randevu alma, tibbi sənədlərini bir yerdən idarə etmə və e-reseptlərini rəqəmsal formada alma imkanı yaradır. Platforma eyni zamanda həkim və klinikalara randevu cədvəli, pasient qeydləri və reseptlərin idarəsi üçün admin panel təqdim edir. Layihə veb platforma olaraq nəzərdə tutulub və gələcəkdə mobil tətbiq, telemedicine (video konsultasiya) və aptek inteqrasiyası ilə genişləndirilməsi planlaşdırılır. Ödəniş və qiymət modeli: Platformada qiymət göstərilmir və online ödəniş aparılmır. Müayinənin növü, şərtləri və dəyəri klinikada, qəbul zamanı müəyyən edilir. Platforma yalnız randevunun planlaşdırılmasını, tibbi sənədlərin və reseptlərin idarəsini təmin edir.

# Stakeholders
High Power, High Interest - Manage Closely
Stakeholder | Description |
İdarə heyəti | Layihənin maliyyələşdirilməsinə və strateji istiqamətinə qərar verir. Büdcəni təsdiqləyir, layihənin davam edib-etməyəcəyini müəyyən edir. |
PM / PO (Product Manager / Product Owner) | Layihənin biznes tərəfini idarə edir. Backlog-u prioritetləşdirir, sprintlərdə qərar verir, stakeholder-lər arasında əlaqəni qurur. |
IT Business Analyst / Business Analyst | Biznes tələblərini toplayır, analiz edir, sənədləşdirir. Stakeholder-lər və development komandası arasında əlaqə rolunu oynayır, tələblərin düzgün başa düşülməsini təmin edir. |
IT komandası (Developerlər (Front, Back, App), QA, UI/UX Dizayner, Kibertəhlükəsizlik, DevOps) | Platformanı tikən, test edən, dizayn edən və təhlükəsizliyini təmin edən komanda. Texniki qərarlar verir, funksionallıqları realizə edir, xətaları aşkar edir. |

High Power, Low Interest — Keep Satisfied
Stakeholder | Description |
Səhiyyə Nazirliyi | Tibbi fəaliyyətin tənzimləyicisi. E-resept standartları, həkim lisenziyalaşdırması, tibbi məlumatların saxlanma qaydalarını müəyyən edir. Platforma bu qaydalara uyğun olmalıdır, əks halda fəaliyyət göstərə bilmir. |
SİMA (Rəqəmsal kimlik doğrulama) | İstifadəçilərin şəxsiyyətinin üz tanıma və FIN yoxlaması ilə təsdiqlənməsini təmin edir. Platformanın qeydiyyat prosesi tamamilə bu sistemdən asılıdır, lakin SİMA-nın layihəyə birbaşa marağı yoxdur. |
Təchizatçılar | Platformanın fiziki infrastrukturu üçün lazım olan avadanlıqları təmin edən şirkətlər: serverlər, şəbəkə avadanlığı (router, switch), data storage sistemləri, kompüterlər, monitorlar və ofis texnikası. Avadanlığı satıb çatdırırlar, quraşdırma və zəmanət xidməti göstərirlər. |
Hosting / Cloud serverlər | Platformanın server infrastrukturunu təmin edir. SLA (xidmət səviyyəsi razılaşması) şərtləri var. Layihənin funksionallığına maraqsızdır, amma platforma onlarsız işləmir. |
Hüquq şöbəsi | İstifadəçi razılaşması, məxfilik siyasəti və klinika müqavilələrini hazırlayır və yoxlayır. Böyük qərarları bloklaya bilər, amma gündəlik layihə ilə məşğul deyil. |

Low Power, High Interest - Keep Informed
Stakeholder | Description |
Pasientlər | Platformanın əsas istifadəçisi. Həkim axtarır, randevu alır, tibbi sənədlərini idarə edir. Marağı çox yüksəkdir çünki sağlamlığı ilə bağlıdır, amma layihə qərarlarına birbaşa təsir gücü yoxdur. |
Həkimlər | Pasientləri qəbul edən tibb mütəxəssisləri. Platformanın dəyər yaratması onların aktiv iştirakından asılıdır. Platformanı qəbul etməsələr pasientlər də gəlmir, amma layihənin texniki və biznes qərarlarına birbaşa müdaxilə etmirlər. |
Klinikalar / Xəstəxanalar | Platformada xidmət göstərən tibb müəssisələri. Randevu həcminin artmasında maraqlıdırlar, amma platformanın inkişaf istiqamətinə birbaşa təsirləri yoxdur. |
Apteklər | Yeni müştəri kanalı açıldığı üçün maraqlıdırlar, amma hazırda layihə scope-unda aktiv rolu yoxdur. |
Xəbər saytları, Media | Platformanın tanıdılmasına və ictimai rəyin formalaşmasına təsir edə bilərlər. Layihənin uğurunda dolayı maraqlıdırlar, amma qərar vermə gücü yoxdur. |

Low Power, Low Interest — Monitor
Stakeholder | Description |
Vendor şirkətlər | Texniki inteqrasiya var, amma layihənin nəticəsində və istiqamətində maraqsızdırlar. |
Provayderlər (SMS, Email, Push) | Platformanın bildiriş sistemini təmin edən xidmət təminatçıları. API inteqrasiyası vasitəsilə işləyirlər, MediConnect onlar üçün yüzlərlə müştəridən biridir. |
Rəqib platformalar (Medogate, Tibis və s) | Bazarda oxşar xidmət göstərən platformalar. MediConnect-in nə etdiyini izləyirlər, amma layihəyə birbaşa təsirləri və maraqları yoxdur. |

Power Interest qrafiki: [IMG]

# Acronyms

Qısaltma | İzah |
AC | Acceptance Criteria — qəbul meyarları |
AES-256 | Advanced Encryption Standard — məlumat şifrələmə alqoritmi |
API | Application Programming Interface — sistemlərarası əlaqə interfeysi |
BR | Business Rule — biznes qaydası |
FIN | Fərdi İdentifikasiya Nömrəsi — şəxsiyyət vəsiqəsindəki 7 simvollu unikal kod |
FK | Foreign Key — xarici açar, cədvəllər arası əlaqə |
FR | Functional Requirement — funksional tələb |
ICD-10 | International Classification of Diseases — beynəlxalq xəstəliklər təsnifatı |
İTS | İcbari Tibbi Sığorta |
MVP | Minimum Viable Product — minimum işlək məhsul |
NFR | Non-Functional Requirement — qeyri-funksional tələb |
OTP | One-Time Password — birdəfəlik SMS kodu |
PIN | Personal Identification Number — 4 rəqəmli giriş kodu |
PK | Primary Key — əsas açar |
RBAC | Role-Based Access Control — rola əsaslanan giriş nəzarəti |
SİMA | Sadə İmza — Azərbaycanın rəqəmsal kimlik doğrulama sistemi |
SLA | Service Level Agreement — xidmət səviyyəsi razılaşması |
TLS | Transport Layer Security — şəbəkə şifrələmə protokolu |
UC | Use Case — istifadə ssenarisi |
UUID | Universally Unique Identifier — qlobal unikal identifikator |
Slot | Həkimin cədvəlində bir randevu üçün ayrılmış konkret vaxt aralığı |
Soft lock | Slotun müvəqqəti (10 dəqiqə) bloklanması — pasient randevunu tamamlayana qədər |
No-show | Pasientin randevuya gəlməməsi |
Access grant | Pasientin həkimə verdiyi müddətli sənəd giriş icazəsi |
Booking reference | Randevunun unikal kodu — klinikada təqdim edilir |

# Aktyorlar (Actors)

Actor | Təsvir | Giriş səviyyəsi |
Guest (Qonaq) | Qeydiyyatdan keçməmiş ziyarətçi. Yalnız ümumi məlumatlandırma səhifələrini görür, həkim və klinika axtarışı edə bilir. Randevu almaq üçün qeydiyyatdan keçməlidir. | Public |
Patient (Pasient) | Qeydiyyatdan keçmiş və SİMA ilə şəxsiyyəti təsdiqlənmiş istifadəçi. Randevu alır, tibbi sənədlərini idarə edir, reseptlərini görür, rəy yazır. | Authenticated |
Doctor (Həkim) | Klinika admini tərəfindən sistemə əlavə edilmiş tibb mütəxəssisi. Öz profilini tənzimləyir, cədvəlini idarə edir, randevuları qəbul edir, resept yazır, pasient sənədlərinə (icazə ilə) baxır. Özü qeydiyyatdan keçə bilməz. | Clinic-scoped |
Clinic Admin | Bir konkret klinikanın idarəçisi. Yalnız öz klinikasının məlumatlarını görür və idarə edir: həkimlər, cədvəllər, xidmətlər, randevular. Tibbi məzmuna (sənəd, resept, diaqnoz) girişi yoxdur. | Clinic-scoped |
Super Admin | Platformanın sahibi. Klinikaları sistemə əlavə edir və verifikasiya edir, bütün istifadəçiləri idarə edir, məzmunu moderasiya edir, sistem parametrlərini təyin edir. | Global |
SİMA (External) | Rəqəmsal kimlik doğrulama sistemi. QR kod vasitəsilə üz tanıma və FIN yoxlaması aparır. | External |
Notification Service (External) | SMS, email və push bildirişlərin çatdırılması. | External |

## Rol iyerarxiyası və məhdudiyyətlər

Qayda | İzah |
Həkim özü qeydiyyatdan keçə bilməz | Əvvəlcə klinika platforma ilə müqavilə bağlayır → Super Admin klinikanı sistemə əlavə edir → klinika admini həkimi əlavə edir → həkim yalnız bundan sonra öz profilini tənzimləyir |
Müstəqil həkim mövcud deyil | Hər həkim mütləq ən azı bir klinikaya bağlı olmalıdır |
Həkim bir neçə klinikada işləyə bilər | Həkimin profil sazlamalarında birdən çox klinika göstərilə bilər, hər klinika üçün ayrıca cədvəl |
Clinic Admin tibbi məzmunu görmür | Sənəd, resept, diaqnoz, müayinə qeydləri — yalnız həkim və pasient üçün |
Clinic Admin yalnız öz klinikasını görür | Başqa klinikanın datasına giriş sistem səviyyəsində bloklanır |
Qiymət platformada göstərilmir | Müayinənin növü, şərtləri və dəyəri klinikada, qəbul zamanı müəyyən edilir |

# Səhifə xəritəsi (Site Map & Routes)

## Public (Guest üçün əlçatan)

Səhifə | Route | Use Case |
Ana səhifə | / | — |
Həkim axtarışı | /search/doctors | UC-201 |
Klinika axtarışı | /search/clinics | UC-202 |
Həkim detallı səhifəsi | /doctors/{doctorId} | UC-301 |
Klinika detallı səhifəsi | /clinics/{clinicId} | UC-302 |
Qeydiyyat | /register | UC-101 |
Giriş | /login | UC-102 |
PIN bərpası | /login/reset-pin | UC-103 |

## Patient (Authenticated)

Səhifə | Route | Use Case |
Şəxsi kabinet | /account | UC-104 |
Profil redaktəsi | /account/profile | UC-104 |
Parametrlər | /account/settings | UC-104 |
Randevu yaratma | /booking/{doctorId} | UC-401 |
Mənim randevularım | /account/appointments | UC-404 |
Randevu detalları | /account/appointments/{appointmentId} | UC-404 |
Tibbi sənədlərim | /account/documents | UC-501 |
Sənəd paylaşımları | /account/documents/shares | UC-502 |
Tibbi tarixçəm | /account/medical-history | UC-504 |
Reseptlərim | /account/prescriptions | UC-602 |
Bildirişlər | /account/notifications | UC-1001 |
Rəy yazma | /account/appointments/{appointmentId}/review | UC-1101 |

## Doctor Panel

Səhifə | Route | Use Case |
Həkim dashboard | /doctor | — |
Profil tənzimləmə | /doctor/profile | UC-701 |
Cədvəlim | /doctor/schedule | UC-702 |
Randevularım | /doctor/appointments | UC-703 |
Pasient sənədləri | /doctor/patients/{patientId}/documents | UC-503 |
Resept yazma | /doctor/appointments/{appointmentId}/prescription | UC-601 |

## Clinic Admin Panel

Səhifə | Route | Use Case |
Klinika dashboard | /clinic-admin | — |
Klinika profili | /clinic-admin/profile | UC-801 |
Həkimlər | /clinic-admin/doctors | UC-802 |
Həkim cədvəli | /clinic-admin/doctors/{doctorId}/schedule | UC-803 |
Xidmətlər | /clinic-admin/services | UC-804 |
Randevular | /clinic-admin/appointments | UC-805 |

## Super Admin Panel

Səhifə | Route | Use Case |
Klinikalar | /admin/clinics | UC-901 |
İstifadəçilər | /admin/users | UC-902 |
Rəy moderasiyası | /admin/moderation/reviews | UC-903 |
Sistem parametrləri | /admin/settings | UC-904 |
Audit log | /admin/audit-log | UC-904 |

# Model & Diagrams
Use Case Diagram, BPMN Flow (AS-IS / TO-BE), Sequence Diagram və ERD bu bölmədə yerləşdiriləcək.

# Use Cases

## Modul 1 — Authentication & User Management (100)

### UC-101 — Patient Registration

Use case ID | UC-101 |
Use case name | Patient Registration (Pasient qeydiyyatı) |
Description | Qeydiyyatdan keçməmiş istifadəçi telefon nömrəsi və FIN daxil edərək hesab yaradır. Şəxsiyyət SİMA sistemi vasitəsilə QR kod və üz tanıma ilə təsdiqlənir. Uğurlu doğrulamadan sonra istifadəçi PIN təyin edir və qeydiyyat tamamlanır. |
User type | Guest → Patient (Secondary: SİMA, SMS Gateway) |
Preconditions |
- İstifadəçi platformada hesaba malik deyil
- İstifadəçinin aktiv mobil nömrəsi və FIN-i var
- İstifadəçinin cihazında SİMA tətbiqi mövcuddur |
Extra info | Qeydiyyat prosesi başlamazdan əvvəl istifadəçinin olduğu səhifə (return URL) sessiyada saxlanılır. Qeydiyyat bitdikdən sonra istifadəçi həmin səhifəyə qaytarılır. |
Successful user flow |
- İstifadəçi "Qeydiyyatdan keç" düyməsini basır
- Sistem return URL-i sessiyada yadda saxlayır
- Sistem qeydiyyat formasını göstərir: telefon nömrəsi və FIN
- İstifadəçi telefon nömrəsini (+994XXXXXXXXX) və FIN-i daxil edir
- Sistem format validasiyası aparır
- Sistem mövcud hesab olub-olmadığını yoxlayır
- Sistem SMS Gateway vasitəsilə 6 rəqəmli OTP göndərir
- Sistem OTP daxiletmə ekranını göstərir (120 saniyə, geri sayım ilə)
- İstifadəçi OTP kodunu daxil edir
- Sistem OTP-ni yoxlayır və təsdiqləyir
- Sistem SİMA doğrulama sessiyası yaradır və QR kod göstərir
- Sistem QR kodun etibarlılıq müddətini (5 dəqiqə) geri sayım şəklində göstərir
- İstifadəçi SİMA tətbiqi ilə QR kodu skan edir
- SİMA üz tanıma (liveness detection) prosesini başladır
- İstifadəçi SİMA tətbiqində üz tanımanı tamamlayır
- SİMA üz məlumatını Dövlət Şəxsiyyət Bazasındakı FIN-ə aid şəkillə müqayisə edir
- SİMA success callback göndərir: FIN, ad, soyad, ata adı, doğum tarixi, cins
- Sistem callback-in rəqəmsal imzasını yoxlayır
- Sistem gələn məlumatlarla profili avtomatik doldurur
- Sistem PIN təyinetmə ekranını göstərir
- İstifadəçi 4 rəqəmli PIN daxil edir və təkrarlayır
- Sistem uyğunluğu yoxlayır və hash formada saxlayır
- Sistem biometrik giriş aktivləşdirmə təklifini göstərir
- Sistem məxfilik siyasəti və tibbi məlumatların emalına razılıq ekranını göstərir
- İstifadəçi razılığı təsdiqləyir
- Sistem hesabı "Verified" statusu ilə yaradır və sessiya açır
- Sistem istifadəçini return URL-ə qaytarır |
Alternative case 1: Randevu axınından qeydiyyat | İstifadəçi həkim səhifəsində "Randevu al" basır və qeydiyyatdan keçməyibsə, sistem return URL kimi /booking/{doctorId} saxlayır. Qeydiyyat bitdikdən sonra pasient birbaşa həmin randevu səhifəsinə qayıdır və prosesi davam etdirir. |
Alternative case 2: QR kodun yenilənməsi | QR kodun 5 dəqiqəlik müddəti bitərsə, sistem "QR kodun müddəti bitdi" mesajını və "Yenilə" düyməsini göstərir. İstifadəçi basır, sistem yeni sessiya və yeni QR yaradır. |
Error cases |
- EF-101-1 Mövcud hesab: Telefon və ya FIN ilə hesab varsa → login səhifəsinə yönləndirilir
- EF-101-2 Yanlış OTP: "Kod yanlışdır" xəbərdarlığı, yenidən cəhd imkanı
- EF-101-3 SİMA doğrulaması uğursuz: Error callback gəlir → hesab yaradılmır, məlumatlar silinir, ana səhifəyə qaytarılır
- EF-101-4 SİMA sessiyası yarımçıq: 5 dəqiqədən sonra sessiya bağlanır
- EF-101-5 SİMA əlçatan deyil: "Doğrulama xidməti hazırda əlçatan deyil"
- EF-101-6 SMS çatdırılmır: Xəta mesajı, yenidən cəhd
- EF-101-7 PIN uyğunsuzluğu: Xəbərdarlıq, PIN təyinetmə təkrarlanır
- EF-101-8 Zəif PIN: 1111, 1234, 0000 qəbul edilmir |
Business Rules |
- BR-101-01: Bir FIN ilə yalnız bir hesab yaradıla bilər
- BR-101-02: Bir telefon nömrəsi yalnız bir hesaba bağlana bilər
- BR-101-03: OTP etibarlılıq müddəti 120 saniyə
- BR-101-04: SİMA QR kodunun etibarlılıq müddəti 5 dəqiqə
- BR-101-05: SİMA success cavabı olmadan hesab yaradıla bilməz
- BR-101-06: PIN 4 rəqəmdən ibarətdir və hash formada saxlanılır
- BR-101-07: SİMA-dan gələn şəxsi məlumatlar redaktə edilə bilməz
- BR-101-08: Tibbi razılıq olmadan hesab aktivləşmir |
Features |
- FR-101-A — Data Entry & Validation (Məlumat daxiletmə və validasiya): telefon və FIN sahələri, format yoxlaması, mövcud hesab yoxlaması
- FR-101-B — OTP Verification (Telefon nömrəsinin təsdiqi): OTP göndərmə, geri sayım, təkrar göndərmə limiti, hash saxlama
- FR-101-C — SIMA Identity Verification (Şəxsiyyət doğrulaması): QR kod sessiyası, callback emalı, imza yoxlaması, profil avtodoldurma
- FR-101-D — PIN & Biometric Setup (Giriş təhlükəsizliyi): PIN təyini və təkrarı, zəif PIN bloklaması, biometrik aktivləşdirmə
- FR-101-E — Consent & Activation (Razılıq və hesabın aktivləşdirilməsi): məxfilik razılığı, hesab statusu, return URL-ə qaytarma |
Technical flow | |
Service type | REST API (sync) + SİMA callback (async) |
Database / Table name | |
UI link | /register |

### UC-102 — User Login

Use case ID | UC-102 |
Use case name | User Login (Sistemə giriş) |
Description | Qeydiyyatdan keçmiş istifadəçi telefon nömrəsi və PIN (və ya biometrik) ilə sistemə daxil olur və roluna uyğun panelə yönləndirilir. |
User type | Patient, Doctor, Clinic Admin, Super Admin |
Preconditions |
- İstifadəçinin aktiv hesabı var
- Hesab bloklanmayıb |
Successful user flow |
- İstifadəçi /login səhifəsinə daxil olur
- Sistem telefon nömrəsi sahəsini göstərir
- İstifadəçi telefon nömrəsini daxil edir
- Sistem hesabın mövcudluğunu və statusunu yoxlayır
- Sistem PIN daxiletmə ekranını göstərir
- İstifadəçi 4 rəqəmli PIN-i daxil edir
- Sistem PIN-i hash ilə müqayisə edir
- Sistem hesabın rolunu müəyyən edir
- Sistem sessiya token yaradır
- Sistem yeni cihazdan girişdirsə təhlükəsizlik bildirişi göndərir
- Sistem istifadəçini roluna uyğun səhifəyə yönləndirir: Patient → /account, Doctor → /doctor, Clinic Admin → /clinic-admin, Super Admin → /admin
- Sistem giriş əməliyyatını audit log-a yazır |
Alternative case 1: Biometrik giriş | İstifadəçi biometrikanı aktivləşdiribsə, sistem Face ID / barmaq izi doğrulamasını təklif edir. Uğurlu doğrulamada PIN tələb olunmur. |
Alternative case 2: Return URL ilə giriş | İstifadəçi qorunan səhifəyə girməyə çalışıb və login-ə yönləndirilibsə, uğurlu girişdən sonra həmin səhifəyə qaytarılır. |
Error cases |
- EF-102-1: Hesab tapılmır → "Bu nömrə ilə hesab tapılmadı", qeydiyyat təklif olunur
- EF-102-2: Yanlış PIN → xəta mesajı və qalan cəhd sayı
- EF-102-3: Hesab bloklanıb → girişə icazə verilmir, dəstəyə müraciət təklif olunur
- EF-102-4: 5 uğursuz cəhd → hesab 30 dəqiqə bloklanır, bildiriş göndərilir
- EF-102-5: Biometrik doğrulama uğursuz → PIN daxiletməyə keçir |
Business Rules |
- BR-102-01: Giriş üçün telefon nömrəsi və PIN tələb olunur
- BR-102-02: 5 uğursuz cəhddən sonra hesab 30 dəqiqə bloklanır
- BR-102-03: Hər istifadəçi roluna uyğun panelə yönləndirilir
- BR-102-04: Sessiya 15 dəqiqə fəaliyyətsizlikdən sonra bağlanır
- BR-102-05: Bütün giriş cəhdləri log-a yazılır |
Features |
- FR-102-A — Authentication (Autentifikasiya): telefon + PIN girişi, hash müqayisəsi, biometrik giriş, cəhd limiti və bloklama
- FR-102-B — Session & Routing (Sessiya və yönləndirmə): token yaratma, rola görə redirect, return URL, sessiya timeout, təhlükəsizlik bildirişi |
Technical flow | |
Service type | REST API (sync) |
Database / Table name | |
UI link | /login |

### UC-103 — PIN Reset & Account Recovery

Use case ID | UC-103 |
Use case name | PIN Reset & Account Recovery (PIN bərpası) |
Description | İstifadəçi PIN kodunu unutduqda OTP və SİMA doğrulaması vasitəsilə şəxsiyyətini təsdiqləyərək yeni PIN təyin edir. |
User type | Patient, Doctor, Clinic Admin |
Preconditions |
- İstifadəçinin aktiv hesabı var
- SİMA xidməti əlçatandır |
Successful user flow |
- İstifadəçi "PIN-i unutmusunuz?" linkinə klikləyir
- Sistem telefon nömrəsi daxiletmə ekranını göstərir
- İstifadəçi telefon nömrəsini daxil edir
- Sistem hesabın mövcudluğunu yoxlayır
- Sistem OTP göndərir
- İstifadəçi OTP-ni daxil edir və sistem təsdiqləyir
- Sistem SİMA doğrulama sessiyası yaradır və QR kod göstərir
- İstifadəçi QR kodu skan edib üz tanımanı keçir
- SİMA success callback göndərir
- Sistem SİMA-dan gələn FIN-i hesabdakı FIN ilə müqayisə edir
- Sistem yeni PIN təyinetmə ekranını göstərir
- İstifadəçi yeni PIN daxil edir və təkrarlayır
- Sistem yeni PIN-i hash formada saxlayır
- Sistem bütün aktiv sessiyaları bağlayır
- Sistem PIN dəyişikliyi bildirişi göndərir
- Sistem login səhifəsinə yönləndirir |
Error cases |
- EF-103-1: SİMA doğrulaması uğursuz → PIN dəyişikliyinə icazə verilmir
- EF-103-2: FIN uyğunsuzluğu → əməliyyat bloklanır, təhlükəsizlik log-una yazılır
- EF-103-3: Hesab tapılmır → "Bu nömrə ilə hesab tapılmadı" |
Business Rules |
- BR-103-01: PIN bərpası üçün həm OTP, həm SİMA doğrulaması tələb olunur
- BR-103-02: SİMA-dan gələn FIN hesabdakı FIN ilə eyni olmalıdır
- BR-103-03: PIN dəyişikliyindən sonra bütün aktiv sessiyalar bağlanır
- BR-103-04: Yeni PIN köhnə PIN ilə eyni ola bilməz |
Features |
- FR-103-A — Recovery Flow (Bərpa axını): OTP doğrulaması, SİMA doğrulaması, FIN uyğunluq yoxlaması, yeni PIN təyini, sessiyaların bağlanması, bildiriş |
Technical flow | |
Service type | REST API (sync) + SİMA callback (async) |
Database / Table name | |
UI link | /login/reset-pin |

### UC-104 — Profile Management

Use case ID | UC-104 |
Use case name | Profile Management (Profil idarəsi) |
Description | Pasient öz profil məlumatlarını, əlaqə vasitələrini, tibbi əsas məlumatlarını (qan qrupu, allergiyalar, xroniki xəstəliklər) və tətbiq parametrlərini idarə edir. |
User type | Patient |
Preconditions |
- Pasient sistemə daxil olub |
Successful user flow |
- Pasient /account/profile səhifəsinə daxil olur
- Sistem mövcud profil məlumatlarını göstərir
- Sistem SİMA-dan gələn sahələri (ad, soyad, FIN, doğum tarixi, cins) read-only göstərir
- Pasient redaktə oluna bilən sahələri dəyişir: profil fotosu, email, əlavə telefon, ünvan
- Pasient tibbi əsas məlumatları doldurur: qan qrupu, allergiyalar, xroniki xəstəliklər, daimi dərmanlar
- Pasient "Yadda saxla" düyməsini basır
- Sistem məlumatları validasiya edir
- Sistem dəyişiklikləri saxlayır və audit log-a yazır
- Sistem uğurlu yenilənmə mesajını göstərir |
Alternative case 1: Parametrlərin idarəsi | Pasient /account/settings səhifəsində bildiriş kanallarını, interfeys dilini, biometrik girişi və PIN-i idarə edir. |
Alternative case 2: Razılığın geri götürülməsi | Pasient tibbi məlumatların emalına razılığını geri götürür. Sistem xəbərdarlıq göstərir: bu halda tibbi funksiyalar (sənəd, resept) əlçatmaz olur. |
Error cases |
- EF-104-1: SİMA sahələrinin redaktəsi cəhdi → sistem imkan vermir
- EF-104-2: Yanlış email formatı → validasiya xətası
- EF-104-3: Aktiv randevu ilə hesab silmə → bloklanır, əvvəlcə randevu ləğvi tələb olunur |
Business Rules |
- BR-104-01: SİMA-dan gələn şəxsi məlumatlar redaktə edilə bilməz
- BR-104-02: Telefon nömrəsinin dəyişdirilməsi OTP doğrulaması tələb edir
- BR-104-03: Allergiya məlumatı resept yazılarkən həkimə göstərilir
- BR-104-04: Razılıq geri götürüldükdə tibbi funksiyalar bağlanır
- BR-104-05: Aktiv randevusu olan hesab silinə bilməz |
Features |
- FR-104-A — Profile Data (Profil məlumatları): SİMA sahələrinin qorunması, foto, email, əlavə telefon, ünvan, telefon dəyişikliyində OTP
- FR-104-B — Medical Profile (Tibbi profil): qan qrupu, allergiya siyahısı, xroniki xəstəliklər, daimi dərmanlar, təcili əlaqə şəxsi
- FR-104-C — Settings & Preferences (Parametrlər): bildiriş kanalları, dil seçimi, biometrik idarəsi, PIN dəyişikliyi, razılığın geri götürülməsi, hesabın silinməsi |
Technical flow | |
Service type | REST API (sync) |
Database / Table name | |
UI link | /account/profile, /account/settings |

## Modul 2 — Search & Discovery (200)

### UC-201 — Search Doctors

Use case ID | UC-201 |
Use case name | Search Doctors (Həkim axtarışı) |
Description | İstifadəçi axtarış səhifəsində "Həkim" rejimini seçərək ixtisas, klinika, şəhər, reytinq və digər parametrlər üzrə həkim axtarır. Axtarış qeydiyyat tələb etmir — Guest də istifadə edə bilər. Nəticə kartına klik edildikdə istifadəçi həkimin detallı səhifəsinə (UC-301) yönləndirilir. |
User type | Guest, Patient |
Preconditions |
- Sistemdə ən azı bir verifikasiya edilmiş klinika və aktiv həkim var
- İnternet bağlantısı mövcuddur |
Extra info | Axtarış səhifəsində rejim seçicisi var: [Həkim] / [Klinika]. Rejim dəyişdikdə filtr paneli tamamilə dəyişir. Filtr parametrləri URL-də saxlanılır (/search/doctors?specialty=cardiology&city=baku), beləliklə nəticə linki paylaşıla bilər. Qiymət filtri yoxdur — müayinənin dəyəri klinikada müəyyən edilir. |
Successful user flow |
- İstifadəçi axtarış səhifəsinə daxil olur
- Sistem axtarış rejimi seçicisini göstərir: [Həkim] / [Klinika] — default "Həkim"
- Sistem həkim rejiminə uyğun filtr panelini yükləyir
- Sistem default olaraq ən yüksək reytinqli həkimləri göstərir
- İstifadəçi ixtisas filtrini seçir (məsələn: Kardioloq)
- Sistem nəticələri filtrləyir və yeniləyir
- İstifadəçi şəhər/rayon filtrini tətbiq edir
- İstifadəçi əlavə filtrləri tətbiq edir: klinika, reytinq, cins, dil, təcrübə, boş vaxt
- Sistem bütün aktiv filtrləri birləşdirərək nəticələri real vaxtda yeniləyir
- Sistem aktiv filtrləri chip/tag şəklində göstərir
- Sistem hər nəticə kartında göstərir: foto, ad-soyad, ixtisas, klinika(lar), reytinq və rəy sayı, ən yaxın boş vaxt
- İstifadəçi nəticələri çeşidləyir (reytinq / təcrübə / ən yaxın boş vaxt)
- Sistem seçilmiş meyara görə yenidən sıralayır
- İstifadəçi uyğun həkimin kartına klikləyir
- Sistem istifadəçini /doctors/{doctorId} səhifəsinə yönləndirir (UC-301) |
Həkim rejiminin filtrləri |
- İxtisas (Specialty) — multi-select
- Şəhər / Rayon — multi-select
- Klinika — multi-select
- Minimum reytinq — 3+, 4+, 4.5+
- Cins — single select
- Danışdığı dil — multi-select
- İş təcrübəsi — range (il)
- Boş vaxt — Bu gün / Sabah / Bu həftə
- Akademik dərəcə — multi-select |
Alternative case 1: Ad üzrə axtarış | İstifadəçi axtarış sahəsinə həkimin adını yazır. Sistem yazıldıqca autocomplete təklifləri göstərir. İstifadəçi siyahıdan seçib birbaşa detallı səhifəyə keçir. |
Alternative case 2: Klinika rejiminə keçid | İstifadəçi seçicidə "Klinika" rejiminə keçirsə, sistem filtr panelini tamamilə dəyişir və UC-202-yə keçir. Mövcud axtarış mətni saxlanılır. |
Alternative case 3: Klinikadan gələn axtarış | İstifadəçi klinika səhifəsindən "Bu klinikanın həkimləri" linkinə klikləyirsə, sistem /search/doctors?clinicId={id} linki ilə klinika filtri əvvəlcədən tətbiq edilmiş şəkildə axtarış səhifəsini açır. |
Error cases |
- EF-201-1: Nəticə tapılmır → "Axtarışınıza uyğun nəticə tapılmadı" + təkliflər (qonşu rayonlar, filtri azaldın)
- EF-201-2: Axtarış servisi cavab vermir → "Axtarış hazırda mümkün deyil" + yenidən cəhd düyməsi
- EF-201-3: Deaktiv həkim linki → "Bu həkim hazırda qəbul aparmır" + oxşar həkimlər təklif olunur |
Business Rules |
- BR-201-01: Axtarış qeydiyyat tələb etmir, Guest də istifadə edə bilər
- BR-201-02: Yalnız verifikasiya edilmiş klinikaya bağlı və "Active" statuslu həkimlər göstərilir
- BR-201-03: Klinika admini tərəfindən deaktiv edilmiş həkim nəticələrdə görünmür
- BR-201-04: Reytinq yalnız dərc olunmuş rəylər əsasında hesablanır
- BR-201-05: Axtarış nəticələrində qiymət göstərilmir
- BR-201-06: Nəticələr səhifələnir, bir səhifədə maksimum 20 nəticə
- BR-201-07: Filtr parametrləri URL-də saxlanılır |
Features |
- FR-201-A — Search Mode & Query (Axtarış rejimi və sorğu): rejim seçicisi, ad üzrə axtarış, autocomplete, fuzzy search, Guest girişi
- FR-201-B — Doctor Filters (Həkim filtrləri): ixtisas, şəhər, klinika, reytinq, cins, dil, təcrübə, boş vaxt, akademik dərəcə, chip göstərimi, URL-də saxlama
- FR-201-C — Results Display (Nəticələrin göstərilməsi): kart məlumatları, səhifələmə, çeşidləmə, skeleton loading, boş nəticə təklifləri, detallı səhifəyə keçid |
Technical flow | |
Service type | REST API (sync), indekslənmiş axtarış |
Database / Table name | |
UI link | /search/doctors |

### UC-202 — Search Clinics

Use case ID | UC-202 |
Use case name | Search Clinics (Klinika axtarışı) |
Description | İstifadəçi axtarış səhifəsində "Klinika" rejimini seçərək ünvan, klinika növü, xidmət növü, mövcud ixtisaslar və iş rejimi üzrə klinika axtarır. Klinika rejiminin filtrləri həkim rejimindən tamamilə fərqlidir. |
User type | Guest, Patient |
Preconditions |
- Sistemdə ən azı bir verifikasiya edilmiş aktiv klinika var |
Successful user flow |
- İstifadəçi axtarış səhifəsində "Klinika" rejimini seçir
- Sistem filtr panelini klinika filtrləri ilə əvəz edir
- Sistem default olaraq ən yüksək reytinqli klinikaları göstərir
- İstifadəçi şəhər/rayon filtrini seçir
- Sistem nəticələri filtrləyir
- İstifadəçi əlavə filtrləri tətbiq edir: klinika növü, mövcud ixtisaslar, xidmətlər, iş rejimi, reytinq
- Sistem nəticələri real vaxtda yeniləyir
- Sistem hər kartda göstərir: klinika loqosu/fotosu, adı, növü, ünvanı, iş saatları, reytinq, mövcud ixtisas sayı, həkim sayı
- İstifadəçi nəticələri çeşidləyir (reytinq / həkim sayı / məsafə)
- İstifadəçi klinika kartına klikləyir
- Sistem istifadəçini /clinics/{clinicId} səhifəsinə yönləndirir (UC-302) |
Klinika rejiminin filtrləri |
- Şəhər / Rayon — multi-select
- Klinika növü — poliklinika, xəstəxana, diaqnostik mərkəz, dental klinika, laboratoriya
- Mövcud ixtisaslar — multi-select
- Xidmətlər — analiz, USM, MRT, KT, rentgen, əməliyyat
- İş rejimi — 24/7, həftə sonu açıq, axşam qəbulu
- Minimum reytinq — single select
- Sığorta qəbulu — multi-select |
Alternative case 1: Klinika adı üzrə axtarış | İstifadəçi klinika adını yazır, autocomplete təklifləri göstərilir. |
Alternative case 2: İxtisas üzrə klinika axtarışı | İstifadəçi konkret ixtisası (məsələn nevrologiya) seçir, sistem yalnız həmin ixtisas üzrə həkimi olan klinikaları göstərir. |
Error cases |
- EF-202-1: Nəticə tapılmır → alternativ təkliflər
- EF-202-2: Deaktiv klinika linki → "Bu klinika hazırda platformada aktiv deyil"
- EF-202-3: Xəritə servisi əlçatan deyil → siyahı görünüşünə qayıdır |
Business Rules |
- BR-202-01: Yalnız Super Admin tərəfindən verifikasiya edilmiş klinikalar göstərilir
- BR-202-02: Deaktiv edilmiş klinika nəticələrdə görünmür
- BR-202-03: Klinika reytinqi ona bağlı həkimlərin reytinqlərinin orta göstəricisidir
- BR-202-04: Klinikada ən azı bir aktiv həkim olmalıdır ki, nəticələrdə görünsün
- BR-202-05: Klinika filtrləri həkim filtrlərindən tam fərqlidir |
Features |
- FR-202-A — Clinic Search (Klinika axtarışı): klinika rejimi, ad üzrə axtarış, autocomplete, filtr panelinin dəyişməsi, Guest girişi
- FR-202-B — Clinic Filters (Klinika filtrləri): şəhər, klinika növü, ixtisaslar, xidmətlər, iş rejimi, reytinq, sığorta
- FR-202-C — Clinic Results Display (Nəticələrin göstərilməsi): kart məlumatları, xəritə görünüşü, çeşidləmə, detallı səhifəyə keçid |
Technical flow | |
Service type | REST API (sync) |
Database / Table name | |
UI link | /search/clinics |

## Modul 3 — Detailed Pages (300)

### UC-301 — View Doctor Detail Page

Use case ID | UC-301 |
Use case name | View Doctor Detail Page (Həkim detallı səhifəsi) |
Description | İstifadəçi həkimin tam profilini görür: peşəkar məlumat, işlədiyi klinikalar, göstərdiyi xidmətlər, boş vaxt cədvəli, pasient rəyləri. Bu səhifədən randevu prosesi başlayır. |
User type | Guest, Patient |
Preconditions |
- Həkim mövcud, aktiv və verifikasiya edilmiş klinikaya bağlıdır |
Extra info | Səhifə bloklardan ibarətdir: Başlıq, Haqqında, Klinikalar, Xidmətlər, Cədvəl, Rəylər. Həkim bir neçə klinikada işləyirsə, hər klinika üçün ayrıca cədvəl göstərilir. Qiymət göstərilmir — müayinənin dəyəri klinikada müəyyən edilir. |
Successful user flow |
- İstifadəçi axtarış nəticəsindən və ya birbaşa link ilə səhifəyə daxil olur
- Sistem həkimin mövcudluğunu və aktiv statusunu yoxlayır
- Sistem Başlıq blokunu göstərir: foto, ad-soyad, ixtisas, akademik dərəcə, reytinq və rəy sayı
- Sistem Haqqında blokunu göstərir: bio, təhsil, iş təcrübəsi, ixtisaslaşma sahələri, dillər, sertifikatlar
- Sistem Klinikalar blokunu göstərir: həkimin işlədiyi bütün klinikalar, ünvan və xəritə keçidi
- Sistem Xidmətlər blokunu göstərir: hər klinika üzrə həkimin göstərdiyi xidmətlər və təxmini müddət
- Sistem Cədvəl blokunu göstərir: yaxın 7 günün boş vaxtları, klinika üzrə ayrılmış
- Sistem Rəylər blokunu göstərir: reytinq paylanması, son rəylər, səhifələmə
- İstifadəçi klinika seçir (bir neçə klinikada işləyirsə)
- Sistem seçilmiş klinikaya uyğun xidmətləri və cədvəli göstərir
- İstifadəçi "Randevu al" düyməsini basır
- Sistem istifadəçinin autentifikasiya statusunu yoxlayır
- Qeydiyyatlıdırsa /booking/{doctorId} səhifəsinə yönləndirir (UC-401) |
Alternative case 1: Guest randevu cəhdi | İstifadəçi Guest-dirsə, sistem return URL kimi cari səhifəni saxlayır və /register səhifəsinə yönləndirir (UC-101). Qeydiyyat bitdikdən sonra istifadəçi avtomatik olaraq randevu səhifəsinə qaytarılır. |
Alternative case 2: Slotdan birbaşa randevu | İstifadəçi cədvəl blokunda konkret slota klikləyirsə, sistem həmin slot əvvəlcədən seçilmiş şəkildə randevu səhifəsinə keçir. |
Error cases |
- EF-301-1: Həkim tapılmır → 404 səhifəsi, axtarışa qayıtmaq təklifi
- EF-301-2: Həkim deaktivdir → "Bu həkim hazırda qəbul aparmır" + alternativ həkimlər
- EF-301-3: Boş vaxt yoxdur → "Yaxın 7 gündə boş yer yoxdur" + növbəti mövcud tarix
- EF-301-4: Klinika deaktivdir → həmin klinika üzrə slotlar göstərilmir |
Business Rules |
- BR-301-01: Detallı səhifə qeydiyyat tələb etmir, Guest də baxa bilər
- BR-301-02: Randevu almaq üçün qeydiyyat mütləqdir
- BR-301-03: Həkim bir neçə klinikada işləyirsə, hər klinika üçün ayrıca cədvəl göstərilir
- BR-301-04: Yalnız moderasiyadan keçmiş rəylər göstərilir
- BR-301-05: Cədvəl blokunda yalnız gələcək boş slotlar göstərilir
- BR-301-06: Qiymət göstərilmir — müayinənin dəyəri klinikada müəyyən edilir |
Features |
- FR-301-A — Profile Information (Profil məlumatları): foto, ad, ixtisas, reytinq, bio, təhsil, təcrübə, dillər, sertifikatlar
- FR-301-B — Clinics & Services (Klinikalar və xidmətlər): klinika siyahısı, ünvan və xəritə, klinika üzrə xidmətlər, klinika seçimi, klinika səhifəsinə keçid
- FR-301-C — Schedule Display (Cədvəlin göstərilməsi): 7 günlük boş vaxtlar, klinika üzrə ayırma, real vaxt yeniləmə, slotdan birbaşa keçid
- FR-301-D — Reviews & Actions (Rəylər və əməliyyatlar): rəy siyahısı, reytinq paylanması, çeşidləmə, "Randevu al" düyməsi, Guest yönləndirməsi, favoritlər |
Technical flow | |
Service type | REST API (sync) |
Database / Table name | |
UI link | /doctors/{doctorId} |

### UC-302 — View Clinic Detail Page

Use case ID | UC-302 |
Use case name | View Clinic Detail Page (Klinika detallı səhifəsi) |
Description | İstifadəçi klinikanın tam profilini görür: haqqında məlumat, ünvan və xəritə, iş saatları, xidmətlər, orada işləyən həkimlərin siyahısı və rəylər. |
User type | Guest, Patient |
Preconditions |
- Klinika mövcud, verifikasiya edilmiş və aktivdir |
Successful user flow |
- İstifadəçi axtarış nəticəsindən və ya link ilə səhifəyə daxil olur
- Sistem klinikanın mövcudluğunu və statusunu yoxlayır
- Sistem Başlıq blokunu göstərir: loqo, ad, növ, reytinq, rəy sayı
- Sistem Haqqında blokunu göstərir: təsvir, təsis tarixi, ixtisas sahələri
- Sistem Əlaqə blokunu göstərir: ünvan, xəritə, telefon, email, veb sayt
- Sistem İş saatları blokunu göstərir: həftənin günləri üzrə iş rejimi
- Sistem Xidmətlər blokunu göstərir: klinikanın təklif etdiyi xidmətlər
- Sistem Həkimlər blokunu göstərir: klinikada işləyən aktiv həkimlər (foto, ad, ixtisas, reytinq, ən yaxın boş vaxt)
- Sistem Fotoqalereya və Rəylər bloklarını göstərir
- İstifadəçi həkimlər blokunda ixtisas üzrə filtr tətbiq edir
- İstifadəçi həkim kartına klikləyir
- Sistem /doctors/{doctorId} səhifəsinə yönləndirir (UC-301) |
Alternative case 1: Bütün həkimlərə keçid | İstifadəçi "Bütün həkimləri gör" linkinə klikləyirsə, sistem /search/doctors?clinicId={id} səhifəsini açır (klinika filtri tətbiq edilmiş). |
Alternative case 2: Xəritədə naviqasiya | İstifadəçi ünvana klikləyir, xarici xəritə tətbiqi naviqasiya ilə açılır. |
Error cases |
- EF-302-1: Klinika tapılmır → 404 səhifəsi
- EF-302-2: Klinika deaktivdir → "Bu klinika hazırda platformada aktiv deyil"
- EF-302-3: Aktiv həkim yoxdur → "Hazırda bu klinikada qəbul aparan həkim yoxdur" |
Business Rules |
- BR-302-01: Klinika səhifəsi qeydiyyat tələb etmir
- BR-302-02: Yalnız aktiv statuslu həkimlər siyahıda göstərilir
- BR-302-03: Klinika reytinqi ona bağlı həkimlərin reytinqlərindən hesablanır
- BR-302-04: Randevu birbaşa klinikadan deyil, konkret həkim seçilməklə alınır
- BR-302-05: Klinika deaktiv edildikdə bütün həkimləri də axtarışdan çıxarılır |
Features |
- FR-302-A — Clinic Information (Klinika məlumatları): ad, loqo, növ, təsvir, reytinq, ünvan və xəritə, əlaqə, iş saatları, fotoqalereya
- FR-302-B — Services & Doctors (Xidmətlər və həkimlər): xidmət siyahısı, aktiv həkimlər, ixtisas filtri, həkim səhifəsinə keçid, bütün həkimlərə keçid
- FR-302-C — Reviews (Rəylər): klinika rəyləri, reytinq hesablaması, moderasiya filtri |
Technical flow | |
Service type | REST API (sync) |
Database / Table name | |
UI link | /clinics/{clinicId} |

## Modul 4 — Appointment Management (400)

### UC-401 — Book Appointment

Use case ID | UC-401 |
Use case name | Book Appointment (Randevu yaratmaq) |
Description | Pasient seçdiyi həkimin boş vaxtlarından birini seçərək randevu yaradır. Ödəniş platformada aparılmır — müayinənin şərtləri və dəyəri klinikada müəyyən edilir. Bu, platformanın əsas dəyər yaradan prosesidir və manual telefon randevusunu əvəz edir. |
User type | Patient (Secondary: Doctor, Notification Service) |
Preconditions |
- Pasient sistemə daxil olub və hesabı "Verified" statusundadır
- Həkim aktiv və verifikasiya edilmiş klinikaya bağlıdır
- Həkimin ən azı bir boş slotu var |
Extra info | Slot seçildikdə soft lock (10 dəqiqə) tətbiq olunur ki, iki pasient eyni vaxtı tuta bilməsin. Randevu təsdiqləndikdə slot daimi bloklanır və unikal booking reference yaradılır — pasient bunu klinikada təqdim edir. |
Successful user flow |
- Pasient həkim səhifəsində "Randevu al" düyməsini basır
- Sistem autentifikasiyanı yoxlayır
- Sistem /booking/{doctorId} səhifəsini açır
- Sistem həkim bir neçə klinikada işləyirsə klinika seçimini göstərir
- Pasient klinikanı seçir
- Sistem seçilmiş klinika üzrə xidmət siyahısını göstərir
- Pasient xidmət növünü seçir (ilkin müayinə, təkrar müayinə, konsultasiya)
- Sistem seçilmiş xidmətin müddətinə uyğun boş slotları hesablayır
- Sistem təqvimi göstərir: boş günlər aktiv, dolu/bağlı günlər deaktiv
- Pasient tarixi seçir
- Sistem həmin gün üçün boş saat slotlarını göstərir
- Pasient saat slotunu seçir
- Sistem slotu soft lock edir (10 dəqiqə)
- Sistem geri sayım taymerini göstərir
- Pasient şikayət/qeyd sahəsini doldurur (optional)
- Pasient tibbi sənəd əlavə etmək istəyirsə seçir (optional)
- Sistem randevu xülasəsini göstərir: həkim, klinika, ünvan, tarix, saat, xidmət
- Sistem "Müayinənin dəyəri klinikada müəyyən edilir" qeydini göstərir
- Pasient "Randevunu təsdiqlə" düyməsini basır
- Sistem slot statusunu yenidən yoxlayır
- Sistem biznes qaydalarını yoxlayır (eyni gündə təkrar randevu, no-show limiti)
- Sistem randevunu yaradır və unikal booking reference təyin edir
- Sistem slot statusunu "booked" edir
- Sistem həkimin təsdiq rejiminə görə status təyin edir: avtomatik → "confirmed", manual → "pending"
- Sistem əlavə edilmiş sənədlər üçün həkimə avtomatik giriş icazəsi yaradır
- Sistem pasientə təsdiq bildirişi göndərir
- Sistem həkimə yeni randevu bildirişi göndərir
- Sistem xatırlatmaları planlaşdırır (24 saat və 2 saat əvvəl)
- Sistem pasienti randevu detalları səhifəsinə yönləndirir |
Alternative case 1: Guest randevu cəhdi | İstifadəçi qeydiyyatdan keçməyibsə, sistem return URL kimi /booking/{doctorId} saxlayır və qeydiyyata yönləndirir (UC-101). Qeydiyyat bitdikdən sonra pasient bu səhifəyə qaytarılır və prosesi davam etdirir. |
Alternative case 2: Həkim manual təsdiq rejimində | Randevu "pending" statusu ilə yaradılır, həkimə təsdiq sorğusu göndərilir. Pasientə "Həkimin təsdiqi gözlənilir" mesajı göstərilir. |
Alternative case 3: Sənəd əlavə etmə | Pasient mövcud tibbi sənədlərindən seçir. Sistem randevu yaradıldıqda həmin sənədlər üçün həkimə avtomatik giriş icazəsi yaradır (müddət: randevu tarixindən 7 gün sonraya qədər). |
Error cases |
- EF-401-1 Slot artıq tutulub: İki pasient eyni anda seçərsə, yalnız birincinin lock-u qəbul edilir, ikinciyə "Bu vaxt artıq doludur" göstərilir
- EF-401-2 Soft lock müddəti bitib: 10 dəqiqə keçərsə lock buraxılır, "Vaxtınız bitdi, yenidən seçin"
- EF-401-3 Eyni gündə təkrar randevu: "Bu həkimlə həmin gün üçün artıq randevunuz var"
- EF-401-4 No-show limiti aşılıb: "Təkrar gəlməmə hallarına görə klinika ilə birbaşa əlaqə saxlayın"
- EF-401-5 Həkim cədvəli dəyişib: "Bu vaxt artıq mövcud deyil" + təqvim yenilənir
- EF-401-6 Klinika deaktiv edilib: Randevu yaradılmır, müvafiq mesaj göstərilir
- EF-401-7 Keçmiş tarix seçimi: Keçmiş tarixlər seçilə bilməyən göstərilir
- EF-401-8 Minimum əvvəlcədən bildirim: Randevuya 1 saatdan az qalıbsa slot seçilə bilməz |
Business Rules |
- BR-401-01: Randevu almaq üçün qeydiyyat və SİMA doğrulaması mütləqdir
- BR-401-02: Bir slot yalnız bir pasientə təyin edilə bilər (double-booking qadağandır)
- BR-401-03: Slot seçildikdən sonra 10 dəqiqə soft lock tətbiq olunur
- BR-401-04: Keçmiş tarixə randevu yaradıla bilməz
- BR-401-05: Randevu ən azı 1 saat əvvəldən yaradılmalıdır
- BR-401-06: Pasientin eyni həkimlə eyni gündə birdən çox aktiv randevusu ola bilməz
- BR-401-07: Ödəniş və qiymət platformada deyil, klinikada müəyyən edilir
- BR-401-08: Randevu yaradıldıqda avtomatik xatırlatmalar planlaşdırılır
- BR-401-09: Hər randevuya unikal booking reference təyin edilir
- BR-401-10: No-show sayı 3-dən çox olan pasient üçün randevu məhdudlaşdırıla bilər |
Features |
- FR-401-A — Booking Initiation (Randevunun başlanması): autentifikasiya yoxlaması, Guest yönləndirməsi, klinika seçimi, xidmət seçimi
- FR-401-B — Slot Selection & Locking (Vaxt seçimi və bloklama): real vaxt slotlar, soft lock, geri sayım, paralel sorğu idarəsi, keçmiş tarix bloklaması
- FR-401-C — Booking Details (Randevu detalları): xülasə göstərimi, şikayət/qeyd, sənəd əlavə etmə, avtomatik giriş icazəsi
- FR-401-D — Booking Creation & Validation (Yaratma və validasiya): slot yenidən yoxlaması, təkrar randevu bloklaması, no-show limiti, booking reference, status təyini
- FR-401-E — Post-Booking Actions (Sonrakı əməliyyatlar): bildirişlər, xatırlatmaların planlaşdırılması, siyahılara əlavə, təqvimə əlavə |
Technical flow | |
Service type | REST API (sync) + async bildiriş |
Database / Table name | |
UI link | /booking/{doctorId} |

### UC-402 — Cancel Appointment

Use case ID | UC-402 |
Use case name | Cancel Appointment (Randevunun ləğvi) |
Description | Pasient, həkim və ya klinika admini mövcud randevunu ləğv edir. Boşalan slot sistemə qaytarılır və hər iki tərəf xəbərdar edilir. |
User type | Patient, Doctor, Clinic Admin |
Preconditions |
- Randevu "Pending" və ya "Confirmed" statusundadır
- Randevu vaxtı keçməyib |
Successful user flow |
- Pasient /account/appointments səhifəsinə daxil olur
- Sistem aktiv randevuların siyahısını göstərir
- Pasient randevunu açır
- Sistem randevu detallarını və mövcud əməliyyatları göstərir
- Pasient "Randevunu ləğv et" düyməsini basır
- Sistem ləğv siyasətini yoxlayır (randevuya qalan vaxt)
- Sistem təsdiq dialoqunu göstərir və ləğv səbəbi seçimini tələb edir
- Pasient səbəbi seçir və ya yazır
- Pasient "Təsdiqlə" düyməsini basır
- Sistem randevu statusunu "cancelled" edir
- Sistem ləğv edən şəxsi, səbəbi və tarixi qeyd edir
- Sistem slot statusunu "available" edir
- Sistem planlaşdırılmış xatırlatmaları ləğv edir
- Sistem randevu ilə bağlı sənəd icazələrini ləğv edir
- Sistem həkimə "Randevu ləğv edildi" bildirişi göndərir
- Sistem pasientə ləğv təsdiqi bildirişi göndərir
- Sistem status tarixçəsi qeydi yaradır və audit log-a yazır |
Alternative case 1: Həkim tərəfindən ləğv | Həkim öz panelindən randevunu ləğv edir. Sistem səbəb tələb edir, pasientə üzr bildirişi göndərir və alternativ boş vaxtları təklif edir. Pasientin no-show statistikasına təsir etmir. |
Alternative case 2: Toplu ləğv | Klinika admini bir həkimin konkret gündəki bütün randevularını birdən ləğv edir (məsələn həkimin xəstələnməsi). Sistem hər pasientə ayrıca bildiriş göndərir. |
Error cases |
- EF-402-1: Randevu vaxtı keçib → ləğv düyməsi göstərilmir
- EF-402-2: Randevu artıq ləğv edilib → "Bu randevu artıq ləğv edilib"
- EF-402-3: Randevu tamamlanıb → "Completed" statuslu randevu ləğv edilə bilməz
- EF-402-4: Çox gec ləğv → randevuya 1 saatdan az qalıbsa online ləğv mümkün deyil, klinika ilə əlaqə tövsiyə olunur |
Business Rules |
- BR-402-01: Keçmiş və ya tamamlanmış randevu ləğv edilə bilməz
- BR-402-02: Randevuya 1 saatdan az qalıbsa online ləğv mümkün deyil
- BR-402-03: Ləğv səbəbi məcburi qeyd olunmalıdır
- BR-402-04: Ləğv edilən slot dərhal boş elan olunur
- BR-402-05: Ləğv edilmiş randevu silinmir, statusu dəyişir və tarixçədə qalır
- BR-402-06: Ləğv zamanı bütün planlaşdırılmış xatırlatmalar ləğv olunur
- BR-402-07: Randevu ilə bağlı sənəd icazələri ləğv zamanı bağlanır
- BR-402-08: Həkim/klinika tərəfindən ləğv pasientin no-show statistikasına təsir etmir |
Features |
- FR-402-A — Cancellation Process (Ləğvetmə prosesi): pasient/həkim/admin ləğvi, səbəb tələbi, təsdiq dialoqu, vaxt məhdudiyyəti, toplu ləğv
- FR-402-B — Post-Cancellation Actions (Sonrakı əməliyyatlar): slotun boşaldılması, bildirişlər, xatırlatmaların ləğvi, sənəd icazələrinin bağlanması, tarixçə qeydi |
Technical flow | |
Service type | REST API (sync) + async bildiriş |
Database / Table name | |
UI link | /account/appointments/{appointmentId} |

### UC-403 — Reschedule Appointment

Use case ID | UC-403 |
Use case name | Reschedule Appointment (Randevunun vaxtının dəyişdirilməsi) |
Description | Randevunu ləğv etmədən başqa boş vaxta köçürmək. Köhnə slot boşalır, yenisi bloklanır, xatırlatmalar yenilənir. |
User type | Patient, Doctor, Clinic Admin |
Preconditions |
- Randevu aktiv statusdadır
- Reschedule limiti aşılmayıb (maksimum 2 dəfə)
- Həkimin başqa boş slotu mövcuddur |
Successful user flow |
- Pasient randevu detallarında "Vaxtı dəyiş" düyməsini basır
- Sistem reschedule sayğacını yoxlayır (limit: 2)
- Sistem randevuya qalan vaxtı yoxlayır (minimum 2 saat)
- Sistem həkimin eyni klinikadakı boş slotlarını göstərir
- Pasient yeni tarix seçir
- Sistem həmin gün üçün boş saatları göstərir
- Pasient yeni saat slotunu seçir
- Sistem yeni slotu soft lock edir (10 dəqiqə)
- Sistem dəyişiklik xülasəsini göstərir: köhnə vaxt → yeni vaxt
- Pasient "Təsdiqlə" düyməsini basır
- Sistem yeni slotun hələ də lock olunduğunu yoxlayır
- Sistem köhnə slotu "available" edir
- Sistem yeni slotu "booked" edir
- Sistem randevu qeydini yeni tarix və saatla yeniləyir
- Sistem reschedule sayğacını 1 artırır
- Sistem köhnə xatırlatmaları ləğv edir və yeni vaxta uyğun planlaşdırır
- Sistem hər iki tərəfə bildiriş göndərir
- Sistem status tarixçəsinə qeyd yazır və audit log-a yazır |
Alternative case 1: Həkim tərəfindən köçürmə | Həkim və ya klinika admini randevunu başqa vaxta köçürür. Pasientə xüsusi bildiriş göndərilir və pasient yeni vaxtı təsdiqləmək və ya ləğv etmək imkanı alır. |
Alternative case 2: Başqa klinikaya köçürmə | Həkim bir neçə klinikada işləyirsə, pasient randevunu başqa klinikaya köçürə bilər. Sistem yeni klinikanın şərtləri barədə məlumat verir. |
Error cases |
- EF-403-1: Reschedule limiti aşılıb → "Bu randevunu daha dəyişmək mümkün deyil" + ləğv edib yenisini yaratmaq təklifi
- EF-403-2: Çox az vaxt qalıb → randevuya 2 saatdan az qalıbsa köçürmə mümkün deyil
- EF-403-3: Yeni slot tutulub → "Bu vaxt artıq doludur", köhnə randevu qorunur
- EF-403-4: Boş slot yoxdur → "Bu həkimin yaxın vaxtda boş yeri yoxdur" |
Business Rules |
- BR-403-01: Bir randevu maksimum 2 dəfə köçürülə bilər
- BR-403-02: Randevuya 2 saatdan az qalıbsa köçürmə mümkün deyil
- BR-403-03: Köhnə slot yalnız yeni slot təsdiqləndikdən sonra buraxılır
- BR-403-04: Köçürmə zamanı randevu statusu dəyişmir
- BR-403-05: Xatırlatmalar yeni vaxta uyğun yenidən planlaşdırılır
- BR-403-06: Həkim tərəfindən köçürmə pasientin təsdiqini tələb edir |
Features |
- FR-403-A — Reschedule Process (Köçürmə prosesi): limit yoxlaması, vaxt məhdudiyyəti, boş slot göstərimi, soft lock, dəyişiklik xülasəsi
- FR-403-B — Post-Reschedule Actions (Sonrakı əməliyyatlar): xatırlatmaların yenilənməsi, bildirişlər, tarixçə qeydi, pasient təsdiqi |
Technical flow | |
Service type | REST API (sync) + async bildiriş |
Database / Table name | |
UI link | /account/appointments/{appointmentId} |

### UC-404 — My Appointments

Use case ID | UC-404 |
Use case name | My Appointments (Randevularımın idarəsi) |
Description | Pasient bütün randevularını (aktiv, keçmiş, ləğv edilmiş) görür, detallarına baxır və əməliyyat aparır. |
User type | Patient |
Preconditions |
- Pasient sistemə daxil olub |
Successful user flow |
- Pasient /account/appointments səhifəsinə daxil olur
- Sistem randevuları tab-lar üzrə qruplaşdırır: Yaxınlaşan / Keçmiş / Ləğv edilmiş
- Sistem default olaraq "Yaxınlaşan" tabını açır
- Sistem hər kartda göstərir: həkim foto və adı, ixtisas, klinika, tarix və saat, status badge, booking reference
- Pasient randevu kartına klikləyir
- Sistem randevu detalları səhifəsini açır
- Sistem tam detalları göstərir: həkim, klinika, ünvan və xəritə, tarix, saat, xidmət, pasient qeydi, booking reference və QR kod
- Sistem statusa uyğun əməliyyat düymələrini göstərir: Ləğv et, Vaxtı dəyiş, Təqvimə əlavə et, Rəy yaz, Yol tarifi
- Pasient uyğun əməliyyatı seçir |
Alternative case 1: Keçmiş randevular | Pasient "Keçmiş" tabına keçir. Sistem tamamlanmış randevuları göstərir, hər birində "Rəy yaz" (əgər hələ yazmayıbsa) və "Reseptə bax" (əgər varsa) keçidləri olur. |
Alternative case 2: Sənəd əlavə etmə | Pasient yaxınlaşan randevuya sonradan tibbi sənəd əlavə edir və həkimə giriş icazəsi verir. |
Error cases |
- EF-404-1: Randevu yoxdur → empty state göstərilir, "Həkim tap" düyməsi ilə axtarışa yönləndirilir
- EF-404-2: Randevu tapılmır → yanlış ID ilə keçid halında 404 səhifəsi
- EF-404-3: Başqasının randevusu → sistem girişi bloklayır və təhlükəsizlik log-una yazır |
Business Rules |
- BR-404-01: Pasient yalnız öz randevularını görə bilər
- BR-404-02: Randevular üç kateqoriyaya bölünür: yaxınlaşan, keçmiş, ləğv edilmiş
- BR-404-03: Əməliyyat düymələri randevu statusuna görə göstərilir
- BR-404-04: Rəy yazma düyməsi yalnız tamamlanmış və rəy yazılmamış randevularda görünür
- BR-404-05: Booking reference QR kod şəklində göstərilir (klinikada təqdim etmək üçün)
- BR-404-06: Keçmiş randevular silinmir, arxivdə qalır |
Features |
- FR-404-A — Appointment List (Randevu siyahısı): tab qruplaşdırma, kart məlumatları, status badge, çeşidləmə, filtrləmə, empty state, giriş məhdudiyyəti
- FR-404-B — Appointment Details (Randevu detalları): tam məlumat, ünvan və xəritə, booking reference və QR kod, əməliyyat düymələri, təqvimə əlavə, reseptə keçid, sənəd əlavə etmə |
Technical flow | |
Service type | REST API (sync) |
Database / Table name | |
UI link | /account/appointments, /account/appointments/{appointmentId} |

### UC-405 — Appointment Completion & No-Show

Use case ID | UC-405 |
Use case name | Appointment Completion & No-Show (Randevunun tamamlanması) |
Description | Randevu baş tutduqdan sonra həkim onu "Completed" kimi işarələyir və ya pasient gəlmədikdə "No-show" kimi qeyd edir. Bu status pasientin rəy yazmaq hüququnu və statistikanı müəyyən edir. |
User type | Doctor, Clinic Admin, System |
Preconditions |
- Randevu "Confirmed" statusundadır
- Randevu vaxtı gəlib çatıb |
Successful user flow |
- Həkim /doctor/appointments səhifəsində bugünkü randevuları görür
- Həkim randevunu açır
- Sistem pasient məlumatlarını, şikayətini və paylaşılan sənədləri göstərir
- Həkim müayinəni aparır
- Həkim müayinə qeydlərini daxil edir (optional)
- Həkim lazım gələrsə resept yazır (UC-601)
- Həkim "Randevunu tamamla" düyməsini basır
- Sistem randevu statusunu "completed" edir və tamamlanma vaxtını qeyd edir
- Sistem status tarixçəsinə qeyd yazır
- Sistem pasientə rəy yazma dəvəti göndərir (2 saat sonra)
- Sistem randevunu pasientin tibbi tarixçəsinə əlavə edir
- Sistem əməliyyatı audit log-a yazır |
Alternative case 1: No-show qeydi | Pasient gəlmədikdə həkim və ya klinika admini "Gəlmədi" düyməsini basır. Sistem statusu "no_show" edir, pasientin no-show sayğacını 1 artırır və pasientə bildiriş göndərir. |
Alternative case 2: Avtomatik tamamlanma | Randevu vaxtından 24 saat keçib və həkim status təyin etməyibsə, sistem randevunu avtomatik "completed" edir. |
Alternative case 3: No-show-un düzəldilməsi | Səhvən no-show qeyd edilibsə, klinika admini 24 saat ərzində statusu düzəldə bilər və pasientin sayğacı azalır. |
Error cases |
- EF-405-1: Vaxtından əvvəl tamamlama → randevu vaxtı gəlməyibsə düymə aktivləşmir
- EF-405-2: Artıq tamamlanıb → təkrar dəyişikliyə icazə verilmir |
Business Rules |
- BR-405-01: Randevu yalnız vaxtı gəldikdən sonra tamamlana bilər
- BR-405-02: Tamamlanmış randevu üçün pasient rəy yaza bilər
- BR-405-03: No-show qeydi pasientin sayğacını artırır
- BR-405-04: No-show statusu 24 saat ərzində düzəldilə bilər
- BR-405-05: Müayinə qeydlərini yalnız müayinə edən həkim və pasient görür
- BR-405-06: Klinika admini müayinə qeydlərini görə bilməz
- BR-405-07: 24 saat sonra status təyin edilməyibsə sistem avtomatik tamamlayır |
Features |
- FR-405-A — Completion (Tamamlama): status işarələmə, vaxt yoxlaması, müayinə qeydləri, məxfilik məhdudiyyəti, tibbi tarixçəyə əlavə, avtomatik tamamlama, rəy dəvəti
- FR-405-B — No-Show Handling (Gəlməmə idarəsi): no-show işarələmə, sayğacın artırılması, bildiriş, 24 saatlıq düzəliş imkanı, statistika |
Technical flow | |
Service type | REST API (sync) + scheduled job (avtomatik tamamlama) |
Database / Table name | |
UI link | /doctor/appointments/{appointmentId} |

## Modul 5 — Medical Documents (500)

### UC-501 — Upload Medical Document

Use case ID | UC-501 |
Use case name | Upload Medical Document (Tibbi sənədin yüklənməsi) |
Description | Pasient tibbi sənədlərini (analiz nəticələri, epikriz, görüntüləmə) sistemə yükləyir və kateqoriyalaşdırır. Sənədlər şifrələnmiş formada saxlanılır və yalnız pasientin özünə aiddir. |
User type | Patient (Secondary: File Storage Service, Antivirus Service) |
Preconditions |
- Pasient sistemə daxil olub
- Pasient tibbi məlumatların emalına razılıq verib
- Fayl dəstəklənən formatda və ölçüdədir |
Extra info | Sənədlər AES-256 ilə şifrələnmiş formada saxlanılır. Fayla giriş yalnız müvəqqəti imzalı URL (signed URL) vasitəsilə mümkündür. Maksimum fayl ölçüsü 10 MB, dəstəklənən formatlar: PDF, JPG, PNG. |
Successful user flow |
- Pasient /account/documents səhifəsinə daxil olur
- Sistem mövcud sənədləri kateqoriyalar üzrə qruplaşdırıb göstərir
- Pasient "Sənəd yüklə" düyməsini basır
- Sistem fayl mənbəyi seçimini göstərir: qalereya, kamera, fayl menecer
- Pasient faylı seçir və ya kamera ilə şəkil çəkir
- Sistem fayl formatını yoxlayır (PDF, JPG, PNG)
- Sistem fayl ölçüsünü yoxlayır (maks. 10 MB)
- Sistem antivirus skanı aparır
- Sistem metadata formasını göstərir
- Pasient kateqoriya seçir: analiz nəticəsi, görüntüləmə, epikriz, resept, digər
- Pasient sənədin tarixini daxil edir
- Pasient qısa təsvir yazır (optional)
- Pasient "Yüklə" düyməsini basır
- Sistem faylı AES-256 ilə şifrələyir
- Sistem şifrələnmiş faylı təhlükəsiz storage-a yükləyir
- Sistem sənəd qeydini yaradır və pasientin ID-si ilə əlaqələndirir
- Sistem şifrələmə açarı referensini saxlayır
- Sistem yükləmə əməliyyatını audit log-a yazır
- Sistem sənədi siyahıda göstərir və uğur bildirişi verir |
Alternative case 1: Çoxlu fayl yükləmə | Pasient bir neçə faylı eyni anda seçir. Sistem hər biri üçün ayrıca metadata tələb edir və ardıcıl yükləyir, ümumi irəliləyişi göstərir. |
Alternative case 2: Kamera ilə çəkmə | Pasient birbaşa kamera ilə sənəd şəkli çəkir. Sistem avtomatik kəsmə (auto-crop) və keyfiyyət yaxşılaşdırması təklif edir. |
Alternative case 3: Randevu ilə birlikdə yükləmə | Pasient randevu yaradarkən sənəd yükləyir. Sistem sənədi saxlayır və avtomatik olaraq həmin həkimə giriş icazəsi yaradır. |
Alternative case 4: Arxivləmə və silmə | Pasient köhnə sənədi arxivə keçirir (əsas siyahıda görünmür) və ya silir. Silinən sənəd 30 gün soft delete vəziyyətində saxlanılır, sonra tam silinir. |
Error cases |
- EF-501-1 Dəstəklənməyən format: "Bu format dəstəklənmir. PDF, JPG və ya PNG yükləyin"
- EF-501-2 Ölçü limiti aşılıb: "Fayl ölçüsü 10 MB-dan çox ola bilməz" + sıxışdırma təklifi
- EF-501-3 Zərərli fayl aşkarlanır: Fayl rədd edilir, təhlükəsizlik log-una yazılır
- EF-501-4 Yükləmə kəsilir: Natamam fayl silinir, "Yükləmə uğursuz oldu"
- EF-501-5 Storage əlçatan deyil: Əməliyyat dayandırılır, sonra cəhd təklif olunur
- EF-501-6 Razılıq verilməyib: Yükləməyə icazə verilmir, razılıq səhifəsinə yönləndirilir |
Business Rules |
- BR-501-01: Tibbi sənəd pasientin mülkiyyətidir
- BR-501-02: Bütün sənədlər şifrələnmiş formada saxlanılır (AES-256)
- BR-501-03: Maksimum fayl ölçüsü 10 MB
- BR-501-04: Dəstəklənən formatlar: PDF, JPG, PNG
- BR-501-05: Hər fayl antivirus skanından keçir
- BR-501-06: Silinən sənəd 30 gün soft delete vəziyyətində saxlanılır
- BR-501-07: Tibbi razılıq olmadan sənəd yüklənə bilməz
- BR-501-08: Sənədə giriş yalnız signed URL vasitəsilə mümkündür |
Features |
- FR-501-A — File Upload (Fayl yükləmə): format və ölçü yoxlaması, kamera ilə çəkmə, çoxlu fayl, irəliləyiş göstəricisi, antivirus skanı, natamam faylın təmizlənməsi
- FR-501-B — Metadata & Organization (Metadata və təşkil): kateqoriya, tarix, təsvir, filtrləmə, çeşidləmə, axtarış, arxivləmə, soft delete
- FR-501-C — Storage & Security (Saxlama və təhlükəsizlik): AES-256 şifrələmə, TLS ötürülməsi, pasient ID-si ilə izolyasiya, açar idarəsi, signed URL, audit log |
Technical flow | |
Service type | REST API (sync) + file storage (async upload) |
Database / Table name | |
UI link | /account/documents |

### UC-502 — Grant & Manage Document Access

Use case ID | UC-502 |
Use case name | Grant & Manage Document Access (Sənədə giriş icazəsinin idarəsi) |
Description | Pasient tibbi sənədini konkret həkimlə məhdud müddətə paylaşır. Bu, platformanın ən həssas məxfilik mexanizmidir: məlumat pasientə məxsusdur, həkim yalnız pasientin açdığı qapıdan və yalnız icazə verilən müddətdə baxa bilir. |
User type | Patient (Secondary: Doctor, Notification Service) |
Preconditions |
- Pasient sistemə daxil olub
- Pasientin ən azı bir yüklənmiş sənədi var
- Pasientin həmin həkimlə randevusu var (aktiv və ya keçmiş) |
Extra info | İcazə müddəti bitəndə giriş avtomatik bağlanır. Pasient istənilən vaxt icazəni əl ilə də ləğv edə bilər. Həkim sənədi yükləyə (download) bilməz — yalnız platforma daxilində baxa bilər. Hər baxış audit log-a yazılır. |
Successful user flow |
- Pasient sənəd siyahısında sənədin yanındakı "Paylaş" düyməsini basır
- Sistem həkim seçimi ekranını göstərir
- Sistem yalnız pasientin randevusu olan həkimləri siyahılayır
- Pasient həkimi seçir
- Sistem giriş müddəti seçimini göstərir: 24 saat, 7 gün, 30 gün, randevu müddətincə
- Pasient müddəti seçir
- Sistem xülasəni göstərir: hansı sənəd, hansı həkim, hansı müddət
- Pasient "İcazə ver" düyməsini basır
- Sistem giriş icazəsi qeydini yaradır: sənəd ID, həkim ID, başlama və bitmə vaxtı, status "active"
- Sistem həkimə "Yeni sənəd paylaşıldı" bildirişi göndərir
- Sistem əməliyyatı audit log-a yazır
- Sistem pasientə təsdiq mesajını göstərir |
Alternative case 1: İcazənin əl ilə ləğvi | Pasient /account/documents/shares səhifəsində "Paylaşımı ləğv et" düyməsini basır. Sistem statusu "revoked" edir və həkimin girişi dərhal bağlanır. |
Alternative case 2: Aktiv paylaşımların görünüşü | Pasient bütün aktiv icazələri görür: hansı sənəd, hansı həkim, nə vaxta qədər, neçə dəfə baxılıb. |
Alternative case 3: Randevu ilə avtomatik paylaşım | Pasient randevu yaradarkən sənəd əlavə edir. Sistem avtomatik icazə yaradır, müddət: randevu tarixindən 7 gün sonra. |
Alternative case 4: Baxış tarixçəsinə nəzarət | Pasient hər sənəd üçün kimin, nə vaxt baxdığını görür — bu, məlumat şəffaflığını təmin edir. |
Error cases |
- EF-502-1: Randevusu olmayan həkim → siyahıda görünmür
- EF-502-2: Təkrar icazə cəhdi → mövcud icazə göstərilir, müddəti uzatmaq təklif olunur
- EF-502-3: Silinmiş sənəd → paylaşma düyməsi görünmür
- EF-502-4: Deaktiv həkim → yeni icazə yaradılmır, mövcud icazələr avtomatik bağlanır |
Business Rules |
- BR-502-01: Sənəd yalnız pasientin randevusu olan həkimlərlə paylaşıla bilər
- BR-502-02: Giriş icazəsi müəyyən müddətə verilir və müddət bitəndə avtomatik ləğv olunur
- BR-502-03: Pasient icazəni istənilən vaxt əl ilə ləğv edə bilər
- BR-502-04: Həkim sənədi yükləyə bilməz, yalnız platforma daxilində baxa bilər
- BR-502-05: Hər baxış audit log-a yazılır
- BR-502-06: Pasient öz sənədinə kimin baxdığını görə bilər
- BR-502-07: Randevu ləğv edilərsə, həmin randevu ilə bağlı icazələr də ləğv olunur
- BR-502-08: Klinika admini heç bir tibbi sənədi görə bilməz
- BR-502-09: Super Admin tibbi sənədin məzmununu görə bilməz, yalnız metadata görür |
Features |
- FR-502-A — Granting Access (İcazə vermə): həkim seçimi, randevu filtri, müddət seçimi, xülasə, çoxlu paylaşım, avtomatik icazə, bildiriş
- FR-502-B — Access Control & Expiry (Giriş nəzarəti və müddət): avtomatik bağlanma, əl ilə ləğv, icazəsiz girişin bloklanması, download qadağası, müddətin uzadılması, admin bloklaması
- FR-502-C — Transparency & Audit (Şəffaflıq və audit): aktiv paylaşımlar siyahısı, qalan vaxt, baxış log-u, kimin baxdığının göstərilməsi, uğursuz cəhdlərin qeydi |
Technical flow | |
Service type | REST API (sync) + scheduled job (müddət bitməsi) |
Database / Table name | |
UI link | /account/documents/shares |

### UC-503 — Doctor Views Shared Documents

Use case ID | UC-503 |
Use case name | Doctor Views Shared Documents (Həkimin sənədlərə baxışı) |
Description | Həkim pasientin onunla paylaşdığı tibbi sənədlərə platforma daxilində baxır. Yükləmə mümkün deyil, hər baxış qeydə alınır. |
User type | Doctor |
Preconditions |
- Həkim sistemə daxil olub
- Pasient həkimlə sənəd paylaşıb və icazə aktivdir |
Successful user flow |
- Həkim randevu detalları və ya pasient səhifəsində "Paylaşılan sənədlər" bölməsinə keçir
- Sistem həkimə aktiv icazəsi olan sənədləri siyahılayır
- Sistem hər sənəd üçün göstərir: ad, kateqoriya, tarix, icazənin bitmə vaxtı
- Həkim sənədə klikləyir
- Sistem icazənin aktiv olduğunu yoxlayır
- Sistem bitmə tarixini cari vaxtla müqayisə edir
- Sistem müvəqqəti signed URL yaradır (qısa müddətli)
- Sistem faylı deşifrə edərək platforma daxili görüntüləyicidə açır
- Sistem baxış qeydini yazır: kim, nə vaxt, hansı sənəd, IP ünvanı
- Həkim sənədə baxır |
Alternative case 1: Tibbi tarixçəyə baxış | Həkim pasientin (icazə verilmiş) tibbi tarixçəsini xronoloji görür: keçmiş randevular, reseptlər, sənədlər. |
Alternative case 2: Resept yazarkən sənədə baxış | Həkim resept yazarkən yan paneldə paylaşılan sənədləri açıb baxa bilir. |
Error cases |
- EF-503-1: İcazə müddəti bitib → "Bu sənədə girişiniz sona çatıb", fayl açılmır
- EF-503-2: İcazə ləğv edilib → giriş rədd edilir
- EF-503-3: Download cəhdi → bloklanır və log-da "download_attempt" kimi qeyd edilir
- EF-503-4: Başqa pasientin sənədi → giriş bloklanır, təhlükəsizlik log-una yazılır
- EF-503-5: Sənəd silinib → həkim onu görmür |
Business Rules |
- BR-503-01: Həkim yalnız ona açıq icazə verilmiş sənədləri görə bilər
- BR-503-02: İcazə müddəti bitəndə giriş avtomatik bağlanır
- BR-503-03: Həkim sənədi yükləyə bilməz
- BR-503-04: Hər baxış audit log-a yazılır
- BR-503-05: Signed URL qısa müddətlidir və yenidən istifadə edilə bilməz
- BR-503-06: Uğursuz giriş cəhdləri təhlükəsizlik log-una yazılır |
Features |
- FR-503-A — Document Access (Sənədə giriş): icazəli sənədlərin siyahısı, bitmə vaxtının göstərilməsi, icazə yoxlaması, signed URL, daxili görüntüləyici, download bloklaması, baxış log-u, kateqoriya filtri, resept yazarkən paralel baxış |
Technical flow | |
Service type | REST API (sync) + signed URL generation |
Database / Table name | |
UI link | /doctor/patients/{patientId}/documents |

### UC-504 — Medical History Timeline

Use case ID | UC-504 |
Use case name | Medical History Timeline (Tibbi tarixçə) |
Description | Pasientin bütün tibbi fəaliyyəti xronoloji ardıcıllıqla bir yerdə göstərilir: randevular, reseptlər, sənədlər, müayinə qeydləri. Bu, "bütün tibbi məlumat bir yerdə" vədinin reallaşdığı ekrandır. |
User type | Patient, Doctor |
Preconditions |
- Pasient sistemə daxil olub |
Successful user flow |
- Pasient /account/medical-history səhifəsinə daxil olur
- Sistem bütün tibbi hadisələri xronoloji sıralayır (ən yenidən köhnəyə)
- Sistem hər hadisəni tip ikonu ilə göstərir: randevu, resept, sənəd, müayinə qeydi
- Sistem hər hadisə üçün göstərir: tarix, tip, həkim, klinika, qısa təsvir
- Pasient filtr tətbiq edir: hadisə tipi, tarix aralığı, həkim, klinika
- Sistem nəticələri filtrləyir
- Pasient hadisəyə klikləyir
- Sistem müvafiq detallı səhifəyə yönləndirir (randevu / resept / sənəd) |
Alternative case 1: Həkimin tarixçəyə baxışı | Həkim pasientin randevusu kontekstində tibbi tarixçəyə baxır. Yalnız icazə verilmiş elementlər görünür — pasientin başqa həkimlərdəki qeydləri gizli qalır. |
Alternative case 2: Tarixçənin export edilməsi | Pasient tarixçəsini PDF formatında yükləyir (başqa həkimə təqdim etmək üçün). |
Error cases |
- EF-504-1: Boş tarixçə → empty state göstərilir
- EF-504-2: Həkimin icazəsiz baxışı → icazə verilməmiş elementlər görünmür |
Business Rules |
- BR-504-01: Tarixçə xronoloji ardıcıllıqla göstərilir
- BR-504-02: Pasient bütün öz tarixçəsini görür
- BR-504-03: Həkim yalnız icazə verilmiş elementləri görür
- BR-504-04: Klinika admini tibbi tarixçəni görə bilməz
- BR-504-05: Tamamlanmış randevu avtomatik tarixçəyə əlavə olunur
- BR-504-06: İmzalanmış resept avtomatik tarixçəyə əlavə olunur |
Features |
- FR-504-A — Timeline Display (Tarixçənin göstərilməsi): xronoloji sıralama, tip fərqləndirmə, tip/tarix/həkim filtri, detallı səhifəyə keçid, PDF export, həkim üçün məhdud görünüş, admin bloklaması |
Technical flow | |
Service type | REST API (sync) |
Database / Table name | |
UI link | /account/medical-history |

## Modul 6 — E-Prescription (600)

### UC-601 — Create E-Prescription

Use case ID | UC-601 |
Use case name | Create E-Prescription (Elektron resept yazma) |
Description | Həkim müayinədən sonra pasient üçün elektron resept yaradır, klinik təhlükəsizlik yoxlamalarından keçir və rəqəmsal imza ilə təsdiqləyir. İmzalanmış resept avtomatik olaraq pasientin profilinə və tibbi tarixçəsinə düşür. |
User type | Doctor (Secondary: Patient, Digital Signature Service, Drug Database) |
Preconditions |
- Həkim sistemə daxil olub və tibbi lisenziyası aktivdir
- Pasientlə "Confirmed" və ya "Completed" statuslu randevu mövcuddur
- Həkimin rəqəmsal imza sertifikatı aktivdir |
Extra info | Sistem resept yazılarkən pasientin allergiyalarını və aktiv dərmanlarını həkimə avtomatik göstərir. Seçilən hər dərman allergiya siyahısı və dərman qarşılıqlı təsir bazası ilə yoxlanılır. Xəbərdarlıq ötürülərsə, həkimin açıq təsdiqi və səbəbi qeydə alınır. Reseptin standart etibarlılıq müddəti 30 gündür. |
Successful user flow |
- Həkim randevu ekranında "Resept yaz" düyməsini basır
- Sistem həkimin lisenziya statusunu və bitmə tarixini yoxlayır
- Sistem imza sertifikatının etibarlılığını yoxlayır
- Sistem resept formasını açır
- Sistem pasient məlumatlarını avtomatik doldurur: ad, soyad, FIN, yaş, cins
- Sistem pasientin allergiyalarını və xroniki xəstəliklərini xəbərdarlıq panelində göstərir
- Sistem pasientin aktiv dərmanlarını göstərir
- Həkim diaqnozu daxil edir və ICD-10 kodunu seçir
- Həkim "Dərman əlavə et" düyməsini basır
- Sistem dərman axtarış sahəsini açır (dərman bazasından)
- Həkim dərman adını yazır və siyahıdan seçir
- Sistem seçilmiş dərmanı pasientin allergiya siyahısı ilə yoxlayır
- Sistem dərman qarşılıqlı təsir yoxlaması aparır
- Həkim doza, qəbul tezliyi, müddət və istifadə təlimatını daxil edir
- Həkim lazım gələrsə əlavə dərmanlar üçün 9–14-cü addımları təkrarlayır
- Həkim ümumi tövsiyələr sahəsini doldurur (optional)
- Həkim reseptin etibarlılıq müddətini təyin edir (default: 30 gün)
- Həkim "Yoxla və imzala" düyməsini basır
- Sistem məcburi sahələri validasiya edir
- Sistem reseptin tam önizləməsini göstərir
- Həkim məlumatları yoxlayır və "İmzala" düyməsini basır
- Sistem rəqəmsal imza servisinə sorğu göndərir
- Həkim imzanı təsdiqləyir (PIN / biometrik / SİMA)
- İmza servisi imzanı yaradır və sistemə qaytarır
- Sistem resepti "Signed" statusu ilə saxlayır
- Sistem unikal resept nömrəsi yaradır
- Sistem doğrulama QR kodu yaradır
- Sistem resepti pasientin profilinə əlavə edir
- Sistem resepti tibbi tarixçəyə əlavə edir
- Sistem pasientə "Yeni resept yazıldı" bildirişi göndərir
- Sistem əməliyyatı audit log-a yazır |
Alternative case 1: Şablon istifadəsi | Həkim əvvəlcədən yaratdığı resept şablonunu seçir. Sistem bütün dərmanları avtomatik doldurur, həkim yalnız lazımi düzəlişləri edir. |
Alternative case 2: Əvvəlki reseptin təkrarı | Həkim pasientin əvvəlki reseptini seçib "Təkrarla" basır. Sistem həmin dərmanları yeni reseptə köçürür (uzunmüddətli müalicə üçün). |
Alternative case 3: Əl ilə dərman daxiletmə | Dərman bazada tapılmazsa, həkim adı əl ilə yazır. Sistem qarşılıqlı təsir yoxlaması apara bilmədiyi barədə xəbərdarlıq göstərir. |
Alternative case 4: Xəbərdarlığın ötürülməsi | Həkim allergiya və ya qarşılıqlı təsir xəbərdarlığını görüb davam etmək qərarına gəlirsə, sistem açıq təsdiq və səbəb tələb edir. Ötürmə faktı və səbəbi audit log-a yazılır. |
Alternative case 5: Draft kimi saxlama | Həkim resepti tamamlamadan "Qaralama kimi saxla" seçir. Resept "Draft" statusunda qalır və sonra davam etdirilə bilər. Draft resept pasientə göndərilmir. |
Alternative case 6: Reseptin ləğvi | Həkim səhv yazılmış resepti ləğv edir. Sistem statusu "Cancelled" edir, resepti silmir (audit üçün saxlanılır) və pasientə bildiriş göndərir. |
Error cases |
- EF-601-1 Lisenziya etibarsız: "Lisenziyanız aktiv deyil, klinika administratoru ilə əlaqə saxlayın" → resept yaradıla bilmir
- EF-601-2 İmza sertifikatı etibarsız: İmzalamağa icazə verilmir, sertifikatı yeniləmə tələbi göstərilir
- EF-601-3 Allergiya konflikti: Qırmızı xəbərdarlıq — "Diqqət: pasientin bu dərmana allergiyası qeyd olunub [allergen adı, şiddət]". Açıq təsdiq olmadan davam edilə bilmir
- EF-601-4 Təhlükəli qarşılıqlı təsir: Xəbərdarlıq və şiddət səviyyəsi göstərilir; severe səviyyədə əlavə təsdiq tələb olunur
- EF-601-5 Məcburi sahələr boş: İmzalamağa icazə verilmir, doldurulmamış sahələr qırmızı işarələnir
- EF-601-6 İmza servisi xəta qaytarır: Resept "Draft" statusunda saxlanılır, pasientə heç nə göndərilmir, yenidən cəhd imkanı verilir
- EF-601-7 Randevu mövcud deyil: Randevusu olmayan pasient üçün resept yazıla bilmir
- EF-601-8 Nəzarətdə olan dərman: Əlavə təsdiq və əsaslandırma tələb olunur |
Business Rules |
- BR-601-01: Yalnız aktiv lisenziyalı həkim resept yaza bilər
- BR-601-02: Resept yalnız randevusu olan pasient üçün yazıla bilər
- BR-601-03: Resept yalnız rəqəmsal imza ilə təsdiqləndikdən sonra etibarlıdır
- BR-601-04: İmzalanmış resept redaktə edilə bilməz
- BR-601-05: Səhv resept ləğv edilib yenisi yazılır
- BR-601-06: Ləğv edilmiş resept silinmir, audit üçün saxlanılır
- BR-601-07: Hər reseptə unikal resept nömrəsi təyin edilir
- BR-601-08: Nəzarətdə olan dərmanlar əlavə təsdiq tələb edir
- BR-601-09: Xəbərdarlıq ötürülərsə səbəb qeyd edilməli və log-a yazılmalıdır
- BR-601-10: Reseptin standart etibarlılıq müddəti 30 gündür
- BR-601-11: Klinika admini resept məzmununu görə bilməz
- BR-601-12: İmzasız (draft) resept pasientə göndərilmir |
Features |
- FR-601-A — Prescription Creation (Reseptin yaradılması): lisenziya yoxlaması, pasient məlumatlarının avtodoldurulması, diaqnoz və ICD-10, dərman axtarışı, doza/tezlik/müddət/təlimat, çoxlu dərman, tövsiyələr, etibarlılıq müddəti, şablon və təkrar, draft saxlama
- FR-601-B — Clinical Safety Checks (Klinik təhlükəsizlik yoxlamaları): allergiya siyahısının göstərilməsi, allergiya konflikti yoxlaması, dərman qarşılıqlı təsiri, şiddət səviyyəsi, aktiv dərmanlar, xəbərdarlığın ötürülməsi və səbəbi, nəzarətdə olan dərmanlar, yaşa uyğun doza
- FR-601-C — Digital Signature (Rəqəmsal imza): imza tələbi, önizləmə, sertifikat yoxlaması, imzasız reseptin bloklanması, draft saxlama, redaktə qadağası, unikal nömrə, doğrulama QR kodu |
Technical flow | |
Service type | REST API (sync) + Digital Signature Service (async callback) |
Database / Table name | |
UI link | /doctor/appointments/{appointmentId}/prescription |

### UC-602 - Patient Views Prescription

Use case ID | UC-602 |
Use case name | Patient Views Prescription (Pasientin resepti görməsi) |
Description | Pasient ona yazılmış bütün reseptləri görür, detallarına baxır və aptekdə təqdim etmək üçün resept nömrəsi / QR koddan istifadə edir. Pasient resepti yalnız oxuya bilər, dəyişdirə bilməz. |
User type | Patient |
Preconditions |
- Pasient sistemə daxil olub
- Pasientin ən azı bir imzalanmış resepti var |
Extra info | Yalnız imzalanmış reseptlər pasientə göstərilir — draft statuslu reseptlər görünmür. Müddəti bitmiş resept avtomatik "Expired" statusuna keçir və vizual olaraq işarələnir. |
Successful user flow |
- Pasient bildiriş alır və ya /account/prescriptions səhifəsinə daxil olur
- Sistem reseptləri qruplaşdırır: Aktiv / Keçmiş / Ləğv edilmiş
- Sistem hər kartda göstərir: resept nömrəsi, tarix, həkim, klinika, dərman sayı, status
- Pasient reseptə klikləyir
- Sistem tam detalları göstərir: diaqnoz, dərmanlar (ad, doza, tezlik, müddət, təlimat), həkim məlumatı, imza statusu, etibarlılıq müddəti
- Sistem doğrulama QR kodunu göstərir
- Pasient QR kodu aptekdə təqdim edir və ya resepti PDF formatında yükləyir |
Alternative case 1: PDF yükləmə | Pasient resepti PDF formatında yükləyir (aptekdə çap edib təqdim etmək üçün). |
Alternative case 2: Təkrar resept sorğusu | Pasient uzunmüddətli müalicə üçün "Təkrar resept istə" düyməsini basır. Həkimə sorğu gedir, həkim təsdiqləyərsə yeni resept yaradılır, rədd edərsə pasientə səbəb bildirilir. |
Alternative case 3: Randevudan reseptə keçid | Pasient randevu detallarından birbaşa həmin randevuda yazılmış resepti açır. |
Alternative case 4: Dərman haqqında məlumat | Pasient dərman adına klikləyir, sistem ümumi məlumat göstərir (istifadə qaydası, əsas yan təsirlər). Bu, tibbi məsləhət deyil, məlumatlandırma xarakteri daşıyır. |
Error cases |
- EF-602-1: Resept yoxdur → empty state göstərilir
- EF-602-2: Müddəti bitmiş resept → "Bu reseptin etibarlılıq müddəti bitib" xəbərdarlığı göstərilir
- EF-602-3: Ləğv edilmiş resept → status açıq göstərilir və ləğv səbəbi bildirilir
- EF-602-4: Başqasının resepti → sistem girişi bloklayır və təhlükəsizlik log-una yazır
- EF-602-5: Redaktə cəhdi → sistem imkan vermir, resept yalnız oxunaqlıdır |
Business Rules |
- BR-602-01: Pasient yalnız öz reseptlərini görür
- BR-602-02: Pasient resepti redaktə edə bilməz
- BR-602-03: Yalnız imzalanmış reseptlər pasientə göstərilir
- BR-602-04: Müddəti bitmiş resept avtomatik "Expired" statusuna keçir
- BR-602-05: Ləğv edilmiş resept göstərilir, lakin etibarsız kimi işarələnir
- BR-602-06: QR kod reseptin həqiqiliyini yoxlamaq üçün istifadə olunur
- BR-602-07: Təkrar resept yalnız həkimin təsdiqi ilə yaradılır |
Features |
- FR-602-A — Prescription Access (Reseptə giriş): resept siyahısı, status üzrə qruplaşdırma, tam detallar, dərman məlumatları, redaktə qadağası, QR kod, PDF yükləmə, müddət işarələməsi, təkrar resept sorğusu, giriş məhdudiyyəti |
Technical flow | |
Service type | REST API (sync) + PDF generation |
Database / Table name | |
UI link | /account/prescriptions, /account/prescriptions/{prescriptionId} |

#### Reseptin həyat dövrü (Prescription Lifecycle)
Reseptin statusları və keçid məntiqi:
Status | Mənası | Keçid şərti |
Draft | Həkim resepti yaradıb, lakin imzalamayıb. Pasientə görünmür. | Resept yaradıldıqda ilkin status |
Signed | Rəqəmsal imza ilə təsdiqlənib, etibarlıdır, pasientin profilində görünür. | İmza servisi uğurlu cavab qaytardıqda |
Expired | Etibarlılıq müddəti bitib, aptekdə istifadə edilə bilməz. | Etibarlılıq tarixi keçdikdə (avtomatik) |
Cancelled | Həkim tərəfindən ləğv edilib. Silinmir, audit üçün saxlanılır. | Həkim səhvi düzəltdikdə |
Dispensed | Aptek dərmanı verib (Phase 2 — aptek inteqrasiyası ilə aktivləşir). | Aptek sistemi təsdiqlədikdə |

### Modul 6 — Ümumi Business Rules

ID | Qayda |
BR-600-01 | Resept yalnız aktiv lisenziyalı və verifikasiya edilmiş həkim tərəfindən yaradıla bilər |
BR-600-02 | Rəqəmsal imza olmadan resept hüquqi qüvvəyə malik deyil |
BR-600-03 | Bütün resept əməliyyatları (yaratma, imzalama, ləğv, baxış) audit log-a yazılır |
BR-600-04 | Klinika admini və Super Admin resept məzmununu görə bilməz |
BR-600-05 | Reseptlər qanunvericiliyə uyğun minimum saxlanma müddətinə tabedir |
BR-600-06 | Klinik təhlükəsizlik xəbərdarlıqları (allergiya, qarşılıqlı təsir) ötürülərsə, həkimin təsdiqi və səbəbi qeydə alınır |
BR-600-07 | Aptek inteqrasiyası və e-health.gov.az inteqrasiyası Phase 2-də nəzərdə tutulur |

## Modul 7 — Doctor Panel (700)

### UC-701 — Doctor Profile Setup

Use case ID | UC-701 |
Use case name | Doctor Profile Setup (Həkim profilinin tənzimlənməsi) |
Description | Klinika admini tərəfindən sistemə əlavə edilmiş həkim ilk girişdə öz peşəkar profilini tamamlayır: bio, təhsil, təcrübə, ixtisaslaşma, dillər, foto. Profil tamamlanmayana qədər həkim axtarış nəticələrində görünmür. |
User type | Doctor |
Preconditions |
- Həkim klinika admini tərəfindən sistemə əlavə edilib
- Həkim dəvəti qəbul edib və SİMA ilə şəxsiyyətini təsdiqləyib
- Həkim ilk girişini həyata keçirib |
Extra info | Profildə üç qat məlumat var: SİMA-dan gələnlər (ad, soyad, FIN, doğum tarixi — dəyişdirilə bilməz), klinika admini tərəfindən daxil edilənlər (lisenziya nömrəsi, klinika, ixtisas — həkim dəyişə bilməz) və həkimin özünün doldurduqları (bio, təhsil, təcrübə, dillər, foto). |
Successful user flow |
- Həkim ilk girişdən sonra sistem onu profil tamamlama səhifəsinə yönləndirir
- Sistem SİMA-dan gələn şəxsi məlumatları read-only göstərir
- Sistem klinika admininin daxil etdiyi məlumatları göstərir: lisenziya nömrəsi, klinika(lar), ixtisas
- Həkim profil fotosunu yükləyir
- Həkim bio / peşəkar təsvir yazır
- Həkim təhsil məlumatını daxil edir (universitet, il, ixtisas)
- Həkim iş təcrübəsini (il) daxil edir
- Həkim əlavə ixtisaslaşma sahələrini seçir
- Həkim danışdığı dilləri seçir
- Həkim akademik dərəcə və sertifikatlarını əlavə edir (optional)
- Həkim randevu təsdiq rejimini seçir: avtomatik və ya manual təsdiq
- Həkim "Yadda saxla" düyməsini basır
- Sistem məcburi sahələri validasiya edir
- Sistem profili "tamamlanmış" kimi işarələyir
- Sistem həkimi axtarış nəticələrində aktivləşdirir
- Sistem klinika admininə "Həkim profilini tamamladı" bildirişi göndərir
- Sistem həkimi cədvəl qurma səhifəsinə yönləndirir (UC-702)
- Sistem əməliyyatı audit log-a yazır |
Alternative case 1: Profilin sonradan redaktəsi | Həkim istənilən vaxt /doctor/profile səhifəsindən profilini yeniləyir. Dəyişikliklər dərhal pasient tərəfində əks olunur. |
Alternative case 2: Sertifikat yükləmə | Həkim ixtisasartırma sertifikatlarını yükləyir. Klinika admini və Super Admin onları görə bilir. |
Alternative case 3: Təsdiq rejiminin dəyişdirilməsi | Həkim randevu qəbul rejimini dəyişir. Avtomatik rejimdə pasient randevunu birbaşa təsdiqləyir; manual rejimdə həkim hər randevunu ayrıca təsdiqləməlidir. |
Alternative case 4: Bildiriş parametrləri | Həkim hansı bildirişləri hansı kanaldan almaq istədiyini seçir (yeni randevu, ləğv, sənəd paylaşımı və s.). |
Error cases |
- EF-701-1 Məcburi sahələr boş: Sistem xəbərdarlıq göstərir və profili tamamlanmış saymır → həkim axtarışda görünmür
- EF-701-2 Lisenziya redaktəsi cəhdi: Sahə read-only, dəyişiklik üçün klinika admininə müraciət tələb olunur
- EF-701-3 Klinika bağlılığının silinməsi cəhdi: Həkim özünü klinikadan çıxara bilməz
- EF-701-4 Uyğun olmayan foto: Ölçü və format yoxlanılır, uyğun olmayan rədd edilir
- EF-701-5 Qiymət təyini cəhdi: Həkim qiymət sahəsinə giriş edə bilmir |
Business Rules |
- BR-701-01: Həkim özü qeydiyyatdan keçə bilməz; klinika admini tərəfindən əlavə edilir
- BR-701-02: Həkim SİMA-dan gələn şəxsi məlumatları dəyişə bilməz
- BR-701-03: Həkim lisenziya məlumatını dəyişə bilməz
- BR-701-04: Həkim özünü klinikadan çıxara bilməz
- BR-701-05: Profil tamamlanmayan həkim axtarış nəticələrində görünmür
- BR-701-06: Həkim qiymət təyin edə bilməz — bu, klinika admininin səlahiyyətidir
- BR-701-07: Profil dəyişiklikləri dərhal pasient tərəfində əks olunur
- BR-701-08: Təsdiq rejimi (avtomatik/manual) randevu axınına birbaşa təsir edir |
Features |
- FR-701-A — Profile Completion (Profilin tamamlanması): ilk girişdə yönləndirmə, SİMA sahələrinin qorunması, foto, bio, təhsil, təcrübə, ixtisaslaşma, dillər, sertifikatlar, məcburi sahə validasiyası, axtarışda görünmə şərti
- FR-701-B — Restrictions & Preferences (Məhdudiyyətlər və tərcihlər): lisenziya redaktəsinin bloklanması, klinika bağlılığının qorunması, qiymət təyininin bloklanması, təsdiq rejimi seçimi, bildiriş parametrləri, audit log |
Technical flow | |
Service type | REST API (sync) |
Database / Table name | |
UI link | /doctor/profile |

### UC-702 — Doctor Schedule Management

Use case ID | UC-702 |
Use case name | Doctor Schedule Management (Həkim cədvəlinin idarəsi) |
Description | Həkim öz iş cədvəlini klinika üzrə ayrıca qurur: iş günləri, saatlar, slot müddəti, fasilələr, məzuniyyət. Bu cədvəl pasientlərin gördüyü boş slotların mənbəyidir — randevu sisteminin təməlidir. Klinika admini də bu cədvəli redaktə edə bilər (UC-803). |
User type | Doctor (Secondary: Clinic Admin, Patient — dolayı) |
Preconditions |
- Həkim sistemə daxil olub və profili tamamlanıb
- Həkim ən azı bir aktiv klinikaya bağlıdır |
Extra info | Cədvəl şablon kimi işləyir: həkim həftəlik iş rejimini təyin edir, sistem bu şablona əsasən gələcək 60 gün üçün konkret slotları avtomatik generasiya edir. Məzuniyyət, bağlı gün və əlavə iş saatı isə istisna kimi qeyd olunur və şablonu ləğv etmədən konkret tarixlərə tətbiq olunur. |
Successful user flow |
- Həkim /doctor/schedule səhifəsinə daxil olur
- Sistem həkimin bağlı olduğu klinikaları tab şəklində göstərir
- Həkim klinikanı seçir
- Sistem həmin klinika üzrə mövcud cədvəli həftəlik təqvim görünüşündə göstərir
- Sistem klinikanın iş saatlarını arxa fonda məhdudiyyət kimi göstərir
- Həkim "Cədvəli redaktə et" düyməsini basır
- Həkim iş günlərini seçir
- Həkim hər gün üçün başlama və bitmə saatını təyin edir
- Həkim slot müddətini seçir (15 / 20 / 30 / 45 / 60 dəqiqə)
- Həkim fasilələri əlavə edir (nahar və s.)
- Həkim randevular arası bufer vaxtını təyin edir (optional)
- Həkim "Yadda saxla" düyməsini basır
- Sistem validasiya edir: üst-üstə düşmə, məntiqi ardıcıllıq, klinika saatları çərçivəsi
- Sistem mövcud randevularla konflikt yoxlaması aparır
- Sistem cədvəl şablonunu və fasilələri saxlayır
- Sistem gələcək 60 gün üçün slotları avtomatik generasiya edir
- Sistem yeni slotları pasient axtarışında əlçatan edir
- Sistem əməliyyatı audit log-a yazır |
Alternative case 1: Konkret günün bağlanması | Həkim təqvimdə günü seçib "Bağla" basır. Sistem həmin gün üçün istisna qeydi yaradır və boş slotları silir. Həmin gündə randevu varsa, EF-702-1 işə düşür. |
Alternative case 2: Məzuniyyət təyini | Həkim tarix aralığı seçib "Məzuniyyət" kimi işarələyir. Sistem həmin aralıqda bütün slotları bağlayır və pasientlərə "bu tarixlərdə qəbul yoxdur" göstərir. |
Alternative case 3: Əlavə iş saatı | Həkim standart cədvəldən kənar əlavə qəbul saatı açır (məsələn şənbə günü). Sistem həmin tarix üçün xüsusi slotlar yaradır. |
Alternative case 4: Tək slotun bağlanması | Həkim konkret slotu bloklayır (şəxsi səbəb, təcili hal). Sistem slot statusunu "blocked" edir və pasientlərə göstərmir. |
Alternative case 5: Cədvəl şablonunun köçürülməsi | Həkim mövcud cədvəli şablon kimi saxlayır və başqa klinikaya tətbiq edir (vaxt konflikti olmadıqda). |
Error cases |
- EF-702-1 Mövcud randevularla konflikt: "Bu vaxt aralığında N təsdiqlənmiş randevu var" → seçim: randevuları ləğv et və pasientləri xəbərdar et, yaxud dəyişikliyi ləğv et
- EF-702-2 Üst-üstə düşən vaxt: Validasiya xətası, düzəliş tələb olunur
- EF-702-3 Məntiqsiz vaxt: Bitmə saatı başlama saatından əvvəldirsə, sistem rədd edir
- EF-702-4 Klinika saatından kənar: Xəbərdarlıq göstərilir və klinika admininin təsdiqi tələb olunur
- EF-702-5 İki klinikada eyni vaxt: Konflikt xəbərdarlığı göstərilir və əməliyyat bloklanır
- EF-702-6 Randevusu olan slotun silinməsi: Birbaşa silinmə bloklanır, əvvəlcə randevunun idarəsi tələb olunur |
Business Rules |
- BR-702-01: Cədvəl klinika üzrə ayrıca qurulur
- BR-702-02: Cədvəl klinikanın iş saatları çərçivəsində olmalıdır
- BR-702-03: Slot müddəti 15–60 dəqiqə aralığında olmalıdır
- BR-702-04: Mövcud randevusu olan slot avtomatik silinə bilməz
- BR-702-05: Cədvəl dəyişikliyi yalnız gələcək tarixlərə tətbiq olunur
- BR-702-06: Slotlar gələcək 60 gün üçün avtomatik generasiya olunur
- BR-702-07: Həkim eyni vaxtda iki fərqli klinikada slot aça bilməz
- BR-702-08: Klinika admini həkimin cədvəlini redaktə edə bilər
- BR-702-09: Admin tərəfindən edilən dəyişiklik həkimə bildirilir
- BR-702-10: Məzuniyyət dövründə yeni randevu qəbul edilmir
- BR-702-11: Cədvəl dəyişikliyi səbəbindən ləğv olunan randevular üçün pasientlərə bildiriş göndərilir |
Features |
- FR-702-A — Schedule Configuration (Cədvəlin qurulması): klinika üzrə ayrıca cədvəl, iş günləri, başlama/bitmə saatı, slot müddəti, fasilələr, bufer vaxtı, həftəlik təqvim görünüşü, klinika saatları məhdudiyyəti, şablon
- FR-702-B — Availability Exceptions (Əlçatanlıq istisnaları): konkret günün bağlanması, məzuniyyət aralığı, əlavə iş saatı, tək slotun bloklanması, məzuniyyətdə randevu qəbulunun dayandırılması
- FR-702-C — Slot Generation & Validation (Slot generasiyası və validasiya): avtomatik slot yaratma, 60 günlük generasiya, üst-üstə düşmə bloklaması, məntiqsiz vaxt yoxlaması, klinika saatı xəbərdarlığı, iki klinika konflikti, randevu konflikti aşkarlanması, pasient bildirişləri |
Technical flow | |
Service type | REST API (sync) + scheduled job (slot generasiyası) |
Database / Table name | |
UI link | /doctor/schedule |

### UC-703 — Doctor Appointment Management

Use case ID | UC-703 |
Use case name | Doctor Appointment Management (Həkimin randevu idarəsi) |
Description | Həkim öz randevularını görür, təsdiqləyir, rədd edir, ləğv edir və müayinə prosesini idarə edir. Randevu ekranında pasientin şikayəti, allergiyaları və paylaşdığı sənədlər göstərilir. |
User type | Doctor |
Preconditions |
- Həkim sistemə daxil olub
- Həkimin profili tamamlanıb və cədvəli qurulub |
Extra info | Həkim yalnız öz randevularını və yalnız icazə verilmiş sənədləri görür. Pasientin başqa həkimlərdəki randevuları və qeydləri həkimə görünmür — bu, məxfiliyin təmin edilməsi üçün kritikdir. |
Successful user flow |
- Həkim /doctor/appointments səhifəsinə daxil olur
- Sistem randevuları tab-lar üzrə göstərir: Bu gün / Yaxınlaşan / Təsdiq gözləyən / Keçmiş
- Sistem default olaraq "Bu gün" tabını açır və randevuları saat sırası ilə göstərir
- Sistem hər kartda göstərir: pasient adı, saat, xidmət, status, klinika (bir neçə klinikada işləyirsə)
- Həkim randevuya klikləyir
- Sistem detalları göstərir: pasient məlumatları (ad, yaş, cins), şikayət/qeyd, allergiyalar, paylaşılan sənədlər, həkimin öz apardığı keçmiş randevular
- Həkim uyğun əməliyyatı seçir: təsdiqlə, rədd et, ləğv et, tamamla, resept yaz
- Sistem əməliyyatı icra edir və statusu yeniləyir
- Sistem aidiyyəti tərəflərə bildiriş göndərir
- Sistem əməliyyatı audit log-a yazır |
Alternative case 1: Randevunun təsdiqi | Həkim manual təsdiq rejimindədirsə, "Təsdiqlə" basır. Status "pending" → "confirmed" olur, pasientə bildiriş gedir və xatırlatmalar planlaşdırılır. |
Alternative case 2: Randevunun rəddi | Həkim səbəb qeyd edərək rədd edir. Status "cancelled" olur, slot dərhal boşalır, pasientə bildiriş gedir və alternativ vaxtlar təklif olunur. |
Alternative case 3: Günün icmalı | Həkim "Bu gün" tabında günlük iş yükünü görür: ümumi randevu sayı, tamamlanan, qalan, gəlməyən. |
Alternative case 4: Pasient kontekstinə baxış | Həkim pasientin özünün apardığı əvvəlki randevuları və icazə verilmiş sənədləri görür. Başqa həkimlərin qeydləri görünmür. |
Alternative case 5: Təqvim görünüşü | Həkim randevuları həftəlik və ya aylıq təqvim görünüşündə görür — iş planlaması üçün rahatdır. |
Alternative case 6: Filtrləmə | Həkim randevuları tarix, status və klinika üzrə filtrləyir. |
Error cases |
- EF-703-1 Başqa həkimin randevusu: Sistem girişi bloklayır və təhlükəsizlik log-una yazır
- EF-703-2 Keçmiş randevunun təsdiqi: Vaxtı keçmiş randevu təsdiqlənə bilməz
- EF-703-3 Sənədə icazə yoxdur: Pasient sənəd paylaşmayıbsa, sənəd bölməsi boş göstərilir
- EF-703-4 Rədd səbəbi boş: Səbəb qeyd olunmadan rədd əməliyyatı tamamlanmır |
Business Rules |
- BR-703-01: Həkim yalnız öz randevularını görür
- BR-703-02: Həkim yalnız icazə verilmiş sənədləri görür
- BR-703-03: Həkim pasientin başqa həkimlərdəki randevularını görə bilməz
- BR-703-04: Rədd edilən randevunun slotu dərhal boşalır
- BR-703-05: Rədd səbəbi məcburidir
- BR-703-06: Həkim pasientin allergiya məlumatını randevu ekranında görür
- BR-703-07: Həkim tərəfindən rədd pasientin no-show statistikasına təsir etmir |
Features |
- FR-703-A — Appointment List & View (Randevu siyahısı və görünüş): tab qruplaşdırma, saat sırası, kart məlumatları, klinika göstərilməsi, filtrləmə, təqvim görünüşü, günlük icmal, giriş məhdudiyyəti
- FR-703-B — Appointment Actions (Randevu əməliyyatları): təsdiqləmə, rədd etmə və səbəb, ləğv etmə, tamamlama, no-show qeydi, reseptə keçid, slotun boşaldılması
- FR-703-C — Patient Context (Pasient konteksti): əsas məlumatlar, şikayət/qeyd, allergiyalar, paylaşılan sənədlər, öz apardığı keçmiş randevular, başqa həkim qeydlərinin gizlədilməsi, müayinə qeydi |
Technical flow | |
Service type | REST API (sync) + async bildiriş |
Database / Table name | |
UI link | /doctor/appointments, /doctor/appointments/{appointmentId} |

Həkimin görmə səlahiyyətləri (Doctor Visibility Matrix) Bu matris həkimin nəyi görüb-görmədiyini bir yerdə göstərir, məxfilik məntiqinin xülasəsidir:
Məlumat | Görür? | Şərt |
Öz randevuları | Bəli | Şərtsiz |
Pasientin şikayət/qeydi | Bəli | Yalnız öz randevusu üzrə |
Pasientin allergiyaları | Bəli | Klinik təhlükəsizlik üçün, randevu kontekstində |
Tibbi sənədlər | Şərtli | Yalnız pasient açıq icazə veribsə və müddət bitməyibsə |
Tibbi tarixçə | Şərtli | Yalnız icazə verilmiş elementlər |
Öz yazdığı reseptlər | Bəli | Şərtsiz |
Başqa həkimin yazdığı resept | Xeyr | Pasient tibbi tarixçə icazəsi verməyibsə |
Başqa həkimin randevuları | Xeyr | Heç bir halda |
Pasientin sənədini yükləmək (download) | Xeyr | Yalnız platforma daxilində baxış |
Başqa klinikadakı öz cədvəli | Bəli | Öz profilinə bağlı bütün klinikalar |
Qiymət təyini | Xeyr | Klinika admininin səlahiyyətidir |

### Modul 7 — Ümumi Business Rules

ID | Qayda |
BR-700-01 | Həkim platformaya yalnız klinika vasitəsilə daxil olur — müstəqil qeydiyyat mümkün deyil |
BR-700-02 | Həkimin cədvəli pasientə göstərilən boş slotların yeganə mənbəyidir |
BR-700-03 | Həkim bir neçə klinikada işləyə bilər, lakin eyni vaxt aralığında yalnız birində |
BR-700-04 | Lisenziya müddəti bitən həkim avtomatik dayandırılır və randevu qəbul edə bilmir |
BR-700-05 | Həkimin bütün əməliyyatları (cədvəl dəyişikliyi, randevu qərarı, sənəd baxışı) audit log-a yazılır |
BR-700-06 | Klinika admini həkimin cədvəlinə müdaxilə edə bilər, lakin tibbi məzmununa yox |

## Modul 8 — Clinic Admin Panel (800)

### UC-801 — Clinic Profile Management

Use case ID | UC-801 |
Use case name | Clinic Profile Management (Klinika profilinin idarəsi) |
Description | Klinika administratoru öz klinikasının platformadakı profilini idarə edir: əsas məlumatlar, ünvan və xəritə, əlaqə vasitələri, iş saatları, fotolar və təsvir. Bu məlumatlar pasientin gördüyü klinika səhifəsini formalaşdırır. |
User type | Clinic Admin |
Preconditions |
- Klinika admini sistemə daxil olub
- Klinika Super Admin tərəfindən verifikasiya edilib və aktivdir |
Extra info | Profildə iki qat məlumat var: Super Admin tərəfindən təyin edilənlər (qeydiyyat nömrəsi, lisenziya nömrəsi və müddəti, klinika növü — admin dəyişə bilməz) və klinika admininin idarə etdikləri (təsvir, əlaqə, ünvan, iş saatları, fotolar). Klinikanın iş saatları həkim cədvəlləri üçün yuxarı sərhəddir. |
Successful user flow |
- Klinika admini /clinic-admin/profile səhifəsinə daxil olur
- Sistem klinikanın mövcud məlumatlarını göstərir
- Sistem Super Admin tərəfindən təyin edilmiş sahələri read-only göstərir: qeydiyyat nömrəsi, lisenziya nömrəsi və müddəti, klinika növü
- Admin redaktə oluna bilən sahələri dəyişir: təsvir, əlaqə telefonu, email, veb sayt
- Admin ünvanı və xəritə koordinatlarını dəqiqləşdirir
- Admin klinika loqosunu yükləyir
- Admin fotoqalereya üçün şəkillər əlavə edir və sıralayır
- Admin iş saatlarını həftənin günləri üzrə təyin edir
- Admin qəbul edilən sığorta şirkətlərini seçir (optional)
- Admin "Yadda saxla" düyməsini basır
- Sistem məlumatları validasiya edir
- Sistem iş saatlarının mövcud həkim cədvəlləri ilə uyğunluğunu yoxlayır
- Sistem klinika profilini və iş saatlarını yeniləyir
- Sistem dəyişikliyi audit log-a yazır
- Sistem dəyişiklikləri pasient tərəfində dərhal əks etdirir |
Alternative case 1: İş saatlarının kütləvi təyini | Admin bir günün saatlarını təyin edib "Bütün iş günlərinə tətbiq et" seçir. Sistem eyni saatları bazar ertəsi–cümə üçün kopyalayır. |
Alternative case 2: Bayram günlərinin təyini | Admin xüsusi tarixləri (bayram, texniki fasilə) qeyri-iş günü kimi işarələyir. Sistem həmin günlərdə bütün həkimlərin slotlarını avtomatik bağlayır. |
Alternative case 3: Klinikanın müvəqqəti dayandırılması | Admin klinikanı müvəqqəti "bağlı" statusuna keçirir (təmir, texniki fasilə). Yeni randevu qəbulu dayanır, mövcud randevular qalır. |
Alternative case 4: Fotoların sıralanması | Admin fotoların göstərilmə ardıcıllığını drag-and-drop ilə dəyişir. |
Error cases |
- EF-801-1 Lisenziya redaktəsi cəhdi: Sahə read-only, Super Admin-ə müraciət tələb olunur
- EF-801-2 İş saatı həkim cədvəli ilə konflikt: "N həkimin cədvəli bu saatlardan kənardır" xəbərdarlığı və təsdiq tələbi
- EF-801-3 Aktiv randevusu olan saatın bağlanması: Təsirlənən randevu sayı göstərilir, qərar tələb olunur
- EF-801-4 Yanlış koordinat: Xəritə koordinatları ünvanla uyğun gəlmirsə xəbərdarlıq göstərilir
- EF-801-5 Başqa klinikanın profilinə giriş: Sistem bloklayır və təhlükəsizlik log-una yazır |
Business Rules |
- BR-801-01: Klinika admini yalnız öz klinikasının profilini idarə edə bilər
- BR-801-02: Lisenziya və qeydiyyat məlumatları yalnız Super Admin tərəfindən dəyişilə bilər
- BR-801-03: Klinika növü Super Admin tərəfindən təyin edilir
- BR-801-04: Profil dəyişiklikləri dərhal pasient tərəfində əks olunur
- BR-801-05: İş saatları həkim cədvəlləri üçün yuxarı sərhəddir
- BR-801-06: Klinika müvəqqəti bağlandıqda yeni randevu qəbul edilmir
- BR-801-07: Bayram günləri bütün həkimlərin slotlarını bağlayır
- BR-801-08: Bütün profil dəyişiklikləri audit log-a yazılır |
Features |
- FR-801-A — Basic Information (Əsas məlumatlar): profil göstərimi, Super Admin sahələrinin qorunması, təsvir, əlaqə, ünvan və koordinatlar, loqo, fotoqalereya, sığorta seçimi
- FR-801-B — Working Hours (İş saatları): həftəlik saat təyini, qeyri-iş günləri, kütləvi tətbiq, bayram günləri, həkim cədvəli konflikt yoxlaması, slotların avtomatik bağlanması
- FR-801-C — Clinic Status & Security (Status və təhlükəsizlik): müvəqqəti bağlama, randevu qəbulunun dayandırılması, klinika sərhədinin təmini, başqa klinikaya girişin bloklanması, audit log |
Technical flow | |
Service type | REST API (sync) |
Database / Table name | |
UI link | /clinic-admin/profile |

### UC-802 — Doctor Management

Use case ID | UC-802 |
Use case name | Doctor Management (Həkimlərin idarəsi) |
Description | Klinika administratoru klinikaya həkim əlavə edir, lisenziya məlumatlarını daxil edir, aktiv/passiv statusunu idarə edir və klinikadan çıxarır. Həkim özü qeydiyyatdan keçə bilmədiyi üçün bu proses həkimin sistemə giriş qapısıdır. |
User type | Clinic Admin (Secondary: Doctor, Notification Service) |
Preconditions |
- Klinika admini sistemə daxil olub
- Klinika aktiv statusdadır |
Extra info | Həkimin sistemə əlavə olunma zənciri: admin məlumatları daxil edir → sistem dəvət göndərir → həkim SİMA ilə şəxsiyyətini təsdiqləyir → həkim profilini tamamlayır → axtarışda görünür. Həkim artıq başqa klinikada işləyirsə, mövcud profili istifadə olunur və yalnız yeni klinika bağlantısı yaradılır. |
Successful user flow |
- Klinika admini /clinic-admin/doctors səhifəsinə daxil olur
- Sistem klinikadakı həkimlərin siyahısını göstərir: foto, ad, ixtisas, status, randevu sayı, reytinq
- Admin "Həkim əlavə et" düyməsini basır
- Sistem həkim əlavə etmə formasını açır
- Admin həkimin FIN və telefon nömrəsini daxil edir
- Sistem bu FIN ilə istifadəçinin sistemdə olub-olmadığını yoxlayır
- Sistem nəticəni göstərir: mövcud istifadəçi tapıldı / yeni istifadəçi yaradılacaq
- Admin həkimin ad-soyadını daxil edir (yeni istifadəçi halında)
- Admin tibbi lisenziya nömrəsini daxil edir
- Admin lisenziyanın bitmə tarixini daxil edir
- Admin lisenziya və diplom sənədlərini yükləyir
- Admin həkimin ixtisas(lar)ını seçir
- Admin kabinet nömrəsini daxil edir (optional)
- Admin həkimin bu klinikada göstərəcəyi xidmətləri təyin edir
- Admin "Dəvət göndər" düyməsini basır
- Sistem həkim istifadəçi qeydini yaradır (əgər yoxdursa)
- Sistem həkim–klinika bağlantısını "dəvət edilib" statusu ilə yaradır
- Sistem ixtisas və xidmət qeydlərini yaradır
- Sistem həkimin telefon nömrəsinə dəvət SMS-i göndərir (qeydiyyat linki ilə)
- Həkim dəvət linkini açır və SİMA ilə şəxsiyyətini təsdiqləyir
- Sistem həkimin şəxsiyyətini təsdiqlənmiş kimi işarələyir
- Sistem həkim–klinika bağlantısını "aktiv" statusuna keçirir
- Sistem həkimi profil tamamlama səhifəsinə yönləndirir (UC-701)
- Sistem klinika admininə "Həkim dəvəti qəbul etdi" bildirişi göndərir
- Sistem əməliyyatı audit log-a yazır |
Alternative case 1: Mövcud həkimin əlavə edilməsi | Həkim artıq başqa klinikada işləyirsə, sistem onun mövcud profilini göstərir. Admin yalnız bu klinikaya aid məlumatları (xidmətlər, kabinet) daxil edir. Həkimə "Yeni klinika dəvəti" bildirişi gedir; qəbul etdikdə bağlantı aktivləşir. |
Alternative case 2: Həkimin deaktivləşdirilməsi | Admin həkimin statusunu "passiv" edir. Həkim axtarışda görünmür, yeni randevu qəbul etmir, lakin mövcud randevular qalır və həkim panelə daxil ola bilir. |
Alternative case 3: Yenidən aktivləşdirmə | Admin passiv həkimi yenidən aktiv edir. Həkimin slotları yenidən generasiya olunur və axtarışda görünür. |
Alternative case 4: Həkimin klinikadan çıxarılması | Admin həkimi klinikadan çıxarır. Sistem gələcək randevuları yoxlayır; varsa xəbərdarlıq göstərir və qərar tələb edir. |
Alternative case 5: Lisenziyanın yenilənməsi | Admin həkimin lisenziya müddətini uzadır və yeni sənəd yükləyir. Sistem dayandırılmış həkimi yenidən aktivləşdirir. |
Alternative case 6: Dəvətin təkrar göndərilməsi | Həkim dəvəti qəbul etməyibsə və ya link müddəti bitibsə, admin dəvəti təkrar göndərir. |
Error cases |
- EF-802-1 Həkim dəvəti rədd edir: Bağlantı "ləğv edilib" statusuna keçir, admin xəbərdar edilir
- EF-802-2 Lisenziya nömrəsi təkrarlanır: Eyni nömrə başqa həkimə aiddirsə əməliyyat bloklanır
- EF-802-3 Lisenziya müddəti keçib: Keçmiş tarixli lisenziya qəbul edilmir
- EF-802-4 Aktiv randevusu olan həkimin çıxarılması: "Bu həkimin N aktiv randevusu var" → seçim: randevuları ləğv et və pasientləri xəbərdar et, yaxud əməliyyatı ləğv et
- EF-802-5 Həkim artıq bu klinikadadır: "Bu həkim artıq klinikanızda qeydiyyatdadır"
- EF-802-6 Dəvət müddəti bitib: Link 7 gün ərzində istifadə edilməzsə etibarsız olur
- EF-802-7 Sənəd yükləmə xətası: Format və ölçü uyğun deyilsə rədd edilir |
Business Rules |
- BR-802-01: Həkim özü qeydiyyatdan keçə bilməz; yalnız klinika admini tərəfindən əlavə edilir
- BR-802-02: Həkim sistemə daxil olmaq üçün SİMA ilə şəxsiyyətini təsdiqləməlidir
- BR-802-03: Bir lisenziya nömrəsi yalnız bir həkimə aid ola bilər
- BR-802-04: Həkim dəvəti qəbul etmədən klinikaya aktiv bağlanmır
- BR-802-05: Həkim bir neçə klinikada işləyə bilər; hər klinika ayrıca bağlantıdır
- BR-802-06: Aktiv randevusu olan həkim birbaşa çıxarıla bilməz
- BR-802-07: Passiv həkim axtarışda görünmür, lakin panelə daxil ola bilir
- BR-802-08: Lisenziya müddəti bitmiş həkim avtomatik dayandırılır
- BR-802-09: Dəvət linki 7 gün etibarlıdır
- BR-802-10: Klinika admini həkimin tibbi məzmununu (resept, sənəd, müayinə qeydi) görə bilməz |
Features |
- FR-802-A — Doctor Onboarding (Həkimin sistemə əlavəsi): özbaşına qeydiyyatın bloklanması, FIN üzrə yoxlama, lisenziya nömrəsi və müddəti, unikallıq yoxlaması, sənəd yükləmə, ixtisas seçimi, SMS dəvəti, 7 günlük link, SİMA doğrulaması, təkrar dəvət
- FR-802-B — Doctor Status Management (Status idarəsi): həkim siyahısı, status və statistika göstərimi, deaktivləşdirmə, yenidən aktivləşdirmə, axtarışdan çıxarma, klinikadan çıxarma, aktiv randevu bloklaması, filtrləmə, lisenziya müddəti izləməsi və xəbərdarlıq
- FR-802-C — Doctor Services (Həkimin xidmətləri): xidmət təyini, xidmət müddəti, həkim–xidmət bağlantısı, kabinet nömrəsi
- FR-802-D — Access Restrictions (Giriş məhdudiyyətləri): tibbi sənədlərə girişin bloklanması, reseptlərə girişin bloklanması, müayinə qeydlərinin gizlədilməsi, yalnız əməliyyat məlumatının göstərilməsi, audit log |
Technical flow | |
Service type | REST API (sync) + SMS (async) + SİMA callback (async) |
Database / Table name | |
UI link | /clinic-admin/doctors, /clinic-admin/doctors/new, /clinic-admin/doctors/{doctorId} |

### UC-803 — Admin Manages Doctor Schedule

Use case ID | UC-803 |
Use case name | Admin Manages Doctor Schedule (Adminin həkim cədvəlini idarəsi) |
Description | Klinika administratoru həkimin cədvəlini görür və redaktə edir. Bu, xüsusilə fövqəladə hallarda kritikdir: həkim xəstələnəndə, təcili məzuniyyətə çıxanda admin onun slotlarını bağlayıb pasientləri xəbərdar edə bilir. |
User type | Clinic Admin (Secondary: Doctor, Patient) |
Preconditions |
- Admin sistemə daxil olub
- Həkim bu klinikaya aktiv bağlıdır |
Extra info | Admin yalnız öz klinikasındakı cədvəli görür — həkim başqa klinikada da işləyirsə, oradakı cədvəli admin-ə görünmür. Admin tərəfindən edilən hər dəyişiklik həkimə mütləq bildirilir və audit log-da admin ID-si ilə qeyd olunur. |
Successful user flow |
- Admin həkim detallarında "Cədvələ bax" düyməsini basır
- Sistem həkimin bu klinikadakı cədvəlini həftəlik təqvim görünüşündə göstərir
- Sistem hər slotu statusuna görə rəngləyir: boş, tutulub, bağlı
- Sistem randevusu olan slotlarda pasient adını göstərir
- Admin "Redaktə et" düyməsini basır
- Admin cədvəl parametrlərini dəyişir (iş günləri, saatlar, slot müddəti, fasilələr)
- Admin "Yadda saxla" düyməsini basır
- Sistem validasiya edir və mövcud randevularla konflikti yoxlayır
- Sistem konflikt varsa xəbərdarlıq göstərir və qərar tələb edir
- Admin qərarı seçir
- Sistem cədvəli yeniləyir və slotları yenidən generasiya edir
- Sistem dəyişikliyi edən şəxs kimi admin-i qeyd edir
- Sistem həkimə "Cədvəliniz administrator tərəfindən dəyişdirildi" bildirişi göndərir
- Sistem təsirlənən pasientlərə bildiriş göndərir
- Sistem əməliyyatı audit log-a yazır |
Alternative case 1: Təcili gün bağlama | Həkim xəstələnib. Admin konkret günü seçib "Bu günü bağla" basır. Sistem həmin günün bütün randevularını göstərir və hər biri üçün qərar tələb edir: ləğv et və ya başqa həkimə köçür. |
Alternative case 2: Randevuların başqa həkimə köçürülməsi | Admin təsirlənən randevuları eyni ixtisasdan başqa həkimə köçürməyi seçir. Sistem uyğun boş slotları tapır və pasientlərə təsdiq üçün bildiriş göndərir. |
Alternative case 3: Məzuniyyət təyini | Admin həkim üçün tarix aralığı seçib məzuniyyət təyin edir. Həmin dövrdə randevu qəbulu dayanır. |
Alternative case 4: Ümumi cədvəl görünüşü | Admin bütün həkimlərin cədvəlini bir ekranda görür — resurs planlaması və kabinet bölgüsü üçün istifadə olunur. |
Error cases |
- EF-803-1 Randevusu olan slotun silinməsi: Birbaşa silinməyə icazə verilmir, əvvəlcə randevunun idarəsi tələb olunur
- EF-803-2 Klinika saatından kənar cədvəl: Xəbərdarlıq göstərilir və klinika iş saatlarını genişləndirmək təklif olunur
- EF-803-3 Həkim eyni vaxtda başqa klinikadadır: Konflikt xəbərdarlığı göstərilir və əməliyyat bloklanır
- EF-803-4 Başqa klinikanın həkimi: Admin öz klinikasına bağlı olmayan həkimin cədvəlinə keçə bilmir
- EF-803-5 Kabinet konflikti: Eyni kabinetə iki həkim təyin edilərsə xəbərdarlıq göstərilir |
Business Rules |
- BR-803-01: Admin yalnız öz klinikasındakı həkimlərin cədvəlini idarə edə bilər
- BR-803-02: Admin dəyişikliyi həkimə mütləq bildirilir
- BR-803-03: Randevusu olan slot birbaşa silinə bilməz
- BR-803-04: Cədvəl dəyişikliyi səbəbindən ləğv olunan randevular üçün pasientlərə bildiriş gedir
- BR-803-05: Admin dəyişiklikləri audit log-da admin ID-si ilə qeyd olunur
- BR-803-06: Randevu başqa həkimə köçürüldükdə pasient təsdiqi tələb olunur
- BR-803-07: Admin həkimin başqa klinikadakı cədvəlini görə bilməz |
Features |
- FR-803-A — Schedule Viewing & Editing (Cədvəlin görünüşü və redaktəsi): təqvim görünüşü, slot statusunun rənglənməsi, pasient adının göstərilməsi, cədvəl redaktəsi, gün bağlama, məzuniyyət, ümumi cədvəl görünüşü, klinika sərhədinin təmini
- FR-803-B — Conflict Resolution (Konflikt həlli): randevu konfliktinin aşkarlanması, təsirlənən randevuların siyahısı, qərar seçimi, başqa həkimə köçürmə, pasient təsdiqi, kabinet konflikti, iki klinika konflikti
- FR-803-C — Notification & Audit (Bildiriş və audit): həkimə bildiriş, pasientlərə bildiriş, dəyişikliyi edən şəxsin qeydi, audit log |
Technical flow | |
Service type | REST API (sync) + async bildiriş |
Database / Table name | |
UI link | /clinic-admin/doctors/{doctorId}/schedule |

### UC-804 — Services Management

Use case ID | UC-804 |
Use case name | Services Management (Xidmətlərin idarəsi) |
Description | Klinika administratoru klinikanın təklif etdiyi xidmətləri və onların müddətini idarə edir, xidmətləri konkret həkimlərə bağlayır. Xidmət müddəti slot planlaşdırmasına birbaşa təsir edir. |
User type | Clinic Admin |
Preconditions |
- Admin sistemə daxil olub
- Klinika aktivdir və ən azı bir həkimi var |
Extra info | Xidmət kataloqu Super Admin tərəfindən mərkəzləşdirilmiş şəkildə idarə olunur — klinika yalnız bu kataloqdan seçim edir. Qiymət platformada göstərilmir: müayinənin dəyəri klinikada, qəbul zamanı müəyyən edilir. Xidmət müddəti isə slot generasiyası üçün vacibdir. |
Successful user flow |
- Admin /clinic-admin/services səhifəsinə daxil olur
- Sistem klinikanın mövcud xidmətlərini siyahılayır: xidmət adı, kateqoriya, müddət, hansı həkimlər
- Admin "Xidmət əlavə et" düyməsini basır
- Sistem mərkəzi xidmət kataloqundan seçim təqdim edir
- Admin xidməti seçir
- Admin xidmətin müddətini təyin edir
- Admin bu xidməti göstərəcək həkimləri seçir
- Admin "Yadda saxla" düyməsini basır
- Sistem xidmət–həkim bağlantılarını yaradır
- Sistem xidmət müddətini slot planlaşdırmasına tətbiq edir
- Sistem xidməti klinika və həkim səhifələrində göstərir
- Sistem əməliyyatı audit log-a yazır |
Alternative case 1: Xidmətin deaktivləşdirilməsi | Admin xidməti müvəqqəti dayandırır. Yeni randevu üçün seçilə bilmir, mövcud randevular qalır. |
Alternative case 2: Xidmətin silinməsi | Admin xidməti tam silir. Sistem aktiv randevuların olub-olmadığını yoxlayır. |
Alternative case 3: Müddətin dəyişdirilməsi | Admin xidmət müddətini yeniləyir. Dəyişiklik yalnız yeni slot generasiyasına tətbiq olunur, mövcud randevulara təsir etmir. |
Alternative case 4: Yeni xidmət tələbi | Klinikanın təklif etdiyi xidmət mərkəzi kataloqda yoxdursa, admin Super Admin-ə kataloqa əlavə tələbi göndərir. |
Error cases |
- EF-804-1 Aktiv randevusu olan xidmətin silinməsi: Bloklanır, əvvəlcə randevuların tamamlanması və ya ləğvi tələb olunur
- EF-804-2 İxtisasla uyğunsuz xidmət: "Bu xidmət seçilmiş həkimin ixtisası ilə uyğun gəlmir" xəbərdarlığı
- EF-804-3 Müddət slot müddəti ilə uyğunsuz: Xidmət müddəti həkimin slot müddətindən çoxdursa xəbərdarlıq göstərilir və slot birləşdirmə məntiqi tətbiq olunur
- EF-804-4 Həkimsiz xidmət: Heç bir həkim seçilmədən xidmət saxlanıla bilməz |
Business Rules |
- BR-804-01: Xidmət kataloqu Super Admin tərəfindən mərkəzləşdirilmiş idarə olunur
- BR-804-02: Klinika yalnız kataloqdan xidmət seçə bilər
- BR-804-03: Qiymət platformada göstərilmir — müayinənin dəyəri klinikada müəyyən edilir
- BR-804-04: Xidmət müddəti slot planlaşdırmasına təsir edir
- BR-804-05: Aktiv randevusu olan xidmət silinə bilməz
- BR-804-06: Hər xidmət ən azı bir həkimə bağlanmalıdır
- BR-804-07: Müddət dəyişikliyi mövcud randevulara təsir etmir |
Features |
- FR-804-A — Service Management (Xidmətin idarəsi): xidmət siyahısı, kataloqdan seçim, həkimə bağlama, deaktivləşdirmə, silmə, aktiv randevu bloklaması, yeni xidmət tələbi, kateqoriya üzrə qruplaşdırma
- FR-804-B — Duration & Validation (Müddət və validasiya): müddət təyini, slot planlaşdırmasında istifadə, müddət–slot uyğunsuzluğu xəbərdarlığı, ixtisas–xidmət uyğunluğu, həkimsiz xidmətin bloklanması |
Technical flow | |
Service type | REST API (sync) |
Database / Table name | |
UI link | /clinic-admin/services |

### UC-805 — Appointment Oversight & Reports

Use case ID | UC-805 |
Use case name | Appointment Oversight & Reports (Randevulara nəzarət və hesabatlar) |
Description | Klinika administratoru klinikadakı bütün randevulara nəzarət edir, filtrləyir, lazım gəldikdə müdaxilə edir və əməliyyat hesabatlarını görür. Tibbi məzmuna giriş yoxdur — yalnız əməliyyat məlumatı. |
User type | Clinic Admin |
Preconditions |
- Admin sistemə daxil olub
- Klinikada ən azı bir həkim və randevu mövcuddur |
Extra info | Admin randevu haqqında görür: booking reference, pasient adı, həkim, tarix, saat, xidmət, status. Görmür: şikayət mətni, diaqnoz, resept, tibbi sənəd, müayinə qeydi. Bu ayrım məxfilik tələbinin əsasıdır. |
Successful user flow |
- Admin /clinic-admin/appointments səhifəsinə daxil olur
- Sistem klinikadakı bütün randevuları göstərir
- Sistem hər sətirdə göstərir: booking reference, pasient adı, həkim, tarix, saat, xidmət, status
- Sistem tibbi məzmunu (şikayət, diaqnoz, resept, sənəd) göstərmir
- Admin filtr tətbiq edir: tarix aralığı, həkim, status, xidmət
- Sistem nəticələri filtrləyir
- Admin randevuya klikləyir
- Sistem əməliyyat detallarını göstərir (tibbi məzmun istisna olmaqla)
- Admin lazım gələrsə əməliyyat aparır: ləğv et, vaxtı dəyiş, no-show işarələ
- Sistem əməliyyatı icra edir və aidiyyəti tərəflərə bildiriş göndərir
- Sistem əməliyyatı audit log-a yazır |
Alternative case 1: Gündəlik icmal | Admin bugünkü randevuların icmalını görür: ümumi say, təsdiqlənmiş, tamamlanmış, ləğv edilmiş, gəlməyən. |
Alternative case 2: Həkim üzrə statistika | Admin hər həkimin göstəricilərini görür: randevu sayı, tamamlanma faizi, no-show faizi, orta reytinq. |
Alternative case 3: No-show analizi | Admin gəlməyən pasientlərin siyahısını və tendensiyasını görür — cədvəl planlaşdırması üçün faydalıdır. |
Alternative case 4: Yük analizi | Admin saat və gün üzrə randevu sıxlığını görür (resurs planlaması üçün). |
Alternative case 5: Hesabatların export edilməsi | Admin hesabatı Excel və ya PDF formatında yükləyir. |
Alternative case 6: Toplu əməliyyat | Admin bir neçə randevunu seçib toplu ləğv edir (fövqəladə hallarda). |
Error cases |
- EF-805-1 Tibbi məzmuna giriş cəhdi: "Bu məlumata giriş icazəniz yoxdur" → cəhd təhlükəsizlik log-una yazılır
- EF-805-2 Başqa klinikanın randevusu: Sistem girişi bloklayır
- EF-805-3 Keçmiş randevunun dəyişdirilməsi: Əməliyyat düymələri göstərilmir (no-show düzəlişi istisna)
- EF-805-4 Boş hesabat: Seçilmiş aralıqda məlumat yoxdursa empty state göstərilir |
Business Rules |
- BR-805-01: Admin yalnız öz klinikasının randevularını görür
- BR-805-02: Admin tibbi məzmuna (şikayət, diaqnoz, resept, sənəd, müayinə qeydi) giriş edə bilməz
- BR-805-03: Admin yalnız əməliyyat məlumatını görür: kim, nə vaxt, hansı həkim, hansı xidmət, status
- BR-805-04: Admin randevunu ləğv edə və vaxtını dəyişə bilər
- BR-805-05: Admin əməliyyatları audit log-a yazılır
- BR-805-06: No-show statusu 24 saat ərzində düzəldilə bilər |
Features |
- FR-805-A — Appointment Oversight (Randevulara nəzarət): bütün randevuların göstərilməsi, tibbi məzmunun gizlədilməsi, tarix/həkim/status/xidmət filtri, ləğv, vaxt dəyişikliyi, no-show işarələmə, toplu əməliyyat, klinika sərhədinin təmini
- FR-805-B — Reports & Analytics (Hesabatlar və analitika): gündəlik icmal, həkim üzrə statistika, tamamlanma faizi, no-show faizi, yük analizi, Excel və PDF export, tarix aralığı seçimi |
Technical flow | |
Service type | REST API (sync) + report generation (async export) |
Database / Table name | |
UI link | /clinic-admin/appointments, /clinic-admin/reports |

Klinika admininin görmə səlahiyyətləri (Clinic Admin Visibility Matrix) Bu matris admin-in nəyi görüb-görmədiyini bir yerdə göstərir, modulun məxfilik məntiqinin xülasəsidir:
Məlumat | Görür? | Şərt / İzah |
Öz klinikasının randevuları | Bəli | Yalnız əməliyyat məlumatı |
Pasientin adı və randevu vaxtı | Bəli | Operativ idarəetmə üçün zəruridir |
Pasientin şikayət mətni | Xeyr | Tibbi məzmun sayılır |
Tibbi sənədlər | Xeyr | Heç bir halda — sistem səviyyəsində bloklanır |
Reseptlər | Xeyr | Heç bir halda |
Diaqnoz və müayinə qeydləri | Xeyr | Heç bir halda |
Həkimin cədvəli | Bəli | Yalnız öz klinikası üzrə, redaktə hüququ ilə |
Həkimin başqa klinikadakı cədvəli | Xeyr | Klinika sərhədi |
Həkimin lisenziya sənədləri | Bəli | Özü daxil etdiyi üçün |
Başqa klinikanın datası | Xeyr | Sistem səviyyəsində bloklanır, cəhd log-a yazılır |
Klinika statistikası | Bəli | Randevu sayı, no-show faizi, tamamlanma faizi |
Xidmət qiyməti | — | Platformada qiymət anlayışı yoxdur; dəyər klinikada müəyyən edilir |

### Modul 8 — Ümumi Business Rules

ID | Qayda |

ID | Qayda |
BR-800-01 | Klinika admini platformanın operativ idarəetmə qatıdır — tibbi qərarlara müdaxilə etmir |
BR-800-02 | Admin-in bütün əməliyyatları öz klinikasının sərhədi ilə məhdudlaşır |
BR-800-03 | Həkim platformaya yalnız klinika admini vasitəsilə daxil ola bilər |
BR-800-04 | Tibbi məzmuna giriş cəhdi bloklanır və təhlükəsizlik log-una yazılır |
BR-800-05 | Admin tərəfindən edilən hər dəyişiklik audit log-da admin ID-si ilə qeyd olunur |
BR-800-06 | Klinika profilində Super Admin sahələri (lisenziya, qeydiyyat, növ) dəyişdirilə bilməz |
BR-800-07 | Klinikanın iş saatları həkim cədvəlləri üçün yuxarı sərhəddir |

## Modul 9 — Super Admin Panel (900)

### UC-901 — Clinic Onboarding & Verification

Use case ID | UC-901 |
Use case name | Clinic Onboarding & Verification (Klinikanın sistemə əlavəsi və verifikasiyası) |
Description | Super Admin klinika ilə müqavilə bağlandıqdan sonra klinikanı platformaya əlavə edir, rəsmi sənədlərini yoxlayır, verifikasiya edir və klinika admini hesabı yaradır. Bu, bütün platformanın fəaliyyətinin başlanğıc nöqtəsidir. |
User type | Super Admin (Secondary: Clinic Admin, Notification Service) |
Preconditions |
- Super Admin sistemə daxil olub
- Klinika ilə platforma arasında müqavilə bağlanıb
- Klinikanın rəsmi sənədləri təqdim edilib |
Extra info | Platformanın giriş zənciri: müqavilə → Super Admin klinikanı əlavə edir → klinika admini təyin olunur → admin həkimləri əlavə edir → həkimlər profilini tamamlayır → pasientlər randevu alır. Verifikasiya edilməmiş klinika platformada görünmür. Lisenziya müddəti sistem tərəfindən gündəlik izlənilir. |
Successful user flow |
- Super Admin /admin/clinics səhifəsinə daxil olur
- Sistem bütün klinikaların siyahısını göstərir: ad, növ, şəhər, status, həkim sayı, qeydiyyat tarixi
- Super Admin "Klinika əlavə et" düyməsini basır
- Sistem klinika əlavə etmə formasını açır
- Super Admin əsas məlumatları daxil edir: ad, növ, şəhər, rayon, ünvan
- Super Admin rəsmi qeydiyyat nömrəsini daxil edir
- Super Admin fəaliyyət lisenziyasının nömrəsini və bitmə tarixini daxil edir
- Super Admin rəsmi sənədləri yükləyir: qeydiyyat şəhadətnaməsi, lisenziya, müqavilə
- Super Admin əlaqə məlumatlarını daxil edir: telefon, email
- Super Admin sənədlərin həqiqiliyini yoxlayır
- Super Admin lisenziya nömrəsini rəsmi reyestrdə yoxlayır
- Super Admin klinika admini üçün məlumatları daxil edir: FIN, telefon, ad-soyad
- Super Admin "Klinikanı yarat və təsdiqlə" düyməsini basır
- Sistem klinika qeydini "aktiv" statusu ilə yaradır və verifikasiya edən admin-i qeyd edir
- Sistem klinika admini istifadəçi hesabını yaradır
- Sistem admini klinikaya bağlayır və giriş sərhədini təyin edir
- Sistem klinika admininə dəvət SMS-i göndərir (qeydiyyat linki ilə)
- Sistem verifikasiya əməliyyatını audit log-a yazır
- Klinika admini dəvət linkini açır və SİMA ilə şəxsiyyətini təsdiqləyir
- Sistem admin hesabını aktivləşdirir və PIN təyin etməyə yönləndirir
- Sistem klinika adminini /clinic-admin panelinə yönləndirir |
Alternative case 1: Klinikanın müraciəti üzrə əlavə | Klinika platformaya müraciət göndərir (əlaqə formu vasitəsilə). Super Admin müraciəti nəzərdən keçirir və müqavilə prosesini başladır. |
Alternative case 2: Gözləmə vəziyyətində saxlama | Super Admin sənədləri natamam görürsə, klinikanı "verifikasiya gözləyir" statusunda saxlayır və əlavə sənəd tələb edir. |
Alternative case 3: Klinikanın müvəqqəti dayandırılması | Super Admin klinikanı "dayandırılmış" statusuna keçirir (qayda pozuntusu, lisenziya problemi). Bütün həkimləri axtarışdan çıxarılır, yeni randevu qəbulu dayanır. |
Alternative case 4: Klinikanın deaktivləşdirilməsi | Müqavilə bitdikdə və ya pozulduqda Super Admin klinikanı deaktiv edir. Sistem aktiv randevuları yoxlayır və idarəsini tələb edir. |
Alternative case 5: İkinci admin təyini | Super Admin bir klinikaya bir neçə admin təyin edə bilər (böyük klinikalar üçün). |
Alternative case 6: Lisenziyanın yenilənməsi | Super Admin klinikanın lisenziya müddətini uzadır və yeni sənəd yükləyir. Dayandırılmış klinika yenidən aktivləşir. |
Error cases |
- EF-901-1 Qeydiyyat nömrəsi təkrarlanır: Eyni nömrə ilə klinika mövcuddursa bloklanır və mövcud klinika göstərilir
- EF-901-2 Lisenziya reyestrdə tapılmır: Verifikasiya dayandırılır, klinikadan izahat tələb olunur
- EF-901-3 Lisenziya müddəti keçib: Keçmiş tarixli lisenziya qəbul edilmir
- EF-901-4 Saxta sənəd aşkarlanır: Müraciət rədd edilir, hadisə təhlükəsizlik reyestrinə yazılır
- EF-901-5 Admin FIN-i başqa hesaba aiddir: Rol konflikti xəbərdarlığı göstərilir
- EF-901-6 Aktiv randevusu olan klinikanın deaktivləşdirilməsi: Bloklanır, əvvəlcə randevuların idarəsi tələb olunur
- EF-901-7 Klinika lisenziyasının bitməsi: Sistem gündəlik yoxlama aparır, müddəti bitən klinikanı avtomatik dayandırır və Super Admin-i xəbərdar edir |
Business Rules |
- BR-901-01: Klinika yalnız Super Admin tərəfindən sistemə əlavə edilə bilər
- BR-901-02: Klinika verifikasiya edilmədən platformada görünmür
- BR-901-03: Bir qeydiyyat nömrəsi yalnız bir klinikaya aid ola bilər
- BR-901-04: Klinika admini Super Admin tərəfindən təyin edilir
- BR-901-05: Klinika admini SİMA ilə şəxsiyyətini təsdiqləməlidir
- BR-901-06: Lisenziya müddəti bitən klinika avtomatik dayandırılır
- BR-901-07: Dayandırılmış klinikanın bütün həkimləri axtarışdan çıxarılır
- BR-901-08: Aktiv randevusu olan klinika birbaşa deaktiv edilə bilməz
- BR-901-09: Bir klinikaya bir neçə admin təyin edilə bilər
- BR-901-10: Bütün verifikasiya qərarları audit log-a yazılır |
Features |
- FR-901-A — Clinic Creation (Klinikanın yaradılması): klinika əlavə etmə, özbaşına qeydiyyatın bloklanması, qeydiyyat nömrəsi və unikallıq, lisenziya nömrəsi və müddəti, sənəd yükləmə, klinika növü, ünvan və koordinatlar
- FR-901-B — Verification (Verifikasiya): status idarəsi, sənədlərin göstərilməsi, təsdiq və rədd, rədd səbəbi, əlavə sənəd tələbi, verifikasiyasız klinikanın gizlədilməsi, verifikasiya edən admin və tarixin qeydi, audit log
- FR-901-C — Clinic Admin Assignment (Admin təyini): admin hesabının yaradılması, SMS dəvəti, SİMA doğrulaması, rol konflikti yoxlaması, çoxlu admin, klinika sərhədinin təyini
- FR-901-D — Clinic Lifecycle (Həyat dövrü): müvəqqəti dayandırma, deaktivləşdirmə, həkimlərin axtarışdan çıxarılması, aktiv randevu bloklaması, lisenziyanın gündəlik yoxlanması, avtomatik dayandırma, 30 günlük xəbərdarlıq, lisenziyanın yenilənməsi |
Technical flow | |
Service type | REST API (sync) + SMS (async) + scheduled job (lisenziya yoxlaması) |
Database / Table name | |
UI link | /admin/clinics, /admin/clinics/new, /admin/clinics/{clinicId}/verify |

### UC-902 — User Management

Use case ID | UC-902 |
Use case name | User Management (İstifadəçilərin idarəsi) |
Description | Super Admin bütün istifadəçiləri (pasient, həkim, klinika admini) görür, axtarır, bloklayır və hesab problemlərini həll edir. Tibbi məzmuna girişi yoxdur — yalnız hesab metadata-sı. |
User type | Super Admin |
Preconditions |
- Super Admin sistemə daxil olub |
Extra info | Super Admin hesab haqqında görür: profil məlumatları, rol, status, qeydiyyat tarixi, son giriş, aktiv sessiyalar, randevu sayı (statistika), audit tarixçəsi. Görmür: tibbi sənəd, resept, diaqnoz, müayinə qeydi. Hər əməliyyat üçün səbəb qeyd olunmalıdır. |
Successful user flow |
- Super Admin /admin/users səhifəsinə daxil olur
- Sistem bütün istifadəçiləri siyahılayır: ad, rol, telefon, status, qeydiyyat tarixi, son giriş
- Super Admin filtr tətbiq edir: rol, status, qeydiyyat tarixi, klinika
- Sistem nəticələri filtrləyir
- Super Admin istifadəçiyə klikləyir
- Sistem hesab detallarını göstərir: profil məlumatları, rol, status, aktiv sessiyalar, statistika, audit tarixçəsi
- Sistem tibbi məzmunu göstərmir
- Super Admin lazımi əməliyyatı seçir: blokla, blokdan çıxar, sil, rol dəyiş
- Sistem əməliyyat üçün səbəb tələb edir
- Super Admin səbəbi daxil edir və təsdiqləyir
- Sistem əməliyyatı tətbiq edir
- Sistem bloklama halında bütün aktiv sessiyaları bağlayır
- Sistem istifadəçiyə status dəyişikliyi bildirişi göndərir
- Sistem əməliyyatı audit log-a yazır |
Alternative case 1: İstifadəçi axtarışı | Super Admin FIN, telefon nömrəsi və ya ad üzrə istifadəçi axtarır — dəstək müraciətlərində istifadə olunur. |
Alternative case 2: Hesabın bloklanması | Super Admin qayda pozan istifadəçini bloklayır. Bütün aktiv sessiyalar bağlanır, giriş dayandırılır. |
Alternative case 3: Blokun götürülməsi | Super Admin bloklanmış hesabı yenidən aktivləşdirir və istifadəçiyə bildiriş göndərilir. |
Alternative case 4: Hesabın silinməsi | Super Admin istifadəçinin silinmə tələbini emal edir. Sistem tibbi məlumatların qanunvericiliyə uyğun saxlanılacağını izah edir; hesab anonimləşdirilir. |
Alternative case 5: Aktiv sessiyaların bağlanması | Şübhəli fəaliyyət halında Super Admin istifadəçinin bütün sessiyalarını məcburi bağlayır. |
Alternative case 6: Dəstək müraciətinin həlli | İstifadəçi PIN bərpası və ya digər problemlə dəstəyə müraciət edir. Super Admin hesabın vəziyyətini yoxlayır və köməklik göstərir. |
Error cases |
- EF-902-1 Aktiv randevusu olan həkimin bloklanması: Xəbərdarlıq göstərilir və randevuların idarəsi tələb olunur
- EF-902-2 Yeganə klinika admininin bloklanması: "Bu klinikanın başqa administratoru yoxdur" xəbərdarlığı
- EF-902-3 Tibbi məzmuna giriş cəhdi: Bloklanır və cəhd təhlükəsizlik log-una yazılır
- EF-902-4 Öz hesabının bloklanması: Super Admin öz hesabını bloklaya bilməz
- EF-902-5 Rol konflikti: Rol dəyişikliyi mövcud bağlantılarla konflikt yaradırsa bloklanır
- EF-902-6 Səbəb qeyd edilməyib: Səbəb olmadan əməliyyat tamamlanmır |
Business Rules |
- BR-902-01: Super Admin bütün istifadəçiləri görə bilər
- BR-902-02: Super Admin tibbi məzmuna giriş edə bilməz, yalnız metadata görür
- BR-902-03: Hər əməliyyat üçün səbəb qeyd olunmalıdır
- BR-902-04: Bloklanmış istifadəçi sistemə daxil ola bilməz
- BR-902-05: Silinən hesabın tibbi məlumatları qanunvericiliyə uyğun saxlanılır
- BR-902-06: Aktiv randevusu olan həkim bloklanmadan əvvəl randevular idarə olunmalıdır
- BR-902-07: Super Admin öz hesabını bloklaya və silə bilməz
- BR-902-08: Bloklama halında bütün aktiv sessiyalar bağlanır
- BR-902-09: Bütün admin əməliyyatları audit log-a yazılır |
Features |
- FR-902-A — User Listing & Search (Siyahı və axtarış): bütün istifadəçilərin siyahısı, rol/status/klinika filtri, FIN və telefon üzrə axtarış, hesab detalları, tibbi məzmunun gizlədilməsi, audit tarixçəsi, aktiv sessiyalar
- FR-902-B — User Actions (Əməliyyatlar): bloklama, blokdan çıxarma, hesabın silinməsi, səbəb tələbi, sessiyaların bağlanması, status bildirişi, aktiv randevu xəbərdarlığı, yeganə admin xəbərdarlığı, rol dəyişikliyi, öz hesabının qorunması, audit log |
Technical flow | |
Service type | REST API (sync) + async bildiriş |
Database / Table name | |
UI link | /admin/users, /admin/users/{userId} |

### UC-903 — Content Moderation

Use case ID | UC-903 |
Use case name | Content Moderation (Məzmun moderasiyası) |
Description | Super Admin pasient rəylərini və həkim cavablarını moderasiya edir, şikayət edilmiş məzmunu nəzərdən keçirir və qərar verir. Bu, platformada güvənin qorunması mexanizmidir. |
User type | Super Admin (Secondary: Patient, Doctor) |
Preconditions |
- Super Admin sistemə daxil olub
- Moderasiya növbəsində ən azı bir rəy var |
Extra info | Bütün rəylər dərc olunmadan əvvəl moderasiyadan keçir. Rəydə şəxsi məlumat (telefon, FIN) və ya həssas tibbi detal (diaqnoz, müalicə) varsa, məxfilik riski yaranır — bu hallar avtomatik filtr tərəfindən işarələnir. |
Successful user flow |
- Super Admin /admin/moderation/reviews səhifəsinə daxil olur
- Sistem moderasiya növbəsini göstərir: Gözləyən / Şikayət edilmiş / Rədd edilmiş
- Sistem hər rəy üçün göstərir: mətn, reytinq, pasient (anonim deyilsə), həkim, tarix, avtomatik filtr nəticəsi
- Super Admin rəyi nəzərdən keçirir
- Super Admin qərar verir: təsdiqlə və ya rədd et
- Sistem rədd halında səbəb tələb edir
- Super Admin səbəbi seçir və ya yazır
- Sistem rəy statusunu yeniləyir
- Sistem təsdiq halında rəyi dərc edir
- Sistem həkimin ümumi reytinqini yenidən hesablayır
- Sistem klinikanın reytinqini yenidən hesablayır
- Sistem pasientə nəticə bildirişi göndərir
- Sistem həkimə yeni rəy bildirişi göndərir (təsdiq halında)
- Sistem moderasiya qərarını audit log-a yazır |
Alternative case 1: Toplu təsdiq | Super Admin avtomatik filtrdən təmiz keçmiş rəyləri toplu təsdiqləyir — moderasiya yükünü azaldır. |
Alternative case 2: Həkim cavabının moderasiyası | Həkim rəyə cavab yazıbsa, cavab da eyni moderasiya prosesindən keçir. |
Alternative case 3: Şikayət edilmiş rəyin baxılması | Həkim və ya digər istifadəçi rəyi şikayət edibsə, Super Admin şikayət səbəbini görüb yenidən qərar verir. |
Alternative case 4: Dərc olunmuş rəyin geri çəkilməsi | Sonradan problem aşkarlanarsa, Super Admin dərc olunmuş rəyi geri çəkir və reytinq yenidən hesablanır. |
Alternative case 5: Filtr qaydalarının konfiqurasiyası | Super Admin qadağan olunmuş sözlər siyahısını və avtomatik filtrin həssaslığını tənzimləyir. |
Error cases |
- EF-903-1 Şəxsi məlumat aşkarlanır: Rəydə telefon, FIN və ya digər şəxsi məlumat varsa avtomatik işarələnir; Super Admin rədd edir və ya redaktə edilmiş versiyanı dərc edir
- EF-903-2 Həssas tibbi məlumat: Rəydə diaqnoz və ya müalicə detalları varsa məxfilik riski xəbərdarlığı göstərilir
- EF-903-3 Təhqiredici məzmun: Avtomatik filtr aşkarlayır və rəy rədd edilir
- EF-903-4 Boş növbə: Moderasiya gözləyən rəy yoxdursa empty state göstərilir |
Business Rules |
- BR-903-01: Bütün rəylər dərc olunmadan əvvəl moderasiyadan keçir
- BR-903-02: Rəydə şəxsi məlumat dərc olunmur
- BR-903-03: Rəydə tibbi detallar məhdudlaşdırılır
- BR-903-04: Rədd edilmiş rəy üçün pasientə səbəb bildirilir
- BR-903-05: Ümumi reytinq yalnız dərc olunmuş rəylərdən hesablanır
- BR-903-06: Həkim öz rəyini silə və dəyişdirə bilməz
- BR-903-07: Moderasiya qərarları audit log-a yazılır |
Features |
- FR-903-A — Moderation Queue (Moderasiya növbəsi): gözləyən rəylərin göstərilməsi, şikayət edilmiş məzmun, avtomatik filtr nəticəsi, təsdiq və rədd, rədd səbəbi, toplu təsdiq, geri çəkmə, həkim cavablarının moderasiyası
- FR-903-B — Content Filtering (Məzmun filtri): təhqiredici məzmunun aşkarlanması, şəxsi məlumatın aşkarlanması, tibbi detal xəbərdarlığı, filtr qaydalarının konfiqurasiyası, moderasiya log-u, reytinqin yenidən hesablanması |
Technical flow | |
Service type | REST API (sync) + content filter service |
Database / Table name | |
UI link | /admin/moderation/reviews |

### UC-904 — System Configuration & Audit

Use case ID | UC-904 |
Use case name | System Configuration & Audit (Sistem parametrləri və audit) |
Description | Super Admin platforma səviyyəsində parametrləri konfiqurasiya edir, mərkəzi kataloqları (xidmət, ixtisas, dərman) idarə edir və audit log-a nəzarət edir. |
User type | Super Admin |
Preconditions |
- Super Admin sistemə daxil olub |
Extra info | Sistem parametrləri kodda deyil, bazada saxlanılır — dəyişiklik üçün yeni versiya buraxılışı tələb olunmur. Audit log dəyişdirilə bilməz (immutable): heç bir istifadəçi, o cümlədən Super Admin, onu redaktə və ya silə bilməz. |
Successful user flow |
- Super Admin /admin/settings səhifəsinə daxil olur
- Sistem parametr kateqoriyalarını göstərir: randevu qaydaları, bildirişlər, kataloqlar, təhlükəsizlik
- Super Admin kateqoriyanı seçir
- Sistem həmin kateqoriyanın parametrlərini göstərir
- Super Admin parametr dəyərini dəyişir
- Super Admin "Yadda saxla" düyməsini basır
- Sistem dəyəri validasiya edir
- Sistem kritik parametr halında əlavə təsdiq tələb edir
- Sistem parametri yeniləyir
- Sistem dəyişikliyi audit log-a yazır
- Sistem yeni parametri dərhal tətbiq edir |
Alternative case 1: Xidmət kataloqunun idarəsi | Super Admin sistem səviyyəsində xidmət əlavə edir, redaktə edir, deaktiv edir. Klinikalar yalnız bu kataloqdan seçim edə bilir. |
Alternative case 2: İxtisas siyahısının idarəsi | Super Admin tibbi ixtisasları əlavə edir və idarə edir — axtarış filtrlərinin mənbəyidir. |
Alternative case 3: Dərman kataloqunun idarəsi | Super Admin dərman bazasını idarə edir, nəzarətdə olan dərmanları işarələyir, qarşılıqlı təsir qeydlərini yeniləyir. Bu, resept modulunun klinik təhlükəsizlik yoxlamalarını qidalandırır. |
Alternative case 4: Bildiriş şablonlarının idarəsi | Super Admin SMS, email və push şablonlarını hər dil üçün ayrıca redaktə edir. |
Alternative case 5: Audit log-a baxış | Super Admin /admin/audit-log səhifəsində bütün sistem əməliyyatlarını görür, filtrləyir (istifadəçi, əməliyyat növü, tarix, obyekt) və export edir. |
Alternative case 6: Platforma statistikası | Super Admin ümumi göstəriciləri görür: istifadəçi sayı, klinika sayı, həkim sayı, randevu həcmi, aktiv istifadəçilər, sistem sağlamlığı. |
Alternative case 7: Təhlükəsizlik hadisələrinin izlənməsi | Super Admin uğursuz giriş cəhdlərini, icazəsiz giriş cəhdlərini və şübhəli fəaliyyəti ayrıca panel üzərindən izləyir. |
Error cases |
- EF-904-1 Yanlış parametr dəyəri: Məntiqsiz dəyər (mənfi rəqəm, həddindən böyük dəyər) rədd edilir
- EF-904-2 Kritik parametr dəyişikliyi: Təhlükəsizlik parametrləri üçün əlavə təsdiq tələb olunur
- EF-904-3 Aktiv istifadə olunan kataloq elementinin silinməsi: Bloklanır və hansı klinikaların istifadə etdiyi göstərilir
- EF-904-4 Audit log-un dəyişdirilməsi cəhdi: Audit log immutable-dır, heç bir istifadəçi dəyişdirə bilməz |
Business Rules |
- BR-904-01: Sistem parametrlərini yalnız Super Admin dəyişə bilər
- BR-904-02: Kritik parametr dəyişiklikləri əlavə təsdiq tələb edir
- BR-904-03: Bütün parametr dəyişiklikləri audit log-a yazılır
- BR-904-04: Audit log dəyişdirilə bilməz (immutable)
- BR-904-05: Xidmət və ixtisas kataloqu mərkəzləşdirilmiş şəkildə idarə olunur
- BR-904-06: Aktiv istifadə olunan kataloq elementi silinə bilməz
- BR-904-07: Bildiriş şablonları hər dəstəklənən dil üçün ayrıca saxlanılır
- BR-904-08: Audit log qanunvericiliyə uyğun müddət saxlanılır |
Features |
- FR-904-A — System Settings (Sistem parametrləri): parametrlərin konfiqurasiyası, dəyər validasiyası, kritik dəyişikliklərdə əlavə təsdiq, audit log qeydi, dərhal tətbiq, dəyişiklik tarixçəsi
- FR-904-B — Catalog Management (Kataloq idarəsi): xidmət kataloqu, ixtisas siyahısı, dərman kataloqu, qarşılıqlı təsir bazası, nəzarətdə olan dərmanların işarələnməsi, aktiv elementin qorunması, bildiriş şablonları, çoxdilli şablonlar
- FR-904-C — Audit & Monitoring (Audit və monitorinq): bütün əməliyyatların qeydi, immutable log, filtrləmə, export, platforma statistikası, təhlükəsizlik hadisələri, uğursuz giriş cəhdləri, icazəsiz giriş cəhdləri, şübhəli fəaliyyət xəbərdarlığı |
Technical flow | |
Service type | REST API (sync) + audit service (append-only) |
Database / Table name | |
UI link | /admin/settings, /admin/audit-log |

Konfiqurasiya olunan sistem parametrləri Bu parametrlər kodda deyil, bazada saxlanılır və Super Admin tərəfindən dəyişdirilə bilər:
Parametr | Default | Təsvir |
otp_validity_seconds | 120 | OTP kodunun etibarlılıq müddəti |
otp_resend_interval_seconds | 60 | OTP təkrar göndərmə intervalı |
sima_qr_validity_seconds | 300 | SİMA QR kodunun müddəti (5 dəqiqə) |
slot_soft_lock_minutes | 10 | Slotun müvəqqəti bloklanma müddəti |
min_booking_lead_hours | 1 | Minimum əvvəlcədən randevu vaxtı |
max_reschedule_count | 2 | Maksimum yenidən planlaşdırma sayı |
min_cancel_lead_hours | 1 | Minimum ləğv vaxtı |
slot_generation_days | 60 | Neçə gün irəli slot generasiya olunur |
reminder_first_hours | 24 | Birinci xatırlatma (saat əvvəl) |
reminder_second_hours | 2 | İkinci xatırlatma (saat əvvəl) |
review_window_days | 30 | Rəy yazma müddəti |
review_edit_hours | 24 | Rəy redaktə müddəti |
no_show_limit | 3 | No-show limiti |
max_file_size_mb | 10 | Maksimum fayl ölçüsü |
document_soft_delete_days | 30 | Sənəd soft delete müddəti |
prescription_validity_days | 30 | Reseptin standart etibarlılıq müddəti |
session_timeout_minutes | 15 | Sessiya timeout müddəti |
max_login_attempts | 5 | Maksimum giriş cəhdi |
login_lockout_minutes | 30 | Bloklama müddəti |
doctor_invite_validity_days | 7 | Həkim dəvətinin etibarlılıq müddəti |
license_expiry_warning_days | 30 | Lisenziya bitməsinə xəbərdarlıq müddəti |
auto_complete_after_hours | 24 | Randevunun avtomatik tamamlanma müddəti |

Super Admin-in görmə səlahiyyətləri (Super Admin Visibility Matrix) Bu matris "səlahiyyət ≠ məlumat" prinsipini konkretləşdirir
Məlumat / Əməliyyat | Səlahiyyət | Şərt / İzah |
Bütün klinikalar | Bəli | Yaratma, verifikasiya, dayandırma |
Bütün istifadəçilər | Bəli | Yalnız hesab metadata-sı |
Pasientin tibbi sənədi | Xeyr | Yalnız metadata (ad, tarix, ölçü) — məzmun yox |
Resept məzmunu | Xeyr | Heç bir halda |
Diaqnoz və müayinə qeydləri | Xeyr | Heç bir halda |
Randevu metadata-sı | Bəli | Kim, nə vaxt, hansı həkim, status |
Həkim lisenziya sənədləri | Bəli | Verifikasiya üçün zəruridir |
Rəylər (moderasiyadan əvvəl) | Bəli | Moderasiya vəzifəsi |
Audit log | Oxumaq | Redaktə və silmə mümkün deyil (immutable) |
Sistem parametrləri | Bəli | Kritik parametrlərdə əlavə təsdiq |
Öz hesabını bloklamaq | Xeyr | Sistem kilidlənməsinin qarşısını alır |

### Modul 9 — Ümumi Business Rules

ID | Qayda |
BR-900-01 | Super Admin platformanın ən yüksək idarəetmə səlahiyyətinə malikdir, lakin tibbi məzmuna girişi yoxdur |
BR-900-02 | Klinikanın sistemə əlavəsi bütün platforma fəaliyyətinin başlanğıc nöqtəsidir |
BR-900-03 | Verifikasiya edilməmiş klinika və həkim platformada görünmür |
BR-900-04 | Hər admin əməliyyatı üçün səbəb qeyd olunmalı və audit log-a yazılmalıdır |
BR-900-05 | Audit log dəyişdirilə bilməz — heç bir rol, o cümlədən Super Admin, onu redaktə edə bilməz |
BR-900-06 | Lisenziya müddətləri (klinika və həkim) sistem tərəfindən gündəlik izlənilir |
BR-900-07 | Mərkəzi kataloqlar (xidmət, ixtisas, dərman) yalnız Super Admin tərəfindən idarə olunur |

## Modul 10 — Notifications (1000)

### UC-1001 — Notification Delivery

Use case ID | UC-1001 |
Use case name | Notification Delivery (Bildirişlərin çatdırılması) |
Description | Sistem hadisə əsasında (event-driven) istifadəçilərə avtomatik bildirişlər göndərir: randevu təsdiqi, xatırlatma, ləğv, yeni resept, sənəd paylaşımı, təhlükəsizlik xəbərdarlığı. Bildirişlər növbə (queue) vasitəsilə emal olunur və çatdırılma statusu izlənilir. |
User type | System (avtomatik proses) — Alıcılar: Patient, Doctor, Clinic Admin, Super Admin. Secondary: SMS Gateway, Email Service, Push Notification Service |
Preconditions |
- İstifadəçinin əlaqə məlumatları (telefon/email) təsdiqlənib
- Bildiriş servisləri (SMS, Email, Push) aktivdir
- Sistemdə bildiriş tələb edən hadisə baş verib |
Extra info | İki növ bildiriş var: dərhal (event-driven) — hadisə baş verən kimi göndərilir; planlaşdırılmış (scheduled) — randevudan 24 saat və 2 saat əvvəl göndərilir. Planlaşdırılmış bildirişlər göndərilməzdən əvvəl randevunun hələ də aktiv olduğu yoxlanılır. |
Successful user flow |
- Sistem bildiriş tələb edən hadisəni aşkarlayır (məsələn: randevu təsdiqləndi)
- Sistem hadisə növünə uyğun bildiriş şablonunu seçir
- Sistem alıcının bildiriş tərcihlərini yoxlayır (hansı kanallar aktivdir)
- Sistem şablonu dinamik məlumatlarla doldurur (ad, tarix, saat, həkim adı, klinika)
- Sistem alıcının dil tərcihini tətbiq edir
- Sistem həssas tibbi məlumatın şablona düşmədiyini yoxlayır
- Sistem bildiriş qeydini yaradır
- Sistem bildirişi növbəyə (queue) əlavə edir
- Sistem aktiv kanallar üzrə göndərmə servislərinə ötürür
- Bildiriş servisi bildirişi alıcıya çatdırır
- Bildiriş servisi çatdırılma statusunu sistemə qaytarır
- Sistem çatdırılma statusunu qeyd edir (göndərildi / çatdırıldı / uğursuz)
- Sistem bildirişi tətbiqdaxili bildiriş mərkəzinə əlavə edir
- Sistem əməliyyatı log-a yazır |
Planlaşdırılmış xatırlatma axını |
- Randevu yaradılan zaman sistem xatırlatma qeydlərini planlaşdırır (24 saat və 2 saat əvvələ)
- Planlaşdırılmış vaxt çatdıqda scheduler işə düşür
- Sistem randevunun hələ də aktiv olduğunu yoxlayır
- Sistem xatırlatma bildirişini yaradır və göndərir
- Pasient bildirişi alır və deep link vasitəsilə randevu detallarına keçə bilir
- Sistem xatırlatmanın göndərildiyini qeyd edir |
Alternative case 1: Bildiriş mərkəzinə baxış | İstifadəçi /account/notifications səhifəsində bütün bildirişlərini görür, oxunmuş kimi işarələyir və ya silir. Oxunmamış bildiriş sayı ikon üzərində göstərilir. |
Alternative case 2: Bildirişdən birbaşa keçid (deep link) | İstifadəçi bildirişə klikləyib birbaşa müvafiq ekrana keçir — randevu detalları, resept, sənəd paylaşımı. |
Alternative case 3: Tərcihlərin dəyişdirilməsi | İstifadəçi hansı bildiriş növlərini hansı kanalla almaq istədiyini seçir. Kritik bildirişlər (randevu təsdiqi, təhlükəsizlik) söndürülə bilmir. |
Alternative case 4: Çoxkanallı göndərmə | Kritik bildirişlər (randevu təsdiqi, ləğv) eyni anda bir neçə kanaldan göndərilir ki, çatdırılma zəmanətli olsun. |
Alternative case 5: Toplu bildiriş | Klinika admini toplu ləğv edərkən sistem hər pasientə ayrıca bildiriş göndərir — toplu göndərmə fərdiləşdirilmiş məzmunla aparılır. |
Error cases |
- EF-1001-1 SMS çatdırılmır: Sistem statusu "uğursuz" qeyd edir və alternativ kanal (push/email) sınayır
- EF-1001-2 Bütün kanallar uğursuz: Bildiriş yalnız tətbiqdaxili mərkəzdə saxlanılır, uğursuzluq log-a yazılır
- EF-1001-3 Randevu ləğv edilib: Xatırlatma vaxtı çatdıqda randevu ləğv edilibsə, bildiriş göndərilmir
- EF-1001-4 İstifadəçi imtina edib: Bildiriş növü söndürülübsə göndərilmir (kritik bildirişlər istisna)
- EF-1001-5 Rate limit aşılıb: Qısa müddətdə çox bildiriş göndərilirsə sistem qruplaşdırır və ya gecikdirir
- EF-1001-6 Gecə saatları: 23:00–08:00 arası kritik olmayan bildirişlər səhərə saxlanılır
- EF-1001-7 Şablon tapılmır: Hadisə üçün şablon yoxdursa sistem default şablon istifadə edir və xəta log-a yazılır |
Business Rules |
- BR-1001-01: Randevu təsdiqi və ləğvi bildirişləri məcburidir, söndürülə bilməz
- BR-1001-02: Təhlükəsizlik bildirişləri (yeni cihazdan giriş) həmişə göndərilir
- BR-1001-03: Xatırlatmalar randevudan 24 saat və 2 saat əvvəl göndərilir
- BR-1001-04: Ləğv edilmiş randevu üçün xatırlatma göndərilmir
- BR-1001-05: Bildirişlərdə həssas tibbi məlumat (diaqnoz, dərman adı) göstərilmir
- BR-1001-06: Bir kanal uğursuz olduqda alternativ kanal sınanır
- BR-1001-07: Bildirişlər istifadəçinin seçdiyi dildə göndərilir
- BR-1001-08: Gecə saatlarında kritik olmayan bildirişlər gecikdirilir
- BR-1001-09: Bütün göndərilən bildirişlər log-a yazılır
- BR-1001-10: Bildiriş şablonları Super Admin tərəfindən mərkəzləşdirilmiş idarə olunur |
Features |
- FR-1001-A — Notification Generation (Bildirişin yaradılması): hadisə əsasında yaratma, şablon seçimi, dinamik məlumatla doldurma, dil tərcihi, növbə emalı, həssas məlumatın filtrlənməsi, xatırlatmaların planlaşdırılması, ləğv halında xatırlatmanın dayandırılması
- FR-1001-B — Delivery Channels (Çatdırılma kanalları): SMS, push notification, email, tətbiqdaxili mərkəz, kanal uğursuzluğunda alternativ, çoxkanallı göndərmə, deep link, çatdırılma statusunun izlənməsi, retry mexanizmi
- FR-1001-C — User Preferences & Center (Tərcihlər və mərkəz): kanal seçimi, bildiriş növlərinin idarəsi, kritik bildirişlərin qorunması, bildiriş mərkəzi, oxunmuş/oxunmamış statusu, oxunmamış sayğac, gecə saatlarında gecikdirmə, rate limiting |
Technical flow | |
Service type | Event-driven (async) + message queue + scheduled job (xatırlatmalar) + üçüncü tərəf servis inteqrasiyası |
Database / Table name | |
UI link | /account/notifications, /account/settings |

Bildiriş növləri (Notification Types) Sistemdə mövcud olan bütün bildiriş növləri, alıcıları və kanalları:
Bildiriş növü | Alıcı | Tetikleyici hadisə | Kanal |
Randevu təsdiqi | Patient, Doctor | Randevu təsdiqlənir | SMS + Push + In-app |
Xatırlatma (24 saat) | Patient | Randevudan 24 saat əvvəl | SMS + Push |
Xatırlatma (2 saat) | Patient | Randevudan 2 saat əvvəl | Push |
Randevu ləğvi | Patient, Doctor | Randevu ləğv olunur | SMS + Push + In-app |
Vaxt dəyişikliyi | Patient, Doctor | Randevu köçürülür | SMS + Push + In-app |
Randevu rəddi | Patient | Həkim rədd edir | SMS + Push |
Yeni resept | Patient | Resept imzalanır | Push + In-app |
Sənəd paylaşıldı | Doctor | Pasient sənəd paylaşır | Push + In-app |
Rəy dəvəti | Patient | Randevu tamamlanır | Push + In-app |
Rəy dərc olundu | Doctor | Moderasiya təsdiqləyir | In-app |
Həkim dəvəti | Doctor | Klinika admini əlavə edir | SMS |
Klinika admin dəvəti | Clinic Admin | Super Admin əlavə edir | SMS |
Cədvəl dəyişdirildi | Doctor | Admin cədvəli dəyişir | Push + In-app |
Lisenziya xəbərdarlığı | Doctor, Clinic Admin | Lisenziyaya 30 gün qalır | Email + In-app |
Təhlükəsizlik xəbərdarlığı | Bütün rollar | Yeni cihazdan giriş | SMS + Push |
Hesab statusu dəyişdi | Bütün rollar | Hesab bloklanır/açılır | SMS + Email |
No-show qeydə alındı | Patient | Həkim no-show işarələyir | Push + In-app |
PIN dəyişdirildi | Bütün rollar | PIN bərpa olunur | SMS |

Çatdırılma statusları (Delivery Status)
Status | Mənası | Növbəti addım |
Queued | Bildiriş növbəyə əlavə olunub, göndərilməyi gözləyir | Servis emal edir |
Sent | Servisə ötürülüb, göndərilib | Çatdırılma təsdiqi gözlənilir |
Delivered | Alıcının cihazına çatdırılıb | Proses tamamlanır |
Failed | Çatdırılma uğursuz olub | Alternativ kanal sınanır, retry tətbiq olunur |

### Modul 10 — Ümumi Business Rules

ID | Qayda |
BR-1000-01 | Bildirişlər sistem hadisələri əsasında avtomatik yaranır — manual göndərmə yoxdur |
BR-1000-02 | Bildiriş məzmununda tibbi sirr təşkil edən məlumat ola bilməz |
BR-1000-03 | Kritik bildirişlər (randevu, təhlükəsizlik) istifadəçi tərəfindən söndürülə bilməz |
BR-1000-04 | Bildiriş servisi işləmədikdə əsas proseslər (randevu, resept) dayanmır |
BR-1000-05 | Xatırlatma sistemi no-show hallarının azaldılması üçün əsas alətdir |
BR-1000-06 | Bütün bildiriş şablonları hər dəstəklənən dil üçün ayrıca saxlanılır |
BR-1000-07 | Çatdırılma statusu izlənilir və uğursuzluq halları hesabatlarda əks olunur |

## Modul 11 — Feedback & Rating (1100)

### UC-1101 — Submit Review

Use case ID | UC-1101 |
Use case name | Submit Review (Rəy və reytinq vermə) |
Description | Pasient tamamlanmış randevudan sonra həkimə reytinq və yazılı rəy verir. Rəy moderasiyadan keçdikdən sonra dərc olunur və həkimin ümumi reytinqinə təsir edir. |
User type | Patient (Secondary: Doctor, Super Admin, Notification Service) |
Preconditions |
- Randevu "Completed" statusundadır
- Pasient bu randevu üçün rəy yazmayıb
- Rəy yazma müddəti (30 gün) keçməyib |
Extra info | Rəy bir randevu = bir rəy prinsipi ilə işləyir. Ümumi reytinqdən əlavə alt kateqoriyalar üzrə də qiymətləndirmə var: peşəkarlıq, münasibət, gözləmə vaxtı. Pasient rəyi anonim göndərə bilər — bu halda profildə ad göstərilmir, lakin sistem daxilində müəllif qeydə alınır. |
Successful user flow |
- Randevu tamamlandıqdan 2 saat sonra sistem pasientə rəy dəvəti göndərir
- Pasient bildirişə klikləyir və ya randevu tarixçəsindən rəy bölməsinə keçir
- Sistem randevu məlumatlarını göstərir: həkim, klinika, tarix, xidmət
- Sistem rəy formasını açır
- Pasient ümumi reytinqi (1–5 ulduz) seçir
- Pasient alt kateqoriyalar üzrə reytinq verir: peşəkarlıq, münasibət, gözləmə vaxtı
- Pasient yazılı rəyini daxil edir (optional)
- Pasient anonim göndərmə seçimini edir (optional)
- Pasient "Göndər" düyməsini basır
- Sistem rəyi validasiya edir (məcburi sahələr, mətn uzunluğu)
- Sistem avtomatik məzmun filtrindən keçirir (təhqir, spam, şəxsi məlumat)
- Sistem rəyi "moderasiya gözləyir" statusu ilə saxlayır
- Sistem rəyi moderasiya növbəsinə əlavə edir (UC-903)
- Sistem pasientə "Rəyiniz nəzərdən keçirilir" mesajını göstərir
- Super Admin rəyi moderasiya edir və təsdiqləyir
- Sistem rəyin statusunu "dərc olunub" edir
- Sistem həkimin ümumi reytinqini və rəy sayını yenidən hesablayır
- Sistem klinikanın reytinqini yenidən hesablayır
- Sistem rəyi həkim profilində göstərir
- Sistem həkimə yeni rəy bildirişi göndərir
- Sistem pasientə rəyin dərc olunduğunu bildirir |
Alternative case 1: Rəyin redaktəsi | Pasient 24 saat ərzində rəyini redaktə edir. Redaktə edilmiş rəy yenidən moderasiyaya düşür və təsdiqlənənə qədər köhnə versiya göstərilir. |
Alternative case 2: Anonim rəy | Pasient anonimlik seçirsə, rəy profildə "Anonim pasient" kimi dərc olunur. Sistem daxilində müəllif qeydə alınır — sui-istifadə halında araşdırma mümkün olsun. |
Alternative case 3: Həkimin cavabı | Həkim rəyə peşəkar cavab yazır. Cavab da moderasiyadan keçir və təsdiqləndikdən sonra rəyin altında göstərilir. |
Alternative case 4: Rəyin şikayət edilməsi | Həkim uyğunsuz və ya saxta rəyi şikayət edir. Sistem şikayəti moderasiya növbəsinə göndərir, Super Admin yenidən qərar verir. |
Alternative case 5: Rəy dəvətinin xatırladılması | Rəy yazılmayıbsa, sistem 3 gün sonra bir dəfə xatırlatma göndərir. Təkrar xatırlatma göndərilmir — spam qarşısı. |
Alternative case 6: Yalnız reytinq (mətnsiz) | Pasient yalnız ulduz verib mətn yazmaya bilər. Mətnsiz rəy avtomatik filtr tələb etmir və daha sürətli dərc olunur. |
Error cases |
- EF-1101-1 Randevu tamamlanmayıb: "Rəy yalnız tamamlanmış qəbullar üçün yazıla bilər" — rəy formasına giriş bloklanır
- EF-1101-2 Təkrar rəy: Sistem mövcud rəyi göstərir və redaktə imkanı təklif edir (müddət keçməyibsə)
- EF-1101-3 Uyğunsuz məzmun: Avtomatik filtr təhqir və ya spam aşkarlarsa rəy rədd edilir və pasientə səbəb bildirilir
- EF-1101-4 Müddət keçib: Randevudan 30 gün keçibsə rəy yazma imkanı bağlanır
- EF-1101-5 No-show randevusu: Pasient gəlməyibsə rəy yaza bilməz
- EF-1101-6 Başqasının randevusu: Sistem girişi bloklayır və təhlükəsizlik log-una yazır
- EF-1101-7 Şəxsi məlumat rəydə: Filtr telefon nömrəsi və ya FIN aşkarlarsa rəy moderasiyada işarələnir
- EF-1101-8 Reytinq seçilməyib: Ulduz reytinqi olmadan rəy göndərilə bilməz |
Business Rules |
- BR-1101-01: Rəy yalnız "Completed" statuslu randevu üçün yazıla bilər
- BR-1101-02: Bir randevu üçün yalnız bir rəy yazıla bilər
- BR-1101-03: Rəy yazma müddəti randevudan sonra 30 gündür
- BR-1101-04: Rəy redaktəsi yalnız ilk 24 saat ərzində mümkündür
- BR-1101-05: Bütün rəylər dərc olunmadan əvvəl moderasiyadan keçir
- BR-1101-06: Həkim öz rəyini silə və dəyişdirə bilməz
- BR-1101-07: Ümumi reytinq yalnız dərc olunmuş rəylərdən hesablanır
- BR-1101-08: No-show randevu üçün rəy yazıla bilməz
- BR-1101-09: Anonim rəydə sistem daxilində müəllif qeydə alınır
- BR-1101-10: Klinika reytinqi ona bağlı həkimlərin reytinqlərinin orta göstəricisidir
- BR-1101-11: Ulduz reytinqi məcburidir, yazılı rəy isteğe bağlıdır
- BR-1101-12: Rəy dəvəti bir dəfə xatırladılır, sonra təkrarlanmır |
Features |
- FR-1101-A — Review Submission (Rəyin göndərilməsi): tamamlanmış randevu şərti, 1–5 ulduz reytinqi, alt kateqoriya reytinqləri, yazılı rəy, təkrar rəyin bloklanması, 30 günlük müddət, anonim seçim, rəy dəvəti, 24 saatlıq redaktə, no-show bloklaması
- FR-1101-B — Rating Calculation & Display (Reytinqin hesablanması və göstərilməsi): ümumi reytinqin avtomatik hesablanması, yalnız dərc olunmuş rəylərdən hesablama, klinika reytinqi, profildə göstərmə, rəy siyahısı, çeşidləmə, reytinq paylanması, həkimin cavabı, silmə qadağası, şikayət mexanizmi |
Technical flow | |
Service type | REST API (sync) + content filter service + async bildiriş |
Database / Table name | |
UI link | /account/appointments/{appointmentId}/review |

Rəyin həyat dövrü (Review Lifecycle)
Status | Mənası | Keçid şərti |
Pending Moderation | Rəy göndərilib, moderasiya gözləyir. Həkim profilində görünmür. | Pasient rəyi göndərdikdə |
Published | Moderasiyadan keçib, həkim profilində görünür, reytinqə daxildir. | Super Admin təsdiqlədikdə |
Rejected | Qaydalara uyğun olmadığı üçün dərc edilmir. Pasientə səbəb bildirilir. | Super Admin rədd etdikdə və ya avtomatik filtr aşkarladıqda |
Reported | Dərc olunub, lakin şikayət edilib — təkrar baxış gözləyir. | Həkim və ya istifadəçi şikayət etdikdə |
Withdrawn | Dərc olunduqdan sonra geri çəkilib, reytinqdən çıxarılıb. | Super Admin geri çəkdikdə |

Reytinq hesablanması (Rating Calculation)
Göstərici | Hesablanma qaydası |
Həkimin ümumi reytinqi | Yalnız "Published" statuslu rəylərin ümumi reytinq dəyərlərinin orta göstəricisi. Bir onluq dəqiqliklə göstərilir (məsələn 4.6). |
Rəy sayı | Dərc olunmuş rəylərin sayı. Reytinqin nə qədər etibarlı olduğunu göstərir. |
Alt kateqoriya reytinqləri | Peşəkarlıq, münasibət və gözləmə vaxtı üzrə ayrıca orta göstəricilər. Pasientə həkimin güclü və zəif tərəflərini göstərir. |
Reytinq paylanması | Neçə 5 ulduz, neçə 4 ulduz və s. — orta göstəricinin arxasındakı mənzərəni açır. |
Klinika reytinqi | Klinikaya bağlı aktiv həkimlərin reytinqlərinin orta göstəricisi. |
Yeni həkim | Hələ rəyi olmayan həkim üçün reytinq göstərilmir; "Yeni həkim" etiketi göstərilir ki, sıfır reytinq mənfi təsir bağışlamasın. |

Saxta rəyə qarşı mexanizmlər (Anti-Fraud Measures) Reytinq sisteminin etibarlılığını qoruyan qaydalar:
Mexanizm | Necə işləyir |
Randevu şərti | Rəy yalnız real, tamamlanmış randevudan sonra yazıla bilər — qəbulda olmayan şəxs rəy yaza bilmir |
Bir randevu = bir rəy | Eyni randevu üçün təkrar rəy mümkün deyil — çoxlu müsbət rəy yazmaqla reytinqi şişirtmək olmur |
SİMA doğrulaması | Hər pasient hesabı real şəxsiyyətə bağlıdır — saxta hesablarla rəy yazmaq mümkün deyil |
Moderasiya | Hər rəy dərc olunmadan əvvəl insan nəzarətindən keçir |
Avtomatik filtr | Təhqir, spam və şəxsi məlumat avtomatik aşkarlanır |
Şikayət mexanizmi | Həkim saxta rəyi şikayət edə bilir, Super Admin araşdırır |
Anonim ≠ izsiz | Anonim rəydə də sistem daxilində müəllif qeydə alınır — sui-istifadə halında araşdırma mümkündür |
Həkim silə bilmir | Mənfi rəyi silmək mümkün deyil — reytinq real mənzərəni əks etdirir |

### Modul 11 — Ümumi Business Rules

ID | Qayda |
BR-1100-01 | Reytinq sistemi platformada güvənin əsas mexanizmidir və manipulyasiyadan qorunmalıdır |
BR-1100-02 | Rəy yazmaq hüququ yalnız real, tamamlanmış qəbul təcrübəsindən yaranır |
BR-1100-03 | Heç bir rol (həkim, klinika admini) rəyi silə və ya dəyişdirə bilməz |
BR-1100-04 | Rəydə şəxsi məlumat və həssas tibbi detal dərc olunmur |
BR-1100-05 | Reytinq hesablanmasında yalnız moderasiyadan keçmiş rəylər iştirak edir |
BR-1100-06 | Bütün rəy əməliyyatları (göndərmə, moderasiya, şikayət, geri çəkmə) audit log-a yazılır |

# Functional Requirements

## Modul 1 — Authentication & User Management

### UC-101 — Patient Registration

ID | Category | Requirement | Comment |
FR-101-01 | Data Entry | Sistem qeydiyyat formasında telefon nömrəsi və FIN sahələrini göstərməlidir | Must |
FR-101-02 | Data Entry | Sistem telefon nömrəsini +994XXXXXXXXX formatında qəbul etməlidir | Must — digər formatlar rədd edilir |
FR-101-03 | Data Entry | Sistem FIN sahəsini 7 simvolla məhdudlaşdırmalıdır | Must |
FR-101-04 | Data Entry | Sistem boş sahə ilə davam etməyə imkan verməməlidir | Must |
FR-101-05 | Data Entry | Sistem format səhvində sahənin altında dərhal xəbərdarlıq göstərməlidir | Must — inline validasiya |
FR-101-06 | Data Entry | Sistem ölkə kodunu avtomatik +994 kimi təyin etməlidir | Should |
FR-101-07 | Duplicate Check | Sistem mövcud hesabı telefon nömrəsi üzrə yoxlamalıdır | Must |
FR-101-08 | Duplicate Check | Sistem mövcud hesabı FIN üzrə yoxlamalıdır | Must — bir FIN = bir hesab |
FR-101-09 | Duplicate Check | Sistem mövcud hesab aşkarlandıqda istifadəçini login səhifəsinə yönləndirməlidir | Must |
FR-101-10 | OTP Verification | Sistem istifadəçinin telefon nömrəsinə 6 rəqəmli OTP kodu göndərməlidir | Must |
FR-101-11 | OTP Verification | Sistem OTP kodunun etibarlılıq müddətini 120 saniyə ilə məhdudlaşdırmalıdır | Must — parametr: otp_validity_seconds |
FR-101-12 | OTP Verification | Sistem qalan vaxtı geri sayım şəklində göstərməlidir | Must |
FR-101-13 | OTP Verification | Sistem yanlış OTP halında xəta göstərməli və yenidən cəhdə imkan verməlidir | Must |
FR-101-14 | OTP Verification | Sistem müddət bitdikdə "Yenidən göndər" düyməsini aktivləşdirməlidir | Must |
FR-101-15 | OTP Verification | Sistem ardıcıl OTP göndərilməsini 60 saniyə interval ilə məhdudlaşdırmalıdır | Must — spam qarşısı |
FR-101-16 | OTP Verification | Sistem OTP kodunu cavabda geri qaytarmamalıdır | Must — təhlükəsizlik |
FR-101-17 | OTP Verification | Sistem OTP kodunu hash formada saxlamalıdır | Must |
FR-101-18 | SIMA Verification | Sistem SİMA doğrulama sessiyası yaratmalıdır | Must |
FR-101-19 | SIMA Verification | Sistem doğrulama üçün QR kod göstərməlidir | Must |
FR-101-20 | SIMA Verification | Sistem QR kodun etibarlılıq müddətini 5 dəqiqə etməlidir | Must — parametr: sima_qr_validity_seconds |
FR-101-21 | SIMA Verification | Sistem QR kodun qalan müddətini geri sayım şəklində göstərməlidir | Must |
FR-101-22 | SIMA Verification | Sistem QR kodu yeniləmə imkanı verməlidir | Must — müddət bitdikdə |
FR-101-23 | SIMA Verification | Sistem SİMA sorğusuna FIN məlumatını daxil etməlidir | Must |
FR-101-24 | SIMA Verification | Sistem SİMA callback cavabını qəbul edib emal etməlidir | Must |
FR-101-25 | SIMA Verification | Sistem callback-in rəqəmsal imzasını yoxlamalıdır | Must — saxta cavabın qarşısı |
FR-101-26 | SIMA Verification | Sistem success cavabında qeydiyyatı davam etdirməlidir | Must |
FR-101-27 | SIMA Verification | Sistem error cavabında hesab yaratmamalıdır | Must |
FR-101-28 | SIMA Verification | Sistem SİMA-dan gələn məlumatlarla profili avtomatik doldurmalıdır | Must — ad, soyad, ata adı, doğum tarixi, cins |
FR-101-29 | SIMA Verification | Sistem SİMA məlumatlarının redaktəsinə icazə verməməlidir | Must |
FR-101-30 | SIMA Verification | Sistem SİMA gözləmə mərhələsində loading state göstərməlidir | Should |
FR-101-31 | SIMA Verification | Sistem SİMA əməliyyatını audit log-a yazmalıdır | Must |
FR-101-32 | PIN Setup | Sistem istifadəçidən 4 rəqəmli PIN kod təyin etməyi tələb etməlidir | Must |
FR-101-33 | PIN Setup | Sistem PIN kodun təkrar daxil edilməsini tələb etməlidir | Must |
FR-101-34 | PIN Setup | Sistem iki PIN uyğun gəlmədikdə xəta göstərməli və prosesi təkrarlatmalıdır | Must |
FR-101-35 | PIN Setup | Sistem PIN kodu hash formada saxlamalıdır | Must — açıq mətn saxlanmır |
FR-101-36 | PIN Setup | Sistem sadə PIN kombinasiyalarını qəbul etməməlidir | Should — 1111, 1234, 0000 |
FR-101-37 | PIN Setup | Sistem PIN daxiletmə zamanı rəqəmləri maskalanmış göstərməlidir | Must |
FR-101-38 | Biometric | Sistem biometrik giriş aktivləşdirməyi təklif etməlidir | Should — Face ID / barmaq izi |
FR-101-39 | Biometric | Sistem cihazda biometrik dəstək olmadıqda bu addımı atlamalıdır | Should |
FR-101-40 | Biometric | Sistem biometrik məlumatı cihazda saxlamalı, serverə göndərməməlidir | Must — məxfilik tələbi |
FR-101-41 | Consent | Sistem məxfilik siyasətini və istifadə şərtlərini göstərməlidir | Must |
FR-101-42 | Consent | Sistem tibbi məlumatların emalına ayrıca razılıq almalıdır | Must — qanuni tələb |
FR-101-43 | Consent | Sistem razılıq olmadan hesabı aktivləşdirməməlidir | Must |
FR-101-44 | Consent | Sistem razılığın verilmə tarixini və versiyasını qeyd etməlidir | Must — audit üçün |
FR-101-45 | Activation | Sistem hesabı "Verified" statusu ilə yaratmalıdır | Must |
FR-101-46 | Activation | Sistem istifadəçini qeydiyyata başladığı səhifəyə (return URL) qaytarmalıdır | Must — randevu axını üçün kritik |
FR-101-47 | Activation | Sistem uğurlu qeydiyyat bildirişi göndərməlidir | Should |
FR-101-48 | Activation | Sistem razılığın sonradan geri götürülməsinə imkan verməlidir | Must |

### UC-102 — User Login

ID | Category | Requirement | Comment |
FR-102-01 | Authentication | Sistem telefon nömrəsi və PIN ilə girişi dəstəkləməlidir | Must |
FR-102-02 | Authentication | Sistem PIN-i hash müqayisəsi ilə yoxlamalıdır | Must |
FR-102-03 | Authentication | Sistem biometrik girişi dəstəkləməlidir | Should — aktivləşdirilibsə PIN tələb olunmur |
FR-102-04 | Authentication | Sistem yanlış PIN halında qalan cəhd sayını göstərməlidir | Should |
FR-102-05 | Authentication | Sistem 5 uğursuz cəhddən sonra hesabı 30 dəqiqə bloklamalıdır | Must — brute-force qarşısı |
FR-102-06 | Authentication | Sistem bloklanmış hesabın girişini rədd etməlidir | Must |
FR-102-07 | Authentication | Sistem biometrik doğrulama uğursuz olduqda PIN daxiletməyə keçməlidir | Should |
FR-102-08 | Session | Sistem uğurlu girişdə sessiya token yaratmalıdır | Must |
FR-102-09 | Session | Sistem 15 dəqiqə fəaliyyətsizlikdən sonra sessiyanı bağlamalıdır | Must — parametr: session_timeout_minutes |
FR-102-10 | Session | Sistem aktiv sessiyaları görüntüləmə və bağlama imkanı verməlidir | Should |
FR-102-11 | Routing | Sistem istifadəçini roluna uyğun səhifəyə yönləndirməlidir | Must — Patient/Doctor/Clinic Admin/Super Admin |
FR-102-12 | Routing | Sistem return URL varsa istifadəçini oraya qaytarmalıdır | Must |
FR-102-13 | Security | Sistem yeni cihazdan girişdə təhlükəsizlik bildirişi göndərməlidir | Must |
FR-102-14 | Security | Sistem bütün giriş cəhdlərini audit log-a yazmalıdır | Must — uğurlu və uğursuz |
FR-102-15 | Security | Sistem hesab tapılmadıqda qeydiyyat təklif etməlidir | Should |

### UC-103 — PIN Reset & Account Recovery

ID | Category | Requirement | Comment |
FR-103-01 | Recovery Flow | Sistem PIN bərpası üçün OTP doğrulaması tələb etməlidir | Must — birinci qat |
FR-103-02 | Recovery Flow | Sistem PIN bərpası üçün SİMA doğrulaması tələb etməlidir | Must — ikinci qat |
FR-103-03 | Recovery Flow | Sistem SİMA-dan gələn FIN-i hesabdakı FIN ilə müqayisə etməlidir | Must — hesab oğurluğunun qarşısı |
FR-103-04 | Recovery Flow | Sistem FIN uyğunsuzluğunda əməliyyatı bloklamalıdır | Must — təhlükəsizlik log-una yazılır |
FR-103-05 | PIN Update | Sistem yeni PIN-in köhnə PIN ilə eyni olmasına icazə verməməlidir | Should |
FR-103-06 | PIN Update | Sistem yeni PIN-i hash formada saxlamalıdır | Must |
FR-103-07 | Session | Sistem PIN dəyişikliyindən sonra bütün aktiv sessiyaları bağlamalıdır | Must |
FR-103-08 | Notification | Sistem PIN dəyişikliyi bildirişi göndərməlidir | Must |
FR-103-09 | Audit | Sistem PIN bərpa əməliyyatını audit log-a yazmalıdır | Must |

### UC-104 — Profile Management

ID | Category | Requirement | Comment |
FR-104-01 | Profile Data | Sistem profil məlumatlarını göstərməlidir | Must |
FR-104-02 | Profile Data | Sistem SİMA-dan gələn sahələri read-only göstərməlidir | Must — ad, soyad, FIN, doğum tarixi, cins |
FR-104-03 | Profile Data | Sistem profil fotosu yükləməyə imkan verməlidir | Should |
FR-104-04 | Profile Data | Sistem email və əlavə telefon əlavə etməyə imkan verməlidir | Should |
FR-104-05 | Profile Data | Sistem ünvan məlumatı saxlamağa imkan verməlidir | Should |
FR-104-06 | Profile Data | Sistem telefon dəyişikliyində OTP doğrulaması tələb etməlidir | Must |
FR-104-07 | Medical Profile | Sistem qan qrupu daxil etməyə imkan verməlidir | Should |
FR-104-08 | Medical Profile | Sistem allergiya siyahısı yaratmağa imkan verməlidir | Must — resept təhlükəsizliyi üçün |
FR-104-09 | Medical Profile | Sistem xroniki xəstəlikləri qeyd etməyə imkan verməlidir | Should |
FR-104-10 | Medical Profile | Sistem daimi qəbul edilən dərmanları qeyd etməyə imkan verməlidir | Should — qarşılıqlı təsir yoxlaması üçün |
FR-104-11 | Medical Profile | Sistem allergiya məlumatını resept yazılarkən həkimə göstərməlidir | Must |
FR-104-12 | Medical Profile | Sistem təcili əlaqə şəxsi əlavə etməyə imkan verməlidir | Should |
FR-104-13 | Settings | Sistem bildiriş kanallarını seçməyə imkan verməlidir | Should |
FR-104-14 | Settings | Sistem bildiriş növlərini ayrıca idarə etməyə imkan verməlidir | Should |
FR-104-15 | Settings | Sistem interfeys dilini dəyişməyə imkan verməlidir | Should — AZ / RU / EN |
FR-104-16 | Settings | Sistem biometrik girişi aktivləşdirmə və söndürmə imkanı verməlidir | Should |
FR-104-17 | Settings | Sistem PIN-i dəyişməyə imkan verməlidir | Must |
FR-104-18 | Consent | Sistem razılığı geri götürməyə imkan verməlidir | Must — tibbi funksiyalar bağlanır |
FR-104-19 | Account | Sistem hesabın silinməsini tələb etməyə imkan verməlidir | Should |
FR-104-20 | Account | Sistem aktiv randevusu olan hesabın silinməsini bloklamalıdır | Must |

## Modul 2 — Search & Discovery

### UC-201 — Search Doctors

ID | Category | Requirement | Comment |
FR-201-01 | Search Mode | Sistem axtarış rejimi seçicisi (Həkim / Klinika) təqdim etməlidir | Must |
FR-201-02 | Search Mode | Sistem default olaraq "Həkim" rejimini seçməlidir | Must |
FR-201-03 | Search Mode | Sistem rejim dəyişdikdə filtr panelini uyğun şəkildə dəyişməlidir | Must |
FR-201-04 | Search Mode | Sistem axtarışı qeydiyyatsız istifadəçilər (Guest) üçün əlçatan etməlidir | Must |
FR-201-05 | Query | Sistem həkim adı üzrə mətn axtarışını dəstəkləməlidir | Must |
FR-201-06 | Query | Sistem yazıldıqca autocomplete təklifləri göstərməlidir | Should |
FR-201-07 | Query | Sistem yazı səhvlərinə tolerant axtarış dəstəkləməlidir | Should — fuzzy search |
FR-201-08 | Query | Sistem son axtarışları yadda saxlamalı və təklif etməlidir | Should |
FR-201-09 | Filters | Sistem ixtisas üzrə filtrləməyə imkan verməlidir | Must — multi-select |
FR-201-10 | Filters | Sistem şəhər və rayon üzrə filtrləməyə imkan verməlidir | Must |
FR-201-11 | Filters | Sistem klinika üzrə filtrləməyə imkan verməlidir | Must |
FR-201-12 | Filters | Sistem minimum reytinq üzrə filtrləməyə imkan verməlidir | Should — 3+, 4+, 4.5+ |
FR-201-13 | Filters | Sistem həkimin cinsi üzrə filtrləməyə imkan verməlidir | Should |
FR-201-14 | Filters | Sistem danışılan dil üzrə filtrləməyə imkan verməlidir | Should |
FR-201-15 | Filters | Sistem iş təcrübəsi (il) üzrə filtrləməyə imkan verməlidir | Should |
FR-201-16 | Filters | Sistem boş vaxt üzrə filtrləməyə imkan verməlidir | Should — bu gün / sabah / bu həftə |
FR-201-17 | Filters | Sistem akademik dərəcə üzrə filtrləməyə imkan verməlidir | Should |
FR-201-18 | Filters | Sistem çoxlu filtri eyni anda tətbiq etməlidir | Must |
FR-201-19 | Filters | Sistem aktiv filtrləri chip/tag şəklində göstərməlidir | Should |
FR-201-20 | Filters | Sistem filtrləri bir kliklə sıfırlamağa imkan verməlidir | Should |
FR-201-21 | Filters | Sistem filtr parametrlərini URL-də saxlamalıdır | Should — link paylaşıla bilsin |
FR-201-22 | Results | Sistem hər kartda foto, ad, ixtisas və klinikanı göstərməlidir | Must |
FR-201-23 | Results | Sistem hər kartda reytinq və rəy sayını göstərməlidir | Must |
FR-201-24 | Results | Sistem hər kartda ən yaxın boş vaxtı göstərməlidir | Should |
FR-201-25 | Results | Sistem axtarış nəticələrində qiymət göstərməməlidir | Must — dəyər klinikada müəyyən edilir |
FR-201-26 | Results | Sistem tapılan nəticələrin ümumi sayını göstərməlidir | Should |
FR-201-27 | Results | Sistem nəticələri səhifələməlidir | Must — max 20 nəticə/səhifə |
FR-201-28 | Results | Sistem reytinq üzrə çeşidləməyə imkan verməlidir | Should |
FR-201-29 | Results | Sistem təcrübə üzrə çeşidləməyə imkan verməlidir | Should |
FR-201-30 | Results | Sistem ən yaxın boş vaxt üzrə çeşidləməyə imkan verməlidir | Should |
FR-201-31 | Results | Sistem yüklənmə zamanı skeleton loading göstərməlidir | Should |
FR-201-32 | Results | Sistem nəticə tapılmadıqda alternativ təkliflər göstərməlidir | Should |
FR-201-33 | Results | Sistem kartа klik edildikdə həkimin detallı səhifəsinə yönləndirməlidir | Must |
FR-201-34 | Visibility | Sistem yalnız verifikasiya edilmiş və aktiv həkimləri göstərməlidir | Must |
FR-201-35 | Visibility | Sistem deaktiv edilmiş həkimi nəticələrdə göstərməməlidir | Must |
FR-201-36 | Visibility | Sistem profili tamamlanmayan həkimi göstərməməlidir | Must |

### UC-202 — Search Clinics

ID | Category | Requirement | Comment |
FR-202-01 | Search Mode | Sistem klinika axtarış rejimini təqdim etməlidir | Must |
FR-202-02 | Search Mode | Sistem rejim dəyişikliyində filtr panelini tam dəyişməlidir | Must — həkim filtrlərindən fərqli |
FR-202-03 | Query | Sistem klinika adı üzrə mətn axtarışını dəstəkləməlidir | Must |
FR-202-04 | Query | Sistem klinika üçün autocomplete təklifləri göstərməlidir | Should |
FR-202-05 | Filters | Sistem şəhər və rayon üzrə filtrləməyə imkan verməlidir | Must |
FR-202-06 | Filters | Sistem klinika növü üzrə filtrləməyə imkan verməlidir | Must — poliklinika, xəstəxana, diaqnostik mərkəz, dental, laboratoriya |
FR-202-07 | Filters | Sistem mövcud ixtisaslar üzrə filtrləməyə imkan verməlidir | Must |
FR-202-08 | Filters | Sistem xidmət növü üzrə filtrləməyə imkan verməlidir | Should — analiz, USM, MRT, KT, rentgen |
FR-202-09 | Filters | Sistem iş rejimi üzrə filtrləməyə imkan verməlidir | Should — 24/7, həftə sonu, axşam qəbulu |
FR-202-10 | Filters | Sistem minimum reytinq üzrə filtrləməyə imkan verməlidir | Should |
FR-202-11 | Filters | Sistem qəbul edilən sığorta üzrə filtrləməyə imkan verməlidir | Should |
FR-202-12 | Results | Sistem hər kartda klinika adı, loqosu və növünü göstərməlidir | Must |
FR-202-13 | Results | Sistem hər kartda ünvanı göstərməlidir | Must |
FR-202-14 | Results | Sistem hər kartda iş saatlarını göstərməlidir | Should |
FR-202-15 | Results | Sistem hər kartda reytinqi göstərməlidir | Must |
FR-202-16 | Results | Sistem hər kartda mövcud həkim və ixtisas sayını göstərməlidir | Should |
FR-202-17 | Results | Sistem nəticələri xəritədə göstərməyə imkan verməlidir | Should |
FR-202-18 | Results | Sistem nəticələri reytinq və həkim sayı üzrə çeşidləməlidir | Should |
FR-202-19 | Results | Sistem kartа klik edildikdə klinikanın detallı səhifəsinə yönləndirməlidir | Must |
FR-202-20 | Visibility | Sistem yalnız verifikasiya edilmiş klinikaları göstərməlidir | Must |
FR-202-21 | Visibility | Sistem aktiv həkimi olmayan klinikanı göstərməməlidir | Must |

## Modul 3 — Detailed Pages

### UC-301 — View Doctor Detail Page

ID | Category | Requirement | Comment |
FR-301-01 | Profile Info | Sistem həkimin fotosu, adı və ixtisasını göstərməlidir | Must |
FR-301-02 | Profile Info | Sistem reytinq və rəy sayını göstərməlidir | Must |
FR-301-03 | Profile Info | Sistem bio və peşəkar təsviri göstərməlidir | Must |
FR-301-04 | Profile Info | Sistem təhsil məlumatını göstərməlidir | Must |
FR-301-05 | Profile Info | Sistem iş təcrübəsini (il) göstərməlidir | Must |
FR-301-06 | Profile Info | Sistem ixtisaslaşma sahələrini göstərməlidir | Should |
FR-301-07 | Profile Info | Sistem danışılan dilləri göstərməlidir | Should |
FR-301-08 | Profile Info | Sistem sertifikat və akademik dərəcəni göstərməlidir | Should |
FR-301-09 | Clinics | Sistem həkimin işlədiyi bütün klinikaları göstərməlidir | Must |
FR-301-10 | Clinics | Sistem hər klinika üçün ünvan və xəritə keçidi göstərməlidir | Should |
FR-301-11 | Clinics | Sistem klinika seçimi imkanı verməlidir | Must — bir neçə klinikada işləyirsə |
FR-301-12 | Clinics | Sistem klinika adına klik ilə klinika səhifəsinə keçid verməlidir | Should |
FR-301-13 | Services | Sistem hər klinika üzrə həkimin göstərdiyi xidmətləri göstərməlidir | Must |
FR-301-14 | Services | Sistem xidmətin təxmini müddətini göstərməlidir | Should |
FR-301-15 | Services | Sistem müayinənin dəyərinin klinikada müəyyən edildiyini bildirməlidir | Must — qiymət göstərilmir |
FR-301-16 | Schedule | Sistem yaxın 7 günün boş vaxtlarını göstərməlidir | Must |
FR-301-17 | Schedule | Sistem slotları klinika üzrə ayırmalıdır | Must |
FR-301-18 | Schedule | Sistem yalnız gələcək boş slotları göstərməlidir | Must |
FR-301-19 | Schedule | Sistem cədvəli real vaxt rejimində yeniləməlidir | Must |
FR-301-20 | Schedule | Sistem boş vaxt olmadıqda növbəti mövcud tarixi bildirməlidir | Should |
FR-301-21 | Schedule | Sistem slota birbaşa klik ilə randevu prosesinə keçid verməlidir | Should |
FR-301-22 | Reviews | Sistem pasient rəylərini göstərməlidir | Must |
FR-301-23 | Reviews | Sistem yalnız moderasiyadan keçmiş rəyləri göstərməlidir | Must |
FR-301-24 | Reviews | Sistem reytinq paylanmasını göstərməlidir | Should |
FR-301-25 | Reviews | Sistem rəyləri tarix və reytinq üzrə çeşidləməyə imkan verməlidir | Should |
FR-301-26 | Actions | Sistem "Randevu al" düyməsini göstərməlidir | Must |
FR-301-27 | Actions | Sistem qeydiyyatsız istifadəçini randevu cəhdində qeydiyyata yönləndirməlidir | Must |
FR-301-28 | Actions | Sistem qeydiyyatdan sonra istifadəçini bu səhifəyə qaytarmalıdır | Must — return URL |
FR-301-29 | Actions | Sistem həkimi favoritlərə əlavə etməyə imkan verməlidir | Should |
FR-301-30 | Actions | Sistem profil linkinin paylaşılmasına imkan verməlidir | Should |

### UC-302 — View Clinic Detail Page

ID | Category | Requirement | Comment |
FR-302-01 | Clinic Info | Sistem klinikanın adı, loqosu və növünü göstərməlidir | Must |
FR-302-02 | Clinic Info | Sistem klinika təsvirini göstərməlidir | Should |
FR-302-03 | Clinic Info | Sistem klinikanın reytinqini göstərməlidir | Must |
FR-302-04 | Contact | Sistem ünvanı və xəritədəki yerini göstərməlidir | Must |
FR-302-05 | Contact | Sistem əlaqə telefonunu göstərməlidir | Must |
FR-302-06 | Contact | Sistem xəritə tətbiqinə naviqasiya keçidi verməlidir | Should |
FR-302-07 | Working Hours | Sistem iş saatlarını həftə günləri üzrə göstərməlidir | Must |
FR-302-08 | Gallery | Sistem klinika fotoqalereyasını göstərməlidir | Should |
FR-302-09 | Services | Sistem klinikanın xidmətlərini göstərməlidir | Must |
FR-302-10 | Doctors | Sistem klinikada işləyən aktiv həkimləri siyahılamalıdır | Must |
FR-302-11 | Doctors | Sistem hər həkim üçün foto, ad, ixtisas və reytinq göstərməlidir | Must |
FR-302-12 | Doctors | Sistem hər həkim üçün ən yaxın boş vaxtı göstərməlidir | Should |
FR-302-13 | Doctors | Sistem həkimləri ixtisas üzrə filtrləməyə imkan verməlidir | Should |
FR-302-14 | Doctors | Sistem həkim kartından detallı səhifəyə keçid verməlidir | Must |
FR-302-15 | Doctors | Sistem "Bütün həkimləri gör" keçidi verməlidir | Should — klinika filtri ilə axtarışa |
FR-302-16 | Doctors | Sistem aktiv həkim olmadıqda müvafiq mesaj göstərməlidir | Should |
FR-302-17 | Reviews | Sistem klinika ilə bağlı rəyləri göstərməlidir | Should |
FR-302-18 | Reviews | Sistem klinika reytinqini həkim reytinqlərindən hesablamalıdır | Must |

## Modul 4 — Appointment Management

### UC-401 — Book Appointment

ID | Category | Requirement | Comment |
FR-401-01 | Initiation | Sistem randevu üçün autentifikasiya tələb etməlidir | Must |
FR-401-02 | Initiation | Sistem qeydiyyatsız istifadəçini qeydiyyata yönləndirməlidir | Must |
FR-401-03 | Initiation | Sistem qeydiyyatdan sonra istifadəçini randevu səhifəsinə qaytarmalıdır | Must |
FR-401-04 | Initiation | Sistem həkim bir neçə klinikada işləyirsə klinika seçimi təqdim etməlidir | Must |
FR-401-05 | Initiation | Sistem tək klinika halında bu addımı atlamalıdır | Should |
FR-401-06 | Initiation | Sistem seçilmiş klinika üzrə xidmət siyahısını göstərməlidir | Must |
FR-401-07 | Initiation | Sistem xidmət seçimini tələb etməlidir | Must |
FR-401-08 | Slot Selection | Sistem boş slotları real vaxt rejimində göstərməlidir | Must |
FR-401-09 | Slot Selection | Sistem dolu və bağlı slotları deaktiv göstərməlidir | Must |
FR-401-10 | Slot Selection | Sistem keçmiş tarixləri seçilə bilməyən etməlidir | Must |
FR-401-11 | Slot Selection | Sistem 1 saatdan az qalan slotları bloklamalıdır | Must — parametr: min_booking_lead_hours |
FR-401-12 | Slot Selection | Sistem xidmət müddətinə uyğun slot hesablaması aparmalıdır | Must |
FR-401-13 | Slot Selection | Sistem gələcək 60 gün üçün təqvim göstərməlidir | Should |
FR-401-14 | Slot Locking | Sistem seçilmiş slotu 10 dəqiqə soft lock etməlidir | Must — parametr: slot_soft_lock_minutes |
FR-401-15 | Slot Locking | Sistem soft lock müddətini geri sayım şəklində göstərməlidir | Should |
FR-401-16 | Slot Locking | Sistem paralel sorğularda yalnız bir lock-u qəbul etməlidir | Must — double-booking qarşısı |
FR-401-17 | Slot Locking | Sistem lock müddəti bitdikdə slotu avtomatik buraxmalıdır | Must |
FR-401-18 | Slot Locking | Sistem slot seçimi ləğv edildikdə lock-u dərhal buraxmalıdır | Must |
FR-401-19 | Booking Details | Sistem randevu xülasəsini təsdiqdən əvvəl göstərməlidir | Must |
FR-401-20 | Booking Details | Sistem xülasədə həkim, klinika, ünvan, tarix, saat və xidməti göstərməlidir | Must |
FR-401-21 | Booking Details | Sistem müayinənin dəyərinin klinikada müəyyən edildiyini bildirməlidir | Must |
FR-401-22 | Booking Details | Sistem pasientə şikayət/qeyd yazmağa imkan verməlidir | Should |
FR-401-23 | Booking Details | Sistem randevuya tibbi sənəd əlavə etməyə imkan verməlidir | Should |
FR-401-24 | Booking Details | Sistem əlavə edilmiş sənədlər üçün həkimə avtomatik giriş icazəsi yaratmalıdır | Should — randevudan 7 gün sonraya qədər |
FR-401-25 | Validation | Sistem randevu yaratmadan əvvəl slot statusunu yenidən yoxlamalıdır | Must |
FR-401-26 | Validation | Sistem eyni həkimlə eyni gündə təkrar randevunu bloklamalıdır | Must |
FR-401-27 | Validation | Sistem no-show limitini yoxlamalıdır | Should — parametr: no_show_limit |
FR-401-28 | Creation | Sistem unikal booking reference yaratmalıdır | Must — klinikada təqdim edilir |
FR-401-29 | Creation | Sistem həkimin təsdiq rejiminə uyğun status təyin etməlidir | Must — avtomatik / manual |
FR-401-30 | Creation | Sistem slot statusunu "booked" etməlidir | Must |
FR-401-31 | Creation | Sistem status tarixçəsi qeydi yaratmalıdır | Must |
FR-401-32 | Creation | Sistem əməliyyatı audit log-a yazmalıdır | Must |
FR-401-33 | Post-Booking | Sistem pasientə təsdiq bildirişi göndərməlidir | Must |
FR-401-34 | Post-Booking | Sistem həkimə yeni randevu bildirişi göndərməlidir | Must |
FR-401-35 | Post-Booking | Sistem 24 saat əvvələ xatırlatma planlaşdırmalıdır | Must |
FR-401-36 | Post-Booking | Sistem 2 saat əvvələ xatırlatma planlaşdırmalıdır | Should |
FR-401-37 | Post-Booking | Sistem randevunu pasientin randevular siyahısına əlavə etməlidir | Must |
FR-401-38 | Post-Booking | Sistem randevunu həkimin cədvəlinə əlavə etməlidir | Must |
FR-401-39 | Post-Booking | Sistem təqvimə əlavə etmə (.ics) imkanı verməlidir | Should |

### UC-402 — Cancel Appointment

ID | Category | Requirement | Comment |
FR-402-01 | Cancellation | Sistem pasientə aktiv randevunu ləğv etməyə imkan verməlidir | Must |
FR-402-02 | Cancellation | Sistem həkimə randevunu ləğv etməyə imkan verməlidir | Must |
FR-402-03 | Cancellation | Sistem klinika admininə randevunu ləğv etməyə imkan verməlidir | Must |
FR-402-04 | Cancellation | Sistem ləğv səbəbini tələb etməlidir | Must |
FR-402-05 | Cancellation | Sistem ləğv üçün təsdiq dialoqu göstərməlidir | Must |
FR-402-06 | Cancellation | Sistem keçmiş randevular üçün ləğv imkanını gizlətməlidir | Must |
FR-402-07 | Cancellation | Sistem 1 saatdan az qalan randevu üçün online ləğvi bloklamalıdır | Must — parametr: min_cancel_lead_hours |
FR-402-08 | Cancellation | Sistem gec ləğv halında xəbərdarlıq göstərməlidir | Should |
FR-402-09 | Cancellation | Sistem toplu ləğv imkanı verməlidir | Should — klinika admini üçün |
FR-402-10 | Post-Cancel | Sistem slotu dərhal boş elan etməlidir | Must |
FR-402-11 | Post-Cancel | Sistem hər iki tərəfə bildiriş göndərməlidir | Must |
FR-402-12 | Post-Cancel | Sistem planlaşdırılmış xatırlatmaları ləğv etməlidir | Must |
FR-402-13 | Post-Cancel | Sistem randevu ilə bağlı sənəd icazələrini bağlamalıdır | Must |
FR-402-14 | Post-Cancel | Sistem ləğv edilmiş randevunu tarixçədə saxlamalıdır | Must — silinmir |
FR-402-15 | Post-Cancel | Sistem status tarixçəsi qeydi yaratmalıdır | Must |
FR-402-16 | Post-Cancel | Sistem həkim tərəfindən ləğvdə alternativ vaxtlar təklif etməlidir | Should |
FR-402-17 | Post-Cancel | Sistem həkim/klinika ləğvində pasientin no-show statistikasını dəyişməməlidir | Must |

### UC-403 — Reschedule Appointment

ID | Category | Requirement | Comment |
FR-403-01 | Reschedule | Sistem randevunu başqa vaxta köçürməyə imkan verməlidir | Should |
FR-403-02 | Reschedule | Sistem reschedule sayını izləməli və limitə çatdıqda bloklamalıdır | Should — parametr: max_reschedule_count |
FR-403-03 | Reschedule | Sistem 2 saatdan az qalan randevu üçün köçürməni bloklamalıdır | Must |
FR-403-04 | Reschedule | Sistem mövcud boş slotları göstərməlidir | Must |
FR-403-05 | Reschedule | Sistem yeni slotu soft lock etməlidir | Must |
FR-403-06 | Reschedule | Sistem dəyişiklik xülasəsini (köhnə → yeni) göstərməlidir | Should |
FR-403-07 | Reschedule | Sistem köhnə slotu yalnız yeni slot təsdiqləndikdən sonra buraxmalıdır | Must — itki riskinin qarşısı |
FR-403-08 | Reschedule | Sistem başqa klinikaya köçürmədə yeni klinikanın şərtlərini bildirməlidir | Should |
FR-403-09 | Post-Reschedule | Sistem köhnə xatırlatmaları ləğv etməlidir | Must |
FR-403-10 | Post-Reschedule | Sistem yeni vaxta xatırlatmalar planlaşdırmalıdır | Must |
FR-403-11 | Post-Reschedule | Sistem hər iki tərəfə bildiriş göndərməlidir | Must |
FR-403-12 | Post-Reschedule | Sistem status tarixçəsinə köçürmə qeydi yazmalıdır | Must |
FR-403-13 | Post-Reschedule | Sistem həkim tərəfindən köçürmədə pasient təsdiqi tələb etməlidir | Should |

### UC-404 — My Appointments

ID | Category | Requirement | Comment |
FR-404-01 | List | Sistem pasientin bütün randevularını göstərməlidir | Must |
FR-404-02 | List | Sistem randevuları yaxınlaşan/keçmiş/ləğv edilmiş kimi qruplaşdırmalıdır | Must |
FR-404-03 | List | Sistem hər kartda həkim, klinika, tarix, saat və statusu göstərməlidir | Must |
FR-404-04 | List | Sistem status badge-ini rəngli göstərməlidir | Should |
FR-404-05 | List | Sistem randevuları tarix üzrə çeşidləməlidir | Must |
FR-404-06 | List | Sistem randevuları filtrləməyə imkan verməlidir | Should |
FR-404-07 | List | Sistem randevu olmadıqda empty state göstərməlidir | Should |
FR-404-08 | Security | Sistem yalnız öz randevularına girişə icazə verməlidir | Must |
FR-404-09 | Details | Sistem randevunun tam detallarını göstərməlidir | Must |
FR-404-10 | Details | Sistem klinika ünvanını və xəritə keçidini göstərməlidir | Must |
FR-404-11 | Details | Sistem booking reference və QR kodu göstərməlidir | Should — klinikada təqdim üçün |
FR-404-12 | Details | Sistem statusa uyğun əməliyyat düymələrini göstərməlidir | Must |
FR-404-13 | Details | Sistem təqvimə əlavə etmə imkanı verməlidir | Should |
FR-404-14 | Details | Sistem randevu ilə bağlı resepti göstərməlidir | Should |
FR-404-15 | Details | Sistem randevuya sonradan sənəd əlavə etməyə imkan verməlidir | Should |
FR-404-16 | Details | Sistem tamamlanmış randevuda rəy yazma keçidi verməlidir | Must |

### UC-405 — Appointment Completion & No-Show

ID | Category | Requirement | Comment |
FR-405-01 | Completion | Sistem həkimə randevunu tamamlanmış kimi işarələməyə imkan verməlidir | Must |
FR-405-02 | Completion | Sistem vaxtı gəlməmiş randevunun tamamlanmasını bloklamalıdır | Must |
FR-405-03 | Completion | Sistem müayinə qeydləri daxil etməyə imkan verməlidir | Should |
FR-405-04 | Completion | Sistem müayinə qeydlərini yalnız həkim və pasientə göstərməlidir | Must — klinika admini görmür |
FR-405-05 | Completion | Sistem tamamlanmış randevunu tibbi tarixçəyə əlavə etməlidir | Must |
FR-405-06 | Completion | Sistem 24 saat sonra avtomatik tamamlama tətbiq etməlidir | Should — parametr: auto_complete_after_hours |
FR-405-07 | Completion | Sistem tamamlanmadan sonra rəy dəvəti göndərməlidir | Should — 2 saat sonra |
FR-405-08 | Completion | Sistem növbəti randevu təklifi imkanı verməlidir | Should |
FR-405-09 | No-Show | Sistem randevunu no-show kimi işarələməyə imkan verməlidir | Must |
FR-405-10 | No-Show | Sistem pasientin no-show sayğacını artırmalıdır | Must |
FR-405-11 | No-Show | Sistem pasientə no-show bildirişi göndərməlidir | Should |
FR-405-12 | No-Show | Sistem no-show statusunun 24 saat ərzində düzəldilməsinə imkan verməlidir | Should — səhv qeyd halında |
FR-405-13 | No-Show | Sistem no-show statistikasını klinika hesabatlarında göstərməlidir | Should |
FR-405-14 | No-Show | Sistem no-show randevu üçün rəy yazmağa icazə verməməlidir | Must |

## Modul 5 — Medical Documents

### UC-501 — Upload Medical Document

ID | Category | Requirement | Comment |
FR-501-01 | File Upload | Sistem PDF, JPG və PNG formatlarını qəbul etməlidir | Must |
FR-501-02 | File Upload | Sistem dəstəklənməyən formatı rədd edib xəbərdarlıq göstərməlidir | Must |
FR-501-03 | File Upload | Sistem maksimum fayl ölçüsünü 10 MB ilə məhdudlaşdırmalıdır | Must — parametr: max_file_size_mb |
FR-501-04 | File Upload | Sistem ölçü limiti aşıldıqda sıxışdırma təklif etməlidir | Should |
FR-501-05 | File Upload | Sistem kamera ilə birbaşa sənəd çəkməyə imkan verməlidir | Should |
FR-501-06 | File Upload | Sistem çəkilmiş şəkil üçün avtomatik kəsmə təklif etməlidir | Should — auto-crop |
FR-501-07 | File Upload | Sistem bir neçə faylın eyni anda yüklənməsini dəstəkləməlidir | Should |
FR-501-08 | File Upload | Sistem yükləmə irəliləyişini göstərməlidir | Should |
FR-501-09 | File Upload | Sistem hər faylı antivirus skanından keçirməlidir | Must |
FR-501-10 | File Upload | Sistem zərərli fayl aşkarlandıqda yükləməni rədd etməlidir | Must — təhlükəsizlik log-una yazılır |
FR-501-11 | File Upload | Sistem yükləmə kəsildikdə natamam faylı silməlidir | Must |
FR-501-12 | Metadata | Sistem sənəd kateqoriyası seçməyi tələb etməlidir | Must — analiz, görüntüləmə, epikriz, resept, digər |
FR-501-13 | Metadata | Sistem sənədin tarixini daxil etməyə imkan verməlidir | Must |
FR-501-14 | Metadata | Sistem qısa təsvir əlavə etməyə imkan verməlidir | Should |
FR-501-15 | Organization | Sistem sənədləri kateqoriya üzrə qruplaşdırmalıdır | Must |
FR-501-16 | Organization | Sistem sənədləri tarix üzrə çeşidləməyə imkan verməlidir | Should |
FR-501-17 | Organization | Sistem sənədlər arasında axtarış imkanı verməlidir | Should |
FR-501-18 | Organization | Sistem sənədi arxivləməyə imkan verməlidir | Should |
FR-501-19 | Organization | Sistem sənədi silməyə imkan verməlidir | Must |
FR-501-20 | Organization | Sistem silinən sənədi 30 gün soft delete vəziyyətində saxlamalıdır | Must — parametr: document_soft_delete_days |
FR-501-21 | Security | Sistem faylları AES-256 ilə şifrələməlidir | Must |
FR-501-22 | Security | Sistem faylları TLS üzərindən ötürməlidir | Must |
FR-501-23 | Security | Sistem hər sənədi yalnız sahibi olan pasientin ID-si ilə əlaqələndirməlidir | Must |
FR-501-24 | Security | Sistem şifrələmə açarı referensini ayrıca saxlamalıdır | Must |
FR-501-25 | Security | Sistem fayla girişi yalnız signed URL vasitəsilə təmin etməlidir | Must |
FR-501-26 | Security | Sistem tibbi razılıq olmadan yükləməyə icazə verməməlidir | Must |
FR-501-27 | Audit | Sistem yükləmə əməliyyatını audit log-a yazmalıdır | Must |

### UC-502 — Grant & Manage Document Access

ID | Category | Requirement | Comment |
FR-502-01 | Granting | Sistem sənədi konkret həkimlə paylaşmağa imkan verməlidir | Must |
FR-502-02 | Granting | Sistem yalnız pasientin randevusu olan həkimləri siyahılamalıdır | Must — təsadüfi paylaşımın qarşısı |
FR-502-03 | Granting | Sistem giriş müddəti seçimi təqdim etməlidir | Must — 24 saat / 7 gün / 30 gün / randevu müddətincə |
FR-502-04 | Granting | Sistem paylaşımdan əvvəl xülasə göstərməlidir | Should |
FR-502-05 | Granting | Sistem bir neçə sənədi eyni anda paylaşmağa imkan verməlidir | Should |
FR-502-06 | Granting | Sistem randevu ilə əlavə edilən sənədlər üçün avtomatik icazə yaratmalıdır | Should |
FR-502-07 | Granting | Sistem həkimə yeni paylaşım bildirişi göndərməlidir | Should |
FR-502-08 | Access Control | Sistem icazə müddəti bitdikdə girişi avtomatik bağlamalıdır | Must |
FR-502-09 | Access Control | Sistem pasientə icazəni istənilən vaxt ləğv etməyə imkan verməlidir | Must |
FR-502-10 | Access Control | Sistem ləğv edildikdə girişi dərhal bağlamalıdır | Must |
FR-502-11 | Access Control | Sistem icazəsi olmayan həkimin girişini bloklamalıdır | Must |
FR-502-12 | Access Control | Sistem icazə müddətini uzatmağa imkan verməlidir | Should |
FR-502-13 | Access Control | Sistem randevu ləğv edildikdə əlaqəli icazələri bağlamalıdır | Must |
FR-502-14 | Access Control | Sistem deaktiv edilmiş həkimin mövcud icazələrini bağlamalıdır | Must |
FR-502-15 | Transparency | Sistem aktiv paylaşımların siyahısını göstərməlidir | Must |
FR-502-16 | Transparency | Sistem hər paylaşım üçün qalan vaxtı göstərməlidir | Should |
FR-502-17 | Transparency | Sistem sənədə kimin və nə vaxt baxdığını pasientə göstərməlidir | Must — məlumat şəffaflığı |
FR-502-18 | Transparency | Sistem baxış sayını göstərməlidir | Should |
FR-502-19 | Restrictions | Sistem klinika admininin tibbi sənədlərə girişini bloklamalıdır | Must |
FR-502-20 | Restrictions | Sistem Super Admin-ə yalnız sənəd metadata-sını göstərməlidir | Must — məzmun görünmür |
FR-502-21 | Audit | Sistem bütün icazə əməliyyatlarını audit log-a yazmalıdır | Must |
FR-502-22 | Audit | Sistem uğursuz giriş cəhdlərini qeyd etməlidir | Must |

### UC-503 — Doctor Views Shared Documents

ID | Category | Requirement | Comment |
FR-503-01 | Document Access | Sistem həkimə icazə verilmiş sənədləri siyahılamalıdır | Must |
FR-503-02 | Document Access | Sistem hər sənəd üçün ad, kateqoriya və tarixi göstərməlidir | Must |
FR-503-03 | Document Access | Sistem icazənin bitmə vaxtını göstərməlidir | Should |
FR-503-04 | Document Access | Sistem sənəd açılmazdan əvvəl icazənin aktiv olduğunu yoxlamalıdır | Must |
FR-503-05 | Document Access | Sistem qısa müddətli signed URL yaratmalıdır | Must |
FR-503-06 | Document Access | Sistem signed URL-in təkrar istifadəsinə imkan verməməlidir | Must |
FR-503-07 | Document Access | Sistem sənədi platforma daxili görüntüləyicidə açmalıdır | Must |
FR-503-08 | Restrictions | Sistem həkimin sənədi yükləməsini (download) bloklamalıdır | Must |
FR-503-09 | Restrictions | Sistem download cəhdini log-a yazmalıdır | Must |
FR-503-10 | Restrictions | Sistem başqa pasientin sənədinə girişi bloklamalıdır | Must |
FR-503-11 | Restrictions | Sistem müddəti bitmiş icazə üçün müvafiq mesaj göstərməlidir | Should |
FR-503-12 | Restrictions | Sistem silinmiş sənədi həkimə göstərməməlidir | Must |
FR-503-13 | Audit | Sistem hər baxışı qeyd etməlidir | Must — kim, nə vaxt, hansı sənəd, IP |
FR-503-14 | Usability | Sistem resept yazarkən sənədlərə paralel baxış imkanı verməlidir | Should |
FR-503-15 | Usability | Sistem sənədləri kateqoriya üzrə filtrləməyə imkan verməlidir | Should |

### UC-504 — Medical History Timeline

ID | Category | Requirement | Comment |
FR-504-01 | Timeline | Sistem tibbi hadisələri xronoloji ardıcıllıqla göstərməlidir | Must — ən yenidən köhnəyə |
FR-504-02 | Timeline | Sistem hər hadisə üçün tip, tarix, həkim və klinikanı göstərməlidir | Must |
FR-504-03 | Timeline | Sistem hadisə tiplərini ikon ilə fərqləndirməlidir | Should |
FR-504-04 | Timeline | Sistem tamamlanmış randevunu avtomatik tarixçəyə əlavə etməlidir | Must |
FR-504-05 | Timeline | Sistem imzalanmış resepti avtomatik tarixçəyə əlavə etməlidir | Must |
FR-504-06 | Filtering | Sistem hadisə tipi üzrə filtrləməyə imkan verməlidir | Should |
FR-504-07 | Filtering | Sistem tarix aralığı üzrə filtrləməyə imkan verməlidir | Should |
FR-504-08 | Filtering | Sistem həkim və klinika üzrə filtrləməyə imkan verməlidir | Should |
FR-504-09 | Navigation | Sistem hadisədən müvafiq detallı səhifəyə keçid verməlidir | Must |
FR-504-10 | Export | Sistem tarixçəni PDF formatında yükləməyə imkan verməlidir | Should |
FR-504-11 | Access Control | Sistem pasientə bütün öz tarixçəsini göstərməlidir | Must |
FR-504-12 | Access Control | Sistem həkimə yalnız icazə verilmiş elementləri göstərməlidir | Must |
FR-504-13 | Access Control | Sistem klinika admininin tibbi tarixçəyə girişini bloklamalıdır | Must |
FR-504-14 | Usability | Sistem boş tarixçə üçün empty state göstərməlidir | Should |

## Modul 6 — E-Prescription

### UC-601 — Create E-Prescription

ID | Category | Requirement | Comment |
FR-601-01 | Authorization | Sistem resept yazmazdan əvvəl həkimin lisenziya statusunu yoxlamalıdır | Must |
FR-601-02 | Authorization | Sistem lisenziyası etibarsız həkimin resept yazmasını bloklamalıdır | Must |
FR-601-03 | Authorization | Sistem imza sertifikatının etibarlılığını yoxlamalıdır | Must |
FR-601-04 | Authorization | Sistem randevusu olmayan pasient üçün resept yazılmasını bloklamalıdır | Must |
FR-601-05 | Creation | Sistem pasient məlumatlarını avtomatik doldurmalıdır | Must — ad, FIN, yaş, cins |
FR-601-06 | Creation | Sistem diaqnoz daxil etməyə imkan verməlidir | Must |
FR-601-07 | Creation | Sistem ICD-10 kodu seçməyə imkan verməlidir | Should |
FR-601-08 | Creation | Sistem dərman bazasından axtarış imkanı verməlidir | Must |
FR-601-09 | Creation | Sistem hər dərman üçün doza daxil etməyə imkan verməlidir | Must |
FR-601-10 | Creation | Sistem qəbul tezliyini daxil etməyə imkan verməlidir | Must |
FR-601-11 | Creation | Sistem qəbul müddətini daxil etməyə imkan verməlidir | Must |
FR-601-12 | Creation | Sistem istifadə təlimatı daxil etməyə imkan verməlidir | Must |
FR-601-13 | Creation | Sistem bir reseptə bir neçə dərman əlavə etməyə imkan verməlidir | Must |
FR-601-14 | Creation | Sistem ümumi tövsiyələr sahəsi təqdim etməlidir | Should |
FR-601-15 | Creation | Sistem reseptin etibarlılıq müddətini təyin etməyə imkan verməlidir | Must — default: 30 gün |
FR-601-16 | Creation | Sistem bazada olmayan dərmanın əl ilə daxil edilməsinə imkan verməlidir | Should — qarşılıqlı təsir yoxlanmır xəbərdarlığı ilə |
FR-601-17 | Templates | Sistem resept şablonu yaratmağa imkan verməlidir | Should |
FR-601-18 | Templates | Sistem əvvəlki resepti təkrarlamağa imkan verməlidir | Should — uzunmüddətli müalicə üçün |
FR-601-19 | Safety Check | Sistem pasientin allergiyalarını həkimə göstərməlidir | Must |
FR-601-20 | Safety Check | Sistem pasientin aktiv dərmanlarını göstərməlidir | Must |
FR-601-21 | Safety Check | Sistem seçilmiş dərmanı allergiya siyahısı ilə yoxlamalıdır | Must |
FR-601-22 | Safety Check | Sistem allergiya konfliktində qırmızı xəbərdarlıq göstərməlidir | Must |
FR-601-23 | Safety Check | Sistem dərman qarşılıqlı təsir yoxlaması aparmalıdır | Must |
FR-601-24 | Safety Check | Sistem qarşılıqlı təsirin şiddət səviyyəsini göstərməlidir | Should |
FR-601-25 | Safety Check | Sistem nəzarətdə olan dərmanlar üçün əlavə təsdiq tələb etməlidir | Must |
FR-601-26 | Safety Check | Sistem xəbərdarlıq ötürüldükdə açıq təsdiq tələb etməlidir | Must |
FR-601-27 | Safety Check | Sistem ötürmə səbəbini qeyd etməli və log-a yazmalıdır | Must — hüquqi məsuliyyət |
FR-601-28 | Safety Check | Sistem yaşa uyğun doza xəbərdarlığı verməlidir | Should — uşaq və yaşlı pasientlər |
FR-601-29 | Signature | Sistem imzalamadan əvvəl reseptin önizləməsini göstərməlidir | Must |
FR-601-30 | Signature | Sistem məcburi sahələr doldurulmadan imzalamağa icazə verməməlidir | Must |
FR-601-31 | Signature | Sistem rəqəmsal imza tələb etməlidir | Must |
FR-601-32 | Signature | Sistem imzasız resepti pasientə göndərməməlidir | Must |
FR-601-33 | Signature | Sistem imzalanmış reseptin redaktəsini bloklamalıdır | Must |
FR-601-34 | Signature | Sistem imza servisi xəta verdikdə resepti draft kimi saxlamalıdır | Must |
FR-601-35 | Signature | Sistem unikal resept nömrəsi yaratmalıdır | Must |
FR-601-36 | Signature | Sistem doğrulama QR kodu yaratmalıdır | Should — aptekdə yoxlama üçün |
FR-601-37 | Draft & Cancel | Sistem resepti draft kimi saxlamağa imkan verməlidir | Should |
FR-601-38 | Draft & Cancel | Sistem imzalanmış resepti ləğv etməyə imkan verməlidir | Must — səhv halında |
FR-601-39 | Draft & Cancel | Sistem ləğv edilmiş resepti silməməli, audit üçün saxlamalıdır | Must |
FR-601-40 | Distribution | Sistem resepti pasientin profilinə əlavə etməlidir | Must |
FR-601-41 | Distribution | Sistem resepti tibbi tarixçəyə əlavə etməlidir | Must |
FR-601-42 | Distribution | Sistem pasientə yeni resept bildirişi göndərməlidir | Must |
FR-601-43 | Restrictions | Sistem klinika admininin resept məzmununa girişini bloklamalıdır | Must |
FR-601-44 | Audit | Sistem bütün resept əməliyyatlarını audit log-a yazmalıdır | Must |

### UC-602 — Patient Views Prescription

ID | Category | Requirement | Comment |
FR-602-01 | Access | Sistem pasientə öz reseptlərini göstərməlidir | Must |
FR-602-02 | Access | Sistem yalnız imzalanmış reseptləri göstərməlidir | Must — draft görünmür |
FR-602-03 | Access | Sistem başqasının reseptinə girişi bloklamalıdır | Must |
FR-602-04 | Access | Sistem pasientin resepti redaktə etməsini bloklamalıdır | Must — yalnız oxunaqlı |
FR-602-05 | Display | Sistem reseptləri status üzrə qruplaşdırmalıdır | Must — aktiv / keçmiş / ləğv edilmiş |
FR-602-06 | Display | Sistem hər kartda resept nömrəsi, tarix və həkimi göstərməlidir | Must |
FR-602-07 | Display | Sistem reseptin tam detallarını göstərməlidir | Must — diaqnoz, dərmanlar, doza, təlimat |
FR-602-08 | Display | Sistem həkim məlumatını və imza statusunu göstərməlidir | Must |
FR-602-09 | Display | Sistem etibarlılıq müddətini göstərməlidir | Must |
FR-602-10 | Display | Sistem müddəti bitmiş resepti "Expired" kimi işarələməlidir | Must — avtomatik |
FR-602-11 | Display | Sistem ləğv edilmiş resepti etibarsız kimi göstərməlidir | Must |
FR-602-12 | Display | Sistem dərman haqqında ümumi məlumat göstərməlidir | Should — məlumatlandırma, tibbi məsləhət deyil |
FR-602-13 | Usage | Sistem doğrulama QR kodunu göstərməlidir | Should |
FR-602-14 | Usage | Sistem resepti PDF formatında yükləməyə imkan verməlidir | Should |
FR-602-15 | Usage | Sistem randevu detallarından reseptə keçid verməlidir | Should |
FR-602-16 | Renewal | Sistem təkrar resept sorğusu göndərməyə imkan verməlidir | Should |
FR-602-17 | Renewal | Sistem təkrar resepti yalnız həkim təsdiqi ilə yaratmalıdır | Must |

## Modul 7 — Doctor Panel

### UC-701 — Doctor Profile Setup

ID | Category | Requirement | Comment |
FR-701-01 | Onboarding | Sistem həkimi ilk girişdə profil tamamlama səhifəsinə yönləndirməlidir | Must |
FR-701-02 | Onboarding | Sistem həkimin özbaşına qeydiyyatını bloklamalıdır | Must — yalnız klinika admini əlavə edir |
FR-701-03 | Profile Data | Sistem SİMA-dan gələn şəxsi məlumatları read-only göstərməlidir | Must |
FR-701-04 | Profile Data | Sistem klinika admininin daxil etdiyi məlumatları read-only göstərməlidir | Must — lisenziya, ixtisas, klinika |
FR-701-05 | Profile Data | Sistem profil fotosu yükləməyə imkan verməlidir | Must |
FR-701-06 | Profile Data | Sistem bio / peşəkar təsvir yazmağa imkan verməlidir | Must |
FR-701-07 | Profile Data | Sistem təhsil məlumatı daxil etməyə imkan verməlidir | Must |
FR-701-08 | Profile Data | Sistem iş təcrübəsi (il) daxil etməyə imkan verməlidir | Must |
FR-701-09 | Profile Data | Sistem əlavə ixtisaslaşma sahələri seçməyə imkan verməlidir | Should |
FR-701-10 | Profile Data | Sistem danışılan dilləri seçməyə imkan verməlidir | Should |
FR-701-11 | Profile Data | Sistem sertifikat və akademik dərəcə əlavə etməyə imkan verməlidir | Should |
FR-701-12 | Validation | Sistem məcburi sahələr doldurulmadan profili tamamlanmış saymamalıdır | Must |
FR-701-13 | Validation | Sistem profili tamamlanmayan həkimi axtarışda göstərməməlidir | Must |
FR-701-14 | Validation | Sistem uyğun olmayan foto formatını rədd etməlidir | Should |
FR-701-15 | Restrictions | Sistem həkimin lisenziya məlumatını dəyişməsini bloklamalıdır | Must |
FR-701-16 | Restrictions | Sistem həkimin özünü klinikadan çıxarmasını bloklamalıdır | Must |
FR-701-17 | Restrictions | Sistem həkimin qiymət təyin etməsini bloklamalıdır | Must — klinika admininin səlahiyyəti |
FR-701-18 | Preferences | Sistem randevu təsdiq rejimi seçməyə imkan verməlidir | Must — avtomatik / manual |
FR-701-19 | Preferences | Sistem bildiriş parametrlərini idarə etməyə imkan verməlidir | Should |
FR-701-20 | Update | Sistem profil dəyişikliklərini dərhal pasient tərəfində əks etdirməlidir | Must |
FR-701-21 | Update | Sistem profil tamamlandıqda klinika admininə bildiriş göndərməlidir | Should |
FR-701-22 | Audit | Sistem profil dəyişikliklərini audit log-a yazmalıdır | Must |

### UC-702 — Doctor Schedule Management

ID | Category | Requirement | Comment |
FR-702-01 | Configuration | Sistem cədvəli hər klinika üzrə ayrıca qurmağa imkan verməlidir | Must |
FR-702-02 | Configuration | Sistem klinikaları tab şəklində göstərməlidir | Should |
FR-702-03 | Configuration | Sistem iş günlərini seçməyə imkan verməlidir | Must |
FR-702-04 | Configuration | Sistem hər gün üçün başlama və bitmə saatı təyin etməyə imkan verməlidir | Must |
FR-702-05 | Configuration | Sistem slot müddəti seçməyə imkan verməlidir | Must — 15/20/30/45/60 dəqiqə |
FR-702-06 | Configuration | Sistem fasilə əlavə etməyə imkan verməlidir | Must — nahar və s. |
FR-702-07 | Configuration | Sistem randevular arası bufer vaxtı təyin etməyə imkan verməlidir | Should |
FR-702-08 | Configuration | Sistem cədvəli həftəlik təqvim görünüşündə göstərməlidir | Must |
FR-702-09 | Configuration | Sistem klinikanın iş saatlarını məhdudiyyət kimi göstərməlidir | Should |
FR-702-10 | Configuration | Sistem cədvəli şablon kimi saxlamağa imkan verməlidir | Should |
FR-702-11 | Exceptions | Sistem konkret günü bağlamağa imkan verməlidir | Must |
FR-702-12 | Exceptions | Sistem məzuniyyət tarix aralığı təyin etməyə imkan verməlidir | Must |
FR-702-13 | Exceptions | Sistem məzuniyyət dövründə randevu qəbulunu dayandırmalıdır | Must |
FR-702-14 | Exceptions | Sistem əlavə iş saatı açmağa imkan verməlidir | Should |
FR-702-15 | Exceptions | Sistem tək slotu bloklamağa imkan verməlidir | Should |
FR-702-16 | Slot Generation | Sistem cədvəl əsasında slotları avtomatik generasiya etməlidir | Must |
FR-702-17 | Slot Generation | Sistem gələcək 60 gün üçün slot yaratmalıdır | Must — parametr: slot_generation_days |
FR-702-18 | Slot Generation | Sistem cədvəl dəyişikliyini yalnız gələcək tarixlərə tətbiq etməlidir | Must |
FR-702-19 | Validation | Sistem üst-üstə düşən vaxt aralıqlarını bloklamalıdır | Must |
FR-702-20 | Validation | Sistem məntiqsiz vaxt daxiletməsini rədd etməlidir | Must — bitmə < başlama |
FR-702-21 | Validation | Sistem klinika saatından kənar cədvəl üçün xəbərdarlıq göstərməlidir | Must |
FR-702-22 | Validation | Sistem həkimin iki klinikada eyni vaxta slot açmasını bloklamalıdır | Must |
FR-702-23 | Conflict | Sistem cədvəl dəyişikliyində mövcud randevularla konflikti aşkarlamalıdır | Must |
FR-702-24 | Conflict | Sistem təsirlənən randevu sayını göstərməlidir | Must |
FR-702-25 | Conflict | Sistem randevusu olan slotun birbaşa silinməsini bloklamalıdır | Must |
FR-702-26 | Conflict | Sistem ləğv olunan randevular üçün pasientlərə bildiriş göndərməlidir | Must |
FR-702-27 | Audit | Sistem cədvəl dəyişikliklərini audit log-a yazmalıdır | Must |

### UC-703 — Doctor Appointment Management

ID | Category | Requirement | Comment |
FR-703-01 | List | Sistem həkimin randevularını tab-lar üzrə göstərməlidir | Must — bu gün / yaxınlaşan / təsdiq gözləyən / keçmiş |
FR-703-02 | List | Sistem bugünkü randevuları saat sırası ilə göstərməlidir | Must |
FR-703-03 | List | Sistem hər kartda pasient adı, saat, xidmət və statusu göstərməlidir | Must |
FR-703-04 | List | Sistem bir neçə klinikada işləyən həkim üçün klinikanı göstərməlidir | Must |
FR-703-05 | List | Sistem randevuları tarix, status və klinika üzrə filtrləməyə imkan verməlidir | Should |
FR-703-06 | List | Sistem təqvim görünüşü təqdim etməlidir | Should — həftəlik / aylıq |
FR-703-07 | List | Sistem günlük iş yükü icmalını göstərməlidir | Should |
FR-703-08 | Actions | Sistem manual rejimdə randevunu təsdiqləməyə imkan verməlidir | Must |
FR-703-09 | Actions | Sistem randevunu rədd etməyə imkan verməlidir | Must |
FR-703-10 | Actions | Sistem rədd səbəbini tələb etməlidir | Must |
FR-703-11 | Actions | Sistem rədd edilən randevunun slotunu dərhal boşaltmalıdır | Must |
FR-703-12 | Actions | Sistem randevunu tamamlamağa imkan verməlidir | Must |
FR-703-13 | Actions | Sistem no-show qeyd etməyə imkan verməlidir | Must |
FR-703-14 | Actions | Sistem resept yazma səhifəsinə keçid verməlidir | Must |
FR-703-15 | Actions | Sistem keçmiş randevunun təsdiqini bloklamalıdır | Must |
FR-703-16 | Patient Context | Sistem pasientin əsas məlumatlarını göstərməlidir | Must — ad, yaş, cins |
FR-703-17 | Patient Context | Sistem pasientin şikayət/qeydini göstərməlidir | Must |
FR-703-18 | Patient Context | Sistem pasientin allergiyalarını göstərməlidir | Must — klinik təhlükəsizlik |
FR-703-19 | Patient Context | Sistem paylaşılan sənədləri göstərməlidir | Must — yalnız icazəlilər |
FR-703-20 | Patient Context | Sistem həkimin özünün apardığı keçmiş randevuları göstərməlidir | Should |
FR-703-21 | Patient Context | Sistem müayinə qeydi yazmağa imkan verməlidir | Should |
FR-703-22 | Restrictions | Sistem başqa həkimin randevusuna girişi bloklamalıdır | Must |
FR-703-23 | Restrictions | Sistem pasientin başqa həkimlərdəki qeydlərini gizlətməlidir | Must — məxfilik |
FR-703-24 | Restrictions | Sistem həkim rəddinin pasient no-show statistikasına təsirini bloklamalıdır | Must |

## Modul 8 — Clinic Admin Panel

### UC-801 — Clinic Profile Management

ID | Category | Requirement | Comment |
FR-801-01 | Basic Info | Sistem klinika profil məlumatlarını göstərməlidir | Must |
FR-801-02 | Basic Info | Sistem Super Admin tərəfindən təyin edilmiş sahələri read-only göstərməlidir | Must — lisenziya, qeydiyyat, növ |
FR-801-03 | Basic Info | Sistem klinika təsvirini redaktə etməyə imkan verməlidir | Must |
FR-801-04 | Basic Info | Sistem əlaqə telefonu və email redaktə etməyə imkan verməlidir | Must |
FR-801-05 | Basic Info | Sistem ünvan və xəritə koordinatlarını dəqiqləşdirməyə imkan verməlidir | Must |
FR-801-06 | Basic Info | Sistem klinika loqosu yükləməyə imkan verməlidir | Should |
FR-801-07 | Basic Info | Sistem fotoqalereya idarə etməyə imkan verməlidir | Should |
FR-801-08 | Basic Info | Sistem fotoların sıralanmasına imkan verməlidir | Should |
FR-801-09 | Basic Info | Sistem qəbul edilən sığorta şirkətlərini seçməyə imkan verməlidir | Should |
FR-801-10 | Working Hours | Sistem iş saatlarını həftə günləri üzrə təyin etməyə imkan verməlidir | Must |
FR-801-11 | Working Hours | Sistem qeyri-iş günlərini işarələməyə imkan verməlidir | Must |
FR-801-12 | Working Hours | Sistem saatları bütün iş günlərinə kütləvi tətbiq etməyə imkan verməlidir | Should |
FR-801-13 | Working Hours | Sistem bayram günlərini təyin etməyə imkan verməlidir | Should |
FR-801-14 | Working Hours | Sistem bayram günlərində bütün həkim slotlarını bağlamalıdır | Must |
FR-801-15 | Working Hours | Sistem iş saatı dəyişikliyində həkim cədvəlləri ilə konflikti yoxlamalıdır | Must |
FR-801-16 | Clinic Status | Sistem klinikanı müvəqqəti bağlamağa imkan verməlidir | Should |
FR-801-17 | Clinic Status | Sistem bağlı klinikada yeni randevu qəbulunu dayandırmalıdır | Must |
FR-801-18 | Security | Sistem başqa klinikanın profilinə girişi bloklamalıdır | Must |
FR-801-19 | Update | Sistem dəyişiklikləri dərhal pasient tərəfində əks etdirməlidir | Must |
FR-801-20 | Audit | Sistem profil dəyişikliklərini audit log-a yazmalıdır | Must |

### UC-802 — Doctor Management

ID | Category | Requirement | Comment |
FR-802-01 | Onboarding | Sistem klinikaya həkim əlavə etməyə imkan verməlidir | Must |
FR-802-02 | Onboarding | Sistem FIN üzrə mövcud istifadəçini yoxlamalıdır | Must |
FR-802-03 | Onboarding | Sistem mövcud həkim üçün yalnız yeni klinika bağlantısı yaratmalıdır | Must |
FR-802-04 | Onboarding | Sistem lisenziya nömrəsi daxil etməyi tələb etməlidir | Must |
FR-802-05 | Onboarding | Sistem lisenziya nömrəsinin unikallığını yoxlamalıdır | Must |
FR-802-06 | Onboarding | Sistem lisenziyanın bitmə tarixini tələb etməlidir | Must |
FR-802-07 | Onboarding | Sistem keçmiş tarixli lisenziyanı qəbul etməməlidir | Must |
FR-802-08 | Onboarding | Sistem lisenziya və diplom sənədlərini yükləməyə imkan verməlidir | Must |
FR-802-09 | Onboarding | Sistem həkimin ixtisaslarını seçməyə imkan verməlidir | Must |
FR-802-10 | Onboarding | Sistem kabinet nömrəsi təyin etməyə imkan verməlidir | Should |
FR-802-11 | Invitation | Sistem həkimə dəvət SMS-i göndərməlidir | Must |
FR-802-12 | Invitation | Sistem dəvət linkinin etibarlılığını 7 gün ilə məhdudlaşdırmalıdır | Must — parametr: doctor_invite_validity_days |
FR-802-13 | Invitation | Sistem həkimdən SİMA doğrulaması tələb etməlidir | Must |
FR-802-14 | Invitation | Sistem dəvət qəbul edilmədən bağlantını aktivləşdirməməlidir | Must |
FR-802-15 | Invitation | Sistem dəvəti təkrar göndərməyə imkan verməlidir | Should |
FR-802-16 | Invitation | Sistem dəvət qəbul edildikdə admin-ə bildiriş göndərməlidir | Should |
FR-802-17 | Status | Sistem klinikadakı həkimləri siyahılamalıdır | Must |
FR-802-18 | Status | Sistem hər həkim üçün status və statistika göstərməlidir | Should |
FR-802-19 | Status | Sistem həkimi deaktivləşdirməyə imkan verməlidir | Must |
FR-802-20 | Status | Sistem passiv həkimi axtarışdan çıxarmalıdır | Must |
FR-802-21 | Status | Sistem passiv həkimin panelə girişini saxlamalıdır | Should |
FR-802-22 | Status | Sistem həkimi yenidən aktivləşdirməyə imkan verməlidir | Must |
FR-802-23 | Status | Sistem həkimi klinikadan çıxarmağa imkan verməlidir | Must |
FR-802-24 | Status | Sistem aktiv randevusu olan həkimin çıxarılmasını bloklamalıdır | Must |
FR-802-25 | License | Sistem lisenziya müddətini izləməlidir | Must |
FR-802-26 | License | Sistem lisenziya bitməsinə 30 gün qalmış xəbərdarlıq göndərməlidir | Should — parametr: license_expiry_warning_days |
FR-802-27 | License | Sistem lisenziyası bitən həkimi avtomatik dayandırmalıdır | Must |
FR-802-28 | License | Sistem lisenziyanın yenilənməsinə imkan verməlidir | Must |
FR-802-29 | Services | Sistem həkimin klinikada göstərəcəyi xidmətləri təyin etməyə imkan verməlidir | Must |
FR-802-30 | Restrictions | Sistem klinika admininin tibbi sənədlərə girişini bloklamalıdır | Must |
FR-802-31 | Restrictions | Sistem klinika admininin reseptlərə girişini bloklamalıdır | Must |
FR-802-32 | Audit | Sistem həkim əməliyyatlarını audit log-a yazmalıdır | Must |

### UC-803 — Admin Manages Doctor Schedule

ID | Category | Requirement | Comment |
FR-803-01 | Viewing | Sistem admin-ə həkimin cədvəlini göstərməlidir | Must — yalnız öz klinikası üzrə |
FR-803-02 | Viewing | Sistem slotları statusuna görə rəngləməlidir | Should — boş / tutulub / bağlı |
FR-803-03 | Viewing | Sistem randevusu olan slotda pasient adını göstərməlidir | Must |
FR-803-04 | Viewing | Sistem bütün həkimlərin cədvəlini bir ekranda göstərməlidir | Should — resurs planlaması |
FR-803-05 | Viewing | Sistem həkimin başqa klinikadakı cədvəlini göstərməməlidir | Must |
FR-803-06 | Editing | Sistem admin-ə cədvəli redaktə etməyə imkan verməlidir | Must |
FR-803-07 | Editing | Sistem konkret günü bağlamağa imkan verməlidir | Must — həkim xəstələndikdə |
FR-803-08 | Editing | Sistem həkim üçün məzuniyyət təyin etməyə imkan verməlidir | Should |
FR-803-09 | Conflict | Sistem təsirlənən randevuları siyahılamalıdır | Must |
FR-803-10 | Conflict | Sistem hər randevu üçün qərar seçimi təqdim etməlidir | Must — ləğv et / köçür |
FR-803-11 | Conflict | Sistem randevuları başqa həkimə köçürməyə imkan verməlidir | Should — eyni ixtisas |
FR-803-12 | Conflict | Sistem köçürmədə pasient təsdiqi tələb etməlidir | Should |
FR-803-13 | Conflict | Sistem kabinet konfliktində xəbərdarlıq göstərməlidir | Should |
FR-803-14 | Notification | Sistem cədvəl dəyişikliyində həkimə bildiriş göndərməlidir | Must |
FR-803-15 | Notification | Sistem təsirlənən pasientlərə bildiriş göndərməlidir | Must |
FR-803-16 | Audit | Sistem dəyişikliyi edən admin-in ID-sini qeyd etməlidir | Must |

### UC-804 — Services Management

ID | Category | Requirement | Comment |
FR-804-01 | Service Mgmt | Sistem klinikanın xidmətlərini siyahılamalıdır | Must |
FR-804-02 | Service Mgmt | Sistem mərkəzi kataloqdan xidmət seçməyə imkan verməlidir | Must |
FR-804-03 | Service Mgmt | Sistem kataloqdan kənar xidmət əlavə edilməsini bloklamalıdır | Must |
FR-804-04 | Service Mgmt | Sistem yeni xidmət üçün Super Admin-ə tələb göndərməyə imkan verməlidir | Should |
FR-804-05 | Service Mgmt | Sistem xidməti həkimlərə bağlamağa imkan verməlidir | Must |
FR-804-06 | Service Mgmt | Sistem həkimsiz xidmətin saxlanmasını bloklamalıdır | Must |
FR-804-07 | Service Mgmt | Sistem xidməti deaktivləşdirməyə imkan verməlidir | Should |
FR-804-08 | Service Mgmt | Sistem xidməti silməyə imkan verməlidir | Should |
FR-804-09 | Service Mgmt | Sistem aktiv randevusu olan xidmətin silinməsini bloklamalıdır | Must |
FR-804-10 | Service Mgmt | Sistem xidmətləri kateqoriya üzrə qruplaşdırmalıdır | Should |
FR-804-11 | Duration | Sistem xidmət müddətini təyin etməyə imkan verməlidir | Must |
FR-804-12 | Duration | Sistem xidmət müddətini slot planlaşdırmasında istifadə etməlidir | Must |
FR-804-13 | Duration | Sistem müddət slot müddətindən çox olduqda xəbərdarlıq göstərməlidir | Should |
FR-804-14 | Duration | Sistem müddət dəyişikliyini mövcud randevulara tətbiq etməməlidir | Must |
FR-804-15 | Validation | Sistem ixtisasla uyğun gəlməyən xidmət üçün xəbərdarlıq göstərməlidir | Should |
FR-804-16 | Pricing | Sistem platformada qiymət sahəsi təqdim etməməlidir | Must — dəyər klinikada müəyyən edilir |

### UC-805 — Appointment Oversight & Reports

ID | Category | Requirement | Comment |
FR-805-01 | Oversight | Sistem klinikadakı bütün randevuları göstərməlidir | Must |
FR-805-02 | Oversight | Sistem hər randevu üçün booking reference, pasient, həkim, tarix və statusu göstərməlidir | Must |
FR-805-03 | Oversight | Sistem tibbi məzmunu göstərməməlidir | Must — şikayət, diaqnoz, resept, sənəd |
FR-805-04 | Oversight | Sistem tibbi məzmuna giriş cəhdini bloklamalı və log-a yazmalıdır | Must |
FR-805-05 | Oversight | Sistem randevuları tarix aralığı üzrə filtrləməyə imkan verməlidir | Must |
FR-805-06 | Oversight | Sistem randevuları həkim üzrə filtrləməyə imkan verməlidir | Must |
FR-805-07 | Oversight | Sistem randevuları status və xidmət üzrə filtrləməyə imkan verməlidir | Should |
FR-805-08 | Oversight | Sistem başqa klinikanın randevularına girişi bloklamalıdır | Must |
FR-805-09 | Actions | Sistem admin-ə randevunu ləğv etməyə imkan verməlidir | Must |
FR-805-10 | Actions | Sistem admin-ə randevunun vaxtını dəyişməyə imkan verməlidir | Should |
FR-805-11 | Actions | Sistem admin-ə no-show işarələməyə imkan verməlidir | Should |
FR-805-12 | Actions | Sistem toplu ləğv imkanı verməlidir | Should |
FR-805-13 | Reports | Sistem gündəlik randevu icmalını göstərməlidir | Should |
FR-805-14 | Reports | Sistem həkim üzrə statistika göstərməlidir | Should — randevu sayı, tamamlanma, no-show |
FR-805-15 | Reports | Sistem no-show analizini göstərməlidir | Should |
FR-805-16 | Reports | Sistem saat və gün üzrə yük analizini göstərməlidir | Should |
FR-805-17 | Reports | Sistem hesabatları Excel formatında export etməyə imkan verməlidir | Should |
FR-805-18 | Reports | Sistem hesabatları PDF formatında export etməyə imkan verməlidir | Should |
FR-805-19 | Audit | Sistem admin əməliyyatlarını audit log-a yazmalıdır | Must |

## Modul 9 — Super Admin Panel

### UC-901 — Clinic Onboarding & Verification

ID | Category | Requirement | Comment |
FR-901-01 | Clinic Creation | Sistem Super Admin-ə klinika əlavə etməyə imkan verməlidir | Must |
FR-901-02 | Clinic Creation | Sistem klinikanın özbaşına qeydiyyatını bloklamalıdır | Must — yalnız Super Admin əlavə edir |
FR-901-03 | Clinic Creation | Sistem klinika adı, növü və ünvanını daxil etməyi tələb etməlidir | Must |
FR-901-04 | Clinic Creation | Sistem rəsmi qeydiyyat nömrəsini daxil etməyi tələb etməlidir | Must |
FR-901-05 | Clinic Creation | Sistem qeydiyyat nömrəsinin unikallığını yoxlamalıdır | Must — bir nömrə = bir klinika |
FR-901-06 | Clinic Creation | Sistem fəaliyyət lisenziyasının nömrəsini daxil etməyi tələb etməlidir | Must |
FR-901-07 | Clinic Creation | Sistem lisenziyanın bitmə tarixini daxil etməyi tələb etməlidir | Must |
FR-901-08 | Clinic Creation | Sistem keçmiş tarixli lisenziyanı qəbul etməməlidir | Must |
FR-901-09 | Clinic Creation | Sistem rəsmi sənədləri yükləməyə imkan verməlidir | Must — qeydiyyat şəhadətnaməsi, lisenziya, müqavilə |
FR-901-10 | Clinic Creation | Sistem klinika növü təyin etməyə imkan verməlidir | Must |
FR-901-11 | Clinic Creation | Sistem xəritə koordinatlarını daxil etməyə imkan verməlidir | Should |
FR-901-12 | Verification | Sistem klinika statusunu idarə etməyə imkan verməlidir | Must — gözləyir / aktiv / dayandırılıb / deaktiv |
FR-901-13 | Verification | Sistem yüklənmiş sənədləri baxış üçün göstərməlidir | Must |
FR-901-14 | Verification | Sistem verifikasiya edilməmiş klinikanı platformada göstərməməlidir | Must |
FR-901-15 | Verification | Sistem müraciəti rədd etməyə və səbəb qeyd etməyə imkan verməlidir | Must |
FR-901-16 | Verification | Sistem əlavə sənəd tələb etməyə imkan verməlidir | Should |
FR-901-17 | Verification | Sistem verifikasiya edən admin-i və tarixi qeyd etməlidir | Must |
FR-901-18 | Admin Assignment | Sistem klinika admini hesabı yaratmağa imkan verməlidir | Must |
FR-901-19 | Admin Assignment | Sistem admin-ə dəvət SMS-i göndərməlidir | Must |
FR-901-20 | Admin Assignment | Sistem klinika adminindən SİMA doğrulaması tələb etməlidir | Must |
FR-901-21 | Admin Assignment | Sistem admin-in klinika sərhədini təyin etməlidir | Must — yalnız öz klinikası |
FR-901-22 | Admin Assignment | Sistem bir klinikaya bir neçə admin təyin etməyə imkan verməlidir | Should |
FR-901-23 | Admin Assignment | Sistem rol konflikti halında xəbərdarlıq göstərməlidir | Should |
FR-901-24 | Lifecycle | Sistem klinikanı müvəqqəti dayandırmağa imkan verməlidir | Must |
FR-901-25 | Lifecycle | Sistem dayandırılmış klinikanın həkimlərini axtarışdan çıxarmalıdır | Must |
FR-901-26 | Lifecycle | Sistem klinikanı deaktivləşdirməyə imkan verməlidir | Must |
FR-901-27 | Lifecycle | Sistem aktiv randevusu olan klinikanın deaktivləşdirilməsini bloklamalıdır | Must |
FR-901-28 | License | Sistem klinika lisenziyalarını gündəlik yoxlamalıdır | Must — scheduled job |
FR-901-29 | License | Sistem lisenziyası bitən klinikanı avtomatik dayandırmalıdır | Must |
FR-901-30 | License | Sistem lisenziya bitməsinə 30 gün qalmış xəbərdarlıq göndərməlidir | Should — parametr: license_expiry_warning_days |
FR-901-31 | License | Sistem lisenziyanın yenilənməsinə imkan verməlidir | Must |
FR-901-32 | Listing | Sistem bütün klinikaları siyahılamalıdır | Must |
FR-901-33 | Listing | Sistem klinikaları status, şəhər və növ üzrə filtrləməyə imkan verməlidir | Should |
FR-901-34 | Audit | Sistem bütün verifikasiya qərarlarını audit log-a yazmalıdır | Must |

### UC-902 — User Management

ID | Category | Requirement | Comment |
FR-902-01 | Listing | Sistem bütün istifadəçiləri siyahılamalıdır | Must |
FR-902-02 | Listing | Sistem hər istifadəçi üçün ad, rol, status və son girişi göstərməlidir | Must |
FR-902-03 | Listing | Sistem istifadəçiləri rol üzrə filtrləməyə imkan verməlidir | Must |
FR-902-04 | Listing | Sistem istifadəçiləri status və klinika üzrə filtrləməyə imkan verməlidir | Should |
FR-902-05 | Search | Sistem FIN üzrə istifadəçi axtarışına imkan verməlidir | Must — dəstək müraciətləri üçün |
FR-902-06 | Search | Sistem telefon nömrəsi üzrə axtarışa imkan verməlidir | Must |
FR-902-07 | Search | Sistem ad üzrə axtarışa imkan verməlidir | Should |
FR-902-08 | Details | Sistem hesab detallarını göstərməlidir | Must — profil, rol, status, qeydiyyat tarixi |
FR-902-09 | Details | Sistem aktiv sessiyaları göstərməlidir | Should |
FR-902-10 | Details | Sistem istifadəçinin audit tarixçəsini göstərməlidir | Should |
FR-902-11 | Details | Sistem randevu statistikasını göstərməlidir | Should |
FR-902-12 | Restrictions | Sistem Super Admin-ə tibbi məzmunu göstərməməlidir | Must — sənəd, resept, diaqnoz |
FR-902-13 | Restrictions | Sistem tibbi məzmuna giriş cəhdini bloklamalı və log-a yazmalıdır | Must |
FR-902-14 | Actions | Sistem hesabı bloklamağa imkan verməlidir | Must |
FR-902-15 | Actions | Sistem blokdan çıxarmağa imkan verməlidir | Must |
FR-902-16 | Actions | Sistem hər əməliyyat üçün səbəb tələb etməlidir | Must |
FR-902-17 | Actions | Sistem bloklama zamanı bütün aktiv sessiyaları bağlamalıdır | Must |
FR-902-18 | Actions | Sistem istifadəçiyə status dəyişikliyi bildirişi göndərməlidir | Must |
FR-902-19 | Actions | Sistem məcburi sessiya bağlamağa imkan verməlidir | Should — şübhəli fəaliyyət halında |
FR-902-20 | Actions | Sistem hesabın silinmə tələbini emal etməyə imkan verməlidir | Should |
FR-902-21 | Actions | Sistem silinən hesabın tibbi məlumatlarını qanunvericiliyə uyğun saxlamalıdır | Must — anonimləşdirmə |
FR-902-22 | Safeguards | Sistem aktiv randevusu olan həkimin bloklanmasında xəbərdarlıq göstərməlidir | Must |
FR-902-23 | Safeguards | Sistem yeganə klinika admininin bloklanmasında xəbərdarlıq göstərməlidir | Should |
FR-902-24 | Safeguards | Sistem Super Admin-in öz hesabını bloklamasını qadağan etməlidir | Must — sistem kilidlənməsinin qarşısı |
FR-902-25 | Safeguards | Sistem rol dəyişikliyində konflikt yoxlaması aparmalıdır | Should |
FR-902-26 | Audit | Sistem bütün admin əməliyyatlarını audit log-a yazmalıdır | Must |

### UC-903 — Content Moderation

ID | Category | Requirement | Comment |
FR-903-01 | Queue | Sistem moderasiya gözləyən rəyləri siyahılamalıdır | Must |
FR-903-02 | Queue | Sistem növbəni status üzrə qruplaşdırmalıdır | Must — gözləyən / şikayət edilmiş / rədd edilmiş |
FR-903-03 | Queue | Sistem hər rəy üçün mətn, reytinq, həkim və tarixi göstərməlidir | Must |
FR-903-04 | Queue | Sistem avtomatik filtr nəticəsini göstərməlidir | Should |
FR-903-05 | Queue | Sistem boş növbə üçün empty state göstərməlidir | Should |
FR-903-06 | Decision | Sistem rəyi təsdiqləməyə imkan verməlidir | Must |
FR-903-07 | Decision | Sistem rəyi rədd etməyə imkan verməlidir | Must |
FR-903-08 | Decision | Sistem rədd səbəbini tələb etməlidir | Must |
FR-903-09 | Decision | Sistem toplu təsdiq imkanı verməlidir | Should — filtrdən təmiz keçənlər üçün |
FR-903-10 | Decision | Sistem dərc olunmuş rəyi geri çəkməyə imkan verməlidir | Should |
FR-903-11 | Decision | Sistem həkim cavablarını da moderasiyadan keçirməlidir | Must |
FR-903-12 | Decision | Sistem şikayət edilmiş rəyi təkrar baxışa çıxarmalıdır | Must |
FR-903-13 | Filtering | Sistem təhqiredici məzmunu avtomatik aşkarlamalıdır | Must |
FR-903-14 | Filtering | Sistem spam məzmunu avtomatik aşkarlamalıdır | Should |
FR-903-15 | Filtering | Sistem rəydə şəxsi məlumatı aşkarlamalıdır | Must — telefon, FIN |
FR-903-16 | Filtering | Sistem rəydə həssas tibbi detal üçün xəbərdarlıq verməlidir | Should — məxfilik riski |
FR-903-17 | Filtering | Sistem filtr qaydalarını konfiqurasiya etməyə imkan verməlidir | Should |
FR-903-18 | Post-Decision | Sistem təsdiqlənən rəyi dərc etməlidir | Must |
FR-903-19 | Post-Decision | Sistem həkimin ümumi reytinqini yenidən hesablamalıdır | Must |
FR-903-20 | Post-Decision | Sistem klinikanın reytinqini yenidən hesablamalıdır | Must |
FR-903-21 | Post-Decision | Sistem pasientə moderasiya nəticəsini bildirməlidir | Should |
FR-903-22 | Post-Decision | Sistem həkimə yeni dərc olunmuş rəy barədə bildiriş göndərməlidir | Should |
FR-903-23 | Audit | Sistem moderasiya qərarlarını audit log-a yazmalıdır | Must |

### UC-904 — System Configuration & Audit

ID | Category | Requirement | Comment |
FR-904-01 | Settings | Sistem sistem parametrlərini kateqoriyalar üzrə göstərməlidir | Must |
FR-904-02 | Settings | Sistem parametrləri bazada saxlamalıdır | Must — kod dəyişikliyi tələb olunmasın |
FR-904-03 | Settings | Sistem parametr dəyərini dəyişməyə imkan verməlidir | Must |
FR-904-04 | Settings | Sistem məntiqsiz parametr dəyərini rədd etməlidir | Must |
FR-904-05 | Settings | Sistem kritik parametr dəyişikliyində əlavə təsdiq tələb etməlidir | Must — təhlükəsizlik parametrləri |
FR-904-06 | Settings | Sistem yeni parametr dəyərini dərhal tətbiq etməlidir | Must |
FR-904-07 | Settings | Sistem parametr dəyişiklik tarixçəsini saxlamalıdır | Should |
FR-904-08 | Catalog | Sistem xidmət kataloqunu idarə etməyə imkan verməlidir | Must |
FR-904-09 | Catalog | Sistem ixtisas siyahısını idarə etməyə imkan verməlidir | Must |
FR-904-10 | Catalog | Sistem dərman kataloqunu idarə etməyə imkan verməlidir | Must |
FR-904-11 | Catalog | Sistem dərman qarşılıqlı təsir bazasını yeniləməyə imkan verməlidir | Must — resept təhlükəsizliyi |
FR-904-12 | Catalog | Sistem nəzarətdə olan dərmanları işarələməyə imkan verməlidir | Must |
FR-904-13 | Catalog | Sistem aktiv istifadə olunan kataloq elementinin silinməsini bloklamalıdır | Must |
FR-904-14 | Catalog | Sistem elementi hansı klinikaların istifadə etdiyini göstərməlidir | Should |
FR-904-15 | Templates | Sistem bildiriş şablonlarını idarə etməyə imkan verməlidir | Must |
FR-904-16 | Templates | Sistem şablonları hər dil üçün ayrıca saxlamalıdır | Must — AZ / RU / EN |
FR-904-17 | Audit Log | Sistem bütün sistem əməliyyatlarını qeyd etməlidir | Must |
FR-904-18 | Audit Log | Sistem audit log-un dəyişdirilməsini qadağan etməlidir | Must — immutable, append-only |
FR-904-19 | Audit Log | Sistem audit log-u filtrləməyə imkan verməlidir | Must — istifadəçi, əməliyyat, tarix, obyekt |
FR-904-20 | Audit Log | Sistem audit log-u export etməyə imkan verməlidir | Should |
FR-904-21 | Audit Log | Sistem audit log-u qanunvericiliyə uyğun müddət saxlamalıdır | Must |
FR-904-22 | Monitoring | Sistem platforma statistikasını göstərməlidir | Should — istifadəçi, klinika, həkim, randevu sayı |
FR-904-23 | Monitoring | Sistem uğursuz giriş cəhdlərini izləməlidir | Must |
FR-904-24 | Monitoring | Sistem icazəsiz giriş cəhdlərini izləməlidir | Must |
FR-904-25 | Monitoring | Sistem şübhəli fəaliyyət üçün xəbərdarlıq verməlidir | Should |

## Modul 10 — Notifications

### UC-1001 — Notification Delivery

ID | Category | Requirement | Comment |
FR-1001-01 | Generation | Sistem bildirişləri hadisə əsasında avtomatik yaratmalıdır | Must — event-driven |
FR-1001-02 | Generation | Sistem hadisə növünə uyğun şablon seçməlidir | Must |
FR-1001-03 | Generation | Sistem şablonu dinamik məlumatlarla doldurmalıdır | Must — ad, tarix, saat, həkim, klinika |
FR-1001-04 | Generation | Sistem bildirişi istifadəçinin seçdiyi dildə göndərməlidir | Must |
FR-1001-05 | Generation | Sistem bildirişləri növbə (queue) vasitəsilə emal etməlidir | Must |
FR-1001-06 | Generation | Sistem şablon tapılmadıqda default şablon istifadə etməli və xəta log-a yazmalıdır | Should |
FR-1001-07 | Privacy | Sistem bildirişlərdə həssas tibbi məlumatı göstərməməlidir | Must — diaqnoz, dərman adı, analiz nəticəsi |
FR-1001-08 | Privacy | Sistem göndərmədən əvvəl məzmunu məxfilik baxımından yoxlamalıdır | Must |
FR-1001-09 | Scheduling | Sistem randevu yaradıldıqda xatırlatmaları planlaşdırmalıdır | Must |
FR-1001-10 | Scheduling | Sistem randevudan 24 saat əvvəl xatırlatma göndərməlidir | Must — parametr: reminder_first_hours |
FR-1001-11 | Scheduling | Sistem randevudan 2 saat əvvəl xatırlatma göndərməlidir | Should — parametr: reminder_second_hours |
FR-1001-12 | Scheduling | Sistem xatırlatma göndərmədən əvvəl randevunun aktiv olduğunu yoxlamalıdır | Must |
FR-1001-13 | Scheduling | Sistem ləğv edilmiş randevu üçün xatırlatma göndərməməlidir | Must |
FR-1001-14 | Scheduling | Sistem vaxt dəyişikliyində xatırlatmaları yenidən planlaşdırmalıdır | Must |
FR-1001-15 | Channels | Sistem SMS kanalı ilə bildiriş göndərməlidir | Must |
FR-1001-16 | Channels | Sistem push notification göndərməlidir | Should |
FR-1001-17 | Channels | Sistem email göndərməlidir | Should |
FR-1001-18 | Channels | Sistem tətbiqdaxili bildiriş mərkəzi təqdim etməlidir | Must |
FR-1001-19 | Channels | Sistem kritik bildirişləri çoxkanallı göndərməlidir | Must |
FR-1001-20 | Channels | Sistem bir kanal uğursuz olduqda alternativ kanal sınamalıdır | Must |
FR-1001-21 | Channels | Sistem bütün kanallar uğursuz olduqda bildirişi tətbiqdaxili saxlamalıdır | Must |
FR-1001-22 | Channels | Sistem bildirişdə deep link təqdim etməlidir | Should — birbaşa müvafiq ekrana |
FR-1001-23 | Delivery | Sistem çatdırılma statusunu izləməlidir | Must — queued / sent / delivered / failed |
FR-1001-24 | Delivery | Sistem uğursuz göndərmə üçün retry tətbiq etməlidir | Should |
FR-1001-25 | Delivery | Sistem toplu bildirişi fərdiləşdirilmiş məzmunla göndərməlidir | Must — hər pasientə ayrıca |
FR-1001-26 | Preferences | Sistem istifadəçiyə bildiriş kanallarını seçməyə imkan verməlidir | Should |
FR-1001-27 | Preferences | Sistem bildiriş növlərini ayrıca idarə etməyə imkan verməlidir | Should |
FR-1001-28 | Preferences | Sistem kritik bildirişlərin söndürülməsinə icazə verməməlidir | Must — randevu, təhlükəsizlik |
FR-1001-29 | Center | Sistem bildiriş mərkəzində bütün bildirişləri göstərməlidir | Must |
FR-1001-30 | Center | Sistem oxunmuş / oxunmamış statusunu idarə etməlidir | Should |
FR-1001-31 | Center | Sistem oxunmamış bildiriş sayını göstərməlidir | Should |
FR-1001-32 | Center | Sistem bildirişi silməyə imkan verməlidir | Should |
FR-1001-33 | Rate Limiting | Sistem qısa müddətdə çoxlu bildirişi qruplaşdırmalı və ya gecikdirməlidir | Should — spam qarşısı |
FR-1001-34 | Rate Limiting | Sistem gecə saatlarında kritik olmayan bildirişləri gecikdirməlidir | Should — 23:00–08:00 |
FR-1001-35 | Resilience | Sistem bildiriş servisi işləmədikdə əsas prosesləri dayandırmamalıdır | Must — bloklayıcı asılılıq olmamalıdır |
FR-1001-36 | Audit | Sistem bütün göndərilən bildirişləri log-a yazmalıdır | Must |

## Modul 11 — Feedback & Rating

### UC-1101 — Submit Review

ID | Category | Requirement | Comment |
FR-1101-01 | Eligibility | Sistem rəy yazmağa yalnız tamamlanmış randevudan sonra icazə verməlidir | Must — saxta rəyin qarşısı |
FR-1101-02 | Eligibility | Sistem bir randevu üçün yalnız bir rəyə icazə verməlidir | Must |
FR-1101-03 | Eligibility | Sistem rəy yazma müddətini 30 gün ilə məhdudlaşdırmalıdır | Must — parametr: review_window_days |
FR-1101-04 | Eligibility | Sistem no-show randevu üçün rəy yazılmasını bloklamalıdır | Must |
FR-1101-05 | Eligibility | Sistem başqasının randevusuna rəy yazılmasını bloklamalıdır | Must |
FR-1101-06 | Submission | Sistem 1–5 ulduz reytinq seçməyə imkan verməlidir | Must |
FR-1101-07 | Submission | Sistem ulduz reytinqi olmadan rəyin göndərilməsini bloklamalıdır | Must |
FR-1101-08 | Submission | Sistem alt kateqoriyalar üzrə reytinq verməyə imkan verməlidir | Should — peşəkarlıq, münasibət, gözləmə vaxtı |
FR-1101-09 | Submission | Sistem yazılı rəy daxil etməyə imkan verməlidir | Should — məcburi deyil |
FR-1101-10 | Submission | Sistem rəyi anonim göndərməyə imkan verməlidir | Should |
FR-1101-11 | Submission | Sistem anonim rəydə də müəllifi sistem daxilində qeyd etməlidir | Must — sui-istifadə araşdırması üçün |
FR-1101-12 | Submission | Sistem mətn uzunluğunu validasiya etməlidir | Should |
FR-1101-13 | Invitation | Sistem randevu tamamlandıqdan sonra rəy dəvəti göndərməlidir | Should — 2 saat sonra |
FR-1101-14 | Invitation | Sistem rəy yazılmadıqda bir dəfə xatırlatma göndərməlidir | Should — 3 gün sonra, təkrarlanmır |
FR-1101-15 | Editing | Sistem rəyi 24 saat ərzində redaktə etməyə imkan verməlidir | Should — parametr: review_edit_hours |
FR-1101-16 | Editing | Sistem redaktə edilmiş rəyi yenidən moderasiyaya göndərməlidir | Must |
FR-1101-17 | Moderation | Sistem bütün rəyləri dərcdən əvvəl moderasiyaya göndərməlidir | Must |
FR-1101-18 | Moderation | Sistem rəyi avtomatik məzmun filtrindən keçirməlidir | Must |
FR-1101-19 | Moderation | Sistem rəydə şəxsi məlumat aşkarladıqda işarələməlidir | Must |
FR-1101-20 | Moderation | Sistem pasientə rəyin moderasiya statusunu göstərməlidir | Should |
FR-1101-21 | Rating Calc | Sistem həkimin ümumi reytinqini avtomatik hesablamalıdır | Must |
FR-1101-22 | Rating Calc | Sistem reytinqi yalnız dərc olunmuş rəylərdən hesablamalıdır | Must |
FR-1101-23 | Rating Calc | Sistem klinika reytinqini həkim reytinqlərindən hesablamalıdır | Must |
FR-1101-24 | Rating Calc | Sistem rəyi olmayan həkim üçün "Yeni həkim" etiketi göstərməlidir | Should — sıfır reytinq göstərilmir |
FR-1101-25 | Display | Sistem rəyləri həkim profilində göstərməlidir | Must |
FR-1101-26 | Display | Sistem reytinq paylanmasını göstərməlidir | Should |
FR-1101-27 | Display | Sistem rəyləri tarix və reytinq üzrə çeşidləməyə imkan verməlidir | Should |
FR-1101-28 | Display | Sistem rəy sayını göstərməlidir | Must |
FR-1101-29 | Doctor Reply | Sistem həkimə rəyə cavab yazmağa imkan verməlidir | Should |
FR-1101-30 | Doctor Reply | Sistem həkim cavabını moderasiyadan keçirməlidir | Must |
FR-1101-31 | Anti-Fraud | Sistem həkimin öz rəyini silməsini bloklamalıdır | Must — reytinq manipulyasiyasının qarşısı |
FR-1101-32 | Anti-Fraud | Sistem həkimin rəyi dəyişdirməsini bloklamalıdır | Must |
FR-1101-33 | Anti-Fraud | Sistem həkimə uyğunsuz rəyi şikayət etməyə imkan verməlidir | Should |
FR-1101-34 | Anti-Fraud | Sistem klinika admininin rəylərə müdaxiləsini bloklamalıdır | Must |
FR-1101-35 | Audit | Sistem bütün rəy əməliyyatlarını audit log-a yazmalıdır | Must |

# Non-Functional Requirenments

## Security (Təhlükəsizlik)

ID | Category | Requirement | Comment |
NFR-01 | Data in Transit | Bütün şəbəkə trafiki TLS 1.2 və ya daha yuxarı versiya ilə şifrələnməlidir | Must |
NFR-02 | Data at Rest | Tibbi sənədlər serverdə AES-256 ilə şifrələnmiş saxlanılmalıdır | Must |
NFR-03 | Credentials | PIN kodlar hash alqoritmi ilə saxlanılmalı, açıq mətn saxlanmamalıdır | Must — bcrypt və ya analoji |
NFR-04 | Access Control | Sistem rola əsaslanan giriş nəzarəti (RBAC) tətbiq etməlidir | Must — 5 rol |
NFR-05 | File Access | Fayllara giriş yalnız müddətli signed URL vasitəsilə mümkün olmalıdır | Must |
NFR-06 | Brute Force | Sistem ardıcıl uğursuz giriş cəhdlərini limitləməlidir | Must — 5 cəhd, 30 dəqiqə bloklama |
NFR-07 | Integration | SİMA callback cavablarının rəqəmsal imzası yoxlanılmalıdır | Must — saxta cavabın qarşısı |
NFR-08 | Malware | Yüklənən hər fayl antivirus skanından keçməlidir | Must |
NFR-09 | Session | Sessiya fəaliyyətsizlik halında avtomatik bağlanmalıdır | Must — 15 dəqiqə |

## Privacy & Compliance (Məxfilik və uyğunluq)

ID | Category | Requirement | Comment |
NFR-10 | Consent | Tibbi məlumatların emalı üçün istifadəçidən açıq razılıq alınmalıdır | Must — qanuni tələb |
NFR-11 | Data Ownership | Tibbi sənədlər pasientin mülkiyyəti sayılmalı, giriş yalnız onun icazəsi ilə verilməlidir | Must |
NFR-12 | Admin Isolation | Klinika admini və Super Admin tibbi məzmuna giriş edə bilməməlidir | Must — yalnız metadata |
NFR-13 | Audit Trail | Tibbi məlumatlara hər giriş audit log-a yazılmalıdır | Must |
NFR-14 | Immutability | Audit log dəyişdirilə bilməməlidir | Must — append-only |
NFR-15 | Notifications | Bildirişlərdə həssas tibbi məlumat göstərilməməlidir | Must — kilidli ekranda görünür |
NFR-16 | Legislation | Platforma Azərbaycan Respublikasının şəxsi məlumatların mühafizəsi qanunvericiliyinə uyğun olmalıdır | Must |
NFR-17 | Retention | Tibbi məlumatlar qanunvericiliyin tələb etdiyi müddət saxlanılmalıdır | Must — hesab silinsə belə |

## Performance (Performans)

ID | Category | Requirement | Comment |
NFR-18 | Page Load | Səhifələr 3 saniyədən az müddətdə yüklənməlidir | Should — standart internet sürətində |
NFR-19 | Search | Axtarış nəticələri 2 saniyədən az müddətdə qaytarılmalıdır | Should |
NFR-20 | Slot Update | Boş slotların statusu 1 saniyə ərzində yenilənməlidir | Must — double-booking riski |
NFR-21 | Concurrency | Sistem eyni anda minimum 1000 aktiv istifadəçini dəstəkləməlidir | Should — MVP hədəfi |
NFR-22 | Async Processing | Bildiriş göndərilməsi əsas əməliyyatı bloklamamalıdır | Must — asinxron emal |

## Availability & Reliability (Əlçatanlıq və etibarlılıq)

ID | Category | Requirement | Comment |
NFR-23 | Uptime | Platformanın illik əlçatanlığı minimum 99.5% olmalıdır | Should |
NFR-24 | Backup | Verilənlər bazasının ehtiyat nüsxəsi gündəlik alınmalıdır | Must |
NFR-25 | Recovery | Sistem nasazlıqdan sonra 4 saat ərzində bərpa olunmalıdır | Should — RTO: 4 saat |
NFR-26 | Data Loss | Maksimum məlumat itkisi 1 saatı keçməməlidir | Should — RPO: 1 saat |
NFR-27 | Graceful Degradation | Xarici servis (SMS, SİMA) işləmədikdə sistem tam dayanmamalıdır | Must — xəta mesajı göstərilir |

## Usability & Accessibility (İstifadə rahatlığı)

ID | Category | Requirement | Comment |
NFR-28 | Language | İnterfeys Azərbaycan, rus və ingilis dillərini dəstəkləməlidir | Should — AZ məcburi |
NFR-29 | Responsive | İnterfeys mobil, planşet və masaüstü ekranlara uyğunlaşmalıdır | Must |
NFR-30 | Accessibility | İnterfeys WCAG 2.1 AA standartına uyğun olmalıdır | Should |
NFR-31 | Booking Flow | Randevu prosesi maksimum 5 addımda tamamlanmalıdır | Should — sadəlik hədəfi |
NFR-32 | Error Messages | Xəta mesajları istifadəçi dilində və başa düşülən olmalıdır | Must — texniki kod göstərilmir |
NFR-33 | Browser Support | Platforma müasir brauzerlərin son iki versiyasını dəstəkləməlidir | Should — Chrome, Safari, Firefox, Edge |

## Maintainability & Scalability (Dəstək və genişlənmə)

D | Category | Requirement | Comment |
NFR-34 | Configuration | Sistem parametrləri kodda deyil, bazada saxlanılmalıdır | Must — dəyişiklik üçün deploy tələb olunmasın |
NFR-35 | Logging | Sistem xətaları araşdırma üçün kifayət qədər detalla log-lanmalıdır | Must |
NFR-36 | Extensibility | Arxitektura Phase 2 funksiyalarına (mobil tətbiq, telemedicine, aptek) uyğunlaşa bilməlidir | Should |
NFR-37 | API Design | API REST prinsiplərinə uyğun və sənədləşdirilmiş olmalıdır | Must |

# Base URL və versiyalaşdırma, Technical Part

Base URL | https://api.mediconnect.az |
API versiyası | /v1 — API-nin birinci versiyası. Uyğunsuz dəyişikliklərdə /v2 yaradılır. |
Protokol | REST over HTTPS (TLS 1.2+). Bütün sorğular şifrələnmiş kanaldan keçir. |
Format | JSON (Content-Type: application/json) |
Autentifikasiya | Bearer token (JWT). Token Authorization header-ində göndərilir. |
Swagger link | TBD — development mühiti hazır olduqdan sonra əlavə ediləcək |

## Parameters

### Qeydiyyat ekranı (UC-101 → /register)

Sn | UI Parameter Name | API Parameter Name | Validation | Required | Editable | Data Source | Example |
1 | Telefon nömrəsi | mobileNumber | String; format: +994XXXXXXXXX; uzunluq: 13 simvol; yalnız rəqəm (+ istisna); boşluq olmaz | Yes | Yes | User input | +994501234567 |
2 | FIN | pin | String; uzunluq: 7 simvol; hərf və rəqəm; böyük hərf; xüsusi simvol olmaz | Yes | Yes | User input | 5AB7CD2 |
3 | OTP kodu | otpCode | String; uzunluq: 6 simvol; yalnız rəqəm; etibarlılıq: 120 saniyə | Yes | Yes | SMS Gateway | 483921 |
4 | PIN kod | userPin | String; uzunluq: 4 simvol; yalnız rəqəm; sadə kombinasiya qadağan (1111, 1234, 0000) | Yes | Yes | User input | 8352 |
5 | PIN təkrar | userPinConfirm | String; userPin ilə eyni olmalıdır | Yes | Yes | User input | 8352 |
6 | Ad | firstName | String; max 50 simvol; yalnız hərf | Yes | No | SİMA callback | Fuad |
7 | Soyad | lastName | String; max 50 simvol; yalnız hərf | Yes | No | SİMA callback | İbrahimov |
8 | Doğum tarixi | birthDate | Date; format: YYYY-MM-DD; keçmiş tarix olmalıdır | Yes | No | SİMA callback | 1998-04-17 |
9 | Cins | gender | Enum; dəyərlər: MALE, FEMALE | Yes | No | SİMA callback | MALE |
10 | Razılıq | medicalConsent | Boolean; true olmalıdır | Yes | Yes | User input | true |

### Randevu yaratma ekranı (UC-401 → /booking/{doctorId})

Sn | UI Parameter Name | API Parameter Name | Validation | Required | Editable | Data Source | Example |
1 | Həkim | doctorId | UUID; mövcud və aktiv həkim olmalıdır | Yes | No | GET /v1/doctors | a3f8...e21c |
2 | Klinika | clinicId | UUID; həkimə bağlı klinika olmalıdır | Yes | Yes | GET /v1/doctors/{id} | 7b12...9f40 |
3 | Xidmət | serviceId | UUID; həmin klinikada həkimə bağlı xidmət olmalıdır | Yes | Yes | GET /v1/clinics/{id}/services | c9d4...1a77 |
4 | Tarix | slotDate | Date; format: YYYY-MM-DD; keçmiş tarix olmaz; max 60 gün irəli | Yes | Yes | GET /v1/doctors/{id}/slots | 2026-09-22 |
5 | Saat | slotId | UUID; slot statusu AVAILABLE olmalıdır; randevuya min 1 saat qalmalıdır | Yes | Yes | GET /v1/doctors/{id}/slots | e5c1...4b83 |
6 | Şikayət / qeyd | patientNote | String; max 500 simvol; boş ola bilər | No | Yes | User input | Baş ağrısı, 3 gündür |
7 | Əlavə sənədlər | documentIds | Array of UUID; pasientə məxsus sənədlər olmalıdır; max 10 element | No | Yes | GET /v1/documents | ["d1a2...", "f3b8..."] |

### Həkim axtarışı ekranı (UC-201 → /search/doctors)

Sn | UI Parameter Name | API Parameter Name | Validation | Required | Editable | Data Source | Example |
1 | Axtarış mətni | query | String; min 2 simvol; max 100 simvol | No | Yes | User input | Əliyev |
2 | İxtisas | specialtyIds | Array of UUID; kataloqdan seçilir | No | Yes | GET /v1/specialties | ["4a7c..."] |
3 | Şəhər | cityIds | Array of UUID | No | Yes | GET /v1/cities | ["b2e9..."] |
4 | Klinika | clinicIds | Array of UUID | No | Yes | GET /v1/clinics | ["7b12..."] |
5 | Minimum reytinq | minRating | Decimal; aralıq: 0–5; bir onluq dəqiqlik | No | Yes | User input | 4.0 |
6 | Cins | gender | Enum; MALE, FEMALE | No | Yes | User input | FEMALE |
7 | Dil | languageCodes | Array of String; ISO 639-1 | No | Yes | GET /v1/languages | ["az", "ru"] |
8 | Təcrübə (min) | minExperience | Integer; aralıq: 0–60 | No | Yes | User input | 5 |
9 | Boş vaxt | availability | Enum; TODAY, TOMORROW, THIS_WEEK | No | Yes | User input | THIS_WEEK |
10 | Çeşidləmə | sortBy | Enum; RATING, EXPERIENCE, EARLIEST_SLOT | No | Yes | User input | RATING |
11 | Səhifə | page | Integer; min 1; default 1 | No | Yes | System | 1 |
12 | Səhifə ölçüsü | size | Integer; max 20; default 20 | No | Yes | System | 20 |

## API

### Endpoint xülasəsi
Platformanın əsas endpoint-ləri modul üzrə:
Method | Endpoint | Təyinat | Use Case |
POST | /v1/auth/register/initiate | Qeydiyyatı başladır, OTP göndərir | UC-101 |
POST | /v1/auth/otp/verify | OTP kodunu təsdiqləyir | UC-101 |
POST | /v1/auth/sima/session | SİMA sessiyası yaradır, QR qaytarır | UC-101 |
POST | /v1/auth/sima/callback | SİMA cavabını qəbul edir | UC-101 |
POST | /v1/auth/register/complete | PIN təyin edir, hesabı yaradır | UC-101 |
POST | /v1/auth/login | Sistemə giriş | UC-102 |
POST | /v1/auth/pin/reset | PIN bərpası | UC-103 |
GET | /v1/profile | Profil məlumatlarını qaytarır | UC-104 |
PATCH | /v1/profile | Profili yeniləyir | UC-104 |
GET | /v1/doctors | Həkim axtarışı və filtrləmə | UC-201 |
GET | /v1/clinics | Klinika axtarışı və filtrləmə | UC-202 |
GET | /v1/doctors/{doctorId} | Həkimin tam profili | UC-301 |
GET | /v1/doctors/{doctorId}/slots | Həkimin boş vaxtları | UC-301, UC-401 |
GET | /v1/clinics/{clinicId} | Klinikanın tam profili | UC-302 |
POST | /v1/slots/{slotId}/lock | Slotu müvəqqəti bloklayır | UC-401 |
POST | /v1/appointments | Randevu yaradır | UC-401 |
GET | /v1/appointments | Randevu siyahısı | UC-404 |
GET | /v1/appointments/{id} | Randevu detalları | UC-404 |
PATCH | /v1/appointments/{id}/cancel | Randevunu ləğv edir | UC-402 |
PATCH | /v1/appointments/{id}/reschedule | Randevunu köçürür | UC-403 |
PATCH | /v1/appointments/{id}/complete | Randevunu tamamlayır | UC-405 |
POST | /v1/documents | Tibbi sənəd yükləyir | UC-501 |
GET | /v1/documents | Sənəd siyahısı | UC-501 |
POST | /v1/documents/{id}/grants | Həkimə giriş icazəsi verir | UC-502 |
DELETE | /v1/grants/{grantId} | İcazəni ləğv edir | UC-502 |
GET | /v1/documents/{id}/view | Signed URL qaytarır | UC-503 |
GET | /v1/medical-history | Tibbi tarixçə | UC-504 |
POST | /v1/prescriptions | Resept yaradır (draft) | UC-601 |
POST | /v1/prescriptions/{id}/sign | Resepti imzalayır | UC-601 |
GET | /v1/prescriptions | Resept siyahısı | UC-602 |
PUT | /v1/doctor/schedule | Cədvəli qurur / yeniləyir | UC-702 |
POST | /v1/clinic-admin/doctors | Klinikaya həkim əlavə edir | UC-802 |
POST | /v1/admin/clinics | Klinika yaradır | UC-901 |
GET | /v1/notifications | Bildiriş siyahısı | UC-1001 |
POST | /v1/reviews | Rəy göndərir | UC-1101 |

### Success result — Nümunə 1: Randevu yaratma
Success (201 Created)
Method | POST |
Endpoint | POST /v1/appointments |
Description | Pasient üçün yeni randevu yaradır. Slot əvvəlcədən /v1/slots/{slotId}/lock ilə bloklanmış olmalıdır. Uğurlu cavabda unikal bookingReference qaytarılır. |
Endpoint izahı | https://api.mediconnect.az — API serverin base URL-i ; /v1 — API versiyası ; /appointments — resurs adı (randevular) |
Header parameters | Authorization: Bearer {token} — məcburi ; Content-Type: application/json — məcburi ; Accept-Language: az — optional, default: az |

Request body
{ ; "doctorId": "a3f8c210-5e74-4b91-a1d2-88f0c3b4e21c", ; "clinicId": "7b12e845-3c90-4a17-b6d8-2e51f7a09f40", ; "serviceId": "c9d47f13-8b26-4e50-9a3c-16d82b4f1a77", ; "slotId": "e5c19a72-4d38-4f62-8b15-7c93e20d4b83", ; "patientNote": "Baş ağrısı, 3 gündür davam edir", ; "documentIds": ["d1a24f80-2b67-4c31-9e85-3f7b12c90a4d"] ; } |

API Field | Data type | Validation | Comment |
doctorId | UUID | Məcburi; mövcud və aktiv həkim | Həkim deaktivdirsə 409 qaytarılır |
clinicId | UUID | Məcburi; həkimə bağlı klinika | Həkim bir neçə klinikada işləyə bilər |
serviceId | UUID | Məcburi; klinikada mövcud xidmət | Xidmət müddəti slot hesablamasına təsir edir |
slotId | UUID | Məcburi; status SOFT_LOCKED və lock sahibi cari istifadəçi | Lock müddəti bitibsə 409 qaytarılır |
patientNote | String | Optional; max 500 simvol | Həkimə göstərilir, klinika admininə yox |
documentIds | Array[UUID] | Optional; max 10; pasientə məxsus olmalıdır | Avtomatik giriş icazəsi yaradılır |

Response body
{ ; "status": "SUCCESS", ; "message": "Randevu uğurla yaradıldı", ; "data": { ; "appointmentId": "f47ac10b-58cc-4372-a567-0e02b2c3d479", ; "bookingReference": "MC-2026-0917-4821", ; "appointmentStatus": "CONFIRMED", ; "slotDate": "2026-09-22", ; "startTime": "14:30", ; "endTime": "15:00", ; "doctorName": "Dr. Aygün Məmmədova", ; "clinicName": "Medion Klinika", ; "clinicAddress": "Bakı, Nizami küç. 45", ; "serviceName": "İlkin müayinə", ; "createdAt": "2026-09-14T10:22:41Z" ; } ; } |

API Field | Data type | Validation | Comment |
status | Enum | SUCCESS / ERROR | Bütün cavablarda mövcuddur |
message | String | İstifadəçi dilində | Accept-Language header-inə görə |
appointmentId | UUID | Sistem tərəfindən yaradılır | Daxili identifikator |
bookingReference | String | Format: MC-YYYY-MMDD-NNNN | Pasient klinikada təqdim edir |
appointmentStatus | Enum | PENDING / CONFIRMED | Həkimin təsdiq rejimindən asılıdır |
clinicAddress | String | — | Pasientin klinikanı tapması üçün |

### Success result — Nümunə 2: Həkim axtarışı
Success (200 OK)
Method | GET |
Endpoint | GET /v1/doctors?specialtyIds={id}&cityIds={id}&minRating={value}&sortBy={type}&page={n}&size={n} |
Description | Filtrlərə uyğun həkimləri qaytarır. Autentifikasiya tələb olunmur — Guest də istifadə edə bilər. Nəticələr səhifələnir. |
Query parameters | specialtyIds — ixtisas filtri (array) ; cityIds — şəhər filtri (array) ; minRating — minimum reytinq ; sortBy — çeşidləmə meyarı ; page, size — səhifələmə |
Header parameters | Accept-Language: az — optional |

Response body
{ ; "status": "SUCCESS", ; "data": { ; "totalCount": 47, ; "page": 1, ; "size": 20, ; "doctors": [ ; { ; "doctorId": "a3f8c210-5e74-4b91-a1d2-88f0c3b4e21c", ; "fullName": "Dr. Aygün Məmmədova", ; "photoUrl": "https://cdn.mediconnect.az/d/a3f8.jpg", ; "specialties": ["Kardioloq"], ; "clinics": ["Medion Klinika"], ; "rating": 4.7, ; "reviewCount": 132, ; "experienceYears": 12, ; "earliestSlot": "2026-09-16T09:00:00Z" ; } ; ] ; } ; } |

API Field | Data type | Validation | Comment |
totalCount | Integer | ≥ 0 | Filtrə uyğun ümumi nəticə sayı |
rating | Decimal | 0–5; bir onluq dəqiqlik | Rəyi yoxdursa null qaytarılır |
reviewCount | Integer | ≥ 0 | Yalnız dərc olunmuş rəylər |
earliestSlot | DateTime | ISO 8601; UTC | Boş slot yoxdursa null |

### Success result — Nümunə 3: Sənədə giriş icazəsi
Success (201 Created)
Method | POST |
Endpoint | POST /v1/documents/{documentId}/grants |
Description | Pasient tibbi sənədini konkret həkimlə müddətli paylaşır. Müddət bitdikdə giriş avtomatik bağlanır. |
Path parameter | {documentId} — sənədin UUID-si; pasientə məxsus olmalıdır |
Header parameters | Authorization: Bearer {token} — məcburi |

Request body
{ ; "doctorId": "a3f8c210-5e74-4b91-a1d2-88f0c3b4e21c", ; "accessDuration": "SEVEN_DAYS" ; } |

API Field | Data type | Validation | Comment |
doctorId | UUID | Məcburi; pasientin randevusu olan həkim | Randevusu yoxdursa 403 qaytarılır |
accessDuration | Enum | TWENTY_FOUR_HOURS / SEVEN_DAYS / THIRTY_DAYS / APPOINTMENT_PERIOD | Sistem bitmə tarixini hesablayır |

Response body
{ ; "status": "SUCCESS", ; "message": "Sənəd həkimlə paylaşıldı", ; "data": { ; "grantId": "9c2e4b17-6a83-4d50-b129-5f7ac83e1d46", ; "documentId": "d1a24f80-2b67-4c31-9e85-3f7b12c90a4d", ; "doctorName": "Dr. Aygün Məmmədova", ; "grantStatus": "ACTIVE", ; "grantedAt": "2026-09-14T10:30:00Z", ; "expiresAt": "2026-09-21T10:30:00Z" ; } ; } |

## Error Examples
Bütün xəta cavabları eyni strukturda qaytarılır:
{ ; "status": "ERROR", ; "errorType": "SlotUnavailable", ; "message": "Bu vaxt artıq doludur", ; "timestamp": "2026-09-14T10:35:12Z" ; } |

### Ümumi xətalar

HTTP Code | Error Type | Message Example | Meaning |
400 | ValidationError | Telefon nömrəsinin formatı yanlışdır | Sahə format yoxlamasından keçmədi |
401 | Unauthorized | Sessiyanızın müddəti bitib, yenidən daxil olun | Token yoxdur və ya etibarsızdır |
403 | Forbidden | Bu məlumata giriş icazəniz yoxdur | Rol və ya sahiblik yoxlaması uğursuz |
404 | NotFound | Həkim tapılmadı | Resurs mövcud deyil |
409 | Conflict | Bu nömrə ilə hesab artıq mövcuddur | Unikallıq şərti pozuldu |
422 | BusinessRuleViolation | Randevuya 1 saatdan az qalıb, ləğv mümkün deyil | Biznes qaydası pozuldu |
429 | TooManyRequests | Çox sayda cəhd. 30 dəqiqə sonra yenidən sınayın | Rate limit aşıldı |
500 | ServerError | Gözlənilməz xəta baş verdi | Sistem və ya baza problemi |
503 | ServiceUnavailable | Doğrulama xidməti hazırda əlçatan deyil | Xarici servis (SİMA, SMS) cavab vermir |

### Modul üzrə biznes xətaları

HTTP Code | Error Type | Message Example | Meaning |
409 | DuplicateAccount | Bu FIN ilə hesab artıq mövcuddur | UC-101 — bir FIN = bir hesab |
422 | InvalidOtp | Kod yanlışdır və ya müddəti bitib | UC-101 — OTP yoxlaması uğursuz |
422 | SimaVerificationFailed | Şəxsiyyət doğrulaması uğursuz oldu | UC-101 — SİMA error callback |
422 | WeakPin | Bu PIN çox sadədir, başqa kombinasiya seçin | UC-101 — 1111, 1234, 0000 |
429 | AccountLocked | Hesab 30 dəqiqə bloklanıb | UC-102 — 5 uğursuz giriş cəhdi |
409 | SlotUnavailable | Bu vaxt artıq doludur | UC-401 — slot başqası tərəfindən tutulub |
409 | SlotLockExpired | Vaxtınız bitdi, yenidən seçin | UC-401 — 10 dəqiqəlik lock buraxıldı |
422 | DuplicateAppointment | Bu həkimlə həmin gün üçün artıq randevunuz var | UC-401 — BR-401-06 |
422 | NoShowLimitExceeded | Klinika ilə birbaşa əlaqə saxlayın | UC-401 — no-show limiti aşılıb |
422 | CancellationTooLate | Randevuya 1 saatdan az qalıb | UC-402 — BR-402-02 |
422 | RescheduleLimitExceeded | Bu randevunu daha dəyişmək mümkün deyil | UC-403 — max 2 dəfə |
413 | FileTooLarge | Fayl ölçüsü 10 MB-dan çox ola bilməz | UC-501 — ölçü limiti |
415 | UnsupportedFileType | Bu format dəstəklənmir | UC-501 — yalnız PDF, JPG, PNG |
422 | MalwareDetected | Fayl təhlükəsizlik yoxlamasından keçmədi | UC-501 — antivirus skanı |
403 | AccessGrantExpired | Bu sənədə girişiniz sona çatıb | UC-503 — icazə müddəti bitib |
403 | DownloadNotAllowed | Sənədi yükləmək mümkün deyil | UC-503 — yalnız daxili baxış |
403 | LicenseInvalid | Lisenziyanız aktiv deyil | UC-601 — resept yazıla bilməz |
422 | AllergyConflict | Pasientin bu dərmana allergiyası qeyd olunub | UC-601 — açıq təsdiq tələb olunur |
422 | DrugInteraction | Təhlükəli dərman qarşılıqlı təsiri aşkarlandı | UC-601 — şiddət səviyyəsi ilə |
422 | PrescriptionNotSigned | Resept imzalanmayıb | UC-601 — imzasız resept etibarsızdır |
409 | ScheduleConflict | Bu vaxt aralığında təsdiqlənmiş randevular var | UC-702 — cədvəl dəyişikliyi konflikti |
409 | DuplicateLicense | Bu lisenziya nömrəsi başqa həkimə aiddir | UC-802 — unikallıq pozuldu |
422 | ReviewNotEligible | Rəy yalnız tamamlanmış qəbullar üçün yazıla bilər | UC-1101 — BR-1101-01 |
409 | DuplicateReview | Bu randevu üçün artıq rəy yazmısınız | UC-1101 — bir randevu = bir rəy |

## Enum list

### appointmentStatus

API adı | İzah |
PENDING | Həkimin təsdiqi gözlənilir (manual təsdiq rejimi) |
CONFIRMED | Randevu təsdiqlənib |
COMPLETED | Qəbul baş tutub, tamamlanıb |
CANCELLED | Ləğv edilib (pasient, həkim və ya admin tərəfindən) |
NO_SHOW | Pasient qəbula gəlməyib |

### slotStatus

API adı | İzah |
AVAILABLE | Boş, seçilə bilər |
SOFT_LOCKED | Müvəqqəti bloklanıb (10 dəqiqə) |
BOOKED | Randevu üçün tutulub |
BLOCKED | Həkim və ya admin tərəfindən bağlanıb |

### prescriptionStatus

API adı | İzah |
DRAFT | Yaradılıb, imzalanmayıb — pasientə görünmür |
SIGNED | Rəqəmsal imza ilə təsdiqlənib, etibarlıdır |
EXPIRED | Etibarlılıq müddəti bitib |
CANCELLED | Həkim tərəfindən ləğv edilib |
DISPENSED | Aptek dərmanı verib (Phase 2) |

### documentCategory

API adı | İzah |
LAB_RESULT | Analiz nəticəsi |
IMAGING | Görüntüləmə (MRT, KT, rentgen, USM) |
EPICRISIS | Epikriz / çıxarış |
PRESCRIPTION | Resept (kənar müəssisədən) |
OTHER | Digər tibbi sənəd |

### grantStatus / accessDuration

API adı | İzah |
ACTIVE | İcazə qüvvədədir |
EXPIRED | Müddət bitib, giriş avtomatik bağlanıb |
REVOKED | Pasient tərəfindən ləğv edilib |
TWENTY_FOUR_HOURS | Giriş müddəti: 24 saat |
SEVEN_DAYS | Giriş müddəti: 7 gün |
THIRTY_DAYS | Giriş müddəti: 30 gün |
APPOINTMENT_PERIOD | Randevu tarixindən 7 gün sonraya qədər |

### userRole

API adı | İzah |
PATIENT | Pasient — SİMA ilə doğrulanmış istifadəçi |
DOCTOR | Həkim — klinika admini tərəfindən əlavə edilir |
CLINIC_ADMIN | Klinika administratoru — yalnız öz klinikası |
SUPER_ADMIN | Platforma administratoru — qlobal səlahiyyət |

### userStatus

API adı | İzah |
PENDING_VERIFICATION | Qeydiyyat başlayıb, SİMA doğrulaması gözlənilir |
VERIFIED | Aktiv, tam funksionallıq |
SUSPENDED | Müvəqqəti dayandırılıb |
BLOCKED | Bloklanıb, giriş mümkün deyil |
DELETED | Silinib / anonimləşdirilib |

### reviewStatus

API adı | İzah |
PENDING_MODERATION | Moderasiya gözlənilir, profildə görünmür |
PUBLISHED | Dərc olunub, reytinqə daxildir |
REJECTED | Rədd edilib |
REPORTED | Şikayət edilib, təkrar baxış gözlənilir |
WITHDRAWN | Geri çəkilib, reytinqdən çıxarılıb |

### notificationChannel / deliveryStatus

API adı | İzah |
SMS | SMS kanalı |
PUSH | Push notification |
EMAIL | Elektron poçt |
IN_APP | Tətbiqdaxili bildiriş mərkəzi |
QUEUED | Növbəyə əlavə olunub |
SENT | Servisə ötürülüb |
DELIVERED | Alıcıya çatdırılıb |
FAILED | Çatdırılma uğursuz |

### clinicStatus / doctorClinicStatus

API adı | İzah |
PENDING_VERIFICATION | Sənədlər yoxlanılır, platformada görünmür |
ACTIVE | Verifikasiya edilib, aktivdir |
SUSPENDED | Müvəqqəti dayandırılıb |
INACTIVE | Deaktiv edilib |
INVITED | Həkim dəvət edilib, cavab gözlənilir |
REMOVED | Həkim klinikadan çıxarılıb |

## Database ümumi məlumatı

Database name | mediconnect_db |
Database type | PostgreSQL (relational) |
Database description | MediConnect platformasının əsas verilənlər bazası. İstifadəçi hesabları, həkim və klinika məlumatları, randevu cədvəlləri, tibbi sənədlərin metadata-sı, reseptlər, rəylər və audit qeydləri saxlanılır. Tibbi sənədlərin özü bazada deyil, şifrələnmiş fayl storage-ında saxlanılır — bazada yalnız metadata və şifrələmə açarı referensi olur. |
Charset / Collation | UTF-8 — Azərbaycan əlifbasının xüsusi simvolları (ə, ğ, ı, ö, ş, ü, ç) üçün |
PK strategiyası | UUID (v4) — bütün cədvəllərdə. Ardıcıl ID-lərdən fərqli olaraq sıralanma ilə məlumat sızmasının qarşısını alır. |
Silinmə strategiyası | Soft delete — tibbi və audit əhəmiyyətli qeydlər fiziki silinmir, deleted_at sahəsi ilə işarələnir |
ERD diagram link | TBD — Models/Diagrams bölməsində yerləşdiriləcək |

### Table(s) list — Hissə 1

# | Table name | Təyinat | Use Case |
1 | users | Bütün istifadəçilərin əsas hesab məlumatları | UC-101, 102, 103, 902 |
2 | patients | Pasientə xas profil və tibbi əsas məlumatlar | UC-101, 104 |
3 | patient_allergies | Pasientin allergiya siyahısı | UC-104, 601 |
4 | patient_chronic_conditions | Xroniki xəstəliklər | UC-104 |
5 | user_sessions | Aktiv sessiyalar və cihaz məlumatı | UC-102, 902 |
6 | otp_verifications | OTP kodları və doğrulama cəhdləri | UC-101, 103 |
7 | sima_verification_sessions | SİMA doğrulama sessiyaları | UC-101, 103 |
8 | doctors | Həkim profili və peşəkar məlumatlar | UC-701, 802 |
9 | specialties | İxtisas kataloqu (sistem səviyyəsində) | UC-904 |
10 | doctor_specialties | Həkim–ixtisas əlaqəsi (M:N) | UC-701, 802 |
11 | doctor_languages | Həkimin danışdığı dillər | UC-701 |
12 | clinics | Klinika profili və lisenziya məlumatları | UC-801, 901 |
13 | clinic_working_hours | Klinikanın həftəlik iş saatları | UC-801 |
14 | clinic_photos | Klinika fotoqalereyası | UC-801 |
15 | doctor_clinics | Həkim–klinika əlaqəsi (M:N) — platformanın açar cədvəli | UC-802, 702 |
16 | services | Xidmət kataloqu (sistem səviyyəsində) | UC-904 |
17 | clinic_doctor_services | Klinikada həkimin göstərdiyi xidmətlər | UC-804, 802 |
18 | doctor_schedules | Həftəlik cədvəl şablonu | UC-702, 803 |
19 | schedule_breaks | Cədvəldəki fasilələr | UC-702 |
20 | schedule_exceptions | Məzuniyyət, bağlı günlər, əlavə iş saatı | UC-702, 803 |
21 | appointment_slots | Generasiya olunmuş konkret vaxt slotları | UC-401, 702 |
22 | appointments | Randevular | UC-401…405 |
23 | appointment_status_history | Randevu status dəyişikliklərinin tarixçəsi | UC-402, 403, 405 |
24 | appointment_documents | Randevuya əlavə edilmiş sənədlər | UC-401, 502 |

## Modul 1 — İstifadəçi və autentifikasiya cədvəlləri

### users
Bütün rolların (pasient, həkim, klinika admini, super admin) ortaq hesab cədvəli. Rola xas məlumatlar ayrıca cədvəllərdə saxlanılır.
# | Field name | Data type | Comments |
1 | user_id | UUID | PK |
2 | fin | VARCHAR(7) | UNIQUE, NOT NULL — bir FIN = bir hesab (BR-101-01) |
3 | mobile_number | VARCHAR(13) | UNIQUE, NOT NULL — format: +994XXXXXXXXX |
4 | first_name | VARCHAR(50) | NOT NULL — SİMA-dan gəlir, redaktə edilmir |
5 | last_name | VARCHAR(50) | NOT NULL — SİMA-dan gəlir |
6 | father_name | VARCHAR(50) | Nullable — SİMA-dan gəlir |
7 | birth_date | DATE | NOT NULL — SİMA-dan gəlir |
8 | gender | ENUM | MALE / FEMALE — SİMA-dan gəlir |
9 | pin_hash | VARCHAR(255) | NOT NULL — bcrypt hash, açıq mətn saxlanmır (NFR-03) |
10 | role | ENUM | PATIENT / DOCTOR / CLINIC_ADMIN / SUPER_ADMIN |
11 | status | ENUM | PENDING_VERIFICATION / VERIFIED / SUSPENDED / BLOCKED / DELETED |
12 | email | VARCHAR(100) | Nullable — istifadəçi özü əlavə edir |
13 | photo_url | VARCHAR(255) | Nullable |
14 | biometric_enabled | BOOLEAN | Default: false |
15 | preferred_language | VARCHAR(2) | Default: 'az' — ISO 639-1 |
16 | failed_login_attempts | SMALLINT | Default: 0 — 5-də hesab bloklanır (BR-102-02) |
17 | locked_until | TIMESTAMP | Nullable — bloklama bitmə vaxtı |
18 | last_login_at | TIMESTAMP | Nullable |
19 | blocked_reason | TEXT | Nullable — Super Admin bloklayarkən məcburi (BR-902-03) |
20 | created_at | TIMESTAMP | NOT NULL |
21 | updated_at | TIMESTAMP | NOT NULL |
22 | deleted_at | TIMESTAMP | Nullable — soft delete |

İndekslər: idx_users_fin, idx_users_mobile, idx_users_role_status

### patients
Pasientə xas əlavə məlumatlar. users cədvəli ilə 1:1 əlaqədədir.
# | Field name | Data type | Comments |
1 | patient_id | UUID | PK |
2 | user_id | UUID | FK → users.user_id, UNIQUE |
3 | blood_type | VARCHAR(3) | Nullable — A+, B-, O+, AB- və s. |
4 | address | TEXT | Nullable |
5 | secondary_phone | VARCHAR(13) | Nullable |
6 | emergency_contact_name | VARCHAR(100) | Nullable |
7 | emergency_contact_phone | VARCHAR(13) | Nullable |
8 | medical_consent | BOOLEAN | NOT NULL — false olduqda tibbi funksiyalar bağlanır (BR-104-04) |
9 | consent_given_at | TIMESTAMP | Nullable — audit üçün (FR-101-44) |
10 | consent_version | VARCHAR(10) | Nullable — razılıq sənədinin versiyası |
11 | no_show_count | SMALLINT | Default: 0 — limit aşıldıqda randevu məhdudlaşdırılır (BR-401-10) |
12 | created_at | TIMESTAMP | NOT NULL |
13 | updated_at | TIMESTAMP | NOT NULL |

### patient_allergies
Resept yazılarkən həkimə avtomatik göstərilir və klinik təhlükəsizlik yoxlamasında istifadə olunur.
# | Field name | Data type | Comments |
1 | allergy_id | UUID | PK |
2 | patient_id | UUID | FK → patients.patient_id |
3 | allergen_name | VARCHAR(150) | NOT NULL — dərman və ya maddə adı |
4 | drug_id | UUID | Nullable, FK → drugs.drug_id — kataloqdan seçilibsə |
5 | severity | ENUM | MILD / MODERATE / SEVERE |
6 | notes | TEXT | Nullable |
7 | created_at | TIMESTAMP | NOT NULL |

### patient_chronic_conditions

# | Field name | Data type | Comments |
1 | condition_id | UUID | PK |
2 | patient_id | UUID | FK → patients.patient_id |
3 | condition_name | VARCHAR(150) | NOT NULL |
4 | icd10_code | VARCHAR(10) | Nullable — beynəlxalq təsnifat kodu |
5 | diagnosed_date | DATE | Nullable |
6 | created_at | TIMESTAMP | NOT NULL |

### user_sessions

# | Field name | Data type | Comments |
1 | session_id | UUID | PK |
2 | user_id | UUID | FK → users.user_id |
3 | token_hash | VARCHAR(255) | NOT NULL — token açıq saxlanmır |
4 | device_info | VARCHAR(255) | Nullable — yeni cihaz aşkarlanması üçün |
5 | ip_address | VARCHAR(45) | Nullable — IPv6 dəstəyi |
6 | expires_at | TIMESTAMP | NOT NULL — 15 dəqiqə fəaliyyətsizlik (NFR-09) |
7 | revoked_at | TIMESTAMP | Nullable — PIN dəyişikliyi və ya bloklama zamanı |
8 | created_at | TIMESTAMP | NOT NULL |

### otp_verifications

# | Field name | Data type | Comments |
1 | otp_id | UUID | PK |
2 | mobile_number | VARCHAR(13) | NOT NULL |
3 | otp_hash | VARCHAR(255) | NOT NULL — kod hash formada (FR-101-17) |
4 | purpose | ENUM | REGISTRATION / PIN_RESET / PHONE_CHANGE |
5 | attempt_count | SMALLINT | Default: 0 |
6 | is_verified | BOOLEAN | Default: false |
7 | expires_at | TIMESTAMP | NOT NULL — 120 saniyə (BR-101-03) |
8 | created_at | TIMESTAMP | NOT NULL |

### sima_verification_sessions

# | Field name | Data type | Comments |
1 | sima_session_id | UUID | PK |
2 | fin | VARCHAR(7) | NOT NULL — doğrulanacaq FIN |
3 | mobile_number | VARCHAR(13) | NOT NULL |
4 | qr_token | VARCHAR(255) | UNIQUE — QR kodun daxilindəki token |
5 | purpose | ENUM | REGISTRATION / PIN_RESET / DOCTOR_ONBOARDING |
6 | session_status | ENUM | PENDING / SUCCESS / FAILED / EXPIRED |
7 | return_url | VARCHAR(500) | Nullable — qeydiyyatdan sonra qayıdış ünvanı |
8 | callback_payload | JSONB | Nullable — SİMA-dan gələn tam cavab |
9 | signature_verified | BOOLEAN | Default: false — imza yoxlaması (NFR-07) |
10 | expires_at | TIMESTAMP | NOT NULL — 5 dəqiqə (BR-101-04) |
11 | created_at | TIMESTAMP | NOT NULL |

## Modul 2–3 — Həkim və klinika cədvəlləri

### doctors

# | Field name | Data type | Comments |
1 | doctor_id | UUID | PK |
2 | user_id | UUID | FK → users.user_id, UNIQUE |
3 | license_number | VARCHAR(50) | UNIQUE, NOT NULL — bir lisenziya = bir həkim (BR-802-03) |
4 | license_expiry_date | DATE | NOT NULL — bitdikdə həkim avtomatik dayandırılır |
5 | license_document_url | VARCHAR(255) | Nullable — şifrələnmiş storage-da |
6 | bio | TEXT | Nullable — həkim özü doldurur |
7 | education | TEXT | Nullable |
8 | experience_years | SMALLINT | Nullable — axtarış filtrində istifadə olunur |
9 | academic_degree | VARCHAR(100) | Nullable |
10 | approval_mode | ENUM | AUTO / MANUAL — randevu təsdiq rejimi (BR-701-08) |
11 | profile_completed | BOOLEAN | Default: false — false olduqda axtarışda görünmür (BR-701-05) |
12 | avg_rating | DECIMAL(2,1) | Nullable — yalnız dərc olunmuş rəylərdən hesablanır |
13 | review_count | INTEGER | Default: 0 |
14 | created_at | TIMESTAMP | NOT NULL |
15 | updated_at | TIMESTAMP | NOT NULL |

İndekslər: idx_doctors_license, idx_doctors_rating, idx_doctors_profile_completed

### specialties
Super Admin tərəfindən mərkəzləşdirilmiş idarə olunan kataloq (BR-904-05).
# | Field name | Data type | Comments |
1 | specialty_id | UUID | PK |
2 | name_az | VARCHAR(100) | NOT NULL — məsələn "Kardioloq" |
3 | name_ru | VARCHAR(100) | Nullable |
4 | name_en | VARCHAR(100) | Nullable |
5 | is_active | BOOLEAN | Default: true |
6 | created_at | TIMESTAMP | NOT NULL |

### doctor_specialties

# | Field name | Data type | Comments |
1 | doctor_specialty_id | UUID | PK |
2 | doctor_id | UUID | FK → doctors.doctor_id |
3 | specialty_id | UUID | FK → specialties.specialty_id |
4 | is_primary | BOOLEAN | Default: false — əsas ixtisas |

Constraint: UNIQUE (doctor_id, specialty_id)

### doctor_languages

# | Field name | Data type | Comments |
1 | doctor_language_id | UUID | PK |
2 | doctor_id | UUID | FK → doctors.doctor_id |
3 | language_code | VARCHAR(2) | NOT NULL — ISO 639-1 (az, ru, en, tr) |

### clinics

# | Field name | Data type | Comments |
1 | clinic_id | UUID | PK |
2 | name | VARCHAR(150) | NOT NULL |
3 | clinic_type | ENUM | POLYCLINIC / HOSPITAL / DIAGNOSTIC_CENTER / DENTAL / LABORATORY |
4 | registration_number | VARCHAR(50) | UNIQUE, NOT NULL — bir nömrə = bir klinika (BR-901-03) |
5 | license_number | VARCHAR(50) | NOT NULL |
6 | license_expiry_date | DATE | NOT NULL — gündəlik yoxlanılır (FR-901-28) |
7 | description | TEXT | Nullable |
8 | city_id | UUID | FK → cities.city_id |
9 | district | VARCHAR(100) | Nullable |
10 | address | TEXT | NOT NULL |
11 | latitude | DECIMAL(10,8) | Nullable — xəritə üçün |
12 | longitude | DECIMAL(11,8) | Nullable |
13 | phone | VARCHAR(20) | NOT NULL |
14 | email | VARCHAR(100) | Nullable |
15 | website | VARCHAR(255) | Nullable |
16 | logo_url | VARCHAR(255) | Nullable |
17 | status | ENUM | PENDING_VERIFICATION / ACTIVE / SUSPENDED / INACTIVE |
18 | verified_by | UUID | Nullable, FK → users.user_id — verifikasiya edən admin |
19 | verified_at | TIMESTAMP | Nullable |
20 | avg_rating | DECIMAL(2,1) | Nullable — həkim reytinqlərindən hesablanır (BR-1101-10) |
21 | created_at | TIMESTAMP | NOT NULL |
22 | updated_at | TIMESTAMP | NOT NULL |

İndekslər: idx_clinics_status, idx_clinics_city, idx_clinics_registration

### clinic_working_hours
Həkim cədvəlləri üçün yuxarı sərhəd rolunu oynayır (BR-801-05).
# | Field name | Data type | Comments |
1 | working_hour_id | UUID | PK |
2 | clinic_id | UUID | FK → clinics.clinic_id |
3 | day_of_week | SMALLINT | 1–7 (bazar ertəsi = 1) |
4 | opens_at | TIME | Nullable — qeyri-iş günündə null |
5 | closes_at | TIME | Nullable |
6 | is_closed | BOOLEAN | Default: false |

Constraint: UNIQUE (clinic_id, day_of_week)

### clinic_photos

# | Field name | Data type | Comments |
1 | photo_id | UUID | PK |
2 | clinic_id | UUID | FK → clinics.clinic_id |
3 | photo_url | VARCHAR(255) | NOT NULL |
4 | display_order | SMALLINT | Default: 0 — sıralama (FR-801-08) |
5 | created_at | TIMESTAMP | NOT NULL |

### doctor_clinics

# | Field name | Data type | Comments |
1 | doctor_clinic_id | UUID | PK — cədvəl və slotlar bu ID-yə bağlanır |
2 | doctor_id | UUID | FK → doctors.doctor_id |
3 | clinic_id | UUID | FK → clinics.clinic_id |
4 | status | ENUM | INVITED / ACTIVE / INACTIVE / REMOVED (BR-802-04) |
5 | room_number | VARCHAR(20) | Nullable — kabinet nömrəsi |
6 | invited_by | UUID | FK → users.user_id — dəvət edən klinika admini |
7 | invite_token | VARCHAR(255) | Nullable — dəvət linkindəki token |
8 | invite_expires_at | TIMESTAMP | Nullable — 7 gün (BR-802-09) |
9 | joined_at | TIMESTAMP | Nullable — dəvət qəbul edildiyi vaxt |
10 | removed_at | TIMESTAMP | Nullable |
11 | created_at | TIMESTAMP | NOT NULL |

Constraint: UNIQUE (doctor_id, clinic_id) — eyni həkim eyni klinikaya iki dəfə əlavə edilə bilməz ; İndekslər: idx_doctor_clinics_status

### services
Super Admin tərəfindən idarə olunan mərkəzi xidmət kataloqu. Klinikalar yalnız buradan seçim edə bilir (BR-804-02).
# | Field name | Data type | Comments |
1 | service_id | UUID | PK |
2 | name_az | VARCHAR(150) | NOT NULL — məsələn "İlkin müayinə" |
3 | name_ru | VARCHAR(150) | Nullable |
4 | name_en | VARCHAR(150) | Nullable |
5 | category | VARCHAR(50) | Nullable — konsultasiya, diaqnostika, laborator |
6 | is_active | BOOLEAN | Default: true |
7 | created_at | TIMESTAMP | NOT NULL |

### clinic_doctor_services
Konkret klinikada konkret həkimin göstərdiyi xidmətlər və onların müddəti.
# | Field name | Data type | Comments |
1 | clinic_doctor_service_id | UUID | PK |
2 | doctor_clinic_id | UUID | FK → doctor_clinics.doctor_clinic_id |
3 | service_id | UUID | FK → services.service_id |
4 | duration_minutes | SMALLINT | NOT NULL — slot planlaşdırmasına təsir edir (BR-804-04) |
5 | is_active | BOOLEAN | Default: true |
6 | created_at | TIMESTAMP | NOT NULL |

Constraint: UNIQUE (doctor_clinic_id, service_id)

## Modul 4 — Cədvəl və randevu cədvəlləri

### doctor_schedules
Həftəlik cədvəl şablonu. Konkret slotlar bu şablon əsasında generasiya olunur.
# | Field name | Data type | Comments |
1 | schedule_id | UUID | PK |
2 | doctor_clinic_id | UUID | FK → doctor_clinics — cədvəl klinika üzrə ayrıdır (BR-702-01) |
3 | day_of_week | SMALLINT | 1–7 |
4 | start_time | TIME | NOT NULL |
5 | end_time | TIME | NOT NULL — start_time-dan böyük olmalıdır |
6 | slot_duration_minutes | SMALLINT | NOT NULL — 15/20/30/45/60 (BR-702-03) |
7 | buffer_minutes | SMALLINT | Default: 0 — randevular arası fasilə |
8 | is_active | BOOLEAN | Default: true |
9 | updated_by | UUID | FK → users.user_id — həkim və ya klinika admini (BR-803-05) |
10 | created_at | TIMESTAMP | NOT NULL |
11 | updated_at | TIMESTAMP | NOT NULL |

### schedule_breaks

# | Field name | Data type | Comments |
1 | break_id | UUID | PK |
2 | schedule_id | UUID | FK → doctor_schedules.schedule_id |
3 | break_start | TIME | NOT NULL |
4 | break_end | TIME | NOT NULL |
5 | break_name | VARCHAR(50) | Nullable — məsələn "Nahar" |

### schedule_exceptions
Şablonu pozmadan konkret tarixlərə tətbiq olunan istisnalar: məzuniyyət, bağlı gün, əlavə iş saatı.
# | Field name | Data type | Comments |
1 | exception_id | UUID | PK |
2 | doctor_clinic_id | UUID | FK → doctor_clinics.doctor_clinic_id |
3 | exception_type | ENUM | VACATION / DAY_OFF / EXTRA_HOURS / HOLIDAY |
4 | start_date | DATE | NOT NULL |
5 | end_date | DATE | NOT NULL — tək gün üçün start_date ilə eyni |
6 | start_time | TIME | Nullable — yalnız EXTRA_HOURS üçün |
7 | end_time | TIME | Nullable |
8 | reason | VARCHAR(255) | Nullable |
9 | created_by | UUID | FK → users.user_id |
10 | created_at | TIMESTAMP | NOT NULL |

### appointment_slots

# | Field name | Data type | Comments |
1 | slot_id | UUID | PK |
2 | doctor_clinic_id | UUID | FK → doctor_clinics.doctor_clinic_id |
3 | slot_date | DATE | NOT NULL |
4 | start_time | TIME | NOT NULL |
5 | end_time | TIME | NOT NULL |
6 | status | ENUM | AVAILABLE / SOFT_LOCKED / BOOKED / BLOCKED |
7 | locked_by | UUID | Nullable, FK → users.user_id — lock sahibi |
8 | locked_until | TIMESTAMP | Nullable — 10 dəqiqə (BR-401-03) |
9 | blocked_reason | VARCHAR(255) | Nullable |
10 | created_at | TIMESTAMP | NOT NULL |
11 | updated_at | TIMESTAMP | NOT NULL |

Constraint: UNIQUE (doctor_clinic_id, slot_date, start_time) — double-booking qadağası (BR-401-02) ; İndekslər: idx_slots_date_status, idx_slots_doctor_clinic_date, idx_slots_locked_until

### appointments

# | Field name | Data type | Comments |
1 | appointment_id | UUID | PK |
2 | booking_reference | VARCHAR(20) | UNIQUE, NOT NULL — format: MC-YYYY-MMDD-NNNN (BR-401-09) |
3 | patient_id | UUID | FK → patients.patient_id |
4 | doctor_clinic_id | UUID | FK → doctor_clinics.doctor_clinic_id |
5 | slot_id | UUID | FK → appointment_slots.slot_id, UNIQUE |
6 | service_id | UUID | FK → services.service_id |
7 | status | ENUM | PENDING / CONFIRMED / COMPLETED / CANCELLED / NO_SHOW |
8 | patient_note | TEXT | Nullable — şikayət; klinika admini görmür (BR-805-02) |
9 | doctor_note | TEXT | Nullable — müayinə qeydi; yalnız həkim və pasient (BR-405-05) |
10 | reschedule_count | SMALLINT | Default: 0 — max 2 (BR-403-01) |
11 | cancelled_by | UUID | Nullable, FK → users.user_id |
12 | cancellation_reason | TEXT | Nullable — ləğv zamanı məcburi (BR-402-03) |
13 | cancelled_at | TIMESTAMP | Nullable |
14 | completed_at | TIMESTAMP | Nullable |
15 | created_at | TIMESTAMP | NOT NULL |
16 | updated_at | TIMESTAMP | NOT NULL |

İndekslər: idx_appointments_patient_status, idx_appointments_doctor_clinic, idx_appointments_booking_ref

### appointment_status_history
Randevunun bütün status dəyişiklikləri burada saxlanılır — randevu silinmir, tarixçəsi qalır (BR-402-05).
# | Field name | Data type | Comments |
1 | history_id | UUID | PK |
2 | appointment_id | UUID | FK → appointments.appointment_id |
3 | old_status | ENUM | Nullable — ilk qeyddə null |
4 | new_status | ENUM | NOT NULL |
5 | changed_by | UUID | Nullable, FK → users.user_id — sistem dəyişikliyində null |
6 | change_reason | TEXT | Nullable |
7 | old_slot_id | UUID | Nullable — reschedule halında köhnə slot |
8 | changed_at | TIMESTAMP | NOT NULL |

### appointment_documents
Randevu yaradılarkən əlavə edilən tibbi sənədlər. Sənəd əlavə edildikdə həkimə avtomatik giriş icazəsi yaradılır (FR-401-24).
# | Field name | Data type | Comments |
1 | appointment_document_id | UUID | PK |
2 | appointment_id | UUID | FK → appointments.appointment_id |
3 | document_id | UUID | FK → medical_documents.document_id |
4 | grant_id | UUID | Nullable, FK → document_access_grants — avtomatik yaradılan icazə |
5 | created_at | TIMESTAMP | NOT NULL |

Constraint: UNIQUE (appointment_id, document_id)

## Table(s) list — Hissə 2

# | Table name | Təyinat | Use Case |
25 | medical_documents | Tibbi sənədlərin metadata-sı | UC-501 |
26 | document_access_grants | Həkimə verilən müddətli giriş icazələri | UC-502, 503 |
27 | document_access_log | Sənədə hər baxışın qeydi | UC-502, 503 |
28 | drugs | Dərman kataloqu | UC-601, 904 |
29 | drug_interactions | Dərmanlar arası qarşılıqlı təsirlər | UC-601, 904 |
30 | prescriptions | Elektron reseptlər | UC-601, 602 |
31 | prescription_medications | Reseptdəki dərmanlar və dozalar | UC-601 |
32 | reviews | Pasient rəyləri və reytinqlər | UC-1101, 903 |
33 | review_replies | Həkimin rəyə cavabı | UC-1101 |
34 | review_reports | Rəy şikayətləri | UC-903, 1101 |
35 | notifications | Bildirişlər | UC-1001 |
36 | notification_deliveries | Kanal üzrə çatdırılma statusu | UC-1001 |
37 | scheduled_notifications | Planlaşdırılmış xatırlatmalar | UC-1001, 401 |
38 | notification_preferences | İstifadəçinin bildiriş tərcihləri | UC-104, 1001 |
39 | notification_templates | Çoxdilli bildiriş şablonları | UC-904 |
40 | audit_logs | Bütün sistem əməliyyatlarının qeydi (immutable) | UC-904 |
41 | security_events | Təhlükəsizlik hadisələri | UC-904 |
42 | system_settings | Konfiqurasiya parametrləri | UC-904 |
43 | cities | Şəhər kataloqu | UC-201, 202 |

## Modul 5 — Tibbi sənəd cədvəlləri

### medical_documents

# | Field name | Data type | Comments |
1 | document_id | UUID | PK |
2 | patient_id | UUID | FK → patients.patient_id — sənəd pasientin mülkiyyətidir (BR-501-01) |
3 | category | ENUM | LAB_RESULT / IMAGING / EPICRISIS / PRESCRIPTION / OTHER |
4 | file_name | VARCHAR(255) | NOT NULL — orijinal fayl adı |
5 | storage_path | VARCHAR(500) | NOT NULL — şifrələnmiş storage-dakı yol |
6 | file_size_bytes | INTEGER | NOT NULL — max 10 MB (BR-501-03) |
7 | mime_type | VARCHAR(50) | NOT NULL — application/pdf, image/jpeg, image/png |
8 | encryption_key_id | VARCHAR(100) | NOT NULL — AES-256 açar referensi (NFR-02) |
9 | document_date | DATE | Nullable — sənədin öz tarixi |
10 | description | TEXT | Nullable |
11 | virus_scan_status | ENUM | PENDING / CLEAN / INFECTED (NFR-08) |
12 | is_archived | BOOLEAN | Default: false |
13 | uploaded_at | TIMESTAMP | NOT NULL |
14 | deleted_at | TIMESTAMP | Nullable — 30 gün soft delete (BR-501-06) |

İndekslər: idx_documents_patient_category, idx_documents_deleted_at

### document_access_grants
Pasientin həkimə verdiyi müddətli giriş icazəsi. Platformanın ən həssas məxfilik mexanizmidir.
# | Field name | Data type | Comments |
1 | grant_id | UUID | PK |
2 | document_id | UUID | FK → medical_documents.document_id |
3 | doctor_id | UUID | FK → doctors.doctor_id |
4 | granted_by | UUID | FK → patients.patient_id — icazəni verən pasient |
5 | access_duration | ENUM | TWENTY_FOUR_HOURS / SEVEN_DAYS / THIRTY_DAYS / APPOINTMENT_PERIOD |
6 | status | ENUM | ACTIVE / EXPIRED / REVOKED |
7 | appointment_id | UUID | Nullable, FK → appointments — randevu ilə avtomatik yaradılıbsa |
8 | view_count | INTEGER | Default: 0 — pasientə göstərilir (FR-502-18) |
9 | granted_at | TIMESTAMP | NOT NULL |
10 | expires_at | TIMESTAMP | NOT NULL — müddət bitdikdə giriş avtomatik bağlanır (BR-502-02) |
11 | revoked_at | TIMESTAMP | Nullable — pasient əl ilə ləğv edibsə (BR-502-03) |

İndekslər: idx_grants_doctor_status, idx_grants_expires_at, idx_grants_document

### document_access_log
Hər baxış burada qeydə alınır. Pasient öz sənədinə kimin baxdığını görə bilir (BR-502-06).
# | Field name | Data type | Comments |
1 | access_log_id | UUID | PK |
2 | document_id | UUID | FK → medical_documents.document_id |
3 | grant_id | UUID | Nullable, FK → document_access_grants.grant_id |
4 | accessed_by | UUID | FK → users.user_id |
5 | access_type | ENUM | VIEW / DOWNLOAD_ATTEMPT / DENIED |
6 | ip_address | VARCHAR(45) | Nullable |
7 | accessed_at | TIMESTAMP | NOT NULL |

## Modul 6 — Resept cədvəlləri

### drugs
Super Admin tərəfindən idarə olunan dərman kataloqu. Klinik təhlükəsizlik yoxlamalarını qidalandırır.
# | Field name | Data type | Comments |
1 | drug_id | UUID | PK |
2 | trade_name | VARCHAR(150) | NOT NULL — ticarət adı |
3 | generic_name | VARCHAR(150) | Nullable — beynəlxalq patentsiz ad |
4 | form | VARCHAR(50) | Nullable — tablet, kapsul, şərbət, inyeksiya |
5 | strength | VARCHAR(50) | Nullable — məsələn "500 mq" |
6 | is_controlled | BOOLEAN | Default: false — nəzarətdə olan dərman (BR-601-08) |
7 | is_active | BOOLEAN | Default: true |
8 | created_at | TIMESTAMP | NOT NULL |

İndekslər: idx_drugs_trade_name, idx_drugs_generic_name

### drug_interactions
Resept yazılarkən avtomatik yoxlanılır (FR-601-23).
# | Field name | Data type | Comments |
1 | interaction_id | UUID | PK |
2 | drug_id_1 | UUID | FK → drugs.drug_id |
3 | drug_id_2 | UUID | FK → drugs.drug_id |
4 | severity | ENUM | MINOR / MODERATE / SEVERE — severe halda əlavə təsdiq |
5 | description | TEXT | NOT NULL — həkimə göstərilən izah |
6 | created_at | TIMESTAMP | NOT NULL |

Constraint: UNIQUE (drug_id_1, drug_id_2)

### prescriptions

# | Field name | Data type | Comments |
1 | prescription_id | UUID | PK |
2 | prescription_number | VARCHAR(30) | UNIQUE, Nullable — imzalandıqda yaradılır (BR-601-07) |
3 | appointment_id | UUID | FK → appointments.appointment_id |
4 | patient_id | UUID | FK → patients.patient_id |
5 | doctor_id | UUID | FK → doctors.doctor_id |
6 | diagnosis | TEXT | NOT NULL — admin görmür (BR-601-11) |
7 | icd10_code | VARCHAR(10) | Nullable |
8 | general_notes | TEXT | Nullable — ümumi tövsiyələr |
9 | status | ENUM | DRAFT / SIGNED / EXPIRED / CANCELLED / DISPENSED |
10 | digital_signature | TEXT | Nullable — imza dəyəri; olmadan resept etibarsızdır (BR-601-03) |
11 | signed_at | TIMESTAMP | Nullable |
12 | qr_code_token | VARCHAR(255) | Nullable — aptekdə doğrulama üçün |
13 | valid_until | DATE | Nullable — default 30 gün (BR-601-10) |
14 | cancelled_reason | TEXT | Nullable |
15 | cancelled_at | TIMESTAMP | Nullable — ləğv edilsə də silinmir (BR-601-06) |
16 | created_at | TIMESTAMP | NOT NULL |
17 | updated_at | TIMESTAMP | NOT NULL |

İndekslər: idx_prescriptions_patient_status, idx_prescriptions_number, idx_prescriptions_valid_until

### prescription_medications

# | Field name | Data type | Comments |
1 | prescription_medication_id | UUID | PK |
2 | prescription_id | UUID | FK → prescriptions.prescription_id |
3 | drug_id | UUID | Nullable, FK → drugs.drug_id — əl ilə daxil edilibsə null |
4 | drug_name_manual | VARCHAR(150) | Nullable — bazada yoxdursa (FR-601-16) |
5 | dosage | VARCHAR(100) | NOT NULL — məsələn "1 tablet" |
6 | frequency | VARCHAR(100) | NOT NULL — məsələn "gündə 2 dəfə" |
7 | duration_days | SMALLINT | Nullable |
8 | instructions | TEXT | Nullable — "yeməkdən sonra" |
9 | warning_overridden | BOOLEAN | Default: false — xəbərdarlıq ötürülübsə (BR-601-09) |
10 | override_reason | TEXT | Nullable — ötürmə səbəbi, hüquqi məsuliyyət üçün |
11 | created_at | TIMESTAMP | NOT NULL |

## Modul 11 — Rəy cədvəlləri

### reviews

# | Field name | Data type | Comments |
1 | review_id | UUID | PK |
2 | appointment_id | UUID | FK → appointments, UNIQUE — bir randevu = bir rəy (BR-1101-02) |
3 | patient_id | UUID | FK → patients.patient_id — anonim rəydə də saxlanılır (BR-1101-09) |
4 | doctor_id | UUID | FK → doctors.doctor_id |
5 | overall_rating | SMALLINT | NOT NULL — 1–5 (BR-1101-11) |
6 | professionalism_rating | SMALLINT | Nullable — 1–5 |
7 | attitude_rating | SMALLINT | Nullable — 1–5 |
8 | waiting_time_rating | SMALLINT | Nullable — 1–5 |
9 | comment | TEXT | Nullable — mətnsiz rəy mümkündür |
10 | is_anonymous | BOOLEAN | Default: false |
11 | status | ENUM | PENDING_MODERATION / PUBLISHED / REJECTED / REPORTED / WITHDRAWN |
12 | filter_flags | JSONB | Nullable — avtomatik filtrin aşkarladıqları |
13 | moderated_by | UUID | Nullable, FK → users.user_id |
14 | moderated_at | TIMESTAMP | Nullable |
15 | rejection_reason | TEXT | Nullable — pasientə bildirilir (BR-903-04) |
16 | created_at | TIMESTAMP | NOT NULL |
17 | updated_at | TIMESTAMP | NOT NULL — 24 saat ərzində redaktə (BR-1101-04) |

İndekslər: idx_reviews_doctor_status, idx_reviews_status_created

### review_replies

# | Field name | Data type | Comments |
1 | reply_id | UUID | PK |
2 | review_id | UUID | FK → reviews.review_id, UNIQUE |
3 | doctor_id | UUID | FK → doctors.doctor_id |
4 | reply_text | TEXT | NOT NULL |
5 | status | ENUM | PENDING_MODERATION / PUBLISHED / REJECTED (BR-903-11) |
6 | created_at | TIMESTAMP | NOT NULL |

### review_reports

# | Field name | Data type | Comments |
1 | report_id | UUID | PK |
2 | review_id | UUID | FK → reviews.review_id |
3 | reported_by | UUID | FK → users.user_id |
4 | report_reason | TEXT | NOT NULL |
5 | resolution | ENUM | Nullable — PENDING / UPHELD / DISMISSED |
6 | resolved_by | UUID | Nullable, FK → users.user_id |
7 | created_at | TIMESTAMP | NOT NULL |

## Modul 10 — Bildiriş cədvəlləri

### notifications

# | Field name | Data type | Comments |
1 | notification_id | UUID | PK |
2 | user_id | UUID | FK → users.user_id |
3 | notification_type | VARCHAR(50) | NOT NULL — APPOINTMENT_CONFIRMED, REMINDER_24H və s. |
4 | title | VARCHAR(150) | NOT NULL |
5 | body | TEXT | NOT NULL — tibbi məlumat olmamalıdır (BR-1001-05) |
6 | deep_link | VARCHAR(255) | Nullable — müvafiq ekrana keçid |
7 | related_entity_type | VARCHAR(50) | Nullable — APPOINTMENT / PRESCRIPTION / DOCUMENT |
8 | related_entity_id | UUID | Nullable |
9 | is_read | BOOLEAN | Default: false |
10 | read_at | TIMESTAMP | Nullable |
11 | created_at | TIMESTAMP | NOT NULL |

İndekslər: idx_notifications_user_read

### notification_deliveries
Bir bildiriş bir neçə kanaldan göndərilə bilər — hər kanal ayrıca sətirdir.
# | Field name | Data type | Comments |
1 | delivery_id | UUID | PK |
2 | notification_id | UUID | FK → notifications.notification_id |
3 | channel | ENUM | SMS / PUSH / EMAIL / IN_APP |
4 | status | ENUM | QUEUED / SENT / DELIVERED / FAILED |
5 | provider_message_id | VARCHAR(100) | Nullable — xarici servisin ID-si |
6 | error_message | TEXT | Nullable |
7 | retry_count | SMALLINT | Default: 0 |
8 | sent_at | TIMESTAMP | Nullable |
9 | delivered_at | TIMESTAMP | Nullable |

### scheduled_notifications
Randevu yaradılarkən planlaşdırılan xatırlatmalar. Göndərmədən əvvəl randevunun aktiv olduğu yoxlanılır (BR-1001-04).
# | Field name | Data type | Comments |
1 | scheduled_id | UUID | PK |
2 | user_id | UUID | FK → users.user_id |
3 | appointment_id | UUID | Nullable, FK → appointments.appointment_id |
4 | notification_type | VARCHAR(50) | NOT NULL — REMINDER_24H / REMINDER_2H / REVIEW_INVITE |
5 | scheduled_at | TIMESTAMP | NOT NULL — göndərmə vaxtı |
6 | status | ENUM | PENDING / SENT / CANCELLED / SKIPPED |
7 | cancelled_reason | VARCHAR(255) | Nullable — randevu ləğv edilibsə |
8 | created_at | TIMESTAMP | NOT NULL |

İndekslər: idx_scheduled_status_time — scheduler bu indeksdən istifadə edir

### notification_preferences

# | Field name | Data type | Comments |
1 | preference_id | UUID | PK |
2 | user_id | UUID | FK → users.user_id |
3 | notification_type | VARCHAR(50) | NOT NULL |
4 | sms_enabled | BOOLEAN | Default: true |
5 | push_enabled | BOOLEAN | Default: true |
6 | email_enabled | BOOLEAN | Default: false |
7 | is_mandatory | BOOLEAN | Default: false — true olduqda söndürülə bilmir (BR-1001-01) |

Constraint: UNIQUE (user_id, notification_type)

### notification_templates

# | Field name | Data type | Comments |
1 | template_id | UUID | PK |
2 | notification_type | VARCHAR(50) | NOT NULL |
3 | language_code | VARCHAR(2) | NOT NULL — az / ru / en (BR-904-07) |
4 | channel | ENUM | SMS / PUSH / EMAIL / IN_APP |
5 | title_template | VARCHAR(150) | Nullable — dəyişənlərlə: {doctorName} |
6 | body_template | TEXT | NOT NULL |
7 | is_active | BOOLEAN | Default: true |
8 | updated_at | TIMESTAMP | NOT NULL |

Constraint: UNIQUE (notification_type, language_code, channel)

## Sistem cədvəlləri

### audit_logs

# | Field name | Data type | Comments |
1 | audit_id | UUID | PK |
2 | user_id | UUID | Nullable, FK → users.user_id — sistem əməliyyatında null |
3 | user_role | ENUM | Nullable — əməliyyat anındakı rol |
4 | action | VARCHAR(100) | NOT NULL — CREATE_APPOINTMENT, VIEW_DOCUMENT və s. |
5 | entity_type | VARCHAR(50) | NOT NULL — APPOINTMENT / DOCUMENT / PRESCRIPTION |
6 | entity_id | UUID | Nullable |
7 | old_value | JSONB | Nullable — dəyişiklikdən əvvəlki vəziyyət |
8 | new_value | JSONB | Nullable |
9 | reason | TEXT | Nullable — admin əməliyyatlarında məcburi (BR-902-03) |
10 | ip_address | VARCHAR(45) | Nullable |
11 | user_agent | VARCHAR(255) | Nullable |
12 | created_at | TIMESTAMP | NOT NULL — dəyişdirilə bilməz |

İndekslər: idx_audit_user_created, idx_audit_entity, idx_audit_action

### security_events

# | Field name | Data type | Comments |
1 | event_id | UUID | PK |
2 | user_id | UUID | Nullable, FK → users.user_id |
3 | event_type | ENUM | FAILED_LOGIN / UNAUTHORIZED_ACCESS / MALWARE_DETECTED / SIMA_MISMATCH |
4 | severity | ENUM | LOW / MEDIUM / HIGH / CRITICAL |
5 | description | TEXT | NOT NULL |
6 | ip_address | VARCHAR(45) | Nullable |
7 | created_at | TIMESTAMP | NOT NULL |

### system_settings
Parametrlər kodda deyil, burada saxlanılır — dəyişiklik üçün yeni versiya buraxılışı tələb olunmur (NFR-34).
# | Field name | Data type | Comments |
1 | setting_id | UUID | PK |
2 | setting_key | VARCHAR(100) | UNIQUE, NOT NULL — məsələn slot_soft_lock_minutes |
3 | setting_value | VARCHAR(255) | NOT NULL |
4 | data_type | ENUM | INTEGER / STRING / BOOLEAN / DECIMAL |
5 | category | VARCHAR(50) | Nullable — appointment / notification / security |
6 | description | TEXT | Nullable |
7 | is_critical | BOOLEAN | Default: false — true olduqda əlavə təsdiq (BR-904-02) |
8 | updated_by | UUID | Nullable, FK → users.user_id |
9 | updated_at | TIMESTAMP | NOT NULL |

### cities

# | Field name | Data type | Comments |
1 | city_id | UUID | PK |
2 | name_az | VARCHAR(100) | NOT NULL |
3 | name_ru | VARCHAR(100) | Nullable |
4 | name_en | VARCHAR(100) | Nullable |
5 | is_active | BOOLEAN | Default: true |

## Əsas əlaqələr (Key Relationships)
Bazanın məntiqini anlamaq üçün ən vacib əlaqələr:
Əlaqə | Tip | İzah |
users → patients | 1:1 | Hər pasient hesabının bir profili var |
users → doctors | 1:1 | Hər həkim hesabının bir peşəkar profili var |
doctors ↔ clinics | M:N | doctor_clinics vasitəsilə — həkim bir neçə klinikada işləyə bilər |
doctor_clinics → doctor_schedules | 1:N | Cədvəl klinika üzrə ayrıdır |
doctor_clinics → appointment_slots | 1:N | Slotlar həkim–klinika kombinasiyasına bağlanır |
appointment_slots → appointments | 1:1 | Bir slot yalnız bir randevuya təyin edilə bilər |
patients → medical_documents | 1:N | Sənədlər pasientin mülkiyyətidir |
medical_documents ↔ doctors | M:N | document_access_grants vasitəsilə — müddətli icazə |
appointments → prescriptions | 1:N | Bir randevuda bir neçə resept yazıla bilər |
prescriptions → prescription_medications | 1:N | Bir reseptdə bir neçə dərman |
appointments → reviews | 1:1 | Bir randevu = bir rəy |

