# Demir Diyarı — Müzik ve Ses İsteği (Gemini için)

**Oyun:** Demir Diyarı · Hikâye: *Vahran: Tarihin Külleri*. Tarayıcıda, telefonda yatay oynanan 3B fantastik RPG. Savaş sıra tabanlı.
**Görsel kimlik:** "KÜL VE DEMİR". Karanlık, ağırbaşlı, gerçekçi. Abartılı Hollywood kahramanlığı ya da çizgi film neşesi istemiyoruz.
**İki halk:**
- **Kragmir (orklar, kod `ocak`):** kara demir, kor, ocak dumanı, dağ kalesi. Ses dili: deri davullar, kalın telli çalgılar, gırtlak şarkısı (throat singing), alçak dem (drone), örs ve zincir. Ritim ağır, 6/8 ya da aksak.
- **Elentha (insanlar, kod `sancak`):** ak mermer, lacivert, altın, sancaklar, deniz rüzgârı. Ses dili: kaval ya da flüt, ince tel (lavta, arp), boru çağrısı, sözsüz koro, açık beşliler. Ritim 4/4, daha aydınlık ama hüzünlü.
- **Küllerin Tarikatı (düşman, tehlike):** kül, sis, çatlak dikilitaş. Uyumsuz alçak sesler, fısıltılı sözsüz koro, metal sürtünmesi.

**Mevcut tema:** "Kızıl Göz" (Under the Crimson Eye, 157 sn) şehirlerde ve fragmanda çalıyor; referans olarak ekte veriliyor. Yeni parçalar bu temayla aynı dünyaya ait duyulmalı. Mümkünse 2–3 parçada temanın ana motifini başka çalgıyla yeniden kullan.

---

## 1. Kurallar (hepsi zorunlu)

1. **Tamamen özgün olacak.** Var olan bir oyunun, filmin ya da şarkının ezgisi, adı veya tanınır sesi kullanılmayacak. Ticari kullanıma uygun olacak; lisans durumunu yaz.
2. **Sözlü vokal yok.** Koro ve gırtlak şarkısı olabilir, ama anlamlı kelime olmayacak (ünlü sesler: "aa", "oo", "hm").
3. **Biçim:** WAV, 44.1 kHz, 24 ya da 16 bit. Müzik ve ortam stereo, efektler (SFX) mono. MP3'e ve sıkıştırmaya ben çeviririm. Sıkıştırılmış dosya gönderirsen yalnız MP3 ya da OGG olsun.
4. **Döngüler kusursuz dönmeli:** başta ve sonda sessizlik, fade-in ya da fade-out olmayacak. Son ses ilk sese tıkırtısız bağlanacak. Döngü parçalarında giriş bölümü ayrıysa `-giris` ve `-dongu` diye iki dosya ver.
5. **Ses düzeyi:** müzik yaklaşık −16 LUFS, ortam döngüleri −24 LUFS, efektlerin tepe değeri −1 dBTP. Bütün efektlerin algılanan ses düzeyi birbirine yakın olsun; telefon hoparlöründe hiçbiri kaybolmasın, hiçbiri patlamasın.
6. **Efektler kısa ve temiz:** baştaki sessizlik 5 ms'den az, sonda kuyruk doğal sönsün. Yankıyı çok az kullan; oyun kendi yankısını ekliyor.
7. **Çeşitlemeler:** sık çalan sesler (vuruş, savurma, dokunma) için **3 çeşit** ver: `-1`, `-2`, `-3`. Bunlar aynı ses olsun, yalnız küçük farklarla.
8. **Dosya adları** tam olarak aşağıdaki gibi olacak: küçük harf, Türkçe karakter yok (örnek `hit-sword-2.wav`).
9. **Teslim:** tek ZIP. İçinde `muzik/`, `ortam/`, `sfx/` klasörleri ve bir `MANIFEST.md` dosyası olsun. MANIFEST'te her dosya için ad, süre, döngü mü değil mi, BPM, ton ve tek satırlık açıklama yaz.
10. **Telefonda ince ses:** telefon hoparlörü 200 Hz altını zayıf verir. Davul ve bas seslerinin 300–800 Hz arasında da duyulan bir "gövdesi" olsun.

---

## 2. Müzik (MUZIK) — öncelik sırasıyla

