# P34-11 · Ses sistemi, istekler ve teknik biçim (Gemini)

Ses üretimi **yalnız ek** içindir: mevcut sesler korunur, hiçbiri yeniden üretilmez. Mini Dizi sesi YOK. Gerçek kişi/ünlü ses taklidi, telifli müzik örneklemi yok. Kullandığın üretim aracını ve lisans durumunu `teslim_manifest.json › ses` alanına yaz (özgün üretim, ticari kullanım hakkı).

## 1. Mevcut ses sistemi (kod: `js/audio.js`, `js/sfx.js`, `js/ui-ses.js`)
- Web Audio. **Kanallar (bus)**: `ui` Arayüz, `battle` Savaş, `amb` Ortam, `music` Müzik (+ master, kısa taş-avlu yankı). Ayarlar → Ses'ten ayrı kısılır. **NPC kanalı henüz YOK**: NPC sesi gelirse entegrasyonda `npc` kanalı eklenir (yeni kaydırıcı); ses yoksa "sessiz geri dönüş".
- 131 sentez anahtarı (WebAudio ile anlık üretilir, dosyası yok): arayüz, savaş (`swing.* hit.* cast.* bt.*`), nadirlik (`rar.0–2`), örs (`anvil.*`), ırk imzaları (`id.ocak`, `id.sancak`), ortam (`amb.*`) vb. Hepsi KORUNUR. Tam liste: `ses_haritasi.json › sentez_anahtarlari`.
- Müzik anahtarları dosyadan çalar (`url:`); ortam anahtarları şimdi sentez "yatak + olay" şeklindedir. **Entegrasyonda** ortam anahtarlarına da `url:` döngü dosyası bağlanacak (dosya yüklenemezse sentez geri dönüş olarak kalır). Sen yalnız dosyayı ve hangi anahtara ait olduğunu bildir.
- Müzik: aynı anda tek müzik; geçişler 0,4–2,5 sn çapraz solma; sekme arka plandayken durur; müzik kanalı ortamdan ayrı ayarlanır.

## 2. Mevcut müzik dosyaları (KORUNUR; üslup referansı olarak pakette)
| Dosya | Anahtar | Kullanım | Süre | Seviye |
|---|---|---|---|---|
| `audio/intro.mp3` | `mus.intro` | yükleme ekranı | 154,6 sn | −12,3 LUFS |
| `audio/arka-plan.mp3` | `mus.tema` | başkent, çarşı (iki halk ortak) | 174,9 sn | −12,5 LUFS |
| `audio/kizil-goz.mp3` | `mus.fragman` | tema/fragman ("Under the Crimson Eye") | 157,6 sn | −12,2 LUFS |
| `audio/boss.mp3` | `mus.boss` | boss savaşı | 105,7 sn | −13,8 LUFS |
Biçim: MP3, 44,1 kHz, stereo, 112–128 kbps.

## 3. İstenen MÜZİK (kimlik = oyundaki anahtar)
| Kimlik | Anahtar | Kullanım | Öncelik | Şart |
|---|---|---|---|---|
| MUS-01 | `mus.battle` | Normal savaş müziği (bölge/zindan/PvP). Şu an sentez. | **Zorunlu** | 90–150 sn, kusursuz döngü, `boss.mp3`'ten DAHA az yoğun; sıra tabanlı savaşa uygun orta tempolu, ritmik orkestral-halk; mekanik/hamle sesleri (hit/cast) üstüne binecek, orta-yüksek frekans kalabalık olmasın. Hedef −13 LUFS |
| MUS-02 | `mus.hub.sancak` | Elentha başkent teması (şu an iki halk aynı `mus.tema` çalıyor) | İsteğe bağlı | 120–180 sn döngü; mermer/kemer/dağ havası, soylu, ferah, mavi-altın; korno, yaylı, arp; −13 LUFS |
| MUS-03 | `mus.hub.ocak` | Kragmir başkent teması | İsteğe bağlı | 120–180 sn döngü; davul, boru, gırtlak/kemik ritmi, kızıl göz, lav; ağır, tehditkâr ama onurlu; −13 LUFS |
| MUS-04 | `bt.victory` | Zafer motifi (şu an sentez) | İsteğe bağlı | 6–12 sn, tek seferlik; iki halk için ortak ya da `.sancak/.ocak` iki varyant |
| MUS-05 | `bt.defeat` | Yenilgi motifi | İsteğe bağlı | 5–8 sn, tek seferlik, hüzünlü ama ağır değil |
Üslup: mevcut parçalarla aynı ailede (epik fantastik, gerçekçi enstrüman, minimal synth), sözsüz. "Under the Crimson Eye" teması ve `boss.mp3` ile motif benzerliği değil, ton uyumu istenir.

