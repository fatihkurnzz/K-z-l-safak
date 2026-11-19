// Irk ve diyar kuralları: Irk Hazinesi, Başbuğ seçimi, ulufe ve ulufe defteri, ferman, bölge hâkimiyeti.
// Tablolar ve saf hesaplar realm.js'tedir (istemciye sunulur); bu dosya sunulmaz. world.js buradaki işlemleri WORLD
// tablosuna ekler ve dispatch'e iki kanca bağlar (realmBefore, realmAfter).
// Paylaşılan belgeler:
//   realm/<ırk>          hazine ve taht: { gold, tin, out, week, base, given, rec: { alıcı → { n, at } }, ruler, lastGrant, ann, annAt, annDay, annN }
//   tax/<kimlik>         hazineye yolda olan akçe: { f, n, at, src }   (k1 ırk). Her satışta TEK hazine belgesine yazmak
//                        eşzamanlı alışverişleri birbirine çarptırırdı; pay ayrı belgeye düşer, hazineye sonra toplanır.
//   elect/<hafta>:<ırk>  o haftanın adayları ve oyları: { week, f, cands: [{ id, name, lvl, av, slogan, votes, at, dep }], total, bv }
//   grant/<kimlik>       ulufe defteri (yalnızca eklenir): { f, to, toName, n, by, byName, at, week }   (k1 ırk, n1 zaman)
//   terr/<hafta>:<ırk>   ırkın o haftaki bölge puanları: { week, f, z: [puan × 4], act: etkin oyuncu }
//   meta/terr            bu haftanın hâkimiyeti: { week, own: [sahip × 4], last: { ocak, sancak } }
// Oyuncu kaydında: p.realm = { week, vote: { week, to }, ruled } · p.terr = { week, wins, counted, pend, flushAt, own }
import { FACTIONS, dayKey, weekKey } from './content.js';
import { ZONES } from './zones.js';
import { fail, int, pay, count } from './util.js';
import { isBot, botBrief, botLook } from './bots.js';
import { rng, pickFrom } from './rng.js';
import { cleanChat } from './chatfilter.js';
import { banOf } from './guard.js';
import { muteText } from './social.js';
import { hashStr } from './meta.js';
import { hisarTake } from './hisarops.js';
import { nufusSync, nufusStatus, nufusView } from './nufus.js';
import {
  KINGDOM, GRANT, DECREE, TERR, ZONE_IDS, HOUR, DAY, isFaction, weekStartAt, grantMax, weeklyCap, recipientCap, grantRoom,
  terrScore, zoneWinner, zoneBonusKind, terrState, realmState,
} from './realm.js';

const FKEYS = Object.keys(FACTIONS);
const put = (ctx, coll, id, doc, ver, idx = {}) => ctx.ops.push({ t: 'put', coll, id, doc, ver, ...idx });
const nid = ctx => Array.from({ length: 4 }, () => Math.floor(ctx.rand() * 65536).toString(16).padStart(4, '0')).join('');
const stamp = (ctx, at) => at.toString(36).padStart(9, '0') + nid(ctx).slice(0, 6);
const mail = (ctx, to, text, give, extra = {}) => put(ctx, 'mail', nid(ctx), { to, text, give, at: ctx.now, ...extra }, null, { k1: String(to), n1: ctx.now });
const fmt = n => Math.round(n).toLocaleString('tr-TR');
const sum = a => a.reduce((x, y) => x + y, 0);
const weekFrac = (now, week) => Math.max(0, Math.min(1, (now - weekStartAt(week)) / (7 * DAY)));
// Bir istekte aynı belge en çok BİR kez yazılır (sürümlü iki yazma PostgreSQL'de birbirini düşürür): belge önce bu isteğin
// bekleyen yazmalarında aranır; kaydederken var olan yazma yerinde güncellenir.
async function open(ctx, coll, id) {
  const op = ctx.ops.findLast(o => o.t === 'put' && o.coll === coll && o.id === id);
  if (op) return { doc: op.doc, ver: op.ver, op };
  const r = await ctx.store.get(coll, id);
  return r ? { doc: r.doc, ver: r.ver } : { doc: null, ver: null };
}
function save(ctx, coll, id, h, idx = {}) {
  if (h.op) { h.op.doc = h.doc; Object.assign(h.op, idx); return; }
  put(ctx, coll, id, h.doc, h.ver, idx); h.op = ctx.ops.at(-1);
}
// Unvan önbelleği (world.js: meta/champ) bir sonraki istekte yenilensin: Başbuğ değişti
const staleChamp = ctx => { const o = ctx.ops.find(x => x.t === 'put' && x.coll === 'meta' && x.id === 'champ'); if (o) o.doc.at = 0; else put(ctx, 'meta', 'champ', { at: 0, player: null, clan: null, cname: null, cb: null, members: [], rulers: [] }); };

