// Klan kuralları (world.js'in clan.* işlemleri): seviye, rütbe ve yetkiler, başvuru ve davet, bağış, klan görevleri,
// Oba Dükkânı, sancak, Oba Avı (canlı sandık kademeleri, günlük hasar sıralaması, gün dönümünde postayla ödül).
// Yetkilidir ve istemciye sunulmaz; tablolar shared/clan.js içindedir (arayüz de onları okur).
//
// Klan belgesi (coll 'clan'): { name, faction, leader, created, lvl, xp, open, notice, banner:{a,s,c},
//   members:[{ id, name, lvl, power, dmg, rank, joined, seen, don, bot? }], apps:[{ id, name, lvl, power, at }], inv:[{ id, at }],
//   day, dmg, hunt:{ diff, by }, last:{ day, dmg, tier, top:[{ id, name, dmg }] }, siege:{ week, score },
//   q:{ day, d:{ hunts, wins, don }, dd:{}, week, w:{ dmg, siege, don }, wd:{} }, log:[{ at, t, a, b, n }] }
// Oyuncu kaydındaki karşılığı: clan (kimlik), clanName, clanTag:{ lvl, b: sancak, r: rütbe }, clanApps:[kimlik], nisan,
//   hunt:{ day, clan, diff }, csync:{ day, win }, daily.cdon / daily.cq / daily.clanChest, weekly.cq / weekly.cshop
//
// Üyelik iki yerde durur (klan belgesi ve oyuncu kaydı) ve bir işlem yalnızca KENDİ oyuncusunun kaydını yazabilir.
// Bu yüzden doğrunun kaynağı klan belgesidir: başkasının yaptığı değişiklik (başvurunun onaylanması, klandan çıkarılma,
// seviye ya da sancak değişimi) oyuncunun kaydına bir sonraki girişinde (ping) ya da klan ekranını açınca işlenir.
import { rankIdx } from './rutbe.js';
import { UNLOCK, CLAN, dayKey, weekKey } from './content.js';
import { CLAN_LEVELS, CLAN_MAX_LEVEL, CLAN_XP, NISAN, CLAN_DONATE, RANKS, rankOf, can, SUCCESSION_DAYS, CLAN_QUESTS, CLAN_SHOP, HUNT_DIFF, HUNT_CHESTS, donateCap,
  huntRankReward, BANNER_PAIRS, CAPE_COLORS, EMBLEMS, validBanner, defaultBanner, clanCap, joinedToday, capeOf, HQ_FAC, HQ_KEYS, hqCap, hqLvl, hqCost, hqNorm, hqTime, hqTick } from './clan.js';
import { partyPower, itemLevel } from './hero.js';
import { fail, int, pay, grantAll, busy, used } from './util.js';
import { validName } from './state.js';
import { botName, botBrief, botClanName, isBot } from './bots.js';
import { nameKey } from './memstore.js';
import { rng } from './rng.js';
import { touchClan } from './rankper.js';
import { hasProfanity, cleanChat, mailText } from './chatfilter.js';

const HOUR = 3600000, DAY = 24 * HOUR;
const LOG_KEEP = 30, APPS_MAX = 20, INV_MAX = 20, INV_DAYS = 3, MY_APPS = 3, MY_INV = 5, NOTICE_MAX = 400, POWER_MAX = 99999999;
// Duyuru / tanıtım metni: en çok 6 satır, NOTICE_MAX karakter; sohbetle aynı süzgeç (küfür yıldızlanır, bağlantı ve numara ayıklanır)
function cleanNote(v, what) {
  if (typeof v !== 'string') fail('bad-text', `${what} metin olmalı.`);
  const text = v.replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, ' ').split('\n').map(l => l.replace(/\s+/g, ' ').trim()).filter(Boolean).slice(0, 6).join('\n');
  if (text.length > NOTICE_MAX) fail('bad-text', `${what} en çok ${NOTICE_MAX} karakter olabilir.`);
  return text.split('\n').map(l => cleanChat(l).text).join('\n');
}
const fmt = n => Math.round(n).toLocaleString('tr-TR');
const sid = v => String(v);
const same = (a, b) => sid(a) === sid(b);
// İstemciden gelen üye/oyuncu kimliği: gerçek oyuncu (tam sayı) ya da yapay üye ('b3', 'bot:tohum:seviye:kalite')
const idOk = v => (Number.isSafeInteger(v) && v > 0) || (typeof v === 'string' && /^(\d{1,15}|b\d{1,4}|bot:\d{1,10}:\d{1,3}:\d{1,3})$/.test(v));
// İstemciden gelen klan kimliği: kurulan klanlar 16 onaltılık hane, yapay klanlar 'bot-taraf-sıra'
const cidOk = v => typeof v === 'string' && /^[a-z0-9-]{1,32}$/.test(v);
const realId = v => (Number.isSafeInteger(v) && v > 0 ? v : typeof v === 'string' && /^\d{1,15}$/.test(v) ? Number(v) : null);

export const clanPower = d => d.members.reduce((a, m) => a + (m.power || m.lvl * 85), 0);
export const clanIdx = d => ({ k1: d.faction, n1: clanPower(d), n2: d.siege.score });
export const chestTier = d => CLAN.tiers.filter(t => d.dmg >= t).length;
const freshQ = now => ({ day: dayKey(now), d: { hunts: 0, wins: 0, don: 0 }, dd: {}, week: weekKey(now), w: { dmg: 0, siege: 0, don: 0 }, wd: {} });
const log = (d, now, t, extra = {}) => { d.log.unshift({ at: now, t, ...extra }); d.log.length = Math.min(d.log.length, LOG_KEEP); };
const realMembers = d => d.members.filter(m => !m.bot);
const byRank = (a, b) => RANKS[rankOf(b)].order - RANKS[rankOf(a)].order || (a.joined || 0) - (b.joined || 0);

