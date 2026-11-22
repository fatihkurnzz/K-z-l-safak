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
import { SKILLS, describe, baseActives, skillName } from '../shared/skills.js';
import { POT } from '../shared/mana.js';
import { LOADOUT_ACTIVES } from '../shared/hero.js';
import { potSvg } from './iksir.js';
import { STATUS, HERO_LOOKS, CLASSES } from '../shared/content.js';
import { MOBS } from '../shared/zones.js';
import { world, clearScene, ensureEnv, spawn, setUpdater } from './world.js';
import { svg } from './icons.js';
import { skillIcon } from './skill-icons.js';
import { SFX } from './sfx.js';
import * as KAM from './savas-kamera.js'; // 22 Kas: dinamik savaş kamerası (durum makinesi, sınırlara göre kadraj)
import { pickBg, setProjector } from './savas-arka.js'; // 22 Kas: boyalı savaş arka planları
import { heroImg, mobImg } from './ui-core.js'; // 19 Kas: savaş arayüzü portreleri (sıra şeridi, kahraman çerçevesi) // savaş sesleri: olay türü, silah türü ve elemente göre (kural içermez)

const $ = s => document.querySelector(s);
const overlay = $('#overlay'), battleUI = $('#battleUI');
// 20 Kas: OTO ve hız tercihi cihazda hatırlanır (her savaşta yeniden açmak gerekmesin); hız yine yalnız OTO açıkken ve PvE'de işler
const PREF = { get: k => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch { } } };
export const otoPref = () => PREF.get('dd_oto') === '1';
const potPref = () => PREF.get('dd_autopot') !== '0'; // Oto İksir: varsayılan açık; kapalıyken OTO iksir içmez (tasarruf)
const ui = { auto: false, speed: [2, 3].includes(+PREF.get('dd_speed')) ? +PREF.get('dd_speed') : (A11Y.speed || 1), choose: null, selected: null, active: null, onExit: null, legal: [] };
let onTap = null;
// Bu savaşta oyuncunun yaptıkları (öğretici okur: ui-kalicilik.js 'bar' adımı) · auto: OTO açık mı
export const BT = { sk: false, pot: false, auto: false, on: false };
// Öğretici kilidi (ui-kalicilik.js doldurur): 'bar' adımında iksir içilene dek saldırı, OTO ve çıkış kapalı
export const TUTLOCK = { pot: () => false, say: null };
// OTO 10. seviyede açılır (19 Kas): ok() ui-kalicilik.js'te seviyeye bağlanır. İlk 3 savaşta OTO düğmesi hatırlatılır.
export const OTO = { lvl: 1, ok: () => true }; // 22 Kas (kullanıcı): OTO her seviyede açık
const OTO_HINT = 'dd_oto_hint';
function otoHint() {
  let n = 0; try { n = +localStorage.getItem(OTO_HINT) || 0; } catch { }
  if (!OTO.ok() || n >= 3 || TUTLOCK.pot()) return;
  try { localStorage.setItem(OTO_HINT, String(n + 1)); } catch { }
  document.querySelector('.oto-tip')?.remove();
  const t = document.createElement('div'); t.className = 'oto-tip'; t.innerHTML = '<b>Otomatik</b> açık! Dokunursan savaşı senin yerine oynar; istediğin an kapatırsın.';
  battleUI.appendChild(t); $('#bauto').classList.add('tut-pulse');
  setTimeout(() => { t.remove(); $('#bauto').classList.remove('tut-pulse'); }, 7000);
}
let curHero = null;
const potLock = () => { const u = curHero; return !!u && TUTLOCK.pot() && ((u.potHp | 0) + (u.potMp | 0)) > 0; };
const lockMsg = () => { const w = $('#bwho'); if (w) w.innerHTML = '<b style="color:#ffd36a">Önce bir iksir iç!</b> · <span>Sağdaki Can ya da Mana iksirine dokun.</span>'; $('#skills .ypots')?.classList.add('tut-pulse'); };

// 20 Kas (Kül, oynanışta): Tarikat düşmanı (birim `cult`) sahadayken savaş sahnesinin rengi solar (css .kul, v21 §16)
const ashScene = on => document.getElementById('stage')?.classList.toggle('kul', !!on);
export function hideBattleUI() { KAM.end(); ashScene(false); document.getElementById('bdwbar')?.remove(); battleUI.hidden = true; overlay.innerHTML = ''; onTap = null; ui.choose = null; ui.pickSkill = null; ui.primary = null; prim(false); BT.on = false; }

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