// ---------- Irk Hazinesi ----------
const newRealm = week => ({ gold: 0, tin: 0, out: 0, week, base: 0, given: 0, rec: {}, ruler: null, lastGrant: 0, ann: null, annAt: 0, annDay: 0, annN: 0 });
// Hazineye giden pay (pazar vergisi, ilan ücreti): ayrı bir belgeye yazılır, hazineye sweep ile toplanır
export function taxTo(ctx, faction, n, src) {
  if (!isFaction(faction) || !Number.isSafeInteger(n) || n < 1) return;
  put(ctx, 'tax', stamp(ctx, ctx.now), { f: faction, n, at: ctx.now, src }, null, { k1: faction, n1: ctx.now });
}
async function sweep(ctx, f, h) {
  const gone = new Set(ctx.ops.filter(o => o.coll === 'tax').map(o => o.id)); // bu istekte yazılan ya da toplanan paylar
  let n = 0;
  for (const r of await ctx.store.query('tax', { k1: f, order: 'n1', limit: 200 })) {
    if (gone.has(r.id)) continue;
    ctx.ops.push({ t: 'del', coll: 'tax', id: r.id, ver: r.ver }); // sürümlü silme: aynı pay iki kez toplanamaz
    if (Number.isSafeInteger(r.doc.n) && r.doc.n > 0) n += r.doc.n;
  }
  if (n) n = await hisarTake(ctx, f, n); // hisarın sahibi varsa vergi üçe bölünür, hazineye kalmaz (hisarops.js)
  if (n) { h.doc.gold += n; h.doc.tin += n; h.dirty = true; }
}

// ---------- Yapay oyuncular (yalnızca ctx.bots): taht, seçim ve hazine boş kalmasın ----------
const BOT_SLOGANS = ['Hazine yiğidin hakkıdır.', 'Sınır boyunda tek yürek.', 'Ulufeyi cenk edene veririm.', 'Bölgeleri geri alacağız.', 'Az söz, çok sefer.', 'Ocağı da ovayı da doyururum.'];
const BOT_DECREES = ['Bu hafta bütün gücümüzle sınır boyuna. Bölgeler bizim olacak.', 'Ulufe, sefere çıkanındır. Kapıdan eksik olmayın.', 'Pazarda vergi hazineye akıyor; alışverişten çekinmeyin.', 'Seçimde oyunu kullanmayan söz hakkını da bırakır.'];
function botCands(week, f) {
  const out = [];
  for (let i = 0; i < 3; i++) {
    let seed = hashStr(`cand|${week}|${f}|${i}`) % 1000000;
    for (let k = 0; k < 96 && (botBrief(seed).faction !== f || out.some(c => c.name === botBrief(seed).name)); k++) seed++;
    const r = rng(seed), lvl = 45 + Math.floor(r() * 30), id = `bot:${seed}:${lvl}:60`;
    if (botBrief(seed).faction === f && !out.some(c => c.name === botBrief(seed).name)) out.push({ id, name: botBrief(seed).name, lvl, ...botLook(id), slogan: BOT_SLOGANS[hashStr(id + week) % BOT_SLOGANS.length], votes: 0, at: weekStartAt(week) + i, bot: true });
  }
  return out;
}
// Yapay seçmenler: hafta ilerledikçe her adaya (gerçek oyuncuya da) birkaç oy düşer; hafta sonunda 2-10 arası
const synthVotes = (week, f, id, frac) => Math.floor(frac * (2 + Math.floor(rng(hashStr(`vote|${week}|${f}|${id}`))() * 9)));
// Adaylar ve oyları. E: seçim belgesi (yoksa null) · frac: haftanın geçen kısmı (sonuçta 1)
function tally(ctx, E, week, f, frac) {
  const list = (E?.cands || []).map(c => ({ ...c, id: String(c.id) }));
  if (ctx.bots) {
    for (const b of botCands(week, f)) list.push({ ...b, votes: E?.bv && Object.hasOwn(E.bv, b.id) ? E.bv[b.id] : 0 });
    for (const c of list) c.votes += synthVotes(week, f, c.id, frac);
  }
  return list.sort((a, b) => b.votes - a.votes || a.at - b.at);
}
// Yapay Başbuğ arada bir ulufe verir ya da ferman yazar; yapay tüccarların vergisi hazineye damlar
function botLife(ctx, f, h) {
  const R = h.doc, now = ctx.now;
  if (!R.botAt) { R.botAt = now; R.gold += 60000; R.tin += 60000; h.dirty = true; }
  const hours = Math.min(48, Math.floor((now - R.botAt) / HOUR));
  if (hours >= 1) { const n = hours * (900 + hashStr(f + R.botAt) % 700); h.botTax = (h.botTax || 0) + n; R.botAt += hours * HOUR; h.dirty = true; } // yapay vergi de hisar paylaşımından geçer (realm())
  if (!R.ruler?.bot || now - Math.max(R.lastGrant || 0, R.annAt || 0, R.ruler.at || 0) < 3 * HOUR) return;
  const room = grantRoom(R);
  if (ctx.rand() < 0.3 || room < GRANT.min) { R.ann = { k: 'ann', text: pickFrom(ctx.rand, BOT_DECREES), at: now, by: R.ruler.name }; R.annAt = now; h.dirty = true; return; }
  const seed = Math.floor(ctx.rand() * 1000000), n = Math.max(GRANT.min, Math.floor(room * (0.5 + ctx.rand() * 0.5) / 10) * 10);
  giveGrant(ctx, f, h, { sid: `bot:${seed}:30:50`, name: botBrief(seed).name }, Math.min(n, room), { id: R.ruler.id, name: R.ruler.name });
}

