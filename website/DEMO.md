# Demo ssenariləri

Hər ssenari təzə datadan başlayır: dev panel → **Data** → "Demo datanı sıfırla" (və ya `npm run seed`).
Bütün demo istifadəçilərin PIN-i: **2580**.

## Demo istifadəçilər

| Rol | Ad | Telefon | Nə üçün |
|---|---|---|---|
| Super admin | Rəna Həsənova | +994500000001 | Platforma idarəsi |
| Klinika admini | Elnur Rəhimov | +994500000002 | Mərkəzi Klinika |
| Klinika admini | Aysel Novruzova | +994500000003 | Kaspi Tibb Mərkəzi |
| Həkim | Dr. Aygün Məmmədova | +994500000010 | Kardioloq, 2 klinikada işləyir |
| Pasient | Nigar Səlimova | +994500000020 | Əsas demo pasient (Penisilin allergiyası) |
| Pasient | Orxan Səfərov | (dev panel) | No-show limiti aşılıb |
| Pasient | Səbinə Əhmədova | (dev panel) | Yeni, boş kabinet |

Qeydiyyat demosu üçün SİMA reyestrində hesabı olmayan FIN-lər: `5AB7CD2`, `7QW2ER5`, `2ZX9CV4`.

---

## Mərhələ 0 — Platforma karkası

**0.1 Rollar və panellər**
1. Ana səhifəni açın (`/`). İxtisas və şəhər siyahıları mock API-dən gəlir.
2. Dev panel → Rollar → "Nigar Səlimova" → Daxil ol → `/account` paneli açılır.
3. Eyni şəkildə həkim (`/doctor`), klinika admini (`/clinic-admin`) və super admin (`/admin`) kimi daxil olun — hər rolun öz sidebar-ı var.
4. Pasient kimi `/admin` ünvanına keçin → öz panelinizə qaytarılırsınız (rol qoruması).
5. Çıxış edib `/account/appointments` açın → `/login?returnUrl=...` səhifəsinə yönləndirilirsiniz.

**0.2 Sessiya timeout (BR-102-04)**
1. Pasient kimi daxil olun.
2. Dev panel → Saat → "+22 saat" (və ya 15 dəqiqədən çox irəli).
3. İstənilən panel səhifəsinə keçin → sessiya bitib, login-ə yönləndirilirsiniz.
4. Saat → "Real vaxta qayıt".

**0.3 Mock mesaj qutusu və xəta mesajları**
- Dev panel → Mesajlar: bildiriş göndərildikcə SMS/push burada görünür (Mərhələ 1-dən etibarən OTP kodları da).
- Dev panel → Nasazlıqlar: "SMS Gateway → Əlçatmaz" seçildikdə SMS göndərilmir, sistem push-a keçir (EF-1001-1).

---

## Mərhələ 1 — Qeydiyyat, giriş, PIN bərpası, profil

**1.1 Qeydiyyat (UC-101)**
1. `/register` → telefon `+994 55 111 22 33`, FIN `5AB7CD2` → Davam et.
2. Dev panel → **Mesajlar**: 6 rəqəmli kodu götürün və daxil edin (120 s geri sayım; "Yenidən göndər" 60 s sonra aktiv olur).
3. QR kod görünür → Dev panel → **SİMA** → "Üz tanıma uğurlu". Ekran avtomatik növbəti addıma keçir; ad, soyad, doğum tarixi SİMA-dan gəlir (kilidli).
4. PIN təyin edin (məs. `8352`; `1234` yazsanız "çox sadədir" xəbərdarlığı çıxır) → biometrik girişi açın → iki razılığı işarələyin → hesab yaradılır, `/account`-a keçir.
- **Return URL:** çıxış edib `/account/appointments` açın → login-ə yönləndirilir, "Qeydiyyatdan keçin" ilə qeydiyyatdan sonra həmin səhifəyə qayıdırsınız.
- **Xəta ssenariləri:**
  - mövcud nömrə (`+994500000020`) → login-ə yönləndirilir (EF-101-1);
  - yanlış kod → "Kod yanlışdır" + qalan cəhd sayı (EF-101-2);
  - SİMA "Uğursuz" → hesab yaradılmır, məlumatlar silinir (EF-101-3);
  - QR üçün **Saat → +15 dəq** → "QR kodun müddəti bitdi" + Yenilə (EF-101-4);
  - **Nasazlıqlar → SİMA: Əlçatmaz** → "Xidmət hazırda əlçatan deyil" (EF-101-5);
  - **SMS Gateway: Əlçatmaz** → kod göndərilmir, xəta (EF-101-6).

