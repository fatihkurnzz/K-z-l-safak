# Mevcut tasarım sistemi (V42) — gerçek durum

Durum: **KAYNAKTAN** (`css/kd-tokens.css`, `css/fonts.css`, `js/orient.js`, `js/ui-core.js`) ve **ÖLÇÜLDÜ** (`05_PILOT/OLCUMLER.md`). Aşağıdakiler "yeni sistem" DEĞİL, bugün olan şeydir; yeni tasarım sistemi bunun üzerine kurulacak/yerine geçecek.

## 1. Yazı karakterleri
Başlık **Cinzel** (700, 900), gövde **Inter** (400, 600, 800); `fonts/*.woff2` (latin + latin-ext), lisans `OFL-*.txt`. Kod: `--kd-f-title`, `--kd-f-body`. Ölçekli tipografi: `--kd-t1..t7` = 11 / 13 / 15 / 18 / 22 / 28 / 36 px. **En küçük okunabilir yazı 11 px** (kullanıcı kararı 26.11; 667×375'te katman ölçeğiyle 6–9,8 px'e düştüğü bilinen açık sorun).

## 2. Tokenlar (`css/kd-tokens.css`, `tokenler.json`: 913 tanım / 419 değişken, hepsi 42 CSS içinde)
- Nötr: `--kd-ink #0e0b10`, `--kd-coal #1a1519`, `--kd-soot #2a2328`, `--kd-bone #e9e1d3`, `--kd-ash #8d8790`, `--kd-ash-light #bfb9be`.
- Durum: `--kd-blood #9e1b1b`, `--kd-hp #b8322c`, `--kd-heal #5fcb7a`, `--kd-heal-ui #5fbf78`, `--kd-mana #3e8ef0`, `--kd-mana-ui #3e7fd6`, `--kd-warn #e0a030`, `--kd-gold #e2b44e`, `--kd-old-gold #c9a45c`, `--kd-focus #f4d78d`.
- Eşya nadirliği (oyun kuralı, değişmez): Standart `#b9c0c8`, Nadir `#4aa3ff`, Eşsiz `#ffb52e`.
- Ölçü: `--kd-hit-min 44px`, `--kd-btn-h 40px`, `--kd-btn-h-sm 32px`, `--kd-close 40px`, `--kd-panel-radius 12px`, `--kd-card-radius 10px`; geçişler `--kd-transition-fast 80ms`, `--kd-transition-panel 220ms`.
- **Irk teması** `html[data-faction="ocak"|"sancak"]` (ocak = Kragmir, sancak = Elentha): `--kd-halk-1..4`, `--kd-faction-1/2`, `--kd-accent`, `--kd-accent-soft`, `--kd-edge`, `--kd-rune`, `--kd-panel-top/bottom`, `--kd-frame`, `--kd-button-top/bottom`, `--kd-glow`.
  - Kragmir: halk `#2b211b #a66a39 #c2552b #d9c9a3`, vurgu `#ff7a1a`, kenar `#8a3b1e`, çerçeve `#a66a39`.
  - Elentha: halk `#1f2c40 #4d8cc9 #c9d3dc #e8ddc5`, vurgu `#4d8cc9`, kenar `#c0a56a`, çerçeve `#b7a16f`.
  - Oyun verisinde halk rengi (`FACTIONS`): Kragmir `#c2321e`, Elentha `#3d6fb6`; sözler: *“Toprak, çekice boyun eğer.”* / *“Çelik bile bir gün paslanır.”*
- Ayrıca `--amb-sancak/--amb-ocak/--logo-korant` (G8, `js/amblem-png.js`), `--gl-<ad>` glif maskeleri (`html.glifli`), `--sc-*` sahne resimleri (`html.sahneli`).

## 3. Ölçek ve ekran (ÖLÇÜLDÜ/KAYNAKTAN)
`js/orient.js`: oyun YALNIZ YATAY çizilir (dik telefonda gövde 90° döner); `--lw`, `--lh` = mantıksal ölçü, `--s = min(lh/1080, 1)`; `html.narrow` < 760 px. Kullanıcının telefonu 2340×1080, dpr 2,66 → **880×406**. Diğer ölçüler: 667×375 (dar telefon), 1180×820 (tablet/masaüstü).

