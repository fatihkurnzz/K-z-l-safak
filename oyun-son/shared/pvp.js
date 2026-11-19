// "pvp" paketi: meydan eşleştirmesi ve sezonu, zorluk kademeleri, aylık Yeraltı Ocağı, haftalık zindan düzenleri ve
// Nöbet'in (uzun oto-farm) tabloları ile saf hesapları. Gizli oran içermez; istemciye sunulur (arayüz aynı tabloları okur).
// Kurallar pvpops.js'te, bölge/eşya tablolarına dayanan hesaplar pvpcalc.js'tedir. Bu dosya yalnızca content.js'i içe aktarır
// (zones.js ve meta.js bu dosyayı okur; döngü olmasın).
import { LEAGUES, dayKey, weekKey } from './content.js';
import { RULES } from './rules.js';

const DAY = 86400000, HOUR = 3600000;
const r2 = v => Math.round(v * 100) / 100;

// ---------- 1. Eşleştirme: Eşya Seviyesi'ne göre ----------
// Rakip listesi önce oyuncunun eşya seviyesinin ±%20'sindeki kayıtlardan kurulur; yeterli rakip yoksa aralık basamak
// basamak genişler. Aralıktaki adaylar arasından puanı en yakın olanlar (pool) içinden rastgele seçilir.
export const MATCH = { steps: [0.2, 0.35, 0.5], pool: 12 };
export const ilBand = (il, pct = MATCH.steps[0]) => ({ lo: Math.max(0, Math.floor(il * (1 - pct))), hi: Math.ceil(il * (1 + pct)) });
export const inBand = (il, band) => Number.isFinite(il) && il >= band.lo && il <= band.hi;

// ---------- 2. Meydan sezonu ----------
// Sezon 28 gündür (dört hafta) ve aylık takvimle aynı gün, pazartesi 00:00'da (UTC+3) başlar. Her hafta başında puanın
// 1000'in üstündeki kısmı weekKeep'e iner (yumuşak sıfırlama); sezon başında seasonKeep'e iner, 1000'in altı 1000'e çıkar.
// dim: aynı hesaba karşı sezon içindeki n. galibiyetin puan çarpanı (listeden sonrası 0): puan alışverişine karşı.
export const SEASON = { days: 28, weeks: 4, zero: 730, base: 1000, weekKeep: 0.8, seasonKeep: 0.4, minGames: 10, histMax: 12, dim: [1, 0.75, 0.5, 0.25, 0.1, 0.1], vsMax: 300, topN: 100 };
export const seasonOf = now => Math.floor(weekKey(now) / SEASON.weeks);
export const seasonNo = sn => sn - SEASON.zero;                       // oyuncuya gösterilen sıra numarası
export const seasonStart = sn => (sn * SEASON.days - 3) * DAY - 3 * HOUR; // sezonun başladığı an (ms)
export const seasonEndAt = now => seasonStart(seasonOf(now) + 1);
export const seasonWeek = now => weekKey(now) % SEASON.weeks;         // 0 … 3
export const softWeek = r => (r > SEASON.base ? SEASON.base + Math.round((r - SEASON.base) * SEASON.weekKeep) : r);
export const softSeason = r => (r > SEASON.base ? SEASON.base + Math.round((r - SEASON.base) * SEASON.seasonKeep) : SEASON.base);
export const leagueIndex = r => LEAGUES.findLastIndex(l => r >= l.min);
// Kullanıcı kuralı: her zafer +3, aynı rakibe tekrar zaferde de azalma yok (eski azalan çarpan kaldırıldı; eski içe aktarmalar için 1)
export const dimFactor = () => 1;

