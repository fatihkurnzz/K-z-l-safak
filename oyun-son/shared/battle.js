// Belirlenimci sıra tabanlı savaş motoru. 3D'den ve ağdan bağımsızdır; istemci animasyon için,
// sunucu hile denetimi için aynı kodu çalıştırır: aynı tohum + aynı oyuncu hamleleri = aynı sonuç.
// Yalnızca toplama/çarpma/bölme ve Math.round/floor kullanılır (motorlar arası bit bit aynı).
import { rng } from './rng.js';
import { SKILLS } from './skills.js';
import { STATUS } from './content.js';
import { COEF, WFX_PCT } from './items.js';
const WFX_RES = { flame: 'fire', glacier: 'ice', lightning: 'bolt' }; // silah efekti → hedefin direnç anahtarı
import { RULES } from './rules.js';
import { POT } from './mana.js';
const WEAK_MULT = (100 + RULES.weak) / 100; // zayıf olduğu elementten alınan hasarın çarpanı

const K_DEF = 120, K_LVL = 3; // hasar azaltma: K / (K + savunma), K = 120 + 3 × (saldıranın seviyesi − 1)
// Savunma katsayıları (birim şablonundan): u.wt saldıranın silah sınıfı · u.pen savunma delme · t.res savunanın katsayıları
//   savunma = savunma × (1 − yeteneğin delmesi) × (1 − min(penCap, delme))
//   hasar   = hasar × (1 − min(resCap, res[silah sınıfı] + res[yeteneğin elementi]))
// Alanı olmayan (eski kayıt, yaratık) birimde hepsi 0 sayılır.
const TM_FULL = 1000;     // sıra çubuğu dolunca birim oynar
// Motor sürümü. Savaş kaydı başladığı sürümü taşır (modes.js: p.battle.eng) ve tekrar o sürümle doğrulanır.
//   1: ilk motor · 2: uzmanlık yolları (yapay zekâ yeni etkileri tanır: himaye, patlatma, sökme, fırsat vuruşu, arındırma).
// Yeni etkilerin kendisi veriye bağlıdır (yeteneğin fx listesi, birimin mods alanı): eski kayıttaki birimlerde bulunmadıkları
// için sürüm 1 savaşı bit bit eskisi gibi oynar. Sürüme bağlı olan yalnızca yapay zekânın seçimleridir.
//   3: mana ve iksir (sürüm 12). Birim şablonu maxMp / mpr / mpc taşıyorsa yetenek bedeli düşülür, tur başında mana yenilenir,
//   bedeli karşılanamayan yetenek kullanılamaz. pot = { hp, mp } taşıyan birim iksir içebilir: seçim ['@hp', 0] ya da
//   ['@mp', 0]; serbest hamledir (tur bitmez, sıra aynı birimde kalır). Alanları olmayan birim (eski kayıt, yaratık) eskisi gibi.
// Büyücü büyü vuruşunda yok sayılan savunma payı (1 = tamamı; testle ayarlanır)
export let MAGE_AC_IGNORE = 0.8; // 19 Kas testi: 1 → Büyücü %64–96 (fazla), 0,8 → oyun sonu %50–64
export const setMageAcIgnore = v => { MAGE_AC_IGNORE = v; };
export const ENGINE_V = 9;
// v8 (kullanıcı 20 Kas): element zayıflığı yalnız PvE — yaratığa vuran kahraman vuruşunun elementi, yetenekte `el` yoksa yeteneğin
// ağacından (Ateş/Alaz → ateş, Yıldırım/Boran → yıldırım, Buz → buz) ya da fiziksel vuruşta silah efektinden (alev/buz/yıldırım) gelir.
// Hedefin zayıflığına denk gelirse ×WEAK_MULT. Kahramanların zayıflığı yok (weak: null): PvP'de hiç işlemez.
// v7 (kullanıcı 19 Kas): hız faktörü askıda — bütün birimler sıra çubuğunu eşit doldurur (SPD_FLAT); hız statı, Çabukluk/Yavaşlık
// sırayı etkilemez. Kimin önce başlayacağı yine kurulumdaki rastgele başlangıç çubuğuyla belirlenir. Geri açmak: SPEED_OFF = false.
export const SPEED_OFF = true, SPD_FLAT = 100; // 6: Büyücünün büyü vuruşu savunmayı yok sayar (KO; yalnız direnç keser) · 4: zehirli silah (2 tur zehir) · 5: silah efektleri (isabet hasarının %1'i, tek seferlik, türlü)
export const POT_IDS = { '@hp': 'hp', '@mp': 'mp' }; // iksir seçimleri
const DOTS = ['burn', 'poison', 'bleed']; // tur başında işleyen süren hasarlar
const STRIP_MAX_T = 90;   // bundan uzun süreli güçlendirme (boss evresinin kalıcı öfkesi) sökülemez
export class BattleError extends Error { constructor(code) { super(code); this.code = code; } }

const has = (u, s) => u.st.some(x => x.s === s);
const atkMod = u => (has(u, 'atkUp') ? 1.3 : 1) * (has(u, 'atkDown') ? 0.7 : 1);
// Büyücü element gücü: uzmanlık ağacının (ve o yolun usta) yetenekleri büyü gücüne kendi element hasarını ekler
const ELEM_OF = { ates: 'fire', yildirim: 'bolt', alaz: 'fire', boran: 'bolt' };
export const elemOf = S => ELEM_OF[S.tree] || (S.pm ? ELEM_OF[S.path] : null) || null;
const HIT_EL = { ...ELEM_OF, buz: 'ice' }; // v8: zayıflık için vuruşun elementi (güç hesabına girmez)
export const hitElOf = S => HIT_EL[S.tree] || (S.pm ? HIT_EL[S.path] : null) || null;
const stv = (u, s, d) => { const x = u.st.find(y => y.s === s); return x ? (x.v || d) : 0; }; // etkinin değeri (yoksa 0)
const defMod = u => (has(u, 'defUp') ? 1.4 : 1) * (has(u, 'defDown') ? 0.6 : 1);
const spdMod = u => (has(u, 'spdUp') ? 1.25 : 1) * (has(u, 'spdDown') ? 0.75 : 1);

// Yeteneğin yapay zekâ açısından türü
function kindOf(S) {
  if (S.fx.some(f => f.k === 'revive')) return 'revive';
  const friendly = S.target === 'ally' || S.target === 'allies' || S.target === 'self';
  if (friendly && S.fx.some(f => f.k === 'heal')) return 'heal';
  if (friendly) return 'buff';
  return 'attack';
}

