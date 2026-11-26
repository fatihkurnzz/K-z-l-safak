# P33 · Birleşik kapsam matrisi (tek uygulama, tek teslim)

Sürüm: `KORANT-v40-1dda167+P33` · Tarih: 26 Kas 2026 · Hazırlayan: Claude (19. oturum)

## Kaynaklar ve birleştirme kuralı
| Kod | Kaynak | Not |
|---|---|---|
| AAA | Kullanıcının 25.11 "AAA Kalite Geliştirme" planı, bölüm 2–16 (`KAPSAM_KAYNAK_AAA.txt`) | GPT talimatındaki "23 ana + C24–C32 tamamlayıcı" görev paketi (kullanıcı 26.11'de doğruladı). Görev listesinin kendisi depoda ve oturum kayıtlarında YOK; maddeler bu planın özgün metninden çıkarıldı. |
| BUL | 25.11 ekran incelemem: A1–A10, B1–B4, C1–C2 | |
| GEM | Gemini Neon görsel kabul raporu: 17 düzeltme + 3 "Test Edilmedi" (N4-06, N5-02, N6-08), 22 ekran | `gelen/gemini_gorsel_kabul_raporu.json` |
| GPT | GPT 6.2 teslimi: entegrasyon talimatı 1–10, QA matrisi (254 satır), standartlar | `gelen/` |
| KUL | Kullanıcı kararları 26.11 | HUD 11 px büyüt · T3 kapalı · zafer_aniti yüksek çözünürlük iste |

Aynı kök nedenli maddeler TEK satırda birleşti (ör. Han/Ahır/Zafer kabuğu = BUL-B1 + GEM N4-01 + N4-04). Daha önce tamamlanmış iş tekrar yapılmadı, yalnız kanıtlandı.

Durum kodları: **VARDI** (P33'ten önce kodda; yalnız doğrulandı) · **EKLENDİ** / **DÜZELTİLDİ** (P33) · **YANLIŞ POZİTİF** (ölçümle/kaynakla çürütüldü) · **KAPSAM DIŞI** (bu ortamda yapılamaz ya da dış varlık ister; gerekçeli) · **TEST_EDİLMEDİ** (kanıt yok; gerekçeli) · **İSTENDİ** (GPT/Gemini'den varlık istendi).

Kanıtı olmayan hiçbir satır KABUL sayılmaz; nihai kabul QA matrisindedir (`QA_MATRISI_DOLU.json`).

---

## 1. AAA §2 · Dinamik çevre ve canlı haritalar
| ID | Gereksinim | Durum | Nerede / kanıt |
|---|---|---|---|
| AAA-2.1 | Elentha: sancak rüzgârı, şelale akışı, su yansıması, meşale/şömine ateşi | KAPSAM DIŞI | Başkent tek parça boyalı fotoğraf (P28 kullanıcı kararı "yalnız fotoğraf"). Hareketli sancak/su/ateş için GPT'den ayrı katman maskesi gerekir → `GPT_ISTEK_P34.md` |
| AAA-2.2 | Elentha: hafif sis, kuşlar, ışınlanma kapısında mavi-altın parçacık, hareketli ışık | EKLENDİ | `js/p33-canli.js` (ışık tozu, uzak kuş sürüsü, portal parçacığı mavi/altın), gün evresi tonu. Kanıt: `kanit/canli/` |
| AAA-2.3 | Kragmir: lav akışı, alev, duman, ısı dalgası, sancak | KAPSAM DIŞI | Aynı gerekçe (boyalı fotoğraf); istek GPT'ye |
| AAA-2.4 | Kragmir: kül ve kor parçacığı, kapıda kızıl-mor parçacık | EKLENDİ | `p33-canli.js` RENK.ocak |
| AAA-2.5 | Muhafız ve NPC doğal animasyonları (haritada) | KAPSAM DIŞI | P28 kararıyla harita sprite katmanı kaldırıldı; NPC'ler resmin parçası |
| AAA-2.6 | Yemin Pazarı: tente/kumaş, tüccar, demirci kıvılcımı, kalabalık hissi | KISMEN | Işık tozu + kuş EKLENDİ; kalabalık ORTAM SESİ VARDI (`amb.market`); tente/tüccar hareketi KAPSAM DIŞI (katman çizimi) |
| AAA-2.7 | Klan Obaları: sancak, meşale, muhafız | KISMEN | Kor zerresi EKLENDİ; sancak/muhafız KAPSAM DIŞI |
| AAA-2.8 | Ortak: harita/bina/sancak/arma değişmez, ayrı katman, abartısız, kontrast korunur, mobil uygun, etkileşimi kapatmaz | DOĞRULANDI | Tuval `pointer-events:none`, fotoğrafın üstünde etiketlerin altında; 42 sahne sha aynı (`kanit/koruma/`); pencere/iç mekân açıkken ve sekme gizliyken durur; en çok 30 kare/sn |

## 2. AAA §3 · Gece–gündüz
| AAA-3.1 | Sabah/gündüz/akşam/gece atmosferi (harita) | EKLENDİ | 2B haritada `p33-ton` (multiply/soft-light, gece en çok %26). 3B ortamda VARDI (`js/daylight.js`). `?tod=` ile denenir; kanıt `kanit/canli/*-night|dusk|dawn.png` |
| AAA-3.2 | Gökyüzü, güneş/ay, pencere ışığı, meşale, su/lav yansıması | KISMEN | Renk tonu EKLENDİ; pencere/meşale yanması boyalı resimde ayrı katman ister → KAPSAM DIŞI |
| AAA-3.3 | Ortam sesleri evreye göre | VARDI | `sfx.js sceneLoops` `amb.<halk>.day/night` |
| AAA-3.4 | Bina konumu, kimlik, HUD okunurluğu korunur; mekanik değişmez | DOĞRULANDI | Ton yalnız fotoğrafta; HUD/etiket üstte. Gece bonusları `shared/realm.js`'te, dokunulmadı |

## 3. AAA §4 · Ses tasarımı
| AAA-4.1 | Elentha/Kragmir bölge ses kimliği | VARDI | `amb.ocak.*`, `amb.sancak.*`, ırk imza sesleri `id.ocak/id.sancak`, ırka özgü onay/sekme sesleri |
| AAA-4.2 | Yemin Pazarı, Han, Ahır, Örs, Maden, Klan Karargâhı ortamı | VARDI (P33 ilk yarı) | `amb.market`, `amb.icm.han/ahir/ors/maden/klan` |
| AAA-4.3 | Her zindana özgü çevresel ses | EKLENDİ | `amb.z.zkuyu/zyarik/zmuhur/zkule/zocak` (mevcut tek seferlik seslerden; `savas-arka.js ZEMIN.aktif`) |
| AAA-4.4 | Boss müziği, zafer/mağlubiyet | VARDI | `mus.boss` (dosya), `bt.victory/bt.defeat`, ırk imzası |
| AAA-4.5 | Yumuşak geçiş, sesler birbirini bastırmaz, tekrar rahatsız etmez | VARDI | `audio.js` döngü solması, öncelik/veri yolu sınırı, varyant seçimi |
| AAA-4.6 | Müzik, çevre, efekt, NPC ayrı ayarlanır | KISMEN→EKLENDİ | Yeni `music` kanalı (Ayarlar → Ses → Müzik). NPC seslendirmesi olmadığı için NPC kanalı eklenmedi (boş kaydırıcı yanıltır) → KAPSAM DIŞI |
| AAA-4.7 | Yeni özgün müzik/ortam kaydı, seslendirme (VO) | KAPSAM DIŞI | Ses dosyası üretemem; GPT talimatı 3: "yeni VO yok, sessiz geri dönüş" |

## 4. AAA §5 · NPC
| AAA-5.1 | Nefes, göz kırpma, baş/el, konuşma animasyonu | KISMEN | Konuşma portresinde nefes EKLENDİ (`.dlg-por`, `.npc-yuz`). Göz kırpma/el için kare çizimi gerekir → GPT isteği. İç mekân NPC'leri boyalı arka planın parçası |
| AAA-5.2 | NPC'ye özgü karşılama, ırka özgü konuşma, tüccar replikleri, işlem tepkisi | VARDI (P33 ilk yarı) | `js/npc-soz.js` (GPT 105 replik), iç mekân balonu, gerçek sonuç satırı (`kanit/gpt_entegrasyon_sonuc.json`) |
| AAA-5.3 | Önemli NPC seslendirmesi | KAPSAM DIŞI | VO dosyası yok |
| AAA-5.4 | Kral ve hikâye karakterleri sinematik sunum | VARDI | `ui-diyalog.js`, kral diyaloğu, Destan |
| AAA-5.5 | Kragmir yeşil ten, tasarımlar değişmez | DOĞRULANDI | Görsel dosyası değişmedi (koruma sha); T3 görünümü KAPALI (KUL) |

## 5. AAA §6 · Eşya, geliştirme, ödül
| AAA-6.1 | Nadirliğe göre ışık; Eşsizde özel kısa animasyon; nadirlik sesi | EKLENDİ + VARDI | Ganimet satırı Nadir mavi / Eşsiz altın parlama (2–3 kez, sonra durur); ses `rar.0-2` VARDI |
| AAA-6.2 | Geliştirme başarı kıvılcımı, başarısızlıkta sönme, kırılma, muska | EKLENDİ + VARDI | `p33-ors` (ok / büyük / sondu / kirik / korundu), gerilim süresinden sonra; sesler VARDI |
| AAA-6.3 | Yeniden dövme, parçalama geri bildirimi | VARDI | `anvil.reforge`, `ui.dismantle` sesleri; örs ekranının kendi canlandırması (`up2feed`) |
| AAA-6.4 | Sandık, seviye atlama, unvan, başarım, görev tamamlama sunumu | EKLENDİ | `p33-serit` (seviye, başarım, görev, sandık, unvan); sesler VARDI |
| AAA-6.5 | Oran/miktar değişmez, sonuç gizlenmez, atlanabilir, hızı düşürmez | DOĞRULANDI | Tümü dokunulmaz katman, ≤2,4 sn, işlem beklemez; Hareketi azalt/Pil tasarrufu kapatır; shared/ değişmedi |

## 6. AAA §7 · Savaş hissi
| AAA-7.1 | Silaha özgü darbe, kritik, kalkan engelleme, büyü ışığı, hasar tepkisi | VARDI | `fx.js`, `fx-table.js` (weaponKind, crit, absorb/kalkan, element ışığı), `c.hit()` |
| AAA-7.2 | Zemine oturma, temas gölgesi, kontrollü sarsıntı | VARDI | P31-G3 zemin, gölge düzlemi, `camRig.shake` + erişilebilirlikte kapatma |
| AAA-7.3 | Canavar ölümü, boss sunumu, zafer/yenilgi | VARDI | `die()`, `bossIntro`, sonuç ekranı rz2 |
| AAA-7.4 | Boss yeteneğinden önce anlaşılır uyarı | EKLENDİ | `combat.js`: boss (B tarafı) özel yeteneğinde "⚠ <yetenek>" kızıl nabızlı başlık + 0,35 sn ön uyarı (sıra/hasar değişmez) |
| AAA-7.5 | Efekt yoğunluğu ayarlanabilir | EKLENDİ | Ayarlar → Grafik → Efekt yoğunluğu: Az (`DD_EFEKT` 0,5 → `fx.js N()`) |
| AAA-7.6 | Silah/kalkan/büyü/canavar/boss/zafer sesleri | VARDI | `sfx.js` swing.*, hit.*, cast.*, bt.* |
| AAA-7.7 | HUD, hasar, süre, denge değişmez | DOĞRULANDI | shared/ sha aynı |

## 7. AAA §8 · Irk kimliği
| AAA-8.1 | Büyü enerjisi, portal parçacığı renkleri (mavi-altın / kızıl-mor) | EKLENDİ + VARDI | Portal parçacığı `RENK`; büyü rengi sınıf/yaratıkta VARDI |
| AAA-8.2 | Bildirim sesleri kristal-çan / davul-metal | VARDI | `ui.confirm.ocak/sancak`, `ui.tab.*`, `id.*` |
| AAA-8.3 | Zafer atmosferi, şehir, NPC hareket farkı, sancak dokusu | KISMEN | Şerit renkleri ırka göre; sancak/NPC hareketi KAPSAM DIŞI (2.1) |
| AAA-8.4 | Eşit kalite, eşdeğer HUD, armalar korunur | DOĞRULANDI | İki halk aynı çekim seti (cek115 ×2) |

## 8. AAA §9 · Mikro animasyonlar
| AAA-9.1 | Basma 80–120 ms | EKLENDİ | `scale:.96` 90 ms (pencere, modal, HUD, savaş, iç mekân düğmeleri) |
| AAA-9.2 | Sekme 120–180 ms, panel aç/kapa 150–250 ms, harita/iç mekân 200–350 ms | EKLENDİ + VARDI | Sekme 150 ms, modal 200 ms EKLENDİ; pencere ve iç mekân 250 ms VARDI (P31) |
| AAA-9.3 | Eşya seçimi 100–150 ms, ödül 300–500 ms, para 200–400 ms | EKLENDİ | Akçe/yakut 360 ms akış (artışta altın, azalışta kızıl), EXP çubuğu 380 ms; şerit 300 ms giriş |
| AAA-9.4 | Can/mana çubuğu akıcı | VARDI | Savaşta `shown` değer akışı (combat.js) |
| AAA-9.5 | Azaltılabilir/kapatılabilir; performansı düşürmez | DOĞRULANDI | Hareketi azalt + Pil tasarrufu; yalnız compositor özellikleri (scale, opacity, box-shadow kısa) |
| AAA-9.6 | Gerçek cihazda süre ayarı | TEST_EDİLMEDİ | Gerçek cihaz yok |

## 9. AAA §10 · Yükleme ekranları
| AAA-10.1 | Bölgeye özgü görsel, kısa hikâye, ipucu | VARDI (P33 ilk yarı) | `js/yukleme-metin.js` (4 bölge, 5 zindan, 20 ipucu), `savasHazirla` perdesi bölge sahnesiyle |
| AAA-10.2 | Gerçek ilerleme çubuğu, sahte bekleme yok | VARDI | Açılış çubuğu gerçek yükleme; savaş perdesi ilk karede kalkar (yapay süre yok) |
| AAA-10.3 | Irka özgü yükleme animasyonu | KISMEN | Perde ırk renginde; ayrı animasyon çizimi yok |

## 10. AAA §11 · Performans ve ayarlar
| AAA-11.1 | Grafik profilleri (4) | VARDI | `gfx.js` En Düşük/Düşük/Orta/Yüksek + Otomatik (takılınca iner) |
| AAA-11.2 | FPS sınırı ayarı | EKLENDİ | Kare hızı sınırı 30 (`FPS_CAP.battle`) |
| AAA-11.3 | Efekt yoğunluğu, çevre animasyonları, sarsıntı, hareket azaltma | EKLENDİ + VARDI | Efekt/çevre EKLENDİ; sarsıntı, ışıma, donma, parlama Erişilebilirlik'te VARDI; Hareketi azalt VARDI |
| AAA-11.4 | Müzik/efekt/çevre/NPC ses seviyeleri | EKLENDİ (NPC hariç) | bkz. AAA-4.6 |
| AAA-11.5 | Pil tasarrufu | EKLENDİ | `dd_pil`: çevre kapalı, efekt az, savaş 30 / ana üs 20 kare/sn, hareketler durur |
| AAA-11.6 | Tembel yükleme, önbellek, görünmeyende animasyon durdurma | VARDI + EKLENDİ | C14 tembel yükleme, `sw.js` önbellek, pencere arkası 15 kare/sn VARDI; harita tuvali gizli sekmede/pencerede durur EKLENDİ |
| AAA-11.7 | Bellek sızıntısı, uzun oturum, pil, ısı, düşük cihaz | TEST_EDİLMEDİ (masaüstü ölçüm hariç) | Gerçek cihaz yok; masaüstü Chromium bellek ölçümü `kanit/sistem/` |
| AAA-11.8 | Farklı ekran oranları | TEST EDİLDİ | 667×375, 880×406, 1180×820 çekimleri |
| AAA-11.9 | Güvenli yeniden bağlanma | KAPSAM DIŞI | İlk sürüm yerel kayıt (DD_LOCAL); sunucu yok |

## 11. AAA §12 · Gerçek oyuncu denetimi
| AAA-12.1 | İlk 5 dk / 30 dk / 2 saat oyuncu testi | TEST_EDİLMEDİ | Gerçek oyuncu oturumu yok; otomatik akış testleri (giriş, öğretici atlama, savaş, klan) yapıldı ama "anlaşılır mı" sorusu insan testi ister |
| AAA-12.2 | Uzun oturum: bellek, FPS, ısı, pil, bağlantı, veri kaybı, kapanma | TEST_EDİLMEDİ | Gerçek cihaz yok. Veri kaybı: kayıt uyumluluğu testi VAR (`kanit/kayit-uyumlulugu/`) |
| AAA-12.3 | Denge (ırk, sınıf, eşya, ekonomi) | RAPOR | Değer değiştirilmedi; denge incelemesi bu teslimin kapsamında değil, onaysız değişiklik yasak |

## 12. AAA §14 · 25 kabul ölçütü → QA matrisi `KAB-01…KAB-25` satırları

## 13. AAA §15 · Yasaklar — uyum
Sıfırdan tasarım YOK · harita/bina/sancak/arma DEĞİŞMEDİ (sha) · karakter/silah çizimi DEĞİŞMEDİ · HUD yeniden tasarlanmadı (yalnız yazı 11 px, KUL kararı) · yeni bina/harita/zindan YOK · mekanik/ekonomi/ödül DEĞİŞMEDİ (shared/ sha aynı) · efektler kapatılabilir · test edilmeyen "tamam" denmedi.

---

## 14. 25.11 bulgularım (BUL)
| ID | Bulgu | Durum | Kanıt |
|---|---|---|---|
| A1 | Zafer Anıtı penceresi bina dokunuşlarını kapatıyor | YANLIŞ POZİTİF | Çekim betiği pencereyi kapatmıyordu; yeni betiklerde her ekrandan önce kapanır |
| A2 | Başkent hep Yashka diyaloğu | YANLIŞ POZİTİF | Öğretici atlanmadan çekilmiş (DEVIR "TEST DERSİ") |
| A3 | Savaşta kurt üstünde kırmızı çubuklar | KANIT BEKLİYOR → savaş testi | `kanit/savas-*/` |
| A4 | Karakter seçmede VS kalıntısı | YANLIŞ POZİTİF | `quick.png` = Hızlı Av VS ekranı; kurt kartı doğru içerik |
| A5 | Karşılama yazısı öğretici diyaloğuna biniyor | DÜZELTİLDİ | `ui-karakter.js go()`: diyalog kapanınca gösterilir |
| A6 | Elentha bilgi hapında yazının üstünden çizgi | DÜZELTİLDİ | GEM N2-02 ile aynı kök (`.wctx` kapsül çizgisi) |
| A7 | Otomatik ipucu savaş boyu kalıyor | DÜZELTİLDİ | GEM N5-01 ile aynı (3 sn + dokununca kapanır) |
| A8 | Nöbet altı kesik | DÜZELTİLDİ | GEM N6-05 ile aynı |
| A9 | Profilde TEST ARAÇLARI | KULLANICI KARARI | 24 Kas: varsayılan görünür; `?dev=0` / `?store=1` gizler (GEM N1-01, `kanit/devui_t3_sonuc.json`) |
| A10 | Kragmir açılışında Elentha şehri | KANIT BEKLİYOR → `kanit/cesitli/` | `karakter-sahne.js BG[race]` kaynakta doğru; çekimle doğrulanacak |
| B1 | Han/Ahır/Zafer ayrı tasarım dili | DÜZELTİLDİ | GEM N4-01 + N4-04 ortak kabuk |
| B2 | Premium $ fiyat + AL | DÜZELTİLDİ | GEM N2-01 "Yakında" |
| B3 | Kragmir kahramanları ten kontrolü | DOĞRULANDI | Yeşil set değişmedi; T3 (kural dışı) kapalı |
| B4 | Aynı işe birden çok giriş (mağaza 5, unvan 3, görev 2, Meydan 4) | RAPOR (değişiklik YOK) | Yönlendirme mekaniği değiştirilmez; kullanıcı kararına bırakıldı (`DEGISIKLIK_RAPORU.md` §Açık kararlar) |
| C1 | Sohbet Irk sekmesi açık sarı band | DÜZELTİLDİ | GEM N6-06 |
| C2 | Ansiklopedi/modInfo altı kesik | YANLIŞ POZİTİF | Kaydırılan kap; denetçi kırpmayı hesaba katar |

## 15. Gemini (GEM) 17 + 3
| ID | Durum | Not |
|---|---|---|
| N4-01 | DÜZELTİLDİ + yanlış okuma notu | zafer_aniti bağlıydı (%50 karartma); artık iç mekân. Düşük çözünürlük (512×217) → İSTENDİ (KUL) |
| N4-02 | DÜZELTİLDİ | Önizleme zaten diyar_haritasi; büyütüldü, tek sütun |
| N2-01 | DÜZELTİLDİ | "$" aslında ₺; yine de "Yakında" |
| N1-01 | KULLANICI KARARI | bkz. A9 |
| N3-01 | DÜZELTİLDİ | T3 varsayılan kapalı (KUL onayı 26.11) |
| N6-01 | DÜZELTİLDİ | Karakter + düğmeleri 22 px, satır 21, süzgeç 28 |
| N4-03 | DÜZELTİLDİ | Örs halka 32 px |
| N4-04 | DÜZELTİLDİ | N4-01 ile ortak kabuk |
| N5-01 | DÜZELTİLDİ | oto-tip 3 sn |
| N6-02 | YANLIŞ POZİTİF | Görevler: kırpılan kap |
| N6-03 | DÜZELTİLDİ | VS Karakter 32 px, dalga yazısı 2 satır |
| N6-04 | YANLIŞ POZİTİF | Meydan |
| N6-05 | DÜZELTİLDİ | Nöbet afişi −16 px |
| N6-06 | DÜZELTİLDİ | Ferman şeridi koyu altın; sohbet çakışması yanlış pozitif |
| N6-07 | DÜZELTİLDİ | Karaborsa/Başarım 2 satır |
| N4-05 | DÜZELTİLDİ | Balık arka planı |
| N2-02 | DÜZELTİLDİ | Kapsül çizgisi + kontrast |
| N4-06 (TE) | TEST EDİLDİ | Klan kurulup Klan Obası + 10 bina + portal çekildi (`kanit/savas-*/klan*`) |
| N5-02 (TE) | TEST EDİLDİ | 4 bölge + boss + 5 zindan + PvP + Oba Avı savaşları iki halkta (`kanit/savas-*`) |
| N6-08 (TE) | KISMEN | 667×375 ve 1180×820 çekildi; gerçek cihaz FPS/pil/ısı TEST_EDİLMEDİ |

## 16. GPT talimatı 1–10
| # | Durum |
|---|---|
| 1 NPC replikleri adaptörle, sahte kimlik yok | VARDI (P33 ilk yarı): `npc-soz.js`; kimlikler mevcut ACT'lerden |
| 2 Yükleme metinleri, EN geri dönüş | VARDI (P33 ilk yarı); EN: metin TR kalır → TEST: dil turu `kanit/sistem/` |
| 3 Ses manifesti: mevcut sesler, VO yok | DOĞRULANDI + zindan ortamları EKLENDİ |
| 4 Tokenler, CSS sırası, 44 px / 11 px | 11 px: pencere içi + HUD (KUL). 44 px: ölçüm `cozumle.py` raporunda; küçük hedefler listelendi |
| 5 Varlık eşleşme, 42 sahne/13 iç mekân/HUD kimliği | DOĞRULANDI (`kanit/koruma/`) |
| 6 Savaş standartları yalnız sunum | DOĞRULANDI |
| 7 QA matrisi 226 + 13 + 15, kaynak durumları | `QA_MATRISI_DOLU.json` (+ENV, DYN, RES, SAV, KAB satırları) |
| 8 Eksikler (Mini Dizi video, Bran/Nessa portresi, 13 yaratık bekleme pozu, boss 2. evre, Kragmir 5. yüz) | KAPSAM DIŞI (izinsiz üretim yok) → `GPT_ISTEK_P34.md` |
| 9 Gemini paketinde olmayan HUD/glif/VFX/kart | İkinci kabul paketine eklendi |
| 10 Sunucu güvenliği/kapasite/anti-cheat onayı verilmez | UYULDU: TEST_EDİLMEDİ |
