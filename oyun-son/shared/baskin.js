// Dünya Baskını: "Küllerin Tarikatı" (hafta sonu PvE zirvesi). Hafta içi Meydan'da çekişen iki ırk, cumartesi 00:00 -
// pazar 23:59 (sunucu saati, UTC+3) arasında aynı boss'a saldırır; verilen hasar İKİ IRK İÇİN ORTAK havuza yazılır.
// Havuz barajları (%33 / %66 / %100) geçildikçe kademe açılır; hafta sonu bitince, en az bir kez saldırmış HERKESE
// (iki ırk) açılan kademelerin ödülü tek postayla gider. Hedef, haftanın ilk saldırısında sunucu nüfusuna göre kilitlenir.
// Paylaşılan belge: baskin/<hafta> = { week, target, pop, dmg:{ırk:hasar}, n:{ırk:kişi}, by:{pid:{nm,f,d,a}}, paid }
// Irk adları içerikteki FACTIONS tablosundan okunur (ad değişirse metinler kendiliğinden güncellenir).
import { FACTIONS, weekKey, weekDay, dayKey } from './content.js';
import { rng } from './rng.js';
import { botName } from './bots.js';
import { fail } from './util.js';
import { nufusStatus } from './nufus.js';

const DAY = 86400000, HOUR = 3600000;
export const BASKIN = {
  boss: 'karaduman',      // zones.js MOBS (etkinlik yaratığı)
  tries: 3,               // kişi başına günlük deneme
  turns: 60,              // süre dolana kadar hasar verilir; kazanma/kaybetme yoktur
  lvl: 15,                // açılış seviyesi
  perPlayer: 80000,       // hedef: nüfus × kişi başı pay (Oba Avı hasarına göre kabaca: katılan yarı nüfus × 6 saldırı × ~25 bin)
  minPop: 40, maxPop: 20000,
  bars: [33, 66, 100],    // baraj yüzdeleri
  // kademe ödülleri (birikimlidir: 3. kademe açıldıysa üçü de verilir)
  gifts: [
    [{ t: 'akce', n: 2500 }, { t: 'stone', g: 1, n: 2 }, { t: 'ember', n: 2 }],
    [{ t: 'akce', n: 5000 }, { t: 'stone', g: 1, n: 3 }, { t: 'seal', n: 1 }],
    [{ t: 'akce', n: 8000 }, { t: 'stone', g: 2, n: 1 }, { t: 'seal', n: 2 }, { t: 'ember', n: 5 }],
  ],
  top: 10,
};
export const fName = f => FACTIONS[f]?.name || f;
// Bir haftanın başlangıcı (pazartesi 00:00, UTC+3) ve baskın penceresi (cumartesi 00:00 - pazartesi 00:00)
export const weekStart = w => (w * 7 - 3) * DAY - 3 * HOUR;
export const raidOpen = now => weekDay(now) >= 5;
export const raidWindow = now => { const w = weekKey(now), s = weekStart(w) + 5 * DAY; return { week: w, start: s, end: weekStart(w + 1), open: raidOpen(now) }; };
// Hedef: nüfus × kişi başı beklenen hasar (alt ve üst sınırla)
export const raidTarget = pop => Math.round(BASKIN.perPlayer * Math.max(BASKIN.minPop, Math.min(BASKIN.maxPop, pop || 0)));
export const tierOf = (total, target) => BASKIN.bars.filter(b => total >= target * b / 100).length;
export const giftsUpTo = tier => BASKIN.gifts.slice(0, tier).flat();
export const newRaid = (week, pop) => ({ week, pop, target: raidTarget(pop), dmg: Object.fromEntries(Object.keys(FACTIONS).map(f => [f, 0])), n: Object.fromEntries(Object.keys(FACTIONS).map(f => [f, 0])), by: {}, paid: 0 });

