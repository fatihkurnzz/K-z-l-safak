// Açılış fragmanı: taraf seçilip hesap açılınca bir kez oynayan ~30 sn'lik kısa sinematik; Ayarlar → Hesap'tan yeniden izlenir.
// 2B tuval, katmanlı siluetler ve yavaş kamera hareketleri (üç boyutlu sahneye dokunmaz, Düşük kademede de ucuzdur).
// Kural içermez. Sesler mevcut sentezlenmiş yamalarla (sfx.js) çalınır. Kayıt: localStorage "dd_fragman:<hesap adı>".
import { S } from './api.js';
import { getGfx } from './gfx.js';
import { play, unlock } from './audio.js';
import { t } from './i18n.js';

const LS = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch { } } };
const key = () => 'dd_fragman:' + (S?.name || '');
export const fragmanSeen = () => LS.get(key()) === '1';

// Plan: [başlangıç sn, bitiş sn, çekim, altyazı, ses]. Toplam ~31 sn.
const SHOTS = [
  [0, 5, 'forge', 'Korant\'ın dağları, ilk örs sesiyle uyandı.', 'anvil.strike'],
  [5, 10, 'realm', 'Toprağın altında demir yattı; demir olan yerde güç vardı.', 'bt.wave'],
  [10, 15, 'humans', 'Elentha ışığın surlarını yükseltti.', 'ui.bell'],
  [15, 20, 'orcs', 'Kragmir karanlığın ocaklarını yaktı.', 'bt.stomp'],
  [20, 26, 'war', 'Bir avuç demir yüzünden kılıçlar çekildi.', 'bt.start'],
  [26, 31, 'hero', 'Şimdi sıra sende.', 'ui.horn'],
];
const END = 31.5, TITLE_AT = 27.5;

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));

// ---- çizim yardımcıları ----
function ridge(c, w, h, y, amp, seed, col, shift) {
  c.fillStyle = col; c.beginPath(); c.moveTo(-50, h);
  for (let x = -50; x <= w + 50; x += 24) { const u = x + shift; c.lineTo(x, y - amp * (Math.sin(u * 0.004 + seed) * 0.5 + Math.sin(u * 0.011 + seed * 2.3) * 0.3 + Math.abs(Math.sin(u * 0.0023 + seed * 5)) * 0.6)); }
  c.lineTo(w + 50, h); c.fill();
}
function sky(c, w, h, a, b, d) { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, a); g.addColorStop(d || 0.7, b); g.addColorStop(1, '#050304'); c.fillStyle = g; c.fillRect(0, 0, w, h); }
function glow(c, x, y, r, col, al) { const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); c.globalAlpha = al; c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); c.globalAlpha = 1; }
function soldier(c, x, y, s, col) { c.fillStyle = col; c.fillRect(x - s * 0.18, y - s * 0.7, s * 0.36, s * 0.7); c.beginPath(); c.arc(x, y - s * 0.82, s * 0.16, 0, 7); c.fill(); c.fillRect(x + s * 0.28, y - s * 1.3, s * 0.06, s * 1.3); }
function banner(c, x, y, s, col, tt) { c.fillStyle = '#16100c'; c.fillRect(x, y - s * 2, s * 0.07, s * 2); const sw = Math.sin(tt * 2 + x) * s * 0.12; c.fillStyle = col; c.beginPath(); c.moveTo(x + s * 0.07, y - s * 2); c.quadraticCurveTo(x + s * 0.5, y - s * 2 + sw, x + s * 0.9, y - s * 1.9); c.lineTo(x + s * 0.9, y - s * 1.35); c.quadraticCurveTo(x + s * 0.5, y - s * 1.45 + sw, x + s * 0.07, y - s * 1.3); c.fill(); }
function embers(c, w, h, tt, n, col) { c.fillStyle = col; for (let i = 0; i < n; i++) { const k = (i * 0.618 + tt * (0.04 + (i % 5) * 0.012)) % 1, x = ((i * 977) % 1000) / 1000 * w + Math.sin(tt + i) * 16; c.globalAlpha = (1 - k) * 0.85; c.fillRect(x, h * (1 - k), 2, 2); } c.globalAlpha = 1; }

