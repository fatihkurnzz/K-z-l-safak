// Savaş modları. Her mod iki işlev verir:
//   build(p, args, env)  → giriş koşullarını denetler, bedeli alır, dalgaları kurar
//   settle(p, b, sum, env) → sunucuda doğrulanmış savaş özetine göre ödülü işler
// Savaşın kendisi hep aynı motordur (battle.js); modlar yalnızca kimin kiminle, ne için dövüştüğünü belirler.
import { TUT_STEPS } from './meta.js';
import { blessXp, blessAkcePct } from './nufus.js';
import { addMasteryXp } from './mastery.js';
import { GAME, ENERGY, UNLOCK, ARENA, CLAN, CLASS_KEYS, CLASSES, TURN_CAP, WAR_BONUS, xpNeed, weekDay, hourOf, factionBonus, withPct } from './content.js';
import { stageDef, stageId, mobUnit, mobXp, mobAkce, MOBS, ZONES, zoneForLevel, zoneNormals, allBosses, STAGES_PER_ZONE } from './zones.js';
import { partyUnits, heroUnit, fixLoadout, soloUnits } from './hero.js';
import { ENGINE_V } from './battle.js';
import { hqPct } from './clan.js';
import { pickGear, tierForLevel } from './items.js';
import { rollKill, REWARD_GRADE, SEAL_UNIQUE } from './drops.js';
import { fail, int, grant, bump, used, useDaily, count } from './util.js';
import { zoneBonusFor, zoneMult, stageXpPct, stageAkcePct, terrWin } from './realm.js';
import { p28Bonus, p28AfterBattle, tavernUnits } from './han.js';
// P28: PvE savaş sonucu işlenirken etkin Han/Zafer kazanç çarpanı (yalnız settle sırasında dolu; aşağıdaki sarmalayıcı kurar)
let P28 = null;
import { pickFrom, weighted } from './rng.js';
import { botParty, isBot } from './bots.js';
import { SEASON, ARENA_PTS, sameRace, raceMark, STAGE_TIERS, validTier, starsOf, tierKey, CLIMB, climbLevel, climbScale, climbRewards, modNow, modById, modUnit } from './pvp.js';
import { BAG_LIMIT } from './content.js';
import { perks } from './state.js';
import { stageOpen, parTurns } from './calc.js';
import { countVs, lossPaid } from './guard.js';
import { HUNT_DIFF, clanLevel, huntDiffOf } from './clan.js';
import { mainId, clsOf, heroIds } from './roster.js';
import { soloWaves, soloHero, SOLO } from './solo.js';
import { upkeepDrop } from './sinks.js';
import { RULES } from './rules.js';
import { hisarOpen } from './hisar.js';
import { HISAR } from './content.js';
import { BASKIN, raidOpen } from './baskin.js';
import { NOBET, nobetLocked, minuteOf } from './nobet.js';
import { ANIT, bracketOf, monUnit } from './anit.js';
import { weekKey } from './content.js';
import { KULE, kuleWaves, kuleRewards, isBossFloor } from './kule.js';
import { YEMIN, yeminWaves, yeminDone, yeminRewards, yeminLevel } from './yemin.js';
import { rkOf } from './rankper.js';
import { DESTAN_BY, chapterOpen, chapterDone, destanSetup, finishChapter, destanOf, needsBattle } from './destan.js';

const need = (p, key) => { if (p.lvl < UNLOCK[key]) fail('locked', `${UNLOCK[key]}. seviyede açılır.`); };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const seedOf = env => Math.floor(env.rand() * 4294967296) >>> 0;
const ticketsLeft = (p, now) => ARENA.tickets + (p.daily.arenaBonus || 0) + perks(p, now).tickets - used(p, 'arena');
// Meydan sezonu: aynı hesaba karşı sezon içindeki galibiyet sayısı tutulur (yalnız bilgi; puanı azaltmaz). Yapay rakip
// kimlikleri her listede yenidir, sayılmaz. kind 'rating' ise sezonun galibiyet/yenilgi sayaçları da işlenir.
function seasonScore(p, opp, out, kind) {
  const A = p.arena, real = opp !== null && opp !== undefined && !isBot(opp), vs = A.vs && typeof A.vs === 'object' ? A.vs : (A.vs = {});
  const prev = real && Object.hasOwn(vs, String(opp)) ? vs[String(opp)] : 0;
  // Kullanıcı kuralı: her zafer +3 (ARENA_PTS.win); aynı rakibe tekrar zaferde puan AZALMAZ (eski SEASON.dim kaldırıldı).
  if (out.win && real && (prev || Object.keys(vs).length < SEASON.vsMax)) vs[String(opp)] = prev + 1;
  if (kind === 'rating') { if (out.win) A.sw = (A.sw || 0) + 1; else A.sl = (A.sl || 0) + 1; }
}
// Kan Davası: seni yenen rakipler (en çok 10). Yenersen kaydı "öç alındı" olur. Savunmanı düşürenler rapordan okunur (world.js feud.list).
export const FEUD_MAX = 10;
export function feudNote(p, ref, win, at) {
  if (!ref || ref.id == null) return;
  const id = String(ref.id), L = Array.isArray(p.feud) ? p.feud : (p.feud = []), old = L.find(x => x.id === id);
  if (win) { if (old) old.ok = 1; return; }
  if (old) { old.at = at; old.n = (old.n || 1) + 1; delete old.ok; } else L.unshift({ id, name: String(ref.name || '?').slice(0, 24), faction: ref.faction || null, at, n: 1 });
  L.sort((a, b) => b.at - a.at); L.length = Math.min(L.length, FEUD_MAX);
}

export { stageOpen };
export { parTurns };

// ---------- Çanta sınırı ----------
// Eşya veren bir savaşa çanta doluyken girilemez (bedel alınmadan reddedilir); eşyalı kazanç da toplanamaz. Savaş
// sürerken dolan çantada taşan eşya eskisi gibi örs tozuna döner (util.js: grant). Posta ekleri postada bekler.
export const ITEM_MODES = new Set(['stage', 'depth', 'seal', 'kule']);
export const bagFull = p => p.items.length >= BAG_LIMIT;
export function needBagRoom(p) { if (bagFull(p)) fail('bag-full', `Çanta dolu (${BAG_LIMIT}/${BAG_LIMIT}). Önce eşya sat ya da parçala.`); }

