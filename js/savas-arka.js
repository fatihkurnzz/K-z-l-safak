// 22 Kas (kullanıcı): savaş arka planları artık GPT'nin boyalı sahne resimleri (10 resim, ikişer üst üste 5 WebP,
// js/savas-arka-png.js'e gömülü; kaynak _tasarim/gelen/savas-arka/, üretici _tasarim/araclar/savas-arka-gom.py). Koddan çizilen savaş ortamı (gök kubbe, çimen, ağaç, kaya,
// meydan taşı) savaşta artık kurulmaz (models.js buildEnv 'foto:' kipi).
// Resim, savaşın taban kamerasından (projektör) zemine ve arkadaki kavisli perdeye yansıtılır: taban kadrajda resim birebir
// görünür, kamera yaklaşınca ya da döndüğünde zemin ve ufuk gerçek derinlikte kayar (düz bir kâğıt gibi kaymaz).
// Işıklar resmin ışığına göre ayarlıdır (LIGHT); karakterin gölgesi görünmez bir gölge düzlemine düşer.
import { THREE, camera, renderer } from './engine3d.js';

/** P29: tuval (1824x862, resim genişliğe oturur: 1376x768 → 1824x1018) dikey kırpma oranı; 0 üst … 1 alt (P31-G3: 1'den büyük = resim daha yukarı, alt boşluk aynalı zemin). */
export const SAH_KIRP = 0.6;
/** P29: resimdeki zemin kenarı (üstten oran) → tuvaldeki ufuk oranı (kırpma ky ile). */
export const kirpUfuk = (hi, ky = SAH_KIRP) => { const h = 1824 * 768 / 1376; return +((h * hi + (862 - h) * ky) / 862).toFixed(3); };
const sah = (ad, hi, ky = SAH_KIRP) => ['sah:' + ad, 0, kirpUfuk(hi, ky), ky];
// ad → [dosya, yarı (0 üst, 1 alt), ufuk: zemin kenarının resimdeki yüksekliği (üstten oran)]
export const BGS = {
  yemin: [1, 0, 0.48], carsi: [1, 1, 0.42], kapi: [2, 0, 0.49], ocak: [2, 1, 0.47], harabe: [3, 0, 0.47],
  volkan: [3, 1, 0.42], sur: [4, 0, 0.46], selale: [4, 1, 0.5], guz: [5, 0, 0.43], karli: [5, 1, 0.45],
  orman: ['orman', 0, 0.6], // P26 K4: öğretici savaşı (Eğitim Ormanı); resim p26-orman-png.js'ten, OZEL_BG ile seçilir
  // P29 (TALIMAT §3): zeminler düz dosya sahneler/<ad>.webp (1376x768, tek resim), yalnız o savaş/VS açılınca iner. Alt ön yarı düz
  // savaş zemini; birim tabanları ekranın alt %20–35 bandında. [dosya 'sah:<ad>', yarı (tek resim: 0), ufuk (tuvaldeki zemin kenarı,
  // üstten oran; resimdeki kenardan kirpUfuk ile hesaplanır), dikey kırpma (0 üst … 1 alt)]
  // P31-G3: birimler zemine otursun diye her resim, arka sıranın ayağı (880x406'da ekranın ~%53'ü) resmin zemin kenarının hemen
  // altına düşecek kadar yukarı kaydırılır (ky > 1: resmin altındaki boşluk zeminin aynasıyla dolar; üstteki gök/tavan kırpılır).
  // hi = resimdeki zemin kenarı (gözle ölçüldü), ky = ((hi + 0.01) * 1018 - 0.53 * 862) / 156. Eski değerler: hi 0.58–0.66, ky 0.6 (zocak 0.74 / 1).
  vahran: sah('savas_vahran_ovasi', 0.6, 1.05), kulgecit: sah('savas_kul_gecidi', 0.63, 1.25), kizilbahar: sah('savas_kizil_bahar', 0.6, 1.05),
  sisli: sah('savas_sisli_cukur', 0.66, 1.44), bossmag: sah('savas_boss_magarasi', 0.7, 1.7), pvparena: sah('savas_pvp_arena', 0.67, 1.51),
  zkuyu: sah('zindan_dipsiz_kuyu', 0.7, 1.7), zyarik: sah('zindan_gok_yarigi', 0.69, 1.64), zmuhur: sah('zindan_muhurlu_oda', 0.7, 1.7), zkule: sah('zindan_kul_kulesi', 0.7, 1.7),
  // P30: Yeraltı Ocağı zindanı ve Oba Avı arenası (yaratıksız genel klan boss sahnesi; bütün klan boss'ları burada savaşır)
  // P31-G3: Yeraltı Ocağı'nın taş zemini resmin alt %19'u (lav bandı 0.65–0.80): birimler lavın önündeki taşa iner.
  zocak: sah('zindan_yeralti_ocagi', 0.81, 2.42), obaavi: sah('savas_oba_avi_arena', 0.66, 1.44),
};
/**
 * P31-G3: sahne başına birim ortam tonu ve ayak altı temas gölgesi (yalnız çizim; savas-birim2d.js okur).
 * ton: boyalı figürün renk çarpanı [r, g, b] (1 = değişmez; en çok ~%12 kayma) · golge: temas gölgesinin koyuluğu (0–1).
 * Tabloda olmayan zemin `_` satırını alır.
 */
