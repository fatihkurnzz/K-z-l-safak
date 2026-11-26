# Korant Online · Görsel konsept (sürüm KORANT-v40-1dda167)

Bu belge oyunun bugünkü görsel kimliğini ve kullanıcının kesinleşmiş zevk kararlarını tek yerde toplar. Ayrıntılı palet ve yazı kuralları için `SANAT_KITABI.md`, yerleşim ölçüleri için `YERLESIM_SPEC.md` geçerlidir. Çelişki olursa bu belgedeki **kullanıcı kararları** önce gelir.

## 1. Oyun ve ekran
- Tarayıcıda çalışan, **yalnız yatay** çizilen mobil RPG. Mantıksal ekran **880×406**; hedef telefon 2340×1080 (dpr 2,66), telefon dik tutulsa da oyun 90° döndürülüp yatay çizilir.
- Dar ekran sınıfı `html.narrow` (< 760 px). Her görsel 880×406 içinde okunur kalmalı; en küçük yazı 11 px.
- Savaş: yandan 3/4 görünüş, sıra tabanlı; boyalı **2B** birimler (kameraya dönen düzlem), boyalı arka plan. Eski 3B çizim yalnız yedek (`?b2d=0`).

## 2. İki halk
| | Elentha (insan, kod `sancak`) | Kragmir (ork, kod `ocak`) |
|---|---|---|
| Kral | Edran | Volgar Demirdiş |
| Başkent | Elentha Ak Kuleleri — beyaz taş, mavi sancak | Kragmir Dağ Salonları — koyu taş, ocak ateşi, kızıl |
| Renkler | #1f2c40, #4d8cc9, #c9d3dc, #e8ddc5; halk rengi #3d6fb6 | #2b211b, #a66a39, #c2552b, #d9c9a3; halk rengi #c2321e |
| Amblem | güneş / kartal (mavi) | kızıl göz |
| Ten | insan | **YEŞİL** (Thrak gibi); gri ork kabul edilmez |

Ortak alan: **Yemin Pazarı** (iki halkın buluştuğu çarşı) ve **Vahran Ovası** (üç yüz yıllık savaş alanı). Hikâye: *Vahran: Tarihin Külleri* (`VAHRAN_destan.txt`, GPT paketinde).

## 3. Kullanıcının kesin zevk kararları
1. **Tek parça boyanmış sahneler.** Ayrı sprite + boş zemin BEĞENİLMEDİ. Sahne resmi binaları, ışığı ve havayı tek resimde taşır; arayüz yalnız yazı/etiket bindirir.
2. **Sade, gerçekçi, az altın.** Altın yalnız vurgu (eski altın #c9a45c); her kenarı altın çerçeve yapma.
3. Tarz: **yarı gerçekçi, elle boyanmış dijital resim.** Fotoğraf gerçekliği, çizgi film, düz vektör, kalın kontur yok.
4. Işık: sol üstten sıcak anahtar ışık, sağdan soğuk zayıf dolgu.
5. Savaşçı **kılıç + kalkan** taşır (tırpan değil).
6. Oyunun tek adı **Korant** (logo "Korant Online"). "Demir Diyarı" eski çalışma adı.
7. Açılış resmi `img/korant-acilis.jpg` olduğu gibi kalır.
8. Dil bütünlüğü: TR seçiliyken her şey Türkçe; görsellere gömülü yazı koyma (yazılar kodda, iki dilde).
9. Yaratıklar 3 pozlu (bekleme, saldırı, vurulma) + portre; bosslarda 2. evre.

## 4. Onaylı görseller (DEĞİŞTİRİLMEZ)
- **42 onaylı sahne**: `03_SAHNELER_42/` (29 `sahneler/*.webp` + 13 `interiors/**/bg.webp`). Ölçü, kompozisyon ve dokunma noktaları koda bağlıdır (`js/hub2d.js`, `js/ic-mekan.js MEKAN`): bir sahne yenilenirse **aynı kompozisyon, aynı ölçü, aynı dosya adı** korunmalı; bina/NPC noktaları kayarsa kod da değişmek zorunda kalır.
- Oyundaki bütün gömülü görseller (`js/*-png.js`, `b2d-*.js`, `esya2-*.js`) şu an kullanılan hâlleridir; pakette bayt bayt aynı çıkarıldı.

## 5. Simge dili (üç sınıf, başkası yok)
- **A · Eşya:** boyalı, 3/4 açı, 128 px kare (esya2-*), derece rengi kenarda kodla verilir (Standart #b9c0c8, Nadir #4aa3ff, Eşsiz #ffb52e).
- **B · Yetenek:** boyalı kare kart, 256 px, çerçevesiz.
- **C · Arayüz:** tek renk kabartma metal glif, 2 px çizgi, 24/32/48 ızgara; halk rengine maskeyle boyanır (Kragmir #f3d2ae, Elentha #cfe0f7).

## 6. Teknik teslim kuralları
- Biçim yalnız **PNG / WebP / JPEG** (AVIF, SVG, BMP, TGA, TIFF yasak).
- Saydam görsellerde gerçek alfa (sahte dama zemini, opak beyaz zemin yok); boş alan oranı %85'i geçmesin.
- Savaş pozları: kahraman 384×512 (zemin çizgisi alttan 64 px), yaratık 384×384 (alttan 48 px), boss 448 px; **sola bakan düşman, sağa bakan kahraman** pozları mevcut dosyalarla aynı hizada.
- Dosya adı ve varlık kimliği aynen korunur (manifestteki `varlik_kimligi`). Yeni varlık için yeni kimlik öner, eskisinin adını kullanma.
- İki halk eşliği: bir halka yapılan her görselin öbür halk karşılığı da yapılır.

## 7. Bilinen görsel eksikler (özet; ayrıntı README ve rapor klasörü)
- 13 yaratık türü yalnız bekleme pozlu (saldırı/vurulma yok): tavşan, şahin, eşek arısı, gargoyle, barbar lideri, lamia, yılan kraliçesi, 6 ejder.
- Boss 2. evreleri gerçek dönüşüm değil (renk/ışık farkı).
- Kragmir 5. yüz yok (yuva 4 = savaşçının aynası); Küçük Bran'ın boyalı portresi yok (SVG yedek).
- Mantikor / megantereon portre kırpımı zayıf.
