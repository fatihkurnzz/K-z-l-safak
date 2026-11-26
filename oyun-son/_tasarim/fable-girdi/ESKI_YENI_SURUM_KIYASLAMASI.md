# Eski / yeni sürüm karşılaştırması: sürüm 41 → sürüm 42

| | Sürüm 41 | Sürüm 42 |
|---|---|---|
| Kimlik | `KORANT-v40-1dda167+P33` | `KORANT-v42-b9a0b21` |
| Komit | `1e17c80` | oyun dosyaları `d5320b5` = `b9a0b21` (ikincisi yalnız belge/araç) |
| Yayın | claude.ai artefakt sürüm 41 (447 dosya) | aynı artefakt sürüm 42 (`1795692689-1953`, 450 dosya) |
| Oyun dosyası farkı | — | 19 dosya: 16 değişti, 3 yeni (`git diff --stat 1e17c80 b9a0b21 -- oyun-son ':!oyun-son/_tasarim'` → 152 ekleme, 24 silme satır + 1 görsel) |
| `shared/` (mekanik/ekonomi/denge) | — | DEĞİŞMEDİ |
| Onaylı sahneler / iç mekânlar | 29 + 13 | 29 + 13; yalnız `zafer_aniti.webp` yüksek çözünürlüklü (24 KB → 88 KB, 512×217 → 2048×868) |
| Ses dosyaları | 4 müzik + 131 sentez | aynı (P34-11 teslim edilmedi) |

## Görünür davranış farkları
| Alan | Sürüm 41 | Sürüm 42 |
|---|---|---|
| Başkent / Yemin Pazarı / Klan Obası | Fotoğraf + P33 zerreleri, gün evresi tonu | + sancak, şelale, lav, duman, tente, meşale alevi hareket katmanı (ayarla kapanır) |
| NPC diyalog portresi | Durağan (+ P33 "nefes") | + göz kırpma, konuşurken ağız (8 NPC) |
| Bran | 64 px SVG simge | Boyalı G4 portre; kurtarma kartında Bran + Nessa portreleri |
| Zafer Anıtı | Düşük çözünürlüklü arka plan; **veri gelince içerik çizilmiyordu ("Yükleniyor…")** | 2048×868 arka plan; içerik çiziliyor |
| Han / Ahır | **İşlem sonrası pencere yenilenmiyordu** | Yenileniyor |
| Kragmir erkek 5. yüz | 1. yüzün aynası | Özgün yüz |
| Elentha kadın savaşçı büyü pozu | Kalkan diğer kolda | Kalkan doğru kolda |
| Yaratık pozları | 13 kayıtlı türde saldırı/vurulmada bekleme pozu | 8 türde gerçek saldırı/vurulma; lamia, snake_queen, dragon_lightning değişmedi |
| Boss 2. evre | 19 bossta varyant; 6 ejderde yok | 5 ana boss + Marven + Adsız yeni dönüşüm; 4 ejder çiziminde (6 ejder) yeni evre-2; 12 aile bossu eski |
| Boss özel yetenek uyarısı | +0,35 sn ek bekleme | Ek bekleme yok (uyarı mevcut beklemeyle) |
| 667×375 savaş HUD | 6–10 px yazılar | ≥ 10,7 px etkin (11 px CSS) |
| "+" nitelik düğmesi dokunma alanı | 34×22 | 44×21 |
| Yerel kipte satın alma | Sağlayıcı yok → imkânsız | + açık `LOCAL` koruması |

## Boyut
| Dosya | v41 | v42 |
|---|---|---|
| `js/b2d-y1.js` | 1,99 MB | 2,03 MB |
| `js/b2d-y3.js` | 2,56 MB | 2,74 MB |
| `js/b2d-y4.js` | 2,41 MB | 2,45 MB |
| `js/b2d-yb.js` | 1,62 MB | 2,22 MB |
| `js/gorsel-png.js` | 4,20 MB | 4,36 MB |
| `js/p34-katman-png.js` | — | 0,55 MB (yalnız şehir sahnesi açılınca iner) |
| `js/npc-kare-png.js` | — | 0,03 MB (ilk diyalogda iner) |
Toplam oyun klasörü (tasarım hariç) ≈ 87,7 MB.
