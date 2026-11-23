# Korant · Son eksik listesi (23.11, sürüm 36 sonrası)

**Kullanıcı kararı (23.11):** önce KOD bitecek, nihai sürüme ulaşılacak. Testler, GPT görselleri ve yayın altyapısı
**nihai sürümden SONRA** yapılacak (bölüm 2). Bölüm 1 = şimdi yapılan kod işleri.

---------------------------------------------------------------------------------------------------------------------

## 1. Kodda kalanlar — BİTTİ (23.11, 14. oturum) → kod nihai sürümde
1. [x] **Ödeme ekranı ilk sürüme uygun:** "Deneme sürümü" dili kalktı; Yakut Al / Kervan satın alma düğmeleri "Yakında",
   üst bilgi "Mağaza yakında açılıyor" (TR+EN). Karakter seçme/oluşturma ve hoş geldin duyurusundaki "deneme" sözü kalktı.
2. [x] **Kalan M3 glifleri:** savaşta Otomatik (otomatik), Oto İksir (iksir-can), hız (hiz) düğmelerinde glif üstte, yazı
   altta (`duzen.css` sonu; glif yoksa eski yazılı düğme).
3. [x] **C11 düğme rolleri** (`html.roller`, kapatma `dd_rol='0'` / `?rol=0`): birincil = .green/.red, ikincil = .btn/.blue,
   tehlike = yeni `.tehlike` (kaydı sıfırla, klandan çıkar, klandan/ittifaktan ayrıl, arkadaşlıktan çıkar, engelle, parçala),
   satın alma = birincil + para simgesi; yükseklik en az 40 / 32 px. Ana ekranda zaten 3 sayaç (enerji, akçe, yakut).
   **Bilerek yapılmadı:** `!important` temizliği (görünüşü değiştirmeyen iç düzen; ancak testle güvenli) → 2D.
4. [x] P5: Fragman (dört boyalı hikâye karesi), Mini Dizi (G5 bölüm kartları), Diyar Haritası (yeni çizim) zaten bağlıymış.
5. [x] Kullanılmayan teslimler (`dragon_earth/poison`, balta, pelerin, tırpanlı tam boy) gömme araçlarına alınmadı; oyunda yok.
6. Bilerek bırakılan: pencere sekmelerinde ve satır simgelerinde eski game-icons.

## 2. NİHAİ SÜRÜMDEN SONRA

### 2A. GPT'den beklenen görseller
1. G3: 13 yeni türün (tavşan, şahin, eşek arısı, gargoyle, barbar lideri, lamia, yılan kraliçesi, 6 ejder) **saldırı ve
   vurulma pozları**. Şimdi bu türler yalnız bekleme pozuyla vuruyor.
2. Bossların **2. evre çizimleri** (gerçek dönüşüm). Şimdi aynı çizimin ikinci kopyası.
3. Mantikor ve megantereon için **portre kırpımı** (düşman çerçevesindeki baş).
4. Kragmir'in **5. yüzü** (şimdi 5. yuvada savaşçı yüzünün aynası).
5. Play Store için: uygulama simgesi (512×512), öne çıkan görsel (1024×500), 4–8 mağaza ekran görüntüsü çerçevesi.
6. Kozmetik eşyaların görselleri (bkz. 2C-4): çerçeve, amblem, sancak, karakter görünüşü.
7. **Mini Dizi'nin 10 bölüm videosu** (`video/bolum-01..10.mp4`; şimdi "Bu bölüm yakında").
8. (İsteğe bağlı) Savaş ve boss **müzikleri** (şimdi sentez). Karakter 2B resminde **kuşanılan eşya katmanları**.

