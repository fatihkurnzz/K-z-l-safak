// 3B Savaş Faz 1 · RAID tarzı sinematik savaş kamerası (Opus, 27.11)
// savas-kamera.js'in durum makinesine eklenti olarak bağlanır (KAMERA.ek). YALNIZ 3B savaşta (B3D.aktif) devreye girer;
// 2B savaşta ve kapalıyken (localStorage dd_b3dkam = '0', adres ?b3dkam=0) varsayılan kamera aynen çalışır.
// Kamera yalnız sunumdur: tur, sıra, hedef ve hasar değişmez; bütün süreler oyun saatindedir (2x/3x'te kısalır).
//
// Çekimler:
//  - Normal saldırı : vuran + hedef, taban kadrajdan daha yakın, vuranın yanına hafif dönük üç-çeyrek.
//  - Yetenek        : 1) vuranın yakın çekimi (alçak üç-çeyrek, hazırlanış) → 2) vuran + hedefler (darbe).
//  - Usta yetenek   : 1) daha yakın vuran çekimi → 2) vuran + hedefler → 3) hedeflere darbe yakın çekimi.
//  - Boss girişi    : bossa alttan yakın çekim (heybet) → varsayılan geniş kadraj (boss + parti).
// Boyalı arka plan taban kadrajın projektöründen çizildiği için açı farkı sınırlıdır (YAW_MAX): resim bozulmaz.
import { wait } from '../engine3d.js';
import { KAMERA as K, focusBoss as varsayilanBoss } from '../savas-kamera.js';
import { B3D } from './ayar3d.js';

const kapali = (() => { try { const q = new URLSearchParams(location.search).get('b3dkam'); if (q === '0' || q === '1') return q === '0'; return localStorage.getItem('dd_b3dkam') === '0'; } catch { return false; } })();
export const SINEMA = {
  acik: !kapali,
  YAW_MAX: 0.55,                 // taban açıdan en çok sapma (radyan); Faz 1b: gerçek 3B arenada boyalı resim kısıtı yok (0,38→0,55)
  tam: { xl: -0.92, xr: 0.92, yt: 0.78, yb: -0.62, ybR: -0.62 }, // sinematik çekimde arayüz güvenli alanı yerine geniş alan
  dMin: 4.2,                     // en yakın kamera uzaklığı
  sayac: { saldiri: 0, yetenek: 0, usta: 0, boss: 0 },
};
if (typeof window !== 'undefined') window.DD_B3D_KAM = SINEMA;
let seq = 0, bossAtla = false;
const aktif = () => SINEMA.acik && B3D.aktif && K.on && K.api;
const kenar = (x, m) => Math.max(-m, Math.min(m, x));

// Liste kadrajı: verilen birimleri geniş güvenli alana sığdıran kamera; yaw/pitch taban açıya göre farktır.
function cek(list, dyaw, dpitch, dur, durum, dMin = SINEMA.dMin, alan = SINEMA.tam) {
  const A = K.api, P = []; for (const a of list) if (a) A.pts(a, P, false);
  if (!P.length) return false;
  const r = A.fit(P, A.VIEW.yaw + kenar(dyaw, SINEMA.YAW_MAX), A.VIEW.pitch + dpitch, alan, dMin);
  A.go(r.pos, r.look, dur, durum);
  return true;
}
const sonra = (s, my, fn) => wait(s).then(() => { if (my === seq && aktif() && K.state.startsWith('FOCUS')) fn(); });
const yonu = a => (a?.unit?.side === 'A' ? 1 : -1);

K.ek = {
  focusAttack(att, targets) {
    if (!aktif()) return false;
    seq++; SINEMA.sayac.saldiri++;
    return cek([att, ...targets], 0.14 * yonu(att), -0.03, 0.42, 'FOCUS_ATTACK', 5.2);
  },
  focusSkill(att, targets, master) {
    if (!aktif()) return false;
    const my = ++seq, s = yonu(att);
    SINEMA.sayac[master ? 'usta' : 'yetenek']++;
    // 1) vuranın yakın çekimi
    if (!cek([att], (master ? 0.36 : 0.28) * s, -0.06, master ? 0.4 : 0.32, 'FOCUS_SKILL', master ? 3.4 : 3.8)) return false;
    // 2) vuran + hedefler (darbe anı)
    sonra(master ? 0.5 : 0.36, my, () => cek([att, ...targets], 0.16 * s, -0.02, 0.45, 'FOCUS_SKILL', 4.8));
    // 3) usta: hedeflere yakın darbe çekimi
    if (master && targets.length) sonra(1.05, my, () => cek(targets, -0.12 * s, -0.04, 0.4, 'FOCUS_SKILL', 4.0));
    return true;
  },
  focusBoss(boss, party) {
    if (bossAtla || !aktif()) return false;
    const my = ++seq; SINEMA.sayac.boss++;
    if (!cek([boss], -0.3, -0.16, 0.7, 'FOCUS_BOSS', 3.6)) return false;
    sonra(1.0, my, () => { bossAtla = true; try { varsayilanBoss(boss, party); } finally { bossAtla = false; } });
    return true;
  },
};
