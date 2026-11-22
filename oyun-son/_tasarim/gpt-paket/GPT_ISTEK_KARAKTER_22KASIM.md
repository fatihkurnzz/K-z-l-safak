# VAHRAN — Karakter ekranları: Claude'dan GPT'ye istek (22 Kasım)

Bu not "VAHRAN_Karakter_Ekranlari_Tum_Siniflar_Claude" paketinden sonra yazıldı. Paketten oyuna
neyin girdiğini ve oyunun gerçek hâlini tam yansıtmak için hangi görsellerin eksik olduğunu anlatır.
İş bölümü aynı: GPT görsel (ve istenirse model) üretir; kod, yerleşim ve test Claude'da.

## 1. Paketten oyuna giren (yapıldı)
- `assets/sahne/elentha.png`, `kragmir.png` → karakter OLUŞTURMA ve SEÇME ekranlarının tam ekran arka planı.
  Canlı 3B karakter bu resmin önünde, platformun üstünde duruyor (gölgesi platforma düşüyor). Taraf değişince resim de değişiyor.
- `assets/arayuz/*.svg` → PNG'ye çevrildi, dokuz dilimli çerçeve olarak kullanıldı: paneller, kayıt yuvaları,
  seçili yuva/sınıf, Oluştur ve Oyuna Gir (Elentha mavi; Kragmir için aynı şeklin kızıl tonu Claude'da üretildi), zar ve Geri düğmeleri.
- `assets/ikon/elentha.png`, `kragmir.png`, `zar.png` → ırk düğmeleri ve ad zarı.
- Ekran düzeni oyunun var olan, ÇALIŞAN düzeni olarak kaldı: hesapta 3 yuva, kayıt ve giriş akışı, isim denetimi,
  TR/EN, görünüş ayarları değişmedi. Maketteki "Okkol" ve "1/3" örnek veri olarak alındı, oyuna yazılmadı.

## 2. Kullanılmayanlar ve nedeni
- `assets/hedef/*.png`: yalnız hedef görsel (söylendiği gibi ekrana basılmadı).
- `yeni_konseptler/*_tam_boy.png` (8 adet, 384×512, arka planlı): oyunda kullanmak için küçük ve şeffaf değil.
  Aşağıda (3B) şeffaf, büyük sürümleri isteniyor.
- `assets/karakter/buyucu_referans.png`: tek sınıf, tek ırk, tek cinsiyet; ekranlar sekizini (aslında 16'sını) birden gösteriyor.
- `onceki_portreler/`: oyundakiyle aynı (Paket 3); değişiklik yok.
- `assets/ikon/savasci|suikastci|sifaci|buyucu.png`: zemini koyu, şeffaf değil (RGB). Oyunda sınıf simgeleri var olan çizimle kaldı.

## 3. Oyunun gerçek durumu (GPT bilmeli)
- Karakter ekranlarındaki 3B karakter **geçici prosedürel model** (ekranda "Geçici model" etiketi var). Savaşta ise
  her sınıfa iskeletli gerçek model var (Mixamo iskeleti, `mixamorig` kemik adları; dosyalar glTF JSON + WebP doku).
- Sınıflar (kod kimliği → ad): `warrior` Savaşçı, `rogue` Suikastçı, `priest` Şifacı (Kragmir'de "Şaman"), `mage` Büyücü.
- Irklar: `sancak` = Elentha (insan), `ocak` = Kragmir (ork). Cinsiyet: `m` / `f` (iki ırkta da var).
- Görünüş seçenekleri (oyun verisi, `shared/gorunus.js`):

| | Yüz | Saç | Sakal | Vücut | Saç rengi | Göz rengi | Ten | Boy |
|---|---|---|---|---|---|---|---|---|
| Elentha erkek | 5 | 8 | 6 | 3 | 8 | 6 | 6 | 2 uç arası kaydırma |
| Elentha kadın | 5 | 7 | – | 3 | 8 | 6 | 6 | 〃 |
| Kragmir erkek | 5 | 7 | 5 | 3 | 7 | 6 | 6 | 〃 |
| Kragmir kadın | 5 | 6 | – | 3 | 7 | 6 | 6 | 〃 |

  Yüz adları — Elentha: Keskin, Yumuşak, Geniş, Asil, Yaralı · Kragmir: Yaban, Kaya Çene, Yaralı, Kurt Bakışlı, Kartal Kaş.
  Vücut: ince / orta / iri.

## 4. İstenenler (öncelik sırasıyla)

### A. Tam boy karakter görselleri (2B, en önemli) — 16 adet
4 sınıf × 2 ırk × 2 cinsiyet. Kullanım: seçme ekranında ve ileride oluşturma ekranında "vitrin" görseli.
- Şeffaf PNG (alfa), **1024×1536**, karakter önden 3/4, ayakta, silah elde.
- Hepsinde aynı ölçek ve **aynı zemin çizgisi**: ayak tabanı resmin alttan %4 yukarısında, yatayda ortada; baş üstte %6 pay.
- Zemin, platform, gölge, ışık hüzmesi, arka plan YOK (arka plan sahne resminden geliyor).
- Kıyafet ve silah türü sınıfa uygun: Savaşçı kılıç+kalkan/ağır zırh, Suikastçı hançer/hafif deri, Şifacı asa/cübbe, Büyücü asa/cübbe.
  Oyundaki özgün silah görünüşünü değiştirmek gerekmiyor; bu görseller vitrin içindir.
- Dosya adı: `tamboy-<sinif>-<irk>-<cinsiyet>.png` (ör. `tamboy-warrior-sancak-m.png`, `tamboy-priest-ocak-f.png`).

### B. Yüz portreleri — 20 adet
Maketteki sol portre sütunu için: her ırk × cinsiyet için 5 yüz seçeneği (yukarıdaki yüz adlarına göre).
- Şeffaf PNG, **384×384**, omuz üstü büst, aynı çerçeveleme; saç varsayılan, sakalsız (erkekte de).
- Dosya adı: `yuz-<irk>-<cinsiyet>-<0..4>.png` (sıra yukarıdaki ad sırası).

### C. Arayüz parçaları
- **Başlık levhası** (yazısız), iki ırk: `baslik-levha-sancak.png`, `baslik-levha-ocak.png`, 900×120, şeffaf, ortası boş
  (yazıyı oyun basar; dokuz dilimli kullanılacak: köşe süsleri sol/sağ 120 px içinde kalsın).
- **Sınıf simgeleri** şeffaf: `sinif-warrior.png`, `sinif-rogue.png`, `sinif-priest.png`, `sinif-mage.png`, 128×128, tek renk açık altın (#f3d38b) çizgi.
- **Kragmir için birincil düğme** kızıl sürüm (şimdilik Claude renk değiştirdi): `dugme-birincil-ocak.png`, 560×132, yazısız.

### D. (İsteğe bağlı) Gerçek 3B karakter modelleri
Ekrandaki "Geçici model"in yerine geçecek modeller ancak şu şartlarla kullanılabilir; üretilemiyorsa A maddesi yeterli:
- glTF 2.0 (`.glb`), **Mixamo iskeleti** (kemik adları `mixamorig:Hips` … standart), T-poz, Y yukarı, 1 birim = 1 m, boy ~1,8.
- ≤ 12.000 üçgen / karakter, doku ≤ 1024 px (PNG/JPEG/WebP; AVIF yok), sıkıştırmasız (Draco/meshopt yok).
- Seçilebilir parçalar ayrı ağ (mesh) ve adlandırılmış: `yuz_0..4`, `sac_0..n`, `sakal_0..n`, `govde_ince|orta|iri`;
  renk değişen bölgeler (saç, göz, ten) ayrı malzeme (oyun rengi kodla verir).
- 4 sınıf × 2 ırk × 2 cinsiyet. Animasyon gerekmiyor (oyunda hazır: idle, run, attack, cast, hit, death, victory).

## 5. Teslim kuralları (değişmedi)
- Yalnız PNG / JPEG / WebP. SVG, AVIF, BMP/TGA/TIFF yok. Şeffaflık isteniyorsa gerçek alfa (dama tahtası boyanmış olmasın).
- Tek ZIP, `MANIFEST.md` (dosya adı, ölçü, ne için), alfa denetimi (tamamen boş ya da %85'ten fazla boş resim olmasın).
- İki ırk eşliği: her parça iki ırk için ayrı ayrı varsa adında `-sancak` / `-ocak`.
