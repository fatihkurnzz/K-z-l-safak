// 2B şehir sahneleri (21 Kas, GPT "Vahran Perspektif Son Teslim"): başkent (ocak = Kragmir, sancak = Elentha) ve Yemin Pazarı (carsi).
// 21 Kas (2): GPT'nin tek parça boyanmış sahneleri. Veri js/hub2d-data.js (otomatik; _tasarim/araclar/sahne.py). Görseller
// img/kd/sehir/<yer>/: sahne.webp, atlas.webp (bölge kesitleri; basınca parlar). Dokunma haritası veri dosyasında (RLE).
// Yerleşim: sahne ekranı KAPLAR (cover); taşan eksende parmakla kaydırılır. Dokunma dikdörtgenle değil binanın kendi şekliyle.
// Canlılık: tek tuvalde titreyen ışıklar (meşale/kristal) + süzülen zerreler (Kragmir kor, Elentha/çarşı ışık tozu).
// Düşük grafik kademesinde ya da "hareketi azalt" açıkken tuval çizilmez. Tercih: localStorage dd_hub2d = '0' eski 3B kasabayı açar.
import { view, toLocal, toLocalDelta } from './orient.js';
import { SAHNE, HIT_SCALE } from './hub2d-data.js';
import { url as g5url } from './grafik5-png.js';

const DIR = 'img/kd/sehir/';
// Etiket binanın tepesinden biraz içeride durur (üst sıradakiler HUD altına girmesin); ek pay:
// Kişi etiketi bir binanın etiketini kullanır (Tüccar Halvor kendi tezgâhının üstünde)
const TAKMA = {}; // 22 Kas: Tüccar Halvor çarşı meydanında ayrı nokta (hub2d-data ek.merchant)
const ETIKET_PAY = { king: 30 }; // genel kural: etiket bina yüksekliğinin %22'si kadar içeride
// İlk açılışta ekranın ortasına gelecek nokta (sahne pikseli)
const ODAK = { ocak: [1170, 517], sancak: [1170, 517], carsi: [1170, 505], 'klan-ocak': [1170, 505], 'klan-sancak': [1170, 505] }; // 22 Kas: 2340×1080 haritalar
// Yakınlaştırma sınırı: 1 = ekranı tam kaplar (en uzak), ZMAX kat yakın

export const hub2dOn = () => { try { return localStorage.getItem('dd_hub2d') !== '0'; } catch { return true; } };

let cur = null, D = null, layer = null, wrap = null, hitFn = null, glowEl = null, cvs = null;
let s = 1, s0 = 1, ox = 0, oy = 0, hitData = null, pan = {};
const ZMAX = 1.8, ptr = new Map();
export const onHit = fn => { hitFn = fn; };
// ui-hub: kimliğin o yerde bir işlevi var mı (yoksa bina basınca parlamaz)
let hitOk = () => true;
export const onHitOk = fn => { hitOk = fn; };

// --- yerleşim: cover + kaydırma payı ---
function clampPan() {
  const [W, H] = D.size, w = view.w, h = view.h;
  // sahne ekrandan darsa ortala (yanlarda bulanık zemin görünür), genişse kenarlara kadar kaydır
  ox = W * s <= w ? (w - W * s) / 2 : Math.min(0, Math.max(w - W * s, ox));
  oy = H * s <= h ? (h - H * s) / 2 : Math.min(0, Math.max(h - H * s, oy));
}
function layout(keep) {
  if (s2) return s2Layout();
  if (!D) return;
  const [W, H] = D.size, w = view.w, h = view.h;
  if (!w || !h) { requestAnimationFrame(() => layout(keep)); return; } // ekran ölçüsü henüz yok
  let fx, fy;
  if (keep && s) { fx = (w / 2 - ox) / s; fy = (h / 2 - oy) / s; } else [fx, fy] = ODAK[cur] || [D.size[0] / 2, D.size[1] / 2];
  const z = keep && s0 ? s / s0 : 1; s0 = Math.min(w / W, h / H); s = s0 * z; // 22 Kas: resmin TAMAMI görünür (eskiden kaplıyordu; geniş telefonda üst/alt %18 kesiliyordu)
  ox = w / 2 - fx * s; oy = h / 2 - fy * s; clampPan(); apply();
  if (cvs) { const r = Math.min(2, devicePixelRatio || 1); cvs.width = Math.round(w * r); cvs.height = Math.round(h * r); cvs._r = r; }
}
function zoomAt(cx, cy, k) { // ekran noktası (cx, cy) yerinde kalarak k kat yakınlaş
  const ns = Math.min(s0 * ZMAX, Math.max(s0, s * k)); if (ns === s) return;
  ox = cx - (cx - ox) * ns / s; oy = cy - (cy - oy) * ns / s; s = ns; clampPan(); apply();
}
function apply() { if (wrap) wrap.style.transform = `translate(${ox}px,${oy}px) scale(${s})`; }

