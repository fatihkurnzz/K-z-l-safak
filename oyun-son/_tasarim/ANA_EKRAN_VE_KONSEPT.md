# Demir Diyarı (Korant Online) · Ana Ekran Envanteri, Konsept ve Hikâye

> Kaynak: `js/ui-hub.js` (`renderHud`), `js/ui-dunya.js`, `js/ui-social.js`, `js/ui-odeme.js`, `shared/content.js`, `_tasarim/VAHRAN_destan.txt`.
> Kapsam dışı: açılır-kapanır **Görev izleyici** (sol üstteki `qtrk` kutusu: Ana görev satırı, +/− düğmesi, günlük görev ızgarası, "Tümünü gör").

---

## 1. Ana ekranın parçaları

Ana ekran, ırkına göre boyalı **2B şehir resmi** (başkent / Yemin Pazarı / klan toprağı) üstüne oturan bir HUD'dur. Resmin tamamı görünür; sürüklenir ve yakınlaştırılır, bir binaya basınca kesiti parlar ve binanın penceresi açılır. Ekran yalnız **yatay** çizilir (mantıksal ölçü 880×406).

### 1.1 Sol üst — Oyuncu kartı (`.pcard`)
- **Ad:** Oyuncu kartı (dikey çerçeve). Dokununca **Profil** penceresi açılır.
- İçerik: profil fotoğrafı (kahraman ya da ansiklopedide keşfedilen yaratık; çerçeveli), `Sv.<seviye>` + [unvan] + ad + rütbe rozeti, **can çubuğu** (HP, kırmızı) ve varsa **mana çubuğu** (MP, mavi).
- Profil penceresi: avatar/fotoğraf seçimi, unvan seçimi, halk etiketi, sunucu etiketi, rütbe ve sonraki rütbe için gereken Şan, TP (deneyim) yüzdesi, **Güç** ve **Eşya Seviyesi**, Üyelik/Klan/Irk bonusu şeridi, istatistikler (Savaş, Zafer %, Başarılı basma %, Başarısız basma, Çanta), çerçeve seçimi, sağ üstte **Ayarlar** dişlisi. Test araçları yalnız `?dev=1` ile görünür.

### 1.2 Oyuncu kartının altı — Premium şeridi (`.premrow` › `.prem`)
- **Ad:** Premium düğmesi.
- Üyelik yoksa "Premium · +%30 kazanç" çağrısı; varsa "<Kademe> Premium · N gün kaldı".
- Kademeler (`PREMIUM`): **Bronz** (500 Yakut · +%10 XP/Akçe, +%5 düşme, maden ×1,25), **Gümüş** (+%20, +%10, ×1,5), **Platin** (+%30, +%20, ×2); hepsi 30 gün; kademe arttıkça boşta kazanç süresi (10/12/16 sa), slot ve bilet sayısı artar.
- Yanındaki bayraklı **Bölge hâkimiyeti çipi** (`.wterr`) Diyar Haritası'nı açar (bkz. 1.5).

### 1.3 Sol ray (`.lrail`) — beş düğme
| Düğme | Ne yapar |
|---|---|
| **Menü** | Menü penceresi: Sıralama, Rehber (oyunun bütün sistemleri), Arkadaşlar (bekleyen istek rozeti), Promosyon kodu, Sorun / Teknik Destek, Mini Dizi, Sunucu, Tam ekran, Çıkış yap (yalnız çevrimiçi), Karakter değiştir. Rozet: bekleyen arkadaş isteği / destek yanıtı / yeni dizi bölümü. |
| **Duyuru** | Duyurular; okunmamış varsa nokta rozeti. |
| **Posta** | Posta kutusu. |
| **Ansiklopedi** | Keşfedilen yaratıkların kaydı (G3 boyalı portreler, bölge bölge). |
| **Harita** | **Diyar Haritası** (`diyarMap` → Kral Otağı penceresinin harita sekmesi). |

### 1.4 Sağ üst — Kaynak hapları (`.res`)
- **Enerji** (yeşil): şimdiki/en çok (`/120`), dolarken kalan süre sayacı (mm:ss). Her **5 dakikada 1** dolar, seviye atlayınca +30 verilir. Dokununca/“+” ile **Kervan** (mağaza) açılır.
- **Akçe**: oyun içi para. Gösterim: binlik ayraçlı.
- **Yakut** (kırmızı elmas): özel para. "+" ile **Yakut al** ekranı (şimdilik "Yakında" durumunda).

