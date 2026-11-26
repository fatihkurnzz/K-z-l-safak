# Opus — geliştirme ve entegrasyon kayıtları (sürüm 42: `KORANT-v42-b9a0b21`)

`K = oyun-son/_tasarim/araclar/kabul-26kas`. Oturum hafızası: depo kökünde `CLAUDE.md` (her oturumun "SON DURUM / ÖNCEKİ DURUM" bölümleri; 22.11–26.11).

## 1. Önceki geliştirme görevleri (özet; ayrıntı CLAUDE.md)
| Dönem | Görevler | Nihai durum |
|---|---|---|
| 22.11 görev paketi (C0–C16) | C0 sanat kitabı/referans · C1 hızlı düzeltmeler · C2 HD model raporu · C3 2B savaş birimi · C4 3B malzeme pilotu · C5 yöntemi yay (kahraman, yaratık, boss, Ansiklopedi, VS) · C6 Karakter 2B · C7 sahneler · C8 diyalog + NPC portreleri · C9 simge birliği · C10 VFX · C11 CSS göçü · C12 Türkçe ad katmanı · C13 parametresiz ACT koruması · C14 tembel yükleme · C15 Emeği Geçenler · C16 regresyon/yayın | C0, C1, C2, C3, C5, C7, C8, C9, C10, C12, C13, C14, C15 **BİTTİ**; C4 **GEREKSİZ** (2B yöntem seçildi, kullanıcı); C6 **KISMEN** (2B tam boy kuşanılan eşyayı göstermez); C11 **KISMEN** (34→10 CSS birleşti, düğme rolleri yapıldı; `!important` temizliği ertelendi); C16 **KISMEN** (sürekli) |
| P23 (23.11) | `_tasarim/proje-23kas/CLAUDE_OPUS_GOREVLERI.md` K1–K12 | Kullanıcı bu turu başka modellere yaptırdı; sonuç dış sürüm v40 (P23–P32) ile depoya geldi (`CLAUDE.md` 16. oturum). Opus'un K1–K12 için ayrı kaydı YOK. |
| P33 (26.11) | GPT içerik + Gemini 17 bulgu + AAA planı ("23+9") tek uygulama | Sürüm 41. Kayıtlar: `K/KAPSAM_MATRISI.md`, `K/DEGISIKLIK_RAPORU.md`, `K/TEST_KANITLARI.md`, `K/QA_MATRISI_DOLU.json` (974 satır) |
| P34 (26.11) | GPT/Gemini P34 teslimlerinin entegrasyonu + ikinci kabul bulguları | Sürüm 42 (bu belge) |

## 2. "23+9" görev kapsamı — ÖZGÜN BELGE BULUNAMADI
Kullanıcının andığı "32 maddelik" (23 ana + C24–C32 tamamlayıcı) görev listesi **hiçbir dosyada ve oturum kaydında yoktur**. `K/KAPSAM_MATRISI.md` kapsamı özgün kaynaklardan yeniden kurar (kullanıcının 25.11 AAA planı `K/KAPSAM_KAYNAK_AAA.txt` bölüm 2–16, Opus bulguları A1–A10/B/C, Gemini 17 bulgu, GPT talimatı 1–10). **Bu yeniden kurulum özgün belge değildir.** (Matris: G2-13.)

## 3. P33 geliştirmeleri (sürüm 41) — özet
Ortak Han/Ahır/Zafer kabuğu, 11 px yazı (pencere + HUD), Premium "Yakında", T3 kapalı, oto ipucu, P33 canlılık katmanı (`js/p33-canli.js`: zerreler, portal parçacığı, gün evresi tonu, örs/seviye/ganimet geri bildirimi, ayarlar dd_canli/dd_efekt/dd_fps/dd_pil), müzik kanalı, NPC replikleri (`js/npc-soz.js`), yükleme metinleri (`js/yukleme-metin.js`). Ayrıntı ve kök neden grupları: `K/DEGISIKLIK_RAPORU.md`.

