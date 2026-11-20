// Boyalı ana merkez (20 Kas, A–Z yeniden tasarım pilotu): başkentte 3B kasaba yerine 2340×1080 izometrik şehir resmi.
// Resimler img/merkez/{ocak,sancak}.webp (_tasarim/gelen 4.1 ve 4.2). Binalar resim koordinatlarıyla tanımlıdır:
//   [etiketX, etiketY, kutuSol, kutuÜst, kutuSağ, kutuAlt]: etiket noktası binanın üstündedir (etiket bu noktanın üstüne çizilir).
// Ekrana "cover" ile oturur; taşan yatay kısım parmakla kaydırılır (tablet). Kapatmak için adrese ?merkez=3d.
import { view } from './orient.js';

const IW = 2340, IH = 1080;
export const SPOTS = {
  ocak: { wheel: [400, 150, 210, 90, 620, 380], anvil: [850, 150, 660, 110, 1040, 440], clanhq: [1290, 250, 1040, 0, 1540, 340], monument: [1270, 420, 1040, 380, 1520, 800],
    carsi: [600, 470, 290, 410, 940, 720], mine: [290, 720, 0, 600, 540, 940], iksir: [1830, 230, 1660, 100, 2020, 380], karaborsa: [2060, 340, 1800, 260, 2240, 560],
    gate: [1900, 680, 1640, 580, 2020, 900], king: [1290, 330] },
  sancak: { wheel: [430, 150, 300, 10, 560, 280], anvil: [860, 200, 680, 120, 1040, 430], clanhq: [1300, 235, 1060, 0, 1700, 340], monument: [1250, 430, 1080, 380, 1440, 800],
    carsi: [560, 450, 220, 380, 920, 700], mine: [240, 740, 0, 660, 400, 940], iksir: [1820, 180, 1720, 120, 1920, 390], karaborsa: [2010, 430, 1840, 380, 2180, 600],
    gate: [1950, 720, 1680, 620, 2020, 940], king: [1300, 330] },
};
// Işık ve kor noktaları (resim koordinatı, yarıçap): ocak, çark, dikilitaş, maden… kıvılcımlar buralardan yükselir
const GLOW = {
  ocak: [[420, 230, 150], [880, 300, 120], [1270, 640, 170], [200, 820, 130], [1900, 790, 90]],
  sancak: [[430, 150, 140], [860, 330, 110], [1260, 600, 170], [180, 820, 120], [1820, 260, 110]],
};
const OFF = new URLSearchParams(location.search).get('merkez') === '3d';
export const merkezOn = f => !OFF && !!SPOTS[f];

const M = { el: null, inner: null, f: null, s: 1, w: 0, h: 0, pan: 0, py: 0, oy: 0, max: 0, maxY: 0, tap: null, ids: [] };
// Telefonda (kısa ekran) arayüz ekranın büyük kısmını kaplar: resim biraz büyütülür ve iki yönde kaydırılabilir,
// böylece profil kartının ya da sohbetin altında kalan bina parmakla ortaya çekilebilir
const ZOOM = () => (view.h <= 480 ? 1.18 : 1);
const lay = () => {
  if (!M.el) return;
  M.s = Math.max(view.w / IW, view.h / IH) * ZOOM(); M.w = IW * M.s; M.h = IH * M.s;
  M.max = Math.max(0, M.w - view.w); M.maxY = Math.max(0, M.h - view.h);
  M.pan = Math.max(0, Math.min(M.max, M.pan)); M.py = Math.max(0, Math.min(M.maxY, M.py)); M.oy = -M.py;
  M.inner.style.cssText = `width:${M.w}px;height:${M.h}px;transform:translate(${-M.pan}px,${M.oy}px)`;
};
// resim noktası → ekran (mantıksal) noktası; ui-hub.js etiketleri buna göre yerleştirir
export const toScreen = p => ({ x: p[0] * M.s - M.pan, y: p[1] * M.s + M.oy, behind: false });
const toImg = (x, y) => [(x + M.pan) / M.s, (y - M.oy) / M.s];
// İstemci koordinatından mantıksal koordinata (dik telefonda gövde 90° döner: ui-hub planNudges ile aynı dönüşüm)
const logical = e => document.documentElement.classList.contains('rot') ? [e.clientY, innerWidth - e.clientX] : [e.clientX, e.clientY];

