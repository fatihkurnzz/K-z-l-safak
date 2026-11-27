// 3B Savaş Faz 1 · gerçek 3B savaş birimi (Opus, 27.11)
// İskeletli glTF modeli + ortak 11 klip + soketlere takılan silah/kalkan. combat.js'in savaş birimlerinden beklediği
// arayüzün AYNISINI taşır (models.js Character, skinned.js SkinnedCharacter, savas-birim2d.js Birim2D ile değiştirilebilir):
//   alanlar : root, pos, scale, fx, weaponKind, dead, combatTarget, arcTint
//   konum   : headPos/headTo, chestPos/chestTo, handPos, face(v)
//   hareket : moveTo, swing, whirl, castSpell, raiseArms, shoot, stomp, hit, die, revive, cheer
//   döngü   : update(dt, t), dispose()
// Yalnız çizimdir: savaş olayları combat.js'ten gelir; birim hiçbir savaş durumunu değiştirmez.
import { THREE, tween, wait, ease, to, gfx, camRig, hitStop, selfLitK } from '../engine3d.js';
import * as SkeletonUtils from '../../vendor/three/examples/jsm/utils/SkeletonUtils.js';
import { swingArc, whirlRing, play as fxPlay } from '../fx.js';
import { EVENT_FX } from '../fx-table.js';
import { manifest, dosyaHazir, klipler, zeminEgrileri } from './varlik3d.js';
import { egriOku } from './zemin3d.js';
import { silahYap, silahSil, FX_TUR } from './silah3d.js';

const BOY = 2.3; // ölçek 1'deki boy (prosedürel kahramanla ve 2B birimle aynı kadraj)
const DARBE = { attack: 0.45, special: 0.55, cast: 0.55, cast2: 0.5, shoot: 0.6 }; // klipte vuruş anı (oran)
const V0 = new THREE.Vector3();

// ---- Malzeme: PBR + kenar ışığı (boyalı arka plandan ayrışsın), vurulma parlaması, erime (ölüm) ----
// Gölgelendirici eki bütün 3B birimlerde aynıdır (program önbelleği tek): değerler birim başına uniform.
function malzemeYama(m, U) {
  m.onBeforeCompile = s => {
    Object.assign(s.uniforms, U);
    s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vB3dW;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvB3dW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    s.fragmentShader = s.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vB3dW;\nuniform float uFlash, uErime, uKendi, uKenarG;\nuniform vec3 uKenar;')
      .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
  float b3dN = fract(sin(dot(floor(vB3dW * 22.0), vec3(12.9898, 78.233, 45.164))) * 43758.5453);
  if (b3dN < uErime) discard;`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
  { vec3 b3dV = normalize(vViewPosition); float fr = pow(1.0 - clamp(dot(normal, b3dV), 0.0, 1.0), 2.6);
    totalEmissiveRadiance += uKenar * fr * uKenarG + diffuseColor.rgb * uKendi + vec3(1.0, 0.18, 0.12) * uFlash * 0.9;
    if (uErime > 0.0 && b3dN < uErime + 0.08) totalEmissiveRadiance += vec3(2.2, 0.8, 0.2); }`);
  };
  m.customProgramCacheKey = () => 'b3d-v1';
  return m;
}
function pbr(kaynak, ayar, U, ton) {
  const s = new THREE.MeshStandardMaterial({
    map: kaynak.map || null, normalMap: kaynak.normalMap || null,
    color: kaynak.color ? kaynak.color.clone() : new THREE.Color(1, 1, 1),
    metalness: ayar.metal ?? 0.3, roughness: ayar.puruz ?? 0.6, envMapIntensity: ayar.ortam ?? 1,
    transparent: false, alphaTest: kaynak.alphaTest || (kaynak.transparent ? 0.5 : 0), side: kaynak.side ?? THREE.FrontSide,
  });
  if (s.map) s.map.colorSpace = THREE.SRGBColorSpace;
  if (s.normalMap && ayar.normal != null) s.normalScale.setScalar(ayar.normal);
  s.color.multiplyScalar(ayar.parlak ?? 1);
  if (ton) s.color.multiply(new THREE.Color(ton));
  s.name = 'b3d:' + (kaynak.name || 'govde');
  return malzemeYama(s, U);
}

