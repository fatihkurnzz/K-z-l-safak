// "pvp" paketinin kuralları (istemciye sunulmaz): eşya seviyesine göre eşleştirme, meydan sezonu (sıralama dökümü, ödül
// postası, unvan), Yeraltı Ocağı'nda seri iniş, Nöbet (uzun oto-farm) ve çanta sınırı. Tablolar pvp.js'tedir.
//   PVP_HANDLERS  oyuncuya özel işlemler (game.js HANDLERS'a eklenir)
//   pvpWorld(H)   paylaşılan belgelere dokunan işlemler ve dispatch kancası (world.js kurar; H: put, del, mail)
import { LEAGUES, UNLOCK } from './content.js';
import { ZONES } from './zones.js';
import { rollKill, expectedDrops } from './drops.js';
import { addXp, needBagRoom } from './modes.js';
import { idleStock } from './calc.js';
import { farmZoneOpen, farmRef, farmRate, farmStock, farmCapHours } from './pvpcalc.js';
import { itemLevel, soloUnits, power } from './hero.js';
import { botParty, isBot } from './bots.js';
import { GUARD, vsUsed } from './guard.js';
import { fail, int, grant, bump, busy, count } from './util.js';
import { dayKey } from './content.js';
import { rng } from './rng.js';
import {
  MATCH, ilBand, inBand, SEASON, seasonOf, seasonNo, seasonEndAt, seasonStart, leagueIndex, docRating, docSeasonFinal, seasonGive, seasonTitle, markTitles,
  LEAGUE_REWARD, rankReward, FARM, farmFocus, farmActive, validTier,
  ARENA_PTS, RACE_DAY, RACES, foeOf, sameRace, raceWinner, raceMult, raceGive, raceRoll,
} from './pvp.js';

// ---------- Yapay rakip: eşya seviyesi aralığına düşen parti ----------
// Yapay oyuncunun eşya seviyesi seviyesinden (kademe) ve kalitesinden (doluluk, nadirlik, artı) türer. Önce oyuncunun
// kendi seviyesi çevresinde, sonra uzaklaşarak aranır; aralığa düşen bulunamazsa en yakını döner.
const Q_GRID = [0.5, 0.3, 0.7, 0.15, 0.85, 0.05, 1, 0.42, 0.6];
const L_GRID = [0, -1, 1, -2, 2, -4, 4, -7, 7, -11, 11, -16, 16, -24, 24, -34, 34, -50, 50, -65, 65, -79, 79]; // bütün seviyeler: kuşanmamış yüksek seviyeli hesaba da yakın rakip çıksın
// foe: yalnızca bu ırktan yapay rakip (Meydan'da aynı ırk dövüşmez); ırk tohumdan türer, botFromId aynısını kurar
export function botInBand(rand, lvl, il, band, foe = null) {
  let best = null;
  const qs = [...Q_GRID].sort(() => rand() - 0.5);
  for (const dl of L_GRID) {
    const L = lvl + dl;
    if (L < 1 || L > 80) continue;
    for (const q of qs) {
      const b = botParty(Math.floor(rand() * 4294967296), L, q), d = Math.abs(b.il - il);
      if (foe && b.faction !== foe) continue;
      if (inBand(b.il, band)) return b;
      if (!best || d < best.d) best = { b, d };
    }
  }
  if (best) return best.b;
  for (let i = 0; i < 64; i++) { const b = botParty(Math.floor(rand() * 4294967296), lvl, 0.5); if (!foe || b.faction === foe) return b; }
  return botParty(Math.floor(rand() * 4294967296), lvl, 0.5);
}