export const ZEMIN_TON = {
  _:          { ton: [1, 1, 1],          golge: 0.55 },
  vahran:     { ton: [0.95, 0.98, 0.97], golge: 0.55 }, // bulutlu ova: serin gri-yeşil
  kulgecit:   { ton: [1, 0.93, 0.88],    golge: 0.6 },  // kor ve kül: sıcak
  kizilbahar: { ton: [1, 0.95, 0.9],     golge: 0.55 }, // güz kızılı: ılık
  sisli:      { ton: [0.9, 0.97, 0.95],  golge: 0.5 },  // sis: soğuk gri-yeşil
  bossmag:    { ton: [0.92, 0.95, 1],    golge: 0.6 },  // mağara: soğuk
  pvparena:   { ton: [1, 0.96, 0.92],    golge: 0.55 }, // meşale ve akşam: ılık
  zkuyu:      { ton: [0.91, 0.96, 1],    golge: 0.6 },  // kuyu: soğuk mavi-gri
  zyarik:     { ton: [0.92, 0.91, 1],    golge: 0.55 }, // fırtına: soğuk mavi-mor
  zmuhur:     { ton: [1, 0.95, 0.89],    golge: 0.6 },  // meşale: amber
  zkule:      { ton: [1, 0.94, 0.89],    golge: 0.6 },  // dumanlı kule: sıcak
  zocak:      { ton: [1, 0.91, 0.88],    golge: 0.65 }, // lav: sıcak turuncu
  obaavi:     { ton: [1, 0.96, 0.9],     golge: 0.55 }, // tozlu arena: ılık
};
/** P31-G3: o an kurulu savaş zemininin kimliği (buildBackdrop yazar). */
export const ZEMIN = { aktif: '' }; globalThis.DD_ZEMIN = ZEMIN; // P33: ses sahnesi (ui-ses.js) zindan ortamını seçer; three yüklemeden okunur
/** P31-G3: kurulu zeminin ton/gölge satırı. */
export const zeminTon = () => ZEMIN_TON[ZEMIN.aktif] || ZEMIN_TON._;
/** P29: bölge (shared/zones.js ZONES id) → zemin. Bölge aşamalarının hepsi; günlük boss aşaması (kind 'boss') BOSS_BG alır. */
export const ZONE_BG = { 1: 'vahran', 2: 'kulgecit', 3: 'kizilbahar', 4: 'sisli' };
/** P29: PvP Meydan/Arena/CZ zemini ve bölge boss'u (Bölge Boss Mağarası). */
export const PVP_BG = 'pvparena', BOSS_BG = 'bossmag';
/** P29: zindan/boss kipi (shared/modes.js) → zemin. Zindanlar ayrı ayrı; karşılığı olmayan boss kipleri Bölge Boss Mağarası. */
export const ZINDAN_BG = { well: 'zkuyu', rift: 'zyarik', seal: 'zmuhur', kule: 'zkule', depth: 'zocak', clanboss: 'obaavi', baskin: BOSS_BG };
export const ZINDAN_MODES = new Set(Object.keys(ZINDAN_BG));
/** P28: o anki savaşın aşama bağlamı ({ zone, boss }). ui-battle.js startBattle her savaşta yazar (aşama dışı kiplerde boşaltır). */
export const ARKA_BAGLAM = { zone: 0, boss: false };
/** P28: aşama bağlamını yazar; stageDef çıktısı (ya da null) alır. */
export function arkaAsama(def) { ARKA_BAGLAM.zone = def?.zone || 0; ARKA_BAGLAM.boss = def?.kind === 'boss'; }
/** P26 K4: öğretici savaşına özel arka plan. orman.js doldurur: id ('' = kapalı), yukle() → Promise<data URL> (tek resim). */
export const OZEL_BG = { id: '', yukle: null };
// 23 Kas (T-03 yeniden uygulama): arka plan ortam türüne göre TARAFSIZ resimlerden seçilir. Resimler: yemin/carsi = Yemin Pazarı (ortak),
// kapi = Kragmir (ocak) kale kapısı, sur/selale = Elentha (sancak) kalesi/şehri, ocak = demir ocağı (sancaksız), harabe/volkan/guz/karli ortak.
// Kural: halka ait resim (BG_FACTION) yalnız Destan'da (MODE_BG 'home') oyuncunun KENDİ halkının kalesi olarak görünür; yanlış halka asla.
// PvP kipleri (PVP_MODES) Yemin Pazarı'nı (yemin/carsi) kullanır. Aynı savaş (tohum) hep aynı resmi alır.
export const BG_FACTION = { kapi: 'ocak', sur: 'sancak', selale: 'sancak' };
export const HOME = { ocak: 'kapi', sancak: 'sur' }; // halkın kendi kalesi
export const PVP_MODES = new Set(['arena', 'live', 'banner', 'siege', 'anit']); // shared/modes.js PVP kümesi
export const NEUTRAL_FALLBACK = ['guz', 'harabe'];
export const KIND_BG = {
  arena: ['yemin', 'carsi'], castle: ['volkan', 'harabe'], graveyard: ['harabe', 'volkan'], shrine: ['harabe', 'yemin'],
  forest: ['guz'], meadow: ['guz'], steppe: ['guz'], autumn: ['guz'], desert: ['volkan', 'carsi'],
  canyon: ['volkan'], ashland: ['volkan'], swamp: ['harabe'], snow: ['karli'], glacier: ['karli'],
};
// mod → tür → liste ('home' = oyuncunun kendi halkının kalesi)
export const MODE_BG = {
  destan: { castle: 'home' },     // Destan: kendi sarayı
  depth: { castle: ['ocak'] },    // Yeraltı Ocağı: demir ocağı
  siege: { castle: ['yemin'] },   // Hisar Kuşatması: ortak meydan
};
/**
 * Savaş zemini seçer. P29 sırası: öğretici → PvP (pvparena) → zindan/boss kipleri (ZINDAN_BG[mode]) → bölge aşaması (ctx.zone; günlük
 * boss bossmag) → eski kural (MODE_BG/KIND_BG). ctx verilmezse ARKA_BAGLAM (yalnız mode 'stage'/'' iken okunur).
 */
