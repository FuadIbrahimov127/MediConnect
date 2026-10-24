    # Roadmap və status

Status: ⬜ başlanmayıb · 🟨 davam edir · ✅ hazır (DoD ödənib) · ⏸ təxirə salınıb (səbəbi yaz).
İş bitəndə statusu, tarixi və qeydi yenilə. Mərhələlər ardıcıldır; mərhələ daxilində sıra tövsiyədir.

## Mərhələ 0 — Karkas ✅ (2026-10-23)
- ✅ `website/` npm workspaces: `shared`, `mock-server`, `client`; `npm run dev` (concurrently), `seed`, `typecheck`, `test`
- ✅ shared: enum-lar, ApiResponse/ApiError tipləri, ilk zod sxemləri
- ✅ mock-server core: clock, errors+messages, respond/errorHandler, auth middleware, access, audit, security, settings, validate
- ✅ store: db (load/save), repo helper-ləri, seed karkası (settings, cities, specialties, services, languages)
- ✅ integrations: faults, sms/push/email outbox, notify() karkası, şablonlar (az)
- ✅ scheduler karkası + `/__dev` endpoint-ləri (state, reset, outbox, clock, jobs, faults, users, login-as)
- ✅ client: Vite + Router, tokens.css, layout-lar (public, panel), api client (zərf/xəta emalı, Bearer, 401 → login), AuthContext, guard-lar, Toast, i18n (az), DevPanel
- ✅ DEMO.md karkası
- ✅ Əlavə: ana səhifə (`/`) statik hissələri + kataloqdan axtarış paneli; bildiriş mərkəzi (UC-1001 alt 1) bütün rollar üçün (`/<panel>/notifications`)
- Qeyd: SİMA simulyatoru tabı yer tutucudur — Mərhələ 1-də (UC-101) dolacaq

## Mərhələ 1 — Autentifikasiya və profil ✅ (2026-10-23)
- ✅ UC-101 Patient Registration (OTP + SİMA simulyatoru + PIN + razılıq + return URL)
- ✅ UC-102 User Login (lookup, PIN, lock, rol yönləndirməsi, yeni cihaz bildirişi, sessiya timeout, biometrik simulyasiya)
- ✅ UC-103 PIN Reset
- ✅ UC-104 Profile Management (tibbi profil, allergiyalar, parametrlər, razılığın geri götürülməsi, hesab silmə tələbi)
- Qeyd: həkim, klinika admini və super admin üçün PIN dəyişikliyi/parametrlər ekranı hələ yoxdur (API hazırdır: PATCH /profile/pin, /profile/settings) — Mərhələ 4/7/8-də panellərə əlavə olunacaq
- Qeyd: SİMA ilə gələn foto (FR-104-03) əvəzinə profil şəkli data URL kimi saxlanılır (mock-da fayl storage Mərhələ 5-də)

## Mərhələ 2 — Kataloq, cədvəl, axtarış ✅ (2026-10-23)
- ✅ Seed: 6 klinika (1-i verifikasiya gözləyir), 12 həkim (2-si gizli: profil tamamlanmayıb / bağlantı INACTIVE), cədvəllər, xidmətlər, keçmiş qəbullar + dərc olunmuş rəylər (reytinqlər bunlardan hesablanır)
- ✅ Slot generasiyası (schedule.service: fasilə, bufer, istisnalar, klinika saatları) + rollSlotGeneration və releaseExpiredLocks job-ları
- ✅ UC-201 Search Doctors (fuzzy, autocomplete, son axtarışlar, bütün filtrlər URL-də, facet sayları, təkliflər) · ✅ UC-202 Search Clinics
- ✅ UC-301 Doctor Detail (klinika üzrə slotlar, uzun xidmətlər üçün slot zənciri, rəylər) · ✅ UC-302 Clinic Detail
- ✅ Ana səhifə (`/`): real statistika, seçilmiş həkimlər, ixtisas sayları
- ⏸ Təxirə salınanlar (Should): favoritlər (FR-301-29), klinika axtarışında xəritə görünüşü (FR-202-17), rayon filtri (FR-201-10 — yalnız şəhər)

## Mərhələ 3 — Randevu (əsas dəyər) ✅ (2026-10-23)
- ✅ UC-401 Book Appointment (lock + zəncir, 10 dəq taymer, BR-lər, booking ref, bildirişlər, xatırlatmalar, .ics)
- ✅ UC-404 My Appointments (tab-lar, QR booking ref, .ics, allowedActions/blockedReasons serverdən)
- ✅ UC-402 Cancel (pasient UI; həkim/admin API) · ✅ UC-403 Reschedule (pasient UI; həkim/admin təklifi API + pasientin cavab UI-si)
- 🟨 UC-405 Completion & No-Show — server + job-lar hazırdır (autoComplete, F3, no-show düzəlişi); həkim UI-si Mərhələ 4-də
- ✅ UC-1001 Notification Delivery — bildiriş mərkəzi, tərcihlər, xatırlatma job-u, fallback, quiet hours
- Qeyd: randevuya sənəd əlavə etmə (FR-401-23, FR-404-15) server tərəfdə hazırdır (documentIds), UI Mərhələ 5-də (sənəd modulu ilə)

