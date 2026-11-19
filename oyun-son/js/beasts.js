// İnsansı olmayan yaratık gövdeleri (VAHRAN, 18.11.2026): dört ayaklı, örümcek, akrep, kuş, böcek, sentor, yılan gövdeli
// ve ejderha. Hepsi prosedürel (koddan üretilir) ve WormCharacter ile aynı arayüzü taşır: savaş (combat.js) bu yöntemleri çağırır.
// look (shared/bestiary.js): kind, body, belly, eyes, fx, scale ve gövdeye özgü ekler (snout, tail, ears, mane, fangs, tusks,
// trunk, shell, spikes, wings, stingTail, legs, wing, beak, stripe, skin/armor/hair/weapon (sentor ve yılan gövdesinin insan üstü)).
import { THREE, scene, to, tween, ease } from './engine3d.js';
import { Mats, buildWeapon } from './models.js';
import { EVENT_FX } from './fx-table.js';
import { play as fxPlay } from './fx.js';

const V0 = new THREE.Vector3();
const mesh = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; return m; };
const sph = (r, w = 12, h = 10) => new THREE.SphereGeometry(r, w, h);
const cyl = (a, b, h, s = 8) => new THREE.CylinderGeometry(a, b, h, s);
const cone = (r, h, s = 6) => new THREE.ConeGeometry(r, h, s);
const shade = (hex, k) => new THREE.Color(hex).multiplyScalar(k).getHex();

// İki parçalı bacak: üst kök (kalça) ve alt parça (diz); p.swing ile ileri-geri, p.lift ile diz kırılır
function leg(M, mat, len, r, foot) {
  const hip = new THREE.Group(), up = mesh(cyl(r, r * 0.8, len * 0.55), mat, 0, -len * 0.27, 0), knee = new THREE.Group();
  knee.position.y = -len * 0.55; knee.add(mesh(cyl(r * 0.8, r * 0.55, len * 0.5), mat, 0, -len * 0.25, 0));
  if (foot) knee.add(mesh(sph(r * 0.9, 8, 6), foot, 0, -len * 0.5, r * 0.3));
  hip.add(up, knee); return { hip, knee };
}
// Eklemli zincir (kuyruk, boyun, hortum): her halka bir öncekine bağlı; bend ile kıvrılır
function chain(mat, n, len, r0, r1) {
  const root = new THREE.Group(); let cur = root; const links = [];
  for (let i = 0; i < n; i++) {
    const g = new THREE.Group(), r = r0 + (r1 - r0) * (i / Math.max(1, n - 1)), seg = len / n;
    g.add(mesh(cyl(r, r * 0.92, seg, 7).translate(0, seg / 2, 0), mat));
    if (i) g.position.y = len / n;
    cur.add(g); links.push(g); cur = g;
  }
  return { root, links, tip: cur, seg: len / n };
}