// --- dokunma: kimlik haritası (veri dosyasında RLE; açılınca bir kez çözülür) ---
function loadHit(H) {
  const px = new Uint8Array(H.w * H.h); let o = 0;
  for (let i = 0; i < H.rle.length; i += 2) { px.fill(H.rle[i], o, o + H.rle[i + 1]); o += H.rle[i + 1]; }
  hitData = { w: H.w, h: H.h, px };
}
function pick(lx, ly) { // mantıksal ekran noktası → bina kimliği
  if (!hitData) return null;
  const x = Math.floor((lx - ox) / s / HIT_SCALE), y = Math.floor((ly - oy) / s / HIT_SCALE);
  if (x < 0 || y < 0 || x >= hitData.w || y >= hitData.h) return null;
  const v = hitData.px[y * hitData.w + x];
  return v ? v - 1 : null; // bölge sırası
}
function glow(i) {
  if (!glowEl) return;
  const b = i != null && D.r[i];
  if (!b) { glowEl.classList.remove('on'); return; }
  glowEl.style.cssText = `left:${b.box[0]}px;top:${b.box[1]}px;width:${b.box[2] - b.box[0]}px;height:${b.box[3] - b.box[1]}px;background-image:url("${DIR}${cur}/atlas.webp");background-position:${-b.a[0]}px ${-b.a[1]}px`;
  glowEl.classList.add('on');
}

// --- parmakla kaydırma ve dokunma ---
function bind() {
  layer.addEventListener('pointerdown', e => {
    if (e.button > 0) return;
    const p = toLocal(e.clientX, e.clientY); ptr.set(e.pointerId, p);
    if (ptr.size === 2) { glow(null); const [a, b] = [...ptr.values()]; pan = { pinch: Math.hypot(a.x - b.x, a.y - b.y), moved: true }; return; }
    const nb = e.target.closest?.('.h2-npc'); // P23 K8: figüre basınca bağlı olduğu binanın eylemi
    pan = { id: e.pointerId, x: e.clientX, y: e.clientY, ox, oy, moved: false, hit: nb ? null : pick(p.x, p.y), npc: nb?.dataset.id };
    if (pan.hit != null && !hitOk(D.r[pan.hit].id)) pan.hit = null; // oyunda karşılığı olmayan bina parlamaz
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
    const i = !pan.moved && e.type === 'pointerup' ? pan.hit : null;
    const nid = !pan.moved && e.type === 'pointerup' ? pan.npc : null;
    pan = {}; setTimeout(() => glow(null), i != null ? 140 : 0);
    if (i != null && hitFn) hitFn(D.r[i].id);
    else if (nid && hitFn) hitFn(nid);
  };
  layer.addEventListener('pointerup', end); layer.addEventListener('pointercancel', end);
  layer.addEventListener('wheel', e => { e.preventDefault(); const p = toLocal(e.clientX, e.clientY); zoomAt(p.x, p.y, Math.exp(-e.deltaY * 0.0015)); }, { passive: false });
}

// --- canlılık: ışıklar + zerreler ---
let raf = 0, last = 0, parts = [];
const calm = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches || /gfx=(min|low)/.test(location.search) || ['min', 'low'].includes(localStorage.getItem('dd_gfx')); } catch { return false; } };
const RENK = { ocak: { ates: '255,140,40', buz: '255,60,40', zerre: '255,120,40' }, sancak: { ates: '255,190,90', buz: '90,170,255', zerre: '255,236,180' }, carsi: { ates: '255,180,80', buz: '80,160,255', zerre: '210,225,255' }, klan: { ates: '255,180,80', buz: '80,220,255', zerre: '235,240,210' },
  'klan-ocak': { ates: '255,150,50', buz: '255,80,45', zerre: '255,150,60' }, 'klan-sancak': { ates: '255,200,110', buz: '90,190,255', zerre: '235,240,210' } }; // 23 Kas: klan alanı halk renkleri
