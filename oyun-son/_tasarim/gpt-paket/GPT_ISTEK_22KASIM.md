# VAHRAN — Claude'dan GPT'ye: 22 Kasım istekleri

Paket 1–5 ve "VAHRAN Haritalar" oyunda. Bu not, o günden bu yana öğrendiklerimizi ve senden istediklerimizi anlatıyor. Kurallar aynı: yalnız PNG/JPEG/WebP, yazı gömülü olmasın (Türkçe yazıyı oyun basar), iki halk (`ocak` = Kragmir, `sancak` = Elentha), tek ZIP + MANIFEST, alfa denetimi.

## 1. Telefon ölçüsü: düzeltme (hepsini etkiler)
- Oyuncunun telefonu **2340×1080** (19.5:9). Oyunun mantıksal ölçüsü **880×406**, ölçek 2.66. Eski notlardaki 846×412 ve 722×411 yanlış.
- Maketleri **2340×1080** çiz. Paket 4 maketleri 1200×600 (2:1) geldi. Bu oran telefona göre dar kalıyor, iki yan boş kalıyor.
- Kenar payları (2340×1080 üzerinde): sol ve sağ 32 px, alt 58 px. Kamera çentiği yatayda solda ya da sağda, bu yüzden en dış 130 px'e önemli bir şey koyma.

## 2. Haritalar: daha geniş sürüm (2. öncelik)
Dört harita 1672×941 (16:9) geldi. Telefonda resmin tamamını göstermek için yükseklikten sığdırıyoruz. Bu yüzden iki yanda yaklaşık 210'ar px boşluk kalıyor. Şimdilik bu boşluğa resmin aynalanmış, karartılmış bir kopyasını koyuyoruz.

İstek: **dört haritanın 2340×1080 sürümü.** Mevcut sahne ortada aynen kalsın, iki yana aynı dünyanın devamı boyansın (sur, arazi, çadır, orman; işlevsiz süs). Böylece bina konumları değişmez, ben yeniden kesmek zorunda kalmam.
- `sancak.webp` (Elentha), `ocak.webp` (Kragmir), `carsi.webp` (Yemin Pazarı), `klan-sancak.webp` (bugünkü klan toprağı, mavi)
- **YENİ: `klan-ocak.webp`.** Kragmir klanları için aynı yerleşimde, kara demir ve kor renginde klan toprağı. Bugün iki halk da mavi Elentha klanını görüyor.

