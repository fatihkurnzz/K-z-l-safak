// Savaş dışı sistemler: Maden, Çırak (çevrimdışı kazanç), günlük görevler, Kervan, Şan Divanı, Kader Çarkı, su verme.
import { MASTERY, masteryOf } from './mastery.js';
import { blessDrops } from './nufus.js'; // nüfus Bereketi: görev ödülünün akçesi
import { UNLOCK, MINE, IDLE, QUESTS, QUEST_ALL, SHOP, ARENA_SHOP, HALL, WHEEL, SHARDS, GAME, BAG_LIMIT, PREMIUM, CLASSES } from './content.js';
import { MOBS } from './zones.js';
import { itemBase, pickGear, tierForLevel, REFORGE, UNIQUES, G_UNIQUE, minPlus, KO_ARMOR, ARMOR_SLOTS, KO_JEWEL_IDS } from './items.js';
import { REWARD_GRADE, wheelUniques } from './drops.js';
import { itemOf } from './hero.js';
import { clsOf } from './roster.js';
import { fail, int, pay, grant, grantAll, bump, used, busy, addItem } from './util.js';
import { premTier } from './state.js';
import { addXp } from './modes.js';
import { mineStock, idleStage, idleStock, questProgress } from './calc.js';
import { pickFrom, weighted } from './rng.js';
import { RULES } from './rules.js';

const need = (p, key) => { if (p.lvl < UNLOCK[key]) fail('locked', `${UNLOCK[key]}. seviyede açılır.`); };

export { mineStock, idleStage, idleStock, questProgress };