export function pickBg(kind, seed = 0, mode = '', faction = '', ctx = ARKA_BAGLAM) {
  if (OZEL_BG.id && BGS[OZEL_BG.id]) return OZEL_BG.id; // P26 K4: öğretici savaşı kendi ormanında
  if (PVP_MODES.has(mode)) return PVP_BG;
  if (ZINDAN_MODES.has(mode)) return ZINDAN_BG[mode];
  if ((!mode || mode === 'stage') && ctx?.zone && ZONE_BG[ctx.zone]) return ctx.boss ? BOSS_BG : ZONE_BG[ctx.zone];
  let L = MODE_BG[mode]?.[kind];
  const home = L === 'home';
  if (home) L = HOME[faction] ? [HOME[faction]] : null;
  if (!L) L = KIND_BG[kind] || NEUTRAL_FALLBACK;
  if (!home) { const ok = L.filter(id => !BG_FACTION[id]); L = ok.length ? ok : NEUTRAL_FALLBACK; } // halka ait resim yalnız 'home'
  return L[Math.abs(seed | 0) % L.length];
}
// Işık takımları (resmin saatine ve rengine göre): key = gölge düşüren ana ışık (kameranın yanından), rim = resmin ışık
// kaynağı yönünden kontur ışığı, hemi = gök/yer dolgusu, sky = ortam yansıması için gök renkleri (resimden örneklendi)
export const LIGHT = {
  yemin:  { key: [0xffe6d2, 2.5, [7, 10, 6]], rim: [0xffc8a0, 0.8, [-10, 5, 5]], hemi: [0xdcdcf0, 0x7a746a, 0.95], sky: ['#9594a7', '#91878c', '#6e727d'], exp: 0.92, sh: 0.32 },
  carsi:  { key: [0xffc890, 1.9, [6, 9, -4]], rim: [0x9fb0ff, 0.7, [-9, 6, 0]], hemi: [0x8ea0e0, 0x5a4a3a, 0.85], sky: ['#355388', '#424c66', '#393236'], exp: 0.95, sh: 0.4 },
  kapi:   { key: [0xffb496, 2.0, [6, 9, 6]], rim: [0xff7040, 1.0, [-10, 3, 8]], hemi: [0xb08090, 0x3a2420, 0.75], sky: ['#52383c', '#5c3631', '#4c2e2b'], exp: 0.95, sh: 0.42 },
  ocak:   { key: [0xffa868, 2.0, [5, 9, 3]], rim: [0xff7a2a, 1.3, [-10, 5, 0]], hemi: [0xff9a5a, 0x3a2418, 0.7], sky: ['#503b37', '#5a3a2e', '#9a5a2d'], exp: 0.95, sh: 0.42 },
  harabe: { key: [0xc4d0ff, 1.8, [7, 11, 5]], rim: [0xff5a3a, 0.9, [-6, 4, -8]], hemi: [0x9fb2e0, 0x3a3440, 0.8], sky: ['#384b68', '#3c4c66', '#404c63'], exp: 0.95, sh: 0.4 },
  volkan: { key: [0xffa070, 2.0, [6, 9, 4]], rim: [0xff6a2a, 1.2, [-10, 4, 6]], hemi: [0xd08060, 0x3a2018, 0.7], sky: ['#7c4b43', '#944f3b', '#623832'], exp: 0.95, sh: 0.42 },
  sur:    { key: [0xfff0d8, 2.8, [6, 11, -5]], rim: [0xffe0a0, 0.6, [-10, 6, -6]], hemi: [0xcfe4ff, 0x8a7a5a, 0.95], sky: ['#9c999b', '#958c83', '#7f765d'], exp: 0.88, sh: 0.3 },
  selale: { key: [0xfff6e8, 2.8, [6, 12, 3]], rim: [0xffffff, 0.45, [-10, 6, 0]], hemi: [0xcfe4ff, 0x6a7a5a, 1.0], sky: ['#7c949e', '#839396', '#89999b'], exp: 0.88, sh: 0.28 },
  guz:    { key: [0xffcc94, 2.3, [5, 8, 7]], rim: [0xffa050, 1.1, [-10, 4, 8]], hemi: [0xffd0a0, 0x5a4030, 0.8], sky: ['#9d6644', '#825c4b', '#624230'], exp: 0.92, sh: 0.36 },
  karli:  { key: [0xe8f0ff, 2.3, [6, 12, 4]], rim: [0xffffff, 0.45, [-10, 6, 0]], hemi: [0xdce8ff, 0x8a929e, 1.0], sky: ['#96afce', '#7a92ad', '#4f6174'], exp: 0.9, sh: 0.3 },
  orman:  { key: [0xdce4f0, 2.1, [6, 10, 5]], rim: [0xff9a4a, 1.0, [-10, 4, 6]], hemi: [0xb0bcc8, 0x3a3a2e, 0.85], sky: ['#6a747c', '#4e5860', '#2e3430'], exp: 0.92, sh: 0.38 },
};

