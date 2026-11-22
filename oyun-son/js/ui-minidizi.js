// ui-minidizi.js — Mini Dizi penceresi (10 bölüm), video oynatıcı katmanı ve ödül (kurallar shared/minidizi.js, eylem series.watch)
import { S } from './api.js';
import { ACT, run, showModal, closeModal, lootChip, lootToast, toast, esc, fmt } from './ui-core.js';
import { svg } from './icons.js';
import { SERIES, SERIES_MIN_SEC, SERIES_RATIO, seriesReward, seriesWatched, seriesOpen, seriesNewCount } from '../shared/minidizi.js';

let layer = null, timer = 0;
const rewardChips = ep => { const R = seriesReward(S, ep); return [`<span class="chip rw">${fmt(R.xp)} tecrübe</span>`, ...R.give.map(lootChip)].join(''); };

function win() {
  const n = seriesNewCount(S), done = SERIES.filter(e => seriesWatched(S, e.ep)).length;
  const card = e => {
    const w = seriesWatched(S, e.ep), open = seriesOpen(S, e.ep), cls = w ? 'done' : open ? 'new' : 'lock';
    return `<button class="mdz-c ${cls}" style="--mk:var(--sc-minidizi-${String(e.ep).padStart(2, '0')})" data-a="${open ? 'seriesPlay' : 'seriesLocked'}" data-ep="${e.ep}"><i class="mdz-no">${e.ep}</i><b class="mdz-ad">${esc(e.ad)}</b><span class="mdz-rw">${w ? '' : rewardChips(e.ep)}</span><em class="mdz-st">${w ? '✓ İzlendi' : open ? 'Yeni' : '<span class="mdz-lk">' + svg('lock') + '</span> Kilitli'}</em></button>`;
  };
  showModal(`<h2>Mini Dizi</h2><div class="in mdzw"><p class="mut">Korant’ın hikâyesi, 10 bölümde. Her bölümü izleyince küçük bir ödül alırsın. ${done}/10 izlendi${n ? ` · ${n} yeni bölüm var` : ''}.</p><div class="mdz-g">${SERIES.map(card).join('')}</div></div>`, 'mdz');
}
ACT.seriesOpen = () => win();
ACT.seriesLocked = () => toast('Önce önceki bölümü izle.');

function stop() { clearInterval(timer); timer = 0; layer?.remove(); layer = null; }
ACT.seriesClose = () => { stop(); if (document.querySelector('.mdzw')) win(); };

ACT.seriesPlay = ({ ep }) => {
  ep = +ep; const e = SERIES.find(x => x.ep === ep); if (!e) return;
  stop();
  const w = seriesWatched(S, ep);
  layer = document.createElement('div'); layer.className = 'mdz-layer'; layer.style.setProperty('--mk', `var(--sc-minidizi-${String(ep).padStart(2, '0')})`); // 23 Kas: G5 kapak (video yokken yer tutucunun arka planı)
  layer.innerHTML = `<div class="mdz-top"><b>${e.ep}. ${esc(e.ad)}</b><button class="btn" data-a="seriesClose">Kapat</button></div>
    <div class="mdz-stage"><video class="mdz-v" src="${e.video}" controls playsinline preload="metadata"></video><div class="mdz-ph" hidden>${svg('film')}<b>Bu bölüm yakında</b><small>Video dosyası henüz eklenmedi.</small></div></div>
    <div class="mdz-bot"><span class="mdz-hint"></span><button class="btn green" data-a="seriesDone" data-ep="${ep}" disabled>${w ? 'İzlendi' : 'Ödülü al'}</button></div>`;
  layer.addEventListener('click', ev => { const b = ev.target.closest('[data-a]'); if (b && !b.disabled) ACT[b.dataset.a]?.(b.dataset, b); });
  document.body.appendChild(layer);
  const v = layer.querySelector('video'), ph = layer.querySelector('.mdz-ph'), btn = layer.querySelector('[data-a="seriesDone"]'), hint = layer.querySelector('.mdz-hint');
  // İstemci denetimi (basit): videonun %80'i oynatılmış olmalı; video yoksa yer tutucuda 10 sn beklenir. Sunucu yalnız bölüm sırasını ve tek seferliği zorlar.
  const ready = () => { btn.disabled = w; hint.textContent = w ? 'Bu bölümün ödülünü aldın.' : 'Hazır: ödülünü alabilirsin.'; };
  if (w) { hint.textContent = 'Bu bölümün ödülünü aldın.'; }
  let max = 0;
  v.addEventListener('timeupdate', () => { if (!v.duration) return; max = Math.max(max, v.currentTime); const r = max / v.duration; if (!w) { if (r >= SERIES_RATIO) ready(); else hint.textContent = `İzleme %${Math.floor(r * 100)} · %${SERIES_RATIO * 100} sonra ödül açılır`; } });
  v.addEventListener('ended', () => { if (!w) ready(); });
  v.addEventListener('error', () => { // video dosyası yok: yer tutucu + 10 sn
    v.hidden = true; ph.hidden = false; if (w) return; let left = SERIES_MIN_SEC; btn.textContent = 'İzlendi say';
    const t = () => { hint.textContent = left > 0 ? `Deneme: ${left} sn sonra “İzlendi say” açılır` : 'Hazır.'; if (left <= 0) { clearInterval(timer); btn.disabled = false; } left--; };
    t(); timer = setInterval(t, 1000);
  }, true);
  v.play?.().catch?.(() => { });
};

ACT.seriesDone = async ({ ep }) => {
  ep = +ep; const r = await run('series.watch', { ep }); if (!r) return;
  stop();
  if (r.loot?.length) lootToast(r.loot);
  toast(`${ep}. bölüm izlendi: + ${fmt(r.xp)} tecrübe`);
  win(); // rozet ana ekranda onState ile tazelenir
};
