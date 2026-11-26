# KORANT_FABLE_DENETIM_GIRDISI — Fable 5.2 bağımsız nihai denetim girdisi

**Denetlenecek sürüm:** `KORANT-v42-b9a0b21` (yayın sürümü 42; oyun dosyaları komit `d5320b5` ile `b9a0b21` arasında aynı; `b9a0b21` yalnız tasarım belgesi/araç ekler).
**Karşılaştırma tabanı:** `KORANT-v40-1dda167+P33` = yayın sürümü 41, komit `1e17c80`.
**Hazırlayan:** Claude Opus 5.5 (entegrasyon ve kayıtlar). **Bu paket bir kabul kararı DEĞİLDİR.** Opus, GPT ve Gemini'nin beyanları denetim girdisidir; nihai karar Fable'ın bağımsız incelemesine aittir.

## Bu paket neyi içerir, neyi içermez
- İÇERİR: kayıtlar, durum matrisleri, envanter, test sonuçları, başka yoldan erişilemeyen kanıtlar (`kanit/v42/`), özgün uzman raporlarının kopyaları (`ek/`).
- İÇERMEZ: oyun kaynak kodu, görseller, sesler, önceki ekran görüntüsü paketleri (Fable bunlara depodan erişir; yollar her belgede verilmiştir). Önceki sürümün (v41) kanıtları depoda `oyun-son/_tasarim/araclar/kabul-26kas/` altındadır ve **v42'nin kanıtı sayılmaz**.

## Okuma sırası (önerilen)
| # | Dosya | Ne için |
|---|---|---|
| 1 | `CALISTIRMA_VE_TEST_TALIMATI.md` | Sürüm, komit, oyunu çalıştırma, test araçları, ortam sınırları, mimari (sunucu YOK) |
| 2 | `ACIK_SORUNLAR_VE_YAYIN_RISKLERI.md` | Açık/kısmi/test edilmemiş her şey, kök nedene göre; olası yayın engelleri |
| 3 | `P34_NIHAI_DURUM.json` | 11 P34 talebinin üretim / teslim / entegrasyon / test / kabul durumu |
| 4 | `BIRLESIK_HATA_VE_GOREV_MATRISI.json` | GPT + Gemini + Opus bütün bulguları (88 kayıt; önceki kimlikler korunmuş; KAB-01…25 ölçüt eşlemesi) |
| 5 | `TEST_KANITLARI_VE_SONUCLARI.md` + `KANIT_DOSYALARI_INDEKSI.json` | Her testin sürümü, ortamı, yöntemi, beklenen/gerçekleşen, kanıt yolu |
| 6 | `OPUS_NIHAI_ENTEGRASYON.md`, `ESKI_YENI_SURUM_KIYASLAMASI.md` | Ne değişti, neden, hangi dosyada; teknik borç |
| 7 | `GPT_NIHAI_TESLIM_VE_KABUL.md`, `GEMINI_NIHAI_TESLIM_VE_KABUL.md` | Uzmanların bütün işleri; teslim başarısı ile Opus entegrasyon başarısı ayrı |
| 8 | `KULLANICI_KARARLARI_VE_STANDARTLAR.md` | Korunacak kararlar; telif/lisans riskleri |
| 9 | `GUNCEL_OYUN_ENVANTERI.json` | Ekranlar (kaynak koddan), ırk varyantları, iç mekânlar, haritalar, NPC, sınıf, yaratık/boss, sistemler, varlık yolları |

## Durum dili (bütün belgelerde aynı)
`KAPANDI` (kanıtlı ya da kod düzeyinde, kanıt sütununda hangisi olduğu yazılı) · `KISMEN` · `AÇIK` · `TEST EDİLMEDİ` (yapılmadı; gerekçeli) · `YANLIŞ POZİTİF` (ölçümle/kaynakla çürütüldü) · `KULLANICI KARARI` · `KAPSAM DIŞI`.
"Kanıtlı" = test çıktısı ya da ekran görüntüsü var. "Kod" = yalnız kaynak kod değişikliği/incelemesi; çalışır hâlde gözlenmedi.

## En önemli 6 nokta (ayrıntı ilgili belgede)
1. **P34:** 11 talepten 8'i tam entegre, 1'i kısmen (P34-06: 3 tür kimlik sapması nedeniyle alınmadı), 1'i teslim edilmedi (P34-11 ses), 1'i kullanıcı kararıyla kapsam dışı (P34-10 Mini Dizi video).
2. **Sürüm 42'de tam savaş regresyonu ve 115 ekranlık çekim turu YAPILMADI** (kullanıcı isteğiyle durduruldu). P34 testleri, sistem testleri, GPT içerik testleri, bina/sekme/hafta testleri yapıldı.
3. **v42'de bulunup düzeltilen gerileme:** Han/Ahır işlem sonrası yeniden çizilmiyor, Zafer Anıtı "Yükleniyor…"da kalıyordu (`ui-ahir.js binaAcik`; kaynak dış sürüm v40).
4. **Gerçek cihaz, FPS/pil/ısı, uzun oturum, ağ, sunucu, ödeme, Play Store paketi test edilmedi.** Bütün testler masaüstü Chromium (Playwright).
5. **Özgün "32 maddelik" görev belgesi hiçbir yerde bulunamadı**; kapsam özgün kaynaklardan yeniden kurulmuştur ve özgün belge olarak sunulmaz.
6. Uzman raporlarında çelişkiler var (ör. Gemini 667×375'i bir raporda "Kabul", diğerinde "kısmen" yazıyor; GPT bulgularından 2'si test betiği hatası çıktı). Matris kanıta dayalıdır; uzman beyanları ayrı sütundadır.
