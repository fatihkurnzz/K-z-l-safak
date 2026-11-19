# DEMİR DİYARI · Görsel ve Arayüz Konsept Brifi
### "Vahran: Tarihin Külleri" hikâyesine dayalı, A'dan Z'ye yeniden tasarım

> **Bu belgeyi alan yapay zekâya:** Bu brif, var olan ve çalışan bir mobil RPG'nin bütün görsel kimliğini, arayüzünü ve savaş sunumunu yeniden tasarlaman içindir. Oyunun kodu, kuralları ve dengesi DEĞİŞMEYECEK; senden istenen görünüm, his ve kullanılabilir varlıklardır (görseller, arayüz parçaları, CSS temaları, ekran tasarımları, gerekirse 3B modeller). Hikâye metni ayrıca ekte: `VAHRAN_destan.txt`. Önce onu oku. Bütün oyun içi yazılar **Türkçe**dir.
>
> **Kalite çıtası:** Arkasında 100 kişilik bir stüdyo olan, mağazada öne çıkarılan premium bir mobil RPG. Her ekran "bitmiş ürün" gibi görünmeli: tutarlı ışık, tutarlı malzeme dili, cömert ama düzenli süsleme, okunaklı tipografi, akıcı geçişler.
>
> **Özgünlük:** Var olan hiçbir oyunun karakterini, logosunu, arayüzünü, haritasını ya da sanat eserini kopyalama, "benzerini" de yapma. Her şey bu dünyaya özgü olmalı.

---

## 0. Teslim edilecekler: Özet liste

| # | Teslim | Biçim |
|---|---|---|
| 1 | Sanat yönergesi (1 sayfa): renk, malzeme, ışık, şekil dili | PNG/JPEG pano + kısa metin |
| 2 | Arayüz kiti (UI kit): çerçeveler, düğmeler, sekmeler, çubuklar, rozetler, simge seti | Saydam PNG (+ 9-dilim ölçüleri) |
| 3 | Ekran tasarımları (Bölüm 7deki her ekran) | 2340×1080 ve 1440×1080 PNG maket |
| 4 | Tema CSS'i (renk/yazı değişkenleri ve bileşen stilleri) | Tek `.css` dosyası, düz CSS |
| 5 | Arka planlar ve sahne görselleri (açılış, bölgeler, şehirler) | JPEG/WebP |
| 6 | Karakter ve yaratık konsept çizimleri / portreleri | PNG/WebP |
| 7 | Eşya ve yetenek simgeleri | Saydam PNG, 256×256 |
| 8 | Savaş efektleri için doku ve sprite sayfaları | Saydam PNG |
| 9 | (İsteğe bağlı) 3B karakter, silah ve sahne modelleri | GLB (Bölüm 11) |
| 10 | `MANIFEST.md`: her dosya nereye ve ne için | Metin |

---

## 1. Oyunun kısa tanımı (tasarımı bağlayan gerçekler)

- **Tür:** Sıra tabanlı savaşlı, karakter gelişimli, klan ve PvP'li 3B mobil RPG. Tarayıcıda çalışır (three.js), telefon ve masaüstünde açılır.
- **Ekran yönü:** **YALNIZCA YATAY** (landscape). Telefon dik tutulsa bile oyun yatay çizilir. Bütün tasarımlar 16:9 yatay; 19.5:9 / 20:9 telefonlarda kenarlara taşma ve çentik güvenli alanı düşünülmeli.
- **İki halk (oyuncu birini seçer):**
  - **Kragmir:** Orklar, dağın içindeki demir krallığı. Sözleri: *"Toprak, çekice boyun eğer."*
  - **Elentha:** İnsanlar, beyaz taştan kuleler ve mavi sancaklar krallığı. Sözleri: *"Çelik bile bir gün paslanır."*
- **Dört sınıf** (her iki halkta da var; görünüm halka göre değişir):

| Sınıf | Rol | Silahlar | Zırh | Yetenek dalları |
|---|---|---|---|---|
| Savaşçı | Ön hat, tank / ağır vuruş | kılıç, iki elli balta, kalkan | plaka | Hücum · Siper · Öfke |
| Suikastçı | Hız, tek hedef hasarı | hançer, yay | deri | Hançer · Yay · İz |
| Şifacı | Şifa, rün mührü, kara rün | gürz, kalkan | zincir | Şifa · Rün Mührü · Kara Rün |
| Büyücü | Alan hasarı, kontrol | asa | cübbe | Ateş · Buz · Yıldırım |

