// Yetenek tablosu: 4 sınıf × 3 ağaç × 8 düğüm + temel saldırılar, başlangıç yetenekleri,
// usta (master) yetenekleri ve yaratık yetenekleri. Hepsi veri; savaş motoru fx listesini yorumlar.
// Açıklamalar veriden üretilir (describe), böylece metin ile kural birbirinden kopamaz.
// Uzmanlık yollarının yetenekleri de buradadır (path alanı; tablolar paths.js): her yol için 4 aktif, 3 pasif, 1 usta.
import { TREE_NODES, STATUS } from './content.js';
import { WEAPON_CLASS } from './items.js';
import { PATH, PATHS } from './paths.js';

export const MREQ = [1, 10, 20]; // usta yeteneklerinin açıldığı ustalık puanları (km satırları bu değerleri kullanır)
// ---- fx kısaltmaları ----
const d = (m, o = {}) => ({ k: 'dmg', m, ...o });                         // hasar: güç × m
const st = (s, t, c = 1, to = 't') => ({ k: 'st', s, t, c, to });         // durum etkisi
const heal = (m, to = 't', o = {}) => ({ k: 'heal', m, to, ...o });       // şifa: büyü × m (+ pct × azami can)
const shield = (o, t, to = 't') => ({ k: 'shield', t, to, ...o });        // kalkan: m × büyü ya da pctSelf × azami can
const tm = (v, to = 't') => ({ k: 'tm', v, to });                         // sıra çubuğu ±
const cleanse = (to = 't') => ({ k: 'cleanse', to });
const revive = pct => ({ k: 'revive', pct });
const hpUp = (p, t, to = 't') => ({ k: 'st', s: 'hpUp', t, c: 1, to, p }); // azami can +p (Can Artışı)
const hpDown = (p, t, c = 1) => ({ k: 'st', s: 'hpDown', t, c, to: 't', p }); // azami can −p (Can Kaybı)
const purge = s => ({ k: 'purge', s, to: 't' }); // hedefin bu güçlendirmeleri silinir
const stp = (s, t, p, c = 1, to = 't', o = {}) => ({ k: 'st', s, t, c, to, p, ...o }); // değerli etki (p: Güç +15, Sağlamlık %40, yenilenme 100…)
const mpBurn = n => ({ k: 'mpBurn', n, to: 't' });
const GONE = { gone: true };
// ---- Uzmanlık yollarıyla gelen etkiler (motor: battle.js, sürüm 2) ----
const guard = (t, share, to = 't') => ({ k: 'guard', t, share, to });     // himaye: hedefin aldığı hasarın share kadarını kullanan üstlenir
const det = (s, m) => ({ k: 'det', s, m });                               // patlatma: hedefteki süren hasarın (s) kalanı × m hemen verilir, etki silinir
const strip = (n = 1, to = 't') => ({ k: 'strip', n, to });               // sökme: hedefin n güçlendirmesi silinir
const V = (s, bonus) => ({ s, bonus });                                   // fırsat vuruşu (dmg.vs): hedefte s etkilerinden biri varsa +bonus hasar
const W = (k, bonus) => ({ k, bonus });                                   // silah ustalığı (dmg.wt): kullanan k sınıfı silah kuşanmışsa +bonus hasar

export const SKILLS = {};
const add = (id, s) => { SKILLS[id] = { id, cd: 0, fx: [], ...s }; };
// tree(ağaç, sınıf, güç kaynağı, [[ad, hedef|'passive', bekleme, animasyon, fx[] | mods{}], ...8])
function tree(key, cls, sc, rows) {
  rows.forEach((r, i) => {
    const [name, target, cd, anim, body] = r;
    const base = { name, cls, tree: key, req: TREE_NODES[i], sc };
    if (target === 'passive') add(`${key}${i + 1}`, { ...base, type: 'passive', mods: body });
    else add(`${key}${i + 1}`, { ...base, type: 'active', target, cd, anim, fx: body });
  });
}

// ================= TEMEL SALDIRILAR =================
add('w_basic', { name: 'Kılıç Darbesi', cls: 'warrior', type: 'basic', target: 'enemy', anim: 'melee', sc: 'atk', fx: [d(1.0)] });
add('r_basic', { name: 'Hançer Darbesi', cls: 'rogue', type: 'basic', target: 'enemy', anim: 'melee', sc: 'atk', fx: [d(1.0)] });
add('p_basic', { name: 'Topuz Darbesi', cls: 'priest', type: 'basic', target: 'enemy', anim: 'melee', sc: 'atk', fx: [d(1.0)] });
add('m_basic', { name: 'Kıvılcım', cls: 'mage', type: 'basic', target: 'enemy', anim: 'bolt', sc: 'mag', fx: [d(1.0)] });

