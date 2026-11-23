# Demir Diyarı · Oturum hafızası

Kullanıcı Türkçe konuşur; yanıtlar Türkçe olsun. Oyun: **Demir Diyarı** (sayfa başlığı "Korant Online"). Tarayıcıda çalışan, YALNIZCA YATAY çizilen 3B mobil RPG: vanilla ES modülleri, three.js r160 gömülü, sıra tabanlı belirlenimci savaş. Hikâye: **Vahran: Tarihin Külleri** (`_tasarim/VAHRAN_destan.txt`).

## Çalışma şekli
- Kullanıcı görselleri GPT'ye yaptırıp ZIP olarak gönderiyor, ben oyuna yerleştiriyorum. **Oyun mekaniklerine dokunma** (`shared/` = mekanik); yalnız grafik, arayüz, yerleşim.
- İş bitince **yapıt olarak yayımla** ve bağlantıyı ver.
- Kullanıcının beğenisi: tek parça boyanmış sahneler (ayrı sprite + boş zemin BEĞENİLMEDİ); sade, gerçekçi, az altın.
- KULLANICININ TELEFONU: 2340×1080, Claude uygulamasında dik tutuluyor, oyun döndürülüyor → mantıksal ölçü **880×406** (dpr 2.66). Eski notlardaki 722×411 ve 846×412 yanlıştı.

## SON DURUM (23.11, 14. oturum) — clear sonrası buradan devam
- **KOD NİHAİ SÜRÜMDE.** Kullanıcı: önce kod bitsin; testler, GPT görselleri, yayın altyapısı (Play Store) SONRA. Tek kaynak `oyun-son/_tasarim/EKSIK_LISTESI_SON.md` (1 bitti, 2A GPT, 2B testler, 2C Play Store planı, 2D testten sonra kod).
- **Kararlar (kesin):** Play Store · ilk sürüm yerel kayıt · ilk sürümde gerçek para YOK (2. yol), sonra önce kozmetik, sunucu gelince avantaj · 2. sezon sonra.
- Bu oturum: ödeme ekranı "Yakında"; savaş Otomatik/Oto İksir/hız glifleri; C11 düğme rolleri `html.roller` (`.tehlike` sınıfı yeni; kapatma `dd_rol='0'`/`?rol=0`); `!important` temizliği testten sonraya.
- Yayın: önceki yayın commit'i 3545f7e; bu oturumun yayın commit'i "Nihai kod" commit'i.

