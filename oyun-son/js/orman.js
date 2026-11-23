// Açılış ormanı (sürüm 13): yeni karakter oyuna şehirde değil, Vahran Ovası'nın kıyısındaki Kemikli Koru'da başlar.
// Öğreticinin ilk adımları (hikâye, ilk savaş, savaş çubuğu, av) burada geçer: gece kampı yağmacılarca basılmış, izci
// Thrak yaralı; oyuncu patikayı tutan yağmacıları keser (stage 1-1..1-3, bölgenin ortamı zaten ormandır). Av bitince
// 'carsi' adımı ormandan Yemin Pazarı'na geçirir; öğreticinin geri kalanı orada sürer.
//  - Ana üs (ui-hub.js showHub) ilk satırında hooks.orman'a sorar: orman sürüyorsa ana üs yerine bu sahne kurulur.
//  - Eski kayıtlar etkilenmez: öğretici bitmiş ya da atlanmışsa (tut.end) ya da 'carsi' adımı geçilmişse orman yoktur.
//  - ?tut=0 (otomatik denemeler) ormanı da kapatır: öğretici katmanı olmadan adımlar ilerlemez.
// Sahne: forest ortamının (models.js) üstüne açıklık, patika, kamp ateşi, çadır, ışık huzmeleri, yer sisi, ateş böcekleri.
// Hepsi tek seferde kurulur; birleştirilmiş parçalar (Batch) birkaç çizim çağrısıdır, hareket gölgelendiricidedir.
import './ui-hub.js'; // sıra: ana üssün hooks.hud'u bu modülden önce bağlanmış olmalı (aşağıda sarılır)
import { THREE, scene, camRig, setHfov, setShift, project, onUpdate, gfx, particle } from './engine3d.js';
import { world, clearScene, ensureEnv, spawn, setUpdater } from './world.js';
import { Batch, batchMaterial, driftPoints, flameMaterial, blobField, disposeTree, patchStd, wind } from './scenery.js';
import { hideBattleUI, unitLook } from './combat.js';
import { hideChatBar } from './ui-social.js';
import { S, onState } from './api.js';
import { ACT, hud, hooks, esc, toast, run, showModal, closeModal, closeWin, avatarImg } from './ui-core.js';
import { svg } from './icons.js';
import { botParty } from '../shared/bots.js';
import { partyUnits } from '../shared/hero.js';
import { TUT_STEPS, TUT_HUNT, tutActive } from '../shared/meta.js';
import { ZONES, FOREST_MOBS } from '../shared/zones.js';
import { capitalOf } from '../shared/content.js';

// İzci tarafa göre: Kragmir'de ork izci Thrak, Elentha'da insan izci Corin (VAHRAN hikâyesi)
export const ORMAN = { name: 'Kemikli Koru', get scout() { return S?.faction === 'sancak' ? 'İzci Corin' : 'İzci Thrak'; } };
const TUT_OFF = new URLSearchParams(location.search).get('tut') === '0';
const LAST = TUT_STEPS.indexOf('carsi'); // bu adım (ormandan çıkış) dahil orman sürer
export const ormanOn = () => !TUT_OFF && !!S && tutActive(S) && (S.tut.s | 0) <= LAST;
const barStep = () => !!(S?.tut && !S.tut.end && TUT_STEPS[S.tut.s] === 'bar'); // iksir adımı yarım kaldıysa sürü bitmez (takılma düzeltmesi)
const wins = () => Math.min(TUT_HUNT, S?.stats?.wins | 0);
const nextStage = () => `1-${Math.min(TUT_HUNT, wins() + 1)}`;
const Y0 = 0.28; // açıklığın tümseği: meydan taşının üstünü örter; karakterler bu yüksekliğe basar

// ---------- Sahne ----------
const rnd = (a, b) => a + Math.random() * (b - a);
const L4 = new THREE.Matrix4(), P4 = new THREE.Vector3(), Q4 = new THREE.Quaternion(), E4 = new THREE.Euler(), S4 = new THREE.Vector3();
const put = (b, geo, color, x, y, z, o = {}) => {
  L4.compose(P4.set(x, y, z), Q4.setFromEuler(E4.set(o.rx || 0, o.ry || 0, o.rz || 0)), S4.set(o.sx ?? 1, o.sy ?? 1, o.sz ?? 1));
  b.add(geo, L4, { color, rough: o.rough ?? 0.92, metal: o.metal ?? 0, grad: o.grad ?? 0.2, under: o.under ?? 0.25, jitter: o.jitter ?? 0.08, base: o.base, emissive: o.em, emI: o.emI });
  geo.dispose();
};
const cyl = (a, b, h, n = 8, open = false) => new THREE.CylinderGeometry(a, b, h, n, 1, open);

