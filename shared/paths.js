// Uzmanlık yolları: her sınıfın iki yolu, yolun seçildiği seviye ve yol değiştirme bedeli. Saf tablolar ve hesaplar;
// istemciye sunulur (yetenek ekranı aynı sayıları gösterir). Yolların yetenekleri skills.js'tedir (path alanı),
// kuralları game.js ('path.choose', 'loadout.set') ve hero.js (unlockedSkills, heroStats) uygular.
//
// Kayıt biçimi (state.js, sürüm 5): p.heroes[kimlik] = { …, path: yol anahtarı | null, pn: yapılan yol seçimi sayısı,
//   ppas: düzene alınan yol pasifi | null }. Yol kahramana aittir: aynı sınıftan iki kahraman ayrı yollarda olabilir.
// Adların hepsi bu oyuna özgüdür.

// level: yolun seçilebildiği seviye · actives / passives: yol yeteneklerinin açıldığı seviyeler (skills.js bunları okur)
// fee: yol değiştirme bedelinin seviye başına akçesi · feeSteps: bedelin katlandığı en yüksek basamak
// free: bedelsiz yol değişikliği sayısı (ilk seçim her zaman bedelsizdir)
// actives / passives: uzmanlık PUANLARI (yolun ağacına verilen yetenek puanı), seviye değil. Usta yeteneği ustalık ağacındadır.
export const PATH = { level: 10, actives: [1, 20, 40, 60], passives: [10, 30, 50], fee: 500, feeSteps: 4, free: 1 };

// cls: sınıf · weapon: yolun vuruşlarını güçlendiren silah sınıfı (items.js: WEAPON_CLASS) · uses: yolun bilerek kullandığı mekanikler
export const PATHS = {
  sur:     { cls: 'warrior', name: 'Sur Bekçisi', role: 'Tank', tree: 'siper', weapon: 'sword', desc: 'Yoldaşına gelen darbeyi üstlenir, kalkan dağıtır, düşmanı geri iter.', uses: ['Himaye', 'Kalkan', 'Sakınma', 'Sıra çubuğu'] },
  yaran:   { cls: 'warrior', name: 'Zırh Yaran',  role: 'Saldırgan', tree: 'hucum', weapon: 'axe',   desc: 'Teberle zırhı yarar: savunma deler, kanatır, kırılan hattı ezer.', uses: ['Savunma delme', 'Kanama', 'Balta', 'Fırsat vuruşu'] },
  agu:     { cls: 'rogue',   name: 'Ağu Ustası',  role: 'Suikastçı', tree: 'hancer', weapon: 'dagger', desc: 'Hançerine ağu sürer: süren hasarı biriktirir, sonra hepsini birden patlatır.', uses: ['Zehir', 'Patlatma', 'Hançer', 'Sıra çubuğu'] },
  nisanci: { cls: 'rogue',   name: 'Keskin Nişancı', role: 'Okçu', tree: 'yay', weapon: 'bow',   desc: 'Hedefini nişanlar, yıldırım oklarıyla sersemletir, nişanlıya en ağır oku saklar.', uses: ['Nişan', 'Yıldırım', 'Ok', 'Savunma delme'] },
  otaci:   { cls: 'priest',  name: 'Otacı',       role: 'Güçlendirici', tree: 'kutsama', weapon: 'mace',  desc: 'Yoldaşlarını güçlendirir: kalkan ve rün sözleri verir, arındırır, zararlı etkiyi savuşturur.', uses: ['Şifa', 'Arındırma', 'Sakınma', 'Sıra çubuğu'] },
  bozan:   { cls: 'priest',  name: 'Büyübozan',   role: 'Zayıflatıcı', tree: 'lanet', weapon: 'mace',  desc: 'Düşmanın güçlendirmelerini söker, topuzuyla zırh kırar, yıldırımla çarpar.', uses: ['Sökme', 'Yıldırım', 'Topuz', 'Fırsat vuruşu'] },
  alaz:    { cls: 'mage',    name: 'Alazcı',      role: 'Alev', tree: 'ates', weapon: 'staff', desc: 'Ateşi körükler: yanığı her yana yayar, sonra tutuşanı patlatır.', uses: ['Ateş', 'Yanık', 'Patlatma', 'Fırsat vuruşu'] },
  boran:   { cls: 'mage',    name: 'Boran Bilgesi', role: 'Yıldırım', tree: 'yildirim', weapon: 'staff', desc: 'Yıldırımla çarpar ve sersemletir, buzla yavaşlatır; düşmanın sırasını çalar, yoldaşını öne alır.', uses: ['Buz', 'Yıldırım', 'Sıra çubuğu', 'Fırsat vuruşu'] },
};
export const PATH_KEYS = Object.keys(PATHS);
export const pathsOf = cls => PATH_KEYS.filter(k => PATHS[k].cls === cls);
// İstemciden gelen yol anahtarı: metin olmalı, tabloda kendi anahtarı olarak bulunmalı ve o sınıfa ait olmalı
export const validPath = (cls, key) => typeof key === 'string' && Object.hasOwn(PATHS, key) && PATHS[key].cls === cls;
// Kahramanın yolu (kayıtta geçersiz bir değer varsa yok sayılır)
export const pathOf = h => (h && typeof h.path === 'string' && Object.hasOwn(PATHS, h.path) ? h.path : null);
export const pathOpen = lvl => lvl >= PATH.level;
// Sıradaki yol seçiminin bedeli (akçe). İlk seçim ve ilk değişiklik bedelsizdir; sonraki her değişiklik
// fee × seviye × basamak (1, 2, … feeSteps) öder. Sunucu ve yetenek ekranı aynı işlevi kullanır.
export function pathFee(lvl, h) {
  const n = Number.isInteger(h?.pn) && h.pn > 0 ? h.pn : 0;
  if (n <= PATH.free) return 0;
  return PATH.fee * lvl * Math.min(PATH.feeSteps, n - PATH.free);
}

// Yetenek ağaçları ve uzmanlık: 10. seviyede seçilen yolun ağacı (PATHS[yol].tree) + sınıfın ortak ağacı açıktır;
// öbür yolun ağacına puan verilemez. Yolun aktif/pasif yetenekleri kendi ağacındaki puanla (PATH.actives/passives) açılır.
export const COMMON_TREE = { warrior: 'ofke', rogue: 'iz', priest: 'sifa', mage: 'buz' };
export const specTrees = (cls, path) => [COMMON_TREE[cls], ...(path && PATHS[path]?.cls === cls ? [PATHS[path].tree] : [])];
export const specPoints = h => { const k = pathOf(h); return k ? (h.tree?.[PATHS[k].tree] || 0) : 0; };
