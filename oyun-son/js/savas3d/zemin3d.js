// 3B Savaş Faz 1b · deformasyon ve zemin teması (Opus, 27.11)
// R3 deformasyon QA paketindeki ölçüm yöntemi (ground_test.py) çalışma anına taşındı:
//  1) KALÇA YENİDEN HEDEFLEME (modele özel kalça yüksekliği): ortak klipler kaynak iskeletin kalça yüksekliğiyle yazılmıştır.
//     Hips.position izi  y' = hedefY + (y - kaynakY) · (hedefY / kaynakY),  x,z = hedefin dinlenme değeri (yerinde).
//     kaynakY: klip dosyasındaki Hips düğümünün dinlenme konumu; hedefY: modelin Hips dinlenme konumu.
//  2) TABAN KÖŞELERİ: ayak/parmak kemiklerinden toplam > 0,5 ağırlık alan ve dinlenmede ağın alt %5'inde kalan köşeler.
//  3) ZEMİN KALDIRMA EĞRİSİ: her klip 12 Hz örneklenir (CPU skinning, yalnız taban köşeleri), tabanın zemine nüfuzu kadar
//     YALNIZ YUKARI kaldırma, boyun %5'i ile sınırlı, 1 örnek Gauss yumuşatma. Ölüm klibi hariç. Çalışırken etkin
//     eylemlerin ağırlığıyla karıştırılır (geçişlerde sıçrama yok). Bu IK değildir; yatay ayak kaymasını çözmez.
// Ölçüm her model için bir kez (ilk 3B birim kurulurken) yapılır ve sonuçlar window.DD_B3D_ZEMIN içinde okunur.
import { THREE } from '../engine3d.js';
import * as SkeletonUtils from '../../vendor/three/examples/jsm/utils/SkeletonUtils.js';

export const ZEMIN = { hz: 12, tavan: 0.05, taban: 0.05, olcum: {} };
if (typeof window !== 'undefined') window.DD_B3D_ZEMIN = ZEMIN;

const kalcaBul = kok => { let b = null; kok?.traverse(o => { if (!b && (o.isBone || o.type === 'Bone' || o.isObject3D) && /Hips$/i.test(o.name)) b = o; }); return b; };

/** Kalça izini modele uyarla (R3 retarget). clip kopyası üzerinde çalışır. kaynakKok: klibin geldiği sahne; hedefKok: modelin sahnesi. */
export function kalcaUyarla(clip, kaynakKok, hedefKok) {
  const ks = kalcaBul(kaynakKok), hs = kalcaBul(hedefKok);
  const src = ks?.position, dst = hs?.position;
  for (const tr of clip.tracks) if (/Hips\.position$/.test(tr.name)) {
    const v = tr.values;
    if (!src || !dst || Math.abs(src.y) < 1e-6) { const x0 = v[0], z0 = v[2]; for (let i = 0; i < v.length; i += 3) { v[i] = x0; v[i + 2] = z0; } continue; }
    const k = dst.y / src.y;
    for (let i = 0; i < v.length; i += 3) { v[i] = dst.x; v[i + 1] = dst.y + (v[i + 1] - src.y) * k; v[i + 2] = dst.z; }
  }
  return clip;
}

const AYAK = /(Left|Right)(Foot|Toe)/;
const BIL = ['getX', 'getY', 'getZ', 'getW'], bil = (a, i, j) => a[BIL[j]](i); // r160: getComponent yok
function gauss1(a) { // sigma = 1 örnek, kenarlar en yakın değer
  const w = [0.054, 0.242, 0.399, 0.242, 0.054], o = new Float32Array(a.length);
  for (let i = 0; i < a.length; i++) { let s = 0; for (let j = -2; j <= 2; j++) s += w[j + 2] * a[Math.min(a.length - 1, Math.max(0, i + j))]; o[i] = s; }
  return o;
}

