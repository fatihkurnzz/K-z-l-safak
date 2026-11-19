// Sunucu duyuru şeridi: herkesin ekranının üstünden geçen sarı yazı ve genel sohbetin üstündeki sabit duyuru.
// Tetikleyiciler: +8 ve üstü başarılı basma, eşsiz eşya düşmesi, bölge hâkimiyeti (haftalık kuşatma sonucu), yeni Başbuğ,
// etkinlik hatırlatmaları (Canlı Meydan pencereleri). Kalıcı duyurular 'ann' koleksiyonundadır (k1 'all', n1 zaman);
// hafta ve saat takviminden türeyenler (Başbuğ, bölge, etkinlik) yazılmaz, her okumada aynı biçimde üretilir.
// Sabit duyuru kuralı (pinOf): bir duyuru sabitlenince en az ANN.hold kalır; o sırada gelen yeniler beklemez, süre dolunca
// en yenisi yerine geçer.
import { FACTIONS, weekKey, hourOf } from './content.js';
import { weekStartAt } from './realm.js';
import { itemBase, itemName } from './items.js';
import { rulersNow, terrBrief } from './realmops.js';
import { botParty } from './bots.js';
import { pickFrom } from './rng.js';
import { allBases } from './items.js';

const MIN = 60000, HOUR = 60 * MIN;
export const ANN = { hold: 5 * MIN, keep: 30, feed: 20, minPlus: 8, botEvery: [4 * MIN, 9 * MIN] };
const fName = f => FACTIONS[f]?.name || '';

// Duyuru kaydı yazar (dispatch'in ops listesine). k: 'plus' | 'unique' | 'terr' | 'ruler' | 'event' | 'bot'
export function announce(ctx, k, text, extra = {}) {
  const at = ctx.now, id = at.toString(36) + Math.floor(ctx.rand() * 1e6).toString(36);
  ctx.ops.push({ t: 'put', coll: 'ann', id, ver: null, doc: { k, text: String(text).slice(0, 140), at, ...extra }, k1: 'all', n1: at });
}

// Doğrulanmış her işlemden sonra (world.js dispatch): yalnızca sunucunun kendi sonucundan okunur
export async function afterAnn(ctx, p, action, result) {
  const t = action.type, who = p.name;
  if (t === 'anvil.upgrade' && result?.ok && result.plus >= ANN.minPlus) {
    const it = p.items.find(x => x.id === action.id);
    if (it) announce(ctx, 'plus', `${who}, ${itemBase(it.b).name} eşyasını +${result.plus} bastı!`, { f: p.faction, plus: result.plus });
  }
  const loot = t === 'battle.finish' ? result?.loot : t === 'wheel.spin' ? (result?.loot || (result?.drop ? [result.drop] : [])) : null;
  if (Array.isArray(loot)) for (const l of loot) if (l?.t === 'item' && itemBase(l.b)?.unique && !String(l.b).startsWith('s:')) announce(ctx, 'unique', `${who} eşsiz bir eşya buldu: ${itemBase(l.b).name}!`, { f: p.faction });
}

// Takvimden türeyen duyurular: Canlı Meydan pencereleri (10 dk önce ve açılışta), bu haftanın Başbuğları, bölge hâkimiyeti
async function derived(ctx) {
  const out = [], now = ctx.now, W = weekKey(now), ws = weekStartAt(W);
  for (const back of [0, 1]) { // bugünün ve dünün pencereleri (saatler UTC+3 hourOf ile aynı tabandadır)
    const day0 = now - (now % (24 * HOUR)) - back * 24 * HOUR;
    for (const h of [13, 21]) for (let off = -12; off <= 12; off++) {
      const t = day0 + off * HOUR;
      if (hourOf(t) !== h || t > now + 10 * MIN) continue;
      if (t - 10 * MIN <= now) out.push({ id: `ev:${t}:pre`, k: 'event', text: `Canlı Meydan ${h}:00'da açılıyor! Hakkını hazırla.`, at: t - 10 * MIN });
      if (t <= now) out.push({ id: `ev:${t}:open`, k: 'event', text: `Canlı Meydan açıldı (${h}:00). Bir saat boyunca eşleşme var.`, at: t });
    }
  }
  try {
    const R = await rulersNow(ctx);
    for (const f in R) if (R[f]) out.push({ id: `ruler:${W}:${f}`, k: 'ruler', text: `Yeni ${fName(f)} Başbuğu: ${R[f].name}`, at: Math.max(ws, R[f].at || ws), f });
    const own = await terrBrief(ctx);
    for (const f of Object.keys(FACTIONS)) { const z = own.filter(x => x.owner === f).map(x => x.name); if (z.length) out.push({ id: `terr:${W}:${f}`, k: 'terr', text: `${fName(f)} ${z.slice(0, 2).join(' ve ')}${z.length > 2 ? ` ile ${z.length - 2} bölgeyi daha` : ''} ele geçirdi!`, at: ws + (f === 'ocak' ? 1 : 2), f }); }
  } catch { /* diyar belgeleri yoksa (yeni depo) yalnızca kayıtlı duyurular gösterilir */ }
  return out;
}

