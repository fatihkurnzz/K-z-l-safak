# KORANT ONLINE — P35 ilk bağımsız denetim (Opus 5.5)

**Hazırlayan:** Claude Opus 5.5, ilk tur. **Sunulduğu yer:** Fable 5.2'nin bağımsız incelemesi (dosya adları `FABLE_P35_GOREV.md` teslim listesine uyar).
**Tarih:** 26.11.2026. **Kod değişikliği:** yok. Ana kaynak, GitHub ve yayın değişmedi.
**Nihai kabul:** verilmedi (ilk tur).

## 0. Temel, yöntem ve kanıt türleri

**Kaynak sürümü**
- `KAYNAK_ENVANTERI.json`'daki 467 dosyanın 466'sı, depodaki `oyun-son/` ile SHA-256 düzeyinde aynı.
- Farklı olan tek dosya `css/p33-kabul.css`. Bu, 26.11'de V42 F-005/006/007 için yapılan CSS düzeltmesi; P35 başlıklarını etkilemiyor.
- Denetim, bu CSS değişikliğinden önceki commit `bae239e` üzerinden alınan temiz kopyada yapıldı.

**Yamalar**
- `P35_02_04_ADAY.patch`, `D09_TUCCAR_ADAY.patch` ve `P35_01_MEDYA_ADAYI.patch` aynı temiz kopyaya birlikte, çakışmasız uygulandı (`patch -p1 --batch`).

**Kanıt türleri (karıştırılmadan ayrı raporlandı)**

| Tür | Bu turda yapılan | Sonuç |
|---|---|---|
| A · GPT testlerinin bağımsız tekrarı | `kabul.mjs` 274, `r5_kabul.mjs` 40, `destan-kabul.mjs` 184, P35-05 `test.mjs` 1718 + `ek_test.mjs` 414 | Hepsi aynı sonuç (yeni kanıt değil, yalnız tekrarlanabilirlik) |
| B · Yeni hipotez, gerçek kural katmanı (`world.dispatch`, `MemoryStore`, yerel kip `bots:true`) | `KANIT/test/t35.mjs`, `t35b.mjs`, `t35c.mjs` | 10/10 geçti; 2 sınıf/halk durumunda Savaşçı bulgusu (OP35-12) |
| C · Kaynak verisi çözümlemesi (savaş simülasyonu yok) | `rota.mjs` (rota ayrışması), `alti.mjs` (6 yaratık doğumu), `kat.mjs` (katalog), eylem sınıflaması | Bulgular OP35-11, 13, 16, 19 |
| D · Görsel inceleme | onaylı 3 referans, 6 arma/sancak, 6 Gemini aday ekran görüntüsü, Mini Dizi kontak sayfası | Bulgular OP35-01, 04, 17, 18 |
| Tarayıcı / gerçek cihaz / canlı oynanış | **yapılmadı** | Bu turda canlı oynanış kanıtı **yok** |

**Önem tanımları**
- **Kritik:** kayıt/veri kaybı, ilerlemeyi kalıcı kilitleme ya da hikâyeyi geri dönülmez bozma.
- **Yüksek:** onaylı kararla çelişme, entegrasyonu ya da kabulü engelleme, geniş oyuncu kitlesini etkileyen tasarım hatası.
- **Orta:** tutarlılık ya da deneyim sorunu; geçici çözümü var.
- **Düşük:** metin, kozmetik ya da bakım sorunu.

**Özet:** 23 bulgu var. Kritik 0, Yüksek 4 (OP35-05, 08, 13, 17), Orta 13, Düşük 6. Ayrıntılar `FABLE_P35_BULGULAR.csv` içinde. V42 bulgularıyla çakışan yerlerde kopya bulgu açılmadı, `v42_baglanti` sütunuyla bağlantı verildi (F-001, F-002, F-005, F-013, F-018, F-021, F-024).

---

## 1. F-P35-01 Hikâye ve Destan

**Güçlü yanlar**
- 8 bölüm × 2 halk eşlemesi eksiksiz. 16 gömülü/dosya anahtarının hepsi oyunda mevcut (`minidizi-01…10` `gorsel-png.js` içinde; `interiors/` ve `sahneler/` dosyaları var).
- IV ve VII'de bulmaca öncesi görsel bilinçli olarak yok. Çözüm sızmıyor.
- `outro` ve `memory` görselleri yalnız bölüm tamamlanınca açılıyor. Hata ya da yükleme sorununda yazılı anlatı kesilmiyor.

