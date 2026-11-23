# GPT Astra 6.2 · TEK ZIP toplu görev (23.11)

**Kullanım:** Tek sohbet, tek mesaj, tek teslim. Bu dosyanın TAMAMINI yapıştır. Eklenecekler:
1. `REFERANS.zip` (onaylı tarz / kaçınılacak / oyun ekranı; `_tasarim/denetim-22kas/paket/REFERANS/`)
2. `REFERANS_EKRAN.zip` (11 güncel telefon ekranı; `_tasarim/proje-23kas/REFERANS_EKRAN/`)
3. `SANAT_KITABI.md` ve `VAHRAN_destan.txt`
4. Daha önce teslim edilen **G3 yaratık ve boss ZIP'leri (düzeltme teslimindeki 13 yaratığın `bekleme` ZIP'i dahil)** (bölüm B ve C için ölçü/tasarım referansı) ve **G4 portre ZIP'i** (NPC'ler için)
5. Varsa Gemini maketleri (`maket_*.png`, `olcu_*.md`; N1, N3, N8). Yoksa ekran görüntülerinden çiz, maket gelince yalnız ilgili klasör yenilenir.

**Tek teslim:** `DD_TOPLU_<tarih>.zip`. İçinde aşağıdaki klasörler ve kökte **tek** `manifest.json` (her kayıtta `klasor`, `dosya`, `ne`, `halk`, `genislik`, `yukseklik`, `saydam`, `not`) ile `onizleme.png` (tüm klasörlerden birer örnek).
Çok iş var: **öncelik sırasıyla çalış** (klasör numarası = öncelik). Bir klasörü tamamlayamazsan yarım teslim etme; bitmiş klasörleri ZIP'e koy, bitmeyenleri kökteki `EKSIK.md` dosyasına "hangi dosya, neden" diye yaz. Zayıf görseli "sonra düzeltilir" diye koyma.

**İşin özeti:**
| Klasör | İçerik | Öncelik |
|---|---|---|
| `01_madenci` | A5 madenci, kaya, araba, arka plan | yüksek |
| `02_taht` | A6 iki halk tahtı | yüksek |
| `03_npc_harita` | A7 haritadaki NPC'ler | yüksek |
| `04_ana_ekran` | A4 çerçeveler, hava ve Premium simgeleri | yüksek |
| `05_karakter_ekrani` | A1 Korant işareti, A2 zemin mührü, A3 başlık levhası | yüksek |
| `06_profil` | A8 profil arka planı | orta |
| `07_yaratik_pozlari` | 13 yaratığın saldırı ve vurulma pozları | orta |
| `08_boss_evre2` | Boss 2. evre gerçek dönüşüm çizimleri | orta |
| `09_portre_ve_yuz` | Mantikor/Megantereon portre, Kragmir 5. yüz | orta |
| `10_play_store` | Uygulama simgesi, öne çıkan görsel, mağaza ekran çerçeveleri | düşük |
| `11_kozmetik` | Portre çerçevesi, amblem, sancak örnekleri | düşük (isteğe bağlı) |

Video (Mini Dizi 10 bölüm), savaş/boss müziği ve karakter kuşanma katmanları bu teslimde **yok** (ayrı iş).

---

# ORTAK BÖLÜM (önceki görevlerle aynı; her şey için geçerli)
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

---

