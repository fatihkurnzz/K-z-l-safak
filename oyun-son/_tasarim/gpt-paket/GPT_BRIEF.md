# DEMİR DİYARI · VAHRAN: TARİHİN KÜLLERİ
# TAM GÖRSEL YENİDEN TASARIM VE ÜRETİM BRİFİ (sürüm 2 · 20.11.2026)

> Bu belge tek başına yeterlidir. Pakette yanında şunlar var:
> - `VAHRAN_destan.txt`: hikâyenin tamamı.
> - `OYUN_VERISI.md`: oyunun kaynak kodundan çıkarılmış gerçek eşya, silah, yetenek, yaratık ve boss listesi.
> - `EKRANLAR.md`: oyundaki gerçek ekranlar ve her ekranda korunması gereken düğmeler.
> - `oyun-kaynak.zip`: oyunun kendisi (incelemek için).
>
> **Her şey sıfırdan tasarlanacak.** Oyunun bugünkü görünüşü ve önceki denemelerde üretilen görseller örnek değildir; onlara benzemeye çalışma.
> - `ek/KONSEPT_BRIEF.md` ve `ek/YERLESIM_SPEC.md`: ayrıntılı renk ve ölçü belgeleri.
>
> Çelişki olursa öncelik sırası: **bu belge → YERLESIM_SPEC → KONSEPT_BRIEF**. Hikâyeyle ilgili konularda **VAHRAN_destan.txt** her şeyin önündedir.

---

## 0. İŞ BÖLÜMÜ (önce bunu oku)

Bu projede iki yapay zekâ çalışıyor:

- **Sen (görsel üretici):** görselleri, simgeleri, arka planları, portreleri, ekran maketlerini ve efekt kare dizilerini **dosya olarak** üretirsin. Her aşamayı ZIP olarak teslim edersin.
- **Claude (oyunun geliştiricisi):** senin dosyalarını oyuna yerleştirir. CSS ve JavaScript'i o yazar, oyunun kodunu o değiştirir, işlevsellik testlerini de o yapar.

Bu yüzden:
1. **Oyunun kodunu değiştirme, yeniden yazma, "düzeltilmiş oyun" teslim etme.** `oyun-kaynak.zip` yalnızca incelemen ve ekranları görmen içindir.
2. Ekran maketlerini (HTML/PNG) **görsel referans** olarak üretebilirsin. Oyuna gömülecek kodu Claude yazar.
3. 3B model (GLB) üretme. Oyundaki 3B karakter ve yaratık modelleri yerinde kalır. Senden istenen karakter ve yaratık sanatı **2B**'dir: konsept, portre, kart.
4. Ses ve müzik bu brifin kapsamında değil.

---

## 1. PROJEYİ TANI

- **Oyun:** Demir Diyarı · Sezon: *Vahran: Tarihin Külleri*.
- **Tür:** Sıra tabanlı, belirlenimci savaşlı, karakter gelişimli, klan ve PvP'li mobil RPG. Tarayıcıda çalışır (three.js r160, vanilla JS).
- **Yön:** Yalnızca **yatay**. Telefon dik tutulsa bile oyun 90° döndürülüp yatay çizilir.
- **Ekran:** Tasarım yüksekliği **1080**. Genişlik 1440 (tablet, 4:3) ile 2400 (telefon, 20:9) arasında değişir. Ana maket ölçüsü **2340×1080**, ikinci kontrol ölçüsü **1440×1080**. Gerçek telefonda mantıksal ekran yaklaşık **846×412 px**'e kadar küçülür (bkz. bölüm 12.3).
- **Dil:** Bütün oyun içi metinler Türkçe. Ancak görsellerin içine **yazı çizme**; yazıyı oyun koyar (bölüm 16).
- **Kalite hedefi:** Mağaza vitrinine çıkabilecek, büyük bir stüdyodan çıkmış gibi görünen, premium karanlık fantastik RPG. Ucuz, düz, çizgi film gibi ya da birbirinden kopuk görseller istenmiyor.

## 2. EN ÖNEMLİ KURAL: OYUNUN İŞLEYİŞİ AYNEN KALIR

