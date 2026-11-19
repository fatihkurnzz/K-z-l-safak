// Sahne yapı taşları (ortam, ana üs binaları ve koddan üretilen karakterler ortak kullanır):
//  - Batch: çok sayıda küçük parçayı tek çizim çağrısında birleştirir. Rengi, pürüzlülüğü, metalliği ve ışımayı köşe
//    verisi taşır; böylece taş, ahşap, metal ve kumaş tek malzemeyle çizilir. Parçalara dikey renk geçişi ve alttan
//    kararma (ucuz ortam gölgesi) pişirilir: düz renkli kutular yerine hacmi okunan yüzeyler.
//  - bakeRigid: eklemli bir modelin (koddan üretilen karakter) her eklemine bağlı parçalarını tek ağ yapar.
//  - patchStd: standart malzemeye küçük gölgelendirici ekleri (köşe verisi, rüzgâr, erime, vuruş parlaması).
//  - rüzgârla dalgalanan sancak, zemin lekesi (birim ve bina altı), alev, havada süzülen parçacıklar.
// Hepsi tek seferde kurulur; kare başına bellek ayırmaz, hareket gölgelendiricide hesaplanır.
import { THREE, onUpdate } from './engine3d.js';

// Rüzgâr saati: t zaman, k rüzgârın gücü (poyrazda artar; daylight.js verir)
export const wind = { t: { value: 0 }, k: { value: 1 } };
onUpdate((dt, t) => { wind.t.value = t; });

const NOISE = `float ddH(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,37.719))) * 43758.5453); }
float ddN(vec3 p){ vec3 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(mix(ddH(i), ddH(i+vec3(1,0,0)), f.x), mix(ddH(i+vec3(0,1,0)), ddH(i+vec3(1,1,0)), f.x), f.y),
             mix(mix(ddH(i+vec3(0,0,1)), ddH(i+vec3(1,0,1)), f.x), mix(ddH(i+vec3(0,1,1)), ddH(i+vec3(1,1,1)), f.x), f.y), f.z); }`;

// o: { rmt: köşe verisinden pürüzlülük/metallik/doku ağırlığı ve ışıma · fx: { dissolve, flash, glow } ortak değerleri
//      wind: 'flagX' (direğe bağlı, u ile artar) | 'flagY' (asılı, aşağı doğru artar) | 'sway' (ağaç, çimen: yükseklikle artar) }
export function patchStd(m, o = {}) {
  const key = `dd:${o.rmt ? 'r' : ''}${o.fx ? 'f' : ''}${o.wind || ''}${o.swayK || ''}`;
  m.customProgramCacheKey = () => key;
  m.userData.dd = key; // eklenmiş malzeme (ikinci kez eklenmez)
  m.onBeforeCompile = sh => {
    let vs = sh.vertexShader, fs = sh.fragmentShader;
    if (o.fx) {
      sh.uniforms.ddDissolve = o.fx.dissolve; sh.uniforms.ddFlash = o.fx.flash; sh.uniforms.ddGlow = o.fx.glow;
      fs = fs.replace('#include <common>', `#include <common>\nuniform float ddDissolve; uniform float ddFlash; uniform float ddGlow;\n${NOISE}`)
        .replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\nfloat ddn = 1.0; if (ddDissolve > 0.0) { ddn = ddN(vViewPosition * 7.0); if (ddn < ddDissolve) discard; }')
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>\ntotalEmissiveRadiance *= ddGlow; totalEmissiveRadiance += vec3(1.0, 0.12, 0.08) * ddFlash;
          if (ddDissolve > 0.0) totalEmissiveRadiance += vec3(1.0, 0.5, 0.14) * 6.0 * smoothstep(ddDissolve + 0.12, ddDissolve, ddn);`);
    }
    if (o.rmt) {
      vs = vs.replace('#include <common>', '#include <common>\nattribute vec3 rmt; attribute vec3 em; varying vec3 vRmt; varying vec3 vEm;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvRmt = rmt; vEm = em;');
      fs = fs.replace('#include <common>', '#include <common>\nvarying vec3 vRmt; varying vec3 vEm;')
        .replace('#include <map_fragment>', '#ifdef USE_MAP\n diffuseColor.rgb *= mix(vec3(1.0), texture2D(map, vMapUv).rgb, vRmt.z);\n#endif')
        .replace('#include <roughnessmap_fragment>', 'float roughnessFactor = vRmt.x;')
        .replace('#include <metalnessmap_fragment>', 'float metalnessFactor = vRmt.y;')
        .replace('#include <bumpmap_pars_fragment>', THREE.ShaderChunk.bumpmap_pars_fragment.replace(/bumpScale \* texture2D/g, 'bumpScale * vRmt.z * texture2D'))
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += vEm;');
    }
    if (o.wind) {
      sh.uniforms.ddT = wind.t; sh.uniforms.ddW = wind.k;
      const move = o.wind === 'flagX' ? 'float ddA = uv.x; transformed.z += (sin(position.x * 4.5 - ddT * 4.2 * ddW) * 0.11 + sin(position.y * 6.0 + ddT * 2.3) * 0.03) * ddA * (0.6 + 0.4 * ddW); transformed.y -= ddA * ddA * 0.06;'
        : o.wind === 'flagY' ? 'float ddA = 1.0 - uv.y; transformed.z += (sin(position.y * 3.5 + ddT * 2.6 * ddW + position.x * 2.0) * 0.09 + sin(ddT * 1.3 + position.x * 5.0) * 0.03) * ddA * (0.6 + 0.4 * ddW);'
        : `float ddP = 0.0;
          #ifdef USE_INSTANCING
            ddP = instanceMatrix[3].x * 0.7 + instanceMatrix[3].z * 0.45;
          #endif
          float ddA = max(0.0, position.y) * ${(o.swayK || 0.035).toFixed(4)} * ddW; transformed.x += sin(ddT * 1.5 * ddW + ddP) * ddA; transformed.z += cos(ddT * 1.1 * ddW + ddP * 1.3) * ddA * 0.7;`;
      vs = vs.replace('#include <common>', '#include <common>\nuniform float ddT; uniform float ddW;').replace('#include <begin_vertex>', `#include <begin_vertex>\n${move}`);
    }
    sh.vertexShader = vs; sh.fragmentShader = fs;
  };
  return m;
}

