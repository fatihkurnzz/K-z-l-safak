# GPT — bütün teslimler, kabuller ve nihai durum (sürüm 42 itibarıyla)

İki ayrı değerlendirme yapılır: **GPT teslim başarısı** (istenen dosya geldi mi, biçim/ölçü/kimlik uygun mu) ve **Opus entegrasyon başarısı** (oyuna girdi mi, çalışıyor mu, kanıtı ne). Bağımsız görsel kabul bu belgede YOKTUR (Fable).
Depo yolları `oyun-son/` köklüdür. `K = oyun-son/_tasarim/araclar/kabul-26kas`.

## 1. Görev turları ve kayıtları
| Tur | Tarih | Görevler | Görev belgesi | Teslim/entegrasyon kaydı |
|---|---|---|---|---|
| G-paketi (görsel) | 22–23.11 | G1 pilot (2 savaşçı × 7 poz + bandikut ailesi), G2 kalan 14 kahraman, G3 yaratık/boss, G4 NPC portreleri, G5 boyalı sahneler, G6 yetenek kartları, G7 VFX şeritleri, G8 amblem/logo | `_tasarim/denetim-22kas/paket/GPT_ASTRA_6.2_GOREVLERI.md` | `_tasarim/denetim-22kas/C3_C10_TESLIM_23KAS.md`; `CLAUDE.md` (23.11, 3.–11. oturum notları) |
| P23 A-paketi | 23.11 | A1–A8 (Korant işareti, zemin mührü, başlık levhası, ana ekran çerçeveleri, madenci, taht, harita NPC'leri, profil) | `_tasarim/proje-23kas/GPT_ASTRA_GOREVLERI.md` | **Opus'ta teslim kaydı YOK.** Kullanıcı bu işleri başka modellere yaptırdı; sonuç dış sürüm (v40, P23–P32) ile depoya geldi (`js/p23-*-png.js`). Hangi parçanın GPT'den geldiği DOĞRULANMADI. |
| P33 içerik/standart | 26.11 | 15 NPC rolü/105 replik, yükleme metinleri (4 bölge, 5 zindan, 20 ipucu), ses manifesti taslağı, tasarım/savaş/varlık/terminoloji standartları, 254 satırlık QA matrisi, entegrasyon talimatı 1–10 | `K/gelen/CLAUDE_ENTEGRASYON_TALIMATI.md` | `K/KAPSAM_MATRISI.md §16`, `K/DEGISIKLIK_RAPORU.md` |
| İkinci teknik kabul | 26.11 | G2-01…G2-13 bulguları | — | `ek/gpt/ikinci_kabul/GPT_IKINCI_KABUL_RAPORU.md`; nihai durumlar `BIRLESIK_HATA_VE_GOREV_MATRISI.json` (G2-*) |
| P34 | 26.11 | P34-01, 02, 03, 04, 08, 09 + K-1 (beyaz zemin), K-2 (büyü pozu) | `ek/opus/p34_girdi_paketleri/KORANT_GPT_P34_GIRDI/` | `ek/gpt/p34_teslim/`, `P34_NIHAI_DURUM.json`, `K/p34_gom_raporu.json` |

> Kullanıcı mesajındaki "G1–G7" bu belgede G1–G8 olarak geçer (G8 amblem/logo ayrı paketti).

## 2. G1–G8 nihai durumu
| Paket | GPT teslim | Opus entegrasyon | Kanıt / yol | Açık |
|---|---|---|---|---|
| G1 | Teslim edildi; kadın savaşçı büyü pozunda başka yüz (sarışın) vardı → 23.11 düzeltildi → P34 K-2'de kalkanın yanlış kolda olduğu bulundu → GPT düzeltti | ENTEGRE (`js/b2d-sancak.js`, `b2d-ocak.js`); K-2 v42'de | `kanit/v42/kontrol/gpt_kontrol.jpg`, `kanit/v42/p34_test/*/08_veri_kontakt.webp`; `ek/gpt/p34_teslim/K-2_kontrol.json` | K-2 pozu oyunda savaş içinde (bekleme→büyü→bekleme geçişi) v42'de çekilmedi |
| G2 | Teslim edildi; 5 sette opak beyaz zemin (sancak-buyucu-kadin, sancak-savasci-erkek, ocak-savasci-kadin, ocak-sifaci-erkek, ocak-suikastci-kadin) → 23.11 temiz alfa geldi; Kragmir gri tenliydi → yeşil tenle yeniden geldi | ENTEGRE | K-1: GPT 35 kaynak pozu, Opus 16 kahraman × poz gömülü kopyayı ölçtü: temiz (`ek/gpt/p34_teslim/K-1_kontrol.json`, `kanit/v42/kontrol/beyaz_zemin_olcum_K1.json`) | **Beyaz zemin nihai: KAPANDI** (iki bağımsız ölçüm) |
| G3 | Teslim edildi (370 WebP, 102 tür); 13 tür yalnız bekleme pozu; boss 2. evre "özgün dönüşüm değil" | ENTEGRE (`js/b2d-y1…y4.js`, `b2d-yb.js`); eksik pozlar P34'te Gemini'ye verildi | `K/../b2d-g3-gom.py` | Tepegöz 1. evre vurulma pozunda beyaz leke (P34-B05) |
| G4 | 8 NPC portresi | ENTEGRE (`js/gorsel-png.js`, `ui-diyalog.js`) | v41 çekimleri | — |
| G5 | Sahneler; Dünya Baskını'nda Karadun eksikti → 23.11 düzeltildi | ENTEGRE (`js/gorsel-png.js`, `sahne.js`) | — | — |
| G6 | 203 yetenek kartı | ENTEGRE (`skill-icons.js`) | — | Yetenek işi kullanıcı kararıyla ertelendi |
| G7 | 10+ VFX şeridi; şimşek ilk teslimde çapraz | ENTEGRE (`js/vfx-png.js`); şimşek düzeltilmiş hâli `zap` | — | — |
| G8 | Logo, halk amblemleri | ENTEGRE (`js/amblem-png.js`) | — | Taraf Seç ekranında kullanıcı isteğiyle eski bayraklar |

**Teslim edilip kullanılmayanlar:** G1 katmanlı karakter denemesi (`katman-*`), `bekleme-alternatif` (balta), `katman-pelerin`, tırpanlı `kragmir_savasci_*` tam boyu (kılıç+kalkan kararı), G7 ilk şimşek. Gerekçeler `C3_C10_TESLIM_23KAS.md` ve `CLAUDE.md`.

## 3. P33 içerik ve standartlar (26.11)
- **ENTEGRE:** NPC replikleri (`js/npc-soz.js`, 105 satır, iç mekân balonu + gerçek sonuç satırı), yükleme metinleri (`js/yukleme-metin.js`), ses bağlamları (mevcut sentez seslerle zindan ortamları), 11 px yazı standardı (pencere içi + HUD).
- **Standart dosyaları (Fable başvurusu için):** `K/gelen/tasarim_standartlari.json` (token, 44 px dokunma, 11 px yazı), `savas_ve_etkilesim_standartlari.json` (yalnız sunum süreleri; mekanik değişmez), `varlik_eslesme_kurallari.json` (42 sahne/13 iç mekân koruma, kimlik listeleri), `terminoloji.json`, `qa_test_plani.md`, `qa_test_matrisi.json`.
- **"Mekanik, matematik, ekonomi, denge" standardı:** GPT'nin bu konuda ayrı bir standart dosyası YOKTUR; teslimdeki kural "mekanik/ekonomi/denge değişmez, yalnız sunum" yönündedir (`savas_ve_etkilesim_standartlari.json › kurallar`, entegrasyon talimatı 6). Denge değerlendirmesi yapılmamıştır.
- **Kısmen uygulanan:** 44 px dokunma hedefi (G2-07 KISMEN), ses manifesti önerileri (yeni ses dosyası yok; P34-11 teslim edilmedi).

## 4. İkinci teknik kabul (G2-01…13) — nihai
Tablo `BIRLESIK_HATA_VE_GOREV_MATRISI.json` (G2-* kayıtları). Özet: **KAPANDI 7** (G2-01, 02, 03, 06 kodla; G2-09, 11 belge; G2-12 testle), **YANLIŞ POZİTİF 2** (G2-04, 05: test betiği hatası; v42'de iki halkta doğru sonuç), **KISMEN 3** (G2-07, 08, 10), **AÇIK 1** (G2-13: özgün 32 madde belgesi yok). GPT'nin "Fable henüz devreye girmesin" ve "P34 görsellerini Gemini'ye yönlendir" önerileri kullanıcı kararıyla uygulanmadı (görev bölüşümünü kullanıcı yaptı).

## 5. P34 teslimleri (GPT)
| Talep | GPT teslim başarısı | Opus entegrasyon başarısı |
|---|---|---|
| P34-01 zafer anıtı | BAŞARILI: 2048×868, aynı kadraj (küçültünce 0,93/255 fark) | ENTEGRE + test GEÇTİ |
| P34-02 Elentha katmanları | BAŞARILI (14 eleman, kare 00 = fotoğraf birebir, alfa doğru); uzak şelale kolları atlandı (kendisi bildirdi) | ENTEGRE + test GEÇTİ |
| P34-03 Kragmir katmanları | BAŞARILI; sağ uzak lav atlandı (bildirdi) | ENTEGRE + test GEÇTİ |
| P34-04 çarşı + klan | BAŞARILI (13 + 14 + 14 eleman) | ENTEGRE + test GEÇTİ (klan: doğrudan kurulum) |
| P34-08 Kragmir 5. yüz | BAŞARILI | ENTEGRE (veri testi) |
| P34-09 Bran/Nessa | BAŞARILI | ENTEGRE + diyalog/kart testi GEÇTİ |
| K-1 / K-2 | K-1 temiz; K-2 gerçek bir kusur buldu ve düzeltti (Opus'un ilk görsel kontrolü kalkan kolunu kaçırmıştı) | K-2 ENTEGRE |
Teslim bütünlüğü: ZIP CRC temiz; manifestteki 458 dosyanın sha256'sı birebir (`kanit/v42/teslim_butunluk.json`). Manifest dışı 3 dosya belge (OPUS_ENTEGRASYON.md, sahne_kalite.json, varlik_eslestirmeleri.json).
**GPT'nin teslim edip entegre edilmeyen P34 işi:** yok (önizleme PNG'leri yalnız kontrol amaçlıydı).

## 6. Açık / doğrulanamayan (GPT ile ilgili)
- P23 A1–A8'in GPT'den mi başka modelden mi geldiği kayıtsız.
- AI üretimi görsellerin kullanım koşulları/lisans beyanı teslimlerde yok (P34-B10).
- Katmanların gerçek cihazda performansı ve "doğallık" değerlendirmesi yapılmadı.