// P29: yeni zeminlerin ışığı en yakın eski resmin takımından (resmin saati/rengi)
Object.assign(LIGHT, { vahran: LIGHT.harabe, kulgecit: LIGHT.volkan, kizilbahar: LIGHT.guz, sisli: LIGHT.harabe, bossmag: LIGHT.harabe, pvparena: LIGHT.yemin,
  zkuyu: LIGHT.harabe, zyarik: LIGHT.harabe, zmuhur: LIGHT.ocak, zkule: LIGHT.ocak });

// Projektör: resmin "çekildiği" kamera. Savaş kamerası (savas-kamera.js) taban kadrajını kurunca setProjector çağırır.
const PROJ = { view: new THREE.Matrix4(), pos: new THREE.Vector3(13, 3.4, 0), look: new THREE.Vector3(0, 1.4, 0), set: false };
const mats = new Set();
const tmpCam = new THREE.PerspectiveCamera();
function syncProj() {
  tmpCam.position.copy(PROJ.pos); tmpCam.up.set(0, 1, 0); tmpCam.lookAt(PROJ.look); tmpCam.updateMatrixWorld(true);
  PROJ.view.copy(tmpCam.matrixWorldInverse);
}
syncProj();
export function setProjector(pos, look) {
  PROJ.pos.copy(pos); PROJ.look.copy(look); PROJ.set = true; syncProj();
  for (const m of mats) m.userData.reshape?.();
}
export const projector = () => PROJ;

