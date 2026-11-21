# VAHRAN Uyumluluk Paketi — Claude inceleme notları (21.11.2026)

Kaynak: `VAHRAN_Uyumluluk_Duzeltilmis_P01–P05_of_05.zip` (5 bağımsız ZIP, tek kökte birleştirildi, 45 dosya).
Karşılaştırma: güncel kaynak `oyun-son/` (HEAD). Oyunda test YAPILMADI: bu pakette üretim varlığı yok, yalnız belge ve referans var.

## 1. Paketin içeriği
| Klasör | İçerik | Durum |
|---|---|---|
| `00_ONCE_OKU.md` | Yetki sırası, çözülen çelişkiler, iş bölümü | Bağlayıcı |
| `01_GUNCEL_KARARLAR/` | 12 sayfalık Görsel Vizyon ve Teknik Üretim Rehberi, 3 sayfalık Üretim ve Teslim Planı, GPT'nin değişiklik gerekçeleri | Bağlayıcı |
| `02_TEK_NIK_DOGRULAMA/` | EKRANLAR, OYUN_VERISI, VARLIK_ENVANTERI, GPT_YANIT_21KASIM, onaylı Kragmir sahnesi | Bizim gönderdiğimizle **birebir aynı** (değişiklik yok) |
| `03_SANAT_REFERANSLARI/` | 25 görsel, "yalnız referans" etiketli | Bağlayıcı değil |
| `04_HIKAYE/` | VAHRAN_destan.txt | Repodakiyle aynı |
| `90_ARSIV/` | Eski YERLESIM_SPEC, eski PDF'ler, 2 eski ZIP | Bağlayıcı değil |

Paketteki aksaklıklar:
- `00_ONCE_OKU.md` §6, `PARCA_INDEKSI.md` ve `DOSYA_ENVANTERI_SHA256.json` dosyalarına atıf yapıyor; **ikisi de pakette yok**. Bütünlük ancak ZIP'lerin açılmasıyla doğrulanabildi (5'i de hatasız açıldı).
- Yinelenen dosyalar: `1000139442.png` = `1000139442(1).png`; `1000148238(1).png` = `Kragmir_Kalesi_rehber_sayfa_2.jpeg` (aynı bayt; uzantısı .jpeg olsa da PNG/JPEG karışık).
- `kragmir-sahne-onaylanan.jpg` = oyundaki `_tasarim/gelen/sehir-tekparca/ocak.jpg` (aynı dosya).
- Arşivdeki `DEMIR_DIYARI_GORSEL_TASARIM_PAKETI.zip` daha önce gelenle aynı.
- Klasör adı yazım hatası: `02_TEK_NIK_DOGRULAMA` ("TEKNİK").

## 2. Yeni kararlar (bizim için geçerli olanlar)
1. Bina, şehir, kale üretimi **yok**. Kale yalnızca malzeme/ışık kalite çıtası. → Mevcut 2B başkent ve Çarşı sahneleri olduğu gibi kalır.
2. Arayüz yerleşimi, ölçek ve bileşen geometrisi **baştan tasarlanabilir**; eski `YERLESIM_SPEC.md` artık bağlayıcı değil, yalnız teknik ölçü kaynağı.
3. Mekanikler, ekran işlevleri, düğmeler, sınıf sayısı, eşya ve savaş sistemi değişmez.
4. Karakter oluşturma ve ekipmandaki **canlı three.js 3B önizleme korunur**; 2B karakter resmiyle değiştirilmez.
5. Kragmir ve Elentha aynı geometri ve davranışı paylaşır; yalnız renk, arma ve malzeme farklıdır.
6. Yazılar ve sayılar görsele gömülmez; HTML/CSS'te kalır.
7. Üretim sırası: (1) UI kiti → (2) çanta + mağaza + eşya simgeleri → (3) karakter oluşturma + ekipman → (4) savaş HUD → (5) kalan ekranlar. İş başına tek ZIP (gerekirse numaralı parçalar); ara "devam" onayı istenmiyor.
8. Teslim şeması: `paket-N-ad/` → `MANIFEST.md`, `onizleme.png`, `ui/{ocak,sancak,ortak}/`, `simge/`, `esya/`, `bg/`, `vfx/`.