## 4. P34 entegrasyonları (sürüm 42)
Araç: `oyun-son/_tasarim/araclar/p34-gom.py <GPT teslim> <Gemini teslim> oyun-son` (OTOMATİK dosyaları üretir; rapor `K/p34_gom_raporu.json`). Talep başına durum: `P34_NIHAI_DURUM.json`.
| Dosya | Değişiklik | Gerekçe |
|---|---|---|
| `sahneler/zafer_aniti.webp` | 512×217 → 2048×868 (GPT) | P34-01, kullanıcı kararı; Gemini sürümü reddedildi |
| `js/karakter-png-veri.js` | `yuz.ocak.m.4` yeni yüz | P34-08 (ayna yerine özgün yüz) |
| `js/b2d-sancak.js` | `savasci-kadin.buyu` | K-2 (kalkan doğru kolda) |
| `js/gorsel-png.js` | `bran`, `bran-yuz`, `nessa`, `nessa-yuz` | P34-09 |
| `js/b2d-y1.js`, `b2d-y3.js`, `b2d-y4.js`, `b2d-yb.js` | 16 saldırı/vurulma pozu; 33 evre-2 pozu (7 bossun eskisi değişti, 4 ejdere yeni) | P34-06 (3 tür hariç), P34-07 |
| `js/npc-kare-png.js` (YENİ) | 8 NPC × 3 kare, yalnız değişen bölgenin kırpımı | P34-05 (dosya boyutu: 29 KB) |
| `js/p34-katman-png.js` (YENİ) | 69 eleman, 6'şar kare yatay şerit + yerleşim | P34-02/03/04 (550 KB) |
| `js/p34-katman.js` (YENİ) | Hareket katmanı çizici: fotoğraf kutusunda tuval, cover ölçeği, normal/screen karışımı, 10 kare/sn (pil: 5), pencere/iç mekân/gizli sekmede durur, dd_canli/pil/hareketi azalt kaldırır | P34-02/03/04 |
| `js/p33-canli.js` | `zerreKur` → `katmanKur`; G2-02 `orsSonuc` pencere kimliği; G2-03 `expAkit` son değer | P34 + GPT bulguları |
| `js/ui-diyalog.js` | `canlan()`: göz kırpma ve konuşma kareleri (Blob URL), hareketi azalt/pil/sistem tercihi kapatır | P34-05 |
| `js/ui-ogretici.js` | Bran diyaloglarında `kim: 'bran'`; kurtarma kartında Bran+Nessa portresi (`rescueArt`) | P34-09 |
| `js/ui-ahir.js` | `binaAcik()` yalnız `korant-modal-*` sınıfını döndürür | **Gerileme düzeltmesi** (P34-B01): Han/Ahır yeniden çizilmiyor, Zafer "Yükleniyor…"da kalıyordu |
| `js/combat.js` | boss uyarısında `await wait(0.35)` kaldırıldı | G2-01 (savaş süresi uzamasın) |
| `js/ui-odeme.js` | `ACT.payBuy` başında `if (LOCAL) return` | G2-06 (açık koruma) |
| `js/api.js` | yalnız yorum: test paneli/yayın profili davranışı doğru anlatıldı | G2-10 |
| `css/p33-kabul.css` | `.p34-katman`, `.resc-por`, "+" dokunma genişliği 44 px, 667 savaş HUD 11 px (daha özgül seçici) | P34-02/09, G2-07, G2-08/N-2-001 |
| Belgeler | `K/QA_MATRISI_DOLU.json` özeti 113 (G2-11); `K/KAPSAM_MATRISI.md` KAB yanlış iddiası düzeltildi (G2-09); `K/gpt_test.js` (G2-04/05 test hatası) | — |
| Yeni testler | `K/p34_test.js`, `bina_test.js`, `sekme_test.js`, `hafta_test.js`; `savas_test.js` ara sonuç yazar | — |
**Kod tarafında yapılmayan (bilerek):** `shared/` (mekanik, ekonomi, denge, kayıt biçimi) — değişmedi. Bozuk kayıt kurtarma/yedek mekanizması eklenmedi (kayıt biçimi değişikliği = izin gerektirir; P34-B13).

