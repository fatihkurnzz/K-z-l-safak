# Demir Diyarı · Devir Raporu

Bu rapor, oyun üzerindeki çalışmayı başka bir Claude oturumunda (başka bir hesapta) sürdürmek için hazırlandı. Yeni oturumda Claude'a bu dosyayı ve `demir-diyari-kaynak.zip` dosyasını ver; aşağıdaki "Yeni oturuma ilk mesaj" bölümünü de yapıştır.

---

## 1. Durum özeti

| | |
|---|---|
| Oyun | **Demir Diyarı** (Faz 1), tarayıcıda çalışan 3B mobil RPG; yatay oynanır |
| Son yayın | https://claude.ai/artifact/DJihHiDK3J8QzXTCQge7p3 (yeni link; dosya `game/demir-diyari.html`) · eski link: https://claude.ai/artifact/5fWMFYJvLGPjqmkaKSaPW5 (Sürüm 7) |
| Kaynak kod | `demir-diyari-kaynak.zip` (bu raporla birlikte gönderildi) ve aynı dosyalar yayındaki linkte |
| GitHub | `fatihkurnzz/K-z-l-safak`, dal `claude/add-skill-repos-rne7at`. **Hiçbir commit gönderilemedi** (GitHub erişimi 403). Güncel kodun asıl kopyası zip'tir |
| İlk kaynak | Oyun başlangıçta başka bir hesaba ait bir linkten alındı (claude.ai/artifact/MYzseijJ8VLrLwQbMupv9t, "Demir Diyarı Faz 1"). O link hiç değiştirilmedi |

### Kod nerede, nasıl alınır

1. **En güvenlisi:** zip dosyasını aç. İçindeki `game/` klasörü oyunun tamamıdır.
2. **Linkten:** yeni hesapta Claude, yayınlanan linki `Artifact` aracının `read` eylemiyle (`paths` ile) okuyup bütün dosyaları indirebilir. Bu link başka bir hesaba ait olduğu için yeni hesap onu **güncelleyemez**; yeni bir link olarak yayımlamak gerekir.
3. **GitHub:** claude.ai/connect-github üzerinden GitHub bağlanırsa kod depoya da konabilir. Şu an depoda yalnızca ilk iki commit var.

---

## 2. Proje yapısı

```
game/
  index.html          Bütün stiller (CSS) ve sayfa iskeleti. Yayın iskeleti OLMADAN saklanır (bkz. 5. bölüm)
  js/                 İstemci: arayüz modülleri (ui-*.js), 3B motor (engine3d, skinned, models, town, combat), ses (sfx, audio), dil (i18n)
  js/i18n/            İngilizce sözlük: en-ui.js (arayüz), en-content.js (içerik)
  shared/             Oyun KURALLARI. "Sunucu" burada çalışır; istemci hiçbir sonucu kendisi hesaplamaz
  models/             Hazır 3B karakterler (glTF JSON) ve animasyonlar; models.json hangi sınıfın hangi modeli kullandığını söyler
  vendor/three/       three.js r160 (artık internetten değil buradan yüklenir)
  img/                Simgeler ve ilk alım paketi silah görselleri
```

**Önemli kavramlar:**
- **Deneme kipi:** `index.html` içinde `window.DD_LOCAL = true`. Kurallar tarayıcıda çalışır, kayıt cihazda (localStorage) tutulur, diğer oyuncular yapaydır (bot). Gerçek sunucu yoktur.
- **İşlem akışı:** istemci `act('işlem.adı', veri)` çağırır → `shared/game.js` ve `shared/world.js` ilgili işleyiciyi bulur (`HANDLERS`, `META_HANDLERS`, `PVP_HANDLERS`…) → oyuncu kaydı (`p`) değişir → istemciye geri gelir (`S`).
- **Arayüz düğmeleri:** `data-a="ad"` olan her düğme `ACT.ad(dataset, element)` işlevini çağırır (`js/ui-core.js`).
- **Taraflar:** kodda `ocak` = **Orklar**, `sancak` = **İnsanlar**.
- **Grafik kademeleri:** Düşük (koddan üretilen karakterler) · Orta / Yüksek (hazır modeller). `?gfx=low|mid|high` adres parametresiyle zorlanabilir.
- **Test araçları:** Profil penceresinin altında (yalnızca deneme kipinde): enerji, seviye +5, **Ustalık +10**, kaynak, eşya, bütün stage'leri aç, kaydı sıfırla.