| # | Dosya | Nerede çalar | Süre | Tarif |
|---|---|---|---|---|
| M1 | `mus-savas` | Normal savaş | 90–120 sn, döngü | 7/8 aksak (2+2+3), ~130 BPM. Davul ve tef, ısrarlı bas, kısa kopuz ya da bağlama cümleleri. Gergin ama yorucu değil; yüzlerce kez dinlenecek. Orta kısımda bir yükselme ve dinlenme olsun. |
| M2 | `mus-boss` | Boss savaşı | 120 sn, döngü | 5/4, ~95 BPM. Kalın savaş davulları, alçak boru, Frig (alçaltılmış ikinci) renk, sözsüz erkek korosu. Tehdit ve büyüklük hissi. |
| M3 | `mus-boss-son` | Son boss "Adsız" ve Tarikat liderleri | 120–150 sn, döngü | M2'den daha karanlık: uyumsuz yaylılar, fısıltılı koro, çanlar, metal sürtünmesi. İkinci yarıda tempo artsın (boss evre değiştirdiğinde). İsteğe bağlı olarak `-evre2` adında ayrı, daha hızlı bir döngü de olabilir. |
| M4 | `mus-kragmir` | Kragmir başkenti, gündüz | 120–180 sn, döngü | 6/8, ağır. Kalın tel, deri davul, gırtlak demi, uzakta örs. Gururlu, sert, sıcak (kor). "Kızıl Göz" motifinden bir parça kullanılabilir. |
| M5 | `mus-elentha` | Elentha başkenti, gündüz | 120–180 sn, döngü | 4/4, ~80 BPM. Kaval ezgisi, arp ya da lavta eşliği, açık beşli dem, yumuşak sözsüz kadın korosu. Deniz kenti, sancaklar; aydınlık ama hüzünlü. |
| M6 | `mus-kragmir-gece` | Kragmir, gece | 90–120 sn, döngü | M4'ün sade sürümü: yalnız dem, köz çıtırtısına uyan seyrek tel, uzaktan davul. |
| M7 | `mus-elentha-gece` | Elentha, gece | 90–120 sn, döngü | M5'in sade sürümü: tek kaval, seyrek arp, çok yumuşak koro. |
| M8 | `mus-pazar` | Yemin Pazarı (iki halkın ortak çarşısı) | 120 sn, döngü | Canlı ama arka planda kalan bir parça: darbuka ya da tef, ud ya da bağlama, kanun. İki halkın çalgıları karışsın (hem kaval hem kalın tel). Ezgi kalabalık sesini bastırmasın. |
| M9 | `mus-klan` | Klan toprağı | 90–120 sn, döngü | Kamp ateşi havası: hafif davul, el çırpma, tek tel. Dostluk ve hazırlık hissi. |
| M10 | `mus-acilis` | Açılış ve oturum açma ekranı | 60–90 sn, döngü | Rüzgâr, alçak dem, yavaşça beliren "Kızıl Göz" motifi (tek çalgıyla, ör. kaval ya da çello). Gizemli; oyuncu henüz halk seçmedi. |
| M11 | `mus-karakter` | Karakter oluşturma ve seçme | 60–90 sn, döngü | Ölçülü, ağırbaşlı. Hem davul hem kaval duyulsun; iki halk dengede. |
| M12 | `mus-pvp` | Oyuncuya karşı savaş ve Kızıl Bahar Meydanı | 90–120 sn, döngü | Kragmir davulları ile Elentha borularının "atıştığı" bir parça: soru ve cevap. Hızlı ve rekabetçi, ~140 BPM. |
| M13 | `mus-zindan` | Maden, zindan, Sisli Çukur bölgesi | 90–120 sn, döngü | Damla sesleri, yankılı tek tel, alçak uğultu, ara sıra metal tınısı. Gerilimli ama sakin. |
| M14 | `mus-hikaye-volgar` | Kral Volgar Demirdiş diyaloğu (Kragmir) | 40–60 sn, döngü | Tek gırtlak demi ve ağır, yavaş davul. Bilge ve sert bir kral. |
| M15 | `mus-hikaye-edran` | Kral Edran diyaloğu (Elentha) | 40–60 sn, döngü | Çello ya da kaval ile çok yumuşak arp. Yorgun, onurlu bir kral. |
| M16 | `mus-tarikat` | Küllerin Tarikatı sahneleri, hikâyedeki kötü anlar | 40–60 sn, döngü | Fısıltı korosu, uyumsuz yaylılar, kül rüzgârı. |

### Kısa müzik parçaları (döngü değil, tek seferlik)

