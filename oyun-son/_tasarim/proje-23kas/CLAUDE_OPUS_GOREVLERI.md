# Claude Opus 5.5 · P23 kod görevleri (K1–K12)

**Önce oku:** depo kökündeki `CLAUDE.md` (oturum hafızası, yayın kuralları, 511 dosya sınırı, `node --check` dersi), sonra `_tasarim/proje-23kas/00_PROJE_VE_SIRA.md`.
Ekran görüntüleri: `_tasarim/proje-23kas/REFERANS_EKRAN/` (telefon, yatay).

## Kurallar
- `shared/` = mekanik, DOKUNMA. Değerleri oku, değiştirme.
- Yeni CSS → `css/duzen.css` SONUNA (bölüm başlığı `/* ===== P23 Kn ... ===== */`).
- Yeni görseller gömülü JS'e (`_tasarim/araclar/gom.py tarif/<x>.json js/<x>-png.js`); dosya sayısı yayında 485/511.
- Her değişen JS'i `.mjs` kopyasıyla `node --check` et (sürüm 37 dersi).
- Her işin eski görünüşe dönüş bayrağı olsun: `html.p23` sınıfı, kapatma `localStorage dd_p23='0'` / `?p23=0`.
- Kullanıcı kararı: tur testi yapma; tek ekran düzen kontrolü serbest (880×406, dpr 2.66). Denenmesi gerekenleri `_tasarim/EKSIK_LISTESI_SON.md` 2B'ye yaz.
- Bitince: commit, yayın (sürüm 39; `git diff --name-status <sürüm 38 yayın commit'i> HEAD -- oyun-son`, `_tasarim` hariç), bağlantıyı ver, `CLAUDE.md` "SON DURUM"u güncelle.

## Görevler

### Görsel beklemeyen (hemen başla)

**K2 · Öğretici hatası** (U4, E2; ekran 09) — `js/ui-kalicilik.js` (~445, savaş adımı), `js/combat.js:52` (`oto-tip`)
1. Önce hatayı yeniden üret: yeni karakter → öğretici → ilk savaş. Kullanıcı yalnız "bug" dedi; ekran görüntüsünde görülen: öğretici kutusu ("Sıra sendeyken alttaki çubuktan bir yetenek seç…") ile "Otomatik açık!" ipucu aynı anda; otomatik açıkken öğretici elle yetenek seçtirmeye çalışıyor; konuşan adı sekmesi "Bru…" kesik.
2. Düzelt: öğretici savaşında Otomatik kapalı başlasın ve `oto-tip` öğretici bitmeden çıkmasın (yalnız görünüş/akış; savaş motoru değişmez). Ad sekmesi tam görünsün.
3. Bulduğun başka öğretici hatalarını da düzelt, listesini rapora yaz.

**K3 · Savaş üst şeridi ve yetenek çubuğu** (U5, U6, E3; ekran 09) — `combat.js:251` (`#bwave`), `css/v31-savas-hud.css` (OTOMATİK: `_tasarim/araclar/v31-sablon.css` → `v31-gom.py`), `duzen.css`
1. Dalga kutusunun üstündeki çıkış (X) düğmesi **yarı boyuta** insin (dokunma alanı en az 32 px kalsın), "DALGA 1 / 3" yazısı **yukarı** taşınsın (X ile çakışmasın).
2. Yetenek çubuğunu denetle: sarı çerçevenin oyuncu çerçevesine binmesi, üstten kesilme, kilitli yuvalar, iksirlerin kopuk sütunu, 5 yetenek + temel + 2 iksir doğru sırada mı, dar ekranda (760 altı, `html.narrow`) taşma. Gemini N2 ölçüsü gelirse ona uy.

**K9 · İksir ve Parşömen tek sayfa** (U12, E7; ekran 03) — `js/ui-town.js` (İksirler/Parşömenler sekmeleri)
- Sol sekme menüsü kalksın; tek kaydırılabilir sayfa: üstte Maelis şeridi, altında "İksirler" ve "Parşömenler" başlıklı iki grup kart. Fiyat düğmelerinde para simgesi. Gemini N7 maketine uy.

