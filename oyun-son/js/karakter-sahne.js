// Karakter ekranlarının sahnesi (sürüm 13): seçme (ui-karakter.js) ve oluşturma (ui-olustur.js) ekranları aynı küçük dioramayı
// kullanır. Kasaba ortamı kurulmaz (ağır): açık olan ortam gizlenir, yerine ırka özgü hafif bir sahne kurulur:
//   · boyalı arka plan: koddan çizilen bir tuval (İnsan — şafakta taş kale, sancaklar, sis; Ork — kor ışığında savaş otağı,
//     kazıklı çit, demirhane dumanı) silindir parçasına gerilir (ışıktan ve sisten etkilenmez),
//   · zemin + taş kürsü + ışıyan halka, iki sancak (bez dalgalanır), iki mangal (alev + titrek ışık), kor ya da toz zerreleri,
//   · ışık: gök dolgu, önden ana ışık (gölge), arkadan renkli kontur ışığı (karakterin silueti seçilsin).
// Isınma: kare sınırı 30; 4 sn dokunulmazsa 20; 18 sn sonra sahne donar ve saniyede 2 kare çizilir (çizim isteğe bağlı gibi).
// Dokunuş, tuş ya da tekerlek sahneyi uyandırır. Kapatınca (stageClose) bütün geometri, malzeme ve dokular bırakılır, gizlenen
// ortam geri açılır ve bir sonraki ekran ortamını yeniden kurar (world.env sıfırlanır).
import { THREE, scene, camera, FPS_CAP, setExposure, setSkyEnv, setKeyLight, gfx, clock, onUpdate, pauseGovernor } from './engine3d.js';
import { world, spawn, removeActor } from './world.js';

const ST = { on: false, race: null, g: null, hidden: [], actor: null, fires: [], cloth: [], motes: null, off: null, idleA: 0, idleB: 0, frozen: false, enter: 0, t: 0, root: null };

// ---------- yardımcılar ----------
const rng = seed => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
function noise1(R, n = 64) { const v = Array.from({ length: n + 1 }, R); v[n] = v[0]; return x => { x = ((x % 1) + 1) % 1 * n; const i = Math.floor(x), f = x - i, s = f * f * (3 - 2 * f); return v[i] * (1 - s) + v[i + 1] * s; }; }
function fbm(R) { const o = [noise1(R, 8), noise1(R, 23), noise1(R, 61), noise1(R, 149)]; return x => o[0](x) * 0.5 + o[1](x) * 0.27 + o[2](x) * 0.15 + o[3](x) * 0.08; }
const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
function tex(c, { repeat = 0, color = true } = {}) {
  const t = new THREE.CanvasTexture(c);
  if (color) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat, repeat); }
  t.anisotropy = gfx.T.aniso || 1;
  return t;
}
function glow(c, x, y, r, col, a = 1) { const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col.replace('A', a)); g.addColorStop(1, col.replace('A', 0)); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); }
function ridge(c, W, H, base, amp, f, col, x0 = 0, x1 = 1) {
  c.fillStyle = col; c.beginPath(); c.moveTo(W * x0, H);
  for (let i = 0; i <= 256; i++) { const u = x0 + (x1 - x0) * i / 256; c.lineTo(W * u, H * (base - amp * f(u))); }
  c.lineTo(W * x1, H); c.closePath(); c.fill();
}
function vgrad(c, W, y0, y1, stops) { const g = c.createLinearGradient(0, y0, 0, y1); stops.forEach(([o, s]) => g.addColorStop(o, s)); c.fillStyle = g; c.fillRect(0, y0, W, y1 - y0); }

