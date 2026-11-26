// P34-02/03/04 (GPT): başkent, Yemin Pazarı ve Klan Obası fotoğraflarının üstünde AYRI hareket katmanı (sancak, şelale, lav,
// duman, tente, meşale alevi). YALNIZ SUNUM: onaylı fotoğraf değişmez; kare 0 fotoğrafın birebir kırpımıdır (screen katmanlarında boş).
// Yerleşim: js/p34-katman-png.js (OTOMATİK, _tasarim/araclar/p34-gom.py). Tuval fotoğrafla aynı kutuyu kaplar (.s2-bg inset 0),
// P33 gün evresi tonu ve zerrelerin ALTINDA, bina etiketlerinin altında; dokunma olayı almaz.
// Çevre animasyonları kapalı (dd_canli='0'), pil tasarrufu, "hareketi azalt" ya da sistemin azaltılmış hareket tercihi açıkken tuval
// kurulmaz (fotoğraf = kare 0). Pencere/iç mekân açıkken ve sekme arka plandayken durur. Çizim en çok 10 kare/sn (katman fps'i).
import { AYAR } from './p33-canli.js';

const DOSYA = { baskent_elentha: 'baskent-elentha', baskent_kragmir: 'baskent-kragmir', yemin_pazari: 'carsi', klan_obasi_elentha: 'klan-elentha', klan_obasi_kragmir: 'klan-kragmir' };
let VERI = null, yukleniyor = null;
const yukle = () => (yukleniyor ||= import('./p34-katman-png.js').then(m => (VERI = m.KATMAN)).catch(() => (VERI = {})));
const SERIT = {}; // sahne → [{ e, img }]
const root = document.documentElement;
const sakin = () => root.classList.contains('motion-less') || !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
let cv = null, ctx = null, kutu = null, sahne = '', raf = 0, son = 0, liste = null;

function sahneOf(k) { const src = k?.querySelector('.s2-bg')?.getAttribute('src') || ''; const m = src.match(/([a-z_]+)\.webp/); return (m && DOSYA[m[1]]) || ''; }
function seritler(s) {
  if (SERIT[s]) return SERIT[s];
  const S = VERI?.[s]; if (!S) return null;
  return (SERIT[s] = S.e.map(e => { const img = new Image(); img.decoding = 'async'; img.src = 'data:image/webp;base64,' + e.s; return { e, img }; }));
}
export function katmanDur() { if (raf) cancelAnimationFrame(raf); raf = 0; }
export function katmanKaldir() { katmanDur(); cv?.remove(); cv = ctx = null; }
function boyut() { if (!cv || !kutu) return; const r = kutu.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1); cv.width = Math.max(1, Math.round(r.width * d)); cv.height = Math.max(1, Math.round(r.height * d)); }
/** p33-canli.js zerreKur'dan çağrılır (aynı yaşam döngüsü). */
export async function katmanKur(k) {
  kutu = k; const s = sahneOf(k);
  if (!k || !s || !AYAR.canli || sakin()) return katmanKaldir();
  if (!VERI) await yukle();
  if (kutu !== k) return; // beklerken sahne değişti
  liste = seritler(s); if (!liste) return katmanKaldir();
  sahne = s;
  if (!cv || !k.contains(cv)) {
    cv?.remove(); cv = document.createElement('canvas'); cv.className = 'p34-katman'; cv.setAttribute('aria-hidden', 'true');
    const bg = k.querySelector('.s2-bg'); bg ? bg.after(cv) : k.prepend(cv); ctx = cv.getContext('2d');
  }
  boyut(); if (!raf) raf = requestAnimationFrame(ciz);
}
function ciz(t) {
  raf = 0;
  if (!cv || !cv.isConnected || !AYAR.canli || sakin()) return;
  raf = requestAnimationFrame(ciz);
  if (document.hidden || document.querySelector('#win:not([hidden]), #p28bina:not([hidden]), .icm')) return;
  if (t - son < (AYAR.pil ? 200 : 100)) return; // katmanlar 10 kare/sn (pil: 5)
  son = t;
  const T = VERI[sahne]?.tuval; if (!T) return;
  const W = cv.width, H = cv.height, sx = W / T[0], sy = H / T[1];
  ctx.clearRect(0, 0, W, H);
  liste.forEach(({ e, img }, i) => {
    if (!img.complete || !img.naturalWidth) return;
    const f = (Math.floor(t / (1000 / (e.fps || 10))) + i * 2) % e.n;
    ctx.globalCompositeOperation = e.m === 'screen' ? 'screen' : 'source-over';
    ctx.drawImage(img, f * e.w, 0, e.w, e.h, e.x * sx, e.y * sy, e.w * sx, e.h * sy);
  });
  ctx.globalCompositeOperation = 'source-over';
}
addEventListener('resize', () => requestAnimationFrame(boyut));