**1.2 Giriş (UC-102)**
1. `/login` → `+994500000020` → "Salam, Nigar!" → PIN `2580` → `/account`.
2. Yanlış PIN 5 dəfə → qalan cəhd sayı azalır, 5-cidə hesab 30 dəqiqə bloklanır, bildiriş gəlir (EF-102-4). **Saat → +1 saat** → yenidən daxil olmaq olur.
3. Həkim `+994500000010` → `/doctor`, klinika admini `+994500000002` → `/clinic-admin`, super admin `+994500000001` → `/admin`.
4. Biometrik: Parametrlər → "Biometrik giriş" açın → çıxın → login-də "Face ID / barmaq izi ilə daxil ol" → simulyasiya pəncərəsində "Uğurlu" (PIN tələb olunmur) və ya "Uğursuz" (PIN-ə keçid, EF-102-5).
5. Yeni cihaz: başqa brauzerdə (və ya gizli pəncərədə) daxil olun → əsas pəncərədə "Yeni cihazdan giriş" bildirişi və SMS.

**1.3 PIN bərpası (UC-103)**
1. `/login` → nömrə → "PIN-i unutmusunuz?" → SMS kodu → SİMA "Üz tanıma uğurlu" → yeni PIN.
2. Bütün açıq sessiyalar bağlanır (digər tabda səhifəni yeniləyin → login-ə atır), "PIN dəyişdirildi" SMS-i gəlir.
3. SİMA-da "Başqa şəxs (FIN uyğunsuz)" seçilsə əməliyyat bloklanır və təhlükəsizlik log-una yazılır (EF-103-2).

**1.4 Profil və parametrlər (UC-104)**
- `/account/profile`: SİMA sahələri kilidlidir; email, ünvan, təcili əlaqə, qan qrupu, allergiyalar (şiddət ilə), xroniki xəstəliklər (ICD-10), daimi dərmanlar. Yanlış email → sahə altında xəta (EF-104-2).
- Telefon dəyişikliyi: "Dəyiş" → yeni nömrə → SMS kodu (BR-104-02).
- `/account/settings`: dil, bildiriş kanalları (məcburi olanlar kilidli), biometrik, PIN dəyişikliyi, aktiv sessiyalar, razılığın geri götürülməsi (xəbərdarlıqla), hesabın silinməsi tələbi.

---

## Mərhələ 2 — Axtarış və detal səhifələri

**2.1 Həkim axtarışı (UC-201)** — `/search/doctors` (qeydiyyat tələb olunmur)
1. Ana səhifədə ixtisas "Kardioloq" + şəhər "Bakı" → Axtar → filtrlər URL-ə yazılır (linki kopyalayıb başqa tabda açın — eyni nəticə).
2. Axtarış sahəsinə `memmedova` (diakritikasız) və ya `kardiolq` (səhv) yazın → Dr. Aygün Məmmədova tapılır; yazdıqca autocomplete təklif verir.
3. Filtrlər: cins "Kişi" + dil "Türkcə" → Dr. Tural İsmayılov; "Bu gün" boş vaxt; reytinq 4.5+; aktiv filtrlər chip kimi görünür, × ilə silinir, "Filtrləri sıfırla".
4. Çeşidləmə: "Ən yaxın boş vaxt" / "Təcrübə".
5. Görünməyənlər: Dr. Fərid Məlikov (profil tamamlanmayıb) və Dr. Zaur Əhmədov (klinikada deaktiv) heç bir nəticədə yoxdur; `/doctors/<Fərid id>` → "Bu həkim hazırda qəbul aparmır" + oxşar həkimlər.
6. Dr. Elvin Babayev — rəyi olmadığı üçün reytinq əvəzinə "Yeni həkim".

