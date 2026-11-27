// 3B Savaş Faz 1 · varlık yükleyici (Opus, 27.11)
// models/b3d/models3d.json manifestini okur; modelleri (glTF .json / .glb / .glb.js) ve animasyon kliplerini indirir,
// kemik adlarını ortak iskelete (mixamorig) eşler ve önbellekte tutar. Gövde geometrisi ve dokular kopyalar arasında
// ortaktır; her savaş birimi SkeletonUtils ile kendi iskeletini alır (birim3d.js).
//
// Şema (models3d.json, ayrıntı _tasarim/3d-faz1/STANDART.md):
//   surum, klipler: { ad: dosya }, onYukle: [model],
//   modeller: { ad: { dosya, boy, kemikOnEki?, kemikHaritasi?, malzeme{}, soket{ sag{kemik,konum,donus}, sol{…} }, govdeSilahli?, darbe{klip: oran} } },
//   birimler: { "kahraman:<sınıf>:<halk>" | "kahraman:<sınıf>" | "yaratik:<mob>": { model, sag?, sol?, ton?, olcek?, malzeme? } }
import { THREE } from '../engine3d.js';
import { GLTFLoader } from '../../vendor/three/examples/jsm/loaders/GLTFLoader.js';
import { mergeGeometries } from '../../vendor/three/examples/jsm/utils/BufferGeometryUtils.js';
import { kalcaUyarla, egriHesapla } from './zemin3d.js';

const KOK = new URL('../../models/', import.meta.url).href; // sayfanın yerinden bağımsız (oyun ve vitrin aynı modülü kullanır)
const gltf = new GLTFLoader();
let M = null, mP = null;
const dosyalar = new Map(); // tam adres → Promise<{scene, clips}|null>
const hazir = new Map();    // tam adres → {scene, clips} | null (inmiş)
const modelP = new Map();   // model adı → Promise<bool>
export const istatistik = { indirilen: 0, hata: [] };

