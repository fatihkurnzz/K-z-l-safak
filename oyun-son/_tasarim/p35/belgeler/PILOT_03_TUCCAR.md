# Pilot 3 — Tüccar ailesi (teknik gereksinimler)

Durum: KAYNAKTAN (`js/ui-town.js` `SHOPS`, `tuccarPage`, `openShop`; `js/ui-ogretici.js`; `shared/npc.js`) + ÖLÇÜLDÜ + ÇEKİLDİ (silah/zırh/takı dükkânları bu pakette AYRICA çekildi).

## 1. Kapsamdaki ekranlar
| Ekran | Giriş | Görüntü |
|---|---|---|
| Tüccar Halvor (Erzak ve Örs Malzemeleri / Genel satış) | `ACT.tuccar` | `C-tuccar` |
| Pazar / Yemin Pazarı girişi (Tüccar + oyuncu pazarı) | `ACT.pazar`, `ACT.market` | `C-market` |
| Silah ve Kalkan (Silah Ustası Demirhan) | `ACT.npcSilah` | pilot ek `tuccar-silah` |
| Zırh (Zırhçı Korhan) | `ACT.npcZirh` | pilot ek `tuccar-zirh` |
| Takı (Mücevherci Selin) | `ACT.npcTaki` | pilot ek `tuccar-taki` |
| İksir ve Parşömen (İksirci Maelis) | `ACT.iksir` | `C-iksir` |
| Karaborsa | `ACT.karaborsa` | `C-karaborsa` |

## 2. Gerçek işlev
- Dükkân tanımı `SHOPS` (`halvor/silah/zirh/taki`): başlık, NPC adı, yüz, **sekmeler** — Halvor: *Erzak ve Örs Malzemeleri*, *Genel satış*; Silah: *Silahlar*, *Kalkanlar*, *Tüccara sat*; Zırh: *Zırhlar* (+ sınıf süzgeci Hepsi/4 sınıf), *Tüccara sat*; Takı: *Takılar* (oyuncu ilanları, `market.list`; Sv.`UNLOCK.market` altında kilitli not), *Tüccara sat*. Her NPC'nin tezgâh sözü (`say`, `sellSay`); işlem sonrası söz (`tezgahSoz`).
- **Alım:** raf günlük değişir (`merchantShelves`); her üründen günde `NPC_DAILY`; hepsi Standart nadirlikte; kart: simge kuyusu, ad/nitelik, **stok**, **fiyat**, `Al` (`tcBuy` → `npc.buy`); yetersiz akçe/stok → pasif. Erzak: iksir paketleri (`tcPot`), Örs malzemesi.
- **Satış:** `shopSellable` (kuşanılmamış, dükkânın ilgi alanına göre); çoklu seçim (`tcPick`), "Standartları seç/Nadirleri seç/Temizle", **"Sıradanları sat"** (`tcPlain`), toplam akçe, `tcSell`.
- Tutorial'da ilk alım Halvor'dan (`tutorialBuy`); iki halkta aynı "Tüccar Halvor" kimliği (ayrı Kragmir tüccarı YOK; P35 değerlendirmesi bu konuda ayrı karar bekliyor — pilot tasarım NPC adını/yüzünü veriden alır).

## 3. Mevcut yerleşim ve kusurlar (ÖLÇÜLDÜ)
- Çerçeve 845×382 (880), kart 2'li ızgara (`dk-grid`, `dk-card`: sol simge kuyusu, sağ ad/nitelik/fiyat + Al). Üstte NPC başlığı (`pz-head k-card2`: yüz + söz) + sekme çubuğu yer kaplıyor → 880×406 görüntülerinde (`tuccar-silah`, `tuccar-taki`) tek kart sırası + bir sonraki sıranın yarısı görünüyor.
- Silah/zırh/takı dükkânlarında NPC yüzleri küçük (`npc-yuz`). Renk dili halka göre değişiyor (Elentha lacivert/mavi, Kragmir bordo/kırmızı) — iki halkın görüntülerini yan yana karşılaştırarak ışık/kontrast/ayrıntı EŞİTLİĞİNİ ölçün.
- Stok/fiyat/Al düğmesi küçük; en küçük dokunma 34–38 px (< 44), 667'de takı sayfasında 1 öğe kesik (ÖLÇÜLDÜ: `tuccar-taki` 667×375 `kesik=1`).
- Üç ayrı dükkân + Halvor ayrı yerleşim değil; "Kompakt, hızlı, anlaşılır" hedefi için tek bileşen ailesi gerekli.

## 4. İstenen (GPT çıktısı)
1. Kompakt dükkân yerleşimi: NPC başlığı küçültülmüş şerit; sık işlem (Al / Sat) hızlı; liste yoğun ama okunur.
2. Ürün kartı durumları: normal · seçili · pasif (stok yok / akçe yetmez / kilitli seviye) · satın alındı (başarılı) · hatalı.
3. Satış modu: çoklu seçim çubuğu, toplam, hızlı toplu seçim düğmeleri.
4. Dükkân ailesi için iki halkta eşit çerçeve/başlık/düğme seti (NPC yüzleri mevcut `p24-ekran`/`gorsel-png` G4 yüzleridir; yeni NPC İCAT ETME).
5. Dükkân sekmeleri SOLDA.

## 5. Veri bağları
Ürün adı/nitelik/stok/fiyat canlı (`npc.json`, `merchantShelves`); NPC adları/sözleri `SHOPS`; akçe `S.akce`. Para birimleri mevcut (Akçe, Yakut, Şan, Örs Tozu…) — yeni para birimi İCAT ETME. Görsele fiyat/ad gömülmez.

## 6. Entegrasyon şartları
- Korunacak `data-a`: `tcSub, tcCls, tcBuy, tcPot, tcPick, tcPickG, tcSell, tcPlain, tuccarSub, npcSilah/npcZirh/npcTaki`; sınıf ön ekleri `pz-`, `dk-`.
- Satın alma/satış hesapları, günlük stok, fiyat, `npc.*` işleyicileri DEĞİŞMEZ.
- Test (Opus): iki halk × 667/880/1180; stok bitti / akçe yetmez / çanta dolu; satış toplamı; takı sekmesi seviye kilidi.
