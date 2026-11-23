// Drop tabloları. Yalnızca sunucu (ve çevrimdışı deneme sürümü) içe aktarır; istemci arayüzü oranları
// buradan değil, Ansiklopedi işlemleriyle (codex.get, codex.item) sunucudan öğrenir.
import { weighted, pickFrom } from './rng.js';
import { pickGear, gearShare, tierForLevel, itemBase, G_UNIQUE, UNIQUES, ARMOR_SLOTS, KO_JEWEL_NEW } from './items.js';
import { MOBS, ZONES, zoneStages } from './zones.js';
import { BOSS_PITY, WHEEL } from './content.js';
import { CAL7, CAL28 } from './meta.js';
import { STAGE_TIERS, TIER_MAX } from './pvp.js';
import { RULES } from './rules.js';

// rank: n sıradan · e azılı · c kaptan · b boss
const GEAR = { n: 0.03, e: 0.25, c: 1, b: 1 };
// Kademe eşyasının nadirliği: [nadirlik, ağırlık] (0 Standart, 1 Nadir). Eşsiz yalnızca aşağıdaki özel tablolardan düşer.
const GEAR_GRADE = { n: [[0, 78], [1, 22]], e: [[0, 60], [1, 40]], c: [[0, 45], [1, 55]], b: [[1, 100]] };
// Yeraltı Ocağı kat ödülü ve Kader Çarkı'nın "kademe eşyası" hep Nadir'dir (modes.js ve daily.js buradan okur)
export const REWARD_GRADE = 1;
const STONE0 = { n: 0.012, e: 0.10, c: 0.5, b: 1 };
const STONE1 = { n: 0.003, e: 0.03, c: 0.2, b: 0.3 };
const STONE2 = { n: 0, e: 0.002, c: 0.02, b: 0.05 };
const DUST = { n: 0.06, e: 0.3, c: 1, b: 1 };

// Yaratığa özel nadir drop'lar (taban oran, sıradan yaratık başına)
// Eski yaratık kimlikleri canavar ansiklopedisine (bestiary.js) aynı bölge/blokta taşındı
export const RARE = {
  blood_worm: [{ b: 'u:ilkkivilcim', rate: 0.0002 }],
  goblin_bouncer: [{ b: 'u:camuryaran',  rate: 0.0001 }],
  skeleton_warrior: [{ b: 'u:sazkiran',    rate: 0.0001 }],
  wolfhound: [{ b: 'u:demirhukum',  rate: 0.0001 }],
  tree_ghost_variant: [{ b: 'u:kuldilimi',   rate: 0.0001 }], volcanic_rock: [{ b: 'u:kulyayi',    rate: 0.0001 }],
  wild_smilodon: [{ b: 'u:sirtyaran',   rate: 0.0001 }], troll_shaman: [{ b: 'u:kamdegnegi', rate: 0.0001 }],
  revenge_knight: [{ b: 'u:kiragitopuzu', rate: 0.0001 }], skeleton_lord: [{ b: 'u:buzkiran',  rate: 0.0001 }],
};
// Oyun sonu bosslarında çok düşük ihtimalli eşsizler (19 Kas, kullanıcı: "şimdilik end game bosslarına, dungeonlarına çok düşük ihtimalle").
// Boss kesimi başına; Mühürlü Oda / Yeraltı Ocağı / etkinlikler aynı bossları kullandığı için oralarda da düşer.
for (const [mob, list] of Object.entries({
  mana_predator: ['u:lobocekici', 'u:karakanat', 'u:bozkurtcekici', 'u:erenion', 'u:hanguk'], death_knight: ['u:karakanat', 'u:kitinsiper', 'u:kitinyayi', 'u:helenid', 'u:lugias'], lich: ['u:kitinsiper', 'u:lobocekici', 'u:kurtcekici', 'u:kutsalasa', 'u:kanasa', 'u:garp'], // 19 Kas: Lupus/Chitin Bow/Lycaon
  bone_dragon: ['u:seraptigi'], blue_dragon: ['u:beylersiperi'], dark_dragon: ['u:devcekic', 'u:seraptigi'], gold_dragon: ['u:beylersiperi', 'u:devcekic'], red_dragon: ['u:seraptigi', 'u:devcekic', 'u:beylersiperi'],
})) for (const b of list) (RARE[mob] ||= []).push({ b, rate: 0.003 });
// KO zırh setleri (19 Kas): Full Plate / Crystal Sv.43–48 bosslarında, Chitin / Crimson Sv.52–65 bosslarında; parça başına
// çok düşük (Full Plate %0,2, Chitin %0,1; 40 parçadan biri, sınıf ayırmaz)
for (const [mobs, keys, rate] of [[['meganthereon', 'troll_king'], ['fplate_w', 'fplate_r', 'fplate_p', 'crystal_m'], 0.002],
  [['centaur_captain', 'harpy_queen', 'manticore', 'mana_predator', 'death_knight', 'lich', 'erlik', 'bozdag'], ['chitin_w', 'chitin_r', 'chitin_p', 'crimson_m'], 0.001]])
  for (const mob of mobs) for (const k of keys) for (const e of ARMOR_SLOTS) (RARE[mob] ||= []).push({ b: `u:${k}_${e}`, rate });
