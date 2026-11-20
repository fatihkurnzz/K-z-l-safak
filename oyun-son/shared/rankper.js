// Dönemlik sıralamalar (günlük, haftalık, aylık; UTC): dönem puanı, dönem sonu ödülü ve birincilere çerçeve.
// Oyuncu ölçütü Meydan puanı, klan ölçütü klan gücüdür; dönem puanı = o ölçütün dönem içindeki kazancı.
// Puan belgeleri 'rkp' koleksiyonunda durur: kimlik `<tür>:<dönem>:<anahtar>:<sahip>`, dizin k1 = kimliğin sahipsiz hâli, n1 = puan.
// Oyuncu kaydı p.rk: { per:{ d|w|m: { k, b, s } }, pc / cc: son alınan oyuncu / klan ödülünün dönem anahtarı, fr: sahip olunan çerçeveler, sel: takılı çerçeve }
import { fail, grantAll } from './util.js';

const DAY = 86400000;
export const PERIODS = { d: 'Günlük', w: 'Haftalık', m: 'Aylık' };
export const PER_KEYS = Object.keys(PERIODS);
// Dönem anahtarı: gün = UTC gün sayısı · hafta pazartesi başlar · ay = yıl*12+ay
export function perKey(per, now) {
  const d = Math.floor(now / DAY);
  if (per === 'd') return d;
  if (per === 'w') return Math.floor((d + 3) / 7);
  const t = new Date(now);
  return t.getUTCFullYear() * 12 + t.getUTCMonth();
}
export const prevKey = (per, now) => perKey(per, now) - 1;
// Çerçeveler: birinci olunan (oyuncu 'p' / klan 'c') her sıralama türü için bir tane
export const FRAMES = {
  pd: 'Günün Şampiyonu', pw: 'Haftanın Şampiyonu', pm: 'Ayın Şampiyonu',
  cd: 'Günün Klanı', cw: 'Haftanın Klanı', cm: 'Ayın Klanı',
  ty: 'Taş Yemini', // 20 Kas: ortak baskının ilk zaferi (yemin.js); iki halkın malzemesi
};
// Sıra ödülleri (oyuncu ve klan üyesi için aynı tablo): to = bu sıraya kadar
const band = m => [
  { to: 1, give: [{ t: 'yakut', n: 20 * m }, { t: 'stone', g: 1, n: 2 * m }] },
  { to: 3, give: [{ t: 'yakut', n: 10 * m }, { t: 'stone', g: 1, n: m }] },
  { to: 10, give: [{ t: 'stone', g: 0, n: 3 * m }] },
];
export const RANK_REWARDS = { d: band(1), w: band(3), m: band(8) };
export const rewardFor = (per, rank) => RANK_REWARDS[per].find(r => rank <= r.to) || null;

export const rkOf = p => { const r = (p.rk ||= {}); r.per ||= {}; r.pc ||= {}; r.cc ||= {}; r.fr ||= []; r.sel ??= null; return r; };
export const frameOf = p => { const r = p.rk; return r && r.sel && r.fr?.includes(r.sel) ? r.sel : null; };
const put = (ctx, id, doc, k1, n1) => ctx.ops.push({ t: 'put', coll: 'rkp', id, doc, ver: undefined, k1, n1 });

// Dönem sayacını ilerletir ve puanı belgeye yazar. slots: { d, w, m } (oyuncu kaydında ya da klan belgesinde) · metric: şimdiki ölçüt
function advance(ctx, slots, kind, owner, metric, doc) {
  for (const per of PER_KEYS) {
    const k = perKey(per, ctx.now);
    let s = slots[per];
    if (!s || s.k !== k) s = slots[per] = { k, b: metric, s: 0 };
    const score = metric - s.b;
    if (score !== s.s) { s.s = score; put(ctx, `${kind}:${per}:${k}:${owner}`, { ...doc, score }, `${kind}:${per}:${k}`, score); }
  }
}
// Oyuncu: her yazma işleminden sonra (world.js dispatch)
export function touchPlayer(ctx, p) {
  if (!p.arena || !Number.isFinite(p.arena.rating)) return;
  advance(ctx, rkOf(p).per, 'p', ctx.pid, p.arena.rating, { name: p.name, faction: p.faction, lvl: p.lvl, av: p.avatar || 'h:warrior', fr: frameOf(p), ti: p.ach?.title || null });
}
// Klan: klan ekranı açılınca (clanrules.js clan.view); d klan belgesi, power klan gücü
export function touchClan(ctx, id, d, power, brief) {
  advance(ctx, (d.rk ||= {}), 'c', id, power, { name: d.name, faction: d.faction, ...brief });
}

