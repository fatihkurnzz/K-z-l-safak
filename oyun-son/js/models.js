// 3D karakterler (klasik MMORPG tarzı: ağır plaka zırh, katmanlı omuzluk, parlayan +silahlar),
// prosedürel animasyonlar, efektler ve ortam.
import { THREE, scene, to, tween, wait, ease, particle, onUpdate, gfx, setExposure, setSkyEnv, setKeyLight, setSmokeLight } from './engine3d.js';
import { CAPE_STEPS } from '../shared/clan.js';
import { drawCape, capeColorHex } from './banner.js';
import { wind, patchStd, Batch, batchMaterial, bakeRigid, blobField, flameMaterial, shimmerMaterial, driftPoints, disposeTree } from './scenery.js';
import { weaponGlow, armorGlow, GLOW_LEVELS, EVENT_FX } from './fx-table.js';
import { swingArc, whirlRing, play as fxPlay } from './fx.js';
import { buildCharHead, applyBody } from './gorunus.js';
import { GLTFLoader } from '../vendor/three/examples/jsm/loaders/GLTFLoader.js'; // oyuncunun seçtiği görünüş (model.char): kafa, yüz, saç, sakal, vücut, boy
import { buildBackdrop, LIGHT as PHOTO_LIGHT } from './savas-arka.js'; // 22 Kas: savaş arka plan resimleri
export { slashArc, whirlRing, projectile, meteorStrike, shockwave, healAura } from './fx.js'; // efektler fx.js'e taşındı (eski içe aktarmalar çalışsın)

// Hazır silah modelleri (glTF): yüklenene dek prosedürel model kullanılır. Uzun Mızrak (kind 'scythe'):
// models/weapons/lance.glb (kullanıcının modeli, ~8 bin üçgene indirildi). Model +Y boyunca durur; sap z boyuna çevrilir.
// Deneme linki: .glb dosyası sunulamadığından model base64 .js modülü olarak gelir (yalnız yayın kopyası)
const loadGLB = (url, cb) => import('../' + url + '.js').then(m => { const s = atob(m.default), b = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i); new GLTFLoader().parse(b.buffer, '', cb, () => {}); }).catch(() => {});
const GLB_W = {};
loadGLB('models/weapons/lance.glb', g => {
  let geo = null; g.scene.traverse(o => { if (o.isMesh && !geo) geo = o.geometry; });
  if (!geo) return;
  if (!geo.attributes.normal) geo.computeVertexNormals();
  // Renk bölgeleri (Raptor, kullanıcının örneği): çelik ağız ve dip demiri, koyu sap, ortada altın sargı, altın bilezikler.
  // Model eğik durur: sapın ekseni y'ye göre kayar (cx), eksenden uzak noktalar çelik diken sayılır.
  const P = geo.attributes.position, col = new Float32Array(P.count * 3), C = new THREE.Color();
  const STEEL = new THREE.Color(0xc9d0d8), DARK = new THREE.Color(0x2b1b12), GOLD = new THREE.Color(0xd9a93e), WRAP = new THREE.Color(0x4a2e18);
  for (let i = 0; i < P.count; i++) {
    const x = P.getX(i), y = P.getY(i), off = Math.abs(x - (-0.041 + 0.35 * y));
    if (y >= 0.13 || y < -0.18) C.copy(STEEL);
    else if (off > 0.034) C.copy(STEEL);
    else if ((y > -0.15 && y < -0.11) || (y > 0.105 && y < 0.13)) C.copy(GOLD);
    else if (y > -0.08 && y < 0.09) C.copy(Math.floor((y + 1) / 0.016) % 2 ? GOLD : WRAP);
    else C.copy(DARK);
    col[i * 3] = C.r; col[i * 3 + 1] = C.g; col[i * 3 + 2] = C.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.rotateX(Math.PI / 2); geo.scale(2, 2, 2); geo.translate(0, 0, 0.45); geo.computeBoundingSphere();
  GLB_W.scythe = geo;
}, undefined, () => {});

// Eşyaya özgü hazır modeller (shared/items.js ITEM_GLB → models/items/<ad>.glb). Model y boyunca 0..1 boyunda (baş üstte),
// kalkanlarda ön yüz +z. Renk iki bölgeli tepe rengidir: y < grip → kabza/sap rengi, üstü baş rengi. Yüklenene dek prosedürel model.
// L: elde boy, h: tutuş noktası (0..1), w: 'staff' y boyunca durur, öbürleri z boyunca (kılıç düzeni)
const GLB_ITEM = {
  hell_breaker: { L: 1.35, h: 0.22, grip: 0.3, a: 0x9a3328, b: 0x2b1b12 }, iron_impact: { L: 1.45, h: 0.25, grip: 0.18, a: 0xaab0b8, b: 0x3a2a1c },
  giga_hammer: { L: 1.35, h: 0.2, grip: 0.25, a: 0xc9b48a, b: 0x3b2a1e }, lobo_hammer: { L: 0.95, h: 0.15, grip: 0.6, a: 0x8d949c, b: 0x4a2e18 },
  mirage_sword: { L: 1.5, h: 0.14, grip: 0.45, a: 0x9fb3c8, b: 0x3e3550 }, mirage_dagger: { L: 0.75, h: 0.18, grip: 0.3, a: 0xa9c4d8, b: 0x3a2a40 },
  dark_vane: { L: 0.75, h: 0.18, grip: 0.38, a: 0x4a4258, b: 0x1c1820 }, cleaver_dagger: { L: 0.7, h: 0.16, grip: 0.35, a: 0xc0c6cc, b: 0x4a2e18 },
  elixir_staff: { L: 2.0, h: 0.22, grip: 0.8, a: 0x5fd0ff, b: 0x6b4a2b, w: 'staff' }, wood_staff: { L: 2.0, h: 0.22, grip: 0.86, a: 0x8a6a3a, b: 0x6b4a2b, w: 'staff' },
  oasis_staff: { L: 2.0, h: 0.22, grip: 0.72, a: 0x5fe0b0, b: 0x6b4a2b, w: 'staff' },
  chitin_shield: { L: 0.9, a: 0x6e5a44, shield: true }, dread_shield: { L: 0.85, a: 0x5a6672, shield: true },
};
const GLB_I = {};
for (const [k, D] of Object.entries(GLB_ITEM)) loadGLB(`models/items/${k}.glb`, gl => {
  let geo = null; gl.scene.traverse(o => { if (o.isMesh && !geo) geo = o.geometry; });
  if (!geo) return;
  geo = geo.index ? geo.toNonIndexed() : geo; geo.computeVertexNormals();
  const P = geo.attributes.position, col = new Float32Array(P.count * 3), A = new THREE.Color(D.a), B = new THREE.Color(D.b ?? D.a);
  for (let i = 0; i < P.count; i += 3) { // üçgen başına renk (ağırlık merkezinin yüksekliği): sap ile baş arasında geçiş olmaz
    const y = (P.getY(i) + P.getY(i + 1) + P.getY(i + 2)) / 3, C = D.shield || y >= D.grip ? A : B;
    for (let j = i; j < i + 3; j++) { col[j * 3] = C.r; col[j * 3 + 1] = C.g; col[j * 3 + 2] = C.b; }
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  if (D.shield) geo.scale(D.L, D.L, D.L).rotateY(-Math.PI / 2);
  else { geo.translate(0, -D.h, 0).scale(D.L, D.L, D.L); if (D.w !== 'staff') geo.rotateX(Math.PI / 2).rotateZ(Math.PI / 2); }
  geo.computeBoundingSphere();
  GLB_I[k] = geo;
}, undefined, () => {});
const glbMat = (c, glow, lv) => c.M.plate(0xffffff, { map: null, bumpMap: null, vertexColors: true, roughness: 0.4, metalness: 0.5, side: THREE.DoubleSide, ...(glow ? { emissive: glow, emissiveIntensity: lv.emissive * 0.12 } : {}) });

// ---------- Yardımcılar ----------
function mesh(geo, material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  m.castShadow = true;
  return m;
}
const put = (parent, m) => (parent.add(m), m);
const cyl = (rt, rb, h, seg = 16, open = false) => new THREE.CylinderGeometry(rt, rb, h, seg, 1, open);
const halfSphere = (r, seg = 18) => new THREE.SphereGeometry(r, seg, 10, 0, Math.PI * 2, 0, Math.PI / 2);
// Shape'ler XY'de çizilir (x=genişlik, y=uzunluk, z=kalınlık) → (y=genişlik, z=uzunluk, x=kalınlık)
const REMAP = new THREE.Matrix4().set(0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1);
function extrude(shape, depth, bevel = 0.006) {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 1, curveSegments: 10 });
  g.translate(0, 0, -depth / 2);
  return g;
}

// ---------- Malzeme seti (karakter başına) ----------
// Oyma/kabartma desen: plaka zırhın üzerinde kıvrımlı süslemeler, kenar şeritleri, perçinler.
// Aynı tuval hem renk detayı (map) hem kabartma (bumpMap) olarak kullanılır.
let _engrave;
function engraveTex() {
  if (_engrave) return _engrave;
  const S = 512, cv = document.createElement('canvas'); cv.width = cv.height = S;
  const x = cv.getContext('2d');
  x.fillStyle = '#d8d8d8'; x.fillRect(0, 0, S, S);
  // fırçalanmış metal çizikleri
  for (let i = 0; i < 1400; i++) { x.globalAlpha = 0.05 + Math.random() * 0.08; x.fillStyle = Math.random() < 0.5 ? '#fff' : '#888'; x.fillRect(Math.random() * S, Math.random() * S, 30 + Math.random() * 80, 1); }
  x.globalAlpha = 1;
  // panel kenarları (kabartma şerit)
  x.strokeStyle = '#ffffff'; x.lineWidth = 10;
  for (const y of [18, S / 2, S - 18]) { x.beginPath(); x.moveTo(0, y); x.lineTo(S, y); x.stroke(); }
  x.strokeStyle = '#6a6a6a'; x.lineWidth = 3;
  for (const y of [32, S / 2 + 14, S / 2 - 14, S - 32]) { x.beginPath(); x.moveTo(0, y); x.lineTo(S, y); x.stroke(); }
  // kıvrımlı süslemeler (arabesk)
  x.lineCap = 'round';
  const scroll = (cx, cy, r, dir) => {
    x.strokeStyle = '#5a5a5a'; x.lineWidth = 6; x.beginPath();
    for (let a = 0; a < Math.PI * 3.2; a += 0.1) { const rr = r * (1 - a / (Math.PI * 4)); const px = cx + Math.cos(a * dir) * rr, py = cy + Math.sin(a * dir) * rr; a ? x.lineTo(px, py) : x.moveTo(px, py); }
    x.stroke();
    x.strokeStyle = '#f4f4f4'; x.lineWidth = 2; x.stroke();
  };
  for (let row = 0; row < 2; row++) for (let i = 0; i < 4; i++) {
    const cx = 64 + i * 128, cy = 128 + row * 256;
    scroll(cx - 30, cy, 42, 1); scroll(cx + 30, cy, 42, -1);
    x.strokeStyle = '#5a5a5a'; x.lineWidth = 5; x.beginPath(); x.moveTo(cx - 60, cy + 60); x.quadraticCurveTo(cx, cy - 20, cx + 60, cy + 60); x.stroke();
  }
  // perçinler
  for (let i = 0; i < 16; i++) for (const y of [8, S / 2 - 26, S - 8]) { const px = i * 32 + 16; const g = x.createRadialGradient(px - 2, y - 2, 0, px, y, 7); g.addColorStop(0, '#fff'); g.addColorStop(1, '#555'); x.fillStyle = g; x.beginPath(); x.arc(px, y, 6, 0, Math.PI * 2); x.fill(); }
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 1); t.anisotropy = 8; t.colorSpace = THREE.SRGBColorSpace;
  const bump = t.clone(); bump.colorSpace = THREE.NoColorSpace; bump.needsUpdate = true;
  return (_engrave = { map: t, bump });
}

// Silah çevresinde yükselen alev aurası (gürültü tabanlı shader; scenery.js: flameMaterial). Saat ortak rüzgâr saatidir.
export const auraUniforms = wind;

export class Mats {
  // u: karakterin bütün malzemelerinin paylaştığı değerler: dissolve (ölünce erime 0-1), flash (vuruş parlaması), glow (ışıma çarpanı)
  constructor() { this.list = []; this.u = { dissolve: { value: 0 }, flash: { value: 0 }, glow: { value: 1 } }; }
  add(m) { if (m.isMeshStandardMaterial && !m.userData.dd) patchStd(m, { fx: this.u }); this.list.push(m); return m; }
  // Koddan üretilen karakterin birleştirilmiş parçalarının tek malzemesi: renk, pürüzlülük, metallik ve ışıma köşe verisinden gelir;
  // oyma doku ve kabartma yalnızca plaka ve altın parçalarda (doku ağırlığı 1) görünür. Düşük kademede kabartma yoktur.
  batch() { const e = engraveTex(); return this.add(batchMaterial({ map: e.map, bumpMap: gfx.T.fx ? e.bump : null, bumpScale: 2.2, envMapIntensity: 0.85, side: THREE.DoubleSide }, { fx: this.u })); }
  plate(color, extra = {}) { const e = engraveTex(); return this.add(new THREE.MeshStandardMaterial({ color, metalness: 0.85, roughness: 0.4, envMapIntensity: 0.75, map: e.map, bumpMap: e.bump, bumpScale: 2.5, ...extra })); }
  enamel(color) { return this.add(new THREE.MeshStandardMaterial({ color, metalness: 0.4, roughness: 0.25, envMapIntensity: 0.9 })); }
  gold(color = 0xd9b04a, extra = {}) { const e = engraveTex(); return this.add(new THREE.MeshStandardMaterial({ color, metalness: 1, roughness: 0.3, envMapIntensity: 0.6, bumpMap: e.bump, bumpScale: 1.5, ...extra })); }
  cloth(color, extra = {}) { return this.add(new THREE.MeshStandardMaterial({ color, metalness: 0, roughness: 0.9, envMapIntensity: 0.15, ...extra })); }
  leather(color, extra = {}) { return this.add(new THREE.MeshStandardMaterial({ color, metalness: 0.05, roughness: 0.65, envMapIntensity: 0.5, ...extra })); }
  skin(color) { return this.add(new THREE.MeshStandardMaterial({ color, metalness: 0, roughness: 0.6, envMapIntensity: 0.4 })); }
  glow(color, intensity = 2.5) { return this.add(new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: intensity, metalness: 0.3, roughness: 0.3 })); }
  basic(color, extra = {}) { return this.add(new THREE.MeshBasicMaterial({ color, ...extra })); }
}
const darken = (hex, k) => new THREE.Color(hex).multiplyScalar(k).getHex();