// ---------- Batch ----------
const _c = new THREE.Color(), _e = new THREE.Color(), _v = new THREE.Vector3(), _n = new THREE.Vector3(), _nm = new THREE.Matrix3(), _I = new THREE.Matrix4();
// Standart malzemeden parça özellikleri (koddan üretilen karakterin malzemeleri böyle köşe verisine çevrilir)
export const partOf = m => ({ vc: !!m.vertexColors, color: m.color, rough: m.roughness, metal: m.metalness, tex: m.map || m.bumpMap ? 1 : 0, emissive: m.emissive, emI: m.emissiveIntensity });
export class Batch {
  constructor() { this.pos = []; this.nor = []; this.col = []; this.rmt = []; this.em = []; this.uv = []; this.idx = []; this.n = 0; }
  // geo değiştirilmez. o: { color, rough, metal, tex (doku ağırlığı 0-1), emissive, emI, grad (dikey geçiş), under (alttan kararma),
  //   base (bu yüksekliğin altı kararır: zemine değen kenar), jitter (parça başına ton oynaması) }
  add(geo, matrix, o = {}) {
    const m = matrix || _I, P = geo.attributes.position, N = geo.attributes.normal, U = geo.attributes.uv, I = geo.index, n0 = this.n;
    const VC = o.vc ? geo.attributes.color : null; // malzemesi köşe rengi kullanan parça (hazır GLB silahlar): köşe rengi korunur
    const flip = m.determinant() < 0, grad = o.grad ?? 0, under = o.under ?? 0, j = 1 + (Math.random() - 0.5) * 2 * (o.jitter ?? 0);
    _nm.getNormalMatrix(m);
    _c.set(o.color ?? 0xffffff); _e.set(o.emissive ?? 0x000000).multiplyScalar(o.emissive !== undefined ? (o.emI ?? 1) : 0);
    let y0 = Infinity, y1 = -Infinity;
    for (let i = 0; i < P.count; i++) { _v.fromBufferAttribute(P, i).applyMatrix4(m); this.pos.push(_v.x, _v.y, _v.z); if (_v.y < y0) y0 = _v.y; if (_v.y > y1) y1 = _v.y; }
    const span = Math.max(1e-4, y1 - y0);
    for (let i = 0; i < P.count; i++) {
      if (N) _n.fromBufferAttribute(N, i).applyMatrix3(_nm).normalize(); else _n.set(0, 1, 0);
      this.nor.push(_n.x, _n.y, _n.z);
      const y = this.pos[(n0 + i) * 3 + 1];
      let k = j * (1 - grad + grad * 1.7 * (y - y0) / span) * (1 - under * (0.5 - 0.5 * _n.y));
      if (o.base !== undefined && y < o.base) k *= 0.62 + 0.38 * Math.max(0, y / o.base);
      if (VC) this.col.push(_c.r * k * VC.getX(i), _c.g * k * VC.getY(i), _c.b * k * VC.getZ(i));
      else this.col.push(_c.r * k, _c.g * k, _c.b * k);
      this.rmt.push(o.rough ?? 0.85, o.metal ?? 0, o.tex ?? 0);
      this.em.push(_e.r, _e.g, _e.b);
      if (U) this.uv.push(U.getX(i), U.getY(i)); else this.uv.push(0, 0);
    }
    const tri = (a, b, c) => (flip ? this.idx.push(n0 + a, n0 + c, n0 + b) : this.idx.push(n0 + a, n0 + b, n0 + c));
    if (I) for (let i = 0; i < I.count; i += 3) tri(I.getX(i), I.getX(i + 1), I.getX(i + 2));
    else for (let i = 0; i < P.count; i += 3) tri(i, i + 1, i + 2);
    this.n += P.count;
    return this;
  }
  get empty() { return this.n === 0; }
  geometry() {
    const g = new THREE.BufferGeometry(), f = (a, n) => new THREE.BufferAttribute(new Float32Array(a), n);
    g.setAttribute('position', f(this.pos, 3)); g.setAttribute('normal', f(this.nor, 3)); g.setAttribute('color', f(this.col, 3));
    g.setAttribute('rmt', f(this.rmt, 3)); g.setAttribute('em', f(this.em, 3)); g.setAttribute('uv', f(this.uv, 2));
    g.setIndex(this.n > 65535 ? new THREE.BufferAttribute(new Uint32Array(this.idx), 1) : new THREE.BufferAttribute(new Uint16Array(this.idx), 1));
    return g;
  }
  build(material, { cast = true, receive = true } = {}) {
    const mesh = new THREE.Mesh(this.geometry(), material);
    mesh.castShadow = cast; mesh.receiveShadow = receive;
    return mesh;
  }
}
// Batch'in malzemesi: beyaz taban, köşe rengi; pürüzlülük/metallik/ışıma köşe verisinden
export function batchMaterial(extra = {}, patch = {}) {
  return patchStd(new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 1, metalness: 0, emissive: 0x000000, ...extra }), { rmt: true, ...patch });
}

