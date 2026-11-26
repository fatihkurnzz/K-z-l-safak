// Nüfus dengesi: ırk sayımı, azınlık ırkına "Bereket" ve kalabalık ırka yeni hesap kapama.
// Sayım iki türlüdür; ikisi de paylaşılan belgede, ırk başına ayrı tutulur (sıcak tek belge eşzamanlı yazmada çarpışmasın):
//   nufus/reg:<ırk>        kayıtlı hesap sayısı { n }  — hesap ilk işleminde (giriş/ping, savaş) bir kez sayılır; eski
//                          kayıtlar da böylece ilk girişlerinde sayıma girer (p.nufus.reg bayrağı)
//   nufus/w<hafta>:<ırk>   o hafta en az bir kez giriş yapmış hesap { n }  — "son 7 günde etkin" yaklaşığı: max(bu hafta, geçen hafta)
// Hangi sayı esas alınır: etkin oyuncu toplamı NUFUS.minTotal'a ulaştıysa etkin sayı (daha adil: bırakılmış hesaplar
// sayılmaz), yoksa kayıtlı sayı. Esas sayı toplamı minTotal'ın altındaysa giriş kapama UYGULANMAZ (küçük sunucu).
//   Bereket: küçük / büyük < minorRatio (0,95: iki ırk arasındaki nüfus farkı %5'i aşarsa) ise küçük ırk +%xp deneyim ve +%akce akçe kazanır.
//   Kapama: büyük > küçük × capPct/100 ise büyük ırka yeni hesap açılmaz (mevcut oyuncular etkilenmez).
// Oyuncu kaydı: p.nufus = { reg: 0|1, w: hafta, at: son bakış, minor: ırk|null, closed: ırk|null } (eski kayıtta yoksa burada kurulur)
import { FACTIONS, weekKey, withPct } from './content.js';
import { GameError } from './util.js';
import { rng } from './rng.js';
import { hashStr } from './meta.js';

export const NUFUS = { name: 'Bereket', xp: 15, akce: 10, minorRatio: 0.95, capPct: 120, minTotal: 50, refreshMs: 10 * 60000 };
export const NUFUS_LINE = `+%${NUFUS.xp} EXP · +%${NUFUS.akce} Akçe`;
export const FULL_TEXT = 'Bu ırk şu an dolu — denge sağlanınca açılır.';
const FK = Object.keys(FACTIONS);

// ---- Saf hesap (sunucu, arayüz ve testler aynı işlevi kullanır) ----
// c = { ocak, sancak } → { minor, closed, small, ratio }
export function balanceOf(c) {
  const a = Math.max(0, c.ocak | 0), b = Math.max(0, c.sancak | 0), hi = Math.max(a, b), lo = Math.min(a, b), total = a + b;
  const big = a > b ? 'ocak' : b > a ? 'sancak' : null, small = total < NUFUS.minTotal;
  const ratio = hi ? lo / hi : 1;
  const minor = big && ratio < NUFUS.minorRatio ? (big === 'ocak' ? 'sancak' : 'ocak') : null;
  const closed = !small && big && hi * 100 > lo * NUFUS.capPct ? big : null;
  return { minor, closed, small, ratio: Math.round(ratio * 1000) / 1000, total };
}

// Deneme kipinde (ctx.bots) yapay nüfus: Elentha biraz azınlıkta (Bereket açık), fark kapama eşiğinin altında
const botReg = f => (f === 'ocak' ? 640 : 560);
const botAct = (week, f) => (f === 'ocak' ? 172 : 152) + Math.floor(rng(hashStr(`nufus|${week}|${f}`))() * 7);

