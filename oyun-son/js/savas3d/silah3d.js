// 3B Savaş Faz 1 · silah ve kalkan geometrileri (Opus, 27.11)
// Kodla üretilen, kredisiz, PBR malzemeli el silahları. Hepsi aynı kurala uyar (STANDART.md "Silah yerel uzayı"):
//   - başlangıç noktası (0,0,0) = elin kavradığı nokta (kabzanın ortası),
//   - uzun eksen +Y (namlu / sap yukarı), kesici ağız ±X, düz yüz +Z,
//   - ölçü metre (2,3 m boylu kahramana göre), üçgen sayısı ≤ 1500, tek parça Group.
// Kalkanlarda başlangıç noktası = kolun tuttuğu sap; ön yüz +Z, boy ekseni +Y.
// GPT/Gemini'den gelecek GLB silahlar aynı yerel uzayla verilirse soket ayarı değişmeden takılır (silahGlb()).
import { THREE } from '../engine3d.js';

const M = {}; // ortak malzemeler (tüm birimler paylaşır; dispose edilmez)
function mat(ad, o) { return M[ad] ||= new THREE.MeshStandardMaterial(o); }
const celik = () => mat('celik', { color: 0xd8dde4, metalness: 0.92, roughness: 0.28 });
const koyuCelik = () => mat('koyuCelik', { color: 0x6f7680, metalness: 0.85, roughness: 0.4 });
const altin = () => mat('altin', { color: 0xc9a25a, metalness: 0.9, roughness: 0.35 });
const deri = () => mat('deri', { color: 0x4a3020, metalness: 0.0, roughness: 0.85 });
const tahta = () => mat('tahta', { color: 0x6b4a2e, metalness: 0.0, roughness: 0.8 });
const kemik = () => mat('kemik', { color: 0xcfc4a6, metalness: 0.0, roughness: 0.7 });
const kristal = renk => mat('kristal' + renk, { color: renk, emissive: renk, emissiveIntensity: 1.4, metalness: 0.1, roughness: 0.15 });

const mesh = (g, m) => { const o = new THREE.Mesh(g, m); o.castShadow = true; return o; };
function ekstrude(noktalar, kalinlik, egim = 0.004) {
  const s = new THREE.Shape(); noktalar.forEach(([x, y], i) => i ? s.lineTo(x, y) : s.moveTo(x, y));
  const g = new THREE.ExtrudeGeometry(s, { depth: kalinlik, bevelEnabled: egim > 0, bevelThickness: egim, bevelSize: egim, bevelSegments: 1, curveSegments: 6 });
  g.translate(0, 0, -kalinlik / 2); return g;
}

