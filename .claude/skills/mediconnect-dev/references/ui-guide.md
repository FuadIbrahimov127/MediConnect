# UI bələdçisi

Vizual mənbə `design/` qovluğundakı prototiplərdir (`../../../../design/MediConnect *.dc.html`). Ekranın dizaynına, mətnlərinə və mikro-qarşılıqlı təsirlərinə baxmaq üçün faylı brauzerdə aç və ya mətnini oxu (`<x-dc>` içində HTML şablonu, `<script data-dc-script>` içində state məntiqi var). Prototip mock datanı skriptin içində saxlayır; React versiyada bu data API-dən gəlir.

## Dizayn tokenləri (`client/src/styles/tokens.css`)

```css
:root{
  --accent:#F2785C; --accent-soft:#FDEDE8;
  --ink:#1C2220; --ink-soft:#5A6360; --muted:#8C9490;
  --bg:#EDEFEC; --bg-warm:#FAF9F7; --surface:#FFFFFF; --line:#E0E3DF;
  --success:#2F7D67; --warning:#B5741A; --danger:#C4453A;
  --footer-bg:#1C2220; --footer-ink:#EDEFEC; --footer-muted:#8C9490;
  --shadow:0 2px 12px rgba(28,34,32,.05); --shadow-float:0 8px 28px rgba(28,34,32,.10);
  --radius-pill:999px; --radius-card:20px; --radius-input:14px;
}
@media (prefers-color-scheme: dark){ :root{
  --ink:#EDEFEC; --ink-soft:#AEB5B1; --bg:#121716; --bg-warm:#171D1B; --surface:#1C2220; --line:#2C3432;
  --accent-soft:#2A211F; --footer-bg:#0D1211; --shadow:0 2px 12px rgba(0,0,0,.35); --shadow-float:0 8px 28px rgba(0,0,0,.45);
}}
```
- Font: **Plus Jakarta Sans** 400/500/600/700/800 (Google Fonts). Başlıqlar 700–800, `letter-spacing:-0.02em…-0.03em`.
- Loqo: `mediconnect` sözü + accent rəngli 6px nöqtə.
- Düymələr: hündürlük 46px, pill. Primary = accent fon + ağ mətn; secondary = surface fon + 1px ink border, hover-də ink fon. Eyebrow: 24×2px accent xətt + 12px uppercase accent mətn (`letter-spacing:.14em`).
- `:focus-visible { outline:2px solid var(--accent); outline-offset:3px }`.
- Breakpoint-lər: 920/980px (iki sütun → bir sütun, panel sidebar üstə keçir), 620px (mobil).
- Status badge rəngləri: CONFIRMED/ACTIVE/SIGNED/PUBLISHED → success; PENDING/PENDING_MODERATION/INVITED → warning; CANCELLED/REJECTED/BLOCKED/EXPIRED/NO_SHOW → danger yaxud muted; COMPLETED → ink-soft.
- Toast: sağ aşağıda; başlıq + izah; 4 saniyə qalır (prototipdəki kimi).

## Ekran ↔ prototip ↔ route

