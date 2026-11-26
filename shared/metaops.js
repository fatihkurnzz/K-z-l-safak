// Kalıcılık katmanının kuralları: haftalık görevler, giriş takvimleri, unvan seçimi, öğretici, bildirim merkezi.
// İçerik ve saf hesaplar meta.js'tedir. Bu dosya üç şey verir:
//   META_HANDLERS  oyuncuya özel işlemler (game.js HANDLERS'a eklenir)
//   META_WORLD     paylaşılan belgeleri okuyan işlemler (world.js WORLD'e eklenir; ikisi de salt-okurdur)
//   afterAction    başarıyla biten her yazma işleminden sonra dispatch'in çağırdığı kanca: gerçek olaylardan başarım
//                  sayaçlarını işler, yeni kademeleri kazandırır, bildirim kayıtlarını üretir
import { fixLoadout } from './hero.js';
import { MASTERY, masteryOf, masteryOpen, heroMastery, masteryFree, masterySpent } from './mastery.js';
import { blessDrops } from './nufus.js'; // nüfus Bereketi: görev ödülünün akçesi
import { ENERGY, IDLE, BAG_LIMIT, dayKey, weekKey } from './content.js';
import { pickGear, tierForLevel } from './items.js';
import { fail, int, grantAll, count } from './util.js';
import { idleStock } from './calc.js';
import { farmStock } from './pvpcalc.js';
import { isBot } from './bots.js';
import { RANKS, HUNT_DIFF } from './clan.js';
import { realmFeed } from './realmops.js';
import { heroIds, mainId } from './roster.js';
import { UPKEEP } from './sinks.js';
import { PATH, pathOf } from './paths.js';
import {
  WEEKLY, WEEKLY_ALL, weeklyProgress, MONTHLY, MONTHLY_ALL, monthlyProgress, CAL7, CAL28, monthCycle, monthDay, cal7Ready, cal28Ready, calReady, dayStart, weekStart, DAY, HOUR,
  ACH, achOf, achTier, achHeld, TUT_STEPS, TUT_NEED, tutItem, TUT_GIFT, NOTIF_CATS, NOTIF_KIND, NOTIF_KEEP, hypeLine, energyFullAt, mineFullAt,
  ONLINE, onlineOf, onlineNext,
} from './meta.js';

const INBOX_MAX = 20, FEED_MAX = 40;
// Kayıttaki alanlar (biçim state.js DEFAULTS'ta; eski kayıtlar için eksik alt alanlar burada tamamlanır)
const achState = p => { const A = p.ach || (p.ach = {}); A.c ||= {}; A.t ||= {}; if (A.title === undefined) A.title = null; return A; };
const weekState = p => { const W = p.weekly; W.q ||= {}; W.done ||= {}; return W; };
const monthState = p => { const M = p.monthly; M.q ||= {}; M.done ||= {}; return M; };
const notifState = p => { const N = p.notif || (p.notif = {}); N.off ||= {}; N.list ||= []; if (!Number.isFinite(N.readAt)) N.readAt = 0; return N; };
const tutState = p => { const T = p.tut || (p.tut = { s: 0, end: 'old' }); T.f ||= {}; return T; };
const calState = p => { const K = p.cal || (p.cal = {}); K.n7 ||= { n: 0, day: 0 }; K.m ||= { c: 0, got: [] }; return K; };

// Takvim ödülündeki { t: 'gear', g } kaydını oyuncunun seviyesine uygun gerçek bir eşyaya çevirir
const resolveDrops = (p, drops, env) => drops.map(d => (d.t === 'gear' ? { t: 'item', b: pickGear(env.rand, tierForLevel(p.lvl)), g: d.g } : d));
const needBagFor = (p, drops) => { if (drops.some(d => d.t === 'gear') && p.items.length >= BAG_LIMIT) fail('bag-full', 'Çanta dolu. Bu ödülde eşya var; önce yer aç.'); };