// ---- Kılıç (Elentha savaşçısı): uzun düz ağız, oluklu, haç biçimli siper, deri kabza, topuz ----
function kilic() {
  const g = new THREE.Group(), L = 0.92, W = 0.05;
  g.add(mesh(ekstrude([[-W, 0.12], [W, 0.12], [W * 0.82, L * 0.82], [0, L], [-W * 0.82, L * 0.82]], 0.012, 0.006), celik()));
  const oluk = mesh(new THREE.BoxGeometry(0.014, L * 0.6, 0.026), koyuCelik()); oluk.position.y = 0.12 + L * 0.32; g.add(oluk);
  const siper = mesh(new THREE.BoxGeometry(0.3, 0.035, 0.05), altin()); siper.position.y = 0.1; g.add(siper);
  for (const s of [-1, 1]) { const u = mesh(new THREE.SphereGeometry(0.03, 8, 6), altin()); u.position.set(s * 0.15, 0.1, 0); g.add(u); }
  const kabza = mesh(new THREE.CylinderGeometry(0.022, 0.025, 0.2, 8), deri()); kabza.position.y = -0.0; g.add(kabza);
  const top = mesh(new THREE.SphereGeometry(0.038, 10, 8), altin()); top.position.y = -0.12; g.add(top);
  return g;
}
// ---- Hançer ----
function hancer() {
  const g = new THREE.Group(), L = 0.42, W = 0.035;
  g.add(mesh(ekstrude([[-W, 0.08], [W, 0.08], [W * 0.6, L * 0.75], [0, L], [-W * 0.9, L * 0.6]], 0.01, 0.004), celik()));
  const siper = mesh(new THREE.BoxGeometry(0.14, 0.025, 0.035), koyuCelik()); siper.position.y = 0.07; g.add(siper);
  g.add(mesh(new THREE.CylinderGeometry(0.018, 0.02, 0.13, 8), deri()));
  const top = mesh(new THREE.SphereGeometry(0.026, 8, 6), koyuCelik()); top.position.y = -0.08; g.add(top);
  return g;
}
// ---- Topuz (rahip): kanatlı demir baş ----
function topuz() {
  const g = new THREE.Group();
  const sap = mesh(new THREE.CylinderGeometry(0.022, 0.026, 0.62, 8), tahta()); sap.position.y = 0.18; g.add(sap);
  const bas = mesh(new THREE.SphereGeometry(0.07, 10, 8), koyuCelik()); bas.position.y = 0.5; g.add(bas);
  for (let i = 0; i < 6; i++) { const k = mesh(new THREE.BoxGeometry(0.02, 0.16, 0.08), celik()); k.position.y = 0.5; k.rotation.y = i * Math.PI / 3; k.translateZ(0.06); g.add(k); }
  const top = mesh(new THREE.SphereGeometry(0.03, 8, 6), altin()); top.position.y = -0.13; g.add(top);
  return g;
}
// ---- Asa (büyücü / ölücü): uzun sap, taç ve ışıyan taş ----
function asa(renk = 0x8fd0ff) {
  const g = new THREE.Group();
  const sap = mesh(new THREE.CylinderGeometry(0.02, 0.026, 1.6, 8), tahta()); sap.position.y = 0.35; g.add(sap);
  const tac = mesh(new THREE.TorusGeometry(0.06, 0.012, 6, 14), altin()); tac.position.y = 1.18; g.add(tac);
  const tas = mesh(new THREE.OctahedronGeometry(0.06, 0), kristal(renk)); tas.position.y = 1.2; tas.scale.y = 1.5; tas.castShadow = false; g.add(tas);
  g.userData.isik = tas; // birim3d: büyüde parlatılır
  return g;
}
// ---- Sopa (goblin): budaklı, çivili odun ----
function sopa() {
  const g = new THREE.Group();
  const ana = mesh(new THREE.CylinderGeometry(0.075, 0.03, 0.7, 8), tahta()); ana.position.y = 0.25; g.add(ana);
  for (let i = 0; i < 7; i++) { const c = mesh(new THREE.ConeGeometry(0.016, 0.07, 5), koyuCelik()); const a = i * 2.4, y = 0.38 + (i % 3) * 0.08; c.position.set(Math.cos(a) * 0.065, y, Math.sin(a) * 0.065); c.lookAt(Math.cos(a) * 2, y, Math.sin(a) * 2); c.rotateX(Math.PI / 2); g.add(c); }
  return g;
}
// ---- Yay (suikastçı yay ağacı) ----
function yay() {
  const g = new THREE.Group();
  const kol = mesh(new THREE.TorusGeometry(0.55, 0.018, 6, 24, Math.PI * 0.75), tahta()); kol.rotation.z = Math.PI / 2 - Math.PI * 0.375; kol.position.x = -0.45; g.add(kol);
  const uc = Math.PI * 0.375, x = -0.45 + Math.cos(uc) * 0.55, y = Math.sin(uc) * 0.55;
  const kiris = mesh(new THREE.CylinderGeometry(0.003, 0.003, 2 * y, 3), kemik()); kiris.position.x = x; g.add(kiris);
  g.add(mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.14, 8), deri()));
  return g;
}

