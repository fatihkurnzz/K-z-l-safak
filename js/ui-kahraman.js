// Karakter ekranı ana görünümü (19 Kas gece, kullanıcının karakter/envanter referansı): üç bölüm yan yana.
//  1) Kahraman: başlık (portre, "Sv.X Ad", halk), iki yanda ekipman yuvaları, ortada döndürülebilir 3B görünüm
//     (portraits.js 'big', 45° adım; ekipman değişince yeniden çizilir), altta sınıf ve ağaç şeridi.
//  2) Özellikler: Savaş Gücü, temel değerler, nitelikler (+ ile puan), dağıtılabilir puan, sıfırlama.
//  3) Envanter: süzgeç sekmeleri, eşya ızgarası, çanta doluluğu ve akçe. Eşyaya dokununca bilgi kartı (Kuşan, Çıkar,
//     Güçlendir, Sat, Parçala). Yuvaya dokununca ızgara o yuvaya uyan eşyalara süzülür.
// Bütün işlemler var olan eylemlerle yapılır (item.equip / item.unequip / item.sell / item.dismantle / stat.add / stat.reset).
import { S } from './api.js';
import { ACT, esc, fmt, pct, toast, confirmBox, doAct, redraw, showModal, closeModal, ico, slotIco, heroView, avatarImg } from './ui-core.js';
import { ri } from './icons.js';
import { sprUrl } from './karakter-png.js'; // 2B tam boy (C6)
import { B2D, t3Mi, t3Resim } from './yaratik2d.js'; // P26 G1: Sv.45+ Savaşçı yüksek kademe görünümü
import { invGrid, itemCard, sortItems, cmpWith } from './ui-envanter.js';
import { CLASSES, STATS, STAT_KEYS, BAG_LIMIT, FACTIONS } from '../shared/content.js';
import { SLOTS, itemBase, itemName, sellPrice, dustYield, GRADES, gradeOf } from '../shared/items.js';
import { heroStats, power, statPointsFree, equippedIds, ownerOf, itemOf, heroItemLevel, statTotals, partyUnits, treeOf } from '../shared/hero.js';
import { clsOf, mainId } from '../shared/roster.js';
import { PATHS, pathOf } from '../shared/paths.js';

// Görünüm durumu: rot = 3B açı (0..7), f = envanter süzgeci, sel = seçili eşya, slot = seçili yuva
export const KV = { rot: 0, f: 'all', sel: null, slot: null };
const SL = ['helm', 'chest', 'legs', 'gloves', 'boots', 'belt'], SR = ['wr', 'wl', 'neck', 'ear1', 'ear2', 'ring1', 'ring2'];
const FILT = [['all', 'Hepsi'], ['weapon', 'Silah'], ['armor', 'Zırh'], ['jewel', 'Takı'], ['free', 'Boşta']];
const RQ = { str: 'STR', vit: 'HP', dex: 'DEX', int: 'INT', mp: 'MP' };

function slotBtn(h, s) {
  const it = itemOf(S, h.eq[s]);
  return `<button class="kx-slot ${KV.slot === s ? 'sel' : ''} ${it ? 'full' : ''}" data-a="kxSlot" data-s="${s}" title="${SLOTS[s]}${it ? ': ' + esc(itemName(it)) : ''}">${it ? ico(it) : slotIco(s)}<small>${SLOTS[s]}</small></button>`;
}
const fits = (it, s, cls) => { const B = itemBase(it.b); return B.slots.includes(s) && (!B.cls || B.cls.includes(cls)); };
function passes(x, eq, cls) {
  if (KV.slot) return fits(x, KV.slot, cls);
  const k = itemBase(x.b).kind;
  return KV.f === 'all' || (KV.f === 'free' ? !eq.has(x.id) : k === KV.f || (KV.f === 'weapon' && k === 'shield'));
}

