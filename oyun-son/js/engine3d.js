// Three.js çekirdeği: renderer, grafik kademesi, ışık/gölge ve ortam yansıması, kamera, tween sistemi,
// havuzlanmış parçacıklar, ekrandaki yazılar.
// Çizim hattı: sahne doğrusal renk uzayında çizilir → (Orta/Yüksek) HDR ara tampon, yalnızca ışıyan yüzeyleri tutan bloom
// → ACES ton eşleme (sahneye göre pozlama) → sRGB çıkış. Düşük kademede ara tampon yoktur: sahne doğrudan ekrana çizilir.
// Kademe (gfx.js) çalışırken değişebilir: piksel oranı, ara tamponlar, gölge haritası ve parçacık havuzu yeniden kurulur.
import * as THREE from '../vendor/three/build/three.module.min.js';
import { EffectComposer } from '../vendor/three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from '../vendor/three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from '../vendor/three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from '../vendor/three/examples/jsm/postprocessing/OutputPass.js';
import { view, onView, toLocal } from './orient.js';
import { A as A11Y } from './a11y.js'; // erişilebilirlik: sarsıntı, vuruş donması, ışıma kapatılabilir
import { gfx, initGfx, onTier, frameSample, pauseGovernor, getGfx, setGfx, TIERS } from './gfx.js';

export { THREE, gfx, onTier, pauseGovernor };
export const clock = { scale: 1, time: 0 };

export const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
// Cihaz ipuçları: ekran kartının adı ancak WebGL bağlamından öğrenilir (gfx.js: pickTier)
{
  let gpu = '';
  try { const gl = renderer.getContext(), e = gl.getExtension('WEBGL_debug_renderer_info'); gpu = String(gl.getParameter(e ? e.UNMASKED_RENDERER_WEBGL : gl.RENDERER) || ''); } catch { }
  initGfx({ gpu, memory: navigator.deviceMemory, cores: navigator.hardwareConcurrency, dpr: window.devicePixelRatio, mobile: !!window.matchMedia?.('(pointer: coarse)').matches, saveData: !!navigator.connection?.saveData });
}
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.shadowMap.autoUpdate = false; // gölge haritası kademeye göre her karede ya da iki karede bir yenilenir (aşağıda)
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.9;
renderer.info.autoReset = false; // kare başına sayım (gölge + sahne + işlem sonrası birlikte): gfxStats()
document.getElementById('stage').appendChild(renderer.domElement);

export const scene = new THREE.Scene();
export const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200);
const overlay = document.getElementById('overlay');

// ---------- Pozlama ----------
// Her ortam kendi pozlamasını verir (models.js: buildEnv); zafer/yenilgi anında kısa süreli çarpan uygulanır.
const expo = { base: 0.9, mul: 1 };
export function setExposure(v) { expo.base = v; renderer.toneMappingExposure = expo.base * expo.mul; }
export function setExposureMul(k) { expo.mul = k; renderer.toneMappingExposure = expo.base * expo.mul; }
// İskeletli modellerin dokusundaki "kendinden aydınlık" payı sabit pozlamaya (0,9) göre ayarlanmıştır; pozlaması açılan
// sahnede (gece ana üs) bu pay da büyüyüp modeli soluk bir hayalete çevirmesin diye pozlamayla ters orantılı kısılır.
export const selfLitK = () => Math.max(0.5, Math.min(1.1, 0.9 / expo.base));