// ---------- Hazine belgesi: yükle, vergiyi topla, hafta döndüyse seçimi sonuçlandır ----------
async function realm(ctx, f) {
  const h = await open(ctx, 'realm', f), W = weekKey(ctx.now);
  if (!h.doc) { h.doc = newRealm(W); h.dirty = true; }
  await sweep(ctx, f, h);
  if (h.doc.week !== W) await roll(ctx, f, h, W);
  if (ctx.bots) botLife(ctx, f, h);
  if (h.botTax) { const k = await hisarTake(ctx, f, h.botTax); h.doc.gold += k; h.doc.tin += k; h.botTax = 0; }
  if (h.dirty) { save(ctx, 'realm', f, h, { k1: f, n1: h.doc.gold }); h.dirty = false; }
  return h;
}
const keep = (ctx, f, h) => save(ctx, 'realm', f, h, { k1: f, n1: h.doc.gold });
// Hafta dönümü: biten haftanın (W − 1) oyları W haftasının Başbuğunu belirler; depozitolar iade edilir ya da hazineye kalır;
// ulufe sayaçları sıfırlanır ve haftalık sınırların tabanı (base) o anki hazine olur. Hazine belgesinin sürümüyle birlikte
// yazıldığı için iki istek aynı haftayı iki kez sonuçlandıramaz.
async function roll(ctx, f, h, W) {
  const R = h.doc, ew = R.week, E = await open(ctx, 'elect', `${ew}:${f}`), live = ew === W - 1, was = R.ruler?.id || null;
  const list = tally(ctx, live ? E.doc : null, W - 1, f, 1), total = sum(list.map(c => c.votes));
  const win = list.find(c => c.votes >= 1) || null;
  R.ruler = win ? { id: win.id, name: win.name, av: win.av || 'h:warrior', votes: win.votes, total, week: W, at: ctx.now, ...(win.bot ? { bot: true } : {}) } : null;
  for (const c of E.doc?.cands || []) { // gerçek adayların depozitosu
    const dep = Number.isSafeInteger(c.dep) && c.dep > 0 ? c.dep : 0, id = String(c.id), won = live && win && win.id === id;
    const v = live ? list.find(x => x.id === id)?.votes || 0 : 0;
    const back = !live || won || (total > 0 && v * 100 >= total * KINGDOM.refundPct); // süresi geçmiş seçimde herkese iade
    if (won) mail(ctx, Number(id), `Irkın seni ${KINGDOM.title} seçti (${fmt(v)} oy). Depoziton iade edildi.`, dep ? [{ t: 'akce', n: dep }] : [], { realm: 1 });
    else if (back && dep) mail(ctx, Number(id), `${KINGDOM.title} seçimi bitti. Depoziton iade edildi.`, [{ t: 'akce', n: dep }], { realm: 1 });
    else if (dep) { R.gold += dep; R.tin += dep; mail(ctx, Number(id), `${KINGDOM.title} seçimi bitti. Oyların %${KINGDOM.refundPct}'unu alamadığın için depoziton ${KINGDOM.treasury}'ne kaldı.`, [], { realm: 1 }); }
  }
  R.week = W; R.base = R.gold; R.given = 0; R.rec = {}; h.dirty = true;
  if ((R.ruler?.id || null) !== was) staleChamp(ctx);
}
// Hazinenin oyuncuya gösterilen özeti (sayılar realm.js işlevlerinden; arayüz ayrıca hesaplamaz)
const treasuryView = R => ({ gold: R.gold, base: R.base, given: R.given, weeklyCap: weeklyCap(R.base), left: Math.max(0, weeklyCap(R.base) - R.given), grantMax: grantRoom(R), recipientCap: recipientCap(R.base), tin: R.tin, out: R.out });
const rulerView = R => (R.ruler ? { id: R.ruler.id, name: R.ruler.name, av: R.ruler.av || 'h:warrior', votes: R.ruler.votes, total: R.ruler.total, at: R.ruler.at, bot: !!R.ruler.bot } : null);
const pinView = a => (a ? { k: a.k === 'grant' ? 'grant' : 'ann', text: String(a.text || ''), at: a.at, by: a.by || null } : null);