export const DAILY_HANDLERS = {
  'mine.collect'(p, _, env) {
    need(p, 'mine');
    const n = mineStock(p, env.now);
    if (n < 1) fail('empty', 'Madende henüz cevher birikmedi.');
    p.ore += n; p.mine.at = env.now; bump(p, 'collect');
    return { ore: n };
  },
  'mine.upgrade'(p) {
    need(p, 'mine');
    if (p.mine.lvl >= MINE.max) fail('max', 'Maden en yüksek seviyede.');
    if (p.lvl < p.mine.lvl * 6) fail('locked', `Maden ${p.mine.lvl + 1}. seviye için seviye ${p.mine.lvl * 6} gerekli.`);
    pay(p, 'akce', MINE.upCost(p.mine.lvl), 'Yeterli akçe yok.');
    p.mine.lvl++;
  },
  'mine.trade'(p, { k, n = 1 }) {
    const T = Object.hasOwn(MINE.trade, k) ? MINE.trade[k] : fail('bad-trade');
    if (!int(n, 1, 100000)) fail('bad-trade');
    pay(p, 'ore', T.ore * n, 'Yeterli cevher yok.');
    return { loot: grantAll(p, [{ ...T.give, n: T.give.n * n }]) };
  },
  'idle.collect'() { fail('removed', 'Çırak oyundan kaldırıldı.'); },
  'quest.claim'(p, { id }) {
    const q = QUESTS.find(x => x.id === id) || fail('bad-quest');
    if (p.daily.qdone[id]) fail('claimed', 'Bu ödül alındı.');
    if (questProgress(p, q) < q.need) fail('not-done', 'Görev henüz tamamlanmadı.');
    p.daily.qdone[id] = true;
    return { loot: grantAll(p, blessDrops(p, [q.reward]), { nt: 1 }) };
  },
  'quest.bonus'(p) {
    if (p.daily.qdone.all) fail('claimed', 'Bu ödül alındı.');
    if (!QUESTS.every(q => p.daily.qdone[q.id])) fail('not-done', 'Önce altı görevin ödülünü al.');
    p.daily.qdone.all = true;
    return { loot: grantAll(p, blessDrops(p, [QUEST_ALL]), { nt: 1 }) };
  },
  'daily.gift'(p) {
    if (p.daily.gift) fail('claimed', 'Bugünkü giriş ödülü alındı.');
    p.daily.gift = true;
    return { loot: grantAll(p, [{ t: 'akce', n: RULES.gift.akce(p.lvl) }, { t: 'energy', n: RULES.gift.energy }, { t: 'yakut', n: RULES.gift.yakut }]) };
  },
  'shop.buy'(p, { id }) {
    const S = SHOP.find(x => x.id === id) || fail('bad-item');
    const key = 'shop_' + id;
    if (used(p, key) >= S.max) fail('daily-limit', 'Bu ürünün günlük sınırı doldu.');
    pay(p, 'yakut', S.cost, 'Yeterli yakut yok.');
    p.daily[key] = used(p, key) + 1;
    if (id === 'ticket') { p.daily.arenaBonus = (p.daily.arenaBonus || 0) + 5; return { loot: [] }; }
    return { loot: grantAll(p, [S.give]) };
  },
  'arena.shop'(p, { id }) {
    need(p, 'arena');
    const S = ARENA_SHOP.find(x => x.id === id) || fail('bad-item');
    const key = 'ashop_' + id;
    if (used(p, key) >= S.max) fail('daily-limit', 'Bu ürünün günlük sınırı doldu.');
    busy(p);
    pay(p, 'san', S.cost, 'Yeterli şan yok.');
    p.daily[key] = used(p, key) + 1;
    if (S.tickets) { p.daily.arenaBonus = (p.daily.arenaBonus || 0) + S.tickets; return { loot: [] }; }
    return { loot: grantAll(p, [S.give]) };
  },
  'hall.up'(p, { stat }) {
    need(p, 'hall');
    if (!Object.hasOwn(HALL.stats, stat)) fail('bad-stat');
    if (p.hall[stat] >= HALL.max) fail('max', 'Bu bonus en yüksek seviyede.');
    busy(p);
    pay(p, 'san', HALL.cost(p.hall[stat]), 'Yeterli şan yok.');
    p.hall[stat]++;
  },
  // Premium üyelik: aynı kademe süreyi uzatır; üst kademe hemen başlar (alt kademenin kalan süresi devredilmez);
  // etkin üyelikten düşük kademe alınamaz
  'premium.buy'(p, { tier }, env) {
    if (!int(tier, 1, PREMIUM.length - 1)) fail('bad-tier');
    if (!PREMIUM[tier].yakut) fail('real-money-only', `${PREMIUM[tier].name} Premium yalnızca gerçek parayla alınır.`);
    const T = PREMIUM[tier], cur = premTier(p, env.now);
    if (cur > tier) fail('lower-tier', 'Daha yüksek bir üyeliğin sürüyor.');
    pay(p, 'yakut', T.cost, 'Yeterli yakut yok.');
    p.premium = { tier, until: (cur === tier ? p.premium.until : env.now) + T.days * 86400000 };
    return { tier, until: p.premium.until };
  },
  // Profil fotoğrafı: kendi kahramanlarından biri ya da ansiklopedide keşfettiğin bir yaratık
  'profile.avatar'(p, { id }) {
    const [k, v] = typeof id === 'string' ? id.split(':') : [];
    const ok = (k === 'h' && Object.hasOwn(CLASSES, v)) || (k === 'm' && Object.hasOwn(MOBS, v) && !!p.codex[v]);
    if (!ok || id !== `${k}:${v}`) fail('bad-avatar', 'Bu fotoğraf seçilemez.');
    p.avatar = id;
  },
  // Kader Çarkı: oranlar WHEEL.pool'da açık yazılıdır ve arayüzde gösterilir
  'wheel.spin'(p, { k }, env) {
    need(p, 'wheel');
    const free = k === 'ad'; // reklamla kazanılan ücretsiz çevirme (reklam.js: ad.claim 'cark'): parça gerekmez
    if (!free && !Object.hasOwn(SHARDS, k)) fail('bad-shard');
    if (free ? !(p.daily.adSpin > 0) : (p.shards[k] || 0) < WHEEL.cost) fail('no-shard', free ? 'Ücretsiz çevirme hakkın yok: reklam izle.' : `${WHEEL.cost} ${SHARDS[k]} gerekli.`);
    if (p.items.length >= BAG_LIMIT) fail('bag-full', 'Çanta dolu.');
    if (free) p.daily.adSpin--; else p.shards[k] -= WHEEL.cost;
    const i = weighted(env.rand, WHEEL.pool.map((x, j) => [j, x.w])), W = WHEEL.pool[i];
    let drop = W.give;
    if (drop === 'gear') drop = { t: 'item', b: pickGear(env.rand, tierForLevel(p.lvl)), g: REWARD_GRADE };
    else if (drop === 'unique') {
      drop = { t: 'item', b: pickFrom(env.rand, wheelUniques(p.lvl)), g: G_UNIQUE };
    }
    return { index: i, loot: grantAll(p, [drop], free ? { nt: 1 } : null) }; // reklamla gelen ücretsiz çevirmenin eşyası Satılamaz
  },
  // Su verme: +7 ve üstü eşya kalıcı olarak güçlenir, artısı sıfırlanır; başarısızlık yoktur
  'anvil.reforge'(p, { id }) {
    busy(p);
    const it = itemOf(p, id) || fail('no-item');
    if (it.r) fail('reforged', 'Bu eşyaya zaten su verilmiş.');
    if (it.p < REFORGE.minPlus) fail('low-plus', `Su vermek için eşya en az +${REFORGE.minPlus} olmalı.`);
    if (p.stones[2] < REFORGE.stones) fail('no-stone', `${REFORGE.stones} adet Usta Bileği Taşı gerekli.`);
    pay(p, 'akce', REFORGE.fee(it), 'Yeterli akçe yok.');
    p.stones[2] -= REFORGE.stones; it.r = 1; it.p = minPlus(it.b);
    return { item: it };
  },

  // ---- Yalnızca test sürümü ----
  'dev.energy'(p, _, env) { if (!env.dev) fail('forbidden'); p.energy = 120; },
  'dev.mastery'(p, _, env) { if (!env.dev) fail('forbidden'); const M = p.mastery = masteryOf(p); M.lvl = Math.min(MASTERY.maxLvl, M.lvl + 10); }, // ustalık +10 seviye
  'dev.level'(p, { lvl }, env) { if (!env.dev || !int(lvl, 1, GAME.maxLevel)) fail('forbidden'); const out = {}; p.lvl = lvl; p.xp = 0; addXp(p, 0, out); },
  'dev.give'(p, _, env) {
    if (!env.dev) fail('forbidden');
    p.akce += 50000; p.yakut += 500; p.san += 2000; p.toz += 2000; p.ore += 2000; p.seals += 3; p.charms += 3; p.embers = (p.embers || 0) + 3; p.berat = (p.berat || 0) + 5;
    p.stones = p.stones.map(n => n + 30); for (const k in SHARDS) p.shards[k] = (p.shards[k] || 0) + 30;
  },
  // Örs, katsayı ve nadirlik ekranlarını denemek için: seviyeye uygun kademeden artılı eşyalar ve bir eşsiz (çanta dolana kadar)
  'dev.gear'(p, _, env) {
    if (!env.dev) fail('forbidden');
    const t = tierForLevel(p.lvl), give = (b, g, plus) => { if (p.items.length < BAG_LIMIT) addItem(p, b, g, { p: plus }); };
    for (const [b, g, plus] of [[`w:sword:${t}`, 1, 5], [`w:axe2:${t}`, 1, 6], [`w:lance:${t}`, 1, 7], [`w:dagger:${t}`, 1, 7], [`w:staff:${t}`, 1, 8], [`w:mace:${t}`, 0, 9], [`w:shield:${t}`, 1, 3],
      [`a:warrior:${t}:chest`, 1, 4], [`a:rogue:${t}:gloves`, 0, 0], [`j:ear:${t}`, 1, 0], [`j:belt:${t}`, 1, 2], [`j:ring:${t}`, 0, 0], [`j:neck:${t}`, 1, 0]]) give(b, g, plus);
    give(wheelUniques(p.lvl).at(-1), G_UNIQUE, 8);
    // hazır 3B modelli eşyalar (items.js ITEM_GLB): görünümü denemek için
    for (const b of ['u:seraptigi', 'u:devcekic', 'u:lobocekici', 'u:karakanat', 'u:kitinsiper', 'u:ayazsiperi', 'u:capulcudisi', 'w:mace2:7:1', 'w:mace2:7', 'w:dagger:6', 'w:staff:0', 'w:staff:7', 'w:staff:7:1', 'u:kurtcekici', 'u:bozkurtcekici', 'u:kamtokmagi', 'w:bow:7', 'u:kitinyayi', 'u:tolunyayi', 'w:xbow:7', 'u:lugias', 'u:hanguk', 'u:kutsalasa', 'u:helenid', 'u:erenion', 'u:kanasa', 'u:garp', 'u:lycaonstaff', 'u:lupusstaff', 'u:lobostaff']) give(b, b[0] === 'u' ? G_UNIQUE : 1, 0);
    for (const b of KO_JEWEL_IDS) give(b, G_UNIQUE, 2); // KO takıları +2 (en üst)
    { const c = clsOf(p); for (const k of Object.keys(KO_ARMOR).filter(k => KO_ARMOR[k][0] === c)) for (const e of ARMOR_SLOTS) give(`u:${k}_${e}`, G_UNIQUE, 7); } // KO zırh setleri (ana kahramanın sınıfı)
    p.stones = p.stones.map(n => n + 200); p.akce += 5000000; p.charms += 10; p.embers = (p.embers || 0) + 10;
  },
  'dev.unlock'(p, _, env) { // bütün stage'leri 3 yıldızla açar (ekranları denemek için)
    if (!env.dev) fail('forbidden');
    for (let z = 1; z <= 4; z++) for (let n = 1; n <= 25; n++) p.stages[`${z}-${n}`] = 3;
    for (const id in MOBS) p.codex[id] = p.codex[id] || { k: 1, d: {} };
  },
  'dev.premium'(p, _, env) { if (!env.dev) fail('forbidden'); const t = (premTier(p, env.now) + 1) % PREMIUM.length; p.premium = { tier: t, until: t ? env.now + 30 * 86400000 : 0 }; },
};
