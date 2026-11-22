# C1 · Hızlı düzeltmeler (22 Kasım 2026)

Kaynak: GOREV_PAKETI / CLAUDE_OPUS_5.5_GOREVLERI.md, denetim maddeleri K5, Y4, Y9, Y3, O6, D3, G6. `shared/` dokunulmadı.

| Madde | Ne yapıldı | Dosya |
|---|---|---|
| K5 eşsiz/set zırh simgesi | `itemPng`: eşsiz ve KO set zırhları (60 eşya) sınıfın aynı parçasının boyalı simgesini alır. Elementli takılar (Kor/Alaz/Şimşek/Fırtına küpe, kolye, yüzük; 96 taban) türün boyalı takı simgesine düşer. Boyalı simgesi olmayan taban: **216 → 0**. Çantada beyaz siluet kalmadı (Sv. 33 test çantası: 107 boyalı, 0 glif). | `js/item-icons.js` |
| Y4 test araçları | Profil test düğmeleri, Öğretici "yeniden başlat", Premium "kademeyi değiştir" ve ana ekrandaki "DENEME SÜRÜMÜ" rozeti yalnız `?dev=1` ya da `localStorage dd_dev='1'` ile görünür (`devUI()`). Komutlar (`ACT.dev*`) çalışmaya devam eder; denetim betikleri onları doğrudan çağırır. Unvan yokken "[Ünvan]" yerine "Unvan seç" yazar. | `js/api.js`, `js/ui-hub.js`, `js/ui-kalicilik.js`, `js/ui-town.js` |
| Y9 bildirim | Simge boş görünüyordu: `v27-duzen.css` simgeyi türün rengiyle boyuyordu, kart zemini de aynı renkti. Simge artık koyu zeminde. Kart üst ortada ince şerit, en çok 1 tane, 2,6 sn. Pencere, diyalog ya da savaş açıkken sırada bekler (en çok 5). Kart görünürken pencere açılırsa kart sıranın başına döner. Karakter seçiminde düz bildirim alta iner (yüzü örtmez). | `js/ui-duyuru.js`, `css/v27-duzen.css` |
| Y3 sonuç başlığı | "ZAFER / YENİLGİ" artık tam genişlikte, ortalı, Cinzel 24–34 px, iki yanında ince çizgi; modal başlık şeridi kuralı sonuç penceresine uygulanmıyor. Yıldız rozeti 22 px'ten 44 px'e çıktı. (Halk arması ve yeni sonuç maketi C1 kapsamı dışında, raporun "Savaş öncesi ve sonucu" işi.) | `css/v27-duzen.css` |
| O6 Kristal Nöbeti | "Lav Yürek geldi" uyarısı durum yazısından çıkıp ayrı tek satırlık şeride alındı (taşarsa üç nokta). | `js/ui-nobet.js`, `css/v27-duzen.css` |
| D3 ondalık | `pct` ve `pctTxt` ve profil TP yazısı Türkçe virgül kullanıyor ("+%1,9 TP"). | `js/ui-core.js`, `js/ui-hub.js` |
| G6 dar ekran | `orient.js` mantıksal genişlik < 760'ta `html.narrow` koyar. Dar ekranda Görevler izleyicisi dock'un bir satır üstüne, saat oyuncu kartının sağına alınır. 667×375'te 5 dock düğmesi ve 3 sayaç görünür. 880×406, 915×412, 1180×820'de değişiklik yok, çakışma yok. | `js/orient.js`, `css/v27-duzen.css` |
| YERLESIM_SPEC.md | 8.1 Ana Merkez ve alt şerit satırı bugünkü düzene göre yeniden yazıldı. | `_tasarim/YERLESIM_SPEC.md` |

## Test
- 880×406, iki halk: karakter seçimi, profil, çanta, Kristal Nöbeti, savaş sonucu (1-1, otomatik, gerçek zafer).
- Dock: 667×375, 880×406, 915×412, 1180×820.
- `ui-denetim.js` iki halk, 880×406 (`DD_GELISMIS=1`).
- Kristal Nöbeti boss şeridi gerçek nöbet akışında görülmedi (Sv. 46 ve nöbet saati gerekir); şerit sayfaya enjekte edilerek ölçüldü.