// Öğretici bitince (ya da atlanınca) karakter en az TUT_LEVEL. seviyeye çıkar: temel saldırı + ilk iki temel yetenek açık olur
export const TUT_LEVEL = 3;
function tutLevel(p) { if (p.lvl < TUT_LEVEL) { p.lvl = TUT_LEVEL; p.xp = 0; for (const id of heroIds(p)) fixLoadout(p, id); } }

export const META_HANDLERS = {
  // ---- Ustalık (mastery.js): kahramanın ağacına puan ver / puanları geri al ----
  'mastery.up'(p, { hero, k }) {
    hero ??= mainId(p); const h = Object.hasOwn(p.heroes || {}, hero) ? p.heroes[hero] : null;
    if (!h || h.copy) fail('bad-hero', 'Böyle bir kahraman yok.');
    if (!masteryOpen(p)) fail('locked', `Ustalık ${MASTERY.unlock}. seviyede açılır.`);
    if (!Object.hasOwn(MASTERY.nodes, k)) fail('bad-node');
    const r = h.mst = { ...heroMastery(h) };
    if ((r[k] || 0) >= MASTERY.nodes[k].max) fail('max', 'Bu ustalık en yüksek kademede.');
    if (masteryFree(p, h) < 1) fail('no-points', 'Ustalık puanın yok. Savaş kazandıkça ustalık seviyen yükselir.');
    r[k] = (r[k] || 0) + 1; fixLoadout(p, hero); // usta yetenekleri ustalık puanıyla açılır
    return { hero, k, rank: r[k] };
  },
  'mastery.reset'(p, { hero }) {
    hero ??= mainId(p); const h = Object.hasOwn(p.heroes || {}, hero) ? p.heroes[hero] : null;
    if (!h || h.copy) fail('bad-hero', 'Böyle bir kahraman yok.');
    const spent = masterySpent(h); if (!spent) fail('empty', 'Geri alınacak ustalık puanı yok.');
    const cost = MASTERY.resetCost * masteryOf(p).lvl;
    if (p.akce < cost) fail('no-akce', `${cost} akçe gerekli.`);
    p.akce -= cost; h.mst = {}; fixLoadout(p, hero);
    return { hero, refunded: spent, cost };
  },
  // ---- Çevrimiçi ödülleri (meta.js: ONLINE) ----
  'online.tick'(p, _, env) {
    const o = p.online = onlineOf(p, env.now);
    if (o.at > 0) o.ms += Math.max(0, Math.min(ONLINE.gapMs, env.now - o.at));
    o.at = env.now;
    return { ms: o.ms, got: o.got };
  },
  'online.claim'(p, { i }, env) {
    const o = p.online = onlineOf(p, env.now), S = ONLINE.steps[i];
    if (!int(i, 0, ONLINE.steps.length - 1) || !S) fail('bad-step');
    if (o.got.includes(i)) fail('claimed', 'Bu sandığı bugün aldın.');
    if (i !== onlineNext(o)) fail('not-yet', 'Sandıklar sırayla açılır: önce bir öncekini al.');
    if (o.ms < S.min * 60000) fail('not-yet', `${S.min} dakika oyunda kalınca açılır.`);
    needBagFor(p, S.give);
    o.got.push(i); o.ms = 0; // sıralı: sıradaki sandığın sayacı şimdi başlar
    return { i, loot: grantAll(p, resolveDrops(p, S.give, env), { nt: 1 }) };
  },
  // ---- Haftalık görevler: günlüklerle aynı kural (tamamlanınca al, bir kez), hafta pazartesi 00:00'da yenilenir ----
  'weekly.claim'(p, { id }) {
    const q = WEEKLY.find(x => x.id === id) || fail('bad-quest'), W = weekState(p);
    if (W.done[q.id]) fail('claimed', 'Bu ödül alındı.');
    if (weeklyProgress(p, q) < q.need) fail('not-done', 'Görev henüz tamamlanmadı.');
    W.done[q.id] = true;
    return { loot: grantAll(p, blessDrops(p, [q.reward]), { nt: 1 }) };
  },
  'weekly.bonus'(p) {
    const W = weekState(p);
    if (W.done.all) fail('claimed', 'Bu ödül alındı.');
    if (!WEEKLY.every(q => W.done[q.id])) fail('not-done', `Önce ${WEEKLY.length} haftalık görevin ödülünü al.`);
    W.done.all = true;
    count(p, 'weeklyAll');
    return { loot: grantAll(p, blessDrops(p, WEEKLY_ALL), { nt: 1 }) };
  },

  // ---- Aylık görevler: haftalıkla aynı kural; ayın 1'i 00:00 UTC'de yenilenir ----
  'monthly.claim'(p, { id }) {
    const q = MONTHLY.find(x => x.id === id) || fail('bad-quest'), M = monthState(p);
    if (M.done[q.id]) fail('claimed', 'Bu ödül alındı.');
    if (monthlyProgress(p, q) < q.need) fail('not-done', 'Görev henüz tamamlanmadı.');
    M.done[q.id] = true;
    return { loot: grantAll(p, blessDrops(p, [q.reward]), { nt: 1 }) };
  },
  'monthly.bonus'(p) {
    const M = monthState(p);
    if (M.done.all) fail('claimed', 'Bu ödül alındı.');
    if (!MONTHLY.every(q => M.done[q.id])) fail('not-done', `Önce ${MONTHLY.length} aylık görevin ödülünü al.`);
    M.done.all = true;
    return { loot: grantAll(p, blessDrops(p, MONTHLY_ALL), { nt: 1 }) };
  },
  // Raporlar sekmesine bakıldı: okunmamış rozeti sıfırlanır
  'mail.seen'(p, _, env) { p.rseen = env.now; },

  // ---- Giriş takvimleri: günde bir ödül ----
  'cal.claim'(p, { k }, env) {
    const K = calState(p), today = dayKey(env.now);
    if (k === 'n7') {
      if (K.n7.n >= CAL7.length) fail('cal-done', 'Bu takvim tamamlandı.');
      if (!cal7Ready(p, env.now)) fail('claimed', 'Bugünkü ödül alındı. Yarın yine gel.');
      const drops = CAL7[K.n7.n];
      needBagFor(p, drops);
      K.n7.n++; K.n7.day = today; count(p, 'cal');
      return { k, day: K.n7.n, loot: grantAll(p, resolveDrops(p, drops, env), { nt: 1 }) };
    }
    if (k === 'm28') {
      const c = monthCycle(env.now), i = monthDay(env.now);
      if (K.m.c !== c) K.m = { c, got: [] }; // yeni döngü
      if (!cal28Ready(p, env.now)) fail('claimed', 'Bugünkü ödül alındı. Yarın yine gel.');
      needBagFor(p, CAL28[i]);
      K.m.got.push(i); count(p, 'cal');
      return { k, day: i + 1, loot: grantAll(p, resolveDrops(p, CAL28[i], env), { nt: 1 }) };
    }
    fail('bad-calendar');
  },

  // ---- Unvan: kazanılmış bir başarımın unvanı seçilir; id: null unvanı kaldırır ----
  'title.set'(p, { id = null }) {
    const A = achState(p);
    if (id === null) { A.title = null; return { title: null }; }
    const def = achOf(id);
    if (!def || achHeld(p, def.id) < 1) fail('title-locked', 'Bu unvan henüz kazanılmadı.');
    A.title = def.id;
    return { title: def.id };
  },

  // ---- Öğretici: adım adım ilerler; her adımın gerektirdiği gerçek ilerleme burada aranır ----
  'tut.next'(p, { s }) {
    const T = tutState(p);
    if (T.end) fail('tut-ended', 'Öğretici bitti.');
    if (!int(s, 1, TUT_STEPS.length) || s !== T.s + 1) fail('bad-step');
    const cur = TUT_STEPS[T.s], need = Object.hasOwn(TUT_NEED, cur) ? TUT_NEED[cur] : null;
    if (need && !need.ok(p)) fail('not-done', need.hint);
    const out = { s, done: false, loot: [] };
    T.s = s;
    if (s === TUT_STEPS.length) { T.end = 'done'; out.done = true; tutLevel(p); out.loot = grantAll(p, TUT_GIFT, { nt: 1 }); } // hediye: yalnızca bitirene, bir kez
    return out;
  },
  'tut.skip'(p) {
    const T = tutState(p);
    if (T.end) fail('tut-ended', 'Öğretici bitti.');
    T.end = 'skip'; tutLevel(p);
    return { loot: grantAll(p, [tutItem(p), ...TUT_GIFT], { nt: 1 }) }; // atlayan da hediyeyi alır (karakterin sınıfının miğferi)
  },

  // ---- Bildirim merkezi ----
  'notif.read'(p, _, env) { notifState(p).readAt = env.now; },
  // cat: NOTIF_CATS anahtarı (kategori) ya da 'device' (cihaz bildirimleri; izin istemciden istenir, tercih burada saklanır)
  'notif.set'(p, { cat, on }) {
    const N = notifState(p);
    if (typeof on !== 'boolean') fail('bad-setting');
    if (cat === 'device') { N.dev = on; return { cat, on }; }
    if (typeof cat !== 'string' || !Object.hasOwn(NOTIF_CATS, cat)) fail('bad-setting');
    if (on) delete N.off[cat]; else N.off[cat] = true;
    return { cat, on };
  },

  // ---- Yalnızca test sürümü ----
  'dev.tut'(p, _, env) { if (!env.dev) fail('forbidden'); p.tut = { s: 0, end: null, f: {}, sv: 2 }; }, // sv: öğretici adım listesinin sürümü (meta.js TUT_SV)
};

