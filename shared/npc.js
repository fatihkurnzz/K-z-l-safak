// Yemin Pazarı NPC'leri: Tüccar (akçeyle temel silah, zırh ve malzeme satar; çantadaki eşyayı alır). Öğreticide ilk alışveriş
// buradan yapılır (p.tut.f.buy). Mal listesi oyuncunun kademesine göre değişir; her ürün Standart nadirlikte satılır.
// Raflar sabittir; zırh rafı her gün (gün anahtarı + kademe tohumuyla) 12 parçaya döner. Her ürünün günlük alım sınırı vardır.
import { fail, addItem, removeItems, bump, grantAll } from './util.js';
import { BAG_LIMIT, CLASS_KEYS, dayKey, UNLOCK } from './content.js';
import { CLASS_WC, tierForLevel, itemBase, sellPrice, refPrice, WEAPONS, ARMOR_SLOTS, hasTier, variantIds, PAPER_IDS } from './items.js';
import { itemOf, equippedIds } from './hero.js';
import { clsOf } from './roster.js';
import { rng } from './rng.js';
import { POT, POT_KEYS, potPrice, potsOf } from './mana.js';

export const NPC = { merchant: { name: 'Tüccar Halvor' }, child: { name: 'Küçük Bran' }, sibling: 'Nessa', apothecary: { name: 'İksirci Maelis' } };
// Fiyat: pazarın referans fiyatına (items.js refPrice; yapay satıcıların ilanları bunun ×0,7–1,6'sıdır) bağlı, üstüne kolaylık
// primi (×1,4). Kademe 0 silah ≈ 85 akçe: öğreticideki ilk alım başlangıç akçesiyle (500) rahatça yapılır.
export const NPC_MARKUP = 1.4;
export const npcPrice = (b, k = 1) => Math.max(10, Math.round(refPrice({ b, g: 0, p: 0 }) * NPC_MARKUP * k / 5) * 5);
export const NPC_DAILY = 3;                                   // bir ürünü günde en çok bu kadar alabilirsin
const PIECE_K = { helm: 0.6, chest: 1.0, legs: 0.8, gloves: 0.5, boots: 0.5 };
const EXTRA_W = ['axe2', 'spear', 'bow', 'shield'];           // sınıf silahlarına ek raf: çift el balta, mızrak, yay, kalkan
// Malzeme rafı: Örste harcanan kaynaklar; pahalıdır (örste üretmekten ve madenden kârlı değildir), günlük sınırlıdır
export const NPC_MATS = [
  { id: 'm:dust', name: 'Örs Tozu Kesesi', desc: '+20 Örs Tozu', price: 900, max: 5, icon: 'toz' },
  { id: 'm:stone0', name: 'Kaba Bileği Taşı', desc: '+1 Kaba Bileği Taşı', price: 1500, max: 5, icon: 'stone0' },
];
const keyOf = id => 'npc_' + id.replace(/\W/g, '_');
export const npcLeft = (p, id, max = NPC_DAILY) => Math.max(0, max - ((p.daily && p.daily[keyOf(id)]) || 0));

