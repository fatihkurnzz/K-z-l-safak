// Hisar Kuşatması (haftalık), hisar vergisinin üçe bölünmesi, Irklar Arası Vergi Havuzu, klan ittifakı ve ittifak yardımı.
// Saf hesaplar hisar.js'te, sabitler content.js HISAR. world.js işlemleri WORLD'e ekler ve dispatch'e hisarAfter'ı bağlar;
// realmops.js pazar vergisini hazineye toplarken hisarTake'i, clanrules.js klan ekranında hisarCollect'i çağırır.
// Paylaşılan belgeler:
//   hisar/<ırk>   { f, week: sonucu kesinleşmiş son hafta, owner: { id, name, banner, since } | null, last: { week, top } | null,
//                   due: { klan → akçe } (klan hazinesine yolda), pool: havuzdaki akçe, inc: { week, own, ally, pool }, prev }
//   hisar/pool    { paid: dağıtılmış son hafta, last: { week, f, n, each, count } | null }
//   warp/<hafta>:<oyuncu>  Büyük Sefer'e o hafta katılanlar { f, name } (k1 '<hafta>:<ırk>') — havuz bunlara eşit bölünür
//   ally/<kimlik> { f, clans: [klan], at }
// Klan belgesinde: ally (ittifak kimliği), allyInv: [{ cid, name, at }], hisar: { week, score }, üyede hs/hw (hisar puanı),
//   hq.up.help: { ask, who, at, cut, by: [oyuncu] } (Karargâh yükseltmesine yardım)
import { HISAR, FACTIONS, weekKey } from './content.js';
import { hisarWin, hisarOpen, nextHisar, hisarDue, splitTax, helpCut, helpMax, poolShare } from './hisar.js';
import { normClan } from './clanrules.js';
import { can, rankOf, validBanner, defaultBanner, hqNorm, HQ_FAC } from './clan.js';
import { fail, int } from './util.js';
import { rng } from './rng.js';
import { hashStr } from './meta.js';

const FKEYS = Object.keys(FACTIONS), MIN = 60000;
const isF = f => FKEYS.includes(f);
const put = (ctx, coll, id, doc, ver, idx = {}) => ctx.ops.push({ t: 'put', coll, id, doc, ver, ...idx });
const nid = ctx => Array.from({ length: 4 }, () => Math.floor(ctx.rand() * 65536).toString(16).padStart(4, '0')).join('');
const fmt = n => Math.round(n).toLocaleString('tr-TR');
const same = (a, b) => String(a) === String(b);
const cidOk = v => typeof v === 'string' && /^[a-z0-9-]{1,32}$/.test(v);
// Bir istekte aynı belge bir kez yazılır: bekleyen yazmalarda aranır, kaydederken var olan yazma yerinde güncellenir
async function open(ctx, coll, id) {
  const op = ctx.ops.findLast(o => o.t === 'put' && o.coll === coll && o.id === id);
  if (op) return { id, doc: op.doc, ver: op.ver, op };
  if (ctx.ops.some(o => o.t === 'del' && o.coll === coll && o.id === id)) return { id, doc: null, ver: null };
  const r = await ctx.store.get(coll, id);
  return r ? { id, doc: r.doc, ver: r.ver } : { id, doc: null, ver: null };
}
function save(ctx, coll, h, idx = {}) {
  if (h.op) { h.op.doc = h.doc; Object.assign(h.op, idx); return; }
  put(ctx, coll, h.id, h.doc, h.ver, idx); h.op = ctx.ops.at(-1);
}
// Klan belgesi clanrules.js ile aynı dizinle yazılır (klan gücü, kuşatma puanı)
const power = d => d.members.reduce((a, m) => a + (m.power || m.lvl * 85), 0);
const saveClan = (ctx, C) => save(ctx, 'clan', C, { k1: C.doc.faction, n1: power(C.doc), n2: C.doc.siege?.score || 0 });
async function clanOf(ctx, id) {
  if (!cidOk(id)) return null;
  const C = await open(ctx, 'clan', id);
  if (!C.doc) return null;
  normClan(C.doc, ctx.now); allyNorm(C.doc);
  return C;
}
const allyNorm = d => { if (typeof d.ally !== 'string') d.ally = null; if (!Array.isArray(d.allyInv)) d.allyInv = []; d.allyInv = d.allyInv.filter(x => x && cidOk(x.cid)); return d; };
const banner = d => (validBanner(d.banner) ? d.banner : defaultBanner(d.name));
const brief = C => ({ id: C.id, name: C.doc.name, lvl: C.doc.lvl || 1, banner: banner(C.doc), members: C.doc.members.length, bot: C.id.startsWith('bot-') });