// Açıklığın zemini: yosunlu toprak, ortada çiğnenmiş ateş başı, uzak kenara (patikaya) giden yol; kenar çimene karışır
function groundTex() {
  const N = 512, cv = document.createElement('canvas'); cv.width = cv.height = N;
  const x = cv.getContext('2d');
  x.fillStyle = '#4a4630'; x.fillRect(0, 0, N, N);
  for (let i = 0; i < 900; i++) { // yosun ve toprak lekeleri
    const r = rnd(4, 26), px = rnd(0, N), py = rnd(0, N), moss = Math.random() < 0.55;
    x.fillStyle = moss ? `rgba(${rnd(50, 80) | 0},${rnd(78, 110) | 0},${rnd(34, 52) | 0},${rnd(0.15, 0.4)})` : `rgba(${rnd(70, 100) | 0},${rnd(56, 74) | 0},${rnd(38, 50) | 0},${rnd(0.15, 0.35)})`;
    x.beginPath(); x.arc(px, py, r, 0, 7); x.fill();
  }
  // patika: ortadan uzak kenara (dokunun üstü = sahnenin derinliği), hafif kıvrımlı
  x.lineCap = 'round';
  for (const [w, c] of [[86, 'rgba(92,72,48,.55)'], [58, 'rgba(112,88,60,.6)'], [30, 'rgba(128,102,70,.45)']]) {
    x.strokeStyle = c; x.lineWidth = w; x.beginPath(); x.moveTo(N / 2, N / 2); x.bezierCurveTo(N / 2 + 40, N * 0.34, N / 2 - 36, N * 0.16, N / 2 + 10, -10); x.stroke();
  }
  const g = x.createRadialGradient(N / 2, N * 0.53, 8, N / 2, N * 0.53, 120); // ateş başı: kül ve çiğnenmiş toprak
  g.addColorStop(0, 'rgba(40,32,26,.9)'); g.addColorStop(0.35, 'rgba(96,78,56,.6)'); g.addColorStop(1, 'rgba(96,78,56,0)');
  x.fillStyle = g; x.fillRect(0, 0, N, N);
  for (let i = 0; i < 260; i++) { x.fillStyle = `rgba(${rnd(150, 190) | 0},${rnd(140, 170) | 0},${rnd(110, 130) | 0},${rnd(0.15, 0.4)})`; x.fillRect(rnd(0, N), rnd(0, N), rnd(1, 3), rnd(1, 3)); } // çakıl
  // kenar: çimene karışsın (saydamlık)
  x.globalCompositeOperation = 'destination-in';
  const a = x.createRadialGradient(N / 2, N / 2, N * 0.36, N / 2, N / 2, N * 0.5);
  a.addColorStop(0, 'rgba(0,0,0,1)'); a.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = a; x.fillRect(0, 0, N, N);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = gfx.T.aniso || 1; t.userData.own = true;
  return t;
}
function pathTex() {
  const cv = document.createElement('canvas'); cv.width = 64; cv.height = 256;
  const x = cv.getContext('2d'), g = x.createLinearGradient(0, 0, 64, 0);
  g.addColorStop(0, 'rgba(100,80,54,0)'); g.addColorStop(0.3, 'rgba(100,80,54,.8)'); g.addColorStop(0.7, 'rgba(100,80,54,.8)'); g.addColorStop(1, 'rgba(100,80,54,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 256);
  for (let i = 0; i < 120; i++) { x.fillStyle = `rgba(${rnd(60, 90) | 0},${rnd(80, 100) | 0},${rnd(40, 50) | 0},${rnd(0.2, 0.5)})`; x.beginPath(); x.arc(rnd(0, 64), rnd(0, 256), rnd(2, 7), 0, 7); x.fill(); }
  x.globalCompositeOperation = 'destination-in';
  const f = x.createLinearGradient(0, 0, 0, 256); f.addColorStop(0, 'rgba(0,0,0,0)'); f.addColorStop(0.25, 'rgba(0,0,0,1)'); f.addColorStop(1, 'rgba(0,0,0,1)');
  x.fillStyle = f; x.fillRect(0, 0, 64, 256);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.userData.own = true;
  return t;
}

const SHAFT_FRAG = `varying vec2 vUv; uniform float t, op, seed; uniform vec3 col;
  void main(){
    float x = abs(vUv.x - 0.5) * 2.0;
    float edge = smoothstep(1.0, 0.15, x);
    float len = smoothstep(0.0, 0.3, vUv.y) * smoothstep(1.0, 0.6, vUv.y);
    float dust = 0.75 + 0.25 * sin(vUv.y * 22.0 - t * 0.8 + seed) * sin(vUv.x * 9.0 + t * 0.5 + seed * 2.0);
    float a = edge * len * dust * op * (0.85 + 0.15 * sin(t * 0.4 + seed));
    gl_FragColor = vec4(col * a, a);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;
const MIST_FRAG = `varying vec2 vUv; varying vec3 vW; uniform float t, op, spd; uniform vec3 col;
  float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
  float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
  void main(){
    vec2 p = vW.xz * 0.16 + vec2(t * spd, t * spd * 0.35);
    float m = n(p) * 0.6 + n(p * 2.3 + 5.0) * 0.3 + n(p * 5.1 - t * 0.05) * 0.1;
    vec2 c = vUv - 0.5; float edge = smoothstep(0.5, 0.2, max(abs(c.x), abs(c.y)));
    float a = smoothstep(0.35, 0.85, m) * edge * op;
    gl_FragColor = vec4(col, a);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;
const VS_UV = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }';
const VS_W = 'varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }';

// Sahnenin ortama eklenen parçaları. Dönen: { group, fire: {x,z}, light, update(dt,t) }
function buildGrove() {
  const T = gfx.T, g = new THREE.Group(), near = new Batch(), spots = [];
  const day = (scene.fog?.color ? scene.fog.color.r + scene.fog.color.g + scene.fog.color.b : 0.4) / 3; // gündüz sisi açıktır: huzme ve sis ona göre
  // açıklık (tümsek): ortası Y0 yüksekliğinde, kenarı yere iner
  const gg = new THREE.RingGeometry(0.001, 8.8, 64, 12).rotateX(-Math.PI / 2), gp = gg.attributes.position;
  for (let i = 0; i < gp.count; i++) { const r = Math.hypot(gp.getX(i), gp.getZ(i)); gp.setY(i, r < 7.4 ? Y0 : Y0 * Math.max(0, (8.8 - r) / 1.4) ** 1.5 + 0.01); }
  gg.computeVertexNormals();
  const ground = new THREE.Mesh(gg, new THREE.MeshStandardMaterial({ map: groundTex(), transparent: true, roughness: 1, envMapIntensity: 0.1 }));
  ground.receiveShadow = true; ground.renderOrder = -1; g.add(ground);
  // patika: açıklıktan ağaçların arasına (uzağa) uzanır
  const pg = new THREE.PlaneGeometry(2.4, 16, 1, 8).rotateX(-Math.PI / 2);
  const path = new THREE.Mesh(pg, new THREE.MeshStandardMaterial({ map: pathTex(), transparent: true, roughness: 1, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 }));
  path.position.set(0.4, 0.03, -16); path.rotation.y = 0.08; path.receiveShadow = true; g.add(path);

  // kamp ateşi: taş halka, çapraz kütükler, kor, alev
  const F = { x: 0.2, z: 0.6 };
  for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; put(near, new THREE.DodecahedronGeometry(0.2, 0), 0x6a665c, F.x + Math.cos(a) * 0.62, Y0 + 0.1, F.z + Math.sin(a) * 0.62, { sy: 0.7, ry: a, rough: 0.95 }); }
  for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI + 0.3; put(near, cyl(0.07, 0.09, 0.95, 6).rotateZ(Math.PI / 2), 0x3a2618, F.x, Y0 + 0.14, F.z, { ry: a, rz: 0.22, base: Y0 + 0.08 }); }
  put(near, new THREE.SphereGeometry(0.3, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), 0xff7a20, F.x, Y0 + 0.02, F.z, { sy: 0.35, em: 0xff5a10, emI: T.post ? 2.2 : 1.2, grad: 0, under: 0, jitter: 0 });
  const flames = [];
  for (const [r0, r1, h, c, k] of [[0.04, 0.34, 1.0, 0xff7a2a, 1], [0.03, 0.2, 0.7, 0xffc060, 0.8]]) {
    const fl = new THREE.Mesh(cyl(r0, r1, h, 12, true), flameMaterial(c, k));
    fl.position.set(F.x, Y0 + 0.12 + h / 2, F.z); fl.renderOrder = 5; g.add(fl); flames.push(fl);
  }
  const light = new THREE.PointLight(0xff8a3a, 16, 13, 1.6); light.position.set(F.x, Y0 + 1.0, F.z); g.add(light);
  // ateş başında oturak kütükler
  put(near, cyl(0.2, 0.22, 1.7, 8).rotateZ(Math.PI / 2), 0x4a3424, F.x - 0.1, Y0 + 0.18, F.z + 1.55, { ry: 0.15, base: Y0 + 0.1 });
  put(near, cyl(0.2, 0.22, 1.5, 8).rotateZ(Math.PI / 2), 0x4a3424, F.x + 1.6, Y0 + 0.18, F.z - 0.5, { ry: 1.2, base: Y0 + 0.1 });
  // kazan ve sehpası
  for (const s of [-1, 1]) put(near, cyl(0.025, 0.03, 1.5, 5), 0x2a2018, F.x + s * 0.55, Y0 + 0.7, F.z - 0.05, { rz: -s * 0.35 });
  put(near, cyl(0.02, 0.02, 1.3, 5).rotateZ(Math.PI / 2), 0x2a2018, F.x, Y0 + 1.36, F.z - 0.05);
  put(near, new THREE.SphereGeometry(0.2, 10, 8, 0, Math.PI * 2, Math.PI * 0.35, Math.PI * 0.65), 0x24242a, F.x, Y0 + 1.0, F.z - 0.05, { metal: 0.7, rough: 0.5 });
  spots.push([F.x, F.z, 1.8, 1.8, Y0 + 0.02]);

  // izcinin çadırı (eğik bez), yatak, sandık ve çuvallar: sol arkada
  const tent = (x, z, ry, col) => {
    const m = new THREE.Matrix4().compose(P4.set(x, Y0, z), Q4.setFromEuler(E4.set(0, ry, 0)), S4.set(1, 1, 1));
    const add = (geo, c, px, py, pz, o = {}) => { L4.compose(P4.set(px, py, pz), Q4.setFromEuler(E4.set(o.rx || 0, 0, o.rz || 0)), S4.set(1, 1, 1)); L4.premultiply(m); near.add(geo, L4, { color: c, rough: 0.95, grad: 0.25, under: 0.3, jitter: 0.05 }); geo.dispose(); };
    for (const s of [-1, 1]) add(new THREE.BoxGeometry(1.9, 0.04, 2.4), col, s * 0.59, 0.86, 0, { rz: s * 0.9 });
    add(cyl(0.035, 0.04, 1.7, 5), 0x3a2a1c, 0, 0.82, 1.15); add(cyl(0.035, 0.04, 1.7, 5), 0x3a2a1c, 0, 0.82, -1.15);
    add(cyl(0.03, 0.03, 2.5, 5).rotateX(Math.PI / 2), 0x3a2a1c, 0, 1.6, 0);
    add(new THREE.BoxGeometry(0.8, 0.12, 1.8), 0x5a4a3a, 0, 0.06, 0.1); // yatak
    spots.push([x, z, 2.6, 3.0, Y0 + 0.02]);
  };
  tent(-4.0, -1.6, 0.55, 0x8a7a58);
  put(near, new THREE.BoxGeometry(0.6, 0.45, 0.45), 0x5a3e24, -2.5, Y0 + 0.23, -2.9, { ry: 0.4, base: Y0 + 0.1 }); // sandık
  put(near, new THREE.BoxGeometry(0.64, 0.06, 0.5), 0x8a8070, -2.5, Y0 + 0.47, -2.9, { ry: 0.4, metal: 0.4, rough: 0.6 });
  for (const [x, z] of [[-2.0, -2.4], [-2.2, -3.4]]) put(near, new THREE.SphereGeometry(0.28, 8, 6), 0x9a8460, x, Y0 + 0.2, z, { sy: 1.2, rough: 1 }); // çuvallar
  // devrilmiş el arabası yerine: kırık mızrak ve yere saplanmış oklar (baskının izleri)
  put(near, cyl(0.025, 0.025, 1.8, 5), 0x4a3424, 3.1, Y0 + 0.2, -1.2, { rz: 1.45, ry: 0.6 });
  for (const [x, z, a] of [[2.4, -2.6, 0.3], [2.7, -2.3, -0.2], [-1.2, -3.8, 0.25], [3.6, 0.2, -0.3]]) {
    put(near, cyl(0.012, 0.012, 0.7, 4), 0x6a5034, x, Y0 + 0.3, z, { rz: a, rx: 0.2 });
    put(near, new THREE.ConeGeometry(0.05, 0.12, 4), 0xd8d0c0, x - Math.sin(a) * 0.36, Y0 + 0.64, z + 0.07, { rz: a });
  }
  // sağda devrik ağaç gövdesi (yosunlu), mantarlar
  put(near, cyl(0.42, 0.5, 5.2, 10).rotateZ(Math.PI / 2), 0x3e2e22, 5.6, Y0 + 0.35, -2.2, { ry: -0.5, base: Y0 + 0.2, grad: 0.15 });
  put(near, cyl(0.44, 0.44, 2.2, 10, true).rotateZ(Math.PI / 2), 0x3e5a2a, 5.0, Y0 + 0.42, -1.9, { ry: -0.5, sy: 1.04, sz: 1.04, rough: 1 });
  put(near, new THREE.CylinderGeometry(0.48, 0.48, 0.08, 12).rotateZ(Math.PI / 2), 0x8a6a48, 3.25, Y0 + 0.35, -0.96, { ry: -0.5 });
  spots.push([5.6, -2.2, 5.6, 1.8, Y0 + 0.02]);
  const glowK = T.post ? 1 : 0.5;
  for (const [x, z, s] of [[4.2, -1.3, 1], [4.5, -1.1, 0.7], [-5.6, 0.6, 0.9], [-5.3, 0.9, 0.6], [6.4, 1.2, 0.8], [-3.0, -4.6, 0.8], [1.6, -5.2, 0.7]]) {
    put(near, cyl(0.035 * s, 0.05 * s, 0.22 * s, 6), 0xe8dcc0, x, Y0 + 0.11 * s, z);
    put(near, new THREE.SphereGeometry(0.13 * s, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), 0x7fe0d8, x, Y0 + 0.2 * s, z, { sy: 0.7, em: 0x40d8c8, emI: 1.6 * glowK, grad: 0, under: 0, jitter: 0.1 });
  }
  // eğrelti ve çalı kümeleri: açıklığın kenarında
  for (let i = 0; i < 46; i++) {
    const a = rnd(0, Math.PI * 2), r = rnd(6.2, 9.5), x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (z > 4.2 && Math.abs(x) < 5) continue; // kameranın önü
    if (z < -6 && Math.abs(x) < 2.2) continue; // patika
    const y = r < 7.4 ? Y0 : Y0 * Math.max(0, (8.8 - r) / 1.4) ** 1.5, c = [0x2c5a26, 0x3a6a2c, 0x24481e, 0x4a7030][i % 4], s = rnd(0.7, 1.3);
    for (let k = 0; k < 5; k++) put(near, new THREE.ConeGeometry(0.16 * s, 1.0 * s, 4), c, x + rnd(-0.3, 0.3), y + 0.35 * s, z + rnd(-0.3, 0.3), { rx: rnd(-0.9, 0.9), rz: rnd(-0.9, 0.9), sz: 0.25, grad: 0.4, under: 0.4 });
  }
  // yosunlu kayalar
  for (const [x, z, s] of [[-6.4, -2.8, 1.2], [6.8, -4.6, 1.5], [-2.0, -7.4, 1.0], [3.2, -7.0, 0.8], [-7.6, 2.6, 1.0]]) {
    put(near, new THREE.DodecahedronGeometry(0.6 * s, 0), 0x5e6058, x, 0.3 * s + 0.05, z, { sy: 0.7, ry: rnd(0, 6), rough: 1, grad: 0.3 });
    put(near, new THREE.DodecahedronGeometry(0.5 * s, 0), 0x3e5a2a, x, 0.52 * s + 0.05, z, { sy: 0.3, ry: rnd(0, 6), rough: 1 });
    spots.push([x, z, 1.6 * s, 1.6 * s]);
  }
  // çerçeve ağaçları: kameranın iki yanında kalın, yaşlı gövdeler (sahneye derinlik verir) ve patika kıyısında birkaç tane daha
  const trunkB = new Batch(), crownB = new Batch();
  const bigTree = (x, z, s, lean = 0) => {
    L4.compose(P4.set(x, 0, z), Q4.setFromEuler(E4.set(0, rnd(0, 6), lean)), S4.setScalar(s));
    const g1 = cyl(0.32, 0.55, 7, 9).translate(0, 3.5, 0); trunkB.add(g1, L4, { color: 0x34261c, rough: 1, grad: 0.35, under: 0.2, jitter: 0.1, base: 0.8 }); g1.dispose();
    for (let k = 0; k < 4; k++) { const r = (k * 1.7 + 0.4), rt = cyl(0.06, 0.16, 1.4, 5).rotateZ(1.1).translate(0.5, 0.25, 0).rotateY(r); trunkB.add(rt, L4, { color: 0x34261c, rough: 1, grad: 0.2, jitter: 0.1 }); rt.dispose(); } // kökler
    for (let k = 0; k < 5; k++) { const cg = new THREE.ConeGeometry(2.6 - k * 0.42, 2.4 - k * 0.15, 9).translate(0, 4.4 + k * 1.15, 0); crownB.add(cg, L4, { color: [0x1e3a20, 0x24442a, 0x1a3220][k % 3], rough: 0.95, grad: 0.35, under: 0.4, jitter: 0.12 }); cg.dispose(); }
    spots.push([x, z, 2.6 * s, 2.6 * s]);
  };
  bigTree(-9.6, 4.6, 1.25, 0.04); bigTree(9.8, 5.2, 1.35, -0.05); bigTree(-7.6, -5.8, 1.1); bigTree(7.4, -7.2, 1.2); bigTree(-3.4, -11.5, 1.15); bigTree(4.2, -12.5, 1.3); bigTree(-12, -1, 1.3); bigTree(12.5, -1.5, 1.2);
  const bm = batchMaterial({ flatShading: true, envMapIntensity: 0.25 });
  g.add(near.build(bm), trunkB.build(bm));
  const crownM = batchMaterial({ flatShading: true, envMapIntensity: 0.2 }, T.dress ? { wind: 'sway', swayK: 0.012 } : {});
  g.add(crownB.build(crownM));
  g.add(blobField(spots, T.shadow ? 0.32 : 0.5));

  // ışık huzmeleri: ağaçların arasından açıklığa eğik inen ince ışık (çapraz iki düzlem)
  const shaftC = new THREE.Color(day > 0.45 ? 0xfff0c8 : 0xbfe0ff);
  for (const [x, z, h, w, op, rz, ry] of [[-2.6, -5.0, 15, 1.6, 0.16, 0.32, 0.3], [1.8, -6.2, 16, 2.2, 0.13, 0.36, -0.2], [4.6, -3.2, 14, 1.2, 0.12, 0.3, 0.6], [-5.6, -6.8, 15, 1.4, 0.1, 0.28, 0.1], [0.4, -1.4, 13, 1.0, 0.07, 0.34, 0.4]]) {
    const mat = new THREE.ShaderMaterial({ uniforms: { t: wind.t, op: { value: op * (day > 0.45 ? 1 : 0.8) * (T.post ? 1.6 : 2.4) }, seed: { value: Math.random() * 10 }, col: { value: shaftC } }, vertexShader: VS_UV, fragmentShader: SHAFT_FRAG, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    const sg = new THREE.Group();
    for (const a of [0, Math.PI / 2]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h).translate(0, h / 2, 0), mat); m.rotation.y = a; sg.add(m); }
    sg.position.set(x, -0.2, z); sg.rotation.set(0, ry, rz); sg.renderOrder = 7; g.add(sg);
  }
  // yer sisi: iki katman, ağır ağır kayar (ağaçların dibini ve patikanın ucunu yutar)
  const mistC = (scene.fog?.color?.clone() || new THREE.Color(0x30403c)).lerp(new THREE.Color(0xdde8e4), 0.35);
  for (const [y, op, spd, size, z] of [[Y0 + 0.25, 0.42, 0.05, 40, -6], [1.1, 0.26, 0.03, 46, -10], [0.6, 0.3, 0.04, 26, -15]]) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size * 0.7).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({ uniforms: { t: wind.t, op: { value: op }, spd: { value: spd }, col: { value: mistC } }, vertexShader: VS_W, fragmentShader: MIST_FRAG, transparent: true, depthWrite: false }));
    m.position.set(0, y, z); m.renderOrder = 6; g.add(m);
  }
  // ateş böcekleri, ateşten yükselen kıvılcımlar, düşen yapraklar
  g.add(driftPoints({ count: Math.max(30, Math.round(T.drift * 0.6)), color: 0xd8ff7a, color2: 0xffe08a, size: 0.07, area: [24, 3.2, 18], center: [0, 0.4, -4], rise: 0.04, sway: 0.7, twinkle: 0.95, gain: 2.2 }));
  g.add(driftPoints({ count: 22, color: 0xff6a1a, color2: 0xffc04a, size: 0.05, area: [0.7, 3.2, 0.7], center: [F.x, Y0 + 0.4, F.z], rise: 0.9, drift: 0.05, sway: 0.15, twinkle: 0.5, gain: 2.6 }));
  if (T.dress) g.add(driftPoints({ count: 24, color: 0x6a8a3a, color2: 0xb08a3a, size: 0.12, area: [26, 8, 18], center: [0, 0.2, -4], rise: -0.4, drift: 0.5, sway: 0.5, leaf: true, additive: false, gain: 0.8 }));

  const update = (dt, t) => {
    const k = 1 + Math.sin(t * 13) * 0.08 + Math.sin(t * 5.3) * 0.1 + Math.sin(t * 29) * 0.04;
    light.intensity = 16 * k;
    flames[0].scale.set(1, 0.92 + 0.12 * Math.sin(t * 9), 1);
    if (Math.random() < dt * 3) particle(F.x + rnd(-0.15, 0.15), Y0 + 0.9, F.z + rnd(-0.15, 0.15), rnd(-0.1, 0.1), rnd(0.2, 0.4), rnd(-0.1, 0.1), 0x3a3430, 0.22, 2.4, 0.15, 0.3, 0.5, true); // ince duman
  };
  return { group: g, fire: F, update };
}

