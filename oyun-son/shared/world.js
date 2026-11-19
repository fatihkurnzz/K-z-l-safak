// Oyuncular arası (paylaşılan) işlemler: posta, pazar, meydan listesi, klan, kuşatma, sefer, akın tablosu.
// Her işlem önce okur (ctx.store.get/query), sonra önerdiği yazmaları ctx.ops'a koyar; dispatch bunları oyuncu
// kaydıyla birlikte TEK atomik işlemde yazar. Araya başka bir yazma girdiyse işlem baştan denenir.
// ctx.bots: yapay oyuncular dünyayı doldurur (deneme sürümünde her zaman; sunucuda BOTS=1 ile).
import { rankIdx } from './rutbe.js';
import { FEUD_MAX } from './modes.js';
import { ANN_WORLD, afterAnn, annPin } from './duyuru.js';
import { UNLOCK, MARKET, ARENA, CLAN, CHAT, FACTIONS, BAG_LIMIT, WAR_BONUS, CHAMP_REFRESH_MS, dayKey, weekKey, hourOf } from './content.js';
import { itemBase, itemName, refPrice, pickGear, tierForLevel, normItem, seedOf, isTradable } from './items.js';
import { itemOf, equippedIds, partyUnits, partyPower, itemLevel, soloUnits, power } from './hero.js';
import { mailText } from './chatfilter.js';
import { fail, int, addItem, removeItems, pay, grantAll, busy, used, count } from './util.js';
import { validName, tick, perks, premTier } from './state.js';
import { marketTax } from './calc.js';
import { apply } from './game.js';
import { botParty, botName, botClanName, botFromId, botBrief, botLook, isBot, BOT_LINES, BOT_REPLIES } from './bots.js';
import { nameKey } from './memstore.js';
import { rng, pickFrom, weighted } from './rng.js';
import { GUARD, gate, banOf, banText, banView, clientGate, flagOf, report, priceBounds, inBand, fairValue, vsUsed } from './guard.js';
import { WELCOME_MAIL } from './meta.js';
import { META_WORLD, META_READ_ONLY, afterAction } from './metaops.js';
import { clanHandlers, clanPower } from './clanrules.js';
import { capeOf, defaultBanner, hqPct } from './clan.js';
// Gözcü Kulesi: Meydan savunma kaydındaki kahramanların can ve savunması +% (kayıt arena.list'te yazılır)
const gozcu = (p, units) => { const k = hqPct(p, 'gozcu'); return k > 0 ? units.map(u => ({ ...u, maxHp: Math.round(u.maxHp * (100 + k) / 100), def: Math.round(u.def * (100 + k) / 100) })) : units; };
import { PAY_WORLD, PAY_READ_ONLY } from './pay.js';
import { pvpWorld, PVP_READ_ONLY } from './pvpops.js';
import { docRating } from './pvp.js';
import { SUPPORT_WORLD, SUPPORT_READ_ONLY } from './destekops.js';
import { socialWorld, SOCIAL_READ_ONLY, chatGate, hideBlocked, visibleConvs, relOf, pendingRequests, touchSeen, muteOf } from './social.js';
import { REALM_WORLD, REALM_READ_ONLY, realmBefore, realmAfter, taxTo, rulerIds, rulersNow, realmPin, terrBrief } from './realmops.js';
import { REPORT_WORLD, REPORT_READ_ONLY, afterBattle } from './reportops.js';
import { SETTINGS_WORLD, SETTINGS_READ_ONLY } from './settings.js';
import { SANDIK_WORLD } from './sandik.js';
import { SERIES_WORLD } from './minidizi.js';
import { MQ_WORLD } from './anagorev.js';
import { RANK_WORLD, touchPlayer, frameOf } from './rankper.js';
import { saleNet as luxNet, listFee } from './sinks.js';
import { hisarWorld, HISAR_READ_ONLY, hisarCollect, hisarAfter } from './hisarops.js';
import { baskinWorld } from './baskin.js';
import { nobetWorld } from './nobet.js';
import { coopWorld } from './coop.js';

const need = (p, key) => { if (p.lvl < UNLOCK[key]) fail('locked', `${UNLOCK[key]}. seviyede açılır.`); };
const nid = ctx => Array.from({ length: 4 }, () => Math.floor(ctx.rand() * 65536).toString(16).padStart(4, '0')).join('');
const put = (ctx, coll, id, doc, ver, idx = {}) => ctx.ops.push({ t: 'put', coll, id, doc, ver, ...idx });
const del = (ctx, coll, id, ver) => ctx.ops.push({ t: 'del', coll, id, ver });
const mail = (ctx, to, text, give, extra = {}) => put(ctx, 'mail', nid(ctx), { to, text, give, at: ctx.now, ...extra }, null, { k1: String(to), n1: ctx.now });
const HOUR = 3600000;
const SOLO_MAIL = 'solo-iade', SOLO_TEXT = 'Korant Online artık tek karakterle oynanıyor; kopya kahraman yerleri kalktı. Satın aldığın İkinci Kopya Yeri’nin karşılığı Yakut olarak iade edildi. Diğer kahramanlarının eşyaları çantanda duruyor.';

// ---------- Pazar ----------
const listingIdx = L => ({ k1: itemBase(L.item.b).type, n1: L.price, n2: L.exp });
const listingView = (ctx, r) => ({ id: r.id, item: r.doc.item, price: r.doc.price, name: r.doc.name, mine: r.doc.seller === ctx.pid, exp: r.doc.exp });
// Üç nadirlikten önce açılmış ilan ya da posta belgesindeki eşya okunurken düzeltilir (İyi/Üstün → Nadir, Eşsiz 3 → 2)
const fresh = r => { if (r?.doc.item) r.doc.item = normItem(r.doc.item); return r; };
async function marketRows(ctx, p) {
  let rows = (await ctx.store.query('market', { order: 'n1', limit: 200 })).map(fresh);
  if (!ctx.bots) return rows.filter(r => r.doc.exp > ctx.now);
  // Yapay satıcılar: tezgâh boş kalmasın diye oyuncunun kademesine yakın ilanlar açar, süresi dolanı kaldırır
  for (const r of rows) if (r.doc.seller === 'bot' && r.doc.exp <= ctx.now) del(ctx, 'market', r.id);
  rows = rows.filter(r => r.doc.exp > ctx.now);
  const tier = tierForLevel(p.lvl);
  for (let n = rows.filter(r => r.doc.seller === 'bot').length; n < 24; n++) {
    const item = { b: pickGear(ctx.rand, Math.max(0, tier - (ctx.rand() < 0.3 ? 1 : 0))), g: weighted(ctx.rand, [[0, 50], [1, 50]]), p: weighted(ctx.rand, [[0, 50], [3, 25], [5, 15], [7, 10]]), x: Math.floor(ctx.rand() * 2147483647) };
    const doc = { seller: 'bot', name: botName(ctx.rand), fac: ctx.rand() < 0.5 ? 'ocak' : 'sancak', item, price: (B => Math.min(B.max, Math.max(B.min, Math.round(fairValue(item) * (0.7 + ctx.rand() * 0.9)))))(priceBounds(item)), at: ctx.now, exp: ctx.now + (6 + ctx.rand() * 40) * HOUR };
    const id = nid(ctx);
    put(ctx, 'market', id, doc, null, listingIdx(doc));
    rows.push({ id, doc, ver: 0 });
  }
  return rows.sort((a, b) => a.doc.price - b.doc.price);
}
const marketGate = (ctx, p) => {
  need(p, 'market');
  if (!ctx.dev && ctx.now - p.createdAt < MARKET.minAgeDays * 86400000) fail('too-new', `Pazar, hesap ${MARKET.minAgeDays} günlük olunca açılır.`);
};
const useTx = p => { if (used(p, 'tx') >= MARKET.dailyTx) fail('daily-limit', 'Günlük pazar işlem sınırına ulaştın.'); p.daily.tx = used(p, 'tx') + 1; };
// Satıcının eline geçen akçe: satış vergisi satıcının tarafına göre kesilir (taraf bonusu; eski ilanlarda taraf yoksa taban oran)
const saleNet = luxNet; // dilimli satış vergisi (sinks.js): eşik altındaki satışta eskisiyle aynıdır