const renkOf = k => RENK[k] || RENK[String(k).replace(/-.*/, '')] || RENK.ocak; // 23 Kas: 'klan-ocak' vb. için güvenli arama (her karede hata atıyordu)
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
  const g = cvs.getContext('2d'), r = cvs._r || 1, [W, H] = D.size, C = renkOf(cur); // 23 Kas: RENK[cur] undefined olabiliyordu
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

// --- P23 K8: haritalarda NPC figürleri (GPT A7 + Gemini N6 yerleşim tablosu; js/hub2d-data.js'e DOKUNULMAZ, ayrı katman) ---
// Satır: [dosya anahtarı, x, y (ayak noktası, sahne pikseli), boy (px), basınca eylemin bina kimliği, aynala?, etiket merkezi y]
// Görseller js/p23-npc-png.js'ten tembel iner (yalnız harita açılınca). Klan haritaları için N6 koordinat vermedi: figür yok.
const NPC_HAR = {
  sancak: [['npc-edran', 1210, 405, 130, 'king', 0, 254], ['npc-maelis', 1840, 355, 112, 'iksir', 0, 222], ['npc-corin', 1870, 770, 135, 'gate', 0, 614], ['npc-lira', 1140, 765, 124, 'monument', 0, 620]],
  ocak: [['npc-volgar', 1255, 420, 135, 'king', 0, 264], ['npc-iksirci-kragmir', 1790, 340, 112, 'iksir', 0, 207], ['npc-thrak', 1855, 815, 138, 'gate', 0, 656], ['npc-lira', 1140, 745, 125, 'monument', 0, 599]],
  'carsi-sancak': [['npc-halvor', 1240, 510, 122, 'merchant', 0, 367], ['npc-yashka', 965, 650, 124, 'yashka', 0, 505], ['npc-maelis', 660, 770, 130, 'c_sarf', 1, 619], ['npc-lira', 1735, 515, 118, 'c_taki', 1, 376]],
  'carsi-ocak': [['npc-tuccar-kragmir', 1240, 510, 122, 'merchant', 0, 367], ['npc-saman-kragmir', 965, 650, 124, 'yashka', 0, 505], ['npc-iksirci-kragmir', 660, 770, 130, 'c_sarf', 1, 619], ['npc-lira', 1735, 515, 118, 'c_taki', 1, 376]],
};
let npcLbl = {}, NB = null, NBL = null; const NU = {};
const nUrl = k => { if (!NB?.[k]) return ''; if (!NU[k]) { const b = atob(NB[k]), a = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); NU[k] = URL.createObjectURL(new Blob([a], { type: 'image/webp' })); } return NU[k]; };
function npcKur() {
  npcLbl = {};
  if (!document.documentElement.classList.contains('p23')) return;
  const f = document.documentElement.dataset.faction === 'ocak' ? 'ocak' : 'sancak', yer = cur, L = NPC_HAR[yer === 'carsi' ? 'carsi-' + f : yer];
  if (!L) return;
  for (const [, , , , id, , ly] of L) npcLbl[id] = [L.find(r => r[4] === id)[1], ly];
  (NBL ||= import('./p23-npc-png.js').then(m => (NB = m.default)).catch(() => null)).then(() => {
    if (cur !== yer || !NB || !glowEl) return;
    glowEl.insertAdjacentHTML('beforebegin', `<div class="h2-npcs${calm() ? ' calm' : ''}">${L.map(([k, x, y, h, id, fl], i) => { const sz = Math.round(h * 512 / 485), w = Math.round(h * .6);
      return `<div class="h2-npc${fl ? ' fl' : ''}" data-id="${id}" style="left:${x - w / 2}px;top:${y - h}px;width:${w}px;height:${h}px;--sz:${sz}px;--dl:${-i * 0.7}s"><img class="g" src="${nUrl(k + '_golge')}" alt="" draggable="false"><img class="a" src="${nUrl(k + '_1')}" alt="" draggable="false"><img class="b" src="${nUrl(k + '_2')}" alt="" draggable="false"></div>`; }).join('')}</div>`);
  });
}

