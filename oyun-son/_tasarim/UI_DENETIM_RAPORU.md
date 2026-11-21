# Arayüz Denetim Raporu · 21 Kasım 2026

## Yöntem
- **Envanter:** Ekranlar kaynak koddan çıkarıldı. Bütün `ACT.<ad>` işleyicileri taranarak 408 eylem bulundu. Bunlardan 88'i ekran ya da pencere açan giriş noktası. Pencerelerin bütün sekmeleri tek tek dolaşıldı.
- **Araçlar** (`_tasarim/araclar/`):
  - `ui-denetim.js`: her ekranı ve sekmesini açar, ekran görüntüsü alır. Ölçtükleri:
    - kesik yazı (taşma, üç nokta)
    - kırpıcı alanın dışına taşan yazı (yatay kaydırılan şeritler hariç)
    - 26 px'ten küçük dokunma hedefi
    - üst üste binen düğmeler
  - `DD_GELISMIS=1` seçeneği oyunun kendi test araçlarını çalıştırır: Sv. 51, kaynak, eşya, bütün aşamalar açık. Böylece seviye kilitli ekranlar da açılır.
  - `kontrast.py`: her yazının rengini ekran görüntüsündeki gerçek zemin pikselleriyle karşılaştırır (eşik 2,4).
  - `ui-akis.js`: oyunu baştan sona dolaşır: yükleme, açılış, karakter oluşturma, giriş, öğretici, ana ekran, dolu çanta, eşya seçimi, savaş öncesi, savaş HUD'u.
- **Ölçüler:**
  - 722×411: kullanıcının telefonunda, Claude uygulaması içinde, dik tutulan ve döndürülen ekranın gerçek mantıksal ölçüsü
  - 846×412
  - 1180×820 (tablet)
  - Her iki halk denendi: Elentha (sancak) ve Kragmir (ocak).

## Sonuç (son tur)
| Tur | Açılan ekran | Sayfa hatası | Düşük kontrast |
|---|---|---|---|
| Elentha 722×411 | 69/88 + sekmeleri | 0 | 126 → 8 |
| Kragmir 722×411 | 69/88 + sekmeleri | 0 | 20 → 17 (çoğu sınırda, 2,3) |
| Elentha 846×412 | 69/88 | 0 | 3 |
| Kragmir 1180×820 | 69/88 | 0 | 23 (tablet; ölçeklenmiş küçük yazı) |
| Seviye kilitleri açık (Sv. 51) | 17/26 | 0 | 0 |
| Akış testi | 16 adım | 0 | — |

Açılmayan 19 giriş noktası pencere açmıyor; yalnız eylem yapıyorlar (yenile, sıçra, ödül al…) ya da veri istiyorlar (`skill`, `exchange` belirli bir eşya ister). Bunlar ekran değil.

## Düzeltilenler (`css/v27-duzen.css`, `js/ui-hub.js`)
1. **Seçili sekme ve süzgeç düğmeleri:** Sekme görseli %50 dilimlendiği için seçili düğme sarıya boyanıyor, üstündeki açık yazı okunmuyordu. Bu Çanta, Pazar, Başarımlar, Kapı, Ansiklopedi, Posta, Tüccar ve Görevler'de görülüyordu.
   - Yeni ortak kural: seçili = altın zemin + koyu yazı.
   - Dikey ve yatay sekmeler köşe payıyla dilimleniyor.
2. **Karakter / Yetenek sekmeleri:** Ayrı, dar, büyük harfli bir sekme türüydü ("KARAKT", "YETENE" diye kesiliyordu). Artık bütün pencerelerdeki ortak sekme sistemi kullanılıyor ve yazı gerekirse iki satıra iniyor.
3. **Karakter penceresindeki çanta süzgeci:** 9,5 px büyük harfliydi; okunur düğmelere çevrildi.
4. **Modal başlık şeridi:** Uzun başlıklar şeridin dışına taşıyordu (Zindan Düzenleri, Çevrimiçi Ödülleri, Promosyon Kodu…). Şerit artık yazının boyunda.
5. **Pazar:** Telefonda süzgeçler ekranın yarısını kaplıyor, ilan listesi kesiliyordu. Süzgeçler tek, yana kaydırılan şeride indi; ilanlar görünür oldu.
6. **Kontrast:** Parşömen döneminden kalan kural, ırk renklerini (kırmızı Kragmir, mavi Elentha) koyu panelde okunmaz hâle getiriyordu. Bu renkler açık tonlara çekildi; etkilenen yerler:
   - Sıralama
   - Sohbet adları
   - Kapı / Dünya Baskını
   - Taş Yemini
   - Ayarlar
   - Profil

   Ayrıca düzeltilenler:
   - Ayar seçeneklerinin başlıkları (Grafik, Dil)
   - Ses kaydırıcısı değerleri
   - Üstün Irk kartı (beyaz zemin üstünde beyaz yazı)
   - Duyuru ve bildirim simgeleri (kara daireydi)
   - "Zaferde ek ganimet" yeşili
   - Kragmir rozetleri
   - "Standart" etiketi
7. **Ana ekran etiketleri:** Kral Edran / İlk Alım / sunucu rozeti üst üste biniyordu. Etiket itme sistemine şu parçalar eklendi: sunucu rozeti, deneme şeridi, İlk Alım düğmesi, Savaş düğmesi, sağ ray.
8. **Diğer kesilmeler:**
   - Karakter oluşturmada sınıf adları ("SUİKAS…")
   - Yetenek ağacı başlıkları ("HÜCUM 0/6")
   - Profil kutucuk etiketleri

## Bilinen / kalan (bilerek ya da sınırda)
- **Yatay kaydırılan şeritler:** Görev haritası, Ansiklopedi silah türleri ve Pazar süzgeci bilerek yana kayıyor; hata değil.
- **Karaborsa indirim şeridi** çapraz ve köşeden taşıyor; tasarım gereği.
- **Kontrastı 2,3 civarında kalanlar:** Sıralamadaki gümüş "1." satırı, harita üstü bölge adları ve Kragmir Kervan rozeti. Okunuyorlar ama ideal değiller; GPT'nin rozet görselleri gelince yeniden bakılmalı.
- **Örs:** Kaynak şeridi, Sv. 51 oyuncuda çok kaynak olduğu için iki satıra iniyor.

## Test edilemeyen / kısmen test edilen
- **Savaş:** HUD, aşama öncesi ekranı ve açılış turu görüldü. Otomatik betik hedefe dokunamadığı için savaş sonu ekranı otomatik doğrulanamadı.
- **Klan içi ekranlar:** Üye listesi, Oba Avı, Hisar, klan sohbeti klan üyeliği ister; sunucusuz deneme sürümünde üye olunamadı. Klan Karargâhı'nın kuruluş ve başvuru ekranları test edildi.
- **Gerçek para ödeme akışı:** Deneme sürümünde kapalı.
- **Canlı PvP eşleşmesi** ve **Kristal Nöbeti dalgaları:** Sunucu gerektirir. Kayıt ekranları test edildi.
- **Gerçek telefonda dokunma:** Oyunun döndürme mantığı aynı ölçüde (722×411) taklit edildi. Gerçek cihazda kullanıcının denemesi gerekir.