// Klan kuralları ayrı modüldedir; buradaki yardımcıları (yazma önerisi, posta, herkese açık profil) kullanır
const CLAN_RULES = clanHandlers({ put, del, mail, need, nid, pub: (ctx, p) => pubProfile(ctx, p), collect: hisarCollect });
// Hisar Kuşatması, vergi paylaşımı, ittifak ve yardım (hisarops.js)
const HISAR_RULES = hisarWorld({ mail, botClans: (ctx, f, rows) => CLAN_RULES.botClans(ctx, f, rows), warStandings: ctx => warStandings(ctx) });
// "pvp" paketi (pvpops.js): eşya seviyesine göre eşleştirme, meydan sezonu ve sezon paneli
const PVP = pvpWorld({ put, del, mail, dressBot: (ctx, b) => dressBot(ctx, b) });
// Dünya Baskını (baskin.js): hafta sonu iki ırkın ortak hasar havuzu, barajlar, ödül postası
const BASKIN_W = baskinWorld({ put, mail });
// Kristal Nöbeti (nobet.js): iki ırkın ortak dalga savunması, kayıt, sandık
const NOBET_W = nobetWorld({ put });
// Ortak savaş (coop.js): aynı partideki oyuncular aynı savaşta, eş zamanlı
const COOP_W = coopWorld({ put });

