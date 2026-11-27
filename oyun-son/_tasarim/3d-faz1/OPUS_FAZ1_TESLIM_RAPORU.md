# Korant · 3B Savaş Faz 1 · Opus Teslim Raporu (27.11)

**Durum:** V42 içinde mevcut Paladin ve Goblin modelleriyle **oynanabilir gerçek 3B savaş** kuruldu. Meshy kredisi harcanmadı. 3B **varsayılan kapalı**; açmak için adrese `?b3d=1` ekleyin (Grafik: Orta/Yüksek). Kapsam: Elentha Savaşçı × Bölge 1 Blok 3 goblin savaşları (aşama 1-11…1-15).

## Yapılanlar
| Sorumluluk | Teslim | Durum |
|---|---|---|
| Three.js savaş altyapısı | `js/savas3d/` 5 izole modül + 3 küçük kanca yaması | çalışıyor (oyun içinde denendi) |
| Gerçek 3D birimler | `Birim3D` (combat arayüzünün tamamı); Paladin + 7 goblin türü | çalışıyor |
| İskelet + 11 animasyon | 11 ortak klip her iki modelde 53/53 iz eşleşiyor; yerinde tutma; kemik adı eşleme altyapısı (Meshy için) | çalışıyor |
| Silah/kalkan + bağlantı noktaları | `silah3d.js` 7 kod silahı (137–208 üçgen), `sok_sag`/`sok_sol` soketleri; Paladin'de kılıç+kalkan 11 klipte elde | çalışıyor (görsel denetim) |
| RAID sinematik kamera | `kamera3d.js` (saldırı, 2/3 vuruşlu yetenek, boss alt açı) | çalışıyor (16 karelik kanıt) |
| Meshy/Mixamo işleme araçları | `arac/donustur.py` (başsız Blender), `arac/butce.mjs` | **yazıldı, çalıştırılmadı** |
| Kalite kademeleri, 2D geri dönüş | Düşük/En Düşük, WebGL yok, kayıt yok, model inmedi → 2B | kısmen test edildi |
| Sonuç regresyonu | `arac/test/esitlik.js` | **GEÇTİ** (1-11) |

## Test kanıtları (`kanit/`)
| Test | Sonuç |
|---|---|
| Sonuç eşitliği 2B ↔ 3B, aşama 1-11, tohum 4237670770 | **GEÇTİ**: 22 hamle, bütün olaylar, son durum ve kazanan birebir aynı (`kanit/test/esitlik_2B.json`, `esitlik_3B.json`) |
| 3B açık, 1-11 | 4/4 birim `Birim3D`, JS hatası 0 (`kanit/ekran/02`) |
| Geri dönüş `?b3d=0` | GEÇTİ → 2B |
| Geri dönüş Grafik: Düşük | GEÇTİ → 2B ("grafik kademesi low") |
| Geri dönüş 3B kaydı olmayan savaş (1-1 bandikut) | GEÇTİ → 2B |
| Geri dönüş model indirilemedi | **TEST HATASI**: engel service worker'dan geçti; betik düzeltildi, yeniden koşulmadı |
| Kragmir, WebGL kaybı, bellek sızıntısı (3 savaş), boss 1-15 | **YAPILMADI** (kullanıcı test onayı olmadan durduruldu) |
| combat.js ve shared/ git farkı | 0 (taban c0aa487) |
| Gerçek telefon FPS (kabul 7) | **YAPILMADI** — kullanıcıda |

## Pilot kabul ölçütleri (OPUS_NIHAI_DENETIM §10) karşısında
1–2 Meshy/Gemini: kapsam dışı (kredisiz aşama) · 3 bütçe: paladin 14,7k ✓, goblin 13,3k (yaratık bütçesi 8k'nın üstünde — mevcut varlık, Faz 2'de azaltma) · 4 11 klip: ✓ (kopma görülmedi; ayak kayması ayrıca ölçülmedi) · 5 silah elde: ✓ görsel · 6 zırh içe geçme: yalnız küçük ölçekli 11 klip ızgarasında bakıldı, belirgin yırtılma görülmedi, ayrıntılı denetim Gemini'de · 7 FPS: yapılmadı · 8 gerçek savaş baştan sona: ✓ · 9 HUD: ölçülmedi (HUD koduna dokunulmadı) · 10 sonuç eşitliği: ✓ · 11 geri dönüş: kısmen ✓ · 12 bellek: kod hazır (dispose: malzeme, iskelet, silah geometrisi), ölçülmedi.

## Bilinen eksikler / Faz 2
- Çizim çağrısı 104 (hedef ≤60): silahları tek ağa birleştir, gölgeyi yalnız kahramanda tut.
- Eski Mixamo dokuları 512² ve düşük kalite; asıl görsel sıçrama Meshy pilotuyla gelecek.
- Silah +artı parıltısı, zırh ışıması, klan pelerini 3B birimde yok (2B/prosedürel sistemde var).
- Kragmir, diğer 3 sınıf, dört ayaklılar, bosslar: kayıt yok → 2B.
- Ayarlar ekranına düğme konmadı (`b3dAyarla` hazır; arayüz başka sorumluluk alanında).

## Sonraki adım (onay gerekir)
1. Kalan testler: indirme hatası, Kragmir, WebGL kaybı, bellek, boss 1-15 eşitliği.
2. Kullanıcı: telefonda `?b3d=1&gfx=mid` ile 1-11 savaşı, `DD_GFX.stats()` FPS.
3. Meshy pilot GLB gelince: `donustur.py` → `butce.mjs` → manifest kaydı → vitrin → eşitlik testi.
