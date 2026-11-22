// 22 Kas (kullanıcı): savaş arka planları artık GPT'nin boyalı sahne resimleri (10 resim, ikişer üst üste 5 WebP,
// js/savas-arka-png.js'e gömülü; kaynak _tasarim/gelen/savas-arka/, üretici _tasarim/araclar/savas-arka-gom.py). Koddan çizilen savaş ortamı (gök kubbe, çimen, ağaç, kaya,
// meydan taşı) savaşta artık kurulmaz (models.js buildEnv 'foto:' kipi).
// Resim, savaşın taban kamerasından (projektör) zemine ve arkadaki kavisli perdeye yansıtılır: taban kadrajda resim birebir
// görünür, kamera yaklaşınca ya da döndüğünde zemin ve ufuk gerçek derinlikte kayar (düz bir kâğıt gibi kaymaz).
// Işıklar resmin ışığına göre ayarlıdır (LIGHT); karakterin gölgesi görünmez bir gölge düzlemine düşer.
import { THREE, camera, renderer } from './engine3d.js';

// ad → [dosya, yarı (0 üst, 1 alt), ufuk: zemin kenarının resimdeki yüksekliği (üstten oran)]
export const BGS = {
  yemin: [1, 0, 0.48], carsi: [1, 1, 0.42], kapi: [2, 0, 0.49], ocak: [2, 1, 0.47], harabe: [3, 0, 0.47],
  volkan: [3, 1, 0.42], sur: [4, 0, 0.46], selale: [4, 1, 0.5], guz: [5, 0, 0.43], karli: [5, 1, 0.45],
};
// Ortam türü (shared: env) → uygun resimler; savaşın tohumuyla biri seçilir (aynı savaş hep aynı resmi gösterir)
const BY_KIND = {
  arena: ['yemin', 'carsi'], castle: ['kapi', 'ocak'], graveyard: ['harabe', 'volkan'], shrine: ['harabe', 'yemin'],
  forest: ['guz', 'selale'], meadow: ['sur', 'selale'], steppe: ['sur', 'guz'], autumn: ['guz'], desert: ['volkan', 'carsi'],
  canyon: ['volkan', 'kapi'], ashland: ['volkan'], swamp: ['harabe'], snow: ['karli'], glacier: ['karli'],
};
export function pickBg(kind, seed = 0) {
  const L = BY_KIND[kind] || ['yemin', 'sur'];
  // 23 Kas (Gemini M2: "Kragmir orku Elentha tarzı aydınlık kale önünde savaşıyor"): öbür halkın surları/ocağı oyuncunun halkına göre değişir
  const f = document.documentElement.dataset.faction, b = L[Math.abs(seed | 0) % L.length];
  return f === 'ocak' && b === 'sur' ? 'guz' : f === 'sancak' && b === 'ocak' ? 'kapi' : b;
}
// Işık takımları (resmin saatine ve rengine göre): key = gölge düşüren ana ışık (kameranın yanından), rim = resmin ışık
// kaynağı yönünden kontur ışığı, hemi = gök/yer dolgusu, sky = ortam yansıması için gök renkleri (resimden örneklendi)
export const LIGHT = {
  yemin:  { key: [0xffe6d2, 2.5, [7, 10, 6]], rim: [0xffc8a0, 0.8, [-10, 5, 5]], hemi: [0xdcdcf0, 0x7a746a, 0.95], sky: ['#9594a7', '#91878c', '#6e727d'], exp: 0.92, sh: 0.32 },
  carsi:  { key: [0xffc890, 1.9, [6, 9, -4]], rim: [0x9fb0ff, 0.7, [-9, 6, 0]], hemi: [0x8ea0e0, 0x5a4a3a, 0.85], sky: ['#355388', '#424c66', '#393236'], exp: 0.95, sh: 0.4 },
  kapi:   { key: [0xffb496, 2.0, [6, 9, 6]], rim: [0xff7040, 1.0, [-10, 3, 8]], hemi: [0xb08090, 0x3a2420, 0.75], sky: ['#52383c', '#5c3631', '#4c2e2b'], exp: 0.95, sh: 0.42 },
  ocak:   { key: [0xffa868, 2.0, [5, 9, 3]], rim: [0xff7a2a, 1.3, [-10, 5, 0]], hemi: [0xff9a5a, 0x3a2418, 0.7], sky: ['#503b37', '#5a3a2e', '#9a5a2d'], exp: 0.95, sh: 0.42 },
  harabe: { key: [0xc4d0ff, 1.8, [7, 11, 5]], rim: [0xff5a3a, 0.9, [-6, 4, -8]], hemi: [0x9fb2e0, 0x3a3440, 0.8], sky: ['#384b68', '#3c4c66', '#404c63'], exp: 0.95, sh: 0.4 },
  volkan: { key: [0xffa070, 2.0, [6, 9, 4]], rim: [0xff6a2a, 1.2, [-10, 4, 6]], hemi: [0xd08060, 0x3a2018, 0.7], sky: ['#7c4b43', '#944f3b', '#623832'], exp: 0.95, sh: 0.42 },
  sur:    { key: [0xfff0d8, 2.8, [6, 11, -5]], rim: [0xffe0a0, 0.6, [-10, 6, -6]], hemi: [0xcfe4ff, 0x8a7a5a, 0.95], sky: ['#9c999b', '#958c83', '#7f765d'], exp: 0.88, sh: 0.3 },
  selale: { key: [0xfff6e8, 2.8, [6, 12, 3]], rim: [0xffffff, 0.45, [-10, 6, 0]], hemi: [0xcfe4ff, 0x6a7a5a, 1.0], sky: ['#7c949e', '#839396', '#89999b'], exp: 0.88, sh: 0.28 },
  guz:    { key: [0xffcc94, 2.3, [5, 8, 7]], rim: [0xffa050, 1.1, [-10, 4, 8]], hemi: [0xffd0a0, 0x5a4030, 0.8], sky: ['#9d6644', '#825c4b', '#624230'], exp: 0.92, sh: 0.36 },
  karli:  { key: [0xe8f0ff, 2.3, [6, 12, 4]], rim: [0xffffff, 0.45, [-10, 6, 0]], hemi: [0xdce8ff, 0x8a929e, 1.0], sky: ['#96afce', '#7a92ad', '#4f6174'], exp: 0.9, sh: 0.3 },
};

