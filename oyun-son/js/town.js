// Vahran Sınırı meydanındaki binalar: koddan üretilen low-poly modeller. Her binanın üstünde, arayüzün
// dokunulabilir etiket koyduğu bir bağlantı noktası vardır. Yerleşim ekran yönüne göre hesaplanır.
// Çizim: her binanın boyalı parçaları tek ağda birleşir (scenery.js: bakeRigid); renk, pürüzlülük ve metallik köşe verisine
// geçer, parçalara dikey renk geçişi ve zemine değen kenarda kararma pişirilir. Işıyan parçalar (pencere, kor, geçit) ayrı
// kalır ve günün evresine göre parlar (daylight.js: relightTown). Süsler: rüzgârda dalgalanan sancaklar, ocağın bacasından
// çıkan duman, mangal alevleri, binaların altında zemin lekesi.
import { THREE, scene, pick, gfx, particle } from './engine3d.js';
import { drawBanner } from './banner.js';
import { hideMerkez } from './merkez2d.js'; // boyalı ana merkez de kasabayla birlikte kalkar
import { validBanner } from '../shared/clan.js';
import { bakeRigid, batchMaterial, patchStd, blobField, flameMaterial, portalMaterial, disposeTree } from './scenery.js';

// Boyalı parça: yalnızca özellik taşır (bina kurulunca birleştirilir). Taş pürüzlü, çatı biraz daha düzgün, metal parlaktır.
const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.88, metalness: 0.03, flatShading: true, ...extra });
// Işıyan parça. night: 'win' pencere (gündüz söner, gece yanar) · 'fire' kor/alev (gece güçlenir) · yok: sabit
const glow = (color, k = 2.2, night = '') => { const m = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: k * (gfx.T.post ? 1 : 0.5), roughness: 0.4 }); m.userData.keep = true; if (night) m.userData.night = night; return m; };
function add(g, geo, m, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
  const o = new THREE.Mesh(geo, m);
  o.position.set(x, y, z); o.rotation.set(rx, ry, rz); o.castShadow = true; o.receiveShadow = true;
  g.add(o);
  return o;
}
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const cyl = (a, b, h, n = 8) => new THREE.CylinderGeometry(a, b, h, n);
const cone = (r, h, n = 4) => new THREE.ConeGeometry(r, h, n);

let STONE = 0x8a8478, DARK = 0x4a463e, ROOF = 0xb5472e;
const WOOD = 0x6a4526, WOOD2 = 0x8a5f34, GOLD = 0xd9b04a;
// Binalardaki sancaklar oyuncunun tarafının rengini taşır (showTown ayarlar)
const FLAGS = { ocak: 0xc2321e, sancak: 0x2f62b8 };
let FLAG = FLAGS.ocak;
// Irk paleti: Elentha beyaz taş + mavi çatı; Kragmir kızıl kaya + kara demir (çizimden önce modül renkleri değişir)
const PAL = { sancak: { STONE: 0xe2ddd0, DARK: 0x6f7b8a, ROOF: 0x2f62b8 }, ocak: { STONE: 0x6a4034, DARK: 0x1e1a18, ROOF: 0x5e2418 }, orta: { STONE: 0xc9a87c, DARK: 0x5a4630, ROOF: 0x8a5a2a } }; // orta: Yemin Pazarı (tarafsız kumtaşı)
// Oyuncu bir klandaysa Klan Karargâhı'nın direğinde klanının sancağı dalgalanır (showTown ayarlar)
let HQ_BANNER = null;
const hqTex = new Map(); // sancak dokusu sancak başına bir kez üretilir (ana üs her kuruluşta yeniden çizmesin)
function hqFlag() {
  const k = `${HQ_BANNER.a}.${HQ_BANNER.s}`;
  if (!hqTex.has(k)) { const t = new THREE.CanvasTexture(drawBanner(HQ_BANNER)); t.colorSpace = THREE.SRGBColorSpace; hqTex.set(k, t); }
  return hqTex.get(k);
}
// Sancak: direğe bağlı kenarı sabit, ucu rüzgârda dalgalanan kumaş. src: renk ya da doku
function flag(g, w, h, src, x, y, z) {
  const m = new THREE.MeshStandardMaterial({ ...(src.isTexture ? { map: src } : { color: src }), roughness: 0.85, metalness: 0, side: THREE.DoubleSide });
  m.userData.keep = true;
  if (gfx.T.dress) patchStd(m, { wind: 'flagX' });
  const o = new THREE.Mesh(new THREE.PlaneGeometry(w, h, 8, 3).translate(w / 2, 0, 0), m);
  o.position.set(x, y, z); o.castShadow = true; g.add(o);
  return o;
}
// Alev: gürültüyle yükselen kılıf (toplamalı); dibinde ışıyan kor. Renk ırka göre (konsept tablosu):
// Elentha gök mavisi alev + güneş altını kor, Kragmir kızıl alev + mor kor.
const FIRES = { sancak: { f: 0x58b4ff, g: 0xffc83a, portal: 0x3a8cf0, ring: 0x9fd0ff }, ocak: { f: 0xff3a22, g: 0xa83cff, portal: 0xc8241a, ring: 0xc77bff }, orta: { f: 0xffa83a, g: 0xffd36a, portal: 0xd8902a, ring: 0xffe0a0 } }; // portal: Kapı girdabı
let FIRE = FIRES.ocak;
const DOME_Y = 3.85; // Elentha’da CZ - PK tapınağının çatı sırtı: kubbe buraya oturur (bayrak direği kubbeden çıkar)
function fire(g, r, h, x, y, z, k = 1) {
  const m = flameMaterial(FIRE.f, k); m.userData.keep = true;
  const o = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.25, r, h, 10, 1, true), m);
  o.position.set(x, y + h / 2, z); o.renderOrder = 5; g.add(o);
  add(g, new THREE.SphereGeometry(r * 0.6, 8, 6), glow(FIRE.g, 3, 'fire'), x, y, z);
}

