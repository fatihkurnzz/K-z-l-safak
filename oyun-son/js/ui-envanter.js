// Envanter ızgarası ve Çanta penceresi.
// Eşyalar kare yuvalarda simge olarak durur (nadirlik renginde çerçeve, köşede artı ve kuşanılı işareti).
// invGrid() Çanta, Örs (Bas / Parçala) ve Pazar (Sat) tarafından ortak kullanılır: dokunulan yuva seçilir,
// eşyanın bilgileri aynı ekranda açılan bilgi kartında görünür.
import { S } from './api.js';
import { ACT, $, esc, fmt, toast, doAct, openWin, ico, itemLine, confirmBox } from './ui-core.js';
import { ri } from './icons.js';
import { equippedIds, ownerOf } from '../shared/hero.js';
import { clsOf, ownIds, mainId } from '../shared/roster.js';
import { subSection, setSection, gridBadges, cmpLine } from './esya-parts.js';
import { itemBase, itemName, dustYield, sellPrice } from '../shared/items.js';
import { CLASSES, BAG_LIMIT } from '../shared/content.js';

// Eşyayı en değerliden en sadeye sıralar (kuşanılı olanlar önce)
export const sortItems = items => { const eq = equippedIds(S); return [...items].sort((a, b) => (eq.has(b.id) - eq.has(a.id)) || (b.g - a.g) || (itemBase(b.b).tier - itemBase(a.b).tier) || (b.p - a.p)); };
const heroName = id => S.heroes[id]?.name || CLASSES[clsOf(S, id)]?.name || id;

// items: gösterilecek eşyalar · act: yuvaya dokununca çalışacak ACT adı · sel: seçili kimlik (sayı) ya da Set
// fill: ızgarayı bu kadar yuvaya boş kutularla tamamla (çanta sığası) · note: yuvanın altına küçük yazı (ör. toz değeri)
export function invGrid(items, { act, sel = null, fill = 0, note = null, empty = 'Burada eşya yok.' } = {}) {
  const eq = equippedIds(S), isSel = id => (sel instanceof Set ? sel.has(id) : sel === id);
  const cells = items.map(x => `<button class="ivc ${isSel(x.id) ? 'sel' : ''} ${eq.has(x.id) ? 'eq' : ''}" data-a="${act}" data-id="${x.id}" title="${esc(itemName(x))}" aria-label="${esc(itemName(x))}">${ico(x)}${eq.has(x.id) ? '<i class="ivq" title="Kuşanılı">E</i>' : ''}${gridBadges(x)}${note ? `<small>${note(x)}</small>` : ''}</button>`);
  for (let i = items.length; i < fill; i++) cells.push('<span class="ivc nil"></span>');
  return cells.length ? `<div class="ivg">${cells.join('')}</div>` : `<p class="mut">${empty}</p>`;
}

// Bilgi kartı: büyük simge, ad, nadirlik, statlar ve (çantada) eşyaya göre işlemler
export function itemCard(it, actions = '', extra = '') {
  if (!it) return '<div class="ivinfo nil"><p class="mut">Bir eşyaya dokun: bilgileri burada açılır.</p></div>';
  const B = itemBase(it.b), eq = equippedIds(S).has(it.id), o = eq ? ownerOf(S, it.id) : null;
  return `<div class="ivinfo"><div class="ivhead">${ico(it, 'lg')}<div class="grow">${itemLine(it)}</div></div>
    <div class="ivmeta">${o ? `<span class="chip up">${esc(heroName(o))} kuşandı</span>` : '<span class="chip">Boşta</span>'}${B.cls ? `<span class="chip">${B.cls.map(c => CLASSES[c]?.name || c).join(', ')}</span>` : ''}<span class="chip">${ri('akce')} ${fmt(sellPrice(it))}</span>${it.nt ? `<span class="chip ntc" title="Bağlı eşya (görev ödülü ya da hediye): Pazar'a konamaz, başka oyuncuya devredilemez; yalnız Tüccar'a satılır">${ri('lock')} Bağlı</span>` : ''}<span class="chip">${ri('toz')} ${fmt(dustYield(it))}</span></div>
    <div class="esx">${subSection(it)}${setSection(S, it, o, ownIds(S))}</div>
    ${extra}${actions ? `<div class="ivacts">${actions}</div>` : ''}</div>`;
}

// Kuşanılıya göre kıyas (esya-parts.js cmpLine; eski Parti ekranındaki kıyas satırı): ana kahramanın aynı yuvadaki eşyası
export function cmpWith(it, slot = null) {
  if (!it || equippedIds(S).has(it.id)) return '';
  const hid = mainId(S), h = S.heroes[hid], B = itemBase(it.b); if (!h || !B.slots?.length) return '';
  const s = slot && B.slots.includes(slot) ? slot : B.slots.find(k => h.eq[k] != null) || B.slots[0];
  const cu = h.eq[s] != null ? S.items.find(x => x.id === h.eq[s]) : null;
  return cu ? cmpLine(it, cu) : '<div class="cmpl"><b>Kuşanılıya göre:</b> <span class="mut">bu yuva boş</span></div>';
}

