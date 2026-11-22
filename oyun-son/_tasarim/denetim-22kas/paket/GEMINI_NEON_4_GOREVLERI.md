# Gemini Neon 4 · Demir Diyarı bağımsız görsel denetim, arayüz maketi ve adlandırma görevleri

**Kullanım:** Her yeni sohbette önce **ORTAK BÖLÜM**'ü, ardından **yalnız bir GÖREV**'i yapıştır. `REFERANS.zip` dosyasını ve görevde yazan diğer dosyaları ekle.

**Neden sen?** Gemini, görselleri GPT'nin ürettiği bir projede **bağımsız denetçi** olarak çalışıyor. Bir modelin kendi işini kendisinin onaylamaması için kabul kararı sende. Ayrıca uzun video ve uzun liste incelemesi gerektiren işler ile arayüz maketleri de sende.

---

## ORTAK BÖLÜM (her mesajın başına yapıştır)

Sen bir mobil oyun stüdyosunun **sanat yönetmeni ve arayüz tasarımcısısın**. Önceki konuşmalar hakkında hiçbir bilgin yok. Gereken her şey bu mesajda ve eklerde.

### Oyun
- **Demir Diyarı**: telefonda yatay oynanan, sıra tabanlı fantastik RPG. Ekran mantıksal olarak 880×406 piksel, telefonda 2340×1080.
- İki halk var:
  - **Elentha** (insan): beyaz mermer, gümüş, lacivert, gök mavisi.
  - **Kragmir** (ork): kararmış demir, bronz, kızıl deri, kemik, kor.
- Dört sınıf: Savaşçı, Suikastçı, Büyücü, Şifacı/Şaman. Bütün oyun metinleri Türkçe.

### Sanat kitabı (bütün kararlarını buna göre ver)
1. **Tarz:** yarı gerçekçi, elle boyanmış dijital resim. Fotoğraf gerçekliği, çizgi film, düz vektör ve kalın kontur yasak.
2. **Ölçü:** `REFERANS/01_ONAYLI_TARZ/` klasöründeki görseller. Kötü örnekler `REFERANS/02_KACINILACAK/` klasöründe.
3. **Işık:** sol üstten sıcak anahtar ışık, sağdan soğuk ve zayıf dolgu.
4. **Ortak palet:**
   - Kömür #0e0b10 (zemin)
   - İs #1a1519 (panel)
   - Kurum #2a2328 (kart)
   - Kemik #e9e1d3 (metin)
   - Kül #8d8790 (ikincil metin)
   - Eski altın #c9a45c (yalnız vurgu)
   - Can #b8322c, Mana #3e7fd6, Şifa #5fbf78, Uyarı #e0a030
   - Eşya dereceleri: Standart #b9c0c8, Nadir #4aa3ff, Eşsiz #ffb52e
5. **Elentha renkleri:** #1f2c40, #4d8cc9, #c9d3dc, #e8ddc5.
6. **Kragmir renkleri:** #2b211b, #a66a39, #c2552b, #d9c9a3.
7. **Simge sınıfları:**
   - A (eşya): boyalı, 3/4 açı.
   - B (yetenek): boyalı kare kart.
   - C (arayüz): tek renk kabartma metal glif, 2 px çizgi, 24/32/48 ızgarası.
   - Bunların dışında simge dili olmaz.