**K11 · VS ekranı** (U14, E1; ekran 01) — `js/ui-battle.js renderVs` (~129), `waveCard`, `vsMain`, `js/yaratik2d.js`, `js/savas-arka.js pickBg`
1. "Bazı yaratıklar görünmüyor": hangi türlerde boş kaldığını bul (2B paketi inmeden çizim, `data-m2d` geç dolma, 3B'ye düşen 13 tür, kahraman rakip). Paket inince yerinde dolsun; hiçbiri boş kalmasın (en kötü durumda 3B portre).
2. **Arka plan:** savaşın yapılacağı yerin boyalı savaş arka planı (`pickBg` ile aynı seçim) VS'nin arkasında, karartılmış ve hafif bulanık. `savasOnYukle()` ile önden indir (C14 tembel yükleme korunur).
3. Ad kesilmesi ("AZILI KÜÇ…"), dalga kartı taşması ("3. Dalga" kutudan çıkıyor), düşman çiziminin yazı kutusunun arkasında kalması düzelsin.

**K10a · Test araçları geri** (U13, E10) — `js/api.js:19 devUI()`
- Test araçları ve DENEME rozeti **varsayılan görünür** olsun (Profil penceresinde, K10b düzeninde). Play Store derlemesi için tek bayrak: `window.DD_STORE = true` (ya da `?store=1`) → gizli. Bayrağı `EKSIK_LISTESI_SON.md` 2C-1'e (Android paketi) not et.

**K5 · Menü (glifsiz kısım)** (U8, E6; ekran 07) — `js/ui-hub.js` (menü penceresi)
- Tek ızgara, tek kart biçimi, tek yazı boyu; iki sütun aynı yükseklikte. "Sunucu: Ares" madde değil, menü başlığının altında küçük bilgi. Uzun adlar kısalır ("Ayarlar"; açıklama alt satırda küçük). Gemini N4 glifleri gelince simgeler tek takım olur.

### Görsel/maket bekleyen

**K1 · Karakter seçme ve oluşturma** (U1–U3; ekran 10, 11) — `js/ui-karakter.js`, `js/ui-olustur.js`, `js/amblem-png.js`, `css/v33-karakter.css` (OTOMATİK: `v33-sablon.css` → `v33-gom.py`)
1. "Korant Online" başlığının önündeki sembol → GPT A1 işareti.
2. Karakter tam boyu biraz küçülüp **geri** gitsin, ayakları zemindeki dairenin **ortasına** otursun (iki ekranda da, iki halkta, 4 sınıf × 2 cinsiyet; ayak noktası her pozda farklı olabilir, gerekirse poz başına ofset tablosu).
3. Dairedeki sembol: GPT A2 zemin mührü (Elentha/Kragmir), perspektifli ve saydam; seçili halka göre değişir. Arka plan resminin içindeki eski sembolün üstünü tam örtmeli; örtmüyorsa GPT'den sembolsüz arka plan iste (A2-b).
4. "Karakter Oluştur" bandı → Gemini N1 + GPT A3 levhası; yazı kodla (TR/EN).

**K4 · Ana ekran parçaları** (U7, E5, E9; ekran 08, 04) — `css/arayuz.css`, `css/duzen.css` (eski v29 ana ekran bölümü), `js/ui-hub.js`
- Gemini N3 maketine ±4 px uy; çerçeveler GPT A4 parçalarından (9-dilim).
- **Oyuncu kartı** (sol üst): portre, Sv., ad, can/mana; basınca Profil.
- **Görevler kutusu**: başlık, tek görev satırı, ilerleme, "+".
- **Hava kutusu**: saat + hava adı + **bonus/bedel** görünür (kısa yazım `WEATHER[k].short` hazır), basınca açıklama balonu (`WEATHER[k].line`) ve sonraki 6 saatlik dilimin tahmini. Açık havada "Etkisi yok".
- **Premium kutusu**: Premium yoksa çağrı ("Premium · avantajları gör"), varsa kalan gün; hafif parıltı, simge + yazı. Ödeme ilk sürümde kapalı ("Yakında") kuralı sürer.
- Sol üstteki 4 kare düğmeye küçük alt etiket; sağ raydaki "ALIM" kesik yazısı düzelsin.

**K6 · Maden sahnesi** (U9, E4; ekran 06) — `js/ui-sahne.js mineScene(fill, faction)`, `js/ui-town.js:73`, `js/sahne.js`
- Oyuncunun 2B karakteri sahneden çıkar. Yerine GPT A5 madenci (Elentha insan / Kragmir yeşil tenli ork) ve kristal kayalar (Elentha mavi, Kragmir kırmızı); Kragmir için kırmızı kristalli arka plan.
- Durum makinesi (yalnız görünüş): **kaz** döngüsü (vuruş kareleri + kırıntı parçacığı) → araba dolum karesi `stock/cap` oranından (0, ¼, ½, ¾, dolu) → "Topla"ya basınca: madenci arabaya yürür, arabayı boşaltır (cevher sayacı uçarak yükselir), kayaya döner. Depo doluyken madenci bekler/oturur.
- `prefers-reduced-motion` ve düşük grafik ayarında tek kare.
- "Madeni büyüt" satırı ve "500 akçe" düğmesi pencereye sığsın.

**K7 · Otağ tahtı** (U10, E11; ekran 05) — `js/ui-dunya.js:146` ve `:310`
- "Taht boş" ipucunun yerinde GPT A6 tahtı (halka göre). Hükümdar varsa tahtın önünde/üstünde onun portresi ve adı; yoksa boş taht + "Taht boş · pazartesi 00:00'da seçilen oturur".
- Oy çubukları ince, "0 oy" adın yanında.

**K8 · Haritalarda NPC'ler** (U11; ekran 04, 08) — `js/hub2d.js`, `js/hub2d-data.js` (OTOMATİK: `sahne.py`; elle değil, ayrı bir NPC katmanı ekle), `js/ui-diyalog.js`
- GPT A7 figürleri, Gemini N6 yerleşim tablosundaki noktalara (resim pikseli cinsinden; yakınlaştırmayla birlikte ölçeklenir). Hafif nefes animasyonu; basınca var olan diyalog/eylem (`ACT.building` aynı kimlik).
- İki halkın başkent, çarşı ve klan haritaları. Etiket figürün üstüne kayar.

**K10b · Profil penceresi** (U13, E8; ekran 02) — `js/ui-hub.js` (Profil), `js/ui-core.js`
- Gemini N8 maketi + GPT A8 arka planı. Bölümler: kimlik şeridi (portre, ad, unvan, halk, sunucu), güç ve eşya seviyesi, rütbe/TP ilerlemesi, istatistik kartları, **Test araçları** bölümü (K10a bayrağıyla).

**K12 · Kapanış**
- `EKSIK_LISTESI_SON.md` 2B'ye P23 test maddelerini yaz; yayın; kullanıcıya bağlantı + değişiklik özeti + tek ekran görüntüsü (iki halktan birer).
