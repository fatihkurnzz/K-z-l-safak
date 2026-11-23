// Bölgeler, yaratıklar ve stage üretimi. Bir bölge 5 bloktur: 4 yaratık aşaması + 1 kapı aşaması (5, 10, 15, 20, 25).
// Son kapı günlük boss'tur (günde 1 hak). Bütün adlar bu oyuna özgüdür.
import { SKILLS } from './skills.js';
import { buildBestiary, FOREST_MOBS } from './bestiary.js';
export { FOREST_MOBS };
import { STAGE_TIERS, tierUnit } from './pvp.js';

export const ZONES = [
  { id: 1, name: 'Vahran Ovası', lv: [1, 20], env: 'forest', open: true, k: { hp: 1, atk: 1 },
    desc: 'Üç yüz yıldır kanla sulanan ova. Uzun otun altında kırık mızraklar ve unutulmuş kemikler; yaban sürüleri, goblinler, iskeletler ve kurtlar.',
    blocks: [
      { mob: 'yagmaci',  mix: null,       gate: 'kitir' },
      { mob: 'saman',    mix: 'yagmaci',  gate: 'ebekul' },
      { mob: 'taskiran', mix: 'saman',    gate: 'borak' },
      { mob: 'nobetci',  mix: 'taskiran', gate: 'sungur', env: 'graveyard' },
      { mob: 'akinci',   mix: 'nobetci',  gate: 'gurtas', bossEnv: 'arena' },
    ] },
  { id: 2, name: 'Kül Geçidi', lv: [20, 40], env: 'castle', open: true, k: { hp: 1, atk: 0.87 },
    desc: 'Sönmüş yanardağın eteğindeki dar geçit. Akrepler, zombiler, kertenkele adamlar, ateşli kayalar ve ağaç hayaletleri; yerde hiçbir ateşe ait olmayan ince gri kül.',
    blocks: [
      { mob: 'korcu', mix: null,    gate: 'demirdis' },
      { mob: 'kulcu', mix: 'korcu', gate: 'kulana' },
      { mob: 'curuf', mix: 'kulcu', gate: 'alazhan' },
      { mob: 'islik', mix: 'curuf', gate: 'tunga' },
      { mob: 'yanik', mix: 'islik', gate: 'karakor' },
    ] },
  { id: 3, name: 'Kızıl Bahar Meydanı', lv: [40, 60], env: 'arena', open: true, k: { hp: 1, atk: 1 },
    desc: 'Kızıl Bahar’da iki ordunun çarpıştığı alan; o yıl burada çiçek açmadı. Kılıç dişli kediler, troller, sentorlar, harpiler ve dev yaratıklar; ölülerin başında eğilen gri gölgeler.',
    blocks: [
      { mob: 'capulcu', mix: null,      gate: 'sarmaz' },
      { mob: 'kam',     mix: 'capulcu', gate: 'kayra' },
      { mob: 'pusat',   mix: 'kam',     gate: 'aysar' },
      { mob: 'yayci',   mix: 'pusat',   gate: 'tolun' },
      { mob: 'tugci',   mix: 'yayci',   gate: 'kursad' },
    ] },
  { id: 4, name: 'Sisli Çukur', lv: [60, 65], env: 'shrine', open: true, k: { hp: 0.9, atk: 0.88 },
    desc: 'Ovanın kuzeyinde, eski bir muharebenin kemikleriyle dolu sisli çukur. Hayaletler, kara şövalyeler, ölü büyücüler ve kâbus atları; ateşsiz kazanın çevresinde Küllerin Tarikatı toplanır.',
    blocks: [
      { mob: 'ayazci',  mix: null,      gate: 'tugrak' },
      { mob: 'buzkam',  mix: 'ayazci',  gate: 'umay' },
      { mob: 'kardevi', mix: 'buzkam',  gate: 'kocaoglan' },
      { mob: 'donuk',   mix: 'kardevi', gate: 'erlik', env: 'graveyard' },
      { mob: 'tipici',  mix: 'donuk',   gate: 'bozdag' },
    ] },
];
export const STAGES_PER_ZONE = 25;
// 19 Kas: stage arazisi (yalnızca görünüm; js/models.js ENVS). Her bölgenin beş bloğu farklı bir araziye düşer; bloğun içinde iki arazi sırayla döner.
const BIOMES = { 1: [['meadow', 'steppe'], ['forest', 'meadow'], ['autumn', 'forest'], ['meadow', 'swamp'], ['steppe', 'autumn']], 2: [['canyon', 'desert'], ['desert', 'canyon'], ['ashland', 'canyon'], ['desert', 'steppe'], ['ashland', 'desert']], 3: [['steppe', 'autumn'], ['autumn', 'meadow'], ['canyon', 'steppe'], ['meadow', 'autumn'], ['snow', 'steppe']], 4: [['swamp', 'snow'], ['snow', 'glacier'], ['glacier', 'swamp'], ['swamp', 'ashland'], ['glacier', 'snow']] };
export const biomeOf = (z, bi, n) => { const L = BIOMES[z]?.[bi] || ['meadow', 'forest']; return L[(n - 1) % 5 < 3 ? 0 : 1]; };