- **Bölgeler (ilerleme sırası):** Vahran Ovası (Sv 1–20, çayır/orman) → Kül Geçidi (20–40, kale) → Kızıl Bahar Meydanı (40–60, savaş meydanı/arena) → Sisli Çukur (60–65, tapınak/kutsal alan). Ayrıca mezarlık türü zindanlar. Her bölgede 25 aşama var, her 5 aşamada bir "kapı" (boss) çıkar.
- **Öne çıkan bosslar:** Dev Solucan, Tepegöz, Kristal Muhafızı, Lav Yürek, Kül Ağası Karadun, Mareşal Marven, **Adsız, Tarikat Lideri** (son boss).
- **Savaş:** Sıra tabanlı ve belirlenimci. Takımlar karşılıklı dizilir, sırayla yetenek kullanılır. Ateş, buz ve yıldırım elementleri, durum etkileri (sersemletme, yanma vb.), kritik vuruş ve mana vardır.
- **Diğer sistemler:** Klan, Hisar (kale kuşatması), PvP / Meydan (arena), Baskın, Zindan, Nöbet, Balıkçılık, Çarşı ve Karaborsa, Sandık açma, Mağaza, Günlük görevler ve Ana görev, Rütbe, Parti, Sosyal / Sohbet, Rehber, Öğretici, Duyurular, Kaplamalar (görünüm), Mini dizi ve Fragman (hikâye videoları).

---

## 2. Yaratıcı vizyon: **"KÜL VE DEMİR"**

> Üç yüz yıllık bir savaşın ortasında, iki halkın da göremediği üçüncü bir el var. Oyunun bütün görselliği bu gerilim üzerine kurulur: **iki canlı renk dünyası** ve onları sessizce **griye çeviren kül.**

### Üç görsel temel ilke

1. **İki dünya, tek ova.** Kragmir sıcak, ağır, el yapımıdır: kara demir, ocak koru, perçin, oyulmuş kaya, kemik rünler. Elentha soğuk, zarif, ölçülüdür: ak mermer, lacivert mine, altın telkari, cilalı çelik. Oyuncunun seçtiği halk arayüzün **kendi temasını** belirler. İki tema aynı yerleşimi paylaşır, malzemesi farklıdır.
2. **Kül: üçüncü el.** Küllerin Tarikatı göründüğünde renk çekilir: doygunluk düşer, ince gri kül zerreleri yağar, kenarlarda sönmekte olan kor ışıkları kalır. Kül, oyunun "tehlike" ve "gizem" dilidir. Tarikat düşmanları, son bölgeler ve hikâye anları bu dili kullanır. **Kural:** Kül asla neşeli bir öğe olarak kullanılmaz.
3. **Taş unutmaz.** Çatlak dikilitaş oyunun simgesidir. Çatlak çizgisi arayüzde **ayraç** motifidir (bölüm ayraçları, sekme altları, yükleme çubuğu). Rünler ilerlemeyi anlatır: bir şey tamamlandıkça rün "taşın içinden büyür" gibi belirir (kazınmış değil, yumuşak kenarlı ve içten ışıklı).

### Duygu sözlüğü
Ağır, kadim, yaralı, onurlu, umutlu ama bedelli. **Değil:** sevimli, şeker renkli, çizgi film neşesi, aşırı neon, bilimkurgu.

### Sanat stili
- **Stilize, elle boyanmış görünümlü 3B / 2.5B.** Fotogerçekçi değil, çocuksu da değil. Kalın, küçük boyda bile okunan siluetler; abartılı ama inandırıcı oranlar (orklar çok iri omuzlu, insanlar daha ince ve uzun).
- Işık: sinematik, tek yönlü sıcak ana ışık + soğuk dolgu. Kenar ışığı (rim light) karakterleri arka plandan ayırır.
- Doku: boyanmış kenar aşınmaları, metalde ince çizik, kumaşta belirgin dokuma. Gürültülü fotoğraf dokusu yok.
- Kompozisyon: arayüz panelleri sahneyi örtmez; 3B sahne ekranın kalbidir, arayüz çerçevesi onu sarar.

---

## 3. Renk sistemi

### 3.1 Ortak temel (iki temada da)
| Ad | Hex | Kullanım |
|---|---|---|
| Gece Taşı | `#0E0B10` | En koyu zemin |
| Kömür | `#1A1519` | Panel zemini |
| İs | `#2A2328` | Kart / ikinci yüzey |
| Kemik | `#E9E1D3` | Ana metin (koyu zemin üstü) |
| Kül Grisi | `#8D8790` | İkincil metin, pasif |
| Kül Açık | `#BFB9BE` | Kül zerresi, sis |
| Sönen Kor | `#C2471E` | Tarikat gözleri, tehlike vurgusu |
| Kan | `#9E1B1B` | Hasar, can kaybı |
| Şifa | `#5FCB7A` | Can kazanımı |
| Mana | `#3E8EF0` | Mana çubuğu |
| Altın | `#E2B44E` | Para, ödül, önemli düğme kenarı |

### 3.2 Kragmir teması (Ork)
| Ad | Hex |
|---|---|
| Kara Demir | `#2B2622` |
| Dövme Demir | `#4A423B` |
| Ocak Koru | `#FF7A1A` |
| Erimiş Demir | `#FFB347` |
| Pas | `#8A3B1E` |
| Kızıl Toprak | `#6E1F14` |
| Kemik Rün | `#D9C9A3` |

