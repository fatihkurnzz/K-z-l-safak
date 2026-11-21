# VAHRAN · Grafik Teknik Envanteri V2 (21.11.2026)

Kaynak: güncel oyun kodu (`oyun-son/`, git HEAD). Sayılar `shared/items.js` gibi modüller node ile içe aktarılarak üretildi, elle sayılmadı.
İşaretler: **✔ DOĞRULANDI** = kodda görüldü (dosya ve bileşen adı yanında). **ENTEGRASYON KARARI** = kodda henüz yok; Claude bu kurala göre yükleyici yazacak, GPT buna uymalı. **DOĞRULANMADI** = kodda bulunamadı, tahmin edilmedi.
Bu belge grafik tasarlamaz, mekanik değiştirmez, eski koordinatları zorunlu kılmaz. Bina üretimi yok; Kragmir Kalesi yalnız sanat referansı.

---

## 0. Önceki belgelerle çelişen 3 düzeltme (önemli)
| Konu | Önceki belgelerde | Güncel kod | Kaynak |
|---|---|---|---|
| Savaş yetenek yuvası | "4 yetenek" | **Temel saldırı + 5 etkin yetenek** + 2 iksir yuvası (Can, Mana) | ✔ `shared/hero.js` `LOADOUT_ACTIVES = 5`; `js/combat.js` `drawBar()` |
| Savaş hızı | "1x/2x" | **1x / 2x / 3x**; 2x ve 3x yalnız Otomatik açıkken ve yalnız PvE/tek oyunculu savaşta | ✔ `js/combat.js` `renderButtons()`, `#bspeed` |
| Arbalet kademeleri | "k5, k6, k8" (önceki mesajım) | Simge kovası kuralına göre **k5 ve k8 yeterli** (bkz. §1.2) | ✔ `js/item-icons.js` `ITEM_ICONS` |

---

## 1. Kesin eşya envanteri

### 1.1 Kimlik biçimi ✔ `shared/items.js` `itemBase()`
- Silah: `w:<tür>:<kademe>` · Zırh: `a:<sınıf>:<kademe>:<yuva>` · Takı: `j:<tür>:<kademe>` · Eşsiz: `u:<anahtar>` · Başlangıç paketi: `s:<anahtar>`
- Kodda kademe **0–7** indekslidir. Dosya adlarında **k1–k8** kullanılır (k = indeks + 1). Çeviriyi Claude yapar.
- Varyantlar (`w:mace:2:1` gibi) kendi simgesini İSTEMEZ: tür simgesi aynalanıp köşesine küçük işaret konur ✔ `js/item-icons.js` `itemIcon()`, `VARIANT_MARKS`.

### 1.2 Silahlar: 14 tür, gerçek kademeler ✔ `WEAPONS`, `WEAPON_NAMES`, `hasTier()`
| Tür kimliği | Ad | Sınıf | El | Oyunda var olan kademeler |
|---|---|---|---|---|
| sword | Kılıç | Savaşçı | 1 | k1–k8 |
| axe1 | Balta | Savaşçı | 1 | k1–k8 |
| sword2 | Çift El Kılıç | Savaşçı | 2 | k1–k8 |
| axe2 | Çift El Balta | Savaşçı | 2 | k1–k8 |
| spear | Mızrak | Savaşçı | 2 | k1–k8 |
| lance | Uzun Mızrak (tırpan biçimli model `scythe`) | Savaşçı | 2 | k1–k8 |
| mace2 | Çift El Topuz | Savaşçı | 2 | k1–k8 |
| dagger | Hançer | Suikastçı | 1 | k1–k8 |
| **jamadar** | Jamadar | Suikastçı | 1 | **k2–k8** (k1 yok: `from: 1`) |
| bow | Yay | Suikastçı | 2 | k1–k8 |
| **xbow** | Arbalet | Suikastçı | 2 | **k5–k8** (k1–k4 yok: `from: 4`) |
| mace | Topuz | Şifacı | 1 | k1–k8 |
| staff | Asa | Büyücü | 2 | k1–k8 |
| shield | Kalkan (sol el) | Savaşçı + Şifacı | 1 | k1–k8 |