// k: seviye eğrisine uygulanan çarpanlar · weak: zayıf olduğu element · look: prosedürel 3D model
// Yaratıklar: hikâye ve etkinlik canavarları burada; bölge canavarları shared/bestiary.js ailelerinden kurulur (VAHRAN, 18.11.2026).
// Eski boss kimliklerinin eşsiz eşyaları aynı bölge ve sıradaki yeni bosslara aktarıldı (UNIQUE_MOVE).
const UNIQUE_MOVE = { werewolf: ['u:beykemeri', 'u:bataklikmuhru'], lizardman_captain: ['u:korasa', 'u:alazyuzugu'], giant_golem: ['u:curufkusagi', 'u:tungakalkani'],
  tree_ghost_king: ['u:gecitbekcisi', 'u:iskolyesi'], meganthereon: ['u:capulcudisi', 'u:sirtlankupesi'], troll_king: ['u:kamtokmagi', 'u:kamboncugu'], centaur_captain: ['u:aysarteberi', 'u:bozkirmuhru'],
  harpy_queen: ['u:tolunyayi', 'u:kartalkupesi'], manticore: ['u:hankilici', 'u:hankusagi'], mana_predator: ['u:ayazsiperi', 'u:kiragiyuzugu'], death_knight: ['u:buzkahinasasi', 'u:buzkolyesi'], lich: ['u:cig', 'u:devkusagi'],
  red_dragon_hatchling: ['u:hankilici', 'u:hankusagi'], bone_dragon: ['u:cig', 'u:devkusagi'], blue_dragon: ['u:buzkahinasasi', 'u:buzkolyesi'], dark_dragon: ['u:donukdis', 'u:mezarkupesi'],
  gold_dragon: ['u:ayazsiperi', 'u:kiragiyuzugu'], red_dragon: ['u:yaylahukmu', 'u:hakanmuhru'] };