## 5. Yeni / değişen / kaldırılan sistemler
- YENİ: sahne hareket katmanı (`p34-katman.js`), NPC portre kare animasyonu (`ui-diyalog.js canlan`), kurtarma kartı portreleri.
- DEĞİŞEN: boss uyarısı zamanlaması, örs sonucu geri bildirimi pencere bağı, EXP akışı, bina katmanı yeniden çizimi.
- KALDIRILAN: yok. (Sürüm 41'de kaldırılan bir şey de yoktu.)

## 6. İşlem sonuçları
- **Başarılı (kanıtlı):** P34 entegrasyon testi iki halkta (katmanlar, NPC kareleri, Bran/Nessa, zafer, veri çözülmesi, ayar kapatmaları), bina yeniden çizimi, çoklu sekme kilidi, haftalık sıfırlama, gece yarısı sıfırlama, kayıt/yenileme, çift tık, EN dili, GPT içerik testi (iki halk), 667 savaş HUD ölçümü (iki halk), masaüstü bellek (3 dk, 0 MB artış).
- **Kısmi:** P34-06 (8/11 tür), dokunma hedefleri, 667 etiket çakışması (düzeltilmedi), test paneli yayın profili (kod hazır; Play Store paketi yok).
- **Başarısız / yarıda:** tam savaş regresyonu ve 115 ekran çekim turu — iki kez başlatıldı, kullanıcı isteğiyle durduruldu (yarıdaki çıktılar kanıt sayılmadı).
- **Test edilmeyen:** gerçek cihaz, FPS/pil/ısı, uzun oturum, ağ, sunucu, ödeme, Play Store; ses dinleme; boss evre-2 ve yeni pozların gerçek savaşta görünümü; Kragmir 5. yüzün karakter oluşturma ekranında seçimi; Bran/Nessa'nın öğretici akışı içinde görünmesi; Elentha'da bina_test (aynı kod yolu).

## 7. Bilinen teknik borçlar
1. CSS katman yığını (v8…v33, p23…p33) ve yoğun `!important`: 667 düzeltmesi bile `#game#game#game` gibi yapay özgüllük gerektirdi.
2. Görseller dev JS dosyalarına base64 gömülü (ör. `b2d-y3.js` 2,7 MB, `gorsel-png.js` 4,4 MB); yayın 511 dosya sınırı (şu an 450).
3. İki şehir sistemi birlikte duruyor: varsayılan `sahneler/*.webp` (sehir2) ve eski `img/kd/sehir/*` (hub2d; `?sehir=0`).
4. Bina katmanı durumu sınıf adına bağlı (`binaAcik`); P34-B01 bu kırılganlıktan çıktı.
5. Ses: NPC kanalı yok; yeni ses gelmediği için ortamlar sentez.
6. Test betikleri sabit beklemeler kullanıyor (yükte kırılgan); savaş regresyonu ~45 dk.
7. Play Store profili (`DD_STORE`) ayarlayan paket yok.
8. Bozuk kayıtta yedek/kurtarma yok (P34-B13).

## 8. Güvenlik, performans, veri bütünlüğü riskleri
- **Sunucu yok:** bütün dünya ve kayıt istemcide (`localStorage`); oyuncu kaydı kolayca düzenlenebilir — çok oyunculu/ekonomik bütünlük iddiası YAPILAMAZ.
- **Test paneli web derlemesinde varsayılan görünür** (kullanıcı kararı): seviye, eşya, enerji, kilit açma verir. Play Store derlemesinde `DD_STORE` açılmazsa yayına engel (G2-10).
- Gerçek para: yerel kipte satın alma imkânsız (sağlayıcı yok + açık koruma).
- Performans: yalnız masaüstü Chromium (yazılım GL) ölçüldü; katman tuvali + P33 zerreleri telefonda ölçülmedi.
- Veri: çoklu sekmede yazma kilidi çalışıyor; bozuk kayıtta veri kaybı.

## 9. Yayına engel olabilecekler (Opus görüşü; karar Fable/kullanıcı)
`BIRLESIK_HATA_VE_GOREV_MATRISI.json › ozet.yayina_engel_olasi`: N5-02 / P34-B06 (v42 savaş regresyonu yok), N6-08 / P34-B11 (gerçek cihaz), G2-10 (yayın profilinde test paneli), P34-B10 (telif/lisans), P34-B13 (bozuk kayıt kurtarma yok). Ayrıntı: `ACIK_SORUNLAR_VE_YAYIN_RISKLERI.md`.
