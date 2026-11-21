// 2B şehir sahneleri (21 Kas, GPT "Vahran Perspektif Son Teslim"): başkent (ocak = Kragmir, sancak = Elentha) ve Yemin Pazarı (carsi).
// Veri js/hub2d-data.js (otomatik; _tasarim/araclar/kur.py). Görseller img/kd/sehir/<yer>/: sahne.webp, <bina>.webp (sahneden
// piksel piksel kesilmiş bina; basınca parlar), hit.png (dokunma kimlik haritası: R değeri-1 = SAHNE.ids sırası).
// Yerleşim: sahne ekranı KAPLAR (cover); taşan eksende parmakla kaydırılır. Dokunma dikdörtgenle değil binanın kendi şekliyle.
// Canlılık: tek tuvalde titreyen ışıklar (meşale/kristal) + süzülen zerreler (Kragmir kor, Elentha/çarşı ışık tozu).
// Düşük grafik kademesinde ya da "hareketi azalt" açıkken tuval çizilmez. Tercih: localStorage dd_hub2d = '0' eski 3B kasabayı açar.
import { view, toLocal, toLocalDelta } from './orient.js';
import { SAHNE, HIT_SCALE } from './hub2d-data.js';

const DIR = 'img/kd/sehir/';
// Binası olmayan oyun noktaları (yalnız etiket; etikete dokunmak işlevi açar): sahne pikseli [x, y]
const EK = {
  ocak: {},
  sancak: {},
  carsi: { gate: [650, 905], monument: [250, 455], child: [768, 590] },
};
// Etiket binanın tepesinden biraz içeride durur (üst sıradakiler HUD altına girmesin); ek pay:
// Kişi etiketi bir binanın etiketini kullanır (Tüccar Halvor kendi tezgâhının üstünde)
const TAKMA = { merchant: 'tuccar' };
const ETIKET_PAY = { clanhq: 10 }; // genel kural: etiket bina yüksekliğinin %22'si kadar içeride
// İlk açılışta ekranın ortasına gelecek nokta (sahne pikseli)
const ODAK = { ocak: [768, 430], sancak: [768, 430], carsi: [768, 470] };
// Yakınlaştırma sınırı: 1 = ekranı tam kaplar (en uzak), ZMAX kat yakın

export const hub2dOn = () => { try { return localStorage.getItem('dd_hub2d') !== '0'; } catch { return true; } };

let cur = null, D = null, layer = null, wrap = null, hitFn = null, glowEl = null, cvs = null;
let s = 1, s0 = 1, ox = 0, oy = 0, hitData = null, pan = {};
const ZMAX = 1.8, ptr = new Map();
export const onHit = fn => { hitFn = fn; };

// --- yerleşim: cover + kaydırma payı ---
function clampPan() {
  const [W, H] = D.size, w = view.w, h = view.h;
  ox = Math.min(0, Math.max(w - W * s, ox)); oy = Math.min(0, Math.max(h - H * s, oy));
}
function layout(keep) {
  if (!D) return;
  const [W, H] = D.size, w = view.w, h = view.h;
  let fx, fy;
  if (keep && s) { fx = (w / 2 - ox) / s; fy = (h / 2 - oy) / s; } else [fx, fy] = ODAK[cur];
  const z = keep && s0 ? s / s0 : 1; s0 = Math.max(w / W, h / H); s = s0 * z;
  ox = w / 2 - fx * s; oy = h / 2 - fy * s; clampPan(); apply();
  if (cvs) { const r = Math.min(2, devicePixelRatio || 1); cvs.width = Math.round(w * r); cvs.height = Math.round(h * r); cvs._r = r; }
}
function zoomAt(cx, cy, k) { // ekran noktası (cx, cy) yerinde kalarak k kat yakınlaş
  const ns = Math.min(s0 * ZMAX, Math.max(s0, s * k)); if (ns === s) return;
  ox = cx - (cx - ox) * ns / s; oy = cy - (cy - oy) * ns / s; s = ns; clampPan(); apply();
}
function apply() { if (wrap) wrap.style.transform = `translate(${ox}px,${oy}px) scale(${s})`; }

