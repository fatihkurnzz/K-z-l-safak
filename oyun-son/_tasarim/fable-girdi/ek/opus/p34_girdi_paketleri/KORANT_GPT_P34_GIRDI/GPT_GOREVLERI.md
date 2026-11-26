# GPT · P34 görev talimatı (KORANT_GPT_P34_GIRDI)

Önce `ORTAK_KURALLAR.md` ve `KORUNACAK_VARLIKLAR.md` oku. Gemini ayrı pakette paralel çalışıyor (yaratık, boss, NPC kare, ses, ikinci görsel kabul); onun işlerine dokunma, onun işlerini tekrar üretme.

## Görev listesi (kullanıcı onaylı; P34-10 Mini Dizi videosu YOK)
| Kod | İstek | Tür | Öncelik | Teslim klasörü |
|---|---|---|---|---|
| P34-01 | `zafer_aniti` yüksek çözünürlük | tek görsel | Zorunlu (kullanıcı kararı 26.11) | `P34-01/` |
| P34-02 | Başkent hareket katmanları · Elentha (sancak, şelale, meşale) | saydam katman | Zorunlu | `P34-02/baskent-elentha/` |
| P34-03 | Başkent hareket katmanları · Kragmir (lav, alev, duman, sancak) | saydam katman | Zorunlu | `P34-03/baskent-kragmir/` |
| P34-04 | Yemin Pazarı tente/kumaş + iki Klan Obası sancak katmanları | saydam katman | Zorunlu | `P34-04/carsi/`, `P34-04/klan-elentha/`, `P34-04/klan-kragmir/` |
| P34-08 | Kragmir ERKEK 5. yüz | tek görsel | Zorunlu | `P34-08/` |
| P34-09 | Bran ve Nessa portreleri (G4 biçimi) | 2 portre + 2 yüz | Zorunlu | `P34-09/` |
| K-1 | Beş karakter setinde "beyaz zemin" kontrolü | kontrol (+gerekirse düzelt) | Doğrulama | `K-1/` |
| K-2 | Elentha kadın savaşçı büyü pozu kontrolü | kontrol (+gerekirse düzelt) | Doğrulama | `K-2/` |

---
## P34-01 · `zafer_aniti` yüksek çözünürlük
- Girdi: `01_P34-01_ZAFER_ANITI/zafer_aniti_ORIJINAL_512x217.webp` (mevcut, 512×217). Kullanım: `js/ic-mekan.js MEKAN.zafer` (yol `sahneler/zafer_aniti.webp`, oran `512/217`); Zafer Anıtı penceresi Han/Ahır ile aynı iç mekân kabuğunda tam ekran gösterir, bu yüzden bulanık görünüyor.
- İstenen: **AYNI KADRAJ, AYNI KOMPOZİSYON** (mor-pembe ışık sütunu, ortada anıt dikilitaşı, iki yanda sütunlar, 4 yer meşalesi, taş zemin). Yeniden tasarım yok; ayrıntıyı koruyarak çözünürlük artırma/yeniden çizim. Yeni nesne, yeni renk, yazı yok.
- Ölçü: **en az 1600×678 (oran 512:217 ≈ 2,3594; ±1 px)**, tercih 2048×868. PNG ya da WebP, alfa gerekmez (tam kare resim).
- Kontrol: 512 px'e küçültünce orijinalle yan yana gelince aynı resim olmalı (yer, ışık, nesneler).

## P34-02 / 03 / 04 · Sahne hareket katmanları (ortak teknik şartlar)
**Neden:** başkent, Yemin Pazarı ve Klan Obaları tek parça boyanmış fotoğraf; sancak/şelale/lav/ateş/duman hareketsiz. Fotoğraf DEĞİŞMEZ; hareket, fotoğrafın ÜSTÜNE oyun içinde ayrı tuvalle bindirilen saydam katmanlardan gelecek. (Oyunda zaten var, TEKRARLANMAZ: ışık tozu, kor/kül zerreleri, uzak kuşlar, portal parçacığı, gün evresi tonu.)