**Gerçek sorunlar**
- **OP35-05 · Yüksek · karar bekliyor.** Özgün metin ile V42 uyarlaması arasındaki farklar "kayıt altına alındı, yeniden yazılmaz" durumunda dondu. Açık kalanlar:
  - IV/V'te Marven'in erken ifşası (spoiler).
  - VII'de oyuncunun Marven'le savaşıp VIII'de Marven'in tuzağı sürdürmesi (olay örgüsü deliği).
  - VII Kragmir kadrosu (Yashka) ile metin ve minidizi-08 görseli (Lira + Thrak) uyuşmuyor.
  - VIII'de kapalı son.

  Medya eklemek bu çelişkiyi görünür kılıyor. Gerçek karar sorusu şu: "Özgün metne dokunma" kuralı V42 uyarlama metinlerini de kapsıyor mu? Ayrıntılı bölüm analizi `_tasarim/p35/P35_BAGIMSIZ_DEGERLENDIRME_OPUS.md` (commit 0e69ebd) dosyasında; burada tekrarlanmadı.
- **OP35-01 · Orta.** II girişinde bölümün sonucu (çatlak taş, minidizi-03) gösteriliyor. Yemin anını gösteren minidizi-02 hiç kullanılmıyor.
- **OP35-04 · Orta.** IV anısındaki minidizi-05, Lira'yı taçlı bir erkekle birlikte gösteriyor. Özgün metinde Lira arşivde yalnızdır.
- **OP35-02 · Orta.** Kullanıcının 880×406 cihazında bulmaca görseli gizleniyor, sahne görseli 54 px'e iniyor. P35-01'in tek görünür katkısı küçük bir küçük resme dönüşüyor.
- **OP35-03 · Düşük.** Görsel altındaki "Mini Dizi illüstrasyonu" yazısı meta dil.
- **OP35-23 · Düşük.** Yeni CSS erken yüklenen dosyaya ekleniyor.

**Kilit ve görev çakışması:** Yok. m32 → Destan IV ve m43 → Destan VI köprüleri, `chapterOpen` kuralıyla tutarlı (`mqCanGo`). Destan kilitleri değişmiyor.

## 2. F-P35-02 Ana görev ve dönem akışı

**Doğrulanan iyi değişiklikler (yamalı kaynak)**
- 64 kimlik ve ödüller korunuyor (274/274 tekrar).
- Önceki incelemede saptanan hatalar giderilmiş:
  - m25/m28/m24 sırası düzeldi.
  - m32 ve m43 tekrarları Destan köprüsü oldu.
  - m56 artık "Adsız".
- Zorunlu PvP (3 dövüş, zafer şart değil), klan ve Örs denemesi (başarı şart değil) uygulanmış.
- 100/250/500 eşikleri doğru. Ana sefer 22 düğüm.

**Yeni dispatch kanıtı (tür B, iki halk)**
- Yeni oyuncunun ilk ana hedefi m01.
- Sv.20'de 3 açık bot klanı var; katılım bedelsiz.
- Klandan ayrılınca m15 ilerlemesi korunuyor.
- Başarısız Örs denemesi m05'i tamamlıyor.

**Kendini kilitleyen geçit:** Bulunmadı.
- Ana sefer yalnız ödül zincirini kilitliyor, bölge erişimini değil.
- Yerel kipte klan geçidi ücretsiz aşılıyor.
- Sunucu kipinde aynı geçit için bkz. OP35-10 (bilgi).

**Gerçek sorunlar**
- **OP35-08 · Yüksek.** Onaylı D06/D07 A politikası için üretim yaması yok. `state.js`, `daily.js` ve `metaops.js` yamalı kopyada değişmemiş. Kalıcı can/savunma başarımlarına dokunan en riskli entegrasyon bu; F-001 ve F-021'e bağlı.
- **OP35-06 · Orta.** m25 hâlâ Bran'ı (çocuk NPC) sınır karakolunda gösteriyor. m37 taşın şimdi çatladığını söylüyor.
- **OP35-07 · Düşük.** "Bin Kesen" adı 500 hedefle çelişiyor.
- **OP35-09 · Düşük.** Ana ekran izleyicisi hazır yan ödülleri göstermiyor.

**Örtük grind:** Bin Kesen (30.000) ve Kemik Yığını (5000) kasmaları kalktı. Kalan seviye düğümleri (m37/44/49/57) sefer dışında kaldı. Bu doğru bir karar. Seviye hızı (F-012) kullanıcı kararı bekliyor; bu turda değerlendirilmedi.

## 3. F-P35-03 İçerik bütünlüğü