// ---------- Ortam yansıması ----------
// PBR malzemelerin (plaka zırh, silah, iskeletli modeller) metal gibi okunması için küçük bir ortam haritası üretilir:
// göğün geçişi (üstten ufka), zemin rengi, güneş yönünde sıcak bir ışık levhası, arkada kontur levhası ve tepede
// yumuşak bir dolgu. Böylece yansımalar sahnenin havasına, günün evresine ve havaya uyar. Harita küçük bir küp
// hedefine çizilir ve PMREM ile pürüzlülüğe göre süzülür; Düşük kademede açılışta bir kez üretilir.
const pmrem = new THREE.PMREMGenerator(renderer);
const sky = (() => {
  const s = new THREE.Scene();
  const geo = new THREE.SphereGeometry(20, 24, 12);
  geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(geo.attributes.position.count * 3), 3));
  const dome = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, toneMapped: false, fog: false }));
  s.add(dome);
  const card = (w, h) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ toneMapped: false, fog: false, side: THREE.DoubleSide })); s.add(m); return m; };
  const sun = card(9, 9), rim = card(7, 10), top = card(16, 16), warm = card(5, 3);
  top.position.set(0, 18, 0); top.lookAt(0, 0, 0);
  warm.position.set(-10, 1.5, 6).setLength(17); warm.lookAt(0, 0, 0);
  return { s, dome, sun, rim, top, warm, cube: null, cam: null, size: 0 };
})();
let envRT = null, envKey = '', studioRT = null;
const cA = new THREE.Color(), cB = new THREE.Color();
// spec: { sky: [üstten ufka renkler], ground, sun, sunI, rim, rimI, torch, dir: güneşin yönü } · renkler onaltılık sayı ya da '#rrggbb'
export function setSkyEnv(spec) {
  const size = gfx.tier === 'high' ? 128 : 64, key = size + JSON.stringify(spec); // kademe değişince harita yeni boyutuyla yeniden üretilir
  if (envRT && (key === envKey || !gfx.T.envMap)) return;
  if (!sky.cube || sky.size !== size) { sky.cube?.dispose(); sky.cube = new THREE.WebGLCubeRenderTarget(size, { type: THREE.HalfFloatType }); sky.cam = new THREE.CubeCamera(0.5, 60, sky.cube); sky.size = size; }
  const pos = sky.dome.geometry.attributes.position, col = sky.dome.geometry.attributes.color, stops = spec.sky, n = stops.length - 1;
  for (let i = 0; i < pos.count; i++) {
    const h = pos.getY(i) / 20; // 1 tepe · 0 ufuk · −1 zemin
    if (h < 0) cA.set(spec.ground).lerp(cB.set(stops[n]), Math.max(0, 1 + h * 4)).multiplyScalar(0.9);
    else { const t = (1 - h) * n, a = Math.min(n, Math.floor(t)); cA.set(stops[a]).lerp(cB.set(stops[Math.min(n, a + 1)]), t - a).multiplyScalar(1.5); }
    col.setXYZ(i, cA.r, cA.g, cA.b);
  }
  col.needsUpdate = true;
  const dir = spec.dir || [6, 11, 5];
  sky.sun.position.set(dir[0], dir[1], dir[2]).setLength(17); sky.sun.lookAt(0, 0, 0);
  sky.rim.position.set(-Math.sign(dir[0] || 1) * 6, 5, -8).setLength(17); sky.rim.lookAt(0, 0, 0);
  sky.sun.material.color.set(spec.sun).multiplyScalar(4 + 5 * spec.sunI);
  sky.rim.material.color.set(spec.rim).multiplyScalar(2 + 4 * spec.rimI);
  sky.top.material.color.set(stops[0]).lerp(cB.set(0xffffff), 0.35).multiplyScalar(1.2 + 0.5 * spec.sunI);
  sky.warm.material.color.set(0xff9a4a).multiplyScalar(6 * (spec.torch || 0));
  const rt = renderer.getRenderTarget();
  sky.cam.update(renderer, sky.s);
  const next = pmrem.fromCubemap(sky.cube.texture);
  renderer.setRenderTarget(rt);
  if (envRT !== studioRT) envRT?.dispose();
  envRT = next; envKey = key;
  scene.environment = envRT.texture;
}
// Açılıştaki yansıma yansız bir "stüdyo" ortamıdır (Düşük kademede sahneler de bunu kullanır); portreler (portraits.js) hep bununla çizilir ki sahnenin
// evresi ve havası portrenin rengini değiştirmesin. Sahneler kendi ortamını kurunca bu harita silinmez.
setSkyEnv({ sky: ['#26344e', '#55657e', '#a8997e'], ground: 0x3a342c, sun: 0xffe6c4, sunI: 1, rim: 0x8fb4ff, rimI: 0.6, torch: 0.3 });
studioRT = envRT;
export const studioEnv = () => studioRT.texture;
// Portre çizimi için: sabit pozlamayla (sahneninkinden bağımsız) çiz, sonra sahnenin pozlamasına dön
export function withStudioExposure(fn) { const e = renderer.toneMappingExposure; renderer.toneMappingExposure = 0.9; try { fn(); } finally { renderer.toneMappingExposure = e; } }

