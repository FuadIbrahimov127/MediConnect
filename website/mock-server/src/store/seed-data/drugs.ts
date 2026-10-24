import type { InteractionSeverity } from '@mediconnect/shared';

// Dərman kataloqu (demo). Məlumatlar nümayiş üçündür, real klinik istinad deyil.
// drugClass allergiya uyğunluğu üçün istifadə olunur (məs. "Penisilin" allergiyası → penisilin qrupu).

export interface DrugSeed {
  key: string;
  tradeName: string;
  genericName: string;
  drugClass: string;
  form: string;
  strength: string;
  controlled?: boolean;
  info: string;
}

export const DRUGS: DrugSeed[] = [
  { key: 'amoxiclav', tradeName: 'Amoksiklav', genericName: 'Amoksisillin + klavulan turşusu', drugClass: 'Penisilin', form: 'tablet', strength: '625 mq', info: 'Bakterial infeksiyalarda istifadə olunan antibiotik. Yeməklə qəbul edilir. Əsas yan təsirlər: ishal, ürəkbulanma, səpgi.' },
  { key: 'amoxicillin', tradeName: 'Amoksisillin', genericName: 'Amoksisillin', drugClass: 'Penisilin', form: 'kapsul', strength: '500 mq', info: 'Penisilin qrupundan antibiotik. Kursu yarımçıq dayandırmayın. Əsas yan təsirlər: ishal, səpgi.' },
  { key: 'azithro', tradeName: 'Sumamed', genericName: 'Azitromisin', drugClass: 'Makrolid', form: 'tablet', strength: '500 mq', info: 'Makrolid antibiotik, adətən gündə bir dəfə. Əsas yan təsirlər: qarın ağrısı, ishal.' },
  { key: 'clarithro', tradeName: 'Klasid', genericName: 'Klaritromisin', drugClass: 'Makrolid', form: 'tablet', strength: '500 mq', info: 'Makrolid antibiotik. Bəzi statinlərlə birgə qəbulu təhlükəlidir. Əsas yan təsirlər: dad dəyişikliyi, ürəkbulanma.' },
  { key: 'cefuroxime', tradeName: 'Zinnat', genericName: 'Sefuroksim', drugClass: 'Sefalosporin', form: 'tablet', strength: '500 mq', info: 'Sefalosporin qrupundan antibiotik. Yeməkdən sonra qəbul edilir.' },
  { key: 'paracetamol', tradeName: 'Panadol', genericName: 'Parasetamol', drugClass: 'Analjezik', form: 'tablet', strength: '500 mq', info: 'Ağrıkəsici və qızdırmasalıcı. Gündəlik maksimal dozanı aşmayın; spirtli içki ilə birgə qəbul etməyin.' },
  { key: 'ibuprofen', tradeName: 'Nurofen', genericName: 'İbuprofen', drugClass: 'QSİƏP', form: 'tablet', strength: '400 mq', info: 'Ağrıkəsici və iltihab əleyhinə. Yeməkdən sonra qəbul edin. Əsas yan təsirlər: mədə narahatlığı.' },
  { key: 'aspirin', tradeName: 'Aspirin Kardio', genericName: 'Asetilsalisil turşusu', drugClass: 'QSİƏP', form: 'tablet', strength: '100 mq', info: 'Qan laxtalanmasının qarşısını almaq üçün aşağı dozada istifadə olunur. Əsas yan təsirlər: mədə qıcıqlanması, qanaxma meyli.' },
  { key: 'warfarin', tradeName: 'Varfarin', genericName: 'Varfarin', drugClass: 'Antikoaqulyant', form: 'tablet', strength: '5 mq', info: 'Qanı durulaşdıran dərman. Müntəzəm qan analizi (INR) tələb edir. Qanaxma əlamətlərində həkimə müraciət edin.' },
  { key: 'clopidogrel', tradeName: 'Plaviks', genericName: 'Klopidoqrel', drugClass: 'Antiaqreqant', form: 'tablet', strength: '75 mq', info: 'Trombların qarşısını alır. Həkim demədən dayandırmayın.' },
  { key: 'lisinopril', tradeName: 'Lizinopril', genericName: 'Lizinopril', drugClass: 'AÇF inhibitoru', form: 'tablet', strength: '10 mq', info: 'Arterial təzyiqi aşağı salır. Əsas yan təsirlər: quru öskürək, başgicəllənmə.' },
  { key: 'amlodipine', tradeName: 'Norvask', genericName: 'Amlodipin', drugClass: 'Kalsium kanal blokatoru', form: 'tablet', strength: '5 mq', info: 'Təzyiq və stenokardiyada istifadə olunur. Əsas yan təsirlər: ayaqlarda ödem, baş ağrısı.' },
  { key: 'bisoprolol', tradeName: 'Konkor', genericName: 'Bisoprolol', drugClass: 'Beta-blokator', form: 'tablet', strength: '5 mq', info: 'Ürək ritmini və təzyiqi tənzimləyir. Birdən dayandırmayın.' },
  { key: 'spironolactone', tradeName: 'Veroşpiron', genericName: 'Spironolakton', drugClass: 'Diuretik', form: 'kapsul', strength: '25 mq', info: 'Kalium saxlayan sidikqovucu. Qanda kalium səviyyəsinə nəzarət tələb edir.' },
  { key: 'furosemide', tradeName: 'Lazix', genericName: 'Furosemid', drugClass: 'Diuretik', form: 'tablet', strength: '40 mq', info: 'Güclü sidikqovucu, səhər qəbul edilir. Əsas yan təsirlər: susuzluq, başgicəllənmə.' },
  { key: 'atorvastatin', tradeName: 'Atoris', genericName: 'Atorvastatin', drugClass: 'Statin', form: 'tablet', strength: '20 mq', info: 'Xolesterini aşağı salır, axşam qəbul edilir. Əzələ ağrısı olarsa həkimə bildirin.' },
  { key: 'simvastatin', tradeName: 'Zokor', genericName: 'Simvastatin', drugClass: 'Statin', form: 'tablet', strength: '20 mq', info: 'Xolesterini aşağı salır. Qreypfrut şirəsi ilə qəbul etməyin.' },
  { key: 'metformin', tradeName: 'Siofor', genericName: 'Metformin', drugClass: 'Biquanid', form: 'tablet', strength: '850 mq', info: 'Şəkərli diabetdə qan şəkərini tənzimləyir. Yeməklə qəbul edilir.' },
  { key: 'levothyroxine', tradeName: 'Eutiroks', genericName: 'Levotiroksin', drugClass: 'Tiroid hormonu', form: 'tablet', strength: '50 mkq', info: 'Səhər ac qarına, yeməkdən 30 dəqiqə əvvəl qəbul edilir.' },
  { key: 'omeprazole', tradeName: 'Omez', genericName: 'Omeprazol', drugClass: 'Proton pompası inhibitoru', form: 'kapsul', strength: '20 mq', info: 'Mədə turşuluğunu azaldır. Yeməkdən əvvəl qəbul edilir.' },
  { key: 'cetirizine', tradeName: 'Zyrtec', genericName: 'Setirizin', drugClass: 'Antihistamin', form: 'tablet', strength: '10 mq', info: 'Allergiya əleyhinə. Yuxululuq yarada bilər.' },
  { key: 'loratadine', tradeName: 'Klaritin', genericName: 'Loratadin', drugClass: 'Antihistamin', form: 'tablet', strength: '10 mq', info: 'Allergiya əleyhinə, adətən yuxululuq yaratmır.' },
  { key: 'fluconazole', tradeName: 'Diflukan', genericName: 'Flukonazol', drugClass: 'Antifunqal', form: 'kapsul', strength: '150 mq', info: 'Göbələk infeksiyalarında istifadə olunur.' },
  { key: 'prednisolone', tradeName: 'Prednizolon', genericName: 'Prednizolon', drugClass: 'Kortikosteroid', form: 'tablet', strength: '5 mq', info: 'İltihab və allergiya əleyhinə hormonal dərman. Dozanı birdən dayandırmayın.' },
  { key: 'ambroxol', tradeName: 'Lazolvan', genericName: 'Ambroksol', drugClass: 'Bəlğəmgətirici', form: 'tablet', strength: '30 mq', info: 'Bəlğəmi durulaşdırır. Bol maye qəbul edin.' },
  { key: 'drotaverine', tradeName: 'No-şpa', genericName: 'Drotaverin', drugClass: 'Spazmolitik', form: 'tablet', strength: '40 mq', info: 'Saya əzələ spazmlarını azaldır.' },
  { key: 'tramadol', tradeName: 'Tramadol', genericName: 'Tramadol', drugClass: 'Opioid', form: 'kapsul', strength: '50 mq', controlled: true, info: 'Güclü ağrıkəsici. Nəzarətdə olan dərmandır; asılılıq yarada bilər. Spirtli içki ilə qəbul etməyin.' },
  { key: 'diazepam', tradeName: 'Relanium', genericName: 'Diazepam', drugClass: 'Benzodiazepin', form: 'tablet', strength: '5 mq', controlled: true, info: 'Sakitləşdirici. Nəzarətdə olan dərmandır; maşın sürməyin.' },
];

