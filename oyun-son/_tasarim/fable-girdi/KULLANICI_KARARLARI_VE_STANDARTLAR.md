# Kullanıcı kararları ve korunacak standartlar (Korant Online)

Kaynak: kullanıcının oturum mesajları; depodaki oturum hafızası `CLAUDE.md` (kök) ve `oyun-son/_tasarim/` belgeleri. Tarih sütunu kararın ilk kaydedildiği günü gösterir (2026). Bir karar sonradan değiştiyse son hâli yazılıdır, değişiklik notu ekte.

## A. Oyun kimliği ve görsel konsept
| # | Karar | Tarih | Doğrulama yolu |
|---|---|---|---|
| A1 | Oyunun adı **Korant** (sayfa başlığı "Korant Online"; `shared/content.js GAME.name`). Eski "Demir Diyarı" adı arayüzde kullanılmaz. Hikâye: *Vahran: Tarihin Külleri*. | 22.11 | `index.html` `<title>`, `shared/content.js:5` |
| A2 | Görsel konsept: gerçekçi, profesyonel, **tek parça boyanmış 2B dark fantasy** sahneler; ayrı sprite + boş zemin BEĞENİLMEDİ; sade, az altın. | 20–25.11 | `_tasarim/denetim-22kas/paket/SANAT_KITABI.md` |
| A3 | Elentha (insan, `sancak`, mavi-altın) ve Kragmir (ork, `ocak`, kızıl-kara) **eşit kalite ve eşdeğer HUD**; armalar korunur. | 22.11 | iki halk çekim turları |
| A4 | **Kragmir orkları YEŞİL tenlidir** (kahraman, NPC, yaratık). | 23.11 | `js/b2d-ocak.js`, `_tasarim/gelen/kragmir-yesil/` |
| A5 | Savaşçı **kılıç + kalkan** taşır (tırpan değil). | 22.11 | `js/b2d-*.js savasci-*` |
| A6 | T3 (Sv.45 savaşçı özel) görünümü **KAPALI** (yeşil ten/kalkan kuralına aykırı çizim). `?t3=1` yalnız deneme. | 26.11 | `js/yaratik2d.js T3_AC` |
| A7 | Açılış resmi `img/korant-acilis.jpg` olduğu gibi kalır. | 23.11 | dosya sha |
| A8 | Oyun yalnız **yatay** çizilir; hedef telefon mantıksal ölçüsü **880×406** (2340×1080, dpr 2,66). | 26.11 | `js/orient.js` |

