// 3B Savaş Faz 1b · gerçek 3B arena geometrisi (Opus, 27.11)
// Kaynak: Gemini "KORANT_3D_FAZ1_TAM_TESLIM" arenaları + Opus-01 düzeltmeleri (ArenaScenery/ArenaPBRLoader/BattleArenas),
// bu dosyada birleştirildi ve mobil için yeniden düzenlendi:
//   - Süs parçaları (kaya, moloz, basamak, sütun) InstancedMesh: arena başına ~6-9 çizim çağrısı (önce 47-64).
//   - PBR dokuları (GPT Final-03, WebP) arena setine göre önbellekte kalır; yalnız başka sete geçilince bırakılır
//     (her savaşta yeniden çözme yok). Orta kademede normal haritası yüklenmez.
//   - Dokular inmezse düz renkli malzeme kalır (siyah zemin yok).
// Eksenler: +Y yukarı, +Z oyuncu tarafı, +X kamera tarafı. Savaş alanı merkezi (0,0,0), birimler |x|,|z| < 6.
import { THREE, gfx } from '../engine3d.js';

const KOK = new URL('../../models/b3d/doku/arena/', import.meta.url).href;
export const TEMALAR = {
  vahran: { ad: 'VahranOvasi', zemin: 'vahran-ovasi-yol', orta: 'oba-avi-arena', gok: 0x617786, sis: 0x617786, toprak: 0x5c6148, tas: 0x827b63, gunes: 0xffe4bb, kenar: 0xa6caff, tohum: 931, suslar: 'kaya' },
  goblin: { ad: 'GoblinBlogu', zemin: 'kul-gecidi-bazalt', gok: 0x393039, sis: 0x393039, toprak: 0x483b37, tas: 0x695a54, gunes: 0xffbc91, kenar: 0xada8db, tohum: 94, suslar: 'kaya', kayaBoy: 2.5 },
  oba: { ad: 'ObaAvi', zemin: 'oba-avi-arena', gok: 0x68616a, sis: 0x68616a, toprak: 0x665343, tas: 0x877459, gunes: 0xffdaba, kenar: 0xb5caec, tohum: 41, suslar: 'tribun' },
  pvp: { ad: 'PvP', zemin: 'pvp-arena-doseme', gok: 0x586579, sis: 0x586579, toprak: 0x605b53, tas: 0x908270, gunes: 0xffedcf, kenar: 0xadc8e8, tohum: 81, suslar: 'tribun' },
};

// ---- PBR doku önbelleği (set adı → {map, normal, orm}) ----
const yukleyici = new THREE.TextureLoader();
const DOKU = new Map(); let sonSetler = new Set();
function doku(set, harita, renkli) {
  const k = set + '/' + harita;
  if (DOKU.has(k)) return DOKU.get(k);
  const t = yukleyici.load(KOK + set + '/' + harita + '.webp', () => { t.userData.hazir = true; }, undefined, () => { t.userData.hata = true; });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = gfx.tier === 'high' ? 4 : 2;
  if (renkli) t.colorSpace = THREE.SRGBColorSpace;
  DOKU.set(k, t);
  return t;
}
/** Kullanılmayan setlerin dokularını bırak (arena değişince). */
function dokuBirak(kullanilan) {
  for (const [k, t] of DOKU) if (!kullanilan.has(k.split('/')[0])) { t.dispose(); DOKU.delete(k); }
  sonSetler = kullanilan;
}
export const dokuSayisi = () => DOKU.size;

// Yüzey malzemesi: doku kopyası (tekrar sayısı malzemeye özgü; GPU görseli ortak). ORM: R=AO, G=pürüz, B=metal.
function yuzey(set, tekrar, yedekRenk, normalAc) {
  const m = new THREE.MeshStandardMaterial({ color: yedekRenk, roughness: 0.92, metalness: 0.03 });
  const kopya = (t, rep) => { const c = t.clone(); c.repeat.set(rep, rep); c.needsUpdate = true; return c; };
  const temel = doku(set, 'basecolor', true), orm = doku(set, 'orm', false);
  const bagla = () => {
    if (m.userData.bitti) return;
    m.map = kopya(temel, tekrar); m.color.setHex(0xffffff);
    const o = kopya(orm, tekrar); m.aoMap = o; m.roughnessMap = o; m.metalnessMap = o; m.roughness = 1; m.metalness = 1;
    if (normalAc) { m.normalMap = kopya(doku(set, 'normal', false), tekrar); m.normalScale.setScalar(0.65); }
    m.needsUpdate = true;
  };
  // doku inince bağla (inmeden bağlanırsa ilk karelerde siyah görünür)
  const bekle = () => temel.userData.hazir && orm.userData.hazir ? bagla() : temel.userData.hata || orm.userData.hata ? null : setTimeout(bekle, 60);
  bekle();
  m.userData.kopyalar = () => [m.map, m.aoMap, m.normalMap].filter(Boolean);
  return m;
}