// ---------- Çanta ----------
const BAGV = { f: 'all', sel: null };
const BAG_F = [['all', 'Hepsi', 'bag'], ['weapon', 'Silah', 'atk'], ['armor', 'Zırh', 'armor'], ['jewel', 'Takı', 'jewel'], ['free', 'Boşta', 'list'], ['eq', 'Kuşanılı', 'party']];
const passes = (x, f, eq) => f === 'all' || (f === 'free' ? !eq.has(x.id) : f === 'eq' ? eq.has(x.id) : (itemBase(x.b).kind === f || (f === 'weapon' && itemBase(x.b).kind === 'shield')));
function bagHtml() {
  const eq = equippedIds(S), list = sortItems(S.items.filter(x => passes(x, BAGV.f, eq)));
  if (!S.items.some(x => x.id === BAGV.sel)) BAGV.sel = list[0]?.id ?? null;
  const it = S.items.find(x => x.id === BAGV.sel), free = it && !eq.has(it.id);
  const acts = it ? `<button class="btn sm green" data-a="bagGo" data-to="party">Kuşan</button><button class="btn sm" data-a="bagGo" data-to="anvil">Örs'te bas</button>${free ? `${it.nt ? '' : '<button class="btn sm" data-a="bagGo" data-to="market">Pazara koy</button>'}<button class="btn sm" data-a="bagOne" data-op="dismantle">Parçala</button><button class="btn sm red" data-a="bagOne" data-op="sell">Sat</button>` : ''}` : '';
  const full = S.items.length >= BAG_LIMIT;
  return `<div class="ivbag"><div class="ivside">${itemCard(it, acts, cmpWith(it))}</div>
    <div class="ivmain"><div class="ivtop"><b class="${full ? 'warn' : ''}">${ri('bag')} ${S.items.length}/${BAG_LIMIT}</b>${full ? '<span class="mut">Çanta dolu: eşya düşüren savaşlara girmeden önce sat ya da parçala.</span>' : ''}<button class="btn sm ivbulk" data-a="breakWin">${ri('shatter')}Toplu sat / parçala</button></div>
      <div class="sub ivf">${BAG_F.map(([k, n, ic]) => `<button data-a="bagF" data-id="${k}" class="${BAGV.f === k ? 'on' : ''}">${ri(ic)}${n}</button>`).join('')}</div>
      ${invGrid(list, { act: 'bagPick', sel: BAGV.sel, fill: BAGV.f === 'all' ? BAG_LIMIT : 0, empty: BAGV.f === 'eq' ? 'Kuşanılı eşya yok.' : 'Bu türde eşya yok.' })}</div></div>`;
}
const redrawBag = () => { const pg = $('#page'); if (pg) { const y = pg.querySelector('.ivmain')?.scrollTop || 0; pg.innerHTML = bagHtml(); const m = pg.querySelector('.ivmain'); if (m) m.scrollTop = y; } };
ACT.bag = () => openWin({ title: 'Çanta', render: bagHtml });
ACT.bagF = d => { BAGV.f = d.id; redrawBag(); };
ACT.bagPick = d => { BAGV.sel = +d.id; redrawBag(); };
// Eşyayı ilgili ekranda seçili açar
ACT.bagGo = d => {
  const id = BAGV.sel; if (id == null) return;
  if (d.to === 'party') return ACT.party();
  if (d.to === 'anvil') { ACT.anvil({ tab: 'up' }); return ACT.pickUp?.({ id }); }
  if (d.to === 'market') { ACT.market({ sub: 'sell' }); return ACT.marketPick?.({ id }); }
};
ACT.bagOne = d => {
  const it = S.items.find(x => x.id === BAGV.sel); if (!it) return;
  const sell = d.op === 'sell', gain = sell ? `${fmt(sellPrice(it))} akçe` : `${fmt(dustYield(it))} Örs Tozu`;
  confirmBox(sell ? 'Eşyayı sat' : 'Eşyayı parçala', `${esc(itemName(it))} ${sell ? 'satılsın' : 'parçalansın'} mı? Karşılığı: ${gain}.`, async () => {
    const r = await doAct(sell ? 'item.sell' : 'item.dismantle', { ids: [it.id] });
    if (r) { toast(sell ? `+${fmt(r.akce)} akçe` : `+${fmt(r.toz)} Örs Tozu`); BAGV.sel = null; ACT.bag(); }
  }, sell ? 'Sat' : 'Parçala');
};