## B. Korunacak görseller
| # | Karar | Tarih |
|---|---|---|
| B1 | Onaylı **42 sahne** (29 `sahneler/` + 13 `interiors/`) değişmez. Tek istisna: `sahneler/zafer_aniti.webp` için **aynı kadrajın yüksek çözünürlüklü** sürümü istendi (P34-01; GPT 2048×868 seçildi, Gemini'nin 1600×678 sürümü kullanıcı tarafından KABUL EDİLMEDİ). | 25–26.11 |
| B2 | **Onaylı başkent görselleri değiştirilmez**; başkent = yalnız fotoğraf (P28). | 25.11 |
| B3 | **Çevre animasyonları yalnız ayrı katmanla** (fotoğrafın üstünde saydam tuval; fotoğraf pikseli değişmez). | 26.11 |
| B4 | Mevcut başarılı varlıklar üretime geri gönderilmez. | 26.11 |

## C. Mekanik, ekonomi, içerik
| # | Karar | Tarih |
|---|---|---|
| C1 | **Yetenek, ekonomi, denge ve savaş mekanikleri izinsiz değiştirilmez** (`shared/` klasörü mekaniktir). | sürekli |
| C2 | **Mevcut oyuncu kayıtları korunur** (yerel kayıt `localStorage dd_local_world_v2`, `SAVE_V = 2`; kayıt uyumluluğu testi P33'te var). | sürekli |
| C3 | **İlk yayında gerçek para sistemi kullanılmaz** (ödeme ekranları "Yakında"; yerel kipte satın alma kapalı). Sonra önce kozmetik; avantaj satışı ancak sunucu gelince. | 23.11 |
| C4 | Yayın hedefi **Google Play Store**; ilk sürüm **yerel kayıt** (sunucu sonra); 2. sezon ilk sürümden sonra. | 23.11 |
| C5 | Sunucu adı **Ares** (yalnız Ares listelenir; diğer adlar açılınca eklenir). | 24.11 (`shared/content.js SERVER`, `js/ui-acilis.js`) |
| C6 | **Türkçe terminoloji / dil bütünlüğü:** TR seçiliyken her şey Türkçe, EN seçiliyken her şey İngilizce. Eşya/yetenek adları kimliğe bağlı dil katmanında Türkçe (`js/adlar-tr.js`); "Stage" → "Aşama". | 22–23.11 |
| C7 | **Mevcut eşya isimleri izinsiz değiştirilmez** (Türkçeleştirme onaylı tabloyla yapıldı; kimlikler değişmez). | 22–26.11 |
| C8 | **Mini Dizi video üretimi kapsam dışı**; mevcut Mini Dizi sistemi (`shared/minidizi.js`, `video/README.txt`, kapak resimleri) korunur. P34-10 başarısızlık sayılmaz. | 26.11 |
| C9 | **Canavar ve boss görsel üretimi yeniden açıldı** (P34-06/07); yetenek çalışması ertelendi. | 26.11 |
| C10 | Savaşta tur sayacı, sıra sonu, sohbet, sıra şeridi YOK; OTO her seviyede; PvP'de hız kapalı. | 21–22.11 |
| C11 | Test paneli (profil "TEST ARAÇLARI") web derlemesinde **varsayılan görünür**; `?dev=0` gizler. Play Store profili (`DD_STORE`/`?store=1`) her durumda gizler ve URL ile açılamaz. | 24.11 |
| C12 | HUD dahil en küçük yazı **11 px**. | 26.11 |

## D. Telif, lisans, fikrî mülkiyet riskleri (Fable bağımsız değerlendirmeli)
| Konu | Durum | Risk |
|---|---|---|
| Yapay zekâ ile üretilmiş görseller (GPT, Gemini) | Kahraman, yaratık, sahne, NPC, katman, yetenek kartı görsellerinin çoğu | Mağaza politikaları ve üretim aracı kullanım koşulları; teslim kayıtlarında araç/lisans beyanı yok ya da eksik. **DOĞRULANMADI.** |
| Eşya/yetenek adlarının bir kısmı başka bir MMO'dan (Knight Online benzeri adlar, örn. "Mirage Dagger", "Iron Impact") | TR'de Türkçe karşılık gösteriliyor; **EN dilinde özgün adlar duruyor** | Marka/telif benzerliği. EN adları gözden geçirilmeli. |
| Simgeler (game-icons.net) | Ayarlar → Hesap → Emeği Geçenler (CC BY 3.0, yazar listesi `ICON_AUTHORS`, `SKILL_ICON_AUTHORS`) | Atıf mevcut; tam kapsam DOĞRULANMADI. |
| Yazı tipleri Cinzel, Inter | `fonts/OFL-*.txt` (SIL OFL) | Düşük. |
| three.js | `vendor/three` (MIT) | Lisans dosyasının dağıtımda bulunduğu DOĞRULANMADI. |
| Müzik `audio/kizil-goz.mp3` ("Under the Crimson Eye"), `intro.mp3`, `arka-plan.mp3`, `boss.mp3` | Kullanıcı tarafından verildi | Kaynak/lisans belgesi depoda YOK. |
| NPC replikleri (GPT 105 satır), yükleme metinleri | Özgün metin olarak teslim edildi | Düşük. |
| Kullanıcı verisi | Yerel kayıt; sunucu yok; gerçek oyuncu verisi pakette YOK | Play Store veri güvenliği formu henüz yok. |
