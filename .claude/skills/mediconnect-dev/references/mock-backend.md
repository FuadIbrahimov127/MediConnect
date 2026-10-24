# Mock backend arxitekturası

Məqsəd: real backend hazır olmadan **bütün funksionallığı lokalda canlı göstərmək**. Mock server bir HTTP API-dir və `/v1` müqaviləsini icra edir. Postman, curl və frontend eyni cür işləyir. Biznes məntiqi realdır; yalnız xarici sistemlər (SİMA, SMS, imza və s.) simulyasiyadır və dev panel vasitəsilə idarə olunur.

## Qovluq quruluşu

```
mock-server/
  src/
    index.ts                 express app, middleware zənciri, router-lər, error handler, scheduler start
    config.ts                PORT=4000, MOCK_DEV_TOOLS, MOCK_LATENCY_MS, MOCK_SECRET (HMAC), DATA_DIR
    core/
      clock.ts               now(), offset (dev time travel), Bakı TZ köməkçiləri (toBakuDate, bakuDateTime)
      errors.ts              class ApiError(http, errorType, details?) ; throw new ApiError(422,'CancellationTooLate')
      messages.ts            errorType/success açarı → {az, ru, en}
      respond.ts             ok(res, data, messageKey?, http=200) ; errorHandler (ZodError → 400 ValidationError)
      auth.ts                authenticate (Bearer → session, sliding expiry), requireRole(...roles), currentUser
      access.ts              assertOwner / assertClinicScope / assertDoctorOwnsAppointment → uğursuzda security event + 404/403
      audit.ts               audit({action, entityType, entityId, oldValue, newValue, reason}) — yalnız insert
      security.ts            securityEvent(type, severity, description)
      settings.ts            getSetting<number>(key), setSetting (validasiya + audit)
      validate.ts            zod body/query middleware (shared/ sxemləri)
    store/
      db.ts                  in-memory kolleksiyalar; load(data/db.json); scheduleSave() debounce 500ms; transaction(fn) — sinxron
      repo.ts                generic helper-lər: find, findOne, insert (id+timestamps), update, softDelete, unique yoxlaması
      seed.ts                deterministik seed (bax aşağı); `npm run seed`
    integrations/            ── xarici sistem adapterləri (mock) ──
      sms.ts                 send(to, text) → outbox-a yazır + console.log ; fault: down
      sima.ts                createSession, buildQrPayload, verifySignature(HMAC), mockScan(qrToken, outcome)
      signature.ts           signPrescription(doctorId, payloadHash, confirmationPin) → HMAC imza ; fault: error
      antivirus.ts           scan(buffer) → EICAR imzası və ya adında "virus" varsa INFECTED
      storage.ts             AES-256-GCM (node:crypto) encrypt/decrypt; açar per-sənəd (keyring data/keys.json), storagePath
      push.ts / email.ts     outbox-a yazır ; delivery status SENT → 1-3s sonra DELIVERED (və ya FAILED)
      faults.ts              { sima, sms, push, email, signature, storage, antivirus: 'ok'|'down'|'error' }
    services/                ── biznes məntiqi, modul üzrə ──
      auth.service.ts  profile.service.ts  search.service.ts  slots.service.ts  schedule.service.ts
      appointments.service.ts  documents.service.ts  grants.service.ts  prescriptions.service.ts
      clinicAdmin.service.ts  admin.service.ts  notifications.service.ts  reviews.service.ts  ratings.service.ts
    serializers/             rol-spesifik DTO-lar: appointmentForPatient / ForDoctor / ForClinicAdmin / ForSuperAdmin ...
    routes/                  nazik HTTP qatı: validate → service → ok()
    jobs/
      scheduler.ts           hər JOB_INTERVAL_MS (default 30s) bütün job-ları işə salır; /__dev/jobs/run manual
      releaseExpiredLocks  sendScheduledNotifications  autoCompleteAppointments  cancelUnconfirmedPending (F3)
      expireGrants  expirePrescriptions  checkLicenses (klinika+həkim, 30 gün xəbərdarlığı, avtomatik dayandırma)
      rollSlotGeneration (60 gün)  purgeDeletedDocuments (30 gün)  expireInvites  deliverQuietHoursQueue
    dev/
      dev.routes.ts          /__dev/* (aşağıda)
  test/                      vitest; hər servis üçün; clock.set() ilə vaxt idarəsi; hər testdən əvvəl seed
  data/                      db.json, keys.json, storage/ (hamısı .gitignore)
```

Qat qaydası: `routes → services → store/integrations`. Route biznes qaydası yoxlamır; service HTTP obyektini (req/res) görmür; serializer DB obyektini rola görə DTO-ya çevirir. Bildiriş göndərmək üçün service `notify(event, payload)` çağırır. Bildiriş xətası service-i heç vaxt yıxmamalıdır (try/catch + log).

## Kritik mexanizmlərin implementasiyası

