// 3B Savaş Faz 1b · ek yetenek efektleri (Opus, 27.11)
// Kaynak: Gemini/Opus-01 SkillVFXManager. Değişenler:
//   - Geometriler bütün efektlerde ortak (her tetikte yeni geometri üretilmez → GC ve GPU yükleme yok).
//   - Yeni türler: ice, dark, heal (yerden yükselen halka + kıvılcım), buff (altın halka), death (kor dağılması),
//     shield (fresnel kabuk). Hepsi tek çizim çağrısı başına 1-3 ağ, en çok 12 eş zamanlı efekt.
//   - Azaltılmış hareket / yanıp sönme kapalı ayarında kıvılcım sayısı düşer (çağıran noFlash'ta tetiklemez).
// Yalnız görüntü: hiçbir savaş durumunu okumaz ya da yazmaz.
const RENK = { slash: 0xffd9a0, holy: 0x77d9ff, fire: 0xff6128, poison: 0x79e86c, ice: 0x9fe4ff, dark: 0xb07aff, shield: 0x72baff, heal: 0x6dff8a, buff: 0xffd36a, death: 0xff7a3a };
const MERMI = new Set(['fire', 'poison', 'holy', 'ice', 'dark']);
let G = null; // ortak geometriler
function geo(T) {
  return G ||= {
    halka: new T.RingGeometry(0.25, 0.34, 36).rotateX(-Math.PI / 2),
    cekirdek: new T.SphereGeometry(0.18, 12, 8),
    serit: new T.TorusGeometry(0.8, 0.055, 5, 28, 2.45),
    kabuk: new T.SphereGeometry(1.08, 24, 16),
    sutun: new T.CylinderGeometry(0.75, 0.9, 2.2, 24, 1, true).translate(0, 1.1, 0),
  };
}
let kabukM = null;
function kabukMalzeme(T) {
  return kabukM ||= new T.ShaderMaterial({
    uniforms: { tint: { value: new T.Color() }, alpha: { value: 0.7 } },
    vertexShader: 'varying vec3 n; varying vec3 v; void main(){vec4 p=modelViewMatrix*vec4(position,1.); n=normalize(normalMatrix*normal); v=normalize(-p.xyz); gl_Position=projectionMatrix*p;}',
    fragmentShader: 'uniform vec3 tint; uniform float alpha; varying vec3 n; varying vec3 v; void main(){float f=pow(1.-max(0.,dot(normalize(n),normalize(v))),2.4); gl_FragColor=vec4(tint,f*alpha);}',
    transparent: true, depthWrite: false, blending: T.AdditiveBlending,
  });
}