Toplam var olan silah kademesi: 12×8 + 7 + 4 = **107**.

**Simge kovası (neden k1/k4/k8):** Mevcut kod her silah türünde 3 görünüş kullanır: k1–k3, k4–k6, k7–k8 ✔ `ITEM_ICONS['w:<tür>']` dizileri. Yeni raster simgelerde kural (ENTEGRASYON KARARI): *eşyanın kademesine eşit ya da altındaki en yakın teslim edilmiş simge kullanılır.*

**Üretim listesi: 41 silah simgesi**
- 12 tür × k1, k4, k8 = 36
- jamadar: k2, k4, k8 = 3
- xbow: k5, k8 = 2

### 1.3 Takılar ✔ `JEWELS`, `JEWEL_NAMES`, `MAGE_JEWEL_LINES`
- Temel 4 tür: `ear` (Küpe, 2 yuva), `neck` (Kolye), `ring` (Yüzük, 2 yuva), `belt` (Kemer). Hepsi k1–k8.
- Büyücü takıları (12 tür: kor/alaz/simsek/firtina × ear/neck/ring) **kendi simgesini kullanmaz**, ear/neck/ring simgesini paylaşır ✔ `icon: slot`.
- Mevcut kovalar: k1–k4 ve k5–k8 ✔ `ITEM_ICONS['j:*']`.
- **Üretim: 8 simge** (4 tür × k1, k5). En az 4 (yalnız k1) de çalışır.

### 1.4 Eşsiz, özel ve 3B modelli eşyalar
- `UNIQUES`: 149 kayıt (89 silah/takı + 60 eşsiz zırh parçası: chitin, fplate, crimson, crystal, linen, wool setleri) ✔. `SPECIAL`: 139 kayıt (birebir değerli eşyalar, mevcut tabanların üzerine yazılır; ayrı simge gerektirmez) ✔.
- 14 eşyanın hazır 3B model görseli var: `img/items3d/<ad>.png`; **bunlara dokunulmaz** ✔ `ITEM_GLB`, `itemIcon()`.
- Eşsizlerin simgesi istenirse ad kalıbı `esya-u-<anahtar>.png` (ENTEGRASYON KARARI); yoksa tür simgesine düşer. **Paket 2 kapsamında değil.**
- Başlangıç paketi silahları (asa, hancer, kalkan, tirpan): mevcut `img/silah/<ad>-<insan|ork>.webp` ✔ `js/ui-odeme.js` `wpnImg()`. Değiştirilecekse aynı ad.

### 1.5 Sarf malzemesi ve malzemeler ✔
| Öğe | Kod | Şu anki simge |
|---|---|---|
| Can İksiri / Mana İksiri | `shared/battle.js` `POT_IDS` (`hp`, `mp`) | `js/iksir.js` `potSvg()` (SVG) |
| Kaba / İnce / Usta Bileği Taşı | `shared/items.js` `STONES` | `UI_ICONS.stone0/1/2` |
| Örs Tozu | | `img/kd/simge3/simge-ors-tozu-<halk>.png` + `UI_ICONS.toz` |
| Ödül Sandığı | `shared/sandik.js` | `img/kd/simge3/simge-odul-sandigi-<halk>.png` |
| Uğur Muskası (`charm`), Tav Közü (`ember`) | `upOdds()` | `UI_ICONS.charm`; Tav Közü simgesi **DOĞRULANMADI** |

**Üretim: 7 simge** → `esya-iksir-can.png`, `esya-iksir-mana.png`, `esya-tas-kaba.png`, `esya-tas-ince.png`, `esya-tas-usta.png`, `esya-ors-tozu.png`, `esya-sandik.png` (halktan bağımsız, `ortak`).

---

## 2. Zırh envanteri ✔ `shared/content.js` `CLASSES[*].armor`, `shared/items.js` `ARMOR_TYPES`, `ARMOR_NAMES`, `ARMOR_SLOTS`
| Zırh tipi | Ad | Sınıf (tek eşleşme) | Savunma katsayısı |
|---|---|---|---|
| plate | Levha | Savaşçı (`warrior`) | 1.0 |
| leather | Deri | Suikastçı (`rogue`) | 0.75 |
| chain | Zincir | Şifacı (`priest`) | 0.85 |
| robe | Kumaş | Büyücü (`mage`) | 0.6 |