// ---------- 2b. Meydan puanı, karşı ırk ve günün üstün ırkı ----------
// Meydan'da yalnızca KARŞI ırktan rakiple dövüşülür (eşleştirme, Canlı Meydan, Kan Davası rövanşı, yapay rakipler).
// Puan: saldırıda her zafer +win (aynı rakibe tekrar zaferde de tam puan); savunmada saldırıyı püskürtünce
// savunana +def (bir sonraki Meydan açılışında işlenir). Yenilgide puan düşmez (kLoss/kLive = 0).
// Günlük ırk yarışı: o gün (sunucu günü, dayKey) iki ırkın kazandığı Meydan puanı toplanır; gün bitince fazla olan
// "Günün Üstün Irkı" olur. O gün en az bir Meydan savaşı yapan oyuncuya ertesi gün ilk istekte posta gelir:
// üstün ırk top birim, diğer ırk low birim (3:1); beraberlikte iki ırk da tie birim.
export const ARENA_PTS = { win: 3, def: 3, kLoss: 0, kLive: 0 }; // yenilgide puan düşmez (kullanıcı kuralı: yalnız zafer ve savunma +3)
export const RACE_DAY = { unit: { yakut: 5, san: 20 }, top: 3, low: 1, tie: 2, shards: 8, keep: 3 };
export const RACES = ['ocak', 'sancak'];
export const foeOf = f => (f === 'ocak' ? 'sancak' : f === 'sancak' ? 'ocak' : null);
export const sameRace = (a, b) => !!a && a === b;
export const raceWinner = t => { const a = t?.ocak || 0, b = t?.sancak || 0; return a > b ? 'ocak' : b > a ? 'sancak' : null; };
export const raceMult = (t, fac) => { const w = raceWinner(t); return !w ? RACE_DAY.tie : w === fac ? RACE_DAY.top : RACE_DAY.low; };
export const raceGive = m => [{ t: 'yakut', n: RACE_DAY.unit.yakut * m }, { t: 'san', n: RACE_DAY.unit.san * m }];
// Oyuncunun bugünkü Meydan katılımı (p.arena.day = { d, n, f }); gün dönünce eskisi ödenmek üzere A.raceDue'ya geçer
export function raceRoll(p, now) {
  const A = p.arena, d = dayKey(now);
  if (A.day && A.day.d !== d) { if (A.day.n > 0) A.raceDue = [...(A.raceDue || []), { d: A.day.d, f: A.day.f || p.faction }].slice(-RACE_DAY.keep); A.day = null; }
  return d;
}
export function raceMark(p, now) {
  const A = p.arena, d = raceRoll(p, now);
  if (!A.day) A.day = { d, n: 0, f: p.faction };
  A.day.n++;
}

// Meydan kaydını (oyuncunun p.arena'sı ya da yayınlanmış meydan belgesi: { rating, sn, wk, sw, sl, vs, peak }) bugüne
// getirir: atlanan her hafta başı için yumuşak sıfırlama, her sezon başı için sezon sıfırlaması uygular. Kapanan sezonları
// (ödülü hesaplanacak) döndürür. Saf ve yinelenebilir: aynı an için ikinci çağrı hiçbir şeyi değiştirmez.
export function rollArena(A, now) {
  const w = weekKey(now), closed = [];
  if (!Number.isInteger(A.wk) || !Number.isInteger(A.sn)) { // sezonlardan önceki kayıt: bulunduğu sezona puanıyla girer
    A.wk = w; A.sn = Math.floor(w / SEASON.weeks);
    if (!Number.isFinite(A.sw)) A.sw = 0; if (!Number.isFinite(A.sl)) A.sl = 0;
    if (!A.vs || typeof A.vs !== 'object') A.vs = {};
    A.peak = Math.max(A.peak || 0, A.rating);
    return closed;
  }
  if (w - A.wk > 600) A.wk = w - 600; // çok eski kayıt: döngü sınırlı kalsın (puan zaten tabana inmiştir)
  while (A.wk < w) {
    A.wk++;
    if (A.wk % SEASON.weeks === 0) {
      closed.push({ sn: A.sn, rating: A.rating, w: A.sw || 0, l: A.sl || 0, peak: Math.max(A.peak || 0, A.rating) });
      A.rating = softSeason(A.rating); A.sn = A.wk / SEASON.weeks; A.sw = 0; A.sl = 0; A.vs = {}; A.peak = A.rating;
    } else A.rating = softWeek(A.rating);
  }
  return closed;
}
// Yayınlanmış meydan belgesinin şu anki puanı (belge yazıldığından beri geçen sıfırlamalar uygulanmış hâli)
export function docRating(doc, now) {
  if (!Number.isInteger(doc.wk)) return doc.rating;
  const A = { rating: doc.rating, sn: doc.sn, wk: doc.wk };
  rollArena(A, now);
  return A.rating;
}
// Belgenin, sn sezonunu kapattığı puan (o sezonda oynamadıysa null): sezon sıralaması bundan kurulur
export function docSeasonFinal(doc, sn) {
  if (!Number.isInteger(doc.wk) || doc.sn !== sn) return null;
  const A = { rating: doc.rating, sn: doc.sn, wk: doc.wk }, last = (sn + 1) * SEASON.weeks - 1;
  while (A.wk < last) { A.wk++; A.rating = softWeek(A.rating); }
  return A.rating;
}

