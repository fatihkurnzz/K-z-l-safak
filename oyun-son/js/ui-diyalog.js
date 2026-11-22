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
}
ACT.dlgNext = () => { if (!D.s) return; if (D.i < D.s.satirlar.length - 1) { D.i++; ciz(false); } };
ACT.dlgClose = () => { D.s = null; closeModal(); };