// Havuza bir saldırı yazar (iki ırk aynı havuz). Döner: { was, tier } kademe değişimi için.
export function addHit(doc, pid, name, faction, d) {
  if (!Object.hasOwn(FACTIONS, faction)) fail('bad-faction');
  d = Math.max(0, Math.round(+d || 0));
  const was = tierOf(total(doc), doc.target), k = String(pid), me = doc.by[k] || (doc.by[k] = { nm: name, f: faction, d: 0, a: 0 });
  if (!me.a) doc.n[faction] = (doc.n[faction] || 0) + 1;
  me.nm = name; me.d += d; me.a++;
  doc.dmg[faction] = (doc.dmg[faction] || 0) + d;
  return { was, tier: tierOf(total(doc), doc.target) };
}
export const total = (doc, extra) => Object.keys(FACTIONS).reduce((a, f) => a + (doc.dmg[f] || 0) + (extra?.[f] || 0), 0);

// Yerel/deneme kipi: yapay oyuncular pencere ilerledikçe iki ırktan hasar ekler (belgeye yazılmaz, her okumada hesaplanır).
// Pencere sonunda hedefin ~%95'ine varır: son baraj gerçek oyuncunun katkısını ister.
export function botShare(doc, now) {
  const W = raidWindow(weekStart(doc.week) + 5 * DAY), frac = Math.max(0, Math.min(1, (now - W.start) / (W.end - W.start)));
  const r = rng(doc.week * 31 + 7), split = 0.42 + r() * 0.16, all = doc.target * 0.95 * frac, [a, b] = Object.keys(FACTIONS);
  const dmg = { [a]: Math.round(all * split), [b]: Math.round(all * (1 - split)) };
  const ppl = [];
  for (let i = 0; i < 14; i++) { const f = i % 2 ? b : a, w = 0.4 + r() * 1.2; ppl.push({ id: `bot:${8800 + i}`, nm: botName(r), f, w }); }
  for (const f of [a, b]) { const L = ppl.filter(x => x.f === f), s = L.reduce((x, y) => x + y.w, 0); for (const x of L) x.d = Math.round(dmg[f] * 0.35 * x.w / s); } // tabloda görünen yapay oyuncular havuzun bir bölümünü taşır
  const k = Math.round(19 * Math.min(1, frac * 4));
  return { dmg, n: { [a]: k, [b]: k }, top: ppl.filter(x => x.d > 0).map(x => ({ id: x.id, nm: x.nm, f: x.f, d: x.d, bot: 1 })) };
}

// İstemciye giden görünüm
export function raidView(doc, now, pid, bots) {
  const W = raidWindow(now), B = bots ? botShare(doc, now) : null, sum = total(doc, B?.dmg);
  const dmg = Object.fromEntries(Object.keys(FACTIONS).map(f => [f, (doc.dmg[f] || 0) + (B?.dmg[f] || 0)]));
  const n = Object.fromEntries(Object.keys(FACTIONS).map(f => [f, (doc.n[f] || 0) + (B?.n[f] || 0)]));
  const rows = [...Object.entries(doc.by).map(([id, x]) => ({ id, nm: x.nm, f: x.f, d: x.d })), ...(B?.top || [])].sort((x, y) => y.d - x.d);
  const mine = doc.by[String(pid)], myRank = mine ? rows.findIndex(x => x.id === String(pid)) + 1 : 0;
  return {
    week: doc.week, open: W.open, start: W.start, end: W.end, target: doc.target, total: sum, tier: tierOf(sum, doc.target), bars: BASKIN.bars, dmg, n,
    top: rows.slice(0, BASKIN.top).map(x => ({ name: x.nm, faction: x.f, dmg: x.d, me: x.id === String(pid) || undefined })),
    me: mine ? { dmg: mine.d, hits: mine.a, rank: myRank } : null, tries: BASKIN.tries,
  };
}

