// Yapay oyuncular: meydan rakibi, Sancak Savaşı müttefiki/rakibi, kuşatma muhafızı, klan üyesi ve deneme sürümünün "dünyası".
// Sürüm 12: her yapay oyuncu, gerçek oyuncu gibi tek karakterdir (sınıfı tohumdan; botLook'taki fotoğrafla aynı sınıf).
// Gerçek bir hesapla aynı kurallardan geçer (seviye, puan dağılımı, kademe eşyası), yani hileli stat yoktur.
import { botRank } from './rutbe.js';
import { newPlayer } from './state.js';
import { CLASS_KEYS, TREE_MAX } from './content.js';
import { SKILLS } from './skills.js';
import { tierForLevel, ARMOR_SLOTS, minPlus } from './items.js';
import { partyUnits, partyPower, itemLevel, statPointsTotal, skillPointsTotal, unlockedSkills, LOADOUT_ACTIVES } from './hero.js';
import { rng, pickFrom } from './rng.js';
import { PATH, pathsOf, pathOf, specTrees } from './paths.js';

const BUILD = {
  warrior: { stats: ['str', 'str', 'vit'], trees: ['hucum', 'siper', 'ofke'], w: ['w:sword', 'w:shield'] },
  rogue:   { stats: ['dex', 'dex', 'vit'], trees: ['hancer', 'yay', 'iz'], w: ['w:dagger', 'w:dagger'] },
  priest:  { stats: ['int', 'vit', 'str'], trees: ['sifa', 'kutsama', 'lanet'], first: ['kutsama', 'lanet'], w: ['w:mace', 'w:shield'] }, // first: tek başına salt şifa ağacı savaşı bitiremez (ilk ağaç vuran ağaçlardan)
  mage:    { stats: ['mp', 'mp', 'int'], trees: ['ates', 'buz', 'yildirim'], w: ['w:staff'] },
};
// Yol başına yapay oyuncunun (ve simülasyonun) düzeni: yolun usta yeteneği açıksa o, ardından kit sırasıyla açık olan ilk
// iki yol aktifi; kalan yuva ağacın en ileri aktifiyle dolar. Sıra, yolun kendi içindeki bağını gözetir: patlatan ya da
// fırsat kollayan yetenekten önce onu besleyen (zehir, yanık, kanama, nişan) gelir. pas: yol pasifi önceliği · w: yolun
// silahı · heal: düzende ağaçtan bir şifa tutulur. Savaş içindeki kullanım önceliği motorun yapay zekâsındadır (battle.js: ai).
export const PATH_KIT = {
  sur:     { kit: ['a1', 'a2', 'a4', 'a3'], pas: ['p1', 'p3', 'p2'] },
  yaran:   { kit: ['a1', 'a4', 'a3', 'a2'], pas: ['p1', 'p3', 'p2'], w: ['w:axe2'] },
  agu:     { kit: ['a1', 'a4', 'a3', 'a2'], pas: ['p1', 'p3', 'p2'] },
  nisanci: { kit: ['a1', 'a4', 'a2', 'a3'], pas: ['p1', 'p2', 'p3'], w: ['w:bow'] },
  otaci:   { kit: ['a1', 'a4', 'a2', 'a3'], pas: ['p1', 'p3', 'p2'], heal: true },
  bozan:   { kit: ['a4', 'a2', 'a1', 'a3'], pas: ['p1', 'p2', 'p3'], heal: true },
  alaz:    { kit: ['a1', 'a3', 'a2', 'a4'], pas: ['p1', 'p2', 'p3'] },
  boran:   { kit: ['a1', 'a2', 'a4', 'a3'], pas: ['p3', 'p1', 'p2'] },
};
const isHeal = S => (S.target === 'ally' || S.target === 'allies') && S.fx.some(f => f.k === 'heal');
// Kahramanın düzenini kurar: yolu varsa kit önceliğiyle, yoksa eskisi gibi ağacın en ileri üç aktifi ve ilk pasifi.
// Gerçek hesapla aynı kuraldan geçer: yalnızca açık yetenekler (unlockedSkills) düzene girer.
export function botLoadout(p, id) {
  const h = p.heroes[id], path = pathOf(h), K = path && p.lvl >= PATH.level ? PATH_KIT[path] : null;
  const open = unlockedSkills(p, id).map(x => SKILLS[x]).sort((a, b) => (b.req || 0) - (a.req || 0));
  const tree = open.filter(s => s.type === 'active' && !s.path), mine = open.filter(s => s.path);
  let act = [];
  if (K) {
    const master = mine.find(s => s.pm && s.type === 'active');
    act = [...(master ? [master] : []), ...K.kit.map(k => mine.find(s => s.id === `${path}_${k}`)).filter(Boolean).slice(0, 2)];
  }
  for (const s of tree) if (act.length < LOADOUT_ACTIVES && !act.includes(s)) act.push(s);
  if (K?.heal || h.cls === 'priest') { // şifasız rahip tek başına ayakta kalamaz: ağacın en güçlü şifası (parti şifası tek hedeflinin üç katı sayılır) düzende kalır
    const worth = S => S.fx.filter(f => f.k === 'heal').reduce((a, f) => a + (f.m || 0) + (f.pct || 0) * 5, 0) * (S.target === 'allies' ? 3 : 1);
    const heal = tree.filter(isHeal).sort((a, b) => worth(b) - worth(a))[0];
    if (heal && !act.includes(heal)) act = [heal, ...act].slice(0, LOADOUT_ACTIVES);
  }
  // Düzende en az iki vuran yetenek olsun (yalnız güçlendirmeyle dolan düzen tek başına savaşı bitiremez)
  const hits = S => S.fx.some(f => f.k === 'dmg');
  for (const s of tree.filter(hits)) { if (act.filter(hits).length >= 2) break; if (act.includes(s)) continue; const i = act.map(hits).lastIndexOf(false); if (act.length < LOADOUT_ACTIVES) act.push(s); else if (i >= 0) act[i] = s; }
  h.act = act.map(s => s.id);
  h.pas = open.find(s => s.type === 'passive' && !s.path)?.id || null;
  h.ppas = (K ? K.pas.map(k => mine.find(s => s.id === `${path}_${k}`)).find(Boolean)?.id : null) || null;
}
const N1 = ['Kara', 'Boz', 'Ak', 'Demir', 'Yaman', 'Gök', 'Kızıl', 'Deli', 'Koca', 'Tunç', 'Çelik', 'Yalın', 'Sarp', 'Alp', 'Uzun'];
const N2 = ['Kurt', 'Şahin', 'Bora', 'Tekin', 'Yürek', 'Bilek', 'Doğan', 'Ozan', 'Timur', 'Kaya', 'Pusat', 'Alaz', 'Ayaz', 'Tuğ', 'Erdem'];
export const botName = rand => pickFrom(rand, N1) + pickFrom(rand, N2);
// Ad bir yapay oyuncu adıyla çakışıyor mu (karakter adı teklik denetimi, account.js)
const BOT_NAMES = new Set(N1.flatMap(a => N2.map(b => (a + b).toLocaleLowerCase('tr-TR'))));
export const isBotName = name => BOT_NAMES.has(String(name).trim().toLocaleLowerCase('tr-TR'));
// Yapay oyuncunun sınıfı: tohumdan (botLook fotoğrafıyla aynı)
export const botClass = seed => CLASS_KEYS[(seed >>> 0) % CLASS_KEYS.length];
const C1 = ['Bozkurt', 'Demir', 'Kor', 'Ayaz', 'Tuğ', 'Yalın', 'Kutlu', 'Sarp'], C2 = ['Ocağı', 'Sancağı', 'Akıncıları', 'Erleri', 'Boyu', 'Yoldaşları'];
export const botClanName = rand => pickFrom(rand, C1) + ' ' + pickFrom(rand, C2);

