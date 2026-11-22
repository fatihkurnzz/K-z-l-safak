# Demir Diyarı · Oturum hafızası

Kullanıcı Türkçe konuşur; yanıtlar Türkçe olsun. Oyun: **Demir Diyarı** (sayfa başlığı "Korant Online"). Tarayıcıda çalışan, YALNIZCA YATAY çizilen 3B mobil RPG: vanilla ES modülleri, three.js r160 gömülü, sıra tabanlı belirlenimci savaş. Hikâye: **Vahran: Tarihin Külleri** (`_tasarim/VAHRAN_destan.txt`).

## Çalışma şekli
- Kullanıcı görselleri GPT'ye yaptırıp ZIP olarak gönderiyor, ben oyuna yerleştiriyorum. **Oyun mekaniklerine dokunma** (`shared/` = mekanik); yalnız grafik, arayüz, yerleşim.
- İş bitince **yapıt olarak yayımla** ve bağlantıyı ver.
- Kullanıcının beğenisi: tek parça boyanmış sahneler (ayrı sprite + boş zemin BEĞENİLMEDİ); sade, gerçekçi, az altın.
- KULLANICININ TELEFONU: 2340×1080, Claude uygulamasında dik tutuluyor, oyun döndürülüyor → mantıksal ölçü **880×406** (dpr 2.66). Eski notlardaki 722×411 ve 846×412 yanlıştı.