function hitTest(x, y) {
  const [ix, iy] = toImg(x, y), S = SPOTS[M.f]; let best = null, bd = 1e9;
  for (const id of M.ids) {
    const b = S[id]; if (!b || b.length < 6) continue;
    if (ix < b[2] || ix > b[4] || iy < b[3] || iy > b[5]) continue;
    const d = Math.hypot(ix - (b[2] + b[4]) / 2, iy - (b[3] + b[5]) / 2);
    if (d < bd) { bd = d; best = id; }
  }
  return best;
}
function flash(id) {
  const b = SPOTS[M.f][id]; if (!b || !M.inner) return;
  const el = document.createElement('i'); el.className = 'm2-hit';
  const cx = (b[2] + b[4]) / 2, cy = (b[3] + b[5]) / 2, r = Math.max(b[4] - b[2], b[5] - b[3]) / 2;
  el.style.cssText = `left:${(cx / IW) * 100}%;top:${(cy / IH) * 100}%;width:${(2 * r / IW) * 100}%;height:${(2 * r / IW) * 100 * IW / IH}%`;
  M.inner.appendChild(el); setTimeout(() => el.remove(), 650);
}

let drag = null;
function down(e) { if (e.button > 0) return; const [x, y] = logical(e); drag = { x, y, pan: M.pan, py: M.py, moved: false, id: e.pointerId }; }
function move(e) {
  if (!drag || e.pointerId !== drag.id) return;
  const [x, y] = logical(e), dx = x - drag.x, dy = y - drag.y;
  if (!drag.moved && Math.hypot(dx, dy) > 8) { drag.moved = true; M.el.classList.add('pan'); }
  if (drag.moved) { M.pan = drag.pan - dx; M.py = drag.py - dy; lay(); }
}
function up(e) {
  if (!drag || e.pointerId !== drag.id) return;
  const d = drag; drag = null; M.el.classList.remove('pan');
  if (d.moved) return;
  const [x, y] = logical(e), id = hitTest(x, y);
  if (id) { flash(id); M.tap?.(id); }
}

// f: 'ocak' | 'sancak' · ids: dokunulabilir binalar · tap(id): bina seçildi
export function showMerkez(f, ids, tap) {
  const stage = document.getElementById('stage');
  if (!M.el) {
    M.el = document.createElement('div'); M.el.id = 'merkez2d';
    M.inner = document.createElement('div'); M.inner.className = 'm2-in';
    M.el.appendChild(M.inner);
    M.el.addEventListener('pointerdown', down); addEventListener('pointermove', move); addEventListener('pointerup', up); addEventListener('pointercancel', () => { drag = null; });
    addEventListener('resize', () => setTimeout(lay, 60));
  }
  if (M.f !== f) {
    M.f = f; M.pan = -1; // ilk açılışta ortala
    M.inner.innerHTML = `<img class="m2-img" src="img/merkez/${f}.webp" alt="" draggable="false" decoding="async">`
      + GLOW[f].map(([x, y, r], i) => `<i class="m2-glow" style="left:${x / IW * 100}%;top:${y / IH * 100}%;width:${2 * r / IW * 100}%;height:${2 * r / IH * 100}%;animation-delay:${-i * 0.9}s"></i>`).join('')
      + GLOW[f].flatMap(([x, y, r], i) => [0, 1, 2].map(k => `<b class="m2-ember" style="left:${(x + (k - 1) * r * 0.45) / IW * 100}%;top:${y / IH * 100}%;animation-delay:${-(i * 1.3 + k * 1.7)}s;animation-duration:${3.2 + ((i + k) % 3) * 0.8}s"></b>`)).join('')
      + '<i class="m2-fog"></i><i class="m2-vig"></i>';
  }
  M.ids = ids; M.tap = tap;
  stage.appendChild(M.el); M.el.hidden = false;
  document.documentElement.classList.add('m2d');
  if (M.pan < 0) { M.pan = 1e9; M.py = 1e9; lay(); M.pan = M.max / 2; M.py = M.maxY / 2; }
  lay();
}
export function hideMerkez() {
  if (M.el) M.el.hidden = true;
  document.documentElement.classList.remove('m2d');
}
export const merkezShown = () => !!M.el && !M.el.hidden;