// ================= SINIF YETENEKLERİ (Kasım 2026) =================
// Ağaç düzeni, açılış eşikleri ve etkiler türün klasik MMO şablonundan uyarlandı. GEÇİCİ: adlar kaynak oyunun adları (kullanıcı kararı,
// 19 Kas); yayın öncesi özgün adlarla değiştirilecek. Özgün ad önerileri: Claude Docs şeması / git geçmişi (7d83ca2).
// kb: seviyeyle açılan temel yetenekler [seviye, ad, hedef, bekleme, animasyon, fx, gizli?] (gizli: 65 üstü, oyuncu görmez)
// kt: ağaç [puan, ad, hedef | 'passive', bekleme, animasyon, fx | mods] · km: usta ağacı [ustalık puanı, ad, hedef | 'passive', bekleme, animasyon, fx | mods]
// (km yol anahtarıyla çağrılırsa o uzmanlığın, null ile sınıfın iki uzmanlığının da usta yeteneğidir)
function kb(cls, sc, rows) {
  rows.forEach(([lvl, name, target, cd, anim, fx, hidden], i) =>
    add(`${cls[0]}_k${i + 1}`, { name, cls, sc, type: 'active', lvl: hidden ? 99 : lvl, ...(hidden ? { hidden: true } : {}), target, cd, anim, fx }));
}
function kt(key, cls, sc, rows) {
  rows.forEach(([req, name, target, cd, anim, body, extra = {}], i) => {
    if (extra.gone) return; // kaldırılan yetenek: sıra korunur (kimlikler kaymasın), kaydı yapılmaz
    const base = { name, cls, tree: key, req, sc, ...extra };
    if (target === 'passive') add(`${key}${i + 1}`, { ...base, type: 'passive', mods: body });
    else add(`${key}${i + 1}`, { ...base, type: 'active', target, cd, anim, fx: body });
  });
}
function km(cls, path, sc, rows) {
  rows.forEach(([mreq, name, target, cd, anim, body, extra = {}], i) => {
    const base = { name, cls, sc, mreq, ...(path ? { path, pm: true } : { master: true }), ...extra }, id = `${path || cls[0]}_um${i + 1}`;
    if (target === 'passive') add(id, { ...base, type: 'passive', mods: body });
    else add(id, { ...base, type: 'active', target, cd, anim, fx: body });
  });
}
const FIRE = { el: 'fire' }, ICE = { el: 'ice' }, BOLT = { el: 'bolt' };

// ---- Savaşçı ----
kb('warrior', 'atk', [
  [3, 'Stroke', 'enemy', 2, 'melee', [d(0.7), st('stun', 1, 0.2)]],
  [5, 'Sprint', 'self', 4, 'buff', [st('spdUp', 2, 1, 'self')]],
  [8, 'Slash', 'enemy', 2, 'melee', [d(1.2)]],
  [10, 'Crash', 'self', 4, 'buff', [st('critUp', 2, 1, 'self')]],
  [74, 'Defense', 'self', 5, 'buff', [st('defUp', 3, 1, 'self')], true],
  [98, 'Piercing', 'enemy', 3, 'melee', [d(1.2, { pierce: 0.3 })], true],
]);
kt('hucum', 'warrior', 'atk', [ // Saldırgan
  [0, 'Hash', 'enemy', 1, 'melee', [d(1.0, { pierce: 0.15 })]],
  [5, 'Hoodwink', 'enemy', 3, 'melee', [d(1.5)]],
  [10, 'Shear', 'enemy', 2, 'melee', [d(1.0, { pierce: 0.25 })]],
  [15, 'Pierce', 'enemy', 2, 'melee', [d(1.0, { pierce: 0.3 })]],
  [20, 'Leg Cutting', 'enemy', 3, 'melee', [d(1.0), st('spdDown', 2, 0.8)]],
  [25, 'Carving', 'enemy', 4, 'melee', [d(2.0)]],
  [30, 'Sever', 'enemy', 3, 'melee', [d(1.2, { pierce: 0.4 })]],
  [35, 'Prick', 'enemy', 3, 'melee', [d(1.5, { pierce: 0.3 })]],
  [40, 'Multiple Shock', 'enemy', 3, 'melee', [d(1.6)]],
  [45, 'Cleave', 'enemy', 5, 'whirl', [d(2.5)]],
  [50, 'Mangling', 'enemy', 4, 'stomp', [d(1.4, { pierce: 0.5 })]],
  [55, 'Thrust', 'enemy', 4, 'melee', [d(2.0, { pierce: 0.3 })]],
  [57, 'Sword Aura', 'enemy', 5, 'whirl', [d(2.7, { pierce: 0.3 })]],
  [60, 'Sword Dancing', 'enemy', 5, 'whirl', [d(2.52, { pierce: 0.3 })]], // 19 Kas: −%10 (Saldırgan Sv. 65 PvP %82)
]);
kt('siper', 'warrior', 'atk', [ // Tank
  [5, 'Hinder', 'passive', 0, '', { defPct: 0.10 }, { grp: 'siperDef' }],
  [10, 'Resist', 'passive', 0, '', { elRes: 0.06 }],
  [15, 'Arrest', 'passive', 0, '', { defPct: 0.15 }, { grp: 'siperDef' }],
  [20, 'Endure', 'passive', 0, '', { elRes: 0.12 }],
  [30, 'Binding', 'enemy', 3, 'melee', [d(0.5), st('taunt', 2, 1, 'self')]],
  [35, 'Bulwark', 'passive', 0, '', { defPct: 0.20 }, { grp: 'siperDef' }],
  [45, 'Provoke', 'enemies', 4, 'buff', [st('provoked', 1), stp('defUp', 2, 0.2, 1, 'self')], { pick: 2 }], // kullanıcı belgesi 19 Kas: 2 düşman 1 tur yalnız Tank'a vurur + kendine Sağlamlık %20
  [60, 'Sacrifice', 'ally', 6, 'heal', [heal(0, 't', { pct: 0.35 })]],
]);
kt('ofke', 'warrior', 'atk', [ // ortak
  [5, 'Gain', 'self', 5, 'buff', [st('atkUp', 3, 1, 'self')]],
  [8, 'Wink', 'enemy', 3, 'melee', [d(1.5)]],
  [10, 'Rise', 'passive', 0, '', { hpPct: 0.03 }],
  [15, 'Pain Killer', 'enemy', 2, 'melee', [d(1.0)]],
  [20, 'Outrage', 'self', 5, 'buff', [shield({ pctSelf: 0.25 }, 1, 'self')]],
  [28, 'Shock', 'enemy', 3, 'melee', [d(1.3, { pierce: 0.5 })]],
]);
km('warrior', 'yaran', 'atk', [
  [1, 'Howling Sword', 'enemy', 6, 'whirl', [d(3.4, { pierce: 0.3 })]],
  [10, 'Blooding', 'enemy', 6, 'melee', [d(2.3), st('bleed', 2)]],
  [20, 'Hell Blade', 'enemy', 7, 'stomp', [d(3.7, { pierce: 0.3 })]],
]);
km('warrior', 'sur', 'atk', [
  [1, 'Iron Skin', 'passive', 0, '', { defPct: 0.30 }, { grp: 'surDef' }],
  [10, 'Wall Of Iron', 'self', 6, 'buff', [st('defUp', 1, 1, 'self'), shield({ pctSelf: 0.3 }, 1, 'self')]],
  [20, 'Iron Body', 'passive', 0, '', { defPct: 0.40 }, { grp: 'surDef' }],
]);

