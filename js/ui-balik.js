// ui-balik.js — Yemin Pazarı göleti: balık tutma mini oyunu (kurallar shared/balik.js).
// Akış: Olta at (fish.cast: sunucu bekleme süresini ve yeşil bölgeyi verir) → şamandıra bekler → batınca kısa sürede "Çek!" →
// zamanlama çubuğunda gidip gelen işaretçi yeşil bölgedeyken "Tut!" → fish.reel { ok } → yakaladın / kaçtı.
// Sahne özgün SVG + CSS; tek büyük eylem düğmesi ve sahneye dokunmak aynı işi yapar (mobilde rahat).
import { S, now } from './api.js';
import { ACT, modal, run, showModal, toast, fmt, esc, lootToast, confirmBox, redraw } from './ui-core.js';
import { ri } from './icons.js';
import { FISH, FISH_RAR, RODS, BITE_MS, fishOf, fishLeft, fishMax, fishPrice, fishBagValue } from '../shared/balik.js';

const G = { st: 'idle', cast: null, t0: 0, raf: 0, timer: 0, res: null, zone: [0.4, 0.6], pos: 0 };
const open = () => !modal.hidden && modal.querySelector('.blk');
const stop = () => { cancelAnimationFrame(G.raf); clearTimeout(G.timer); G.raf = 0; G.timer = 0; };

// Balık çizimi: gövde, kuyruk, yüzgeç ve göz; renk türden, kontur nadirlikten
export const fishSvg = (id, cls = '') => { const F = FISH[id], rc = FISH_RAR[F.r].color;
  return `<svg class="blk-fish ${cls}" viewBox="0 0 64 32" aria-hidden="true"><path d="M50 16l12-10v20z" fill="${F.c}" stroke="${rc}" stroke-width="1.5" stroke-linejoin="round"/><path d="M4 16c6-10 20-13 32-11 9 1.5 14 6 16 11-2 5-7 9.5-16 11-12 2-26-1-32-11z" fill="${F.c}" stroke="${rc}" stroke-width="2"/><path d="M20 6c4-4 10-5 14-3l-4 4z" fill="${F.c}" stroke="${rc}" stroke-width="1.2"/><path d="M10 13c8-4 22-5 34 0" stroke="#ffffff40" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M24 14l6 5-7 2z" fill="#00000030"/><circle cx="11" cy="14" r="2.4" fill="#111"/><circle cx="10.4" cy="13.4" r=".8" fill="#fff"/></svg>`; };

// Göl sahnesi: gök, karşı kıyı, su, iskele, olta ipi ve şamandıra (konumu CSS sınıfıyla oynar)
const SCENE = `<svg class="blk-svg" viewBox="0 0 320 150" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <defs><linearGradient id="blkSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b4a6e"/><stop offset="1" stop-color="#d9b27a"/></linearGradient>
  <linearGradient id="blkWater" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3d7fa6"/><stop offset="1" stop-color="#173a55"/></linearGradient></defs>
  <rect width="320" height="62" fill="url(#blkSky)"/><circle cx="250" cy="30" r="13" fill="#ffe0a0" opacity=".85"/>
  <path d="M0 58l18-14 14 8 20-18 22 16 16-10 24 18 30-20 26 16 22-12 30 16 24-14 26 12 28-10 20 12v8H0z" fill="#2c4a38"/>
  <path d="M0 62h320v88H0z" fill="url(#blkWater)"/>
  <g class="blk-rip" stroke="#ffffff38" stroke-width="1.4" stroke-linecap="round" fill="none"><path d="M30 80h26M120 74h30M220 86h22M60 112h34M180 118h28M262 104h30"/></g>
  <path d="M-4 150l64-46h18l-46 46z" fill="#6a4526"/><path d="M8 141l58-40M22 147l52-40" stroke="#4a2f18" stroke-width="2"/>
  <path d="M46 122v28M70 104v30" stroke="#3a2412" stroke-width="4"/>
  <path class="blk-rod" d="M58 108L118 40" stroke="#5a3a1c" stroke-width="3" stroke-linecap="round"/>
  <path class="blk-line" d="M118 40Q170 52 214 96" stroke="#e8e2d0" stroke-width=".9" fill="none"/>
  <g class="blk-bob"><ellipse class="blk-ring" cx="214" cy="99" rx="14" ry="3.5" fill="none" stroke="#ffffff70"/><path d="M209 98a5 5 0 0 1 10 0z" fill="#e33c2a"/><path d="M209 98a5 5 0 0 0 10 0z" fill="#f2efe6"/><path d="M214 88v6" stroke="#222" stroke-width="1.2"/></g>
</svg>`;