**2.2 Klinika axtarışı (UC-202)** — rejim seçicisində "Klinika"
- İş rejimi "Axşam qəbulu" → Kaspi, DentArt, Nur, Şəfa; "24/7" → Şəfa Hospital. "Sağlam Ailə" verifikasiya gözlədiyi üçün görünmür.

**2.3 Həkim profili (UC-301)** — Dr. Aygün Məmmədova
- İki klinika: "Boş vaxtlar" blokunda klinika seçin; günlər üzrə boş saat sayı; nahar fasiləsi (13:00–14:00) slotu yoxdur; 1 saatdan az qalan saat seçilmir.
- Xidmətlər klinika üzrə, müddətlə; qiymət əvəzinə "Müayinənin dəyəri klinikada müəyyən edilir".
- Rəylər: reytinq paylanması, alt reytinqlər, çeşidləmə, "Daha çox rəy".
- Guest olaraq saata klikləyin → qeydiyyat səhifəsi açılır; qeydiyyatdan sonra randevu səhifəsinə qayıdır (randevu Mərhələ 3-də).

**2.4 Klinika səhifəsi (UC-302)** — Mərkəzi Klinika
- Həkimlər ixtisas üzrə filtrlənir, iş saatlarında bu gün vurğulanır, xəritə və "Yol tarifi", xidmətlər kateqoriya üzrə, "Bütün həkimləri gör" → klinika filtri ilə axtarış.

**2.5 Slot generasiyası**
- Dev panel → Saat → "+1 gün" → ən yaxın boş vaxtlar dəyişir; rolling job 60 günlük üfüqü saxlayır.

---

## Mərhələ 3 — Randevu

**3.1 Randevu almaq (UC-401)** — Səbinə Əhmədova (+994500000022, boş kabinet) kimi daxil olun
1. Dr. Aygün Məmmədova → "Randevu al" → klinika (2 klinika) → xidmət ("Exokardioqrafiya" 40 dəq — iki ardıcıl slot tutur) → vaxt.
2. Saat seçiləndə 10 dəqiqəlik geri sayım başlayır — vaxt sizin üçün saxlanılır. Təsdiq ekranında xülasə, qiymət qeydi, şikayət sahəsi (yalnız həkim görür).
3. "Randevunu təsdiqlə" → randevu nömrəsi (MC-YYYY-MMDD-NNNN) + QR + "Təqvimə əlavə et" (.ics). Dev panel → Mesajlar: pasientə SMS/push, həkimə push.
4. **Manual təsdiq:** Dr. Rəşad Hüseynov → randevu "Təsdiq gözlənilir" statusunda; pasientə "sorğu göndərildi" bildirişi.
5. **Xəta ssenariləri:**
   - eyni gün eyni həkimə ikinci randevu → "artıq randevunuz var" (BR-401-06);
   - Orxan Səfərov kimi → no-show limiti (BR-401-10);
   - saat seçib **Saat → +15 dəq** → "Vaxt bitdi — yenidən seçin" (EF-401-2);
   - iki brauzerdə eyni saatı seçin → ikincisi "Bu vaxt artıq doludur" (EF-401-1).

**3.2 Randevularım (UC-404)** — Nigar Səlimova
- Yaxınlaşan: Dr. Aygün (təsdiqlənmiş) və Dr. Rəşad (gözləyir); Keçmiş: Dr. Leyla (tamamlanmış, "Rəy yaz"); Ləğv edilmiş: səbəbi ilə.
- Detal: QR kod, klinika, yol tarifi, .ics; 1 saatdan az qalanda "Ləğv et" əvəzinə izah (BR-402-02).

**3.3 Ləğv və köçürmə (UC-402, UC-403)**
- "Randevunu ləğv et" → səbəb seçimi → slot dərhal başqaları üçün açılır, həkimə bildiriş.
- "Vaxtı dəyiş" → klinika (həkimin digər klinikası da olar) → yeni saat (10 dəq saxlanılır) → köhnə → yeni xülasə → təsdiq. 2 dəfədən sonra və ya 2 saatdan az qalanda bloklanır.
- Həkim təklifi (API ilə, həkim UI-si Mərhələ 4-də): `PATCH /v1/appointments/{id}/reschedule` həkim tokeni ilə → pasient detal səhifəsində "Yeni vaxtı qəbul et / İmtina et".