### 1.5 Sağ üst, kaynakların altı — Diyar şeritleri
- **Saat ve hava çipi** (`.wclock`): günün evresi (gündüz/gece vb.) + saat + hava durumu simgesi ve adı. Dokununca **Diyarın Hâli**: etkin bonuslar listesi + bugün/yarın hava tahmini (altı saatlik dilimler, herkes için aynı, saat sunucu saati UTC+3). Alt düğmeler: Diyar Haritası, Kral Otağı.
- **Bölge hâkimiyeti çipi** (`.wterr`): dört bölgenin sahibi halkı gösterir; dokununca Diyar Haritası.
- **Sunucu çipi** (`.wsrv`): sunucu amblemi + "Sunucu: Ares"; dokununca sunucu bilgileri.

### 1.6 Orta — Şehir binaları ve etiketleri (`.blabel`)
Etiket yalnız beyaz bina adıdır (üstünde küçük köşeli rol yazısı). Kilitli binada kilit simgesi ve "Sv. N" görünür; Maden dolduysa nokta rozeti çıkar. Çakışan etiketler kendiliğinden kayar.

**Başkent (Kragmir – Demirçukur / Elentha – Işık Meydanı)**

| Bina | Rol etiketi | İşlevi |
|---|---|---|
| **Kapı** | Sur | Seçim penceresi: **Sefer** (bölgeler, bosslar, zindanlar), **Destan** (Tarihin Külleri, sekiz bölüm), **CZ – PK** (Sv. 12'de açılır: Meydan, Şan Divanı). |
| **Çarşı** | Pazar yeri | Yemin Pazarı'na geçiş portalı. |
| **Kral Otağı** | Kral Otağı | Irkın otağı: Başbuğ seçimi (haftalık), Hazine/ulufe defteri, Ferman/hediye dağıtımı, Diyar Haritası. |
| **Örs** | Demirci | Eşyalara **artı basma**. |
| **Maden** | Madenci | Zamanla birikim; stok dolunca rozet. |
| **İksir ve Parşömen** | Simyacı | İksir ve parşömen üretimi/alımı. |
| **Kader Çarkı** | Talih | Çark çevirme (yalnız başkentte). |
| **Taş Yemini** | Anıt | Sıralama anıtı: şampiyon, lider klan, üstün ırk. |
| **Işınlanma Kapısı** | Geçit | Başkent ↔ Yemin Pazarı ↔ klan toprağı (klan üyesine). |
| **Karaborsa** | Kaçakçı | Gizli pazar. |
| **Savaş Çadırı** | Savaş | "Savaş" penceresini açar (Sefer / Hızlı Av / Meydan / Şan Divanı). |
| **Kral** (Volgar Demirdiş ya da Edran) | Kral | Diyalog; sonda "Destan" ve "Emrindeyim". |

**Yemin Pazarı (iki halkın tarafsız çarşısı):** Silah ve Kalkan (Silahçı), Zırh (Zırhçı), Takı (Kuyumcu), Sarf ve Malzeme (Erzakçı), Pazar (oyuncudan oyuncuya), Karaborsa, Şaman Yashka (diyalog; Nöbet/Anıt'a geçit), Balık Tut (iskele, Balıkçı), Işınlanma Kapısı, **Tüccar Halvor** ve (belli koşulda) **Küçük Bran**.

**Klan toprağı:** Karargâh, Klan Salonu, Görev Panosu, Klan Dükkânı, Sancak Direği, Oba Avı, Hisar, Klan Hazinesi, Kapı, Işınlanma Kapısı.

**Oyuncu levhası** (`.blabel.me`): kahramanın adı + küçük kalkan; dokununca Profil.

### 1.7 Sağ alt — Büyük **Savaş** düğmesi (`.savas2d.sv3`)
- Boyalı kılıç/glif simgesi ve "Savaş" yazısı. **Savaş** penceresi: **Sefer**, **Hızlı Av** (açık en yüksek aşamada tek savaş), **Meydan** (PvP, Sv. 12), **Şan Divanı** (Sv. 12).

### 1.8 Alt dock (`.dock`) — altı düğme
| Düğme | Açtığı | Rozet |
|---|---|---|
| **Karakter** | Kahraman, nitelik, yetenek, donanım | Dağıtılmamış nitelik/yetenek puanı |
| **Çanta** | Envanter (sınır 120) | `!` çanta dolunca |
| **Görevler** | Görev defteri: Ana, Günlük, Haftalık, Aylık | Alınmayı bekleyen ödül sayısı |
| **Klan** | Klan penceresi (Sv. 20) | — |
| **Kervan** | Mağaza | — |
| **Savaş** | Savaş penceresi | — |

### 1.9 En alt — Deneyim çubuğu (`.expbar`)
"EXP %xx,xx" yazısı ve altın dolgu; üstüne gelince tam sayı (deneyim/gereken).

### 1.10 Alt — Sohbet şeridi (`#chatbar`)
- Sekmeler: **Genel · Irk · Klan · Özel** (şeritteki mesajlar kanala göre değişir; Klan sekmesi klansızken uyarı yazar).
- Son 3 mesaj (gönderen adı halk renginde), yazma kutusu (140 karakter, iki mesaj arası 1,5 sn), **emoji** paneli (36 emoji), okunmamış rozeti, sağda **✕ / +** ile tek satıra küçültme. Mesaj alanına dokunmak tam ekran sohbeti açar (profil kartı, özel yazışma). Susturma bildirimi desteklenir.

### 1.11 Sağ kenar — İlk Alım rayı (`.srail`)
- "İlk Alım" simgesi (rozet 1): paket görülmüş ve alınmamışsa görünür. İçinde bir silah seçilir (her silah bir sınıf içindir, hesaba yalnız bir kez eklenir).

### 1.12 Bildirimler ve rozetler
- **Bildirim kartı** (üst orta ince şerit): tek kart, 2,6 sn; pencere/diyalog/savaşta bekler.
- **Deneme sürümü etiketi** (`.dev`): yalnız `?dev=1` iken "DENEME SÜRÜMÜ · kayıt bu cihazda".

### 1.13 Kaldırılan / artık yok
Mini harita (20 Kas) ana ekrandan kalktı; alttaki yetenek çubuğu kalktı (yetenekler Karakter → Yetenek'te). Savaşta Tur sayacı ve sıra şeridi de yok.

---

## 2. Konsept

**Korant Online (iç ad: Demir Diyarı)** — tarayıcıda çalışan, mobil öncelikli, **yalnız yatay** çizilen **3B/2B karışık RPG**. Sıra tabanlı, belirlenimci savaş; vanilla ES modülleri ve gömülü three.js r160 ile yazıldı.

**Temel fikir:** Çatışmanın iki yakasından birini seçersin — **Kragmir** (ork, `ocak`, yeşil tenli, kızıl/demir) ya da **Elentha** (insan, `sancak`, mavi/çelik) — ve üç yüz yıllık bir yalanın peşine düşersin.

**Çekirdek döngü:** Sefer (bölgeler, bosslar, zindan) → ganimet (eşya, akçe, malzeme) → Örs'te artı basma, Maden ve Pazar → daha zor aşamalar. Enerji ritmi (5 dk/1) kısa oturumlara uygundur; Otomatik savaş ve Oto İksir, uzun seanslara.

**Sistemler:**
- 4 sınıf, 2 halk; yetenek ağacı; 3 eşya derecesi (Standart gri, Nadir mavi, Eşsiz altın), sette 5 yetenek + 2 iksir savaşa girer.
- Dört bölge: **Vahran Ovası** (1–20), **Kül Geçidi** (20–40), **Kızıl Bahar Meydanı** (40–60), **Sisli Çukur** (60–65). Bosslar: Dev Solucan, Tepegöz, Kristal Muhafızı, Lav Yürek, **Kül Ağası Karadun**, **Mareşal Marven**, Adsız. Ana görev 64 adım.
- Sosyal: klanlar, hisar kuşatması ve ittifak, Başbuğ seçimi, ırk üstünlüğü ve bölge hâkimiyeti, PvP Meydan, Şan Divanı, sohbet, arkadaşlık, Sıralama.
- Yan etkinlik: balık tutma, Kader Çarkı, Nöbet, Dünya Baskını, Mini Dizi.
- Dil bütünlüğü: Türkçe seçiliyken her şey Türkçe, İngilizce seçiliyken her şey İngilizce.

**Görsel kimlik:** Tek parça **boyanmış sahneler** (ayrı sprite + boş zemin yok); sade, gerçekçi, **az altın**. Yaratıklar ve kahramanlar boyalı 2B (3 poz), düzlem kameraya döner; savaş yandan 3/4 görünüştür. Boyalı yetenek kartları, glifler ve sanat kitabı tokenleri (`kd-tokens.css`).

**Yayın kararları:** Play Store · ilk sürüm yerel kayıt · ilk sürümde gerçek para yok (önce kozmetik, sunucu gelince avantaj) · 2. sezon sonra.

---

## 3. Hikâye — *Vahran: Tarihin Külleri*

**I. İki Taht.** Arvath genç bir dünyayken dağın acısından ilk Ork doğdu; elinde çekiç vardı. Kragmir'in sözü: *"Toprak, çekice boyun eğer."* Doğuda insanların Elentha'sı yükselir: *"Çelik bile bir gün paslanır."* İkisinin arasında kana doymuş **Vahran Ovası** yatar; ortasında rünlü, çatlak **Taş Yemini** durur. Kragmir'de **Demirdiş Volgar** (kırık dişinin yerinde demir, çekici **Yerkıran**), Elentha'da genç **Kral Edran** ("savaşı kazanmak değil, bitirmek isterim") hüküm sürer. İkisi de aynı soruyu sorar: *Bunu kim başlattı?* Cevap: "Onlar."

**II. Kırılan Yemin.** Üç yüz yıl önce Kral **Dorrak** ile Kraliçe **Seraine** silahlarını taşın dibine bırakıp kanlarını karıştırarak barış yemini etti. Bir yıl sürdü. **Kızıl Ay** gecesi Elentha elçisi ork bıçağıyla ölü bulundu; ork kuyusuna insan işi mühürlü zehir şişesi atılmıştı. İki taraf birbirini suçladı, taş tam yemin rününden çatladı. Sisten, kül rengi cübbeli gölgeler seyretti. Savaş üç yüz yıl sürdü.

**III. Demirdiş.** Genç Volgar, babası **Ugrath**'ın ölümünü ovada gördü; bir mızrak zırh aralığından girmişti. Babasının "Sen yatma, oğul" sözü ve düşen dişinin yerine döktürdüğü demir ona adını verdi. Şaman **Yashka** rünleri attı: *"Savaşı başlatan el, ne ork ne insan."* Volgar izcilerine ork ya da insan gibi görünmeyen her şeyi gözlemelerini emretti; izcilerden biri genç **Thrak**'tı.

**IV. Sözün Bedeli.** Edran taç giydi; Mareşal **Marven** savaşı sürdürmesini söyledi ("Tarihi hayatta kalanlar yazar"). Edran ile kız kardeşi **Prenses Lira** arşivde, çift tabanlı sandıkta yarısı yanmış bir tutanak buldu: Kızıl Ay'da kül renkli yabancılar görülmüştü. Edran "ovaya inmeyeceksin" dedi; Lira iki gece sonra indi.

**V. Üçüncü El.** Lira ovada kül izini sürerken Thrak'la bıçak bıçağa geldi; ikisinde de aynı gri kül vardı. İzleri birlikte sürdüler: bir çukurda ateşsiz kazanın çevresinde kül cübbeliler, bir ork ve bir Elentha miğferini küle gömüyordu. İkisi iki saraya gidiyordu. Kanıt için tek yer kaldı: **Taş**.

**VI. Kızıl Bahar.** Elentha köyleri ork baltalarıyla, Kragmir maden kampı Elentha sancağıyla yakılıp basıldı. Marven bir baltayı kralın önüne attı; Volgar mavi sancağı ocağa fırlattı. Ordular Vahran'da çarpıştı, çiçek açmayan yıl **Kızıl Bahar** adını aldı. Savaşın ortasında iki kral göz göze geldi, on soluk bir adım atmadı; Marven'in muhafızı araya girdi. Gece kül gölgeleri ölüleri topladı: *"Savaş onların sofrası."*

**VII. Taşın Sırrı.** Thrak ile Lira taşın yosununu kazıdı. Rünler iki dilde şunu söylüyordu: *Konuğu öldüren el ork değildi; ork bıçağı tutuyordu. Kuyuyu zehirleyen el insan değildi. İkisi de aynı eldi: **Küllerin Tarikatı**. Yemini o kırdı. Taş gördü. Taş unutmadı.* Gece yarısı Marven taşın önüne geldi, tarikatla konuştu: iki kralı aynı gün, taşın önünde karşılaştıracak, biri düşse öteki halk yüz yıl affetmeyecekti. Thrak taştan bir parça kopardı.

**VIII. Tarihin Külleri.** Marven'in ayarladığı teke tek dövüşte Volgar ile Edran taşın gölgesinde karşılaştı. Lira ve Thrak aynı ata binmiş, "DURUN!" diye girdi; Thrak taş parçasını kralına uzattı. İki kral rünleri okudu, çekiç ve kılıç birlikte indi. Sonra kül yağdı ve dikilitaştan **Tarikat'ın lideri** çıktı: "Üç yüz yıl önce de umut tam böyleydi; bir gecede söndürmüştük." Marven'in otuz yıl önce kendini sattığını açıkladı. *"İkisi de tarihin külleri olacak"* sözünün bir beddua değil, **tarikatın duası** olduğunu söyledi; savaşın kini artık kendi başına yürüyecekti. İki ordunun içinden gri cübbeliler ayrıldı. Volgar ile Edran yan yana durdu: *"Çelik bile bir gün paslanır. Belki kin de."* — *"Toprak, çekice boyun eğer. Görelim, kül de eğer mi."* Taşın dibinde yeni bir rün belirmeye başladı; ne yazdığını kimse okumadı. Kül yağmaya devam etti.

**Oyuncunun yeri:** Oyuncu, bu sonun ardından başlayan **ilk sezonun** kahramanıdır. Halkını seçer, Thrak'ın/Lira'nın bıraktığı izleri sürer; bölgeler boyunca kül tarikatının kalıntılarını (Kül Ağası **Karadun**, Mareşal **Marven**, **Adsız**) yener ve taşın dibindeki rünün ne yazdığını okur.