// ---------- Sahneyi kur ----------
const O = { on: false, tok: -1, grove: null, anchors: {}, mobs: [] };
const dropGrove = () => { if (O.grove) { scene.remove(O.grove.group); disposeTree(O.grove.group); O.grove = null; } };
onUpdate((dt, t) => { if (O.grove && world.token !== O.tok) dropGrove(); else if (O.grove) O.grove.update(dt, t); }); // başka sahne kurulunca (savaş) orman parçaları bırakılır

function showOrman() {
  closeWin(true); hideBattleUI(); closeModal();
  clearScene(); dropGrove();
  // Açılışın havası sabittir: şafak ve hafif sis. daylight.js'in deneme kancası (DD_TOD) orman sürdükçe tutulur (ormandaki
  // savaşlar ve grafik kademesi değişince yeniden kurulan ortam da aynı havada kalsın); ormandan çıkınca bırakılır.
  // Önceden (deneme için) verilmişse dokunulmaz.
  if (!window.DD_TOD) { window.DD_TOD = { tod: 'dawn', wx: 'fog' }; O.tod = true; }
  ensureEnv('forest', 'orman');
  if (scene.fog) { scene.fog.near = 10; scene.fog.far = 46; } // sis arkayı sarar; patikadaki yağmacılar okunur kalır
  if (S.battle) run('battle.abandon'); // sonucu gönderilemeyen savaş kaydı açık kalmasın
  O.tok = world.token; O.grove = buildGrove(); scene.add(O.grove.group); O.on = true;
  const F = O.grove.fire, lift = a => { a.char.pos.y = Y0 + 0.02; return a; };
  // kahraman ateşin başında; izci yaralı, kütüğün yanında
  const hero = partyUnits(S)[0];
  if (hero) lift(spawn({ ...hero, ...unitLook(hero) }, F.x - 1.7, F.z + 1.1, 0.75));
  let su = null; for (let k = 0; k < 40 && !su; k++) { const u = botParty(4242 + k * 7, 8, 0.4, S.faction || 'sancak').units[0]; if (u?.cls === 'rogue' || k === 39) su = u; } // izci: hafif zırhlı, hançerli
  const SL = unitLook(su);
  const scout = lift(spawn({ ...su, look: { ...SL.look, helmet: 'hood', shield: false, cape: 0x3a4a2a }, model: { ...SL.model, shield: false, hero: false } }, F.x + 2.2, F.z + 0.9, -0.9));
  O.anchors = { izci: new THREE.Vector3(F.x + 2.2, 2.5, F.z + 0.9) };
  // patikanın ucunda pusuya yatmış yağmacılar: kalan savaş kadar (zafer geldikçe azalır)
  O.mobs = [];
  const left = TUT_HUNT - wins(), MOB_SPOT = [[0.2, -9.0, 0.05], [1.9, -9.8, -0.2], [-1.3, -10.0, 0.2]];
  for (let i = 0; i < left; i++) { const [x, z, f] = MOB_SPOT[i], u = { mob: FOREST_MOBS[i % FOREST_MOBS.length], id: 'om' + i }; O.mobs.push(spawn({ ...u, ...unitLook(u) }, x, z, f)); }
  if (left > 0) O.anchors.yol = new THREE.Vector3(0.3, 2.7, -9.6);
  setHfov(72); setShift(0, 0);
  let cheer = 3, frame = 0;
  setUpdater((dt, t) => {
    camRig.pos.set(Math.sin(t * 0.09) * 0.6, 4.0, 10.9); camRig.look.set(0.2, 1.4, -3.6);
    if (++frame % 2) placeLabels();
    cheer -= dt;
    if (cheer < 0) { cheer = 4 + Math.random() * 3; const m = O.mobs[Math.floor(Math.random() * O.mobs.length)]; if (m) Math.random() < 0.5 ? m.char.swing() : m.char.cheer(); }
  });
  void scout;
  hud.hidden = false; renderOrmanHud(); hideChatBar();
}
function placeLabels() {
  for (const el of hud.querySelectorAll('#blabels .blabel')) {
    const a = O.anchors[el.dataset.id];
    if (!a) { if (el.style.display !== 'none') el.style.display = 'none'; continue; }
    const p = project(a), tf = `translate(${Math.round(p.x * 2) / 2}px, ${Math.round(p.y * 2) / 2}px) translate(-50%,-100%)`;
    if (el._tf !== tf) { el._tf = tf; el.style.transform = tf; }
    if (el.style.display === 'none') el.style.display = '';
  }
}

