// Ortak savaş (19 Kas): aynı partideki oyuncular AYNI savaşta, yan yana, eş zamanlı oynar (Kristal Nöbeti partileri).
// Sunucu otoriterdir: savaş belgesi kurulumu (setup) ve sıralı hamle listesini (acts) tutar; motor deterministik olduğu için
// her istemci aynı kurulumu ve hamleleri oynatarak aynı savaşı görür (battle.js). Her birimin sahibi `ctl` (oyuncu kimliği):
//  - sıra kendi biriminde olan oyuncu hamlesini gönderir (coop.act); sunucu hamleyi kendi tekrarında doğrular
//  - TURN_MS içinde hamle gelmezse ilk yoklamada sunucu yapay zekâ seçimini yazar (kopan / bekleyen oyuncu oyunu kilitlemez)
//  - odaya katılmamış parti üyeleri (ve yapay katılımcılar) yapay zekâyla oynayan müttefik olarak savaşa girer (ai: true)
// Oda yaşamı: lobi (LOBBY_MS ya da partinin bütün gerçek oyuncuları gelince başlar) → savaş → bitti. Sonucu her oyuncu kendi
// kaydına coop.done ile alır; dalga ve kayıp partinin hanesine bir kez yazılır (nobet.js credit).
// Belge: coop/<id> = { id, key, party, br, status, created, startAt, humans:{pid:{nm,u,seen}}, setup, acts:[{c,by}], turnAt, over, done:{pid:1}, credited }
//        coopidx/<nöbet>:<parti> = { room }  (partinin açık odası)
import { Battle, ENGINE_V } from './battle.js';
import { fail } from './util.js';
import { stageDef, mobUnit, MOBS } from './zones.js';
import { botParty } from './bots.js';
import { CLASS_KEYS } from './content.js';
import { heroUnit } from './hero.js';
import { mainId } from './roster.js';
import { NOBET, stateOf, partyOf, getNobet, credit, minuteOf } from './nobet.js';

export const COOP = { lobbyMs: 8000, turnMs: 25000, turnCap: 420, waves: 3 };
const scaleHp = (u, k) => ({ ...u, maxHp: Math.round(u.maxHp * k), atk: Math.round(u.atk * (0.7 + 0.3 * k)), mag: Math.round((u.mag || 0) * (0.7 + 0.3 * k)) });
const buff = (u, n) => (n > 0 ? { ...u, atk: Math.round(u.atk * (1 + NOBET.buff * n)), mag: Math.round((u.mag || 0) * (1 + NOBET.buff * n)), def: Math.round(u.def * (1 + NOBET.buff * n)) } : u);

// Parti birimleri: odadaki gerçek oyuncular kendi birimini oynar; öbür üyeler (yokken) yapay zekâyla
function partyUnits(room, g, docReg, buffs) {
  return g.members.slice(0, NOBET.partyMax).map(x => {
    const H = room.humans[x.id];
    if (H) return buff({ ...H.u, name: H.nm, ctl: x.id }, buffs);
    const R = docReg[x.id];
    if (R?.u) return buff({ ...R.u, name: R.nm, ai: true }, buffs);
    const ci = Math.max(0, CLASS_KEYS.indexOf(x.cls)), seed = (parseInt(String(x.id).split(':')[1], 10) || 7) * 4 + ci; // yapay katılımcı: sınıfına uygun tohum
    const u = botParty(seed >>> 0, x.lvl || 50, 0.8, x.f || g.f).units[0];
    return buff({ ...u, name: x.nm, ai: true }, buffs);
  });
}
// Dalgalar: nöbet bölgesinin stage'lerinden, parti büyüklüğüne göre güçlenmiş; muhafız ve Lav Yürek nöbetin dakikasına göre
function wavesFor(room, n, S, lvl) {
  const z = room.br === 'high' ? 4 : 3, k = Math.max(1, n / 2.2), i = room.seq || 1;
  const pick = j => { let s = (z === 3 ? 10 : 1) + ((i * 3 + j) % (z === 3 ? 15 : 24)); if (s % 5 === 0) s++; return stageDef(`${z}-${s}`).waves; };
  if (S.bossReady) { const W = pick(0)[0]; return { waves: [[scaleHp(W[0], k), scaleHp(mobUnit(NOBET.boss, lvl), k * 0.9), scaleHp(W[1] || W[0], k)]], boss: 1, guard: 0 }; }
  const W = pick(0).slice(0, COOP.waves).map(w => w.map(u => scaleHp(u, k)));
  const guard = NOBET.buffAt.some((at, j) => S.m >= at && S.buffs <= j);
  if (guard) W[W.length - 1] = [...W[W.length - 1].slice(0, 2), scaleHp(mobUnit(NOBET.guard, lvl), k)];
  return { waves: W, boss: 0, guard: guard ? 1 : 0 };
}
// Odanın savaşını kurulumdan ve hamlelerden yeniden kurar (sunucu doğrulaması ve zaman aşımı için)
export function replayRoom(room) {
  const b = new Battle(room.setup);
  let r = b.advance();
  for (const a of room.acts) { if (r.over) break; r = b.advance(a.c); }
  return { b, r };
}