// Eklemli modelin parçalarını eklem başına tek ağda topla. joints: hareket eden düğümler; keep(mesh) → olduğu gibi kalsın mı.
// style: parçalara pişirilecek gölgeleme ({ grad, under, base, jitter }) ya da eklemden bunu veren işlev.
// Dönen: eklenen ağların listesi (geometrileri karaktere aittir; karakter bırakılırken silinir).
const _rel = new THREE.Matrix4(), _inv = new THREE.Matrix4();
export function bakeRigid(root, joints, material, keep = () => false, style = {}) {
  root.updateMatrixWorld(true);
  const set = new Set(joints), batches = new Map(), gone = [], kept = new Set();
  root.traverse(o => {
    if (!o.isMesh) return;
    if (!o.material?.isMeshStandardMaterial || o.material.transparent || keep(o)) { kept.add(o.geometry); return; }
    let j = o.parent; while (j && !set.has(j)) j = j.parent;
    if (!j) { kept.add(o.geometry); return; }
    if (!batches.has(j)) batches.set(j, new Batch());
    _rel.copy(_inv.copy(j.matrixWorld).invert()).multiply(o.matrixWorld);
    batches.get(j).add(o.geometry, _rel, { ...partOf(o.material), ...(typeof style === 'function' ? style(j) : style) });
    gone.push(o);
  });
  for (const o of gone) { o.parent.remove(o); if (!kept.has(o.geometry)) o.geometry.dispose(); }
  const out = [];
  for (const [j, b] of batches) { const m = b.build(material, { cast: true, receive: false }); j.add(m); out.push(m); }
  return out;
}