---

## 3. Bu çalışmada yapılanlar

### Word belgesindeki maddeler (1–9 ve 11)
Hepsinin kodda karşılığı vardı; oyun açılıp tek tek kontrol edildi. Bulunan hatalar düzeltildi:
- Ana ekrandaki alt menü tamamen kaybolmuştu → geri getirildi (Parti, Çanta, Klan, Sıralama, Görevler, Posta, Ansiklopedi, Kervan).
- Bölge hâkimiyeti düğmesi telefonda gizleniyordu → saatin altına alındı.
- Öğretici atlanınca hediye mesajı görünmüyordu, posta sekme simgeleri bozuktu, klan sayfasında "[object Object]" yazıyordu → düzeltildi.
- Yapay klanlara tanıtım metni ve güç şartı verildi.
- Akıcılık: grafik kalitesi daha erken düşüyor, portreler karede bir çiziliyor, aynı pencere içinde geçişte açılış animasyonu tekrar oynamıyor.

### Irk ayrımı (konsept tablosu)
- Kahraman modelleri ırka göre: Ork Savaşçı = `dark_knight`, Ork Haydut = `goblin`, Ork Rahip = `orc` (topuzlu şaman), İnsan Büyücü = `priest` gövdesi mavi tonla. (`models/models.json` içinde `sınıf.ocak` / `sınıf.sancak` kayıtları)
- Ork kahramanlarında boynuz, dikenli omuzluk, diş kolye; İnsanlarda altın sorguç, mavi tüy, omuz halkası. Göğüste imza taşı: Ork **Yarık Göz**, İnsan **Güneş Taşı**.
- Silahlarda imza taşı; Ork silahlarında tek yana dönük kanca dikenler.
- Şehir: İnsan beyaz taş + mavi çatı + kubbe + vitray; Ork kızıl kaya + koyu çatı + demir kazık + kemik totem + ateş çukuru. Alevler ve Kapı portalı ırka göre renkli.
- Pencere başlıklarında ırk imzası. İnsan müziğine boru ve koro, Ork müziğine gırtlak şarkısı.
- Ork anlatıcısının adı "Şaman Umay" (kadın).

### Kaldırılan sistemler
- **Usta Odası** binası; **Çırak** (çevrimdışı kazanç); **Nöbet** (otomatik savaş); **Usta Sınavı** ve eski usta yetenekleri. Bağlı görev, başarım, bildirim, dönüm noktası ve premium metinleri de temizlendi.
- Kader Çarkı → Usta Odası'nın yerine; Örs → Çark'ın eski yerine; Maden → Örs'ün eski yerine.

### Eklenen ve yenilenen özellikler
- **Yeni Ustalık sistemi** (`shared/mastery.js`): 60. seviyeden sonra kazanılan deneyim ustalığa da yazılır; her ustalık seviyesi her kahramana 1 puan verir; Parti → **Ustalık** sekmesinde 6 düğüm × 10 kademe; puanlar akçeyle geri alınabilir.
- **Çevrimiçi ödülleri** (`js/ui-cevrimici.js`, kurallar `shared/meta.js: ONLINE`): 5 dk, 15 dk, 30 dk, 1 sa, 2 sa sandıkları; süreyi sunucu sayar; her gün sıfırlanır.
- **Çanta / Örs / Pazar**: kare yuvalı ızgara envanter, dokununca bilgi kartı (`js/ui-envanter.js`).
- **Profil**: kahraman kartı, sağ üstte ⚙ ayarlar.
- **Kapı → Bölgeler**: bölgeler en üstte tek satır, seçili bölgenin manzarası arka planda.
- **Diyar Haritası**: parşömen harita (her bölgenin arazisi, kurdele etiketler, yollar, pusula) ve bölge kartları.
- **Takvim → Etkinlikler**: Akın, Gök Yarığı, Büyük Sefer, Kuşatma, Başbuğ seçimi, bölge hâkimiyeti, Meydan sezonu ve yenilenmeler; açık/kapalı ve kalan süre.
- **Kader Çarkı**: kristal kırılma animasyonu.
- **Sohbet**: ana ekranda son 3 mesaj, daha şeffaf arka plan, köşede büyüt düğmesi, emoji paneli.
- **Diğer**: fiyatlar yalnızca USD; görev sayacı çubuğun sağ üstünde; destek ekranında çizimler; ferman parşömeni; dil seçiminde bayraklar.
- **Teknik**: three.js oyunun içine kondu (internet bağımlılığı yok); karakter dokuları 1024 → 512 px (1,74 MB → 0,63 MB).

