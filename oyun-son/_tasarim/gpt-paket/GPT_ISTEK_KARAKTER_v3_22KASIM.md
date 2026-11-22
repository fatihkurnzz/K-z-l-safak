# VAHRAN — "Karakter Kararlı Devir v2" sonrası: Claude'dan GPT'ye geri bildirim (22 Kasım akşam)

## Oyuna giren
- `arayuz/baslik-levha-sancak.png`, `baslik-levha-ocak.png` → Karakter Oluştur başlığı (dokuz dilimli; ırka göre değişir).
- `arayuz/sinif-warrior|rogue|priest|mage.png` → oluşturma ekranındaki sınıf düğmeleri, sınıf bilgisi ve seçme ekranı plakası.
- Önce/sonra: `CLAUDE_once-sonra-ocak.jpg`, `CLAUDE_once-sonra-sancak.jpg`.

## Girmeyen ve nedeni
- `arayuz/dugme-birincil-ocak.png`: Elentha düğmesiyle (`dugme.png`: kesik köşe + çatlak süs) aynı biçimde değil (uçlarda
  baklava, düz dikdörtgen). İki ırkın birincil düğmesi aynı şekil olmalı. Şimdilik Claude'un kızıl tonu kalıyor.
  İstek: `dugme.png` ile BİREBİR aynı şekil ve süs, yalnız kızıl/kor renkte, 560×132, yazısız.
- `tamboy/` (16): sizin de belirttiğiniz gibi üretim onaylı değil; ayrıca (bkz. `CLAUDE_QA_tamboy.jpg`):
  - **Başı yok (4):** mage-sancak-m, priest-sancak-f, warrior-sancak-m, warrior-ocak-f.
  - **Ayak altında kopuk kırıntı / ayak kesik (3):** rogue-ocak-f, rogue-sancak-f, rogue-ocak-m.
  - **Sınıf ayırt edilmiyor:** mage-ocak-f ≈ priest-ocak-f, mage-ocak-m ≈ priest-ocak-m (aynı cübbe ve asa).
  - Zemin çizgisi tutarsız (ayak tabanı alttan %4'te değil; kimi %2, kimi %10).
- `yuz/` (20): kalite iyi ama Kragmir kadının 5 yüzü neredeyse aynı kişi; Kragmir erkek 0 ve 1 neredeyse aynı;
  erkeklerin çoğu sakallı (istenen: sakalsız, sakal oyunda ayrı seçiliyor). Yüz adlarıyla eşleşme beklenir:
  Elentha Keskin, Yumuşak, Geniş, Asil, Yaralı · Kragmir Yaban, Kaya Çene, Yaralı, Kurt Bakışlı, Kartal Kaş.

## Yeniden istenen (öncelik)
1. 16 tam boy, her biri AYRI üretilmiş özgün çizim (pano kesimi değil), 1024×1536 şeffaf, başı ve ayakları tam,
   ayak tabanı alttan %4, baş üstü %6 pay, aynı ölçek. Büyücü (asa + büyü ışığı, koyu cübbe) ile Şifacı/Şaman
   (açık renk cübbe, kutsal/totem simgesi) birbirinden açıkça ayrılsın.
2. 20 yüz, ad listesine göre gerçekten farklı 5 kişi, sakalsız, 384×384 şeffaf.
3. Kragmir birincil düğmesi (yukarıda).
