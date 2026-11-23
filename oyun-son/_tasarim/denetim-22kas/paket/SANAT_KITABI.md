# Sanat kitabı (Korant / Demir Diyarı)

Görev paketinden (22 Kas) ayrı belge olarak çıkarıldı; GPT, Gemini ve Claude aynı kurallara bakar. Referans görseller: `REFERANS/01_ONAYLI_TARZ/` (ölçü), `REFERANS/02_KACINILACAK/` (kötü örnekler), `REFERANS/03_OYUN_EKRANI/` (22 Kas oyun ekranları). Hikâye: `_tasarim/VAHRAN_destan.txt`. Ana denetim raporu: `DEMIR_DIYARI_ANA_DENETIM.html`.

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


## Sonradan alınan kesin kararlar (22–23 Kas)
- Oyunun tek adı **Korant**.
- Savaşçı **kılıç + kalkan**.
- Orklar (Kragmir) **yeşil tenli**.
- Dil bütünlüğü: TR seçiliyken her şey Türkçe, EN seçiliyken her şey İngilizce (eşya/yetenek adları dahil).
- Savaş birimleri **boyalı 2B** (3B malzeme pilotu C4 gerekmedi).
- Açılış resmi `img/korant-acilis.jpg` olduğu gibi kalır.
