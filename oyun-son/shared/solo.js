// Tek kahraman dengesi (sürüm 12). Modların kurduğu dalgalar dört kişilik partiye göreydi; savaş başlarken (modes.js:
// startBattle) bu dosyadan geçer:
//   1. Budama: bir dalgada en çok SOLO.max yaratık kalır (öncelik boss > kaptan > azılı > sıradan; dizilişteki sıra korunur).
//      Budanan yaratıkların deneyimi, akçesi ve eşya şansı kalanlara pay edilir (birimin xr alanı; battle.js kesim kaydına
//      yazar, modes.js killRewards çarpar). Böylece savaş başına kazanç eskisine yakın kalır.
//   2. Ölçek: can ve saldırı seviyeye göre çarpılır (sıradan / kaptan / boss ayrı). Savunma ve hız değişmez.
// Etkinlik boss'ları (Oba Avı, Dünya Baskını) süre dolana kadar hasar yarışıdır: canları ve saldırıları ölçeklenir, klana ve
// ortak havuza yazılan hasar SOLO.event.credit ile çarpılır (dört kahramanın hasarına denk). Kuşatma muhafızları (yapay
// kahramanlar) ayrı ölçeklenir. Meydan ve Canlı Meydan zaten tek kişiliktir; Sancak Savaşı yapay müttefiklerle oynanır.
// Sayılar scratchpad/v12/tek/sim.mjs ile ayarlandı (her sınıf, seviye noktaları, ortalama eşya).
const lerp = (pts, x) => { // [[x, y], …] parçalı doğrusal
  if (x <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) { const [a, ya] = pts[i - 1], [b, yb] = pts[i]; return ya + (yb - ya) * (x - a) / (b - a); }
  return pts.at(-1)[1];
};
export const SOLO = {
  max: 3,
  // [seviye, çarpan] düğümleri bölgelerin ortasındadır (tune.mjs: q=0.45 ortalama eşya, hedef zafer oranları raporda)
  // İlk düğümler (Sv 1-6) yeni karakter içindir: puan dağıtılmamış, yalnızca başlangıç silahı (tutsim.mjs: öğretici savaşları
  // ve 1-5 kaptanı her sınıfla %93+). Sonraki [seviye, çarpan] düğümleri: tune.mjs (ortalama eşya = yapay oyuncuların yarısı Standart +2 %55 dolu, yarısı Nadir +3 %64 dolu; hedef zafer oranı Sv 5'te mob %95 / kaptan %92 / boss %85,
  // Sv 80'de %72 / %68 / %60, arası doğrusal). Zikzak, eşya kademelerinin açıldığı seviyelerden gelir.
  // Sürüm 12 (6 yetenek + mana + iksir): scratchpad/v12/yetenek/tune.mjs ile yeniden ayarlandı. Sıradan stage'ler iksirsiz
  // (hedef zafer Sv 5'te %96, Sv 80'de %80): iksir bitmiş oyuncu da ilerler. Kapı kaptanı ve boss'lar 2 Can + 2 Mana iksiriyle
  // (hedef Sv 5'te kaptan %92 / boss %85, Sv 80'de %74 / %66). İksirli ve iksirsiz zafer oranları raporda.
  mob:  { hp: [[1, 0.25], [3, 0.32], [6, 0.55], [9, 0.65], [16, 0.77], [26, 0.47], [36, 0.55], [46, 0.46], [56, 0.62], [66, 0.64], [75, 0.6]],
          atk: [[1, 0.35], [3, 0.42], [6, 0.6], [9, 0.68], [16, 0.74], [26, 0.58], [36, 0.63], [46, 0.57], [56, 0.66], [66, 0.67], [75, 0.65]] },
  cap:  { hp: [[1, 0.25], [4, 0.35], [10, 0.75], [16, 0.8], [26, 0.89]], atk: [[1, 0.4], [4, 0.5], [10, 0.78], [16, 0.82], [26, 0.88]] },
  boss: { hp: [[3, 0.55], [12, 0.4], [20, 0.32], [36, 0.35], [46, 0.42], [56, 0.33], [66, 0.46], [76, 0.42]], atk: [[3, 0.5], [20, 0.57], [36, 0.6], [46, 0.65], [56, 0.59], [66, 0.69], [76, 0.66]] },
  event: { hp: 0.3, atk: 0.55, credit: 1.6 }, // credit: tek kahramanın ham hasarı ×1,6 ≈ eski dört kişilik partinin hasarı (modesim.mjs)
  // Sınıf payı (yalnızca yaratığa karşı savaşlarda; Meydan, Canlı Meydan, Sancak Savaşı ve Kuşatma etkilenmez): tek başına
  // kalabalığı yavaş kesen Şifacı'nın vuruşu, ince Büyücü'nün canı ve savunması artırılır. Sonraki iş (6 yetenek + MP) gelince
  // yeniden ayarlanmalıdır.
  // Sürüm 12: 6 yetenek ve mana ile Şifacı'nın şifa döngüsü (oto seçimde üst üste vurmama sınırı, battle.js calm) ve Büyücü'nün
  // yetenek yükü öne geçti; zone boss'ları her sınıfta %65-85 olacak şekilde seviye düğümleriyle ayarlandı (sim.mjs, N=60, 2+2 iksirle).
  cls: { warrior: { hp: 1.3, atk: [[1, 1.29], [16, 1.26], [40, 1.29], [76, 1.32]], mag: [[1, 1.29], [16, 1.26], [40, 1.29], [76, 1.32]] }, rogue: { hp: [[1, 1.38], [10, 1.3], [20, 1.2]], atk: [[1, 1.19], [16, 1.12], [40, 1.19], [60, 1.3], [76, 1.42]], mag: [[1, 1.19], [16, 1.12], [40, 1.19], [60, 1.3], [76, 1.42]] }, priest: { hp: [[1, 0.74], [16, 0.8], [40, 0.78], [60, 0.76]], atk: [[1, 1.6], [12, 1.3], [20, 1.18], [28, 1.3], [38, 1.24], [48, 1.2], [66, 1.28]], mag: [[1, 1.6], [12, 1.3], [20, 1.18], [28, 1.3], [38, 1.24], [48, 1.2], [66, 1.28]] }, mage: { hp: [[1, 1.95], [10, 1.6], [20, 1.3], [40, 1.37]], atk: [[1, 1.02], [16, 0.95], [40, 1.02], [60, 1.02], [76, 0.97]], mag: [[1, 1.02], [16, 0.95], [40, 1.02], [60, 1.02], [76, 0.97]], def: [[1, 1.5], [20, 1.2]] } },
  guard: { hp: 0.55, atk: 0.6 },  // Hisar Kuşatması muhafızları (yapay kahraman)
  // Çok dalgalı, arada can dolmayan modlarda ek çarpan (can ve saldırıya): eski dört kişilik partiyle bu modlar neredeyse
  // hep sonuna kadar gidiyordu; tek kahramanla hedef çoğu dalgayı geçmek (modesim.mjs)
  mode: { well: 0.65, rift: 1.15, akin: 0.6, depth: 1.2, seal: 1 }, // sürüm 12: 6 yetenek + iksirle Gök Yarığı ve Yeraltı Ocağı %100e çıktı; yükseltildi
};
// Kahraman birimine sınıf payı (modes.js startBattle: PvE ve etkinlik modlarında)
export function soloHero(u, mode) {
  const c = (PVE.has(mode) || EVENT.has(mode)) && u.cls ? SOLO.cls[u.cls] : null;
  if (!c) return u;
  const o = { ...u };
  for (const [k, f] of [['hp', 'maxHp'], ['atk', 'atk'], ['mag', 'mag'], ['def', 'def']]) if (c[k]) o[f] = r(o[f] * (Array.isArray(c[k]) ? lerp(c[k], u.lvl || 1) : c[k])); // sayı ya da [seviye, çarpan] düğümleri
  return o;
}
const PVE = new Set(['stage', 'well', 'depth', 'rift', 'seal', 'worm', 'akin', 'nobet']);
const EVENT = new Set(['clanboss', 'baskin']);
const r = Math.round;
const prio = u => (u.boss ? 3 : u.captain ? 2 : u.elite ? 1 : 0);
const scale = (u, hp, atk) => ({ ...u, maxHp: Math.max(1, r(u.maxHp * hp)), atk: r(u.atk * atk), mag: r(u.mag * atk) });
function trim(w) {
  if (w.length <= SOLO.max) return w;
  const keep = new Set(w.map((u, i) => [u, i]).sort((a, b) => prio(b[0]) - prio(a[0]) || a[1] - b[1]).slice(0, SOLO.max).map(x => x[1]));
  const kept = w.filter((_, i) => keep.has(i)), xr = Math.round(100 * w.length / kept.length) / 100;
  return kept.map(u => ({ ...u, xr }));
}
export function soloMob(u) {
  const T = u.boss ? SOLO.boss : u.captain ? SOLO.cap : SOLO.mob, L = u.lvl || 1;
  return scale(u, lerp(T.hp, L), lerp(T.atk, L));
}
export function soloWaves(waves, mode) {
  if (PVE.has(mode)) { const k = SOLO.mode[mode] || 1; return waves.map(w => trim(w).map(u => (k === 1 ? soloMob(u) : scale(soloMob(u), k, k)))); }
  if (EVENT.has(mode)) return waves.map(w => w.map(u => scale(u, SOLO.event.hp, SOLO.event.atk)));
  if (mode === 'siege') return waves.map(w => w.map(u => scale(u, SOLO.guard.hp, SOLO.guard.atk)));
  return waves; // arena, live, banner
}
