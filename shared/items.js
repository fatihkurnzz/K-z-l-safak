// Eşya tablosu: 13 yuva, 8 kademe, 3 nadirlik (Standart, Nadir, Eşsiz). Görünen eşya adları kullanıcının verdiği listeden telif taramasını
// geçmiş genel adlardır, İngilizce ve birebir (docs/telif-riskli-esya-adlari.pdf). Statlar o listeden alınmaz: kademe × tür formülündendir.
// Eşya örneği: { id, b: taban kimliği, g: nadirlik (0-2), p: artı seviyesi (0-10), r: su verilmişse 1 }
import { CLASSES, CLASS_KEYS, factionBonus, withPct } from './content.js';
import { hqPct } from './clan.js';
import { pickFrom } from './rng.js';
import { W_VAR, A_VAR, J_VAR } from './items-var.js'; // esya3: aynı tür ve kademede ek adlı tabanlar (varyantlar)

export const SLOTS = {
  wr: 'Sağ El', wl: 'Sol El', helm: 'Baş', chest: 'Gövde', legs: 'Bacak', gloves: 'El', boots: 'Ayak',
  ear1: 'Küpe', ear2: 'Küpe', neck: 'Kolye', ring1: 'Yüzük', ring2: 'Yüzük', belt: 'Kemer',
};
export const SLOT_KEYS = Object.keys(SLOTS);

// mult: saldırı/büyü/savunma/can çarpanı · coef: savunma katsayısı, direnç ve savunma delme çarpanı
// Eşsiz eşyanın statları tabanında yazılıdır (çarpanı 1); nadirliği tabanından gelir, sonradan değişmez.
export const GRADES = [
  { name: 'Standart', mult: 1.0, coef: 1,   color: '#b9c0c8' },
  { name: 'Nadir',    mult: 1.3, coef: 1.5, color: '#4aa3ff' },
  { name: 'Eşsiz',    mult: 1.0, coef: 1,   color: '#ffb52e' },
];
export const G_UNIQUE = 2;
// Kademe: gereken seviye, silah malzemesi, takı malzemesi
export const TIERS = [
  { req: 1,  mat: 'Paslı',    gem: 'Bakır' },
  { req: 10, mat: 'Demir',    gem: 'Pirinç' },
  { req: 20, mat: 'Çelik',    gem: 'Gümüş' },
  { req: 30, mat: 'Dövme',    gem: 'Akik' },
  { req: 40, mat: 'Kızıl',    gem: 'Altın' },
  { req: 50, mat: 'Tunç',     gem: 'Zümrüt' },
  { req: 60, mat: 'Kara',     gem: 'Safir' },
  { req: 63, mat: 'Efsunlu',  gem: 'Elmas' },
];

// ---- Savunma katsayıları, element dirençleri, savunma delme ----
// Saldırının türü, saldıranın elindeki silahtan gelir (silah sınıfı); yeteneğin elementi varsa o da eklenir.
// Savunan, o silah sınıfına ve o elemente karşı katsayısı kadar az hasar alır (toplamı COEF.resCap ile sınırlıdır).
// Savunma delme, hedefin savunmasının o kadarını yok sayar (COEF.penCap ile sınırlıdır).
// Katsayılar erken kademelerde yoktur: COEF.minTier (30. seviye) ve üstündeki eşyalarda küçük değerlerle başlar.
export const WEAPON_CLASS = { sword: 'Kılıç', axe: 'Balta', spear: 'Mızrak', dagger: 'Hançer', bow: 'Ok', mace: 'Topuz', staff: 'Asa' }; // spear: Mızrak ve Uzun Mızrak (Raptor dahil); rSpear veren eşya henüz yok
export const ELEMENTS = { fire: 'Ateş', ice: 'Buz', bolt: 'Yıldırım' };
export const RES_KEYS = [...Object.keys(WEAPON_CLASS), ...Object.keys(ELEMENTS), 'poison', 'magic']; // poison: zehir direnci (zehirli silah efektini azaltır; Chitin Bow) · magic: büyü hasarı direnci (battle.js damage, f.magic)
export const resKey = k => 'r' + k[0].toUpperCase() + k.slice(1);          // sword → rSword (eşya statı anahtarı)
export const COEF_KEYS = [...RES_KEYS.map(resKey), 'pen'];
export const isCoef = k => COEF_KEYS.includes(k);
// Silah efektleri (VAHRAN). Efektli silahla yapılan her isabet, vurulan hasarın WFX_PCT'si kadar EK hasar verir: tek seferlik,
// birikmez, süre yoktur. Hasarın türü efektin adıdır (poison/flame/lightning/glacier); hedefin aynı adlı direnci (res[tür],
// en çok COEF.resCap) bu ek hasarı azaltır. Yeni efekt: buraya bir satır. Bir silaha efekt vermek: eşyada `fx` ya da
// silah türü/taban tanımında `fx` alanı. Efekti olmayan +7 ve üstü silah zehirlidir (POISON_MIN).
export const WEAPON_FX = {
  poison:    { name: 'Zehir',  icon: '☠', color: 0xd63cff },
  flame:     { name: 'Alev',   icon: '🔥', color: 0xff6a1e },
  lightning: { name: 'Şimşek', icon: '⚡', color: 0x6ad8ff },
  glacier:   { name: 'Buzul',  icon: '❄', color: 0x9ee8ff },
};
export const WFX_PCT = 0.01, POISON_MIN = 7;
// Eşyanın silah efekti (anahtar) ya da null. Kalkan ve zırh efekt taşımaz.
export function weaponFx(it) {
  if (!it) return null;
  const B = itemBase(it.b);
  if (!B || B.kind !== 'weapon') return null;
  if (it.fx && WEAPON_FX[it.fx]) return it.fx;
  if (B.fx && WEAPON_FX[B.fx]) return B.fx;
  if (SPECIAL[it.b]) return null; // birebir değerli eşya: efekti yalnız kendi elementi (SPECIAL el)
  return (it.p || 0) >= POISON_MIN ? 'poison' : null;
}
export const COEF = { minTier: 3, resCap: 0.4, penCap: 0.5, res: t => 0.02 + 0.005 * (t - 3), pen: t => 0.02 + 0.005 * (t - 3) };
const r4 = v => Math.round(v * 10000) / 10000;

// hands: 2 ise sol eli de kaplar · model: 3D silah türü · wc: silah sınıfı · penK: savunma delme çarpanı
// names: kademe sırasıyla eşya adları · from: türün ilk kademesi (adı olmayan alt kademeler yoktur; itemBase null döner)
export const WEAPONS = {
  sword:  { name: 'Kılıç',         cls: ['warrior'], hands: 1, slots: ['wr', 'wl'], model: 'sword',  wc: 'sword',  penK: 1,   stats: t => ({ atk: 10 + 9 * t }) },
  axe1:   { name: 'Balta',         cls: ['warrior'], hands: 1, slots: ['wr', 'wl'], model: 'axe',    wc: 'axe',    penK: 1.3, stats: t => ({ atk: 10 + 9 * t }) },
  sword2: { name: 'Çift El Kılıç', cls: ['warrior'], hands: 2, slots: ['wr'],       model: 'sword',  wc: 'sword',  penK: 1.1, stats: t => ({ atk: 16 + 14 * t, crit: 0.02 }) },
  axe2:   { name: 'Çift El Balta', cls: ['warrior'], hands: 2, slots: ['wr'],       model: 'axe',    wc: 'axe',    penK: 1.4, stats: t => ({ atk: 17 + 15 * t }) },
  spear:  { name: 'Mızrak',        cls: ['warrior'], hands: 2, slots: ['wr'],       model: 'spear',  wc: 'spear',  penK: 1.2, stats: t => ({ atk: 15 + 13 * t, spd: 2 }) },
  lance:  { name: 'Uzun Mızrak',   cls: ['warrior'], hands: 2, slots: ['wr'],       model: 'scythe', wc: 'spear',    penK: 1.0, stats: t => ({ atk: 17 + 15 * t, hp: 10 + 8 * t }) },
  mace2:  { name: 'Çift El Topuz', cls: ['warrior'], hands: 2, slots: ['wr'],       model: 'club',   wc: 'mace',   penK: 1.0, stats: t => ({ atk: 16 + 14 * t, def: 2 + 2 * t }) },
  dagger: { name: 'Hançer',        cls: ['rogue'],   hands: 1, slots: ['wr', 'wl'], model: 'dagger', wc: 'dagger', penK: 0.6, stats: t => ({ atk: 7 + 6 * t, crit: 0.01 }) },
  jamadar: { name: 'Jamadar',      cls: ['rogue'],   hands: 1, slots: ['wr', 'wl'], model: 'dagger', wc: 'dagger', penK: 0.8, from: 1, stats: t => ({ atk: 8 + 7 * t }) },
  bow:    { name: 'Yay',           cls: ['rogue'],   hands: 2, slots: ['wr'],       model: 'bow',    wc: 'bow',    penK: 1.2, stats: t => ({ atk: 14 + 12 * t, spd: 3 }) },
  xbow:   { name: 'Arbalet',       cls: ['rogue'],   hands: 2, slots: ['wr'],       model: 'bow',    wc: 'bow',    penK: 1.5, from: 4, stats: t => ({ atk: 16 + 14 * t, spd: 1 }) },
  mace:   { name: 'Topuz',         cls: ['priest'],  hands: 1, slots: ['wr', 'wl'], model: 'mace',   wc: 'mace',   penK: 0.8, stats: t => ({ atk: 8 + 7 * t, mag: 9 + 8 * t }) },
  staff:  { name: 'Asa',           cls: ['mage'],    hands: 2, slots: ['wr'],       model: 'staff',  wc: 'staff',  penK: 1.2, stats: t => ({ mag: 17 + 15 * t, elx: 7 + 12 * t }) }, // elx: asanın element hasarı; kuşananın uzmanlığına göre Alev ya da Yıldırım olur (hero.js)
  shield: { name: 'Kalkan',        cls: ['warrior', 'priest'], hands: 1, slots: ['wl'], model: 'shield', stats: t => ({ def: 6 + 5 * t, hp: 30 + 25 * t }) },
};
// KO ölçeği (19 Kas, kullanıcı: "sıradan eşyaları KO ölçeğine çek"): sıradan silahlar, kullanıcının verdiği birebir KO
// eşyalarının (SPECIAL) biraz altında kalacak şekilde ölçeklenir. Eşsizler ve başlangıç silahları aynı formülden geldiği için
// onlar da ölçeklenir. Kalkan, zırh ve takıya dokunulmadı (Dread Shield dışında KO karşılaştırması yok).
// Asa: KO asalarında büyü değeri yok; büyü yarıya, element hasarı Elixir/Oasis düzeyine indi.
// KO_EXEMPT: sıradan olmayan (kullanıcıya göre) kademe tabanları ölçeklenmez, eski değerini korur
export const KO_EXEMPT = new Set(['w:dagger:7']); // Shard
export const KO_SCALE = { atk: 0.7, mace: { atk: 0.65, mag: 0.65 }, staff: { mag: 0.5, elx: 0.65 } };
for (const [type, W] of Object.entries(WEAPONS)) {
  if (type === 'shield') continue;
  const S0 = W.raw = W.stats, k = KO_SCALE[type] || { atk: KO_SCALE.atk };
  W.stats = t => { const s = S0(t); for (const key in k) if (s[key]) s[key] = Math.round(s[key] * k[key] * 100) / 100; return s; };
}
export const WEAPON_NAMES = {
  sword: ['Short Sword', 'Long Sword', 'Scimitar', 'Sabre', 'Rapier', 'Crescent', 'Blade', 'Slayer'],
  sword2: ['Bastard Sword', 'Two-Handed Sword', 'Battle Sword', 'Great Sword', 'Claymore', 'Flamberge', 'Double Blade', 'Destroyer'],
  axe1: ['Stone Axe', 'Hand Axe', 'Double Axe', 'Bipennis', 'Military Pick', 'Cleaver Axe', 'Tomahawk', 'Deep Scar'],
  axe2: ['Battle Axe', 'Timber Axe', 'Twin Axe', 'Great Axe', 'Broad Axe', 'Bone Axe', 'Bone Cleaver', 'Blade Axe'],
  spear: ['Spear', 'Cross Spear', 'Spetum', 'Long Spear', 'Pike', 'Trident', 'Harpoon', 'Totemic Spear'],
  lance: ['Raptor', 'Battle Scythe', 'War Scythe', 'Grim Scythe', 'Bill', 'Halberd', 'Bardish', 'Glaive'],
  mace2: ['Great Maul', 'Battle Mace', 'War Club', 'Great Mace', 'Weight Hammer', 'Large Breaker', 'Large Hacker', 'Iron Impact'],
  mace: ['Maul', 'Mace', 'War Hammer', 'Breaker', 'Hacker', 'Cracker', 'Bone Crasher', 'Impact'],
  dagger: ['Dagger', 'Knife', 'Stiletto', 'Assassin Dagger', 'Sword breaker', 'Kukry', 'Mirage Dagger', 'Shard'],
  jamadar: [null, 'Jamadar', 'Half moon Jamadar', 'Ripper\'s Jamadar', 'Wind storm', 'Abyss Jamadar', 'Blood finger', 'True silver'],
  bow: ['Training Bow', 'Bow', 'Short Bow', 'Bamboo Bow', 'Hunter\'s Bow', 'Composite Bow', 'Horn Bow', 'Iron Bow'],
  xbow: [null, null, null, null, 'Crossbow', 'Cross Bow', 'Horn Crossbow', 'Iron Crossbow'],
  staff: ['Wood Staff', 'Wizard Staff', 'Bone Staff', 'Mage Staff', 'Alchemy Staff', 'Elemental Staff', 'Salamander Staff', 'Elixir Staff'],
  shield: ['Wooden Shield', 'Small Shield', 'Round Shield', 'Large Shield', 'Kite Shield', 'Octagon Shield', 'Large Kite Shield', 'Plate Shield'],
};
for (const k in WEAPONS) WEAPONS[k].names = WEAPON_NAMES[k];
// Türün o kademesi var mı (Arbalet ve Jamadar alt kademelerde yoktur)
export const hasTier = (type, t) => !!(WEAPONS[type] && TIERS[t] && WEAPON_NAMES[type]?.[t]);
// Kahramanın sağ eli boşken sayılan silah sınıfı
export const CLASS_WC = { warrior: 'sword', rogue: 'dagger', priest: 'mace', mage: 'staff' };

