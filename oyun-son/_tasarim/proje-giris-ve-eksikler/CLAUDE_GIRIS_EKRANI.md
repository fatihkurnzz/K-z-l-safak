# Oyuna Giriş / Sunucu Seçimi ekranı — kod görevi

Referans: `REFERANS/giris_ekrani_sunucu_secimi.png` (1671×941, GPT yapımı tasarım; metinler görselin içine gömülü — oyunda
**gerçek metin ve düğme** olarak kurulacak). Mevcut açılış kodu: `REFERANS/kod_ui-acilis.js.txt` (js/ui-acilis.js),
`REFERANS/kod_ui-giris.js.txt` (js/ui-giris.js), CSS `css/temel.css` 2115–2145 (`#loading .ld-*`).

## Hedef görünüm (görselden)
- Tam ekran savaş sahnesi: solda Elentha şövalyesi (mavi sancak, beyaz kale), sağda Kragmir orku (kırmızı sancak, lav/kale).
- Üst orta: **KORANT ONLINE** logosu + "Powered by BES Game".
- Orta: dekoratif altın çerçeveli **SUNUCU SEÇİMİ** paneli. Başlık şeridi kırmızı, üstünde mavi elmas.
  Sütunlar: *Sunucu Adı · Durum · Nüfus* (üstte küçük simgeler: yığın, nabız, kişiler).
  Satırlar (yuvarlatılmış koyu şerit, solda durum ışığı):
  | Sunucu | Işık | Durum | Nüfus |
  |---|---|---|---|
  | Ares (seçili: altın parlak çerçeve) | yeşil | Aktif (yeşil) | Yüksek (kırmızı) |
  | Zeus | yeşil | Aktif | Orta (sarı) |
  | Hera | yeşil | Aktif | Orta (sarı) |
  | Titan | gri | Kapalı (gri) | – |
  Panel altında silik aslan arması.
- Alt orta: **OYUNA GİR** büyük mavi-altın düğme, iki yanında altın kanat/aslan süsü, üstünde mavi elmas.

Ölçüler (1671×941 görselde, orantı olarak kullan): panel x 590–1085, y 295–730; satırlar y≈457/505/553/601 (yükseklik ≈44);
düğme x 530–1055, y 770–860; logo üst orta y 20–260.

## Mevcut durum (yapılacak değişiklik)
Şimdi: yükleme çubuğu %100 olunca altta tek sunuculu (Ares) küçük bir şerit + "Giriş yap / Oyuna gir" düğmesi çıkıyor
(`showStart()` → `#loading.ready`). `SERVERS` tek elemanlı; `localStorage dd_server` seçimi saklıyor. Sunucu derlemesinde
oturum yoksa ardından `ui-giris.js` (kullanıcı adı + şifre) açılıyor.

## Görevler

**G1 · Yapı (js/ui-acilis.js)**
- `SERVERS` = Ares, Zeus, Hera, Titan; alanlar `{id, name, state:'aktif'|'kapali', pop:'yuksek'|'orta'|null}`.
  Yalnız **Ares gerçekten çalışır** (`shared/content.js SERVER.name`); Zeus/Hera görünümde Aktif ama seçilince
  not: "Bu sunucu yakında açılıyor" ya da — kullanıcı onayına göre — yalnız Ares seçilebilir olsun. **Karar yoksa: Zeus ve
  Hera seçilebilir ama giriş Ares'e yönlenir; Titan seçilemez (kapalı, soluk).** Seçim `dd_server`'a yazılır.
- Yükleme çubuğu bitmeden **panel görünmesin**; çubuk bitince panel yumuşak belirsin (opaklık+yukarı kayma 250 ms, `prefers-reduced-motion` hariç).
- Düğme etiketi: LOCAL ya da token varsa "OYUNA GİR", yoksa da "OYUNA GİR" (giriş penceresi sonra açılır; mevcut akış aynen).
- Klavye/erişilebilirlik: satırlar `role="radiogroup"/"radio"`, Enter ile giriş, odak halkası altın.

**G2 · Yerleşim (css/duzen.css SONUNA, `/* ===== Giriş ekranı 2 ===== */`)**
- Ölçü hedefi 880×406 (yatay telefon), ayrıca 1024×768, 1280×720; görselin tamamı `cover`, yüzler kesilmesin
  (`background-position: center 30%`).
- Panel genişliği ≈ %30 (en az 250 px, en çok 420 px), sunucu satırı yüksekliği ≥ 32 px (dokunma), düğme ≥ 40 px.
- Logo üstte, panel logonun altında ortada, düğme panelin altında; 406 px yükseklikte hepsi kaydırmasız sığmalı
  (gerekirse logo ve panel küçülür: `clamp()` + `--s` ölçeği, `js/orient.js`).
- Çerçeve: ilk aşamada CSS (altın çift kenar, köşe süsleri, kırmızı başlık şeridi, mavi elmas `clip-path`/`conic-gradient`);
  GPT çerçeve görseli gelince (`GPT_GIRIS_GORSEL_ISTEGI.md`) 9-dilim `border-image` ile değiştir.

**G3 · Arka plan**
- Kullanıcı kararı (23.11): `img/korant-acilis.jpg` **olduğu gibi kalır**. Bu görsel o resim DEĞİL (panel ve logo gömülü).
  Bu yüzden: `img/korant-acilis.jpg` arka plan olarak kalsın; yeni tasarımın panel/logo/düğmesi onun üzerine bindirilsin.
- GPT temiz arka planı (yazısız, panelsiz) gönderirse `img/korant-giris-bg.webp` olarak ekle, `#loading .ld-art`'a ver;
  eski resim yedek. Yeni görseli yayında dosya sayısına dikkat ederek ekle (26 boş yer).

**G4 · Giriş formu ile uyum (js/ui-giris.js)**
- `gr-logo` başlığındaki "Sunucu: Ares" seçilen sunucuyu göstersin (`localStorage dd_server`).
- Form kutusu aynı altın çerçeve dilini kullansın (CSS değişkenleri ortak: `--kd-old-gold`, `kd-tokens.css`).

**G5 · Dil**
- Tüm metin i18n üzerinden TR/EN: "Sunucu Seçimi / Server Select", "Sunucu Adı / Durum / Nüfus", "Aktif / Kapalı", "Yüksek / Orta / Düşük", "Oyuna Gir / Enter Game", "Yakında".
- "Powered by BES Game" logonun altında **olduğu gibi** (çevrilmez).

**G6 · Kapanış**
- `html.giris2` bayrağı, `?giris=0` kapatma. `node --check`. Tek ekran görüntüsü (880×406) ile düzen kontrolü.
- `EKSIK_LISTESI_SON.md` 2B'ye ekle: giriş ekranı gerçek telefonda (dokunma, Titan seçilemez, Zeus/Hera not, klavye açılınca
  giriş formu, Android geri tuşu).
- Sunucu mantığına (hesap, çoklu sunucu) dokunma: yalnız görünüş; çoklu sunucu 2C-5'te.
