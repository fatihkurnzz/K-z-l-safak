// 3D savaş sahnesi: shared/battle.js motorunun olaylarını oynatır (animasyon, kamera, savaş arayüzü)
// ve oyuncunun hamlelerini kaydeder. Sonucu hesaplamaz; hamle listesi sunucuya gider, ödülü sunucu belirler.
// Efektler tabloyla sürülür (fx-table.js): olay türü → efekt adı, yeteneğin elementi, vuranın silahı. Çizen taraf fx.js'tir.
import { WEAPON_FX as WFX } from '../shared/items.js';
import { A as A11Y } from './a11y.js';
import { THREE, camRig, clock, projectTo, floatText, pick, wait, tween, ease, burst, setHfov, setShift } from './engine3d.js';
import { view } from './orient.js';
import { play as fx, projectile, skyStrike, shockwave, elementImpact, statusHold } from './fx.js';
import { EVENT_FX, ELEMENT_FX, ANIM_FX, skillElement, fxOfTick } from './fx-table.js';
import { Battle } from '../shared/battle.js';
import { SKILLS, describe, baseActives } from '../shared/skills.js';
import { POT } from '../shared/mana.js';
import { LOADOUT_ACTIVES } from '../shared/hero.js';
import { potSvg } from './iksir.js';
import { STATUS, HERO_LOOKS, CLASSES } from '../shared/content.js';
import { MOBS } from '../shared/zones.js';
import { world, clearScene, ensureEnv, spawn, setUpdater } from './world.js';
import { svg } from './icons.js';
import { skillIcon } from './skill-icons.js';
import { SFX } from './sfx.js';
import { heroImg, mobImg } from './ui-core.js'; // 19 Kas: savaş arayüzü portreleri (sıra şeridi, kahraman çerçevesi) // savaş sesleri: olay türü, silah türü ve elemente göre (kural içermez)

const $ = s => document.querySelector(s);
const overlay = $('#overlay'), battleUI = $('#battleUI');
const ui = { auto: false, speed: A11Y.speed || 1, choose: null, selected: null, active: null, onExit: null, legal: [] };
let onTap = null;
// Bu savaşta oyuncunun yaptıkları (öğretici okur: ui-kalicilik.js 'bar' adımı) · auto: OTO açık mı
export const BT = { sk: false, pot: false, auto: false, on: false };
// Öğretici kilidi (ui-kalicilik.js doldurur): 'bar' adımında iksir içilene dek saldırı, OTO ve çıkış kapalı
export const TUTLOCK = { pot: () => false, say: null };
// OTO 10. seviyede açılır (19 Kas): ok() ui-kalicilik.js'te seviyeye bağlanır. İlk 3 savaşta OTO düğmesi hatırlatılır.
export const OTO = { lvl: 10, ok: () => true };
const OTO_HINT = 'dd_oto_hint';
function otoHint() {
  let n = 0; try { n = +localStorage.getItem(OTO_HINT) || 0; } catch { }
  if (!OTO.ok() || n >= 3 || TUTLOCK.pot()) return;
  try { localStorage.setItem(OTO_HINT, String(n + 1)); } catch { }
  document.querySelector('.oto-tip')?.remove();
  const t = document.createElement('div'); t.className = 'oto-tip'; t.innerHTML = '<b>OTO</b> açık! Dokunursan savaşı senin yerine oynar; istediğin an kapatırsın.';
  battleUI.appendChild(t); $('#bauto').classList.add('tut-pulse');
  setTimeout(() => { t.remove(); $('#bauto').classList.remove('tut-pulse'); }, 7000);
}
let curHero = null;
const potLock = () => { const u = curHero; return !!u && TUTLOCK.pot() && ((u.potHp | 0) + (u.potMp | 0)) > 0; };
const lockMsg = () => { const w = $('#bwho'); if (w) w.innerHTML = '<b style="color:#ffd36a">Önce bir iksir iç!</b> · <span>Sağdaki Can ya da Mana iksirine dokun.</span>'; $('#skills .ypots')?.classList.add('tut-pulse'); };

export function hideBattleUI() { battleUI.hidden = true; overlay.innerHTML = ''; onTap = null; ui.choose = null; ui.pickSkill = null; BT.on = false; }

// Motor birimi → 3D görünüm. Kahraman birimleri tarafını (faction) ve silah modelini (wm) kendi taşır;
// böylece meydandaki rakip parti de doğru görünür.
// Görünüm tonu (roster.js: kahramanın v alanı): iskeletli model sınıf başına tektir; aynı sınıftan ikinci kahraman renk
// tonuyla ayrışır. 0 = sınıfın özgün renkleri. Prosedürel modelde zırh, pelerin ve süs renkleri tona doğru karıştırılır;
// iskeletli modelde doku, tonun açık hâliyle çarpılır (skinned.js: model.tint).
export const HERO_TINTS = [null, 0x2f6fe0, 0x2f9a48, 0x8a48c8, 0xd9a520, 0x2a2a34];
export const tintOf = v => HERO_TINTS[v] || null;
const mixHex = (c, t, k) => { let out = 0; for (const sh of [16, 8, 0]) out |= Math.round(((c >> sh) & 255) * (1 - k) + ((t >> sh) & 255) * k) << sh; return out; };
// Irk paleti: Elentha cilalı gümüş + gök mavisi + altın; Kragmir karartılmış demir + al + altın
const RACE_PAL = { sancak: { armor: [0xc9d3e0, 0.4], cape: [0x2f62b8, 0.45], accent: [0x4f9ae8, 0.6], trim: [0xe0b84c, 0.5] }, ocak: { armor: [0x2c2624, 0.5], cape: [0x8a1a14, 0.5], accent: [0xc2321e, 0.6], trim: [0xd4a93a, 0.5] } };
function racial(L, f) { const P = RACE_PAL[f]; if (P) for (const k in P) if (L[k] !== undefined) L[k] = mixHex(L[k], P[k][0], P[k][1]); return L; }
function tinted(L, t) { for (const [k, w] of [['armor', 0.62], ['cape', 0.7], ['trim', 0.3], ['accent', 0.4]]) if (L[k] !== undefined) L[k] = mixHex(L[k], t, w); return L; }
export function unitLook(u) {
  if (u.cls) {
    const w = u.wm || {}, C = CLASSES[u.cls], t = tintOf(u.v);
    return { look: (L => (t ? tinted(L, t) : L))(racial({ ...HERO_LOOKS[u.faction || 'ocak'][u.cls] }, u.faction || 'ocak')), model: { faction: u.faction || 'ocak', ...(t ? { tint: mixHex(t, 0xffffff, 0.35) } : {}), weapon: w.weapon, shield: w.shield, ...(w.off ? { off: w.off } : {}), robe: C.armor === 'robe' || C.armor === 'chain', armorType: C.armor === 'leather' ? 'leather' : undefined, pauldrons: u.cls === 'priest', plus: w.plus || 0, fx: w.fx || null, ...(w.glb ? { glb: w.glb } : {}), ...(w.sglb ? { sglb: w.sglb } : {}), g: w.g || 0, ap: w.ap || 0, ag: w.ag || 0, hero: true, cape: u.cape || null }, tid: u.cls }; // cape: klan pelerini (yoksa kahraman pelerinsizdir)
  }
  const L = { ...MOBS[u.mob].look };
  if (u.elite) L.scale = (L.scale || 1) * 1.2;
  return { look: L, model: {}, mid: u.mob };
}

