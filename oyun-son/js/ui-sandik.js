// ui-sandik.js — Çevrimdışı ödül sandığı: ana ekran simgesi (sağ sütun), doluluk, pencere ve toplama (kurallar shared/sandik.js)
import { S, now, onState } from './api.js';
import { ACT, hud, modal, run, showModal, lootChip, lootToast, toast, fmt } from './ui-core.js';
import { SANDIK, sandikRatio, sandikLeft, sandikReward } from '../shared/sandik.js';

const hm = ms => { const t = Math.max(0, Math.ceil(ms / 60000)), h = Math.floor(t / 60), m = t % 60; return h ? `${h} sa ${m} dk` : `${m} dk`; };
const pct = r => Math.floor(r * 100);
const CHEST = full => `<svg viewBox="0 0 64 56" class="sdk-svg ${full ? 'full' : ''}" aria-hidden="true"><ellipse cx="32" cy="52" rx="26" ry="3.5" fill="#0004"/><path d="M6 24h52v26a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3z" fill="#8a5a2b"/><path d="M6 24h52v6H6z" fill="#00000026"/><path d="M6 24C6 12 16 6 32 6s26 6 26 18z" fill="#a8703a"/><path d="M12 22c1-7 8-12 20-12" stroke="#ffffff44" stroke-width="2" fill="none" stroke-linecap="round"/><rect x="4" y="22" width="6" height="30" rx="1.5" fill="#4a4f58"/><rect x="54" y="22" width="6" height="30" rx="1.5" fill="#4a4f58"/><rect x="27" y="22" width="10" height="13" rx="2" fill="#d9a93c"/><circle cx="32" cy="28" r="2" fill="#4a2f12"/><path d="M26 6l-2 18M38 6l2 18" stroke="#4a4f58" stroke-width="2.5"/>${full ? '<g fill="#ffe27a"><path d="M32 -1l1.6 4.4L38 5l-4.4 1.6L32 11l-1.6-4.4L26 5l4.4-1.6z" transform="translate(0 2)"/><circle cx="14" cy="12" r="1.6"/><circle cx="52" cy="14" r="1.6"/></g>' : ''}</svg>`;

function paint() {
  if (!S || hud.hidden) return;
  const rail = hud.querySelector('.krail'); if (!rail) return;
  const r = sandikRatio(S, now()), full = r >= 1, rdy = r >= SANDIK.min;
  let b = rail.querySelector('[data-a="sandikOpen"]');
  if (!b) { rail.insertAdjacentHTML('beforeend', `<button class="lbtn sdk" data-a="sandikOpen" title="Çevrimdışı ödül sandığı"><i>${CHEST(false)}</i><span class="sdk-t"></span><span class="sdk-bar"><i></i></span><span class="badge" hidden>!</span></button>`); b = rail.querySelector('[data-a="sandikOpen"]'); }
  b.classList.toggle('full', full);
  b.querySelector('i').innerHTML = CHEST(full);
  b.querySelector('.sdk-t').textContent = pct(r) + '%';
  b.querySelector('.sdk-bar i').style.width = pct(r) + '%';
  b.querySelector('.badge').hidden = !full;
  if (!modal.hidden && modal.querySelector('.sdkw')) paintWin();
}
function paintWin() {
  const r = sandikRatio(S, now()), rdy = r >= SANDIK.min, R = sandikReward(S, r);
  modal.querySelector('.sdk-fill').style.width = pct(r) + '%';
  modal.querySelector('.sdk-pct').textContent = pct(r) + '%';
  modal.querySelector('.sdk-left').textContent = r >= 1 ? 'Sandık tamamen doldu.' : `Dolmasına ${hm(sandikLeft(S, now()))} kaldı`;
  modal.querySelector('.sdk-loot').innerHTML = rdy ? [`<span class="chip rw">${fmt(R.xp)} tecrübe</span>`, ...R.give.map(lootChip)].join('') : '<span class="mut">Henüz alınacak ödül yok.</span>';
  const btn = modal.querySelector('[data-a="sandikClaim"]'); btn.disabled = !rdy; btn.classList.toggle('green', rdy);
  modal.querySelector('.sdk-hint').textContent = rdy ? '' : `Topla düğmesi sandık en az %${pct(SANDIK.min)} dolunca açılır.`;
}
ACT.sandikOpen = () => {
  showModal(`<h2>Ödül Sandığı</h2><div class="in sdkw"><div class="sdk-top">${CHEST(sandikRatio(S, now()) >= 1)}<div class="sdk-info"><p>Sandık 12 saatte dolar</p><div class="pbar sdk-pb"><i class="sdk-fill"></i></div><div class="sdk-row"><b class="sdk-pct"></b><span class="sdk-left mut"></span></div></div></div>
    <div class="sdk-lt">Şu an alınacak ödüller</div><div class="sdk-loot"></div><div class="mut sdk-hint"></div>
    <div class="mbtns"><button class="btn" data-a="sandikClaim">Topla</button></div></div>`, 'sdk');
  paintWin();
};
ACT.sandikClaim = async () => {
  const r = await run('ofc.claim'); if (!r) return;
  const loot = [...(r.xp ? [{ t: 'xp', n: r.xp }] : []), ...(r.loot || [])];
  if (r.loot?.length) lootToast(r.loot); else toast('Sandık boşaltıldı.');
  if (r.xp) toast(`Sandık boşaltıldı: + ${fmt(r.xp)} tecrübe`);
  ACT.closeModal?.(); paint();
};
onState(() => { paint(); });
setInterval(paint, 15000);
new MutationObserver(paint).observe(hud, { childList: true, attributes: true, attributeFilter: ['hidden'] });