// ---------- Ulufe ----------
// Hazineden düşer, haftalık sayaçlara ve deftere yazılır, duyuru olarak sabitlenir; gerçek alıcıya postayla gider
function giveGrant(ctx, f, h, who, n, by) {
  const R = h.doc, now = ctx.now, old = Object.hasOwn(R.rec, who.sid) ? R.rec[who.sid] : null;
  R.gold -= n; R.given += n; R.out += n; R.rec[who.sid] = { n: (old?.n || 0) + n, at: now }; R.lastGrant = now;
  R.ann = { k: 'grant', text: `${who.name} adlı ırkdaşa ${fmt(n)} akçe ulufe verildi.`, at: now, by: by.name };
  put(ctx, 'grant', stamp(ctx, now), { f, to: who.sid, toName: who.name, n, by: by.id, byName: by.name, at: now, week: R.week }, null, { k1: f, n1: now });
  if (!isBot(who.sid)) mail(ctx, Number(who.sid), `${KINGDOM.title} ${by.name}, ${KINGDOM.treasury}'nden sana ulufe verdi.`, [{ t: 'akce', n }], { grant: 1 });
  h.dirty = true;
}
const ledgerRow = r => ({ id: r.id, to: r.doc.to, toName: r.doc.toName, n: r.doc.n, byName: r.doc.byName, at: r.doc.at });
const ledger = async (ctx, f, limit) => { // bu istekte yazılan kayıt henüz depoda değildir: başa eklenir
  const mine = ctx.ops.filter(o => o.t === 'put' && o.coll === 'grant' && o.doc.f === f).map(o => ({ id: o.id, doc: o.doc })).reverse();
  return [...mine, ...await ctx.store.query('grant', { k1: f, order: '-n1', limit })].slice(0, limit).map(ledgerRow);
};

// ---------- Bölge hâkimiyeti ----------
const botTerr = (week, f, i, frac) => Math.round((320 + rng(hashStr(`terr|${week}|${f}|${i}`))() * 520) * frac);
const botAct = (week, f) => 18 + Math.floor(rng(hashStr(`act|${week}|${f}`))() * 14);
// Bir haftanın iki ırk için ham puanları, etkin nüfusu ve nüfusa bölünmüş bölge puanları
async function standings(ctx, week, frac) {
  const out = {};
  for (const f of FKEYS) {
    const d = (await open(ctx, 'terr', `${week}:${f}`)).doc;
    const z = ZONE_IDS.map((_, i) => (d?.z?.[i] || 0) + (ctx.bots ? botTerr(week, f, i, frac) : 0)), act = (d?.act || 0) + (ctx.bots ? botAct(week, f) : 0);
    out[f] = { z, act, score: z.map(n => terrScore(n, act)) };
  }
  return out;
}
// Bu haftanın hâkimiyet belgesi; hafta döndüyse geçen haftanın puanlarından yeniden kurulur
async function terrMeta(ctx) {
  const h = await open(ctx, 'meta', 'terr'), W = weekKey(ctx.now);
  if (h.doc && h.doc.week === W) return h;
  const prev = Array.isArray(h.doc?.own) ? h.doc.own : [], last = await standings(ctx, W - 1, 1);
  h.doc = { week: W, own: ZONE_IDS.map((_, i) => zoneWinner(last.ocak.score[i], last.sancak.score[i], isFaction(prev[i]) ? prev[i] : null)), last };
  save(ctx, 'meta', 'terr', h);
  return h;
}
// Oyuncunun bekleyen bölge puanını ırkının haftalık belgesine yazar (en çok TERR.flushMs'de bir; force: hemen)
async function flushTerr(ctx, p, force) {
  const T = terrState(p), total = sum(T.pend), fresh = !T.counted && T.wins >= TERR.activeWins;
  if ((!total && !fresh) || !T.week || !isFaction(p.faction)) return;
  if (!force && ctx.now - (T.flushAt || 0) < TERR.flushMs && ctx.now >= (T.flushAt || 0)) return;
  const id = `${T.week}:${p.faction}`, h = await open(ctx, 'terr', id);
  if (!h.doc) h.doc = { week: T.week, f: p.faction, z: ZONE_IDS.map(() => 0), act: 0 };
  T.pend.forEach((n, i) => { if (Number.isSafeInteger(n) && n > 0) h.doc.z[i] = (h.doc.z[i] || 0) + n; });
  if (fresh) { h.doc.act = (h.doc.act || 0) + 1; T.counted = true; } // hesap, haftada bir kez "etkin" sayılır
  T.pend = ZONE_IDS.map(() => 0); T.flushAt = ctx.now;
  save(ctx, 'terr', id, h, { k1: String(T.week), n1: sum(h.doc.z) });
}
// Hafta eşitlemesi: geçen haftadan kalan puan (hâlâ sayılabiliyorsa) yazılır, sayaçlar sıfırlanır, bu haftanın
// hâkimiyeti oyuncu kaydına alınır (savaş ödülü bunu depo okumadan kullanır) ve ırkın hazine belgesi haftaya taşınır
async function syncWeek(ctx, p) {
  if (!isFaction(p.faction)) return;
  const W = weekKey(ctx.now), T = terrState(p), K = realmState(p);
  if (T.week !== W) { if (T.week) await flushTerr(ctx, p, true); T.week = W; T.wins = 0; T.counted = false; T.pend = ZONE_IDS.map(() => 0); }
  if (!T.own || T.own.week !== W) T.own = { week: W, z: [...(await terrMeta(ctx)).doc.own] };
  if (K.week !== W) {
    const R = (await realm(ctx, p.faction)).doc;
    K.week = W;
    if (R.ruler && R.ruler.id === String(ctx.pid) && K.ruled !== W) { K.ruled = W; count(p, 'ruled'); } // başarım sayacı: Başbuğ olunan hafta
  }
}
// dispatch kancaları (world.js): oyuncunun kendi kaydını yazan her işlemden önce hafta eşitlenir (kayıt bu haftaya aitse
// hiçbir belge okunmaz: haftada bir kez iş yapar); savaş sonunda ve girişte bekleyen bölge puanı yazılır
export async function realmBefore(ctx, p) { await syncWeek(ctx, p); await nufusSync(ctx, p); } // + nüfus sayımı ve Bereket durumu (nufus.js)
export async function realmAfter(ctx, p, action) {
  const t = action?.type;
  if (t === 'battle.finish' || t === 'battle.sweep' || t === 'ping') await flushTerr(ctx, p, t === 'ping');
}