// Sezon sonu ödülleri (postayla gelir). Lig ödülü oyuncunun sezonu kapattığı puana göre, sıra ödülü ilk topN içindeki
// yerine göre verilir; ikisi toplanır. shard: üç parça türünün her birinden verilen adet (Kader Çarkı'nda kırılır).
// title: bir sonraki sezon boyunca seçilebilen unvanın kimliği (çerçevesiyle birlikte).
export const LEAGUE_REWARD = [
  { yakut: 30,  shard: 2,  stone2: 0, title: null },
  { yakut: 80,  shard: 4,  stone2: 1, title: 'sz1' },
  { yakut: 150, shard: 8,  stone2: 2, title: 'sz2' },
  { yakut: 300, shard: 14, stone2: 4, title: 'sz3' },
];
export const RANK_REWARD = [
  { max: 1,   yakut: 500, shard: 20, title: 'szb' },
  { max: 3,   yakut: 300, shard: 14, title: null },
  { max: 10,  yakut: 200, shard: 10, title: null },
  { max: 50,  yakut: 100, shard: 6,  title: null },
  { max: 100, yakut: 50,  shard: 3,  title: null },
];
export const SEASON_TITLES = { sz1: 'Gümüş Yiğit', sz2: 'Altın Yiğit', sz3: 'Şampiyon Yiğit', szb: 'Sezon Fatihi' };
export const seasonTitle = id => (typeof id === 'string' && Object.hasOwn(SEASON_TITLES, id) ? SEASON_TITLES[id] : null);
export const rankReward = rank => (Number.isInteger(rank) && rank >= 1 ? RANK_REWARD.find(r => rank <= r.max) || null : null);
// Verilecek ganimet listesi (grant biçimi) — arayüz tabloyu, sunucu postayı bundan kurar
export function seasonGive(league, rank) {
  const L = LEAGUE_REWARD[league] || LEAGUE_REWARD[0], R = rankReward(rank), n = L.shard + (R?.shard || 0);
  const give = [{ t: 'yakut', n: L.yakut + (R?.yakut || 0) }];
  if (n) for (const k of ['kor', 'ayaz', 'simsek']) give.push({ t: 'shard', k, n });
  if (L.stone2) give.push({ t: 'stone', g: 2, n: L.stone2 });
  return give;
}
// Sezon nişanı (p.arena.mark = { sn: geçerli olduğu sezon, l: lig, r: sıra }) ile seçilebilen unvanlar
export function markTitles(mark, now) {
  if (!mark || mark.sn !== seasonOf(now)) return [];
  const out = [];
  if (LEAGUE_REWARD[mark.l]?.title) out.push(LEAGUE_REWARD[mark.l].title);
  if (rankReward(mark.r)?.title) out.push(rankReward(mark.r).title);
  return out;
}