- 5 yuva: `helm` Baş, `chest` Gövde, `legs` Bacak, `gloves` El, `boots` Ayak.
- Her sınıfın 8 kademede adlı seti var (k1 Leather / Rogue / Fabric / Mage … k8 Legendary king's / Cool-headed king's / Wise king's / Intelligent king's). Toplam 4 × 5 × 8 = 160 parça.
- Kimlik sınıfla kurulur (`a:warrior:3:helm`); tip, sınıftan türetilir. Sınıf ↔ tip birebir olduğu için simge dosyasında tip adı kullanılabilir.
- Mevcut kovalar: k1–k4 ve k5–k8 ✔ `ITEM_ICONS['a:<sınıf>:<yuva>']`.

**40 simge gerekli mi?** Tam gerekli olan: **20** (4 tip × 5 yuva, tek görünüş). **40 önerilir** (k1 ve k8; k1, k1–k4 için, k8, k5–k8 için kullanılır), çünkü kod zaten iki görünüş ayırıyor ve 8 kademelik ilerleme tek simgeyle okunmaz.
Ad kalıbı: `esya-<yuva>-<tip>-k<1|8>.png` → örnek `esya-chest-plate-k8.png`.

---

## 3. Görsel ölçüleri ve dosya biçimleri
Ölçek: tasarım yüksekliği 1080 birim; kod `--s = min(ekran yüksekliği / 1080, 1)` ✔ `js/orient.js:65`. 846×412 telefonda ≈ 0,38.

| Grafik | Kaynak ölçü (px) | Biçim | Durumlar / not | Durum |
|---|---|---|---|---|
| Eşya simgesi (silah, zırh, takı, sarf) | 256×256 | PNG RGBA | çerçevesiz, ≥16 px iç boşluk, nadirlik yuvadan gelir | ENTEGRASYON KARARI |
| Eşya yuvası | 256×256 | PNG RGBA | `siradan/nadir/efsanevi/bos` × `normal/secili` × halk | ✔ mevcut dosyalar |
| Büyük / orta / küçük panel | 1024×640 / 640×480 / 384×384 | PNG RGBA | 9 dilim; kodda dilim payı 48 (orta) ve 64 (büyük) | ✔ `css/v21-kul-demir.css` `--u-pb`, `--u-po` |
| Başlık şeridi | 1024×128 | PNG RGBA | tek | ✔ |
| Birincil / ikincil / tehlike düğme | 480×160 | PNG RGBA | `normal`, `basili`, `pasif`; yatay %50 + dikey 64 dilim | ✔ `--u-b1n/p/x`, `--u-b2n` |
| Yuvarlak / kapat / geri | 192×192 | PNG RGBA | `normal`, `basili` | ✔ |
| Yatay / dikey sekme | 360×120 / 280×120 | PNG RGBA | `normal`, `secili` | ✔ |
| Can / mana / XP / ilerleme çubuğu | 768×96 | PNG RGBA | `bos`, `dolgu`; dilim 48 | ✔ `--u-barb`, `--u-barx` |
| Kaynak sayacı | 512×128 | PNG RGBA | akce, yakut, enerji; dilim 64 | ✔ `--u-say` |
| Rozet (bildirim, kilit, sayı, seviye, yıldız 1–3) | 192×192 | PNG RGBA | tek | ✔ |
| Ayraç | 1024×48 | PNG RGBA | tek | ✔ |
| Onay kutusu / anahtar | 192×96 | PNG RGBA | `acik`, `kapali` | ✔ |
| Toast | 1024×256 | PNG RGBA | dilim 96 | ✔ `--u-toast` |
| Sistem simgesi (alt şerit, menü) | mevcut `img/kd/simge3/` dosyalarının ölçüsü | PNG RGBA | halk soneki | ✔ ad listesi §6.3 |
| Kahraman portresi (küçük) | 384×384 (ekranda 192×192) | WebP/JPEG | anahtar `<sınıf>.<halk>` | ✔ çizim ölçüsü `js/portraits.js` `draw()`; 2× kaynak = ENTEGRASYON KARARI |
| Kahraman portresi (tam boy) | 600×800 (ekranda 300×400) | WebP/JPEG | anahtar `<sınıf>.<halk>` | aynı |
| Kahraman illüstrasyonu (Kadro) | 720×960 (ekranda 360×480) | WebP/JPEG | anahtar `art.<sınıf>.<halk>` | aynı |
| Yaratık portresi | 384×384 | WebP/JPEG | anahtar = yaratık kimliği | aynı. Zorunlu değil: portreler 3B modelden otomatik çizilir |
| Ekran arka planı (opak) | 2340×1080 | JPEG/WebP | | rehber; DOĞRULANMADI (kodda tek ölçü yok) |
| VFX karesi | 256×256 | PNG RGBA şerit | §4 | ENTEGRASYON KARARI |

