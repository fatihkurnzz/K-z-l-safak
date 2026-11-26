// 23 Kas (görev C8, Gemini M4 diyalog maketi + GPT G4 portreleri): görsel roman düzeninde NPC konuşması.
// Solda belden yukarı boyalı portre (ekranın %40'ı), altta tam genişlik metin şeridi, ad levhası, "İleri" düğmesi.
// Satırlar sayfa sayfa gösterilir; son sayfada çağıranın düğmeleri (data-a) çıkar. #modal içinde açılır: bildirim kuyruğu
// (ui-duyuru.js) ve hayalet tıklama koruması pencerelerle aynı çalışır. Kural içermez; yalnız sunum.
import { ACT, showModal, closeModal } from './ui-core.js';

import { gorselYukle, npcYuz } from './sahne.js'; // G4 portreleri gorsel-png.js içinde
export { npcYuz };
let P = null;
const npcPng = () => gorselYukle().then(m => (P = m));

const esc = t => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const D = { s: null, i: 0 };

// kim: gorsel-png NPC anahtarı (lira, corin, maelis, halvor, thrak, yashka, edran, volgar) · ad, unvan: levha · halk: 'sancak' | 'ocak'
// satirlar: dizi (HTML değil, düz metin; <b> gerekirse html: true) · son: [{ t: 'Destan', a: 'gateDestan', ana: true }] · svg: portre yoksa yedek çizim
export async function diyalog({ kim, ad, unvan = '', halk = 'sancak', satirlar = [], son = [], svg = '', html = false }) {
  await npcPng();
  D.s = { kim, ad, unvan, halk, satirlar: satirlar.length ? satirlar : [''], son, svg, html }; D.i = 0;
  ciz(true);
}
function ciz(ilk) {
  const s = D.s; if (!s) return;
  const n = s.satirlar.length, son = D.i >= n - 1, por = P?.url(s.kim);
  const metin = s.html ? s.satirlar[D.i] : esc(s.satirlar[D.i]);
  const dug = son
    ? (s.son.length ? s.son : [{ t: 'Tamam', a: 'closeModal', ana: true }]).map(b => `<button class="btn dlg-b ${b.ana ? 'ana' : ''}" data-a="${b.a}"${b.d ? Object.entries(b.d).map(([k, v]) => ` data-${k}="${esc(v)}"`).join('') : ''}>${esc(b.t)}</button>`).join('')
    : '<button class="btn dlg-b ana" data-a="dlgNext">İleri <i aria-hidden="true">›</i></button>';
  const body = `<div class="dlg" data-h="${s.halk === 'ocak' ? 'ocak' : 'sancak'}">
    <div class="dlg-por">${por ? `<img src="${por}" alt="${esc(s.ad)}" draggable="false">` : s.svg}</div>
    <div class="dlg-serit" data-a="dlgNext"></div>
    <div class="dlg-ad"><b>${esc(s.ad)}</b>${s.unvan ? `<small>${esc(s.unvan)}</small>` : ''}</div>
    <p class="dlg-txt" data-a="dlgNext">${metin}</p>
    ${n > 1 ? `<span class="dlg-say">${D.i + 1} / ${n}</span>` : ''}
    <div class="dlg-btns">${dug}</div></div>`;
  if (ilk) showModal(body, 'dlgbox');
  else { const box = document.querySelector('#modal .box.dlgbox'); if (!box) return showModal(body, 'dlgbox'); box.querySelector('.dlg').outerHTML = body; }
  if (por) canlan(s.kim, por, String(s.satirlar[D.i] || '').replace(/<[^>]+>/g, '').length);
}

// ---- P34-05 (Gemini): G4 portrelerinde göz kırpma ve konuşma kareleri (yalnız sunum) ----
// js/npc-kare-png.js yalnız değişen bölgenin kırpımını taşır; tam kare burada asıl portrenin üstüne çizilip Blob URL olarak saklanır.
// Göz: 2,5–6 sn'de bir yarı → kapalı → yarı → açık. Konuşma: yeni satır gelince satır uzunluğuyla orantılı (≤ 2,4 sn) ağız aç/kapa.
// Hareketi azalt, pil tasarrufu ve sistemin "azaltılmış hareket" tercihi açıkken çalışmaz (asıl portre durur).
let KR = null; const KU = {};
const krYukle = () => (KR ||= import('./npc-kare-png.js').then(m => m.K || {}).catch(() => ({})));
const sakin = () => { const c = document.documentElement.classList; return c.contains('motion-less') || c.contains('p33-pil') || !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches; };
const resim = src => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; });
async function kareUrl(kim, por) {
  if (KU[kim]) return KU[kim];
  const K = (await krYukle())[kim]; if (!K) return (KU[kim] = null);
  const t = await resim(por), out = { '': por };
  for (const [ad, [x, y, w, h, b64]] of Object.entries(K)) {
    const c = document.createElement('canvas'); c.width = t.naturalWidth; c.height = t.naturalHeight; const g = c.getContext('2d');
    g.drawImage(t, 0, 0); g.clearRect(x, y, w, h); g.drawImage(await resim('data:image/webp;base64,' + b64), x, y);
    out[ad] = await new Promise(ok => c.toBlob(b => ok(b ? URL.createObjectURL(b) : por), 'image/webp', 0.92));
  }
  return (KU[kim] = out);
}
const Z = { g: 0, k: 0 };
function durdur() { clearTimeout(Z.g); clearInterval(Z.k); Z.g = Z.k = 0; }
async function canlan(kim, por, uzunluk) {
  durdur(); if (sakin()) return;
  const U = await kareUrl(kim, por).catch(() => null); if (!U || D.s?.kim !== kim) return;
  const img = () => { const i = document.querySelector('#modal .dlg-por img'); return i && D.s?.kim === kim ? i : null; };
  const goster = ad => { const i = img(); if (!i) { durdur(); return false; } const u = U[ad] || U['']; if (i.getAttribute('src') !== u) i.src = u; return true; };
  for (const u of Object.values(U)) { const p = new Image(); p.src = u; } // önbelleğe al: değişim titremesin
  let konusma = Math.min(2400, 300 + uzunluk * 35), acik = false;
  if (U['agiz-acik']) Z.k = setInterval(() => { konusma -= 130; acik = konusma > 0 && !acik; if (!goster(acik ? (U['agiz-yari'] && Math.random() < .35 ? 'agiz-yari' : 'agiz-acik') : '')) return; if (konusma <= 0) { clearInterval(Z.k); Z.k = 0; } }, 130);
  const kirp = () => { Z.g = setTimeout(() => { if (Z.k) return kirp(); const s = [['goz-yari', 60], ['goz-kapali', 90], ['goz-yari', 60], ['', 0]]; let i = 0;
    const adim = () => { if (!goster(s[i][0])) return; const d = s[i][1]; i++; if (i < s.length) Z.g = setTimeout(adim, d); else kirp(); }; adim(); }, 2500 + Math.random() * 3500); };
  if (U['goz-kapali']) kirp();
}
ACT.dlgNext = () => { if (!D.s) return; if (D.i < D.s.satirlar.length - 1) { D.i++; ciz(false); } };
ACT.dlgClose = () => { D.s = null; durdur(); closeModal(); };