// 19 Kas (kullanıcı): kamera %20 daha yüksekten ve uzaktan (eski konum 0, 8.6, 9.0: bakış noktasına uzaklık ×1,2)
const CAM = { pos: new THREE.Vector3(0, 10.28, 10.9), look: new THREE.Vector3(0, 0.2, -0.5) };
const SCALE_HERO = 1.3, SCALE_MOB = 1.15; // savaşta kahramanlar %30, canavarlar %15 büyük (kullanıcı 19 Kas)
function moveCam(pos, look, dur) {
  const p0 = camRig.pos.clone(), l0 = camRig.look.clone(), p1 = pos.clone(), l1 = look.clone();
  return tween(dur, k => { camRig.pos.lerpVectors(p0, p1, k); camRig.look.lerpVectors(l0, l1, k); }, ease.inOut);
}
function slowmo(realSec) { clock.scale = ui.speed * 0.25; setTimeout(() => { clock.scale = ui.speed; }, realSec * 1000); }
function flashScreen() { const f = document.createElement('div'); f.className = 'flash'; document.body.appendChild(f); setTimeout(() => f.remove(), 450); }
function showBanner(text, small, side = 'A') {
  const b = document.createElement('div');
  b.className = 'banner ' + side;
  b.innerHTML = `<small></small><b></b>`;
  b.firstChild.textContent = small; b.lastChild.textContent = text;
  overlay.appendChild(b);
  setTimeout(() => b.remove(), 1500);
}

// 19 Kas: açılış ve bitiş kartları (sinematik; yalnızca sunum)
const escH = t => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
function openCard(title, waves) {
  const b = document.createElement('div'); b.className = 'bopen';
  b.innerHTML = `<i class="l"></i><small>${waves > 1 ? `${waves} dalga` : 'Tek dalga'}</small><b>${escH(title)}</b><em>Savaş başlıyor</em><i class="r"></i>`;
  overlay.appendChild(b); setTimeout(() => b.remove(), 2100);
}
function endCard(won) {
  const b = document.createElement('div'); b.className = 'bend ' + (won ? 'win' : 'lose');
  b.innerHTML = `<span class="rays"></span><b>${won ? 'Zafer' : 'Yenilgi'}</b><small>${won ? 'Düşman dize geldi' : 'Geri çekil, güçlen, yeniden dene'}</small>`;
  overlay.appendChild(b); setTimeout(() => b.remove(), 2600);
}
// Boss ad kartı: alttan kayan büyük ad, unvan, seviye ve zayıflık (yalnızca sunum)
const EL_NAME = { fire: 'Ateş', ice: 'Buz', bolt: 'Yıldırım' };
function bossCard(u) {
  const M = MOBS[u.mob], b = document.createElement('div');
  b.className = 'bosscard';
  b.innerHTML = `<i></i><small></small><b></b><em></em>`;
  b.children[1].textContent = M?.title || 'Boss';
  b.children[2].textContent = u.name;
  b.children[3].textContent = `Sv. ${u.lvl || '?'}${u.weak ? ` · Zayıflığı: ${EL_NAME[u.weak] || u.weak}` : ''}${u.phases?.length ? ` · ${u.phases.length + 1} evre` : ''}`;
  overlay.appendChild(b);
  setTimeout(() => b.classList.add('out'), 2300);
  setTimeout(() => b.remove(), 2900);
}

