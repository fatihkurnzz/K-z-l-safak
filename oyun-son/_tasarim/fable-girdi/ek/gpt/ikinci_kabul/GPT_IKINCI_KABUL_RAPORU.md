# Korant Online — GPT ikinci kabul
Sürüm KORANT-v40-1dda167+P33. Karar: KISMİ KABUL / DÜZELTME GEREKLİ.

ZIP CRC temiz; manifestteki 33 dosyanın SHA256 değerleri eşleşti. Patch 23 dosya, +923/-56 satır; shared/ değişikliği yok. Önceki 254 test ID korunmuş; 974 benzersiz ID mevcut. Satır sayımı: 782 kabul, 52 ilk tur sonrası düzeltildi, 27 kısmen, 113 test edilmedi. JSON özetinde 128 test edilmedi yazıyor; yanlış. KAB-01…25 yok. Tam güncel oyun, test betikleri ve ekran görüntüleri bu pakette bulunmadığından canlı test ve varlık hash karşılaştırması yapılmadı.

## GPT talimatları 1–10
NPC adaptörü, yükleme metinleri, ses kanalları ve QA genişletmesi patch/raporda mevcut. Tüm NPC bağlamları, iki halk sesleri ve açılış ipuçları canlı doğrulanmalı. 44 px hedefi ve 667 okunabilirliği açık. 29 sahne +13 iç mekân korunması raporlanmış; bağımsız doğrulanmadı. Savaş süre riski açık. Eksik P34 varlıkları kayıtlı. Görsel kabul Gemini'ye ait. Yerel kip için sunucu güvenliği onayı verilmemesi doğru.

## Opus düzeltme ve doğrulama talimatı
- G2-01 Yüksek: combat.js boss uyarısı await wait(0.35) ekliyor. Mevcut animasyona bindir; aynı seed ile süre, sonuç, ödül karşılaştır.
- G2-02 Orta/risk: p33-canli.js orsSonuc gecikmeli callback anındaki #win'i seçiyor. İşlem/pencere kimliğiyle sınırla; pencere değişiminde test et.
- G2-03 Orta/risk: expAkit çift rAF eski genişliği yazabilir. Son güncelleme kazanmalı; hızlı güncelleme testi.
- G2-04 Yüksek/kanıt uyuşmazlığı: gpt-sancak.json hub amb.ocak.day. Elentha gerçek oturumunda doğrula ve gerekirse düzelt.
- G2-05 Orta: aynı dosyada acilis_ipucu null. İki halkta doğrula, yapay bekleme ekleme.
- G2-06 Orta: ui-town.js LOCAL gerçek para fiyatı ve etkin shop yönlendirmesi var. İlk sürümde gerçek para akışı kapalı kalmalı; satın alma gerçekleştiği kanıtlanmadı.
- G2-07 Orta: 22 px karakter + ve diğer küçük hedefler. 44 px etkin hit alanı hedefi; kullanıcı istisnalarını kaydet.
- G2-08 Yüksek: 667×375 HUD 6–9,8 px, harita etiketleri çakışıyor. 880 düzenini koru, 11 px hedefini sağla.
- G2-09 Orta: KAB-01…25 satırları yok. AAA kaynağındaki gerçek kriterleri eşleştir, kanıtsız kabul verme.
- G2-10 Yüksek: geliştirme test paneli kullanıcı kararıyla açık kalabilir; yayın profilinde varsayılan kapalı ve URL ile açılamaz olmalı. Sunucu yetkisi ayrı.
- G2-11 Orta: QA özetini satırlardan otomatik türet; 128 yerine 113, toplam 974.
- G2-12 Orta: SYS-DUP ve SYS-RESET kabul iken çoklu sekme ve haftalık reset test edilmemiş. Alt testleri ayır. SYS-SAVE bozuk kayıt kurtarma kanıtı değil.
- G2-13 Orta: orijinal 32 görev listesi Opus'ta yok. Orijinal kaydı bul/eşleştir; bulunamazsa belirsiz bırak.

15 savaş/baskın kısmi, 2 zaman penceresi test edilmedi. Sonuç/ödül/kayıt ve sınıf/cinsiyet kapsamını hedefli test et. 92 parametreli eylem ve 16 dinamik tarif için geçerli bağlam kullan veya gerekçeli kapsam dışı bırak. 52 düzeltme sonrası hedefli yeni kanıt sağla. Gerçek cihaz, uzun oturum, ağ, sunucu ve yetkili güvenlik testleri yapılmadı; masaüstü 3 dk bellek ölçümü bunların yerine geçmez. Denge değişmedi iddiası denge kabulü değildir.

P34 Zafer Anıtı aynı kompozisyon yüksek çözünürlük, ayrı hareket katmanları, NPC kareleri ve portreler Gemini uzmanlığına yönlendirilsin. Canavar/yetenek park kararını koru. Mini Dizi video ve özgün ses ayrı onay gerektirir. Referans olmadan üretme.

Gemini ikinci kabulüyle kök neden bazında birleştir. Onaylı görseller, mekanik, ekonomi, kayıt ve HUD kimliğini koru. Riskleri doğrulamadan kesin hata sayma. Teslim: yeni sürüm, G2-ID başına karar/kanıt, değişiklik listesi, güncel QA, hedefli testler. Fable henüz devreye girmesin; denetim girdileri nihai Opus turundan sonra hazırlanacak.
