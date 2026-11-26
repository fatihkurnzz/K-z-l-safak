// P28 Ahır arayüzü (şartname docs/referans/p28-ahir-han-anit/TALIMAT.md §3.4) ve üç P28 binasının ortak tam ekran katmanı.
// Kurallar game/shared/ahir.js'tedir; bu dosya yalnız gösterir ve eylem gönderir (ahir.unlock / ahir.equip / ahir.feed).
// Katman #modal kullanmaz: eski `#modal .box` kurallarının !important boyut/zemin kuralları kök sınıfları ezerdi.
// Görseller (arka plan, portreler) yalnız katman açılınca DOM'a girer; başkent açılışında inmez.
import { ACT, esc, fmt, run, toast, hooks } from './ui-core.js';
import { S, now } from './api.js';
import { ri } from './icons.js';
import { dayKey } from '../shared/content.js';
import { icmKur, icmBinaKapat, gozHtml, icmSoz } from './ic-mekan.js';
import { p24KitKur } from './ui-kaplama.js'; // P33: ortak kabuk kiti (çerçeve, başlık, kapat) bu katmanda da yüklensin
import { COMPANIONS, MAX_LV, FEEDS_PER_DAY, FEED_XP, feedCost, xpNeed, statsAt } from '../shared/ahir.js';

// ---------- Ortak tam ekran katmanı (Ahır, Han, Zafer Anıtı) ----------
let ov = null, onClose = null;
// P30: Han ve Ahır iç mekân sahnesiyle açılır (js/ic-mekan.js). P33 (Gemini N4-01): Zafer Anıtı da onaylı sahnesiyle.
const IC_TUR = { 'korant-modal-tavern': 'han', 'korant-modal-stable': 'ahir', 'korant-modal-monument': 'zafer' };
const kapatHtml = () => `${ov?.classList.contains('icm-var') ? gozHtml : ''}<button class="kb-x" data-a="binaKapat" aria-label="Kapat" title="Kapat">×</button>`;
/** Tam ekran bina katmanını açar. cls: kök sınıf (korant-modal-stable|tavern|monument); title: erişilebilir ad;
 *  head: üst bar HTML'i (× düğmesi otomatik eklenir); body: içerik; closeFn: kapanınca çağrılır (zamanlayıcı temizliği). */
export function binaAc(cls, title, head, body, closeFn) {
  binaKapat();
  ov = document.createElement('div');
  ov.id = 'p28bina'; ov.className = 'korant-modal ' + cls;
  ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', title);
  ov.innerHTML = '<div class="kb-bg" aria-hidden="true"></div><div class="kb-pan" aria-hidden="true"></div><header class="kb-top"></header><div class="kb-body"></div>';
  if (IC_TUR[cls] && !document.documentElement.classList.contains('icm-yok')) icmKur(ov, IC_TUR[cls], ov.firstChild);
  ov.querySelector('.kb-top').innerHTML = head + kapatHtml(); ov.querySelector('.kb-body').innerHTML = body;
  ov.addEventListener('click', e => { const b = e.target.closest('[data-a]'); if (b && ov?.contains(b) && !b.disabled) { ACT[b.dataset.a]?.(b.dataset, b); hooks.sfx?.('tap', b.dataset.a); } });
  const g = document.getElementById('game') || document.body, t = document.getElementById('toast');
  t && t.parentNode === g ? g.insertBefore(ov, t) : g.appendChild(ov);
  onClose = closeFn || null;
  hooks.sfx?.('modal', cls);
  p24KitKur();
  ov.querySelector('.kb-x')?.focus({ preventScroll: true });
}
/** Açık bina katmanının üst barını ve içeriğini yeniden çizer (kaydırma konumu korunur). */
export function binaCiz(head, body) {
  if (!ov) return;
  const bd = ov.querySelector('.kb-body'), y = bd.scrollTop, x = bd.scrollLeft;
  if (head != null) ov.querySelector('.kb-top').innerHTML = head + kapatHtml();
  bd.innerHTML = body; bd.scrollTop = y; bd.scrollLeft = x;
}
/** Bina katmanını kapatır; kapanış işlevi (zamanlayıcı temizliği) çalışır, başkent HUD'u yeniden çizilir. */
export function binaKapat() {
  if (!ov) return;
  const f = onClose; onClose = null; icmBinaKapat(ov); ov.remove(); ov = null;
  try { f?.(); } catch { /* temizlik hatası kapanışı durdurmaz */ }
  hooks.sfx?.('modalClose'); hooks.hud();
}
/** Hangi bina açık: kök sınıf ya da null. */
// P34 düzeltme (P33 gerilemesi): iç mekân kabuğu kök öğeye 'icm-var' sınıfı ekleyince className karşılaştırması tutmuyordu →
// Han/Ahır işlem sonrası yeniden çizilmiyor, Zafer Anıtı 'Yükleniyor…'da kalıyordu. Artık yalnız korant-modal-* sınıfı döner.
export const binaAcik = () => (ov ? [...ov.classList].find(c => c.startsWith('korant-modal-')) || null : null);
ACT.binaKapat = binaKapat;
// Esc ve geri: katman açıksa yalnız onu kapatır (alttaki pencere/modal açık kalır)
window.addEventListener('keydown', e => { if (ov && e.key === 'Escape') { e.stopImmediatePropagation(); binaKapat(); } }, true);
window.addEventListener('popstate', e => { if (ov) { e.stopImmediatePropagation(); binaKapat(); } }, true);

/** Üst bar kaynak kapsülü. */
export const kbRes = (kind, label, val) => `<span class="kb-res" title="${label}">${ri(kind)}<b>${val}</b></span>`;
const yuzde = v => '%' + String(v).replace('.', ',');