// ---------- Haftalık zindan düzeni (pvp.js: DUNGEON_MODS) ----------
// Dalgalar o haftanın düzeniyle kurulur ve düzenin kimliği savaş kaydına yazılır (hafta savaş sırasında dönse de ödül
// başlanan düzene göre verilir). Karşılık yalnızca zaferde: deneyim ve akçe yüzdesi, ek ganimet.
const withMod = (waves, env) => { const M = modNow(env.now); return { waves: waves.map(w => w.map(u => modUnit(u, M))), mod: M.id }; };
const modXp = (b, win, xp) => { const M = win ? modById(b.opts.mod) : null; return M?.xp ? Math.round(withPct(xp, M.xp)) : xp; };
function modBonus(p, b, out) {
  const M = modById(b.opts.mod);
  if (!M) return;
  out.mod = M.id;
  if (!out.win) return;
  if (M.akce) out.akce = Math.round(withPct(out.akce, M.akce));
  if (M.loot) grant(p, out.loot, M.loot);
}

export function addXp(p, xp, out) {
  if (P28?.xpPct) xp = Math.round(xp * (100 + P28.xpPct) / 100); // P28: Han Baharatlı Dem + Zafer buff'ı (yalnız PvE)
  xp = blessXp(p, xp); // nüfus Bereketi (nufus.js): azınlık ırkın bütün deneyim kazancına, öteki çarpanlardan sonra
  const ml = addMasteryXp(p, xp); if (ml) out.mastery = (out.mastery || 0) + ml; // 60. seviyeden sonra ustalık deneyimi (mastery.js)
  p.xp += xp; out.xp = (out.xp || 0) + xp;
  let n = 0;
  while (p.lvl < GAME.maxLevel && p.xp >= xpNeed(p.lvl)) { p.xp -= xpNeed(p.lvl); p.lvl++; n++; p.energy += ENERGY.levelUpBonus; }
  if (p.lvl >= GAME.maxLevel) p.xp = Math.min(p.xp, xpNeed(p.lvl));
  if (n) for (const id of heroIds(p)) fixLoadout(p, id);
  out.levels = (out.levels || 0) + n;
}
// Kesilen yaratıklar: ansiklopedi sayacı, akçe, (istenirse) deneyim ve drop
function killRewards(p, kills, env, out, { xp = true, drops = true, drop = {} } = {}) {
  const P = perks(p, env.now); // premium: ek deneyim, akçe ve eşya düşme oranı
  const opt = { ...drop, gearMult: (drop.gearMult || 1) * (p.war.buffUntil > env.now ? withPct(1, WAR_BONUS.drop) : 1) * (1 + P.drop) * withPct(1, upkeepDrop(p, env.now)) }; // + sefer galibinin drop bonusu + Bakım (sinks.js)
  let gain = 0, akce = 0;
  if (P.id) out.premium = P.id;
  for (const k of kills) {
    const c = p.codex[k.mob] || (p.codex[k.mob] = { k: 0, d: {} });
    c.k++;
    const xr = k.xr > 0 ? k.xr : 1; // tek kahraman dalgasında budanan yaratıkların payı (solo.js)
    akce += mobAkce(k.lvl, k.rank) * xr;
    if (xp) gain += mobXp(k.lvl, k.rank) * xr;
    if (drops) for (const d of rollKill(env.rand, k.mob, k.rank, k.lvl, xr === 1 ? opt : { ...opt, gearMult: opt.gearMult * xr })) { c.d[d.key] = (c.d[d.key] || 0) + 1; grant(p, out.loot, d); }
  }
  out.akce += Math.round(akce * (1 + P.akce));
  return Math.round(gain * (1 + P.xp));
}
// Kristal Muhafızı güçlendirmesi: saldırı ve savunma +NOBET.buff × kesilen muhafız
const buffed = (p, n) => (n > 0 ? partyUnits(p).map(u => ({ ...u, atk: Math.round(u.atk * (1 + NOBET.buff * n)), mag: Math.round((u.mag || 0) * (1 + NOBET.buff * n)), def: Math.round(u.def * (1 + NOBET.buff * n)) })) : undefined);
const base = (sum, extra) => ({ win: sum.winner === 'A', turns: sum.turns, deaths: sum.deaths, stars: 0, xp: 0, akce: 0, loot: [], levels: 0, ...extra });
// Taraf bonusu: savaştan kazanılan akçe (her modun toplam akçesine, oyuncuya yazılmadan hemen önce uygulanır)
const battleAkce = (p, n) => Math.round(withPct(n, factionBonus(p.faction).battleAkce + blessAkcePct(p))); // + nüfus Bereketi (nufus.js; ırk bonusuyla toplanır)
const finish = (p, out) => { out.akce = battleAkce(p, out.akce); if (P28?.akcePct) out.akce = Math.round(out.akce * (100 + P28.akcePct) / 100); p.akce += out.akce; if (out.win) { p.stats.wins++; bump(p, 'win'); } return out; };

// Seviyeye göre karışık yaratık dalgası (zindanlar)
function wave(rand, lvl, n, elite = 1) {
  const pool = zoneNormals(zoneForLevel(lvl));
  return Array.from({ length: n }, (_, i) => mobUnit(pickFrom(rand, pool), lvl, i < elite ? 'e' : 'n'));
}
const scaled = (u, hp, atk) => ({ ...u, maxHp: Math.round(u.maxHp * hp), atk: Math.round(u.atk * atk), mag: Math.round(u.mag * atk) });
// Sancak Savaşı: verilen sınıflardan birer yapay kahraman (her yapay oyuncu tek karakterdir; tohumlar ardışık değil, zardan)
const botTeam = (env, lvl, q, faction, classes) => classes.map(c => { let s = seedOf(env); s = s - (s % 4) + CLASS_KEYS.indexOf(c); return botParty(s >>> 0, lvl, q, faction).units[0]; });
const bossFor = (rand, lvl) => { const ok = allBosses().filter(b => ZONES[MOBS[b].zone - 1].lv[0] <= lvl && !MOBS[b].event); return pickFrom(rand, ok.length ? ok : [allBosses()[0]]); };