// Her çekim: (bağlam, w, h, ilerleme 0..1, saniye, yüksek kalite mi). Kamera hareketi çekimin içinde (kaydırma/yakınlaşma).
const DRAW = {
  forge(c, w, h, p, tt, q) {
    sky(c, w, h, '#0b0709', '#2a0f08', 0.8);
    const z = 1 + p * 0.12; c.save(); c.translate(w / 2, h * 0.62); c.scale(z, z); c.translate(-w / 2, -h * 0.62);
    ridge(c, w, h, h * 0.62, h * 0.28, 1.3, '#120a0a', p * 40);
    glow(c, w * 0.5, h * 0.66, h * 0.55, 'rgba(255,120,30,.9)', 0.55 + Math.sin(tt * 9) * 0.06);
    ridge(c, w, h, h * 0.78, h * 0.12, 4.1, '#060303', -p * 60);
    const ax = w * 0.5, ay = h * 0.8; c.fillStyle = '#050303'; c.fillRect(ax - h * 0.09, ay - h * 0.05, h * 0.18, h * 0.05); c.fillRect(ax - h * 0.04, ay, h * 0.08, h * 0.08);
    c.save(); c.translate(ax + h * 0.12, ay - h * 0.06); c.rotate(-0.9 + (Math.sin(tt * 3.2) > 0.9 ? 0.9 : Math.sin(tt * 3.2) * 0.3)); c.fillRect(0, -h * 0.01, h * 0.16, h * 0.02); c.fillRect(h * 0.14, -h * 0.035, h * 0.045, h * 0.07); c.restore();
    c.restore();
    embers(c, w, h, tt, q ? 46 : 14, '#ffb040');
  },
  realm(c, w, h, p, tt, q) {
    sky(c, w, h, '#14131c', '#7a4a2c', 0.62);
    glow(c, w * 0.7, h * 0.45, h * 0.7, 'rgba(255,180,90,.8)', 0.6);
    const s = p * 120;
    ridge(c, w, h, h * 0.55, h * 0.3, 0.7, '#2a1c1e', s * 0.3); ridge(c, w, h, h * 0.68, h * 0.25, 2.2, '#1a1114', s * 0.6); ridge(c, w, h, h * 0.84, h * 0.18, 5.4, '#0b0708', s);
    c.strokeStyle = 'rgba(255,170,70,.65)'; c.lineWidth = 2; for (let i = 0; i < 6; i++) { const x = w * (0.1 + i * 0.16) - s * 0.6; c.beginPath(); c.moveTo(x, h * 0.9); c.lineTo(x + h * 0.1, h * 0.7 + Math.sin(i) * 20); c.stroke(); }
    if (q) embers(c, w, h, tt, 22, '#e8a050');
  },
  humans(c, w, h, p, tt, q) {
    sky(c, w, h, '#47688f', '#e9d9b0', 0.78);
    glow(c, w * 0.3, h * 0.38, h * 0.6, 'rgba(255,245,200,.95)', 0.7);
    const s = p * 90; ridge(c, w, h, h * 0.7, h * 0.18, 3.3, '#6f86a0', s * 0.3);
    const bx = w * 0.62 - s * 0.5; c.fillStyle = '#31404f'; c.fillRect(bx - w * 0.3, h * 0.66, w * 0.6, h * 0.34);
    for (let i = 0; i < 16; i++) c.fillRect(bx - w * 0.3 + i * (w * 0.6 / 16), h * 0.63, w * 0.6 / 32, h * 0.03);
    for (const k of [-0.2, 0.05, 0.25]) { c.fillRect(bx + w * k, h * 0.4, w * 0.06, h * 0.3); c.beginPath(); c.moveTo(bx + w * k - 6, h * 0.4); c.lineTo(bx + w * (k + 0.03), h * 0.3); c.lineTo(bx + w * (k + 0.06) + 6, h * 0.4); c.fill(); banner(c, bx + w * (k + 0.03), h * 0.3, h * 0.07, '#d9b44a', tt); }
    c.fillStyle = '#18222c'; c.fillRect(0, h * 0.9, w, h * 0.1);
    for (let i = 0; i < (q ? 22 : 8); i++) soldier(c, w * 0.05 + i * (w * 0.04) - s * 0.2, h * 0.93, h * 0.09, '#0e1620');
  },
  orcs(c, w, h, p, tt, q) {
    sky(c, w, h, '#0a0608', '#3a0c0a', 0.75);
    glow(c, w * 0.5, h * 0.9, h * 0.8, 'rgba(230,60,20,.9)', 0.5);
    const s = p * 90; ridge(c, w, h, h * 0.62, h * 0.3, 6.1, '#150909', s * 0.3); ridge(c, w, h, h * 0.8, h * 0.2, 1.7, '#080404', -s * 0.5);
    for (let i = 0; i < 5; i++) { const x = w * (0.12 + i * 0.19) - s * 0.4, y = h * 0.84; glow(c, x, y - h * 0.05, h * 0.18, 'rgba(255,140,40,.95)', 0.6 + Math.sin(tt * 8 + i) * 0.1); c.fillStyle = '#030202'; c.fillRect(x - 3, y - h * 0.12, 6, h * 0.14); banner(c, x + 6, y - h * 0.08, h * 0.06, '#8d1c12', tt); }
    c.fillStyle = '#030202'; c.fillRect(0, h * 0.92, w, h * 0.08);
    for (let i = 0; i < (q ? 20 : 7); i++) soldier(c, w * 0.9 - i * w * 0.045 + s * 0.2, h * 0.95, h * 0.11, '#050303');
    if (q) embers(c, w, h, tt, 36, '#ff7a30');
  },
  war(c, w, h, p, tt, q) {
    sky(c, w, h, '#2a1814', '#a8501e', 0.65);
    glow(c, w * 0.5, h * 0.5, h * 0.9, 'rgba(255,170,80,.7)', 0.45);
    c.save(); const z = 1 + p * 0.18; c.translate(w / 2, h * 0.8); c.scale(z, z); c.translate(-w / 2, -h * 0.8);
    ridge(c, w, h, h * 0.66, h * 0.16, 2.9, '#1a0f0e', 0);
    c.fillStyle = '#0a0605'; c.fillRect(0, h * 0.78, w, h * 0.3);
    const n = q ? 26 : 10, gap = p * w * 0.12;
    for (let i = 0; i < n; i++) {
      const y = h * (0.84 + (i % 4) * 0.035);
      soldier(c, w * 0.08 + i * (w * 0.4 / n) + gap * 0.5 + Math.sin(tt * 4 + i) * 3, y, h * 0.1, '#0a1018');
      soldier(c, w * 0.92 - i * (w * 0.4 / n) - gap * 0.5 + Math.sin(tt * 4 + i * 2) * 3, y, h * 0.11, '#120505');
    }
    const f = clamp(1 - Math.abs(p - 0.55) * 7); if (f > 0) glow(c, w * 0.5, h * 0.82, h * 0.7, 'rgba(255,240,200,1)', f * 0.9);
    c.restore();
    if (q && p > 0.5) { c.strokeStyle = 'rgba(255,200,120,.8)'; c.lineWidth = 1.5; for (let i = 0; i < 26; i++) { const a = i * 2.4, k = clamp((p - 0.5) * 2) * (0.4 + (i % 5) * 0.12); c.beginPath(); c.moveTo(w * 0.5 + Math.cos(a) * h * 0.1 * k, h * 0.82 + Math.sin(a) * h * 0.1 * k); c.lineTo(w * 0.5 + Math.cos(a) * h * 0.3 * k, h * 0.82 + Math.sin(a) * h * 0.3 * k - k * 20); c.stroke(); } }
    embers(c, w, h, tt, q ? 50 : 14, '#ffc060');
  },
  hero(c, w, h, p, tt, q) {
    sky(c, w, h, '#0c0e18', '#c47a3a', 0.9);
    glow(c, w * 0.5, h * 0.62, h * 0.9, 'rgba(255,200,120,.9)', 0.45 + p * 0.3);
    ridge(c, w, h, h * 0.7, h * 0.2, 1.1, '#201313', 0); ridge(c, w, h, h * 0.86, h * 0.14, 4.4, '#070405', 0);
    const hx = w * 0.5, hy = h * (0.86 - p * 0.02), s = h * 0.2;
    c.fillStyle = '#030202'; c.fillRect(hx - s * 0.18, hy - s * 0.7, s * 0.36, s * 0.7); c.beginPath(); c.arc(hx, hy - s * 0.82, s * 0.16, 0, 7); c.fill();
    c.beginPath(); c.moveTo(hx - s * 0.16, hy - s * 0.66); c.quadraticCurveTo(hx - s * 0.5 + Math.sin(tt * 2) * 6, hy - s * 0.3, hx - s * 0.35, hy); c.lineTo(hx - s * 0.1, hy); c.fill();
    c.fillRect(hx + s * 0.25, hy - s * 1.15, s * 0.045, s * 1.15);
    if (q) embers(c, w, h, tt, 24, '#ffb050');
  },
};