## Mərhələ 4 — Həkim paneli ✅ (2026-10-23)
- ✅ UC-701 Doctor Profile Setup (ilk girişdə yönləndirmə, məcburi sahələr, kilidli sahələr, təsdiq rejimi, adminə bildiriş)
- ✅ UC-702 Doctor Schedule Management (həftəlik təqvim, şablon redaktoru, validasiya, iki klinika qadağası, konflikt → ləğv et və xəbərdar et, istisnalar, tək slot bloku)
- ✅ UC-703 Doctor Appointment Management (tab-lar, klinika filtri, həftəlik görünüş, pasient konteksti, təsdiq/rədd/ləğv/köçürmə təklifi) · ✅ UC-405 həkim UI-si (tamamla + müayinə qeydi, gəlmədi)
- Qeyd: cədvəl redaktoru (features/schedule/ScheduleEditor) klinika admini üçün də istifadə olunacaq (UC-803) — ScheduleApi adapteri ilə
- Qeyd: "Cədvəli şablon kimi digər klinikaya köçür" (UC-702 alt 5) ayrıca düymə yoxdur; şablon redaktorunda B.e.–C. üçün köçürmə var

## Mərhələ 5 — Tibbi sənədlər ✅ (2026-10-23)
- ✅ UC-501 Upload (AES-256-GCM, ayrıca keyring, magic-byte mime, EICAR antivirus mock, kateqoriya/tarix/təsvir, arxiv, soft delete + bərpa, purge job)
- ✅ UC-502 Grants (həkim seçimi, müddət, toplu paylaşım, uzatma, ləğv, giriş jurnalı; randevuya əlavə → avtomatik icazə; expire job; ləğv/deaktivasiyada revoke)
- ✅ UC-503 Doctor Views (yalnız aktiv icazəlilər, birdəfəlik 60 san. signed URL, viewer, yükləmə cəhdi audit olunur)
- ✅ UC-504 Medical History (pasient tarixçəsi + filtrlər, çap/PDF; həkimə icazəli tarixçə)
- ✅ Bronlama addım 3-də və randevu detalında "Sənəd əlavə et"
- Qeyd: PDF ixracı brauzerin çap dialoqu ilə (print CSS) edilir

## Mərhələ 6 — E-resept ✅ (2026-10-23)
- ✅ UC-601 Create E-Prescription (lisenziya/sertifikat, randevu şərti, avtodoldurma, dərman axtarışı + əl ilə, allergiya/qarşılıqlı təsir/nəzarətdə olan/yaş yoxlamaları, səbəbli ötürmə, önizləmə, PIN ilə imza mock-u, imza xətası → draft, şablon, təkrar, draft, ləğv, audit)
- ✅ UC-602 Patient Views Prescription (qruplar, detal, QR doğrulama səhifəsi, PDF + çap, dərman məlumatı, təkrar resept sorğusu → həkim təsdiqi/rəddi, EXPIRED job)
- Qeyd: dərman kataloqu 28 dərman + 12 qarşılıqlı təsir (seed-data/drugs.ts); idarəetmə UI-si UC-904-də (Mərhələ 8)
- Qeyd: server PDF-i Helvetica ilə (ASCII transliterasiya); tam Azərbaycan hərfləri üçün səhifənin çap görünüşü istifadə olunur

## Mərhələ 7 — Klinika admin ✅ (2026-10-23)
- ✅ UC-801 Clinic Profile (SA sahələri read-only, əlaqə/ünvan/koordinat xəbərdarlığı, loqo, foto + drag-and-drop sıralama, sığortalar, iş saatları + həkim/randevu konflikti, bayram günləri, müvəqqəti bağlama)
- ✅ UC-802 Doctor Management (FIN yoxlaması, yeni/mövcud həkim, lisenziya unikallığı və tarixi, sənəd yükləmə, SMS dəvəti 7 gün, `/invite/{token}` SİMA + PIN, rədd, təkrar göndərmə, passiv/aktiv, lisenziya yeniləmə, çıxarma + randevu qərarı, lisenziya job-u: 30/7/1 gün xəbərdarlıq və avtomatik dayandırma)
- ✅ UC-803 Admin Manages Schedule (həkim redaktoru adapterlə, təcili gün bağlama: ləğv və ya eyni ixtisaslı həkimə köçürmə — pasient təsdiqi ilə, kabinet konflikti xəbərdarlığı)
- ✅ UC-804 Services (kataloqdan seçim, həkim + müddət, ixtisas/slot xəbərdarlığı, dayandırma, aktiv randevulu silmə bloku, kataloqa tələb)
- ✅ UC-805 Oversight & Reports (tibbi məzmunsuz siyahı + filtrlər, detal: ləğv/köçürmə təklifi/no-show/düzəliş, toplu ləğv, gündəlik/həkim/no-show/yük hesabatları, CSV + PDF export)
- Qeyd: "Ümumi cədvəl görünüşü" (UC-803 alt 4, Should) ayrıca ekran kimi yoxdur — hər həkimin cədvəli ayrıca açılır
- Qeyd: fayllar (loqo, foto, lisenziya) multipart əvəzinə JSON data URL kimi göndərilir (mock sadələşdirməsi, server məzmunu yoxlayır)