Arayüzün kapladığı bölgeler (2340×1080'de). Buralara işlevli bina koyma, yalnız süs koy:
| Bölge | Kaplayan | Yaklaşık alan |
|---|---|---|
| Sol şerit | Dikey oyuncu kartı + menü düğmeleri | x 0–230, tüm yükseklik |
| Sağ şerit | Dikey düğme sütunu + halk flaması | x 2110–2340, tüm yükseklik |
| Üst bant | Enerji / Akçe / Yakut / Premium | y 0–150 (sağ yarı) |
| Alt bant | Sohbet (sol), Görevler, alt menü, Savaş düğmesi | y 780–1080 |

Sorun yaşanan yerler: Kragmir'de **Kader Çarkı** sol üstte, **İksir** çadırı sağ üstte kalıyor, ikisi de arayüzün altına giriyor. Kragmir'de Çarşı geçidi sohbet kutusunun altında, ışınlanma kapısı alt menünün arkasında. Geniş sürümde bunlar değişmeyecekse sorun yok, ben haritayı ortalarım. Yeniden çizersen bu binaları güvenli alana (x 230–2110, y 150–780) al ve yeni konumlarını bildir.

## 3. Ana ekran: yeni yerleşim için parçalar (T2, T4)
Kullanıcının isteğiyle ana ekranın düzeni değişti. Paket 5'teki "ana merkez" maketi bu düzene uymuyor:
- **Sol şerit:** dikey oyuncu kartı, 66×100 mantıksal (≈176×266 px). Yukarıdan aşağı portre (44 px), seviye, ad, can ve mana çubuğu. Altında dikey menü düğmeleri.
- **Sağ şerit:** sağ üst düğmeler tek dikey sütunda, altında halk flaması.
- **Üst sağ:** Enerji / Akçe / Yakut sayaçları ve küçük Premium düğmesi, tek sıra, 21 mantıksal yükseklik (≈56 px).
- **Alt:** sohbet (250 mantıksal genişlik), Görevler panosu, tek sıra alt menü (Karakter / Çanta / Görevler / Klan / Kervan), yarım boy Savaş düğmesi (80×44 mantıksal).

İstenen parçalar (iki halk, ayrı katman, yazısız):
- `kart-dikey-<halk>.png`: dikey oyuncu kartı çerçevesi, portre yuvası dahil, ≈176×266
- `sayac-<halk>.png`: kaynak sayacı kapsülü, yatay uzayabilir (9 dilim kenarlarıyla), ≈56 px yükseklik
- `premium-kucuk-<halk>.png`: ≈200×56
- `savas-dugme-<halk>-{normal,basili}.png`: ≈212×117 (bugün CSS ile çizili)
- `serit-kenar-<halk>.png`: sol ve sağ şerit için dikey süs/zemin, ≈230×1080 (harita geniş gelirse gerekmez)
- Menü kutuları (T3): Menü penceresindeki madalyon/kutu düğmelerinin yeni tasarımı, `menu-kutu-<halk>-{normal,basili}.png`

## 4. Savaş ekranı (T5): kullanıcının asıl isteği, YENİ YAPI
Kullanıcı savaşı ekteki referans görüntüdeki **yapıyla** istiyor (`referans-savas-yapisi.jpg`). Görüntünün kendisi değil, **yerleşimi ve bileşenleri** örnek alınacak. Sahne, karakterler, renkler bizim (iki halk teması, KÜL VE DEMİR). Paket 4'ün 1200×600 maketlerindeki düzen **bırakılıyor**; yeni maketler bu yapıya göre, **2340×1080**, iki halk: savaş, boss savaşı, savaş sonucu (hazırlık ekranı aynı kalabilir).

### 4.1 Yerleşim (referanstaki yapı → bizim oyundaki karşılığı)
| Bölge (2340×1080) | Referansta | Bizde ne olacak |
|---|---|---|
| Sol üst | Büyük yuvarlak portre + "Lv.65 Ad" + sayılı can (kırmızı) ve mana (mavi) çubuğu | **Takım lideri kartı**: portre çemberi (halk çerçevesi), Sv. + ad, can ve mana çubuğu, içinde "8.420 / 8.420" yazısı. ≈ x 30–600, y 20–160 |
| Üst orta | "Tur 1 / 10" şeridi | **Dalga şeridi**: "Dalga 2 / 3" ya da tek dalgada "Savaş" (oyunda tur sınırı yok, dalga var). Yanına zamanlayıcı (⏱ sayaç, yalnız süreli kiplerde) |
| Sağ üst | Boss adı + uzun can çubuğu + Lv + yuvarlak portre (sol üstün aynası) | **Düşman lideri / boss kartı**: ad, uzun can çubuğu, Sv., portre. Boss'ta evre yazısı ve zayıflık (element simgesi) bu kartın altında küçük rozet |
| Sol kenar, dikey | Parti üyelerinin portre sütunu (6 yuva), üstte ve altta süs uç | **Sıra / kadro sütunu**: dostların portreleri dikey; sırası gelen vurgulu (parlak çerçeve), ölen gri. Oyunda bugün "Sıra" göstergesi var, buraya taşınacak |
| Sahne | Dostlar solda, düşmanlar sağda, açık zemin | Aynı: 3B birimler solda (A) ve sağda (B). Orta bölge boş kalmalı |
| Her birimin başında | Seviye rozeti (yuvarlak) + can çubuğu (dost yeşil, düşman kırmızı) + ince mana çubuğu | Aynı: `savas-birim-rozet` + birim can çubuğu (dost/düşman/boss renkleri) |
| Sol alt | Sohbet: sekmeler (Genel / Klan / Parti / Sistem), 3 satır, yazma kutusu + ifade düğmesi | Aynı. Ayrıca savaş bilgisi satırı (kim ne yaptı, "Hedefe dokun") buraya ya da yetenek çubuğunun üstüne gelir. ≈ x 30–620, y 760–1060 |
| Alt orta | Tek sıra, 6 kare yetenek yuvası, süslü çerçeve; her yuvanın altında mana bedeli (mavi elmas noktalar) | **6 yuva = temel saldırı + 5 yetenek**. Temel saldırı 1. yuva (bedelsiz, çerçevesi hafif farklı). Altta mana bedeli noktaları. Çubuğun sağ ucunda **2 küçük iksir yuvası** (can, mana; adet rozetli). ≈ x 660–1700, y 830–1060 |
| Sağ alt | "Otomatik", "x2" küçük düğmeler + büyük "Sıra Sonu" birincil düğme | **Otomatik** (aç/kapa), **Oto iksir** (aç/kapa), **hız** (1× / 2× / 3× döner) küçük düğmeler. Büyük birincil düğme yerine: oyunda "sıra sonu" yok (yetenek seçilip tekrar dokununca kullanılır), o yüzden büyük düğme **seçili yeteneği kullan / Saldır** olsun; seçim yoksa temel saldırı. **Çekil** küçük ve ayrı (sağ üstte, boss kartının altında ya da sol üst kartın yanında), kazara basılmasın |

### 4.2 Oyunun gerçek kuralları (maket bunlara uysun)
- Sıra tabanlı; oyuncu yalnız kendi sırasında yetenek seçer. Hedef isteyen yetenekte "hedefe dokun" adımı var: düşmanın üstünde **hedef işareti**, seçili yetenek yuvasında **seçili** durumu gerekir.
- Yetenek yuvası durumları: hazır / seçili / bekleme (üstünde kalan tur sayısı) / mana yetmez (soluk + kırmızı nokta) / kilitli (asma kilit + "Sv. 30") / boş.
- Hız yalnız Otomatik açıkken çalışır (kapalıyken düğme soluk). Oto iksir yalnız PvE'de görünür.
- Hasar sayıları (−148, kritik büyük ve altın), durum simgeleri (yanma, zehir, buz, kalkan) birimin can çubuğunun yanında küçük simgeler.

### 4.3 İstenen parçalar (iki halk, ayrı katman, yazısız)
- `savas-lider-kart-<halk>.png` (sol üst; sağ üst için aynası `savas-dusman-kart-<halk>.png`), portre çemberi ayrı: `savas-portre-cember-<halk>.png`
- `savas-dalga-serit-<halk>.png` (üst orta)
- `savas-sira-sutun-<halk>.png` (dikey çerçeve, üst/alt uç süsü) + `savas-sira-yuva-{normal,aktif,olu}.png`
- `savas-yetenek-cubuk-<halk>.png` (alt orta süslü çerçeve, 6 yuva + 2 iksir yeri)
- `savas-yetenek-yuva-<halk>-{hazir,secili,bekleme,pasif,kilitli,bos}.png` + `savas-temel-yuva-<halk>.png` + `savas-mana-nokta.png`
- `savas-iksir-yuva-<halk>.png` (+ adet rozeti)
- `savas-birincil-<halk>-{normal,basili,pasif}.png` (sağ alt büyük düğme)
- `savas-kucuk-dugme-<halk>-{acik,kapali}.png` (Otomatik / Oto iksir / hız / Çekil)
- `savas-can-cubugu-{lider,birim}-{dost,dusman,boss}` çerçeve + dolgu ayrı, mana dolgusu ayrı; `savas-birim-rozet.png` (seviye)
- `savas-sohbet-panel-<halk>.png` + `savas-sohbet-sekme-<halk>-{normal,secili}.png`
- `savas-hedef-isaret.png`, `savas-durum-<yanma|zehir|buz|kalkan|sersem>.png`
- Yetenek **simgeleri** referanstaki gibi dolu, renkli kare resimler olabilir; sınıf × yetenek listesi OYUN_VERISI.md'de (ayrı paket olarak sonra da gelebilir).

### 4.4 Telefon gerçeği
880×406 mantıksal ekranda: yetenek yuvası en az 48×48 mantıksal (≈128 px), birincil düğme ≈ 110×48, yazı en az 11 mantıksal. Sol üst kart, sol sütun, sağ üst kart ve alt çubuk sahnenin ortasındaki birimleri örtmemeli: birimler y 300–780 ve x 250–2100 arasında durur.

## 5. Karakter oluşturma ve seçimi (T1)
Paket 3 maketleri uygun. Ortadaki karakter gerçek 3B model olarak kalacak, oraya çizim koyma, alanı boş ve aydınlık bırak. İstek:
- Maketleri 2340×1080 olarak ver.
- Sol (halk ve sınıf seçimi) ve sağ (Cinsiyet / Yüz / Saç / Saç rengi / Göz rengi / Ten rengi seçiciler) paneller ayrı katman olsun. Sınıf düğmesi `-normal` / `-secili`, ok düğmeleri `‹ ›` ayrı PNG olsun.

## 6. Hâlâ eski çizimde kalanlar (sıra sende)
- **Kral portreleri:** Volgar Demirdiş (Kragmir) ve Edran (Elentha), diyalog için büst. Bugün eski SVG yüz kullanılıyor.
- **Diyar Haritası** (bölgeler: Vahran Ovası, Kül Geçidi, Kızıl Bahar Meydanı, Sisli Çukur), **Fragman** ve **Mini dizi** kareleri (hareketli çizgi roman; 2340×1080).
- Paket 2'den `esya-ors-tozu` geldi ama halk simgesiyle çakıştığı için kullanılmadı, yeniden gerekmez. `esya-sandik` ve `sandik-acilis` için oyunda yer yok, **gönderme**.

## 7. Öncelik
1) Savaş ekranı: referans yapısında 2340 maketleri + parçalar → 2) dört geniş harita + Kragmir klan toprağı → 3) ana ekran parçaları ve menü kutuları → 4) karakter oluşturma → 5) kral portreleri, Diyar Haritası, fragman.
