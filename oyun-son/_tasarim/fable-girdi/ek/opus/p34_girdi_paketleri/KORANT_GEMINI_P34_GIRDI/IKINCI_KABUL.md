# KABUL-2 · İkinci görsel kabul denetimi (Gemini)

## Girdi (TEKRAR GÖNDERİLMEDİ — zaten sende olması gereken paketler)
| Paket | İçerik |
|---|---|
| `KORANT_GEMINI_KABUL2_01of08 … 08of08.zip` | `01_EKRANLAR_880x406/<halk>/` (226 çekim; WebP q92, 2341×1080), `02_ONCE_SONRA/` (17 bulgudan etkilenen 22 ekranın ESKİ sürümden çekimi), `03_SAVAS_KLAN/`, `04_CANLILIK_GERIBILDIRIM/`, `05_COZUNURLUK_667` + `05_COZUNURLUK_1180`, `08_SISTEM/` |
| `KORANT_GEMINI_KABUL2_EK_01of05 … 05of05.zip` | `06_EYLEM_TURU/<halk>/` (kaynak koddaki ekran açan her eylem), `07_DINAMIK_DURUMLAR/<halk>/` |
Bunlar sende yoksa kullanıcıdan iste; bu pakete konmadı (tekrar yükleme yok).

**Bu pakette (kısa belgeler):** `QA_MATRISI_DOLU.json` (974 satır; durum + kanıt), `KAPSAM_MATRISI.md`, `DEGISIKLIK_RAPORU.md`, `TEST_KANITLARI.md`, birinci raporun kendisi (`gemini_gorsel_kabul_raporu.json`, biçim örneği), GPT standartları (`tasarim_standartlari.json`, `savas_ve_etkilesim_standartlari.json`, `varlik_eslesme_kurallari.json`, `terminoloji.json`), `ONCEKI_BULGU_DURUMLARI.json` (birinci rapordaki 17 bulgu + 3 "Test Edilmedi" için kod tarafındaki durum özeti).

## Görev
1. **17 bulgu + 3 "Test Edilmedi" (N4-06, N5-02, N6-08) tek tek yeniden değerlendirilir:** `02_ONCE_SONRA` ile `01_EKRANLAR` karşılaştırılır; her biri `kapandi | kismen | acik | yanlis-pozitif-kabul | test-edilmedi` olarak işaretlenir, ekran dosyası yoluyla kanıtlanır.
2. **226 ekran + 03/04/05/08 + EK paket** bütünlük, taşma/kesilme, çakışma, kontrast, hizalama, ırk eşitliği (Elentha/Kragmir), yeşil ten kuralı, kılıç+kalkan kuralı, Korant adı, dil bütünlüğü (TR'de İngilizce kalıntı) açısından denetlenir. Yeni bulgu: `N-2-001…`.
3. **Yeni sistem kanıtları** (savaş/klan/dinamik) ve 667×375, 1180×820 çözünürlük (N6-08): "kabul/düzeltme/test edilmedi" ayrımı yapılır.

## Bilinen durumlar (yeniden "açık bulgu" yazma; yeni kanıt yoksa)
- **Ekranlar İLK TUR çekimidir.** Küçük yazı büyütmeleri ilk turdan sonra yapılan düzeltmeler QA'da `DUZELTILDI_ILK_TUR_SONRASI` olarak geçer; görüntüde eski hâl görünebilir. Bunları ekran kanıtıyla "açık" yazma, QA satırına bak.
- **Kullanıcı kararları (26.11):** HUD'da en küçük yazı 11 px (uygulandı); T3 görünümü KAPALI; test paneli (profil "TEST ARAÇLARI") varsayılan görünür (24.11 kararı; `?dev=0` / `?store=1` gizler); zafer_aniti yüksek çözünürlük GPT'den istendi (P34-01; bu turda düşük çözünürlük bilinen konudur).
- Ölçümle **yanlış pozitif** çıkanlar: N6-02 (Görevler), N6-04 (Meydan), N6-06 sohbet çakışması (kaydırılan/kırpılan kap), N2-01 "$" aslında ₺ (yine de Yakında yapıldı), N4-02 önizleme zaten yeni harita. Gerekçe `KAPSAM_MATRISI.md`.
- **Açık/bilinen:** 667×375'te savaş HUD'u ve yan menü katman ölçeğiyle 6–9,8 px; Karakter "+" düğmesi 22 px; 667'de bazı harita etiketleri kısmen üst üste; haritada sancak/su/ateş hareketi için katmanlar GPT'de (P34-02…04); gerçek cihaz FPS/pil/ısı, 30/120 dk oturum, sunucu/anti-cheat, ağ kesilmesi, UTC+3 sıfırlama **TEST EDİLMEDİ** (ortam yok) — bunları "kabul" yazma, "test edilmedi" kalsın.
- Bu P34 paketindeki yeni varlıklar (hareket katmanları, yaratık/boss pozları, NPC kareleri, ses, Bran/Nessa, 5. yüz) HENÜZ ENTEGRE DEĞİL; ikinci kabulün konusu değildir, mevcut yayın sürümünün denetimidir. Bu varlıklar geldiğinde tek aşamada entegre edilip ayrıca kabul edilecek.
- Dokunulmaz: harita/bina/sancak/arma görselleri, mekanik, ekonomi, kayıt. Bunlara dair "yeniden çiz" önerisi yazma; yalnız arayüz yerleşim/kontrast/okunurluk önerisi.

## Çıktı
`P34-KABUL-2/gemini_gorsel_kabul_raporu_2.json` — birinci raporla AYNI şema (`rapor_adi`, `surum_kimligi`, `denetim_tarihi`, `denetlenen_paket`, `ekran_envanteri`, `bolum_ozetleri`, `bulgular`, `ekran_bazli_kararlar`, `yonlendirme_testi_gereken_ayni_goruntuler`) ve ek alan `onceki_bulgu_durumlari` (17+3 satır: `bulgu_id`, `durum`, `kanit_ekran`, `not`). Her bulguda: `bulgu_id`, `ekran_kimligi`, `irk`, `ekran_goruntusu` (paket içi yol), `sorun_konumu`, `sorun_aciklamasi`, `oncelik` (Yüksek/Orta/Düşük), `onerilen_duzeltme`. Düzeltme önerisi YALNIZ görünüm (CSS/yerleşim/metin); mekanik önerme.
Yalnız kanıt gösterdiğin şeyi yaz; göremediğini "test edildi" sayma.