## 4. İstenen ORTAM döngüleri
Biçim: stereo MP3 44,1 kHz 96–128 kbps (ya da OGG Vorbis q4), **30–60 sn kusursuz döngü** (başı-sonu dikişsiz; tek seferlik "çan/kuş" gibi belirgin olaylar döngünün her yinelemesinde fark edilir olmasın), seviye **−26 … −22 LUFS** (müziğin ve konuşmanın altında arkada durur), belirgin melodi/ritim YOK (müzikle çakışmaz).
| Kimlik | Anahtar | Ne zaman | Karakter | Öncelik |
|---|---|---|---|---|
| AMB-01 | `amb.sancak.day` | Elentha başkent, gündüz | hafif rüzgâr, uzak su/şelale, kuşlar, kristal çan çınlaması (seyrek) | **Zorunlu** |
| AMB-02 | `amb.sancak.night` | Elentha gece | cırcır, hafif rüzgâr, uzak çan, meşale çıtırtısı | Zorunlu |
| AMB-03 | `amb.ocak.day` | Kragmir gündüz | uzak davul, kor çıtırtısı, sıcak rüzgâr, lav kaynaması, metal çınlaması | Zorunlu |
| AMB-04 | `amb.ocak.night` | Kragmir gece | derin rüzgâr, uzak lav, davul, yarasa/kanat | Zorunlu |
| AMB-05 | `amb.market` | Yemin Pazarı (iki halk) | kalabalık uğultusu (anlaşılmayan), tezgâh, vagon, para/metal tıkırtısı | Zorunlu |
| AMB-06 | `amb.icm.han` | Han iç mekânı | şömine, kadeh/tabak, kısık sohbet | Zorunlu |
| AMB-07 | `amb.icm.ahir` | Ahır iç mekânı | hayvan nefesi/pıtırtı, saman, rüzgâr, kuş | Zorunlu |
| AMB-08 | `amb.icm.ors` | Büyük Örs | ocak, körük, uzak çekiç tınısı (örs vuruşundan ayırt edilmeli; asıl vuruş sentez sesi) | Zorunlu |
| AMB-09 | `amb.icm.maden` | Maden | damlama, yankı, uzak kazma, taş | Zorunlu |
| AMB-10 | `amb.icm.klan` | Klan Karargâhı | meşale, rüzgâr, uzak askerî hareket | Zorunlu |
| AMB-11 | `amb.z.zkuyu` | Dipsiz Kuyu zindanı | derin yankı, damla, uğultu | Zorunlu |
| AMB-12 | `amb.z.zyarik` | Gök Yarığı | gök gürültüsü gerilimi, enerji çatırtısı, rüzgâr | Zorunlu |
| AMB-13 | `amb.z.zmuhur` | Mühürlü Oda | mühür uğultusu, taş, fısıltısız | Zorunlu |
| AMB-14 | `amb.z.zkule` | Kül Kulesi | rüzgâr, kül/kor çıtırtısı, uzaktan metal | Zorunlu |
| AMB-15 | `amb.z.zocak` | Yeraltı Ocağı | lav, metal, ocak | Zorunlu |
| AMB-16 | `amb.portal` | Işınlanma Kapısı yakını (başkent üstüne ek) | düşük sürekli enerji uğultusu, hafif parıltı | Zorunlu |
| AMB-17 | `amb.battle` | Bölge savaşı varsayılan ortamı | uzak rüzgâr/ordu havası, çok hafif | Zorunlu |
| AMB-18 | `amb.title` | Başlık ekranı | geniş boşluk, rüzgâr, çok hafif çan | İsteğe bağlı |
| AMB-19…21 | `amb.wx.rain`, `amb.wx.wind`, `amb.wx.fog` | Hava katmanı (başkent üstüne eklenir) | yağmur / rüzgâr / sis | İsteğe bağlı |
Dosya adı: `P34-11/ortam/<anahtar>.mp3` (örn. `amb.icm.han.mp3`).

