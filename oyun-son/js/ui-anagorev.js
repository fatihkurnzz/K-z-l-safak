// ui-anagorev.js — Görevler penceresi: Ana Görevler ağacı + Günlük / Haftalık / Aylık sekmelerinin ayrışan görünümü.
// ACT.quests({tab:'main'|'daily'|'weekly'|'monthly'}) giriş noktasıdır (öğretici de bunu çağırabilir). Kural: shared/anagorev.js.
// Günlük/Haftalık/Aylık sayfalarını ui-kalicilik.js çizer; burada onun açtığı pencereye sekme ve çerçeve eklenir.
import { ACT, esc, cur, closeWin, doAct, lootChip, lootToast } from './ui-core.js';
import { S } from './api.js';
import { svg } from './icons.js';
import { QUESTS } from '../shared/content.js';
import { questProgress } from '../shared/calc.js';
import { weeklyReady, monthlyReady } from '../shared/meta.js';
import { MQ, MQ_CHAPTERS, MQ_BY, mqState, mqProg, mqDone, mqReady, mqNext } from '../shared/anagorev.js';

const ICON = { gate: 'battle', party: 'party', anvil: 'forge', mine: 'mine', quests: 'quest', market: 'market', wheel: 'gift', hall: 'crown', meydan: 'arena', clan: 'clan', partyPath: 'trophy', dungeons: 'dungeon' };
const GO = {
  gate: () => ACT.gate({ tab: 'zones' }), dungeons: () => ACT.gate({ tab: 'dungeons' }), party: () => ACT.party(), anvil: () => ACT.anvil(), mine: () => ACT.mine(),
  quests: () => ACT.quests({ tab: 'daily' }), market: () => ACT.market(), wheel: () => ACT.wheel(), hall: () => ACT.hall(), meydan: () => ACT.meydan({ tab: 'fight' }),
  clan: () => ACT.clan(), partyPath: () => ACT.partyPath(),
};
const TABS = [['main', 'Ana Görevler', 'Rehber ve ödül', 'crown'], ['daily', 'Günlük', '00:00’da yenilenir', 'quest'], ['weekly', 'Haftalık', 'Pazartesi yenilenir', 'trophy'], ['monthly', 'Aylık', 'Ayın 1’inde yenilenir', 'trophy']];
const BAND = { main: ['Ana Görevler', 'Oyunu öğren, yolda ilerle, her adımda ödül al'], daily: ['Günlük Görevler', 'Her gün 00:00’da yenilenir'], weekly: ['Haftalık Görevler', 'Pazartesi 00:00’da yenilenir'], monthly: ['Aylık Görevler', 'Her ayın 1’inde yenilenir'] };
const V = { sel: null };

const tabsOf = counts => TABS.map(([id, label, small, ic]) => { const n = counts[id] || 0;
  return { id, label, small: n ? `${n} ödül hazır` : small, pre: `<span class="tico">${svg(ic)}</span>${n ? `<b class="qx-bd">${n}</b>` : ''}` }; });
const tabNav = cfg => cfg.tabs.map(t => `<button data-a="tab" data-id="${t.id}" class="${t.id === cfg.tab ? 'on' : ''}">${t.pre}<span>${t.label}${t.small ? `<small>${t.small}</small>` : ''}</span></button>`).join('');
const band = id => `<div class="qx-band"><i>${svg(TABS.find(t => t[0] === id)[3])}</i><b>${BAND[id][0]}</b><span>${BAND[id][1]}</span></div>`;