| # | Dosya | Süre | Tarif |
|---|---|---|---|
| J1 | `jin-zafer` | 3–5 sn | Savaş kazanıldı: davul ve yükselen beş sesli koşu, kaval ve çan, sonda açık beşli. |
| J2 | `jin-yenilgi` | 3–4 sn | Savaş kaybedildi: ağır davul, inen kopuz cümlesi, alçak sonla biter. |
| J3 | `jin-seviye` | 2–3 sn | Seviye atlama: davul ve yükselen beş ses, uzayan parlak akor. |
| J4 | `jin-gorev` | 1.5–2 sn | Görev tamamlandı: mühür vuruşu ve iki parlak ses. |
| J5 | `jin-basarim` | 2 sn | Başarım: kısa boru ve çan beşlisi. |
| J6 | `jin-boss-giris` | 3–4 sn | Boss belirdi: derin boru, ağır davullar, uğultu. |
| J7 | `jin-kragmir` | 1.5 sn | Kragmir'in ses imzası: deri davul üçlemesi ve kısa gırtlak demi (halk seçilince, halk olaylarında). |
| J8 | `jin-elentha` | 1.5 sn | Elentha'nın ses imzası: iki notalı boru çağrısı ve kısa koro. |
| J9 | `jin-kusatma` | 3 sn | Kuşatma ya da baskın başlıyor: uzun alçak iki boru, uzakta davul. |
| J10 | `jin-arti10` | 2–3 sn | Eşya +10'a yükseltildi: örs çınlaması basamak basamak tırmanır, sonunda geniş bir parıltı patlaması. |