// Biten haftanın ödülü: açılan kademelerin ödülleri en az bir kez saldırmış her gerçek oyuncuya (iki ırk) postayla.
// Döner: [{ to, text, give }] — yazmayı çağıran yapar (world.js). bots: yapay katkı da barajlara sayılır (deneme kipi).
export function payout(doc, bots) {
  const B = bots ? botShare(doc, weekStart(doc.week + 1)) : null, sum = total(doc, B?.dmg), tier = tierOf(sum, doc.target);
  if (!tier) return { tier, mails: [] };
  const give = giftsUpTo(tier), names = Object.keys(FACTIONS).map(fName).join(' ve ');
  const mails = Object.entries(doc.by).filter(([id, x]) => x.a > 0 && !String(id).startsWith('bot:')).map(([id, x]) => ({
    to: /^\d+$/.test(id) ? +id : id,
    text: `Dünya Baskını: ${names} birlikte Küllerin Tarikatı'nın ${tier}/${BASKIN.bars.length} barajını geçti (ortak hasar %${Math.floor(100 * sum / doc.target)}). Katkın: ${x.d.toLocaleString('tr-TR')} hasar.`,
    give,
  }));
  return { tier, mails };
}

// ---------- Dünya işlemleri (world.js'e eklenir) ----------
// mail(ctx, to, text, give, extra) ve put(ctx, coll, id, doc, ver) world.js'ten gelir.
export function baskinWorld({ put, mail }) {
  const get = async (ctx, week) => {
    const r = await ctx.store.get('baskin', String(week));
    if (r) return { doc: r.doc, ver: r.ver };
    // nüfus: bu haftanın (ya da geçen haftanın) etkin oyuncuları (nufus.js); sayım yoksa kayıtlı hesap sayısı
    const N = await nufusStatus(ctx.store, ctx).catch(() => null), act = N ? Object.values(N.act).reduce((a, b) => a + b, 0) : 0;
    const pop = act || (ctx.store.count ? await ctx.store.count() : 0);
    return { doc: newRaid(week, pop), ver: null };
  };
  // Geçen haftanın ödülü henüz dağıtılmadıysa dağıtır (ilk okuyan istek yazar; sürüm denetimi çift ödemeyi önler)
  async function settlePrev(ctx) {
    const w = weekKey(ctx.now) - 1, r = await ctx.store.get('baskin', String(w));
    if (!r || r.doc.paid) return;
    const P = payout(r.doc, ctx.bots);
    for (const m of P.mails) mail(ctx, m.to, m.text, m.give);
    put(ctx, 'baskin', String(w), { ...r.doc, paid: ctx.now, ptier: P.tier }, r.ver);
  }
  // Savaş sonu: hasar havuza yazılır (sonuç kademe değişimini taşır). Girişte (ping) biten hafta ödenir.
  async function after(ctx, p, action, result) {
    if (action?.type === 'ping') return settlePrev(ctx);
    if (action?.type !== 'battle.finish' || result?.mode !== 'baskin' || !result.raid) return;
    const R = result.raid, G = await get(ctx, R.w);
    if (G.doc.paid) return;
    const t = addHit(G.doc, ctx.pid, p.name, p.faction, R.d);
    put(ctx, 'baskin', String(R.w), G.doc, G.ver);
    const v = raidView(G.doc, ctx.now, ctx.pid, ctx.bots);
    R.total = v.total; R.target = v.target; R.tier = v.tier; R.was = Math.min(t.was, v.tier); R.rank = v.me?.rank || 0;
  }
  const HANDLERS = {
    async 'baskin.view'(ctx, p) {
      await settlePrev(ctx);
      const G = await get(ctx, weekKey(ctx.now));
      return { ...raidView(G.doc, ctx.now, ctx.pid, ctx.bots), used: p.daily.baskin || 0, day: dayKey(ctx.now) };
    },
  };
  return { HANDLERS, after, READ_ONLY: ['baskin.view'] };
}
