# GPT Astra 6.2 · Demir Diyarı görsel üretim görevleri

**Kullanım:** Her yeni sohbette önce **ORTAK BÖLÜM**'ü, ardından **yalnız bir PAKET**'i yapıştır. Mesaja `REFERANS.zip` dosyasını ekle. Pakette istenen ek görselleri de ekle. Bir sohbette birden fazla paket isteme. Paketler sırayla yapılır. G1 onaylanmadan G2 ve sonrasına geçilmez.

---

## ORTAK BÖLÜM (her mesajın başına yapıştır)

Sen bir oyunun **kıdemli konsept ve oyun içi sanatçısısın**. Önceki konuşmalar hakkında hiçbir bilgin yok. Gereken her şey bu mesajda ve ekteki `REFERANS.zip` içinde.

### Oyun
- **Demir Diyarı**: telefonda yatay oynanan, sıra tabanlı fantastik RPG. Ekran mantıksal olarak 880×406 piksel, gerçek telefonda 2340×1080.
- İki halk var:
  - **Elentha** (insan krallığı): beyaz mermer, gümüş, lacivert kumaş, gök mavisi ışık, güneş-kartal amblemi.
  - **Kragmir** (ork imparatorluğu): kararmış demir, bronz perçin, kızıl deri, kemik, lav ve kor ışığı, göz-örs amblemi.
