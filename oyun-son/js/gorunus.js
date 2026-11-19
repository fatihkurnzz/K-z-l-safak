// Karakter görünüşü (sürüm 12): oyuncunun oluşturma ekranında seçtiği yüz, saç, sakal, renkler, vücut ve boy 3B modele
// burada uygulanır. Seçenek tabloları shared/gorunus.js'tedir (sunucu da aynı tabloyla denetler).
//
// DÜRÜST DURUM: oyunda yüzü, saçı ya da kadın gövdesi değiştirilebilen gerçek (dokulu, iskeletli) bir model YOK.
// Buradaki her şey koddan üretilir: kafa, yüz hatları, gözler, ork çenesi ve dişleri, saç ve sakal basit geometrilerdir;
// kadın gövdesi aynı prosedürel gövdenin inceltilmiş oranlarıdır. Arayüz bunu "geçici model" olarak açıkça yazar (PLACEHOLDER).
//
// Kayıt defteri (registerLook): gerçek bir kafa / saç / sakal modeli gelince aynı kimliğe bağlanır; kurucu işlev bir
// THREE.Object3D döndürür ve kafa grubuna eklenir (kafa yerelinde: y yukarı, +z yüzün baktığı yön, kafatası merkezi y≈0.17).
//   registerLook('hair', 'sancak.f.3', ctx => …)   ·   anahtar: ırk.cinsiyet.kimlik  ya da  ırk.*.kimlik  ya da  *.*.kimlik
//   ctx = { M (Mats), skinM, hairM, ch (görünüş kaydı), P (yüz parametreleri) }
//
// Oyundaki kahramana bağlantı: skinned.js createSkinned → charLookFor(unit). Oyuncunun kendi kahramanı (savaşta A tarafı,
// ana üste, karakter seçmede unit.charLook) bu görünüşle prosedürel modelde çizilir; combat.js / ui-hub.js değişmez.
import { THREE } from './engine3d.js';
import { LOOK_RACES } from '../shared/gorunus.js';

export const PLACEHOLDER = {
  model: 'Geçici model: kafa, yüz, saç ve sakal koddan üretilir. Dokulu gerçek karakter modelleri henüz yok.',
  female: 'Kadın gövdesi geçici: aynı gövdenin inceltilmiş oranları. Ayrı kadın modeli henüz yok.',
};
// İskeletli (dokulu) modellerin kendi kafası, saçı ve kaskı dokuya gömülüdür: görünüş uygulanamaz. Oyuncunun kahramanı bu
// yüzden prosedürel modelle çizilir (her yerde aynı görünsün). Gerçek modüler model gelince true yapılabilir.
export const SKINNED_HERO = false;

// ---------- Kayıt defteri ----------
const REG = { head: new Map(), hair: new Map(), beard: new Map() };
export function registerLook(kind, key, build) { if (!REG[kind]) throw new Error('kind'); REG[kind].set(key, build); }
const reg = (kind, ch, id) => REG[kind].get(`${ch.race}.${ch.gender}.${id}`) || REG[kind].get(`${ch.race}.*.${id}`) || REG[kind].get(`*.*.${id}`);

// ---------- Oyuncunun kahramanı ----------
let src = null;
export const setLookSource = fn => { src = fn; };
// Birimin görünüşü: açıkça verilmiş (charLook: karakter seçme/oluşturma) ya da oyuncunun kendi kahramanı (h0, rakip değil, adı tutar)
export function charLookFor(unit) {
  if (!unit) return null;
  if (unit.charLook && LOOK_RACES.includes(unit.charLook.race)) return unit.charLook;
  const m = unit.model;
  if (!m?.hero || unit.key !== 'h0' || unit.side === 'B') return null;
  const L = src?.();
  if (!L || !LOOK_RACES.includes(L.race)) return null;
  if (unit.name && L.name && unit.name !== L.name) return null;
  if (unit.cls && L.cls && unit.cls !== L.cls) return null;
  return L;
}