export const INTERACTIONS: { a: string; b: string; severity: InteractionSeverity; description: string }[] = [
  { a: 'warfarin', b: 'aspirin', severity: 'SEVERE', description: 'Varfarin + asetilsalisil turşusu: ciddi qanaxma riski artır.' },
  { a: 'warfarin', b: 'ibuprofen', severity: 'SEVERE', description: 'Varfarin + ibuprofen: mədə-bağırsaq qanaxması riski.' },
  { a: 'warfarin', b: 'fluconazole', severity: 'SEVERE', description: 'Flukonazol varfarinin təsirini gücləndirir — INR kəskin yüksələ bilər.' },
  { a: 'simvastatin', b: 'clarithro', severity: 'SEVERE', description: 'Klaritromisin simvastatinin qanda səviyyəsini artırır — rabdomioliz riski.' },
  { a: 'tramadol', b: 'diazepam', severity: 'SEVERE', description: 'Opioid + benzodiazepin: tənəffüs depressiyası riski.' },
  { a: 'atorvastatin', b: 'clarithro', severity: 'MODERATE', description: 'Klaritromisin atorvastatinin səviyyəsini artırır — miopatiya riski.' },
  { a: 'lisinopril', b: 'spironolactone', severity: 'MODERATE', description: 'AÇF inhibitoru + kalium saxlayan diuretik: hiperkaliemiya riski.' },
  { a: 'lisinopril', b: 'ibuprofen', severity: 'MODERATE', description: 'QSİƏP təzyiqsalıcı təsiri zəiflədir və böyrək funksiyasını pisləşdirə bilər.' },
  { a: 'clopidogrel', b: 'omeprazole', severity: 'MODERATE', description: 'Omeprazol klopidoqrelin effektivliyini azaldır.' },
  { a: 'aspirin', b: 'ibuprofen', severity: 'MINOR', description: 'İbuprofen aspirinin kardioprotektiv təsirini zəiflədə bilər.' },
  { a: 'amlodipine', b: 'simvastatin', severity: 'MINOR', description: 'Amlodipin simvastatinin səviyyəsini bir qədər artırır — 20 mq-dan yuxarı doza tövsiyə olunmur.' },
  { a: 'levothyroxine', b: 'omeprazole', severity: 'MINOR', description: 'Omeprazol levotiroksinin sorulmasını azalda bilər.' },
];