export class Battle {
  // party: kahraman birimleri · waves: dalga dalga yaratık birimleri · seed: 32 bit tohum
  // restoreOnWave: her yeni dalgada A takımı dirilir ve canı dolar (raunt usulü modlar)
  // lead: açılış turu partinindir (yaratıklara karşı savaşlar). Partinin her kahramanı, hiçbir düşman oynamadan önce birer
  //   hamle yapar; kendi aralarındaki sıra yine hız çubuğunun başlangıç değerine, eşitlikte dizilişe göredir. Sonrası
  //   olağan hız çubuğudur. Oyuncuya karşı modlarda (meydan, sancak, kuşatma) verilmez: orada sırayı hız belirler.
  // v: motor sürümü (ENGINE_V); verilmezse 1 (güncellemeden önce başlamış savaş kaydı)
  // bdw: Sınır Anıtı savaşı (anit.js; iki ırkın partisi + ortada iki tarafın da vurabildiği anıt). { mon: anıt birimi, respawn,
  //   regenEvery, regenPct, rounds, monPick }. Raunt = sahadaki her canlı kahramanın bir hamlesi; ölen kahraman `respawn` raunt sonra
  //   tam canla döner; anıt her `regenEvery` rauntta azami canının regenPct'i kadar iyileşir; öldürme 1 puan.
  constructor({ party, waves, seed, enrageTurn = 0, turnCap = 400, restoreOnWave = false, lead = false, v = 1, bdw = null }) {
    this.v = v;
    this.rand = rng(seed);
    this.autoRand = rng((seed ^ 0x9e3779b9) >>> 0); // oyuncunun oto seçimi; ana akışı etkilemez
    this.units = [];
    this.nextId = 1;
    this.waves = waves;
    this.wave = -1;
    this.turns = 0;
    this.enrageTurn = enrageTurn;
    this.turnCap = turnCap;
    this.restoreOnWave = restoreOnWave;
    this.over = null;      // 'A' | 'B'
    this.pending = null;   // hamlesi beklenen oyuncu birimi
    this.kills = [];
    this.events = [];
    party.forEach((u, i) => this.addUnit(u, 'A', i));
    if (lead) for (const u of this.units) u.tm += TM_FULL; // çubuk dolu başlar: zar aynı kalır, yalnızca üstüne bir tam tur eklenir
    this.spawnWave();
    if (bdw) {
      const m = this.addUnit({ ...bdw.mon, skills: [] }, 'N', 0); m.mon = true; m.tm = 0;
      this.bdw = { respawn: bdw.respawn ?? 5, regenEvery: bdw.regenEvery ?? 5, regenPct: bdw.regenPct ?? 0.01, rounds: bdw.rounds ?? 30, monPick: bdw.monPick ?? 0.3,
        mon: m.id, round: 0, left: this.units.filter(x => x.alive && !x.mon).length, pts: { A: 0, B: 0 }, dmg: { A: 0, B: 0 }, monDown: false };
    }
  }
  // ---- Sınır Anıtı savaşı ----
  // Raunt sayacı: her hamle başında bir düşer; sıfırlanınca yeni raunt (dirilmeler, anıt yenilenmesi, raunt sınırı)
  bdwTurn() {
    const B = this.bdw;
    if (--B.left > 0) return;
    B.round++;
    for (const x of this.units) if (!x.alive && !x.mon && x.rise && x.rise <= B.round) {
      x.alive = true; x.hp = x.maxHp; x.st = []; x.tm = 0; x.rise = 0; x.hpb = 0; x.hpd = 0; for (const k of x.skills) k.cd = 0; if (x.maxMp > 0) x.mp = x.maxMp;
      this.events.push({ t: 'bdw', k: 'rise', u: x.id, hp: x.hp });
    }
    const m = this.get(B.mon);
    if (m.alive && B.round % B.regenEvery === 0 && m.hp < m.maxHp) {
      const amt = Math.min(m.maxHp - m.hp, Math.max(1, Math.round(m.maxHp * B.regenPct))); m.hp += amt;
      this.events.push({ t: 'bdw', k: 'mend', u: m.id, amt, hp: m.hp });
    }
    B.left = this.units.filter(x => x.alive && !x.mon).length || 1;
    this.events.push({ t: 'bdw', k: 'round', n: B.round, of: B.rounds });
    if (B.round >= B.rounds) this.finish(this.bdwWinner(false));
  }
  // Kazanan: anıt kesildiyse toplam anıt hasarının en az %50,1'ini veren taraf; değilse (ya da eşitse) öldürme puanı, o da eşitse
  // anıta verilen toplam hasar; hepsi eşitse savunan (B)
  bdwWinner(monDown) {
    const { pts, dmg } = this.bdw, tot = dmg.A + dmg.B;
    if (monDown && tot > 0) { if (dmg.A / tot >= 0.501) return 'A'; if (dmg.B / tot >= 0.501) return 'B'; }
    if (pts.A !== pts.B) return pts.A > pts.B ? 'A' : 'B';
    if (dmg.A !== dmg.B) return dmg.A > dmg.B ? 'A' : 'B';
    return 'B';
  }

  addUnit(tpl, side, slot) {
    const u = {
      ...tpl, id: this.nextId++, side, slot, wave: this.wave, hp: tpl.maxHp, alive: true, st: [], enrage: 0, phase: 0,
      mods: { dr: 0, healPct: 0, steal: 0, burnPct: 0, debuffAcc: 0, ccAcc: 0, dotPct: 0, shieldPct: 0, cutIgnore: 0, elPct: 0, tmKill: 0, critBurn: 0, ...(tpl.mods || {}) },
      skills: tpl.skills.filter(id => SKILLS[id]).map(id => ({ id, cd: 0 })), tm: Math.floor(this.rand() * 200),
    };
    if (tpl.maxMp > 0) u.mp = tpl.maxMp; // mana (alanları olmayan birimde hiç yazılmaz)
    if (tpl.pot) { u.potHp = tpl.pot.hp | 0; u.potMp = tpl.pot.mp | 0; u.cdHp = 0; u.cdMp = 0; u.usedHp = 0; u.usedMp = 0; delete u.pot; }
    this.units.push(u);
    return u;
  }
  spawnWave() {
    this.wave++;
    const restore = this.restoreOnWave && this.wave > 0;
    if (restore) for (const u of this.units) if (u.side === 'A') { u.alive = true; u.hp = u.maxHp; u.st = []; for (const s of u.skills) s.cd = 0; if (u.maxMp > 0) u.mp = u.maxMp; }
    const ids = this.waves[this.wave].map((t, i) => this.addUnit(t, 'B', i).id);
    this.events.push({ t: 'wave', n: this.wave, of: this.waves.length, ids, restore });
  }

  get(id) { return this.units.find(u => u.id === id); }
  alive(side) { return this.units.filter(u => u.alive && u.side === side); }
  foes(u) { const f = this.alive(u.side === 'A' ? 'B' : 'A'); return this.bdw && !u.mon ? [...f, ...this.alive('N')] : f; } // anıt iki tarafın da hedefidir
  // pve yeteneği (skills.js pve: true) yalnız yaratıklara iner: kahraman birimleri (cls taşıyan) hedef olamaz
  foesFor(u, S) { const f = this.foes(u); return S?.pve ? f.filter(x => !x.cls) : f; }
  allies(u) { return this.alive(u.side); }
  dead(u) { return this.units.filter(x => !x.alive && x.side === u.side && (x.side === 'A' || x.wave === this.wave)); }

  // ---- Sıra ----
  nextActor() {
    for (;;) {
      if (this.bdw && !this.units.some(x => x.alive && !x.mon)) { this.bdw.left = 1; this.bdwTurn(); if (this.over) return null; continue; } // herkes düştü: raunt ilerler, dirilenler gelir
      let best = null;
      for (const u of this.units) if (u.alive && !u.mon && u.tm >= TM_FULL && (!best || u.tm > best.tm)) best = u; // anıt sıra almaz
      if (best) { best.tm -= TM_FULL; return best; }
      for (const u of this.units) if (u.alive) u.tm += SPEED_OFF && this.v >= 7 ? SPD_FLAT : Math.round(u.spd * spdMod(u));
    }
  }

