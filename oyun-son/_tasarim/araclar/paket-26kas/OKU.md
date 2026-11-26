# KORANT_GPT / KORANT_GEMINI paketleme araçları (26 Kas 2026, sürüm KORANT-v40-1dda167)

Sunucu: `python3 -m http.server 8765 -d oyun-son`. S = scratchpad, G = oyun-son. Sıra:
1. `python3 -I cikar.py G/js S/cikti/gomulu` — JS'e gömülü base64 görselleri bayt bayt çıkarır (`_cikarilan.json`).
2. `python3 -I katalog.py G S/cikti/gomulu S/cikti/katalog.json` — dosya + gömülü varlık kataloğu (sha256, ölçü, koddaki geçiş).
3. `python3 -I token.py G S/cikti/tokenler.json` — CSS tasarım değişkenleri.
4. `shared/`'ı package.json `{"type":"module"}` olan bir klasöre kopyala → `node dok.mjs shared S/cikti/veri-json`; `node esya.mjs shared G/js/adlar-tr.js S/cikti/veri-json`.
5. `python3 -I belge.py S/cikti/veri-json S/cikti/belge`; `python3 -I replik.py G S/cikti/replikler.json`.
6. Ekran çekimi (iki halk paralel): `node cek.js <sancak|ocak> S/ekran-hd/<halk>` (dpr 2,66 = 2340×1080). `VARLIK=1` → ekran↔varlık ölçümü (`S/ekran-var`). `LISTE=a,b` yalnız o ekranlar. `charSwitchMenu` listeden çıkarıldı (karakter seçmeye geçip sonraki ekranları kirletiyordu).
7. `python3 -I birlestir.py S` (yeniden çekilenleri birleştirir) → `python3 -I ekranlar.py S/ekran-son tanim.json S/cikti/ekranlar` (aynı görünenleri ayıklar, WebP q92, 9+9 kolaj).
8. `node vid.js <halk> S/kayit-ham/<halk>` → `python3 -I kes.py S` (savaş klipleri).
9. `python3 -I paketle.py G S S/paket` → `KORANT_GPT.zip`, `KORANT_GEMINI_0NofNN.zip` (her parça < 30 MB, bağımsız; README + manifest her parçada).