// ---------- Yardımcılar ----------
const mesh = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; return m; };
const sph = (r, ws = 14, hs = 10, ts = 0, tl = Math.PI) => new THREE.SphereGeometry(r, ws, hs, 0, Math.PI * 2, ts, tl);
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const cone = (r, h, s = 8) => new THREE.ConeGeometry(r, h, s);
const col = h => new THREE.Color(h);
const mix = (a, b, k) => col(a).lerp(col(b), k);

// ---------- Yüz parametreleri ----------
// sk: kafatası ölçeği · jaw: çene genişliği/yüksekliği/ileri çıkıklığı · chin · nose: [genişlik, yükseklik, uzunluk, kemer]
// brow: kaş eğimi · ridge: kaş çıkıntısı (ork) · eye: göz boyu/aralığı/çekikliği · ear: kulak boyu · tusk: diş boyu · scar
const HUMAN = [
  { sk: [0.93, 1.08, 1], jaw: [0.84, 1.0, 0], chin: 1.15, nose: [0.85, 1, 1.25, 0], brow: -0.22, eye: [1, 1, 0.12], ear: 1 },
  { sk: [0.98, 1.03, 1], jaw: [0.94, 0.92, 0], chin: 0.85, nose: [0.8, 0.85, 0.8, 0], brow: 0.05, eye: [1.12, 1, 0], ear: 0.95 },
  { sk: [1.04, 1.0, 1.02], jaw: [1.12, 1.05, 0.01], chin: 1.0, nose: [1.3, 1, 1.0, 0], brow: -0.05, eye: [0.95, 1.05, 0], ear: 1.05 },
  { sk: [0.9, 1.13, 1], jaw: [0.86, 1.12, 0], chin: 1.25, nose: [0.75, 1.15, 1.2, 0.3], brow: -0.12, eye: [0.95, 0.95, 0.08], ear: 0.95, cheek: 1 },
  { sk: [1.0, 1.04, 1], jaw: [1.06, 1.05, 0.01], chin: 1.05, nose: [1.1, 1, 1.05, 0.15], brow: -0.3, eye: [0.92, 1, 0.05], ear: 1, scar: 1 },
];
const ORC = [
  { sk: [1.08, 0.96, 1.02], jaw: [1.28, 1.15, 0.05], chin: 1.0, nose: [1.5, 0.8, 0.85, 0], ridge: 1.0, brow: -0.25, eye: [0.82, 1.1, 0.1], ear: 1, tusk: [1, 1] },
  { sk: [1.12, 0.94, 1.02], jaw: [1.45, 1.25, 0.07], chin: 1.25, nose: [1.6, 0.75, 0.75, 0], ridge: 1.1, brow: -0.15, eye: [0.78, 1.15, 0.05], ear: 0.9, tusk: [1.3, 1.3] },
  { sk: [1.06, 0.98, 1.02], jaw: [1.25, 1.12, 0.05], chin: 1.05, nose: [1.4, 0.8, 0.9, 0.1], ridge: 1.0, brow: -0.3, eye: [0.8, 1.1, 0.12], ear: 1, tusk: [1.1, 0.45], scar: 1 },
  { sk: [1.0, 1.0, 1.04], jaw: [1.15, 1.05, 0.06], chin: 0.95, nose: [1.3, 0.85, 1.0, 0], ridge: 0.85, brow: -0.4, eye: [0.85, 1.05, 0.28], ear: 1.4, tusk: [0.85, 0.85] },
  { sk: [1.1, 0.95, 1.03], jaw: [1.3, 1.15, 0.05], chin: 1.1, nose: [1.35, 1.0, 1.15, 0.45], ridge: 1.45, brow: -0.2, eye: [0.75, 1.1, 0.05], ear: 1, tusk: [1.05, 1.05] },
];
export function faceParams(ch) {
  const orc = ch.race === 'ocak', T = orc ? ORC : HUMAN, f = ch.gender === 'f';
  const P = structuredClone(T[ch.face] || T[0]);
  P.orc = orc; P.fem = f;
  if (f) { // kadın: daha dar çene, küçük burun, ince kaş; orkta dişler küçülür ama kalır
    P.sk = [P.sk[0] * 0.96, P.sk[1] * 0.99, P.sk[2] * 0.98];
    P.jaw = [P.jaw[0] * (orc ? 0.86 : 0.88), P.jaw[1] * 0.9, P.jaw[2] * 0.7]; P.chin *= 0.88;
    P.nose = [P.nose[0] * 0.8, P.nose[1] * 0.88, P.nose[2] * 0.85, P.nose[3] * 0.5];
    P.eye = [P.eye[0] * 1.1, P.eye[1], P.eye[2]];
    if (orc) { P.ridge *= 0.72; P.tusk = [P.tusk[0] * 0.72, P.tusk[1] * 0.72]; }
  }
  return P;
}

