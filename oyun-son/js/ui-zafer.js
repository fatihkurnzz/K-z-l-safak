// P28 Zafer Anıtı arayüzü (TALIMAT.md §5.3): son halk savaşı (galip sancağı, skor, ilk 3 kahraman) ve günlük ödül.
// Kurallar game/shared/zafer.js'tedir; `zafer.view` salt-okur durumu, `zafer.claim` günlük ödülü verir.
import { ACT, esc, fmt, run, toast, hooks } from './ui-core.js';
import { S, now } from './api.js';
import { ZAFER, msToReset } from '../shared/zafer.js';
import { binaAc, binaCiz, binaAcik } from './ui-ahir.js';

const HALK = { sancak: { ad: 'Elentha', bayrak: 'img/p28/anit_bayrak_elentha.webp' }, ocak: { ad: 'Kragmir', bayrak: 'img/p28/anit_bayrak_kragmir.webp' } };
let Z = null, tick = 0;
const pad = n => String(n).padStart(2, '0');
/** Sıfırlamaya kalan süre "SS:DD". */
const ssdd = ms => { const m = Math.max(0, Math.floor(ms / 60000)); return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`; };
const odulMetni = won => { const R = won ? ZAFER.win : ZAFER.lose; return `+${fmt(R.akce)} Akçe · +${R.energy} Enerji${won ? ` · ${R.buffHours} saat +%${R.xpPct} EXP / +%${R.akcePct} Akçe` : ''}`; };

function body() {
  if (!Z) return '<p class="kz-yuk">Yükleniyor…</p>';
  const W = Z.war, win = W.winnerFaction, H = HALK[win], s = W.scores?.sancak ?? W.elenthaScore ?? 0, o = W.scores?.ocak ?? W.kragmirScore ?? 0;
  const p = s + o > 0 ? (100 * s / (s + o)) : 50, R = Z.won ? ZAFER.win : ZAFER.lose;
  const mvps = (W.mvps || []).slice(0, 3);
  return `<div class="kz-cols">
    <section class="kz-sol">
      ${H ? `<img class="kz-bayrak" src="${H.bayrak}" alt="${H.ad} sancağı" width="512" height="512" decoding="async">` : ''}
      <h3 class="kz-galip">${H ? `${H.ad} Galip` : 'Berabere'}</h3>
      <small class="kz-tarih">Son halk savaşı · ${esc(W.warDate || '')}</small>
      <div class="kz-skor" role="img" aria-label="Elentha ${fmt(s)} – Kragmir ${fmt(o)}">
        <div class="kz-ad"><b class="el">Elentha</b><b class="kr">Kragmir</b></div>
        <div class="kz-bar"><i class="el" style="width:${p.toFixed(1)}%"></i><i class="kr"></i></div>
        <div class="kz-ad"><span>${fmt(s)}</span><span>${fmt(o)}</span></div>
      </div>
    </section>
    <section class="kz-sag">
      <h4>Savaşın İlk 3 Kahramanı</h4>
      <ol class="kz-mvp">${mvps.length ? mvps.map((m, i) => `<li class="${m.faction === 'ocak' ? 'kr' : 'el'}"><em>${i + 1}</em><b>${esc(m.name)}</b><span>${HALK[m.faction]?.ad || ''} · Sv. ${m.level}</span><i>${fmt(m.points)}</i></li>`).join('') : '<li class="bos">Kahraman kaydı yok</li>'}</ol>
      <div class="kz-odul${Z.claimedToday ? ' alindi' : ''}">
        <img src="img/p28/anit_zafer_sandigi.webp" alt="" width="256" height="256" decoding="async">
        <div class="kz-ot"><b>${R.name}</b><small>${odulMetni(Z.won)}</small></div>
        ${Z.claimedToday
          ? `<button class="kb-btn" disabled>Bugünkü Ödül Alındı<small class="kz-sayac">${ssdd(msToReset(now()))}</small></button>`
          : `<button class="kb-btn gold" data-a="zaferAl">Ödülü Al</button>`}
      </div>
    </section>
  </div>`;
}
const head = () => '<h2 class="kb-h kz-baslik">ZAFER ANITI</h2>';
const redraw = () => { if (binaAcik() === 'korant-modal-monument') binaCiz(null, body()); };
const stop = () => { clearInterval(tick); tick = 0; };

/** Zafer Anıtı penceresini açar (başkent hotspot'u `zaferAniti`); sayaç pencere kapanınca temizlenir. */
ACT.zaferAniti = async () => {
  Z = null;
  binaAc('korant-modal-monument', 'Zafer Anıtı', head(), body(), stop);
  const r = await run('zafer.view');
  if (!r || binaAcik() !== 'korant-modal-monument') return;
  Z = r.zafer; redraw();
  stop(); tick = setInterval(() => { const el = document.querySelector('#p28bina .kz-sayac'); if (el) el.textContent = ssdd(msToReset(now())); else if (!binaAcik()) stop(); }, 1000);
};
/** Günlük ödülü al; başkentteki altın bildirim noktası HUD yeniden çizilince söner. */
ACT.zaferAl = async () => {
  const r = await run('zafer.claim');
  if (r) { Z = r.zafer; toast(`${r.name}: +${fmt(r.akce)} Akçe · +${r.energy} Enerji`); }
  redraw(); hooks.hud();
};
/** Şartnamedeki adlar (takma ad). */
export const openMonumentModal = () => ACT.zaferAniti();
