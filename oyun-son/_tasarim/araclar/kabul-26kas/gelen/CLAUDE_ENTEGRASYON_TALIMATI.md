# Claude entegrasyon talimatı — KORANT-v40-1dda167

Bu teslim veri ve standart önerisidir; çalışan oyun kodu değildir. Güncel sürüm farklıysa önce ID ve değişiklik farkını kontrol et. Mevcut 23+9 görev geçerli; tamamlanmış işi tekrar etme.

1. NPC dosyasındaki gpt-npc-* içerik ID'leri yenidir, oyun kimliği değildir. Mevcut NPC ve ACT eşleşmesini kaynakta doğrula (özellikle c_silah/c_zirh/c_taki ve ortak roller). Null kimlikler için mevcut bağlamı kullan; sahte NPC ID yaratma. `diyalog({kim,ad,unvan,halk,satirlar,son})` şemasına adaptörle aktar; selamlama rastgele tek satır, işlem sonucu gerçek olaydan. Mevcut öğretici, kral ve Destan diyaloglarını ezme.
2. Yükleme metinlerini gerçek yükleme akışına bağla; 4 bölge, 5 zindan, 20 ipucu. EN fallback/çeviri kontrolü.
3. Ses manifestinde mevcut 4 müzik ve 131 sentez anahtarını yeniden kullan. Yeni VO dosyaları yok; sessiz fallback. Önerilen bağlamları mevcut ses motoruyla karşılaştır.
4. Tasarım tokenleri mevcut bildirimlerden alındı; hesaplanmış değerler değil. CSS yükleme sırasını koru; otomatik CSS şablonlarını elle değiştirme. 44 px hedefi ve 11 px metin standardını gerçek ekranda doğrula.
5. Varlık eşleşme kuralları ve terminoloji: gerçek ID'leri koru; Gemini görsel kanıtına göre yalnız doğrulanmış kusuru düzelt. 42 sahne hash, 13 iç mekân, ana harita ve HUD kimliği korunur.
6. Savaş etkileşim standartları yalnız sunum katmanı; RNG, hasar, ödül, ekonomi, sınıf ve kayıt değişmez.
7. QA matrisi 226 çekim + 13 iç mekân + 15 sistem testi; kaynak kodda ilave durumları ekle. Eski 157 sayısını doğrulanmış kabul etme. Tüm testler başlangıçta TEST_EDILMEDI.
8. Paket README'sindeki eksikler: Mini Dizi 10 video yok; Bran/Nessa portresi yok; 13 yaratık yalnız bekleme pozlu; boss ikinci evre özgün dönüşüm değil; Kragmir 5. yüz yuvası ayna. Gemini ile doğrula; canavar/yetenek üretimi park edilmişse kapsam dışı olarak raporla, izinsiz üretme.
9. Gemini paketinde bazı HUD/glif/VFX/yetenek kartları bulunmuyor; gerektiğinde gerçek varlıkları ayrıca sağla.
10. DD_LOCAL yerel kayıt: sunucu sonra. Gerçek sunucu güvenliği, eşzamanlı oyuncu kapasitesi veya anti-cheat onayı verme.

## Teslim ve kabul
Tek güncel oyun paketi, değişiklik listesi, doldurulmuş QA matrisi, temiz ekran görüntüleri ve gerçek cihaz raporu. GPT/Gemini bağımsız kabulü bu sonuçlardan sonra yapılacak.
