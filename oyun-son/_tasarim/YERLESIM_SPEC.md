# DEMİR DİYARI · Yerleşim ve Ölçü Spesifikasyonu
### Ne, nerede durur, hangi boyuttadır: Bütün ekranlar için tek ölçü sistemi

> **Bu belgeyi alan yapay zekâya:** Bu belge `KONSEPT_BRIEF.md`'nin (görsel kimlik) yapısal eşidir. Konsept brifi *nasıl göründüğünü*, bu belge *nerede durduğunu ve ne kadar büyük olduğunu* söyler. İkisi çelişirse **ölçü ve yerleşimde bu belge** esastır. Buradaki sayılar keyfî değildir: oyunun gerçek çalıştığı cihazlardan (yatay telefon, tablet, masaüstü) hesaplanmıştır. Bir sayıyı değiştirmek istersen, gerekçesini teslimde yaz.
>
> Hedef: Her ekran **aynı ızgaradan, aynı boşluk ölçeğinden, aynı bileşen ölçülerinden** kurulsun. Oyuncu bir ekrandan ötekine geçtiğinde geri düğmesi, başlık, kaynaklar ve ana eylem **hep aynı yerde** olsun. Ahenk buradan gelir.

---

## 1. Tuval ve ölçek: Temel kural

### 1.1 Tasarım birimi: `dp`
- Bütün ölçüler **dp** (tasarım pikseli) cinsindendir.
- **Referans yükseklik: 1080 dp.** Ekranın yüksekliği her zaman 1080 dp sayılır; **genişlik cihaza göre esner.**
- Ölçek: `s = ekran_yüksekliği_px / 1080`, en fazla `1.0` (büyük masaüstü ekranlarda arayüz daha da büyümez; sahne büyür, arayüz ortalanır).
- Uygulamada: oyun kodu `--s` değişkenini yayınlar. Bir ölçü CSS'te `calc(120 * var(--s) * 1px)` biçiminde yazılır. Sen tasarımda yalnızca dp kullan.

### 1.2 Neden yükseklik? Gerçek cihazlar

Oyun **yalnızca yatay** çizilir. Gerçek ekranlar (CSS pikseli → dp karşılığı):