// Her bina: { build(g) → etiket yüksekliği }
const BUILD = {
  // Kapı: iki taş sütun, kemer ve parlayan geçit
  gate(g) {
    for (const s of [-1, 1]) { add(g, box(0.7, 3.4, 0.8), mat(STONE), s * 1.25, 1.7, 0); add(g, box(0.95, 0.3, 1.05), mat(DARK), s * 1.25, 3.5, 0); add(g, cone(0.5, 0.8), mat(ROOF), s * 1.25, 4.05, 0, 0, Math.PI / 4); }
    add(g, new THREE.TorusGeometry(1.25, 0.32, 6, 12, Math.PI), mat(STONE), 0, 3.3, 0);
    const pm = portalMaterial(FIRE.portal); pm.userData.keep = true;
    const portal = add(g, new THREE.CircleGeometry(1.05, 28), pm, 0, 2.0, 0.05); portal.scale.set(1, 1.55, 1); portal.castShadow = false; // geçidin girdabı
    add(g, new THREE.RingGeometry(0.5, 0.62, 20), glow(FIRE.ring, 0.9), 0, 2.0, 0.08).userData.spin = 1;
    add(g, box(3.6, 0.25, 1.4), mat(DARK), 0, 0.12, 0.1);
    return 4.9;
  },
  // Örs: taş ocak, baca, kor ve örs
  anvil(g) {
    add(g, box(2.6, 1.3, 2.0), mat(STONE), -0.3, 0.65, -0.4);
    add(g, box(0.8, 3.2, 0.8), mat(DARK), -1.1, 1.6, -0.8);
    add(g, box(1.0, 0.25, 1.0), mat(STONE), -1.1, 3.3, -0.8);
    add(g, box(1.3, 0.7, 0.3), glow(0xff6a1a, 2.6, 'fire'), -0.2, 0.75, 0.62);
    fire(g, 0.42, 0.75, -0.2, 0.8, 0.72, 0.8); // ocağın ağzındaki alev
    g.userData.smoke = new THREE.Vector3(-1.1, 3.5, -0.8); // bacanın ağzı (duman buradan çıkar: updateTown)
    add(g, cone(2.1, 1.1), mat(ROOF, { roughness: 0.7 }), -0.3, 2.3, -0.4, 0, Math.PI / 4);
    for (const [x, z] of [[-1.5, 0.5], [0.9, 0.5]]) add(g, box(0.18, 1.5, 0.18), mat(WOOD), x, 1.4, z);
    add(g, box(0.9, 0.3, 0.45), mat(0x3a3d44, { metalness: 0.7, roughness: 0.35 }), 1.6, 0.95, 0.9);
    add(g, box(0.4, 0.45, 0.3), mat(0x3a3d44, { metalness: 0.7, roughness: 0.35 }), 1.6, 0.6, 0.9);
    add(g, box(0.7, 0.35, 0.5), mat(WOOD), 1.6, 0.2, 0.9);
    return 3.9;
  },
  // Maden: kaya, ahşap payandalı karanlık giriş, cevher arabası
  mine(g) {
    add(g, new THREE.DodecahedronGeometry(2.0, 0), mat(0x6a6660), 0, 1.2, -0.8).scale.set(1.3, 1, 1);
    add(g, new THREE.DodecahedronGeometry(1.2, 0), mat(0x7a756c), 1.8, 0.7, -0.3);
    add(g, box(1.3, 1.6, 0.3), mat(0x0c0a08), 0, 0.8, 0.75);
    for (const s of [-1, 1]) add(g, box(0.22, 1.8, 0.3), mat(WOOD2), s * 0.75, 0.9, 0.85);
    add(g, box(1.9, 0.24, 0.34), mat(WOOD2), 0, 1.85, 0.85);
    add(g, box(0.9, 0.5, 0.6), mat(WOOD), 1.5, 0.45, 1.3);
    add(g, new THREE.DodecahedronGeometry(0.3, 0), glow(0x7fd1ff, 1.4), 1.4, 0.85, 1.3);
    add(g, new THREE.DodecahedronGeometry(0.25, 0), glow(0xffd36a, 1.4), 1.7, 0.82, 1.25);
    return 3.6;
  },
  // Pazar (sürüm 13'ten beri yalnız oyuncu pazarı; Yemin Pazarı'nda 'pazar' kimliğiyle): çizgili tenteli tezgâh ve sandıklar
  market(g) {
    for (const [x, z] of [[-1.3, -0.6], [1.3, -0.6], [-1.3, 0.7], [1.3, 0.7]]) add(g, cyl(0.09, 0.09, 2.3, 6), mat(WOOD), x, 1.15, z);
    for (let i = 0; i < 5; i++) add(g, box(0.6, 0.12, 1.9), mat(i % 2 ? 0xe8dcc0 : 0x3d6fb6), -1.2 + i * 0.6, 2.42 - Math.abs(i - 2) * 0.05, 0.05, 0.22);
    add(g, box(2.6, 0.9, 0.8), mat(WOOD2), 0, 0.45, 0.5);
    for (const [x, c] of [[-0.8, 0xc2321e], [0, 0xe7c75a], [0.8, 0x3f9a4a]]) add(g, new THREE.SphereGeometry(0.22, 6, 5), mat(c), x, 1.05, 0.5);
    add(g, box(0.7, 0.7, 0.7), mat(WOOD), 1.9, 0.35, 0.9, 0, 0.4);
    add(g, box(0.5, 0.5, 0.5), mat(WOOD2), -1.9, 0.25, 0.8, 0, -0.3);
    return 3.2;
  },
  // Çarşı geçidi (sürüm 13): Kapı'nın yanında, Yemin Pazarı'na götüren küçük ışıklı geçit. Kumtaşı kemer, altın girdap,
  // dönen halka ve kemerin tepesinde iki ırkın renginde iki küçük sancak (tarafsız kasabaya gider). Işığı: girdabın önünde.
  carsi(g) {
    const sand = mat(0xc9a87c), sandD = mat(0x8a6a44), gold = mat(GOLD, { metalness: 0.8, roughness: 0.35 });
    add(g, cyl(1.5, 1.7, 0.24, 10), sandD, 0, 0.12, 0); add(g, cyl(1.25, 1.4, 0.16, 10), sand, 0, 0.32, 0);
    for (const s of [-1, 1]) { add(g, box(0.42, 2.5, 0.5), sand, s * 0.95, 1.55, 0); add(g, box(0.6, 0.22, 0.66), sandD, s * 0.95, 0.4, 0); add(g, box(0.58, 0.18, 0.62), gold, s * 0.95, 2.85, 0); }
    add(g, new THREE.TorusGeometry(0.95, 0.2, 6, 14, Math.PI), sand, 0, 2.85, 0);
    add(g, cone(0.12, 0.3, 6), gold, 0, 4.05, 0);
    const pm = portalMaterial(FIRES.orta.portal); pm.userData.keep = true;
    const portal = add(g, new THREE.CircleGeometry(0.78, 28), pm, 0, 1.85, 0.03); portal.scale.set(1, 1.42, 1); portal.castShadow = false;
    add(g, new THREE.RingGeometry(0.42, 0.52, 22), glow(FIRES.orta.ring, 1.4), 0, 1.85, 0.07).userData.spin = -1.4;
    add(g, new THREE.RingGeometry(0.66, 0.7, 26), glow(0xffd36a, 1.1), 0, 1.85, 0.06).userData.spin = 0.6;
    for (const [s, c] of [[-1, FLAGS.sancak], [1, FLAGS.ocak]]) { add(g, cyl(0.03, 0.03, 0.9, 5), gold, s * 0.95, 3.4, 0); flag(g, 0.42, 0.3, c, s * 0.95 + 0.02, 3.66, 0); }
    if (gfx.T.lamps > 1) { const pl = new THREE.PointLight(0xffc860, 2.4, 6, 1.6); pl.position.set(0, 1.8, 0.9); pl.userData.flicker = 2.4; g.add(pl); }
    g.userData.sparkle = new THREE.Vector3(0, 1.85, 0.12); // girdaptan yükselen kıvılcımlar (updateTown)
    return 4.3;
  },
  // İksir ve Parşömen (sürüm 13, başkent; eski Pazar ve Tüccar yerinde): eğik çatılı küçük dükkân, önde tezgâh, tezgâhta ışıyan
  // renkli şişeler, yanda kaynayan kazan, saçakta asılı parşömen tabelası
  iksir(g) {
    add(g, box(2.8, 0.25, 2.2), mat(DARK), 0, 0.12, -0.2);
    add(g, box(2.5, 1.9, 1.6), mat(STONE), 0, 1.2, -0.45);
    const roof = add(g, box(3.0, 0.16, 2.3), mat(ROOF), 0, 2.32, -0.25, -0.28); roof.castShadow = true;
    add(g, box(0.7, 1.2, 0.06), mat(0x2a1a10), -0.6, 0.85, 0.37);
    add(g, box(0.62, 0.5, 0.06), glow(0xffd98a, 1.1, 'win'), 0.6, 1.4, 0.37);
    add(g, box(2.6, 0.75, 0.6), mat(WOOD2), 0, 0.5, 0.95); add(g, box(2.7, 0.08, 0.68), mat(WOOD), 0, 0.9, 0.95);
    [[-1.0, 0xff4a3a], [-0.65, 0x4aa8ff], [-0.3, 0xff4a3a], [0.25, 0x6ae07a], [0.55, 0x4aa8ff]].forEach(([x, c], i) => { add(g, cyl(0.1, 0.12, 0.26, 7), glow(c, 1.6), x, 1.08, 0.95 - (i % 2) * 0.12); add(g, cyl(0.04, 0.04, 0.1, 5), mat(0xe9e4d4), x, 1.26, 0.95 - (i % 2) * 0.12); });
    add(g, cyl(0.22, 0.22, 0.08, 10), mat(0xd9bf86), 0.95, 0.98, 0.95, 0, 0, Math.PI / 2); // rulo parşömen
    add(g, cyl(0.42, 0.34, 0.5, 10), mat(0x2a2a2e, { metalness: 0.7, roughness: 0.45 }), 1.75, 0.38, 0.55); // kazan
    add(g, cyl(0.36, 0.36, 0.05, 12), glow(0x6ae07a, 2.0), 1.75, 0.62, 0.55);
    for (const s of [-1, 1]) add(g, box(0.08, 0.5, 0.08), mat(WOOD), 1.75 + s * 0.42, 0.12, 0.55);
    add(g, cyl(0.03, 0.03, 1.1, 5), mat(WOOD), 1.25, 1.95, 0.6, 0, 0, Math.PI / 2); // saçak direği ve asılı tabela
    add(g, box(0.5, 0.62, 0.05), mat(0xf1e2bc), 1.55, 1.55, 0.6); add(g, box(0.36, 0.06, 0.06), mat(0xa88a52), 1.55, 1.62, 0.63); add(g, box(0.28, 0.06, 0.06), mat(0xa88a52), 1.55, 1.48, 0.63);
    add(g, cyl(0.04, 0.04, 0.6, 5), mat(WOOD2), 1.55, 1.9, 0.6, 0, 0, Math.PI / 2);
    return 3.2;
  },
  // Tüccar tezgâhı (Yemin Pazarı, sürüm 13): kırmızı-mavi çizgili tente, silah askısı (kılıç, balta), kalkan, terazi ve sandıklar
  tuccar(g) {
    for (const [x, z] of [[-1.3, -0.6], [1.3, -0.6], [-1.3, 0.7], [1.3, 0.7]]) add(g, cyl(0.09, 0.09, 2.3, 6), mat(WOOD), x, 1.15, z);
    for (let i = 0; i < 5; i++) add(g, box(0.6, 0.12, 1.9), mat(i % 2 ? FLAGS.sancak : FLAGS.ocak), -1.2 + i * 0.6, 2.42 - Math.abs(i - 2) * 0.05, 0.05, 0.22);
    add(g, box(2.6, 0.9, 0.8), mat(WOOD2), 0, 0.45, 0.5); add(g, box(2.7, 0.08, 0.88), mat(WOOD), 0, 0.92, 0.5);
    const steel = mat(0xc8d0d8, { metalness: 0.8, roughness: 0.3 });
    add(g, box(2.2, 0.1, 0.1), mat(WOOD), 0, 1.75, -0.55); // silah askısı
    for (const x of [-0.8, -0.3, 0.2]) { add(g, box(0.08, 0.9, 0.03), steel, x, 1.25, -0.5); add(g, box(0.26, 0.05, 0.06), mat(GOLD), x, 1.62, -0.5); }
    add(g, cyl(0.03, 0.03, 0.95, 5), mat(WOOD), 0.75, 1.25, -0.5); add(g, box(0.3, 0.26, 0.04), steel, 0.85, 1.6, -0.5);
    add(g, cyl(0.3, 0.3, 0.06, 10), mat(0x6f7b8a, { metalness: 0.5 }), -0.7, 1.22, 0.62, Math.PI / 2 - 0.4); // kalkan
    add(g, cyl(0.03, 0.03, 0.4, 5), mat(GOLD), 0.55, 1.15, 0.55); add(g, box(0.5, 0.03, 0.03), mat(GOLD), 0.55, 1.34, 0.55); // terazi
    for (const s of [-1, 1]) add(g, cyl(0.09, 0.07, 0.03, 8), mat(GOLD), 0.55 + s * 0.24, 1.22, 0.55);
    add(g, box(0.7, 0.7, 0.7), mat(WOOD), 1.9, 0.35, 0.9, 0, 0.4); add(g, box(0.5, 0.5, 0.5), mat(WOOD2), -1.9, 0.25, 0.8, 0, -0.3);
    return 3.2;
  },
  // Şan Divanı: sütunlu, üçgen alınlıklı salon ve sancak
  hall(g) {
    add(g, box(3.8, 0.4, 2.8), mat(STONE), 0, 0.2, 0);
    add(g, box(3.0, 2.2, 2.0), mat(0xd8cfb8), 0, 1.5, -0.3);
    for (const x of [-1.5, -0.5, 0.5, 1.5]) add(g, cyl(0.17, 0.2, 2.2, 8), mat(0xefe8d6), x, 1.5, 0.95);
    add(g, box(3.8, 0.3, 2.8), mat(STONE), 0, 2.75, 0);
    const roof = add(g, cyl(0.01, 2.0, 1.1, 3), mat(ROOF), 0, 3.45, 0, 0, 0, 0); roof.scale.set(1, 1, 1.45); roof.rotation.y = Math.PI / 2;
    add(g, cyl(0.05, 0.05, 1.6, 6), mat(GOLD), 0, 4.6, 0);
    flag(g, 0.78, 0.5, FLAG, 0.03, 5.1, 0);
    return 5.6;
  },
  // Klan Karargâhı: mazgallı taş hisar, burç ve sancak. Klan evini açar (ui-klan.js); direkte oyuncunun klan sancağı durur.
  clanhq(g) {
    add(g, box(3.6, 0.3, 3.0), mat(DARK), 0, 0.15, 0);
    add(g, box(3.2, 2.2, 2.6), mat(STONE), 0, 1.4, 0);
    for (let i = 0; i < 5; i++) { add(g, box(0.4, 0.4, 0.3), mat(STONE), -1.4 + i * 0.7, 2.7, 1.15); add(g, box(0.4, 0.4, 0.3), mat(STONE), -1.4 + i * 0.7, 2.7, -1.15); }
    add(g, box(0.9, 1.3, 0.12), mat(0x2a1a10), 0, 0.95, 1.32);
    add(g, new THREE.CircleGeometry(0.45, 12, 0, Math.PI), mat(0x2a1a10), 0, 1.6, 1.33);
    for (const s of [-1, 1]) { add(g, cyl(0.62, 0.7, 3.4, 8), mat(0x7a756c), s * 1.7, 1.7, 1.2); add(g, cone(0.85, 1.1, 8), mat(ROOF), s * 1.7, 3.95, 1.2); }
    add(g, cyl(0.05, 0.05, 2.2, 6), mat(GOLD), 0, 3.6, 0);
    if (HQ_BANNER) flag(g, 1.36, 1.02, hqFlag(), 0.03, 4.16, 0); else flag(g, 1.0, 0.6, FLAG, 0.03, 4.35, 0);
    add(g, box(0.5, 0.5, 0.06), glow(0xffd98a, 1.1, 'win'), -0.95, 1.7, 1.31);
    add(g, box(0.5, 0.5, 0.06), glow(0xffd98a, 1.1, 'win'), 0.95, 1.7, 1.31);
    return 5.0;
  },
  // Kader Çarkı: ayaklı büyük çark, parlayan taşlar
  wheel(g) {
    add(g, box(2.2, 0.3, 1.2), mat(STONE), 0, 0.15, 0);
    for (const s of [-1, 1]) add(g, box(0.22, 2.4, 0.22), mat(WOOD), s * 0.5, 1.2, -0.25, 0, 0, s * 0.18);
    const w = new THREE.Group(); w.position.set(0, 2.5, 0.1); w.userData.spin = 0.35; g.add(w);
    add(w, new THREE.TorusGeometry(1.3, 0.14, 6, 18), mat(GOLD, { metalness: 0.8, roughness: 0.35 }));
    for (let i = 0; i < 6; i++) { add(w, box(0.08, 2.5, 0.06), mat(WOOD2), 0, 0, 0, 0, 0, i * Math.PI / 6); const a = i * Math.PI / 3; add(w, new THREE.OctahedronGeometry(0.18), glow([0xff6a1a, 0x66ccff, 0xffe066][i % 3], 2.4), Math.cos(a) * 1.3, Math.sin(a) * 1.3, 0.1); }
    add(w, cyl(0.22, 0.22, 0.2, 10), mat(DARK), 0, 0, 0, Math.PI / 2);
    return 4.5;
  },
  // Taş Yemini: basamaklı taş kaide üstünde, elinde sancak tutan tunç savaşçı heykeli; önünde iki mangal.
  // Şampiyonu, lider klanı ve üstün ırkı anar. Yalnızca düz geometri: heykel, direk, dikdörtgen sancak (inanç simgesi yok).
  monument(g) {
    const bronze = () => mat(0xa8742e, { metalness: 0.6, roughness: 0.5 }), gold = () => mat(GOLD, { metalness: 0.6, roughness: 0.45 });
    add(g, cyl(1.6, 1.8, 0.3, 8), mat(DARK), 0, 0.15, 0);
    add(g, cyl(1.25, 1.4, 0.3, 8), mat(STONE), 0, 0.45, 0);
    add(g, box(1.15, 1.25, 1.15), mat(0xa39c8e), 0, 1.22, 0);
    add(g, box(1.34, 0.16, 1.34), mat(DARK), 0, 1.92, 0);
    add(g, box(0.78, 0.5, 0.05), gold(), 0, 1.25, 0.6); // yazıt levhası
    for (const s of [-1, 1]) add(g, box(0.22, 0.8, 0.26), bronze(), s * 0.17, 2.4, 0);
    add(g, box(0.64, 0.72, 0.36), bronze(), 0, 3.1, 0);
    add(g, box(0.86, 0.17, 0.42), bronze(), 0, 3.5, 0);
    add(g, new THREE.SphereGeometry(0.21, 8, 6), bronze(), 0, 3.8, 0);
    add(g, cone(0.21, 0.28, 6), bronze(), 0, 4.05, 0); // miğfer tepesi
    add(g, box(0.17, 0.62, 0.19), bronze(), -0.5, 3.15, 0.04);
    add(g, cyl(0.36, 0.36, 0.07, 10), bronze(), -0.56, 2.95, 0.22, Math.PI / 2); // yuvarlak kalkan
    add(g, box(0.17, 0.52, 0.19), bronze(), 0.5, 3.3, 0.14, -0.6);
    add(g, cyl(0.045, 0.045, 3.0, 6), gold(), 0.58, 3.5, 0.3); // sancak direği (heykelin sağ elinde, kaideye basar)
    add(g, cone(0.1, 0.3, 6), gold(), 0.58, 5.15, 0.3);
    flag(g, 1.0, 0.62, FLAG, 0.6, 4.6, 0.3);
    for (const s of [-1, 1]) { add(g, cyl(0.24, 0.13, 0.5, 8), mat(0x2a2a2e, { metalness: 0.8, roughness: 0.5 }), s * 1.3, 0.55, 1.0); fire(g, 0.2, 0.55, s * 1.3, 0.84, 1.0); }
    // mangalların ışığı (kaidenin önünde, alçakta); Düşük kademede tek ışık meydan meşalesine kalır
    if (gfx.T.lamps > 1) { const pl = new THREE.PointLight(FIRE.g, 3, 7, 1.7); pl.position.set(0, 1.0, 1.9); pl.userData.flicker = 3; g.add(pl); }
    return 5.35;
  },
  // Balıkçı iskelesi (Yemin Pazarı göleti): tabelalı direk, yaslanmış olta, kova ve ağ. Balık tutma penceresini açar (ui-balik.js)
  pier(g) {
    add(g, box(1.6, 0.12, 1.0), mat(WOOD2), 0, 0.36, 0);
    for (const [x, z] of [[-0.7, -0.4], [0.7, -0.4], [-0.7, 0.4], [0.7, 0.4]]) add(g, cyl(0.07, 0.07, 0.6, 5), mat(WOOD), x, 0.2, z);
    add(g, cyl(0.06, 0.07, 2.0, 6), mat(WOOD), -0.55, 1.3, 0.2);
    add(g, box(0.9, 0.42, 0.06), mat(0xd8c49a), -0.55, 1.95, 0.26); // tabela
    add(g, box(0.5, 0.14, 0.02), mat(0x2a6f9a), -0.55, 1.95, 0.3); // tabelada balık şeridi
    add(g, cyl(0.025, 0.02, 2.4, 5), mat(0x5a3a1c), 0.35, 1.2, -0.1, 0.5, 0, -0.35); // olta
    add(g, cyl(0.2, 0.16, 0.34, 10), mat(0x6f7b8a, { metalness: 0.5, roughness: 0.5 }), 0.45, 0.6, 0.25); // kova
    add(g, new THREE.SphereGeometry(0.22, 7, 5), mat(0xb8a070), -0.1, 0.5, -0.3).scale.set(1.3, 0.5, 1); // dürülmüş ağ
    return 2.4;
  },
};