Ortak kurallar: dış alan alfa 0, panel iç yüzeyi alfa 255; dosya ≤ 8 MB; ad küçük harf, ASCII, tire. Yasak biçimler: SVG, AVIF, BMP, TGA, TIFF, PSD, GLB.

---

## 4. VFX envanteri

**Gerçek durum ✔:** Oyunda **hiç kare dizisi (sprite) efekti yok**. Bütün efektler three.js ile kodla çizilir (parçacık, iz, halka, ışık): ✔ `js/fx.js` (çizen), `js/fx-table.js` (tablo), `js/combat.js` (oynatan). Bu yüzden kodda kare sayısı, sütun, FPS gibi değerler **yok**. Aşağıdaki liste kodda tanımlı efekt adlarıdır. Kare değerleri ENTEGRASYON KARARIdır: Claude bu sözleşmeyle bir şerit yükleyicisi yazacak.

### 4.1 Şerit sözleşmesi (ENTEGRASYON KARARI)
- Dosya: `vfx-<ad>.png`, PNG RGBA, tek satır. Kare 256×256; sütun = kare sayısı; satır = 1 (16 karede 2 satır × 8 sütun kabul).
- Varsayılan: 12 kare, 24 FPS. Döngü: `tek` (bir kez oynar, söner) ya da `dongu` (durum sürdükçe tekrar). MANIFEST'e kare, sütun, satır, FPS, döngü yazılır.
- Efekt kameraya bakan düzlem olarak 3B sahneye konur; renk ışığı (`light`) kodda kalır.
- Gfx `low/min` ve azaltılmış hareket kipinde kapanır ✔ (mevcut davranış korunur).

### 4.2 Olay efektleri ✔ `fx-table.js` `EVENT_FX` → `FX_NAMES` (28 ad)
| Ad | Olay | Önerilen döngü |
|---|---|---|
| hit, critHit, weakHit, shieldHit, guardHit | isabet, kritik, zayıflık, kalkan ve himaye emilimi | tek |
| dissolve | ölüm | tek |
| heal, revive, cleanse, regenTick | şifa, diriliş, arınma, yenilenme tiki | tek |
| status, resist, strip, wardOff, detonate | durum uygulandı, direndi, sökme, sakınma, patlatma | tek |
| burnTick, poisonTick, bleedTick | yanık, zehir, kanama tiki | tek |
| tempo, skipTurn, enrage, phase | sıra değişimi, sıra kaybı, öfke, boss evresi | tek |
| cast, turnMark | yetenek hazırlığı, sıra işareti | tek / dongu |
| waveIn, bossEntrance, victory, defeat | dalga girişi, boss girişi, zafer, yenilgi | tek |

### 4.3 Element efektleri ✔ `ELEMENT_FX`
| Element | cast | mermi | çarpma | iz |
|---|---|---|---|---|
| phys (Çelik) | – | – | spark | – |
| arcane (Efsun) | orb | orb | burst | – |
| fire (Ateş) | flare | fireball | blast | embers |
| ice (Buz) | frost | shard | shatter | frost |
| bolt (Yıldırım) | charge | zap | arc | static |
Şerit adları: `vfx-cast-<ad>`, `vfx-mermi-<ad>` (dongu), `vfx-carpma-<ad>` (tek), `vfx-iz-<ad>` (dongu, kısa).