// ---------- boyalı arka planlar ----------
// Tuvalin altı zemin hizasıdır (y = 0), üstü 12 birim yukarısı; silindir yayı 2,4 radyan (kenarları kadraja girmez).
function paintHuman(c, W, H, R) {
  vgrad(c, W, 0, H, [[0, '#0d1730'], [0.3, '#24396a'], [0.52, '#6c6f98'], [0.66, '#c98f78'], [0.78, '#f2b57c'], [0.9, '#ffdcaa'], [1, '#f6d2a0']]);
  glow(c, W * 0.58, H * 0.8, H * 0.5, 'rgba(255,226,170,A)', 0.9);
  glow(c, W * 0.58, H * 0.8, W * 0.35, 'rgba(255,190,140,A)', 0.35);
  // bulutlar: altı güneşle aydınlanan uzun şeritler
  for (let i = 0; i < 34; i++) {
    const x = R() * W, y = H * (0.12 + R() * 0.5), w = W * (0.06 + R() * 0.16), h = H * (0.012 + R() * 0.03);
    c.fillStyle = `rgba(${y < H * 0.35 ? '58,70,120' : '120,96,128'},${0.25 + R() * 0.3})`; c.beginPath(); c.ellipse(x, y, w, h, 0, 0, 7); c.fill();
    c.fillStyle = `rgba(255,${190 + R() * 40 | 0},150,${0.18 + R() * 0.25})`; c.beginPath(); c.ellipse(x + w * 0.1, y + h * 0.6, w * 0.8, h * 0.45, 0, 0, 7); c.fill();
  }
  // dağ katmanları (uzak olan göğe karışır)
  ridge(c, W, H, 0.8, 0.26, fbm(R), '#8d7f98');
  ridge(c, W, H, 0.86, 0.2, fbm(R), '#6b6582');
  glow(c, W * 0.58, H * 0.86, W * 0.18, 'rgba(255,214,160,A)', 0.35);
  ridge(c, W, H, 0.93, 0.12, fbm(R), '#4a4a64');
  // kale: sol tepede büyük burç ve sur, sağda uzak kuleler
  const stone = '#2b2d42', lit = 'rgba(255,190,120,.55)', win = (x, y, w, h) => { glow(c, x + w / 2, y + h / 2, w * 3, 'rgba(255,170,80,A)', 0.35); c.fillStyle = '#ffcf7a'; c.fillRect(x, y, w, h); };
  const tower = (cx, top, w, roof, col = stone, flag = '#2f56b0') => {
    c.fillStyle = col; c.fillRect(cx - w / 2, H * top, w, H - H * top);
    for (let k = 0; k < 4; k++) c.fillRect(cx - w / 2 - w * 0.06 + k * w * 0.3, H * top - w * 0.12, w * 0.18, w * 0.14); // mazgal
    c.fillRect(cx - w * 0.6, H * top, w * 1.2, w * 0.1);
    if (roof) { c.beginPath(); c.moveTo(cx - w * 0.62, H * top - w * 0.1); c.lineTo(cx, H * top - w * roof); c.lineTo(cx + w * 0.62, H * top - w * 0.1); c.fill();
      c.strokeStyle = col; c.lineWidth = 2; c.beginPath(); c.moveTo(cx, H * top - w * roof); c.lineTo(cx, H * top - w * roof - w * 0.5); c.stroke();
      c.fillStyle = flag; c.beginPath(); c.moveTo(cx, H * top - w * roof - w * 0.5); c.lineTo(cx + w * 0.55, H * top - w * roof - w * 0.4); c.lineTo(cx, H * top - w * roof - w * 0.3); c.fill(); }
    c.fillStyle = lit; c.fillRect(cx + w / 2 - w * 0.12, H * top, w * 0.12, H - H * top); // güneş yanı
    for (let k = 0; k < 3; k++) if (R() < 0.8) win(cx - w * 0.08, H * (top + 0.06 + k * 0.08), w * 0.12, w * 0.2);
  };
  // tepe
  ridge(c, W, H, 0.97, 0.14, x => Math.max(0, 1 - Math.abs(x - 0.27) / 0.2) ** 1.6, '#2e2f45', 0.02, 0.52);
  c.fillStyle = stone; c.fillRect(W * 0.13, H * 0.72, W * 0.3, H * 0.28);
  for (let x = W * 0.13; x < W * 0.43; x += W * 0.012) c.fillRect(x, H * 0.705, W * 0.007, H * 0.02);
  tower(W * 0.16, 0.6, W * 0.04, 1.3); tower(W * 0.25, 0.42, W * 0.065, 1.5); tower(W * 0.33, 0.52, W * 0.05, 1.4); tower(W * 0.42, 0.64, W * 0.035, 1.2);
  // sur üstünden sarkan uzun sancaklar
  for (const x of [0.2, 0.29, 0.375]) { const bx = W * x, by = H * 0.73, bw = W * 0.014, bh = H * 0.2;
    c.fillStyle = '#21408f'; c.beginPath(); c.moveTo(bx, by); c.lineTo(bx + bw, by); c.lineTo(bx + bw, by + bh); c.lineTo(bx + bw / 2, by + bh * 0.88); c.lineTo(bx, by + bh); c.fill();
    c.fillStyle = '#d6b25a'; c.fillRect(bx, by, bw, H * 0.008); c.fillRect(bx + bw * 0.35, by + bh * 0.3, bw * 0.3, bw * 0.3); }
  // sağda uzak kuleler (sise daha çok gömülü)
  const far = '#4c4a66';
  c.fillStyle = far; c.fillRect(W * 0.66, H * 0.8, W * 0.2, H * 0.2);
  tower(W * 0.69, 0.66, W * 0.03, 1.4, far, '#3c5fb0'); tower(W * 0.78, 0.6, W * 0.04, 1.5, far, '#3c5fb0'); tower(W * 0.85, 0.7, W * 0.026, 1.3, far, '#3c5fb0');
  // ışık hüzmeleri (güneşten)
  c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 7; i++) { const a = -0.6 + i * 0.2 + R() * 0.08, x0 = W * 0.58, y0 = H * 0.8, L = W * 0.6;
    c.fillStyle = `rgba(255,214,160,${0.025 + R() * 0.03})`; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0 + Math.sin(a - 0.03) * L, y0 - Math.cos(a - 0.03) * L); c.lineTo(x0 + Math.sin(a + 0.03) * L, y0 - Math.cos(a + 0.03) * L); c.fill(); }
  c.globalCompositeOperation = 'source-over';
  // yer sisi
  vgrad(c, W, H * 0.8, H, [[0, 'rgba(246,214,170,0)'], [0.55, 'rgba(240,206,168,.55)'], [1, 'rgba(226,190,150,.95)']]);
  for (let i = 0; i < 18; i++) { c.fillStyle = `rgba(255,232,200,${0.05 + R() * 0.08})`; c.beginPath(); c.ellipse(R() * W, H * (0.86 + R() * 0.12), W * (0.08 + R() * 0.12), H * 0.012, 0, 0, 7); c.fill(); }
  // kuşlar yok; yıldız yok (şafak): üst gökte birkaç sönük yıldız
  for (let i = 0; i < 60; i++) { c.fillStyle = `rgba(230,236,255,${R() * 0.6})`; c.fillRect(R() * W, R() * H * 0.25, 1.4, 1.4); }
}
function paintOrc(c, W, H, R) {
  vgrad(c, W, 0, H, [[0, '#060203'], [0.28, '#1a0705'], [0.5, '#3f1208'], [0.68, '#8a3112'], [0.82, '#d8641f'], [0.92, '#ff9440'], [1, '#ffb060']]);
  glow(c, W * 0.5, H * 0.98, H * 0.7, 'rgba(255,120,40,A)', 0.55);
  // duman bulutları
  for (let i = 0; i < 70; i++) { const x = R() * W, y = H * (0.05 + R() * 0.55), r = H * (0.04 + R() * 0.1); c.fillStyle = `rgba(${18 + R() * 20 | 0},6,4,${0.18 + R() * 0.25})`; c.beginPath(); c.ellipse(x, y, r * 2.2, r, 0, 0, 7); c.fill(); }
  // volkanik dağlar ve lav akıntısı
  const f1 = fbm(R);
  ridge(c, W, H, 0.82, 0.34, x => f1(x) ** 1.4 * 1.3, '#4a1a0e');
  c.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 3; k++) { const x0 = W * (0.15 + R() * 0.7); c.strokeStyle = 'rgba(255,110,30,.5)'; c.lineWidth = 2 + R() * 3; c.beginPath(); let x = x0, y = H * (0.82 - 0.34 * f1(x0 / W) ** 1.4 * 1.3) + 4; c.moveTo(x, y); for (let s = 0; s < 14; s++) { x += (R() - 0.5) * 14; y += H * 0.015; c.lineTo(x, y); } c.stroke(); glow(c, x0, H * 0.62, H * 0.12, 'rgba(255,90,20,A)', 0.25); }
  c.globalCompositeOperation = 'source-over';
  ridge(c, W, H, 0.9, 0.16, fbm(R), '#2a0e08');
  const dark = '#120605', rim = 'rgba(255,120,50,.6)';
  // gözetleme kuleleri (ham kütük, sivri çatı)
  const watch = (cx, top, w) => {
    c.strokeStyle = dark; c.lineWidth = w * 0.09;
    c.beginPath(); c.moveTo(cx - w * 0.45, H); c.lineTo(cx - w * 0.3, H * top); c.moveTo(cx + w * 0.45, H); c.lineTo(cx + w * 0.3, H * top); c.moveTo(cx - w * 0.42, H * 0.95); c.lineTo(cx + w * 0.36, H * (top + 0.12)); c.moveTo(cx + w * 0.42, H * 0.95); c.lineTo(cx - w * 0.36, H * (top + 0.12)); c.stroke();
    c.fillStyle = dark; c.fillRect(cx - w * 0.55, H * top - w * 0.1, w * 1.1, w * 0.35);
    c.beginPath(); c.moveTo(cx - w * 0.65, H * top - w * 0.1); c.lineTo(cx, H * top - w * 0.95); c.lineTo(cx + w * 0.65, H * top - w * 0.1); c.fill();
    for (const s of [-1, 1]) { c.beginPath(); c.moveTo(cx + s * w * 0.5, H * top); c.lineTo(cx + s * w * 0.95, H * top - w * 0.35); c.lineTo(cx + s * w * 0.55, H * top + w * 0.1); c.fill(); } // boynuz uçları
    glow(c, cx, H * top + w * 0.08, w * 0.9, 'rgba(255,130,40,A)', 0.5);
  };
  watch(W * 0.17, 0.56, W * 0.045); watch(W * 0.84, 0.6, W * 0.04);
  // çadırlar (deri otağlar) — ateş yanından aydınlık kenar
  const tent = (cx, w, h) => { const y = H * 0.97; c.fillStyle = dark; c.beginPath(); c.moveTo(cx - w, y); c.quadraticCurveTo(cx - w * 0.3, y - h * 0.7, cx, y - h); c.quadraticCurveTo(cx + w * 0.3, y - h * 0.7, cx + w, y); c.fill();
    c.strokeStyle = dark; c.lineWidth = 3; c.beginPath(); c.moveTo(cx - w * 0.1, y - h * 1.15); c.lineTo(cx + w * 0.05, y - h * 0.85); c.moveTo(cx + w * 0.12, y - h * 1.12); c.lineTo(cx - w * 0.04, y - h * 0.85); c.stroke();
    c.strokeStyle = rim; c.lineWidth = 2; c.beginPath(); c.moveTo(cx + w, y); c.quadraticCurveTo(cx + w * 0.3, y - h * 0.7, cx, y - h); c.stroke(); };
  for (const [x, w, h] of [[0.06, 0.05, 0.13], [0.27, 0.06, 0.16], [0.36, 0.04, 0.1], [0.62, 0.05, 0.12], [0.72, 0.065, 0.17], [0.94, 0.05, 0.13]]) tent(W * x, W * w, H * h);
  // demirhane bacaları ve duman sütunları
  for (const x of [0.44, 0.6]) { c.fillStyle = dark; c.fillRect(W * x, H * 0.7, W * 0.018, H * 0.3); glow(c, W * x + W * 0.009, H * 0.7, W * 0.03, 'rgba(255,140,50,A)', 0.8);
    for (let k = 0; k < 16; k++) { const t = k / 16; c.fillStyle = `rgba(20,8,6,${0.35 * (1 - t)})`; c.beginPath(); c.ellipse(W * x + W * 0.009 + Math.sin(k * 0.7) * W * 0.012 + t * W * 0.05, H * (0.68 - t * 0.55), W * (0.012 + t * 0.04), H * (0.02 + t * 0.05), 0, 0, 7); c.fill(); } }
  // savaş sancakları (yırtık bez, diş amblemi)
  for (const x of [0.31, 0.69]) { const bx = W * x, top = H * 0.5; c.strokeStyle = dark; c.lineWidth = 4; c.beginPath(); c.moveTo(bx, H); c.lineTo(bx, top); c.moveTo(bx - W * 0.016, top + 6); c.lineTo(bx + W * 0.016, top + 6); c.stroke();
    c.fillStyle = '#5e140c'; c.beginPath(); c.moveTo(bx - W * 0.014, top + 8); c.lineTo(bx + W * 0.014, top + 8); c.lineTo(bx + W * 0.012, top + H * 0.2); c.lineTo(bx + W * 0.004, top + H * 0.16); c.lineTo(bx - W * 0.003, top + H * 0.21); c.lineTo(bx - W * 0.012, top + H * 0.17); c.closePath(); c.fill();
    c.fillStyle = '#e9d9b0'; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(bx + s * W * 0.006, top + H * 0.06); c.lineTo(bx + s * W * 0.002, top + H * 0.12); c.lineTo(bx + s * W * 0.009, top + H * 0.08); c.fill(); } }
  // kazıklı çit
  c.fillStyle = dark;
  for (let x = 0; x < W; x += W * 0.009) { if (x > W * 0.4 && x < W * 0.6) continue; const h = H * (0.07 + R() * 0.04), y = H; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - h); c.lineTo(x + W * 0.0035, y - h - H * 0.02); c.lineTo(x + W * 0.007, y - h); c.lineTo(x + W * 0.007, y); c.fill(); }
  // kor zerreleri
  c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 380; i++) { const y = H * (0.2 + R() * 0.8), a = R() * (y / H); c.fillStyle = `rgba(255,${120 + R() * 90 | 0},40,${a})`; const s = 1 + R() * 2.2; c.fillRect(R() * W, y, s, s); }
  c.globalCompositeOperation = 'source-over';
  vgrad(c, W, H * 0.82, H, [[0, 'rgba(255,120,40,0)'], [0.6, 'rgba(200,80,30,.45)'], [1, 'rgba(150,56,22,.9)']]);
}
// zemin karoları
function groundTex(race, R) {
  const s = 512, cv = canvas(s, s), c = cv.getContext('2d');
  if (race === 'ocak') {
    c.fillStyle = '#2a1a12'; c.fillRect(0, 0, s, s);
    for (let i = 0; i < 260; i++) { c.fillStyle = `rgba(${R() < 0.5 ? '0,0,0' : '90,50,30'},${0.08 + R() * 0.15})`; c.beginPath(); c.ellipse(R() * s, R() * s, 6 + R() * 40, 4 + R() * 24, R() * 3, 0, 7); c.fill(); }
    c.strokeStyle = 'rgba(10,4,2,.8)'; c.lineWidth = 2;
    for (let i = 0; i < 26; i++) { let x = R() * s, y = R() * s; c.beginPath(); c.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (R() - 0.5) * 60; y += (R() - 0.5) * 60; c.lineTo(x, y); } c.stroke(); }
  } else {
    c.fillStyle = '#3a372f'; c.fillRect(0, 0, s, s);
    const n = 6, cell = s / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const off = (j % 2) * cell / 2, x = i * cell + off, y = j * cell, v = 0.85 + R() * 0.3, col = [108 * v | 0, 104 * v | 0, 94 * v | 0];
      c.fillStyle = `rgb(${col})`; c.beginPath(); c.roundRect((x % s) + 3, y + 3, cell - 6, cell - 6, 6); c.fill();
      if (x + cell > s) { c.beginPath(); c.roundRect(x - s + 3, y + 3, cell - 6, cell - 6, 6); c.fill(); }
      for (let k = 0; k < 10; k++) { c.fillStyle = `rgba(0,0,0,${R() * 0.12})`; c.fillRect(x + R() * cell, y + R() * cell, 2 + R() * 10, 2 + R() * 6); }
    }
    for (let i = 0; i < 120; i++) { c.fillStyle = `rgba(70,90,40,${0.2 + R() * 0.3})`; c.fillRect(R() * s, R() * s, 2 + R() * 4, 2 + R() * 3); } // yosun
  }
  return tex(cv, { repeat: 7 });
}
// kürsü üstü: oyma halkalar (simge yok, yalnızca geometrik desen)
function daisTex(race, R) {
  const s = 512, cv = canvas(s, s), c = cv.getContext('2d'), m = s / 2, orc = race === 'ocak';
  c.fillStyle = orc ? '#3a2a22' : '#8c8578'; c.fillRect(0, 0, s, s);
  for (let i = 0; i < 400; i++) { c.fillStyle = `rgba(${R() < 0.5 ? '0,0,0' : '255,255,255'},${R() * 0.06})`; c.fillRect(R() * s, R() * s, 3 + R() * 14, 2 + R() * 8); }
  c.strokeStyle = orc ? 'rgba(0,0,0,.65)' : 'rgba(40,36,30,.6)';
  for (const [r, w] of [[0.97, 6], [0.86, 3], [0.62, 4], [0.5, 2]]) { c.lineWidth = w; c.beginPath(); c.arc(m, m, m * r, 0, 7); c.stroke(); }
  c.lineWidth = 3;
  for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; c.beginPath(); c.moveTo(m + Math.cos(a) * m * 0.62, m + Math.sin(a) * m * 0.62); c.lineTo(m + Math.cos(a) * m * 0.86, m + Math.sin(a) * m * 0.86); c.stroke(); }
  for (let i = 0; i < 8; i++) { const a = (i + 0.5) / 8 * Math.PI * 2, x = m + Math.cos(a) * m * 0.74, y = m + Math.sin(a) * m * 0.74; c.beginPath(); c.moveTo(x, y - 12); c.lineTo(x + 9, y); c.lineTo(x, y + 12); c.lineTo(x - 9, y); c.closePath(); c.stroke(); }
  return tex(cv);
}
function glowRingTex() { const s = 256, cv = canvas(s, s), c = cv.getContext('2d'), m = s / 2, g = c.createRadialGradient(m, m, m * 0.55, m, m, m); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.55, 'rgba(255,255,255,.9)'); g.addColorStop(0.7, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, s, s); return tex(cv, { color: false }); }
function flameTex() { const w = 64, h = 128, cv = canvas(w, h), c = cv.getContext('2d'); const g = c.createRadialGradient(w / 2, h * 0.72, 2, w / 2, h * 0.6, h * 0.5); g.addColorStop(0, 'rgba(255,250,220,1)'); g.addColorStop(0.25, 'rgba(255,190,80,.95)'); g.addColorStop(0.55, 'rgba(255,90,20,.6)'); g.addColorStop(1, 'rgba(120,20,0,0)'); c.fillStyle = g; c.beginPath(); c.moveTo(w / 2, 0); c.bezierCurveTo(w * 0.95, h * 0.45, w, h, w / 2, h); c.bezierCurveTo(0, h, w * 0.05, h * 0.45, w / 2, 0); c.fill(); return tex(cv); }
function dotTex() { const s = 32, cv = canvas(s, s), c = cv.getContext('2d'); glow(c, s / 2, s / 2, s / 2, 'rgba(255,255,255,A)', 1); return tex(cv, { color: false }); }
function bannerTex(race) {
  const w = 128, h = 320, cv = canvas(w, h), c = cv.getContext('2d'), orc = race === 'ocak';
  c.fillStyle = orc ? '#6a150d' : '#1f3d8c'; c.beginPath(); c.moveTo(0, 0); c.lineTo(w, 0); c.lineTo(w, h * 0.86);
  if (orc) { c.lineTo(w * 0.8, h * 0.95); c.lineTo(w * 0.62, h * 0.84); c.lineTo(w * 0.42, h); c.lineTo(w * 0.25, h * 0.86); c.lineTo(0, h * 0.94); } else { c.lineTo(w / 2, h); c.lineTo(0, h * 0.86); }
  c.closePath(); c.fill();
  for (let i = 0; i < 900; i++) { c.fillStyle = `rgba(0,0,0,${Math.random() * 0.1})`; c.fillRect(Math.random() * w, Math.random() * h, 2, 1 + Math.random() * 6); } // kumaş dokusu
  c.globalCompositeOperation = 'source-atop';
  const gold = orc ? '#c9a46a' : '#d9b65c';
  c.fillStyle = gold; c.fillRect(0, 0, w, 12); c.fillRect(0, 0, 6, h); c.fillRect(w - 6, 0, 6, h);
  c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(0, 12, w, 6);
  if (orc) { // iki diş ve bir kor
    c.fillStyle = '#e8dcbc'; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(w / 2 + s * 30, h * 0.28); c.quadraticCurveTo(w / 2 + s * 34, h * 0.45, w / 2 + s * 8, h * 0.52); c.quadraticCurveTo(w / 2 + s * 22, h * 0.42, w / 2 + s * 18, h * 0.28); c.fill(); }
    c.fillStyle = '#ff8a3a'; c.beginPath(); c.moveTo(w / 2, h * 0.33); c.lineTo(w / 2 + 10, h * 0.42); c.lineTo(w / 2, h * 0.5); c.lineTo(w / 2 - 10, h * 0.42); c.fill();
  } else { // kale burcu ve iki kanat çizgisi
    c.fillStyle = gold; const x = w / 2, y = h * 0.3; c.fillRect(x - 18, y + 10, 36, 50); for (let k = 0; k < 3; k++) c.fillRect(x - 18 + k * 14, y, 8, 12);
    c.fillStyle = '#1f3d8c'; c.fillRect(x - 6, y + 36, 12, 24);
    c.strokeStyle = gold; c.lineWidth = 4; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(x + s * 24, y + 30); c.quadraticCurveTo(x + s * 46, y + 16, x + s * 52, y - 6); c.stroke(); c.beginPath(); c.moveTo(x + s * 24, y + 44); c.quadraticCurveTo(x + s * 44, y + 36, x + s * 54, y + 18); c.stroke(); }
  }
  c.globalCompositeOperation = 'source-over';
  const t = tex(cv); return t;
}