İstenen şey **görsel ve sunum dönüşümüdür**. Yeni bir oyun yazmak değildir.

- Mekanikler, savaş hesapları, seviye, eşya değerleri, görevler, ekonomi, klan, PvP, zindan ve baskın sistemleri, kayıt ve sunucu yapısı **aynen kalır**.
- Her ekranın bugünkü **düğmeleri ve işlevleri** korunur. Maketlerde düğmenin görünüşünü değiştirebilirsin; düğmeyi kaldıramaz, yeni bir işlev uyduramazsın. Önce `EKRANLAR.md`'de o ekranda hangi düğmelerin olduğuna bak.
- **Olmayan eşya, silah, yetenek ya da yaratık çizme.** Listenin tamamı `OYUN_VERISI.md` içinde. Adlar ve türler oradan alınır.

### Fikrî mülkiyet uyarısı
Oyundaki bazı silah ve yetenek adları İngilizce ve başka bir oyundan gelmiş olabilir (ör. *Mirage Dagger, Iron Impact, Hell Fire*). Bunları çizerken **silahın türünü ve kademesini** koru (hançer, 7. kademe, kılıç, çift el balta…). Biçim ve süsleme ise tamamen **Vahran'a özgü** olsun. Hiçbir oyunun simgesini, eşya çizimini, logosunu ya da arayüzünü örnek alıp kopyalama.

## 3. DÜNYA VE HİKÂYE: "KÜL VE DEMİR"

Üç yüz yıllık savaşta iki halk birbirini düşman sanır. İkisini de yavaş yavaş griye çeviren üçüncü güç ise **Küllerin Tarikatı**'dır.

**Ana görsel fikir:** iki canlı renk dünyası ve onları sessizce griye çeviren kül.

1. **İki dünya, tek ova:** Kragmir ve Elentha ayrı malzemelere sahip ama aynı oyunun iki yüzü.
2. **Kül, üçüncü el:** Tarikat ya da tehlike göründüğünde renk çekilir; geriye gri kül ve sönmekte olan kor kalır. Bu, oyunun "tehlike dili"dir (boss kapıları, Tarikat görevleri, Sisli Çukur).
3. **Taş unutmaz:** Ortasından çatlamış dikilitaş oyunun ana simgesidir. Çatlak çizgisi arayüzde **ayraç**, **ilerleme** ve **seçili sekme** motifi olur. Rünler, ilerleme tamamlandıkça taşın içinden ışık alıyormuş gibi parlar.

- **Duygu:** ağır, kadim, yaralı, onurlu, umutlu ama bedelli.
- **Olmayacak:** sevimli, şeker renkli, çocuksu, çizgi film, aşırı neon, bilimkurgu.

## 4. İKİ HALK

> **Kodda halkların adı farklıdır:** Kragmir = **`ocak`**, Elentha = **`sancak`**. Dosya adlarında ve CSS'te bu iki kelimeyi kullan (ör. `panel-buyuk-ocak.png`, `html[data-faction="ocak"]`).

**KRAGMIR (`ocak`) · Orklar · Kral Volgar Demirdiş.** Dağın içindeki demir krallığı.
- Malzeme: kara ve dövme demir, kızıl toprak, ocak koru ve lav, kemik ve boynuz, zincir, perçin, oyma kaya, kemik rünler.
- Mimari: ağır, kaba, güçlü.
- Işık: sıcak turuncu ocak ışığı ile soğuk gri duman arasında sert zıtlık.
- His: sert, ağır, savaşçı, el yapımı.

**ELENTHA (`sancak`) · İnsanlar · Kral Edran.** Beyaz taş kulelerin ve mavi sancakların krallığı.
- Malzeme: ak mermer, gümüş çelik, kraliyet laciverti, altın telkari, beyaz sancak, cilalı metal, şövalye armaları.
- Işık: soğuk mavi sabah ışığı, yer yer altın parıltı.
- His: asil, zarif, düzenli, görkemli.