// Katmanı kurar. yer: 'ocak' | 'sancak' (başkent) | 'carsi' (Yemin Pazarı) | 'klan-ocak' | 'klan-sancak'
export function show2d(yer) {
  s2 = (yer === 'ocak' || yer === 'sancak' || yer === 'carsi' || yer.startsWith('klan')) && sehir2On(); // 23 Kas: yeni başkent (sehir2); 24 Kas: çarşı ve klan da aynı yeni HUD ile
  if (s2) return s2Kur(yer);
  cur = SAHNE[yer] ? yer : 'ocak'; D = SAHNE[cur];
  if (!layer) {
    layer = document.createElement('div'); layer.id = 'hub2d'; document.getElementById('stage').after(layer); bind();
    addEventListener('resize', () => requestAnimationFrame(() => { if (active2d()) layout(true); }));
  }
  const [W, H] = D.size;
  layer.innerHTML = `<div class="h2-bg" style="background-image:url('${DIR}${cur}/sahne.webp')"></div><div class="h2-wrap" style="width:${W}px;height:${H}px"><img class="h2-mir l" src="${DIR}${cur}/sahne.webp" alt="" draggable="false"><img class="h2-mir r" src="${DIR}${cur}/sahne.webp" alt="" draggable="false"><img class="h2-img" src="${DIR}${cur}/sahne.webp" alt="" decoding="async" draggable="false"><div class="h2-glow" aria-hidden="true"></div></div>${calm() ? '' : '<canvas class="h2-fx" aria-hidden="true"></canvas>'}`;
  { const fu = g5url('flama-' + (document.documentElement.dataset.faction === 'ocak' ? 'ocak' : 'sancak')); if (fu) layer.insertAdjacentHTML('beforeend', `<img class="h2-flama" src="${fu}" alt="" aria-hidden="true">`); } // 22 Kas: sağ şeritte halk flaması
  wrap = layer.querySelector('.h2-wrap'); glowEl = layer.querySelector('.h2-glow'); cvs = layer.querySelector('.h2-fx');
  document.documentElement.dataset.hub2d = cur.startsWith('klan') ? 'klan' : cur; // klan-ocak/klan-sancak: iki halk teması (22 Kas)
  loadHit(D.hit); npcKur();
  s = 0; s0 = 0; layout(false);
  if (cvs) { seed(); if (!raf) raf = requestAnimationFrame(tick); }
}
export function hide2d() { delete document.documentElement.dataset.hub2d; delete document.documentElement.dataset.sehir2; s2 = false; }
export const active2d = () => !!document.documentElement.dataset.hub2d;
// Etiketin ekrandaki noktası (oyundaki bina kimliğiyle; 'king' kral, 'merchant'/'child' çarşı kişileri). Yoksa null.
export function pos2d(id) {
  if (s2) return s2Pos(id);
  if (!D) return null;
  if (npcLbl[id]) return { x: ox + npcLbl[id][0] * s, y: oy + npcLbl[id][1] * s }; // P23 K8: etiket figürün üstünde
  const k = TAKMA[id] || id, b = D.r.find(r => r.id === k), p = b ? [b.label[0], b.label[1] + (b.box[3] - b.box[1]) * 0.22 + (ETIKET_PAY[k] || 0)] : D.ek?.[id];
  if (!p) return null;
  return { x: ox + p[0] * s, y: oy + p[1] * s };
}

// ================= sehir2 (23 Kas): tek parça 1376x768 başkent resmi, cover; her şey resmin yüzde koordinatında =================
// Satır: kimlik → [x%, y%, ikon no (i1..i10, 0 = yok)]. Etiket noktası etiketin MERKEZİdir (ui-hub css'i yarım boy aşağı kaydırır).
// Etiket merkezleri: referans 1376x768 pikseli (x, y, ikon no) → resim yüzdesi; ölçüm tablosu docs yerine production/qa/evidence/2026-11-24-referans/olcu.md
const R2 = (x, y, ic) => [+(x / 13.76).toFixed(2), +(y / 7.68).toFixed(2), ic];
// P28: başkent = yalnız fotoğraf (img/p28/city_*_final.jpg, 2752x1536 = 1376x768 oranı). Etiketler yalnız yazı (ikon 0). Çarşı, Savaş Çadırı ve Kapı kalktı;
// Han (sol alt ev), Ahır (sağ alt ağıl) ve Zafer Anıtı (sol orta bayraklı anıt) eklendi. Koordinatlar yeni resimden ölçüldü (1376x768 referans pikseli).
const S2_IRK = {
  sancak: { king: R2(750, 110, 0), clanhq: R2(740, 200, 0), anvil: R2(399, 234, 0), iksir: R2(1053, 220, 0), wheel: R2(1259, 323, 0), mine: R2(275, 372, 0),
    monument: R2(743, 296, 0), karaborsa: R2(1011, 351, 0), portal: R2(812, 447, 0), zaferAniti: R2(485, 440, 0), han: R2(172, 523, 0), ahir: R2(1238, 468, 0) },
  ocak: { king: R2(746, 103, 0), clanhq: R2(746, 200, 0), anvil: R2(389, 234, 0), iksir: R2(1053, 207, 0), wheel: R2(1276, 254, 0), mine: R2(261, 375, 0),
    monument: R2(753, 272, 0), karaborsa: R2(1011, 358, 0), portal: R2(812, 440, 0), zaferAniti: R2(537, 413, 0), han: R2(461, 495, 0), ahir: R2(1211, 482, 0) } };