**3.4 Job-lar (Dev panel → Saat)**
- **+1 gün** → 24 saatlıq xatırlatma SMS-i Mesajlar tabında; 24 saat sonra tamamlanmamış randevu avtomatik "Tamamlanıb"; vaxtı keçmiş təsdiqlənməmiş sorğu avtomatik ləğv olunur.

---

## Mərhələ 4 — Həkim paneli

**4.1 İlk giriş və profil (UC-701)** — Dev panel → Rollar → **Dr. Fərid Məlikov** ("profili tamamlanmayıb")
1. Giriş birbaşa `/doctor/profile`-a aparır; xəbərdarlıq: axtarışda görünmürsünüz + çatışmayan sahələr.
2. Lisenziya, klinika, ixtisas kilidlidir (yalnız klinika admini dəyişir); qiymət sahəsi yoxdur.
3. Haqqında (≥30 simvol), təhsil, təcrübə, dilləri doldurun → "Profil tamamlandı" → `/doctor/schedule`. Elnur Rəhimov (Mərkəzi Klinika admini) "Həkim profilini tamamladı" bildirişi alır; həkim axtarışda görünür.
4. "Randevuları əl ilə təsdiqləyirəm" — manual rejim.

**4.2 Cədvəl (UC-702)** — Dr. Aygün Məmmədova
- Klinika tab-ları (Mərkəzi / Kaspi), həftəlik təqvim: yaşıl — boş, narıncı — tutulub (pasient adı ilə), boz — bağlı. Slota klik → bağla / aç (randevulu slot bağlanmır).
- "Cədvəli redaktə et": intervallar, slot müddəti, bufer, fasilələr, "B.e.–C. üçün köçür".
  - Bazar ertəsi bitməni 19:00 edin → "klinikanın iş saatlarından kənardadır";
  - Çərşənbə axşamı Mərkəzi-də 16:00-a qədər uzadın → "həkimin bu vaxtda Kaspi Tibb Mərkəzində cədvəli var";
  - mövcud randevunu kəsən dəyişiklik → təsirlənən randevuların siyahısı → "Ləğv et və xəbərdar et".
- İstisnalar: bağlı gün, məzuniyyət (tarix aralığı — slotlar yox olur), əlavə iş saatı (şənbə).

**4.3 Randevular (UC-703, UC-405)**
- `/doctor`: günün icmalı, növbəti qəbul (seed: 25 dəqiqə sonra Elçin Məmmədov), təsdiq gözləyənlər.
- Randevu ekranı: pasientin yaşı, cinsi, **allergiyası qırmızı blokda** (Nigar — Penisilin, ağır), xroniki xəstəlikləri, yalnız bu həkimlə keçmiş qəbulları.
- **Saat → +1 saat** → "Qəbulu tamamla" (müayinə qeydi ilə) və ya "Gəlmədi". Tamamlandıqdan 2 saat sonra pasientə rəy dəvəti gedir.
- Dr. Rəşad Hüseynov (manual rejim) → "Təsdiq gözləyən" → Təsdiqlə / Rədd et (səbəb məcburidir).
- "Vaxtı dəyişməyi təklif et" → pasient öz kabinetində təklifi qəbul edir və ya rədd edir.

## Mərhələ 5 — Tibbi sənədlər

**5.1 Yükləmə (UC-501)** — Nigar → **Tibbi sənədlərim**
- PDF/JPG/PNG sürüşdürüb atın (bir neçə fayl birdən), kateqoriya və tarix seçin → irəliləyiş zolağı. Fayl diskdə AES-256-GCM ilə şifrələnir.
- `.pdf` adlı mətn faylı → "format dəstəklənmir" (məzmuna görə yoxlanılır); 10 MB-dan böyük → limit xətası.
- Faylın sonuna `EICAR-STANDARD-ANTIVIRUS-TEST-FILE` yazın → "təhlükəsizlik yoxlamasından keçmədi".
- Dev panel → Nasazlıqlar → storage = down → "xidmət əlçatmazdır". Arxivləmə, silmə → "Silinənlər" (30 gün ərzində bərpa).

