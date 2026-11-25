// "pvp" paketinin bölge, eşya ve yetenek tablolarına dayanan saf hesapları: Nöbet (uzun oto-farm) birikimi ve
// "Dönüm noktaları" (hangi seviyede ne açılır). Gizli tablo içermez; istemciye sunulur. Tablolar pvp.js'tedir.
import { UNLOCK, GAME, CLASSES, CLASS_KEYS, SKILL_POINTS_FROM_LEVEL, TREE_NODES, ENERGY } from './content.js';
import { ZONES, stageDef, stageId, mobXp, mobAkce } from './zones.js';
import { TIERS, COEF } from './items.js';
import { classSkills } from './skills.js';
import { PATH } from './paths.js';
import { perks } from './state.js';
import { FARM, farmFocus, STAGE_TIERS, starsOf, validTier, CLIMB } from './pvp.js';
import { KINGDOM, GRANT } from './realm.js';

const HOUR = 3600000;

// ---------- Nöbet ----------
// Nöbet tutulabilecek bölge: o zorluk kademesinde son boss'u geçilmiş olmalı
export const farmZoneOpen = (p, z, tier = 0) => Number.isInteger(z) && z >= 1 && z <= ZONES.length && validTier(tier) && !!starsOf(p, tier)[stageId(z, FARM.boss)];
// Nöbetin "oynadığı" stage: bölgenin son yaratık aşaması
export const farmRef = (z, tier = 0) => stageDef(stageId(z, FARM.ref), tier);
// Tick (10 dakika) başına deneyim ve akçe: aşamanın tam kazancı × odağın oranı (üst kademede akçe çarpanıyla)
export function farmRate(z, tier, focus) {
  const d = farmRef(z, tier), F = farmFocus(focus);
  let xp = 0, akce = 0;
  for (const u of d.waves.flat()) { xp += mobXp(u.lvl, u.rank); akce += mobAkce(u.lvl, u.rank); }
  return { stage: d.id, lvl: d.lvl, kills: d.waves.flat().length, xp: xp * F.xp, akce: akce * F.akce * (tier ? STAGE_TIERS[tier].akce : 1) };
}
export const farmCapHours = (p, now) => perks(p, now).idleHours;
// Süren nöbetin birikimi: geçen süre sunucu saatinden hesaplanır, tavanla sınırlıdır (eşyalar toplarken zarla belirlenir)
export function farmStock(p, now) {
  return null; // Nöbet oyundan kaldırıldı
  const f = p.farm;
  if (!f || !f.z) return null;
  const cap = farmCapHours(p, now) * HOUR / FARM.tickMs, ticks = Math.max(0, Math.min(cap, Math.floor((now - f.at) / FARM.tickMs))), R = farmRate(f.z, f.t, f.f);
  return { z: f.z, tier: f.t, focus: f.f, stage: R.stage, ticks, cap, xp: Math.round(R.xp * ticks), akce: Math.round(R.akce * ticks), fullAt: f.at + cap * FARM.tickMs };
}
export const farmFullAt = (p, now) => farmStock(p, now)?.fullAt || 0;