# P23 EK KURALLAR
- Oyunun adı **Korant**. Ekran 880×406 mantıksal, telefon 2340×1080 → görselleri **2× ya da 3×** çiz.
- Kullanıcı ayrı yapıştırılmış sprite görüntüsünü sevmiyor. Sahneye konacak her figür, konacağı sahnenin (REFERANS_EKRAN'daki görüntü) ışığına, perspektifine ve renk ısısına göre boyansın; ayakların altına ayrı katman olarak yumuşak **temas gölgesi** (`*_golge.png`) ver.
- Orklar **yeşil tenli** (Thrak gibi). Elentha: beyaz mermer, gümüş, lacivert. Kragmir: kararmış demir, bronz, kızıl deri, kor.
- Görselde yazı yok. Az altın.
---

# KLASÖR GÖREVLERİ

Aşağıdaki A5, A6, A7, A4, A1, A2, A3, A8 görevleri klasör numaralarıyla şöyle eşleşir: A5→`01_madenci`, A6→`02_taht`, A7→`03_npc_harita`, A4→`04_ana_ekran`, A1+A2+A3→`05_karakter_ekrani`, A8→`06_profil`. Dosya adlarını görevde yazıldığı gibi ver, klasörün içine koy.

### A1 · Korant işareti (U1)
- "Korant Online" başlığının önündeki yeni sembol. İki halkı birleştiren tarafsız bir işaret (örn. demir taç + kor/ışık), boyalı metal kabartma.
- Dosyalar: `korant-isaret-512.png` (saydam), ayrıca 192 ve 96 px'de okunur sade sürüm `korant-isaret-sade-192.png`.
- Gemini N1 tarifi varsa ona uy.

### A2 · Zemin mührü (U2)
- Karakter seçme/oluşturma ekranındaki zemin dairesinin içindeki sembol, iki halk için: `muhur-elentha.png` (güneş-kartal, mermere kakma gümüş/lacivert), `muhur-kragmir.png` (göz-örs, kararmış demire kor ışığı). Ekran 10'daki dairenin perspektifinde (yatay elips, yaklaşık 4,3:1), saydam, 2400×560.
- **A2-b (gerekirse, Claude isterse):** aynı arka planların daire içi sembolsüz sürümü.

### A3 · Başlık levhası (U3)
- "KARAKTER OLUŞTUR" yazısının konacağı yazısız levha, Gemini N1 maketindeki ölçüde, iki halk eşi (`levha-baslik-elentha.png`, `levha-baslik-kragmir.png`), 9-dilim kenar payları manifestte.

### A4 · Ana ekran çerçeveleri (U7)
- Gemini N3'te istenen parçalar: oyuncu kartı çerçevesi (portre halkası dahil), Görevler kutusu, hava kutusu, Premium kutusu; iki halk. Ayrıca 4 hava simgesi (`hava-acik/yagmur/sis/poyraz.png`, 128 px, boyalı) ve Premium simgesi (`premium-simge.png`, 128 px).

### A5 · Madenci ve maden sahnesi (U9) — en uzun iş, önce başla
Sahne: ekran 06. Oyuncu karakteri kalkıyor; yerine halka göre bir **madenci NPC**.
- **Madenciler:** `madenci-elentha` (insan, deri önlük, kazma, gümüş-lacivert ayrıntı), `madenci-kragmir` (yeşil tenli ork, kalın kollu, demir kazma). Yandan 3/4 görünüş, sahnedeki ışık. Kare kare, saydam, aynı tuval ve aynı ayak çizgisi (512×512, ayak y=480):
  - `kaz_01..06` (kazmayı kaldır → vur → geri çek; 6 kare döngü)
  - `yuru_01..06` (yürüme döngüsü, sağa bakış; Claude aynalayarak sola çevirir)
  - `bosalt_01..05` (arabayı devirip boşaltma)
  - `bekle_01..04` (depo dolu: kazmaya dayanıp soluklanma)
- **Kristal kayalar:** `kaya-mavi` (Elentha) ve `kaya-kirmizi` (Kragmir), her biri 3 aşama (`_1` tam, `_2` çatlak, `_3` yontulmuş), 512×384, saydam; vuruş anı için `kivilcim-mavi/kirmizi` 6 karelik şerit (her kare 128×128).
- **Maden arabası:** `araba_0, _25, _50, _75, _100` (boş → dolu; yük kristal rengi halka göre iki takım), 384×288, saydam.
- **Arka plan:** mevcut Elentha maden sahnesinin **karaktersiz** sürümü ve Kragmir eşi (kırmızı kristalli, kor ışıklı ocak), 2340×810 (ekran 06'daki şerit oranı), WebP.
- Kare listesini Gemini N5 denetler; düzeltme gelirse ona uy.

### A6 · Taht (U10)
- `taht-elentha.png` (beyaz mermer, lacivert kadife, gümüş güneş-kartal; az altın) ve `taht-kragmir.png` (kararmış demir, kemik, kızıl deri, göz-örs; kor ışığı). Önden hafif 3/4, boş, saydam, 768×768, temas gölgesi ayrı.

### A7 · Haritalardaki NPC'ler (U11)
- Tam boy, ayakta, saydam; haritadaki küçük boylarına uygun sade siluet ama boyalı (her biri 512 px yükseklik, 2 kare nefes: `_1`, `_2`). Mevcut yüz portreleriyle **aynı kişi** olmalı (REFERANS'taki G4 portreleri):
  - Elentha: Kral Edran, Tüccar Halvor, İksirci Maelis, Şaman Yashka, Lira, izci Corin.
  - Kragmir: Kral Volgar Demirdiş, izci Thrak, Kragmir haritalarındaki tüccar/iksirci/Yashka karşılıkları (Gemini N6 tablosu hangi NPC'nin hangi haritada durduğunu söyler; eksik kişi çıkarsa o tabloya göre çiz).
- Işık: haritaların gün ışığı (sol üst, sıcak). Temas gölgesi ayrı.

### A8 · Profil arka planı (U13)
- Gemini N8 maketine göre yazısız arka plan/levha (iki halk): koyu, sade, hafif doku; ortada boş alan bırakma. Ölçü maketten.


---

## 07 · Yaratık pozları (eski G3 eki)
Şu 13 tür oyunda **yalnız `bekleme` pozuyla** vuruyor. Her biri için `saldiri` ve `vurulma` pozlarını ver (26 dosya). Mevcut `bekleme` çizimleri G3 teslimlerinde var; **aynı tasarım, ölçek, tuval ve zemin çizgisiyle** devam et.
- Tuval 1024×1024 saydam, yaratık **SOLA bakar**, 3/4 açı, zemin çizgisi alt kenardan 48 px yukarıda, normal yaratık tuvalin %60'ı.
- Türler: `rabbit` (tavşan), `falcon` (şahin), `hornet` (eşek arısı), `gargoyle`, `leader_of_barbarian` (barbar lideri, **yeşil tenli ork**), `lamia`, `snake_queen`, 6 ejder: `red_dragon`, `red_dragon_hatchling`, `blue_dragon`, `bone_dragon`, `dark_dragon`, `gold_dragon`.
- Saldırı: yaratık kendi saldırısını yapar (ısırık, pençe, ateş/buz nefesi hazırlığı…); vurulma: geri sarsılır, gözler kısık. Ejderlerde nefes efekti çizime katılmaz (efekti oyun verir).
- Ad kalıbı: `yaratik-<tur>-saldiri.png`, `yaratik-<tur>-vurulma.png`.

## 08 · Boss 2. evre (eski G3 eki)
Bossların 2. evresi şimdi 1. evrenin kopyası. Her boss için gerçek **dönüşmüş** `evre2` çiz: zırh kırık ya da yırtık, gözler parlıyor, yaralar ve öfke görünür, silüt hâlâ aynı boss olarak tanınır.
- Bosslar: Dev Solucan, Tepegöz, Kristal Muhafızı, Lav Yürek, Kül Ağası Karadun, Mareşal Marven, Adsız; Kurtadam, Kertenkele Yüzbaşı, Dev Golem, Ağaç Hayaleti Kralı, Megantereon, Trol Kralı, Sentor Yüzbaşı, Harpi Kraliçesi, Mantikor, Mana Avcısı, Ölüm Şövalyesi, Liç, Tarikat Lideri.
- Ekli G3 ZIP'lerindeki `evre1` çizimi referans: aynı tuval (1536×1536), aynı zemin çizgisi, aynı yön. `evre2` için 3 poz: `bekleme`, `saldiri`, `vurulma`. Eksik (G3'te hiç gelmemiş) boss varsa `EKSIK.md`'ye yaz.
- Ad kalıbı: `boss-<ad>-evre2-<poz>.png`.

## 09 · Portre kırpımı ve Kragmir 5. yüz
1. `mantikor` ve `megantereon` için `portre` (512×512, boss kalıbıyla aynı: göğüsten yukarısı, koyu sisli zemin): `boss-mantikor-portre.png`, `boss-megantereon-portre.png`.
2. **Kragmir 5. yüz:** karakter oluşturmada Kragmir için 5 yüz yuvası var; 0–3 savaşçı, suikastçı, büyücü, rahip (şaman) yüzü, 5. yuva şimdi savaşçının aynası. Yeni bir **yeşil tenli ork yüzü** çiz (512×512, mevcut Kragmir yüzleriyle aynı çerçeve ve ışık; başka bir erkek/kadın ayrımı gerekmiyor, cinsiyeti `manifest.not` alanına yaz): `yuz-kragmir-5.png`.

## 10 · Play Store görselleri
Oyunun adı **Korant**. Görsel içinde yazı olmayacak (yazıyı Claude ekler); yalnız küçük logo/amblem serbest.
- `uygulama-simgesi-512.png` (512×512, tam kare, saydam değil; iki halkı birleştiren Korant işareti, 05 klasöründeki A1 ile uyumlu).
- `one-cikan-1024x500.png` (1024×500, WebP/PNG; yatay manzara: sol Elentha savaşçısı, sağ Kragmir savaşçısı, ortada gerilim, yazısız).
- `magaza-cerceve-1..6.png` (her biri 2340×1080 yatay; oyundan ekran görüntüsü koymak için arka plan/çerçeve: sade koyu zemin, köşelerde ince süs; ekran alanı ortada boş).

## 11 · Kozmetik örnekleri (isteğe bağlı, en son)
Yeni kozmetik dükkânı için örnek set (güce etkisi yok): `cerceve-1..4.png` (portre çerçevesi, 256×256 saydam: gümüş, bronz, kemik, kor), `amblem-1..4.png` (256×256 saydam; klan amblemi tarzı), `sancak-1..3.png` (256×512 saydam; her biri iki halk için: `-elentha`, `-kragmir`). Az altın; tarz kurallarına uy.

---

# TESLİMDEN ÖNCE (tek tablo)
Ortak bölümdeki 7 maddelik öz denetim tablosunu **klasör başına** bir satırla doldur; sonuna `EKSIK.md` dosyasının içeriğini ekle.
