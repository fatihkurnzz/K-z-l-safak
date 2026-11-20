// Oyunun yetkili kuralları. Oyuncu kaydı (p) üzerinde bir işlemi uygular; depolama ve ağ bilmez.
// Sunucu her isteği bu modülden geçirir; çevrimdışı deneme sürümü aynı modülü tarayıcıda çalıştırır.
// env: { now: ms, rand: () => [0,1) güvenli üreteç, dev: test komutları açık mı }
// Başka oyuncularla paylaşılan işlemler (pazar, meydan listesi, klan, sefer) world.js'tedir.
import { CLASSES, CLASS_KEYS, TREES, STAT_KEYS, TREE_MAX, BAG_LIMIT, RESET_COST, UNLOCK, dayKey, BOSS_PITY, TURN_CAP } from './content.js';
import { SKILLS } from './skills.js';
import { starterBases, itemBase, equipSlots, rqOf, meetsRq, RQ_LABEL, MAX_PLUS, maxPlusOf, SAFE_PLUS, UP_CHANCE, UP_STONES, STONES, GRADES, G_UNIQUE, stoneGrade, upOdds, upFee, dustYield, sellPrice, gradeOf, allBases } from './items.js';
import { stageDef, MOBS } from './zones.js';
import { statPointsFree, skillPointsFree, unlockedSkills, fixLoadout, itemOf, equippedIds, LOADOUT_ACTIVES, statTotals } from './hero.js';
import { replay, autoPlay } from './battle.js';
import { recorder } from './report.js';
import { dropRows, itemSources, wheelUniqueRate } from './drops.js';
import { SETTINGS_HANDLERS } from './settings.js';
import { GameError, fail, int, addItem, removeItems, busy, bump } from './util.js';
import { newPlayer, validName, regen, tick, STATE_VERSION } from './state.js';
import { MODES, startBattle, setupOf, stageOpen, parTurns, bagFull, needBagRoom } from './modes.js';
import { validTier, starsOf, CLIMB } from './pvp.js';
import { DAILY_HANDLERS } from './daily.js';
import { AD_HANDLERS } from './reklam.js';
import { DESTAN_HANDLERS } from './destan.js';
import { PROMO_HANDLERS } from './promo.js';
import { NPC_HANDLERS } from './npc.js';
import { FISH_HANDLERS } from './balik.js';
import { cheat, tooFast, verified, staleBattle } from './guard.js';
import { META_HANDLERS } from './metaops.js';
import { hasHero, clsOf, mainId } from './roster.js';
import { fogNow } from './realm.js';
import { PVP_HANDLERS } from './pvpops.js';
import { PATH, PATHS, validPath, pathOf, pathFee, specTrees } from './paths.js';
import { SINK_HANDLERS } from './sinks.js';
import { KB_HANDLERS } from './karaborsa.js';
import { POT, potsOf } from './mana.js';
import { TUT_STEPS } from './meta.js';

// İksir taşıyan savaşlar (mana.js): oyuncunun yaratıklara karşı savaşları. Meydan, Canlı Meydan, Sancak Savaşı ve Kuşatma
// iksirsizdir; seri savaşlar (battle.sweep, depth.sweep) da iksir harcamaz.
const POT_MODES = new Set(['stage', 'well', 'depth', 'rift', 'seal', 'worm', 'akin', 'clanboss', 'baskin', 'kule', 'yemin', 'destan']);
function armPots(p, b) {
  const u = b.party.find(x => !x.ai);
  if (!u || !POT_MODES.has(b.mode)) return;
  const have = potsOf(p);
  u.pot = { hp: Math.min(POT.cap, have.hp), mp: Math.min(POT.cap, have.mp) };
}
// Savaş sonu: içilen iksirler sayaçtan düşer; öğretici yetenek ve iksir kullanımını işaretler (meta.js TUT_NEED.bar)
function settlePots(p, sum, actions) {
  const used = sum.pots;
  if (used && (used.hp || used.mp)) { const h = potsOf(p); p.pots = { hp: Math.max(0, h.hp - used.hp), mp: Math.max(0, h.mp - used.mp) }; }
  if (p.tut && !p.tut.end && TUT_STEPS[p.tut.s] === 'bar' && Array.isArray(actions)) { // yalnız çubuk adımında: önceki oto savaş saymaz
    if (actions.some(a => Array.isArray(a) && typeof a[0] === 'string' && SKILLS[a[0]]?.type === 'active')) p.tut.f.sk = 1;
    if (used && (used.hp || used.mp)) p.tut.f.pot = 1;
  }
}