// Yerleşim: her bölüm bir sütun; içinde a üstte, b ve c yan yana ortada, d altta. Bölümün d'si sonraki bölümün a'sına bağlanır.
const NW = 100, NH = 46, CW = 226, TOP = 30, RH = 58;
const pos = n => { const L = 10 + (n.ch - 1) * CW; return { x: L + { a: 55, b: 0, c: 110, d: 55 }[n.pos], y: TOP + { a: 0, b: 1, c: 1, d: 2 }[n.pos] * RH }; };
const TREE_W = 10 + MQ_CHAPTERS.length * CW, TREE_H = TOP + 2 * RH + NH + 8;
function node(n) {
  const st = mqState(S, n), { x, y } = pos(n);
  const lk = st === 'locked';
  return `<button class="mq-n ${st} ${V.sel === n.id ? 'sel' : ''}" style="left:${x}px;top:${y}px" data-a="mqSel" data-id="${n.id}" aria-label="${esc(n.ad)}">
    <span class="mq-ic">${lk ? svg('lock') : svg(ICON[n.go] || 'quest')}</span><b>${esc(n.ad)}</b>
    ${st === 'done' ? '<i class="mq-seal">✓</i>' : st === 'ready' ? '<i class="mq-al">Al</i>' : ''}</button>`;
}
function lines() {
  const d = mqDone(S), paths = [];
  for (const n of MQ) for (const pid of n.pre) {
    const a = pos(MQ_BY[pid]), b = pos(n);
    let p;
    if (b.y > a.y) { const x1 = a.x + NW / 2, y1 = a.y + NH, x2 = b.x + NW / 2, y2 = b.y, my = (y1 + y2) / 2; p = `M${x1} ${y1} C${x1} ${my} ${x2} ${my} ${x2} ${y2}`; }
    else { const x1 = a.x + NW, y1 = a.y + NH / 2, x2 = b.x, y2 = b.y + NH / 2, mx = (x1 + x2) / 2; p = `M${x1} ${y1} C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`; }
    paths.push(`<path class="${d[pid] ? 'on' : ''}" d="${p}"/>`);
  }
  return `<svg class="mq-lines" width="${TREE_W}" height="${TREE_H}" viewBox="0 0 ${TREE_W} ${TREE_H}">${paths.join('')}</svg>`;
}
function detail() {
  const n = MQ_BY[V.sel] || mqNext(S) || MQ.at(-1), st = mqState(S, n), pr = mqProg(S, n), ch = MQ_CHAPTERS[n.ch - 1];
  const pre = n.pre.filter(x => !mqDone(S)[x]).map(x => MQ_BY[x].ad);
  const act = st === 'done' ? '<span class="mq-got">Alındı</span>' : st === 'ready' ? `<button class="btn green" data-a="mqClaim" data-id="${n.id}">Ödülü al</button>`
    : st === 'locked' ? `<span class="mq-need">Önce: ${pre.map(esc).join(', ')}</span>` : '';
  return `<aside class="mq-det ${st}"><small class="mq-ch">${n.ch}. Bölüm · ${esc(ch.name)}</small><h3>${esc(n.ad)}</h3><p>${esc(n.acik)}</p>
    <div class="mq-pr"><div class="pbar"><i style="width:${100 * pr / n.need}%"></i></div><b>${pr}/${n.need}</b></div>
    <div class="mq-rw"><small>Ödül</small>${n.reward.map(lootChip).join(' ')}</div>
    <div class="mq-btns">${st === 'locked' || st === 'done' ? '' : `<button class="btn blue" data-a="mqGo" data-id="${n.id}">Git</button>`}${act}</div></aside>`;
}
function mainHtml() {
  if (!V.sel || !MQ_BY[V.sel]) V.sel = mqNext(S)?.id || MQ.at(-1).id;
  const done = Object.keys(mqDone(S)).filter(k => MQ_BY[k]).length, heads = MQ_CHAPTERS.map((c, i) => {
    const all = MQ.filter(n => n.ch === c.id), got = all.filter(n => mqDone(S)[n.id]).length;
    return `<div class="mq-chh ${got === all.length ? 'full' : ''}" style="left:${10 + i * CW}px"><b>${c.id}. ${esc(c.name)}</b><small>${got}/${all.length}</small></div>`;
  }).join('');
  return `<div class="qx-scope qx-main">${band('main')}
    <div class="mq-prog"><div class="pbar"><i style="width:${100 * done / MQ.length}%"></i></div><b>${done}/${MQ.length}</b></div>
    <div class="mq-wrap"><div class="mq-tree"><div class="mq-in" style="width:${TREE_W}px;height:${TREE_H}px">${heads}${lines()}${MQ.map(node).join('')}</div></div>${detail()}</div></div>`;
}

let old = null;
const counts = () => ({ main: mqReady(S), daily: QUESTS.filter(q => questProgress(S, q) >= q.need && !S.daily.qdone[q.id]).length + (S.daily.gift ? 0 : 1), weekly: weeklyReady(S), monthly: monthlyReady(S) });
function open(d) {
  const tab = TABS.some(t => t[0] === d?.tab) ? d.tab : 'main';
  if (d?.id && MQ_BY[d.id]) V.sel = d.id; else if (tab === 'main') V.sel = mqNext(S)?.id || null;
  old(tab === 'main' ? { tab: 'daily' } : { tab });
  const cfg = cur(); if (!cfg) return;
  const render = cfg.render; 
  cfg.tab = tab; cfg.tabs = tabsOf(counts());
  cfg.render = t => { nav(); return t === 'main' ? mainHtml() : `<div class="qx-scope qx-${t}">${band(t)}${render(t)}</div>`; };
  nav(); redrawNow();
  requestAnimationFrame(() => { const el = document.querySelector('.mq-n.sel'), tr = document.querySelector('.mq-tree'); if (el && tr) tr.scrollLeft = Math.max(0, el.offsetLeft - tr.clientWidth / 2 + NW / 2); });
}
function nav() {
  const cfg = cur(), el = document.querySelector('#win nav.tabs'); if (!cfg || !el) return;
  cfg.tabs = tabsOf(counts()); el.innerHTML = tabNav(cfg); // ödül alınınca sayım rozetleri tazelenir
}
const redrawNow = () => { const cfg = cur(); const pg = document.querySelector('#page'); if (cfg && pg) { pg.innerHTML = cfg.render(cfg.tab); } };

old = ACT.quests;
ACT.quests = open;
ACT.mqSel = d => { V.sel = d.id; const pg = document.querySelector('#page'), sc = document.querySelector('.mq-tree')?.scrollLeft || 0; redrawNow(); const tr = document.querySelector('.mq-tree'); if (tr) tr.scrollLeft = sc; if (pg) nav(); };
ACT.mqClaim = async d => {
  const r = await doAct('mq.claim', { id: d.id });
  if (r) { lootToast(r.loot); V.sel = mqNext(S)?.id || d.id; const sc = document.querySelector('.mq-tree')?.scrollLeft || 0; redrawNow(); const tr = document.querySelector('.mq-tree'); if (tr) tr.scrollLeft = sc; nav(); }
};
ACT.mqGo = d => { const n = MQ_BY[d.id]; if (!n) return; closeWin(); GO[n.go]?.(); };
ACT.mqTrack = d => { const n = MQ_BY[d.id]; if (!n) return; if (mqState(S, n) === 'ready') ACT.quests({ tab: 'main', id: n.id }); else { GO[n.go]?.(); } };
