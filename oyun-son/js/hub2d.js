// 2B başkent (Aşama 3, 20 Kas): ana merkez 3B sahne yerine halkın şehir resmi + görünmez bina dokunma alanları.
// Kaynak: docs/kd/asama3 (MANIFEST, koordinat/bina-koordinatlari.json). Bütün yollar ve koordinatlar burada; başka yerde sabit yok.
// Koordinatlar 2340×1080 tuval pikseli, kutu [sol, üst, sağ, alt], etiket noktası [x, y] (etiketin alt ortası).
// GPT'nin kutuları resme göre düzeltildi (Elentha'da çarşı/karaborsa/kral otağı kaymıştı; Kragmir'de Taş Yemini ile Kral Otağı,
// Karaborsa ile Kapı üst üsteydi). Kapı ve Maden sağ-alt/sol-alt arayüzün altında kalır: etiketleri binanın üst kısmına alındı.
// Tercih: localStorage dd_hub2d = '0' eski 3B başkenti açar (geri alma).
import { view } from './orient.js';

export const CANVAS = [2340, 1080];
const IMG = 'img/kd/merkez/';
// bina kimliği (kit) → oyundaki bina kimliği (ui-hub.js BUILDINGS; işlevler orada)
export const IDMAP = { 'kader-carki': 'wheel', ors: 'anvil', 'kral-otagi': 'clanhq', 'tas-yemini': 'monument', carsi: 'carsi', maden: 'mine', 'iksir-parsomen': 'iksir', karaborsa: 'karaborsa', kapi: 'gate' };
export const HUB2D = {
  ocak: {
    bg: IMG + 'sehir-ocak.jpg', blur: IMG + 'sehir-ocak-bulanik.jpg',
    box: { 'kader-carki': [110, 60, 520, 420], ors: [650, 150, 1000, 420], 'kral-otagi': [1000, 40, 1720, 410], 'tas-yemini': [900, 415, 1450, 800],
      carsi: [100, 450, 620, 710], maden: [40, 720, 470, 1040], 'iksir-parsomen': [1740, 140, 2200, 470], karaborsa: [1660, 470, 2110, 690], kapi: [1760, 700, 2310, 1040] },
    label: { 'kader-carki': [315, 430], ors: [825, 430], 'kral-otagi': [1260, 300], 'tas-yemini': [1175, 815], carsi: [380, 470], maden: [280, 760],
      'iksir-parsomen': [1970, 480], karaborsa: [1885, 700], kapi: [2035, 760], king: [1570, 340] },
  },
  sancak: {
    bg: IMG + 'sehir-sancak.jpg', blur: IMG + 'sehir-sancak-bulanik.jpg',
    box: { 'kader-carki': [60, 40, 470, 320], ors: [600, 170, 980, 400], 'kral-otagi': [1140, 0, 1740, 340], 'tas-yemini': [900, 345, 1500, 780],
      carsi: [280, 450, 820, 600], maden: [0, 620, 480, 1000], 'iksir-parsomen': [1780, 200, 2160, 430], karaborsa: [1640, 440, 2120, 600], kapi: [1660, 600, 2340, 1080] },
    label: { 'kader-carki': [330, 430], ors: [790, 410], 'kral-otagi': [1440, 345], 'tas-yemini': [1185, 790], carsi: [550, 610], maden: [240, 640],
      'iksir-parsomen': [1970, 440], karaborsa: [1880, 610], kapi: [2000, 700], king: [1470, 250] },
  },
};
const REV = Object.fromEntries(Object.entries(IDMAP).map(([k, v]) => [v, k]));
export const hub2dOn = () => { try { return localStorage.getItem('dd_hub2d') !== '0'; } catch { return true; } };

let cur = null, layer = null, hitFn = null;
// Dokunma alanı #hud dışında olduğundan ui-core'un data-a yönlendirmesi görmez: ui-hub bu işlevle ACT.building'e bağlar
export const onHit = fn => { hitFn = fn; };
// Yerleşim: resim ekrana sığdırılır (hiçbir bina kesilmez); en-boy oranı farklıysa boşluk aynı resmin bulanık kopyasıyla dolar
export function fit() {
  const w = view.w, h = view.h, s = Math.min(w / CANVAS[0], h / CANVAS[1]);
  return { s, ox: (w - CANVAS[0] * s) / 2, oy: (h - CANVAS[1] * s) / 2 };
}
function place() {
  if (!layer || !cur) return;
  const { s, ox, oy } = fit(), D = HUB2D[cur];
  const img = layer.querySelector('.h2-img');
  img.style.cssText = `left:${ox}px;top:${oy}px;width:${CANVAS[0] * s}px;height:${CANVAS[1] * s}px`;
  for (const el of layer.querySelectorAll('.h2-hit')) {
    const b = D.box[REV[el.dataset.id]];
    el.style.cssText = `left:${ox + b[0] * s}px;top:${oy + b[1] * s}px;width:${(b[2] - b[0]) * s}px;height:${(b[3] - b[1]) * s}px`;
  }
}
// Katmanı kurar: resim + dokunma alanları (data-a="building", oyundaki bina kimliğiyle; ACT.building aynen çalışır)
export function show2d(faction) {
  cur = HUB2D[faction] ? faction : 'ocak';
  const D = HUB2D[cur];
  if (!layer) { layer = document.createElement('div'); layer.id = 'hub2d'; const st = document.getElementById('stage'); st.after(layer);
    layer.addEventListener('click', e => { const b = e.target.closest('.h2-hit'); if (b && hitFn) hitFn(b.dataset.id); }); }
  layer.style.backgroundImage = `url("${D.blur}")`;
  layer.innerHTML = `<img class="h2-img" src="${D.bg}" alt="" decoding="async" draggable="false">${Object.keys(D.box).map(k => `<button class="h2-hit" data-a="building" data-id="${IDMAP[k]}" aria-label="${k}"></button>`).join('')}`;
  document.documentElement.dataset.hub2d = cur;
  place();
}
export function hide2d() { delete document.documentElement.dataset.hub2d; }
export const active2d = () => !!document.documentElement.dataset.hub2d;
// Etiketin ekrandaki noktası (oyundaki bina kimliğiyle; 'king' kralın etiketi). Yoksa null.
export function pos2d(id) {
  if (!cur) return null;
  const D = HUB2D[cur], p = id === 'king' ? D.label.king : D.label[REV[id]];
  if (!p) return null;
  const { s, ox, oy } = fit();
  return { x: ox + p[0] * s, y: oy + p[1] * s };
}
addEventListener('resize', () => requestAnimationFrame(() => { if (active2d()) place(); }));
