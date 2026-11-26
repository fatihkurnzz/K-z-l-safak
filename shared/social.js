// Sohbet denetimi ve arkadaşlık: susturma, spam ve yeni hesap sınırları, şikâyet, engel listesi, arkadaş istekleri.
// Oyuncu işlemleri world.js'teki WORLD tablosuna socialWorld(...) ile eklenir (aynı atomik yazma yolundan geçer).
// Belgeler:
//   mute/<oyuncu>     { until, by: 'auto' | 'spam' | 'admin', reason, n: otomatik ceza sayısı, at }
//   report/<hedef>:<şikâyetçi>:<gün>  { by, byName, target, targetName, reason, note, msg, counts, at }   (k1 hedef, n1 zaman)
//   blk/<oyuncu>      { ids }   engel listesinin paylaşılan kopyası (özel mesaj ve istek gönderen taraf bunu okur)
//   friends/<oyuncu>  { f: arkadaşlar, in: gelen istekler, out: giden istekler }   her biri { id, name, faction, at }
//   seen/<oyuncu>     { at, name, faction, lvl }   son görülme (en çok MOD.seenMs'de bir yazılır)
// Oyuncu kaydında: p.social = { block: [{ id, name }], spam: { at, n, key, rep, repAt } }
import { dayKey } from './content.js';
import { GameError, fail, used } from './util.js';
import { isBot } from './bots.js';
import { cleanChat } from './chatfilter.js';
import { fmtTime } from './guard.js';
import { REPORT_REASONS, REPORT_NOTE_MAX } from './reasons.js';

const MIN = 60000, HOUR = 60 * MIN, DAY = 24 * HOUR;
export const MOD = {
  reasons: REPORT_REASONS, // şikâyet nedenleri (reasons.js: istemciyle ortak)
  report: { perDay: 10, note: REPORT_NOTE_MAX }, // oyuncu başına günlük şikâyet sayısı; açıklama uzunluğu
  // Otomatik susturma: `reporters` ayrı oyuncu `windowMs` içinde hedefin GERÇEK bir mesajını şikâyet ederse.
  // Yalnızca en az minLvl seviyesinde ve minAgeMs yaşındaki hesapların şikâyeti sayılır (yan hesapla toplu şikâyete karşı).
  // steps: art arda cezaların süresi; forgetMs: bu kadar süre ceza almayanın sayacı sıfırlanır
  auto: { reporters: 3, windowMs: 6 * HOUR, minLvl: 10, minAgeMs: DAY, steps: [30 * MIN, 3 * HOUR, DAY], forgetMs: 7 * DAY },
  // Spam: windowMs içinde max'tan fazla mesaj ya da sameWindowMs içinde aynı mesajın sameMax'ıncı kez yazılması → muteMs susturma
  spam: { windowMs: 30000, max: 10, sameMax: 3, sameWindowMs: 2 * MIN, muteMs: 10 * MIN },
  // Yeni hesap: seviyesi lvl'den düşük YA DA yaşı ageMs'den küçük hesap daha seyrek ve günde sınırlı yazar
  newbie: { lvl: 6, ageMs: 30 * MIN, gapMs: 8000, perDay: 40 },
  block: { max: 50 },
  friends: { max: 50, pending: 30, perDay: 20 }, // arkadaş sayısı, bekleyen (gelen ya da giden) istek, günlük gönderilen istek
  seenMs: 5 * MIN, onlineMs: 10 * MIN,          // son görülme yazma aralığı; "çevrimiçi" sayılma süresi
};