## SON DURUM (22.11 gece, 2. oturum) — clear sonrası buradan devam
- **Sürüm 26 YAYINDA** (511 dosya = SINIR; yayın commit'i **0cf3ae8** ve sonrası; sonraki yayında `git diff --name-status 0cf3ae8 HEAD -- oyun-son`, `_tasarim` hariç).
- **YENİ ÇALIŞMA DÜZENİ: GÖREV PAKETİ** (kullanıcı 22.11'de gönderdi). Üç model: GPT (görsel G1–G8), Gemini (denetim M1–M5), ben (kod C0–C16). Paket: `_tasarim/denetim-22kas/` altındaki notlar + ana rapor yapıtı https://claude.ai/artifact/831ytxuR3nEuTZvsbEAtxy ("Demir Diyarı Ana Denetim", 47 sorun, puan 44/100; sorun kodları K1–K5 kritik, Y1–Y11 yüksek, O1–… orta, D1–… düşük, G1–G6). Paket ZIP'i scratchpad'de silinmiş olabilir; görev tablosu aşağıda.
- **Benim görevlerim (C)**: C0 sanat kitabı/istem dosyalarını depoya koy · **C1 BİTTİ** · **C2 BİTTİ** · C3 2B boyalı savaş birimi pilotu (GPT G1 gelince; yeni `js/savas-birim2d.js`, combat.js yalnız çizim katmanı, bayrakla eski çizime dönüş) · C4 3B malzeme/ışık pilotu (aynı kamera) · C5 seçilen yöntemi yay (16 kahraman, yaratık aileleri, bosslar, Ansiklopedi, VS) · C6 Karakter penceresi 2B + 13 yuva (Gemini M4 maketi, ±4 px) · C7 yer tutucu sahneler (GPT G5) · C8 diyalog bileşeni + NPC portreleri (G4) · C9 simge birliği (G6 yetenek kartları, M3 glifleri) · C10 VFX (G7) · C11 CSS göçü (token, 4 düğme rolü, tek amblem, ≤3 sayaç; v8…v33 boşalt) · C12 ad tablosu (adlar.csv ÇIKARILDI → `_tasarim/denetim-22kas/adlar.csv`, 901 satır; Gemini M5 önerisi + kullanıcı onayı gelince yalnız `shared/items*.js` ad alanları) · C13 parametresiz ACT çağrılarına koruma (skill, exchange, stage, msgMenu) · C14 tembel yükleme (savaş arka planı, VFX) · C15 Emeği Geçenler (CC BY) · C16 regresyon/yayın/telefon turu.
- Sıra: G1 gelince Gemini M1 denetler → ben C3+C4 → kullanıcı yöntemi seçer → C5… Son: G6, G7, C11, C12, G8. Kullanıcı kararları bekleniyor: oyunun tek adı (Korant/Demir Diyarı), Savaşçı tırpan mı kılıç-kalkan mı, İngilizce adlar Türkçeleşsin mi, yaratıklar 3 poz mu tek poz mu.
- Gemini ekleri kullanıcıya gönderildi: adlar.csv (M5), akis_ELENTHA_insan.mp4 + akis_KRAGMIR_ork.mp4 (M2; önceki oturum scratchpad'inden). M1 için GPT teslim ZIP'i bekleniyor.
- **C1 yapılanlar** (`_tasarim/denetim-22kas/C1_HIZLI_DUZELTMELER.md`): K5 `itemPng` eşsiz/set zırh + elementli takı → boyalı simgesiz taban 216→0 · Y4 `api.js devUI()` (test araçları/DENEME rozeti yalnız `?dev=1` ya da `localStorage dd_dev='1'`; ACT.dev* çalışır), "[Ünvan]" yerine "Unvan seç" · Y9 `ui-duyuru.js` bildirim kuyruğu (1 kart, pencere/diyalog/savaşta bekler, 2,6 sn, üst orta ince şerit; simge görünmüyordu: sarı zemine sarı) · Y3 sonuç başlığı tam genişlik Cinzel + yıldız 44 px · O6 `.nb-boss` şeridi · D3 `pct/pctTxt` virgül · G6 `orient.js html.narrow` (<760) + `YERLESIM_SPEC.md` 8.1 güncel. Yeni CSS hep `css/v27-duzen.css` SONUNDA.
- **C2 sonucu** (`C2_HD_MODEL_RAPORU.md`): modeller yükleniyor; ama kahraman hep prosedürel (`gorunus.js SKINNED_HERO=false`), hayvanlar `BeastCharacter` (55/146), insansıların yalnız 25/91'inin modeli var; 100 stage'in 16'sında iskeletli düşman. Kademe sorunu değil → 2B pilot önerisi güçlendi.
- Test edilmedi: ui-denetim.js iki halk tam turu (22.11'de arka planda başlatıldı, sonucu okunmadı → sonraki oturumda `DD_GELISMIS=1 node _tasarim/araclar/ui-denetim.js <halk> <klasör> 880 406` yeniden çalıştır), gerçek nöbet akışında boss şeridi, gerçek telefon.
- Eski sıradakiler (görev paketi bunları kapsıyor): boss savaşı HUD'u, ekipman ekranı (=C6), Kervan/Görevler maketi, savaş sonucu maketi, menu-kutu, P5 sayfa içleri. Eksik listesi `_tasarim/EKSIK_LISTESI.md`.

## Yayın
- ASIL KOD = `oyun-son/`. KENDİ YAYINIMIZ: https://claude.ai/artifact/GwNoLLWnf5Wjc1PUJep2yi (git'te karşılığı HEAD; oyun-son, `_tasarim/` hariç).
- Kurallar: sayfa = `oyun-son/index.html`, `root` = oyun-son, `files` haritası; tek gönderimde ≤255 dosya, **bir sürümde ≤511 dosya** (aşınca 422) → yeni dosya için önce bir şey çıkar ya da büyük görsel setlerini JS/CSS'e göm. Silme = `null`. Yalnız değişenleri gönder.
- Adımlar: önce `list scope=files`; ilk publish "live version viewed değil" reddi verebilir → aynısını tekrar gönder (gerekirse 3. kez).
- Yayından çıkarılan, yerelde duran: `models/test/Xbot.glb.js`, `video/README.txt`, `img/items3d/*`, `img/kd/simge3/simge-{akce,enerji,kulce,san,yakut}-*`.
- Kaynak artefakt (kullanıcının, kuruluş dışı; okunur, yayımlanamaz): https://claude.ai/artifact/KUfQG1bV27JFGDTjpBwEdk, son eşitleme 20.11 (sürüm 1795210613-46a1). "Son hali çek" denirse: `list scope=files` → yerel sha256 ile karşılaştır → farklıları `read paths` ile scratchpad'e indir → bizim değişikliklerimizi koruyarak birleştir.
- Git dalı `claude/add-skill-repos-rne7at`; push hep 403 (GitHub uygulaması kurulu değil). Commit'ler yerelde; kullanıcıya söyle.

## Sistemler ve araçlar (OTOMATİK = elle düzenleme, aracı çalıştır)
- **CSS şablonları** (`_tasarim/araclar/`): `v31-sablon.css` → `v31-gom.py .` → `css/v31-savas-hud.css` (--g = 1 maket pikseli); `v32-sablon.css` → aynı araç → `css/v32-p2340.css` (ortak pencere şablonu, kral diyaloğu, Diyar Haritası, ana merkez parçaları); `v33-sablon.css` → `v33-gom.py .` → `css/v33-karakter.css`; `v26-sablon.css` → `v26-gom.py` → `css/v26-gpt4.css`. Elle yazılan katmanlar: `v27-duzen.css` (ortak düzen), `v28-paket345.css` (harita etiketleri, alt şerit), `v29-anaekran.css` (ana ekran), `v30-savas.css`. Stil katmanları v8…v33, çok `!important`.
- **Gömülü görsel JS'leri** (WebP base64 → Blob URL): `js/esya-png.js` (`esya-gom.py`; 96 eşya simgesi, `item-icons.js itemPng`), `js/portre-png.js` + `js/vfx-png.js` + `js/grafik5-png.js` (`p345-gom.py <p3> <p4> <p5> <oyun-son>`), `js/hikaye-png.js` (`hikaye-gom.py .`; kral portreleri, yemin-1..4, diyar), `js/savas-arka-png.js` (`savas-arka-gom.py <webp> .`), `js/karakter-png.js` (`karakter-gom.py .`; 2B tam boy + 20 yüz).
- **Haritalar**: `sahne.py <kaynak> <oyun-son> [kontrol]` (opencv-python-headless + scipy) → `img/kd/sehir/<yer>/sahne.webp`, `atlas.webp`, `js/hub2d-data.js` (OTOMATİK). Kaynak 2340 px: `_tasarim/gelen/sehir-2340/`, yerler sancak/ocak/carsi/klan-ocak/klan-sancak. `hub2d.js`: resmin TAMAMI görünür (yanlar bulanık), sürükle/yakınlaştır, basınca kesit parlar → `ACT.building`. Kimlikler: başkentte wheel, clanhq (Kral Otağı), anvil, iksir, karaborsa, carsi, mine, monument, portal (`portalMenu`), gate (`gateMenu`), king; çarşıda c_silah/c_zirh/c_sarf (`tuccarSub`), c_taki, pazar, karaborsa, yashka, pier (şelale = Balık Tut), portal; klanda k_salon, k_hq, k_hazine, k_dukkan, k_hisar, k_av, k_gorev, k_sancak, gate, portal. Etiketler yalnız beyaz bina adı. `localStorage dd_hub2d='0'` eski 3B kasaba.
- **Savaş**: yandan 3/4 görünüş, `combat.js FORM` (1–5 birim), dinamik kamera `js/savas-kamera.js` (`window.DD_CAM`; rapor `_tasarim/teslim-kamera/`), boyalı arka planlar `js/savas-arka.js` (`BY_KIND`, `LIGHT`). Savaşta Tur sayacı, Sıra Sonu, sohbet, sıra şeridi YOK (kullanıcı kararı). OTO her seviyede, hız OTO'dan bağımsız (PvP'de kapalı). Efekt şeritleri `fx.js strip()` (`window.DD_FX.strip`).
- **Karakter oluşturma**: `js/ui-olustur.js` (kök `#olz.vz`, `.vz-*`), referans `_tasarim/gelen/karakter-son/00_REFERANS/ONAYLI_KARAKTER_OLUSTUR.png`; varsayılan Elentha → kadın Savaşçı, Kragmir → erkek Savaşçı (`SIDE_DEF`). Seçme ekranı (`ui-karakter.js`) 2B tam boy. Oyundaki 3B kahraman değişmedi.
- **Ana ekran**: `v29-anaekran.css` (dikey oyuncu kartı solda, Görevler tek satır sohbet ile dock arasında, sohbet şeridinde kanal sekmeleri `cbTab`). Pencere sekmeleri HEP SOLDA (`ui-core drawWin`). Pencere amblemleri `ui-core embOf`.
- **Ses**: tema müziği `audio/kizil-goz.mp3` (`sfx.js MUSIC_URL`, başkent+pazar+fragman); savaş/boss ezgileri hâlâ sentez.
- GPT teslim kayıtları: `_tasarim/gelen/` (paket1–5, p2340, karakter-son, karakter-v2, savas-arka, v16…). GPT'ye istek notları: `_tasarim/gpt-paket/`.

## Test
- Sunucu: `python3 -m http.server 8765 -d oyun-son` (konteyner yeniden başlarsa tekrar aç).
- Betikler scratchpad `t/` altında (silinmiş olabilir, yeniden yazılır): sv.js, fn.js (savaş HUD; R=ocak|sancak W H O EVAL), kam.js, dokun.js, vztam.js (karakter oluşturma), oyun.js. 22.11 betikleri `_tasarim/araclar/c1c2/` (hub.js ortak giriş; c2.js <gfx> <halk> <stage> çizim sınıfları; g6.js <W> <H> dock ölçümü; y3.js gerçek savaş sonucu; c1g.js profil/çanta/nöbet; k5.js boyalı simge sayımı; adlar.mjs <çıktı.csv>) — scratchpad `t/` içine kopyalayıp oradan çalıştır. Görev paketi belgeleri `_tasarim/denetim-22kas/paket/`. Kalıcı araçlar `_tasarim/araclar/`: `duman-test.js`, `ui-denetim.js`, `kontrast.py`, `ui-akis.js`, `eksik-liste.py`.
- Ölçü 880×406, deviceScaleFactor 2.66 (ayrıca 1024×768, 1280×720). Akış: `.ld-go` → `[data-o=race]` (0=Elentha, 1=Kragmir) → ad + Oluştur → `#tkenter` → "Geç" → `.tskip`. Tıklamaları `page.evaluate(el.click())` ile yap (üst katmanlar engelliyor). Testleri sırayla çalıştır, `timeout 115`.
- Hiç test edilemeyenler: gerçek telefon, Android geri, PvP, ödeme, klan içi ekranlar.

## Oyun içeriği (özet)
- 2 halk: Kragmir/ork (`ocak`), Elentha/insan (`sancak`); `p.faction`, `html[data-faction]`. 4 sınıf (`shared/content.js`; oyunda Şifacı/Şaman adları). Bölgeler `shared/zones.js` (Vahran Ovası 1–20, Kül Geçidi 20–40, Kızıl Bahar Meydanı 40–60, Sisli Çukur 60–65). Bosslar: Dev Solucan, Tepegöz, Kristal Muhafızı, Lav Yürek, Kül Ağası Karadun, Mareşal Marven, Adsız. Ana görev 64 adım (`shared/anagorev.js`). Krallar: Volgar Demirdiş (Kragmir), Edran (Elentha).
- Yerel kip: `window.DD_LOCAL = true`, kayıt localStorage. Ölçek `js/orient.js` (`--lw --lh --s`); dik telefonda gövde 90° döner.
- Eşya: 3 derece Standart #b9c0c8 / Nadir #4aa3ff / Eşsiz #ffb52e; savaşta temel + 5 yetenek + 2 iksir.

## GPT teslim denetimi (her pakette)
- İndirilen ZIP'i ayrı boş klasörde aç, `python3 -I` kullan. Biçim yalnız PNG/JPEG/WebP (AVIF, SVG, BMP/TGA/TIFF yasak; GLB → `.glb.js`). Alfa denetimi (boş% > 85 → bozuk), ölçü, iki halk eşliği, sha ile önceki paketlerle karşılaştır. Sonra WebP'ye çevir, entegre et, test et, ekran görüntüsü gönder, yayımla.
- Zayıf/uyumsuz parçaları kullanma, nedenini kullanıcıya söyle.

## Diğer notlar
- Heredoc python bazen güvenlik denetimine takılır: betiği dosyaya yazıp çalıştır.
- PDF: reportlab + DejaVu yazı tipleri (Türkçe karakter).
- Silah/yetenek adlarının çoğu İngilizce/Knight Online kaynaklı (Mirage Dagger, Iron Impact…); Türkçeleştirme önerilebilir.
- Kullanıcıya sorulmuş, cevap bekleyen: Play Store mu tarayıcı mı; sunucu ne zaman; gerçek para/kozmetik mi; 2. sezon yazılacak mı.
- Paylaşım hatası ("…JPEG, PNG, GIF veya WebP…") çıkarsa sebep gömülü AVIF olabilir (GLTFLoader/FBXLoader içi dizgeler).