// İlk Alım Paketi silahları (gerçek parayla, tek seferlik; shared/pay.js). Taban kimliği "s:<anahtar>". Statlar silah türünün
// STARTER.t kademesindeki değerinin STARTER.mult katıdır (erken oyunda belirgin, ~20. seviyeden sonra kademe eşyası geçer).
// Düşme tablosunda ve çarkta yoktur; yalnızca pakette verilir. img: public/img/silah/<img>-<insan|ork>.webp (ad: güvenli listeden)
export const STARTER = { t: 1.2, mult: 1.5, req: 5 };
export const STARTER_WEAPONS = {
  asa:    { name: 'Hero Staff',  type: 'staff',  img: 'asa' },
  hancer: { name: 'Hero Knife',   type: 'dagger', img: 'hancer' },
  kalkan: { name: 'Guardian Shield of Captain',   type: 'shield', img: 'kalkan' },
  tirpan: { name: 'Harsh Scythe',   type: 'mace',   img: 'tirpan' },
};
export const starterBases = () => Object.keys(STARTER_WEAPONS).map(k => 's:' + k);

// Sınıf zırh setleri (kademe sırasıyla): set adı ve parça adları (Baş, Gövde, Bacak, El, Ayak sırasıyla; listeden birebir)
export const ARMOR_NAMES = {
  warrior: [
    ['Leather', ['Leather Cap', 'Quilted Pauldron', 'Leather Pads', 'Leather Gloves', 'Leather Shoes']],
    ['Novice Warrior\'s', ['Novice Warrior\'s Helmet', 'Novice Warrior\'s Pauldron', 'Novice Warrior\'s Pants', 'Novice Warrior\'s Gauntlets', 'Novice Warrior\'s Boots']],
    ['Half Plate', ['Half Plate Helmet', 'Half Plate Pauldron', 'Half Plate Pads', 'Half Plate Gauntlet', 'Half Plate Boots']],
    ['Plate Armor', ['Plate Armor Helmet', 'Plate Armor Pauldron', 'Plate Armor Pads', 'Plate Armor Gauntlet', 'Plate Armor Boots']],
    ['Heavy Plate Armor', ['Heavy Plate Armor Helmet', 'Heavy Plate Armor Pauldron', 'Heavy Plate Armor Pads', 'Heavy Plate Armor Gauntlet', 'Heavy Plate Armor Boots']], // eski adı Full Plate (KO Full Plate artık ayrı set)
    ['Troll Armor', ['Troll Armor: Helmet', 'Troll Armor: Upper Garment', 'Troll Armor: Lower Garment', 'Troll Armor: Gauntlets', 'Troll Armor: Boots']],
    ['Dragon Scale', ['Dragon Scale Helmet', 'Dragon Scale Armor Top', 'Dragon Scale Armor Pants', 'Dragon Scale Gauntlet', 'Dragon Scale Boots']],
    ['Legendary king\'s', ['Legendary king\'s helmet', 'Legendary king\'s steel corset', 'Legendary king\'s strong armor', 'Legendary king\'s gauntlet', 'Legendary king\'s boots']],
  ],
  rogue: [
    ['Rogue', ['Rogue Cap', 'Rogue Shirt', 'Rogue Pads', 'Rogue Gloves', 'Rogue Shoes']],
    ['Novice Rogue\'s', ['Novice Rogue\'s Helmet', 'Novice Rogue\'s Pauldron', 'Novice Rogue\'s Pants', 'Novice Rogue\'s Gauntlets', 'Novice Rogue\'s Boots']],
    ['Rogue Half Plate', ['Rogue Helmet', 'Rogue Half Plate Pauldron', 'Rogue Half Plate Pads', 'Rogue Gauntlet', 'Rogue Boots']],
    ['Training Rogue\'s', ['Training Rogue\'s Helmet', 'Training Rogue\'s Pauldron', 'Training Rogue\'s Pants', 'Training Rogue\'s Gauntlets', 'Training Rogue\'s Boots']],
    ['Rogue Plate', ['Rogue Plate Helmet', 'Rogue Plate Armor Pauldron', 'Rogue Plate Armor Pads', 'Rogue Plate Gauntlet', 'Rogue Plate Boots']],
    ['Skilled Rogue\'s', ['Skilled Rogue\'s Helmet', 'Skilled Rogue\'s Pauldron', 'Skilled Rogue\'s Pants', 'Skilled Rogue\'s Gauntlets', 'Skilled Rogue\'s Boots']],
    ['Rogue Heavy Plate Armor', ['Rogue Heavy Plate Armor Helmet', 'Rogue Heavy Plate Armor Pauldron', 'Rogue Heavy Plate Armor Pads', 'Rogue Heavy Plate Armor Gauntlet', 'Rogue Heavy Plate Armor Boots']],
    ['Cool-headed king\'s', ['Cool-headed king\'s do-rag', 'Cool-headed king\'s chest armor', 'Cool-headed king\'s leg armor', 'Cool-headed king\'s glove', 'Cool-headed king\'s boots']],
  ],
  priest: [
    ['Fabric', ['Priest Cap', 'Fabric Coat', 'Fabric Pants', 'Priest Gloves', 'Priest Shoes']],
    ['Silk', ['Priest Helmet', 'Silk Coat', 'Silk Pants', 'Priest Gauntlet', 'Priest Boots']],
    ['Priest Plate', ['Priest Plate Helmet', 'Priest Plate Pauldron', 'Priest Plate Pads', 'Priest Plate Gauntlet', 'Priest Plate Boots']],
    ['Priest Heavy Plate Armor', ['Priest Heavy Plate Armor Helmet', 'Priest Heavy Plate Armor Pauldron', 'Priest Heavy Plate Armor Pads', 'Priest Heavy Plate Armor Gauntlet', 'Priest Heavy Plate Armor Boots']],
    ['Destruction', ['Helmet of Destruction', 'Armor of Destruction', 'Pads of Destruction', 'Gauntlet of Destruction', 'Boots of Destruction']],
    ['Protection', ['Protection Hat', 'Protection Fabric Coat', 'Protection Fabric Pants', 'Protection Gloves', 'Protection Shoes']],
    ['Trial', ['Helmet of Trial', 'Pauldron of Trial', 'Pads of Trial', 'Gauntlet of Trial', 'Boots of Trial']],
    ['Wise king\'s', ['Wise king\'s helmet', 'Wise king\'s steel corset', 'Wise king\'s strong armor', 'Wise king\'s gauntlet', 'Wise king\'s boots']],
  ],
  mage: [
    ['Mage', ['Mage Hat', 'Mage Cotton Robe', 'Mage Cloth Pants', 'Mage Cotton Gloves', 'Mage Shoes']],
    ['Mage Hemp', ['Mage Hemp Cap', 'Mage Hemp Robe', 'Mage Hemp Pants', 'Mage Hemp Gloves', 'Mage Hemp Boots']], // eski adı Mage Linen (KO Linen artık ayrı set)
    ['Mage Silk', ['Mage Helmet', 'Mage Silk Robe', 'Mage Silk Pants', 'Mage Hard Leather Gloves', 'Mage Hard Leather Boots']],
    ['Mage Satin', ['Mage Satin Hat', 'Mage Satin Robe', 'Mage Satin Pants', 'Mage Satin Gloves', 'Mage Satin Boots']], // eski adı Crystal
    ['Mage Velvet', ['Mage Velvet Hat', 'Mage Velvet Robe', 'Mage Velvet Pants', 'Mage Velvet Gloves', 'Mage Velvet Boots']], // eski adı Crimson
    ['Complete', ['Complete Helmet', 'Complete Robe', 'Complete Pants', 'Complete Glove', 'Complete Boots']],
    ['Wisdom\'s', ['Wisdom\'s Hat', 'Wisdom\'s Robe', 'Wisdom\'s Cloth Pants', 'Wisdom\'s Gloves', 'Wisdom\'s Shoes']],
    ['Intelligent king\'s', ['Intelligent king\'s head armor', 'Intelligent king\'s robe', 'Intelligent king\'s kilt', 'Intelligent king\'s hands armor', 'Intelligent king\'s boots']],
  ],
};
export const ARMOR_SETS = Object.fromEntries(Object.entries(ARMOR_NAMES).map(([c, L]) => [c, L.map(x => x[0])]));
// Zırh türü: savunma katsayısı (parça adları yalnızca eski belgeler için; görünen ad ARMOR_NAMES'ten gelir)
export const ARMOR_TYPES = {
  plate:   { name: 'Levha', k: 1.0,  pieces: { helm: 'Miğferi', chest: 'Göğüslüğü', legs: 'Dizliği', gloves: 'Eldiveni', boots: 'Çizmesi' } },
  chain:   { name: 'Zincir', k: 0.85, pieces: { helm: 'Başlığı', chest: 'Zırhı', legs: 'Dizliği', gloves: 'Eldiveni', boots: 'Çizmesi' } },
  leather: { name: 'Deri',  k: 0.75, pieces: { helm: 'Başlığı', chest: 'Yeleği', legs: 'Pantolonu', gloves: 'Eldiveni', boots: 'Çizmesi' } },
  robe:    { name: 'Kumaş', k: 0.6,  pieces: { helm: 'Külahı', chest: 'Cübbesi', legs: 'Eteği', gloves: 'Eldiveni', boots: 'Pabucu' } },
};
export const ARMOR_SLOTS = ['helm', 'chest', 'legs', 'gloves', 'boots'];
export const ARMOR_DEF_K = 2;
const PIECE_W = { helm: 0.6, chest: 1.0, legs: 0.8, gloves: 0.5, boots: 0.5 };

export const JEWEL_NAMES = {
  ear: ['Bronze Earring', 'Silver Earring', 'Pearl Earring', 'Gold Earring', 'Ruby Earring', 'Opal Earring', 'Platinum Earring', 'Crystal Earring'],
  neck: ['Messenger Pendant', 'Mercenary Pendant', 'Topaz Pendant', 'Golden Pendant', 'Crystal Necklace', 'Green Dragon Necklace', 'Blue Dragon Necklace', 'Red Dragon Necklace'],
  ring: ['Silver Ring', 'Gold Ring', 'Sapphire Ring', 'Opal Ring', 'Emerald Ring', 'Ruby Ring', 'Platinum Ring', 'Diamond Ring'],
  belt: ['Linen Belt', 'Low Fur Belt', 'Body Belt', 'Bronze Belt', 'Light\'s Belt', 'Strength Belt', 'Agility Belt', 'Crystal Belt'],
};
export const JEWELS = {
  ear:  { name: 'Küpe',  slots: ['ear1', 'ear2'],   stats: t => ({ hp: 25 + 20 * t }) },
  neck: { name: 'Kolye', slots: ['neck'],           stats: t => ({ atk: 3 + 3 * t, mag: 3 + 3 * t }) },
  ring: { name: 'Yüzük', slots: ['ring1', 'ring2'], stats: t => ({ atk: 2 + 2.5 * t, mag: 2 + 2.5 * t }) },
  belt: { name: 'Kemer', slots: ['belt'],           stats: t => ({ def: 3 + 2.5 * t, hp: 15 + 12 * t }) },
};
// Büyücü takıları (yalnız Büyücü): can ve büyü vermez, uzmanlık elementini verir. Dört seri: Kor (saf Alev Hasarı), Alaz (daha az
// Alev Hasarı + yanık hasarı), Şimşek (saf Yıldırım Hasarı), Fırtına (daha az Yıldırım Hasarı + kilit şansı). Seriler karıştırılabilir.
// fire/bolt nadirlik ve artıyla büyür (SCALED); burnPct ve lock büyümez.
export const MAGE_JEWEL_LINES = { kor: ['fire', 'Kor'], alaz: ['fire', 'Alaz'], simsek: ['bolt', 'Şimşek'], firtina: ['bolt', 'Fırtına'] };
const MJ = { ear: [3, 3, 2, 2, 0.02, 0.01], neck: [4, 4, 3, 3, 0.03, 0.02], ring: [3, 3, 2, 2, 0.02, 0.01] }; // [saf a, b, efektli a, b, yanık, kilit]
const MJ_NAME = { ear: 'Küpesi', neck: 'Kolyesi', ring: 'Yüzüğü' };
for (const [line, [el, title]] of Object.entries(MAGE_JEWEL_LINES)) for (const [slot, [a, b, c, d, burn, lock]] of Object.entries(MJ)) {
  const pure = line === 'kor' || line === 'simsek';
  JEWELS[`${line}_${slot}`] = { name: `${title} ${MJ_NAME[slot]}`, slots: JEWELS[slot].slots, cls: ['mage'], icon: slot, mageLine: line,
    stats: t => ({ [el]: pure ? a + b * t : c + d * t, ...(pure ? {} : el === 'fire' ? { burnPct: burn } : { lock }) }) };
  JEWEL_NAMES[`${line}_${slot}`] = TIERS.map(T => `${T.gem} ${title} ${MJ_NAME[slot]}`);
}

