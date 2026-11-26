# KORUNACAK VARLIKLAR — üretime GERİ GÖNDERİLMEZ

Bu gruplar teslim edildi, oyuna bağlı ve onaylı. Aşağıdakileri yeniden çizme/"iyileştirme" yok. İhtiyaç yalnız görev belgesinde adı geçen yeni/eksik kalemlerdir.

| Grup | Dosya / yer | Durum |
|---|---|---|
| Şehir sahneleri (5) + atlas | `img/kd/sehir/*/sahne.webp`, `atlas.webp` | ONAYLI, DEĞİŞMEZ (yalnız üstüne ayrı katman) |
| 42 sahne (29 `sahneler/` + 13 `interiors/`) | `sahneler/*.webp`, `interiors/**` | ONAYLI, DEĞİŞMEZ (`zafer_aniti.webp` hariç: yalnız yüksek çözünürlüklü SÜRÜMÜ istendi, aynı kadraj) |
| 16 kahraman, 7 poz (bekleme, saldırı-hazırlık, saldırı-vuruş, büyü, vurulma, yere düşüş, zafer) | `js/b2d-sancak.js`, `js/b2d-ocak.js` | TESLİM EDİLDİ ve BAĞLI. Beyaz zemin ve Elentha kadın savaşçı büyü pozu: `05_KONTROL…` bölümündeki ölçümle DOĞRULANDI (yalnız göz kontrolü istenir) |
| Kragmir yeşil tenli tam boylar + yüzler (savaşçı/büyücü/rahip/suikastçı × e/k, yüz yuvaları 0–3) | `js/karakter-png*.js` | ONAYLI. Yalnız **Kragmir erkek 5. yüz** eksik (GPT P34-08) |
| 133 yaratık (3 pozlu: bekleme, saldırı, vurulma + portre), bölge 1–4 | `js/b2d-y1…y4.js` | ONAYLI. Yalnız `GEMINI_GOREVLERI.md` içindeki 11 tür eksik pozlu |
| 5 ana boss evre 1 (+ mevcut evre 2 varyantı) | `js/b2d-yb.js` | evre 1 ONAYLI; evre 2 "özgün dönüşüm değil" → yeniden çizilecek |
| G4 NPC portreleri (528×704) + yüzler (192×192): Halvor, Maelis, Corin, Thrak, Edran, Volgar, Yashka, Lira | `js/gorsel-png.js` | ONAYLI, DEĞİŞMEZ (Gemini yalnız ek KARE üretir) |
| Eşya (96+ simge), yetenek kartları (203), VFX şeritleri (G7), glifler (40), amblemler (G8) | `js/esya-png.js`, `js/gorsel-png.js`, `js/vfx-png.js`, `js/glif-png.js`, `js/amblem-png.js` | ONAYLI. Yetenek çalışması ertelenmiştir; dokunma |
| Müzik (4 mp3) | `audio/*.mp3` | ONAYLI, DEĞİŞMEZ (yeni parçalar EK olarak gelir) |
| Mini Dizi sistemi | `shared/minidizi.js`, `video/` | KORUNUR, video üretimi YOK |
| Açılış resmi | `img/korant-acilis.jpg` | DEĞİŞMEZ (kullanıcı kararı) |