---

## 4. Eksik kalanlar ve bilinen sınırlamalar

| Konu | Durum |
|---|---|
| Gerçek sunucu ve bulut kaydı | Yok. Oyun deneme kipinde; ilerleme yalnızca cihazda. En büyük açık iş |
| APK | Yapılmadı. Bu ortamda Android SDK indirilemiyordu; kullanıcı da APK'dan vazgeçti |
| İnsan Rahip ve Büyücü | Aynı gövdeyi kullanıyor (Büyücü mavi tonlu, asalı). Tam ayrım için yeni model dosyası gerekir |
| Ferman ekranı | Yeni parşömen tasarımı yalnızca kodda kontrol edildi; Başbuğ olmadan o sayfa açılmadığı için ekranda görülmedi |
| Sohbet klavyesi | Kod klavye yüksekliğini ölçüp kutuyu yukarı itiyor; gerçek telefonda denenmedi |
| Sesler | Yeni boru, koro ve gırtlak sesleri yalnızca kod olarak doğrulandı; dinlenmedi |
| Test edilmeyenler | Ork tarafının eylem testi; zindanlar (Dipsiz Kuyu, Yeraltı Ocağı, Gök Yarığı, Mühürlü Oda); etkinlikler (Akın, Kuşatma, Sefer, Sancak Savaşı, Canlı Meydan); Oba Avı; Başbuğ seçimi ve ulufe; arkadaş ve özel mesaj; Pazar'dan satın alma; Su Ver ve taş üretimi; destek talebinin baştan sona akışı |
| Öneriler | `Demir_Diyari_Oneriler.pdf` içinde (sunucu, otomatik test, 60+ hedef [yapıldı: Ustalık], çevrimdışı dönüş ödülü, Pazar'da fiyat aralığı, Sezon Karnesi, Çark'ta garanti ödül, erişilebilirlik, mağaza hazırlığı) |

---

## 5. Dikkat edilmesi gerekenler (teknik tuzaklar)