### 4.4 Silah savurma izleri ✔ `WEAPON_FX`, `SPARK_FX`
İzler: slash (kılıç), stab (hançer, ikili), cleave (balta), crush (topuz, çift el topuz), arcane (asa), reap (uzun mızrak), yay için ok mermisi (`arrow`). Kıvılcımlar: slash, pierce, chunk, crush, arcane. → `vfx-iz-<ad>`, `vfx-kivilcim-<ad>` (tek).

### 4.5 Durum işaretleri ✔ `STATUS_FX`, `MARKS` (13 işaret)
up, down, dome, ring, reticle, wisp, flame, drip, orbit, crystal, mote, glint, gust. Uygulanınca tek; `hold` olanlar (dome, flame, drip, orbit, crystal, mote) durum sürdükçe dongu. → `vfx-durum-<ad>`.

### 4.6 Yetenek alan efektleri ✔ `ANIM_FX`
Alanlar: ring (dönen halka), blast (patlama), quake (yer sarsıntısı). → `vfx-alan-<ad>` (tek).

### 4.7 Örs ✔ `ANVIL_FX`
Çekiç kıvılcımı (5 vuruş, 400 ms arayla) ve 5 sonuç: ok (star, 1100 ms), fail (puff, 700 ms), drop (fall, 900 ms), break (shards + 7 çatlak, 1200 ms), safe (ward, 1000 ms). Süreler koddadır; kare sayısı FPS × süreye uydurulmalı (ör. 1100 ms @ 24 FPS ≈ 26 kare → 2×16 şerit ya da FPS düşür). Örs paneli 2B'dir (açık parşömen zemin); şeritler HTML üstünde oynar.

### 4.8 Silah ve zırh parıltısı ✔ `weaponGlow()`, `armorGlow()`
+7…+10 parıltı, nadirlik rengi, +10'da halk rengi (`ocak` #ff3a1e, `sancak` #3aa6ff). Modelin ışıması olduğu için **şerit istenmez**, kodda kalır.

**Öncelik önerisi (Paket 4 için):** 4.3 çarpma + mermi (9 şerit), 4.5 hold işaretleri (6), critHit, dissolve, heal, bossEntrance. Kalan efektler kodla çizilmeye devam eder.

---

## 5. Arayüz işlevleri (konumsuz)
Konumlar tasarım serbestliğindedir. Aşağıdakiler korunacak işlevlerdir. "✔" satırları bu turda kodda yeniden görüldü; diğerleri 20.11 kod çıkarımıdır (`EKRANLAR.md`), bu turda satır satır yeniden doğrulanmadı.

### 5.1 Ortak düğme durumları ✔
- Düğme görseli: `normal`, `basili` (dokunurken), `pasif` (`disabled`) ✔ `--u-b1n/p/x`.
- Seçim: `secili` (CSS `.sel`, `.on`) ✔ `combat.js` `.skill.sel`, `#bapot.on`.
- Yuva durumu: dolu, `bos`, kilitli (`rozet-kilit`, "Sv. X") ✔ `.skill.lock`, `.skill.empty`.
- Yazılar, sayılar, geri sayımlar HTML'dir; görsele gömülmez.

### 5.2 Savaş HUD ✔ `js/combat.js` `drawBar()`, `renderButtons()`
- Yetenek çubuğu: **temel saldırı + 5 etkin yetenek + Can iksiri + Mana iksiri** (8 düğme).
- Yetenek düğmesinin durumları: kullanılabilir, seçili (`sel`), kapalı (`disabled`), bekleme sayısı (`em`), mana yetmez ("MP", `.dry`), mana bedeli (`.mpc`), kilitli yuva (kilit + "Sv. X" + ad), boş yuva ("Boş yuva").
- İksir düğmesi: kalan adet (`.pn`), bekleme, "bu savaşta yok".
- Kontroller: Otomatik (`#bauto`, aç/kapa), Oto İksir (`#bapot`, aç/kapa, yalnız Otomatik kullanılabilirken), hız (`#bspeed`: 1x/2x/3x), Savaştan çekil (`#bexit`).
- Kendi kartı: portre, ad, seviye, can ve mana çubuğu, iksirler. Hedef kartı: portre, ad, can çubuğu, boss işareti.
- Bilgi kartları: açılış kartı (dalga sayısı, başlık), boss kartı (unvan, ad, seviye, zayıflık, evre sayısı), zafer/yenilgi kartı, ortadan geçen şerit (banner), ekran parlaması.
- Yetenek simgeleri: 204 adet, SVG ✔ `js/skill-icons.js` `SKILL_ICONS` (game-icons.net, CC BY). Raster yetenek simgesi Paket 4'te istenirse ad: `yetenek-<kimlik>.png` (ENTEGRASYON KARARI).

