// Kahraman kuralları: nitelik/yetenek puanları, açık yetenekler, türetilmiş statlar, savaş birimi.
// Sürüm 12: karakterin tek kahramanı vardır, kimliği roster.js MAIN ('h0'). 'id' parametreleri bu kimliği alır; parti ve
// kopya adları (partyUnits, srcId…) tek kahramana indirgenmiş olarak durur. Tek kahraman dengesi savaş kurulurken solo.js'te.
import { masteryMods, masterySpent, MASTERY } from './mastery.js';
import { CLASSES, CLASS_KEYS, TREES, STAT_POINTS_PER_LEVEL, SKILL_POINTS_FROM_LEVEL, SKILL_POINTS_PER_LEVEL, HALL } from './content.js';
import { SKILLS, BASIC, classSkills, mpBase } from './skills.js';
import { maxMpOf, mpRegenOf, mpCost } from './mana.js';
import { weaponFx, itemStats, itemBase, rqOf, meetsRq, itemScore, WEAPONS, CLASS_WC, RES_KEYS, resKey, COEF, SLOT_KEYS, ELEMENTS, gradeOf, setMods } from './items.js';
import { achBonus } from './meta.js';
import { capeOf } from './clan.js';
import { clsOf, heroIds, partyIds, srcId } from './roster.js';
import { PATH, pathOf, specTrees, specPoints } from './paths.js';

export const LOADOUT_ACTIVES = 5; // 19 Kas (kullanıcı): savaş çubuğunda 6 yetenek = temel saldırı + 5 aktif (+ iki iksir yuvası)
export const statPointsTotal = lvl => (lvl - 1) * STAT_POINTS_PER_LEVEL;
export const skillPointsTotal = lvl => Math.max(0, lvl - SKILL_POINTS_FROM_LEVEL + 1) * SKILL_POINTS_PER_LEVEL;
export const sum = o => Object.values(o).reduce((a, b) => a + b, 0);
export const statPointsFree = (p, id) => statPointsTotal(p.lvl) - sum(p.heroes[id].pts);
export const skillPointsFree = (p, id) => skillPointsTotal(p.lvl) - sum(p.heroes[id].tree);