export const BEST = buildBestiary(UNIQUE_MOVE);
export const MOBS = {
  // Öğretici: Yemin Pazarı'ndaki çocuğun kardeşini yutan Dev Solucan (event + tut: bölge listelerinde, günlük boss'larda ve
  // ansiklopedide görünmez; yalnızca öğreticinin 'worm' savaşında çıkar)
  devsolucan: { name: 'Dev Solucan', zone: 1, boss: true, event: true, tut: true, k: { hp: 7, atk: 0.9, def: 0.7 }, spd: 92, crit: 0.06, weak: 'fire', skills: ['x_hit', 'x_crush'],
    phases: [{ at: 0.5, text: 'Dev Solucan topraktan bir kez daha fırlıyor!' }],
    look: { kind: 'worm', weapon: 'club', scale: 1.15, skin: 0x8a5a4a, belly: 0xc99a7a } },
  // 4. bölgenin hikâye bossları (VAHRAN): Mareşal Marven ve Adsız
  erlik:     { name: 'Mareşal Marven', zone: 4, boss: true, k: { hp: 32, atk: 1.6, def: 1.4 }, spd: 102, crit: 0.18, weak: 'fire', skills: ['x_hit', 'x_drain', 'x_curse', 'x_execute'],
    phases: [{ at: 0.5, text: 'Marven kılıcını çekiyor: “Tarih hayatta kalanların!”' }], uniques: ['u:donukdis', 'u:mezarkupesi'],
    look: { skin: 0xcfe6f2, armor: 0x1a2a3a, trim: 0x9ae8ff, cape: 0x0a1420, weapon: 'scythe', helmet: 'crown', glowEyes: 0x9ae8ff, scale: 1.7, armorType: 'bones', fx: 0x9ae8ff } },
  bozdag:    { name: 'Adsız, Tarikat Lideri', zone: 4, boss: true, cult: true, k: { hp: 34, atk: 1.45, def: 1.5 }, spd: 106, crit: 0.18, weak: 'fire', skills: ['x_hit', 'x_cleave', 'x_blizzard', 'x_execute', 'x_rage'],
    phases: [{ at: 0.6, text: 'Adsız kollarını açıyor; kül yağmaya başlıyor!' }, { at: 0.25, text: 'Korlar sönmek üzere: Adsız son gücünü topluyor!' }], uniques: ['u:yaylahukmu', 'u:hakanmuhru'],
    look: { skin: 0xd8c0a8, armor: 0xf2f6fa, trim: 0xe7c75a, accent: 0x2d6fa3, cape: 0x2d6fa3, weapon: 'mace', shield: true, helmet: 'crown', beard: true, hair: 0xffffff, scale: 1.95, fx: 0xfff3a0, spikes: true } },

  // ---------- Klan avı (etkinlik yaratığı; süre dolana kadar hasar verilir) ----------
  tepegoz:   { name: 'Tepegöz', zone: 1, boss: true, event: true, k: { hp: 400, atk: 1.25, def: 1.3 }, spd: 98, crit: 0.1, weak: 'bolt', skills: ['x_hit', 'x_smash', 'x_quake', 'x_roar'], uniques: [],
    look: { skin: 0x8a7a5a, armor: 0x3a2a1a, trim: 0x8a8f96, weapon: 'club', helmet: 'none', tusks: true, scale: 2.1, armorType: 'leather', glowEyes: 0xffd36a } },
  // ---------- Dünya Baskını (hafta sonu; iki ırk ortak havuza hasar yazar, baskin.js) ----------
  // ---------- Kristal Nöbeti (nobet.js): Sönmüş Mabet'in muhafızı ve son dakikaların boss'u ----------
  kristalbekci: { name: 'Kristal Muhafızı', zone: 3, captain: true, event: true, k: { hp: 6, atk: 1.05, def: 1.3 }, spd: 96, crit: 0.08, weak: 'bolt', skills: ['x_hit', 'x_frost', 'x_roar'], uniques: [],
    look: { skin: 0x7ab8e0, armor: 0x2a5a8a, trim: 0xcfeaff, accent: 0x8fd0ff, weapon: 'mace', helmet: 'horned', glowEyes: 0x9ae6ff, scale: 1.5, fx: 0x8fd0ff, spikes: true } },
  lavyurek: { name: 'Lav Yürek', zone: 4, boss: true, event: true, k: { hp: 30, atk: 1.5, def: 1.35 }, spd: 94, crit: 0.12, weak: 'ice', skills: ['x_hit', 'x_lavanova', 'x_smash', 'x_firestorm', 'x_roar'], uniques: [],
    phases: [{ at: 0.6, text: 'Lav Yürek kaynıyor: kristal titriyor!' }, { at: 0.25, text: 'Lav Yürek’in kabuğu çatladı, ateş taşıyor!' }],
    look: { skin: 0x2a1c18, armor: 0x1a100c, trim: 0xff6a1a, accent: 0xffb347, weapon: 'club', helmet: 'none', glowEyes: 0xffb02e, scale: 2.3, fx: 0xff5a14, spikes: true, armorType: 'leather' } },
  karaduman: { name: 'Kül Ağası Karadun', zone: 1, cult: true, boss: true, event: true, k: { hp: 420, atk: 1.3, def: 1.25 }, spd: 100, crit: 0.12, weak: 'ice', skills: ['x_hit', 'x_fire', 'x_firestorm', 'x_smash', 'x_roar'], uniques: [],
    phases: [{ at: 0.66, text: 'Karadun külünü savuruyor!' }, { at: 0.33, text: 'Kor zırhı kızıla kesti!' }],
    look: { skin: 0x3a2e28, armor: 0x1c1512, trim: 0xff7a1a, accent: 0xffb347, cape: 0x2a120a, weapon: 'mace', helmet: 'horned', glowEyes: 0xff8a2a, scale: 2.0, fx: 0xff7a1a, spikes: true } },
  ...BEST.mobs,
};
// Blokları canavar aileleri doldurur (bestiary.js): her blokta temel (b), savaşçı (w), büyücü (m) ve ek üyeler (x) + kapı.
for (const Z of ZONES) Z.blocks = Z.blocks.map((old, i) => { const F = BEST.blocks[`${Z.id}-${i + 1}`]; return { mob: F.b, fam: F, gate: F.gate, env: F.env || old.env, bossEnv: F.bossEnv || old.bossEnv }; });