// ---- Suikastçı ----
kb('rogue', 'atk', [
  [3, 'Stab', 'enemy', 1, 'melee', [d(0.7)]],
  [5, 'Sprint', 'self', 4, 'buff', [st('spdUp', 2, 1, 'self')]],
  [8, 'Thrust', 'enemy', 2, 'melee', [d(1.2)]],
]);
kt('hancer', 'rogue', 'atk', [ // Suikastçı
  [0, 'Stab', 'enemy', 1, 'melee', [d(1.0)]],
  [5, 'Stab2', 'enemy', 2, 'melee', [d(1.3)]],
  [10, 'Jab', 'enemy', 2, 'melee', [d(1.5)]],
  [15, 'Blood Drain', 'enemy', 3, 'melee', [d(1.2), heal(0, 'self', { pct: 0.04 })]],
  [20, 'Pierce', 'enemy', 2, 'melee', [d(1.2, { pierce: 0.3 })]],
  [25, 'Shock', 'enemy', 4, 'melee', [d(1.0), st('stun', 1, 0.5)]],
  [30, 'Thrust', 'enemy', 3, 'melee', [d(2.0)]],
  [35, 'Cut', 'enemy', 3, 'melee', [d(1.2), st('bleed', 2)]],
  [40, 'Vampiric Touch', 'enemy', 4, 'melee', [d(1.5), heal(0, 'self', { pct: 0.06 })]],
  [45, 'Bloody Beast', 'enemy', 4, 'whirl', [d(2.5)]],
  [50, 'Blinding', 'enemy', 3, 'melee', [d(0.8), st('atkDown', 2, 0.8)]],
  [55, 'Beast Hiding', 'self', 5, 'buff', [st('critUp', 2, 1, 'self')]],
  [60, 'Spike', 'enemy', 5, 'melee', [d(3.0, { crit: 0.3 })]],
]);
kt('yay', 'rogue', 'atk', [ // Okçu
  [0, 'Archery', 'enemy', 1, 'arrow', [d(1.0)]],
  [5, 'Arrow Shower', 'enemies', 3, 'arrowBig', [d(0.7)]],
  [10, 'Fire Arrow', 'enemy', 3, 'arrow', [d(1.2, FIRE), st('burn', 2)]],
  [15, 'Poison Arrow', 'enemy', 3, 'arrow', [d(1.1), st('poison', 2)]],
  [20, 'Multiple Shot', 'random', 3, 'arrowBig', [d(0.8, { hits: 3 })]],
  [25, 'Guided Arrow', 'enemy', 3, 'arrow', [d(1.4, { pierce: 0.3 })]],
  [30, 'Perfect Shot', 'enemy', 3, 'arrow', [d(2.0)]],
  [35, 'Ice Arrow', 'enemy', 3, 'arrow', [d(1.4, ICE), st('spdDown', 2, 0.7)]],
  [40, 'Arc Shot', 'enemies', 4, 'arrowBig', [d(1.2)]],
  [45, 'Explosive Shot', 'enemies', 5, 'arrowBig', [d(1.4)]],
  [50, 'Viper', 'random', 4, 'arrowBig', [d(0.9, { hits: 3 }), st('poison', 2, 0.5)]],
  [55, 'Counter Strike', 'self', 5, 'buff', [st('critUp', 2, 1, 'self'), st('ward', 1, 1, 'self')]],
  [60, 'Shadow Shot', 'enemy', 5, 'arrowBig', [d(3.0, { pierce: 0.3 })]],
]);
kt('iz', 'rogue', 'atk', [ // ortak
  [5, 'Hide', 'self', 4, 'buff', [st('ward', 1, 1, 'self')]],
  [10, 'Light Feet', 'self', 4, 'buff', [st('spdUp', 2, 1, 'self')]],
  [15, 'Evade', 'passive', 0, '', { dr: 0.05 }],
  [20, 'Safety', 'self', 5, 'buff', [shield({ pctSelf: 0.2 }, 2, 'self')]],
  [25, 'Scaled Skin', 'passive', 0, '', { defPct: 0.15 }],
  [30, 'Minor Healing', 'self', 4, 'heal', [heal(0, 'self', { pct: 0.2 })]],
  [35, 'Lupine Eyes', 'self', 5, 'buff', [st('critUp', 2, 1, 'self')]],
  [40, 'Taunt', 'self', 4, 'buff', [st('taunt', 2, 1, 'self')]],
  [45, 'Invisibility', 'self', 6, 'buff', [st('ward', 1, 1, 'self'), st('atkUp', 1, 1, 'self')]],
]);
km('rogue', 'agu', 'atk', [
  [1, 'Critical Point', 'self', 6, 'buff', [st('critUp', 2, 1, 'self'), st('atkUp', 2, 1, 'self')]],
  [10, 'Cold Wave', 'enemies', 6, 'whirl', [d(1.2, ICE), st('spdDown', 2, 0.7)]],
  [20, 'Eskrima', 'enemy', 7, 'melee', [d(3.5, { pierce: 0.3 })]],
]);
km('rogue', 'nisanci', 'atk', [
  [1, 'Power Shot', 'enemy', 5, 'arrowBig', [d(3.0)]],
  [10, 'Blinding Strafe', 'enemies', 6, 'arrowBig', [d(0.8), st('atkDown', 2, 0.7)]],
  [20, 'Super Archer', 'self', 6, 'buff', [st('atkUp', 2, 1, 'self'), st('critUp', 2, 1, 'self')]],
]);