// Açık yetenekler: temel saldırı + seviyeyle gelen başlangıç yetenekleri (1–10. seviye) + açık ağaçlardaki puanla açılanlar
// (sınıfın ortak ağacı ve seçilen uzmanlığın ağacı; paths.js specTrees) + uzmanlığın kendi ağacındaki puanla gelen yol
// yetenekleri (PATH.actives/passives puan eşikleri) + 60. seviyeden sonra ustalık ağacına verilen puanla usta yetenekleri
// (skills.js MREQ). Öbür uzmanlığın yetenekleri ve ağacı hiçbir koşulda açık sayılmaz.
export function unlockedSkills(p, id) {
  const h = p.heroes[id], cls = clsOf(p, id), path = p.lvl >= PATH.level ? pathOf(h) : null, trees = specTrees(cls, path);
  const sp = specPoints(h), mst = p.lvl >= MASTERY.unlock ? masterySpent(h) : -1;
  return Object.values(SKILLS).filter(s => {
    if (s.cls !== cls) return false;
    if (s.pm) return s.path === path && mst >= (s.mreq || 0);
    if (s.master) return mst >= (s.mreq || 0);
    if (s.path) return s.path === path && sp >= s.plv;
    return s.type === 'basic' || (s.lvl && p.lvl >= s.lvl) || (s.tree && p.lvl >= PATH.level && trees.includes(s.tree) && (h.tree[s.tree] || 0) >= s.req);
  }).map(s => s.id);
}
// Yeni açılan yetenekleri boş loadout yuvalarına kendiliğinden yerleştirir; artık açık olmayanları çıkarır
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
export function bestLoadout(p, id) {
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
  return { act: act.map(s => s.id), pas: open.find(s => s.type === 'passive' && !s.path)?.id || null,
    ppas: (K ? K.pas.map(k => mine.find(s => s.id === `${path}_${k}`)).find(Boolean)?.id : null) || null };
}
// Önerilen düzen (yapay oyuncularla aynı kural, bestLoadout). Oyuncu düzeni elle değiştirmedikçe (h.mact) her yeni yetenek
// açılışında düzen önerilene göre yenilenir; elle değiştirdiyse yalnız boş yuvalar açılış sırasıyla dolar (20 Kas, oyun testi:
// hiç dokunulmayan eski düzen Sv65'te uzmanlıkların çoğunda kazanmayı %0–50'ye düşürüyordu).
export function fixLoadout(p, id) {
  const h = p.heroes[id];
  if (!h.mact && !p.bot) { h.act = bestLoadout(p, id).act.slice(0, LOADOUT_ACTIVES); h.pas = null; h.ppas = null; return; }
  const open = unlockedSkills(p, id);
  h.act = h.act.filter(id => open.includes(id) && SKILLS[id].type === 'active').slice(0, LOADOUT_ACTIVES); // eski 6 yuvalı düzenler 5'e kırpılır
  h.pas = null; h.ppas = null; // pasifler düzene alınmaz: açık pasiflerin hepsi her zaman etkindir (passiveMods)
  const ord = id => SKILLS[id].lvl ?? 100 + (SKILLS[id].req || SKILLS[id].plv || 0); // boş yuvalar açılış sırasıyla dolar (temel aktifler önce)
  for (const id of [...open].sort((a, b) => ord(a) - ord(b))) {
    const S = SKILLS[id];
    if (S.type === 'active' && h.act.length < LOADOUT_ACTIVES && !h.act.includes(id)) h.act.push(id);
  }
}
// Açık pasiflerin birleşik etkisi: ağaç ve usta ağacındaki açık pasiflerin hepsi her zaman etkindir. Sayısal etkiler toplanır.
export function passiveMods(p, id) {
  // grp: aynı gruptaki pasifler üst üste binmez, her değer için yalnız en yükseği sayılır (Hinder/Arrest/Bulwark, 19 Kas)
  const out = {}, best = {};
  for (const id2 of unlockedSkills(p, id)) {
    const S = id2 && SKILLS[id2]?.type === 'passive' ? SKILLS[id2] : null, m = S?.mods; if (!m) continue;
    if (S.grp) { const b = best[S.grp] || (best[S.grp] = {}); for (const k in m) b[k] = Math.max(b[k] || 0, m[k]); }
    else for (const k in m) out[k] = (out[k] || 0) + m[k];
  }
  for (const g in best) for (const k in best[g]) out[k] = (out[k] || 0) + best[g][k];
  return out;
}

