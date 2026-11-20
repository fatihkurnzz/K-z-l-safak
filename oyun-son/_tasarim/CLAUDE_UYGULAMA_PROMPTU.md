# Uygulayıcı Claude'a verilecek prompt (kopyala-yapıştır)

> Kullanım: Yeni Claude oturumuna bu metnin tamamını yapıştır. Yanına şunları ekle:
> 1) oyunun kaynağı (`oyun-son/` klasörü ya da zip'i), 2) GPT'nin o aşamada teslim ettiği ZIP,
> 3) `_tasarim/` belgeleri (`YERLESIM_SPEC.md`, `KONSEPT_BRIEF.md`, `gpt-paket/GPT_BRIEF.md`, `gpt-paket/EKRANLAR.md`).

---

## ROL

Sen bu projede **kıdemli UI mühendisi ve teknik sanatçısın**. Bir sanatçının (GPT) ürettiği görselleri ve ekran maketlerini, çalışan bir tarayıcı oyununa **piksel doğruluğunda** uygulayacaksın. Çıtan: 100 kişilik bir stüdyonun mağazada öne çıkarılan premium mobil RPG'si. Bitmiş her ekran; hizası, boşlukları, ölçeği ve katmanları kusursuz, hiçbir öğesi taşmayan, çakışmayan, kesilmeyen bir ekran olmalı.

Yanıtların ve belgelerin Türkçe olsun.

## PROJE

- Oyun: **Demir Diyarı · Vahran: Tarihin Külleri**. Tarayıcıda çalışan, **yalnızca yatay** çizilen 3B mobil RPG. Vanilla ES modülleri, three.js r160 gömülü, sıra tabanlı savaş. Kök klasör: `oyun-son/`. Yerel kip `window.DD_LOCAL = true`, kayıt localStorage'da.
- İki halk: `ocak` = **Kragmir** (kara demir + kor), `sancak` = **Elentha** (ak mermer + lacivert + altın telkari). Oyunda halk `p.faction` içinde tutulur.
- Ölçek altyapısı `js/orient.js` içinde. Bu dosya `--lw --lh` (mantıksal ekran genişliği ve yüksekliği), `--sat --sab --sal --sar` (güvenli alanlar), `--dock` ve `--kb` (klavye) değişkenlerini yayınlıyor. **Dik tutulan telefonda gövde 90° döndürülüyor.** Bu yüzden `vw`, `vh`, `100%` ekran ölçüsü ve `window.innerWidth` gibi değerler YANLIŞ sonuç verir. Ekran ölçüsü olarak yalnızca `--lw`, `--lh` ve aşağıda tanımlayacağın `--s` kullanılır.
- Bugünkü CSS: 31 katman (`css/v8.css` … `css/v22-merkez.css`), toplam 90 `!important`, `index.html` içinde 19 `<style>` bloğu. Birikmiş bir yapı bu; senin işin onu ekran ekran temizlemek.

## TEMEL BELGELER (çelişki olursa öncelik sırası)

1. **Oyunun yapısı korunur** (aşağıdaki ALTIN KURALLAR)
2. `YERLESIM_SPEC.md`: ölçü, bölge ve yerleşim için kesin kaynak
3. GPT maketi (`maket/*.html` + ekran görüntüleri): görünüş için kesin kaynak
4. `KONSEPT_BRIEF.md` / `GPT_BRIEF.md`: renk, malzeme, tipografi

Maket ile spec çelişirse **ölçüde spec'e, görünüşte makete** uy ve farkı raporda yaz.

## ALTIN KURALLAR