export class SkillVFXManager {
  constructor(THREE, scene, { reduced = false } = {}) { this.THREE = THREE; this.scene = scene; this.active = []; this.reduced = reduced; this.sayac = {}; }
  trigger(type, origin, target, { darbe: yalnizDarbe = false } = {}) {
    const T = this.THREE, g = geo(T);
    const vec = p => new T.Vector3(...(Array.isArray(p) ? p : [p.x, p.y, p.z]));
    if (!origin || !target) return;
    const o = vec(origin), t = vec(target);
    if (![o.x, o.y, o.z, t.x, t.y, t.z].every(Number.isFinite)) return;
    if (this.active.length >= 12) this.release(this.active.shift());
    this.sayac[type] = (this.sayac[type] || 0) + 1;
    const renk = RENK[type] ?? RENK.slash, grup = new T.Group(); grup.name = 'vfx3d:' + type;
    const kabuk = type === 'shield', mermi = MERMI.has(type) && !yalnizDarbe, yerde = type === 'heal' || type === 'buff', olum = type === 'death';
    const omur = kabuk ? 0.66 : yerde ? 0.9 : olum ? 1.0 : mermi ? 0.56 : 0.36, ucus = mermi ? 0.27 : 0;
    const mat = (c, op = 1) => new T.MeshBasicMaterial({ color: c, transparent: true, opacity: op, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false, side: T.DoubleSide });
    const darbeM = mat(renk, 0.74), izM = mat(0xffe9cc, 0.75);
    const merkez = (yerde ? t : t).clone(); merkez.y += yerde ? 0.1 : 0.75;
    const darbe = new T.Mesh(g.halka, darbeM); darbe.position.set(t.x, t.y + 0.07, t.z); grup.add(darbe);
    const cekirdek = new T.Mesh(g.cekirdek, izM); cekirdek.visible = false; grup.add(cekirdek);
    let kb = null, sut = null;
    if (kabuk) { kb = new T.Mesh(g.kabuk, kabukMalzeme(T).clone()); kb.material.uniforms.tint.value.setHex(renk); kb.scale.y = 1.18; kb.position.copy(o); kb.position.y += 1.04; grup.add(kb); }
    else if (yerde) { sut = new T.Mesh(g.sutun, mat(renk, 0.0)); sut.position.copy(t); grup.add(sut); }
    else if (!mermi && !olum) { const s = new T.Mesh(g.serit, izM); s.position.copy(merkez); s.rotation.set(0.45, 0.4, -0.6); grup.add(s); }
    const n = this.reduced ? 9 : olum ? 36 : 24, xyz = new Float32Array(n * 3);
    const kG = new T.BufferGeometry(); kG.setAttribute('position', new T.BufferAttribute(xyz, 3));
    const kM = new T.PointsMaterial({ color: renk, size: olum ? 0.1 : 0.085, transparent: true, depthWrite: false, opacity: 0, blending: T.AdditiveBlending, toneMapped: false });
    const kiv = new T.Points(kG, kM); kiv.frustumCulled = false; grup.add(kiv);
    const cik = o.clone(); cik.y += 1.05;
    const adim = yas => {
      const k = Math.min(1, yas / omur), p = Math.max(0, (yas - ucus) / (omur - ucus)), ilerle = ucus ? Math.min(1, yas / ucus) : 1;
      cekirdek.visible = mermi && ilerle < 1;
      if (cekirdek.visible) { cekirdek.position.copy(cik).lerp(merkez, ilerle); cekirdek.position.y += Math.sin(ilerle * Math.PI) * 0.55; cekirdek.scale.setScalar(1 + 0.35 * Math.sin(k * 10)); }
      darbe.visible = !kabuk && p > 0; darbe.scale.setScalar((yerde ? 2.2 : 0.6) + p * (yerde ? 1.2 : 2.7)); darbeM.opacity = 0.66 * (1 - p);
      izM.opacity = 0.64 * (1 - k);
      if (kb) kb.material.uniforms.alpha.value = 0.7 * (1 - k);
      if (sut) { sut.material.opacity = 0.32 * Math.sin(Math.PI * k); sut.scale.set(1 - 0.2 * k, 0.6 + k * 0.6, 1 - 0.2 * k); }
      for (let i = 0; i < n; i++) {
        const q = i * 2.39996, y = (i % 5) * 0.21;
        if (yerde) { const r = 0.7 * (1 - p * 0.3); xyz[3 * i] = t.x + Math.cos(q + p * 3) * r; xyz[3 * i + 1] = t.y + 0.1 + p * (1.2 + y * 3); xyz[3 * i + 2] = t.z + Math.sin(q + p * 3) * r; }
        else { const yay = p * (0.45 + (i % 6) * (olum ? 0.28 : 0.19)); xyz[3 * i] = merkez.x + Math.cos(q) * yay; xyz[3 * i + 1] = merkez.y + p * (0.45 + y) - p * p * (olum ? 0.2 : 0.54); xyz[3 * i + 2] = merkez.z + Math.sin(q) * yay; }
      }
      kG.attributes.position.needsUpdate = true; kM.opacity = p > 0 ? 0.93 * (1 - p) : 0;
    };
    adim(0); this.scene.add(grup); this.active.push({ grup, yas: 0, omur, adim, kG });
  }
  // Ortak geometriler bırakılmaz; efekte özgü malzemeler ve kıvılcım geometrisi bırakılır.
  release(e) {
    e.grup.removeFromParent();
    const ms = new Set(); e.grup.traverse(o => { if (o.material) ms.add(o.material); });
    ms.forEach(m => m.dispose()); e.kG.dispose(); e.grup.clear();
  }
  update(dt) {
    if (!Number.isFinite(dt) || dt < 0) return;
    for (let i = this.active.length - 1; i >= 0; i--) { const e = this.active[i]; e.yas += dt; if (e.yas >= e.omur) { this.active.splice(i, 1); this.release(e); } else e.adim(e.yas); }
  }
  dispose() { for (const e of this.active) this.release(e); this.active.length = 0; }
}
export const Vfx3D = SkillVFXManager;