const RANK = { n: { hp: 1, atk: 1, name: '' }, e: { hp: 2.4, atk: 1.2, name: 'Azılı ' } };
// Yaratığın silah sınıfı (kahramanın hangi savunma katsayısının devreye gireceğini belirler): modelindeki silahtan gelir
const MOB_WC = { dagger: 'dagger', staff: 'staff', axe: 'axe', sword: 'sword', club: 'mace', bow: 'bow', mace: 'mace', scythe: 'axe' };
export const mobClass = mob => MOB_WC[MOBS[mob].look.weapon] || 'sword';
// Yaratığın yeteneklerindeki elementler (kahramanın hangi direncinin işe yarayacağı)
export const mobElements = mob => [...new Set(MOBS[mob].skills.flatMap(s => SKILLS[s].fx.map(f => f.el).filter(Boolean)))];
// Yaratığın kendi katsayıları: 30. seviyeden sonra (kahramanlarda katsayılı eşyanın başladığı yer) görünüşünden türetilir.
// Kemik zırh oka ve hançere, kalkan kılıca ve oka, ateş/buz büyücüsü kendi elementine dayanıklıdır.
export const MOB_RES_LEVEL = 30;
export function mobRes(mob, lvl) {
  const M = MOBS[mob], L = M.look, r = {}, el = mobElements(mob);
  if (lvl < MOB_RES_LEVEL) return r;
  const add = (k, v) => { r[k] = Math.round(((r[k] || 0) + v) * 100) / 100; };
  if (L.armorType === 'bones') { add('bow', 0.15); add('dagger', 0.1); }
  if (L.shield) { add('sword', 0.1); add('bow', 0.1); }
  if (el.includes('fire')) add('fire', 0.15);
  if (el.includes('ice')) add('ice', 0.15);
  return r;
}
// Savaş motoruna girecek yaratık birimi
// Boss güçlendirmesi (19 Kas, kullanıcı: "bossları biraz güçlendir"): bütün bosslar (aile, hikâye, dünya, ejderha) aynı çarpanla
export const BOSS_BUFF = { hp: 1.25, atk: 1.2, def: 1.1 };
// Boss olmayan canavarlar (kaptan dahil; 19 Kas, kullanıcı: nitelikler 3 saldırı / 15 can olunca oyun çok kolaylaştı)
// Seviyeyle açılır: Sv. 10'da çarpan yok, Sv. 40 ve üstünde tam (nitelik puanı seviyeyle biriktiği için erken oyunu ezmesin)
export const MOB_BUFF = { hp: 1.8, atk: 1.6, def: 1 };
const mobBuff = lvl => { const k = Math.min(1, Math.max(0, (lvl - 10) / 30)); return { hp: 1 + (MOB_BUFF.hp - 1) * k, atk: 1 + (MOB_BUFF.atk - 1) * k, def: 1 }; };
export function mobUnit(mob, lvl, rank = 'n') {
  const M = MOBS[mob], R = RANK[rank] || RANK.n, Z = ZONES[M.zone - 1].k, BB = M.boss ? BOSS_BUFF : mobBuff(lvl);
  const pow = Math.round((14 + 9 * lvl) * M.k.atk * R.atk * Z.atk * BB.atk);
  return {
    key: mob, mob, rank: M.boss ? 'b' : M.captain ? 'c' : rank, name: R.name + M.name, lvl,
    boss: !!M.boss, captain: !!M.captain, elite: rank === 'e',
    maxHp: Math.round((45 + 17 * lvl) * M.k.hp * R.hp * Z.hp * BB.hp), atk: pow, mag: pow, def: Math.round((10 + 1.8 * lvl) * M.k.def * BB.def),
    spd: M.spd, crit: M.crit, critDmg: 1.5, weak: M.weak || null, ccRes: M.boss ? 0.6 : M.captain ? 0.4 : 0,
    focus: M.boss || M.captain ? 0.6 : rank === 'e' ? 0.5 : 0.35, // en düşük canlı hedefe odaklanma olasılığı
    mods: {}, skills: M.skills, phases: M.phases || null,
    wt: mobClass(mob), pen: 0, res: mobRes(mob, lvl), ...(M.cult ? { cult: true } : {}), // cult: Küllerin Tarikatı (istemcide sahne solar)
  };
}