const ID_RE = /^(\d{1,15}|bot:\d+:\d+:\d+)$/;
const put = (ctx, coll, id, doc, ver, idx = {}) => ctx.ops.push({ t: 'put', coll, id, doc, ver, ...idx });
const socialOf = p => p.social || (p.social = { block: [], spam: null });
const target = (ctx, id) => { const sid = String(id ?? ''); if (!ID_RE.test(sid) || sid === String(ctx.pid)) fail('bad-target', 'Bu oyuncu seçilemez.'); return sid; };
const brief = (id, who, at) => ({ id, name: who.name, faction: who.faction, at });
export const isNewbie = (p, now) => p.lvl < MOD.newbie.lvl || now - p.createdAt < MOD.newbie.ageMs;
export const muteText = M => `Sohbetin ${fmtTime(M.until)} tarihine kadar kapatıldı${M.by === 'spam' ? ' (çok hızlı ya da yinelenen mesaj)' : M.by === 'auto' ? ' (oyuncu şikâyetleri)' : ''}.`;
const muteIdx = d => ({ k1: 'm', n1: d.until });
// Susturulan oyuncuya sohbette gösterilen bilgi: neden (sade kategori; yöneticinin iç notu gösterilmez) ve bitiş (sunucu saati)
export const MUTE_WHY = {
  spam: 'Çok hızlı ya da yinelenen mesaj yazdın.',
  auto: 'Mesajların başka oyuncular tarafından şikâyet edildi.',
  admin: 'Sohbet kurallarına aykırı mesaj nedeniyle yönetici kararıyla kapatıldı.',
};
export const muteView = M => ({ until: M.until, end: fmtTime(M.until), by: Object.hasOwn(MUTE_WHY, M.by) ? M.by : 'admin', why: Object.hasOwn(MUTE_WHY, M.by) ? MUTE_WHY[M.by] : MUTE_WHY.admin, message: muteText(M) });
// Oyuncunun süren susturması (yoksa null): sohbet listesi ve önizlemesiyle birlikte gönderilir
export async function muteOf(ctx) { const M = await ctx.store.get('mute', String(ctx.pid)); return M && M.doc.until > ctx.now ? muteView(M.doc) : null; }

// ---------- Engel listesi ----------
export const blockedIds = p => new Set((p.social?.block || []).map(b => b.id));
// Sohbet listesinden engellenen oyuncuların mesajlarını çıkarır (yerinde)
export function hideBlocked(p, msgs) {
  const B = blockedIds(p);
  if (B.size) for (let i = msgs.length - 1; i >= 0; i--) if (B.has(String(msgs[i].from))) msgs.splice(i, 1);
  return msgs;
}
export const visibleConvs = (p, convs) => { const B = blockedIds(p); return B.size ? convs.filter(c => !B.has(String(c.id))) : convs; };
const blocksMe = async (ctx, other) => { if (isBot(other)) return false; const r = await ctx.store.get('blk', other); return !!r && r.doc.ids.includes(String(ctx.pid)); };

// ---------- Mesaj gönderme kapısı (world.js chat.send çağırır) ----------
// Susturma, yeni hesap sınırı, engel ve spam denetimi; metni süzer. Dönen: { text, raw, muted? }.
// muted doluysa mesaj GÖNDERİLMEZ ama işlem başarılı sayılır (susturma belgesi ve sayaçlar yazılsın diye).
export async function chatGate(ctx, p, ch, to, text) {
  const S = socialOf(p), now = ctx.now, me = String(ctx.pid);
  const M = await ctx.store.get('mute', me);
  if (M && M.doc.until > now) { const e = new GameError('muted', muteText(M.doc)); e.info = { mute: muteView(M.doc) }; throw e; } // ret, nedeni ve bitişi taşır
  if (isNewbie(p, now)) {
    if (now - (p.chatAt || 0) < MOD.newbie.gapMs) fail('chat-fast', `Yeni hesaplar ${MOD.newbie.gapMs / 1000} saniyede bir mesaj yazabilir.`);
    if (used(p, 'chatN') >= MOD.newbie.perDay) fail('daily-limit', 'Yeni hesapların günlük mesaj sınırı doldu. Biraz oynayınca sınır kalkar.');
  }
  if (ch === 'p') {
    const other = String(to);
    if (blockedIds(p).has(other)) fail('you-blocked', 'Bu oyuncuyu engelledin. Mesaj atmak için önce engeli kaldır.');
    if (await blocksMe(ctx, other)) fail('blocked', 'Bu oyuncuya mesaj gönderemezsin.');
  }
  p.daily.chatN = used(p, 'chatN') + 1;
  const C = cleanChat(text), key = text.toLocaleLowerCase('tr-TR').replace(/[^\p{L}\p{N}]/gu, '');
  const old = S.spam || { at: 0, n: 0, key: '', rep: 0, repAt: 0 }, sp = now - old.at < MOD.spam.windowMs ? { ...old } : { ...old, at: now, n: 0 };
  sp.n++;
  if (key && key === old.key && now - old.repAt < MOD.spam.sameWindowMs) sp.rep = old.rep + 1; else { sp.key = key; sp.rep = 1; sp.repAt = now; }
  if (sp.n > MOD.spam.max || sp.rep >= MOD.spam.sameMax) {
    S.spam = null;
    const doc = { until: now + MOD.spam.muteMs, by: 'spam', reason: sp.rep >= MOD.spam.sameMax ? 'yinelenen mesaj' : 'mesaj seli', n: M?.doc.n || 0, at: M?.doc.at || 0 };
    put(ctx, 'mute', me, doc, M ? M.ver : null, muteIdx(doc));
    return { text: C.text, raw: C.raw, muted: muteView(doc) };
  }
  S.spam = sp;
  return { text: C.text, raw: C.raw };
}