// ---------- Hisar belgesi ve haftalık sonuç ----------
const newHisar = f => ({ f, week: 0, owner: null, last: null, due: {}, pool: 0, inc: null, prev: null });
function hNorm(d, f) {
  d.f = f; if (!(d.week >= 0)) d.week = 0; d.owner ||= null; d.last ||= null; if (!d.due || typeof d.due !== 'object') d.due = {};
  if (!Number.isSafeInteger(d.pool) || d.pool < 0) d.pool = 0;
  return d;
}
// Yapay üyelerin pencere boyunca topladığı hisar puanı (yalnızca ctx.bots): pencere ilerledikçe artar, sonra sabit kalır
function botScore(ctx, week, C) {
  if (!ctx.bots || !C.id.startsWith('bot-')) return 0; // yalnızca yapay klanlar
  const w = hisarWin(week), frac = Math.max(0, Math.min(1, (ctx.now - w.start) / (w.end - w.start)));
  if (!frac) return 0;
  let n = 0;
  for (const m of C.doc.members) if (m.bot) n += 250 + Math.floor(rng(hashStr(`hs|${week}|${C.id}|${m.id}`))() * 650);
  return Math.round(n * frac);
}
// O haftanın kuşatma tablosu (ırkın klanları): gerçek puan + yapay katkı
async function standings(ctx, f, week) {
  const rows = await ctx.store.query('clan', { k1: f, order: '-n1', limit: 200 });
  const out = [];
  for (const r of rows) {
    const C = ctx.ops.findLast(o => o.t === 'put' && o.coll === 'clan' && o.id === r.id)?.doc || r.doc;
    const real = C.hisar && C.hisar.week === week ? C.hisar.score || 0 : 0, score = real + botScore(ctx, week, { id: r.id, doc: C });
    if (score > 0) out.push({ id: r.id, name: C.name, banner: banner(C), score });
  }
  return out.sort((a, b) => b.score - a.score || (a.id < b.id ? -1 : 1));
}
// Kesinleşmesi gereken hafta varsa sonuçlandırır: en yüksek puanlı klan hisarın yeni sahibi olur (eşitlikte eski sahip
// kalır); kimse puan yazmadıysa sahip değişmez. Belge sürümüyle yazıldığı için aynı hafta iki kez sonuçlanamaz.
async function settle(ctx, f, h, force) {
  const target = force ?? hisarDue(ctx.now);
  if (h.doc.week >= target && force == null) return;
  const top = await standings(ctx, f, target), best = top[0];
  if (best) {
    const keep = h.doc.owner && top.find(t => t.id === h.doc.owner.id && t.score === best.score);
    if (!keep) h.doc.owner = { id: best.id, name: best.name, banner: best.banner, since: Math.min(ctx.now, hisarWin(target).resolveAt) };
  }
  h.doc.last = { week: target, top: top.slice(0, 8) };
  h.doc.week = target; h.dirty = true;
}
async function hisarDoc(ctx, f, force) {
  const h = await open(ctx, 'hisar', f);
  if (!h.doc) { h.doc = newHisar(f); h.dirty = true; }
  hNorm(h.doc, f);
  await settle(ctx, f, h, force);
  // Sahip klan dağıldıysa hisar boşalır (vergi eski akışla hazineye gider)
  if (h.doc.owner && !(await open(ctx, 'clan', h.doc.owner.id)).doc) { h.doc.owner = null; h.dirty = true; }
  return h;
}
const keepH = (ctx, h) => { if (h.dirty) { save(ctx, 'hisar', h); h.dirty = false; } };
// Hisar sahibinin ittifak ortakları (aynı ırk; ittifak belgesi doğrunun kaynağıdır)
async function alliesOf(ctx, C) {
  if (!C?.doc?.ally) return [];
  const A = await open(ctx, 'ally', C.doc.ally);
  if (!A.doc || !A.doc.clans.includes(C.id)) return [];
  return A.doc.clans.filter(id => id !== C.id);
}
const bump = (d, W, k, n) => { d.inc ||= { week: W, own: 0, ally: 0, pool: 0 }; if (d.inc.week !== W) { d.prev = d.inc; d.inc = { week: W, own: 0, ally: 0, pool: 0 }; } d.inc[k] += n; };