**5.2 Paylaşım (UC-502)**
- Sənəd → "Paylaş": yalnız randevusu olan həkimlər görünür; müddət (24 saat / 7 gün / 30 gün / randevu müddətincə). Bir neçə sənədi seçib toplu paylaşmaq olar.
- **Paylaşımlar**: Qan analizi Dr. Aygünə 2 gün sonra bitir (seed) → "Uzat" və ya "Ləğv et"; "Kim baxıb" jurnalı.
- Bronlama addım 3-də və ya randevu detalında "Sənəd əlavə et" → həkimə randevudan 7 gün sonrayadək avtomatik icazə.

**5.3 Həkimin baxışı (UC-503)** — Dr. Aygün → randevu → "Paylaşılan sənədlər"
- Yalnız aktiv icazəlilər, bitmə vaxtı ilə. "Bax" → daxili görüntüləyici (birdəfəlik, 60 saniyəlik link); yükləmə/çap bloklanır və jurnala yazılır.
- Nigar paylaşımı ləğv edən kimi həkimdə sənəd yox olur. **Saat → +3 gün** → icazə bitir.

**5.4 Tibbi tarixçə (UC-504)** — Nigar → **Tibbi tarixçəm**: qəbullar, reseptlər, sənədlər xronoloji; filtrlər; "PDF / çap et".

## Mərhələ 6 — E-resept

**6.1 Reseptlərim (UC-602)** — Nigar → **Reseptlərim**
- Aktiv (Dr. Aygün: Norvask + Atoris, 60 gün), Keçmiş (Dr. Leyla, müddəti bitib — sarı xəbərdarlıq), Ləğv edilmiş (səbəbi ilə, etibarsız).
- Detal: diaqnoz, dərmanlar (dərman adına klik → ümumi məlumat), imza statusu, **QR** → `/prescriptions/verify/...` (aptek görünüşü: tibbi detal yoxdur), "PDF yüklə", "Çap et".
- "Təkrar resept istə" → Dr. Aygünə bildiriş; ikinci sorğu → "artıq göndərilib".

**6.2 Resept yazma (UC-601)** — Dr. Aygün → Randevularım → Nigarın sabahkı randevusu → **Resept yaz**
1. Sol panel: FIN, yaş, cins; **Penisilin allergiyası (ağır)** qırmızı blokda; xroniki xəstəlik; aktiv dərmanlar (Lizinopril — pasient qeyd edib; Norvask, Atoris — sizin resept); əvvəlki reseptlər ("Təkrarla"); şablon ("Hipertenziya — başlanğıc müalicə"); paylaşılan sənədlər ("Bax").
2. Dərman axtarışı: **Amoksiklav** → qırmızı "Allergiya konflikti"; **Nurofen** → orta qarşılıqlı təsir (Lizinopril ilə); **Klasid** → Atoris ilə qarşılıqlı təsir; **Varfarin + Aspirin Kardio** → ağır (səbəb tələb olunur); **Tramadol** → nəzarətdə olan dərman; bazada olmayan ad → "əl ilə əlavə et".
3. Diaqnozu boş saxlayıb "Yoxla və imzala" → sahələr qırmızı. Doldurun → önizləmə → ötürmə səbəbləri + "məsuliyyəti götürürəm" + əsaslandırma + PIN **2580** → imzalanır, `RX-...` nömrəsi, Nigara "Yeni resept" bildirişi.
4. "Qaralama kimi saxla" — pasient görmür; **Reseptlər → Qaralamalar**-dan davam etmək olar.
5. Dev panel → Nasazlıqlar → **signature = down** → imza "servis cavab vermir", resept qaralama qalır, pasientə heç nə getmir.
6. İmzalanmış resept redaktə olunmur → "Resepti ləğv et" (səbəb) → Nigara "Resept ləğv edildi".

**6.3 Təkrar sorğusu** — Dr. Aygün → **Reseptlər → Təkrar sorğuları** → "Təsdiqlə və yaz" (köhnə dərmanlarla qaralama açılır, imzalayın) və ya "Rədd et" (səbəb pasientə gedir).