## 3. Kodla karşılaştırma: doğrulananlar
| İddia (rehber) | Kodda | Sonuç |
|---|---|---|
| 4 sınıf | `shared/content.js` CLASSES: warrior Savaşçı, rogue Suikastçı, priest Şifacı (halka göre ad değişir: `applyFactionNames`), mage Büyücü | ✔ 4 sınıf. Referans Ek 05'teki 6 sınıf simgesi (Okçu, Koruyucu dahil) yalnız estetik örnek |
| Görünüş: cinsiyet, yüz, saç, saç rengi, göz rengi, ten, sakal, beden, boy; Rastgele/Varsayılan | `js/ui-olustur.js` (Cinsiyet Erkek/Kadın, Yüz, Saç, Saç rengi, Göz rengi, Ten rengi, Sakal, Boy, Rastgele, Varsayılan) | ✔ |
| 13 ekipman yuvası | `shared/items.js` SLOTS (5 zırh) + sağ/sol el + takılar | ✔ |
| Mağaza sekmeleri Yakut ile / Gerçek para / Ücretsiz | `js/ui-odeme.js:205` | ✔ |
| Savaş: 2x, Çekil | `js/ui-battle.js` | ✔ |
| Paralar Akçe, Yakut, Enerji, Şan, Örs Tozu, Külçe | js/shared içinde hepsi geçiyor | ✔ |
| Halk kodları ocak/sancak/ortak | `html[data-faction]`, `img/kd/ui/{ocak,sancak,ortak}` | ✔ |
| `--s` ölçeği | `js/orient.js:65` → `--s = min(yükseklik/1080, 1)` | ✔ Artık VAR (846×412'de ≈ 0,38) |
| 14 silah türü × 8 kademe | `shared/items.js`: sword, axe1, sword2, axe2, spear, lance, mace2, dagger, jamadar, bow, xbow, mace, staff, shield | ✔ (14 türün biri kalkan) |

## 4. Uyuşmazlıklar ve GPT'ye bildirilecekler
1. **Eşya simgesi adları.** Rehber örneği `esya-kilic-k4.png` (Türkçe tür adı). Kod tür kimlikleri İngilizce: `sword, axe1, sword2, axe2, spear, lance, mace2, dagger, jamadar, bow, xbow, mace, staff, shield`. Öneri: **kod kimliği kullanılsın** → `esya-sword-k4.png`. Böylece eşleme tablosu gerekmez, karışıklık olmaz.
2. **Eksik kademeler.** Jamadar 1. kademe yok (`from: 1`). Arbalet 1–4. kademeler yok (`from: 4`; ilk kademe 5). "1., 4., 8. kademe" listesi bu iki türde uygulanamaz → jamadar: k2/k4/k8, arbalet: k5/k6/k8 istenmeli. Ayrıca kademe numarası 1–8 olacak (kodda indeks 0–7; çeviriyi biz yaparız).
3. **Zırh simgeleri sınıfa göre farklı olmalı.** Zırh türü sınıfa bağlı (plate / leather / chain / robe). "5 zırh yuvası × k1, k8 = 10 simge" yetmez; doğru sayı 5 yuva × 4 zırh tipi × 2 kademe = **40**. En azından ilk aşamada zırh tipine göre ayrılmalı.
4. **Rehber §6 hâlâ YERLESIM_SPEC'i sözleşme sayıyor** ("detaylar YERLESIM_SPEC.md sözleşmesine göre"); `00_ONCE_OKU.md` ise geçersiz diyor. `00_ONCE_OKU` üstün; GPT'ye bu cümlenin geçersiz olduğunu hatırlat.
5. **Yayın dosya sınırı (en kritik teknik kısıt).** Yayın bir sürümde en fazla 511 dosya alır; şu an 513 dosya var, yayında 511 (sınırda). Bu yüzden:
   - Yeni görseller ayrı dosya olarak eklenemez; WebP'ye çevrilip CSS'e gömülecek (`v26-gom.py` yöntemi) veya eski dosyalar çıkarılacak. GPT'nin ayrı dosya teslimi doğru; birleştirme bizim işimiz.
   - **VFX**: rehber "256×256, 8–16 kare" diyor. Ayrı kare dosyaları istenmesin; efekt başına **tek kare-şeridi PNG** (MANIFEST'te sütun/satır/FPS) istensin.
   - Tek metin dosyası ≤16 MB: gömülü CSS paket başına bölünmeli; WebP kalite ~80.
6. **9-slice payları.** Kodda kullanılan dilimler 48 ve 64 px (`--u-pb 64`, `--u-po 48`, `--u-b2n 64`, `--u-toast 96`). Rehberin "48–64 px" aralığı uyumlu. Düğmeler 480×160'ta çizilip 50% yatay + 64 dikey dilimle uzatılıyor; köşe süsü bu payın içinde kalmalı.
7. **Ölçü gerçeği.** 846×412 telefonda 1080 birim ≈ 0,38 → 480×160 düğme ≈ 182×61 CSS px, 256 yuva ≈ 97 px, 64 birim simge ≈ 24 px. İnce filigran bu ölçekte kaybolur; rehber de bunu söylüyor.
8. **Nadirlik.** Oyunda 3 derece var (Standart/Nadir/Eşsiz). Yuva dosya adları `siradan/nadir/efsanevi/bos`; "efsanevi" = Eşsiz. Rehber de böyle; ✔. Simgenin içine çerçeve çizilmemesi doğru.
9. **Adlar.** Silah ve canavar adlarının çoğu İngilizce (Short Sword, Kukry, Mirage Dagger, Iron Impact…). "Reaper" kodda bir yaratık (`shared/bestiary.js`), silah değil; arşivdeki "Reaper efekti" notu tırpan biçimli `lance` kademelerine (Battle/War/Grim Scythe) denk geliyor olabilir. Türkçeleştirme kararı kullanıcının.

## 5. Paket bazında hazırlık
| Paket | Kodda karşılığı | Korunacak | Hazır mı? | Bağlı olduğu bilgi |
|---|---|---|---|---|
| 1 UI kiti | `img/kd/ui/{ocak,sancak,ortak}` + `css/v26-gpt4.css` (gömülü) | Tüm durumlar (-normal/-basili/-pasif/-secili/-dolu/-bos) | **Hazır** | Yok. Aynı dosya adları gelirse doğrudan değiştirilir |
| 2 Çanta + mağaza + eşya | `js/item-icons.js`, `img/items3d/`, `js/ui-odeme.js`, çanta/Kervan | Kuşan/Güçlendir/Sat/Parçala, ↑/↓ karşılaştırma, sekmeler | **Koşullu** | Madde 1–3 (ad kalıbı, eksik kademeler, zırh tipi) GPT'ye iletilmeli |
| 3 Karakter oluşturma + ekipman | `js/ui-olustur.js`, three.js önizleme | 4 sınıf, 9 görünüş ayarı, 13 yuva, 3B dönen model | **Hazır** | Çerçeveler 3B alanı örtmemeli; önizleme alanının ölçüsünü maketten alacağız |
| 4 Savaş HUD | `js/ui-battle.js`, `hud17.js` | Saldırı + 4 yetenek, iksirler, Çekil, 1x/2x, Otomatik, sıra şeridi, boss barı | **Koşullu** | VFX kare-şeridi biçimi (madde 5) |
| 5 Kalan ekranlar | çeşitli `ui-*.js` | EKRANLAR.md'deki her düğme | Sonra | 1–4'ün onaylanan dili |

## 6. Gerçek cihazda doğrulanacaklar (entegrasyonda)
- 846×412 ve 1440×1080'de dokunma hedefleri ≥120 birim (≈46 px).
- 3B önizlemenin döndürme alanına çerçeve veya efekt binmemesi; efekt katmanlarının dokunmayı engellememesi (`pointer-events:none`).
- Çentik payları (130 / alt 58) ve dik telefonda 90° dönen gövde.
- gfx low/min ve azaltılmış hareket kipinde VFX'in kapanması.

## 7. Sonuç
Bu paket üretim teslimi değil; yön ve yetki belgesi. Kodla çelişen büyük bir karar yok. Paket 1 (UI kiti) hemen üretilebilir. Paket 2 öncesinde GPT'ye §4 madde 1–3 ve 5 iletilmeli.