export class BeastCharacter {
  constructor(look = {}) {
    const M = this.M = new Mats(), L = this.look = look, kind = this.kind = look.kind || 'quad';
    this.fx = look.fx || look.eyes || 0xc8a060; this.auras = []; this.spinners = []; this.glowMeshes = []; this.deathN = 0;
    this.weaponKind = kind === 'centaur' && look.weapon === 'bow' ? 'bow' : 'club';
    this.scale = look.scale || 1; this.phase = Math.random() * 6;
    this.root = new THREE.Group(); this.root.scale.setScalar(this.scale);
    this.body = new THREE.Group(); this.root.add(this.body);
    this.legs = []; this.tails = []; this.wings = []; this.extraChains = [];
    this.pose = { walk: 0, lunge: 0, rear: 0, open: 0, shake: 0, cast: 0, fall: 0 };
    this.mBody = M.skin(look.body || 0x7a5a3a); this.mBelly = M.skin(look.belly || shade(look.body || 0x7a5a3a, 1.3));
    this.mHorn = M.leather(0xe8e0cc, { roughness: 0.35 }); this.mDark = M.basic(0x120808);
    this.mEye = M.glow(look.eyes || 0xffb02e, 2.4);
    ({ quad: () => this.buildQuad(), spider: () => this.buildSpider(), scorpion: () => this.buildScorpion(), bird: () => this.buildBird(),
       insect: () => this.buildInsect(), centaur: () => this.buildCentaur(), serpent: () => this.buildSerpent(), dragon: () => this.buildDragon() }[kind] || (() => this.buildQuad()))();
    this.root.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    this.jawBase = this.jaw ? this.jaw.rotation.x : 0;
    this.flash = 0; this.dead = false;
    this.update(0, 0);
  }
  // ---------- Gövdeler ----------
  // Dört ayaklı: gövde boyu ~1.4, omuz yüksekliği legH. Baş +z yönünde.
  buildQuad(opt = {}) {
    const L = this.look, M = this.M, legH = 0.5 * (L.legs || 1), len = opt.len || 1.4, girth = opt.girth || 0.42 * (L.tusks || L.shell ? 1.35 : 1);
    this.legH = legH;
    const torso = mesh(sph(1, 16, 12), this.mBody); torso.scale.set(girth, girth * 0.95, len * 0.55); this.body.add(torso);
    const belly = mesh(sph(1, 14, 8), this.mBelly, 0, -girth * 0.35, 0); belly.scale.set(girth * 0.8, girth * 0.55, len * 0.45); this.body.add(belly);
    this.body.position.y = legH + girth * 0.55;
    if (L.shell) { const sh = mesh(new THREE.SphereGeometry(1, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), M.leather(L.shell, { roughness: 0.8 })); sh.scale.set(girth * 1.25, girth * 1.15, len * 0.65); this.body.add(sh);
      for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2; const p = mesh(cyl(0.05, 0.08, 0.06, 6), M.leather(shade(L.shell, 0.7)), Math.cos(a) * girth * 0.6, girth * 0.95, Math.sin(a) * len * 0.3); this.body.add(p); } }
    if (L.mane) { const mm = M.leather(L.mane, { roughness: 0.9 }); for (let i = 0; i < 9; i++) { const sp = mesh(cone(0.07, 0.38, 5), mm, (i % 3 - 1) * 0.1, girth * 0.85, len * 0.45 - i * 0.07); sp.rotation.x = -0.9; this.body.add(sp); } }
    if (L.spikes) for (let i = 0; i < 6; i++) { const sp = mesh(cone(0.05, 0.25, 5), this.mHorn, 0, girth * 0.9, len * 0.3 - i * 0.14); sp.rotation.x = -0.4; this.body.add(sp); }
    // bacaklar
    const lr = 0.13 * (L.tusks || L.shell ? 1.6 : 1) * (girth / 0.42);
    for (const [x, z, ph] of [[1, 1, 0], [-1, 1, Math.PI], [1, -1, Math.PI], [-1, -1, 0]]) {
      const lg = leg(M, this.mBody, legH + girth * 0.4, lr, this.mBelly); lg.hip.position.set(x * girth * 0.62, legH + girth * 0.35, z * len * 0.36);
      this.root.add(lg.hip); this.legs.push({ ...lg, ph });
    }
    // boyun ve baş
    const neck = this.neck = new THREE.Group(); neck.position.set(0, girth * 0.35, len * 0.5); this.body.add(neck);
    const head = this.head = new THREE.Group(); head.position.set(0, girth * 0.25, 0.25); neck.add(head);
    const hr = girth * (opt.headK || 0.62);
    head.add(mesh(sph(hr, 14, 10), this.mBody));
    const sn = L.snout ?? 1; if (sn > 0) { const s = mesh(cyl(hr * 0.42, hr * 0.62, hr * 1.1 * sn, 10), this.mBody, 0, -hr * 0.15, hr * 0.75 + hr * 0.4 * sn); s.rotation.x = Math.PI / 2; head.add(s);
      head.add(mesh(sph(hr * 0.2, 8, 6), this.mDark, 0, -hr * 0.05, hr * 1.25 + hr * 0.75 * sn)); }
    this.jaw = mesh(cyl(hr * 0.35, hr * 0.5, hr * 1.0 * Math.max(0.6, sn), 8), this.mBelly, 0, -hr * 0.45, hr * 0.7 + hr * 0.3 * sn); this.jaw.rotation.x = Math.PI / 2; head.add(this.jaw);
    for (const s of [-1, 1]) head.add(mesh(sph(hr * 0.13, 8, 6), this.mEye, s * hr * 0.42, hr * 0.25, hr * 0.72));
    if (L.ears) for (const s of [-1, 1]) { const e = mesh(cone(hr * 0.25, hr * 0.7 * L.ears, 4), this.mBody, s * hr * 0.5, hr * 0.85, -hr * 0.1); e.rotation.z = -s * 0.3; head.add(e); }
    if (L.fangs) for (const s of [-1, 1]) { const f = mesh(cone(hr * 0.09, hr * 0.9, 5), this.mHorn, s * hr * 0.22, -hr * 0.75, hr * 1.1); f.rotation.x = Math.PI; head.add(f); }
    if (L.tusks) for (const s of [-1, 1]) { const t = mesh(cyl(hr * 0.1, hr * 0.06, hr * 1.8 * L.tusks, 6), this.mHorn, s * hr * 0.45, -hr * 0.55, hr * 1.2); t.rotation.set(1.1, 0, -s * 0.25); head.add(t); }
    if (L.trunk) { const tr = chain(this.mBody, 5, hr * 2.2, hr * 0.28, hr * 0.12); tr.root.position.set(0, -hr * 0.3, hr * 0.9); tr.root.rotation.x = Math.PI * 0.85; head.add(tr.root); this.extraChains.push({ ...tr, amp: 0.12, base: 0.18 }); }
    if (L.horns) for (const s of [-1, 1]) { const h = mesh(cone(hr * 0.16, hr * 1.1, 6), this.mHorn, s * hr * 0.55, hr * 0.8, 0); h.rotation.z = -s * 0.7; head.add(h); }
    // kuyruk
    if (L.tail || L.stingTail) {
      const tl = chain(this.mBody, 5, len * 0.55 * (L.tail || 1), girth * 0.14, girth * 0.05); tl.root.position.set(0, girth * 0.25, -len * 0.5); tl.root.rotation.x = -2.2; this.body.add(tl.root);
      this.tails.push({ ...tl, amp: 0.25, base: 0.18 });
      if (L.stingTail) { const st = mesh(cone(girth * 0.14, girth * 0.6, 6), this.mHorn, 0, tl.seg, 0); tl.tip.add(st); tl.root.rotation.x = -0.6; this.tails.at(-1).base = 0.55; }
    }
    if (L.wings) this.addWings(L.wings, girth * 2.6, girth * 0.4, 0.05);
  }
  addWings(color, span, y, z, membrane = true) {
    const mat = this.M.leather(color, { roughness: 0.75, side: THREE.DoubleSide });
    for (const s of [-1, 1]) {
      const pivot = new THREE.Group(); pivot.position.set(s * 0.2, y, z);
      const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(s * span * 0.55, span * 0.25); sh.lineTo(s * span, span * 0.05); sh.lineTo(s * span * 0.75, -span * 0.18); sh.lineTo(s * span * 0.4, -span * 0.12); sh.lineTo(0, -span * 0.08); sh.closePath();
      const w = mesh(new THREE.ShapeGeometry(sh), mat); w.rotation.x = -Math.PI / 2; pivot.add(w);
      if (membrane) pivot.add(mesh(cyl(0.025, 0.02, span, 5).rotateZ(Math.PI / 2).translate(s * span / 2, 0.01, 0), this.mHorn));
      this.body.add(pivot); this.wings.push({ pivot, s });
    }
  }
  buildSpider() {
    const L = this.look, M = this.M;
    this.body.position.y = 0.55;
    const ab = mesh(sph(0.55, 14, 10), this.mBody, 0, 0.12, -0.55); ab.scale.set(1, 0.85, 1.15); this.body.add(ab);
    if (L.belly) { const mark = mesh(sph(0.2, 10, 8), this.mBelly, 0, 0.55, -0.6); mark.scale.set(1, 0.3, 1.4); this.body.add(mark); }
    const ce = mesh(sph(0.36, 12, 10), this.mBody, 0, 0.05, 0.15); this.body.add(ce);
    const head = this.head = new THREE.Group(); head.position.set(0, 0.05, 0.45); this.body.add(head);
    for (let i = 0; i < 6; i++) head.add(mesh(sph(0.05, 6, 5), this.mEye, (i % 3 - 1) * 0.09, 0.08 + Math.floor(i / 3) * 0.08, 0.05));
    this.jaw = new THREE.Group(); head.add(this.jaw);
    for (const s of [-1, 1]) { const f = mesh(cone(0.05, 0.28, 5), this.mHorn, s * 0.08, -0.12, 0.08); f.rotation.x = 2.6; this.jaw.add(f); }
    for (let i = 0; i < 8; i++) {
      const s = i < 4 ? 1 : -1, k = i % 4, lg = leg(M, this.mBody, 1.05, 0.045, null);
      lg.hip.position.set(s * 0.25, 0.6, 0.35 - k * 0.2); lg.hip.rotation.set(0, 0, s * 1.05); lg.knee.rotation.z = -s * 1.5;
      this.root.add(lg.hip); this.legs.push({ ...lg, ph: k * 1.3 + (s > 0 ? 0 : Math.PI), splay: true, s });
    }
  }
  buildScorpion() {
    const L = this.look, M = this.M;
    this.body.position.y = 0.45;
    for (let i = 0; i < 4; i++) { const seg = mesh(sph(0.34 - i * 0.03, 12, 8), this.mBody, 0, 0, 0.3 - i * 0.3); seg.scale.set(1.15, 0.6, 0.9); this.body.add(seg); }
    const head = this.head = new THREE.Group(); head.position.set(0, 0.02, 0.55); this.body.add(head);
    head.add(mesh(sph(0.22, 10, 8), this.mBody)); for (const s of [-1, 1]) head.add(mesh(sph(0.04, 6, 5), this.mEye, s * 0.08, 0.12, 0.15));
    this.jaw = new THREE.Group(); head.add(this.jaw);
    for (const s of [-1, 1]) { // kıskaçlar
      const arm = new THREE.Group(); arm.position.set(s * 0.22, 0, 0.1); arm.rotation.y = s * 0.5;
      arm.add(mesh(cyl(0.05, 0.06, 0.45).rotateX(Math.PI / 2).translate(0, 0, 0.22), this.mBody));
      const claw = new THREE.Group(); claw.position.z = 0.48; arm.add(claw);
      const big = mesh(sph(0.13, 10, 8), this.mBody); big.scale.set(0.8, 0.6, 1.4); claw.add(big);
      for (const t of [-1, 1]) { const p = mesh(cone(0.05, 0.25, 5), this.mHorn, t * 0.05, 0, 0.2); p.rotation.x = Math.PI / 2; claw.add(p); }
      this.jaw.add(arm);
    }
    for (let i = 0; i < 6; i++) { const s = i < 3 ? 1 : -1, k = i % 3, lg = leg(M, this.mBody, 0.75, 0.04, null);
      lg.hip.position.set(s * 0.28, 0.45, 0.2 - k * 0.3); lg.hip.rotation.z = s * 1.1; lg.knee.rotation.z = -s * 1.4; this.root.add(lg.hip); this.legs.push({ ...lg, ph: k * 1.6 + (s > 0 ? 0 : Math.PI), splay: true, s }); }
    const tl = chain(this.mBody, 6, 1.5, 0.12, 0.07); tl.root.position.set(0, 0.05, -0.8); tl.root.rotation.x = -1.2; this.body.add(tl.root);
    tl.tip.add(mesh(cone(0.08, 0.3, 6), M.glow(L.fx || 0xd0ff3a, 1.2), 0, tl.seg, 0));
    this.tails.push({ ...tl, amp: 0.12, base: 0.42, arch: true });
  }
  buildBird() {
    const L = this.look, M = this.M; this.hover = 1.7;
    const torso = mesh(sph(0.35, 12, 10), this.mBody); torso.scale.set(0.9, 0.85, 1.4); this.body.add(torso);
    const head = this.head = new THREE.Group(); head.position.set(0, 0.25, 0.45); this.body.add(head);
    head.add(mesh(sph(0.2, 10, 8), this.mBody)); for (const s of [-1, 1]) head.add(mesh(sph(0.04, 6, 5), this.mEye, s * 0.11, 0.05, 0.13));
    this.jaw = mesh(cone(0.07, 0.3, 5), M.leather(L.beak || 0xd4a93a), 0, -0.03, 0.27); this.jaw.rotation.x = Math.PI / 2; head.add(this.jaw);
    const tail = mesh(cone(0.22, 0.5, 4), M.leather(L.wing || this.look.body), 0, 0.05, -0.6); tail.rotation.x = -Math.PI / 2; tail.scale.z = 0.3; this.body.add(tail);
    this.addWings(L.wing || L.body, 1.2, 0.12, 0.05, false);
    for (const s of [-1, 1]) { const lg = leg(M, M.leather(L.beak || 0xd4a93a), 0.35, 0.025, null); lg.hip.position.set(s * 0.12, -0.25, 0); this.body.add(lg.hip); }
  }
  buildInsect() {
    const L = this.look, M = this.M; this.hover = 1.5;
    const th = mesh(sph(0.22, 10, 8), this.mBody); this.body.add(th);
    const stripe = M.skin(L.stripe || 0x1a1a1a);
    for (let i = 0; i < 4; i++) { const s = mesh(sph(0.26 - i * 0.03, 10, 8), i % 2 ? stripe : this.mBody, 0, -0.05 - i * 0.04, -0.3 - i * 0.18); s.scale.set(1, 0.9, 0.8); this.body.add(s); }
    this.body.add(mesh(cone(0.04, 0.3, 5).rotateX(-Math.PI / 2), this.mDark, 0, -0.2, -1.05));
    const head = this.head = new THREE.Group(); head.position.set(0, 0.04, 0.27); this.body.add(head);
    head.add(mesh(sph(0.15, 10, 8), stripe)); for (const s of [-1, 1]) head.add(mesh(sph(0.07, 8, 6), this.mEye, s * 0.09, 0.03, 0.08));
    this.jaw = new THREE.Group(); head.add(this.jaw);
    const wm = M.basic(0xd8f0ff, { transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false });
    for (const s of [-1, 1]) for (const k of [0, 1]) { const p = new THREE.Group(); p.position.set(s * 0.1, 0.18, 0.05 - k * 0.15); const w = mesh(new THREE.CircleGeometry(0.35, 10), wm, s * 0.35, 0, 0); w.scale.set(1, 0.35, 1); w.rotation.x = -Math.PI / 2; p.add(w); this.body.add(p); this.wings.push({ pivot: p, s, fast: true }); }
    for (let i = 0; i < 6; i++) { const s = i < 3 ? 1 : -1, lg = leg(M, stripe, 0.4, 0.02, null); lg.hip.position.set(s * 0.12, -0.1, 0.1 - (i % 3) * 0.12); lg.hip.rotation.z = s * 0.6; this.body.add(lg.hip); }
  }
  // İnsan üst gövde (sentor, yılan gövdeli): göğüs, iki kol, baş, saç, silah
  upperBody(y, z) {
    const L = this.look, M = this.M, up = this.upper = new THREE.Group(); up.position.set(0, y, z); this.body.add(up);
    const skin = M.skin(L.skin || 0xc89a7a), armor = M.plate(L.armor || 0x5a4a3a, { map: null, bumpMap: null });
    up.add(mesh(cyl(0.26, 0.2, 0.75), armor, 0, 0.38, 0));
    const head = this.head = new THREE.Group(); head.position.set(0, 0.95, 0); up.add(head);
    head.add(mesh(sph(0.19, 12, 10), skin)); for (const s of [-1, 1]) head.add(mesh(sph(0.03, 6, 5), this.mEye, s * 0.07, 0.03, 0.17));
    if (L.hair) { const h = mesh(sph(0.21, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.6), M.leather(L.hair, { roughness: 0.9 }), 0, 0.03, -0.02); head.add(h); const tail = mesh(cyl(0.08, 0.03, 0.45), M.leather(L.hair), 0, -0.25, -0.17); tail.rotation.x = 0.3; head.add(tail); }
    this.jaw = new THREE.Group(); head.add(this.jaw);
    this.arms = [];
    for (const s of [-1, 1]) { const sh = new THREE.Group(); sh.position.set(s * 0.32, 0.68, 0); sh.add(mesh(cyl(0.07, 0.06, 0.6).translate(0, -0.3, 0), skin)); up.add(sh); this.arms.push({ sh, s }); }
    const wk = L.weapon || 'spear';
    try { const w = buildWeapon(wk === 'staff' ? 'staff' : wk === 'bow' ? 'bow' : 'spear', this, null); w.position.set(0, -0.6, 0); w.rotation.x = wk === 'bow' ? 0 : -Math.PI / 2 + 0.3; this.arms[1].sh.add(w); this.weapon = w; } catch { /* silahsız */ }
  }
  buildCentaur() { this.buildQuad({ len: 1.5, girth: 0.42, headK: 0.0001 }); this.head.visible = false; this.upperBody(0.35, 0.55); }
  buildSerpent() {
    const L = this.look, M = this.M;
    this.segs = [];
    for (let i = 0; i < 9; i++) { const g = mesh(sph(0.3 - i * 0.022, 12, 8), i % 2 ? this.mBelly : this.mBody); this.root.add(g); this.segs.push(g); }
    this.body.position.set(0, 0.55, 0.3);
    this.upperBody(0, 0);
  }
  buildDragon() {
    this.buildQuad({ len: 1.9, girth: 0.55, headK: 0.0001 }); this.head.visible = false;
    const nk = chain(this.mBody, 5, 1.1, 0.2, 0.13); nk.root.position.set(0, 0.3, 0.85); nk.root.rotation.x = 0.6; this.body.add(nk.root); this.extraChains.push({ ...nk, amp: 0.05, base: -0.08 });
    const head = this.head = new THREE.Group(); head.position.y = nk.seg; nk.tip.add(head);
    const skull = mesh(sph(0.26, 12, 10), this.mBody); skull.scale.set(0.9, 0.8, 1.3); head.add(skull);
    const snout = mesh(cyl(0.12, 0.2, 0.45).rotateX(Math.PI / 2), this.mBody, 0, -0.03, 0.38); head.add(snout);
    this.jaw = mesh(cyl(0.1, 0.16, 0.42).rotateX(Math.PI / 2), this.mBelly, 0, -0.14, 0.33); head.add(this.jaw);
    for (const s of [-1, 1]) { head.add(mesh(sph(0.045, 6, 5), this.mEye, s * 0.14, 0.1, 0.2)); const h = mesh(cone(0.06, 0.42, 6), this.mHorn, s * 0.13, 0.22, -0.18); h.rotation.x = -1.0; head.add(h); }
    head.rotation.x = -0.5;
    for (let i = 0; i < 5; i++) { const sp = mesh(cone(0.06, 0.22, 5), this.mHorn, 0, 0.55, 0.6 - i * 0.3); this.body.add(sp); }
    this.addWings(this.look.wing || this.look.body, 1.9, 0.5, 0.15);
  }

  // ---------- Animasyon ----------
  update(dt, t) {
    const p = this.pose, live = this.dead ? 0 : 1, walk = p.walk, ph = t * (walk ? 9 : 1.6) + this.phase;
    const breathe = Math.sin(t * 2 + this.phase) * 0.02 * live;
    const hov = this.hover ? this.hover + Math.sin(t * 2.4 + this.phase) * 0.12 * live - p.fall * this.hover : 0;
    this.body.position.z = (this.serpentZ || 0) + p.lunge * 0.55 - p.rear * 0.25;
    if (this.hover) this.body.position.y = hov;
    this.body.rotation.x = -p.rear * 0.35 + p.lunge * 0.12;
    this.body.scale.setScalar(1 + breathe);
    this.root.rotation.z = p.fall * 1.4;
    for (const l of this.legs) {
      const a = Math.sin(ph + l.ph) * (walk ? 0.55 : 0.04) * live;
      if (l.splay) { l.hip.rotation.y = a * 0.6; l.knee.rotation.x = Math.max(0, a) * 0.6; }
      else { l.hip.rotation.x = a; l.knee.rotation.x = Math.max(0, -a) * 1.1 + p.rear * 0.4; }
    }
    for (const tl of this.tails) tl.links.forEach((g, i) => { g.rotation.x = (tl.arch ? tl.base : tl.base) + Math.sin(t * 2.2 + i * 0.7 + this.phase) * tl.amp * live + (tl.arch ? p.open * 0.25 : 0); g.rotation.z = tl.arch ? 0 : Math.sin(t * 1.7 + i) * tl.amp * 0.6 * live; });
    for (const c of this.extraChains) c.links.forEach((g, i) => { g.rotation.x = c.base + Math.sin(t * 1.5 + i * 0.6) * c.amp * live - (c.base < 0 ? p.open * 0.1 : 0); });
    for (const w of this.wings) { const f = w.fast ? Math.sin(t * 60) * 0.5 : Math.sin(t * (this.hover ? 7 : 1.4) + this.phase) * (this.hover ? 0.7 : 0.15) + p.cast * 0.6; w.pivot.rotation.z = w.s * (f * live + (this.dead ? -0.2 : (w.fast ? 0 : 0.55))); }
    if (this.jaw) this.jaw.rotation.x = this.jawBase + p.open * 0.45; // ağız / kıskaç açılır
    if (this.head) this.head.rotation.x = (this.kind === 'dragon' ? -0.5 : 0) - p.open * 0.35 + p.lunge * 0.2;
    if (this.arms) this.arms.forEach(({ sh, s }) => { sh.rotation.x = -p.cast * 2.2 - (s > 0 ? p.lunge * 1.6 : 0) + Math.sin(t * 2 + s) * 0.05 * live; });
    if (this.segs) { const n = this.segs.length; this.segs.forEach((g, i) => { const u = i / (n - 1); g.position.set(Math.sin(t * 1.4 + u * 4 + this.phase) * 0.25 * u * live, 0.25 - u * 0.05, 0.3 - u * 2.2 + p.lunge * 0.4 * (1 - u)); }); }
    if (this.flash > 0) { this.flash = Math.max(0, this.flash - dt * 4); this.M.u.flash.value = this.flash * 1.4; }
  }
  get pos() { return this.root.position; }
  headTo(v) { return (this.head?.visible !== false && this.head ? this.head : this.body).getWorldPosition(v).setY((this.head || this.body).getWorldPosition(V0).y + 0.35 * this.scale); }
  chestTo(v) { return this.body.getWorldPosition(v); }
  headPos() { return this.headTo(new THREE.Vector3()); }
  chestPos() { return this.chestTo(new THREE.Vector3()); }
  handPos() { return (this.weapon || this.head || this.body).getWorldPosition(new THREE.Vector3()); }
  face(target) { this.root.rotation.y = Math.atan2(target.x - this.pos.x, target.z - this.pos.z); }
  async moveTo(target, dur = 0.35) { this.face(target); this.pose.walk = 1; const from = this.pos.clone(); await tween(dur, k => this.pos.lerpVectors(from, target, k), ease.inOut); this.pose.walk = 0; }
  relax() {} ready() {}
  async swing() { // ısırık / pençe / kıskaç: geri çekil, ağzını aç, ileri atıl
    await to(this.pose, { rear: 1, open: 1 }, 0.22, ease.out);
    await to(this.pose, { rear: 0, lunge: 1 }, 0.1, ease.in);
    to(this.pose, { lunge: 0, open: 0 }, 0.4, ease.back);
  }
  async whirl() { await this.swing(); }
  async stomp() { await to(this.pose, { rear: 1.3, shake: 0.2 }, 0.25); await to(this.pose, { rear: -0.2, shake: 0 }, 0.12, ease.in); to(this.pose, { rear: 0 }, 0.3); }
  async castSpell() { await to(this.pose, { open: 1.2, rear: 0.5, cast: 1 }, 0.3, ease.out); to(this.pose, { open: 0, rear: 0, cast: 0 }, 0.35); }
  async raiseArms() { await this.castSpell(); }
  async shoot() { await to(this.pose, { cast: 0.6, rear: 0.3 }, 0.2); to(this.pose, { cast: 0, rear: 0 }, 0.3); }
  hit(from, heavy = false) { this.flash = 1; to(this.pose, { shake: heavy ? 0.3 : 0.15, rear: -0.3 }, 0.06).then(() => to(this.pose, { shake: 0, rear: 0 }, 0.35, ease.back)); }
  async die() {
    this.dead = true;
    const n = ++this.deathN;
    await to(this.pose, { rear: 0.6, open: 1.3 }, 0.25);
    await to(this.pose, { fall: 1, rear: 0 }, 0.4, ease.in);
    if (n !== this.deathN) return;
    fxPlay(EVENT_FX.kill, this);
    await tween(0.9, k => { if (n === this.deathN) this.M.u.dissolve.value = k * 1.02; });
    if (n === this.deathN) this.root.visible = false;
  }
  revive(face, home) { this.deathN++; this.dead = false; this.pose.fall = 0; this.M.u.dissolve.value = 0; this.root.visible = true; this.root.rotation.set(0, face, 0); if (home) this.pos.copy(home); }
  cheer() { this.castSpell(); }
  dispose() { scene.remove(this.root); this.root.traverse(o => { if (o.isMesh) o.geometry.dispose(); }); this.M.list.forEach(m => m.dispose()); }
}