export const WORLD = {
  // ---------- Posta ----------
  // 19 Kas: oyuncudan oyuncuya posta (günde 20), kralın bütün ulusa postası (günde 1)
  async 'mail.send'(ctx, p, { to, text }) {
    const t = mailText(text, fail); if (isBot(to)) return { to: botFromId?.(to)?.name || 'Oyuncu' }; // yapay oyuncu: posta okunmaz, gönderim başarılı görünür
    const id = Number(to);
    if (!Number.isInteger(id) || id <= 0) fail('bad-target', 'Alıcı bulunamadı.');
    if (id === Number(ctx.pid)) fail('bad-target', 'Kendine posta gönderemezsin.');
    const rec = await ctx.store.byId(id); if (!rec) fail('bad-target', 'Alıcı bulunamadı.');
    const day = dayKey(ctx.now); if (p.pmail?.d !== day) p.pmail = { d: day, n: 0 };
    if (p.pmail.n >= 20) fail('limit', 'Günde en çok 20 posta gönderebilirsin.');
    p.pmail.n++;
    mail(ctx, id, t, [], { from: p.name, fid: String(ctx.pid), kind: 'p' });
    return { to: rec.state.name };
  },
  async 'mail.nation'(ctx, p, { text }) {
    const t = mailText(text, fail), R = (await rulersNow(ctx))[p.faction];
    if (!R || String(R.id) !== String(ctx.pid)) fail('not-ruler', 'Ulusa posta yalnız kral gönderebilir.');
    const day = dayKey(ctx.now); if (p.nmail === day) fail('limit', 'Ulusa günde bir posta gönderebilirsin.');
    p.nmail = day;
    put(ctx, 'mailf', nid(ctx), { fac: p.faction, text: t, from: p.name, at: ctx.now }, null, { k1: p.faction, n1: ctx.now });
    return { ok: 1 };
  },
  async 'mail.who'(ctx, p) { // alıcı seçimi: kralsa ulus düğmesi, klan lideriyse klan düğmesi
    const R = p.faction ? (await rulersNow(ctx))[p.faction] : null;
    return { ruler: !!R && String(R.id) === String(ctx.pid), clanLeader: !!p.clan && p.clanTag?.r === 'reis' };
  },
  async 'mail.list'(ctx, p) {
    const rows = await ctx.store.query('mail', { k1: String(ctx.pid), order: '-n1', limit: 30 });
    const mail = rows.map(fresh).map(r => ({ id: r.id, text: r.doc.text, give: r.doc.give || [], item: r.doc.item || null, at: r.doc.at, ...(r.doc.from ? { from: r.doc.from, fid: r.doc.fid || null, kind: r.doc.kind || 'p', cname: r.doc.cname || null } : {}) }));
    // 19 Kas: kralın ulusa postası (ırk başına yayın; her oyuncu kendi kopyasını gizleyebilir: p.mfHide)
    if (p.faction) for (const r of await ctx.store.query('mailf', { k1: p.faction, order: '-n1', limit: 10 })) { const id = 'f:' + r.id; if ((p.mfHide || []).includes(id) || (r.doc.at || 0) < (p.createdAt || 0) - 7 * 86400000) continue; mail.push({ id, text: r.doc.text, give: [], item: null, at: r.doc.at, from: r.doc.from, kind: 'nation' }); }
    mail.sort((a, b) => (b.at || 0) - (a.at || 0));
    // Hoş geldin postası: herkese bir kez (yeni ve eski hesaplar); depoda belge yoktur, alınınca p.welcome işaretlenir
    if (!p.welcome) mail.push({ id: WELCOME_MAIL.id, text: WELCOME_MAIL.text, give: WELCOME_MAIL.give, item: null, at: p.createdAt || 0, system: 1 });
    // Tek karakter göçü (state.js soloMigrate): satın alınmış ikinci kopya yerinin Yakut iadesi (bir kez; depoda belge yoktur)
    if (p.solo?.refund > 0 && !p.solo.got) mail.push({ id: SOLO_MAIL, text: SOLO_TEXT, give: [{ t: 'yakut', n: p.solo.refund }], item: null, at: p.solo.at || 0, system: 1 });
    return { mail, rseen: p.rseen || 0 };
  },
  async 'mail.claim'(ctx, p, { id }) {
    if (typeof id === 'string' && id.startsWith('f:')) { p.mfHide = [...(p.mfHide || []).filter(x => x !== id), id].slice(-30); return { loot: [] }; } // ulus postası: yalnız gizlenir
    if (id === SOLO_MAIL) {
      if (!(p.solo?.refund > 0) || p.solo.got) fail('no-mail', 'Bu posta bulunamadı.');
      p.solo.got = 1;
      return { loot: grantAll(p, [{ t: 'yakut', n: p.solo.refund }]) };
    }
    if (id === WELCOME_MAIL.id) {
      if (p.welcome) fail('no-mail', 'Bu posta bulunamadı.');
      p.welcome = 1;
      return { loot: grantAll(p, WELCOME_MAIL.give, { nt: 1 }) };
    }
    const m = await ctx.store.get('mail', id);
    if (!m || m.doc.to !== ctx.pid) fail('no-mail', 'Bu posta bulunamadı.');
    if (m.doc.item && p.items.length >= BAG_LIMIT) fail('bag-full', 'Çanta dolu.');
    const loot = grantAll(p, m.doc.give || [], m.doc.listing ? null : { nt: 1 }); // sistem postasındaki eşya hediyedir: Satılamaz
    if (m.doc.item) { const it = addItem(p, m.doc.item.b, m.doc.item.g, { p: m.doc.item.p, ...(m.doc.item.r ? { r: 1 } : {}), ...(Number.isInteger(m.doc.item.x) ? { x: m.doc.item.x } : {}), ...(m.doc.item.nt ? { nt: 1 } : {}) }); loot.push({ t: 'item', b: it.b, g: it.g, id: it.id, ...(it.nt ? { nt: 1 } : {}) }); }
    if (m.doc.listing) { p.market.ids = p.market.ids.filter(x => x !== m.doc.listing); count(p, 'sold'); count(p, 'sale', (m.doc.give || []).reduce((a, g) => a + (g.t === 'akce' ? g.n : 0), 0)); } // başarım sayaçları
    del(ctx, 'mail', id, m.ver);
    return { loot };
  },

  // ---------- Pazar Yeri: oyuncudan oyuncuya, eşzamansız ilan ----------
  async 'market.list'(ctx, p, { kind }) { // kind: eşya türü süzgeci (sword, helm, ring…)
    marketGate(ctx, p);
    const rows = await marketRows(ctx, p);
    return { listings: rows.filter(r => !kind || itemBase(r.doc.item.b).type === kind).slice(0, 60).map(r => listingView(ctx, r)), tx: used(p, 'tx') };
  },
  async 'market.sell'(ctx, p, { id, price }) {
    marketGate(ctx, p); busy(p);
    const it = itemOf(p, id) || fail('no-item');
    if (equippedIds(p).has(id)) fail('item-equipped', 'Kuşanılmış eşya önce çıkarılmalı.');
    if (!isTradable(it)) fail('not-tradable', 'Bu eşya bağlı: görev ödülü ya da hediye. Pazara konamaz, başka oyuncuya devredilemez; yalnız Tüccar\'a satılabilir.');
    if (!int(price, 1, 1e9)) fail('bad-price', 'Geçerli bir fiyat gir.');
    const B = priceBounds(it); // saçma fiyatlı ilanla hesaplar arası akçe aktarılamasın
    if (!(price >= B.min && price <= B.max)) fail('bad-price', `Bu eşyanın fiyatı ${B.min} - ${B.max} akçe aralığında olmalı.`);
    if (p.market.ids.length >= MARKET.slots + perks(p, ctx.now).slots) fail('no-slot', 'İlan yuvan kalmadı.');
    useTx(p);
    const fee = listFee(price);
    pay(p, 'akce', fee, `İlan ücreti (${fee} akçe) için yeterli akçe yok.`);
    taxTo(ctx, p.faction, fee, 'fee'); // ilan ücreti yanmaz: satıcının Irk Hazinesi'ne gider (realmops.js)
    removeItems(p, [id]);
    const lid = nid(ctx), doc = { seller: ctx.pid, name: p.name, fac: p.faction, item: { b: it.b, g: it.g, p: it.p, ...(it.r ? { r: 1 } : {}), x: seedOf(it) }, price, at: ctx.now, exp: ctx.now + MARKET.hours * HOUR };
    put(ctx, 'market', lid, doc, null, listingIdx(doc));
    p.market.ids.push(lid);
    return { id: lid, fee };
  },
  // Kendi ilanların: süresi dolan eşya geri döner; (botlar açıksa) uygun fiyatlı ilanı yapay alıcı alır
  async 'market.mine'(ctx, p) {
    marketGate(ctx, p);
    const mails = await ctx.store.query('mail', { k1: String(ctx.pid), limit: 60 });
    const out = [], keep = [];
    for (const id of p.market.ids) {
      const L = fresh(await ctx.store.get('market', id));
      if (!L) { if (mails.some(m => m.doc.listing === id)) keep.push(id); continue; } // satıldı: posta alınınca yuva boşalır
      if (L.doc.exp <= ctx.now) {
        if (p.items.length < BAG_LIMIT) { addItem(p, L.doc.item.b, L.doc.item.g, { p: L.doc.item.p, ...(L.doc.item.r ? { r: 1 } : {}), ...(Number.isInteger(L.doc.item.x) ? { x: L.doc.item.x } : {}) }); del(ctx, 'market', id, L.ver); continue; }
      } else if (ctx.bots && ctx.now - L.doc.at > 45000 && L.doc.price <= fairValue(L.doc.item) * 1.5 && ctx.rand() < 0.5) {
        del(ctx, 'market', id, L.ver);
        mail(ctx, ctx.pid, `Satıldı: ${itemName(L.doc.item)}`, [{ t: 'akce', n: saleNet(L.doc.price, p.faction) }], { listing: id });
        taxTo(ctx, p.faction, L.doc.price - saleNet(L.doc.price, p.faction), 'market');
        keep.push(id); continue;
      }
      keep.push(id); out.push(listingView(ctx, L));
    }
    p.market.ids = keep;
    return { listings: out, slots: MARKET.slots + perks(p, ctx.now).slots, used: keep.length };
  },
  async 'market.cancel'(ctx, p, { id }) {
    const L = await ctx.store.get('market', id);
    if (!L || L.doc.seller !== ctx.pid) fail('no-listing', 'İlan bulunamadı.');
    if (p.items.length >= BAG_LIMIT) fail('bag-full', 'Çanta dolu.');
    addItem(p, L.doc.item.b, L.doc.item.g, { p: L.doc.item.p, ...(L.doc.item.r ? { r: 1 } : {}), ...(Number.isInteger(L.doc.item.x) ? { x: L.doc.item.x } : {}) });
    p.market.ids = p.market.ids.filter(x => x !== L.id);
    del(ctx, 'market', id, L.ver);
  },
  async 'market.buy'(ctx, p, { id }) {
    marketGate(ctx, p);
    const L = fresh(await ctx.store.get('market', id));
    if (!L || L.doc.exp <= ctx.now) fail('no-listing', 'Bu ilan artık yok.');
    if (L.doc.seller === ctx.pid) fail('own-listing', 'Kendi ilanını satın alamazsın.');
    if (!inBand(L.doc.item, L.doc.price)) fail('bad-price', 'Bu ilanın fiyatı izin verilen aralığın dışında.'); // bant değişmeden önce açılmış ilan: süresi dolunca satıcıya döner
    if (!isTradable(L.doc.item)) fail('not-tradable', 'Bu eşya bağlı: devredilemez.');
    if (p.items.length >= BAG_LIMIT) fail('bag-full', 'Çanta dolu.');
    useTx(p);
    pay(p, 'akce', L.doc.price, 'Yeterli akçe yok.');
    const it = addItem(p, L.doc.item.b, L.doc.item.g, { p: L.doc.item.p, ...(L.doc.item.r ? { r: 1 } : {}), ...(Number.isInteger(L.doc.item.x) ? { x: L.doc.item.x } : {}) });
    del(ctx, 'market', id, L.ver); // sürüm denetimi: aynı ilan iki kez satılamaz
    // Satış vergisi (%5; satıcının taraf bonusu varsa daha az) satıcının Irk Hazinesi'ne gider; kalan satıcının postasına düşer.
    // Irkı yazılmamış eski ilanın vergisi eskisi gibi yanar.
    taxTo(ctx, L.doc.fac, L.doc.price - saleNet(L.doc.price, L.doc.fac), 'market');
    if (L.doc.seller !== 'bot') mail(ctx, L.doc.seller, `Satıldı: ${itemName(L.doc.item)}`, [{ t: 'akce', n: saleNet(L.doc.price, L.doc.fac) }], { listing: L.id });
    return { item: it, price: L.doc.price };
  },

  // ---------- Meydan: rakip listesi ve kendi savunma kaydı ----------
  async 'arena.list'(ctx, p, { refresh }) {
    need(p, 'arena');
    const defGain = await PVP.claimDef(ctx, p); // savunmada püskürtülen saldırılar: +3 puan (pvpops.js)
    const A = p.arena, me = { name: p.name, faction: p.faction, lvl: p.lvl, power: partyPower(p, 'def'), il: itemLevel(p, 'def'), rating: A.rating, units: gozcu(p, partyUnits(p, 'def')), at: ctx.now, ...faceOf(p, ctx.now), ...PVP.seasonFields(A) }; // savunma düzeni (roster.js: 'def'; kayıtlı değilse Sefer düzeni)
    put(ctx, 'arena', String(ctx.pid), me, undefined, { k1: p.faction, n1: A.rating, n2: me.il }); // savunma düzenin: şu anki partin (n2: eşya seviyesi)
    PVP.publishIndex(ctx, p, me.il); // eşleştirme dizini: eşya seviyesine göre aralık sorgusu (pvpops.js)
    pubProfile(ctx, p);
    A.opp = (await stillListed(ctx, A.opp)).filter(o => !o.faction || o.faction !== p.faction); // eski listede kalan aynı ırk rakip düşer
    const race = await PVP.raceView(ctx, p); // günlük ırk yarışı: bugün ve dün
    if (A.opp.length && !refresh) return { opp: A.opp.map(viewOpp), race, defGain };
    if (A.opp.length && ctx.now - A.oppAt < ARENA.refreshMs) pay(p, 'akce', ARENA.refreshCost, 'Listeyi yenilemek için yeterli akçe yok.');
    A.opp = await PVP.findOpponents(ctx, p, A.rating, 3);
    A.oppAt = ctx.now;
    return { opp: A.opp.map(viewOpp), race, defGain };
  },
  // ---- Kan Davası: seni yenenler (Meydan yenilgilerin + savunmanı düşürenler) ve tek dokunuşla rövanş ----
  async 'feud.list'(ctx, p) {
    need(p, 'arena');
    const out = new Map();
    for (const f of p.feud || []) out.set(f.id, { ...f, src: 'atk' });
    const defs = await ctx.store.query('brep', { k1: 'd:' + String(ctx.pid), order: '-n1', limit: 20 });
    for (const r of defs) { const d = r.doc; if (!d.win || !d.byId || out.has(String(d.byId))) continue; out.set(String(d.byId), { id: String(d.byId), name: d.by, faction: d.faction, at: d.at, n: 1, src: 'def' }); }
    const list = [...out.values()].filter(x => !x.faction || x.faction !== p.faction).sort((a, b) => b.at - a.at).slice(0, FEUD_MAX); // aynı ırk Meydan'da dövüşmez
    for (const x of list) { const look = isBot(x.id) ? botLook(x.id) : (await ctx.store.get('arena', x.id))?.doc; if (look) Object.assign(x, { rk: look.rk || 0, ti: look.ti || null, lvl: look.lvl ?? botFromId(x.id)?.lvl ?? null, rating: look.rating ?? null }); else x.gone = 1; }
    return { feud: list };
  },
  async 'feud.revenge'(ctx, p, { id }) {
    need(p, 'arena');
    if (typeof id !== 'string' || id.length > 40) fail('bad-id', 'Böyle bir rakip yok.');
    if (used(p, 'arena') >= ARENA.tickets + (p.daily.arenaBonus || 0) + perks(p, ctx.now).tickets) fail('no-ticket', 'Bugünkü meydan hakkın bitti.');
    let o = null;
    if (isBot(id)) { const b = botFromId(id); if (b) o = { ...b, units: soloUnits(dressBot(ctx, b)), rating: 1000 }; }
    else { const A = await ctx.store.get('arena', id); if (A && id !== String(ctx.pid)) o = { id: A.id, ...A.doc, rating: docRating(A.doc, ctx.now) }; }
    if (!o) fail('gone', 'Bu rakibin meydan kaydı artık yok.');
    if (o.faction && o.faction === p.faction) fail('same-race', 'Meydan’da yalnızca karşı ırktan rakiple dövüşülür.');
    p.arena.opp = [o, ...(p.arena.opp || []).filter(x => String(x.id) !== id)].slice(0, 4);
    return { i: 0, opp: p.arena.opp.map(viewOpp) };
  },
  async 'live.find'(ctx, p) {
    need(p, 'live');
    const h = hourOf(ctx.now);
    if (h !== 13 && h !== 21 && !ctx.dev) fail('closed', 'Canlı Meydan 13:00 ve 21:00 pencerelerinde açılır.');
    if (used(p, 'arena') >= ARENA.tickets + (p.daily.arenaBonus || 0) + perks(p, ctx.now).tickets) fail('no-ticket', 'Bugünkü meydan hakkın bitti.');
    p.arena.liveOpp = (await PVP.findOpponents(ctx, p, p.arena.live ?? 1000, 1))[0];
    return { opp: viewOpp(p.arena.liveOpp) };
  },
  async 'rank.top'(ctx, p, { fac } = {}) {
    const champ = await champOf(ctx), me = String(ctx.pid);
    return { top: (await topPlayers(ctx)).filter(x => !fac || x.faction === p.faction).map(x => ({ ...x, me: x.id === me, title: titleOf(champ, x.id) })) };
  },
  // Oyuncu kartı: sıralamada ya da sohbette bir isme dokununca açılır
  async 'player.card'(ctx, p, { id }) {
    const sid = String(id ?? ''), champ = await champOf(ctx), card = await cardFor(ctx, p, sid, champ);
    if (!card) fail('no-player', 'Oyuncu bulunamadı.');
    return { card: { id: sid, ...card, title: titleOf(champ, sid), rel: await relOf(ctx, p, sid) } }; // rel: arkadaşlık ve engel durumu (social.js)
  },
  // ---------- Taş Yemini: şampiyon, lider klan ve üstün ırk (salt-okur; unvan önbelleğindeki sahipleri gösterir) ----------
  async 'monument.view'(ctx, p) {
    const champ = await champOf(ctx), W = await warStandings(ctx);
    const card = champ.player ? await cardFor(ctx, p, champ.player, champ) : null;
    const C = champ.clan ? await getDoc(ctx, 'clan', champ.clan) : null;
    const lead = C && (C.doc.members.find(m => String(m.id) === String(C.doc.leader)) || C.doc.members[0]);
    return {
      champ: card ? { id: champ.player, ...card, title: 'champ' } : null,
      clan: C ? { id: C.id, name: C.doc.name, faction: C.doc.faction, leader: lead?.name || null, leaderId: lead && (isBot(lead.id) || !lead.bot) ? String(lead.id) : null, members: C.doc.members.length, ...lvlBanner(C), power: clanPower(C.doc), mine: C.id === p.clan } : null,
      war: { now: W.now, last: W.last, winner: W.winner, holder: W.holder, buffUntil: W.buffUntil, terr: await terrBrief(ctx) },
      rulers: await rulerCards(ctx, p, champ), // ırkların bu haftaki Başbuğları (realmops.js)
      at: champ.at, next: champ.at + CHAMP_REFRESH_MS,
    };
  },

  // ---------- Klan (kurallar clanrules.js'te): arama, kurma, başvuru/davet, rütbe, bağış, görev, dükkân, sancak, Oba Avı ----------
  ...CLAN_RULES.HANDLERS,
  ...HISAR_RULES, // Hisar Kuşatması, ittifak, yardım (hisarops.js)

  // ---------- Büyük Sefer: haftalık taraf savaşı; her zafer tarafına puan yazar ----------
  async 'war.view'(ctx, p) {
    const week = weekKey(ctx.now), fresh = p.war.week !== week;
    if (fresh) p.war = { week, pts: 0, buffUntil: 0 };
    const W = await warStandings(ctx, p.pend.war > 0 ? { [p.faction]: p.pend.war } : null);
    if (p.pend.war > 0) { put(ctx, 'war', String(week), W.doc, W.ver); p.war.pts += p.pend.war; p.pend.war = 0; }
    if (fresh && W.winner === p.faction) p.war.buffUntil = W.buffUntil; // galip tarafa hafta başından 3 gün drop bonusu
    return { now: W.now, last: W.last, winner: W.winner, holder: W.holder, buffUntil: W.buffUntil, mine: p.war.pts, buff: p.war.buffUntil > ctx.now, terr: await terrBrief(ctx) };
  },

  // ---------- Akın tablosu ----------
  async 'akin.view'(ctx, p) {
    const w = String(Math.floor(ctx.now / 14400000)), a = p.pend.akin;
    if (a && a.w === w && !a.sent) { put(ctx, 'akin', `${w}:${ctx.pid}`, { name: p.name, faction: p.faction, score: a.s }, undefined, { k1: w, n1: a.s }); a.sent = a.s; }
    const rows = await ctx.store.query('akin', { k1: w, order: '-n1', limit: 10 });
    const top = rows.filter(r => r.id !== `${w}:${ctx.pid}`).map(r => ({ name: r.doc.name, faction: r.doc.faction, score: r.doc.score }));
    if (a && a.w === w) top.push({ name: p.name, faction: p.faction, score: a.s, me: true });
    if (ctx.bots) { const r = rng(+w); for (let i = top.length; i < 8; i++) top.push({ name: botName(r), faction: r() < 0.5 ? 'ocak' : 'sancak', score: 100 + Math.floor(r() * 45) * 10 }); }
    return { top: top.sort((x, y) => y.score - x.score).slice(0, 10), open: hourOf(ctx.now) % 4 === 0 || !!ctx.dev, used: used(p, 'akin') };
  },

  // ---------- Sohbet: genel, klan ve oyuncudan oyuncuya özel ----------
  async 'chat.send'(ctx, p, { ch, text, to }) {
    if (typeof text !== 'string') fail('bad-text', 'Mesaj boş olamaz.');
    text = text.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!text || text.length > CHAT.max) fail('bad-text', `Mesaj 1-${CHAT.max} karakter olmalı.`);
    if (ctx.now - (p.chatAt || 0) < CHAT.gapMs) fail('chat-fast', 'Çok hızlı yazıyorsun, biraz bekle.');
    const key = chKey(ctx, p, ch, to), me = String(ctx.pid);
    if (ch === 'c' && !(await CLAN_RULES.isMember(ctx, p))) fail('no-clan', 'Bir klanda değilsin.'); // klandan çıkarılmış olabilir
    if (ch === 'p' && !(await whoIs(ctx, String(to)))) fail('no-player', 'Oyuncu bulunamadı.');
    const C = await chatGate(ctx, p, ch, to, text); // susturma, engel, yeni hesap ve spam sınırları; küfür ve bağlantı süzgeci (social.js)
    if (C.muted) { p.chatAt = ctx.now; return { sent: false, muted: C.muted }; } // spam: mesaj gönderilmez, susturma yazılır
    text = C.text;
    p.chatAt = ctx.now;
    put(ctx, 'chat', msgId(ctx, ctx.now), { from: ctx.pid, name: p.name, faction: p.faction, lvl: p.lvl, ...faceOf(p, ctx.now), ...(p.clan && p.clanTag ? { cb: p.clanTag.b } : {}), text, at: ctx.now }, null, { k1: key, n1: ctx.now }); // fotoğraf ve kademe gönderildiği andaki hâliyle saklanır
    if (C.raw) ctx.ops.at(-1).doc.raw = C.raw; // süzülmeden önceki metin yalnızca şikâyet incelemesi için saklanır (oyunculara gösterilmez)
    const old = await ctx.store.query('chat', { k1: key, order: '-n1', limit: 100 }); // kanal başına son CHAT.keep mesaj saklanır
    for (const r of old.slice(CHAT.keep - 1)) del(ctx, 'chat', r.id);
    if (ch === 'p') {
      const other = String(to), who = await whoIs(ctx, other), mine = await convIndex(ctx, me);
      touchConv(mine, other, who, text, ctx.now, false);
      if (isBot(other)) { // yapay oyuncu kısa bir yanıt verir
        if (ctx.bots) { const reply = pickFrom(ctx.rand, BOT_REPLIES); put(ctx, 'chat', msgId(ctx, ctx.now + 1), { from: other, name: who.name, faction: who.faction, lvl: botFromId(other).lvl, ...botLook(other), text: reply, at: ctx.now + 1 }, null, { k1: key, n1: ctx.now + 1 }); touchConv(mine, other, who, reply, ctx.now + 1, true); }
      } else { const theirs = await convIndex(ctx, other); touchConv(theirs, me, { name: p.name, faction: p.faction }, text, ctx.now, true); saveConv(ctx, other, theirs); }
      saveConv(ctx, me, mine);
    }
    pubProfile(ctx, p);
    return { sent: true };
  },
  async 'chat.list'(ctx, p, { ch, to }) {
    const key = chKey(ctx, p, ch, to), champ = await champOf(ctx);
    if (ch === 'c' && !(await CLAN_RULES.isMember(ctx, p))) fail('no-clan', 'Bir klanda değilsin.');
    const extra = ctx.bots && ch !== 'p' ? await botChatter(ctx, key, champ, ch === 'f' ? p.faction : null) : null;
    const rows = (await ctx.store.query('chat', { k1: key, order: '-n1', limit: 40 })).reverse();
    const msgs = rows.map(r => msgView(ctx, r.id, r.doc, champ));
    if (extra) msgs.push(msgView(ctx, extra.id, extra.doc, champ));
    hideBlocked(p, msgs); // engellenen oyuncuların mesajları gösterilmez
    if (ch === 'p') { const idx = await convIndex(ctx, String(ctx.pid)), c = idx.convs.find(x => x.id === String(to)); if (c?.unread) { c.unread = 0; saveConv(ctx, String(ctx.pid), idx); } }
    const mute = await muteOf(ctx); // susturulmuş oyuncu nedeni ve bitişi sohbette görür (social.js)
    return { ch, to: to ?? null, msgs, ...(mute ? { mute } : {}), ...(ch === 'f' ? { pin: await realmPin(ctx, p.faction) } : ch === 'g' ? { ann: await annPin(ctx) } : {}) }; // ırk kanalı: sabitlenen son ulufe ya da ferman
  },
  // Ana üsteki önizleme: genel kanalın son mesajları, okunmamış özel mesaj sayısı ve oyuncunun kendi unvanı
  async 'chat.peek'(ctx, p) {
    const champ = await champOf(ctx), extra = ctx.bots ? await botChatter(ctx, 'g', champ) : null;
    const msgs = (await ctx.store.query('chat', { k1: 'g', order: '-n1', limit: 5 })).reverse().map(r => msgView(ctx, r.id, r.doc, champ));
    if (extra) msgs.push(msgView(ctx, extra.id, extra.doc, champ));
    hideBlocked(p, msgs);
    const idx = await convIndex(ctx, String(ctx.pid));
    // req: yanıt bekleyen arkadaşlık isteği sayısı (Menü'deki rozet)
    const mute = await muteOf(ctx);
    return { msgs: msgs.slice(-5), unread: visibleConvs(p, idx.convs).reduce((a, c) => a + (c.unread || 0), 0), title: titleOf(champ, ctx.pid), req: await pendingRequests(ctx), ...(mute ? { mute } : {}) };
  },
  async 'chat.convs'(ctx, p) { return { convs: visibleConvs(p, (await convIndex(ctx, String(ctx.pid))).convs) }; },

  // ---------- Klan sıralaması (iki taraf birlikte, klan gücüne göre) ----------
  async 'clan.top'(ctx, p, { fac } = {}) {
    const champ = await champOf(ctx);
    return { top: (await topClans(ctx)).filter(r => !fac || r.doc.faction === p.faction).slice(0, 20).map(r => ({ id: r.id, name: r.doc.name, faction: r.doc.faction, members: r.doc.members.length, ...lvlBanner(r), power: clanPower(r.doc), mine: r.id === p.clan, lead: r.id === champ.clan })) };
  },
  ...RANK_WORLD, // dönemlik sıralamalar, ödüller, çerçeveler (rankper.js)
  ...META_WORLD, // bildirim merkezi (metaops.js)
  ...MQ_WORLD, // ana görev ağacı (anagorev.js)
  ...SANDIK_WORLD, // çevrimdışı ödül sandığı (sandik.js)
  ...SERIES_WORLD, // mini dizi (minidizi.js)
  ...SETTINGS_WORLD, // hesap sekmesi: kimlik ve saklanan ayarlar (settings.js)
  ...PAY_WORLD, // gerçek parayla satın alma: katalog, Yakut Kartı, geçmiş (pay.js)
  ...socialWorld({ chKey, whoIs, look: friendLook }), // şikâyet, engel listesi, arkadaşlar (social.js)
  ...ANN_WORLD, // sunucu duyuru şeridi ve genel sohbetin sabit duyurusu (duyuru.js)
  ...REALM_WORLD, // Irk Hazinesi, Başbuğ seçimi, ulufe, ferman, bölge hâkimiyeti (realmops.js)
  ...PVP.HANDLERS, // sezon paneli (pvpops.js)
  ...REPORT_WORLD, // savaş raporları: son savaşlar ve savunma kayıtları (reportops.js)
  ...SUPPORT_WORLD, // duyuru panosu, Sorun / Teknik Destek (destekops.js)
  ...BASKIN_W.HANDLERS, // Dünya Baskını (baskin.js)
  ...NOBET_W.HANDLERS, // Kristal Nöbeti (nobet.js)
  ...COOP_W.HANDLERS, // ortak parti savaşı (coop.js)
};