### 5.3 Çanta ✔ `js/ui-envanter.js`
- Kapasite **120** ✔ `shared/content.js` `BAG_LIMIT`. Filtreler ✔ `BAG_F`: Hepsi, Silah, Zırh, Takı, Boşta, Kuşanılı (her birinin simge anahtarı: bag, atk, armor, jewel, list, party). İksir ayrı filtre DEĞİL. Eylemler: Sat, Parçala (toplu seçim).
- Eşya ayrıntısı `js/ui-esya.js`: Kuşan, Güçlendir, Sat, Parçala, karşılaştırma (yeşil ↑ / kırmızı ↓). Artı seviyesi (+0…+10) metin olarak.

### 5.4 Karakter oluşturma ✔ `js/ui-olustur.js`
Irk (İnsan/Elentha, Ork/Kragmir), 4 sınıf, Cinsiyet (Erkek/Kadın), Yüz, Saç, Saç rengi, Göz rengi, Ten rengi, Sakal, Beden (`body`), Boy (`height`, adımlı), Rastgele, Varsayılan, ad kutusu, ad zarı, Oluştur. Canlı 3B önizleme korunur. Sınıf ve ırk simgeleri şu an SVG ✔ `js/karakter-simge.js` `IC`.

### 5.5 Mağaza / Kervan ✔ `js/ui-odeme.js`
Sekmeler: Yakut ile, Gerçek para, Ücretsiz. Ürün kartı: simge, ad, açıklama, fiyat, günlük sınır. Karaborsa: 9 raf (5 Nadir eşya, 2 eşsiz, 2 malzeme), 8 saatte bir yenilenir, %5–25 indirim ✔ `shared/karaborsa.js` `KARABORSA`.

### 5.6 Karakter / ekipman
13 yuva ✔ `SLOTS`: wr Sağ El, wl Sol El, helm, chest, legs, gloves, boots, ear1, ear2, neck, ring1, ring2, belt. Çift el silah sol eli de kaplar ✔ `hands: 2`.

### 5.7 Diğer ekranlar
`EKRANLAR.md` §1–§11'deki işlev listesi geçerlidir; içindeki konum sözcükleri ("sol üst", "alt şerit" vb.) artık bağlayıcı değildir.

---

## 6. Grafik entegrasyonu

### 6.1 Yükleyiciler ✔
| Grafik | Yükleyen bileşen | Yol |
|---|---|---|
| UI kiti (panel, düğme, sekme, çubuk, yuva…) | CSS değişkenleri `--u-*`, `html[data-faction="ocak|sancak"]` altında | ✔ `css/v21-kul-demir.css`, `css/v25-cila.css` → `img/kd/ui/<halk>/` |
| GPT 4.x görselleri | `css/v26-gpt4.css` (data: URI gömülü, OTOMATİK) | ✔ `_tasarim/araclar/v26-gom.py` |
| Sistem simgeleri | CSS | `img/kd/simge3/simge-<ad>-<halk>.png`, `img/kd/simge/` |
| Kaynak simgeleri (kırpılmış) | CSS | `img/kd/ui/ortak/simge-<akce|enerji|san|yakut>-kirp.png` |
| Eşya simgeleri | `js/item-icons.js` `itemIcon()` (şu an satır içi SVG; 3B modelliler `img/items3d/*.png`) | yeni: `img/kd/esya/` (ENTEGRASYON KARARI) |
| İksir simgesi | `js/iksir.js` `potSvg()` | SVG |
| Portreler | `js/portraits.js` `portraitAttrs()`; elle çizim `img/portraits.json` ile ✔ | `{ "warrior.ocak": "img/…webp", "art.mage.sancak": "…" }` |
| Başlangıç silahları | `js/ui-odeme.js` `wpnImg()` | `img/silah/<ad>-<insan|ork>.webp` |
| Şehir sahneleri | `js/hub2d.js` | `img/kd/sehir/<yer>/` (bina üretimi yok) |
| VFX | `js/fx.js` (kodla) | şerit yükleyici yok (ENTEGRASYON KARARI) |

