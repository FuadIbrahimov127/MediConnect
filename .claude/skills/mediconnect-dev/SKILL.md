---
name: mediconnect-dev
description: MediConnect səhiyyə platformasının (həkim axtarışı, randevu, tibbi sənəd, e-resept, klinika/super admin panelləri) website/ qovluğunda development qaydaları. Lokal mock backend (Express + in-memory/JSON store) spesifikasiyadakı /v1 API müqaviləsini və biznes qaydalarını real kimi icra edir; React frontend Confluence "Mediconnect Final" spesifikasiyasına və .dc.html prototiplərinə uyğun qurulur. MediConnect-də hər hansı ekran, endpoint, use case (UC-xxx), biznes qaydası (BR-xxx), mock data və ya demo ssenarisi üzərində işləyəndə istifadə et.
---

# MediConnect — development skill

MediConnect Azərbaycan üçün səhiyyə platformasıdır: pasient həkim tapır, randevu alır, tibbi sənədlərini saxlayır və həkimlə müddətli paylaşır, e-resept alır. Həkim, klinika admini və super admin üçün ayrıca panellər var. **Platformada qiymət və ödəniş yoxdur.**

Bütün kod `website/` qovluğundadır. Backend hələlik **mock**-dur, amma "saxta ekran" deyil. O, lokal işləyən real HTTP serverdir və spesifikasiyadakı biznes qaydalarını icra edir: soft lock, double-booking qadağası, OTP, SİMA callback imzası, signed URL, AES-256 şifrələmə, audit log və scheduler job-ları. Məqsəd bütün funksionallığı lokalda nümayiş etdirməkdir. Sonra real backend eyni API müqaviləsi ilə mock-un yerinə qoşulacaq.

## Həqiqət mənbələri (prioritet sırası ilə)

1. `references/spec-full.md` — Confluence spesifikasiyasının tam mətni (UC, FR, BR, EF, NFR, API, enum, DB). Ziddiyyət olanda bu qalib gəlir.
2. `references/domain-rules.md` — rollar, görmə matrisləri, status maşınları, sistem parametrləri, spec boşluqları üçün qəbul edilmiş fərziyyələr.
3. `references/api-contract.md` — cavab zərfi, xəta kataloqu, enum-lar, bütün endpoint-lər (spec-dəkilər + əlavələr).
4. `references/data-model.md` — store kolleksiyaları (DB cədvəllərinin güzgüsü) və açar constraint-lər.
5. `references/mock-backend.md` — mock serverin arxitekturası, xarici servis simulyatorları, dev alətləri, seed data.
6. `references/ui-guide.md` — dizayn tokenləri, prototip ↔ route xəritəsi, UI qaydaları.
7. `references/roadmap.md` — mərhələli plan və hər UC-nin statusu. İşə başlamazdan əvvəl oxu, iş bitəndə yenilə.

Vizual dizayn mənbəyi `design/` qovluğundakı `MediConnect *.dc.html` prototipləridir (8 ekran). Onları brauzerdə açıb baxmaq olar. Bu fayllar `support.js` runtime-ı ilə işləyir. Kodu köçürmə: dizaynı, mətnləri və axını React komponentləri kimi yenidən qur.

Bir UC üzərində işləyəndə `spec-full.md`-də onun hər iki bölməsini oxu. Use Case cədvəlində axın, alternativ və xəta halları, BR-lər var. Functional Requirements cədvəlində isə FR-xxx-NN sətirləri və Must/Should prioriteti var. Misal: `grep -n "UC-401\|FR-401-\|BR-401-\|EF-401-" references/spec-full.md`.

## Texniki stek (dəyişmə, əsaslandırmadan)

```
website/
  package.json            npm workspaces; "dev" hər ikisini birlikdə qaldırır (concurrently)
  shared/                 TS tiplər: enum-lar, DTO-lar, zod sxemləri, xəta tipləri — client və server birlikdə istifadə edir
  mock-server/            Node 24 + Express + TypeScript (tsx ilə), port 4000
    src/{core,store,services,routes,serializers,integrations,jobs,dev}/
    data/db.json          persist olunan store (gitignore), data/storage/ şifrələnmiş fayllar
  client/                 Vite + React 18 + TypeScript + React Router, port 5173
    src/{api,auth,components,features/<modul>,pages,i18n,styles,dev}/
  DEMO.md                 nümayiş ssenariləri (hər UC üçün addım-addım)
```