export { clanPower };
// Klanın seviyesi, üye sınırı ve sancağı (liste, sıralama ve Taş Yemini satırları)
const lvlBanner = r => { const b = CLAN_RULES.brief(r.id, r.doc); return { lvl: b.lvl, max: b.max, banner: b.banner }; };
// Herkese açık kısa profil (oyuncu kartı bunu okur)
// Profil fotoğrafı ve üyelik çerçevesi: belgeye (profil, meydan kaydı, sohbet mesajı) yazıldığı andaki kademe, bitiş
// zamanıyla (tu) birlikte saklanır; gösterirken süresi dolmuş kademe düşer (çerçeve yalnızca üyelik sürerken görünür)
const faceOf = (p, now) => ({ av: p.avatar || 'h:warrior', tier: premTier(p, now), tu: p.premium?.until || 0, ti: p.ach?.title || null, fr: frameOf(p), rk: rankIdx(p) }); // rk: Şan rütbesi (rutbe.js) // fr: takılı sıralama çerçevesi (rankper.js); ti: seçili başarım unvanı (meta.js ACH kimliği)
const liveTier = (d, now) => (d.tier && (d.tu === undefined || d.tu > now) ? d.tier : 0);
// il: parti eşya seviyesi (hero.js: itemLevel). Profil ve meydan kaydıyla yayınlanır; her iki belgede n2 dizini de odur,
// yani başka sistemler oyuncuları eşya seviyesine göre sıralayıp eşleştirebilir. Eski belgelerde alan yoktur (null).
const profileOf = (ctx, p) => ({ name: p.name, faction: p.faction, lvl: p.lvl, power: partyPower(p), il: itemLevel(p), ...faceOf(p, ctx.now), clan: p.clanName || null, cb: p.clan && p.clanTag ? p.clanTag.b : null, rating: p.arena?.rating ?? null });
const cardView = (d, now) => ({ name: d.name, faction: d.faction, lvl: d.lvl, power: d.power, il: d.il ?? null, av: d.av || 'h:warrior', tier: liveTier(d, now), ti: d.ti || null, fr: d.fr || null, rk: d.rk || 0, clan: d.clan || null, banner: (d.clan && d.cb) || null, rating: d.rating ?? null });
const pubProfile = (ctx, p) => { if (!ctx.ops.some(o => o.coll === 'prof')) { const doc = profileOf(ctx, p); put(ctx, 'prof', String(ctx.pid), doc, undefined, { k1: p.faction, n1: p.lvl, n2: doc.il }); } };