// ---------- Arayüz ----------
function renderOrmanHud() {
  if (hud.hidden || !S) return;
  const w = wins(), done = w >= TUT_HUNT && !barStep();
  hud.innerHTML = `
    <div id="blabels">${done ? '' : `<button class="blabel orn-foe" data-a="ormanFight" data-id="yol"><b>Yaban sürüsü</b><small>Sv. 1 · ${TUT_HUNT - w} pusu</small></button>`}<button class="blabel orn-npc" data-a="ormanIzci" data-id="izci"><b>${esc(ORMAN.scout)}</b><small>Yaralı</small></button></div>
    <div class="orn-yer"><small>${esc(ZONES[0].name)} kıyısı</small><b>${esc(ORMAN.name)}</b></div>
    <div class="orn-gorev ${done ? 'ok' : ''}"><small>${svg('quest')}İlk görev</small><b>Orman yolunu temizle</b><span>Yaban sürüsü ${w}/${TUT_HUNT}</span><i><em style="width:${Math.round(w / TUT_HUNT * 100)}%"></em></i></div>
    <div class="orn-sag"><span class="orn-ben">${avatarImg('ava')}<span><b>${esc(S.name)}</b><small>Sv. ${S.lvl}</small></span></span><button class="lbtn" data-a="settings" title="Ayarlar"><i>${svg('menu')}</i><span>Ayarlar</span></button></div>`;
  placeLabels();
}
// Ana üs: öğretici ormandayken ana üs yerine orman kurulur (ui-hub.js showHub'ın ilk satırı)
hooks.ormanOn = ormanOn; // savaş sonucu düğmesi (ui-battle.js) orman sürerken “Kemikli Koru’ya dön” yazar
hooks.orman = () => {
  if (!ormanOn()) { if (O.on) leave(); return false; }
  showOrman(); return true;
};
// HUD yenilemesi (dil, unvan, ödeme…) ormandayken ana üs çubuklarını çizmesin
const hubHud = hooks.hud;
hooks.hud = () => (O.on && ormanOn() ? renderOrmanHud() : hubHud());
// Ormandan çıkış: kısa kararma geçişi (yol tarifi Yemin Pazarı'na)
function leave() {
  O.on = false; O.anchors = {}; O.mobs = [];
  if (O.tod) { delete window.DD_TOD; O.tod = false; } // gerçek saat ve hava geri gelir
  const f = document.createElement('div'); f.className = 'orn-fade'; f.innerHTML = `<b>${esc(S && tutActive(S) ? 'Yemin Pazarı' : capitalOf(S?.faction) || 'Yemin Pazarı')}</b><small>Ormandan çıktın</small>`; // öğretici atlanınca başkente
  document.getElementById('game').appendChild(f); setTimeout(() => f.remove(), 2200);
}
// Öğretici atlandı ya da orman adımları bitti (başka bir yoldan): ana üs gösterilir
onState(() => setTimeout(() => {
  if (!O.on || ormanOn()) { if (O.on && !hud.hidden && document.getElementById('win').hidden) renderOrmanHud(); return; }
  if (!hud.hidden && document.getElementById('battleUI')?.hidden !== false) ACT.hub?.();
}, 0));

