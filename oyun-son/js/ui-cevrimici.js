// Çevrimiçi ödülleri (sürüm 13: sıralı). Sandıklar sırayla açılır: bir sandığın sayacı ancak bir öncekini aldıktan SONRA
// işlemeye başlar (kurallar meta.js: ONLINE, metaops.js: online.tick / online.claim; sunucu sırayı ve süreyi denetler).
// Süreyi sunucu sayar: oyun görünürken dakikada bir "online.tick" gönderilir. Ekrandaki sayaç iki bildirim arasında
// yerelde ilerler (gösterim içindir; ödülü sunucunun saydığı süre açar).
import { S, onState } from './api.js';
import { ACT, hud, modal, run, showModal, lootChip, lootToast, toast, energyNow } from './ui-core.js';
import { p24Band } from './ui-kaplama.js';
import { p25bImg } from './ui-town.js'; // P25-b: sandık görselleri (p25-b-png.js)
import { ONLINE, onlineOf, onlineNext } from '../shared/meta.js';
import { now } from './api.js';

const TICK = 60000;
const O = { ms: 0, got: [], seenAt: 0 }; // sunucunun son bildirdiği süre (son alımdan beri) ve o anın yerel saati
const sync = o => { if (!o) return; O.ms = o.ms || 0; O.got = o.got || []; O.seenAt = Date.now(); };
const elapsed = () => O.ms + (document.hidden ? 0 : Math.min(ONLINE.gapMs, Date.now() - O.seenAt));
const need = i => ONLINE.steps[i].min * 60000;
const nextI = () => onlineNext(O);
const isReady = ms => { const n = nextI(); return n >= 0 && ms >= need(n); };
const mmss = ms => { const t = Math.max(0, Math.ceil(ms / 1000)), h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60; return h ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`; };

async function tick() {
  if (!S || document.hidden) return;
  const r = await run('online.tick').catch(() => null);
  if (r) { sync(r); paint(); }
}
let started = false;
onState(s => {
  if (!s) return;
  if (!started) { started = true; sync(onlineOf(s, now())); setTimeout(tick, 1500); setInterval(tick, TICK); setInterval(paint, 1000); }
});
document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); else { O.ms = elapsed(); O.seenAt = Date.now(); } });

// ---------- Ana ekran simgesi: sağdaki Bildirim / Takvim / Başarım sırasına eklenir ----------
const CHEST = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10h18v10H3z"/><path d="M3 10c0-4 3-6 9-6s9 2 9 6z" opacity=".85"/><rect x="10" y="9" width="4" height="5" rx="1" fill="#0006"/></svg>';
const CHECK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const LOCK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10V7a5 5 0 0 1 10 0v3h1.5v11h-13V10zm2.5 0h5V7a2.5 2.5 0 0 0-5 0z"/></svg>';
function paint() {
  const rail = hud.querySelector('.krail'); if (!rail || hud.hidden) return;
  let b = rail.querySelector('[data-a="onlineOpen"]');
  if (!b) { rail.insertAdjacentHTML('beforeend', `<button class="lbtn onl" data-a="onlineOpen" title="Çevrimiçi ödülleri"><i>${CHEST}</i><span class="onl-t"></span><span class="badge" hidden></span></button>`); b = rail.querySelector('[data-a="onlineOpen"]'); }
  const ms = elapsed(), n = nextI(), rdy = isReady(ms), done = n < 0;
  b.querySelector('.onl-t').textContent = done ? 'Bitti' : rdy ? 'Al!' : mmss(need(n) - ms);
  const bd = b.querySelector('.badge'); bd.hidden = !rdy; bd.textContent = rdy ? 1 : '';
  b.classList.toggle('ready', rdy);
  if (!modal.hidden && modal.querySelector('.onlw')) {
    const el = modal.querySelector(`[data-onl="${n}"]`); if (!el) return;
    if (rdy && !el.classList.contains('ok')) return ACT.onlineOpen(); // süre doldu: kart "Al" durumuna geçer
    el.querySelector('.pbar i').style.width = `${Math.min(100, 100 * ms / need(n))}%`;
    const w = el.querySelector('.onl-left'); if (w) w.textContent = rdy ? '' : `${mmss(need(n) - ms)}`;
  }
}
new MutationObserver(() => paint()).observe(hud, { childList: true });

// ---------- Pencere: sıralı sandıklar ----------
const label = m => (m >= 60 ? `${m / 60} saat` : `${m} dk`);
function html() {
  const ms = elapsed(), n = nextI();
  const cards = ONLINE.steps.map((s, i) => {
    const got = O.got.includes(i), cur = i === n, ok = cur && ms >= need(i);
    const st = got ? 'got' : ok ? 'ok' : cur ? 'run' : 'lock';
    const foot = got ? `<span class="onx-st got">${CHECK} Alındı</span>`
      : ok ? `<button class="btn red onx-al" data-a="onlineClaim" data-i="${i}">Al</button>`
        : cur ? `<span class="onx-st run">${LOCK}<span class="onl-left">${mmss(need(i) - ms)}</span></span>`
          : `<span class="onx-st lock">${LOCK} Sırada</span>`;
    // P25-b: dikey sandık kartı (hazır/alınmış altın, bekleyen gümüş, son sandık süslü); görsel referanstan kırpıldı
    const art = i === ONLINE.steps.length - 1 ? 'onl_suslu' : ok || got ? 'onl_altin' : 'onl_gumus';
    return `<div class="onx-c ${st}" data-onl="${i}"><span class="onx-no">${i + 1}</span><b class="onx-t">${label(s.min)}</b><div class="onx-ch" style="--ch:var(--p25b-${art})">${CHEST}</div>
      <div class="pbar"><i style="width:${got ? 100 : cur ? Math.min(100, 100 * ms / need(i)) : 0}%"></i></div>
      <div class="onx-loot">${s.give.map(lootChip).join('')}</div><div class="onx-foot">${foot}</div></div>`;
  }).join('');
  const tip = n < 0 ? 'Bugünün bütün sandıklarını aldın. Yarın 00:00’da yeniden başlar.'
    : isReady(ms) ? 'Sandık hazır! Aldığın an sıradakinin sayacı başlar.'
      : n === 0 ? 'İlk sandığın sayacı işliyor.' : 'Sayaç, bir önceki sandığı aldığın andan beri işliyor.';
  const band = p24Band && ''; // P27 Bölüm 2: kaynak bandı yok; durum etiketi ui-core.js MODAL_CTX'ten (Sunucu Saati)
  return `<h2>Çevrimiçi ödülleri</h2>${band}<div class="in onlw"><p class="onl-tip">${tip} <span class="mut">Sandıklar sırayla açılır; her gün 00:00’da yenilenir.</span></p>
    <div class="onx-row">${cards}</div></div>`;
}
/** Çevrimiçi ödülleri penceresi (modal, sınıf 'onl p25b'): beş sıralı sandık. */
ACT.onlineOpen = () => { p25bImg(); showModal(html(), 'onl p25b'); paint(); };
ACT.onlineClaim = async d => {
  const r = await run('online.claim', { i: +d.i });
  if (!r) return;
  if (!O.got.includes(+d.i)) O.got.push(+d.i);
  O.ms = 0; O.seenAt = Date.now(); // sıralı: sıradakinin sayacı şimdi başlar (sunucu da sıfırladı)
  if (r.loot?.length) lootToast?.(r.loot); else toast('Sandık açıldı.');
  ACT.onlineOpen();
};
