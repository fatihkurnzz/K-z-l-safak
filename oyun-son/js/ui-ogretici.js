// Yemin Pazarı NPC'leri ve öğreticinin hikâye kısmı: Tüccar Halvor (silah satar), Küçük Bran (kardeşi Nessa'yı Dev Solucan
// yuttu), solucanın karnından çıkan Nessa'nın illüstrasyonu. Kural yok: satış npc.buy, savaş 'worm' modu, adımlar tut.next.
// Çizimler özgün SVG'dir. Stiller css/v9.css (.npc-*, .resc-*).
import { S, act, onState } from './api.js';
import { ACT, hud, esc, fmt, toast, run, showModal, closeModal, openWin, redraw, ico, itemLine, hooks } from './ui-core.js';
import { CLASSES } from '../shared/content.js';
import { TUT_STEPS } from '../shared/meta.js';
import { NPC, merchantStock } from '../shared/npc.js';
import { itemBase, minPlus } from '../shared/items.js';
import { clsOf } from '../shared/roster.js';
import { ri } from './icons.js';
import { npcBas } from './sahne.js';

const step = () => (S?.tut && !S.tut.end ? TUT_STEPS[S.tut.s] : null);
// Çocuk ancak öğreticinin hikâye adımlarında meydanda durur; sonrasında kardeşiyle birlikte görünür
export const childHere = () => ['child', 'worm', 'rescue'].includes(step());

// ---- Portreler (özgün, sade çizimler) ----
export const MERCHANT_SVG = '<svg viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="8" fill="#3a2a14"/><path d="M8 64c3-14 12-19 24-19s21 5 24 19z" fill="#7a2a4a"/><path d="M20 52h24" stroke="#e7c75a" stroke-width="3"/><ellipse cx="32" cy="30" rx="12" ry="13" fill="#d8a878"/><path d="M18 24c2-10 8-14 14-14s12 4 14 14c-4-3-9-4-14-4s-10 1-14 4z" fill="#e8dcc0"/><path d="M18 22h28" stroke="#c9a23a" stroke-width="3"/><circle cx="27" cy="30" r="1.6" fill="#2a1a08"/><circle cx="37" cy="30" r="1.6" fill="#2a1a08"/><path d="M24 37q8 7 16 0" fill="#5a3a20"/><path d="M27 40q5 2 10 0" stroke="#fff" stroke-width="1.2" fill="none"/></svg>';
export const CHILD_SVG = '<svg viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="8" fill="#20304a"/><path d="M12 64c2-11 9-15 20-15s18 4 20 15z" fill="#4a7a3a"/><ellipse cx="32" cy="32" rx="12" ry="13" fill="#e8b88a"/><path d="M19 30c0-11 6-16 13-16s13 5 13 16c-3-5-8-8-13-8s-10 3-13 8z" fill="#6a3a1a"/><circle cx="27" cy="33" r="1.8" fill="#1a1008"/><circle cx="37" cy="33" r="1.8" fill="#1a1008"/><path d="M27 41q5-3 10 0" stroke="#7a3a2a" stroke-width="1.6" fill="none"/><path d="M25 36l-1 4M39 36l1 4" stroke="#7fc8ff" stroke-width="1.6" stroke-linecap="round"/><circle cx="26" cy="37" r="2.2" fill="#ff9a8a" opacity=".5"/><circle cx="38" cy="37" r="2.2" fill="#ff9a8a" opacity=".5"/></svg>';
// 23 Kas (C8): görsel roman diyaloğu (ui-diyalog.js). kim = G4 portre anahtarı; portresi olmayan (Bran) yedek SVG ile çıkar.
// son: [{ t, a, ana }] — eski düğme HTML'i yerine. Satırlarda <b> olabildiği için html: true.
const say = async (svg, name, lines, son, kim = '', unvan = '') => {
  const { diyalog } = await import('./ui-diyalog.js');
  diyalog({ kim, ad: name, unvan, halk: S?.faction === 'ocak' ? 'ocak' : 'sancak', satirlar: lines, son, svg, html: true });
};

