# VAHRAN — Claude'dan GPT'ye: 22 Kasım istekleri

Paket 1–5 ve "VAHRAN Haritalar" oyunda. Bu not, o günden bu yana öğrendiklerimizi ve senden istediklerimizi anlatıyor. Kurallar aynı: yalnız PNG/JPEG/WebP, yazı gömülü olmasın (Türkçe yazıyı oyun basar), iki halk (`ocak` = Kragmir, `sancak` = Elentha), tek ZIP + MANIFEST, alfa denetimi.

## 1. Telefon ölçüsü: düzeltme (hepsini etkiler)
- Oyuncunun telefonu **2340×1080** (19.5:9). Oyunun mantıksal ölçüsü **880×406**, ölçek 2.66. Eski notlardaki 846×412 ve 722×411 yanlış.
- Maketleri **2340×1080** çiz. Paket 4 maketleri 1200×600 (2:1) geldi. Bu oran telefona göre dar kalıyor, iki yan boş kalıyor.
- Kenar payları (2340×1080 üzerinde): sol ve sağ 32 px, alt 58 px. Kamera çentiği yatayda solda ya da sağda, bu yüzden en dış 130 px'e önemli bir şey koyma.

## 2. Haritalar: daha geniş sürüm (en önemli istek)
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

## 4. Savaş ekranı (T5): kullanıcının asıl isteği
Paket 4 maketleri doğru içerikte (dalga, hedef, sıra, Otomatik, Oto iksir, hız, Çekil, Saldırı + Yetenek I–V). Eksik olanlar:
- Maketi **2340×1080** olarak yeniden ver (hazırlık, savaş, boss, sonuç; iki halk).
- Oyunda savaş çubuğu: **temel saldırı + 5 yetenek + 2 iksir yuvası** (can, mana). İksir yuvaları maketlerde görünmüyor, ekle.
- Hız düğmesi 1× / 2× / 3× arasında döner. Otomatik ve Oto iksir aç/kapa düğmesidir, iki durumu da çiz.
- Yetenek düğmesinin durumları: hazır / bekleme (kalan tur yazılacak) / mana yetmez / kilitli (Sv. yazılacak) / boş.
- Paket 4'teki HUD parçaları Paket 1 ile birebir aynıydı (sha). Savaşa **özel** parçalar istiyorum (iki halk, ayrı katman):
  `savas-temel-<halk>-{normal,basili}` (büyük, ≈200 dp), `savas-yetenek-yuva-<halk>-{hazir,bekleme,pasif,kilitli,bos}`, `savas-iksir-yuva-<halk>`, `savas-kucuk-dugme-<halk>-{acik,kapali}` (Otomatik / Oto iksir / hız / Çekil), `savas-dalga-serit-<halk>`, `savas-can-cubugu-{dost,dusman,boss}` (çerçeve + dolgu ayrı), `savas-hedef-isaret`, `savas-sira-yuva`.
- Sağ alt köşedeki düğme kümesi ve sol alttaki sohbet/bilgi alanı birimlerin üstüne binmesin (YERLESIM_SPEC bölgeleri geçerli).

## 5. Karakter oluşturma ve seçimi (T1)
Paket 3 maketleri uygun. Ortadaki karakter gerçek 3B model olarak kalacak, oraya çizim koyma, alanı boş ve aydınlık bırak. İstek:
- Maketleri 2340×1080 olarak ver.
- Sol (halk ve sınıf seçimi) ve sağ (Cinsiyet / Yüz / Saç / Saç rengi / Göz rengi / Ten rengi seçiciler) paneller ayrı katman olsun. Sınıf düğmesi `-normal` / `-secili`, ok düğmeleri `‹ ›` ayrı PNG olsun.

## 6. Hâlâ eski çizimde kalanlar (sıra sende)
- **Kral portreleri:** Volgar Demirdiş (Kragmir) ve Edran (Elentha), diyalog için büst. Bugün eski SVG yüz kullanılıyor.
- **Diyar Haritası** (bölgeler: Vahran Ovası, Kül Geçidi, Kızıl Bahar Meydanı, Sisli Çukur), **Fragman** ve **Mini dizi** kareleri (hareketli çizgi roman; 2340×1080).
- Paket 2'den `esya-ors-tozu` geldi ama halk simgesiyle çakıştığı için kullanılmadı, yeniden gerekmez. `esya-sandik` ve `sandik-acilis` için oyunda yer yok, **gönderme**.

## 7. Öncelik
1) Savaş ekranı parçaları + 2340 maketi → 2) dört geniş harita + Kragmir klan toprağı → 3) ana ekran parçaları ve menü kutuları → 4) karakter oluşturma → 5) kral portreleri, Diyar Haritası, fragman.
