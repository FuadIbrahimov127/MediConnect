# MediConnect — website

Həkim axtarışı, randevu, tibbi sənəd və e-resept platforması. Backend hələlik **lokal mock**-dur: real HTTP server spesifikasiyadakı `/v1` API-ni və biznes qaydalarını icra edir.

## İşə salmaq

```bash
npm install
npm run dev        # mock server (http://localhost:4000) + sayt (http://localhost:5173)
```

Brauzerdə http://localhost:5173 açın. Sol aşağı küncdəki **DEV — Demo alətləri** düyməsi ilə:
- **Rollar** — bir kliklə pasient, həkim, klinika admini və ya super admin kimi daxil olun (bütün demo PIN-lər: `2580`)
- **Mesajlar** — mock SMS, push və email qutusu (OTP kodları burada görünür)
- **SİMA** — şəxsiyyət doğrulamasının simulyatoru
- **Saat** — server saatını irəli çəkmək (xatırlatmalar, müddətlərin bitməsi)
- **Nasazlıqlar** — xarici servisi "söndürmək" (xəta ssenariləri)
- **Data** — demo datanı sıfırlamaq

## Əmrlər

| Əmr | Nə edir |
|---|---|
| `npm run dev` | hər iki serveri qaldırır |
| `npm run seed` | store-u (`mock-server/data/`) demo vəziyyətinə qaytarır |
| `npm run typecheck` | shared + mock-server + client |
| `npm test` | mock-server servis testləri (vitest) |
| `npm run build` | client production build |

## Quruluş

```
shared/        enum-lar, DTO-lar, zod sxemləri, xəta kataloqu (client + server ortaq)
mock-server/   Express + TS: core/ store/ services/ routes/ serializers/ integrations/ jobs/ dev/
client/        Vite + React + TS: hər səhifə öz route-unda (spec "Səhifə xəritəsi")
DEMO.md        nümayiş ssenariləri
```

Real backendə keçid: `client/.env.local` faylında `VITE_API_BASE_URL=https://api.mediconnect.az` yazın.

Development qaydaları, API müqaviləsi və roadmap: `../.claude/skills/mediconnect-dev/`.