export { GameError, newPlayer, validName, regen, tick, STATE_VERSION, dayKey, TURN_CAP, stageOpen, parTurns };
export { bossAvailable } from './calc.js';

// Tek karakter (sürüm 12): kahraman kimliği verilmezse karakterin tek kahramanı (roster.js MAIN). Verilirse metin olmalı ve
// kayıtta kendi anahtarı olarak bulunmalı ('__proto__' ya da ['h0'] kahraman sayılmaz).
const hid = (p, a) => a.hero ?? mainId(p);
function hero(p, id) { if (hasHero(p, id) && p.heroes[id].copy) fail('copy', 'Kopya kahraman kaynağının aynısıdır; ona ayrıca puan ya da eşya verilmez.'); return hasHero(p, id) ? p.heroes[id] : fail('bad-class', 'Böyle bir kahraman yok.'); }
const ALL_BASES = new Set([...allBases(), ...starterBases()]); // istemciden gelen taban kimliği yalnızca bu kümeden kabul edilir
function freeIds(p, ids) {
  if (!Array.isArray(ids) || !ids.length || ids.length > BAG_LIMIT || new Set(ids).size !== ids.length) fail('bad-items');
  const eq = equippedIds(p);
  return ids.map(id => { const it = itemOf(p, id); if (!it) fail('no-item'); if (eq.has(id)) fail('item-equipped', 'Kuşanılmış eşya önce çıkarılmalı.'); return it; });
}