// ---- Tüccar ----
ACT.npcMerchant = () => openWin({ title: NPC.merchant.name, render: () => {
  const first = step() === 'merchant' && !S.tut.f.buy;
  const rows = merchantStock(S).filter(x => x.cls === clsOf(S)).map(x => { const B = itemBase(x.b), it = { b: x.b, g: 0, p: minPlus(x.b) }; return `<div class="row npc-ware">${ico(it)}<div class="grow">${itemLine(it)}<br><span class="mut">${CLASSES[x.cls].name} için</span></div><button class="btn ${S.akce >= x.price ? 'green' : ''}" data-a="npcBuy" data-id="${x.id}" ${S.akce >= x.price ? '' : 'disabled'}>${ri('akce')} ${fmt(x.price)}</button></div>`; }).join('');
  return `<div class="npc-head"><div class="npc-por sm">${npcBas('halvor', MERCHANT_SVG)}</div><div><b>${NPC.merchant.name}</b><p>${first ? 'Hoş geldin yolcu! Kestiğin yaratıklardan akçe topladın, değil mi? İlk silahını benden al; sınıfına uygun olanı ayırdım.' : 'Yemin Pazarı’nın en dürüst tezgâhı! Kademene göre sağlam silahlar.'}</p></div><span class="chip rw">${ri('akce')} ${fmt(S.akce)}</span></div>${rows}
    <p class="mut">Tüccar Standart silah satar. Daha iyisi Kapı’nın ardındaki yaratıklardan ve boss’lardan düşer.</p>`;
} });
ACT.npcBuy = async d => {
  const r = await run('npc.buy', { id: d.id });
  if (!r) return;
  toast(`${itemBase(r.b).name} çantana girdi.`);
  if (step() === 'merchant') { ACT.closeWin?.(); setTimeout(() => say(MERCHANT_SVG, NPC.merchant.name, ['Hayırlı olsun! Şimdi onu kahramanına kuşan; çantada duran silah kimseyi korumaz.'], [{ t: 'Tamam', a: 'closeModal', ana: true }], 'halvor', 'Yemin Pazarı tüccarı'), 150); }
  else redraw();
};

// ---- Küçük Bran ve Dev Solucan ----
ACT.npcChild = () => {
  const s = step();
  if (s === 'rescue') return say(CHILD_SVG, NPC.child.name, [`Usta! ${NPC.sibling} burada, yanımda! Solucanın karnından nasıl çıktı hâlâ inanamıyorum.`, 'Yemin Pazarı herkese anlatıyor seni. Al, babamın sakladığı bu keseyi de sen kullan.'], [{ t: 'Rica ederim', a: 'closeModal', ana: true }]);
  if (s === 'child' || s === 'worm') return say(CHILD_SVG, NPC.child.name, ['Usta! Usta, bekle! Yeni silahını gördüm… Yeni silahınla yeni keşiflere gitmen lazım, ama önce bana yardım et!',
    `Kardeşim ${NPC.sibling} değirmenin arkasındaki sazlıkta oynuyordu. Topraktan <b>Dev Solucan</b> çıktı ve onu bir lokmada yuttu!`, 'Hâlâ yaşıyor, biliyorum! Solucanın karnını yararsan kurtulur. Lütfen…'],
    [{ t: 'Birazdan', a: 'closeModal' }, { t: 'Göreve çık', a: 'npcWorm', ana: true }]);
  return say(CHILD_SVG, NPC.child.name, [`Kardeşim ${NPC.sibling} seni hiç unutmayacak, usta!`], [{ t: 'Kendine iyi bak', a: 'closeModal', ana: true }]);
};
ACT.npcWorm = async () => {
  closeModal();
  if (step() === 'child') { try { await act('tut.next', { s: S.tut.s + 1 }); } catch (e) { return toast(e.message); } }
  ACT.wormGo();
};

