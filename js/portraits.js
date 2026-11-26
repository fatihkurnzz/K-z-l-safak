// 2B portreler. Her yaratık ve kahraman için görsel, oyunun kendi 3B modelinden üretilir: model ayrı bir
// sahnede çizilir, kare bir resme kopyalanır ve önbelleğe alınır. Böylece portre ile savaştaki model hep aynıdır,
// dışarıdan görsel dosyası ve lisans gerekmez.
// Elle çizilmiş görsel eklemek için: dosyayı public/img/ altına koy ve img/portraits.json'a yaz
//   { "yagmaci": "img/yagmaci.webp", "warrior.ocak": "img/savasci-ocak.webp" }  → o birim için çizim yerine dosya kullanılır.
import { THREE, renderer, onUpdate, studioEnv, withStudioExposure, fpsCap } from './engine3d.js';
import { Character, WormCharacter } from './models.js';
import { BeastCharacter, decorateMob } from './beasts.js';
import { BEAST_KINDS } from '../shared/bestiary.js';
import { createSkinned } from './skinned.js';

const BLANK = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
const cache = new Map();   // anahtar → resim adresi
const queue = new Map();   // anahtar → çizim tarifi
let overrides = {};

// Elle eklenmiş görseller (isteğe bağlı)
export async function loadPortraitOverrides() {
  try { const r = await fetch('img/portraits.json', { cache: 'no-cache' }); if (r.ok) overrides = await r.json(); } catch { }
  // GPT Paket 3 (21 Kas): sınıf × halk çizimleri — "sınıf.halk" büst, "sınıf.halk:f" tam boy, "art.sınıf.halk" kadro
  try { const P = await import('./portre-png.js'); for (const k of P.KEYS) if (!overrides[k]) overrides[k] = P.url(k); } catch (e) { console.warn('[portre] çizimler yüklenemedi', e); }
}

// ---- Portre sahnesi ----
const pScene = new THREE.Scene();
const cam = new THREE.PerspectiveCamera(26, 1, 0.1, 60);
pScene.add(new THREE.HemisphereLight(0xdfe8ff, 0x3a2a1a, 1.0));
// Model hafifçe sola döner; ana ışık yüzün baktığı taraftan, dolgu ışığı karşıdan, kontur ışığı arkadan gelir
const key = new THREE.DirectionalLight(0xfff0d8, 2.8); key.position.set(-3.5, 4.5, 6); pScene.add(key);
const fill = new THREE.DirectionalLight(0xffe2c0, 0.9); fill.position.set(4, 1.5, 5); pScene.add(fill);
const rim = new THREE.DirectionalLight(0x8fb4ff, 1.8); rim.position.set(5, 4, -6); pScene.add(rim);
const out = document.createElement('canvas'), ctx = out.getContext('2d');

// Arka plan: türe göre renkli, ortadan aydınlanan zemin
const BG = {
  mob: ['#5d6b46', '#1b2115'], captain: ['#6a4f86', '#1c1326'], boss: ['#a5482c', '#2a0f0a'],
  ocak: ['#9a4a38', '#2a1210'], sancak: ['#46699c', '#101a2c'],
};
const bgCache = {};
function bgTex(kind) {
  if (bgCache[kind]) return bgCache[kind];
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'), [a, b] = BG[kind] || BG.mob;
  const grad = g.createRadialGradient(64, 50, 6, 64, 64, 96);
  grad.addColorStop(0, a); grad.addColorStop(1, b);
  g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return (bgCache[kind] = t);
}

