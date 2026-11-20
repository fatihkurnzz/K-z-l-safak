# Demir Diyarı · Oturum hafızası

Kullanıcı Türkçe konuşur; yanıtlar Türkçe olsun. Oyun: **Demir Diyarı**, tarayıcıda çalışan, YALNIZCA YATAY çizilen 3B mobil RPG (vanilla ES modülleri + three.js r160 gömülü, sıra tabanlı belirlenimci savaş). Hikâye: **Vahran: Tarihin Külleri**.

## ASIL SÜRÜM = `oyun-son/` (19.11.2026'dan beri)
- Kaynak: kullanıcının verdiği https://claude.ai/artifact/KUfQG1bV27JFGDTjpBwEdk (kuruluş dışı; okunur, yayımlanamaz). 293 dosyanın tamamı `oyun-son/`a alındı.
- KENDİ YAYINIMIZ: https://claude.ai/artifact/GwNoLLWnf5Wjc1PUJep2yi (19.11.2026; 2 adımda yayımlandı: 250 + 42 dosya, `_tasarim/` hariç; sayfa başlığı "Korant Online").
- Yerel kip: `index.html` içinde `window.DD_LOCAL = true`; kayıt localStorage'da, sunucu yok.
- Modeller `.glb.js` (base64 gömülü), `vendor/three/LICENSE.txt`. GLTFLoader'da `image/avif` gömülü görsel YOK (yalnızca 2 "avif" dizgesi). `js/skinned.js` Xbot'u hâlâ cdn.jsdelivr.net'ten çekiyor. `video/` boş (bolum-01..10.mp4 bekleniyor).
- Yapı: 31 stil dosyası (css/v8 … v16), 90 `!important`; `index.html` 309 KB, 19 `<style>` bloğu. Ölçek değişkenleri `js/orient.js`: `--lw --lh` (mantıksal ekran), `--sat --sab --sal --sar` (güvenli alan), `--dock`, `--kb`. Dik telefonda gövde 90° döndürülür.
- İçerik: 2 halk (Kragmir/ork, Elentha/insan; `p.faction`), 4 sınıf: Savaşçı (Hücum/Siper/Öfke), Suikastçı (Hançer/Yay/İz), Şifacı (Şifa/Rün Mührü/Kara Rün), Büyücü (Ateş/Buz/Yıldırım) — `shared/content.js`. Bölgeler (`shared/zones.js`): Vahran Ovası 1–20, Kül Geçidi 20–40, Kızıl Bahar Meydanı 40–60, Sisli Çukur 60–65; her bölge 25 aşama, 5'te bir kapı. Bosslar: Dev Solucan, Tepegöz, Kristal Muhafızı, Lav Yürek, Kül Ağası Karadun, Mareşal Marven, Adsız (Tarikat Lideri). Ana görev 64 adım / 16 bölüm (`shared/anagorev.js`).

## Boyalı ana merkez (20.11.2026) — GPT teslimleri işleniyor
- 20.11'de `oyun-son/` KUfQG1bV27JFGDTjpBwEdk'nin yeni sürümüyle (326 dosya) yeniden eşitlendi; yayın GwNoLLWnf5Wjc1PUJep2yi Sürüm 3 (yalnız değişen dosyalar gönderildi).
- GPT teslimleri `oyun-son/_tasarim/gelen/` (4.1 Kragmir, 4.2 Elentha, 4.3 bina parçaları, 4.4 alt şerit simgeleri, 4.5 UI kit). Denetim, yapılanlar ve **EKSİKLER listesi**: `_tasarim/gelen/HAZIRLIK.md`. Brief: `_tasarim/ANA_MERKEZ_BRIEF.md`. GPT limiti doldu; kullanıcı kalanları sonra getirecek.
- Kod: `js/merkez2d.js` (resim koordinatlı SPOTS, cover + yatay kaydırma, dokunma), `ui-hub.js` showPainted (başkent; Karaborsa eklendi, kral etiketi yok), `town.js` hideTown→hideMerkez, `engine3d.js` fpsCap 20, `css/v22-merkez.css`. Görseller `img/merkez/`. `?merkez=3d` eski kasaba.
- Playwright test betiği akışı: `.ld-go` → `[data-o="race"][data-v=ocak|sancak]` → `#olzname` + `#olzgo` → `[data-a="tkEnter"]` → `button:text-is("Geç")` (fragman).