Malzeme: kalın demir levhalar, köşelerde perçin, kenarlarda içten yanan turuncu kor çizgisi. Düğmeler dövülmüş metal plaka gibi; basılınca kıvılcım çıkar. Süs: diş, boynuz, kemik rün, zincir.

### 3.3 Elentha teması (İnsan)
| Ad | Hex |
|---|---|
| Ak Mermer | `#EDEAE3` |
| Gümüş Çelik | `#AEB8C4` |
| Kraliyet Laciverti | `#1C3C9C` |
| Gök Mine | `#3E7BE0` |
| Gece Mavisi | `#0F1A3A` |
| Telkari Altın | `#D9B04A` |
| Sancak Beyazı | `#F7F5EF` |

Malzeme: koyu lacivert zemin üstünde mermer ve gümüş çerçeve, altın telkari köşeler, mavi mine kakma. Düğmeler cilalı plaka gibi; basılınca ışık süzülür. Süs: kanat, kalkan arması, defne, kule silueti.

### 3.4 Nadirlik renkleri (eşyalar)
| Nadirlik | Hex | Çerçeve dili |
|---|---|---|
| Sıradan | `#9A9A9A` | düz demir |
| Seçkin | `#4FBF5A` | ince yeşil kenar |
| Nadir | `#3E8EF0` | mavi kenar + hafif parıltı |
| Destansı | `#A65BF0` | mor kenar + köşe süsü |
| Efsanevi | `#F0A030` | altın-turuncu, dönen ışık |
| Kadim (en üst) | `#E8473B` | kızıl, kenarda rün yazısı, kül zerresi |

### 3.5 Element renkleri
Ateş `#FF6A1F` · Buz `#7FD6FF` · Yıldırım `#FFE35A` · Şifa `#8CF0A0` · Rün Mührü (kutsal) `#FFD98A` · Kara Rün `#7A3BB8` + kül grisi.

> **Erişilebilirlik:** Metin ile zemin arasındaki kontrast en az 4.5:1 olmalı. Can, mana ve nadirlik bilgisi yalnızca renkle değil, simge ya da şekille de ayırt edilebilmeli.

---

## 4. Tipografi

- **Başlık (display):** Cinzel 700/900, oyunda zaten gömülü. Taş yazıt hissi verir. Logo, ekran başlıkları, boss adları, sonuç ekranı.
- **Gövde:** Inter 400/600/800, oyunda zaten gömülü. Bütün okunacak metin, sayılar, düğmeler.
- Başka bir yazı tipi önerirsen: **OFL lisanslı** olmalı, **Türkçe harfleri tam desteklemeli** (ğ Ğ ş Ş ı İ ö Ö ü Ü ç Ç) ve `woff2` olarak teslim edilmeli. Cinzel yalnızca büyük harf ağırlıklıdır: "İ" ve "ı" ayrımı başlıklarda bozulmamalı. Bunu örnekle göster.
- **Yazı boyutları ve bütün ölçüler için `YERLESIM_SPEC.md` geçerlidir** (Bölüm 7: tipografi, Bölüm 6: bileşenler). Kısaca, 1080 dp yükseklik referansında: gövde 38, küçük 34, başlıklar 42–72 dp, dokunma hedefi en az 120 dp. Yatay telefon yalnızca ~390 px yüksekliğinde olduğu için bu değerler büyük görünse de telefonda okunur boyuta karşılık gelir.
- Sayılar (hasar, para) tabular figürlü ve kalın; hasar sayısı Cinzel değil Inter 800 + koyu kontur.

---

## 5. Logo ve marka

- Oyun adı: **DEMİR DİYARI**. Alt başlık / ilk sezon: **Vahran: Tarihin Külleri**.
- Logo fikri: Ortasından çatlamış bir dikilitaş. Çatlağın bir yanında ork çekici (Yerkıran), öte yanında insan kılıcı; çatlaktan kül ve tek bir kor kıvılcımı yükselir. Yazı Cinzel tabanlı, özel çizilmiş, metal-taş karışımı.
- Teslim: Saydam PNG; yatay logo (2048 px genişlik), kare simge 1024×1024, uygulama simgesi (512, 192 ve kenarları maskelenebilir 512 sürümü), küçük favicon (64).

---

## 6. Arayüz kiti (UI Kit)

Her bileşen **iki temada** (Kragmir / Elentha) ve şu durumlarda istenir: normal · basılı · pasif · seçili · uyarı/bildirim noktası.