// --- dokunma: kimlik haritası ---
function loadHit(src) {
  hitData = null;
  const im = new Image();
  im.onload = () => {
    const c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
    const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(im, 0, 0);
    hitData = { w: im.width, h: im.height, px: g.getImageData(0, 0, im.width, im.height).data };
  };
  im.src = src;
}
function pick(lx, ly) { // mantıksal ekran noktası → bina kimliği
  if (!hitData) return null;
  const x = Math.floor((lx - ox) / s / HIT_SCALE), y = Math.floor((ly - oy) / s / HIT_SCALE);
  if (x < 0 || y < 0 || x >= hitData.w || y >= hitData.h) return null;
  const v = hitData.px[(y * hitData.w + x) * 4];
  return v ? D.ids[v - 1] : null;
}
function glow(id) {
  if (!glowEl) return;
  const b = id && D.b[id];
  if (!b) { glowEl.classList.remove('on'); return; }
  glowEl.src = `${DIR}${cur}/${id}.webp`;
  glowEl.style.cssText = `left:${b.box[0]}px;top:${b.box[1]}px;width:${b.box[2] - b.box[0]}px;height:${b.box[3] - b.box[1]}px`;
  glowEl.classList.add('on');
}

// --- parmakla kaydırma ve dokunma ---
function bind() {
  layer.addEventListener('pointerdown', e => {
    if (e.button > 0) return;
    const p = toLocal(e.clientX, e.clientY); ptr.set(e.pointerId, p);
    if (ptr.size === 2) { glow(null); const [a, b] = [...ptr.values()]; pan = { pinch: Math.hypot(a.x - b.x, a.y - b.y), moved: true }; return; }
    pan = { id: e.pointerId, x: e.clientX, y: e.clientY, ox, oy, moved: false, hit: pick(p.x, p.y) };
    glow(pan.hit);
  });
  layer.addEventListener('pointermove', e => {
    if (!ptr.has(e.pointerId)) return;
    ptr.set(e.pointerId, toLocal(e.clientX, e.clientY));
    if (pan.pinch && ptr.size === 2) { // iki parmak: yakınlaştır
      const [a, b] = [...ptr.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
      zoomAt((a.x + b.x) / 2, (a.y + b.y) / 2, d / pan.pinch); pan.pinch = d; return;
    }
    if (pan.id !== e.pointerId) return;
    const d = toLocalDelta(e.clientX - pan.x, e.clientY - pan.y);
    if (!pan.moved && Math.hypot(d.x, d.y) < 9) return;
    if (!pan.moved) { pan.moved = true; glow(null); try { layer.setPointerCapture(e.pointerId); } catch {} }
    ox = pan.ox + d.x; oy = pan.oy + d.y; clampPan(); apply();
  });
  const end = e => {
    ptr.delete(e.pointerId);
    if (pan.pinch) { if (!ptr.size) pan = {}; return; }
    if (pan.id !== e.pointerId) return;
    const id = !pan.moved && e.type === 'pointerup' ? pan.hit : null;
    pan = {}; setTimeout(() => glow(null), id ? 140 : 0);
    if (id && hitFn) hitFn(id);
  };
  layer.addEventListener('pointerup', end); layer.addEventListener('pointercancel', end);
  layer.addEventListener('wheel', e => { e.preventDefault(); const p = toLocal(e.clientX, e.clientY); zoomAt(p.x, p.y, Math.exp(-e.deltaY * 0.0015)); }, { passive: false });
}

// --- canlılık: ışıklar + zerreler ---
let raf = 0, last = 0, parts = [];
const calm = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches || /gfx=(min|low)/.test(location.search) || ['min', 'low'].includes(localStorage.getItem('dd_gfx')); } catch { return false; } };
const RENK = { ocak: { ates: '255,140,40', buz: '255,60,40', zerre: '255,120,40' }, sancak: { ates: '255,190,90', buz: '90,170,255', zerre: '255,236,180' }, carsi: { ates: '255,180,80', buz: '80,160,255', zerre: '210,225,255' } };
function seed() {
  const [W, H] = D.size, n = cur === 'ocak' ? 46 : 30;
  parts = Array.from({ length: n }, () => newPart(W, H, true));
}
function newPart(W, H, any) {
  const ocak = cur === 'ocak';
  return { x: Math.random() * W, y: any ? Math.random() * H : H + 10, vx: (Math.random() - .5) * (ocak ? 14 : 8), vy: -(ocak ? 18 + Math.random() * 34 : 5 + Math.random() * 10),
    r: ocak ? 1.2 + Math.random() * 2.2 : 1 + Math.random() * 2.4, a: 0, life: 0, max: 5 + Math.random() * 7, ph: Math.random() * 6.3 };
}
function tick(t) {
  raf = requestAnimationFrame(tick);
  if (!cvs || !active2d() || document.hidden) return;
  if (t - last < 33) return; // ≈30 FPS yeter
  const dt = Math.min(0.1, (t - last) / 1000); last = t;
  const g = cvs.getContext('2d'), r = cvs._r || 1, [W, H] = D.size, C = RENK[cur];
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cvs.width, cvs.height);
  g.setTransform(s * r, 0, 0, s * r, ox * r, oy * r); g.globalCompositeOperation = 'lighter';
  const T = t / 1000;
  for (const kind of ['ates', 'buz']) for (const [x, y, rad] of D.isik[kind] || []) { // titreyen ışık
    const f = kind === 'ates' ? 0.55 + 0.25 * Math.sin(T * 9 + x) * Math.sin(T * 5.3 + y) + 0.12 * Math.sin(T * 23 + x * y) : 0.55 + 0.3 * Math.sin(T * 2.2 + x);
    const R = rad * (kind === 'ates' ? 2.3 : 2.8), gr = g.createRadialGradient(x, y, 0, x, y, R);
    gr.addColorStop(0, `rgba(${C[kind]},${0.34 * f})`); gr.addColorStop(1, `rgba(${C[kind]},0)`);
    g.fillStyle = gr; g.fillRect(x - R, y - R, R * 2, R * 2);
  }
  for (let i = 0; i < parts.length; i++) { // süzülen zerreler
    const p = parts[i]; p.life += dt;
    p.x += (p.vx + Math.sin(T * 1.3 + p.ph) * 6) * dt; p.y += p.vy * dt;
    const k = p.life / p.max; p.a = k < .2 ? k / .2 : k > .7 ? (1 - k) / .3 : 1;
    if (k >= 1 || p.y < -10) { parts[i] = newPart(W, H, false); if (cur !== 'ocak') { parts[i].y = Math.random() * H; } continue; }
    const tw = cur === 'ocak' ? 0.7 + 0.3 * Math.sin(T * 12 + p.ph) : 0.6 + 0.4 * Math.sin(T * 3 + p.ph);
    g.fillStyle = `rgba(${C.zerre},${0.75 * p.a * tw})`; g.beginPath(); g.arc(p.x, p.y, p.r, 0, 6.283); g.fill();
    g.fillStyle = `rgba(${C.zerre},${0.16 * p.a * tw})`; g.beginPath(); g.arc(p.x, p.y, p.r * 4, 0, 6.283); g.fill();
  }
}