// Paper asaları (19 Kas): Lupus Staff mana_predator, Lobo Staff death_knight, Lycaon Staff lich, %0,3
for (const [mob, b] of [['mana_predator', 'u:lupusstaff'], ['death_knight', 'u:lobostaff'], ['lich', 'u:lycaonstaff']]) (RARE[mob] ||= []).push({ b, rate: 0.003 });
// KO takıları (19 Kas): boss başına takı başına %0,3; yeni açılan KO takıları seviye kuşağına göre: ≤40 Sv.20–40 bossları,
// 45 Sv.43–48, 50 Sv.52–56, ≥55 Sv.60–65. Oyunda zaten olan aynı adlı takılar kendi eski kaynağından düşer.
{ const BAND = [[40, ['werewolf', 'lizardman_captain', 'giant_golem', 'tree_ghost_king']], [45, ['meganthereon', 'troll_king']], [50, ['centaur_captain', 'harpy_queen']], [99, ['manticore', 'mana_predator', 'death_knight', 'lich', 'erlik', 'bozdag']]];
  for (const [b, req, src] of KO_JEWEL_NEW) for (const mob of src || BAND.find(([r]) => req <= r)[1]) (RARE[mob] ||= []).push({ b, rate: 0.003 }); }
// Boss: iz garantidir; eşsiz %1 (listeden rastgele); BOSS_PITY iz = seçmeli 1 eşsiz
export const BOSS_RATES = { unique: 0.01, charm: 0.08, seal: 0.1 };
const SEAL = { n: 0.004, e: 0.03, c: 0.1, b: 0 }; // Mühür Taşı (Mühürlü Oda anahtarı)
const EMBER = { n: 0, e: 0.002, c: 0.03, b: 0.05 }; // Tav Közü (örste başarı şansını artırır): nadir drop

// Zorluk kademesinin (pvp.js: STAGE_TIERS[tier].drop) düşme çarpanları; Olağan kademede hepsi 1'dir
const NO_TIER = { gear: 1, rare: null, stone1: 1, stone2: 1, ember: 1, unique: 1, marks: 1 };
const tierDrop = tier => (tier && STAGE_TIERS[tier]?.drop) || NO_TIER;
const cap1 = v => Math.min(1, v);
// Kademe eşyasının nadirlik tablosu: üst kademelerde Nadir payı tablodan (rare: [sıradan, azılı, kaptan]) okunur
function gradeTable(rank, T) {
  if (!T.rare || rank === 'b') return GEAR_GRADE[rank];
  const r = T.rare[rank === 'n' ? 0 : rank === 'e' ? 1 : 2];
  return r >= 1 ? [[1, 100]] : [[0, Math.round((1 - r) * 100)], [1, Math.round(r * 100)]];
}
// Ansiklopedi satırları: [anahtar, oran]. tier: zorluk kademesi (Nöbet beklentisi ve katalog üst kademeleri de sorar)
export function dropRows(mob, rank, tier = 0) {
  const T = tierDrop(tier);
  const rows = [['gear', cap1(GEAR[rank] * T.gear)], ['stone0', STONE0[rank]], ['stone1', cap1(STONE1[rank] * T.stone1)], ['dust', DUST[rank]]];
  if (STONE2[rank]) rows.push(['stone2', cap1(STONE2[rank] * T.stone2)]);
  for (const r of RARE[mob] || []) rows.push([r.b, r.rate * (rank === 'e' ? RARE_ELITE : 1) * T.unique]);
  if (SEAL[rank]) rows.push(['seal', SEAL[rank]]);
  if (EMBER[rank]) rows.push(['ember', cap1(EMBER[rank] * T.ember)]);
  const M = MOBS[mob];
  if (M.boss) { rows.push(['mark', 1], ['charm', BOSS_RATES.charm]); for (const u of M.uniques) rows.push([u, BOSS_RATES.unique * T.unique / M.uniques.length]); }
  return rows.filter(r => r[1] > 0);
}
// Yaratık başına beklenen toz (dust satırının ortalama adedi: sıradan 1-3, azılı 3-5, diğerleri 10-12)
export const dustMean = rank => (rank === 'n' ? 1 : rank === 'e' ? 3 : 10) + 1;