1. **Panel / pencere çerçevesi:** Büyük, orta ve küçük boy. Kenarları **9-dilim** (9-slice) kesilebilir olmalı; dilim ölçülerini `MANIFEST.md`'ye yaz (örn. `kenar: 48px`).
2. **Düğmeler:** Birincil (altın / kor), ikincil, tehlike (kızıl), yuvarlak simge düğmesi, kapat (X), geri.
3. **Sekme çubuğu:** Yatay ve dikey. Seçili sekmenin altında **çatlak çizgisi** motifi.
4. **Çubuklar:** Can, mana, XP, ilerleme, yükleme. Can çubuğunda hasar alınınca beyaz "gecikmeli düşüş" katmanı olmalı.
5. **Kaynak sayaçları:** Altın, elmas/premium, enerji, rütbe puanı. Simge + sayı + "+" düğmesi.
6. **Kartlar:** Eşya yuvası (nadirlik çerçeveleri), karakter kartı, görev kartı, klan kartı, ödül kartı.
7. **Rozetler:** Seviye, yıldız (1–3), kilit, yeni (kırmızı nokta), sayı rozeti.
8. **Bildirim / toast, onay kutusu, açılır pencere (modal), alttan çıkan sayfa.**
9. **Ayraçlar:** Çatlak taş çizgisi, rün dizisi, demir zincir (Kragmir), telkari şerit (Elentha).
10. **Simge seti:** En az 60 simge, tek çizgi kalınlığında, aynı ışık yönünde. Menü öğeleri (çanta, harita, klan, arena, görev, mağaza, ayarlar, sohbet, posta, sıralama, sandık, balık, hisar, zindan, baskın, nöbet, karaborsa, rehber), nitelikler (güç, dayanıklılık, çeviklik, zekâ, mana), elementler, durum etkileri.
11. **Sohbet balonu, isim plakası** (oyuncu, NPC, boss), **hasar sayısı** stilleri (normal, kritik, şifa, ıska, bağışık).

**Mikro-etkileşim notları** (kodla uygulanacak, sen tarif et ya da CSS ile ver): düğmeye basınca %96 küçülme + 80 ms, panel açılışı 180 ms ease-out ölçek + saydamlık, ödülde ışın patlaması, rün belirmesinde içten dışa ışık dolması.

---

## 7. Ekranlar: Tek tek istenenler

Her ekran için **2340 × 1080 dp** (telefon) maket + **1440 × 1080 dp** (tablet) uyarlaması. Bölge, konum ve ölçüler `YERLESIM_SPEC.md` Bölüm 8'e uymalı. Her maketin yanına 3–5 satırlık "neden böyle" notu ekle.

### 7.1 Açılış ve giriş
- **Açılış (splash):** Kararmış ova, ortada çatlak taş, yavaşça yağan kül; logo yukarıdan kül dağılarak belirir.
- **Yükleme ekranı:** Tam ekran sahne görseli + altta çatlak biçimli yükleme çubuğu + dönen "ipucu / hikâye cümlesi" (destandan alıntılar).
- **Giriş / sunucu seçimi:** Sade; sunucu kartlarında doluluk durumu.

### 7.2 Karakter oluşturma (en önemli ilk izlenim)
- Ekran ikiye bölünmüş: **solda Kragmir** (sıcak ocak ışığı), **sağda Elentha** (soğuk sabah ışığı), ortada çatlak taş. Halk seçilince o taraf genişler ve ekranı kaplar.
- Sınıf seçimi: 4 büyük kart; seçilen sınıfın karakteri 3B olarak dönebilir sahnede, kısa yetenek önizlemesi ile.
- Görünüm: ten, saç, yüz, renk; isim kutusu.
- Halk seçiminin altında hikâyeden tek cümlelik slogan.

### 7.3 Ana merkez (Hub / Şehir)
- Oyuncunun halkının başkenti: **Kragmir dağ salonu** (örsler, körük, lav kanalları) ya da **Elentha beyaz kule meydanı** (çeşme, sancaklar).
- Düzen: Üst şerit: portre + seviye + kaynaklar. Sol: görev izleyici + etkinlik afişleri. Sağ: ana menü simgeleri dikey ya da yay biçiminde. Alt orta: büyük **"SAVAŞ / MACERA"** düğmesi. Alt şerit: çanta, karakter, yetenek, klan, mağaza.
- Arka plandaki 3B şehir canlı olmalı: duman, sancak dalgalanması, yürüyen NPC'ler.

### 7.4 Dünya haritası ve bölge seçimi
- Elle çizilmiş eski parşömen harita: batıda Kragmir dağları, doğuda Elentha, ortada Vahran Ovası ve ortasında çatlak taş.
- Bölgeler yol üzerinde düğüm düğüm. Açılmamış bölgeler küllü ve griye boğulmuş; açıldıkça renk geri gelir. **Bu, ana ilerleme metaforudur.**
- Bölge içinde 25 aşama: taş basamaklar / rün düğümleri; her 5. aşama büyük "kapı" simgesi (boss portresi).