1. **Yayın iskeleti:** Artifact yayınlanırken sayfaya `<!doctype><head>…<body>` eklenir. Linkten indirilen `index.html` bu iskeleti İÇERİR; yeniden yayımlamadan önce yalnızca `<body>` ile `</body>` arasındaki içerik bırakılmalı. `index.html` başındaki `<meta charset="utf-8">` silinmemeli (yoksa ✓ gibi işaretler bozuk görünür).
2. **Yayınlanabilen dosya türleri:** Artifact barındırması `.glb` sunmuyor (bu yüzden modeller glTF **JSON** kaldı). Uzantısız dosyalar (`vendor/three/LICENSE`) `contentType: "text/plain"` ile gönderilmeli.
3. **Çok dosyalı yayın:** `files` eşlemesinde değişen bütün dosyalar listelenmeli; silinen dosya için değer `null` verilir. Toplam yaklaşık 166 dosya.
4. **Sözdizimi kontrolü yetmez:** `node --check`, şablon metnin (backtick) kapanışı silindiğinde hatayı yakalamayabilir. Her değişiklikten sonra oyunu tarayıcıda açıp konsol hatalarına bakmak gerekir.
5. **CSS sınıf adı çakışması:** `index.html` çok büyük; yeni sınıf adı vermeden önce aranmalı (örnek: `.zrow` Diyar Haritası'nı bozmuştu, `.mz` eski harita kuralları yeni haritayı etkiledi). Benzersiz önek kullan.
6. **Sarmalanan işlevler:** Bazı pencereler birden fazla modülde üst üste sarmalanıyor (ör. `ACT.profile`: `ui-hub.js` → `ui-kalicilik.js` → `ui-ayarlar.js`). Bir pencereyi değiştirirken bütün sarmalayıcıları ara: `grep -rn "ACT.profile" js`.
7. **Bir sistemi kaldırırken:** kurallardan, arayüzden, İngilizce sözlükten, başarımlardan, dönüm noktalarından ve bildirimlerden de temizle. Ustalık kaldırılınca Yetenek sayfası 30. seviyenin üstünde çöktü (usta yeteneğinden simge alan kod); yeni hesapla test edince görünmedi, 70. seviyede göründü. **Her değişikliği yüksek seviyede de dene.**
8. **İngilizce sözlük:** Türkçe metin değişince `js/i18n/en-ui.js` ya da `en-content.js` içindeki karşılık da değişmeli; yoksa İngilizce seçen oyuncu Türkçe görür.
9. **Kurallar sunucu tarafında:** Ödül, süre, puan gibi her şey `shared/` içinde hesaplanmalı; istemci yalnızca gösterir. Yeni oyuncu kaydı alanları (`p.mastery`, `p.online`, kahramanda `h.mst`) kayıtta kendiliğinden tutulur (alan süzme yok).
10. **Test ortamı (Claude Code bulut oturumu):**
    - Playwright hazır; `?gfx=low` ile testler daha hızlı.
    - Yazılımla çizim yavaş: aynı anda iki tarayıcı testi çalıştırma, süre aşımına düşüyor.
    - Uzun `python3 - <<'E'` gibi heredoc komutlarını güvenlik denetimi "silme işlemi" sanıp reddedebiliyor; düzenleme betiklerini dosyaya yazıp çalıştır.
    - Oyunu yerelde sunmak için: `python3 -m http.server 8765 -d game`.
    - Test için seviye/kaynak: sayfada `const api = await import('/js/api.js'); await api.act('dev.level', { lvl: 70 }); await api.act('dev.give');`.
11. **Paylaşım:** Yeni hesapta yayımlanan link başta yalnızca sahibine açıktır; başkaları için sayfanın Paylaş menüsünden açılmalı.

---

## 6. Yeni oturuma ilk mesaj (kopyalayıp yapıştır)

> Ekteki `DEVIR_RAPORU.md` ve `demir-diyari-kaynak.zip` benim oyunum Demir Diyarı'nın son hâli ve devir raporu. Raporu baştan sona oku; özellikle 5. bölümdeki teknik tuzaklara uy. Zip'i aç, `game/` klasörünü çalışma klasörü olarak kullan, oyunu yerelde aç ve hatasız açıldığını doğrula. Sonra oyunu yeni bir Artifact olarak yayımla ve linki bana ver. Ardından sana yeni isteklerimi yazacağım.

---

## 7. Commit geçmişi (bu çalışmanın sırası)

```
6b8f847 Seviye kutusu kaldırıldı; 5 dk çevrimiçi ödülü; arazili parşömen bölge haritası
7fc0a5d .glb barındırılamadığı için JSON modellere dönüldü; dokular 512 px
07177dc Ustalık sistemi, çevrimiçi ödülleri, Çark animasyonu, Ork Haydut/Rahip modelleri
6eff532 three.js oyuna gömüldü; destek grafikleri; ferman; bölge kartları; takvim etkinlikleri
bafc5f1 Dil seçiminde bayraklar; öneriler PDF'i
c5ccc2d USD fiyatlar, emoji, görev sayacı, profil, bölge satırı, ızgara envanter
e7def52 Yetenek sayfası çökmesi düzeltildi; İngilizce metinler
4ef6182 Usta Odası, Usta Sınavı, Çırak ve Nöbet kaldırıldı; binalar yer değiştirdi
48ef259 Irk ayrımı: modeller, ırk parçaları, imza taşları, mimari, sesler
523b57a Alt menüye Çanta/Klan/Ansiklopedi; sohbet büyüt düğmesi; alev renkleri
71aa236 Yapay klanlar; daha akıcı pencereler; erken kalite düşürme
298f87f Alt menü, bölge düğmesi, öğretici mesajı, posta simgeleri, klan sayısı düzeltmeleri
cff08aa Oyun kaynağı (ilk yayının kopyası)
```