// 22 Kas (GPT kamera paketi): sabit CAM konumu kaldırıldı; kadrajı savas-kamera.js birimlerin sınırlarından hesaplar
// (eski: 13.125, 5.2, 0 → 0, 1.2, 0). Geri almak için bu commit'in öncesine bakın.
// Dizilişler (birim sayısı → [x, z] sıra sırasıyla; sıra 0 = oyuncunun kahramanı, önde). Düşman tarafı z'nin aynası.
const FORM = {
  1: [[2.18, 3.23]],
  2: [[2.63, 3.08], [0.29, 5.64]],
  3: [[2.70, 2.98], [1.07, 5.45], [-0.38, 2.21]],
  4: [[2.76, 3.04], [1.34, 5.51], [0.29, 2.09], [-1.53, 4.84]],
  5: [[2.83, 2.93], [1.59, 5.38], [0.89, 1.88], [-0.74, 4.66], [-3.10, 3.11]],
}; // 22 Kas: yandan 3/4 (parti solda, düşman sağda)
// Birimin sahadaki yeri (yalnız konum; place ve kameranın ilk dalga kestirimi kullanır)
function spot(u, n, idx = u.slot) {
  const big = u.boss && u.side !== 'A', mon = !!u.mon;
  const F = FORM[n], i = Math.min(Math.max(0, idx | 0), n - 1), kz = Math.min(1, view.w / view.h / 2.17);
  const x = mon ? -4.6 : big ? -5.5 : F ? F[i][0] : ((n - 1) / 2 - i) * 1.4;
  const z = mon ? 0 : (u.side === 'A' ? 1 : -1) * (big ? 6.2 : F ? F[i][1] : 3.4) * kz;
  return { x, z };
}
const SCALE_HERO = 1.3, SCALE_MOB = 1.15; // savaşta kahramanlar %30, canavarlar %15 büyük (kullanıcı 19 Kas)
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
export function runBattle({ setup, env, title, auto = false, timer = 0, onDone, onExit, coop = null, fast = true }) {
  document.getElementById('bdwbar')?.remove();
  ui.fast = fast && !coop; // 2x/3x yalnız PvE ve tek oyunculu savaşta (ortak savaş ve PvP'de 1x)
  clearScene();
  const token = world.token;
  setHfov(42); // ana üs geniş açıyla bakar; savaş kendi açısına döner
  setShift(0, 0); // 22 Kas: kadraj savas-kamera.js ile
  ensureEnv(env, 'foto:' + pickBg(env, setup.seed)); // 22 Kas (kullanıcı): eski çizilmiş savaş alanı yerine boyalı resim
  const battle = new Battle(setup);
  battle.noAutoPot = !potPref(); ui.battle = battle; ui.hasPot = battle.units.some(x => x.side === 'A' && x.potHp !== undefined && (x.potHp > 0 || x.potMp > 0)) && !battle.units.some(x => x.side !== 'A' && x.cls && !x.mon); // Oto İksir yalnız PvE
  const actions = [];
  const actors = new Map(); // birim kimliği → sahne aktörü
  const byId = id => actors.get(id);

  function place(u, n, idx = u.slot) {
    const big = u.boss && u.side !== 'A'; // boss sağ arkada durur (referans): iri gövdesi kadraja sığar, öndeki birimleri örtmez
    const mon = !!u.mon; // Anıt Savaşı: Sınır Anıtı sahanın sağında, iki hattın arasında
    // 22 Kas (kullanıcının savaş referansı): YANDAN 3/4 görünüş. Kamera +x yanında; parti solda (z>0) sağa, düşman sağda (z<0) sola bakar.
    // Sıra (slot 0 = öndeki) kameraya en yakın; birimler önlü arkalı kademeli dizilir, yüzleri biraz kameraya döner.
    // Konumlar 880×406 telefonda ekrandaki hedef ayak noktalarından geri hesaplandı (referans: önde büyük, arkada küçük, kademeli);
    // dar ekranda (tablet, masaüstü) yanal açıklık ekran oranına göre daraltılır ki iki hat da kadrajda kalsın.
    const { x, z } = spot(u, n, idx);
    const face = u.side === 'A' ? Math.PI - 0.55 : 0.55;
    const lk = mon ? { look: u.look || { kind: 'monument' }, model: {} } : unitLook(u); if (!mon) lk.look = { ...lk.look, scale: (lk.look.scale || 1) * (u.cls ? SCALE_HERO : SCALE_MOB) };
    if (big) lk.look.scale = Math.min(lk.look.scale, 1.9); // 22 Kas: yan görünüşte boss kadraja sığsın (kahramanın ~1.5 katı)
    const a = spawn({ ...u, ...lk }, x, z, face);
    a.hitbox.scale.setScalar(Math.max(1, 1.1 / a.char.scale)); // küçük yaratıkların dokunma alanı da yeterince büyük kalsın
    a.unit = u; a.home = new THREE.Vector3(x, 0.1, z); a.face = face; a.shown = u.hp; a.hold = { t: Math.random() * 0.16 };
    const hud = a.hud = document.createElement('div');
    hud.className = 'hud ' + u.side + (u.boss || u.captain || mon ? ' boss' : '') + (mon ? ' mon' : '') + (big ? ' big' : '');
    hud.innerHTML = `${u.boss || u.captain || mon ? `<b class="nm">${escH(u.name)}</b>` : ''}<i class="lv">${u.lvl}</i><div class="bars"><div class="hp"><b class="tr"></b><div></div></div>${u.maxMp > 0 ? '<div class="mp"><div></div></div>' : ''}<div class="tm"><div></div></div><div class="sts"></div></div>`;
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
  for (const u of battle.units.filter(x => x.mon)) place(u, 1);
  // 22 Kas: kamera açılışı. İlk dalganın yerleri önceden kestirilir (düşmanlar henüz sahnede değil); taban kadraj
  // arka plan resminin projektörü olur (resim bu bakıştan birebir görünür).
  {
    const pred = [], w0 = (setup.waves?.[0] || []).filter(u => u.side !== 'A'), rest = w0.filter(u => !u.boss);
    w0.forEach(u => { const n = u.boss ? 1 : rest.length, { x, z } = spot({ ...u, side: 'B' }, n, u.boss ? 0 : rest.indexOf(u)), M = MOBS[u.mob]?.look || {}, k = (M.scale || 1) * SCALE_MOB * (u.boss ? 1.6 : 1), h = 2.0 * Math.min(u.boss ? 1.9 * 1.6 : 3, k) + 0.5; for (const y of [0, h]) for (const d of [-0.6, 0.6]) pred.push(Object.assign(new THREE.Vector3(x + d * 0.6, y, z + d), { side: "B" })); });
    const r = KAM.begin(actors, pred);
    setProjector(r.pos, r.look);
  }
  // Anıt Savaşı şeridi: iki tarafın puanı, raunt ve anıta verilen hasar payı (battle.bdw; oynatılan olaylarla güncellenir)
  const bdwBar = battle.bdw ? (() => { const el = document.createElement('div'); el.id = 'bdwbar'; battleUI.appendChild(el); return el; })() : null;
  const syncBdw = () => {
    if (!bdwBar) return;
    const B = battle.bdw, tot = B.dmg.A + B.dmg.B, pa = tot ? Math.round(100 * B.dmg.A / tot) : 50, m = battle.get(B.mon);
    bdwBar.innerHTML = `<span class="bd-a"><small>Sen</small><b>${B.pts.A}</b></span><span class="bd-mid"><small>Raunt ${Math.min(B.round + 1, B.rounds)}/${B.rounds}</small><i class="bd-dmg"><s style="width:${pa}%"></s></i><em>Anıt hasarı %${pa} · %${100 - pa} · Anıt ${m?.alive ? Math.max(0, Math.round(100 * m.hp / m.maxHp)) + '%' : 'kesildi'}</em></span><span class="bd-b"><b>${B.pts.B}</b><small>Rakip</small></span>`;
  };
  syncBdw();
  const restFace = a => { a.char.root.rotation.y = a.face; };
  const hv = new THREE.Vector3();
  function syncStatus(a) {
    const key = a.unit.st.map(x => x.s + x.t).join();
    if (a.stKey === key) return;
    a.stKey = key;
    a.stEl.innerHTML = a.unit.st.map(x => `<i class="${STATUS[x.s].good ? '' : 'bad'}" title="${STATUS[x.s].name}">${STATUS[x.s].icon}</i>`).join('');
  }

  let firstA = null;
  setUpdater(dt => {
    KAM.step(dt);
    firstA = actors.values().next().value;
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
      if (a === firstA && ++hudF % 6 === 0) syncSide();
      if (u.alive && u.st.length) statusHold(a.char, u.st, dt, a.hold); // süren durumların izi (yanık, zehir, donma, kalkan…)
      const targetable = !!ui.choose && ui.legal.includes(u.id);
      a.hud.classList.toggle('active', ui.active === u.id);
      a.hud.classList.toggle('targetable', targetable && (u.side === 'B' || u.side === 'N'));
      a.hud.classList.toggle('ally', targetable && u.side === 'A');
      const active = ui.active === u.id && u.alive;
      a.ring.material.color.set(active ? 0xffd36a : u.side === 'A' ? 0x6dff8a : 0xff3a2a);
      a.ring.material.opacity = active ? 0.9 : targetable ? 0.5 + Math.sin(performance.now() / 150) * 0.35 : 0;
      a.ring.rotation.y += 0.01;
    }
  });

  Object.assign(ui, { auto, choose: null, active: null, onExit, legal: [] });
  if (ui.fast && [2, 3].includes(+PREF.get('dd_speed'))) ui.speed = +PREF.get('dd_speed'); // hatırlanan hız (PvE; 22 Kas: OTO'dan bağımsız)
  clock.scale = ui.speed;
  battleUI.hidden = false;
  const setTitle = () => {
    $('#btitle').textContent = title;
    const n = setup.waves.length, w = battle.wave;
    $('#bwave').innerHTML = `<b class="bw-big">${n > 1 ? `Dalga ${w + 1} / ${n}` : 'Savaş'}</b><small>${n > 1 ? 'Dalga' : 'Savaş'}</small><span>${Array.from({ length: n }, (_, i) => `<i class="${i < w ? 'done' : i === w ? 'on' : ''}"></i>`).join('')}</span><b>${w + 1}/${n}</b>`;
  };
  // Sıra şeridi: sıradaki birimler (sıra çubuğu benzetimi; hız değişikliği yok sayılır, yalnızca gösterim)
  const PORT = new Map();
  const portOf = u => { let v = PORT.get(u.id); if (!v) { v = portraitOf(u); if (v && !v.includes('data:image/gif')) PORT.set(u.id, v); } return v || ''; }; // boş portre saklanmaz (22 Kas: düşman çerçevesi boş kalıyordu)
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
    if (el.dataset.k === k) return;
    for (const u of out) portOf(u); // boş portre (henüz çizilmemiş) saklanmaz: sonraki çağrıda yeniden denenir
    el.dataset.k = out.every(u => PORT.get(u.id)) ? k : '';
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
  stat.innerHTML = hero ? `<div class="yport">${portraitOf(hero)}<i class="ylv">${hero.lvl}</i></div><div class="ybars"><b class="ynm"><em class="ysv">Sv.${hero.lvl}</em> ${escH(hero.name)}</b><div class="yb hp"><s></s><i></i><b></b></div>${hero.maxMp > 0 ? '<div class="yb mp"><i></i><b></b></div>' : ''}</div>` : '';
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
  // ---- Parti rayı (sol) ve hedef çerçevesi (sağ üst): 19 Kas gece, kullanıcının savaş referansı ----
  // Rayda tarafımızın bütün birimleri (portre, seviye, can), hedef çerçevesinde boss ya da sıradaki/son düşman. Veri canlı birimden.
  const mk = id => { let e = $('#' + id); if (!e) { e = document.createElement('div'); e.id = id; battleUI.appendChild(e); } return e; };
  const rail = mk('bparty'), tgtEl = mk('btgt');
  let railK = '', tgtId = null, tgtK = '', hudF = 0;
  // 20 Kas (Aşama 4, kullanıcı: boss aşaması '%' çubuğu): boss varken üst ortada büyük can çubuğu (yüzde). Çubuktaki çizgiler
  // bossun gerçek evre eşikleri (zones.js phases[].at; motor battle.js evreyi o canda açar ve 'phase' olayıyla şerit gösterilir).
  const bossEl = mk('bboss'); bossEl.hidden = true; bossEl.innerHTML = '';
  let bossK = '';
  const ROMAN = ['I', 'II', 'III', 'IV', 'V'];
  function syncBoss(foes) {
    const bo = foes.find(a => a.unit.boss);
    battleUI.classList.toggle('bossf', !!bo);
    if (!bo) { if (!bossEl.hidden) { bossEl.hidden = true; bossK = ''; } return; }
    const u = bo.unit, p = Math.max(0, Math.min(100, 100 * Math.max(0, bo.shown) / u.maxHp)), ph = u.phase || 0, n = u.phases?.length || 0;
    const k = `${u.id}:${Math.ceil(p)}:${ph}`;
    if (k === bossK) return; bossK = k;
    bossEl.hidden = false; bossEl.dataset.ph = Math.min(2, ph);
    bossEl.innerHTML = `<div class="bb-top"><b>${escH(u.name)}</b>${n ? `<span class="bb-ph">Evre ${ROMAN[ph] || ph + 1} / ${ROMAN[n] || n + 1}</span>` : '<span class="bb-ph">Boss</span>'}</div><div class="bb-bar"><s style="width:${p}%"></s><i style="width:${p}%"></i>${(u.phases || []).map(x => `<u style="left:${(x.at * 100).toFixed(2)}%"></u>`).join('')}<em>%${Math.ceil(p)}</em></div>`;
  }

  function syncSide() {
    ashScene([...actors.values()].some(a => a.unit.side === 'B' && a.unit.cult && a.shown > 0));
    const mine = [...actors.values()].filter(a => a.unit.side === 'A');
    const k = mine.map(a => `${a.unit.id}:${Math.round(100 * Math.max(0, a.shown) / a.unit.maxHp)}:${ui.active === a.unit.id ? 1 : 0}:${PORT.get(a.unit.id) ? 1 : 0}`).join(); mine.forEach(a => portOf(a.unit));
    if (k !== railK) {
      railK = k;
      rail.innerHTML = mine.map(a => { const u = a.unit, p = Math.max(0, Math.min(100, 100 * Math.max(0, a.shown) / u.maxHp)); return `<span class="bp ${p <= 0 ? 'dead' : ''} ${ui.active === u.id ? 'now' : ''} ${u === hero ? 'me' : ''}" title="${escH(u.name)}">${portOf(u)}<em>${u.lvl}</em><i style="width:${p}%"></i></span>`; }).join('');
    }
    const foes = [...actors.values()].filter(a => (a.unit.side === 'B' || a.unit.side === 'N') && !a.gone && a.shown > 0); // 22 Kas: ekranda canlı olan (motor ileride olabilir; OTO'da çerçeve kayboluyordu)
    syncBoss(foes);
    const act = foes.find(a => a.unit.id === ui.active);
    const t = foes.find(a => a.unit.boss) || act || foes.find(a => a.unit.id === tgtId) || foes[0];
    tgtId = t ? t.unit.id : null;
    const tk = t ? `${t.unit.id}:${Math.round(Math.max(0, t.shown))}:${PORT.get(t.unit.id) ? 1 : 0}` : ''; if (t && !PORT.get(t.unit.id)) portOf(t.unit); // portre henüz çizilmediyse sonra yeniden dene
    if (tk === tgtK) return; tgtK = tk;
    if (!t) { tgtEl.hidden = true; return; }
    const u = t.unit, p = Math.max(0, Math.min(100, 100 * Math.max(0, t.shown) / u.maxHp));
    tgtEl.hidden = false; tgtEl.className = u.boss ? 'boss' : '';
    tgtEl.innerHTML = `<div class="bt-info"><b>${escH(u.name)}</b><div class="bt-bar"><s style="width:${p}%"></s><i style="width:${p}%"></i><em>${Math.round(Math.max(0, t.shown)).toLocaleString('tr-TR')} / ${u.maxHp.toLocaleString('tr-TR')}</em></div><small>Sv. ${u.lvl}${u.boss ? ' · Boss' : ''}</small></div><div class="bt-port">${portOf(u)}</div>`;
  }
  // usable: sıra oyuncudaysa kullanılabilir yeteneklerin listesi; değilse null (çubuk görünür ama kapalı)
  function drawBar(usable) {
    const u = hero;
    if (!u) { $('#skills').innerHTML = ''; return; }
    const turn = !!usable && battle.pending === u;
    const btn = s => {
      const d = SKILLS[s.id], ok = turn && usable.includes(s.id) && !potLock(), c = battle.costOf(u, s.id), dry = c > 0 && u.maxMp > 0 && c > u.mp;
      return `<button class="skill ${d.type === 'basic' ? 'basic' : 'act'} ${turn && ui.selected === s.id ? 'sel' : ''}" data-skill="${s.id}" title="${escH(skillName(s.id, u.wt))}" ${ok ? '' : 'disabled'}><span>${skillIcon(s.id) || svg(d.anim)}</span>${s.cd ? `<em>${s.cd}</em>` : dry ? '<em class="dry">MP</em>' : ''}${c ? `<i class="mpc">${c}</i>` : ''}<small>${escH(skillName(s.id, u.wt))}</small></button>`;
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
    // 19 Kas gece (kullanıcının savaş referansı): alt ortada yatay çubuk — temel saldırı + 5 yetenek, sağ ucunda Can ve Mana iksiri
    $('#skills').innerHTML = `<div class="yrow"><i class="yr-end l" aria-hidden="true"></i>${out.join('')}<span class="ypots">${pot('hp')}${pot('mp')}</span><i class="yr-end r" aria-hidden="true"></i></div>`;
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
      ui.choose = c => { clearInterval(tick); ui.choose = null; ui.legal = []; ui.pickSkill = null; ui.primary = null; prim(false); if (!ui.auto && SKILLS[c[0]]?.type === 'active') BT.sk = true; drawBar(null); $('#bwho').textContent = ''; resolve(c); };
      // Canlı modlarda hamle süresi: dolunca yapay zekâ seçer
      if (timer) tick = setInterval(() => { left--; const t = $('#btimer'); if (t) t.textContent = `⏱ ${Math.max(0, left)}`; if (left <= 0) ui.choose?.(battle.autoChoice()); }, 1000);
      const draw = () => {
        const S = SKILLS[ui.selected], needs = ['enemy', 'ally'].includes(S.target); // ölü müttefik sahnede görünmez: diriltme hedefi kendiliğinden seçilir
        ui.legal = needs ? battle.targetsFor(u, ui.selected) : [];
        $('#bwho').innerHTML = `${timer ? `<em id="btimer" style="font-style:normal;font-weight:800;color:#ffd36a">⏱ ${left}</em> ` : ''}<b></b> · <span></span> <i>${needs ? (S.target === 'enemy' ? 'Hedefe dokun.' : ui.legal.length === 1 ? 'Kendine dokun ya da tekrar dokun.' : 'Müttefike dokun.') : 'Kullanmak için tekrar dokun.'}</i>`;
        const cost = battle.costOf(u, ui.selected);
        $('#bwho b').textContent = `${u.name} — ${skillName(ui.selected, u.wt)}`; $('#bwho span').textContent = describe(S) + (cost ? ` Mana ${cost}.` : '');
        drawBar(usable); prim(true, SKILLS[ui.selected].type === 'basic' ? 'Saldır' : 'Kullan');
      };
      // 22 Kas (GPT 2340 teslimi): birincil Saldır/Kullan düğmesi — seçili yeteneği, hedef seçmeden kullanır: düşman hedefinde
      // sağ üst çerçevedeki düşman (geçerliyse) ya da ilk geçerli hedef, müttefikte canı en düşük olan. Kural ve motor aynı.
      ui.primary = () => {
        if (potLock()) return lockMsg();
        const id = ui.selected, T = SKILLS[id].target;
        if (T === 'enemy') { const t = ui.legal.includes(tgtId) ? tgtId : ui.legal[0]; if (t != null) ui.choose?.([id, t]); return; }
        if (T === 'ally') { const t = ui.legal.map(byId).filter(Boolean).sort((p, q) => p.shown / p.unit.maxHp - q.shown / q.unit.maxHp)[0]; if (t) ui.choose?.([id, t.unit.id]); return; }
        ui.choose?.([id, T === 'dead' ? battle.targetsFor(u, id)[0] : 0]);
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
      else floatText(c.headPos(), (f.weak ? 'ZAYIF! ' : '') + (f.crit ? 'KRİTİK ' : '') + (f.amt - f.abs) + (f.cut ? ' ▼' : ''), (f.crit ? 'crit' : 'dmg') + (f.weak ? ' weak' : ''), f.abs ? `◈ −${f.abs}` : ''); // 20 Kas: zayıf noktaya vuruş ayrı renkli 'ZAYIF!'
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
    const hit = [...new Set([...ev.fx.map(f => f.u), ev.target])].map(byId).filter(x => x && x !== A); // kameranın odaklanacağı hedefler
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
      // 22 Kas: yakın çekim artık animasyonu beklemez ve kesmez; kamera vuranla hedeflerine birlikte yumuşakça odaklanır
      KAM.focusSkill(A, hit, master);
      await wait(master ? 0.35 : 0.2);
      if (dmgs.length) { flashScreen(); slowmo(master ? 0.45 : 0.25); }
    } else KAM.focusAttack(A, hit); // normal saldırı: kısa, hafif odak
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
    KAM.settle(); // tabana dön (biri öldüyse taban yeniden hesaplanır)
    await wait(0.3);
  }

  // Boss ya da kapı kaptanı sahneye girdi: boss'ta kamera alçaktan yaklaşır, yer sarsılır, adı duyurulur; kaptanda yalnızca efekt.
  // Süreler oyun saatindedir: 3x hızda ve otomatik modda kısalır.
  async function bossIntro(a) {
    const c = a.char, k = c.scale, u = a.unit;
    if (!u.boss) { showBanner(u.name, 'Kapı kaptanı', 'B'); fx(EVENT_FX.boss, c); return wait(0.35); }
    bossCard(u);
    // 22 Kas: genişletilmiş kadraj (boss ve parti birlikte, biraz alçaktan bossa doğru); bitince yumuşak dönüş
    KAM.focusBoss(a, [...actors.values()].filter(x => x.unit.side === 'A' && !x.gone));
    await wait(0.7);
    fx(EVENT_FX.boss, c);
    tween(0.35, e => c.root.scale.setScalar(k * (0.88 + 0.12 * e)), ease.back);
    await wait(0.85);
    KAM.recover(); await wait(0.5);
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
        const rest = us.filter(u => !u.boss); // boss ayrı yerde; kalanlar kendi sayılarına göre dizilir
        const fresh = us.map(u => { const a = place(u, u.boss ? 1 : rest.length, u.boss ? 0 : rest.indexOf(u)); const z = a.home.z; a.char.pos.z = z - 4; tween(0.5, k => { a.char.pos.z = z - 4 + 4 * k; }, ease.out).then(() => fx(EVENT_FX.wave, a.char)); return a; });
        KAM.settle(true); // 22 Kas: yeni dalga → kadraj yeniden kurulur
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
          if (tk.killed) { a.shown = 0; a.char.die(); KAM.settle(); }
        }
        if (ev.enrage) { floatText(a.char.headPos(), `ÖFKE ×${ev.enrage}`, 'crit'); fx(EVENT_FX.enrage, a.char); }
        if (ev.skip) { floatText(a.char.headPos(), `${STATUS[ev.skip].icon} ${STATUS[ev.skip].name}`, 'st bad'); fx(EVENT_FX.skip, a.char, { s: ev.skip }); }
        if (ev.ticks.length || ev.skip) await wait(0.45);
        syncStatus(a);
      } else if (ev.t === 'skill') {
        if (ev.mp !== undefined && byId(ev.u)) byId(ev.u).shownMp = ev.mp;
        await playSkill(ev);
        ui.active = null; renderOrder(); syncBdw();
      } else if (ev.t === 'bdw') { // Anıt Savaşı: dirilme, anıt yenilenmesi, raunt
        const a = ev.u ? byId(ev.u) : null;
        if (ev.k === 'rise' && a) { a.char.revive(a.face, a.home); a.shown = ev.hp; a.hop = -1; fx(EVENT_FX.revive, a.char); floatText(a.char.headPos(), 'Döndü', 'heal'); syncStatus(a); KAM.settle(); await wait(0.25); }
        else if (ev.k === 'mend' && a) { a.shown = ev.hp; floatText(a.char.headPos(), `+${ev.amt}`, 'heal'); fx(EVENT_FX.heal, a.char, { color: 0xffd27a }); }
        else if (ev.k === 'round' && ev.n % 5 === 0 && ev.n < ev.of) showBanner(`Raunt ${ev.n + 1}/${ev.of}`, `Puan ${battle.bdw.pts.A}–${battle.bdw.pts.B}`, 'A');
        syncBdw();
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
    battleUI.hidden = true; BT.on = false; ashScene(false); KAM.end();
    onDone(r.over === 'A', actions);
  })();
}