// ---- Rahip ----
kb('priest', 'mag', [
  [3, 'Holy Attack', 'enemy', 1, 'melee', [d(0.7)]],
  [5, 'Sprint', 'self', 4, 'buff', [st('spdUp', 2, 1, 'self')]],
  [8, 'Collision', 'enemy', 2, 'melee', [d(1.2)]],
]);
kt('kutsama', 'priest', 'mag', [ // Güçlendirici
  [0, 'Strength', 'allies', 5, 'buff', [stp('strUp', 3, 15)]],
  [5, 'Armor', 'allies', 5, 'buff', [stp('armorUp', 3, 50)]], // 19 Kas (kullanıcı): düz savunma, Zırh etkisi
  [10, 'Grace', 'allies', 5, 'buff', [hpUp(250, 3)]],
  [15, 'Resist', 'allies', 5, 'buff', [stp('resUp', 3, 0.2)]],
  [20, 'Swift', 'allies', 5, 'buff', [st('spdUp', 2)], GONE],
  [25, 'Insight', 'allies', 5, 'buff', [st('critUp', 3)], GONE],
  [30, 'Heapness', 'allies', 6, 'buff', [hpUp(750, 3)]],
  [35, 'Shield', 'allies', 5, 'buff', [shield({ m: 1.5 }, 2)], GONE],
  [40, 'Superioris', 'allies', 5, 'buff', [stp('armorUp', 3, 150)]],
  [45, 'Might', 'allies', 6, 'buff', [st('atkUp', 3), st('critUp', 2)], GONE],
  [50, 'Imposingness', 'allies', 6, 'buff', [hpUp(1000, 3)]],
  [55, 'Undying', 'allies', 7, 'buff', [hpUp(0.6, 3)]],
  [60, 'Massiveness', 'allies', 7, 'buff', [hpUp(1500, 3)]],
  // hasar (tek başına oynayan Güçlendirici için; sıra sonda kalır ki eski kayıtların kimlikleri kaymasın)
  // pve: yalnız yaratıklara vurur (PvP'de kahramana atılamaz)
  [2, 'Mace Strike', 'enemy', 2, 'melee', [d(1.4)], { pve: true }],
  [17, 'Crushing Blow', 'enemy', 3, 'melee', [d(2.0), st('atkDown', 1, 0.5)], { pve: true }],
  [37, 'Shock Wave', 'enemies', 4, 'stomp', [d(1.2)], { pve: true }],
  // 19 Kas (kullanıcı): üç düz savunma güçlendirmesi (Zırh etkisi; ağaçtaki Armor/Superioris ile aynı etki, birikmez). Adlar geçici.
  [25, 'Iron Skin', 'allies', 5, 'buff', [stp('armorUp', 3, 100)]],
  [50, 'Steel Skin', 'allies', 5, 'buff', [stp('armorUp', 3, 200)]],
  [60, 'Holy Bulwark', 'allies', 5, 'buff', [stp('armorUp', 3, 300)]],
]);
kt('lanet', 'priest', 'mag', [ // Zayıflatıcı
  [0, 'Holy Strike', 'enemy', 1, 'bolt', [d(1.0, BOLT)]],
  [5, 'Slow', 'enemy', 3, 'bolt', [st('spdDown', 2, 0.9)]],
  [10, 'Malice', 'enemy', 3, 'bolt', [st('defDown', 3, 0.9)]], // 19 Kas: 2 → 3 tur (Zayıflatıcı Sv. 20–40 çok zayıftı)
  [15, 'Confusion', 'enemy', 3, 'bolt', [st('atkDown', 2, 0.8)]],
  [20, 'Parasite', 'enemy', 4, 'bolt', [purge(['hpUp']), hpDown(0.2, 2)]],
  [25, 'Weaken', 'enemy', 4, 'bolt', [mpBurn(480)]],
  [30, 'Dispel', 'enemy', 4, 'bolt', [strip(2)]],
  [35, 'Sleep', 'enemy', 5, 'bolt', [stp('stun', 1, undefined, 0.7, 't', { pvpc: 0.2 })]], // PvP'de (hedef kahraman) %20
  [40, 'Massive Malice', 'enemies', 5, 'meteor', [st('defDown', 2, 0.9)], { share: 0.6, gone: true }],
  [45, 'Helis', 'enemy', 4, 'bolt', [d(2.0, BOLT)]],
  [50, 'Torment', 'enemies', 5, 'meteor', [st('defDown', 3, 0.9)], { share: 0.4 }], // 19 Kas: 3 tur
  [55, 'Massive Slow', 'enemies', 5, 'meteor', [st('spdDown', 2, 0.9)], { share: 0.6, gone: true }],
  [60, 'Atak Kır', 'enemy', 5, 'bolt', [purge(['atkUp', 'strUp']), stp('weakP', 2, 0.2)]],
  // hasar (tek başına oynayan Zayıflatıcı için; yalnız yaratıklara, sıra sonda: eski kimlikler kaymasın)
  [2, 'Dark Strike', 'enemy', 2, 'bolt', [d(1.4, BOLT)], { pve: true }],
  [17, 'Shadow Blast', 'enemy', 3, 'bolt', [d(2.0, BOLT)], { pve: true }],
  [37, 'Curse Wave', 'enemies', 4, 'meteor', [d(1.2, BOLT)], { pve: true }],
]);
kt('sifa', 'priest', 'mag', [ // ortak
  [0, 'Minor Heal', 'ally', 2, 'heal', [heal(0, 't', { flat: 60 })]],
  [5, 'Heal', 'ally', 2, 'heal', [heal(0, 't', { flat: 240 })]],
  [10, 'Cure Curse', 'ally', 3, 'heal', [cleanse()]],
  [15, 'Greater Heal', 'ally', 3, 'heal', [heal(0, 't', { flat: 720 })]],
  [20, 'Restore', 'ally', 1, 'heal', [stp('regen', 4, 100)]],
  [25, 'Group Heal', 'allies', 4, 'heal', [heal(0, 't', { flat: 960 })]],
  [30, 'Complete Heal', 'ally', 4, 'heal', [heal(0, 't', { flat: 1920 })]],
  [35, 'Group Complete Heal', 'allies', 5, 'heal', [heal(0, 't', { flat: 1920 })]],
]);
km('priest', null, 'mag', [
  [1, 'Resurrection', 'dead', 8, 'heal', [revive(0.4)]],
]);
km('priest', 'otaci', 'mag', [
  [10, 'Blessing of Light', 'allies', 7, 'buff', [st('atkUp', 3), st('defUp', 3), st('critUp', 3)]],
  [20, 'Divine Guard', 'allies', 8, 'buff', [shield({ m: 3.0 }, 3), st('ward', 2)]],
]);
km('priest', 'bozan', 'mag', [
  [10, 'Curse of Ruin', 'enemies', 7, 'meteor', [st('atkDown', 2, 0.9), st('defDown', 2, 0.9)]],
  [20, 'Dark Pact', 'enemy', 7, 'bolt', [strip(3), d(2.5, BOLT)]],
]);