// ---------- İşlem sonrası: bloom ----------
// Eşik doğrusal (HDR) parlaklığa göredir: güneşte en açık boyalı yüzey ~1,0'da kalır, bu yüzden 1,15 eşiğini yalnızca
// ışıyan yüzeyler (kor, pencere, büyü, artılı silah) ve metaldeki keskin yansımalar aşar.
const BLOOM = { strength: 0.5, radius: 0.42, threshold: 1.15 };
let composer = null, bloom = null, DPR = 1;
function dropComposer() {
  if (!composer) return;
  composer.passes.forEach(p => p.dispose?.()); composer.renderTarget1.dispose(); composer.renderTarget2.dispose();
  composer = bloom = null;
}
if (typeof window !== 'undefined') window.addEventListener('dd-a11y', () => { if (!!composer === !!A11Y.noBloom) buildComposer(); }); // ışıma ayarı değişince hat yeniden kurulur
function buildComposer() {
  dropComposer();
  const T = gfx.T;
  if (!T.post || A11Y.noBloom) return;
  // Kenar yumuşatma ara tamponda yapılır (ekran tamponunun yumuşatması işlem sonrasında işe yaramaz); yüksek piksel
  // oranında 2 örnek yeter. İkinci tampon hiç çizilmez (geçişler yer değiştirmez), bellek ayrılmaz.
  const samples = T.msaa ? (DPR >= 2 ? Math.min(2, T.msaa) : T.msaa) : 0;
  composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples }));
  composer.renderTarget2.samples = 0;
  composer.setPixelRatio(DPR);
  composer.addPass(new RenderPass(scene, camera));
  bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), BLOOM.strength, BLOOM.radius, BLOOM.threshold);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
}

// Kamera: yatay görüş açısını sabit tut ki dikey telefonda iki takım da sığsın
// nudge: kritik vuruşta hedefe doğru küçük, sönen itiş (sarsıntı değil; mide bulandırmaz)
export const camRig = { pos: new THREE.Vector3(0, 7, 11), look: new THREE.Vector3(0, 0.6, -0.4), hfov: 41, shake: 0, nudge: new THREE.Vector3() };
const shift = { x: 0, y: 0 };
const pBuf = new THREE.Vector2();
function resize() {
  const w = view.w, h = view.h; // mantıksal (yatay) ekran boyutu
  renderer.setSize(w, h);
  if (composer) { composer.setSize(w, h); bloom.setSize(Math.round(w * DPR / gfx.T.bloomDiv), Math.round(h * DPR / gfx.T.bloomDiv)); }
  camera.aspect = w / h;
  const v = 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(camRig.hfov / 2)) / camera.aspect);
  camera.fov = Math.max(42, Math.min(85, THREE.MathUtils.radToDeg(v)));
  // Görüş merkezi kaydırması: ana üste sol sütun ve alt çubuk sahneyi örtmesin diye sahne sağa/yukarı alınır
  if (shift.x || shift.y) camera.setViewOffset(w, h, -shift.x * w, -shift.y * h, w, h); else camera.clearViewOffset();
  camera.updateProjectionMatrix();
  renderer.getDrawingBufferSize(pBuf);
  for (const p of pools) p.mat.uniforms.px.value = pBuf.y * 0.5;
}
// Yatay görüş açısı (derece): dikey açı ekran oranından türetilir, böylece yatay kadraj her ekranda aynı kalır
export function setHfov(deg) { if (camRig.hfov === deg) return; camRig.hfov = deg; resize(); }
// fx, fy: ekran genişliği/yüksekliği oranı (+x sağa, +y aşağı)
export function setShift(fx = 0, fy = 0) { if (shift.x === fx && shift.y === fy) return; shift.x = fx; shift.y = fy; resize(); }

