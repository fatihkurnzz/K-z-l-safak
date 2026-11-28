// 22 Kas (GPT "Dinamik Sinematik Kamera" paketi): savaş kamerası durum makinesi. Yalnız sunum: motor, tur/dalga, hasar,
// hedefleme ve sohbet değişmez. combat.js olaylarda çağırır (saldırı, yetenek, boss girişi, dalga, ölüm), her karede step(dt).
//
// Durumlar: ESTABLISH (açılış süzülmesi) · IDLE (taban kadraj) · FOCUS_ATTACK (normal saldırıda kısa, hafif yaklaşma)
//   · FOCUS_SKILL (özel yetenekte daha belirgin odak, hafif yan açı) · FOCUS_BOSS (boss girişinde boss + parti geniş kadraj)
//   · RECOMPOSE (birim doğunca/ölünce taban kadrajın yeniden kurulması) · RECOVER (odaktan tabana yumuşak dönüş).
// Her istek bir öncekini keser: hedef değişir, kamera bulunduğu yerden ve hızından yumuşakça döner (sıçrama yok).
// Kadraj sabit sayılarla değil, birimlerin dünya sınırlarından (ayak + baş + can çubuğu payı), kameranın görüş açısından,
// ekran oranından ve savaş arayüzünün güvenli alanından (DOM'dan ölçülür) hesaplanır. Hesap yalnız olaylarda yapılır.
import { THREE, camRig, camera } from './engine3d.js';

// Taban bakış: kamera +x yanında (parti solda, düşman sağda); YAW partiye doğru döndürür (parti önde, düşman orta planda),
// PITCH aşağı bakış (boyalı arka planların ufkuna yakın, alçak üç-çeyrek).
export const VIEW = { yaw: 0.3, pitch: 0.2 };
const DUR = { establish: 1.6, attack: 0.38, skill: 0.6, master: 0.85, boss: 1.0, recompose: 0.8, recover: 0.55 };
const ZOOM_MAX = 0.12; // açılışta taban kadrajdan en çok bu oranda uzaktan başlar
const D_MIN = 9.5, D_MAX = 40; // kamera-sahne uzaklığı sınırları (zemine/perdeye girmez)

const v = () => new THREE.Vector3();
const K = {
  state: 'OFF', on: false, actors: null, sig: '',
  pos: v(), look: v(), vp: v(), vl: v(), // anlık (yay ile hedefe gider)
  gPos: v(), gLook: v(), st: 0.3, // hedef ve yumuşatma süresi
  idle: { pos: v(), look: v(), d: 14 }, hold: 0, after: null,
  safe: null,
};
if (typeof window !== 'undefined') window.DD_CAM = K; // test: durum ve kadraj okunur

// Güvenli alan (NDC): üstte oyuncu kartı / hedef / boss çubuğu, altta yetenek çubuğu ve sağ alt düğmeler. Görünür
// öğelerin kutularından ölçülür; ölçülemezse 880×406 telefondaki değerler.
function measureSafe() {
  const W = innerWidth, H = innerHeight;
  let top = 0.17 * H, bot = 0.72 * H;
  const box = s => { const e = document.querySelector(s); if (!e || e.hidden || !e.offsetParent && getComputedStyle(e).position !== 'fixed') return null; const r = e.getBoundingClientRect(); return r.width && r.height ? r : null; };
  // üst: savaş arayüzünün üst kenara yapışık görünür kutuları (oyuncu kartı, hedef, boss çubuğu, dalga); en çok %30
  for (const e of document.querySelectorAll('#battleUI > *')) {
    if (e.hidden || e.id === 'skills' || e.id === 'bwho') continue;
    const r = e.getBoundingClientRect(); if (!r.width || !r.height || getComputedStyle(e).visibility === 'hidden') continue;
    if (r.top < H * 0.12 && r.bottom < H * 0.4 && r.width < W * 0.6) top = Math.max(top, Math.min(r.bottom, H * 0.3));
  }
  // alt: sol (parti) yetenek çubuğunun, sağ (düşman) sağ alt düğmelerin üstünde kalır
  let botR = bot;
  { const r = box('#skills'); if (r && r.top > H * 0.5) bot = Math.min(bot, r.top); }
  { const r = box('#bctl2'); if (r && r.top > H * 0.5) botR = Math.min(H * 0.86, r.top); else botR = bot; }
  const nd = y => 1 - 2 * y / H;
  return { xl: -0.94, xr: 0.94, yt: nd(top + 4), yb: nd(bot - 2), ybR: nd(Math.max(bot, botR) - 2), W, H };
}