- Dört sınıf var: Savaşçı, Suikastçı, Büyücü, Şifacı (Kragmir'de Şaman). Ortak düşman Küllerin Tarikatı; görsel dili soluk, küllü ve doygunluğu düşük.
- Hikâye özeti `REFERANS/VAHRAN_destan.txt` dosyasında.

### Tarz (en önemli kural)
- **Yarı gerçekçi, elle boyanmış dijital resim.** Fırça dokusu görünür, kontur çizgisi yoktur, ışık sinematiktir.
- Tek ölçü `REFERANS/01_ONAYLI_TARZ/` klasöründeki görsellerdir: karakter oluşturma ekranı, 16 karakter, eşya simgeleri, şehir ve savaş arka planları. Ürettiğin her şey bunların yanına konduğunda **aynı sanat ekibinin elinden çıkmış gibi** görünmeli.
- `REFERANS/02_KACINILACAK/` klasöründekiler bugünkü kötü örneklerdir. Bunlara benzeyen hiçbir şey üretme: düşük poligonlu 3B, düz vektör, çizgi film.
- **Yasaklar:**
  - fotoğraf gerçekliği
  - çizgi film, chibi, anime
  - düz vektör illüstrasyon
  - kalın siyah kontur
  - neon renkler
  - görselin içinde yazı, logo ya da filigran
  - başka bir oyunun karakterini, amblemini ya da arayüzünü andırmak (örneğin World of Warcraft Horde/Alliance armaları, Knight Online eşyaları)
- **Işık:** anahtar ışık sol üstten 45° ve sıcak; dolgu ışığı sağdan, soğuk ve zayıf. Gölgeler yumuşak.
- **Oran:** insanlar 7,5–8 baş boyunda, orklar 7 baş boyunda ve geniş omuzlu.
- **Altın:** az kullan. Yalnız süs kenarlarında ve küçük ayrıntılarda olsun; geniş altın yüzey olmasın.

### Teknik kurallar (teslim bunlara uymazsa reddedilir)
1. Biçim yalnız **PNG** (saydam gerekiyorsa) veya **WebP**. AVIF, SVG, JPEG (saydamlık gerekirse), BMP, TGA, TIFF ve PSD kullanma.
2. Saydam görsellerde zemin **gerçekten saydam** olmalı (alfa kanalı). Dama tahtası deseni, beyaz ya da gri zemin olmamalı. Kenarlarda beyaz hale (halo) kalmamalı.
3. Her dosya istenen piksel ölçüsünde olmalı. Ölçek tutarlılığı için zemin çizgisi ve boy kurallarına uy.
4. Dosya adları küçük harf ve ASCII olmalı; Türkçe harf ve boşluk kullanma. Pakette verilen ad kalıbına uy.
5. Her teslim tek bir ZIP olmalı: `DD_<PAKET>_<tarih>.zip`. İçinde `manifest.json` bulunmalı. Her dosya için şu alanları yaz: `dosya`, `ne`, `halk`, `sinif`, `cinsiyet`, `poz`, `genislik`, `yukseklik`, `saydam` (true/false), `not`.
6. Bir görseli beğenmezsen yeniden üret. Zayıf bir görseli teslim edip "sonra düzeltilir" deme.

### Teslimden önce kendi kendini denetle (cevabının sonunda tablo olarak yaz)
- [ ] Her görsel onaylı referansların yanına konduğunda aynı tarzda mı?
- [ ] Işık yönü sol üstte mi?
- [ ] Yasaklardan hiçbiri yok mu?
- [ ] Zemin gerçekten saydam mı, halo var mı?
- [ ] Ölçü, ad ve zemin çizgisi doğru mu?
- [ ] İki halkın eşi eksiksiz mi?
- [ ] Görselin içinde yazı var mı?

Emin olmadığın bir noktada tahmin etme. Seçenekleri iki küçük örnek görselle göster ve cevabında açıkça sor.

---

## PAKET G1 · Pilot: iki savaşçı ve bir yaratık ailesi (ÖNCE BU)

**Amaç:** Savaş ekranındaki düşük poligonlu 3B figürlerin yerine boyalı 2B karakterler konacak. Önce küçük bir pilot yapılıyor.

**Ek:** `REFERANS/01_ONAYLI_TARZ/karakterler/elentha_savasci_kadin.webp` ve `kragmir_savasci_erkek.webp` (ZIP içinde var). Bu iki karakterin yüzü, saçı, zırhı ve renkleri **birebir korunacak**. Yeni karakter tasarlama.

### 1. İki kahraman için 7 poz
Elentha kadın savaşçı ve Kragmir erkek savaşçı için aşağıdaki pozları çiz.
- **Tuval:** 1086×1448, saydam.
- **Duruş:** karakter **sağa bakıyor**, 3/4 yan açıdan görünüyor (savaşta oyuncu solda durur, düşmana sağa doğru bakar).
- **Zemin çizgisi:** ayak tabanı tuvalin alt kenarından 64 px yukarıda.
- **Boy:** karakter yüksekliği 1250 px (±30). Ork için 1300 px.
- **Ölçek:** bütün pozlarda karakter aynı ölçekte ve aynı yerde dursun. Pozlar üst üste konduğunda ayak noktası kaymamalı.

Pozlar:
1. `bekleme`: savaş duruşu, silah hazır.
2. `saldiri-hazirlik`: silah geriye çekilmiş.
3. `saldiri-vurus`: silah ileride, gövde öne eğik.
4. `buyu`: bir el ileri uzanmış, avuçta boş alan bırak (efekti oyun ekleyecek).
5. `vurulma`: gövde geriye savrulmuş, yüz acı içinde.
6. `yere-dusus`: tek dize çökmüş ya da yere yığılmış.
7. `zafer`: silah havada ya da göğüste.

**Silah:** referanstaki silahı koru. Silahın sınıfa uygunluğu konusunda kullanıcı kararı bekleniyor. Bu yüzden ek olarak **bir alternatif `bekleme` pozu** çiz: Elentha savaşçısı kılıç ve kalkanla, Kragmir savaşçısı çift elli baltayla. Adı `bekleme-alternatif`.

**Ad kalıbı:** `kahraman-<sancak|ocak>-savasci-<kadin|erkek>-<poz>.png`

### 2. Deneme: katmanlı karakter (yalnız Elentha savaşçısı, yalnız `bekleme`)
- Aynı `bekleme` pozunu ayrı saydam parçalara böl. Hepsi aynı 1086×1448 tuvalde ve aynı yerde olsun; üst üste konunca tam görüntüyü versin.
- Parçalar: `bas`, `govde`, `kol-on`, `kol-arka`, `bacak-on`, `bacak-arka`, `silah`, `pelerin`.
- Parçaların birleştiği yerlerde (omuz, kalça, boyun) **örtüşme payı** bırak: her parçanın eklem tarafı 20–30 px fazladan boyanmış olsun, dönünce boşluk kalmasın.
- `manifest.json` içine her parça için dönme noktasını (pivot) piksel olarak yaz: `{"parca":"kol-on","pivot":[x,y]}`.

### 3. Bir yaratık ailesi: Bandikut (4 tür)
- **Bandikut nedir:** iri, kambur, kirli kahverengi kürklü, porsuk ile yaban domuzu arası bir leşçil memeli. Uzun burunlu, sarı dişli, küçük kırmızı gözlü. Vahran Ovası'nın ilk düşmanıdır.
- **Tuval:** 1024×1024, saydam. Yaratık **sola bakıyor**, 3/4 açıdan görünüyor.
- **Zemin çizgisi:** alt kenardan 48 px yukarıda. Normal tür tuvalin %60'ını kaplasın.
- Türler:
  - `bandikut`: temel tür.
  - `kucuk-bandikut`: %80 ölçek, genç.
  - `kuduz-bandikut`: ağzı köpüklü, tüyleri diken diken, gözleri parlayan.
  - `yaman-bandikut`: elit tür; sırtında kemik plakalar ve yara izleri var.
- Her tür için 3 poz: `bekleme`, `saldiri`, `vurulma`.
- **Ad kalıbı:** `yaratik-<tur>-<poz>.png`

### 4. Önizleme
- `onizleme.png` (1760×812): `REFERANS/01_ONAYLI_TARZ/sahne/savas-arka-selale.webp` arka planının üstüne solda Elentha savaşçısı (`bekleme`), sağda 3 bandikut koy.
- Karakterlerin altına yumuşak elips gölge çiz.
- Bu tek görsel, pilotun tutup tutmadığını gösterecek.

---

## PAKET G2 · Kalan 14 kahraman (G1 onaylandıktan sonra)
G1'deki kurallar aynen geçerli: tuval, zemin çizgisi, boy, sağa bakış ve 7 poz.
- **Ek:** `REFERANS/01_ONAYLI_TARZ/karakterler/` klasöründeki 14 karakter (savaşçılar hariç). Her birinin yüzü, saçı ve zırhı birebir korunacak.
- Sınıfa göre silah:
  - Suikastçı: iki hançer.
  - Büyücü: asa; `buyu` pozunda asanın ucu ileri dönük.
  - Şifacı/Şaman: referanstaki silah.
- Teslimi **iki ZIP'e** böl: önce Elentha (7 karakter), sonra Kragmir (7 karakter).
- **Ad kalıbı:** `kahraman-<halk>-<sinif>-<cinsiyet>-<poz>.png`. Sınıf adları: `savasci`, `suikastci`, `buyucu`, `sifaci`.

## PAKET G3 · Yaratık aileleri ve bosslar
G1 bölüm 3'teki tuval ve zemin kuralları aynen geçerli. Her mesajda **yalnız bir bölge** iste.

**Poz sayısı (kullanıcı kararı, mesajı göndermeden önce birini sil):**
- [ ] 3 poz: `bekleme`, `saldiri`, `vurulma`.
- [ ] Tek poz: yalnız `bekleme`. Hareketi oyun kodu verecek; bu yüzden pozu nötr tut, kollar ve kuyruk gövdeden ayrık dursun.

Bosslar her durumda 3 pozla çizilir.

**Kural:** her aile için bir ana tür çiz. Aynı ailenin diğer türleri ana çizimden renk, aksesuar, yara ve ölçek farkıyla türetilsin; ayrı ve yabancı tasarımlar olmasın.

**Boss kuralları:**
- Tuval 1536×1536, normal yaratıktan %40 daha iri.
- İki evre çizilecek: `evre1` ve `evre2`. Evre 2'de zırh kırılmış olsun, gözler parlasın, yara ve öfke görünsün.
- Her boss için ayrıca `portre` (512×512, göğüsten yukarısı, koyu sisli zemin). Bu portre boss can çubuğunda kullanılacak.

**Bölgeler ve aileler:**
- **Bölge 1 · Vahran Ovası** (yeşil ova, orman kenarı)
  1. Bandikut ailesi (G1'de yapıldı; yalnız eksik türler: Leşçil, Yamyam).
  2. Solucan ailesi: Solucan, Toprak Solucanı, Kan Solucanı, Mağara Sülüğü, Orman Sülüğü, Kapkaççı.
  3. Goblin ailesi: Goblin, Goblin Fedai, Goblin Ölücü, Kobold, Goblin Hokkabaz, Öcü, Hobgoblin.
  4. İskelet ailesi: İskelet, İskelet Savaşçı, Yanan İskelet, İskelet Şövalye, İskelet Er Başı.
  5. Kurt ailesi: Azman Kurt, Kurt Tazısı, Kasvet Tazısı, Cehennem Tazısı. **Boss: Kurtadam.** İki ayak üstünde, insan boyunun 1,5 katı, kurt başlı bir yaratık olmalı; insan yüzlü olmamalı.
- **Bölge 2 · Kül Geçidi** (volkanik, külle kaplı geçit)
  1. Örümcek ve akrep ailesi: Tarantula, Kıskaçlı Akrep, Karadul, Akrep, Uyuşturan, İğneli.
  2. Zombi ailesi: Zombi, Ölmeyen, Çürük Göz, Çürümüş Zombi, Kül Şövalye.
  3. Kertenkele Adam ailesi: Kertenkele Adam, Kertenkele Savaşçı, Çamur Adam, Kum Adam. **Boss: Kertenkele Yüzbaşı.**
  4. Golem ailesi: Alev Kayası, Taş Golem, Volkan Kayası, Dev Kaya, Kara Taş. **Boss: Dev Golem.**
  5. Ağaç Hayaleti ailesi: Ağaç Hayaleti, Kara Ağaç Hayaleti, Çöl Golemi, Titan. **Boss: Ağaç Hayaleti Kralı.**
- **Bölge 3 · Kızıl Bahar Meydanı** (kızıl çiçekli bozkır)
  - Kılıç Diş ailesi. **Boss: Megantereon.**
  - Trol ailesi. **Boss: Trol Kralı.**
  - Sentor ailesi. **Boss: Sentor Yüzbaşı.**
  - Harpi ailesi. **Boss: Harpi Kraliçesi.**
  - Yaban hayvanları (Maymun, Gliptodon, Mastodon, Minotor…). **Boss: Mantikor.**
- **Bölge 4 · Sisli Çukur** (sisli, ölü bataklık; Küllerin Tarikatı bölgesi)
  - Hayalet ailesi. **Boss: Mana Avcısı.**
  - Kara Şövalye ailesi. **Boss: Ölüm Şövalyesi.**
  - Ölü büyücü ailesi. **Boss: Liç.**
  - Kara Kısrak ailesi. **Boss: Mareşal Marven.**
  - Ejder kulları. **Boss: Tarikat Lideri / Adsız.**

**Adlandırılmış ana bosslar:** Dev Solucan, Tepegöz, Kristal Muhafızı, Lav Yürek, Kül Ağası Karadun, Mareşal Marven, Adsız. Bunlar ayrıca istenecek. Her biri hikâyede önemli; çizmeden önce `VAHRAN_destan.txt` dosyasında adını ara.

**Ad kalıbı:** `yaratik-<aile>-<tur>-<poz>.png`, `boss-<ad>-<evre1|evre2|portre>.png`

## PAKET G4 · Hikâye karakterlerinin portreleri
- **Karakterler:** Prenses Lira, Corin, Thrak, Şaman Yashka, İksirci Maelis, Tüccar Halvor, Kral Edran (Elentha), Kral Volgar Demirdiş (Kragmir). Kişilikleri ve görünüşleri için `VAHRAN_destan.txt` dosyasında adlarını ara. Bilgi yoksa sor.
- **Her karakter için iki görsel:**
  - `yarimboy`: 1086×1448, belden yukarısı, 3/4 açı, saydam zemin.
  - `yuz`: 512×512, omuzdan yukarısı, halk renginde sisli zemin (Elentha lacivert-gri, Kragmir kızıl-is).
- **Önemli:** bugünkü Kral Edran portresi fotoğraf gibi; Lira, Maelis ve Yashka ise çizgi film avatarı. İkisi de yanlış. Hepsi karakter oluşturma ekranındaki boyalı tarzda olacak.
- **Ad kalıbı:** `npc-<ad>-<yarimboy|yuz>.png`

## PAKET G5 · Tek parça boyalı sahneler
**Genel kurallar:**
- 2340×1080, WebP, saydam değil.
- Kamera haritalardaki gibi hafif yüksekten bakan, sinematik bir açıdan.
- Ekranın alt %25'inde ve sol üst köşede önemli ayrıntı olmasın; buralara arayüz gelecek.

**Sahneler:**
1. `koru-sancak`: Kemikli Koru, gece kampı (Elentha versiyonu). Sönmekte olan kamp ateşi, yaralı genç şövalye Corin, ağaçların arasındaki sisten parlayan sarı gözler. Ay ışığı mavi-gümüş.
2. `koru-ocak`: aynı yer, Kragmir versiyonu. Yaralı ork Thrak, kor ışığı, kızıl tonlar.
3. `maden`: fener ışığında mavi kristal damarlı maden galerisi, ahşap destekler, maden arabası. Ortada boş bir alan bırak; madenci figürü oyun tarafından eklenecek.
4. `dipsiz-kuyu`: aşağıdan soğuk mavi ışık vuran, çok derin, eski taş bir kuyu ağzı ve etrafında harabeler.
5. `yeralti-ocagi`: yerin altına inen, kor ışıklı demir merdivenler ve ocak kapıları.
6. `balik-tut`: şelale altında, ahşap iskele ve sakin göl. Yemin Pazarı'nın şelalesi; ekteki `sehir-carsi` görselinin sol üst köşesindeki yer.
7. `kristal-nobeti`: yıkık bir mabedin içinde sönmekte olan dev mavi kristal ve etrafında nöbet tutan meşaleler.
8. `dunya-baskini`: kül fırtınası altında Kül Ağası Karadun'un silüeti. Dev, zırhlı, kül rengi pelerinli; uzaktan görünüyor.
9. `minidizi-01` … `minidizi-10`: 1600×900 kapak kareleri, hikâyenin 10 bölümü. Konular `VAHRAN_destan.txt` dosyasından. Fragman tarzında, metinsiz.

## PAKET G6 · Yetenek simgeleri (B sınıfı)
- **Kart:** 256×256, saydam değil. Koyu kart zemini, ortada tek bir eylem. Zemin rengi elemente göre:
  - fiziksel: çelik gri
  - ateş: kor
  - buz: soğuk mavi
  - şimşek: menekşe-beyaz
  - zehir: yosun yeşili
  - kutsal: soluk altın
  - gölge: mor-siyah
- **Çerçeve:** çizme; oyun ekleyecek. Kenarlardan 16 px içeride kal.
- **Tarz:** eşya simgeleri gibi boyalı (`REFERANS/01_ONAYLI_TARZ/esya`). Düz siluet olmayacak; bugünkü beyaz siluet simgeler değiştiriliyor.
- **Liste:** yetenek adı, sınıf ve element listesi ayrı bir mesajla verilecek (Claude hazırlayacak). Her mesajda en çok 24 simge iste.
- **Ad kalıbı:** `yetenek-<kimlik>.png` (kimlik listede yazılı).

## PAKET G7 · Efekt şeritleri (VFX)
- **Biçim:** her efekt yatay bir şerit. 16 kare × 256 px = 4096×256, PNG, saydam zemin.
- Siyah zemin üstüne "toplamalı karışım" (additive) için hazırlanmış parlak efekt **değil**; gerçek alfa kullan. Kare dışında gri ya da siyah dikdörtgen kalmamalı.
- **Renk ve biçim kuralları:**
  - ateş: turuncu-kor, yukarı dalgalanır
  - buz: açık mavi, kristal kırılır
  - şimşek: beyaz-menekşe zikzak
  - zehir: yeşil damla ve buhar
  - kutsal: soluk altın ışın aşağı iner
  - gölge: mor-siyah, içe çöker
  - fiziksel vuruş: beyaz-çelik kıvılcım
  - şifa: yeşil-beyaz yükselen yapraklar
- **Efektler:** `ates-topu`, `alev`, `buz-kirilma`, `simsek`, `zehir`, `kutsal-isin`, `golge-cokus`, `vurus`, `kritik-vurus`, `sifa`, `kalkan-kubbe`, `boss-giris`, `parcalanma`.
- **Ad kalıbı:** `vfx-<ad>.png`

## PAKET G8 · Amblem ve logo (kullanıcı oyunun adına karar verdikten sonra)
- İki halk amblemi: Elentha güneş-kartal, Kragmir göz-örs. 1024×1024, saydam, kabartma metal görünüm, az altın.
- **Kesin kural:** hiçbir mevcut oyunun armasına (özellikle Horde/Alliance) benzemeyecek.
- Logo yazısı: kullanıcının seçtiği adla, demir dokulu.
