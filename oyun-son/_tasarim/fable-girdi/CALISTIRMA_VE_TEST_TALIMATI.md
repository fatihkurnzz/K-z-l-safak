# Çalıştırma ve test talimatı (Fable için)

## 1. Denetlenecek sürüm
- **Sürüm kimliği:** `KORANT-v42-b9a0b21` (yayın: sürüm 42). Depo: `fatihkurnzz/K-z-l-safak`, dal `claude/add-skill-repos-rne7at`, komit `b9a0b21`.
- **Karşılaştırılacak önceki sürüm:** `KORANT-v40-1dda167+P33` = yayın sürümü 41, komit `1e17c80` ("Sürüm 41 yayında (P33 kabul)"). Ondan önceki: sürüm 40 = komit `1dda167`.
- Fark: `git diff --stat 1e17c80 b9a0b21 -- oyun-son` (tasarım belgeleri `_tasarim/` altında; oyun dosyaları onun dışında).
- **ÖNEMLİ — push durumu:** bu oturumda GitHub'a push her zaman 403 verdi (GitHub uygulaması kurulu değil). Komitler oturum konteynerindedir; uzak depoda bulunmayabilir. Yayın kopyası: https://claude.ai/artifact/GwNoLLWnf5Wjc1PUJep2yi (sürüm 42). Fable'ın eriştiği dosyaların bu sürümle aynı olduğunu `manifest.json › surum_parmak_izi` (oyun dosyalarının sha256 özeti) ile doğrulaması önerilir.

## 2. Proje dizini ve mimari
- Oyun kökü: `oyun-son/` (`index.html`, `js/`, `css/`, `shared/`, `sahneler/`, `interiors/`, `img/`, `audio/`, `fonts/`, `vendor/three/`, `sw.js`).
- **İstemci:** derleme adımı yok; tarayıcıda doğrudan çalışan vanilla ES modülleri; three.js r160 gömülü (`vendor/three`). Yalnız yatay görünüm; dik telefonda gövde 90° döner (`js/orient.js`).
- **Mekanik:** `shared/` (kural, ekonomi, denge; istemci ile ortak). **Bu sürümde DEĞİŞMEDİ.**
- **Sunucu:** YOK. `window.DD_LOCAL = true` — oyun dünyası tarayıcıda `shared/memstore.js` ile çalışır, kayıt `localStorage` (`dd_local_world_v2`, `SAVE_V = 2`). Sunucu, hesap, anti-cheat, ödeme altyapısı yalnız kod iskeleti/arayüz; gerçek çalışan arka uç yok. İlk yayın kararı: yerel kayıt, gerçek para yok.
- Görsellerin çoğu WebP base64 olarak JS dosyalarına gömülüdür (yayında 511 dosya sınırı). Çıkarma: `python3 -I _tasarim/araclar/paket-26kas/cikar.py oyun-son/js <çıktı>`.

## 3. Oyunu çalıştırma
```bash
python3 -m http.server 8765 -d oyun-son        # depo kökünden
# tarayıcı: http://localhost:8765/              (yatay pencere; hedef 880×406)
```
URL parametreleri (yalnız deneme): `?gfx=low|high` grafik, `?dev=0` test panelini gizle, `?store=1` Play Store profili (test paneli her durumda gizli), `?tod=dawn|day|dusk|night` harita gün evresi, `?t3=1` T3 görünümü (kapalı karar), `?sehir=0` eski 2B kasaba, `?b2d=0` eski 3B savaş birimleri, `?glif=0`, `?rol=0`.
localStorage ayarları: `dd_canli='0'` çevre animasyonları (P33 zerreleri + P34 katmanları) kapalı, `dd_efekt='az'`, `dd_fps='30'`, `dd_pil='1'` pil tasarrufu, `dd_oto='1'` otomatik savaş.

