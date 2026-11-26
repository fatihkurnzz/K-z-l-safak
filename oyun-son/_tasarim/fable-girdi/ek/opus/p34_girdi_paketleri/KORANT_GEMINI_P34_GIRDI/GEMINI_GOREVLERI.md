# Gemini · P34 görev talimatı (KORANT_GEMINI_P34_GIRDI)

Önce `ORTAK_KURALLAR.md` ve `KORUNACAK_VARLIKLAR.md` oku. GPT ayrı pakette paralel çalışıyor (zafer anıtı, sahne hareket katmanları, Kragmir 5. yüz, Bran/Nessa portreleri, kontroller); onun işlerine dokunma, tekrar üretme. Yetenek çizimi ve savaş mekaniği bu pakette YOK. Mini Dizi videosu YOK.

## Görev listesi (kullanıcı onaylı)
| Kod | İstek | Tür | Öncelik | Teslim klasörü |
|---|---|---|---|---|
| P34-05 | NPC göz kırpma / konuşma kareleri (8 G4 portresi) | görsel kare | Zorunlu | `P34-05/` |
| P34-06 | Eksik pozlu 11 yaratığın saldırı + vurulma pozları (13 kayıt, 2'si kullanılmıyor) | görsel | Zorunlu | `P34-06/` |
| P34-07 | Boss 2. evre özgün dönüşüm çizimleri | görsel | Zorunlu (A, B) / isteğe bağlı (C) | `P34-07/` |
| P34-11 | Özgün müzik, ortam sesleri, NPC seslendirmesi | ses | Müzik-1 + ortam: zorunlu; NPC sesi A: zorunlu; diğerleri isteğe bağlı | `P34-11/` |
| KABUL-2 | İkinci görsel kabul denetimi | rapor | Zorunlu | `KABUL-2/` |

---
## P34-05 · NPC göz kırpma / konuşma kareleri
**Kapsam (8 NPC; G4 portreleri, `05…/` klasöründe tam boy 528×704 + yüz 192×192):**
| Dosya | NPC | Rol / halk |
|---|---|---|
| `halvor` | Tüccar Halvor | Yemin Pazarı silah tüccarı (ortak) |
| `maelis` | Maelis | Yemin Pazarı iksircisi (ortak) |
| `corin` | Corin | Elentha orman izcisi |
| `thrak` | Thrak | Kragmir orman izcisi (yeşil tenli ork) |
| `edran` | Kral Edran | Elentha kralı |
| `volgar` | Kral Volgar Demirdiş | Kragmir kralı (yeşil tenli ork) |
| `yashka` | Şaman Yashka | Yemin Pazarı şamanı, Nöbet/Anıt geçidi |
| `lira` | Lira (takı tüccarı; hikâyede Prenses Lira) | Yemin Pazarı |
Bran ve Nessa portreleri GPT'de (P34-09); onların kareleri bu turda YOK.

**İstenen kareler (her NPC için):**
1. `<ad>_goz-yari.png` — göz kapağı yarı inik
2. `<ad>_goz-kapali.png` — göz tam kapalı (doğal göz kırpma, uyku değil)
3. `<ad>_agiz-acik.png` — konuşurken ağız açık (orta ünlü, "a/e" gibi; diş/dil abartısız)
4. (isteğe bağlı) `<ad>_agiz-yari.png` — ağız yarı açık
- Kare 0 (bekleme) = mevcut portre, DEĞİŞMEZ (zaten bende var; üretme).
- Her kare **528×704, PNG, gerçek alfa**, mevcut portreyle **aynı kanvas, aynı konum, aynı ışık**. Değişen YALNIZ gözler/ağız; yüz dışı her piksel (saç, giyim, arka plan alfası, kontur) orijinalle BİREBİR aynı kalmalı. Bunu garanti edemezsen alternatif: yalnız değişen bölgeyi kırpım olarak ver + `kare_yerlesim.json` ile (x,y,w,h, 528×704 tuvalinde) → ben orijinalin üstüne bindiririm. İkisinden birini seç, manifest'te belirt.
- Kimlik: aynı kişi, aynı yaş/ifade genel çizgisi. Yeni aksesuar, saç değişimi, ışık değişimi yok. Ork yüzlerde (Thrak, Volgar) yeşil ten korunur.
- Oyundaki kullanım: kare dizisi bekleme → göz-yarı → göz-kapalı → göz-yarı → bekleme (kırpma, 3–6 sn'de bir); konuşurken bekleme ↔ ağız-açık (↔ ağız-yarı). Süre/mantık bende.

## P34-06 · Eksik pozlu yaratıklar: saldırı + vurulma
**Durum:** 11 tür SAVAŞTA kullanılıyor ama yalnız **bekleme** pozu + portresi var (saldırı/vurulma anında bekleme çizimi gösterilir). Her tür için `saldiri` ve `vurulma` pozu istenir. Ayrıntılı kimlik/ölçü tablosu `02_P34-06_YARATIK_POZLARI/yaratik_kayit.json` (+ `.md`).
| Çizim kimliği (dosya adı) | Oyun kimliği → TR ad | Bölge | Ölçek | Tür |
|---|---|---|---|---|
| `rabbit` | rabbit → Tavşan (Koru/öğretici) | 1 | 0,40 | dört ayaklı |
| `falcon` | falcon → Doğan | 3 | 0,90 | kuş |
| `gargoyle` | gargoyle → Gargoyl | 3 | 0,99 | taş kanatlı |
| `hornet` | hornet → Eşek Arısı | 3 | 0,80 | böcek |
| `leader_of_barbarian` | leader_of_barbarian → Barbar Önderi | 3 | 1,30 | insansı |
| `lamia` | lamia → Lamia | 4 | 1,045 | yılan gövdeli |
| `snake_queen` | snake_queen → Yılan Kraliçe | 4 | 1,30 | yılan |
| `dragon_fire` | Kızıl Ejder Yavrusu (hatchling, ölçek 1,2) ve Kızıl Ejder (2,05) | 3 / 4 | — | ejder |
| `dragon_ice` | Mavi Ejder (1,8) ve Kemik Ejder (renk çarpanlı, 1,7) | 4 | — | ejder |
| `dragon_shadow` | Kara Ejder (1,9) | 4 | — | ejder |
| `dragon_lightning` | Altın Ejder (1,95; renk çarpanlı) | 4 | — | ejder |
**HARİÇ (üretme):** `dragon_earth`, `dragon_poison` — paketlerde bekleme çizimi var ama hiçbir yaratık bunları kullanmıyor (13 kayıttan 2'si).
- Referans: her tür için mevcut **bekleme** (384×384 oyuna gömülü hâli; 1024 kaynak yok) ve portre (128). Aynı aileden TAM SETLİ bir örnek (`azman-kurt`: bekleme/saldiri/vurulma) poz dili için konmuştur; ayrıca Tepegöz tam seti.
- **Aynı yaratık, aynı renk/ayrıntı/oran**, yalnız poz değişir. Ayrı renk çarpanı (`ffd8c8` gibi) oyunda koddan uygulanır; çizimi tek bırak.
- **Poz yönü:** yaratık SOLA bakar (baş sol yarıda; oyuncu solda). `saldiri` = tam vuruş anı, saldırı hamlesi sola doğru uzanır/atılır (ısırık, pençe, kuyruk, soluk, kanat çarpması vb.; türe uygun). `vurulma` = darbe yemiş, geri çekilmiş/büzülmüş/sendelemiş, gözler kısık; kan/uzuv kopması YOK (oyun içeriği abartısız şiddetlidir).
- **Kanvas ve yerleşim:** **1024×1024 PNG, gerçek alfa**, zemin çizgisi (ayak/gövde altı) **alttan 48 px** üstünde; yaratık bekleme pozuyla aynı ölçekte (sınır kutusu yüksekliği ±%8). Uçan türlerde (doğan, arı, gargoyle, ejderler) gövde bekleme pozundaki yükseklikte kalır. Zemin gölgesi çizme.
- Dosya adı: `<cizim-kimligi>__saldiri.png`, `<cizim-kimligi>__vurulma.png` (çift alt çizgi). Toplam: 11 tür × 2 = **22 görsel**.

## P34-07 · Boss 2. evre özgün dönüşümler
**Durum:** savaşta boss canı yarıya inince (ya da evre/öfke) 2. evre çizimi (`bekleme2`, `saldiri2`, `vurulma2`) devreye girer. Mevcut 2. evre çizimleri GPT teslim notuna göre "özgün dönüşüm değil" (evre 1'in varyantı). Evre 1 DEĞİŞMEZ. Mekanik/evre mantığı değişmez (`shared` metinleri yalnız ipucu).
Her boss için `bekleme2`, `saldiri2`, `vurulma2` (3 poz) istenir. **Bir bossun 2. evresi = aynı varlığın KENDİNE ÖZGÜ, hikâyeye uygun, tanınır dönüşümü** (ör. yarılan kabuk, kor zırh, açılan kanatlar); yeni karakter değil. Evre 1 ile siluet/renk/aksesuarla ayırt edilmeli, ama aynı yaratık olduğu anlaşılmalı.
| Katman | Boss (çizim kimliği → TR ad) | Evre-2 hikâye ipucu (oyundaki metin) | Kanvas |
|---|---|---|---|
| **A · zorunlu** | `dev-solucan` → Dev Solucan | "topraktan bir kez daha fırlıyor!" | 1536×1536 |
| A | `tepegoz` → Tepegöz | (metin yok; yarı canda öfkeli/yaralı dönüşüm, tek gözlü kimlik korunur) | 1536×1536 |
| A | `kristal-muhafizi` → Kristal Muhafızı | (metin yok; kristal ayrıntı) | 1536×1536 |
| A | `lav-yurek` → Lav Yürek | "kaynıyor: kristal titriyor!" → "kabuğu çatladı, ateş taşıyor!" (2. evre = son hâl: çatlak kabuk, taşan ateş) | 1536×1536 |
| A | `kul-agasi-karadun` → Kül Ağası Karadun | "külünü savuruyor" → "Kor zırhı kızıla kesti!" (2. evre = kor zırh kızıl) | 1536×1536 |
| **B · zorunlu** | `maresal-marven` → Mareşal Marven | "kılıcını çekiyor: 'Tarih hayatta kalanların!'" | 1536×1536 |
| B | `adsiz` → Adsız, Tarikat Lideri | "kollarını açıyor; kül yağmaya başlıyor" → "Korlar sönmek üzere: son gücünü topluyor" (2. evre = son güç) | 1536×1536 |
| **C · zorunlu** | `dragon_fire`, `dragon_ice`, `dragon_shadow`, `dragon_lightning` → ejderler (Kızıl/Kızıl Yavru, Mavi/Kemik, Kara, Altın) | "<Ejder> kanatlarını açıyor!" (şu an hiç 2. evre çizimi YOK; kanatlar tam açık, daha tehditkâr duruş) | 1024×1024 (bekleme ile aynı) |
| **D · isteğe bağlı** | Aile bossları: `kurtadam`, `agac-hayaleti-krali`, `dev-golem`, `kertenkele-yuzbasi`, `harpi-kralicesi`, `mantikor`, `megantereon`, `sentor-yuzbasi`, `trol-krali`, `mana-avcisi`, `olum-sovalyesi`, `lic` | metin yok / genel "öfke" | 1536×1536 (bekleme2 mevcut örneğine bak) |
- Referanslar: her boss için mevcut evre 1 (bekleme/saldiri/vurulma) + mevcut "evre 2" (bekleme2/saldiri2/vurulma2) + portre; kayıt `03_P34-07_BOSS_EVRE2/boss_kayit.json` (oyun adı, bölge, zayıflık, oyun içi evre metinleri, mevcut dosya adları ve oyuna gömülü ölçüleri).
- Kural: **yönü, zemin çizgisini, ölçeği, renk paletini evre 1 ile eşle** (zemin çizgisi alttan 48/1024 ≈ 72/1536; sola bakar; zemin gölgesi yok). Oyunda 448×448 gösterilir (1536 kaynak).
- Dosya adı: `<boss>__bekleme2.png`, `__saldiri2.png`, `__vurulma2.png`. Toplam: A 15 + B 6 + C 12 = **33 zorunlu**, D 36 isteğe bağlı.
- Şiddet kuralı: abartısız; kan/uzuv/ceset detayı yok.

## P34-11 · Ses (müzik, ortam, NPC seslendirmesi)
Ayrıntılı sistem, anahtar eşlemesi, teknik biçim, ses karakterleri ve replik listesi: **`04_P34-11_SES/SES_SISTEMI.md`** + `ses_haritasi.json` + `npc_ses_listesi.json`. Özet:
- **Müzik** (mevcut 4 parça korunur; EK parçalar): zorunlu = normal savaş müziği (`mus.battle`; şu an sentez); isteğe bağlı = Elentha ve Kragmir ayrı başkent teması (şu an iki halk da aynı `mus.tema`), zafer ve yenilgi motifleri.
- **Ortam döngüleri** (zorunlu 17 + isteğe bağlı 4): `amb.*` anahtarları için kesintisiz döngü kayıtları.
- **NPC seslendirmesi:** 15 rol, 105 replik; A katmanı (45 selamlama) zorunlu, B katmanı (60 başarı/başarısızlık) isteğe bağlı. Türkçe, rol karakterine uygun, telifsiz/özgün.

## KABUL-2 · İkinci görsel kabul denetimi
Ayrıntı: **`05_IKINCI_GORSEL_KABUL/IKINCI_KABUL.md`**. Özet: zaten teslim edilmiş `KORANT_GEMINI_KABUL2` (8 parça) + `KORANT_GEMINI_KABUL2_EK` (5 parça) paketlerindeki ekranlar bu görevin girdisidir; **tekrar gönderilmedi**. Rapor biçimi birinci raporunla aynı (`gemini_gorsel_kabul_raporu.json` örneği pakette).

## Teslim
`KORANT_GEMINI_P34_TESLIM.zip` (30 MB'ı aşarsa `…_01of0N.zip`; görsel, ses ve rapor ayrı ZIP'ler de olabilir): görev klasörleri yukarıdaki adlarla + kökte `teslim_manifest.json`:
```json
{ "uzman": "Gemini", "surum": "KORANT-v40-1dda167+P33", "paket": "P34",
  "kalemler": [ { "kod": "P34-06", "durum": "uretildi|atlandi|uretilemedi",
     "dosyalar": [ { "yol": "P34-06/rabbit__saldiri.png", "olcu": [1024, 1024], "sha256": "…", "alfa": true } ],
     "kendi_kontrolum": "…", "varsayimlar": "…", "gerekce": "…" } ],
  "ses": [ { "kimlik": "mus.battle", "yol": "P34-11/muzik/…", "arac": "…", "lisans": "…", "sure_sn": 0, "lufs": 0 } ] }
```