**6.4 Xəta halları**
- Dr. Rəşad Hüseynov (imza sertifikatı bitib): Nigarın sorğusunu təsdiqləyin → "Resept yaz" → qırmızı xəbərdarlıq, "Yoxla və imzala" deaktivdir; server də `SignatureCertificateInvalid` qaytarır.
- Təsdiq gözləyən randevu üçün resept yazılmır (BR-601-02). Klinika admini və super admin resept endpoint-lərinə daxil ola bilmir (403).
- **Saat → +60 gün** və ya "Job-ları işə sal" → aktiv resept "Müddəti bitib" olur, QR doğrulaması "etibarsız" göstərir.


## Mərhələ 7 — Klinika admini

Rol: **Elnur Rəhimov** (Mərkəzi Klinika admini, +994500000002). Başqa klinika üçün: Aysel Novruzova (Kaspi, +994500000003).

**7.1 İcmal və profil (UC-801)**
- `/clinic-admin`: bugünkü göstəricilər, növbəti qəbullar, gözləyən dəvət (Samirə Rzayeva). Lisenziya xəbərdarlığını görmək üçün Şəfa Hospital admini ilə daxil olun (dev panel → Rollar): Dr. Kamran Quliyevin lisenziyasına 13 gün qalıb.
- **Klinika profili**: qeydiyyat sahələri kilidlidir. Təsviri dəyişin → klinikanın ictimai səhifəsində dərhal görünür. Enlik 55.7 yazın → "Azərbaycan ərazisindən kənardadır" xəbərdarlığı.
- Loqo və fotolar: yükləyin, sürüşdürərək sıralayın.
- İş saatları: Bazar ertəsi bağlanışı 13:00 edin → "N həkimin cədvəli kənardır" + təsirlənən randevular → təsdiq.
- Bayram günü: Nigarın randevusu olan günü seçin → randevular göstərilir → "Ləğv et və xəbərdar et" → həmin gün bütün həkimlərin slotları yox olur.
- "Yeni randevu qəbul edilir" söndürün → pasient bron edə bilmir ("klinika hazırda randevu qəbul etmir").

**7.2 Həkim dəvəti (UC-802)**
1. Dev panel → **Mesajlar**: seed-də Samirə Rzayevaya göndərilmiş SMS-dəki linki açın (port fərqlidirsə, həkimin səhifəsində "Dəvəti təkrar göndər" basın — yeni link cari ünvanla gələcək).
2. `/invite/...` → "SİMA ilə təsdiqlə" → dev panel → SİMA → "Uğurlu" → PIN təyin edin → həkim panelinə, profil tamamlamaya yönləndirilir. Elnur "Həkim dəvəti qəbul etdi" bildirişi alır.
3. **Həkimlər → + Həkim əlavə et**: FIN `2ZX9CV4` (yeni) → lisenziya, ixtisas, sənəd, xidmətlər → "Dəvət göndər". FIN `6NS35AA` (Nigar) → "başqa rolda hesab var". FIN `3KL88MN` (Aygün) → "artıq klinikanızdadır". Başqa həkimin lisenziya nömrəsi → "başqa həkimə aiddir"; keçmiş tarix → rədd.
4. Kaspi-dəki həkimi FIN ilə əlavə edin → "Mövcud həkim tapıldı" → həkim dəvəti PIN **2580** ilə qəbul edir.
5. Həkim detalı: "Passiv et" (axtarışdan çıxır, panelə girə bilir) → "Aktivləşdir". "Lisenziyanı yenilə" (yeni tarix + sənəd). Dr. Aygünü "Klinikadan çıxar" → aktiv randevular siyahısı → qərar.
6. **Saat → +8 gün** → köhnə dəvət linki "müddəti bitib"; "Təkrar göndər". Dəvət səhifəsində "Rədd et" → admin-ə bildiriş.
7. Lisenziya job-u: dev panel → Saat → +14 gün → "Job-ları işə sal" → Dr. Kamran Quliyev (Şəfa Hospital) avtomatik dayandırılır ("Lisenziya müddəti bitib").