// ---------- Ahır ----------
const STAT = [['hp', 'Can', v => '+' + fmt(v)], ['atkPct', 'Saldırı', yuzde], ['defPct', 'Savunma', yuzde], ['critPct', 'Kritik', yuzde]];
const feedsToday = () => (S.ahir?.feedDay === dayKey(now()) ? S.ahir.feeds || 0 : 0);
/** Kendi halkının yoldaşları (COMPANIONS sırasıyla). */
const mine = () => Object.entries(COMPANIONS).filter(([, C]) => C.faction === S.faction);

function statsHtml(id, lv, owned) {
  const C = COMPANIONS[id], cur = statsAt(id, lv), nx = owned && lv < MAX_LV ? statsAt(id, lv + 1) : null;
  return `<ul class="ka-st">${STAT.filter(([k]) => C.base[k] || C.perLv[k]).map(([k, n, f]) => `<li><span>${n}</span><b>${f(cur[k])}</b>${nx && nx[k] !== cur[k] ? `<i>→ ${f(nx[k])}</i>` : ''}</li>`).join('')}</ul>`;
}
function cardHtml([id, C]) {
  const o = S.ahir?.own?.[id], act = S.ahir?.active === id, lv = o?.lv || 1, feeds = feedsToday(), max = lv >= MAX_LV;
  const lockLv = !o && S.lvl < C.lvReq;
  let btns;
  if (!o) {
    btns = lockLv
      ? `<button class="kb-btn ka-lock" disabled aria-label="Kilitli: Sv. ${C.lvReq}"><i class="ka-kilit" aria-hidden="true"></i>Sv. ${C.lvReq} · ${fmt(C.cost.akce)} Akçe</button>`
      : `<button class="kb-btn gold" data-a="ahirAc" data-id="${id}" data-pay="akce">Aç · ${fmt(C.cost.akce)} Akçe</button>${C.cost.yakut ? `<button class="kb-btn ka-yk" data-a="ahirAc" data-id="${id}" data-pay="yakut">Aç · ${fmt(C.cost.yakut)} Yakut</button>` : ''}`;
  } else {
    btns = `<button class="kb-btn ${act ? 'on' : 'gold'}" data-a="ahirKusan" data-id="${id}" aria-pressed="${act}">${act ? 'Aktif' : 'Kuşan'}</button>`
      + `<button class="kb-btn" data-a="ahirBesle" data-id="${id}" ${max || feeds >= FEEDS_PER_DAY ? 'disabled' : ''}>${max ? 'En üst seviye' : `Besle (${feeds}/${FEEDS_PER_DAY}) · ${fmt(feedCost(lv))} Akçe`}</button>`;
  }
  const need = xpNeed(lv), xp = o ? (max ? 100 : Math.min(100, 100 * (o.xp || 0) / need)) : 0;
  return `<article class="ka-card${act ? ' act' : ''}${o ? '' : ' kapali'}${lockLv ? ' kilit' : ''}">
    <div class="ka-top"><div class="ka-por"><img src="${C.img}" alt="${esc(C.name)}" width="512" height="512" decoding="async"><em class="ka-lv">${o ? `Sv. ${lv}` : `Sv. ${C.lvReq}+`}</em></div>
    <div class="ka-inf"><h3>${esc(C.name)}</h3>${statsHtml(id, lv, !!o)}</div></div>
    <p class="ka-sk">${esc(C.skill.desc)}</p>
    <div class="ka-xp" title="Yoldaş deneyimi"><span><i style="width:${xp}%"></i></span><small>${o ? (max ? 'En üst seviye' : `${o.xp || 0} / ${need} XP`) : 'Açılmadı'}</small></div>
    <div class="ka-bt">${btns}</div>
  </article>`;
}
const ahirHead = () => `<h2 class="kb-h">Ahır</h2><div class="kb-rs">${kbRes('akce', 'Akçe', fmt(S.akce))}${kbRes('gem', 'Yakut', fmt(S.yakut))}</div>`;
const ahirBody = () => `<div class="ka-grid">${mine().map(cardHtml).join('')}</div>`;
const ahirRedraw = () => { if (binaAcik() === 'korant-modal-stable') binaCiz(ahirHead(), ahirBody()); };

/** Ahır penceresini açar (başkent hotspot'u `ahir`). */
ACT.ahir = () => binaAc('korant-modal-stable', 'Ahır', ahirHead(), ahirBody());
/** Yoldaş aç (Akçe ya da Yakut). */
ACT.ahirAc = async d => { const r = await run('ahir.unlock', { id: d.id, pay: d.pay }); icmSoz(r ? 'basari' : 'basarisizlik'); if (r) toast(`${COMPANIONS[d.id].name} artık ahırında.`); ahirRedraw(); };
/** Kuşan; etkin yoldaşa yeniden basmak onu çıkarır. */
ACT.ahirKusan = async d => { const r = await run('ahir.equip', { id: d.id }); icmSoz(r ? 'basari' : 'basarisizlik'); if (r) toast(r.active ? `${COMPANIONS[d.id].name} yanında savaşacak.` : `${COMPANIONS[d.id].name} ahırda dinleniyor.`); ahirRedraw(); };
/** Besle: günde FEEDS_PER_DAY (bütün yoldaşlar için ortak). */
ACT.ahirBesle = async d => { const r = await run('ahir.feed', { id: d.id }); icmSoz(r ? 'basari' : 'basarisizlik'); if (r) toast(r.up ? `${COMPANIONS[d.id].name} seviye atladı: Sv. ${r.lv}` : `${COMPANIONS[d.id].name} doydu · +${FEED_XP} XP`); ahirRedraw(); };
/** Şartnamedeki ad (takma ad). */
export const openStableModal = () => ACT.ahir();