export const manifest = () => M;
export const adres = f => /^(https?:|blob:|data:)/.test(f) ? f : KOK + f.replace(/^models\//, '');

export function manifestYukle() {
  return mP ||= fetch(KOK + 'b3d/models3d.json', { cache: 'no-cache' }).then(r => r.ok ? r.json() : null).then(m => (M = m)).catch(() => null);
}

function b64Tampon(s) { const t = atob(s), b = new Uint8Array(t.length); for (let i = 0; i < t.length; i++) b[i] = t.charCodeAt(i); return b.buffer; }
/** Tek dosya indir (önbellekli). .glb.js = base64 gömülü glb modülü (yayın dosya sınırı için). */
export function dosyaYukle(f) {
  const u = adres(f);
  if (dosyalar.has(u)) return dosyalar.get(u);
  const yol = u.slice(0, u.lastIndexOf('/') + 1);
  const p = (/\.glb\.js$/i.test(u) ? import(u).then(m => gltf.parseAsync(b64Tampon(m.default), yol)) : gltf.loadAsync(u))
    .then(g => { const v = { scene: g.scene, clips: g.animations || [], birlesen: agBirlestir(g.scene) }; hazir.set(u, v); istatistik.indirilen++; return v; })
    .catch(e => { console.warn('[b3d] yüklenemedi:', u, e?.message || e); istatistik.hata.push(u); hazir.set(u, null); return null; });
  dosyalar.set(u, p);
  return p;
}
export const dosyaHazir = f => hazir.get(adres(f)) || null;

// Çizim çağrısı optimizasyonu: aynı iskelete ve aynı malzemeye bağlı, aynı uzaydaki deri ağlarını tek SkinnedMesh'e
// birleştirir (ör. dark_knight 24 ağ → 1). Görüntü aynıdır; yalnız ağ sayısı düşer. Döner: { once, sonra }.
function agBirlestir(kok) {
  // Bağlı (attached) deri ağında son konum = Σ wᵢ·kemikᵢ·bindMatrix·p; ağın kendi dönüşümü sonucu etkilemez.
  // Her parçanın geometrisi kendi bindMatrix'iyle "bağlama dünyasına" taşınır, kemik indeksleri ortak kemik listesine
  // eşlenir (her parçanın ayrı skin kaydı olabilir: dark_knight 24 skin), birleşik ağ birim bindMatrix ile bağlanır.
  // Aynı kemiğin bağlama tersi parçalar arasında farklıysa (farklı bağlama pozu) o parça birleştirilmez.
  const gruplar = new Map(); let once = 0;
  kok.updateMatrixWorld(true);
  kok.traverse(o => {
    if (!o.isMesh) return; once++;
    if (!o.isSkinnedMesh || Array.isArray(o.material) || o.morphTargetInfluences || o.bindMode !== 'attached') return;
    const k = o.material.uuid + '|' + Object.keys(o.geometry.attributes).sort().join(',') + '|' + !!o.geometry.index;
    (gruplar.get(k) || gruplar.set(k, []).get(k)).push(o);
  });
  const BIL = ['getX', 'getY', 'getZ', 'getW'];
  let sonra = once;
  for (const L0 of gruplar.values()) {
    if (L0.length < 2) continue;
    // Parçaların bağlama tersleri (IBM) ortak bir katı dönüşümle farklı olabilir: X = IBM_ortak⁻¹ · IBM_parça. X bütün ortak
    // kemiklerde aynıysa parça p' = X · bindMatrix · p ile ortak uzaya taşınır; değilse parça ayrı kalır.
    const kemikler = [], tersler = [], yer = new Map(), L = [], Xs = new Map();
    const yakin = (A, B) => A.elements.every((x, n) => Math.abs(x - B.elements[n]) < 1e-3 * Math.max(1, Math.abs(x)));
    for (const o of L0) {
      const sk = o.skeleton; let X = null, uyar = true;
      sk.bones.forEach((b, i) => { const j = yer.get(b); if (j === undefined || !uyar) return; const x = tersler[j].clone().invert().multiply(sk.boneInverses[i]); if (!X) X = x; else if (!yakin(X, x)) uyar = false; });
      if (!uyar) continue;
      X ||= new THREE.Matrix4(); const Xi = X.clone().invert();
      sk.bones.forEach((b, i) => { if (!yer.has(b)) { yer.set(b, kemikler.length); kemikler.push(b); tersler.push(sk.boneInverses[i].clone().multiply(Xi)); } });
      Xs.set(o, X); L.push(o);
    }
    if (L.length < 2) continue;
    const parca = L.map(x => {
      const g = x.geometry.clone(), si = g.attributes.skinIndex, n = si.count, yeni = new Uint16Array(n * 4);
      const es = x.skeleton.bones.map(b => yer.get(b));
      for (let i = 0; i < n; i++) for (let j = 0; j < 4; j++) yeni[i * 4 + j] = es[si[BIL[j]](i)] ?? 0;
      g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(yeni, 4));
      const sw = g.attributes.skinWeight; if (sw.normalized || !(sw.array instanceof Float32Array)) { const f = new Float32Array(n * 4); for (let i = 0; i < n; i++) for (let j = 0; j < 4; j++) f[i * 4 + j] = sw[BIL[j]](i); g.setAttribute('skinWeight', new THREE.BufferAttribute(f, 4)); }
      for (const ad of ['position', 'normal', 'uv']) { const at = g.attributes[ad]; if (at && (at.normalized || !(at.array instanceof Float32Array))) { const f = new Float32Array(at.count * at.itemSize); for (let i = 0; i < at.count; i++) for (let j = 0; j < at.itemSize; j++) f[i * at.itemSize + j] = at[BIL[j]](i); g.setAttribute(ad, new THREE.BufferAttribute(f, at.itemSize)); } }
      return g.applyMatrix4(Xs.get(x).clone().multiply(x.bindMatrix)); // nicemli köşeler önce float'a çevrildi
    });
    const g = mergeGeometries(parca, false); parca.forEach(x => x.dispose()); if (!g) continue;
    const a = L[0], y = new THREE.SkinnedMesh(g, a.material);
    y.name = a.name + '+' + (L.length - 1);
    kok.add(y); y.updateMatrixWorld(true);
    y.bind(new THREE.Skeleton(kemikler, tersler), new THREE.Matrix4());
    L.forEach(x => { x.parent.remove(x); x.geometry.dispose(); });
    sonra -= L.length - 1;
  }
  return { once, sonra };
}

/** Modeli ve bütün kliplerini indir. Döner: Promise<bool> (hepsi indi mi). */
export function modelHazirla(ad) {
  if (modelP.has(ad)) return modelP.get(ad);
  const p = manifestYukle().then(m => {
    const k = m?.modeller?.[ad]; if (!k) return false;
    const klip = { ...(m.klipler || {}), ...(k.klipler || {}) };
    return Promise.all([dosyaYukle(k.dosya), ...Object.values(klip).filter(s => !s.startsWith('clip:')).map(dosyaYukle)]).then(r => !!r[0]);
  });
  modelP.set(ad, p);
  return p;
}
/** Model ve klipleri inmiş mi (eşzamanlı; savaş kararı bunu sorar). */
export function modelHazirMi(ad) {
  const k = M?.modeller?.[ad]; if (!k || !dosyaHazir(k.dosya)) return false;
  const klip = { ...(M.klipler || {}), ...(k.klipler || {}) };
  return Object.values(klip).every(s => s.startsWith('clip:') || hazir.has(adres(s)));
}