// ---------- Sıralamalar, unvanlar (şampiyon, lider klan) ve sefer durumu ----------
// İstek başına küçük önbellek: aynı istekte sıralama iki kez hesaplanmaz, yapay klanlar iki kez kurulmaz
const memo = (ctx, key, fn) => ((ctx.memo ??= {})[key] ??= fn());
// Bu istekte yazılması önerilmiş (henüz depoya geçmemiş) belge de okunabilsin
const getDoc = async (ctx, coll, id) => { const o = ctx.ops.findLast(x => x.t === 'put' && x.coll === coll && x.id === id); return o ? { id, doc: o.doc, ver: o.ver } : ctx.store.get(coll, id); };
// Meydan sıralaması (puan): gerçek kayıtlar; yapay oyuncular açıksa tablo 14 kişiye tamamlanır
const topPlayers = ctx => memo(ctx, 'players', async () => {
  const rows = await ctx.store.query('arena', { order: '-n1', limit: 30 });
  const top = rows.map(r => ({ id: r.id, name: r.doc.name, faction: r.doc.faction, lvl: r.doc.lvl, il: r.doc.il ?? null, rating: docRating(r.doc, ctx.now), av: r.doc.av || 'h:warrior', tier: liveTier(r.doc, ctx.now), ti: r.doc.ti || null, fr: r.doc.fr || null, rk: r.doc.rk || 0 }));
  if (ctx.bots) for (let i = top.length; i < 14; i++) { const b = botParty(7000 + i, 30 + i * 3, 0.5); top.push({ id: b.id, name: b.name, faction: b.faction, lvl: b.lvl, il: b.il, rating: 950 + i * 55, ...botLook(b.id) }); }
  return top.sort((a, b) => b.rating - a.rating).slice(0, 30);
});
// Klan sıralaması (klan gücü, iki taraf birlikte); yapay oyuncular açıksa iki tarafta da üçer yapay klan bulunur
const topClans = ctx => memo(ctx, 'clans', async () => {
  const rows = await ctx.store.query('clan', { order: '-n1', limit: 30 });
  if (ctx.bots) for (const f of ['ocak', 'sancak']) await CLAN_RULES.botClans(ctx, f, rows);
  return rows.sort((a, b) => clanPower(b.doc) - clanPower(a.doc));
});
// Unvan sahipleri paylaşılan tek belgede (meta/champ) önbelleklenir: meydan birincisi, en güçlü klan ve o klanın
// üyeleri. Belge en çok CHAMP_REFRESH_MS'de bir, süresi dolduktan sonraki ilk istekte yenilenir. Yazma sürümsüzdür
// (üzerine yazar): iki istek aynı anda yenilerse ikisi de başarılı olur, sonuncusu kalır.
const champOf = ctx => memo(ctx, 'champ', async () => {
  const r = await ctx.store.get('meta', 'champ');
  if (r && ctx.now >= r.doc.at && ctx.now - r.doc.at < CHAMP_REFRESH_MS) return r.doc;
  const top = (await topPlayers(ctx))[0], clan = (await topClans(ctx))[0];
  const doc = { at: ctx.now, player: top ? String(top.id) : null, clan: clan ? clan.id : null, cname: clan ? clan.doc.name : null, cb: clan ? CLAN_RULES.brief(clan.id, clan.doc).banner : null, members: clan ? clan.doc.members.map(m => String(m.id)) : [], rulers: await rulerIds(ctx) };
  put(ctx, 'meta', 'champ', doc);
  return doc;
});
// Unvan, görüntüleme anında önbellekten çözülür: 'champ' (şampiyon) > 'ruler' (ırkının Başbuğu) > 'clan' (lider klan üyesi) > yok
const titleOf = (champ, id) => (id == null ? null : String(id) === champ.player ? 'champ' : (champ.rulers || []).includes(String(id)) ? 'ruler' : champ.members.includes(String(id)) ? 'clan' : null);
// Taş Yemini: iki ırkın Başbuğu, oyuncu kartıyla birlikte (taht boşsa null)
async function rulerCards(ctx, p, champ) {
  const R = await rulersNow(ctx), out = {};
  for (const f in R) { const r = R[f], card = r ? await cardFor(ctx, p, String(r.id), champ) : null; out[f] = r && card ? { id: String(r.id), ...card, faction: f, title: 'ruler', votes: r.votes, total: r.total } : null; }
  return out;
}
// Oyuncu kartının içeriği: kendisi, başka bir gerçek oyuncu ya da (yalnızca ctx.bots açıkken) yapay oyuncu; yoksa null
async function cardFor(ctx, p, sid, champ) {
  if (sid === String(ctx.pid)) return { ...cardView(profileOf(ctx, p), ctx.now), me: true };
  if (isBot(sid)) {
    const b = ctx.bots ? botFromId(sid) : null, i = +sid.split(':')[1] - 7000; // sıralamadaki yapay oyuncuların puanı (topPlayers ile aynı)
    return b ? { name: b.name, faction: b.faction, lvl: b.lvl, power: b.power, il: b.il, ...botLook(sid), clan: champ.members.includes(sid) ? champ.cname : null, banner: champ.members.includes(sid) ? champ.cb || null : null, rating: i >= 0 && i < 14 ? 950 + i * 55 : null } : null;
  }
  const doc = await profById(ctx, sid);
  return doc ? cardView(doc, ctx.now) : null;
}
// Büyük Sefer'in durumu: bu haftanın ve geçen haftanın puanları, galip ("üstün ırk"), bonusun bitişi ve şu an kimde
// olduğu. add: bu istekte tarafa yazılacak bekleyen puan ({ taraf: puan })
async function warStandings(ctx, add) {
  const week = weekKey(ctx.now), cur = await ctx.store.get('war', String(week)), prev = await ctx.store.get('war', String(week - 1));
  const doc = cur ? cur.doc : { ocak: 0, sancak: 0 };
  for (const f in add || {}) doc[f] += add[f];
  // yapay katkı: iki taraf da hafta boyunca düzenli puan toplar (deneme sürümünde tablo boş kalmasın)
  const botPts = (w, f, frac) => ctx.bots ? Math.round((2600 + rng(w * 13 + (f === 'ocak' ? 1 : 2))() * 900) * frac) : 0;
  const frac = (((ctx.now + 3 * HOUR) / 86400000 + 3) % 7) / 7;
  const now = { ocak: doc.ocak + botPts(week, 'ocak', frac), sancak: doc.sancak + botPts(week, 'sancak', frac) };
  const last = { ocak: (prev?.doc.ocak || 0) + botPts(week - 1, 'ocak', 1), sancak: (prev?.doc.sancak || 0) + botPts(week - 1, 'sancak', 1) };
  const winner = last.ocak === last.sancak ? null : last.ocak > last.sancak ? 'ocak' : 'sancak';
  const buffUntil = (week * 7 - 3) * 86400000 - 3 * HOUR + WAR_BONUS.days * 86400000; // hafta başı (pazartesi 00:00, UTC+3) + bonus süresi
  return { doc, ver: cur ? cur.ver : null, now, last, winner, buffUntil, holder: winner && ctx.now < buffUntil ? winner : null };
}