export const itemOf = (p, id) => p.items.find(it => it.id === id) || null;
export const equippedIds = p => { const s = new Set(); for (const h of Object.values(p.heroes)) for (const id of Object.values(h.eq)) s.add(id); return s; };
// Eşyayı kuşanan kahramanın kimliği (kuşanılmamışsa null)
export const ownerOf = (p, itemId) => heroIds(p).find(h => Object.values(p.heroes[h].eq).includes(itemId)) || null;
// Nitelikler (STR/HP/DEX/INT = str/vit/dex/int): taban (content.js bs) + dağıtılan puan + eşyadan gelen. Şartlı eşyaların kendi
// nitelik katkısı şartı hesaplarken sayılmaz (kendi kendini açamaz).
const NIT = ['str', 'vit', 'dex', 'int', 'mp'];
export function statTotals(p, hid) {
  hid = srcId(p, hid);
  const h = p.heroes[hid], bs = CLASSES[clsOf(p, hid)].bs || {}, out = {};
  for (const k of NIT) out[k] = (bs[k] || 0) + (h.pts?.[k] || 0);
  for (const id of Object.values(h.eq)) { const it = itemOf(p, id); if (!it || rqOf(it)) continue; const s = itemStats(it); for (const k of NIT) if (s[k]) out[k] += s[k]; }
  return out;
}
// Kuşanılmış ama şartı karşılanmayan eşya hiçbir şey vermez (eski kayıtta başlangıç Raptor'u gibi)
// T: önceden hesaplanmış toplam nitelikler (döngüde her eşya için yeniden hesaplanmasın)
export const gearActive = (p, hid, it, T) => !rqOf(it) || meetsRq(it, T || statTotals(p, hid));
export const gearItems = (p, hid) => { const L = Object.values(p.heroes[srcId(p, hid)].eq).map(id => itemOf(p, id)).filter(Boolean), T = L.some(rqOf) ? statTotals(p, hid) : null; return L.filter(it => gearActive(p, hid, it, T)); };
export const OFF_ATK = 0.5; // Savaşçı sol el silahının saldırı payı
export function gearStats(p, hid) {
  const out = { atk: 0, mag: 0, def: 0, hp: 0, spd: 0, crit: 0, pen: 0 };
  let T = null;
  const war = clsOf(p, hid) === 'warrior';
  for (const [slot, id] of Object.entries(p.heroes[srcId(p, hid)].eq)) {
    const it = itemOf(p, id);
    if (!it) continue;
    if (rqOf(it) && !meetsRq(it, T ||= statTotals(p, hid))) continue;
    const s = itemStats(it);
    // Savaşçının sol el silahı (kullanıcı 19 Kas): bütün statları eklenir, yalnız saldırısı OFF_ATK payıyla
    if (war && slot === 'wl' && s.atk && itemBase(it.b)?.kind === 'weapon') s.atk = Math.round(s.atk * OFF_ATK);
    for (const k in s) out[k] = (out[k] || 0) + s[k];
  }
  return out;
}
// Sağ eldeki silahın sınıfı (kılıç, balta, hançer, ok, topuz, asa): rakibin hangi savunma katsayısının devreye gireceğini belirler
export function weaponClass(p, id) {
  id = srcId(p, id);
  const w = itemOf(p, p.heroes[id].eq.wr);
  return (w && WEAPONS[itemBase(w.b).type]?.wc) || CLASS_WC[clsOf(p, id)];
}
// Silah efekti (VAHRAN, items.js WEAPON_FX): sağ eldeki silahın efekti; birim bunu `wfx` olarak taşır (battle.js, motor v5)
export function wfxOf(p, id) { id = srcId(p, id); const w = itemOf(p, p.heroes[id].eq.wr); return w && gearActive(p, id, w) ? weaponFx(w) : null; }
const r4 = v => Math.round(v * 10000) / 10000;
// Kuşanılan eşyalardan gelen savunma katsayıları ve dirençler ({ sword, axe, …, fire, ice, bolt } → oran; her biri sınırlı)
// add: pasiflerden gelen ek (wc: bütün silah türlerine, el: bütün elementlere); sınır eşyayla birlikte uygulanır
export function gearRes(g, add) {
  const out = {};
  for (const k of RES_KEYS) { const v = (g[resKey(k)] || 0) + (add ? (Object.hasOwn(ELEMENTS, k) ? add.el : add.wc) || 0 : 0); if (v > 0) out[k] = r4(Math.min(COEF.resCap, v)); }
  return out;
}

