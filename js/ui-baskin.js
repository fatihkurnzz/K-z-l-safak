// Dünya Baskını (Kapı → Etkinlikler kartı, Menü kısayolu, savaş sonucu satırı). Kurallar shared/baskin.js'tedir.
// Irk adları ve renkleri FACTIONS'tan okunur; ad değişirse kart kendiliğinden güncellenir.
import { S, now } from './api.js';
import { ACT, hooks, esc, fmt, closeModal } from './ui-core.js';
import { FACTIONS } from '../shared/content.js';
import { MOBS } from '../shared/zones.js';
import { STONES } from '../shared/items.js';
import { BASKIN, raidWindow } from '../shared/baskin.js';
import { startBattle } from './ui-battle.js';

const DAY = 86400000, HOUR = 3600000;
const left = ms => { ms = Math.max(0, ms); return ms >= DAY ? `${Math.floor(ms / DAY)}g ${Math.floor(ms % DAY / HOUR)}sa` : `${Math.floor(ms / HOUR)}sa ${Math.floor(ms % HOUR / 60000)}dk ${Math.floor(ms % 60000 / 1000)}sn`; };
const FK = Object.keys(FACTIONS);
const gName = g => (g.t === 'akce' ? `${fmt(g.n)} akçe` : g.t === 'stone' ? `${g.n} ${STONES[g.g]?.name || 'taş'}` : g.t === 'seal' ? `${g.n} Mühür Taşı` : g.t === 'ember' ? `${g.n} Tav Közü` : `${g.n}`);
const bossName = () => MOBS[BASKIN.boss]?.name || 'Kül Ağası';

// P29: üst afiş düz dosya (sahneler/banner_dunya_baskini.webp; kart açılınca iner). img olduğu için duzen.css'in :has(> svg.bk-boss) kuralı eşleşmez.
const BOSS_SVG = '<img class="p29-ban bk-ban" src="sahneler/banner_dunya_baskini.webp" alt="" decoding="async" draggable="false">';

function poolBar(D) {
  const p = Math.min(100, 100 * D.total / Math.max(1, D.target));
  const marks = D.bars.map((b, i) => `<span class="bk-mark ${D.tier > i ? 'on' : ''}" style="left:${b}%"><b>%${b}</b></span>`).join('');
  return `<div class="bk-pool" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.floor(p)}"><i style="width:${p}%"></i>${marks}</div>
    <div class="bk-sub"><span>Ortak hasar <b>${fmt(D.total)}</b> / ${fmt(D.target)}</span><span>Baraj <b>${D.tier}/${D.bars.length}</b></span></div>`;
}
function raceShare(D) {
  const t = FK.reduce((a, f) => a + (D.dmg[f] || 0), 0) || 1;
  return `<div class="bk-share">${FK.map(f => `<i style="width:${100 * (D.dmg[f] || 0) / t}%;background:${FACTIONS[f].color}"></i>`).join('')}</div>
    <div class="bk-sub">${FK.map(f => `<span style="color:${FACTIONS[f].color}"><b>${esc(FACTIONS[f].name)}</b> %${Math.round(100 * (D.dmg[f] || 0) / t)} · ${fmt(D.n[f] || 0)} kişi</span>`).join('')}</div>`;
}
const tiers = D => `<div class="bk-tiers">${BASKIN.gifts.map((g, i) => `<div class="${D.tier > i ? 'on' : ''}"><b>%${BASKIN.bars[i]}</b><span>${g.map(gName).join(', ')}</span></div>`).join('')}</div>`;

hooks.baskinCard = D => {
  if (!D) return '';
  const t = now(), W = raidWindow(t), lk = S.lvl < BASKIN.lvl, usedN = (S.daily && S.daily.baskin) || 0, can = W.open && !lk && usedN < BASKIN.tries;
  const clock = W.open ? `Bitişe <b class="bk-left" data-end="${W.end}">${left(W.end - t)}</b>` : `Cumartesi 00:00'a <b class="bk-left" data-end="${W.start}">${left(W.start - t)}</b>`;
  const both = FK.map(f => `<b style="color:${FACTIONS[f].color}">${esc(FACTIONS[f].name)}</b>`).join(' ve ');
  return `<div class="bk-card ${W.open ? 'open' : 'shut'}" id="bkCard">
    <div class="bk-scene">${BOSS_SVG}<div class="bk-title"><small>Dünya Baskını · Küllerin Tarikatı</small><b>${esc(bossName())}</b></div><span class="bk-clock">${clock}</span></div>
    <div class="bk-body">
      <p class="mut">Hafta içi rakip olan ${both}, hafta sonu aynı düşmana karşı birleşir: iki ırkın hasarı tek havuzda toplanır. Baraj geçildikçe saldırmış herkes (iki ırk) kademe ödülünü pazartesi postayla alır.</p>
      ${poolBar(D)}${tiers(D)}<h4>Irk katkısı</h4>${raceShare(D)}
      <div class="chips"><span class="chip">${W.open ? 'Açık' : 'Hafta sonu açılır'}</span><span class="chip">Bugün ${usedN}/${BASKIN.tries}</span>${D.me ? `<span class="chip">Katkın ${fmt(D.me.dmg)} · ${D.me.rank}.</span>` : ''}${lk ? `<span class="chip">Kilitli · Sv. ${BASKIN.lvl}</span>` : ''}</div>
      <div class="zbtns"><button class="btn red" data-a="baskinGo" ${can ? '' : 'disabled'}>Saldır</button></div>
      ${D.top.length ? `<h4>Katkı sıralaması <span class="mut">(iki ırk birlikte)</span></h4><div class="board bk-board">${D.top.map((r, i) => `<div class="${r.me ? 'me' : ''}"><span>${i + 1}.</span><b style="color:${FACTIONS[r.faction]?.color || 'inherit'}">${esc(r.name)}</b><span>${fmt(r.dmg)}</span></div>`).join('')}${D.me && D.me.rank > D.top.length ? `<div class="me"><span>${D.me.rank}.</span><b style="color:${FACTIONS[S.faction]?.color || 'inherit'}">${esc(S.name)}</b><span>${fmt(D.me.dmg)}</span></div>` : ''}</div>` : '<p class="mut">Bu hafta henüz kimse saldırmadı.</p>'}
    </div></div>`;
};
// Savaş sonucu satırı
hooks.baskinLine = r => {
  const R = r.raid;
  if (!R || R.total === undefined) return R ? `Ortak havuza yazılan hasar: <b>${fmt(R.d)}</b>` : '';
  return `Ortak havuza yazılan hasar: <b>${fmt(R.d)}</b> · havuz %${Math.floor(100 * R.total / Math.max(1, R.target))} · baraj ${R.tier}/${BASKIN.bars.length}${R.tier > R.was ? ' <b class="up">Yeni baraj geçildi!</b>' : ''}${R.rank ? ` · sıran ${R.rank}.` : ''}`;
};
ACT.baskinGo = () => startBattle({ mode: 'baskin' });
ACT.mnBaskin = () => { closeModal(); ACT.gate({ tab: 'events' }); };
ACT.baskin = ACT.mnBaskin;

// Geri sayım (kart açıkken saniyede bir)
setInterval(() => {
  const el = document.querySelector('#bkCard .bk-left');
  if (el) el.textContent = left(+el.dataset.end - now());
}, 1000);