- Client yalnız `/v1/*`-ə müraciət edir; Vite proxy `/v1` və `/__dev`-i `http://localhost:4000`-ə yönləndirir. Base URL `VITE_API_BASE_URL` ilə dəyişir, real backendə keçid üçün yalnız bu kifayət etməlidir.
- Validasiya: `shared/` içində zod sxemləri. Client form validasiyası və server request validasiyası **eyni sxemi** istifadə edir.
- Əlavə ağır kitabxana (UI kit, state manager, ORM) gətirmə. React state + kiçik `useApi` hook-ları kifayətdir; CSS üçün `styles/tokens.css` + CSS Modules.
- Əmrlər: `npm install`, `npm run dev`, `npm run seed` (store-u sıfırla), `npm run typecheck`, `npm test` (mock-server servis testləri, vitest).

## Mütləq qaydalar (pozulması = bug)

1. **API müqaviləsi.** Endpoint path-ları, sahə adları (camelCase), enum dəyərləri (UPPER_SNAKE) və cavab zərfi `{status, message, data}` / `{status:"ERROR", errorType, message, timestamp}` spec-dəki kimi olmalıdır. Spec-də olmayan endpoint lazımdırsa, `api-contract.md`-dəki konvensiyaya uyğun yarat və ora "Əlavə" kimi yaz. Diqqət: qeydiyyatda `pin` = **FIN**, `userPin` = 4 rəqəmli PIN-dir (spec-in adlandırması belədir).
2. **Biznes qaydaları serverdə.** Hər BR mock-server `services/` qatında yoxlanır, UI isə yalnız əks etdirir (düyməni gizlətmək qoruma sayılmır). Məsələn ləğvə 1 saatdan az qalıbsa UI düyməni deaktiv edir, server də 422 `CancellationTooLate` qaytarır.
3. **Məxfilik, rol və sahiblik.** Hər endpoint `requireRole` + sahiblik yoxlaması edir. Clinic Admin və Super Admin tibbi məzmun (şikayət mətni, `doctorNote`, diaqnoz, resept, sənəd məzmunu) **heç vaxt** almır. Bu, role-specific serializer-lərlə təmin olunur, frontend-də gizlətməklə yox. Başqasının resursuna cəhd 403/404 qaytarır və `security_events`-ə yazılır. Matrislər `domain-rules.md`-dədir.
4. **Audit.** Hər mutasiya və hər tibbi məlumata baxış `audit_logs`-a yazılır: append-only, update/delete funksiyası yoxdur. Admin əməliyyatlarında `reason` məcburidir.
5. **Parametrlər kodda yox, `system_settings`-dədir.** 10 dəqiqə, 120 saniyə, 60 gün kimi dəyərləri hardcode etmə; `getSetting('slot_soft_lock_minutes')` istifadə et.
6. **Vaxt.** Server həmişə `clock.now()` çağırır (`Date.now()` yox), çünki dev panel vaxtı irəli çəkə bilir. Saxlama ISO UTC-də, göstərmə `Asia/Baku` (UTC+4) ilə.
7. **Soft delete.** Tibbi və audit əhəmiyyətli qeydlər fiziki silinmir (`deletedAt`). Ləğv edilmiş randevu və resept statusu dəyişir, qeyd qalır.
8. **Bildirişlərdə tibbi sirr olmur** (diaqnoz, dərman adı yoxdur). Bildiriş servisi xəta versə də əsas əməliyyat uğurlu qalır (async).
9. **Mock sərhədi.** Xarici sistemlər (SİMA, SMS, email, push, rəqəmsal imza, antivirus, storage) yalnız `integrations/` adapterlərində simulyasiya olunur. Biznes kodu adapter interfeysini çağırır, mock detalını bilmir. `/__dev/*` endpoint-ləri yalnız `MOCK_DEV_TOOLS=true` olanda qoşulur.
10. **Dil.** UI mətnləri Azərbaycan dilindədir (`i18n/az.ts`); RU/EN açarları eyni strukturda saxlanır (NFR-28). Xəta mesajları istifadəçi dilindədir, texniki kod göstərilmir (NFR-32).
11. **Qiymət yoxdur.** Heç bir ekranda qiymət sahəsi və filtri olmur. Lazım olan yerdə "Müayinənin dəyəri klinikada müəyyən edilir" qeydi göstərilir.