// ---------- Zemin lekesi ----------
// Birimlerin ve binaların altındaki yumuşak koyuluk: Düşük kademede gölgenin yerini tutar, öbür kademelerde cismi yere oturtur.
let _blobTex, _blobGeo;
export function blobTex() {
  if (_blobTex) return _blobTex;
  const cv = document.createElement('canvas'); cv.width = cv.height = 64;
  const x = cv.getContext('2d'), g = x.createRadialGradient(32, 32, 2, 32, 32, 32);
  g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.45, 'rgba(0,0,0,0.62)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  return (_blobTex = new THREE.CanvasTexture(cv));
}
export const blobGeo = () => (_blobGeo ||= new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2));
export const blobMaterial = opacity => new THREE.MeshBasicMaterial({ map: blobTex(), color: 0x000000, transparent: true, opacity, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, toneMapped: false });
// Çok sayıda leke tek çizim çağrısıyla: spots = [[x, z, genişlik, derinlik, y?], ...]
export function blobField(spots, opacity = 0.5) {
  const im = new THREE.InstancedMesh(blobGeo(), blobMaterial(opacity), spots.length), m = new THREE.Matrix4(), q = new THREE.Quaternion();
  spots.forEach(([x, z, w, d, y = 0.03], i) => { m.compose(_v.set(x, y, z), q, _n.set(w, 1, d)); im.setMatrixAt(i, m); });
  im.renderOrder = 1; im.frustumCulled = false;
  return im;
}

// ---------- Alev ----------
// Gürültüyle yükselen alev kılıfı (meşale, mangal, ocak, artılı silah): tek açık silindir, toplamalı karışım
const FLAME_FRAG = `varying vec2 vUv; uniform float t; uniform vec3 col; uniform float seed; uniform float gain;
  float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
  float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
    return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
  void main(){
    vec2 u = vec2(vUv.x * 8.0 + seed, vUv.y * 5.0 - t * 2.6);
    float f = n(u) * 0.55 + n(u * 2.1 + 3.0) * 0.3 + n(u * 4.3 - t) * 0.15;
    float a = smoothstep(0.38, 0.85, f) * smoothstep(0.0, 0.18, vUv.y) * smoothstep(1.0, 0.7, vUv.y) * gain;
    gl_FragColor = vec4(col * (1.2 + f * 2.0) * a, a);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;
export function flameMaterial(color, gain = 1) {
  return new THREE.ShaderMaterial({
    uniforms: { t: wind.t, col: { value: new THREE.Color(color) }, seed: { value: Math.random() * 10 }, gain: { value: gain } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: FLAME_FRAG, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  });
}
// Eşsiz silahın ışık süzmesi: silah boyunca ağır ağır yürüyen ince parlak bant ve ardından gelen silik ikinci bant
export function shimmerMaterial(color) {
  return new THREE.ShaderMaterial({
    uniforms: { t: wind.t, col: { value: new THREE.Color(color) }, seed: { value: Math.random() * 6 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `varying vec2 vUv; uniform float t; uniform vec3 col; uniform float seed;
      void main(){
        float p = fract(t * 0.42 + seed), y = vUv.y + sin(vUv.x * 6.2832) * 0.05;
        float band = smoothstep(0.09, 0.0, abs(y - p * 1.4 + 0.2)) + 0.35 * smoothstep(0.05, 0.0, abs(y - p * 1.4 + 0.42));
        float tw = 0.5 + 0.5 * sin(t * 9.0 + vUv.x * 40.0 + seed * 7.0);
        float a = band * (0.7 + 0.3 * tw) * smoothstep(0.0, 0.08, vUv.y) * smoothstep(1.0, 0.9, vUv.y);
        gl_FragColor = vec4(mix(col, vec3(1.0), 0.55) * 2.6 * a, a);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  });
}

