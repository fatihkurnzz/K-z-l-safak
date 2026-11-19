// Duyuru panosu ve Sorun / Teknik Destek kuralları (sunucu-otoriter). Oyuncu işlemleri world.js'teki WORLD tablosuna,
// yönetici işlemleri sunucudaki /api/admin/* ucuna (adminDestek) bağlanır. Yönetici = ADMIN_TOKEN sahibi (server/app.js).
// Belgeler:
//   news/<kimlik>     { title, body, at, edited? }                         k1 'n', n1 zaman (yönetici yazar, herkes okur)
//   nseen/<oyuncu>    { at }                                               duyuruları en son okuduğu an
//   tkt/<kimlik>      { by, byName, cat, subject, status, msgs: [{ f: 'p'|'a', t, at }], at, upd, pu, au }
//                     k1 'p:<oyuncu>', n1 son güncelleme. pu: oyuncunun okumadığı yanıt var · au: yöneticinin okumadığı mesaj var
//   tka/<kimlik>      { by, byName, cat, subject, status, upd, n }         yönetici kuyruğu: k1 durum (tkt ile aynı yazmada güncellenir)
import { fail, used } from './util.js';
import { cleanChat } from './chatfilter.js';
import { NEWS, SUPPORT } from './destekdata.js';

const ID_RE = /^[0-9a-z]{9,24}$/;
const CTRL = /[\u0000-\u0008\u000b-\u001f\u007f]/g;
const put = (ctx, coll, id, doc, ver, idx = {}) => ctx.ops.push({ t: 'put', coll, id, doc, ver, ...idx });
const stamp = (rand, at) => at.toString(36).padStart(9, '0') + Array.from({ length: 2 }, () => Math.floor(rand() * 46656).toString(36).padStart(3, '0')).join('');
// Düz metin: denetim karakterleri atılır, uçlar kırpılır (çok satırlı alanda satır sonları korunur)
const clean = (v, max, name, multi = false) => {
  if (typeof v !== 'string') fail('bad-text', `${name} yazılmalı.`);
  const s = v.replace(CTRL, ' ').replace(/\r\n?/g, '\n').replace(multi ? /[ \t]+/g : /\s+/g, ' ').trim();
  if (!s) fail('bad-text', `${name} boş olamaz.`);
  if (s.length > max) fail('bad-text', `${name} en çok ${max} karakter olabilir.`);
  return s;
};
const tid = id => { if (typeof id !== 'string' || !ID_RE.test(id)) fail('no-ticket', 'Talep bulunamadı.'); return id; };
const newsView = r => ({ id: r.id, title: r.doc.title, body: r.doc.body, at: r.doc.at, ...(r.doc.edited ? { edited: r.doc.edited } : {}) });
const brief = (id, d) => ({ id, cat: d.cat, subject: d.subject, status: d.status, upd: d.upd, at: d.at, unread: !!d.pu, n: d.msgs.length });
const queueDoc = d => ({ by: d.by, byName: d.byName, cat: d.cat, subject: d.subject, status: d.status, upd: d.upd, n: d.msgs.length });
// Talep yazılırken kuyruk kaydı da aynı atomik yazmayla güncellenir
function saveTicket(ctx, id, d, ver) {
  put(ctx, 'tkt', id, d, ver, { k1: 'p:' + d.by, n1: d.upd });
  put(ctx, 'tka', id, queueDoc(d), undefined, { k1: d.status, n1: d.upd });
}
async function mine(ctx, id) {
  const r = await ctx.store.get('tkt', tid(id));
  if (!r || String(r.doc.by) !== String(ctx.pid)) fail('no-ticket', 'Talep bulunamadı.');
  return r;
}
async function unreadNews(ctx) {
  const [seen, rows] = await Promise.all([ctx.store.get('nseen', String(ctx.pid)), ctx.store.query('news', { k1: 'n', order: '-n1', limit: NEWS.keep })]);
  const at = seen?.doc.at || 0;
  return { rows, at, unread: rows.filter(r => r.doc.at > at).length };
}