## Bir use case-i implement etmə axını

1. `roadmap.md`-də UC-nin mərhələsini və asılılıqlarını yoxla.
2. `spec-full.md`-dən UC + FR + BR + EF bölmələrini, `domain-rules.md`-dən aid status maşınını və görmə matrisini oxu.
3. **shared:** enum, DTO və zod sxemləri əlavə et və ya yenilə.
4. **mock-server:** əvvəl `services/<modul>.ts` (biznes məntiqi, hər BR üçün aydın yoxlama və düzgün `errorType`), sonra nazik `routes/`, ardınca `serializers/` (rola görə). Lazımdırsa scheduler job, bildiriş hadisəsi və audit qeydi əlavə et.
5. **Seed:** UC-ni nümayiş etdirmək üçün lazım olan data `store/seed.ts`-də olmalıdır (məs. sabah üçün boş slot, 25 dəqiqə sonra başlayan randevu, müddəti 2 gün sonra bitən icazə).
6. **Test:** `mock-server` üçün vitest. Uğurlu axın + hər EF halı + rol/sahiblik rəddi. Testlər `clock`-u idarə edir.
7. **client:** `features/<modul>/` altında API funksiyaları, hook-lar və komponentlər; səhifə route-u spec-dəki URL ilə eynidir. Loading (skeleton), empty state, xəta toast-u və inline validasiyanı unutma.
8. **DEMO.md:** UC üçün nümayiş ssenarisini əlavə et: hansı rol, hansı seed istifadəçi, hansı addımlar, hansı dev panel əməliyyatı (OTP-ni gör, SİMA-nı təsdiqlə, vaxtı +24 saat irəli çək).
9. `npm run typecheck && npm test`, sonra brauzerdə axını əl ilə yoxla.
10. `roadmap.md`-də statusu yenilə; spec boşluğu üçün fərziyyə qəbul etmisənsə, `domain-rules.md` → "Fərziyyələr" bölməsinə yaz.

## Hazırdır meyarı (Definition of Done)

- Spec-dəki bütün **Must** FR-lər işləyir. **Should** FR-lər ya işləyir, ya da `roadmap.md`-də açıq qeyd olunub.
- Hər EF halı server cavabı ilə reproduksiya olunur və UI-da istifadəçi dilində göstərilir.
- Rol pozuntusu yoxlanıb: ən azı bir test başqa rolun və ya başqa sahibin cəhdini rədd edir.
- Audit qeydi yazılır; bildiriş hadisəsi lazımdırsa göndərilir.
- Mobil (≤620px) və desktop-da layout pozulmur; klaviatura ilə istifadə mümkündür (focus-visible).
- DEMO.md ssenarisi təzə `npm run seed`-dən sonra işləyir.

## Tez-tez səhvlər

- Slot lock-u client taymeri ilə idarə etmək. Taymer yalnız göstəricidir; lock-un etibarlılığını server `lockedUntil` ilə yoxlayır.
- `GET` endpoint-lərdə sahiblik yoxlamasını unutmaq (`/v1/appointments/{id}` başqasının randevusudursa 404 qaytar + security event yaz).
- Klinika admininə randevu siyahısında `patientNote` göndərmək.
- Reytinqi bütün rəylərdən hesablamaq (yalnız `PUBLISHED`), yaxud rəysiz həkimə 0 göstərmək (`null` + "Yeni həkim").
- Reschedule-da köhnə slotu yeni slot təsdiqlənməmiş buraxmaq (BR-403-03).
- Planlaşdırılmış xatırlatmanı göndərməzdən əvvəl randevunun hələ aktiv olduğunu yoxlamamaq.