export const MODES = {
  // ---------- Bölge aşaması ----------
  stage: {
    build(p, { stage, tier = 0 }, env) {
      if (!validTier(tier)) fail('bad-tier');
      const def = typeof stage === 'string' ? stageDef(stage, tier) : null;
      if (!def) fail('bad-stage');
      if (!stageOpen(p, def.id, tier)) fail('stage-locked', tier && def.id === '1-1' ? `${STAGE_TIERS[tier].name} kademe, ${STAGE_TIERS[tier - 1].name} kademenin son Boss’u geçilince açılır.` : 'Önce bir önceki aşama geçilmeli.');
      const key = tierKey(def.id, tier), st = starsOf(p, tier);
      // Günlük boss: ilk geçişe kadar serbest denenir; geçildikten sonra günde 1 hak, hak girişte düşer
      if (def.kind === 'boss') {
        if (st[def.id]) { if (p.daily.boss[key]) fail('boss-done', 'Bu Boss için bugünkü hakkın bitti.'); p.daily.boss[key] = true; }
        bump(p, 'boss');
      }
      if (p.energy < def.energy) fail('no-energy', 'Yeterli enerji yok.');
      if (p.energy >= ENERGY.max) p.energyAt = env.now;
      p.energy -= def.energy;
      if (!tier) p.lastStage = def.id;
      return { ref: def.id, waves: def.waves, enrageTurn: def.enrageTurn, title: def.title, env: def.env, opts: tier ? { tier } : {} };
    },
    settle(p, b, sum, env) {
      const tier = b.opts.tier || 0, T = STAGE_TIERS[tier], def = stageDef(b.ref, tier), out = base(sum, { stage: def.id, tier, first: false, bossDamage: sum.bossDamage });
      // Bölge hâkimiyeti (realm.js): bölge oyuncunun ırkındaysa o bölgenin bonusu (akçe ya da eşya düşme oranı) uygulanır; kademeden bağımsızdır
      const zb = zoneBonusFor(p, def.zone, env.now);
      let xp = killRewards(p, sum.kills, env, out, { xp: out.win, drops: out.win, drop: { tier, ...(zb === 'drop' ? { gearMult: zoneMult() } : {}) } });
      if (tier) out.akce = Math.round(out.akce * T.akce); // üst kademede kesim akçesi çarpanı
      if (zb) out.zone = zb;
      if (zb === 'akce') out.akce = Math.round(out.akce * zoneMult());
      xp = Math.round(withPct(xp, stageXpPct(env.now))); // poyrazlı havada bölge deneyimi artar, sisli havada azalır
      if (stageAkcePct(env.now)) out.akce = Math.round(withPct(out.akce, stageAkcePct(env.now))); // yağmurlu havada bölge akçesi azalır
      const st = tier ? ((p.tstages ||= {})[tier] ||= {}) : p.stages;
      if (!out.win) {
        out.akce = Math.round(out.akce * 0.25) + (def.kind === 'boss' ? Math.round(mobAkce(def.lvl, 'b') * sum.bossDamage * 0.5) : 0);
        if (def.kind === 'boss' && !lossPaid(p, tierKey(def.id, tier))) out.akce = 0; // enerjisiz boss denemesi akçe musluğu olmasın: teselli günde sınırlı
        return finish(p, out);
      }
      out.stars = (sum.hpFrac ?? 0) > 0.5 ? 3 : (sum.hpFrac ?? 0) > 0.25 ? 2 : 1; // 1★ geç, 2★ can %25'in üstünde, 3★ can %50'nin üstünde
      out.first = !st[def.id];
      if (out.first) {
        out.akce += 50 * def.lvl * (tier + 1);
        if (def.kind !== 'mob') {
          grant(p, out.loot, { t: 'yakut', n: tier ? T.first[def.kind] : def.kind === 'boss' ? 20 : 5 });
          if (!tier) grant(p, out.loot, { t: 'stone', g: def.kind === 'boss' ? 1 : 0, n: 1 }); // kapı kaptanı ve boss'un ilk geçişi: bileği taşı (eskiden kadro jetonu Yoldaş Beratı)
        }
      }
      st[def.id] = Math.max(st[def.id] || 0, out.stars);
      p.pend.war += def.kind === 'boss' ? 5 : 1;
      count(p, 'terr', terrWin(p, def, env.now)); // bölge puanı: ırkın haftalık belgesine dispatch yazar (realmops.js)
      addXp(p, xp, out);
      return finish(p, out);
    },
  },

  // ---------- Dipsiz Kuyu: 10 dalga dayan; her dalga taş verir (günde 2) ----------
  well: {
    build(p, _, env) {
      need(p, 'well'); useDaily(p, 'well', RULES.well.daily);
      const W = withMod(Array.from({ length: RULES.well.waves }, (_, i) => wave(env.rand, clamp(p.lvl - 3 + i, 1, GAME.maxLevel), 4, i >= 5 ? 2 : 1)), env);
      return { ref: 'well', waves: W.waves, title: 'Dipsiz Kuyu', env: 'graveyard', opts: { mod: W.mod } };
    },
    settle(p, b, sum, env) {
      const out = base(sum, { cleared: sum.winner === 'A' ? RULES.well.waves : sum.wave });
      addXp(p, modXp(b, out.cleared > 0, killRewards(p, sum.kills, env, out, { drops: false })), out);
      for (let i = 0; i < out.cleared; i++) grant(p, out.loot, { t: 'stone', g: i < 4 ? 0 : i < 8 ? 1 : 2, n: RULES.well.stonePerWave });
      p.wellBest = Math.max(p.wellBest, out.cleared);
      out.win = out.cleared > 0; out.stars = out.cleared >= 10 ? 3 : out.cleared >= 6 ? 2 : out.cleared ? 1 : 0;
      modBonus(p, b, out);
      return finish(p, out);
    },
  },


  // ---------- Yeraltı Ocağı: kat kat inilir, her 5 katta bir kapı boss'u ----------
  depth: {
    build(p, _, env) {
      need(p, 'depth');
      const f = p.depth + 1;
      if (f > CLIMB.floors) fail('depth-done', 'Bu dönemin en derin katına ulaştın. Ocak sezon başında sıfırlanır.');
      if (p.energy < CLIMB.energy) fail('no-energy', 'Yeterli enerji yok.');
      if (p.energy >= ENERGY.max) p.energyAt = env.now;
      p.energy -= CLIMB.energy;
      const lvl = climbLevel(f), bossFloor = f % CLIMB.bossEvery === 0, deep = climbScale(f); // kor katları (50 üstü): kat kat sertleşir
      const raw = bossFloor
        ? [wave(env.rand, lvl, 3, 1), [mobUnit(pickFrom(env.rand, zoneNormals(zoneForLevel(lvl))), lvl), scaled(mobUnit(bossFor(env.rand, lvl), lvl), 0.6, 0.9), mobUnit(pickFrom(env.rand, zoneNormals(zoneForLevel(lvl))), lvl)]]
        : [wave(env.rand, lvl, 4, 1), wave(env.rand, lvl, 4, 2)];
      const W = withMod(deep ? raw.map(w => w.map(u => scaled(u, deep.hp, deep.atk))) : raw, env);
      return { ref: String(f), waves: W.waves, enrageTurn: bossFloor ? 110 : 0, title: `Yeraltı Ocağı · ${f}. kat`, env: 'castle', opts: { mod: W.mod } };
    },
    settle(p, b, sum, env) {
      const f = +b.ref, out = base(sum, { floor: f });
      const xp = killRewards(p, sum.kills, env, out, { xp: out.win, drops: false });
      if (out.win) {
        p.depth = f; p.depthBest = Math.max(p.depthBest || 0, f); out.stars = sum.deaths ? 2 : 3;
        // kat ödülü dönem başına bir kez alınır (kat yalnızca bir kez geçilir): pvp.js climbRewards
        for (const d of climbRewards(f)) grant(p, out.loot, d.t === 'gear' ? { t: 'item', b: pickGear(env.rand, tierForLevel(p.lvl)), g: REWARD_GRADE, key: 'gear' } : d);
        addXp(p, modXp(b, true, xp), out);
      } else out.akce = Math.round(out.akce * 0.25);
      modBonus(p, b, out);
      return finish(p, out);
    },
  },

  // ---------- Kül Kulesi (kule.js): 65 sonrası sonsuz kat; her 10 katta Tarikat'ın bir adsızı. Katlar kalıcı ----------
  kule: {
    build(p, _, env) {
      if (p.lvl < KULE.unlock) fail('locked', `${KULE.unlock}. seviyede açılır.`);
      const f = (p.kule || 0) + 1;
      if (p.energy < KULE.energy) fail('no-energy', 'Yeterli enerji yok.');
      if (p.energy >= ENERGY.max) p.energyAt = env.now;
      p.energy -= KULE.energy;
      return { ref: String(f), waves: kuleWaves(env.rand, f), enrageTurn: isBossFloor(f) ? 120 : 0, title: `Kül Kulesi · ${f}. kat`, env: 'graveyard' };
    },
    settle(p, b, sum, env) {
      const f = +b.ref, out = base(sum, { floor: f });
      const xp = killRewards(p, sum.kills, env, out, { xp: out.win, drops: out.win });
      if (out.win && f === (p.kule || 0) + 1) {
        p.kule = f; out.stars = sum.deaths ? 2 : 3;
        for (const d of kuleRewards(f)) grant(p, out.loot, d.t === 'gear' ? { t: 'item', b: pickGear(env.rand, tierForLevel(p.lvl)), g: REWARD_GRADE, key: 'gear' } : d);
        addXp(p, xp, out);
      } else if (!out.win) out.akce = Math.round(out.akce * 0.25);
      return finish(p, out);
    },
  },

  // ---------- Taş Yemini (yemin.js): haftada bir zafer; iki halktan kahramanlar aynı grupta, Tarikat'a karşı ----------
  yemin: {
    build(p, _, env) {
      if (p.lvl < YEMIN.unlock) fail('locked', `${YEMIN.unlock}. seviyede açılır.`);
      const wk = weekKey(env.now);
      if (yeminDone(p, wk)) fail('yemin-done', 'Bu haftanın Taş Yemini tutuldu. Pazartesi yenilenir.');
      const id = mainId(p), cls = clsOf(p, id), rest = CLASS_KEYS.filter(c => c !== cls), other = p.faction === 'ocak' ? 'sancak' : 'ocak', lvl = yeminLevel(p);
      const tag = u => ({ ...u, ai: true, name: `${u.name} (yemin)` });
      const allies = [...botTeam(env, lvl, YEMIN.allyQ, other, rest.slice(0, YEMIN.allies.other)), ...botTeam(env, lvl, YEMIN.allyQ, p.faction, rest.slice(YEMIN.allies.other, YEMIN.allies.other + YEMIN.allies.own))].map(tag);
      return { ref: String(wk), waves: yeminWaves(env.rand, lvl), party: [heroUnit(p, id), ...allies], turnCap: 300, enrageTurn: 140, title: 'Taş Yemini', env: 'graveyard', solo: false };
    },
    settle(p, b, sum, env) {
      const out = base(sum, {});
      const xp = killRewards(p, sum.kills, env, out, { xp: out.win, drops: false });
      if (out.win && !yeminDone(p, +b.ref)) {
        const first = !rkOf(p).fr.includes(YEMIN.frame);
        p.yemin = { w: +b.ref, n: (p.yemin?.n || 0) + 1 };
        for (const d of yeminRewards(yeminLevel(p))) grant(p, out.loot, d);
        if (first) { rkOf(p).fr.push(YEMIN.frame); out.frame = YEMIN.frame; }
        out.stars = sum.deaths ? 2 : 3;
        addXp(p, xp, out);
      } else if (!out.win) out.akce = Math.round(out.akce * 0.25);
      return finish(p, out);
    },
  },

  // ---------- Destan (destan.js): hikâye bölümlerinin savaşları. Ödül yalnız ilk bitirişte; bitmiş bölüm yeniden oynanabilir ----------
  destan: {
    build(p, a, env) {
      const C = DESTAN_BY[+a.ch];
      if (!C || !needsBattle(C)) fail('bad-chapter', 'Bu bölüm savaşla oynanmaz.');
      if (!chapterOpen(p, C.id)) fail('locked', `Bu bölüm ${C.lvl}. seviyede ve bir önceki bölümden sonra açılır.`);
      if (C.kind === 'runes' && !destanOf(p).pz[C.id]) fail('need-puzzle', 'Önce taşın iki yüzünü oku.');
      const id = mainId(p), S = destanSetup(p, C, env, { hero: heroUnit(p, id), botTeam });
      return { ref: String(C.id), waves: S.waves, party: S.party, solo: false, turnCap: 320, enrageTurn: 150, title: S.title, env: S.env, opts: S.opts || {} };
    },
    settle(p, b, sum, env) {
      const C = DESTAN_BY[+b.ref], out = base(sum, { chapter: C.id });
      const xp = killRewards(p, sum.kills, env, out, { xp: out.win, drops: false });
      if (out.win) { out.first = !chapterDone(p, C.id); finishChapter(p, C, out); out.stars = sum.deaths ? 2 : 3; addXp(p, xp, out); }
      else out.akce = Math.round(out.akce * 0.25);
      return finish(p, out);
    },
  },

  // ---------- Gök Yarığı: yalnızca hafta sonu; parça (Kader Çarkı) verir ----------
  rift: {
    build(p, _, env) {
      need(p, 'rift');
      if (weekDay(env.now) < 5 && !env.dev) fail('closed', 'Gök Yarığı yalnızca cumartesi ve pazar açılır.');
      useDaily(p, 'rift', RULES.rift.daily);
      const W = withMod([wave(env.rand, p.lvl, 4, 1), wave(env.rand, p.lvl, 4, 2), wave(env.rand, clamp(p.lvl + 1, 1, GAME.maxLevel), 5, 2)], env);
      return { ref: 'rift', waves: W.waves, title: 'Gök Yarığı', env: 'shrine', opts: { mod: W.mod } };
    },
    settle(p, b, sum, env) {
      const out = base(sum);
      addXp(p, modXp(b, out.win, killRewards(p, sum.kills, env, out, { xp: out.win, drops: false })), out);
      const n = out.win ? RULES.rift.shards[0] + Math.floor(env.rand() * (RULES.rift.shards[1] - RULES.rift.shards[0] + 1)) : sum.wave;
      for (let i = 0; i < n; i++) grant(p, out.loot, { t: 'shard', k: pickFrom(env.rand, ['kor', 'ayaz', 'simsek']), n: 1 });
      if (out.win) out.stars = sum.deaths ? 2 : 3;
      modBonus(p, b, out);
      return finish(p, out);
    },
  },

  // ---------- Mühürlü Oda: Mühür Taşı harcanır, rastgele bir boss çıkar (eşsiz şansı 3 kat) ----------
  // ---------- Öğretici: Dev Solucan (Yemin Pazarı'ndaki çocuğun kardeşi). Yalnızca öğreticinin 'worm' adımında girilir ----------
  worm: {
    build(p) {
      const T = p.tut;
      if (!T || T.end || !['worm', 'child'].includes(TUT_STEPS[T.s]) || T.f.worm) fail('locked', 'Bu görev artık yok.');
      return { ref: 'devsolucan', waves: [[mobUnit('devsolucan', Math.max(2, p.lvl))]], title: 'Dev Solucan', env: 'forest' };
    },
    settle(p, b, sum) {
      const out = base(sum, { bossDamage: sum.bossDamage });
      if (out.win) { out.stars = 3; p.tut.f.worm = 1; grant(p, out.loot, { t: 'akce', n: 600 }); grant(p, out.loot, { t: 'stone', g: 0, n: 3 }); addXp(p, 120, out); }
      return finish(p, out);
    },
  },

  seal: {
    build(p, _, env) {
      need(p, 'seal');
      if (p.seals < 1) fail('no-seal', 'Mühür Taşı yok.');
      p.seals--;
      const boss = bossFor(env.rand, p.lvl), Z = ZONES[MOBS[boss].zone - 1], lvl = clamp(p.lvl, Z.lv[0], Z.lv[1]);
      const add = Z.blocks[4].mob;
      const W = withMod([[mobUnit(add, lvl, 'e'), mobUnit(boss, lvl), mobUnit(add, lvl, 'e')]], env);
      return { ref: boss, waves: W.waves, enrageTurn: 110, title: `Mühürlü Oda · ${MOBS[boss].name}`, env: 'shrine', opts: { mod: W.mod } };
    },
    settle(p, b, sum, env) {
      const out = base(sum, { bossDamage: sum.bossDamage });
      const xp = killRewards(p, sum.kills, env, out, { xp: out.win, drops: out.win, drop: { uniqueMult: SEAL_UNIQUE, noMark: true } });
      if (out.win) { out.stars = 3; grant(p, out.loot, { t: 'stone', g: 1, n: 1 }); addXp(p, modXp(b, true, xp), out); } else out.akce = Math.round(out.akce * 0.25);
      modBonus(p, b, out);
      return finish(p, out);
    },
  },

  // ---------- Meydan: rakibin savunma partisini yapay zekâ oynar ----------
  arena: {
    build(p, { opp }, env) {
      need(p, 'arena');
      const o = int(opp, 0, p.arena.opp.length - 1) ? p.arena.opp[opp] : null; // indis tam sayı olmalı ('length', '__proto__' değil)
      if (!o) fail('no-opponent', 'Rakip listesini yenile.');
      if (sameRace(o.faction, p.faction)) fail('same-race', 'Meydan’da yalnızca karşı ırktan rakiple dövüşülür.');
      if (ticketsLeft(p, env.now) < 1) fail('no-ticket', 'Bugünkü meydan hakkın bitti.');
      countVs(p, o); // aynı rakiple günlük savaş sınırı
      p.daily.arena = used(p, 'arena') + 1;
      p.arena.opp.splice(opp, 1);
      return { ref: { name: o.name, rating: o.rating, faction: o.faction, id: o.id ?? null }, waves: [soloUnits(o.units)], turnCap: ARENA.turnCap, title: `Meydan · ${o.name}`, env: 'arena' };
    },
    settle(p, b, sum, env) {
      const out = base(sum, { opp: b.ref.name, vs: b.ref.id ?? null, defFac: b.ref.faction || null }), A = p.arena;
      const e = 1 / (1 + Math.pow(10, (b.ref.rating - A.rating) / 400));
      out.rating = out.win ? ARENA_PTS.win : Math.round(-ARENA_PTS.kLoss * e); // zafer +3 (pvp.js: ARENA_PTS); yenilgide eski Elo düşüşü
      raceMark(p, env.now); // günlük ırk yarışı: bugün Meydan'da dövüştü (ertesi gün ödül postası, pvpops.js)
      seasonScore(p, b.ref.id, out, 'rating'); // sezon sayaçları (pvp.js)
      A.rating = Math.max(0, A.rating + out.rating); A.peak = Math.max(A.peak || 0, A.rating);
      out.win ? A.wins++ : A.losses++;
      feudNote(p, b.ref, out.win, b.at);
      grant(p, out.loot, { t: 'san', n: RULES.arena.san[out.win ? 0 : 1] });
      if (out.win) { out.stars = 3; p.pend.war += 2; if (!p.daily.arenaWin) { p.daily.arenaWin = true; grant(p, out.loot, { t: 'yakut', n: RULES.arena.firstWinYakut }); } }
      bump(p, 'arena');
      return finish(p, out);
    },
  },

  // ---------- Canlı Meydan: günde iki pencere, hamle süresi 15 sn (istemci), ayrı sıralama ----------
  // Bu sürümde rakibin partisini yapay zekâ oynar; iki oyunculu eşzamanlı akış ayrı bir ağ katmanı gerektirir.
  live: {
    build(p, _, env) {
      need(p, 'live');
      const h = hourOf(env.now);
      if (h !== 13 && h !== 21 && !env.dev) fail('closed', 'Canlı Meydan 13:00 ve 21:00 pencerelerinde açılır.');
      const o = p.arena.liveOpp;
      if (!o) fail('no-opponent', 'Önce eşleşme ara.');
      if (sameRace(o.faction, p.faction)) { p.arena.liveOpp = null; fail('same-race', 'Meydan’da yalnızca karşı ırktan rakiple dövüşülür.'); }
      if (ticketsLeft(p, env.now) < 1) fail('no-ticket', 'Bugünkü meydan hakkın bitti.'); // arayüzdeki koşul sunucuda da aranır (hak harcanmaz)
      countVs(p, o);
      p.arena.liveOpp = null;
      return { ref: { name: o.name, rating: o.rating, faction: o.faction, id: o.id ?? null }, waves: [soloUnits(o.units)], turnCap: ARENA.turnCap, title: `Canlı Meydan · ${o.name}`, env: 'arena', opts: { timer: RULES.live.timer } };
    },
    settle(p, b, sum, env) {
      const out = base(sum, { opp: b.ref.name, vs: b.ref.id ?? null, defFac: b.ref.faction || null }), r0 = p.arena.live ?? 1000;
      const e = 1 / (1 + Math.pow(10, (b.ref.rating - r0) / 400));
      out.rating = out.win ? ARENA_PTS.win : Math.round(-ARENA_PTS.kLive * e);
      raceMark(p, env.now);
      seasonScore(p, b.ref.id, out, 'live');
      p.arena.live = Math.max(0, r0 + out.rating);
      grant(p, out.loot, { t: 'san', n: RULES.live.san[out.win ? 0 : 1] });
      if (out.win) { out.stars = 3; p.pend.war += 3; }
      feudNote(p, b.ref, out.win, b.at);
      bump(p, 'arena');
      return finish(p, out);
    },
  },

  // ---------- Oba Avı: klan boss'una günde 1 saldırı; verilen hasar klanın sandığına ve günlük sıralamaya yazılır ----------
  // Kademe (Olağan / Azgın / Kudurmuş) klanın o günkü seçimidir: boss sertleşir, hasar klana daha yüksek oranla yazılır.
  clanboss: {
    build(p, _, env) {
      need(p, 'clan');
      if (!p.clan) fail('no-clan', 'Önce bir klana katıl.');
      useDaily(p, 'clanboss', 1);
      const diff = huntDiffOf(p, env.now), D = HUNT_DIFF[diff];
      const u = diff ? scaled(mobUnit('tepegoz', p.lvl), D.hp, D.atk) : mobUnit('tepegoz', p.lvl);
      return { ref: 'tepegoz', waves: [[u]], turnCap: CLAN.bossTurns, title: `Oba Avı · Tepegöz${diff ? ` (${D.name})` : ''}`, env: 'arena', opts: { diff } };
    },
    settle(p, b, sum, env) {
      const out = base(sum), D = HUNT_DIFF[b.opts.diff || 0], hp = b.waves[0][0].maxHp;
      out.damage = Math.round(sum.bossDamage * hp * D.credit * SOLO.event.credit / 100); // klana yazılan hasar (kademe oranıyla)
      p.pend.clan += out.damage; // dispatch savaş biter bitmez klan belgesine yazar (clanrules.js: after)
      out.akce = battleAkce(p, Math.round(withPct(out.damage / 20, p.clan ? clanLevel(p.clanTag?.lvl).huntAkce : 0))); // + klan seviyesi bonusu
      grant(p, out.loot, { t: 'san', n: 20 });
      p.codex.tepegoz = p.codex.tepegoz || { k: 0, d: {} };
      out.win = true; out.stars = 0; // süre dolana kadar hasar verilir; kazanma/kaybetme yoktur
      p.stats.wins++; bump(p, 'win');
      p.akce += out.akce;
      return out;
    },
  },

  // ---------- Kristal Nöbeti (nobet.js): kayıtlı oyuncu nöbet süresince dalga savaşları açar; dalgalar ortak sayılır ----------
  nobet: {
    build(p, _, env) {
      const N = p.nobet, now = env.now;
      if (!N || N.left) fail('not-joined', `${NOBET.name}'ne kayıtlı değilsin.`);
      if (now < N.start) fail('wait', 'Nöbet henüz başlamadı.');
      if (now >= N.start + NOBET.runMin * 60000 || N.over) fail('closed', 'Nöbet bitti.');
      const m = minuteOf(N.start, now), z = N.br === 'high' ? 4 : 3, i = (N.n = (N.n || 0) + 1);
      const pick = k => { let n = (z === 3 ? 10 : 1) + ((i * 3 + k) % (z === 3 ? 15 : 24)); if (n % 5 === 0) n++; return stageDef(`${z}-${n}`).waves; };
      const lvl = Math.min(65, Math.max(p.lvl, NOBET.brackets[N.br].min));
      if (N.boss || m >= NOBET.bossAt) return { ref: N.key, waves: [[pick(0)[0][0], mobUnit(NOBET.boss, lvl), pick(1)[0][1]]], title: `${NOBET.name} · ${MOBS[NOBET.boss].name}`, env: 'shrine', party: buffed(p, N.buffs) };
      const W = pick(0).slice(0, 3);
      const guardDue = NOBET.buffAt.some((at, k) => m >= at && (N.buffs || 0) <= k);
      if (guardDue) W[2] = [W[2][0], mobUnit(NOBET.guard, lvl), W[2][W[2].length - 1]];
      return { ref: N.key, waves: W, title: `${NOBET.name} · ${Math.floor(m) + 1}. dakika`, env: 'shrine', party: buffed(p, N.buffs), opts: { guard: guardDue ? 1 : 0 } };
    },
    settle(p, b, sum) {
      const out = base(sum), won = sum.winner === 'A', n = won ? b.waves.length : sum.wave;
      const hpOf = w => w.reduce((a, u) => a + (u.maxHp || 0), 0);
      let d = b.waves.slice(0, n).reduce((a, w) => a + hpOf(w), 0);
      const boss = b.waves.flat().find(u => u.boss);
      if (!won && boss) d += Math.round(sum.bossDamage * boss.maxHp);
      out.nobet = { w: boss ? (won ? 1 : 0) : n, d, lost: won ? 0 : 1, guard: won && b.opts?.guard ? 1 : 0, boss: won && boss ? 1 : 0 }; // dalga sayımı ve kristal nobet.js after'da
      out.akce = Math.round(d / 40);
      out.win = won; out.stars = 0;
      return finish(p, out);
    },
  },

  // ---------- Dünya Baskını: hafta sonu, Küllerin Tarikatı'nın Kül Ağası; hasar iki ırkın ortak havuzuna yazılır (baskin.js) ----------
  baskin: {
    build(p, _, env) {
      if (p.lvl < BASKIN.lvl) fail('locked', `${BASKIN.lvl}. seviyede açılır.`);
      if (!raidOpen(env.now)) fail('closed', 'Dünya Baskını yalnızca cumartesi ve pazar açılır.');
      useDaily(p, 'baskin', BASKIN.tries, 'Bugünkü baskın hakkın bitti.');
      return { ref: weekKey(env.now), waves: [[mobUnit(BASKIN.boss, p.lvl)]], turnCap: BASKIN.turns, title: `Dünya Baskını · ${MOBS[BASKIN.boss].name}`, env: 'castle' };
    },
    settle(p, b, sum) {
      const out = base(sum), hp = b.waves[0][0].maxHp;
      out.raid = { w: b.ref, d: Math.round(sum.bossDamage * hp * SOLO.event.credit) }; // dispatch havuza yazar (baskin.js: after)
      out.akce = Math.round(out.raid.d / 25);
      grant(p, out.loot, { t: 'san', n: 15 });
      if (sum.bossDamage >= 0.5) grant(p, out.loot, { t: 'ember', n: 1 });
      out.win = true; out.stars = 0; // süre dolana kadar hasar verilir
      return finish(p, out);
    },
  },

  // ---------- Sancak Savaşı: tek kahramanını getirirsin, 3 müttefik ve karşı taraf; 3 raunt = 3 kontrol noktası ----------
  // Bu sürümde müttefikleri ve rakipleri yapay zekâ oynar (sekiz oyunculu eşzamanlı akış ayrı ağ katmanı ister).
  banner: {
    build(p, a, env) {
      need(p, 'banner');
      const id = mainId(p), cls = clsOf(p, id); // müttefikler diğer üç sınıftan gelir (her sınıftan bir kahraman kuralı bu modda sürer)
      useDaily(p, 'banner', 5);
      const allies = botTeam(env, p.lvl, 0.5, p.faction, CLASS_KEYS.filter(c => c !== cls)).map(u => ({ ...u, ai: true, name: u.name + ' (müttefik)' }));
      const foe = p.faction === 'ocak' ? 'sancak' : 'ocak';
      const waves = [0, 1, 2].map(i => botTeam(env, p.lvl, 0.35 + 0.1 * i, foe, CLASS_KEYS));
      return { ref: cls, waves, party: [heroUnit(p, id), ...allies], turnCap: 240, title: 'Sancak Savaşı', env: 'arena', opts: { restoreOnWave: true } };
    },
    settle(p, b, sum) {
      const out = base(sum, { points: sum.winner === 'A' ? 3 : sum.wave });
      grant(p, out.loot, { t: 'san', n: 10 + 20 * out.points });
      p.pend.war += 3 * out.points;
      out.win = out.points >= 2; out.stars = out.points;
      return finish(p, out);
    },
  },

  // ---------- Hisar Kuşatması: klan adına haftada 3 saldırı; puan klanın kuşatma skoruna yazılır ----------
  siege: {
    build(p, _, env) {
      need(p, 'siege');
      if (!p.clan) fail('no-clan', 'Önce bir klana katıl.');
      const hw = hisarOpen(env.now); // haftalık kuşatma penceresi: ayrı hak, puan hisar puanına da yazılır (hisarops.js)
      if (hw != null) { if ((p.weekly.hisar || 0) >= HISAR.tries) fail('weekly-limit', 'Bu kuşatma penceresindeki hakkın bitti.'); p.weekly.hisar = (p.weekly.hisar || 0) + 1; }
      else { if ((p.weekly.siege || 0) >= 3) fail('weekly-limit', 'Bu haftaki kuşatma hakkın bitti.'); p.weekly.siege = (p.weekly.siege || 0) + 1; }
      const waves = Array.from({ length: RULES.siege.waves }, (_, i) => i).map(i => botParty(seedOf(env), clamp(p.lvl + i - 1, 1, GAME.maxLevel), 0.3 + 0.15 * i).units.map(u => ({ ...u, name: 'Hisar ' + u.name })));
      return { ref: hw != null ? `hisar:${hw}` : 'siege', waves, turnCap: 300, title: 'Hisar Kuşatması', env: 'castle' };
    },
    settle(p, b, sum) {
      const out = base(sum), cleared = sum.winner === 'A' ? RULES.siege.waves : sum.wave;
      out.score = cleared * RULES.siege.perWave + (out.win ? RULES.siege.win + Math.max(0, 200 - sum.turns) : 0);
      p.pend.siege += out.score; p.pend.war += cleared;
      const hw = typeof b.ref === 'string' && b.ref.startsWith('hisar:') ? +b.ref.slice(6) : null;
      if (hw && out.score > 0) { p.pend.hisar = (p.pend.hw === hw ? p.pend.hisar || 0 : 0) + out.score; p.pend.hw = hw; } // pencerede başlayan savaş: hisar puanı (clanrules.js flush)
      grant(p, out.loot, { t: 'san', n: 15 * cleared });
      out.stars = out.win ? 3 : cleared >= 2 ? 1 : 0;
      return finish(p, out);
    },
  },

  // ---------- Akın: saatli yarış; 12 dalgada en çok yaratığı kes, skor tabloya yazılır ----------
  // ---------- Anıt Savaşı (anit.js): iki ırkın partisi + iki tarafın da vurabildiği Sınır Anıtı ----------
  anit: {
    build(p, _, env) {
      if (p.lvl < ANIT.minLevel) fail('locked', `${ANIT.name} ${ANIT.minLevel}. seviyede açılır.`);
      useDaily(p, 'anit', ANIT.daily, `Bugünkü ${ANIT.name} hakkın bitti (${ANIT.daily}).`);
      const id = mainId(p), cls = clsOf(p, id), br = bracketOf(p.lvl), seed = seedOf(env), foe = p.faction === 'ocak' ? 'sancak' : 'ocak';
      // yoldaşlar: diğer sınıflardan (Rahip öncelikli); rakip parti: her sınıftan bir kahraman (tohumlar ayrı: adlar çakışmaz)
      const team = (off, faction, classes, q) => classes.map(c => { let sd = (seed + off) >>> 0; sd = sd - (sd % 4) + CLASS_KEYS.indexOf(c); return botParty(sd >>> 0, p.lvl, q, faction).units[0]; });
      const allyCls = CLASS_KEYS.filter(c => c !== cls).sort((a, b) => (b === 'priest') - (a === 'priest')).slice(0, ANIT.side - 1);
      const allies = team(0, p.faction, allyCls, 0.5).map(u => ({ ...u, ai: true }));
      const foes = team(4096, foe, CLASS_KEYS.slice(0, ANIT.side), 0.5);
      const me = heroUnit(p, id), mon = monUnit(p.lvl, [me, ...allies, ...foes]);
      return { ref: br ? `${br.min}-${br.max}` : String(p.lvl), waves: [foes], party: [me, ...allies], solo: false, turnCap: 100000, title: ANIT.name, env: 'arena',
        opts: { bdw: { mon, rounds: ANIT.rounds, respawn: ANIT.respawn, regenEvery: ANIT.regenEvery, regenPct: ANIT.regenPct, monPick: ANIT.monPick } } };
    },
    settle(p, b, sum) {
      const B = sum.bdw || { pts: { A: 0, B: 0 }, dmg: { A: 0, B: 0 } }, R = ANIT.reward[sum.winner === 'A' ? 'win' : 'lose'];
      const tot = B.dmg.A + B.dmg.B, share = tot ? B.dmg.A / tot : 0;
      const out = base(sum, { anit: { pts: B.pts, dmg: B.dmg, share: Math.round(share * 1000) / 10, monDown: !!B.monDown, round: B.round } });
      out.akce = p.lvl * R.akcePer;
      grant(p, out.loot, { t: 'san', n: R.san + ANIT.reward.perKill * B.pts.A });
      out.stars = out.win ? (B.monDown ? 3 : 2) : 1;
      p.pend.war += out.win ? 3 : 1;
      return finish(p, out);
    },
  },

  akin: {
    build(p, _, env) {
      need(p, 'arena');
      if (hourOf(env.now) % 4 !== 0 && !env.dev) fail('closed', 'Akın 4 saatte bir, bir saatliğine açılır.');
      useDaily(p, 'akin', 3);
      const waves = Array.from({ length: RULES.akin.waves }, () => wave(env.rand, clamp(p.lvl - 2, 1, GAME.maxLevel), 5, 0).map(u => scaled(u, 0.7, 1.15)));
      return { ref: String(Math.floor(env.now / 14400000)), waves, turnCap: RULES.akin.turnCap, title: 'Akın', env: 'forest' };
    },
    settle(p, b, sum, env) {
      const out = base(sum);
      addXp(p, killRewards(p, sum.kills, env, out, { drops: false }), out);
      out.score = sum.kills.length * RULES.akin.perKill + (sum.winner === 'A' ? RULES.akin.win : 0);
      if (!p.pend.akin || p.pend.akin.w !== b.ref || p.pend.akin.s < out.score) p.pend.akin = { w: b.ref, s: out.score };
      grant(p, out.loot, { t: 'san', n: Math.floor(out.score / 20) });
      if (out.score >= RULES.akin.stoneAt) grant(p, out.loot, { t: 'stone', g: 1, n: 1 });
      if (out.score >= RULES.akin.emberAt) grant(p, out.loot, { t: 'ember', n: 1 }); // etkinlik ödülü: Tav Közü
      out.win = out.score > 0; out.stars = out.score >= 500 ? 3 : out.score >= 300 ? 2 : 1;
      p.pend.war += Math.floor(out.score / 100);
      return finish(p, out);
    },
  },
};