// ---------- Bildirim kayıtları ----------
// Oyuncunun kendi kaydından türeyenler (enerji, maden, çırak, hafta, takvim) her sorguda yeniden hesaplanır; kimlikleri
// olayın zamanından üretildiği için aynı olay hep aynı kayıttır. Başarımlar gelen kutusunda (p.notif.list) saklanır.
function ownEntries(p, now) {
  const N = notifState(p), out = [];
  if (p.energy >= ENERGY.max) { // doğal dolum anı: son yazmada hesaplanan (eta) ya da daha önce kaydedilen (efull)
    const at = N.eta && N.eta <= now ? N.eta : N.efull || 0;
    if (at) out.push({ id: `energy:${at}`, k: 'energy', at, text: `Enerji doldu (${ENERGY.max}/${ENERGY.max}).` });
  }
  const mf = mineFullAt(p);
  if (mf && now >= mf) out.push({ id: `mine:${p.mine.at}`, k: 'mine', at: mf, text: 'Maden deposu doldu; daha fazla cevher birikmiyor.' });
  const s = idleStock(p, now);
  if (s && s.ticks >= s.cap) out.push({ id: `idle:${p.idle.at}`, k: 'idle', at: p.idle.at + s.cap * IDLE.tickMs, text: 'Çırak deposu doldu; daha fazla kazanç birikmiyor.' });
  const fs = farmStock(p, now); // Nöbet (pvpops.js): tavana ulaşan uzun oto-farm
  if (fs && fs.ticks >= fs.cap) out.push({ id: `farm:${p.farm.at}`, k: 'farm', at: fs.fullAt, text: 'Nöbet deposu doldu; karakterin daha fazla kazanç biriktirmiyor.' });
  // Bakım (sinks.js): süresi dolan hizmet (kayıt, yenisi alınana dek durur)
  { const u = p.upkeep; if (u && Number.isFinite(u.until) && u.until <= now && UPKEEP.tiers[u.t]) out.push({ id: `upkeep:${u.until}`, k: 'upkeep', at: u.until, text: `${UPKEEP.tiers[u.t].name} bitti; eşya düşme oranı bonusu sona erdi.` }); }
  // Uzmanlık yolu (paths.js): seviye yolları açtıysa ve yolunu seçmemiş kahraman varsa (an: syncPath)
  if (N.ps?.at && p.lvl >= PATH.level) { const n = heroIds(p).filter(id => !pathOf(p.heroes[id])).length; if (n) out.push({ id: `path:${N.ps.at}`, k: 'path', at: N.ps.at, text: 'Uzmanlık yolları açıldı. Karakter → Yetenek’ten yolunu seç.' }); }
  const w = weekKey(now), ws = weekStart(w);
  if (p.createdAt < ws) out.push({ id: `week:${w}`, k: 'week', at: ws, text: 'Haftalık görevler ve kuşatma hakları yenilendi.' });
  // Yakut Kartı (pay.js): kart sürerken günün yakutu alınmadıysa
  { const d = dayKey(now), K = p.pay?.card; if (K && K.end > d && K.day !== d) out.push({ id: `card:${d}`, k: 'card', at: Math.max(dayStart(d), p.createdAt), text: 'Yakut Kartı’nın bugünkü yakutu alınabilir.' }); }
  if (calReady(p, now)) { const d = dayKey(now); out.push({ id: `cal:${d}`, k: 'cal', at: Math.max(dayStart(d), p.createdAt), text: 'Bugünkü takvim ödülü alınabilir.' }); }
  for (const e of N.list) {
    const A = e.k === 'ach' ? achOf(e.a) : null;
    if (A) out.push({ id: `ach:${e.a}:${e.n}`, k: 'ach', at: e.at, text: `${A.name}: ${A.text(A.tiers[e.n - 1])}.${e.n === 1 ? ` Unvan: ${A.title}.` : ''}` });
  }
  return out;
}
// Klan günlüğünü klan kuralları tutar (clanrules.js: d.log, yeniden eskiye { at, t, a, b, n }); bildirim merkezi onu okur,
// kendi kaydını tutmaz. Bağış ve sancak değişimi günlükte kalır ama bildirim olmaz (sık ve önemsiz).
const rankName = n => Object.values(RANKS).find(r => r.order === n)?.name || 'yeni bir';
const CLAN_TEXT = {
  create: l => `${l.a} klanı kurdu.`, join: l => `${l.a} klana katıldı.`, leave: l => `${l.a} klandan ayrıldı.`,
  kick: l => `${l.a} klandan çıkarıldı.`, rank: (l, me) => (l.a === me ? `Rütben değişti: artık ${rankName(l.n)} rütbesindesin.` : `${l.a} artık ${rankName(l.n)} rütbesinde.`),
  reis: (l, me) => (l.a === me ? `${l.b} reisliği sana devretti.` : `Reislik ${l.a} adlı üyeye devredildi.`), succ: (l, me) => (l.a === me ? 'Reislik sana geçti.' : `${l.a} yeni reis oldu.`),
  lvl: l => `Klan ${l.n}. seviyeye yükseldi.`, chest: l => `Oba Avı’nda ${l.n}. klan sandığı açıldı.`,
  quest: l => `Klan görevi tamamlandı: ${l.a}.`, hunt: l => `${l.a}, ${HUNT_DIFF[l.n]?.name || 'zorlu bir av'} başlattı.`,
};
// Olayı kimin yaptığı (kişi kendi yaptığını bildirim olarak görmez). Günlük ad taşır; kimlik taşımaz.
const CLAN_ACTOR = { create: 'a', join: 'a', leave: 'a', hunt: 'a', kick: 'b', rank: 'b', reis: 'b' };
// Bütün kaynaklar tek listede: kendi kayıtları + posta (satış dahil) + meydan saldırıları + klan günlüğü
async function feed(ctx, p, prune) {
  const now = ctx.now, me = String(ctx.pid), N = notifState(p), out = ownEntries(p, now);
  for (const r of await ctx.store.query('mail', { k1: me, order: '-n1', limit: 30 }))
    out.push({ id: `mail:${r.id}`, k: r.doc.listing ? 'sale' : r.doc.grant ? 'grant' : 'mail', at: r.doc.at, text: String(r.doc.text || '').slice(0, 120) }); // grant: hazineden ulufe (realmops.js)
  for (const r of await ctx.store.query('notif', { k1: me, order: '-n1', limit: 10 })) {
    const d = r.doc;
    if (now - d.at >= NOTIF_KEEP) { if (prune) ctx.ops.push({ t: 'del', coll: 'notif', id: r.id, ver: r.ver }); continue; }
    out.push({ id: `arena:${r.id}:${d.n}`, k: 'arena', at: d.at, text: `${d.by}${d.n > 1 ? ` ve ${d.n - 1} oyuncu daha` : ''} meydanda savunmana saldırdı. Son dövüş: ${d.win ? 'savunman düştü' : 'savunman tuttu'}.` });
  }
  // Arkadaşlık istekleri (social.js: 'friends' belgesinin gelen listesi) ve klan davetleri (clanrules.js: 'cinv')
  for (const x of (await ctx.store.get('friends', me))?.doc.in || [])
    if (x && Number.isFinite(x.at)) out.push({ id: `friend:${x.id}:${x.at}`, k: 'friend', at: x.at, text: `${x.name} sana arkadaşlık isteği gönderdi.` });
  if (!p.clan) for (const x of (await ctx.store.get('cinv', me))?.doc.list || [])
    if (x && Number.isFinite(x.at)) out.push({ id: `cinv:${x.clan}:${x.at}`, k: 'clan', at: x.at, text: `${x.by}, seni ${x.name} klanına davet etti.` });
  const C = p.clan ? await ctx.store.get('clan', p.clan) : null;
  for (const l of C?.doc.log || []) {
    if (!(l.at > (N.clanAt || 0)) || !Object.hasOwn(CLAN_TEXT, l.t) || (CLAN_ACTOR[l.t] && l[CLAN_ACTOR[l.t]] === p.name)) continue;
    out.push({ id: `clan:${l.at}:${l.t}:${l.n ?? ''}`, k: 'clan', at: l.at, text: CLAN_TEXT[l.t](l, p.name) });
  }
  for (const e of await realmFeed(ctx, p)) out.push(e); // yeni Başbuğ, ferman, bölge hâkimiyeti
  return out.filter(e => NOTIF_KIND[e.k].cat === 'market' || e.k === 'grant' || now - e.at < NOTIF_KEEP).sort((a, b) => b.at - a.at).slice(0, FEED_MAX).map(e => {
    const K = NOTIF_KIND[e.k], h = hypeLine(e.k, e.id, p.faction), muted = !!N.off[K.cat];
    return { id: e.id, k: e.k, cat: K.cat, go: K.go, at: e.at, title: h.text, cls: h.cls, text: e.text, muted, unread: !muted && e.at > N.readAt };
  });
}