export const SUPPORT_WORLD = {
  // Duyurular: son NEWS.keep duyuru (yeniden eskiye) ve okunmamış sayısı
  async 'news.list'(ctx) {
    const u = await unreadNews(ctx);
    return { items: u.rows.map(newsView), unread: u.unread, seen: u.at };
  },
  // Hepsini okundu işaretler
  async 'news.read'(ctx) {
    const r = await ctx.store.get('nseen', String(ctx.pid));
    put(ctx, 'nseen', String(ctx.pid), { at: ctx.now }, r ? r.ver : null);
    return {};
  },
  // Ana ekrandaki noktalar: okunmamış duyuru sayısı, yanıtı okunmamış talep sayısı
  async 'support.badge'(ctx) {
    const u = await unreadNews(ctx), t = await ctx.store.query('tkt', { k1: 'p:' + ctx.pid, order: '-n1', limit: 50 });
    return { news: u.unread, tickets: t.filter(r => r.doc.pu).length };
  },
  async 'ticket.list'(ctx) {
    const rows = await ctx.store.query('tkt', { k1: 'p:' + ctx.pid, order: '-n1', limit: 50 });
    return { tickets: rows.map(r => brief(r.id, r.doc)), open: rows.filter(r => r.doc.status !== 'closed').length };
  },
  // Konuşma dizisi; açılınca yanıt "okundu" olur
  async 'ticket.get'(ctx, p, { id }) {
    const r = await mine(ctx, id), d = r.doc;
    if (d.pu) put(ctx, 'tkt', r.id, { ...d, pu: false }, r.ver, { k1: 'p:' + d.by, n1: d.upd });
    return { ticket: { ...brief(r.id, { ...d, pu: false }), msgs: d.msgs } };
  },
  async 'ticket.open'(ctx, p, { cat, subject, text }) {
    if (typeof cat !== 'string' || !Object.hasOwn(SUPPORT.cats, cat)) fail('bad-cat', 'Bir konu seç.');
    const subj = cleanChat(clean(subject, SUPPORT.subject, 'Başlık')).text, msg = cleanChat(clean(text, SUPPORT.text, 'Mesaj', true)).text;
    if (ctx.now - (p.tkAt || 0) < SUPPORT.gapMs) fail('ticket-fast', 'Çok hızlı. Biraz bekle.');
    if (used(p, 'tkN') >= SUPPORT.perDay) fail('daily-limit', 'Bugün çok sayıda talep açtın. Yarın tekrar dene.');
    const all = await ctx.store.query('tkt', { k1: 'p:' + ctx.pid, order: '-n1', limit: 50 });
    if (all.filter(r => r.doc.status !== 'closed').length >= SUPPORT.maxOpen) fail('too-many', `En çok ${SUPPORT.maxOpen} açık talebin olabilir. Önce birini kapat.`);
    const id = stamp(ctx.rand, ctx.now), d = { by: String(ctx.pid), byName: p.name, cat, subject: subj, status: 'open', msgs: [{ f: 'p', t: msg, at: ctx.now }], at: ctx.now, upd: ctx.now, pu: false, au: true };
    saveTicket(ctx, id, d, null);
    p.tkAt = ctx.now; p.daily.tkN = used(p, 'tkN') + 1;
    return { id };
  },
  // Oyuncunun ek mesajı: talep yeniden "açık" olur; kapalı talebe yazılamaz
  async 'ticket.say'(ctx, p, { id, text }) {
    const r = await mine(ctx, id), d = { ...r.doc };
    if (d.status === 'closed') fail('ticket-closed', 'Bu talep kapandı. Yeni bir talep aç.');
    if (d.msgs.length >= SUPPORT.msgs) fail('ticket-full', 'Bu talepte mesaj sınırı doldu. Yeni bir talep aç.');
    const msg = cleanChat(clean(text, SUPPORT.text, 'Mesaj', true)).text;
    if (ctx.now - (p.tkAt || 0) < SUPPORT.gapMs) fail('ticket-fast', 'Çok hızlı. Biraz bekle.');
    d.msgs = [...d.msgs, { f: 'p', t: msg, at: ctx.now }]; d.status = 'open'; d.upd = ctx.now; d.au = true;
    saveTicket(ctx, r.id, d, r.ver);
    p.tkAt = ctx.now;
    return {};
  },
  async 'ticket.close'(ctx, p, { id }) {
    const r = await mine(ctx, id), d = { ...r.doc };
    if (d.status !== 'closed') { d.status = 'closed'; d.upd = ctx.now; d.pu = false; saveTicket(ctx, r.id, d, r.ver); }
    return {};
  },
};
export const SUPPORT_READ_ONLY = ['news.list', 'news.read', 'support.badge', 'ticket.list', 'ticket.get'];