// ---------- Son görülme (dispatch her yazan işlemde çağırır; en çok MOD.seenMs'de bir belge yazar) ----------
// look: arkadaş satırında gösterilen görünüm (world.js verir: fotoğraf, çerçeve, başarım unvanı, eşya seviyesi, klan sancağı)
export function touchSeen(p, pid, now, ops, look = {}) {
  if (now - (p.seenPub || 0) < MOD.seenMs && now >= (p.seenPub || 0)) return;
  p.seenPub = now;
  ops.push({ t: 'put', coll: 'seen', id: String(pid), doc: { at: now, name: p.name, faction: p.faction, lvl: p.lvl, ...look }, k1: p.faction, n1: now });
}

// ---------- Arkadaş belgesi ----------
async function loadF(ctx, id) { const r = await ctx.store.get('friends', id); return { id, ver: r ? r.ver : null, d: r ? r.doc : { f: [], in: [], out: [] } }; }
const saveF = (ctx, F) => put(ctx, 'friends', F.id, F.d, F.ver, { k1: F.id, n1: ctx.now });
const has = (list, id) => list.some(x => x.id === id);
const drop = (list, id) => { const i = list.findIndex(x => x.id === id); if (i >= 0) list.splice(i, 1); return i >= 0; };
// İki oyuncu arasındaki bağ (oyuncu kartı bunu gösterir)
export async function relOf(ctx, p, sid) {
  if (sid === String(ctx.pid)) return null;
  const F = (await loadF(ctx, String(ctx.pid))).d;
  return { friend: has(F.f, sid), out: has(F.out, sid), in: has(F.in, sid), blocked: blockedIds(p).has(sid) };
}
export async function pendingRequests(ctx) { return (await loadF(ctx, String(ctx.pid))).d.in.length; }