| Prototip faylı | Route-lar (spec) | UC |
|---|---|---|
| MediConnect Ana Səhifə | `/` | — |
| MediConnect Həkim Axtarışı | `/search/doctors`, `/search/clinics` (rejim seçicisi) | 201, 202 |
| MediConnect Həkim Profili | `/doctors/{doctorId}` (+ `/clinics/{clinicId}` eyni dizayn dili ilə) | 301, 302 |
| MediConnect Randevu | `/booking/{doctorId}` — klinika → xidmət → vaxt → təsdiq; 10 dəq taymer; booking reference ekranı | 401 |
| MediConnect Şəxsi Kabinet | `/account`, `/account/profile`, `/account/settings`, `/account/appointments[/{id}]`, `/account/documents`, `/account/documents/shares`, `/account/medical-history`, `/account/prescriptions[/{id}]`, `/account/notifications`, `/account/appointments/{id}/review` | 104, 402–404, 501–504, 602, 1001, 1101 |
| MediConnect Həkim Paneli | `/doctor`, `/doctor/profile`, `/doctor/schedule`, `/doctor/appointments[/{id}]`, `/doctor/patients/{patientId}/documents`, `/doctor/appointments/{id}/prescription` | 405, 503, 601, 701–703 |
| MediConnect Klinika Admin Paneli | `/clinic-admin`, `/clinic-admin/profile`, `/clinic-admin/doctors[/new\|/{id}]`, `/clinic-admin/doctors/{id}/schedule`, `/clinic-admin/services`, `/clinic-admin/appointments`, `/clinic-admin/reports` | 801–805 |
| MediConnect Super Admin Paneli | `/admin`, `/admin/clinics[/new\|/{id}/verify]`, `/admin/users[/{id}]`, `/admin/moderation/reviews`, `/admin/settings`, `/admin/audit-log` | 901–904 |
| (prototip yoxdur) | `/doctor/notifications`, `/clinic-admin/notifications`, `/admin/notifications` — bildiriş mərkəzi (əlavə; spec yalnız `/account/notifications` göstərir) | 1001 |
| (prototip yoxdur) | `/register`, `/login`, `/login/reset-pin`, `/invite/{token}` | 101–103, 802/901 dəvət |

Prototipi olmayan ekranlar (qeydiyyat, login, PIN bərpası, dəvət qəbulu) eyni tokenlərlə, mərkəzdə yerləşən kart formasında qurulur. Addım göstəricisi, OTP üçün 6 xanalı input, geri sayım, QR kod və maskalanmış 4 xanalı PIN input olur.

## Ümumi UI qaydaları

- **Layout:** public səhifələr üstdə sticky header və aşağıda footer ilə qurulur. Panellərin (`/account`, `/doctor`, `/clinic-admin`, `/admin`) solunda sidebar naviqasiya, yuxarıda səhifə başlığı, sağ üstdə bildiriş zəngi (oxunmamış sayğac) və profil menyusu olur.
- **Route guard-lar:** `RequireAuth` (yoxdursa `/login?returnUrl=`), `RequireRole`. Səhv rol öz panelinə yönləndirilir.
- **Server state:** `useApi`/`useMutation` hook-ları; hər sorğunun loading (skeleton), error (toast + yenidən cəhd) və empty state-i olur.
- **Formlar:** `shared/` zod sxemi ilə inline validasiya (sahənin altında, dərhal). Server `ValidationError.details.fields` qaytaranda sahələrə paylanır.
- **Filtrlər** URL query-də saxlanır (paylaşıla bilən link); aktiv filtrlər chip kimi göstərilir və chip-dəki × ilə silinir.
- **Təhlükəli əməliyyatlar** (ləğv, rədd, blok, silmə, xəbərdarlığı keçmək) təsdiq dialoqu açır, lazım olanda səbəb sahəsi məcburidir.
- **Taymerlər** (OTP 120s, QR 5 dəq, slot lock 10 dəq) server qaytardığı `expiresAt`-dən hesablanır, client öz başına vaxt təyin etmir.
- **Tarix formatı:** "22 sentyabr 2026, 14:30" (AZ ay adları), qısa forma "22 sen". Həftə günləri: B.e., Ç.a., Ç., C.a., C., Ş., B.
- **Əlçatanlıq:** semantik elementlər (`button`, `nav`, `main`), `aria-live` toast-lar üçün, ikon düymələrində `aria-label`, kontrast WCAG AA.
- **Dev panel** (`client/src/dev/DevPanel.tsx`, yalnız `import.meta.env.DEV` olanda): sağ aşağı küncdə dairəvi düymə. Tab-lar: *Rollar* (bir kliklə login-as), *SMS/Push/Email* (outbox, OTP kodları), *SİMA* (pending sessiyalar → Uğurlu/Uğursuz/FIN uyğunsuzluğu), *Saat* (+1 saat, +1 gün, +7 gün, sıfırla, job-ları işə sal), *Nasazlıqlar* (servisləri söndür), *Data* (reset). Dizayn tokenlərindən istifadə edir, amma "DEV" etiketi ilə məhsul UI-dan aydın fərqlənir.