### 6.2 Adlandırma
- Küçük harf, ASCII, tire. Halk soneki `-ocak` (Kragmir) / `-sancak` (Elentha); halktan bağımsızsa sonek yok ya da `ortak` klasörü.
- Durum sonekleri: `-normal -basili -pasif -secili -acik -kapali -bos -dolgu`.
- Nadirlik: `siradan` (Standart #b9c0c8), `nadir` (Nadir #4aa3ff), `efsanevi` (Eşsiz #ffb52e), `bos` ✔ `GRADES`.
- Eşya: §1 ve §2 kalıpları. Tür kimlikleri İngilizce kod kimliğidir (sword, axe1…).
- Mevcut dosyayla aynı ad = doğrudan değiştirme (en az iş).

### 6.3 Mevcut dosya sayıları ✔ (`img/`)
ui/ocak 55 · ui/sancak 55 · ui/ortak 4 · simge 14 · simge3 54 · merkez 8 · sehir 6 · items3d 13 · silah 8 · icons 4. Tam ad ve ölçü listesi: `VARLIK_ENVANTERI.md` (hâlâ güncel).

### 6.4 Teknik sınırlar ✔
- **Yayın, bir sürümde en fazla 511 dosya alıyor; oyun şu an sınırda.** Yeni grafikler ayrı dosya olarak eklenemez. Claude onları WebP'ye çevirip CSS'e gömer ya da birleştirir. GPT yine **ayrı dosya** teslim eder; birleştirme Claude'un işi.
- Tek metin dosyası ≤ 16 MB (gömülü CSS paket başına bölünür).
- Ekranda küçülme: 256 px yuva ≈ 97 CSS px, 64 birim ≈ 24 px (846×412 telefonda). İnce süs kaybolur.
- Dik telefonda gövde 90° döner ✔ `js/orient.js`; grafikler yalnız yatay tasarlanır.

### 6.5 Paket 2 üretim listesi özeti
| Grup | Adet |
|---|---|
| Silah simgeleri (§1.2) | 41 |
| Zırh simgeleri (§2) | 40 (en az 20) |
| Takı simgeleri (§1.3) | 8 (en az 4) |
| Sarf/malzeme (§1.5) | 7 |
| **Toplam** | **96** |
Çanta ve Kervan için ek UI parçası gerekiyorsa UI kiti ad kalıbını kullanır.

---

## 7. Paket doğrulaması
Her GPT teslim paketinin kökünde şu 4 dosya ZORUNLU:
1. `00_ONCE_OKU.md`: paketin kapsamı, yetki sırası.
2. `MANIFEST.md`: her dosya için ad, ölçü, RGBA, durum, kullanılacağı ekran, dilim payı (üst/sağ/alt/sol), VFX kare/sütun/satır/FPS/döngü. Yapılmayan iş "EKSİK" diye yazılır.
3. `PARCA_INDEKSI.md`: ZIP parçalarının listesi (ad, bayt, sha256). Tek parçaysa yine yazılır.
4. `DOSYA_ENVANTERI_SHA256.json`: `{ "yol/dosya.png": "<sha256>", … }`; paketteki her dosya.

Claude girişte denetler: 4 dosya var mı, sha256 tutuyor mu, biçim (yalnız PNG/JPEG/WebP), alfa (boş alan > %85 → bozuk), ölçü, iki halk eşliği.
Bu belge de aynı yapıda teslim edilmiştir (bu klasör).
