# C2 · HD model kök neden raporu (22 Kasım 2026)

**Soru (denetim G1):** Yüksek kademede de savaş figürleri En Düşük kademeyle aynı görünüyor. İskeletli HD modeller yükleniyor mu?

**Kısa cevap:** Modeller yükleniyor. Ama savaşta görülen birimlerin çoğu bu modelleri **hiç kullanmıyor**. Bu bir kademe hatası değil, tasarım gereği verilmiş üç karar.

## Ölçüm
880×406, Elentha, aynı stage, aynı kamera. Betik: `t/c2.js <gfx> <halk> <stage>`. `world.actors[].char.constructor.name` ile her birimin çizim sınıfı okundu.

| Kademe | Stage | DD_RIGGED | models/ isteği | Üçgen | Çizim çağrısı | Kahraman | Düşmanlar |
|---|---|---|---|---|---|---|---|
| Yüksek | 1-1 Bandikut | true | 51 | 27.298 | 156 | Character (prosedürel) | BeastCharacter ×2 |
| Yüksek | 1-11 Goblin | true | 51 | 102.934 | 76 | Character (prosedürel) | **SkinnedCharacter ×3** |
| En Düşük | 1-11 Goblin | yok | 14 (yalnız silah) | 21.146 | 63 | Character | Character ×3 |

Görsel kanıt: `C2_kademe_karsilastirma.webp`. Goblinlerde iki kademe açıkça farklı. Bandikutta ve kahramanda fark yalnız ışık/gölge.

## Üç neden
1. **Oyuncunun kahramanı hep prosedürel.** `js/gorunus.js:24` `SKINNED_HERO = false`. `skinned.js createSkinned` oyuncunun görünüşü (charLook) olan birimde `null` döner, `world.js spawn` prosedürel `Character`'a düşer. Gerekçe kodda yazılı: iskeletli modellerin kafası/saçı dokuya gömülü, oyuncunun seçtiği yüz uygulanamıyor. Kadın gövdesi de ayrı model değil, aynı gövdenin inceltilmiş hâli (`gorunus.js` not). Bu yüzden kadın Elentha savaşçısı savaşta erkeğe benzer figürle görünüyor.
2. **Hayvan yaratıklar hep prosedürel.** `shared/bestiary.js:150 BEAST_KINDS` (quad, spider, scorpion, bird, insect, centaur, serpent, dragon) → `BeastCharacter`. Bu türler için hiç model dosyası yok. 146 yaratığın 55'i bu grupta.
3. **İnsansı yaratıkların çoğunun modeli yok.** 91 insansı yaratığın yalnız 25'i `models/models.json`'da (goblin, trol, kara şövalye aileleri). Kalan 66'sı prosedürel `Character`. 100 normal stage'in yalnız **16'sında** iskeletli modelli düşman çıkıyor.

Ayrıca: `models.json`'daki 7 dosya (paladin, dark_knight, archer, goblin, priest, orc, mage) 25 yaratığa renk tonuyla dağıtılıyor; kendileri de düşük poligonlu Mixamo tarzı modeller. Kademe yükseldikçe değişen yalnız gölge, MSAA, bloom ve çözünürlük.

## Sonuç ve C3/C4'e etkisi
- "Ayarı yükseltince düzelir" yolu kapalı: denetimdeki tespit doğru, nedeni kademe değil, model kapsamı.
- Pilot B (C4, 3B iyileştirme) yapılırsa başlangıç noktası: kahraman için modüler (yüz/saç değişen) bir model ya da `SKINNED_HERO=true` ile yüz kaybını kabul etmek; hayvanlar için sıfırdan model. Bu, iş yükünü büyütüyor ve Pilot A (2B boyalı) önerisini güçlendiriyor.
- Kod değiştirilmedi.
