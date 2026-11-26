# KORANT_P35_UI_GPT_GIRDI — P35 arayüz dönüşümü · GPT girdi paketi

**Hazırlayan:** Claude (Opus entegratör kanalı) · **Sürüm:** `KORANT-v42-b9a0b21` (kullanıcı tarafından kesinleştirilmiş; sürüm araştırması YAPMA) · **Tarih:** 26.11.2026

Bu paket bir **girdi paketidir**: GPT'nin A'dan Z'ye arayüz dönüşümünü gerçek V42 verisine dayandırması için hazırlandı. Tasarım, görsel ya da kod içermez. Oyun kaynak kodu DEĞİŞTİRİLMEDİ; Fable'ın V42 denetimine müdahale edilmedi.

## Halkın doğru adı: **Elentha** (Elenthia KULLANILMAYACAK). Diğer halk: **Kragmir**.

## Okuma sırası
1. `00_OKU/KAPSAM_VE_KURALLAR.md` — yasaklar, kapsam, G8 kararı, P35-06…09 notu
2. `01_ENVANTER/EKRAN_ENVANTERI.md` — gerçek ekran envanteri (benzersiz kimlik, kaynak, işlev, alt durum) + `ekran_envanteri.json`
3. `01_ENVANTER/EKRAN_GORUNTU_ESLEME.json` — ekran kimliği → görüntü dosyası (iki halk) + V41 teslim eşleştirmesi
4. `02_TASARIM_SISTEMI_MEVCUT/` — tokenlar, yazı karakterleri, CSS, pencere kabuğu, mevcut UI kiti
5. `03_VARLIKLAR/` — G8 arma/logo/rozet/sancak, UI kiti, glifler, atlaslar, katalog
6. `04_BUTCE/VARLIK_BUTCESI.md` — dosya sayısı, bayt, 511 sınırından kalan kapasite, önerilen teknik bütçe
7. `05_PILOT/` — Görev Defteri, Karakter/Envanter, Tüccar ayrıntılı teknik gereksinimleri + gerçek ölçümler + D02/D08 etkisi
8. `07_VERI/` — gerçek görev, eşya, kategori, NPC verisi (görsele gömülmeyecek metinlerin kaynağı)
9. `06_MANIFEST/` — her dosyanın sha256'sı, dosya eşleştirmeleri, ZIP planı
10. `EKSIK_VE_DOGRULANAMAYANLAR.md` — ne YOK, ne doğrulanmadı (önce bunu oku)
11. `DURUM.md` — devam edilebilir çalışma durumu

## ZIP planı (her biri ≤ 30 MB, bağımsız açılır)
| ZIP | İçerik |
|---|---|
| `KORANT_P35_UI_GPT_GIRDI_01of02.zip` (~7 MB) | Belgeler, envanter, tasarım sistemi, varlıklar, bütçe, pilot şartnameleri, veri, manifest |
| `KORANT_P35_UI_GPT_GIRDI_02of02.zip` (~26 MB) | Ekran görüntüleri: `03_EKRAN_GORUNTULERI/<elentha|kragmir>/…` (113 benzersiz durum × 2 halk) ve `04_PILOT_EK_GORUNTULER/…` (19 pilot ekran × 2 halk); görüntü başına 1760×812 WebP |

İki ZIP'i de aynı klasöre aç; yollar `KORANT_P35_UI_GPT_GIRDI/…` altında birleşir.

## Durum dili (bu pakette)
- **ÖLÇÜLDÜ** = bu pakette canlı oyunda ölçüldü. **KAYNAKTAN** = kaynak koddan okundu. **ÇEKİLDİ** = ekran görüntüsü var. **YOK / DOĞRULANMADI** = belgelenmedi; ayrıca yazıldı.
- Ekran görüntüleri **dev araçlarıyla yükseltilmiş TEST hesabından** (Sv.53, bol eşya, klansız) alındı. Görüntülerdeki sayı/ad/eşya gerçek oyun verisi değildir; tasarımda hiçbir oyun metni görsele gömülmeyecek.
- Gerçek cihaz, performans ve PvP/ödeme/klan-içi testleri yapılmadı.