8. **Yazı tipleri:**
   - Cinzel 700/900: yalnız başlık ve adlarda.
   - Inter 400/600/800: diğer her şey.
   - Boyut ölçeği (880×406'da): 11/13/15/18/22/28/36. En küçük boyut 11 px.
9. **Düğme rolleri:**
   - Birincil: halk rengi dolgu ve ince altın kenar.
   - İkincil: koyu dolgu ve Kül rengi kenar.
   - Tehlike: Can kırmızısı.
   - Satın alma: birincil düğme ve solda para simgesi.
   - Yükseklik 40 px (küçük düğmede 32 px). Kapat düğmesi her yerde 40×40, sağ üstte.
10. **Halk farkı:** iki halk arasındaki fark yalnız renkte, malzemede ve amblemde olur. Düzen, ölçüler ve yazı iki halkta aynıdır.

11. **Ekran ölçüleri:** asıl ölçü 880×406. Arayüz 667×375 (dar telefon) ve 1180×820 (tablet) ölçülerinde de çakışmasız olmalı. Bugün 667×375'te alt şeritteki dock, Görevler panelinin altına giriyor; bu bilinen bir sorun.

Emin olmadığın bir noktada tahmin etme; açıkça "DOĞRULANAMADI" yaz ve nedenini söyle.

---

## GÖREV M1 · GPT teslimlerinin bağımsız kabul denetimi (her GPT teslimi için tekrarlanır)

**Ekler:** GPT'nin teslim ZIP'i (ya da içindeki görseller ve `manifest.json`) ve `REFERANS.zip`.

**Ne yapacaksın:** Teslimdeki **her görseli tek tek** aşağıdaki 8 ölçüte göre puanla. Her ölçüt için 0 (yok), 1 (kısmen) veya 2 (tam) ver.

1. **Tarz eşleşmesi:** `01_ONAYLI_TARZ` görsellerinin yanında aynı ekipten çıkmış gibi mi? Fırça dokusu, kontursuzluk, ışık.
2. **Işık:** sol üstten sıcak anahtar ışık, sağdan soğuk dolgu var mı?
3. **Kimlik:** karakter ya da yaratık referansıyla aynı mı (yüz, saç, zırh, renk)? Halk kimliği doğru mu?
4. **Yasak yok:** fotoğraf gerçekliği, çizgi film, düz vektör, kontur, görselde yazı, başka oyuna benzerlik var mı?
5. **Okunurluk:** 880×406 ekranda gerçek boyutuna küçültüldüğünde (kahraman yaklaşık 260 px boy, yaratık 200 px, simge 48 px) siluet ve sınıf hâlâ anlaşılıyor mu?
6. **Teknik:**
   - Saydam zemin gerçek mi (dama deseni ya da beyaz zemin yok mu)?
   - Kenarda halo var mı?
   - Ölçü manifestle aynı mı?
   - Zemin çizgisi tutarlı mı?
7. **Poz tutarlılığı:** aynı karakterin pozları üst üste konduğunda ölçek ve ayak noktası sabit mi?
8. **Eşlik:** iki halkın eşi ve bütün pozlar eksiksiz mi?

**Karar kuralı:**
- Toplam 13 ve üzeri ve hiçbir ölçüt 0 değil → **KABUL**.
- Toplam 10–12 → **DÜZELTME**: neyin düzeltileceğini somut yaz. Örnek: "sağ kolun gölgesi sağdan düşüyor, sola al". "Daha iyi yap" gibi genel ifadeler kullanma.
- Toplam 10'un altında ya da 4. ölçüt 0 → **RET**.

**Teslim biçimi** (yalnız bu tabloyu ve sonunda kısa bir özeti yaz):

| dosya | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | toplam | karar | somut düzeltme |
|---|---|---|---|---|---|---|---|---|---|---|---|

Sonuna şunları ekle:
1. GPT'ye gönderilecek **düzeltme mesajı**: kopyalanıp doğrudan yapıştırılabilir, yalnız düzeltilecek dosyaları ve düzeltmeleri içeren kısa bir metin.
2. Bütün paket için tek satırlık genel karar.

## GÖREV M2 · Oynanış videolarının kare kare animasyon ve geçiş denetimi

**Ekler:** `akis_ELENTHA_insan.mp4` ve `akis_KRAGMIR_ork.mp4` (her biri yaklaşık 170 sn; kullanıcının `Korant_Denetim_04_EKRAN_c_VE_VIDEOLAR.zip` paketinden), `REFERANS.zip`. Videolar oyunun 22 Kasım öncesi hâlidir; gördüğün sorunun hâlâ geçerli olup olmadığını Claude oyunda doğrulayacak.

**Ne yapacaksın:** Videoları baştan sona izle ve aşağıdakileri **zaman koduyla** kaydet:

1. **Ekran geçişleri:** her geçişin süresi (ms tahmini). Geçiş türü: anlık kesme, solma veya kayma. Siyah ya da boş kare var mı, yükleme takılması var mı?
2. **Savaş animasyonları:**
   - Bekleme, saldırı, vurulma, ölüm ve zafer anları ayrı ayrı görünüyor mu?
   - Vuruşta durma (hit-stop), sarsıntı ve hasar sayısı var mı?
   - Efekt ile vuruş anı aynı karede mi?
3. **Tutarsızlıklar:**
   - Karakter oluşturmadaki kahraman ile savaştaki kahraman aynı kişi mi?
   - Arka plan ile birimlerin ışığı uyumlu mu?
   - Arayüz öğeleri sahnenin önemli bir kısmını örtüyor mu?
4. **İki halk karşılaştırması:** aynı ekranlarda Elentha ve Kragmir arasında düzen farkı var mı? Olmamalı; yalnız renk ve malzeme farklı olmalı.

**Teslim:** bir tablo ve en önemli 10 sorun.

| zaman | halk | ekran | gözlem | önem (Kritik/Yüksek/Orta/Düşük) | öneri |
|---|---|---|---|---|---|

**Önemli:** videoda göremediğin bir şey için tahmin yürütme. Örneğin kare hızı ölçülemez; "ölçülemedi" yaz.

## GÖREV M3 · C sınıfı arayüz glif seti

**Ekler:** `REFERANS/03_OYUN_EKRANI/` klasöründeki ekran görüntüleri. Bugünkü sekizgen, düz, çizgi film simgeleri değiştirilecek.

**Ne yapacaksın:** Aşağıdaki 40 glifi üret.
- **Tuval:** 96×96, PNG, saydam.
- **Görünüm:** tek renk açık gri #e9e1d3. Oyun bunu halk rengine boyayacak. Hafif kabartma metal hissi için yalnız iç gölge ve üst kenar ışığı kullan; renk kullanma.
- **Çizgi:** 2 px karşılığı kalınlık (96 px tuvalde 6 px). Glif tuvalin ortasında, kenarlardan 12 px içeride.
- **Tutarlılık:** hepsi aynı çizgi kalınlığında, aynı köşe yuvarlaklığında ve aynı görsel ağırlıkta olacak.

**Liste ve dosya adları:**
`karakter`, `canta`, `gorevler`, `klan`, `kervan`, `savas`, `menu`, `ayarlar`, `posta`, `bildirim`, `duyuru`, `takvim`, `basarim`, `siralama`, `arkadas`, `sohbet`, `harita`, `ansiklopedi`, `meydan`, `zindan`, `baskin`, `ors`, `maden`, `pazar`, `kapi`, `portal`, `kilit`, `geri`, `kapat`, `ekle`, `onay`, `uyari`, `bilgi`, `yenile`, `otomatik`, `hiz`, `iksir-can`, `iksir-mana`, `yildiz`, `tac`

**Dosya adı kalıbı:** `glif-<ad>.png`

**Teslim:** tek ZIP. İçinde 40 PNG, `manifest.json` (dosya, ad, anlam) ve `onizleme.png`. Önizlemede bütün glifler koyu zemin üstünde 48 px boyutta, ızgara hâlinde gösterilsin.

## GÖREV M4 · Arayüz maketleri (5 ekran × 2 halk)

**Ekler:** `REFERANS/03_OYUN_EKRANI/` (bugünkü ekranlar) ve `REFERANS/01_ONAYLI_TARZ/`.

**Ne yapacaksın:** Her ekran için 1760×812 (880×406'nın 2 katı) bir maket görseli. Her ekran iki halk için ayrı çizilecek: `maket-<ekran>-<sancak|ocak>.png`. Bu maketler kodlanacak; bu yüzden **ölçülü ve uygulanabilir** olmalı. Hayalî süsler ekleme.

1. **`vs`** (savaş öncesi):
   - Solda kahramanın 2B tam boy çizimi, sağda düşmanın ana çizimi (ekteki karakter ve yaratık görsellerini kullan).
   - Ortada ince demir ayraç, alt şeritte dalgalar küçük portrelerle.
   - Sağ altta "Başla ⚡6" birincil düğme, yanında "Oto" ikincil düğme.
2. **`sonuc-zafer`** ve **`sonuc-yenilgi`**:
   - Üstte halk arması ve başlık (Cinzel 36).
   - 3 büyük yıldız.
   - Ödül kartları: Akçe, Deneyim, Eşya (eşya boyalı simgeyle).
   - Düğmeler: Tekrar, Devam, Şehre dön.
   - Yenilgide soğuk gri ton ve kırık sancak.
3. **`karakter`** (ekipman penceresi):
   - Solda pencere sekmeleri.
   - Ortada 2B tam boy kahraman.
   - İki yanında 13 eşya yuvası: miğfer, omuz, gövde, eldiven, bacak, çizme, silah, kalkan/yan el, kolye, 2 yüzük, 2 küpe.
   - Sağda istatistik listesi.
4. **`diyalog`**:
   - Solda belden yukarı NPC portresi (ekranın %40'ı).
   - Altta tam genişlikte metin şeridi, adı Cinzel levhada.
   - Sağ altta "İleri" düğmesi; arka plan bulanık şehir.
5. **`ana-hud`**:
   - Ekteki ana merkez görüntüsünün üstüne yeni arayüz: sol üst oyuncu kartı, üst orta kaynaklar (en çok 3), sol ve sağ raylarda C sınıfı glifler (44 px dokunma alanı), alt dock ve Savaş düğmesi, sol alt sohbet şeridi.
   - Haritanın en az %70'i görünür kalmalı.
   - Bu ekranı ek olarak **667×375 dar telefon** için de çiz (`maket-ana-hud-dar-<sancak|ocak>.png`, 1334×750). Dock'taki 5 düğme, Görevler, sohbet ve Savaş düğmesi üst üste binmemeli. Gerekirse Görevler tek satıra ya da simgeye küçülsün.

**Her maket için ayrıca `olcu-<ekran>.md` dosyası yaz:** her öğenin 880×406 koordinatındaki x, y, genişlik ve yükseklik değeri, yazı boyutu ve kullandığı renk adı (sanat kitabındaki paletten).

**Teslim:** tek ZIP: 12 maket (dar ana HUD dahil), 5 ölçü dosyası. Dar maketin ölçüleri `olcu-ana-hud.md` içinde ayrı başlık altında 667×375 koordinatıyla yazılsın.

## GÖREV M5 · Eşya ve yetenek adlarının Türkçeleştirilmesi (öneri listesi)

**Ek:** Claude'un çıkaracağı `adlar.csv` dosyası (sütunlar: `kimlik`, `tur`, `sinif`, `derece`, `mevcut_ad`).

**Sorun:** oyunda İngilizce ve başka oyunlardan (Knight Online) alınmış adlar var: "Chitin Helmet", "Mirage Dagger", "Skilled Rogue's Pauldron", "Hell Breaker"…

**Kurallar:**
1. Eşya adı kalıbı: `[Malzeme veya soy] [Tür]`. Örnekler: "Kitin Miğfer" değil "Kabuk Miğfer"; "Usta Gölge Omzu", "Yüzbaşı Muhafız Kalkanı".
2. Kragmir ve Elentha eşyaları kendi dünyalarının sözcükleriyle adlandırılsın:
   - Kragmir: Ocak, Kor, Örs, Kemik, Demirdiş…
   - Elentha: Ak, Sancak, Kartal, Gümüş…
3. En çok 22 karakter (kart başlığına sığmalı).
4. Hiçbir ad başka bir oyundaki eşya adının çevirisi olmamalı.
5. Set adları tutarlı olsun; aynı setin bütün parçaları aynı sözcükle başlasın.
6. Yetenek adları kısa olsun (1–3 sözcük). Eylemi anlatsın: "Kalkan Darbesi", "Kor Yağmuru".

**Teslim:** CSV dosyası. Sütunlar: `kimlik`, `mevcut_ad`, `onerilen_ad`, `gerekce`. `kimlik` sütununu **asla değiştirme**.