// ---- Kurtarma illüstrasyonu: solucanın yarılmış karnından çıkan Nessa, ona koşan Bran ----
export const RESCUE_SVG = `<svg viewBox="0 0 400 230" class="resc-art" aria-hidden="true">
  <defs><linearGradient id="rsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffcf8a"/><stop offset=".6" stop-color="#e8946a"/><stop offset="1" stop-color="#7a4a5a"/></linearGradient>
    <radialGradient id="rsun" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff6c8"/><stop offset="1" stop-color="#fff6c8" stop-opacity="0"/></radialGradient></defs>
  <rect width="400" height="230" fill="url(#rsky)"/><circle cx="300" cy="70" r="70" fill="url(#rsun)"/>
  <g class="resc-rays" stroke="#fff6c8" stroke-width="3" opacity=".5">${Array.from({ length: 10 }, (_, i) => `<path d="M300 70 L${300 + Math.cos(i * 0.63) * 160} ${70 + Math.sin(i * 0.63) * 160}"/>`).join('')}</g>
  <path d="M0 150 Q60 130 120 146 T260 140 T400 150 V230 H0Z" fill="#5a6a3a"/><path d="M0 175 Q100 160 200 172 T400 168 V230 H0Z" fill="#3e4f2a"/>
  <g><path d="M30 190 Q40 150 90 150 Q150 148 180 168 Q205 186 236 176" fill="none" stroke="#8a5a4a" stroke-width="38" stroke-linecap="round"/>
    <path d="M30 190 Q40 150 90 150 Q150 148 180 168 Q205 186 236 176" fill="none" stroke="#c99a7a" stroke-width="38" stroke-dasharray="5 16" stroke-linecap="round" opacity=".55"/>
    <ellipse cx="236" cy="174" rx="30" ry="24" fill="#8a5a4a"/><ellipse cx="248" cy="170" rx="13" ry="11" fill="#2a0a0a"/>
    ${Array.from({ length: 7 }, (_, i) => `<path d="M${238 + Math.cos(i * 0.9) * 13} ${170 + Math.sin(i * 0.9) * 11} l${Math.cos(i * 0.9) * 6} ${Math.sin(i * 0.9) * 6}" stroke="#f1e6c8" stroke-width="3"/>`).join('')}
    <path d="M112 152 Q122 120 140 152Z" fill="#5a1a1a"/><path d="M110 152 Q124 128 142 152" fill="none" stroke="#f0d8b8" stroke-width="3"/>
    <circle cx="70" cy="196" r="3" fill="#2a0a0a"/></g>
  <g class="resc-girl"><path d="M120 150 Q118 128 126 116" stroke="#e8b88a" stroke-width="6" stroke-linecap="round" fill="none"/>
    <path d="M118 150 L126 112 L136 112 L140 150Z" fill="#c84a6a"/><circle cx="131" cy="102" r="10" fill="#e8b88a"/><path d="M121 100 Q131 86 141 100 Q140 92 131 90 Q122 92 121 100Z" fill="#3a1a0a"/>
    <path d="M136 120 Q150 108 156 96" stroke="#e8b88a" stroke-width="6" stroke-linecap="round" fill="none"/><circle cx="127" cy="102" r="1.4" fill="#1a0a04"/><circle cx="135" cy="102" r="1.4" fill="#1a0a04"/><path d="M127 107 Q131 110 135 107" stroke="#7a3a2a" stroke-width="1.4" fill="none"/>
    <path d="M118 130 q-6 6 -2 14 M140 128 q6 8 2 16" stroke="#a8d870" stroke-width="3" fill="none" opacity=".8"/></g>
  <g class="resc-boy"><path d="M190 196 L196 160 L208 160 L212 196Z" fill="#4a7a3a"/><circle cx="202" cy="150" r="10" fill="#e8b88a"/><path d="M192 148 Q202 134 212 148 Q208 140 202 139 Q195 140 192 148Z" fill="#6a3a1a"/>
    <path d="M196 168 Q178 158 166 140" stroke="#e8b88a" stroke-width="6" stroke-linecap="round" fill="none"/><path d="M208 170 l10 18 M200 196 l-6 16 M210 196 l8 16" stroke="#3a2a1a" stroke-width="5" stroke-linecap="round"/>
    <circle cx="198" cy="150" r="1.4" fill="#1a0a04"/><circle cx="206" cy="150" r="1.4" fill="#1a0a04"/><path d="M197 155 Q202 160 207 155" stroke="#7a3a2a" stroke-width="1.6" fill="#fff"/></g>
  <g class="resc-stars" fill="#fff6c8">${[[150, 80], [170, 62], [110, 70], [92, 96], [184, 90]].map(([x, y]) => `<path d="M${x} ${y - 6} l2 4 4 2 -4 2 -2 4 -2 -4 -4 -2 4 -2z"/>`).join('')}</g>
</svg>`;
// Öğretici katmanı (ui-kalicilik.js) solucan yenilince bu kartı gösterir
export const rescueCard = () => `<div class="tscrim"></div><div class="tcard resc"><h2>${NPC.sibling} kurtuldu!</h2><div class="tin">${RESCUE_SVG}
  <p>Dev Solucan son kez kıvranıp yere serildi. Yarılan karnından önce minik bir el, sonra sırılsıklam ama gülümseyen ${NPC.sibling} çıktı. ${NPC.child.name} sazlığın içinden koşarak kardeşine sarıldı.</p>
  <div class="tb"><button class="btn red" data-t="rescue">Onları Yemin Pazarı’na götür</button></div></div></div>`;
hooks.childHere = childHere;
// Çocuğun meydanda olup olmadığı değişince (öğretici adımı) Yemin Pazarı yeniden kurulur: Bran gelir ya da kardeşiyle gider
let wasChild = null;
onState(() => { const c = childHere(); if (wasChild !== null && c !== wasChild && document.documentElement.dataset.place === 'carsi' && !hud.hidden) setTimeout(() => ACT.hub?.(), 0); wasChild = c; });
// Adım, meydan gizliyken (pencere/savaş) değiştiyse Bran'ın etiketi sahnesiz kalır (ui-hub gizler): meydan görününce kur
setInterval(() => { if (document.documentElement.dataset.place === 'carsi' && !hud.hidden && document.getElementById('win').hidden && document.getElementById('modal').hidden && hud.querySelector('.blabel[data-id="child"][style*="display: none"]')) ACT.hub?.(); }, 600);