export class Birim3D {
  /** ad: manifest model adı · kayit: birim kaydı (birimler[...]) · unit: savaş birimi (yalnız okunur) · look: combat görünüşü */
  constructor(ad, kayit, unit = {}, look = {}) {
    const MN = manifest(), K = this.K = MN.modeller[ad], varlik = dosyaHazir(K.dosya);
    if (!varlik) throw new Error('b3d: model inmedi ' + ad);
    this.ad = ad; this.kayit = kayit; this.unit = unit;
    this.dead = false; this.flash = 0; this.deathN = 0; this.combatTarget = 0; this.arcTint = 0;
    this.fx = look.fx || 0; this.wt = unit.wt;
    this.root = new THREE.Group(); this.root.name = 'b3d:' + ad;
    this.scale = (look.scale || 1) * (kayit.olcek || 1) * (K.olcek || 1);

    // gövde: iskeleti kopyala (geometri ve dokular ortak), boyu normalize et
    const m = this.model = SkeletonUtils.clone(varlik.scene);
    m.updateMatrixWorld(true);
    const kutu = new THREE.Box3().setFromObject(m), k = (K.boy || BOY) / Math.max(1e-3, kutu.max.y - kutu.min.y);
    m.scale.multiplyScalar(k); m.position.y = this.y0 = -kutu.min.y * k; m.updateMatrixWorld(true);
    this.boy = K.boy || BOY;
    this.egri = zeminEgrileri(ad); this.kaldir = 0; // R3 zemin teması (zemin3d.js)

    // malzemeler: birim başına (vurulma/erime uniform'ları birime özel)
    const U = this.U = { uFlash: { value: 0 }, uErime: { value: 0 }, uKendi: { value: 0 }, uKenar: { value: new THREE.Color(K.malzeme?.kenarRenk || 0x9fb8ff) }, uKenarG: { value: K.malzeme?.kenar ?? 0.35 } };
    const ayar = { ...(K.malzeme || {}), ...(kayit.malzeme || {}) };
    this.mats = []; this.kendiBaz = ayar.kendi ?? 0.12;
    // Gölge bütçesi: Yüksek kademede her birim; Orta kademede en çok 4 birimlik savaşta (4v4 ve kalabalıkta zemin lekesi).
    // Gerçek gölge varken zemin lekesi (world.js blob) gizlenir.
    const golge = this.golge = gfx.T.shadow > 0 && (gfx.tier === 'high' || (look.b3dSayi || 0) <= 4);
    this.kendiGolge = golge;
    m.traverse(o => {
      if (!o.isMesh) return;
      o.castShadow = golge; o.receiveShadow = false; o.frustumCulled = false;
      const cevir = mt => { const p = pbr(mt, ayar, U, kayit.ton); this.mats.push(p); return p; };
      o.material = Array.isArray(o.material) ? o.material.map(cevir) : cevir(o.material);
    });

    // kemikler ve soketler
    const bul = ad => { if (!ad) return null; let b = null; const re = new RegExp(ad.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i'); m.traverse(o => { if (!b && o.isBone && re.test(o.name)) b = o; }); return b; };
    this.kemik = { bas: bul(K.kemik?.bas || 'Head'), gogus: bul(K.kemik?.gogus || 'Spine2') || bul('Spine1') || bul('Spine'), sag: bul(K.soket?.sag?.kemik || 'RightHand'), sol: bul(K.soket?.sol?.kemik || 'LeftHand') };
    this.soket = {};
    for (const yan of ['sag', 'sol']) {
      const S = K.soket?.[yan], b = this.kemik[yan]; if (!S || !b) continue;
      this.soket[yan] = this.soketKur(b, 'sok_' + yan, S.donus || [0, 0, 0], S.konum || [0, 0, 0]);
    }
    // silah / kalkan: modelin kendi silahı varsa (govdeSilahli) takılmaz; birim kaydı "sag": false ile de kapatılır
    this.silahlar = [];
    const sagT = kayit.sag ?? (K.govdeSilahli ? null : 'kilic'), solT = kayit.sol ?? null;
    const halk = unit.faction || unit.model?.faction || kayit.halk;
    if (sagT && this.soket.sag) { const g = silahYap(sagT, { renk: kayit.tas, halk }); if (g) { this.soket.sag.add(g); this.silahlar.push(g); this.silah = g; } }
    if (solT && this.soket.sol) { const g = silahYap(solT, { renk: kayit.tas, halk }); if (g) {
      // kalkan ön kola ayrı soketle takılır (yüz elin sırtı yönünde dışa, boy ekseni ön kol boyunca; STANDART §5)
      const Q = solT === 'kalkan' && K.soket.sol.kalkan; const s = Q ? this.soketKur(this.kemik.sol, 'sok_kalkan', Q.donus || [0, 0, 0], Q.konum || [0, 0, 0]) : this.soket.sol;
      s.add(g); this.silahlar.push(g); } }
    this.weaponKind = kayit.fxTur || FX_TUR[sagT] || K.fxTur || 'sword';

    // animasyon
    this.mixer = new THREE.AnimationMixer(m);
    this.actions = {};
    for (const [isim, clip] of Object.entries(klipler(ad))) this.actions[isim] = this.mixer.clipAction(clip);
    this.darbe = { ...DARBE, ...(K.darbe || {}) };
    this.mixer.addEventListener('finished', e => { if (e.action === this.current && !this.dead) this.idle(0.25); });

    this.root.add(m);
    this.root.scale.setScalar(this.scale);
    this.idle(0);
    this.mixer.update(Math.random() * 1.5); // aynı türden birimler aynı karede nefes almasın
  }

  // Soket: kemiğe bağlı boş düğüm. Yön ve konum, modelin dinlenme (T) pozundaki MODEL UZAYINDA verilir (kemiğin kendi
  // ekseninden bağımsız) → aynı soket ayarı her mixamorig modelinde aynı sonucu verir.
  soketKur(kemik, ad, donus, konum) {
    const ws = new THREE.Vector3(), wq = new THREE.Quaternion();
    kemik.getWorldScale(ws); kemik.getWorldQuaternion(wq);
    const ters = wq.clone().invert(), s = new THREE.Group(); s.name = ad;
    s.scale.setScalar(1 / ws.x);
    s.quaternion.copy(ters).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(...donus)));
    s.position.copy(new THREE.Vector3(...konum).applyQuaternion(ters).divideScalar(ws.x));
    kemik.add(s);
    return s;
  }