// Yapay oyuncuların ara sıra yazdığı duyurular (yalnızca ctx.bots açıkken; deneme ve az oyunculu sunucu)
const BASES = allBases().filter(b => !itemBase(b).unique);
const UNIQ = allBases().filter(b => itemBase(b).unique);
function botAnn(ctx) {
  const b = botParty(Math.floor(ctx.rand() * 500) + 100, 20 + Math.floor(ctx.rand() * 55), 0.5);
  if (ctx.rand() < 0.6) { const plus = ctx.rand() < 0.2 ? 10 : ctx.rand() < 0.45 ? 9 : 8; announce(ctx, 'plus', `${b.name}, ${itemBase(pickFrom(ctx.rand, BASES)).name} eşyasını +${plus} bastı!`, { f: b.faction, plus, bot: 1 }); }
  else announce(ctx, 'unique', `${b.name} eşsiz bir eşya buldu: ${itemBase(pickFrom(ctx.rand, UNIQ)).name}!`, { f: b.faction, bot: 1 });
}

// Sabit duyuru: listede (eskiden yeniye) en az ANN.hold kalan, süre dolunca en yenisiyle değişen sıra
export function pinOf(list, now) {
  let pin = null, t = 0, pend = null;
  for (const a of list) {
    if (a.at > now) break;
    if (pend && t + ANN.hold <= a.at) { pin = pend; t = Math.max(pend.at, t + ANN.hold); pend = null; }
    if (!pin || a.at >= t + ANN.hold) { pin = a; t = a.at; pend = null; } else pend = a;
  }
  if (pend && t + ANN.hold <= now) { pin = pend; t = Math.max(pend.at, t + ANN.hold); }
  return pin ? { ...pin, pinAt: t } : null;
}

const view = r => ({ id: r.id, k: r.doc.k, text: r.doc.text, at: r.doc.at, f: r.doc.f || null, plus: r.doc.plus || 0 });
async function allAnn(ctx, rows) { return [...rows.map(view), ...await derived(ctx)].filter(a => a.at <= ctx.now).sort((a, b) => a.at - b.at); }
// Genel sohbetin üstündeki sabit duyuru (world.js chat.list, ch 'g')
export async function annPin(ctx) { return pinOf(await allAnn(ctx, await ctx.store.query('ann', { k1: 'all', order: '-n1', limit: ANN.keep })), ctx.now); }

export const ANN_WORLD = {
  // Şerit ve sabit duyuru: son duyurular (eskiden yeniye) + sabitlenen. since: istemcinin son gördüğü zaman (yalnızca yeniler)
  async 'ann.feed'(ctx, p, { since } = {}) {
    let rows = await ctx.store.query('ann', { k1: 'all', order: '-n1', limit: ANN.keep });
    if (ctx.bots) {
      const last = rows[0]?.doc.at || 0, gap = ANN.botEvery[0] + ((last >> 7) % 1000) / 1000 * (ANN.botEvery[1] - ANN.botEvery[0]);
      if (ctx.now - last > gap) { botAnn(ctx); const op = ctx.ops[ctx.ops.length - 1]; rows = [{ id: op.id, doc: op.doc }, ...rows]; }
    }
    if (rows.length >= ANN.keep) for (const r of rows.slice(ANN.keep)) ctx.ops.push({ t: 'del', coll: 'ann', id: r.id });
    const all = await allAnn(ctx, rows);
    const s = Number.isFinite(since) ? since : ctx.now - 2 * MIN;
    return { list: all.filter(a => a.at > s).slice(-ANN.feed), pin: pinOf(all, ctx.now), now: ctx.now };
  },
};