// ---------- Kafa ----------
// Kafa grubu (gövdenin 0.95 yüksekliğine bağlanır). Kafatası merkezi y 0.17, yüz +z yönünde.
export function buildCharHead(c, ch, look = {}) {
  const M = c.M, P = faceParams(ch), orc = P.orc, fem = P.fem;
  const skinM = c.skinM, hairM = M.leather(ch.hairColor, { roughness: 0.75 });
  const darkSkin = M.skin(mix(ch.skin, '#000000', 0.28));
  const ctx = { M, skinM, hairM, ch, P };
  const head = new THREE.Group();
  const own = reg('head', ch, ch.face);
  if (own) { head.add(own(ctx)); } else {
    // kafatası
    const sk = mesh(sph(0.19, 18, 14), skinM, 0, 0.17, 0); sk.scale.set(...P.sk); head.add(sk);
    // çene / alt yüz: orkta ileri çıkık ve geniş (ağız bölgesi)
    const [jw, jh, jz] = P.jaw;
    const jaw = mesh(sph(0.15, 16, 12), skinM, 0, orc ? 0.05 : 0.075, (orc ? 0.03 : 0.012) + jz); jaw.scale.set(jw * (orc ? 0.92 : 0.88), jh * (orc ? 0.72 : 0.68), orc ? 1.0 : 0.86); head.add(jaw);
    const chin = orc ? mesh(sph(0.06, 10, 8), skinM, 0, -0.02, 0.15 + jz) : mesh(sph(0.042, 10, 8), skinM, 0, 0.012 - 0.01 * P.chin, 0.118 + jz); chin.scale.set(P.jaw[0] * (orc ? 1.5 : 1.0), 0.8 * P.chin, orc ? 0.85 : 0.7); head.add(chin);
    if (P.cheek) for (const s of [-1, 1]) { const ck = mesh(sph(0.045, 10, 8), skinM, s * 0.095, 0.115, 0.135); ck.scale.set(1.2, 0.8, 0.8); head.add(ck); }
    // burun
    const [nw, nh, nl, hook] = P.nose;
    if (orc) {
      const n = mesh(sph(0.042, 12, 8), skinM, 0, 0.12, 0.2 + jz * 0.6); n.scale.set(nw * 0.95, nh * 0.85, nl * 0.75); head.add(n);
      const bridge = mesh(box(0.035 * nw, 0.07, 0.04), skinM, 0, 0.16, 0.185); bridge.rotation.x = -0.35 - hook * 0.4; head.add(bridge);
      for (const s of [-1, 1]) head.add(mesh(sph(0.012, 6, 5), M.skin('#1a120c'), s * 0.022 * nw, 0.105, 0.225 + jz * 0.6));
    } else {
      const n = mesh(box(0.028 * nw, 0.075 * nh, 0.035 * nl), skinM, 0, 0.13, 0.182 + 0.008 * nl); n.rotation.x = -0.32 - hook * 0.3; head.add(n);
      const tip = mesh(sph(0.018 * nw, 8, 6), skinM, 0, 0.103, 0.196 + 0.014 * nl); tip.scale.set(1.15, 0.9, 1); head.add(tip);
    }
    // gözler: ak, iris (göz rengi, hafif ışıyan: uzaktan da okunur), bebek
    const [es, eg, slant] = P.eye, ey = orc ? 0.17 : 0.175, ez = orc ? 0.155 : 0.163, ex = 0.064 * eg;
    const white = M.add(new THREE.MeshStandardMaterial({ color: orc ? '#d8c890' : '#f2ede4', roughness: 0.3, metalness: 0 }));
    const iris = M.add(new THREE.MeshStandardMaterial({ color: ch.eyeColor, emissive: col(ch.eyeColor), emissiveIntensity: orc ? 0.9 : 0.35, roughness: 0.25, metalness: 0 }));
    const pupil = M.add(new THREE.MeshStandardMaterial({ color: '#080605', roughness: 0.2, metalness: 0 }));
    for (const s of [-1, 1]) {
      const g = new THREE.Group(); g.position.set(s * ex, ey, ez); g.rotation.z = s * slant; head.add(g);
      const w = mesh(sph(0.024 * es, 12, 8), white); w.scale.set(1.25, fem ? 0.75 : 0.6, 0.45); g.add(w);
      const ir = mesh(sph(0.0155 * es, 10, 8), iris, 0, 0, 0.008); ir.scale.set(1, 1, 0.6); g.add(ir);
      g.add(mesh(sph(0.0075 * es, 8, 6), pupil, 0, 0, 0.0145));
      if (fem) { const l = mesh(box(0.06 * es, 0.009, 0.012), M.skin('#18120e'), 0, 0.016, 0.008); l.rotation.z = -s * 0.15; g.add(l); } // kirpik
      // kaş: insanda saç renginde ince çizgi; orkta kalın, saç renginde
      const b = mesh(box(fem ? 0.06 : 0.07, fem ? 0.009 : orc ? 0.02 : 0.015, 0.02), hairM, s * 0.004, orc ? 0.045 : 0.033, orc ? 0.025 : 0.012);
      b.rotation.z = s * P.brow * (fem ? 0.6 : 1); g.add(b);
    }
    // ork kaş çıkıntısı: gözlerin üstünde ileri taşan kemik
    if (orc) { const r = mesh(box(0.25 * P.sk[0], 0.05 * P.ridge, 0.075 * P.ridge), skinM, 0, ey + 0.035, ez + 0.005); r.rotation.x = 0.25; head.add(r);
      const r2 = mesh(sph(0.11, 12, 6, 0, Math.PI / 2), skinM, 0, ey + 0.02, ez - 0.03); r2.scale.set(1.1 * P.sk[0], 0.5 * P.ridge, 0.75 * P.ridge); head.add(r2); }
    // ağız
    const mouthY = orc ? 0.045 : 0.06, mouthZ = (orc ? 0.19 : 0.153) + jz;
    head.add(mesh(box(orc ? 0.11 * P.jaw[0] : 0.06, fem ? 0.012 : 0.009, 0.012), fem ? M.skin(mix(ch.skin, '#a8323e', 0.55)) : darkSkin, 0, mouthY, mouthZ));
    // kulaklar: insanda küçük yuvarlak; orkta sivri, geriye yatık
    for (const s of [-1, 1]) {
      if (orc) { const e = mesh(cone(0.04, 0.17 * P.ear, 5), skinM, s * 0.2 * P.sk[0], 0.18, -0.02); e.rotation.set(-0.35, 0, -s * 1.2); head.add(e); }
      else { const e = mesh(sph(0.04, 8, 8), skinM, s * 0.18 * P.sk[0], 0.16, -0.005); e.scale.set(0.35, 1.05 * P.ear, 0.7); head.add(e); }
    }
    // ork dişleri: alt çeneden yukarı çıkan iki diş (kadında daha küçük); Yaralı yüzde biri kırık
    if (orc) {
      const tM = M.leather('#efe4c4', { roughness: 0.35 });
      for (const s of [-1, 1]) {
        const k = s < 0 ? P.tusk[0] : P.tusk[1], h = 0.085 * k;
        const t = mesh(cone(0.019 * Math.max(0.8, k), h, 6), tM, s * 0.05 * P.jaw[0], mouthY + h * 0.45 - 0.01, mouthZ - 0.005); t.rotation.set(-0.2, 0, -s * 0.22); head.add(t);
      }
      // kalın boyun (gövdenin ince boynunu örter)
      const nk = mesh(new THREE.CylinderGeometry(0.1, 0.13, 0.16, 12), skinM, 0, -0.05, -0.01); nk.scale.z = 0.85; head.add(nk);
    }
    // yara izi (alnın kenarından yanağa)
    if (P.scar) { const sc = mesh(box(0.012, 0.13, 0.01), M.skin(mix(ch.skin, '#7a2a20', 0.55)), 0.075 * eg, 0.17, ez + 0.022); sc.rotation.z = 0.35; head.add(sc); }
  }
  // saç ve sakal
  const hb = reg('hair', ch, ch.hair) || HAIR[ch.hair];
  if (hb) head.add(hb(ctx));
  if (ch.gender !== 'f' && ch.beard) { const bb = reg('beard', ch, ch.beard) || BEARD[ch.beard]; if (bb) head.add(bb(ctx)); }
  // sınıf başlığı: Büyücüde ışıyan taşlı alın bandı, Şifacıda ince altın taç (ışık teması; dini simge yok)
  if (ch.cls === 'mage' || ch.cls === 'priest') {
    const cm = M.gold(ch.cls === 'mage' ? 0x9a8a5a : 0xe0c060);
    const band = mesh(new THREE.TorusGeometry(0.192 * P.sk[0], 0.009, 6, 28), cm, 0, 0.24, 0); band.rotation.x = Math.PI / 2 + 0.18; band.scale.set(1, 1.08 * P.sk[2], 1); head.add(band);
    const gem = M.add(new THREE.MeshStandardMaterial({ color: look.fx ?? 0xffe9a0, emissive: col(look.fx ?? 0xffe9a0), emissiveIntensity: 1.6, roughness: 0.2, metalness: 0.2 }));
    head.add(mesh(new THREE.OctahedronGeometry(0.022), gem, 0, 0.27, 0.19));
  }
  return head;
}

