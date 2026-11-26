// "kaplama" paketi: arayüz kabuğunun küçük davranışları (stiller css/kaplama.css'te). Kural içermez, sunucuya bir şey sormaz.
//  - kök sınıf/öznitelik: düşük grafik kipi (html.gfx-low), günün evresi (html[data-tod]) → kabuğun rengi
//  - sekme değişiminde pencere yeniden "açılmaz", yalnızca sayfa kayarak gelir (win.kp-tabbed)
//  - pencere ve bölüm başlıklarına ikon (başlık sözcüğüne göre; kaplama-parts.js: headIcon)
//  - ana üste akçe ve yakut değişince kısa sayı sayımı; son değer her zaman ana üssün yazdığı (sunucudan gelen) sayıdır
// Hepsi olay geldiğinde çalışır; kare başına iş yalnızca yarım saniyelik sayı sayımı sırasında yapılır.
import { ACT, hud, win, modal, esc, fmt } from './ui-core.js';
import { svg, ri } from './icons.js';
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

// ---- Kül ve Demir görsel paketi (24 Kas): css/kul-demir.css görselleri tek modülde (kd-png.js; tools/kd-paketle.py) ----
let kdProm = null;
/**
 * Kül ve Demir arayüz görsellerini (kd-png.js, WebP base64) bir kez yükler ve `<style id="kd-gorsel">` içine
 * `:root{--kdg-<anahtar>:url(data:image/webp;base64,…)}` yazar; kul-demir.css bu değişkenleri `var(--kdg-…)` ile kullanır.
 * main.js karakter seçimi/oluşturmadan önce bekler (P26 O15; sunucu seçimi kullanmaz). Hata olursa sessizce geçer (oyun görselsiz kabukla açılır).
 * @returns {Promise<number>} yazılan görsel sayısı (hata/boş: 0)
 */
export const kdGorsel = () => (kdProm ||= (async () => {
  try {
    const d = (await import('./kd-png.js')).default || {};
    const st = document.getElementById('kd-gorsel') || Object.assign(document.createElement('style'), { id: 'kd-gorsel' });
    st.textContent = ':root{' + Object.entries(d).map(([k, v]) => `--kdg-${k}:url(data:image/webp;base64,${v})`).join(';') + '}';
    if (!st.isConnected) document.head.appendChild(st);
    return Object.keys(d).length;
  } catch (e) { console.warn('kd-gorsel yüklenemedi', e); return 0; }
})());
// P26 O15: açılışta kendiliğinden inmez; main.js karakter ekranından önce yükletir (sunucu seçimi bu görselleri kullanmaz).

// ---- P24 ekran kiti (24 Kas): iki halk için ortak pencere kabuğu görselleri + ekranların kullandığı görsel yardımcıları ----
// Görseller tek modülde (p24-ekran-png.js, WebP base64; tools/p24-ekran-paketle.py) tembel yüklenir. Kabuk renkleri CSS değişkenleri
// (--k-*) olarak <style id="p24-kit">'e yazılır, ardından html.k24 sınıfı eklenir (css/p24-ekranlar.css yalnız o zaman kitle boyar).
// ?k24=0 kiti kapatır. Ayrıntı: docs/p24-ekran-rehberi.md
let p24Mod = null, p24Prom = null;
/** Paket yüklendiyse anahtarın data URL'si, değilse ''. Ekranlar önce p24Img(...) ile yükletip sonra bunu çağırabilir. */
export const p24ImgSync = key => (p24Mod && p24Mod[key] ? 'data:image/webp;base64,' + p24Mod[key] : '');
/** Paketi (bir kez) yükler; anahtarın data URL'sine çözülür (yoksa ''). Örn: `const u = await p24Img('map_carsi')`. */
export const p24Img = key => (p24Prom ||= import('./p24-ekran-png.js').then(m => (p24Mod = m.default), () => { p24Prom = null; return null; })).then(() => p24ImgSync(key));
const P24_ALIAS = { enerji: 'energy', yakut: 'gem', cevher: 'ore', muhur: 'seal', kor: 'shard_kor', ayaz: 'shard_ayaz', simsek: 'shard_simsek', nisan: 'nisan' };
/**
 * Üst sağ kaynak bandı (pencere başlığında X'in solunda). items: [{ic:'enerji'|'akce'|'yakut'|'cevher'|'san'|'kor'|…, v:değer, t?:başlık}].
 * Dönen HTML `.wres` kabına konur (ui-core pencere başlığı bunu kendisi yazar); stil css/p24-ekranlar.css `.wres > span`, `.p24band > span`.
 */