// Eşsiz eşyalar: nadir yaratık drop'ları ve boss takıları (drop tablosu drops.js'te).
// sig: imza katsayısı (yalnızca o eşyaya özgü direnç ya da savunma delme); türünün olağan katsayısına eklenir.
export const UNIQUES = {
  sazkiran:    { name: 'Sharp Fang',           type: 'dagger', req: 15, stats: { atk: 46, crit: 0.06 } },
  camuryaran:  { name: 'War Axe',        type: 'axe2',   req: 15, stats: { atk: 96 } },
  ilkkivilcim: { name: 'Red Eye Staff',       type: 'staff',  req: 15, stats: { mag: 96, crit: 0.03 } },
  demirhukum:  { name: 'Iron Star',        type: 'mace',   req: 15, stats: { atk: 42, mag: 50 } },
  beykemeri:   { name: 'Skeleton Belt', jewel: 'belt',  req: 15, stats: { def: 16, hp: 170 } },
  bataklikmuhru: { name: 'Legionnaire Band',   jewel: 'ring',  req: 15, stats: { atk: 13, mag: 13, crit: 0.03 } },
  // 2. bölge (statları aşağıdaki formülden gelir)
  kuldilimi:    { name: 'Flame Sword',      type: 'sword',  req: 32, sig: { rFire: 0.04 } }, kulyayi:      { name: 'Hero Bow',       type: 'bow',    req: 32, sig: { rFire: 0.04 } },
  korasa:       { name: 'Scorching Staff',       type: 'staff',  req: 35, sig: { rFire: 0.06 } }, alazyuzugu:   { name: 'Flame Ring',    jewel: 'ring',  req: 35, sig: { rFire: 0.08 } },
  curufkusagi:  { name: 'Fire Belt',    jewel: 'belt',  req: 35, sig: { rMace: 0.06 } }, tungakalkani: { name: 'Hoplon',  type: 'shield', req: 35, sig: { rMace: 0.08 } },
  gecitbekcisi: { name: 'Falchion',   type: 'sword',  req: 38, sig: { rSword: 0.05 } }, iskolyesi:    { name: 'Black Dragon Necklace',     jewel: 'neck',  req: 38, sig: { rFire: 0.06 } },
  // 3. bölge
  sirtyaran:    { name: 'Mail breaker',      type: 'dagger', req: 52, sig: { rDagger: 0.05 } }, kamdegnegi:   { name: 'Chaotic Staff',    type: 'staff',  req: 52, sig: { rBolt: 0.06 } },
  capulcudisi:  { name: 'Cleaver',    type: 'dagger', req: 55, sig: { rDagger: 0.06 } }, sirtlankupesi: { name: 'Minotaur\'s Earring', jewel: 'ear',  req: 55, sig: { rDagger: 0.06 } },
  kamtokmagi:   { name: 'Smite Hammer',     type: 'mace',   req: 55, sig: { rBolt: 0.06 } }, kamboncugu:   { name: 'Magic Power Necklace',    jewel: 'neck',  req: 55, sig: { rBolt: 0.08 } },
  aysarteberi:  { name: 'Tabar',    type: 'axe2',   req: 55, sig: { rAxe: 0.08 } }, bozkirmuhru:  { name: 'Hero\'s Valor',   jewel: 'ring',  req: 55, sig: { rBow: 0.08 } },
  tolunyayi:    { name: 'Eagle\'s Eye',      type: 'bow',    req: 58, sig: { rBow: 0.08 } }, kartalkupesi: { name: 'Howling Rooster',  jewel: 'ear',   req: 58, sig: { rBow: 0.08 } },
  hankilici:    { name: 'Broad Sword',      type: 'sword',  req: 58, sig: { rSword: 0.08 } }, hankusagi:    { name: 'Lightening Belt',     jewel: 'belt',  req: 58, sig: { rSword: 0.08, rAxe: 0.08 } },
  // 4. bölge
  kiragitopuzu: { name: 'Stone Splitter',   type: 'mace',   req: 63, sig: { rIce: 0.08 } }, buzkiran:     { name: 'Wolf Slayer',       type: 'axe2',   req: 63, sig: { rIce: 0.08 } },
  ayazsiperi:   { name: 'Dread Shield',     type: 'shield', req: 64, sig: { rIce: 0.12 } }, kiragiyuzugu: { name: 'Red Pearl Ring',  jewel: 'ring',  req: 64, sig: { rIce: 0.12 } },
  buzkahinasasi: { name: 'Hidden Secret Staff', type: 'staff', req: 64, sig: { rIce: 0.1 } }, buzkolyesi:   { name: 'White Dragon Necklace',    jewel: 'neck',  req: 64, sig: { rIce: 0.12 } },
  cig:          { name: 'Secret Executor',             type: 'axe2',   req: 64, sig: { rMace: 0.08 } }, devkusagi:    { name: 'Ice Belt',     jewel: 'belt',  req: 64, sig: { rMace: 0.12 } },
  donukdis:     { name: 'Cold-Hearted Dagger',       type: 'dagger', req: 65, sig: { rIce: 0.08 } }, mezarkupesi:  { name: 'Secret Silver Earring',   jewel: 'ear',   req: 65, sig: { rDagger: 0.1 } },
  // 3B modelli yeni eşsizler (kullanıcının GLB paketi, 19 Kas; statlar formülden, onay bekliyor; düşme kaynağı henüz yok)
  // 19 Kas (kullanıcının listesi): yeni eşsizler; değerler SPECIAL'da birebir, seviye şartı tahmini
  // 19 Kas akşam (kullanıcının 2. listesi): değerler SPECIAL'da birebir (+1…+10), seviye şartı tahmini
  lugias:       { name: 'Lugias',           type: 'spear',  req: 60, sig: { rSpear: 0.06 } }, hanguk:       { name: 'Hanguk Sword',     type: 'sword',  req: 55, sig: { rSword: 0.06 } },
  kutsalasa:    { name: 'Holy Animor',      type: 'mace',   req: 60, sig: { rMace: 0.06 } }, helenid:      { name: 'Helenid',          type: 'xbow',   req: 62, sig: { rBow: 0.08 } },
  erenion:      { name: 'Wreath of Erenion', type: 'staff', req: 50, sig: { rBolt: 0.06 } }, kanasa:       { name: 'Hell Blood',       type: 'staff',  req: 60, sig: { rFire: 0.08 } },
  garp:         { name: 'Garp',             type: 'staff',  req: 60, sig: { rBolt: 0.08 } },
  kurtcekici:   { name: 'Lycaon Hammer',    type: 'mace',   req: 55, sig: { rMace: 0.06 } }, bozkurtcekici: { name: 'Lupus Hammer', type: 'mace', req: 50, sig: { rMace: 0.06 } },
  kitinyayi:    { name: 'Chitin Bow',       type: 'bow',    req: 50, sig: { rBow: 0.06 } },
  lobocekici:   { name: 'Lobo Hammer',      type: 'mace',   req: 50, sig: { rMace: 0.06 } }, karakanat:    { name: 'Dark Vane',        type: 'dagger', req: 50, sig: { rDagger: 0.06 } },
  kitinsiper:   { name: 'Chitin Shield',    type: 'shield', req: 50, sig: { rDagger: 0.08 } }, seraptigi:    { name: 'Mirage Sword',     type: 'sword2', req: 60, sig: { rSword: 0.08 } },
  devcekic:     { name: 'Giga Hammer',      type: 'mace2',  req: 60, sig: { rMace: 0.08 } }, beylersiperi: { name: 'Defense of Lords', type: 'shield', req: 60, sig: { rSword: 0.06, rAxe: 0.06 } },
  yaylahukmu:   { name: 'Hidden Secret Bone Crusher',     type: 'mace',   req: 65, sig: { rMace: 0.1 } }, hakanmuhru:   { name: 'Ring of Courage',    jewel: 'ring',  req: 65, sig: { rBolt: 0.1, pen: 0.05 } },
};
// Hazır 3B modeller (models/items/<ad>.glb): eşyanın görünen adıyla eşlenir; elde ve simgede (img/items3d/<ad>.png) bunlar kullanılır.
// Defense of Lords ve Cold-Hearted Dagger modelleri bozuk geldi (düz levha / kesik görüntü): bilerek eşlenmedi.
export const ITEM_GLB = {
  'Hell Breaker': 'hell_breaker', 'Iron Impact': 'iron_impact', 'Giga Hammer': 'giga_hammer', 'Lobo Hammer': 'lobo_hammer', 'Mirage Sword': 'mirage_sword',
  'Mirage Dagger': 'mirage_dagger', 'Dark Vane': 'dark_vane', 'Cleaver': 'cleaver_dagger', 'Cleaver Dagger': 'cleaver_dagger',
  'Elixir Staff': 'elixir_staff', 'Wood Staff': 'wood_staff', 'Oasis Staff': 'oasis_staff', 'Chitin Shield': 'chitin_shield', 'Dread Shield': 'dread_shield',
};
// Statı elle yazılmamış eşsizler: iki kademe üstünün Nadir eşyasından güçlüdür (o kademenin tabanı × 1,5)
const uniqueStats = U => {
  const t = U.req / 10 + 1.8, base = (U.type ? WEAPONS[U.type] : JEWELS[U.jewel]).stats(t), out = {};
  for (const k in base) out[k] = k === 'crit' ? base[k] * 3 : k === 'spd' ? base[k] : Math.round(base[k] * 1.5);
  return out;
};

// Tabanın katsayıları (Standart eşya için; Nadir'de GRADES.coef ile çarpılır). Kural: silah → savunma delme;
// zırh parçası → tek silah sınıfına karşı savunma; yalnızca savunma veren parçalar (kalkan, küpe, kemer) iki katsayı;
// kolye ve yüzük → kademeye göre dönen tek katsayı (aynı türün farklı kademeleri farklı şeye karşı korur).
const ARMOR_COEF = { helm: 'mace', chest: 'sword', legs: 'axe', gloves: 'dagger', boots: 'bow' };
const NECK_ROT = ['dagger', 'sword', 'axe', 'bow', 'mace'], RING_ROT = ['fire', 'ice', 'bolt'];
function baseCoefs(kind, type, t, k = 1, rot = true) {
  if (t < COEF.minTier) return {};
  const v = COEF.res(t) * k, i = t - COEF.minTier, out = {};
  if (kind === 'weapon') out.pen = COEF.pen(t) * WEAPONS[type].penK * k;
  else if (kind === 'shield') { out.rSword = v * 1.5; out.rBow = v * 1.5; }
  else if (kind === 'armor') out[resKey(ARMOR_COEF[type])] = v;
  else if (type === 'ear') { out.rFire = v; out.rIce = v; }
  else if (type === 'belt') { out.rBolt = v * 1.5; out.rStaff = v * 1.5; }
  else if (rot) out[resKey(type === 'neck' ? NECK_ROT[i % NECK_ROT.length] : RING_ROT[i % RING_ROT.length])] = v * 1.5;
  for (const key in out) out[key] = r4(out[key]);
  return out;
}
// Eşsiz: türünün katsayısı iki katıyla + imza katsayısı (imzalı kolye ve yüzükte dönen katsayının yerine imza geçer)
function uniqueCoefs(U, kind, type, t) {
  const out = baseCoefs(kind, type, t, 2, !U.sig);
  for (const k in U.sig || {}) out[k] = r4((out[k] || 0) + U.sig[k]);
  return out;
}