// ---------- sahne kurulumu ----------
const PAL = {
  sancak: { fog: 0xc69f7e, fogD: [9, 30], hemi: [0x9fb8e8, 0x3a3026, 0.75], key: [0xffdcb0, 2.3, [-5, 7, 7]], rim: [0x8fc0ff, 2.6, [5, 5, -7]], ring: 0x8fd0ff, fire: 0xffa050, motes: 0xffe2b0, exp: 0.98, sky: { sky: ['#24396a', '#8a7a96', '#f2b57c'], ground: 0x4a4436, sun: 0xffd8a0, sunI: 1.2, rim: 0x8fc0ff, rimI: 0.8, torch: 0.4, dir: [-5, 7, 7] } },
  ocak: { fog: 0x7a2e12, fogD: [8, 26], hemi: [0xc0704a, 0x160806, 0.55], key: [0xffb07a, 1.9, [5, 6, 7]], rim: [0xff5a1e, 3.4, [-5, 4, -7]], ring: 0xff7a2a, fire: 0xff7a2a, motes: 0xff8a3a, exp: 1.05, sky: { sky: ['#1a0705', '#6a2410', '#d8641f'], ground: 0x2a1a12, sun: 0xffa060, sunI: 0.9, rim: 0xff5a1e, rimI: 1, torch: 1, dir: [5, 6, 7] } },
};
function own(o) { o.userData.ksOwn = true; return o; }
function build(race) {
  const P = PAL[race], R = rng(race === 'ocak' ? 7331 : 4242), g = new THREE.Group(); g.name = 'karakter-sahne';
  const T = gfx.T, big = gfx.tier === 'high';
  // arka plan
  const W = big ? 2560 : 2048, H = big ? 800 : 640, cv = canvas(W, H);
  (race === 'ocak' ? paintOrc : paintHuman)(cv.getContext('2d'), W, H, R);
  const bt = tex(cv); bt.wrapS = THREE.RepeatWrapping; bt.repeat.x = -1; bt.offset.x = 1; // silindirin içinden bakılır: ayna
  const arc = 2.4, bd = new THREE.Mesh(new THREE.CylinderGeometry(17, 17, 12, 40, 1, true, Math.PI - arc / 2, arc), new THREE.MeshBasicMaterial({ map: bt, side: THREE.BackSide, fog: false, toneMapped: false, depthWrite: false }));
  bd.position.y = 6; bd.renderOrder = -2; g.add(bd);
  // zemin
  const gt = groundTex(race, R);
  const ground = new THREE.Mesh(new THREE.CircleGeometry(17, 48).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: gt, roughness: 0.95, metalness: 0, envMapIntensity: 0.25 }));
  ground.receiveShadow = true; g.add(ground);
  // kürsü
  const dt = daisTex(race, R), stoneM = new THREE.MeshStandardMaterial({ color: race === 'ocak' ? 0x4a3a30 : 0x9a9284, roughness: 0.85, metalness: 0.02 });
  const dais = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 2.05, 0.2, 48), [stoneM, new THREE.MeshStandardMaterial({ map: dt, roughness: 0.8, envMapIntensity: 0.4 }), stoneM]);
  dais.receiveShadow = true; dais.castShadow = false; g.add(dais);
  const step = new THREE.Mesh(new THREE.CylinderGeometry(2.25, 2.4, 0.1, 48), stoneM); step.position.y = -0.05; step.receiveShadow = true; g.add(step);
  const rt = glowRingTex();
  const ring = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 4.6).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: rt, color: P.ring, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  ring.position.y = 0.105; g.add(ring); ST.ring = ring;
  // ışıklar
  g.add(new THREE.HemisphereLight(P.hemi[0], P.hemi[1], P.hemi[2]));
  const key = new THREE.DirectionalLight(P.key[0], P.key[1]); key.userData.dir = new THREE.Vector3(...P.key[2]); g.add(key);
  const rim = new THREE.DirectionalLight(P.rim[0], P.rim[1]); rim.position.set(...P.rim[2]); g.add(rim); g.add(rim.target);
  // sancaklar ve mangallar
  const wood = new THREE.MeshStandardMaterial({ color: race === 'ocak' ? 0x2a1a10 : 0x3a2c1e, roughness: 0.9 });
  const metal = new THREE.MeshStandardMaterial({ color: race === 'ocak' ? 0x3a3430 : 0xb89a52, roughness: 0.4, metalness: 0.85 });
  const btex = bannerTex(race), clothM = new THREE.MeshStandardMaterial({ map: btex, side: THREE.DoubleSide, roughness: 0.9, alphaTest: 0.5 });
  ST.cloth = [];
  for (const s of [-1, 1]) {
    const x = s * 3.1, z = -1.9, pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 4.2, 8), wood); pole.position.set(x, 2.1, z); pole.castShadow = true; g.add(pole);
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.2, 6).rotateZ(Math.PI / 2), wood); bar.position.set(x, 3.9, z); g.add(bar);
    const tip = new THREE.Mesh(race === 'ocak' ? new THREE.ConeGeometry(0.07, 0.45, 6) : new THREE.OctahedronGeometry(0.11), metal); tip.position.set(x, 4.35, z); g.add(tip);
    const geo = new THREE.PlaneGeometry(1.05, 2.6, 4, 12); geo.translate(0, -1.3, 0);
    const cloth = new THREE.Mesh(geo, clothM); cloth.position.set(x, 3.86, z + 0.06); cloth.castShadow = true; g.add(cloth);
    ST.cloth.push({ m: cloth, base: Float32Array.from(geo.attributes.position.array), ph: s * 1.7 });
  }
  // mangallar (ışık bütçesi kademeye göre)
  const ft = flameTex(), lights = Math.min(2, T.lamps || 0); ST.fires = [];
  for (const s of [-1, 1]) {
    const x = s * 2.75, z = 0.55;
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.12, 0.9, 6), metal); leg.position.set(x, 0.45, z); g.add(leg);
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.2, 0.25, 12, 1, true), metal); bowl.position.set(x, 0.98, z); g.add(bowl);
    const coal = new THREE.Mesh(new THREE.CircleGeometry(0.34, 12).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xff7a2a, toneMapped: false })); coal.position.set(x, 1.06, z); g.add(coal);
    const fl = new THREE.Sprite(new THREE.SpriteMaterial({ map: ft, color: P.fire, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, transparent: true })); fl.position.set(x, 1.45, z); fl.scale.set(0.55, 0.95, 1); g.add(fl);
    const fl2 = new THREE.Sprite(fl.material); fl2.position.set(x + 0.05, 1.35, z + 0.05); fl2.scale.set(0.4, 0.65, 1); g.add(fl2);
    let pl = null; if (ST.fires.length < lights) { pl = new THREE.PointLight(P.fire, race === 'ocak' ? 9 : 6, 9, 1.7); pl.position.set(x, 1.6, z + 0.2); g.add(pl); }
    ST.fires.push({ fl, fl2, pl, ph: s * 2.3 });
  }
  // zerreler: Ork — yükselen korlar; İnsan — ışıkta süzülen toz
  const n = Math.min(140, Math.max(40, (T.particles || 160) >> 2)), pos = new Float32Array(n * 3), vel = new Float32Array(n);
  for (let i = 0; i < n; i++) { pos[i * 3] = (R() - 0.5) * 9; pos[i * 3 + 1] = R() * 5; pos[i * 3 + 2] = -3 + R() * 5; vel[i] = 0.2 + R() * 0.5; }
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(pg, new THREE.PointsMaterial({ map: dotTex(), color: P.motes, size: race === 'ocak' ? 0.07 : 0.05, transparent: true, opacity: race === 'ocak' ? 0.95 : 0.6, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false }));
  g.add(pts); ST.motes = { pts, vel, orc: race === 'ocak' };
  // ışık hüzmesi (İnsan: güneşten çapraz; Ork: yerden kor parıltısı)
  if (race === 'sancak') {
    const sc = canvas(64, 256), c = sc.getContext('2d'); const gg = c.createLinearGradient(0, 0, 0, 256); gg.addColorStop(0, 'rgba(255,230,190,0)'); gg.addColorStop(0.4, 'rgba(255,230,190,.5)'); gg.addColorStop(1, 'rgba(255,230,190,0)'); c.fillStyle = gg; c.fillRect(0, 0, 64, 256);
    const hx = c.createLinearGradient(0, 0, 64, 0); hx.addColorStop(0, 'rgba(0,0,0,1)'); hx.addColorStop(0.5, 'rgba(0,0,0,0)'); hx.addColorStop(1, 'rgba(0,0,0,1)'); c.globalCompositeOperation = 'destination-out'; c.fillStyle = hx; c.fillRect(0, 0, 64, 256);
    const shaft = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 9), new THREE.MeshBasicMaterial({ map: tex(sc), transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false }));
    shaft.position.set(-1.2, 3.4, -2.6); shaft.rotation.z = -0.42; g.add(shaft);
  }
  setKeyLight(key, 0, 0, 3.6);
  scene.fog = new THREE.Fog(P.fog, ...P.fogD);
  setExposure(P.exp);
  setSkyEnv(P.sky);
  return own(g);
}
function disposeGroup(g) {
  scene.remove(g);
  const seen = new Set();
  g.traverse(o => {
    o.geometry?.dispose?.();
    if (o.isLight) o.dispose?.();
    for (const m of (Array.isArray(o.material) ? o.material : o.material ? [o.material] : [])) { if (seen.has(m)) continue; seen.add(m); m.map?.dispose(); m.dispose(); }
  });
}