  // Oyuncu hamlesi bekleniyorsa choice = [skillId, targetId]; değilse parametresiz çağrılır.
  // Bir sonraki oyuncu kararına ya da savaş sonuna kadar ilerler; olayları döndürür.
  advance(choice) {
    if (this.started) this.events = []; // ilk çağrı, kurulumdaki dalga olayını da döndürür
    this.started = true;
    if (this.over) return this.out();
    if (this.pending && Array.isArray(choice) && Object.hasOwn(POT_IDS, choice[0])) { // iksir: serbest hamle, sıra oyuncuda kalır
      this.drink(this.pending, POT_IDS[choice[0]]);
      return this.out();
    }
    if (this.pending) {
      const u = this.pending;
      const [skillId, targetId] = this.validate(u, choice);
      this.pending = null;
      this.perform(u, skillId, targetId);
      this.endTurn(u);
    }
    while (!this.over && !this.pending) {
      const u = this.nextActor();
      if (!u) break;
      if (!this.startTurn(u)) { if (u.alive) this.endTurn(u); continue; }
      if (u.side === 'A' && !u.ai) { this.pending = u; break; } // ai: yapay zekânın oynadığı müttefik
      const c = this.ai(u, this.rand);
      this.perform(u, c[0], c[1]);
      this.endTurn(u);
    }
    return this.out();
  }
  out() { return { events: this.events, pending: this.pending ? this.pending.id : null, over: this.over }; }

  // ---- İksir (mana.js POT) ----
  potLeft(u, k) { return k === 'hp' ? u.potHp || 0 : u.potMp || 0; }
  canDrink(u, k) {
    if (!u || !u.alive || this.over || u.potHp === undefined) return false;
    if (k === 'mp' && !(u.maxMp > 0)) return false;
    return this.potLeft(u, k) > 0 && (k === 'hp' ? u.cdHp : u.cdMp) === 0;
  }
  drink(u, k) {
    if (u.potHp === undefined) throw new BattleError('no-potion');
    if (this.potLeft(u, k) <= 0) throw new BattleError('no-potion');
    if ((k === 'hp' ? u.cdHp : u.cdMp) > 0) throw new BattleError('potion-cooldown');
    if (k === 'mp' && !(u.maxMp > 0)) throw new BattleError('no-mana');
    const P = POT[k];
    let amt;
    if (k === 'hp') { amt = Math.min(u.maxHp - u.hp, Math.round(u.maxHp * P.pct * (has(u, 'rot') ? 0.5 : 1))); u.hp += amt; u.potHp--; u.usedHp++; u.cdHp = POT.cd; }
    else { amt = Math.min(u.maxMp - u.mp, Math.round(u.maxMp * P.pct)); u.mp += amt; u.potMp--; u.usedMp++; u.cdMp = POT.cd; }
    this.events.push({ t: 'pot', u: u.id, k, amt, hp: u.hp, ...(u.maxMp > 0 ? { mp: u.mp } : {}), left: this.potLeft(u, k) });
  }
  // Oto mod için iksir kararı (yalnızca iksiri olan birim; sürüm 3): can %40 altında ve tehlike sürüyorsa Can iksiri; mana
  // açık yeteneğin bedelini karşılamıyor ya da %20 altındaysa ve savaş daha sürecekse Mana iksiri.
  potChoice(u) {
    if (!u || u.potHp === undefined || this.v < 3) return null;
    const foes = this.foes(u);
    if (!foes.length) return null;
    const fhp = foes.reduce((a, f) => a + f.hp, 0), more = this.wave + 1 < this.waves.length;
    const threat = more || foes.length > 1 || foes.some(f => f.boss || f.captain) || fhp > u.maxHp * 0.25;
    if (this.canDrink(u, 'hp') && u.hp / u.maxHp < 0.4 && threat) return ['@hp', 0];
    if (this.canDrink(u, 'mp') && u.mpc) {
      const want = u.skills.filter(s => s.cd === 0 && u.mpc[s.id] > 0).map(s => u.mpc[s.id]);
      const short = want.length && Math.min(...want) > u.mp;
      if ((short || u.mp / u.maxMp < 0.2) && (more || fhp > u.maxHp * 0.5)) return ['@mp', 0];
    }
    return null;
  }

  startTurn(u) {
    if (this.bdw) { this.bdwTurn(); if (this.over) return false; }
    this.turns++;
    for (const s of u.skills) if (s.cd > 0) s.cd--;
    const ev = { t: 'turn', u: u.id, ticks: [] };
    this.events.push(ev);
    if (u.maxMp > 0) { u.mp = Math.min(u.maxMp, u.mp + (u.mpr || 0)); ev.mp = u.mp; } // tur başı mana yenilenmesi
    if (u.potHp !== undefined) { if (u.cdHp > 0) u.cdHp--; if (u.cdMp > 0) u.cdMp--; }
    for (const x of u.st) {
      if (!u.alive) break;
      if (x.s === 'burn' || x.s === 'poison' || x.s === 'bleed') {
        const amt = Math.min(u.hp, x.v);
        u.hp -= amt;
        const killed = u.hp <= 0;
        ev.ticks.push({ s: x.s, amt, killed, hp: u.hp });
        if (killed) this.kill(u);
      } else if (x.s === 'regen') {
        const amt = Math.min(u.maxHp - u.hp, Math.round(x.v * (has(u, 'rot') ? 0.5 : 1)));
        u.hp += amt;
        if (amt > 0) ev.ticks.push({ s: 'regen', amt, hp: u.hp });
      }
    }
    if (!u.alive) { this.settle(); return false; }
    if (this.turns >= this.turnCap) { this.finish('B'); return false; }
    if (u.boss && this.enrageTurn && this.turns > this.enrageTurn) { u.enrage++; ev.enrage = u.enrage; }
    const cc = u.st.find(x => STATUS[x.s].cc);
    if (cc) { ev.skip = cc.s; return false; }
    return true;
  }
  // Tur sonu: bu turda kendine verdikleri dışındaki etkilerin süresi azalır
  endTurn(u) {
    for (const x of u.st) { if (x.fresh) x.fresh = false; else x.t--; }
    u.st = u.st.filter(x => x.t > 0);
    this.syncHp(u);
  }

  // ---- Hamle doğrulama ----
  usable(u) {
    return u.skills.filter(s => s.cd === 0 && this.affords(u, s.id) && this.targetsFor(u, s.id).length > 0).map(s => s.id);
  }
  // Mana bedeli (mpc taşımayan birimde her yetenek bedelsiz)
  costOf(u, id) { return (u.mpc && u.mpc[id]) || 0; }
  affords(u, id) { return !(u.maxMp > 0) || this.costOf(u, id) <= u.mp; }
  // Seçilebilir hedefler (hedef gerektirmeyen yeteneklerde [0])
  targetsFor(u, skillId) {
    const S = SKILLS[skillId];
    if (S.target === 'enemy') {
      const foes = this.foesFor(u, S), taunters = foes.filter(f => has(f, 'taunt'));
      // Kışkırtılmış (Provoke): yalnız onu kışkırtan birime vurabilir (o yaşıyor ve hedef olabiliyorsa)
      const pv = u.st.find(x => x.s === 'provoked'), by = pv && foes.find(f => f.id === pv.by);
      if (by) return [by.id];
      return (taunters.length ? taunters : foes).map(f => f.id);
    }
    if (S.target === 'ally') return this.allies(u).map(a => a.id);
    if (S.target === 'dead') return this.dead(u).map(a => a.id);
    return this.foesFor(u, S).length ? [0] : [];
  }
  validate(u, choice) {
    if (!Array.isArray(choice) || typeof choice[0] !== 'string') throw new BattleError('bad-choice');
    const [skillId, targetId = 0] = choice;
    const sk = u.skills.find(s => s.id === skillId);
    if (!sk) throw new BattleError('skill-not-equipped');
    if (sk.cd > 0) throw new BattleError('skill-on-cooldown');
    if (!this.affords(u, skillId)) throw new BattleError('no-mana');
    const legal = this.targetsFor(u, skillId);
    if (!legal.length) throw new BattleError('no-target');
    if (legal[0] === 0) return [skillId, 0];
    if (!legal.includes(targetId)) throw new BattleError('bad-target');
    return [skillId, targetId];
  }

