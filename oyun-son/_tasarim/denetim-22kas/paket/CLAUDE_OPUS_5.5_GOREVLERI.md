# Claude Opus 5.5 · Demir Diyarı kod, entegrasyon ve doğrulama görevleri

Claude depoya erişir, oyunu çalıştırır ve yayımlar; bu yüzden **koda dokunan her iş** ve **oyun içi doğrulama** Claude'dadır. Claude görsel üretemez, bu yüzden boyalı varlıkları GPT üretir. Claude, Gemini'nin kabul ettiği varlıkları oyuna gömer ve oyun içinde iki halk için ekran görüntüsüyle doğrular. Kurallar:
- `shared/` dosyalarına (mekanik) dokunulmaz.
- Her değişiklik önce/sonra görüntüsü ve `ui-denetim.js` sonucuyla teslim edilir.
- Yayın sınırı 511 dosyadır; yeni setler gömülü JS olarak eklenir.

| ID | Görev | Dosyalar | Kabul |
|---|---|---|---|
| C0 | Sanat kitabını, referans paketini ve GPT/Gemini istem dosyalarını depoya koymak | `_tasarim/denetim-22kas/` | Dosyalar git'te |
| C1 | Hızlı düzeltmeler: eşsiz ve set zırhlar boyalı simge alsın (`itemPng`); test araçları, "Deneme Sürümü" rozeti ve "[ÜNVAN]" bayrakla gizlensin; bildirim kuyruğu (diyalog ve pencere açıkken ertelenir, kırık simge düzelir); sonuç başlığının kırpılması; Kristal Nöbeti taşması; ondalık biçimi; 667×375'te dock ile Görevler çakışması ve kaybolan enerji sayacı; `YERLESIM_SPEC.md` bugünkü düzene göre güncellenir | `js/item-icons.js`, `js/ui-hub.js`, toast kodu, `js/ui-battle.js`, v24/v25/v30 CSS | İki halkta önce/sonra; `ui-denetim.js` hatasız; 667×375, 880×406, 915×412 ve 1180×820'de dock tam görünür |
| C2 | Kök neden: Yüksek kademede de savaş figürleri En Düşük kademeyle aynı görünüyor. İskeletli HD modeller yükleniyor mu? | `js/main.js`, `js/models.js`, `models/models.json`, `js/gfx.js` | `DD_GFX.stats()` çıktısı, yüklenen model listesi, iki kademenin aynı kameradan görüntüsü |
| C3 | Savaş birimi pilotu A: 2B boyalı karakter (GPT G1 pozları) ve basit iskelet ya da poz geçişi; arka plan ışığından kenar ışığı; elips gölge | Yeni `js/savas-birim2d.js`, `js/combat.js` (yalnız çizim katmanı), `js/savas-kamera.js`, `js/fx.js` | Aynı stage'de 3B ile yan yana görüntü; kare süresi ölçümü; kullanıcı seçimi |
| C4 | Savaş birimi pilotu B: mevcut 3B modelde malzeme ve ışık iyileştirmesi (karşılaştırma için) | `js/models.js`, `js/engine3d.js` | C3 ile aynı kamera; kullanıcıya iki görüntü |
| C5 | Seçilen yöntemi yaygınlaştırma: 16 kahraman, yaratık aileleri, bosslar; Ansiklopedi ve VS ekranı aynı kaynaktan | `combat.js`, `ui-battle.js`, `ui-rehber.js`, gömme araçları | Her bölgeden 1 stage ve 1 boss, iki halk |
| C6 | Karakter (ekipman) penceresi: 2B önizleme ve 13 yuva (Gemini M4 maketi) | `js/karakter-sahne.js`, `v33-sablon.css` | Maket ölçü dosyasına ±4 px |
| C7 | Yer tutucu sahnelerin bağlanması (GPT G5) | `ui-town.js`, `ui-battle.js`, `ui-nobet.js`, `ui-baskin.js`, `ui-minidizi.js` | Önce/sonra |
| C8 | Diyalog bileşeni (görsel roman düzeni), NPC portreleri (GPT G4) | `ui-hub.js npcKing`, öğretici kodu | Metin kesilmez; bildirim örtmez |
| C9 | Simge birliği: yetenek kartları (G6), C sınıfı glifler (M3), Kervan ve Meydan simgeleri | `skill-icons.js` yerine `yetenek-png.js`, `simge3` yerine glif seti | `ui-denetim.js` bütün ekranlar |
| C10 | VFX değişimi (G7) | `vfx-png.js`, `fx.js` | Element başına 1 görüntü; düşük kademede okunur |
| C11 | CSS göçü: token ve bileşen dosyaları, 4 düğme rolü, modal standardı, tek amblem, en çok 3 sayaç | `css/kd-tokens.css` ve yeni bileşen dosyaları; v8…v33 boşaltılır | Her adımda iki halk görüntü karşılaştırması ve `kontrast.py` |
| C12 | Ad tablosu: `adlar.csv` çıkarılır (M5 için); kullanıcı onayından sonra yalnız görünen adlar değişir | `shared/items*.js` **yalnız ad alanı** (kullanıcı onayıyla) | Kimlikler aynı; kayıtlar bozulmaz |
| C13 | Parametresiz çağrılara koruma: `skill`, `exchange`, `stage`, `msgMenu` | `ui-party.js`, `ui-battle.js`, sohbet menüsü | Bozuk girdide çökme yok, normal akış aynı |
| C14 | Tembel yükleme: savaş arka planı ve VFX yalnız gerektiğinde | `savas-arka.js`, `vfx-png.js` yükleyicisi | İlk açılış süresi önce/sonra |
| C15 | Emeği Geçenler ekranı (CC BY atfı) | Ayarlar | Ekran açılır |
| C16 | Regresyon, yayın ve kullanıcının telefonunda tur | — | Kullanıcı geri bildirimi |
