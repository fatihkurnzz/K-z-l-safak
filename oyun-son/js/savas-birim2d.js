// 23 Kas (görev C3/C5, GPT G1+G2): savaşta boyalı 2B birimler. 3B karakterin (models.js Character) yerine geçen, aynı
// arayüzü taşıyan bir pano: yere oturan, kameraya dönen düzlem + poz resimleri (bekleme, hazırlık, vuruş, büyü, vurulma,
// düşüş, zafer). Yalnız çizim katmanıdır; savaşın kuralına, sırasına ve sonucuna dokunmaz (combat.js aynı yöntemleri çağırır).
// Resimler gömülü JS'tedir (kahramanlar + bandikutlar b2d-sancak.js / b2d-ocak.js, b2d-gom.py; G3 yaratık ve bosslar b2d-y1…y4.js, b2d-yb.js,
// b2d-g3-gom.py) ve yalnız savaşta, gereken paket yüklenir.
// Eski 3B çizime dönmek: localStorage dd_b2d = '0' (ya da adres ?b2d=0).
import { THREE, camera, to, tween, wait, ease, camRig, hitStop } from './engine3d.js';
import { play as fxPlay } from './fx.js';
import { EVENT_FX } from './fx-table.js';
import { charLookFor } from './gorunus.js';

import { B2D, YARATIK, halkAd, paket, HAZIR, p23Portre, t3Mi } from './yaratik2d.js';
import { ZEMIN, zeminTon } from './savas-arka.js'; // P31-G3: sahne tonu ve temas gölgesi koyuluğu
export { B2D };
import { B3D, savasKarari, isitBirim } from './savas3d/ayar3d.js'; // 3B Savaş Faz 1 (Opus 27.11): savaş 3B ise 2B birim verilmez

const SINIF = { warrior: 'savasci', rogue: 'suikastci', mage: 'buyucu', priest: 'sifaci' };
const SILAH = { savasci: 'sword', suikastci: 'dagger', buyucu: 'staff', sifaci: 'mace' };

// ---- Paket ve doku önbelleği ----
const DOKU = new Map();
// Düşman çerçevesi için yaratık/boss portresi (base64 WebP) ya da null; paket henüz inmediyse indirmeye başlar
export function portre(u) { const s = cozumHam(u); if (!s || s.hero) return null; const p23 = u.mob && p23Portre(u.mob); if (p23) return p23; const P = HAZIR[s.ad]; if (!P) { paket(s.ad); return null; } return P[s.anahtar]?.portre || null; }
const yukleyici = new THREE.TextureLoader();
function doku(ad, anahtar, poz, b64) {
  const k = `${ad}/${anahtar}/${poz}`;
  let t = DOKU.get(k);
  if (!t) { t = yukleyici.load('data:image/webp;base64,' + b64); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; DOKU.set(k, t); }
  return t;
}
// Savaş açılmadan önce paketleri ısıt (açılış kartı sürerken iner)
export function onYukle(units) { savasKarari(units); if (!B2D.on || B3D.aktif) return; for (const u of units) { const s = cozumHam(u); if (s) paket(s.ad); } }

// Birimin 2B karşılığı: { ad: paket, anahtar, hero, tint } ya da null (çizimi yoksa 3B kalır)
// 3B Savaş Faz 1: bu savaş 3B kararı aldıysa (ayar3d.js savasKarari) birim 2B çizilmez → world.js spawn 3B birim kurar.
export function cozum(u) { isitBirim(u); return B3D.aktif ? null : cozumHam(u); }
export function cozumHam(u) {
  if (!B2D.on || !u || u.mon) return null;
  if (u.cls) {
    const s = SINIF[u.cls]; if (!s) return null;
    const f = u.faction === 'sancak' ? 'sancak' : 'ocak';
    // P26 (G1): Sv.45+ Savaşçı yüksek kademe görünümüyle çizilir (tek kare; hareket ileri atılma/sarsılmadan gelir)
    // P28 M1: yalnız o halk+sınıf+cinsiyet için çizim varsa (kadın karakter asla erkek t3 çizimine düşmez)
    const L = charLookFor(u), g = L?.gender || u.gender || cinsTahmin(u);
    if (t3Mi(u.cls, u.lvl, g, f)) return { ad: 'p26', anahtar: `t3-${f}`, hero: true, sinif: s, t3: true };
    return { ad: f, anahtar: `${s}-${g === 'f' ? 'kadin' : 'erkek'}`, hero: true, sinif: s };
  }
  const Y = YARATIK[u.mob]; if (!Y) return null;
  return { ad: Y[0] === 'halk' ? halkAd() : Y[0], anahtar: Y[1], hero: false, tint: Y[2], boss: !!u.boss }; // bandikutlar iki halk dosyasında da var
}
// Görünüşü bilinmeyen kahraman (yapay zekâ yoldaşı, rakip parti): addan kararlı bir cinsiyet (her savaşta aynı kalır)
function cinsTahmin(u) { let h = 7; for (const c of String(u.name || u.id || '')) h = (h * 31 + c.charCodeAt(0)) | 0; return (h >>> 3) & 1 ? 'f' : 'm'; }