// Projektör: resmin "çekildiği" kamera. Savaş kamerası (savas-kamera.js) taban kadrajını kurunca setProjector çağırır.
const PROJ = { view: new THREE.Matrix4(), pos: new THREE.Vector3(13, 3.4, 0), look: new THREE.Vector3(0, 1.4, 0), set: false };
const mats = new Set();
const tmpCam = new THREE.PerspectiveCamera();
function syncProj() {
  tmpCam.position.copy(PROJ.pos); tmpCam.up.set(0, 1, 0); tmpCam.lookAt(PROJ.look); tmpCam.updateMatrixWorld(true);
  PROJ.view.copy(tmpCam.matrixWorldInverse);
}
syncProj();
export function setProjector(pos, look) {
  PROJ.pos.copy(pos); PROJ.look.copy(look); PROJ.set = true; syncProj();
  for (const m of mats) m.userData.reshape?.();
}
export const projector = () => PROJ;

const cache = new Map(); // dosya no → doku (savaşlar arasında yeniden indirilmez)
function tex(n, onLoad) {
  let t = cache.get(n);
  if (t) { if (t.image) onLoad(t); else t.userData.wait.push(onLoad); return t; }
  t = new THREE.Texture(); t.userData.wait = [onLoad]; cache.set(n, t);
  // resimler js/savas-arka-png.js'e gömülü (yayın dosya sınırı); ilk savaşta bir kez indirilir, Blob URL'den çözülür
  import('./savas-arka-png.js').then(M => URL.createObjectURL(new Blob([Uint8Array.from(atob(M.PNG[n]), c => c.charCodeAt(0))], { type: 'image/webp' }))).then(url => new THREE.ImageLoader().load(url, im => {
    t.image = im; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    t.wrapS = THREE.MirroredRepeatWrapping; t.wrapT = THREE.ClampToEdgeWrapping; t.needsUpdate = true;
    t.userData.wait.splice(0).forEach(f => f(t));
  }, undefined, () => { cache.delete(n); })).catch(() => cache.delete(n));
  return t;
}
// Önden yükle (ör. VS ekranı açılınca): savaş başladığında resim hazır olsun
export function preloadBg(kind, seed) { const id = pickBg(kind, seed); tex(BGS[id][0], () => { }); }