export function kxView(hid, tabsHtml = '') {
  const h = S.heroes[hid], cls = clsOf(S, hid), C = CLASSES[cls], st = heroStats(S, hid), u = partyUnits(S)[0] || {};
  const F = FACTIONS[S.faction] || {}, P = pathOf(h), free = statPointsFree(S, hid), T = statTotals(S, hid), eq = equippedIds(S);
  const head = `<div class="kx-head">${avatarImg('kx-ava')}<div><b><em>Sv.${S.lvl}</em> ${esc(S.name)}</b><span class="kx-fac" style="--fc:${F.color || '#c9a24a'}"><i></i>${esc(F.name || '')} · ${esc(C.name)}${P && PATHS[P] ? ` · ${esc(PATHS[P].role)}` : ''}</span></div></div>`;
  // 23 Kas (C6 · M4 maketi): ortada boyalı 2B tam boy kahraman (karakter-png); döndürme yalnız eski 3B görünümde (dd_b2d='0')
  // P28 M1: t3 yalnız halk+sınıf+cinsiyet eşleşirse (yaratik2d.js T3.art); yoksa kendi cinsiyetinin normal görseli
  const t3 = B2D.on && t3Mi(cls, S.lvl, S.char?.gender, S.faction) && t3Resim(S.faction, () => { if (document.querySelector('#win .kx')) redraw(); }); // inince pencere yeniden çizilir
  const c2 = t3 || (B2D.on && S.char && sprUrl(S.char.race || S.faction, S.char.cls || cls, S.char.gender));
  // P24 (G4): karakterin arkasında ırka göre taş kaide; görsel ilk açılışta yüklenir, yüklenince pencere yeniden çizilir
  // P29: kaide zemini karakter seçim sahnesinden (sahneler/karakter_secim_*; --kx-stage css/p28-arka.css'te, pencere açılınca iner)
  const model = c2 ? `<div class="kx-model kx-2b"><img class="kx-hero2b${t3 ? ' p26-t3' : ''}" src="${c2}" alt="${esc(C.name)}" draggable="false"><span class="kx-ilv" title="Eşya seviyesi">Eşya Sv. ${heroItemLevel(S, hid)}</span></div>`
    : `<div class="kx-model"><button class="kx-rot l" data-a="kxRot" data-d="-1" title="Sola döndür">‹</button>${heroView(hid, KV.rot)}<button class="kx-rot r" data-a="kxRot" data-d="1" title="Sağa döndür">›</button><span class="kx-ilv" title="Eşya seviyesi">Eşya Sv. ${heroItemLevel(S, hid)}</span></div>`;
  const trees = treeOf(cls).map(t => `<span class="${P && PATHS[P]?.tree === t.key ? 'on' : ''}">${esc(t.name)}</span>`).join('');
  const hero = `<div class="kx-hero">${head}<div class="kx-doll"><div class="kx-col">${SL.map(s => slotBtn(h, s)).join('')}</div>${model}<div class="kx-col">${SR.map(s => slotBtn(h, s)).join('')}</div></div>
    <div class="kx-cls"><b>${esc(C.name)}${P && PATHS[P] ? ` · ${esc(PATHS[P].role)}` : ''}</b><span class="kx-trees">${trees}</span></div></div>`;
  const row = (icon, l, v) => `<div class="kx-r">${ri(icon)}<span>${l}</span><b>${v}</b></div>`;
  const base = [row('hp', 'Can', fmt(st.maxHp)), u.maxMp ? row('mag', 'Mana', fmt(u.maxMp)) : '', row('atk', 'Saldırı', fmt(st.atk)), st.mag ? row('mag', 'Büyü', fmt(st.mag)) : '',
    st.fire ? row('mag', 'Alev Hasarı', fmt(st.fire)) : '', st.bolt ? row('mag', 'Yıldırım Hasarı', fmt(st.bolt)) : '', row('def', 'Savunma', fmt(st.def)), row('crit', 'Kritik Oran', pct(st.crit)), st.critDmg ? row('crit', 'Kritik Hasar', pct(st.critDmg)) : ''].join('');
  const attrs = STAT_KEYS.map(k => `<div class="kx-a ${C.main === k ? 'main' : ''}" title="${esc(STATS[k].desc)}"><span>${STATS[k].name} <small>${RQ[k]}</small></span><b>${T[k]}</b><button class="kx-plus" data-a="sp" data-k="${k}" data-n="1" ${free >= 1 ? '' : 'disabled'} aria-label="${STATS[k].name} +1">+</button></div>`).join('');
  const stats = `<div class="kx-stats"><div class="kx-pow">${ri('power')}<span><small>Savaş Gücü</small><b>${fmt(power(st))}</b></span></div>
    <h4>Temel Özellikler</h4><div class="kx-base">${base}</div><h4>Nitelikler</h4>${attrs}
    <div class="kx-free">Dağıtılabilir Puan: <b class="${free ? 'on' : ''}">${free}</b></div><button class="kx-reset" data-a="statReset">${ri('list')}Sıfırla</button></div>`;
  const list = sortItems(S.items.filter(x => passes(x, eq, cls)));
  const tabs = KV.slot ? `<div class="kx-ftabs"><button class="on">${SLOTS[KV.slot]}</button><button data-a="kxSlot" data-s="${KV.slot}">✕ Süzgeci kaldır</button></div>`
    : `<div class="kx-ftabs">${FILT.map(([k, n]) => `<button data-a="kxF" data-id="${k}" class="${KV.f === k ? 'on' : ''}">${n}</button>`).join('')}</div>`;
  const bag = `<div class="kx-bag">${tabs}<div class="kx-grid">${invGrid(list, { act: 'kxPick', sel: KV.sel, fill: KV.slot || KV.f !== 'all' ? 0 : Math.max(list.length, 25), empty: KV.slot ? 'Çantanda bu yuvaya uyan eşya yok.' : 'Bu türde eşya yok.' })}</div>
    <div class="kx-foot"><span class="${S.items.length >= BAG_LIMIT ? 'warn' : ''}">${ri('bag')}${S.items.length} / ${BAG_LIMIT}</span><button class="kx-bulk" data-a="breakWin" title="Örs: toplu sat ya da parçala">${ri('shatter')}Toplu</button><span>${ri('akce')}${fmt(S.akce)}</span></div></div>`;
  return `<div class="kx">${hero}${stats}${bag}</div>`;
}