// ---------- Silahlar (el içinde, +z ileri) ----------
// G: artılı silah parıltısı (fx-table.js: weaponGlow → { color: nadirlik rengi, level: +7…+10 basamağı, shimmer: Eşsiz süzmesi })
// ya da yalnızca renk (eski çağrılar). Parıltı artıyla büyür: +7 ışıyan gövde ve ince hale, +8 alev kılıfı, +9 iç alev ve
// kıvılcım, +10 en güçlü hâli. Eşsiz silah artısından bağımsız olarak boyunca yürüyen ışık süzmesini taşır.
// Irk imzası (konsept tablosu): Elentha düz, simetrik silah + kabzada altın halkalı mavi Ak Taş;
// Kragmir kanca ve diken (tek yana, asimetrik) + kızıl Kor Taşı taşı. c.faction yoksa (yaratıklar) silah değişmez.
// ---------- Zırh parıltısı (fx-table.js: armorGlow) ----------
// Gövde malzemelerinin ışıması (c.armGlowMats: { mt, base }) ve +9'dan itibaren gövdeyi saran ince alev / aura sarmalı.
// Düşük kademede (gfx.tier low/min) yalnızca ışıma ve seyrek kıvılcım vardır; sarmal yoktur.
export function armorGlowSetup(c, A) {
  c.glowMeshes ||= []; c.armGlow = A || null; c.armSparks = 0; c.armT = 0; c.armGlowMats = c.armGlowMats || [];
  if (!A) return;
  const soft = gfx.tier === 'low' || gfx.tier === 'min';
  c.armSparks = A.level.sparks * (soft ? 0.5 : 1);
  if (A.level.edge && !soft && c.root) {
    const geo = cyl(0.5, 0.42, 1.75, 20, true); geo.translate(0, 0.95, 0);
    const f = new THREE.Mesh(geo, c.M.add(flameMaterial(A.color, A.level.edge))); f.renderOrder = 4; f.frustumCulled = false;
    c.root.add(f); c.glowMeshes.push(f); c.armShell = f;
  }
  if (A.level.aura && c.root) { // +10: ayak altında ırk renginde yavaşça nabız atan halka (düşük kademede de tek, ucuz bir yüzey)
    const r = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.78, 40), c.M.basic(A.color, { transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    r.rotation.x = -Math.PI / 2; r.position.y = 0.03; r.renderOrder = 3; r.castShadow = false; r.userData.base = soft ? 0.22 : 0.32;
    c.root.add(r); c.glowMeshes.push(r); (c.auras ||= []).push(r); c.armAura = r;
  }
}
export function armorGlowTint(c, mt) { // bir gövde malzemesine ışıma ekler (kendinden aydınlık payı korunur)
  const A = c.armGlow; if (!A || !mt?.emissive) return;
  // malzemenin kendi ışıması korunur; nadirlik rengi artının gücüyle ölçeklenip üstüne eklenir (yoğunluk 1'de kalır → doyurmaz)
  const k = mt.emissiveIntensity || 1, base = mt.emissive.clone(), add = new THREE.Color(A.color).multiplyScalar(A.level.emissive / k);
  c.armGlowMats.push({ mt, base, add }); mt.emissive.copy(base).add(add);
}
export function armorGlowTick(c, dt, t) {
  const A = c.armGlow; if (!A || c.dead) return;
  const k = 1 + Math.sin(t * 2.6) * 0.14;
  for (const x of c.armGlowMats) x.mt.emissive.setRGB(x.base.r + x.add.r * k, x.base.g + x.add.g * k, x.base.b + x.add.b * k);
  if (c.armSparks && gfx.T.fx) {
    c.armT -= dt;
    if (c.armT < 0) { c.armT = 1 / c.armSparks; const v = c.root.position, s = c.scale || 1; particle(v.x + (Math.random() - 0.5) * 0.6 * s, v.y + (0.5 + Math.random() * 1.0) * s, v.z + (Math.random() - 0.5) * 0.6 * s, 0, 0.3, 0, A.color, 0.05, 0.7, 0.6, 0); }
  }
}
export function buildWeapon(kind, c, G) {
  if (kind === 'none') { c.glowSparks = 0; return new THREE.Group(); } // eli boş (silahsız kahraman)
  const g = buildWeaponCore(kind, c, G);
  if (c.faction === 'ocak' || c.faction === 'sancak') raceWeaponMark(g, kind, c, c.faction);
  if (G?.fx && kind !== 'shield') effectTip(g, c, G);
  return g;
}
// Efektli silahın ucu (WEAPON_FX: zehir, alev, şimşek, buzul): efektin renginde yumuşak ışıma; artı arttıkça büyür. Kıvılcımlar aynı renkte.
const FX_TEX = {};
function fxTex(hex) { // yumuşak kenarlı radyal ışıma (renk başına bir kez çizilir)
  if (FX_TEX[hex]) return FX_TEX[hex];
  const C = new THREE.Color(hex), r = Math.round(C.r * 255), gg = Math.round(C.g * 255), b = Math.round(C.b * 255), L = (k, a) => `rgba(${Math.round(r + (255 - r) * k)},${Math.round(gg + (255 - gg) * k)},${Math.round(b + (255 - b) * k)},${a})`;
  const cv = document.createElement('canvas'); cv.width = cv.height = 128; const x = cv.getContext('2d'), gr = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, L(0.85, 1)); gr.addColorStop(0.18, L(0.45, 0.85)); gr.addColorStop(0.5, L(0, 0.35)); gr.addColorStop(1, L(0, 0));
  x.fillStyle = gr; x.fillRect(0, 0, 128, 128);
  return (FX_TEX[hex] = new THREE.CanvasTexture(cv));
}
function effectTip(g, c, G) {
  // Işıma yalnızca vuran kısımda: silahın uzun ekseninde üst %45'lik bölgedeki köşe noktaları örneklenir (ağız, diken, uç);
  // sap ve kabza boş kalır. Uçta büyük bir küre, ağız boyunca küçük ışımalar. Artı arttıkça büyür.
  g.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(g.matrixWorld).invert(), pts = [], v = new THREE.Vector3();
  const bb = new THREE.Box3().setFromObject(g), size = bb.getSize(new THREE.Vector3()), ax = size.z >= size.y ? 'z' : 'y';
  const from = bb.min[ax] + size[ax] * 0.55;
  g.traverse(o => { if (!o.isMesh || !o.geometry?.attributes?.position) return; const P = o.geometry.attributes.position, m = new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld), step = Math.max(1, Math.floor(P.count / 400));
    for (let i = 0; i < P.count; i += step) { v.fromBufferAttribute(P, i).applyMatrix4(m); if (v[ax] >= from) pts.push(v.clone()); } });
  if (!pts.length) return;
  const k = 1 + 0.15 * Math.max(0, (G.plus || 7) - 7), tex = fxTex(G.color);
  const sm = o => c.M.add(new THREE.SpriteMaterial({ map: tex, color: 0xffffff, transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false }));
  const put = (p, s, o) => { const sp = new THREE.Sprite(sm(o)); sp.scale.setScalar(s); sp.position.copy(p); sp.userData.wfx = G.fx; g.add(sp); };
  pts.sort((a, b) => a[ax] - b[ax]);
  const n = Math.min(9, pts.length); // ağız boyunca eşit aralıklı ışımalar (tepeye doğru büyür)
  for (let i = 0; i < n; i++) { const p = pts[Math.floor((i + 0.5) / n * pts.length)], t = (i + 1) / n; put(p, (0.32 + 0.3 * t) * k, 0.38 + 0.25 * t); }
  const top = pts[pts.length - 1], mid = pts.reduce((a, p) => a.add(p), new THREE.Vector3()).multiplyScalar(1 / pts.length);
  put(mid, 1.5 * k, 0.6); put(mid, 0.55 * k, 0.95); put(top, 0.5 * k, 0.9); // ağzın ortasında büyük küre, en uçta parlak nokta
}
// Silahın imza taşının ve dikenlerin yeri: [eksen, taş konumu, uç konumu]
const MARK_AT = { sword: ['z', 0.08, 0.75], dagger: ['z', 0.08, 0.4], axe: ['z', 0.66, 0.95], mace: ['z', 0.5, 0.7], club: ['z', 0.5, 0.85], scythe: ['z', 1.28, 1.25], spear: ['z', 1.22, 1.3], staff: ['y', 1.18, 1.5], bow: ['z', 0, 0.5] };
// Ak Taş: altın halka + ışın saçan mavi kristal · Kor Taşı: kızıl taş üstünde dikey kara göz bebeği
export function signStone(M, faction, r = 0.05) {
  const g = new THREE.Group();
  if (faction === 'sancak') {
    const cr = mesh(new THREE.OctahedronGeometry(r * 0.8, 0), M.glow(0x58b4ff, 3)); cr.scale.y = 1.35; g.add(cr);
    g.add(mesh(new THREE.TorusGeometry(r * 1.15, r * 0.18, 6, 20), M.gold(0xf2c84a)));
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, ray = mesh(new THREE.ConeGeometry(r * 0.16, r * 0.7, 4), M.gold(0xf2c84a), Math.cos(a) * r * 1.6, Math.sin(a) * r * 1.6, 0); ray.rotation.z = a - Math.PI / 2; g.add(ray); }
  } else {
    const st = mesh(new THREE.SphereGeometry(r, 12, 10), M.glow(0xe0241a, 2.6)); st.scale.set(1, 1.25, 0.7); g.add(st);
    g.add(mesh(new THREE.BoxGeometry(r * 0.22, r * 1.7, r * 0.2), M.basic(0x120404), 0, 0, r * 0.62)); // dikey göz bebeği
    g.add(mesh(new THREE.TorusGeometry(r * 1.1, r * 0.16, 6, 18), M.gold(0xc9963a)));
  }
  return g;
}
function raceWeaponMark(g, kind, c, faction) {
  const at = MARK_AT[kind]; if (!at) return;
  const [ax, p0, p1] = at, M = c.M;
  const put = (o, d) => { if (ax === 'z') o.position.set(0.045, kind === 'bow' ? -0.14 : 0, d); else o.position.set(0, d, 0.045); return o; };
  const s = put(signStone(M, faction, kind === 'staff' ? 0.06 : 0.042), p0);
  s.rotation.y = ax === 'z' ? Math.PI / 2 : 0; g.add(s);
  if (faction === 'ocak') { // tek yana dönük kanca dikenler: siluet asimetrik olur
    const iron = M.plate(0x3a2622, { roughness: 0.5 });
    for (const [k, d] of [[1, p1], [0.7, p1 - (ax === 'z' ? 0.18 : 0.22)]]) {
      const h = mesh(new THREE.ConeGeometry(0.022 * k + 0.01, 0.2 * k, 5), iron);
      if (ax === 'z') { h.position.set(0, 0.07, d); h.rotation.x = -2.4; } else { h.position.set(0.08, d, 0); h.rotation.z = -0.9; }
      g.add(h);
    }
  } else { // simetrik altın-gümüş kakma halkalar
    for (const d of [p0 + (ax === 'z' ? 0.12 : 0.16), p0 - (ax === 'z' ? 0.12 : 0.16)]) { const ring = mesh(cyl(0.034, 0.034, 0.025, 12), M.gold(0xf2c84a)); if (ax === 'z') { ring.rotation.x = Math.PI / 2; ring.position.set(0, 0, d); } else ring.position.set(0, d, 0); g.add(ring); }
  }
}
// İskeletli kahramanların ırk parçaları (kemiklere takılır): baş, göğüs, iki omuz. Ölçüler 2,3 birim boy içindir.
export function raceBodyGear(M, faction) {
  const head = new THREE.Group(), chest = new THREE.Group(), shL = new THREE.Group(), shR = new THREE.Group();
  if (faction === 'ocak') {
    const bone = M.leather(0xe6dcc2, { roughness: 0.4 }), iron = M.plate(0x2e2220, { roughness: 0.55 });
    for (const s of [-1, 1]) { // boynuzlu miğfer: yana ve yukarı kıvrık iki boynuz
      const h1 = mesh(new THREE.ConeGeometry(0.05, 0.2, 7), bone, s * 0.13, 0.2, 0); h1.rotation.z = -s * 0.9; head.add(h1);
      const h2 = mesh(new THREE.ConeGeometry(0.03, 0.16, 6), bone, s * 0.2, 0.33, 0); h2.rotation.z = -s * 0.25; head.add(h2);
    }
    for (const [g, s] of [[shL, 1], [shR, -1]]) for (let i = 0; i < 3; i++) { // dikenli omuzluk
      const sp = mesh(new THREE.ConeGeometry(0.028, 0.16 - i * 0.03, 5), iron, s * (0.02 + i * 0.06), 0.12, 0); sp.rotation.z = -s * 0.35; g.add(sp);
    }
    for (let i = -2; i <= 2; i++) { // diş kolye + kayış
      const t = mesh(new THREE.ConeGeometry(0.014, 0.06, 4), bone, i * 0.045, -0.02 - Math.abs(i) * 0.012, 0.17); t.rotation.x = Math.PI; chest.add(t);
    }
    const eye = signStone(M, 'ocak', 0.06); eye.position.set(0, -0.1, 0.27); chest.add(eye);
  } else {
    const gold = M.gold(0xf2c84a), blue = M.enamel(0x2f62b8);
    const crest = mesh(new THREE.TorusGeometry(0.13, 0.02, 6, 18, Math.PI), gold, 0, 0.17, 0); crest.rotation.y = Math.PI / 2; head.add(crest); // başın üstünden önden arkaya altın sorguç
    const plume = mesh(new THREE.ConeGeometry(0.04, 0.3, 7), blue, 0, 0.27, -0.13); plume.rotation.x = -2.1; head.add(plume); // arkaya savrulan mavi tüy
    for (const g of [shL, shR]) { const r = mesh(new THREE.TorusGeometry(0.1, 0.016, 6, 18), gold, 0, 0.04, 0); r.rotation.x = Math.PI / 2; g.add(r); }
    const sun = signStone(M, 'sancak', 0.06); sun.position.set(0, -0.08, 0.27); chest.add(sun);
  }
  return { head, chest, shL, shR };
}
// Uzun Mızrak (Raptor) elde dik durur, ağzı (sivri uç) yere bakar (kullanıcı isteği 19 Kas): silah +z yerine −y boyunca;
// tutuş noktası sapın üst kısmına kayar ki ağız yere değmesin.
function lanceDown(g) { const o = new THREE.Group(); g.rotation.x = Math.PI / 2; g.position.y = 0.55; o.add(g); return o; }
function buildWeaponCore(kind, c, G) {
  const g = new THREE.Group();
  const M = c.M;
  if (typeof G === 'number') G = { color: G, level: GLOW_LEVELS[8], shimmer: false };
  const lv = G?.level || null, glow = lv ? G.color : null;
  c.glowSparks = lv ? lv.sparks : 0;
  c.glowMeshes ||= [];
  const steel = glow ? M.plate(0xe6ecf2, { emissive: glow, emissiveIntensity: lv.emissive }) : M.plate(0xd6dde4, { roughness: 0.2 });
  const GI = c.wglb && GLB_I[c.wglb];
  if (GI && kind !== 'shield') { // eşyanın kendi 3B modeli (GLB_ITEM)
    g.add(mesh(GI, glbMat(c, glow, lv)));
    return g;
  }
  const grip = M.leather(0x3a2414);
  const gold = M.gold();
  const aura = glow ? M.basic(glow, { transparent: true, opacity: lv.aura, blending: THREE.AdditiveBlending, depthWrite: false }) : null;
  // silahı saran kılıf: z ekseni boyunca açık silindir (uv.y = uzunluk)
  const sheath = (len, r, z0, axis, mat, order, k = 1) => {
    const geo = cyl(r * 0.6, r, len, 16, true);
    if (axis === 'z') geo.rotateX(-Math.PI / 2).translate(0, 0, z0 + len / 2); else geo.translate(0, z0 + len / 2, 0);
    const f = new THREE.Mesh(geo, M.add(mat));
    f.scale.set(k, axis === 'z' ? k : 1, axis === 'z' ? 1 : k); f.renderOrder = order;
    g.add(f); c.glowMeshes.push(f);
  };
  const flame = (len, r, z0, axis = 'z') => {
    if (G?.shimmer) sheath(len, r * 0.42, z0, axis, shimmerMaterial(G.color), 7);
    if (!lv || !lv.flame) return;
    sheath(len, r * (0.75 + 0.25 * lv.flame), z0, axis, flameMaterial(glow, lv.flame), 5);
    if (lv.flame >= 0.8) sheath(len, r, z0, axis, flameMaterial(new THREE.Color(glow).lerp(new THREE.Color(0xffffff), 0.45), lv.flame), 6, 0.6);
  };

  if (kind === 'scythe') {
    if (GLB_W.scythe) { // hazır model: bronz gövde, +basma ışıması emissive ile
      g.add(mesh(GLB_W.scythe, M.plate(0xffffff, { map: null, bumpMap: null, vertexColors: true, roughness: 0.38, metalness: 0.55, ...(glow ? { emissive: glow, emissiveIntensity: lv.emissive * 0.12 } : {}) })));
      flame(1.0, 0.32, 1.0);
      return lanceDown(g);
    }
    // uzun saplı tırpan: sapı z boyunca, ağzı tepede yukarı kıvrılır
    g.add(mesh(cyl(0.03, 0.035, 2.0, 10).rotateX(Math.PI / 2), M.plate(0x2a1c2e, { map: null, bumpMap: null }), 0, 0, 0.45));
    for (const z of [-0.5, 0.2, 1.3]) g.add(mesh(cyl(0.045, 0.045, 0.06, 10).rotateX(Math.PI / 2), gold, 0, 0, z));
    const s = new THREE.Shape();
    s.moveTo(0, 0); s.quadraticCurveTo(0.42, 0.28, 0.95, -0.12); s.quadraticCurveTo(0.5, 0.02, 0.05, -0.16); s.closePath();
    const blade = extrude(s, 0.02).applyMatrix4(REMAP);
    const b = mesh(blade, steel, 0, 0, 1.42); b.rotation.x = -0.9; g.add(b);
    const s2 = new THREE.Shape(); s2.moveTo(0, -0.04); s2.lineTo(0.4, 0); s2.lineTo(0, 0.04); s2.closePath();
    const spike = mesh(extrude(s2, 0.02).applyMatrix4(REMAP), steel, 0, 0, 1.44); spike.rotation.x = 2.2; g.add(spike);
    g.add(mesh(new THREE.OctahedronGeometry(0.06), M.glow(glow || 0xb04aff, 3), 0, 0, 1.44));
    flame(1.0, 0.32, 1.0);
    return lanceDown(g);
  }

  if (kind === 'spear') {
    // mızrak: uzun düz sap z boyunca, tepede yaprak biçimli ağız, altta dip demiri
    g.add(mesh(cyl(0.028, 0.032, 1.9, 10).rotateX(Math.PI / 2), M.leather(0x4a2f1c), 0, 0, 0.45));
    for (const z of [-0.2, 0.3, 1.32]) g.add(mesh(cyl(0.04, 0.04, 0.05, 10).rotateX(Math.PI / 2), gold, 0, 0, z));
    const s = new THREE.Shape();
    s.moveTo(-0.025, 0); s.quadraticCurveTo(-0.09, 0.14, -0.05, 0.28); s.lineTo(0, 0.42); s.lineTo(0.05, 0.28); s.quadraticCurveTo(0.09, 0.14, 0.025, 0); s.closePath();
    const head = extrude(s, 0.014).applyMatrix4(REMAP);
    g.add(mesh(head, steel, 0, 0, 1.36));
    if (aura) { const a = mesh(head, aura, 0, 0, 1.36); a.scale.set(2.6, 2, 1.05); a.castShadow = false; a.userData.base = lv.aura; g.add(a); c.auras.push(a); }
    g.add(mesh(new THREE.ConeGeometry(0.035, 0.14, 6).rotateX(-Math.PI / 2), steel, 0, 0, -0.55));
    flame(0.5, 0.18, 1.3);
  } else if (kind === 'sword' || kind === 'dagger') {
    const L = kind === 'sword' ? 0.95 : 0.45, W = kind === 'sword' ? 0.05 : 0.04;
    const s = new THREE.Shape();
    s.moveTo(-W, 0); s.lineTo(W, 0); s.lineTo(W * 0.85, L * 0.86); s.lineTo(0, L); s.lineTo(-W * 0.85, L * 0.86); s.closePath();
    const bladeGeo = extrude(s, 0.012).applyMatrix4(REMAP);
    g.add(mesh(bladeGeo, steel, 0, 0, 0.1));
    if (aura) { const a = mesh(bladeGeo, aura, 0, 0, 0.1); a.scale.set(3, 2.2, 1.05); a.castShadow = false; a.userData.base = lv.aura; g.add(a); c.auras.push(a); }
    // enine siper (kabza koruması) + uç topları
    g.add(mesh(new THREE.BoxGeometry(0.06, 0.34, 0.05), gold, 0, 0, 0.08));
    for (const s2 of [-1, 1]) g.add(mesh(new THREE.SphereGeometry(0.035, 10, 8), gold, 0, s2 * 0.18, 0.08));
    g.add(mesh(cyl(0.025, 0.028, 0.2, 8).rotateX(Math.PI / 2), grip, 0, 0, -0.03));
    g.add(mesh(new THREE.SphereGeometry(0.04, 10, 8), gold, 0, 0, -0.15));
    flame(L + 0.1, 0.16, 0.05);
  } else if (kind === 'axe') {
    flame(0.7, 0.3, 0.45);
    g.add(mesh(cyl(0.03, 0.035, 1.15, 8).rotateX(Math.PI / 2), grip, 0, 0, 0.35));
    const s = new THREE.Shape();
    s.moveTo(0, -0.07); s.lineTo(0.1, -0.1); s.quadraticCurveTo(0.33, -0.22, 0.36, 0); s.quadraticCurveTo(0.33, 0.22, 0.1, 0.1); s.lineTo(0, 0.07); s.closePath();
    const head = extrude(s, 0.03).applyMatrix4(REMAP);
    for (const sgn of [1, -1]) { const h = mesh(head, steel, 0, 0, 0.78); h.scale.y = sgn; g.add(h); if (aura) { const a = mesh(head, aura, 0, 0, 0.78); a.scale.set(2, sgn * 1.25, 1.25); a.castShadow = false; a.userData.base = lv.aura; g.add(a); c.auras.push(a); } }
    g.add(mesh(cyl(0.05, 0.05, 0.16, 8).rotateX(Math.PI / 2), gold, 0, 0, 0.78));
    g.add(mesh(new THREE.ConeGeometry(0.035, 0.16, 6).rotateX(Math.PI / 2), steel, 0, 0, 0.98));
  } else if (kind === 'mace' || kind === 'club') {
    g.add(mesh(cyl(0.03, 0.03, 0.7, 8).rotateX(Math.PI / 2), grip, 0, 0, 0.22));
    if (kind === 'club') {
      g.add(mesh(cyl(0.17, 0.07, 0.5, 8).rotateX(Math.PI / 2), M.leather(0x5b3e26), 0, 0, 0.7));
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; const sp = mesh(new THREE.ConeGeometry(0.03, 0.12, 5), M.plate(0x9aa0a6), 0, Math.cos(a) * 0.15, 0.78 + (i % 2) * 0.08); sp.rotation.x = -Math.PI / 2 + 0; sp.rotation.set(a + Math.PI / 2, 0, 0); g.add(sp); }
    } else {
      g.add(mesh(new THREE.SphereGeometry(0.09, 12, 10), gold, 0, 0, 0.62));
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; const f = mesh(new THREE.BoxGeometry(0.02, 0.1, 0.2), steel, Math.cos(a) * 0.07, Math.sin(a) * 0.07, 0.62); f.rotation.z = a; g.add(f); }
      if (glow) g.add(mesh(new THREE.SphereGeometry(0.05, 10, 8), M.glow(glow, 3), 0, 0, 0.74));
    }
    flame(0.45, 0.22, 0.42);
  } else if (kind === 'staff') {
    const wood = M.leather(0x4a2f1c);
    g.add(mesh(cyl(0.03, 0.04, 1.75, 8), wood, 0, 0.45, 0));
    for (const y of [0.1, 0.9, 1.2]) g.add(mesh(cyl(0.045, 0.045, 0.05, 10), gold, 0, y, 0));
    for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2; const p = mesh(new THREE.ConeGeometry(0.025, 0.28, 5), gold, Math.cos(a) * 0.07, 1.42, Math.sin(a) * 0.07); p.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5); g.add(p); }
    const col = c.fx || 0x88ccff;
    const orb = mesh(new THREE.OctahedronGeometry(0.11, 0), M.glow(col, 3), 0, 1.5, 0);
    orb.scale.y = 1.5;
    g.add(orb); c.orb = orb;
    const ring = mesh(new THREE.TorusGeometry(0.18, 0.012, 6, 28), M.glow(col, 2), 0, 1.5, 0);
    g.add(ring); c.spinners.push(ring);
    const halo = mesh(new THREE.SphereGeometry(0.22, 12, 10), M.basic(col, { transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false }), 0, 1.5, 0);
    halo.castShadow = false; halo.userData.base = 0.18; g.add(halo); c.auras.push(halo);
    flame(0.75, 0.28, 1.15, 'y');
  } else if (kind === 'bow') {
    const wood = M.leather(0x5a3a22);
    const pts = [[0.06, -0.64], [-0.06, -0.5], [-0.13, -0.2], [-0.14, 0], [-0.13, 0.2], [-0.06, 0.5], [0.06, 0.64]].map(([y, z]) => new THREE.Vector3(0, y, z));
    const limb = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.024, 6);
    g.add(mesh(limb, glow ? M.plate(0xcfd6dd, { emissive: glow, emissiveIntensity: lv.emissive * 0.5 }) : wood));
    g.add(mesh(cyl(0.035, 0.035, 0.16, 8).rotateX(Math.PI / 2), M.leather(0x2a1a10), 0, -0.14, 0));
    for (const z of [-0.64, 0.64]) g.add(mesh(new THREE.SphereGeometry(0.03, 8, 6), gold, 0, 0.06, z));
    g.add(mesh(cyl(0.004, 0.004, 1.28, 3).rotateX(Math.PI / 2), glow ? M.glow(glow, 3) : M.basic(0xeeeeee), 0, 0.06, 0));
    flame(1.35, 0.2, -0.68);
  }
  return g;
}