/** Modelin her klibi için kaldırma eğrisi (boy oranı). kaynak: inmiş model sahnesi (dokunulmaz), klipler: { ad: AnimationClip } */
export function egriHesapla(ad, kaynak, klipler) {
  const t0 = performance.now();
  const m = SkeletonUtils.clone(kaynak); m.updateMatrixWorld(true);
  const meshler = []; m.traverse(o => { if (o.isSkinnedMesh) meshler.push(o); });
  const v = new THREE.Vector3();
  // dinlenme pozunda bütün köşeler: boy ve alt sınır
  // yüklenen sahne dinlenme (bağlama) pozundadır; skeleton.pose() bu Mixamo dosyalarında kök dönüşümü nedeniyle pozu bozar → kullanılmaz
  let yMin = Infinity, yMax = -Infinity;
  const tum = [];
  for (const s of meshler) {
    const p = s.geometry.attributes.position, si = s.geometry.attributes.skinIndex, sw = s.geometry.attributes.skinWeight;
    const ayakK = s.skeleton.bones.map(b => AYAK.test(b.name));
    for (let i = 0; i < p.count; i++) {
      s.getVertexPosition(i, v).applyMatrix4(s.matrixWorld);
      yMin = Math.min(yMin, v.y); yMax = Math.max(yMax, v.y);
      let w = 0; for (let j = 0; j < 4; j++) if (ayakK[bil(si, i, j)]) w += bil(sw, i, j);
      if (w > 0.5) tum.push([s, i, v.y]);
    }
  }
  const H = yMax - yMin, taban = tum.filter(x => x[2] <= yMin + H * ZEMIN.taban);
  const sonuc = { ad, boy: H, tabanKose: taban.length, klip: {}, ms: 0 };
  const egriler = {};
  if (!taban.length || !(H > 0)) { ZEMIN.olcum[ad] = { ...sonuc, hata: 'taban köşesi yok' }; return egriler; }
  const mixer = new THREE.AnimationMixer(m);
  for (const [isim, clip] of Object.entries(klipler)) {
    if (isim === 'death') continue;
    const a = mixer.clipAction(clip); a.play();
    const n = Math.max(2, Math.ceil(clip.duration * ZEMIN.hz) + 1), ham = new Float32Array(n), oranlar = new Float32Array(n);
    let enAz = Infinity;
    for (let f = 0; f < n; f++) {
      a.time = clip.duration * f / (n - 1); mixer.update(0); m.updateMatrixWorld(true);
      let y = Infinity; for (const [s, i] of taban) { s.getVertexPosition(i, v).applyMatrix4(s.matrixWorld); if (v.y < y) y = v.y; }
      const oran = oranlar[f] = (y - yMin) / H; enAz = Math.min(enAz, oran);
      ham[f] = Math.min(ZEMIN.tavan, Math.max(0, -oran));
    }
    a.stop(); mixer.uncacheAction(clip);
    const egri = gauss1(ham);
    egriler[isim] = { n, sure: clip.duration, d: egri };
    let kalan = Infinity, havada = 0; for (let f = 0; f < n; f++) { const s2 = oranlar[f] + egri[f]; kalan = Math.min(kalan, s2); if (Math.abs(oranlar[f]) < 0.015 && Math.abs(s2) >= 0.015) havada++; }
    sonuc.klip[isim] = { kare: n, tabanMinYuzde: +(enAz * 100).toFixed(3), sonraMinYuzde: +(kalan * 100).toFixed(3), enCokKaldirmaYuzde: +(Math.max(...egri) * 100).toFixed(3), yeniHavadaKare: havada };
  }
  mixer.uncacheRoot(m);
  m.traverse(o => { if (o.isSkinnedMesh) o.skeleton.dispose(); });
  sonuc.ms = Math.round(performance.now() - t0);
  ZEMIN.olcum[ad] = sonuc;
  return egriler;
}

/** Eğriden t anındaki kaldırma (boy oranı), doğrusal ara değer. */
export function egriOku(e, t) {
  if (!e) return 0;
  const x = Math.min(1, Math.max(0, t / e.sure)) * (e.n - 1), i = Math.floor(x), f = x - i;
  return i >= e.n - 1 ? e.d[e.n - 1] : e.d[i] * (1 - f) + e.d[i + 1] * f;
}
