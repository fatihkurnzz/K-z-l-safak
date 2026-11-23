# Korant · Arayüz ve sahne yenileme projesi (P23)

**Tarih:** 23.11 · **Sahibi:** Fatih (karar veren) · **Uygulayıcılar:** Claude Opus 5.5 (kod), Gemini Neon 4 (tasarım, maket, denetim), GPT Astra 6.2 (boyalı görsel)

Bu klasör kendi başına yeter: her modele kendi dosyasını ve `REFERANS_EKRAN/` klasörünü (ZIP'leyip) ver.
Paketi hazırlayan Claude hiçbir şeyi uygulamadı; yalnız bu paketi hazırladı.

## Dosyalar
| Dosya | Kime |
|---|---|
| `00_PROJE_VE_SIRA.md` | Herkes (bu dosya: istek listesi, sıra, kurallar) |
| `CLAUDE_OPUS_GOREVLERI.md` | Claude Opus 5.5 (depoda çalışır; koda yalnız o dokunur) |
| `GEMINI_NEON_GOREVLERI.md` | Gemini Neon 4 (maket, ölçü, glif, kabul denetimi) |
| `GPT_TEK_ZIP_GOREVI.md` | GPT Astra 6.2: **tek mesaj, tek ZIP** (P23 A1–A8 + eski bekleyenler: yaratık pozları, boss 2. evre, portre/yüz, Play Store, kozmetik). Kullanılacak dosya bu |
| `GPT_ASTRA_GOREVLERI.md` | Yalnız A1–A8 ayrı ayrı istemek istersen (yedek) |
| `REFERANS_EKRAN/01..11_*.jpg` | Bugünkü oyun ekranları (telefon, 2340×1080, yatay) |

Önceki paketteki `SANAT_KITABI.md` ve `REFERANS/` klasörü (`_tasarim/denetim-22kas/paket/`) geçerli; GPT ve Gemini'ye onları da ekle.

---

## 1. Kullanıcının istekleri (kesin) → görev kodları

| # | İstek | Ekran | Gemini | GPT | Claude |
|---|---|---|---|---|---|
| U1 | "Korant Online" yazısının önündeki sembol değişecek | 11 | N1 seçer/denetler | A1 | K1 |
| U2 | Karakter biraz daha geride durup zemindeki dairenin ortasına gelecek; dairedeki sembol iki ırk için yenilenecek | 10, 11 | N1 | A2 | K1 |
| U3 | "Karakter Oluştur" başlık bandı beğenilmedi, yenilenecek | 10 | N1 maket | A3 | K1 |
| U4 | Öğreticideki hata giderilecek | 09 | – | – | K2 |
| U5 | Savaşta dalga yazısının üstündeki X yarı boyuta inecek, "Dalga" yazısı yukarı çıkacak | 09 | – | – | K3 |
| U6 | Yetenek çubuğu denetlenecek, sorun varsa düzelecek | 09 | N2 ölçü | – | K3 |
| U7 | Ana ekranda Görevler kutusu, sol üst oyuncu kartı (seviye/ad), hava durumu kutusu (avantajı görünsün), Premium kutusu (kendini belli etmiyor) konsepte uygun, profesyonelce yeniden yapılacak | 08, 04 | N3 maket | A4 | K4 |
| U8 | Menü iki ayrı yerden alınmış gibi duruyor; tek dil olacak | 07 | N4 maket + glif | – | K5 |
| U9 | Maden: oyuncu değil, ırka göre bir madenci yerdeki içi mavi (Elentha) / kırmızı (Kragmir) kristalli kayalara vuracak, maden arabası doldukça dolacak; "Topla"ya basınca madenci gidip arabayı boşaltacak | 06 | N5 kare listesi denetimi | A5 | K6 |
| U10 | Otağ'da "Taht boş" yazan yerde taht görseli olacak | 05 | – | A6 | K7 |
| U11 | Başkent ve çarşı haritalarında NPC adları yazıyor, basınca diyalog açılıyor ama karakterler ortada yok; haritada görünecekler | 04, 08 | N6 yerleşim | A7 | K8 |
| U12 | İksir ve Parşömen dükkânı tek sayfa olacak; soldaki sekme menüsü kalkacak | 03 | N7 maket | – | K9 |
| U13 | Test araçları geri gelecek; onların bulunduğu Profil penceresi yeniden tasarlanacak (U7'deki "profesyonel, konsepte uygun" ölçütü geçerli) | 02 | N8 maket | A8 | K10 |
| U14 | VS ekranında bazı yaratıklar görünmüyor; arka planda savaşılacak yerden esinlenen bir arka plan yok | 01 | – | – | K11 |

## 2. Claude'un (paketi hazırlayanın) eklediği bulgular
Ekran görüntülerinde gördüklerim; kullanıcı onayı beklemeden pakete alındı, beğenmezsen çiz.

| # | Bulgu | Ekran | Görev |
|---|---|---|---|
| E1 | VS'de düşman adı "AZILI KÜÇ…", dalga kartlarında "×2 Küç…" kesiliyor; 3. dalga kartı kutudan taşıyor; düşman çizimi yazı kutusunun arkasında kalıyor | 01 | K11 |
| E2 | Savaşta öğretici kutusu ile "Otomatik açık!" ipucu aynı anda çıkıp üst üste biniyor; öğretici "yetenek seç" derken otomatik açık; konuşan adı sekmesi "Bru…" diye kesik | 09 | K2 |
| E3 | Yetenek çubuğunun sarı çerçevesi oyuncu çerçevesine/portreye biniyor, üstten kesik; iksirler ayrı sütunda kopuk duruyor | 09 | K3 |
| E4 | Madende "Madeni büyüt" satırı ve "500 akçe" düğmesi pencerenin altından taşıyor | 06 | K6 |
| E5 | Ana ekran sol üstteki 4 kare düğmenin (Rehber/Ansiklopedi/…/Menü) yazısı yok, ne oldukları anlaşılmıyor; sağ raydaki "ALIM" yazısı kesik | 08 | K4 |
| E6 | Menüde "Sunucu: Ares" ayrı bir menü maddesi gibi duruyor; "Ayarlar: grafik, ses, erişilebilirlik, dil" iki satıra taşıyor; yazı boyları farklı | 07 | K5 |
| E7 | İksir düğmelerinde ("×1 · 20") para simgesi yok; fiyat kartın üst köşesinde ayrı duruyor | 03 | K9 |
| E8 | Profilde büyük boş alan, arka plandaki dağ/kule silueti anlamsız, "UNVAN SEÇ" başlığın üstünde sıkışık, istatistik kartları düz | 02 | K10 |
| E9 | Hava durumu (Açık / Yağmur / Sis / Poyraz) gerçek bir bonus ve bedel taşıyor (`shared/realm.js WEATHER`: ör. Poyraz = bölge savaşlarında deneyim +%5, maden −%5) ama ana ekranda yalnız ad yazıyor | 08 | K4 |
| E10 | Test araçları Play Store sürümünde görünmemeli: geri gelsinler ama mağaza derlemesinde tek bayrakla kapansınlar | 02 | K10 |
| E11 | Otağ'daki boş oy çubukları kalın ve uzun, "0 oy" sağda kopuk | 05 | K7 |

## 3. Sıra
1. **Paralel başlar:**
   - Claude: yalnız kod isteyen işler → K2, K3, K5 (glifsiz kısım), K9, K11, K10'un test araçları kısmı.
   - Gemini: N1, N3, N4, N7, N8 maketleri (ölçülü), N2 yetenek çubuğu ölçüsü.
   - GPT: A5 (madenci; en uzun iş), A6 (taht), A7 (NPC'ler).
2. Gemini maketleri gelince → GPT A1–A4, A8 (maketteki boyutlarla); Claude K1, K4, K5, K10 düzenleri.
3. Her GPT teslimi → **Gemini N9 kabul denetimi** → kabul edilen ZIP Claude'a → Claude yerleştirir.
4. En son: Claude yayın (sürüm 39), kullanıcı telefonda bakar.

## 4. Kurallar (herkes)
- **Oyun mekaniğine dokunulmaz** (`shared/` klasörü). Yalnız görünüş, arayüz, yerleşim. Hava bonusu, maden üretimi, oy sayısı gibi değerler okunur, değiştirilmez.
- Koda yalnız Claude dokunur. GPT kendi işini onaylamaz; kabul Gemini'de, oyun içi doğrulama Claude'da, son karar kullanıcıda.
- Kullanıcının beğenisi: **tek parça boyanmış sahneler**, sade, gerçekçi, **az altın**. Ayrı sprite + boş zemin beğenilmedi; bu yüzden sahneye konan her figür (madenci, NPC, taht) sahnenin ışığına ve perspektifine **boyanmış gibi** oturmalı (yumuşak temas gölgesi, aynı ışık yönü, aynı renk ısısı).
- Ölçü: mantıksal ekran **880×406** (telefon 2340×1080, dpr 2.66). Maket pikselleri bu ölçüye göre.
- İki halk her şeyde eş: **Elentha** (beyaz mermer, gümüş, lacivert, gök mavisi; güneş-kartal) / **Kragmir** (kararmış demir, bronz, kızıl deri, kor; göz-örs). Orklar **yeşil tenli**.
- TR seçiliyken her yazı Türkçe, EN seçiliyken İngilizce.
- Teslim biçimi: PNG (saydam) veya WebP; ASCII küçük harf dosya adı; tek ZIP `P23_<GOREV>_<tarih>.zip` + `manifest.json` + `onizleme.png`.
- Test: kullanıcı kararı gereği Claude kendi düzen kontrolü dışında tur atmaz; denenmesi gerekenleri `EKSIK_LISTESI_SON.md` 2B'ye yazar.
