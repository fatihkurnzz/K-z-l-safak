# Korant · Son eksik listesi (23.11, sürüm 36)

İlerleme: **kod tarafı ~%90**. Kalanların çoğu kod değil; görsel teslim (GPT) ya da gerçek cihazda deneme ister.
Otomatik denetim (880×406, iki halk): 88 ekrandan 68'i açıldı, **0 JS hatası**. Açılmayan 20 ekran parametre ya da
üyelik ister (meydan, hall, czArena, exchange, tp, spin, gift, charSwitchMenu…); hata değil, elle bakılmadı.

## A. GPT'den beklenen görseller
1. G3: 13 yeni türün (tavşan, şahin, eşek arısı, gargoyle, barbar lideri, lamia, yılan kraliçesi, 6 ejder) **saldırı ve vurulma pozları**. Şimdi bu türler yalnız bekleme pozuyla vuruyor.
2. Bossların **2. evre çizimleri**: gerçek dönüşüm. Şimdi aynı çizimin ikinci kopyası.
3. Mantikor ve megantereon için **portre kırpımı** (düşman çerçevesindeki baş).
4. Kragmir'in **5. yüzü** (şimdi 5. yuvada savaşçı yüzünün aynası var).
5. (İsteğe bağlı) Savaş ve boss **müzikleri**: şimdi sentezle çalıyor. Ana tema mp3.
6. (İsteğe bağlı) Karakter penceresindeki 2B resim **kuşanılan eşyayı göstermiyor**: eşya katmanları gerekir.

## B. Kodda kalan (görsel karşılaştırma ister)
1. **C11 görsel kısmı:** 4 düğme rolü, tek amblem, en çok 3 sayaç, `!important` temizliği. Görünüşü değiştirir, ekran ekran onay gerekir.
2. Kalan **M3 glifleri** (kilit, onay, uyarı, yenile, otomatik, hız, iksir): savaş HUD'unda henüz kullanılmıyor.
3. Pencere sekmelerinde ve satır simgelerinde hâlâ eski game-icons var: karışık görünmesin diye bilerek bırakıldı.
4. P5 maketleri **Fragman** ve **Mini Dizi** için uygulanmadı (eski sahneler duruyor). Diyar Haritası çizimi eski.
5. Kullanılmayan teslimler: `dragon_earth`/`dragon_poison`, balta bekleme pozu, pelerin katmanı, tırpanlı Kragmir savaşçı tam boyu.

## C. Senin denemen gerekenler (bende test edilemiyor)
1. **Gerçek telefon** (2340×1080, uygulamada döndürülmüş): dokunma, kaydırma, yazı boyu, Android geri tuşu.
2. Kragmir savaşı (yeşil pozlar), Tepegöz bossu, ejder dünya bossu, Koru'da tavşan, şimşek / kutsal / gölge yetenekleri.
3. Her bölgeden bir savaş (y1–y4) ve ana boss savaşı: boy, zemine oturma, boss 2. evre geçişi.
4. VS (boss, Meydan rakibi, Taş Yemini); sonuç ekranı (yenilgi, nöbet, meydan, kule); Karakter 2B iki halkta 4 sınıf.
5. Diyaloglar: Halvor (satın alma sonrası), Bran (3 durum), izci (iki halk), Yashka.
6. EN ↔ TR geçişi: eşya ve yetenek adları, yeni "Aşama" metinleri.
7. Hiç denenemeyenler: PvP, ödeme, klan içi ekranlar, İz Takası.
8. Otomatik turda açılamayan 20 ekran (meydan, hall, czArena, czHall, gatePvp, exchange, tp, spin, gift, charSwitchMenu, skill, sandikOpen, haftalık/aylık bonus, tierInfo, calInfo, emoOpen, arenaRefresh, yashka): elle açılıp bakılacak.
9. Görevler sekmesindeki rozetin yeni yeri (simgenin sol üst köşesi) iki halkta.

> Kural (23.11): testler en sona bırakıldı. Bundan sonraki her değişikliğin denemesi buraya eklenecek.

## D. Kararlar (23.11, kullanıcı verdi)
1. **Platform: Play Store** (Android uygulaması olarak paketlenecek).
2. **İlk sürüm yerel kayıtla**; sunucu (PvP, klan, ortak sıralama) sonra.
3. **Gerçek para + avantaj** satılacak.
4. **2. sezon yazılacak**, ama ilk sürümden sonra.

Bu kararların getirdiği işler:
- Android paketleme (Capacitor ya da TWA), imzalama, simge/ekran görüntüleri, mağaza sayfası, gizlilik politikası, yaş derecelendirmesi.
- Play Store'da uygulama içi satış yalnız **Google Play Billing** ile olur; `ui-odeme` buna bağlanmalı.
- **Çelişki:** avantaj satışı + yerel kayıt → kayıt cihazda düzenlenebilir, satın alınan avantaj bedavaya alınabilir ve satın alma doğrulanamaz. Öneri: ilk sürümde en azından satın alma doğrulaması ve hesap/bulut kaydı için küçük bir sunucu, ya da ilk sürümde yalnız kozmetik satış.

## E. Teknik not
- Git push hâlâ 403 (GitHub uygulaması depoda kurulu değil); commit'ler yerelde duruyor.
- Yayında 485/511 dosya var; 26 boş yer.