// Klan haritası (VAHRAN): Klan Karargâhı'na dokununca açılan ayrı yer. Binalar mevcut modellerden türetilir;
// sancak direği klanın kendi sancağını (HQ_BANNER) taşır.
BUILD.k_hq = BUILD.clanhq; BUILD.k_salon = BUILD.hall; BUILD.k_hisar = BUILD.gate; BUILD.k_dukkan = BUILD.tuccar;
BUILD.k_gorev = BUILD.market; BUILD.k_av = BUILD.mine;
// Kral Otağı (19 Kas): başkentte eski Klan Karargâhı'nın yerinde büyük, sekizgen hükümdar çadırı. Irk renginde çizgili duvar,
// koni çatı, altın kuşaklar, giriş perdesi ve iki yanında küçük nöbet çadırları; tepede ırk sancağı.
BUILD.clanhq = g => {
  const cloth = mat(ROOF), light = mat(STONE), gold = mat(GOLD), dark = mat(0x24160e);
  add(g, cyl(2.5, 2.7, 0.3, 12), mat(DARK), 0, 0.15, 0);
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; add(g, box(1.28, 1.7, 0.08), i % 2 ? cloth : light, Math.sin(a) * 2.02, 1.15, Math.cos(a) * 2.02, 0, a, 0); }
  add(g, cone(2.6, 2.3, 12), cloth, 0, 3.15, 0);
  add(g, new THREE.TorusGeometry(2.2, 0.07, 5, 24), gold, 0, 2.02, 0, Math.PI / 2);
  add(g, new THREE.TorusGeometry(1.15, 0.05, 5, 18), gold, 0, 3.05, 0, Math.PI / 2);
  add(g, cyl(0.06, 0.06, 1.8, 6), gold, 0, 4.9, 0); add(g, new THREE.SphereGeometry(0.16, 10, 8), gold, 0, 5.85, 0);
  flag(g, 1.2, 0.72, FLAG, 0.04, 5.25, 0);
  add(g, box(1.0, 1.45, 0.14), dark, 0, 1.0, 2.07); // giriş
  for (const s of [-1, 1]) {
    add(g, box(0.5, 1.6, 0.1), cloth, s * 0.62, 1.05, 2.12, 0, s * -0.35, 0); // açık perde kanatları
    add(g, cyl(0.07, 0.07, 2.4, 6), gold, s * 0.95, 1.2, 2.25); add(g, cone(0.13, 0.3, 6), gold, s * 0.95, 2.55, 2.25);
    add(g, cyl(0.85, 0.9, 0.9, 8), light, s * 3.2, 0.55, 0.6); add(g, cone(1.05, 1.1, 8), cloth, s * 3.2, 1.55, 0.6); // nöbet çadırı
    add(g, cyl(0.03, 0.03, 0.7, 5), gold, s * 3.2, 2.3, 0.6);
  }
  add(g, box(0.6, 0.45, 0.06), glow(0xffd98a, 1.1, 'win'), 0, 1.35, 2.15); // içerideki ışık
  return 3.4; // etiket çadırın ortasında: üst ortadaki saat ve sunucu simgesiyle çakışmasın
};
BUILD.k_sancak = g => {
  add(g, cyl(0.9, 1.1, 0.4, 8), mat(DARK), 0, 0.2, 0);
  add(g, cyl(0.07, 0.09, 4.2, 6), mat(GOLD), 0, 2.4, 0); add(g, cone(0.14, 0.3, 6), mat(GOLD), 0, 4.65, 0);
  if (HQ_BANNER) flag(g, 1.36, 1.02, hqFlag(), 0.05, 3.8, 0); else flag(g, 1.1, 0.7, FLAG, 0.05, 3.9, 0);
  return 4.8;
};
// Hisar (19 Kas): küçük kale. Mazgallı surlar, dört köşe kulesi (sivri çatılı), kapı kulesi, kale kapısı ve klan sancakları.
BUILD.k_hisar = g => {
  const st = mat(STONE), dk = mat(DARK), roof = mat(ROOF), gold = mat(GOLD), W = 3.4, D = 2.6, H = 1.5;
  add(g, box(W + 0.6, 0.25, D + 0.6), dk, 0, 0.12, 0);
  for (const [w, d, x, z] of [[W, 0.3, 0, D / 2], [W, 0.3, 0, -D / 2], [0.3, D, W / 2, 0], [0.3, D, -W / 2, 0]]) {
    add(g, box(w, H, d), st, x, 0.25 + H / 2, z);
    const n = Math.round(Math.max(w, d) / 0.42); // mazgallar
    for (let i = 0; i < n; i++) { const t = -0.5 + (i + 0.5) / n; if (i % 2) continue; add(g, box(w > d ? 0.24 : 0.34, 0.24, w > d ? 0.34 : 0.24), st, x + (w > d ? t * w : 0), 0.25 + H + 0.12, z + (w > d ? 0 : t * d)); }
  }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { // köşe kuleleri
    add(g, cyl(0.46, 0.55, 2.5, 8), st, sx * W / 2, 1.5, sz * D / 2);
    add(g, cyl(0.56, 0.56, 0.16, 8), dk, sx * W / 2, 2.78, sz * D / 2);
    add(g, cone(0.64, 1.1, 8), roof, sx * W / 2, 3.4, sz * D / 2);
    add(g, box(0.1, 0.3, 0.05), glow(0xffd98a, 1, 'win'), sx * W / 2, 1.9, sz * D / 2 + 0.52);
  }
  add(g, box(1.3, 2.6, 0.6), st, 0, 1.55, D / 2 + 0.1); add(g, cone(0.95, 1.0, 4), roof, 0, 3.3, D / 2 + 0.1, 0, Math.PI / 4, 0); // kapı kulesi
  add(g, box(0.72, 1.2, 0.08), mat(0x2a1a10), 0, 0.85, D / 2 + 0.42); add(g, new THREE.CircleGeometry(0.36, 12, 0, Math.PI), mat(0x2a1a10), 0, 1.45, D / 2 + 0.43);
  for (let i = 0; i < 4; i++) add(g, box(0.05, 1.0, 0.05), mat(0x3a3a3a, { metalness: 0.6, roughness: 0.4 }), -0.27 + i * 0.18, 0.95, D / 2 + 0.47); // parmaklık
  add(g, box(1.6, 1.0, 0.8), st, 0, 0.75, -0.2); add(g, box(1.7, 0.12, 0.9), dk, 0, 1.3, -0.2); // iç kule
  add(g, cyl(0.04, 0.04, 1.6, 5), gold, 0, 3.6, D / 2 + 0.1);
  if (HQ_BANNER) flag(g, 0.9, 0.62, hqFlag(), 0.03, 4.0, D / 2 + 0.1); else flag(g, 0.8, 0.5, FLAG, 0.03, 4.05, D / 2 + 0.1);
  return 4.4;
};
// Klan Hazinesi (19 Kas): demir kuşaklı taş mahzen, önünde altın dolu sandıklar ve akçe yığınları
BUILD.k_hazine = g => {
  const st = mat(STONE), dk = mat(DARK), gold = mat(GOLD, { metalness: 0.7, roughness: 0.35 }), wood = mat(WOOD);
  add(g, box(2.6, 0.2, 2.0), dk, 0, 0.1, 0);
  add(g, box(2.2, 1.6, 1.6), st, 0, 1.0, -0.1); add(g, cyl(1.12, 1.12, 1.6, 12, 1), st, 0, 1.8, -0.1, 0, 0, Math.PI / 2);
  add(g, box(2.3, 0.14, 1.7), dk, 0, 1.82, -0.1);
  add(g, box(0.8, 1.15, 0.1), mat(0x2b2b2e, { metalness: 0.6, roughness: 0.4 }), 0, 0.78, 0.72); // demir kapı
  for (const y of [0.45, 0.8, 1.15]) add(g, box(0.84, 0.05, 0.04), gold, 0, y, 0.78);
  add(g, new THREE.TorusGeometry(0.1, 0.025, 5, 12), gold, 0.22, 0.8, 0.8);
  for (const [x, z, r] of [[-0.95, 0.85, 0.2], [0.95, 0.9, -0.3]]) { // sandıklar
    add(g, box(0.62, 0.36, 0.42), wood, x, 0.38, z, 0, r, 0); add(g, box(0.64, 0.06, 0.44), gold, x, 0.58, z, 0, r, 0);
    add(g, new THREE.SphereGeometry(0.2, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), gold, x, 0.6, z);
  }
  for (const [x, z] of [[-0.45, 1.15], [0.45, 1.2], [0, 1.35]]) add(g, cyl(0.12, 0.14, 0.12, 10), gold, x, 0.26, z); // akçe yığınları
  add(g, new THREE.OctahedronGeometry(0.22), glow(0xffd36a, 2.2), 0, 2.85, -0.1);
  return 3.3;
};
export const KLAN_SPOT = { gate: [0, 0, 1], k_hq: [0, -10, 1.3], k_salon: [-7.4, -6.6, 1], k_hisar: [7.4, -6.6, 1], k_gorev: [-10.8, -2.4, 0.95], k_dukkan: [10.8, -2.4, 1.1], k_av: [12.2, 3.0, 0.9], k_sancak: [5.5, 3.8, 0.9], k_hazine: [-6.4, 3.4, 0.95] }; // 19 Kas: sancak kapının sağ önünde (ana ekranda Taş Yemini anıtının yeri); eski yerinde Klan Hazinesi
BUILD.pazar = BUILD.market; // Yemin Pazarı'ndaki Pazar tezgâhı (sürüm 13: Tüccar'dan ayrıldı)
let group = null, spinners = [], flames = [], hits = [], smoke = null, smokeT = 0, sparkle = null, sparkT = 0;
export function hideTown() { hideMerkez(); if (!group) return; scene.remove(group); disposeTree(group); group = null; spinners = []; flames = []; hits = []; smoke = null; sparkle = null; }