// spec: { look, model, bg, full } — full: boydan (3:4), değilse büst (kare)
function draw(spec) {
  const art = !!spec.art, big = !!spec.big, full = !!spec.full || art || big; // big: karakter ekranının döndürülebilir 3B görünümü (boyasız, büyük)
  let w = art || big ? 360 : full ? 300 : 192, h = art || big ? 480 : full ? 400 : 192;
  { const dm = renderer.domElement, k = Math.min(1, dm.width / w, dm.height / h); if (k < 1) { w = Math.floor(w * k); h = Math.floor(h * k); } } // küçük ekranda tuvalden büyük çizilemez
  // İskeletli modeli olan birimin portresi de o modelden çizilir (3B görünümle aynı olsun)
  const sk = createSkinned({ tid: spec.tid, mid: spec.mid, look: spec.look, model: spec.model || {} });
  const K = spec.look?.kind, c = sk || (K === 'worm' ? new WormCharacter(spec.look) : BEAST_KINDS.includes(K) ? new BeastCharacter(spec.look) : decorateMob(new Character(spec.look, spec.model || {}), spec.look)); // Dev Solucan insansı değildir (world.js ile aynı seçim)
  if (sk) { sk.update(0.5, 0.5); sk.bodyU.glow.value = 1; } else { c.phase = 1.2; c.combat = full ? 0.7 : 0; c.update(0, 0); } // portre sabit pozlamayla çizilir: kendinden aydınlık pay kısılmaz
  c.root.rotation.y = spec.rot ?? (full ? -0.38 : -0.3);
  pScene.add(c.root);
  const s = c.scale, beast = c instanceof BeastCharacter; let hv = null, ty = big ? 1.25 * s : art ? 1.42 * s : full ? 1.3 * s : 1.95 * s, dist = big ? 6.6 * s : art ? 4.7 * s : full ? 6.0 * s : 3.2 * s; // illüstrasyon: kahraman kareyi daha çok doldurur
  if (beast) { c.root.updateMatrixWorld(true); hv = c.headTo(new THREE.Vector3()); const hy = hv.y - 0.35 * s; ty = full ? hy * 0.7 : hy; dist = (full ? 4.2 : 2.9) * s * (c.look.kind === 'dragon' ? 1.6 : 1); } // hayvan gövdesi alçak: kamera başa bakar
  cam.aspect = w / h;
  const fx = hv ? hv.x * 0.6 : 0, fz = hv ? hv.z * 0.6 : 0;
  cam.position.set(fx, ty + (big ? 0.35 * s : full ? 0.5 * s : 0.12 * s), fz + dist);
  cam.lookAt(fx, ty, fz);
  cam.updateProjectionMatrix();
  pScene.background = bgTex(spec.bg);
  pScene.environment = studioEnv(); // sahnenin evresinden bağımsız, yansız ortam (portre her yerde aynı görünür)
  // Ekran tuvalinin köşesine çizip kopyala: oyunla aynı ton eşleme ve renk uzayı. Aynı karede ana sahne
  // bütün tuvali yeniden çizdiği için bu köşe ekranda hiç görünmez.
  const pr = renderer.getPixelRatio(), vp = renderer.getViewport(new THREE.Vector4());
  renderer.setRenderTarget(null);
  renderer.setViewport(0, 0, w / pr, h / pr);
  renderer.setScissor(0, 0, w / pr, h / pr);
  renderer.setScissorTest(true);
  withStudioExposure(() => renderer.render(pScene, cam));
  renderer.setScissorTest(false);
  renderer.setViewport(vp);
  const dom = renderer.domElement;
  out.width = w; out.height = h;
  ctx.drawImage(dom, 0, dom.height - h, w, h, 0, 0, w, h);
  pScene.remove(c.root);
  if (sk) sk.dispose(); // geometri kopyalar arasında ortaktır, yalnızca malzemeler bırakılır
  else { c.root.traverse(o => o.geometry?.dispose()); c.M.list.forEach(m => m.dispose()); }
  if (art) paintArt(ctx, w, h, spec.bg);
  return out.toDataURL('image/jpeg', art ? 0.88 : 0.9);
}