**7.3 Cədvəl və təcili gün bağlama (UC-803)**
- Həkim → "Cədvələ bax": həkim panelindəki redaktor (yalnız bu klinika). Dəyişiklik → həkimə "Cədvəliniz dəyişdirildi".
- "Təcili gün bağla" → Dr. Aygünün randevu günü → hər randevu üçün "Ləğv et" və ya "Başqa həkimə köçür" (eyni ixtisas və xidmət olan həkim lazımdır — başqa həkimə xidmətlər redaktəsindən "Təkrar müayinə" əlavə edin). Köçürülən pasient kabinetində "Klinika ... Dr. X adlı həkimə köçürülməsini təklif edir" görür → qəbul edir.

**7.4 Xidmətlər (UC-804)**: kataloqdan "Dermatoskopiya" → Dr. Aygün, 45 dəq. → "ixtisası ilə uyğun gəlmir" + "slot birləşdiriləcək" xəbərdarlıqları. Aktiv randevusu olan xidmətdə "Sil" deaktivdir. "Kataloqda yoxdur?" → tələb.

**7.5 Randevular və hesabatlar (UC-805)**
- Randevular: filtrlər, şikayət mətni heç yerdə yoxdur. Bir neçəsini seçin → "Toplu ləğv et". Detalda: köçürmə təklifi, "Gəlmədi" və 24 saat ərzində düzəliş.
- Hesabatlar: gündəlik qrafik (hover → say; "Cədvəl" görünüşü), həkimlər, gəlməyənlər, yük xəritəsi; "Excel (CSV)" və "PDF".
- Aysel Novruzova (Kaspi) Mərkəzi-nin həkiminin URL-ini açsa → "tapılmadı" + təhlükəsizlik jurnalına yazılır.


## Mərhələ 8 — Super admin

Rol: **Rəna Həsənova** (+994500000001).

**8.1 İcmal** — `/admin`: rollar üzrə istifadəçilər, klinika statusları, gözləyən işlər (verifikasiya, silinmə tələbləri, kataloq tələbləri), son 30 günün randevu qrafiki, xarici servislərin sağlamlığı (dev panel → Nasazlıqlar ilə dəyişin).

**8.2 Klinika əlavəsi (UC-901)**
1. **Klinikalar → + Klinika əlavə et**: lisenziya `TF-YENI-2026` → "Reyestrdə yoxla" (tapıldı); `ABC-1` → tapılmadı. Qeydiyyat + lisenziya sənədi yükləyin. Admin: FIN `5AB7CD2`, +994500000077 → "Klinikanı yarat və təsdiqlə".
2. Dev panel → Mesajlar → SMS-dəki `/invite/...` linki → "SİMA ilə təsdiqlə" → dev panel → SİMA → Uğurlu → PIN → `/clinic-admin` paneli.
3. Mövcud qeydiyyat nömrəsi → "artıq var" + klinikaya keçid. Admin FIN-i `6NS35AA` (pasient) → rol konflikti. Keçmiş lisenziya tarixi → rədd.
4. Gözləmə statusundakı klinika (seed) → "Əlavə sənəd tələb et" / "Təsdiqlə" (sənəd və reyestr yoxlaması) / "Rədd et (saxta sənəd)" → Təhlükəsizlik səhifəsində DOCUMENT_FRAUD.
5. Mərkəzi Klinika → "Müvəqqəti dayandır" → klinika və yalnız orada işləyən həkimlər axtarışdan çıxır. "Deaktiv et" → "N aktiv randevu" → təsdiqlə. "Yenidən aktivləşdir".
6. "+ Admin" → ikinci admin. Sənədə klik → yeni tabda açılır (baxış audit olunur).
7. Saat → lisenziya bitməsinə qədər irəli + "Job-ları işə sal" → klinika avtomatik dayandırılır; "Lisenziyanı yenilə" → bərpa.

**8.3 İstifadəçilər (UC-902)**
- Axtarış: `6NS35AA`, `+994500000020` və ya "Nigar". Detal: sessiyalar, statistika (sənəd sayı var, məzmunu yox), audit tarixçəsi.
- Nigarı "Blokla" (səbəb məcburidir) → Nigarın açıq sessiyası dərhal bağlanır, giriş "hesab bloklanıb". "Blokdan çıxar".
- Dr. Aygünü blokla → "aktiv randevular var" → "Randevuları ləğv et və davam et". Elnuru blokla → "başqa administratoru yoxdur" → "Yenə də blokla". Öz hesabınızda düymə yoxdur.
- "Bütün sessiyaları bağla" (şübhəli fəaliyyət). "Hesabı sil (anonimləşdir)" → ad "Silinmiş istifadəçi", tibbi qeydlər qalır.