// Binaya dokunma: her binanın çevresinde görünmez bir kutu vardır; sahneye yapılan dokunuş (sürükleme değilse) ışınla
// bu kutulara sorulur ve en öndeki binanın kimliği bildirilir. Etiketler ayrıca çalışmaya devam eder (arayüz düğmeleri).
// Pencere, modal ya da savaş açıkken sahneye dokunuş ulaşmaz / bina yoktur; ayrıca bir denetim gerekmez.
const HIT_MAT = new THREE.MeshBasicMaterial({ visible: false });
let tapFn = null, downAt = null;
export const onTownTap = fn => { tapFn = fn; };
// 19 Kas: Kapı önceliklidir; yanındaki geçidin (Çarşı / Başkente dön) kutusu Kapı görselinin üstüne taşınca dokunuş ışınlıyordu
export const townPick = (x, y) => { if (!group) return null; const gh = hits.filter(h => h.userData.building === 'gate'); return (gh.length && pick(x, y, gh) ? 'gate' : pick(x, y, hits)?.userData.building) || null; };
const stageEl = document.getElementById('stage');
stageEl.addEventListener('pointerdown', e => { downAt = [e.clientX, e.clientY]; });
stageEl.addEventListener('click', e => { // pointerup değil click: pencere dokunuş bittikten sonra açılır (hayalet tıklama yok)
  const d = downAt; downAt = null;
  if (!group || !tapFn || !d || Math.hypot(e.clientX - d[0], e.clientY - d[1]) > 12) return;
  const id = townPick(e.clientX, e.clientY);
  if (id) tapFn(id);
});