// Eski (seviyesiz, rütbesiz) klan belgesini bugünkü biçime tamamlar
export function normClan(d, now) {
  d.lvl = int(d.lvl, 1, CLAN_MAX_LEVEL) ? d.lvl : 1; d.xp = d.xp > 0 ? d.xp : 0;
  if (d.open === undefined) d.open = true;
  if (typeof d.notice !== 'string') d.notice = '';
  if (typeof d.promo !== 'string') d.promo = ''; // tanıtım: herkese açık
  if (!int(d.minPower, 0, POWER_MAX)) d.minPower = 0; // başvuru için en düşük parti gücü
  if (!validBanner(d.banner)) d.banner = defaultBanner(d.name);
  d.apps ||= []; d.inv ||= []; d.log ||= []; d.hunt ||= { diff: 0, by: null };
  d.siege ||= { week: weekKey(now), score: 0 };
  if (!d.q) d.q = freshQ(now);
  hqNorm(d); // Karargâh: hazine ve tesisler
  const done = hqTick(d, now); // süresi dolan tesis yükseltmesi
  if (done) log(d, done.end, 'fac', { a: HQ_FAC[done.id].name, n: done.to, b: done.by || '' });
  for (const m of d.members) {
    if (!Object.hasOwn(RANKS, m.rank)) m.rank = same(m.id, d.leader) ? 'reis' : 'uye';
    m.joined ??= d.created || now; m.seen ??= now; m.don ||= 0; m.dmg ||= 0;
  }
  return d;
}
function addXp(d, n, now) {
  d.xp += n;
  while (d.lvl < CLAN_MAX_LEVEL && d.xp >= CLAN_LEVELS[d.lvl - 1].xp) { d.xp -= CLAN_LEVELS[d.lvl - 1].xp; d.lvl++; log(d, now, 'lvl', { n: d.lvl }); }
}
// Sayaçlar değiştikten sonra: hedefi dolan görev tamamlanır, klan deneyimi bir kez yazılır
function checkQuests(d, now) {
  for (const Q of CLAN_QUESTS) {
    const done = Q.per === 'day' ? d.q.dd : d.q.wd, have = (Q.per === 'day' ? d.q.d : d.q.w)[Q.key] || 0;
    if (!done[Q.id] && have >= Q.need) { done[Q.id] = 1; addXp(d, Q.xp, now); log(d, now, 'quest', { a: Q.name }); }
  }
}
// il: eşya seviyesi (hero.js) · ti: seçili başarım unvanı (meta.js). Üye satırında gösterilir; girişte ve klan ekranında tazelenir.
const lookOf = p => ({ il: itemLevel(p), ti: p.ach?.title || null, rk: rankIdx(p) });
const newMember = (ctx, p, rank = 'uye') => ({ id: ctx.pid, name: p.name, lvl: p.lvl, power: partyPower(p), ...lookOf(p), dmg: 0, rank, joined: ctx.now, seen: ctx.now, don: 0 });
function clearClan(p) { p.clan = null; p.clanName = null; p.clanTag = null; p.hunt = null; p.pend.clan = 0; p.pend.siege = 0; p.pend.hisar = 0; }
// Oyuncu kaydındaki klan özeti: pelerin (seviye + sancak), rütbe ve bugünkü av kademesi buradan okunur
function tagPlayer(p, C, me) {
  const d = C.doc;
  p.clan = C.id; p.clanName = d.name;
  p.clanTag = { lvl: d.lvl, b: { ...d.banner }, r: rankOf(me), f: { ...hqNorm(d).fac } }; // f: karargâh tesis seviyeleri (talim, demirhane, ambar, gozcu bonusları buradan okunur)
  p.hunt = { day: d.day, clan: C.id, diff: d.hunt.diff || 0 };
}
const winsToday = p => p.daily.q.win || 0;
const winsDelta = (p, now) => Math.max(0, winsToday(p) - (p.csync && p.csync.day === dayKey(now) ? p.csync.win : 0));
// Reislik sırası: en yüksek rütbe, eşitlikte en eski üye (yalnızca gerçek ve son 14 günde giriş yapmış üyeler)
function successor(d, now, except) {
  return realMembers(d).filter(m => !same(m.id, except) && now - (m.seen || 0) < SUCCESSION_DAYS * DAY).sort(byRank)[0] || null;
}
// Karargâh ekranının verisi (clan.view içinde): hazine, tesis seviyeleri, yükseltme bedeli ve yetki
const hqView = (d, me) => { const hq = hqNorm(d); return { tre: hq.tre, tot: hq.tot || 0, fac: { ...hq.fac }, up: hq.up ? { ...hq.up } : null, cap: hqCap(d.lvl), can: can(rankOf(me), 'hq') }; };
function makeLeader(d, m) {
  for (const x of d.members) if (x.rank === 'reis') x.rank = 'uye';
  m.rank = 'reis'; d.leader = m.id;
}