// Sınıf silahları (öğreticideki ilk alım buradan): [{ id: sınıf, cls, b, price }]
export function merchantStock(p) {
  const t = tierForLevel(p.lvl);
  return Object.entries(CLASS_WC).map(([cls, type]) => ({ id: `${cls}`, cls, b: `w:${type}:${t}`, price: npcPrice(`w:${type}:${t}`) }));
}
// Bütün raflar. now: günlük dönüş için; { weapons, armors, mats }
export function merchantShelves(p, now) {
  const t = tierForLevel(p.lvl);
  const weapons = [...merchantStock(p), ...EXTRA_W.filter(w => hasTier(w, t)).map(w => ({ id: `x:${w}`, cls: WEAPONS[w].cls[0], b: `w:${w}:${t}`, price: npcPrice(`w:${w}:${t}`) }))];
  const all = [];
  // zırh havuzu ek setlerin (items-var.js) parçalarını da içerir: kimlik a:<sınıf>:<parça>[:<varyant>]
  for (const cls of CLASS_KEYS) for (const e of ARMOR_SLOTS) variantIds(`a:${cls}:${t}:${e}`).forEach((b, v) => all.push({ id: `a:${cls}:${e}${v ? ':' + v : ''}`, cls, b, price: npcPrice(b, PIECE_K[e] * 0.9) }));
  const rand = rng(dayKey(now) * 131 + t * 7 + 11), pool = [...all], armors = [];
  while (armors.length < 12) armors.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
  armors.sort((a, b) => all.indexOf(a) - all.indexOf(b));
  // Paper Mage setleri (Linen / Wool, HP ya da MP basılı) her zaman rafta, +1 (kullanıcı 19 Kas)
  for (const b of PAPER_IDS) armors.push({ id: `p:${b.slice(2)}`, cls: 'mage', b, price: npcPrice(b, PIECE_K[itemBase(b).type] * 0.9) });
  return { weapons, armors, mats: NPC_MATS, pots: npcPots(p), t };
}
// İksir rafı (mana.js): fiyat seviyeyle büyür, günlük sınır yok; taşınabilen en çok POT.max. Alınan iksir çantada yer kaplamaz.
export const POT_PACKS = [1, 5, 10];
export const npcPots = p => POT_KEYS.map(k => ({ k, name: POT[k].name, pct: POT[k].pct, price: potPrice(k, p.lvl), have: potsOf(p)[k] }));
// İksir ve Parşömen dükkânı (sürüm 13, başkentte; İksirci Maelis): iksirler (npc.pot) ve parşömenler (npc.scroll).
// Parşömenler var olan sistemleri kullanır, yeni mekanik eklemez: Enerji Parşömeni enerji verir (Kervan'daki Enerji Erzağı'nın
// akçeyle alınan küçük hâli), Meydan Parşömeni o güne bir meydan hakkı ekler (Kervan'daki Meydan Bileti gibi: p.daily.arenaBonus).
// Fiyat seviyeyle büyür; günlük sınır vardır (akçe gideri, yakut ürünlerinin yerini tutmaz).
const r5 = n => Math.round(n / 5) * 5;
export const NPC_SCROLLS = [
  { id: 's:energy', name: 'Enerji Parşömeni', desc: '+20 enerji. Enerji sınırını aşabilir.', icon: 'energy', max: 2, cost: L => r5(60 + 8 * L), give: [{ t: 'energy', n: 20 }] },
  { id: 's:arena', name: 'Meydan Parşömeni', desc: 'Bugün için +1 meydan hakkı.', icon: 'arena', max: 1, unlock: 'arena', cost: L => r5(120 + 10 * L), arena: 1 },
];
export const npcScrolls = p => NPC_SCROLLS.map(x => ({ ...x, price: x.cost(p.lvl), left: npcLeft(p, x.id, x.max), lock: x.unlock && p.lvl < UNLOCK[x.unlock] ? UNLOCK[x.unlock] : 0 }));
export const NPC_HANDLERS = {
  'npc.buy'(p, { id }, env) {
    if (p.battle) fail('in-battle', 'Savaş sürerken alışveriş yapılamaz.');
    if (typeof id !== 'string') fail('bad-item', 'Tüccarın böyle bir malı yok.');
    const S = merchantShelves(p, env && env.now || Date.now());
    const mat = S.mats.find(x => x.id === id);
    const it = mat || [...S.weapons, ...S.armors].find(x => x.id === id);
    if (!it) fail('bad-item', 'Tüccarın böyle bir malı yok.');
    const max = mat ? mat.max : NPC_DAILY;
    if (npcLeft(p, id, max) <= 0) fail('daily-limit', 'Tüccarın bu maldan bugünkü stoku bitti.');
    if (!mat && p.items.length >= BAG_LIMIT) fail('bag-full', 'Çanta dolu.');
    if (p.akce < it.price) fail('no-akce', 'Akçen yetmiyor. Biraz daha yaratık kes.');
    p.akce -= it.price;
    if (!p.daily) p.daily = { q: {}, qdone: {}, boss: {} };
    p.daily[keyOf(id)] = (p.daily[keyOf(id)] || 0) + 1;
    if (mat) { if (id === 'm:dust') p.toz += 20; else { p.stones = p.stones || [0, 0, 0]; p.stones[0] = (p.stones[0] || 0) + 1; } return { mat: id, price: it.price }; }
    const item = addItem(p, it.b, 0);
    if (p.tut && !p.tut.end && !p.tut.f.buy && CLASS_WC[id] && it.cls === clsOf(p)) { p.tut.f.buy = 1; p.tut.f.buyId = item.id; p.tut.f.buyCls = it.cls; }
    return { item: item.id, b: item.b, price: it.price };
  },
  'npc.pot'(p, { k, n = 1 }) {
    if (p.battle) fail('in-battle', 'Savaş sürerken alışveriş yapılamaz.');
    if (!POT_KEYS.includes(k) || !POT_PACKS.includes(n)) fail('bad-item', 'Tüccarın böyle bir malı yok.');
    const have = potsOf(p);
    if (have[k] + n > POT.max) fail('pot-full', `En çok ${POT.max} ${POT[k].name} taşıyabilirsin.`);
    const price = potPrice(k, p.lvl) * n;
    if (p.akce < price) fail('no-akce', 'Akçen yetmiyor. Biraz daha yaratık kes.');
    p.akce -= price; p.pots = { ...have, [k]: have[k] + n };
    return { k, n, price, have: p.pots[k] };
  },
  'npc.scroll'(p, { id }) {
    if (p.battle) fail('in-battle', 'Savaş sürerken alışveriş yapılamaz.');
    const x = typeof id === 'string' && npcScrolls(p).find(s => s.id === id);
    if (!x) fail('bad-item', 'Dükkânda böyle bir parşömen yok.');
    if (x.lock) fail('locked', `${x.lock}. seviyede açılır.`);
    if (x.left <= 0) fail('daily-limit', 'Bu parşömenden bugünkü stok bitti.');
    if (p.akce < x.price) fail('no-akce', 'Akçen yetmiyor. Biraz daha yaratık kes.');
    p.akce -= x.price;
    if (!p.daily) p.daily = { q: {}, qdone: {}, boss: {} };
    p.daily[keyOf(id)] = (p.daily[keyOf(id)] || 0) + 1;
    if (x.arena) p.daily.arenaBonus = (p.daily.arenaBonus || 0) + x.arena;
    const loot = x.give ? grantAll(p, x.give) : [];
    return { id, price: x.price, left: x.left - 1, loot };
  },
  // Çantadaki kuşanılmamış eşyayı tüccara anında sat (fiyat: sellPrice; Örs'teki satışla aynıdır, ilandan çok düşüktür)
  'npc.sell'(p, { ids }) {
    if (p.battle) fail('in-battle', 'Savaş sürerken alışveriş yapılamaz.');
    if (!Array.isArray(ids) || !ids.length || ids.length > BAG_LIMIT || new Set(ids).size !== ids.length) fail('bad-items');
    const eq = equippedIds(p);
    const items = ids.map(id => { const it = itemOf(p, id); if (!it) fail('no-item'); if (eq.has(id)) fail('item-equipped', 'Kuşanılmış eşya önce çıkarılmalı.'); return it; });
    const akce = items.reduce((a, it) => a + sellPrice(it), 0);
    removeItems(p, ids); p.akce += akce; bump(p, 'break', ids.length);
    return { akce, n: ids.length };
  },
};
