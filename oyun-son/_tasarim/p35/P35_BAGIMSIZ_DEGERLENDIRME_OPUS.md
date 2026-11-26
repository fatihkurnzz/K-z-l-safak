# KORANT ONLINE — P35 BAĞIMSIZ DEĞERLENDİRME (Opus)

**Değerlendirilen belge:** `KORANT_P35_MEVCUT_VE_ONERI.md` (GPT 6.2, P35-01..04, D01–D12)
**Esas alınanlar:** V42 kaynak kodu (`oyun-son/`, commit 82ebfc6) ve özgün destan `_tasarim/VAHRAN_destan.txt`
**Tarih:** 26.11.2026 · **Kapsam dışı:** oyun sonu çeşitliliği (P35-05), savaş regresyonu, P34-10 video
**Durum:** Yalnız rapor. Kaynak koda, görsellere ve kayıtlara dokunulmadı. Yayın ya da uygulama kararı içermez.

Puanlama: **10 üzerinden**. Puan, önerinin bugünkü biçimiyle oyuna ne kadar değer kattığını ölçer: fayda, doğruluk, risk ve maliyet birlikte. Karar türleri: **KABUL** · **REVİZYON** (yön doğru, biçim değişmeli) · **RET** · **KANIT YETERSİZ**.

---

## 0. Yönetici özeti

GPT **sorunları büyük ölçüde doğru teşhis etmiş**. V42 Destan metinlerinde özgün hikâyeyle açık çelişkiler var. Ana görevlerde de tekrar eden ve yanlış adlandırılmış düğümler bulunuyor. Bunların hepsini kaynak kodda doğruladım. **Ancak önerilen metinlerin uygulanış biçimi, "içerik kalitesi" ilkesine çoğu yerde ters düşüyor.** Beş sorun her yerde tekrar ediyor:

1. **Anlatı düzleşiyor.** Sahneler yerini özetlere bırakıyor; metin oyunun içinden değil dışından konuşuyor: *"Bu savaş hatırasını yaşa"*, *"Karşılaşma tamamlandı"*, *"bu zafer, özgün destanın kesin sonucunu belirlemez"*. V42 metinleri olay bakımından yanlış ama yazı olarak daha iyi. GPT'nin metinleri doğru ama cansız. Yalnız uydurmaları düzeltip V42'nin yazı kalitesini korumak gerekir.
2. **"Hatıra" çerçevesi VI–VIII'de yanlış.** Destanda II (300 yıl önce) ve III (Volgar'ın gençliği) geçmişte geçer; VI, VII ve VIII ise **bugün** yaşanır. Oyuncu Kızıl Bahar'da bir hatırayı değil, kendi kralının savaşını oynar. Çerçeve yalnız II ve III'te geçerli.
3. **Bulmacaların cevabı girişte veriliyor.** IV ve VII'de yeni sorular, hemen önce okunan metnin aynısını soruyor ("Yabancılar nerede görüldü? → İki kamp arasındaki derede"). Bulmaca okuduğunu anlama testine dönüşüyor. Daha kötüsü, bölümün doruk noktası olan rünlerin söyledikleri, oyuncu çözmeye başlamadan söylenmiş oluyor.
4. **Savaş kadrosu ile metin uyuşmuyor.** GPT "setup değişmez" diyor, metni ise kadroya bakmadan yazmış:
   - **III Elentha:** yardımcı birim **Marven** (`shared/destan.js` → `ally: L('Ugrath','Marven')`). Önerilen metinde Marven hiç yok.
   - **VII Kragmir:** yardımcı **Şaman Yashka**. Metne göre rünleri Thrak okuyor; ekranda ise Yashka savaşıyor.
   - **VII boss Marven:** Lira ile Thrak gece Marven'le savaşırsa Marven ifşa olduğunu bilir. Ertesi sabah düello tuzağını yine de kurması, okçulara "vurun" demesi (VIII) **olay örgüsünde bir delik** açar. Destanda Marven o gece onları görmez.
5. **Destanın en güçlü satırları atılmış.** İki halkın sözleri ("Toprak, çekice boyun eğer" / "Çelik bile bir gün paslanır") ve finaldeki karşılıkları ("Görelim, kül de eğer mi" / "Belki kin de") hiçbir metinde yok. Önerilen VIII sonucu iki halkta **kelimesi kelimesine aynı**; halkların sesi kayboluyor.

Görev ve ekonomi tarafında GPT iki önemli noktayı **görmemiş**:
- **12. seviyenin altındaki oyuncu bugün hiçbir dönem sandığını alamıyor.** Günlük sandık altı görevin hepsini istiyor (`daily.js 'quest.bonus'`). "arena" görevi Meydan'a bağlı, Meydan da 12. seviyede açılıyor (`content.js UNLOCK.arena = 12`). Haftalık "daily" görevi `dailyAll` sayacına bağlı (`meta.js:25`, `metaops.js:308`), bu yüzden haftalık sandık da kapalı. D06'nın en güçlü gerekçesi bu; GPT'nin belgesinde geçmiyor.
- **`dailyall` başarımı kalıcı can veriyor** (`meta.js:176`, `stat: 'hp'`, kademeler 3/30/100). D07'deki sayaç ayrımı bu yüzden yalnız anlam meselesi değil, **kalıcı güç** meselesi. Yanlış uygulanırsa güç enflasyonu ya da kayıp doğar.

**Genel öneri:** P35'in yönü doğru, uygulama metni değil. Önerilen sıra: (1) D03, D04 ve görev metni düzeltmeleri hemen kabul; (2) Destan metinleri bu raporun ilkeleriyle yeniden yazılsın, GPT metni olduğu gibi alınmasın; (3) D06/D07 ancak kilit kuralı ve kalıcı başarım ayrımıyla birlikte, ekonomi onayından sonra; (4) D08'in büyük HUD düzeni ertelensin, yerine ucuz bir filtre yapılsın.

---

## 1. Karar tablosu (D01–D12)