- **Soft lock / double-booking:** Node tək thread-dir. `lockSlot` sinxron funksiyadır: yoxla (AVAILABLE və ya vaxtı keçmiş SOFT_LOCKED) → yaz. Arada `await` olmamalıdır. `createAppointment` yenidən yoxlayır: `status === SOFT_LOCKED && lockedBy === userId && lockedUntil > now`. Demo üçün `/__dev/race/{slotId}` iki "paralel" lock sorğusu göndərir və nəticəni göstərir (birincisi uğurlu, ikincisi 409 `SlotUnavailable`).
- **Slot generasiyası:** `generateSlots(doctorClinicId, fromDate, toDate)` şablon + fasilələr + bufer + istisnalar + klinika saatları + klinika bayramları əsasında hesablanır. Mövcud BOOKED və BLOCKED slotlara toxunmur, gələcək AVAILABLE slotları yenidən yaradır. Xidmət müddəti slot müddətindən uzundursa, `/doctors/{id}/slots?serviceId` ardıcıl AVAILABLE slotları birləşdirib birinci slotu qaytarır; lock və booking bütün zənciri tutur (`appointment.slotIds[]` daxili sahədir).
- **OTP:** 6 rəqəm təsadüfi; store-da `bcrypt`/sha256 hash; kod **heç vaxt** API cavabında qaytarılmır. SMS outbox-a yazılır, dev panel oradan oxuyur.
- **SİMA:** `POST /auth/sima/session` → `qrToken` + `qrPayload` (`mediconnect-sima://verify?token=...`); client QR-ı `qrcode` paketi ilə çəkir. Dev panel → "SİMA simulyatoru" pending sessiyaları göstərir: **Uğurlu** / **Uğursuz** / **FIN uyğunsuzluğu** düymələri `/__dev/sima/{qrToken}/scan`-ı çağırır. Bu endpoint seed-dəki "Dövlət reyestri"ndən (`seed.ts` → `govRegistry`: FIN → ad, soyad, ata adı, doğum tarixi, cins) payload yığır, onu `MOCK_SECRET` ilə HMAC edir və real `/v1/auth/sima/callback`-ə POST edir. Callback imzanı yoxlayır, imza səhvdirsə 401 qaytarır. Reyestrdə olmayan FIN üçün sintetik şəxs yaradılır.
- **Fayllar:** multer (memory, limit `max_file_size_mb`) → mime və uzantı yoxlaması → antivirus → AES-256-GCM şifrələmə → `data/storage/{uuid}.enc`. `GET /documents/{id}/view` → `signed_urls`-də token (`signed_url_ttl_seconds`, birdəfəlik) → `/v1/files/{token}` deşifrə edib `inline` göndərir. Həkim üçün cavab `Content-Disposition: inline` olur, `Cache-Control: no-store` əlavə olunur; client-də isə yükləmə düyməsi göstərilmir və `DOWNLOAD_ATTEMPT` log-a yazılır.
- **Rəqəmsal imza:** `sign` addımı həkimin PIN-ini (mock "imza PIN"i = login PIN) təsdiq kimi qəbul edir, `HMAC(prescription canonical JSON)` imzası yaradır, `prescriptionNumber`, `qrCodeToken`, `validUntil` təyin edir. `faults.signature='error'` → 503, resept DRAFT qalır.
- **Bildirişlər:** `notify()` → tərcihlər, şablon (dil × kanal) → `notifications` (IN_APP) + `notification_deliveries` (kanal üzrə) → adapter. FAILED → növbəti kanal (fallback). Quiet hours → `scheduled_notifications`-ə səhər 08:00-a köçürülür (kritik deyilsə). Client bildiriş mərkəzi 20 saniyədən bir `/notifications/unread-count` sorğusu göndərir (polling, websocket lazım deyil).
- **Reytinq:** rəy statusu dəyişəndə `ratings.recalculateDoctor(doctorId)` və həkimin hər klinikası üçün `recalculateClinic` çağırılır.
- **Audit:** `audit()` yalnız `db.audit_logs.push`. Update və delete funksiyası **yazılmır**; dev reset istisnadır.
- **Gecikmə:** `MOCK_LATENCY_MS` (default 250) loading/skeleton vəziyyətlərini görünən edir.
- **Sessiya timeout-u:** `MOCK_SESSION_TIMEOUT` (default **false** lokal demoda — sessiya 30 gün yaşayır). `true` olanda spec qaydası işləyir: `session_timeout_minutes` (15 dəq) fəaliyyətsizlikdən sonra sessiya bitir (BR-102-04). Testlərdə (vitest.config.ts) və real backenddə həmişə `true`.
- **PDF/Excel export:** `pdfkit` ilə sadə PDF (resept, tibbi tarixçə, hesabat); Excel əvəzinə CSV (`.xlsx` lazım olsa `exceljs`).

## Dev endpoint-ləri (`/__dev`, yalnız `MOCK_DEV_TOOLS=true`)