// ---------- Saç biçimleri ----------
// Hepsi kafa yerelinde; kafatası yarıçapı ~0.19 (ırk/yüz ölçeği P.sk ile genişler)
function cap(ctx, r = 0.2, tilt = -0.28, cover = 0.52) {
  const { P, hairM } = ctx, g = new THREE.Group();
  const c = mesh(sph(r, 18, 10, 0, Math.PI * cover), hairM, 0, 0.17, -0.008); c.rotation.x = tilt; c.scale.set(P.sk[0] * 1.02, P.sk[1] * 1.0, P.sk[2] * 1.03); g.add(c);
  return g;
}
const backBlock = (ctx, h = 0.18, y = 0.1) => { const b = mesh(box(0.3 * ctx.P.sk[0], h, 0.1), ctx.hairM, 0, y, -0.14); b.rotation.x = 0.12; return b; };
function braid(hairM, x, y, z, n, r0, dy = 0.065, dz = -0.012) {
  const g = new THREE.Group();
  for (let i = 0; i < n; i++) { const r = r0 * (1 - i * 0.07); const s = mesh(sph(r, 8, 6), hairM, x, y - i * dy, z + i * dz); s.scale.set(1, 1.3, 1); g.add(s); }
  return g;
}
export const HAIR = {
  0: ctx => { // kazınmış: ten üstünde çok kısa saç gölgesi (kelde yok)
    const g = new THREE.Group();
    if (ctx.P.orc) return g;
    const m = ctx.M.skin(mix(ctx.ch.skin, ctx.ch.hairColor, 0.35));
    const c = mesh(sph(0.192, 16, 8, 0, Math.PI * 0.42), m, 0, 0.17, -0.01); c.rotation.x = -0.3; c.scale.set(...ctx.P.sk); g.add(c);
    return g;
  },
  1: ctx => { const g = cap(ctx, 0.2, -0.3); g.add(backBlock(ctx, 0.14, 0.12)); return g; },
  2: ctx => { // dağınık: kısa tutamlar
    const g = cap(ctx, 0.203, -0.3), { hairM, P } = ctx;
    const A = [[0, 0.37, 0.05, -0.5, 0], [0.09, 0.35, 0.06, -0.4, -0.5], [-0.09, 0.35, 0.07, -0.6, 0.5], [0.14, 0.3, -0.04, 0, -1], [-0.14, 0.3, -0.03, 0, 1], [0.05, 0.36, -0.1, 0.5, -0.3], [-0.05, 0.35, -0.12, 0.6, 0.3], [0.1, 0.24, 0.14, -1.2, -0.3]];
    for (const [x, y, z, rx, rz] of A) { const t = mesh(cone(0.04, 0.12, 5), hairM, x * P.sk[0], y, z); t.rotation.set(rx, 0, rz); g.add(t); }
    g.add(backBlock(ctx, 0.15, 0.12)); return g;
  },
  3: ctx => { // uzun: sırta inen saç ve yan perçemler
    const g = cap(ctx, 0.205, -0.25), { hairM, P } = ctx;
    const back = mesh(box(0.33 * P.sk[0], 0.46, 0.09), hairM, 0, -0.05, -0.16); back.rotation.x = 0.1; g.add(back);
    for (const s of [-1, 1]) { const l = mesh(box(0.06, 0.34, 0.1), hairM, s * 0.165 * P.sk[0], 0.0, 0.0); l.rotation.z = s * 0.06; g.add(l); }
    return g;
  },
  4: ctx => { // at kuyruğu
    const g = cap(ctx, 0.202, -0.32), { hairM, M } = ctx;
    const tail = mesh(new THREE.CylinderGeometry(0.045, 0.02, 0.38, 8), hairM, 0, 0.08, -0.25); tail.rotation.x = 0.35; g.add(tail);
    const tie = mesh(new THREE.TorusGeometry(0.04, 0.012, 6, 12), M.leather('#3a2414'), 0, 0.24, -0.2); tie.rotation.x = Math.PI / 2 - 0.6; g.add(tie);
    return g;
  },
  5: ctx => { const g = cap(ctx, 0.202, -0.32); g.add(braid(ctx.hairM, 0, 0.18, -0.2, 7, 0.038, 0.06, -0.008)); return g; }, // tek örgü
  6: ctx => { const g = cap(ctx, 0.2, -0.32); g.add(mesh(sph(0.075, 12, 10), ctx.hairM, 0, 0.33, -0.12)); g.add(backBlock(ctx, 0.1, 0.16)); return g; }, // topuz
  7: ctx => { // ibik: kazınmış yanlar, tepede dik yele
    const g = new THREE.Group(), { hairM, P } = ctx;
    for (let i = 0; i < 7; i++) { const a = -0.9 + i * 0.36; const f = mesh(box(0.035, 0.13 - Math.abs(i - 2.5) * 0.01, 0.075), hairM, 0, 0.17 + Math.cos(a) * 0.2 * P.sk[1], Math.sin(a) * 0.2 * P.sk[2]); f.rotation.x = a; g.add(f); }
    return g;
  },
  8: ctx => { // savaş örgüleri: iki yanda kalın örgü
    const g = cap(ctx, 0.203, -0.28), { hairM, P } = ctx;
    for (const s of [-1, 1]) g.add(braid(hairM, s * 0.17 * P.sk[0], 0.06, 0.02, 6, 0.036, 0.065, -0.004));
    g.add(backBlock(ctx, 0.16, 0.1)); return g;
  },
  9: ctx => { // alev perçem: geriye savrulmuş sivri tutamlar
    const g = cap(ctx, 0.203, -0.3), { hairM, P } = ctx;
    for (let i = 0; i < 6; i++) { const x = (-0.12 + i * 0.048) * P.sk[0]; const t = mesh(cone(0.05, 0.3, 5), hairM, x, 0.33, -0.08); t.rotation.set(-2.1 + Math.abs(i - 2.5) * 0.08, 0, -x * 1.6); g.add(t); }
    return g;
  },
};