const head = () => { const f = fishOf(S), R = RODS[f.rod | 0], left = fishLeft(S, now());
  return `<div class="blk-top"><span class="chip">${ri('akce')} ${fmt(S.akce)}</span><span class="chip">Atış ${left}/${fishMax(S, now())}</span><span class="chip blk-rodc">${esc(R.name)}</span></div>`; };

function body() {
  if (G.st === 'bar') return `<div class="blk-bar"><i class="blk-zone" style="left:${G.zone[0] * 100}%;width:${(G.zone[1] - G.zone[0]) * 100}%"></i><b class="blk-mk"></b></div><p class="blk-msg">İşaretçi yeşildeyken dokun!</p>`;
  if (G.st === 'wait') return `<p class="blk-msg">Şamandırayı izle… Batınca hemen <b>Çek!</b></p>`;
  if (G.st === 'bite') return `<p class="blk-msg hot">Vurdu! Çek!</p>`;
  if (G.st === 'res') { const r = G.res;
    if (!r.ok) return `<p class="blk-msg bad">${r.early ? 'Erken çektin, balık ürktü.' : 'Balık kaçtı.'} <span class="mut">(${FISH_RAR[r.r ?? 0].name} bir balıktı)</span></p>`;
    const F = FISH[r.id], R = FISH_RAR[F.r];
    return `<div class="blk-got r${F.r}">${fishSvg(r.id)}<div><b style="color:${R.color}">${esc(F.name)}</b><span class="blk-rar" style="--rc:${R.color}">${R.name}</span><br><span>${String(r.kg).replace('.', ',')} kg</span>${r.rec ? ' <span class="chip rw">Yeni rekor!</span>' : ''}<br><span class="mut">Tüccar ${fmt(fishPrice(r.id))} akçe verir</span></div></div>`; }
  return `<p class="blk-msg">Göletin balıkları iskelenin ucunda. Olta at, şamandıra batınca çek.</p>`;
}
function label() { return { idle: 'Olta at', cast: 'Olta at', reel: 'Çek!', wait: 'Bekle…', bite: 'Çek!', bar: 'Tut!', res: 'Tekrar at' }[G.st]; }

function draw() {
  if (!open()) return;
  const left = fishLeft(S, now()), btn = modal.querySelector('.blk-go');
  modal.querySelector('.blk-head').innerHTML = head();
  modal.querySelector('.blk-body').innerHTML = body();
  modal.querySelector('.blk-scene').className = `blk-scene s-${G.st}${G.res?.ok ? ' won' : ''}`;
  btn.textContent = label();
  const idle = G.st === 'idle' || G.st === 'res';
  btn.disabled = idle && left <= 0;
  btn.className = `btn blk-go ${G.st === 'bite' || G.st === 'bar' ? 'red' : 'green'}`;
  modal.querySelector('.blk-side').hidden = !idle;
  if (idle) paintSide();
}
function paintSide() {
  const f = fishOf(S), next = RODS[(f.rod | 0) + 1], bag = Object.entries(f.c).filter(([k, n]) => FISH[k] && n > 0), val = fishBagValue(S);
  modal.querySelector('.blk-side').innerHTML = `
    <div class="blk-bag">${bag.length ? bag.map(([k, n]) => `<span class="blk-b" title="${esc(FISH[k].name)}">${fishSvg(k, 'xs')}<b>${n}</b></span>`).join('') : '<span class="mut">Kovan boş.</span>'}</div>
    <div class="blk-acts"><button class="btn sm" data-a="balikSat" ${val ? '' : 'disabled'}>Tüccar'a sat (+${fmt(val)})</button>
    ${next ? `<button class="btn sm" data-a="balikRod" ${S.akce >= next.cost ? '' : 'disabled'}>${esc(next.name)}: ${ri('akce')} ${fmt(next.cost)}</button>` : '<span class="mut">Oltan en iyisi.</span>'}
    <button class="btn sm" data-a="balikDefter">Defter</button></div>`;
}