// setup: { party, waves, seed, enrageTurn, turnCap, restoreOnWave, lead } · timer: hamle süresi (sn, 0 = sınırsız)
// onDone(kazandı, hamleler) · onExit: oyuncu çekilirse
// coop (ortak savaş, coop.js): { me: oyuncu kimliği, getAct(i) → i. hamle (sunucudan, gelene dek bekler), putAct(i, c) → kabul edildi mi }
// Başka oyuncunun biriminin sırasında hamle sunucudan beklenir; kendi biriminde seçilen hamle sunucuya gönderilir (reddedilirse sunucununki alınır).
export function runBattle({ setup, env, title, auto = false, timer = 0, onDone, onExit, coop = null }) {
  clearScene();
  const token = world.token;
  setHfov(41); // ana üs geniş açıyla bakar; savaş kendi açısına döner
  setShift(0, view.h <= 480 ? 0.08 : 0); // telefonda sahne biraz aşağı: düşman göstergeleri başlık ve ipucu şeridinin altında kalsın
  ensureEnv(env);
  camRig.pos.set(-4, 2.2, -9.5); camRig.look.set(0, 1.2, -2.6);
  moveCam(CAM.pos, CAM.look, 1.6);
  const battle = new Battle(setup);
  const actions = [];
  const actors = new Map(); // birim kimliği → sahne aktörü
  const byId = id => actors.get(id);

  function place(u, n) {
    const x = (u.slot - (n - 1) / 2) * 1.5;
    const z = u.side === 'A' ? 2.6 + Math.abs(x) * 0.12 : -2.6 - Math.abs(x) * 0.12;
    const face = u.side === 'A' ? Math.PI : 0;
    const lk = unitLook(u); lk.look = { ...lk.look, scale: (lk.look.scale || 1) * (u.cls ? SCALE_HERO : SCALE_MOB) };
    const a = spawn({ ...u, ...lk }, x, z, face);
    a.hitbox.scale.setScalar(Math.max(1, 1.1 / a.char.scale)); // küçük yaratıkların dokunma alanı da yeterince büyük kalsın
    a.unit = u; a.home = new THREE.Vector3(x, 0.1, z); a.face = face; a.shown = u.hp; a.hold = { t: Math.random() * 0.16 };
    const hud = a.hud = document.createElement('div');
    hud.className = 'hud ' + u.side + (u.boss || u.captain ? ' boss' : '');
    hud.innerHTML = `${u.boss || u.captain ? `<b class="nm">${escH(u.name)}</b>` : ''}<i class="lv">${u.lvl}</i><div class="bars"><div class="hp"><b class="tr"></b><div></div></div>${u.maxMp > 0 ? '<div class="mp"><div></div></div>' : ''}<div class="tm"><div></div></div><div class="sts"></div></div>`;
    a.hpEl = hud.querySelector('.hp div'); a.trEl = hud.querySelector('.hp .tr'); a.tmEl = hud.querySelector('.tm div'); a.stEl = hud.querySelector('.sts'); a.mpEl = hud.querySelector('.mp div'); a.shownMp = u.mp;
    hud.onclick = () => tapUnit(a);
    overlay.appendChild(hud);
    a.char.combatTarget = 1;
    actors.set(u.id, a);
    SFX.actor(a);
    return a;
  }
  const party = battle.alive('A');
  party.forEach(u => place(u, party.length));
  const restFace = a => { a.char.root.rotation.y = a.face; };
  const hv = new THREE.Vector3();
  function syncStatus(a) {
    const key = a.unit.st.map(x => x.s + x.t).join();
    if (a.stKey === key) return;
    a.stKey = key;
    a.stEl.innerHTML = a.unit.st.map(x => `<i class="${STATUS[x.s].good ? '' : 'bad'}" title="${STATUS[x.s].name}">${STATUS[x.s].icon}</i>`).join('');
  }

  setUpdater(dt => {
    for (const a of actors.values()) {
      const u = a.unit;
      if (a.gone) continue;
      // gösterge yalnızca değiştiğinde yazılır (kare başına biçem hesabı ve metin üretimi azalır)
      const p = projectTo(a.char.headTo(hv)), hx = Math.round(p.x * 2) / 2, hy = Math.round(p.y * 2) / 2;
      if (hx !== a.hx || hy !== a.hy) { a.hx = hx; a.hy = hy; a.hud.style.transform = `translate(${hx}px, ${hy}px) translate(-50%,-100%)`; }
      const op = a.shown <= 0 && a.char.dead ? 0 : 1, hp = Math.round(1000 * Math.max(0, a.shown) / u.maxHp) / 10, tm = Math.round(Math.min(100, u.tm / 10));
      if (op !== a.hop) { a.hop = op; a.hud.style.opacity = op; }
      if (hp !== a.hhp) { a.hhp = hp; a.hpEl.style.width = hp + '%'; a.trEl.style.width = hp + '%'; a.hud.classList.toggle('low', hp < 30); }
      if (tm !== a.htm) { a.htm = tm; a.tmEl.style.width = tm + '%'; }
      if (a.mpEl) { const mp = Math.round(1000 * Math.max(0, a.shownMp) / u.maxMp) / 10; if (mp !== a.hmp) { a.hmp = mp; a.mpEl.style.width = mp + '%'; } }
      if (a === heroA) syncStat();
      if (u.alive && u.st.length) statusHold(a.char, u.st, dt, a.hold); // süren durumların izi (yanık, zehir, donma, kalkan…)
      const targetable = !!ui.choose && ui.legal.includes(u.id);
      a.hud.classList.toggle('active', ui.active === u.id);
      a.hud.classList.toggle('targetable', targetable && u.side === 'B');
      a.hud.classList.toggle('ally', targetable && u.side === 'A');
      const active = ui.active === u.id && u.alive;
      a.ring.material.color.set(active ? 0xffd36a : u.side === 'A' ? 0x6dff8a : 0xff3a2a);
      a.ring.material.opacity = active ? 0.9 : targetable ? 0.5 + Math.sin(performance.now() / 150) * 0.35 : 0;
      a.ring.rotation.y += 0.01;
    }
  });

  Object.assign(ui, { auto, choose: null, active: null, onExit, legal: [] });
  clock.scale = ui.speed;
  battleUI.hidden = false;
  const setTitle = () => {
    $('#btitle').textContent = title;
    const n = setup.waves.length, w = battle.wave;
    $('#bwave').innerHTML = `<small>${n > 1 ? 'Dalga' : 'Savaş'}</small><span>${Array.from({ length: n }, (_, i) => `<i class="${i < w ? 'done' : i === w ? 'on' : ''}"></i>`).join('')}</span><b>${w + 1}/${n}</b>`;
  };
  // Sıra şeridi: sıradaki birimler (sıra çubuğu benzetimi; hız değişikliği yok sayılır, yalnızca gösterim)
  const PORT = new Map();
  const portraitOf = u => { try { return u.side === 'A' || u.cls ? heroImg(u.cls, false, '', u.faction, u.wm) : u.mob ? mobImg(u.mob) : ''; } catch { return ''; } };
  function renderOrder() {
    const el = $('#border'); if (!el) return;
    const live = battle.units.filter(u => u.alive && byId(u.id) && !byId(u.id).gone);
    if (!live.length) { el.innerHTML = ''; el.dataset.k = ''; return; }
    const tm = new Map(live.map(u => [u.id, u.tm])), out = [];
    const cur = ui.active != null ? live.find(u => u.id === ui.active) : null;
    if (cur) out.push(cur);
    for (let g = 0; out.length < 7 && g < 600; g++) {
      let best = null; for (const u of live) if (tm.get(u.id) >= 1000 && (!best || tm.get(u.id) > tm.get(best.id))) best = u;
      if (best) { tm.set(best.id, tm.get(best.id) - 1000); out.push(best); continue; }
      for (const u of live) tm.set(u.id, tm.get(u.id) + Math.max(1, u.spd || 100));
    }
    const k = out.map(u => u.id).join();
    if (el.dataset.k === k) return; el.dataset.k = k;
    for (const u of out) if (!PORT.has(u.id)) PORT.set(u.id, portraitOf(u));
    el.innerHTML = out.map((u, i) => `<span class="bo ${u.side}${i === 0 && cur ? ' now' : ''}${u.boss ? ' boss' : ''}" title="${escH(u.name)}">${PORT.get(u.id)}<i>${u.lvl}</i></span>`).join('');
  }
  setTitle();
  if (!OTO.ok()) ui.auto = false;
  Object.assign(BT, { sk: false, pot: false, auto: ui.auto, on: true });
  renderButtons(); otoHint();
  $('#bwho').textContent = '';

  // ---- Savaş çubuğu (sürüm 12): temel saldırı + 6 yetenek yuvası + Can ve Mana iksiri; üstünde can ve mana göstergesi ----
  // Oyuncunun kahramanı (yapay zekâ müttefiki değil). Açılmamış temel yetenekler kilitli yuvada açılış seviyesiyle görünür.
  const hero = battle.units.find(x => x.side === 'A' && !x.ai && (!coop || String(x.ctl) === coop.me)) || null, heroA = hero ? byId(hero.id) : null;
  const locked = hero?.cls ? baseActives(hero.cls).filter(S => S.lvl > (hero.lvl || 1) && !hero.skills.some(k => k.id === S.id)) : [];
  let stat = $('#ystat');
  if (!stat) { stat = document.createElement('div'); stat.id = 'ystat'; battleUI.appendChild(stat); }
  stat.innerHTML = hero ? `<div class="yport">${portraitOf(hero)}<i class="ylv">${hero.lvl}</i></div><div class="ybars"><b class="ynm">${escH(hero.name)}</b><div class="yb hp"><s></s><i></i><b></b></div>${hero.maxMp > 0 ? '<div class="yb mp"><i></i><b></b></div>' : ''}</div>` : '';
  stat.hidden = !hero;
  const SB = { tr: stat.querySelector('.hp s'), hp: stat.querySelector('.hp i'), hpT: stat.querySelector('.hp b'), mp: stat.querySelector('.mp i'), mpT: stat.querySelector('.mp b'), k: '' };
  function syncStat() {
    if (!hero) return;
    const hp = Math.max(0, Math.round(heroA.shown)), mp = Math.max(0, Math.round(heroA.shownMp ?? 0)), k = hp + ':' + mp;
    if (k === SB.k) return;
    SB.k = k;
    SB.hp.style.width = SB.tr.style.width = (100 * hp / hero.maxHp) + '%'; SB.hpT.textContent = `${hp} / ${hero.maxHp}`; stat.classList.toggle('low', hp < hero.maxHp * 0.3);
    if (SB.mp) { SB.mp.style.width = (100 * mp / hero.maxMp) + '%'; SB.mpT.textContent = `${mp} / ${hero.maxMp}`; }
  }
  // usable: sıra oyuncudaysa kullanılabilir yeteneklerin listesi; değilse null (çubuk görünür ama kapalı)
  function drawBar(usable) {
    const u = hero;
    if (!u) { $('#skills').innerHTML = ''; return; }
    const turn = !!usable && battle.pending === u;
    const btn = s => {
      const d = SKILLS[s.id], ok = turn && usable.includes(s.id) && !potLock(), c = battle.costOf(u, s.id), dry = c > 0 && u.maxMp > 0 && c > u.mp;
      return `<button class="skill ${d.type === 'basic' ? 'basic' : 'act'} ${turn && ui.selected === s.id ? 'sel' : ''}" data-skill="${s.id}" ${ok ? '' : 'disabled'}><span>${skillIcon(s.id) || svg(d.anim)}</span>${s.cd ? `<em>${s.cd}</em>` : dry ? '<em class="dry">MP</em>' : ''}${c ? `<i class="mpc">${c}</i>` : ''}<small>${d.name}</small></button>`;
    };
    const acts = u.skills.slice(1), out = [btn(u.skills[0])];
    let j = 0;
    for (let i = 0; i < LOADOUT_ACTIVES; i++) {
      if (acts[i]) { out.push(btn(acts[i])); continue; }
      const L = locked[j++];
      out.push(L ? `<button class="skill lock" disabled title="${L.name}"><span>${svg('lock')}</span><i class="lv">Sv. ${L.lvl}</i><small>${L.name}</small></button>` : '<button class="skill empty" disabled><span></span><small>Boş yuva</small></button>');
    }
    const pot = k => {
      const has = u.potHp !== undefined, left = has ? battle.potLeft(u, k) : 0, cd = has ? (k === 'hp' ? u.cdHp : u.cdMp) : 0, ok = turn && battle.canDrink(u, k);
      return `<button class="skill pot ${k}" data-pot="${k}" ${ok ? '' : 'disabled'} title="${POT[k].name}${has ? '' : ' (bu savaşta yok)'}"><span>${potSvg(k)}</span>${cd ? `<em>${cd}</em>` : ''}<i class="pn">${has ? left : '–'}</i><small>${POT[k].name}</small></button>`;
    };
    // 19 Kas (kullanıcı): sol kenarda dikey çubuk — ilk sırada temel saldırı + Can ve Mana iksiri, öbür yetenekler alt alta
    $('#skills').innerHTML = `<div class="ycol">${out[0]}<div class="ypots">${pot('hp')}${pot('mp')}</div>${out.slice(1).join('')}</div>`;
    if (turn && potLock()) lockMsg();
    if (!turn) return;
    $('#skills').querySelectorAll('[data-skill]').forEach(b => b.onclick = () => ui.pickSkill?.(b.dataset.skill));
    $('#skills').querySelectorAll('[data-pot]').forEach(b => b.onclick = () => { if (battle.canDrink(u, b.dataset.pot)) { BT.pot = true; ui.choose?.(['@' + b.dataset.pot, 0]); } });
  }
  drawBar(null);

  function tapUnit(a) { if (potLock()) return lockMsg(); if (ui.choose && ui.legal.includes(a.unit.id)) ui.choose([ui.selected, a.unit.id]); }
  // Dokunma: önce yalnız seçilebilir hedeflerin alanları denenir (öndeki kahraman arkadaki canavarı örtmesin); ıskalanırsa
  // ekranda dokunulan noktaya en yakın seçilebilir hedef (göğüs izdüşümüne 70 px'ten yakınsa) seçilir.
  onTap = (x, y) => {
    const live = [...actors.values()].filter(a => !a.gone), legal = live.filter(a => ui.legal.includes(a.unit.id));
    const h = pick(x, y, (legal.length ? legal : live).map(a => a.hitbox)) || (legal.length ? null : pick(x, y, live.map(a => a.hitbox)));
    if (h) return tapUnit(h.userData.actor);
    let best = null, bd = 70;
    const st = stage.getBoundingClientRect();
    for (const a of legal) { const p = projectTo(a.char.chestTo ? a.char.chestTo(hv) : a.char.headTo(hv)), d = Math.hypot(p.x + st.left - x, p.y + st.top - y); if (d < bd) { bd = d; best = a; } }
    if (best) tapUnit(best);
  };

  // ---- Oyuncu hamlesi ----
  function askPlayer(u) {
    return new Promise(resolve => {
      const usable = battle.usable(u);
      curHero = u; if (potLock() && ui.auto) { ui.auto = false; BT.auto = false; renderButtons(); }
      const pickDefault = () => { const c = battle.autoChoice(); return usable.includes(c[0]) ? c[0] : usable[0]; };
      ui.selected = pickDefault();
      let left = timer, tick = null;
      ui.choose = c => { clearInterval(tick); ui.choose = null; ui.legal = []; ui.pickSkill = null; if (!ui.auto && SKILLS[c[0]]?.type === 'active') BT.sk = true; drawBar(null); $('#bwho').textContent = ''; resolve(c); };
      // Canlı modlarda hamle süresi: dolunca yapay zekâ seçer
      if (timer) tick = setInterval(() => { left--; const t = $('#btimer'); if (t) t.textContent = `⏱ ${Math.max(0, left)}`; if (left <= 0) ui.choose?.(battle.autoChoice()); }, 1000);
      const draw = () => {
        const S = SKILLS[ui.selected], needs = ['enemy', 'ally'].includes(S.target); // ölü müttefik sahnede görünmez: diriltme hedefi kendiliğinden seçilir
        ui.legal = needs ? battle.targetsFor(u, ui.selected) : [];
        $('#bwho').innerHTML = `${timer ? `<em id="btimer" style="font-style:normal;font-weight:800;color:#ffd36a">⏱ ${left}</em> ` : ''}<b></b> · <span></span> <i>${needs ? (S.target === 'enemy' ? 'Hedefe dokun.' : ui.legal.length === 1 ? 'Kendine dokun ya da tekrar dokun.' : 'Müttefike dokun.') : 'Kullanmak için tekrar dokun.'}</i>`;
        const cost = battle.costOf(u, ui.selected);
        $('#bwho b').textContent = `${u.name} — ${S.name}`; $('#bwho span').textContent = describe(S) + (cost ? ` Mana ${cost}.` : '');
        drawBar(usable);
      };
      ui.pickSkill = id => {
        if (potLock()) return lockMsg();
        const T = SKILLS[id].target;
        if (ui.selected === id && !['enemy', 'ally'].includes(T)) return ui.choose([id, T === 'dead' ? battle.targetsFor(u, id)[0] : 0]);
        if (ui.selected === id && T === 'ally' && ui.legal.length === 1) return ui.choose([id, ui.legal[0]]); // tek kahraman: şifaya ikinci dokunuş kendine
        ui.selected = id; draw();
      };
      draw();
      if (potLock()) lockMsg();
      ui.autoPick = () => ui.choose?.(battle.autoChoice());
      if (ui.auto) ui.autoPick();
    });
  }

  // ---- Olay oynatma ----
  // ctx: vuruşun bağlamı { kind: vuranın silah modeli, wt: silah sınıfı, el: yeteneğin elementi, color: sınıf/yaratık rengi,
  //   spark: false ise kıvılcım oynamaz (büyü mermisi çarpmasını zaten oynattı), self: vuranın kimliği }
  function applyFx(f, from, heavy, ctx = {}) {
    const a = byId(f.u);
    if (!a) return;
    SFX.fx(f, a);
    const c = a.char;
    if (f.k === 'dmg' && f.efx) { // silah efektinin ek hasarı (items.js WEAPON_FX): küçük, efekt renginde sayı; vuruş animasyonu yok
      a.shown = f.hp;
      floatText(c.headPos(), `${WFX[f.el]?.icon || ''} ${f.amt}${f.cut ? ' ▼' : ''}`, 'dmg efx efx-' + f.el);
      if (f.killed) { a.shown = 0; c.die(); }
    } else if (f.k === 'dmg') {
      c.hit(from, heavy || f.crit);
      a.shown = f.hp;
      // ▲ zayıflığına vuruldu · ▼ savunma katsayısı ya da direnci hasarı azalttı · ◈ kalkanın emdiği (tamamı emildiyse yalnızca o yazar)
      if (f.abs >= f.amt) floatText(c.headPos(), `◈ Emildi`, 'shield');
      else floatText(c.headPos(), (f.crit ? 'KRİTİK ' : '') + (f.amt - f.abs) + (f.weak ? ' ▲' : '') + (f.cut ? ' ▼' : ''), f.crit ? 'crit' : 'dmg', f.abs ? `◈ −${f.abs}` : '');
      if (f.abs > 0) fx(EVENT_FX.absorb, c);
      if (f.abs < f.amt && ctx.spark !== false) fx(EVENT_FX.dmg, c, { from, weaponKind: ctx.kind, wt: ctx.wt, el: ctx.el, color: ctx.color, crit: f.crit, heavy });
      if (f.crit) fx(EVENT_FX.crit, c, { special: heavy });
      if (f.weak) fx(EVENT_FX.weak, c);
      if (f.killed) { a.shown = 0; c.die(); } // erime efekti (EVENT_FX.kill) karakterin ölümünde oynar
    } else if (f.k === 'heal') {
      a.shown = f.hp;
      if (f.amt > 0) { floatText(c.headPos(), '+' + f.amt, 'heal'); fx(f.u === ctx.self ? fxOfTick('regen') : EVENT_FX.heal, c, { color: ctx.heal }); } // can çalma: küçük iz
    } else if (f.k === 'st') {
      floatText(c.headPos(), `${STATUS[f.s].icon} ${STATUS[f.s].name}`, 'st' + (f.s === 'shield' ? ' shield' : STATUS[f.s].good ? ' good' : ' bad'));
      fx(EVENT_FX.st, c, { s: f.s });
    } else if (f.k === 'resist') { floatText(c.headPos(), 'Direndi', 'miss'); fx(EVENT_FX.resist, c); } // etki tutmadı (ıska)
    else if (f.k === 'cleanse') { floatText(c.headPos(), 'Arındı', 'st good'); fx(EVENT_FX.cleanse, c); }
    else if (f.k === 'tm') fx(EVENT_FX.tm, c, { v: f.v });
    else if (f.k === 'revive') {
      c.revive(a.face, a.home); a.shown = f.hp;
      fx(EVENT_FX.revive, c); floatText(c.headPos(), 'Dirildi', 'heal');
    } else if (f.k === 'phase') { showBanner(f.text, a.unit.name, 'B'); fx(EVENT_FX.phase, c); flashScreen(); }
    // ---- uzmanlık yollarının olayları (battle.js sürüm 2) ----
    else if (f.k === 'det') { // patlatılan süren hasar: etkilerin simgeleri + hasar
      c.hit(from, true); a.shown = f.hp;
      floatText(c.headPos(), `${f.s.map(s => STATUS[s].icon).join('')} −${f.amt}`, 'dot det ' + f.s[0]);
      fx(EVENT_FX.det, c, { s: f.s });
      if (f.killed) { a.shown = 0; c.die(); }
    } else if (f.k === 'guard') { // himaye: payı üstlenen birim vurulur
      c.hit(from, false); a.shown = f.hp;
      floatText(c.headPos(), f.abs >= f.amt ? '◈ Emildi' : `${STATUS.guard.icon} ${f.amt - f.abs}`, f.abs >= f.amt ? 'shield' : 'dmg guard', f.abs && f.abs < f.amt ? `◈ −${f.abs}` : '');
      fx(EVENT_FX.guard, c);
      if (f.killed) { a.shown = 0; c.die(); }
    } else if (f.k === 'strip') { floatText(c.headPos(), `${f.s.map(s => STATUS[s].icon).join('')} Söküldü`, 'st bad'); fx(EVENT_FX.strip, c); }
    else if (f.k === 'ward') { floatText(c.headPos(), `${STATUS.ward.icon} Savuşturdu`, 'st good'); fx(EVENT_FX.ward, c); }
    syncStatus(a);
  }

  async function playSkill(ev) {
    const A = byId(ev.u), c = A.char, S = SKILLS[ev.skill], AF = ANIM_FX[S.anim] || ANIM_FX.buff;
    const special = S.cd > 0;
    SFX.skill(ev, A.unit, S, ui.speed);
    const dmgs = ev.fx.filter(f => f.k === 'dmg'), rest = ev.fx.filter(f => f.k !== 'dmg');
    const first = dmgs[0] && byId(dmgs[0].u), tgt = first || byId(ev.target) || A;
    const side = A.unit.side === 'A' ? 1 : -1;
    // Element: yeteneğin hasar satırından; elementsiz büyü birimin kendi rengini (sınıf / yaratık) taşır
    const el = skillElement(S), EL = ELEMENT_FX[el], tint = el === 'fire' || el === 'ice' || el === 'bolt';
    const color = tint ? EL.color : c.fx || (S.sc === 'mag' ? 0x9a6aff : 0xff6a1a);
    const ctx = { kind: c.weaponKind, wt: A.unit.wt, el, color: tint ? 0 : c.fx || 0, self: ev.u, heal: S.anim === 'heal' ? c.fx || 0x6dff8a : 0x6dff8a };
    const spell = { ...ctx, spark: false };
    c.arcTint = tint ? EL.color : 0; // element taşıyan yakın dövüş yeteneğinde savurma izi elementin renginde
    const castFx = () => { if (AF.cast) fx(EVENT_FX.skill, c, { el: tint ? el : 'arcane', color: tint ? 0 : S.anim === 'heal' ? ctx.heal : S.anim === 'buff' ? 0xffd36a : color }); };
    if (special) {
      const master = !!(S.master || S.pm); // usta yetenek: daha yakın, daha uzun kamera ve kenar karartması
      showBanner(S.name, master ? `${A.unit.name} · Usta yetenek` : A.unit.name, A.unit.side);
      if (master) { const v = document.createElement('div'); v.className = 'mvig ' + A.unit.side; overlay.appendChild(v); setTimeout(() => v.remove(), 1400); }
      const k = c.scale * (master ? 0.72 : 1), look = c.chestPos().add(new THREE.Vector3(0, 0.15 * c.scale, 0));
      // yakın çekim karşı takımın hattını geçmez (iri boss'ta kamera partinin içine girip sırtları kadraja almasın)
      const keep = v => { v.z = side > 0 ? Math.max(v.z, -1.5) : Math.min(v.z, 1.5); return v; };
      const near = keep(c.pos.clone().add(new THREE.Vector3(1.4 * k, 1.55 * k, -2.6 * side * k)));
      camRig.pos.copy(keep(look.clone().add(near.clone().sub(look).multiplyScalar(1.45)))); camRig.look.copy(look);
      await moveCam(near, look, master ? 0.85 : 0.55);
      camRig.pos.copy(CAM.pos); camRig.look.copy(CAM.look);
      if (dmgs.length) { flashScreen(); slowmo(master ? 0.45 : 0.25); }
    }
    const from = c.pos.clone();
    const hitAll = x => dmgs.forEach(f => applyFx(f, from, special, x));
    const foesCenter = new THREE.Vector3(0, 0, A.unit.side === 'A' ? -2.9 : 2.9);
    switch (S.anim) {
      case 'melee': {
        let at = null;
        for (const f of dmgs.length ? dmgs : [null]) {
          const t = f ? byId(f.u) : tgt;
          if (t !== at) { const dir = A.home.clone().sub(t.char.pos).setY(0).normalize(); await c.moveTo(t.char.pos.clone().addScaledVector(dir, 0.75 * t.char.scale + 0.55 * c.scale), at ? 0.18 : 0.32); at = t; }
          await c.swing();
          if (f) applyFx(f, from, special, ctx);
          await wait(0.22);
        }
        await c.moveTo(A.home, 0.3); restFace(A);
        break;
      }
      case 'whirl': {
        await c.moveTo(foesCenter.clone().add(new THREE.Vector3(0, 0, side * 1.6)), 0.35);
        await c.whirl(); hitAll(ctx);
        burst(c.chestPos(), { color: tint ? EL.color : 0xdde6ff, count: 20, speed: 4, size: 0.05, life: 0.4, up: 0.2 });
        await wait(0.25);
        await c.moveTo(A.home, 0.35); restFace(A);
        break;
      }
      case 'arrow': case 'arrowBig': {
        c.face(tgt.char.pos);
        const big = S.anim === 'arrowBig';
        const seen = new Set();
        for (const f of dmgs.length ? dmgs : [{ u: tgt.unit.id }]) {
          const t = byId(f.u);
          if (!seen.has(f.u) || dmgs.length <= 3) { c.face(t.char.pos); if (big && !seen.size) castFx(); await c.shoot(); await projectile(c.handPos(), t.char.chestPos(), { arrow: true, color: tint ? EL.color : big ? (c.fx || 0xffe066) : 0, arc: 0.25, dur: big ? 0.18 : 0.26 }); }
          seen.add(f.u);
          if (f.k) applyFx(f, from, special, { ...ctx, kind: 'bow' });
        }
        await wait(0.3); restFace(A);
        break;
      }
      case 'bolt': {
        for (const f of dmgs.length ? dmgs : [{ u: tgt.unit.id }]) {
          const t = byId(f.u);
          c.face(t.char.pos);
          castFx();
          await c.castSpell();
          const at = t.char.chestPos();
          await projectile(c.handPos(), at, { el, color, dur: 0.34, arc: 0.6 });
          elementImpact(at, el, tint ? 0 : color, true);
          if (f.k) applyFx(f, from, special, spell);
        }
        await wait(0.3); restFace(A);
        break;
      }
      case 'meteor': {
        castFx();
        await c.raiseArms();
        const spots = [...new Set(ev.fx.filter(f => f.k === 'dmg' || f.k === 'st' || f.k === 'resist').map(f => f.u))].map(byId).filter(a => a && a.unit.side !== A.unit.side);
        await Promise.all(spots.map((a, i) => wait(i * 0.12).then(() => skyStrike(a.char.pos.clone().setY(0.4), el === 'phys' ? 'arcane' : el, tint ? 0 : color))));
        camRig.shake = Math.max(camRig.shake, 0.45); hitAll(spell);
        await wait(0.45);
        break;
      }
      case 'stomp': {
        await c.stomp();
        await Promise.all([shockwave(c.pos.clone(), tint ? EL.color : 0xc8a060), wait(0.15).then(() => hitAll({ ...ctx, kind: 'club' }))]);
        await wait(0.3);
        break;
      }
      default: { // heal, buff: şifa ve durum efektleri satır satır (applyFx) oynar
        castFx();
        await c.raiseArms();
        await wait(0.3); hitAll(spell);
      }
    }
    c.arcTint = 0;
    rest.forEach(f => applyFx(f, from, false, ctx));
    await wait(0.3);
  }

  // Boss ya da kapı kaptanı sahneye girdi: boss'ta kamera alçaktan yaklaşır, yer sarsılır, adı duyurulur; kaptanda yalnızca efekt.
  // Süreler oyun saatindedir: 3x hızda ve otomatik modda kısalır.
  async function bossIntro(a) {
    const c = a.char, k = c.scale, u = a.unit;
    if (!u.boss) { showBanner(u.name, 'Kapı kaptanı', 'B'); fx(EVENT_FX.boss, c); return wait(0.35); }
    bossCard(u);
    // kamera iki hattın arasına, alçağa iner ve boss'a aşağıdan bakar (parti kameranın arkasında kalır)
    const look = a.home.clone().setY(1.45 * k), near = new THREE.Vector3(a.home.x + 1.5, 0.9 + 0.35 * k, Math.min(1.2, a.home.z + 2.2 + 1.5 * k));
    await moveCam(near, look, 0.7);
    fx(EVENT_FX.boss, c);
    tween(0.35, e => c.root.scale.setScalar(k * (0.88 + 0.12 * e)), ease.back);
    await wait(0.85);
    await moveCam(CAM.pos, CAM.look, 0.6);
  }

  async function play(events) {
    for (const ev of events) {
      if (token !== world.token) return;
      SFX.event(ev, battle, ui.speed);
      if (ev.t === 'wave') {
        for (const a of actors.values()) if (a.unit.side === 'B' && !a.gone) { a.gone = true; a.hud.remove(); a.char.root.visible = false; }
        if (ev.n > 0) { showBanner(`${ev.restore ? 'Raunt' : 'Dalga'} ${ev.n + 1}/${ev.of}`, ev.restore ? 'Tarafın yenilendi' : 'Yeni düşmanlar', 'B'); await wait(0.5); }
        else if (setup.lead) showBanner('Açılış turu', 'Önce sen oynarsın', 'A'); // yaratıklara karşı ilk hamleler partinindir (battle.js: lead)
        if (ev.restore) for (const a of actors.values()) if (a.unit.side === 'A') {
          a.char.revive(a.face, a.home); a.shown = a.unit.maxHp;
          fx(EVENT_FX.restore, a.char); syncStatus(a);
        }
        const us = ev.ids.map(id => battle.get(id));
        const fresh = us.map(u => { const a = place(u, us.length); const z = a.home.z; a.char.pos.z = z - 4; tween(0.5, k => { a.char.pos.z = z - 4 + 4 * k; }, ease.out).then(() => fx(EVENT_FX.wave, a.char)); return a; });
        setTitle(); renderOrder();
        await wait(ev.n > 0 ? 0.6 : 0.1);
        const lead = fresh.find(a => a.unit.boss) || fresh.find(a => a.unit.captain);
        if (lead) { await wait(ev.n > 0 ? 0 : 1.5); if (token !== world.token) return; await bossIntro(lead); } // ilk dalgada açılış kamerası bitsin
      } else if (ev.t === 'turn') {
        ui.active = ev.u; renderOrder();
        const a = byId(ev.u);
        if (ev.mp !== undefined) a.shownMp = ev.mp;
        if (a.unit.alive) fx(EVENT_FX.turn, a.char);
        for (const tk of ev.ticks) {
          a.shown = tk.hp;
          floatText(a.char.headPos(), tk.s === 'regen' ? `+${tk.amt}` : `${STATUS[tk.s].icon} −${tk.amt}`, tk.s === 'regen' ? 'heal' : 'dot ' + tk.s);
          fx(fxOfTick(tk.s), a.char);
          if (tk.killed) { a.shown = 0; a.char.die(); }
        }
        if (ev.enrage) { floatText(a.char.headPos(), `ÖFKE ×${ev.enrage}`, 'crit'); fx(EVENT_FX.enrage, a.char); }
        if (ev.skip) { floatText(a.char.headPos(), `${STATUS[ev.skip].icon} ${STATUS[ev.skip].name}`, 'st bad'); fx(EVENT_FX.skip, a.char, { s: ev.skip }); }
        if (ev.ticks.length || ev.skip) await wait(0.45);
        syncStatus(a);
      } else if (ev.t === 'skill') {
        if (ev.mp !== undefined && byId(ev.u)) byId(ev.u).shownMp = ev.mp;
        await playSkill(ev);
        ui.active = null; renderOrder();
      } else if (ev.t === 'pot') { // iksir: serbest hamle (tur bitmez)
        const a = byId(ev.u);
        if (a) {
          a.shown = ev.hp; if (ev.mp !== undefined) a.shownMp = ev.mp;
          floatText(a.char.headPos(), `${POT[ev.k].name} +${ev.amt}`, ev.k === 'hp' ? 'heal' : 'st good');
          fx(EVENT_FX.heal, a.char, { color: ev.k === 'hp' ? 0xff5a4a : 0x5aa8ff });
          SFX.fx({ k: 'heal', u: ev.u, amt: ev.amt }, a);
          await wait(0.35);
        }
      }
    }
    for (const a of actors.values()) if (!a.gone) { a.shown = a.unit.hp; syncStatus(a); }
  }

  (async () => {
    let r = battle.advance();
    openCard(title, setup.waves.length);
    await wait(0.5);
    await play(r.events);
    while (!r.over) {
      if (token !== world.token) return;
      ui.active = r.pending; renderOrder();
      const pu = battle.pending, mine = !coop || String(pu.ctl) === coop.me;
      let c;
      if (!mine) { // ortak savaş: sıra parti arkadaşında
        $('#bwho').innerHTML = `<b>${escH(pu.name)}</b> · <span>hamlesini seçiyor…</span>`; document.body.classList.add('coop-wait');
        c = await coop.getAct(actions.length);
        document.body.classList.remove('coop-wait'); $('#bwho').textContent = '';
      } else {
        c = await askPlayer(pu);
        if (coop && !(await coop.putAct(actions.length, c))) c = await coop.getAct(actions.length); // süre doldu ya da çakıştı: sunucunun hamlesi geçerli
      }
      if (token !== world.token) return;
      actions.push(c);
      r = battle.advance(c);
      await play(r.events);
    }
    if (token !== world.token) return;
    SFX.end();
    // Bitiş: ayakta kalanlar kutlar; zaferde sahne aydınlanır ve altın ışık iner, yenilgide kararır
    const winners = [...actors.values()].filter(a => !a.gone && a.unit.side === r.over && a.unit.alive).map(a => a.char);
    winners.forEach(c => c.cheer());
    fx(r.over === 'A' ? EVENT_FX.victory : EVENT_FX.defeat, winners);
    endCard(r.over === 'A');
    await wait(1.6);
    if (token !== world.token) return;
    clock.scale = 1;
    battleUI.hidden = true; BT.on = false;
    onDone(r.over === 'A', actions);
  })();
}