// ---------- 3a. Zorluk kademeleri (100 stage'in ikinci ve üçüncü turu) ----------
// Bir kademe, önceki kademenin son boss'u (4-25) geçilince açılır; kendi yıldızları ayrı tutulur. Yaratıklar lvl
// seviyesinde kurulur ve stage ilerledikçe (ilk stage → son stage) hp/atk/def çarpanları [baştan, sona] büyür.
// bossHp: boss'un can çarpanı (boss'lar 110. turda öfkelendiği için canları yaratıklardan yavaş büyür).
// res: yaratığın kendi silah türüne ve zayıf olmadığı elementlere eklenen direnç · pen: yaratığın savunma delmesi.
// energy: yaratık / kapı stage'inin bedeli · akce: kesim akçesi çarpanı · first: ilk geçiş yakutu (kapı / boss).
// drop: düşme çarpanları (gear: kademe eşyası oranı · rare: Nadir çıkma payı [sıradan, azılı, kaptan] · stone1/stone2/ember:
// taş ve köz oranı · unique: boss ve yaratık eşsizleri · marks: boss izi adedi).
export const STAGE_TIERS = [
  { id: 0, name: 'Olağan', note: 'Bölgelerin ilk turu.' },
  { id: 1, name: 'Çetin', note: 'Yaratıklar 65. seviyede, dirençli ve savunma delen vuruşlarla gelir.', lvl: 65,
    hp: [1.3, 2.0], bossHp: [0.95, 1.12], atk: [1.1, 1.35], def: [1.0, 1.2], res: 0.1, pen: 0.1, energy: { mob: 8, gate: 10 }, akce: 1.5, first: { gate: 10, boss: 30 },
    drop: { gear: 1.5, rare: [0.45, 0.65, 1], stone1: 2, stone2: 3, ember: 2, unique: 2, marks: 2 } },
  { id: 2, name: 'Yaman', note: 'En sert tur: yüksek direnç, yüksek savunma delme.', lvl: 65,
    hp: [1.9, 2.1], bossHp: [1.1, 1.16], atk: [1.36, 1.42], def: [1.2, 1.3], res: 0.18, pen: 0.2, energy: { mob: 10, gate: 12 }, akce: 2, first: { gate: 15, boss: 50 },
    drop: { gear: 2, rare: [0.65, 1, 1], stone1: 3, stone2: 6, ember: 4, unique: 4, marks: 3 } },
];
export const TIER_MAX = STAGE_TIERS.length - 1;
export const validTier = t => Number.isInteger(t) && t >= 0 && t <= TIER_MAX;
// Kademe yıldızlarının tutulduğu tablo: 0 → p.stages (eski alan), 1-2 → p.tstages[kademe]
export const starsOf = (p, tier = 0) => (tier ? (p.tstages?.[tier] || {}) : p.stages);
// Günlük boss hakkı ve teselli sayaçlarının anahtarı (kademe başına ayrı)
export const tierKey = (id, tier = 0) => (tier ? `${id}@${tier}` : id);
const lerp = ([a, b], t) => a + (b - a) * t;
// Bölgelerin kendi seviye eğrisi çarpanları (zones.js: ZONES[].k) üst kademede tek tabana çekilir: bütün yaratıklar aynı
// seviyede olduğu için zorluk yalnızca kademenin çarpanlarıyla, bölge sırasına göre büyür.
export const TIER_BASE = { hp: 0.9, atk: 0.88 };
// Yaratık birimini kademeye göre güçlendirir. prog: 0 (1-1) … 1 (4-25) · zk: yaratığın bölgesinin çarpanları
export function tierUnit(u, tier, prog, zk = TIER_BASE) {
  const T = STAGE_TIERS[tier];
  if (!tier || !T) return u;
  u = { ...u, maxHp: u.maxHp * TIER_BASE.hp / zk.hp, atk: u.atk * TIER_BASE.atk / zk.atk, mag: u.mag * TIER_BASE.atk / zk.atk };
  const res = { ...u.res }, k = Math.max(0, Math.min(1, prog));
  for (const key of ['fire', 'ice', 'bolt']) if (key !== u.weak) res[key] = r2((res[key] || 0) + T.res);
  res[u.wt] = r2((res[u.wt] || 0) + T.res);
  const atk = lerp(T.atk, k);
  return { ...u, maxHp: Math.round(u.maxHp * lerp(u.boss ? T.bossHp : T.hp, k)), atk: Math.round(u.atk * atk), mag: Math.round(u.mag * atk), def: Math.round(u.def * lerp(T.def, k)), pen: T.pen, res };
}

