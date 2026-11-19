// Zindanlar (Kapı → Zindanlar): her zindan küçük bir sahne çizimi ve ilerleme yoluyla gösterilir.
//  Dipsiz Kuyu: dalga yolu (en iyi dalgaya kadar yanar) · Yeraltı Ocağı: inen kat şaftı (beşte bir boss) ·
//  Gök Yarığı: haftanın günleri ve günlük haklar · Mühürlü Oda: elindeki mühür taşları.
// Kural yok: haklar ve kilitler S ve RULES tablolarından okunur; girişler eski "mode" akışını kullanır.
import { S, now, DEV } from './api.js';
import { ACT, hooks, fmt, locked } from './ui-core.js';
import { UNLOCK, weekDay } from '../shared/content.js';
import { CLIMB, seasonEndAt } from '../shared/pvp.js';
import { RULES } from '../shared/rules.js';
import { ri } from './icons.js';
import { modBanner } from './ui-pvp.js';

const used = k => S.daily[k] || 0;
const DAY = 86400000, HOUR = 3600000;
const left = ms => (ms >= DAY ? `${Math.floor(ms / DAY)}g ${Math.floor(ms % DAY / HOUR)}sa` : `${Math.floor(ms / HOUR)}sa ${Math.floor(ms % HOUR / 60000)}dk`);

