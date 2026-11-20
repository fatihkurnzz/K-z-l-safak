// Sınır Anıtı (Anıt Savaşı, shared/anit.js): iki tarafın da vurabildiği, sıra almayan taş anıt. Savaş birimi arayüzünü
// (WormCharacter gibi) karşılar ama hareket etmez: vurulunca titrer ve kızarır, kesilince çöker. Üstte iki ırkın renginde
// (kızıl / mavi) yavaşça dönen kristal, gövdede iki renkli rün kuşakları.
import { THREE, scene, tween } from './engine3d.js';

const V0 = new THREE.Vector3();
export class MonumentCharacter {
  constructor(look = {}) {
    this.scale = look.scale || 1; this.dead = false; this.deathN = 0; this.flash = 0; this.shake = 0;
    this.root = new THREE.Group(); this.root.scale.setScalar(this.scale);
    const stone = new THREE.MeshStandardMaterial({ color: 0x6d675f, roughness: 0.92, metalness: 0.05, flatShading: true });
    const dark = new THREE.MeshStandardMaterial({ color: 0x3e3934, roughness: 0.95, flatShading: true });
    const runeR = new THREE.MeshStandardMaterial({ color: 0xff4a2a, emissive: 0xff3a1a, emissiveIntensity: 1.6 });
    const runeB = new THREE.MeshStandardMaterial({ color: 0x4aa0ff, emissive: 0x2a7cff, emissiveIntensity: 1.6 });
    const gold = new THREE.MeshStandardMaterial({ color: 0xd8a84a, metalness: 0.8, roughness: 0.35 });
    this.M = { list: [stone, dark, runeR, runeB, gold], stone };
    const add = (geo, mat, y, sx = 1, sy = 1, sz = 1, ry = 0) => { const m = new THREE.Mesh(geo, mat); m.position.y = y; m.scale.set(sx, sy, sz); m.rotation.y = ry; m.castShadow = true; m.receiveShadow = true; this.body.add(m); return m; };
    this.body = new THREE.Group(); this.root.add(this.body);
    add(new THREE.CylinderGeometry(1.25, 1.45, 0.35, 8), dark, 0.17);           // kaide
    add(new THREE.CylinderGeometry(1.0, 1.15, 0.3, 8), stone, 0.5);
    add(new THREE.CylinderGeometry(0.42, 0.62, 3.0, 4), stone, 2.15, 1, 1, 1, Math.PI / 4); // dikili taş (dört yüzlü, sivrilen)
    add(new THREE.CylinderGeometry(0.05, 0.42, 0.55, 4), stone, 3.92, 1, 1, 1, Math.PI / 4);
    add(new THREE.TorusGeometry(0.58, 0.06, 6, 16), runeR, 1.3, 1, 1, 1).rotation.x = Math.PI / 2; // rün kuşakları
    add(new THREE.TorusGeometry(0.5, 0.06, 6, 16), runeB, 2.4, 1, 1, 1).rotation.x = Math.PI / 2;
    add(new THREE.TorusGeometry(0.47, 0.035, 6, 16), gold, 3.2, 1, 1, 1).rotation.x = Math.PI / 2;
    this.gem = new THREE.Group(); this.gem.position.y = 4.65; this.root.add(this.gem);
    const g1 = new THREE.Mesh(new THREE.OctahedronGeometry(0.32), runeR), g2 = new THREE.Mesh(new THREE.OctahedronGeometry(0.32), runeB);
    g1.position.x = -0.18; g2.position.x = 0.18; this.gem.add(g1, g2);
    this.light = new THREE.PointLight(0xffd9a0, 0.9, 7); this.light.position.y = 4.4; this.root.add(this.light);
  }
  update(dt, t) {
    if (this.dead) return;
    this.gem.rotation.y += dt * 0.8; this.gem.position.y = 4.65 + Math.sin(t * 1.6) * 0.08;
    this.flash = Math.max(0, this.flash - dt * 3); this.shake = Math.max(0, this.shake - dt * 2.5);
    this.M.stone.emissive.setRGB(this.flash * 0.5, this.flash * 0.12, 0);
    this.body.position.x = (Math.random() - 0.5) * this.shake * 0.25;
  }
  get pos() { return this.root.position; }
  headTo(v) { return this.gem.getWorldPosition(v).setY(this.gem.getWorldPosition(V0).y + 0.5 * this.scale); }
  chestTo(v) { return v.copy(this.root.position).setY(this.root.position.y + 2.0 * this.scale); }
  headPos() { return this.headTo(new THREE.Vector3()); }
  chestPos() { return this.chestTo(new THREE.Vector3()); }
  handPos() { return this.chestPos(); }
  face() {} relax() {} ready() {} cheer() {}
  async moveTo() {} async swing() {} async whirl() {} async stomp() {} async shoot() {} async castSpell() {} async raiseArms() {}
  hit(from, heavy = false) { this.flash = 1; this.shake = heavy ? 1 : 0.6; }
  async die() {
    this.dead = true;
    const n = ++this.deathN;
    await tween(1.2, k => { if (n === this.deathN) { this.root.position.y = -k * 2.6 * this.scale; this.body.rotation.z = k * 0.25; this.light.intensity = 0.9 * (1 - k); } });
    if (n === this.deathN) this.root.visible = false;
  }
  revive(face, home) { this.deathN++; this.dead = false; this.root.visible = true; this.root.position.y = 0; this.body.rotation.z = 0; this.light.intensity = 0.9; if (home) this.pos.copy(home); }
  dispose() { scene.remove(this.root); this.root.traverse(o => { if (o.isMesh) o.geometry.dispose(); }); this.M.list.forEach(m => m.dispose()); }
}