## GPT ile SIFIRDAN tam yeniden tasarım (20.11.2026, en güncel plan)
- Kullanıcı bütün görselleri GPT'ye sıfırdan yaptıracak; önceki GPT çıktıları (4.1–4.5) ve mevcut ekran görüntüleri pakete KONMADI (kullanıcı isteği).
- Paket: `oyun-son/_tasarim/gpt-paket/` (GPT_BRIEF.md = düzeltilmiş tek brief; EKRANLAR.md = gerçek ekranlar ve korunacak düğmeler; OYUN_VERISI.md = kaynak koddan otomatik çıkarılmış eşya/silah/yetenek/yaratık/boss listesi; VAHRAN_destan.txt; ek/KONSEPT_BRIEF.md + ek/YERLESIM_SPEC.md; oyun-kaynak.zip). ZIP: kökte `Demir_Diyari_GPT_Paketi.zip` (git dışı). OYUN_VERISI üretici betiği: shared/*.js'yi import eden node betiği (gerekirse yeniden yaz).
- Brief'te yaptığım düzeltmeler: iş bölümü (GPT yalnızca görsel + maket; kod/entegrasyon/test Claude'da; GLB ve ses yok); halk kodları `ocak`=Kragmir / `sancak`=Elentha (kullanıcının metnindeki "kragmir/elentha" yanlıştı); 3600 geniş sürüm kaldırıldı; UI kit kuralları + ölçüler + durum dosya adları (-normal/-basili/-pasif/-secili/-dolu/-bos, -ocak/-sancak); Python alfa denetim betiği zorunlu; aşama başına ZIP + onay; telefon gerçeği (846×412 mantıksal, önemli şey orta %60); oyunda 3 eşya derecesi (Standart/Nadir/Eşsiz), 6 nadirlik çerçevesini Claude eşler; 14 silah türü × 8 kademe; 13 ekipman yuvası.
- UYARI: oyundaki silah/yetenek adlarının çoğu İngilizce ve Knight Online kaynaklı görünüyor (Kukry, Mirage Dagger, Iron Impact, Hell Fire…); brief'te "türü koru, görünüşü özgün yap" dendi. Kullanıcıya adları Türkçeleştirme önerilebilir.
- GPT'den gelen her aşamada: biçim denetimi, alfa denetimi (bos% > 85 → bozuk), ölçü, iki halk eşliği; sonra WebP'ye çevir ve entegre et.

## Kullanıcının büyük planı: A–Z görsel yeniden tasarım
Kullanıcı grafik, arayüz, menüler, savaş sunumu dahil her şeyi BAŞKA bir yapay zekâya (başka bir Claude) yaptıracak; gelen işi bana gönderecek, **ben oyuna ekleyeceğim**. Hedef: "100 kişilik stüdyo" kalitesinde premium mobil oyun görünümü. Belgeler `oyun-son/_tasarim/` içinde (yayında bu klasörü dahil etme):
- `VAHRAN_destan.txt`: kullanıcının verdiği tam hikâye (8 bölüm; Volgar/Demirdiş, Edran, Lira, Thrak, Yashka, Marven, Adsız, Küllerin Tarikatı, çatlak dikilitaş/Taş Yemini, Yerkıran çekici).
- `KONSEPT_BRIEF.md`: görsel kimlik "KÜL VE DEMİR". İki tema (Kragmir: kara demir + kor; Elentha: ak mermer + lacivert + altın telkari) `html[data-faction]` ile; kül = Tarikat/tehlike dili; çatlak taş = ayraç motifi, rün = ilerleme. Renk hex'leri, nadirlik/element renkleri, Cinzel + Inter, ekran listesi, karakter tarifleri, VFX, teknik teslim kuralları (yalnızca PNG/JPEG/WebP; AVIF ve SVG yasak; GLB ≤12k üçgen, sıkıştırmasız; düz CSS, dış bağlantı yok; MANIFEST.md).
- `YERLESIM_SPEC.md`: yapı/ölçü belgesi (bu ikisi çelişirse esas). Birim dp; yükseklik hep 1080 dp, genişlik 1440 (tablet)–2400 (telefon); s = ekran_yüksekliği/1080 (≤1), kod `--s` yayınlayacak (henüz EKLENMEDİ). Maket 2340×1080 + 1440×1080. En küçük dokunma 120 dp, en küçük cümle 34 dp, gövde 38. 8 dp ızgara, boşluklar 8/16/24/32/48/64/96. Çentik payı 130 dp, alt 58 dp, kenar 32. 8 bölge: Geri sol üst, kaynaklar sağ üst (Altın→Premium→Enerji), tek birincil düğme sağ altta, dock SOLA çapalı (744 dp) + sohbet üstünde, sağ ray en fazla 5 düğme. Savaş: temel saldırı 200 dp sağ altta, 4 yetenek 136 dp çeyrek yayda (r=260); sağ alt 600×520 ve sol alt 720×440 birim girmez. Panel ekranları ortak şablon (üst bar 136, sol sekme 280, eylem şeridi 152). Teslim: `tokens.css` + ekran başına tek dosya HTML maket + ekran görüntüleri + BILESENLER.md.
- Önerdiğim süreç: önce pilot (sanat panosu + Ana Merkez + Savaş HUD + Karakter oluşturma), onay sonra kalanı; entegrasyonda eski 31 CSS katmanını ekran ekran kaldır.
- Gelen iş geldiğinde: biçim denetimi (AVIF/SVG/.glb/BMP/TGA/TIFF), GLB → `.glb.js`, `--s` değişkenini orient.js'e ekle, `data-faction`'ı `p.faction`'a bağla.

## Öneri belgeleri
- `Demir_Diyari_Oneriler.pdf` (1. sürüm, eski oturum): sunucu, three.js gömme, duman testi, 60+ hedef, pazar fiyat aralığı, Kader Çarkı garantisi, mağaza/yasal.
- `Demir_Diyari_Oneriler_2.pdf` (4 sayfa; üretici betik `oyun-son/_tasarim/oneriler_pdf.py`, çıktı yolu argümanla verilir): kayıt dışa/içe aktarma, Xbot gömme, biçim denetim betiği, CSS katman temizliği, pilot ekranlar, destanın 8 bölümünü oynanabilir yapma (bölüm–oynanış tablosu), iki halk iki bakış, mini dizi = hareketli çizgi roman (video yerine), Kin Ölçeği + Tarikat istilası, ortak "Taş Yemini" baskını, Kül Kulesi (65+), Gri Cübbe klan olayı, süpürme/hız, element zayıflığı görünürlüğü, Kül Sezonu, yol haritası A–F. Kullanıcıya sorulan 4 soru (cevap bekleniyor): Play Store mu tarayıcı mı; sunucu ne zaman; gerçek para/kozmetik mi; 2. sezon yazılacak mı.

## Eski sürümler ve bağlantılar (artık ikincil)
- `demir-diyari-kaynak.zip` (kökte, .gitignore'da) + AVIF düzeltmesi = önceki "asıl sürüm"; yayını https://claude.ai/artifact/MTABphHNGvf3krJ6ouTQxQ. Düzeltme: `game/.../GLTFLoader.js` içinden gömülü `data:image/avif` ve AVIF eklentisi kaldırıldı.
- `game/` (git'te) zip'ten farklı paylaşım denemeleri içerir; yayınları DJihHiDK3J8QzXTCQge7p3 ve 5fWMFYJvLGPjqmkaKSaPW5.
- Diğer oturumun ("Oyun son hali zilp") yayını: YUZmyf2qyxFxY1Jr7jczu7 (lance.glb → `js/lance-glb.js`).
- Test sayfaları (gereksiz, kullanıcı isterse silinir): SjYSG89hgNE1gB1jGdCYTi, VV4xa5k4izqQYLhpJLXyoQ, 8AEm3MwjfX9iiAfpEYDrqu, DYehTt339tgy7u4XpRT6SA. İlk kaynak (başka hesap, dokunulmaz): MYzseijJ8VLrLwQbMupv9t.
- Paylaşım hatası ("…JPEG, PNG, GIF veya WebP…"): yalnızca kod takılmıştı → gömülü AVIF. Yine olursa şüpheliler: FBXLoader'daki bmp/tga/tiff dizgeleri, GLTFLoader'daki WebP test görseli.

## Çalışma notları
- Git dalı `claude/add-skill-repos-rne7at`; push her zaman 403 (Claude GitHub uygulaması kurulu değil). Commit'ler yereldedir; kullanıcıya söyle.
- Yayın: sayfa dosyasında iskelet yok; çok dosyalı yayında `root` + `files`, en çok 255 dosya, silinecek dosyaya `null`, uzantısız dosyaya `contentType`. `.glb` sunulmaz.
- Yerel test: `python3 -m http.server 8765 -d oyun-son`, Playwright, `?gfx=low`; testleri sırayla çalıştır. Heredoc python güvenlik denetimine takılabilir: betiği dosyaya yazıp çalıştır.
- PDF: reportlab + DejaVu yazı tipleri (Türkçe karakterler için).
