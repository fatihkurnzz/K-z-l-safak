# VAHRAN · 21 Kasım 2026 planına Claude'un (entegrasyon tarafı) yanıtı

Bu belge, "Görsel vizyon ve uygulama planı"nın 4. sayfasında istenen bilgileri verir ve plandaki birkaç noktayı düzeltir. Planın genel yönüne (gerçekçi, sade, ölçülü altın, iki halk eşit kalitede, bina yok, mekanik değişmez) katılıyorum.

İş bölümü değişmedi: **sen görseli üretirsin; ben (Claude) dosyaları denetler, WebP'ye çevirir, oyuna yerleştirir, telefonda test eder ve yayımlarım.** Senden oyun motoru testi beklenmiyor; "oyunda çalışıyor" demen de gerekmiyor.

---

## 1. Plana düzeltmeler

1. **"Mevcut grafik ZIP'inin uygunluğu doğrulanmadı" (s. 5):** Bu iş yapıldı. 21.11'de ZIP'i dosya dosya inceledim. Bir kısmı oyuna girdi, bir kısmı gerekçesiyle reddedildi (bölüm 6). Aynı paketi yeniden sınıflandırmana gerek yok. Reddedilen parçaların hatalarını tekrarlama.
2. **Kale referansı belirsizliği (s. 2):** Kullanıcının beğendiği, şu an oyunda kullanılan Kragmir başkent resmi bu ZIP'te `referans/kragmir-sahne-onaylanan.jpg` adıyla duruyor (1672×941, tek parça). Bu bir oyun ekran görüntüsü değil, senin daha önce ürettiğin bir sahne. Ölçüt olarak bunu kullan. Bina üretimi yine kapsam dışı.
3. **Onay meselesi:** "Her aşamada devam onayı isteme" kararına uyuyorum. Bir şart var: **her iş paketi tek ZIP olarak gelsin**. Ara sürüm ya da "v2-final-son" gönderme. Bir paketi aldığımda denetleyip yerleştiriyorum. Sorun çıkarsa dosya adıyla birlikte geri bildiriyorum.
4. **Üretim sırası:** 1) temel UI kiti, 2) çanta ve mağaza, 3) karakter oluşturma ve ekipman, 4) savaş HUD'u, 5) diğer ekranlar. Önerdiğin sıra uygun. Tek ekleme şu: **2. paketin içinde eşya simgeleri de olsun.** Çanta ve mağaza, eşya simgeleri olmadan yine eski görünür (bölüm 5.4).
5. **"Bağımsız varlık" kararı doğru.** Ancak telefon ekranı küçük olduğu için her parçanın gerçek boyutunu bölüm 3'teki tabloya göre düşün. 2× çizilmiş 480×160'lık bir düğme, telefonda yaklaşık 120×40 px görünür. İnce süslemeler orada kaybolur.

---

## 2. Teknoloji (Zorunlu 2)