// h: world.js yardımcıları { chKey, whoIs, look }. look(id, seenDoc, now): arkadaş satırının görünümü { av, tier, ti, il, banner }
export function socialWorld(h) {
  const whoOr = async (ctx, sid) => (await h.whoIs(ctx, sid)) || fail('no-player', 'Oyuncu bulunamadı.');
  // Kabul: iki listeye de yazılır; istekler iki taraftan silinir
  function accept(ctx, mine, theirs, p, sid, who) {
    if (mine.d.f.length >= MOD.friends.max) fail('friends-full', `Arkadaş listen dolu (en çok ${MOD.friends.max}).`);
    if (theirs && theirs.d.f.length >= MOD.friends.max) fail('friends-full', 'Bu oyuncunun arkadaş listesi dolu.');
    drop(mine.d.in, sid); drop(mine.d.out, sid);
    mine.d.f.push(brief(sid, who, ctx.now)); saveF(ctx, mine);
    if (theirs) { const me = String(ctx.pid); drop(theirs.d.out, me); drop(theirs.d.in, me); if (!has(theirs.d.f, me)) theirs.d.f.push(brief(me, p, ctx.now)); saveF(ctx, theirs); }
  }
  return {
    // ---------- Şikâyet: bir oyuncu ya da (msg verilirse) o oyuncunun bir mesajı ----------
    async 'chat.report'(ctx, p, { id, reason, note, msg, ch, to }) {
      const sid = target(ctx, id), now = ctx.now, me = String(ctx.pid);
      if (typeof reason !== 'string' || !Object.hasOwn(MOD.reasons, reason)) fail('bad-reason', 'Şikâyet nedeni seç.');
      if (note !== undefined && note !== null && (typeof note !== 'string' || note.length > MOD.report.note)) fail('bad-text', `Açıklama en çok ${MOD.report.note} karakter olabilir.`);
      const who = await whoOr(ctx, sid);
      if (isBot(sid)) return { ok: true }; // yapay oyuncu: kayıt tutulmaz (denetlenecek hesap yok)
      if (used(p, 'reports') >= MOD.report.perDay) fail('daily-limit', 'Bugünkü şikâyet hakkın doldu.');
      const rid = `${sid}:${me}:${dayKey(now)}`;
      if (await ctx.store.get('report', rid)) fail('reported', 'Bu oyuncuyu bugün zaten şikâyet ettin.');
      let snap = null;
      if (msg !== undefined && msg !== null) { // mesaj, şikâyetçinin görebildiği bir kanalda ve gerçekten hedefe ait olmalı
        if (typeof msg !== 'string' || !/^[0-9a-z]{6,40}$/.test(msg)) fail('no-message', 'Mesaj bulunamadı.');
        const key = h.chKey(ctx, p, ch, to), row = (await ctx.store.query('chat', { k1: key, order: '-n1', limit: 100 })).find(r => r.id === msg && String(r.doc.from) === sid);
        if (!row) fail('no-message', 'Mesaj bulunamadı.');
        snap = { id: row.id, ch: key, text: row.doc.raw || row.doc.text, at: row.doc.at };
      }
      const counts = !!snap && p.lvl >= MOD.auto.minLvl && now - p.createdAt >= MOD.auto.minAgeMs;
      const doc = { by: ctx.pid, byName: p.name, target: sid, targetName: who.name, reason, note: (note || '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim(), msg: snap, counts, at: now };
      put(ctx, 'report', rid, doc, null, { k1: sid, n1: now, n2: counts ? 1 : 0 });
      p.daily.reports = used(p, 'reports') + 1;
      if (counts) { // yeterli sayıda ayrı oyuncu şikâyet ettiyse geçici susturma (süre her seferinde uzar)
        const M = await ctx.store.get('mute', sid), since = Math.max(now - MOD.auto.windowMs, M?.doc.at || 0);
        const rows = await ctx.store.query('report', { k1: sid, n1min: since + 1, order: '-n1', limit: 100 });
        const who2 = new Set(rows.filter(r => r.doc.counts).map(r => String(r.doc.by))); who2.add(me);
        if (who2.size >= MOD.auto.reporters && !(M && M.doc.until > now)) {
          const n = M && now - M.doc.at < MOD.auto.forgetMs ? M.doc.n : 0;
          const mute = { until: now + MOD.auto.steps[Math.min(n, MOD.auto.steps.length - 1)], by: 'auto', reason: `${who2.size} şikâyet`, n: n + 1, at: now };
          put(ctx, 'mute', sid, mute, M ? M.ver : null, muteIdx(mute));
        }
      }
      return { ok: true };
    },

    // ---------- Engel listesi ----------
    async 'social.block'(ctx, p, { id }) {
      const sid = target(ctx, id), S = socialOf(p), me = String(ctx.pid);
      if (has(S.block, sid)) return { blocked: true };
      const who = await whoOr(ctx, sid);
      if (S.block.length >= MOD.block.max) fail('block-full', `Engel listen dolu (en çok ${MOD.block.max}).`);
      S.block.push({ id: sid, name: who.name });
      put(ctx, 'blk', me, { ids: S.block.map(b => b.id) }, undefined, { k1: me, n1: ctx.now });
      // engellenen kişiyle arkadaşlık ve bekleyen istekler iki taraftan silinir
      const mine = await loadF(ctx, me);
      if ([drop(mine.d.f, sid), drop(mine.d.in, sid), drop(mine.d.out, sid)].some(Boolean)) {
        saveF(ctx, mine);
        if (!isBot(sid)) { const theirs = await loadF(ctx, sid); if ([drop(theirs.d.f, me), drop(theirs.d.in, me), drop(theirs.d.out, me)].some(Boolean)) saveF(ctx, theirs); }
      }
      return { blocked: true };
    },
    async 'social.unblock'(ctx, p, { id }) {
      const sid = String(id ?? ''), S = socialOf(p), me = String(ctx.pid);
      if (!drop(S.block, sid)) fail('not-blocked', 'Bu oyuncu engel listende değil.');
      put(ctx, 'blk', me, { ids: S.block.map(b => b.id) }, undefined, { k1: me, n1: ctx.now });
      return { blocked: false };
    },

    // ---------- Arkadaşlar ----------
    async 'friend.list'(ctx, p) {
      const F = (await loadF(ctx, String(ctx.pid))).d, now = ctx.now;
      const friends = await Promise.all(F.f.map(async x => {
        if (isBot(x.id)) { // yapay oyuncu: kimlikten ve saatten türeyen görünüm
          const seed = +x.id.split(':')[1] || 0, on = (seed + Math.floor(now / (20 * MIN))) % 3 === 0;
          return { id: x.id, name: x.name, faction: x.faction, lvl: +x.id.split(':')[2] || null, seen: on ? now : now - (1 + seed % 47) * HOUR, online: on, ...h.look(x.id, null, now) };
        }
        const s = await ctx.store.get('seen', x.id), at = s ? s.doc.at : null;
        return { id: x.id, name: s?.doc.name || x.name, faction: x.faction, lvl: s?.doc.lvl ?? null, seen: at, online: at !== null && now - at < MOD.onlineMs, ...h.look(x.id, s?.doc || null, now) };
      }));
      friends.sort((a, b) => (b.seen || 0) - (a.seen || 0));
      return { friends, in: F.in, out: F.out, max: MOD.friends.max, pending: MOD.friends.pending, blocked: socialOf(p).block };
    },
    async 'friend.add'(ctx, p, { id }) {
      const sid = target(ctx, id), me = String(ctx.pid), who = await whoOr(ctx, sid), mine = await loadF(ctx, me);
      if (has(mine.d.f, sid)) fail('already-friend', 'Zaten arkadaşsınız.');
      if (has(mine.d.out, sid)) fail('already-asked', 'İstek zaten gönderildi.');
      if (blockedIds(p).has(sid)) fail('you-blocked', 'Bu oyuncuyu engelledin. Önce engeli kaldır.');
      if (await blocksMe(ctx, sid)) fail('blocked', 'Bu oyuncuya istek gönderilemez.');
      if (isBot(sid)) { accept(ctx, mine, null, p, sid, who); return { friend: true }; } // yapay oyuncu hemen kabul eder
      const theirs = await loadF(ctx, sid);
      if (has(mine.d.in, sid)) { accept(ctx, mine, theirs, p, sid, who); return { friend: true }; } // karşı taraf zaten istemiş
      if (mine.d.f.length >= MOD.friends.max) fail('friends-full', `Arkadaş listen dolu (en çok ${MOD.friends.max}).`);
      if (used(p, 'freq') >= MOD.friends.perDay) fail('daily-limit', 'Bugünkü arkadaşlık isteği hakkın doldu.');
      if (mine.d.out.length >= MOD.friends.pending) fail('pending-full', 'Yanıt bekleyen çok isteğin var. Bir kısmını geri çek.');
      if (theirs.d.in.length >= MOD.friends.pending) fail('pending-full', 'Bu oyuncunun bekleyen isteği çok fazla.');
      p.daily.freq = used(p, 'freq') + 1;
      mine.d.out.push(brief(sid, who, ctx.now)); theirs.d.in.push(brief(me, p, ctx.now));
      saveF(ctx, mine); saveF(ctx, theirs);
      return { sent: true };
    },
    async 'friend.accept'(ctx, p, { id }) {
      const sid = String(id ?? ''), mine = await loadF(ctx, String(ctx.pid)), req = mine.d.in.find(x => x.id === sid);
      if (!req) fail('no-request', 'Bu istek artık yok.');
      accept(ctx, mine, await loadF(ctx, sid), p, sid, req);
      return { friend: true };
    },
    // decline: gelen isteği reddet · cancel: giden isteği geri çek · remove: arkadaşlıktan çıkar (hepsi iki tarafa yazar)
    async 'friend.decline'(ctx, p, { id }) { return unlink(ctx, id, 'in', 'out', 'no-request', 'Bu istek artık yok.'); },
    async 'friend.cancel'(ctx, p, { id }) { return unlink(ctx, id, 'out', 'in', 'no-request', 'Bu istek artık yok.'); },
    async 'friend.remove'(ctx, p, { id }) { return unlink(ctx, id, 'f', 'f', 'not-friend', 'Bu oyuncu arkadaş listende değil.'); },
  };
}
async function unlink(ctx, id, mineKey, theirKey, code, message) {
  const sid = String(id ?? ''), me = String(ctx.pid), mine = await loadF(ctx, me);
  if (!drop(mine.d[mineKey], sid)) fail(code, message);
  saveF(ctx, mine);
  if (!isBot(sid) && ID_RE.test(sid)) { const theirs = await loadF(ctx, sid); if (drop(theirs.d[theirKey], me)) saveF(ctx, theirs); }
  return { ok: true };
}
export const SOCIAL_READ_ONLY = ['friend.list'];

// ---------- Yönetim (server/app.js: /api/admin/<yol>) ----------
// reports: şikâyetler · mutes: süren susturmalar · mute / unmute: elle susturma. Dönen: { status, body, log? } ya da null.
export async function adminSocial(store, path, body, env) {
  const lim = Math.max(1, Math.min(200, Number.isInteger(body.limit) ? body.limit : 50)), id = body.id;
  const needId = () => { if (!Number.isSafeInteger(id) || id < 1) fail('bad-id', 'Oyuncu kimliği (id) gerekli.'); };
  if (path === 'reports') {
    const rows = await store.query('report', { ...(Number.isSafeInteger(body.player) ? { k1: String(body.player) } : {}), order: '-n1', limit: lim });
    return { status: 200, body: { ok: true, reports: rows.map(r => ({ id: r.id, ...r.doc, reasonText: MOD.reasons[r.doc.reason] })) } };
  }
  if (path === 'mutes') {
    const rows = await store.query('mute', { k1: 'm', n1min: env.now, order: '-n1', limit: lim });
    return { status: 200, body: { ok: true, mutes: rows.map(r => ({ id: Number(r.id), ...r.doc })) } };
  }
  if (path === 'mute' || path === 'unmute') {
    needId();
    const rec = await store.byId(id);
    if (!rec) return { status: 404, body: { ok: false, code: 'no-player', message: 'Oyuncu bulunamadı.' } };
    const mins = path === 'unmute' ? 0 : typeof body.hours === 'number' && body.hours > 0 ? body.hours * 60 : body.minutes;
    if (path === 'mute' && !(typeof mins === 'number' && mins > 0 && mins <= 60 * 24 * 365)) fail('bad-mute', 'Süre (hours ya da minutes) gerekli.');
    for (let i = 0; i < 4; i++) {
      const M = await store.get('mute', String(id));
      const doc = path === 'mute' ? { until: env.now + Math.round(mins * MIN), by: 'admin', reason: String(body.reason ?? '').slice(0, 160), n: M?.doc.n || 0, at: M?.doc.at || 0 }
        : { ...(M?.doc || { by: 'admin', reason: '', n: 0, at: 0 }), until: 0, ...(body.reset === true ? { n: 0 } : {}) };
      if (await store.commit([{ t: 'put', coll: 'mute', id: String(id), doc, ver: M ? M.ver : null, ...muteIdx(doc) }])) return { status: 200, body: { ok: true, name: rec.state.name, mute: doc }, log: [path, id, body.reason ?? ''] };
    }
    fail('conflict', 'Eşzamanlı işlem. Tekrar dene.');
  }
  return null;
}