// Kahraman tuvali 1086x1448, karakter ~1250 px, ayak alttan 64 px. Yaratık tuvali 1024x1024, ayak alttan 48 px.
const OLCU = {
  hero: { w: 2.72 * 1086 / 1448, h: 2.72, taban: 64 / 1448, bas: 2.25, gogus: 1.45 },
  mob: { w: 3.0, h: 3.0, taban: 48 / 1024, bas: 1.2, gogus: 0.75 },
  boss: { w: 4.2, h: 4.2, taban: 48 / 1024, bas: 2.4, gogus: 1.4 }, // G3 bosslar (1536 tuval, zemin aynı oranda); boss birimi kadrajda büyük
};
const V0 = new THREE.Vector3();
// P31-G3: ayak altı temas gölgesi. Ortak doku (kodla çizilen radyal degrade); boyutu birim genişliğiyle orantılı:
// en = w * en, derinlik = en * der (kamera alçak açıdan baktığı için yerde ~4:1 basık elips görünür).
const GOLGE = { hero: { en: 0.56, der: 0.85 }, mob: { en: 0.5, der: 0.8 }, boss: { en: 0.52, der: 0.75 } };
let golgeDoku = null;
function golgeTex() {
  if (golgeDoku) return golgeDoku;
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'), r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, 'rgba(0,0,0,1)'); r.addColorStop(0.35, 'rgba(0,0,0,0.82)'); r.addColorStop(0.7, 'rgba(0,0,0,0.32)'); r.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = r; g.fillRect(0, 0, 128, 128);
  golgeDoku = new THREE.CanvasTexture(c); return golgeDoku;
}