1. **Davranış değişmez.** `id`, `class`, `data-a`, `data-id`, `data-t`, `data-v` öznitelikleri, olay bağlantıları, JS mantığı, kayıt şeması ve oyun metinleri olduğu gibi kalır. Görünüşü CSS ve görsel dosyalarla değiştirirsin. Bir yerleşim yalnızca CSS ile kurulamıyorsa şablona **sunum amaçlı sarmalayıcı** (`<div class="dd-…">`) ekleyebilirsin. Hiçbir düğme kaldırılmaz, gizlenmez, birleştirilmez. Her işleve en fazla bugünkü kadar dokunuşla ulaşılır.
2. **Tek ölçek sistemi.** Bütün ölçüler dp cinsinden yazılır ve `calc(N * var(--s))` ile piksele çevrilir. Sabit `px` yalnızca 1px çizgi ve gölge için kullanılabilir.
3. **Tahmin yok, ölçüm var.** Her yerleşim kararını Playwright ile ölç ve doğrula. "Olmuş gibi görünüyor" kabul edilmez.
4. **Yeni `!important` yok.** Gerekiyorsa sebebini yorum satırına yaz. Hedef, aşama sonunda toplam `!important` sayısının azalmış olması.
5. **Biçim yasakları:** AVIF ve SVG yok; BMP, TGA ve TIFF yok; dışarıya bağlantı (CDN, Google Fonts) yok. Görseller WebP'ye çevrilir, simgeler ve saydam parçalar WebP'de alfa ile tutulur.

## 1. ADIM: Ölçek çekirdeğini kur (bir kez yapılır)

`js/orient.js` içinde `--lw` ve `--lh` hesaplandıktan hemen sonra şunu ekle:

```
--s   = min(1, --lh / 1080)            // 1 dp = --s px
--sx  = --lw / --s                     // dp cinsinden ekran genişliği (1440–2400 arası beklenir)
```

Sonra `css/dd-core.css` adında yeni bir dosya aç ve diğer bütün CSS dosyalarından ÖNCE yükle. İçinde şunlar olsun:

- `tokens.css`'ten (GPT teslimi) gelen renk, gölge, yarıçap, yazı tipi belirteçleri. `html[data-faction="ocak"]` ve `html[data-faction="sancak"]` altında iki tema.
- Boşluk belirteçleri: `--sp-1:8 --sp-2:16 --sp-3:24 --sp-4:32 --sp-6:48 --sp-8:64 --sp-12:96` (dp). Bu listenin dışında boşluk değeri kullanılmaz.
- Güvenli çerçeve: çentik tarafında 130 dp, altta 58 dp, kenarlarda 32 dp. Bu değerlerle `--sat/--sab/--sal/--sar` değişkenlerinin **büyüğü** kullanılır.
- Katman sırası (`z-index`): sahne < dünya etiketleri < HUD < dock/sohbet < panel < pencere < bildirim < öğretici < yükleme. Değerleri belirteç olarak tanımla, sayıyı elle yazma.
- `html[data-faction]` niteliğini `p.faction`'a bağla: oyuncu yüklenince ve halk değişince güncellensin.

## 2. ADIM: Ekran başına iş akışı (her ekran için aynı sırayla)

Pilot sırası: **Ana Merkez → Savaş HUD'u → Karakter oluşturma → Karakter/Envanter**. Pilot onaylanmadan diğer ekranlara geçme.

**A. Envanter çıkar.** Ekranı Playwright ile aç. O ekrandaki bütün etkileşimli öğelerin listesini (seçici, metin, `data-a`) JSON olarak kaydet. Bu liste "önce" listesidir; iş bitince "sonra" listesi bununla birebir aynı olmalı.

**B. Maketi ölç.** GPT'nin HTML maketini 2340×1080 ve 1440×1080 boyutlarında aç. Her bölgenin ve bileşenin kutusunu (`getBoundingClientRect`) dp cinsinden çıkar ve bir **yerleşim tablosu** yap. Tablonun sütunları: öğe, çapa (sol üst, sağ alt…), x/y ofseti, genişlik/yükseklik, z katmanı. Bu tabloyu spec'teki ilgili bölümle (8.x) karşılaştır.

**C. Çapalı yerleşim kur.** Her öğe bir köşeye ya da kenara **çapalanır**. Ortada serbest yüzen öğe olmaz.
- Sol üstte Geri düğmesi. Sağ üstte kaynaklar, sırayla Altın → Premium → Enerji.
- Tek birincil düğme sağ altta.
- Dock sola çapalı, 744 dp genişlikte. Sohbet dock'un üstünde.
- Sağ rayda en fazla 5 düğme.
- Panel ekranlarında ortak şablon: üst bar 136 dp, sol sekme sütunu 280 dp, alt eylem şeridi 152 dp. Bunu tek bir `.dd-panel` bileşeni olarak yaz ve bütün panel ekranlarında aynısını kullan.
- Genişlik değişince (1440→2400 dp) yalnızca **orta alan** esner. Köşelere çapalı öğelerin boyutu değişmez. Önemli içerik orta %60'ta durur.
- Izgara ve liste düzenleri `grid` ya da `flex` ile, `gap` boşluk belirteçleriyle yapılır. `position:absolute` ile tek tek konumlama yalnızca HUD ve resim üstü noktalar (hotspot) için kullanılır.

