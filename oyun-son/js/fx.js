// Savaş efektleri: savurma izleri, kıvılcımlar, mermiler, element büyüleri, şifa ve kalkan, durum işaretleri, kritik
// vurgusu, erime, boss girişi, zafer ışığı. Hangi olayın hangi efektle oynadığı fx-table.js'te yazılıdır; burası çizer.
// Bütçe: efekt levhaları (tek geometri, tek gölgelendirici, kademeye göre sabit sayıda) ve engine3d'nin parçacık
// havuzu kullanılır; kare başına bellek ayrılmaz. Süreler oyun saatine bağlıdır (3x hızda ve otomatik modda doğru oynar).
// Düşük kademede levha yoktur: işlevler sessizce döner, yalnızca birkaç vuruş parçacığı kalır.
import { THREE, scene, camera, camRig, gfx, onTier, onUpdate, tween, wait, ease, burst, particle, hitStop, nudgeCam, setExposureMul } from './engine3d.js';
import { ELEMENT_FX, SPARK_FX, STATUS_FX, CRIT_FX, FX_NAMES, weaponFx } from './fx-table.js';

// ---------- Efekt levhası ----------
// kind: 0 parıltı · 1 halka · 2 savurma yayı · 3 çizgi · 4 şimşek · 5 kristal · 6 oklar · 7 kubbe · 8 nişan · 9 dönen noktalar · 10 ışık sütunu
const K = { glow: 0, ring: 1, arc: 2, streak: 3, zap: 4, shard: 5, chev: 6, dome: 7, reticle: 8, orbit: 9, beam: 10 };
const VERT = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
const FRAG = `varying vec2 vUv; uniform int kind; uniform vec3 col; uniform vec3 core; uniform float alpha; uniform float p; uniform float q;
  float hh(float x){ return fract(sin(x * 127.1) * 43758.5453); }
  float nn(float x){ float i = floor(x), f = fract(x); f = f*f*(3.0-2.0*f); return mix(hh(i), hh(i + 1.0), f); }
  void main(){
    vec2 u = vUv - 0.5; float d = length(u) * 2.0, a = 0.0, hot = 0.0;
    if (kind == 0) { a = smoothstep(1.0, 0.0, d); hot = a * a * a; a *= a; }
    else if (kind == 1) { float w = 0.05 + q; a = smoothstep(w, 0.0, abs(d - 0.8)) * 0.9 + smoothstep(0.8, 0.0, d) * 0.12; hot = smoothstep(w * 0.4, 0.0, abs(d - 0.8)); }
    else if (kind == 2) { // yay: açı q, ilerleme p; uç parlak, kuyruk söner
      float aq = abs(q), th = atan(u.y, u.x) * sign(q), half_ = aq * 0.5, lead = -half_ + aq * p, tail = lead - aq * 0.75;
      float along = smoothstep(tail, lead, th) * step(th, lead) * step(-half_ - 0.01, th);
      float band = smoothstep(0.3, 0.0, abs(d - 0.7)) * (0.6 + 0.4 * smoothstep(0.42, 0.78, d));
      a = along * band * (0.45 + 0.55 * along); hot = along * along * smoothstep(0.1, 0.0, abs(d - 0.76));
    }
    else if (kind == 3) { a = smoothstep(0.5, 0.0, abs(u.y) * (3.0 + q)) * smoothstep(0.5, 0.1, abs(u.x)); hot = a * a; }
    else if (kind == 4) { // şimşek: x boyunca, p tohum
      float x = vUv.x, env = sin(x * 3.1416), off = (nn(x * 9.0 + p * 31.0) - 0.5) * 0.34 * env + (nn(x * 27.0 + p * 57.0) - 0.5) * 0.1 * env;
      float w = abs(u.y - off); a = smoothstep(0.09, 0.0, w) + smoothstep(0.3, 0.0, w) * 0.25; hot = smoothstep(0.03, 0.0, w);
      float b2 = abs(u.y - off * -0.7 - 0.05 * sin(x * 20.0)); a += smoothstep(0.04, 0.0, b2) * 0.35 * step(0.3, x) * step(x, 0.8);
    }
    else if (kind == 5) { float m = abs(u.x) * 2.6 + abs(u.y) * 1.02; a = smoothstep(0.5, 0.44, m); hot = a * smoothstep(0.1, -0.1, u.x + u.y * 0.3) * 0.7; a *= 0.75 + 0.25 * step(0.0, u.x); }
    else if (kind == 6) { // oklar: p kaydırma, q yön (+1 yukarı, −1 aşağı)
      float v = fract((vUv.y * q) * 3.0 - p * 2.0), ch = abs(u.x) * 1.6 + v;
      a = smoothstep(0.16, 0.0, abs(ch - 0.62)) * smoothstep(0.5, 0.2, abs(u.x)) * smoothstep(0.5, 0.25, abs(u.y)); hot = a * 0.5;
    }
    else if (kind == 7) { float rim = pow(clamp(d, 0.0, 1.0), 5.0); a = smoothstep(1.0, 0.96, d) * (0.1 + rim * 0.95 + 0.22 * smoothstep(0.25, 0.0, length(u - vec2(-0.16, 0.2 + 0.05 * sin(p * 6.28))))); hot = rim * step(d, 1.0) * 0.6; }
    else if (kind == 8) { float th = atan(u.y, u.x) + p * 2.0; a = smoothstep(0.05, 0.0, abs(d - 0.72)) * 0.9 + smoothstep(0.04, 0.0, abs(d - 0.4)) * 0.5 * step(0.0, sin(th * 6.0));
      a += smoothstep(0.03, 0.0, abs(sin(th * 2.0))) * step(0.72, d) * step(d, 1.0) * 0.9; hot = a * 0.4; }
    else if (kind == 9) { for (int i = 0; i < 3; i++) { float an = p * 6.2832 + float(i) * 2.0944; vec2 c = vec2(cos(an) * 0.36, sin(an) * 0.13); float dd = length(u - c); float z = 0.75 + 0.25 * sin(an); a += smoothstep(0.075 * z, 0.0, dd); hot += smoothstep(0.03 * z, 0.0, dd); } }
    else { float w = smoothstep(0.5, 0.0, abs(u.x)); a = w * w * smoothstep(0.0, 0.12, vUv.y) * smoothstep(1.0, 0.35, vUv.y); hot = a * w * 0.6; }
    a *= alpha; if (a < 0.004) discard;
    gl_FragColor = vec4(mix(col, core, clamp(hot, 0.0, 1.0)) * (1.6 + hot * 1.6), a);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;
const GEO = new THREE.PlaneGeometry(1, 1);
const slots = [];
let cursor = 0;
function makeSlot() {
  const mat = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    uniforms: { kind: { value: 0 }, col: { value: new THREE.Color() }, core: { value: new THREE.Color() }, alpha: { value: 0 }, p: { value: 0 }, q: { value: 0 } } });
  const mesh = new THREE.Mesh(GEO, mat);
  mesh.visible = false; mesh.frustumCulled = false; mesh.renderOrder = 9;
  return { mesh, u: mat.uniforms, on: false, t: 0, dur: 1, s0: 1, s1: 1, sy: 1, a0: 1, rise: 0, spin: 0, rot: 0, p0: 0, p1: 0, bill: 0, flick: false, fade: 1, home: scene };
}
function rebuild() {
  for (const s of slots) { s.mesh.parent?.remove(s.mesh); s.mesh.material.dispose(); }
  slots.length = 0; cursor = 0;
  for (let i = 0; i < gfx.T.sprites; i++) slots.push(makeSlot());
  rebuildLights();
}
// o: { color, core, s0, s1 (boy başlangıç/bitiş), sy (dikey çarpan), dur, alpha, rise, spin, p0, p1, q, bill: 0 dünya · 1 kameraya dönük · 2 yerde,
//      parent (birimin kökü), rot, delay, flick (her karede yeni tohum), fade (sönme eğrisi üssü) }
function sprite(kind, x, y, z, o) {
  const n = slots.length;
  if (!n) return null;
  let s = null;
  for (let i = 0; i < n; i++) { const c = slots[(cursor + i) % n]; if (!c.on) { s = c; cursor = (cursor + i + 1) % n; break; } }
  if (!s) { s = slots[cursor]; cursor = (cursor + 1) % n; } // hepsi doluysa en eskisi devralınır
  const m = s.mesh, parent = o.parent || scene;
  if (m.parent !== parent) parent.add(m);
  s.on = true; s.t = -(o.delay || 0); s.dur = o.dur || 0.4; s.s0 = o.s0 ?? 1; s.s1 = o.s1 ?? s.s0; s.sy = o.sy ?? 1; s.a0 = o.alpha ?? 1;
  s.rise = o.rise || 0; s.spin = o.spin || 0; s.rot = o.rot || 0; s.p0 = o.p0 || 0; s.p1 = o.p1 ?? s.p0; s.bill = o.bill ?? 1; s.flick = !!o.flick; s.fade = o.fade ?? 1;
  s.u.kind.value = kind; s.u.col.value.setHex(o.color ?? 0xffffff); s.u.core.value.setHex(o.core ?? 0xffffff); s.u.q.value = o.q || 0; s.u.alpha.value = 0; s.u.p.value = s.p0;
  m.position.set(x, y, z); m.rotation.set(s.bill === 2 ? -Math.PI / 2 : 0, 0, o.rot || 0); m.scale.set(s.s0, s.s0 * s.sy, 1);
  m.visible = s.t >= 0;
  return s;
}
const qInv = new THREE.Quaternion();
onUpdate(dt => {
  for (let i = 0; i < slots.length; i++) {
    const s = slots[i];
    if (!s.on) continue;
    s.t += dt;
    if (s.t < 0) continue;
    const k = s.t / s.dur, m = s.mesh;
    if (k >= 1) { s.on = false; m.visible = false; if (m.parent !== scene) scene.add(m); continue; }
    m.visible = true;
    const e = 1 - (1 - k) * (1 - k), sc = s.s0 + (s.s1 - s.s0) * e;
    m.scale.set(sc, sc * s.sy, 1);
    if (s.rise) m.position.y += s.rise * dt;
    if (s.bill === 1) { // kameraya dön (birime bağlıysa birimin dönüşünü geri al)
      if (m.parent !== scene) { m.parent.getWorldQuaternion(qInv).invert(); m.quaternion.copy(qInv).multiply(camera.quaternion); } else m.quaternion.copy(camera.quaternion);
      if (s.rot || s.spin) m.rotateZ(s.rot + s.spin * s.t); // levhanın kendi düzlemindeki dönüşü (çizgi, şimşek, kristal)
    } else if (s.spin) m.rotation.z += s.spin * dt;
    s.u.alpha.value = s.a0 * Math.min(1, k * 8) * Math.pow(1 - k, s.fade);
    s.u.p.value = s.flick ? Math.floor(s.t * 24) * 0.37 + i : s.p0 + (s.p1 - s.p0) * k;
  }
  for (let i = 0; i < lights.length; i++) { const L = lights[i]; if (L.userData.life > 0) { L.userData.life -= dt; L.intensity = L.userData.peak * Math.max(0, L.userData.life / L.userData.max); } else if (L.intensity) L.intensity = 0; }
});

// ---------- Çizilmiş efekt şeritleri (GPT Paket 4, 21 Kas) ----------
// Her şerit 12 kare (soldan sağa), 24 kare/sn: tek oynatım 0.5 sn. Görseller js/vfx-png.js'te gömülüdür; dokular ilk
// kullanımda çözülür (yalnız kullanılan şeritler GPU'ya yüklenir). Levha havuzu efekt levhalarıyla aynı kademeye bağlıdır:
// en düşük kademede (sprites 0) şerit de yoktur. Süreler oyun saatine bağlı (onUpdate dt).
const SV = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
const SF = `varying vec2 vUv; uniform sampler2D map; uniform float fr; uniform float alpha; uniform float gain; uniform vec3 tint; uniform float tk;
  void main(){ vec4 c = texture2D(map, vec2((fr + clamp(vUv.x, 0.002, 0.998)) / 12.0, vUv.y)); c.a *= alpha * smoothstep(0.5, 0.34, length(vUv - 0.5)); if (c.a < 0.01) discard; // kare kenarında kalan duman yuvarlak söner
    float l = dot(c.rgb, vec3(0.299, 0.587, 0.114)); vec3 t = mix(tint * l * 1.7, vec3(1.0), smoothstep(0.75, 1.0, l)); // boyama: parlak çekirdek beyaz kalır
    gl_FragColor = vec4(mix(c.rgb, t, tk) * gain, c.a);
    #include <colorspace_fragment>
  }`;
let VFX = null, vfxLoading = null;
const vtex = {};
function vfxLoad() { if (!vfxLoading) vfxLoading = import('./vfx-png.js').then(m => (VFX = m)).catch(e => console.warn('[fx] şeritler yüklenemedi', e)); return vfxLoading; }
function vfxTex(name) {
  if (vtex[name] !== undefined) return vtex[name];
  if (!VFX) { vfxLoad(); return null; }
  const u = VFX.url(name); if (!u) return (vtex[name] = null);
  const img = new Image(), t = new THREE.Texture(img);
  t.colorSpace = THREE.SRGBColorSpace; t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  vtex[name] = null; // yüklenene kadar çizilmez
  img.onload = () => { t.needsUpdate = true; vtex[name] = t; };
  img.src = u;
  return null;
}
const strips = [];
function rebuildStrips() {
  for (const s of strips) { s.mesh.parent?.remove(s.mesh); s.mesh.material.dispose(); }
  strips.length = 0;
  const n = gfx.T.sprites ? Math.max(6, Math.round(gfx.T.sprites / 2)) : 0;
  for (let i = 0; i < n; i++) {
    const mat = new THREE.ShaderMaterial({ vertexShader: SV, fragmentShader: SF, transparent: true, depthWrite: false, side: THREE.DoubleSide,
      uniforms: { map: { value: null }, fr: { value: 0 }, alpha: { value: 1 }, gain: { value: 1.25 }, tint: { value: new THREE.Color() }, tk: { value: 0 } } });
    const mesh = new THREE.Mesh(GEO, mat); mesh.visible = false; mesh.frustumCulled = false; mesh.renderOrder = 10;
    strips.push({ mesh, u: mat.uniforms, on: false, t: 0, dur: 0.5, loop: false, s: 1, sy: 1, bill: 1, rot: 0, follow: null, fadeIn: 0 });
  }
}
// name: Paket 4 kod anahtarı (spark, burst, blast, shatter, arc, orb, fireball, shard, zap, dome, flame, drip, orbit, crystal,
// mote, critHit, dissolve, heal, bossEntrance). o: { size, sy, dur (döngüde toplam süre), loop, bill (1 kameraya dönük, 0 serbest),
// rot (ekran düzlemindeki dönüş), delay, gain (parlaklık), alpha, tint (renge boyama; şeridin kendi rengi elementle uyuşmadığında), tk }. Doku henüz yoksa null döner (çağıran yine kendi efektini çizer).
function strip(name, x, y, z, o = {}) {
  if (!strips.length) return null;
  const tex = vfxTex(name); if (!tex) return null;
  let s = strips.find(q => !q.on); if (!s) { s = strips.reduce((a, b) => (a.t > b.t ? a : b)); }
  const m = s.mesh; if (m.parent !== scene) scene.add(m);
  s.on = true; s.t = -(o.delay || 0); s.loop = !!o.loop; s.dur = o.dur || 0.5; s.s = o.size || 1; s.sy = o.sy || 1; s.bill = o.bill ?? 1; s.rot = o.rot || 0;
  s.a0 = o.alpha ?? 1; s.u.map.value = tex; s.u.gain.value = o.gain ?? 1.25; s.u.fr.value = 0;
  if (o.tint) { s.u.tint.value.setHex(o.tint); s.u.tk.value = o.tk ?? 0.85; } else s.u.tk.value = 0; s.u.alpha.value = 0;
  m.position.set(x, y, z); m.scale.set(s.s, s.s * s.sy, 1); m.visible = false;
  return s;
}
const stripOff = s => { if (s) { s.on = false; s.mesh.visible = false; } };
onUpdate(dt => {
  for (let i = 0; i < strips.length; i++) {
    const s = strips[i]; if (!s.on) continue;
    s.t += dt; if (s.t < 0) continue;
    const m = s.mesh, f = Math.floor(s.t * 24);
    if (!s.loop && f >= 12) { stripOff(s); continue; }
    if (s.loop && s.t >= s.dur) { stripOff(s); continue; }
    m.visible = true; s.u.fr.value = f % 12;
    // döngüde son 0.2 sn söner; tek oynatımda şeridin kendi sönmesi kullanılır
    s.u.alpha.value = s.a0 * (s.loop ? Math.min(1, s.t * 8, (s.dur - s.t) / 0.2) : 1);
    if (s.bill === 1) { m.quaternion.copy(camera.quaternion); if (s.rot) m.rotateZ(s.rot); }
  }
});
// Ekrandaki yön (a→b) açısı: yönlü şeritler (ateş topu, kıymık) hareket yönüne döner
const sa = new THREE.Vector3(), sb = new THREE.Vector3();
const screenAngle = (a, b) => { sa.copy(a).project(camera); sb.copy(b).project(camera); return Math.atan2(sb.y - sa.y, (sb.x - sa.x) * (camera.aspect || 1)); };
export const vfxOn = () => strips.length > 0;
// C14 (23 Kas): şerit paketi (~2 MB) açılışta değil, savaşa gidilirken (Kapı / VS ekranı) önden iner; savaş doğrudan
// başlarsa ilk strip() çağrısı indirir (o ana dek efekt eski çizimle çıkar). Grafik kademesi şeritsizse hiç inmez.
export const vfxOnYukle = () => { if (strips.length) vfxLoad(); };
// Şeritlerin çizildiği renk: efsun (mor) ve ateş kendi rengindedir; buz ve yıldırım şeritleri elementin rengine boyanır,
// silahın özel rengi (artı parıltısı vb.) verilmişse efsun da o renge döner
const STRIP_TINT = (el, E) => (el === 'ice' || el === 'bolt' || (el === 'arcane' && E.color !== ELEMENT_FX.arcane.color) ? E.color : 0);

// ---------- Efekt ışıkları ----------
// Sahnedeki ışık sayısı sabit kalmalıdır (değişirse bütün gölgelendiriciler yeniden derlenir): ışıklar hep sahnededir,
// boştayken şiddetleri sıfırdır.
const lights = [];
let lcur = 0;
function rebuildLights() {
  for (const L of lights) scene.remove(L);
  lights.length = 0;
  for (let i = 0; i < gfx.T.fxLights; i++) { const L = new THREE.PointLight(0xffffff, 0, 9, 1.8); L.userData = { life: 0, max: 1, peak: 0 }; scene.add(L); lights.push(L); }
}
function flashLight(x, y, z, color, peak = 8, dur = 0.35) {
  if (!lights.length || !color) return;
  const L = lights[lcur]; lcur = (lcur + 1) % lights.length;
  L.position.set(x, y, z); L.color.setHex(color); L.userData.life = L.userData.max = dur; L.userData.peak = peak;
}
rebuild();
onTier(rebuild);
rebuildStrips();
onTier(rebuildStrips);
export const fxOn = () => slots.length > 0;
export function clearFx() { for (const s of slots) { s.on = false; s.mesh.visible = false; if (s.mesh.parent !== scene) scene.add(s.mesh); } for (const L of lights) { L.userData.life = 0; L.intensity = 0; } setExposureMul(1); }

// ---------- Yardımcılar ----------
const v0 = new THREE.Vector3(), v1 = new THREE.Vector3(), v2 = new THREE.Vector3();
const rnd = (a, b) => a + Math.random() * (b - a);
const N = n => Math.max(1, Math.round(n * (gfx.T.fx === 2 ? 1 : 0.6))); // parçacık sayısı kademeye göre
// Yönlü kıvılcım: dir yönünde koni içinde saçılır
function sparks(p, dir, S, count, color = S.color, k = 1) {
  const n = N(count);
  for (let i = 0; i < n; i++) {
    const sp = S.speed * k * rnd(0.45, 1), s = S.spread;
    particle(p.x, p.y, p.z, (dir.x + rnd(-s, s)) * sp, (dir.y + rnd(-s, s) + 0.35) * sp, (dir.z + rnd(-s, s)) * sp, color, S.size * rnd(2.2, 4), S.life * rnd(0.8, 1.4), S.gravity, 1.5);
  }
}
const elOf = (el, color) => { const E = Object.hasOwn(ELEMENT_FX, el) ? ELEMENT_FX[el] : ELEMENT_FX.phys; return color && (el === 'arcane' || el === 'phys') ? { ...E, color } : E; };

// ---------- Silah ----------
// Savurma izi: silah türüne göre biçimi, genişliği ve eğimi değişen yay (birimin köküne bağlıdır, onunla döner)
export function swingArc(c, color) {
  const W = weaponFx(c.weaponKind, c.wt);
  if (W.arc === 'none' || !slots.length) return;
  const col = color || (W.arc === 'arcane' ? (c.fx || 0xb48aff) : W.arc === 'reap' ? (c.fx || 0xc070ff) : 0xfff2dc), size = W.reach * 2.7;
  // Yay birimin yerel uzayındadır (+z ileri): yatay savurmalar sağdan sola, öne doğru açılan eğik bir düzlemde; ezici darbeler
  // (topuz, sopa) yukarıdan öne inen dik düzlemde çizilir.
  const one = (y, delay, k, turn) => {
    const up = W.tilt > 1, s = sprite(K.arc, 0, y, 0.2, { parent: c.root, bill: 0, color: col, core: 0xffffff, s0: size * k, s1: size * k * 1.12, dur: 0.3 + W.weight * 0.06, alpha: 1, p0: 0.15, p1: 1.15, q: up ? -W.sweep : W.sweep, delay, fade: 1.4 });
    if (!s) return;
    // düzlemin eksenleri: yatay savurmada sağ (eğimli) × ileri; dik darbede ileri × yukarı (yana yatık: arkadan da okunur)
    if (up) { ax.set(0, 0, 1); ay.set(Math.sin(0.55), Math.cos(0.55), 0); } else { ax.set(Math.cos(W.tilt), Math.sin(W.tilt), 0); ay.set(0, 0, 1); }
    az.crossVectors(ax, ay); mm.makeBasis(ax, ay, az); s.mesh.quaternion.setFromRotationMatrix(mm); s.mesh.rotateZ((up ? Math.PI / 4 : Math.PI / 2) + turn);
  };
  one(1.3, 0, 1, 0);
  if (W.twin) one(1.05, 0.07, 0.85, 0.5);
}
export const slashArc = swingArc; // eski ad (skinned.js)
// Dönen halka (Kasırga): bitince çağrılan işlev döner
export function whirlRing(c, color = 0xdde6ff) {
  const k = c.scale || 1;
  for (let i = 0; i < 3; i++) sprite(K.arc, 0, (0.8 + i * 0.35) * k, 0, { parent: c.root, bill: 2, color, s0: 3.0 * k, s1: 3.6 * k, dur: 0.55, alpha: 0.8, p0: 0, p1: 2.2, q: 5.6, rot: i * 2.1, spin: 14, delay: i * 0.06, fade: 0.8 });
  return () => { sprite(K.ring, c.pos.x, 0.16, c.pos.z, { bill: 2, color, s0: 2.2 * k, s1: 5.2 * k, dur: 0.3, alpha: 0.7, q: 0.03 }); };
}
// Çarpma kıvılcımı: silahın türüne göre (kesik, delik, yonga, ezme, efsun)
export function hitSpark(pos, from, weaponKind, wt, { crit = false, heavy = false, el = 'phys', color = 0 } = {}) {
  const W = weaponFx(weaponKind, wt), S = SPARK_FX[W.spark], E = elOf(el, color);
  v0.copy(pos).sub(from).setY(0).normalize();
  const tint = el === 'phys' ? S.color : E.color, big = (heavy ? 1.3 : 1) * (crit ? 1.45 : 1);
  if (!slots.length) { burst(pos, { color: tint, count: 5, speed: 2.4, size: 0.05, life: 0.35 }); return; }
  sparks(pos, v0, S, W.sparks * big, tint, big);
  sprite(K.glow, pos.x, pos.y, pos.z, { color: tint, core: 0xffffff, s0: 0.8 * big, s1: 2.2 * big * W.weight, dur: 0.2, alpha: 1 });
  if (W.spark === 'slash' || W.spark === 'pierce') sprite(K.streak, pos.x, pos.y, pos.z, { color: tint, s0: 1.6 * big, s1: 3.4 * big, sy: 0.35, dur: 0.18, alpha: 1, rot: rnd(-0.9, 0.9), q: W.spark === 'pierce' ? 4 : 1 });
  if (W.spark === 'chunk') for (let i = 0; i < 2; i++) sprite(K.streak, pos.x, pos.y, pos.z, { color: tint, s0: 1.4 * big, s1: 3 * big, sy: 0.5, dur: 0.2, alpha: 1, rot: 0.6 - i * 1.2, q: 0.5 });
  if (W.ring) sprite(K.ring, pos.x, 0.16, pos.z, { bill: 2, color: 0xe8d2a8, s0: 0.8, s1: 2.6 * W.weight, dur: 0.3, alpha: 0.6, q: 0.04 });
  if (el === 'phys') strip('spark', pos.x, pos.y, pos.z, { size: 1.5 * big * Math.max(0.8, W.weight), rot: rnd(-0.6, 0.6) });
  if (W.dust) burst(v1.set(pos.x, 0.25, pos.z), { color: 0x8a7a66, count: N(6), speed: 1.6, size: 0.16, life: 0.7, gravity: 0.4, up: 0.6, smoke: true, grow: 1.5, drag: 1.5 });
  if (el !== 'phys') elementImpact(pos, el, color, false);
}

// ---------- Element ----------
// Hazırlık: büyücünün elinde toplanan element parıltısı
export function elementCast(pos, el, color) {
  const E = elOf(el, color);
  if (!slots.length || E.cast === 'none') return;
  sprite(K.glow, pos.x, pos.y, pos.z, { color: E.color, core: E.core, s0: 0.3, s1: 1.5, dur: 0.38, alpha: 0.9, fade: 0.6 });
  sprite(K.ring, pos.x, pos.y, pos.z, { color: E.color, core: E.core, s0: 2.2, s1: 0.5, dur: 0.34, alpha: 0.7, q: 0.02 });
  flashLight(pos.x, pos.y, pos.z, E.light, 6, 0.4);
  const n = N(10);
  for (let i = 0; i < n; i++) { // çevreden ele doğru çekilen zerreler
    const a = Math.random() * 6.283, r = rnd(0.7, 1.2), dx = Math.cos(a) * r, dy = rnd(-0.5, 0.8), dz = Math.sin(a) * r;
    particle(pos.x + dx, pos.y + dy, pos.z + dz, -dx * 3, -dy * 3, -dz * 3, i % 3 ? E.color : E.core, 0.1, 0.3, E.cast === 'frost' ? -1 : E.cast === 'flare' ? 2 : 0, 0);
  }
  if (E.cast === 'charge') sprite(K.zap, pos.x, pos.y + 0.5, pos.z, { color: E.color, core: E.core, s0: 1.4, sy: 0.6, dur: 0.22, alpha: 0.9, rot: Math.PI / 2, flick: true });
}
// Çarpma: ateş patlar, buz kırılır, yıldırım dallanır, efsun saçılır
export function elementImpact(pos, el, color, big = true) {
  const E = elOf(el, color), k = big ? 1 : 0.6;
  if (!slots.length) { burst(pos, { color: E.color, count: 6, speed: 2.6, size: 0.06, life: 0.4 }); return; }
  flashLight(pos.x, pos.y + 0.3, pos.z, E.light, big ? 12 : 6, 0.35);
  const drawn = ['burst', 'blast', 'shatter', 'arc'].includes(E.impact) && strip(E.impact, pos.x, pos.y, pos.z, { size: 2.6 * k, gain: E.impact === 'blast' ? 1.0 : 1.25, rot: E.impact === 'arc' ? rnd(-0.5, 0.5) : 0, tint: STRIP_TINT(el, E) });
  sprite(K.glow, pos.x, pos.y, pos.z, { color: E.color, core: E.core, s0: 0.6 * k, s1: (drawn ? 1.6 : 2.6) * k, dur: 0.22, alpha: drawn ? 0.6 : 1 });
  if (E.impact === 'blast') {
    burst(pos, { color: E.color, count: N(22 * k), speed: 4.2, size: 0.09, life: 0.55, gravity: -2, drag: 1.2 });
    burst(pos, { color: E.core, count: N(8 * k), speed: 2, size: 0.1, life: 0.35, gravity: 1 });
    burst(pos, { color: 0x2a221e, count: N(5 * k), speed: 1.2, size: 0.22, life: 0.9, gravity: 0.9, up: 1.2, smoke: true, grow: 1.8, drag: 1 });
    sprite(K.ring, pos.x, 0.16, pos.z, { bill: 2, color: E.color, core: E.core, s0: 0.8 * k, s1: 3.4 * k, dur: 0.36, alpha: 0.8, q: 0.05 });
  } else if (E.impact === 'shatter') {
    for (let i = 0; i < (big ? 5 : 3); i++) { const a = i * 1.3 + rnd(0, 0.6), r = rnd(0.15, 0.5) * k; sprite(K.shard, pos.x + Math.cos(a) * r, Math.max(0.3, pos.y - 0.5) + rnd(0, 0.5), pos.z + Math.sin(a) * r, { color: E.color, core: E.core, s0: 0.15, s1: rnd(0.5, 0.9) * k, sy: 1.8, dur: rnd(0.45, 0.7), alpha: 0.9, rot: rnd(-0.5, 0.5), delay: i * 0.02, fade: 2 }); }
    burst(pos, { color: E.core, count: N(16 * k), speed: 3.4, size: 0.06, life: 0.5, gravity: -8 });
    sprite(K.ring, pos.x, 0.16, pos.z, { bill: 2, color: E.color, core: E.core, s0: 0.6 * k, s1: 2.6 * k, dur: 0.5, alpha: 0.55, q: 0.09 });
  } else if (E.impact === 'arc') {
    sprite(K.zap, pos.x, pos.y + 2.6, pos.z, { color: E.color, core: E.core, s0: 6.4, sy: 0.32, dur: 0.2, alpha: 1, rot: Math.PI / 2, flick: true });
    for (let i = 0; i < 3; i++) sprite(K.zap, pos.x, pos.y, pos.z, { color: E.color, core: E.core, s0: rnd(1.4, 2.4) * k, sy: 0.5, dur: 0.18, alpha: 0.9, rot: rnd(0, 6.28), flick: true, delay: i * 0.03 });
    burst(pos, { color: E.core, count: N(12 * k), speed: 5, size: 0.05, life: 0.22, gravity: 0 });
  } else if (E.impact === 'burst') {
    burst(pos, { color: E.color, count: N(16 * k), speed: 3, size: 0.07, life: 0.5, gravity: 1, drag: 1.5 });
    sprite(K.ring, pos.x, pos.y, pos.z, { color: E.color, core: E.core, s0: 0.5 * k, s1: 2.4 * k, dur: 0.3, alpha: 0.7, q: 0.03 });
  } else burst(pos, { color: E.color, count: N(8), speed: 2.6, size: 0.05, life: 0.3 });
}
// Mermi: ok ya da element topu. Hedefe varınca çözülür; çarpma efektini çağıran oynatır.
const ARROWS = [];
function arrowMesh() {
  let a = ARROWS.find(x => !x.visible);
  if (a) return a;
  if (ARROWS.length >= 6) return ARROWS[0];
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.75, 5).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x8a6a44 })));
  g.add(new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.12, 6).rotateX(Math.PI / 2).translate(0, 0, 0.42), new THREE.MeshBasicMaterial({ color: 0xd8dde4 })));
  g.visible = false; scene.add(g); ARROWS.push(g);
  return g;
}
export async function projectile(from, toPos, { color = 0xff7a1a, size = 0.18, dur = 0.35, arc = 0.8, arrow = false, el = '' } = {}) {
  const E = el ? elOf(el, color) : { color, core: 0xffffff, proj: arrow ? 'arrow' : 'orb', light: 0 }, a = from.clone(), b = toPos.clone();
  if (E.proj === 'zap' && !arrow) { // yıldırım uçmaz: elden hedefe bir anda iner
    if (slots.length) {
      const mid = a.clone().add(b).multiplyScalar(0.5), len = a.distanceTo(b);
      for (let i = 0; i < 2; i++) { const s = sprite(K.zap, mid.x, mid.y, mid.z, { color: E.color, core: E.core, s0: len, sy: 0.22 + i * 0.1, dur: 0.16 + i * 0.05, alpha: 1, flick: true, bill: 0 }); if (s) orientAlong(s.mesh, a, b); }
      flashLight(mid.x, mid.y, mid.z, E.light, 10, 0.2);
      const z = strip('zap', mid.x, mid.y, mid.z, { size: len * 0.9, sy: 0.45, bill: 0, tint: STRIP_TINT(el, E) }); if (z) orientAlong(z.mesh, a, b);
    }
    return wait(0.12);
  }
  const obj = arrow ? arrowMesh() : null, head = arrow ? null : sprite(K.glow, a.x, a.y, a.z, { color: E.color, core: E.core, s0: size * 4.2, s1: size * 4.2, dur: dur + 0.05, alpha: 1, fade: 0.01 });
  if (obj) { obj.visible = true; obj.position.copy(a); }
  const ps = !arrow && ['orb', 'fireball', 'shard'].includes(E.proj) ? strip(E.proj, a.x, a.y, a.z, { size: size * (E.proj === 'orb' ? 5.5 : 7), loop: true, dur: dur + 0.05, rot: E.proj === 'orb' ? 0 : screenAngle(a, b), tint: STRIP_TINT(el, E) }) : null;
  if (ps && head) head.a0 = 0.5;
  const trail = arrow ? 0x000000 : E.color;
  await tween(dur, k => {
    v2.lerpVectors(a, b, k); v2.y += Math.sin(k * Math.PI) * arc;
    if (obj) { v1.copy(v2).sub(obj.position); if (v1.lengthSq() > 1e-8) { v1.add(v2); obj.position.copy(v2); obj.lookAt(v1); } }
    else if (head) head.mesh.position.copy(v2);
    if (ps) ps.mesh.position.copy(v2);
    if (arrow) { if (color && Math.random() < 0.5) particle(v2.x, v2.y, v2.z, 0, 0, 0, color, 0.07, 0.25, 0, 0); }
    else {
      particle(v2.x + rnd(-0.05, 0.05), v2.y + rnd(-0.05, 0.05), v2.z, rnd(-0.3, 0.3), rnd(-0.1, 0.5), rnd(-0.3, 0.3), Math.random() < 0.3 ? E.core : trail, size * 1.1, 0.32, E.proj === 'fireball' ? 1.5 : E.proj === 'shard' ? -1.5 : 0, 1);
      if (E.proj === 'fireball' && Math.random() < 0.25) particle(v2.x, v2.y, v2.z, 0, 0.4, 0, 0x2a221e, size * 1.6, 0.6, 0.6, 1, 1.5, true);
    }
  }, ease.linear);
  if (obj) obj.visible = false;
  if (head) head.on = false, head.mesh.visible = false;
  stripOff(ps);
  if (!slots.length) burst(b, { color: E.color, count: 8, speed: 2.6, size: 0.06, life: 0.4 });
}
// Levhayı a→b doğrusu boyunca yatır ve kameraya çevir
const ax = new THREE.Vector3(), ay = new THREE.Vector3(), az = new THREE.Vector3(), mm = new THREE.Matrix4();
function orientAlong(mesh, a, b) {
  ax.copy(b).sub(a).normalize(); az.copy(camera.position).sub(mesh.position).normalize(); ay.copy(az).cross(ax).normalize(); az.copy(ax).cross(ay);
  mm.makeBasis(ax, ay, az); mesh.quaternion.setFromRotationMatrix(mm);
}
// Gökten düşen vuruş (Meteor ve benzerleri): ateş topu, buz sarkıtı ya da yıldırım
export async function skyStrike(targetPos, el = 'fire', color = 0) {
  const E = elOf(el, color);
  if (E.proj === 'zap') { sprite(K.ring, targetPos.x, 0.16, targetPos.z, { bill: 2, color: E.color, s0: 2.4, s1: 0.8, dur: 0.22, alpha: 0.7, q: 0.03 }); await wait(0.2); }
  else {
    sprite(K.ring, targetPos.x, 0.16, targetPos.z, { bill: 2, color: E.color, s0: 2.6, s1: 0.9, dur: 0.4, alpha: 0.6, q: 0.03 });
    await projectile(v0.copy(targetPos).add(v1.set(1.5, 9, -2)).clone(), targetPos, { el, color: E.color, size: 0.34, dur: 0.4, arc: 0 });
  }
  elementImpact(targetPos, el, color, true);
  if (slots.length) sprite(K.beam, targetPos.x, 1.8, targetPos.z, { color: E.color, core: E.core, s0: 1.2, s1: 0.4, sy: 3.4, dur: 0.3, alpha: 0.7 });
}
export const meteorStrike = (p, color = 0xff4400) => skyStrike(p, 'fire', color); // eski ad
// Yer sarsıntısı (Tepinme, Deprem): genişleyen halkalar ve toz
export function shockwave(center, color = 0xc8a060, size = 5) {
  camRig.shake = Math.max(camRig.shake, 0.4);
  if (!slots.length) { burst(v0.set(center.x, 0.3, center.z), { color, count: 8, speed: 3, size: 0.07, life: 0.4, up: 0.3 }); return wait(0.45); }
  for (let i = 0; i < 2; i++) sprite(K.ring, center.x, 0.16, center.z, { bill: 2, color, core: 0xfff0d0, s0: 1.4, s1: 1.8 * (1 + size) * (1 - i * 0.25), dur: 0.5, alpha: 0.9, q: 0.06 - i * 0.03, delay: i * 0.08 });
  const n = N(14);
  for (let i = 0; i < n; i++) { const a = i / n * 6.283, r = 1.2; particle(center.x + Math.cos(a) * r, 0.2, center.z + Math.sin(a) * r, Math.cos(a) * 3.2, rnd(0.6, 1.6), Math.sin(a) * 3.2, 0x8a7a66, rnd(0.25, 0.4), rnd(0.6, 0.9), 0.3, 2.2, 1.6, true); }
  return wait(0.45);
}

// ---------- Şifa, kalkan, durum ----------
// Şifa: yükselen yeşil zerreler, zemin halkası ve ince ışık sütunu (simge yok; yalnızca ışık ve zerre)
export function healAura(char, color = 0x6dff8a) {
  const k = char.scale || 1, x = char.pos.x, z = char.pos.z;
  burst(v0.set(x, 0.3, z), { color, count: N(16), speed: 1.5, size: 0.06, life: 1.0, gravity: 1.4, up: 3, spread: 0.55, drag: 0.8 });
  if (!slots.length) return;
  char.chestTo(v1); strip('heal', x, v1.y, z, { size: 2.8 * k });
  sprite(K.ring, x, 0.16, z, { bill: 2, color, core: 0xffffff, s0: 0.6 * k, s1: 2.2 * k, dur: 0.7, alpha: 0.8, q: 0.03 });
  sprite(K.beam, x, 1.7 * k, z, { color, core: 0xffffff, s0: 1.3 * k, s1: 0.7 * k, sy: 3.2, dur: 0.85, alpha: 0.45 });
  flashLight(x, 1.2 * k, z, color, 4, 0.6);
}
export function shieldUp(char, color = 0x7fc8ff) {
  if (!slots.length) return;
  const k = char.scale || 1; char.chestTo(v0);
  const d = strip('dome', v0.x, v0.y - 0.1 * k, v0.z, { size: 2.9 * k, loop: true, dur: 1.0 });
  sprite(K.dome, v0.x, v0.y - 0.15 * k, v0.z, { color, core: 0xffffff, s0: 0.6 * k, s1: 2.7 * k, sy: 1.15, dur: 0.9, alpha: d ? 0.35 : 0.9, p0: 0, p1: 1, fade: 0.7 });
  sprite(K.ring, char.pos.x, 0.16, char.pos.z, { bill: 2, color, s0: 2.4 * k, s1: 1.4 * k, dur: 0.5, alpha: 0.6, q: 0.03 });
}
// Kalkan darbeyi emdi: kubbe kısa bir an parlar
export function shieldHit(char, color = 0x7fc8ff) {
  if (!slots.length) return;
  const k = char.scale || 1; char.chestTo(v0);
  sprite(K.dome, v0.x, v0.y - 0.15 * k, v0.z, { color, core: 0xffffff, s0: 2.5 * k, s1: 2.75 * k, sy: 1.15, dur: 0.3, alpha: 1, fade: 1.5 });
  burst(v0, { color, count: N(6), speed: 2, size: 0.05, life: 0.3, gravity: 0 });
}
// Durum uygulandı: tablodaki işaret bir kez oynar
export function statusMark(char, s) {
  const F = Object.hasOwn(STATUS_FX, s) ? STATUS_FX[s] : null;
  if (!F) return;
  const k = char.scale || 1, x = char.pos.x, z = char.pos.z, c = F.color;
  char.chestTo(v0);
  if (!slots.length) { if (F.tone !== 'buff') burst(v0, { color: c, count: 4, speed: 1.2, size: 0.05, life: 0.5, gravity: 0.5 }); return; }
  { // çizilmiş durum şeridi bir saniye döner (kendi rengi uymayan durumlarda durumun rengine boyanır)
    const m = F.mark, own = { flame: 0xff6a1a, crystal: 0x8fdcff, drip: 0xb48aff, orbit: 0xb48aff, mote: 0xffd9a0 };
    if (m in own) { if (m === 'orbit') char.headTo(v1); else v1.copy(v0);
      strip(m, v1.x, v1.y + (m === 'orbit' ? 0.15 * k : m === 'crystal' ? -0.2 * k : 0), v1.z, { size: (m === 'orbit' ? 1.6 : 2.2) * k, loop: true, dur: 1.0, tint: c !== own[m] ? c : 0, tk: 0.8 }); }
  }
  switch (F.mark) {
    case 'up': case 'down': {
      const up = F.mark === 'up';
      sprite(K.chev, v0.x, v0.y + (up ? 0 : 0.5 * k), v0.z, { color: c, s0: 1.3 * k, s1: 1.3 * k, sy: 1.8, dur: 0.8, alpha: 0.9, p0: 0, p1: 1, q: up ? 1 : -1, rise: up ? 0.5 : -0.5 });
      sprite(K.ring, x, 0.16, z, { bill: 2, color: c, s0: up ? 1 : 2.4 * k, s1: up ? 2.4 * k : 1, dur: 0.5, alpha: 0.6, q: 0.03 });
      break;
    }
    case 'dome': shieldUp(char, c); break;
    case 'ring': for (let i = 0; i < 2; i++) sprite(K.ring, x, 0.16, z, { bill: 2, color: c, s0: 0.8, s1: 2.8 * k, dur: 0.6, alpha: 0.8, q: 0.05, delay: i * 0.15 }); break;
    case 'reticle': sprite(K.reticle, v0.x, v0.y, v0.z, { color: c, core: 0xffd0d0, s0: 3.2 * k, s1: 1.5 * k, dur: 0.9, alpha: 0.95, p0: 0, p1: 0.5, fade: 0.5 }); break;
    case 'wisp': burst(v0, { color: 0x4a5a2a, count: N(8), speed: 0.8, size: 0.2, life: 1.1, gravity: 0.5, smoke: true, grow: 1.2, drag: 1 }); burst(v0, { color: c, count: N(6), speed: 0.9, size: 0.05, life: 0.8, gravity: -0.6 }); break;
    case 'flame': burst(v0, { color: c, count: N(14), speed: 1.6, size: 0.09, life: 0.6, gravity: 3, up: 1.4, spread: 0.6 }); sprite(K.glow, v0.x, v0.y, v0.z, { color: c, core: 0xffe08a, s0: 0.8 * k, s1: 2 * k, dur: 0.35, alpha: 0.8 }); break;
    case 'drip': burst(v0, { color: c, count: N(10), speed: 1.1, size: 0.08, life: 0.9, gravity: 1.2, up: 1.2, spread: 0.5, drag: 1.5 }); sprite(K.ring, x, 0.16, z, { bill: 2, color: c, s0: 0.6, s1: 2 * k, dur: 0.6, alpha: 0.5, q: 0.08 }); break;
    case 'orbit': char.headTo(v1); sprite(K.orbit, v1.x, v1.y + 0.1 * k, v1.z, { color: c, core: 0xffffff, s0: 1.5 * k, s1: 1.5 * k, dur: 1.1, alpha: 1, p0: 0, p1: 2.2, fade: 0.4 }); break;
    case 'crystal': for (let i = 0; i < 4; i++) { const a = i * 1.57 + 0.5, r = 0.45 * k; sprite(K.shard, x + Math.cos(a) * r, 0.5 * k, z + Math.sin(a) * r, { color: c, core: 0xffffff, s0: 0.2, s1: 0.75 * k, sy: 2, dur: 1.0, alpha: 0.9, rot: rnd(-0.3, 0.3), delay: i * 0.04, fade: 2.5 }); } burst(v0, { color: 0xeafaff, count: N(8), speed: 1.4, size: 0.05, life: 0.6, gravity: -2 }); break;
    case 'mote': burst(v0.set(x, 0.4, z), { color: c, count: N(10), speed: 1.2, size: 0.05, life: 1, gravity: 1.2, up: 2.4, spread: 0.5 }); break;
    case 'glint': for (let i = 0; i < 2; i++) sprite(K.streak, v0.x, v0.y + 0.3 * k, v0.z, { color: c, s0: 0.4, s1: 2.2 * k, sy: 0.25, dur: 0.35, alpha: 1, rot: i * 1.5708 + 0.4, q: 5, delay: i * 0.05 }); break;
    case 'gust': for (let i = 0; i < 3; i++) sprite(K.streak, v0.x + rnd(-0.4, 0.4), v0.y + rnd(-0.5, 0.5), v0.z, { color: c, s0: 1.6 * k, s1: 2.6 * k, sy: 0.16, dur: 0.4, alpha: 0.8, q: 3, delay: i * 0.07 }); break;
  }
}
// Durum sürerken: birimin üstünde düşük sıklıkla süren iz (combat.js her karede çağırır; bellek ayırmaz)
// acc: birim başına zaman biriktirici nesnesi ({ t: 0 })
export function statusHold(char, st, dt, acc) {
  if (!st.length || char.dead) return;
  acc.t += dt;
  if (acc.t < 0.16) return;
  acc.t = 0;
  const k = char.scale || 1, x = char.pos.x, z = char.pos.z;
  for (let i = 0; i < st.length; i++) {
    const F = STATUS_FX[st[i].s];
    if (!F || !F.hold) continue;
    if (F.hold === 'flame') particle(x + rnd(-0.3, 0.3) * k, rnd(0.5, 1.7) * k, z + rnd(-0.25, 0.25) * k, 0, rnd(0.8, 1.4), 0, Math.random() < 0.3 ? 0xffe08a : F.color, 0.13, 0.5, 1.5, 1);
    else if (F.hold === 'drip') particle(x + rnd(-0.3, 0.3) * k, rnd(1.0, 1.8) * k, z + rnd(-0.25, 0.25) * k, 0, 0.2, 0, F.color, 0.1, 0.7, -2.2, 0.5);
    else if (F.hold === 'mote') { if (Math.random() < 0.5) particle(x + rnd(-0.4, 0.4) * k, 0.3, z + rnd(-0.3, 0.3) * k, 0, 1.3, 0, F.color, 0.09, 0.9, 0.4, 0.5); }
    else if (F.hold === 'crystal') { if (Math.random() < 0.5) particle(x + rnd(-0.45, 0.45) * k, rnd(0.2, 1.9) * k, z + rnd(-0.3, 0.3) * k, 0, -0.2, 0, 0xeafaff, 0.07, 0.6, -0.5, 0); }
    else if (F.hold === 'orbit') { const a = performance.now() / 160; char.headTo(v0); particle(v0.x + Math.cos(a) * 0.3 * k, v0.y, v0.z + Math.sin(a) * 0.3 * k, 0, 0, 0, F.color, 0.1, 0.3, 0, 0); }
    else if (F.hold === 'dome' && slots.length && Math.random() < 0.12) { char.chestTo(v0); sprite(K.dome, v0.x, v0.y - 0.15 * k, v0.z, { color: F.color, s0: 2.45 * k, s1: 2.55 * k, sy: 1.15, dur: 1.0, alpha: 0.28, p0: 0, p1: 1, fade: 1 }); }
  }
}

// ---------- Olay efektleri (fx-table.js: EVENT_FX adlarıyla) ----------
const head = (c, out = v0) => c.headTo(out), chest = (c, out = v0) => c.chestTo(out);
const IMPL = {
  // dmg: vuranın silahına ve yeteneğin elementine göre kıvılcım. o: { from, weaponKind, wt, el, color, heavy }
  hit(c, o = {}) { if (!o.crit) hitStop(o.heavy ? 0.05 : 0.028); chest(c, v2); hitSpark(v2.clone(), o.from || c.pos, o.weaponKind, o.wt, o); }, // her vuruşta kısa donma (kritikte critHit daha uzun durdurur)
  // kritik: kısa duraklama, hedefe doğru küçük kamera itişi, parlak halka
  critHit(c, o = {}) {
    const C = o.special ? CRIT_FX.special : CRIT_FX;
    hitStop(C.stop); camRig.shake = Math.max(camRig.shake, C.shake);
    chest(c, v2); v1.copy(v2).sub(camRig.pos).normalize().multiplyScalar(C.nudge); nudgeCam(v1.x, v1.y, v1.z);
    if (!slots.length) return;
    strip('critHit', v2.x, v2.y, v2.z, { size: 3.0 * (c.scale || 1), rot: rnd(-0.4, 0.4) });
    sprite(K.ring, v2.x, v2.y, v2.z, { color: 0xffd23a, core: 0xffffff, s0: 0.5, s1: 3.4, dur: 0.3, alpha: 1, q: 0.02 });
    for (let i = 0; i < 4; i++) sprite(K.streak, v2.x, v2.y, v2.z, { color: 0xffe9a0, s0: 0.6, s1: 3.6, sy: 0.14, dur: 0.24, alpha: 1, rot: i * 0.785 + 0.3, q: 6 });
    flashLight(v2.x, v2.y, v2.z, 0xffe0a0, 10, 0.25);
  },
  weakHit(c) { if (!slots.length) return; chest(c, v2); sprite(K.chev, v2.x, v2.y + 0.7 * (c.scale || 1), v2.z, { color: 0xffe066, s0: 1.1, s1: 1.1, sy: 1.3, dur: 0.5, alpha: 0.9, p0: 0, p1: 0.8, q: 1, rise: 0.8 }); },
  shieldHit(c) { shieldHit(c); },
  // ölüm: gövde erir (malzemedeki erime değeri), kül ve kor yükselir
  dissolve(c) {
    const k = c.scale || 1, n = N(18);
    chest(c, v2); strip('dissolve', v2.x, v2.y, v2.z, { size: 2.6 * k, gain: 1.1 });
    for (let i = 0; i < n; i++) particle(c.pos.x + rnd(-0.5, 0.5) * k, rnd(0.1, 1.6) * k, c.pos.z + rnd(-0.4, 0.4) * k, rnd(-0.3, 0.3), rnd(0.5, 1.6), rnd(-0.3, 0.3), i % 3 ? 0xff8a3a : 0xffd9a0, 0.09, rnd(0.6, 1.2), 0.6, 0.8);
    burst(v0.set(c.pos.x, 0.5 * k, c.pos.z), { color: 0x3a342e, count: N(8), speed: 0.9, size: 0.24, life: 1.2, gravity: 0.7, up: 1.2, smoke: true, grow: 1.4, drag: 1 });
  },
  heal(c, o = {}) { healAura(c, o.color || 0x6dff8a); },
  status(c, o = {}) { statusMark(c, o.s); },
  resist(c) { if (!slots.length) return; chest(c, v2); sprite(K.ring, v2.x, v2.y, v2.z, { color: 0xc8d2e0, s0: 2.2, s1: 1.2, dur: 0.3, alpha: 0.7, q: 0.02 }); sprite(K.streak, v2.x, v2.y, v2.z, { color: 0xffffff, s0: 1, s1: 2.2, sy: 0.2, dur: 0.2, alpha: 0.8, rot: 0.8, q: 4 }); },
  // sıra çubuğu: ileri alındıysa hız çizgileri öne, geri itildiyse arkaya
  tempo(c, o = {}) { if (!slots.length) return; chest(c, v2); const up = (o.v || 0) >= 0; for (let i = 0; i < 2; i++) sprite(K.chev, v2.x, v2.y + (up ? 0 : 0.4), v2.z, { color: up ? 0x8fffd0 : 0x9a8aa8, s0: 0.9, s1: 0.9, sy: 1.5, dur: 0.5, alpha: 0.8, p0: 0, p1: 0.9, q: up ? 1 : -1, rise: up ? 0.7 : -0.5, delay: i * 0.1 }); },
  cleanse(c) { chest(c, v2); burst(v2, { color: 0xeafaff, count: N(14), speed: 2.2, size: 0.06, life: 0.6, gravity: 1, drag: 1.5 }); if (slots.length) sprite(K.ring, c.pos.x, 0.16, c.pos.z, { bill: 2, color: 0xbfe6ff, core: 0xffffff, s0: 0.5, s1: 3 * (c.scale || 1), dur: 0.5, alpha: 0.8, q: 0.02 }); },
  revive(c) { healAura(c, 0xfff0a0); if (slots.length) sprite(K.beam, c.pos.x, 3, c.pos.z, { color: 0xfff0a0, core: 0xffffff, s0: 0.5, s1: 1.8 * (c.scale || 1), sy: 4, dur: 0.9, alpha: 0.7 }); },
  // boss evre değiştirdi: kızıl dalga
  phase(c) { const k = c.scale || 1; camRig.shake = Math.max(camRig.shake, 0.5); shockwave(c.pos, 0xff5a3a, 3 * k); chest(c, v2); burst(v2, { color: 0xff5a3a, count: N(20), speed: 3.4, size: 0.08, life: 0.7, gravity: 1 }); flashLight(v2.x, v2.y, v2.z, 0xff5a3a, 14, 0.6); },
  burnTick(c) { chest(c, v2); burst(v2, { color: 0xff6a1a, count: N(8), speed: 1.4, size: 0.08, life: 0.5, gravity: 3, up: 1.4, spread: 0.5 }); if (slots.length) sprite(K.glow, v2.x, v2.y, v2.z, { color: 0xff6a1a, core: 0xffe08a, s0: 0.6, s1: 1.6, dur: 0.3, alpha: 0.7 }); },
  poisonTick(c) { chest(c, v2); burst(v2, { color: 0x8aff3a, count: N(7), speed: 1, size: 0.08, life: 0.8, gravity: 1, up: 1, spread: 0.5, drag: 1.5 }); burst(v2, { color: 0x3a5a1e, count: N(3), speed: 0.6, size: 0.2, life: 0.9, gravity: 0.5, smoke: true, grow: 1.2 }); },
  bleedTick(c) { chest(c, v2); burst(v2, { color: 0xd0202a, count: N(7), speed: 1.2, size: 0.06, life: 0.6, gravity: 5, up: 0.4, spread: 0.6 }); },
  // patlatma: kalan süren hasar bir anda işler. o.s: patlatılan etkiler (ilkinin rengi)
  detonate(c, o = {}) {
    const col = (STATUS_FX[Array.isArray(o.s) ? o.s[0] : o.s] || STATUS_FX.burn).color, k = c.scale || 1;
    chest(c, v2); camRig.shake = Math.max(camRig.shake, 0.25);
    burst(v2, { color: col, count: N(18), speed: 3.4, size: 0.07, life: 0.55, gravity: 2, up: 0.6 });
    if (slots.length) { sprite(K.glow, v2.x, v2.y, v2.z, { color: col, core: 0xffffff, s0: 0.5, s1: 2.4 * k, dur: 0.3, alpha: 0.85 }); sprite(K.ring, v2.x, v2.y, v2.z, { color: col, s0: 0.6, s1: 2.8 * k, dur: 0.35, alpha: 0.8, q: 0.04 }); }
  },
  // himaye: koruyanın üstlendiği pay (altın kalkan izi)
  guardHit(c) { shieldHit(c, STATUS_FX.guard.color); },
  // sökme: olumlu etkiler dağılır (aşağı düşen soluk kırıntılar)
  strip(c) { chest(c, v2); burst(v2, { color: 0xc8b8e0, count: N(12), speed: 2, size: 0.06, life: 0.6, gravity: 4, up: 0.8, spread: 0.7 }); if (slots.length) sprite(K.ring, v2.x, v2.y, v2.z, { color: 0xc8b8e0, s0: 1.2, s1: 2.4 * (c.scale || 1), dur: 0.3, alpha: 0.6, q: 0.03 }); },
  // sakınma: zararlı etki savuşturuldu
  wardOff(c) { shieldHit(c, STATUS_FX.ward.color); },
  regenTick(c) { burst(v0.set(c.pos.x, 0.4, c.pos.z), { color: 0x7dff8a, count: N(8), speed: 1.2, size: 0.05, life: 0.9, gravity: 1.2, up: 2.4, spread: 0.5 }); },
  skipTurn(c, o = {}) { statusMark(c, o.s === 'freeze' ? 'freeze' : 'stun'); },
  enrage(c) { const k = c.scale || 1; chest(c, v2); burst(v2, { color: 0xff3a2a, count: N(16), speed: 2.4, size: 0.08, life: 0.7, gravity: 2.5, up: 1.6 }); if (slots.length) sprite(K.ring, c.pos.x, 0.16, c.pos.z, { bill: 2, color: 0xff3a2a, s0: 1, s1: 3.4 * k, dur: 0.5, alpha: 0.9, q: 0.06 }); },
  // yeni düşman sahneye girdi: ayak altında toz
  waveIn(c) { burst(v0.set(c.pos.x, 0.25, c.pos.z), { color: 0x8a7a66, count: N(5), speed: 1.4, size: 0.2, life: 0.7, gravity: 0.3, up: 0.5, smoke: true, grow: 1.5, drag: 1.5 }); },
  // sıra bu birimde: ayak altında kısa bir halka (kimin oynadığı uzaktan da okunsun)
  turnMark(c) { if (!slots.length) return; sprite(K.ring, c.pos.x, 0.16, c.pos.z, { bill: 2, color: 0xffd36a, s0: 2.4 * (c.scale || 1), s1: 1.5 * (c.scale || 1), dur: 0.35, alpha: 0.6, q: 0.02 }); },
  // özel yetenek hazırlığı: elde element parıltısı. o: { el, color }
  cast(c, o = {}) { const p = c.handPos(); elementCast(p, o.el || 'arcane', o.color); },
  // boss girişi: yerden yükselen halka, toz, kızıl ışık (kamera hareketini combat.js yapar)
  bossEntrance(c) {
    const k = c.scale || 1, x = c.pos.x, z = c.pos.z;
    camRig.shake = Math.max(camRig.shake, 0.45);
    burst(v0.set(x, 0.3, z), { color: 0x6a5a4a, count: N(14), speed: 2.6, size: 0.3, life: 1.1, gravity: 0.3, up: 0.5, smoke: true, grow: 1.6, drag: 1.6 });
    burst(v0.set(x, 0.4, z), { color: c.fx || 0xff5a3a, count: N(22), speed: 3, size: 0.07, life: 0.9, gravity: 1.5, up: 1.8 });
    if (!slots.length) return;
    strip('bossEntrance', x, 1.6 * k, z, { size: 4.4 * k, dur: 0.5 });
    for (let i = 0; i < 3; i++) sprite(K.ring, x, 0.16, z, { bill: 2, color: c.fx || 0xff5a3a, core: 0xffe0c0, s0: 0.8, s1: (3 + i * 1.6) * k, dur: 0.7, alpha: 0.9, q: 0.05, delay: i * 0.14 });
    sprite(K.beam, x, 2.2 * k, z, { color: c.fx || 0xff5a3a, core: 0xffffff, s0: 2.4 * k, s1: 0.8 * k, sy: 2.6, dur: 0.8, alpha: 0.6 });
    flashLight(x, 1.5 * k, z, c.fx || 0xff5a3a, 16, 0.9);
  },
  // zafer: sahne hafifçe aydınlanır, ayakta kalanların üstüne altın ışık ve zerreler iner. cs: kutlayan karakterler
  victory(cs) {
    tween(0.6, k => setExposureMul(1 + 0.16 * k), ease.out);
    for (const c of cs) {
      const k = c.scale || 1, x = c.pos.x, z = c.pos.z;
      burst(v0.set(x, 0.3, z), { color: 0xffd36a, count: N(18), speed: 1.6, size: 0.06, life: 1.4, gravity: 1.2, up: 3, spread: 0.6, drag: 0.6 });
      if (!slots.length) continue;
      sprite(K.beam, x, 2.6 * k, z, { color: 0xffd98a, core: 0xfff4d0, s0: 1.1 * k, s1: 0.9 * k, sy: 4.4, dur: 1.3, alpha: 0.2, fade: 0.8 });
      sprite(K.ring, x, 0.16, z, { bill: 2, color: 0xffd36a, core: 0xffffff, s0: 0.8, s1: 2.6 * k, dur: 0.9, alpha: 0.8, q: 0.03 });
    }
    if (cs[0]) flashLight(0, 3, cs[0].pos.z, 0xffe0a0, 10, 1.2);
  },
  // yenilgi: sahne kararır
  defeat() { tween(0.8, k => setExposureMul(1 - 0.3 * k), ease.out); },
};
// Tablodaki her efekt adı uygulanmış olmalı (eksik varsa geliştiriciye haber ver; oyun yine de çalışır)
export const FX_MISSING = FX_NAMES.filter(n => typeof IMPL[n] !== 'function');
if (FX_MISSING.length) console.warn('[fx] uygulanmamış efekt:', FX_MISSING.join(', '));
// Efekti adıyla oynat (bilinmeyen ad sessizce geçilir)
export function play(name, target, opt) { const f = Object.hasOwn(IMPL, name) ? IMPL[name] : null; if (f && target) f(target, opt); }
window.DD_FX = { missing: FX_MISSING, strip: (n, x, y, z, o) => strip(n, x, y, z, o), vfx: () => strips.filter(s => s.on).length, slots: () => slots.filter(s => s.on).length, cap: () => slots.length, lights: () => lights.length };