## ÖNCEKİ DURUM (23.11, 13. oturum)
- **Sürüm 36 YAYINDA** (485 dosya; yayın commit'i 3545f7e; sonraki yayında `git diff --name-status 3545f7e HEAD -- .` (oyun-son içinde), `_tasarim/` hariç).
- **"Stage" → "Aşama" BİTTİ** (kullanıcı kararı): TR metinlerde ekleriyle (aşamayı/aşamasını/aşamalarda…), shared/ yalnız metin+yorum; i18n'de yalnız anahtarlar (EN karşılık "stage" kaldı). Betik scratchpad `asama.py` (silinebilir).
- Regresyon (ui-denetim, 880×406, iki halk): 68/88 ekran açıldı, 0 JS hatası. Görevler sekme rozeti düzeltildi (`duzen.css` sonu).
- **KULLANICI (23.11, kesin): TEST YAPMA.** Ne otomatik tur ne ekran görüntüsü; her denenmesi gereken şeyi `EKSIK_LISTESI_SON.md` C bölümüne yaz, testler en sonda topluca yapılacak.
- **KARARLAR (23.11, kesin):** Play Store · ilk sürüm yerel kayıt (sunucu sonra) · gerçek para + avantaj · 2. sezon ilk sürümden sonra. Çelişki (avantaj satışı + yerel kayıt) kullanıcıya bildirildi; ayrıntı EKSIK_LISTESI_SON.md D.
- **Kod ~%90 bitti. EKSİK LİSTESİ: `oyun-son/_tasarim/EKSIK_LISTESI_SON.md`** (A GPT görselleri, B kodda kalan C11 görsel vb., C kullanıcı testleri, D kararlar). Eski `EKSIK_LISTESI.md` artık geçersiz.

## ÖNCEKİ DURUM (23.11, 12. oturum)
- **Sürüm 34 YAYINDA** (509−24 = 485 dosya; yayın commit'i 3c577ae; sonraki yayında `git diff --name-status <o commit> HEAD -- oyun-son`, `_tasarim` hariç). Kullanıcı: REGRESYON YAPMA, kalanları bitir, sonra eksik listesi çıkarılacak.
- **CSS BİRLEŞTİ (C11 yapısal adım):** 34 → 10 dosya, içerik birebir (CSSOM kural sayısı/özeti eski-yeni aynı doğrulandı). `css/temel.css` = v8…v16, `css/arayuz.css` = v13-hub, v17–v20, `css/kul-demir.css` = v21–v25, `css/duzen.css` = v27–v30 (bölüm başlıkları `/* ===== eski vNN.css ===== */`). OTOMATİK olanlar ayrı kaldı: v26-gpt4, v31, v32, v33. **Yeni CSS artık `css/duzen.css` SONUNA** (eski notlardaki "v27-duzen.css sonu" = duzen.css). `kd-tokens.css`'e sanat kitabı tokenleri eklendi (--kd-old-gold, --kd-hp, --kd-t1..t7, --kd-btn-h, --kd-halk-1..4; henüz kullanılmıyor). C11'in görsel kısmı (4 düğme rolü, tek amblem, ≤3 sayaç, !important temizliği) görsel karşılaştırma ister → eksik listesinde.
- **C10 BİTTİ:** G7 `kutsal-isin` → şerit `holy`, `golge-cokus` → `shadow` (`vfx-g7-gom.py` yeni anahtar da ekler). `fx-table.js fxElement(S, u)`: elementsiz büyü rahipte `holy`, karanlık ailedeki (bestiary `el:'dark'`) yaratıkta `dark` çizilir; yalnız görünüş, hasar değişmez. `combat.js` bunu kullanır.
- **C0 BİTTİ:** `_tasarim/denetim-22kas/paket/` → `SANAT_KITABI.md`, `REFERANS/` (onaylı/kaçınılacak/oyun ekranı), `DEMIR_DIYARI_ANA_DENETIM.html`.
- **C4 GEREKSİZ** (2B yöntem seçildi) — kapatıldı.
- **Taraf Seç bayrakları:** kullanıcı isteğiyle G8 amblemleri karakter oluşturmadan kaldırıldı; v33'teki eski bayraklar (güneş / kızıl göz) görünür. G8 amblemi sonuç ekranında ve başka yerlerde duruyor.

## ÖNCEKİ DURUM (23.11, 11. oturum)
- **Sürüm 33 YAYINDA** (509 dosya; yayın commit'i "M1 ek düzeltmeler" commit'i; sonraki yayında `git diff --name-status <o commit> HEAD -- oyun-son`, `_tasarim` hariç). TEST YAPMA kuralı sürüyor (yalnız karakter oluşturmanın tek ekran görüntüsü alındı, hatasız).
- **Gelen:** Gemini M1 raporu + GPT 4 düzeltme ZIP'i (`/root/.claude/uploads/6a0c4fed-.../`). Birleşik kaynak (eski paket + düzeltmeler) scratchpad `birlesik/` (`G1 G2_* G4 G5 G7 g3/`); tarif dosyaları volgar/dunya-baskini için oraya bakıyor.
- **Bağlananlar:** 8 Kragmir kahramanı YEŞİL tenli (G2 tam set + G1 ork savaşçı erkek); Elentha kadın savaşçı büyü pozu (YEDEK kalktı), sancak büyücü kadın + savaşçı erkek yeni; `b2d-gom.py` HALE boş. G3: Tepegöz tek gözlü, çamur adam/çöl golemi/kül şövalye/kum adam/titan/sentor okçu (yaylı) yeni; 13 eksik tür yalnız bekleme pozuyla (`b2d-g3-gom.py` PNG de okur; `savas-birim2d set()` eksik pozda bekleme): rabbit→y1, falcon/hornet/gargoyle/leader_of_barbarian→y3, lamia/snake_queen→y4, 6 ejder→yb (red_dragon(+hatchling) fire, blue ice, bone ice:renk, dark shadow, gold lightning:renk; dragon_earth/poison kullanılmadı). G4 Volgar yeni, G5 Dünya Baskını Karadun'lu, G7 şimşek → `zap` şeridi. Karakter oluşturma: Kragmir büyücü/rahip/suikastçı tam boyları + yüzler yeşil (`_tasarim/gelen/kragmir-yesil/`, `karakter-gom.py`); Kragmir yüz yuvaları 0-3 = savaşçı/suikastçı/büyücü/rahip yüzü, 4 = savaşçının aynası.
- **Kullanılmayan:** `bekleme-alternatif` (balta), `katman-pelerin`, karakter-oluşturma `kragmir_savasci_*` tam boyu (tırpanlı; savaşçı G1/G2 kılıç+kalkandan).
- GPT'ye kalan: 13 yeni türün saldırı/vurulma pozları; boss evre 2'lerin gerçek dönüşümü; mantikor/megantereon portre kırpımı; Kragmir 5. yüz.
- BEKLEYEN TESTLER'e ekle: Kragmir savaşı (yeşil pozlar), Tepegöz boss, ejder dünya bossu, Koru'da tavşan, şimşek yetenekleri.
- İlerleme ~%80. Sırada: C4 (sor), C0 kalanı, C10 kalan VFX (kutsal/gölge), C16 regresyon+telefon turu, C11 CSS göçü en sona; "Stage" Türkçesi GPT/kullanıcıda.

## ÖNCEKİ DURUM (23.11, 10. oturum)
- **Sürüm 32 YAYINDA** (509 dosya; yayın commit'i 3b78239 "C6: Karakter 2B"; sonraki yayında `git diff --name-status 3b78239 HEAD -- oyun-son`, `_tasarim` hariç). Kullanıcı: TEST YAPMA (yalnız kendi düzen kontrolüm için tek ekran görüntüsü aldım).
- **M4 maketleri** (kaynak ZIP `/root/.claude/uploads/12c01fda-.../bf397601-M4_Arayuz_Maketleri_ve_Olculer.zip`, ölçüler `olcu-*.md`):
  - **VS BİTTİ:** `ui-battle.js renderVs` → `.vs.vs2` (sol 2B tam boy `sprUrl`, orta VS arması + koşul kartı, sağ ana düşman `vsMain` tam çizim + güç, alt şerit dalga kartları + Oto + Başla). Yıldız koşulları kısaldı ("Can > %25"). CSS `v27-duzen.css` sonu `#win[data-scr="vs"]`.
  - **Sonuç BİTTİ:** `showResult` kutusuna `rz2` sınıfı, `.rz2-arma` (G8 amblemi `--amb-*`, yenilgide gri/kırık), `.rz2-alt`, `.rz2-yil` (3 büyük yıldız, yalnız stage). Eski `.rz-head`, rapor yan paneli ve döküm şeridi gizli (rapor "Savaş dökümü" düğmesinde).
  - **Karakter (C6) kısmen:** ortada 2B tam boy (`ui-kahraman.js .kx-2b`; `B2D.on` kapalıysa eski 3B + döndürme). Çanta sütunu işlev olduğu için kaldı. 2B resim kuşanılan eşyayı göstermez.
  - **Ana HUD:** v29 zaten maket düzenine yakın; dikey oyuncu kartı önceki karar gereği kaldı; dar telefonda çakışma yok. Değişiklik yapılmadı.
  - Diyalog maketi C8'de uygulanmıştı.
- BEKLEYEN TESTLER'e ekle: VS (boss, Meydan rakibi kahraman, Taş Yemini sol taraf), sonuç (yenilgi, nöbet, meydan, kule), Karakter 2B iki halk/4 sınıf.
- İlerleme ~%75. Sırada: C4 (3B malzeme/ışık — 2B yöntem seçildiği için muhtemelen gereksiz, kullanıcıya sor), C0 kalanı (sanat kitabı/referans paketi), C10 kalan VFX (şimşek/kutsal/gölge), C16 regresyon+telefon turu, C11 CSS göçü en sona; "Stage" Türkçesi ve Kragmir yeşil ten GPT'den bekleniyor.

## ÖNCEKİ DURUM (23.11, 9. oturum)
- YAYIN YOK (sürüm 31 yayında; yayın commit'i bfb64c4 → `git diff --name-status bfb64c4 HEAD -- oyun-son`, `_tasarim` hariç). Kullanıcı: orta/zor işler Opus'ta, TEST YAPMA.
- **C8 genişledi:** `ui-ogretici.js say()` artık `diyalog()` (Halvor portreli, Bran yedek SVG); `orman.js ormanIzci` Corin/Thrak; `ui-anit.js ACT.yashka` Yashka diyaloğu (son düğmeler Nöbet/Anıt). Pencere başlıkları: `sahne.js npcBas(kim, yedekSvg)` → Tüccar (Halvor) ve İksirci (Maelis) G4 yüzü; CSS `v27-duzen.css` sonu. Tarayıcıda denenmedi.
- **C13 BİTTİ:** doğrudan parametresiz ACT çağrıları tarandı, hepsi `d?.` korumalı; `ACT.building` kimliksiz/bilinmeyen binada sessiz döner.
- **C14 BİTTİ:** savaş arka planı ve VFX paketleri açılışta inmiyor; `combat.js savasOnYukle()` ← `ui-battle.js` (ACT.gate, openVs, startBattle). Doğrudan savaşta tex()/strip() kendisi indirir.
- BEKLEYEN TESTLER'e ekle: diyaloglar (Halvor satın alma sonrası, Bran 3 durum, izci iki halk, Yashka), ilk savaşta arka plan/efekt gecikmesi.
- Sırada: M4 maketleri (VS, sonuç, Karakter=C6, ana HUD), C4, C0 kalanı, C16, C11 en sona; "Stage" Türkçesi kullanıcıda.

## ÖNCEKİ DURUM (23.11, 8. oturum)
- Sürüm 31 yayında; bu oturumda YAYIN YOK (yerel commit'ler, push 403). Sonraki yayında `git diff --name-status bfb64c4 HEAD -- oyun-son`, `_tasarim` hariç. Kullanıcı: basit işleri Sonnet ajanına yaptır, TEST YAPMA.
- **C13 kısmen:** `ACT.stage/exchange/skill` (ui-battle, ui-party) ve `msgMenu` (ui-odeme) parametresiz çağrıda sessiz döner. Kalan ~120 `ACT.x = d =>` taranmadı; `ui-hub.js:367 ACT[b.act]()` parametresiz çağırıyor.
- **C15 BİTTİ:** Ayarlar → Hesap → "Emeği Geçenler" (`ui-ayarlar.js ACT.ayEmek`; yazarlar `ICON_AUTHORS`+`SKILL_ICON_AUTHORS`, CC BY 3.0). Tarayıcıda denenmedi.
- **Belge:** `_tasarim/denetim-22kas/paket/M1_VE_GPT_DUZELTME_MESAJLARI.md` = Gemini M1 mesajı + GPT düzeltme mesajı (kullanıcı kopyalayıp gönderecek). GPT bekleyenler: Kragmir yeşil ten, G1 kadın savaşçı büyü yüzü, G2 5 set gerçek alfa, G5 Karadun, G3 13 çizimsiz yaratık, G7 şimşek. Gemini bekleyen: yalnız M1 (G1–G8 teslimleri).
- İlerleme tahmini ~%65-70. Sırada: M4 maketleri (VS, sonuç, Karakter=C6, ana HUD), diyaloğu öbür NPC'lere yay, C14, C4, C0 kalanı, C11 en sona, C16; "Stage" Türkçesi kullanıcıda.

## ÖNCEKİ DURUM (23.11, 7. oturum)
- **Sürüm 31 YAYINDA** (509 dosya; yayın commit'i bfb64c4 "C5: G3 yaratık çizimleri arayüzde"; sonraki yayında `git diff --name-status bfb64c4 HEAD -- oyun-son`, `_tasarim` hariç). 2 boş yer.
- **Ansiklopedi/VS/rapor/heykel G3 çizimli:** yaratık eşlemesi (`YARATIK`, `B2D` bayrağı, paket yükleyici) three'siz yeni `js/yaratik2d.js`'e taşındı; `savas-birim2d.js` oradan alır. `ui-core mobImg` → `mobResim(id, full)`: hazırsa G3 portresi (128 px boyalı; `full` = boydan bekleme pozu, `.m2df`), değilse eski 3B portre + `data-m2d` (paket inince yerinde değişir). Renk çarpanlı türler tuvalde boyanır (Blob URL); savaş çerçevesi (`combat.js mob2b`) da aynısını kullanır. CSS `v27-duzen.css` sonu. Tarayıcıda denendi: Ansiklopedi 4 bölge, ayrıntı (Trol Kamı, Liç, Karadun), VS 1-1, savaş 1-1 hatasız.
- Sıradaki: M4 maketleri (VS, sonuç, Karakter=C6, ana HUD), diyaloğu öbür NPC'lere yay, C13 → C14 → C15, C11 en sona. Bekleyen testler listesi aşağıda (6. oturum) geçerli.

## ÖNCEKİ DURUM (23.11, 6. oturum)
- **Sürüm 30 YAYINDA** (508 dosya; yayın commit'i "C5/G3" commit'i; sonraki yayında `git diff --name-status <o commit> HEAD -- oyun-son`, `_tasarim` hariç). 3 boş yer.
- **G3 GELDİ ve BAĞLANDI (C5 yaratık/boss kısmı):** 5 ZIP (370 WebP, 102 tür: 4 bölge + ana bosslar), kaynak scratchpad `g3/` (silinebilir; ZIP'ler `/root/.claude/uploads/.../*DD_G3_*.zip`). Araç `_tasarim/araclar/b2d-g3-gom.py <açılmış klasör> .` → `js/b2d-y1..y4.js`, `js/b2d-yb.js` (OTOMATİK; bölge başına tembel yüklenir). Eşleme `savas-birim2d.js YARATIK` ([paket, tür, renk çarpanı]): 146 yaratığın 133'ü 2B; çizimsiz kalan 13 (falcon, hornet, gargoyle, leader_of_barbarian, lamia, snake_queen, 6 ejder, rabbit) 3B. Bosslar 448 px, `OLCU.boss` (1.4×), canı yarıya inince / evre / öfkede 2. evre çizimi (`spec.canli` = canlı birim, yalnız okunur). Düşman çerçevesi portresi `savas-birim2d portre(u)`; combat.js'teki eski `yb/YB` kaldırıldı.
- **M1 testi kullanıcıda** (kendisi yaptıracak). Kullanıcı 23.11: "biraz hızlanalım, testleri işler bitince not et" → TEST YAPMADAN ilerle, aşağıdaki listeye ekle.
- **BEKLEYEN TESTLER (işler bitince topluca):** (1) G3: her bölgeden bir savaş (y1–y4) + ana boss savaşı; yaratık boyu/zemin oturması, sola bakış, renk çarpanlı türler, boss 2. evre geçişi, düşman çerçevesi portresi ilk karede boş gelebilir (paket inince dolar). (2) C12 Türkçe adlar tarayıcıda (EN/TR geçişi). (3) M3 glifleri iki halkta. (4) 880×406 telefon turu, C16 regresyon.
- **Sıradaki (görsel G3 ile açılan):** Ansiklopedi/Bestiary ve VS ekranında `mobImg` hâlâ 3B portre → G3 çizimlerini kullan (ui-core'a doğrudan import döngü riski: tembel import ile). Sonra M4 maketleri, diyaloğu öbür NPC'lere yay, C13 → C14 → C15, C11 en sona.

## ÖNCEKİ DURUM (23.11, 5. oturum)
- **Sürüm 29 YAYINDA** (503 dosya; yayın commit'i "C9/M3" commit'i 3c0fb73; sonraki yayında `git diff --name-status 3c0fb73 HEAD -- oyun-son`, `_tasarim` hariç). 8 boş yer.
- **M3 (C9 glif kısmı) BİTTİ:** 40 Gemini glifi `js/glif-png.js` (OTOMATİK: `python3 -I _tasarim/araclar/gom.py _tasarim/araclar/tarif/glif.json js/glif-png.js`, cwd oyun-son; kaynak `_tasarim/gelen/m3-glif/`). `sahne.js` → `--gl-<ad>` + `html.glifli` (kapatma `dd_glif='0'`/`?glif=0`). `v27-duzen.css` "M3 glifleri": ana ekran sol/sağ rayları, alt dock, Savaş düğmesi, mini harita simgesi simge3 yerine maskeyle halk rengine boyalı (ocak #f3d2ae, sancak #cfe0f7). Pencere sekmeleri/satır simgeleri (game-icons dolgulu) DEĞİŞMEDİ — karışık görünmesin diye; kapat/geri düğmeleri boyalı PNG olarak kaldı. Kalan glifler (kilit, onay, uyarı, yenile, otomatik, hız, iksir…) savaş HUD/M4 maketleri sırasında kullanılabilir.

## ÖNCEKİ DURUM (23.11, 4. oturum)
- **Sürüm 28 YAYINDA** (511 dosya; yayın commit'i bu oturumun "Yayın sınırı: 11 küçük v10 CSS" commit'i; sonraki yayında `git diff --name-status <o commit> HEAD -- oyun-son`, `_tasarim` hariç). v10-* CSS'ler `css/v10.css`'te birleşti (−10 yer açıldı, 1'i kullanıldı → 9 boş yer var).
- **C12 BİTTİ (dil katmanı):** `js/adlar-tr.js` (OTOMATİK: `python3 -I _tasarim/araclar/adlar-gom.py .` ← `_tasarim/denetim-22kas/adlar-m5.csv` + şablon `_tasarim/araclar/adlar-kod.js`; main.js'te ui.js'ten önce yüklenir). Kimliğe göre `itemBase(id).name`, `SKILLS[id].name`, set adları (parça adlarının ortak başı), Rehber dizileri (WEAPON_NAMES/JEWEL_NAMES/ARMOR_SETS) Türkçe; 602 eşya + 169 yetenek + 44 set. EN seçiliyken asıl adlar `i18n.addDictLate` ile geri gelir (sözlük dosyalarından SONRA eklenir, var olan anahtarı ezmez: "Direnç", "Şifa", "Kalkan Duvarı" UI karşılıkları korunur). shared/ değişmedi. Node denetimi geçti; tarayıcı testi kullanıcı isteğiyle yapılmadı ("regresyon dursun").
- **Açık soru (kullanıcıya soruldu):** "Stage" terimi (40+ yer; "Stage'i geç", görev metinleri `shared/anagorev.js`) Türkçede ne olacak: Bölüm / Aşama? Karar gelince dil katmanından ya da metinlerden uygula; en-content anahtarları da güncellenmeli.
- Kullanıcı 23.11: "Regresyon dursun şimdilik" → C16/tarayıcı turları bekletiliyor.

## ÖNCEKİ DURUM (23.11, 3. oturum)
- **Sürüm 27 YAYINDA** (511 dosya = SINIR; yayın commit'i bu oturumun "Sürüm 27" commit'i; sonraki yayında `git diff --name-status <o commit> HEAD -- oyun-son`, `_tasarim` hariç). Yer açmak için: art arda yüklenen küçük CSS'leri index.html sırasıyla birleştir (v10-yon…v10-balik 11 dosya hâlâ ayrı → −10 yer).
- **23.11'de gelenler ve entegrasyon** (ayrıntı: `oyun-son/_tasarim/denetim-22kas/C3_C10_TESLIM_23KAS.md`): GPT G1, G2, G4, G5, G6, G7, G8 + Gemini M2, M3, M4, M5. **Eksik: M1, G3** (kullanıcı sonra gönderecek). Kaynak ZIP'ler kullanıcı yüklemesi (`/root/.claude/uploads/...`), açılmış hâli scratchpad `gelen/` (silinebilir); tarif dosyaları `_tasarim/araclar/tarif/*.json` bu yollara bakar.
  - **C3/C5 BİTTİ (kahramanlar + bandikut):** savaşta boyalı 2B birim `js/savas-birim2d.js` (Character arayüzü: swing/castSpell/hit/die/cheer…; kameraya dönen düzlem, poz değişimi, nefes, kırmızı parlama, ağır vuruşta hitStop+sarsıntı). Pozlar `js/b2d-sancak.js` / `b2d-ocak.js` (OTOMATİK: `b2d-gom.py <paket> .`; yaratıklar iki dosyada da). `world.spawn` `unit.b2d` varsa 2B; `combat.place` `b2dOf()` ile verir. Eski 3B: `dd_b2d='0'`/`?b2d=0`. Yaratık eşlemesi `savas-birim2d.js YARATIK` (G3 gelince genişlet). Çerçevelerde oyuncunun boyalı yüzü (`karakter-png yuzUrl`) ve yaratık başı (`portre`).
  - Savaşçı tam boyu (oluşturma/seçme) G1/G2 kılıç+kalkan bekleme pozu (`karakter-gom.py` ← `_tasarim/gelen/g1g2-savasci/`).
  - **C8 kısmen:** `js/ui-diyalog.js diyalog({kim, ad, unvan, halk, satirlar, son})` M4 ölçüleriyle; kral (`npcKing`) ve öğretici anlatıcısı yüzü bağlı. Sırada: Halvor/Maelis/Corin/Thrak (`ui-ogretici.js say`).
  - **C9 kısmen:** 203 boyalı yetenek kartı `skillIcon` (gorsel-png). M3 glifleri henüz yok.
  - **C10 kısmen:** G7'den 10 şerit `vfx-png.js` (`vfx-g7-gom.py`, 16→12 kare); şimşek/kutsal/gölge kullanılmadı.
  - **C7 BİTTİ:** G5 sahneleri `js/sahne.js` → `--sc-*` CSS değişkenleri + `html.sahneli` (`v27-duzen.css` "Boyalı sahneler"): Koru (öğretici), Maden (+oyuncunun 2B karakteri), Balık, Dipsiz Kuyu/Yeraltı Ocağı kartları, Nöbet, Baskın, Mini Dizi.
  - **G8:** `js/amblem-png.js` (sahne.js yükler) → logo karakter seçme başlığında, amblemler Taraf Seç'te.
  - Tek görsel dosyası `js/gorsel-png.js` = G4 NPC (ad, ad-yuz) + G5 + G6 (`gom.py tarif/gorsel.json js/gorsel-png.js`). Genel gömme aracı `_tasarim/araclar/gom.py`.
  - M2: Kragmir'e Elentha arka planı gelmez (`savas-arka.js pickBg`).
- **KULLANICI KARARLARI (23.11, kesin):** (1) Açılış resmi `img/korant-acilis.jpg` OLDUĞU GİBİ KALIR, değiştirme. (2) **Dil bütünlüğü:** oyun TR seçiliyken HER ŞEY Türkçe, EN seçiliyken HER ŞEY İngilizce (eşya/yetenek adları dahil; M5 `adlar.csv` önerisi TR adları için onaylı sayılır). Kimlikler değişmez; TR adları dil katmanında (i18n) uygulanmalı, `shared/` mekaniğine dokunma. Karışık dizeler ("Stage'i geç", "Priest Cap", "Holy Attack") TR'de kalmamalı. (3) **Orklar YEŞİL tenli** (G4 Thrak gibi). G2 Kragmir kahramanları ve karakter oluşturmadaki Kragmir tam boyları/yüzleri GRİ → GPT'den yeşil tenle yeniden istenmeli (ya da güvenli renk kaydırma denenebilir); G3 orksu yaratıklar da yeşil.
- **GPT'ye geri bildirim:** G1 Elentha kadın savaşçı `buyu` pozu başka yüz (şimdilik `zafer`), G2'de 5 sette opak beyaz zemin (kodla temizlendi), G5 Dünya Baskını'nda Karadun silüeti yok.
- **Sıradaki işler:** M4 maketleri (VS, sonuç, Karakter=C6, ana HUD), M3 glifleri (C9), diyaloğu öbür NPC'lere yay, C13 → C14 → C15, G3+M1 gelince yaratık aileleri/bosslar 2B, C11 en sona.

## ÖNCEKİ DURUM (22.11 gece, 2. oturum)
- **Sürüm 26 YAYINDA** (511 dosya = SINIR; yayın commit'i **0cf3ae8** ve sonrası; sonraki yayında `git diff --name-status 0cf3ae8 HEAD -- oyun-son`, `_tasarim` hariç).
- **YENİ ÇALIŞMA DÜZENİ: GÖREV PAKETİ** (kullanıcı 22.11'de gönderdi). Üç model: GPT (görsel G1–G8), Gemini (denetim M1–M5), ben (kod C0–C16). Paket: `_tasarim/denetim-22kas/` altındaki notlar + ana rapor yapıtı https://claude.ai/artifact/831ytxuR3nEuTZvsbEAtxy ("Demir Diyarı Ana Denetim", 47 sorun, puan 44/100; sorun kodları K1–K5 kritik, Y1–Y11 yüksek, O1–… orta, D1–… düşük, G1–G6). Paket ZIP'i scratchpad'de silinmiş olabilir; görev tablosu aşağıda.
- **Benim görevlerim (C)**: C0 sanat kitabı/istem dosyalarını depoya koy · **C1 BİTTİ** · **C2 BİTTİ** · C3 2B boyalı savaş birimi pilotu (GPT G1 gelince; yeni `js/savas-birim2d.js`, combat.js yalnız çizim katmanı, bayrakla eski çizime dönüş) · C4 3B malzeme/ışık pilotu (aynı kamera) · C5 seçilen yöntemi yay (16 kahraman, yaratık aileleri, bosslar, Ansiklopedi, VS) · C6 Karakter penceresi 2B + 13 yuva (Gemini M4 maketi, ±4 px) · C7 yer tutucu sahneler (GPT G5) · C8 diyalog bileşeni + NPC portreleri (G4) · C9 simge birliği (G6 yetenek kartları, M3 glifleri) · C10 VFX (G7) · C11 CSS göçü (token, 4 düğme rolü, tek amblem, ≤3 sayaç; v8…v33 boşalt) · C12 ad tablosu (adlar.csv ÇIKARILDI → `_tasarim/denetim-22kas/adlar.csv`, 901 satır; Gemini M5 önerisi + kullanıcı onayı gelince yalnız `shared/items*.js` ad alanları) · C13 parametresiz ACT çağrılarına koruma (skill, exchange, stage, msgMenu) · C14 tembel yükleme (savaş arka planı, VFX) · C15 Emeği Geçenler (CC BY) · C16 regresyon/yayın/telefon turu.
- Sıra: G1 gelince Gemini M1 denetler → ben C3+C4 → kullanıcı yöntemi seçer → C5… Son: G6, G7, C11, C12, G8. **KULLANICI KARARLARI (22.11, kesin):** oyunun tek adı **Korant** (Demir Diyarı adı yerine geçecek; C11/arayüz metinlerinde uygula) · Savaşçı **kılıç + kalkan** (tırpan değil) · ~~İngilizce adlar KALSIN~~ **KARAR DEĞİŞTİ (22.11, son): eşya/yetenek adları TÜRKÇELEŞTİRİLECEK** → C12 geçerli: `_tasarim/denetim-22kas/adlar.csv` (901 satır, Gemini M5 önerisi) + `yetenekler.csv` (kökte, 203 yetenek; adlar yine Türkçeleştirilecek, simge dosya adları kimliğe bağlı olduğundan etkilenmez); kullanıcı onayından sonra yalnız `shared/items*.js` ve `shared/skills.js` ad alanları, mekaniğe dokunma · yaratıklar **3 pozlu** · **yaratık çizimlerini Gemini yapacak, GPT değil** (GPT kahraman/sahne/simge; görev dağılımını buna göre düşün).
- **Sonraki adım (önerildi, onay bekliyor):** görsel istemeyen işler sırayla C13 → C14 → C15 → C0 kalanı (sanat kitabı/referans paketi) → C8 diyalog kodu → C4; C11 en sona. Görsel bekleyenler: C3 (G1+M1), C5 (seçim), C6 (M4), C7 (G5), C8 portre (G4), C9 (G6+M3), C10 (G7).
- Gemini ekleri kullanıcıya gönderildi: adlar.csv (M5), akis_ELENTHA_insan.mp4 + akis_KRAGMIR_ork.mp4 (M2; önceki oturum scratchpad'inden). M1 için GPT teslim ZIP'i bekleniyor.
- **C1 yapılanlar** (`_tasarim/denetim-22kas/C1_HIZLI_DUZELTMELER.md`): K5 `itemPng` eşsiz/set zırh + elementli takı → boyalı simgesiz taban 216→0 · Y4 `api.js devUI()` (test araçları/DENEME rozeti yalnız `?dev=1` ya da `localStorage dd_dev='1'`; ACT.dev* çalışır), "[Ünvan]" yerine "Unvan seç" · Y9 `ui-duyuru.js` bildirim kuyruğu (1 kart, pencere/diyalog/savaşta bekler, 2,6 sn, üst orta ince şerit; simge görünmüyordu: sarı zemine sarı) · Y3 sonuç başlığı tam genişlik Cinzel + yıldız 44 px · O6 `.nb-boss` şeridi · D3 `pct/pctTxt` virgül · G6 `orient.js html.narrow` (<760) + `YERLESIM_SPEC.md` 8.1 güncel. Yeni CSS hep `css/v27-duzen.css` SONUNDA.
- **C2 sonucu** (`C2_HD_MODEL_RAPORU.md`): modeller yükleniyor; ama kahraman hep prosedürel (`gorunus.js SKINNED_HERO=false`), hayvanlar `BeastCharacter` (55/146), insansıların yalnız 25/91'inin modeli var; 100 stage'in 16'sında iskeletli düşman. Kademe sorunu değil → 2B pilot önerisi güçlendi.
- **ui-denetim.js iki halk tam turu BİTTİ (22.11): her halkta 88 ekran, 74 açıldı, 0 hata.** Açılmayan 14 ekran incelenmedi (yeni karakterde kilitli olabilir) → C13'e başlarken bak. Hâlâ test edilmedi: gerçek nöbet akışında boss şeridi, 667×375/915×412/1180×820 dock ölçümü, gerçek telefon.
- Eski sıradakiler (görev paketi bunları kapsıyor): boss savaşı HUD'u, ekipman ekranı (=C6), Kervan/Görevler maketi, savaş sonucu maketi, menu-kutu, P5 sayfa içleri. Eksik listesi `_tasarim/EKSIK_LISTESI.md`.

- **G6 yetenek simgeleri (22.11):** `yetenekler.csv` (kök, commit'li, push 403) GPT'ye verilecek; simge adı `yetenek-<kimlik>.png` 256×256 çerçevesiz; 203 yetenek (172 öncelik 1). M1 için GPT G1 teslim ZIP'i hâlâ bekleniyor (Gemini de istedi).

## Yayın
- ASIL KOD = `oyun-son/`. KENDİ YAYINIMIZ: https://claude.ai/artifact/GwNoLLWnf5Wjc1PUJep2yi (git'te karşılığı HEAD; oyun-son, `_tasarim/` hariç).
- Kurallar: sayfa = `oyun-son/index.html`, `root` = oyun-son, `files` haritası; tek gönderimde ≤255 dosya, **bir sürümde ≤511 dosya** (aşınca 422) → yeni dosya için önce bir şey çıkar ya da büyük görsel setlerini JS/CSS'e göm. Silme = `null`. Yalnız değişenleri gönder.
- Adımlar: önce `list scope=files`; ilk publish "live version viewed değil" reddi verebilir → aynısını tekrar gönder (gerekirse 3. kez).
- Yayından çıkarılan, yerelde duran: `models/test/Xbot.glb.js`, `video/README.txt`, `img/items3d/*`, `img/kd/simge3/simge-{akce,enerji,kulce,san,yakut}-*`.
- Kaynak artefakt (kullanıcının, kuruluş dışı; okunur, yayımlanamaz): https://claude.ai/artifact/KUfQG1bV27JFGDTjpBwEdk, son eşitleme 20.11 (sürüm 1795210613-46a1). "Son hali çek" denirse: `list scope=files` → yerel sha256 ile karşılaştır → farklıları `read paths` ile scratchpad'e indir → bizim değişikliklerimizi koruyarak birleştir.
- Git dalı `claude/add-skill-repos-rne7at`; push hep 403 (GitHub uygulaması kurulu değil). Commit'ler yerelde; kullanıcıya söyle.

## Sistemler ve araçlar (OTOMATİK = elle düzenleme, aracı çalıştır)
- **CSS şablonları** (`_tasarim/araclar/`): `v31-sablon.css` → `v31-gom.py .` → `css/v31-savas-hud.css` (--g = 1 maket pikseli); `v32-sablon.css` → aynı araç → `css/v32-p2340.css` (ortak pencere şablonu, kral diyaloğu, Diyar Haritası, ana merkez parçaları); `v33-sablon.css` → `v33-gom.py .` → `css/v33-karakter.css`; `v26-sablon.css` → `v26-gom.py` → `css/v26-gpt4.css`. Elle yazılan katmanlar: `v27-duzen.css` (ortak düzen), `v28-paket345.css` (harita etiketleri, alt şerit), `v29-anaekran.css` (ana ekran), `v30-savas.css`. Stil katmanları v8…v33, çok `!important`.
- **Gömülü görsel JS'leri** (WebP base64 → Blob URL): `js/esya-png.js` (`esya-gom.py`; 96 eşya simgesi, `item-icons.js itemPng`), `js/portre-png.js` + `js/vfx-png.js` + `js/grafik5-png.js` (`p345-gom.py <p3> <p4> <p5> <oyun-son>`), `js/hikaye-png.js` (`hikaye-gom.py .`; kral portreleri, yemin-1..4, diyar), `js/savas-arka-png.js` (`savas-arka-gom.py <webp> .`), `js/karakter-png.js` (`karakter-gom.py .`; 2B tam boy + 20 yüz).
- **Haritalar**: `sahne.py <kaynak> <oyun-son> [kontrol]` (opencv-python-headless + scipy) → `img/kd/sehir/<yer>/sahne.webp`, `atlas.webp`, `js/hub2d-data.js` (OTOMATİK). Kaynak 2340 px: `_tasarim/gelen/sehir-2340/`, yerler sancak/ocak/carsi/klan-ocak/klan-sancak. `hub2d.js`: resmin TAMAMI görünür (yanlar bulanık), sürükle/yakınlaştır, basınca kesit parlar → `ACT.building`. Kimlikler: başkentte wheel, clanhq (Kral Otağı), anvil, iksir, karaborsa, carsi, mine, monument, portal (`portalMenu`), gate (`gateMenu`), king; çarşıda c_silah/c_zirh/c_sarf (`tuccarSub`), c_taki, pazar, karaborsa, yashka, pier (şelale = Balık Tut), portal; klanda k_salon, k_hq, k_hazine, k_dukkan, k_hisar, k_av, k_gorev, k_sancak, gate, portal. Etiketler yalnız beyaz bina adı. `localStorage dd_hub2d='0'` eski 3B kasaba.
- **Savaş**: yandan 3/4 görünüş, `combat.js FORM` (1–5 birim), dinamik kamera `js/savas-kamera.js` (`window.DD_CAM`; rapor `_tasarim/teslim-kamera/`), boyalı arka planlar `js/savas-arka.js` (`BY_KIND`, `LIGHT`). Savaşta Tur sayacı, Sıra Sonu, sohbet, sıra şeridi YOK (kullanıcı kararı). OTO her seviyede, hız OTO'dan bağımsız (PvP'de kapalı). Efekt şeritleri `fx.js strip()` (`window.DD_FX.strip`).
- **Karakter oluşturma**: `js/ui-olustur.js` (kök `#olz.vz`, `.vz-*`), referans `_tasarim/gelen/karakter-son/00_REFERANS/ONAYLI_KARAKTER_OLUSTUR.png`; varsayılan Elentha → kadın Savaşçı, Kragmir → erkek Savaşçı (`SIDE_DEF`). Seçme ekranı (`ui-karakter.js`) 2B tam boy. Oyundaki 3B kahraman değişmedi.
- **Ana ekran**: `v29-anaekran.css` (dikey oyuncu kartı solda, Görevler tek satır sohbet ile dock arasında, sohbet şeridinde kanal sekmeleri `cbTab`). Pencere sekmeleri HEP SOLDA (`ui-core drawWin`). Pencere amblemleri `ui-core embOf`.
- **Ses**: tema müziği `audio/kizil-goz.mp3` (`sfx.js MUSIC_URL`, başkent+pazar+fragman); savaş/boss ezgileri hâlâ sentez.
- GPT teslim kayıtları: `_tasarim/gelen/` (paket1–5, p2340, karakter-son, karakter-v2, savas-arka, v16…). GPT'ye istek notları: `_tasarim/gpt-paket/`.

## Test
- Sunucu: `python3 -m http.server 8765 -d oyun-son` (konteyner yeniden başlarsa tekrar aç).
- Betikler scratchpad `t/` altında (silinmiş olabilir, yeniden yazılır): sv.js, fn.js (savaş HUD; R=ocak|sancak W H O EVAL), kam.js, dokun.js, vztam.js (karakter oluşturma), oyun.js. 22.11 betikleri `_tasarim/araclar/c1c2/` (hub.js ortak giriş; c2.js <gfx> <halk> <stage> çizim sınıfları; g6.js <W> <H> dock ölçümü; y3.js gerçek savaş sonucu; c1g.js profil/çanta/nöbet; k5.js boyalı simge sayımı; adlar.mjs <çıktı.csv>) — scratchpad `t/` içine kopyalayıp oradan çalıştır. Görev paketi belgeleri `_tasarim/denetim-22kas/paket/`. Kalıcı araçlar `_tasarim/araclar/`: `duman-test.js`, `ui-denetim.js`, `kontrast.py`, `ui-akis.js`, `eksik-liste.py`.
- Ölçü 880×406, deviceScaleFactor 2.66 (ayrıca 1024×768, 1280×720). Akış: `.ld-go` → `[data-o=race]` (0=Elentha, 1=Kragmir) → ad + Oluştur → `#tkenter` → "Geç" → `.tskip`. Tıklamaları `page.evaluate(el.click())` ile yap (üst katmanlar engelliyor). Testleri sırayla çalıştır, `timeout 115`.
- Hiç test edilemeyenler: gerçek telefon, Android geri, PvP, ödeme, klan içi ekranlar.

## Oyun içeriği (özet)
- 2 halk: Kragmir/ork (`ocak`), Elentha/insan (`sancak`); `p.faction`, `html[data-faction]`. 4 sınıf (`shared/content.js`; oyunda Şifacı/Şaman adları). Bölgeler `shared/zones.js` (Vahran Ovası 1–20, Kül Geçidi 20–40, Kızıl Bahar Meydanı 40–60, Sisli Çukur 60–65). Bosslar: Dev Solucan, Tepegöz, Kristal Muhafızı, Lav Yürek, Kül Ağası Karadun, Mareşal Marven, Adsız. Ana görev 64 adım (`shared/anagorev.js`). Krallar: Volgar Demirdiş (Kragmir), Edran (Elentha).
- Yerel kip: `window.DD_LOCAL = true`, kayıt localStorage. Ölçek `js/orient.js` (`--lw --lh --s`); dik telefonda gövde 90° döner.
- Eşya: 3 derece Standart #b9c0c8 / Nadir #4aa3ff / Eşsiz #ffb52e; savaşta temel + 5 yetenek + 2 iksir.

## GPT teslim denetimi (her pakette)
- İndirilen ZIP'i ayrı boş klasörde aç, `python3 -I` kullan. Biçim yalnız PNG/JPEG/WebP (AVIF, SVG, BMP/TGA/TIFF yasak; GLB → `.glb.js`). Alfa denetimi (boş% > 85 → bozuk), ölçü, iki halk eşliği, sha ile önceki paketlerle karşılaştır. Sonra WebP'ye çevir, entegre et, test et, ekran görüntüsü gönder, yayımla.
- Zayıf/uyumsuz parçaları kullanma, nedenini kullanıcıya söyle.

## Diğer notlar
- Heredoc python bazen güvenlik denetimine takılır: betiği dosyaya yazıp çalıştır.
- PDF: reportlab + DejaVu yazı tipleri (Türkçe karakter).
- Silah/yetenek adlarının çoğu İngilizce/Knight Online kaynaklı (Mirage Dagger, Iron Impact…); Türkçeleştirme önerilebilir.
- Paylaşım hatası ("…JPEG, PNG, GIF veya WebP…") çıkarsa sebep gömülü AVIF olabilir (GLTFLoader/FBXLoader içi dizgeler).
