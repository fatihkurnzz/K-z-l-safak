// 3B Savaş Faz 1b · sunum kipleri: kamera açısı + savaş dizilimi (Opus, 27.11)
// Kaynak: Gemini "CameraPresets_AllModes_V42" + Opus-01 düzeltilmiş koordinatları. Eklenenler:
//   - Her takım boyu için dizilim (önceden yalnız tam 1v1, 1v3, 4v4, 4+boss; diğerleri eski 2B koordinatlarına düşüyordu).
//   - Boss yanındaki yardımcılar için yan yuvalar; 4'ten kalabalık taraf için arka sıra.
//   - Kip çözümü: 3B savaşta her düzen bir kipe bağlanır (1v1 → 1v1_A, tek kahraman + ≤3 → 1v3, boss → boss, diğer → 4v4).
// Yalnız sunum: savaşın kuralı/sırası/hasarı bu dosyadan etkilenmez.
// Eksenler: +Y yukarı, +Z oyuncu tarafı, +X kamera tarafı. face: birimin bakış açısı (radyan).
const rad = d => d * Math.PI / 180;
const yuva = (x, z, face, scale = 1, ek = {}) => ({ x, z, face, scale, ...ek });
const a = (x, z, s) => yuva(x, z, 2.05, s), b = (x, z, s) => yuva(x, z, 0.84, s);
const TAKIM = [a(1.35, 1.35, 1.0), a(2.65, 3.05, 0.97), a(-1.2, 2.96, 0.98), a(0.02, 4.75, 0.96)];
const RAKIP = [b(-1.25, -1.45, 1.02), b(0.6, -3.22, 0.98), b(-3.25, -3.25, 1.0), b(-1.6, -5.2, 0.98)];

export const KIPLER = {
  '1v1_A': { yawDeg: 8, pitchDeg: 21, vfovDeg: 36, dist: 6.3, party: [a(0.95, 1.95, 1.0)], enemies: [b(-0.95, -1.95, 1.1)] },
  '1v1_B': { yawDeg: 3, pitchDeg: 16, vfovDeg: 37, dist: 6.6, party: [a(1.02, 1.9, 1.0)], enemies: [b(-1.05, -1.95, 1.1)] },
  '1v1_C': { yawDeg: 12, pitchDeg: 27, vfovDeg: 35, dist: 7.0, party: [a(0.95, 1.95, 1.0)], enemies: [b(-1.1, -1.9, 1.1)] },
  '1v3': { yawDeg: 10, pitchDeg: 23, vfovDeg: 37, dist: 7.2, party: [a(1.0, 2.35)], enemies: [b(0.6, -1.3, 1.03), b(-2.35, -3.1, 1.03), b(-0.48, -5.08, 1.03)] },
  '4v4': { yawDeg: 9, pitchDeg: 27, vfovDeg: 39, dist: 8.2, party: TAKIM, enemies: RAKIP },
  boss: { yawDeg: 8, pitchDeg: 24, vfovDeg: 38, dist: 8.1, party: TAKIM, enemies: [yuva(-2.1, -2.76, 0.84, 1.76, { boss: true }), b(0.9, -1.2, 1.0), b(-4.6, -1.7, 1.0), b(0.4, -4.9, 0.98), b(-4.2, -5.0, 0.98)] },
};
// Eski adlar (Opus-01 yaması ve Gemini önizlemesi bunları kullanır)
export const CAMERA_MODES_V42 = KIPLER;

/** Kip seçimi. ayar: window.KORANT_BATTLE_PRESENTATION ('auto' | 'A'|'B'|'C' | kip adı | null = kapalı). */
export function kipSec(ayar, dost, dusman, boss = false) {
  if (ayar === false || ayar === null || ayar === 'legacy') return null;
  if (['A', 'B', 'C'].includes(ayar)) ayar = '1v1_' + ayar;
  if (typeof ayar === 'string' && Object.hasOwn(KIPLER, ayar)) return ayar;
  if (boss) return 'boss';
  if (dost <= 1 && dusman <= 1) return '1v1_A';
  if (dost <= 1 && dusman <= 3) return '1v3';
  return '4v4';
}
export const resolveCameraMode = (v, d, e, b) => kipSec(v === undefined ? 'auto' : v, d, e, b);

/** Birimin yuvası. Kipte yuva yoksa (kalabalık taraf) arka sıraya eklenir. aspect: ekran oranı (dar ekranda derinlik kısalır). */
export function yuvaAl(kip, taraf, sira, aspect = 2.17) {
  const m = KIPLER[kip]; if (!m) return null;
  const L = taraf === 'A' ? m.party : m.enemies;
  let s = L[sira];
  if (!s) { // arka sıra: son yuvanın gerisinde, yana kaydırarak
    const n = sira - L.length, son = L[L.length - 1], A = taraf === 'A';
    s = yuva(son.x + (n % 2 ? 2.2 : -2.2) * Math.ceil((n + 1) / 2), son.z + (A ? 1.7 : -1.7), son.face, 0.95);
  }
  return { ...s, z: s.z * Math.min(1, Math.max(0.54, aspect / 2.17)) };
}
export const layoutSlot = yuvaAl;

/** Güvenli alana bütün sınır noktalarını sığdıran kamera (yön sabit). savas-kamera.js fit() bunu kullanır. */
export function kadrajKur(T, camera, points, m, safe, yaw = rad(m.yawDeg), pitch = rad(m.pitchDeg), min = m.dist) {
  const f = new T.Vector3(-Math.cos(pitch) * Math.cos(yaw), -Math.sin(pitch), -Math.cos(pitch) * Math.sin(yaw));
  const r = new T.Vector3().crossVectors(f, new T.Vector3(0, 1, 0)).normalize();
  const u = new T.Vector3().crossVectors(r, f);
  const v = Math.tan(rad(camera.fov) / 2), h = v * camera.aspect;
  const P = points.map(p => [p.dot(r), p.dot(u), p.dot(f), p.side === 'B' ? safe.ybR ?? safe.yb : safe.yb]);
  const alt = Math.max(min, ...P.map(p => 0.65 - p[2]));
  function aralik(d) {
    let al = -Infinity, ah = Infinity, bl = -Infinity, bh = Infinity;
    for (const [x, y, z, yb] of P) {
      const dz = z + d;
      al = Math.max(al, x - safe.xr * h * dz); ah = Math.min(ah, x - safe.xl * h * dz);
      bl = Math.max(bl, y - safe.yt * v * dz); bh = Math.min(bh, y - yb * v * dz);
    }
    return al <= ah && bl <= bh ? [(al + ah) / 2, (bl + bh) / 2] : null;
  }
  let lo = alt, hi = alt;
  while (!aralik(hi) && hi < 120) hi *= 1.5;
  for (let i = 0; i < 28; i++) { const mid = (lo + hi) / 2; if (aralik(mid)) hi = mid; else lo = mid; }
  const [x, y] = aralik(hi) ?? [0, 0];
  const pos = r.clone().multiplyScalar(x).addScaledVector(u, y).addScaledVector(f, -hi);
  const derin = P.reduce((s, p) => s + p[2], 0) / P.length + hi;
  const look = pos.clone().addScaledVector(f, derin);
  return { pos, look, d: pos.distanceTo(look) };
}
export const fitBattleCamera = kadrajKur;