  // ---- Yapay zekâ (yaratıklar ve oyuncunun oto modu) ----
  // Sürüm 2 (v2) eklemeleri yalnızca yeni etkileri taşıyan yetenekleri ilgilendirir; öbür yeteneklerde seçim ve zar sırası
  // sürüm 1 ile aynıdır (yaratıkların ve yolu olmayan kahramanların savaşı değişmez).
  aiOk(u, id, allies, foes) {
    const S = SKILLS[id];
    if (S.need === 'dot') { const f = S.fx.find(x => x.k === 'det'), legal = S.target === 'enemy' ? this.targetsFor(u, id).map(t => this.get(t)) : foes; if (!legal.some(t => f.s.some(s => has(t, s)))) return false; }
    if (S.fx.some(f => f.k === 'guard') && S.target === 'ally' && !allies.some(a => a !== u && !has(a, 'guard'))) return false;
    return true;
  }
  ai(u, rand) {
    const v2 = this.v >= 2, allies = this.allies(u), foes = this.foes(u);
    const ids = v2 ? this.usable(u).filter(id => this.aiOk(u, id, allies, foes)) : this.usable(u);
    const ratio = a => a.hp / a.maxHp;
    const byCd = (a, b) => SKILLS[b].cd - SKILLS[a].cd;
    const of = kind => ids.filter(id => kindOf(SKILLS[id]) === kind).sort(byCd);
    const rev = of('revive')[0];
    if (rev) return [rev, this.dead(u)[0].id];
    const low = [...allies].sort((a, b) => ratio(a) - ratio(b))[0];
    const hurt = a => a.st.some(x => !STATUS[x.s].good); // zararlı etki taşıyor
    for (const id of of('heal')) {
      const S = SKILLS[id];
      if (v2 && S.path && S.fx.some(f => f.k === 'cleanse')) { // arındıran yol şifası: sırasını kaybeden ya da zararlı etki taşıyan yoldaş da gerekçedir
        const sick = allies.filter(hurt).sort((a, b) => ratio(a) - ratio(b))[0];
        if (sick && S.target === 'ally' && ratio(low) >= 0.6) return [id, (allies.find(a => a.st.some(x => STATUS[x.s].cc)) || sick).id];
        if (sick && S.target !== 'ally' && (S.target === 'self' ? hurt(u) : allies.filter(hurt).length >= 2)) return [id, 0];
      }
      if (S.target === 'self') { if (ratio(u) < 0.55) return [id, 0]; continue; }
      if (S.target === 'ally') { if (ratio(low) < 0.6) return [id, low.id]; continue; }
      if (ratio(low) < 0.45 || allies.filter(a => ratio(a) < 0.75).length >= 2) return [id, 0];
    }
    for (const id of of('buff')) {
      if (v2 && SKILLS[id].target === 'ally' && SKILLS[id].fx.some(x => x.k === 'guard')) { // himaye: kendisi dışındaki en yaralı, himayesiz yoldaşa
        return [id, allies.filter(a => a !== u && !has(a, 'guard')).sort((a, b) => ratio(a) - ratio(b))[0].id];
      }
      const S = SKILLS[id], f = S.fx.find(x => x.k === 'st' || x.k === 'shield');
      const s = f ? (f.k === 'shield' ? 'shield' : f.s) : null;
      const who = S.target === 'self' ? [u] : allies;
      if (s && who.every(a => has(a, s))) continue;
      if (S.target === 'ally') return [id, (who.find(a => !has(a, s)) || low).id];
      return [id, 0];
    }
    // fırsat vuruşu (dmg.vs) ve patlatma (det): koşulu sağlayan hedef var mı
    const vsOf = id => { const S = SKILLS[id], f = S.fx.find(x => (x.k === 'dmg' && x.vs) || x.k === 'det'); return f ? (f.k === 'det' ? f.s : f.vs.s) : null; };
    const ripe = (id, t) => vsOf(id).some(s => has(t, s));
    const pickTarget = id => {
      let legal = this.targetsFor(u, id).map(t => this.get(t));
      if (v2 && vsOf(id) && legal.some(t => ripe(id, t))) legal = legal.filter(t => ripe(id, t)); // koşulu sağlayan hedefler arasından
      if (legal.length === 1) return legal[0].id;
      if (this.bdw) { const m = legal.find(t => t.mon); if (m) { if (rand() < this.bdw.monPick) return m.id; legal = legal.filter(t => !t.mon); if (legal.length === 1) return legal[0].id; } } // anıt savaşı: arada anıta vurur
      return (rand() < (u.focus ?? 0.65) ? [...legal].sort((a, b) => a.hp - b.hp)[0] : legal[Math.floor(rand() * legal.length)]).id;
    };
    let attacks = of('attack').filter(id => SKILLS[id].cd > 0);
    if (v2 && attacks.some(vsOf)) { // koşulu şu an sağlanan fırsat vuruşu öne, sağlanmayan sona (öbürlerinin sırası değişmez)
      const rank = id => { if (!vsOf(id)) return 1; const S = SKILLS[id]; return (S.target === 'enemy' ? this.targetsFor(u, id).map(t => this.get(t)) : foes).some(t => ripe(id, t)) ? 0 : 2; };
      attacks = attacks.map((id, i) => [id, rank(id), i]).sort((a, b) => a[1] - b[1] || a[2] - b[2]).map(x => x[0]);
    }
    for (const id of attacks) {
      const S = SKILLS[id], area = S.target === 'enemies' || S.target === 'random';
      if (area && foes.length < 2 && attacks.some(x => SKILLS[x].target === 'enemy')) continue;
      if (v2 && S.fx.some(f => f.k === 'strip') && !S.fx.some(f => f.k === 'dmg' && f.m >= 1) && !foes.some(e => e.st.some(x => STATUS[x.s].good && x.t < STRIP_MAX_T))) continue; // sökülecek güçlendirme yok
      if (!S.fx.some(f => f.k === 'dmg')) { // saf zayıflatma: herkes zaten etkilenmişse atla
        const f = S.fx.find(x => x.k === 'st');
        if (f && foes.every(e => has(e, f.s))) continue;
      }
      return [id, S.target === 'enemy' ? pickTarget(id) : 0];
    }
    const basic = u.skills[0].id;
    return [basic, SKILLS[basic].target === 'enemy' ? pickTarget(basic) : 0];
  }
  // Oyuncunun oto modu: kurallı yapay zekâ yerine bir hamle ileriye bakan değerlendirici (smart). Yaratıkların ve yapay zekâ
  // müttefiklerinin seçimi (ai) değişmez; oyuncu hamleleri zaten sunucuda doğrulandığı için tekrar oynatma etkilenmez.
  // calm: oyuncu biriminin üst üste vurmadan geçirdiği turlar (şifa/güçlendirme). Üçüncüde vuran yeteneğe zorlanır: tek başına
  // şifacı, gelen hasarı iyileştirerek sonsuza dek oyalanmasın (tur sınırına takılıp kaybetmesin). Yalnızca oto seçimi etkiler.
  autoChoice() {
    const u = this.pending, c = this.potChoice(u) || this.smart(u) || this.ai(u, this.autoRand);
    if (u && c && !Object.hasOwn(POT_IDS, c[0])) { const hurts = SKILLS[c[0]].fx.some(f => f.k === 'dmg' || f.k === 'det'); this.calm = { ...this.calm, [u.id]: hurts ? 0 : ((this.calm || {})[u.id] || 0) + 1 }; }
    return c;
  }