// ---- Varyant eğilimi (items-var.js) ----
// Varyant, asıl tabanın formülünü alır ve küçük bir eğilim ekler: bir stat artarken başka biri azalır (salt üstün varyant yok).
const MAIN_K = ['atk', 'mag', 'def', 'hp'];
const mulMain = (s, m) => { for (const k of MAIN_K) if (k in s) s[k] *= m; };
const ADD_J = { atk: t => 2 + 1.5 * t, mag: t => 2 + 1.5 * t, hp: t => 8 + 7 * t, def: t => 1 + t };
export const LEAN = {
  guc:    { name: 'Güç',     fn: (s) => { mulMain(s, 1.06); if (s.crit) s.crit = r4(s.crit * 0.5); if (s.pen) s.pen = r4(s.pen * 0.5); s.spd = (s.spd || 0) - 1; } },
  kritik: { name: 'Kritik',  fn: (s, t) => { mulMain(s, 0.95); s.crit = r4((s.crit || 0) + 0.01 + 0.002 * t); } },
  hiz:    { name: 'Hız',     fn: (s, t) => { mulMain(s, 0.95); s.spd = (s.spd || 0) + 1 + Math.floor(t / 3); } },
  delme:  { name: 'Delme',   fn: (s) => { mulMain(s, 0.96); if (s.pen) s.pen = r4(s.pen * 1.6); } },
  siper:  { name: 'Savunma', fn: (s) => { if (s.def) s.def *= 1.08; if (s.hp) s.hp *= 0.93; } },
  govde:  { name: 'Can',     fn: (s) => { if (s.hp) s.hp *= 1.08; if (s.def) s.def *= 0.93; } },
  cevik:  { name: 'Çeviklik', fn: (s) => { mulMain(s, 0.95); s.spd = (s.spd || 0) + 1; } },
  direnc: { name: 'Direnç',  fn: (s) => { mulMain(s, 0.95); for (const k in s) if (/^r[A-Z]/.test(k)) s[k] = r4(s[k] * 1.6); } },
  // takılar: adındaki işarete göre (Mage → büyü, Warrior → saldırı, Life → can, Assassin → kritik)
  atk: { name: 'Saldırı', fn: (s, t) => leanJ(s, 'atk', t) }, mag: { name: 'Büyü', fn: (s, t) => leanJ(s, 'mag', t) },
  hp:  { name: 'Can',     fn: (s, t) => leanJ(s, 'hp', t) },  def: { name: 'Savunma', fn: (s, t) => leanJ(s, 'def', t) },
  crit: { name: 'Kritik', fn: (s, t) => { mulMain(s, 0.9); s.crit = r4((s.crit || 0) + 0.006 + 0.0015 * t); } },
};
function leanJ(s, x, t) {
  const has = MAIN_K.filter(k => k in s);
  if (!(x in s)) { mulMain(s, 0.88); s[x] = ADD_J[x](t); }
  else if (has.length === 1) { s[x] *= 1.06; for (const k in s) if (isCoef(k)) s[k] = r4(s[k] * 0.6); }
  else for (const k of has) s[k] *= k === x ? 1.12 : 0.9;
}
const applyLean = (s, lean, t) => { LEAN[lean].fn(s, t); for (const k of MAIN_K) if (k in s) s[k] = Math.round(s[k] * 100) / 100; return s; };
const VAR_OF = { w: W_VAR, a: A_VAR, j: J_VAR };
// Bir asıl tabanın kendisi + varyantları ("w:mace:2" → ["w:mace:2", "w:mace:2:1", ...])
export const variantIds = b => { const [k, a, c] = b.split(':'), L = VAR_OF[k]?.[a]?.[c]; return [b, ...(L || []).map((_, i) => `${b}:${i + 1}`)]; };

// ---- Taban tanımı ----
const cache = new Map();
export function itemBase(b) {
  if (cache.has(b)) return cache.get(b);
  const P = b.split(':'), [k, a, c] = P, vs = P[k === 'a' ? 4 : 3], nP = k === 'a' ? 4 : 3;
  // varyant sırası: yoksa 0 (asıl taban); varsa 1'den başlayan tam sayı ve tabloda olmalı
  const v = vs === undefined ? 0 : /^[1-9]\d{0,2}$/.test(vs) ? +vs : -1, V = v > 0 ? VAR_OF[k]?.[a]?.[c]?.[v - 1] : null;
  const e = P[3];
  let def = null;
  if ((k === 'w' || k === 'a' || k === 'j') && (v < 0 || (v > 0 && !V) || P.length > nP + 1)) { cache.set(b, null); return null; }
  if (k === 'w' && hasTier(a, +c)) {
    const W = WEAPONS[a], t = +c;
    def = { name: V ? V[0] : W.names[t], kind: a === 'shield' ? 'shield' : 'weapon', type: a, slots: W.slots, hands: W.hands, cls: W.cls, tier: t, req: TIERS[t].req, stats: (KO_EXEMPT.has(b) ? W.raw : W.stats)(t), model: W.model, icon: a };
    Object.assign(def.stats, baseCoefs(def.kind, a, t));
    if (V) applyLean(def.stats, V[1], t);
  } else if (k === 'a' && CLASSES[a] && TIERS[+c] && PIECE_W[e]) {
    const t = +c, T = ARMOR_TYPES[CLASSES[a].armor], w = PIECE_W[e];
    const stats = { def: ARMOR_DEF_K * (4 + 3.2 * t) * w * T.k }; // 19 Kas (kullanıcı): zırh can vermez (KO), savunma ×2; en üst kademe bile KO Full Plate'in altında kalır
    if (e === 'boots') stats.spd = 2 + t;
    if (e === 'gloves' && a === 'rogue') stats.crit = 0.01 + 0.002 * t;
    if (e === 'chest' && a === 'mage') stats.mag = 3 + 3 * t;
    Object.assign(stats, baseCoefs('armor', e, t));
    if (V) applyLean(stats, V[2], t);
    def = { name: V ? V[1][ARMOR_SLOTS.indexOf(e)] : ARMOR_NAMES[a][t][1][ARMOR_SLOTS.indexOf(e)], kind: 'armor', type: e, slots: [e], hands: 0, cls: [a], tier: t, req: TIERS[t].req, stats, set: V ? V[0] : ARMOR_SETS[a][t], icon: e };
  } else if (k === 'j' && JEWELS[a] && TIERS[+c]) {
    const J = JEWELS[a], t = +c;
    def = { name: V ? V[0] : JEWEL_NAMES[a][t], kind: 'jewel', type: a, slots: J.slots, hands: 0, cls: J.cls || null, tier: t, req: TIERS[t].req, stats: { ...J.stats(t), ...baseCoefs('jewel', J.icon || a, t) }, icon: J.icon || a };
    if (V) applyLean(def.stats, V[1], t);
  } else if (k === 'u' && UNIQUES[a]?.armor) { // KO zırh setleri (Chitin / Full Plate): değerler SPECIAL'da
    const U = UNIQUES[a];
    def = { name: U.name, kind: 'armor', type: U.armor, slots: [U.armor], hands: 0, cls: [U.cls], tier: Math.floor(U.req / 10), req: U.req, stats: {}, icon: U.armor, unique: true, koSet: U.set };
  } else if (k === 'u' && UNIQUES[a]) {
    const U = UNIQUES[a], W = U.type && WEAPONS[U.type], J = U.jewel && JEWELS[U.jewel];
    def = { name: U.name, kind: U.type === 'shield' ? 'shield' : W ? 'weapon' : 'jewel', type: U.type || U.jewel, slots: (W || J).slots, hands: W ? W.hands : 0, cls: W ? W.cls : null, tier: Math.floor(U.req / 10), req: U.req, stats: { ...(U.stats || uniqueStats(U)) }, model: W?.model, icon: U.type || U.jewel, unique: true };
    Object.assign(def.stats, uniqueCoefs(U, def.kind, def.type, def.tier));
  }
  else if (k === 's' && STARTER_WEAPONS[a]) {
    const S = STARTER_WEAPONS[a], W = WEAPONS[S.type], base = W.stats(STARTER.t), stats = {};
    for (const x in base) stats[x] = x === 'crit' || x === 'spd' ? base[x] : Math.round(base[x] * STARTER.mult);
    def = { name: S.name, kind: S.type === 'shield' ? 'shield' : 'weapon', type: S.type, slots: W.slots, hands: W.hands, cls: W.cls, tier: 1, req: STARTER.req, stats, model: W.model, icon: S.type, unique: true };
  }
  if (def && Object.hasOwn(ITEM_GLB, def.name)) def.glb = ITEM_GLB[def.name];
  if (def && SPECIAL[b]) { const X = SPECIAL[b]; def.stats = specialStats(X, 1); def.rq = rqAt(X, 1); def.req = 1; if (X.vt) def.tier = X.vt; if (X.cls) def.cls = X.cls; if (X.el) def.fx = X.el; if (X.hands) { def.hands = X.hands; if (X.hands === 1) def.slots = ['wr', 'wl']; } } // vt: değer kademesi (fiyat, toz, yan stat)
  if (def) { def.b = b; if (V) { def.v = v; def.lean = V[V.length - 1]; } }
  cache.set(b, def);
  return def;
}

// Nadirlik düzeltmesi: eşsiz taban her zaman Eşsiz'dir, öbür tabanlar Standart ya da Nadir olur. Eski dört kaliteli
// kayıtları da (İyi ve Üstün → Nadir, Eşsiz 3 → 2) aynı kural çevirir; iki kez uygulanırsa sonuç değişmez.
export const gradeOf = (b, g) => (itemBase(b)?.unique ? G_UNIQUE : g >= 1 ? 1 : 0);
// En düşük artı (kullanıcı kararı 19 Kas): takılar dışındaki bütün eşyalar +1'den başlar (düşer, verilir, su verilince +1'e döner)
export const minPlus = b => (itemBase(b)?.kind === 'jewel' ? 0 : 1);
export const normItem = it => { if (!it) return it; const g = gradeOf(it.b, it.g), m = minPlus(it.b); return it.g !== g || (it.p || 0) < m ? { ...it, g, p: Math.max(it.p || 0, m) } : it; };
// Aşağıdaki hesaplar nadirliği hep bu kuraldan okur: düzeltilmemiş eski bir belge (ilan, posta) de doğru hesaplanır
const gi = it => gradeOf(it.b, it.g);

// ---- Artı basma (örs) ----
// Karar: eşya hiçbir koşulda YOK OLMAZ. +5'e kadar başarısızlıkta yalnızca bileği taşı ve akçe gider.
// +6 ve üstündeki eşyada başarısız deneme eşyayı bir artı düşürür (+5'in altına inmez); +8 ve üstünde küçük bir
// olasılıkla "kırılma" olur ve eşya +5'e döner. Uğur Muskası o denemede seviye kaybını ve kırılmayı önler;
// Tav Közü o denemenin başarı şansını artırır. Bütün olasılıklar upOdds'tan okunur: sunucu ve arayüz aynı tabloyu kullanır.
export const MAX_PLUS = 10;
// Eşyanın en yüksek artısı: KO takıları +3 (SPECIAL maxP), öbürleri MAX_PLUS
export const maxPlusOf = it => SPECIAL[it?.b]?.maxP ?? MAX_PLUS;
export const SAFE_PLUS = 5;                                                           // hiçbir sonuç eşyayı bunun altına düşürmez
export const UP_CHANCE = [1, 1, 1, 0.9, 0.85, 0.6, 0.45, 0.35, 0.25, 0.15];          // +n → +n+1 başarı
export const UP_BREAK  = [0, 0, 0, 0, 0, 0, 0, 0, 0.1, 0.15];                        // +n'deki denemede kırılma (→ +5)
export const UP_STONES = [1, 1, 1, 1, 1, 2, 3, 5, 8, 12];                            // deneme başına taş
export const PLUS_MULT = [1, 1.06, 1.12, 1.18, 1.26, 1.34, 1.44, 1.58, 1.78, 2.05, 2.4];
export const EMBER_MULT = 1.2;                                                        // Tav Közü: başarı şansı çarpanı
export const FOG_UP = { rel: 0.05, cap: 0.03 };                                       // Sisli havada (realm.js) başarı şansı ×1,05; en çok +3 puan
export const STONES = [
  { name: 'Kaba Bileği Taşı',  dust: 10, akce: 200 },
  { name: 'İnce Bileği Taşı',  dust: 30, akce: 800 },
  { name: 'Usta Bileği Taşı',  dust: 90, akce: 3000 },
];
const G_VALUE = [1, 4, 40], G_FEE = [1, 2, 6];
// Taş: Standart → Kaba, Nadir → İnce, Eşsiz → Usta
export const stoneGrade = it => gi(it);
// Bir denemenin olasılıkları: ok başarı · stay eşya aynı kalır · drop bir artı düşer · brk kırılma (+5'e döner).
// safe: Uğur Muskası bu denemede gerçekten bir şeyi önlüyor mu. Dört olasılığın toplamı her zaman 1'dir.
export function upOdds(it, { charm = false, ember = false, fog = false } = {}) {
  if (it.p >= maxPlusOf(it)) return { ok: 0, stay: 1, drop: 0, brk: 0, safe: false };
  const dry = Math.min(1, UP_CHANCE[it.p] * (ember ? EMBER_MULT : 1)); // fog: sisli hava (sunucu saatinden; istemci seçemez)
  const ok = fog ? Math.min(1, dry + Math.min(FOG_UP.cap, dry * FOG_UP.rel)) : dry, fail = 1 - ok, risky = it.p > SAFE_PLUS;
  if (!risky || charm) return { ok, stay: fail, drop: 0, brk: 0, safe: risky && charm };
  const brk = Math.min(fail, UP_BREAK[it.p]);
  return { ok, stay: 0, drop: fail - brk, brk, safe: false };
}
export const upChance = (it, ember = false) => upOdds(it, { ember }).ok;
// p (oyuncu) verilirse tarafının örs bonusu uygulanır: sunucu ve arayüz ücreti hep oyuncuyla hesaplar
export const upFee = (it, p) => Math.round(withPct(40 * (itemBase(it.b).tier + 1) * (it.p + 1) * (it.p + 1) * G_FEE[gi(it)], p ? factionBonus(p.faction).anvilFee + hqPct(p, 'demirhane') : 0)); // + klan karargâhı Demirhane (clan.js)
// Değer hesabında artı, eşyanın en düşük artısından sayılır (takı dışı +1 = taban): +1'den başlama satış/toz fiyatını şişirmez
const effP = it => Math.max(0, (it.p || 0) - minPlus(it.b));
export const dustYield = it => Math.round((2 + itemBase(it.b).tier) * G_VALUE[gi(it)] * (1 + effP(it) * 0.5));
export const sellPrice = it => Math.round(10 * (itemBase(it.b).tier + 1) * G_VALUE[gi(it)] * (1 + effP(it)));