// ---------- Ana ışık ve gölge ----------
// Sahnede gölge düşüren tek ışık vardır (güneş/ay). Gölge kamerası sahnenin oynanan alanına sıkıca oturtulur ve dünyaya
// sabitlenir (kamerayla birlikte kaymaz); merkezi gölge haritasının piksel ızgarasına yuvarlanır, böylece kenarlar titremez.
// Sapma (bias) piksel boyuna göre ölçeklenir: zeminde ve bina yüzlerinde leke çıkmaz, gölge ayaktan kopmaz.
const keyL = { light: null, c: new THREE.Vector3(), r: 8 };
const lx = new THREE.Vector3(), ly = new THREE.Vector3(), lz = new THREE.Vector3(), lc = new THREE.Vector3();
export function setKeyLight(light, cx = 0, cz = 0, radius = 8) { keyL.light = light; keyL.c.set(cx, 0, cz); keyL.r = radius; applyShadow(); }
function applyShadow() {
  const L = keyL.light, size = gfx.T.shadow;
  if (!L) return;
  L.castShadow = size > 0;
  if (!size) { L.shadow.map?.dispose(); L.shadow.map = null; return; }
  const s = L.shadow, r = keyL.r, texel = 2 * r / size, dist = 22 + r;
  if (s.mapSize.x !== size) { s.mapSize.set(size, size); s.map?.dispose(); s.map = null; }
  lz.copy(L.userData.dir || lz.set(6, 11, 5)).normalize();
  lx.set(0, 1, 0).cross(lz).normalize(); ly.copy(lz).cross(lx);
  // merkezi ışık uzayında piksel ızgarasına yuvarla
  const u = Math.round(keyL.c.dot(lx) / texel) * texel, v = Math.round(keyL.c.dot(ly) / texel) * texel, w = keyL.c.dot(lz);
  lc.set(0, 0, 0).addScaledVector(lx, u).addScaledVector(ly, v).addScaledVector(lz, w);
  L.target.position.copy(lc); L.position.copy(lc).addScaledVector(lz, dist);
  if (!L.target.parent) L.parent?.add(L.target);
  L.target.updateMatrixWorld();
  Object.assign(s.camera, { left: -r, right: r, top: r, bottom: -r, near: 2, far: dist + r * 1.6 });
  s.camera.updateProjectionMatrix();
  s.bias = -texel * 0.035; s.normalBias = texel * 2.4;
  renderer.shadowMap.needsUpdate = true;
}