ACT.balik = () => {
  stop(); G.st = 'idle'; G.res = null;
  showModal(`<h2>Balık Tut</h2><div class="in blk"><div class="blk-head"></div><div class="blk-scene" data-a="balikGo">${SCENE}</div><div class="blk-body"></div>
    <div class="mbtns"><button class="btn green blk-go" data-a="balikGo">Olta at</button></div><div class="blk-side"></div></div>`, 'blkw');
  draw();
};
ACT.balikGo = () => {
  if (!open()) return;
  if (G.st === 'idle' || G.st === 'res') return cast();
  if (G.st === 'wait') return reel(false, true); // erken çekiş: balık ürker
  if (G.st === 'bite') return startBar();
  if (G.st === 'bar') { const ok = G.pos >= G.zone[0] && G.pos <= G.zone[1]; return reel(ok); }
};
async function cast() {
  if (fishLeft(S, now()) <= 0) return toast('Bugünkü atış hakkın bitti.');
  G.st = 'cast'; G.res = null;
  const r = await run('fish.cast'); if (!r) { G.st = 'idle'; return draw(); }
  G.cast = r; G.st = 'wait'; draw();
  G.timer = setTimeout(() => { if (G.st !== 'wait' || !open()) return; G.st = 'bite'; G.t0 = performance.now(); draw(); G.timer = setTimeout(() => { if (G.st === 'bite') reel(false); }, BITE_MS); }, r.wait);
}
function startBar() {
  clearTimeout(G.timer);
  const w = G.cast.zone, a = 0.12 + Math.random() * (0.76 - w);
  G.zone = [a, a + w]; G.st = 'bar'; G.pos = 0; draw();
  const mk = modal.querySelector('.blk-mk'), t0 = performance.now(), sp = G.cast.speed;
  const step = t => { if (G.st !== 'bar' || !open()) return; const x = (Math.max(0, t - t0) / 1000) * sp % 2; G.pos = x < 1 ? x : 2 - x; mk.style.left = `${G.pos * 100}%`; if (t - t0 > 6000) return reel(false); G.raf = requestAnimationFrame(step); };
  G.raf = requestAnimationFrame(step);
}
async function reel(ok, early = false) {
  stop(); G.st = 'reel';
  const r = await run('fish.reel', { ok });
  G.res = r ? { ...r, early } : { ok: false, early };
  G.st = 'res'; draw();
  if (r?.loot?.length) lootToast(r.loot);
}
ACT.balikRod = async () => {
  const f = fishOf(S), next = RODS[(f.rod | 0) + 1]; if (!next) return;
  confirmBox('Olta yükselt', `${next.name}: ${fmt(next.cost)} akçe. Şamandıra daha çabuk batar, yeşil bölge genişler.`, async () => { const r = await run('fish.rod'); if (r) { toast(`${RODS[r.rod].name} hazır.`); ACT.balik(); } }, 'Yükselt');
};
ACT.balikSat = async () => {
  const r = await run('fish.sell'); if (!r) return;
  toast(`${r.n} balık satıldı: +${fmt(r.akce)} akçe`);
  if (open()) draw(); else redraw();
};
// Balık defteri: türler, ömür boyu yakalanan ve en ağır
ACT.balikDefter = () => {
  const f = fishOf(S);
  showModal(`<h2>Balık Defteri</h2><div class="in blk-def">${Object.entries(FISH).map(([k, F]) => { const n = f.n[k] | 0, R = FISH_RAR[F.r];
    return `<div class="blk-dr ${n ? '' : 'unk'}">${fishSvg(k, 'sm')}<div><b style="color:${R.color}">${n ? esc(F.name) : '???'}</b> <span class="blk-rar" style="--rc:${R.color}">${R.name}</span><br><span class="mut">${n ? `${n} yakalandı · en ağır ${(f.w[k] / 1000).toFixed(2).replace('.', ',')} kg` : `${F.kg[0]}–${F.kg[1]} kg`}</span></div></div>`; }).join('')}
    <div class="mbtns"><button class="btn" data-a="balik">Göle dön</button></div></div>`, 'blkw');
};