// Tek bir yaratık kesimi için ganimet. rand: sunucunun güvenli üreteci (savaş tohumundan bağımsız).
// opt: { gearMult, uniqueMult, noMark, tier } — etkinlik ve sefer çarpanları, zorluk kademesi
export function rollKill(rand, mob, rank, lvl, opt = {}) {
  const out = [], T = tierDrop(opt.tier);
  const tier = tierForLevel(lvl);
  if (rand() < GEAR[rank] * T.gear * (opt.gearMult || 1)) out.push({ t: 'item', b: pickGear(rand, tier), g: weighted(rand, gradeTable(rank, T)), key: 'gear' });
  if (rand() < STONE0[rank]) out.push({ t: 'stone', g: 0, n: 1, key: 'stone0' });
  if (rand() < STONE1[rank] * T.stone1) out.push({ t: 'stone', g: 1, n: 1, key: 'stone1' });
  if (rand() < STONE2[rank] * T.stone2) out.push({ t: 'stone', g: 2, n: 1, key: 'stone2' });
  if (rand() < DUST[rank]) out.push({ t: 'dust', n: (rank === 'n' ? 1 : rank === 'e' ? 3 : 10) + Math.floor(rand() * 3), key: 'dust' });
  for (const r of RARE[mob] || []) if (rand() < r.rate * (rank === 'e' ? RARE_ELITE : 1) * T.unique) out.push({ t: 'item', b: r.b, g: G_UNIQUE, key: r.b });
  if (rand() < SEAL[rank]) out.push({ t: 'seal', n: 1, key: 'seal' });
  if (EMBER[rank] && rand() < EMBER[rank] * T.ember) out.push({ t: 'ember', n: 1, key: 'ember' });
  const M = MOBS[mob];
  if (M.boss) {
    if (!opt.noMark) out.push({ t: 'mark', boss: mob, n: T.marks, key: 'mark' });
    if (rand() < BOSS_RATES.charm) out.push({ t: 'charm', n: 1, key: 'charm' });
    if (rand() < BOSS_RATES.unique * T.unique * (opt.uniqueMult || 1)) { const b = pickFrom(rand, M.uniques); out.push({ t: 'item', b, g: G_UNIQUE, key: b }); }
  }
  return out;
}

