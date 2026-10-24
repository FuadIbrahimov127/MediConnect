# MediConnect

Azərbaycan üçün səhiyyə platforması: pasient həkim tapır, onlayn randevu alır, tibbi sənədlərini saxlayır və həkimlə müddətli paylaşır, e-resept alır. Həkim, klinika admini və super admin üçün ayrıca panellər var. Platformada qiymət və ödəniş yoxdur.

## Repo strukturu

| Qovluq | Məzmun |
|---|---|
| [`website/`](website/) | Tətbiqin kodu: React client, lokal mock backend (Express), ortaq tiplər və validasiya |
| [`it-ba/`](it-ba/) | IT biznes analizi: "Mediconnect Final" spesifikasiyası (use case, FR, BR, NFR, API, data model) |
| [`design/`](design/) | UI prototipləri (`.dc.html` ekranları) |

## Tez başlanğıc

Tələb: Node.js 24+.

```bash
cd website
npm install
npm run dev        # mock server :4000 + client :5173
```

Brauzerdə `http://localhost:5173` açın. Nümayiş ssenariləri və test istifadəçiləri [`website/DEMO.md`](website/DEMO.md)-dədir.

| Əmr | Nə edir |
|---|---|
| `npm run dev` | Mock server və client-i birlikdə qaldırır |
| `npm run seed` | Demo məlumatları sıfırlayır |
| `npm test` | Mock server testləri (vitest) |
| `npm run typecheck` | Bütün paketlərin TypeScript yoxlaması |
| `npm run build` | Client-in production build-i |

## Texnologiyalar

- **Client:** Vite, React 18, TypeScript, React Router, CSS Modules; AZ/RU/EN, açıq/tünd rejim
- **Mock backend:** Node.js, Express 5, TypeScript, vitest. Spesifikasiyadakı `/v1` API müqaviləsini və biznes qaydalarını real icra edir (soft lock, OTP, SİMA simulyasiyası, şifrələnmiş fayl saxlama, audit log, scheduler)
- **Shared:** zod sxemləri və DTO-lar (client və server eyni validasiyanı istifadə edir)

Mock backend gələcəkdə real backend ilə eyni API müqaviləsi üzrə əvəz olunacaq.