// Yan statlar ve set bonusları pasif etkileriyle aynı yoldan işler (m)
const GEAR_MOD = { pwrPct: ['atkPct', 'magPct'], atkPct: ['atkPct'], magPct: ['magPct'], hpPct: ['hpPct'], defPct: ['defPct'], critDmg: ['critDmg'], acc: ['debuffAcc'], ccRes: ['ccRes'], steal: ['steal'], dr: ['dr'], healPct: ['healPct'], critBurn: ['critBurn'] };
function gearMods(m, g, sm) {
  for (const src of [g, sm]) for (const k in src) if (GEAR_MOD[k]) for (const to of GEAR_MOD[k]) m[to] = r4((m[to] || 0) + src[k]);
  if (sm.spd) m.spd = (m.spd || 0) + sm.spd;
  return m;
}
export const elxTo = h => (h?.path === 'boran' ? 'bolt' : 'fire');
export function heroStats(p, id) {
  id = srcId(p, id); // kopya kahraman: kaynağının birebir aynısı
  const C = CLASSES[clsOf(p, id)], h = p.heroes[id], L = p.lvl - 1, g = gearStats(p, id);
  const m = gearMods({ ...passiveMods(p, id) }, g, setMods(gearItems(p, id))), hall = p.hall || {}, ab = achBonus(p).pct, hb = k => (1 + (hall[k] || 0) * HALL.pct) * (1 + ab[k]); // Şan Divanı ve başarım (sınırlı) kalıcı bonusları
  const mx = masteryMods(h); // Ustalık (mastery.js)
  const P = {}; for (const k of NIT) P[k] = (h.pts[k] || 0) + (g[k] || 0); // INT yalnız manaya (heroUnit maxMp), MP (Büyü Gücü) yalnız Büyücünün büyüsüne // puan + eşya nitelikleri (taban bs 1. seviye değerlerinde)
  const hp = (C.base.hp + C.grow.hp * L + P.vit * 15 + g.hp) // 1 HP niteliği = 15 can; 1 STR/DEX (kendi sınıfına) = 3 saldırı (content.js k; 19 Kas) * (1 + (m.hpPct || 0)) * hb('hp') * mx.hp;
  const dexK = C.k.dex > 0 ? 1 : 0; // Çeviklik yalnız Suikastçıya yarar (kullanıcı kararı 19 Kas): öbür sınıflarda hız/kritik de vermez
  const atk = (C.base.atk + C.grow.atk * L + P.str * C.k.str + P.dex * C.k.dex + g.atk) * (1 + (m.atkPct || 0)) * hb('atk') * mx.atk;
  const mag = (C.base.mag + C.grow.mag * L + P.mp * (C.k.mp || 0) + P.int * (C.k.int || 0) + g.mag) * (1 + (m.magPct || 0)) * hb('atk') * mx.mag;
  const def = (C.base.def + C.grow.def * L + P.vit * 0.3 + g.def) * (1 + (m.defPct || 0)) * hb('def') * mx.def;
  return {
    maxHp: Math.round(hp), atk: Math.round(atk), mag: Math.round(mag), def: Math.round(def),
    // Asanın element hasarı (elx) uzmanlığa göre çevrilir: Yıldırım (boran) → bolt, Alev ya da uzmanlıksız → fire
    fire: Math.round((g.fire || 0) + (elxTo(h) === 'fire' ? g.elx || 0 : 0)), bolt: Math.round((g.bolt || 0) + (elxTo(h) === 'bolt' ? g.elx || 0 : 0)), lock: g.lock || 0, // Alev / Yıldırım Hasarı (eşyadan; büyücü uzmanlık yeteneklerinde işler)
    spd: Math.round(C.base.spd + dexK * P.dex * 0.1 + g.spd + (m.spd || 0) + mx.spd),
    crit: C.base.crit + dexK * P.dex * 0.0005 + g.crit + (m.crit || 0) + mx.crit, critDmg: 1.5 + (m.critDmg || 0),
    mods: { dr: Math.min(0.5, m.dr || 0), healPct: m.healPct || 0, steal: m.steal || 0, burnPct: (m.burnPct || 0) + (g.burnPct || 0), debuffAcc: m.debuffAcc || 0, ccAcc: m.ccAcc || 0, ...pathMods(m) },
    wt: weaponClass(p, id), pen: r4(Math.min(COEF.penCap, (g.pen || 0) + (m.pen || 0))), res: gearRes(g, m.wcRes || m.elRes ? { wc: m.wcRes, el: m.elRes } : null),
    ...(m.ccRes ? { ccRes: m.ccRes } : {}),
    ...(wfxOf(p, id) || g.pdmg ? { wfx: wfxOf(p, id) || 'poison' } : {}),
    ...(g.mpRec ? { mpRec: r4(Math.min(0.1, g.mpRec)) } : {}), // MP Recovery: vurulan hasarın bu payı kadar mana döner (items.js MP_REC; en çok %10)
    ...(g.pdmg ? { pdmg: g.pdmg } : {}), // sabit element hasarı (items.js SPECIAL ed; her isabette, türü wfx, hedefin o direnci azaltır)
  };
}
// Yol pasiflerinin motorun okuduğu etkileri (battle.js: mods). Yalnızca sıfırdan farklı olanlar yazılır: yolu olmayan
// kahramanın birimi eskisiyle aynı kalır.
const PATH_MODS = ['dotPct', 'shieldPct', 'cutIgnore', 'elPct', 'tmKill', 'critBurn'];
function pathMods(m) { const out = {}; for (const k of PATH_MODS) if (m[k]) out[k] = m[k]; return out; }
// PvP tek kahramanla dövüşülür: eski (dört kişilik) kayıtlarda ve yapay rakipte en güçlü birim seçilir
export const soloUnits = units => (!Array.isArray(units) || units.length <= 1 ? units : [units.reduce((a, u) => (power(u) > power(a) ? u : a))]);
export const power = u => Math.round(u.maxHp * 0.1 + (u.atk + u.mag) * 2 + u.def * 1.5 + u.spd);