// ---------- Sakal ----------
function jawShell(ctx, k = 1.06, color = ctx.hairM, from = 0.5) {
  const { P } = ctx, [jw, jh, jz] = P.jaw;
  const s = mesh(sph(0.15, 16, 10, Math.PI * from, Math.PI * (1 - from)), color, 0, P.orc ? 0.05 : 0.07, 0.03 + jz);
  s.scale.set(jw * 0.92 * k, jh * 0.72 * k, (P.orc ? 1.0 : 0.88) * k); return s;
}
export const BEARD = {
  1: ctx => { const g = new THREE.Group(); g.add(jawShell(ctx, 1.03, ctx.M.skin(mix(ctx.ch.skin, ctx.ch.hairColor, 0.55)), 0.45)); return g; }, // kirli sakal
  2: ctx => { const g = new THREE.Group(); g.add(jawShell(ctx, 1.08, ctx.hairM, 0.48)); g.add(BEARD[4](ctx)); return g; }, // kısa sakal
  3: ctx => { // uzun sakal
    const g = BEARD[2](ctx), z = 0.13 + ctx.P.jaw[2];
    const c = mesh(cone(0.085, 0.26, 8), ctx.hairM, 0, -0.1, z - 0.01); c.rotation.x = Math.PI + 0.25; g.add(c); return g;
  },
  4: ctx => { // bıyık (orkta uzun, sarkık)
    const g = new THREE.Group(), { P, hairM } = ctx, y = P.orc ? 0.075 : 0.085, z = (P.orc ? 0.2 : 0.18) + P.jaw[2];
    for (const s of [-1, 1]) {
      const m = mesh(box(0.06, 0.018, 0.02), hairM, s * 0.03, y, z); m.rotation.z = -s * 0.3; g.add(m);
      if (P.orc) { const d = mesh(new THREE.CylinderGeometry(0.01, 0.005, 0.14, 6), hairM, s * 0.07, y - 0.07, z - 0.01); g.add(d); }
    }
    return g;
  },
  5: ctx => { const g = new THREE.Group(); g.add(jawShell(ctx, 1.07, ctx.hairM, 0.55)); g.add(braid(ctx.hairM, 0, -0.04, 0.13 + ctx.P.jaw[2] + (ctx.P.orc ? 0.03 : 0), 4, 0.03, 0.055, 0.004)); return g; }, // örgülü sakal
  6: ctx => { const g = new THREE.Group(), z = (ctx.P.orc ? 0.17 : 0.14) + ctx.P.jaw[2]; const c = mesh(cone(0.035, 0.14, 6), ctx.hairM, 0, -0.06, z); c.rotation.x = Math.PI + 0.2; g.add(c); return g; }, // çene perçemi
};