// ---------- İnsansı yaratık ekleri (models.js Character üzerine) ----------
// wings (renk): sırtta yarasa/kuş kanadı · tail (renk): kalçadan kuyruk · horns (renk): boğa boynuzu · snout: öne uzun ağız
// ghost (renk): yarı saydam, yerden yüksekte süzülür, bacaklar görünmez · bark (renk): başta ve omuzlarda dal · rock (true|renk): kaya parçaları ve ışıyan çatlak
export function decorateMob(c, L = {}) {
  if (!c?.torso || !(L.wings || L.tail || L.horns || L.snout || L.ghost || L.bark || L.rock)) return c;
  const M = c.M, anim = [];
  if (L.wings) {
    const mat = M.leather(L.wings, { roughness: 0.8, side: THREE.DoubleSide }), span = 1.3;
    for (const s of [-1, 1]) {
      const p = new THREE.Group(); p.position.set(s * 0.12, 0.62, -0.22); c.torso.add(p);
      const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(s * span * 0.6, span * 0.45); sh.lineTo(s * span, span * 0.2); sh.lineTo(s * span * 0.8, -span * 0.2); sh.lineTo(s * span * 0.45, -span * 0.1); sh.lineTo(0, -span * 0.25); sh.closePath();
      const w = mesh(new THREE.ShapeGeometry(sh), mat); w.rotation.y = s * 0.5; p.add(w);
      anim.push((t, dead) => { p.rotation.y = s * (0.25 + (dead ? -0.3 : Math.sin(t * 3 + c.phase) * 0.25)); });
    }
  }
  if (L.tail) {
    const tl = chain(M.skin(L.tail), 5, 0.9, 0.09, 0.03); tl.root.position.set(0, 0.0, -0.18); tl.root.rotation.x = -2.3; c.hips.add(tl.root);
    anim.push((t, dead) => tl.links.forEach((g, i) => { g.rotation.z = dead ? 0 : Math.sin(t * 2 + i * 0.8 + c.phase) * 0.2; g.rotation.x = 0.12; }));
  }
  if (L.horns) for (const s of [-1, 1]) { const h = mesh(cone(0.05, 0.38, 6), M.leather(L.horns, { roughness: 0.35 }), s * 0.2, 0.18, 0); h.rotation.z = -s * 1.1; c.head.add(h); }
  if (L.snout) { const sn = mesh(cyl(0.07, 0.12, 0.28, 8).rotateX(Math.PI / 2), M.skin(L.skin || 0x6a5a4a), 0, -0.05, 0.22); c.head.add(sn); c.head.add(mesh(sph(0.03, 6, 5), M.basic(0x120808), 0, -0.02, 0.37)); }
  if (L.bark) {
    const bm = M.leather(L.bark, { roughness: 1 }), wood = M.leather(0x4a3018, { roughness: 1 });
    for (let i = 0; i < 5; i++) { const b = mesh(cone(0.04, 0.45, 5), wood, (i - 2) * 0.08, 0.25, -0.05); b.rotation.z = (i - 2) * 0.35; c.head.add(b); b.add(mesh(sph(0.1, 7, 6), bm, 0, 0.22, 0)); }
    for (const s of [-1, 1]) { const tuft = mesh(sph(0.16, 8, 6), bm, s * 0.35, 0.78, -0.05); c.torso.add(tuft); }
  }
  if (L.rock) {
    const rm = M.leather(new THREE.Color(L.skin || 0x6a6a6a).multiplyScalar(0.8).getHex(), { roughness: 1, flatShading: true }), glow = typeof L.rock === 'number' ? M.glow(L.rock, 2) : null;
    for (const [x, y, z, r] of [[0.32, 0.8, -0.05, 0.16], [-0.34, 0.78, 0, 0.15], [0, 0.7, -0.25, 0.2], [0.15, 0.35, -0.22, 0.12], [-0.18, 0.4, -0.2, 0.13]]) {
      const rk = mesh(new THREE.DodecahedronGeometry(r, 0), rm, x, y, z); rk.rotation.set(x * 3, y * 2, z); c.torso.add(rk);
      if (glow) c.torso.add(mesh(new THREE.OctahedronGeometry(r * 0.35, 0), glow, x, y + r * 0.6, z));
    }
  }
  if (L.ghost) {
    const col = new THREE.Color(L.ghost);
    c.root.traverse(o => { if (!o.isMesh || !o.material) return; for (const m of [].concat(o.material)) { m.transparent = true; m.opacity = 0.62; m.depthWrite = false; if (m.emissive) { m.emissive.lerp(col, 0.6); m.emissiveIntensity = Math.max(m.emissiveIntensity || 0, 0.55); } } });
    for (const lg of [c.legL, c.legR]) if (lg) lg.visible = false;
    const base = c.root.position.y;
    anim.push((t, dead) => { c.hips.position.y = 1.0 + (dead ? 0 : 0.25 + Math.sin(t * 1.8 + c.phase) * 0.08); });
    void base;
  }
  if (anim.length) { const up = c.update.bind(c); c.update = (dt, t) => { up(dt, t); for (const f of anim) f(t, c.dead); }; }
  return c;
}