// Görünüm için: sağ eldeki silahın 3D türü, artısı ve nadirliği (g: 0 Standart, 1 Nadir, 2 Eşsiz; artılı silahın parıltı rengi)
export function weaponModel(p, id) {
  id = srcId(p, id);
  const eq = p.heroes[id].eq, w = itemOf(p, eq.wr), l = itemOf(p, eq.wl), cls = clsOf(p, id);
  const W = w && itemBase(w.b);
  // ap / ag: zırh parıltısı (5 zırh parçasının artı ortalaması, boş yuva 0; en yüksek nadirlik). Yalnızca görünüm.
  const arm = ['helm', 'chest', 'legs', 'gloves', 'boots'].map(k => itemOf(p, eq[k])).filter(Boolean);
  const S = l && itemBase(l.b), glb = W?.glb, sglb = S?.type === 'shield' ? S.glb : null;
  return { ...(glb ? { glb } : {}), ...(sglb ? { sglb } : {}), ...(S && S.kind === 'weapon' && S.hands === 1 ? { off: WEAPONS[S.type]?.model || S.type } : {}), fx: weaponFx(w), weapon: W?.model || { warrior: 'none', rogue: 'dagger', priest: 'mace', mage: 'staff' }[cls], plus: w?.p || 0, g: w ? gradeOf(w.b, w.g) : 0, shield: !!(l && itemBase(l.b).type === 'shield'), ap: Math.floor(arm.reduce((a, x) => a + (x.p || 0), 0) / 5), ag: arm.reduce((a, x) => Math.max(a, gradeOf(x.b, x.g)), 0) };
}

// key: kahramanın kimliği · cls: sınıfı · v: görünüm tonu (yalnızca toplanan kahramanlarda; 0 ise alan yazılmaz)
export function heroUnit(p, id) {
  const h = p.heroes[id], sh = p.heroes[srcId(p, id)], s = heroStats(p, id), cls = clsOf(p, id);
  const skills = [BASIC[cls], ...sh.act.filter(x => SKILLS[x]).slice(0, LOADOUT_ACTIVES)], gs = gearStats(p, id), maxMp = maxMpOf(cls, p.lvl, (sh.pts?.int || 0) + (gs.int || 0)) + (gs.mana || 0); // mana: eşyanın azami mana bonusu
  // Mana (mana.js): maxMp havuz, mpr tur başı yenilenme, mpc yeteneklerin bu seviyedeki bedeli. Motor bu alanları taşıyan birimde
  // manayı uygular (alanı olmayan eski kayıt ve yaratık bedelsiz oynar).
  const mpc = {}; for (const k of skills) { const c = mpCost(mpBase(SKILLS[k]), p.lvl); if (c) mpc[k] = c; }
  return { key: id, cls, name: h.name || CLASSES[cls].name, lvl: p.lvl, weak: null, ccRes: 0, ...s, skills, maxMp, mpr: mpRegenOf(cls, maxMp), mpc, faction: p.faction, wm: weaponModel(p, id), ...(h.v ? { v: h.v } : {}), ...(p.clan && capeOf(p.clanTag) ? { cape: capeOf(p.clanTag) } : {}) }; // cape: klan pelerini (yalnızca görünüm)
}
// slot: parti düzeni (roster.js PARTY_SLOTS); verilmezse Sefer düzeni. Dizinin sırası savaştaki diziliştir.
export const partyUnits = (p, slot) => partyIds(p, slot).map(id => heroUnit(p, id));
export const partyPower = (p, slot) => partyUnits(p, slot).reduce((a, u) => a + power(u), 0);

// ---- Eşya Seviyesi ----
// Kahraman: 13 yuvadaki eşya puanlarının (items.js: itemScore) ortalaması; boş yuva 0 sayılır, çift el silah iki yuvayı
// doldurduğu için iki kez sayılır. Parti: düzendeki (verilmezse Sefer düzeni) dört kahramanın ortalaması. Eşya ya da düzen
// değiştikçe iner ya da çıkar.
function gearScore(p, hid) {
  let sum = 0;
  for (const id of Object.values(p.heroes[srcId(p, hid)].eq)) { const it = itemOf(p, id); if (it) sum += itemScore(it) * (itemBase(it.b).hands === 2 ? 2 : 1); }
  return sum;
}
export const heroItemLevel = (p, id) => Math.round(gearScore(p, id) / SLOT_KEYS.length);
export const itemLevel = (p, slot) => { const ids = partyIds(p, slot); return Math.round(ids.reduce((a, id) => a + gearScore(p, id), 0) / (SLOT_KEYS.length * ids.length)); };
export const treeOf = cls => CLASSES[cls].trees.map(k => ({ key: k, ...TREES[k] }));