// Oyuncuya (ya da kahraman sınıflarından kurulu rakip partiye) karşı modlar: sırayı hız çubuğu belirler. Diğer bütün modlar
// yaratıklara karşıdır ve açılış turu partinindir (battle.js: lead).
const PVP = new Set(['arena', 'live', 'banner', 'siege', 'anit']);
// P28: PvE modlarının sonucu Han/Zafer kazanç çarpanıyla işlenir; ardından Han buff'ının kalan savaş hakkı 1 azalır
for (const [k, M] of Object.entries(MODES)) if (!PVP.has(k)) {
  const settle = M.settle;
  M.settle = function (p, b, sum, env) { const prev = P28; P28 = p28Bonus(p, env.now); try { return settle.call(this, p, b, sum, env); } finally { P28 = prev; p28AfterBattle(p, env.now); } };
}
// Klan Karargâhı Talim Meydanı: yaratıklara karşı (PvP olmayan) savaşlarda kahramanların saldırı ve büyü gücü +%; savaş kaydına işlendiği için sunucu tekrarı aynı sayıyı oynar
const talim = (p, mode, party) => { const k = PVP.has(mode) ? 0 : hqPct(p, 'talim'); return k > 0 ? party.map(u => (u.cls ? { ...u, atk: Math.round(u.atk * (100 + k) / 100), mag: Math.round(u.mag * (100 + k) / 100) } : u)) : party; };
// Savaşı başlatır (kayıt p.battle'a yazılır) — game.js 'battle.start' buradan geçer.
// Parti, modun düzeninden okunur (roster.js: MODE_PARTY → p.party); istemci savaşa kahraman listesi gönderemez.
export function startBattle(p, args, env) {
  const mode = args.mode || 'stage', M = typeof mode === 'string' && Object.hasOwn(MODES, mode) ? MODES[mode] : fail('bad-mode');
  if (ITEM_MODES.has(mode)) needBagRoom(p); // çanta doluyken eşya veren savaşa girilmez (bedel alınmadan)
  if (mode !== 'nobet' && nobetLocked(p, env.now)) fail('nobet', `${NOBET.name}'ne kayıtlısın: nöbet bitene kadar başka savaşa giremezsin.`); // geri sayım ve nöbet süresince
  const s = M.build(p, args, env);
  p.stats.battles++;
  const waves = s.solo === false ? s.waves : soloWaves(s.waves, mode, s.solo); // tek kahramana göre dalga (solo.js)
  p.battle = { id: p.nextBattle++, mode: args.mode || 'stage', ref: s.ref, seed: seedOf(env), party: (PVP.has(mode) ? x => x : x => tavernUnits(p, env.now, x))(talim(p, mode, (s.party || partyUnits(p)).map(u => (u.ai ? u : soloHero(u, mode, p.heroes?.[u.key]?.path))))), lead: PVP.has(mode) ? 0 : 1, eng: ENGINE_V, waves, enrageTurn: s.enrageTurn || 0, turnCap: s.turnCap || TURN_CAP, opts: s.opts || {}, title: s.title, env: s.env, at: env.now };
  return p.battle;
}
export const setupOf = b => ({ party: b.party, waves: b.waves, seed: b.seed, enrageTurn: b.enrageTurn, turnCap: b.turnCap, restoreOnWave: !!b.opts.restoreOnWave, lead: !!b.lead, v: b.eng || 1, bdw: b.opts.bdw || null }); // eng: savaşın başladığı motor sürümü (eski kayıt: 1)