// Katmanı kurar. yer: 'ocak' | 'sancak' (başkent) | 'carsi' (Yemin Pazarı)
export function show2d(yer) {
  cur = SAHNE[yer] ? yer : 'ocak'; D = SAHNE[cur];
  if (!layer) {
    layer = document.createElement('div'); layer.id = 'hub2d'; document.getElementById('stage').after(layer); bind();
    addEventListener('resize', () => requestAnimationFrame(() => { if (active2d()) layout(true); }));
  }
  const [W, H] = D.size;
  layer.innerHTML = `<div class="h2-wrap" style="width:${W}px;height:${H}px"><img class="h2-img" src="${DIR}${cur}/sahne.webp" alt="" decoding="async" draggable="false"><img class="h2-glow" alt="" draggable="false"></div>${calm() ? '' : '<canvas class="h2-fx" aria-hidden="true"></canvas>'}`;
  wrap = layer.querySelector('.h2-wrap'); glowEl = layer.querySelector('.h2-glow'); cvs = layer.querySelector('.h2-fx');
  document.documentElement.dataset.hub2d = cur;
  loadHit(`${DIR}${cur}/hit.png`);
  s = 0; s0 = 0; layout(false);
  if (cvs) { seed(); if (!raf) raf = requestAnimationFrame(tick); }
}
export function hide2d() { delete document.documentElement.dataset.hub2d; }
export const active2d = () => !!document.documentElement.dataset.hub2d;
// Etiketin ekrandaki noktası (oyundaki bina kimliğiyle; 'king' kral, 'merchant'/'child' çarşı kişileri). Yoksa null.
export function pos2d(id) {
  if (!D) return null;
  const k = TAKMA[id] || id, b = D.b[k], p = b ? [b.label[0], b.label[1] + (b.box[3] - b.box[1]) * 0.22 + (ETIKET_PAY[k] || 0)] : EK[cur]?.[id];
  if (!p) return null;
  return { x: ox + p[0] * s, y: oy + p[1] * s };
}
