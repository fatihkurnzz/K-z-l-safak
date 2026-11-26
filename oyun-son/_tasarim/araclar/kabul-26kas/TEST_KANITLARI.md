# P33 · Test kanıtları (KORANT-v40-1dda167+P33, 26 Kas 2026)

Ortam: masaüstü Chromium (Playwright 1.63, yazılım GL), yerel kip (`DD_LOCAL`), `python3 -m http.server`. Telefon ölçüsü 880×406 mantıksal, dpr 2,66 (= 2341×1080).
**Gerçek telefon, gerçek FPS/pil/ısı, sunucu ve ağ testleri YAPILMADI** (QA'da TEST_EDILMEDI, gerekçeli).

> **Ekran görüntüleri ve ölçümler İLK TURDAN (kullanıcı kararı 26.11).** İlk turdan sonra yalnız 11 px altı yazılar, örs başlığı,
> 1180 Oto İksir çakışması ve 667 sonuç/bilgi yazıları düzeltildi; bu düzeltmeler hedefli betiklerle yeniden ölçüldü (aşağıda),
> QA'da `DUZELTILDI_ILK_TUR_SONRASI` durumuyla işaretli. O ekranların görüntüsünde eski küçük yazı görünebilir.

## Özet (QA_MATRISI_DOLU.json, 974 satır)
| Grup | KABUL | İlk tur sonrası düzeltildi | KISMEN | TEST_EDİLMEDİ |
|---|---|---|---|---|
| UI (GPT 226 çekim) | 210 | 14 | 2 (karakter "+" 22 px, gerekçeli) | 0 |
| IC (13 iç mekân) | 13 | – | – | – |
| ENV (kaynak koddaki her eylem, 2 halk) | 338 | 14 | – | 92 (parametre/bağlam isteyen eylemler: pencere açmaz) |
| DYN (gezinti taraması 120+120 durum) | 198 | 24 | – | 16 (tarif eşleşmedi: oyun durumu değişmiş) |
| SAV (savaşlar) | 17 | – | 13 (240 sn'de bitmedi; açılış/zemin/HUD doğrulandı) | 2 (baskın penceresi perşembe kapalı → BAS) |
| BAS (baskın, cumartesi saati) | – | – | 2 (açıldı, savaş başladı, 149 bin can: bitmedi) | – |
| RES (667×375, 1180×820) | – | – | 4 (açık madde: 667'de HUD katman ölçeği) | – |
| SYS (15) | 6 | – | 6 | 3 (PERF gerçek cihaz, AUTH sunucu, SEC yetkili test) |

**JS hatası: bütün turlarda 0** (cek115 ×2, eylem ×2, dinamik ×2, 667 ×2, 1180 ×2, savaş ×2, GPT ×2, sistem, ek ×2, baskın ×2, önce ×2).

## Turlar ve betikler (`_tasarim/araclar/kabul-26kas/`)
| Tur | Betik | Çıktı (scratchpad son/) |
|---|---|---|
| 115 kimlik / 226 çekim × 2 halk, 880×406 dpr 2,66 | `cek115.js` | `cek115-<halk>/` + `_denetim.json` |
| Kaynak koddaki her ekran açan eylem (222 × 2) + sekmeler, klan kurulumu | `eylem_cekim.js` | `eylem-<halk>/_eylem.json` |
| Dinamik durumlar (tara.js tarifleri yeniden oynatıldı) | `cekim.js` | `dyn-<halk>/_cekim.json` |
| 667×375 ve 1180×820 (dpr 1, gfx düşük) | `cek115.js` | `res667-*`, `res1180-*` |
| Önce (eski sürüm 1dda167, :8766) — Gemini'nin 22 ekranı | `PORT=8766 LISTE=… cek115.js` | `once-<halk>/` |
| Savaş: 4 bölge, 4 boss, 5 zindan, Kül Kulesi Sv.65, PvP, Oba Avı; klan + Klan Obası 10 bina | `savas_test.js` | `kanit/savas-<halk>/` |
| Baskın (saat cumartesi 12:00 UTC+3) | `baskin_test.js` | `kanit/baskin-<halk>/` |
| GPT içeriği: ipucu, Han selamlama + gerçek sonuç, tezgâh satırı, Kül Geçidi perdesi, ses döngüleri | `gpt_test.js` | `kanit/gpt-<halk>/` |
| Canlılık: 4 gün evresi, örs başarı/başarısızlık, görev şeridi, ganimet nadirlik, ses kanalları, A10 | `kanit_ek.js` | `kanit/ek-<halk>/` |
| Sistem: yenileme, çift tık, bozuk kayıt, EN, gece yarısı, bellek | `sistem_test.js`, `en_test.js` | `kanit/sistem/` |
| devUI / T3 | `kanit_cesitli.js` | `kanit/cesitli/` |
| Hedefli yeniden ölçümler (ilk tur sonrası düzeltmeler) | `kucuk.js`, `gorev.js`, `ors.js`, `btn.js`, `sonuc667.js`, `k667.js`, `res2.js`, `dyn2.js`, `sayac.js`, `en2.js` | çıktı konsolda; hepsi kesik/taşma/çakışma/küçük yazı **0** |

## Öne çıkan sonuçlar
- **Kayıt:** yenileme sonrası seviye/akçe/yakut/enerji/eşya birebir. Eski sürüm kaydı yeni sürümde birebir (`kanit/kayit-uyumlulugu/`).
- **Çift işlem:** Han içeceği iki hızlı tık → 600 akçe (tek bedel). Tezgâhta üç hızlı tık → 3 ayrı ücretli alım (505 × 3), tutarlı.
- **Bozuk kayıt:** JS hatası yok, oyun sunucu seçimine döner.
- **Gece yarısı (UTC+3):** 23:58 alındı → aynı gün ikinci deneme RED (claimed) → 00:01 alındı → tekrar RED. Geçti.
- **EN dili:** GPT'nin TR metinleri EN'de gösterilmez (sessiz geri dönüş); Premium "Coming soon ₺149" (P33'te düzeltildi).
- **Bellek (masaüstü, 3 dk + 36 pencere aç/kapa):** JS yığını 87 MB sabit, artış 0; ana üste rAF 60. Gerçek cihaz ölçümü DEĞİL.
- **Savaş zeminleri:** vahran, kulgecit, kizilbahar, sisli, bossmag, zkuyu, zocak, zyarik, zmuhur, zkule, pvparena, obaavi — doğru. Düşman HUD'u arası 8 px, oto ipucu düğmelere binmiyor.
- **Klan:** iki halkta kuruldu; Klan Obası `sahneler/klan_obasi_<halk>.webp`, 10 bina, portal üst orta, 2 arma dolu (Gemini N4-06).
- **Koruma:** `shared/`, `sahneler/` (29), `interiors/` (13 bg), `img/`, `audio/`, gömülü görsel JS'leri 1dda167'den beri **0 değişiklik** (`kanit/koruma/koruma_p33.json`).
- **Güvenlik (statik):** gizli anahtar kalıbı 0, `eval`/`new Function` 0, dış adres yalnız w3.org ve creativecommons (`kanit/guvenlik_tarama.txt`). Yetkili sızma testi değildir.

## Açık maddeler (kullanıcı kararı / dış kaynak)
1. **667×375 savaş HUD'u ve yan menü** katman olarak ölçekleniyor (otomatik `v31` şablonu), etkin yazı 6–9,8 px. Kullanıcının telefonunda (880) sorun yok.
2. **Karakter "+" düğmesi 22 px**: 28 px için satır yerleşimi değişmeli.
3. **667'de harita etiket kutuları** kısmen üst üste (yazılar okunur; dokunma bina şekliyle).
4. Gerçek cihaz testleri (FPS, pil, ısı, 30/120 dk), sunucu/anti-cheat, ağ kesilmesi.
5. GPT/Gemini'den istenen varlıklar: `GPT_ISTEK_P34.md` (zafer_aniti yüksek çözünürlük dahil).