// ---------- world.js'in okuduğu özetler (salt-okur; hazine belgesini değiştirmez) ----------
// Bu haftanın Başbuğları: { ocak: { id, name, … } | null, sancak: … }. Hafta henüz devrilmediyse taht boş sayılır.
export async function rulersNow(ctx) {
  const out = {}, W = weekKey(ctx.now);
  for (const f of FKEYS) { const d = (await open(ctx, 'realm', f)).doc; out[f] = d && d.week === W ? rulerView(d) : null; }
  return out;
}
export const rulerIds = async ctx => Object.values(await rulersNow(ctx)).filter(Boolean).map(r => String(r.id));
// Irk sohbetinin üstüne sabitlenen son ulufe ya da ferman
export const realmPin = async (ctx, f) => (isFaction(f) ? pinView((await open(ctx, 'realm', f)).doc?.ann) : null);
// Sıralama ve Taş Yemini için bölgelerin sahipleri: [{ id, name, owner, bonus }]
export async function terrBrief(ctx) { const own = (await terrMeta(ctx)).doc.own; return ZONES.map((z, i) => ({ id: z.id, name: z.name, owner: own[i] || null, bonus: zoneBonusKind(z.id) })); }
// Bildirim merkezi (metaops.js: feed): yeni Başbuğ, ferman ve bu haftanın bölge hâkimiyeti
export async function realmFeed(ctx, p) {
  if (!isFaction(p.faction)) return [];
  const out = [], W = weekKey(ctx.now), me = String(ctx.pid), R = (await open(ctx, 'realm', p.faction)).doc, T = p.terr;
  if (R && R.week === W && R.ruler) out.push({ id: `ruler:${W}:${R.ruler.id}`, k: 'ruler', at: R.ruler.at, text: R.ruler.id === me ? `Irkın seni bu haftanın ${KINGDOM.title}u seçti. ${KINGDOM.court}'da hazine seni bekliyor.` : `${R.ruler.name}, bu haftanın ${KINGDOM.title}u seçildi.` });
  if (R?.ann && R.ann.k === 'ann' && R.ann.by !== p.name) out.push({ id: `ferman:${R.ann.at}`, k: 'ferman', at: R.ann.at, text: `${R.ann.by}: ${String(R.ann.text).slice(0, 100)}` });
  if (T?.own && T.own.week === W && p.createdAt < weekStartAt(W)) {
    const mine = ZONES.filter((z, i) => T.own.z[i] === p.faction).map(z => z.name);
    out.push({ id: `terr:${W}`, k: 'terr', at: weekStartAt(W), text: mine.length ? `Irkın bu hafta şu bölgelere hâkim: ${mine.join(', ')}. Oralarda bonusun var.` : 'Irkın bu hafta hiçbir bölgeye hâkim değil. Bölgelerde kazanılan her zafer gelecek haftayı belirler.' });
  }
  return out;
}

// ---------- Oyuncu işlemleri ----------
const DAYS = n => n * DAY;
const aged = (ctx, p, days) => !!ctx.dev || ctx.now - p.createdAt >= DAYS(days); // test sunucusunda hesap yaşı aranmaz (pazar kapısıyla aynı)
function mustRule(ctx, R) { if (!R.ruler || R.ruler.id !== String(ctx.pid)) fail('not-ruler', `Bunu yalnızca ırkının ${KINGDOM.title}u yapabilir.`); }
// Bu oyuncu neden oy veremez / aday olamaz (null: engel yok). Arayüz aynı metni gösterir.
const voteBlock = (ctx, p) => (p.lvl < KINGDOM.voteLvl ? `Oy vermek için seviye ${KINGDOM.voteLvl} gerekli.` : !aged(ctx, p, KINGDOM.voteAgeDays) ? `Oy vermek için hesabın en az ${KINGDOM.voteAgeDays} günlük olmalı.` : null);
const runBlock = (ctx, p) => (p.lvl < KINGDOM.candLvl ? `Adaylık için seviye ${KINGDOM.candLvl} gerekli.` : !aged(ctx, p, KINGDOM.candAgeDays) ? `Adaylık için hesabın en az ${KINGDOM.candAgeDays} günlük olmalı.`
  : (p.san || 0) < KINGDOM.candSan ? `Adaylık için elinde en az ${fmt(KINGDOM.candSan)} Şan olmalı.` : null);