// 24 Kas (G7): Çarşı ve Klan Obası alt haritaları (md Bölüm 3; X%, Y% = etiket merkezi). Klan iki halkta aynı. Üçüncü sayı ikon no (i1..i10).
const S2_YER = {
  // P28: Yemin Pazarı = yalnız fotoğraf (P29: sahneler/yemin_pazari.webp). Etiketler yalnız yazı; noktalar yeni resimden (referans pikseli).
  // Işınlanma Kapısı arkadaki merkez taş kapının üstünde. Resimde iskele/göl yok: Balık Tut sol üstteki şelalenin dibine (en yakın su) taşındı.
  // P29: sahneler/yemin_pazari.webp (1600x893, aynı kompozisyon) — noktalar yeni resimde denetlendi; Balık Tut şelalenin altına (x %25, y %30) çekildi:
  // şelale dibi sol üst HUD'un (ad/can/Premium) altında kalıyor, oraya konunca etiket görünmüyor ve Premium düğmesi tıklamayı alıyordu.
  carsi: { portal: R2(710, 318, 0), c_taki: R2(105, 445, 0), c_sarf: R2(250, 405, 0), merchant: R2(385, 455, 0), pazar: R2(620, 392, 0), child: R2(600, 520, 0),
    karaborsa: R2(870, 330, 0), yashka: R2(1030, 400, 0), c_silah: R2(870, 470, 0), c_zirh: R2(1230, 455, 0), pier: R2(344, 230, 0) },
  // P29: Klan Obası = yalnız fotoğraf (sahneler/klan_obasi_<halk>.webp, 1376x768; iki halkta aynı yerleşim). Etiketler yalnız yazı (ikon 0).
  // Işınlanma Kapısı üst ortadaki arka sur kapısında (TALIMAT §3), Hazine sol ortadaki sandıklı bina, Karargâh ortadaki büyük çadır,
  // Sancak bayraklı sol kule, Hisar sağ arka burç, Dükkân sol ortadaki küçük çadır, Salon alt ortadaki çatılı bina, Görev Panosu sağdaki tezgâh çadırı,
  // Oba Avı sağdaki çitli talim alanı, Kapı sol alttaki sur kapısı. Sağ ön köşedeki demirci yalnız dekor (etiket yok); sağ üstteki çeşme/mangal da etiketsiz.
  klan: { k_hazine: [19, 40, 0], k_sancak: [31, 28, 0], k_hisar: [83, 22, 0], k_hq: [50, 37, 0], k_salon: [37, 72, 0], k_dukkan: [33, 53, 0], k_gorev: [66, 58, 0], k_av: [82, 47, 0], gate: [22, 67, 0], portal: [50, 13, 0] } };