**Ortak kural:** İki halk aynı yerleşimi ve aynı parçaları kullanır. Değişen yalnızca malzeme, renk, ışık ve süslemedir. Her parça **iki sürüm** olarak, **aynı ölçüde** ve **aynı iç boşlukla** üretilir: biri diğerinin yerine konunca hiçbir şey kaymamalı.

## 5. RENK PALETİ

**Ortak:** Gece Taşı `#0E0B10` · Kömür `#1A1519` · İs `#2A2328` · Kemik `#E9E1D3` · Kül Grisi `#8D8790` · Kül Açık `#BFB9BE` · Sönen Kor `#C2471E` · Kan `#9E1B1B` · Şifa `#5FCB7A` · Mana `#3E8EF0` · Altın `#E2B44E`

**Kragmir (`ocak`):** Kara Demir `#2B2622` · Dövme Demir `#4A423B` · Ocak Koru `#FF7A1A` · Erimiş Demir `#FFB347` · Pas `#8A3B1E` · Kızıl Toprak `#6E1F14` · Kemik Rün `#D9C9A3`

**Elentha (`sancak`):** Ak Mermer `#EDEAE3` · Gümüş Çelik `#AEB8C4` · Kraliyet Laciverti `#1C3C9C` · Gök Mine `#3E7BE0` · Gece Mavisi `#0F1A3A` · Telkari Altın `#D9B04A` · Sancak Beyazı `#F7F5EF`

**Nadirlik çerçeveleri (görsel dil):** Sıradan `#9A9A9A` · Seçkin `#4FBF5A` · Nadir `#3E8EF0` · Destansı `#A65BF0` · Efsanevi `#F0A030` · Kadim `#E8473B`

> Oyunda bugün 3 eşya derecesi var: Standart, Nadir ve Eşsiz. Altı çerçevenin hepsini üret; hangi dereceye hangi çerçevenin geleceğini Claude eşler.

Renk tek başına bilgi taşımasın; her nadirliğin kendine özgü bir kenar ya da köşe süsü olsun. Metin ile zemin arasındaki kontrast en az 4.5:1 olmalı.

**Element renkleri:** Ateş `#FF6A1F` · Buz `#7FD6FF` · Yıldırım `#FFE35A` · Şifa `#8CF0A0` · Rün Mührü `#FFD98A` · Kara Rün `#7A3BB8` + kül grisi.

## 6. SANAT STİLİ

- **Stil:** Elle boyanmış görünümlü, stilize 3B / 2.5B karanlık fantastik. Fotogerçekçi olmak zorunda değil ama çocuksu da değil.
- **Karakterler:** Siluetler küçük boyutta bile ayırt edilmeli.
- **Malzeme:** Metalde çizik ve kenar aşınması, kumaşta dokuma hissi.
- **Işık:** Sinematik. Sıcak ana ışık, soğuk dolgu ve karakteri ayıran kenar ışığı.
- **Arayüz:** Sahneyi boğmamalı; oyun dünyası ekranın merkezinde kalmalı.
- **Tutarlılık:** Her dosya aynı sanat yönetiminin elinden çıkmış gibi görünmeli. Stilin çıpası Aşama 1'deki sanat yönetimi panosudur; onaylandıktan sonra bütün dosyalar ona uyar.

## 7. SINIFLAR

| Sınıf (kod) | Rol | Silah | Zırh | Dallar |
|---|---|---|---|---|
| Savaşçı (`warrior`) | Ön hat, tank ya da ağır vuruş | Kılıç, balta, çift el kılıç/balta, mızrak, topuz, kalkan | Plaka | Hücum, Siper, Öfke |
| Suikastçı (`rogue`) | Hız ve tek hedef hasarı | Hançer, jamadar, yay, arbalet | Deri | Hançer, Yay, İz |
| Şifacı (`priest`) | Şifa ve rün | Topuz, kalkan | Zincir | Şifa, Rün Mührü, Kara Rün |
| Büyücü (`mage`) | Alan hasarı ve kontrol | Asa | Cübbe | Ateş, Buz, Yıldırım |

