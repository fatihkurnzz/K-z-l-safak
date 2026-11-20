# DEMİR DİYARI · EKRAN LİSTESİ (oyunun kaynak kodundan, 20.11.2026)

Burada oyundaki gerçek ekranlar ve her ekranda **korunması gereken** öğeler var. Görünüş tamamen serbest, sıfırdan tasarlanacak. Ancak listedeki her düğme, sekme ve bilgi yeni tasarımda da bulunmalı. Bir ekranın ayrıntısını merak edersen `oyun-kaynak.zip` içindeki ilgili `js/ui-*.js` dosyasına bak.

**Genel kalıp:** Çoğu ekran tam ekran bir **pencere**dir: üstte başlık, sol üstte geri/kapat, sağ üstte kaynak sayaçları, solda dikey sekmeler, ortada içerik, altta eylem şeridi. Kısa sorular ve seçimler ise ortada açılan küçük **kutu (modal)** ile yapılır. Bu iki kalıbı (pencere ve kutu) iki halk için tasarla. Bütün ekranlar bu kalıpları kullanır.

## 1. Açılış
- **Yükleme / açılış:** logo, yükleme çubuğu, sunucu seçimi (sunucu adı ve durumu: "Açık"), "Oyuna gir" ya da "Giriş yap" düğmesi.
- **Fragman:** sinematik metin satırları ve "Geç" düğmesi.
- **Giriş:** hesap girişi.

## 2. Karakter
- **Karakter oluşturma** (`ui-olustur.js`):
  - Sol: Irk (İnsan/Elentha, Ork/Kragmir) ve Sınıf.
  - Orta: 3B karakter önizlemesi; yakınlaştır/uzaklaştır ve döndür düğmeleri.
  - Sağ: Görünüş ayarları. Cinsiyet, yüz, saç, saç rengi, göz rengi, ten, sakal, beden ve boy; "Rastgele" ve "Varsayılan" düğmeleri.
  - Alt: karakter adı kutusu, ad zarı (rastgele ad), sınıf kutuları, "Oluştur".
- **Karakter seçme** (`ui-karakter.js`): solda karakter kartları ve "Yeni karakter" boş yerleri; ortada 3B karakter; sağda ad levhası ve "Oyuna gir".

## 3. Ana merkez (her girişte görülen ekran, `ui-hub.js`)
- **Sol üst:** oyuncu kartı (portre, seviye, ad, unvan, can ve mana çubuğu). Altında Premium şeridi ("+%30 kazanç").
- **Kaynaklar:** Enerji (+), Akçe, Yakut (+).
- **Sol ray:** Menü, Duyuru, Diyar Haritası ve kısayollar.
- **Sağ üst:** Posta, Bildirimler, Takvim, Rütbe, Sandık.
- **Orta:** şehir ve dokunulabilir binalar (bina adı levhası, kilitliyse "Sv. X" ve kilit, bildirim noktası).
- **Görev izleyici:** açılır/kapanır; sıradaki görev, ilerleme ve "Al" düğmesi.
- **Alt şerit:** Karakter, Çanta, Görevler, Klan, Kervan, Savaş (rozet sayılarıyla).
- **Sohbet kutusu:** sekmeler Genel, Irk, Klan, Özel; küçültülebilir. Altta XP çubuğu. İlk Alım Paketi simgesi.
- **Menü kutusu:** Sıralama, Rehber, Arkadaşlar, Promosyon kodu, Sorun/Teknik Destek, Mini Dizi, Sunucu, Tam ekran, Ayarlar.
- **Yemin Pazarı** (tarafsız kasaba): Kapı, Başkente dön, Karaborsa, Şaman Yashka, Pazar, Tüccar (Tüccar Halvor), Taş Yemini, Balık Tut. Ayrıca iki ırktan gezgin oyuncular.
- **Klan Toprağı:** Karargâh, Klan Salonu, Görev Panosu, Klan Dükkânı, Sancak Direği, Oba Avı, Hisar, Klan Hazinesi.

## 4. Dünya ve ilerleme
- **Kapı (kutu):** Sefer (bölgeler ve zindanlar), Destan (Tarihin Külleri, 8 bölüm), Yemin Pazarı, CZ-PK (Sv. 12).
- **Sefer:** 4 bölge × 25 aşama, her 5 aşamada bir boss kapısı. Sekmeler: Bölgeler, Zindanlar.
- **Diyar Haritası:** bölgeler ve başkentler; "Diyarın Hâli" ve ırk üstünlüğü.

## 5. Savaş (`ui-battle.js`)
- **Savaş öncesi:** sol "Biz" takımı (güç puanı, karakter kartı), ortada VS ve etki listesi, sağ "Düşman" dalgaları, "Başla" düğmesi (enerji bedeliyle).
- **Savaş HUD'u:**
  - Sol üst: kendi portren, can ve mana.
  - Hedef: düşman portresi ve can.
  - Takım ve sıra şeridi (sıradaki birim vurgulu), dalga göstergesi.
  - Yetenek düğmeleri: temel saldırı + yetenek yuvaları; bekleme süresi ve mana bedeli görünür.
  - Can ve mana iksiri.
  - Kontroller: Savaştan çekil (✕), hız (1x/2x), Otomatik.
  - Hasar sayıları ve durum simgeleri.
- **Boss savaşı:** boss can çubuğu, aşama geçiş metni ("…topraktan bir kez daha fırlıyor!").
- **Sonuç:** zafer ya da yenilgi, ödüller (Akçe, XP, eşya), "Tekrar", "Devam" ya da "Kemikli Koru'ya dön", savaş dökümü.
- **Seri Savaş / Seri İniş, Saldırı Türleri:** bilgi kutuları.