// Geçit: ağır ağır dönen girdap (Kapı'nın içi). Ortası ışır, kenara doğru koyulaşır; tek düzlem, doku yok.
export function portalMaterial(color) {
  return new THREE.ShaderMaterial({
    uniforms: { t: wind.t, col: { value: new THREE.Color(color) } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `varying vec2 vUv; uniform float t; uniform vec3 col;
      void main(){
        vec2 u = vUv - 0.5; float r = length(u) * 2.0, a = atan(u.y, u.x), core = smoothstep(1.0, 0.0, r);
        float arms = 0.5 + 0.5 * sin(a * 3.0 + r * 8.0 - t * 1.6), fine = 0.5 + 0.5 * sin(a * 7.0 - r * 15.0 + t * 0.9);
        vec3 c = col * (0.28 + 1.1 * arms * core + 0.25 * fine * (1.0 - core)) + vec3(0.75, 0.9, 1.0) * pow(core, 4.0) * 0.45;
        c += col * smoothstep(0.16, 0.0, abs(r - 0.9)) * 0.9; // kenar halkası
        gl_FragColor = vec4(c, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
}

// ---------- Havada süzülen parçacıklar ----------
// Ateş böceği, polen, kor, yaprak: konum gölgelendiricide hesaplanır (kare başına işlemci yükü yok).
//  o: { count, color, color2, size, area: [genişlik, yükseklik, derinlik], center: [x, y, z], rise (yukarı hız; eksi: düşer),
//       drift (rüzgârla yatay hız), sway (salınım), twinkle (göz kırpma 0-1), leaf (elips, dönerek düşer), additive, opacity }
export function driftPoints(o) {
  const N = o.count, pos = new Float32Array(N * 3), seed = new Float32Array(N * 3), [w, h, d] = o.area;
  for (let i = 0; i < N; i++) { pos[i * 3] = (Math.random() - 0.5) * w; pos[i * 3 + 1] = Math.random() * h; pos[i * 3 + 2] = (Math.random() - 0.5) * d; seed[i * 3] = Math.random(); seed[i * 3 + 1] = Math.random(); seed[i * 3 + 2] = Math.random(); }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('seed', new THREE.BufferAttribute(seed, 3));
  const mat = new THREE.ShaderMaterial({
    uniforms: { t: wind.t, wk: wind.k, c1: { value: new THREE.Color(o.color) }, c2: { value: new THREE.Color(o.color2 ?? o.color) }, size: { value: o.size ?? 0.12 }, px: { value: 400 },
      box: { value: new THREE.Vector3(w, h, d) }, mv: { value: new THREE.Vector3(o.drift ?? 0, o.rise ?? 0, o.sway ?? 0.3) }, tw: { value: o.twinkle ?? 0 }, leaf: { value: o.leaf ? 1 : 0 }, gain: { value: o.gain ?? 1 }, opacity: { value: o.opacity ?? 1 } },
    vertexShader: `attribute vec3 seed; uniform float t, wk, size, px, tw, leaf; uniform vec3 box, mv; uniform vec3 c1, c2; varying vec3 vC; varying float vA; varying float vR;
      void main(){
        vec3 p = position; float ph = seed.x * 6.2832;
        p.y = mod(p.y + mv.y * t * (0.6 + seed.y * 0.8), box.y);
        p.x += mv.x * t * wk * (0.6 + seed.z * 0.8) + sin(t * (0.5 + seed.y) + ph) * mv.z;
        p.z += cos(t * (0.4 + seed.z * 0.6) + ph * 1.7) * mv.z;
        p.x = mod(p.x + box.x * 0.5, box.x) - box.x * 0.5;
        float edge = smoothstep(0.0, 0.12, p.y / box.y) * smoothstep(1.0, 0.8, p.y / box.y);
        vA = edge * (1.0 - tw * (0.5 + 0.5 * sin(t * (2.0 + seed.z * 3.0) + ph)));
        vC = mix(c1, c2, seed.z); vR = t * (1.5 + seed.y * 2.5) + ph;
        vec4 q = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * q;
        gl_PointSize = max(1.0, size * (0.6 + seed.y * 0.8) * (1.0 + leaf) * px * projectionMatrix[1][1] / -q.z);
      }`,
    fragmentShader: `uniform float leaf, gain, opacity; varying vec3 vC; varying float vA; varying float vR;
      void main(){
        vec2 u = gl_PointCoord - 0.5; float a;
        if (leaf > 0.5) { float c = cos(vR), s = sin(vR); vec2 r = vec2(u.x * c - u.y * s, u.x * s + u.y * c) * 1.5; r.y *= 2.2 + 1.2 * sin(vR * 0.7); a = smoothstep(0.5, 0.4, length(r)); }
        else { float d = length(u) * 2.0; a = smoothstep(1.0, 0.0, d); a *= a; }
        a *= vA * opacity; if (a < 0.004) discard;
        gl_FragColor = vec4(vC * gain, a);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    transparent: true, depthWrite: false, blending: o.additive === false ? THREE.NormalBlending : THREE.AdditiveBlending,
  });
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false; pts.renderOrder = 6;
  if (o.center) pts.position.set(...o.center);
  pts.onBeforeRender = r => { mat.uniforms.px.value = r.getDrawingBufferSize(_px).y * 0.5; };
  return pts;
}
const _px = new THREE.Vector2();

// Nesnenin geometri, malzeme, gölge haritası ve (yalnızca kendisine ait olarak işaretlenmiş) dokularını bırak
export function disposeTree(root) {
  root.traverse(o => {
    o.geometry?.dispose?.();
    if (o.isInstancedMesh) o.dispose();
    if (o.isLight) o.dispose?.(); // gölge haritası (ana ışığınki onlarca MB'tır) ışıkla birlikte bırakılır
    for (const m of (Array.isArray(o.material) ? o.material : o.material ? [o.material] : [])) {
      for (const k of ['map', 'bumpMap', 'emissiveMap']) if (m[k]?.userData.own) m[k].dispose();
      m.dispose();
    }
  });
}