// ---- Tween ----
const tweens = [];
export const ease = {
  linear: t => t,
  inOut: t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  out: t => 1 - Math.pow(1 - t, 3),
  in: t => t * t * t,
  back: t => { const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
};
export function tween(dur, update, easing = ease.inOut) {
  return new Promise(resolve => tweens.push({ t: 0, dur: Math.max(0.001, dur), update, easing, resolve }));
}
// obj üzerindeki sayısal alanları hedef değerlere götürür
export function to(obj, target, dur, easing) {
  const from = {}; for (const k in target) from[k] = obj[k];
  return tween(dur, p => { for (const k in target) obj[k] = from[k] + (target[k] - from[k]) * p; }, easing);
}
export const wait = s => tween(s, () => {});
export function clearTweens() { tweens.length = 0; }

// ---- Parçacıklar (havuz) ----
// Bütün parçacıklar iki çizim çağrısıyla çizilir: ışıyanlar (toplamalı karışım) ve duman/toz (olağan karışım). Her havuzun
// sığası kademeye göre sabittir; parçacık doğurmak bellek ayırmaz, havuz doluysa yeni parçacık atlanır.
const P_VERT = `attribute vec3 col; attribute vec2 sa; varying vec3 vCol; varying float vA; uniform float px;
  void main(){ vCol = col; vA = sa.y; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv;
    gl_PointSize = max(1.0, sa.x * px * projectionMatrix[1][1] / -mv.z); }`;
const P_FRAG = `varying vec3 vCol; varying float vA; uniform float boost; uniform float soft;
  void main(){ float d = length(gl_PointCoord - 0.5) * 2.0; float a = smoothstep(1.0, soft, d) * vA; if (a < 0.004) discard;
    gl_FragColor = vec4(vCol * boost, a);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;
class Pool {
  constructor(additive) {
    this.additive = additive; this.n = 0; this.cap = 0;
    this.mat = new THREE.ShaderMaterial({ vertexShader: P_VERT, fragmentShader: P_FRAG, transparent: true, depthWrite: false,
      uniforms: { px: { value: 400 }, boost: { value: additive ? 2.4 : 1 }, soft: { value: additive ? 0.0 : 0.25 } },
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending });
    this.points = new THREE.Points(new THREE.BufferGeometry(), this.mat);
    this.points.frustumCulled = false; this.points.renderOrder = additive ? 8 : 7;
    scene.add(this.points);
  }
  resize(cap) {
    this.cap = cap; this.n = 0;
    this.pos = new Float32Array(cap * 3); this.col = new Float32Array(cap * 3); this.sa = new Float32Array(cap * 2);
    this.vel = new Float32Array(cap * 3); this.dat = new Float32Array(cap * 6); // ömür, en çok ömür, yerçekimi, sürtünme, boy, büyüme
    const g = this.points.geometry; g.dispose();
    const ng = this.points.geometry = new THREE.BufferGeometry();
    for (const [k, a, n] of [['position', this.pos, 3], ['col', this.col, 3], ['sa', this.sa, 2]]) { const at = new THREE.BufferAttribute(a, n); at.setUsage(THREE.DynamicDrawUsage); ng.setAttribute(k, at); }
    ng.setDrawRange(0, 0);
  }
  add(x, y, z, vx, vy, vz, r, g, b, size, life, gravity, drag, grow) {
    if (this.n >= this.cap) return;
    const i = this.n++, i3 = i * 3, i6 = i * 6;
    this.pos[i3] = x; this.pos[i3 + 1] = y; this.pos[i3 + 2] = z;
    this.vel[i3] = vx; this.vel[i3 + 1] = vy; this.vel[i3 + 2] = vz;
    this.col[i3] = r; this.col[i3 + 1] = g; this.col[i3 + 2] = b;
    this.dat[i6] = life; this.dat[i6 + 1] = life; this.dat[i6 + 2] = gravity; this.dat[i6 + 3] = drag; this.dat[i6 + 4] = size; this.dat[i6 + 5] = grow;
  }
  update(dt) {
    const { pos, vel, col, sa, dat } = this;
    for (let i = this.n - 1; i >= 0; i--) {
      const i3 = i * 3, i6 = i * 6;
      if ((dat[i6] -= dt) <= 0) { // son parçacığı bu yuvaya taşı
        const j = --this.n, j3 = j * 3, j6 = j * 6;
        if (j !== i) { for (let k = 0; k < 3; k++) { pos[i3 + k] = pos[j3 + k]; vel[i3 + k] = vel[j3 + k]; col[i3 + k] = col[j3 + k]; } for (let k = 0; k < 6; k++) dat[i6 + k] = dat[j6 + k]; sa[i * 2] = sa[j * 2]; sa[i * 2 + 1] = sa[j * 2 + 1]; }
        continue;
      }
      const k = 1 - dat[i6] / dat[i6 + 1], drag = Math.max(0, 1 - dat[i6 + 3] * dt);
      vel[i3] *= drag; vel[i3 + 1] = vel[i3 + 1] * drag + dat[i6 + 2] * dt; vel[i3 + 2] *= drag;
      pos[i3] += vel[i3] * dt; pos[i3 + 1] += vel[i3 + 1] * dt; pos[i3 + 2] += vel[i3 + 2] * dt;
      sa[i * 2] = dat[i6 + 4] * (1 + dat[i6 + 5] * k);
      sa[i * 2 + 1] = this.additive ? 1 - k * k : Math.min(1, k * 6) * (1 - k) * 0.55; // duman önce belirir, sonra dağılır
    }
    const g = this.points.geometry;
    g.setDrawRange(0, this.n);
    if (this.n || this.dirty) { g.attributes.position.needsUpdate = g.attributes.col.needsUpdate = g.attributes.sa.needsUpdate = true; }
    this.dirty = this.n > 0;
  }
}
const pools = [new Pool(true), new Pool(false)];
const [glowPool, smokePool] = pools;
const pc = new THREE.Color();
// Tek parçacık (bellek ayırmaz). color: onaltılık sayı · size: dünya birimi · smoke: duman havuzu
export function particle(x, y, z, vx, vy, vz, color, size = 0.08, life = 0.6, gravity = 0, drag = 0, grow = 0, smoke = false) {
  pc.setHex(color);
  (smoke ? smokePool : glowPool).add(x, y, z, vx, vy, vz, pc.r, pc.g, pc.b, size, life, gravity, drag, grow);
}
// Patlama: pos çevresine saçılan parçacıklar. Sayı kademeye göre azaltılır (Düşük: yarısı, en az 1).
export function burst(pos, { color = 0xffaa33, count = 14, speed = 3, size = 0.08, life = 0.7, gravity = -4, up = 1, spread = 1, drag = 0, grow = 0, smoke = false } = {}) {
  const n = gfx.T.fx ? count : Math.max(1, Math.round(count * 0.5)), pool = smoke ? smokePool : glowPool;
  pc.setHex(color);
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, vx = Math.cos(a) * spread, vy = up * (0.5 + Math.random()), vz = Math.sin(a) * spread;
    const k = speed * (0.4 + Math.random() * 0.6) / (Math.hypot(vx, vy, vz) || 1);
    pool.add(pos.x, pos.y, pos.z, vx * k, vy * k, vz * k, pc.r, pc.g, pc.b, size * (0.6 + Math.random() * 0.8) * 2.2, life * (0.7 + Math.random() * 0.5), gravity, drag, grow);
  }
}
export function clearParticles() { for (const p of pools) { p.n = 0; p.dirty = true; } }
// Duman ışık almaz; gece parlamasın diye rengi sahnenin ortam ışığıyla çarpılır (models.js: buildEnv verir)
export function setSmokeLight(k) { smokePool.mat.uniforms.boost.value = k; }
export const particleCount = () => glowPool.n + smokePool.n;

// ---- Ekran üstü yazılar (hasar sayıları) ve 3D'ye bağlı HTML ----
const v3 = new THREE.Vector3(), prj = { x: 0, y: 0, behind: false };
export function project(pos) {
  v3.copy(pos).project(camera);
  return { x: (v3.x * 0.5 + 0.5) * view.w, y: (-v3.y * 0.5 + 0.5) * view.h, behind: v3.z > 1 };
}
// project() ile aynı; her karede çağıran yerler için bellek ayırmayan sürümü (dönen nesne ortaktır, saklanmamalı)
export function projectTo(pos) {
  v3.copy(pos).project(camera);
  prj.x = (v3.x * 0.5 + 0.5) * view.w; prj.y = (-v3.y * 0.5 + 0.5) * view.h; prj.behind = v3.z > 1;
  return prj;
}
const floaters = [];
// sub: sayının yanındaki küçük ek (ör. kalkanın emdiği). Aynı birimin üstünde art arda çıkan yazılar üst üste binmesin
// diye her biri bir satır aşağıdan başlar (row); hepsi aynı hızla yükseldiği için sonra da çakışmazlar.
export function floatText(pos, text, cls = '', sub = '') {
  const el = document.createElement('div');
  el.className = 'float ' + cls;
  el.textContent = text;
  if (sub) { const s = document.createElement('small'); s.textContent = sub; el.appendChild(s); }
  overlay.appendChild(el);
  let row = 0;
  for (const f of floaters) if (f.max - f.life < 0.3 && f.pos.distanceToSquared(pos) < 0.5) row = Math.max(row, f.row + 1);
  floaters.push({ el, pos: pos.clone(), life: 1.1, max: 1.1, dx: (Math.random() - 0.5) * 30, row });
}
function updateFloaters(dt) {
  for (let i = floaters.length - 1; i >= 0; i--) {
    const f = floaters[i];
    f.life -= dt;
    const k = 1 - f.life / f.max;
    const s = projectTo(f.pos);
    f.el.style.transform = `translate(${s.x + f.dx * k}px, ${s.y - 70 * k + f.row * 21}px) translate(-50%,-50%) scale(${k < 0.15 ? 0.6 + k * 4 : 1})`;
    f.el.style.opacity = f.life < 0.3 ? f.life / 0.3 : 1;
    if (f.life <= 0) { f.el.remove(); floaters.splice(i, 1); }
  }
}
export function clearFloaters() { floaters.forEach(f => f.el.remove()); floaters.length = 0; }

// ---- Kademe uygulaması ----
function applyTier() {
  const T = gfx.T;
  DPR = Math.min(window.devicePixelRatio || 1, T.dpr);
  renderer.setPixelRatio(DPR);
  buildComposer();
  glowPool.resize(T.particles); smokePool.resize(Math.max(24, T.particles >> 2));
  applyShadow();
  resize();
  pauseGovernor(2500); // yeniden kurulan tamponlar ve derlenen gölgelendiriciler ölçümü yanıltmasın
}
applyTier();
onTier(applyTier);
onView(resize);

// ---- Ana döngü ----
const updaters = new Set();
export function onUpdate(fn) { updaters.add(fn); return () => updaters.delete(fn); }
// Kısa duraklama (kritik vuruş): gerçek sürede sayılır, oyun hızından ve otomatik moddan etkilenmez
let stopT = 0;
export function hitStop(sec) { if (A11Y.noStop) return; stopT = Math.max(stopT, sec); }
export function nudgeCam(dx, dy, dz) { camRig.nudge.set(dx, dy, dz); }

const stats = { ms: 16.7, calls: 0, triangles: 0, points: 0, frames: 0 };
let last = performance.now(), frame = 0;
// Kare hızı sınırı (telefon ısınmasın): savaş 60 (Düşük/En Düşük kademede 30), ana üs ve öbür sahneler 30,
// tam ekran pencere açıkken (arka sahne karartılı) 15 kare/sn.
// Ekran yenilemesi sınırdan hızlıysa kareler atlanır; zaman gerçek geçen süreyle ilerler.
const winEl = document.getElementById('win'), battleEl = document.getElementById('battleUI');
const touchDev = matchMedia('(pointer: coarse)').matches;
export const FPS_CAP = { battle: 60, battleLow: 30, scene: 30, win: 15, winFull: 5 };
export function fpsCap() {
  if (winEl && !winEl.hidden) return winEl.classList.contains('full') ? FPS_CAP.winFull : FPS_CAP.win; // 20 Kas: tam ekran pencere sahneyi neredeyse örter → 5 kare/sn (pil, ısınma)
  if (battleEl && !battleEl.hidden) return gfx.T.fx >= 1 && gfx.T.shadow && !touchDev ? FPS_CAP.battle : FPS_CAP.battleLow; // telefonda savaş da 30 (ısınma)
  return FPS_CAP.scene;
}
// Kaydırma akıcılığı (19 Kas, kullanıcı: "ekranlar kaydırırken takılıyor"): pencere ya da kutu açıkken kaydırma sürerken
// (son dokunuş/kaydırmadan 220 ms) 3B sahne hiç çizilmez; ana iş parçacığı yalnız kaydırmaya kalır.
const modalEl = document.getElementById('modal');
let scrollUntil = 0;
const onScrollish = () => { scrollUntil = performance.now() + 220; };
for (const ev of ['scroll', 'touchmove', 'wheel']) document.addEventListener(ev, onScrollish, { capture: true, passive: true });
renderer.setAnimationLoop(now => {
  if (now < scrollUntil && ((winEl && !winEl.hidden) || (modalEl && !modalEl.hidden))) return;
  const capMs = 1000 / fpsCap();
  if (now - last < capMs - 4) return; // ekran yenilemesine göre en yakın uygun kareyi bekle (60 Hz'de 30 = iki karede bir)
  const rawMs = now - last, realDt = Math.min(0.05, rawMs / 1000);
  last = now; frame++;
  // denetçi gerçek kare süresini görsün: sınırın getirdiği bekleme çıkarılır (sınır yüzünden kademe düşmesin)
  if (capMs > 17) { if (capMs <= 34) frameSample(Math.max(1, rawMs - capMs + 1000 / 60)); else pauseGovernor(1000); } else frameSample(rawMs);
  let dt = realDt * clock.scale;
  if (stopT > 0) { stopT -= realDt; dt *= 0.05; }
  clock.time += dt;
  for (let i = tweens.length - 1; i >= 0; i--) {
    const tw = tweens[i];
    tw.t += dt;
    const p = Math.min(1, tw.t / tw.dur);
    tw.update(tw.easing(p));
    if (p >= 1) { tweens.splice(i, 1); tw.resolve(); }
  }
  for (const fn of updaters) fn(dt, clock.time);
  for (const p of pools) p.update(dt);
  camRig.shake = Math.max(0, camRig.shake - realDt * 2.5);
  camera.position.copy(camRig.pos);
  if (camRig.shake > 0 && !A11Y.noShake) { const k = camRig.shake * 0.3; camera.position.x += (Math.random() - 0.5) * k; camera.position.y += (Math.random() - 0.5) * k; }
  if (camRig.nudge.lengthSq() > 1e-6) { camera.position.add(camRig.nudge); camRig.nudge.multiplyScalar(Math.max(0, 1 - realDt * 9)); }
  camera.lookAt(camRig.look);
  updateFloaters(realDt);
  const every = gfx.T.shadowEvery;
  if (every && frame % every === 0) renderer.shadowMap.needsUpdate = true;
  renderer.info.reset();
  if (composer) composer.render(); else renderer.render(scene, camera);
  const inf = renderer.info.render;
  stats.calls = inf.calls; stats.triangles = inf.triangles; stats.points = inf.points; stats.frames++;
  if (rawMs < 1000) stats.ms += (rawMs - stats.ms) * 0.05;
});

// Ölçüm (doğrulama ve ayar ekranı için): kare başına çizim çağrısı, üçgen, doku belleği kestirimi, gölge haritası bedeli
export function gfxStats() {
  const seen = new Set(); let tex = 0;
  const addTex = t => { if (!t || !t.isTexture || seen.has(t.uuid)) return; seen.add(t.uuid); const im = t.image; if (!im || !im.width) return; tex += im.width * im.height * 4 * (t.generateMipmaps ? 1.333 : 1); };
  scene.traverse(o => { for (const m of (Array.isArray(o.material) ? o.material : o.material ? [o.material] : [])) for (const k of ['map', 'bumpMap', 'normalMap', 'emissiveMap', 'roughnessMap', 'metalnessMap', 'alphaMap']) addTex(m[k]); });
  const T = gfx.T, w = Math.round(view.w * DPR), h = Math.round(view.h * DPR), s = composer?.renderTarget1.samples || 0;
  const target = composer ? w * h * 8 * (1 + s) + w * h * 4 * Math.max(1, s) : 0; // HDR renk (+çok örnekli kopya) + derinlik
  const bloomMem = composer ? Math.round(w / T.bloomDiv) * Math.round(h / T.bloomDiv) * 8 * 3.7 : 0; // parlak geçiş + 5 basamak × 2 (yarılanan)
  const env = envRT ? envRT.width * envRT.height * 8 : 0, shadow = keyL.light?.castShadow ? T.shadow * T.shadow * 8 : 0; // renk + derinlik
  const mb = v => Math.round(v / 1048576 * 10) / 10;
  return { tier: gfx.tier, choice: gfx.choice, dpr: DPR, buffer: [w, h], msaa: s, frameMs: Math.round(stats.ms * 10) / 10, calls: stats.calls, triangles: stats.triangles, points: stats.points,
    frames: stats.frames, fpsCap: fpsCap(), geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures, programs: renderer.info.programs?.length || 0, particles: particleCount(),
    textureMB: mb(tex), targetMB: mb(target), bloomMB: mb(bloomMem), envMB: mb(env), shadowMB: mb(shadow), shadowMap: keyL.light?.castShadow ? T.shadow : 0, shadowEvery: T.shadowEvery };
}
// Deneme ve sonraki ayar ekranı için kısa yol (kural içermez)
window.DD_GFX = { stats: gfxStats, get: getGfx, set: setGfx, tiers: TIERS, frameNo: () => stats.frames, cap: fpsCap }; // frameNo: çizilen kare sayısı (Oyun Denetçisi kare sınırını görsün)

// Raycast ile dokunulan birimi bul
const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
export function pick(clientX, clientY, objects) {
  const p = toLocal(clientX, clientY);
  ndc.set((p.x / view.w) * 2 - 1, -(p.y / view.h) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const hit = ray.intersectObjects(objects, false)[0];
  return hit ? hit.object : null;
}