export function buildShield(c, look) {
  const M = c.M;
  if (c.sglb && GLB_I[c.sglb]) { const g = new THREE.Group(); g.add(mesh(GLB_I[c.sglb], glbMat(c))); return g; }
  const s = new THREE.Shape();
  s.moveTo(-0.26, 0.32); s.lineTo(0.26, 0.32); s.lineTo(0.26, 0.02); s.quadraticCurveTo(0.24, -0.36, 0, -0.52); s.quadraticCurveTo(-0.24, -0.36, -0.26, 0.02); s.closePath();
  const g = new THREE.Group();
  const rimGeo = extrude(s, 0.035, 0.01).rotateY(-Math.PI / 2);
  g.add(mesh(rimGeo, M.plate(darken(look.trim, 1.0))));
  const face = mesh(extrude(s, 0.02, 0).rotateY(-Math.PI / 2), M.enamel(look.accent ?? look.cape ?? look.armor), -0.02, 0, 0);
  face.scale.set(1, 0.86, 0.86);
  g.add(face);
  // amblem: altın baklava
  const d = new THREE.Shape(); d.moveTo(0, 0.14); d.lineTo(0.08, 0); d.lineTo(0, -0.14); d.lineTo(-0.08, 0); d.closePath();
  g.add(mesh(extrude(d, 0.02, 0.005).rotateY(-Math.PI / 2), M.gold(), -0.04, 0.02, 0));
  return g;
}

// ---------- Kask / saç ----------
function buildHead(look, c) {
  const M = c.M;
  const head = new THREE.Group();
  const skin = c.skinM;
  const skull = mesh(new THREE.SphereGeometry(0.19, 18, 14), skin, 0, 0.15, 0);
  skull.scale.set(0.95, 1.08, 1);
  head.add(skull);
  head.add(mesh(new THREE.BoxGeometry(0.04, 0.06, 0.05), skin, 0, 0.12, 0.19)); // burun
  const eyeMat = look.glowEyes ? M.glow(look.glowEyes, 4) : M.basic(0x15110e);
  for (const s of [-1, 1]) head.add(mesh(new THREE.BoxGeometry(0.045, 0.025, 0.02), eyeMat, s * 0.065, 0.17, 0.172));
  if (look.ears) for (const s of [-1, 1]) { const e = mesh(new THREE.ConeGeometry(0.05, 0.26, 4), skin, s * 0.22, 0.18, -0.02); e.rotation.z = -s * 1.25; head.add(e); }
  if (look.tusks) for (const s of [-1, 1]) head.add(mesh(new THREE.ConeGeometry(0.022, 0.1, 5), M.leather(0xf1e6c8), s * 0.06, 0.06, 0.16));

  const plate = c.plateM, trim = c.trimM;
  const visor = look.glowEyes ? M.glow(look.glowEyes, 3) : M.basic(0x0a0a0a);
  switch (look.helmet) {
    case 'knight': case 'plume': {
      head.add(mesh(cyl(0.215, 0.2, 0.3, 20), plate, 0, 0.14, 0));
      head.add(mesh(halfSphere(0.215, 20), plate, 0, 0.29, 0));
      head.add(mesh(new THREE.BoxGeometry(0.3, 0.035, 0.04), visor, 0, 0.17, 0.2));
      head.add(mesh(new THREE.BoxGeometry(0.035, 0.26, 0.03), trim, 0, 0.2, 0.205));
      head.add(mesh(new THREE.TorusGeometry(0.212, 0.014, 6, 24).rotateX(Math.PI / 2), trim, 0, 0.03, 0));
      const cs = new THREE.Shape(); cs.moveTo(0, 0); cs.quadraticCurveTo(0.12, 0.22, 0.46, 0.17); cs.lineTo(0.52, 0.06); cs.quadraticCurveTo(0.26, 0.05, 0, -0.04); cs.closePath();
      head.add(mesh(extrude(cs, 0.025, 0.006).rotateY(Math.PI / 2), trim, 0, 0.42, 0.14));
      for (const s of [-1, 1]) { const ck = mesh(new THREE.BoxGeometry(0.035, 0.2, 0.15), trim, s * 0.2, 0.08, 0.1); ck.rotation.y = s * 0.5; head.add(ck); }
      if (look.accent !== undefined) head.add(mesh(new THREE.TorusGeometry(0.216, 0.02, 6, 24).rotateX(Math.PI / 2), c.accentM, 0, 0.24, 0));
      if (look.helmet === 'plume') {
        const pm = M.cloth(look.cape);
        for (let i = 0; i < 7; i++) { const a = -0.3 + i * 0.35; const f = mesh(new THREE.BoxGeometry(0.05, 0.22, 0.09), pm, 0, 0.38 + Math.cos(a) * 0.12, -Math.sin(a) * 0.17); f.rotation.x = a; head.add(f); }
      }
      break;
    }
    case 'horned': {
      const dome = mesh(new THREE.SphereGeometry(0.215, 20, 12, 0, Math.PI * 2, 0, Math.PI / 1.75), plate, 0, 0.14, 0); head.add(dome);
      head.add(mesh(new THREE.BoxGeometry(0.035, 0.16, 0.03), trim, 0, 0.13, 0.205));
      head.add(mesh(new THREE.TorusGeometry(0.205, 0.016, 6, 24).rotateX(Math.PI / 2), trim, 0, 0.1, 0));
      const horn = M.leather(0xe6dcc2, { roughness: 0.4 });
      for (const s of [-1, 1]) {
        const pts = [new THREE.Vector3(s * 0.17, 0.25, 0), new THREE.Vector3(s * 0.3, 0.32, 0.02), new THREE.Vector3(s * 0.36, 0.48, 0.06), new THREE.Vector3(s * 0.33, 0.62, 0.12)];
        head.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 12, 0.035, 6), horn));
        const tip = mesh(new THREE.ConeGeometry(0.035, 0.12, 6), horn, s * 0.32, 0.67, 0.14); tip.rotation.x = 0.4; head.add(tip);
      }
      break;
    }
    case 'hood': {
      const cl = M.cloth(look.cape ?? look.armor, { side: THREE.DoubleSide });
      head.add(mesh(new THREE.SphereGeometry(0.235, 16, 10, Math.PI * 0.8, Math.PI * 1.4, 0, Math.PI * 0.72), cl, 0, 0.16, -0.01));
      const tip = mesh(new THREE.ConeGeometry(0.12, 0.3, 10), cl, 0, 0.3, -0.2); tip.rotation.x = -1.2; head.add(tip);
      break;
    }
    case 'wizard': {
      const hm = M.cloth(look.armor);
      head.add(mesh(cyl(0.36, 0.36, 0.025, 24), hm, 0, 0.3, 0));
      head.add(mesh(cyl(0.2, 0.22, 0.06, 20), M.gold(look.trim), 0, 0.34, 0));
      const lower = mesh(new THREE.ConeGeometry(0.2, 0.4, 16), hm, 0, 0.54, -0.01); head.add(lower);
      const tip = mesh(new THREE.ConeGeometry(0.11, 0.3, 12), hm, 0, 0.8, -0.08); tip.rotation.x = -0.6; head.add(tip);
      head.add(mesh(new THREE.OctahedronGeometry(0.04), M.glow(c.fx || 0xffaa33, 3), 0, 0.36, 0.2));
      if (look.beard) head.add(mesh(new THREE.BoxGeometry(0.3, 0.14, 0.1), M.cloth(look.hair ?? 0x8a8a8a), 0, 0.04, 0.14)); // sakal
      break;
    }
    case 'crown': {
      if (look.hair !== undefined) head.add(mesh(new THREE.SphereGeometry(0.2, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), M.cloth(look.hair), 0, 0.17, -0.01));
      const crownM = M.gold(0xe7c75a);
      head.add(mesh(cyl(0.2, 0.19, 0.07, 20, true), M.gold(0xe7c75a, { side: THREE.DoubleSide }), 0, 0.3, 0));
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; head.add(mesh(new THREE.ConeGeometry(0.03, i % 2 ? 0.1 : 0.16, 5), crownM, Math.cos(a) * 0.19, 0.38 + (i % 2 ? 0 : 0.03), Math.sin(a) * 0.19)); }
      head.add(mesh(new THREE.OctahedronGeometry(0.035), M.glow(c.fx || 0xff3355, 3), 0, 0.31, 0.2));
      break;
    }
    default:
      if (look.hair !== undefined) {
        const hm = M.cloth(look.hair);
        head.add(mesh(new THREE.SphereGeometry(0.205, 16, 10, 0, Math.PI * 2, 0, Math.PI / 1.9), hm, 0, 0.16, -0.01));
        head.add(mesh(new THREE.BoxGeometry(0.34, 0.3, 0.1), hm, 0, 0.04, -0.15));
        if (look.longHair) head.add(mesh(new THREE.BoxGeometry(0.22, 0.38, 0.08), hm, 0, -0.2, -0.17));
      }
  }
  return head;
}

// ---------- Omuzluk ----------
function buildPauldron(c, s, type, look) {
  const g = new THREE.Group();
  if (type === 'plate' || type === 'heavy') {
    const n = type === 'heavy' ? 3 : 2;
    for (let i = 0; i < n; i++) {
      const r = 0.24 - i * 0.035;
      const layer = new THREE.Group();
      layer.position.set(s * 0.02 * i, 0.06 - i * 0.085, 0);
      layer.rotation.z = -s * (0.32 + i * 0.16);
      const dome = mesh(halfSphere(r), c.plateM); dome.scale.set(1, 0.72, 1.05); layer.add(dome);
      const rim = mesh(new THREE.TorusGeometry(r, 0.016, 6, 24), c.trimM); rim.rotation.x = Math.PI / 2; rim.scale.y = 1.05; layer.add(rim);
      g.add(layer);
    }
    const th0 = s > 0 ? Math.PI / 2 - 0.95 : Math.PI * 1.5 - 0.95;
    const flange = mesh(new THREE.CylinderGeometry(0.21, 0.25, 0.24, 14, 1, true, th0, 1.9), c.flangeM, 0, 0.18, 0);
    flange.rotation.z = -s * 0.28; g.add(flange);
    const lip = mesh(new THREE.CylinderGeometry(0.215, 0.215, 0.03, 14, 1, true, th0, 1.9), c.trimM, 0, 0.3, 0);
    lip.rotation.z = -s * 0.28; lip.position.x = -s * 0.035; g.add(lip);
    if (look.accent !== undefined) { const lay = new THREE.Group(); lay.rotation.z = -s * 0.48; lay.position.set(s * 0.02, -0.03, 0); const ac = mesh(new THREE.TorusGeometry(0.19, 0.022, 6, 24).rotateX(Math.PI / 2), c.accentM); lay.add(ac); g.add(lay); }
    if (look.spikes) for (let k = 0; k < 3; k++) { const sp = mesh(new THREE.ConeGeometry(0.04, 0.22, 6), c.trimM, s * (0.04 + k * 0.03), 0.2, -0.08 + k * 0.08); sp.rotation.z = -s * 0.5; g.add(sp); }
  } else if (type === 'leather') {
    const d = mesh(halfSphere(0.19), c.leatherM); d.scale.set(1, 0.6, 1.05); d.rotation.z = -s * 0.35; d.position.y = 0.04; g.add(d);
    const rim = mesh(new THREE.TorusGeometry(0.19, 0.012, 6, 20), c.trimM); rim.rotation.set(Math.PI / 2, 0, 0); rim.position.y = 0.04; g.add(rim);
  }
  return g;
}

// ---------- Klan pelerini ----------
// Klandaki oyuncunun bütün kahramanları taşır: kumaş klanın seçtiği renkte, sırtında sancağın arması (banner.js: drawCape).
// Boyu klan seviyesine göre basamaklıdır (shared/clan.js CAPE_STEPS: omuzdan yere); yere değen kısım geriye yayılır.
// cape: { c: pelerin rengi, a: renk çifti, s: amblem, l: boy basamağı } · H: yakanın yerden yüksekliği (model biriminde)
// Prosedürel modelde gövdeye, iskeletli modelde omurga kemiğine bağlanır; update() kumaşı hafifçe dalgalandırır.
const capeTexCache = new Map();
function capeTex(cape, aspect) {
  const h = Math.max(96, Math.min(640, Math.round(256 * aspect / 32) * 32)), key = `${cape.c}.${cape.a}.${cape.s}.${h}`;
  let t = capeTexCache.get(key);
  if (!t) { t = new THREE.CanvasTexture(drawCape(cape, 256, h)); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; capeTexCache.set(key, t); }
  return t;
}
export class ClanCape {
  constructor(c, cape, { H = 1.86, bulge = 0.04, slant = 0.1, width = 0.8 } = {}) {
    const L = this.L = (CAPE_STEPS[cape.l] || CAPE_STEPS[0]).len * H;
    this.H = H; this.bulge = bulge; this.slant = slant; this.walk = 0; this.phase = Math.random() * 6;
    // düzlem y ekseninde π döndürülür: ön yüzü (doku düz okunur) dışarıya, karakterin arkasına bakar
    const geo = new THREE.PlaneGeometry(width, L, 6, Math.max(6, Math.round(L * 10))).translate(0, -L / 2, 0).rotateY(Math.PI);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setX(i, pos.getX(i) * (0.72 + 0.44 * (-pos.getY(i) / L) * Math.min(1, L / 1.3))); // yakada dar, etekte geniş
    this.base = pos.array.slice();
    this.mesh = mesh(geo, c.M.cloth(0xffffff, { map: capeTex(cape, L / width), side: THREE.DoubleSide }));
    this.group = new THREE.Group();
    this.group.add(this.mesh);
    // yaka şeridi ve iki toka
    const band = mesh(new THREE.BoxGeometry(width * 0.74, 0.05, 0.05), c.M.cloth(capeColorHex(cape)), 0, -0.01, -bulge * 0.3);
    this.group.add(band);
    const clasp = c.M.gold();
    for (const s of [-1, 1]) this.group.add(mesh(new THREE.SphereGeometry(0.035, 10, 8), clasp, s * width * 0.36, 0, 0.01));
    this.update(0, 0, 0);
  }
  update(dt, t, walk = 0) {
    this.walk += (walk - this.walk) * Math.min(1, dt * 6);
    const pos = this.mesh.geometry.attributes.position, a = pos.array, b = this.base, L = this.L, fd = this.H - 0.05, w = this.walk;
    for (let i = 0; i < pos.count; i++) {
      const x = b[i * 3], d = -b[i * 3 + 1], sm = Math.min(1, d / 0.22);
      // sırttan uzaklaşma (yakadan hemen sonra) + eğim (koşarken geriye savrulur) + uca doğru büyüyen dalga
      let z = -(this.bulge * sm * sm * (3 - 2 * sm) + d * (this.slant + w * 0.42));
      z -= Math.sin(t * 2.4 + d * 3.4 + this.phase) * 0.028 * d * (1 + w) + Math.sin(t * 3.3 + x * 6 + d * 2) * 0.012 * d;
      z += Math.abs(x) * 0.16 * (1 - 0.7 * d / L); // kenarlar omuzları hafifçe sarar
      let y = -d;
      if (d > fd) { z -= (d - fd) * 0.95; y = -fd; } // yere değen kısım geriye yayılır
      a[i * 3 + 1] = y; a[i * 3 + 2] = z;
    }
    pos.needsUpdate = true;
    this.mesh.geometry.computeVertexNormals();
  }
}