const HANDLERS = {
  ping() {},
  // ---- Nitelik ve yetenek ----
  'stat.add'(p, a) {
    const { stat, n = 1 } = a, cls = hid(p, a), h = hero(p, cls); busy(p);
    if (!STAT_KEYS.includes(stat) || !int(n, 1, 999) || n > statPointsFree(p, cls)) fail('bad-points', 'Yeterli nitelik puanı yok.');
    h.pts[stat] = (h.pts[stat] || 0) + n;
  },
  'stat.reset'(p, a) {
    const h = hero(p, hid(p, a)); busy(p);
    const fr = p.freeReset || (p.freeReset = { stat: 0, skill: 0 }), free = fr.stat > 0, cost = free ? 0 : RESET_COST(p.lvl);
    if (p.akce < cost) fail('no-akce', 'Yeterli akçe yok.');
    if (free) fr.stat--; else p.akce -= cost;
    h.pts = { str: 0, vit: 0, dex: 0, int: 0, mp: 0 };
    return { cost };
  },
  'skill.add'(p, a) {
    const { tree, n = 1 } = a, cls = hid(p, a), h = hero(p, cls); busy(p);
    if (typeof tree !== 'string' || !Object.hasOwn(TREES, tree) || TREES[tree].cls !== clsOf(p, cls)) fail('bad-tree');
    if (!specTrees(clsOf(p, cls), p.lvl >= PATH.level ? pathOf(h) : null).includes(tree)) fail('locked', p.lvl < PATH.level ? `Yetenek ağaçları ${PATH.level}. seviyede, uzmanlık seçilince açılır.` : !pathOf(h) ? 'Önce uzmanlığını seç: bu ağaç bir uzmanlığa ait.' : 'Bu ağaç seçtiğin uzmanlığa ait değil.');
    if (!int(n, 1, TREE_MAX) || n > skillPointsFree(p, cls) || (h.tree[tree] || 0) + n > TREE_MAX) fail('bad-points', 'Yeterli yetenek puanı yok.');
    h.tree[tree] = (h.tree[tree] || 0) + n;
    fixLoadout(p, cls);
  },
  'skill.reset'(p, a) {
    const cls = hid(p, a), h = hero(p, cls); busy(p);
    const fr = p.freeReset || (p.freeReset = { stat: 0, skill: 0 }), free = fr.skill > 0, cost = free ? 0 : RESET_COST(p.lvl);
    if (p.akce < cost) fail('no-akce', 'Yeterli akçe yok.');
    if (free) fr.skill--; else p.akce -= cost;
    h.tree = {}; fixLoadout(p, cls);
    return { cost, free };
  },
  // ppas: yol pasifi (ayrı yuva; verilmezse yerinde kalır). Yalnızca açık yetenekler kabul edilir: öbür yolun, seviyesi
  // gelmemiş ya da Usta Sınavı bitmeden usta yeteneği reddedilir. Ağaç pasifi yuvasına yol pasifi (ya da tersi) konamaz.
  'loadout.set'(p, a) {
    const { act, pas = null, ppas } = a, cls = hid(p, a), h = hero(p, cls); busy(p);
    const open = unlockedSkills(p, cls);
    if (!Array.isArray(act) || act.length > LOADOUT_ACTIVES || new Set(act).size !== act.length) fail('bad-loadout');
    for (const id of act) if (typeof id !== 'string' || !open.includes(id) || SKILLS[id].type !== 'active') fail('bad-loadout');
    if (pas !== null && (typeof pas !== 'string' || !open.includes(pas) || SKILLS[pas].type !== 'passive' || SKILLS[pas].path)) fail('bad-loadout');
    if (ppas !== undefined && ppas !== null && (typeof ppas !== 'string' || !open.includes(ppas) || SKILLS[ppas].type !== 'passive' || !SKILLS[ppas].path)) fail('bad-loadout');
    h.act = [...act]; h.pas = pas;
    if (ppas !== undefined) h.ppas = ppas;
    h.mact = true; // elle düzen: yeni yetenekler artık yalnız boş yuvaya girer (hero.js fixLoadout)
  },
  // Önerilen düzen: elle bayrağı kalkar, düzen önerilene göre kurulur ve yeni açılışlarda kendiliğinden yenilenir
  'loadout.auto'(p, a) {
    const cls = hid(p, a), h = hero(p, cls); busy(p);
    h.mact = false; fixLoadout(p, cls);
    return { act: h.act };
  },
  // Uzmanlık yolu (paths.js): kahraman başına seçilir. İlk seçim ve ilk değişiklik bedelsizdir; sonrakiler akçe öder
  // (pathFee; istemcinin gönderdiği bedel alanı okunmaz). Yol değişince öbür yolun yetenekleri düzenden düşer.
  'path.choose'(p, a) {
    const id = hid(p, a), h = hero(p, id); busy(p);
    if (p.lvl < PATH.level) fail('locked', `Uzmanlık yolu ${PATH.level}. seviyede seçilir.`);
    if (!validPath(clsOf(p, id), a.path)) fail('bad-path', 'Bu sınıfın böyle bir yolu yok.');
    const from = pathOf(h);
    if (from === a.path) fail('same-path', 'Kahraman zaten bu yolda.');
    const fee = from ? pathFee(p.lvl, h) : 0; // yolu olmayan kahramanın seçimi her zaman bedelsizdir
    if (p.akce < fee) fail('no-akce', 'Yeterli akçe yok.');
    p.akce -= fee;
    if (from && PATHS[from].tree) delete h.tree[PATHS[from].tree]; // öbür uzmanlığın ağacına verilen puanlar geri döner
    h.path = a.path; h.pn = (Number.isInteger(h.pn) && h.pn > 0 ? h.pn : 0) + 1; h.ppas = null;
    fixLoadout(p, id);
    return { hero: id, path: a.path, from, fee, name: PATHS[a.path].name };
  },

  // ---- Ekipman ----
  'item.equip'(p, a) {
    const { id, slot } = a, cls = hid(p, a), h = hero(p, cls); busy(p);
    const it = itemOf(p, id) || fail('no-item');
    const slots = equipSlots(it, clsOf(p, cls), p.lvl);
    if (!slots.length) fail('cant-equip', 'Bu kahraman bu eşyayı kuşanamaz.');
    if (slot !== undefined && !slots.includes(slot)) fail('bad-slot');
    if (!meetsRq(it, statTotals(p, cls))) { const r = rqOf(it); fail('cant-equip', `Gerekli: ${Object.entries(r).map(([k, v]) => `${RQ_LABEL[k]} ${v}`).join(', ')}.`); }
    for (const o of Object.values(p.heroes)) for (const s in o.eq) if (o.eq[s] === id) delete o.eq[s]; // başka bir kahramanın üzerindeyse ondan çıkar
    const B = itemBase(it.b), cur = itemOf(p, h.eq.wr), twoR = cur && itemBase(cur.b)?.hands === 2;
    // Tek el silah iki ele de takılır (19 Kas): sağda çift el silah varken yuva verilmezse sağa geçer (sola takıp sağı boşaltmaz)
    const to = slot || (twoR && slots.includes('wr') ? 'wr' : slots.find(s => !h.eq[s]) || slots[0]);
    if (B.hands === 2) delete h.eq.wl;
    if (to === 'wl') { const r = itemOf(p, h.eq.wr); if (r && itemBase(r.b).hands === 2) delete h.eq.wr; }
    h.eq[to] = id;
    return { slot: to };
  },
  'item.unequip'(p, a) {
    const { slot } = a, h = hero(p, hid(p, a)); busy(p);
    if (!Object.hasOwn(h.eq, slot)) fail('bad-slot');
    delete h.eq[slot];
  },
  'item.sell'(p, { ids }) {
    const items = freeIds(p, ids);
    const akce = items.reduce((a, it) => a + sellPrice(it), 0);
    removeItems(p, ids); p.akce += akce; bump(p, 'break', ids.length);
    return { akce };
  },
  // Parçalama: fazla eşyayı ekonomiden çeken kapı. Eşya → örs tozu → bileği taşı.
  'item.dismantle'(p, { ids }) {
    const items = freeIds(p, ids);
    const toz = items.reduce((a, it) => a + dustYield(it), 0);
    removeItems(p, ids); p.toz += toz; bump(p, 'break', ids.length);
    return { toz };
  },

  // ---- Örs ----
  'anvil.craft'(p, { g, n = 1 }) {
    if (!int(g, 0, STONES.length - 1) || !int(n, 1, 99)) fail('bad-craft'); // g dizi indisidir: 'length' ya da '__proto__' kabul edilmez
    const S = STONES[g];
    if (p.toz < S.dust * n) fail('no-toz', 'Yeterli örs tozu yok.');
    if (p.akce < S.akce * n) fail('no-akce', 'Yeterli akçe yok.');
    p.toz -= S.dust * n; p.akce -= S.akce * n; p.stones[g] += n;
    return { g, n };
  },
  // Eşya asla yok olmaz. +5'e kadar başarısızlık zararsızdır; +6 ve üstünde başarısız deneme bir artı düşürür (+5'in altına
  // inmez), +8 ve üstünde kırılma eşyayı +5'e döndürür. Olasılıklar items.js: upOdds (arayüz aynı tabloyu gösterir).
  // charm: Uğur Muskası (o denemede seviye kaybını ve kırılmayı önler) · ember: Tav Közü (o denemede başarı şansı ×1,2).
  // Sonuç (out): 'ok' başarı · 'fail' zararsız başarısızlık · 'drop' bir artı kaybı · 'break' kırılma · 'safe' muska korudu.
  'anvil.upgrade'(p, { id, charm = false, ember = false }, env) {
    busy(p);
    if (p.lvl < UNLOCK.anvil) fail('locked', `Örs ${UNLOCK.anvil}. seviyede açılır.`);
    if (typeof charm !== 'boolean' || typeof ember !== 'boolean') fail('bad-request', 'Geçersiz istek.');
    const it = itemOf(p, id) || fail('no-item');
    if (it.p >= maxPlusOf(it)) fail('max-plus', 'Bu eşya en yüksek seviyede.');
    const g = stoneGrade(it), need = UP_STONES[it.p], fee = upFee(it, p); // taraf bonusu dahil
    if (p.stones[g] < need) fail('no-stone', `${need} adet ${STONES[g].name} gerekli.`);
    if (p.akce < fee) fail('no-akce', 'Yeterli akçe yok.');
    if (charm && p.charms < 1) fail('no-charm', 'Uğur Muskası yok.');
    if (charm && it.p <= SAFE_PLUS) fail('charm-useless', `Uğur Muskası +${SAFE_PLUS + 1} ve üstündeki eşyada işe yarar; bu denemede kaybedecek bir şey yok.`);
    if (ember && !(p.embers >= 1)) fail('no-ember', 'Tav Közü yok.');
    if (ember && UP_CHANCE[it.p] >= 1) fail('ember-useless', 'Bu denemede başarı zaten kesin.');
    const fog = fogNow(env.now); // sisli hava: başarı şansı biraz artar (realm.js; sunucu saatinden okunur)
    const odds = upOdds(it, { charm, ember, fog }), from = it.p;
    p.stones[g] -= need; p.akce -= fee; if (charm) p.charms--; if (ember) p.embers--;
    const r = env.rand(); // tek zar: [0, ok) başarı · [ok, ok+brk) kırılma · kalanı seviye kaybı (ya da zararsız başarısızlık)
    let out;
    if (r < odds.ok) { it.p++; out = 'ok'; p.stats.upOk++; }
    else {
      p.stats.upFail++;
      if (r < odds.ok + odds.brk) { it.p = SAFE_PLUS; out = 'break'; }
      else if (odds.drop > 0) { it.p = Math.max(SAFE_PLUS, it.p - 1); out = 'drop'; }
      else out = odds.safe ? 'safe' : 'fail';
    }
    bump(p, 'up');
    return { ok: out === 'ok', out, from, plus: it.p, chance: odds.ok, odds, fee, stones: need, ...(fog ? { fog: true } : {}) };
  },

  // ---- Savaş (bütün modlar) ----
  'battle.start'(p, args, env) { const b = startBattle(p, args, env); armPots(p, b); if (env.rules) b.rules = env.rules; return { battle: b }; }, // b.rules: savaşın başladığı motor sürümü
  'battle.finish'(p, { id, actions }, env) {
    const b = p.battle;
    if (!b || b.id !== id) {
      // Sonucu işlenmiş son savaşın yinelenen bildirimi (kopan bağlantıda yeniden deneme, çift gönderim, eski sekme): ödül
      // ikinci kez verilmez, kayıt yazılmaz, işaret üretilmez; istemci ilk sonucu gösterebilsin diye ret onu taşır (done)
      const f = p.fin, e = new GameError('no-battle', f && f.id === id ? 'Bu savaşın sonucu zaten işlendi.' : 'Geçerli bir savaş yok.');
      if (f && f.id === id) e.info = { done: f.r };
      throw e;
    }
    p.battle = null;
    const rec = recorder(); // savaş raporu: sunucunun kendi tekrarındaki olaylardan tutulur (report.js)
    const r = replay(setupOf(b), actions, rec.feed);
    // Tekrardan geçmeyen liste değiştirilmiş istemci demektir: ödülsüz reddedilir ve işaretlenir (guard.js)
    if (!r.ok && env.rules && b.rules && b.rules !== env.rules) staleBattle(b, r.reason); // güncellemeden önce başlamış savaş: puansız ret (guard.js)
    if (!r.ok) { p.stats.rejected++; cheat('replay', `${b.mode} · ${r.reason}`, 'battle-rejected', `Savaş doğrulanamadı (${r.reason}). Oyun güncellenmiş olabilir: sayfayı yenileyip tekrar dene.`, { battle: b.id }); }
    if (env.guard) { // gerçek bir istemcinin oynatabileceğinden hızlı biten savaş da reddedilir (seri savaş bu yoldan geçmez)
      const fast = tooFast(b, r.summary.turns, env.now);
      if (fast) { p.stats.rejected++; cheat('speed', fast, 'battle-too-fast', 'Savaş doğrulanamadı (süre).', { battle: b.id }); }
      verified(p, env);
    }
    settlePots(p, r.summary, actions);
    const out = { mode: b.mode, title: b.title, ...MODES[b.mode].settle(p, b, r.summary, env), ...(r.summary.pots ? { pots: r.summary.pots } : {}) };
    p.fin = { id: b.id, at: env.now, r: out }; // son savaşın sonucu (raporsuz): yinelenen bildirime aynı yanıt verilir
    return { ...out, report: rec.done() };
  },
  'battle.abandon'(p) { p.battle = null; },
  // Seri savaş: 3 yıldızla geçilmiş stage'i sunucu n kez kendi oynatır (yapay zekâ), ödüller toplanır
  'battle.sweep'(p, { stage, tier = 0, n = 1 }, env) {
    busy(p);
    if (p.lvl < UNLOCK.sweep) fail('locked', `Seri savaş ${UNLOCK.sweep}. seviyede açılır.`);
    if (!validTier(tier)) fail('bad-tier');
    const def = typeof stage === 'string' ? stageDef(stage, tier) : null;
    if (!def || def.kind === 'boss' || starsOf(p, tier)[def.id] !== 3) fail('not-3star', 'Seri savaş için stage 3 yıldızla geçilmiş olmalı.');
    if (!int(n, 1, 10)) fail('bad-count');
    const total = { runs: 0, wins: 0, xp: 0, akce: 0, levels: 0, loot: [] };
    for (let i = 0; i < n; i++) {
      if (p.energy < def.energy) { if (!i) fail('no-energy', 'Yeterli enerji yok.'); break; }
      if (bagFull(p)) { if (!i) needBagRoom(p); total.bagFull = true; break; } // çanta seri sırasında dolduysa kalan savaşlar yapılmaz
      const b = startBattle(p, { mode: 'stage', stage, tier }, env);
      p.battle = null;
      const out = MODES.stage.settle(p, b, autoPlay(setupOf(b)).summary, env);
      total.runs++; total.wins += out.win ? 1 : 0; total.xp += out.xp; total.akce += out.akce; total.levels += out.levels;
      for (const l of out.loot) { const s = l.t !== 'item' && total.loot.find(x => x.t === l.t && x.g === l.g && x.k === l.k && x.boss === l.boss); if (s) s.n += l.n; else total.loot.push({ ...l }); }
    }
    return total;
  },
  // Yeraltı Ocağı'nda seri iniş: önceki dönemde inilen katlara kadar, sunucu katları sırayla kendi oynatır (yapay zekâ).
  // Her kat olağan bedelini (enerji) alır ve olağan ödülünü verir; yenilgide, enerji ya da çanta bitince durur.
  'depth.sweep'(p, { n = 1 }, env) {
    busy(p);
    if (p.lvl < UNLOCK.depth) fail('locked', `${UNLOCK.depth}. seviyede açılır.`);
    if (!int(n, 1, CLIMB.sweepMax)) fail('bad-count');
    if (p.depth >= (p.depthPrev || 0)) fail('no-sweep', 'Seri iniş yalnızca önceki dönemde indiğin katlara kadar yapılır.');
    const total = { runs: 0, wins: 0, xp: 0, akce: 0, levels: 0, loot: [], from: p.depth };
    for (let i = 0; i < n && p.depth < p.depthPrev; i++) {
      if (p.energy < CLIMB.energy) { if (!i) fail('no-energy', 'Yeterli enerji yok.'); break; }
      if (bagFull(p)) { if (!i) needBagRoom(p); total.bagFull = true; break; }
      const b = startBattle(p, { mode: 'depth' }, env);
      p.battle = null;
      const out = MODES.depth.settle(p, b, autoPlay(setupOf(b)).summary, env);
      total.runs++; total.wins += out.win ? 1 : 0; total.xp += out.xp; total.akce += out.akce; total.levels += out.levels;
      for (const l of out.loot) { const s = l.t !== 'item' && total.loot.find(x => x.t === l.t && x.g === l.g && x.k === l.k && x.boss === l.boss); if (s) s.n += l.n; else total.loot.push({ ...l }); }
      if (!out.win) break;
    }
    total.floor = p.depth;
    return total;
  },

  // ---- Boss izi takası ----
  'boss.exchange'(p, { boss, b }) {
    const M = Object.hasOwn(MOBS, boss) ? MOBS[boss] : null;
    if (!M?.boss || !M.uniques.includes(b)) fail('bad-exchange');
    if ((p.marks[boss] || 0) < BOSS_PITY) fail('no-marks', `${BOSS_PITY} iz gerekli.`);
    if (p.items.length >= BAG_LIMIT) fail('bag-full', 'Çanta dolu.');
    p.marks[boss] -= BOSS_PITY;
    return { item: addItem(p, b, G_UNIQUE) };
  },

  // ---- Ansiklopedi: hiçbir şey kilitli değildir; drop tablosu istemciye sunulmadığı için oranlar buradan okunur ----
  // Yaratık: bütün ganimet satırları ve oranları (kesim sayısı ve kaç kez düştüğü oyuncunun kendi sayacıdır)
  'codex.get'(p, { mob }) {
    const M = typeof mob === 'string' && Object.hasOwn(MOBS, mob) ? MOBS[mob] : null, c = p.codex[mob] || { k: 0, d: {} };
    if (!M) fail('bad-mob', 'Böyle bir yaratık yok.');
    const rank = M.boss ? 'b' : M.captain ? 'c' : 'n';
    const rows = dropRows(mob, rank).map(([key, rate]) => ({ key, got: c.d[key] || 0, rate }));
    // sıradan yaratığın stage'lerde "Azılı" hâli de çıkar: onun oranları ayrı listelenir (sayaçlar ortaktır)
    const elite = rank === 'n' ? dropRows(mob, 'e').map(([key, rate]) => ({ key, rate })) : [];
    return { mob, kills: c.k, rows, elite };
  },
  // Eşya: nereden, hangi oranla düştüğü (drops.js: itemSources). b tabanı ve g nadirliği tabloya uymalıdır.
  'codex.item'(p, { b, g }) {
    if (typeof b !== 'string' || !ALL_BASES.has(b) || !int(g, 0, GRADES.length - 1) || gradeOf(b, g) !== g) fail('bad-item', 'Böyle bir eşya yok.');
    const rows = [...itemSources(b, g)];
    if (g === G_UNIQUE) rows.push({ t: 'wheel', rate: wheelUniqueRate(b, p.lvl), lvl: itemBase(b).req - 5 });
    return { b, g, rows };
  },
  ...DAILY_HANDLERS,
  ...AD_HANDLERS, // ödüllü reklam (reklam.js)
  ...DESTAN_HANDLERS, // Destan bulmacaları (destan.js, 20 Kas)
  ...PROMO_HANDLERS, // promosyon kodu (promo.js)
  ...NPC_HANDLERS, // Yemin Pazarı tüccarı (npc.js)
  ...FISH_HANDLERS, // Yemin Pazarı göleti: balık tutma (balik.js)
  ...META_HANDLERS,
  ...PVP_HANDLERS, // sezon unvanı, Yeraltı Ocağı seri inişi, Nöbet (pvpops.js)
  ...SINK_HANDLERS, // Bakım (sinks.js)
  ...KB_HANDLERS, // Karaborsa (karaborsa.js)
  ...SETTINGS_HANDLERS, // hesapta saklanan ayarlar: dil (settings.js)
};

// Tek giriş noktası. Hata durumunda GameError fırlatır; çağıran taraf kaydı YAZMAMALIDIR.
export function apply(p, action, env) {
  const h = action && typeof action.type === 'string' && Object.hasOwn(HANDLERS, action.type) ? HANDLERS[action.type] : null;
  if (!h) fail('bad-action');
  tick(p, env.now);
  return h(p, action, env) || {};
}
export const ACTIONS = Object.keys(HANDLERS);
