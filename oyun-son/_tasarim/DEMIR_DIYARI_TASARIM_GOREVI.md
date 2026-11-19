# DEMİR DİYARI · Görsel Yeniden Tasarım Görev Belgesi
### Tek belge: sanat (GPT) + oyuna uygulama (Claude) · "Vahran: Tarihin Külleri"

> Bu belge iki yapay zekâya **aynen** gönderilir. Bütün belgeyi ikiniz de okuyun; size ait bölümler başlıkta belirtilmiştir.
>
> - **GPT (sanat ve tasarım):** Grafikleri, arayüz parçalarını, simgeleri, arka planları, portreleri, efektleri ve **oyunun gerçek ekranlarının yeniden tasarlanmış maketlerini** üretir. → Bölüm 0–10 ve 11.
> - **Claude (uygulama):** GPT'nin teslimini denetler, oyunun kaynak koduna uygular, yerleşimi CSS ile kurar ve oyunun hatasız çalıştığını kanıtlar. → Bölüm 0–10 ve 12.
>
> Belgenin ekleri (aynı zip içinde): `ekranlar/` (oyunun bugünkü hâlinin ekran görüntüleri), `dom/` (aynı ekranların gerçek HTML yapısı), `oyun-kaynak/` (oyunun **tam kaynak kodu**, çalışır hâlde), Ek A (ekran listesi ve görüntüsü alınamayan ekranların tarifi), Ek B (hikâyenin tam metni).
>
> **Çelişki olursa öncelik sırası:** Bölüm 1 (yapıyı koruma kuralları) > Bölüm 4–5 (ölçü ve yerleşim) > Bölüm 3 (görsel kimlik) > hikâye metni (Ek B: söz, yer ve karakterlerde esas).

---

## 0. Görev tek cümlede

Çalışan bir mobil RPG var: **Demir Diyarı**. Oyunun kuralları, ekranları, düğmeleri ve akışı **olduğu gibi kalacak**; değişecek olan **görünüşü ve yerleşimi**. Hedef, arkasında 100 kişilik bir stüdyo olan, mağazada öne çıkarılan premium bir mobil RPG kalitesi. Her ekran "bitmiş ürün" gibi görünmeli: tutarlı ışık, tutarlı malzeme dili, cömert ama düzenli süsleme, okunaklı Türkçe tipografi, akıcı geçişler. **Hata kabul edilmez:** bozuk simge, eksik dosya, çalışmayan düğme, taşan yazı ya da konsol hatası olmamalı.

---

## 1. ALTIN KURAL: Oyunun yapısı korunur (ikiniz için de zorunlu)

Bu oyun yüzlerce ekran parçası, 300'e yakın dosya ve çalışan bir kayıt sistemiyle **bitmiş bir oyundur**. Bu iş sıfırdan oyun tasarlamak değildir; **var olan oyunu giydirmektir.**

### 1.1 Değişmeyecek olanlar
1. **Ekranlar ve içerikleri.** Hangi ekranda hangi düğme, sekme, liste, sayı ve yazı varsa yeni tasarımda da **hepsi** var. Ekran kaldırılmaz, birleştirilmez, yeni ekran uydurulmaz.
2. **Oyun kuralları, sayılar, denge, kayıt yapısı, metinler.** Yazılar oyundaki gerçek yazılardır (Türkçe). Maketlerde "Lorem", "BİRİM", "KARŞILAŞMA" gibi uydurma yer tutucu kullanılmaz; ekran görüntüsündeki gerçek metin kullanılır.
3. **Kod yapısı (Claude için).** `id`, `class`, `data-a`, `data-id`, `data-t`, `data-v` gibi öznitelikler, olay bağlantıları, JavaScript mantığı ve kayıt şeması değişmez. Görünüş **CSS ve görsel dosyalarla** değişir. Bir yerleşim, var olan HTML'e yalnızca CSS ile kurulamıyorsa ilgili şablona **sunum amaçlı sarmalayıcı** eklenebilir; davranış değişmez.
4. **Erişilebilirlik:** Her işlev yeni tasarımda da **en fazla aynı sayıda dokunuşla** ulaşılır olmalı.

### 1.2 Değişebilecek olanlar
- Renkler, malzemeler, çerçeveler, düğme biçimleri, simgeler, arka planlar, portreler, efektler, yazı boyutları, aralıklar.
- **Konumlar:** Bir düğme ya da panel Bölüm 5'teki yerleşime göre başka bir köşeye taşınabilir.
- **Gruplama:** Bir bölgeye sığmayan düğmeler "Daha fazla (⋯)" altında toplanabilir. Bu durumda işlev kaybolmaz, yalnızca yeri değişir; maket notunda hangi düğmenin nereye gittiği yazılır.

### 1.3 "Genel taslak" yasağı
Her maket, `ekranlar/` klasöründeki **o ekranın gerçek görüntüsünden** başlar. O ekrandaki her öğe yeni maketde bulunur ve yerini gösteren bir eşleşme notu verilir: "eski: sol üst profil kartı → yeni: A bölgesi portre bloğu". Oyunda olmayan şeyler maketlere eklenmez (örnek: oyunda "Yetenek" ayrı bir menü değildir, **Karakter** penceresinin bir sekmesidir; maket buna uyar).

---

## 2. İlk teslimden çıkan dersler (bunlar tekrarlanırsa teslim reddedilir)

İlk paket incelendi ve oyuna eklenemedi. Nedenleri:

| # | Sorun | Bundan sonraki kural |
|---|---|---|
| 1 | 28 sistem simgesinin ve eşya/yetenek simgelerinin çoğunun içinde **boş kutu (□)** var: simgeler yazı tipi glifiyle çizilmiş, glif bulunamamış. 20 dosya bayt bayt **aynı**. | Simgeler **gerçek çizim** olmalı; yazı tipi glifi ve emoji ile simge yapılmaz. Her dosya teslimden önce gözle açılıp denetlenir. İki dosya aynı olamaz. |
| 2 | Ekran maketleri oyunun ekranları değil; her ekran aynı genel iskelet ("sol menü + 3 kart + sağ durum paneli"). Ana merkez, savaş, envanter birbirinin kopyası. | Maketler gerçek ekranın yeniden tasarımıdır (Bölüm 1.3). Her ekranın kendine özgü düzeni Bölüm 5'te anlatılmıştır. |
| 3 | Savaş maketinde "BİRİM" yazan kutular var; 3B sahne, sıra şeridi ve yetenek yayı spesifikasyona uymuyor. | Savaş HUD'u Bölüm 5.7'ye birebir uyar; birimler sahne görseliyle gösterilir. |
| 4 | Düğme, panel ve çubuk PNG'leri düz renkli kutular; malzeme (demir, mermer, telkari) yok. | Arayüz kiti Bölüm 3 ve 6'daki malzeme tarifine göre, iki temada ayrı ayrı ve gerçek dokulu çizilir. |
| 5 | Portreler aynı yüzsüz şablon; hikâye karakterlerinin tarifine (Bölüm 7.2) uymuyor. | Her karakter kendi tarifine göre ayrı ayrı çizilir. |
| 6 | Kragmir çubuk renkleri karışık (can çubuğu kırmızı değil vb.), tema seçimi `kragmir/elentha` ile yazılmış. | Can kırmızı, mana mavi, XP altın. Oyunda tema anahtarı **`ocak`** (Kragmir) ve **`sancak`** (Elentha): Bölüm 4.5. |
| 7 | Yalnızca 1 arka plan, 1 örnek VFX sayfası var. | Bölüm 7.4'teki her bölge ve şehir için arka plan; Bölüm 7.5'teki her dal için VFX. Pilot aşamada eksik olan, listede "sonraki pakette" diye açıkça işaretlenir. |

**Beğenilen ve korunacak olanlar:** `bg-vahran-ovasi.jpg` (Vahran Ovası) ve `konsept/hub-art-direction-reference.jpg` (ana merkez sanat yönü) kalite çıtasıdır. Bütün yeni görseller bu ikisinin ışık, renk ve detay seviyesinde olmalı.

---

## 3. Oyunun kendisi: bugünkü durum

### 3.1 Kısa tanım
- **Tür:** Sıra tabanlı, belirlenimci savaşlı, karakter gelişimli, klan ve PvP'li 3B mobil RPG. Tarayıcıda çalışır (three.js r160, vanilla JavaScript ES modülleri, düz CSS). Telefonda ve masaüstünde açılır.
- **Ekran yönü:** **YALNIZCA YATAY.** Telefon dik tutulsa bile oyun yatay çizilir (gövde 90° döndürülür). Bütün tasarımlar yatay.
- **İki halk** (oyuncu birini seçer; arayüz teması buna göre değişir):
  - **Kragmir** (ork, oyundaki anahtar `ocak`): Dağın içindeki demir krallığı. Kral Volgar Demirdiş'in halkı. Sözleri: *"Toprak, çekice boyun eğer."*
  - **Elentha** (insan, anahtar `sancak`): Beyaz taştan kuleler ve mavi sancaklar krallığı. Kral Edran'ın halkı. Sözleri: *"Çelik bile bir gün paslanır."*
- **Dört sınıf** (iki halkta da var, görünüm halka göre değişir):

| Sınıf | Rol | Silahlar | Zırh | Yetenek dalları |
|---|---|---|---|---|
| Savaşçı | Ön hat, tank / ağır vuruş | kılıç, iki elli balta, kalkan | plaka | Hücum · Siper · Öfke |
| Suikastçı | Hız, tek hedef hasarı | hançer, yay | deri | Hançer · Yay · İz |
| Şifacı | Şifa, rün mührü, kara rün | gürz, kalkan | zincir | Şifa · Rün Mührü · Kara Rün |
| Büyücü | Alan hasarı, kontrol | asa | cübbe | Ateş · Buz · Yıldırım |

- **Bölgeler:** Vahran Ovası (Sv 1–20) → Kül Geçidi (20–40) → Kızıl Bahar Meydanı (40–60) → Sisli Çukur (60–65). Her bölgede 25 aşama, her 5 aşamada bir kapı (boss). Ayrıca mezarlık zindanları. Oyun **Kemikli Koru** adlı öğretici ormanında başlar.
- **Bosslar:** Dev Solucan, Tepegöz, Kristal Muhafızı, Lav Yürek, Kül Ağası Karadun, Mareşal Marven, **Adsız, Tarikat Lideri** (son boss).
- **Sistemler:** Klan, Hisar (kuşatma), Meydan/Arena (PvP), Baskın, Zindan, Nöbet, Balıkçılık, Çarşı, Karaborsa, Kervan (mağaza), Premium, Kader Çarkı, Sandık, Örs (güçlendirme), Maden, İksir ve Parşömen, Taş Yemini, Kral Otağı, Ana görev (64 adım / 16 bölüm) ve günlük/haftalık/aylık görevler, Rütbe, Başarım, Unvan, Parti, Sohbet, Posta, Arkadaş, Ansiklopedi, Rehber, Öğretici, Duyuru, Bildirim, Takvim, Kaplamalar, Mini dizi ve Fragman.

### 3.2 Ekran görüntüleri ve HTML yapısı
- `ekranlar/` klasöründe oyunun **bugünkü** her ekranının görüntüsü vardır (2340 × 1080, yaygın telefonun yatay görüntüsü). Dosya adı ekranı söyler: `003-insan-ana-merkez.png`, `013-insan-karakter-sekme-skill.png` gibi. `insan` = Elentha teması, `ork` = Kragmir teması.
- `dom/` klasöründe aynı adla her ekranın **gerçek HTML'i** vardır (komut dosyaları ve uzun görsel verileri kısaltılmış). Ekranda hangi öğenin hangi `id`/`class` ile yazıldığını buradan görürsünüz.
- **GPT:** Her maketi bu görüntüden başlat; görüntüdeki her öğeyi yeni tasarımda göster (Bölüm 1.3).
- **Claude:** CSS'i bu HTML'deki gerçek seçicilere yaz; tahmin etme, `dom/` ve kaynak koddan doğrula.
- `oyun-kaynak/` klasörü oyunun kendisidir. Çalıştırmak için klasörde `python3 -m http.server 8765` ve tarayıcıda `http://localhost:8765/?gfx=low`. GPT ekranların içeriğini ve metinlerini buradan da okuyabilir (`js/ui-*.js` dosyaları her ekranın HTML şablonunu üretir). Claude değişiklikleri bu kodun üzerinde yapar.
- Tam liste ve görüntüsü alınamayan ekranların tarifi: **Ek A**.