// Irkın vergisi (realmops.js sweep): hisarın sahibi varsa üçe bölünür ve hazineye 0 kalır; sahip yoksa olduğu gibi hazineye gider.
// Klan payları belgede "due" olarak bekler, klan ekranı açılınca hazineye geçer (hisarCollect). Dönüş: Irk Hazinesi'ne kalan.
export async function hisarTake(ctx, f, n) {
  if (!isF(f) || !(n > 0)) return n;
  const h = await hisarDoc(ctx, f), O = h.doc.owner;
  if (!O) { keepH(ctx, h); return n; }
  const C = await open(ctx, 'clan', O.id), allies = [], W = weekKey(ctx.now);
  for (const id of await alliesOf(ctx, C)) { const X = await open(ctx, 'clan', id); if (X.doc && X.doc.faction === f) allies.push(id); } // dağılmış klana pay yazılmaz
  const s = splitTax(n, allies.length);
  h.doc.due[O.id] = (h.doc.due[O.id] || 0) + s.own; bump(h.doc, W, 'own', s.own);
  for (const id of allies) h.doc.due[id] = (h.doc.due[id] || 0) + s.each;
  bump(h.doc, W, 'ally', s.ally);
  h.doc.pool += s.pool; bump(h.doc, W, 'pool', s.pool);
  h.dirty = true; keepH(ctx, h);
  return 0;
}
// Klan ekranı (clanrules.js clan.view): klana yolda olan hisar payını alır; dönen akçe klan hazinesine eklenir
export async function hisarCollect(ctx, C) {
  const f = C.doc.faction;
  if (!isF(f)) return 0;
  const h = await open(ctx, 'hisar', f), n = h.doc?.due?.[C.id] || 0;
  if (!(n > 0)) return 0;
  delete h.doc.due[C.id]; save(ctx, 'hisar', h);
  return n;
}

// Büyük Sefer'e katılım (dispatch: savaş sonu): o hafta sefer puanı kazanan oyuncu katılımcı listesine bir kez yazılır
export async function hisarAfter(ctx, p, action) {
  if (action?.type !== 'battle.finish' || !(p.pend?.war > 0) || !isF(p.faction)) return;
  const W = weekKey(ctx.now);
  if (p.warJoin === W) return;
  p.warJoin = W;
  put(ctx, 'warp', `${W}:${ctx.pid}`, { f: p.faction, name: p.name, at: ctx.now }, undefined, { k1: `${W}:${p.faction}`, n1: ctx.now });
}