// ---- Büyücü ----
kb('mage', 'mag', [
  [3, 'Staff Attack', 'enemy', 1, 'melee', [d(0.7)]], // asa ile yakın dövüş vuruşu
  [5, 'Sprint', 'self', 4, 'buff', [st('spdUp', 2, 1, 'self')]],
]);
kt('ates', 'mage', 'mag', [ // Alev
  [0, 'Flame Strike', 'enemy', 1, 'bolt', [d(1.0, FIRE)]],
  [5, 'Fire Ball', 'enemy', 2, 'bolt', [d(1.3, FIRE)]],
  [10, 'Burn', 'enemy', 3, 'bolt', [d(0.6, FIRE), st('burn', 3)]],
  [15, 'Fire Spear', 'enemy', 2, 'bolt', [d(1.5, FIRE)]],
  [20, 'Fire Blast', 'enemy', 3, 'bolt', [d(1.8, FIRE)]],
  [25, 'Hell Fire', 'enemies', 4, 'meteor', [d(1.0, FIRE)]],
  [30, 'Pillar of Fire', 'enemy', 4, 'meteor', [d(2.2, FIRE)]],
  [35, 'Fire Thorn', 'enemy', 4, 'bolt', [d(1.6, FIRE), st('burn', 2)]],
  [40, 'Fire Impact', 'enemy', 4, 'meteor', [d(2.5, FIRE)]],
  [45, 'Flame Nova', 'enemies', 5, 'meteor', [d(1.5, FIRE)]],
  [50, 'Fire Staff', 'passive', 0, '', { elPct: 0.15 }],
  [55, 'Fire Wall', 'enemy', 5, 'meteor', [st('burn', 3, 1)]],
  [60, 'Meteor Fall', 'enemies', 5, 'meteor', [d(3.0, FIRE)]],
]);
kt('yildirim', 'mage', 'mag', [ // Yıldırım
  [0, 'Lightning', 'enemy', 1, 'bolt', [d(1.0, BOLT), st('stun', 1, 0.05)]],
  [5, 'Shock', 'enemy', 3, 'bolt', [d(0.8, BOLT), st('stun', 1, 0.4)]],
  [10, 'Charge', 'self', 5, 'buff', [st('atkUp', 3, 1, 'self')]],
  [15, 'Lightning Bolt', 'enemy', 2, 'bolt', [d(1.5, BOLT), st('stun', 1, 0.05)]],
  [20, 'Counter Spell', 'enemy', 3, 'bolt', [d(0.6, BOLT), strip(1), st('stun', 1, 0.05)]],
  [25, 'Static Hemisphere', 'self', 5, 'buff', [shield({ m: 1.5 }, 2, 'self')]],
  [30, 'Paralyze', 'enemy', 5, 'bolt', [st('stun', 1, 0.8)]],
  [35, 'Thunder', 'enemy', 3, 'bolt', [d(2.0, BOLT), st('stun', 1, 0.05)]],
  [40, 'Static Thorn', 'enemy', 4, 'bolt', [d(1.6, BOLT), st('stun', 1, 0.3)]],
  [45, 'Lightning Nova', 'enemies', 5, 'meteor', [d(1.5, BOLT), st('stun', 1, 0.05)]],
  [50, 'Chain Lightning', 'random', 4, 'bolt', [d(0.9, { hits: 4, el: 'bolt' }), st('stun', 1, 0.05)]],
  [55, 'Thunder Blast', 'enemy', 4, 'meteor', [d(2.5, BOLT), st('stun', 1, 0.05)]],
  [60, 'Thunder Impact', 'enemy', 6, 'bolt', [d(3.0, BOLT), st('stun', 1, 0.4)]],
]);
kt('buz', 'mage', 'mag', [ // ortak
  [0, 'Freeze', 'enemy', 1, 'bolt', [d(1.0, ICE)]],
  [5, 'Chill', 'enemy', 2, 'bolt', [d(0.9, ICE), st('spdDown', 2, 0.6)]],
  [10, 'Solid', 'self', 5, 'buff', [st('defUp', 3, 1, 'self')]],
  [15, 'Ice Arrow', 'enemy', 2, 'bolt', [d(1.5, ICE)]],
  [20, 'Glacier Beam', 'enemy', 3, 'bolt', [d(1.2, ICE), st('freeze', 1, 0.4)]],
  [25, 'Frostbite', 'enemy', 3, 'bolt', [d(1.3, ICE), st('spdDown', 2, 0.8)]],
  [30, 'Ice Comet', 'enemy', 4, 'meteor', [d(2.0, ICE)]],
  [35, 'Glacier Nova', 'enemies', 5, 'meteor', [d(1.1, ICE), st('freeze', 1, 0.35)]],
]);
km('mage', null, 'mag', [
  [1, 'Staff Mastery', 'passive', 0, '', { magPct: 0.15 }],
]);
km('mage', 'alaz', 'mag', [
  [10, 'Inferno', 'enemies', 7, 'meteor', [d(2.2, FIRE), st('burn', 2)]],
  [20, 'Dragon Tooth', 'enemy', 7, 'meteor', [d(3.8, { el: 'fire', crit: 0.3 })]],
]);
km('mage', 'boran', 'mag', [
  [10, 'Blizzard', 'enemies', 7, 'meteor', [d(1.8, BOLT), st('spdDown', 2, 0.7), st('stun', 1, 0.05)]],
  [20, 'Arc Lightning', 'enemies', 8, 'bolt', [d(2.2, BOLT), st('stun', 1, 0.5)]],
]);