export class Birim2D {
  constructor(spec, look = {}, sag = true) {
    this.spec = spec; this.hero = spec.hero;
    const O = this.O = spec.hero ? OLCU.hero : spec.boss ? OLCU.boss : OLCU.mob;
    this.scale = look.scale || 1; this.fx = look.fx || (spec.hero ? 0 : 0); this.phase = Math.random() * 6;
    this.weaponKind = spec.hero ? SILAH[spec.sinif] : 'club'; this.deathN = 0; this.dead = false; this.flash = 0;
    this.root = new THREE.Group(); this.root.scale.setScalar(this.scale);
    this.bb = new THREE.Group(); this.root.add(this.bb);
    const geo = new THREE.PlaneGeometry(O.w, O.h); geo.translate(0, O.h / 2 - O.h * O.taban, 0);
    this.mat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, alphaTest: 0.03, depthWrite: false, toneMapped: false, side: THREE.DoubleSide });
    this.taban = new THREE.Color(spec.tint ?? 0xffffff).multiplyScalar(0.96);
    this.mat.color.copy(this.taban);
    this.mesh = new THREE.Mesh(geo, this.mat); this.mesh.renderOrder = 2;
    // Kahraman resimleri sağa, yaratıklar sola bakar. Birim öbür yöne bakacaksa yatay çevrilir.
    this.yon = spec.hero ? (sag ? 1 : -1) : (sag ? -1 : 1);
    this.mesh.scale.x = this.yon;
    this.bb.add(this.mesh);
    // P31-G3: temas gölgesi (world.js'in ortak lekesi bu birimde gizlenir: kendiGolge)
    const G = spec.hero ? GOLGE.hero : spec.boss ? GOLGE.boss : GOLGE.mob, gen = O.w * G.en;
    this.golge = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: golgeTex(), color: 0x000000, transparent: true, opacity: 0, depthWrite: false, toneMapped: false }));
    this.golge.scale.set(gen, 1, gen * G.der); this.golge.position.y = 0.03; this.golge.renderOrder = 1; this.golgeEn = gen; this.kendiGolge = true;
    this.bb.add(this.golge);
    this.tint = new THREE.Color(spec.tint ?? 0xffffff).multiplyScalar(0.96); this.tonId = null;
    this.poz = 'bekleme'; this.lunge = 0; this.tilt = 0; this.hop = 0;
    paket(spec.ad).then(P => { const d = P?.[spec.anahtar]; if (!d) return; this.d = d; this.set(this.poz); if (!this.dead) to(this.mat, { opacity: 1 }, 0.25); });
  }
  set(poz) {
    this.poz = poz;
    const d = this.d; if (!d) return;
    let p = d[poz] ? poz : this.hero ? 'bekleme' : ({ 'saldiri-hazirlik': 'bekleme', 'saldiri-vurus': 'saldiri', buyu: 'saldiri', 'yere-dusus': 'vurulma', zafer: 'saldiri' }[poz] || 'bekleme');
    if (!d[p]) p = 'bekleme'; // 23 Kas: yalnız bekleme pozu olan türler
    if (this.evre2 && d[p + '2']) p += '2'; // G3 bosslar: canı yarıya inince (ya da evre/öfke) 2. evre çizimi
    const m = doku(this.spec.ad, this.spec.anahtar, p, d[p]);
    if (this.mat.map !== m) { this.mat.map = m; this.mat.needsUpdate = true; }
  }
  update(dt, t) {
    const U = this.spec.canli; // canlı savaş birimi (combat.js verir); yalnız okunur
    if (U && !this.evre2 && this.d?.bekleme2 && (U.phase > 0 || U.enrage > 0 || U.hp <= U.maxHp / 2)) { this.evre2 = true; this.set(this.poz); }
    // Kameraya dön (yalnız dikey eksende): düzlem her zaman ekrana paralel durur
    const ry = Math.atan2(camera.position.x - this.root.position.x, camera.position.z - this.root.position.z);
    this.bb.rotation.y = ry - this.root.rotation.y;
    if (this.tonId !== ZEMIN.aktif) { // P31-G3: zemin değişince ortam tonu (renk çarpanı) ve gölge koyuluğu yenilenir
      this.tonId = ZEMIN.aktif; const Z = zeminTon(); this.golgeK = Z.golge;
      this.taban.setRGB(this.tint.r * Z.ton[0], this.tint.g * Z.ton[1], this.tint.b * Z.ton[2]); if (!(this.flash > 0)) this.mat.color.copy(this.taban);
    }
    { const h = Math.max(0, Math.min(0.4, this.hop * 0.7)); // havadayken gölge küçülür ve açılır; vuruşta figürle kayar
      this.golge.position.x = this.mesh.position.x;
      this.golge.material.opacity = (this.golgeK ?? 0.55) * this.mat.opacity * (1 - h);
      this.golge.scale.x = this.golgeEn * (1 - h * 0.5); }
    const nefes = this.dead ? 0 : Math.sin(t * 2.2 + this.phase);
    this.mesh.scale.y = 1 + nefes * 0.009; this.mesh.scale.x = this.yon * (1 - nefes * 0.004);
    this.mesh.position.set(this.lunge * this.yon * (this.hero ? 1 : -1) * 0.35, this.hop, 0);
    this.mesh.rotation.z = this.tilt * this.yon;
    if (this.flash > 0) {
      this.flash = Math.max(0, this.flash - dt * 3.5);
      const k = this.flash; this.mat.color.setRGB(this.taban.r * (1 + k * 0.18), this.taban.g * (1 - k * 0.42), this.taban.b * (1 - k * 0.42));
    }
  }
  get pos() { return this.root.position; }
  headTo(v) { return v.copy(this.root.position).setY(this.root.position.y + this.O.bas * this.scale); }
  chestTo(v) { return v.copy(this.root.position).setY(this.root.position.y + this.O.gogus * this.scale); }
  headPos() { return this.headTo(new THREE.Vector3()); }
  chestPos() { return this.chestTo(new THREE.Vector3()); }
  handPos() { // eli: göğüs hizasında, baktığı yöne yarım adım
    const r = this.root.rotation.y; return this.chestTo(new THREE.Vector3()).add(V0.set(Math.sin(r), 0.15, Math.cos(r)).multiplyScalar(0.6 * this.scale));
  }
  face(target) { this.root.rotation.y = Math.atan2(target.x - this.pos.x, target.z - this.pos.z); }
  async moveTo(target, dur = 0.35) {
    this.face(target);
    const from = this.pos.clone(), back = target.distanceTo(from) > 0.2 && this.poz !== 'bekleme';
    if (this.hero && !back) this.set('saldiri-hazirlik');
    await tween(dur, k => { this.pos.lerpVectors(from, target, k); this.hop = Math.abs(Math.sin(k * Math.PI * 2)) * 0.08; }, ease.inOut);
    this.hop = 0;
  }
  relax() { } ready() { if (!this.dead) this.set('bekleme'); }
  async swing() {
    this.set(this.hero ? 'saldiri-hazirlik' : 'bekleme');
    await to(this, { lunge: -0.25 }, 0.18, ease.out);
    this.set(this.hero ? 'saldiri-vurus' : 'saldiri');
    await to(this, { lunge: 0.55 }, 0.07, ease.in);
    to(this, { lunge: 0 }, 0.4, ease.out).then(() => wait(0.05)).then(() => this.ready());
  }
  async whirl() { await this.swing(); this.set(this.hero ? 'saldiri-vurus' : 'saldiri'); await to(this, { tilt: 0.12 }, 0.12); await to(this, { tilt: 0 }, 0.2); this.ready(); }
  async castSpell() {
    this.set(this.hero ? 'buyu' : 'saldiri');
    await to(this, { lunge: 0.15, hop: 0.04 }, 0.25, ease.out);
    await to(this, { lunge: 0, hop: 0 }, 0.1);
    wait(0.35).then(() => this.ready());
  }
  async raiseArms() { this.set(this.hero ? 'buyu' : 'saldiri'); await to(this, { hop: 0.08 }, 0.3, ease.out); wait(0.35).then(() => { to(this, { hop: 0 }, 0.3); this.ready(); }); }
  async shoot() { this.set(this.hero ? 'saldiri-hazirlik' : 'bekleme'); await wait(0.18); this.set(this.hero ? 'saldiri-vurus' : 'saldiri'); await to(this, { lunge: 0.2 }, 0.12); to(this, { lunge: 0 }, 0.3).then(() => wait(0.15)).then(() => this.ready()); }
  async stomp() {
    this.set(this.hero ? 'saldiri-hazirlik' : 'bekleme');
    await to(this, { hop: 0.55 }, 0.22, ease.out);
    this.set(this.hero ? 'saldiri-vurus' : 'saldiri');
    await to(this, { hop: 0 }, 0.12, ease.in);
    camRig.shake = Math.max(camRig.shake, 0.25);
    wait(0.3).then(() => this.ready());
  }
  // Vurulma: kırmızı parlama, geri savrulma, vurulma pozu. Ağır vuruşta (kritik, özel yetenek) kısa donma ve ekran sarsıntısı (M2 bulgusu)
  hit(from, heavy = false) {
    if (this.dead) return;
    this.flash = 1;
    const home = this.pos.clone(), dir = from ? this.pos.clone().sub(from).setY(0).normalize() : new THREE.Vector3();
    const k = (heavy ? 0.45 : 0.22) / this.scale;
    this.set('vurulma');
    if (heavy) { hitStop(0.06); camRig.shake = Math.max(camRig.shake, 0.18); }
    tween(0.08, e => this.pos.copy(home).addScaledVector(dir, k * e), ease.out).then(() => tween(0.3, e => this.pos.copy(home).addScaledVector(dir, k * (1 - e)), ease.inOut));
    to(this, { tilt: heavy ? -0.08 : -0.04 }, 0.07).then(() => to(this, { tilt: 0 }, 0.3, ease.back));
    const n = this.deathN; wait(0.42).then(() => { if (!this.dead && n === this.deathN && this.poz === 'vurulma') this.ready(); });
  }
  async die() {
    this.dead = true;
    const n = ++this.deathN;
    this.set(this.hero ? 'yere-dusus' : 'vurulma');
    if (!this.hero) await to(this, { tilt: -0.5, hop: -0.05 }, 0.45, ease.in); else await wait(0.45);
    await wait(0.25);
    if (n !== this.deathN) return;
    fxPlay(EVENT_FX.kill, this);
    await tween(0.9, k => { if (n === this.deathN) this.mat.opacity = 1 - k; });
    if (n === this.deathN) this.root.visible = false;
  }
  revive(face, home) {
    this.deathN++; this.dead = false; this.tilt = 0; this.hop = 0; this.lunge = 0;
    this.root.visible = true; this.root.rotation.set(0, face, 0); if (home) this.pos.copy(home);
    this.mat.opacity = this.d ? 1 : 0; this.set('bekleme');
  }
  cheer() { if (this.dead) return; this.set(this.hero ? 'zafer' : 'saldiri'); to(this, { hop: 0.12 }, 0.25, ease.out).then(() => to(this, { hop: 0 }, 0.35)); }
  dispose() { this.root.parent?.remove(this.root); this.mesh.geometry.dispose(); this.mat.dispose(); this.golge.geometry.dispose(); this.golge.material.dispose(); }
}