export function clanHandlers(H) {
  const { put, del, mail, need, nid } = H;
  const saveClan = (ctx, C) => put(ctx, 'clan', C.id, C.doc, C.ver, clanIdx(C.doc));
  // Meydandaki savunma kaydı oyuncunun kahramanlarını pelerinleriyle saklar (rakipler onu görür). Pelerin değişince
  // (klana giriş/çıkış, sancak, klan seviyesi) kayıt da güncellenir; oyuncunun meydan kaydı yoksa hiçbir şey yazılmaz.
  const capeSig = p => JSON.stringify((p.clan && capeOf(p.clanTag)) || null);
  async function syncCape(ctx, p, before) {
    if (capeSig(p) === before) return;
    const cape = p.clan ? capeOf(p.clanTag) : null, dress = units => units.map(u => { const { cape: _, ...rest } = u; return cape ? { ...rest, cape } : rest; });
    const op = ctx.ops.find(o => o.t === 'put' && o.coll === 'arena' && o.id === sid(ctx.pid)); // aynı işlemde zaten yazılıyorsa o kayıt düzeltilir
    if (op) { op.doc.units = dress(op.doc.units); return; }
    const A = await ctx.store.get('arena', sid(ctx.pid));
    if (!A || !Array.isArray(A.doc.units)) return;
    put(ctx, 'arena', A.id, { ...A.doc, units: dress(A.doc.units) }, undefined, { k1: A.doc.faction, n1: A.doc.rating });
  }

  // ---- Gün ve hafta dönümü: sıralama ödülü, sayaçların sıfırlanması, reislik devri ----
  async function roll(ctx, C) {
    const d = C.doc, today = dayKey(ctx.now), week = weekKey(ctx.now);
    if (d.day !== today) {
      // Biten günün Oba Avı sıralaması: hasar yazmış üyeler sıraya dizilir, gerçek üyelere ödül postayla gider.
      // Posta kimliği gün + oyuncudan türer: aynı oyuncuya aynı gün için ikinci bir ödül yazılamaz.
      const dealers = d.members.filter(m => m.dmg > 0).sort((a, b) => b.dmg - a.dmg);
      if (d.day && dealers.length) {
        for (const [i, m] of dealers.entries()) {
          const R = huntRankReward(i + 1, dealers.length), id = `hunt-${d.day}-${m.id}`;
          if (m.bot || !R || await ctx.store.get('mail', id)) continue;
          put(ctx, 'mail', id, { to: m.id, text: `Oba Avı sıralaması: ${d.name} klanında ${i + 1}. oldun (${fmt(m.dmg)} hasar).`, give: [...R.give, { t: 'nisan', n: R.nisan }], at: ctx.now }, null, { k1: sid(m.id), n1: ctx.now });
        }
        d.last = { day: d.day, dmg: d.dmg, tier: chestTier(d), top: dealers.slice(0, 10).map(m => ({ id: m.id, name: m.name, dmg: m.dmg })) };
      }
      d.day = today; d.dmg = 0; d.hunt = { diff: 0, by: null };
      for (const m of d.members) m.dmg = 0;
      d.q.day = today; d.q.d = { hunts: 0, wins: 0, don: 0 }; d.q.dd = {};
    }
    if (d.q.week !== week) { d.q.week = week; d.q.w = { dmg: 0, siege: 0, don: 0 }; d.q.wd = {}; }
    if (d.siege.week !== week) d.siege = { week, score: 0 };
    d.inv = d.inv.filter(x => ctx.now - x.at < INV_DAYS * DAY);
    // Reis 14 gündür girmiyorsa (ya da üyeler arasında yoksa) reislik sıradaki etkin üyeye geçer. Yapay reise dokunulmaz.
    const L = d.members.find(m => same(m.id, d.leader));
    if (!L || (!L.bot && ctx.now - (L.seen || 0) >= SUCCESSION_DAYS * DAY)) {
      const next = successor(d, ctx.now, d.leader);
      if (next) { makeLeader(d, next); log(d, ctx.now, 'succ', { a: next.name, b: L ? L.name : null }); }
    }
  }
  // Oyuncunun bekleyen katkısını klana yazar: av hasarı, kuşatma puanı, kazandığı savaşlar. Sandık kademesi değişirse günlüğe düşer.
  function flush(ctx, p, C, me) {
    const d = C.doc, today = dayKey(ctx.now), t0 = chestTier(d);
    if (p.pend.clan > 0) {
      const n = p.pend.clan;
      me.dmg += n; d.dmg += n; d.q.d.hunts++; d.q.w.dmg += n; p.pend.clan = 0;
      addXp(d, CLAN_XP.hunt, ctx.now); p.nisan += NISAN.hunt;
      const t1 = chestTier(d);
      if (t1 > t0) log(d, ctx.now, 'chest', { a: p.name, n: t1 });
    }
    if (p.pend.siege > 0) {
      const n = p.pend.siege;
      d.siege.score += n; d.q.w.siege += n; p.pend.siege = 0;
      addXp(d, CLAN_XP.siege, ctx.now); p.nisan += NISAN.siege;
    }
    if (p.pend.hisar > 0) { // kuşatma penceresinde toplanan hisar puanı (hisarops.js haftanın hisar sahibini buna göre seçer)
      const w = p.pend.hw;
      if (!d.hisar || d.hisar.week !== w) d.hisar = { week: w, score: 0 };
      d.hisar.score += p.pend.hisar; me.hs = (me.hw === w ? me.hs || 0 : 0) + p.pend.hisar; me.hw = w; p.pend.hisar = 0;
    }
    const dw = winsDelta(p, ctx.now);
    if (dw) { d.q.d.wins += dw; addXp(d, dw * CLAN_XP.win, ctx.now); }
    p.csync = { day: today, win: winsToday(p) };
    checkQuests(d, ctx.now);
  }
  // Oyuncunun klanını yükler; üyelik belgede yoksa (çıkarılmış, klan dağılmış) kayıt temizlenir ve null döner.
  // Dönen C değişmiş olabilir: çağıran saveClan ile yazar.
  async function mine(ctx, p) {
    const C = p.clan ? await ctx.store.get('clan', p.clan) : null, cape0 = capeSig(p);
    const me = C && normClan(C.doc, ctx.now).members.find(m => same(m.id, ctx.pid));
    if (!me) { if (p.clan) { clearClan(p); H.pub(ctx, p); await syncCape(ctx, p, cape0); } return null; }
    C.before = JSON.stringify(C.doc);
    if (dayKey(me.seen) !== dayKey(ctx.now)) me.seen = ctx.now; // son giriş günü (reislik devri buna bakar; önce yazılır ki giren üye aday olsun)
    await roll(ctx, C);
    Object.assign(me, { name: p.name, lvl: p.lvl, power: partyPower(p), ...lookOf(p) });
    flush(ctx, p, C, me);
    tagPlayer(p, C, me);
    await syncCape(ctx, p, cape0);
    return { C, d: C.doc, me };
  }
  const mustMine = async (ctx, p) => (await mine(ctx, p)) || fail('no-clan', 'Bir klanda değilsin.');
  const saveIfChanged = (ctx, C) => { if (JSON.stringify(C.doc) !== C.before) saveClan(ctx, C); };
  const allow = (me, perm) => { if (!can(rankOf(me), perm)) fail('no-perm', 'Rütben bu işlem için yeterli değil.'); };
  const target = (d, id) => (idOk(id) && d.members.find(m => same(m.id, id))) || fail('no-member', 'Bu üye klanda değil.');
  const below = (me, m) => { if (RANKS[rankOf(m)].order >= RANKS[rankOf(me)].order) fail('no-perm', 'Yalnızca kendinden düşük rütbedeki üyelere uygulanır.'); };

  // Davet dizini (oyuncu başına bir belge): hangi klanlar davet etti
  async function invIndex(ctx, pid) { const r = await ctx.store.get('cinv', sid(pid)); return { ver: r ? r.ver : null, list: (r ? r.doc.list : []).filter(x => ctx.now - x.at < INV_DAYS * DAY) }; }
  const saveInv = (ctx, pid, idx) => put(ctx, 'cinv', sid(pid), { list: idx.list }, idx.ver, { k1: sid(pid), n1: ctx.now });
  // Bekleyen başvuruları çözer: onaylanmışsa klana yerleşir, reddedilmişse listeden düşer; ikinci bir klan da onaylamışsa oradan çıkar
  async function resolveApps(ctx, p) {
    if (!p.clanApps?.length) return;
    const keep = [], cape0 = capeSig(p);
    for (const id of p.clanApps) {
      const C = await ctx.store.get('clan', id);
      if (!C) continue;
      const d = normClan(C.doc, ctx.now), me = d.members.find(m => same(m.id, ctx.pid));
      if (me && !p.clan) { tagPlayer(p, C, me); p.csync = { day: dayKey(ctx.now), win: winsToday(p) }; continue; }
      if (me && p.clan !== C.id) { d.members = d.members.filter(m => m !== me); saveClan(ctx, C); continue; }
      if (!me && !p.clan && d.apps.some(a => same(a.id, ctx.pid))) keep.push(id);
    }
    p.clanApps = keep;
    await syncCape(ctx, p, cape0);
    if (p.clan && keep.length) await withdrawApps(ctx, p);
  }
  async function withdrawApps(ctx, p) {
    for (const id of p.clanApps || []) {
      const C = await ctx.store.get('clan', id);
      if (C && (C.doc.apps || []).some(a => same(a.id, ctx.pid))) { normClan(C.doc, ctx.now).apps = C.doc.apps.filter(a => !same(a.id, ctx.pid)); saveClan(ctx, C); }
    }
    p.clanApps = [];
  }
  const brief = (id, d) => ({ id, name: d.name, faction: d.faction, lvl: d.lvl || 1, banner: validBanner(d.banner) ? d.banner : defaultBanner(d.name), members: d.members.length, max: clanCap(d.lvl || 1, d.hq?.fac), open: d.open !== false, minPower: d.minPower || 0 });
  function seat(ctx, p, C) {
    const d = C.doc, me = newMember(ctx, p);
    d.members.push(me);
    d.apps = d.apps.filter(a => !same(a.id, ctx.pid)); d.inv = d.inv.filter(x => !same(x.id, ctx.pid));
    log(d, ctx.now, 'join', { a: p.name });
    tagPlayer(p, C, me); p.csync = { day: dayKey(ctx.now), win: winsToday(p) };
    return me;
  }
  // Yapay klan: üyeleri kimliği olan yapay oyunculardır (kartları açılır, sohbette yazarlar, unvan taşıyabilirler)
  const BOT_PROMO = {
    ocak: ['Yeni kan arıyoruz. Örse yeni çekiç, sefere yeni yiğit. Her güce kapımız açık.', 'Kuşatmada ön safta, Akın’da her gün. Haftada en az üç sefer şart.', 'Ocağın en sıcak yeri. Yalnızca güçlüler: Başbuğ seçiminde tek ses.'],
    sancak: ['Acemi de usta da gelsin. Birlikte büyür, birlikte kazanırız.', 'Düzenli sefer, düzenli bağış. Kuşatma günü herkes çevrimiçi.', 'Ovanın seçkinleri. Sıralamada ilk üçe oynuyoruz; başvurunu bekliyoruz.'],
  };
  function botClanDoc(ctx, f, i) {
    const r = rng(900 + i + (f === 'ocak' ? 0 : 50)), members = [];
    for (let s = 20000 + i * 1000 + (f === 'ocak' ? 0 : 500); members.length < 8 + i * 5; s++) {
      const b = botBrief(s);
      if (b.faction !== f) continue;
      const lvl = 20 + Math.floor(r() * 50);
      members.push({ id: `bot:${s}:${lvl}:50`, name: b.name, lvl, bot: true, dmg: 0 });
    }
    const name = botClanName(r);
    members.forEach((m, k) => { m.rank = k === 0 ? 'reis' : k < 3 ? 'yardimci' : k < 6 ? 'kidemli' : 'uye'; });
    // Tanıtım ve başvuru şartı: ilk klan yeni oyuncuya açık, sonrakiler güç ister (sıralamadaki klan sayfasında görünür)
    const promo = (f === 'ocak' ? BOT_PROMO.ocak : BOT_PROMO.sancak)[i % 3], minPower = [0, 1500, 4000][i] ?? 4000;
    return normClan({ name, faction: f, leader: members[0].id, members, day: 0, dmg: 0, siege: { week: 0, score: 0 }, created: ctx.now, lvl: 3 + i * 3, promo, minPower, open: i < 2 }, ctx.now);
  }
  async function botClans(ctx, f, rows) {
    for (let i = 0; i < 3; i++) {
      const id = `bot-${f}-${i}`;
      if (rows.some(r => r.id === id) || ctx.ops.some(o => o.coll === 'clan' && o.id === id) || await ctx.store.get('clan', id)) continue;
      const doc = botClanDoc(ctx, f, i);
      put(ctx, 'clan', id, doc, null, clanIdx(doc));
      rows.push({ id, doc });
    }
  }

  const HANDLERS = {
    // ---- Klansız oyuncunun ekranı: taraftaki klanlar, gelen davetler, bekleyen başvurular ----
    async 'clan.search'(ctx, p) {
      need(p, 'clan');
      await resolveApps(ctx, p);
      const rows = await ctx.store.query('clan', { k1: p.faction, order: '-n1', limit: 20 });
      if (ctx.bots && rows.length < 3) await botClans(ctx, p.faction, rows);
      const inv = await invIndex(ctx, ctx.pid), invites = [];
      for (const x of inv.list) {
        const C = rows.find(r => r.id === x.clan) || await ctx.store.get('clan', x.clan);
        if (C && C.doc.faction === p.faction && (C.doc.inv || []).some(i => same(i.id, ctx.pid))) invites.push({ ...brief(C.id, C.doc), by: x.by });
      }
      return { clans: rows.map(r => ({ ...brief(r.id, r.doc), applied: (p.clanApps || []).includes(r.id) })), invites, apps: p.clanApps || [] };
    },
    async 'clan.create'(ctx, p, { name }) {
      need(p, 'clan'); busy(p);
      if (p.clan) fail('in-clan', 'Zaten bir klandasın.');
      if (!validName(name)) fail('bad-name', 'Klan adı 3-16 karakter olmalı.');
      if (hasProfanity(name)) fail('bad-name', 'Bu klan adı kullanılamaz.');
      const key = nameKey(name);
      if (await ctx.store.get('clanname', key)) fail('name-taken', 'Bu klan adı alınmış.');
      pay(p, 'akce', CLAN.cost, `Klan kurmak ${CLAN.cost} akçe.`);
      await withdrawApps(ctx, p);
      const id = nid(ctx), me = newMember(ctx, p, 'reis');
      put(ctx, 'clanname', key, { id }, null);
      const doc = normClan({ name: name.trim(), faction: p.faction, leader: ctx.pid, members: [me], day: dayKey(ctx.now), dmg: 0, siege: { week: weekKey(ctx.now), score: 0 }, created: ctx.now }, ctx.now);
      log(doc, ctx.now, 'create', { a: p.name });
      put(ctx, 'clan', id, doc, null, clanIdx(doc));
      tagPlayer(p, { id, doc }, me); p.csync = { day: dayKey(ctx.now), win: winsToday(p) };
      await syncCape(ctx, p, 'null');
      H.pub(ctx, p);
      return { id };
    },
    // Açık klana doğrudan, başvuruyla üye alan klana yalnızca davetliyse katılır
    async 'clan.join'(ctx, p, { id }) {
      need(p, 'clan'); busy(p);
      if (p.clan) fail('in-clan', 'Zaten bir klandasın.');
      const C = cidOk(id) ? await ctx.store.get('clan', id) : null;
      if (!C || C.doc.faction !== p.faction) fail('no-clan', 'Klan bulunamadı.');
      const d = normClan(C.doc, ctx.now);
      await roll(ctx, C);
      if (d.members.some(m => same(m.id, ctx.pid))) fail('in-clan', 'Zaten bu klandasın.');
      if (d.members.length >= clanCap(d.lvl, d.hq?.fac)) fail('clan-full', 'Klan dolu.');
      const invited = d.inv.some(x => same(x.id, ctx.pid));
      if (!d.open && !invited) fail('clan-closed', 'Bu klan başvuruyla üye alıyor.');
      if (!invited && partyPower(p) < (d.minPower || 0)) fail('low-power', `Bu klan en az ${fmt(d.minPower)} güç istiyor.`);
      seat(ctx, p, C); // istemcinin gönderdiği değer değil, belgenin kimliği yazılır
      saveClan(ctx, C);
      p.clanApps = (p.clanApps || []).filter(x => x !== C.id);
      await withdrawApps(ctx, p);
      if (invited) { const idx = await invIndex(ctx, ctx.pid); idx.list = idx.list.filter(x => x.clan !== C.id); saveInv(ctx, ctx.pid, idx); }
      await syncCape(ctx, p, 'null');
      H.pub(ctx, p);
    },
    async 'clan.apply'(ctx, p, { id }) {
      need(p, 'clan');
      if (p.clan) fail('in-clan', 'Zaten bir klandasın.');
      await resolveApps(ctx, p);
      if (p.clan) return { joined: true };
      const C = cidOk(id) ? await ctx.store.get('clan', id) : null;
      if (!C || C.doc.faction !== p.faction) fail('no-clan', 'Klan bulunamadı.');
      const d = normClan(C.doc, ctx.now);
      if (d.open) fail('clan-open', 'Bu klan açık: doğrudan katılabilirsin.');
      if (partyPower(p) < (d.minPower || 0)) fail('low-power', `Bu klan en az ${fmt(d.minPower)} güç istiyor.`);
      if (d.apps.some(a => same(a.id, ctx.pid))) fail('applied', 'Bu klana zaten başvurdun.');
      if (p.clanApps.length >= MY_APPS) fail('too-many', `Aynı anda en çok ${MY_APPS} klana başvurabilirsin.`);
      if (d.apps.length >= APPS_MAX) fail('apps-full', 'Bu klanın başvuru listesi dolu.');
      d.apps.push({ id: ctx.pid, name: p.name, lvl: p.lvl, power: partyPower(p), at: ctx.now });
      saveClan(ctx, C);
      p.clanApps.push(C.id);
    },
    async 'clan.unapply'(ctx, p, { id }) {
      if (!cidOk(id) || !(p.clanApps || []).includes(id)) fail('no-apply', 'Böyle bir başvurun yok.');
      const C = await ctx.store.get('clan', id);
      if (C && (C.doc.apps || []).some(a => same(a.id, ctx.pid))) { C.doc.apps = C.doc.apps.filter(a => !same(a.id, ctx.pid)); normClan(C.doc, ctx.now); saveClan(ctx, C); }
      p.clanApps = p.clanApps.filter(x => x !== id);
    },
    async 'clan.decline'(ctx, p, { id }) {
      const idx = await invIndex(ctx, ctx.pid);
      if (!cidOk(id) || !idx.list.some(x => x.clan === id)) fail('no-invite', 'Böyle bir davet yok.');
      idx.list = idx.list.filter(x => x.clan !== id); saveInv(ctx, ctx.pid, idx);
      const C = await ctx.store.get('clan', id);
      if (C && (C.doc.inv || []).some(x => same(x.id, ctx.pid))) { C.doc.inv = C.doc.inv.filter(x => !same(x.id, ctx.pid)); normClan(C.doc, ctx.now); saveClan(ctx, C); }
    },
    // 19 Kas: klan lideri bütün klana posta gönderir (günde 3)
    async 'clan.mail'(ctx, p, { text }) {
      const t = mailText(text, fail), M = await mine(ctx, p);
      if (!M) fail('no-clan', 'Bir klanda değilsin.');
      const { C } = M, d = C.doc;
      if (!same(d.leader, ctx.pid)) fail('not-leader', 'Klana posta yalnız klan lideri gönderebilir.');
      const day = dayKey(ctx.now); if (p.cmail?.d !== day) p.cmail = { d: day, n: 0 };
      if (p.cmail.n >= 3) fail('limit', 'Klana günde en çok 3 posta gönderebilirsin.');
      const to = realMembers(d).filter(x => !same(x.id, ctx.pid));
      for (const x of to) H.mail(ctx, Number.isFinite(+x.id) ? +x.id : x.id, t, [], { from: p.name, fid: String(ctx.pid), kind: 'clan', cname: d.name });
      p.cmail.n++; saveClan(ctx, C);
      return { sent: to.length };
    },
    async 'clan.leave'(ctx, p) {
      busy(p);
      const C = p.clan ? await ctx.store.get('clan', p.clan) : null, cape0 = capeSig(p);
      clearClan(p); H.pub(ctx, p);
      await syncCape(ctx, p, cape0);
      if (!C) return;
      const d = normClan(C.doc, ctx.now);
      await roll(ctx, C); // biten günün sıralama ödülü ayrılmadan önce yazılır
      const me = d.members.find(m => same(m.id, ctx.pid));
      if (!me) return;
      d.members = d.members.filter(m => m !== me);
      if (!realMembers(d).length) { del(ctx, 'clan', C.id, C.ver); if (await ctx.store.get('clanname', nameKey(d.name))) del(ctx, 'clanname', nameKey(d.name)); return; }
      if (same(d.leader, ctx.pid)) { const next = realMembers(d).sort(byRank)[0]; makeLeader(d, next); log(d, ctx.now, 'succ', { a: next.name, b: p.name }); }
      log(d, ctx.now, 'leave', { a: p.name });
      saveClan(ctx, C);
    },
    // ---- Klan Karargâhı: bütün sekmelerin verisi. Bekleyen katkıyı klana yazar, günü/haftayı çevirir ----
    async 'clan.view'(ctx, p) {
      await resolveApps(ctx, p);
      const had = !!p.clan, mineNow = await mine(ctx, p);
      if (!mineNow && had) return { gone: true }; // klandan çıkarılmış ya da klan dağılmış: kayıt temizlendi (hata fırlatılsa yazılmazdı)
      if (!mineNow) fail('no-clan', 'Bir klanda değilsin.');
      const { C, d, me } = mineNow, today = dayKey(ctx.now);
      const got = H.collect ? await H.collect(ctx, C) : 0; // hisar vergisinden klana düşen pay (hisarops.js)
      if (got > 0) { hqNorm(d).tre += got; log(d, ctx.now, 'tax', { n: got }); }
      if (ctx.bots) { // yapay üyeler: yeni klana zamanla katılır ya da başvurur, gün içinde ava hasar yazar
        const r = rng(today * 31 + d.members.length);
        if (same(d.leader, ctx.pid) && d.members.length < 8) {
          const b = { id: 'b' + (d.botN = (d.botN || d.members.length) + 1), name: botName(r), lvl: Math.max(5, p.lvl - 3 + Math.floor(r() * 6)) };
          if (d.open) d.members.push({ ...b, bot: true, dmg: 0, rank: 'uye', joined: ctx.now, seen: ctx.now, don: 0 });
          else if (d.apps.length < 2) d.apps.push({ ...b, power: b.lvl * 85, at: ctx.now });
        }
        const frac = ((ctx.now + 3 * HOUR) % DAY) / DAY, t0 = chestTier(d);
        for (const [i, m] of d.members.entries()) if (m.bot) { const want = Math.round((3000 + m.lvl * 900) * (0.6 + rng(today + i * 7)() * 0.8) * frac); if (want > (m.dmg || 0)) { d.dmg += want - (m.dmg || 0); d.q.w.dmg += want - (m.dmg || 0); if (!m.dmg) d.q.d.hunts++; m.dmg = want; } }
        if (chestTier(d) > t0) log(d, ctx.now, 'chest', { n: chestTier(d) });
        const want = Math.round(d.members.filter(m => m.bot).length * 180 * (((ctx.now / HOUR + 72) % 168) / 168));
        if (want > (d.siege.bot || 0)) { d.siege.score += want - (d.siege.bot || 0); d.q.w.siege += want - (d.siege.bot || 0); d.siege.bot = want; }
        checkQuests(d, ctx.now);
      }
      touchClan(ctx, C.id, d, clanPower(d), { lvl: d.lvl, banner: d.banner, members: d.members.length, max: clanCap(d.lvl, d.hq?.fac) }); // dönemlik klan sıralaması (rankper.js)
      saveIfChanged(ctx, C); // ekran açık kaldıkça yinelenen çağrılar (canlı av) değişiklik yoksa klan belgesini yazmaz
      H.pub(ctx, p);
      const L = CLAN_LEVELS[d.lvl - 1], fresh = joinedToday(me, ctx.now) && dayKey(d.created) !== today;
      return {
        clan: {
          id: C.id, name: d.name, faction: d.faction, leader: d.leader, lvl: d.lvl, xp: d.xp, need: L.xp, cap: clanCap(d.lvl, d.hq?.fac), hq: hqView(d, me), open: d.open, notice: d.notice, promo: d.promo, minPower: d.minPower, banner: d.banner,
          dmg: d.dmg, siege: d.siege.score,
          members: [...d.members].sort((a, b) => (b.dmg || 0) - (a.dmg || 0)).map(m => ({ id: m.id, name: m.name, lvl: m.lvl, power: m.power || m.lvl * 85, il: m.il ?? null, ti: m.ti || null, rk: m.rk || 0, dmg: m.dmg || 0, rank: rankOf(m), don: m.don || 0, seen: m.seen, joined: m.joined, bot: !!m.bot, me: same(m.id, ctx.pid) })),
          apps: can(rankOf(me), 'invite') ? d.apps : [], log: d.log,
        },
        me: { rank: rankOf(me), fresh },
        tier: chestTier(d), claimed: p.daily.clanChest || 0, bossUsed: used(p, 'clanboss'), siegeUsed: p.weekly.siege || 0,
        hunt: { diff: d.hunt.diff || 0, by: d.hunt.by, last: d.last || null },
        quests: CLAN_QUESTS.map(Q => ({ id: Q.id, have: Math.min(Q.need, (Q.per === 'day' ? d.q.d : d.q.w)[Q.key] || 0), done: !!(Q.per === 'day' ? d.q.dd : d.q.wd)[Q.id], claimed: !!(Q.per === 'day' ? p.daily.cq : p.weekly.cq)?.[Q.id] })),
      };
    },
    // Sıralamadan açılan klan sayfası (salt-okur): sancak, üyeler, tanıtım, seviye. Klansız bakan başvurabilir.
    async 'clan.page'(ctx, p, { id }) {
      const C = cidOk(id) ? await ctx.store.get('clan', id) : null;
      if (!C) fail('no-clan', 'Klan bulunamadı.');
      const d = normClan(C.doc, ctx.now), power = partyPower(p), b = brief(C.id, d);
      return {
        clan: { ...b, power: clanPower(d), promo: d.promo, minPower: d.minPower, leader: d.leader, mine: C.id === p.clan,
          members: [...d.members].sort(byRank).map(m => ({ name: m.name, lvl: m.lvl, power: m.power || m.lvl * 85, rank: rankOf(m) })) },
        me: { clanless: !p.clan, same: d.faction === p.faction, power, applied: (p.clanApps || []).includes(C.id) },
      };
    },
    // Sandık: klanın bugünkü toplam hasarına göre açılan kademeler; oyuncu başına günde bir kez (hangi klanda olursa olsun)
    async 'clan.claim'(ctx, p) {
      const { C, d, me } = await mustMine(ctx, p);
      saveIfChanged(ctx, C);
      if (joinedToday(me, ctx.now) && dayKey(d.created) !== dayKey(ctx.now) && !(me.dmg > 0)) fail('too-new', 'Klana bugün katıldın: sandık için bugün ava hasar yazmalısın ya da yarını beklemelisin.');
      const tier = chestTier(d), from = p.daily.clanChest || 0;
      if (tier <= from) fail('not-done', 'Açılacak yeni sandık yok.');
      p.daily.clanChest = tier;
      return { loot: grantAll(p, HUNT_CHESTS.slice(from, tier).flat(), { nt: 1 }), tier };
    },
    // ---- Başvuru ve davet ----
    async 'clan.accept'(ctx, p, { id }) {
      const { C, d, me } = await mustMine(ctx, p);
      allow(me, 'invite');
      const a = idOk(id) && d.apps.find(x => same(x.id, id));
      if (!a) fail('no-apply', 'Bu başvuru artık yok.');
      d.apps = d.apps.filter(x => x !== a);
      const rid = realId(a.id), rec = rid ? await ctx.store.byId(rid) : null;
      if (rid && (!rec || rec.state.clan)) { saveClan(ctx, C); return { gone: true }; } // başka klana girmiş ya da hesap yok: başvuru düşer
      if (d.members.length >= clanCap(d.lvl, d.hq?.fac)) fail('clan-full', 'Klan dolu.');
      d.members.push({ id: a.id, name: a.name, lvl: a.lvl, power: a.power, dmg: 0, rank: 'uye', joined: ctx.now, seen: ctx.now, don: 0, ...(rid ? {} : { bot: true }) });
      log(d, ctx.now, 'join', { a: a.name, b: p.name });
      if (rid) mail(ctx, rid, `${d.name} klanı başvurunu kabul etti. Klan Karargâhı'na uğra.`, []);
      saveClan(ctx, C);
    },
    async 'clan.reject'(ctx, p, { id }) {
      const { C, d, me } = await mustMine(ctx, p);
      allow(me, 'invite');
      if (!idOk(id) || !d.apps.some(x => same(x.id, id))) fail('no-apply', 'Bu başvuru artık yok.');
      d.apps = d.apps.filter(x => !same(x.id, id));
      saveClan(ctx, C);
    },
    async 'clan.invite'(ctx, p, { id }) {
      const { C, d, me } = await mustMine(ctx, p);
      allow(me, 'invite');
      const rid = realId(id);
      if (!rid || rid === ctx.pid) fail('bad-target', 'Bu oyuncu davet edilemez.');
      const rec = await ctx.store.byId(rid);
      if (!rec) fail('no-player', 'Oyuncu bulunamadı.');
      const t = rec.state;
      if (t.faction !== d.faction) fail('bad-target', 'Yalnızca kendi tarafından oyuncular davet edilebilir.');
      if (t.lvl < UNLOCK.clan) fail('bad-target', `Klanlar ${UNLOCK.clan}. seviyede açılır.`);
      if (t.clan) fail('in-clan', 'Bu oyuncu zaten bir klanda.');
      if (d.inv.some(x => same(x.id, rid))) fail('invited', 'Bu oyuncu zaten davetli.');
      if (d.inv.length >= INV_MAX) fail('inv-full', 'Bekleyen davet sınırı doldu.');
      d.inv.push({ id: rid, at: ctx.now });
      const idx = await invIndex(ctx, rid);
      idx.list = [{ clan: C.id, name: d.name, by: p.name, at: ctx.now }, ...idx.list.filter(x => x.clan !== C.id)].slice(0, MY_INV);
      saveInv(ctx, rid, idx);
      saveClan(ctx, C);
      return { name: t.name };
    },
    // ---- Rütbe işlemleri ----
    async 'clan.kick'(ctx, p, { id }) {
      const { C, d, me } = await mustMine(ctx, p);
      allow(me, 'kick');
      const m = target(d, id);
      if (m === me) fail('bad-target', 'Kendini çıkaramazsın; klandan ayrıl.');
      below(me, m);
      d.members = d.members.filter(x => x !== m);
      log(d, ctx.now, 'kick', { a: m.name, b: p.name });
      if (!m.bot) mail(ctx, m.id, `${d.name} klanından çıkarıldın.`, []);
      saveClan(ctx, C);
    },
    async 'clan.rank'(ctx, p, { id, rank }) {
      const { C, d, me } = await mustMine(ctx, p);
      allow(me, 'rank');
      if (typeof rank !== 'string' || !Object.hasOwn(RANKS, rank) || rank === 'reis') fail('bad-rank', 'Geçersiz rütbe.');
      const m = target(d, id);
      below(me, m);
      if (RANKS[rank].order >= RANKS[rankOf(me)].order) fail('no-perm', 'Kendi rütbenden düşük bir rütbe verebilirsin.');
      if (rankOf(m) === rank) fail('same-rank', 'Üye zaten bu rütbede.');
      if (d.members.filter(x => rankOf(x) === rank).length >= RANKS[rank].max) fail('rank-full', `En çok ${RANKS[rank].max} ${RANKS[rank].name} olabilir.`);
      m.rank = rank;
      log(d, ctx.now, 'rank', { a: m.name, b: p.name, n: RANKS[rank].order });
      saveClan(ctx, C);
    },
    async 'clan.transfer'(ctx, p, { id }) {
      const { C, d, me } = await mustMine(ctx, p);
      allow(me, 'transfer');
      const m = target(d, id);
      if (m === me) fail('bad-target', 'Reis zaten sensin.');
      if (m.bot) fail('bad-target', 'Reislik yalnızca gerçek bir üyeye devredilebilir.');
      makeLeader(d, m);
      const free = k => d.members.filter(x => rankOf(x) === k).length < RANKS[k].max;
      me.rank = free('yardimci') ? 'yardimci' : free('kidemli') ? 'kidemli' : 'uye';
      log(d, ctx.now, 'reis', { a: m.name, b: p.name });
      tagPlayer(p, C, me);
      saveClan(ctx, C);
    },
    async 'clan.settings'(ctx, p, { open, notice, promo, minPower }) {
      const { C, d, me } = await mustMine(ctx, p);
      allow(me, 'notice');
      if (open !== undefined) { if (typeof open !== 'boolean') fail('bad-setting'); d.open = open; }
      if (notice !== undefined) d.notice = cleanNote(notice, 'Klan içi duyuru');
      if (promo !== undefined) d.promo = cleanNote(promo, 'Tanıtım');
      if (minPower !== undefined) { if (!int(minPower, 0, POWER_MAX)) fail('bad-setting', 'Geçersiz en düşük güç.'); d.minPower = minPower; }
      saveClan(ctx, C);
    },
    // ---- Sancak: renk çifti + amblem + pelerin rengi (yalnızca Reis) ----
    async 'clan.banner'(ctx, p, { a, s, c }) {
      const { C, d, me } = await mustMine(ctx, p);
      allow(me, 'banner');
      const b = { a, s, c };
      if (!int(a, 0, BANNER_PAIRS.length - 1) || !int(c, 0, CAPE_COLORS.length - 1) || typeof s !== 'string' || !Object.hasOwn(EMBLEMS, s) || !validBanner(b)) fail('bad-banner', 'Geçersiz sancak seçimi.');
      const cape0 = capeSig(p);
      d.banner = b;
      log(d, ctx.now, 'banner', { a: p.name });
      tagPlayer(p, C, me);
      await syncCape(ctx, p, cape0);
      saveClan(ctx, C);
      H.pub(ctx, p);
    },
    // ---- Bağış: akçe klan deneyimine ve bağışçının Oba Nişanı'na döner; kişi başına günlük sınır ----
    async 'clan.donate'(ctx, p, { n }) {
      const { C, d, me } = await mustMine(ctx, p);
      if (!Number.isInteger(n) || !CLAN_DONATE.steps.includes(n)) fail('bad-amount', 'Geçersiz bağış tutarı.');
      const usedToday = p.daily.cdon || 0;
      const cap = donateCap(p.lvl);
      if (usedToday + n > cap) fail('daily-limit', `Günlük bağış sınırı ${fmt(cap)} akçe; bugün ${fmt(cap - usedToday)} akçe daha bağışlayabilirsin.`);
      pay(p, 'akce', n, 'Yeterli akçe yok.');
      p.daily.cdon = usedToday + n;
      const xp = Math.floor(n / CLAN_XP.donatePer), nisan = Math.floor(n / NISAN.donatePer), lvl0 = d.lvl;
      me.don += n; d.q.d.don += n; d.q.w.don += n; p.nisan += nisan;
      hqNorm(d).tre += n; d.hq.tot = (d.hq.tot || 0) + n; // klan hazinesi: bağışlanan akçe
      addXp(d, xp, ctx.now);
      log(d, ctx.now, 'don', { a: p.name, n });
      checkQuests(d, ctx.now);
      const cape0 = capeSig(p);
      tagPlayer(p, C, me);
      await syncCape(ctx, p, cape0); // seviye atlandıysa pelerin uzamış olabilir
      saveClan(ctx, C);
      return { xp, nisan, lvl: d.lvl, up: d.lvl > lvl0 };
    },
    // Karargâh tesisi yükseltme: hazineden; tesis seviyesi klan seviyesine bağlı hqCap ile sınırlı; yalnızca yetkili rütbe
    async 'clan.hqup'(ctx, p, { id }) {
      const { C, d, me } = await mustMine(ctx, p);
      allow(me, 'hq');
      if (typeof id !== 'string' || !HQ_KEYS.includes(id)) fail('bad-fac', 'Böyle bir tesis yok.');
      const hq = hqNorm(d), cur = hqLvl(hq.fac, id), to = cur + 1;
      if (hq.up) fail('hq-busy', `${HQ_FAC[hq.up.id].name} yükseltmesi sürüyor; bitince yenisi başlar.`);
      if (cur >= hqCap(d.lvl)) fail('hq-cap', cur >= 5 ? 'Bu tesis en yüksek seviyede.' : `Bu tesis için klan ${(cur + 1) * 2 - 1}. seviyeye ulaşmalı.`);
      const cost = hqCost(id, to);
      if (hq.tre < cost) fail('no-treasury', `Klan hazinesinde ${fmt(cost)} akçe yok.`);
      hq.tre -= cost; hq.up = { id, to, at: ctx.now, end: ctx.now + hqTime(to), by: p.name }; // süreli: bitince normClan işler
      log(d, ctx.now, 'facs', { a: HQ_FAC[id].name, n: to, b: p.name });
      saveClan(ctx, C);
      return { id, lvl: to, end: hq.up.end, tre: hq.tre };
    },
    // Klan görevinin kişisel ödülü: görev tamamlanmışsa her üye bir kez alır (günlük: günde bir, haftalık: haftada bir)
    async 'clan.quest'(ctx, p, { id }) {
      const { C, d, me } = await mustMine(ctx, p);
      saveIfChanged(ctx, C);
      const Q = typeof id === 'string' ? CLAN_QUESTS.find(q => q.id === id) : null;
      if (!Q) fail('bad-quest', 'Böyle bir görev yok.');
      if (!(Q.per === 'day' ? d.q.dd : d.q.wd)[Q.id]) fail('not-done', 'Görev henüz tamamlanmadı.');
      if (joinedToday(me, ctx.now) && dayKey(d.created) !== dayKey(ctx.now)) fail('too-new', 'Klana bugün katıldın: görev ödülleri yarından itibaren açılır.');
      const box = Q.per === 'day' ? p.daily : p.weekly;
      box.cq ||= {};
      if (box.cq[Q.id]) fail('claimed', 'Bu ödülü zaten aldın.');
      box.cq[Q.id] = 1;
      return { loot: grantAll(p, [...(Q.give || []), { t: 'nisan', n: Q.nisan }], { nt: 1 }) };
    },
    // ---- Oba Dükkânı: Oba Nişanı ile; raf klan seviyesiyle açılır, kişi başına haftalık sınır ----
    async 'clan.buy'(ctx, p, { id }) {
      const { C, d } = await mustMine(ctx, p);
      saveIfChanged(ctx, C);
      const it = typeof id === 'string' ? CLAN_SHOP.find(x => x.id === id) : null;
      if (!it) fail('bad-item', 'Böyle bir ürün yok.');
      if (d.lvl < it.lvl) fail('locked', `Bu raf klan ${it.lvl}. seviyede açılır.`);
      p.weekly.cshop ||= {};
      if ((p.weekly.cshop[it.id] || 0) >= it.max) fail('weekly-limit', 'Bu ürünün haftalık sınırına ulaştın.');
      pay(p, 'nisan', it.cost, `Yeterli ${NISAN.name} yok.`);
      p.weekly.cshop[it.id] = (p.weekly.cshop[it.id] || 0) + 1;
      return { loot: grantAll(p, [it.give]) };
    },
    // ---- Azgın / Kudurmuş Av'ı başlatır: o gün ilk hasar yazılmadan önce, yetkili üye ----
    async 'clan.hunt'(ctx, p, { diff }) {
      const { C, d, me } = await mustMine(ctx, p);
      allow(me, 'hunt');
      if (!int(diff, 1, HUNT_DIFF.length - 1)) fail('bad-diff', 'Geçersiz av kademesi.');
      if (d.lvl < HUNT_DIFF[diff].lvl) fail('locked', `${HUNT_DIFF[diff].name} klan ${HUNT_DIFF[diff].lvl}. seviyede açılır.`);
      if (d.hunt.diff || d.dmg > 0) fail('hunt-started', 'Bugünkü av çoktan başladı; kademe yarın değiştirilebilir.');
      d.hunt = { diff, by: p.name };
      log(d, ctx.now, 'hunt', { a: p.name, n: diff });
      tagPlayer(p, C, me);
      saveClan(ctx, C);
    },
    async 'siege.top'(ctx, p) {
      const week = weekKey(ctx.now), rows = await ctx.store.query('clan', { order: '-n2', limit: 30 });
      return { top: rows.filter(r => r.doc.siege.week === week && r.doc.siege.score > 0).slice(0, 10).map(r => ({ name: r.doc.name, faction: r.doc.faction, score: r.doc.siege.score, mine: r.id === p.clan, banner: brief(r.id, r.doc).banner })) };
    },
  };

  // Kural modülünden (game.js) geçen işlemlerin ardından: girişte üyelik eşitlenir (başvuru onayı, çıkarılma, sancak/seviye),
  // savaş bitince bekleyen av hasarı ve kuşatma puanı HEMEN klana yazılır (sandık kademeleri canlı ilerler).
  async function after(ctx, p, action, result) {
    const t = action && action.type;
    if (t === 'ping') {
      if (p.clanApps?.length) await resolveApps(ctx, p);
      if (!p.clan) return;
      const r = await mine(ctx, p);
      if (r) saveIfChanged(ctx, r.C);
      return;
    }
    if (t !== 'battle.finish' || !p.clan || !(p.pend.clan > 0 || p.pend.siege > 0 || p.pend.hisar > 0 || winsDelta(p, ctx.now) >= 5)) return;
    const C0 = await ctx.store.get('clan', p.clan), t0 = C0 ? chestTier(C0.doc) : 0, day0 = C0?.doc.day;
    const r = await mine(ctx, p);
    if (!r) return;
    saveIfChanged(ctx, r.C);
    if (result.mode === 'clanboss') result.clan = { dmg: r.d.dmg, tier: chestTier(r.d), was: day0 === r.d.day ? t0 : 0 };
  }
  // Klan sohbeti: üyelik belgeden doğrulanır (klandan çıkarılan oyuncunun kaydı bir sonraki girişine kadar eski kalabilir)
  async function isMember(ctx, p) {
    const C = p.clan ? await ctx.store.get('clan', p.clan) : null;
    return !!C && C.doc.members.some(m => same(m.id, ctx.pid));
  }
  return { HANDLERS, after, isMember, botClans, brief };
}