const VERT = `varying vec3 vW;
void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
// Ton eşleme tersi: sahne ACES ile ton eşlenir (engine3d); resim ekranda kendi renginde görünsün diye boya önce ACES'in
// tersinden geçirilir (ışıma eşiğinin altında tutulur: resim parlamaz).
const FRAG = `uniform sampler2D map; uniform mat4 pView; uniform mat4 pProj; uniform vec2 sc; uniform float half_, ready, expo; uniform vec3 base;
varying vec3 vW;
vec3 invAces(vec3 y){
  const mat3 I = mat3(vec3(0.59719,0.07600,0.02840), vec3(0.35458,0.90834,0.13383), vec3(0.04823,0.01566,0.83777));
  const mat3 O = mat3(vec3(1.60475,-0.10208,-0.00327), vec3(-0.53108,1.10813,-0.07276), vec3(-0.07367,-0.00605,1.07602));
  vec3 c = clamp(inverse(O) * y, 0.0, 0.985);
  vec3 A = 1.0 - 0.983729 * c, B = 0.0245786 - 0.4329510 * c, C = -(0.000090537 + 0.238081 * c);
  vec3 v = (-B + sqrt(max(B * B - 4.0 * A * C, 0.0))) / (2.0 * A);
  return max(inverse(I) * v, 0.0) * 0.6 / expo;
}
void main(){
  vec4 p = pProj * pView * vec4(vW, 1.0);
  vec2 n = p.xy / max(p.w, 1e-4);
  vec2 uv = vec2(0.5 + 0.5 * n.x * sc.x, clamp(0.5 + 0.5 * n.y * sc.y, 0.002, 0.998));
  uv.y = uv.y * 0.5 + (half_ > 0.5 ? 0.0 : 0.5);
  vec3 col = mix(base, texture2D(map, uv).rgb, ready);
  gl_FragColor = vec4(min(invAces(col), vec3(1.1)), 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

// Arka planı gruba ekler. Geometri projektöre göre kurulur: zemin (y=0) ve resimdeki zemin kenarının yere değdiği uzaklıkta,
// projektörün çevresinde kavisli dikey perde. Taban kadrajdan bakınca ikisi birlikte resmin kendisidir.
export function buildBackdrop(group, id) {
  const B = BGS[id] || BGS.yemin, L = LIGHT[id] || LIGHT.yemin;
  const base = new THREE.Color(L.sky[2]).convertSRGBToLinear();
  const U = {
    map: { value: null }, pView: { value: PROJ.view }, pProj: { value: new THREE.Matrix4() }, sc: { value: new THREE.Vector2(1, 1) },
    half_: { value: B[1] }, ready: { value: 0 }, expo: { value: 1 }, base: { value: base },
  };
  const mat = new THREE.ShaderMaterial({ uniforms: U, vertexShader: VERT, fragmentShader: FRAG, fog: false, depthWrite: true });
  mat.userData.U = U; mats.add(mat); mat.addEventListener('dispose', () => mats.delete(mat));
  const IMG_A = 1824 / 862;
  const geoms = [];
  const root = new THREE.Group();
  // Projektörün en/boy oranı canlı kameranınkidir (ekran dönünce/değişince resim yine ekranı kaplar: kenarlar kırpılır)
  const upd = () => {
    U.pProj.value.copy(camera.projectionMatrix);
    const a = camera.aspect || 2;
    if (a > IMG_A) U.sc.value.set(1, IMG_A / a); else U.sc.value.set(a / IMG_A, 1);
    U.expo.value = renderer.toneMappingExposure || 1;
  };
  // Perdenin yarıçapı: resimdeki zemin kenarına giden ışının yere değdiği uzaklık (en az 21: boss perdeye girmesin)
  mat.userData.reshape = () => {
    for (const g of geoms) g.dispose(); geoms.length = 0; root.clear();
    const P = PROJ.pos, dir = PROJ.look.clone().sub(P).normalize();
    const pitch = Math.asin(dir.y), vfov = THREE.MathUtils.degToRad(camera.fov || 42);
    const a = camera.aspect || 2, sy = a > IMG_A ? IMG_A / a : 1;
    const ny = (1 - 2 * B[2]) / sy; // ufuk satırının projektör NDC'si
    const ang = pitch + Math.atan(ny * Math.tan(vfov / 2));
    const dist = ang < -0.02 ? P.y / Math.tan(-ang) : 60;
    const R = Math.min(60, Math.max(21, dist));
    // zemin: projektörün ayağı çevresinde geniş daire (perdenin biraz dışına taşar: kenarda boşluk görünmez)
    const g0 = new THREE.CircleGeometry(R + 2, 64).rotateX(-Math.PI / 2).translate(P.x, 0, P.z);
    // perde: projektörün baktığı yönde ±110° yay, yerden 45 birim yükseğe
    const th = Math.atan2(dir.x, dir.z) - THREE.MathUtils.degToRad(110); // silindirde açı θ → (sin θ, cos θ): yay ortası bakış yönünde
    const g1 = new THREE.CylinderGeometry(R, R, 45, 72, 1, true, th, THREE.MathUtils.degToRad(220));
    g1.translate(P.x, 22.5 - 0.05, P.z);
    geoms.push(g0, g1);
    const m0 = new THREE.Mesh(g0, mat), m1 = new THREE.Mesh(g1, mat);
    m1.material.side = THREE.DoubleSide;
    for (const m of [m0, m1]) { m.frustumCulled = false; m.renderOrder = -10; m.onBeforeRender = upd; root.add(m); }
    // karakter gölgeleri: zeminin hemen üstünde görünmez gölge düzlemi
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(40, 40).rotateX(-Math.PI / 2), new THREE.ShadowMaterial({ opacity: L.sh }));
    sh.receiveShadow = true; sh.position.y = 0.004; geoms.push(sh.geometry); root.add(sh);
  };
  mat.userData.reshape();
  group.add(root);
  tex(B[0], t => { if (!mats.has(mat)) return; U.map.value = t; const t0 = performance.now(); const f = () => { if (!mats.has(mat)) return; U.ready.value = Math.min(1, (performance.now() - t0) / 350); if (U.ready.value < 1) requestAnimationFrame(f); }; f(); });
  return root;
}
// Resim paketi (~4 MB) oyun açıldıktan biraz sonra boşta önden indirilir: ilk savaşta arka plan beklemeden gelir
if (typeof window !== 'undefined') setTimeout(() => (window.requestIdleCallback || setTimeout)(() => import('./savas-arka-png.js').catch(() => { })), 8000);