### 3.3 Oyunun bugünkü görsel altyapısı (Claude için bilgi, GPT için bağlam)
- Kök: `oyun-son/`. Giriş `index.html` (309 KB, içinde 19 `<style>` bloğu) + `css/` altında 31 katman (`v8.css` … `v16-korant.css`, en sonda `v13-hub.css` yüklenir). Toplam 90 `!important` var. Yazı tipleri `css/fonts.css` (Cinzel, Inter; yerel woff2).
- Ölçek değişkenleri `js/orient.js`'te üretilir: `--lw`, `--lh` (mantıksal ekran), `--sat --sab --sal --sar` (güvenli alan), `--dock`, `--kb` (klavye). Sınıflar: `html.rot` (döndürülmüş dik telefon), `html.short` (yükseklik ≤ 480), `html.tiny`.
- Tema: `html[data-faction="ocak"]` (Kragmir) ve `html[data-faction="sancak"]` (Elentha); oyun bunu zaten koyuyor (`js/ui-hub.js` `setMood`). Ayrıca `html[data-place]` (`capital`, `carsi`, `klan`).
- Simgeler bugün **kodla çizilmiş SVG yol verisi**: `js/icons.js`, `js/item-icons.js` ve `js/skill-icons.js` (game-icons.net, CC BY 3.0), `js/item-icons-ozgun.js`, `js/emblems.js`, `js/karakter-simge.js`. Yeni PNG simgeler bunların yerine geçecek.
- Portreler 3B modelden otomatik üretilir (`js/portraits.js`). `img/portraits.json` ile herhangi bir birime elle çizilmiş görsel verilebilir (`"warrior.ocak": "img/..."` biçiminde anahtar).
- Karakter modelleri `models/characters/*.json` + WebP dokular; silah modelleri `models/items/*.glb.js` (GLB'nin base64 gömülü hâli). Animasyon adları: `idle, run, attack, cast, cast2, combat_idle, death, hit, shoot, special, victory`.
- Açılış/yükleme görseli: `img/korant-acilis.jpg` (`css/v16-korant.css`). Uygulama simgeleri `img/icons/` (192, 512, maskable-512, apple-touch).
- Kayıt yerel (`localStorage`), sunucu yok (`window.DD_LOCAL = true`).

---

## 4. Ölçü sistemi (ikiniz için de bağlayıcı)

### 4.1 Tasarım birimi: `dp`
- Bütün ölçüler **dp** (tasarım pikseli) cinsindendir.
- **Referans yükseklik: 1080 dp.** Ekran yüksekliği hep 1080 dp sayılır; **genişlik cihaza göre esner.**
- Ölçek: `s = ekran_yüksekliği_px / 1080`, en fazla `1.0` (büyük masaüstünde arayüz büyümez; sahne büyür, arayüz ortalanır).
- Kod `--s` değişkenini yayınlar (Claude ekleyecek, Bölüm 12.3). CSS'te bir ölçü `calc(120 * var(--dp))` biçiminde yazılır; `--dp: calc(var(--s) * 1px)`.

### 4.2 Gerçek cihazlar

| Cihaz (yatay) | CSS px | s | Genişlik (dp) | En-boy |
|---|---|---|---|---|
| Küçük telefon | 667 × 375 | 0.347 | 1921 | 16:9 |
| Yaygın iPhone | 844 × 390 | 0.361 | 2338 | 19.5:9 |
| Yaygın Android | 915 × 412 | 0.381 | 2398 | 20:9 |
| Tablet | 1180 × 820 | 0.759 | 1554 | ~1.44 |
| Masaüstü | 1920 × 1080 | 1.0 | 1920 | 16:9 |

- Tasarım genişliği **1440 ile 2400 dp** arasında değişir.
- **Ana maket: 2340 × 1080 dp.** Her ekranın **1440 × 1080** (tablet) uyarlaması da istenir.
- **Güvenli çekirdek:** ortadaki **1440 × 1080**. Kritik içerik (ana paneller, diyalog, sonuç kartı) buraya sığar.
- Kenarlara çapalı öğeler (üst bar, kaynaklar, yetenekler, menü) kenarla birlikte gider; arası 3B sahneye kalır.

### 4.3 En küçük ölçüler (telefonda s ≈ 0.36)

| Kural | dp | Telefonda |
|---|---|---|
| **En küçük dokunma hedefi** | **120 × 120** | ~43 px |
| Tercih edilen dokunma hedefi | 136 × 136 | ~49 px |
| İki dokunma hedefi arası | en az 16 | ~6 px |
| **En küçük cümle yazısı** | **34** | ~12 px |
| Yalnızca sayı / rozet | 28 | ~10 px |
| Gövde yazısı | 38 | ~14 px |

Görsel olarak küçük bir öğe (örneğin 72 dp'lik kapat simgesi) **120 dp dokunma alanı** taşır (görünmez dolgu).

### 4.4 Güvenli alan ve kenar
- Sol/sağ **çentik bölgesi 130 dp** (`--sal`, `--sar`): buraya metin ve düğme konmaz, yalnızca arka plan ve süs uzanır.
- Alt **ana ekran çizgisi 58 dp** (`--sab`).
- Güvenli alanın içinde **kenar boşluğu 32 dp**. Yani soldan/sağdan **162 dp**, alttan **90 dp**.
- Maketlerde üç çizgiyi açık renkle gösteren bir **ölçü katmanı** olsun: ekran kenarı, güvenli alan, kenar boşluğu.

### 4.5 Izgara ve boşluk
- Taban birim **8 dp**; bütün ölçüler 8'in katı (istisna: 4 dp ince kenar).
- Boşluk ölçeği yalnızca: `b1` 8 · `b2` 16 · `b3` 24 · `b4` 32 · `b5` 48 · `b6` 64 · `b7` 96.
- Panel içleri 12 sütun, sütun aralığı 24 dp.

### 4.6 Katmanlar (z sırası)

| Katman | z | İçerik |
|---|---|---|
| 0 | 0 | 3B sahne |
| 1 | 10 | Sahneye bağlı arayüz: isim plakaları, birim çubukları, hasar sayıları |
| 2 | 100 | HUD: üst bar, kaynaklar, menü düğmeleri, yetenekler, sohbet şeridi |
| 3 | 200 | Panel / pencere, arkasında %60 karartma |
| 4 | 300 | Modal (onay, ödül), arkasında %70 karartma |
| 5 | 400 | Toast / bildirim |
| 6 | 500 | Öğretici vurgusu |
| 7 | 900 | Yükleme ve geçiş perdesi |

Aynı anda en fazla bir panel ve bir modal. Panel açıkken HUD'un yalnızca üst barı görünür.

### 4.7 Tipografi ölçeği

| Rol | Yazı tipi | dp | Satır |
|---|---|---|---|
| Ekran adı / büyük başlık | Cinzel 900 | 72 | 1.1 |
| Başlık 1 | Cinzel 700 | 56 | 1.15 |
| Başlık 2 / pencere başlığı | Cinzel 700 | 48 | 1.2 |
| Başlık 3 / kart başlığı | Inter 800 | 42 | 1.25 |
| **Gövde** | Inter 400 | **38** | 1.35 |
| Gövde vurgulu / düğme | Inter 600–800 | 38–44 | 1.2 |
| Küçük (açıklama, etiket) | Inter 400/600 | 34 | 1.3 |
| Rozet sayısı | Inter 800 | 28 | 1 |
| Hasar sayısı (normal) | Inter 800 + 6 dp kontur | 72 | 1 |
| Hasar sayısı (kritik) | Inter 800 + kontur, 8° eğik | 104 | 1 |
| Boss adı (savaş girişi) | Cinzel 900 | 120 | 1 |

- Cinzel ve Inter oyunda zaten gömülü. Başka yazı tipi önerilirse: OFL lisanslı, Türkçe harfleri tam (ğ Ğ ş Ş ı İ ö Ö ü Ü ç Ç), `woff2`.
- Büyük harf yalnızca Cinzel başlıklarda. Türkçe dönüşüm **i → İ, ı → I**. Maketlerde "İKSİR", "KILIÇ", "ŞİFACI" örneği gösterilir.
- Paragraf en fazla 1200 dp genişlik. Sayılar tabular ve kalın.

### 4.8 Hareket ve süreler

| Olay | Süre |
|---|---|
| Düğmeye basma | 80 ms, %96 ölçek, ease-out |
| Panel açılış / kapanış | 240 ms / 180 ms |
| Yandan kayan panel | 280 ms |
| Toast | 200 ms giriş/çıkış, 2.5 sn ekranda |
| Sekme değişimi | 160 ms |
| Ödül kartı dönüşü | kart başına 300 ms, aralık 120 ms |
| Ekran geçişi (kül perdesi) | 400 ms kararma + 400 ms açılma |

Hiçbir arayüz hareketi 400 ms'yi geçmez (sinematik geçişler hariç). "Hareketi azalt" seçilirse yalnızca saydamlık geçişi kalır.

### 4.9 Uyarlama kuralları
1. Genişlik büyüdükçe (2400 dp): kenara çapalı öğeler kenarda kalır; paneller en fazla 1920 dp genişler, ortalanır.
2. Genişlik küçüldükçe (1440–1600 dp): sol ray 440 → 360; sağ rayda 5'ten fazlası "⋯" altına; ana ekranda SAVAŞ 400 → 320; duyuru şeridi 880 → 640; karakter oluşturmada sınıf kartları 2×2; savaşta oyuncu takımı %16–%40, düşmanlar %50'den başlar.
3. **Yükseklik hep 1080 dp**; dikey düzen sabittir.
4. Masaüstünde dokunma hedefleri küçülmez; yalnızca üzerine gelince parlama eklenir.

---

## 5. Yerleşim: bölgeler ve ekran ekran tasarım

### 5.1 Altın harita (her ekranda aynı)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ [A] KİMLİK / GERİ        [B] BAŞLIK / BİLDİRİM          [C] KAYNAKLAR+AYAR │  ← Üst bar: 136 dp
│ [D] SOL RAY                    [MERKEZ]                        [E] SAĞ RAY │
│ (görev izleyici, sekmeler)   3B sahne / içerik        (menü, hızlı erişim) │
│ [F] SOL ALT (sohbet, sosyal; savaşta iksir)      [G] SAĞ ALT (ANA EYLEM)   │
│ [H] DOCK (sola çapalı)                                                     │
└──────────────────────────────────────────────────────────────────────────┘
```

| Bölge | Ne durur | Kural |
|---|---|---|
| **A** Sol üst | Ana ekranda portre + seviye; diğer ekranlarda **Geri** + ekran adı | Geri her ekranda burada |
| **B** Üst orta | Duyuru şeridi, etkinlik sayacı; savaşta sıra şeridi | Düğme kalabalığı yok |
| **C** Sağ üst | Kaynaklar (Akçe → Yakut → Enerji), en sağda ayarlar/kapat | Sıra her ekranda aynı |
| **D** Sol ray | Görev izleyici (ana ekran), dikey sekmeler (panellerde) | 440 dp |
| **E** Sağ ray | Menü düğmeleri, filtreler | 160 dp, en fazla 5 düğme |
| **F** Sol alt | Sohbet şeridi; savaşta iksir yuvaları | Sol başparmak |
| **G** Sağ alt | **Ekranın tek ana eylemi**; savaşta yetenek kümesi | Sağ başparmak |
| **H** Alt şerit | Dock | 152 dp yükseklik, sola çapalı |

Kurallar: her ekranda **tek birincil düğme** (altın/kor) ve o **G**'dedir; yıkıcı eylemler (Sat, Sil, Ayrıl) birincil olmaz, onay modalıyla gelir; kapat (X) panelin sağ üstünde; kırmızı bildirim noktası düğmenin sağ üst köşesinde 32 dp.

> **Oyundaki adlar:** Oyunda para **Akçe**, premium para **Yakut**, enerji çubuğu enerji simgesiyle gösterilir. Maketlerde bu adlar kullanılır.

### 5.2 Ortak bileşen ölçüleri (dp)

**Düğmeler**

| Bileşen | G × Y | Yazı |
|---|---|---|
| Birincil büyük | 400 × 136 | 44 kalın |
| Birincil normal | 320 × 120 | 40 kalın |
| İkincil | 280 × 120 | 38 |
| Satır içi | en az 200 × 96 (dokunma 120) | 34 |
| Simge düğmesi | 120 × 120 (simge 72) | — |
| Dock düğmesi | 136 × 136 (simge 80 + etiket 30) | 30 |
| Kapat (X) | görünen 80, dokunma 120 | — |
| Geri | 120 × 120 | — |

Köşe yarıçapı: düğme 20, kart 24, panel 32. Çerçeve: ince 4, kalın 8.

**Üst bar:** yükseklik 136. Kaynak sayacı 280 × 88 (simge 64, sayı 38 kalın, "+" 88 × 88; dokunma alanı sayacın tamamı), sayaçlar arası 16. Portre bloğu: portre 136 × 136, isim 36, seviye rozeti 72 çap, XP çubuğu 280 × 16.

**Çubuklar:** HUD can/mana 360 × 32 / 360 × 20 · birim üstü can 180 × 20 (mana 180 × 10) · boss can çubuğu en fazla 1400 × 48 · XP 16–24 yükseklik · yükleme 1200 × 24 çatlak motifli. Can çubuğunda hasar alınınca beyaz "gecikmeli düşüş" katmanı olur.

**Kartlar ve yuvalar:** eşya yuvası 136 × 136 (simge 112), aralık 16 · küçük yuva 104 · kuşanma yuvası 152 · liste portresi 160 · karakter kartı 400 × 640 · liste satırı yükseklik 152 · ödül kartı 200 × 260 · harita düğümü 120 (boss kapısı 168) · seviye rozeti 72 · yıldız 56.

**Paneller:** tam panel (üst bar korunur) · orta pencere 1280 × 840 · küçük pencere 880 × 560 · modal 880 × en fazla 560 · alttan sayfa tam genişlik × 520 · toast en fazla 880 × 104, 2.5 sn · pencere başlık şeridi 104 (başlık 48).

**Simge boyutları (yalnızca):** 48 · 64 · 72 · 80 · 112 · 136 · 256 (teslim dosyası).

### 5.3 Ortak panel ekranı şablonu
Envanter, Klan, Görevler, Sıralama, Mağaza, Ayarlar, Rehber, Posta, Ansiklopedi, Başarım, Takvim, Bildirim, Duyuru vb. hepsi bu iskeleti kullanır:

```
┌────────────────────────────────────────────────────────────────────────────┐
│[←Geri] EKRAN ADI (72)                                [Akçe][Yakut][Enerji]  │ üst 136
├──────────┬─────────────────────────────────────────────────────────────────┤
│ Sekme 1  │                 İÇERİK ALANI                                     │
│ Sekme 2  │   (12 sütun, iç dolgu 32, kaydırma yalnızca burada)              │
│ 280 dp   ├─────────────────────────────────────────────────────────────────┤
│ sekme 112│ [ikincil eylemler]                            [BİRİNCİL 320×120] │ eylem şeridi 152
└──────────┴─────────────────────────────────────────────────────────────────┘
```
Sol sekme rayı 280 dp, sekme yüksekliği 112, en fazla 6 sekme (fazlası kaydırılır); seçili sekmenin yanında **çatlak çizgisi**. Sekme yoksa içerik tam genişlik. Eylem şeridi yalnızca eylem varsa görünür. **Oyundaki sekmeler aynen korunur** (örneğin Karakter penceresinin sekmeleri, Görevler'in Günlük/Haftalık/Aylık sekmeleri: `ekranlar/` içinde `-sekme-` adlı görüntüler).

### 5.4 Ekran ekran

Her ekran için GPT şunları teslim eder: **2340 × 1080 ve 1440 × 1080 maket (Elentha), aynı ekranın Kragmir hâli (en azından 2340)**, 3–5 satırlık "neden böyle" notu ve **eski → yeni öğe eşleşme listesi**. Koordinatlar 2340 × 1080 maketine göredir.

#### 5.4.1 Açılış, yükleme, sunucu, karakter seçimi
- **Görünüş:** Kararmış ova, ortada çatlak taş, yavaşça yağan kül; logo yukarıdan kül dağılarak belirir. Yükleme ekranı tam ekran sahne görseli + çatlak biçimli yükleme çubuğu + destandan dönen alıntı cümlesi. Sunucu seçimi sade; sunucu kartında durum.
- **Yerleşim:** Arka plan 2400 × 1080 teslim (kritik içerik ortadaki 1440'ta). Logo üst orta, 960 genişlik. Yükleme çubuğu alt orta 1200 × 24, alttan 160. Alıntı çubuğun 32 üstünde, 34 dp, en fazla 2 satır.
- **Oyundaki öğeler:** yükleme çubuğu ve yüzdesi, hata/yeniden dene, sunucu düğmesi (Ares), "Oyuna gir", karakter seçim listesi ve boş yuvalar. (`001`, `002`)

#### 5.4.2 Karakter oluşturma (en önemli ilk izlenim)
- **Görünüş:** Halk seçimi iki yarı: solda Kragmir (sıcak ocak ışığı), sağda Elentha (soğuk sabah ışığı), ortada çatlak taş; seçilen yarı genişler. Sınıflar için 4 büyük kart; seçili sınıfın karakteri 3B sahnede döner. Görünüm seçenekleri (cinsiyet, yüz, saç, saç/göz/ten rengi, sakal), isim kutusu ve zar. Halk seçiminin altında tek cümlelik slogan.
- **Yerleşim:** Seçilen halk yarısı %70'e genişler; halk adı 72, slogan 38. Sınıf kartları 400 × 640, aralık 32 (tablette 2×2); seçili kart 1.06 büyür. Görünüm paneli sağda 760 dp, seçenekler 136'lık kareler. İsim kutusu 960 × 120, yazı en az 16 CSS px. Sağ alt **OLUŞTUR** (G), sol alt Geri.
- **Not:** Bugünkü ekran tek sayfadır (`a2`/karakter oluşturma görüntüsü). Adımlara bölmek yerine aynı sayfa korunabilir; bu durumda bölgeler yukarıdaki ölçülerle tek ekranda düzenlenir. Hangisini seçtiğini maket notunda yaz.

#### 5.4.3 Ana merkez (şehir)
- **Görünüş:** Oyuncunun başkenti: Kragmir dağ salonu (örsler, körük, lav kanalları) ya da Elentha beyaz kule meydanı (çeşme, sancaklar). Ayrıca **Yemin Pazarı** (iki halkın tarafsız çarşı kasabası) ve **Klan merkezi** aynı ekranı kullanır. 3B şehir canlı: duman, sancak, NPC'ler. Binaların üstünde ad plakaları (Kapı, Çarşı, Kral Otağı, Örs, Maden, İksir ve Parşömen, Kader Çarkı, Taş Yemini, Kral NPC'si) vardır; bunlar dokunulabilir ve **korunur**.
- **Yerleşim:**
```
│[Portre136][İsim·Sv·Güç·XP]   [Duyuru şeridi 880×72]   [Enerji][Akçe][Yakut][⚙]│ üst 136
│┌Görev izleyici 440×280┐                                        [sağ ray ≤5] │
│└──────────────────────┘            3B ŞEHİR                                  │
│[Etkinlik afişi 440×176]      (karakter merkezde)                             │
│[Sohbet şeridi 640×180, son 3 mesaj]                         ┌────────────┐ │
│[Dock: 5 × 136, aralık 16, sola çapalı, 744 dp]              │  S A V A Ş  │ │
│                                                             └400 × 136───┘ │
```
  Sol sütun: görev izleyici 168–448 → afiş 464–640 → sohbet 658–838 → dock 854–990. Sağ sütun: sağ ray 168–832 → SAVAŞ 854–990. SAVAŞ sağdan 162, alttan 90; ekran 1600 dp'den darsa 320. 3B karakterin ayakları alttan ~220 dp; arayüz yüzünü kapatmaz.
- **Oyundaki öğeler ve nereye gidecekleri** (bugün: `003-insan-ana-merkez.png`):
  - Sol üst profil kartı (isim, Sv, Güç) + Premium şeridi + Menü düğmesi → **A**.
  - Üst ortadaki saat/hava ve "Sunucu: Ares" → **B**.
  - Sağ üst Enerji, Akçe, Yakut sayaçları (+ düğmeleriyle) → **C**.
  - Duyuru, Bildirim, Takvim, Başarım, çevrimiçi ödül sayacı → **E** sağ ray (5 düğme sınırı: fazlası ⋯).
  - Ana görev izleyici (bugün sağ altta) → **D**.
  - Sohbet şeridi ve yazı kutusu → **F**.
  - Dock'taki Karakter, Çanta, Klan, Görevler, Posta, Ansiklopedi, Kervan → **H** (5 sınırı: Posta ve Ansiklopedi gibi seyrek olanlar ⋯ altına ya da sağ raya; karar maket notunda).
  - **Savaş** → **G** (tek birincil düğme).
  - "DENEME SÜRÜMÜ" etiketi küçük ve köşede kalır.

#### 5.4.4 Kapı / bölge ve aşama seçimi (dünya haritası)
- **Görünüş:** Elle çizilmiş eski parşömen harita: batıda Kragmir dağları, doğuda Elentha, ortada Vahran Ovası ve çatlak taş. Bölgeler yol üzerinde düğüm düğüm; **açılmamış bölgeler küllü ve gri, açıldıkça renk geri gelir** (ana ilerleme metaforu). Bölge içinde 25 aşama taş basamak / rün düğümü; her 5. aşama büyük kapı (boss portresi).
- **Yerleşim:** Harita tam ekran, kaydırılabilir; üst bar korunur. Düğüm 120 çap, boss kapısı 168; altında ad (34) ve 3 yıldız (56). Seçilince sağdan 640 dp bilgi paneli: bölge görseli 640 × 360, ödüller (104'lük yuvalar), önerilen güç, **BAŞLA** (G).
- Oyundaki Kapı penceresinin sekmeleri (bölgeler, etkinlikler, PvP, çarşı, klan vb.) korunur. (`savas-` ve `bina-gate` görüntüleri)

#### 5.4.5 Savaş öncesi (VS)
- **Görünüş:** Ekran 12° eğik çatlak çizgiyle ikiye bölünür. Solda oyuncu takımı portreleri (240 × 320), sağda düşmanlar; ortada çatlak biçimli "VS" (200 dp). Güç karşılaştırması (800 × 96), önerilen güç, element zayıflık simgeleri.
- **Yerleşim:** Sağ alt **BAŞLA** 400 × 136; solunda **Otomatik** 280 × 120. Sol alt Geri. Oyundaki diziliş/formasyon ve katsayı seçenekleri korunur.

#### 5.4.6 Savaş HUD'u (en çok emek istenen ekran)
```
│[⏸][1x][Oto]      [◉◉◉○○○○ SIRA ŞERİDİ ~1000×120]        Tur 3   [Kaçış] │ üst 136
│                 [═════════ BOSS CAN ÇUBUĞU 1400×48 ═════════]          │ (yalnız boss)
│     ☺   ☺   ☺          3B SAVAŞ ALANI              ☠   ☠   ☠           │
│   OYUNCU (%22–%45)                               DÜŞMAN (%55–%78)      │
│[Aktif birim: portre 160 + can 360 + mana]          (Yt3)  (Yt4)         │
│[İksir][İksir][Eşya] 120'lik                   (Yt2)    ╭SALDIR╮ 200 çap│
│                                              (Yt1)    ╰──────╯         │
```
- **Görünüş:** 3B sahne merkezde, oyuncu solda, düşman sağda, kamera hafif yandan-yukarıdan. Sıra şeridi üstte (Elentha'da mine madalyonlar, Kragmir'de demir pullar). Birim üstünde ince can/mana ve durum simgeleri. Bekleme süresi saat yönünde karartma + kalan tur (44 dp); mana yetmiyorsa mavi çatlak kaplama + bedel kırmızı.
- **Geri bildirim:** vuruşta kısa sarsıntı + 40–60 ms kare dondurma; kritikte büyük eğik sayı + parlama; element vuruşunda element renginde kıvılcım; boss can çubuğu geniş, çok katmanlı, evreli. **Tarikat düşmanları girince** doygunluk düşer, ince kül yağar, vuruşları gri-kor renkte.
- **Yerleşim:** Temel saldırı 200 dp, sağdan 162, alttan 90. Dört yetenek 136 dp, temel saldırının çevresinde çeyrek yayda (yarıçap 260, açılar 180°, 210°, 240°, 270°). Sıra şeridi portresi 96, sıradaki 120 ve parlak, en fazla 10. Aktif birim bloğu sol altta (portre 160 + can 360 × 32 + mana 360 × 20 + en fazla 6 durum simgesi 48). İksir yuvaları 3 × 120. **Ayrılmış köşeler:** sağ alt 600 × 520, sol alt 720 × 440; hiçbir birimin silueti bu kutulara girmez. Birimlerin ayakları alttan ~300 dp. Hedef halkası 200 çap; dokunma alanı birimin tüm siluetidir (en az 200 × 320). Hasar sayısı 600 ms'de 120 dp yükselip söner; aynı anda en fazla 6. Üst sol duraklat, hız (1x/2x/3x), otomatik 120 × 120.
- **Oyundaki öğeler korunur:** oyuncu bilgi bloğu (`#ystat`), çıkış (`#bctl`), hız ve OTO (`#bctl2`), yetenek düğmeleri, sıra bilgisi. Yerleri yukarıdaki düzene taşınır. (`savas-3`, `savas-4` görüntüleri)

#### 5.4.7 Savaş sonucu
- **Zafer:** altın ışınlar, yıldız derecelendirmesi, ganimet kartları birer birer döner. **Yenilgi:** kül dağılması, üç "Güçlen" önerisi (yetenek, eşya, seviye; 360 × 200).
- **Yerleşim:** Ortada 1200 × 840 kart; "ZAFER"/"YENİLGİ" 120 dp; 3 yıldız (120, ortadaki 144); ödül kartları 200 × 260, en fazla 5 yan yana. Altta solda "Tekrar" (ikincil), sağda **"Devam"** (birincil). (`savas-5`)

#### 5.4.8 Karakter penceresi (Karakter, Yetenek, Nitelik, Ustalık sekmeleri) ve Çanta
- **Görünüş:** Solda 3B karakter (döndürülebilir), çevresinde kuşanma yuvaları (silah, kalkan, miğfer, göğüs, eldiven, çizme, takılar). Sağda çanta ızgarası + filtreler. Altta nitelikler ve dağıtılabilir puan. Eşya ayrıntı kartı: büyük simge, nadirlik çerçevesi, değerler, karşılaştırma (yeşil ↑ / kırmızı ↓), Kuşan / Güçlendir / Sat.
- **Yerleşim:** Sol blok 880 dp (yuvalar 152), sağ blok kalan genişlik; filtre şeridi 104; eşya yuvası 136, aralık 16, sütun sayısı genişliğe göre. Eşya ayrıntısı orta pencere (solda 256 simge, sağda değerler, altta düğmeler).
- **Yetenek sekmesi:** Her sınıfın 3 dalı **bir taşın üç yüzü** gibi dikey rün sütunları; açılan düğüm taşın içinden ışıkla belirir, kilitli olan silik kazıntı. Üstte 3 dal sekmesi (360 × 104); düğüm 136 çap, dikey aralık 48, bağlantı 8 kalınlık; sağda 520 dp ayrıntı kartı ve "Öğren" (G); üst ortada kalan puan rozeti. Sınıf ana renkleri: Savaşçı kızıl-demir, Suikastçı gece moru-yeşil, Şifacı altın-krem, Büyücü element renkleri.
- Oyundaki bütün sekmeler korunur (`karakter`, `karakter-sekme-skill`, `-stat`, `-mst`, `canta`).

#### 5.4.9 Görevler, ana görev, hikâye ve diyalog
- **Ana görev:** Destanın 8 bölümü ("İki Taht", "Kırılan Yemin", "Demirdiş", "Sözün Bedeli", "Üçüncü El", "Kızıl Bahar", "Taşın Sırrı", "Tarihin Külleri") birer kitap bölümü kartı; her biri illüstrasyon + alıntı.
- **Günlük / haftalık / aylık:** liste + ilerleme çubuğu + ödül sandıkları zinciri (oyundaki sekmeler korunur).
- **Diyalog:** alt şerit tam genişlik × 360 dp konuşma kutusu; konuşan adı 48 Cinzel, metin 40, en fazla 3 satır. Portreler 720 dp yüksekliğinde tam boy, kutunun arkasından yükselir; susan %50 karartılır. Seçenekler 880 × 104, en fazla 3. Sağ üstte "Atla" ve "Otomatik". Oyundaki NPC konuşma penceresi (örneğin Prenses Lira'nın öğretici konuşması, Kral NPC'si) bu düzene geçer.

#### 5.4.10 Klan ve Hisar
- **Klan:** sancak bloğu 320 × 400 (arma düzenleyici: şekil, renk, simge), klan bilgisi, üye listesi (satır 152), rütbeler, bağış, klan sohbeti. Panel şablonu.
- **Hisar:** kuşbakışı kale haritası (tam alan), kapılar ve kuleler, saldırı/savunma, zamanlayıcı, klan sancakları; seçilen yapı için sağdan 640 dp bilgi paneli.

#### 5.4.11 Meydan (Arena), Rütbe, Unvan
- Kızıl Bahar Meydanı temalı. Solda lig rozeti 320 dp + sezon ödül şeridi; sağda 3 rakip kartı 480 × 600; sıralama tablosu. Lig adları bu dünyaya özgü (demir → bronz → gümüş → altın → kor → kül taşı).

#### 5.4.12 Zindan, Baskın, Nöbet
- Ortada büyük giriş kartı 1200 × 600 (solda boss görseli, sağda bilgi), altta kalan hak ve **Gir** (G). Zindan: mezarlık ve tapınak girişleri, kat seçimi. Baskın: dev boss kartı, katılımcılar, ortak can çubuğu. Nöbet: dalga sayacı, kale canı.

#### 5.4.13 Ekonomi: Çarşı, Karaborsa, Kervan (mağaza), Premium, Yakut, Örs, Maden, İksir ve Parşömen, Kader Çarkı, Sandık
- **Çarşı:** tezgâhlı pazar, satıcı portresi, eşya ızgarası. **Karaborsa:** aynı düzen, karanlık, mum ışıklı, kül kenarlı.
- **Kervan / mağaza:** ürün kartları 400 × 520 (öne çıkan 840 × 520), aralık 24, yatay kaydırma; abartısız, asil vitrin.
- **Sandık açma:** tam ekran modal; sandık 480 × 480 ortada sarsılır, kapak patlar, ışık sütunu nadirlik rengine bürünür; en nadirde kül ve kor girdabı; ödül kartları 200 × 260; altta "Hepsini aç" + "Tamam".
- **Örs, Maden, İksir ve Parşömen, Kader Çarkı, Taş Yemini, Kral Otağı:** panel şablonu; her birinin içeriği `bina-...` görüntülerindeki gibi korunur, kendi malzemesiyle giydirilir (örs: kıvılcım ve demir; çark: dönen çark sahnesi).

#### 5.4.14 Balıkçılık
- Huzurlu mola: Vahran'da dere kenarı. 3B sahne tam ekran; sağ alt **Çek** 200 çap (yetenek kümesiyle aynı yer); sağ kenarda dikey gerginlik çubuğu 48 × 640; yakalanan balık orta pencere; balık defteri.

#### 5.4.15 Sosyal ve yardımcı ekranlar
- **Sohbet:** kapalıyken sol alt şerit 640 × 180 (son 3 mesaj, 34 dp); açıkken soldan kayan panel 960 dp, kanal sekmeleri (104), yazı kutusu 120 + Gönder 120 × 120; sahne sağda görünür.
- **Posta, Arkadaşlar, Parti, Duyuru (afiş + metin), Bildirim, Takvim, Başarım, Ansiklopedi, Rehber, Profil, Ayarlar** (grafik, ses, dil, erişilebilirlik), **Destek/Rapor:** panel şablonu.
- **Öğretici:** %75 delikli karartma, vurgulanan öğenin çevresinde 16 dp pay + nabız halkası; açıklama balonu 720 dp, vurgunun karşı tarafında, onu asla örtmez; el işareti 160 dp. Öğretici penceresi (`#tut`) giydirilir.
- **Menü (çekmece):** bütün ikincil ekranlara giden düğmeler; ızgara düzeni, 136'lık simge düğmeleri.

#### 5.4.16 Kaplamalar, Mini dizi, Fragman
- Kaplamalar: 3B önizleme + kaplama ızgarası. Mini dizi: 10 bölüm kartı, oynat, izlendi işareti (video yerine hareketli çizgi roman sahneleri kullanılacak). Fragman: açılıştaki sinematik metin sahnesi (`a5`): siyah şeritli sinema çerçevesi, ince altyazı, destan cümleleri.

---

## 6. Arayüz kiti (UI Kit)

Her bileşen **iki temada** (Kragmir / Elentha) ve şu durumlarda: normal · basılı · pasif · seçili · uyarı/bildirim noktası.

1. **Panel / pencere çerçevesi:** büyük, orta, küçük. Kenarlar **9-dilim** kesilebilir; dilim ölçüsü MANIFEST'te.
2. **Düğmeler:** birincil (altın/kor), ikincil, tehlike (kızıl), yuvarlak simge düğmesi, kapat (X), geri.
3. **Sekme çubuğu:** yatay ve dikey; seçili sekmede çatlak çizgisi.
4. **Çubuklar:** can, mana, XP, ilerleme, yükleme; can çubuğunda gecikmeli düşüş katmanı.
5. **Kaynak sayaçları:** Akçe, Yakut, Enerji, rütbe puanı (simge + sayı + "+").
6. **Kartlar:** eşya yuvası (6 nadirlik çerçevesi), karakter kartı, görev kartı, klan kartı, ödül kartı.
7. **Rozetler:** seviye, yıldız (1–3), kilit, yeni (kırmızı nokta), sayı rozeti.
8. **Toast, onay kutusu, modal, alttan sayfa.**
9. **Ayraçlar:** çatlak taş çizgisi, rün dizisi, demir zincir (Kragmir), telkari şerit (Elentha).
10. **Simge seti (en az 60):** aynı çizgi kalınlığı ve ışık yönü. Menü: karakter, çanta, klan, görevler, posta, ansiklopedi, kervan/mağaza, savaş, harita/kapı, arena/meydan, sıralama/rütbe, başarım, takvim, bildirim, duyuru, ayarlar, sohbet, arkadaş, parti, sandık, balık, hisar, zindan, baskın, nöbet, çarşı, karaborsa, örs, maden, iksir, kader çarkı, taş yemini, rehber, premium. Kaynaklar: akçe, yakut, enerji, örs tozu, külçe. Nitelikler: güç, dayanıklılık, çeviklik, zekâ, mana. Elementler: ateş, buz, yıldırım. Durum etkileri: sersemletme, yanma, donma, zehir, kalkan, öfke, lanet. Eşya türleri: kılıç, balta, hançer, yay, asa, gürz, kalkan, miğfer, göğüs, eldiven, çizme, yüzük, kolye, iksir.
11. **Sohbet balonu, isim plakaları** (oyuncu, NPC, boss, bina etiketi), **hasar sayısı** stilleri (normal, kritik, şifa, ıska, bağışık).

Mikro-etkileşimler: basınca %96 + 80 ms; panel açılışı ölçek + saydamlık; ödülde ışın patlaması; rün belirmesinde içten dışa ışık dolması.

---

## 7. Sanat yönü

### 7.1 Yaratıcı vizyon: "KÜL VE DEMİR"
Üç yüz yıllık bir savaşın ortasında, iki halkın da göremediği üçüncü bir el var. Bütün görsellik bu gerilim üzerine kurulur: **iki canlı renk dünyası** ve onları sessizce **griye çeviren kül**.

1. **İki dünya, tek ova.** Kragmir sıcak, ağır, el yapımı: kara demir, ocak koru, perçin, oyulmuş kaya, kemik rünler. Elentha soğuk, zarif, ölçülü: ak mermer, lacivert mine, altın telkari, cilalı çelik. Seçilen halk arayüzün temasını belirler; **iki tema aynı yerleşimi paylaşır, malzemesi farklıdır.**
2. **Kül: üçüncü el.** Küllerin Tarikatı göründüğünde renk çekilir: doygunluk düşer, gri kül zerreleri yağar, kenarlarda sönmekte olan kor ışığı kalır. Kül yalnızca **tehlike ve gizem** dilidir; asla neşeli bir öğe olarak kullanılmaz.
3. **Taş unutmaz.** Çatlak dikilitaş oyunun simgesidir. Çatlak çizgisi arayüzde **ayraç** motifidir (bölüm ayraçları, sekme altları, yükleme çubuğu). Rünler ilerlemeyi anlatır: tamamlandıkça rün taşın içinden içten ışıklı büyür.

Duygu: ağır, kadim, yaralı, onurlu, umutlu ama bedelli. **Değil:** sevimli, şeker renkli, çizgi film neşesi, aşırı neon, bilimkurgu.

Sanat stili: **stilize, elle boyanmış görünümlü 3B / 2.5B.** Fotogerçekçi değil, çocuksu değil. Kalın, küçükken bile okunan siluetler (orklar çok iri omuzlu, insanlar ince ve uzun). Sinematik tek yönlü sıcak ana ışık + soğuk dolgu + kenar ışığı. Boyanmış kenar aşınması, metalde ince çizik, kumaşta belirgin dokuma; gürültülü fotoğraf dokusu yok. Arayüz sahneyi örtmez; 3B sahne ekranın kalbidir.

### 7.2 Renk sistemi
**Ortak:** Gece Taşı `#0E0B10` · Kömür `#1A1519` · İs `#2A2328` · Kemik `#E9E1D3` (ana metin) · Kül Grisi `#8D8790` · Kül Açık `#BFB9BE` · Sönen Kor `#C2471E` · Kan `#9E1B1B` · Şifa `#5FCB7A` · Mana `#3E8EF0` · Altın `#E2B44E`.

**Kragmir (`ocak`):** Kara Demir `#2B2622` · Dövme Demir `#4A423B` · Ocak Koru `#FF7A1A` · Erimiş Demir `#FFB347` · Pas `#8A3B1E` · Kızıl Toprak `#6E1F14` · Kemik Rün `#D9C9A3`. Kalın demir levhalar, köşede perçin, kenarda içten yanan turuncu kor çizgisi; düğmeler dövülmüş plaka, basılınca kıvılcım. Süs: diş, boynuz, kemik rün, zincir.

**Elentha (`sancak`):** Ak Mermer `#EDEAE3` · Gümüş Çelik `#AEB8C4` · Kraliyet Laciverti `#1C3C9C` · Gök Mine `#3E7BE0` · Gece Mavisi `#0F1A3A` · Telkari Altın `#D9B04A` · Sancak Beyazı `#F7F5EF`. Koyu lacivert zemin üstünde mermer ve gümüş çerçeve, altın telkari köşeler, mavi mine kakma; basılınca ışık süzülür. Süs: kanat, kalkan arması, defne, kule silueti.

**Nadirlik:** Sıradan `#9A9A9A` düz demir · Seçkin `#4FBF5A` ince yeşil kenar · Nadir `#3E8EF0` mavi + hafif parıltı · Destansı `#A65BF0` mor + köşe süsü · Efsanevi `#F0A030` altın-turuncu, dönen ışık · Kadim `#E8473B` kızıl, kenarda rün yazısı, kül zerresi. (Oyundaki nadirlik adlarını `shared/items.js`'ten Claude doğrular; GPT bu altı sınıfı çizer.)

**Element:** Ateş `#FF6A1F` · Buz `#7FD6FF` · Yıldırım `#FFE35A` · Şifa `#8CF0A0` · Rün Mührü `#FFD98A` · Kara Rün `#7A3BB8` + kül grisi.

**Erişilebilirlik:** metin/zemin kontrastı en az 4.5:1; can, mana ve nadirlik yalnızca renkle değil, simge ya da şekille de ayrılır.

### 7.3 Logo
Oyun adı **DEMİR DİYARI**, alt başlık **Vahran: Tarihin Külleri**. Logo: ortasından çatlamış dikilitaş; bir yanında ork çekici (Yerkıran), öte yanında insan kılıcı; çatlaktan kül ve tek kor kıvılcımı yükselir. Yazı Cinzel tabanlı, özel çizilmiş, metal-taş karışımı (ilk paketteki düz "D" rozeti yeterli değil). Teslim: yatay logo 2048 genişlik, kare 1024, uygulama simgesi 512 + 192 + maskelenebilir 512, apple-touch 180, favicon 64.

### 7.4 Karakterler

| | Kragmir (Ork) | Elentha (İnsan) |
|---|---|---|
| **Savaşçı** | Boynuzlu miğfer, kara-kızıl plaka, altın perçin, iki elli balta; omuzda zincir | Ak çelik şövalye, lacivert pelerin, altın kenar, kılıç-kalkan; kalkanda kule arması |
| **Suikastçı** | Kapüşonlu, koyu pas deri, kemik muskalar, iki hançer, sırtta kısa yay | Gece mavisi deri, gümüş tokalar, yüz örtüsü, ince uzun yay |
| **Şifacı** | Kemik ve deri şaman giysisi, boyalı yüz, rünlü gürz, is kokan torba | Krem-ak cübbe, kızıl kenar, altın rün mührü, gürz ve küçük kalkan |
| **Büyücü** | Kızıl-turuncu cübbe, kömür kenar, sivri şapka, lav damarlı asa | Lacivert-gümüş cübbe, yıldız işlemeli, kristal uçlu asa |

Ork derisi yeşil-gri; insan ten tonları geniş. Her sınıfın silueti 20 px yükseklikte bile ayırt edilir.

**Hikâye karakterleri** (portre + tam boy konsept, her biri ayrı):
- **Demirdiş Volgar:** ork kralı; çok iri, az konuşan, alt çenesinde donuk demir diş; omzunda **Yerkıran** (kaya-demir başlı, rünlü saplı ata çekici); gözlerinde öfkeden çok yas.
- **Kral Edran:** genç insan kralı; seyrek sakal, yaşından ağır bakış, ak zırh, babasından kalma ağır pelerin; kılıcı çoğu zaman indirili.
- **Prenses Lira:** sıkı örgülü saç, binici çizmesi, yay ve hançer; prensesten çok izci; meraklı, hızlı.
- **Thrak:** genç ork izci; yeşil-gri deri, sivri kulak, yeni uzayan alt dişler; boynunda kül dolu deri kese.
- **Şaman Yashka:** çok yaşlı ork kadın şaman; bir gözü süt beyazı, kemik rün torbası, is ve duman.
- **Mareşal Marven:** kırlaşmış saç, rüzgârla oyulmuş yüz, kusursuz zırh, omzunda mareşal nişanı; önce güven veren, sonra soğuk.
- **Adsız, Tarikat Lideri:** yere sürünen kül cübbe; başlığın altında yüz yok, yalnızca gölge ve iki sönen kor göz; süzülür, ot üzerinde iz bırakmaz; etrafında sürekli ince kül.
- **Küllerin Tarikatı üyeleri:** kül rengi cübbeler, yüzsüz başlıklar, ateşsiz kazan.
- Öğretici NPC'leri de çizilir: **İzci Corin** (yaralı Elentha izcisi) ve oyundaki tüccar/çocuk NPC'leri (`ekranlar/` içinde görülenler).

**Yaratıklar ve bosslar:** her bölgenin yaratıkları o bölgenin malzemesinden "doğmuş" gibi. Ova: kurt, yaban domuzu, savaş artığı hortlaklar. Kül Geçidi: taş ve demir varlıklar. Kızıl Bahar: savaş ruhları, zırhlı ölüler. Sisli Çukur: Tarikat ve kül yaratıkları. Her boss için tam boy konsept + savaş portresi + boss kartı.

### 7.5 Ortamlar

| Bölge | Ruh hâli | Anahtar öğeler | Işık |
|---|---|---|---|
| Kemikli Koru (öğretici) | Gergin, gizemli | Sisli çam ormanı, kamp ateşi, yaralı izci | Gece, ateş ışığı |
| Vahran Ovası | Güzel ama yaralı | Deniz gibi dalgalanan uzun ot, altında paslı miğferler; ortada çatlak dikilitaş | Altın saat |
| Kül Geçidi | Sıkışmış, tehditkâr | Dar kaya geçidi, yıkık surlar, yerde kül | Soğuk gri gün, kor kıvılcımı |
| Kızıl Bahar Meydanı | Destansı, kanlı | Çamur-demir ova, kırık sancaklar, mızrak ormanı | Kızıl şafak, sis |
| Sisli Çukur | Ürkünç, kutsal | Kemik dolu çukur, ateşsiz kazan, rün taşları | Ay ışığı + sönen kor |
| Kragmir başkenti | Sıcak, gürültülü | Dağ içi salon, örsler, lav kanalları, kaya taht | Turuncu ocak ışığı |
| Elentha başkenti | Ferah, gururlu | Beyaz kuleler, mavi sancaklar, mermer basamak | Berrak sabah |
| Yemin Pazarı | Kalabalık, tarafsız | İki halkın tezgâhları, karışık sancaklar | Öğle |
| Mezarlık zindanları | Kasvetli | Mezar taşları, eğri ağaçlar, mum | Mor-mavi gece |

Her bölge için **1 geniş sahne** (yükleme görseli de olur, 2400 × 1080) + **savaş arka planı** (karakterlerin duracağı orta zemin boş; ön ve arka katman ayrı PNG olarak verilebilir).

### 7.6 Savaş efektleri (VFX)
Her yetenek dalı için imza efekt: Hücum (kızıl kesik), Siper (demir kalkan halkası), Öfke (kor buharı), Hançer (çift parlak iz), Yay (ok izi + rüzgâr), İz (gölge adımı), Şifa (yeşil-altın yaprak), Rün Mührü (yere inen altın rün dairesi), Kara Rün (mor-gri lanet zinciri), Ateş (lav topu, yanma), Buz (kristal mızrak, donma kabuğu), Yıldırım (zincir şimşek). Her biri için cast / mermi / çarpma / kalıcı durum ayrı sprite sayfası: saydam PNG, 4×4 ya da 8×8 ızgara, kare 256 px, kare sayısı ve fps MANIFEST'te. Aynı anda en fazla ~150 parçacık; efektler parlak ve kısa (0.3–0.8 sn).

---

## 8. Teknik teslim kuralları (zorunlu; uymayan dosya oyuna giremez)

1. **Biçim:** yalnızca **PNG, JPEG, WebP**. **AVIF, SVG, BMP, TGA, TIFF, PSD yasak** (oyunun paylaşılmasını engeller).
2. **Simgeler gerçek çizim:** yazı tipi glifi, emoji ya da metinle simge yapılmaz. Teslimden önce her dosya açılıp gözle denetlenir; boş kutu (□), sahte saydamlık (dama tahtası), kesik kenar, bayt bayt aynı iki dosya **olmayacak**.
3. **Boyut bütçesi:** arayüz parçası ≤ 150 KB, arka plan ≤ 400 KB (2400 × 1080 JPEG/WebP), simge ≤ 40 KB; bütün paket mümkünse ≤ 25 MB.
4. **Çözünürlük:** arayüz parçaları 2x çizilir; simgeler 256 × 256, kare, ortalı, 16 px iç boşluk.
5. **Saydamlık:** gerçek alfa kanalı.
6. **3B (isteğe bağlı):** `.glb` (glTF 2.0); karakter ≤ 12.000 üçgen, silah ≤ 3.000, doku en fazla 1024 PNG/WebP; KTX2/Draco/meshopt sıkıştırması yok; insansı standart iskelet, T-poz; animasyon adları Bölüm 3.3'teki gibi; Y yukarı, metre, ayak tabanı orijinde.
7. **CSS (maketler ve tema):** düz CSS; framework yok; dış bağlantı yok (Google Fonts, CDN yok); bütün renkler `:root` değişkeni; tema seçimi **`html[data-faction="ocak"]`** (Kragmir) ve **`html[data-faction="sancak"]`** (Elentha).
8. **Kod yazılırsa:** vanilla JavaScript ES modülü; harici kütüphane ve ağ isteği yok; oyun kuralları, sayılar ve kayıt yapısı değişmez.
9. **Dosya adları:** küçük harf, Türkçe karakter ve boşluk yok, tire ile (`panel-buyuk-ocak.png`, `simge-canta.png`, `bg-vahran-ovasi.jpg`). İlk paketteki `yetenek-hançer.png` gibi Türkçe karakterli adlar yasak.
10. **Klasör düzeni:**
```
teslim/
  MANIFEST.md        BILESENLER.md        ESLESME.md
  tema/              tokens.css, tema.css
  ui/ocak/  ui/sancak/  ui/ortak/
  simge/  esya/  yetenek/  durum/
  bg/                bölge ve şehir sahneleri, yükleme görselleri
  portre/            hikâye karakterleri, sınıf×halk, boss
  konsept/           yalnızca referans
  maket/             ekran başına .html + 2340 ve 1440 PNG (Elentha ve Kragmir)
  vfx/               sprite sayfaları
  model/             .glb (varsa)
  logo/
```
11. **MANIFEST.md:** her dosya için yol, ne olduğu, hangi ekranda/öğede kullanılacağı, piksel boyutu, dosya boyutu, 9-dilim kenarı, sprite kare sayısı ve fps, lisans.
12. **ESLESME.md:** her ekran için "eski öğe → yeni yer ve görsel" tablosu (Bölüm 1.3).
13. **Lisans:** her şey özgün ya da açık lisanslı; var olan hiçbir oyunun karakterini, logosunu, arayüzünü, haritasını ya da sanatını kopyalama, benzerini de yapma.

---

## 9. Çalışma sırası ve onay noktaları

Her aşama ayrı paket olarak teslim edilir; her paket kendi `MANIFEST.md`'sini taşır. **Bir aşama onaylanmadan sonrakine geçilmez.**

1. **Pilot paketi (önce bu):**
   - Sanat yönergesi panosu (iki tema yan yana; malzeme, ışık, renk, şekil dili).
   - Arayüz kiti: iki temada panel, düğmeler (4 durum), sekme, çubuklar, kaynak sayacı, eşya yuvası + 6 nadirlik çerçevesi, rozetler.
   - Ana merkez, Savaş HUD'u ve Karakter oluşturma maketleri (iki tema, iki genişlik) + `tokens.css`.
   - Claude bu paketi oyuna uygular; kullanıcı oyunda görüp onaylar.
2. Simge seti (60+), eşya ve yetenek simgeleri.
3. Panel ekranları (Karakter/Çanta, Görevler, Klan, Kervan, Ayarlar … Bölüm 5.4'ün tamamı).
4. Arka planlar (Bölüm 7.5'in tamamı), logo, portreler.
5. VFX sayfaları; (isteğe bağlı) 3B modeller.

---

## 10. Görsel üretim için taban istemler (image prompt)

**Ortak stil eki:** `stylized hand-painted 3D fantasy art, premium mobile RPG quality, bold readable silhouettes, cinematic warm key light with cool fill and rim light, painterly textures with worn edges, rich but controlled detail, no text, no watermark, original design`

- **Kragmir arayüz:** `game UI panel frame, forged black iron plates with rivets, glowing molten orange ember seams, carved bone rune details, chains, isolated on transparent background, front view, symmetrical` + ortak ek
- **Elentha arayüz:** `game UI panel frame, white marble and polished silver with gold filigree corners and deep royal blue enamel inlay, elegant knightly heraldry, isolated on transparent background, front view, symmetrical` + ortak ek
- **Vahran Ovası:** `vast windswept plain of tall golden grass waving like a sea, rusted helmets and broken spear tips hidden in the grass, a huge black runic obelisk cracked from top to bottom in the center, golden hour, long shadows, faint ash drifting` + ortak ek
- **Adsız:** `tall faceless figure in a floor-length ash-grey robe, deep hood with only shadow inside and two dying ember eyes, floating slightly above the grass, ash falling around it, desaturated palette with ember accents, ominous` + ortak ek
- **Volgar:** `massive broad-shouldered orc king, green-grey skin, single dull iron tooth in lower jaw, heavy ancestral rune-carved stone-and-iron warhammer on shoulder, black and crimson plate armor, eyes full of grief rather than rage, mountain forge hall background` + ortak ek
- **Edran:** `young human king with sparse beard and eyes older than his age, white steel armor, heavy royal blue cloak, sword held lowered, white stone tower city background in clear morning light` + ortak ek
- **Simge (örnek):** `single game icon of a leather backpack, hand-painted, centered, thick readable silhouette, warm rim light, transparent background, 256x256, no text` + ortak ek. Her simge ayrı üretilir; arka plan halkası ve çerçevesi arayüz kitinden ayrı katmandır.

---

## 11. GPT: teslim kontrol listesi (göndermeden önce hepsini işaretle)

- [ ] Her maket `ekranlar/` içindeki gerçek ekrandan başladı; o ekrandaki her düğme, sekme, yazı ve sayı yeni maketde var; `ESLESME.md` dolu.
- [ ] Hiçbir maket başka bir ekranın kopyası değil; uydurma yer tutucu ("BİRİM", "Lorem") yok.
- [ ] Bütün simgeler gerçek çizim; hiçbirinde □ yok; aynı iki dosya yok (dosya özetleriyle denetlendi).
- [ ] İki tema yan yana konduğunda aynı oyunun iki yüzü; yerleşim aynı, malzeme farklı.
- [ ] Tema seçicileri `ocak` / `sancak`.
- [ ] Bölüm 4–5 ölçüleri: 8'in katları, dokunma ≥ 120 dp, cümle ≥ 34 dp, çentik bölgesinde metin/düğme yok, birincil düğme G'de, Geri A'da, kaynaklar C'de aynı sırada.
- [ ] 1440 × 1080 maketlerinde hiçbir şey kesilmiyor; ana ekranda dock, sohbet ve SAVAŞ çakışmıyor; savaşta ayrılmış köşe kutuları boş.
- [ ] Türkçe büyük harfler (İ, I, Ş, Ğ, Ç, Ö, Ü) doğru.
- [ ] Biçim ve boyut kuralları (Bölüm 8) tam; MANIFEST eksiksiz; dosya adlarında Türkçe karakter yok.
- [ ] Kül dili yalnızca Tarikat, tehlike ve gizem için.
- [ ] Eksik bırakılan her şey MANIFEST'te "sonraki paket" diye açıkça yazılı.

---

## 12. Claude: uygulama yönergesi

### 12.1 Teslimi denetle (oyuna eklemeden önce)
1. Her görseli aç ve bak: □ glifi, sahte saydamlık, kesik kenar, düz renk yer tutucu var mı? Dosya özetiyle (md5) aynı dosyaları bul.
2. Biçim denetimi: yalnızca PNG/JPEG/WebP; dosyaların içinde `data:image/avif` ya da SVG yok; boyut bütçesi; adlarda Türkçe karakter yok.
3. Maketi gerçek ekranla karşılaştır: `ESLESME.md`'de her öğe var mı? Eksik öğe varsa uygulamadan önce kullanıcıya bildir.
4. Uymayan dosya oyuna eklenmez; listesi kullanıcıya verilir (GPT'ye geri gönderilmek üzere).

### 12.2 Dosya yerleşimi
- Görseller `oyun-son/img/kd/` altına (`ui/ocak`, `ui/sancak`, `ui/ortak`, `simge`, `esya`, `yetenek`, `bg`, `portre`, `vfx`, `logo`).
- GLB → `.glb.js` (base64 gömülü, mevcut `models/items/*.glb.js` biçimi); `.glb` doğrudan sunulmaz.
- Uygulama simgeleri `img/icons/` içindeki aynı adlı dosyaların yerine.
- Yükleme/giriş görseli `css/v16-korant.css`'teki `korant-acilis.jpg` başvurularının yerine.
- Portreler `img/portraits.json` üzerinden (`js/portraits.js` açıklamasındaki anahtar biçimi).

### 12.3 Ölçek ve tema altyapısı
- `js/orient.js`'teki `measure()` içine: `root.style.setProperty('--s', Math.min(view.h / 1080, 1))`. `--dp` CSS'te `calc(var(--s) * 1px)`. Döndürülmüş kipte `view.h` mantıksal yüksekliktir; ayrıca hesap gerekmez.
- Tema `html[data-faction="ocak"|"sancak"]`; oyun bunu zaten koyar. Halk seçilmemiş ekranlarda (açılış, oluşturma) nötr/ortak tema.
- `tokens.css` → `css/v17-kul-demir.css` olarak, **en son yüklenen** stil dosyası (bugün sonuncu `css/v13-hub.css`).

### 12.4 Ekran ekran uygulama
1. Önce ekranın bugünkü görüntüsünü çek (ölçüt).
2. Yeni stilleri o ekranın gerçek seçicilerine yaz (`dom/` ve kaynak kod). Yerleşim CSS ile; gerekirse şablona yalnızca sunum sarmalayıcısı.
3. Eski 31 katmandan ve `index.html` içindeki `<style>` bloklarından **yalnızca o ekranı ilgilendiren** ve artık gereksiz kalan kuralları kaldır; `!important` sayısını azalt. Bir kuralı silmeden önce başka ekranı etkilemediğini ara ve doğrula.
4. Simgeler: PNG simgeyi mevcut SVG simge fonksiyonlarının (`js/icons.js` `svg()`, `item-icons.js`, `skill-icons.js`) çıktısını değiştirerek bağla; PNG'si olmayan simgede eski SVG yedek olarak kalır (oyun asla simgesiz kalmaz).
5. Davranışa dokunma; `data-a` düğmelerinin hepsi aynı işi yapmaya devam eder.

### 12.5 Hatasızlık kanıtı (her ekran ve her paket sonunda)
Yerel sunucu (`python3 -m http.server 8765 -d oyun-son`) + Playwright, `?gfx=low`, testler sırayla:
- Boyutlar: **844 × 390** (yaygın telefon), **667 × 375** (küçük telefon), **1180 × 820** (tablet), **1920 × 1080** (masaüstü) ve dik tutulmuş telefon (390 × 844, dokunmatik: döndürülmüş kip).
- İki halk (Elentha ve Kragmir karakteriyle ayrı ayrı).
- Her ekran: aç → ekran görüntüsü al → konsol hatası **sıfır**, ağda 404 **sıfır**, yazı taşması yok, dokunma hedefi ölçümü (≥ 43 CSS px telefonda), çentik bölgesinde düğme yok.
- Görünen her `data-a` düğmesine tıklanınca eskisiyle aynı ekran açılıyor.
- Savaş baştan sona oynanıyor; sonuç ekranı geliyor; öğretici akışı bozulmuyor; kayıt yüklenip kaydediliyor.
- Önce/sonra ekran görüntüleri yan yana kullanıcıya gösterilir.
- Testler geçmeden yayımlama yapılmaz; geçmeyen bir şey varsa açıkça söylenir.

---

## 13. Kabul ölçütleri (iş ancak bunların hepsi doğruysa bitmiştir)

- [ ] Oyunun her ekranı, her düğmesi ve her işlevi yerinde ve çalışıyor; yeni tasarımda kaybolan özellik yok.
- [ ] İki tema yan yana aynı oyunun iki yüzü gibi; yerleşim aynı.
- [ ] Savaş HUD'u yatay telefonda başparmakla rahat oynanıyor.
- [ ] Her ekranda en önemli eylem bir saniyede bulunuyor; birincil düğme hep G'de, Geri hep A'da.
- [ ] Bütün görseller gerçek çizim, premium kalitede, ilk paketteki iyi iki görselin (Vahran Ovası, ana merkez referansı) seviyesinde.
- [ ] Türkçe karakterler her yerde doğru.
- [ ] Biçim kuralları tam (AVIF/SVG yok), boyut bütçesi tutuyor, MANIFEST ve ESLESME eksiksiz.
- [ ] Bölüm 12.5'teki testlerin hepsi geçti: konsol hatası sıfır, 404 sıfır, taşma yok.
- [ ] Hiçbir öğe var olan bir oyunun kopyası ya da benzeri değil.

---

## Ek A · Ekran görüntüleri listesi (`ekranlar/` ve `dom/`)

EKRAN_LISTESI_BURAYA

---

## Ek B · Vahran: Tarihin Külleri (hikâyenin tam metni)

Hikâyedeki sözler, yerler ve karakterler bu belgedeki tasarımların kaynağıdır; çelişki olursa hikâye esastır.

```text
VAHRAN: TARİHİN KÜLLERİ
Destansı Hikâye — Fable tarafından yazıldı


I. İki Taht

Arvath henüz genç bir dünyayken, ırmaklar yataklarını yeni seçmiş ve dağlar adlarını henüz almamışken, toprağın en derininde bir şey uyurdu. Bir tanrı değildi, bir canavar da değildi. Kadim, sabırsız bir öfkeydi; kayanın altına sıkışmış bir ateş, kendi karanlığında dönüp duran bir sancı.

Bir gün yer inledi. Kaya yarıldı. Erimiş demirin toprağa karıştığı o kızıl yarıktan ilk Ork doğruldu. Onu ne bir tanrı yarattı ne bir ana doğurdu; dağın kendi acısı biçimlendirdi. İlk nefesini aldığında avucunda bir çekiç vardı ve o günden sonra iki şey için yaşadı: dövmek ve asla boyun eğmemek.

Kragmir'in çocukları bu masalı ocak başında dinleyerek büyür. Dağların kalbindeki salonlarında, körüklerin soluğu ile örslerin çınlaması arasında tek bir sözü tekrar ederler: Toprak, çekice boyun eğer.

Dağların eteğinden doğuya bakıldığında ovalar başlar, ovaların ötesinde de Elentha uzanır. Orası insanların krallığıdır; beyaz taştan kuleleri, mavi sancakları ve nesilden nesile bilenen kılıçları vardır. Çeliğe ve onura inanırlar, ama sözleri bir övünç değil, bir uyarıdır: Çelik bile bir gün paslanır.

İki krallığın arasında Vahran Ovası yatar.

Uzaktan bakan onu güzel sanır. Otu uzundur, rüzgâr üzerinden geçerken deniz gibi dalgalanır. Ama o otun altında kırık mızrak uçları, paslanmış miğferler ve kimin olduğu çoktan unutulmuş kemikler vardır. Vahran'da toprak karadır, çünkü üç yüz yıldır kanla sulanır. Ovanın tam ortasında, rüzgârın bile yavaşladığı bir yerde, rünlerle kaplı bir dikilitaş durur. Boydan boya çatlaktır. Halklar ona Taş Yemini der ve yanından geçerken başlarını çevirirler.

O çağda Kragmir'in tahtında Demirdiş Volgar oturuyordu. Tahtı dağın kendi kayasından oyulmuştu; kolçakları yüz kralın avuçlarıyla aşınmıştı. Volgar geniş omuzlu, az konuşan, öfkesi çabuk tutuşan bir orktu. Güldüğü pek görülmezdi, ama dişlerini gösterdiğinde alt çenesinde, kırılan dişinin yerinde donuk bir demir parlardı. Tahtın yanında, elinin her an uzanabileceği yerde Yerkıran dururdu: babasının çekici, ondan önce babasının babasının çekici. Volgar sertti, ama kıtlık kışında kendi ambarını ilk açan da oydu. Halkı ondan korkmazdı. Halkı onun ardından yürürdü.

Elentha'nın tahtında ise genç Kral Edran vardı. Tacı başına henüz oturmamış gibiydi, sakalı seyrekti, ama bakışı yaşından ağırdı. Sarayında onun için fısıldanan bir söz dolaşırdı: Kral, kılıcından çok verdiği söze güvenir. Kimi bunu övgü diye söylerdi, kimi yergi diye. Edran savaşı kazanmak istemiyordu. Savaşı bitirmek istiyordu. Bu ikisinin aynı şey olmadığını sarayında anlayan pek azdı.

İki taht arasında on günlük yol ve üç yüz yıllık kin vardı. Yine de bazı geceler Volgar dağ kapısının üstündeki sekiye çıkıp doğuya, Edran en yüksek kulenin penceresinden batıya bakardı. Birbirlerini göremezlerdi. Ama ikisi de aynı karanlığa, aynı ovaya, aynı çatlak taşa bakardı.

İkisi de aynı soruyu sorardı: Bunu kim başlattı?

İkisine de aynı cevap öğretilmişti: Onlar.


II. Kırılan Yemin

Cevap yanlıştı. Ama bunu anlamak için üç yüz yıl geriye gitmek gerekir.

O zamanlar da savaş vardı. Vahran o zaman da kana doymuştu ve iki halk da çocuklarını gömmekten yorulmuştu. Kragmir'in kralı Dorrak yaşlı bir orktu; üç oğlunu aynı ovada yitirmişti. Elentha'nın kraliçesi Seraine ise tahta, ağabeyinin cenazesinden dönerken çıkmıştı. Yas, ikisine de gururdan ağır gelmeye başlamıştı.

Bir güz sabahı iki hükümdar ordularını ardlarında bırakıp ovanın ortasına yalnız yürüdüler. Orada, hiçbir halkın sahiplenmediği çıplak bir düzlükte, orkların dağdan indirdiği ve insanların dikmesine yardım ettiği bir taş duruyordu. Ork şamanları onun bir yüzüne, Elentha'nın kâtipleri öteki yüzüne rünler kazımıştı.

Dorrak çekicini taşın dibine bıraktı. Seraine kılıcını onun yanına koydu.

"Halkım bana zayıf diyecek," dedi Dorrak. Sesi çakıl gibi hırıltılıydı.

"Benimki de bana," dedi Seraine. "Bırak desinler. Yaşayanlar söyler bunu. Ölüler hiçbir şey diyemiyor."

Avuçlarını kestiler ve ellerini taşa bastılar. Ork kanı ile insan kanı aynı rünün oluğunda birbirine karıştı. Yemini birlikte söylediler: Bu taş ayakta durdukça ne çekiç ne kılıç Vahran'da kalkacaktı. Sözü ilk bozanın adı taşa yazılacak, taş onu unutmayacaktı.

Barış bir kış, bir bahar, bir yaz sürdü. Ovada ilk kez ekin ekildi. Ork demircileri insan köylerine saban demiri sattı, karşılığında tahıl aldı. Çocuklar taşın çevresinde oynadı.

Sonra Kızıl Ay gecesi geldi.

O gece ay, ufkun üstünde pıhtılaşmış bir yara gibi doğdu. Elentha'nın elçisi, hasat payını konuşmak üzere ork kampında konuk ediliyordu. Sabaha karşı çadırında ölü bulundu. Göğsünde ork işi bir bıçak vardı; kabzası Kragmir demirindendi.

Aynı gece, aynı saatlerde ork kampının öte ucunda bir çığlık koptu. Kuyulardan su içen keçiler yere yıkılmış, köpürerek can veriyordu. Sonra çocuklar hastalandı. Suyun dibinde, Elentha'nın şifacılarının kullandığı türden mühürlü bir şişe bulundu.

Şafakta iki taraf da avazı çıktığı kadar bağırıyordu. İnsanlar, "Konuğunuzu uykusunda boğazladınız!" diyordu. Orklar, "Çocuklarımızın suyuna zehir kattınız!" diye haykırıyordu. Kimse dinlemiyordu. İki suçun aynı gecede, aynı saatte işlenmiş olması kimseyi durup düşündürmedi. Öfke düşünmez.

Dorrak çekicine, Seraine kılıcına uzandı. Silahlar taşın dibinden kalktığı anda gök gürlemeden bir çatırtı duyuldu. Dikilitaş tepesinden dibine dek yarıldı. Çatlak, tam da iki kanın karıştığı rünün ortasından geçti.

Herkes taşa baktı. Hiç kimse ovanın kenarındaki sis içinde duran, kül rengi cübbeli birkaç sessiz gölgeye bakmadı. Gölgeler bir süre seyretti. Sonra geldikleri gibi, iz bırakmadan çekildiler.

Savaş yeniden başladı ve üç yüz yıl boyunca bitmedi.


III. Demirdiş

Volgar ovayı ilk gördüğünde on altı kışını yeni doldurmuştu.

Babası Ugrath'ın yanında, ön safta at sürüyordu. Ugrath dağ gibi bir orktu; güldüğünde zırhının plakaları sarsılırdı. Savaştan önce oğluna döndü ve Yerkıran'ın başıyla ovayı gösterdi.

"Şu toprağı görüyor musun? Deden burada yatıyor. Onun babası da. Bir gün ben de yatacağım." Sonra, hiç beklenmedik biçimde sesini alçalttı. "Sen yatma, oğul. Mümkünse sen yatma."

Volgar o sözün ne demek olduğunu o gün anlamadı.

Elentha süvarisi öğleye doğru çarptı. Dünya toza, çığlığa ve demir sesine dönüştü. Volgar savaşın ortasında bir kalkan kenarını yüzüne yedi. Ağzı kanla doldu, bir dişi kökünden kırılıp gitti. Dizlerinin üstüne düştü. Başını kaldırdığında babasını gördü.

Ugrath üç mızrakçıyı tek savuruşta dağıtmış, dördüncüye dönüyordu. Mızrak, kolunun altındaki zırh aralığından girdi. Kral bir an ayakta kaldı, şaşırmış gibiydi. Sonra bir kule gibi yavaşça devrildi.

Volgar sürünerek ona ulaştı. Ugrath'ın parmakları hâlâ Yerkıran'ın sapını kavrıyordu. Konuşamadı. Yalnızca çekici oğlunun göğsüne doğru itti. Çekiç ağırdı. Volgar onu iki eliyle güç bela kaldırdı. Babasının eli gevşediğinde Kragmir'in yeni kralı on altı yaşında, ağzı kan içinde, bir cesedin başında diz çökmüş duruyordu.

Dağa döndüklerinde demirciler ona kırık dişinin yerine altın takmayı önerdi. Volgar reddetti.

"Demir," dedi. "Babamın düştüğü gün kırılan miğferlerden birinden dökün. Her yutkunduğumda tadını almak istiyorum."

Böylece adı Demirdiş kaldı.

Yıllar onu sertleştirdi. Öfkesi derinleşti, sabrı kısaldı. Ama dağda onun öfkesinden korkmayan biri vardı: Şaman Yashka. O kadar yaşlıydı ki Ugrath'ın doğumunda rün okuduğu söylenirdi. Gözlerinden biri süt beyazıydı. Kemik rünlerini is kokan bir deri kesede taşırdı.

Edran'ın Elentha'da taç giyeceği haberinin dağa ulaştığı gece, Yashka kralı ocak mağarasına çağırdı. Rünleri sıcak küle döktü, uzun uzun baktı. Yüzü, Volgar'ın daha önce hiç görmediği bir biçimde gerildi.

"Ne görüyorsun, yaşlı ana?"

"Sevmediğim bir şey." Yashka parmağıyla, ötekilerden ayrı düşmüş bir kemiği gösterdi. "Bu rün el demektir. Yanındaki, başlangıç. Ama bak, el ne dağın yanına düştü ne ovanın."

"Açık konuş."

Yashka sağlam gözünü ona kaldırdı. "Savaşı başlatan el, ne ork ne insan."

Volgar kısa ve sert bir kahkaha attı; demir dişi ateşte parladı. "Babamı öldüren mızrağı bir insan tutuyordu. Onu gözlerimle gördüm."

"Mızrağı tutanı gördün," dedi Yashka sakince. "Ben sana o mızrağı kimin biletip o ele verdiğini soruyorum. Üç yüz yıl, Volgar. Hiç merak etmedin mi? Ne zaman iki halk yorulsa, ne zaman biri soluklansa hep bir şey olur. Bir köy yanar. Bir elçi kaybolur. Bir kuyu bozulur. Ve çekiçler yeniden kalkar."

"Kemiklerin yaşlandı," dedi Volgar ve çıktı.

Ama o gece uyuyamadı. Babasının alçalan sesi kulağındaydı: Sen yatma, oğul. Sonraki gün izcilerine bir emir verdi. Ovada yalnızca insanları değil, ork ya da insan gibi görünmeyen her şeyi gözleyeceklerdi.

Bu emri alan izcilerden biri de genç Thrak'tı.


IV. Sözün Bedeli

Elentha'da çanlar üç gün çaldı. Edran, babasının ağır pelerinini omuzlarında, ak mermer basamakları çıktı. Tacı başına koyduklarında soylular diz çöktü, halk haykırdı, sancaklar rüzgârda şakladı.

Kalabalığın içinde tek bir adam gülümsemedi. Mareşal Marven, Elentha ordusunun başı, zırhı içinde dimdik durmuş, yeni kralını bir kılıcın ağzını sınayan demirci gibi süzüyordu. Saçları kırlaşmış, yüzü rüzgârla oyulmuştu. Otuz yıldır ordunun başındaydı. Sarayda sözüne karşı çıkmayı göze alan az kişi kalmıştı.

Tören bitip salon boşaldığında krala yaklaştı.

"Majesteleri. Kragmir yeni kralları sınar. Âdetleridir. Bahara dek sınırı aşacaklar. Onlardan önce davranmalıyız."

"Henüz tacımın ağırlığına alışmadım Mareşal, bana savaşın ağırlığını yüklüyorsun."

"Savaş zaten omuzlarınızda, efendim. Babanızdan miras kaldı, ona da babasından. Ben yalnızca nasıl taşınacağını söylüyorum."

Edran bir süre sustu. "Peki ya taşımak istemiyorsam? Ya onu yere bırakmak istiyorsam?"

Marven'in yüzünde hiçbir şey kıpırdamadı. "Onu yere ilk bırakan, sırtından bıçaklanır. Elçimizi konuk çadırında öldüren halkla barış konuşulmaz. Tarih bunu bir kez yazdı."

"Tarihi kim yazdı Mareşal?"

"Hayatta kalanlar, Majesteleri. Hep onlar yazar."

Marven eğilip çekildi. Edran onun arkasından uzun uzun baktı. Mareşal'in söylediği her söz doğru gibiydi. Belki de onu rahatsız eden buydu: fazla hazır, fazla cilalıydılar, çok kez söylenmiş sözlerdi.

O gece uyumak yerine saray arşivine indi. Yanında bir tek kız kardeşi vardı. Prenses Lira, bir prensesten çok izciye benzerdi. Saçlarını sıkıca örer, eteğin altına binici çizmesi giyer, surlardan çıkmanın nöbetçilerin bilmediği dört yolunu bilirdi. Merakı çocukluğundan beri başını derde sokmuştu ve bundan hiç pişmanlık duymamıştı.

"Ne arıyoruz?" diye sordu, tozlu bir rafa fenerini tutarak.

"Yemin gecesini. Kızıl Ay'ı. Bize anlatılanı değil, o gece yazılanı."

Saatlerce aradılar. Kraliçe Seraine dönemine ait tomarların çoğu eksikti; kimisi çürümüş, kimisi düpedüz yok olmuştu. Şafağa yakın, Lira bir sandığın çift tabanını fark etti. Altından tek bir parşömen çıktı. Yarısı yanmıştı. Kenarları kömürleşmiş, mürekkebi solmuştu.

Edran onu fenerin ışığına tuttu ve yüksek sesle okudu. Bir sınır nöbetçisinin tutanağıydı:

"...Kızıl Ay'ın ikinci nöbetinde, ork kampı ile bizim çadırlarımızın arasındaki derede, kül renkli cübbeli yabancılar görüldü. Sayıları dört ya da beşti. Ne bizim sancağımızı ne Kragmir'in damgasını taşıyorlardı. Seslenildiğinde cevap vermediler. Durum komutana bildirildi, komutan da..."

Gerisi yanmıştı.

Kardeşler birbirine baktı.

"Bunu biri yakmış," dedi Lira yavaşça. "Kendiliğinden tutuşmamış. Bak, yalnızca alt yarısı. Biri ne yazdığını okumuş, sonra ateşe tutmuş."

"Ve bir başkası onu ateşten çekip saklamış." Edran parşömeni göğsüne bastırdı. "Bunu kimseye söyleme. Mareşal'e hiç söyleme."

"Marven'den mi şüpheleniyorsun?"

"Hayır. Bilmiyorum. Ama bana bugün tarihi hayatta kalanların yazdığını söyledi." Parşömene baktı. "Ya hayatta kalan başka biri varsa?"

Lira hiçbir şey demedi. Ama gözlerinde, Edran'ın çocukluktan tanıdığı o tehlikeli parıltı yanmıştı. Kral içini çekti.

"Lira. Ovaya inmeyeceksin."

"Elbette inmeyeceğim," dedi Lira.

İki gece sonra indi.


V. Üçüncü El

Vahran geceleri başka bir yerdir. Ot hışırdar, uzakta çakallar ulur, ay ışığı eski miğferlerin üzerinde soğuk soğuk parlar. Lira atını bir dere yatağında bırakmış, yayını omzuna asmış, eğilerek yürüyordu. Aradığını üçüncü gece buldu: çamurda ayak izleri. Ne nalçalı ork çizmesinin ne Elentha asker postalının iziydi. Yumuşak tabanlı, hafif, sıra sıra dizilmiş adımlardı. İzlerin yanında toprağa bir şey serpilmişti. Lira eğilip parmaklarına aldı.

Küldü.

Tam o sırada otların arasından bir gölge üstüne atıldı.

Yere yuvarlandılar. Lira hançerini çekti, saldırganın bileğini yakaladı. Karşısındaki ondan iriydi ama ondan yaşlı değildi. Yeşil-gri derili, sivri kulaklı, alt dişleri yeni yeni uzamış bir orktu. Bıçağı Lira'nın boğazına, Lira'nın hançeri onun kaburgalarına dayandı. Soluk soluğa öylece kaldılar.

"İnsan casusu," diye hırladı ork.

"Ork katili," diye tısladı Lira.

"Kimseyi öldürmedim. Henüz."

"Ben de kimseyi gözetlemedim. Henüz."

Bir an geçti. Sonra orkun bakışı Lira'nın öbür eline kaydı. Avucunda hâlâ kül vardı.

"Onu nereden aldın?"

"İzlerin yanından."

Ork yavaşça, çok yavaşça bıçağını geri çekti. Boynundaki deri keseyi açıp içindekini avucuna döktü. Aynı gri, aynı ince kül.

"Dört gecedir bu izleri sürüyorum," dedi. "Kralımın emri. Ork ya da insan gibi görünmeyen her şey."

Lira hançerini indirdi. "Benimki emir değil. Yanmış bir parşömen. Kül renkli cübbeli yabancılar."

Orkun kulakları dikildi. "Cübbe. Evet. Birini gördüm, uzaktan. Yürümüyordu sanki. Otun üstünden süzülüyordu."

"Adın ne?"

Ork duraksadı. Bir insana adını vermek âdet değildi. "Thrak."

"Lira."

"Sadece Lira mı?"

"Bu gecelik sadece Lira."

Birlikte iz sürdüler. Birbirlerine güvendiklerinden değil, ikisi de izi bırakamayacak kadar meraklı olduğundan. Thrak toprağı Lira'dan iyi okuyordu; Lira karanlıkta Thrak'tan iyi görüyordu. Konuşmadan, el işaretleriyle anlaşmayı bir saat içinde öğrendiler.

İzler onları ovanın kuzeyinde, eski bir muharebenin kemikleriyle dolu bir çukura götürdü. Sırtın üstüne süründüler ve aşağı baktılar.

Çukurda ateşsiz bir halka kurulmuştu. On iki, belki on beş kişiydiler. Hepsi kül rengi cübbeler içindeydi, yüzleri başlıkların gölgesinde kayboluyordu. Ortalarında bir kazan vardı, ama içinde ateş yanmıyor, yalnızca kül duruyordu. İçlerinden biri bir ork miğferi ile bir Elentha miğferini aldı, ikisini birlikte külün içine gömdü. Ötekiler tek ağızdan, alçak sesle bir şey mırıldandı. Lira kelimeleri seçemedi, ama ezgisi bir ninniyi andırıyordu. Bir mezarın başında söylenen bir ninni.

Sonra içlerinden ikisi ayrıldı. Biri doğuya, Elentha'ya doğru yürüdü. Öteki batıya, Kragmir'e.

"Görüyor musun?" diye fısıldadı Thrak. Sesi ilk kez titriyordu. "İkisine de gidiyorlar. İkimize de."

"Casuslar," dedi Lira. "İki sarayda da."

Halkadakilerden biri başını kaldırdı. Yüzü görünmüyordu, ama Lira o gölgenin içinden bir bakışın sırta, tam üzerlerine dikildiğini iliklerinde hissetti.

Koştular. Arkalarından kimse gelmedi. Bu, kovalanmaktan daha korkunçtu.

Dere yatağına vardıklarında ikisi de titriyordu. Thrak eğilip ellerini dizlerine dayadı.

"Şamanımız bir söz söylemiş. Krala. Bütün dağ duydu, kimse inanmadı." Başını kaldırdı. "Savaşı başlatan el, ne ork ne insan."

Lira'nın sırtı ürperdi. "Bunu kanıtlamamız gerek. İki krala da. Bir külle, bir yanık parşömenle olmaz."

"Taş," dedi Thrak. "Yashka der ki taş unutmaz. Yemin taşa verildi. Kim kırdıysa taş bilir."

"Çatlak taş mı? Oraya kimse gitmez."

"O yüzden," dedi Thrak, "sır hâlâ orada duruyor olabilir."

Ama taşa giden yol ovanın tam ortasından geçiyordu ve o bahar, ovanın ortası iki ordunun buluşacağı yerdi.


VI. Kızıl Bahar

Lira saraya döndüğünde çok geç kalmıştı.

O yokken sınırdaki üç Elentha köyü bir gecede yanmıştı. Yıkıntıların arasında ork baltaları bulunmuştu. Aynı hafta Kragmir'in dağ geçidindeki bir maden kampı basılmış, madenciler uykularında öldürülmüştü. Cesetlerin arasında mavi bir Elentha sancağı bırakılmıştı.

Marven taht salonunda, bütün soyluların önünde yanık bir ork baltasını kralın ayaklarının dibine attı.

"Daha kaç köy, Majesteleri? Daha kaç tanesi yanınca sözlere değil kılıçlara güveneceksiniz?"

Salon uğulduyordu. Edran baltaya baktı; temizdi, fazla temizdi, sanki oraya konmak için seçilmişti. Ama dışarıda, saray kapısında, yanan köylerden kaçan kadınlar ağlıyordu. Bir kral, halkının gözyaşına yanık bir parşömenle cevap veremezdi.

Lira ona çukurda gördüklerini anlattı. Edran dinledi, yüzü soldu.

"Sana inanıyorum," dedi. "Ama ordu bana inanmaz. Marven'e inanır. Yürüyüşü durdurursam beni korkak ilan eder ve orduyu o yürütür. En azından başında ben olursam durdurabileceğim bir an gelebilir." Kız kardeşinin omuzlarını tuttu. "Bana kanıt getir, Lira. Bir ordunun görebileceği kadar büyük bir kanıt."

Dağda da durum aynıydı. Volgar madencilerin cesetlerini kendi elleriyle taşımıştı. Yashka ona el rününü yeniden hatırlattığında kral mavi sancağı ocağa fırlattı.

"Senin rünlerin benim ölülerimi gömmüyor, yaşlı ana!"

"Hayır," dedi Yashka. "Ama yenilerinin gömülmesini önleyebilir."

Volgar dinlemedi. Dinleyemedi. Savaş boruları öttü, dağ kapıları açıldı ve Kragmir demir bir ırmak gibi ovaya aktı.

İki ordu baharın ilk dolunayında Vahran'da karşılaştı. Sonradan o mevsime Kızıl Bahar dediler, çünkü o yıl ovada çiçek açmadı.

Şafakta sis kalktığında bir yanda Kragmir'in kara demir safları, öte yanda Elentha'nın parlayan çeliği duruyordu. Arada yarım fersahlık ot, otun ortasında da ufak, uzak bir karaltı: çatlak dikilitaş.

Borular çaldı. Yer sarsıldı.

Sonrasını ozanlar güzel anlatır, ama orada bulunanlar hiç anlatmaz. Kalkan duvarları çarpıştı, mızraklar kırıldı, atlar kişneyerek devrildi. Ork çekiçleri miğferleri yumurta kabuğu gibi ezdi. Elentha okçuları göğü kararttı. Öğleye doğru ot görünmez olmuştu; yalnızca çamur, demir ve düşenler vardı.

Volgar ön saftaydı, babasının bir zamanlar durduğu yerde. Yerkıran her inişinde bir boşluk açıyordu. Kral bağırmıyordu. Dişlerini sıkmış, demirin tadını ala ala ilerliyordu. Birden önündeki kalabalık yarıldı. Açıklığın öte ucunda, kırık bir sancağın altında, ak zırhlı genç bir adam gördü. Miğferi düşmüştü. Alnından kan sızıyordu. Kılıcı elindeydi, ama onu kaldırmış değil, indirmiş tutuyordu. Bir askerine, yerdeki yaralı bir orkun üstünden çekilmesini işaret ediyordu.

Edran başını kaldırdı. İki kral göz göze geldi.

Belki on soluk sürdü. Volgar, karşısında nefret etmeye yemin ettiği kralı aradı ve yorgun, dehşet içinde, kendi oğlu yaşında olabilecek bir genç buldu. Edran ise masallardaki canavarı aradı ve gözlerinde öfkeden çok yas olan, ağır bir çekici bir yük gibi taşıyan bir ork gördü.

İkisi de bir adım atmadı.

Sonra aralarına bir süvari dalgası girdi. Marven'in kendi muhafızlarıydı; emirsiz hücum etmişlerdi. An kayboldu.

Gün battığında kimse kazanmamıştı. İki ordu da kamplarına çekildi, ardlarında binlerce ölü bıraktı. Gece boyunca ovada yaralıların iniltisi duyuldu.

O iniltilerin arasında, cesetten cesede sessizce dolaşan kül rengi gölgeleri kimse fark etmedi. Yalnızca iki genç izci gördü. Biri insan, biri ork, savaş alanının kıyısındaki bir hendekte yan yana yatıyorlardı.

"Topluyorlar," diye fısıldadı Thrak. "Bak. Her ölünün başında eğiliyorlar."

"Neyi topluyorlar?"

"Bilmiyorum. Ama doyuyorlar." Yutkundu. "Savaş onların sofrası."

Lira gözlerini karanlıktaki dikilitaşa çevirdi. "Bu gece," dedi. "Yarın yine dövüşecekler. Bu gece gidiyoruz."


VII. Taşın Sırrı

Dikilitaşa gece yarısından sonra ulaştılar. Yakından, uzaktan göründüğünden çok daha büyüktü: üç adam boyunda, kara, soğuk. Çatlağı, içine bir kol girecek kadar genişti. Çevresinde ot bitmiyordu.

Rünler iki yüzü de kaplıyordu, ama yüzyılların yosunu ve kiri altında silikleşmişlerdi. Thrak bıçağının sırtıyla yosunu kazıdı. Lira fenerini tuttu.

"Bu yüz bizim," dedi Thrak. "Yemin rünleri. Dorrak'ın adı. Şurada Seraine'inki, sizin harflerinizle." Parmağı aşağıya, çatlağın kenarına indi. Kaşları çatıldı. "Ama bunlar... bunlar sonradan çıkmış. Kazınmamışlar. Bak, kenarları keskin değil. Sanki taşın içinden büyümüşler."

"Yeminin kendisi," dedi Lira. Sesi kısılmıştı. "Sözü ilk bozanın adı taşa yazılacak, taş onu unutmayacak. Bunu çocukken ezberletirler bize. Bir söz sanırdık."

"Söz değilmiş."

Thrak rünleri okumaya başladı; yavaş yavaş, hecelerde takılarak. Yashka'nın ona öğrettiği eski dildi bu. Lira öteki yüzde aynı satırların Elentha yazısıyla belirdiğini gördü ve onunla birlikte okudu. İki ses, iki dilde, aynı cümleleri söyledi:

Kızıl Ay'ın gecesinde yemin bozuldu, ama yemin edenlerin eliyle değil.

Konuğu öldüren el ork değildi; ork bıçağı tutuyordu.

Kuyuyu zehirleyen el insan değildi; insan şişesi tutuyordu.

İkisi de aynı eldi. Kül rengi giyer, ateşsiz kazanın çevresinde toplanır, ölenlerin soluğuyla beslenir.

Adı Küllerin Tarikatı'dır. Yemini o kırdı. Taş gördü. Taş unutmadı.

Lira'nın feneri titriyordu. Üç yüz yıl. Yüz binlerce ölü. Hepsi bir yalanın üzerine.

"Ugrath," dedi Thrak boğuk bir sesle. "Kralımızın babası. Benim babam. Hepsi..."

"Benimki de," dedi Lira.

Bir an sustular. Sonra Thrak'ın kulakları dikildi. Lira'yı kolundan yakalayıp çatlağın karanlığına çekti. Feneri pelerininin altına bastırdılar.

Ottan nal sesleri geliyordu. Tek bir atlı. Dikilitaşın on adım ötesinde durdu ve indi. Ay ışığında zırhının omzundaki mareşal nişanı parladı.

Lira nefesini tuttu. O yürüyüşü, o dimdik duruşu çocukluğundan beri tanırdı.

Karanlığın içinden, hiçbir ses çıkarmadan, kül rengi bir cübbe belirdi. Sonra bir tane daha. Marven onların önünde eğilmedi, ama başını önüne indirdi. Otuz yıldır hiçbir kralın önünde yapmadığı biçimde.

"Bugün iyi bir hasattı," dedi cübbelilerden biri. Sesi kuru yaprak hışırtısı gibiydi.

"Yarınki daha iyi olacak," dedi Marven. "Çocuk kral tereddüt ediyor. Bugün orkla göz göze geldi ve kılıcını kaldırmadı. Araya adamlarımı sürmek zorunda kaldım."

"Tereddüt tehlikelidir."

"Biliyorum. Yarın ikisi de sahada olacak. İkisini de taşın önüne, tam ortaya çekeceğim. Kragmir kralı bire bir dövüşü reddetmez; babasının öcü var. Edran da ordusunun önünde meydan okumadan kaçamaz." Bir an sustu. "Hangisi düşerse düşsün, öteki halk yüz yıl daha affetmez."

"Ve ikisi birden düşerse?"

Marven'in sesi alçaldı. "O zaman vaat ettiğiniz şey gerçekleşir. Bana Elentha'yı vereceğinizi söylediniz."

"Sana söz verdiğimizi vereceğiz, Mareşal," dedi cübbeli. Sesinde, Lira'nın tüylerini ürperten bir eğlence vardı. "Tarikat sözünü tutar. Yeminleri bozan biz değiliz, öyle değil mi?"

Kuru, soluk bir gülüş duyuldu. Sonra gölgeler karanlığa çekildi. Marven atına bindi ve Elentha kampına doğru sürdü.

Çatlağın içinde Lira'nın tırnakları avuçlarına batmıştı.

"Köyler," diye fısıldadı. "Yanan köyler. Madencileriniz. Hepsi oydu. Bana ata binmeyi o öğretti, Thrak."

Thrak bir şey demedi. Bıçağını çıkardı ve çatlağın kenarından, yeni rünlerin belirdiği yerden avuç içi kadar bir taş parçası kopardı. Üzerinde, iki yazıyla da, tek bir satır okunuyordu: Yemini o kırdı.

"Senin kralın sana inanır mı?" diye sordu.

"İnanır. Ya seninki?"

Thrak taş parçasına baktı. "Benimki kimseye inanmaz. Ama taşa inanır. Biz dağın çocuklarıyız."

Doğuda gök ağarıyordu. Uzakta, iki kampta da borular ötmeye başlamıştı.


VIII. Tarihin Külleri

Sabah kızıl doğdu.

İki ordu, dünkü ölülerini bile toplayamadan yeniden saf tuttu. Yorgundular. Öfkeden çok alışkanlıkla dizilmişlerdi. Ve her şey Marven'in söylediği gibi oldu: Elentha saflarından bir haberci çıkıp Kragmir kralını, iki ordunun ortasında, çatlak taşın önünde teke tek dövüşe çağırdı.

Edran bu çağrıyı kendisinin yapmadığını biliyordu. Marven'e döndü.

"Benim adıma kim konuştu?"

"Ordunuz konuştu, Majesteleri," dedi Mareşal, gözünü ovadan ayırmadan. "Bir gün daha böyle kırılamayız. Tek bir dövüş, binlerce canı kurtarır. Bitirmek istediğiniz savaş bu değil miydi?"

Karşıda ork safları yarılmış, Volgar yürümeye başlamıştı bile. Yerkıran omzundaydı. Edran'ın ardında on bin göz ona bakıyordu. Derin bir soluk aldı, kılıcını çekti ve yürüdü.

Dikilitaşın gölgesinde buluştular. İki ordunun uğultusu uzaklaşmış, yerini rüzgârın ıslığı almıştı.

Volgar yakından daha da iriydi. Zırhı dünkü kanla kararmıştı.

"Dün beni gördün," dedi. Sesi derinden, taş yuvarlanır gibi geliyordu. "Kılıcını kaldırmadın."

"Sen de çekicini."

"Bugün kaldıracağım, insan kralı. Babam bu toprakta yatıyor."

"Benimki de," dedi Edran. "Seninkini ben öldürmedim. Benimkini de sen öldürmedin. Yine de buradayız." Kılıcını kaldırdı, ama ucu titriyordu. Korkudan değil. "Sana bir şey sormak istiyorum, Demirdiş. Vurmadan önce. Kızıl Ay gecesi kül rengi cübbeli yabancılardan söz edildiğini hiç duydun mu?"

Volgar'ın gözleri kısıldı. Yashka'nın sesi bir an kulağında çınladı. Ama ardında ordusu, omzunda babasının çekici vardı.

"Kelimelerle vakit kazanıyorsun."

"Belki. Kelimeler elimdeki tek şey."

Volgar Yerkıran'ı iki eliyle kavradı. Edran duruşunu aldı. İki ordu soluğunu tuttu.

"DURUN!"

Ses kuzeyden geldi. İki atlı ovayı dörtnala yarıyordu. Hayır, tek at. Sırtında iki binici. Önde örgülü saçları çözülmüş bir kız, arkasında ona tutunmuş genç bir ork. İki ordudan da şaşkınlık uğultusu yükseldi. Bir insanla bir ork, aynı eyerde.

"Okçular!" Marven'in sesi Elentha saflarından kamçı gibi şakladı. "O bir ork! Prensesi rehin almış! Vurun!"

Birkaç yay gerildi.

"Yayını geren elini kaybeder!" diye gürledi Edran. Sesi, kimsenin ondan beklemediği kadar güçlüydü. Yaylar indi.

At, taşın dibinde şaha kalkarak durdu. Lira eyerden atladı, dizlerinin üstüne düştü, doğruldu. Thrak onun ardından indi ve doğruca kendi kralının önüne gidip tek dizinin üstüne çöktü. Avucundaki taş parçasını uzattı.

"Kralım. Bana ork ya da insan gibi görünmeyen her şeyi gözlememi emrettin. Gözledim."

Volgar taşa baktı. Rünleri okudu. Bir kez. Sonra bir kez daha. Yüzündeki öfke silinmedi, ama yönünü yitirdi; hedefi elinden alınmış bir ok gibi.

"Bunu nereden kopardın?"

"Arkanızdaki taştan. Dönün ve kendiniz okuyun. Taş üç yüz yıldır yazıyor, kralım. Bakan olmadı."

Lira bu arada ağabeyine nefes nefese anlatıyordu: çukuru, ateşsiz kazanı, rünleri, gece yarısı taşın önüne gelen atlıyı. Edran dinlerken yüzü taş kesildi.

"Marven," dedi sonunda. Bir soru değildi bu.

"Kendi kulaklarımla duydum. Köyleri o yaktırdı. Madencileri o öldürttü. Sizi buraya o getirdi, ikinizi de. Hanginiz düşerse düşsün, yüz yıl daha." Lira'nın sesi çatladı. "İkiniz birden düşerseniz Elentha ona kalacak."

İki kral aynı anda dikilitaşa döndü. Sabah güneşi rünlerin üzerine eğik düşüyordu ve yeni satırlar, yosunu kazınmış yüzeyde, kör bir gözün bile okuyabileceği kadar açıktı. Volgar bir yüzden okudu, Edran ötekinden.

Yemini o kırdı. Taş gördü. Taş unutmadı.

Volgar'ın çenesi kasıldı. Demir dişinin tadı ağzına doldu: babasının düştüğü günün miğferinden dökülmüş demir. On altı yaşından beri yanlış düşmana kin gütmüştü. Babası da. Onun babası da.

Yerkıran'ın başı yavaşça yere indi.

Edran kılıcını indirdi.

İki ordunun üzerinde derin bir sessizlik vardı. Yüz bin kişi bir çekicin ve bir kılıcın birlikte indiğini gördü. Bu, üç yüz yıldır görülmemiş bir şeydi.

"İnsan kralı," dedi Volgar boğuk bir sesle. "Eğer bu doğruysa..."

"Doğru," dedi Edran. "Bunu ikimiz de yıllardır seziyorduk."

O an rüzgâr kesildi.

Önce bir koku geldi. Sönmüş ateş, ıslak ocak, eski yangın kokusu. Sonra gökten ince, gri bir şey yağmaya başladı. Kar değildi. Lira avucunu açtı ve üç gece önce çamurda bulduğu şeyi tanıdı.

Kül yağıyordu.

Dikilitaşın çatlağından, karanlığın içinden biri çıktı. Uzun boyluydu, kül rengi cübbesi yere sürünüyor ama ot üzerinde iz bırakmıyordu. Başlığının altında bir yüz yoktu sanki; yalnızca gölge ve gölgenin içinde, uzakta sönmekte olan iki kor.

Konuştuğunda sesi hem çok yakından hem çok uzaktan geldi. İki ordu da onu duydu.

"Üç yüz yıl," dedi Tarikat'ın lideri. "Bu taşın önünde iki hükümdarın silah indirdiğini görmeyeli üç yüz yıl oldu. Dorrak ile Seraine de tam böyle durmuştu. Tam bu yüz ifadesiyle. Umut." Kelimeyi, ağzında tadı bozuk bir lokma gibi çevirdi. "Onu bir gecede söndürmüştük."

Volgar Yerkıran'ı kaldırdı. "Adını söyle, yaratık."

"Adım yok, Demirdiş. Bir zamanlar vardı. O da yandı." Korlar Volgar'a döndü. "Ama seni tanırım. Babanın koltuk altındaki zırh aralığını o mızrakçıya kim gösterdi sanıyorsun? Senin şamanın akıllıdır. Onu dinlemeliydin. Yıllar önce."

Sonra Edran'a döndü. "Ve sen, söze güvenen çocuk. O parşömenin yarısını yakan elin kimin olduğunu hiç merak etmedin mi? Mareşalin, sadakatini bana senin doğumundan önce sattı."

Elentha saflarında bir kargaşa koptu. Marven atını geri çekiyordu; çevresindeki subaylar ondan uzaklaşıyor, kendi muhafızları ona bakıyordu. Yüzü ilk kez, otuz yıldır ilk kez, bembeyazdı.

"Bana söz verdiniz!" diye bağırdı. "Elentha benim olacaktı!"

"Olacak," dedi cübbeli, ona bakma zahmetine bile girmeden. "Külü senin olacak. Sana krallık vaat etmedik, Mareşal. Sana ne kalırsa onu vaat ettik."

Lider kollarını iki yana açtı ve kül yağışı sıklaştı.

"Eski bir söz vardır. İki halk da bilir, iki halk da birbirine savurur. Orklar insanlar için söyler, insanlar orklar için: İkisi de tarihin külleri olacak. Bir beddua sandınız. Bir savaş narası sandınız." Korlar parladı. "O bir beddua değil. O bizim duamız. Onu ağzınıza biz koyduk. Üç yüz yıldır her hasatta, her yanan köyde, her düşen kralda onu siz bizim için söylediniz."

İki orduda, saflar arasında, bir kıpırtı başladı. Burada bir yaver pelerinini sıyırdı; altından kül rengi bir kumaş çıktı. Orada bir ork erzakçısı, başına gri bir başlık çekti. Bir sancaktar. Bir şifacı. Bir haberci. Birer birer, iki halkın arasından, yıllardır yan yana yemek yedikleri yüzlerin içinden gri gölgeler ayrıldı. Sayıları kimsenin sandığından çoktu.

Thrak, Lira'nın yanına geldi. Bıçağı elindeydi. Lira yayına bir ok yerleştirdi. Omuzları birbirine değdi ve ikisi de geri çekilmedi.

"Savaş bitmeyecek," dedi Tarikat'ın lideri, neredeyse şefkatle. "Bitemez. Gerçeği öğrenmeniz hiçbir şeyi değiştirmez. Arkanıza bakın. Yüz bin kişi birbirinin babasını, kardeşini, oğlunu öldürdü. Bir taşın üstündeki yazı için bunu unutacaklarını mı sanıyorsunuz? Kin, sizin bana verdiğiniz en sadık kuldur. Ben yalnızca ilk kıvılcımı çaktım. Ateşi üç yüz yıl boyunca siz beslediniz."

Sustu. Kül, iki kralın omuzlarına, saçlarına, indirilmiş silahlarına yağıyordu.

Volgar başını çevirip arkasına, Kragmir saflarına baktı. Sonra Elentha'ya. Yaratık haklıydı ve en korkuncu buydu. Orada, o saflarda, dün kardeşini gömmüş binlerce asker vardı. Bir kral onlara dur diyebilirdi. Ama affet diyebilir miydi?

Gözleri Edran'ınkilerle buluştu. Dün savaşın ortasında olduğu gibi. Ama bu kez aralarına kimse girmedi.

"İnsan kralı," dedi Volgar alçak sesle. "Halkım seni affetmeyecek."

"Benimki de seni," dedi Edran.

"Ben de seni affetmiş değilim."

"Biliyorum."

Volgar, Yerkıran'ın sapını kavradı. Demir dişi, külün arasından sızan kızıl ışıkta parladı. "Ama babam bana bir şey söylemişti. Bu ovada yatmamamı."

Edran kılıcını kaldırdı. Yüzünde korku vardı. Altında, ondan daha inatçı bir şey de vardı.

"Çelik bile bir gün paslanır," dedi usulca. "Belki kin de."

"Toprak, çekice boyun eğer," diye karşılık verdi Volgar. "Görelim, kül de eğer mi."

İki kral, yüzleri aynı yöne dönük, çatlak taşın önünde yan yana durdu. Bir adım ötelerinde bir insan kızı yayını germiş, bir ork delikanlısı bıçağını sıkmıştı. Karşılarında yüzsüz bir gölge ve onun ardında, iki ordunun içinden doğrulmuş sayısız gri cübbe vardı.

Arkalarında yüz bin asker soluğunu tutmuş bekliyordu. Kimse ilk boruyu kimin çalacağını bilmiyordu. Kimse o borunun hangi yöne hücum emri vereceğini de bilmiyordu.

Tarikat'ın lideri başını hafifçe yana eğdi. Merak etmiş gibiydi. Belki de üç yüz yıl içinde ilk kez.

Ve dikilitaşın derininde, çatlağın en dibinde, kimsenin henüz görmediği bir yerde, incecik yeni bir rün belirmeye başladı.

Ne yazdığını o gün kimse okumadı.

Kül, Vahran'ın üzerine yağmaya devam etti.
```