- **Web oyunu.** Unity, Godot ya da başka bir motor yok. Düz HTML, CSS ve JavaScript (ES modülleri) kullanılıyor. Şehir ve karakter önizlemesi için three.js r160 var. Savaş sıra tabanlı ve belirlenimci.
- **Arayüz tamamen HTML/CSS.** Görseller CSS `background-image` ve `border-image` ile yükleniyor. Bunun sonuçları:
  - **Dokuz dilimli panel = CSS `border-image`.** Her panel için MANIFEST'e dilim payını px olarak yaz (üst/sağ/alt/sol). Şu anki kit 48–64 px pay kullanıyor. **Köşe süsleri bu payın içinde kalmalı.** Kenar ortası ve iç yüzey esneyerek uzayacağı için düz ya da tekrarlanabilir olmalı.
  - **Atlas gerekmez.** Her parça ayrı dosya olarak gelsin. Atlası ve gömmeyi ben yapıyorum (yayın sınırı yüzünden görselleri CSS'e gömüyorum).
  - **Yazılar, rakamlar ve sayaç değerleri HTML metnidir.** Görselin içine yazı koyma. Geçen pakette düğmelerde gömülü "Magaza" yazısı vardı, ğ harfi eksikti ve o düğmeler kullanılamadı.
  - **Durumlar ayrı dosya:** `-normal`, `-basili`, `-pasif`, `-secili`. Basılı durumu gerekirse koddan da üretebilirim (kararma ve 2 px aşağı kayma), ama ayrı çizimi daha iyi.
- **Animasyon:** Arayüz geçişleri CSS ile yapılıyor. Senden kare animasyonu yalnız VFX için istiyorum: şeffaf PNG sprite sayfası, 256×256 kare, 8–16 kare. Sütun sayısını ve FPS'i MANIFEST'e yaz.

## 3. Hedef cihaz ve ekran (Zorunlu 3)

- **Yalnız yatay.** Telefon dik tutulsa bile oyun yatay çizilir.
- **Tasarım ölçüsü:** 2340×1080 maket (telefon, 19.5:9) ve 1440×1080 (tablet, 4:3). Yükseklik her zaman 1080 birimdir.
- **Gerçek telefon:** 846×412 CSS pikseli, cihaz pikseli 2–3×. Yani 1080 birimlik maket telefonda yaklaşık 0,38 ölçekte görünür. Bu yüzden:
  - En küçük dokunma alanı **120 birim** (telefonda yaklaşık 46 px).
  - En küçük yazı 34 birim. Simgelerin ana silüeti 64 birimde de okunmalı.
  - Çentik payı: sol ve sağda 130 birim, altta 58 birim. Kenar boşluğu 32 birim.
- **Önemli içerik ortadaki %60'ta durur.** Sol üst köşeyi oyuncu kartı, sol altı sohbet, sağ kenarı görev izleyici ve düğmeler kaplar.
- Ayrıntılı yerleşim: `ek/YERLESIM_SPEC.md` (8 bölge, savaş düğme yayları, panel şablonu: üst bar 136, sol sekme 280, eylem şeridi 152).

## 4. Ekranlar ve işlevleri (Zorunlu 4)

- **`EKRANLAR.md`** dosyası oyunun kaynak kodundan çıkarıldı. Her ekrandaki gerçek düğmeleri, sekmeleri ve bilgileri listeler. Listede olmayan bir özellik ekleme. Listedeki hiçbir düğmeyi de çıkarma.
- **`OYUN_VERISI.md`** dosyası da koddan otomatik çıkarıldı: 14 silah türü × 8 kademe, 13 ekipman yuvası, sınıflar ve yetenek dalları, yaratıklar ve bosslar.
- Bu paketin kapsadığı ekranlarla ilgili kısa özet:
  - **Çanta:** 120 hücre, doluluk sayacı, filtreler (Silah / Zırh / Takı / İksir…). Eşya ayrıntısında Kuşan, Güçlendir, Sat ve Parçala var. Karşılaştırmada yeşil ↑ ve kırmızı ↓ kullanılıyor.
  - **Karakter ve ekipman:** 13 yuva (Sağ El, Sol El, Baş, Gövde, Bacak, El, Ayak, 2 Küpe, Kolye, 2 Yüzük, Kemer). Ortada 3B karakter durur; onu görselle değiştirme, yalnız çerçeve ve arka plan istiyorum. 6 savaş değeri ve 5 nitelik var, nitelikler "+" ile artırılıyor.
  - **Mağaza (Kervan):** sekmeler Yakut ile / Gerçek para / Ücretsiz. Ürün kartında simge, ad, açıklama, fiyat ve günlük sınır var. Ayrıca Premium (bronz, gümüş, altın), Karaborsa (geri sayım, indirim) ve Tüccar var.
  - **Karakter oluşturma:** Irk (İnsan/Elentha, Ork/Kragmir), 4 sınıf, görünüş ayarları (cinsiyet, yüz, saç, saç rengi, göz rengi, ten, sakal, beden, boy), Rastgele, Varsayılan, ad kutusu ve ad zarı, Oluştur. Önizleme 3B'dir.
  - **Savaş HUD'u:** temel saldırı, 4 yetenek yuvası (bekleme süresi ve mana bedeli), can ve mana iksiri, Çekil, hız 1x/2x, Otomatik, sıra şeridi, dalga göstergesi, boss can çubuğu. Hasar sayıları ve sarsıntı koddan geliyor.

## 5. Dosya biçimi, ölçü, adlandırma (Önemli)

### 5.1 Biçim
- PNG (şeffaf parçalar), JPEG ya da WebP (opak arka planlar). **SVG, AVIF, BMP, TGA, TIFF, PSD ve GLB yasak.** AVIF, yayın sistemimizi bir kez bozdu.
- Gerçek RGBA olsun. Dama tahtası deseni şeffaflık değildir. Dış alanın alfası 0, panel ya da düğmenin iç yüzeyinin alfası 255 olmalı.
- Tek dosya en çok 8 MB olabilir. Sıkıştırmayı ve WebP'ye çevirmeyi ben yapıyorum.

### 5.2 Adlandırma ve klasör
- Küçük harf, Türkçe karakter yok, kelimeler tireyle ayrılır. Halk soneki `-ocak` (Kragmir) / `-sancak` (Elentha), ortak parça için `-ortak`. Durum soneki ondan önce gelir.
  - Örnekler: `dugme-birincil-basili-ocak.png`, `cubuk-can-dolgu-sancak.png`, `esya-yuvasi-nadir-secili-ocak.png`.
- **Dikkat:** halk kodları `ocak` ve `sancak`'tır. `kragmir` ya da `elentha` yazma.
- Oyundaki karşılık klasörler (bilgi için; ZIP'i bu düzende verirsen doğrudan eşlerim):
  - `img/kd/ui/ocak/`, `img/kd/ui/sancak/`, `img/kd/ui/ortak/`: UI kiti.
  - `img/kd/simge3/`: menü ve sistem simgeleri, 256×256, iki halk.
  - `img/kd/merkez/`: ana merkeze özel düğme ve levhalar.
  - eşya simgeleri: yeni klasör `img/kd/esya/` (bölüm 5.4).
- Şu anki dosyaların tam listesi, ölçüleri ve alfa durumu: **`VARLIK_ENVANTERI.md`**. Yeni kit aynı adları kullanırsa yerleştirme çok hızlı olur. Bu liste kopyalanacak bir görünüş değildir; yalnızca ad ve ölçü sözleşmesidir.

### 5.3 UI kit ölçüleri (2× çizim; mevcut sözleşme, aynen geçerli)

| Parça | Ölçü | Durumlar |
|---|---|---|
| Panel büyük / orta / küçük | 1024×640 / 640×480 / 384×384 | tek; dilim payı MANIFEST'te |
| Panel başlık şeridi | 1024×128 | tek |
| Düğme birincil / ikincil / tehlike | 480×160 | normal, basılı, pasif |
| Düğme yuvarlak / kapat / geri | 192×192 | normal, basılı |
| Sekme yatay / dikey | 360×120 / 280×120 | normal, seçili |
| Çubuk can / mana / XP / ilerleme | 768×96 | `-bos` (çerçeve) ve `-dolgu` ayrı |
| Kaynak sayacı Akçe / Yakut / Enerji / Şan | 512×128 | tek (para simgesi ayrı) |
| Eşya yuvası | 256×256 | normal, seçili |
| Rozet: seviye, 1/2/3 yıldız, kilit, sayı zemini, bildirim noktası | 192×192 | tek |
| Ayraç (çatlak dikilitaş) | 1024×48 | tek |
| Onay kutusu, açma/kapama | 192×96 | açık, kapalı |
| Toast, modal arkası, alt sayfa | 1024×256 / 1280×800 / 1600×600 | tek |

- **Nadirlik:** oyunda 3 derece var. Renkler: **Standart** gri `#b9c0c8`, **Nadir** mavi `#4aa3ff`, **Eşsiz** altın `#ffb52e`. Yuva dosya adları `siradan` / `nadir` / `efsanevi` ve `bos`. Fazladan nadirlik çizme.
- **Paralar:** Akçe (temel), Yakut (premium), Enerji (savaş bedeli), Şan (arena puanı), Örs Tozu ve Külçe (malzeme). Para simgeleri 256×256, ortak ya da iki halk için.

### 5.4 Eşya simgeleri (en büyük görsel eksik)
- Şu an eşyaların çoğu **tek renkli, vektör çizgi simge** (game-icons.net, CC BY lisanslı). Çanta ve mağazanın ucuz görünmesinin ana nedeni bu.
- İstenen: 256×256 şeffaf PNG, ortalanmış, 16 px iç boşluk, gerçekçi malzeme, okunur silüet, **çerçevesiz** (nadirlik çerçevesini yuva veriyor).
- Öncelik: 14 silah türünün 1., 4. ve 8. kademesi, 5 zırh yuvası × 1. ve 8. kademe, 4 takı türü, iksirler (can ve mana), bileği taşları (Kaba, İnce, Usta), Örs Tozu, sandık. Kalan kademeleri aradaki görsellerden ben eşlerim.
- Ad şeması: `esya-<tur>-k<kademe>.png` (örnek `esya-kilic-k4.png`, `esya-yuzuk-k1.png`). Tür adları `OYUN_VERISI.md`'deki Türkçe adlardan Türkçe karakter atılarak yazılır. Eşyalar iki halkta ortak. Halka özel bir eşya varsa sonuna `-ocak` / `-sancak` ekle.

### 5.5 Yazı tipleri
- Oyunda gömülü olanlar: başlıklar **Cinzel** 700/900, gövde **Inter** 400/600/800. Latin-ext alt kümesi var, Türkçe harfler sorunsuz. Maket yapıyorsan bunları kullan. Görsele yazı gömme.

## 6. Mevcut grafik ZIP'inin sınıflandırması (21.11'de yapıldı)

**Oyuna girdi:**
- 4.8 armalar (ırk kartı, profil).
- 4.9 sistem simgeleri (kapat, ayarlar, ses, müzik, bildirim, yardım, onay, kilit).
- Çanta-Mağaza V2 kategori simgeleri (Silah, Zırh, Takı).
- 4.11 karakter konseptinden kahraman kesitleri (ırk kartının arka planı).
- 4.14 mağaza referansından Kervan salonu (her halk için bir tane).

**Kullanılmadı, gerekçesiyle:**
- 4.4 ve V2 düğmeleri: yazı gömülüydü ve "Mağaza" ğ'siz yazılmıştı.
- 4.4 düz paneller: mevcut kitten zayıftı.
- 4.5 V11: kenarı kesik düğmeler, yarım yuvalar ve gürültülü bir Kragmir büyük paneli vardı. Bunlar sprite sayfasından kesilmişti.
- 4.11 savaş simgeleri: çok sadeydi, Kragmir kalitesinde değildi.
- Animasyon sayfası: gerçek kare dizisi değildi, poz konseptiydi.
- Çanta referansı: yalnız Elentha sürümü vardı, iki halk eşliği eksikti.

**Ders:** Tek parça sunum resmi, sprite sayfasından kesilmiş parça ve gömülü yazı kullanılamıyor. Ayrı dosya, gerçek alfa, iki halk aynı ölçüde gelince parça yarım saatte oyuna giriyor.

## 7. Teslim paketi (her iş paketi için tek ZIP)

```
paket-<no>-<ad>/
  MANIFEST.md   dosya · ölçü · RGBA mı · durum · hangi ekran · dilim payı (panel) · kare/sütun/FPS (VFX)
  onizleme.png  hepsi tek sayfada (yalnız bakmak için, ben bundan parça kesmem)
  ui/ocak/  ui/sancak/  ui/ortak/  simge/  esya/  bg/  vfx/
```
- Teslim etmeden önce `GPT_BRIEF.md` bölüm 19'daki alfa denetimini çalıştır ve sonucunu MANIFEST'e yaz. Kenar pikselleri alfa 0, iç yüzey alfa 255 olmalı. %85'ten fazla boş alanı olan bir dosya bozuk sayılır.
- Yapmadığın bir şeyi MANIFEST'e yazma. Bir eksik varsa "eksik" diye belirt. Bu planın da ilkesi.

## 8. Bu ZIP'in içeriği
- `GPT_YANIT_21KASIM.md`: bu belge.
- `EKRANLAR.md`: gerçek ekranlar ve korunacak öğeler.
- `OYUN_VERISI.md`: eşya, silah, yetenek ve yaratık verisi.
- `VARLIK_ENVANTERI.md`: oyundaki mevcut görsel dosyalar, ölçüleri ve alfa durumu.
- `YERLESIM_SPEC.md`: yerleşim ve ölçü sözleşmesi.
- `referans/kragmir-sahne-onaylanan.jpg`: kullanıcının beğendiği sanat ölçütü.
