// Karaborsa penceresi (19 Kas): Yemin Pazarı'ndaki koyu tezgâh. 3×3 raf; her rafta indirim rozeti, eski ve yeni yakut fiyatı,
// alınınca "Alındı" mührü. Raf 8 saatte bir yenilenir (shared/karaborsa.js); geri sayım başlıkta.
import { icmSoz } from './ic-mekan.js'; // P33: kaçakçı başarı/başarısızlık satırı (GPT)
import { S, now } from './api.js';
import { ACT, esc, fmt, run, openWin, redraw, cur, reload, clockText, ico, lootToast, toast, confirmBox } from './ui-core.js';
import { itemBase, GRADES, gradeOf } from '../shared/items.js';
import { svg } from './icons.js';
// P29: üst afiş düz dosya sahneler/banner_karaborsa.webp (p24 ban_karaborsa kalktı; pencere açılınca iner)
const BAN = new URL('sahneler/banner_karaborsa.webp', document.baseURI).href; // tam adres: --ban p24-ekranlar.css'te çözülür (göreli yol css/ altına düşerdi)

const GEM = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h10l4 6-9 12L3 9z" fill="#ff3a5a"/><path d="M7 3l5 6 5-6M3 9h18M12 9v12" stroke="#ffb3c0" stroke-width="1" fill="none" opacity=".7"/></svg>';
const goodsIcon = g => svg(g.t === 'stone' ? 'anvil' : g.t === 'charm' ? 'star' : g.t === 'seal' ? 'key' : g.t === 'dust' ? 'gem' : 'gift');
let tick = null;

function card(o, got) {
  const it = o.give.t === 'item' ? { b: o.give.b, g: o.give.g, p: 1 } : null, B = it && itemBase(it.b);
  const g = it ? gradeOf(it.b, it.g) : null, gc = g != null ? GRADES[g].color : '#c9b8ff';
  const name = it ? B.name : o.name, sub = it ? `${GRADES[g].name} · ${B.req > 1 ? `Sv. ${B.req}` : 'şartsız'}` : 'Malzeme';
  const pic = it ? ico(it, 'kb-ico') : `<span class="kb-gico">${goodsIcon(o.give)}</span>`;
  return `<article class="kb-card k-card2${got ? ' got' : ''}" style="--gc:${gc}">
    <span class="kb-off">−%${o.disc}</span>
    <div class="kb-pic">${pic}</div>
    <b class="kb-name" title="${esc(name)}">${esc(name)}</b><small class="kb-sub">${esc(sub)}</small>
    <div class="kb-price"><s>${fmt(o.base)}</s><span>${GEM}${fmt(o.price)}</span></div>
    ${got ? '<span class="kb-seal">Alındı</span>' : `<button class="kb-buy k-btn1" data-a="kbBuy" data-i="${o.i}" ${S.yakut < o.price ? 'data-poor="1"' : ''}>Satın al</button>`}
  </article>`;
}
function page() {
  const D = cur()?.data;
  if (!D) return '<p class="mut">Karaborsa açılıyor…</p>';
  const left = Math.max(0, D.ends - now());
  const ban = BAN;
  return `<div class="kb">
    <header class="kb-head${ban ? ' kb-ban' : ''}"${ban ? ` style="--ban:url(${ban})"` : ''}><div><small>Yemin Pazarı'nın gölgesinde</small><h3>Karaborsa</h3><p>Raf her 8 saatte bir değişir. Her ürün bu dönemde yalnız bir kez alınır; fiyatlar %5–25 indirimlidir.</p></div>
      <div class="kb-clock"><small>Yeni raf</small><b id="kbleft">${clockText(left)}</b><span class="kb-wal">${GEM}${fmt(S.yakut)}</span></div></header>
    <div class="kb-grid">${D.offers.map(o => card(o, D.got.includes(o.i))).join('')}</div></div>`;
}
ACT.karaborsa = () => {
  clearInterval(tick);
  openWin({ title: 'Karaborsa', load: () => run('karaborsa.view'), render: page });
  tick = setInterval(() => {
    const w = cur(); if (!w || w.title !== 'Karaborsa') return clearInterval(tick);
    const el = document.getElementById('kbleft'); if (!el || !w.data) return;
    const left = w.data.ends - now(); if (left <= 0) { w.data = null; reload(); return; }
    el.textContent = clockText(left);
  }, 1000);
};
ACT.kbBuy = d => {
  const w = cur(), o = w?.data?.offers?.[+d.i]; if (!o) return;
  if (S.yakut < o.price) { icmSoz('basarisizlik'); return toast('Yeterli yakut yok.'); }
  const name = o.give.t === 'item' ? itemBase(o.give.b).name : o.name;
  confirmBox('Karaborsa', `<b>${esc(name)}</b> · ${fmt(o.price)} yakut (%${o.disc} indirim). Alınsın mı?`, async () => {
    const r = await run('karaborsa.buy', { i: o.i });
    icmSoz(r ? 'basari' : 'basarisizlik');
    if (!r) return;
    lootToast(r.loot);
    w.data.got = [...w.data.got, o.i]; redraw();
  });
};