  // ---- Akıllı oto: her yasal (yetenek, hedef) çifti savaşın bir kopyasında denenir, sonuç puanlanır ----
  // Kopyada zar hep ortadan gelir (0,5): hasar ortalama, %50'den düşük olasılıklı kritik ve etkiler tutmaz ("beklenen" sonuç).
  // Puan: düşmana verilen hasar ve öldürme (tehdidine göre ağırlıklı), düşmana tutan zararlı etkiler, yoldaşların canı ve
  // ölümü (en düşük canlı yoldaş daha ağır basar), yoldaşa verilen güçlendirme/kalkan, hız çubuğu değişimi; uzun bekleme
  // süreli yeteneği boşa harcamak küçük bir eksi alır. Bir insanın düşüneceği gibi: ölecek olanı bitir, can düşükse iyileştir,
  // tehlikeli düşmanı sersemlet, gereksiz yere büyük yeteneği yakma.
  fork() {
    const b = Object.create(Battle.prototype);
    Object.assign(b, this);
    b.units = this.units.map(x => ({ ...x, st: x.st.map(y => ({ ...y })), skills: x.skills.map(k => ({ ...k })) }));
    b.events = []; b.kills = [...this.kills]; b.rand = () => 0.5; b.pending = null;
    if (this.bdw) b.bdw = { ...this.bdw, pts: { ...this.bdw.pts }, dmg: { ...this.bdw.dmg } };
    return b;
  }
  worth(b, me) {
    const side = me.side, foes = b.units.filter(x => x.side !== side && x.wave === b.wave), mine = b.units.filter(x => x.side === side);
    const thr = x => (x.atk || 0) + (x.mag || 0) + (x.spd || 0) * 0.5, top = Math.max(1, ...foes.map(thr));
    let v = 0;
    for (const f of foes) {
      const w = 0.6 + 0.4 * thr(f) / top + (f.boss ? 0.3 : 0);
      if (!f.alive) { v += 2.2 * w; continue; }
      v += (1 - f.hp / f.maxHp) * 1.6 * w;
      for (const x of f.st) { const I = STATUS[x.s]; if (!I || I.good) continue; v += (I.cc ? 0.55 : x.v ? Math.min(0.5, x.v * x.t / f.maxHp) : 0.12) * Math.min(3, x.t) * w * 0.5; }
      for (const x of f.st) if (STATUS[x.s]?.good) v -= 0.08 * Math.min(3, x.t);
      v -= (f.tm / TM_FULL) * 0.25 * w;
    }
    const low = Math.min(...mine.filter(x => x.alive).map(x => x.hp / x.maxHp), 1);
    for (const a of mine) {
      if (!a.alive) { v -= 2.6; continue; }
      const r = a.hp / a.maxHp;
      v += r * 1.4 + (r < 0.35 ? r * 1.2 : 0);
      for (const x of a.st) { const I = STATUS[x.s]; if (!I) continue; if (I.good) v += (x.s === 'shield' ? Math.min(0.6, x.v / a.maxHp) : 0.1) * Math.min(3, x.t); else v -= (I.cc ? 0.4 : 0.12) * Math.min(3, x.t); }
      v += (a.tm / TM_FULL) * 0.2;
    }
    if (b.over === side) v += 50; else if (b.over) v -= 50;
    return v + (low < 0.3 ? -0.5 : 0);
  }
  smart(u) {
    if (!u || this.over) return null;
    const allies = this.allies(u), foes = this.foes(u), v2 = this.v >= 2;
    let ids = this.usable(u).filter(id => !v2 || this.aiOk(u, id, allies, foes));
    if (this.v >= 3 && (this.calm?.[u.id] || 0) >= 2) { const hit = ids.filter(id => SKILLS[id].fx.some(f => f.k === 'dmg' || f.k === 'det')); if (hit.length) ids = hit; }
    if (!ids.length) return null;
    const base = this.worth(this, u);
    let best = null, bs = -Infinity;
    for (const id of ids) for (const t of this.targetsFor(u, id)) {
      const sim = this.fork(), su = sim.get(u.id);
      try { sim.perform(su, id, t); } catch { continue; }
      const S = SKILLS[id], c = this.costOf(u, id);
      // mana: bedelin havuza oranı kadar küçük bir eksi (gereksiz yere pahalı yeteneği yakmasın; mana alanı yoksa 0)
      // v9 (20 Kas, kullanıcı: 'oto en yüksek hasarı önce versin'): vuran yeteneğe bekleme/mana eksisi yok; aynı puanda daha çok hasar veren seçilir.
      // Eksi büyük canlı hedefte (boss) hasar payını bastırıp otoyu temel saldırıya itiyordu (oyun testi: hamlelerin %50–80'i temel saldırı).
      const hits = this.v >= 9 && S.fx.some(f => f.k === 'dmg' || f.k === 'det');
      const s = this.worth(sim, u) - base - (hits ? -1e-7 * sim.events.reduce((a, e) => a + (e.fx || []).reduce((x, f) => x + (f.k === 'dmg' && f.amt > 0 ? f.amt : 0), 0), 0) : (S.cd || 0) * 0.015 + (c && u.maxMp > 0 ? 0.6 * c / u.maxMp : 0));
      if (s > bs + 1e-9) { bs = s; best = [id, t]; }
    }
    return best;
  }

  // ---- Hamle ----
  perform(u, skillId, targetId) {
    const S = SKILLS[skillId];
    u.skills.find(s => s.id === skillId).cd = S.cd;
    const ev = { t: 'skill', u: u.id, skill: skillId, target: targetId, fx: [] };
    if (u.maxMp > 0) { u.mp = Math.max(0, u.mp - this.costOf(u, skillId)); ev.mp = u.mp; }
    this.events.push(ev);
    let targets;
    if (S.target === 'enemy' || S.target === 'ally' || S.target === 'dead') targets = [this.get(targetId)];
    else if (S.target === 'enemies') { // share: düşmanların yalnız bu payı (yukarı yuvarlanır) rastgele seçilir (toplu zayıflatmalar %60)
      targets = this.foesFor(u, S);
      if ((S.share || S.pick) && targets.length > 1) { const k = S.pick ? Math.min(S.pick, targets.length) : Math.max(1, Math.ceil(targets.length * S.share)), pool = [...targets]; targets = []; while (targets.length < k) targets.push(pool.splice(Math.floor(this.rand() * pool.length), 1)[0]); }
    }
    else if (S.target === 'allies') targets = this.allies(u);
    else if (S.target === 'self') targets = [u];
    else targets = []; // random: vuruş başına seçilir
    const hit = new Set(targets);
    for (const f of S.fx) this.applyFx(u, S, f, targets, hit, ev);
    this.settle();
  }