export function pvpWorld({ put, del, mail, dressBot }) {
  const memo = (ctx, key, fn) => ((ctx.memo ??= {})[key] ??= fn());
  const pending = (ctx, coll, id) => ctx.ops.findLast(x => x.t === 'put' && x.coll === coll && x.id === id);

  // ---- Eşleştirme ----
  // 'ail' koleksiyonu meydan kayıtlarının eşya seviyesi dizinidir (n1: eşya seviyesi, n2: puan); depo yalnızca n1 üzerinde
  // aralık sorgular. Aralığın içinde rastgele bir noktadan iki yöne bakılır ki hep aynı komşular gelmesin.
  async function candidates(ctx, p, band) {
    const pivot = band.lo + Math.floor(ctx.rand() * (band.hi - band.lo + 1)), me = String(ctx.pid);
    const rows = [...await ctx.store.query('ail', { n1min: pivot, n1max: band.hi, order: 'n1', limit: 30 }),
      ...(pivot > band.lo ? await ctx.store.query('ail', { n1min: band.lo, n1max: pivot - 1, order: '-n1', limit: 30 }) : [])];
    return rows.filter(r => r.id !== me && !sameRace(r.doc.f, p.faction) && vsUsed(p, r.id) < GUARD.arenaSameOpp); // f: dizindeki ırk (eski satırda yok; kaydın kendisinden bakılır)
  }
  // n rakip: eşya seviyesi ±%20 içindeki gerçek kayıtlar; yetmezse aralık basamak basamak genişler (MATCH.steps);
  // yine yetmezse ±%20 aralığında üretilen yapay rakiple tamamlanır (meydan boş kalmaz).
  async function findOpponents(ctx, p, rating, n) {
    const il = itemLevel(p, 'arena'), out = [], taken = new Set(); // saldıran taraf: Meydan saldırı düzeni (roster.js)
    let step = 0;
    for (const pct of MATCH.steps) {
      const band = ilBand(il, pct), cand = (await candidates(ctx, p, band)).filter(r => !taken.has(r.id));
      // puanı en yakın adaylar arasından rastgele
      const near = cand.sort((a, b) => Math.abs((a.doc.r ?? 1000) - rating) - Math.abs((b.doc.r ?? 1000) - rating)).slice(0, MATCH.pool);
      while (out.length < n && near.length) {
        const r = near.splice(Math.floor(ctx.rand() * near.length), 1)[0], A = await ctx.store.get('arena', r.id);
        taken.add(r.id);
        if (!A) { del(ctx, 'ail', r.id, r.ver); continue; } // savunma kaydı silinmiş (yasak): dizin satırı da kalkar
        if (!inBand(A.doc.il ?? 0, band)) continue;          // dizin eskimiş: kaydın kendi eşya seviyesi geçerlidir
        if (sameRace(A.doc.faction, p.faction)) continue;  // aynı ırk Meydan'da dövüşmez
        out.push({ id: A.id, ...A.doc, rating: docRating(A.doc, ctx.now), band: step });
      }
      if (out.length >= n) break;
      step++;
    }
    const band = ilBand(il);
    while (out.length < n) {
      const b = botInBand(ctx.rand, p.lvl, il, band, foeOf(p.faction));
      const u1 = soloUnits(dressBot(ctx, b));
      out.push({ ...b, units: u1, power: power(u1[0]), rating: Math.max(0, Math.round(rating + (ctx.rand() - 0.5) * 160)) });
    }
    return out;
  }

  // Oyuncunun meydan kaydına ve eşya seviyesi dizinine yazılacak sezon alanları
  const seasonFields = A => ({ sn: A.sn, wk: A.wk, g: (A.sw || 0) + (A.sl || 0) });
  const publishIndex = (ctx, p, il) => put(ctx, 'ail', String(ctx.pid), { r: p.arena.rating, f: p.faction }, undefined, { n1: il, n2: p.arena.rating });

  // ---- Günlük ırk yarışı (pvp.js: RACE_DAY) ----
  // 'aday' koleksiyonu: gün başına RACE_DAY.shards parça belge { ocak, sancak } (k1: gün); yazan, kendi parçasını sürümlü
  // günceller (çakışırsa dispatch baştan dener). Yapay oyuncular (ctx.bots) güne tohumdan türeyen bir taban puan ekler.
  const shardOf = pid => { let h = 0; for (const c of String(pid)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h % RACE_DAY.shards; };
  const botBase = (d, frac) => { const r = rng(d * 7919 + 13), o = {}; for (const f of RACES) o[f] = Math.round((5 + Math.floor(r() * 25)) * frac) * 3; return o; };
  async function raceTotals(ctx, d) {
    const t = { ocak: 0, sancak: 0 }, rows = await ctx.store.query('aday', { k1: String(d), limit: 50 });
    for (const r of rows) for (const f of RACES) t[f] += r.doc[f] || 0;
    const mine = pending(ctx, 'aday', `${d}:${shardOf(ctx.pid)}`), old = rows.find(r => r.id === `${d}:${shardOf(ctx.pid)}`);
    if (mine) for (const f of RACES) t[f] += (mine.doc[f] || 0) - (old?.doc[f] || 0);
    if (ctx.bots) { const dn = dayKey(ctx.now), frac = d < dn ? 1 : Math.min(1, ((ctx.now + 3 * 3600000) % 86400000) / 86400000), b = botBase(d, frac); for (const f of RACES) t[f] += b[f]; }
    return t;
  }
  async function raceAdd(ctx, add) {
    const d = dayKey(ctx.now), id = `${d}:${shardOf(ctx.pid)}`, cur = await ctx.store.get('aday', id), doc = { ocak: 0, sancak: 0, ...(cur?.doc || {}) };
    let any = false;
    for (const f of RACES) if (add[f] > 0) { doc[f] += add[f]; any = true; }
    if (any) put(ctx, 'aday', id, doc, cur ? cur.ver : null, { k1: String(d), n1: d });
  }
  async function raceView(ctx, p) {
    const d = dayKey(ctx.now), t = await raceTotals(ctx, d), y = await raceTotals(ctx, d - 1);
    return { d, t, y, yw: raceWinner(y), mine: p.faction, top: RACE_DAY.top, low: RACE_DAY.low, n: p.arena.day?.d === d ? p.arena.day.n : 0 };
  }
  // Ertesi gün ilk istekte: dünkü (ve kaçırılan) günlerin katılım ödülü; oyuncu kaydıyla aynı atomik işlemde, bir kez
  async function payRace(ctx, p) {
    const A = p.arena;
    raceRoll(p, ctx.now);
    if (!A.raceDue?.length) return;
    for (const x of A.raceDue) {
      const t = await raceTotals(ctx, x.d), w = raceWinner(t), m = raceMult(t, x.f);
      mail(ctx, ctx.pid, w ? `Meydan günü bitti: Günün Üstün Irkı ${w === x.f ? 'senin ırkın' : 'karşı ırk'} (${t[x.f] || 0} – ${t[foeOf(x.f)] || 0}). Katılım ödülün ×${m}.` : `Meydan günü berabere bitti (${t.ocak} – ${t.sancak}). Katılım ödülün ×${m}.`, raceGive(m), { race: x.d });
    }
    A.raceDue = [];
  }
  // Savunma puanı: seni saldırıp yenilenler (savunma kayıtları, reportops.js) — son işlenenden sonrakiler +def
  async function claimDef(ctx, p) {
    const A = p.arena;
    if (!Number.isFinite(A.defAt)) { A.defAt = ctx.now; return 0; } // bu sürümden önceki kayıt: geçmiş savunmalar sayılmaz
    const rows = await ctx.store.query('brep', { k1: 'd:' + String(ctx.pid), n1min: A.defAt + 1, order: '-n1', limit: 40 });
    let n = 0, at = A.defAt;
    for (const r of rows) { if (r.doc.win || (r.doc.mode !== 'arena' && r.doc.mode !== 'live')) { at = Math.max(at, r.doc.at || 0); continue; } n++; at = Math.max(at, r.doc.at || 0); }
    A.defAt = at;
    if (n) { A.rating += n * ARENA_PTS.def; A.peak = Math.max(A.peak || 0, A.rating); A.dw = (A.dw || 0) + n; }
    return n * ARENA_PTS.def;
  }

  // ---- Sezon kapanışı: bir önceki sezonun sıralama dökümü ----
  // Zamanlayıcı yoktur: yeni sezonda meydan kaydına dokunan ilk işlem dökümü alır. O ana dek hiçbir kayıt yeni sezonun
  // puanıyla yazılmamıştır (her yazan önce bu işlevden geçer), yani döküm önceki sezonun bitiş puanlarını görür.
  // 'meta/pvp' belgesi sürümlüdür: iki istek aynı anda kapatırsa biri baştan dener ve dökümü hazır bulur.
  const closeSeason = ctx => memo(ctx, 'pvpClose', async () => {
    const cur = seasonOf(ctx.now), M = await ctx.store.get('meta', 'pvp');
    if (M && M.doc.sn >= cur) return;
    const prev = cur - 1, rows = await ctx.store.query('arena', { order: '-n1', limit: 200 });
    const top = rows.map(r => ({ id: r.id, name: r.doc.name, faction: r.doc.faction, rating: docSeasonFinal(r.doc, prev), g: r.doc.g || 0 }))
      .filter(x => x.rating !== null && x.g >= SEASON.minGames).sort((a, b) => b.rating - a.rating || (a.id < b.id ? -1 : 1)).slice(0, SEASON.topN)
      .map(({ g, ...x }) => x);
    // ilk kurulumda (belge yokken) kapanacak sezon yoktur; döküm yalnızca bir kez yazılır
    if (M && !(await ctx.store.get('pvps', String(prev)))) put(ctx, 'pvps', String(prev), { sn: prev, at: ctx.now, top }, null, { n1: prev });
    put(ctx, 'meta', 'pvp', { sn: cur, at: ctx.now }, M ? M.ver : null);
  });
  const snapshot = async (ctx, sn) => pending(ctx, 'pvps', String(sn))?.doc || (await ctx.store.get('pvps', String(sn)))?.doc || null;

  // ---- Sezon ödülü: kapanan her sezon için bir posta (bir kez; oyuncu kaydıyla aynı atomik işlemde) ----
  async function payDue(ctx, p) {
    const A = p.arena, cur = seasonOf(ctx.now), me = String(ctx.pid);
    for (const d of A.due) {
      const games = d.w + d.l;
      if (!games) continue; // hiç dövüşmediği sezon: kayıt tutulmaz
      const lg = leagueIndex(d.rating), ok = games >= SEASON.minGames, snap = ok ? await snapshot(ctx, d.sn) : null;
      const i = snap ? snap.top.findIndex(x => x.id === me) : -1, rank = i >= 0 ? i + 1 : 0;
      if (ok) {
        mail(ctx, ctx.pid, `Sezon ${seasonNo(d.sn)} bitti: ${LEAGUES[lg].name} ligi${rank ? `, ${rank}. sıra` : ''}. Sezon ödülün.`, seasonGive(lg, rank), { season: d.sn });
        if (d.sn === cur - 1 && (LEAGUE_REWARD[lg].title || rankReward(rank)?.title)) A.mark = { sn: cur, l: lg, r: rank };
        count(p, 'season'); // başarım: ödülle kapatılan sezon
      }
      A.hist = [{ sn: d.sn, r: d.rating, lg, rank, w: d.w, l: d.l, paid: ok }, ...(A.hist || [])].slice(0, SEASON.histMax);
    }
    A.due = [];
  }

  // dispatch her başarılı yazma işleminden sonra çağırır
  async function after(ctx, p, action, result) {
    const A = p.arena, t = action.type, fought = t === 'battle.finish' && (result.mode === 'arena' || result.mode === 'live');
    if (A.due?.length || t === 'arena.list' || fought) await closeSeason(ctx);
    if (A.due?.length) await payDue(ctx, p);
    if (A.day || A.raceDue?.length) await payRace(ctx, p); // günlük ırk yarışı ödülü (gün döndüyse)
    // Meydan savaşı: kazanılan puan saldıranın ırkına; saldırı püskürtüldüyse savunanın ırkına +def (yapay savunan yalnızca ctx.bots iken)
    if (fought) {
      const add = {}, vs = result.vs, defReal = vs != null && !isBot(vs) && String(vs) !== String(ctx.pid);
      if (result.win && result.rating > 0) add[p.faction] = result.rating;
      if (!result.win && result.defFac && (defReal || (ctx.bots && isBot(vs)))) add[result.defFac] = (add[result.defFac] || 0) + ARENA_PTS.def;
      await raceAdd(ctx, add);
    }
    // Meydan savaşından sonra yayınlanmış kaydın puanı tazelenir (sıralama ve sezon dökümü güncel kalsın)
    if (fought && result.mode === 'arena' && !pending(ctx, 'arena', String(ctx.pid))) {
      const D = await ctx.store.get('arena', String(ctx.pid));
      if (D) { put(ctx, 'arena', D.id, { ...D.doc, rating: A.rating, ...seasonFields(A) }, undefined, { k1: D.doc.faction, n1: A.rating, n2: D.doc.il ?? 0 }); publishIndex(ctx, p, D.doc.il ?? 0); }
    }
  }

  const HANDLERS = {
    // Sezon paneli (salt-okur): geçen sezonun ilk onu, bu sezonun ilk onu ve oyuncunun şimdiki sırası (ilk 200 içindeyse)
    async 'season.view'(ctx, p) {
      const cur = seasonOf(ctx.now), me = String(ctx.pid), last = (await ctx.store.get('pvps', String(cur - 1)))?.doc || null;
      const rows = (await ctx.store.query('arena', { order: '-n1', limit: 200 }))
        .map(r => ({ id: r.id, name: r.doc.name, faction: r.doc.faction, rating: r.id === me ? p.arena.rating : docRating(r.doc, ctx.now), g: r.id === me ? (p.arena.sw || 0) + (p.arena.sl || 0) : r.doc.sn === cur ? r.doc.g || 0 : 0 }))
        .filter(x => x.g >= SEASON.minGames).sort((a, b) => b.rating - a.rating || (a.id < b.id ? -1 : 1));
      const i = rows.findIndex(x => x.id === me);
      return { sn: cur, no: seasonNo(cur), start: seasonStart(cur), end: seasonEndAt(ctx.now), rank: i >= 0 ? i + 1 : 0,
        top: rows.slice(0, 10).map(x => ({ name: x.name, faction: x.faction, rating: x.rating, me: x.id === me })),
        last: last ? { no: seasonNo(last.sn), top: last.top.slice(0, 10).map(x => ({ name: x.name, faction: x.faction, rating: x.rating, me: x.id === me })) } : null };
    },
  };
  return { HANDLERS, READ_ONLY: ['season.view'], findOpponents, seasonFields, publishIndex, after, raceView, claimDef };
}

// ---------- Oyuncuya özel işlemler ----------
export const PVP_HANDLERS = {
  // Sezon unvanı: geçen sezonun ligi (ve birinciliği) bu sezon boyunca seçilebilir; id: null kaldırır
  'season.title'(p, { id = null }, env) {
    const A = p.ach || (p.ach = { c: {}, t: {}, title: null });
    if (id === null) { if (seasonTitle(A.title)) A.title = null; return { title: A.title }; }
    if (typeof id !== 'string' || !markTitles(p.arena.mark, env.now).includes(id)) fail('title-locked', 'Bu unvan bu sezon sende değil.');
    A.title = id;
    return { title: id };
  },

  // ---- Nöbet: oyundan kaldırıldı; eski istemciden gelen istekler reddedilir ----
  'farm.plan'() { fail('removed', 'Nöbet oyundan kaldırıldı.'); },
  'farm.start'() { fail('removed', 'Nöbet oyundan kaldırıldı.'); },
  'farm.collect'() { fail('removed', 'Nöbet oyundan kaldırıldı.'); },
};
// Nöbetin ön koşulları: Çırak açık olmalı, bölge o kademede bitirilmiş olmalı (z ve tier tam sayı ve tabloda olmalı)
function farmGate(p, z, tier) {
  if (p.lvl < UNLOCK.idle) fail('locked', `${UNLOCK.idle}. seviyede açılır.`);
  if (!int(z, 1, ZONES.length) || !validTier(tier)) fail('bad-zone', 'Böyle bir bölge yok.');
  if (!farmZoneOpen(p, z, tier)) fail('zone-locked', 'Nöbet için bölgenin son boss’u bu kademede geçilmiş olmalı.');
}

// Oyuncu kaydını yazmayan işlemler (dispatch: READ_ONLY)
export const PVP_READ_ONLY = ['farm.plan'];