  // ---- animasyon ----
  idleName() { return this.combatTarget && this.actions.combatIdle ? 'combatIdle' : 'idle'; }
  idle(fade = 0.25) { this.play(this.idleName(), { loop: true, fade }); }
  play(isim, { loop = false, fade = 0.12, speed = 1 } = {}) {
    const a = this.actions[isim]; if (!a) return null;
    if (loop && this.current === a) return a;
    a.reset(); a.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity); a.clampWhenFinished = !loop; a.timeScale = speed; a.play();
    if (this.current && this.current !== a) a.crossFadeFrom(this.current, fade, false);
    this.current = a;
    return a;
  }
  async act(adlar, yedek = 0.3) {
    const n = adlar.find(x => this.actions[x]), a = n && this.play(n, { fade: 0.1, speed: this.K.hiz?.[n] || 1 });
    if (!a) return wait(yedek);
    await wait(a.getClip().duration * (this.darbe[n] ?? 0.5) / a.timeScale);
  }

  update(dt, t) {
    this.mixer.update(dt);
    // zemin teması: etkin eylemlerin kaldırma eğrileri ağırlıklarıyla karışır (geçişte sıçrama yok; ölüm eğrisizdir)
    let l = 0;
    for (const isim in this.actions) { const a = this.actions[isim], e = this.egri[isim]; if (!e || !a.isRunning()) continue; const w = a.getEffectiveWeight(); if (w > 0) l += w * egriOku(e, a.time); }
    if (l !== this.kaldir) { this.kaldir = l; this.model.position.y = this.y0 + l * this.boy; }
    if (this.combatTarget && !this.dead && this.current === this.actions.idle && this.actions.combatIdle) this.idle(0.4);
    this.U.uKendi.value = this.kendiBaz * selfLitK();
    if (this.flash > 0) { this.flash = Math.max(0, this.flash - dt * 4); this.U.uFlash.value = this.flash; }
  }

  // ---- konum ----
  get pos() { return this.root.position; }
  kemikDunya(b, yedekY, v) { if (b) return b.getWorldPosition(v); return v.copy(this.root.position).setY(this.root.position.y + yedekY * this.scale); }
  headTo(v) { this.kemikDunya(this.kemik.bas, 2.0, v); v.y += 0.42 * this.scale; return v; }
  chestTo(v) { return this.kemikDunya(this.kemik.gogus, 1.45, v); }
  headPos() { return this.headTo(new THREE.Vector3()); }
  chestPos() { return this.chestTo(new THREE.Vector3()); }
  handPos() { const v = new THREE.Vector3(); const s = this.silah?.userData?.isik || this.silah || this.soket.sag; if (s) return s.getWorldPosition(v); return this.chestTo(v); }
  face(target) { this.root.rotation.y = Math.atan2(target.x - this.pos.x, target.z - this.pos.z); }

  // ---- savaş hareketleri (combat.js çağırır) ----
  async moveTo(target, dur = 0.35) {
    this.face(target);
    if (target.distanceTo(this.pos) > 0.3) this.play('run', { loop: true, fade: 0.1, speed: 1.15 });
    const from = this.pos.clone();
    await tween(dur, k => this.pos.lerpVectors(from, target, k), ease.inOut);
    if (!this.dead) this.idle(0.15);
  }
  async swing() { await this.act(['attack']); swingArc(this, this.arcTint || 0); }
  async whirl() { const bitir = whirlRing(this, this.arcTint || 0xdde6ff); await this.act(['special', 'attack']); bitir(); }
  async castSpell() { this.isikla(); await this.act(['cast', 'attack']); }
  async raiseArms() { this.isikla(); await this.act(['cast2', 'cast']); }
  async shoot() { await this.act(['shoot', 'cast', 'attack']); }
  async stomp() { await this.act(['special', 'attack']); camRig.shake = Math.max(camRig.shake, 0.25); }
  isikla() { const t = this.silah?.userData?.isik; if (t) { t.scale.setScalar(1.8); to(t.scale, { x: 1, y: 1.5, z: 1 }, 0.6, ease.out); } }
  hit(from, heavy = false) {
    if (this.dead) return;
    this.flash = 1;
    const ev = this.pos.clone(), yon = from ? this.pos.clone().sub(from).setY(0).normalize() : new THREE.Vector3();
    const k = (heavy ? 0.45 : 0.22) / this.scale;
    if (heavy) { hitStop(0.06); camRig.shake = Math.max(camRig.shake, 0.18); }
    tween(0.08, e => this.pos.copy(ev).addScaledVector(yon, k * e), ease.out).then(() => tween(0.3, e => this.pos.copy(ev).addScaledVector(yon, k * (1 - e)), ease.inOut));
    this.play('hit', { fade: 0.05 });
  }
  // Ölüm: düşüş klibi, sonra gövde korla parçalanarak erir. Arada diriltilirse erime yarıda kesilir.
  async die() {
    this.dead = true;
    const n = ++this.deathN, a = this.play('death', { fade: 0.1 });
    await wait(a ? a.getClip().duration * 0.85 : 0.6);
    if (n !== this.deathN) return;
    fxPlay(EVENT_FX.kill, this);
    this.root.traverse(o => { if (o.isMesh) o.castShadow = false; });
    await tween(0.9, e => { if (n === this.deathN) this.U.uErime.value = e * 1.02; });
    if (n === this.deathN) this.root.visible = false;
  }
  revive(face, home) {
    this.deathN++; this.dead = false; this.U.uErime.value = 0;
    this.root.visible = true; this.root.rotation.set(0, face, 0); if (home) this.pos.copy(home);
    const golge = this.golge; this.root.traverse(o => { if (o.isMesh && !o.name.startsWith('silah')) o.castShadow = golge && o.isSkinnedMesh; });
    this.idle(0.1);
  }
  cheer() { if (!this.dead) this.play('victory', { fade: 0.2 }); }
  relax() { } ready() { if (!this.dead) this.idle(0.2); }

  // Gövde geometrisi ve dokular kopyalar arasında ortaktır (silinmez). Birime ait olanlar: malzemeler, iskelet
  // (kemik dokusu GPU'da), silah geometrileri. Hepsi burada bırakılır → savaş sonrası bellek savaş öncesine döner.
  dispose() {
    this.mixer.stopAllAction(); this.mixer.uncacheRoot(this.model);
    this.root.parent?.remove(this.root);
    this.mats.forEach(m => m.dispose());
    const sk = new Set(); this.model.traverse(o => { if (o.isSkinnedMesh && o.skeleton) sk.add(o.skeleton); }); sk.forEach(s => s.dispose());
    this.silahlar.forEach(silahSil);
  }
}

/** Savaş birimi için 3B birim (world.js spawn çağırır). Kayıt yoksa null. Hata olursa null (çağıran 2B'ye döner). */
export function birim3dYap(unit, look, kayitAnahtari) {
  const k = kayitAnahtari(unit); if (!k) return null;
  try { return new Birim3D(k.model, k.kayit, unit, look); } catch (e) { console.warn('[b3d] birim kurulamadı, 2B:', k.anahtar, e?.message || e); return null; }
}