İki halk × dört sınıf = **8 temel karakter görünümü** (konsept + portre). Kragmir karakterleri iri omuzlu ve ağır siluetli, Elentha karakterleri ince, uzun ve asil siluetli. Kadın ve erkek görünümler de var: her sınıf için portrenin iki cinsiyet sürümü.

## 8. HİKÂYE KARAKTERLERİ

Volgar Demirdiş, Edran, Lira, Thrak, Yashka, Marven, Adsız ve destanda geçen diğerleri. **Önce `VAHRAN_destan.txt`'yi baştan sona oku**; görünüşleri metindeki tariflerden çıkar.
- **Marven:** İlk bakışta güven veren bir mareşal, sonra soğuk ve tehlikeli.
- **Adsız:** Kül cübbesi; yüz yerine karanlık ve sönmekte olan iki kor göz.

Her biri için: tam boy konsept (1536×2048) ve diyalog portresi (1024×1024, şeffaf zemin, belden yukarı).

## 9. DÜNYA BÖLGELERİ

| Bölge | Seviye | Sanat |
|---|---|---|
| Vahran Ovası | 1–20 | Altın saat ışığı, uzun otlar, paslı miğferler, çatlak dikilitaş |
| Kül Geçidi | 20–40 | Dar kaya geçidi, yıkık kale, kül tabakası, soğuk gri ışık |
| Kızıl Bahar Meydanı | 40–60 | Çamurlu demir ova, kırık sancaklar, mızrak ormanı, kızıl şafak |
| Sisli Çukur | 60–65 | Kemik dolu çukur, ateşsiz kazan, rün taşları, ay ışığı |
| Mezarlık zindanları (Yeraltı Ocağı vb.) | — | Mezar taşları, eğri ağaçlar, mumlar, mor-mavi gece |

Her bölgede 25 aşama var, her 5 aşamada bir boss kapısı. Bölge başına üç görsel:
1. Geniş sahne konsepti (2340×1080).
2. **Savaş arka planı** (2340×1080). Orta alan karakterler için boş kalsın; sağ alt 600×520 ve sol alt 720×440 sakin olsun (savaş düğmeleri orada).
3. Dünya haritasında kullanılacak bölge kartı (768×432).

## 10. BOSSLAR VE YARATIKLAR

