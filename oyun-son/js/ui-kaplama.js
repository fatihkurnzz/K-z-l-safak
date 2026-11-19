// "kaplama" paketi: arayüz kabuğunun küçük davranışları (stiller css/kaplama.css'te). Kural içermez, sunucuya bir şey sormaz.
//  - kök sınıf/öznitelik: düşük grafik kipi (html.gfx-low), günün evresi (html[data-tod]) → kabuğun rengi
//  - sekme değişiminde pencere yeniden "açılmaz", yalnızca sayfa kayarak gelir (win.kp-tabbed)
//  - pencere ve bölüm başlıklarına ikon (başlık sözcüğüne göre; kaplama-parts.js: headIcon)
//  - ana üste akçe ve yakut değişince kısa sayı sayımı; son değer her zaman ana üssün yazdığı (sunucudan gelen) sayıdır
// Hepsi olay geldiğinde çalışır; kare başına iş yalnızca yarım saniyelik sayı sayımı sırasında yapılır.
import { ACT, hud, win, modal } from './ui-core.js';
import { svg } from './icons.js';
import { phaseNow } from './daylight.js';
import { gfx, onTier } from './gfx.js';
import { headIcon, parseNum, tweenNum, fmtNum } from './kaplama-parts.js';

const root = document.documentElement;
// Düşük grafik kademesi (gfx.js: oyuncunun seçimi, otomatik seçim ya da denetçinin indirmesi) kabuğun hareketlerini de kapatır
root.classList.toggle('gfx-low', gfx.tier === 'low' || gfx.tier === 'min');
onTier(t => root.classList.toggle('gfx-low', t === 'low' || t === 'min'));
const calm = () => root.classList.contains('gfx-low') || !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// ---- günün evresi: dawn | day | dusk | night ----
const setTod = () => { const p = phaseNow(); if (root.dataset.tod !== p) root.dataset.tod = p; };
setTod(); setInterval(setTod, 20000);

// ---- sekme değişimi ----
const tab0 = ACT.tab;
ACT.tab = (d, b) => { tab0(d, b); win.classList.add('kp-tabbed'); };

// ---- bölüm başlıklarına ikon ----
const HEADS = '.frame > header > h2:not([data-kp]), .page > h3:not([data-kp]), .pside > h3:not([data-kp]), .page p.sec:not([data-kp]), .in > h3:not([data-kp]), .pv-cols h3:not([data-kp])';
function decorate(box) {
  for (const h of box.querySelectorAll(HEADS)) {
    h.dataset.kp = '1';
    let own = '';
    for (const n of h.childNodes) { if (n.nodeType === 3) own += n.nodeValue; else if (own.trim()) break; else if (n.nodeName !== 'SPAN' || !n.classList.contains('mut')) own += n.textContent; } // başlığın kendi sözü (yanındaki soluk açıklama değil)
    const k = headIcon(window.DD_I18N?.srcText?.(h) || own); // ikon, başlığın Türkçe aslına göre seçilir (çevrilmiş başlıkta da)
    if (k) h.insertAdjacentHTML('afterbegin', `<i class="kp-hi">${svg(k)}</i>`);
  }
}
let due = false;
const later = () => { if (due) return; due = true; queueMicrotask(() => { due = false; if (!win.hidden) decorate(win); if (!modal.hidden) decorate(modal); }); };
new MutationObserver(later).observe(win, { childList: true, subtree: true });
new MutationObserver(later).observe(modal, { childList: true, subtree: true });

// ---- kaynak sayımı (ana üs: akçe, yakut) ----
// last: ana üssün en son yazdığı gerçek değer. tween: süren sayım ({ t: şerit, from, to, text: bitince yazılacak özgün metin,
// shown: bu modülün son yazdığı metin }). Ana üs sayım sırasında yeniden çizilirse (metin "shown" değilse) hedef yenilenir.
const WATCH = ['Akçe', 'Yakut'], last = {};
let tween = null;
const pillB = t => hud.querySelector(`.res .pill[title="${t}"] b`);
function step(ts) {
  const T = tween; if (!T) return;
  const el = pillB(T.t); if (!el || hud.hidden) { tween = null; return; }
  const k = (ts - T.t0) / 450;
  T.shown = k >= 1 ? T.text : fmtNum(tweenNum(T.from, T.to, k));
  if (el.textContent !== T.shown) el.textContent = T.shown;
  if (k >= 1) { tween = null; return; }
  requestAnimationFrame(step);
}
function scan() {
  if (hud.hidden) return;
  for (const t of WATCH) {
    const el = pillB(t); if (!el) continue;
    const text = el.textContent;
    if (tween?.t === t && text === tween.shown) continue; // kendi yazdığımız ara değer
    const n = parseNum(text); if (n === null) continue;
    const was = last[t]; last[t] = n;
    if (tween?.t === t) { if (n !== tween.to) { tween.from = parseNum(tween.shown) ?? was; tween.to = n; tween.t0 = performance.now(); } tween.text = text; continue; }
    if (was === undefined || was === n || tween || calm()) continue;
    tween = { t, from: was, to: n, text, shown: text, t0: performance.now() };
    const pill = el.closest('.pill'); pill.classList.add('kp-bump'); setTimeout(() => pill.classList.remove('kp-bump'), 520);
    requestAnimationFrame(step);
  }
}
new MutationObserver(scan).observe(hud, { childList: true, subtree: true, characterData: true });