// ---------- 3b. Yeraltı Ocağı: aylık sıfırlanan tırmanış ----------
// Katlar her sezon başında (28 günde bir) sıfırlanır; her katın ödülü dönem başına bir kez alınır. 50. kattan sonraki
// "kor katları" 65. seviyededir ve kat kat sertleşir. sweep: önceki dönemde inilen katlara kadar seri iniş (sunucu oynatır).
// Katın enerji bedeli, boss katı aralığı ve boss katının yakutu rules.js'tedir (arayüzün sayıyla söylediği kurallar tek tabloda)
export const CLIMB = { floors: RULES.depth.floors, deep: 50, energy: RULES.depth.energy, sweepMax: 10, bossEvery: RULES.depth.bossEvery, bossYakut: RULES.depth.bossYakut };
export const climbCycle = seasonOf;
export const climbLevel = f => (f > CLIMB.deep ? 65 : Math.max(1, Math.min(65, 28 + f)));
export const climbScale = f => (f > CLIMB.deep ? { hp: r2(1.1 + 0.12 * (f - CLIMB.deep)), atk: r2(1.05 + 0.05 * (f - CLIMB.deep)) } : null);
// Kat ödülü (grant biçimi; { t: 'gear', g } oyuncunun kademesinden rastgele Nadir eşyadır)
export function climbRewards(f) {
  const out = [{ t: 'stone', g: 1, n: 1 }, { t: 'gear', g: 1 }];
  if (f % CLIMB.bossEvery === 0) out.push({ t: 'stone', g: 2, n: 1 }, { t: 'yakut', n: CLIMB.bossYakut });
  if (f > CLIMB.deep) out.push({ t: 'stone', g: 2, n: 1 }, { t: 'shard', k: ['kor', 'ayaz', 'simsek'][f % 3], n: 3 });
  if (f === CLIMB.floors) out.push({ t: 'ember', n: 1 }, { t: 'charm', n: 1 }, { t: 'yakut', n: 30 });
  const sum = []; // aynı tür tek satırda toplanır (ör. 55. kat: 2 Usta taş)
  for (const d of out) { const s = d.t !== 'gear' && sum.find(x => x.t === d.t && x.g === d.g && x.k === d.k); if (s) s.n += d.n; else sum.push({ ...d }); }
  return sum;
}

// ---------- 3c. Haftalık zindan düzeni ----------
// Her hafta (pazartesi 00:00) sıradaki düzen geçerli olur ve Dipsiz Kuyu, Yeraltı Ocağı, Gök Yarığı ile Mühürlü Oda'nın
// yaratıklarına uygulanır. mob: çarpanlar (hp/atk/def), eklemeler (spd, crit), direnç eklemesi (res) ve yeni zayıflık (weak).
// Zaferde verilen karşılık: xp / akce (yüzde) ve loot (ek ganimet).
export const MOD_MODES = ['well', 'depth', 'rift', 'seal'];
export const DUNGEON_MODS = [
  { id: 'demirderi', name: 'Demir Deri',     mob: { def: 1.3, hp: 1.1 },                                 akce: 40, xp: 0,  loot: null },
  { id: 'kizgin',    name: 'Kızgın Sürü',    mob: { atk: 1.2, hp: 0.85 },                                akce: 0,  xp: 30, loot: null },
  { id: 'tezayak',   name: 'Tez Ayak',       mob: { spd: 12, crit: 0.1 },                                akce: 0,  xp: 0,  loot: { t: 'dust', n: 25 } },
  { id: 'korkabuk',  name: 'Kor Kabuk',      mob: { res: { fire: 0.3 }, weak: 'ice' },                   akce: 0,  xp: 0,  loot: { t: 'shard', k: 'kor', n: 2 } },
  { id: 'ayazkabuk', name: 'Ayaz Kabuk',     mob: { res: { ice: 0.3 }, weak: 'fire' },                   akce: 0,  xp: 0,  loot: { t: 'shard', k: 'ayaz', n: 2 } },
  { id: 'kalkan',    name: 'Kalkan Duvarı',  mob: { res: { sword: 0.2, axe: 0.2, dagger: 0.2 } },        akce: 0,  xp: 0,  loot: { t: 'stone', g: 1, n: 1 } },
];
export const modOfWeek = w => DUNGEON_MODS[((w % DUNGEON_MODS.length) + DUNGEON_MODS.length) % DUNGEON_MODS.length];
export const modNow = now => modOfWeek(weekKey(now));
export const modById = id => DUNGEON_MODS.find(m => m.id === id) || null;
export function modUnit(u, M) {
  const m = M?.mob;
  if (!m) return u;
  const res = { ...u.res };
  for (const k in m.res || {}) res[k] = r2((res[k] || 0) + m.res[k]);
  const atk = m.atk || 1;
  return { ...u, maxHp: Math.round(u.maxHp * (m.hp || 1)), atk: Math.round(u.atk * atk), mag: Math.round(u.mag * atk), def: Math.round(u.def * (m.def || 1)),
    spd: u.spd + (m.spd || 0), crit: r2(u.crit + (m.crit || 0)), weak: m.weak || u.weak, res };
}
// Oyuncuya gösterilen satırlar aynı tablodan üretilir (metin ile kural ayrışamaz)
const RES_NAME = { sword: 'kılıca', axe: 'baltaya', dagger: 'hançere', bow: 'oka', mace: 'topuza', staff: 'asaya', fire: 'ateşe', ice: 'buza', bolt: 'yıldırıma' };
const WEAK_NAME = { fire: 'ateş', ice: 'buz', bolt: 'yıldırım' };
const pc = v => `%${Math.round(Math.abs(v - 1) * 100)} ${v >= 1 ? 'fazla' : 'az'}`;
const list = a => (a.length > 1 ? a.slice(0, -1).join(', ') + ' ve ' + a.at(-1) : a[0]);
export function modLines(M) {
  const m = M.mob, out = [];
  if (m.hp) out.push(`Yaratıkların canı ${pc(m.hp)}`);
  if (m.atk) out.push(`Yaratıkların saldırısı ${pc(m.atk)}`);
  if (m.def) out.push(`Yaratıkların savunması ${pc(m.def)}`);
  if (m.spd) out.push(`Yaratıkların hızı +${m.spd}`);
  if (m.crit) out.push(`Yaratıkların kritik şansı +%${Math.round(m.crit * 100)}`);
  const byVal = {};
  for (const k in m.res || {}) (byVal[m.res[k]] ||= []).push(RES_NAME[k]);
  for (const v in byVal) out.push(`Yaratıklar ${list(byVal[v])} %${Math.round(v * 100)} dirençli`);
  if (m.weak) out.push(`Zayıf noktaları ${WEAK_NAME[m.weak]} olur`);
  return out;
}
export function modBonusLines(M) {
  const out = [];
  if (M.akce) out.push(`Zaferde akçe %${M.akce} fazla`);
  if (M.xp) out.push(`Zaferde deneyim %${M.xp} fazla`);
  if (M.loot) out.push('Zaferde ek ganimet');
  return out;
}