// Önceki dönemin sıralamasına göre alınabilecek ödüller: [{ kind, per, key, rank, give, frame }]
export async function claimsOf(ctx, p) {
  const rk = rkOf(p), out = [];
  for (const kind of ['p', 'c']) {
    const owner = kind === 'p' ? String(ctx.pid) : p.clan;
    if (!owner) continue;
    for (const per of PER_KEYS) {
      const key = prevKey(per, ctx.now);
      if ((kind === 'p' ? rk.pc : rk.cc)[per] === key) continue;
      const rows = await ctx.store.query('rkp', { k1: `${kind}:${per}:${key}`, order: '-n1', limit: 10 });
      const i = rows.findIndex(r => r.id === `${kind}:${per}:${key}:${owner}`);
      if (i < 0 || !(rows[i].doc.score > 0)) continue;
      const rw = rewardFor(per, i + 1);
      if (rw) out.push({ kind, per, key, rank: i + 1, give: rw.give, frame: i === 0 ? kind + per : null });
    }
  }
  return out;
}
// Dönemlik tablo (en çok 30 satır); fac: yalnızca oyuncunun kendi ırkı
export async function periodRows(ctx, p, { kind, per, fac }) {
  if (!['p', 'c'].includes(kind) || !PERIODS[per]) fail('bad-arg', 'Geçersiz sıralama.');
  const k1 = `${kind}:${per}:${perKey(per, ctx.now)}`;
  let rows = (await ctx.store.query('rkp', { k1, order: '-n1', limit: 60 })).filter(r => r.doc.score > 0);
  if (fac) rows = rows.filter(r => r.doc.faction === p.faction);
  return rows.slice(0, 30).map(r => {
    const owner = r.id.slice(k1.length + 1);
    return kind === 'p' ? { ...r.doc, id: owner, me: owner === String(ctx.pid) } : { ...r.doc, id: owner, mine: owner === p.clan };
  });
}

export const RANK_WORLD = {
  async 'rank.period'(ctx, p, { kind, per, fac }) { return { top: await periodRows(ctx, p, { kind, per, fac: !!fac }) }; },
  async 'rank.info'(ctx, p) {
    const rk = rkOf(p);
    return { claims: await claimsOf(ctx, p), frames: [...rk.fr], sel: frameOf(p) };
  },
  async 'rank.claim'(ctx, p) { fail('closed', 'Sıralama ödülleri kaldırıldı.'); // 19 Kas (kullanıcı): sıralama ödülleri oyundan kalktı
    const claims = await claimsOf(ctx, p);
    if (!claims.length) fail('not-done', 'Alınacak sıralama ödülü yok.');
    const rk = rkOf(p), loot = [];
    for (const c of claims) {
      loot.push(...grantAll(p, c.give, { nt: 1 }));
      (c.kind === 'p' ? rk.pc : rk.cc)[c.per] = c.key;
      if (c.frame && !rk.fr.includes(c.frame)) rk.fr.push(c.frame);
    }
    return { loot, claims };
  },
  async 'rank.frame'(ctx, p, { id }) {
    const rk = rkOf(p);
    if (id !== null && !(typeof id === 'string' && rk.fr.includes(id))) fail('bad-frame', 'Bu çerçeve sende yok.');
    rk.sel = id;
    return { sel: id };
  },
};