// Kamera tabanı (r sağ, u yukarı, f ileri) yaw/pitch'ten
function basis(yaw, pitch) {
  const f = new THREE.Vector3(-Math.cos(pitch) * Math.cos(yaw), -Math.sin(pitch), -Math.cos(pitch) * Math.sin(yaw));
  const r = new THREE.Vector3().crossVectors(f, new THREE.Vector3(0, 1, 0)).normalize();
  const u = new THREE.Vector3().crossVectors(r, f);
  return { f, r, u };
}
// Noktaların hepsini güvenli alana sığdıran en yakın kamera (yön sabit). a, b: yanal/dikey kaydırma; d: uzaklık.
// Verilen d için a ve b'nin olurlu aralığı doğrusal eşitsizliklerden çıkar; en küçük olurlu d ikili aramayla bulunur.
export function fit(points, yaw, pitch, safe, dMin = D_MIN) {
  const { f, r, u } = basis(yaw, pitch);
  const tV = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2), tH = tV * camera.aspect;
  const P = points.map(p => [p.dot(r), p.dot(u), p.dot(f), p.side === 'B' ? safe.ybR ?? safe.yb : safe.yb]);
  const cmin = P.reduce((m, p) => Math.min(m, p[2]), Infinity);
  const solve = d => {
    let al = -Infinity, ah = Infinity, bl = -Infinity, bh = Infinity;
    for (const [pr, pu, pf, yb] of P) {
      const z = pf + d; if (z < 0.5) return null;
      al = Math.max(al, pr - safe.xr * tH * z); ah = Math.min(ah, pr - safe.xl * tH * z);
      bl = Math.max(bl, pu - safe.yt * tV * z); bh = Math.min(bh, pu - yb * tV * z);
    }
    return al <= ah && bl <= bh ? { a: (al + ah) / 2, b: (bl + bh) / 2 } : null;
  };
  let lo = Math.max(dMin, 0.6 - cmin), hi = D_MAX, best = solve(lo) ? lo : null;
  if (best === null) { for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (solve(m)) hi = m; else lo = m; } best = hi; }
  const s = solve(best) || { a: 0, b: 0 };
  const pos = r.clone().multiplyScalar(s.a).addScaledVector(u, s.b).addScaledVector(f, -best);
  const depth = P.reduce((m, p) => m + p[2], 0) / P.length + best; // bakış noktası: birimlerin ortalama derinliği
  const look = pos.clone().addScaledVector(f, depth);
  if (pos.y < 0.7) { const k = 0.7 - pos.y; pos.y += k; look.y += k; } // zemin altına inmez
  return { pos, look, d: best };
}

// Birimin kadraj noktaları: ayak, baş + can çubuğu payı, iki yanı (genişlik)
function pts(a, out, home = true) {
  if (!a || a.gone || !a.char?.root.visible) return out;
  const c = a.char, base = home && a.home ? a.home : c.pos, k = c.scale || 1;
  let h; try { h = c.headPos().y - c.pos.y; } catch { h = 1.9 * k; }
  h = Math.max(0.8, h) + 0.45 * Math.max(1, k * 0.8); // baş üstündeki seviye + can çubuğu
  const w = 0.55 * Math.max(0.8, k);
  for (const dy of [0, h]) for (const dx of [-w, w]) { const p = new THREE.Vector3(base.x + dx * 0.6, base.y + dy, base.z + dx); p.side = a.unit?.side; out.push(p); }
  return out;
}
const alive = () => [...K.actors.values()].filter(a => !a.gone && a.unit?.alive !== false);
const sigOf = () => alive().map(a => a.unit.id).join(',');

function computeIdle() {
  K.safe = measureSafe();
  const P = []; for (const a of alive()) pts(a, P);
  if (!P.length) return K.idle;
  const r = fit(P, VIEW.yaw, VIEW.pitch, K.safe);
  K.idle = r; K.sig = sigOf();
  return r;
}
function go(pos, look, dur, state) {
  K.gPos.copy(pos); K.gLook.copy(look); K.st = Math.max(0.05, dur / 3.2); K.state = state;
}

// Savaş başı: aktörler (combat.js haritası) ve öngörülen ilk dalga noktaları (projektör için)
export function begin(actors, predicted) {
  K.actors = actors; K.on = true; K.hold = 0; K.after = null;
  K.safe = measureSafe();
  const P = predicted?.length ? predicted : [];
  for (const a of actors.values()) pts(a, P);
  const r = P.length ? fit(P, VIEW.yaw, VIEW.pitch, K.safe) : { pos: new THREE.Vector3(13, 4, 3), look: new THREE.Vector3(0, 1.3, 0), d: 14 };
  K.idle = r;
  // açılış: biraz yukarıdan ve en çok %12 uzaktan süzülür
  const { f } = basis(VIEW.yaw, VIEW.pitch + 0.12);
  const start = r.look.clone().addScaledVector(f, -r.d * (1 + ZOOM_MAX));
  K.pos.copy(start); K.look.copy(r.look); K.vp.set(0, 0, 0); K.vl.set(0, 0, 0);
  camRig.pos.copy(K.pos); camRig.look.copy(K.look);
  go(r.pos, r.look, DUR.establish, 'ESTABLISH');
  return r;
}
export function end() { K.on = false; K.state = 'OFF'; K.actors = null; }