// ---------- Karakter ----------
export class Character {
  // Irk süsü (ucuz, kodla): Kragmir kemik boynuz + dikenli omuz, Elentha mavi tüy sorguç + altın omuz halkası
  raceGear(f, head, look) {
    const M = this.M;
    if (f === 'ocak') {
      const bone = M.leather(0xe6dcc2, { roughness: 0.4 });
      if (look.helmet !== 'horned' && look.helmet !== 'wizard' && look.helmet !== 'hood') for (const s of [-1, 1]) { const h = mesh(new THREE.ConeGeometry(0.045, 0.24, 6), bone, s * 0.17, 0.4, 0); h.rotation.z = -s * 0.5; head.add(h); }
      this.raceSpikes = bone;
    } else if (look.helmet !== 'plume' && look.helmet !== 'wizard' && look.helmet !== 'hood') {
      const pm = M.cloth(0x2f62b8);
      for (let i = 0; i < 4; i++) { const a = -0.2 + i * 0.3; head.add(mesh(new THREE.BoxGeometry(0.045, 0.16, 0.08), pm, 0, 0.44 + Math.cos(a) * 0.06, -0.02 - Math.sin(a) * 0.15)).rotation.x = a; }
    }
  }
  constructor(look, model = {}) {
    const M = this.M = new Mats();
    const ch = this.charLook = model.char || null; // karakter görünüşü (gorunus.js): varsa kask yerine yüz ve saç çizilir
    this.fx = look.fx;
    this.auras = []; this.spinners = [];
    this.root = new THREE.Group();
    this.scale = look.scale || 1;
    this.root.scale.setScalar(this.scale);
    const weapon = this.weaponKind = look.weapon || model.weapon || 'sword';
    const shield = look.shield ?? model.shield ?? false;
    const robe = look.robe ?? model.robe ?? false;
    const type = this.armorType = look.armorType || model.armorType || (robe ? 'robe' : weapon === 'bow' ? 'leather' : 'plate');
    const plus = model.plus || 0;
    this.plus = plus;
    // artılı silah parıltısı: rengi nadirlikten (model.g), gücü artıdan gelir (fx-table.js)
    const G = weaponGlow(plus, model.g, model.faction, model.fx), glow = G?.level ? G.color : null;

    this.armGlowMats = [];
    armorGlowSetup(this, armorGlow(model.ap, model.ag, model.faction)); // ışıma, +9 alev kenarı, +10 ayak halkası
    this.plateM = M.plate(look.armor);
    this.trimM = M.gold(look.trim);
    this.skinM = M.skin(ch ? ch.skin : look.skin);
    this.leatherM = M.leather(type === 'leather' ? look.armor : 0x4a3220);
    this.clothM = M.cloth(look.armor);
    this.accentM = M.enamel(look.accent ?? look.trim);
    this.flangeM = M.plate(look.armor, { side: THREE.DoubleSide });
    for (const m of [this.plateM, this.leatherM, this.clothM, this.flangeM]) armorGlowTint(this, m);
    const under = M.cloth(darken(look.trim, 0.35));
    const bones = type === 'bones';
    const bodyM = type === 'plate' ? this.plateM : type === 'leather' ? this.leatherM : bones ? this.skinM : this.clothM;

    const hips = this.hips = new THREE.Group();
    hips.position.y = 1.0;
    this.root.add(hips);

    // --- gövde ---
    const torso = this.torso = new THREE.Group();
    hips.add(torso);
    if (bones) {
      torso.add(mesh(cyl(0.06, 0.06, 0.6, 8), this.skinM, 0, 0.45, -0.08));
      for (let i = 0; i < 4; i++) { const r = mesh(new THREE.TorusGeometry(0.2 - i * 0.02, 0.025, 6, 16, Math.PI * 1.6), this.skinM, 0, 0.7 - i * 0.1, -0.02); r.rotation.set(Math.PI / 2, 0, Math.PI * 0.7); r.scale.set(1, 0.75, 1); torso.add(r); }
      put(torso, mesh(cyl(0.22, 0.18, 0.12, 12), this.skinM, 0, 0.06, 0)).scale.z = 0.7;
    } else {
      const abd = mesh(cyl(0.29, 0.27, 0.26, 18), bodyM, 0, 0.18, 0); abd.scale.z = 0.74; torso.add(abd);
      const chest = mesh(cyl(0.4, 0.3, 0.46, 20), bodyM, 0, 0.52, 0); chest.scale.z = 0.72; torso.add(chest);
      if (type === 'plate') {
        for (const y of [0.1, 0.22]) { const l = mesh(cyl(0.295, 0.295, 0.025, 18), this.trimM, 0, y, 0); l.scale.z = 0.76; torso.add(l); }
        const em = mesh(cyl(0.075, 0.075, 0.02, 16).rotateX(Math.PI / 2), this.trimM, 0, 0.58, 0.25); em.rotation.x = -0.3; torso.add(em);
        torso.add(mesh(new THREE.OctahedronGeometry(0.03), glow ? M.glow(glow, 3) : M.gold(0xb3122a), 0, 0.58, 0.27));
        for (const s of [-1, 1]) {
          const pec = mesh(new THREE.SphereGeometry(0.17, 16, 12), this.plateM, s * 0.14, 0.6, 0.16); pec.scale.set(1, 0.72, 0.5); torso.add(pec);
          const v = mesh(new THREE.BoxGeometry(0.05, 0.36, 0.03), this.accentM, s * 0.1, 0.46, 0.235); v.rotation.set(-0.2, 0, s * 0.45); torso.add(v);
          const vt = mesh(new THREE.BoxGeometry(0.018, 0.38, 0.035), this.trimM, s * 0.135, 0.47, 0.24); vt.rotation.set(-0.2, 0, s * 0.45); torso.add(vt);
        }
        torso.add(mesh(new THREE.BoxGeometry(0.03, 0.3, 0.04), this.trimM, 0, 0.2, 0.22));
      }
      if (type === 'leather') {
        const strap = mesh(new THREE.BoxGeometry(0.07, 0.62, 0.03), M.leather(0x2a1a10), 0, 0.45, 0.24); strap.rotation.z = 0.7; torso.add(strap);
        const quiver = mesh(cyl(0.07, 0.06, 0.55, 10), M.leather(0x4a2c18), 0.12, 0.55, -0.27); quiver.rotation.z = -0.4; torso.add(quiver);
        for (let i = 0; i < 4; i++) torso.add(mesh(new THREE.BoxGeometry(0.02, 0.1, 0.02), M.cloth(0xeeeeee), 0.25 + i * 0.015, 0.86 + (i % 2) * 0.02, -0.27 + (i - 1.5) * 0.02));
      }
      if (type === 'robe') {
        // omuz pelerini (mantle) + yaka
        const mant = mesh(cyl(0.2, 0.5, 0.3, 20, true), M.cloth(look.cape ?? look.trim, { side: THREE.DoubleSide }), 0, 0.72, 0); mant.scale.z = 0.8; torso.add(mant);
        put(torso, mesh(new THREE.TorusGeometry(0.5, 0.018, 6, 30).rotateX(Math.PI / 2), this.trimM, 0, 0.57, 0)).scale.z = 0.8;
        put(torso, mesh(new THREE.BoxGeometry(0.1, 0.52, 0.02), this.trimM, 0, 0.36, 0.26)).rotation.x = -0.12;
      }
      const gorget = mesh(cyl(0.15, 0.24, 0.13, 18), type === 'plate' ? this.plateM : under, 0, 0.8, 0); gorget.scale.z = 0.85; torso.add(gorget);
    }
    torso.add(mesh(cyl(0.075, 0.085, 0.14, 10), this.skinM, 0, 0.9, 0));
    // kemer + toka
    put(torso, mesh(cyl(0.305, 0.31, 0.08, 18), M.leather(0x2a1a10), 0, 0.04, 0)).scale.z = 0.76;
    torso.add(mesh(new THREE.BoxGeometry(0.1, 0.08, 0.03), M.gold(), 0, 0.04, 0.24));
    // etek: plaka dilimler / deri etek / uzun cübbe
    if (type === 'plate') {
      const tasset = (x, z, ry, rz) => { const t = mesh(new THREE.BoxGeometry(0.2, 0.3, 0.025), this.plateM, x, -0.14, z); t.rotation.set(-0.18, ry, rz); torso.add(t); const ac = mesh(new THREE.BoxGeometry(0.05, 0.26, 0.03), this.accentM, x, -0.14, z + 0.01); ac.rotation.copy(t.rotation); torso.add(ac); const e = mesh(new THREE.BoxGeometry(0.2, 0.025, 0.03), this.trimM, x, -0.28, z + 0.025); e.rotation.copy(t.rotation); torso.add(e); };
      tasset(-0.12, 0.23, 0, 0.05); tasset(0.12, 0.23, 0, -0.05); tasset(-0.27, 0.02, -Math.PI / 2, 0); tasset(0.27, 0.02, Math.PI / 2, 0);
      put(torso, mesh(cyl(0.29, 0.34, 0.3, 16, true), under, 0, -0.14, 0)).scale.z = 0.8;
    } else if (type === 'leather') {
      put(torso, mesh(cyl(0.3, 0.37, 0.34, 16, true), this.leatherM, 0, -0.15, 0)).scale.z = 0.8;
    } else if (type === 'robe') {
      const r = mesh(cyl(0.3, 0.56, 1.0, 22, true), M.cloth(look.armor, { side: THREE.DoubleSide }), 0, -0.48, 0); r.scale.z = 0.82; torso.add(r);
      const hem = mesh(new THREE.TorusGeometry(0.555, 0.022, 6, 32).rotateX(Math.PI / 2), this.trimM, 0, -0.97, 0); hem.scale.z = 0.82; torso.add(hem);
      put(torso, mesh(new THREE.BoxGeometry(0.12, 0.98, 0.02), this.trimM, 0, -0.47, 0.37)).rotation.x = -0.25;
    }

    // --- pelerin (dalgalanır) ---
    // Kahramanlar (model.hero) yalnızca klan pelerini taşır; klansız kahramanın pelerini yoktur. Yaratıkların kendi pelerini durur.
    if (model.cape && !bones) {
      const robed = type === 'robe';
      this.clanCape = new ClanCape(this, model.cape, { H: 1.86, bulge: robed ? 0.24 : 0.05, slant: robed ? 0.13 : 0.1, width: robed ? 0.86 : 0.8 });
      this.clanCape.group.position.set(0, 0.86, robed ? -0.2 : -0.3);
      torso.add(this.clanCape.group);
    } else if (look.cape !== undefined && type !== 'robe' && !model.hero) {
      const geo = new THREE.PlaneGeometry(0.72, 1.5, 4, 12).translate(0, -0.75, 0);
      this.capeBase = geo.attributes.position.array.slice();
      this.cape = mesh(geo, M.cloth(look.cape, { side: THREE.DoubleSide }), 0, 0.84, -0.25);
      torso.add(this.cape);
    }

    // --- kafa ---
    const head = this.head = ch ? buildCharHead(this, ch, look) : buildHead(look, this);
    head.position.y = 0.95;
    torso.add(head);
    if (!ch && model.faction && look.helmet !== 'none' && gfx.T.dress !== false) this.raceGear(model.faction, head, look);

    // --- kollar (omuz → dirsek → el) ---
    const makeArm = s => {
      const arm = new THREE.Group(); arm.position.set(s * 0.44, 0.78, 0);
      const sleeveM = type === 'plate' ? under : type === 'leather' ? under : bones ? this.skinM : this.clothM;
      arm.add(mesh(cyl(0.085, 0.075, 0.38, 12), sleeveM, 0, -0.2, 0));
      if (type === 'plate') arm.add(mesh(cyl(0.095, 0.085, 0.22, 12), this.plateM, 0, -0.24, 0));
      const pauldronType = bones ? 'none' : type === 'plate' ? (look.spikes || this.scale > 1.3 ? 'heavy' : 'plate') : type === 'leather' ? 'leather' : (look.pauldrons || model.pauldrons ? 'plate' : 'none');
      arm.add(buildPauldron(this, s, pauldronType, look));
      if (model.faction === 'ocak' && !bones) for (const dz of [-0.07, 0.07]) { const sp = mesh(new THREE.ConeGeometry(0.035, 0.17, 5), this.raceSpikes || M.leather(0xe6dcc2), s * 0.04, 0.17, dz); sp.rotation.z = -s * 0.35; arm.add(sp); }
      else if (model.faction === 'sancak' && !bones) arm.add(mesh(new THREE.TorusGeometry(0.115, 0.014, 6, 16).rotateX(Math.PI / 2), this.trimM, 0, 0.08, 0));
      const elbow = new THREE.Group(); elbow.position.y = -0.4; arm.add(elbow);
      if (type === 'robe') {
        elbow.add(mesh(cyl(0.08, 0.17, 0.42, 14, true), M.cloth(look.armor, { side: THREE.DoubleSide }), 0, -0.14, 0));
        elbow.add(mesh(new THREE.TorusGeometry(0.17, 0.015, 6, 18).rotateX(Math.PI / 2), this.trimM, 0, -0.35, 0));
      } else {
        if (type === 'plate') elbow.add(mesh(new THREE.SphereGeometry(0.075, 12, 8), this.plateM));
        elbow.add(mesh(cyl(0.07, bones ? 0.06 : 0.1, 0.3, 12), bones ? this.skinM : type === 'plate' ? this.plateM : this.leatherM, 0, -0.17, 0));
        if (!bones) elbow.add(mesh(new THREE.TorusGeometry(0.098, 0.012, 6, 16).rotateX(Math.PI / 2), this.trimM, 0, -0.31, 0));
      }
      const hand = new THREE.Group(); hand.position.y = -0.37; elbow.add(hand);
      hand.add(mesh(new THREE.BoxGeometry(0.1, 0.12, 0.11), type === 'plate' ? this.plateM : this.skinM));
      hips.add(arm);
      return { arm, elbow, hand };
    };
    const L = makeArm(-1), R = makeArm(1);
    this.armL = L.arm; this.elbowL = L.elbow; this.armR = R.arm; this.elbowR = R.elbow;

    // --- silah & kalkan ---
    this.faction = model?.faction || null; // silahın ırk imzası (buildWeapon)
    this.wglb = model?.glb || null; this.sglb = model?.sglb || null; // eşyanın hazır 3B modeli (GLB_ITEM)
    const w = this.weapon = buildWeapon(weapon, this, G);
    w.position.set(0, weapon === 'bow' ? 0.12 : -0.02, 0.02);
    (weapon === 'bow' ? L.hand : R.hand).add(w);
    this.glowColor = glow;
    if (shield) { const sh = buildShield(this, look); sh.position.set(-0.1, -0.05, 0.04); L.hand.add(sh); }

    // --- bacaklar (kalça → diz → ayak) ---
    const makeLeg = s => {
      const leg = new THREE.Group(); leg.position.set(s * 0.15, 0, 0);
      const thighM = bones ? this.skinM : type === 'plate' ? this.plateM : type === 'leather' ? M.leather(darken(look.armor, 0.6)) : under;
      leg.add(mesh(cyl(bones ? 0.05 : 0.12, bones ? 0.05 : 0.1, 0.46, 12), thighM, 0, -0.24, 0));
      const knee = new THREE.Group(); knee.position.y = -0.49; leg.add(knee);
      if (type === 'plate') { const kc = mesh(new THREE.SphereGeometry(0.08, 12, 8), this.plateM, 0, 0, 0.05); knee.add(kc); knee.add(mesh(new THREE.ConeGeometry(0.04, 0.08, 6).rotateX(Math.PI / 2), this.trimM, 0, 0, 0.12)); }
      const shinM = bones ? this.skinM : type === 'plate' ? this.plateM : M.leather(0x3a2616);
      knee.add(mesh(cyl(bones ? 0.045 : 0.095, bones ? 0.045 : 0.08, 0.42, 12), shinM, 0, -0.22, 0));
      knee.add(mesh(new THREE.BoxGeometry(0.14, 0.09, 0.27), type === 'plate' ? this.plateM : M.leather(0x2a1a10), 0, -0.46, 0.05));
      if (type === 'plate') {
        knee.add(mesh(new THREE.ConeGeometry(0.07, 0.16, 4).rotateY(Math.PI / 4).rotateX(Math.PI / 2), this.plateM, 0, -0.47, 0.25));
        knee.add(mesh(new THREE.BoxGeometry(0.035, 0.32, 0.03), this.accentM, 0, -0.2, 0.09));
        knee.add(mesh(new THREE.TorusGeometry(0.1, 0.014, 6, 16).rotateX(Math.PI / 2), this.trimM, 0, -0.42, 0));
      }
      hips.add(leg);
      return { leg, knee };
    };
    const LL = makeLeg(-1), RL = makeLeg(1);
    this.legL = LL.leg; this.kneeL = LL.knee; this.legR = RL.leg; this.kneeR = RL.knee;

    // poz değerleri (tween'ler bunları değiştirir, update() uygular)
    this.pose = { armRX: 0, armRZ: 0, armLX: 0, armLZ: 0, elbR: 0, elbL: 0, lean: 0, spin: 0, hop: 0, walk: 0, cast: 0, crouch: 0, twist: 0, stance: 1 };
    // savaş duruşu (silaha göre); combatTarget=1 iken uygulanır
    this.combat = 0; this.combatTarget = 0;
    this.stanceDef = weapon === 'bow' ? { armRX: -0.25, elbR: -0.4, armLX: -0.65, elbL: -0.2, crouch: 0.1, twist: -0.25 }
      : weapon === 'staff' ? { armRX: -0.45, elbR: -0.45, armLX: -0.35, elbL: -0.5, crouch: 0.06, twist: 0.1 }
      : { armRX: -0.65, elbR: -0.75, armLX: -0.55, elbL: -0.7, crouch: 0.16, twist: 0.2 };
    this.phase = Math.random() * 10;
    this.dead = false;
    this.flash = 0;
    // Parçalar eklem başına tek ağda toplanır (çizim çağrısı ~100'den ~15'e iner): renk, pürüzlülük, metallik ve ışıma köşe
    // verisine geçer; alttan kararma pişirilir. Kumaşı dalgalanan pelerin, küre, halkalar ve saydam haleler ayrı kalır.
    if (ch) applyBody(this, ch);
    const dyn = new Set([this.cape, this.clanCape?.mesh, this.orb, ...this.auras, ...this.spinners].filter(Boolean));
    bakeRigid(this.root, [this.root, hips, torso, head, this.armL, this.elbowL, this.armR, this.elbowR, this.legL, this.kneeL, this.legR, this.kneeR], M.batch(), o => dyn.has(o), { under: 0.34, jitter: 0.035 });
    this.root.traverse(o => { if (o.isMesh) o.receiveShadow = false; });
    this._p = { ...this.pose };

    // yüksek + silahlarda kıvılcımlar
    this.sparkT = 0; this.deathN = 0;
  }