| Cihaz (yatay) | CSS px | s | Genişlik (dp) | En-boy |
|---|---|---|---|---|
| Küçük telefon | 667 × 375 | 0.347 | 1921 | 16:9 |
| Yaygın iPhone | 844 × 390 | 0.361 | 2338 | 19.5:9 |
| Yaygın Android | 915 × 412 | 0.381 | 2398 | 20:9 |
| Tablet | 1180 × 820 | 0.759 | 1554 | ~1.44 (4:3'e yakın) |
| Masaüstü | 1920 × 1080 | 1.0 | 1920 | 16:9 |

**Sonuç:** Tasarım genişliği **1440 dp ile 2400 dp arasında** değişir. Bu yüzden:
- **Ana maket boyutu: 2340 × 1080 dp** (yaygın telefon). Her önemli ekranın **1440 × 1080** (tablet) uyarlamasını da göster.
- **Güvenli çekirdek:** Ortadaki **1440 × 1080** alan. Kritik içerik (ana paneller, diyalog, sonuç kartları) bu çekirdeğe sığmalı.
- Kenarlara **çapalanan** öğeler (üst bar, kaynaklar, yetenek düğmeleri, menü) ekran genişledikçe kenarla birlikte gider; aradaki boşluk sahneye (3B dünyaya) kalır.

### 1.3 En küçük okunur ve dokunulur ölçüler (telefonda s ≈ 0.36)

| Kural | dp | Telefonda sonuç |
|---|---|---|
| **En küçük dokunma hedefi** | **120 × 120** | ~43 px (Apple/Google en az 44 önerir) |
| Tercih edilen dokunma hedefi | 136 × 136 | ~49 px |
| İki dokunma hedefi arası en az boşluk | 16 | ~6 px |
| **En küçük cümle yazısı** | **34** | ~12 px |
| En küçük tek sayı / rozet yazısı | 28 | ~10 px (yalnızca sayı, asla cümle değil) |
| Gövde yazısı | 38 | ~14 px |

> Görsel olarak küçük olması gereken bir öğe (örn. 72 dp'lik kapat simgesi) **dokunma alanı olarak 120 dp** taşır; görünmez dolgu kullan.

---

## 2. Güvenli alanlar ve kenar boşlukları

- **Çentik / kamera adası (yatayda sol ya da sağ kenar):** ~47 CSS px ≈ **130 dp**. Oyun bu payı ölçer (`--sal`, `--sar`). Tasarımda sol ve sağ kenardan **130 dp çentik bölgesi** işaretle; buraya **metin ve düğme konmaz**, yalnızca arka plan ve süs uzanabilir.
- **Ana ekran çizgisi (alt):** ~21 CSS px ≈ **58 dp** (`--sab`). Alttaki düğmeler bunun üstünde başlar.
- **Ekran kenar boşluğu (güvenli alanın içinde):** **32 dp**. Bütün çapalı öğeler güvenli alan + 32 dp içeriden başlar.
- Maketlerde üç çizgiyi açık renkle göster: ekran kenarı, güvenli alan, kenar boşluğu.

---

## 3. Izgara ve boşluk ölçeği

### 3.1 Taban birim: 8 dp
Bütün ölçüler, boşluklar ve konumlar **8'in katı** olmalı (istisna: 4 dp ince kenar çizgileri ve ikon iç ayarları).

### 3.2 Boşluk ölçeği (yalnızca bunlar)
| Ad | dp | Kullanım |
|---|---|---|
| `b1` | 8 | simge ile etiketi arası |
| `b2` | 16 | liste öğeleri arası, ızgara aralığı |
| `b3` | 24 | kart iç dolgusu |
| `b4` | 32 | panel iç dolgusu, ekran kenar boşluğu |
| `b5` | 48 | bölümler arası |
| `b6` | 64 | büyük grup ayrımı |
| `b7` | 96 | ekran başlığı ile içerik arası (geniş ekranlarda) |

### 3.3 Sütun ızgarası (panel içi)
- Panel içleri **12 sütun**, sütun aralığı **24 dp**.
- Ekranın kendisi sütuna bölünmez; ekran **bölgelere** (Bölüm 5) ayrılır. Sütunlar yalnızca panel ve içerik alanının içinde kullanılır.

---

## 4. Katmanlar (önden arkaya sıra)

| Katman | z | İçerik |
|---|---|---|
| 0 | 0 | 3B sahne (dünya, karakterler) |
| 1 | 10 | Sahneye bağlı arayüz: isim plakaları, can çubukları, hasar sayıları |
| 2 | 100 | **HUD:** üst bar, kaynaklar, menü düğmeleri, yetenekler, sohbet şeridi |
| 3 | 200 | **Panel / pencere** (envanter, klan vb.), arkasında %60 karartma |
| 4 | 300 | **Modal:** onay kutusu, ödül açılışı; arkasında %70 karartma |
| 5 | 400 | **Toast / bildirim** |
| 6 | 500 | **Öğretici** vurgusu (delikli karartma + el işareti) |
| 7 | 900 | Yükleme ve geçiş perdesi |

**Kural:** Aynı anda en fazla **bir panel ve bir modal** açık olabilir. Panel açıkken HUD'un yalnızca **üst barı** görünür kalır.

---

## 5. Ekran bölgeleri: "Altın harita" (her ekranda aynı)

Oyuncunun eli her zaman nereye gideceğini bilmeli. Yatay telefonda iki başparmak **alt köşelerdedir**; bu yüzden en sık eylemler alttadır.

```
┌──────────────────────────────────────────────────────────────────────────┐
│ [A] KİMLİK / GERİ        [B] BAŞLIK / BİLDİRİM          [C] KAYNAKLAR+AYAR │  ← Üst bar: 136 dp
│                                                                          │
│ [D] SOL RAY                                                [E] SAĞ RAY   │
│ (görev izleyici,              [MERKEZ]                  (menü düğmeleri, │
│  sekmeler)               3B sahne / ana içerik            hızlı erişim)  │
│                                                                          │
│ [F] SOL ALT                                                [G] SAĞ ALT   │
│ (sohbet, sosyal,                                         (ANA EYLEM:     │
│  ikincil eylemler)                                        Savaş, Kuşan,  │
│ [H] DOCK (sola çapalı)                                    yetenekler)    │
│  ← sol başparmak                                                         │
│                                                           sağ başparmak →│
└──────────────────────────────────────────────────────────────────────────┘
```

| Bölge | Çapa | Ne durur | Kural |
|---|---|---|---|
| **A** Sol üst | sol + üst | Ana ekranda portre ve seviye; diğer ekranlarda **Geri** düğmesi + ekran başlığı | Geri düğmesi **her ekranda burada** |
| **B** Üst orta | üst + orta | Duyuru şeridi, etkinlik sayacı, savaşta sıra şeridi | Asla düğme kalabalığı yok |
| **C** Sağ üst | sağ + üst | Altın, premium para, enerji sayaçları; en sağda **ayarlar / kapat** | Kaynak sırası her ekranda aynı |
| **D** Sol ray | sol + orta | Görev izleyici (ana ekran), dikey sekmeler (panel ekranları) | Genişlik sabit: 440 dp |
| **E** Sağ ray | sağ + orta | Menü düğmeleri (ana ekran), filtreler | Genişlik sabit: 160 dp; en fazla 5 düğme |
| **F** Sol alt | sol + alt | Sohbet şeridi, arkadaş/parti; savaşta iksir yuvaları | Sol başparmak bölgesi |
| **G** Sağ alt | sağ + alt | **Ekranın tek ana eylemi** (Savaş, Başla, Kuşan, Satın al); savaşta yetenek kümesi | Sağ başparmak bölgesi. **Birincil düğme her zaman burada** |
| **H** Alt şerit | alt + sol | Dock (alt menü şeridi): Çanta, Karakter, Yetenek, Klan, Mağaza | Yükseklik 152 dp; sola çapalı (8.1) |

**Ahenk kuralları:**
1. Her ekranda **tek bir birincil düğme** (altın/kor renkli) olur ve **G bölgesinde** durur.
2. Yıkıcı eylemler (Sat, Sil, Ayrıl) asla birincil düğme olmaz; ikincil düğmeyle ve onay modalıyla gelir.
3. Geri her zaman **A**'da, kapat (X) her zaman panelin **sağ üst köşesinde**.
4. Kaynak sayaçları **C**'de hep aynı sırada: Altın → Premium → Enerji.
5. Kırmızı bildirim noktası her zaman düğmenin **sağ üst köşesinde**, 32 dp çapında.

---

## 6. Bileşen ölçüleri (dp)

### 6.1 Düğmeler
| Bileşen | Genişlik × Yükseklik | Yazı | Not |
|---|---|---|---|
| Birincil (büyük) | 400 × 136 | 44, kalın | Ana eylem: "SAVAŞ", "BAŞLA" |
| Birincil (normal) | 320 × 120 | 40, kalın | Kuşan, Onayla |
| İkincil | 280 × 120 | 38 | İptal, Ayrıntı |
| Küçük / satır içi | en az 200 × 96 (dokunma 120) | 34 | Liste içi eylem |
| Simge düğmesi | 120 × 120 (simge 72) | — | Menü, ayarlar |
| Dock düğmesi | 136 × 136 (simge 80 + etiket 30) | 30 | Alt şerit |
| Kapat (X) | görünen 80, dokunma 120 | — | Panel sağ üst köşe |
| Geri | 120 × 120 | — | A bölgesi |

Köşe yarıçapı: düğme **20**, kart **24**, panel **32**. Çerçeve kalınlığı: ince **4**, kalın **8**.

### 6.2 Üst bar
- Yükseklik **136 dp** (güvenli alanın altından). İçinde öğeler dikey ortalı.
- **Kaynak sayacı:** 280 × 88; simge 64; sayı 38 kalın; "+" düğmesi 88 × 88 (dokunma alanı sayacın tamamı). Sayaçlar arası 16.
- **Portre bloğu (ana ekran):** portre 136 × 136 çerçeveli; yanında isim (36), seviye rozeti (72 çaplı, sayı 34), XP çubuğu 280 × 16.

### 6.3 Çubuklar
| Çubuk | Boyut | Yer |
|---|---|---|
| HUD can / mana (oyuncu) | 360 × 32 / 360 × 20 | Portre yanında |
| Sahnedeki birim üstü can | 180 × 20 (mana 180 × 10, can çubuğunun hemen altında) | Birimin başının 24 dp üstü |
| Boss can çubuğu | ekran genişliği − 2×(güvenli alan + 280), en fazla 1400 × 48 | Üst orta, üst barın hemen altı |
| XP / ilerleme | genişlik serbest × 16–24 | — |
| Yükleme | 1200 × 24 (çatlak motifli) | Alt orta, alttan 160 |

### 6.4 Kartlar ve yuvalar
| Bileşen | Boyut |
|---|---|
| **Eşya yuvası** | **136 × 136** (simge 112), aralık 16 |
| Eşya yuvası (küçük, ödül listesi) | 104 × 104 |
| Kuşanma yuvası (karakter ekranı) | 152 × 152 |
| Karakter / birim portresi (liste) | 160 × 160 |
| Karakter kartı (seçim) | 400 × 640 |
| Görev / liste satırı | genişlik serbest × 152 |
| Ödül kartı (sonuç ekranı) | 200 × 260 |
| Bölge düğümü (harita) | 120 çap; boss kapısı 168 çap |
| Rozet (seviye) | 72 çap |
| Yıldız | 56 |

### 6.5 Paneller ve pencereler
| Tür | Boyut | Kullanım |
|---|---|---|
| **Tam panel** | Ekranın tamamı, üst bar korunur; içerik alanı = üst bardan sonrası | Envanter, Klan, Yetenek, Mağaza |
| Orta pencere | 1280 × 840 (en fazla ekran − 2×64) | Eşya ayrıntısı, ayarlar |
| Küçük pencere | 880 × 560 | Onay, kısa bilgi |
| Modal (onay) | 880 × en fazla 560; düğmeler altta, sağda birincil | Satış, ayrılma |
| Alttan sayfa | tam genişlik × 520 | Hızlı seçim, filtre |
| Toast | en fazla 880 × 104, üst orta, üst barın 16 altı; 2.5 sn | Bildirim |

Pencere başlık şeridi: **104 dp** yükseklik, başlık 48, sağ üstte kapat.

### 6.6 Simge boyutları (yalnızca bunlar)
**48** (satır içi) · **64** (kaynak, nitelik) · **72** (simge düğmesi içi) · **80** (dock) · **112** (eşya) · **136** (yetenek) · **256** (teslim edilen ana dosya; bunlardan küçültülür).

---

## 7. Tipografi ölçeği (dp)

> **Önemli:** `KONSEPT_BRIEF.md` Bölüm 4'teki piksel değerlerinin yerine **bu tablo** geçerlidir.

| Rol | Yazı tipi | dp | Satır yüksekliği | Telefonda ≈ |
|---|---|---|---|---|
| Ekran adı / büyük başlık | Cinzel 900 | 72 | 1.1 | 26 px |
| Başlık 1 | Cinzel 700 | 56 | 1.15 | 20 px |
| Başlık 2 / pencere başlığı | Cinzel 700 | 48 | 1.2 | 17 px |
| Başlık 3 / kart başlığı | Inter 800 | 42 | 1.25 | 15 px |
| **Gövde** | Inter 400 | **38** | 1.35 | 14 px |
| Gövde vurgulu / düğme | Inter 600–800 | 38–44 | 1.2 | 14–16 px |
| Küçük (açıklama, etiket) | Inter 400/600 | 34 | 1.3 | 12 px |
| Rozet sayısı (yalnızca sayı) | Inter 800 | 28 | 1 | 10 px |
| Hasar sayısı (normal) | Inter 800 + 6 dp kontur | 72 | 1 | 26 px |
| Hasar sayısı (kritik) | Inter 800 + kontur, 8° eğik | 104 | 1 | 37 px |
| Boss adı (savaş girişi) | Cinzel 900 | 120 | 1 | 43 px |

- Paragraf genişliği en fazla **1200 dp** (~45–60 karakter).
- Büyük harf yalnızca Cinzel başlıklarda. Türkçe büyük harf dönüşümü: **i → İ, ı → I**. Örnekte "İKSİR", "KILIÇ", "ŞİFACI" göster.

---

## 8. Ekran ekran yerleşim

Her ekran için koordinatlar **2340 × 1080 dp** maketine göredir. "sol: 162" = güvenli alan (130) + kenar boşluğu (32). Sağ için aynı: ekran genişliği − 162. Alt referans: alt güvenli alan (58) + 32 = **alttan 90**.

### 8.1 Ana Merkez (Hub)
```
┌────────────────────────────────────────────────────────────────────────────┐
│[Portre136][İsim·Sv·XP]        [Duyuru şeridi 880×72]   [Altın][Elmas][Enerji][⚙]│ üst 136
│┌Görev izleyici 440×280┐                                          [Harita] │
││ Ana görev + 2 günlük │                                          [Görev ] │ sağ ray
│└──────────────────────┘          3B ŞEHİR SAHNESİ                [Arena ] │ en fazla 5 düğme
│[Etkinlik afişi 440×176]        (karakter merkezde)               [Etkinl] │ 120'lik, aralık 16
│                                                                  [Sandık] │
│[Sohbet şeridi 640×180, son 3 mesaj]                      ┌──────────────┐ │
│                                                          │   S A V A Ş   │ │
│[Çanta][Karakter][Yetenek][Klan][Mağaza]  ← dock          │   400 × 136   │ │
│ 5 × 136, aralık 16, SOLA çapalı                          └──────────────┘ │
└────────────────────────────────────────────────────────────────────────────┘
```
Dikey sütunlar (2340 × 1080 maketinde, üstten):
- **Sol sütun:** üst bar bitişi 136 → görev izleyici 168–448 → etkinlik afişi 464–640 → (boşluk) → sohbet şeridi 658–838 → dock 854–990 (alttan 90).
- **Sağ sütun:** sağ ray 168–832 (5 × 120 + 4 × 16) → SAVAŞ 854–990.

Kurallar:
- **Dock sola çapalıdır** (soldan 162 başlar, 5 × 136 + 4 × 16 = **744 dp**, 162–906). Sohbet şeridi dockun **hemen üstündedir**. Böylece sol başparmak bölgesi tek blok olur ve dar ekranda SAVAŞ ile çakışmaz.
- **SAVAŞ:** sağ alt; sağdan 162, alttan 90. Genişlik 2340'ta 400; **ekran 1600 dp'den darsa 320**. (1440'ta SAVAŞ 958–1278, dock 162–906: arada 52 dp kalır.)
- Sağ ray: **en fazla 5 düğme**; fazlası "Daha fazla" (⋯) altında toplanır.
- 3B karakter ekranın ortasında, ayakları alttan ~220 dp'de. Arayüz yüzünü kapatmaz.
- Duyuru şeridi üst ortada; ekran 1600'den darsa 640 dp'ye iner ya da üst barın altına (168) iner.

### 8.2 Ortak "Panel Ekranı" şablonu
Envanter, Klan, Görevler, Sıralama, Mağaza, Ayarlar, Rehber, Posta vb. **hepsi bu iskeleti kullanır:**
```
┌────────────────────────────────────────────────────────────────────────────┐
│[←Geri] EKRAN ADI (72)                                [Altın][Elmas][Enerji] │ üst 136
├──────────┬─────────────────────────────────────────────────────────────────┤
│ Sekme 1  │                                                                 │
│ Sekme 2  │                    İÇERİK ALANI                                  │
│ Sekme 3  │        (12 sütun, iç dolgu 32, kaydırma yalnızca burada)         │
│ Sekme 4  │                                                                 │
│ 280 dp   │                                                                 │
│ sekme    │                                                                 │
│ 112 yük. ├─────────────────────────────────────────────────────────────────┤
│          │ [ikincil eylemler]                              [BİRİNCİL 320×120]│ eylem şeridi 152
└──────────┴─────────────────────────────────────────────────────────────────┘
```
- Sol sekme rayı: **280 dp** geniş, sekme yüksekliği **112**, en fazla 6 sekme. Seçili sekmenin sağında çatlak çizgisi.
- Sekme gerekmezse içerik tam genişlik olur, iskelet değişmez.
- Eylem şeridi yalnızca o ekranda eylem varsa görünür.

### 8.3 Karakter / Envanter
```
│[←] KARAKTER                                          [kaynaklar]            │
├────────────────────────────┬───────────────────────────────────────────────┤
│ [Miğfer]          [Takı]    │ [Tümü][Silah][Zırh][Takı][İksir]  filtre 104   │
│ [Göğüs]   3B      [Takı]    │ ┌───┬───┬───┬───┬───┬───┬───┐                  │
│ [Eldiven] KARAKTER[Kalkan]  │ │136│   │   │   │   │   │   │ eşya ızgarası     │
│ [Çizme]  (döner)  [Silah]   │ ├───┼───┼───┼───┼───┼───┼───┤ aralık 16        │
│  152'lik yuvalar           │ │   │   │   │   │   │   │   │ sütun sayısı      │
│ Güç Day Çev Zek Mana  +5    │ └───┴───┴───┴───┴───┴───┴───┘ genişliğe göre    │
│ (nitelik şeridi 120)       │                       [Sırala]   [Güçlendir]    │
└────────────────────────────┴───────────────────────────────────────────────┘
   sol blok: 880 dp                     sağ blok: kalan genişlik
```
- Eşya ayrıntısı **orta pencere** olarak açılır: solda 256'lık büyük simge + nadirlik çerçevesi, sağda değerler, altta karşılaştırma ve düğmeler.

### 8.4 Yetenek ağacı
- Panel şablonu; sekmeler yerine üstte **3 dal sekmesi** (yatay, her biri 360 × 104).
- İçerik: 3 dal yan yana **dikey rün sütunu** (taşın üç yüzü). Düğüm 136 çap, düğümler arası dikey 48, bağlantı çizgisi 8 kalınlık.
- Sağda 520 dp'lik **ayrıntı kartı:** seçili yeteneğin adı, simgesi, açıklaması, bedeli, "Öğren" düğmesi (G bölgesi).
- Üst orta: kalan yetenek puanı rozeti.

### 8.5 Dünya haritası ve bölge
- Harita **tam ekran**, kaydırılabilir; üst bar korunur.
- Bölge düğümü 120 çap, boss kapısı 168. Düğümün altında ad (34) ve yıldızlar (56'lık, 3 adet).
- Düğüm seçilince **sağdan 640 dp genişliğinde bilgi paneli** kayar: bölge görseli 640 × 360, ödüller (104'lük yuvalar), önerilen güç, **BAŞLA** (G).
- Aşama listesi (25 aşama): yatay kaydırılan basamaklar, her 5'te bir büyük kapı.

### 8.6 Savaş öncesi (VS)
- Ekran ortadan **12° eğik** çizgiyle ikiye bölünür (çatlak). Sol: oyuncu takımı portreleri (her biri 240 × 320), sağ: düşmanlar.
- Ortada "VS" 200 dp. Altında güç karşılaştırması (ortada, 800 × 96).
- Sağ alt: **BAŞLA** (400 × 136); onun solunda **Otomatik** anahtarı (280 × 120). Sol alt: Geri.

### 8.7 Savaş HUD'u: en kritik ekran
```
┌────────────────────────────────────────────────────────────────────────────┐
│[⏸][1x][Oto]      [◉◉◉○○○○  SIRA ŞERİDİ  ~1000×120]        Tur 3   [Kaçış] │ üst 136
│                 [═════════ BOSS CAN ÇUBUĞU 1400×48 ═════════]               │ (yalnız boss)
│                                                                            │
│     ▔▔▔ ▔▔▔                                          ▔▔▔ ▔▔▔ ▔▔▔            │ birim üstü çubuklar
│     ☺   ☺   ☺         3B SAVAŞ ALANI               ☠   ☠   ☠              │
│   OYUNCU TAKIMI                                   DÜŞMANLAR                │
│   (sol yarı, %22–%45)                           (sağ yarı, %55–%78)         │
│                                                                            │
│[Aktif birim: portre 160 + can 360 + mana]              (Yt3)  (Yt4)         │
│[İksir][İksir][Eşya] 120'lik                       (Yt2)    ╭─────╮          │
│                                                  (Yt1)    │SALDIR│ 200 çap  │
│                                                           ╰─────╯          │
└────────────────────────────────────────────────────────────────────────────┘
```
- **Yetenek kümesi (G):** Temel saldırı **200 dp** çaplı daire; sağdan 162 + 0, alttan 90. Dört yetenek **136 dp** daire, temel saldırının çevresinde **çeyrek yay** üzerinde (yay yarıçapı 260 dp, açılar 180°, 210°, 240°, 270°). Böylece hepsi sağ başparmağa eşit uzaklıkta.
- Bekleme süresi: saat yönünde karartma + ortada kalan tur sayısı (44). Mana yetmiyorsa mavi çatlak kaplama + bedel rakamı kırmızı.
- **Sıra şeridi:** üst orta; portre 96 × 96, sıradaki birim 120 × 120 ve parlak. En fazla 10 portre; fazlası soluklaşarak kaybolur.
- **Aktif birim bloğu (F):** sol alt; portre 160 + can çubuğu 360 × 32 + mana 360 × 20 + durum simgeleri (48'lik, en fazla 6).
- **İksir yuvaları:** 3 adet 120 × 120, aktif birim bloğunun üstünde ya da yanında.
- **Ayrılmış köşeler:** Sağ altta **600 × 520 dp** yetenek kutusu, sol altta **720 × 440 dp** aktif birim + iksir kutusu. Hiçbir birimin silueti bu kutulara girmez.
- **Birimler:** oyuncu takımı ekran genişliğinin %22–%45'i arasında, düşmanlar %55–%78 arası; ön sıra ortaya yakın. Birimlerin ayakları alttan ~300 dp'de. Ekran daralınca düşman dizisi **sağdaki ayrılmış kutunun soluna** sıkıştırılır; oran değil, bu kural esastır.
- **Hedef seçimi:** Hedeflenebilir düşmanın ayağında 200 dp çaplı yer halkası; dokunma alanı birimin tüm siluetidir (en az 200 × 320).
- **Hasar sayıları:** Birimin başından çıkar, 600 ms'de 120 dp yükselip söner. Aynı anda en fazla 6 sayı görünür.
- Üst sol: duraklat, hız (1x/2x/3x), otomatik; her biri 120 × 120, aralık 16.

### 8.8 Savaş sonucu
- Ortada **1200 × 840** kart (güvenli çekirdek). Üstte "ZAFER" / "YENİLGİ" 120 dp, altında 3 yıldız (her biri 120, ortadaki 144).
- Ödül kartları: 200 × 260, ortada sıra; en fazla 5 tane yan yana, fazlası kaydırılır.
- Düğmeler kartın altında: solda "Tekrar" (ikincil), sağda **"Devam"** (birincil). Yenilgide üç "Güçlen" önerisi kartı (360 × 200).

### 8.9 Karakter oluşturma
- **Adım 1, Halk:** Ekran iki yarı, ortada dikey çatlak. Seçilen yarı %70'e genişler. Her yarıda halk adı (72), slogan (38), 3B sahne.
- **Adım 2, Sınıf:** 4 kart (400 × 640) yan yana, aralık 32, toplam 1696 → güvenli çekirdekten taşarsa tablette 2×2 ızgara. Seçili kart 1.06 büyür ve kalkar.
- **Adım 3, Görünüm:** Sol %55: döner 3B karakter. Sağ 760 dp: seçenek paneli (sekmeler: Ten, Saç, Yüz, Renk; seçenekler 136'lık kareler).
- **Adım 4, İsim:** Ortada 960 × 120 yazı kutusu. Yazı kutusunun yazı boyu **en az 16 CSS px** (iOS yakınlaştırma sorunu); bunun dp karşılığı telefonda ~44 dp'dir.
- Her adımda üst ortada adım göstergesi (4 nokta, 24 çap, aralık 24). Sağ alt: **İleri / Başla**. Sol alt: Geri.

### 8.10 Diyalog / hikâye
- Alt şerit: tam genişlik × **360 dp** konuşma kutusu (güvenli alan içinde). İçinde konuşan adı (48, Cinzel) + metin (40, en fazla 3 satır).
- Portreler: konuşan **sol ya da sağda 720 dp yüksekliğinde** tam boy; konuşma kutusunun arkasından yükselir. Susan karakter %50 karartılır.
- Seçenekler: kutunun üstünde sağda, her biri 880 × 104, aralık 16, en fazla 3.
- Sağ üstte "Atla" (280 × 104) ve "Otomatik".

### 8.11 Klan, Hisar, Arena, Zindan, Baskın, Nöbet
- Hepsi **Panel Ekranı şablonu** (8.2). Farklar yalnızca içerik alanında:
  - **Klan:** İçerikte üstte sancak bloğu (320 × 400) + klan bilgisi; altında üye listesi (satır 152).
  - **Hisar:** İçerik alanı kuşbakışı harita (tam alan); seçilen yapı için sağdan 640'lık bilgi paneli (8.5 ile aynı davranış).
  - **Arena:** Sol: lig rozeti 320 dp + sezon ödül şeridi; sağ: 3 rakip kartı (480 × 600).
  - **Zindan / Baskın / Nöbet:** Ortada büyük giriş kartı (1200 × 600, solda boss görseli, sağda bilgi), altta kalan hak ve **Gir** (G).

### 8.12 Mağaza ve sandık
- Mağaza: Panel şablonu; içerikte ürün kartları 400 × 520, aralık 24, yatay kaydırma. Öne çıkan paket 840 × 520.
- Sandık açma: tam ekran **modal katmanı** (z 300). Sandık ortada 480 × 480; açılınca ödül kartları sırayla ortada belirir (200 × 260). Altta "Hepsini aç" + "Tamam".

### 8.13 Balıkçılık
- 3B sahne tam ekran. Sağ alt: **Çek** düğmesi 200 çap (yetenek kümesiyle aynı yerde: alışkanlık). Ekranın sağ kenarında dikey gerginlik çubuğu 48 × 640. Yakalanan balık orta pencere olarak.

### 8.14 Sohbet
- Kapalıyken: sol alt şerit 640 × 180 (son 3 mesaj, 34 dp yazı).
- Açıkken: **soldan kayan panel**, genişlik 960 dp, tam yükseklik (güvenli alan içi). Üstte kanal sekmeleri (Dünya, Klan, Parti, Özel; 104 yük.), altta yazı kutusu 120 yük. + Gönder 120 × 120. Sahne sağda görünür kalır.

### 8.15 Yükleme ve açılış
- Arka plan görseli tam ekran (2400 × 1080 olarak teslim; tablette kenarlardan kırpılır, kritik içerik ortadaki 1440'ta).
- Logo üst orta, genişliği 960. Yükleme çubuğu alt orta 1200 × 24, alttan 160. İpucu/alıntı çubuğun 32 üstünde, 34 dp, ortalı, en fazla 2 satır.

### 8.16 Öğretici
- Delikli karartma (%75), vurgulanan öğenin çevresinde 16 dp pay + nabız halkası. Açıklama balonu 720 dp genişlik, vurgulanan öğenin karşı tarafında; hiçbir zaman vurguyu örtmez. El işareti 160 dp.

---

## 9. Hareket ve süreler

| Olay | Süre | Eğri |
|---|---|---|
| Düğmeye basma | 80 ms, %96 ölçek | ease-out |
| Panel açılış | 240 ms (ölçek 0.96→1 + saydamlık) | ease-out |
| Panel kapanış | 180 ms | ease-in |
| Yandan kayan panel | 280 ms | ease-out |
| Toast giriş / çıkış | 200 ms / 200 ms, ekranda 2.5 sn | — |
| Sekme değişimi | 160 ms (çapraz geçiş) | ease-in-out |
| Ödül kartı dönüşü | kart başına 300 ms, aralık 120 ms | ease-out |
| Ekran geçişi (kül perdesi) | 400 ms kararma + 400 ms açılma | ease-in-out |

**Kural:** Hiçbir arayüz hareketi 400 ms'yi geçmez (sinematik geçişler hariç). Oyuncu "Hareketi azalt" seçerse yalnızca saydamlık geçişi kalır.

---

## 10. Uyarlama kuralları (farklı ekranlar)

1. **Genişlik büyüdükçe** (telefon 2400 dp): kenara çapalı öğeler kenarda kalır, arası sahneye açılır. Paneller **en fazla 1920 dp** genişler, ortalanır.
2. **Genişlik küçüldükçe** (tablet 1440–1600 dp):
   - Sol ray (görev izleyici) 440 → 360 dp.
   - Sağ ray düğmeleri tek sütunda kalır; 5'ten fazlası "⋯" altına girer.
   - Ana ekranda SAVAŞ 400 → 320 dp; duyuru şeridi 880 → 640 dp.
   - Karakter oluşturma sınıf kartları 2×2.
   - Savaşta oyuncu takımı %16–%40 aralığına kayar; düşmanlar %50'den başlar ve sağ alt yetenek kutusunun (600 dp) solunda biter.
3. **Yükseklik hiç değişmez** (hep 1080 dp); dikey düzen sabittir. Bu, ahengin güvencesidir.
4. Masaüstünde (fare): dokunma hedefleri küçültülmez; yalnızca üzerine gelince (hover) parlama eklenir.

---

## 11. Teslim: Senden ne bekleniyor

1. **`tokens.css`:** Bu belgedeki bütün sayıların değişken karşılığı. Örnek:
   ```css
   :root {
     /* --s oyun kodundan gelir: ekran yüksekliği / 1080, en fazla 1 */
     --s: 0.361;
     --dp: calc(var(--s) * 1px);
     --b1: calc(8 * var(--dp));  --b2: calc(16 * var(--dp)); --b3: calc(24 * var(--dp));
     --b4: calc(32 * var(--dp)); --b5: calc(48 * var(--dp)); --b6: calc(64 * var(--dp));
     --topbar-h: calc(136 * var(--dp));
     --dock-h:   calc(152 * var(--dp));
     --tap-min:  calc(120 * var(--dp));
     --fs-body:  calc(38 * var(--dp));
     /* ... */
   }
   ```
   Güvenli alanlar için oyunun mevcut değişkenlerini kullan: `--sat`, `--sab`, `--sal`, `--sar` (CSS px; dp'ye çevirme). Mantıksal ekran boyutu: `--lw`, `--lh`.
2. **Her ekran için tek dosyalık HTML maketi** (`maket/hub.html`, `maket/savas.html` …). Yalnızca `tokens.css` + o ekranın CSS'i; sahne yerine düz bir arka plan görseli; harici bağlantı yok. Pencere boyutu değişince Bölüm 10'daki kurallara göre uyum sağlamalı. Maketlerde ölçüleri gösteren bir "ölçü katmanı" düğmesi olsun (güvenli alan, kenar boşluğu, bölgeler).
3. Her maketin **2340 × 1080** ve **1440 × 1080** ekran görüntüsü (PNG).
4. **`BILESENLER.md`:** Her bileşenin adı, dp ölçüsü, durumları ve hangi ekranlarda kullanıldığı.
5. Bu belgeden saptığın her nokta için bir satır gerekçe.

---

## 12. Kontrol listesi

- [ ] Bütün ölçüler 8'in katı; boşluklar yalnızca `b1–b7`.
- [ ] Hiçbir dokunma hedefi 120 dp'den küçük değil; aralarında en az 16 dp var.
- [ ] Hiçbir cümle 34 dp'den küçük değil.
- [ ] Geri her ekranda A'da, birincil düğme her ekranda G'de, kaynaklar her ekranda C'de ve aynı sırada.
- [ ] Çentik bölgesinde (sol/sağ 130 dp) metin ve düğme yok.
- [ ] Her ekranda tek birincil düğme var.
- [ ] Kritik içerik 1440 × 1080 güvenli çekirdekte; tablet maketinde hiçbir şey kesilmiyor.
- [ ] Savaşta yetenek kümesi hiçbir birimin üstünü kapatmıyor (ayrılmış köşe kutuları boş); sağ başparmakla hepsine ulaşılıyor.
- [ ] 1440 dp genişlikte ana ekranda dock, sohbet ve SAVAŞ çakışmıyor.
- [ ] Panel ekranlarının hepsi 8.2 şablonunu kullanıyor.
- [ ] Türkçe büyük harfler (İ, I, Ş, Ğ, Ç, Ö, Ü) başlıklarda doğru.
