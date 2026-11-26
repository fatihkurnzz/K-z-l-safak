# Pilot 2 — Karakter / Envanter ailesi (teknik gereksinimler)

Durum: KAYNAKTAN (`js/ui-kahraman.js`, `js/ui-envanter.js`, `js/ui-party.js`, `js/ui-yetenek.js`, `shared/items.js`, `shared/hero.js`) + ÖLÇÜLDÜ + ÇEKİLDİ.

## 1. Kapsamdaki ekranlar
| Ekran | Giriş | Kaynak | Görüntü |
|---|---|---|---|
| Karakter (kahraman + özellikler + envanter) | `ACT.karakter` / `ACT.party` | `ui-kahraman.js kxView` | `C-karakter` |
| Karakter · Yetenek (savaş düzeni, ağaçlar, uzmanlık yolu) | `ACT.party({tab:'skill'})` / `hotbar` | `ui-party.js`, `ui-yetenek.js` | `C-hotbar` |
| Karakter · Ustalık | `party({tab:'mst'})` | `ui-party.js` | `C-hotbar~mst` |
| Karakter · Unvan | `party({tab:'unvan'})` | `ui-kalicilik.js` | `C-hotbar~unvan` |
| Çanta (ayrı pencere) | `ACT.bag` | `ui-envanter.js` | `C-bag` |
| Eşya bilgi kartı (modal `kxcard`) | `ACT.kxPick` | `ui-kahraman.js cardFor` / `itemCard` | pilot ek: `karakter-esya-karti` (ÇEKİLEMEDİ, bkz. EKSIK) |
| Büyük Örs / Parçala-Sat | `ACT.anvil`, `ACT.breakWin` | `ui-town.js` | `C-anvil`, pilot ek `parcala` |

## 2. Gerçek işlev
- **Karakter üç bölüm yan yana:** (1) *Kahraman*: başlık (`kx-head`: portre, "Sv.X Ad", halk · sınıf · uzmanlık yolu), iki yanda **13 ekipman yuvası** — sol sütun `SL`: Baş, Gövde, Bacak, El, Ayak, Kemer; sağ sütun `SR`: Sağ El, Sol El, Kolye, Küpe×2, Yüzük×2 (`SLOTS`) — ortada **2B tam boy** çizim (`kx-2b`, `sprUrl`; Sv.45+ Savaşçı yüksek kademe `t3`; `dd_b2d='0'` eski 3B + döndürme) ve "Eşya Sv."; altta sınıf ve ağaç şeridi. (2) *Özellikler* (`kx-stats`): Savaş Gücü, Temel Özellikler (Can, Mana, Saldırı, Büyü, Alev/Yıldırım hasarı, Savunma, Kritik…), Nitelikler (STR/VIT/DEX/INT/MP, her biri `+` ile puan), dağıtılabilir puan, **Sıfırla** (onaylı). (3) *Envanter* (`kx-bag`): süzgeç sekmeleri **Hepsi / Silah / Zırh / Takı / Boşta**, eşya ızgarası (`kx-grid`, `invGrid`), çanta `n / 120` (`BAG_LIMIT`), akçe, **Toplu** (Örs'e: toplu sat/parçala).
- **Yuva davranışı:** yuvaya dokun → ızgara o yuvaya uyan eşyalara süzülür (`kxSlot`); dolu yuvada seçili eşya kartı. **Eşya kartı** (modal): Kuşan / Çıkar / Güçlendir (→ Örs) / Sat · fiyat / Parçala · toz; kıyas satırı (`cmpWith`), set ve alt-nitelik bölümleri, nadirlik rengi (Standart/Nadir/Eşsiz).
- **Çanta penceresi:** `ivbag` = sol bilgi kartı (`ivside`) + sağ ızgara (`ivmain`) + süzgeç (`BAG_F`) + doluluk; bilgi kartı eylemleri `bagGo` (Karakter/Örs/Pazar), `bagOne` (sat/parçala onayı).
- Yetenek: 1 temel + 5 aktif yuva, ağaç ve uzmanlık yolu; Ustalık 60. seviyede açılır; Unvan: başarım kademelerinden gelen kalıcı bonus + seçili unvan.

## 3. Mevcut yerleşim (ÖLÇÜLDÜ) ve kusurlar
- Karakter penceresi **neredeyse tam ekran**: 880'de 867×396 (kenar 7/5), 667'de 657×365, 1180'de 1162×760 — "menüleri tam ekran yapma / dünya görünsün" kuralıyla çelişir.
- **Dokunma hedefi:** en küçük 22 px (880'de 11, 667'de 15, 1180'de 0 öğe < 44 px — ÖLÇÜLDÜ, nedeni araştırılmadı) — yuvalar ve `+` düğmeleri; 667×375'te yazı ölçeği 6–9,8 px'e inebiliyor (açık sorun).
- Test hesabında yuvalar boş görünüyor (kuşanma çekimde yapılmadı); **kuşanılı eşya ekranı çekilmedi** (EKSIK).
- İkon dili karışık (yuva ikonları boyalı, nitelik satırları game-icons dolgulu); 2B tam boy kuşanılan eşyayı GÖSTERMEZ (bilinen sınır — tasarım bunu çözmeyi vaat etmemeli; yalnız yuvalarla desteklemeli).

## 4. İstenen (GPT çıktısı)
1. Karakterin ve ekipmanının ÖN PLANDA olduğu özel yerleşim (hero merkezli); pencere ekranı kaplamamalı, dünya görünsün.
2. 13 yuva için tek bileşen (boş / dolu / seçili / kilitli(yok sayılabilir) / uygun-değil / nadirlik çerçevesi: Standart `#b9c0c8`, Nadir `#4aa3ff`, Eşsiz `#ffb52e`).
3. Eşya bilgi kartı + kıyas bileşeni, hızlı işlem düğmeleri (Kuşan/Çıkar/Güçlendir/Sat/Parçala) — durumlu.
4. Envanter ızgarası: kategori süzgeci, doluluk, "Çanta dolu" uyarısı durumu.
5. Nitelik satırı + `+` düğmesi, puan göstergesi, sıfırla onayı.
6. Sekmeler (Karakter/Yetenek/Ustalık/Unvan) SOLDA kalır.
7. Çanta ve Karakter envanteri aynı bileşen ailesinden (şu an iki ayrı yerleşim var).

## 5. Veri bağları
Yuva adları `SLOTS`; eşya adı/nitelikleri `itemName/itemBase`; nadirlik `GRADES`; `BAG_LIMIT=120`; nitelik adları `STATS`; sınıf adları `CLASSES` (oyunda Şifacı/Şaman); halk `FACTIONS`. Eşya ikonları `js/esya-png-veri.js` (96) + `esya2-*` (zırh 280, takı 209, silah 213 gömülü) — katalog `03_VARLIKLAR/KATALOG`. Metin ve sayı görsele gömülmez.

## 6. Entegrasyon şartları
- Korunacak `data-a`: `kxSlot, kxPick, kxF, kxEquip, kxUnequip, kxUp, kxSell, kxRot(3B), sp, statReset, breakWin, bagF, bagPick, bagGo, bagOne`; sınıf ön ekleri `kx-`, `iv`.
- Eşya kuşanma/satma/parçalama mantığı, `doAct` çağrıları ve ödül hesapları DEĞİŞMEZ.
- Test (Opus): iki halk × 4 sınıf × 667/880/1180; yuva süzgeci; çanta dolu; kuşanılı/boş; 2B kahraman yüklenmeden (ilk karede boş) durum.