  update(dt, t) {
    const p0 = this.pose, ph = t * 2.2 + this.phase;
    const idle = this.dead ? 0 : 1;
    this.combat += (this.combatTarget - this.combat) * Math.min(1, dt * 4);
    const w = this.combat * p0.stance * idle, st = this.stanceDef;
    const p = this._p; // kare başına nesne üretmemek için aynı nesne yeniden doldurulur
    for (const k in p0) p[k] = p0[k];
    p.armRX += st.armRX * w; p.elbR += st.elbR * w; p.armLX += st.armLX * w; p.elbL += st.elbL * w; p.crouch += (st.crouch + Math.sin(ph) * 0.025) * w; p.twist += st.twist * w;
    const walkS = Math.sin(t * 11);
    this.hips.position.y = 1.0 + Math.sin(ph) * 0.018 * idle + p.hop - p.crouch * 0.15 + Math.abs(walkS) * 0.05 * p.walk;
    const breathe = Math.sin(ph) * 0.04 * idle;
    this.armR.rotation.x = p.armRX + breathe - walkS * 0.5 * p.walk;
    this.armR.rotation.z = p.armRZ + 0.1;
    this.armL.rotation.x = p.armLX - breathe + walkS * 0.5 * p.walk;
    this.armL.rotation.z = p.armLZ - 0.1;
    this.elbowR.rotation.x = -0.25 + p.elbR;
    this.elbowL.rotation.x = -0.25 + p.elbL;
    this.legL.rotation.x = walkS * 0.6 * p.walk - p.crouch * 0.5;
    this.legR.rotation.x = -walkS * 0.6 * p.walk - p.crouch * 0.5;
    this.kneeL.rotation.x = Math.max(0, -walkS) * 0.9 * p.walk + p.crouch;
    this.kneeR.rotation.x = Math.max(0, walkS) * 0.9 * p.walk + p.crouch;
    this.torso.rotation.x = p.lean;
    this.torso.rotation.y = p.twist;
    this.legL.rotation.z = 0.07 * w; this.legR.rotation.z = -0.07 * w;
    this.legL.rotation.x -= 0.2 * w; this.legR.rotation.x += 0.12 * w;
    this.hips.rotation.y = p.spin;
    this.head.rotation.x = Math.sin(ph * 0.5) * 0.04 * idle;
    if (this.clanCape) this.clanCape.update(dt, t, p.walk);
    if (this.cape) {
      const pos = this.cape.geometry.attributes.position, b = this.capeBase;
      for (let i = 0; i < pos.count; i++) {
        const y = b[i * 3 + 1], x = b[i * 3];
        const d = -y; // pelerin ucuna doğru artan dalga
        pos.array[i * 3 + 2] = b[i * 3 + 2] - d * (0.12 + p.walk * 0.45) + Math.sin(t * 3.2 + y * 4 + x * 3) * 0.04 * d;
      }
      pos.needsUpdate = true;
    }
    if (this.orb) { const s = 1 + Math.sin(t * 6) * 0.1 + p.cast * 0.9; this.orb.scale.set(s, s * 1.5, s); this.orb.rotation.y = t * 2; }
    for (let i = 0; i < this.spinners.length; i++) { const r = this.spinners[i]; r.rotation.x = t * 1.7 + i; r.rotation.y = t * 1.1; }
    for (let i = 0; i < this.auras.length; i++) { const a = this.auras[i]; a.material.opacity = a.userData.base * (1 + Math.sin(t * 5) * 0.35) + p.cast * 0.3; }
    armorGlowTick(this, dt, t);
    this.M.u.glow.value = 1 + Math.sin(t * 3.1 + this.phase) * 0.12; // ışıyan parçalar (silah, göz, taş) hafifçe nabız atar
    if (this.glowSparks && !this.dead && gfx.T.fx) {
      this.sparkT -= dt;
      if (this.sparkT < 0) { this.sparkT = 1 / this.glowSparks; const v = this.weapon.getWorldPosition(V0), k = this.scale; particle(v.x + (Math.random() - 0.5) * 0.4 * k, v.y + Math.random() * 0.6 * k, v.z + (Math.random() - 0.5) * 0.4 * k, 0, 0.25, 0, this.glowColor, 0.07, 0.6, 0.6, 0); }
    }
    if (this.flash > 0) { this.flash = Math.max(0, this.flash - dt * 4); this.M.u.flash.value = this.flash * 1.4; }
  }

  get pos() { return this.root.position; }
  // …To(v): verilen vektöre yazar (kare başına çağıranlar bellek ayırmasın)
  headTo(v) { return v.copy(this.root.position).setY(this.root.position.y + 2.4 * this.scale); }
  chestTo(v) { return v.copy(this.root.position).setY(this.root.position.y + 1.45 * this.scale); }
  headPos() { return this.headTo(new THREE.Vector3()); }
  chestPos() { return this.chestTo(new THREE.Vector3()); }
  handPos() { const v = new THREE.Vector3(); (this.orb || this.weapon).getWorldPosition(v); return v; }

  face(target) { this.root.rotation.y = Math.atan2(target.x - this.pos.x, target.z - this.pos.z); }

  async moveTo(target, dur = 0.35) {
    this.face(target);
    this.pose.walk = 1;
    const from = this.pos.clone();
    await tween(dur, k => this.pos.lerpVectors(from, target, k), ease.inOut);
    this.pose.walk = 0;
  }
  // Kılıç savurma — darbe anında çözülür, toparlanma arka planda
  relax() { to(this.pose, { stance: 0 }, 0.1); }
  ready() { to(this.pose, { stance: 1 }, 0.35); }
  async swing() {
    this.relax();
    await to(this.pose, { armRX: -2.95, elbR: -1.05, lean: -0.24, twist: 0.65, armLX: -0.9, crouch: 0.18 }, 0.22, ease.out); // hazırlık
    swingArc(this, this.arcTint || this.glowColor);
    await to(this.pose, { armRX: -0.15, elbR: 0.05, lean: 0.38, twist: -0.75, crouch: 0.45 }, 0.08, ease.in); // vuruş
    to(this.pose, { armRX: 0, elbR: 0, lean: 0, twist: 0, armLX: 0, crouch: 0 }, 0.45, ease.back).then(() => this.ready());
  }
  async whirl() {
    this.relax();
    await to(this.pose, { armRX: -1.5, armLX: -1.5, armRZ: 0.9, armLZ: -0.9, crouch: 0.3 }, 0.12);
    const ring = whirlRing(this, this.arcTint || this.glowColor || 0xdde6ff);
    await to(this.pose, { spin: Math.PI * 4 }, 0.55, ease.inOut);
    ring();
    this.pose.spin = 0;
    to(this.pose, { armRX: 0, armLX: 0, armRZ: 0, armLZ: 0, crouch: 0 }, 0.25).then(() => this.ready());
  }
  async castSpell() {
    this.relax();
    await to(this.pose, { armRX: -2.6, elbR: -0.4, armLX: -2.4, cast: 1, lean: -0.1 }, 0.25, ease.out);
    await to(this.pose, { armRX: -1.4, elbR: 0, armLX: -1.2, lean: 0.15 }, 0.1, ease.in);
    to(this.pose, { armRX: 0, armLX: 0, cast: 0, lean: 0 }, 0.35).then(() => this.ready());
  }
  async raiseArms() {
    this.relax();
    await to(this.pose, { armRX: -2.9, armLX: -2.9, armRZ: -0.3, armLZ: 0.3, cast: 1 }, 0.3, ease.out);
    wait(0.35).then(() => to(this.pose, { armRX: 0, armLX: 0, armRZ: 0, armLZ: 0, cast: 0 }, 0.35)).then(() => this.ready());
  }
  async shoot() {
    this.relax();
    await to(this.pose, { armLX: -1.57, elbL: 0.25, armRX: -1.5, armRZ: -0.3, elbR: -0.3 }, 0.18, ease.out);
    await to(this.pose, { armRZ: 0.4, elbR: -1.6, lean: -0.08 }, 0.2);
    to(this.pose, { armRZ: 0, elbR: 0, lean: 0 }, 0.08).then(() => wait(0.2)).then(() => to(this.pose, { armLX: 0, armRX: 0, elbL: 0 }, 0.3)).then(() => this.ready());
  }
  async stomp() {
    this.relax();
    await to(this.pose, { hop: 0.7, armRX: -2.5, armLX: -2.5 }, 0.22, ease.out);
    await to(this.pose, { hop: 0, armRX: -0.3, armLX: -0.3, crouch: 0.5 }, 0.12, ease.in);
    to(this.pose, { armRX: 0, armLX: 0, crouch: 0 }, 0.3).then(() => this.ready());
  }
  hit(from, heavy = false) {
    this.flash = 1;
    const home = this.pos.clone();
    const dir = from ? this.pos.clone().sub(from).setY(0).normalize() : new THREE.Vector3();
    const k = (heavy ? 0.45 : 0.22) / this.scale;
    const tw = (Math.random() - 0.5) * 0.8;
    tween(0.08, e => this.pos.copy(home).addScaledVector(dir, k * e), ease.out).then(() => tween(0.3, e => this.pos.copy(home).addScaledVector(dir, k * (1 - e)), ease.inOut));
    to(this.pose, { lean: heavy ? -0.55 : -0.35, twist: tw, crouch: 0.2 }, 0.07, ease.out).then(() => to(this.pose, { lean: 0, twist: 0, crouch: 0 }, 0.35, ease.back));
  }
  // Ölüm: yere düşer, sonra gövdesi eriyerek kor ve küle dönüşür. Arada diriltilirse (revive) erime yarıda kesilir.
  async die() {
    this.dead = true;
    const n = ++this.deathN, ry = this.root.rotation.y;
    await tween(0.5, k => { if (n !== this.deathN) return; this.root.rotation.set(0, 0, 0); this.root.rotateY(ry); this.root.rotateX(-k * Math.PI / 2); }, ease.in);
    await wait(0.25);
    if (n !== this.deathN) return;
    fxPlay(EVENT_FX.kill, this);
    this.root.traverse(o => { if (o.isMesh) o.castShadow = false; });
    for (const m of this.glowMeshes) m.visible = false; for (const a of this.auras) a.visible = false;
    await tween(0.9, k => { if (n === this.deathN) this.M.u.dissolve.value = k * 1.02; });
    if (n === this.deathN) this.root.visible = false;
  }
  revive(face, home) {
    this.deathN++; this.dead = false; this.M.u.dissolve.value = 0;
    this.root.visible = true; this.root.rotation.set(0, face, 0); if (home) this.pos.copy(home);
    this.root.traverse(o => { if (o.isMesh && !o.userData.noShadow) o.castShadow = o.material.isMeshStandardMaterial === true; });
    for (const m of this.glowMeshes) m.visible = true; for (const a of this.auras) a.visible = true;
  }
  cheer() {
    if (this.dead) return;
    to(this.pose, { hop: 0.5, armRX: -2.9, armLX: -0.3, elbR: 0 }, 0.25, ease.out).then(() => to(this.pose, { hop: 0, armRX: 0, armLX: 0 }, 0.35));
  }
  dispose() { scene.remove(this.root); this.root.traverse(o => { if (o.isMesh && !o.userData.shared) o.geometry.dispose(); }); this.M.list.forEach(m => m.dispose()); }
}
const V0 = new THREE.Vector3();

// ---------- Ortam ----------
// Ortam tek seferde kurulur ve az sayıda çizim çağrısına indirilir: sabit parçalar (evler, sütunlar, mezar taşları, dağlar)
// köşe renkli tek ağda birleşir (scenery.js: Batch), ağaçlar, kayalar ve çimenler tek geometrinin kopyalarıdır (InstancedMesh).
// Parçalara dikey renk geçişi ve zemine değen kenarda kararma pişirilir; ağaç, kaya ve binaların altında yumuşak zemin
// lekesi durur. Doku boyutları, çimen ve meşale ışığı sayısı grafik kademesine göredir (gfx.js: TIERS).
let envGroup = null, envUpdate = null;