- **20 zırh (`u:linen_*`, `u:wool_*`):** `allBases()` içinde, Koleksiyon kataloğunda yer alıyor (`KATALOG_KIRILIM.txt`). Satın alınabilirlik iddiası (PAPER_IDS) bu turda bağımsız olarak denenmedi; Astra H-05'e eklendi.
- **6 yaratık (OP35-11):** Kaynak verisi şunu gösteriyor: 100 aşamanın hiçbirinde yoklar, yalnız rastgele dalga modlarında doğuyorlar. "Erişilebilir" doğru, ama oyuncu için şansa bağlı. Avcı Seferi ve Koleksiyon tasarımı bunu dikkate almalı. **Silme önerilmez.**
- **NPC:** D09 Kragmir tüccar replikleri (7 satır, kullanıcı onaylı) yamada doğru dalda. Dükkân anahtarı `halvor` mevcut olduğu için replik gerçekten görünür. Tasarım yeniden tartışılmadı.
- **Boss kimliği:** m56 = Adsız (4-25), Marven = 4-20; kaynakla uyumlu. VII boss sorunu için bkz. OP35-05.

## 4. F-P35-04 Oyuncu deneyimi

**Gözlem (ölçülen)**
- **Yazılım GL koşusu (26.11):** Geliştirici aracı olmadan Kragmir, 880×406. Öğretici 10. saniyede ilk savaşa geçti; 300. saniyede hâlâ ilk savaştaydı. Kanıt: `oyun-son/_tasarim/opus-v42-duzeltme/F-024/`. Gerçek cihaz değil; F-024'e bağlı.
- **OP35-12 (Orta, kullanıcı kararı):** Öğreticiyi atlayan Savaşçı silahsız başlıyor (19 Kas kararı) ve ilk Örs denemesini yapamıyor. Diğer üç sınıf yapabiliyor.

**Çıkarım (tasarım)**

| Profil | Doğal sıra | Risk |
|---|---|---|
| Yeni (ilk 30 dk) | m01 → m04 → m05 → m09; günlük sandık Sv.12 öncesi alınamıyor | D06 A uygulanana kadar ilk ödül döngüsü eksik (OP35-08) |
| Geri dönen | Eski `mq.done` korunur; yeni ön koşullar (m56: m13/m15/m17…) eski hesapta açık kalan zorunlu görevleri ortaya çıkarır | Bilgilendirme yoksa "neden kilitli" şaşkınlığı |
| 65. seviye | m57/m61–m64 isteğe bağlı; Avcı Seferi (Sv.25+) ve Kor katları | P35-05 kesinleşmeden son oyun döngüsü zayıf |
| Solo | Klan geçidi bot klanla aşılır | Sunucu kipinde değişir (OP35-10) |
| Düşük zamanlı | Günlük 2 Kuyu hakkı + günlük görevler; zorunlu iş yok | Yeni zorunlu günlük iş eklenmemeli |

- **Motivasyon:** Ana seferin 22 düğümü ve Destan köprüleri yönü doğru kuruyor.
- **Angarya:** 8 rotalık seçim gerçek bir karar üretmezse yük olur (OP35-13).

## 5. F-P35-05A Koleksiyon ve 5B Avcı Seferi

Ayrıntı ve karar seçenekleri: `FABLE_P35_AVCI_KOLEKSIYON_KARAR.md`. Özet:
- **OP35-13 · Yüksek.** Ayrışma iki kaynaktan ölçüldü:
  - **Kaynak verisi:** Havuzun iki yarısı arasında ortalama can/saldırı/savunma farkı ≤%9.
  - **GPT'nin kendi testi:** Ödül 8 rotada birebir aynı.

  Bu yüzden 8 rota gerçek bir karar değil. Öneri: rota ekseni baskın zayıflığa bağlansın.
- **OP35-14 · Orta.** "Dipsiz Kuyu" kimliği görev metninde, unvanda ve boyalı sahne kartında var. Ad değişikliği tek başına metin işi değil.
- **OP35-15 · Orta.** F-002 kapanmadan Koleksiyon'un prestij değeri yok.
- **OP35-16 · Orta.** 1247 kaydın 1098'i nadirlik kopyası; varsayılan ilerleme 698 tabanla verilmeli.

## 6. F-P35-06 Arayüz

- **OP35-19:** 122 eylem için kaynak taraması yapıldı. Sonuç: 45 varyant, 52 modal/onay, 13 savaş akışı, 4 yeni pencere, 2 geliştirici (kabul dışı), 5 belirsiz, 1 yalnız işlem. Gerçek çekim yükü yaklaşık 70 durum.
- **OP35-20:** 240 satırda 3 yinelenen satır var; 54 satırda eylem/kaynak boş.

**Durumlar:** boş/hata/yükleme durumları ve kompakt pencere kuralları GPT kapısında doğru tanımlanmış. Yeni Gemini finali olmadığı için **sanat kabulü verilmedi**. Gemini aday ekranları telefon sohbet görüntüsü (709×1536, arayüz yaklaşık 300 px genişlikte); sanat kabulü için kullanılamaz.