let open = null;

export function playFragman(done, { force = false } = {}) {
  if (open) return;
  if (!force && fragmanSeen()) { done?.(); return; }
  const hq = getGfx().tier !== 'low' && getGfx().tier !== 'min';
  const reduce = !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const el = document.createElement('div'); el.id = 'fragman';
  el.innerHTML = '<canvas></canvas><div class="fbar t"></div><div class="fbar b"></div><div class="fsub"></div><div class="ftitle"><b>Korant Online</b><i></i></div><button class="fskip" type="button"></button>';
  const cv = el.querySelector('canvas'), sub = el.querySelector('.fsub'), ttl = el.querySelector('.ftitle'), skip = el.querySelector('.fskip');
  skip.textContent = t('Geç'); ttl.querySelector('i').textContent = t('Demirin çağrısı').toUpperCase();
  document.body.appendChild(el); requestAnimationFrame(() => el.classList.add('on'));
  try { unlock(); } catch { }
  const ctx = cv.getContext('2d'); let W = 0, H = 0, raf = 0, t0 = 0, last = -1, ended = false, lastFrame = 0, titled = false;
  const size = () => { const sc = hq ? Math.min(window.devicePixelRatio || 1, 1.5) : 0.6; W = cv.width = Math.max(320, Math.round(el.clientWidth * sc)); H = cv.height = Math.max(180, Math.round(el.clientHeight * sc)); };
  size(); addEventListener('resize', size);
  const finish = () => {
    if (ended) return; ended = true; cancelAnimationFrame(raf); removeEventListener('resize', size); LS.set(key(), '1');
    el.classList.remove('on'); setTimeout(() => { el.remove(); open = null; done?.(); }, 600);
  };
  open = { finish };
  skip.addEventListener('click', e => { e.stopPropagation(); finish(); });
  const frame = ts => {
    if (ended) return; raf = requestAnimationFrame(frame);
    if (!t0) t0 = ts; const tt = (ts - t0) / 1000;
    if (tt >= END) return finish();
    if (!hq && ts - lastFrame < 66) return; lastFrame = ts; // Düşük kademe: ~15 kare/sn
    let i = SHOTS.findIndex(s => tt < s[1]); if (i < 0) i = SHOTS.length - 1;
    const [a, b, name, line, snd] = SHOTS[i], p = clamp((tt - a) / (b - a));
    if (i !== last) { last = i; sub.classList.remove('on'); setTimeout(() => { if (!ended) { sub.textContent = t(line); sub.classList.add('on'); } }, 350); try { play(snd); } catch { } }
    if (!titled && tt >= TITLE_AT) { titled = true; ttl.classList.add('on'); sub.classList.remove('on'); try { play('ui.horn'); } catch { } }
    DRAW[name](ctx, W, H, reduce ? 0 : p, tt, hq);
    // vinyet ve çekim geçişlerinde siyaha solma
    const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.4, W / 2, H / 2, W * 0.7); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.6)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    const fadeIn = clamp(1 - (tt - a) / 0.6), out = i === SHOTS.length - 1 ? clamp((tt - (END - 1.2)) / 1.2) : clamp((tt - (b - 0.5)) / 0.5);
    const dark = Math.max(fadeIn, out); if (dark > 0) { ctx.fillStyle = `rgba(0,0,0,${dark})`; ctx.fillRect(0, 0, W, H); }
  };
  raf = requestAnimationFrame(frame);
}

// Ayarlar → Hesap'tan elle izleme
export const replayFragman = () => playFragman(null, { force: true });