// Binaları kurar; { id → etiket konumu } döndürür. Yerleşim yataydır: Kapı (portal) meydanın tam ortasında,
// öbür binalar onun arkasında ve iki yanında geniş bir yay çizer (ön taraf arayüze kalır).
// [x, z, ölçek]: Klan Karargâhı portalın arkasında, meydanın başında; öbürleri iki yana açılır.
// Taş Yemini meydanın sağ ön kenarındadır (ortam oradaki meşaleyi kurmaz): etiketi İksir ve Parşömen ile Kader Çarkı etiketlerinin
// altında ve solunda, alt çubuğun üstünde kalır.
// Usta Odası kaldırıldı: Kader Çarkı onun yerine, Örs çarkın eski yerine, Maden Örs'ün eski yerine geçti
const SPOT = { gate: [0, 0, 1], carsi: [3.7, 0.5, 0.74], clanhq: [0, -9.0, 1.3], hall: [7.4, -6.6, 1], wheel: [10.4, 2.4, 0.95], market: [9.6, -2.8, 0.95], iksir: [9.6, -2.8, 0.95], anvil: [-7.4, -6.6, 1], mine: [-10.8, -2.4, 0.95], monument: [5.5, 4.4, 0.83] };
// Irk süsleri (ucuz): Kragmir kemik diken + kor mangal, Elentha mavi sancak + altın tepe
function raceProps(g, faction, h, id) {
  if (faction === 'orta') { // Yemin Pazarı: iki ırkın sancağı yan yana (tarafsız toprak)
    flag(g, 0.4, 0.5, FLAGS.ocak, -1.1, 1.05, 1.0); flag(g, 0.4, 0.5, FLAGS.sancak, 1.1, 1.05, 1.0);
    for (const s of [-1, 1]) add(g, cyl(0.04, 0.04, 1.3, 6), mat(WOOD2), s * 1.1, 0.65, 1.0);
    return;
  }
  if (faction === 'ocak') {
    for (const s of [-1, 1]) add(g, cone(0.12, 0.8, 5), mat(0xe6dcc2), s * 1.1, 0.4, 1.0, 0, 0, -s * 0.15);
    if (gfx.T.dress) add(g, new THREE.SphereGeometry(0.16, 8, 6), glow(FIRES.ocak.g, 2.4, 'fire'), 0, 0.3, 1.1);
  } else {
    for (const s of [-1, 1]) { add(g, cyl(0.04, 0.04, 1.3, 6), mat(GOLD), s * 1.1, 0.65, 1.0); add(g, cone(0.1, 0.2, 6), mat(GOLD), s * 1.1, 1.4, 1.0); flag(g, 0.4, 0.5, 0x2f62b8, s * 1.1, 1.05, 1.0); }
  }
  if (!gfx.T.dress) return; // Düşük kademede yalnızca yukarıdaki ucuz süsler
  // Konsept tablosu, mimari: Elentha beyaz taş + mavi kubbe + vitray ışığı; Kragmir demir kazık + kemik totem + ateş çukuru
  if (faction === 'ocak') {
    const iron = mat(0x2a2220, { metalness: 0.5, roughness: 0.6 }), bone = mat(0xe6dcc2);
    for (const [x, z, t] of [[-1.35, -0.6, -0.25], [1.35, -0.6, 0.25], [-1.5, 0.2, -0.35]]) add(g, cone(0.07, 1.1, 5), iron, x, 0.55, z, 0, 0, t); // demir kazıklar
    add(g, cyl(0.06, 0.08, 0.9, 6), mat(0x4a2f22), 1.45, 0.45, 0.35); // kemik totem: direk, kafatası, boynuzlar
    add(g, new THREE.SphereGeometry(0.14, 8, 6), bone, 1.45, 0.98, 0.35);
    for (const s of [-1, 1]) add(g, cone(0.04, 0.22, 5), bone, 1.45 + s * 0.13, 1.08, 0.35, 0, 0, -s * 0.9);
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; add(g, new THREE.DodecahedronGeometry(0.07), mat(0x3a2a24), -1.1 + Math.cos(a) * 0.18, 0.05, 1.25 + Math.sin(a) * 0.18); } // ateş çukuru
    fire(g, 0.12, 0.3, -1.1, 0.05, 1.25, 0.7);
  } else {
    if (id === 'hall') { // sütunlu CZ - PK tapınağının çatısında kubbe
      const dome = new THREE.SphereGeometry(0.62, 14, 7, 0, Math.PI * 2, 0, Math.PI / 2);
      add(g, cyl(0.64, 0.64, 0.16, 14), mat(0xe8e2d4), 0, DOME_Y, 0); // kubbe kasnağı (beyaz taş)
      add(g, dome, mat(0x2f62b8, { metalness: 0.2, roughness: 0.5 }), 0, DOME_Y + 0.08, 0);
      add(g, cone(0.06, 0.4, 6), mat(GOLD, { metalness: 0.8, roughness: 0.35 }), 0, DOME_Y + 0.88, 0); // altın tepelik
    }
    if (id === 'clanhq' || id === 'hall') add(g, new THREE.PlaneGeometry(0.34, 0.5), glow(0x7ab8ff, 1.6, 'win'), 0, 1.2, 1.25); // vitray ışığı (gece güçlenir)
  }
}
// ---- Başkent ve Yemin Pazarı süsleri (meydanın arkasında; dokunulmaz) ----
// Kragmir (Kragmir Dağ Salonları): isli, kızıl kor ağızlı yüksek ocak bacaları · Elentha (Elentha Ak Kuleleri): beyaz surlar, burçlar ve mavi sancaklar
// Yemin Pazarı: iki ırkın renginde çizgili tezgâh tenteleri, sandıklar ve çuvallar
function capitalDress(root, faction) {
  const g = new THREE.Group();
  if (faction === 'ocak') {
    const soot = mat(0x1a1514), brick = mat(0x4a2a22);
    for (const [x, z, h] of [[-15, -13, 9], [-5, -16, 11], [6, -16, 10], [15.5, -12, 8]]) {
      add(g, cyl(0.9, 1.3, h, 7), brick, x, h / 2, z); add(g, cyl(1.05, 1.0, 0.6, 7), soot, x, h + 0.2, z);
      add(g, cyl(0.7, 0.7, 0.2, 7), glow(0xff5a1e, 2.6, 'fire'), x, h + 0.55, z);
      add(g, box(2.4, 0.3, 0.3), soot, x, h * 0.55, z + 0.9);
    }
  } else if (faction === 'sancak') {
    const white = mat(0xeeeae0), blue = mat(0x2f62b8, { metalness: 0.15, roughness: 0.55 });
    for (let i = -4; i <= 4; i++) {
      const x = i * 4.2, z = -15 + Math.abs(i) * 0.9;
      add(g, box(4.3, 3.2, 0.9), white, x, 1.6, z);
      for (const k of [-1.6, -0.5, 0.6, 1.7]) add(g, box(0.55, 0.55, 0.95), white, x + k, 3.45, z); // mazgallar
      if (i % 2 === 0) { add(g, cyl(1.0, 1.1, 5.2, 10), white, x, 2.6, z + 0.2); add(g, cone(1.25, 1.6, 10), blue, x, 6.0, z + 0.2); flag(g, 0.7, 0.5, FLAGS.sancak, x, 7.2, z + 0.2); add(g, cyl(0.03, 0.03, 1.2, 5), mat(GOLD), x, 7.0, z + 0.2); }
    }
  } else if (faction === 'orta') {
    ortaDress(g);
  }
  if (!g.children.length) return;
  for (const m of bakeRigid(g, [g], batchMaterial({ flatShading: true, envMapIntensity: 0.3 }), o => o.material.userData.keep === true, () => ({ grad: 0.25, under: 0.2, jitter: 0.04, base: 0.4 }))) m.receiveShadow = true;
  root.add(g);
}

