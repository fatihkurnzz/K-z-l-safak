# Kanıt ve yeniden üretme

Kaynak: depo `oyun-son/` @ bae239e (KAYNAK_ENVANTERI ile 466/467 aynı; fark yalnız css/p33-kabul.css, V42 F-005 düzeltmesi). `_tasarim/` hariç kopyalandı.

1. Temel ve yamalı kopya:
   `git archive bae239e oyun-son | tar -x -C X && mv X/oyun-son X/base && rm -rf X/base/_tasarim && cp -r X/base X/patched`
   `cd X/patched && patch -p1 --batch < P35_02_04_ADAY.patch && patch -p1 --batch < D09_TUCCAR_ADAY.patch && patch -p1 --batch < P35_01_MEDYA_ADAYI.patch` (üçü de çakışmasız uygulandı)
2. GPT testlerinin bağımsız tekrarı (tür A), paket kökünden: `node --experimental-default-type=module test/kabul.mjs X/base X/patched` → 274/274; `test/r5_kabul.mjs` → 40/40; `destan/test/destan-kabul.mjs X/patched` → 184/184; P35_05 `node test.mjs X/patched` → 1718, `node ek_test.mjs X/patched` → 414. Çıktılar `cikti/GPT_*_TEKRAR*`.
3. Yeni hipotez testleri (tür B; gerçek `world.dispatch`, `MemoryStore`, yerel kip `bots:true`, `dev:true`): `GAME_DIR=X/patched node test/t35.mjs` (tohum 351/352) → `cikti/T35_SONUC.json` 10/10; `t35b.mjs` (tohum 7, dev kapalı) → `cikti/T35B_ORS_BASLANGIC.txt`; `t35c.mjs` → `cikti/T35C_SAVASCI_BASLANGIC.txt`. `h.mjs` V42 F-025 koşumunun uyarlamasıdır.
4. Kaynak verisi çözümlemesi (tür C, savaş simülasyonu yok): `node test/rota.mjs X/patched` → `cikti/ROTA_AYRISMA.json`; `node test/alti.mjs X/patched` → `cikti/ALTI_YARATIK_DOGUM.json` (yöntem doğrulaması `kontrol.mjs`: 128 farklı yaratık aşamalarda); `node test/kat.mjs X/patched` → `cikti/KATALOG_KIRILIM.txt`; 122 eylem sınıflaması → `cikti/EYLEM_122_SINIF.json` (sezgisel kaynak deseni taraması).
5. Görsel: `gorsel/ref_kontak.jpg` (3 onaylı referans), `gorsel/gem_kontak.jpg` (6 Gemini aday ekran görüntüsü), `gorsel/MEVCUT_MEDYA_KONTAK.jpg` (GPT P35-01 kanıtı, değiştirilmeden).
Node 22.23; Python 3 + Pillow. Tarayıcı ve gerçek cihaz testi yapılmadı.