// ---- İllüstrasyon görünümü (Kadro ve kahraman ekranındaki büyük portreler) ----
// 3B çizim 2B resme çevrilir: renkler kademelenir (cel boyama), kenarlar mürekkep çizgisiyle koyulaşır, kâğıt dokusu,
// ırk renginde ışık huzmeleri ve kenar kararması eklenir. Elle çizilmiş görsel varsa portraits.json'daki "art.sınıf.taraf"
// anahtarı bu çizimin yerine geçer.
const ART_TINT = { ocak: [255, 120, 60], sancak: [110, 170, 255] };
function paintArt(c, w, h, bg) {
  const im = c.getImageData(0, 0, w, h), d = im.data, n = w * h, L = new Float32Array(n);
  for (let i = 0; i < n; i++) L[i] = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2];
  const lv = 7, q = v => Math.round(v / 255 * (lv - 1)) * 255 / (lv - 1), seed = x => { const t = Math.sin(x * 12.9898) * 43758.5453; return t - Math.floor(t); };
  const tint = ART_TINT[bg] || [230, 200, 140];
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = y * w + x, o = i * 4;
    const gx = L[i - w + 1] + 2 * L[i + 1] + L[i + w + 1] - L[i - w - 1] - 2 * L[i - 1] - L[i + w - 1];
    const gy = L[i + w - 1] + 2 * L[i + w] + L[i + w + 1] - L[i - w - 1] - 2 * L[i - w] - L[i - w + 1];
    const e = Math.min(1, Math.hypot(gx, gy) / 220), ink = e > 0.35 ? 1 - (e - 0.35) * 1.1 : 1;
    const dx = (x / w - 0.5), dy = (y / h - 0.42), vig = Math.max(0.35, 1 - (dx * dx * 1.6 + dy * dy * 1.2));
    const grain = 0.93 + seed(i) * 0.1, ray = Math.max(0, Math.cos(Math.atan2(dy, dx) * 9) * (1 - Math.min(1, Math.hypot(dx, dy) * 1.6))) * 0.14;
    for (let k = 0; k < 3; k++) {
      let v = q(d[o + k] * 0.85 + d[o + k] * 0.15 * (k === 0 ? 1.05 : 1)) * ink * vig * grain;
      v = v * (1 - ray) + tint[k] * ray;
      d[o + k] = Math.max(0, Math.min(255, v * 0.94 + [242, 226, 196][k] * 0.06)); // hafif kâğıt rengi
    }
  }
  c.putImageData(im, 0, 0);
  const g = c.createLinearGradient(0, h * 0.72, 0, h); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.55)');
  c.fillStyle = g; c.fillRect(0, 0, w, h);
}

// Kare başına en çok 3 portre ve ~8 ms çizilir (ana döngüyü tıkamasın); çizilenler sayfadaki <img data-pt> öğelerine yazılır
onUpdate(() => {
  let n = 0; const t0 = performance.now();
  for (const [k, spec] of queue) {
    queue.delete(k);
    let url = BLANK;
    try { url = draw(spec); } catch (e) { console.warn('[portre] çizilemedi', k, e); }
    cache.set(k, url);
    document.querySelectorAll('img[data-pt]').forEach(img => { if (img.dataset.pt === k) img.src = url; });
    if (++n >= Math.max(3, Math.round(45 / fpsCap())) || performance.now() - t0 > (fpsCap() <= 5 ? 40 : 8)) break; // 20 Kas: kare sınırı düşükken (tam ekran pencere 5 kare/sn) kare başına daha çok portre: saniyedeki çizim aynı kalır // telefonda bir portre (3B çizim + JPEG) tek başına bir kareyi doldurabilir; hızlı cihazda (ve kare sınırı düşükken) birkaç tane
  }
});

// <img> için öznitelikler: önbellekte varsa hemen, yoksa çizilince dolar
export function portraitAttrs(key, id, spec) {
  if (overrides[id]) return `src="${overrides[id]}"`;
  if (!cache.has(key) && !queue.has(key)) queue.set(key, spec);
  return `data-pt="${key}" src="${cache.get(key) || BLANK}"`;
}
