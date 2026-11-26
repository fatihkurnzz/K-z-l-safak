# Korant (Demir Diyarı) · P34 ortak kurallar — GPT ve Gemini için aynı

Sürüm kimliği: `KORANT-v40-1dda167+P33` (yayın: sürüm 41). Bu belge iki uzman için de bağlayıcıdır. Görev belgesi (GPT_GOREVLERI.md / GEMINI_GOREVLERI.md) bu kuralları aşmaz.

## 1. Oyun
- Tarayıcıda çalışan, YALNIZCA YATAY (landscape) çizilen 3B/2B karışık mobil RPG. Sıra tabanlı savaş. Hedef ekran: telefon 880×406 mantıksal (2340×1080 piksel).
- İki halk: **Elentha** (insan; kimlik `sancak`; mavi-altın, taş/mermer, yeşil dağ) ve **Kragmir** (ork; kimlik `ocak`; kızıl-kara, lav, boynuz/kemik). Orklar YEŞİL tenlidir (kullanıcı kararı, kesin).
- Savaşçı kılıç + kalkan taşır (tırpan değil). Oyunun adı arayüzde **Korant**.
- Dil: oyun TR seçiliyken her şey Türkçe. Görsellerin üzerine yazı konmaz.

## 2. DEĞİŞTİRİLMEYECEKLER (bu paketin hiçbir görevi bunlara dokunamaz)
1. **Onaylı başkent ve şehir görselleri değişmez**: `img/kd/sehir/{sancak,ocak,carsi,klan-sancak,klan-ocak}/sahne.webp` ve `atlas.webp`, `sahneler/baskent_*.webp`, `sahneler/yemin_pazari.webp`, `sahneler/klan_obasi_*.webp`, 13 iç mekân, 42 sahnenin tamamı. Çevre animasyonu YALNIZ ayrı saydam katman olarak gelir; fotoğrafın pikseli, binası, sancağı, armayı yeniden çizilmez.
2. **Yetenekler, savaş mekaniği, ekonomi, denge değerleri değişmez.** Yetenek simgesi/çizimi bu paketin dışındadır (ertelendi). Savaş formülü, hasar, ödül, oran, süre = dokunulmaz (`shared/` klasörü mekaniktir; pakete bile konmadı).
3. **Mini Dizi video üretimi YOKTUR.** Mevcut Mini Dizi sistemi (`shared/minidizi.js`, `video/README.txt`, `minidizi-01…` kapak resimleri) aynen kalır.
4. **Mevcut başarılı varlıkları yeniden üretme.** Bu paketteki "KORUNACAK" listesi (`KORUNACAK_VARLIKLAR.md`) üretime geri gönderilmez. Bir varlığı yalnız görev belgesi açıkça "yeni/eksik" diyorsa üret.
5. Karakter kimlikleri (yüz, saç, kıyafet, silah, renk paleti) referanstaki gibi kalır. Yeni çizim referansın BİREBİR AYNI karakteri olmalıdır; "benzer" kabul edilmez.

## 3. Görsel teknik standartlar
- Biçim: **PNG (gerçek alfa) ya da WebP**. YASAK: AVIF, SVG, BMP/TGA/TIFF, GIF, JPEG (saydamlık gerekenlerde).
- **Gerçek alfa kanalı.** Zemin saydam olmalı. Opak beyaz/gri/dama deseni/"saydam gibi görünen" zemin KABUL EDİLMEZ (geçmişte beş sette opak beyaz zemin sorunu çıktı). Alfa gelmiyorsa teslim öncesi kendi aracınla temizle; saydamı olmayan teslim reddedilir.
- Kenarlarda beyaz/parlak halo yok; dış çizgide arka plan rengi sızmaz (ön-çarpımsız alfa).
- Yön: savaştaki yaratıklar ve bosslar **SOLA** bakar (baş görselin sol yarısında; ayrıntı görev belgesinde). Portreler ve yüzler referansla aynı yöne bakar.
- Renk profili sRGB. Gölge/zemin gölgesi resme GÖMÜLMEZ (oyun kendi gölgesini çizer).
- Üzerinde yazı, filigran, imza, UI çerçevesi, logo olmaz.
- Stil: tek parça boyanmış, gerçekçiye yakın fantastik illüstrasyon; sade, az altın (kullanıcının beğenisi). Ayrı "sticker/vektör/çizgi film" görünüm kabul edilmez. Referanslar `06_REFERANS_STIL/` (`SANAT_KITABI.md`, onaylı örnekler, kaçınılacak örnekler).
- Dosya adı: ASCII, küçük harf, tire; Türkçe karakter yok (`kristal-muhafizi`, `saldiri2`).

## 4. Ses teknik standartları (yalnız ses görevi olan uzman)
Ayrıntı `SES_SISTEMI.md`. Özet: MP3 (ya da OGG Vorbis), 44,1 kHz; müzik stereo 128 kbps, mevcut müzikler −12 … −14 LUFS; ortam döngüleri kesintisiz (loop), NPC sesi mono. Telifsiz/özgün; sentetik ses üretici kullanıldıysa araç adı ve lisans notu teslim JSON'unda yazılır. Gerçek kişi/ünlü ses taklidi YASAK.

## 5. Dosya yolları ve entegrasyon (bilgi; entegrasyonu Claude yapar)
- Entegrasyon **teslimler ve ikinci kabul raporları geldikten sonra, TEK aşamada** yapılacaktır. Sen yalnız teslim şemasına uygun dosya üretirsin; oyun koduna dokunmazsın, kod önermeye gerek yok.
- Oyuna girişte görseller WebP'ye çevrilip tek JS dosyalarına gömülür (yayında en çok 511 dosya sınırı; şu an ~464 dosya kullanımda). Bu yüzden **çok sayıda küçük dosya yerine kare şeridi (sprite-sheet) ya da numaralı kare dosyaları + yerleşim JSON'u** tercih edilir; dosya sayısı sorun değil, boyut ve doğruluk önemli.
- Her teslimde `teslim_manifest.json` (şema görev belgesinde) bulunmalı: dosya, ölçü, sha256, kaynak istek kimliği, "üretildi / yeniden üretildi / atlandı" durumu, kendi kontrol notu.
- Teslim ZIP'i 30 MB'ı aşarsa `…_01of0N.zip` numaralı, her biri bağımsız ve kendi manifest'ini taşıyan parçalara böl.

## 6. Kimlik ve kayıt tuzakları
- Sunucu/ödeme/anti-cheat/gerçek cihaz başarım iddiası YAZMA. Doğrulayamadığın şeyi "doğrulanmadı" diye işaretle.
- Belirsizlik varsa varsayımını teslim manifest'ine `varsayimlar` alanına yaz; kullanıcıya soru üretme, dur-kal yapma.
- Üretilemeyen/reddedilen kalemi sessizce atlama: manifest'te `durum: "uretilemedi"` + gerekçe yaz.