// ---- Kalkan: Elentha kuleli (heater) kalkan, gümüş kenar, gök mavisi yüz, kodla çizilen güneş arması ----
let armaDoku = null;
function arma() {
  if (armaDoku) return armaDoku;
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  const r = x.createLinearGradient(0, 0, 0, 256); r.addColorStop(0, '#2c4f86'); r.addColorStop(1, '#16294a'); x.fillStyle = r; x.fillRect(0, 0, 256, 256);
  x.translate(128, 118); x.fillStyle = '#e8d29a'; x.strokeStyle = '#e8d29a';
  for (let i = 0; i < 12; i++) { x.save(); x.rotate(i * Math.PI / 6); x.beginPath(); x.moveTo(-7, 30); x.lineTo(0, 64); x.lineTo(7, 30); x.fill(); x.restore(); }
  x.beginPath(); x.arc(0, 0, 26, 0, Math.PI * 2); x.fill();
  armaDoku = new THREE.CanvasTexture(c); armaDoku.colorSpace = THREE.SRGBColorSpace; return armaDoku;
}
function kalkan() {
  const g = new THREE.Group(), w = 0.34, h = 0.48;
  const bicim = k => [[-w * k, h * k], [w * k, h * k], [w * k, -0.05 * k], [0.12 * k, -h * 0.85 * k], [0, -h * k], [-0.12 * k, -h * 0.85 * k], [-w * k, -0.05 * k]];
  const yuzG = ekstrude(bicim(1), 0.035, 0.012);
  // UV: düz yüze arma dokusu (x,y → 0..1)
  const uv = yuzG.attributes.uv, p = yuzG.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, (p.getX(i) + w) / (2 * w), (p.getY(i) + h) / (2 * h));
  const yuz = mesh(yuzG, mat('kalkanYuz', { map: arma(), metalness: 0.35, roughness: 0.55 })); g.add(yuz);
  const kenar = mesh(ekstrude(bicim(1.07), 0.025, 0.008), celik()); kenar.position.z = -0.012; g.add(kenar);
  const gobek = mesh(new THREE.SphereGeometry(0.06, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), altin()); gobek.rotation.x = Math.PI / 2; gobek.position.set(0, 0.05, 0.03); g.add(gobek);
  // kalkanın merkezi kolun dış yanına gelir: sap (başlangıç noktası) arka yüzün ortası
  g.children.forEach(o => { o.position.z += 0.06; });
  return g;
}
// Ölücü / şaman taşı rengi
const ASA_RENK = { mor: 0xb07aff, yesil: 0x8dff7a, mavi: 0x8fd0ff, kizil: 0xff7a4a };

const YAPICI = { kilic, hancer, topuz, asa, sopa, yay, kalkan };
export const SILAH_TURLERI = Object.keys(YAPICI);
/** Kodla silah üret. tur: kilic|hancer|topuz|asa|sopa|yay|kalkan; secenek.renk: asa taşı ('mor'|'yesil'|… ya da sayı). */
export function silahYap(tur, secenek = {}) {
  const f = YAPICI[tur]; if (!f) return null;
  const r = secenek.renk; const g = tur === 'asa' ? asa(typeof r === 'number' ? r : ASA_RENK[r] || 0x8fd0ff) : f();
  g.name = 'silah:' + tur; g.userData.tur = tur;
  return g;
}
/** Hazır GLB silah (models/items, models/weapons) — aynı yerel uzayla verildiyse. Kopya döner. */
export function silahGlb(sahne, olcek = 1) { const g = sahne.clone(true); g.scale.multiplyScalar(olcek); g.traverse(o => { if (o.isMesh) o.castShadow = true; }); return g; }
/** Savaş efektleri (fx.js weaponFx) için tür adı. */
export const FX_TUR = { kilic: 'sword', hancer: 'dagger', topuz: 'mace', asa: 'staff', sopa: 'club', yay: 'bow', kalkan: 'sword' };
/** Üçgen sayısı (bütçe denetimi). */
export function ucgen(g) { let n = 0; g.traverse(o => { if (o.isMesh) n += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; }); return Math.round(n); }
/** Birimin kendi silah geometrilerini sil (malzemeler ortaktır, kalır). */
export function silahSil(g) { g?.traverse(o => { if (o.isMesh) o.geometry.dispose(); }); }