// ---------- Dönüm noktaları ----------
// Seviye atlamak yalnızca stat değildir: hangi seviyede hangi bina, mod, yetenek ve eşya kademesi açılır. Liste, kuralların
// okuduğu tablolardan (UNLOCK, yetenekler, eşya kademeleri, bölgeler) üretilir; elle yazılmış seviye yoktur.
// Kayıt: { lvl, kind: 'build' | 'mode' | 'skill' | 'gear' | 'zone' | 'sys', icon, name, note }
const UNLOCK_INFO = {
  anvil:  ['build', 'forge',   'Örs',             'Eşyaya artı basılır, fazlası parçalanır'],
  mine:   ['build', 'mine',    'Maden',           'Sen yokken cevher biriktirir'],
  arena:  ['mode',  'arena',   'Meydan ve Akın',  'Oyunculara karşı dövüş, lig ve sezon ödülü'],
  sweep:  ['sys',   'energy',  'Seri savaş',      '3 yıldızlı aşama tek dokunuşla ×5 / ×10 oynanır'],
  market: ['build', 'market',  'Pazar ve Tüccar','Oyuncudan oyuncuya eşya alım satımı'],
  clan:   ['build', 'clan',    'Klan Karargâhı',  'Klan kur ya da katıl; Oba Avı'],
  hall:   ['build', 'san',     'CZ - PK',         'Şan Divanı, Meydan ve Meydan Marketi'],
  well:   ['mode',  'well',    'Dipsiz Kuyu',     '10 dalga; her dalga bir bileği taşı'],
  wheel:  ['build', 'crystal', 'Kader Çarkı',     'Parçaları kır: taş, Nadir ve Eşsiz eşya'],
  depth:  ['mode',  'depth',   'Yeraltı Ocağı',   `${CLIMB.floors} kat; her sezon sıfırlanır, her kat ödül verir`],
  seal:   ['mode',  'sealroom', 'Mühürlü Oda',    'Mühür Taşı ile boss; eşsiz şansı 3 kat'],
  live:   ['mode',  'timer',   'Canlı Meydan',    'Süreli düello, ayrı sıralama'],
  rift:   ['mode',  'rift',    'Gök Yarığı',      'Hafta sonu açılır; Kader Çarkı parçası verir'],
  banner: ['mode',  'banner',  'Sancak Savaşı',   'Tek kahramanla 3 raunt'],
  siege:  ['mode',  'siege',   'Hisar Kuşatması', 'Haftalık klan yarışı'],
};
let MILES = null;
export function milestones() {
  if (MILES) return MILES;
  const out = [], add = (lvl, kind, icon, name, note, extra = {}) => out.push({ lvl, kind, icon, name, note, ...extra });
  for (const k in UNLOCK) { const I = UNLOCK_INFO[k]; if (I) add(UNLOCK[k], I[0], I[1], I[2], I[3], { key: k }); }
  // Başlangıç yetenekleri (seviyeyle kendiliğinden gelir) ve yetenek ağaçları
  for (const c of CLASS_KEYS) for (const s of classSkills(c)) if (s.lvl > 1 && !s.tree && !s.master && !s.path) add(s.lvl, 'skill', 'skill', `${CLASSES[c].name}: ${s.name}`, 'Yeni yetenek', { cls: c, skill: s.id });
  add(PATH.level, 'skill', 'star', 'Uzmanlık yolları', `Sınıfının iki uzmanlığından birini seçer (Karakter → Yetenek); uzmanlığın ağacına verdiğin puan ${PATH.actives.length} aktif, ${PATH.passives.length} pasif yolu da açar`, { key: 'path' });
  add(SKILL_POINTS_FROM_LEVEL, 'skill', 'star', 'Yetenek ağaçları', `Ortak ağaç + uzmanlığının ağacı; seviye başına 2 yetenek puanı, ilk yetenek ${TREE_NODES[0]} puanda`);
  // Eşya kademeleri: kuşanma seviyesi
  TIERS.forEach((T, i) => { if (i) add(T.req, 'gear', 'chest', `${i + 1}. kademe silah, zırh ve takı`, `${i + 1}. kademe eşya kuşanılır${i === COEF.minTier ? '; savunma katsayıları ve dirençler bu kademede başlar' : ''}`); });
  // Bölgeler (önerilen seviye; bölge, önceki bölgenin son boss'u geçilince açılır)
  for (const Z of ZONES) if (Z.id > 1) add(Z.lv[0], 'zone', 'zone' + Z.id, Z.name, `Sv. ${Z.lv[0]}-${Z.lv[1]} bölgesi; önceki bölgenin son Boss’u geçilince açılır`);
  // Irk ve diyar (realm.js): seçimde oy, ulufe alma ve adaylık eşikleri
  add(KINGDOM.voteLvl, 'sys', 'crown', `${KINGDOM.title} seçiminde oy`, KINGDOM.voteLvl === GRANT.minLvl ? `Irkının haftalık seçiminde oy verilir; ${GRANT.name.toLocaleLowerCase('tr-TR')} alınabilir` : 'Irkının haftalık seçiminde oy verilir', { key: 'vote' });
  add(KINGDOM.candLvl, 'sys', 'crown', `${KINGDOM.title} adaylığı`, `${KINGDOM.candSan.toLocaleString('tr-TR')} Şan ve ${KINGDOM.deposit.toLocaleString('tr-TR')} akçe depozitoyla aday olunur`, { key: 'cand' });
  add(GAME.maxLevel, 'sys', 'crown', 'En yüksek seviye', `Bölgelerin ${STAGE_TIERS.slice(1).map(t => t.name).join(' ve ')} kademeleri son Boss’tan sonra açılır`);
  out.sort((a, b) => a.lvl - b.lvl);
  return (MILES = out);
}
// Seviyelere göre gruplanmış hâli: [{ lvl, items: [...] }]
export function milestoneTrack() {
  const by = new Map();
  for (const m of milestones()) { if (!by.has(m.lvl)) by.set(m.lvl, []); by.get(m.lvl).push(m); }
  return [...by].map(([lvl, items]) => ({ lvl, items }));
}
// Sıradaki dönüm noktası (seviyesi oyuncunun seviyesinden büyük ilk grup); yoksa null
export const nextMilestone = lvl => milestoneTrack().find(g => g.lvl > lvl) || null;
// Seviye atlayınca yeni açılanlar: (from, to] aralığındaki kayıtlar
export const milestonesBetween = (from, to) => milestones().filter(m => m.lvl > from && m.lvl <= to);
export const LEVEL_UP_GAIN = { energy: ENERGY.levelUpBonus };
