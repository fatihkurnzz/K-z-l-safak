// Gün/gece ve hava: 3B ortamın paleti, ışıkları ve atmosferi oyun saatine (UTC+3) ve günün havasına göre ayarlanır.
// Ortamı models.js kurar; bu modül yalnızca ortamın parametrelerini (gök, sis, güneş, ortam ışığı, meşale, pencere) kurulmadan
// önce dönüştürür (world.js: ensureEnv → buildEnv(kind, mood, todEnv)) ve kurulduktan sonra yağmuru ekler, bina pencerelerini
// ayarlar. Kural içermez: bonuslar sunucudadır (shared/realm.js); burası yalnızca görünümdür.
//  - Taraf havası korunur: Kragmir her evrede kor rengi ve kasvetli, Elentha açık ve mavidir; evre bunun üstüne biner.
//  - Deneme için adres çubuğundan ?tod=dawn|day|dusk|night ve ?wx=clear|rain|fog|wind verilebilir (yalnızca görünüm).
import { THREE, scene, onUpdate, gfx } from './engine3d.js';
import { now } from './api.js';
import { phaseOf, weatherAt, PHASES, WEATHER } from '../shared/realm.js';

const Q = new URLSearchParams(location.search);
const forced = (k, table) => { const v = window.DD_TOD?.[k] || Q.get(k); return v && Object.hasOwn(table, v) ? v : null; }; // DD_TOD: otomatik denemeler sayfayı yenilemeden değiştirir
export const phaseNow = () => forced('tod', PHASES) || phaseOf(now());
export const weatherNow = () => forced('wx', WEATHER) || weatherAt(now());
// Ortamın yeniden kurulmasını gerektiren durum (evre ya da hava değişince anahtar değişir)
export const todKey = () => `${phaseNow()}.${weatherNow()}`;

const C = new THREE.Color(), D = new THREE.Color();
const hex = c => (typeof c === 'string' ? parseInt(c.slice(1), 16) : c);
const mix = (a, b, k) => C.setHex(hex(a)).lerp(D.setHex(hex(b)), k).getHex();
const css = n => '#' + n.toString(16).padStart(6, '0');
const shade = (c, k) => C.setHex(hex(c)).multiplyScalar(k).getHex();
// Gök geçişi (yukarıdan ufka): hedef palet, ortamın durak sayısına örneklenir
function mixSky(sky, to, k) {
  return sky.map((s, i) => { const t = sky.length > 1 ? i / (sky.length - 1) * (to.length - 1) : 0, a = Math.floor(t), b = Math.min(to.length - 1, a + 1); return css(mix(s, mix(to[a], to[b], t - a), k)); });
}