export const META_WORLD = {
  // Ana üsteki zil: okunmamış sayısı ve (varsa) en yeni okunmamış kayıt
  async 'notif.peek'(ctx, p) {
    const list = await feed(ctx, p, false), fresh = list.filter(e => e.unread);
    return { unread: fresh.length, top: fresh[0] || null };
  },
  async 'notif.list'(ctx, p) {
    const list = await feed(ctx, p, true);
    return { list, unread: list.filter(e => e.unread).length, readAt: notifState(p).readAt };
  },
};
export const META_READ_ONLY = ['notif.peek', 'notif.list'];

// ---------- İşlem sonrası kanca ----------
const add = (c, k, n = 1) => { if (Number.isFinite(n) && n > 0) c[k] = (c[k] || 0) + Math.floor(n); };
// Yeni kazanılan başarım kademeleri: kayda işlenir, (ilk eşitleme dışında) gelen kutusuna bildirim düşer
function syncAch(p, now) {
  const A = achState(p), N = notifState(p), quiet = !A.init;
  for (const def of ACH) {
    const n = achTier(p, def), had = achHeld(p, def.id);
    if (n <= had) continue;
    A.t[def.id] = n;
    if (!quiet) N.list.push({ k: 'ach', a: def.id, n, at: now });
  }
  A.init = 1; // eski hesabın birikmiş kademeleri ilk eşitlemede sessizce tanınır
  if (N.list.length > INBOX_MAX) N.list.splice(0, N.list.length - INBOX_MAX);
}
// Enerjinin doğal dolum anı: doluyken beklenen an geçmişse kaydedilir; başka yolla dolduysa (seviye, kervan) bildirilmez
function syncEnergy(p, now) {
  const N = notifState(p);
  if (p.energy >= ENERGY.max) { if (N.eta && N.eta <= now) N.efull = N.eta; N.eta = 0; }
  else N.eta = energyFullAt(p);
}
// Uzmanlık yolu: parti yolların açıldığı seviyeye bu işlemde geldiyse an kaydedilir. İlk eşitleme sessizdir: güncellemeden
// önce 30. seviyeyi geçmiş hesap bildirim almaz (Yetenek sekmesindeki işaret yine görünür).
function syncPath(p, now) {
  const N = notifState(p), open = p.lvl >= PATH.level;
  if (!N.ps) N.ps = { open, at: 0 };
  else if (open && !N.ps.open) N.ps = { open: true, at: now };
}
// dispatch her başarılı yazma işleminden sonra çağırır (salt-okur işlemlerde çağrılmaz). ctx: { now, store, pid, ops, … }
export async function afterAction(ctx, p, action, result) {
  const t = action.type, A = achState(p), c = A.c, T = tutState(p), N = notifState(p), now = ctx.now;
  calState(p); weekState(p);
  // ---- Başarım sayaçları: sunucunun kendi sonucundan (result) okunur, istemcinin gönderdiği değerden değil ----
  if (t === 'anvil.upgrade') { if (result.ok && result.plus > (c.plus || 0)) c.plus = result.plus; }
  else if (t === 'anvil.reforge') add(c, 'reforge');
  else if (t === 'anvil.craft') add(c, 'craft', result.n);
  else if (t === 'mine.collect') add(c, 'ore', result.ore);
  else if (t === 'idle.collect') add(c, 'idle');
  else if (t === 'wheel.spin') add(c, 'wheel');
  else if (t === 'item.equip') add(c, 'equip'); // ana görev (anagorev.js)
  else if (t === 'quest.claim') add(c, 'qclaim');
  else if (t === 'market.buy') add(c, 'bought');
  else if (t === 'quest.bonus') count(p, 'dailyAll');
  else if (t === 'battle.finish') {
    const m = result.mode;
    if (m === 'seal' && result.win) add(c, 'seal');
    else if (m === 'live' && result.win) add(c, 'live');
    else if (m === 'clanboss') add(c, 'clanDmg', result.damage);
    else if (m === 'siege') add(c, 'siege', result.score);
    else if (m === 'banner') add(c, 'banner', result.points);
    // Meydanda saldırıya uğrayan gerçek oyuncuya haber: kişi başına günde tek belge (sayaçlı); yazma sürümsüzdür
    if ((m === 'arena' || m === 'live') && /^\d{1,15}$/.test(String(result.vs ?? '')) && !isBot(result.vs)) {
      const to = String(result.vs), id = `${to}:${dayKey(now)}`, old = await ctx.store.get('notif', id);
      ctx.ops.push({ t: 'put', coll: 'notif', id, doc: { to, k: 'arena', by: p.name, n: (old?.doc.n || 0) + 1, win: !!result.win, at: now }, k1: to, n1: now });
    }
  }
  if (p.arena.wins + p.arena.losses > 0 && p.arena.rating > (c.rating || 0)) c.rating = p.arena.rating;
  if (p.clan) { if (!c.clan) c.clan = 1; if (N.clan !== p.clan) { N.clan = p.clan; N.clanAt = now; } } // klan günlüğünde yalnızca katıldıktan sonrası gösterilir
  else if (N.clan) { N.clan = null; N.clanAt = 0; }
  // ---- Öğretici: adımların aradığı gerçek olaylar ----
  if (!T.end) {
    if (t === 'item.equip') T.f.eq = 1;
    else if (t === 'daily.gift' || t === 'quest.claim') T.f.q = 1;
  }
  syncAch(p, now);
  syncEnergy(p, now);
  syncPath(p, now);
}