// ================= YARATIKLAR =================
add('x_hit', { name: 'Saldırı', type: 'basic', target: 'enemy', anim: 'melee', sc: 'atk', fx: [d(1.0)] });
add('x_bolt', { name: 'Kara Kıvılcım', type: 'basic', target: 'enemy', anim: 'bolt', sc: 'mag', fx: [d(1.0, { el: 'bolt' })] });
add('x_stab', { name: 'Pusu', type: 'active', target: 'enemy', cd: 3, anim: 'melee', sc: 'atk', fx: [d(1.5, { crit: 0.2 })] });
add('x_hex', { name: 'Bataklık Bedduası', type: 'active', target: 'enemy', cd: 4, anim: 'bolt', sc: 'mag', fx: [d(0.9), st('poison', 2, 0.8)] });
add('x_mend', { name: 'Çamur Merhemi', type: 'active', target: 'ally', cd: 4, anim: 'heal', sc: 'mag', fx: [heal(1.8)] });
add('x_smash', { name: 'Ezici Darbe', type: 'active', target: 'enemy', cd: 3, anim: 'melee', sc: 'atk', fx: [d(1.7)] });
add('x_quake', { name: 'Yer Sarsıntısı', type: 'active', target: 'enemies', cd: 4, anim: 'stomp', sc: 'atk', fx: [d(0.75), st('stun', 1, 0.15)] });
add('x_guard', { name: 'Kemik Siperi', type: 'active', target: 'self', cd: 4, anim: 'buff', sc: 'atk', fx: [st('defUp', 2, 1, 'self')] });
add('x_howl', { name: 'Akın Çığlığı', type: 'active', target: 'allies', cd: 5, anim: 'buff', sc: 'atk', fx: [st('atkUp', 2)] });
add('x_cleave', { name: 'Geniş Savuruş', type: 'active', target: 'enemies', cd: 4, anim: 'whirl', sc: 'atk', fx: [d(0.6)] });
add('x_curse', { name: 'Mezar Soğuğu', type: 'active', target: 'enemies', cd: 5, anim: 'meteor', sc: 'mag', fx: [d(0.6, { el: 'ice' }), st('spdDown', 2, 0.6)] });
add('x_mire', { name: 'Sazlık Fırtınası', type: 'active', target: 'enemies', cd: 4, anim: 'stomp', sc: 'atk', fx: [d(0.95), st('spdDown', 2, 0.5)] });
add('x_crush', { name: 'Bey Yumruğu', type: 'active', target: 'enemy', cd: 3, anim: 'melee', sc: 'atk', fx: [d(2.1), st('defDown', 2, 0.6)] });

add('x_shot', { name: 'Ok', type: 'basic', target: 'enemy', anim: 'arrow', sc: 'atk', fx: [d(1.0)] });
add('x_volley', { name: 'Ok Sağanağı', type: 'active', target: 'enemies', cd: 4, anim: 'arrowBig', sc: 'atk', fx: [d(0.65)] });
add('x_aim', { name: 'Nişanlı Atış', type: 'active', target: 'enemy', cd: 3, anim: 'arrowBig', sc: 'atk', fx: [d(1.7, { crit: 0.25 })] });
add('x_fire', { name: 'Kor Topu', type: 'active', target: 'enemy', cd: 3, anim: 'bolt', sc: 'mag', fx: [d(1.3, { el: 'fire' }), st('burn', 2, 0.7)] });
add('x_lavanova', { name: 'Lav Dalgası', type: 'active', target: 'enemies', cd: 3, anim: 'meteor', sc: 'mag', fx: [d(1.25, { el: 'fire' }), st('burn', 2, 0.8)] }); // Kristal Nöbeti: Lav Yürek'in alan ateşi (ateş direnci azaltır)
add('x_firestorm', { name: 'Kül Fırtınası', type: 'active', target: 'enemies', cd: 5, anim: 'meteor', sc: 'mag', fx: [d(0.75, { el: 'fire' }), st('burn', 2, 0.5)] });
add('x_frost', { name: 'Ayaz Oku', type: 'active', target: 'enemy', cd: 3, anim: 'bolt', sc: 'mag', fx: [d(1.2, { el: 'ice' }), st('spdDown', 2)] });
add('x_freeze', { name: 'Buz Kesen', type: 'active', target: 'enemy', cd: 4, anim: 'bolt', sc: 'mag', fx: [d(1.0, { el: 'ice' }), st('freeze', 1, 0.35)] });
add('x_blizzard', { name: 'Yayla Tipisi', type: 'active', target: 'enemies', cd: 5, anim: 'meteor', sc: 'mag', fx: [d(0.7, { el: 'ice' }), st('spdDown', 2, 0.6)] });
add('x_rage', { name: 'Kan Öfkesi', type: 'active', target: 'self', cd: 5, anim: 'buff', sc: 'atk', fx: [st('atkUp', 3, 1, 'self'), st('critUp', 3, 1, 'self')] });
add('x_drain', { name: 'Can Sömüren', type: 'active', target: 'enemy', cd: 3, anim: 'melee', sc: 'atk', fx: [d(1.4, { steal: 0.5 })] });
add('x_ward', { name: 'Tuğ Gölgesi', type: 'active', target: 'allies', cd: 5, anim: 'buff', sc: 'mag', fx: [shield({ m: 0.9 }, 2)] });
add('x_bigheal', { name: 'Ata Rünü', type: 'active', target: 'allies', cd: 5, anim: 'heal', sc: 'mag', fx: [heal(0.9)] });
add('x_mark', { name: 'Kem Göz', type: 'active', target: 'enemy', cd: 4, anim: 'bolt', sc: 'mag', fx: [d(0.6), st('mark', 2), st('defDown', 2, 0.7)] });
add('x_execute', { name: 'Kelle Alan', type: 'active', target: 'enemy', cd: 4, anim: 'melee', sc: 'atk', fx: [d(2.0, { exec: { below: 0.4, bonus: 0.5 } })] });
add('x_roar', { name: 'Yıldıran Nara', type: 'active', target: 'enemies', cd: 5, anim: 'stomp', sc: 'atk', fx: [d(0.5), st('atkDown', 2, 0.7)] });