// ---------- Vücut ve boy ----------
// Prosedürel gövdeyi (models.js Character) ağ birleştirmeden ÖNCE ölçekler: omuz genişliği, kol/bacak kalınlığı, kalça, boy.
// Kadın gövdesi: dar omuz, ince kol ve bacak, görece geniş kalça, biraz kısa (geçici: ayrı model yok).
export function applyBody(c, ch) {
  const fem = ch.gender === 'f', orc = ch.race === 'ocak';
  const bw = [0.88, 1, 1.13][ch.body] ?? 1, w = bw * (fem ? 0.86 : 1) * (orc ? 1.08 : 1);
  const limb = ([0.86, 1, 1.12][ch.body] ?? 1) * (fem ? 0.8 : 1) * (orc ? 1.1 : 1);
  c.torso.scale.set(w, 1, w * (fem ? 0.95 : 1));
  c.head.scale.set((orc ? 1.06 : fem ? 0.95 : 1) / w, 1 * (orc ? 1.03 : fem ? 0.97 : 1), (orc ? 1.06 : 0.97) / (w * (fem ? 0.95 : 1)));
  for (const a of [c.armL, c.armR]) { a.position.x *= w; a.scale.set(limb, 1, limb); }
  const hip = fem ? 1.04 : 1;
  for (const l of [c.legL, c.legR]) { l.position.x *= hip * (orc ? 1.06 : 1) * Math.sqrt(bw); l.scale.set(limb * (fem ? 1.08 : 1), 1, limb * (fem ? 1.08 : 1)); }
  const h = (typeof ch.height === 'number' ? Math.min(1.06, Math.max(0.94, ch.height)) : 1) * (fem ? 0.95 : 1) * (orc ? 1.04 : 1);
  c.root.scale.y *= h;
}
