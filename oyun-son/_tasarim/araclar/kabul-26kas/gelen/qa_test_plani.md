# Korant QA — KORANT-v40-1dda167

## Kapsam
226 çekim (112 Elentha, 114 Kragmir), 115 birleşik ekran kimliği; 13 iç mekân ayrıca işlevsel test. Eski 157 hedefi doğrulanmadı; kaynak koddan eksik durumları ve parametreli ACT girişlerini ekle. Matris 254 başlangıç satırı içerir, hepsi TEST_EDILMEDI. Kolajlar test kanıtı yerine geçmez.

## Yürütme
- Temiz yeni hesap ve öğreticisi bitmiş hesap; iki halk, tüm sınıf/cinsiyet. Test verisi gerçek oyuncu verisi değildir.
- Her ekran için açılış, doğru başlık/içerik, tüm sekme/buton/hotspot/filtre/kaydırma, kapanış ve geri dönüş; aynı görüntü kısayollarını ayrı yönlendirme olarak dene.
- 880×406, 667×375, 1180×820, masaüstü; gerçek Android ve iOS yatay. 44 px dokunma hedefi, 11 px asgari yazı, görünür odak, kontrast ve taşma kontrolü.
- 5, 30, 120 dakika oturum; cihaz, tarayıcı, grafik profili, başlangıç/son pil, sıcaklık, FPS ve p95 kare süresi, bellek, ağ, hata kaydı. Önerilen hedef: desteklenen cihazda 30 FPS altına sürekli düşmeme; cihaz bazlı hedefi önce onayla.
- Ağ kesintisi, yenileme, çift işlem, çoklu sekme, kayıt ve geri yükleme, UTC+3 sıfırlama; yalnız test ortamında. DD_LOCAL mimarisi gerçek sunucu güvenliği sağlamaz.
- Aynı kayıt ve RNG tohumu ile önce/sonra savaş ve ekonomi karşılaştırması; 42 onaylı sahne hash kontrolü.

## Öncelik ve kabul
Kritik: veri kaybı, çoğaltma, erişim ihlali, temel akış blokajı. Yüksek: ana işlev bozuk veya ciddi okunabilirlik. Orta: sınırlı işlev/görsel kusur. Düşük: kozmetik. Her satırda gerçekleşen sonuç, kanıt yolu, cihaz, sürüm, öncelik, tekrar adımı ve KABUL/DÜZELTME/RET/TEST_EDILMEDI doldur. Kanıtsız kabul yok. Kritik açık veya sunucu altyapısı eksikse gerçek çok oyunculu yayın onayı yok.

## Mevcut otomatik tarama
17_DENETIM_RAPORLARI/OTOMATIK_ARAYUZ_DENETIMI.md yaklaşık ölçümler: karakter küçük hedef/çakışma, quests kesik/çakışma, günlük ödül, başarımlar, örs, karaborsa, meydan, diyarMap/otag, quick ve Kragmir chatOpen. Matris satırlarına ham bulgular taşındı; gözle ve işlevsel doğrulama gerekli.
