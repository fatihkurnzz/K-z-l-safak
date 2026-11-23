# GPT'den gelecek görseller ve "sonradan eklediklerimiz" — eksiklerin tamamlanması

Kaynak liste: `REFERANS/EKSIK_LISTESI_SON.md` bölüm 2A. Kod tarafı **hazır**; görseller gelince yalnız bağlanacak.
Her teslimde: ZIP'i ayrı boş klasörde aç (`python3 -I`), biçim yalnız PNG/JPEG/WebP, alfa denetimi (boş% > 85 bozuk),
ölçü, iki halk eşliği, önceki paketlerle sha karşılaştırması → WebP → gömme aracı → `node --check` → tek ekran kontrol →
eksik listesi 2B → yayın. Zayıf parçayı kullanma, nedenini kullanıcıya söyle.

| # | Gelecek görsel | Bağlama yeri / araç | Not |
|---|---|---|---|
| 1 | G3: 13 yeni tür saldırı+vurulma pozları (tavşan, şahin, eşek arısı, gargoyle, barbar lideri, lamia, yılan kraliçesi, 6 ejder) | `_tasarim/araclar/b2d-g3-gom.py <klasör> .` → `js/b2d-y*.js`; `savas-birim2d.js YARATIK` eşlemesi | Şimdi yalnız bekleme pozu; eksik pozda bekleme yedek kalsın |
| 2 | Boss 2. evre gerçek dönüşüm çizimleri | aynı araç; `spec.canli` evre geçişi `savas-birim2d.js` | Şimdi 1. çizimin kopyası |
| 3 | Mantikor, megantereon portre kırpımı | `savas-birim2d portre(u)`, `mobResim` | Düşman çerçevesi başı |
| 4 | Kragmir 5. yüz | `karakter-gom.py` (yüz yuvası 4) | Şimdi savaşçı yüzünün aynası |
| 5 | Play Store: simge 512×512, öne çıkan 1024×500, 4–8 mağaza ekranı | yalnız `_tasarim/magaza/` klasörüne; oyuna gömülmez | Yayın altyapısı 2C-3 |
| 6 | Kozmetik eşya görselleri (çerçeve, amblem, sancak, görünüş) | **Önce** `shared/` kozmetik mekaniği (kullanıcı onayı şart) | Güce etkisi yok |
| 7 | Mini Dizi 10 bölüm videosu | `video/bolum-01..10.mp4`; dosya sayısı/boyut yayında kontrol | Şimdi "Bu bölüm yakında" |
| 8 | Savaş/boss müzikleri; karakter 2B kuşanılan eşya katmanları | `sfx.js MUSIC_URL` / `ui-kahraman.js .kx-2b` | İsteğe bağlı |
| 9 | Giriş ekranı parçaları (logo, çerçeve, düğme, temiz arka plan) | `CLAUDE_GIRIS_EKRANI.md` G2/G3 | `GPT_GIRIS_GORSEL_ISTEGI.md` |

## Kodda kalan, görsel beklemeyen eksikler
1. **`!important` temizliği** + v26/v31/v32/v33 şablon sadeleştirme: kullanıcı kararı gereği testten SONRA (2D). Şimdi yapma.
2. Pencere sekmeleri / satır simgelerindeki eski game-icons: bilerek bırakıldı; boyalı glif seti gelirse değiştir.
3. Kullanılmayan teslimler (`dragon_earth/poison`, balta, pelerin, tırpanlı tam boy): GPT yeni sürümde işe yararsa bağla.
4. Giriş ekranı çoklu sunucu gerçek mantığı → 2C-5/8 (sunucu gelince).

## Kullanıcıya her yayında ver
- Yayın bağlantısı (artifact `GwNoLLWnf5Wjc1PUJep2yi`; kurallar CLAUDE.md "Yayın").
- 2B'ye eklenen yeni deneme maddeleri.