// Su verme: +7 ve üstü eşya artısını sıfırlayıp kalıcı olarak güçlenir (taban ×1,6), sonra yeniden basılabilir
export const REFORGE = { minPlus: 7, mult: 1.6, stones: 10, fee: it => 2000 * (itemBase(it.b).tier + 1) };
const SCALED = ['atk', 'mag', 'def', 'hp', 'fire', 'bolt', 'elx']; // fire/bolt: Alev / Yıldırım Hasarı (büyücü uzmanlığının element gücü)
// Özel eşyalar (kullanıcının verdiği birebir KO değerleri, 19 Kas): +1…+8 tablosu (dizi sırası = artı − 1); +9/+10 son adımla
// uzatılır, +0 = +1. Nadirlik çarpanı ve seviye şartı yok (req 1); şart yalnız nitelik (rq). Alanlar:
//   atk saldırı · def savunma · hp can · str/vit/dex/int/mp nitelik bonusu · mana azami mana · fire/bolt büyücü element gücü
//   elx asanın element hasarı (bütün asalar: kuşananın uzmanlığına göre Alev ya da Yıldırım; hero.js heroStats)
//   ed sabit element hasarı (her isabette; el: poison/flame/lightning/glacier) · res direnç/savunma katsayısı (KO puanı / 100)
//   vt değer kademesi (taban kademesi oyundaki gücünü yansıtmıyorsa) · rq şart (nitelik → dizi) · fix artıdan bağımsız katsayılar · cls takabilen sınıflar · type silah türü (değişirse)
const L8 = (a, s) => Array.from({ length: 8 }, (_, i) => a + s * i);
export const SPECIAL = {
  'w:lance:0': { vt: 6, atk: [124, 132, 140, 148, 156, 164, 175, 186], el: 'poison', ed: L8(10, 10), rq: { str: L8(184, 2) } },                 // Raptor
  'w:dagger:6': { atk: [61, 65, 69, 73, 77, 81, 87, 95], el: 'poison', ed: L8(10, 10), rq: { dex: L8(162, 4) } },                     // Mirage Dagger
  'w:mace2:7': { atk: [130, 136, 142, 148, 154, 160, 168, 180], el: 'lightning', ed: L8(10, 10), rq: { str: L8(176, 2) }, cls: ['warrior', 'priest'] }, // Iron Impact
  'u:seraptigi': { atk: [109, 115, 121, 127, 133, 139, 147, 159], el: 'poison', ed: L8(10, 10), rq: { str: L8(172, 2) }, type: 'sword2' }, // Mirage Sword (çift el)
  'w:mace2:7:1': { atk: [131, 137, 143, 149, 155, 161, 169, 181], el: 'flame', ed: L8(50, 10), int: L8(5, 1), res: { rIce: L8(15, 3) }, rq: { str: L8(176, 2) }, cls: ['warrior', 'priest'] }, // Hell Breaker
  'u:lobocekici': { atk: [34, 37, 40, 43, 46, 49, 53, 59], hp: L8(80, 10), dex: L8(12, 1), mp: L8(10, 1), res: { rBolt: L8(20, 2) }, rq: { str: L8(64, 2) }, cls: ['priest'] }, // Lobo Hammer
  'w:staff:7': { atk: [40, 43, 46, 49, 52, 55, 59, 65], elx: L8(56, 8), int: L8(10, 2), rq: { int: L8(138, 2), mp: L8(104, 4) } }, // Elixir Staff
  'w:staff:7:1': { atk: [50, 53, 56, 59, 62, 65, 69, 75], elx: L8(40, 8), mana: L8(100, 10), int: L8(15, 1), res: { rFire: L8(20, 2), rBolt: L8(20, 2) }, rq: { int: L8(156, 2), mp: L8(112, 4) } }, // Oasis Staff
  // Paper Mage asaları (19 Kas, kullanıcı): düşük sabit INT şartı. Element Damage = elx (uzmanlığa göre Alev/Yıldırım), AP = atk.
  'w:staff:0': { atk: [26, 30, 34, 38, 42, 46, 50, 54, 62, 82], elx: [8, 16, 24, 32, 40, 48, 56, 64, 72, 80], rq: { int: [46], mp: [48, 52, 56, 60, 64, 68, 72, 76, 80, 84] } }, // Wood Staff
  'w:staff:1': { atk: [30, 34, 38, 42, 46, 50, 54, 58, 70, 90], elx: [8, 16, 24, 32, 40, 48, 56, 64, 72, 80], rq: { int: [60], mp: [55, 59, 63, 67, 71, 75, 79, 83, 87, 91] } }, // Wizard Staff
  // 19 Kas (kullanıcının listesi): HP Bonus küçükse (4–8) HP niteliği (vit), büyükse can (hp); MP Bonus = mana; MP Recovery oyunda yok (atlandı)
  'u:kurtcekici': { atk: [68, 71, 74, 77, 80, 84, 88, 92], str: [11, 12, 13, 14, 15, 16, 17, 19], vit: [4, 5, 5, 6, 6, 7, 7, 8], int: [4, 5, 5, 6, 6, 7, 7, 8], res: { rFire: [25, 30, 35, 40, 45, 48, 50, 55], rIce: [25, 30, 35, 40, 45, 48, 50, 55], rBolt: [25, 30, 35, 40, 45, 48, 50, 55] }, rq: { str: L8(73, 0), int: L8(98, 0) }, cls: ['priest'] }, // Lycaon Hammer
  'u:bozkurtcekici': { atk: [53, 55, 58, 60, 63, 66, 69, 73], int: [16, 17, 19, 20, 22, 23, 24, 26], mana: [115, 125, 135, 145, 155, 165, 170, 185], vit: [4, 5, 5, 6, 6, 7, 7, 8], res: { rIce: [25, 30, 35, 40, 45, 48, 50, 55] }, rq: { str: L8(72, 0), int: L8(98, 0) }, cls: ['priest'] }, // Lupus Hammer
  'u:kamtokmagi': { atk: [92, 96, 100, 104, 108, 113, 119, 127], el: 'flame', ed: L8(20, 10), str: [5, 6, 7, 8, 9, 10, 11, 13], hp: L8(120, 10), mana: L8(130, 10), rq: { str: L8(92, 0) }, cls: ['priest'] }, // Smite Hammer
  'w:bow:7': { atk: [93, 97, 101, 105, 109, 113, 119, 128], el: 'poison', ed: L8(10, 10), rq: { dex: L8(140, 4) } }, // Iron Bow
  'u:kitinyayi': { atk: [101, 103, 105, 107, 109, 113, 118, 125], el: 'flame', ed: L8(10, 10), mana: L8(100, 30), res: { rPoison: L8(30, 5) }, rq: { dex: L8(94, 1) } }, // Chitin Bow
  'u:tolunyayi': { atk: [95, 99, 103, 107, 111, 116, 122, 130], el: 'poison', ed: L8(20, 10), str: L8(6, 1), hp: L8(100, 10), mana: L8(100, 10), res: { rSword: [1, 2, 3, 4, 5, 5, 6, 7], rFire: L8(15, 1), rIce: L8(15, 1) }, rq: { dex: L8(140, 0) } }, // Eagle's Eye
  'w:xbow:7': { atk: [84, 88, 92, 96, 100, 104, 110, 119], el: 'poison', ed: L8(10, 10), rq: { dex: L8(130, 4) } }, // Iron Crossbow
  'u:lugias': { atk: [89, 93, 97, 101, 105, 111, 120, 133, 153, 175], el: 'flame', ed: [20, 30, 40, 50, 60, 70, 80, 90, 100, 110], vit: [6, 7, 8, 9, 10, 11, 13, 16, 20, 25], dex: [12, 14, 16, 18, 20, 22, 24, 26, 28, 30], rq: { str: [182, 186, 190, 194, 198, 202, 206, 210, 214, 218], vit: [90] }, cls: ['warrior', 'priest'], hands: 1 }, // Lugias (tek el mızrak)
  'u:hanguk': { atk: [71, 75, 79, 83, 87, 93, 102, 115, 135, 155], el: 'poison', ed: [40, 50, 60, 70, 80, 90, 100, 110, 120, 130], str: [6, 7, 8, 9, 10, 11, 13, 16, 20, 25], rq: { str: [134, 138, 142, 146, 150, 154, 158, 162, 166, 170] }, cls: ['warrior', 'priest'] }, // Hanguk Sword
  'u:kutsalasa': { atk: [85, 88, 91, 94, 98, 102, 107, 112, 123, 143], def: [17, 18, 19, 20, 21, 22, 23, 24, 26, 28], vit: [8, 9, 10, 11, 12, 13, 14, 15, 18, 22], int: [8, 9, 10, 11, 12, 13, 14, 15, 18, 22], res: { rPoison: [25, 27, 29, 31, 33, 35, 38, 40, 44, 50], rMagic: [25, 27, 29, 31, 33, 35, 38, 40, 44, 50] }, mpRec: [0, 0, 0, 0, 0, 0, 8, 9, 10, 11], rq: { str: [81, 82, 83, 84, 85, 86, 87, 88, 89, 89], int: [122, 124, 126, 128, 130, 132, 134, 136, 138, 138] }, cls: ['priest'] }, // Holy Animor
  'u:helenid': { atk: [99, 103, 107, 111, 116, 121, 127, 134, 147, 163], el: 'glacier', ed: [40, 50, 60, 70, 80, 90, 100, 110, 120, 130], rq: { dex: [192, 196, 200, 204, 208, 212, 216, 220, 224, 224], vit: [80] } }, // Helenid
  'u:erenion': { atk: [69, 73, 77, 81, 83, 85, 91, 100, 113, 133], fire: [36, 42, 48, 54, 62, 70, 78, 86, 94, 102], mana: [45, 70, 95, 120, 145, 170, 195, 220, 245, 270], str: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14], mp: [2, 3, 3, 4, 5, 6, 7, 8, 9, 10], res: { rBolt: [20, 25, 30, 35, 40, 45, 50, 55, 60, 65] }, rq: { int: [112], mp: [86, 90, 94, 98, 102, 106, 110, 114, 118, 122] } }, // Wreath of Erenion
  'u:kanasa': { atk: [99, 103, 107, 111, 113, 115, 121, 130, 143, 163], fire: [15, 20, 25, 30, 33, 35, 40, 45, 50, 55], int: [12, 14, 16, 18, 19, 20, 22, 24, 26, 28], res: { rFire: [22, 24, 26, 28, 29, 30, 32, 34, 36, 38] }, rq: { int: [138], mp: [114, 118, 122, 126, 130, 134, 138, 142, 146, 150] } }, // Hell Blood
  'u:garp': { atk: [99, 103, 107, 111, 113, 115, 121, 130, 143, 163], bolt: [15, 20, 25, 30, 33, 35, 40, 45, 50, 55], int: [12, 14, 16, 18, 19, 20, 22, 24, 26, 28], res: { rBolt: [22, 24, 26, 28, 29, 30, 32, 34, 36, 38] }, rq: { int: [138], mp: [114, 118, 122, 126, 130, 134, 138, 142, 146, 150] } }, // Garp (kullanıcı: yıldırım)
  'u:ayazsiperi': { def: [183, 209, 235, 261, 287, 313, 365, 417], vit: L8(5, 1), res: { rFire: L8(30, 3), rBolt: L8(30, 3) }, fix: { rDagger: 10, rAxe: 20, rSpear: 20 }, rq: { str: L8(80, 2) }, cls: ['warrior', 'rogue', 'mage', 'priest'] }, // Dread Shield
};
// ---- KO zırh setleri (19 Kas, kullanıcının tabloları): Chitin (oyun sonu) ve Full Plate (bir önceki); Büyücüde Crimson / Crystal.
// Seviye şartı yok (req 1), yalnız nitelik şartı. Zırh can vermez. Tablo 5 parçanın toplam savunmasını verir; parçalara Rogue
// Chitin +7 dağılımıyla bölünür (Pauldron 120, Pads 101, Helmet 81, Gauntlets 55, Boots 55 / 412). Her parça aynı nitelik bonusunu
// verir. Şart: Pauldron tablodaki gibi, Pads 2 eksik, Helmet/Gauntlets/Boots 5 eksik (kullanıcı); sabit şart (HP/INT) her parçada.
const KO_ARMOR_SHARE = { chest: 120 / 412, legs: 101 / 412, helm: 81 / 412, gloves: 55 / 412, boots: 55 / 412 };
const KO_PIECE = { chest: 'Pauldron', legs: 'Pads', helm: 'Helmet', gloves: 'Gauntlets', boots: 'Boots' };
const KO_PIECE_M = { chest: 'Robe', legs: 'Pants', helm: 'Helmet', gloves: 'Gloves', boots: 'Boots' };
const KO_RQ_OFF = { chest: 0, legs: -2, helm: -5, gloves: -5, boots: -5 };
const KO_BONUS = [2, 4, 6, 8, 10, 12, 15, 19, 24, 30];
const L10 = (a, s) => Array.from({ length: 10 }, (_, i) => a + s * i);
export const KO_ARMOR = {
  // anahtar: [sınıf, set, ad öneki, toplam savunma +1…+10, bonus niteliği, şart (Pauldron) {nit: [başlangıç, adım]}, sabit şart, vt]
  chitin_w: ['warrior', 'Chitin', 'Chitin', [419, 435, 451, 467, 483, 501, 528, 566, 622, 708], 'str', { str: [160, 2] }, { vit: 90 }, 7],
  fplate_w: ['warrior', 'Full Plate', 'Full Plate', [322, 338, 354, 370, 386, 404, 431, 469, 525, 611], 'str', { str: [144, 2] }, { vit: 82 }, 6],
  chitin_r: ['rogue', 'Rogue Chitin', 'Rogue Chitin', [314, 328, 342, 356, 370, 386, 412, 448, 501, 583], 'dex', { dex: [160, 2] }, { vit: 90 }, 7],
  fplate_r: ['rogue', 'Rogue Full Plate', 'Rogue Full Plate', [219, 233, 247, 261, 275, 291, 317, 353, 406, 488], 'dex', { dex: [144, 2] }, { vit: 82 }, 6],
  chitin_p: ['priest', 'Priest Chitin', 'Priest Chitin', [367, 382, 397, 412, 427, 444, 470, 507, 561, 645], 'vit', { str: [90, 2], int: [160, 2] }, {}, 7],
  fplate_p: ['priest', 'Priest Full Plate', 'Priest Full Plate', [271, 286, 301, 316, 331, 348, 374, 411, 465, 549], 'vit', { str: [82, 2], int: [144, 2] }, {}, 6],
  crimson_m: ['mage', 'Crimson', 'Crimson', [267, 281, 295, 309, 323, 339, 365, 401, 454, 536], 'mp', { int: [160, 0] }, {}, 7],
  crystal_m: ['mage', 'Crystal', 'Crystal', [206, 220, 234, 248, 262, 278, 304, 340, 393, 475], 'mp', { int: [144, 0] }, {}, 6],
};
for (const [key, [cls, set, pre, tot, bonus, rq, fix, vt]] of Object.entries(KO_ARMOR)) for (const e of ARMOR_SLOTS) {
  const id = `${key}_${e}`, def = tot.map(T => Math.round(T * KO_ARMOR_SHARE[e]));
  if (e === 'chest') for (let i = 0; i < 10; i++) def[i] += tot[i] - ARMOR_SLOTS.reduce((a, s) => a + Math.round(tot[i] * KO_ARMOR_SHARE[s]), 0); // yuvarlama farkı Pauldron'a
  const q = {}; for (const k in rq) q[k] = L10(rq[k][0] + (k === 'int' && cls === 'mage' ? 0 : KO_RQ_OFF[e]), rq[k][1]); for (const k in fix) q[k] = [fix[k]];
  if (cls === 'mage') q.int = [rq.int[0] + KO_RQ_OFF[e]];
  UNIQUES[id] = { name: `${pre} ${(cls === 'mage' ? KO_PIECE_M : KO_PIECE)[e]}`, armor: e, cls, req: vt === 7 ? 60 : 50, set };
  SPECIAL[`u:${id}`] = { def, [bonus]: KO_BONUS.slice(), rq: q, vt, cls: [cls] };
}
export const KO_ARMOR_IDS = Object.keys(KO_ARMOR).flatMap(k => ARMOR_SLOTS.map(e => `u:${k}_${e}`));
// ---- Paper Mage setleri (19 Kas, kullanıcı): Mage Linen (Grade 2) ve Wool / Çulluk (Grade 1). Her parça HP ya da MP basılı
// (iki ayrı eşya: _hp / _mp). Tablo Robe'un ve 5 parçanın toplam savunmasını verir; öbür parçalar kalan savunmayı +9 Linen
// dağılımıyla paylaşır (Pants 61, Cap 49, Gloves 36, Boots 36). En çok +9 (maxP); NPC tüccarında +1 satılır (npc.js). Şart:
// Linen Robe 100 INT + 82 MP, Cap/Pants 92 INT, Gloves/Boots 84 INT; Wool şartsız.
const PAPER_REST = { legs: 61, helm: 49, gloves: 36, boots: 36 };
export const PAPER = {
  linen: ['Mage Linen', { helm: 'Mage Linen Cap', chest: 'Mage Linen Robe', legs: 'Mage Linen Pants', gloves: 'Mage Leather Gloves', boots: 'Mage Leather Boots' },
    [28, 31, 34, 37, 40, 44, 50, 59, 72, 92], [97, 109, 121, 133, 145, 160, 183, 217, 266, 341], { chest: { int: [100], mp: [82] }, helm: { int: [92] }, legs: { int: [92] }, gloves: { int: [84] }, boots: { int: [84] } }, 3],
  wool: ['Wool', { helm: 'Wizard Hat', chest: 'Wool Robe', legs: 'Wool Pants', gloves: 'Mage Gloves', boots: 'Mage Boots' },
    [16, 19, 22, 25, 28, 32, 38, 47, 60, 80], [56, 68, 80, 92, 104, 119, 142, 176, 225, 300], {}, 2],
};
export const PAPER_IDS = [];
for (const [key, [set, names, robe, tot, rq, vt]] of Object.entries(PAPER)) for (const [st, lbl] of [['vit', 'HP'], ['mp', 'MP']]) for (const e of ARMOR_SLOTS) {
  const id = `${key}_${st === 'vit' ? 'hp' : 'mp'}_${e}`, restSum = 182;
  const def = e === 'chest' ? robe.slice() : tot.map((T, i) => Math.round((T - robe[i]) * PAPER_REST[e] / restSum));
  UNIQUES[id] = { name: `${names[e]} (${lbl})`, armor: e, cls: 'mage', req: 10 * vt, set, paper: 1 };
  SPECIAL[`u:${id}`] = { def, [st]: KO_BONUS.slice(), ...(rq[e] ? { rq: rq[e] } : {}), vt, cls: ['mage'], maxP: 9 };
  PAPER_IDS.push(`u:${id}`);
}
// Lycaon / Lupus / Lobo Staff (19 Kas, kullanıcı): aynı tablo, direnç türü farklı (Flame / Glacier / Lightning). Magic Power = mp
// niteliği, HP Bonus = can, MP Bonus = mana, MP Recovery 30 → mpRec (birimde en çok %10). INT 46 sabit, MP şartı artıyla.
for (const [id, name, rk] of [['lycaonstaff', 'Lycaon Staff', 'rFire'], ['lupusstaff', 'Lupus Staff', 'rIce'], ['lobostaff', 'Lobo Staff', 'rBolt']]) {
  UNIQUES[id] = { name, type: 'staff', req: 55, sig: { [rk]: 0.06 } };
  SPECIAL[`u:${id}`] = { atk: [44, 48, 52, 56, 60, 65, 70, 76, 84, 95], mp: [12, 13, 14, 15, 16, 17, 18, 20, 22, 25], hp: [70, 90, 110, 130, 150, 170, 190, 220, 250, 300],
    mana: [30, 50, 70, 90, 110, 130, 150, 180, 210, 250], res: { [rk]: [40, 42, 45, 47, 50, 52, 55, 60, 65, 70], rPoison: [10, 15, 20, 25, 30, 35, 40, 45, 50, 55] },
    mpRec: [30], rq: { int: [46], mp: [80, 82, 84, 86, 88, 90, 92, 94, 96, 98] }, cls: ['mage'] };
}
// ---- KO takıları (19 Kas, kullanıcının tabloları): +0…+3 (z: dizi +0'dan, maxP 3). Eşleme: 'Health (HP) Bonus' = HP niteliği
// (vit), 'HP Bonus' = can, 'HP / MP Bonus' = can + mana, 'MP Bonus' = mana, 'Magic Power' = MP niteliği (Büyü Gücü),
// 'DEX / MP Bonus' = DEX + MP niteliği, Flame/Lightning Damage = Büyücü element gücü (fire/bolt), direnç ve Anti-Def KO puanı/100
// (Anti-Def = bütün silah sınıflarına savunma katsayısı, Dread Shield'daki gibi). Curse direnci karşılıksız (oyunda lanet direnci yok).
const ALLW = v => ({ rDagger: v, rSword: v, rMace: v, rAxe: v, rSpear: v, rBow: v });
const R3 = (k, a) => Object.fromEntries(k.map(x => [x, a]));
export const KO_JEWELS = {
  ironneck:  ['Iron Necklace', 'neck', 30, { str: [5, 7, 10, 12], vit: [20, 25, 30, 35], res: ALLW([10, 11, 12, 13]) }],
  ironbelt:  ['Iron Belt', 'belt', 30, { def: [50, 52, 54, 56], res: ALLW([10, 11, 12, 13]) }],
  glassbelt: ['Glass Belt', 'belt', 45, { def: [30, 32, 34, 36], int: [10, 15, 20, 25], hp: [50, 75, 100, 125], res: ALLW([10, 11, 12, 13]) }],
  rol:  ['Ring of Life', 'ring', 50, { def: [50, 54, 58, 65], dex: [7, 10, 14, 17], vit: [7, 10, 14, 17], hp: [50, 75, 100, 125], mana: [50, 75, 100, 125], res: { rBolt: [20, 22, 25, 30] } }],
  rom:  ['Ring of Magic', 'ring', 50, { def: [40, 44, 48, 55], mp: [7, 10, 14, 17], vit: [7, 10, 14, 17], hp: [50, 75, 100, 125], mana: [50, 75, 100, 125], res: { rIce: [20, 22, 25, 30] } }],
  roc:  ['Ring of Courage', 'ring', 50, { def: [30, 34, 38, 45], str: [7, 10, 14, 17], vit: [7, 10, 14, 17], hp: [50, 75, 100, 125], mana: [50, 75, 100, 125], res: { rFire: [20, 22, 25, 30] } }],
  flamering: ['Flame Ring', 'ring', 55, { def: [20, 24, 28, 35], fire: [30, 45, 60, 75], vit: [5, 7, 10, 12], dex: [5, 7, 10, 12], mp: [5, 7, 10, 12], res: { rFire: [20, 22, 25, 30], rIce: [5, 7, 10, 15], rBolt: [5, 7, 10, 15] } }],
  imirring:  ['Imir Ring', 'ring', 55, { def: [20, 24, 28, 35], bolt: [30, 45, 60, 75], vit: [5, 7, 10, 12], dex: [5, 7, 10, 12], mp: [5, 7, 10, 12], res: { rBolt: [20, 22, 25, 30], rFire: [5, 7, 10, 15], rIce: [5, 7, 10, 15] } }],
  warear:   ['Warrior Earring', 'ear', 45, { def: [15, 20, 25, 30], str: [5, 8, 12, 16], hp: [40, 60, 80, 100], res: { ...R3(['rFire', 'rIce', 'rBolt'], [10, 12, 15, 18]), rPoison: [30, 35, 40, 45] } }],
  rogear:   ['Rogue Earring', 'ear', 45, { def: [10, 15, 20, 25], dex: [5, 8, 12, 16], hp: [40, 60, 80, 100], mana: [40, 60, 80, 100], res: R3(['rFire', 'rIce', 'rBolt'], [10, 12, 15, 18]) }],
  mageear:  ['Mage Earring', 'ear', 45, { def: [10, 15, 20, 25], mp: [5, 8, 12, 16], hp: [20, 40, 60, 80], mana: [40, 60, 80, 100], res: R3(['rFire', 'rIce', 'rBolt'], [10, 12, 15, 18]) }],
  clericear: ['Cleric Earring', 'ear', 45, { def: [15, 20, 25, 30], int: [5, 8, 12, 16], hp: [40, 60, 80, 100], res: { ...R3(['rFire', 'rIce', 'rBolt'], [10, 12, 15, 18]), rPoison: [30, 35, 40, 45] } }],
  // 2. liste (19 Kas akşam). base: oyunda aynı adla zaten olan eşya (sıradan ya da eşsiz) → değerleri ona yazılır, yeni eşya açılmaz.
  // Hit Rate / Attack Rate / Dodge Rate karşılıksız (oyunda isabet/kaçınma yok).
  warpend:  ['Warrior Pendant', 'neck', 40, { def: [20, 24, 28, 35], str: [5, 7, 10, 12], vit: [5, 7, 10, 12], dex: [5, 7, 10, 12], hp: [100, 150, 200, 250], mana: [150, 225, 300, 375], res: { rFire: [30, 32, 35, 40], rIce: [10, 12, 15, 20], rBolt: [10, 12, 15, 20] } }, 'j:neck:4:2'],
  elepend:  ['Elemental Pendant', 'neck', 50, { def: [20, 24, 28, 35], vit: [10, 15, 20, 25], int: [5, 7, 10, 12], mp: [5, 7, 10, 12], hp: [150, 225, 300, 375], mana: [100, 150, 200, 250], res: { rPoison: [20, 22, 25, 30] } }, 'j:neck:5:2'],
  pripend:  ['Priest Pendant', 'neck', 60, { def: [20, 24, 28, 35], str: [5, 7, 10, 12], int: [5, 7, 10, 12], vit: [10, 15, 20, 25], dex: [10, 15, 20, 25], mana: [100, 150, 200, 250], res: { rMagic: [15, 17, 20, 25] } }, 'j:neck:6:1'],
  aos:  ['Amulet of Strength', 'neck', 50, { def: [0, 2, 4, 6], str: [15, 20, 25, 30], hp: [50, 75, 100, 125] }],
  aod:  ['Amulet of Dexterity', 'neck', 50, { def: [0, 2, 4, 6], dex: [15, 20, 25, 30], hp: [50, 75, 100, 125] }],
  aoh:  ['Amulet of Health', 'neck', 50, { def: [0, 2, 4, 6], vit: [15, 20, 25, 30], hp: [50, 75, 100, 125] }],
  aomp: ['Amulet of Magic Power', 'neck', 50, { def: [0, 2, 4, 6], mp: [15, 20, 25, 30], hp: [50, 75, 100, 125] }],
  lupuspend:  ['Lupus Pendant', 'neck', 55, { def: [20, 22, 24, 26], str: [10, 12, 14, 16], mana: [100, 125, 150, 175], res: { rBolt: [30, 32, 34, 36] } }],
  lobopend:   ['Lobo Pendant', 'neck', 55, { def: [20, 22, 24, 26], hp: [50, 75, 100, 125], mana: [50, 75, 100, 125] }],
  lycaonpend: ['Lycaon Pendant', 'neck', 55, { def: [30, 32, 34, 36], int: [10, 12, 14, 16], hp: [50, 75, 100, 125], res: R3(['rFire', 'rIce', 'rBolt', 'rMagic', 'rPoison'], [15, 16, 17, 18]) }],
  wdn:   ['White Dragon Necklace', 'neck', 60, { def: [0, 2, 4, 6], str: [10, 15, 20, 25], hp: [100, 150, 200, 250], res: { rIce: [50, 55, 60, 70] } }, 'u:buzkolyesi'],
  bdn:   ['Black Dragon Necklace', 'neck', 60, { def: [0, 2, 4, 6], dex: [10, 15, 20, 25], hp: [100, 150, 200, 250], res: { rMagic: [50, 55, 60, 70] } }, 'u:iskolyesi'],
  bludn: ['Blue Dragon Necklace', 'neck', 60, { def: [0, 2, 4, 6], mp: [10, 15, 20, 25], hp: [100, 150, 200, 250], res: { rBolt: [50, 55, 60, 70] } }, 'j:neck:6'],
  rdn:   ['Red Dragon Necklace', 'neck', 60, { def: [0, 2, 4, 6], int: [10, 15, 20, 25], mana: [100, 150, 200, 250], res: { rFire: [50, 55, 60, 70] } }, 'j:neck:7'],
  // String of Skulls kemer (kullanıcı: Iron Necklace ile birlikte takılır)
  sos:   ['String of Skulls', 'belt', 45, { def: [10, 12, 14, 16], str: [5, 9, 13, 17], vit: [5, 9, 13, 17], res: { ...R3(['rDagger', 'rMace', 'rSpear'], [5, 6, 8, 10]), rBolt: [30, 33, 36, 39] } }],
  mino:  ["Minotaur's Earring", 'ear', 55, { def: [0, 2, 4, 6], str: [9, 11, 13, 15], hp: [80, 120, 140, 160], res: R3(['rFire', 'rIce', 'rBolt', 'rPoison'], [10, 12, 15, 20]) }, 'u:sirtlankupesi'],
  coc:   ["Cockatrice's Earring", 'ear', 55, { def: [15, 17, 19, 21], dex: [9, 11, 13, 15], hp: [60, 100, 120, 140], res: R3(['rFire', 'rIce', 'rBolt', 'rPoison'], [10, 12, 15, 20]) }],
  hr:    ['Howling Rooster', 'ear', 55, { def: [15, 17, 19, 21], dex: [9, 11, 13, 15], hp: [60, 100, 120, 140], res: R3(['rFire', 'rIce', 'rBolt', 'rPoison'], [10, 12, 15, 20]) }, 'u:kartalkupesi'],
  lkp:   ["Lich King's Pride", 'ear', 55, { def: [10, 12, 14, 16], vit: [5, 7, 9, 11], mp: [5, 5, 5, 5], hp: [60, 100, 120, 140], mana: [10, 15, 20, 25], res: R3(['rFire', 'rIce', 'rBolt', 'rPoison', 'rMagic'], [10, 12, 15, 20]) }],
  lillime: ["Lillime's Enticement", 'ear', 55, { def: [15, 17, 19, 21], str: [5, 7, 9, 11], vit: [5, 7, 9, 11], hp: [60, 100, 120, 140], res: { rMagic: [30, 32, 35, 40], ...R3(['rFire', 'rIce', 'rBolt'], [10, 12, 15, 20]) } }],
  // Troll King serisi küpeler (19 Kas, 3. liste): +0…+5 (maxP 5; kullanıcı: bu takıların yükseltmesi görece kolay). Troll King'den düşer.
  silvear:  ['Silver Earring', 'ear', 10, { def: [10, 12, 15, 20, 25, 40], dex: [8, 12, 16, 20, 24, 30], maxP: 5 }, 'j:ear:1'],
  opalear:  ['Opal Earring', 'ear', 50, { def: [10, 12, 15, 20, 25, 40], str: [8, 12, 16, 20, 24, 30], maxP: 5 }, 'j:ear:5'],
  crystear: ['Crystal Earring', 'ear', 63, { def: [10, 12, 15, 20, 25, 40], mp: [8, 12, 16, 20, 24, 30], maxP: 5 }, 'j:ear:7'],
  bronzear: ['Bronze Earring', 'ear', 1, { def: [10, 12, 15, 20, 25, 40], vit: [8, 12, 16, 20, 24, 30], maxP: 5 }, 'j:ear:0'],
  goldear:  ['Golden Earring', 'ear', 48, { def: [10, 12, 15, 20, 25, 40], int: [8, 12, 16, 20, 24, 30], maxP: 5 }, null, ['troll_king']],
  eme:      ['Elf-Metal Earring', 'ear', 48, { def: [20, 24, 28, 35, 45, 60], vit: [5, 7, 10, 12, 15, 18], dex: [5, 7, 10, 12, 15, 18], maxP: 5 }, null, ['troll_king']],
  platear:  ['Platinum Earring', 'ear', 60, { def: [20, 24, 28, 35, 45, 60], vit: [5, 7, 10, 12, 15, 18], str: [5, 7, 10, 12, 15, 18], maxP: 5 }, 'j:ear:6'],
  agate:    ['Agate Earring', 'ear', 48, { def: [20, 24, 28, 35, 45, 60], vit: [5, 7, 10, 12, 15, 18], mp: [5, 7, 10, 12, 15, 18], maxP: 5 }, null, ['troll_king']],
  wse:      ['White Silver Earring', 'ear', 30, { def: [20, 24, 28, 35, 45, 60], vit: [5, 7, 10, 12, 15, 18], int: [5, 7, 10, 12, 15, 18], maxP: 5 }, 'j:ear:3:1'],
  sse:      ['Secret Silver Earring', 'ear', 65, { def: [20, 24, 28, 35, 45, 60], vit: [10, 15, 20, 25, 30, 35], maxP: 5 }, 'u:mezarkupesi'], // +5 can değeri tabloda yok: 35 (artış düzeninden)
  foverin:  ['Foverin', 'ring', 50, { def: [40, 44, 48, 55], str: [5, 7, 10, 12], dex: [5, 7, 10, 12], vit: [5, 7, 10, 12], res: { ...R3(['rFire', 'rIce', 'rBolt'], [5, 7, 10, 15]), rPoison: [20, 22, 25, 30] } }],
  kekuri:   ['Kekuri Ring', 'ring', 40, { def: [0, 2, 4, 6], dex: [8, 10, 12, 14], res: R3(['rFire', 'rIce', 'rBolt'], [15, 16, 17, 18]) }],
  elfring:  ['Elf Ring', 'ring', 50, { def: [0, 2, 4, 6], dex: [10, 15, 20, 25], res: { rMagic: [20, 22, 25, 30], rPoison: [10, 12, 15, 20] } }],
  diamond:  ['Diamond Ring', 'ring', 63, { def: [20, 24, 28, 35], str: [10, 15, 20, 25], res: { rBolt: [20, 22, 25, 30], rMagic: [20, 22, 25, 30] } }, 'j:ring:7'],
  elfbelt:  ['Elf Belt', 'belt', 50, { def: [30, 32, 34, 36], dex: [10, 15, 20, 25], res: R3(['rDagger', 'rBow'], [10, 11, 12, 13]) }],
  judbelt:  ['Judicious Belt', 'belt', 45, { def: [0, 2, 4, 6], dex: [10, 14, 18, 22], hp: [50, 75, 100, 125], mana: [50, 75, 100, 125], res: { rFire: [20, 23, 28, 35], rIce: [30, 33, 38, 45] } }],
  skebelt:  ['Skeleton Belt', 'belt', 45, { def: [30, 32, 34, 36], res: { ...R3(['rDagger', 'rMace', 'rSpear'], [10, 11, 12, 13]), rIce: [30, 33, 36, 39] } }, 'u:beykemeri'],
  lbol:     ['Light Belt of Life', 'belt', 50, { def: [10, 12, 14, 16], vit: [8, 12, 16, 20], hp: [50, 75, 100, 125], mana: [50, 75, 100, 125], res: { rFire: [25, 28, 31, 35], rIce: [25, 28, 31, 35] } }],
  manabelt: ['Mana Belt', 'belt', 20, { def: [0, 2, 4, 6], mp: [8, 12, 16, 20], mana: [50, 75, 100, 125] }, 'j:belt:2:1'],
};
for (const [id, [name, jewel, req, X, base]] of Object.entries(KO_JEWELS)) {
  if (!base) UNIQUES[id] = { name, jewel, req, ko: true };
  SPECIAL[base || `u:${id}`] = { z: 1, maxP: 2, ...X, // X.maxP ezer (Troll King küpeleri +5) // kullanıcı: KO takıları en çok +2 (tablodaki +3 değeri kullanılmaz)
    vt: req >= 50 ? 6 : 5 };
}
// eşya kimlikleri; KO_JEWEL_NEW yalnız yeni açılan eşsizler (düşme listesi bunlardan; var olan eşyalar kendi kaynağından düşer)
export const KO_JEWEL_IDS = Object.entries(KO_JEWELS).map(([k, v]) => v[4] || `u:${k}`);
export const KO_JEWEL_NEW = Object.entries(KO_JEWELS).filter(([, v]) => !v[4]).map(([k, v]) => [`u:${k}`, v[2], v[5]]); // [kimlik, seviye, özel kaynak bosslar?]
// z: dizi +0'dan başlar (KO takıları)
const atP = (a, p, z) => { const i = Math.max(0, z ? (p || 0) : (p || 1) - 1); if (a.length === 1) return a[0]; return i < a.length ? a[i] : a[a.length - 1] + (a[a.length - 1] - a[a.length - 2]) * (i - a.length + 1); };
// MP Recovery (KO puanı): vurulan hasarın puan × %0,5'i kadar mana döner (8 → %4, 11 → %5,5; battle.js damage)
export const MP_REC = 0.005;
const SP_KEYS = ['atk', 'def', 'hp', 'str', 'vit', 'dex', 'int', 'mp', 'mana', 'fire', 'bolt', 'elx'];
function specialStats(X, p, r = 1) {
  const out = {};
  for (const k of SP_KEYS) if (X[k]) out[k] = Math.round(atP(X[k], p, X.z) * (k === 'atk' || k === 'def' ? r : 1));
  if (X.ed) out.pdmg = atP(X.ed, p, X.z);
  if (X.mpRec && atP(X.mpRec, p)) out.mpRec = r4(atP(X.mpRec, p) * MP_REC);
  for (const k in X.res || {}) out[k] = r4(atP(X.res[k], p, X.z) / 100);
  for (const k in X.fix || {}) out[k] = r4((out[k] || 0) + X.fix[k] / 100);
  return out;
}
const rqAt = (X, p) => { const o = {}; for (const k in X.rq) o[k] = atP(X.rq[k], p, X.z); return o; };
export const rqOf = it => (SPECIAL[it?.b]?.rq ? rqAt(SPECIAL[it.b], it.p) : itemBase(it.b)?.rq || null);
export const RQ_LABEL = { str: 'STR', vit: 'HP', dex: 'DEX', int: 'INT', mp: 'MP' };
// Şart karşılanıyor mu? tot: kahramanın toplam nitelikleri (hero.js statTotals)
export const meetsRq = (it, tot) => { const r = rqOf(it); if (!r) return true; for (const k in r) if ((tot?.[k] || 0) < r[k]) return false; return true; };
// Okçu dengesi (kullanıcı onayı 19 Kas): bütün yay ve arbaletlerin saldırısı ×0,9 (KO değerli olanlar dahil)
export const BOW_TYPES = new Set(['bow', 'xbow']), BOW_ATK = 0.9;
// Ana statlar: taban × nadirlik × artı × su verme (yan statlar ayrı: subsOf)
export function mainStats(it) {
  const X = SPECIAL[it.b];
  if (X) { const o = specialStats(X, it.p, it.r ? REFORGE.mult : 1); if (o.atk && BOW_TYPES.has(itemBase(it.b)?.type)) o.atk = Math.round(o.atk * BOW_ATK); return o; }
  const B = itemBase(it.b), G = GRADES[gi(it)], m = G.mult * PLUS_MULT[it.p] * (it.r ? REFORGE.mult : 1), out = {};
  if (BOW_TYPES.has(B.type)) { for (const k in B.stats) out[k] = SCALED.includes(k) ? Math.round(B.stats[k] * m) : isCoef(k) ? r4(B.stats[k] * G.coef) : B.stats[k]; out.atk = Math.round((out.atk || 0) * BOW_ATK); return out; }
  for (const k in B.stats) out[k] = SCALED.includes(k) ? Math.round(B.stats[k] * m) : isCoef(k) ? r4(B.stats[k] * G.coef) : B.stats[k];
  return out;
}
// Eşyanın bütün statları: ana statlar + yan statlar (aynı anahtar toplanır)
export function itemStats(it) {
  const out = mainStats(it);
  for (const s of subsOf(it)) out[s.k] = SUB_FLAT.includes(s.k) ? (out[s.k] || 0) + s.v : r4((out[s.k] || 0) + s.v);
  return out;
}