/** Birimin manifest kaydı: { anahtar, model, kayit } ya da null. Kahramanda önce halka özel kayıt, sonra sınıfın ortak kaydı. */
export function kayitAnahtari(u) {
  const B = M?.birimler; if (!B || !u) return null;
  const adaylar = u.cls ? [`kahraman:${u.cls}:${u.faction || u.model?.faction || ''}`, `kahraman:${u.cls}`] : u.mob ? [`yaratik:${u.mob}`] : [];
  for (const a of adaylar) { const r = B[a]; if (r && M.modeller?.[r.model]) return { anahtar: a, model: r.model, kayit: r }; }
  return null;
}

// ---- Klipler ----
// Mixamo kliplerinde kalça ileri kayar: yerinde tut (x/z sabit, y serbest). Kopya üzerinde çalışır, kaynağa dokunmaz.
function yerinde(clip) {
  for (const tr of clip.tracks) if (/Hips\.position$/.test(tr.name)) {
    const v = tr.values, x0 = v[0], z0 = v[2];
    for (let i = 0; i < v.length; i += 3) { v[i] = x0; v[i + 2] = z0; }
  }
  return clip;
}
// Kemik adı eşlemesi: klip izleri ortak iskelette (mixamorigHips…) yazılıdır; model başka adlar kullanıyorsa
// (Meshy: "Hips", "Spine01"…) manifestteki kemikHaritasi { ortak: modelin } ile çevrilir.
function esle(clip, harita, onEk) {
  if (!harita && !onEk) return clip;
  for (const tr of clip.tracks) {
    const i = tr.name.lastIndexOf('.'), kemik = tr.name.slice(0, i), ozellik = tr.name.slice(i);
    const yalin = kemik.replace(/^mixamorig:?/, '');
    const yeni = harita?.[kemik] || harita?.[yalin] || (onEk != null ? onEk + yalin : kemik);
    tr.name = yeni + ozellik;
  }
  return clip;
}
const klipOnbellek = new Map(); // model adı → { klipAdı: AnimationClip }
/** Modelin kullanacağı 11 klip (eşlenmiş, yerinde). Model kopyaları arasında ortaktır. */
export function klipler(ad) {
  if (klipOnbellek.has(ad)) return klipOnbellek.get(ad);
  const k = M.modeller[ad], kaynak = dosyaHazir(k.dosya), o = {};
  for (const [isim, spec] of Object.entries({ ...(M.klipler || {}), ...(k.klipler || {}) })) {
    let c = null;
    let kk = kaynak?.scene;
    if (spec.startsWith('clip:')) { const n = spec.slice(5).toLowerCase(); c = kaynak?.clips.find(x => x.name.toLowerCase() === n) || null; }
    else { const d = dosyaHazir(spec); c = d?.clips?.[0] || null; kk = d?.scene; }
    if (!c) continue;
    // R3: kalça yüksekliği modele uyarlanır (x,z dinlenmede sabit = yerinde); k.kalca === false ise yalnız yerinde
    c = esle(k.kalca === false ? yerinde(c.clone()) : kalcaUyarla(c.clone(), kk, kaynak?.scene), k.kemikHaritasi, k.kemikOnEki);
    c.name = isim;
    o[isim] = c;
  }
  klipOnbellek.set(ad, o);
  return o;
}
const egriOnbellek = new Map();
/** Modelin zemin kaldırma eğrileri (zemin3d.js; ilk çağrıda ölçülür, sonra önbellekte). k.zemin === false ise boş. */
export function zeminEgrileri(ad) {
  if (egriOnbellek.has(ad)) return egriOnbellek.get(ad);
  const k = M.modeller[ad]; let e = {};
  if (k.zemin !== false) try { e = egriHesapla(ad, dosyaHazir(k.dosya).scene, klipler(ad)); } catch (x) { console.warn('[b3d] zemin ölçümü yapılamadı', ad, x?.message || x); }
  egriOnbellek.set(ad, e);
  return e;
}
/** Bellek denetimi için: yüklenen dosya sayısı ve adları. */
export const yuklenenler = () => [...hazir.entries()].map(([u, v]) => ({ dosya: u.replace(KOK, 'models/'), tamam: !!v }));