**Bosslar** (adlar `OYUN_VERISI.md`'den): Dev Solucan, Tepegöz, Kristal Muhafızı, Lav Yürek, Kül Ağası Karadun, Mareşal Marven, Adsız (Tarikat Lideri). Listede bunlardan başka bosslar da var (ör. Kurtadam, Kertenkele Yüzbaşı, Dev Golem, Ağaç Hayaleti Kralı, dünya ejderleri); onları da kapsa.

Her boss için:
- Tam boy konsept (2048×2048).
- Savaş portresi (512×512, şeffaf).
- Boss kartı (768×1024).

**Normal yaratıklar:** `OYUN_VERISI.md` içinde bölgelere göre aileler halinde listeli. Her **aile** için bir portre (512×512, şeffaf). Yaratıklar bulundukları bölgenin malzemesinden doğmuş gibi görünsün.

## 11. YENİDEN TASARLANACAK EKRANLAR

Tam liste ve her ekrandaki düğmeler: `EKRANLAR.md`.

Gruplar:
- **Açılış:** yükleme, sunucu seçimi, giriş.
- **Karakter:** karakter oluşturma, karakter seçme.
- **Ana merkez:** iki başkent, Yemin Pazarı (tarafsız pazar kasabası), Klan Toprağı.
- **Dünya:** Kapı, dünya haritası, bölgeler, 25 aşama, boss kapıları.
- **Savaş:** savaş öncesi ekran, normal ve boss savaş HUD'u, sıra şeridi, can ve mana, yetenekler, hız/OTO/çekil düğmeleri, zafer ve yenilgi, savaş dökümü.
- **Karakter ekranları:** karakter, Çanta, eşya ayrıntısı ve karşılaştırma, yuvalar, nitelikler, Örs (güçlendirme), Parçala ya da Sat.
- **Yetenekler:** yetenek ağacı, 12 dal, kilitli ve açık durumlar.
- **Görev ve hikâye:** Görevler, Görev Defteri, Günlük Görevler, Destan (8 bölüm), diyaloglar, Mini Dizi.
- **Klan ve rekabet:** Klan Karargâhı, Hisar ve İttifak, Meydan (arena) ve Meydan Sezonu, Şan Divanı, Sıralama, CZ-PK.
- **Etkinlikler:** Zindan (Yeraltı Ocağı), Baskın, Nöbet (Şaman Yashka), Seri Savaş.
- **Ekonomi:** Çarşı/Pazar, Tüccar, Karaborsa, Kervan (mağaza), Premium, İlk Alım Paketi, Ödül Sandığı, Kader Çarkı, Maden, Taş Yemini.
- **Diğer:** Balık Tut ve Balık Defteri, sohbet, arkadaşlar, parti, Posta, Duyuru, Bildirimler, Ansiklopedi/Rehber, öğretici, Ayarlar ve Grafik, Destek, Şikâyet, profil fotoğrafı ve çerçevesi, unvan, Kral Otağı.

Oyunda bu listede olmayan bir ekran görürsen onu da kapsa ve MANIFEST'te belirt.

## 12. ANA MERKEZ ŞEHİR EKRANI

Kamera yüksekten ve çapraz bakar (yaklaşık 45° izometrik). Her iki başkentte **aynı yerlerde 9 bina** bulunur; yalnızca mimari malzeme ve ışık değişir.

| # | Bina | Ne olmalı | Yaklaşık yer |
|---|---|---|---|
| 1 | Kader Çarkı | Dev, dik duran taş çark; kor (Elentha'da mavi-beyaz ışık), rünlü halka | sol üst |
| 2 | Örs | Demirci ocağı, dev örs, lav olukları (Elentha'da taş kemerli kraliyet demirhanesi) | üst orta-sol |
| 3 | Kral Otağı | Kral Volgar'ın kara demir otağı / Kral Edran'ın mermer sarayı; en yüksek yapı | üst orta |
| 4 | Taş Yemini | Ortasından çatlamış, rünleri parlayan dev dikilitaş ve yemin meydanı | tam orta |
| 5 | Çarşı | Tenteli tezgâhlar (Yemin Pazarı'na açılan geçit) | sol orta |
| 6 | Maden | Kristal damarlı maden ağzı, ray ve vagon | sol alt |
| 7 | İksir ve Parşömen | Şaman Yashka'nın dumanlı çadırı / simyacı kulesi | sağ üst |
| 8 | Karaborsa | Ara sokakta gizli, külle kaplı dükkân | sağ orta |
| 9 | Kapı | Dev sur kapısı (savaşa çıkış) | sağ alt, köşeden içeride |

**Teslim (iki halk için):**
1. Şehir resmi **2340×1080** (JPEG ya da WebP). 3600 geniş sürüm istenmiyor; oyun resmi yana kaydırır.
2. **Bina koordinat listesi:** her binanın kutusu (sol, üst – sağ, alt) ve etiket noktası. İki halkta yerler mümkün olduğunca aynı olsun.
3. **Bina parçaları (9 × 2):** arka plandaki binanın aynısı, aynı açı ve ışıkta, tek başına, şeffaf zeminde. Bina tuvali doldursun (kenarda 32 px boşluk), komşu binadan parça girmesin. 1024×1024.
4. **Alt şerit simgeleri** (madalyon stili): Karakter, Çanta, Görevler, Ana Görev, Klan, Kervan (mağaza), Savaş, Başarım, Ansiklopedi.
5. **Sol ray simgeleri:** Menü, Duyuru, Diyar Haritası, Posta, Takvim, Bildirim.
6. **Sağ ray / etkinlik simgeleri:** Meydan (arena), Zindan, Baskın, Etkinlik, Ödül Sandığı, Mini Dizi.
7. **Kaynak simgeleri:** Akçe (oyma demir sikke), Yakut (kızıl kor kristali), Enerji (yanan rün), Şan, Örs Tozu, Külçe.
8. **Düğme zeminleri:** büyük SAVAŞ düğmesi (normal ve basılı), Kervan düğmesi, bina adı levhası. Yazı yok.
9. **İsteğe bağlı:** Yemin Pazarı (tarafsız pazar kasabası: iki halkın tezgâhları, Karaborsa, Şaman Yashka, Taş Yemini, iskele) ve Klan Toprağı için de 2340×1080 şehir resmi.

### 12.3 Telefon gerçeği
Gerçek telefonda (846×412 mantıksal px) profil kartı, sohbet ve görev izleyici ekranın **sol üst, sol alt ve sağ** kenarlarını kaplar. Önemli her şeyi resmin **orta %60'ına** koy. Kenar boşlukları (üst 140, alt 160, sol 120, sağ 220 ve sağ alt 600×520) bütün tam ekran resimler için geçerli.

## 13. UI KIT (iki tema)

### 13.1 Kesin yasaklar (önceki denemede yaşandı)
- Sprite sayfasından kesip "arka planı silme" yöntemiyle parça üretme. Geçen sefer panellerin iç dolguları da silindi ve kit kullanılamaz hâle geldi.
- Dama tahtası desenini şeffaflık sanma.
- Normal ve basılı durumu aynı dosyaya koyma.

### 13.2 Kurallar
- Her parça **ayrı üretilir**, şeffaf zeminle (gerçek RGBA).
- **Dış alan alfa = 0, panelin ve düğmenin iç yüzeyi alfa = 255 (opak).**
- Her parçayı teslim etmeden önce **Python ile denetle** (bölüm 19'daki betik) ve çıktısını MANIFEST'e ekle.

### 13.3 Parçalar ve ölçüler (her biri × 2 halk)

| Parça | Ölçü | Durumlar |
|---|---|---|
| Panel büyük / orta / küçük | 1024×640 / 640×480 / 384×384 | tek; 9-dilim kenar payı MANIFEST'te |
| Panel başlık şeridi | 1024×128 | tek |
| Düğme: birincil, ikincil, tehlike | 480×160 | normal, basılı, pasif |
| Düğme: yuvarlak, kapat, geri | 192×192 | normal, basılı |
| Sekme: yatay, dikey | 360×120 / 280×120 | normal, seçili (çatlak ışık motifi) |
| Çubuk: can, mana, XP, ilerleme | 768×96 | **boş çerçeve** ve **dolgu** ayrı dosya |
| Kaynak sayacı: Akçe, Yakut, Enerji, Şan | 512×128 | tek (simge ayrı dosyada) |
| Eşya yuvası: 6 nadirlik + boş yuva | 256×256 | normal, seçili |
| Rozet: seviye, 1/2/3 yıldız, kilit, YENİ zemini, sayı zemini, bildirim noktası | 192×192 | tek |
| Ayraç: çatlak dikilitaş çizgisi | 1024×48 | tek |
| Kutu: onay kutusu, kaydırıcı, açma/kapama düğmesi | 192×96 | açık, kapalı |
| Toast, modal arkası, alt sayfa (bottom sheet) | 1024×256 / 1280×800 / 1600×600 | tek |

**Yazı:** Rakamlar ve harfler görselin içine çizilmez. Rozetin içindeki "50" ya da "YENİ" yazısını oyun koyar.

## 14. SİMGE SETİ, EŞYALAR, YETENEKLER

- **Menü ve sistem simgeleri (≥ 40, iki halk):** Çanta, Harita, Klan, Meydan, Görev, Kervan/Mağaza, Ayarlar, Sohbet, Posta, Sıralama, Sandık, Balıkçılık, Hisar, Zindan, Baskın, Nöbet, Karaborsa, Rehber, Destan, Mini Dizi, Takvim, Bildirim, Duyuru, Arkadaşlar, Parti, Profil, Başarım, Kader Çarkı, Örs, Maden, Taş Yemini, İksir ve Parşömen…
- **Nitelik simgeleri:** Güç, Dayanıklılık, Çeviklik, Zekâ, Büyü Gücü, Can, Mana, Saldırı, Savunma, Hız, Kritik.
- **Element ve durum etkisi simgeleri:** Ateş, Buz, Yıldırım, zehir, yanık, donma, sersemleme, kanama, kalkan, lanet, uyku, yavaşlama, güçlendirme ve zayıflatma.
- **Eşya simgeleri:** `OYUN_VERISI.md`'deki **14 silah türünün her biri için 8 kademe** (Paslı → Efsunlu malzeme ilerlemesi). Ayrıca zırh yuvaları (Baş, Gövde, Bacak, El, Ayak) × 4 zırh türü (plaka, deri, zincir, cübbe) × 8 kademe; takılar (Küpe, Kolye, Yüzük, Kemer); iksirler, parşömenler, Örs Tozu, bileği taşı ve sandıklar.
  - **Öncelik:** önce her silah türünün 1., 4. ve 8. kademesi ile her zırh türünün 1. ve 8. kademesi. Kalanlar sonra.
- **Yetenek simgeleri:** 12 dalın bütün yetenekleri (adları `OYUN_VERISI.md`'de). Dal başına bir renk ve çerçeve dili.
- **Ölçü:** 256×256, kare, ortalanmış, 16 px iç boşluk, şeffaf zemin.

## 15. SAVAŞ EFEKTLERİ (VFX)

- **Savaş:** Sıra tabanlı ve belirlenimci. Takımlar karşılıklı dizilir.
- **Elementler:** Ateş, Buz, Yıldırım, Şifa, Rün Mührü, Kara Rün.
- **Her dal için imza efekti:** çıkış, mermi, çarpma ve kalıcı durum aşamaları ayrı.
- **Teslim biçimi:** Şeffaf PNG **kare dizisi** ya da tek **sprite sayfası** (VFX için sprite sayfası serbesttir). Kare boyutu 256×256, 8–16 kare. MANIFEST'te kare sayısı, sütun sayısı ve FPS belirtilir.
- **Mobil sınırlar:** Aynı anda yaklaşık 150 parçacık, az sayıda üst üste binen yarı saydam katman, efekt süresi 0.3–0.8 sn. Sarsıntı, vuruş duraksaması (hit-stop) ve hasar sayıları kodla yapılır; senden yalnızca görselleri istenir.

## 16. TEKNİK TESLİM KURALLARI

- **Biçim:** PNG (şeffaf olanlar), JPEG ya da WebP (opak arka planlar). **SVG, AVIF, BMP, TGA, TIFF, PSD, GLB yasak.**
- **Şeffaflık:** Gerçek alfa kanalı (RGBA).
- **Yazı:** Görsellerin içinde yazı, harf, rakam ya da logo yok. Tek istisna logo teslimi (bölüm 18, Aşama 8).
- **Ölçek:** Arayüz parçaları 2 kat çözünürlükte çizilir (yukarıdaki ölçüler zaten 2 kat).
- **Dosya boyutu:** Sıkıştırma ve WebP'ye çevirme Claude'da. Senden makul boyut beklenir: tek dosya en çok 8 MB, aşama ZIP'i en çok 200 MB.
- **Dosya adı:** küçük harf, Türkçe karakter yok, kelimeler tireyle ayrılır, halk soneki `-ocak` / `-sancak`, durum soneki `-normal` / `-basili` / `-pasif` / `-secili` / `-dolu` / `-bos`.
  - Örnek: `dugme-birincil-basili-ocak.png`, `cubuk-can-dolu-sancak.png`, `simge-canta-ocak.png`.
- **Kod (yalnız maket için):** düz CSS, framework yok, dış bağlantı yok. Tema seçimi `html[data-faction="ocak"]` / `html[data-faction="sancak"]`. Yazı tipleri: başlık **Cinzel**, gövde **Inter** (ikisi de oyunda gömülü). Türkçe harf testi: İ ı Ğ ğ Ş ş Ö ö Ü ü Ç ç.

## 17. KLASÖR DÜZENİ (her aşama ZIP'inde)

```
teslim-asamaN/
  MANIFEST.md          dosya yolu · ölçü · biçim · şeffaf mı · kullanım · ekran · 9-dilim payı · (VFX) kare/sütun/FPS · alfa denetimi sonucu
  onizleme.png         aşamadaki her şeyin tek sayfada küçük önizlemesi (yalnızca bakmak için; parça buradan kesilmez)
  ui/ocak/  ui/sancak/  ui/ortak/
  simge/  esya/  yetenek/
  bg/  portre/  konsept/
  maket/               ekran maketleri (2340×1080 PNG + isteğe bağlı HTML)
  vfx/  logo/
```

## 18. AŞAMALAR

Her aşamayı bitir, **denetle**, ZIP olarak teslim et ve **onay bekle**. Onay gelmeden sonraki aşamaya geçme.

| Aşama | İçerik |
|---|---|
| **1 · Sanat yönetimi** | Paketi incelediğini kanıtlayan kısa rapor (hangi dosyaları okudun, kaç ekran ve kaç eşya türü saydın). Sanat yönetimi panosu (renk, malzeme, ışık, iki halk yan yana). Her iki halk için **1 büyük panel + 1 birincil düğme (normal ve basılı)** örneği, alfa denetimi yapılmış olarak. |
| **2 · UI kit** | Bölüm 13'ün tamamı, iki halk. |
| **3 · Ana merkez** | Bölüm 12'nin tamamı. |
| **4 · Kritik ekranlar** | Karakter oluşturma, savaş HUD'u (normal ve boss), savaş sonucu. Maket ve ekrana özel parçalar. |
| **5 · Diğer ekranlar** | Bölüm 11'in kalanı. Önce Çanta, Karakter, Yetenek ağacı, Görevler, Klan; sonra kalanlar. |
| **6 · Dünya ve karakter sanatı** | Bölge arka planları, sınıf portreleri, hikâye karakterleri, bosslar, yaratık aileleri. |
| **7 · Eşya, yetenek, VFX** | Bölüm 14 ve 15. |
| **8 · Logo ve açılış** | Çatlak dikilitaş logosu (yazılı ve yazısız), yükleme ekranı resmi, uygulama simgesi (512×512 ve 192×192). |

Oyuna yerleştirme ve testler **Claude'dadır**. Senden ayrıca entegrasyon aşaması istenmez.

## 19. KALİTE KONTROL VE KABUL

Teslimden önce her ZIP için:
1. Bütün dosyalar gerçekten var, ölçüleri MANIFEST'teki gibi.
2. Şeffaf olması gereken dosyalar RGBA. Kenarlar alfa 0, panel ve düğme içi alfa 255.
3. İki halkın parçaları aynı ölçü ve aynı yerleşimde.
4. Görsellerde yazı yok.
5. Hiçbir parça sprite sayfasından kesilmemiş (VFX hariç).
6. Bir dosyayı üretmediysen üretmiş gibi gösterme. Bir denetimi yapmadıysan yapmış gibi yazma.

Alfa denetimi için şu betiği çalıştır ve çıktısını MANIFEST'in sonuna ekle:

```python
from PIL import Image; import glob, os
for f in sorted(glob.glob('**/*.png', recursive=True)):
    im = Image.open(f); w, h = im.size
    if im.mode != 'RGBA': print(f, w, h, im.mode, 'ALFA YOK'); continue
    a = im.getchannel('A'); hist = a.histogram(); n = w * h
    kose = [a.getpixel(p) for p in [(0, 0), (w-1, 0), (0, h-1), (w-1, h-1)]]
    merkez = a.getpixel((w // 2, h // 2))
    print(f, w, h, f'bos%={100*hist[0]/n:.0f}', f'opak%={100*sum(hist[250:])/n:.0f}', 'kose', kose, 'merkez', merkez)
```

- Panel ve düğmelerde köşeler 0, merkez 255 olmalı.
- `bos%` 85'in üstündeyse parça muhtemelen bozuktur (önceki kitte %89'du).

---

**Son söz:** Birkaç örnek görsel değil, oyunun tamamının görsel dönüşümü isteniyor. Her ekran, simge, panel, karakter ve efekt aynı dünyanın parçası olmalı. Her aşama gerçek, denetlenmiş dosyalar ve düzenli ZIP'ler hâlinde gelsin.