const electOf = async (ctx, W, f) => { const h = await open(ctx, 'elect', `${W}:${f}`); if (!h.doc) h.doc = { week: W, f, cands: [], total: 0, bv: {} }; return h; };
const cleanLine = s => s.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();

export const REALM_WORLD = {
  // Otağ: hazine, Başbuğ, bu haftanın seçimi, son ulufeler
  async 'realm.view'(ctx, p) {
    await syncWeek(ctx, p);
    const f = p.faction, W = weekKey(ctx.now), me = String(ctx.pid), h = await realm(ctx, f), R = h.doc, K = realmState(p);
    const E = (await open(ctx, 'elect', `${W}:${f}`)).doc, cands = tally(ctx, E, W, f, weekFrac(ctx.now, W));
    const voted = K.vote && K.vote.week === W ? K.vote.to : null, running = cands.some(c => c.id === me);
    return {
      faction: f, week: W, endsAt: weekStartAt(W + 1), treasury: treasuryView(R), ruler: rulerView(R), isRuler: !!R.ruler && R.ruler.id === me, pin: pinView(R.ann),
      election: { cands: cands.map(c => ({ id: c.id, name: c.name, lvl: c.lvl, av: c.av || 'h:warrior', slogan: c.slogan || '', votes: c.votes, me: c.id === me })), total: sum(cands.map(c => c.votes)), voted, running,
        voteBlock: voted ? 'Bu hafta oyunu kullandın.' : voteBlock(ctx, p), runBlock: running ? 'Bu hafta adaysın.' : cands.filter(c => !c.bot).length >= KINGDOM.maxCands ? 'Bu haftanın aday listesi doldu.' : runBlock(ctx, p) },
      ledger: await ledger(ctx, f, 8),
      decree: { left: Math.max(0, DECREE.perDay - (R.annDay === dayKey(ctx.now) ? R.annN : 0)), nextAt: (R.annAt || 0) + DECREE.gapMs },
    };
  },
  // Ulufe defteri: ırkın bütün üyeleri görebilir (son GRANT.ledger kayıt)
  async 'realm.ledger'(ctx, p) {
    const R = (await open(ctx, 'realm', p.faction)).doc;
    return { list: await ledger(ctx, p.faction, GRANT.ledger), treasury: R ? treasuryView(R) : treasuryView(newRealm(0)) };
  },
  // Ulufe verilebilecek ırkdaşlar: son görülen üyeler (social.js'in "seen" belgeleri) ve bu haftaki payları
  async 'realm.roster'(ctx, p) {
    const f = p.faction, me = String(ctx.pid), R = (await open(ctx, 'realm', f)).doc || newRealm(0), cap = recipientCap(R.base);
    const rows = (await ctx.store.query('seen', { k1: f, order: '-n1', limit: 40 })).filter(r => r.id !== me && /^\d{1,15}$/.test(r.id));
    if (ctx.bots) for (let i = 0, seed = hashStr(`roster|${f}|${weekKey(ctx.now)}`) % 1000000; rows.length < 8 && i < 200; i++, seed++) { // deneme: liste boş kalmasın
      const b = botBrief(seed), lvl = 22 + seed % 40, id = `bot:${seed}:${lvl}:50`;
      if (b.faction === f && !rows.some(r => r.doc.name === b.name)) rows.push({ id, doc: { name: b.name, lvl, at: ctx.now - (1 + seed % 50) * 60000, ...botLook(id) } });
    }
    return { list: rows.slice(0, 30).map(r => { const g = Object.hasOwn(R.rec, r.id) ? R.rec[r.id] : null; return { id: r.id, name: r.doc.name, lvl: r.doc.lvl, av: r.doc.av || 'h:warrior', at: r.doc.at, got: g?.n || 0, waitUntil: g ? g.at + GRANT.recipientGapMs : 0, ok: r.doc.lvl >= GRANT.minLvl }; }), cap };
  },
  // Adaylık: depozito seçim belgesinde emanette durur (hafta dönümünde iade edilir ya da hazineye kalır)
  async 'realm.run'(ctx, p, { slogan = '' }) {
    await syncWeek(ctx, p);
    const f = p.faction, W = weekKey(ctx.now), me = String(ctx.pid), why = runBlock(ctx, p);
    if (why) fail('not-eligible', why);
    if (typeof slogan !== 'string' || slogan.length > 200) fail('bad-text', 'Söz geçersiz.');
    const line = cleanChat(cleanLine(slogan)).text;
    if (line.length > KINGDOM.sloganMax) fail('bad-text', `Söz en çok ${KINGDOM.sloganMax} karakter olabilir.`);
    const E = await electOf(ctx, W, f);
    if (E.doc.cands.some(c => String(c.id) === me)) fail('already-running', 'Bu hafta zaten adaysın.');
    if (E.doc.cands.length >= KINGDOM.maxCands) fail('cands-full', 'Bu haftanın aday listesi doldu.');
    pay(p, 'akce', KINGDOM.deposit, `Adaylık depozitosu (${fmt(KINGDOM.deposit)} akçe) için yeterli akçe yok.`);
    E.doc.cands.push({ id: me, name: p.name, lvl: p.lvl, av: p.avatar || 'h:warrior', slogan: line, votes: 0, at: ctx.now, dep: KINGDOM.deposit });
    save(ctx, 'elect', `${W}:${f}`, E, { k1: f, n1: W });
    return { deposit: KINGDOM.deposit };
  },
  // Oy: hesap başına haftada bir, yalnızca kendi ırkının adayına; oy oyuncu kaydıyla aynı atomik işlemde yazılır
  async 'realm.vote'(ctx, p, { id }) {
    await syncWeek(ctx, p);
    const f = p.faction, W = weekKey(ctx.now), K = realmState(p), why = voteBlock(ctx, p);
    if (K.vote && K.vote.week === W) fail('voted', 'Bu hafta oyunu kullandın.');
    if (why) fail('not-eligible', why);
    if (typeof id !== 'string' || id.length > 40) fail('bad-target', 'Böyle bir aday yok.');
    const E = await electOf(ctx, W, f), c = E.doc.cands.find(x => String(x.id) === id);
    if (c) c.votes = (c.votes || 0) + 1;
    else if (ctx.bots && botCands(W, f).some(b => b.id === id)) { E.doc.bv ||= {}; E.doc.bv[id] = (Object.hasOwn(E.doc.bv, id) ? E.doc.bv[id] : 0) + 1; }
    else fail('bad-target', 'Böyle bir aday yok.');
    E.doc.total = (E.doc.total || 0) + 1;
    K.vote = { week: W, to: id }; count(p, 'vote');
    save(ctx, 'elect', `${W}:${f}`, E, { k1: f, n1: W });
    return { voted: id };
  },
  // Ulufe: Başbuğ hazineden bir ırkdaşına akçe verir. Sınırların hepsi burada, hazine belgesinin sürümüyle birlikte denetlenir.
  async 'realm.grant'(ctx, p, { to, n }) {
    await syncWeek(ctx, p);
    const f = p.faction, me = String(ctx.pid), now = ctx.now, h = await realm(ctx, f), R = h.doc;
    mustRule(ctx, R);
    const sid = typeof to === 'string' ? to : Number.isSafeInteger(to) ? String(to) : '', bot = !!ctx.bots && /^bot:\d{1,10}:\d{1,2}:\d{1,3}$/.test(sid);
    if (!bot && !/^\d{1,15}$/.test(sid)) fail('bad-target', 'Bu oyuncuya ulufe verilemez.');
    if (sid === me) fail('self-grant', 'Kendine ulufe veremezsin.');
    if (!int(n, 1, 1e12)) fail('bad-amount', 'Geçerli bir tutar gir.');
    if (n < GRANT.min) fail('bad-amount', `Ulufe en az ${fmt(GRANT.min)} akçe olmalı.`);
    let who;
    if (bot) { const b = botBrief(+sid.split(':')[1]); if (b.faction !== f) fail('other-faction', 'Ulufe yalnızca kendi ırkından oyunculara verilir.'); who = { sid, name: b.name }; }
    else {
      const rec = await ctx.store.byId(Number(sid)), t = rec?.state;
      if (!t) fail('no-player', 'Oyuncu bulunamadı.');
      if (t.faction !== f) fail('other-faction', 'Ulufe yalnızca kendi ırkından oyunculara verilir.');
      if (t.lvl < GRANT.minLvl) fail('low-level', `Ulufe alacak oyuncu en az ${GRANT.minLvl}. seviye olmalı.`);
      if (!ctx.dev && now - t.createdAt < DAYS(GRANT.minAgeDays)) fail('too-new', `Ulufe alacak hesap en az ${GRANT.minAgeDays} günlük olmalı.`);
      if (banOf(t, now)) fail('banned-target', 'Bu oyuncuya ulufe verilemez.');
      who = { sid, name: t.name };
    }
    if (now - (R.lastGrant || 0) < GRANT.gapMs && now >= (R.lastGrant || 0)) fail('grant-wait', `İki ulufe arasında ${Math.round(GRANT.gapMs / 1000)} saniye beklenir.`);
    if (n > R.gold || n > grantMax(R.gold)) fail('grant-cap', `Tek ulufe hazinenin binde ${GRANT.perGrantPm}'ünü geçemez (şu an en çok ${fmt(grantMax(R.gold))} akçe).`);
    if (R.given + n > weeklyCap(R.base)) fail('weekly-cap', `Haftalık dağıtım sınırı aşılır (hafta başındaki hazinenin %${GRANT.weeklyPct}'si: ${fmt(weeklyCap(R.base))} akçe; kalan ${fmt(Math.max(0, weeklyCap(R.base) - R.given))}).`);
    const old = Object.hasOwn(R.rec, sid) ? R.rec[sid] : null;
    if (old && now - old.at < GRANT.recipientGapMs && now >= old.at) fail('recipient-wait', 'Bu oyuncu son 24 saatte ulufe aldı.');
    if ((old?.n || 0) + n > recipientCap(R.base)) fail('recipient-cap', `Bir oyuncu haftada en çok ${fmt(recipientCap(R.base))} akçe ulufe alabilir (hafta başındaki hazinenin %${GRANT.recipientPct}'i).`);
    giveGrant(ctx, f, h, who, n, { id: me, name: p.name });
    keep(ctx, f, h);
    return { n, to: who.name, treasury: treasuryView(R) };
  },
  // Ferman: Başbuğun ırk sohbetine sabitlenen kısa duyurusu (sohbet süzgecinden geçer; susturulmuş hesap yazamaz)
  async 'realm.announce'(ctx, p, { text }) {
    await syncWeek(ctx, p);
    const f = p.faction, now = ctx.now, h = await realm(ctx, f), R = h.doc, d = dayKey(now);
    mustRule(ctx, R);
    if (typeof text !== 'string') fail('bad-text', 'Ferman boş olamaz.');
    const line = cleanLine(text);
    if (!line || line.length > DECREE.max) fail('bad-text', `Ferman 1-${DECREE.max} karakter olmalı.`);
    const M = await ctx.store.get('mute', String(ctx.pid));
    if (M && M.doc.until > now) fail('muted', muteText(M.doc));
    if (now - (R.annAt || 0) < DECREE.gapMs && now >= (R.annAt || 0)) fail('decree-wait', `Fermanlar arasında ${Math.round(DECREE.gapMs / 60000)} dakika beklenir.`);
    const used = R.annDay === d ? R.annN || 0 : 0;
    if (used >= DECREE.perDay) fail('daily-limit', `Günde en çok ${DECREE.perDay} ferman yazılabilir.`);
    const C = cleanChat(line);
    R.ann = { k: 'ann', text: C.text, at: now, by: p.name, ...(C.raw ? { raw: C.raw } : {}) }; // raw: süzülmeden önceki metin (oyunculara gösterilmez)
    R.annAt = now; R.annDay = d; R.annN = used + 1;
    keep(ctx, f, h);
    return { pin: pinView(R.ann) };
  },
  // Diyar Haritası: bu haftanın sahipleri, süren haftanın nüfusa bölünmüş puanları ve oyuncunun kendi katkısı
  async 'realm.map'(ctx, p) {
    await syncWeek(ctx, p);
    await flushTerr(ctx, p, true);
    const W = weekKey(ctx.now), M = (await terrMeta(ctx)).doc, cur = await standings(ctx, W, weekFrac(ctx.now, W)), T = terrState(p);
    return {
      week: W, endsAt: weekStartAt(W + 1), mine: { wins: T.wins, active: !!T.counted },
      act: { ocak: cur.ocak.act, sancak: cur.sancak.act },
      nufus: nufusView(await nufusStatus(ctx.store, ctx)), // ırk nüfusu, Bereket ve kapalı ırk (nufus.js)
      zones: ZONES.map((z, i) => ({ id: z.id, name: z.name, owner: M.own[i] || null, bonus: zoneBonusKind(z.id), pts: { ocak: cur.ocak.z[i], sancak: cur.sancak.z[i] }, score: { ocak: cur.ocak.score[i], sancak: cur.sancak.score[i] },
        last: M.last ? { ocak: M.last.ocak.score[i], sancak: M.last.sancak.score[i] } : null })),
    };
  },
  // ---- Yalnızca test sürümü: oyuncuyu ırkının Başbuğu yapar ve hazineye deneme akçesi koyar ----
  async 'dev.ruler'(ctx, p) {
    if (!ctx.dev) fail('forbidden');
    await syncWeek(ctx, p);
    const f = p.faction, h = await realm(ctx, f), R = h.doc;
    R.ruler = { id: String(ctx.pid), name: p.name, av: p.avatar || 'h:warrior', votes: 1, total: 1, week: R.week, at: ctx.now };
    R.gold += 1000000; R.tin += 1000000; R.base = R.gold; R.given = 0; R.rec = {}; R.lastGrant = 0; R.annAt = 0;
    keep(ctx, f, h); staleChamp(ctx);
  },
};
export const REALM_READ_ONLY = ['realm.ledger', 'realm.roster'];