## Mərhələ 8 — Super admin ✅ (2026-10-24)
- ✅ UC-901 Clinic Onboarding (yarat və təsdiqlə / gözləmə statusu, qeydiyyat nömrəsi unikallığı, lisenziya tarixi, Nazirlik reyestri mock-u, rəsmi sənədlər (şifrələnmiş), admin dəvəti → SİMA → PIN, əlavə sənəd tələbi, rədd + təhlükəsizlik hadisəsi, dayandırma/bərpa/deaktivləşdirmə, ikinci admin, lisenziya yeniləmə, lisenziya job-u)
- ✅ UC-902 User Management (FIN/telefon/ad axtarışı, rol/status/klinika/tarix filtri, metadata + sessiyalar + statistika + audit, blokla/çıxar, sessiyaları bağla, anonimləşdirmə; öz hesabı, aktiv randevulu həkim, yeganə admin qorumaları)
- ✅ UC-904 System Configuration & Audit (parametrlər + kritik təsdiq + tarixçə, ixtisas/xidmət/dərman/qarşılıqlı təsir kataloqları, klinika xidmət tələblərinin təsdiqi, çoxdilli bildiriş şablonları, immutable audit log + CSV, təhlükəsizlik hadisələri, platforma statistikası)
- Qeyd: UC-902 "rol dəyiş" əməliyyatı yoxdur (EF-902-5 rol konflikti səbəbindən — rol dəyişikliyi yeni hesab kimi edilir); şəhər kataloqu UI-dən idarə olunmur
- Qeyd: klinikanın "müraciət forması" (UC-901 alt 1) mock-da yoxdur — müraciət platformadan kənar qəbul edilir

## Mərhələ 9 — Rəy və moderasiya ✅ (2026-10-24)
- ✅ UC-1101 Submit Review (uyğunluq: COMPLETED, no-show, 30 gün, təkrar; 1–5 ulduz + alt reytinqlər, anonim, avtomatik filtr, 24 saat redaktə — köhnə versiya moderasiyaya qədər görünür, dəvət + bir dəfəlik xatırlatma, həkim cavabı, şikayət)
- ✅ UC-903 Content Moderation (növbələr: gözləyən/şikayət/cavablar/rədd/dərc, filtr nəticəsi, təsdiq, redaktə edilmiş versiya ilə dərc, rədd səbəbi, geri çəkmə, şikayətin rəddi, toplu təsdiq, filtr qaydaları və həssaslıq, reytinq yenidən hesablanması, audit)
- Qeyd: bütün ComingSoon yer tutucuları real səhifələrlə əvəz olundu

## Mərhələ 10 — Cilalama
- ✅ RU/EN tərcümələr (header-də AZ/RU/EN, `mc.lang`, profil `preferredLanguage`; bütün public, auth, pasient, həkim, klinika admini və super admin səhifələri `t()` açarları ilə; `ru.ts`/`en.ts` `Dict` tipi ilə tam yoxlanır; shared enum etiketləri `i18n/labels.ts`; söz sırası fərqli cümlələr üçün `i18n/Rich.tsx`; server axtarış məsləhətləri `Accept-Language` ilə. Qalır: server tərəfi xəta/bildiriş mətnləri, ixtisas/xidmət adları — kataloqda `nameRu/nameEn` var, API hələ AZ qaytarır) · ⬜ responsive yoxlaması (≤620px) · ⬜ a11y yoxlaması · ⬜ performans (NFR-18/19) · ✅ Dark/Light rejim keçidi (Sistem/Açıq/Tünd, header-də, localStorage, ilk boyamadan əvvəl tətbiq — lib/theme.ts, tokens.css data-theme) · ⬜ DEMO.md tam ssenari ("bir günlük platforma" end-to-end)

## Təxirə salınanlar (Phase 2, scope xaricində)
Mobil tətbiq, telemedicine, aptek inteqrasiyası (DISPENSED), e-health.gov.az inteqrasiyası, online ödəniş.
