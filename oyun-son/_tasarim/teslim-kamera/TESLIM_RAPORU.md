# Dinamik sinematik savaş kamerası + boyalı savaş arka planları — teslim raporu (22.11)

**Motor/sürüm:** Tarayıcı, vanilla ES modülleri + three.js r160 (gömülü). Kamera: PerspectiveCamera. Dikey görüş açısı yatay 42°'den hesaplanır ve en az 42° tutulur (engine3d resize). Ton eşleme ACES. Orta/Yüksek grafikte bloom açık.

**Aktif dosyalar:** `js/combat.js` (savaş sahnesi, olay oynatıcı), `js/engine3d.js` (camRig: konum, bakış, sarsıntı, itiş), `js/world.js` ve `js/models.js` (ortam kurulumu), `shared/battle.js` (motor, DOKUNULMADI).

**Korunanlar:** savaş motoru, tur/dalga, hasar, yetenekler, iksir, OTO, hız 1x/2x/3x, PvP hız kilidi, HUD (v31/v30), sohbetin savaşta kapalı olması, hedefleme (`pick`, hitbox), öğretici kilidi, kayıt/ağ akışı. Daha önceki işler (yandan 3/4 FORM dizilişi, boss sağ arkada, portreler, savaş HUD'u) aynen duruyor.

## Değişen dosyalar
| Dosya | Neden |
|---|---|
| `js/savas-kamera.js` (yeni) | Durum makinesi: ESTABLISH, IDLE, FOCUS_ATTACK, FOCUS_SKILL, FOCUS_BOSS, RECOMPOSE, RECOVER. Kadraj birimlerin sınırlarından hesaplanır (ayak, baş ve can çubuğu payı, genişlik). Hesapta FOV, ekran oranı ve DOM'dan ölçülen HUD güvenli alanı kullanılır (üst kartlar; altta solda yetenek çubuğu, sağda düğmeler). Geçişler kritik sönümlü yayla yapılır ve her yeni istek bir öncekini keser, sıçrama olmaz. Hesap yalnız olaylarda yapılır, her karede sahne taranmaz. |
| `js/savas-arka.js` (yeni) | 10 resim ve ortam eşlemesi (`BY_KIND`, savaşın tohumuyla seçilir). Resim taban kameradan zemine ve kavisli perdeye yansıtılır (projeksiyon). Işıklar resme göre ayarlı (`LIGHT`), gölge düzlemi var, ACES tersi ile resim kendi renginde görünür. |
| `js/savas-arka-png.js` (yeni, OTOMATİK) | Resimler gömülü (yayın 511 dosya sınırı). Üretici: `_tasarim/araclar/savas-arka-gom.py`. |
| `js/models.js` | `buildEnv` içinde `foto:` kipi: savaşta yalnız ışıklar ve resim kurulur. Gök kubbe, çimen, ağaç, kaya ve meydan taşı (eski arka plan) savaşta çizilmez. Ana üs ve diğer sahneler değişmedi. |
| `js/combat.js` | Sabit `CAM` ve `moveCam` kaldırıldı. Kamera olaylara bağlandı: açılış, normal saldırı, özel yetenek, boss girişi, dalga, ölüm ve dirilme. Konum hesabı `spot()` işlevine ayrıldı; konumlar aynı. Özel yetenekteki yakın çekim artık animasyonu beklemiyor ve kesmiyor (eskiden kamera yaklaşıp kesip dönüyordu). |

## Kamera değerleri
- Taban yönü `VIEW = { yaw: 0.30, pitch: 0.20 }` rad. Kamera parti tarafına döndürülür: parti önde solda, düşman orta planda sağda (hedef görsel). Uzaklık sınırları 9,5–40; kamera y ≥ 0,6.
- Süreler (oyun saatiyle, 2x/3x'te kısalır): açılış 1,6 sn; saldırı odağı 0,38; yetenek 0,6 (usta 0,85); boss 1,0; yeniden kadraj 0,8; dönüş 0,55. Hepsi paketteki aralıklarda.
- Açılış tabandan en çok %12 uzaktan başlar (`max_initial_zoom_fraction`). Odakta yakınlaşma sınırı: saldırı %10, yetenek %18, usta yetenek %24. Kamera tabandan daha uzağa gitmez.
- Varsayılan sarsıntı eklenmedi. Var olan meteor sarsıntısı ve kritik itiş aynen duruyor.

## Testler (Playwright, Chromium, 880×406 = 2340×1080'in mantıksal ölçüsü)
| Test | Sonuç |
|---|---|
| Tek düşman (karlı, 1v1): ikisi de tam görünür | geçti |
| Çok düşman (2v3, 5v5): hepsi kadrajda, can çubukları HUD altında değil | geçti (5v5'te parti üst üste biniyor, bu FORM dizilişinden geliyor) |
| Boss (Tepegöz + 2): boss ve parti görünür; eskiden başı üst HUD'un altında kalıyordu | geçti |
| Yakın dövüş: kamera zemine girmiyor (y ≥ 0,6), perde yarıçapı ≥ 21 | geçti |
| Özel yetenek: odak animasyonla birlikte, animasyon kesilmiyor | geçti (ekran görüntüsü) |
| Hedefe dokunma: gerçek fare tıklaması düşmanın ekrandaki noktasına; motorun aldığı hamle `["w_basic",2]`, `["w_basic",3]` = dokunulan düşmanlar, ikinci dokunuş kamera dönerken yapıldı | geçti |
| Dalga ve ölümde yeniden kadraj (RECOMPOSE) | geçti (Dalga 1/3 → 2/3, gerçek Hızlı Av akışı) |
| Tur/dalga, hasar, yetenek şeridi regresyonu (gerçek akış: Savaş → Hızlı Av → Başla, OTO) | geçti. Savaş sonu ekranı GÖRÜLMEDİ: başsız tarayıcı ~5 fps, savaş 80 sn'de bitmedi |
| Tablet 1024×768: resim ekranı kaplar, kadro sığar | geçti |
| Sayfa hatası / konsol hatası | 0 |
| Performans (aynı senaryo, başsız yazılım çizimi): eski 2,8 fps / 69 MB JS yığını → yeni 4,8 fps / 54 MB | ölçüldü (gerçek cihaz değil) |
| Android 2340×1080 gerçek cihaz, iki yatay yön, çentik | TEST EDİLMEDİ (cihaz yok) |
| Sohbet: savaşta zaten kapalı (kullanıcı kararı), dokunulmadı | değişmedi |

## Açık eksikler
- Gerçek telefonda FPS, ısınma ve dokunma denenmedi.
- Resim paketi yaklaşık 4 MB. Oyun açıldıktan 8 sn sonra boşta indiriliyor. Daha önce savaşa girilirse arka plan ~0,35 sn'de soluklaşarak gelir (o sırada düz renk görünür).
- Resimlerin ufku kameranınkinden biraz daha yüksekte. Taban kadrajda resim birebir görünür, yakın odakta zemin hafif kayar (projeksiyonun doğası gereği).
- Boss modelleri küçük (ör. Tepegöz). Boyutları değiştirilmedi.

## Geri alma
`git revert` ile bu iki commit geri alınır: "Savaş: boyalı arka planlar…" ve "Savaş arka planları tek JS paketine…". Yalnız kamerayı geri almak için combat.js'te `KAM.*` çağrıları kaldırılır. Eski arka plan için `ensureEnv(env)` (`'foto:'` olmadan) yazılır.