  applyFx(u, S, f, targets, hit, ev) {
    // Güç Artışı (strUp): saldırıya düz ekleme · Atak Kırığı (weakP): yalnız fiziksel (saldırı tabanlı) hasarı v kadar kısar
    const E = elemOf(S), ev2 = E ? (u[E] || 0) : 0; // Alev/Yıldırım Hasarı (eşya)
    const power = S.sc === 'mag' ? (E ? 0.8 * u.mag + ev2 : u.mag) * atkMod(u) : (u.atk + stv(u, 'strUp', 0)) * atkMod(u) * (1 - stv(u, 'weakP', 0.2));
    const group = f.to === 'self' ? [u] : f.to === 'allies' ? this.allies(u) : f.to === 'foes' ? this.foes(u) : [...hit];
    if (f.k === 'dmg') {
      const HE = this.v >= 8 && !f.el ? hitElOf(S) : null;
      if (HE) f = { ...f, hel: HE }; // v8: yeteneğin ağaç elementi (yalnız zayıflık)
      const hits = f.hits || 1;
      if (S.target === 'random') {
        for (let i = 0; i < hits; i++) {
          const foes = this.foesFor(u, S);
          if (!foes.length) break;
          const t = foes[Math.floor(this.rand() * foes.length)];
          hit.add(t);
          this.damage(u, t, power, S.sc === 'mag' ? { ...f, magic: 1 } : f, ev);
        }
      } else for (const t of targets) for (let i = 0; i < hits && t.alive; i++) this.damage(u, t, power, S.sc === 'mag' ? { ...f, magic: 1 } : f, ev);
    } else if (f.k === 'st') {
      const info = STATUS[f.s];
      for (const t of group) {
        if (!t.alive) continue;
        let c = f.c;
        if (!info.good) c += u.mods.debuffAcc;
        if (f.pvpc !== undefined && t.cls) c = f.pvpc; // PvP'de (hedef kahraman) ayrı şans
        if (f.s === 'stun' && E === 'bolt' && u.mag > 0) c += (this.v >= 9 ? Math.min(0.1, 0.3 * ev2 / u.mag) : Math.min(0.15, 0.4 * ev2 / u.mag)) + (u.lock || 0); // Yıldırım Hasarı kilidi artırır (v9: en çok +10 puan, 20 Kas kullanıcı: 'biraz düşür'; v8 ve öncesi +15) + Fırtına takısının kilit şansı
        if (info.cc) c = (c + u.mods.ccAcc) * (1 - (t.ccRes || 0));
        if (f.s === 'stun' && has(t, 'resUp') && S.fx.some(x => x.el === 'bolt')) c *= 0.75; // Büyü Direnci: yıldırım kilidi %25 az tutar
        if (c < 1 && this.rand() >= c) { ev.fx.push({ k: 'resist', u: t.id, s: f.s }); continue; }
        if (!info.good) { // Sakınma: tutacak olan ilk zararlı etkiyi savuşturur ve harcanır
          const w = t.st.find(x => x.s === 'ward');
          if (w) { t.st = t.st.filter(x => x !== w); ev.fx.push({ k: 'ward', u: t.id, s: f.s }); continue; }
        }
        let v = 0;
        if (f.s === 'burn') v = Math.max(1, Math.round(power * 0.35 * (1 + u.mods.burnPct) * (E === 'fire' && u.mag > 0 ? 1 + ev2 / u.mag : 1))); // Alev Hasarı yanığı ayrıca büyütür
        else if (f.s === 'poison') v = Math.max(1, Math.round(power * 0.25 * (1 + u.mods.dotPct)));
        else if (f.s === 'bleed') v = Math.max(1, Math.round(power * 0.3 * (1 + u.mods.dotPct)));
        else if (f.s === 'regen') v = Math.round(u.mag * 0.4 + t.maxHp * 0.04);
        else if (f.s === 'hpUp' || f.s === 'hpDown') v = f.p || 0.2; // azami can payı (syncHp uygular)
        if (f.p !== undefined) v = f.p; // etkinin açık değeri (Güç Artışı +15, Sağlamlık %40, sabit yenilenme 100…)
        this.setStatus(t, { s: f.s, t: f.t, v, fresh: t === u, ...(f.s === 'provoked' ? { by: u.id } : {}) });
        ev.fx.push({ k: 'st', u: t.id, s: f.s, t: f.t });
      }
    } else if (f.k === 'heal') {
      for (const t of group) {
        if (!t.alive) continue;
        const raw = ((f.m || 0) * u.mag + (f.pct || 0) * t.maxHp + (f.flat || 0)) * (1 + u.mods.healPct) * (has(t, 'rot') ? 0.5 : 1);
        const amt = Math.min(t.maxHp - t.hp, Math.round(raw));
        t.hp += amt;
        ev.fx.push({ k: 'heal', u: t.id, amt, hp: t.hp });
      }
    } else if (f.k === 'shield') {
      const v = Math.round((f.m ? u.mag * f.m : u.maxHp * f.pctSelf) * (1 + u.mods.shieldPct));
      for (const t of group) {
        if (!t.alive) continue;
        this.setStatus(t, { s: 'shield', t: f.t, v, fresh: t === u });
        ev.fx.push({ k: 'st', u: t.id, s: 'shield', t: f.t, v });
      }
    } else if (f.k === 'tm') {
      for (const t of group) {
        if (!t.alive) continue;
        t.tm = Math.max(0, Math.min(2 * TM_FULL - 1, t.tm + Math.round(f.v * TM_FULL)));
        ev.fx.push({ k: 'tm', u: t.id, v: f.v });
      }
    } else if (f.k === 'cleanse') {
      for (const t of group) {
        if (!t.alive) continue;
        const n = t.st.length;
        t.st = t.st.filter(x => STATUS[x.s].good);
        if (t.st.length !== n) ev.fx.push({ k: 'cleanse', u: t.id });
      }
    } else if (f.k === 'revive') {
      for (const t of targets) {
        if (t.alive) continue;
        t.alive = true; t.hp = Math.max(1, Math.round(t.maxHp * f.pct)); t.st = []; t.tm = 0;
        ev.fx.push({ k: 'revive', u: t.id, hp: t.hp });
      }
    } else if (f.k === 'guard') { // himaye: hedefin aldığı hasarın bir kısmını kullanan üstlenir (kendine verilemez)
      for (const t of group) {
        if (!t.alive || t === u) continue;
        this.setStatus(t, { s: 'guard', t: f.t, v: f.share, by: u.id, fresh: false });
        ev.fx.push({ k: 'st', u: t.id, s: 'guard', t: f.t, by: u.id });
      }
    } else if (f.k === 'det') { // patlatma: süren hasarın kalan turları × m hemen verilir (süren hasar gibi kalkanı ve katsayıları aşar)
      for (const t of group) {
        if (!t.alive) continue;
        const dots = t.st.filter(x => f.s.includes(x.s));
        if (!dots.length) continue;
        const amt = Math.min(t.hp, Math.max(1, Math.round(dots.reduce((a, x) => a + x.v * x.t, 0) * f.m)));
        t.st = t.st.filter(x => !dots.includes(x));
        t.hp -= amt;
        const killed = t.hp <= 0;
        ev.fx.push({ k: 'det', u: t.id, s: dots.map(x => x.s), amt, killed, hp: t.hp });
        if (killed) { this.kill(t); this.onKill(u, ev); }
      }
    } else if (f.k === 'mpBurn') { // mana yakma: hedefin manasından n silinir (manası olmayan birime etkisiz)
      for (const t of group) if (t.alive && t.maxMp > 0) { const n = Math.min(t.mp || 0, f.n); t.mp = (t.mp || 0) - n; ev.fx.push({ k: 'mpBurn', u: t.id, n }); }
    } else if (f.k === 'purge') { // belirli güçlendirmeleri siler (Parasite: can artışları)
      for (const t of group) { if (!t.alive) continue; const gone = t.st.filter(x => f.s.includes(x.s)); if (gone.length) { t.st = t.st.filter(x => !gone.includes(x)); ev.fx.push({ k: 'strip', u: t.id, s: gone.map(x => x.s) }); this.syncHp(t); } }
    } else if (f.k === 'strip') { // sökme: önce Sakınma, sonra en eski güçlendirmeler; n tanesi silinir (boss evresinin kalıcı öfkesi hariç)
      for (const t of group) {
        if (!t.alive) continue;
        const good = t.st.filter(x => STATUS[x.s].good && x.t < STRIP_MAX_T);
        const gone = [...good.filter(x => x.s === 'ward'), ...good.filter(x => x.s !== 'ward')].slice(0, f.n);
        if (!gone.length) continue;
        t.st = t.st.filter(x => !gone.includes(x));
        ev.fx.push({ k: 'strip', u: t.id, s: gone.map(x => x.s) });
      }
    }
  }
  setStatus(t, x) {
    if (x.s === 'defDown') t.st = t.st.filter(y => y.s !== 'armorUp'); // savunma kırıcı etki Zırh'ı siler (geri gelmez)
    const old = t.st.find(y => y.s === x.s);
    if (!old) { t.st.push(x); return; }
    old.t = Math.max(old.t, x.t); old.v = Math.max(old.v, x.v); old.fresh = x.fresh;
    if (x.by !== undefined) old.by = x.by;
  }
  // Öldüren birimin pasifi (tmKill): sıra çubuğu ilerler
  onKill(u, ev) {
    if (!u.mods.tmKill || !u.alive) return;
    u.tm = Math.min(2 * TM_FULL - 1, u.tm + Math.round(u.mods.tmKill * TM_FULL));
    ev.fx.push({ k: 'tm', u: u.id, v: u.mods.tmKill });
  }

