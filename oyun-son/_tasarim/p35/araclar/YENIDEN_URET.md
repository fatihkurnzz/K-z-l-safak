# KORANT_P35_UI_GPT_GIRDI — yeniden üretme (S = scratchpad, G = oyun-son)

Sunucu: `python3 -m http.server 8765 -d G`. Oyun kodu değiştirilmez.
1. `paket-26kas/cikar.py G/js S/cikti/gomulu` · `token.py G S/cikti/tokenler.json` · `katalog.py G S/cikti/gomulu S/cikti/katalog.json`
2. `shared/` kopyası (+`package.json {"type":"module"}`) → `node paket-26kas/dok.mjs shared S/cikti/veri-json`
3. V42 tam çekim (iki halk): `kabul-26kas/cek115.js <ocak|sancak> <çıktı>` (880×406, dpr 2,66) — bu paket `cek42` çekimini kullandı (26.11 11:43–11:58, JS hatası yok).
4. Görsel kümeleme (iki halkta da piksel olarak aynı çekimler tek sayılır): ham betik `kume.py` mantığı — 220×101 gri, ortalama mutlak fark < 2,0, iki halkta birden.
5. `python3 -I envanter_p35.py <cek42> <v41 çekimi> kabul-26kas/ekran_envanteri.json kumeler.json S/cikti/envanter`
6. Pilot ölçüm + ek çekim (iki iki çalıştır; 6 paralel tarayıcı sunucuyu boğar): `SHOT=1 node olc.js <halk> 880 406 S/olc/<halk>-880 2.66`, `node olc.js <halk> 667 375 S/olc/<halk>-667 1`, `node olc.js <halk> 1180 820 S/olc/<halk>-1180 1`
7. `python3 -I paketle_p35.py S G <cek42>` → `S/teslim/KORANT_P35_UI_GPT_GIRDI_0NofNN.zip`

Bilinen: `olc.js` eşya bilgi kartı (`karakter-esya-karti`) çekimi çalışmadı (`.kx-grid [data-a="kxPick"]` bulunamadı — test hesabında kuşanılmamış eşya listesi/seçici farkı); EKSIK_VE_DOGRULANAMAYANLAR.md 3. madde.