**Müzik için örnek İngilizce istem (Lyria/Gemini'ye yapıştırılabilir):**
- M1: *"Original dark fantasy battle loop, 7/8 asymmetric rhythm (2+2+3), 130 BPM, frame drums and davul, driving low bass ostinato, short baglama/kopuz phrases, tense but not exhausting, seamless loop, no vocals with words."*
- M4: *"Original orc mountain-forge city theme, 6/8 slow and heavy, deep frame drums, low bowed strings, Tuvan-style throat singing drone, distant anvil hits, proud and warm, seamless loop, instrumental."*
- M5: *"Original human marble harbor city theme, 4/4 80 BPM, wooden kaval flute melody, harp and lute accompaniment, open fifth drone, soft wordless female choir, bright yet melancholic, seamless loop."*

---

## 3. Ortam döngüleri (ORTAM) — müziğin altında sürekli çalar

| Dosya | Süre | Tarif |
|---|---|---|
| `amb-kragmir-gunduz` | 30–60 sn döngü | Ocak uğultusu, körük soluğu, çıtırdayan köz, uzakta çekiç, ara sıra ork sesleri (kelimesiz). |
| `amb-kragmir-gece` | 30–60 sn | Aynısı daha sessiz; çekiç susmuş, köz ve rüzgâr kalmış. |
| `amb-elentha-gunduz` | 30–60 sn | Açık rüzgâr, dalgalanan sancak bezi, uzak deniz ve martı, kuş cıvıltısı. |
| `amb-elentha-gece` | 30–60 sn | Hafif rüzgâr, cırcır böcekleri, uzak dalga. |
| `amb-pazar` | 30–60 sn | Uzak kalabalık uğultusu (anlaşılmayan konuşma), arada para ve teneke şıngırtısı, küçük çan, at arabası. |
| `amb-klan` | 30–60 sn | Kamp ateşi, çadır bezi, uzakta talim eden kılıçlar. |
| `amb-savas` | 30–60 sn | Açık alan rüzgârı, alçak gerginlik uğultusu, uzak savaş gürültüsü (çok kısık). |
| `amb-zindan` | 30–60 sn | Damla, taş çatırtısı, yankılı boşluk. |
| `amb-portal` | 10–20 sn | Işınlanma kapısı: iki yakın alçak sesin vuruşu (dalgalanma) ve ince ışıltı. |
| `amb-acilis` | 30–60 sn | Açılış ekranı: rüzgâr ve alçak dem. |
| `amb-yagmur` | 30 sn | Yağmur (ortamın üstüne biner). |
| `amb-ruzgar` | 30 sn | Sert rüzgâr uğultusu. |
| `amb-sis` | 30 sn | Sis: çok alçak, boğuk uğultu, ürkütücü. |

---

## 4. Efektler (SFX)

`(3)` yazanlar için 3 çeşit iste: `-1`, `-2`, `-3`.

### 4.1 Arayüz
| Dosya | Tarif |
|---|---|
| `ui-tap` (3) | Düğmeye dokunma: kısa, yumuşak, tahta veya deri tıkırtısı. En sık çalan ses; rahatsız etmemeli. |
| `ui-tap-kragmir` (3) | Kragmir sürümü: alçak küçük davul vuruşu. |
| `ui-tap-elentha` (3) | Elentha sürümü: parlak küçük çan. |
| `ui-tab` | Sekme değiştirme: kâğıt ya da deri sayfa çevirme. |
| `ui-toggle` | Aç/kapat düğmesi: metal mandal. |
| `ui-confirm` | Onay: iki sesli kısa, olumlu tını. |
| `ui-confirm-kragmir` / `ui-confirm-elentha` | Halka göre onay (davul / çan). |
| `ui-back` | Geri: kısa, aşağı inen tını. |
| `ui-open` | Pencere açılır: deri kitap açılması ve hafif hışırtı. |
| `ui-close` | Pencere kapanır: kapak kapanır, kısa. |
| `ui-modal` | Uyarı penceresi çıkar: taş levha konur. |
| `ui-error` | Hata ya da yetersiz kaynak: boğuk, donuk "tık-tık"; cezalandırıcı olmamalı. |
| `ui-toast` | Küçük bildirim: yumuşak "ding". |
| `ui-bell` | Bildirim zili: küçük el çanı, iki vuruş. |
| `ui-coins` | Satın alma: avuçta para şıngırtısı. |
| `ui-sale` | Pazarda satış: iki para ve küçük çan. |
| `ui-reward` | Ödül alma: yükselen üç tel ve parıltı. |
| `ui-chest` | Sandık açma: gıcırtı, mandal, kapak, parıltı. |
| `ui-equip` | Eşya giyme: zırh ve deri kayışlar, metal tokası. |
| `ui-unequip` | Eşya çıkarma: aynı sesin ters ve hafif sürümü. |
| `ui-dismantle` | Eşya parçalama: ezilme ve saçılan kırıntılar. |
| `ui-send` | Mesaj ya da posta gönderme: kâğıt katlanır, hafif hışırtı. |
| `ui-point` | Özellik ya da yetenek puanı ekleme: kısa parlak "tık" ve küçük yükselme. |
| `ui-upgrade` | Bina ya da maden yükseltme: inşaat sesi, iki çekiç ve yükselen ton. |
| `ui-stamp` | Ad değiştirme, mühür: mühür bastırma. |
| `ui-horn` | Klan kurma, katılma, duyuru: kısa savaş borusu. |
| `ui-duyuru` | Sunucu duyurusu: kısa, parlak iki tını. |
| `chat-send` | Sohbet mesajı gönderme: çok kısa, hafif "püf". |

### 4.2 Nadirlik (ganimette eşya çıkınca)
| Dosya | Tarif |
|---|---|
| `rar-standart` | Standart eşya: donuk demir tıkı. |
| `rar-nadir` | Nadir eşya: parlak mavi çınlama. |
| `rar-essiz` | Eşsiz eşya: derin gong, yükselen çanlar, uzun altın parıltı. En "ödüllendirici" ses bu olmalı. |

### 4.3 Şehir binaları (dokununca)
| Dosya | Tarif |
|---|---|
| `hub-knock` | İşlevsiz bina veya genel bina: tahta kapıya iki vuruş. |
| `hub-gate` | Sur kapısı: ağır kapı kanadı ve alçak uğultu. |
| `hub-mine` | Maden: kazma, taş, küçük metal çınlaması. |
| `hub-wheel` | Kader Çarkı: tahta çarkın tıkırdayarak dönmesi. |
| `hub-hall` | Kral Otağı / klan salonu: ağır perde ve derin bir gümleme. |
| `hub-stone` | Taş Yemini dikilitaşı: taşın içinden gelen, yankılı iki ses. |
| `hub-portal` | Işınlanma kapısı kullanma: emme ve parlak geçiş sesi. |
| `hub-iksir` | İksirci: cam şişeler ve fokurdama. |
| `hub-karaborsa` | Karaborsa: kısık fısıltı ve kese şıngırtısı. |
| `cark-don` | Kader Çarkı çevirme: hızlanıp yavaşlayan tıkırtı, sonunda duruş (3–4 sn). |

### 4.4 Örs (eşya yükseltme)
| Dosya | Tarif |
|---|---|
| `anvil-strike` (3) | Örse çekiç darbesi: güçlü metal "çank". |
| `anvil-tension` | Gerilim: 2 saniye boyunca sıklaşan ve tizleşen çekiç darbeleri, alttan yükselen körük. Sonuç sesi bundan hemen sonra çalar. |
| `anvil-ok` | Başarı: parlak çınlama ve sıcak akor. |
| `anvil-fail` | Zararsız başarısızlık: donuk tık ve sönen buhar. |
| `anvil-drop` | Seviye kaybı: tık ve aşağı kayan iki ses. |
| `anvil-break` | Eşya kırıldı: çatırtı, gümleme, dökülen parçalar. Üzücü ama kısa. |
| `anvil-safe` | Muska korudu: donuk tık ve sıcak, koruyan bir akor. |
| `anvil-sparkle-1` … `-4` | +7, +8, +9, +10 başarı parıltısı. Her biri bir öncekinden daha uzun ve daha tiz. |

### 4.5 Savaş: silah savurma ve isabet
Silah türleri: kılıç, balta, hançer, yay, topuz, asa.
| Dosya | Tarif |
|---|---|
| `swing-sword` (3) | Kılıç havayı yarar: keskin "vıjj". |
| `swing-axe` (3) | Balta: ağır, alçak "vuuh". |
| `swing-dagger` (3) | Hançer: çok kısa ve hızlı "fıt". |
| `swing-bow` (3) | Yay: kiriş gerilir ve ok çıkar. |
| `swing-mace` (3) | Topuz: ağır, yuvarlak savurma. |
| `swing-staff` (3) | Asa: tahta savurma ve hafif büyü hışırtısı. |
| `hit-sword` (3) | Kılıç isabeti: et ve zırh kesme, metal sürtünmesi. |
| `hit-axe` (3) | Balta isabeti: kalkan ya da zırha ağır çarpma. |
| `hit-dagger` (3) | Hançer isabeti: kısa, keskin saplanma. |
| `hit-bow` (3) | Ok isabeti: "tak" diye saplanma. |
| `hit-mace` (3) | Topuz isabeti: ezen, boğuk metal darbe. |
| `hit-staff` (3) | Asa isabeti: tahta vuruş ve küçük enerji patlaması. |

### 4.6 Savaş: büyüler
Her element için **hazırlık** (cast, 0.5–1 sn) ve **isabet** (imp) ayrı.
| Dosya | Tarif |
|---|---|
| `cast-fire` / `imp-fire` | Ateş: alevin toplanması / patlayan ateş topu. |
| `cast-ice` / `imp-ice` | Buz: kristalleşme çıtırtısı / buzun kırılarak dağılması. |
| `cast-bolt` / `imp-bolt` | Yıldırım: elektrik vızıltısı / sert şimşek çatlaması. |
| `cast-arcane` / `imp-arcane` | Gizem büyüsü: mor, havada titreşen ton / yankılı enerji patlaması. |
| `cast-heal` | Şifa hazırlığı: yumuşak koro ve ışıltı. |
| `cast-buff` | Güçlendirme hazırlığı: yükselen sıcak ton. |
| `bt-meteor` | Gökten meteor düşmesi: uzaktan yaklaşan uğultu ve büyük patlama (2 sn). |
| `bt-whirl` | Dönen çoklu kılıç saldırısı: üst üste savurmalar. |
| `bt-stomp` | Yere vuruş ve deprem: derin gümleme ve taş çatırtısı. |
| `bt-special` | Özel yetenek başlıyor: kısa enerji yükselişi. |

### 4.7 Savaş: etkiler ve durumlar
| Dosya | Tarif |
|---|---|
| `bt-heal` | Can doldu: parlak, yumuşak çan ve ışıltı. |
| `bt-shield` | Kalkan kubbesi: cam benzeri enerji kubbesinin kapanması. |
| `bt-buff` | Güçlendirildi: yükselen kısa tını. |
| `bt-debuff` | Zayıflatıldı: inen, kirli tını. |
| `bt-burn` | Yanma başladı: alevlenme "fuuş". |
| `bt-poison` | Zehirlendi: fokurdayan, ıslak ses. |
| `bt-stun` | Sersemledi: kafada çınlayan, dönen kuş/yıldız tınısı. |
| `bt-freeze` | Dondu: buzun hızla kaplaması. |
| `bt-taunt` | Kışkırtma: kısa savaş kükremesi (kelimesiz), kalkana kılıç vurma. |
| `bt-tick-burn` | Her tur yanma hasarı: kısa cızırtı. |
| `bt-tick-poison` | Her tur zehir hasarı: kısa fokurtu. |
| `bt-tick-regen` | Her tur can yenilenmesi: çok hafif ışıltı. |
| `bt-crit` (3) | Kritik vuruş: isabetin üstüne binen keskin çınlama ve alttan güçlü vuruş. |
| `bt-resist` | Direndi: donuk "tınk", büyü sekmesi. |
| `bt-absorb` | Kalkan emdi: boğuk enerji yutulması. |
| `bt-death` | Birim öldü: düşüş, zırh şangırtısı, kısa son nefes (kelimesiz). |
| `bt-revive` | Diriltme: yükselen koro ve ışık. |
| `bt-cleanse` | Arındırma (kötü etkiler silindi): su gibi temiz bir akış. |
| `bt-enrage` | Boss öfkelendi: derin kükreme ve davul. |
| `bt-phase` | Boss evre değiştirdi: sert, uyumsuz alçak vuruş. |
| `bt-start` | Savaş başladı: davul ve kapıdan geçiş hissi. |
| `bt-wave` | Yeni düşman dalgası: iki davul ve alçak boru. |

### 4.8 Yaratık ve boss sesleri (isteğe bağlı ama çok etkili)
Kelimesiz; her biri 1–2 sn, **saldırı** ve **ölüm** olmak üzere ikişer dosya (`-saldiri`, `-olum`).
| Dosya öneki | Yaratık | Tarif |
|---|---|---|
| `mob-kurt` | Kurt, çakal | Hırlama / acı inleme. |
| `mob-ork` | Ork savaşçı (düşman) | Gırtlaktan savaş narası / boğuk düşüş. |
| `mob-insan` | İnsan asker, haydut | Kısa efor sesi / düşüş. |
| `mob-tarikat` | Kül Tarikatı müridi | Fısıltılı tıslama / kül gibi dağılma. |
| `mob-golem` | Taş ve kristal yaratık | Taş sürtünmesi / parçalanma. |
| `boss-solucan` | Dev Solucan | Yer altından gelen kükreme, toprak. |
| `boss-tepegoz` | Tepegöz | Tek gözlü dev, derin gürleme. |
| `boss-kristal` | Kristal Muhafızı | Cam ve kristal çınlamalı kükreme. |
| `boss-lav` | Lav Yürek | Fokurdayan lav ve gümbürtü. |
| `boss-karadun` | Kül Ağası Karadun | Boğuk, kötü bir kahkaha (kelimesiz), kül fırtınası. |
| `boss-marven` | Mareşal Marven | Zırhlı komutan narası, kılıç çekme. |
| `boss-adsiz` | Adsız (son boss) | Birden çok sesin üst üste konuştuğu, insan dışı bir uğultu. |

### 4.9 Diğer
| Dosya | Tarif |
|---|---|
| `adim-tas` (3) | Taş zeminde adım (karakter ekranı, şehir). |
| `balik-at` / `balik-cek` | Olta atma (misina ve suya düşme) / balık çekme (su sıçraması). |
| `kervan` | Kervan geldi: at arabası, çan. |
| `hikaye-sayfa` | Hikâye ya da fragman karesi geçişi: kalın kâğıt ve kül hışırtısı. |
| `yemin` | Taş Yemini: taşın çatlaması ve derin yankı (2 sn). |
| `ates-kivilcim` (3) | Kıvılcım ve köz patlaması (ortamda seyrek). |

---

## 5. Toplam ve öncelik

- **Önce gönder (1. teslim):** M1, M2, M4, M5, J1, J2, J3, 4.5 (silahlar), 4.6 (büyüler), 4.1'deki `ui-tap`, `ui-open`, `ui-close`, `ui-error`, `ui-coins`, `ui-reward`.
- **2. teslim:** kalan müzikler, ortamlar, örs, etkiler, nadirlik.
- **3. teslim (isteğe bağlı):** yaratık ve boss sesleri, 4.9.

Yaklaşık sayılar: 16 müzik + 10 kısa müzik + 13 ortam + ~150 efekt dosyası (çeşitlemelerle).

Oyunda her sesin bir yeri zaten var (şu an tarayıcıda sentezle çalıyor). Gelen dosyaları aynı yerlere ben bağlayacağım; seçtiğin adlar yukarıdakilerle aynı olsun yeter.