// Yemin Pazarı: iki ırkın buluştuğu tarafsız kasaba. Sol yarı İnsan tarzı (beyaz taş, mavi bayrak, kubbeli küçük yapı, güneş taşı),
// sağ yarı Ork tarzı (kızıl kaya, kararmış demir kazık, kemik totem, ateş çukuru, yarık gözlü taş). Ortada iki renkli taş döşemeli
// ortak pazar meydanı, kırmızı-mavi çizgili tenteler ve barış anıtı (kesişen iki kılıç ve iki el; dini simge yok).
function ortaDress(g) {
  const white = mat(0xe2ddd0), blue = mat(0x2f62b8, { metalness: 0.15, roughness: 0.55 }), gold = mat(GOLD, { metalness: 0.8, roughness: 0.35 });
  const rock = mat(0x6a3326), rockD = mat(0x4a2218), iron = mat(0x2a2220, { metalness: 0.5, roughness: 0.6 }), bone = mat(0xe6dcc2), cloth = [mat(FLAGS.ocak), mat(FLAGS.sancak)], wood = mat(WOOD), crate = mat(WOOD2);
  // taş döşeme: iki yarım daire, ortada iki rengin dama gibi karıştığı şerit
  const half = (c, ts) => { const m = add(g, new THREE.CircleGeometry(9.5, 28, ts, Math.PI), c, 0, 0.15, 0.4, -Math.PI / 2); m.castShadow = false; };
  half(mat(0xcfc7b4), Math.PI / 2); half(mat(0x7a4034), -Math.PI / 2); // x<0 beyaz (İnsan), x>0 kızıl (Ork)
  if (gfx.T.dress) for (let i = 0; i < 12; i++) for (let j = 0; j < 3; j++) { const m = add(g, box(0.9, 0.04, 0.9), (i + j) % 2 ? mat(0xcfc7b4) : mat(0x7a4034), -4.95 + i * 0.9, 0.18, -1.9 + j * 0.9); m.castShadow = false; }
  // çizgili tenteler (kırmızı-mavi) ve sandıklar
  for (const [x, z, r] of [[-4.5, 3.6, 0.4], [4.5, 3.6, -0.4], [-11, 0, 0.9], [11, 0, -0.9]]) {
    const t = new THREE.Group();
    for (const s of [-1, 1]) for (const d of [-0.7, 0.7]) add(t, cyl(0.05, 0.05, 1.6, 5), wood, s * 1.0, 0.8, d);
    for (let k = 0; k < 6; k++) add(t, box(0.35, 0.06, 1.7), cloth[k % 2], -0.88 + k * 0.35, 1.7 + (k % 2) * 0.04, 0, 0.12);
    add(t, box(2.0, 0.5, 0.9), crate, 0, 0.45, 0.3); add(t, box(0.5, 0.5, 0.5), crate, 1.3, 0.25, 0.9); add(t, new THREE.SphereGeometry(0.3, 7, 5), mat(0xb8a070), -1.3, 0.25, 0.9);
    t.position.set(x, 0.1, z); t.rotation.y = r; g.add(t);
  }
  // barış anıtı: iki kılıç kesişir, kesişimde iki el tokalaşır
  const mx = 3.6, mz = -5.4;
  add(g, cyl(0.9, 1.1, 0.4, 8), mat(0x6f7b8a), mx, 0.35, mz); add(g, cyl(0.55, 0.7, 1.0, 8), white, mx, 1.05, mz);
  add(g, box(0.5, 0.3, 0.06), gold, mx, 1.0, mz + 0.62);
  for (const s of [-1, 1]) {
    add(g, box(0.14, 3.2, 0.06), mat(0xb8c0c8, { metalness: 0.8, roughness: 0.3 }), mx + s * 0.1, 3.1, mz, 0, 0, -s * 0.38);
    add(g, box(0.7, 0.1, 0.1), gold, mx - s * 0.62, 1.85, mz, 0, 0, -s * 0.38); // kabzenin siperi
  }
  add(g, box(0.34, 0.2, 0.22), mat(0xd8a878), mx - 0.12, 2.7, mz); add(g, box(0.34, 0.2, 0.22), mat(0x8a5a3c), mx + 0.12, 2.7, mz); // tokalaşan eller
  add(g, new THREE.TorusGeometry(0.62, 0.05, 5, 16), gold, mx, 2.75, mz);
  // sol yarı: İnsan yapıları
  const hut = new THREE.Group();
  add(hut, box(2.4, 1.8, 2.0), white, 0, 0.9, 0); add(hut, cyl(1.0, 1.0, 0.18, 14), white, 0, 1.9, 0);
  add(hut, new THREE.SphereGeometry(0.98, 14, 7, 0, Math.PI * 2, 0, Math.PI / 2), blue, 0, 1.95, 0);
  add(hut, cone(0.07, 0.5, 6), gold, 0, 3.0, 0); add(hut, box(0.5, 0.9, 0.08), mat(0x1a2a4a), 0, 0.5, 1.02);
  hut.position.set(-13.2, 0.1, -6.5); hut.rotation.y = 0.5; g.add(hut);
  for (const [x, z] of [[-9.5, -1.8], [-12.6, 3], [-8.2, 5]]) { add(g, cyl(0.04, 0.04, 2.2, 5), gold, x, 1.1, z); flag(g, 0.7, 0.45, FLAGS.sancak, x + 0.02, 1.95, z); }
  // güneş taşı: beyaz kaide üstünde, altın halkalı mavi kristal
  const sx = -10.2, sz = 2.2;
  add(g, cyl(0.7, 0.85, 0.5, 8), white, sx, 0.35, sz); add(g, box(0.6, 0.9, 0.6), white, sx, 1.05, sz);
  add(g, new THREE.OctahedronGeometry(0.5), glow(0x58b4ff, 2.2), sx, 2.0, sz).scale.set(0.8, 1.5, 0.8);
  add(g, new THREE.TorusGeometry(0.75, 0.06, 6, 20), gold, sx, 2.0, sz, Math.PI / 2.4, 0, 0.3);
  // sağ yarı: Ork yapıları
  for (const [x, z, k] of [[13.4, -6.6, 1.5], [10.6, -8, 1.1], [14.5, -3, 0.9]]) add(g, new THREE.DodecahedronGeometry(k, 0), rock, x, k * 0.7, z).scale.set(1.2, 1.1, 1);
  for (const [x, z, t] of [[10.4, -5.6, -0.2], [11.0, -6.6, 0.2], [14.2, -9.2, -0.15], [12.0, -9.8, 0.2]]) add(g, cone(0.12, 2.0, 5), iron, x, 1.0, z, 0, 0, t); // kararmış demir kazıklar
  add(g, cyl(0.1, 0.13, 2.2, 6), mat(0x4a2f22), 12.4, 1.1, -3.2); add(g, new THREE.SphereGeometry(0.3, 8, 6), bone, 12.4, 2.4, -3.2); // kemik totem
  for (const s of [-1, 1]) add(g, cone(0.07, 0.5, 5), bone, 12.4 + s * 0.3, 2.6, -3.2, 0, 0, -s * 0.9);
  add(g, box(0.9, 0.1, 0.1), bone, 12.4, 1.6, -3.2);
  const fx = 10.2, fz = 2.4;
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; add(g, new THREE.DodecahedronGeometry(0.17), rockD, fx + Math.cos(a) * 0.55, 0.15, fz + Math.sin(a) * 0.55); }
  fire(g, 0.38, 0.9, fx, 0.15, fz, 0.9);
  // gölet ve iskele (sol arka köşe): iskelenin ucunda balıkçı noktası durur (BUILD.pier, CARSI_SPOT.pier)
  const [px, pz] = POND;
  // su: pişirmeye girmez (keep); yansıma/parıltı kısık, mat turkuaz-mavi (beyazımsı görünmesin)
  const waterMat = () => { const m = new THREE.MeshStandardMaterial({ color: 0x1f86a8, emissive: 0x0a4a66, emissiveIntensity: 0.6, roughness: 0.9, metalness: 0, envMapIntensity: 0.05 }); m.userData.keep = true; return m; };
  const water = add(g, new THREE.CircleGeometry(2.6, 20), waterMat(), px, 0.14, pz, -Math.PI / 2); water.castShadow = false; water.scale.set(1.25, 0.85, 1);
  for (let i = 0; i < 11; i++) { const a = i / 11 * Math.PI * 2; add(g, new THREE.DodecahedronGeometry(0.28 + (i % 3) * 0.06), i % 2 ? white : mat(0x7a7468), px + Math.cos(a) * 3.2, 0.14, pz + Math.sin(a) * 2.2); }
  for (let k = 0; k < 5; k++) add(g, box(0.9, 0.08, 0.34), wood, px + 2.6 - k * 0.38, 0.42, pz + 1.2 - k * 0.28, 0, 0.62, 0); // iskele tahtaları
  for (const [dx, dz] of [[2.9, 1.1], [1.3, 0.1], [2.3, 1.7], [0.9, 0.7]]) add(g, cyl(0.06, 0.06, 0.8, 5), wood, px + dx, 0.3, pz + dz);
  // yarık gözlü kızıl taş: tek parça dik taş, ortasında dikey yarık göz
  const ex = 7.6, ez = -8.2;
  add(g, box(1.5, 3.2, 1.0), rock, ex, 1.7, ez, 0, -0.3, 0); add(g, box(1.8, 0.4, 1.3), rockD, ex, 0.2, ez, 0, -0.3, 0);
  const eye = add(g, new THREE.CircleGeometry(0.34, 12), glow(0xff6a1a, 2.6, 'fire'), ex + 0.14, 2.3, ez + 0.55, 0, -0.3, 0); eye.scale.set(0.5, 1.2, 1); eye.castShadow = false;
  add(g, box(0.16, 0.9, 0.04), mat(0x120a08), ex + 0.14, 2.3, ez + 0.57, 0, -0.3, 0);
}
// Yemin Pazarı yerleşimi: ortada dönüş geçidi, solda Pazar, sağda Tüccar tezgâhı (sürüm 13'te ayrıldı), arkada anıt (Kader Çarkı yalnız başkentte)
const POND = [-15.2, -0.8]; // gölet merkezi (sol ön: kameradan açık görünür)
// Karaborsa (19 Kas): Yemin Pazarı'nın gölgeli köşesinde koyu mor perdeli tezgâh; yakut tabelası, fenerler, kilitli sandıklar
// Şaman Yashka'nın otağı (Kristal Nöbeti girişi, 19 Kas): deri çadır, kemik totem, mavi Kül Kristali parçası
BUILD.yashka = g => {
  const hide = mat(0x6a4a34), dark = mat(0x2a1c14), bone = mat(0xe6dcc2), wood = mat(WOOD);
  add(g, cyl(1.5, 1.7, 0.18, 10), mat(0x3a2e26), 0, 0.09, 0);
  add(g, new THREE.ConeGeometry(1.35, 2.4, 8, 1, true), hide, 0, 1.38, -0.2);
  add(g, new THREE.ConeGeometry(0.5, 0.9, 6, 1, true), dark, 0, 0.6, 0.95); // giriş
  for (let i = 0; i < 5; i++) { const a = -0.9 + i * 0.45; add(g, cyl(0.03, 0.03, 0.8, 4), wood, Math.sin(a) * 0.3, 2.9, Math.cos(a) * 0.1 - 0.2, 0.3 * Math.cos(a), 0, 0.4 * Math.sin(a)); }
  add(g, cyl(0.07, 0.09, 2.6, 6), wood, 1.45, 1.3, 0.7); // totem
  add(g, new THREE.SphereGeometry(0.2, 8, 6), bone, 1.45, 2.7, 0.7);
  for (const s of [-1, 1]) add(g, new THREE.ConeGeometry(0.05, 0.45, 5), bone, 1.45 + s * 0.22, 2.85, 0.7, 0, 0, -s * 0.9);
  add(g, cyl(0.25, 0.32, 0.5, 6), mat(0x4a3a2e), -1.3, 0.25, 0.8); // kristal kaidesi
  add(g, new THREE.OctahedronGeometry(0.42), glow(0x6ab8ff, 2.6), -1.3, 1.05, 0.8); // Kül Kristali parçası
  add(g, new THREE.TorusGeometry(0.5, 0.03, 5, 18), glow(0x9ad8ff, 1.4), -1.3, 1.05, 0.8, Math.PI / 2, 0, 0);
  return 3.2;
};
BUILD.karaborsa = g => {
  const cloth = mat(0x3a1f4a), trim = mat(0x14101a), gold = mat(GOLD), wood = mat(WOOD);
  add(g, box(3.0, 0.2, 2.0), mat(0x2a2420), 0, 0.1, 0);
  add(g, box(2.6, 0.9, 0.8), wood, 0, 0.55, 0.45); add(g, box(2.7, 0.08, 0.9), trim, 0, 1.02, 0.45);
  for (const x of [-1.3, 1.3]) for (const z of [-0.8, 0.85]) add(g, cyl(0.06, 0.06, 2.4, 6), trim, x, 1.2, z);
  add(g, box(2.9, 0.08, 2.0), cloth, 0, 2.45, 0, 0.12, 0, 0);
  for (let i = 0; i < 6; i++) add(g, box(0.45, 0.35, 0.04), i % 2 ? cloth : trim, -1.15 + i * 0.46, 2.22, 1.0); // saçak
  add(g, box(2.6, 1.6, 0.06), cloth, 0, 1.6, -0.85); // arka perde
  add(g, new THREE.OctahedronGeometry(0.32), glow(0xff3a5a, 2.4), 0, 3.05, 0.6); // yakut tabelası
  add(g, new THREE.TorusGeometry(0.42, 0.04, 5, 16), gold, 0, 3.05, 0.6);
  for (const s of [-1, 1]) { add(g, box(0.16, 0.24, 0.16), glow(0xb27bff, 2.0, 'win'), s * 1.25, 1.85, 1.0); }
  for (const [x, z] of [[-0.8, 0.45], [0.1, 0.45], [0.8, 0.45]]) add(g, box(0.36, 0.22, 0.3), mat(0x5a3a20), x, 1.17, z); // kilitli sandıklar
  add(g, new THREE.SphereGeometry(0.1, 8, 6), glow(0x6effc8, 2), 0.1, 1.38, 0.45);
  return 3.6;
};
export const CARSI_SPOT = { yashka: [-3.2, -8.8, 1.0], carsi: [-3.7, 0.5, 0.74], karaborsa: [7.8, -8.4, 1.05], gate: [0, 0, 1], market: [-6.8, -5.2, 1.25], pazar: [-6.8, -5.2, 1.25], tuccar: [7.0, -3.4, 1.3], monument: [0, -11, 1], pier: [POND[0] + 2.6, POND[1] + 1.4, 0.9] };
// Binalar biraz küçük (×0,9) ve meydanın biraz gerisinde durur: kahramanlar ve etiketler için yer açılır
const BLD_K = 0.9, BLD_BACK = -0.6;
export function showTown(ids, faction, banner = null, layout = null) {
  hideTown();
  FLAG = FLAGS[faction] || FLAGS.ocak; FIRE = FIRES[faction] || FIRES.ocak;
  ({ STONE, DARK, ROOF } = PAL[faction] || PAL.ocak);
  HQ_BANNER = validBanner(banner) ? banner : null;
  group = new THREE.Group();
  const anchors = {}, spots = [], paint = batchMaterial({ flatShading: true, envMapIntensity: 0.35 });
  const keep = o => o.material.userData.keep === true;
  for (const id of ids) {
    const [x, z, k] = (layout || SPOT)[id], center = !x && !z;
    const g = new THREE.Group();
    const h = BUILD[id](g);
    if (id !== 'pier' && id !== 'carsi') raceProps(g, faction, h, id);
    g.scale.setScalar(k * BLD_K);
    g.position.set(x, 0.1, z + (layout ? 0 : BLD_BACK));
    g.rotation.y = center ? 0 : Math.atan2(-x, 9 - z) * 0.75; // meydana, hafifçe kameraya dön
    group.add(g);
    anchors[id] = new THREE.Vector3(x, 0.1 + h * k * BLD_K, z + (layout ? 0 : BLD_BACK));
    // dokunma kutusu: binanın dünya eksenlerindeki sınır kutusu (biraz genişletilmiş; küçük ekranda parmakla tutturulabilsin)
    const bb = new THREE.Box3().setFromObject(g), size = bb.getSize(new THREE.Vector3()), mid = bb.getCenter(new THREE.Vector3());
    const pad = id === 'carsi' ? 0 : 0.5, hb = new THREE.Mesh(new THREE.BoxGeometry(size.x + pad, size.y + 0.3 * (pad ? 1 : 0), size.z + pad), HIT_MAT); // geçidin kutusu Kapı'ya taşmasın
    hb.position.copy(mid); hb.userData.building = id; hb.castShadow = false;
    group.add(hb); hits.push(hb);
    // dönen parçalar (çark, geçit halkası) kendi ekleminde, gerisi binanın tek ağında birleşir
    const joints = [g];
    g.traverse(o => { if (o.userData.spin) { spinners.push(o); if (o.isGroup) joints.push(o); } if (o.userData.flicker) flames.push(o); });
    for (const m of bakeRigid(g, joints, paint, keep, j => (j === g ? { grad: 0.2, under: 0.24, jitter: 0.05, base: 0.45 } : { grad: 0, under: 0.2, jitter: 0.05 }))) m.receiveShadow = true;
    // binanın altındaki zemin lekesi (meydanın taş döşemesinin üstündeyse biraz yukarıda)
    spots.push([mid.x, mid.z, size.x * 1.3, size.z * 1.3, Math.hypot(mid.x, mid.z) < 8 ? 0.135 : 0.03]);
    if (g.userData.smoke) { g.updateMatrixWorld(true); smoke = g.userData.smoke.clone().applyMatrix4(g.matrixWorld); }
    if (g.userData.sparkle) { g.updateMatrixWorld(true); sparkle = g.userData.sparkle.clone().applyMatrix4(g.matrixWorld); }
  }
  capitalDress(group, faction); // ucuz: tek ağa pişirilir; ırkın kimliği her kademede görünsün
  group.add(blobField(spots, gfx.T.shadow ? 0.4 : 0.55));
  scene.add(group);
  return anchors;
}
export function updateTown(dt, t = 0) {
  for (const o of spinners) o.rotation.z += dt * o.userData.spin;
  for (let i = 0; i < flames.length; i++) { const o = flames[i]; o.intensity = o.userData.flicker * (1 + Math.sin(t * 16 + i * 2) * 0.12 + Math.sin(t * 7 + i) * 0.1); }
  // ocağın bacasından ağır ağır yükselen duman (parçacık havuzundan; Düşük kademede yok)
  if (smoke && gfx.T.dress && (smokeT -= dt) < 0) {
    smokeT = 0.16;
    particle(smoke.x + (Math.random() - 0.5) * 0.2, smoke.y, smoke.z + (Math.random() - 0.5) * 0.2, 0.25 + Math.random() * 0.2, 0.7 + Math.random() * 0.3, (Math.random() - 0.5) * 0.15, 0x4a4540, 0.55, 3.2, 0.05, 0.25, 2.2, true);
  }
  // Çarşı geçidinden süzülen altın kıvılcımlar (Düşük kademede yok)
  if (sparkle && gfx.T.dress && (sparkT -= dt) < 0) {
    sparkT = 0.09; const a = Math.random() * Math.PI * 2, r = 0.25 + Math.random() * 0.25;
    particle(sparkle.x + Math.cos(a) * r * 0.62, sparkle.y + Math.sin(a) * r * 0.9, sparkle.z + 0.05, Math.cos(a) * 0.25, 0.35 + Math.random() * 0.4, 0.12, Math.random() < 0.6 ? 0xffd36a : 0xffa83a, 0.05 + Math.random() * 0.03, 1.1, -0.1, 0.4);
  }
}
