// ui-reklam.js: ödüllü reklam oynatıcı kabı ve reklam ödülü düğmeleri.
// Ödül hesabı sunucudadır (shared/reklam.js: ad.claim); burada yalnızca reklam gösterilir, sonra ad.claim çağrılır.
// Reklam kaynağı: showRewardedAd() (pay-native.js) yerel uygulamada gerçek SDK'yı çağırır; yoksa (tarayıcı, deneme kipi) 15 sn'lik
// yer tutucu katman çıkar. Üst premium kademe (reklamsız) reklam izlemeden alır.
// Sürüm 13: reklamlar şimdilik kapalı (shared/reklam.js AD.on). Kapalıyken bu modül hiçbir düğme ya da pencere üretmez;
// kod yolu yerinde durur, AD.on açılınca geri gelir.
import { S, now } from './api.js';
import { ACT, $, esc, fmt, toast, run, lootToast, redraw, hooks, showModal, closeModal, resTile, cur } from './ui-core.js';
import { ri } from './icons.js';
import { AD, AD_SPOTS, AD_KEYS, adLeft, adUsed, adWait, adFree, chestOf } from '../shared/reklam.js';
import { ENERGY, UNLOCK } from '../shared/content.js';
import { showRewardedAd } from './pay-native.js';

const AD_SECONDS = 15;
const NAMES = { sandik: 'chest', enerji: 'energy', cark: 'wheel', maden: 'mine', savas: 'battle' };
const spotOk = k => !AD_SPOTS[k].unlock || S.lvl >= UNLOCK[AD_SPOTS[k].unlock];
const waitSec = () => Math.ceil(adWait(S, now()) / 1000);
const dropTxt = l => (l.t === 'akce' ? `${fmt(l.n)} akçe` : l.t === 'stone' ? `${l.n} bileği taşı` : l.t === 'yakut' ? `${l.n} yakut` : `${l.n}`);

// ---------- Reklam katmanı ----------
let overlay = null;
// Tek giriş: reklam gösterilir ve izleme tamamlandıysa true döner. Reklamsız üye için hemen true.
export async function showAd(spotName) {
  if (adFree(S, now())) return true;
  const native = await showRewardedAd();
  if (native !== null) return native;
  return placeholderAd(spotName);
}
function placeholderAd(spotName) {
  if (overlay) return Promise.resolve(false);
  return new Promise(res => {
    const el = overlay = document.createElement('div');
    el.className = 'ad-ov'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'Reklam');
    el.innerHTML = `<div class="ad-box"><span class="ad-tag">Reklam</span>
      <div class="ad-art" aria-hidden="true"><svg viewBox="0 0 160 90"><defs><linearGradient id="adg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2d3f6b"/><stop offset="1" stop-color="#7a2f3a"/></linearGradient></defs><rect width="160" height="90" fill="url(#adg)"/><circle cx="118" cy="26" r="12" fill="#f4d470" opacity=".8"/><path d="M0 90 L38 44 L62 66 L96 30 L130 62 L160 48 V90Z" fill="#0f1a30" opacity=".85"/></svg><b>Reklam alanı</b></div>
      <p class="ad-why">${esc(spotName || 'Ödül')} için izleniyor · ödülü sunucu verir</p>
      <div class="ad-bar"><i></i></div>
      <div class="ad-row"><button class="btn sm" data-ad="skip">Vazgeç</button><button class="btn green" data-ad="done" disabled>Ödülü al <span class="ad-sec">${AD_SECONDS}</span></button></div>
      <p class="ad-note">Yer tutucu reklam: mağaza sürümünde gerçek reklam oynar.</p></div>`;
    document.body.appendChild(el);
    const bar = el.querySelector('.ad-bar i'), sec = el.querySelector('.ad-sec'), done = el.querySelector('[data-ad=done]');
    const t0 = performance.now();
    const close = ok => { clearInterval(tm); el.remove(); overlay = null; res(ok); };
    const tm = setInterval(() => {
      const left = Math.max(0, AD_SECONDS - (performance.now() - t0) / 1000);
      bar.style.width = `${100 * (1 - left / AD_SECONDS)}%`; sec.textContent = Math.ceil(left) || '';
      if (left <= 0) { done.disabled = false; done.classList.add('red'); clearInterval(tm); setTimeout(() => { if (overlay === el) close(true); }, 600); } // süre dolunca kendiliğinden kapanır
    }, 200);
    el.addEventListener('click', e => { const b = e.target.closest('[data-ad]'); if (!b || b.disabled) return; close(b.dataset.ad === 'done'); });
    done.focus?.();
  });
}

// ---------- İzle ve ödülü al ----------
let busy = false;
export async function watchAd(spot, extra = {}) {
  if (!AD.on || busy || !AD_SPOTS[spot]) return null;
  if (waitSec() > 0 && !adFree(S, now())) { toast(`Bir sonraki reklam için ${waitSec()} sn bekle.`); return null; }
  busy = true;
  try {
    if (!(await showAd(AD_SPOTS[spot].name))) { toast('Reklam tamamlanmadı: ödül verilmedi.'); return null; }
    const r = await run('ad.claim', { spot, ...extra });
    if (r) report(r);
    return r;
  } finally { busy = false; }
}
function report(r) {
  if (r.spot === 'enerji') toast(`Enerjin ${ENERGY.max}'e tamamlandı.`);
  else if (r.spot === 'cark') toast('Ücretsiz çevirme hakkı kazandın: Kader Çarkı\'nda kullan.');
  else if (r.spot === 'maden') toast('Maden birikimi 1 saat ileri alındı.');
  else lootToast(r.loot);
}
ACT.adWatch = async (d, b) => {
  const r = await watchAd(d.spot, d.battle ? { battle: +d.battle } : {});
  if (!r) return;
  if (d.spot === 'savas' && b) { b.disabled = true; b.textContent = 'İkiye katlandı'; b.classList.remove('red'); }
  else redraw();
};