// Evre başına hedefler. sky: gök paleti (üstten ufka) · k: palete yaklaşma oranı · sun/sunI: güneş (gece: ay) rengi ve çarpanı
// amb: ortam ışığı rengi · hemi: ortam ışığı çarpanı · ground: zemin/yaprak koyuluğu · far: sis uzaklığı çarpanı
// torch / win: meşale ve pencere ışığının en az değeri ve çarpanı (gece yanar, gündüz söner)
// Evreye göre ayrıca: ana ışığın yönü (şafakta ve akşam alçaktan gelir, gölgeler uzar) ve pozlama çarpanı (gece sahne
// kararır ama okunur kalsın diye pozlama biraz açılır).
const SUN_DIR = { dawn: [8, 6.5, 5], day: [6, 11, 5], dusk: [-8, 6, 5], night: [-4, 11, 4] };
// Sisin ağardığı ton evreye göre değişir: gündüz açık gri, gece koyu (gece sisi gündüz gibi parlamasın)
const FOG_GREY = { dawn: 0xa8a2a6, day: 0xb8bcc0, dusk: 0x8a8088, night: 0x3e4452 };
const EXPO = { plain: { dawn: 1, day: 0.95, dusk: 1, night: 1.35 }, ocak: { dawn: 1.05, day: 0.86, dusk: 1.2, night: 1.5 }, sancak: { dawn: 1.1, day: 1, dusk: 1.15, night: 1.5 } };
const TOD = {
  // Savaş ortamları (taraf havası yok): zaten loş sahnelerdir; gündüz hafifçe açılır, gece koyulaşır
  plain: {
    dawn:  { sky: ['#1a1c3a', '#5a3a5a', '#d8845a', '#ffcf9a'], k: 0.45, sun: 0xffb486, sunI: 0.9, amb: 0xd8a890, hemi: 1.0, ground: 0.95, far: 1.0, torch: [1, 1], win: [2.2, 1] },
    day:   { sky: ['#3a6aa8', '#7aa6d6', '#c6dcec', '#eef2e6'], k: 0.38, sun: 0xfff2dc, sunI: 1.2, amb: 0xdde8ff, hemi: 1.35, ground: 1.12, far: 1.25, torch: [0, 0.6], win: [0, 0.5] },
    dusk:  { sky: ['#14143a', '#4a2456', '#c2502a', '#ffae5a'], k: 0.45, sun: 0xff8a50, sunI: 0.85, amb: 0xc88a78, hemi: 0.9, ground: 0.9, far: 0.95, torch: [1.2, 1.2], win: [2.4, 1.2] },
    night: { sky: ['#01020a', '#050a1c', '#0c1430', '#182244'], k: 0.6, sun: 0x9db4ff, sunI: 0.9, amb: 0x6a7ab8, hemi: 0.95, ground: 0.74, far: 0.8, torch: [1.5, 1.4], win: [2.6, 1.4] },
  },
  // Kragmir ana üssü: taban hâli kor rengi alacakaranlıktır (akşam ona en yakın evredir)
  ocak: {
    dawn:  { sky: ['#0c0608', '#3a1620', '#96402c', '#e0965a'], k: 0.55, sun: 0xffa070, sunI: 1.0, amb: 0xc88868, hemi: 1.1, ground: 1.0, far: 1.1, torch: [1.2, 0.8], win: [2.0, 0.8] },
    day:   { sky: ['#3a2a26', '#6e4a38', '#b0764a', '#dcae78'], k: 0.6, sun: 0xffc8a0, sunI: 1.45, amb: 0xd8a888, hemi: 1.5, ground: 1.22, far: 1.35, torch: [0, 0.45], win: [0, 0.35] },
    dusk:  { sky: ['#040203', '#170a09', '#3d160d', '#7c3414'], k: 0.0, sun: 0xff9460, sunI: 1.0, amb: 0xb87858, hemi: 1.0, ground: 1.0, far: 1.0, torch: [1.7, 1], win: [3.0, 1] },
    night: { sky: ['#020101', '#0a0306', '#1c090c', '#3a150e'], k: 0.85, sun: 0xe07048, sunI: 0.72, amb: 0x8a4a3a, hemi: 0.85, ground: 0.74, far: 0.82, torch: [2.2, 1.35], win: [3.6, 1.3] },
  },
  // Elentha ana üssü: taban hâli açık gündüzdür
  sancak: {
    dawn:  { sky: ['#2b3a67', '#7a5a8a', '#e89a78', '#ffd8ae'], k: 0.7, sun: 0xffc090, sunI: 0.72, amb: 0xe8b8a0, hemi: 0.8, ground: 0.86, far: 0.9, torch: [1.0, 1], win: [1.8, 1] },
    day:   { sky: ['#2c68bd', '#5c9be0', '#a9d0f2', '#dcebf5'], k: 0.0, sun: 0xfff3d8, sunI: 1.0, amb: 0xcfe4ff, hemi: 1.0, ground: 1.0, far: 1.0, torch: [0.3, 1], win: [0.5, 1] },
    dusk:  { sky: ['#1e2a6a', '#6a3a7a', '#e0683a', '#ffc070'], k: 0.75, sun: 0xff9a5a, sunI: 0.62, amb: 0xd89a88, hemi: 0.68, ground: 0.78, far: 0.85, torch: [1.4, 1], win: [2.6, 1] },
    night: { sky: ['#030614', '#0a1434', '#16285c', '#2c4484'], k: 0.92, sun: 0x9ab4ff, sunI: 0.34, amb: 0x6a82c8, hemi: 0.5, ground: 0.56, far: 0.72, torch: [1.8, 1], win: [3.2, 1] },
  },
};
const lamp = ([min, mul], base) => Math.max(min, base * mul);

