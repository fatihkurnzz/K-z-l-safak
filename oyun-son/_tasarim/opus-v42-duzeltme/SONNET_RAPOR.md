# Sonnet raporu (26.11, V42 düzeltme)

Ölçüm: `rt.mjs` (paket aracı, yalnız Playwright yolu uyarlandı), yerel kip, GL yazılım, 880×406 ve 667×375, TR. Simülasyon; gerçek cihaz ölçümü değil.

## F-005 — yazı ≥ 11 px (BİTTİ)
- Son ölçüm (26.11): 880×406 Kragmir 0 küçük metin; Elentha 880 ve iki halk 667 de 0 (başta 57/60).
- 880×406, Kragmir: 57 küçük metin → **12** (hedef 0). 667×375: 60 → 25 (ilk tur; son CSS'ten sonra 667 yeniden ölçülmedi).
- Düzeltilenler: `.wctx`, `.mc-t small`, `.dev`, Karakter `.kx-r`, İksir `.potbuy .btn`, Dünya Bilgisi `.wslot span`, `.p23m-alt`.
- Kalan 12: Karakter, Hotbar ve Parti ekranlarında 4'er `SPAN` (10,5 px). Tek başına açınca yeniden üretemedim (sadece rt.mjs'in tam akışında çıkıyor); kök neden bulunmadı.

## F-006 — 44 px hedefler (KISMEN)
- 880×406: 223 → **99** (hedef ≤ 60). Kapatma düğmeleri (✕), `icmGizle`, `binaKapat`, `stage`, `tcPot`, `qlOpen`, `season`, `rank`, `mzRefresh`, `clanApply` 44 px oldu.
- Dokunmadım (kullanıcı kararı gerekir): ızgara öğeleri (`aeSet`, `aeTog`, `kbBuy`, `marketSub`, `marketKind`, INPUT'lar).

## F-007 — Meydan Sezonu sekmeleri (BİTTİ)
- Geri düğmeli pencerelerde sekme sütunundaki 44 px sol dolgu kaldırıldı. Ekran görüntüsüyle doğrulandı: "Sezon / Ödüller / Geçmiş" tek satır (880×406).

## F-018 — açılamayan 13 eylem gerekçesi
Bunlar ekran değil, **parametre ya da veri isteyen eylem işleyicileri**; `A.<ad>({})` ile pencere açmaz:
- Ödül/işlem eylemi (ekran yok, bildirim verir): `monthlyBonus`, `weeklyBonus`, `gift`, `arenaRefresh` (yeniden çizer), `tp` (yetenek puanı ekler; `d.n` ister), `calInfo` (yalnız toast; `d.k`, `d.i` ister), `spin` (çark eylemi, parametre ister).
- Parametreli açılır: `msgMenu` (`d.name` yoksa sessiz döner), `skill`, `exchange`, `tierInfo`, `emoOpen` (öğe `el` ister).
- `sandikOpen`: `ACT` altında değil, `ui-sandik.js`'te tanımlı ama `A` nesnesine bağlı olmayabilir; `A.sandikOpen is not a function` hatası verdi (yalnız `rt.mjs` bağlamında).
- YAPILMADI: 7 eksik grubun (zindan/boss/PvP savaşları, yenilgi, öğretici adımları, iç mekân, EN, 667/1180) ekran görüntüleri ve K002 112/111 birleştirme.

## F-024 / F-025 (YAPILMADI)
Test ortamı/senaryo yazılmadı; Fable/Opus devri için bkz. `DEVIR_FABLE_OPUS.md`.