// Hızlandırma (2x/3x) yalnız OTO açıkken (kullanıcı 19 Kas); OTO kapanınca hız 1x'e döner (erişilebilirlik yavaşlatması korunur)
const baseSpeed = () => (A11Y.speed < 1 ? A11Y.speed : 1);
// Birincil Saldır/Kullan düğmesi (22 Kas): sıra oyuncudayken açık; OTO açıkken de basılabilir (yapay zekâdan önce davranır)
function prim(on, label) { const b = document.getElementById('bprim'); if (!b) return; b.disabled = !on; if (label) b.textContent = label; }
document.getElementById('bprim')?.addEventListener('click', () => ui.primary?.());
function renderButtons() {
  if (ui.fast === false && ui.speed > 1) { ui.speed = baseSpeed(); clock.scale = ui.speed; } // 22 Kas (kullanıcı): hız OTO kapalıyken de 1x→2x→3x→1x döner
  $('#bauto').hidden = !OTO.ok(); { const b = $('#bapot'); if (b) { b.hidden = !OTO.ok() || !ui.hasPot; b.classList.toggle('on', potPref()); b.title = potPref() ? 'Oto İksir açık: OTO can %40, mana %15 altına inince iksir içer' : 'Oto İksir kapalı: OTO iksir harcamaz'; } } $('#bauto').classList.toggle('on', ui.auto); $('#bspeed').textContent = `${ui.speed}x`; $('#bspeed').classList.toggle('off', ui.fast === false);
}
$('#bauto').onclick = () => { if (potLock()) return lockMsg(); if (!OTO.ok()) return; document.querySelector('.oto-tip')?.remove(); ui.auto = !ui.auto; BT.auto = ui.auto; PREF.set('dd_oto', ui.auto ? '1' : '0'); if (ui.auto && [2, 3].includes(+PREF.get('dd_speed')) && ui.fast !== false) { ui.speed = +PREF.get('dd_speed'); clock.scale = ui.speed; } renderButtons(); if (ui.auto) ui.autoPick?.(); };
$('#bapot').onclick = () => { const on = !potPref(); PREF.set('dd_autopot', on ? '1' : '0'); if (ui.battle) ui.battle.noAutoPot = !on; const w = $('#bwho'); if (w) w.innerHTML = `<b>Oto İksir ${on ? 'açık' : 'kapalı'}</b> · <span>${on ? 'Can %40, mana %15 altına inince OTO iksir içer.' : 'OTO iksir harcamaz; istersen kendin içebilirsin.'}</span>`; renderButtons(); };
$('#bspeed').onclick = () => { if (ui.fast === false) { const w = $('#bwho'); if (w) w.innerHTML = '<b>Hızlandırma</b> · <span>2x ve 3x yalnız PvE ve tek oyunculu savaşta kullanılır.</span>'; return; } ui.speed = ui.speed < 1 ? 1 : ui.speed === 1 ? 2 : ui.speed === 2 ? 3 : (A11Y.speed < 1 ? A11Y.speed : 1); clock.scale = ui.speed; PREF.set('dd_speed', String(ui.speed)); renderButtons(); };
$('#bexit').onclick = () => (potLock() ? lockMsg() : ui.onExit?.());

let downAt = null;
const stage = document.getElementById('stage');
stage.addEventListener('pointerdown', e => { downAt = [e.clientX, e.clientY]; });
stage.addEventListener('pointerup', e => { if (downAt && Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) < 12 && !battleUI.hidden) onTap?.(e.clientX, e.clientY); });