// ---------- dışa açık işlevler ----------
// Sahneyi aç (ya da ırk değiştiyse yeniden kur). Çağıran önce clearScene() yapmış olmalı.
export function stageRace(race) {
  race = race === 'ocak' ? 'ocak' : 'sancak';
  if (!ST.on) open();
  if (ST.race === race && ST.g) return;
  if (ST.g) disposeGroup(ST.g);
  ST.race = race; ST.g = build(race); scene.add(ST.g);
  loadBg(race);
  pauseGovernor(1500); wake();
}
// 22 Kas (GPT karakter ekranları paketi): boyalı sahne resmi (Elentha / Kragmir) ekranı kaplayan arka plan olur; yüklenince
// koddan çizilen dekor (silindir, zemin, kürsü, sancak, mangal) gizlenir, ışıklar ve zerreler kalır; karakterin gölgesi
// görünmez bir gölge düzlemine düşer. Resim gelmezse eski dekor olduğu gibi kalır.
// P29: Elentha/Kragmir karakter seçim + oluşturma zemini = sahneler/karakter_secim_*.webp (kaide alt-ortada; yalnız bu ekranda iner)
const BG = { sancak: 'sahneler/karakter_secim_elentha.webp', ocak: 'sahneler/karakter_secim_kragmir.webp' };
/** P28/P29: geniş ekranda resmin dikey kırpma odağı (0 = alt kenar, 1 = üst kenar); kaide kadrajın altında kalsın diye halk başına. */
export const BG_ODAK = { sancak: 0, ocak: 0 }; // P29: yeni sahnede kaide alt-ortada (resim yüksekliğinin %64–88i): en alt kenar görünür, figür kaideye oturur
function loadBg(race) {
  new THREE.TextureLoader().load(BG[race], t => {
    if (!ST.on || ST.race !== race || !ST.g) { t.dispose(); return; }
    t.colorSpace = THREE.SRGBColorSpace;
    if (ST.bgTex) ST.bgTex.dispose(); else ST.bg0 = scene.background;
    ST.bgTex = t; scene.background = t; fitBg();
    for (const o of ST.g.children) if (o.isMesh || o.isSprite) o.visible = false;
    ST.ring = null; ST.cloth = []; ST.fires.forEach(f => { f.fl.visible = f.fl2.visible = false; });
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(10, 10).rotateX(-Math.PI / 2), new THREE.ShadowMaterial({ opacity: race === 'ocak' ? 0.45 : 0.3 }));
    sh.receiveShadow = true; sh.position.y = 0.002; ST.g.add(sh);
    scene.fog = null; wake();
  }, undefined, () => { });
}
// Resim ekranı kaplar (oran korunur, taşan kırpılır); alt kenara yakın tutulur (platform kadrajda kalsın)
function fitBg() {
  const t = ST.bgTex, im = t?.image; if (!im) return;
  const a = camera.aspect || 2, I = im.width / im.height;
  if (a > I) { t.repeat.set(1, I / a); t.offset.set(0, (1 - I / a) * (BG_ODAK[ST.race] ?? 0.35)); } else { t.repeat.set(a / I, 1); t.offset.set((1 - a / I) / 2, 0); }
}
// Sahnedeki kahramanı değiştir (eskisi bırakılır). Girişte kısa bir yükselme ve halka parlaması olur.
export function stageHero(unit, yaw = 0) {
  if (ST.actor && world.actors.includes(ST.actor)) removeActor(ST.actor);
  ST.actor = null;
  if (!unit) return null;
  ST.actor = spawn(unit, 0, 0, yaw);
  ST.actor.ring.visible = false; ST.base = ST.actor.char.root.scale.clone();
  ST.enter = 1; wake();
  return ST.actor;
}
export const stageActor = () => ST.actor;
function open() {
  ST.on = true; ST.hidden = []; ST.t = 0;
  ST.off = onUpdate(tick);
  for (const ev of ['pointerdown', 'pointermove', 'keydown', 'wheel']) window.addEventListener(ev, wake, { capture: true, passive: true });
  wake();
}
// Uyandır: tam hız; 4 sn sonra 20 kare; 18 sn sonra sahne donar (2 kare/sn)
export function wake() {
  if (!ST.on) return;
  if (ST.frozen) { ST.frozen = false; clock.scale = 1; }
  FPS_CAP.scene = 30;
  clearTimeout(ST.idleA); clearTimeout(ST.idleB);
  ST.idleA = setTimeout(() => { if (ST.on) FPS_CAP.scene = 20; }, 4000);
  ST.idleB = setTimeout(() => { if (ST.on) { ST.frozen = true; clock.scale = 0; FPS_CAP.scene = 2; } }, 18000);
}
export function stageClose() {
  if (!ST.on) return;
  ST.on = false; ST.off?.(); ST.off = null;
  for (const ev of ['pointerdown', 'pointermove', 'keydown', 'wheel']) window.removeEventListener(ev, wake, { capture: true });
  clearTimeout(ST.idleA); clearTimeout(ST.idleB);
  if (ST.frozen) clock.scale = 1; ST.frozen = false; FPS_CAP.scene = 30;
  if (ST.actor && world.actors.includes(ST.actor)) removeActor(ST.actor);
  ST.actor = null;
  if (ST.g) { disposeGroup(ST.g); ST.g = null; }
  if (ST.bgTex) { if (scene.background === ST.bgTex) scene.background = ST.bg0 ?? null; ST.bgTex.dispose(); ST.bgTex = null; ST.bg0 = undefined; }
  ST.race = null; ST.cloth = []; ST.fires = []; ST.motes = null; ST.ring = null;
  for (const o of ST.hidden) o.visible = true;
  ST.hidden = [];
  world.env = null; // sonraki ekran kendi ortamını (ışık, sis, gölge, yansıma) yeniden kursun
}
function tick(dt, t) {
  // ekranlar kapanmışsa (beklenmedik çıkış) sahne kendini bırakır
  if (!document.getElementById('tksel') && !document.getElementById('olz')) { stageClose(); return; }
  // ortamı ve başka nesneleri gizle (kahraman ve bu sahne hariç)
  const keep = new Set(world.actors.map(a => a.char.root));
  for (const o of scene.children) if (o !== ST.g && !keep.has(o) && o.visible && !o.isCamera) { o.visible = false; ST.hidden.push(o); }
  if (ST.bgTex) fitBg();
  if (!dt) return;
  ST.t += dt;
  for (const f of ST.fires) {
    const k = 0.85 + 0.15 * Math.sin(t * 9 + f.ph) * Math.sin(t * 13.7 + f.ph * 2);
    f.fl.scale.set(0.55 * (0.95 + 0.1 * Math.sin(t * 7 + f.ph)), 0.95 * k, 1); f.fl2.scale.set(0.4, 0.65 * (1.8 - k), 1);
    if (f.pl) f.pl.intensity = (ST.race === 'ocak' ? 9 : 6) * k;
  }
  for (const c of ST.cloth) {
    const p = c.m.geometry.attributes.position, b = c.base;
    for (let i = 0; i < p.count; i++) { const y = -b[i * 3 + 1], w = y / 2.6; p.array[i * 3 + 2] = b[i * 3 + 2] + Math.sin(t * 1.6 + y * 1.8 + b[i * 3] * 1.2 + c.ph) * 0.09 * w; }
    p.needsUpdate = true; c.m.geometry.computeVertexNormals();
  }
  const M = ST.motes;
  if (M) { const a = M.pts.geometry.attributes.position.array;
    for (let i = 0; i < M.vel.length; i++) { const j = i * 3;
      if (M.orc) { a[j + 1] += M.vel[i] * dt * 1.4; a[j] += Math.sin(t * 1.3 + i) * dt * 0.15; if (a[j + 1] > 5.5) { a[j + 1] = 0.3; a[j] = (Math.random() - 0.5) * 9; } }
      else { a[j + 1] += Math.sin(t * 0.4 + i) * dt * 0.05; a[j] += M.vel[i] * dt * 0.12; if (a[j] > 4.5) a[j] = -4.5; } }
    M.pts.geometry.attributes.position.needsUpdate = true; }
  if (ST.ring) ST.ring.material.opacity = 0.42 + 0.12 * Math.sin(t * 1.4) + 0.5 * ST.enter;
  if (ST.enter > 0 && ST.actor) { ST.enter = Math.max(0, ST.enter - dt * 2.2); const e = 1 - ST.enter, s = 0.94 + 0.06 * (1 - (1 - e) ** 3); ST.actor.char.root.scale.copy(ST.base).multiplyScalar(s); }
}