**Hedef görseller (oyunda varsayılan olarak GÖSTERİLEN dosyalar; `js/hub2d.js` S2_BG / S2_CARSI_BG / S2_KLAN_BG):**
| Kimlik | Dosya | Gerçek ölçü | Halk |
|---|---|---|---|
| `baskent-elentha` | `sahneler/baskent_elentha.webp` | 1600×892 | Elentha (`sancak`) |
| `baskent-kragmir` | `sahneler/baskent_kragmir.webp` | 1600×893 | Kragmir (`ocak`) |
| `carsi` | `sahneler/yemin_pazari.webp` | 1600×893 | iki halkta ortak (Yemin Pazarı) |
| `klan-elentha` | `sahneler/klan_obasi_elentha.webp` | 1376×768 | Elentha klan obası |
| `klan-kragmir` | `sahneler/klan_obasi_kragmir.webp` | 1376×768 | Kragmir klan obası |

**Koordinat sistemi:** her katman KENDİ sahne dosyasının gerçek piksel ölçüsünde (tablodaki ölçü), sol-üst orijinli. Oyun resmi 1376:768 kutuya "cover" yerleştirir (küçük farklar bizde); sen yalnız dosya pikseline göre yaz, oyunda ölçekleme/yerleştirme bizde. **Not:** `img/kd/sehir/*/sahne.webp` (2340×1080) eski kipin dosyalarıdır, varsayılan görünümde KULLANILMIYOR → hedef değil, pakete konmadı. (Eski P34 tablosundaki "1376×768 koordinatı" yalnız Klan Obaları için doğrudur; başkent ve çarşı 1600 genişliklidir.)