function canvasTex(size, draw, repeat = 1) {
  const cv = document.createElement('canvas'); cv.width = cv.height = size;
  draw(cv.getContext('2d'), size);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat, repeat);
  t.anisotropy = gfx.T.aniso; t.userData.own = true; // ortamla birlikte silinir
  return t;
}
function grassTex([base, light, dark]) {
  const R = gfx.T.tex[2];
  return canvasTex(R, (x, S) => {
    x.scale(S / 512, S / 512);
    x.fillStyle = base; x.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 40; i++) { x.globalAlpha = 0.18; x.fillStyle = Math.random() < 0.5 ? dark : '#5a4630'; x.beginPath(); x.arc(Math.random() * 512, Math.random() * 512, 20 + Math.random() * 50, 0, Math.PI * 2); x.fill(); }
    x.lineWidth = 1.5;
    for (let i = 0, n = S >= 512 ? 9000 : 3600; i < n; i++) { const px = Math.random() * 512, py = Math.random() * 512; x.globalAlpha = 0.25 + Math.random() * 0.4; x.strokeStyle = Math.random() < 0.5 ? light : dark; x.beginPath(); x.moveTo(px, py); x.lineTo(px + (Math.random() - 0.5) * 4, py - 4 - Math.random() * 6); x.stroke(); }
  }, 14);
}
function stoneFloorTex([c1, c2]) {
  return canvasTex(gfx.T.tex[0], (x, R) => {
    const S = 1024, cx = S / 2;
    x.scale(R / S, R / S);
    x.fillStyle = '#2a2622'; x.fillRect(0, 0, S, S);
    // dairesel taş döşeme
    for (let r = 0, ring = 0; r < cx; r += 64, ring++) {
      const n = Math.max(1, Math.floor((2 * Math.PI * (r + 32)) / 90)), off = ring % 2 ? 0.5 : 0;
      for (let i = 0; i < n; i++) {
        const a0 = (i + off) / n * Math.PI * 2, a1 = (i + 1 + off) / n * Math.PI * 2;
        const col = new THREE.Color(Math.random() < 0.5 ? c1 : c2).multiplyScalar(0.8 + Math.random() * 0.35);
        x.fillStyle = '#' + col.getHexString();
        x.beginPath(); x.arc(cx, cx, r + 61, a0 + 0.01, a1 - 0.01); x.arc(cx, cx, r + 3, a1 - 0.01, a0 + 0.01, true); x.closePath(); x.fill();
      }
    }
    for (let i = 0; i < 5000; i++) { x.globalAlpha = Math.random() * 0.25; x.fillStyle = Math.random() < 0.5 ? '#000' : '#fff'; x.fillRect(Math.random() * S, Math.random() * S, 2, 2); }
    // merkezden kenara hafif kararma: meydanın ortası aydınlık, kenarı oturmuş görünür
    const g = x.createRadialGradient(cx, cx, S * 0.2, cx, cx, S * 0.5); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.42)');
    x.globalAlpha = 1; x.fillStyle = g; x.fillRect(0, 0, S, S);
  });
}
// Zemin deseni: iç içe halkalar, kesik çizgiler ve işaret çentikleri. Yıldız, harf ya da herhangi bir inanç
// simgesi içermez; yalnızca geometrik bir meydan süsüdür.
function runeTex(color) {
  return canvasTex(gfx.T.tex[1], (x, R) => {
    const S = 1024;
    x.scale(R / S, R / S);
    const c = S / 2, ring = (r, w = 6, dash = null) => { x.lineWidth = w; x.setLineDash(dash || []); x.beginPath(); x.arc(c, c, r, 0, Math.PI * 2); x.stroke(); };
    x.strokeStyle = color; x.fillStyle = color; x.shadowColor = color; x.shadowBlur = 18 * R / S; x.lineCap = 'round';
    ring(470); ring(440, 4); ring(300); ring(280, 4);
    ring(370, 5, [46, 30]);  // kesik orta halka
    ring(150, 5, [22, 20]);  // kesik iç halka
    ring(96, 4);
    x.setLineDash([]);
    // dış halkada 24 çentik, iç halkada 12 uzun çizgi
    for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2, r0 = i % 2 ? 448 : 444, r1 = 466; x.lineWidth = i % 2 ? 4 : 8; x.beginPath(); x.moveTo(c + Math.cos(a) * r0, c + Math.sin(a) * r0); x.lineTo(c + Math.cos(a) * r1, c + Math.sin(a) * r1); x.stroke(); }
    for (let i = 0; i < 12; i++) { const a = (i + 0.5) / 12 * Math.PI * 2; x.lineWidth = 5; x.beginPath(); x.moveTo(c + Math.cos(a) * 176, c + Math.sin(a) * 176); x.lineTo(c + Math.cos(a) * 262, c + Math.sin(a) * 262); x.stroke(); }
    // orta halkanın üstünde 12 yuvarlak perçin
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; x.beginPath(); x.arc(c + Math.cos(a) * 335, c + Math.sin(a) * 335, 9, 0, Math.PI * 2); x.fill(); }
  });
}
// Gök kubbesi: renk geçişi yüksekliğe bağlıdır (tepe → ufuk), ekrana değil. Böylece ufuk rengi kamera nereye bakarsa
// baksın ufukta durur ve siste kaybolan dağlarla aynı tona kavuşur (ekran boyunca uzanan eski geçişte gök, dağların
// üstünde koyu bir bant olarak kalıyordu). stops: üstten ufka en çok dört renk.
function skyDome(stops) {
  const c = [0, 1, 2, 3].map(i => new THREE.Color(stops[Math.min(i, stops.length - 1)]));
  const m = new THREE.Mesh(new THREE.SphereGeometry(140, 24, 12), new THREE.ShaderMaterial({
    uniforms: { c: { value: c }, n: { value: stops.length - 1 } },
    vertexShader: 'varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform vec3 c[4]; uniform float n; varying vec3 vD;
      void main(){
        float t = (1.0 - clamp(normalize(vD).y / 0.5, 0.0, 1.0)) * n;
        vec3 col = mix(c[0], c[1], clamp(t, 0.0, 1.0)); col = mix(col, c[2], clamp(t - 1.0, 0.0, 1.0)); col = mix(col, c[3], clamp(t - 2.0, 0.0, 1.0));
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false,
  }));
  m.renderOrder = -10; m.frustumCulled = false;
  return m;
}

// exposure: ton eşlemenin pozlaması (sahne başına ayarlı: loş sahne biraz açılır, aydınlık sahne kısılır)
const ENVS = {
  forest: { sky: ['#05080d', '#11202a', '#2c4a46'], fog: 0x1d3330, grass: ['#2a4422', '#4a6e34', '#1a2c16'], floor: ['#6b6558', '#4f4a40'], rune: '#5dffcf', sun: 0xcfe0ff, sunI: 2.0, hemi: 0.5, mount: 0x16262a, motes: 0xb6ff7a, exposure: 1.0 },
  arena:  { sky: ['#120806', '#3c1a0e', '#a1532a'], fog: 0x4a2a1a, grass: ['#6b5638', '#8a7350', '#4a3a24'], floor: ['#a08a68', '#7d6a4e'], rune: '#ffb347', sun: 0xffd4a0, sunI: 2.4, hemi: 0.55, mount: 0x3a2014, motes: 0xffa040, exposure: 0.92 },
  town:   { sky: ['#070b18', '#1c2846', '#b0663e'], fog: 0x3a3442, grass: ['#3e5228', '#5e7a38', '#2a3a1a'], floor: ['#8d8576', '#6c665a'], rune: '#7fc8ff', sun: 0xffe2c0, sunI: 2.4, hemi: 0.6, mount: 0x2a2e40, motes: 0xffe6a0, exposure: 0.95 },
  hub:    { sky: ['#070b18', '#1c2846', '#b0663e'], fog: 0x3a3442, grass: ['#3e5228', '#5e7a38', '#2a3a1a'], floor: ['#8d8576', '#6c665a'], rune: '#7fc8ff', sun: 0xffe2c0, sunI: 2.4, hemi: 0.6, mount: 0x2a2e40, motes: 0xffe6a0, exposure: 0.95 },
  graveyard: { sky: ['#04060c', '#141a2e', '#3a4160'], fog: 0x20263a, grass: ['#2c3430', '#46524a', '#1a201e'], floor: ['#6a6a78', '#4a4a58'], rune: '#b08aff', sun: 0xb8c8ff, sunI: 1.9, hemi: 0.5, mount: 0x141828, motes: 0x9ab4ff, exposure: 1.05, mist: 0x8a94b8 },
  castle: { sky: ['#0d0406', '#3a0e10', '#8a2a1a'], fog: 0x3a1614, grass: ['#4a3028', '#6a4234', '#2e1c18'], floor: ['#7a5a52', '#56403a'], rune: '#ff5a3a', sun: 0xffc0a0, sunI: 2.2, hemi: 0.5, mount: 0x2a1010, motes: 0xff6a30, exposure: 0.98 },
  // 19 Kas: doğal savaş alanları (meydan zemini, rün çemberi ve meşale yok; yaratıkla arazide karşılaşma). nat: doğal · gN: çimen çarpanı
  meadow: { nat: 1, sky: ['#2a5fa8', '#6aa4dc', '#cfe6f2'], fog: 0xa8c8dc, fogD: [26, 95], grass: ['#4f8a2c', '#7cbc46', '#2f5a1c'], rune: '#000', sun: 0xfff2d6, sunI: 2.7, hemi: 0.9, hemiC: [0xcfe4ff, 0x4a6a2c], mount: 0x6a86a8, motes: 0xfff6c8, pollen: true, leaves: [0x3d7c2c, 0x4f9a36, 0x2f6a24], exposure: 0.86 },
  autumn: { nat: 1, sky: ['#3a3e66', '#a86a4a', '#f2c08a'], fog: 0xb08a6a, fogD: [20, 80], grass: ['#7a6a2c', '#a8883a', '#4a3a1c'], rune: '#000', sun: 0xffc890, sunI: 2.3, hemi: 0.7, hemiC: [0xffd8b0, 0x4a2e18], mount: 0x6a4a4a, motes: 0xffc070, pollen: true, leaves: [0xc8641c, 0xe08a24, 0x9a3a14], exposure: 0.92 },
  desert: { nat: 1, sky: ['#3a7ac8', '#8cc0e8', '#f6e6c2'], fog: 0xe8d2a6, fogD: [24, 90], grass: ['#d8b878', '#ecd09a', '#b8945a'], rune: '#000', sun: 0xfff0c8, sunI: 3.0, hemi: 0.95, hemiC: [0xfff0d8, 0xb08a52], mount: 0xc89a62, motes: 0xffe8b0, gN: 0.06, exposure: 0.8 },
  canyon: { nat: 1, sky: ['#3a5a9a', '#c88a5a', '#f2b47a'], fog: 0xc88a62, fogD: [22, 85], grass: ['#a8583a', '#c87a4e', '#7a3a24'], rune: '#000', sun: 0xffd2a0, sunI: 2.7, hemi: 0.8, hemiC: [0xffd8b8, 0x6a2e1a], mount: 0x8a4a32, motes: 0xffc890, gN: 0.12, exposure: 0.86 },
  ashland: { nat: 1, sky: ['#0a0606', '#2a1210', '#7a2a12'], fog: 0x2a1612, fogD: [12, 50], grass: ['#3a3634', '#4e4844', '#262220'], rune: '#000', sun: 0xff9a6a, sunI: 1.7, hemi: 0.45, hemiC: [0xb87858, 0x1a0c08], mount: 0x1e1414, motes: 0xff6a2a, embers: true, gN: 0.1, exposure: 1.1 },
  steppe: { nat: 1, sky: ['#3a64a8', '#86b2dc', '#ead8b0'], fog: 0xc8c0a0, fogD: [28, 100], grass: ['#a8984a', '#d2bc66', '#7a6a30'], rune: '#000', sun: 0xfff0d0, sunI: 2.8, hemi: 0.9, hemiC: [0xe8f0ff, 0x6a5a2c], mount: 0x7a8aa0, motes: 0xfff0c0, gN: 1.6, exposure: 0.84 },
  swamp: { nat: 1, sky: ['#0c1410', '#1e2e24', '#4a5a3a'], fog: 0x34402e, fogD: [9, 42], grass: ['#2e3a1e', '#46562a', '#1e2614'], rune: '#000', sun: 0xc8d8a0, sunI: 1.6, hemi: 0.55, hemiC: [0x9ab08a, 0x1a2010], mount: 0x1e2a20, motes: 0xb6ff7a, mist: 0x8a9a7a, leaves: [0x2a3a1c, 0x34441e, 0x1e2a14], exposure: 1.05 },
  snow: { nat: 1, sky: ['#5a7aa8', '#a8c4e0', '#eef4fa'], fog: 0xdce6f0, fogD: [18, 75], grass: ['#e8eef4', '#f6f9fc', '#c8d4e2'], rune: '#000', sun: 0xf2f6ff, sunI: 2.5, hemi: 0.95, hemiC: [0xe0ecff, 0x8a9ab0], mount: 0x9aaac4, motes: 0xffffff, snowfall: true, gN: 0.1, leaves: [0x24402e, 0x2c4c36, 0x1c3424], exposure: 0.78 },
  glacier: { nat: 1, sky: ['#0e1e3a', '#2e5a8a', '#a8d8f0'], fog: 0x9ac4e0, fogD: [16, 70], grass: ['#a8d0ec', '#d4ecfa', '#7aa8cc'], rune: '#000', sun: 0xdaf0ff, sunI: 2.4, hemi: 0.9, hemiC: [0xcfe8ff, 0x4a7aa0], mount: 0x6a94c0, motes: 0xcff0ff, snowfall: true, gN: 0, exposure: 0.82 },
  shrine: { sky: ['#06030f', '#1c1040', '#5a2a8a'], fog: 0x24143e, grass: ['#2a2a44', '#40407a', '#1a1a30'], floor: ['#6a6488', '#4a4468'], rune: '#d6a0ff', sun: 0xd8c8ff, sunI: 1.8, hemi: 0.6, mount: 0x1a1030, motes: 0xd6a0ff, exposure: 1.05 },
};
for (const k in ENVS) if (!ENVS[k].floor) ENVS[k].floor = ['#7a7266', '#5a544a']; // doğal arazide meydan taşı çizilmez; gün ışığı dönüştürücüsü alanı bekler

// Taraf havası: yalnızca ana üs (hub) ve açılış sahnesinde (town) ortamın üstüne uygulanır; savaş ortamları değişmez.
//  - ocak (Kragmir): kasvetli. Kor rengi alacakaranlık, yakın ve koyu sis, loş kızıl güneş, güçlü meşaleler, közler.
//  - sancak (Elentha): aydınlık. Açık gündüz göğü, uzak ve açık sis, güçlü beyaz güneş, sönük meşaleler.
// hemiC: [gök, yer] ortam ışığı · rim: [renk, şiddet] arka kontur · torch: meşale ışığı çarpanı · win: pencere ışıması
const MOODS = {
  ocak: { sky: ['#040203', '#170a09', '#3d160d', '#7c3414'], fog: 0x231009, fogD: [11, 44], grass: ['#2c2a1c', '#45402a', '#1c1a12'], floor: ['#756a60', '#544a43'], rune: '#ff7a3a',
    sun: 0xff9460, sunI: 1.5, hemi: 0.42, hemiC: [0xb87858, 0x1c0c08], rim: [0xff5226, 0.6], mount: 0x1d1113, motes: 0xff6a2a, torch: 1.7, win: 3.0, leaves: [0x26301c, 0x2f2a18, 0x1a1e12], embers: true, exposure: 1.12 },
  sancak: { sky: ['#2c68bd', '#5c9be0', '#a9d0f2', '#dcebf5'], fog: 0xb4d2ec, fogD: [30, 125], grass: ['#4a7a2c', '#78ae44', '#345c1f'], floor: ['#aaa392', '#877f70'], rune: '#8fd0ff',
    sun: 0xfff3d8, sunI: 2.9, hemi: 0.95, hemiC: [0xcfe4ff, 0x5c6a48], rim: [0xcfe0ff, 0.45], mount: 0x7189ad, motes: 0xfff2c8, torch: 0.3, win: 0.5, leaves: [0x2f6a2c, 0x3d7c36, 0x275824], pollen: true, exposure: 0.84 },
};

// 22 Kas (kullanıcı): savaş ortamı GPT'nin boyalı resmi. Yalnız ışıklar kurulur (resmin ışığına göre); gök, zemin, çimen,
// ağaç ve kaya çizilmez. Resim zemine ve perdeye savas-arka.js yansıtır; sis yok (resmin kendi havası var).
function photoEnv(id) {
  const L = PHOTO_LIGHT[id] || PHOTO_LIGHT.yemin, g = envGroup = new THREE.Group();
  scene.background = new THREE.Color(L.sky[2]); scene.fog = null;
  setExposure(L.exp); wind.k.value = 0.6; setSmokeLight(0.6);
  const [kc, ki, kd] = L.key, [rc, ri, rd] = L.rim;
  setSkyEnv({ sky: L.sky, ground: L.sky[2], sun: kc, sunI: Math.min(1.6, ki / 2.2), rim: rc, rimI: ri, torch: 0.3, dir: kd });
  g.add(new THREE.HemisphereLight(L.hemi[0], L.hemi[1], L.hemi[2]));
  const sun = new THREE.DirectionalLight(kc, ki); sun.userData.dir = new THREE.Vector3(...kd); g.add(sun);
  const rim = new THREE.DirectionalLight(rc, ri); rim.position.set(...rd); g.add(rim);
  buildBackdrop(g, id);
  scene.add(g);
  setKeyLight(sun, 0, 0, 12.5);
  return g;
}

const L4 = new THREE.Matrix4(), G4 = new THREE.Matrix4(), Q4 = new THREE.Quaternion(), E4 = new THREE.Euler(), P4 = new THREE.Vector3(), S4 = new THREE.Vector3();
// tod: (E, kind, mood) → E. Günün evresine ve havaya göre parametreleri dönüştürür (daylight.js); verilmezse taban hâli kurulur.
export function buildEnv(kind, mood, tod) {
  if (envGroup) { scene.remove(envGroup); disposeTree(envGroup); }
  envUpdate?.();
  if (mood && mood.startsWith('foto:')) return photoEnv(mood.slice(5)); // 22 Kas: savaş = boyalı resim (savas-arka.js)
  const T = gfx.T, hub = kind === 'hub' || kind === 'town';
  const E0 = { ...ENVS[kind], ...(hub && MOODS[mood] || {}) }, E = tod ? tod(E0, kind, mood) : E0;
  const g = envGroup = new THREE.Group(), nat = !hub && (E.nat || kind === 'forest' || kind === 'graveyard'); // doğal arazi: meydan zemini yok
  const rimC = E.rim || [0x8fb4ff, 0.8], torchK = E.torch ?? 1, wet = E.wet || 0;
  scene.background = null;
  g.add(skyDome(E.sky));
  scene.fog = new THREE.Fog(E.fog, ...(E.fogD || [16, 60]));
  setExposure(E.exposure ?? 0.95);
  wind.k.value = E.wind ?? 1;
  const amb = Math.max(0.14, Math.min(1, 0.5 * E.hemi + 0.1 * E.sunI)); // ışık almayan parçacıkların (duman, yaprak, pus) parlaklığı
  setSmokeLight(amb);
  // Ortam yansıması sahnenin göğünden, güneşinden ve meşale ışığından üretilir: metal zırh ve silah sahnenin rengini yansıtır
  setSkyEnv({ sky: E.sky, ground: E.grass[0], sun: E.sun, sunI: Math.min(1.6, E.sunI / 2.2), rim: rimC[0], rimI: rimC[1], torch: Math.min(1, torchK / 1.7), dir: E.sunDir || [6, 11, 5] });
  // Işıklar: gökten/yerden gelen dolgu (yarımküre), gölge düşüren tek ana ışık (güneş ya da ay), arkadan kontur ışığı
  g.add(new THREE.HemisphereLight(...(E.hemiC || [0xa9c4ff, 0x2a1d12]), E.hemi));
  const sun = new THREE.DirectionalLight(E.sun, E.sunI);
  sun.userData.dir = new THREE.Vector3(...(E.sunDir || [6, 11, 5]));
  g.add(sun);
  const rim = new THREE.DirectionalLight(rimC[0], rimC[1]); rim.position.set(-Math.sign(sun.userData.dir.x || 1) * 6, 5, -8); g.add(rim); // arka kontur ışığı (güneşin karşı yanından)

  // zemin (yağmurda ıslak: pürüzlülük düşer, göğü yansıtır)
  // Geniş renk lekeleri köşe rengiyle verilir (doku her yerde aynı tekrar etmesin); meydanın çevresi çiğnenmiş gibi koyudur
  const groundGeo = new THREE.RingGeometry(0.01, 80, 40, 14).rotateX(-Math.PI / 2), gp = groundGeo.attributes.position, gc = new Float32Array(gp.count * 3);
  for (let i = 0; i < gp.count; i++) {
    const x = gp.getX(i), z = gp.getZ(i), r = Math.hypot(x, z);
    const n = 0.5 + 0.5 * Math.sin(x * 0.19 + 1.3) * Math.cos(z * 0.23 - 0.7) + 0.25 * Math.sin((x + z) * 0.47), worn = Math.max(0, 1 - Math.abs(r - 8) / 6);
    const k = (0.82 + 0.3 * n) * (1 - 0.22 * worn);
    gc[i * 3] = k * (1 + 0.1 * worn + 0.06 * n); gc[i * 3 + 1] = k; gc[i * 3 + 2] = k * (1 - 0.12 * n);
  }
  groundGeo.setAttribute('color', new THREE.BufferAttribute(gc, 3));
  const ground = new THREE.Mesh(groundGeo, new THREE.MeshStandardMaterial({ map: grassTex(E.grass), vertexColors: true, roughness: 1 - 0.3 * wet, envMapIntensity: 0.15 + 0.35 * wet }));
  ground.receiveShadow = true;
  g.add(ground);
  const floorTex = stoneFloorTex(E.floor);
  const floor = new THREE.Mesh(cyl(6.8, 7.1, 0.22, 48), new THREE.MeshStandardMaterial({ map: floorTex, bumpMap: T.fx ? floorTex : null, bumpScale: 1.6, roughness: 0.86 - 0.5 * wet, metalness: 0.02, envMapIntensity: 0.3 + 0.7 * wet }));
  floor.position.y = 0.0; floor.receiveShadow = true;
  if (!nat) g.add(floor);
  const rune = new THREE.Mesh(new THREE.PlaneGeometry(9, 9).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: runeTex(E.rune), transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false }));
  rune.position.y = 0.125; if (!nat) g.add(rune);

  const rnd = (a, b) => a + Math.random() * (b - a);
  // kamera tarafını (+z) boş bırak ki görüşü kapatmasın
  const ring = (n, r0, r1, fn, keepClear = true) => { for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, r = rnd(r0, r1); const x = Math.cos(a) * r, z = Math.sin(a) * r; if (keepClear && z > 3 && Math.abs(x) < 10) continue; fn(x, z, i); } };

  // Birleştirilen parçalar: near gölge düşürür ve alır, far (dağlar) düşürmez. grp(): sonraki parçaların ortak dönüşümü
  const near = new Batch(), far = new Batch(), spots = [];
  const glowK = T.post ? 1 : 0.45; // ışıma (bloom) yokken ışıyan parçalar kısılır: beyaza yanmadan kendi renginde kalsın
  let hasGrp = false;
  const grp = (x, z, ry = 0, s = 1, rx = 0, rz = 0) => { hasGrp = true; G4.compose(P4.set(x, 0, z), Q4.setFromEuler(E4.set(rx, ry, rz)), S4.setScalar(s)); };
  const put = (b, geo, color, x, y, z, o = {}) => {
    L4.compose(P4.set(x, y, z), Q4.setFromEuler(E4.set(o.rx || 0, o.ry || 0, o.rz || 0)), S4.set(o.sx ?? 1, o.sy ?? 1, o.sz ?? 1));
    if (hasGrp) L4.premultiply(G4);
    b.add(geo, L4, { color, rough: o.rough ?? 0.92, metal: o.metal ?? 0, grad: o.grad ?? 0.22, under: o.under ?? 0.22, base: o.base, jitter: o.jitter ?? 0.06, emissive: o.em, emI: (o.emI ?? 1) * glowK });
    geo.dispose();
  };
  const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  // meydanın kenar taşı
  if (!nat) put(near, new THREE.TorusGeometry(6.95, 0.16, 6, 48).rotateX(Math.PI / 2), 0x5a544a, 0, 0.1, 0, { grad: 0, under: 0.4, jitter: 0 });

  // uzak dağlar (siste kaybolan siluetler): doruğa doğru açılır, yüksek olanların tepesi karlıdır
  const snow = new THREE.Color(0xc8d2e0), mc = new THREE.Color();
  for (let i = 0; i < 22; i++) {
    const a = i / 22 * Math.PI * 2 + rnd(-0.1, 0.1), r = rnd(48, 62), h = rnd(12, 26), w = rnd(9, 16);
    const geo = new THREE.ConeGeometry(w, h, 6 + (i % 3), 3);
    hasGrp = false;
    put(far, geo, E.mount, Math.cos(a) * r, h / 2 - 1, Math.sin(a) * r, { ry: rnd(0, 3), grad: 0.3, under: 0.15, rough: 1 });
    if (h > 19) { // tepe köşelerini kar rengine çek (koninin son halkası ve doruğu)
      const col = far.col, n = geo.attributes.position.count, top = h / 2 - 1 + h * 0.5, lim = top - h * 0.34;
      for (let k = far.n - n; k < far.n; k++) if (far.pos[k * 3 + 1] >= lim) { const t = Math.min(1, (far.pos[k * 3 + 1] - lim) / (h * 0.1)); mc.setRGB(col[k * 3], col[k * 3 + 1], col[k * 3 + 2]).lerp(snow, t * 0.85); col[k * 3] = mc.r; col[k * 3 + 1] = mc.g; col[k * 3 + 2] = mc.b; }
    }
  }

  // çimen tutamları (instanced): dibi koyu, ucu açık; rüzgârda salınır
  const bladeB = new Batch().add(new THREE.ConeGeometry(0.05, 0.38, 3).translate(0, 0.19, 0), null, { color: 0xffffff, grad: 0.45 });
  const grassM = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, envMapIntensity: 0.15 });
  if (T.dress) patchStd(grassM, { wind: 'sway', swayK: 0.3 });
  const grassN = Math.round(T.grass * (E.gN ?? 1)), tufts = new THREE.InstancedMesh(bladeB.geometry(), grassM, grassN);
  const mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), col = new THREE.Color(), eu = new THREE.Euler(), p3 = new THREE.Vector3(), s3 = new THREE.Vector3();
  for (let i = 0; i < grassN; i++) {
    const a = Math.random() * Math.PI * 2, r = nat ? rnd(1.5, 26) : rnd(7.3, 26);
    q.setFromEuler(eu.set(rnd(-0.3, 0.3), rnd(0, 6), rnd(-0.3, 0.3)));
    mtx.compose(p3.set(Math.cos(a) * r, 0, Math.sin(a) * r), q, s3.set(1, rnd(0.6, 1.6), 1).multiplyScalar(rnd(0.8, 1.4)));
    tufts.setMatrixAt(i, mtx);
    tufts.setColorAt(i, col.set(E.grass[Math.random() < 0.6 ? 1 : 0]).multiplyScalar(rnd(0.8, 1.2)));
  }
  tufts.receiveShadow = true;
  g.add(tufts);

  // kayalar (instanced)
  const rockSpots = [];
  ring(26, 7.6, 20, (x, z) => rockSpots.push([x, z, rnd(0.25, 0.8)]));
  if (rockSpots.length) {
    const rockB = new Batch().add(new THREE.DodecahedronGeometry(1, 0), null, { color: 0xffffff, grad: 0.3, under: 0.3 });
    const rocks = new THREE.InstancedMesh(rockB.geometry(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 - 0.3 * wet, flatShading: true, envMapIntensity: 0.25 }), rockSpots.length);
    rockSpots.forEach(([x, z, r], i) => { mtx.compose(p3.set(x, 0.1, z), q.setFromEuler(eu.set(rnd(0, 3), rnd(0, 3), 0)), s3.set(r, r * rnd(0.5, 0.9), r)); rocks.setMatrixAt(i, mtx); rocks.setColorAt(i, col.set(0x6d6a64).multiplyScalar(rnd(0.8, 1.15))); spots.push([x, z, r * 2.8, r * 2.8]); });
    rocks.castShadow = rocks.receiveShadow = true; g.add(rocks);
  }

  // Ağaçlar (instanced): gövde ve dört katlı taç iki çizim çağrısıdır; taç rüzgârda salınır
  const trees = (list, leafCols, trunkCol) => {
    if (!list.length) return;
    const crownB = new Batch();
    for (let k = 0; k < 4; k++) { L4.makeTranslation(0, 1.6 + k * 0.75, 0); crownB.add(new THREE.ConeGeometry(1.25 - k * 0.25, 1.5 - k * 0.12, 8), L4, { color: 0xffffff, grad: 0.3, under: 0.35 }); }
    const crownM = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, flatShading: true, envMapIntensity: 0.2 });
    if (T.dress) patchStd(crownM, { wind: 'sway', swayK: 0.035 });
    const crowns = new THREE.InstancedMesh(crownB.geometry(), crownM, list.length);
    const trunks = new THREE.InstancedMesh(cyl(0.12, 0.22, 1.6, 7).translate(0, 0.8, 0), new THREE.MeshStandardMaterial({ color: trunkCol, roughness: 1 }), list.length);
    list.forEach(([x, z, s], i) => { mtx.compose(p3.set(x, 0, z), q.setFromEuler(eu.set(0, rnd(0, 6), 0)), s3.setScalar(s)); crowns.setMatrixAt(i, mtx); trunks.setMatrixAt(i, mtx); crowns.setColorAt(i, col.set(leafCols[Math.floor(Math.random() * leafCols.length)]).multiplyScalar(rnd(0.85, 1.15))); spots.push([x, z, 2.9 * s, 2.9 * s]); });
    crowns.castShadow = trunks.castShadow = true; crowns.receiveShadow = true;
    g.add(crowns, trunks);
  };

  if (kind === 'forest' || kind === 'town' || kind === 'hub') {
    const list = [];
    const pondCarsi = kind === 'hub' && document.documentElement.dataset.place === 'carsi'; // Yemin Pazarı: gölet ve önü (town.js POND) çamsız kalır
    ring(kind === 'forest' ? 55 : kind === 'hub' ? 26 : 18, kind === 'hub' ? 15 : 9, 30, (x, z) => { if (pondCarsi && x > -23 && x < -7 && z > -6 && z < 16) return; list.push([x, z, rnd(0.9, 1.9)]); });
    trees(list, E.leaves || [0x1f3d22, 0x2a4d2a, 0x173018], 0x3e2a1c);
  }
  if (hub) {
    // ana üste (hub) evler geri planda durur; meydanın çevresi işlev binalarına (town.js) kalır
    // Konsept tablosu, mimari: Elentha beyaz taş + mavi çatı, Kragmir kızıl kaya + kararmış çatı
    const HOUSE = { sancak: [0xece6d8, 0x2f62b8, 0x4a3a2c, 0xc8c2b4], ocak: [0x7a4434, 0x2e1612, 0x241612, 0x4e2e24] }[mood] || [0xd8c9a8, 0x7a2e1c, 0x3a2618, 0x7a746a];
    // Yemin Pazarı (ana üste yer 'carsi'): sol yarı İnsan evleri (beyaz duvar, mavi çatı), sağ yarı Ork evleri (kararmış ahşap,
    // kızıl-koyu çatı, çatı sırtında ve köşelerde diken). Başkentler tek ırkın paletini kullanır.
    const carsi = kind === 'hub' && document.documentElement.dataset.place === 'carsi';
    const HUMAN = [0xece6d8, 0x2f62b8, 0x4a3a2c, 0xc8c2b4], ORC = [0x4a2e22, 0x6a1e14, 0x1a100c, 0x4e2e24];
    (kind === 'hub' ? [[-16, -12, 0.7], [-9, -18, 0.3], [0, -20, 0], [9, -18, -0.3], [16, -12, -0.7], [-19, -3, 1.3], [19, -3, -1.3]] : [[-8, -6, 0.5], [-4, -10, 0.2], [4.5, -10, -0.2], [8.5, -5.5, -0.6], [-11, 0, 1.2], [11, 1, -1.2]]).forEach(([x, z, r]) => {
      const orc = carsi && x > 0, [WALL, ROOF, BEAM, STONE] = carsi ? (orc ? ORC : HUMAN) : HOUSE;
      grp(x, z, r);
      put(near, box(3, 0.6, 2.6), STONE, 0, 0.3, 0, { base: 0.5 });
      put(near, box(2.8, 2.0, 2.4), WALL, 0, 1.6, 0, { grad: 0.14 });
      for (const bx of [-1.4, 0, 1.4]) put(near, box(0.12, 2.0, 0.08), BEAM, bx, 1.6, 1.22);
      put(near, box(2.9, 0.12, 0.08), BEAM, 0, 2.55, 1.22);
      put(near, box(2.9, 0.12, 0.08), BEAM, 0, 0.7, 1.22);
      put(near, new THREE.ConeGeometry(2.3, 1.6, 4), ROOF, 0, 3.4, 0, { ry: Math.PI / 4, sz: 0.85, rough: 0.75, grad: 0.3 });
      put(near, box(0.4, 1.2, 0.4), STONE, 0.8, 3.7, -0.4);
      put(near, box(0.7, 1.1, 0.06), BEAM, 0, 1.15, 1.22);
      // pencereler: gece yanar (ışıması daylight.js'in verdiği E.win ile ölçeklenir)
      for (const wx of [-0.85, 0.85]) put(near, box(0.42, 0.42, 0.05), 0xffb860, wx, 1.9, 1.23, { em: 0xffa040, emI: Math.min(2.6, E.win ?? 2.2), grad: 0, under: 0, jitter: 0 });
      if (orc) { // Ork evi süsleri: çatı sırtında kemik diken, köşelerde kararmış demir kazık, kapı üstünde boynuz
        for (const dx of [-0.9, -0.3, 0.3, 0.9]) put(near, new THREE.ConeGeometry(0.1, 0.7, 5), 0xe6dcc2, dx, 4.0 - Math.abs(dx) * 0.55, 0.15 + Math.abs(dx) * 0.2, { rz: -dx * 0.35, grad: 0.1 });
        for (const [cx, cz] of [[-1.55, 1.35], [1.55, 1.35], [-1.55, -1.35], [1.55, -1.35]]) put(near, new THREE.ConeGeometry(0.11, 1.4, 5), 0x2a2220, cx, 0.9, cz, { metal: 0.5, rough: 0.6, rz: cx * 0.08 });
        for (const s of [-1, 1]) put(near, new THREE.ConeGeometry(0.06, 0.45, 5), 0xe6dcc2, s * 0.32, 1.95, 1.3, { rz: -s * 1.0 });
      }
      spots.push([x, z, 5.4, 5.0]);
    });
    hasGrp = false;
  }
  if (kind === 'graveyard') {
    // çıplak ağaçlar ve mezar taşları
    ring(22, 9, 28, (x, z) => {
      grp(x, z, 0, rnd(0.9, 1.6));
      put(near, cyl(0.08, 0.2, 2.6, 6), 0x2a2420, 0, 1.3, 0, { base: 0.4 });
      for (let k = 0; k < 5; k++) { const len = rnd(0.9, 1.6); put(near, cyl(0.02, 0.07, len, 5).translate(0, len / 2, 0), 0x2a2420, 0, rnd(1.6, 2.6), 0, { rx: rnd(-1.1, 1.1), ry: rnd(0, 6), rz: rnd(-1.1, 1.1) }); }
      spots.push([x, z, 1.6, 1.6]);
    });
    ring(46, 7.6, 18, (x, z) => {
      // mezar taşları yalnızca düz ve yuvarlak başlı levhalardır (inanç simgesi kullanılmaz)
      const tall = Math.random() < 0.3;
      grp(x, z, Math.atan2(-x, -z) + rnd(-0.4, 0.4), 1, rnd(-0.12, 0.12), rnd(-0.12, 0.12));
      if (tall) { put(near, box(0.34, 1.15, 0.16), 0x8a8a96, 0, 0.57, 0, { base: 0.3 }); put(near, box(0.5, 0.12, 0.2), 0x8a8a96, 0, 0.06, 0); }
      else { put(near, box(0.6, 0.7, 0.16), 0x8a8a96, 0, 0.35, 0, { base: 0.3 }); put(near, cyl(0.3, 0.3, 0.16, 12).rotateX(Math.PI / 2), 0x8a8a96, 0, 0.7, 0); }
      spots.push([x, z, 1.1, 0.8]);
    });
    hasGrp = false;
  }
  // ---- doğal arazilerin süsleri (19 Kas) ----
  hasGrp = false;
  if (kind === 'meadow' || kind === 'steppe') { // yuvarlak taçlı ağaçlar, çiçekler
    ring(kind === 'meadow' ? 26 : 8, 11, 32, (x, z) => { const s = rnd(0.9, 1.7); grp(x, z, rnd(0, 6), s);
      put(near, cyl(0.14, 0.24, 1.8, 7), 0x4a3424, 0, 0.9, 0, { base: 0.4 });
      for (const [cx, cy, cz, r] of [[0, 2.3, 0, 1.1], [0.6, 2.0, 0.3, 0.8], [-0.55, 2.1, -0.2, 0.75], [0.1, 2.9, -0.1, 0.7]]) put(near, new THREE.IcosahedronGeometry(r, 1), E.leaves?.[Math.floor(rnd(0, 3))] ?? 0x5a8a2c, cx, cy, cz, { grad: 0.3, under: 0.35 });
      spots.push([x, z, 2.4 * s, 2.4 * s]); });
    hasGrp = false;
    const fl = [0xffe14a, 0xff7ab0, 0xffffff, 0xb08aff, 0xff9a3a];
    ring(kind === 'meadow' ? 90 : 30, 2, 22, (x, z) => put(near, new THREE.SphereGeometry(0.07, 6, 4), fl[Math.floor(rnd(0, fl.length))], x, 0.22, z, { grad: 0, under: 0, jitter: 0.1 }), false);
  }
  if (kind === 'autumn') {
    const list = []; ring(48, 9, 30, (x, z) => list.push([x, z, rnd(0.9, 1.8)])); trees(list, E.leaves, 0x3e2a1c);
    ring(70, 1.5, 18, (x, z) => put(near, box(0.18, 0.02, 0.12), E.leaves[Math.floor(rnd(0, 3))], x, 0.11, z, { ry: rnd(0, 6), grad: 0, under: 0 }), false); // yere düşmüş yapraklar
  }
  if (kind === 'desert') { // kum tepeleri, kaktüsler, kumtaşı
    for (let i = 0; i < 14; i++) { const a = rnd(0, Math.PI * 2), r = rnd(16, 40), x = Math.cos(a) * r, z = Math.sin(a) * r; if (z > 6 && Math.abs(x) < 14) continue; const w = rnd(5, 11);
      put(far, new THREE.SphereGeometry(w, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), 0xe2c288, x, -0.2, z, { sy: rnd(0.18, 0.32), sz: rnd(0.6, 1.2), ry: rnd(0, 3), grad: 0.15, under: 0.1 }); }
    ring(16, 8, 26, (x, z) => { const s = rnd(0.8, 1.5); grp(x, z, rnd(0, 6), s);
      put(near, cyl(0.22, 0.26, 2.2, 8), 0x4f7a34, 0, 1.1, 0, { grad: 0.25 });
      put(near, cyl(0.14, 0.16, 0.8, 7), 0x4f7a34, 0.42, 1.2, 0, { rz: -1.57, grad: 0.2 }); put(near, cyl(0.14, 0.15, 0.7, 7), 0x4f7a34, 0.78, 1.55, 0, { grad: 0.2 });
      put(near, cyl(0.12, 0.14, 0.6, 7), 0x4f7a34, -0.36, 1.6, 0, { rz: 1.57, grad: 0.2 }); put(near, cyl(0.12, 0.13, 0.55, 7), 0x4f7a34, -0.64, 1.9, 0, { grad: 0.2 });
      spots.push([x, z, 1.4 * s, 1.4 * s]); });
    hasGrp = false;
    ring(10, 9, 24, (x, z) => { put(near, new THREE.DodecahedronGeometry(rnd(0.8, 1.8), 0), 0xc8965a, x, 0.3, z, { sy: rnd(0.6, 1.4), ry: rnd(0, 3), grad: 0.3 }); spots.push([x, z, 2.2, 2.2]); });
  }
  if (kind === 'canyon') { // kızıl kaya sütunları ve masa dağları
    for (let i = 0; i < 18; i++) { const a = rnd(0, Math.PI * 2), r = rnd(13, 34), x = Math.cos(a) * r, z = Math.sin(a) * r; if (z > 5 && Math.abs(x) < 13) continue; const h = rnd(4, 13), w = rnd(1.6, 4.2);
      put(far, cyl(w * 0.85, w, h, 7), [0xa8583a, 0x8a4430, 0xc06a44][i % 3], x, h / 2 - 0.2, z, { ry: rnd(0, 3), grad: 0.35, under: 0.2 });
      put(far, cyl(w * 0.95, w * 0.85, 0.5, 7), 0xd08a5a, x, h - 0.1, z, { ry: rnd(0, 3) }); }
    ring(14, 8, 22, (x, z) => { grp(x, z, rnd(0, 6), rnd(0.7, 1.2)); for (let k = 0; k < 5; k++) put(near, cyl(0.015, 0.03, 0.7, 4).translate(0, 0.35, 0), 0x6a5034, 0, 0.05, 0, { rx: rnd(-0.9, 0.9), rz: rnd(-0.9, 0.9) }); }); // kuru çalı
    hasGrp = false;
  }
  if (kind === 'ashland' || kind === 'swamp') { // çıplak, kararmış ağaçlar
    ring(kind === 'swamp' ? 24 : 14, 8, 28, (x, z) => { grp(x, z, 0, rnd(0.9, 1.6));
      put(near, cyl(0.08, 0.22, 2.8, 6), kind === 'swamp' ? 0x2e2a1e : 0x1a1614, 0, 1.4, 0, { base: 0.4 });
      for (let k = 0; k < 5; k++) { const len = rnd(0.9, 1.7); put(near, cyl(0.02, 0.07, len, 5).translate(0, len / 2, 0), kind === 'swamp' ? 0x2e2a1e : 0x1a1614, 0, rnd(1.6, 2.7), 0, { rx: rnd(-1.1, 1.1), ry: rnd(0, 6), rz: rnd(-1.1, 1.1) }); }
      spots.push([x, z, 1.6, 1.6]); });
    hasGrp = false;
  }
  if (kind === 'ashland') { // lav yarıkları (ışıyan)
    for (let i = 0; i < 16; i++) { const a = rnd(0, Math.PI * 2), r = rnd(3.5, 18), x = Math.cos(a) * r, z = Math.sin(a) * r; if (z > 2 && Math.abs(x) < 3) continue;
      const L = rnd(1.2, 3.2); put(near, box(L, 0.02, rnd(0.06, 0.14)), 0xff5a14, x, 0.1, z, { ry: rnd(0, 3), em: 0xff3a08, emI: 1.5, grad: 0, under: 0, jitter: 0 }); put(near, box(L + 0.3, 0.015, 0.4), 0x1a1210, x, 0.095, z, { ry: 0, grad: 0, under: 0, jitter: 0 }); }
  }
  if (kind === 'swamp') { // bataklık gölleri, sazlar
    for (let i = 0; i < 9; i++) { const a = rnd(0, Math.PI * 2), r = rnd(5, 20), x = Math.cos(a) * r, z = Math.sin(a) * r; if (z > 3 && Math.abs(x) < 5) continue;
      const w = new THREE.Mesh(new THREE.CircleGeometry(rnd(1.6, 3.6), 20).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x1a2618, roughness: 0.08, metalness: 0.3, envMapIntensity: 1.2 }));
      w.position.set(x, 0.12, z); w.scale.set(1, 1, rnd(0.5, 0.9)); w.receiveShadow = true; g.add(w); }
    ring(50, 3, 20, (x, z) => { grp(x, z, rnd(0, 6), rnd(0.7, 1.2)); for (let k = 0; k < 4; k++) put(near, cyl(0.01, 0.025, rnd(0.8, 1.4), 4).translate(0, 0.5, 0), 0x5a6a34, rnd(-0.15, 0.15), 0.05, rnd(-0.15, 0.15), { rx: rnd(-0.25, 0.25), rz: rnd(-0.25, 0.25) }); }, false);
    hasGrp = false;
  }
  if (kind === 'snow') { // karlı çamlar
    const list = []; ring(46, 9, 30, (x, z) => list.push([x, z, rnd(0.9, 1.9)])); trees(list, [0xe8f0f6, 0x24402e, 0xdce8f2], 0x3a2a1e);
    ring(14, 6, 20, (x, z) => { put(near, new THREE.SphereGeometry(rnd(0.6, 1.4), 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), 0xf4f8fc, x, 0.05, z, { sy: 0.4, grad: 0.1 }); }); // kar yığınları
  }
  if (kind === 'glacier') { // buz sarkıtları, buz kayaları, uzakta buz dağları
    ring(26, 8, 26, (x, z) => { grp(x, z, rnd(0, 6), rnd(0.8, 1.8)); for (let k = 0; k < 3; k++) { const h = rnd(1.2, 3.4); put(near, new THREE.ConeGeometry(rnd(0.25, 0.55), h, 5), [0xbfe6ff, 0x8ec8f2, 0xe2f4ff][k], rnd(-0.5, 0.5), h / 2, rnd(-0.5, 0.5), { rx: rnd(-0.3, 0.3), rz: rnd(-0.3, 0.3), em: 0x4aa8ff, emI: 0.25, rough: 0.2, metal: 0.1 }); } spots.push([x, z, 1.8, 1.8]); });
    hasGrp = false;
    for (let i = 0; i < 12; i++) { const a = rnd(0, Math.PI * 2), r = rnd(22, 40), x = Math.cos(a) * r, z = Math.sin(a) * r; if (z > 8 && Math.abs(x) < 16) continue;
      put(far, new THREE.ConeGeometry(rnd(3, 6), rnd(5, 11), 5), 0xcfe8fa, x, 2.5, z, { ry: rnd(0, 3), grad: 0.25, em: 0x5ab0ff, emI: 0.15 }); }
  }
  let lampBudget = kind === 'hub' ? Math.max(T.lamps > 1 ? 1 : T.lamps, T.lamps - 1) : T.lamps; // ana üste bir ışık Taş Yemini'nin mangallarına ayrılır (town.js)
  if (kind === 'shrine') {
    // çağrı tapınağı: ucu parlayan dikilitaşlar (ışımaları bloom ile okunur; tek bir mor ışık meydanı boyar)
    hasGrp = false;
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * Math.PI * 2 + Math.PI / 8, r = 7.6, x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (z > 5) continue;
      const h = 4.5 + (i % 2) * 1.5;
      put(near, cyl(0.3, 0.6, h, 4), 0x4a4468, x, h / 2, z, { ry: a, rough: 0.8, base: 0.6, grad: 0.3 });
      put(near, new THREE.OctahedronGeometry(0.35), 0xd6a0ff, x, h + 0.55, z, { em: 0xb060ff, emI: 3.4, grad: 0, under: 0, jitter: 0 });
      spots.push([x, z, 2.2, 2.2]);
    }
    if (lampBudget > 0) { lampBudget--; const pl = new THREE.PointLight(0xb060ff, 26, 20, 1.6); pl.position.set(0, 6.5, -4); g.add(pl); }
    const list = [];
    ring(26, 11, 30, (x, z) => list.push([x, z, rnd(0.9, 1.8)]));
    trees(list, [0x1c2a4a, 0x22335a, 0x18233e], 0x2a2030);
  }
  if (kind === 'arena' || kind === 'castle') {
    const STONE = kind === 'castle' ? 0x5a4640 : 0x8a7a62, flags = new Batch(), o3 = new THREE.Object3D();
    hasGrp = false;
    for (let i = 0; i < 18; i++) {
      const a = i / 18 * Math.PI * 2, r = 11.5;
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      put(near, cyl(0.45, 0.55, 5, 10), STONE, x, 2.5, z, { base: 0.7, grad: 0.2 });
      put(near, box(1.2, 0.3, 1.2), STONE, x, 5.1, z);
      put(near, box(1.3, 0.3, 1.3), STONE, x, 0.15, z);
      spots.push([x, z, 2.6, 2.6]);
      // sancaklar sütunlara asılıdır; rüzgârda etekleri dalgalanır
      if (i % 2 === 0) { o3.position.set(x * 0.95, 3.2, z * 0.95); o3.lookAt(0, 3.2, 0); o3.updateMatrix(); flags.add(new THREE.PlaneGeometry(0.85, 2.4, 3, 8), o3.matrix, { color: (kind === 'castle' ? [0x7a1414, 0x1a1a1a] : [0x7a1414, 0x14307a])[i / 2 % 2], rough: 0.9, grad: 0.12 }); }
    }
    const fm = batchMaterial({ side: THREE.DoubleSide, envMapIntensity: 0.2 }, T.dress ? { wind: 'flagY' } : {});
    const fl = flags.build(fm, { cast: true, receive: false }); g.add(fl);
    const wl = mesh(cyl(14, 14, kind === 'castle' ? 7 : 3, 48, true), new THREE.MeshStandardMaterial({ color: kind === 'castle' ? 0x3a2a28 : 0x5e5240, roughness: 1, side: THREE.BackSide }), 0, kind === 'castle' ? 3.5 : 1.5, 0); wl.castShadow = false; g.add(wl);
  }

  // meşaleler / mangallar
  // (ana üste sağ öndeki meşalenin yerinde Taş Yemini durur; onun mangalları kendi ışığını taşır — bkz. town.js)
  // Alev gürültüyle yükselen bir kılıftır; ışık yalnızca kademenin izin verdiği kadar meşalede yanar, ötekiler ışımayla okunur.
  const flames = [];
  const torchSpots = nat ? [] : kind === 'forest' ? [[-6.2, -4.5], [6.2, -4.5]] : kind === 'hub' ? [[-6.2, -3.5], [6.2, -3.5], [-6.6, 4]] : [[-6.2, -3.5], [6.2, -3.5], [-6.6, 4], [6.6, 4]];
  hasGrp = false;
  torchSpots.forEach(([x, z]) => {
    put(near, cyl(0.05, 0.08, 1.8, 6), 0x2a2a2e, x, 0.9, z, { metal: 0.8, rough: 0.5, grad: 0.1 });
    put(near, cyl(0.22, 0.1, 0.2, 10), 0x2a2a2e, x, 1.85, z, { metal: 0.8, rough: 0.5, grad: 0 });
    put(near, new THREE.SphereGeometry(0.11, 8, 6), 0xffa040, x, 2.0, z, { em: 0xff7a10, emI: 2.5 + 2 * Math.min(1.6, torchK), grad: 0, under: 0, jitter: 0 }); // kor
    const fl = new THREE.Mesh(cyl(0.05, 0.2, 0.7, 10, true), flameMaterial(0xff8a30, 0.55 + 0.45 * Math.min(1.6, torchK)));
    fl.position.set(x, 2.28, z); fl.renderOrder = 5; g.add(fl);
    let pl = null;
    if (lampBudget > 0) { lampBudget--; pl = new THREE.PointLight(0xff8a30, 11, 12, 1.7); pl.position.set(x, 2.4, z); g.add(pl); }
    flames.push({ pl, x, z });
    spots.push([x, z, 1.1, 1.1]);
  });

  const bm = batchMaterial({ flatShading: true, envMapIntensity: 0.3 + 0.3 * wet });
  if (!near.empty) g.add(near.build(bm));
  if (!far.empty) g.add(far.build(bm, { cast: false, receive: false }));
  // ağaç, kaya, sütun ve evlerin altındaki zemin lekeleri (tek çizim çağrısı)
  if (spots.length) g.add(blobField(spots, T.shadow ? 0.34 : 0.5));

  // havada süzülenler: ateş böcekleri / zerreler; Kragmir'de yükselen közler, Elentha'da polen ve düşen yapraklar; mezarlıkta pus
  // (aydınlık sahnede zerreler silikleşir: meşale çarpanı gecenin ölçüsüdür)
  const dusk = Math.min(1, 0.25 + 0.45 * torchK);
  g.add(driftPoints({ count: T.drift, color: E.motes, size: 0.05 + 0.09 * dusk, area: [32, 5, 32], center: [0, 0.3, 0], rise: 0.05, sway: 0.5, twinkle: 0.7, gain: 1.5, opacity: dusk }));
  if (E.embers) g.add(driftPoints({ count: Math.round(T.drift * 0.7), color: 0xff5a1a, color2: 0xffb04a, size: 0.085, area: [24, 7, 16], center: [0, 0.2, -2], rise: 0.85, drift: 0.2, sway: 0.25, twinkle: 0.5, gain: 2.4 }));
  if (E.pollen && T.dress) {
    g.add(driftPoints({ count: Math.round(T.drift * 0.4), color: 0xfff6d8, color2: 0xfff2b0, size: 0.03, area: [30, 6, 22], center: [0, 0.4, -2], rise: 0.03, drift: 0.45, sway: 0.4, twinkle: 0.3, gain: 1.0, opacity: 0.45 }));
    g.add(driftPoints({ count: 26, color: E.leaves ? E.leaves[1] : 0x7fae3c, color2: 0xd8b84a, size: 0.13, area: [30, 7, 20], center: [0, 0.2, -2], rise: -0.5, drift: 0.8, sway: 0.5, leaf: true, additive: false, gain: amb * 1.3 }));
  }
  if (E.snowfall) g.add(driftPoints({ count: Math.round(T.drift * 1.2), color: 0xffffff, color2: 0xe8f4ff, size: 0.07, area: [30, 9, 24], center: [0, 0.4, -2], rise: -0.9, drift: 0.35, sway: 0.6, twinkle: 0.1, gain: 1.4, opacity: 0.9 }));
  if (E.mist && T.fx) g.add(driftPoints({ count: 16, color: E.mist, size: 3.2, area: [30, 1.1, 24], center: [0, 0.2, -3], drift: 0.2, sway: 0.7, additive: false, opacity: 0.1, gain: amb * 1.6 }));

  envUpdate = onUpdate((dt, t) => {
    rune.rotation.y = t * 0.05;
    rune.material.opacity = 0.26 + Math.sin(t * 1.5) * 0.07; // zemin süsü silik kalır: sahnenin en parlak şeyi karakterler ve efektler olmalı
    for (let i = 0; i < flames.length; i++) {
      const f = flames[i], k = 1 + Math.sin(t * 17 + i) * 0.12 + Math.sin(t * 7.3 + i * 2) * 0.1;
      if (f.pl) f.pl.intensity = 11 * k * Math.min(2, torchK); // meşale gece çevresini gerçekten aydınlatır; gündüz (torchK küçük) güneşin yanında kaybolur
      if (Math.random() < dt * 6 * torchK) particle(f.x + (Math.random() - 0.5) * 0.12, 2.35, f.z + (Math.random() - 0.5) * 0.12, (Math.random() - 0.5) * 0.3, 0.5 + Math.random() * 0.5, (Math.random() - 0.5) * 0.3, 0xff8a20, 0.06, 0.8, 1.2, 0.5);
    }
  });
  scene.add(g);
  // gölge kamerası oynanan alana sıkıca oturur: ana üste binaları, savaşta meydanı (arenada sütunları da) kapsar
  setKeyLight(sun, 0, kind === 'hub' ? -2 : 0, kind === 'hub' ? 15.5 : kind === 'town' ? 13 : kind === 'arena' || kind === 'castle' ? 12.5 : 10);
  return g;
}