### 2B. Testler (bende yapılmayacak, kullanıcı en sonda topluca)
1. **Gerçek telefon** (2340×1080, uygulamada döndürülmüş): dokunma, kaydırma, yazı boyu, Android geri tuşu.
2. Kragmir savaşı (yeşil pozlar), Tepegöz bossu, ejder dünya bossu, Koru'da tavşan, şimşek / kutsal / gölge yetenekleri.
3. Her bölgeden bir savaş (y1–y4) ve ana boss savaşı: boy, zemine oturma, boss 2. evre geçişi.
4. VS (boss, Meydan rakibi, Taş Yemini); sonuç ekranı (yenilgi, nöbet, meydan, kule); Karakter 2B iki halkta 4 sınıf.
5. Diyaloglar: Halvor (satın alma sonrası), Bran (3 durum), izci (iki halk), Yashka.
6. EN ↔ TR geçişi: eşya ve yetenek adları, "Aşama" metinleri.
7. Hiç denenemeyenler: PvP, ödeme, klan içi ekranlar, İz Takası.
8. Otomatik turda açılamayan 20 ekran (meydan, hall, czArena, czHall, gatePvp, exchange, tp, spin, gift, charSwitchMenu,
   skill, sandikOpen, haftalık/aylık bonus, tierInfo, calInfo, emoOpen, arenaRefresh, yashka): elle açılıp bakılacak.
9. Görevler sekmesindeki rozetin yeni yeri (simgenin sol üst köşesi) iki halkta.
10. 14. oturum işleri: Yakut Al ve Kervan'da "Yakında" düğmeleri (TR/EN); savaşta Otomatik/Oto İksir/hız glifleri
    yuvarlak düğmeye sığıyor mu; düğme rolleri tüm pencerelerde (özellikle .red → birincil kit, .tehlike kırmızı,
    40/32 px en az yükseklik yerleşimi taşırıyor mu); beğenilmezse `?rol=0` ile eski görünüş.

### 2C. Yayın altyapısı planı (Play Store)
**Kararlar (23.11, kesin):** Play Store · ilk sürüm yerel kayıtla · para kazanma: ilk sürümde gerçek para YOK, sonra
önce kozmetik, sunucu gelince avantaj · 2. sezon ilk sürümden sonra.

Sıra:
1. **Android paketi:** Capacitor (kodda `pay-native.js` buna göre yazılmış). `capacitor.config`, Android projesi,
   ekran yönü yatay kilitli, tam ekran, durum çubuğu gizli, geri tuşu → açık pencereyi kapat / çıkış onayı.
   Servis çalışanı (`sw.js`) ve gömülü dosyalar uygulamanın içinde → çevrimdışı açılır.
2. **İmzalama:** yükleme anahtarı + Play App Signing; sürüm numarası düzeni (versionCode her yayında +1).
3. **Mağaza zorunlulukları:** gizlilik politikası sayfası (yerel kayıt, veri toplamıyor), Veri Güvenliği formu, içerik
   derecelendirmesi (IARC; şiddet: fantastik), hedef kitle/yaş, güncel hedef API düzeyi, mağaza metni TR + EN.
4. **Kozmetik dükkânı** (sunucu gelmeden önce de olabilir ama satın alma için 5 gerekli): çerçeve, amblem, sancak,
   karakter görünüşü; güce etkisi yok. Yeni mekanik olduğu için `shared/` içinde tasarlanacak (kullanıcı onayıyla).
5. **Küçük sunucu:** hesap + bulut kaydı, satın alma doğrulaması (Google Play Developer API ile kanıt doğrulama),
   iade bildirimleri (RTDN). Kodda `payCall`, `pay.view/pay.buy` akışı hazır; `DD_LOCAL=false` ile sunucuya geçer.
6. **Google Play Billing:** ürün kimlikleri `shared/pay.js storeId` ile aynı adla Play Console'da açılır.
7. **Avantaj satışı** (Yakut paketleri, Premium, Yakut Kartı, İlk Alım Paketi): yalnız 5 çalışınca açılır;
   Play kuralı: ganimet sandığı varsa olasılıklar gösterilmeli.
8. **Çevrimiçi:** PvP, klan, ortak sıralama, sohbet denetimi (şikâyet/engel arayüzü hazır).
9. **Kapalı test → açık test → üretim** (Play Console test kanalları); çökme raporu için hafif bir hata günlüğü.
10. **2. sezon** (yeni bölge/hikâye).

### 2D. Testten sonra yapılacak kod
1. `!important` temizliği ve CSS katmanlarının sadeleştirilmesi (v26/v31/v32/v33 şablonları dahil).

## 3. Teknik not
- Git push hâlâ 403 (GitHub uygulaması depoda kurulu değil); commit'ler yerelde duruyor.
- Yayında 485/511 dosya var; 26 boş yer.