// 20 Kas (kullanıcı, oyun testi: hamlelerin %50–80'i temel saldırıydı): uzun bekleyen saldırı yetenekleri bir tur kısaldı.
// Ağaçta 5 → 4, Thunder Impact 6 → 5; usta yetenekleri 7–8 → 6. Mana bedeli eski beklemeden türeyen değerde sabitlendi (S.mp).
const CD_CUT = { hucum10: 4, hucum13: 4, hucum14: 4, hancer13: 4, yay10: 4, yay13: 4, ates10: 4, ates13: 4, yildirim10: 4, yildirim13: 5, buz8: 4,
  yaran_um3: 6, agu_um3: 6, bozan_um2: 6, alaz_um1: 6, alaz_um2: 6, boran_um1: 6, boran_um2: 6 };
for (const [id, cd] of Object.entries(CD_CUT)) {
  const S = SKILLS[id]; if (!S) continue;
  if (S.mp === undefined) S.mp = Math.round((6 + 3 * (S.cd || 0)) * (S.target === 'enemies' || S.target === 'allies' || S.target === 'random' ? 1.3 : 1));
  S.cd = cd;
}

// ---- Yardımcılar ----
// Ustalık sistemi kaldırıldı: sınıfın usta yeteneği (master) ve yolların usta yeteneği (pm) hiçbir listede yer almaz
export const classSkills = cls => Object.values(SKILLS).filter(s => s.cls === cls && !s.master && !s.pm);
// Bir yolun yetenekleri: aktifler ve pasifler açılış seviyesine göre, usta yeteneği en sonda
// Uzmanlığın ağacı (paths.js PATHS[yol].tree) puan sırasıyla; usta yetenekleri ayrı (pm)
export const pathSkills = key => treeSkills(PATHS[key]?.tree);
export const treeSkills = key => Object.values(SKILLS).filter(s => s.tree === key).sort((a, b) => a.req - b.req);
export const BASIC = { warrior: 'w_basic', rogue: 'r_basic', priest: 'p_basic', mage: 'm_basic' };
// 20 Kas: temel saldırının görünen adı kuşanılan silahın sınıfına göre (oyun testi: yay tutan Okçu "Hançer Darbesi" görüyordu).
// Yalnız görünüş; kural ve kimlik aynı. wt: birimin silah sınıfı (hero.js; sword/axe/spear/mace/dagger/bow/staff)
const BASIC_BY_WT = { sword: 'Kılıç Darbesi', axe: 'Balta Darbesi', spear: 'Mızrak Darbesi', mace: 'Topuz Darbesi', dagger: 'Hançer Darbesi', bow: 'Ok Atışı', none: 'Yumruk' };
export const skillName = (id, wt) => (SKILLS[id]?.type === 'basic' && id !== 'm_basic' && BASIC_BY_WT[wt]) || SKILLS[id]?.name || id;
// Sınıfın seviyeyle açılan altı temel aktifi (savaş çubuğu kilitli yuvaları bunlardan gösterir), açılış seviyesine göre
export const baseActives = cls => Object.values(SKILLS).filter(s => s.cls === cls && s.type === 'active' && s.lvl && !s.hidden && !s.master).sort((a, b) => a.lvl - b.lvl);
// Mana bedelinin taban değeri (seviye 1): temel saldırı bedelsiz; verilmemişse bekleme süresinden ve hedef sayısından türer.
// Gerçek bedel seviyeyle ölçeklenir (mana.js mpCost); birime savaş kurulurken yazılır (hero.js heroUnit: mpc).
export const mpBase = S => (S.type !== 'active' ? 0 : S.mp ?? Math.round((6 + 3 * (S.cd || 0)) * (S.target === 'enemies' || S.target === 'allies' || S.target === 'random' ? 1.3 : 1)));