/** P29: 'sah:<ad>' → düz dosya yolu sahneler/<ad>.webp (tembel; yalnız savaş/VS açılınca istenir). */
export const sahUrl = n => `sahneler/${String(n).slice(4)}.webp`;
const isSah = n => String(n).startsWith('sah:');
const cache = new Map(); // dosya no → doku (savaşlar arasında yeniden indirilmez)
function tex(n, onLoad) {
  let t = cache.get(n);
  if (t) { if (t.image) onLoad(t); else t.userData.wait.push(onLoad); return t; }
  t = new THREE.Texture(); t.userData.wait = [onLoad]; cache.set(n, t);
  if (n === 'orman' || isSah(n)) { // P26 K4 / P29: tek resim; gölgelendirici ikişer üst üste resim bekler (en/boy 1824x862): kaplayacak gibi iki yarıya çiz
    const dz = n !== 'orman', ky = dz ? (Object.values(BGS).find(b => b[0] === n)?.[3] ?? SAH_KIRP) : 0.6;
    Promise.resolve(dz ? sahUrl(n) : OZEL_BG.yukle?.()).then(url => new Promise((ok, no) => { if (!url) return no(); const im = new Image(); im.onload = () => ok(im); im.onerror = no; im.src = url; })).then(im => {
      const c = document.createElement('canvas'), W = 1824, H = 862; c.width = W; c.height = H * 2;
      const k = Math.max(W / im.naturalWidth, H / im.naturalHeight), w = im.naturalWidth * k, h = im.naturalHeight * k, x = (W - w) / 2, y = (H - h) * ky;
      // P31-G3: ky > 1 iken resim yukarı kayar; altta kalan boşluk resmin alt kenarına göre aynalanmış zeminle dolar
      const g = c.getContext('2d'); for (const o of [0, H]) { g.save(); g.beginPath(); g.rect(0, o, W, H); g.clip(); g.drawImage(im, x, o + y, w, h); if (y + h < H) { g.translate(0, 2 * (o + y + h)); g.scale(1, -1); g.drawImage(im, x, o + y, w, h); } g.restore(); }
      t.image = c; t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.MirroredRepeatWrapping; t.wrapT = THREE.ClampToEdgeWrapping; t.needsUpdate = true;
      t.userData.wait.splice(0).forEach(f => f(t));
    }).catch(() => cache.delete(n));
    return t;
  }
  // resimler js/savas-arka-png.js'e gömülü (yayın dosya sınırı); ilk savaşta bir kez indirilir, Blob URL'den çözülür
  import('./savas-arka-png.js').then(M => URL.createObjectURL(new Blob([Uint8Array.from(atob(M.PNG[n]), c => c.charCodeAt(0))], { type: 'image/webp' }))).then(url => new THREE.ImageLoader().load(url, im => {
    t.image = im; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    t.wrapS = THREE.MirroredRepeatWrapping; t.wrapT = THREE.ClampToEdgeWrapping; t.needsUpdate = true;
    t.userData.wait.splice(0).forEach(f => f(t));
  }, undefined, () => { cache.delete(n); })).catch(() => cache.delete(n));
  return t;
}
// Önden yükle (ör. VS ekranı açılınca): savaş başladığında resim hazır olsun
export function preloadBg(kind, seed, mode, faction) { const id = pickBg(kind, seed, mode, faction); tex(BGS[id][0], () => { }); } // 23 Kas: mod/halk