### 7.5 Savaş öncesi (VS ekranı)
- Ekran çapraz bölünür; sol takım ve sağ düşman portreleri, ortada çatlak biçimli "VS" yazısı. Güç karşılaştırması, önerilen güç, element zayıflıkları simgeleri. Düğmeler: "Başla" ve "Otomatik".

### 7.6 Savaş arayüzü (HUD): **en çok emek istenen ekran**
- 3B sahne merkezde. Oyuncu takımı **solda**, düşmanlar **sağda**, kamera hafif yandan ve yukarıdan.
- **Sıra şeridi** üstte: kimin sırası olduğunu gösteren portre dizisi (Elentha'da mine madalyonlar, Kragmir'de demir pullar).
- Her birimin üstünde ince can ve mana çubuğu + durum etkisi simgeleri.
- **Alt sağ: yetenek düğmeleri.** 3–4 büyük yuvarlak yetenek + temel saldırı; bekleme süresi saat yönünde karartma ile, mana yetmiyorsa mavi çatlak kaplama.
- Alt sol: iksir / eşya hızlı yuvaları. Üst sağ: hız (1x/2x/3x), otomatik, duraklat.
- **Geri bildirim:** Vuruşta kısa ekran sarsıntısı + kare dondurma (hit-stop, 40–60 ms). Kritikte büyük, eğik sayı + parlama. Element vuruşunda element rengi kıvılcım. Boss'un can çubuğu ekranın üstünde geniş, çok katmanlı ve evreli.
- **Tarikat düşmanları sahneye girince** ortam doygunluğu düşer, ince kül yağışı başlar, onların vuruşları gri-kor renktedir.
- Sonuç: **Zafer:** altın ışınlar, yıldız derecelendirmesi, ganimet kartları birer birer döner. **Yenilgi:** kül dağılması, "Güçlen" önerileri (yetenek, eşya, seviye).

### 7.7 Karakter, envanter, eşya
- Sol: 3B karakter (döndürülebilir). Çevresinde eşya yuvaları (silah, kalkan, miğfer, göğüs, eldiven, çizme, takı). Sağ: çanta ızgarası + filtreler. Alt: nitelikler (güç, dayanıklılık, çeviklik, zekâ, mana) ve dağıtılabilir puan.
- Eşya ayrıntı kartı: büyük simge, nadirlik çerçevesi, değerler, karşılaştırma (yeşil ↑ / kırmızı ↓), "Kuşan", "Güçlendir", "Sat" düğmeleri.

### 7.8 Yetenek ağacı
- Her sınıfın 3 dalı **bir taşın üç yüzü** gibi: dikey rün sütunları. Açılan düğüm taşın içinden ışıkla belirir, kilitli olan silik kazıntı. Sınıflara göre ana renk: Savaşçı kızıl-demir, Suikastçı gece moru-yeşil, Şifacı altın-krem, Büyücü element renkleri.

### 7.9 Görevler ve hikâye
- **Ana görev:** Destanın 8 bölümü ("İki Taht", "Kırılan Yemin", "Demirdiş", "Sözün Bedeli", "Üçüncü El", "Kızıl Bahar", "Taşın Sırrı", "Tarihin Külleri") birer kitap bölümü kartı. Her biri bir illüstrasyon ve bir alıntı ile.
- **Günlük / haftalık görevler:** Liste + ilerleme çubuğu + ödül sandıkları zinciri.
- **Diyalog ekranı:** Alt kısımda konuşma kutusu, iki yanda büyük karakter portreleri (konuşan aydınlık, susan karanlık). Hikâye karakterleri: Volgar, Edran, Lira, Thrak, Yashka, Marven, Adsız.

### 7.10 Klan ve Hisar
- Klan salonu: sancak (klan arması düzenleyici: şekil, renk, simge), üye listesi, rütbeler, bağış, klan sohbeti.
- **Hisar kuşatması:** Kuşbakışı kale haritası, kapılar ve kuleler, saldırı/savunma yerleşimi, zamanlayıcı. Klan sancakları kalenin üstünde.

### 7.11 PvP / Meydan (Arena) ve Rütbe
- Kızıl Bahar Meydanı temalı arena: lig rozetleri (demir → bronz → gümüş → altın → kor → kül taşı gibi bu dünyaya özgü adlar), sezon ödül şeridi, rakip kartları, sıralama tablosu.

### 7.12 Zindan, Baskın, Nöbet
- **Zindan:** Mezarlık ve tapınak girişleri, kat seçimi, kalan hak.
- **Baskın:** Çok oyunculu dev boss kartı, katılımcı listesi, ortak can çubuğu.
- **Nöbet:** Dalga dalga savunma; dalga sayacı ve kale canı.