// ---------- 4. Nöbet: Çırak'ın uzun oto-farm görevi ----------
// Parti, son boss'u geçilmiş bir bölgeye (o kademede) nöbete dikilir. Her tickMs'de bölgenin son yaratık stage'i (ref)
// bir kez "oynanmış" sayılır: deneyimin xp, akçenin akce oranı yazılır; her yaratık drop oranında gerçek drop tablosundan
// zar atar. Süre tavanı Çırak'la aynıdır (premium kademesinin idleHours'u). Nöbet sürerken Çırak'ın olağan birikimi durur.
export const FARM = { tickMs: 10 * 60 * 1000, ref: 24, boss: 25,
  focus: {
    xp:   { name: 'Talim',   note: 'Deneyim ağırlıklı', xp: 0.35, akce: 0.10, drop: 0.10 },
    loot: { name: 'Ganimet', note: 'Eşya ağırlıklı',    xp: 0.10, akce: 0.25, drop: 0.35 },
  } };
export const farmFocus = f => (typeof f === 'string' && Object.hasOwn(FARM.focus, f) ? FARM.focus[f] : null);
export const farmActive = p => !!(p.farm && p.farm.z);

// ---------- Her işlemden önce (state.js: tick) ----------
// Meydan kaydını bugüne getirir (kapanan sezonlar ödenmek üzere A.due'ya yazılır; ödemeyi pvpops.js yapar), süresi
// dolan sezon unvanını kaldırır, Yeraltı Ocağı'nı dönem değişince sıfırlar. Saf ve yinelenebilir.
export function pvpTick(p, now) {
  const A = p.arena;
  if (A) {
    const closed = rollArena(A, now);
    if (closed.length) { A.due = [...(A.due || []), ...closed].slice(-6); }
    const t = p.ach?.title;
    if (seasonTitle(t) && !markTitles(A.mark, now).includes(t)) p.ach.title = null;
  }
  const c = climbCycle(now);
  if (p.depthC == null) p.depthC = c; // bu sürümden önceki kayıt: bulunduğu dönemi katıyla sürdürür
  else if (p.depthC !== c) { p.depthBest = Math.max(p.depthBest || 0, p.depth || 0); p.depthPrev = p.depth || 0; p.depth = 0; p.depthC = c; }
}