const pc = v => `%${Math.round(v * 100)}`;
const EL_NAME = { fire: 'ateş', ice: 'buz', bolt: 'yıldırım' }; // elementli hasar, hedefin o elemente direncinden etkilenir
const TO = { t: '', self: ' (kendine)', allies: ' (partiye)', foes: ' (düşmanlara)' };
const TARGET = { enemy: 'Tek düşman', enemies: 'Tüm düşmanlar', ally: 'Tek müttefik', allies: 'Tüm parti', self: 'Kendisi', dead: 'Ölü müttefik', random: 'Rastgele düşmanlar' };
const MOD = {
  hpPct: v => `Can ${v > 0 ? '+' : '−'}${pc(Math.abs(v))}`, atkPct: v => `Saldırı ${v > 0 ? '+' : '−'}${pc(Math.abs(v))}`, magPct: v => `Büyü gücü +${pc(v)}`,
  defPct: v => `Savunma ${v > 0 ? '+' : '−'}${pc(Math.abs(v))}`, spd: v => `Hız +${v}`, crit: v => `Kritik şansı +${pc(v)}`, critDmg: v => `Kritik hasarı +${pc(v)}`,
  dr: v => `Alınan hasar −${pc(v)}`, healPct: v => `Verilen şifa +${pc(v)}`, steal: v => `Her vuruşta ${pc(v)} can çalma`, burnPct: v => `Yanık hasarı +${pc(v)}`,
  debuffAcc: v => `Zayıflatma şansı +${pc(v)}`, ccAcc: v => `Dondurma/sersemletme şansı +${pc(v)}`,
  // uzmanlık yolları
  pen: v => `Savunma delme +${pc(v)}`, cutIgnore: v => `Hedefin silah savunması ve element direnci ${pc(v)} az işler`, dotPct: v => `Zehir ve kanama hasarı +${pc(v)}`,
  shieldPct: v => `Verilen kalkan +${pc(v)}`, wcRes: v => `Bütün silah türlerine karşı savunma +${pc(v)}`, elRes: v => `Bütün element dirençleri +${pc(v)}`,
  elPct: v => `Element hasarı +${pc(v)}`, tmKill: v => `Düşman öldürünce sıra çubuğu +${pc(v)}`, ccRes: v => `Sersemleme ve donmaya ${pc(v)} direnç`,
};
const stNames = list => list.map(s => STATUS[s].name).join(' / ');
// Yeteneğin kuralını Türkçe cümleye çevirir (arayüz ve içerik listesi bunu kullanır)
export function describe(s) {
  if (s.type === 'passive') return Object.entries(s.mods).map(([k, v]) => MOD[k](v)).join(', ') + (s.grp ? ' (üst üste binmez: aynı türden yalnız en güçlüsü işler)' : '') + '.';
  const power = s.sc === 'mag' ? 'büyü gücü' : 'saldırı';
  const parts = s.fx.map(f => {
    if (f.k === 'dmg') {
      let t = `${f.hits ? f.hits + ' kez ' : ''}${power} × ${f.m} ${f.el ? EL_NAME[f.el] + ' ' : ''}hasar${f.el ? 'ı' : ''}`;
      if (f.crit) t += `, +${pc(f.crit)} kritik şansı`;
      if (f.pierce) t += `, savunmanın ${pc(f.pierce)}'ini yok sayar`;
      if (f.steal) t += `, hasarın ${pc(f.steal)}'i kadar can çalar`;
      if (f.exec) t += `, canı ${pc(f.exec.below)} altındaki hedefe +${pc(f.exec.bonus)} hasar`;
      if (f.wt) t += `, ${WEAPON_CLASS[f.wt.k]} sınıfı silahla +${pc(f.wt.bonus)} hasar`;
      if (f.vs) t += `, ${stNames(f.vs.s)} etkisindeki hedefe +${pc(f.vs.bonus)} hasar`;
      return t;
    }
    if (f.k === 'purge') return `${f.s.map(x => STATUS[x].name).join(' / ')} etkilerini siler (geri gelmez)`;
    if (f.k === 'mpBurn') return `hedefin ${f.n} manasını siler`;
    if (f.k === 'st') {
      const P = f.p === undefined ? '' : f.s === 'strUp' ? ` +${f.p} STR` : f.s === 'hpUp' ? ` (azami can +${f.p >= 1 ? f.p : pc(f.p)})` : f.s === 'hpDown' ? ` (azami can −${pc(f.p)}; bitince kaybedilen can geri gelmez)`
        : f.s === 'armorUp' ? ` +${f.p} savunma (yalnız fiziksel hasara; birikmez; Kırık Zırh gelince silinir)` : f.s === 'defUp' ? ` +${pc(f.p)} (yalnız fiziksel hasara)` : f.s === 'resUp' ? ` (ateş/yıldırım hasarı −${pc(f.p)}, yıldırım kilidi −%25)` : f.s === 'weakP' ? ` (fiziksel saldırı −${pc(f.p)})` : f.s === 'regen' ? ` (her tur +${f.p} can)` : '';
      return `${f.c < 1 ? pc(f.c) + ' şansla ' : ''}${f.pvpc !== undefined ? `(PvP'de ${pc(f.pvpc)}) ` : ''}${f.t} tur ${STATUS[f.s].name}${P}${TO[f.to]}`;
    }
    if (f.k === 'heal') return `${[f.m ? `büyü gücü × ${f.m}` : '', f.pct ? `azami canın ${pc(f.pct)}'i` : '', f.flat ? `${f.flat} can` : ''].filter(Boolean).join(' + ')} kadar şifa${TO[f.to]}`;
    if (f.k === 'shield') return `${f.t} tur ${f.m ? `büyü gücü × ${f.m}` : `azami canının ${pc(f.pctSelf)}'i`} kadar kalkan${TO[f.to]}`;
    if (f.k === 'tm') return `sıra çubuğu ${f.v > 0 ? '+' : '−'}${pc(Math.abs(f.v))}${TO[f.to]}`;
    if (f.k === 'cleanse') return `zararlı etkileri temizler${TO[f.to]}`;
    if (f.k === 'revive') return `${pc(f.pct)} canla diriltir`;
    if (f.k === 'guard') return `${f.t} tur ${STATUS.guard.name}: hedefin aldığı hasarın ${pc(f.share)} kadarını üstlenir${TO[f.to]}`;
    if (f.k === 'det') return `hedefteki ${stNames(f.s)} hasarının kalanını × ${f.m} olarak hemen verir ve etkiyi siler`;
    if (f.k === 'strip') return `hedefin ${f.n} güçlendirmesini söker${TO[f.to]}`;
    return '';
  });
  const txt = parts.join('; ');
  return `${s.share ? `Düşmanların ${pc(s.share)}’ı (rastgele)` : s.pick ? `Rastgele ${s.pick} düşman` : TARGET[s.target]}${s.pve ? ' (yalnız yaratıklar)' : ''}: ${txt}.${s.cd ? ` Bekleme ${s.cd} tur.` : ''}`;
}