## 5. İstenen NPC SESLENDİRMESİ
- Kaynak metin: `npc_ses_listesi.json` (15 rol, **105 replik**, Türkçe; metin DEĞİŞMEZ, kendi söz eklemesi yok). Her replik tek ses dosyası. Replik türleri: `selamlama` (3 satır; rastgele biri çalar), `basari` (2), `basarisizlik` (2; roller için sayılar listede). Kullanım: NPC'nin penceresi/diyaloğu açılırken selamlama; GERÇEK işlem sonucundan sonra başarı/başarısızlık.
- **A katmanı (zorunlu): 15 rol × 3 selamlama = 45 dosya. B katmanı (isteğe bağlı): 15 rol × (2+2) = 60 dosya.**
- Ses karakterleri (öneri; aynı rolün bütün repliklerinde AYNI ses; roller arası belirgin farklı; iki halkın benzer rolleri (Hancı/Ork Hancı…) tonla ayrılır). Aşağıdaki cinsiyet/yaş yalnız ses yönergesidir; kodda ve oyun metninde yeni karakter bilgisi oluşturmaz:
| Rol (kimlik) | Halk | Ses karakteri |
|---|---|---|
| Hancı (gpt-npc-01) | Elentha | sıcak, orta yaşlı, cana yakın, hafif kısık |
| Seyis (02) | Elentha | sakin, hayvan seven, orta yaşlı kadın |
| Kral Edran (03) | Elentha | derin, otoriter ama adil, yavaş ve ölçülü, soylu |
| Kaçakçı (04) | Elentha | alçak, hızlı, gizli, kuşkulu |
| Komutan (05) | Elentha | net, kısa, buyurucu, disiplinli |
| Ork Hancı (06) | Kragmir | gür, kaba-samimi, bas |
| Ork Binek Bakıcısı (07) | Kragmir | kaba ama şefkatli, yavaş, bas |
| Kral Volgar Demirdiş (08) | Kragmir | çok derin, ağır, onurlu ve tehditkâr |
| Ork Kaçakçı (09) | Kragmir | hırıltılı, kısık, az konuşur |
| Ork Komutan (10) | Kragmir | sert, kısa cümleler, otoriter |
| Büyük Örs Ustası (11) | ortak | yaşlı, nefesli, sabırlı, orta-bas |
| Silah Tüccarı (12) | ortak | enerjik, ikna edici, canlı |
| Zırh Tüccarı (13) | ortak | ağırbaşlı, ölçülü, güven veren |
| Takı Tüccarı / Lira (14) | ortak | zarif, parlak, rahat |
| Tüccar Halvor (15) | Elentha | neşeli, geveze, orta yaşlı |
- Teknik: **mono, 44,1 kHz, MP3 96 kbps (ya da OGG)**, süre 0,5–3,5 sn, başta/sonda sessizlik ≤ 80 ms, **−18 LUFS** (müzik −12/−13 LUFS olduğundan NPC sesi biz kanalda dengeleriz; sen bütün dosyalarda tutarlı seviye ver), tepe ≤ −3 dBFS, oda yankısı/müzik/arka plan gürültüsü YOK (oyun kendi yankısını ekler), Türkçe doğal telaffuz.
- Dosya adı: `P34-11/npc/<kimlik>__<tur><n>.mp3` (örn. `gpt-npc-01__selamlama1.mp3`). Eşleme tablosu `npc_ses_listesi.json › satirlar[].ses_dosyasi`.
- EN dil: oyun EN seçiliyken NPC sesi çalınmaz (metin Türkçe kaldığı için); ayrı bir istek yok.

## 6. Entegrasyon eşlemesi (bilgi; bende)
- Müzik: `js/sfx.js` anahtarlarına `url` bağlanır (mevcut `mus.boss`/`mus.intro` gibi); sahne eşlemesi `sceneLoops` (hub/carsi/icm/battle/boss/loading/fragman/title). Şu an hub ve çarşı HER İKİ halk için `mus.tema`.
- Ortam: yukarıdaki `amb.*` anahtarları sahneye göre `sceneLoops` listesinden çalınır; dosya geldiğinde `url` döngüsü, yoksa sentez.
- NPC sesi: yeni `npc` kanalı + `js/npc-soz.js` içindeki kimlik↔ses eşlemesi; işlem sonucu (başarı/başarısızlık) yalnız gerçek sonuç olayından sonra.
- Ses dosyaları `audio/` altına eklenir. Yayında en çok 511 dosya sınırı olduğundan çok sayıdaki NPC sesini entegrasyonda ben birleştirebilirim; sen HER REPLİK İÇİN AYRI dosya ver (yukarıdaki adlandırma).