// Birimler değişti (dalga, ölüm, dirilme): taban kadraj yeniden hesaplanır. Odaktayken yalnız taban güncellenir; dönüş yeni tabana olur.
export function settle(force = false) {
  if (!K.on) return;
  if (!force && sigOf() === K.sig) { if (K.state.startsWith('FOCUS')) recover(); return; }
  const r = computeIdle();
  if (K.state.startsWith('FOCUS') || K.state === 'ESTABLISH') { if (K.state.startsWith('FOCUS')) recover(); else go(r.pos, r.look, DUR.establish * 0.6, 'ESTABLISH'); return; }
  go(r.pos, r.look, DUR.recompose, 'RECOMPOSE');
}
export function recover() { if (!K.on) return; go(K.idle.pos, K.idle.look, DUR.recover, 'RECOVER'); }

// Odak: taban kadrajla odak kadrajı (vuran + hedefler) arasında k oranında bir nokta; yakınlaşma sınırlı (yetenek animasyonu,
// can çubukları ve hedefler kadrajda kalır). dyaw/dpitch: hafif açı değişimi.
function focusOn(list, k, dyaw, dpitch, dur, state, zoomCap) {
  if (!K.on) return;
  const P = []; for (const a of list) pts(a, P, false);
  if (!P.length) return;
  const r = fit(P, VIEW.yaw + dyaw, VIEW.pitch + dpitch, K.safe || measureSafe(), D_MIN * 0.8);
  const I = K.idle, pos = I.pos.clone().lerp(r.pos, k), look = I.look.clone().lerp(r.look, k);
  // yakınlaşma sınırı: odak içeriğinin ortasına uzaklık, tabandakinin (1 - zoomCap) katından az, tabandakinden çok olmaz
  const c = P.reduce((m, p) => m.add(p), new THREE.Vector3()).multiplyScalar(1 / P.length);
  const d0 = I.pos.distanceTo(c), d1 = pos.distanceTo(c), d = Math.min(d0, Math.max(d0 * (1 - zoomCap), d1));
  if (Math.abs(d - d1) > 1e-3) { const sh = pos.clone().sub(c).setLength(d).add(c).sub(pos); pos.add(sh); look.add(sh); }
  if (pos.y < 0.7) { look.y += 0.7 - pos.y; pos.y = 0.7; }
  go(pos, look, dur, state);
}
export function focusAttack(att, targets) { focusOn([att, ...targets], 0.35, 0, 0, DUR.attack, 'FOCUS_ATTACK', 0.1); }
export function focusSkill(att, targets, master) {
  const s = att.unit.side === 'A' ? 1 : -1;
  focusOn([att, ...targets], master ? 0.7 : 0.55, 0.1 * s, -0.03, master ? DUR.master : DUR.skill, 'FOCUS_SKILL', master ? 0.24 : 0.18);
}
// Boss girişi: boss ve parti birlikte (genişletilmiş kadraj), biraz alçaktan bossa doğru açı
export function focusBoss(boss, party) {
  if (!K.on) return;
  K.safe = measureSafe();
  const P = []; pts(boss, P); for (const a of party) pts(a, P);
  const r = fit(P, VIEW.yaw - 0.12, VIEW.pitch - 0.06, K.safe);
  const look = r.look.clone().lerp(boss.home.clone().setY(r.look.y + 0.4), 0.35);
  go(r.pos.clone().add(look).sub(r.look), look, DUR.boss, 'FOCUS_BOSS');
}

// Her kare (oyun saatiyle: hız 2x/3x'te geçişler de kısalır). Yay: kritik sönümlü (Unity SmoothDamp eşdeğeri).
function damp(cur, goal, vel, st, dt) {
  const w = 2 / st, x = w * dt, e = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
  const cx = cur.x - goal.x, cy = cur.y - goal.y, cz = cur.z - goal.z;
  const tx = (vel.x + w * cx) * dt, ty = (vel.y + w * cy) * dt, tz = (vel.z + w * cz) * dt;
  vel.set((vel.x - w * tx) * e, (vel.y - w * ty) * e, (vel.z - w * tz) * e);
  cur.set(goal.x + (cx + tx) * e, goal.y + (cy + ty) * e, goal.z + (cz + tz) * e);
}
export function step(dt) {
  if (!K.on || !(dt > 0)) return;
  dt = Math.min(dt, 0.1);
  damp(K.pos, K.gPos, K.vp, K.st, dt); damp(K.look, K.gLook, K.vl, K.st, dt);
  if (K.pos.y < 0.6) K.pos.y = 0.6;
  camRig.pos.copy(K.pos); camRig.look.copy(K.look);
  if ((K.state === 'ESTABLISH' || K.state === 'RECOVER' || K.state === 'RECOMPOSE') && K.pos.distanceToSquared(K.gPos) < 1e-4 && K.vp.lengthSq() < 1e-4) K.state = 'IDLE';
}
export const camState = () => K.state;
export const idleView = () => K.idle;