// ---- Eşya bilgi kartı ve işlemler ----
function cardFor(it) {
  const hid = mainId(S), cls = clsOf(S, hid), eq = equippedIds(S).has(it.id), mine = eq && ownerOf(S, it.id) === hid;
  const slotOfIt = mine ? Object.keys(S.heroes[hid].eq).find(s => S.heroes[hid].eq[s] === it.id) : null;
  const can = (itemBase(it.b).slots || []).length && (!itemBase(it.b).cls || itemBase(it.b).cls.includes(cls));
  const acts = [
    mine ? `<button class="btn sm" data-a="kxUnequip" data-s="${slotOfIt}">Çıkar</button>` : can ? `<button class="btn sm green" data-a="kxEquip" data-id="${it.id}">Kuşan</button>` : '<span class="mut">Bu sınıf kuşanamaz.</span>',
    `<button class="btn sm" data-a="kxUp" data-id="${it.id}">Güçlendir</button>`,
    !eq && !it.nt ? `<button class="btn sm" data-a="kxSell" data-id="${it.id}" data-op="sell">Sat · ${fmt(sellPrice(it))}</button>` : '',
    !eq ? `<button class="btn sm" data-a="kxSell" data-id="${it.id}" data-op="dust">Parçala · ${fmt(dustYield(it))} toz</button>` : '',
  ].join('');
  return itemCard(it, acts, cmpWith(it, KV.slot));
}
const sync = () => { if (KV.sel != null && !S.items.some(x => x.id === KV.sel)) KV.sel = null; };
ACT.kxRot = d => { KV.rot = (KV.rot + (+d.d) + 8) % 8; redraw(); };
ACT.kxF = d => { KV.f = d.id; KV.slot = null; redraw(); };
ACT.kxSlot = d => { KV.slot = KV.slot === d.s ? null : d.s; const id = S.heroes[mainId(S)].eq[d.s]; if (KV.slot && id != null) { KV.sel = id; } redraw(); };
ACT.kxPick = d => { KV.sel = +d.id; const it = S.items.find(x => x.id === KV.sel); if (it) showModal(`<div class="kx-card">${cardFor(it)}</div>`, 'kxcard'); redraw(); };
ACT.kxEquip = async d => { closeModal(); const r = await doAct('item.equip', { hero: mainId(S), id: +d.id, ...(KV.slot && fits(S.items.find(x => x.id === +d.id), KV.slot, clsOf(S, mainId(S))) ? { slot: KV.slot } : {}) }); if (r) { KV.slot = null; toast('Kuşanıldı.'); } };
ACT.kxUnequip = async d => { closeModal(); if (await doAct('item.unequip', { hero: mainId(S), slot: d.s })) toast('Çıkarıldı.'); };
ACT.kxUp = d => { closeModal(); ACT.anvil({ tab: 'up' }); ACT.pickUp?.({ id: +d.id }); };
ACT.kxSell = d => {
  const it = S.items.find(x => x.id === +d.id); if (!it) return;
  const sell = d.op === 'sell', gain = sell ? `${fmt(sellPrice(it))} akçe` : `${fmt(dustYield(it))} Örs Tozu`;
  confirmBox(sell ? 'Eşyayı sat' : 'Eşyayı parçala', `${esc(itemName(it))} ${sell ? 'satılsın' : 'parçalansın'} mı? Karşılığı: ${gain}.`, async () => {
    const r = await doAct(sell ? 'item.sell' : 'item.dismantle', { ids: [it.id] });
    if (r) { toast(sell ? `+${fmt(r.akce)} akçe` : `+${fmt(r.toz)} Örs Tozu`); KV.sel = null; sync(); }
  }, sell ? 'Sat' : 'Parçala');
};
// Nadirlik renkleri (items.js GRADES) kart ve çerçevelerde kullanılır; ayrıca dışarı açılmaz.
export const kxGradeColor = it => GRADES[gradeOf(it.b, it.g)]?.color;