const rastgele = s => () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;

// Süs parçalarını aynı (geometri, malzeme) çiftine göre toplayıp tek InstancedMesh yapar.
class Toplayici {
  constructor() { this.k = new Map(); }
  ekle(geo, mat, x, y, z, sx, sy, sz, ry = 0, rz = 0) {
    const key = geo.uuid + mat.uuid; let e = this.k.get(key); if (!e) this.k.set(key, e = { geo, mat, m: [] });
    const o = new THREE.Object3D(); o.position.set(x, y, z); o.scale.set(sx, sy, sz); o.rotation.set(0, ry, rz); o.updateMatrix();
    e.m.push(o.matrix.clone());
  }
  kur(grup, golge) {
    for (const { geo, mat, m } of this.k.values()) {
      const im = new THREE.InstancedMesh(geo, mat, m.length); m.forEach((x, i) => im.setMatrixAt(i, x));
      im.castShadow = golge; im.receiveShadow = true; im.computeBoundingSphere(); grup.add(im);
    }
  }
}

function kayaGeo() {
  const g = new THREE.IcosahedronGeometry(1, 2), p = g.getAttribute('position'), c = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), r = 1 + 0.1 * Math.sin(x * 9 + y * 7 + z * 10) + 0.04 * Math.cos(x * 17 - y * 13 + z * 11);
    p.setXYZ(i, x * r, y * r, z * r); const v = 0.84 + y * 0.06 + 0.08 * Math.sin(x * 9 + z * 7); c.set([v, v, v], i * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3)); g.computeVertexNormals(); return g;
}