// ---- Yan statlar ----
// Nadir eşyada 2, Eşsiz'de 3 rastgele yan stat. +3, +6 ve +9'da (artı seviyesi oraya ulaştığında) biri bir kez daha
// güçlenir; artı düşerse güçlenme de geri gider. Hangi statların geleceği ve değerleri eşyanın tohumundan (it.x; yoksa
// taban + kimlik) türetilir: sunucu ve istemci aynı sonucu bulur, kayda yalnızca tohum yazılır.
// v(t): kademeye göre bir "zar"ın ortası; her zar ortanın %80-120'si arasıdır.
export const SUBS = {
  spd:     { name: 'Hız',            v: t => 2 + Math.floor(t * 0.6) },
  crit:    { name: 'Kritik',         v: t => 0.02 + 0.003 * t },
  critDmg: { name: 'Kritik hasarı',  v: t => 0.05 + 0.01 * t },
  acc:     { name: 'İsabet',         v: t => 0.03 + 0.006 * t },
  ccRes:   { name: 'Direnç',         v: t => 0.03 + 0.006 * t },
  pwrPct:  { name: 'Güç',            v: t => 0.03 + 0.004 * t },
  hpPct:   { name: 'Can',            v: t => 0.03 + 0.005 * t },
  defPct:  { name: 'Savunma',        v: t => 0.03 + 0.005 * t },
};
export const SUB_KEYS = Object.keys(SUBS);
export const SUB_N = [0, 2, 3];
export const subCount = it => SUB_N[gi(it)] || 0;                       // nadirliğe göre yan stat sayısı
export const SUB_UP = [3, 6, 9];                      // bu artılarda bir yan stat güçlenir
const SUB_FLAT = ['spd'];
const hash32 = str => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
export const seedOf = it => (Number.isInteger(it.x) ? it.x >>> 0 : hash32(`${it.b}#${it.id ?? 0}`));
export const newSeed = (b, id, salt = 0) => hash32(`${b}#${id}#${salt}`);
function subRng(seed) { let a = seed >>> 0 || 1; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const subRoll = (k, t, r) => { const v = SUBS[k].v(t) * (0.8 + 0.4 * r); return SUB_FLAT.includes(k) ? Math.max(1, Math.round(v)) : r4(v); };
// [{ k, v, up, at }] — up: bu stata düşen güçlenme sayısı · at: güçlendiği artılar (ör. [3, 9])
export function subsOf(it) {
  const B = itemBase(it.b), n = B ? SUB_N[gi(it)] : 0;
  if (!n || (it.id == null && !Number.isInteger(it.x))) return []; // önizleme (kimliksiz, tohumsuz) eşyada yan stat henüz yok
  const rand = subRng(seedOf(it)), pool = [...SUB_KEYS], out = [];
  for (let i = 0; i < n && pool.length; i++) { const k = pool.splice(Math.floor(rand() * pool.length), 1)[0]; out.push({ k, v: subRoll(k, B.tier, rand()), up: 0, at: [] }); }
  const ups = SUB_UP.filter(x => (it.p || 0) >= x).length;
  for (let i = 0; i < SUB_UP.length; i++) { const s = out[Math.floor(rand() * out.length)], r = rand(); if (i < ups) { s.v = SUB_FLAT.includes(s.k) ? s.v + subRoll(s.k, B.tier, r) : r4(s.v + subRoll(s.k, B.tier, r)); s.up++; s.at.push(SUB_UP[i]); } }
  return out;
}
export const fmtSub = s => (SUB_FLAT.includes(s.k) ? `${SUBS[s.k].name} +${s.v}` : `${SUBS[s.k].name} +${fmtPct(s.v)}`);

// ---- Zırh seti bonusları ----
// Aynı setin (aynı kademe, aynı sınıf) 2, 4 ve 5 parçası. Ek setlerin (items-var.js) parçaları aynı kademenin asıl setiyle
// birlikte sayılır (karışık giyim tek set; iki ayrı 2'li bonus alınamaz) giyilince. 2'li: sınıfın ana statı · 4'lü: setin özel etkisi
// (kademe ve sınıfa göre döner; Kızıl Örs 4'lü = kritikte yanık) · 5'li: can ve savunma.
export const SET_FX = [
  { k: 'steal',    name: 'Can çalma',             v: t => 0.05 + 0.006 * t },
  { k: 'critDmg',  name: 'Kritik hasarı',         v: t => 0.12 + 0.02 * t },
  { k: 'dr',       name: 'Hasar azaltma',         v: t => 0.04 + 0.005 * t },
  { k: 'healPct',  name: 'İyileştirme',           v: t => 0.08 + 0.015 * t },
  { k: 'critBurn', name: 'Kritikte yanık şansı',  v: t => 0.3 + 0.03 * t },
  { k: 'spd',      name: 'Hız',                   v: t => 4 + t, flat: true },
  { k: 'acc',      name: 'İsabet',                v: t => 0.08 + 0.01 * t },
  { k: 'ccRes',    name: 'Direnç',                v: t => 0.08 + 0.01 * t },
];
const SET_MAIN = { warrior: 'atkPct', rogue: 'atkPct', priest: 'hpPct', mage: 'magPct' };
const SET_MAIN_NAME = { atkPct: 'Saldırı', hpPct: 'Can', magPct: 'Büyü' };
const CLS_I = { warrior: 0, rogue: 1, priest: 2, mage: 3 };
// Bir setin bonus tablosu: { 2: {k,v,name}, 4: {...}, 5: [{...},{...}] }
export function setBonus(cls, t) {
  const fx = SET_FX[(t + CLS_I[cls] * 3) % SET_FX.length], main = SET_MAIN[cls];
  return {
    2: [{ k: main, v: r4(0.04 + 0.01 * t), name: SET_MAIN_NAME[main] }],
    4: [{ k: fx.k, v: fx.flat ? fx.v(t) : r4(fx.v(t)), name: fx.name, flat: !!fx.flat }],
    5: [{ k: 'hpPct', v: r4(0.05 + 0.008 * t), name: 'Can' }, { k: 'defPct', v: r4(0.05 + 0.008 * t), name: 'Savunma' }],
  };
}
export const SET_PIECES = [2, 4, 5];
export const fmtSetFx = e => `${e.name} +${e.flat ? e.v : fmtPct(e.v)}`;
// Kuşanılan eşyalardan setler: [{ set, cls, t, n, on: [2,4], bonus }]
export function setsOf(items) {
  const by = new Map();
  for (const it of items) { const B = it && itemBase(it.b); if (B && B.kind === 'armor' && B.set) { const key = `${B.cls[0]}:${B.tier}`; const r = by.get(key) || by.set(key, { set: B.set, cls: B.cls[0], t: B.tier, n: 0 }).get(key); r.n++; } }
  return [...by.values()].map(r => ({ ...r, on: SET_PIECES.filter(x => r.n >= x), bonus: setBonus(r.cls, r.t) }));
}
// Etkin set bonuslarının toplamı (anahtar → değer)
export function setMods(items) {
  const out = {};
  for (const s of setsOf(items)) for (const x of s.on) for (const e of s.bonus[x]) out[e.k] = e.flat ? (out[e.k] || 0) + e.v : r4((out[e.k] || 0) + e.v);
  return out;
}
// ---- Eşya Seviyesi: kademe, nadirlik, artı ve su vermeden hesaplanan tek sayı (kahraman ve parti ortalaması hero.js'te) ----
export const IL = { rarity: [1, 1.25, 1.6], plus: 0.08, reforge: 1.3 };
export const itemScore = it => Math.round(10 * (itemBase(it.b).tier + 1) * IL.rarity[gi(it)] * (1 + IL.plus * it.p) * (it.r ? IL.reforge : 1));
export const itemName = it => `${it.r ? 'Sulu ' : ''}${itemBase(it.b).name}${it.p ? ' +' + it.p : ''}`;

// Bir eşya bu sınıfta hangi yuvalara takılabilir? (boşsa takılamaz)
export function equipSlots(it, cls, lvl) {
  const B = itemBase(it.b);
  if (!B || lvl < B.req) return [];
  if (B.cls && !B.cls.includes(cls)) return [];
  return B.slots;
}

export const STAT_LABEL = {
  atk: 'Saldırı', mpRec: 'Hasardan mana', mag: 'Büyü', fire: 'Alev Hasarı', bolt: 'Yıldırım Hasarı', burnPct: 'Yanık hasarı', lock: 'Kilit şansı', def: 'Savunma', hp: 'Can', spd: 'Hız', crit: 'Kritik', pen: 'Savunma delme',
  str: 'STR', vit: 'HP', dex: 'DEX', int: 'INT', mp: 'MP', mana: 'Mana', elx: 'Element Hasarı', pdmg: 'Element hasarı', critDmg: 'Kritik hasarı', acc: 'İsabet', ccRes: 'Direnç', pwrPct: 'Güç', hpPct: 'Can', defPct: 'Savunma', atkPct: 'Saldırı', magPct: 'Büyü',
  ...Object.fromEntries(Object.entries(WEAPON_CLASS).map(([k, n]) => [resKey(k), `${n} savunması`])),
  ...Object.fromEntries(Object.entries(ELEMENTS).map(([k, n]) => [resKey(k), `${n} direnci`])),
  rPoison: 'Zehir direnci', rMagic: 'Büyü hasarı direnci',
};
export const fmtPct = v => `%${(Math.round(v * 1000) / 10).toFixed(1).replace('.0', '').replace('.', ',')}`;
export const fmtStat = (k, v) => k === 'crit' || isCoef(k) || /Pct$|^(critDmg|acc|ccRes|lock|mpRec)$/.test(k) ? fmtPct(v) : `${v}`;
// Drop oranı: yüzde (küçük oranlarda daha çok basamak; sondaki sıfırlar yalnızca virgülden sonra atılır) ve "kaçta bir"
export function fmtRate(r) {
  if (!(r > 0)) return '—';
  if (r >= 0.995) return '%100';
  const v = r * 100, d = v >= 10 ? 0 : v >= 1 ? 1 : v >= 0.1 ? 2 : 3, t = v.toFixed(d);
  return `%${(d ? t.replace(/0+$/, '').replace(/\.$/, '') : t).replace('.', ',')}`;
}
export const oneIn = r => (r > 0 && r < 0.5 ? `1/${Math.round(1 / r).toLocaleString('tr-TR')}` : '');

// Bir yaratık seviyesi için düşebilecek kademe eşyası tabanları (kademe = seviyeye uygun en yüksek)
export const tierForLevel = lvl => Math.max(0, TIERS.findLastIndex(t => t.req <= lvl));
export function commonPool(tier) {
  const out = [];
  for (const w of Object.keys(WEAPONS)) if (hasTier(w, tier)) out.push(`w:${w}:${tier}`);
  for (const c of CLASS_KEYS) for (const s of ARMOR_SLOTS) out.push(`a:${c}:${tier}:${s}`);
  for (const j of Object.keys(JEWELS)) out.push(`j:${j}:${tier}`);
  return out;
}
// ---- Kademe eşyası düşmesi (drops.js, Yeraltı Ocağı, çark, takvim, Pazar botları) ----
// Üç adımda seçilir: önce düşme grubu (silah ailesi, zırh parçası, takı türü; hepsi eşit), sonra grubun içinde tür, en son
// varyant. Böylece varyant eklemek bir türün düşme payını SULANDIRMAZ. Silah aileleri, yeni silah türleri gelmeden önceki
// 31'lik havuzun silah yerleridir: her aile o eski tek türün payını alır, zırh ve takı payları da eski hâline döner.
export const DROP_FAMILY = { sword: ['sword', 'sword2', 'spear'], axe2: ['axe2', 'axe1', 'lance'], dagger: ['dagger', 'jamadar'], bow: ['bow', 'xbow'], mace: ['mace', 'mace2'], staff: ['staff'], shield: ['shield'] };
const GROUPS = new Map();
export function gearGroups(tier) {
  if (GROUPS.has(tier)) return GROUPS.get(tier);
  const out = Object.values(DROP_FAMILY).map(F => F.filter(w => hasTier(w, tier)).map(w => `w:${w}:${tier}`)).filter(g => g.length);
  for (const c of CLASS_KEYS) for (const s of ARMOR_SLOTS) out.push([`a:${c}:${tier}:${s}`]);
  for (const j of Object.keys(JEWELS)) if (!JEWELS[j].mageLine) out.push([`j:${j}:${tier}`]);
  out.push(Object.keys(JEWELS).filter(j => JEWELS[j].mageLine).map(j => `j:${j}:${tier}`)); // büyücü takıları tek düşme grubu (öbür payları sulandırmaz)
  GROUPS.set(tier, out);
  return out;
}
export const pickGear = (rand, tier) => pickFrom(rand, variantIds(pickFrom(rand, pickFrom(rand, gearGroups(tier)))));
// Bir kademe eşyası düştüğünde tam olarak bu tabanın çıkma olasılığı (Ansiklopedi oranları)
export function gearShare(b) {
  const B = itemBase(b);
  if (!B || B.unique) return 0;
  const main = B.v ? b.slice(0, b.lastIndexOf(':')) : b, G = gearGroups(B.tier), g = G.find(x => x.includes(main));
  return g ? 1 / G.length / g.length / variantIds(main).length : 0;
}

// Pazar referans değeri (bot fiyatları ve arayüzdeki "piyasa" ipucu için)
export const refPrice = it => Math.round(sellPrice(it) * 6 * (it.r ? 3 : 1));
// Satılamaz eşya (nt: 1): görev ödülü ve oyunun hediyesi; Pazar'a konamaz (Tüccar'a satılabilir). Eski kayıtta alan yoktur → satılabilir.
export const isTradable = it => !!it && !it.nt;
// Oyundaki bütün eşya tabanları (Ansiklopedi kataloğu ve istemciden gelen taban kimliğinin denetimi için)
export const allBases = () => [...TIERS.flatMap((_, t) => commonPool(t).flatMap(variantIds)), ...Object.keys(UNIQUES).map(k => 'u:' + k)];
