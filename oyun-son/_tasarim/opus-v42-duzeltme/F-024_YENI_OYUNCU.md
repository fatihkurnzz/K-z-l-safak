# F-024 — Yeni oyuncu akışı (Sonnet, 26.11)

Betik: `arac/yeni5.mjs` (geliştirici `dev.*` eylemi KULLANILMAZ; yalnız görünen "ileri/devam" düğmelerine basar; öğreticiyi atlamaz). Kragmir, 880×406, TR, yazılım GL. Ham zaman çizelgesi `F-024/yeni_ocak_zaman.json`, görüntüler `F-024/`.

## 5 dakika — ÇALIŞTIRILDI (otomatik oyuncu)
- 0 sn: karakter oluşturuldu, öğretici başladı ("İleri›").
- 8 sn: "Silahını kavra›" adımı.
- 10 sn: ilk savaş başladı.
- 300 sn: **hâlâ ilk savaşta**, Sv.1, 0 XP, 500 akçe, 0 eşya (yazılım GL'de bir savaş turu 20–75 sn; ilk savaş 5 dk'da bitmedi).
- Bu koşuda ilk görev, kuşanma ve seviye atlama **görülmedi**. Bu bir oyun kusuru kanıtı değil: yazılım GL ve otomatik oyuncu sınırı; gerçek cihazda insanla yeniden denenmeli.
- İlk koşuda betik, "Silahını kavra›" düğmesini tanımadığı için öğreticide kaldı (betik hatası, düzeltildi; ham veri tutulmadı).

## 30 / 60 / 120 dk — ERTELENDİ (kullanıcı kararı, 26.11)
Yayın öncesi test aşamasına kadar istenmiyor. Yapılmayacak değil, ertelendi. Yazılım GL hızı nedeniyle gerçek cihaz ya da insan oyuncu ile yapılmalı; betik `arac/yeni5.mjs` (`SURE_DK=<dk>` ile süre ayarlanır).