// Hızlandırma (2x/3x) yalnız OTO açıkken (kullanıcı 19 Kas); OTO kapanınca hız 1x'e döner (erişilebilirlik yavaşlatması korunur)
const baseSpeed = () => (A11Y.speed < 1 ? A11Y.speed : 1);
function renderButtons() {
  if (!ui.auto && ui.speed > 1) { ui.speed = baseSpeed(); clock.scale = ui.speed; }
  $('#bauto').hidden = !OTO.ok(); $('#bauto').classList.toggle('on', ui.auto); $('#bspeed').textContent = `${ui.speed}x`; $('#bspeed').classList.toggle('off', !ui.auto);
}
$('#bauto').onclick = () => { if (potLock()) return lockMsg(); if (!OTO.ok()) return; document.querySelector('.oto-tip')?.remove(); ui.auto = !ui.auto; BT.auto = ui.auto; renderButtons(); if (ui.auto) ui.autoPick?.(); };
$('#bspeed').onclick = () => { if (!ui.auto) { const w = $('#bwho'); if (w) w.innerHTML = '<b>Hızlandırma</b> · <span>2x ve 3x yalnız OTO açıkken kullanılır.</span>'; return; } ui.speed = ui.speed < 1 ? 1 : ui.speed === 1 ? 2 : ui.speed === 2 ? 3 : (A11Y.speed < 1 ? A11Y.speed : 1); clock.scale = ui.speed; renderButtons(); };
$('#bexit').onclick = () => (potLock() ? lockMsg() : ui.onExit?.());

let downAt = null;
const stage = document.getElementById('stage');
stage.addEventListener('pointerdown', e => { downAt = [e.clientX, e.clientY]; });
stage.addEventListener('pointerup', e => { if (downAt && Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) < 12 && !battleUI.hidden) onTap?.(e.clientX, e.clientY); });