// ---------- Ansiklopedi: bir eşya nereden, hangi oranla düşer ----------
// Yukarıdaki tablolardan türetilir (ayrı bir "bilgi" tablosu yoktur; oran değişirse katalog da değişir).
// Satırlar: { t:'mob', mob, rank, from, to, rate }   yaratık kesimi başına (from–to: o kademede bulunduğu aşamalar)
//           { t:'boss', mob, stage, rate, seal }       günlük boss (seal: Mühürlü Oda'daki oran) · { t:'pity', mob, marks }
//           { t:'wheel', rate } · { t:'depth', rate }  çevirme / kat başına (eşsizin çark satırını codex.item ekler)
const RARE_ELITE = 5;          // azılı yaratıkta nadir drop çarpanı
export const SEAL_UNIQUE = RULES.seal.unique;  // Mühürlü Oda'da boss'un eşsiz düşürme çarpanı (modes.js: seal)
// Kader Çarkı'nın "Eşsiz eşya" dilimi: oyuncunun seviyesine uygun eşsizlerden rastgele biri (daily.js: wheel.spin)
export const wheelUniques = lvl => { const ok = Object.entries(UNIQUES).filter(([, u]) => !u.armor && u.req <= lvl + 5).map(([id]) => 'u:' + id); return ok.length ? ok : ['u:beykemeri']; };
const share = (table, g) => (table.find(x => x[0] === g)?.[1] || 0) / table.reduce((a, x) => a + x[1], 0);
const TIERS_UP = Array.from({ length: TIER_MAX }, (_, i) => i + 1); // Olağan'ın üstündeki zorluk kademeleri
const CAL_GEAR = [...CAL7, ...CAL28].flat().filter(d => d.t === 'gear'); // takvimlerdeki eşyalı ödüller
let UNITS = null; // bütün aşamalardaki yaratıklar: { mob, rank, lvl, stage }
function stageUnits() {
  if (UNITS) return UNITS;
  UNITS = [];
  for (const Z of ZONES) if (Z.open) for (const s of zoneStages(Z.id)) {
    const seen = new Set();
    for (const u of s.waves.flat()) { const k = u.mob + u.rank; if (!seen.has(k)) { seen.add(k); UNITS.push({ mob: u.mob, rank: u.rank, lvl: u.lvl, stage: s.id }); } }
  }
  return UNITS;
}
const wheelShare = give => (WHEEL.pool.find(x => x.give === give)?.w || 0) / WHEEL.pool.reduce((a, x) => a + x.w, 0);
const cache = new Map();
export function itemSources(b, g) {
  const key = b + '|' + g;
  if (cache.has(key)) return cache.get(key);
  const B = itemBase(b), rows = [];
  if (B?.unique) {
    for (const u of stageUnits()) for (const r of RARE[u.mob] || []) if (r.b === b) {
      const rate = r.rate * (u.rank === 'e' ? RARE_ELITE : 1), old = rows.find(x => x.mob === u.mob && x.rank === u.rank);
      if (old) old.to = u.stage; else rows.push({ t: 'mob', mob: u.mob, rank: u.rank, from: u.stage, to: u.stage, rate });
    }
    for (const u of stageUnits()) { const M = MOBS[u.mob]; if (M.boss && M.uniques.includes(b)) { rows.push({ t: 'boss', mob: u.mob, stage: u.stage, rate: BOSS_RATES.unique / M.uniques.length, seal: BOSS_RATES.unique * SEAL_UNIQUE / M.uniques.length }); rows.push({ t: 'pity', mob: u.mob, marks: BOSS_PITY }); } }
    // Üst zorluk kademeleri aynı yaratık ve boss'lardan, oranı çarpanıyla düşürür (Mühürlü Oda ve iz takası kademesizdir)
    if (rows.length) for (const t of TIERS_UP) rows.push({ t: 'tieru', tier: t, mult: tierDrop(t).unique });
  } else if (B) {
    for (const u of stageUnits()) {
      if (tierForLevel(u.lvl) !== B.tier) continue;
      const rate = GEAR[u.rank] * gearShare(b) * share(GEAR_GRADE[u.rank], g), old = rows.find(x => x.mob === u.mob && x.rank === u.rank);
      if (!rate) continue;
      if (old) old.to = u.stage; else rows.push({ t: 'mob', mob: u.mob, rank: u.rank, from: u.stage, to: u.stage, rate });
    }
    // Üst zorluk kademeleri: bütün yaratıklar kademenin seviyesindedir, yani yalnızca o seviyenin kademe eşyası düşer
    for (const t of TIERS_UP) if (tierForLevel(STAGE_TIERS[t].lvl) === B.tier) for (const rank of ['n', 'e', 'c', 'b']) {
      const rate = cap1(GEAR[rank] * tierDrop(t).gear) * gearShare(b) * share(gradeTable(rank, tierDrop(t)), g);
      if (rate) rows.push({ t: 'tier', tier: t, rank, rate });
    }
    if (g === REWARD_GRADE) { rows.push({ t: 'depth', rate: gearShare(b) }); rows.push({ t: 'wheel', rate: wheelShare('gear') * gearShare(b) }); }
    // Giriş takvimleri (meta.js): eşyalı günler, oyuncunun kademesinden rastgele bir eşya verir (metaops.js: resolveDrops)
    if (CAL_GEAR.some(d => d.g === g)) rows.push({ t: 'cal', rate: gearShare(b) });
  }
  cache.set(key, rows);
  return rows;
}
// Çarkın eşsiz dilimi oyuncunun seviyesine bağlıdır: katalog satırı oyuncuya göre hesaplanır (uygun değilse 0)
export const wheelUniqueRate = (b, lvl) => { const pool = wheelUniques(lvl); return pool.includes(b) ? wheelShare('unique') / pool.length : 0; };

// ---------- Nöbet (pvpops.js): bir aşamanın tek seferde beklenen ganimeti ----------
// units: aşamanın yaratıkları · tier: zorluk kademesi. Gerçek tablolardan toplanır (rollKill ile aynı oranlar):
// { gear: kademe eşyası adedi, rare: bunun Nadir olan kısmı, stone0/1/2, dust: toz adedi, seal, ember, unique }
export function expectedDrops(units, tier = 0) {
  const T = tierDrop(tier), out = { gear: 0, rare: 0, stone0: 0, stone1: 0, stone2: 0, dust: 0, seal: 0, ember: 0, unique: 0 };
  for (const u of units) for (const [key, rate] of dropRows(u.mob, u.rank, tier)) {
    if (key === 'gear') { out.gear += rate; out.rare += rate * share(gradeTable(u.rank, T), 1); }
    else if (key === 'dust') out.dust += rate * dustMean(u.rank);
    else if (key in out) out[key] += rate;
    else if (key.startsWith('u:')) out.unique += rate;
  }
  return out;
}