ACT.ormanFight = () => {
  if (wins() >= TUT_HUNT && !barStep()) return toast('Patika temiz.');
  ACT.stage({ id: nextStage() });
};
// İzci Thrak (özgün, sade çizim): kapüşonlu, kolu sargılı
export const SCOUT_SVG = '<svg viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="8" fill="#1c2a1e"/><path d="M8 64c3-14 12-19 24-19s21 5 24 19z" fill="#3e5230"/><path d="M14 52l10-6M50 52l-10-6" stroke="#2a3a20" stroke-width="3"/><path d="M40 50c4 2 8 5 10 10" stroke="#e8e0cc" stroke-width="5" fill="none"/><path d="M41 52l7 4M43 49l6 5" stroke="#b03a2a" stroke-width="1.6"/><path d="M14 34c0-14 8-22 18-22s18 8 18 22c0 6-2 12-4 14H18c-2-2-4-8-4-14z" fill="#2e3e24"/><ellipse cx="32" cy="34" rx="9" ry="11" fill="#d9a87a"/><path d="M23 30q9-8 18 0" stroke="#2e3e24" stroke-width="4" fill="none"/><circle cx="28" cy="34" r="1.5" fill="#1a1008"/><circle cx="36" cy="34" r="1.5" fill="#1a1008"/><path d="M28 40q4 2 8 0" stroke="#7a3a2a" stroke-width="1.5" fill="none"/><path d="M36 28l5 6" stroke="#b03a2a" stroke-width="1.4"/></svg>';
ACT.ormanIzci = () => {
  const done = wins() >= TUT_HUNT;
  const lines = done
    ? ['Patika temiz, yiğit! Sürü dağıldı; yol yeniden açık.', 'Hayvanların postunda bir şey dikkatimi çekti: ince, gri bir kül. Ne ocaktan ne kamp ateşinden… Neyse, yolda konuşuruz.', 'Ormanın öbür ucunda <b>Yemin Pazarı</b> var: Taş Yemini’nin dibinde iki ırkın buluştuğu tarafsız pazar. Tüccarlar orada, senden yardım bekleyenler de. Hazırsan seni götüreyim.']
    : ['Gece kampı bastılar. Biri bacağımı ısırdı; yaşarım, ama yürüyemem.', `Kuduz bir yaban sürüsü patikanın ucunu tutmuş (${TUT_HUNT - wins()} küme). Onları kes, yol açılsın; ben ateşi beklerim.`];
  // 23 Kas (C8): görsel roman diyaloğu, G4 Corin/Thrak portresi (yoksa eski SVG)
  import('./ui-diyalog.js').then(({ diyalog }) => diyalog({ kim: S?.faction === 'sancak' ? 'corin' : 'thrak', ad: ORMAN.scout, unvan: 'İzci', halk: S?.faction === 'ocak' ? 'ocak' : 'sancak', satirlar: lines, svg: SCOUT_SVG, html: true,
    son: done ? [{ t: 'Tamam', a: 'closeModal', ana: true }] : [{ t: 'Tamam', a: 'closeModal' }, { t: 'Sürüye git', a: 'ormanFightM', ana: true }] }));
};
ACT.ormanFightM = () => { closeModal(); ACT.ormanFight(); };