  damage(u, t, power, f, ev) {
    if (!this.bdw || !t.mon) return this.hurt(u, t, power, f, ev);
    const h0 = t.hp, r = this.hurt(u, t, power, f, ev);
    this.bdw.dmg[u.side] += Math.max(0, h0 - Math.max(0, t.hp)); // anıta verilen hasar tarafa yazılır
    return r;
  }
  hurt(u, t, power, f, ev) {
    // Sağlamlık (defUp) yalnız fiziksel hasara işler; büyü hasarında hedefin savunma artışı sayılmaz
    const dm = has(t, 'defUp') ? (f.magic ? 1 : 1 + stv(t, 'defUp', 0.4)) * (has(t, 'defDown') ? 0.6 : 1) : defMod(t);
    // Zırh (armorUp, Güçlendirici; 19 Kas): fiziksel vuruşta hedefin savunmasına düz eklenir
    // v6 (kullanıcı 19 Kas, KO mantığı): Büyücünün büyü vuruşu savunmayı (AC) yok sayar; yalnız element ve büyü direnci keser
    const ignAC = f.magic && u.cls === 'mage' && this.v >= 6;
    const def = (t.def + (f.magic ? 0 : stv(t, 'armorUp', 0))) * dm * (ignAC ? 1 - MAGE_AC_IGNORE : 1) * (1 - (f.pierce || 0)) * (1 - Math.min(COEF.penCap, u.pen || 0));
    const crit = this.rand() < u.crit + (f.crit || 0) + (has(u, 'critUp') ? 0.25 : 0);
    const K = K_DEF + K_LVL * ((u.lvl || 1) - 1); // savunma seviyeyle büyüdüğü için eşik de büyür; yoksa üst seviyede savaşlar uzar
    let dmg = power * f.m * (K / (K + def)) * (0.95 + this.rand() * 0.1);
    if (crit) dmg *= u.critDmg;
    if (f.exec && t.hp / t.maxHp < f.exec.below) dmg *= 1 + f.exec.bonus;
    if (has(t, 'mark')) dmg *= 1.2;
    const wEl = f.el || (this.v >= 8 && !t.cls ? f.hel || (f.magic ? null : WFX_RES[u.wfx]) || null : null), weak = !!(wEl && t.weak === wEl);
    if (weak) dmg *= WEAK_MULT;
    const combo = !!(f.vs && f.vs.s.some(s => has(t, s))); // fırsat vuruşu: hedef aranan etkilerden birini taşıyor
    if (combo) dmg *= 1 + f.vs.bonus;
    if (f.wt && u.wt === f.wt.k) dmg *= 1 + f.wt.bonus;     // silah ustalığı: yeteneğin istediği silah sınıfı kuşanılmış
    if (f.el && u.mods.elPct) dmg *= 1 + u.mods.elPct;
    if (f.el && f.el !== 'ice' && has(t, 'resUp')) dmg *= 1 - stv(t, 'resUp', 0.2); // Büyü Direnci: ateş ve yıldırım hasarı azalır
    const R = t.res;
    let cut = R ? Math.min(COEF.resCap, (R[u.wt] || 0) + (f.el ? R[f.el] || 0 : 0) + (f.magic ? R.magic || 0 : 0)) : 0; // magic: büyü hasarı direnci (Holy Animor)
    if (cut > 0 && u.mods.cutIgnore) cut *= 1 - u.mods.cutIgnore; // saldıranın pasifi hedefin katsayısını kısmen yok sayar
    if (cut > 0) dmg *= 1 - cut;
    dmg *= 1 - t.mods.dr;
    if (u.enrage) dmg *= 1 + 0.5 * u.enrage;
    dmg = Math.max(1, Math.round(dmg));
    // Himaye: hasarın bir kısmı koruyana geçer (onun hasar azaltması ve kalkanı işler); kalanı hedefe vurur
    const gd = t.st.find(x => x.s === 'guard'), G = gd ? this.get(gd.by) : null;
    let moved = null;
    if (G && G.alive && G !== t) {
      const part = Math.round(dmg * gd.v);
      if (part > 0) { dmg -= part; moved = { G, amt: Math.max(1, Math.round(part * (1 - G.mods.dr))) }; }
    }
    let abs = 0;
    const sh = t.st.find(x => x.s === 'shield');
    if (sh) { abs = Math.min(sh.v, dmg); sh.v -= abs; if (sh.v <= 0) t.st = t.st.filter(x => x !== sh); }
    const taken = Math.min(t.hp, dmg - abs);
    t.hp -= taken;
    let killed = t.hp <= 0;
    ev.fx.push({ k: 'dmg', u: t.id, amt: dmg, abs, crit, killed, hp: t.hp, weak, ...(cut > 0 ? { cut } : {}), ...(combo ? { combo: true } : {}) });
    if (moved) {
      const g = moved.G, gs = g.st.find(x => x.s === 'shield');
      let ga = 0;
      if (gs) { ga = Math.min(gs.v, moved.amt); gs.v -= ga; if (gs.v <= 0) g.st = g.st.filter(x => x !== gs); }
      g.hp -= Math.min(g.hp, moved.amt - ga);
      const gk = g.hp <= 0;
      ev.fx.push({ k: 'guard', u: g.id, for: t.id, amt: moved.amt, abs: ga, killed: gk, hp: g.hp });
      if (gk) { this.kill(g); this.onKill(u, ev); }
    }
    const steal = (f.steal || 0) + u.mods.steal;
    if (steal > 0 && taken > 0 && u.alive) {
      const amt = Math.min(u.maxHp - u.hp, Math.round(taken * steal * (has(u, 'rot') ? 0.5 : 1)));
      if (amt > 0) { u.hp += amt; ev.fx.push({ k: 'heal', u: u.id, amt, hp: u.hp }); }
    }
    // MP Recovery (eşya mpRec): verilen hasarın payı kadar mana döner
    if (u.mpRec > 0 && taken > 0 && u.alive && u.maxMp > 0 && u.mp < u.maxMp) {
      u.mp = Math.min(u.maxMp, u.mp + Math.max(1, Math.round(taken * u.mpRec)));
      if (ev.u === u.id) ev.mp = u.mp;
    }
    // Set etkisi (items.js SET_FX): kritik vuruş hedefi yakabilir. Zar yalnızca etkisi olan birimde atılır (eski kayıtlar aynı kalır).
    if (crit && !killed && u.mods.critBurn > 0 && this.rand() < u.mods.critBurn) {
      this.setStatus(t, { s: 'burn', t: 2, v: Math.max(1, Math.round(power * 0.35 * (1 + u.mods.burnPct))), fresh: false });
      ev.fx.push({ k: 'st', u: t.id, s: 'burn', t: 2 });
    }
    // Silah efekti (v5, items.js WEAPON_FX): vurulan hasarın %1'i kadar tek seferlik ek hasar; türü efektin adı, hedefin
    // aynı adlı direnci azaltır. Birikmez, süresi yoktur, zar atılmaz.
    // pdmg: eşyanın sabit zehir hasarı (items.js SPECIAL, ör. Raptor artı başına 10) aynı vuruşa eklenir.
    if (!killed && taken > 0 && u.wfx && this.v >= 5) {
      const rs = Math.min(COEF.resCap, t.res?.[WFX_RES[u.wfx] || u.wfx] || 0), extra = Math.min(t.hp, Math.max(1, Math.round((taken * WFX_PCT + (u.pdmg || 0)) * (1 - rs))));
      t.hp -= extra; killed = t.hp <= 0;
      ev.fx.push({ k: 'dmg', u: t.id, amt: extra, abs: 0, crit: false, killed, hp: t.hp, el: u.wfx, efx: true, ...(rs > 0 ? { cut: rs } : {}) });
    }
    // Eski zehirli silah (yalnızca v4 kayıtları): +7 ve üstü silah isabet ettiği hedefi 2 tur zehirlerdi
    if (!killed && taken > 0 && u.venom && this.v === 4) {
      const v = Math.max(1, Math.round(power * (0.12 + 0.03 * (u.venom - 7)) * (1 + (u.mods.dotPct || 0))));
      this.setStatus(t, { s: 'poison', t: 2, v, fresh: false });
      ev.fx.push({ k: 'st', u: t.id, s: 'poison', t: 2 });
    }
    if (killed) { this.kill(t); this.onKill(u, ev); }
    else if (t.phases && t.phase < t.phases.length && t.hp / t.maxHp <= t.phases[t.phase].at) {
      const ph = t.phases[t.phase++];
      this.setStatus(t, { s: 'atkUp', t: 99, v: 0, fresh: false });
      t.st = t.st.filter(x => STATUS[x.s].good);
      for (const s of t.skills) s.cd = 0;
      ev.fx.push({ k: 'phase', u: t.id, text: ph.text });
    }
  }
  kill(t) {
    t.alive = false; t.hp = 0; t.st = [];
    if (this.bdw) { // anıt kesildi: kazanan hamle bitince (settle) anıt hasarına göre belirlenir · kahraman: karşı tarafa 1 puan, `respawn` raunt sonra döner
      if (t.mon) this.bdw.monDown = true;
      else { this.bdw.pts[t.side === 'A' ? 'B' : 'A']++; t.rise = this.bdw.round + this.bdw.respawn; }
      return;
    }
    if (t.side === 'B') this.kills.push({ mob: t.mob, rank: t.rank, lvl: t.lvl, ...(t.xr ? { xr: t.xr } : {}) }); // xr: tek kahraman dalgasında budanan yaratıkların ödül payı (solo.js)
  }
  // Ölümlerden sonra: dalga geçişi ya da savaş sonu
  // Can Artışı (hpUp): azami can, kalıcı tabanın v payı kadar artar; etki gelince can da o kadar artar, gidince azami can
  // geri iner ve can taşıyorsa kırpılır. Etkinin hangi yoldan geldiği/gittiği önemsizdir: her hamle sonunda eşitlenir.
  // Can Kaybı (hpDown, Parasite): azami can v payı kadar azalır, can yeni sınıra kırpılır; etki bitince azami can geri gelir
  // ama kaybedilen can geri eklenmez (şifa/iksirle doldurulur).
  syncHp(u) {
    const up = u.alive ? u.st.find(y => y.s === 'hpUp') : null, dn = u.alive ? u.st.find(y => y.s === 'hpDown') : null;
    const cu = u.hpb || 0, cd = u.hpd || 0, base = u.maxHp - cu + cd;
    const amt = (x, b) => Math.round(x.v >= 1 ? x.v : b * x.v); // v ≥ 1: düz can (+250), v < 1: pay
    const wu = up ? amt(up, base) : 0, wd = dn ? amt(dn, base) : 0;
    if (wu === cu && wd === cd) return;
    u.maxHp = base + wu - wd; u.hpb = wu; u.hpd = wd;
    if (wu > cu) u.hp += wu - cu;
    u.hp = Math.min(u.hp, u.maxHp);
  }
  settle() {
    for (const u of this.units) if (u.hpb || u.hpd || u.st.some(y => y.s === 'hpUp' || y.s === 'hpDown')) this.syncHp(u);
    if (this.over) return;
    if (this.bdw) { if (this.bdw.monDown) this.finish(this.bdwWinner(true)); return; } // anıt savaşında taraflar dirilir: yok olma bitirmez
    if (!this.alive('A').length) return this.finish('B');
    if (!this.alive('B').length) {
      if (this.wave + 1 < this.waves.length) this.spawnWave();
      else this.finish('A');
    }
  }
  finish(w) { this.over = w; this.pending = null; this.events.push({ t: 'end', winner: w }); }