// ---------- Düğmeler (başka pencerelere eklenir) ----------
// Küçük, isteğe bağlı reklam düğmesi; hak kalmadıysa ya da yer kilitliyse boş döner
export function adBtn(spot, label, data = {}, cls = '') {
  if (!AD.on || !spotOk(spot) || !adLeft(S, spot)) return '';
  const free = adFree(S, now());
  return `<button class="btn sm ad-btn ${cls}" data-a="adWatch" data-spot="${spot}"${Object.entries(data).map(([k, v]) => ` data-${k}="${esc(v)}"`).join('')}>${ri('star')} ${esc(label)}${free ? '' : ' <small>(reklam)</small>'}</button>`;
}
// Kader Çarkı: ücretsiz çevirme hakkı varsa "kullan" düğmesi, yoksa reklam düğmesi
export const adWheelBtn = () => (S.daily.adSpin > 0 ? '<span class="chip up">Ücretsiz çevirme hakkın var: bir mücevhere dokun</span>' : adBtn('cark', 'Reklamla ücretsiz çevir'));
export const adsOn = () => AD.on; // Kervan'ın "Ücretsiz" sekmesi ve Menü kısayolu buna bakar

// ---------- Kervan "Ücretsiz" sekmesi ----------
const rewardText = k => {
  if (k === 'sandik') { const i = Math.min(adUsed(S, k), AD_SPOTS.sandik.max - 1); return chestOf(S, i).map(dropTxt).join(' + '); }
  if (k === 'enerji') return `Enerji ${ENERGY.max}'e`;
  if (k === 'cark') return '1 ücretsiz çevirme';
  if (k === 'maden') return '+1 saat cevher';
  return 'Son zaferin akçesi ×2';
};
export function adShop() {
  const free = adFree(S, now()), w = waitSec();
  return `<div class="hint">Kısa bir reklam izle, ödülü al. Her ödülün günlük hakkı vardır; iki izleme arası en az ${AD.gapMs / 1000} sn beklenir.${free ? ' <b>Premium üyeliğin sayesinde reklam izlemeden alırsın.</b>' : ''}</div>
    <p class="mut ad-wait" data-adwait ${w > 0 && !free ? '' : 'hidden'}>Sıradaki reklam: <b>${w}</b> sn</p>
    <div class="kv-grid">${AD_KEYS.map(k => {
      const P = AD_SPOTS[k], left = adLeft(S, k), ok = spotOk(k), on = ok && left > 0;
      return `<div class="kv-card ad-card ${on ? '' : 'dim'}"><span class="kv-badge">Günde ${P.max}</span><span class="kv-ico">${resTile(NAMES[k], 'kv-ico')}</span>
        <b class="kv-name">${P.name}</b><span class="mut kv-desc">${P.desc}</span><span class="chip">${ok ? `Kalan ${left}/${P.max}` : `${UNLOCK[P.unlock]}. seviyede açılır`}</span>
        <span class="mut ad-rew">${rewardText(k)}</span>
        <button class="btn green kv-buy" data-a="adWatch" data-spot="${k}" ${on && k !== 'savas' ? '' : 'disabled'}>${k === 'savas' ? 'Zafer ekranında' : left ? `${ri('star')} ${free ? 'Al' : 'İzle'}` : 'Bitti'}</button></div>`;
    }).join('')}</div>`;
}
// Geri sayım: açık düğmelerin bekleme süresi ve şeridi saniyede bir tazelenir
setInterval(() => {
  const el = document.querySelector('[data-adwait]'); if (!el || !S) return;
  const w = waitSec(); el.hidden = !(w > 0 && !adFree(S, now())); const b = el.querySelector('b'); if (b) b.textContent = w;
}, 1000);

// ---------- Enerji bitince: "Reklam izle, enerji doldur" ----------
{
  const prev = hooks.err;
  hooks.err = e => {
    if (prev?.(e)) return true;
    if (!AD.on || e?.code !== 'no-energy' || !S || !adLeft(S, 'enerji') || S.energy >= ENERGY.max) return false;
    showModal(`<h2>Enerjin yetmiyor</h2><div class="in"><p>${resTile('energy')} Reklam izleyerek enerjini <b>${ENERGY.max}</b>'e tamamlayabilirsin. <span class="mut">Bugün kalan: ${adLeft(S, 'enerji')}/${AD_SPOTS.enerji.max}</span></p>
      <div class="mbtns"><button class="btn green" data-a="adEnergy">${ri('star')} Reklam izle, enerji doldur</button><button class="btn" data-a="closeModal">Vazgeç</button></div></div>`);
    return true;
  };
}
ACT.adEnergy = async () => { closeModal(); await watchAd('enerji'); };