| ID | Konu | Karar | Puan | Tek cümle gerekçe |
|---|---|---|:-:|---|
| D01 | Destan bütünlüğü | **REVİZYON** | **6** | Çelişki teşhisi 9/10, önerilen metin 5/10. Yazı kalitesi düşüyor, kadro uyuşmazlığı ve bulmaca tasarımı sorunlu. |
| D02 | 64 görevin yeniden gruplanması | **REVİZYON** | **6** | Zorunlu PvP/klan/+10 zincirden çıkıyor (doğru). Ama hikâye tadı siliniyor, m43 tekrarı gözden kaçmış, sefer de seviye kasmayla (m57) bitiyor. |
| D03 | m25 → m28 → m24 sırası | **KABUL** | **9** | Bugün 2-5 hedefi 2-25'ten sonra geliyor; düzeltme bariz ve risksiz. |
| D04 | m32 / m52 / m56 / m64 | **KABUL** (m64 adı dahil) | **9** | m32 = m24 (ikisi de `zoneDone(2)`), m56 4-25 (Adsız) iken metin "Marven" diyor. "Taşa Kazınan Ad" adı da destana göre yemini bozanın adıdır; değişmesi doğru. |
| D05 | Görevlere `min_lvl` | **REVİZYON** | **5** | Kilitler zaten `UNLOCK` tablosunda var; ayrı bir veri kopyası istenmez. Seviye hedefli görevlerde `min_lvl` gereksiz. Kilit değil bilgi olmalı. |
| D06 | Dönem bonusu 4/6 · 5/7 · 4/6 | **REVİZYON** (ekonomi onayı şart) | **6** | Gerekçe GPT'nin yazdığından güçlü (12. seviye altında sandık yok). Ama 4/6 gereğinden geniş; "kilitli görev sayılmaz + bir esnek hak" daha dengeli. |
| D07 | Bonus ile tam bitirme başarımını ayırma | **KABUL** (D06'ya bağlı) | **8** | `dailyall` kalıcı can verdiği için ayrım zorunlu. GPT bu güç etkisini anmamış. |
| D08 | Görev panelinde grup/HUD | **REVİZYON** | **5** | Fayda gerçek, maliyet ve 667/880 px riski yüksek. Önce "Ana yol / Tümü" filtresi ve `mqNext` önceliği yeter. |
| D09 | Kragmir tüccarı replikleri | **REVİZYON** | **5** | Eksik doğru (`npc-soz.js`'te yalnız `merchant:sancak`). Önerilen satırlar genel dükkân dili, Kragmir tonu yok. EN isteği mevcut tasarımla çelişiyor (`npc-soz` TR dışında `null` döner). |
| D10 | Erişilemez 6 yaratık / 20 zırh | **KANIT YETERSİZ** → yalnız inceleme | **6** | Zırh kimlikleri çalışma anında üretiliyor (`u:${k}_${e}`), bu yüzden metin taramasında görünmüyorlar. İnceleme yapılsın ama dinamik bir sayım aracıyla; şimdi öncelik değil. |
| D11 | Tek ana hedef + Destan 8/8 ve sefer 17/17 | **KABUL** (sade biçimiyle) | **7** | En ucuz ve en etkili motivasyon kazancı. Mevcut Görev Defteri alanında kalmalı. |
| D12 | Geçiş güvencesi | **KABUL** (dil düzeltmesiyle) | **9** | Zorunlu. Belgedeki "sunucu otoritesi" dili ilk sürümün yerel kaydına (`DD_LOCAL`, localStorage, çoklu sekme kilidi) göre yeniden yazılmalı. |

---

## 2. P35-01 — Destan: bölüm bölüm inceleme

### 2.0 Önce yazım ilkeleri (bütün bölümler için)

| İlke | Neden | GPT'de durumu |
|---|---|---|
| **Olay destandan, ses V42'den.** V42'deki uydurmalar çıkar; V42'nin sahne kurma dili (somut ayrıntı, kısa replik) kalır. | Kullanıcının ilkesi: kalite. | Uydurmalar çıkmış, ses de kaybolmuş. |
| **Meta cümle yok.** "Karşılaşma tamamlandı", "bu oynanabilir savaş geçmişin sonucunu değiştirmez", "hatırasına gir" kaldırılmalı. | Oyuncu bunu zaten bilir; söylemek büyüyü bozar. Uyarı gerekiyorsa `play` alanında bir kez söylenir. | Neredeyse her bölümde var. |
| **"Hatıra" yalnız II ve III'te.** VI–VIII bugünde geçer, oyuncu orada bulunur. | Destanın zaman çizgisi. | VI giriş/sonuç "hatıra" diyor. |
| **Cevap girişte verilmez.** Bulmaca, açıklamaya giden yoldur. | Doruk noktası etkileşimin ödülü olmalı. | IV ve VII'de cevaplar girişte. |
| **Metin kadroyla uyuşur.** Ekranda savaşan herkes metinde bir yere oturmalı. | Görsel ile anlatı çelişmesin. | III-Elentha ve VII'de uyuşmuyor. |
| **Satır sınırı.** Bölüm başına giriş en fazla 3 satır, satır başına ~160 karakter. | 880×406 diyalog kutusunda okunurluk. | VII girişi 4 uzun satır. |

### 2.1 I · İki Taht — değişiklik yok · **Puan 8 · KABUL + küçük ekleme önerisi**

V42 metni destana uygun (Vahran'ın 300 yıldır kanla sulanması; Edran'ın "kazanmak değil, bitirmek" sözü).
**GPT'nin düşünmediği ekleme:** destanın I. bölümü iki halkın sözüyle ve bir soruyla kapanır. Bunlar bütün hikâyenin omurgası, ama oyunda hiç yok:
- Kragmir sonucuna bir satır: Volgar: *"Ocak başında ne denir, bilirsin: Toprak, çekice boyun eğer."*
- Elentha sonucuna bir satır: Edran: *"Bizde bir söz vardır: Çelik bile bir gün paslanır. Bir uyarıdır, övünç değil."*
- İsteğe bağlı ortak kapanış: *"Bunu kim başlattı? Sana öğretilen cevap tek kelime: Onlar."*

Bu üç satır VIII'deki finalin karşılığını hazırlar (bkz. 2.8). Yeni içerik değil, mevcut metnin içine gömülür.

### 2.2 II · Kırılan Yemin — **Puan 7 · REVİZYON**

**V42'deki hatalar (doğrulandı):** elçi "Taş Yemini'ne gidiyor" ve "boğazında ork düğümü" var. Destanda elçi **ork kampında konuktur** ve göğsünde **Kragmir demiri kabzalı bir ork bıçağı** bulunur. Kuyuyu içen önce **keçilerdir**, sonra çocuklar hastalanır. GPT bunları doğru düzeltiyor.

**GPT'deki sorunlar:**
- *"Şimdi o gecenin çatışmasını bir anı olarak yaşa"*: meta cümle. II gerçekten bir hatıra, ama bunu `play` alanı zaten söylüyor.
- Destandaki **en önemli ipucu atılmış:** *"Herkes taşa baktı. Hiç kimse ovanın kenarındaki sis içinde duran kül rengi cübbeli gölgelere bakmadı."* Bölümün tek gizemi bu. Olmazsa II yalnız bir savaş olur.
- Sonuç cümleleri iki halkta neredeyse aynı.

**Alternatif:** V42'nin sahne dili kalsın; olgular destana göre düzelsin; sonuca sisteki gölgeler eklensin, bunu ancak dikkatli okuyan oyuncu fark etsin. Örnek (Kragmir sonucu):
> *Dorrak'ın çekici taşın dibinden kalktığı anda dikilitaş tepeden dibe yarılır. Herkes taşa bakar. Ovanın kenarındaki siste duran birkaç kül rengi gölgeye kimse bakmaz.*

### 2.3 III · Demirdiş — **Puan 5 · REVİZYON (Kragmir kısmen kabul, Elentha ret)**

**V42'deki hatalar:** Yerkıran "çamura gömülüyor". Destanda Ugrath ölürken çekici oğlunun göğsüne iter. "Demirdiş" adının nedeni de "gözyaşı dökmemesi" olarak yazılmış; doğrusu kırık dişin yerine **babasının düştüğü günün miğferlerinden dökülen demir**dir ("Her yutkunduğumda tadını almak istiyorum").

**GPT Kragmir:** olgular doğru ve Yashka'nın *"Savaşı başlatan el, ne ork ne insan"* uyarısının eklenmesi iyi. Ama:
- Giriş sonucu önceden söylüyor: *"Savaşta Volgar'ın dişi kırılır. Bu hatıra, Yerkıran'ın yeni sahibine geçişini gösterir."* Giriş sonucu vermemeli.
- Volgar'ın emrinin tam sözü değişmiş: "başka izleri de gözlemelerini ister". Destandaki söz, **"ork ya da insan gibi görünmeyen her şeyi gözleyin"**, VIII'de Thrak'ın ağzından birebir geri döner: *"Bana ork ya da insan gibi görünmeyen her şeyi gözlememi emrettin. Gözledim."* Bu satırın aynen korunması şart.
- Destandaki son cümle eksik: *"Bu emri alan izcilerden biri de genç Thrak'tı."* Thrak'ı oyuncuya tanıtan cümle bu.
- "babasının düştüğü günün miğferinden": destan "kırılan miğferlerden birinden" der. Küçük ama düzeltilmeli; anlatılan, babanın miğferi değil.

**GPT Elentha: RET.** *"Vahran'daki eski savaşın Elentha cephesinden bir hatıra… Bu oynanabilir savaş, geçmişin kesin sonucunu değiştirmez."* Bakış açısı yok, karakter yok. Üstelik savaşta yanında savaşan yardımcının adı **Marven** (`destan.js` III, `ally`), ama metin onu anmıyor. V42'nin Elentha III'ü (genç Marven, "Dağlar da düşer", sonda "Yeter… adını koyamadığın bir şey") GPT'ninkinden çok daha iyi ve destanla çelişmiyor.

**GPT'nin düşünmediği öneri, bölümün en değerli fırsatı:** VIII'de Adsız Volgar'a şunu söyler: *"Babanın koltuk altındaki zırh aralığını o mızrakçıya kim gösterdi sanıyorsun?"* Adsız ayrıca Marven'in sadakatini "Edran doğmadan önce" sattığını söyler. Elentha III'e **tek bir sessiz ayrıntı** konursa, Elentha oyuncusu 50 seviye sonra bunu kendisi çözer. Örnek:
> *Marven atından eğilip bir mızrakçının kulağına bir şey söyler, eldiveniyle devin koltuk altını gösterir. Neden orayı gösterdiğini o an anlamazsın.*

Bu bir ifşa değil, sonradan karşılığı gelen bir ipucu; bilgi VIII'e kadar açılmaz. Hikâyeye yeni olay eklemez, destanda zaten olanı görünür kılar.

### 2.4 IV · Sözün Bedeli — **Puan 6 · REVİZYON (metin kabul, bulmaca ret)**

**V42'deki hatalar (en ağırları):**
- Kragmir: *"Thrak, Ak Kuleler'den kaçırdığı sandığı… Prenses Lira bunu bize verdi."* Thrak ile Lira ilk kez V'te karşılaşır.
- Elentha: *"Bunu babama götüremem"*. Edran kraldır, babaları ölüdür.
- Tutanak içeriği uydurulmuş ("Elçi mareşalin çadırına çağrıldı", "düğüm bizim atölyeden"). Bu hem destana aykırı hem **Marven'i dört bölüm erken ifşa ediyor**.

GPT'nin metni olgu bakımından doğru: tutanak sözü sözüne destandan, *"Bunu biri yakmış"*, *"Mareşal'e hiç söyleme"*, *"İki gece sonra indi"*.

**Bulmaca: RET.** Üç sorunun üçü de girişte yazan cümleyi geri soruyor, yanlış şıklar da saçma ("Öğle vakti", "Hasattan sonra", "Taht salonunda"). Oyuncu düşünmüyor, kaydırıp bakıyor.

**Alternatif (aynı mekanik: 3 soru × 3 şık, `destan.solve` aynı kalır):** Giriş yalnız sahneyi kursun (arşiv, çift taban, yanık parşömen). Tutanak **bulmacanın içinde, boşluklarla** okunsun. Son soru bir çıkarım olsun:
1. *"…Kızıl Ay'ın ___ nöbetinde…"* → ikinci / ilk / son
2. *"…ork kampı ile bizim çadırlarımızın arasındaki ___, kül renkli cübbeli yabancılar…"* → derede / kuyuda / taşın dibinde. Yanlış şıklar oyuncunun II'den bildiği yerler; bu yüzden gerçekten ayırt ettiriyor.
3. **Çıkarım:** *"Parşömenin yalnız alt yarısı yanmış. Bu ne anlama gelir?"* → Biri okumuş, sonra ateşe tutmuş / Mum devrilmiş / Nemden çürümüş. Doğru cevap Lira'nın destandaki sözü; oyuncu onu Lira'dan önce bulur.

Sonuç metni o zaman doruk noktası olur: *"Bunu biri yakmış," dedi Lira…*

**Kragmir bakış açısı:** destanda IV'ün Kragmir sahnesi yok. GPT, Kragmir oyuncusuna Elentha arşivini gösteriyor. Bu kabul edilebilir, çünkü oyunda zaten "öteki halkın anlatısı kilitli anı olarak açılır" mekaniği var (`destan.js` başlık yorumu). Ama giriş cümlesi bunu açıkça kurmalı: *"Aynı günlerde, Ak Kuleler'in altında…"* GPT'nin *"Yashka'nın şüphesi aklında. Bu bölüm… hatırasını açıyor"* cümlesi bu işi görmüyor. Not: bulmaca dizisi iki halk için ortak (`puzzle` tek dizi). Halka göre ayrı bulmaca `shared/` değişikliği ister ve bu kapsamda önerilmemeli.

### 2.5 V · Üçüncü El — **Puan 6 · REVİZYON**

**V42'deki hatalar:** kazan "kaynıyor" (destanda içinde yalnız kül var); cübbelilerin ağzında "Adsız" sözü var (destanda lider *"Adım yok"* der); Elentha'da *"Lira bir yüzü tanır: Marven'in yaveri"* (yine erken ifşa). GPT bunları düzeltiyor; bulmaca (el işaretleri) iyi ve korunuyor. Doğru karar.

**GPT'deki sorunlar:**
- İki halkın tanışması, yani destanın en canlı sahnesi (bıçak boğazda, hançer kaburgada, "İnsan casusu" / "Ork katili", avuçtaki aynı kül), tek cümleyle geçiştirilmiş: *"İkisi de aynı gri külü bulmuştur."* Bu sahne 2–3 kısa replikle girişe sığar ve bölümün duygusal çekirdeğidir.
- "Sisli Çukur" adı kaldırılmış ("Vahran'ın kuzeyindeki eski muharebe çukuru"). Oysa oyunun kendi bölge tanımı tam olarak bu: `zones.js` → *"Ovanın kuzeyinde, eski bir muharebenin kemikleriyle dolu sisli çukur… ateşsiz kazanın çevresinde Küllerin Tarikatı toplanır."* Adın korunması, 32. seviyedeki oyuncuya 60. seviyedeki bölgenin vaadini verir. Kaldırılmamalı.
- *"Kül Geçidi'nden gelen iz"* (V42) çıkarılmış. Bu da oyun haritasına bağlanan iyi bir ayrıntıydı (Kül Geçidi tanımında "hiçbir ateşe ait olmayan ince gri kül" var). Destanla çelişmez, korunabilir.
- Destandaki iki güçlü an eksik: ezgisi **ninniye benzeyen** mırıltı ve *"Arkalarından kimse gelmedi. Bu, kovalanmaktan daha korkunçtu."*

### 2.6 VI · Kızıl Bahar — **Puan 7 · REVİZYON (olgular kabul)**

**V42'deki hatalar:** iki kral silahlarını VI'da indiriyor (bu VIII'in anı); "Marven: Saldırın! Kimse kımıldamaz" (destanda Marven'in muhafızları emirsiz hücum eder ve an kaybolur). GPT'nin olayları destana bire bir uygun: yanan köyler ve ork baltaları, maden kampı ve mavi sancak, Edran'ın yaralı orku koruması, göz göze gelme, Marven'in muhafızları, gece ölülerin başında dolaşan gri gölgeler. Bölümün en iyi önerisi bu.

**Düzeltilmesi gerekenler:**
- *"Bu savaş hatırasını yaşa"* / *"Kızıl Bahar hatırasına gir"*: **yanlış çerçeve.** VI bugünde geçer; oyuncu kralının ordusundadır. Örnek: *"Kral seni ön safa çağırır."*
- Destandaki iki cümle bölümü taşıyor, eklenmeli: Edran'ın *"Bana kanıt getir, Lira. Bir ordunun görebileceği kadar büyük bir kanıt"* sözü ve Thrak'ın *"Savaş onların sofrası."* sözü.
- Kadro uyumlu (yardımcı Thrak/Lira; `destan.js` VI).

### 2.7 VII · Taşın Sırrı — **Puan 4 · REVİZYON (yapısal sorun var)**

**V42'deki hatalar:** yemin metni uydurma ("Taş elden, söz bozulmaz"), "Marven'in mührü" taşta yazılı, Marven *"savaşı ben besledim"* diyerek kendini ele veriyor. Destanda Marven ifşa olmaz; Lira gizlice dinler. GPT bunları düzeltiyor; *"Konuğu öldüren el ork değildi; ork bıçağı tutuyordu…"* satırları destandan birebir. Doğru.

**Yapısal sorunlar (GPT çözmemiş, yalnız "oynanabilir temsil" diye geçmiş):**
1. **Olay örgüsü deliği.** Bölümün savaşı Marven'le (`boss: 'erlik'`, ad "Mareşal Marven"). Lira ile Thrak o gece Marven'le savaşırsa Marven ifşa olduğunu bilir. VIII'de düello tuzağını sürdürmesi ve "O bir ork, vurun!" demesi anlamsızlaşır. GPT'nin *"Marven'in ölümü veya tutuklanması bu bölümde kesinleşmez"* cümlesi deliği kapatmıyor.
2. **Kadro.** Kragmir yardımcısı **Şaman Yashka**. Metinde rünü Thrak okuyor, ekranda Yashka var. GPT "Yashka okuyan sayılmaz" diyor; ama oyuncu ekranda Yashka'yı görüyor ve metinde onu bulamıyor.
3. **Bulmaca cevabı girişte.** Yeni 3 sorunun cevabı ("İkisine de değil", "Aynı el", "Küllerin Tarikatı") giriş metninin dördüncü satırında yazıyor. Bölümün doruk noktası etkileşimden önce harcanıyor. V42'nin bulmaca **biçimi** (iki yüzü eşleştirmek) aslında doğru fikir, yalnız içeriği yanlış.

**Alternatif (kullanıcı kararı gerekir, çünkü 1 ve 2 `shared/destan.js` içindeki görünen ad dizelerine dokunur):**
- **Bulmaca:** iki yüz, iki dil. Kragmir yüzündeki yarım satır, Elentha yüzündeki eşiyle tamamlanır:
  1. *"Konuğu öldüren el ork değildi; …"* → ork bıçağı tutuyordu / ork kanı taşıyordu / ork yemini etmişti
  2. *"Kuyuyu zehirleyen el insan değildi; …"* → insan şişesi tutuyordu / …
  3. *"İkisi de aynı eldi. Adı …"* → Küllerin Tarikatı'dır / … (yanlış şıklar: Dorrak, Seraine)

  Giriş yalnız taşı, yosunu, feneri ve sonradan "büyümüş" rünleri anlatır. Açıklama **çözümle birlikte** gelir. Mekanik aynı kalır (`destan.solve`, 3 × 3, `pz[7]`).
- **Savaş, seçenek A (önerim):** Marven atına binip gittikten sonra iki gri cübbeli nöbetçi çatlağa yaklaşır; oyuncu taş parçasını kurtarmak için onlarla dövüşür. Görünen ad "Mareşal Marven" yerine "Tarikat Nöbetçisi" olur; `boss`, sayılar ve dalgalar değişmez. Marven'le hesaplaşma Sisli Çukur 4-20 kapısında (m52) kalır, orada da anlamlıdır.
- **Savaş, seçenek B (kod dizesine hiç dokunmadan):** Marven'i tanıyan bir karşılaşma yerine, Marven'in **kendisini göstermeden** bıraktığı muhafızları anlat: *"Marven gider; geride bıraktığı adamlar çatlağı aramaya başlar."* Ama ekranda "Mareşal Marven" yazdığı sürece çelişki tam kapanmaz.
- **Yardımcı:** Kragmir'de "Şaman Yashka" yerine "Thrak" (sınıfı `priest` → `rogue`, Elentha'daki Lira'nın aynası). Bu da `shared/` dizesi; aynı karar kapısına girer. Seçilmezse metinde Yashka'ya bir rol verilmeli (ör. Thrak'a rünleri o öğretmiştir ve Thrak'ın aklında onun sesi vardır). Ama bu yine ekranla tam örtüşmez.

### 2.8 VIII · Tarihin Külleri — **Puan 4 · REVİZYON**

**V42'deki hata:** *"Adsız dağılır; kül olur, sonra külü de kalmaz. Kazan söner."* Destanın açık sonunu kapatıyor. GPT doğru teşhis etmiş. Ama çözümü, *"bu zafer, özgün destanın kesin sonucunu belirlemez"*, oyunun en önemli anında oyuncuya oyun dışından not düşmek demek. Ayrıca:
- Sonuç metni **iki halkta aynı.** Finalde iki halkın ayrı sesi en çok burada gerekli.
- Destanın asıl doruğu yok: Marven'in düello tuzağı, *"DURUN!"*, tek atta iki binici, Edran'ın *"Yayını geren elini kaybeder!"* sözü, iki ordunun içinden doğrulan gri cübbeliler, *"Halkım seni affetmeyecek." / "Benimki de seni." / "Ben de seni affetmiş değilim." / "Biliyorum."*
- **İki sözün karşılığı yok.** Destanın son karşılıklı repliği oyunun en güçlü kapanışı olabilir: Edran *"Çelik bile bir gün paslanır. Belki kin de."* · Volgar *"Toprak, çekice boyun eğer. Görelim, kül de eğer mi."* (I'deki ekleme bunu hazırlar.)

**Alternatif:**
- **Savaşın anlamı:** oyuncu Adsız'ı yok etmez, **geri püskürtür.** Savaş, iki ordunun içinden doğrulan gri cübbelilere ve liderin gölgesine karşı verilir (kadro zaten Adsız + seçkin muhafız). Sonuç: *"Gölge çatlağa çekilir. Korlar sönmez; yalnız uzaklaşır."* Böylece oyuncunun zaferi anlamlı olur ve son açık kalır; meta cümleye gerek kalmaz.
- **Halka göre son satır:** Kragmir sonucu Volgar'ın sözüyle, Elentha sonucu Edran'ın sözüyle biter; ortak son cümle aynı kalır: *"Taşın dibinde yeni bir rün belirir. Ne yazdığını o gün kimse okumaz. Kül Vahran'ın üzerine yağmaya devam eder."* (GPT'nin bu cümlesi destana birebir uygun, korunmalı.)
- **V42 Kragmir'deki** *"Yashka'nın gözü titrer: Bu bizim dilimiz değil"* cümlesi destanda yok ama açık sona zarar vermiyor; güzel bir ayrıntı, kalabilir.

### 2.9 Destan özeti

| Bölüm | V42 çelişkisi | GPT olgu doğruluğu | GPT yazı kalitesi | Öneri |
|---|---|:-:|:-:|---|
| I | yok | — | — | Kabul + iki söz ve "Onlar" satırı |
| II | elçi/düğüm/kuyu | 9 | 5 | Revizyon: sis gölgeleri eklensin |
| III | çekiç/ad nedeni | 8 (K) / 3 (E) | 5 / 2 | K revizyon, E: V42 kalsın + Marven ipucu |
| IV | erken ifşa, tanışma | 10 | 7 | Metin kabul, bulmaca yeniden |
| V | kazan, "Adsız", yaver | 9 | 5 | Tanışma sahnesi ve "Sisli Çukur" geri |
| VI | erken silah indirme | 10 | 6 | Kabul; "hatıra" çerçevesi çıksın |
| VII | uydurma yemin, ifşa | 9 | 5 | Yapısal karar: savaş rakibi ve yardımcı |
| VIII | kapalı son | 8 | 3 | Yeniden: geri püskürtme + iki söz |

**Görsel:** bu bölümler için yeni illüstrasyon **gerekmez**. Mevcut 42 sahne ve NPC portreleri yeter. Yeni görsel istenmemeli.

---

## 3. P35-02 — Ana görevler

### 3.1 Doğrulanan V42 hataları

| ID | Sorun | Kanıt | GPT gördü mü |
|---|---|---|:-:|
| m25 | 2-5 hedefi, 2-25'i isteyen m24'ten sonra geliyor | `pre: ['m24']` | ✔ |
| m32 | m24 ile aynı hedef | ikisi de `zoneDone(2)` | ✔ |
| m56 | "Marven'i yen" diyor, ama 4-25 Adsız | `zones.js` blok 5 `gate: 'bozdag'` = "Adsız, Tarikat Lideri"; Marven `erlik` = 4-20 | ✔ |
| m25 | "Thrak/Bran sınır karakolunda": Bran çocuk NPC (`npc.js child: Küçük Bran`) | metin | ✔ (dolaylı) |
| m37 | "Taş Yemini çatlıyor": taş 300 yıl önce çatladı | destan II | ✔ |
| m64 | "adın Taş Yemini'ne kazınsın": destanda taşa **yemini ilk bozanın** adı yazılır | destan II, VII | ✔ ad değişti, gerekçe yazılmamış |
| **m43** | **m15 ile aynı hedef** (`A('clan')`); klandaysan açıldığı an hazır | kod | **✘ gözden kaçmış** |
| m29, m37, m44, m49, m53 | `min_lvl` = hedef seviye; görev ya kilitli ya hazır, ara durumu yok | öneri tablosu | **✘** |

### 3.2 Öneri hakkında değerlendirme

**Doğru olanlar:**
- PvP (m13, m17, m34, m55), klan (m15, m43), +5…+10 Örs (m16, m27, m42, m54, m64) ve kasma sayaçları (m26, m46, m61) ana yoldan çıkıyor. Bugün bunlar yalnız ödül zincirini kilitliyor, bölgeleri değil (`stageOpen` bağımsız). Ama `mqNext` oyuncuyu bunlara yönlendirip ana hikâye görevlerini 64 adımın arkasına hapsediyor.
- Bugünkü düzende ön koşul gecikince sonraki görevler biriken ilerlemeyle **birden hazır** oluyor ve ödüller toplu açılıyor. Yeni sıra bu yığılmayı azaltabilir. GPT'nin "erken kazanım" kaygısı tersine de işler: bazı ödüller daha **düzenli** gelir. Bu, ekonomi için iyi bir nokta.
- Ödül toplamı ve kimlikler birebir korunuyor. Görev ödülleri zaten Bağlı (`grantAll(..., { nt: 1 })`), yani takas ekonomisine sızmıyor. Risk sanıldığından küçük.

**Sorunlu olanlar:**
1. **Hikâye tadı siliniyor.** "Gölgelerin peşindeki yaratıkları sustur" → "Toplam 500 yaratık yen"; "Yashka seni bekliyor" → "25. seviyeye ulaş"; "Taht Salonu — Kral seni huzuruna çağırıyor" → "Kızıl Bahar Seferi". V42 görevlerinin 7–16. bölümleri (`MQ_CHAPTERS`: Külün İzi, Yashka'nın Kehaneti, Mareşalin Düşüşü…) destanı oyuna bağlayan tek ince ip. Öneri, bu bölüm adlarının ne olacağını hiç söylemiyor. **Alternatif:** yanlış olgular düzeltilsin (Bran, çatlayan taş, Marven/Adsız), hikâye cümleleri kalsın, görev ne istiyorsa ilk cümlede açık yazılsın. Örnek m26: *"Gölgelerin izindeki yaratıkları sustur: toplam 500 düşman yen."* Hem açık hem hikâyeli.
2. **Seferin son düğümü bir seviye hedefi** (m57, 65. seviye). GPT "grind kalkar" diyor ama ana yolu tam bir kasmayla bitiriyor. **Alternatif:** sefer m56'da (Adsız) biter; m57 "Rehber" olur. Sefer 16 düğüm.
3. **Tek Destan köprüsü (m32) tutarsız.** Sekiz bölümden yalnız IV'e köprü var. **Alternatif, yeni kimlik açmadan:** gözden kaçan tekrar m43 (klan) Destan VI'ya köprü yapılsın: *"Destan VI: Kızıl Bahar bölümünü tamamla"*, ödül aynı. Destan'ın orta (IV) ve geç (VI) noktası böylece görev defterinde görünür. Daha fazla köprü gerekmez; Destan'ın kendi 8/8 göstergesi (D11) gerisini yapar.
4. **Görselleştirme maliyeti.** `ui-anagorev.js` 16×4'lük ağaç düzenine göre yazılmış (97 satır). Önerilen "17 sıralı kart + ayrı liste", aslında yeni bir panel. D08'e bakınız.

**Puan 6 · REVİZYON.** Önerilen yapı: ana sefer 16 (m57 hariç), rehber 10 (m57 dahil), Destan köprüsü 2 (m32 → IV, m43 → VI), isteğe bağlı 36.

### 3.3 D05 — `min_lvl`

Önerilen değerler (Meydan 12, klan 20, Divan/Kuyu 25, Mühürlü Oda/Yeraltı Ocağı 30) `content.js UNLOCK` ile **birebir aynı**. Yeni bir kilit getirmiyorlar, var olan kilidin kopyasını getiriyorlar.
- **Ret:** görev verisine `min_lvl` alanı eklemek. Aynı bilgi iki yerde tutulursa biri bir gün değişir, öbürü değişmez.
- **Kabul:** görevin `go` hedefi `UNLOCK` tablosunda kilitliyse `mqNext` o görevi önermez; kartta durum yerine bilgi gösterilir: *"Meydan 12. seviyede açılır"*. Görev "kilitli" duruma geçmez, "açık" kalır.
- Seviye hedefli görevlere (m09, m29, m37, m44, m49, m53, m57) hiçbir seviye koşulu eklenmez.

**Puan 5 · REVİZYON.**

---

## 4. P35-02 — Dönem bonusu (D06/D07)

### 4.1 Bugünkü durum (kod)

| Dönem | Bonus koşulu | 12. seviye altında |
|---|---|---|
| Günlük | 6 görevin hepsi (`QUESTS.every`), "arena" dahil | **Alınamaz** (Meydan kapalı) |
| Haftalık | 7 görevin hepsi; "daily" = 5 gün tam günlük (`dailyAll`) | **Alınamaz** (hem arena hem daily) |
| Aylık | 6 görevin hepsi; "daily" = 20 gün tam günlük | **Alınamaz** |

Ek olarak: Örs "deneme" görevleri her seviyede açık ama kaynak harcatıyor. Meydan ise yerel kipte bot rakiplere karşı, düşük değerli bir zorunluluk.

### 4.2 GPT'nin önerisi ve riski

4/6 · 5/7 · 4/6 iki "zorunlu"yu birden kaldırıyor. GPT'nin teorik üst sınırı (ayda +800 yakut, 6 mühür, 4 muska, 2 kor) **yalnız bugün hiç bonus almayan** oyuncu için geçerli; bugün tamamlayan oyuncu için fark sıfır. Hesap doğru. Ama ekonomi açısından iki nokta eksik:
- **Kalıcı güç:** `dailyall` başarımı (`meta.js:176`) kademelerinde kalıcı **can** veriyor. GPT'nin `dailyBonus` / `dailyAll` ayrımı (D07) tam da bu yüzden zorunlu. Ayrılmazsa, gevşetilmiş eşik başarımı da hızlandırır ve kalıcı güç enflasyonu olur.
- **Kaynak çıkışı:** Örs görevi bir **kaynak yutağı** (taş/akçe harcatır). 4/6 onu tamamen isteğe bağlı yapar; aynı anda ödül girişi artar. Çıkış azalıp giriş artınca etki ikiye katlanır.

### 4.3 Alternatif (önerim)

1. **Kilitli görev eşikten düşer:** görevin özelliği `UNLOCK` tablosuna göre kapalıysa görev sayılmaz. 12. seviyeden küçük oyuncu için günlük eşik 5/5 olur. Bu tek başına yeni oyuncu sorununu çözer ve ekonomiye neredeyse hiç dokunmaz.
2. **Bir esnek hak:** açık özellikler için eşik günlük 5/6, haftalık 6/7, aylık 5/6. Oyuncu Örs'ü **ya da** Meydan'ı atlayabilir, ikisini birden atlayamaz. Böylece PvP zorunluluğu kalkar (Örs'ü seçebilir), yutak da kısmen korunur.
3. **D07 aynen:** `dailyAll` yalnız gerçek "hepsi + sandık" ile artar (başarım ve kalıcı can buna bağlı kalır). Haftalık/aylık "daily" görevleri yeni `dailyBonus` sayacını okur.
4. Ekonomi onayı yine şart. Ama değişiklik GPT'ninkinden küçük olduğu için modelleme de basit: yeni oyuncu (Sv. 1–11) için fark = bugün sıfır olan bonusun tamamı; orta/ileri oyuncu için fark ≤ 1 görev.

Kullanıcı 4/6'yı tercih ederse GPT'nin önerisi de **uygulanabilir**; yeter ki 1 ve 3 birlikte yapılsın.

**D06 Puan 6 · REVİZYON** · **D07 Puan 8 · KABUL** (D06'ya bağlı)

---

## 5. P35-03 — Eksik içerik

### 5.1 D09 Kragmir tüccarı

- Doğrulandı: `js/npc-soz.js`'te yalnız `"merchant:sancak"` var; tüccar iki halkta da "Tüccar Halvor" (`shared/npc.js`).
- **Önerilen satırlar Kragmir tonunda değil:** "Güle güle kullan", "Yolun açık olsun" her dükkânda duyulabilecek sözler. Kragmir'in sesi demir, ocak, dağ ve az söz.
- **EN isteği mevcut tasarımla çelişiyor:** `npc-soz.js` (264. satır yorumu) "TR dışı dilde null" döner; yani hiçbir NPC sözü İngilizce gösterilmiyor. Yalnız tüccara EN eklemek tutarsız olur. Ya bütün NPC sözleri için ayrı bir EN işi açılır, ya da bu madde yalnız TR olur. Önerim: yalnız TR.
- **Daha uygun örnek satırlar** (aynı sayı ve aynı işlev):
  - Selam: *"Örsten yeni indi, hâlâ ılık."* · *"Dağ verir, kese öder."* · *"Az konuş, iyi seç."*
  - Başarı: *"Demirin hakkını ver."* · *"Ocağın sönmesin."*
  - Başarısızlık (akçe): *"Kesen hafif kaldı."* · (şart): *"Bu demir sana henüz ağır."*
- Önemli bir koşul: Halvor'un portresi Kragmir'de de aynı kişiyse, ork şehrinde bir insan tüccar olabilir. Bu bir **karar sorusu**, yeni görsel gerekçesi değil. Satırlar buna göre "konuk tüccar" tonuna da ayarlanabilir (*"Dağ halkı pazarlık bilmez sanırdım; yanılmışım."*).

**Puan 5 · REVİZYON.**

### 5.2 D10 Erişilemez içerik

- 6 yaratık `shared/bestiary.js` aile listelerinde tanımlı. Bölge kadroları `buildBestiary` ile çalışma anında kuruluyor, bu yüzden adın bir yerde geçmemesi "doğmuyor" demek değil.
- 20 zırh (`u:linen_*`, `u:wool_*`) metinde hiç geçmiyor, çünkü kimlik `u:${k}_${e}` biçiminde **çalışma anında üretiliyor** (`items.js KO_ARMOR`, `daily.js dev.gear`). GPT'nin statik taraması bunu zaten yakalayamaz.
- **Doğru yöntem:** bütün aşamaların doğum tablolarını ve bütün düşme/dükkân/çark havuzlarını çalıştırıp sayan küçük bir araç. Kırk satırlık bir iş, ama şimdi öncelik değil. Hiçbir şey silinmesin.

**Puan 6 · KANIT YETERSİZ** (inceleme kabul, karar yok).

---

## 6. P35-04 — Motivasyon (D08, D11)

- **D11 KABUL (7):** Görev Defteri'nde tek "sıradaki" hedef, yanında tek yardımcı öneri ve iki ayrı ilerleme (Destan x/8, sefer x/16). Yeni sistem, para ya da ödül yok. En iyi maliyet/fayda oranı bu maddede.
- **D08 REVİZYON (5):** gruplu yeni panel 667×375'te taşma riski taşıyor; bugün o ölçüde HUD 6–9,8 px'e iniyor (oturum notu, açık madde). Önerim: mevcut ağaç kalsın, üstüne **"Ana yol / Tümü"** filtresi gelsin. "Ana yol" yalnız sefer, köprü ve rehber düğümlerini gösterir. Asıl fark yaratan şey zaten `mqNext`'in önceliği.
- **Ölçüt:** GPT'nin "ilk 5/30/120 dakika" testi doğru fikir, ama ölçümü sentetik olacak. Gerçek kullanıcı verisi yokken bu test kabul ölçütü sayılmamalı; yalnız yönlendirme doğrulaması (sıradaki hedef her zaman açılabilir bir şey mi?) otomatik ölçülebilir.

---

## 7. D12 — Geçiş ve kayıt

**KABUL (9).** İdempotans, yedek, eski `mq.done` ve `destan.done/pz` kayıtlarının korunması, çift ödül engeli doğru. Düzeltilmesi gerekenler:
- Belge "sunucu/yerel otorite" diyor. İlk sürüm yerel kayıtla çıkıyor (`window.DD_LOCAL = true`); geçiş `upgradeState` içinde, sürüm bayrağıyla, **tek sekmede** (mevcut çoklu sekme kilidi, `sekme_test`) yapılmalı.
- Destan IV/VII bulmacası değişirse eski `pz[4]` ve `pz[7]` işaretleri korunur (GPT bunu söylüyor). Ama VII'nin **savaşı yarıda kalmış** bir kayıtta yeni bulmaca yeniden sorulmamalı. Bunun için test ekleyin: `pz[7] = 1`, `done[7]` yok.
- m43'ün hedefi değişirse (öneri 3.2/3) m32 ile aynı kural geçerli: eski alınmış ödül tekrar verilmez.

---

## 8. GPT'nin düşünmediği, kaliteyi gerçekten artıracak öneriler

Yalnız mevcut içeriğin içine gömülen, yeni sistem ya da yeni varlık istemeyen maddeler:

| # | Öneri | Fayda | Maliyet |
|---|---|---|---|
| Y1 | **İki halkın sözü:** I'de tanıtılsın, VIII'de karşılığı versin ("…kül de eğer mi" / "…Belki kin de") | Destanın ana fikri oyunda ilk kez görünür; final duygusal olarak kapanır, olay olarak açık kalır | 4 satır metin |
| Y2 | **Elentha III'te genç Marven'in sessiz işareti** (zırh aralığı) | VIII'deki ifşa Elentha oyuncusu için sonradan karşılığı gelen bir ipucuna dönüşür | 1 satır |
| Y3 | **II sonunda sisteki kül rengi gölgeler** | İlk ipucu; dikkatli okuyan oyuncu ödüllenir | 1 satır |
| Y4 | **VII savaş rakibi: Tarikat nöbetçileri** (ve Kragmir yardımcısı Thrak) | Olay örgüsü deliği kapanır, kadro metinle uyuşur | `shared/destan.js`'te 2 görünen ad dizesi; **kullanıcı kararı** |
| Y5 | **VIII: Adsız yok edilmez, geri püskürtülür** | Oyuncunun zaferi anlamlı olur, son açık kalır, meta not gerekmez | Metin |
| Y6 | **Bulmacada açıklama çözümle gelsin** (IV boşluklu tutanak + çıkarım; VII yarım satır eşleştirme) | İki bulmaca bölümü düşünme ister ve doruk noktası etkileşimin ödülü olur | Aynı mekanik, yeni metin |
| Y7 | **Görev metinlerinde hikâye cümlesi + açık hedef** (silmek yerine düzeltmek) | Görev defteri destanın sesini taşır | Metin |
| Y8 | **m43 tekrarını Destan VI köprüsüne çevirmek** | Tekrar biter; Destan görev defterinde iki noktada görünür | 1 sayaç fonksiyonu |
| Y9 | **Kilitli özellik görevi dönem eşiğinden düşsün** | Sv. 1–11 oyuncusu ilk kez sandık alır; ekonomiye etkisi neredeyse yok | Tek yardımcı fonksiyon |
| Y10 | **"Sisli Çukur" ve "Kül Geçidi" adları Destan V'te kalsın** | Destan, oyun haritasına bağlanır; erken seviyede geç bölgenin vaadi | Silmemek |
| Y11 | **Metin kabul testi:** her bölüm için 880×406'da satır sayısı/taşma, TR imla, iki halkta kadro ile metin eşleşmesi | GPT'nin 25 testinin hiçbiri metin kalitesini ölçmüyor | Mevcut diyalog betiği |

**Bilerek önermediklerim:** yeni bulmaca türü, halka göre ayrı bulmaca dizisi (`shared/` değişikliği), yeni illüstrasyon, yeni NPC, yeni ödül, Marven/Adsız'ın bölge bosslarıyla tekrarını açıklayan ek içerik. Sonuncusu fark edilebilir bir tutarsızlık; ama kapanışı oyun sonu tasarımına (P35-05) ait olduğu için kapsam dışı bıraktım.

---

## 9. Önerilen öncelik sırası (yalnız öneri)

1. **Hemen ve risksiz:** D03, D04, görev metni düzeltmeleri (Bran, çatlayan taş, Marven/Adsız, m64 adı), m57'nin rehbere geçmesi.
2. **Destan metinleri:** bu raporun ilkeleriyle (2.0) tek yazar elinden yeniden yazılsın. Ardından Y4 kararı (VII rakibi/yardımcısı) kullanıcıdan alınsın.
3. **D11 + filtre (D08'in sade hali) + `mqNext` önceliği + D05'in bilgi biçimi.**
4. **D06/D07:** önce Y9 (kilit kuralı), sonra ekonomi onayıyla esnek hak.
5. **D10:** dinamik sayım aracı, yayından sonra.
6. **D12** bütün bu adımların ön şartı; Fable denetimi bitmeden hiçbiri uygulanmaz.

---

## Ek — Kanıt dizini

| İddia | Dosya / yer |
|---|---|
| Destan bölümleri, kadrolar, bulmacalar | `shared/destan.js` (DESTAN, `destanSetup` vaka 2–8, `destan.solve`) |
| III Elentha yardımcısı Marven, VII yardımcıları Yashka/Lira, VII boss `erlik` | `shared/destan.js` |
| 4-20 Marven (`erlik`), 4-25 Adsız (`bozdag`) | `shared/zones.js` Sisli Çukur blokları; MOBS satır 67, 70 |
| Sisli Çukur ve Kül Geçidi tanımları | `shared/zones.js` ZONES `desc` |
| m24 = m32, m15 = m43, m56 adı, m25 sırası | `shared/anagorev.js` |
| Özellik kilit seviyeleri | `shared/content.js:149 UNLOCK` |
| Günlük bonus tüm görevleri istiyor | `shared/daily.js 'quest.bonus'`; `content.js QUESTS`, `QUEST_ALL` |
| Haftalık/aylık "daily" → `dailyAll` | `shared/meta.js:25, 43`; `shared/metaops.js:308` |
| `dailyall` başarımı kalıcı can | `shared/meta.js:176` |
| Görev ödülleri Bağlı | `anagorev.js mq.claim` → `grantAll(..., { nt: 1 })` |
| Tüccar replikleri yalnız Elentha; NPC sözü TR dışında yok | `js/npc-soz.js:246, 264` |
| Zırh kimlikleri çalışma anında üretilir | `shared/items.js KO_ARMOR`; `shared/daily.js dev.gear` |
| Özgün destan | `_tasarim/VAHRAN_destan.txt` (I–VIII) |