const nOf = async (store, id) => (await store.get('nufus', id))?.doc?.n || 0;
// Sunucudaki sayılar ve denge durumu. env: { now, bots }
export async function nufusStatus(store, env) {
  const W = weekKey(env.now), reg = {}, act = {};
  for (const f of FK) {
    reg[f] = await nOf(store, `reg:${f}`) + (env.bots ? botReg(f) : 0);
    act[f] = Math.max(await nOf(store, `w${W}:${f}`), await nOf(store, `w${W - 1}:${f}`)) + (env.bots ? botAct(W, f) : 0);
  }
  const by = act.ocak + act.sancak >= NUFUS.minTotal ? 'act' : 'reg', B = balanceOf(by === 'act' ? act : reg);
  return { reg, act, by, ...B };
}
// Yeni hesap açılışı: ırk doluysa reddeder. Kayıt ucu (sunucu /api/register, deneme kipi api.js) hesap yaratmadan önce çağırır.
export async function nufusGate(store, faction, env) {
  const s = await nufusStatus(store, env);
  if (s.closed && s.closed === faction) throw new GameError('faction-full', FULL_TEXT);
  return s;
}

// ---- Oyuncu tarafı ----
export const nufusState = p => { const N = p.nufus || (p.nufus = {}); if (!N.reg) N.reg = 0; if (!Number.isInteger(N.w)) N.w = 0; if (!Number.isFinite(N.at)) N.at = 0; if (N.minor === undefined) N.minor = null; if (N.closed === undefined) N.closed = null; return N; };
// Oyuncu Bereket alıyor mu (kayıttaki son bakışa göre; realmBefore her giriş/savaşta tazeler)
export const blessed = p => !!p && !!p.faction && p.nufus?.minor === p.faction;
// Kazanç çarpanları. Uygulandığı yerler: modes.js addXp (bütün deneyim kazancı) ve battleAkce (her savaşın akçesi),
// görev ödüllerinin akçesi (blessDrops). Premium, bölge, hava, zindan düzeni çarpanlarıyla ÇARPILIR; ırk bonusu
// (FACTION_BONUS.battleAkce) ile TOPLANIR (ikisi de ırk kaynaklı yüzde).
export const blessXp = (p, xp) => (xp > 0 && blessed(p) ? Math.round(withPct(xp, NUFUS.xp)) : xp);
export const blessAkcePct = p => (blessed(p) ? NUFUS.akce : 0);
export const blessDrops = (p, drops) => (blessed(p) ? drops.map(d => (d && d.t === 'akce' && d.n > 0 ? { ...d, n: Math.round(withPct(d.n, NUFUS.akce)) } : d)) : drops);

// Bir isteğin bekleyen yazmalarından ya da depodan belge (aynı istekte iki kez yazılmasın)
async function bump(ctx, id) {
  const op = ctx.ops.findLast(o => o.t === 'put' && o.coll === 'nufus' && o.id === id);
  if (op) { op.doc.n++; return; }
  const r = await ctx.store.get('nufus', id);
  ctx.ops.push({ t: 'put', coll: 'nufus', id, doc: { n: (r?.doc?.n || 0) + 1 }, ver: r ? r.ver : null, k1: 'nufus', n1: 0 });
}
// dispatch kancası (realmops.js realmBefore): hesabı sayıma alır (bir kez), haftalık etkin sayar (haftada bir) ve
// denge durumunu en çok refreshMs'de bir kayda yazar. Belge yazması çok seyrektir.
export async function nufusSync(ctx, p) {
  if (!Object.hasOwn(FACTIONS, p.faction)) return;
  const N = nufusState(p), W = weekKey(ctx.now);
  if (!N.reg) { await bump(ctx, `reg:${p.faction}`); N.reg = 1; }
  if (N.w !== W) { await bump(ctx, `w${W}:${p.faction}`); N.w = W; }
  if (ctx.now - N.at >= NUFUS.refreshMs || ctx.now < N.at) {
    const s = await nufusStatus(ctx.store, ctx); // bu istekte yazılan sayım henüz depoda değil: bir sonraki tazelemede yansır
    N.at = ctx.now; N.minor = s.minor; N.closed = s.closed;
  }
}
// Arayüz için özet (realm.map ve kayıt ekranı)
export const nufusView = s => ({ reg: s.reg, act: s.act, by: s.by, minor: s.minor, closed: s.closed, small: s.small, ratio: s.ratio, total: s.total });