// quality 0..1: eşya doluluğu, kalitesi ve artısı
export function botPlayer(seed, lvl, quality, faction) {
  const rand = rng(seed >>> 0), prand = rng((seed ^ 0x5a17c0de) >>> 0); // yol seçimi ayrı akıştan: öbür seçimlerin zar sırası değişmez
  const p = newPlayer({ name: botName(rand), faction: faction || (rand() < 0.5 ? 'ocak' : 'sancak'), cls: botClass(seed) }, 0);
  p.lvl = Math.max(1, Math.min(65, Math.round(lvl))); p.bot = true; p.items = [];
  const tier = tierForLevel(p.lvl), g = quality > 0.4 ? 1 : 0, plus = Math.min(8, Math.floor(quality * 8)), fill = 0.35 + 0.65 * quality;
  for (const c of [p.heroes.h0.cls]) {
    const h = p.heroes.h0, B = BUILD[c];
    h.eq = {};
    const n = statPointsTotal(p.lvl);
    B.stats.forEach((s, i) => { h.pts[s] = (h.pts[s] || 0) + Math.floor(n / 3) + (i < n % 3 ? 1 : 0); });
    // Uzmanlık yolu: seçilebildiği seviyeden sonra her yapay kahraman sınıfının iki yolundan birindedir; puanlar önce
    // uzmanlığın ağacına, artanı ortak ağaca (paths.js specTrees)
    if (p.lvl >= PATH.level) { const ps = pathsOf(c); h.path = ps[Math.floor(prand() * ps.length)]; h.pn = 1; }
    const sp = skillPointsTotal(p.lvl), [t2, t1] = specTrees(c, h.path || null);
    h.tree = {}; if (t1 && sp) h.tree[t1] = Math.min(TREE_MAX, sp); const rest = t1 ? sp - Math.min(TREE_MAX, sp) : sp; if (rest > 0) h.tree[t2] = Math.min(TREE_MAX, rest);
    botLoadout(p, 'h0');
    const put = (slot, b) => { const it = { id: p.nextItem++, b, g, p: Math.max(plus, minPlus(b)) }; p.items.push(it); h.eq[slot] = it.id; };
    const W = (h.path && PATH_KIT[h.path].w) || B.w; // yolun silahı (Zırh Yaran teber, Keskin Nişancı yay)
    put('wr', `${W[0]}:${tier}`); if (W[1]) put('wl', `${W[1]}:${tier}`);
    for (const s of ARMOR_SLOTS) if (rand() < fill) put(s, `a:${c}:${tier}:${s}`);
    const ml = c === 'mage' && h.path ? (h.path === 'alaz' ? 'kor' : 'simsek') : null; // yapay büyücü kendi uzmanlığının saf hasar takısını takar
    for (const [slot, j] of [['ear1', 'ear'], ['ear2', 'ear'], ['neck', 'neck'], ['ring1', 'ring'], ['ring2', 'ring'], ['belt', 'belt']]) if (rand() < fill) put(slot, `j:${ml && j !== 'belt' ? `${ml}_${j}` : j}:${tier}`);
  }
  return p;
}
export function botParty(seed, lvl, quality, faction) {
  const p = botPlayer(seed, lvl, quality, faction);
  return { id: `bot:${seed >>> 0}:${p.lvl}:${Math.round(quality * 100)}`, name: p.name, faction: p.faction, lvl: p.lvl, power: partyPower(p), il: itemLevel(p), units: partyUnits(p), bot: true };
}