// buildEnv'in çağırdığı dönüştürücü: E ortamın (ve varsa taraf havasının) parametreleridir; yeni bir nesne döner
export function todEnv(E, kind, mood) {
  const hub = kind === 'hub' || kind === 'town', tk = hub && TOD[mood] ? mood : 'plain', ph = phaseNow(), P = TOD[tk][ph], wx = weatherNow();
  const out = { ...E }, fogD = E.fogD || [16, 60], hemiC = E.hemiC || [0xa9c4ff, 0x2a1d12], rim = E.rim || [0x8fb4ff, 0.8], fogTo = hex(P.sky.at(-2));
  out.sky = mixSky(E.sky, P.sky, P.k);
  out.fog = mix(E.fog, fogTo, P.k * 0.8);
  out.fogD = [fogD[0], fogD[1] * P.far];
  out.sun = mix(E.sun, P.sun, Math.max(P.k, 0.5)); out.sunI = E.sunI * P.sunI;
  out.hemi = E.hemi * P.hemi; out.hemiC = hemiC.map(c => mix(c, P.amb, P.k * 0.6));
  out.rim = [mix(rim[0], P.sun, P.k * 0.5), rim[1] * Math.min(1.2, 0.5 + P.sunI * 0.5)];
  out.mount = mix(shade(E.mount, Math.min(1.3, P.ground + 0.1)), fogTo, P.k * 0.35);
  out.grass = E.grass.map(c => css(shade(c, P.ground))); out.floor = E.floor.map(c => css(shade(c, P.ground)));
  if (E.leaves) out.leaves = E.leaves.map(c => shade(c, P.ground));
  out.torch = lamp(P.torch, E.torch ?? 1); out.win = lamp(P.win, E.win ?? 2.2);
  // Hava: sis yaklaşır ve gök ağarır; yağmurda gök kararır, güneş zayıflar; poyrazda hava açık ve berraktır
  if (wx === 'fog') { const grey = mix(out.fog, FOG_GREY[ph], 0.45); out.fog = grey; out.fogD = [Math.max(6, out.fogD[0] * 0.5), Math.max(hub ? 46 : 34, out.fogD[1] * 0.42)]; out.sky = out.sky.map((s, i, a) => css(mix(s, grey, 0.55 + 0.4 * i / (a.length - 1)))); out.sunI *= 0.75; out.mount = mix(out.mount, grey, 0.5); }
  else if (wx === 'rain') { out.sky = out.sky.map(s => css(mix(shade(s, 0.72), 0x4a5560, 0.3))); out.fog = mix(shade(out.fog, 0.8), 0x4a5560, 0.3); out.fogD = [out.fogD[0], out.fogD[1] * 0.75]; out.sunI *= 0.7; out.hemi *= 0.9; }
  else if (wx === 'wind') out.fogD = [out.fogD[0], out.fogD[1] * 1.15];
  // Ana üste kamera meydandan ~24, arka binalardan ~32 birim uzaktadır: sis meydanı yutmasın, yalnızca arka planı sarsın
  // (sisli havada da kahramanlar okunur kalır). Ufuk rengi sisle aynı tona çekilir.
  if (kind === 'hub') out.fogD = wx === 'fog' ? [Math.max(13, out.fogD[0]), Math.max(46, out.fogD[1])] : [Math.max(17, out.fogD[0]), Math.max(60, out.fogD[1])];
  out.sky = out.sky.map((s, i, a) => (i === a.length - 1 ? css(mix(s, out.fog, 0.7)) : s));
  // Sahneleme (models.js: buildEnv okur): ışığın yönü, pozlama, rüzgârın gücü (sancak, yaprak, çimen), ıslak zemin
  out.sunDir = SUN_DIR[ph];
  out.exposure = (E.exposure ?? 0.95) * EXPO[tk][ph] * (wx === 'fog' ? 0.94 : wx === 'rain' ? 1.15 : 1);
  out.wind = wx === 'wind' ? 2.2 : wx === 'rain' ? 1.4 : 1;
  out.wet = wx === 'rain' ? 1 : 0;
  return out;
}

// ---------- Kurulmuş ortama eklenenler ----------
let stopRain = null;
// Yağmur: kameranın çevresinde düşen ince çizgiler (ortam grubuna bağlıdır; ortam yeniden kurulunca onunla birlikte gider)
function addRain(group) {
  const N = gfx.tier === 'low' || gfx.tier === 'min' ? 220 : gfx.tier === 'mid' ? 380 : 520, pos = new Float32Array(N * 6), seed = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) { seed[i * 3] = (Math.random() - 0.5) * 44; seed[i * 3 + 1] = Math.random() * 16; seed[i * 3 + 2] = (Math.random() - 0.5) * 34 + 2; }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const lines = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0xb8cce0, transparent: true, opacity: 0.42, depthWrite: false }));
  lines.frustumCulled = false; group.add(lines);
  return onUpdate(dt => {
    for (let i = 0; i < N; i++) { // doğrudan diziye yazılır (kare başına bellek ayrılmaz)
      let y = seed[i * 3 + 1] - dt * 17; if (y < 0) y += 16; seed[i * 3 + 1] = y;
      const x = seed[i * 3], z = seed[i * 3 + 2], j = i * 6;
      pos[j] = x; pos[j + 1] = y; pos[j + 2] = z; pos[j + 3] = x - 0.09; pos[j + 4] = y + 0.55; pos[j + 5] = z;
    }
    geo.attributes.position.needsUpdate = true;
  });
}
// world.js ortamı kurduktan sonra çağırır
export function afterEnv(group) {
  stopRain?.(); stopRain = null;
  if (weatherNow() === 'rain') stopRain = addRain(group);
}
// Ana üs binalarının pencereleri ve korları evreye göre parlar ya da söner. town.js ışıyan malzemelerini işaretler:
// userData.night = 'win' (pencere) | 'fire' (ocak koru, mangal: gündüz de yanar, gece güçlenir).
const NIGHT_K = { win: { dawn: 1.2, day: 0.45, dusk: 1.45, night: 1.7 }, fire: { dawn: 1.1, day: 0.8, dusk: 1.25, night: 1.5 } };
export function relightTown() {
  const ph = phaseNow();
  scene.traverse(o => {
    const m = o.material, K = m && NIGHT_K[m.userData?.night];
    if (!K || !m.emissive) return;
    m.userData.baseI ??= m.emissiveIntensity;
    m.emissiveIntensity = m.userData.baseI * K[ph];
  });
}