// ---------- Yönetici ----------
// Uç: /api/admin/<yol>. Yetki denetimi server/app.js'tedir (ADMIN_TOKEN). Eşzamanlı yazma çakışırsa birkaç kez yeniden denenir.
export async function adminDestek(store, path, body, env) {
  const ok = (b, log) => ({ status: 200, body: { ok: true, ...b }, ...(log ? { log } : {}) });
  const lim = Math.max(1, Math.min(100, Number.isInteger(body.limit) ? body.limit : 50));
  const retry = async fn => { for (let i = 0; i < 4; i++) { const out = await fn(); if (out) return out; } return fail('conflict', 'Eşzamanlı işlem. Tekrar dene.'); };
  if (path === 'news.list') return ok({ items: (await store.query('news', { k1: 'n', order: '-n1', limit: lim })).map(newsView) });
  if (path === 'news.post') {
    const doc = { title: clean(body.title, NEWS.title, 'Başlık'), body: clean(body.body, NEWS.body, 'Metin', true), at: env.now };
    const id = stamp(env.rand, env.now);
    await retry(() => store.commit([{ t: 'put', coll: 'news', id, doc, ver: null, k1: 'n', n1: doc.at }]));
    return ok({ id }, ['news.post', id, doc.title]);
  }
  if (path === 'news.edit' || path === 'news.del') {
    const id = tid(body.id);
    return retry(async () => {
      const r = await store.get('news', id);
      if (!r) return { status: 404, body: { ok: false, code: 'no-news', message: 'Duyuru bulunamadı.' } };
      if (path === 'news.del') return (await store.commit([{ t: 'del', coll: 'news', id, ver: r.ver }])) && ok({}, ['news.del', id]);
      const doc = { ...r.doc, title: clean(body.title, NEWS.title, 'Başlık'), body: clean(body.body, NEWS.body, 'Metin', true), edited: env.now };
      return (await store.commit([{ t: 'put', coll: 'news', id, doc, ver: r.ver, k1: 'n', n1: r.doc.at }])) && ok({}, ['news.edit', id]);
    });
  }
  if (path === 'tickets') {
    const st = body.status === undefined ? 'open' : body.status;
    if (typeof st !== 'string' || !Object.hasOwn(SUPPORT.status, st)) fail('bad-status', 'Durum geçersiz.');
    const rows = await store.query('tka', { k1: st, order: '-n1', limit: lim });
    return ok({ tickets: rows.map(r => ({ id: r.id, ...r.doc })) });
  }
  if (path === 'ticket' || path === 'ticket.reply' || path === 'ticket.close') {
    const id = tid(body.id);
    return retry(async () => {
      const r = await store.get('tkt', id);
      if (!r) return { status: 404, body: { ok: false, code: 'no-ticket', message: 'Talep bulunamadı.' } };
      if (path === 'ticket') return ok({ ticket: { id, ...r.doc } });
      const d = { ...r.doc };
      if (path === 'ticket.reply') {
        d.msgs = [...d.msgs, { f: 'a', t: clean(body.text, SUPPORT.text, 'Yanıt', true), at: env.now }];
        d.status = body.close === true ? 'closed' : 'answered'; d.pu = true;
      } else d.status = 'closed';
      d.upd = env.now; d.au = false;
      const ops = [{ t: 'put', coll: 'tkt', id, doc: d, ver: r.ver, k1: 'p:' + d.by, n1: d.upd }, { t: 'put', coll: 'tka', id, doc: queueDoc(d), k1: d.status, n1: d.upd }];
      return (await store.commit(ops)) && ok({ status: d.status }, [path, id]);
    });
  }
  return null;
}
