// Klan sancağı ve pelerininin çizimi: 2B sancak (SVG), pelerin önizlemesi (SVG) ve 3B pelerinin kumaş dokusu (tuval).
// Renkler ve amblem kimlikleri shared/clan.js tablolarından, amblem şekilleri emblems.js'ten (game-icons.net) gelir.
import { BANNER_PAIRS, CAPE_COLORS, CAPE_STEPS, EMBLEMS, validBanner } from '../shared/clan.js';
import { EMBLEM_PATHS } from './emblems.js';

const ok = b => validBanner(b) && !!EMBLEM_PATHS[b.s];
// Sancak: sivri uçlu flama, zemin + desen renginde iç kenar + amblem. cls: 'xs' | 'sm' | 'md' | 'lg' (klan.css)
export function bannerSvg(b, cls = 'sm') {
  if (!ok(b)) return '';
  const [bg, fg] = BANNER_PAIRS[b.a];
  return `<svg class="bnr ${cls}" viewBox="0 0 64 80" role="img" aria-label="${EMBLEMS[b.s]} sancağı"><path d="M5 3h54v54L32 77 5 57z" fill="${bg}" stroke="#1a1208" stroke-width="3" stroke-linejoin="round"/><path d="M10.5 8.5h43v45.5L32 70 10.5 54z" fill="none" stroke="${fg}" stroke-width="1.8" opacity=".8"/><path transform="translate(15 12) scale(.0664)" d="${EMBLEM_PATHS[b.s]}" fill="${fg}"/></svg>`;
}
// Tek başına amblem (seçim ızgarası)
export const emblemSvg = (id, color = 'currentColor') => (EMBLEM_PATHS[id] ? `<svg viewBox="0 0 512 512" aria-hidden="true"><path d="${EMBLEM_PATHS[id]}" fill="${color}"/></svg>` : '');
// Pelerin önizlemesi: omuzdan sarkan kumaş, boyu basamağa göre; sırtta sancak arması. cape: { c, a, s, l }
export function capeSvg(cape, cls = '') {
  if (!cape || !ok({ a: cape.a, s: cape.s, c: cape.c })) return '';
  const [bg, fg] = BANNER_PAIRS[cape.a], col = CAPE_COLORS[cape.c], len = CAPE_STEPS[cape.l]?.len ?? CAPE_STEPS[0].len;
  const top = 26, floor = 112, y = Math.min(floor, top + len * 82), sweep = Math.max(0, top + len * 82 - floor); // yere değen kısım geriye yayılır
  const half = 15 + 9 * Math.min(1, len), r = Math.min(11, 5 + len * 9), cy = top + Math.min(len * 82 * 0.5, 30) + 2;
  return `<svg class="capev ${cls}" viewBox="0 0 80 120" role="img" aria-label="${CAPE_STEPS[cape.l]?.name || 'Pelerin'}">
    <ellipse cx="40" cy="113" rx="26" ry="4" fill="#0003"/>
    <circle cx="40" cy="12" r="8" fill="#5a4a3a"/><path d="M22 24c6-5 30-5 36 0l3 34H19z" fill="#5a4a3a"/><path d="M30 58h8v52h-8zM42 58h8v52h-8z" fill="#4a3c2e"/>
    <path d="M24 ${top}h32l${half - 16} ${y - top}${sweep ? `q${4 + sweep * 0.6} 3 ${8 + sweep} 5h-${2 * half + 16 + 2 * sweep}q${4 + sweep * 0.4}-2 ${8 + sweep}-5` : `h-${2 * half}`}z" fill="${col}" stroke="#1a1208" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M26 ${top + 2}h28" stroke="${fg}" stroke-width="2"/>
    <circle cx="40" cy="${cy}" r="${r}" fill="${bg}" stroke="${fg}" stroke-width="1"/><path transform="translate(${40 - r * 0.72} ${cy - r * 0.72}) scale(${r * 1.44 / 512})" d="${EMBLEM_PATHS[cape.s]}" fill="${fg}"/>
  </svg>`;
}

// 3B pelerinin dokusu: pelerin renginde kumaş, desen renginde kenar şeridi, sırtta sancak zeminli yuvarlak arma.
// w/h: tuval ölçüsü (pelerinin en/boy oranında). Dönen tuval CanvasTexture'a verilir (models.js).
export function drawCape(cape, w, h) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const g = cv.getContext('2d'), [bg, fg] = BANNER_PAIRS[cape.a] || BANNER_PAIRS[0], col = CAPE_COLORS[cape.c] || CAPE_COLORS[0];
  g.fillStyle = col; g.fillRect(0, 0, w, h);
  // kumaş: boyuna hafif kıvrım gölgeleri ve aşağı doğru koyulaşma
  const shade = g.createLinearGradient(0, 0, 0, h); shade.addColorStop(0, '#ffffff18'); shade.addColorStop(1, '#00000038');
  g.fillStyle = shade; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 7; i++) { const x = (i + 0.5) * w / 7, f = g.createLinearGradient(x - w / 14, 0, x + w / 14, 0); f.addColorStop(0, '#00000022'); f.addColorStop(0.5, '#ffffff14'); f.addColorStop(1, '#00000022'); g.fillStyle = f; g.fillRect(x - w / 14, 0, w / 7, h); }
  // kenar şeridi (yanlar ve etek)
  const bw = Math.max(4, w * 0.045);
  g.fillStyle = fg; g.fillRect(0, 0, bw, h); g.fillRect(w - bw, 0, bw, h); g.fillRect(0, h - bw * 1.4, w, bw * 1.4); g.fillRect(0, 0, w, bw * 0.8);
  g.fillStyle = '#00000030'; g.fillRect(bw, 0, 2, h - bw * 1.4); g.fillRect(w - bw - 2, 0, 2, h - bw * 1.4); g.fillRect(bw, h - bw * 1.4 - 2, w - 2 * bw, 2);
  // arma: kısa pelerinde boya göre küçülür
  const r = Math.min(w * 0.33, h * 0.4), cx = w / 2, cy = Math.min(h * 0.5, bw + r * 1.25);
  g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fillStyle = bg; g.fill(); g.lineWidth = Math.max(2, r * 0.09); g.strokeStyle = fg; g.stroke();
  const d = EMBLEM_PATHS[cape.s];
  if (d && typeof Path2D === 'function') { const k = r * 1.42 / 512; g.save(); g.translate(cx - 256 * k, cy - 256 * k); g.scale(k, k); g.fillStyle = fg; g.fill(new Path2D(d)); g.restore(); }
  return cv;
}
// Klan Karargâhı'nın direğindeki sancak (3B): düz dikdörtgen bez, zemin + desen renginde kenar + amblem
export function drawBanner(b, w = 160, h = 120) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const g = cv.getContext('2d'), [bg, fg] = BANNER_PAIRS[b.a] || BANNER_PAIRS[0], d = EMBLEM_PATHS[b.s];
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.strokeStyle = fg; g.lineWidth = Math.max(3, h * 0.05); g.strokeRect(g.lineWidth, g.lineWidth, w - 2 * g.lineWidth, h - 2 * g.lineWidth);
  if (d && typeof Path2D === 'function') { const k = h * 0.66 / 512; g.save(); g.translate(w / 2 - 256 * k, h / 2 - 256 * k); g.scale(k, k); g.fillStyle = fg; g.fill(new Path2D(d)); g.restore(); }
  return cv;
}
export const capeColorHex = cape => CAPE_COLORS[cape?.c] || CAPE_COLORS[0];