/** Arena kur. anahtar: vahran|goblin|oba|pvp. Döner: { group, sun, skyEnv, fog, skyColor, ucgen, dispose() } */
export function arenaKur(anahtar, { shadows = !!gfx.T.shadow, shadowSize = gfx.T.shadow || 512 } = {}) {
  const c = TEMALAR[anahtar] || TEMALAR.vahran, grup = new THREE.Group(); grup.name = 'KorantArena_' + c.ad;
  const normalAc = gfx.tier === 'high';
  dokuBirak(new Set([c.zemin, c.orta || c.zemin, 'oba-avi-arena']));
  const mats = [], geos = [];
  const M = m => (mats.push(m), m), G = g => (geos.push(g), g);
  const tas = M(yuzey('oba-avi-arena', 1.5, c.tas, false));
  const koyu = M(new THREE.MeshStandardMaterial({ color: c.toprak, roughness: 1 }));
  const bakir = M(new THREE.MeshStandardMaterial({ color: 0x746147, roughness: 0.62, metalness: 0.42 }));
  const kayaM = M(new THREE.MeshStandardMaterial({ color: c.tas, roughness: 0.95, vertexColors: true }));
  const kayaKoyu = M(new THREE.MeshStandardMaterial({ color: c.toprak, roughness: 1, vertexColors: true }));

  const zemin = new THREE.Mesh(G(new THREE.PlaneGeometry(52, 52)), M(yuzey(c.zemin, 13, c.toprak, normalAc)));
  zemin.rotation.x = -Math.PI / 2; zemin.receiveShadow = true; zemin.name = 'zemin'; grup.add(zemin);
  if (c.orta) {
    const disk = new THREE.Mesh(G(new THREE.CircleGeometry(6.8, 48)), M(yuzey(c.orta, 3.7, c.tas, normalAc)));
    disk.rotation.x = -Math.PI / 2; disk.position.y = 0.011; disk.receiveShadow = true; grup.add(disk);
  }
  const halka = new THREE.Mesh(G(new THREE.RingGeometry(7.05, 7.13, 64).rotateX(-Math.PI / 2)), M(new THREE.MeshStandardMaterial({ color: c.tas, roughness: 0.96 })));
  halka.position.y = 0.021; grup.add(halka);

  const T = new Toplayici(), R = rastgele(c.tohum);
  const kutu = G(new THREE.BoxGeometry(1, 1, 1)), kaya = G(kayaGeo()), sutun = G(new THREE.CylinderGeometry(0.89, 1, 1, 8));
  if (c.suslar === 'tribun') {
    for (let i = 0; i < 8; i++) {
      const z = -10.7 + i * 3.05, x = -8.3 - Math.cos((i - 3.5) * 0.46) * 2, ry = 0.04 * (i - 3.5);
      for (let k = 0; k < 3; k++) {
        T.ekle(kutu, k === 0 ? koyu : tas, x - k * 0.34, 0.34 + k * 0.63, z, 1.75, 0.6, 2.96, ry);
        T.ekle(kutu, tas, x + 0.22 - k * 0.34, 0.6 + k * 0.63, z, 1.8, 0.16, 3.02, ry);
      }
      if (i % 2 === 0) {
        T.ekle(sutun, tas, x + 0.3, 2.38, z, 0.46, 3.7, 0.46);
        T.ekle(kutu, bakir, x + 0.3, 4.28, z, 1.23, 0.23, 1.23);
        T.ekle(kutu, tas, x + 0.3, 0.64, z, 1.19, 0.28, 1.19);
        T.ekle(kutu, tas, x + 0.3, 3.98, z, 1.02, 0.21, 1.02);
      }
    }
  } else {
    for (let i = 0; i < 20; i++) {
      const z = -15 + i * 1.6, x = -8 - R() * 8, h = (c.kayaBoy || 1.7) + R() * 3;
      T.ekle(kaya, i % 4 ? kayaM : kayaKoyu, x, h * 0.35, z, 0.8 + R() * 1.6, h * 0.64, 0.7 + R() * 1.6, R() * 4, (R() - 0.5) * 0.46);
    }
  }
  for (let i = 0; i < 24; i++) { const z = R() * 27 - 13.5, x = -6.5 - R() * 11, s = 0.1 + R() * 0.7; T.ekle(kaya, i % 3 ? kayaM : kayaKoyu, x, s * 0.39, z, s * 1.2, s * 0.52, s, R() * 6); }
  T.kur(grup, false); // süsler saha dışında: gölge geçişine girmez (çizim çağrısı bütçesi)

  // Işık: gök/yer yarım küresi + gölgeli güneş + arka kenar ışığı (gövdeyi boyalı/koyu zeminden ayırır)
  const hemi = new THREE.HemisphereLight(0xc2d5ed, c.toprak, 1.35);
  const sun = new THREE.DirectionalLight(c.gunes, 2.55); sun.position.set(6.8, 10.5, 4.2); sun.castShadow = shadows;
  sun.shadow.mapSize.set(shadowSize, shadowSize); sun.userData.dir = sun.position.clone();
  const rim = new THREE.DirectionalLight(c.kenar, 1.0); rim.position.set(-7, 4.8, -6.7);
  grup.add(hemi, sun, rim, sun.target);

  let ucgen = 0; grup.traverse(o => { if (o.isMesh) { const g = o.geometry, n = (g.index ? g.index.count : g.attributes.position.count) / 3; ucgen += n * (o.isInstancedMesh ? o.count : 1); } });
  let bitti = false;
  return {
    group: grup, sun, ucgen, anahtar,
    skyEnv: { sky: [c.gok, 0x9aa5af, 0xb5a48e], ground: c.toprak, sun: c.gunes, sunI: 1.3, rim: c.kenar, rimI: 0.75, dir: [6.8, 10.5, 4.2] },
    fog: new THREE.Fog(c.sis, 18, 46), skyColor: c.gok,
    dispose() {
      if (bitti) return; bitti = true;
      grup.removeFromParent();
      geos.forEach(g => g.dispose());
      // doku kopyaları malzemeye özgü (GPU görseli DOKU önbelleğinde kalır)
      mats.forEach(m => { m.userData.bitti = true; m.userData.kopyalar?.().forEach(t => t.dispose()); m.dispose(); });
      grup.traverse(o => { if (o.isInstancedMesh) o.dispose(); o.shadow?.dispose?.(); });
      grup.clear();
    },
  };
}

/** Savaş türünden arena seçimi (Opus-01 kuralı + boss/PvP). */
export function arenaAnahtari(env, mode, kamMod) {
  if (kamMod === '4v4' || /pvp|meydan|arena/i.test(mode || '')) return 'pvp';
  if (kamMod === 'boss') return /ash|kul|lava/i.test(env || '') ? 'goblin' : 'oba';
  if (/ash|goblin|kul|dungeon|cave|mine/i.test(env || '')) return 'goblin';
  return 'vahran';
}
/** Bütün arena dokularını bırak (grafik kademesi düşünce / test). */
export function arenaDokuBosalt() { dokuBirak(new Set()); }