## 4. Test araçları (Playwright Chromium; masaüstü tarayıcı — GERÇEK CİHAZ DEĞİL)
Bağımlılık: Node 22, `playwright` (Chromium), Python 3 + Pillow, numpy, scipy (görsel araçlar). Sunucu açıkken, `oyun-son/_tasarim/araclar/kabul-26kas/` içinden:
| Betik | Ne ölçer | Komut |
|---|---|---|
| `giris.js` | ortak giriş (sunucu → karakter oluştur → öğretici atla → geliştirici araçlarıyla seviye/eşya) | `require` edilir |
| `cek115.js` | 115 benzersiz ekranın çekim turu + otomatik denetçi (`denetci.js`: kesik/taşma/çakışma/küçük yazı/küçük hedef) | `node cek115.js <sancak|ocak> <çıktı>` |
| `eylem_cekim.js` | kaynak koddaki ekran açan her eylem | `node eylem_cekim.js <halk> ekran_envanteri.json <çıktı> [W H dpr]` |
| `savas_test.js` | 4 bölge, boss, 5 zindan, Meydan, Baskın, klan (Oba Avı + Klan Obası) savaşları; zemin, HUD çakışması, sonuç | `node savas_test.js <halk> <çıktı>` |
| `gpt_test.js` | NPC balonu, gerçek sonuç satırı, savaş perdesi, açılış ipucu, ses döngüleri | `node gpt_test.js <halk> <çıktı>` |
| `sistem_test.js` | kayıt, yenileme, çift tık, bozuk kayıt, EN dili, gece yarısı sıfırlama, bellek (masaüstü) | `node sistem_test.js <çıktı>` |
| `p34_test.js` | **P34:** sahne katmanları (başkent/çarşı/klan), NPC göz/ağız kareleri, Bran/Nessa, zafer anıtı 2048, Kragmir 5. yüz, yaratık/boss pozları (tarayıcıda çözülme), ayar kapatmaları | `node p34_test.js <halk> <çıktı> [W H]` |
| `bina_test.js` | **P34:** Han/Ahır/Zafer bina katmanı yeniden çizimi (binaAcik gerilemesi) | `node bina_test.js <halk> <çıktı>` |
| `hud11.js`, `etkin` (P34 ölçümü) | 11 px altı yazı | `node hud11.js <halk>` |
| `kontrast2.py`, `cozumle.py` | kontrast ve çekim ölçüm özetleri | |
JS sözdizimi: `.js` dosyasını `.mjs` olarak kopyalayıp `node --check` (doğrudan `.js` üzerinde sessiz geçebiliyor).
Görsel gömme araçları (OTOMATİK dosyaları elle düzenleme): `_tasarim/araclar/p34-gom.py` (P34), `b2d-g3-gom.py`, `b2d-gom.py`, `karakter-gom.py`, `gom.py` …

## 5. Mevcut test kayıtları
- Bu sürüm (v42) kanıtları: Fable paketi `kanit/` (yalnız başka yoldan erişilemeyenler) + `KANIT_DOSYALARI_INDEKSI.json`.
- Önceki sürüm (v41, P33) kanıtları: `_tasarim/araclar/kabul-26kas/` (`QA_MATRISI_DOLU.json`, `TEST_KANITLARI.md`, `kanit/`), ekran görüntüleri Gemini'ye gönderilen `KORANT_GEMINI_KABUL2*` paketlerinde (depoda değil). **Bunlar v42'nin kanıtı değildir.**

## 6. Bilinen ortam sınırlamaları
- Gerçek telefon, Android geri tuşu, gerçek dokunmatik, pil/ısı/FPS ölçümü, uzun oturum (30/120 dk), ağ kesilmesi, gerçek sunucu/çoklu oyuncu, ödeme, Play Store paketi **bu ortamda test edilemez**.
- Konteynerde ses çıkışı yoktur: ses yalnız kod/anahtar düzeyinde doğrulanır (dinleme yapılmadı).
- Chromium yazılım GL ile çalışır; FPS ve bellek değerleri telefona genellenemez.
- Gizli bilgi, erişim anahtarı ya da gerçek oyuncu verisi pakette YOKTUR; test hesapları her koşuda yeni oluşturulan yerel karakterlerdir ("Denetci").