// ---------- Sohbet yardımcıları ----------
// Kanal anahtarı: genel 'g' · klan 'c:<klan>' · özel 'p:<küçük kimlik>|<büyük kimlik>'
function chKey(ctx, p, ch, to) {
  if (ch === 'g') return 'g';
  if (ch === 'c') { if (!p.clan) fail('no-clan', 'Bir klanda değilsin.'); return 'c:' + p.clan; }
  if (ch === 'f') { if (!Object.hasOwn(FACTIONS, p.faction)) fail('bad-channel'); return 'f:' + p.faction; } // ırk kanalı: yalnızca kendi ırkın
  if (ch === 'p') {
    const o = String(to ?? '');
    if (!/^(\d+|bot:\d+:\d+:\d+)$/.test(o) || o === String(ctx.pid)) fail('bad-target', 'Bu oyuncuya mesaj atılamaz.');
    return 'p:' + [String(ctx.pid), o].sort().join('|');
  }
  fail('bad-channel');
}
const msgId = (ctx, at) => at.toString(36).padStart(9, '0') + nid(ctx).slice(0, 6);
const msgView = (ctx, id, d, champ) => ({ id, from: d.from, name: d.name, faction: d.faction, lvl: d.lvl, av: d.av || 'h:warrior', tier: liveTier(d, ctx.now), ti: d.ti || null, rk: d.rk || 0, title: titleOf(champ, d.from), banner: d.cb || (isBot(d.from) && champ.members.includes(String(d.from)) ? champ.cb : null) || null, text: d.text, at: d.at, me: String(d.from) === String(ctx.pid) });
// Arkadaş satırının görünümü: gerçek oyuncuda son görülme belgesinden (fotoğraf, çerçeve, başarım unvanı, eşya seviyesi, sancak),
// yapay oyuncuda kimlikten. Belge yoksa (oyuncu bu sürümden beri hiç yazmadıysa) varsayılan fotoğraf gösterilir.
function friendLook(id, d, now) {
  if (isBot(id)) { const b = botFromId(id); return b ? { ...botLook(b.id), il: b.il ?? null } : {}; }
  return d ? { av: d.av || 'h:warrior', tier: liveTier(d, now), ti: d.ti || null, rk: d.rk || 0, il: d.il ?? null, banner: d.cb || null } : {};
}
async function whoIs(ctx, id) {
  if (isBot(id)) { const b = ctx.bots ? botFromId(id) : null; return b ? { name: b.name, faction: b.faction } : null; }
  const r = await profById(ctx, id);
  return r ? { name: r.name, faction: r.faction } : null;
}
// Gerçek oyuncunun herkese açık profili: yayınlanmış belge, yoksa (hiç sohbet/meydan açmamış oyuncu) hesabın kendisinden
async function profById(ctx, id) {
  if (!/^\d{1,15}$/.test(id)) return null;
  const r = await ctx.store.get('prof', id);
  if (r) return r.doc;
  const rec = await ctx.store.byId(Number(id));
  return rec ? profileOf(ctx, rec.state) : null;
}
// Özel konuşma dizini (kişi başına bir belge): son mesaj, okunmamış sayısı
async function convIndex(ctx, owner) { const r = await ctx.store.get('pmidx', owner); return { ver: r ? r.ver : null, convs: r ? r.doc.convs : [] }; }
function touchConv(idx, withId, who, last, at, unread) {
  let c = idx.convs.find(x => x.id === withId);
  if (!c) idx.convs.push(c = { id: withId, name: who.name, faction: who.faction, unread: 0 });
  Object.assign(c, { name: who.name, faction: who.faction, last: last.slice(0, 60), at }); c.unread = unread ? c.unread + 1 : c.unread;
  idx.convs.sort((a, b) => b.at - a.at); idx.convs.length = Math.min(idx.convs.length, 30);
}
const saveConv = (ctx, owner, idx) => put(ctx, 'pmidx', owner, { convs: idx.convs }, idx.ver, { k1: owner, n1: ctx.now });
// Yapay oyuncular: kanal bir süredir sessizse bir cümle yazar (yalnızca ctx.bots açıkken)
async function botChatter(ctx, key, champ, faction = null) { // faction: ırk kanalında yalnızca o ırkın yapay oyuncuları konuşur
  const last = (await ctx.store.query('chat', { k1: key, order: '-n1', limit: 1 }))[0];
  if (last && ctx.now - last.doc.at < 20000 + ctx.rand() * 25000) return null;
  // arada bir unvan sahibi yapay oyuncular konuşur: şampiyon (%12) ya da lider klanın bir üyesi (%22)
  const members = champ.members.filter(isBot), dice = ctx.rand();
  const vip = dice < 0.12 && isBot(champ.player) ? champ.player : dice < 0.34 && members.length ? pickFrom(ctx.rand, members) : null;
  const vb = vip ? botFromId(vip) : null;
  const b = vb && (!faction || vb.faction === faction) ? vb : botParty(Math.floor(ctx.rand() * 400) + 100, 15 + Math.floor(ctx.rand() * 55), 0.5, faction || undefined);
  const doc = { from: b.id, name: b.name, faction: b.faction, lvl: b.lvl, ...botLook(b.id), text: pickFrom(ctx.rand, BOT_LINES), at: ctx.now - 1 };
  const id = msgId(ctx, doc.at);
  put(ctx, 'chat', id, doc, null, { k1: key, n1: doc.at });
  return { id, doc };
}
const viewOpp = o => ({ name: o.name, faction: o.faction, lvl: o.lvl, power: o.units?.length > 1 ? power(soloUnits(o.units)[0]) : o.power, il: o.il ?? null, rating: o.rating, units: soloUnits(o.units).map(u => ({ cls: u.cls, wm: u.wm, faction: u.faction, ...(u.v ? { v: u.v } : {}), ...(u.cape ? { cape: u.cape } : {}) })) });
// Savunma kaydı silinen (yasaklanan) oyuncu, daha önce alınmış rakip listelerinden de düşer
async function stillListed(ctx, opp) {
  const out = [];
  for (const o of opp) if (o.id === undefined || isBot(o.id) || await ctx.store.get('arena', o.id)) out.push(o);
  return out;
}
// Yapay rakiplerin bir kısmı bir klanın pelerinini taşır (yalnızca görünüm; tohumdan türer). Rakip seçimi pvpops.js'tedir.
function dressBot(ctx, b) {
  const seed = +b.id.split(':')[1], cape = ctx.bots && seed % 5 < 3 ? capeOf({ lvl: 1 + seed % 10, b: defaultBanner(b.name + seed) }) : null;
  return cape ? b.units.map(u => ({ ...u, cape })) : b.units;
}