export function coopWorld({ put }) {
  const load = async (ctx, id) => { const r = await ctx.store.get('coop', String(id)); if (!r) fail('no-room', 'Savaş odası bulunamadı.'); return r; };
  const ctxOf = async (ctx, p) => {
    if (!p.nobet || p.nobet.left) fail('not-joined', `${NOBET.name}'ne kayıtlı değilsin.`);
    const N = await getNobet(ctx, { key: p.nobet.key, br: p.nobet.br, start: p.nobet.start }), S = stateOf(N.doc, ctx.now, ctx.bots), g = partyOf(S, ctx.pid);
    return { N, S, g };
  };
  // Lobi süresi dolduysa ya da partinin bütün gerçek oyuncuları geldiyse savaşı kurar
  async function maybeStart(ctx, R) {
    const room = R.doc;
    if (room.status !== 'lobby') return false;
    const N = await getNobet(ctx, { key: room.key, br: room.br, start: room.start }), S = stateOf(N.doc, ctx.now, ctx.bots), g = S.P.find(x => x.id === room.party);
    if (!g) return false;
    const humans = g.members.filter(x => !x.bot).map(x => x.id), all = humans.every(id => room.humans[id]);
    if (ctx.now < room.startAt && !all) return false;
    const party = partyUnits(room, g, N.doc.reg, S.buffs), lvl = Math.round(party.reduce((a, u) => a + (u.lvl || 50), 0) / party.length);
    const W = wavesFor(room, party.length, S, lvl);
    room.setup = { party, waves: W.waves, seed: (Math.floor(ctx.rand() * 4294967296) >>> 0), enrageTurn: 0, turnCap: COOP.turnCap, restoreOnWave: false, lead: true, v: ENGINE_V };
    room.flags = { boss: W.boss, guard: W.guard };
    room.status = 'run'; room.turnAt = ctx.now + COOP.turnMs;
    return true;
  }
  // Sırası gelen oyuncu süreyi aştıysa yapay zekâ seçimini yazar (birden çok zaman aşımı peş peşe işlenir)
  function timeouts(ctx, room) {
    if (room.status !== 'run') return false;
    let changed = false;
    for (let guard = 0; guard < 20; guard++) {
      const { b, r } = replayRoom(room);
      if (r.over) { room.status = 'over'; room.over = { winner: r.over, sum: b.summary() }; return true; }
      if (ctx.now < room.turnAt) return changed;
      room.acts.push({ c: b.autoChoice(), by: 'auto' }); room.turnAt += COOP.turnMs; changed = true;
    }
    return changed;
  }
  const viewOf = (room, pid, from = 0) => {
    const out = { id: room.id, status: room.status, startAt: room.startAt, me: String(pid), humans: Object.entries(room.humans).map(([id, h]) => ({ id, name: h.nm, cls: h.u?.cls })), n: room.acts.length, turnAt: room.turnAt };
    if (room.status !== 'lobby') { out.acts = room.acts.slice(from).map(a => a.c); out.from = from; if (from === 0) out.setup = room.setup; out.title = `${NOBET.name} · ${room.flags?.boss ? MOBS[NOBET.boss].name : 'Parti savaşı'}`; }
    if (room.over) out.over = { winner: room.over.winner };
    return out;
  };
  const HANDLERS = {
    // Partinin açık odasına katıl (yoksa aç). Savaş sürerken üyeysen odaya geri döner.
    async 'coop.join'(ctx, p) {
      const { N, S, g } = await ctxOf(ctx, p);
      if (!g) fail('no-party', 'Partin bulunamadı.');
      if (g.failed) fail('party-failed', 'Partin düştü.');
      if (S.over) fail('closed', 'Nöbet bitti.');
      if (ctx.now < N.doc.start) fail('wait', 'Nöbet henüz başlamadı.');
      const ik = `${p.nobet.key}:${g.id}`, I = await ctx.store.get('coopidx', ik), k = String(ctx.pid);
      let R = I ? await ctx.store.get('coop', I.doc.room) : null;
      if (R && R.doc.status === 'run' && R.doc.humans[k]) return viewOf(R.doc, k);
      if (!R || R.doc.status !== 'lobby') {
        const id = `${ik}:${(I?.doc.seq || 0) + 1}`;
        R = { doc: { id, key: p.nobet.key, br: p.nobet.br, start: p.nobet.start, party: g.id, seq: (I?.doc.seq || 0) + 1, status: 'lobby', created: ctx.now, startAt: ctx.now + COOP.lobbyMs, humans: {}, setup: null, acts: [], turnAt: 0, over: null, done: {} }, ver: null };
        put(ctx, 'coopidx', ik, { room: id, seq: R.doc.seq }, I?.ver ?? null);
      }
      R.doc.humans[k] = { nm: p.name, u: heroUnit(p, mainId(p)), seen: ctx.now };
      await maybeStart(ctx, R);
      put(ctx, 'coop', R.doc.id, R.doc, R.ver);
      return viewOf(R.doc, k);
    },
    // Yoklama: lobi başlatma, zaman aşımı, yeni hamleler (from: istemcinin bildiği hamle sayısı)
    async 'coop.view'(ctx, p, { id, from } = {}) {
      const R = await load(ctx, id), room = R.doc, k = String(ctx.pid);
      let changed = await maybeStart(ctx, R);
      changed = timeouts(ctx, room) || changed;
      if (room.humans[k]) room.humans[k].seen = ctx.now;
      if (changed) put(ctx, 'coop', room.id, room, R.ver);
      return viewOf(room, k, Math.max(0, Math.min(room.acts.length, Number.isInteger(from) ? from : 0)));
    },
    // Hamle: sıra gönderenin biriminde olmalı ve hamle motorda geçerli olmalı (i: hamlenin sırası, çift gönderime karşı)
    async 'coop.act'(ctx, p, { id, i, c } = {}) {
      const R = await load(ctx, id), room = R.doc, k = String(ctx.pid);
      if (room.status !== 'run') fail('not-running', 'Savaş sürmüyor.');
      if (i !== room.acts.length) fail('stale', 'Sıra başka bir hamleye geçti.');
      const { b, r } = replayRoom(room);
      if (r.over) fail('over', 'Savaş bitti.');
      if (String(b.pending?.ctl) !== k) fail('not-your-turn', 'Sıra sende değil.');
      try { const r2 = b.advance(c); room.acts.push({ c, by: k }); if (r2.over) { room.status = 'over'; room.over = { winner: r2.over, sum: b.summary() }; } }
      catch { fail('bad-action', 'Geçersiz hamle.'); }
      room.turnAt = ctx.now + COOP.turnMs;
      put(ctx, 'coop', room.id, room, R.ver);
      return { n: room.acts.length };
    },
    // Sonuç: dalga ve kayıp partiye (bir kez), hasar ve akçe katılan oyunculara; her oyuncu kendi payını bir kez alır
    async 'coop.done'(ctx, p, { id } = {}) {
      const R = await load(ctx, id), room = R.doc, k = String(ctx.pid);
      if (room.status === 'run') timeouts(ctx, room);
      if (room.status !== 'over') fail('not-over', 'Savaş bitmedi.');
      if (!room.humans[k]) fail('not-member', 'Bu savaşta değildin.');
      if (room.done[k]) fail('done', 'Sonucu aldın.');
      const won = room.over.winner === 'A', sum = room.over.sum, waves = room.setup.waves, n = won ? waves.length : sum.wave;
      let d = waves.slice(0, n).flat().reduce((a, u) => a + (u.maxHp || 0), 0);
      const boss = waves.flat().find(u => u.boss);
      if (!won && boss) d += Math.round((sum.bossDamage || 0) * boss.maxHp);
      const res = { w: boss ? (won ? 1 : 0) : n, d, lost: won ? 0 : 1, guard: won && room.flags?.guard ? 1 : 0, boss: won && boss ? 1 : 0 };
      const N = await getNobet(ctx, { key: room.key, br: room.br, start: room.start }), doc = N.doc, humans = Object.keys(room.humans);
      if (!room.credited) { credit(doc, ctx, room.party, humans, res); room.credited = 1; }
      room.done[k] = 1;
      const S = stateOf(doc, ctx.now, ctx.bots), g = partyOf(S, ctx.pid);
      if ((S.won || S.lost) && !doc.end) doc.end = ctx.now;
      put(ctx, 'nobet', room.key, doc, N.ver);
      put(ctx, 'coop', room.id, room, R.ver);
      const akce = Math.round(d / 40 / humans.length); p.akce += akce;
      if (won) { p.stats.wins++; }
      if (p.nobet) { p.nobet.buffs = S.buffs; p.nobet.over = S.over || g?.failed ? 1 : 0; p.nobet.boss = S.bossReady ? 1 : 0; }
      return { mode: 'nobet', coop: 1, win: won, akce, xp: 0, stars: 0, loot: [], title: `${NOBET.name} · parti savaşı`, players: humans.length,
        nobet: { ...res, total: S.waves, buffs: S.buffs, won: S.won, lost: S.lost, party: g ? { name: g.name, pct: g.pct, failed: g.failed, lost: g.lost, quota: Math.round(g.quota * 10) / 10, done: Math.round(g.done * 10) / 10 } : null } };
    },
    async 'coop.leave'(ctx, p, { id } = {}) { const R = await load(ctx, id), room = R.doc, k = String(ctx.pid); if (room.status === 'lobby' && room.humans[k]) { delete room.humans[k]; put(ctx, 'coop', room.id, room, R.ver); } return { ok: 1 }; },
  };
  return { HANDLERS, READ_ONLY: ['coop.view', 'coop.act', 'coop.join', 'coop.leave'] };
}
export { minuteOf };