  summary() {
    const boss = this.units.find(u => u.boss);
    return {
      winner: this.over, turns: this.turns, wave: this.wave,
      deaths: this.units.filter(u => u.side === 'A' && !u.alive).length,
      kills: this.kills,
      hpFrac: (() => { const a = this.units.filter(u => u.side === 'A'), mx = a.reduce((s, u) => s + u.maxHp, 0); return mx ? Math.round(1000 * a.reduce((s, u) => s + (u.alive ? Math.max(0, u.hp) : 0), 0) / mx) / 1000 : 0; })(),
      bossDamage: boss ? 1 - boss.hp / boss.maxHp : 0,
      ...(this.bdw ? { bdw: { pts: { ...this.bdw.pts }, dmg: { ...this.bdw.dmg }, round: this.bdw.round, monDown: this.bdw.monDown } } : {}),
      ...this.potsUsed(),
    };
  }
  // Oyuncu tarafının içtiği iksirler (sunucu bunları sayaçtan düşer); iksirsiz savaşta alan yazılmaz
  potsUsed() {
    const us = this.units.filter(u => u.side === 'A' && u.potHp !== undefined);
    return us.length ? { pots: { hp: us.reduce((a, u) => a + u.usedHp, 0), mp: us.reduce((a, u) => a + u.usedMp, 0) } } : {};
  }
}

// Sunucu tarafı: oyuncunun gönderdiği hamle listesini aynı tohumla yeniden oynatır.
// sink(battle, olaylar): verilirse her ilerleyişin olayları ona da aktarılır (savaş raporu: report.js); sonucu etkilemez.
export function replay(setup, actions, sink) {
  if (!Array.isArray(actions) || actions.length > setup.turnCap + 4 * POT.cap) return { ok: false, reason: 'bad-actions' }; // iksirler ayrı hamle sayılır
  const b = new Battle(setup);
  let r = b.advance(), i = 0;
  if (sink) sink(b, r.events);
  try {
    while (!r.over) {
      if (i >= actions.length) return { ok: false, reason: 'incomplete' };
      r = b.advance(actions[i++]);
      if (sink) sink(b, r.events);
    }
  } catch (e) {
    if (e instanceof BattleError) return { ok: false, reason: e.code };
    throw e;
  }
  if (i !== actions.length) return { ok: false, reason: 'extra-actions' };
  return { ok: true, summary: b.summary() };
}
// Tamamen yapay zekâyla oynatır (denge simülasyonu ve testler için); hamle listesini de döndürür.
export function autoPlay(setup) {
  const b = new Battle(setup), actions = [];
  let r = b.advance();
  while (!r.over) { const c = b.autoChoice(); actions.push(c); r = b.advance(c); }
  return { summary: b.summary(), actions };
}