// ---- Mini sahneler (SVG) ----
const SCENE = {
  well: `<svg viewBox="0 0 160 90" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><radialGradient id="zwA" cx=".5" cy=".55" r=".6"><stop offset="0" stop-color="#0a1a22"/><stop offset="1" stop-color="#000"/></radialGradient></defs>
    <rect width="160" height="90" fill="#16222a"/><path d="M0 70 Q40 60 80 66 T160 62 V90 H0Z" fill="#22303a"/>
    <ellipse cx="80" cy="56" rx="44" ry="13" fill="url(#zwA)" stroke="#6b7c86" stroke-width="5"/>
    <path d="M36 56 V74 Q80 92 124 74 V56" fill="#4a565e" stroke="#2a3238" stroke-width="2"/><path d="M40 64 h80 M44 72 h72" stroke="#2a3238" stroke-width="2" opacity=".7"/>
    <path d="M48 56 V18 M112 56 V18 M44 18 H116" stroke="#5a3a20" stroke-width="5" stroke-linecap="round"/><path d="M80 18 V44" stroke="#c9b48a" stroke-width="1.5"/><rect x="74" y="44" width="12" height="9" rx="2" fill="#7a5a32"/>
    <g fill="#7fd6ff" opacity=".6" class="zfly"><circle cx="70" cy="54" r="1.5"/><circle cx="92" cy="57" r="1.2"/><circle cx="82" cy="52" r="1"/></g></svg>`,
  depth: `<svg viewBox="0 0 160 90" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="160" height="90" fill="#1d1410"/><path d="M0 0 H160 V14 Q120 22 80 16 T0 18Z" fill="#33241a"/>
    <path d="M58 14 L50 90 H110 L102 14Z" fill="#0d0907"/><g stroke="#6a4a2a" stroke-width="4"><path d="M56 30 H104 M54 52 H106 M52 74 H108"/></g><g stroke="#3e2a18" stroke-width="3"><path d="M58 14 L50 90 M102 14 L110 90"/></g>
    <path d="M72 16 L68 90 M88 16 L92 90" stroke="#8a8f96" stroke-width="2"/><path d="M68 30 h24 M67 42 h26 M66 54 h28 M65 66 h30 M64 78 h32" stroke="#8a8f96" stroke-width="1.5"/>
    <circle cx="40" cy="40" r="5" fill="#ffb347" class="zflk"/><circle cx="40" cy="40" r="14" fill="#ffb34733"/><circle cx="122" cy="62" r="4" fill="#ffb347" class="zflk"/><circle cx="122" cy="62" r="12" fill="#ffb34722"/>
    <g fill="#c050ff"><path d="M18 70 l6-10 6 10z"/><path d="M134 30 l5-9 5 9z"/></g></svg>`,
  rift: `<svg viewBox="0 0 160 90" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><radialGradient id="zrA" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff"/><stop offset=".35" stop-color="#b6a0ff"/><stop offset="1" stop-color="#3a1a6a" stop-opacity="0"/></radialGradient></defs>
    <rect width="160" height="90" fill="#140c26"/><g fill="#fff" opacity=".7"><circle cx="20" cy="14" r="1"/><circle cx="140" cy="20" r="1.2"/><circle cx="110" cy="8" r=".8"/><circle cx="34" cy="40" r=".9"/></g>
    <path d="M0 78 L30 64 L56 74 L80 60 L106 72 L132 62 L160 74 V90 H0Z" fill="#241640"/>
    <g class="zspin"><ellipse cx="80" cy="42" rx="20" ry="32" fill="url(#zrA)"/></g><path d="M80 12 L74 30 L84 40 L74 54 L82 72" stroke="#fff" stroke-width="2" fill="none" opacity=".8"/>
    <g fill="#9fe6ff"><path d="M30 50 l4-8 4 8-4 6z"/><path d="M124 42 l3-7 3 7-3 5z"/></g></svg>`,
  seal: `<svg viewBox="0 0 160 90" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="160" height="90" fill="#1a1512"/><g fill="#2a221c" stroke="#120e0b" stroke-width="1"><rect x="0" y="0" width="40" height="20"/><rect x="40" y="0" width="40" height="20"/><rect x="80" y="0" width="40" height="20"/><rect x="120" y="0" width="40" height="20"/><rect x="-20" y="20" width="40" height="20"/><rect x="140" y="20" width="40" height="20"/></g>
    <path d="M44 90 V40 Q80 6 116 40 V90Z" fill="#3a2a1e" stroke="#120e0b" stroke-width="3"/><path d="M50 90 V44 Q80 16 110 44 V90Z" fill="#5a3e26"/><path d="M80 18 V90" stroke="#2a1d12" stroke-width="2"/>
    <g stroke="#8a8f96" stroke-width="3"><path d="M50 56 H110 M50 76 H110"/></g><circle cx="80" cy="58" r="11" fill="#7a1a1a" stroke="#e7c75a" stroke-width="2" class="zglow"/><path d="M80 51 l3 6 6 1-4.5 4 1 6-5.5-3-5.5 3 1-6-4.5-4 6-1z" fill="#e7c75a"/>
    <g fill="#ff7a3a" class="zflk"><circle cx="30" cy="54" r="3"/><circle cx="130" cy="54" r="3"/></g></svg>`,
};

// ---- İlerleme yolları ----
const pips = (n, on, cls = '', mark = () => '') => `<div class="zt ${cls}">${Array.from({ length: n }, (_, i) => `<i class="${i < on ? 'on' : ''} ${i === on ? 'cur' : ''} ${mark(i)}"><b>${i + 1}</b></i>`).join('')}</div>`;
function depthTrack() {
  const f = Math.min(S.depth, CLIMB.floors), start = Math.max(0, Math.min(CLIMB.floors - 10, f - 4)), n = Math.min(10, CLIMB.floors);
  return `<div class="zt shaft">${Array.from({ length: n }, (_, k) => { const fl = start + k + 1; return `<i class="${fl <= f ? 'on' : ''} ${fl === f + 1 ? 'cur' : ''} ${fl % CLIMB.bossEvery === 0 ? 'boss' : ''}"><b>${fl}</b></i>`; }).join('')}</div>
    <div class="pbar zbar"><i style="width:${100 * f / CLIMB.floors}%"></i></div>`;
}
const DAYS = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'];
const riftTrack = () => { const wd = weekDay(now()); return `<div class="zt days">${DAYS.map((d, i) => `<i class="${i >= 5 ? 'on' : ''} ${i === wd ? 'cur' : ''}"><b>${d}</b></i>`).join('')}</div>`; };