export const stageId = (zone, n) => `${zone}-${n}`;
// tier: zorluk kademesi (0 Olağan · 1 Çetin · 2 Yaman; pvp.js: STAGE_TIERS). Üst kademede dizilim aynıdır; yaratıklar kademenin
// seviyesinde kurulur ve oyunun başından sonuna (1-1 → 4-25) büyüyen çarpanlarla, ek direnç ve savunma delmeyle güçlenir.
export function stageDef(id, tier = 0) {
  const [z, n] = String(id).split('-').map(Number);
  const Z = ZONES.find(x => x.id === z), T = tier ? STAGE_TIERS[tier] : null;
  if (!Z || !Z.open || !(n >= 1 && n <= STAGES_PER_ZONE) || (tier && !T)) return null;
  const bi = Math.floor((n - 1) / 5), B = Z.blocks[bi], pos = (n - 1) % 5;
  const lvl = T ? T.lvl : Math.round(Z.lv[0] + (n - 1) * (Z.lv[1] - Z.lv[0]) / (STAGES_PER_ZONE - 1));
  const prog = ((z - 1) * STAGES_PER_ZONE + n - 1) / (ZONES.length * STAGES_PER_ZONE - 1);
  // Aile dizilimi (bestiary.js): b temel · w savaşçı · mg büyücü · x/x2 ek üyeler (aşamaya göre sırayla)
  const F = B.fam, m = F.b, w = F.w, mg = F.m, xs = F.x.length ? F.x : [m], x = xs[(n - 1) % xs.length], x2 = xs[n % xs.length];
  const G = MOBS[B.gate];
  let kind = 'mob', waves, energy = 6, env = B.env === 'graveyard' || B.env === 'forest' ? B.env : biomeOf(z, bi, n), name = MOBS[m].name; // 19 Kas: doğal arazi (meydan değil)
  if (z === 1 && n <= 2 && !T) {
    waves = n === 1 ? [[m, m], [m, m, m], [m, [m, 'e'], m]] : [[m, w], [m, m, w], [m, w, mg]]; // alıştırma
  } else if (pos < 4) {
    waves = [[[m, w, mg], [m, m, w, mg], [m, w, x, mg]], [[m, w, mg], [m, x, w, mg], [m, w, [x, 'e'], mg]],
      [[m, w, mg], [w, x, x2, mg], [m, w, x, [mg, 'e']]], [[m, w, mg, x], [w, [m, 'e'], x, mg], [m, w, [w, 'e'], x2, mg]]][pos];
  } else if (G.boss) {
    kind = 'boss'; energy = 0; name = G.name; // boss da kendi arazisinde karşılanır
    waves = [[[w, 'e'], B.gate, [mg, 'e']]];
  } else {
    kind = 'gate'; energy = 8; name = G.name;
    waves = [[m, w, mg], [w, [m, 'e'], x, mg], [w, B.gate, mg]];
  }
  if (T && kind !== 'boss') energy = kind === 'gate' ? T.energy.gate : T.energy.mob;
  const unitsOf = w => w.map(e => tierUnit(Array.isArray(e) ? mobUnit(e[0], lvl, e[1]) : mobUnit(e, lvl), tier, prog, Z.k));
  return {
    id: stageId(z, n), tier, zone: z, n, lvl, kind, name, env, energy, mob: m, gate: pos === 4 ? B.gate : null,
    title: `${Z.name} ${n}${T ? ` (${T.name})` : ''} · ${name}`,
    enrageTurn: kind === 'boss' ? 110 : 0,
    waves: waves.map(unitsOf),
  };
}
export const zoneStages = (z, tier = 0) => Array.from({ length: STAGES_PER_ZONE }, (_, i) => stageDef(stageId(z, i + 1), tier));
// Bir bölgedeki yaratıkların ansiklopedi sırası
export const zoneMobs = z => Object.entries(MOBS).filter(([, m]) => m.zone === z && !m.event).map(([id]) => id);
// Yaratığın bulunduğu aşamalar
export function mobStages(mob) {
  const out = [];
  for (const Z of ZONES) if (Z.open) for (const s of zoneStages(Z.id)) if (s.waves.some(w => w.some(u => u.mob === mob))) out.push(s.id);
  return out;
}

// Deneyim ve akçe (yaratık başına)
const RANK_REWARD = { n: 1, e: 3, c: 8, b: 30 };
export const mobXp = (lvl, rank) => Math.round((6 + 3 * lvl) * RANK_REWARD[rank]);
export const mobAkce = (lvl, rank) => Math.round((4 + 2 * lvl) * RANK_REWARD[rank]);

// Seviyeye uygun bölgenin sıradan yaratıkları ve boss'ları (zindan ve etkinlik dalgaları bunlardan kurulur)
export const zoneForLevel = lvl => ZONES.findLast(z => lvl >= z.lv[0]) || ZONES[0];
export const zoneNormals = z => z.blocks.flatMap(b => [b.fam.b, b.fam.w, b.fam.m, ...b.fam.x]);
export const zoneBosses = z => z.blocks.map(b => b.gate).filter(g => MOBS[g].boss || MOBS[g].captain);
export const allBosses = () => Object.entries(MOBS).filter(([, m]) => m.boss && !m.event).map(([id]) => id);
