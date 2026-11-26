# Test kanıtları ve sonuçları

**Ortam (bütün v42 testleri):** bulut konteyneri, Linux, Node 22 + Playwright Chromium (başsız, yazılım GL), `python3 -m http.server 8765 -d oyun-son`, yerel kip (`DD_LOCAL`), her koşuda yeni karakter "Denetci" (giriş betiği geliştirici araçlarıyla Sv.53'e çıkarır, eşya/enerji verir). **Hiçbiri gerçek cihaz testi değildir; emülatör de kullanılmadı.** Ses çıkışı yoktur (ses yalnız anahtar/kod düzeyinde).
**Test edilen sürüm:** v42 satırları = `KORANT-v42-b9a0b21` oyun dosyaları (çalışma ağacı; yayın 42 ile aynı). v41 satırları = önceki sürüm; **v42'nin kanıtı sayılmaz**, yalnız v42'de dokunulmayan alanlar için bağlam olarak yazılmıştır.
Kanıt yolları: `kanit/...` = bu paket; `oyun-son/...` = depo. Tam liste `KANIT_DOSYALARI_INDEKSI.json`.

## A. Sürüm 42'de yapılan testler
| # | Test | Yöntem (betik) | Beklenen | Gerçekleşen | Kanıt | Durum |
|---|---|---|---|---|---|---|
| A1 | P34 sahne katmanları (başkent, çarşı, klan) — iki halk, 880×406 dpr 2 | `p34_test.js` | Tuval fotoğraf kutusunu kaplar, olay almaz, hareket eder, etiket üstte, sıralama fotoğraf→katman→ton→zerre | 6/6 sahne-halk koşulu sağladı; Elentha klan testinde etiket noktasında bir mağaza düğmesi (açık kalan teklif kartı) üstteydi — katman değil | `kanit/v42/p34_test/{ocak,sancak}/sonuc.json`, `01_baskent_katman_a/b.webp`, `02_carsi_katman.webp`, `03_klan_katman.webp` | GEÇTİ |
| A2 | Katman kapatma ayarları | `p34_test.js` §6 | `dd_canli=0`, `dd_pil=1`, hareketi azalt → katman yok; geri alınca kurulur | İki halkta 6/6 geçiş doğru | aynı `sonuc.json › kapatma` | GEÇTİ |
| A3 | NPC göz/ağız kareleri (8 NPC) | `p34_test.js` §2 | 7 sn içinde >1 farklı kare; hareketi azaltta 1 | 2–4 kare (göz kırpma rastgele 2,5–6 sn, bazı koşularda pencereye düşmedi); hareketi azalt 1 | `sonuc.json › npc_kare`, `04_dlg_*.webp` | GEÇTİ |
| A4 | Bran diyaloğu ve kurtarma kartı | `p34_test.js` §3 (doğrudan çağrı) | Portre görünür; kartta iki portre | Evet (iki halk) | `05_bran_diyalog.webp`, `06_kurtarma_karti.webp` | GEÇTİ (öğretici akışı içinde değil) |
| A5 | Zafer anıtı yüksek çözünürlük | `p34_test.js` §4 | Doğal ölçü 2048×868, arka planda | Evet | `sonuc.json › zafer`, `07_zafer.webp` | GEÇTİ |
| A6 | Yeni görsel verilerin tarayıcıda çözülmesi (Kragmir 5 yüz, K-2, P34-06/07 pozları) | `p34_test.js` §5 | Her görsel çözülür, ölçüler doğru | Hata 0; 384/448/176 ölçüler | `sonuc.json › veri`, `08_veri_kontakt.webp` | GEÇTİ (gerçek savaşta görünüm test edilmedi) |
| A7 | Bina katmanı yeniden çizimi (Zafer/Han/Ahır) | `bina_test.js` (Kragmir) | Veri gelince içerik çizilir; Han'da işlem sonrası gövde yenilenir | Zafer içerik dolu ("Yükleniyor" yok), Han `hanIc` sonrası yeniden çizildi | `kanit/v42/bina_test/ocak/` | GEÇTİ (düzeltme sonrası; düzeltme öncesi `p34_test` ilk koşusunda Zafer "Yükleniyor"da kalıyordu) |
| A8 | GPT içerik entegrasyonu (iki halk) | `gpt_test.js` (G2-04/05 betik düzeltmesiyle) | Açılış ipucu, Han selamlama/başarı, tezgâh satırı, Kül Geçidi perdesi, başkent ses döngüsü halka göre | Hepsi dolu; Elentha `amb.sancak.day`, Kragmir `amb.ocak.day` | `kanit/v42/gpt_test/{ocak,sancak}/sonuc.json` | GEÇTİ |
| A9 | Kayıt + yenileme | `sistem_test.js` | Yenilemede seviye/akçe/eşya aynı | Aynı | `kanit/v42/sistem_test/sonuc.json › yenileme` | GEÇTİ |
| A10 | Çift tık (Han, tezgâh) | `sistem_test.js` | Tek bedel / her alım ayrı ve sınırlı | Han 600 akçe tek; tezgâh 3 alım (günlük sınır 3) | `› cift_tik_*` | GEÇTİ |
| A11 | Bozuk kayıt | `sistem_test.js` | Çökme yok; kurtarma? | JS hatası yok, sunucu seçimine dönüyor; **bozuk kayıt kurtarılmıyor** | `› bozuk_kayit`, `bozuk_kayit.webp` | KISMEN (P34-B13) |
| A12 | EN dili | `sistem_test.js` | Arayüz İngilizce; Premium "Coming soon" | Evet | `› en_dili`, `en_premium.webp` | GEÇTİ |
| A13 | Gece yarısı sıfırlama (UTC+3, sanal saat) | `sistem_test.js` | Günlük hediye 23:58 alınır, tekrar red, 00:01 yeniden alınır | Evet | `› sifirlama` | GEÇTİ |
| A14 | Bellek (masaüstü, ana üs 3 dk + 6 pencere döngüsü; P34 katmanları açık) | `sistem_test.js` | Yığın artışı yok | 133 MB sabit, 60 kare/sn (yazılım GL) | `› bellek` | GEÇTİ (cihaz değil) |
| A15 | Çoklu sekme | `sekme_test.js` | İkinci sekme girince ilk sekme kilitlenir, işlem yazmaz | Kilit "Hesabın başka bir cihazda açıldı", işlem beklemede | `kanit/v42/sekme_test/` | GEÇTİ |
| A16 | Haftalık sıfırlama (pazartesi 00:00 UTC+3, sanal saat) | `hafta_test.js` | Hafta anahtarı ve `S.weekly` yenilenir | 2969 → 2970 | `kanit/v42/hafta_test/sonuc.json` | GEÇTİ |
| A17 | 667×375 savaş HUD etkin yazı boyu (dönüşüm ölçeği dahil) | ölçüm betiği (`etkin`) | ≥ 11 px | Önce 6,1–10 px; sonra en küçük 10,7 px (0,975 ölçek) / 11 px, iki halk | `kanit/v42/olcum/etkin-*-667*.json`, `etkin-savas-*-667.webp` | GEÇTİ (harita etiket çakışması ölçülmedi) |
| A18 | Teslim bütünlüğü | sha256 / ZIP CRC | Manifest = dosya | GPT 458/458; Gemini 18/18 + 62 manifest dışı | `kanit/v42/teslim_butunluk.json` | GEÇTİ (Gemini manifesti eksik) |
| A19 | Koruma (onaylı görseller, mekanik) | `git diff 1e17c80` | Yalnız zafer_aniti değişir; `shared/` aynı | Evet | `kanit/v42/koruma.json` | GEÇTİ |
| A20 | Görsel kontrol (insan gözü değil, Opus görsel incelemesi) | kontakt sayfaları | Kimlik tutarlılığı | P34-06'da 3 tür sapma → alınmadı; diğerleri tutarlı | `kanit/v42/kontrol/*.jpg` | Opus görüşü (bağımsız kabul değil) |
| A21 | JS sözdizimi | `node --check` (.mjs kopyası) | Hata yok | 18 değişen dosyada hata yok | — (komut çıktısı kayıtlı değil) | GEÇTİ |

## B. Sürüm 42'de YAPILMAYAN / YARIDA KALAN
| Test | Neden | Sonuç |
|---|---|---|
| Tam savaş regresyonu (`savas_test.js`: 4 bölge, 4 boss, 5 zindan, Meydan, Baskın, klan; iki halk) | İki kez başlatıldı; ~45 dk sürdüğü için kullanıcı isteğiyle durduruldu | **TEST EDİLMEDİ (v42)**. Yarıda kalan çıktılar kanıt sayılmadı. Etki: yeni pozlar, boss evre-2, boss uyarısı süresi gerçek savaşta gözlenmedi |
| 115 ekran çekim turu (`cek115.js`) ve eylem turu (`eylem_cekim.js`) | Kullanıcı isteğiyle durduruldu | **TEST EDİLMEDİ (v42)**; v41 turu (226 çekim) değişmeyen ekranlar için bağlam |
| Dinamik durum taraması (`tara.js`) | Zaman | TEST EDİLMEDİ (v42); v41: 119+119 durum |
| 1180×820 ve 667×375 tam ekran turu | Zaman | Yalnız 667 savaş HUD ölçüldü |
| Gerçek cihaz, FPS/pil/ısı, 30/120 dk, ağ kesilmesi, sunucu/anti-cheat, ödeme, Play Store paketi | Ortamda yok | TEST EDİLMEDİ |
| Ses dinleme / ses kalitesi | Konteynerde ses yok; yeni ses teslim edilmedi | TEST EDİLMEDİ |
| Ekonomi/denge | Değişiklik yok; denge değerlendirmesi kapsam dışı | TEST EDİLMEDİ (değişmedi kanıtı: A19) |
| Envanter/ekipman işlevleri | v42'de bu alana dokunulmadı | v42'de ayrıca test edilmedi; v41 QA satırları |

## C. Sürüm 41 testleri (bağlam; v42 kanıtı DEĞİL)
`oyun-son/_tasarim/araclar/kabul-26kas/TEST_KANITLARI.md` ve `QA_MATRISI_DOLU.json` (974 satır: 782 KABUL, 52 ilk tur sonrası düzeltildi, 27 KISMEN, 113 TEST_EDILMEDI). Ekran görüntüleri Gemini'ye gönderilen `KORANT_GEMINI_KABUL2*` paketlerinde (depoda değil).