**Katman tipleri**
1. **Yer değiştiren katman** (sancak/kumaş/tente, şelale, duman, lav akışı): fotoğraftaki ilgili bölgenin kırpımı kare kare hareket etmiş hâli. Tam renkli, kenarlar yumuşak alfa (fotoğrafa dikişsiz otursun).
2. **Işık katmanı** (meşale/ocak alevi, lav parlaması): yalnız ışık/alev pikselleri, `karisim: "screen"` ile bindirilir; zemin tam saydam.
- **Kare 00 = fotoğraftaki kırpımın piksel piksel aynısı** (çıplak sahne ile katman 00 arasında fark görülmemeli). Animasyon kapalıyken / "hareketi azalt"ta bu kare gösterilir.
- 4–8 kare, **kusursuz döngü** (son kare → ilk kare sıçramaz), 8–12 kare/sn. Hareket ABARTISIZ: sancak/tente dalgalanması en çok ~8 px, alev titremesi ±%15, şelale ve lav yavaş sürekli akış. Bina/arma/yazı şekli değişmez.
- Eleman başına kırpım ≤ 640×640 (şelale ≤ 720×420); sahne başına ≤ 14 eleman; sahne başına toplam ≤ 25 MB PNG (biz WebP'ye çeviririz).
- Etkileşimi kapatan, bina etiketini/dokunma alanını örten büyük katman YOK; katman yalnız hareketli şeyin kendi alanındadır. Etiket merkezleri `etiket_konumlari.json` içindedir (yüzde + dosya pikseli); katmanlar etiketlere engel olmaz (etiketler katmanın üstünde çizilir, yine de gereksiz örtme yapma).
- `yerlesim.json` ZORUNLU (şema aşağıda). Aşağıdaki konumlar **yaklaşık ipucudur (±80 px, doğrulanmadı)** — ızgaralı görüntüler (`izgara_*.jpg`, etiketler gerçek piksel) üzerinden elle çıkarıldı; her eleman için kesin kutuyu sahneyi ölçerek SEN yaz. Fotoğrafta bulunmayan bir şeyi (örn. Elentha'da lav) UYDURMA; bulunmayan eleman için `atlananlar` kullan.

`yerlesim.json` şeması:
```json
{ "sahne": "baskent-elentha", "tuval": [1600, 892],
  "elemanlar": [ { "kimlik": "sancak-01", "tur": "sancak|selale|alev|lav|duman|tente",
    "x": 640, "y": 150, "w": 120, "h": 200, "kare": 6, "fps": 10, "karisim": "normal|screen",
    "dongu": true, "dosyalar": ["sancak-01_00.png", "sancak-01_01.png"], "zorunlu": true, "not": "" } ],
  "atlananlar": [ { "tur": "...", "gerekce": "..." } ] }
```

### P34-02 · Elentha başkent (`baskent-elentha`, 1600×892)
| Eleman | Yaklaşık yer (dosya pikseli) | Not |
|---|---|---|
| Mavi-altın sancaklar | Orta büyük bayrak direği ve dalgalanan sancak x≈560–720, y≈380–480 (en belirgin); taht merdiveni iki yanı x≈700–750 ve 980–1020, y≈160–260; kapı/portal iki yanı x≈740–800 ve 1060–1110, y≈520–640; sol-üst kulelerde küçük sancaklar | ≥ 5 sancak, farklı fazlarda |
| Şelale | Sol üst kayalıkta x≈200–700, y≈0–330 (çok kollu ince şelaleler); taht arkasında küçük akış | akış + köpük; kaya sabit |
| Meşale/fener/ocak alevi | Demirci ocağı x≈440–520,y≈270–340; maden girişi fenerleri x≈240–400,y≈540–570; portal iki yanı meşale x≈760–800 ve 1050–1090, y≈680–720; han penceresi ışıkları; pazar çadırı lambaları | küçük, sıcak, hafif titreme; ≥ 6 nokta |

### P34-03 · Kragmir başkent (`baskent-kragmir`, 1600×893)
| Eleman | Yaklaşık yer | Not |
|---|---|---|
| Lav akışı | Sol-üstte lav şelalesi x≈250–400, y≈200–300; üst orta dağda lav damarları x≈600–820, y≈20–170; sağ üst dağ/uzak lavlar x≈1100–1300, y≈100–250 | yavaş akan/parlayan magma; kayalar sabit |
| Alev (meşale/ocak) | Demirci ocağı x≈440–520,y≈270–330; basamak meşaleleri x≈690–720 ve 780–820, y≈330–370; maden fenerleri x≈190–300,y≈530–580; portal çevresi meşaleler y≈660–720; ahır/han pencereleri | ≥ 10 nokta |
| Duman | Sol üst kül/duman bulutları x≈330–860, y≈20–140; sağ üst x≈1200–1300, y≈100–170 | ince, yukarı kıvrılan |
| Kızıl sancaklar | Kale duvarı bayrakları x≈700–1050, y≈90–260; orta büyük dalgalanan sancak x≈480–620, y≈300–360; portal iki yanı x≈800 ve 1060, y≈560–640 | ≥ 5 sancak |

### P34-04 · Yemin Pazarı (`carsi`, 1600×893) ve Klan Obaları
| Sahne | Eleman | Yaklaşık yer |
|---|---|---|
| `carsi` | Tente/kumaş: sol mavi kubbeli köşk/tentesi x≈0–250,y≈400–870 (halılar, kumaş); örtülü vagonların tentesi x≈380–670,y≈500–670; sağ kırmızı çadır tenteleri x≈830–1400,y≈430–670 ve x≈1280–1600,y≈415–550; tezgâh kumaşları | rüzgârda hafif dalgalanma; ≥ 5 eleman |
| `carsi` | Sancak (mavi/kırmızı) ve meşale/fener alevi | sancaklar x≈250–330,y≈380–480; meşaleler x≈300,y≈440; x≈400,y≈480; x≈870–1250,y≈400–460 |
| `carsi` | Şelale (isteğe bağlı) | sol üst x≈215–270, y≈50–170 |
| `klan-elentha` (1376×768) | Sancaklar: kule tepesi x≈330–430,y≈20–120 (büyük bayrak); orta büyük çadır çevresi x≈550–680,y≈150–300; kapı tarafı; surdaki mavi sancaklar | ≥ 5 sancak |
| `klan-elentha` | Çeşme suyu + meşaleler | çeşme x≈880–1000,y≈250–330; meşaleler kapı/yol kenarı |
| `klan-kragmir` (1376×768) | Kızıl sancaklar: kule tepesi x≈330–430,y≈20–90; orta kızıl çadır çevresi x≈550–680,y≈150–320; surdaki sancaklar | ≥ 5 sancak |
| `klan-kragmir` | Lav şelalesi (sağ üst x≈1200–1330,y≈20–200), meşaleler, ocak/örs ateşi (sağ alt x≈1050–1150,y≈540–620) | lav + alev |

## P34-08 · Kragmir ERKEK 5. yüz
- Durum (ölçüldü): Kragmir erkek yüz yuvası 4 = yuva 0'ın (savaşçı yüzü) AYNASI (piksel farkı ≈ 1,8/255). Kragmir KADIN yuva 4 ayna DEĞİL (ölçüm: aynayla fark ≈ 25) → kadın için çizim istenmiyor. Elentha yüzleri ayna değil.
- İstenen: **yeni, özgün Kragmir erkek yüzü** (yuva 4). Yeşil tenli ork; diğer dört yüzden (savaşçı, suikastçı, büyücü, rahip) yaş/yara/saç/çene/boynuz-küpe-dövme ile BELİRGİN farklı; sınıf bağımsız (oyuncu her sınıfta seçer), bu yüzden belirgin sınıf aksesuarı (asa, kukuleta, kask) YOK; omuz üstü portre.
- Girdi: `03_P34-08_KRAGMIR_YUZ/` içinde mevcut dört yüz (512×512 PNG alfa: `kragmir_{savasci,suikastci,buyucu,rahip}_erkek_yuz.png`; savaşçı yüzü `yuz_ocak_m_0` olarak da var) + mevcut yuva-4 (ayna) + kadın yüzleri (stil karşılaştırması).
- Çıktı: **512×512 PNG, gerçek alfa**, aynı kadraj/ölçek/ışık/boyama dili (yüzün oranı ve omuz kesimi mevcutlarla aynı). Biz 176×176'ya indirgeriz.

## P34-09 · Bran ve Nessa portreleri (G4 biçimi)
- **Kim:** *Küçük Bran* — Yemin Pazarı'nda öğreticide duran çocuk; kardeşi Nessa'yı Dev Solucan yuttu, kahramandan yardım ister. *Nessa* — Bran'ın küçük kardeşi; solucanın karnından çıkar, sırılsıklam ama gülümser; Bran koşup sarılır. İkisi de iki halkın tarafsız pazarında yaşayan sıradan köylü çocukları (halk amblemi/zırhı yok). **Çocuk karakterler; masum, hikâye kitabı tonu, korku/şiddet/ima yok.** Yaşlar: Bran ≈ 9–10, Nessa ≈ 6–7.
- Metin kaynağı: `04_P34-09_BRAN_NESSA/hikaye_ozeti.md` (kodda geçen replikler).
- Biçim: **G4 NPC portreleriyle aynı**: tam portre **528×704 PNG/WebP, gerçek alfa** + yüz **192×192** (yüz = baş-omuz kırpımı; yönergeler aynı klasörde `G4_BICIM.md`). Aynı boyama, ışık (sol-üst ana ışık), kontur, perspektif. Referans: `04_P34-09_BRAN_NESSA/G4_REFERANS/` (Halvor, Maelis, Corin, Thrak, Edran, Volgar, Yashka, Lira + yüzleri).
- Dosya adı: `bran.webp`, `bran-yuz.webp`, `nessa.webp`, `nessa-yuz.webp` (ya da PNG). Bran'ın şu anki yedeği küçük bir SVG simgedir; yeni portre onu değiştirecek (mevcut SVG `bran_yedek_svg.svg` yalnız bilgi için).
- Bran 3 durumda konuşur (yardım iste / teşekkür / veda): tek nötr-endişeli ifade yeterli; Nessa tek gülümseyen ifade. (Ek ifade kareleri Gemini'nin göz kırpma/konuşma işidir, sen üretme.)

## K-1 · Beş karakter setinde beyaz zemin kontrolü
- Geçmiş: eski G2 teslimlerinde 5 sette opak beyaz zemin vardı; 23 Kas'ta GPT temiz setleri teslim etti ve oyuna bağlandı.
- Bizim ölçümümüz (oyundaki gömülü 16 kahraman × 7 poz, 384×512 WebP): köşe alfa hep 0; kenarla bağlantılı açık-nötr piksel oranı en çok %0,06 (en kötü: `ocak/suikastci-erkek__saldiri-vurus` 33 piksel). Tablo: `05_KONTROL_BEYAZ_ZEMIN_VE_BUYU/beyaz_olcum.json`, tüm kahramanlar bekleme pozu karması: `…/kahramanlar_bekleme.png`.
- İstenen: bu ölçüme ve görsele bak; **gerçek (kaynak) PNG'lerin** de temiz olduğunu teyit et. Temizse `K-1/kontrol.json` içine `"durum": "temiz"` ve ölçümünü yaz; DÜZELTME GEREKMEZ ve yeniden üretme yapma. Beyaz zemin/halo bulursan yalnız o pozun temiz alfalı PNG'sini (aynı ölçü: 1086×1448 kaynak) ver, hangi set/poz olduğunu yaz.

## K-2 · Elentha kadın savaşçı büyü pozu
- Geçmiş: büyü pozunda başka yüz çıkmıştı; 23 Kas'ta düzeltilmiş poz geldi ve bağlandı (`YEDEK` kalktı).
- Bizim kontrolümüz: `05_…/buyu_kontrol.png` (üst sıra Elentha kadın savaşçı 7 poz, alt sıra büyücü kadın; büyü pozu = 4. kare) — yüz, saç, zırh, pelerin, kalkan diğer pozlarla aynı karakter görünüyor.
- İstenen: kaynak PNG'de de aynı karakterin tutarlılığını (yüz, saç rengi, zırh/pelerin/kalkan deseni, silah eli) teyit et → `K-2/kontrol.json`. Tutarsızlık varsa yalnız o pozu aynı ölçüde (1086×1448, alfa) yeniden ver; yoksa dokunma.

## Teslim
`KORANT_GPT_P34_TESLIM.zip` (30 MB'ı aşarsa `KORANT_GPT_P34_TESLIM_01of0N.zip`…): görev klasörleri yukarıdaki adlarla + kökte `teslim_manifest.json`:
```json
{ "uzman": "GPT", "surum": "KORANT-v40-1dda167+P33", "paket": "P34",
  "kalemler": [ { "kod": "P34-01", "durum": "uretildi|atlandi|uretilemedi|kontrol_temiz|kontrol_duzeltildi",
     "dosyalar": [ { "yol": "P34-01/zafer_aniti.png", "olcu": [1600, 678], "sha256": "…", "alfa": false } ],
     "kendi_kontrolum": "…", "varsayimlar": "…", "gerekce": "…" } ] }
```
Ek: `P34-02`, `P34-03`, `P34-04` katmanlarını kendi bindirme önizlemenle (`onizleme/<sahne>_bindirme.gif` ya da kare PNG) göster; önizleme dosyaları üretim dosyası sayılmaz.
