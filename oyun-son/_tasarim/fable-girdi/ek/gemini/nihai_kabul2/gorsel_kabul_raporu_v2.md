# Korant Online — 2. Tur Nihai Görsel Kabul Raporu (KABUL 2)

- **Sürüm:** `KORANT-v40-1dda167+P33` | **Tarih:** `2026-11-26`
- **Nihai Görsel Karar:** **KABUL (GÖRSEL OLARAK YAYINA HAZIR)**
- **Kapanan Bulgular:** 1. turdaki **17/17 Düzeltme** ve pakette eksik olan **Klan Obası dış haritası, 4 bölge, 4 boss, 5 özgün zindan, PvP, Oba Avı (Tepegöz) ve 667×375 / 1180×820** çözünürlükleri görsel olarak **KABUL** edildi (0 JS hatası, 0 MB bellek artışı).

## Doğrulanan Bulgular ve Kapanış Tablosu

| ID | Ekran / Kapsam | 1. Tur | 2. Tur Karar | Görsel Kanıt |
|---|---|---|---|---|
| `N4-01` | zaferAniti (Elentha & Kragmir) | Düzeltme | **Kabul** | 01_EKRANLAR_880x406/*/C-zaferAniti.webp — Pembe Monument iki ırkta da aktif, ortak altın çerçeve ve standart X düğmesine geçirildi (yalnız 512×217 yerine 1584×672 yüksek çözünürlüklü dosya kopyalanmalı). |
| `N4-02` | diyarMap / otag (Elentha & Kragmir) | Düzeltme | **Kabul** | 01_EKRANLAR_880x406/*/C-diyarMap.webp & C-otag.webp — Yeni Türkçe yazılı diyar_haritasi.webp bağlandı, span.wctx kırpılması ve Elentha çizgisi giderildi, NPC replikleri eklendi. |
| `N2-01` | premium (Elentha & Kragmir) | Düzeltme | **Kabul** | 01_EKRANLAR_880x406/*/C-premium.webp — $149/$299 kaldırıldı; 'Yakında ₺149' / 'Yakında ₺299' ve 'YAKINDA' düğmeleri uygulandı. |
| `N1-01` | profile + ana harita deneme rozeti | Düzeltme | **Kabul** | 01_EKRANLAR_880x406/*/C-profile.webp & 08_SISTEM/cesitli/sonuc.json — dev0 ve store1 kiplerinde test araçları ve deneme rozeti tamamen kapalı (false). |
| `N3-01` | karakter sol vitrin (Elentha & Kragmir) | Düzeltme | **Kabul** | 01_EKRANLAR_880x406/*/C-karakter.webp — Oyuncunun gerçek yeşil tenli kılıç+kalkan Kragmir ork savaşçısı ve Elentha savaşçısı tam boy vitrine bağlandı. |
| `N6-01` | karakter (+ düğmeleri ve Toplu çakışması) | Düzeltme | **Kabul** | 01_EKRANLAR_880x406/*/C-karakter.webp — Nitelik '+' düğmeleri ve çanta alt satır/Toplu düğmesi çakışması temizlendi. |
| `N4-03` | anvil (Büyük Örs) | Düzeltme | **Kabul** | 01_EKRANLAR_880x406/*/C-anvil.webp & 04_CANLILIK/*/ors_basari.webp — Üst sayaç taşması giderildi, sağda Büyük Örs atölyesi ve usta repliği görünüyor, başarı/başarısızlık efektleri çalışıyor. |
| `N4-04` | han / ahir (Elentha & Kragmir) | Düzeltme | **Kabul** | 01_EKRANLAR_880x406/*/C-han.webp & C-ahir.webp — Ortak pencere çerçevesine ve standart kare X düğmesine geçirildi, NPC replikleri eklendi. |
| `N5-01` | D02-savas-a / 03_SAVAS_KLAN | Düzeltme | **Kabul** | 03_SAVAS_KLAN/*/sonuc.json — oto_tip_var=false, oto_tip_cakisan=[], en_kucuk_dikey_bosluk_px=8. |
| `N6-02..07` | quests, quick, meydan, nobet, chatOpen, karaborsa, achs | Düzeltme | **Kabul** | 01_EKRANLAR_880x406/* — Nöbet alt kesilmesi, sohbet çakışması, görev/VS/meydan hizalamaları ve Elentha üst şerit çizgisi düzeltildi. |
| `N4-06` | Klan Obası Dış Haritası (Elentha & Kragmir) | Test Edilmedi | **Kabul** | 03_SAVAS_KLAN/*/klan_1_oba_dis_harita.webp — Her iki ırkın yeni Klan Obası haritası ve üst orta arka sur kapısındaki Işınlanma Kapısı etiketi/hotspot'ı piksel hassasiyetinde doğrulandı. |
| `N5-02` | 4 Bölge, 4 Boss, 5 Özgün Zindan, PvP Arena, Oba Avı Tepegöz | Test Edilmedi | **Kabul** | 03_SAVAS_KLAN/*/*_2_savas.webp — Vahran, Kül Geçidi, Kızıl Bahar, Sisli Çukur, Boss Mağarası, PvP Arena, Oba Avı Arenası (Tepegöz) ve 5 özgün zindan (Dipsiz Kuyu, Yeraltı Ocağı, Gök Yarığı, Mühürlü Oda, Kül Kulesi) tamamı ayrı sahnelerde, temiz sprite zemin temasıyla doğrulandı. |
| `N6-08` | 667×375 Dar Telefon & 1180×820 Tablet | Test Edilmedi | **Kabul (Çözünürlük) / Test Edilmedi (Gerçek Cihaz Pil-Isı)** | 05_COZUNURLUK_667/ & 05_COZUNURLUK_1180/ — 667×375 ve 1180×820 yerleşimleri görsel olarak doğrulandı; gerçek telefon pil/ısı/FPS ölçümü yayın öncesi fiziksel cihazda yapılmalı. |

## Canlılık, Efekt ve Sistem Doğrulamaları
- **4 Gün Evresi:** 4 evre (dawn, day, dusk, night) doğal ve gece binaları karartmıyor (Kabul).
- **Örs & Ganimet Efektleri:** Örs başarı (16 kıvılcım), başarısız sönümleme, görev şeridi, nadir/eşsiz ganimet parlaması doğrulandı (Kabul).
- **Ses Kanalları:** 5 kanal (master, ui, battle, amb, music) ve 5 zindan için ayrı ortam sesleri doğrulandı (Kabul).
- **Veri & Sistem Bütünlüğü:** Yenileme veri koruması, çift tık koruması (Han & Tezgâh), bozuk JSON kurtarma, gece yarısı sıfırlama, EN dili ve 0 MB bellek artışı doğrulandı (Kabul).

## Yayın Öncesi Son 2 Not
1. **Yüksek çözünürlüklü `zafer_aniti.webp`:** Depodaki `512×217` kopya yerine daha önce teslim edilen **`1584×672` `zafer_aniti.webp`** dosyasının kopyalanması önerilir.
2. **Gerçek cihaz testi (`Test Edilmedi`):** `60 FPS / 0 MB` bellek artışı masaüstü yazılım GL üzerinde ölçülmüştür; yayın öncesi gerçek bir Android/iOS telefonda 30 dakikalık pil ve ısınma kontrolü yapılmalıdır.
## KABUL 2 EK — Eylem Turu ve Dinamik Durumlar Denetimi (`KORANT_GEMINI_KABUL2_EK`)
- **Kapsam:** `06_EYLEM_TURU` (Elentha 222 + Kragmir 222 eylem, 858 WebP) ve `07_DINAMIK_DURUMLAR` (Elentha 119 + Kragmir 119 durum, 238 WebP) — toplam **1.096 tam çözünürlüklü kare**, **0 JS hatası**.
- **Gözle Doğrulanan Ekler:** `Klan Karargâhı -> Oba Avı: Tepegöz` (`0211-av.webp`), `Otağ -> Harita` (`0085.webp`), `Silah ve Kalkan` (`0071.webp`), `İlk Alım Paketi` (`0099.webp`), `Premium` (`0014.webp`), `Menü` (`0043.webp`), `Ustalık/Ünvan` — tamamı **KABUL**.
- **Yüksek Çözünürlüklü `zafer_aniti.webp`:** `GPT_ISTEK_P34.md` Madde 1 kapsamında **`sahneler/zafer_aniti.webp` (`1600×678`, 152.7 KB WebP)** bu pakete eklendi.
- **Kapsam Dışı Bırakılanlar:** Madde 2–5 (tek parça boyalı sahne / sade 2B parçacık kararıyla elenen şehir maskeleri ve NPC göz kırpma kareleri) ve Madde 6–11 (GPT 6.2 görevleri).
