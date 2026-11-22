# 23 Kasım · GPT G1, G2, G4, G5, G6, G7, G8 ve Gemini M2–M5 teslimlerinin entegrasyonu

Gelen: `Korant_Online_Guncel_01…06.zip` (G1, G2 Elentha/Kragmir, G4, G5, G7, G8), `Korant_Online_G6.zip`, Gemini `M2_Video_Denetimi.md`,
`M3_C_Sinifi_Arayuz_Glif_Seti.zip`, `M4_Arayuz_Maketleri_ve_Olculer.zip`, `M5_adlar_turkce_oneri.zip`. Eksik: M1 (Gemini kabul denetimi), G3 (yaratıklar).
M1 gelmediği için teknik kabul denetimini ben yaptım (biçim, alfa, ölçü, zemin çizgisi, hale, eşlik, sayı).

## Oyuna girenler
| Görev | Ne | Nerede |
|---|---|---|
| C3/C5 | Savaşta boyalı 2B birimler: 16 kahraman × 7 poz, 4 bandikut × 3 poz. Bekleme (nefes), hazırlık→vuruş, büyü, vurulma (kırmızı parlama + geri savrulma), düşüş, zafer. Ağır vuruşta 60 ms donma + ekran sarsıntısı (M2). | `js/savas-birim2d.js` (yalnız çizim; `combat.js`/`world.js` birer satır), `js/b2d-sancak.js`, `js/b2d-ocak.js` (`_tasarim/araclar/b2d-gom.py`). Eski 3B'ye dönüş: `localStorage dd_b2d='0'` ya da `?b2d=0`. |
| C5 | Savaş çerçevelerinde oyuncunun seçtiği boyalı yüz, düşmanda 2B yaratık başı | `combat.js portraitOf` |
| — | Savaşçı tam boyu (oluşturma/seçme) kılıç + kalkanlı G1/G2 bekleme pozu (kullanıcı kararı) | `karakter-gom.py` ← `_tasarim/gelen/g1g2-savasci/` |
| C8 | Görsel roman diyaloğu (M4 `olcu-diyalog.md`), kral konuşması; öğretici anlatıcısı (Lira/Yashka) boyalı yüz | `js/ui-diyalog.js`, `ui-hub.js npcKing`, `ui-kalicilik.js nPor` |
| C9 | 203 boyalı yetenek kartı (G6), siluetin yerine | `skill-icons.js skillIcon` ← `gorsel-png.js` |
| C10 | 10 efekt şeridi (G7; 16 kare → 12 kare): ateş topu, alev, buz kırılma, zehir, vuruş, kritik, şifa, kalkan kubbe, boss girişi, parçalanma | `vfx-png.js` (`vfx-g7-gom.py`) |
| C7 | Boyalı sahneler (G5): Kemikli Koru (iki halk, öğretici açılışı), Maden (+ oyuncunun 2B karakteri), Balık Tut, Dipsiz Kuyu ve Yeraltı Ocağı kartları, Kristal Nöbeti, Dünya Baskını, Mini Dizi 10 kapak | `js/sahne.js` → `--sc-*` CSS değişkenleri, `css/v27-duzen.css` "Boyalı sahneler" |
| G8 | Logo (karakter seçme başlığı), halk amblemleri (Taraf Seç) | `js/amblem-png.js`, `sahne.js` |
| M2 | Kragmir oyuncusu Elentha surları/şelalesi önünde savaşmaz (arka plan halka göre) | `savas-arka.js pickBg` |

Yayın sınırı (511): 8 yeni dosya = 6 küçük v11 CSS tek `css/v11.css`'te (index.html sırasıyla) + kullanılmayan `img/icons/icon-512.png`, `maskable-512.png` yayından çıkarıldı.

## GPT'ye geri bildirim (yeniden çizim)
1. **G1 `kahraman-sancak-savasci-kadin-buyu`**: yüz ve saç başka kişi (sarışın). Şimdilik yerine `zafer` pozu kullanılıyor.
2. **G2 beyaz zemin artığı** (opak beyaz yamalar, alfa değil): `sancak-buyucu-kadin`, `sancak-savasci-erkek`, `ocak-savasci-kadin`, `ocak-sifaci-erkek`, `ocak-suikastci-kadin` (7'şer poz). Kodla temizlendi (`b2d-gom.py temizle`), ama gerçek alfa ile yeniden teslim daha temiz olur.
3. **G5 `dunya-baskini`**: istenen Kül Ağası Karadun silüeti yok.
4. **G4 Thrak**: yeşil ten, sivri kulak; G2 Kragmir kahramanları gri tenli. Ork ten rengi birliği için karar gerekli.
5. **G7**: `simsek` çapraz çizilmiş (oyun iki nokta arasına gerer) → kullanılmadı; `kutsal-isin`, `golge-cokus` için oyunda element yok → bekliyor.
6. **G1 katmanlı deneme** (`katman-*`): poz geçişi yeterli olduğu için kullanılmadı.

## Açık kararlar (kullanıcı)
- **M5 Türkçe adlar** (901 satır): onay gelince yalnız `shared/items*.js` / `skills.js` ad alanları değişir.
- **Açılış resmi** `img/korant-acilis.jpg`: soldaki arma Horde'u, sağdaki aslan Alliance'ı andırıyor; "Powered by BFS Game" yazısı var. G8 kuralıyla çelişiyor → G8 logosu ve amblemleriyle yeni açılış kartı önerilir.

## Sırada
- M4 maketleri: VS, sonuç (zafer/yenilgi), Karakter penceresi (C6), ana HUD (dar/geniş) — ölçü dosyaları geldi.
- M3 C sınıfı glifler (40) → C9 (arayüz glifleri).
- G3 + M1 gelince: yaratık aileleri ve bosslar 2B'ye (`savas-birim2d.js YARATIK` tablosu).
- Diyalog bileşenini öbür NPC'lere yaymak (Halvor, Maelis, Corin, Thrak; `ui-ogretici.js say`).