function card(id, name, desc, scene, track, chips, btn, lockKey) {
  const lk = lockKey && locked(lockKey);
  return `<div class="zcard z-${id} ${lk ? 'lock' : ''}"><div class="zscene">${scene}${lk ? `<span class="zlock">${ri('lock')} Sv. ${UNLOCK[lockKey]}</span>` : ''}<b class="zname">${name}</b></div>
    <div class="zbody"><p class="mut">${desc}</p>${track}<div class="chips">${chips.map(c => `<span class="chip">${c}</span>`).join('')}</div><div class="zbtns">${btn}</div></div></div>`;
}
const enter = (m, ok, label = 'Gir') => `<button class="btn red" data-a="mode" data-m="${m}" ${ok ? '' : 'disabled'}>${label}</button>`;

hooks.dungeons = () => {
  const weekend = weekDay(now()) >= 5 || DEV, W = RULES.well, dDone = S.depth >= CLIMB.floors, canSweep = !locked('depth') && S.depth < (S.depthPrev || 0);
  return `${modBanner()}<div class="hint">Zindanlar enerji yerine günlük hak ya da anahtar ister. Düşmanlar seviyene göre kurulur. Yolu ilerlettikçe ödüller büyür.</div>
  <div class="zgrid">
    ${card('well', 'Dipsiz Kuyu', `${W.waves} dalga dayan; geçtiğin her dalga bir bileği taşı verir.`, SCENE.well,
      pips(W.waves, S.wellBest || 0, 'waves', i => (i === W.waves - 1 ? 'boss' : '')), [`Bugün ${used('well')}/${W.daily}`, `En iyi ${S.wellBest || 0}/${W.waves}`],
      enter('well', !locked('well') && used('well') < W.daily), 'well')}
    ${card('depth', 'Yeraltı Ocağı', 'Kat kat in; her kat ilk geçişte taş ve Nadir eşya verir. Beş katta bir boss.', SCENE.depth, depthTrack(),
      [dDone ? `Dönem tamam ${CLIMB.floors}/${CLIMB.floors}` : `Sıradaki kat ${S.depth + 1}/${CLIMB.floors}`, `${CLIMB.energy} enerji`, `Sıfırlanma ${left(seasonEndAt(now()) - now())}`],
      `${enter('depth', !locked('depth') && !dDone, 'İn')}${canSweep ? '<button class="btn sm blue" data-a="depthSweep">Seri iniş</button>' : ''}<button class="btn sm" data-a="depthFloors">Katlar</button>`, 'depth')}
    ${card('rift', 'Gök Yarığı', 'Yalnızca cumartesi ve pazar açılır; Kader Çarkı için parça verir.', SCENE.rift, riftTrack(),
      [weekend ? 'Açık' : 'Hafta sonu açılır', `Bugün ${used('rift')}/${RULES.rift.daily}`, `${RULES.rift.waves} dalga`],
      enter('rift', !locked('rift') && weekend && used('rift') < RULES.rift.daily), 'rift')}
    ${card('seal', 'Mühürlü Oda', `Bir Mühür Taşı harcar; rastgele bir boss çıkar. Eşsiz şansı ${RULES.seal.unique} kat.`, SCENE.seal,
      `<div class="zt seals">${Array.from({ length: Math.min(8, Math.max(S.seals, 1)) }, (_, i) => `<i class="${i < S.seals ? 'on' : ''}">${ri('seal')}</i>`).join('')}${S.seals > 8 ? `<em>+${fmt(S.seals - 8)}</em>` : ''}</div>`,
      [`${S.seals} Mühür Taşı`, 'Günlük sınır yok'], enter('seal', !locked('seal') && S.seals > 0, 'Mührü kır'), 'seal')}
  </div>`;
};