export function hisarWorld(H) {
  const { mail, warStandings, botClans } = H;
  // Havuz dağıtımı: biten haftanın (W − 1) Büyük Sefer galibi ırkın o hafta savaşa katılan üyelerine eşit pay (posta).
  // Galip yoksa (beraberlik) ya da katılan yoksa havuz devreder. Dağıtılamayan küsurat havuzda kalır.
  // Yapay oyuncular açıksa (deneme) onlar da katılımcı sayılır ve payları yanar; gerçek oyunculara posta gider.
  async function payout(ctx, opt = {}) {
    const P = await open(ctx, 'hisar', 'pool');
    P.doc ||= { paid: 0, last: null };
    const W = opt.week ?? weekKey(ctx.now) - 1;
    if (!opt.force && P.doc.paid >= W) return P.doc;
    const winner = opt.winner !== undefined ? opt.winner : (await warStandings(ctx)).winner;
    const hs = {}; let total = 0;
    for (const f of FKEYS) { hs[f] = await hisarDoc(ctx, f); total += hs[f].doc.pool; }
    const real = winner ? (await ctx.store.query('warp', { k1: `${W}:${winner}`, limit: 500 })).filter(r => /^\d+$/.test(r.id.split(':')[1])) : [];
    const bots = winner && ctx.bots ? 6 + Math.floor(rng(hashStr(`warp|${W}|${winner}`))() * 9) : 0, count = real.length + bots;
    const { each } = poolShare(total, count);
    if (each > 0) {
      for (const r of real) {
        const to = Number(r.id.split(':')[1]), id = `hpool-${W}-${to}`;
        if (await ctx.store.get('mail', id)) continue;
        put(ctx, 'mail', id, { to, text: `Irklar Arası Vergi Havuzu: ${FACTIONS[winner].name} Büyük Sefer'i kazandı. Savaşa katılan ${count} kişiye eşit pay: ${fmt(each)} akçe.`, give: [{ t: 'akce', n: each }], at: ctx.now, realm: 1 }, null, { k1: String(to), n1: ctx.now });
      }
      let take = each * count; // havuz iki ırk belgesinde birikir: önce birinden, sonra ötekinden düşülür
      for (const f of FKEYS) { const k = Math.min(take, hs[f].doc.pool); hs[f].doc.pool -= k; take -= k; hs[f].dirty = true; }
    }
    for (const f of FKEYS) keepH(ctx, hs[f]);
    P.doc.paid = Math.max(P.doc.paid || 0, W);
    P.doc.last = { week: W, f: winner || null, n: total, each, count, real: real.length };
    save(ctx, 'hisar', P);
    return P.doc;
  }

  // Oyuncunun klanı (üyelik belgeden doğrulanır) ve ittifakı
  async function myClan(ctx, p) {
    const C = p.clan ? await clanOf(ctx, p.clan) : null;
    const me = C && C.doc.members.find(m => same(m.id, ctx.pid));
    if (!C || !me) fail('no-clan', 'Bir klanda değilsin.');
    return { C, d: C.doc, me };
  }
  async function allyOf(ctx, C) {
    if (!C.doc.ally) return null;
    const A = await open(ctx, 'ally', C.doc.ally);
    if (!A.doc || !A.doc.clans.includes(C.id)) { C.doc.ally = null; C.dirty = true; return null; }
    return A;
  }
  const mayAlly = me => { if (!can(rankOf(me), 'hq')) fail('no-perm', 'İttifak işlerini Reis ve Yardımcılar yapar.'); };
  // İki klanı aynı ittifakta birleştirir (davet eden klanın ittifakı varsa ona katılır, yoksa yeni ittifak kurulur)
  async function join(ctx, A0, from, to) {
    let A = A0;
    if (!A) { A = { id: from.id.startsWith('bot-') && to.id.startsWith('bot-') ? `bot-${from.doc.faction}` : nid(ctx), doc: { f: from.doc.faction, clans: [from.id], at: ctx.now }, ver: null }; from.doc.ally = A.id; from.dirty = true; }
    if (A.doc.clans.length >= HISAR.allyMax) fail('ally-full', `Bir ittifakta en çok ${HISAR.allyMax} klan olabilir.`);
    A.doc.clans.push(to.id); to.doc.ally = A.id; to.doc.allyInv = to.doc.allyInv.filter(x => x.cid !== from.id); to.dirty = true;
    save(ctx, 'ally', A);
    return A;
  }
  // Yapay dünya (yalnızca ctx.bots): her ırkta iki yapay klan müttefiktir, bir yapay klan oyuncunun klanına bir kez teklif yollar
  async function botWorld(ctx, p, C) {
    if (!ctx.bots) return;
    const f = C.doc.faction, rows = await ctx.store.query('clan', { k1: f, order: '-n1', limit: 30 });
    await botClans(ctx, f, rows);
    const b1 = await clanOf(ctx, `bot-${f}-1`), b2 = await clanOf(ctx, `bot-${f}-2`);
    if (b1 && b2 && !b1.doc.ally && !b2.doc.ally) { await join(ctx, null, b1, b2); saveClan(ctx, b1); saveClan(ctx, b2); }
    if (!C.doc.ally && !C.doc.allyBot && !C.doc.allyInv.length) {
      const b0 = await clanOf(ctx, `bot-${f}-0`);
      if (b0 && !b0.doc.ally) { C.doc.allyInv.push({ cid: b0.id, name: b0.doc.name, at: ctx.now }); C.doc.allyBot = 1; C.dirty = true; }
    }
    // Yapay üyeler süren yükseltmeye zamanla yardım eder (iki dakikada bir, en çok 5)
    const U = C.doc.hq?.up, Hp = U?.help;
    if (Hp?.ask) {
      const bots = C.doc.members.filter(m => m.bot && !Hp.by.includes(String(m.id))), want = Math.min(5, Math.floor((ctx.now - Hp.at) / (2 * MIN)));
      for (const m of bots.slice(0, Math.max(0, want - Hp.by.filter(x => !/^\d+$/.test(x)).length))) applyHelp(ctx, C, String(m.id), m.name);
    }
  }
  function applyHelp(ctx, C, who, name) {
    const U = C.doc.hq.up, Hp = U.help, dur = U.end0 - U.at, cut = helpCut(dur, Hp.cut);
    if (!(cut > 0)) return 0;
    U.end -= cut; Hp.cut += cut; Hp.by.push(who); Hp.names = [...(Hp.names || []), name].slice(-12); C.dirty = true;
    return cut;
  }
  // Yardım listesi: kendi klanının ve müttefiklerin yardım isteyen işleri
  function helpRow(ctx, C, mine) {
    const U = C.doc.hq?.up;
    if (!U || !U.help?.ask || !(U.end > ctx.now)) return null;
    const dur = U.end0 - U.at;
    return { cid: C.id, clan: C.doc.name, own: mine, job: `${HQ_FAC[U.id]?.name || 'Tesis'} Sv. ${U.to}`, who: U.by || '', end: U.end, at: U.at, dur, cut: U.help.cut, max: helpMax(dur), n: U.help.by.length,
      done: U.help.by.includes(String(ctx.pid)), self: same(U.help.who, ctx.pid), names: (U.help.names || []).slice(-5) };
  }

  const HANDLERS = {
    // Klan penceresinin Hisar sekmesi: hisar, kuşatma tablosu, vergi dağılımı, havuz, ittifak, yardım listesi
    async 'hisar.view'(ctx, p) {
      const { C, d, me } = await myClan(ctx, p), f = d.faction;
      await botWorld(ctx, p, C);
      const P = await payout(ctx);
      const h = await hisarDoc(ctx, f); keepH(ctx, h);
      const A = await allyOf(ctx, C), allies = [];
      if (A) for (const id of A.doc.clans) { const X = id === C.id ? C : await clanOf(ctx, id); if (X) allies.push({ ...brief(X), me: X.id === C.id }); }
      const help = [];
      for (const X of [C, ...(await Promise.all((A?.doc.clans || []).filter(id => id !== C.id).map(id => clanOf(ctx, id)))).filter(Boolean)]) { const r = helpRow(ctx, X, X === C); if (r) help.push(r); }
      const U = d.hq?.up, W = weekKey(ctx.now), win = nextHisar(ctx.now), openW = hisarOpen(ctx.now);
      const liveWeek = ctx.now >= hisarWin(W).start ? W : null;
      const live = liveWeek != null && h.doc.week < liveWeek ? await standings(ctx, f, liveWeek) : null;
      if (C.dirty) { saveClan(ctx, C); C.dirty = false; }
      const O = h.doc.owner, ownerAllies = O ? (O.id === C.id ? allies.filter(a => !a.me).map(a => a.id) : await alliesOf(ctx, await open(ctx, 'clan', O.id))) : [];
      return {
        f, name: HISAR.names[f] || 'Hisar', owner: O ? { ...O, mine: O.id === C.id, ally: ownerAllies.includes(C.id) } : null, ownerAllies: ownerAllies.length,
        win: { start: win.start, end: win.end, resolveAt: hisarWin(win.week).resolveAt, open: openW != null }, tries: { used: openW != null ? p.weekly.hisar || 0 : 0, max: HISAR.tries },
        live: live && live.slice(0, 8).map(r => ({ ...r, mine: r.id === C.id })), last: h.doc.last && { week: h.doc.last.week, top: h.doc.last.top.map(r => ({ ...r, mine: r.id === C.id })) },
        myScore: d.hisar?.week === (liveWeek ?? -1) ? d.hisar.score : 0, myPart: me.hw === liveWeek ? me.hs || 0 : 0,
        inc: h.doc.inc?.week === W ? h.doc.inc : null, prev: h.doc.inc?.week === W - 1 ? h.doc.inc : h.doc.prev?.week === W - 1 ? h.doc.prev : null,
        pool: { now: (await Promise.all(FKEYS.map(x => open(ctx, 'hisar', x)))).reduce((a, x) => a + (x.doc?.pool || 0), 0), last: P.last || null, joined: p.warJoin === W },
        ally: { id: A?.id || null, clans: allies, inv: d.allyInv.map(x => ({ cid: x.cid, name: x.name, at: x.at })), can: can(rankOf(me), 'hq'), max: HISAR.allyMax },
        help, myJob: U ? { id: U.id, to: U.to, end: U.end, asked: !!U.help?.ask } : null, helpToday: p.daily.help || 0, helpMax: HISAR.helpDaily,
      };
    },
    // Aday klanlar (ittifak teklifi için): aynı ırkın ittifaksız klanları
    async 'ally.list'(ctx, p) {
      const { C } = await myClan(ctx, p);
      const rows = await ctx.store.query('clan', { k1: C.doc.faction, order: '-n1', limit: 30 });
      return { clans: rows.filter(r => r.id !== C.id && !r.doc.ally).slice(0, 15).map(r => ({ id: r.id, name: r.doc.name, lvl: r.doc.lvl || 1, banner: banner(r.doc), members: r.doc.members.length, sent: (r.doc.allyInv || []).some(x => x.cid === C.id) })) };
    },
    async 'ally.invite'(ctx, p, { id }) {
      const { C, me } = await myClan(ctx, p); mayAlly(me);
      const T = await clanOf(ctx, id);
      if (!T || T.id === C.id || T.doc.faction !== C.doc.faction) fail('no-clan', 'Klan bulunamadı.');
      if (T.doc.ally) fail('has-ally', 'Bu klan başka bir ittifakta.');
      const A = await allyOf(ctx, C);
      if (A && A.doc.clans.length >= HISAR.allyMax) fail('ally-full', `Bir ittifakta en çok ${HISAR.allyMax} klan olabilir.`);
      let accepted = false;
      if (ctx.bots && T.id.startsWith('bot-')) { await join(ctx, A, C, T); accepted = true; } // yapay klan teklifi hemen kabul eder
      else {
        if (T.doc.allyInv.some(x => x.cid === C.id)) fail('sent', 'Bu klana zaten teklif gönderdin.');
        T.doc.allyInv = [...T.doc.allyInv.filter(x => ctx.now - x.at < 7 * 86400000), { cid: C.id, name: C.doc.name, at: ctx.now }].slice(-10); T.dirty = true;
      }
      saveClan(ctx, T); if (C.dirty) saveClan(ctx, C);
      return { name: T.doc.name, accepted };
    },
    async 'ally.accept'(ctx, p, { id }) {
      const { C, me } = await myClan(ctx, p); mayAlly(me);
      if (await allyOf(ctx, C)) fail('has-ally', 'Klanın zaten bir ittifakta. Önce ittifaktan ayrıl.');
      if (!C.doc.allyInv.some(x => x.cid === id)) fail('no-invite', 'Böyle bir teklif yok.');
      const F = await clanOf(ctx, id);
      if (!F || F.doc.faction !== C.doc.faction) { C.doc.allyInv = C.doc.allyInv.filter(x => x.cid !== id); saveClan(ctx, C); fail('no-clan', 'Teklif eden klan bulunamadı.'); }
      await join(ctx, await allyOf(ctx, F), F, C);
      saveClan(ctx, F); saveClan(ctx, C);
      return { name: F.doc.name };
    },
    async 'ally.decline'(ctx, p, { id }) {
      const { C, me } = await myClan(ctx, p); mayAlly(me);
      C.doc.allyInv = C.doc.allyInv.filter(x => x.cid !== id); saveClan(ctx, C);
    },
    // İttifaktan ayrılma (bozma): iki klanlık ittifak dağılır; kalan klanın kaydı bir sonraki okunuşunda temizlenir
    async 'ally.leave'(ctx, p) {
      const { C, me } = await myClan(ctx, p); mayAlly(me);
      const A = await allyOf(ctx, C);
      if (!A) fail('no-ally', 'Klanın bir ittifakta değil.');
      A.doc.clans = A.doc.clans.filter(x => x !== C.id);
      if (A.doc.clans.length < 2) ctx.ops.push({ t: 'del', coll: 'ally', id: A.id, ver: A.op ? undefined : A.ver }); else save(ctx, 'ally', A);
      C.doc.ally = null; saveClan(ctx, C);
    },
    // Süren Karargâh yükseltmesi için yardım iste (klanın herhangi bir üyesi)
    async 'help.ask'(ctx, p) {
      const { C } = await myClan(ctx, p), U = hqNorm(C.doc).up;
      if (!U || !(U.end > ctx.now)) fail('no-job', 'Süren bir yükseltme yok.');
      if (U.help?.ask) fail('asked', 'Bu iş için zaten yardım istendi.');
      U.end0 ||= U.end; U.help = { ask: true, who: ctx.pid, at: ctx.now, cut: 0, by: [], names: [] };
      saveClan(ctx, C);
      return { end: U.end };
    },
    // Yardım et: kendi klanının ya da müttefik klanın işine; her oyuncu bir işe bir kez. Ödül günde HISAR.helpDaily kez.
    async 'help.give'(ctx, p, { id }) {
      const { C } = await myClan(ctx, p), T = id === C.id ? C : await clanOf(ctx, id);
      if (!T) fail('no-clan', 'Klan bulunamadı.');
      if (T !== C) { const A = await allyOf(ctx, C); if (!A || !A.doc.clans.includes(T.id)) fail('not-ally', 'Yalnızca kendi klanına ve müttefiklerine yardım edebilirsin.'); }
      const U = T.doc.hq?.up;
      if (!U || !U.help?.ask || !(U.end > ctx.now)) fail('no-job', 'Bu iş bitti ya da yardım istenmedi.');
      if (same(U.help.who, ctx.pid)) fail('self', 'Kendi istediğin yardıma katılamazsın.');
      if (U.help.by.includes(String(ctx.pid))) fail('helped', 'Bu işe zaten yardım ettin.');
      U.end0 ||= U.end;
      const cut = applyHelp(ctx, T, String(ctx.pid), p.name);
      if (!cut) fail('help-max', 'Bu iş en kısa süresine indi.');
      saveClan(ctx, T);
      let akce = 0;
      if ((p.daily.help || 0) < HISAR.helpDaily) { p.daily.help = (p.daily.help || 0) + 1; akce = HISAR.helpAkce; p.akce += akce; }
      return { cut, end: U.end, akce };
    },
    // ---- Yalnızca test sürümü: kuşatma sonucunu ve havuz dağıtımını hemen işler ----
    async 'dev.hisar'(ctx, p, { op } = {}) {
      if (!ctx.dev) fail('forbidden');
      const { C, d } = await myClan(ctx, p), W = weekKey(ctx.now);
      if (op === 'score') { d.hisar = { week: W, score: (d.hisar?.week === W ? d.hisar.score : 0) + 20000 }; saveClan(ctx, C); return; }
      if (op === 'resolve') { const h = await hisarDoc(ctx, d.faction, W); keepH(ctx, h); return { owner: h.doc.owner }; }
      if (op === 'pay') { const S = (await warStandings(ctx)).now; return { pool: await payout(ctx, { week: W, winner: S.ocak >= S.sancak ? 'ocak' : 'sancak', force: true }) }; }
      fail('bad-op');
    },
  };
  return HANDLERS;
}
export const HISAR_READ_ONLY = ['ally.list'];