// Bir oyuncu işlemini uygular ve atomik olarak yazar. Sunucu ve çevrimdışı deneme sürümü aynı yolu kullanır.
export async function dispatch(store, pid, action, env, first) {
  for (let i = 0; i < 4; i++) {
    const rec = (i === 0 && first) || await store.byId(pid);
    if (!rec) fail('auth', 'Oturum bulunamadı.');
    const p = rec.state, ops = [];
    let result;
    try {
      clientGate(p, env); // eski sürüm sekmesi ya da başka cihazda açılmış oturum: yazmadan ve puansız reddedilir (guard.js)
      if (env.guard) gate(p, action, env.now, pid); // yasaklı hesap: ping dışında her işlem reddedilir
      const W = action && typeof action.type === 'string' && Object.hasOwn(WORLD, action.type) ? WORLD[action.type] : null;
      if (W) { tick(p, env.now); result = (await W({ ...env, store, pid, ops }, p, action)) || {}; }
      else {
        await realmBefore({ ...env, store, pid, ops }, p, action); // giriş ve savaş başı: hafta dönümü (Başbuğ, bölge hâkimiyeti) oyuncu kaydına alınır
        result = apply(p, action, env); await CLAN_RULES.after({ ...env, store, pid, ops }, p, action, result); // giriş: klan eşitlemesi · savaş sonu: av hasarı klana yazılır
        await realmAfter({ ...env, store, pid, ops }, p, action, result); // savaş sonu: bölge puanı ırkın haftalık belgesine yazılır
        await hisarAfter({ ...env, store, pid, ops }, p, action); // savaş sonu: Büyük Sefer katılımcı listesi (hisarops.js)
        await afterBattle({ ...env, store, pid, ops }, p, action, result); // savaş sonu: rapor deposu (reportops.js)
        await afterAnn({ ...env, store, pid, ops }, p, action, result); // sunucu duyurusu: +8 ve üstü basma, eşsiz eşya (duyuru.js)
        await NOBET_W.after({ ...env, store, pid, ops }, p, action, result); // Kristal Nöbeti: dalga sayımı, kristal, muhafız güçlendirmesi
        await BASKIN_W.after({ ...env, store, pid, ops }, p, action, result); // Dünya Baskını: hasar ortak havuza; girişte biten haftanın ödülü (baskin.js)
      }
      if (!READ_ONLY.has(action.type)) await PVP.after({ ...env, store, pid, ops }, p, action, result); // meydan sezonu: döküm, ödül postası, kaydın puanı
      if (!READ_ONLY.has(action.type)) await afterAction({ ...env, store, pid, ops }, p, action, result); // kalıcılık katmanı: başarım sayaçları, bildirimler
      if (!READ_ONLY.has(action.type)) touchPlayer({ ...env, pid, ops }, p); // dönemlik sıralama puanı (rankper.js)
    } catch (e) {
      // Hile işareti taşıyan ret: kural hatasında kayıt yazılmaz, ama ihlal temiz kayda ayrıca işlenir (puan, yasak, savaşın kapanması)
      const flag = env.guard ? flagOf(e, action) : null;
      if (flag) await report(store, pid, flag, env);
      throw e;
    }
    if (env.guard && action.type === 'ping') { const b = banOf(p, env.now); if (b) result = { ...result, ban: { ...b, message: banText(b) }, block: banView(p, env.now, pid) }; } // istemci yasağı girişte öğrenir (block: yasak ekranının içeriği)
    if (!READ_ONLY.has(action.type)) touchSeen(p, pid, env.now, ops, { ...faceOf(p, env.now), il: itemLevel(p), cb: p.clan && p.clanTag ? p.clanTag.b : null }); // arkadaş listesindeki "son görülme" ve görünüm (en çok 5 dakikada bir yazılır)
    // Salt-okur işlemler (sohbet, tablolar) oyuncu kaydını yazmaz; yalnızca varsa paylaşılan belgeleri yazar
    const writes = READ_ONLY.has(action.type) ? ops : [{ t: 'player', id: pid, state: p, ver: rec.ver }, ...ops];
    if (!writes.length || await store.commit(writes)) return { result, state: p };
  }
  fail('conflict', 'Eşzamanlı işlem. Tekrar dene.');
}
const READ_ONLY = new Set(['chat.list', 'chat.peek', 'chat.convs', 'mail.list', 'mail.who', 'rank.top', 'clan.top', 'rank.period', 'rank.info', 'clan.page', 'player.card', 'siege.top', 'monument.view', 'codex.get', 'codex.item', 'ann.feed', 'feud.list', ...META_READ_ONLY]);
for (const k of [...COOP_W.READ_ONLY, ...NOBET_W.READ_ONLY, ...SETTINGS_READ_ONLY, ...PAY_READ_ONLY, ...SOCIAL_READ_ONLY, ...REALM_READ_ONLY, ...PVP.READ_ONLY, ...PVP_READ_ONLY, ...REPORT_READ_ONLY, ...SUPPORT_READ_ONLY, ...HISAR_READ_ONLY, ...BASKIN_W.READ_ONLY]) READ_ONLY.add(k);
export const WORLD_ACTIONS = Object.keys(WORLD);
