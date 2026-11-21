// İksir simgeleri (özgün, sade SVG): Can iksiri kırmızı, Mana iksiri mavi. Savaş çubuğu, Tüccar ve Rehber kullanır.
const COL = { hp: ['#ff6a5a', '#b3221a'], mp: ['#6ab8ff', '#1f4fb3'] };
// GPT Paket 2 (21 Kas): çizilmiş iksir simgesi (js/esya-png.js); yüklenemezse eski SVG
import { esyaUrl } from './esya-png.js';
export const potSvg = k => { const u = esyaUrl(k === 'mp' ? 'iksir-mana' : 'iksir-can'); return u ? `<img class="potsvg gpng" src="${u}" alt="" draggable="false">` : potSvg0(k); };
const potSvg0 = k => { const [a, b] = COL[k] || COL.hp; return `<svg viewBox="0 0 32 32" class="potsvg" aria-hidden="true"><path d="M12 3h8v3h-1v5.2c4.2 1.5 7 5.3 7 9.8 0 5.8-4.7 9-10 9s-10-3.2-10-9c0-4.5 2.8-8.3 7-9.8V6h-1z" fill="#e9e4d4" stroke="#3a2a14" stroke-width="1.4"/><path d="M8 20.5c0-1.3.3-2.5.8-3.5h14.4c.5 1 .8 2.2.8 3.5 0 4.6-3.6 7.5-8 7.5s-8-2.9-8-7.5z" fill="${a}"/><path d="M8.4 22.5c.9 3.3 3.9 5.5 7.6 5.5s6.7-2.2 7.6-5.5z" fill="${b}"/><path d="M11 19.2c1.6-.8 2.6-.4 3.4.4" stroke="#fff" stroke-width="1.6" stroke-linecap="round" fill="none" opacity=".8"/><rect x="11.5" y="2" width="9" height="3" rx="1" fill="#8a5a2a" stroke="#3a2a14"/></svg>`; };