// Yapay oyuncu kimliği (bot:tohum:seviye:kalite) → aynı parti yeniden üretilir (oyuncu kartı, özel mesaj)
export const isBot = id => typeof id === 'string' && id.startsWith('bot:');
// Tohumdan türeyen kısa kimlik (parti kurmadan): botFromId'nin vereceği ad ve tarafla aynıdır
export function botBrief(seed) { const rand = rng(seed >>> 0); return { name: botName(rand), faction: rand() < 0.5 ? 'ocak' : 'sancak' }; }
// Yapay oyuncunun profil fotoğrafı ve (dünya tek tip görünmesin diye bir kısmında) üyelik kademesi: kimlikten türetilir
export function botLook(id) { const [, sd, lv] = String(id).split(':'), seed = +sd || 0; return { av: 'h:' + CLASS_KEYS[seed % CLASS_KEYS.length], tier: seed % 5 === 0 ? 1 + (seed >>> 3) % 3 : 0, rk: botRank(+lv || 20) }; }
export function botFromId(id) {
  const [, seed, lvl, q] = String(id).split(':').map(Number);
  if (!Number.isFinite(seed)) return null;
  return botParty(seed, lvl || 20, (q || 50) / 100);
}
// Yapay oyuncuların sohbet cümleleri (deneme sürümünde sohbet boş kalmasın)
export const BOT_LINES = [
  'Selam millet', 'Ova Beyi bugün kime eşsiz düşürdü?', '+7 basan var mı, elinizi öpeyim', 'Kül Geçidi 15 çok sert vuruyor',
  'Pazarda Nadir yüzük arıyorum', 'Klanımıza alım var, seviye 30 üstü', 'Dipsiz Kuyu 8. dalgada yine kaldım', 'Usta taşı kaça gidiyor şu an?',
  'Akın birazdan açılıyor', 'Kızıl Bahar Meydanı yaratıkları rahipsiz geçilmiyor', 'Çarktan eşsiz çıktı sonunda!', 'Meydanda Şampiyon ligine çıkan var mı',
  'Elentha bu hafta seferi alır', 'Kragmir geri adım atmaz', 'Maden gece boyu iyi biriktirmiş', 'Sisli Çukur 20 için ateş büyücüsü şart',
  'iyi oyunlar herkese', 'Su verilmiş kılıç fark ediyor gerçekten', 'Tepegöz avına 5 dk kala', 'Yeraltı Ocağı 25. kat boss zor mu?',
];
export const BOT_REPLIES = ['Selam! Şu an savaştayım, sonra yazarım.', 'Eyvallah, kolay gelsin.', 'Pazara bak, orada var.', 'Klanda konuşalım mı?', 'Meydanda görüşürüz.'];