// ---------- Dev Solucan (öğretici boss'u) ----------
// İnsansı olmayan, parçalı bir yaratık: yerden yükselen halkalı gövde, dişli ağız, sırtında dikenler. Character ile aynı
// savaş arayüzünü taşır (savurma = ileri atılıp ısırma, büyü = bağırıp toprak püskürtme, vurulma, ölüm, diriliş).
// Görünüm tamamen özgündür; look: { kind: 'worm', skin, belly, scale }.
export class WormCharacter {
  constructor(look = {}) {
    const M = this.M = new Mats();
    this.fx = look.fx || 0xc8a060; this.auras = []; this.spinners = []; this.glowMeshes = []; this.deathN = 0;
    this.weaponKind = 'club'; this.scale = look.scale || 1.6; this.phase = Math.random() * 6;
    this.root = new THREE.Group(); this.root.scale.setScalar(this.scale);
    const skin = M.skin(look.skin || 0x8a5a4a), ring = M.skin(look.belly || 0xc99a7a), tooth = M.leather(0xf1e6c8, { roughness: 0.35 }), dark = M.basic(0x1a0606);
    this.segs = [];
    const N = 11;
    for (let i = 0; i < N; i++) { // tabandan başa: kalın → ince
      const r = 0.62 - i * 0.03, g = new THREE.Group();
      g.add(mesh(new THREE.SphereGeometry(r, 14, 10), skin));
      const band = mesh(new THREE.TorusGeometry(r * 0.98, r * 0.12, 6, 18), ring); band.rotation.x = Math.PI / 2; g.add(band);
      if (i % 2 === 0 && i > 1) { const sp = mesh(new THREE.ConeGeometry(0.08, 0.32, 5), tooth, 0, r * 0.95, -r * 0.2); sp.rotation.x = -0.5; g.add(sp); }
      this.root.add(g); this.segs.push({ g, r });
    }
    // baş: dişlerle çevrili, içi karanlık ağız
    const head = this.head = new THREE.Group(), hr = 0.5;
    head.add(mesh(new THREE.SphereGeometry(hr, 16, 12, 0, Math.PI * 2, Math.PI * 0.38, Math.PI * 0.62), skin)); // alt kâse: ağız tepede açık
    const maw = mesh(new THREE.CircleGeometry(hr * 0.78, 18), dark, 0, 0, 0); maw.rotation.x = -Math.PI / 2; maw.position.y = hr * 0.38; head.add(maw);
    for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2, t = mesh(new THREE.ConeGeometry(0.06, 0.26, 5), tooth, Math.cos(a) * hr * 0.72, hr * 0.42, Math.sin(a) * hr * 0.72); t.rotation.set(Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9); head.add(t); }
    for (const s of [-1, 1]) head.add(mesh(new THREE.SphereGeometry(0.07, 8, 6), M.glow(0xffb02e, 2.5), s * 0.28, hr * 0.15, hr * 0.62));
    this.root.add(head);
    // toprak yığını (gövdenin çıktığı delik)
    const dirt = mesh(new THREE.CylinderGeometry(1.1, 1.4, 0.3, 12), M.leather(0x4a3220, { roughness: 1 }), 0, 0.05, 0); this.root.add(dirt);
    this.root.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    this.pose = { lunge: 0, rear: 0, open: 0, shake: 0 };
    this.flash = 0; this.dead = false;
    this.layout(0);
  }
  // Gövde eğrisi: yerden yukarı ve öne kıvrılan yay; lunge öne atılır, rear geri çekilip yükselir
  layout(t) {
    const p = this.pose, N = this.segs.length, sway = this.dead ? 0 : 1;
    for (let i = 0; i < N; i++) {
      const u = i / (N - 1), s = this.segs[i];
      const y = 0.25 + Math.sin(u * Math.PI * 0.62) * (1.75 + p.rear * 0.5 - p.lunge * 0.7), z = u * (1.5 + p.lunge * 1.4 - p.rear * 0.4) - 0.3; // yerden kalkıp partiye doğru kavis çizen gövde
      const x = Math.sin(t * 1.6 + u * 3 + this.phase) * 0.18 * u * sway + (Math.random() - 0.5) * p.shake * u;
      s.g.position.set(x, y, z);
    }
    const last = this.segs[N - 1].g.position;
    this.head.position.set(last.x, last.y + 0.35, last.z + 0.25);
    this.head.rotation.x = 1.25 + p.lunge * 0.6 - p.rear * 0.5 - p.open * 0.3; // ağız partiye bakar
    this.head.scale.setScalar(1 + p.open * 0.18);
  }
  update(dt, t) {
    this.layout(t);
    if (this.flash > 0) { this.flash = Math.max(0, this.flash - dt * 4); this.M.u.flash.value = this.flash * 1.4; }
  }
  get pos() { return this.root.position; }
  headTo(v) { return this.head.getWorldPosition(v).setY(this.head.getWorldPosition(V0).y + 0.5 * this.scale); }
  chestTo(v) { return this.segs[6].g.getWorldPosition(v); }
  headPos() { return this.headTo(new THREE.Vector3()); }
  chestPos() { return this.chestTo(new THREE.Vector3()); }
  handPos() { return this.head.getWorldPosition(new THREE.Vector3()); }
  face(target) { this.root.rotation.y = Math.atan2(target.x - this.pos.x, target.z - this.pos.z); }
  async moveTo(target) { this.face(target); } // yerinden kalkmaz: ısırmak için gövdesini uzatır
  relax() {} ready() {}
  async swing() { // ısırık: geri çekil, ağzını aç, ileri atıl
    await to(this.pose, { rear: 1, open: 1 }, 0.25, ease.out);
    await to(this.pose, { rear: 0, lunge: 1 }, 0.1, ease.in);
    to(this.pose, { lunge: 0, open: 0 }, 0.45, ease.back);
  }
  async whirl() { await this.swing(); }
  async stomp() { await to(this.pose, { rear: 1.2, shake: 0.2 }, 0.25); await to(this.pose, { rear: -0.2, shake: 0 }, 0.12, ease.in); to(this.pose, { rear: 0 }, 0.3); }
  async castSpell() { await to(this.pose, { open: 1.3, rear: 0.6, shake: 0.12 }, 0.3, ease.out); to(this.pose, { open: 0, rear: 0, shake: 0 }, 0.35); }
  async raiseArms() { await this.castSpell(); }
  async shoot() { await this.castSpell(); }
  hit(from, heavy = false) { this.flash = 1; to(this.pose, { shake: heavy ? 0.3 : 0.15, rear: -0.25 }, 0.06).then(() => to(this.pose, { shake: 0, rear: 0 }, 0.35, ease.back)); }
  async die() {
    this.dead = true;
    const n = ++this.deathN;
    await to(this.pose, { rear: 1.4, open: 1.5, shake: 0.35 }, 0.45);
    await tween(0.7, k => { if (n === this.deathN) this.root.position.y = -k * 1.2; });
    if (n !== this.deathN) return;
    fxPlay(EVENT_FX.kill, this);
    await tween(0.9, k => { if (n === this.deathN) this.M.u.dissolve.value = k * 1.02; });
    if (n === this.deathN) this.root.visible = false;
  }
  revive(face, home) { this.deathN++; this.dead = false; this.M.u.dissolve.value = 0; this.root.visible = true; this.root.position.y = 0; this.root.rotation.set(0, face, 0); if (home) this.pos.copy(home); Object.assign(this.pose, { lunge: 0, rear: 0, open: 0, shake: 0 }); }
  cheer() { this.castSpell(); }
  dispose() { scene.remove(this.root); this.root.traverse(o => { if (o.isMesh) o.geometry.dispose(); }); this.M.list.forEach(m => m.dispose()); }
}
