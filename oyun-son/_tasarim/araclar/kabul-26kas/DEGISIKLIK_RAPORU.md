# P33 · Değişiklik raporu (KORANT-v40-1dda167 → KORANT-v40-1dda167+P33)

Fark: `git diff 1dda167 HEAD -- oyun-son ':!oyun-son/_tasarim'` → 22 dosya, +873 / −55 satır, 4 yeni dosya
(`css/p33-kabul.css`, `js/npc-soz.js`, `js/yukleme-metin.js`, `js/p33-canli.js`). **`shared/` (mekanik, ekonomi, ödül, kayıt) DEĞİŞMEDİ.**
Görsel/ses dosyası, 42 sahne, 13 iç mekân, ana harita DEĞİŞMEDİ (sha kanıtı `kanit/koruma/koruma.json`).

Gereksinim ↔ değişiklik eşlemesi: `KAPSAM_MATRISI.md`. Test sonuçları: `TEST_KANITLARI.md`, `QA_MATRISI_DOLU.json`.

## Kök neden grupları

### K1 · Pencere/iç mekân kabuğu tutarsızdı (GEM N4-01, N4-04, BUL-B1)
- `css/p33-kabul.css` #p28bina ortak kabuk değişkenleri (çerçeve, başlık, kapat, hap).
- `js/ic-mekan.js` MEKAN.zafer: Zafer Anıtı artık iç mekân (sahneler/zafer_aniti.webp, %50 karartma kalktı).
- `js/ui-ahir.js` Zafer iç mekânla açılır, `p24KitKur()` çağrısı; `js/ui-kaplama.js` `export p24KitKur`.

### K2 · Dar alanda kırpılan/küçük hedefler ve yazılar (GEM N6-01, N4-03, N6-03, N6-05, N6-07, N2-02, BUL-A6/A8, GPT 11 px)
- Karakter + düğmesi 22 px, örs halkası 32 px, VS "Karakter" 32 px, Nöbet afişi −16 px, Karaborsa/Başarım 2 satır, kapsül çizgisi, kontrast.
- 11 px kuralı: pencere içi ölçülen seçiciler + **HUD (kullanıcı kararı 26.11)**: seviye, can/mana, Premium, sayaçlar, saat, sunucu, alt menü,
  rozetler, sohbet sekmeleri/satırları 6–10,5 px → 11 px. Konum/renk/simge değişmedi. Ölçüm sonrası HUD'da 11 px altı yazı: 0.

### K3 · Gerçek-para izlenimi (GEM N2-01, BUL-B2)
- `js/ui-town.js` Premium fiyatları yerel kipte "Yakında", satın alma koruması.

### K4 · Kural dışı görünüm (GEM N3-01)
- `js/yaratik2d.js` T3 görünümü varsayılan KAPALI (`?t3=1` açar). Kullanıcı 26.11 onayladı.

### K5 · Savaş okunurluğu (GEM N5-01, BUL-A7, AAA 7)
- `js/combat.js` oto ipucu 3 sn + dokununca kapanır; can çubuğu aralığı; **boss yeteneğinden önce "⚠" uyarı başlığı (+0,35 sn)**.
- `js/fx.js` parçacık sayısı × `DD_EFEKT` (Efekt yoğunluğu: Az = 0,5).

### K6 · GPT içerik entegrasyonu (GPT 1–3)
- `js/npc-soz.js` 105 replik; `ic-mekan.js` selamlama balonu, `ui-han.js` / `ui-karaborsa.js` / `ui-town.js` gerçek sonuç satırı.
- `js/yukleme-metin.js` 4 bölge / 5 zindan / 20 ipucu → `combat.js savasHazirla`, `main.js` açılış ipucu.
- `js/sfx.js` iç mekân ortamları (han, ahır, örs, maden, klan) + **5 zindan ortamı** (yalnız mevcut seslerden); `ui-ses.js`, `savas-arka.js` (`DD_ZEMIN`).

### K7 · Canlılık ve geri bildirim eksikti (AAA 2, 3, 5, 6, 8, 9)
- YENİ `js/p33-canli.js`: harita zerreleri (Kragmir kor/kül, Elentha/çarşı ışık tozu, uzak kuşlar), ırk renginde portal parçacıkları,
  gün evresi tonu (UTC+3, `shared/realm.js phaseOf` salt okunur), örs sonucu (kıvılcım / sönme / kırılma / muska), seviye-başarım-görev-sandık-unvan şeridi,
  akçe/yakut sayaç akışı, EXP çubuğu akışı.
- CSS: düğme basma 90 ms, modal 200 ms, sekme 150 ms, ganimet nadirlik parlaması, konuşma portresi nefesi.
- Hepsi dokunulmaz katman; "Hareketi azalt" ve "Pil tasarrufu" kapatır; pencere/iç mekân açıkken ve sekme gizliyken tuval durur.

### K8 · Ayar eksikleri (AAA 4, 11)
- `js/audio.js` + `js/sfx.js`: ayrı **Müzik** kanalı (mus.* → music); eski kayıtlı ses ayarı bozulmaz (cleanSettings varsayılanı 0,5).
- `js/ui-ayarlar.js`: Grafik → Çevre animasyonları, Efekt yoğunluğu: Az, Kare hızı sınırı: 30, Pil tasarrufu; Ses → Müzik kaydırıcısı.

### K9 · Akış çakışması (BUL-A5)
- `js/ui-karakter.js`: "Hoş geldin" yazısı öğretici/NPC diyaloğu kapanınca gösterilir.

## Açık kararlar (kullanıcıya)
1. Aynı işe birden çok giriş (Mağaza 5, Unvan 3, Görev 2, Meydan 4): yönlendirme değiştirilmedi.
2. Test paneli (profil "TEST ARAÇLARI"): 24 Kas kararıyla varsayılan görünür; Play Store derlemesinde `?store=1` davranışı varsayılan yapılmalı.
3. Haritada sancak/su/ateş hareketi için GPT katman çizimi (`GPT_ISTEK_P34.md`).
