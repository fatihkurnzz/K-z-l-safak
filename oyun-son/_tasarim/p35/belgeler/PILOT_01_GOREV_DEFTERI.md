# Pilot 1 — Görev Defteri ailesi (teknik gereksinimler)

Durum: KAYNAKTAN (`js/ui-anagorev.js`, `js/ui-hub.js`, `shared/anagorev.js`, `shared/daily.js`, `js/ui-kalicilik.js`) + ÖLÇÜLDÜ (OLCUMLER.md) + ÇEKİLDİ (aşağıdaki kimlikler).
**Bağlayıcı yaklaşım referansı:** `Elenthia_Gorev_Arayuzu_Ortalandi.png` (dosya adında ırk yanlış yazılmış; Elentha). Referanstaki görev adları/sayıları gerçek veri değildir.

## 1. Kapsamdaki ekranlar
| Ekran | Kimlik / giriş | Kaynak | Görüntü |
|---|---|---|---|
| Görevler · Ana Görevler | `ACT.quests({tab:'main'})` | `ui-anagorev.js` | `C-mnMain`/`C-quests` (P35-S… `EKRAN_ENVANTERI`) + `05_PILOT/gorev-ana` |
| Görevler · Günlük / Haftalık / Aylık | `ACT.quests({tab:'daily'|'weekly'|'monthly'})` | `ui-anagorev.js` çerçeve; sayfa `ui-kalicilik.js` | `C-mnMain~daily/weekly/monthly` |
| Görev Defteri (özet) | `ACT.questLog` | `ui-hub.js:367 questLogHtml` | `C-questLog` |
| HUD görev izleyici (ana ekranda, sohbet üstünde) | `questBox()` | `ui-hub.js:337` | `B01-hub-baskent` (sol-alt) |
| Dock rozeti (hazır ödül sayısı) | `mqReady` | `ui-hub.js:42` | `B01` |
| Takvim (7/28 gün) — aynı `scr=gorev` kabuğu | `ACT.calendar` | `ui-kalicilik.js:174` | `C-calendar`, `C-calendar~m28` |
| Vahran Destanı listesi | `ACT.destan` | `ui-destan.js` | `C-destan` (tasarım dili ortak; ayrı pilot DEĞİL, aynı parşömen/anlatı dili beklenir) |