**8.4 Parametrlər, kataloqlar, audit (UC-904)**
- **Sistem parametrləri**: no_show_limit-i 0 etməyə çalışın → diapazon xətası. max_login_attempts (kritik) → təsdiq + səbəb tələb olunur → dəyişiklik dərhal tətbiq olunur (3 yanlış PIN → blok). "Tarixçə".
- **Bildiriş şablonları**: ACCOUNT_STATUS_CHANGED mətnini dəyişin; `{diagnosis}` yazsanız rədd olunur (icazəli dəyişənlər göstərilir).
- **Kataloqlar**: "Kardioloq"u silmək → istifadə edən klinikalar göstərilir, yalnız deaktiv etmək olar. Klinika tələbləri (Mərhələ 7-də göndərilən "Akupunktura") → "Kataloqa əlavə et". Dərmanlar: "Panadol"u nəzarətdə işarələyin → reseptdə əsaslandırma tələb olunur. Qarşılıqlı təsir əlavə edin.
- **Audit log**: filtrlər, CSV export; heç bir redaktə düyməsi yoxdur (API-də də 405). **Təhlükəsizlik**: uğursuz girişlər, icazəsiz giriş cəhdləri, saxta sənəd.


## Mərhələ 9 — Rəy və moderasiya

**9.1 Rəy yazmaq (UC-1101)** — Nigar → Randevularım → Keçmiş → Dr. Leyla ilə qəbul → "Rəy yaz"
- Ulduz seçmədən göndərin → "Ulduz reytinqi seçin". Alt reytinqlər, mətn, "Anonim göndər".
- Mətnə "dələduz" yazın → avtomatik rədd ("təhqiredici ifadə"); düzəldib 24 saat ərzində yenidən göndərin. Mətndə telefon/FIN → moderatorda "Şəxsi məlumat" işarəsi.
- Gələcək randevu üçün rəy səhifəsi → "yalnız tamamlanmış qəbullar". **Saat → +31 gün** → "Rəy yazma müddəti bitib".
- Dərc olunmuş rəyi 24 saat ərzində redaktə edin → profildə köhnə versiya qalır, moderatorda "Redaktə" (müqayisə ilə).
- Həkim qəbulu tamamlayanda: 2 saat sonra dəvət, rəy yazılmasa 3 gün sonra bir dəfə xatırlatma (dev panel → Saat + Job-lar).

**9.2 Moderasiya (UC-903)** — Rəna Həsənova → **Rəy moderasiyası**
- Gözləyən: təmiz rəy, telefonlu rəy (Şəxsi məlumat), anonim rəy diaqnozla (Tibbi detal — məxfilik xəbərdarlığı), mətnsiz rəy.
- "Təsdiqlə" → Dr.-un reytinqi və rəy sayı yenilənir, həkimə "Yeni rəy", pasientə nəticə bildirişi. Telefonlu rəy → "Redaktə edib dərc et". "Rədd et" → hazır səbəblər; səbəbsiz olmur.
- "Filtrdən təmiz keçmiş rəyləri seç" → toplu təsdiq (işarəlilər ötürülür).
- Şikayət edilmiş: Dr. Aygünün şikayəti → "Şikayəti rədd et" (dərcdə qalır) və ya "Geri çək" (reytinqdən çıxır). Həkim cavabları → Təsdiqlə/Rədd et.
- "Filtr qaydaları": söz əlavə edin, həssaslığı "Aşağı" edin → təhqir artıq rədd edilmir, yalnız işarələnir.

**9.3 Həkim** — Dr. Aygün → **Rəylər**: paylanma, "Cavab yaz" (moderasiyadan keçir), "Şikayət et". Pasient də həkim səhifəsindəki rəyi "Uyğunsuz rəyi şikayət et" ilə şikayət edə bilər.