const VERT = `varying vec3 vW;
void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
// Ton eşleme tersi: sahne ACES ile ton eşlenir (engine3d); resim ekranda kendi renginde görünsün diye boya önce ACES'in
// tersinden geçirilir (ışıma eşiğinin altında tutulur: resim parlamaz).
const FRAG = `uniform sampler2D map; uniform mat4 pView; uniform mat4 pProj; uniform vec2 sc; uniform float half_, ready, expo; uniform vec3 base;
varying vec3 vW;
vec3 invAces(vec3 y){
  const mat3 I = mat3(vec3(0.59719,0.07600,0.02840), vec3(0.35458,0.90834,0.13383), vec3(0.04823,0.01566,0.83777));
  const mat3 O = mat3(vec3(1.60475,-0.10208,-0.00327), vec3(-0.53108,1.10813,-0.07276), vec3(-0.07367,-0.00605,1.07602));
  vec3 c = clamp(inverse(O) * y, 0.0, 0.985);
  vec3 A = 1.0 - 0.983729 * c, B = 0.0245786 - 0.4329510 * c, C = -(0.000090537 + 0.238081 * c);
  vec3 v = (-B + sqrt(max(B * B - 4.0 * A * C, 0.0))) / (2.0 * A);
  return max(inverse(I) * v, 0.0) * 0.6 / expo;
}
void main(){
  vec4 p = pProj * pView * vec4(vW, 1.0);
  vec2 n = p.xy / max(p.w, 1e-4);
  vec2 uv = vec2(0.5 + 0.5 * n.x * sc.x, clamp(0.5 + 0.5 * n.y * sc.y, 0.002, 0.998));
  uv.y = uv.y * 0.5 + (half_ > 0.5 ? 0.0 : 0.5);
  vec3 col = mix(base, texture2D(map, uv).rgb, ready);
  gl_FragColor = vec4(min(invAces(col), vec3(1.1)), 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

// Arka planı gruba ekler. Geometri projektöre göre kurulur: zemin (y=0) ve resimdeki zemin kenarının yere değdiği uzaklıkta,
// projektörün çevresinde kavisli dikey perde. Taban kadrajdan bakınca ikisi birlikte resmin kendisidir.
export function buildBackdrop(group, id) {
  const B = BGS[id] || BGS.yemin, L = LIGHT[id] || LIGHT.yemin;
  ZEMIN.aktif = BGS[id] ? id : 'yemin';
  const base = new THREE.Color(L.sky[2]).convertSRGBToLinear();
  const U = {
    map: { value: null }, pView: { value: PROJ.view }, pProj: { value: new THREE.Matrix4() }, sc: { value: new THREE.Vector2(1, 1) },
    half_: { value: B[1] }, ready: { value: 0 }, expo: { value: 1 }, base: { value: base },
  };
  const mat = new THREE.ShaderMaterial({ uniforms: U, vertexShader: VERT, fragmentShader: FRAG, fog: false, depthWrite: true });
  mat.userData.U = U; mats.add(mat); mat.addEventListener('dispose', () => mats.delete(mat));
  const IMG_A = 1824 / 862;
  const geoms = [];
  const root = new THREE.Group();
  // Projektörün en/boy oranı canlı kameranınkidir (ekran dönünce/değişince resim yine ekranı kaplar: kenarlar kırpılır)
  const upd = () => {
    U.pProj.value.copy(camera.projectionMatrix);
    const a = camera.aspect || 2;
    if (a > IMG_A) U.sc.value.set(1, IMG_A / a); else U.sc.value.set(a / IMG_A, 1);
    U.expo.value = renderer.toneMappingExposure || 1;
  };
  // Perdenin yarıçapı: resimdeki zemin kenarına giden ışının yere değdiği uzaklık (en az 21: boss perdeye girmesin)
  mat.userData.reshape = () => {
    for (const g of geoms) g.dispose(); geoms.length = 0; root.clear();
    const P = PROJ.pos, dir = PROJ.look.clone().sub(P).normalize();
    const pitch = Math.asin(dir.y), vfov = THREE.MathUtils.degToRad(camera.fov || 42);
    const a = camera.aspect || 2, sy = a > IMG_A ? IMG_A / a : 1;
    const ny = (1 - 2 * B[2]) / sy; // ufuk satırının projektör NDC'si
    const ang = pitch + Math.atan(ny * Math.tan(vfov / 2));
    const dist = ang < -0.02 ? P.y / Math.tan(-ang) : 60;
    const R = Math.min(60, Math.max(21, dist));
    // zemin: projektörün ayağı çevresinde geniş daire (perdenin biraz dışına taşar: kenarda boşluk görünmez)
    const g0 = new THREE.CircleGeometry(R + 2, 64).rotateX(-Math.PI / 2).translate(P.x, 0, P.z);
    // perde: projektörün baktığı yönde ±110° yay, yerden 45 birim yükseğe
    const th = Math.atan2(dir.x, dir.z) - THREE.MathUtils.degToRad(110); // silindirde açı θ → (sin θ, cos θ): yay ortası bakış yönünde
    const g1 = new THREE.CylinderGeometry(R, R, 45, 72, 1, true, th, THREE.MathUtils.degToRad(220));
    g1.translate(P.x, 22.5 - 0.05, P.z);
    geoms.push(g0, g1);
    const m0 = new THREE.Mesh(g0, mat), m1 = new THREE.Mesh(g1, mat);
    m1.material.side = THREE.DoubleSide;
    for (const m of [m0, m1]) { m.frustumCulled = false; m.renderOrder = -10; m.onBeforeRender = upd; root.add(m); }
    // karakter gölgeleri: zeminin hemen üstünde görünmez gölge düzlemi
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(40, 40).rotateX(-Math.PI / 2), new THREE.ShadowMaterial({ opacity: L.sh }));
    sh.receiveShadow = true; sh.position.y = 0.004; geoms.push(sh.geometry); root.add(sh);
  };
  mat.userData.reshape();
  group.add(root);
  tex(B[0], t => { if (!mats.has(mat)) return; U.map.value = t; const t0 = performance.now(); const f = () => { if (!mats.has(mat)) return; U.ready.value = Math.min(1, (performance.now() - t0) / 350); if (U.ready.value < 1) requestAnimationFrame(f); }; f(); });
  return root;
}
// C14 (23 Kas): resim paketi (~4 MB) açılışta değil, savaşa gidilirken (Kapı / VS ekranı, combat.js savasOnYukle) boşta
// önden indirilir. Savaş doğrudan başlarsa tex() kendisi indirir; arka plan hazır olunca yumuşakça belirir.
// P28: savaşların çoğu artık düz dosya zemin kullanır; 4 MB eski paket Kapı'da önden İNDİRİLMEZ (yalnız eski zemine düşen
// savaş başlarken tex() indirir). İmza korunur (combat.js savasOnYukle çağırır).
export const arkaOnYukle = () => Promise.resolve(null);

// 23 Kas (P23 K11.2): VS ekranının arka planı = savaşın yapılacağı yerin boyalı resmi (pickBg ile aynı seçim). Yarım resmi keser,
// Blob URL verir; aynı resim bir kez çözülür. Savaş tohumu VS'de bilinmez (0 alınır): tek resimli türlerde birebir aynıdır.
const VSBG = new Map();
/** VS arka plan kimliği (pickBg ile aynı eşleme). ctx: aşama bağlamı { zone, boss } (VS'de stageDef'ten). */
export const vsArkaId = (kind, mode, faction, ctx = null) => pickBg(kind, 0, mode, faction, ctx);
export function vsArkaUrl(id) {
  if (id === 'orman') return Promise.resolve(OZEL_BG.yukle?.() || null).catch(() => null); // P26 K4: tek resim, kesilmez
  if (isSah(BGS[id]?.[0])) return Promise.resolve(sahUrl(BGS[id][0])); // P29: düz dosya, kesilmez
  if (VSBG.has(id)) return VSBG.get(id);
  const [n, yari] = BGS[id] || [];
  const p = !n ? Promise.resolve(null) : import('./savas-arka-png.js').then(M => new Promise(ok => {
    const im = new Image();
    im.onload = () => {
      const w = im.naturalWidth, h = im.naturalHeight / 2, c = document.createElement('canvas'); c.width = w; c.height = h;
      c.getContext('2d').drawImage(im, 0, yari ? h : 0, w, h, 0, 0, w, h);
      c.toBlob(b => ok(b ? URL.createObjectURL(b) : null), 'image/jpeg', 0.8);
    };
    im.onerror = () => ok(null);
    im.src = URL.createObjectURL(new Blob([Uint8Array.from(atob(M.PNG[n]), ch => ch.charCodeAt(0))], { type: 'image/webp' }));
  })).catch(() => null);
  VSBG.set(id, p); return p;
}