## 4. Pencere kabuğu (`js/ui-core.js` `openWin` / `drawWin`) — bütün pencerelerin ortak iskeleti
```
#win.win.full[data-scr="<ekran kimliği>"]
  .scrim [data-a=closeWin]
  .frame
    header  [‹ geri .x.bk]  amblem(embOf)  h2 başlık  .wres (bağlamsal kaynak şeridi)  [✕ .x]
    .wbody
      nav.tabs   ← sekmeler HEP SOLDA (kullanıcı kararı 22.11)
      section#page.page   ← sayfa (kaydırılır)
```
- `data-scr` ekran kimliği `SCR` tablosundan: Çanta=`canta`, Karakter=`karakter`, Görevler/Görev Defteri/Takvim=`gorev`, Klan Karargâhı=`klan`, Sıralama/Meydan=`siralama`, Başarımlar=`basarim`; dükkânlar `dukkan`; yoksa `genel`. İç mekân sahnesi `ic-mekan.js` pencerenin arkasına bina içini koyar (`icm-var`).
- `.wres` şeridi `CTX` tablosundan bağlamsal: binaya özgü kaynaklar (Örs: Toz, 3 bileği taşı, Muska, Köz; Maden: Cevher; Meydan: Şan; Kader Çarkı: parçalar; Klan: Oba Nişanı/Hazine; Kapı: Mühür) + genel Enerji/Akçe/Yakut + sunucu etiketi.
- Pencere **ekranı kaplamaz**: ölçülen çerçeve 880×406'da **845×382** (kenar boşluğu sol 18, üst 12), 667×375'te **640×351**, 1180×820'de **1121×760**; Karakter/Örs/Parçala/Karaborsa pencereleri farklı genişlikte (bkz. OLCUMLER.md). Büyük ekranda çerçeve ekranı neredeyse tam kaplıyor (1121×760) → "büyük ekranda büyük boşluk/ölçek" bilinen zayıflık.
- Modal: `#modal > .box.<sınıf>` + `.x.mx` kapat; `confirmBox(başlık, metin, evet, etiket)`; toast: `js/ui-duyuru.js` kuyruğu (aynı anda 1 kart, pencere/diyalog/savaşta bekler, 2,6 sn, üst orta ince şerit).

## 5. Mevcut UI kiti (`js/kd-png.js`, 188 parça, 1,43 MB; `03_VARLIKLAR/KD_UI_KITI/`)
Her parça iki halk için (`…-sancak`, `…-ocak`): panel (küçük 384², orta 640×480, büyük 1024×640, başlık şeridi 1024×128), düğme (birincil/ikincil/tehlike × normal/basılı/pasif 480×160; yuvarlak/geri/kapat 192²), sekme (yatay 360×120, dikey 280×120 × normal/seçili), eşya yuvası (boş/sıradan/nadir/efsanevi × normal/seçili 256²), çubuklar (can/mana/xp/ilerleme × boş/dolgu 768×96), kaynak sayacı (akçe/enerji/şan/yakut 512×128), rozetler (bildirim noktası, kilit, seviye, sayı zemini, yeni, yıldız 1-3; 192²), simgeler (128²/256²: karakter, çanta, görevler, klan, posta, takvim, zindan, baskın…), açma/kapama ve onay kutusu, toast (1024×256), modal arkası (1280×800), ayraç, alt sayfa. **Önemli (ÖLÇÜLDÜ):** kitin birkaç parçası (`dugme-savas-*`, `dugme-kervan-*`, `levha-bina-adi`, `kaynak-sayaci-san`, `rozet-yeni-zemini`, `alt-sayfa`, `modal-arkasi`) çok küçük dosya (220–2400 bayt) ama alanın %52–93'ü dolu: yani DÜZ DOLGU / olası YER TUTUCU. Bunlar gerçek boyalı doku değildir; GPT kaynak kabul etmeden önce `03_VARLIKLAR/KD_UI_KITI/INDEKS.json` (bayt/ölçü) ve klasördeki dosyalara bakmalı.
- Eski kit: `js/p24-ekran-png.js` (43 parça: `k_<halk>_btn_*`, `modal_frame`, `tab_*`, `title_banner`, `crown_*`).
- Glifler (Gemini M3): `js/glif-png.js` 40 tek renk glif; halk rengine maskeyle boyanır (`--glc`; Kragmir `#f3d2ae`, Elentha `#cfe0f7`). Pencere sekme/satır simgeleri ise game-icons tabanlı dolgulu SVG (`js/icons.js`) — **iki simge dili karışık** (bilinen tutarsızlık).
- Nadirlik: eşya yuvası `esya-yuvasi-<nadirlik>`; renk `GRADES`.

## 6. Bilinen zayıflıklar (tasarımın çözmesi beklenen — KAYNAK/ÖLÇÜM kanıtlı)
1. İki simge dili (boyalı madalyon / dolgu game-icons / tek renk glif) bir arada.
2. CSS 42 dosya, çok `!important`; kit parçaları ile CSS gradyanları karışık.
3. 667×375'te katman ölçeği yazıyı 6–9,8 px'e düşürüyor (HUD); Karakter ekranında 22 px dokunma hedefi (bkz. OLCUMLER).
4. Görev ağacı 16 sütun × 226 px sabit genişlikte ve yatay kaydırma gerektiriyor (`js/ui-anagorev.js` `CW=226`, `TREE_W = 10 + 16×226 = 3626 px`).
5. Büyük ekranda pencereler ölçeklenmiyor.
6. Taraf Seç'te eski semboller; G8 armaları yalnız logo/başlıkta.
7. Kit parçalarının bir kısmı düz dolgu (bkz. 5).