### 7.13 Ekonomi ekranları
- **Çarşı:** Tezgâhlı pazar sahnesi, satıcı NPC portresi, eşya ızgarası.
- **Karaborsa:** Aynı düzen ama karanlık, mum ışıklı, kül kenarlı; "gizli tüccar" hissi.
- **Sandık açma:** Sandık sahnenin ortasında sarsılır, kapak patlar, ışık sütunu nadirlik rengine bürünür. En nadir eşyada kül ve kor girdabı.
- **Mağaza:** Paketler, premium para, günlük teklif. Abartısız, oyunun asaletini bozmayan, temiz bir vitrin.

### 7.14 Balıkçılık
- Huzurlu mola modu: Vahran'da bir dere kenarı, sakin müzik hissi. Olta gerginlik çubuğu, yakalanan balık kartı, balık ansiklopedisi.

### 7.15 Sosyal ve yardımcı ekranlar
- Sohbet (dünya, klan, parti, özel), arkadaş listesi, parti kurma, posta, duyurular (afiş + metin), rehber (sözlük), öğretici (vurgu halkası + el işareti + kısa balon), ayarlar (grafik kalitesi, ses, dil, erişilebilirlik), destek/rapor.

### 7.16 Kaplamalar (görünüm mağazası) ve Mini dizi
- Karakter 3B önizleme + kaplama ızgarası. Mini dizi / fragman: bölüm kartları (10 bölüm), oynat düğmesi, izlenmiş işareti.

---

## 8. Karakterler: Görünüm tarifleri