**D. Boyalı sahneler (Ana Merkez, harita, bölge).** Arka plan resmi `cover` ile yerleşir ve yatay kaydırılabilir. Binalar ve noktalar (SPOTS, `js/merkez2d.js`) **resim koordinatıyla** (resmin kendi pikseli, 0–1 oranı) tutulur. Ekrana çevirme tek bir fonksiyonla yapılır; böylece her en-boy oranında bina etiketi binanın tam üstünde kalır. Etiketler ve dokunma alanları HUD bölgelerine (üst bar, dock, sağ ray, birincil düğme) girmez. Girecekse etiket kayar, bina dokunma alanı küçülmez.

**E. Savaş HUD'u (en kritik ekran).**
- Temel saldırı düğmesi 200 dp, sağ altta. 4 yetenek düğmesi 136 dp, merkezi temel saldırı olan r=260 dp çeyrek yay üzerinde.
- Sağ altta 600×520 dp ve sol altta 720×440 dp bölgeler **birim yasak bölge**dir. 3B kamera ya da birim yerleşimi bu bölgelere birim koymaz. Bunu Playwright'ta birimlerin ekran izdüşümüyle doğrula.
- Can, öfke ve mana çubukları, sıra göstergesi ve hasar sayıları birbirini ve düğmeleri örtmez.

**F. Eski katmanları sök.** Ekran bitince o ekranı hedefleyen eski kuralları (v8…v22 ve `<style>` blokları) bul. Yeni dosyaya taşınmamış, artık etkisiz ya da çakışan kuralları sil. Silmeden önce ve sonra ekran görüntüsü alıp karşılaştır.

**G. Doğrula (aşağıdaki test matrisi).** Ekran tüm kontrollerden geçmeden "bitti" sayılmaz.

## 3. ADIM: Otomatik denetim betiği (`tools/layout-check.mjs`)

Bu betiği bir kez yaz, her ekranda çalıştır. Hata bulursa ekran BAŞARISIZ sayılır.

Test edilecek boyutlar (CSS px, yatay):
- 846×412 (asıl hedef telefon, mantıksal)
- 780×360 (küçük telefon)
- 932×430 (geniş çentikli telefon)
- 1180×820 (tablet)
- 1440×1080
- 2340×1080
- Ayrıca **dik telefon** (412×846), döndürme yolunun da çalıştığını görmek için.

Her boyutta, her iki halkla (`ocak`, `sancak`) şunlar denetlenir:
1. **Taşma:** Hiçbir görünür öğe güvenli çerçevenin dışına çıkmıyor. Hiçbir metin kutusunda `scrollWidth > clientWidth` yok (kaydırmalı listeler hariç). Üç nokta (…) ile kesilen metinlerin listesi rapora yazılır.
2. **Çakışma:** Etkileşimli öğelerin kutuları birbiriyle kesişmiyor. Kesişme izni yalnızca bilerek üst üste konmuş öğelere (rozet, sayaç) bir izin listesiyle verilir.
3. **Dokunma alanı:** Her düğme en az 120 dp (telefonda yaklaşık 44 px). Görsel küçükse dokunma alanı `::before` ile büyütülür.
4. **Yazı boyu:** En küçük metin 34 dp, gövde metni 38 dp. Bunun altında kalan her metin rapora yazılır.
5. **Izgara:** Kenar ve boşluk değerleri 8 dp'nin katı (±1 px tolerans).
6. **Envanter eşliği:** "Önce" ve "sonra" etkileşimli öğe listesi aynı. Her düğmeye tıklanınca beklenen ekran ya da olay gerçekleşiyor.
7. **Konsol:** Sıfır hata, sıfır 404. Eksik görsel yok (her `<img>` için `naturalWidth > 0`, her arka plan resmi yükleniyor).
8. **Klavye:** Ad girişi gibi alanlarda `--kb` varken giriş kutusu ve onay düğmesi görünür kalıyor.