export const S2 = { ...S2_IRK.ocak };
export const sehir2On = () => { try { return !/[?&]sehir=0/.test(location.search) && localStorage.getItem('dd_sehir') !== '0'; } catch { return true; } };
export const sehir2Aktif = () => s2 && active2d();
let s2 = false, s2f = 'ocak', s2R = { x: 0, y: 0, w: 0, h: 0 }, s2box = null, s2cv = null;
const S2_ASP = 1376 / 768;
/** P29: başkent sahneleri (halk → yol); 1600x892/893 WebP, oran 1,794 ≈ S2_ASP (fark %0,1, etiket kayması <1 px). Yalnız etkin halkınki iner (s2Kur). */
export const S2_BG = { ocak: 'sahneler/baskent_kragmir.webp', sancak: 'sahneler/baskent_elentha.webp' };
/** P29: Yemin Pazarı sahnesi (1600x893); yalnız çarşı açılınca (ya da Işınlanma menüsünde) iner. */
export const S2_CARSI_BG = 'sahneler/yemin_pazari.webp';
/** P29: Klan Obası sahneleri (halk → yol, 1376x768); yalnız klan toprağına girilince (ya da Işınlanma menüsünde) iner. Eski p24 map_klan_* inmez. */
export const S2_KLAN_BG = { ocak: 'sahneler/klan_obasi_kragmir.webp', sancak: 'sahneler/klan_obasi_elentha.webp' };
const S2_KIRP = 0.15; // P27 1.1: geniş ekranda en çok bu oranda dikey kırpma (kule ve alt binalar korunur); kalan boşluk başkentte düz koyu zemin (P28), alt haritalarda .s2-fill
const S2_ODAK = 0.44; // kırpılan payın üstten alınan oranı (object-position: center 44%)
function s2Pos(id) {
  const q = S2[id]; if (!q || !s2R.w) return null;
  const m = 20; // dar/uzun ekranda kenara taşan etiket ekranın içine çekilir
  return { x: Math.min(view.w - m, Math.max(m, s2R.x + q[0] / 100 * s2R.w)), y: Math.min(view.h - 18, Math.max(18, s2R.y + q[1] / 100 * s2R.h)) };
}
function s2Layout() {
  const w = view.w, h = view.h;
  if (!w || !h) { requestAnimationFrame(s2Layout); return; }
  const bw = Math.min(w, h * S2_ASP / (1 - S2_KIRP)), bh = bw / S2_ASP; // genişliğe sığdır, ama dikey kırpma S2_KIRP'i aşmasın (P27: 20:9/21:9'da aşırı yakınlaşma yok)
  s2R = { x: (w - bw) / 2, y: bh >= h ? (h - bh) * S2_ODAK : (h - bh) * .5, w: bw, h: bh }; // taşma payı center 44%; yan boşluğu .s2-fill bulanık kopyayla dolar
  if (s2box) { const st = s2box.style; st.left = s2R.x + 'px'; st.top = s2R.y + 'px'; st.width = bw + 'px'; st.height = bh + 'px'; st.setProperty('--u', bw / 100 + 'px'); }
  document.documentElement.style.setProperty('--s2k', Math.max(.78, Math.min(1.25, Math.min(w / 1000, h / 480))).toFixed(3));
}
// P28 (kullanıcı, 25 Kas): başkent = YALNIZ FOTOĞRAF. Canlı sprite katmanı (muhafız/tüccar/demirci/vagon), çark kaplaması,
// ışık/parıltı katmanları ve yan bulanık dolgu kaldırıldı; kod yolu yok (eski s2Canli/s2Bagla silindi). Yemin Pazarı (P28) ve Klan Obası (P29) da yalnız fotoğraf.
/** Yeni başkent/çarşı/klan sahnesini kurar. Başkentte yalnız etkin halkın fotoğrafı iner; sprite paketi içe alınmaz. */
async function s2Kur(yer) {
  const klan = yer.startsWith('klan'), alt = klan || yer === 'carsi', dF = document.documentElement.dataset.faction;
  const f = klan ? yer.slice(5) : alt ? (dF === 'ocak' ? 'ocak' : 'sancak') : yer; // renk/ikon paketi (halk)
  s2f = f; cur = yer; for (const k of Object.keys(S2)) delete S2[k];
  Object.assign(S2, alt ? S2_YER[klan ? 'klan' : 'carsi'] : S2_IRK[f] || S2_IRK.ocak); D = SAHNE[yer]; wrap = null; glowEl = null; cvs = null; hitData = null; npcLbl = {};
  if (!layer) {
    layer = document.createElement('div'); layer.id = 'hub2d'; document.getElementById('stage').after(layer); bind();
    addEventListener('resize', () => requestAnimationFrame(() => { if (active2d()) layout(true); }));
  }
  const root = document.documentElement;
  root.dataset.hub2d = klan ? 'klan' : yer; root.dataset.sehir2 = '1';
  layer.innerHTML = ''; s2box = null; s2cv = null;
  // başkent, Yemin Pazarı (P28) ve Klan Obası (P29): tek <img>, düz koyu zemin (#hub2d arka planı), efekt/sprite/ikon yok; eski map_carsi/map_klan_* inmez
  const src = klan ? S2_KLAN_BG[f] || S2_KLAN_BG.ocak : alt ? S2_CARSI_BG : S2_BG[f] || S2_BG.ocak;
  layer.innerHTML = `<div class="s2-box s2-foto"><img class="s2-bg" src="${src}" alt="" draggable="false" decoding="async"></div>`;
  s2box = layer.querySelector('.s2-box'); s2Layout();
}
