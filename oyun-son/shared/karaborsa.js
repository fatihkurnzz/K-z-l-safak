// Karaborsa (19 Kas, kullanıcı isteği): Yemin Pazarı'nda yakutla alınan 9 eşya. Raf 8 saatte bir değişir; her rafın fiyatı
// %5–25 indirimlidir; her raf bir dönemde yalnız bir kez alınabilir. Raf, dönem + oyuncu kimliği + seviye kademesinden
// belirlenimci üretilir (sunucu ve istemci aynı rafı görür; yenilemekle değişmez).
import { rng, pickFrom } from './rng.js';
import { pickGear, tierForLevel, itemBase, G_UNIQUE } from './items.js';
import { REWARD_GRADE, wheelUniques } from './drops.js';
import { BAG_LIMIT } from './content.js';
import { fail, int, pay, grantAll } from './util.js';
import { clsOf, mainId } from './roster.js';

export const KARABORSA = {
  slots: 9, periodMs: 8 * 3600 * 1000, disc: [5, 25],
  // raf düzeni: 5 Nadir kademe eşyası, 2 eşsiz eşya, 2 malzeme
  gear: 5, uniques: 2,
  gearCost: t => 45 + 12 * t, uniqueCost: t => 320 + 30 * t,
  goods: [
    { name: '2 Usta Bileği Taşı', give: { t: 'stone', g: 2, n: 2 }, cost: 110 },
    { name: '2 Uğur Muskası', give: { t: 'charm', n: 2 }, cost: 75 },
    { name: '2 Mühür Taşı', give: { t: 'seal', n: 2 }, cost: 90 },
    { name: '5 İnce Bileği Taşı', give: { t: 'stone', g: 1, n: 5 }, cost: 60 },
    { name: '300 Örs Tozu', give: { t: 'dust', n: 300 }, cost: 55 },
  ],
};
export const kbPeriod = t => Math.floor(t / KARABORSA.periodMs);
export const kbEnds = t => (kbPeriod(t) + 1) * KARABORSA.periodMs;
const hash = s => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };

/** Bu dönemin rafı: [{ i, name?, give, base, disc, price }]. give: grantAll'a giden ödül */
export function kbOffers(p, t) {
  const K = KARABORSA, per = kbPeriod(t), tier = tierForLevel(p.lvl || 1);
  const r = rng((Math.imul(per, 2654435761) ^ hash(p.id || p.name || 'x') ^ Math.imul(tier + 1, 97)) >>> 0);
  const out = [], disc = () => K.disc[0] + Math.floor(r() * (K.disc[1] - K.disc[0] + 1));
  const push = (give, base, name) => { const d = disc(); out.push({ i: out.length, give, base, disc: d, price: Math.max(1, Math.round(base * (100 - d) / 100)), ...(name ? { name } : {}) }); };
  const seen = new Set(), cls = (() => { try { return clsOf(p, mainId(p)); } catch { return null; } })();
  const fits = b => { const B = itemBase(b); return !B?.cls || !cls || B.cls.includes(cls); }; // ana kahramanın sınıfına uyan eşya
  for (let k = 0, tries = 0; k < K.gear && tries < 80; tries++) { // aynı taban iki kez çıkmaz
    const t2 = Math.min(7, tier + (r() < 0.3 ? 1 : 0)), b = pickGear(r, t2);
    if (seen.has(b) || (tries < 60 && !fits(b))) continue; seen.add(b); k++;
    push({ t: 'item', b, g: REWARD_GRADE }, K.gearCost(t2));
  }
  const U0 = wheelUniques(p.lvl || 1).filter(b => !seen.has(b)), U = U0.filter(fits).length >= 2 ? U0.filter(fits) : U0;
  for (let k = 0; k < K.uniques && U.length; k++) { const b = U.splice(Math.floor(r() * U.length), 1)[0]; push({ t: 'item', b, g: G_UNIQUE }, K.uniqueCost(itemBase(b)?.tier ?? tier)); }
  const G = [...K.goods];
  while (out.length < K.slots && G.length) { const x = G.splice(Math.floor(r() * G.length), 1)[0]; push(x.give, x.cost, x.name); }
  return out;
}
// Bu dönemde alınan rafların kaydı (dönem değişince sıfırlanır)
const kbState = (p, t) => { const per = kbPeriod(t); if (!p.kb || p.kb.per !== per) p.kb = { per, got: [] }; return p.kb; };

export const KB_HANDLERS = {
  'karaborsa.view'(p, _, env) {
    const S = kbState(p, env.now);
    return { offers: kbOffers(p, env.now), got: S.got, ends: kbEnds(env.now) };
  },
  'karaborsa.buy'(p, { i }, env) {
    if (!int(i, 0, KARABORSA.slots - 1)) fail('bad-item');
    const S = kbState(p, env.now), O = kbOffers(p, env.now)[i] || fail('bad-item');
    if (S.got.includes(i)) fail('sold', 'Bu rafı bu dönem zaten aldın.');
    if (O.give.t === 'item' && p.items.length >= BAG_LIMIT) fail('bag-full', 'Çanta dolu.');
    pay(p, 'yakut', O.price, 'Yeterli yakut yok.');
    S.got.push(i);
    return { loot: grantAll(p, [O.give]), price: O.price };
  },
};