export const p24Band = items => `<div class="p24band">${(items || []).map(it => `<span class="wx" title="${esc(it.t || '')}">${ri(P24_ALIAS[it.ic] || it.ic)} ${typeof it.v === 'number' ? fmt(it.v) : esc(it.v ?? '')}</span>`).join('')}</div>`;
const K24_OFF = (() => { try { return new URLSearchParams(location.search).get('k24') === '0'; } catch { return false; } })();
const K24_MAP = { frame: 'modal_frame', title: 'title_banner', close: 'btn_close', 'tab-on': 'tab_active', 'tab-off': 'tab_inactive', btn1: 'btn_primary', btn2: 'btn_secondary', 'btn-ok': 'btn_confirm', ring: 'anvil_ring', pill: 'resource_pill', 'crown-b': 'crown_bronze', 'crown-s': 'crown_silver', 'crown-p': 'crown_platinum' };
async function p24Kit() {
  if (K24_OFF) return;
  try {
    await p24Img('k_ocak_modal_frame'); if (!p24Mod) return;
    const u = k => p24ImgSync(k) ? `url(${p24ImgSync(k)})` : 'none';
    const set = (h, tag, card, card2) => `html[data-faction="${h}"]{${Object.entries(K24_MAP).map(([v, n]) => `--k-${v}:${u(`k_${tag}_${n}`)}`).join(';')};--k-card:${u(`k_${tag}_${card}`)};--k-card2:${u(`k_${tag}_${card2}`)}}`;
    const st = document.getElementById('p24-kit') || Object.assign(document.createElement('style'), { id: 'p24-kit' });
    st.textContent = set('ocak', 'ocak', 'card_frame_1', 'card_frame_2') + set('sancak', 'sancak', 'card_frame', 'card_frame');
    if (!st.isConnected) document.head.appendChild(st);
    root.classList.add('k24');
  } catch { /* kit yüklenemedi: eski kabuk kalır */ }
}
// P26 O15: kit (p24-ekran-png.js, 1,9 MB) açılışta değil; ilk pencere/modal/savaş açılınca hemen, başkent ilk kez göründüğünde
// ise ilk kare çizildikten 2 sn sonra (arkada) yüklenir.
let p24Bir = false;
/** P33 (Gemini N4-04): ortak kabuk kitini hemen yükletir; #p28bina (Han, Ahır, Zafer Anıtı) gibi #win/#modal dışı katmanlar çağırır. */
export const p24KitKur = () => { if (!p24Bir) { p24Bir = true; p24Kit(); } };
{
  const bui = document.getElementById('battleUI');
  const kur = p24KitKur;
  const acik = () => !win.hidden || !modal.hidden || (bui && !bui.hidden);
  if (acik()) kur();
  else {
    const mo = new MutationObserver(() => {
      if (acik()) { mo.disconnect(); kur(); } else if (root.dataset.hub2d) setTimeout(() => (window.requestIdleCallback || setTimeout)(kur, { timeout: 4000 }), 6000); // P28 yuk: başkentte ≥6 sn sonra boşta (ilk açılış ölçümüne girmez)
    });
    mo.observe(root, { attributes: true, attributeFilter: ['data-hub2d'] });
    for (const e of [win, modal, bui]) if (e) mo.observe(e, { attributes: true, attributeFilter: ['hidden'] });
  }
}
// Sohbet penceresi açıkken mini sohbet barı gizlenir (css: html.k24-sohbet #chatbar)
{
  const chk = () => root.classList.toggle('k24-sohbet', !win.hidden && /^Sohbet/.test(win.querySelector('.frame > header > h2')?.textContent?.trim() || ''));
  new MutationObserver(chk).observe(win, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden'] });
}