| Endpoint | Təyinat |
|---|---|
| GET /__dev/state | saat offseti, fault-lar, store statistikası |
| POST /__dev/reset | seed-ə qayıt (store + storage + saat) |
| GET /__dev/users | rol üzrə demo istifadəçilər (telefon, PIN, təsvir) |
| POST /__dev/login-as `{userId}` | PIN-siz sessiya (audit-də `DEV_LOGIN_AS` kimi işarələnir) |
| GET /__dev/outbox?channel=SMS\|PUSH\|EMAIL | göndərilmiş mesajlar (OTP kodları burada görünür) |
| GET /__dev/sima/pending · POST /__dev/sima/{qrToken}/scan `{outcome: SUCCESS\|FAILED\|FIN_MISMATCH}` | SİMA simulyatoru |
| GET/POST /__dev/clock `{offsetMinutes \| advanceMinutes \| set}` | time travel (xatırlatma, avtomatik tamamlanma, icazə bitməsi, lisenziya) |
| POST /__dev/jobs/run `{job?}` | job-ları dərhal işə sal |
| GET/POST /__dev/faults | xarici servis nasazlığı (EF-101-5, EF-601-6, EF-1001-1 demoları) |
| POST /__dev/race/{slotId} | double-booking demosu |

## Seed data (`store/seed.ts`) — prototiplərlə uyğun

Bütün demo istifadəçilərin PIN-i **`2580`**-dir (zəif PIN deyil). Telefon nömrələri `+99450000000X` formatındadır.

- **Super Admin:** Fuad İbrahimov (+994500000001).
- **Klinikalar:** Mərkəzi Klinika (POLYCLINIC, Bakı, Nəsimi r., Azadlıq pr. 24; B.e.–C. 09–18), Kaspi Tibb Mərkəzi (DIAGNOSTIC_CENTER, Yasamal r., Şərifzadə küç. 7; Ç.a. və C.a. 14–19), Şəfa Hospital (HOSPITAL, Gəncə, Kəpəz), Nur Diaqnostika (LABORATORY), Sağlam Ailə (PENDING_VERIFICATION — verifikasiya demosu üçün). Hər aktiv klinikanın bir admini var (Mərkəzi Klinika admini: +994500000002).
- **Həkimlər:** Dr. Aygün Məmmədova (Kardioloq; Mərkəzi Klinika [AUTO] + Kaspi Tibb Mərkəzi [MANUAL]; 12 il təcrübə, rating 4.7; +994500000010), Dr. Rəşad Hüseynov (Nevroloq), Dr. Leyla Əliyeva (Pediatr), Dr. Kamran Quliyev (Ortoped, Şəfa Hospital, lisenziyası 2026-11-05-də bitir → xəbərdarlıq demosu), Dr. Tural İsmayılov (Nevroloq), həmçinin INVITED statusda bir həkim (dəvət demosu).
- **Xidmətlər (kataloq):** İlkin müayinə (30), Təkrar müayinə (20), Exokardioqrafiya (40), Holter monitorinqinin qurulması (25), Nəticələrin şərhi, Konsultasiya, USM, MRT, KT, Rentgen, Analiz.
- **Pasientlər:** Nigar Səlimova (35 yaş, A (II) Rh+, Penisilin allergiyası SEVERE, Lizinopril daimi dərman; +994500000020 — əsas demo pasient), Orxan Səfərov (noShowCount=4 → NoShowLimitExceeded demosu), Səbinə Əhmədova.
- **Dərmanlar:** Amoksisilin, Ampisilin, Penisilin, Atorvastatin, Bisoprolol, Lizinopril, Dəmir sulfat, Sulfametoksazol, Sulfanilamid, Diazepam (controlled), Tramadol (controlled). Qarşılıqlı təsirlər: məs. Bisoprolol×Diazepam MODERATE, Tramadol×Diazepam SEVERE. Allergiya→dərman uyğunluğu: Penisilin allergiyası Amoksisilin/Ampisilin/Penisilin ilə toqquşur (generic qrupu üzrə).
- **Vəziyyətlər (seed vaxtı `clock.now()`-a nisbətən hesablanır, ona görə həmişə "təzə" qalır):** Nigar üçün sabah CONFIRMED randevu, 25 dəqiqə sonra başlayan CONFIRMED randevu (tamamlama/no-show demosu), keçmiş COMPLETED randevu (rəy yazılmayıb), keçmiş COMPLETED + SIGNED resept, Kaspi-də PENDING randevu (həkim təsdiqi demosu); Nigar-ın 4 sənədi (Qan analizi, EKQ nəticəsi, Exokardioqrafiya protokolu, Dərman siyahısı), biri Dr. Aygün ilə ACTIVE grant-dır (2 gün sonra bitir); moderasiya növbəsində 3 rəy (biri telefon nömrəsi ehtiva edir → filterFlags), bir REPORTED rəy; audit və security event nümunələri.
- **govRegistry (SİMA mock):** seed istifadəçilərin FIN-ləri + qeydiyyat demosu üçün boş FIN-lər (məs. `5AB7CD2` → yeni pasient).

`DEMO.md`-də hər demo istifadəçinin hansı ssenari üçün olduğu yazılır.