### 8.1 Oynanabilir halk × sınıf (8 görünüm)
| | Kragmir (Ork) | Elentha (İnsan) |
|---|---|---|
| **Savaşçı** | Boynuzlu miğfer, kara-kızıl plaka, altın perçin, iki elli balta; omuzda zincir | Ak çelik şövalye, lacivert pelerin, altın kenar, kılıç-kalkan; kalkanda kule arması |
| **Suikastçı** | Kapüşonlu, koyu pas rengi deri, kemik muskalar, iki hançer, sırtta kısa yay | Gece mavisi deri, gümüş tokalar, yüz örtüsü, ince uzun yay (Lira'dan esinli) |
| **Şifacı** | Kemik ve deri şaman giysisi, boyalı yüz, rünlü gürz, is kokan torba (Yashka geleneği) | Krem-ak cübbe, kızıl kenar, altın rün mührü, gürz ve küçük kalkan |
| **Büyücü** | Kızıl-turuncu cübbe, kömür kenar, sivri şapka, lav damarlı asa | Lacivert-gümüş cübbe, yıldız işlemeli, kristal uçlu asa |

Ork derisi yeşil-gri; insan ten tonları geniş bir yelpazede. Her sınıfın siluetinin **20 px yükseklikte bile** ayırt edilebilmesi gerekir.

### 8.2 Hikâye karakterleri (portre + tam boy konsept)
- **Demirdiş Volgar:** Ork kralı. Çok iri, az konuşan, alt çenesinde **donuk demir diş**. Omzunda **Yerkıran** çekici (atadan kalma, kaya-demir başlı, rünlü sap). Gözlerinde öfkeden çok yas.
- **Kral Edran:** Genç insan kralı. Seyrek sakal, yaşından ağır bakış, ak zırh, babasından kalma ağır pelerin. Kılıcı çoğu zaman indirili.
- **Prenses Lira:** Sıkı örgülü saç, binici çizmesi, yay ve hançer; prensesten çok izci. Meraklı, hızlı.
- **Thrak:** Genç ork izci. Yeşil-gri deri, sivri kulak, alt dişleri yeni uzuyor; boynunda kül dolu deri kese.
- **Şaman Yashka:** Çok yaşlı ork kadın şaman. Bir gözü süt beyazı, kemik rün torbası, is ve duman.
- **Mareşal Marven:** Kırlaşmış saç, rüzgârla oyulmuş yüz, kusursuz zırh, omzunda mareşal nişanı. İlk bakışta güven veren, sonra soğuk.
- **Adsız, Tarikat Lideri:** Uzun, yere sürünen kül cübbe; başlığın altında yüz yok, yalnızca gölge ve uzakta sönen **iki kor göz**. Yürümez, süzülür; ot üzerinde iz bırakmaz. Etrafında sürekli ince kül yağar.
- **Küllerin Tarikatı üyeleri:** Kül rengi cübbeler, yüzsüz başlıklar, ateşsiz kazan. Sesleri kuru yaprak hışırtısı gibi.

### 8.3 Yaratıklar ve bosslar
Her bölgenin yaratıkları bölgenin malzemesinden "doğmuş" gibi görünmeli. Ova: kurt, yaban domuzu, eski savaş artığı hortlaklar. Kül Geçidi: taş ve demir varlıklar. Kızıl Bahar: savaş ruhları, zırhlı ölüler. Sisli Çukur: Tarikat ve kül yaratıkları. Bosslar (Dev Solucan, Tepegöz, Kristal Muhafızı, Lav Yürek, Kül Ağası Karadun, Mareşal Marven, Adsız) için birer **tam boy konsept + savaş portresi + boss kartı** çiz.

---

## 9. Ortamlar (bölge sahneleri)

| Bölge | Ruh hâli | Anahtar öğeler | Işık |
|---|---|---|---|
| Vahran Ovası | Güzel ama yaralı | Deniz gibi dalgalanan uzun ot, altında paslı miğferler; ortada çatlak dikilitaş | Altın saat, uzun gölgeler |
| Kül Geçidi | Sıkışmış, tehditkâr | Dar kaya geçidi, yıkık kale surları, yerde kül tabakası | Soğuk gri gün, kor kıvılcımları |
| Kızıl Bahar Meydanı | Destansı, kanlı | Çiçek açmayan, çamur-demir ova; kırık sancaklar, mızrak ormanı | Kızıl şafak, sis |
| Sisli Çukur | Ürkünç, kutsal | Kemik dolu çukur, ateşsiz kazan, rün taşları | Ay ışığı + sönen kor |
| Kragmir başkenti | Sıcak, gürültülü | Dağ içi salon, örsler, lav kanalları, kaya taht | Turuncu ocak ışığı |
| Elentha başkenti | Ferah, gururlu | Beyaz kuleler, mavi sancaklar, mermer basamak | Berrak sabah ışığı |
| Mezarlık zindanları | Kasvetli | Mezar taşları, eğri ağaçlar, mum | Mor-mavi gece |

Her bölge için: **1 geniş sahne konsepti** (yükleme ekranı olarak da kullanılır) + **savaş arka planı** (karakterlerin duracağı orta zemin boş, ön ve arka katman ayrılabilir).

---

## 10. Savaş görsel efektleri (VFX)

- **Yetenek dalı başına bir imza efekt.** Hücum (kızıl kesik), Siper (demir kalkan halkası), Öfke (kor buharı), Hançer (çift parlak iz), Yay (ok izi + rüzgâr), İz (gölge adımı), Şifa (yeşil-altın yaprak), Rün Mührü (yere inen altın rün dairesi), Kara Rün (mor-gri lanet zinciri), Ateş (lav topu, yanma), Buz (kristal mızrak, donma kabuğu), Yıldırım (zincir şimşek).
- Her efekt için: çıkış (cast), mermi/hareket, çarpma, kalıcı durum ayrı parçalar.
- Sprite sayfası: saydam PNG, 8×8 ya da 4×4 kare ızgara, kare boyu 256 px. Her sayfanın kare sayısını ve fps'ini yaz.
- Mobil performans: Aynı anda en fazla ~150 parçacık, yarı saydam katman üst üste binmesi az. Efektler **parlak + kısa** (0.3–0.8 sn) olsun.

---

## 11. Teknik teslim kuralları (UYULMASI ZORUNLU)

Bu kurallara uymayan dosya oyuna eklenemez ya da oyunun paylaşılmasını engeller.

1. **Görsel biçimleri:** Yalnızca **PNG, JPEG, WebP** (gerekirse GIF). **AVIF, BMP, TGA, TIFF, PSD kullanma.** Kesinlikle **SVG kullanma**; vektör çizdiysen PNG'ye çevir (1x ve 2x).
2. **Boyut bütçesi:** Arayüz parçası ≤ 150 KB, arka plan ≤ 400 KB (JPEG/WebP, 1920×1080), simge ≤ 40 KB. Bütün paket mümkünse ≤ 25 MB.
3. **Çözünürlük:** Arayüz parçaları 2x çizilsin (1080p ekranda net). Simgeler 256×256, eşya simgeleri kare ve ortalanmış, 16 px iç boşluklu.
4. **Saydamlık:** Gerçek alfa kanalı kullan. Arkası "dama tahtası desenli" sahte saydamlık OLMASIN.
5. **3B modeller (isteğe bağlı):** `.glb` (glTF 2.0). Karakter ≤ 12.000 üçgen, silah ≤ 3.000, doku en fazla 1024×1024 PNG/WebP (KTX2/Draco/meshopt sıkıştırması KULLANMA). Karakterler insansı standart iskelet, T-poz. Animasyon adları: `idle, run, attack, cast, cast2, combat_idle, death, hit, shoot, special, victory`. Y ekseni yukarı, metre ölçeği, ayak tabanı orijinde.
6. **CSS:** Düz CSS (framework yok: Tailwind/Bootstrap yok). Dış bağlantı yok (Google Fonts, CDN yok); yazı tipleri yerel `woff2`. Bütün renkler `:root` altında CSS değişkeni olsun. Tema seçimi `html[data-faction="kragmir"]` ve `html[data-faction="elentha"]` ile.
7. **Kod yazarsan:** Vanilla JavaScript ES modülleri. Harici kütüphane ve ağ isteği yok. Oyunun kuralları, sayıları ve kayıt yapısı değiştirilmez; yalnızca sunum.
8. **Dosya adları:** Küçük harf, Türkçe karakter ve boşluk yok, tire ile: `panel-buyuk-kragmir.png`, `simge-canta.png`, `bg-vahran-ovasi.jpg`.
9. **Klasör düzeni:**
   ```
   teslim/
     MANIFEST.md
     tema/        tema.css, fonts/
     ui/kragmir/  ui/elentha/  ui/ortak/
     simge/       menü, nitelik, element, durum simgeleri
     esya/        eşya simgeleri
     yetenek/     yetenek simgeleri
     bg/          arka planlar ve yükleme görselleri
     portre/      karakter ve boss portreleri
     konsept/     konsept panoları (yalnızca referans)
     maket/       ekran maketleri (yalnızca referans)
     vfx/         sprite sayfaları
     model/       .glb dosyaları
     logo/
   ```
10. **MANIFEST.md:** Her dosya için: yol, ne olduğu, hangi ekranda kullanılacağı, boyut, 9-dilim kenar ölçüsü (varsa), sprite kare sayısı ve fps (varsa).
11. **Lisans:** Her şey özgün ya da açık lisanslı olmalı; kullanılan hazır kaynakları (yazı tipi, doku) lisansıyla birlikte `MANIFEST.md`'de listele.

---

## 12. Çalışma sırası (önerilen)

1. **Sanat yönergesi panosu** ve iki temanın birer örnek paneli + düğmesi. Burada onay alınır.
2. Arayüz kiti (iki tema) + simge seti.
3. Ana merkez, karakter oluşturma ve savaş HUD maketleri (en kritik üç ekran).
4. Geri kalan ekranlar.
5. Arka planlar, portreler, eşya ve yetenek simgeleri.
6. VFX sayfaları, (isteğe bağlı) 3B modeller.
7. Tema CSS'i ve MANIFEST.

Her adımı ayrı paket olarak teslim edebilirsin; her paket kendi `MANIFEST.md`'sini taşısın.

---

## 13. Görsel üretim için hazır istemler (image prompt)

Görsel üretici yapay zekâlar için İngilizce taban istem. Her istemin sonuna ilgili konuyu ekle.

**Ortak stil eki:**
`stylized hand-painted 3D fantasy art, premium mobile RPG quality, bold readable silhouettes, cinematic warm key light with cool fill and rim light, painterly textures with worn edges, rich but controlled detail, no text, no watermark, original design`

- **Kragmir arayüz:** `game UI panel frame, forged black iron plates with rivets, glowing molten orange ember seams, carved bone rune details, chains, isolated on transparent background, front view, symmetrical` + ortak ek
- **Elentha arayüz:** `game UI panel frame, white marble and polished silver with gold filigree corners and deep royal blue enamel inlay, elegant knightly heraldry, isolated on transparent background, front view, symmetrical` + ortak ek
- **Vahran Ovası:** `vast windswept plain of tall golden grass waving like a sea, rusted helmets and broken spear tips hidden in the grass, a huge black runic obelisk cracked from top to bottom in the center, golden hour, long shadows, faint ash drifting` + ortak ek
- **Adsız, Tarikat Lideri:** `tall faceless figure in a floor-length ash-grey robe, deep hood with only shadow inside and two dying ember eyes, floating slightly above the grass, ash falling around it, desaturated palette with ember accents, ominous` + ortak ek
- **Volgar:** `massive broad-shouldered orc king, green-grey skin, single dull iron tooth in lower jaw, heavy ancestral rune-carved stone-and-iron warhammer on shoulder, black and crimson plate armor, eyes full of grief rather than rage, mountain forge hall background` + ortak ek
- **Edran:** `young human king with sparse beard and eyes older than his age, white steel armor, heavy royal blue cloak, sword held lowered, white stone tower city background in clear morning light` + ortak ek

---

## 14. Kabul ölçütleri (bitti saymak için)

- [ ] İki tema yan yana konduğunda aynı oyunun iki yüzü gibi görünüyor, yerleşim aynı.
- [ ] Savaş HUD'u telefonda (yatay) başparmakla rahat oynanabiliyor; dokunma hedefleri ≥ 44 pt.
- [ ] Her ekranda en önemli eylem 1 saniyede bulunuyor.
- [ ] Kül dili yalnızca Tarikat, tehlike ve gizem için kullanılmış.
- [ ] Bütün Türkçe karakterler (özellikle İ/ı, Ğ/ğ, Ş/ş) düzgün görünüyor.
- [ ] Bölüm 11'deki biçim ve boyut kurallarına uyulmuş, MANIFEST eksiksiz.
- [ ] Hiçbir öğe var olan bir oyundan kopya ya da onun benzeri değil.

---

*Ek: `VAHRAN_destan.txt` (tam hikâye metni). Hikâyedeki sözler, yerler ve karakterler bu brifteki tasarımların kaynağıdır; çelişki olursa hikâye esastır.*