## 2. Gerçek işlev (değişmeyecek)
- **Ana Görevler:** 64 düğüm, 16 bölüm × 4 (`MQ`, `MQ_CHAPTERS`); düğüm: `id, ch, pos(a|b|c|d), ad, acik, need, v(p) (canlı ilerleme), reward[], go (ACT adı), pre[]`. Durumlar `mqState`: `done / locked / open / ready`. Eylemler: `mqSel` (seç), `mqGo` (Git → ilgili ekranı aç), `mqClaim` (Ödülü al → `mq.claim`), `mqTrack` (HUD'dan). Ödül Bağlı (`nt:1`), idempotans sunucu/yerel otoritede.
- **Günlük/Haftalık/Aylık:** `QUESTS` (6), `WEEKLY` (7), `MONTHLY` (6) + sandık (bonus) ödülü; yenilenme: günlük 00:00, haftalık Pazartesi 00:00, aylık ayın 1'i. Sekme rozeti = hazır ödül sayısı (`counts()`); günlük sekmeye +1 (giriş hediyesi alınmadıysa).
- **Görev Defteri:** `ql-sec` bölümleri: Ana görev (1 satır, `mqNext`), Günlük, Haftalık, Aylık; satır `ql-row` (`done`/`rdy` sınıfı) + ilerleme çubuğu; satıra dokunma sekmeyi açar (`qlOpen` / `mqTrack`).
- **HUD izleyici:** `qtrk` (`open` sınıfı), başlık `Görevler` (`questLog`), `qt-top` = "Ana görev" + `qt-row` (`mqTrack`, `rdy` ise "Al", değilse `cur/need`) + aç/kapa `qt-tog` (kapalıyken hazır sayısı rozeti; durum `localStorage dd_qtrk`). Açıkken günlük görevler `qt-grid`'de.

## 3. Mevcut yerleşim (ÖLÇÜLDÜ, 880×406) ve kusurlar (kanıtlı)
- Çerçeve 845×382 (sol 18/üst 12). Sol sekme çubuğu 4 düğme (min dokunma 34×46 px). Sağ: bant (`qx-band`), ilerleme (`mq-prog`), **yatay kaydırmalı ağaç** (`mq-tree` içinde `mq-in` 3626 px) + sağ **ayrıntı kartı** (`mq-det`).
- Düğüm `mq-n` 100×46, sütun 226 px, bölüm başlığı `mq-chh`, SVG eğri çizgiler (`mq-lines`); seçili düğüm ortalanır. **Kusurlar:** 880'de tek bakışta 3–4 bölüm görünür; tamamlanan/kilitli ayrımı rozet ve ikonla; "Ödülü al" ayrıntı kartında gizli (düğümde yalnız küçük "Al" rozeti).
- Görev Defteri satırları 31 px yüksek (**dokunma < 44**: 880'de 6, 667'de 4, 1180'de 13 öğe 44 altı) ve düz metin; parşömen/anlatı hissi yok.
- 667×375: çerçeve 640×351; ağaç ve ayrıntı kartı daralıyor (ölçüm tablosu).
- 1180×820: çerçeve 1121×760; içerik ölçeklenmiyor, geniş boşluk (kaydırma sayıları OLCUMLER.md).

## 4. İstenen (GPT çıktısı)
1. Görevler penceresi için **işlevine özel** yerleşim (parşömen/anlatı dili; kitaplık/görev defteri hissi) — ağaç yerine ya da ağaca ek olarak sefer-yolu görünümü; **karar-bağımsız** (bkz. `D02_D08_PILOT_ETKISI.md`).
2. Günlük/Haftalık/Aylık için ortak "dönem görevi" bileşeni (satır: ad, ilerleme çubuğu, ödül çipi, durum; sandık/bonus alanı).
3. Görev Defteri özet ekranı ve HUD izleyici için küçük (kompakt) varyant.
4. **Durum seti** (her biri iki halkta): normal · seçili · kilitli · pasif · hazır (ödül alınabilir) · tamamlandı/alındı · hatalı (alınamadı).
5. İki halk eşit kalitede (Elentha lacivert/altın/parşömen; Kragmir bordo/bronz/parşömen).

## 5. Veri bağları (görsele GÖMÜLMEZ)
`ad`, `acik`, `need`, `v(p)` ilerlemesi, `reward[]` (akçe/yakut/enerji/şan/taş g0-g2…) ve satır sayıları `07_VERI/anagorev.json`, `content.json › QUESTS`, `meta.json › WEEKLY/MONTHLY`'dan; çipler `lootChip`. Görsel yalnız çerçeve/zemin/ikon/rozet/çubuk dokusu olabilir. Referans görseldeki isim/sayı örnektir.

## 6. Entegrasyon şartları (Opus için)
- Korunacak DOM kancaları: `data-a` değerleri `tab, mqSel, mqGo, mqClaim, mqTrack, qlOpen, questLog, qboxToggle`; sınıf ön ekleri `qx-`, `mq-`, `ql-`, `qt-` (yeniden adlandırılırsa dinleyiciler ve CSS birlikte taşınır).
- Pencere kabuğu (`#win .frame > header / .wbody > nav.tabs + #page`) kullanılır; sekmeler SOLDA kalır (kullanıcı kararı).
- Boyutlar: çerçeve `--lw/--lh` ölçekli; 44 px dokunma, 11 px yazı tabanı (kullanıcı kararı).
- Oyun verisi/ekonomi/ödül mantığına DOKUNULMAZ; yalnız sunum.
- Test (Opus): iki halk × 667/880/1180; ödül alma çift tıklama; boş/dolu/kilitli durumlar; `dd_qtrk` açık/kapalı.