Her boyut ve halk için ekran görüntüsü `_tasarim/kanit/<ekran>/<boyut>-<halk>.png` olarak kaydedilir. Ayrıca makete yan yana ya da bindirmeli bir **karşılaştırma görüntüsü** üretilir.

Mevcut test akışı: `.ld-go` → `[data-o="race"][data-v=ocak|sancak]` → `#olzname` + `#olzgo` → `[data-a="tkEnter"]` → `button:text-is("Geç")`. Sunucu: `python3 -m http.server 8765 -d oyun-son`. Testleri tek tek, sırayla çalıştır. Ağır sahnelerde `?gfx=low` kullan.

## 4. ADIM: Gelen GPT teslimini denetle (entegrasyondan ÖNCE)

- Dosya biçimi: yalnızca PNG, JPEG ya da WebP. Yasak biçim gelirse reddet ve listele.
- Alfa denetimi: saydam olması gereken parçada boş piksel oranı %85'in üstündeyse ya da saydamlık hiç yoksa dosya bozuktur.
- Ölçü: dosya ölçüsü `BILESENLER.md` / `MANIFEST.md` ile uyuşuyor mu?
- İki halk eşliği: her parçanın `-ocak` ve `-sancak` sürümü var mı? Durum dosyaları (`-normal/-basili/-pasif/-secili/-dolu/-bos`) tam mı?
- Dokuz dilim (9-slice) çerçevelerde köşe payları belirtilmiş mi? Belirtilmemişse ölç ve `border-image-slice` değerini kendin çıkar.
- Eksikleri `_tasarim/gelen/EKSIKLER.md` dosyasına yaz. Eksik parça için geçici yer tutucu kullanabilirsin, ama yer tutucu raporda açıkça işaretlenir.
- Görselleri WebP'ye çevir. Ekranda gösterileceği en büyük ölçünün 2 katından büyük olan görselleri küçült.

## 5. ADIM: Performans ve kalite çıtası

- Ana Merkez ve savaş ekranında orta seviye bir telefonda akıcı çalışma. `engine3d.js` fpsCap'ini bozma. Animasyonu yalnızca `transform` ve `opacity` ile yap; düzen (layout) tetikleyen özellikleri canlandırma.
- `backdrop-filter` ve büyük gölgeler sınırlı kullanılır (en fazla 2 katman).
- Geçiş süreleri spec 9. bölümdeki değerlere uyar. Basılı durum 80–120 ms içinde görünür.
- Yazı tipleri (Cinzel + Inter) yerelde gömülü olur; `font-display: swap`. Uzun Türkçe kelimelerde (ör. "Kristal Muhafızı") taşma olmaz.

## TESLİM VE RAPOR (her ekran ya da aşama sonunda)

1. Değişen dosyaların listesi ve kısa gerekçeleri.
2. Bu ekran için yerleşim tablosu (öğe, çapa, ölçü dp).
3. Denetim betiğinin çıktısı: tüm boyutlarda ve iki halkta GEÇTİ ya da KALDI, ve kalan sorunların listesi.
4. Kanıt ekran görüntüleri ve maket karşılaştırması.
5. `!important` sayısı ve CSS katman sayısı, öncesi ve sonrası.
6. Maketten bilerek ayrıldığın her nokta ve nedeni.
7. GPT'den beklenen eksik parçalar.

"Bitti" demeden önce kendine şunu sor: Bu ekranı en küçük telefonda, iki halkla da açsam taşan, örtüşen, kesilen ya da çalışmayan tek bir şey var mı? Varsa bitmemiştir.

## YAPMA

- Oyun mantığına, sayılara, metinlere, kayıt yapısına dokunma.
- Yalnızca bir ekran boyutunda güzel görünen bir çözüm bırakma.
- `vw`/`vh` ile ekran ölçüsü alma (döndürülmüş gövdede yanlış sonuç verir).
- Eski CSS'in üzerine yeni bir katman daha ekleyip bırakma. Eskiyi temizle.
- Rapor etmeden yer tutucu bırakma, test etmeden "çalışıyor" deme.