## 7. F-P35-07 Sanat uyumu — onaylı referanslardan kabul rubriği

**OP35-17 · Yüksek.** Referanslar oyun verisiyle çelişen içerik taşıyor (9 bölüm, Sv.72, MAG/SPI, çok maddeli hedef, olmayan NPC'ler). Önerilen rubrik:

| Ölçüt | Referanstan ALINIR | Referanstan ALINMAZ | Ölçüm |
|---|---|---|---|
| Malzeme | Elentha: lacivert + mat altın, cilalı çelik. Kragmir: karartılmış demir, bordo, bronz | — | Çerçeve renkleri iki halkta farklı, yapı aynı |
| Çerçeve | Kalın metal kenar, köşe süsü, iç gölge | Pencerenin ekranın %90'ını kaplaması | Pencere ≤ ekranın %80'i (işlev gerektirmedikçe) |
| Tipografi | Cinzel başlık, Inter gövde, altın başlık | — | Gövde ≥11 px; başlık kontrastı ≥4.5:1 |
| Hiyerarşi | Sol sekme / orta liste / sağ ayrıntı | — | Ana eylem düğmesi tek ve belirgin |
| Veri | — | Bölüm sayısı, hedef yapısı, düğme seti (İzle/Teslim Et/Haritada Göster), nitelikler, seviye, NPC, ödül rakamları | Mockup'taki her alan gerçek bir oyun alanına bağlanır, yoksa çıkar |
| Irk kimliği | Şehir, amblem, orklar yeşil | Kragmir'e Elentha gotik kemerleri | İki halk yan yana: ırk 1 sn'de ayırt edilir |
| Dekor | Az ve işlevsel | İçeriği daraltan büyük süs | İçerik alanı ≥ pencerenin %70'i |

**OP35-18 · Orta.** Kragmir amblem ve rozeti alfasız, iki sancak dekupe değil. Türev dosya gerekiyor; onay kilidi korunur.

**Aşırı dekor ve ruhsuz CSS riski:** 42 CSS dosyası, çok katmanlı `!important`. Yeni tasarım ancak tek son katmanda (`p35.css`) toplanırsa ruhsuz düz CSS ile aşırı dekor arasında denetlenebilir.

## 8. F-P35-08 Varlık ve performans

- **OP35-21:** `varlik_kontrol.py` sahte saydamlık, opak zemin, %85'ten fazla boşluk, aşırı boyut ve 9-dilim tutarlılığını yakalamıyor.
- **OP35-22:** Oyunda 37,5 MB base64 gömülü görsel JS var. Başkente varış ölçümü (rt.mjs, 26.11, yerel ve sıkıştırmasız) 294 istek, 26,9 MB. Yeni varlıklar dosya olarak verilmeli. F-013'e bağlı.

**Ölçüm yöntemi önerisi:** Aynı `rt.mjs` komutuyla önce/sonra ağ ölçülür, `performance.memory` okunur. Gerçek cihazda FPS, ısınma ve bellek için F-014 gereklidir. **Gerçek ölçüm olmadan "performans geçti" denemez.**

## 9. F-P35-09 Bağımsız kabul

Her başlığın kanıt durumu, eksik kanıtı ve gereken gerçek testler: `FABLE_P35_KABUL_MATRISI.csv`. Hiçbir başlık bu turda "kanıtlanmış nihai kabul" almadı. Durumlar:
- P35-02 ve P35-03: kaynakta kanıtlı aday.
- P35-01: aday, karar bekliyor.
- P35-05: model aday, tasarım kararı bekliyor.
- P35-06, 07 ve 08: engelli (Gemini finali yok).

## 10. Engeller ve doğrulanamayanlar

1. **Gemini nihai varlıkları verilmedi.** Sanat kabulü ve P35-06/07/08 ölçümleri engelli.
2. **Güncel Opus dalının P35 entegrasyonu yok.** Nihai kabul yalnız entegre sürümde yapılabilir.
3. **Tarayıcı, gerçek cihaz ve canlı oynanış testi bu turda yapılmadı.**
4. **Savaş sonucu bağımlılığı:** Avcı Seferi ve Savaşçı silahsız başlangıcı için savaş sonucu simülasyonu yapılmadı. P36 kapsamı başlatılmadı.
5. **PAPER_IDS satın alınabilirliği ve 1247 kaydın edinim yolu bağımsız olarak doğrulanmadı.** Astra H-05'e eklendi.
6. **122 eylem sınıflaması sezgisel.** Kaynak deseni taramasıyla yapıldı; elle doğrulama gerekir.