## 6. Karakter, eşya, yetenek
- **Karakter penceresi** (`ui-party.js`):
  - Sekmeler: Karakter, Yetenek, Unvan.
  - 13 ekipman yuvası: Sağ El, Sol El, Baş, Gövde, Bacak, El, Ayak, 2 Küpe, Kolye, 2 Yüzük, Kemer.
  - Ortada 3B karakter, güç puanı.
  - Savaş değerleri: Can, Mana, Saldırı, Savunma, Kritik, Hız.
  - Nitelikler (Güç, Dayanıklılık, Çeviklik, Zekâ, Büyü Gücü) ve "+" ile puan dağıtma, "Sıfırla".
  - Yanda çanta ızgarası.
- **Çanta** (`ui-envanter.js`): doluluk (0/120); filtreler (Silah, Zırh, Takı, İksir…); ızgara.
- **Eşya ayrıntısı** (`ui-esya.js`): büyük simge, derece rengi, değerler, karşılaştırma (yeşil ↑ / kırmızı ↓), Kuşan, Güçlendir, Sat, Parçala.
- **Parçala ya da Sat:** toplu seçim.
- **Örs:** eşya güçlendirme (+), malzemeler (Örs Tozu, bileği taşı), başarı oranı.
- **Yetenek ağacı:** sınıfın 3 dalı, düğümler (kilitli ve açık), yetenek puanı, yol seçimi ("Yol seç" / "Yol değiştir"), yetenek ayrıntısı.

## 7. Görev ve hikâye
- **Görevler:** sekmeler Ana Görevler (64 adım / 16 bölüm, ağaç görünümü), Günlük, Haftalık, Aylık. Görev kartları "Git" ve "Al" düğmeleriyle; ödüller.
- **Görev Defteri, Günlük Görevler, Yedi Gün** (giriş ödülü).
- **Destan:** 8 bölüm; bölüm kartı, oynanabilir bölüm, "kilitli/açık/tamamlandı".
- **Mini Dizi:** bölümler, yeni rozeti.
- **Diyalog:** NPC portresi ve adı, metin, seçenek düğmeleri (Kral Volgar/Edran, Tüccar Halvor, Küçük Bran, Şaman Yashka…).
- **Öğretici:** vurgu halkası, ipucu balonu, "Devam".

## 8. Klan ve rekabet
- **Klan Karargâhı** (Sv. 25): üyeler, rütbeler, klan arması (sancak tasarımı), klan dükkânı, klan görevleri, hazine, bağış.
- **Hisar ve İttifak:** kuşatma, savunma, ittifak.
- **Meydan (arena):** rakip listesi, Şan puanı, Meydan Sezonu ve ödülleri, Meydan Marketi.
- **Şan Divanı, Sıralama:** sekmeler Oyuncular, Klanlar, Ödüller, Sezon; sıralama ödülleri.
- **CZ-PK:** Şan Divanı, Meydan, Meydan Marketi.
- **Kral Otağı:** hükümdar, krallık kararları, oy verme.
- **Taş Yemini:** şampiyon kartı, Lider Klan, Başlıklar, Ödül.

## 9. Etkinlikler
- **Zindan (Yeraltı Ocağı):** katlar, zindan düzenleri.
- **Baskın:** ortak boss, katılımcılar.
- **Nöbet (Şaman Yashka):** dalga savunması.
- **Kader Çarkı:** Kor, Ayaz ve Şimşek Parçası mücevherleri, "kır" (10 parça).
- **Maden:** birikim, toplama.
- **Ödül Sandığı:** açma animasyonu.
- **Balık Tut:** zamanlama çubuğu; Balık Defteri.

## 10. Ekonomi
- **Kervan (mağaza):** sekmeler Yakut ile, Gerçek para, Ücretsiz; ürün kartları (simge, ad, açıklama, fiyat, günlük sınır).
- **Premium:** bronz/gümüş/altın kademeler, Yakut Kartı, Yakut Paketleri.
- **İlk Alım Paketi, Satın alma tamam.**
- **Pazar:** oyuncu ilanları.
- **Tüccar:** NPC dükkânı.
- **Karaborsa:** 8 saatte bir değişen raf, geri sayım, indirim.
- **İz Takası.**

## 11. Sosyal ve diğer
- **Sohbet:** kanallar, susturma bildirimi, emoji.
- **Arkadaşlar:** sekmeler Arkadaşlar, İstekler, Engellenenler.
- **Parti:** davet, parti üyeleri.
- **Posta:** Gelen, Posta Yaz, Geçmiş; ekli ödül alma.
- **Duyuru ve tanıtım, Bildirimler, Takvim** (Etkinlikler).
- **Ansiklopedi / Rehber:** sekmeler Eşyalar, Yaratıklar, Zindanlar, Bölgeler, İksirler, Parşömenler; oyunun bütün sistemleri.
- **Başarımlar, Unvan ve Bonus, unvan seçimi.**
- **Profil:** profil fotoğrafı, profil çerçevesi, oyuncu kartı.
- **Ayarlar:** ses, grafik (kalite kademeleri), dil (TR/EN), hesap.
- **Destek:** Sorun / Teknik Destek, Raporlar, Şikâyet et, Oyuncuyu engelle.
- **Promosyon kodu.**
- **Kilit ekranları:** hesap yasaklı; başka cihazda açıldı; oyun güncellendi.
- **Uyarı kutuları:** "Çanta dolu", onay soruları.
