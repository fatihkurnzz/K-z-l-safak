// Vahran Sınırı binalarının ve alt çubuğun ekranları: Örs, Maden, Usta Odası, Pazar ve Tüccar, Şan Divanı,
// Kader Çarkı, Kervan, Görevler, Posta, Klan, Ansiklopedi.
import { S, now, DEV } from './api.js';
import { MERCHANT_SVG } from './ui-ogretici.js';
import { TUT_STEPS } from '../shared/meta.js';
import { merchantShelves, NPC, NPC_DAILY, npcLeft, POT_PACKS, npcPots, npcScrolls } from '../shared/npc.js';
import { POT } from '../shared/mana.js';
import { potSvg } from './iksir.js'; // iksir rafı (sürüm 12)
import { fishBagValue } from '../shared/balik.js'; // Tüccar balık da alır (ui-balik.js: ACT.balikSat)
import { priceBounds, fairValue } from '../shared/guard.js';
import { ACT, $, esc, fmt, pct, toast, run, showModal, closeModal, confirmBox, openWin, redraw, reload, doAct, cur, mobImg, ico, itemLine, lootBox, lootToast, dropText, dropLabel, locked, lockNote, loading, clockText, ELEMENT, myTier, med, resTile, lootChip, lootKind, dropIco } from './ui-core.js';
import { sico } from './ui-party.js';
import { invGrid, itemCard } from './ui-envanter.js'; // eşya ızgarası (Örs › Parçala, Pazar › Sat)
import { anvilUp, resetUp } from './ui-esya.js';
import { mineScene } from './ui-sahne.js';
import { questBoard } from './ui-gorev.js'; // Maden ve Kader Çarkı sahneleri // Örs'ün "Bas" sayfası ve Ansiklopedi orada
import { bakimPage, taxText, netLine, reportsTab, unreadReports, repSeen, repReset } from './ui-rapor.js'; // Örs'ün "Bakım" sayfası, pazarın dilimli vergi metni
import { CLASSES, CLASS_KEYS, dayKey, UNLOCK, MINE, IDLE, QUESTS, QUEST_ALL, SHOP, HALL, WHEEL, SHARDS, MARKET, CLAN, FACTIONS, BAG_LIMIT, PREMIUM, ARENA } from '../shared/content.js';
import { SKILLS, describe } from '../shared/skills.js';
import { GRADES, STONES, itemBase, itemStats, itemName, dustYield, sellPrice, refPrice, subCount, gradeOf, STAT_LABEL, fmtStat, REFORGE, SAFE_PLUS, EMBER_MULT, isCoef, minPlus } from '../shared/items.js';
import { ZONES, MOBS, zoneMobs, mobStages, zoneStages } from '../shared/zones.js';
import { heroStats, equippedIds, itemOf } from '../shared/hero.js';
import { mineStock, mineRate, marketTax, idleStock, questProgress, stageOpen, bossAvailable } from '../shared/calc.js';
import { svg, ri } from './icons.js';
import { WEATHER, weatherAt } from '../shared/realm.js';
import { RULES } from '../shared/rules.js';
import { adBtn, adWheelBtn } from './ui-reklam.js';

const lockPage = key => `<div class="hint">${ri('lock')} ${lockNote(key)}</div>`;
const used = k => S.daily[k] || 0;
const sortedItems = () => { const eq = equippedIds(S); return [...S.items].sort((a, b) => (eq.has(b.id) - eq.has(a.id)) || (b.g - a.g) || (itemBase(b.b).tier - itemBase(a.b).tier) || (b.p - a.p)); };

// ---------- Örs: bas, su ver, parçala/sat, taş üret ----------
const AV = { pick: new Set() };
ACT.anvil = () => { resetUp(); openWin({ title: 'Örs', render: () => locked('anvil') ? lockPage('anvil') : anvilUp() }); }; // VAHRAN: Örs'te yalnızca artı basma
// Parçala / sat: Örs'ten çıkarıldı; Çanta'dan ve günlük görevden ayrı pencere olarak açılır (çanta dolunca savaşa girilmez)
ACT.breakWin = () => { resetUp(); openWin({ title: 'Parçala ya da Sat', render: () => locked('anvil') ? lockPage('anvil') : anvilBreak() }); };
function anvilReforge() {
  const items = sortedItems().filter(x => x.p >= REFORGE.minPlus && !x.r);
  return `<div class="hint"><b>Su verme:</b> +${REFORGE.minPlus} ve üstü eşyayı kalıcı olarak güçlendirir. Eşyanın artısı sıfırlanır ama +0 hâli bile eski +7'den güçlüdür; sonra yeniden basılabilir. Başarısızlık yoktur.<br>Bedel: ${REFORGE.stones} Usta Bileği Taşı (elinde ${S.stones[2]}) + akçe.</div>
    ${items.length ? items.map(x => { const a = itemStats(x), b = itemStats({ ...x, r: 1, p: minPlus(x.b) }), fee = REFORGE.fee(x); return `<div class="row">${ico(x)}<div class="grow">${itemLine(x)}<br><span class="up">Su verilince: ${Object.keys(b).filter(k => !isCoef(k)).map(k => `${STAT_LABEL[k]} ${fmtStat(k, b[k])}`).join(' · ')}</span></div><button class="btn red sm" data-a="reforge" data-id="${x.id}" ${S.stones[2] >= REFORGE.stones && S.akce >= fee ? '' : 'disabled'}>Su ver (${fmt(fee)})</button></div>`; }).join('') : `<p class="mut">+${REFORGE.minPlus} ya da üstü eşyan yok.</p>`}
    ${S.items.some(x => x.r) ? `<h3>Su verilmiş eşyaların</h3>${S.items.filter(x => x.r).map(x => `<div class="row">${ico(x)}<div class="grow">${itemLine(x)}</div></div>`).join('')}` : ''}`;
}
ACT.reforge = async d => { const r = await doAct('anvil.reforge', { id: +d.id }); if (r) toast('Su verildi: eşya kalıcı olarak güçlendi.'); };
function anvilBreak() {
  const eq = equippedIds(S), items = sortedItems().filter(x => !eq.has(x.id));
  for (const id of [...AV.pick]) if (!items.some(x => x.id === id)) AV.pick.delete(id);
  const sel = items.filter(x => AV.pick.has(x.id));
  const toz = sel.reduce((a, x) => a + dustYield(x), 0), akce = sel.reduce((a, x) => a + sellPrice(x), 0);
  return `<div class="hint">Kullanmadığın eşyayı parçala: <b>Örs Tozu</b> verir, tozdan <b>bileği taşı</b> üretilir. Akçe lazımsa satabilirsin. (Elinde ${ri('toz')} ${fmt(S.toz)} toz)</div>
    <div class="sub"><button data-a="pickGrade" data-g="0">Standartları seç</button><button data-a="pickGrade" data-g="1">Nadirleri de seç</button><button data-a="pickGrade" data-g="-1">Temizle</button><span class="sp"></span><b>${sel.length} seçili</b></div>
    <div class="sub"><button data-a="dismantle" ${sel.length ? '' : 'disabled'} class="on">${ri('toz')}Parçala (+${fmt(toz)} toz)</button><button data-a="sell" ${sel.length ? '' : 'disabled'}>${ri('akce')}Sat (+${fmt(akce)} akçe)</button></div>
    ${itemCard(items.find(x => x.id === AV.last))}${invGrid(items, { act: 'pick', sel: AV.pick, note: x => `${dustYield(x)} toz`, empty: 'Çantanda kuşanılmamış eşya yok.' })}`;
}
ACT.pick = d => { const id = +d.id; AV.pick.has(id) ? AV.pick.delete(id) : AV.pick.add(id); AV.last = id; redraw(); }; // AV.last: bilgi kartında gösterilen son dokunulan eşya
ACT.pickGrade = d => { const eq = equippedIds(S), g = +d.g; AV.pick = new Set(g < 0 ? [] : S.items.filter(x => !eq.has(x.id) && x.g <= g && x.p === 0 && !x.r).map(x => x.id)); redraw(); };
ACT.dismantle = async () => { const r = await doAct('item.dismantle', { ids: [...AV.pick] }); if (r) { AV.pick.clear(); toast(`+${fmt(r.toz)} Örs Tozu`); redraw(); } };
ACT.sell = async () => { const r = await doAct('item.sell', { ids: [...AV.pick] }); if (r) { AV.pick.clear(); toast(`+${fmt(r.akce)} akçe`); redraw(); } };
function anvilStone() {
  return `<div class="hint">Bileği taşı örste her denemede harcanır. Standart eşya <b>Kaba</b>, Nadir eşya <b>İnce</b>, Eşsiz eşya <b>Usta</b> taş ister; su verme de Usta taş ister. (Elinde ${ri('toz')} ${fmt(S.toz)} toz)</div>
    ${STONES.map((st, g) => { const n = Math.min(Math.floor(S.toz / st.dust), Math.floor(S.akce / st.akce)); return `<div class="row">${resTile('stone' + g)}<div class="grow"><b>${st.name}</b> <span class="chip">Elinde ${S.stones[g]}</span><br><span class="mut">${ri('toz')} ${st.dust} toz + ${ri('akce')} ${fmt(st.akce)} akçe</span></div>
      <button class="btn sm" data-a="craft" data-g="${g}" data-n="1" ${n >= 1 ? '' : 'disabled'}>Üret</button><button class="btn sm" data-a="craft" data-g="${g}" data-n="5" ${n >= 5 ? '' : 'disabled'}>×5</button></div>`; }).join('')}
    <h3>Örs sarf malzemeleri</h3><div class="row">${resTile('charm')}<div class="grow"><b>Uğur Muskası</b> <span class="chip">Elinde ${S.charms}</span><br><span class="mut">+${SAFE_PLUS + 1} ve üstündeki denemede seviye kaybını ve kırılmayı önler; her denemede bir tane harcanır. Boss'lardan, Kervan'dan ve klan sandığından gelir.</span></div></div>
    <div class="row">${resTile('ember')}<div class="grow"><b>Tav Közü</b> <span class="chip">Elinde ${S.embers || 0}</span><br><span class="mut">Bir denemede başarı şansını ${String(EMBER_MULT).replace('.', ',')} katına çıkarır. Nadirdir: boss ve kaptanlardan düşer, Akın'da 500 puanı geçene verilir.</span></div></div>`;
}
ACT.craft = d => doAct('anvil.craft', { g: +d.g, n: +d.n });

// ---------- Maden ----------
ACT.mine = () => openWin({ title: 'Maden', render: () => {
  if (locked('mine')) return lockPage('mine');
  const M = S.mine, stock = mineStock(S, now()), rate = mineRate(S, now()), cap = rate * MINE.capHours, cost = MINE.upCost(M.lvl);
  return `${mineScene(stock / cap, S.faction)}<div class="row">${med('mine')}<div class="grow"><b>Maden seviyesi ${M.lvl}/${MINE.max}</b><br><span class="mut">Saatte ${fmt(rate)} cevher · depo ${MINE.capHours} saatte dolar${weatherAt(now()) === 'rain' ? ` · <b class="up">yağmur: +%${WEATHER.rain.minePct}</b>` : ''}</span><div class="pbar" style="margin-top:4px"><i style="width:${Math.min(100, 100 * stock / cap)}%"></i></div></div><button class="btn green" data-a="mineCollect" ${stock >= 1 ? '' : 'disabled'}>${ri('ore')} Topla (${fmt(stock)})</button></div>${adBtn('maden', 'Reklamla hızlandır (+1 saat)', {}, 'ad-mine')}
    ${M.lvl < MINE.max ? `<div class="row">${med('grow', 'green')}<div class="grow"><b>Madeni büyüt</b><br><span class="mut">Seviye ${M.lvl + 1}: saatte ${fmt(mineRate(S, now(), M.lvl + 1))} cevher · seviye ${M.lvl * 6} gerekli</span></div><button class="btn" data-a="mineUp" ${S.akce >= cost && S.lvl >= M.lvl * 6 ? '' : 'disabled'}>${ri('akce')} ${fmt(cost)} akçe</button></div>` : ''}
    <h3>Madenci takası <span class="mut">· elinde ${ri('ore')} ${fmt(S.ore)} cevher</span></h3>
    <div class="row">${resTile('akce')}<div class="grow"><b>Akçe</b><br><span class="mut">${ri('ore')} ${MINE.trade.akce.ore} cevher → ${ri('akce')} ${MINE.trade.akce.give.n} akçe</span></div><button class="btn sm" data-a="mineTrade" data-k="akce" data-n="100" ${S.ore >= 100 ? '' : 'disabled'}>100 cevher</button><button class="btn sm" data-a="mineTrade" data-k="akce" data-n="${S.ore}" ${S.ore >= 1 ? '' : 'disabled'}>Hepsi</button></div>
    <div class="row">${resTile('stone0')}<div class="grow"><b>${STONES[0].name}</b><br><span class="mut">${ri('ore')} ${MINE.trade.stone0.ore} cevher</span></div><button class="btn sm" data-a="mineTrade" data-k="stone0" data-n="1" ${S.ore >= MINE.trade.stone0.ore ? '' : 'disabled'}>Al</button></div>
    <div class="row">${resTile('stone1')}<div class="grow"><b>${STONES[1].name}</b><br><span class="mut">${ri('ore')} ${MINE.trade.stone1.ore} cevher</span></div><button class="btn sm" data-a="mineTrade" data-k="stone1" data-n="1" ${S.ore >= MINE.trade.stone1.ore ? '' : 'disabled'}>Al</button></div>`;
} });
ACT.mineCollect = async () => { const r = await doAct('mine.collect'); if (r) toast(`+${fmt(r.ore)} cevher`); };
ACT.mineUp = () => doAct('mine.upgrade');
ACT.mineTrade = async d => { const r = await doAct('mine.trade', { k: d.k, n: +d.n }); if (r) lootToast(r.loot); };


// ---------- Pazar ve Tüccar ----------
// Sürüm 13: Yemin Pazarı'nda iki ayrı yer ve iki ayrı pencere. Pazar: oyuncudan oyuncuya ilanlar (market.list / sell / mine / cancel / buy).
// Tüccar: NPC dükkânı (npc.buy / npc.sell; shared/npc.js). İksirler başkentteki İksir ve Parşömen dükkânına taşındı (aşağıda).
const MV = { sub: 'buy', kind: 'all', rar: 'all', cls: 'all', sort: 'new', q: '', sel: null };
const TV = { sub: 'weapons', cls: 'all', pick: new Set(), last: null };
// Tüccar tezgâhı (özgün çizim): iki renkli çizgili tente, tezgâh arkasında sarıklı tüccar, terazi, kılıç ve kalkan
const TC_SVG = '<svg viewBox="0 0 120 66" aria-hidden="true"><rect width="120" height="66" fill="#2a1d10"/><rect y="44" width="120" height="22" fill="#5a3a1c"/>'
  + [0, 1, 2, 3, 4, 5, 6, 7].map(i => `<path d="M${i * 15} 4h15l-2 14h-11z" fill="${i % 2 ? '#2f62b8' : '#c2321e'}"/>`).join('')
  + '<path d="M0 18q7.5 6 15 0t15 0 15 0 15 0 15 0 15 0 15 0 15 0" fill="none" stroke="#e7c75a" stroke-width="2"/><rect x="4" y="4" width="3" height="42" fill="#6a4526"/><rect x="113" y="4" width="3" height="42" fill="#6a4526"/>'
  + '<path d="M44 46c2-10 8-14 16-14s14 4 16 14z" fill="#7a2a4a"/><ellipse cx="60" cy="30" rx="7.5" ry="8" fill="#d8a878"/><path d="M51 27c0-8 18-8 18 0-3-3-15-3-18 0z" fill="#e8dcc0"/><circle cx="60" cy="22.5" r="2" fill="#2f62b8"/>'
  + '<circle cx="57" cy="30" r="1.1" fill="#2a1a10"/><circle cx="63" cy="30" r="1.1" fill="#2a1a10"/><path d="M55 34q5 3 10 0" stroke="#5a2a10" stroke-width="1.6" fill="none"/><path d="M56 36q4 4 8 0" fill="#5a3a20"/>'
  + '<rect x="8" y="44" width="104" height="8" rx="2" fill="#8a5f34"/><rect x="8" y="44" width="104" height="2" fill="#b07a44"/>'
  + '<path d="M18 43l14-14" stroke="#c8d0d8" stroke-width="3" stroke-linecap="round"/><path d="M17 39l6 6" stroke="#e7c75a" stroke-width="2.5"/><path d="M88 30h14v8q-7 7-14 0z" fill="#6f7b8a" stroke="#e7c75a" stroke-width="1.5"/>'
  + '<path d="M38 30v13M32 34h12" stroke="#e7c75a" stroke-width="1.4"/><path d="M30 34l2 5h-4zM44 34l2 5h-4z" fill="#e7c75a"/><circle cx="78" cy="41" r="3" fill="#ffd36a"/><circle cx="82" cy="42" r="2.6" fill="#e7c75a"/><circle cx="80" cy="38.5" r="2.4" fill="#ffe08a"/></svg>';
// Pazar tezgâhı simgesi (özgün): mavi-beyaz tente, tezgâhta kumaş, küp ve testi
const PAZAR_SVG = '<svg viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="8" fill="#1f3352"/>' + [0, 1, 2, 3, 4, 5].map(i => `<path d="M${4 + i * 9.33} 10h9.33l-1.5 12h-6.33z" fill="${i % 2 ? '#e8dcc0' : '#3d6fb6'}"/>`).join('') + '<rect x="8" y="22" width="3" height="26" fill="#6a4526"/><rect x="53" y="22" width="3" height="26" fill="#6a4526"/><rect x="6" y="40" width="52" height="16" rx="2" fill="#8a5f34"/><rect x="6" y="40" width="52" height="3" fill="#b07a44"/><path d="M14 40v-9h12v9z" fill="#c2321e"/><path d="M14 31h12l-2 3H16z" fill="#e7c75a"/><circle cx="36" cy="35" r="5" fill="#3f9a4a"/><path d="M45 40c-3 0-4-3-4-6s2-4 2-6h4c0 2 2 3 2 6s-1 6-4 6z" fill="#c9a87c"/></svg>';
const PZ_TITLE = `<span class="pz-tt"><span class="pz-por">${PAZAR_SVG}</span><span>Pazar</span></span>`;
const TC_TITLE = `<span class="pz-tt"><span class="pz-por">${MERCHANT_SVG}</span><span>Tüccar</span></span>`;
const pzSub = (cur, list, act) => `<div class="sub pz-sub">${list.map(([k, n, ic]) => `<button data-a="${act}" data-k="${k}" class="${cur === k ? 'on' : ''}">${ic ? ri(ic) : ''}${n}</button>`).join('')}</div>`;
const tutorialBuy = () => !!(S.tut && !S.tut.end && TUT_STEPS[S.tut.s] === 'merchant' && !S.tut.f.buy);
// Pazar penceresi (yalnız oyuncu ilanları). Eski çağrı ACT.market({ tab: 'tuccar' }) Tüccar'ı açar.
ACT.market = d => {
  if (d?.tab === 'tuccar' || tutorialBuy()) return ACT.tuccar();
  if (d?.sub) MV.sub = d.sub;
  openWin({ title: PZ_TITLE, load: async () => locked('market') ? null : MV.sub === 'buy' ? run('market.list') : MV.sub === 'mine' ? run('market.mine') : null, render: pazarPage });
};
ACT.pazar = () => ACT.market({ tab: 'pazar' });
// Tüccar penceresi: Silahlar · Zırhlar · Erzak · Tüccara sat. Öğreticideki ilk alım Tüccar Halvor penceresinde (ui-ogretici.js)
ACT.tuccar = () => {
  if (tutorialBuy() && ACT.npcMerchant) return ACT.npcMerchant();
  if (tutorialBuy() || TV.sub === 'pots') TV.sub = 'weapons';
  openWin({ title: TC_TITLE, render: tuccarPage });
};
ACT.marketSub = d => { MV.sub = d.k; const w = cur(); w.data = null; redraw(); reload(); };
ACT.marketKind = d => { MV.kind = d.k; redraw(); };
ACT.marketRar = d => { MV.rar = d.k; redraw(); };
ACT.marketCls = d => { MV.cls = d.k; redraw(); };
ACT.marketSort = d => { MV.sort = d.k; redraw(); };
ACT.marketPick = d => { MV.sel = +d.id; redraw(); };
ACT.pzSet = d => { const el = $('#mprice'); if (el) { el.value = d.v; el.dispatchEvent(new Event('input', { bubbles: true })); } };
ACT.marketSell = async () => { const el = $('#mprice'), price = Math.floor(+el.value.replace(/\D/g, '')), mn = +el.dataset.min, mx = +el.dataset.max;
  if (!(price >= mn && price <= mx)) { el.value = Math.min(mx, Math.max(mn, price || mn)); el.dispatchEvent(new Event('input', { bubbles: true })); return toast(`Fiyat ${fmt(mn)} – ${fmt(mx)} akçe bandında olmalı.`); }
  const r = await run('market.sell', { id: MV.sel, price }); if (r) { MV.sel = null; toast(`İlan açıldı (ücret ${r.fee} akçe).`); redraw(); } };
ACT.marketBuy = async d => { const r = await run('market.buy', { id: d.id }); if (r) toast(`${itemName(r.item)} satın alındı.`); reload(); };
ACT.marketCancel = async d => { if (await run('market.cancel', { id: d.id })) reload(); };
// Fiyat kutusu bandın dışına çıkamaz: odak kaybında en yakın sınıra çekilir (sunucu ayrıca doğrular: guard.js priceBounds)
document.addEventListener('change', e => { const el = e.target; if (el?.id !== 'mprice' || !el.dataset.max) return; const v = Math.floor(+el.value.replace(/\D/g, '')), mn = +el.dataset.min, mx = +el.dataset.max; const c = Math.min(mx, Math.max(mn, v || mn)); if (c !== v) { el.value = c; el.dispatchEvent(new Event('input', { bubbles: true })); toast(`Fiyat bandı: ${fmt(mn)} – ${fmt(mx)} akçe.`); } });
document.addEventListener('input', e => { if (e.target?.id !== 'pzq') return; MV.q = e.target.value; const el = document.getElementById('pzlist'); if (el && cur()?.data?.listings) el.innerHTML = pzListHtml(cur().data.listings); });

const pzBadges = it => { const B = itemBase(it.b), n = subCount(it); return `${n ? `<span class="pz-b pz-sb">Yan stat ×${n}</span>` : ''}${B.set ? `<span class="pz-b pz-st">Set: ${esc(B.set)}</span>` : ''}${it.r ? '<span class="pz-b pz-rf">Su verilmiş</span>' : ''}`; };
function pzListHtml(all) {
  const q = MV.q.trim().toLocaleLowerCase('tr');
  const rows = all.filter(l => {
    const B = itemBase(l.item.b), g = gradeOf(l.item.b, l.item.g);
    return (MV.kind === 'all' || B.kind === MV.kind || (MV.kind === 'weapon' && B.kind === 'shield')) && (MV.rar === 'all' || g === +MV.rar) && (MV.cls === 'all' || !B.cls || B.cls.includes(MV.cls)) && (!q || itemName(l.item).toLocaleLowerCase('tr').includes(q));
  }).sort((a, b) => MV.sort === 'lo' ? a.price - b.price : MV.sort === 'hi' ? b.price - a.price : b.exp - a.exp);
  if (!rows.length) return '<p class="mut pz-empty">Bu süzgeçte ilan yok.</p>';
  return `<div class="pz-grid">${rows.map(l => `<div class="pz-card g${gradeOf(l.item.b, l.item.g)} ${l.mine ? 'dim' : ''}"><div class="pz-top">${ico(l.item, 'lg')}<div class="pz-nm">${itemLine(l.item)}</div></div>
    <div class="pz-bd">${pzBadges(l.item)}</div>
    <div class="pz-bot"><span class="mut">${esc(l.name)}${l.mine ? ' (sen)' : ''}</span><b class="price">${ri('akce')} ${fmt(l.price)}</b><button class="btn sm green" data-a="marketBuy" data-id="${l.id}" ${!l.mine && S.akce >= l.price ? '' : 'disabled'}>Al</button></div></div>`).join('')}</div>`;
}
function pazarPage() {
  if (locked('market')) return `<div class="pz-note">Oyuncu pazarı seviye ${UNLOCK.market} olunca açılır. O zamana dek fazla eşyanı yandaki tezgâhta <b>${NPC.merchant.name}</b>’a satabilir, ondan silah ve zırh alabilirsin.</div><div class="mbtns"><button class="btn green" data-a="tuccar">${ri('cart')} Tüccar’a git</button></div>`;
  const D = cur().data, subs = pzSub(MV.sub, [['buy', 'Satın al', 'market'], ['sell', 'Sat · İlan aç', 'pricetag'], ['mine', `İlanlarım ${S.market.ids.length}/${MARKET.slots}`, 'list']], 'marketSub');
  if (MV.sub === 'sell') {
    const eq = equippedIds(S), items = sortedItems().filter(x => !eq.has(x.id)), it = itemOf(S, MV.sel);
    const nt = it && it.nt, B = it && !nt && priceBounds(it), ref = B ? Math.min(B.max, Math.max(B.min, fairValue(it))) : 0;
    return `${subs}<div class="hint">İlan ${MARKET.hours} saat açık kalır. İlan ücreti %${MARKET.listFee * 100} (iade edilmez), ${taxText(S.faction)}. Satılınca akçe postana düşer. Yuva: ${S.market.ids.length}/${MARKET.slots} · bugünkü işlem: ${used('tx')}/${MARKET.dailyTx}</div>
      ${nt ? `<div class="pz-sellbox pb-nt">${ico(it, 'lg')}<div class="grow">${itemLine(it)}<p class="pb-ntx">${ri('lock')} <b>Bağlı eşya.</b> Görev ödülü ya da oyunun hediyesi olan eşya Pazar'a konamaz; yalnızca Tüccar'a satılabilir.</p></div></div>` : it ? `<div class="pz-sellbox">${ico(it, 'lg')}<div class="grow">${itemLine(it)}<div class="pz-bd">${pzBadges(it)}</div><span class="mut" id="mnet">${netLine(ref, S.faction)}</span></div>
        <div class="pz-price"><input type="text" inputmode="numeric" id="mprice" value="${ref}" data-min="${B.min}" data-max="${B.max}"><div class="pb-band">Fiyat bandı: <b>${fmt(B.min)} – ${fmt(B.max)}</b> akçe</div><div class="pz-range"><button data-a="pzSet" data-v="${B.min}">En düşük ${fmt(B.min)}</button><button data-a="pzSet" data-v="${ref}">Önerilen ${fmt(ref)}</button><button data-a="pzSet" data-v="${B.max}">En yüksek ${fmt(B.max)}</button></div><button class="btn red" data-a="marketSell">İlana koy</button></div></div>` : '<p class="mut ivhint">İlana koyacağın eşyayı seç</p>'}
      ${invGrid(items, { act: 'marketPick', sel: MV.sel, empty: 'Satılabilecek (kuşanılmamış) eşyan yok.' })}`;
  }
  if (!D) return subs + loading;
  if (MV.sub === 'mine') return `${subs}<div class="hint">Yuva: ${D.used}/${D.slots}. Süresi dolan eşya çantana döner; satılanların akçesi <b>Posta</b>'ya düşer.</div>${D.listings.length ? `<div class="pz-grid">${D.listings.map(l => `<div class="pz-card g${gradeOf(l.item.b, l.item.g)}"><div class="pz-top">${ico(l.item, 'lg')}<div class="pz-nm">${itemLine(l.item)}</div></div><div class="pz-bd">${pzBadges(l.item)}</div><div class="pz-bot"><span class="mut">Kalan: ${clockText(l.exp - now())}</span><b class="price">${ri('akce')} ${fmt(l.price)}</b><button class="btn sm" data-a="marketCancel" data-id="${l.id}">Geri çek</button></div></div>`).join('')}</div>` : '<p class="mut">Açık ilanın yok.</p>'}`;
  const KIND = [['all', 'Tümü', 'bag'], ['weapon', 'Silah', 'atk'], ['armor', 'Zırh', 'armor'], ['jewel', 'Takı', 'jewel']], RAR = [['all', 'Her nadirlik'], ['0', 'Standart'], ['1', 'Nadir'], ['2', 'Eşsiz']];
  return `${subs}<div class="pz-filters">${pzSub(MV.kind, KIND, 'marketKind')}${pzSub(MV.rar, RAR, 'marketRar')}${pzSub(MV.cls, [['all', 'Her sınıf'], ...CLASS_KEYS.map(c => [c, CLASSES[c].name])], 'marketCls')}
    <div class="pz-find"><input type="search" id="pzq" placeholder="Eşya ara…" value="${esc(MV.q)}" autocomplete="off"><div class="sub pz-sub">${[['new', 'Yeni'], ['lo', 'Fiyat ↑'], ['hi', 'Fiyat ↓']].map(([k, n]) => `<button data-a="marketSort" data-k="${k}" class="${MV.sort === k ? 'on' : ''}">${n}</button>`).join('')}</div><span class="mut">Bugünkü işlem ${used('tx')}/${MARKET.dailyTx}</span></div></div>
    <div id="pzlist">${pzListHtml(D.listings)}</div>`;
}

// ---- Tüccar ----
const nextDay = () => (dayKey(now()) + 1) * 86400000 - 3 * 3600000;
function tuccarPage() {
  const first = tutorialBuy(), SH = merchantShelves(S, now()), subs = pzSub(TV.sub, [['weapons', 'Silahlar', 'atk'], ['armors', 'Zırhlar', 'armor'], ['mats', 'Erzak', 'toz'], ['sell', 'Tüccara sat', 'akce']], 'tcSub');
  const head = `<div class="pz-head"><div class="pz-bigpor">${TC_SVG}</div><div class="grow"><b>${NPC.merchant.name}</b><p>${first ? 'Hoş geldin yolcu! İlk silahını benden al; sınıfına uygun olanı ayırdım.' : TV.sub === 'sell' ? 'Çantandaki fazlalığı peşin akçeyle alırım. İlan kadar vermem ama beklemezsin.' : 'Yemin Pazarı’nın en dürüst tezgâhı! Kademene göre sağlam mal; raflar her gün yenilenir.'}</p></div><span class="chip rw">${ri('akce')} ${fmt(S.akce)}</span></div>`;
  const ware = x => { const it = { b: x.b, g: 0, p: 0 }, B = itemBase(x.b), left = npcLeft(S, x.id), ok = S.akce >= x.price && left > 0;
    return `<div class="pz-card g0"><div class="pz-top">${ico(it, 'lg')}<div class="pz-nm">${itemLine(it)}</div></div><div class="pz-bd">${B.cls ? `<span class="pz-b">${B.cls.map(c => CLASSES[c].name).join(' · ')}</span>` : ''}${B.set ? `<span class="pz-b pz-st">Set: ${esc(B.set)}</span>` : ''}</div><div class="pz-bot"><span class="mut">Stok ${left}</span><b class="price">${ri('akce')} ${fmt(x.price)}</b><button class="btn sm ${ok ? 'green' : ''}" data-a="${first && CLASSES[x.id] ? 'npcBuy' : 'tcBuy'}" data-id="${x.id}" ${ok ? '' : 'disabled'}>Al</button></div></div>`; };
  if (TV.sub === 'weapons') return `${head}${subs}<div class="pz-grid">${SH.weapons.map(ware).join('')}</div><p class="mut">Tüccar Standart nadirlikte satar; her üründen günde ${NPC_DAILY} tane. Daha iyisi yaratıklardan, boss’lardan ve pazardan gelir. İksirler başkentteki <b>İksir ve Parşömen</b> dükkânında satılır.</p>`;
  if (TV.sub === 'armors') {
    const c = TV.cls, rows = SH.armors.filter(x => c === 'all' || x.cls === c);
    return `${head}${subs}${pzSub(c, [['all', 'Hepsi'], ...CLASS_KEYS.map(k => [k, CLASSES[k].name])], 'tcCls')}<div class="pz-grid">${rows.length ? rows.map(ware).join('') : '<p class="mut">Bu sınıfın bugünkü rafı boş; yarın yenilenir.</p>'}</div><p class="mut">Zırh rafı her gün farklı 12 parçaya döner. Yenilenmeye ${clockText(nextDay() - now())} var.</p>`;
  }
  if (TV.sub === 'mats') return `${head}${subs}<div class="pz-grid">${SH.mats.map(x => { const left = npcLeft(S, x.id, x.max), ok = S.akce >= x.price && left > 0; return `<div class="pz-card g0"><div class="pz-top">${resTile(x.icon, 'lg')}<div class="pz-nm"><b>${x.name}</b><br><span class="mut">${x.desc}</span></div></div><div class="pz-bot"><span class="mut">Stok ${left}</span><b class="price">${ri('akce')} ${fmt(x.price)}</b><button class="btn sm ${ok ? 'green' : ''}" data-a="tcBuy" data-id="${x.id}" ${ok ? '' : 'disabled'}>Al</button></div></div>`; }).join('')}</div><p class="mut">Örs malzemeleri burada pahalıdır: ucuzu Maden takasında ve parçalamadadır. Her üründen günde ${SH.mats[0].max} tane.</p>`;
  const eq = equippedIds(S), items = sortedItems().filter(x => !eq.has(x.id));
  for (const id of [...TV.pick]) if (!items.some(x => x.id === id)) TV.pick.delete(id);
  const sel = items.filter(x => TV.pick.has(x.id)), total = sel.reduce((a, x) => a + sellPrice(x), 0), plain = items.filter(x => x.g === 0 && !x.p && !x.r);
  return `${head}${subs}<div class="sub"><button data-a="tcPlain" ${plain.length ? '' : 'disabled'}>Sıradanları sat (${plain.length})</button><button data-a="tcPickG" data-g="0">Standartları seç</button><button data-a="tcPickG" data-g="-1">Temizle</button>${fishBagValue(S) ? `<button data-a="balikSat">Balıkları sat (+${fmt(fishBagValue(S))})</button>` : ''}<span class="sp"></span><button data-a="tcSell" class="on" ${sel.length ? '' : 'disabled'}>${ri('akce')} ${sel.length} eşyayı sat (+${fmt(total)})</button></div>
    ${itemCard(items.find(x => x.id === TV.last))}${invGrid(items, { act: 'tcPick', sel: TV.pick, note: x => `${fmt(sellPrice(x))}`, empty: 'Satılabilecek (kuşanılmamış) eşyan yok.' })}`;
}
ACT.tcSub = d => { TV.sub = d.k; redraw(); };
ACT.tcCls = d => { TV.cls = d.k; redraw(); };
ACT.tcBuy = async d => { const r = await run('npc.buy', { id: d.id }); if (!r) return; toast(r.mat ? 'Satın alındı.' : `${itemBase(r.b).name} çantana girdi.`); redraw(); };
ACT.tcPot = async d => { const r = await run('npc.pot', { k: d.k, n: +d.n }); if (!r) return; toast(`${POT[r.k].name} ×${r.n} alındı (elinde ${r.have}).`); redraw(); };
ACT.tcPick = d => { const id = +d.id; TV.pick.has(id) ? TV.pick.delete(id) : TV.pick.add(id); TV.last = id; redraw(); };
ACT.tcPickG = d => { const eq = equippedIds(S), g = +d.g; TV.pick = new Set(g < 0 ? [] : S.items.filter(x => !eq.has(x.id) && x.g <= g && !x.p && !x.r).map(x => x.id)); redraw(); };
ACT.tcSell = async () => { const r = await run('npc.sell', { ids: [...TV.pick] }); if (r) { TV.pick.clear(); toast(`+${fmt(r.akce)} akçe`); redraw(); } };
ACT.tcPlain = () => { const eq = equippedIds(S), ids = S.items.filter(x => !eq.has(x.id) && x.g === 0 && !x.p && !x.r).map(x => x.id), total = ids.reduce((a, id) => a + sellPrice(itemOf(S, id)), 0);
  confirmBox('Sıradanları sat', `${ids.length} Standart, artısız eşya tüccara ${fmt(total)} akçeye satılacak.`, async () => { const r = await run('npc.sell', { ids }); if (r) { TV.pick.clear(); toast(`+${fmt(r.akce)} akçe`); redraw(); } }, 'Sat'); };

// ---------- Posta ----------
// ---------- İksir ve Parşömen (sürüm 13, başkent) ----------
// Eski "Pazar ve Tüccar" binasının yerinde: İksirci Maelis'in dükkânı. İksirler (npc.pot) ve parşömenler (npc.scroll; shared/npc.js).
const IV = { tab: 'pots' };
// İksirci (özgün çizim): başörtülü eczacı, arkada renkli şişeli raf, tezgâhta havan ve rulo parşömenler
const IKSIRCI_SVG = '<svg viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="8" fill="#1e2a26"/><rect x="4" y="8" width="56" height="3" fill="#6a4526"/><rect x="4" y="24" width="56" height="3" fill="#6a4526"/>'
  + [[9, '#ff6a5a'], [17, '#6ab8ff'], [45, '#8ee07a'], [53, '#c9a0ff']].map(([x, c]) => `<rect x="${x - 2.5}" y="13" width="5" height="10" rx="2" fill="${c}"/><rect x="${x - 1.5}" y="11" width="3" height="3" fill="#e9e4d4"/>`).join('')
  + '<path d="M8 64c3-13 12-18 24-18s21 5 24 18z" fill="#2f6a5a"/><path d="M22 50l10 8 10-8" stroke="#e7c75a" stroke-width="2.5" fill="none"/><ellipse cx="32" cy="33" rx="11" ry="12" fill="#e2b48a"/>'
  + '<path d="M19 36c-2-14 5-22 13-22s15 8 13 22c-1-8-5-13-13-13s-12 5-13 13z" fill="#7a3a5a"/><path d="M21 27q11-6 22 0" stroke="#e7c75a" stroke-width="2" fill="none"/>'
  + '<circle cx="28" cy="33" r="1.5" fill="#2a1a08"/><circle cx="36" cy="33" r="1.5" fill="#2a1a08"/><path d="M28 39q4 3 8 0" stroke="#7a2a1a" stroke-width="1.6" fill="none"/></svg>';
// Parşömen simgesi (özgün): iki ucu rulo, ortası yazılı, mumlu mühür
export const scrollSvg = (k = 'energy') => { const c = k === 'arena' ? ['#ff8a5a', '#a8341a'] : ['#7fe08a', '#2f8a3a'];
  return `<svg viewBox="0 0 32 32" class="potsvg" aria-hidden="true"><rect x="7" y="6" width="18" height="20" fill="#f1e2bc" stroke="#6a4a24" stroke-width="1.3"/><rect x="4" y="3.5" width="24" height="4.5" rx="2.2" fill="#d9bf86" stroke="#6a4a24" stroke-width="1.3"/><rect x="4" y="24" width="24" height="4.5" rx="2.2" fill="#d9bf86" stroke="#6a4a24" stroke-width="1.3"/><path d="M10.5 11h11M10.5 14.5h9M10.5 18h7" stroke="#a88a52" stroke-width="1.4" stroke-linecap="round"/><circle cx="22" cy="20" r="3.6" fill="${c[0]}" stroke="${c[1]}" stroke-width="1.2"/><path d="M22 18.3v3.4M20.3 20h3.4" stroke="#fff" stroke-width="1" opacity=".85"/></svg>`; };
const IK_TITLE = `<span class="pz-tt"><span class="pz-por">${IKSIRCI_SVG}</span><span>İksir ve Parşömen</span></span>`;
const ikHead = t => `<div class="pz-head ik-head"><div class="ik-por">${IKSIRCI_SVG}</div><div class="grow"><b>${NPC.apothecary.name}</b><p>${t === 'pots' ? 'Kazanda yeni kaynadı! Savaşta bir yudum, turunu bile bitirmez.' : 'Mühürlü parşömenler: açtığın an etkisi başlar. Her gün yenileri yazılır.'}</p></div><span class="chip rw">${ri('akce')} ${fmt(S.akce)}</span></div>`;
function iksirPage(t) {
  if (t === 'scrolls') return `${ikHead(t)}<div class="pz-grid ik-grid">${npcScrolls(S).map(x => { const ok = !x.lock && x.left > 0 && S.akce >= x.price;
    return `<div class="pz-card g0 potcard ik-card ${x.lock ? 'dim' : ''}"><div class="pz-top"><span class="potico">${scrollSvg(x.icon)}</span><div class="pz-nm"><b>${x.name}</b><br><span class="mut">${x.desc}</span></div></div>
      <div class="pz-bot"><span class="mut">${x.lock ? `${ri('lock')} Sv. ${x.lock}` : `Bugün ${x.left}/${x.max}`}</span><b class="price">${ri('akce')} ${fmt(x.price)}</b><button class="btn sm ${ok ? 'green' : ''}" data-a="ikScroll" data-id="${x.id}" ${ok ? '' : 'disabled'}>Al</button></div></div>`; }).join('')}</div>
    <p class="mut">Parşömenler alındığı anda açılır, çantada yer kaplamaz. Günlük stok 00:00’da yenilenir; fiyat seviyenle artar.</p>`;
  return `${ikHead(t)}<div class="pz-grid ik-grid">${npcPots(S).map(x => `<div class="pz-card g0 potcard ik-card"><div class="pz-top"><span class="potico">${potSvg(x.k)}</span><div class="pz-nm"><b>${x.name}</b><br><span class="mut">${x.k === 'hp' ? 'Azami canının' : 'Azami mananın'} %${Math.round(x.pct * 100)}’ini hemen yeniler.</span></div></div><div class="pz-bot"><span class="mut">Elinde ${x.have}/${POT.max}</span><b class="price">${ri('akce')} ${fmt(x.price)}</b></div><div class="potbuy">${POT_PACKS.map(n => { const ok = S.akce >= x.price * n && x.have + n <= POT.max; return `<button class="btn sm ${ok ? 'green' : ''}" data-a="tcPot" data-k="${x.k}" data-n="${n}" ${ok ? '' : 'disabled'}>×${n} · ${fmt(x.price * n)}</button>`; }).join('')}</div></div>`).join('')}</div>
    <p class="mut">İksirler çantada yer kaplamaz, satılamaz ve takas edilemez. Savaşta çubuğun sağındaki iki yuvadan içilir: içmek turunu bitirmez; savaş başına her türden en çok ${POT.cap} tane, aynı türü içtikten sonra ${POT.cd} tur bekleme. Meydan ve kuşatmada iksir yoktur. Fiyat seviyenle artar.</p>`;
}
const SCROLL_TAB = '<span class="tico"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h12a2 2 0 0 1 0 4h-1v10a2 2 0 0 1-2 2H5a2 2 0 0 1 0-4h1z" /><path d="M9 9h5M9 12h5" stroke="#0007" stroke-width="1.4"/></svg></span>';
const POT_TAB = '<span class="tico"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 2h6v2h-1v3.5c3 1.1 5 3.9 5 7.2C19 19 15.9 22 12 22s-7-3-7-7.3c0-3.3 2-6.1 5-7.2V4H9z"/></svg></span>';
ACT.iksir = d => { if (d?.tab) IV.tab = d.tab === 'scrolls' ? 'scrolls' : 'pots';
  openWin({ title: IK_TITLE, tab: IV.tab, tabs: [{ id: 'pots', label: 'İksirler', small: 'Can · Mana', pre: POT_TAB }, { id: 'scrolls', label: 'Parşömenler', small: 'Enerji · Meydan', pre: SCROLL_TAB }], onTab: t => { IV.tab = t; }, render: iksirPage }); };
ACT.ikScroll = async d => { const r = await run('npc.scroll', { id: d.id }); if (!r) return; const x = npcScrolls(S).find(s => s.id === r.id); toast(`${x ? x.name : 'Parşömen'} açıldı${r.loot?.length ? '' : ': bugün +1 meydan hakkı'}.`); if (r.loot?.length) lootToast(r.loot); redraw(); };

const MAILTAB = { sys: 'Gelen', rep: 'Raporlar' };
// Sekme rozetleri: sistem postası (alınmamış/silinmemiş) ve okunmamış savaş raporları. Veri yüklenince sekme yazıları güncellenir.
function mailBadges(D) {
  const nav = document.querySelector('#win .tabs'); if (!nav || !D) return;
  const sys = D.mail.length, rep = unreadReports(D.rep, D.rseen);
  for (const [id, n] of [['sys', sys], ['rep', rep]]) { const sp = nav.querySelector(`[data-id="${id}"] > span:not(.tico)`); if (sp) sp.innerHTML = `${MAILTAB[id]}<small>${n ? `${n} ${id === 'rep' ? 'yeni' : 'posta'}` : id === 'rep' ? 'Savaş kayıtları' : 'Sistem postaları'}</small>`; }
}
ACT.mail = d => { repReset(null, true); MAILV.open = null; MAILV.who = null; if (d?.tab !== 'yaz') MAILV.to = null; let first = true; openWin({ title: 'Posta', top: true, tab: d?.tab === 'rep' || d?.tab === 'yaz' ? d.tab : 'sys', tabs: [{ id: 'sys', label: 'Gelen', small: 'Postaların', icon: 'mail' }, { id: 'yaz', label: 'Posta Yaz', small: 'Oyuncu, klan, ulus', icon: 'quest' }, { id: 'rep', label: 'Raporlar', small: 'Savaş kayıtları', icon: 'arena' }],
  onTab: () => repReset(null),
  load: async () => { if (first) { first = false; repReset(d?.sub); } const [m, r] = await Promise.all([run('mail.list'), run('report.list')]); if (!m) return null; return { mail: m.mail, rseen: m.rseen, rep: r || { mine: [], def: [] } }; },
  render: tab => {
    const D = cur().data;
    if (!D) return loading;
    setTimeout(() => mailBadges(D), 0);
    if (tab === 'rep') { repSeen(D); return reportsTab(D); }
    if (tab === 'yaz') return writeTab();
    if (!D.mail.length) return '<p class="mut">Postan boş. Pazarda satılan eşyalarının akçesi buraya düşer.</p>';
    // 19 Kas: posta listesi kapalı zarflar; dokununca içerik aynı yerde açılır (Geri ile listeye dönülür)
    const open = MAILV.open != null && D.mail.find(m => String(m.id) === String(MAILV.open));
    const gift = m => m.give.length || m.item, subj = m => { const t = String(m.text || ''); return t.length > 54 ? t.slice(0, 53) + '…' : t; };
    const when = m => (m.at ? new Date(m.at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' }) : '');
    if (open) return `<article class="mlx-open"><header><button class="btn sm" data-a="mailBack">‹ Geri</button><span class="mlx-when">${open.from ? `${esc(fromLine(open))} · ` : ''}${esc(when(open))}</span></header>
      <div class="mlx-paper"><div class="mlx-seal">${med('mail', 'blue')}</div><p>${esc(open.text)}</p>
      ${gift(open) ? `<div class="mlx-att"><small>Ekler</small><div class="chips">${open.give.map(lootChip).join('')}${open.item ? `${ico(open.item)}<span class="chip rw gn g${open.item.g}">${esc(itemName(open.item))}</span>` : ''}</div></div>` : ''}</div>
      <div class="mbtns">${open.kind === 'p' && open.fid ? `<button class="btn" data-a="mailTo" data-id="${esc(open.fid)}" data-name="${esc(open.from)}">Yanıtla</button>` : ''}<button class="btn ${gift(open) ? 'green' : 'red'}" data-a="mailClaim" data-id="${open.id}">${gift(open) ? 'Ekleri al' : 'Postayı sil'}</button></div></article>`;
    return `<div class="mlx-list">${D.mail.map(m => `<button class="mlx-item${gift(m) ? ' gift' : ''}" data-a="mailOpen" data-id="${m.id}">${m.item ? ico(m.item) : med('mail', gift(m) ? 'green' : 'blue')}<span class="grow"><b>${esc(subj(m))}</b><small>${m.from ? `${esc(fromLine(m))} · ` : ''}${esc(when(m))}${gift(m) ? ' · eki var' : ''}</small></span><i class="mlx-go" aria-hidden="true">›</i></button>`).join('')}</div>`;
  } }); };
const MAILV = { open: null, to: null, who: null, friends: null };
// 19 Kas: posta yazma. Alıcı: arkadaş listesi ya da oyuncu kartındaki "Posta yaz"; klan lideri bütün klana, kral bütün ulusa yazabilir
const fromLine = m => (m.kind === 'nation' ? `Kral ${m.from} · ulusa` : m.kind === 'clan' ? `${m.from} · ${m.cname || 'klan'} lideri` : m.from);
function writeTab() {
  if (!MAILV.who) { MAILV.who = {}; Promise.all([run('mail.who'), run('friend.list')]).then(([w, f]) => { MAILV.who = w || {}; MAILV.friends = f?.friends || []; redraw(); }); return loading; }
  const opts = [...(MAILV.who.ruler ? [['nation', 'Bütün ulus (kral postası)']] : []), ...(MAILV.who.clanLeader ? [['clan', 'Bütün klan (lider postası)']] : []),
    ...(MAILV.to ? [[`p:${MAILV.to.id}`, MAILV.to.name]] : []), ...(MAILV.friends || []).filter(f => !MAILV.to || String(f.id) !== String(MAILV.to.id)).map(f => [`p:${f.id}`, f.name])];
  const sel = MAILV.to ? `p:${MAILV.to.id}` : opts[0]?.[0] || '';
  return `<div class="mlx-write"><label><small>Alıcı</small><select id="mwTo">${opts.length ? opts.map(([v, t]) => `<option value="${esc(v)}" ${v === sel ? 'selected' : ''}>${esc(t)}</option>`).join('') : '<option value="">Arkadaş yok: oyuncu kartından "Posta yaz"</option>'}</select></label>
    <label><small>Mesaj</small><textarea id="mwText" maxlength="400" rows="5" placeholder="Postanı yaz…"></textarea></label>
    <p class="mut">Günde 20 oyuncu postası; klan lideri günde 3 klan postası, kral günde 1 ulus postası gönderebilir. İletişim bilgisi ve küfür gizlenir.</p>
    <div class="mbtns"><button class="btn red" data-a="mailSend">Gönder</button></div></div>`;
}
ACT.mailTo = d => { closeModal(); MAILV.to = { id: d.id, name: d.name }; if (!$('#win').hidden && cur()?.title === 'Posta') ACT.tab({ id: 'yaz' }); else ACT.mail({ tab: 'yaz' }); };
ACT.mailSend = async () => {
  const to = $('#mwTo')?.value || '', text = $('#mwText')?.value || '';
  if (!to) return toast('Alıcı seç.');
  const r = to === 'nation' ? await run('mail.nation', { text }) : to === 'clan' ? await run('clan.mail', { text }) : await run('mail.send', { to: to.slice(2), text });
  if (!r) return;
  toast(to === 'nation' ? 'Postan bütün ulusa gönderildi.' : to === 'clan' ? `Postan ${r.sent} klan üyesine gönderildi.` : `Postan ${r.to} adlı oyuncuya gönderildi.`);
  $('#mwText').value = '';
};
ACT.mailOpen = d => { MAILV.open = d.id; redraw(); };
ACT.mailBack = () => { MAILV.open = null; redraw(); };
ACT.mailClaim = async d => { const r = await run('mail.claim', { id: d.id }); if (r) { lootToast(r.loot); MAILV.open = null; } reload(); };

// ---------- Şan Divanı ----------
ACT.hall = () => openWin({ title: 'Şan Divanı', render: () => locked('hall') ? lockPage('hall') : `<div class="hint">Meydanda ve seferlerde kazandığın <b>Şan</b> ile karakterine kalıcı bonus alırsın. Her seviye +%${HALL.pct * 100}. (Elinde ${ri('san')} ${fmt(S.san)} şan)</div>
  ${Object.entries(HALL.stats).map(([k, n]) => { const l = S.hall[k], cost = HALL.cost(l); return `<div class="row">${med(k, k === 'hp' ? 'red' : k === 'atk' ? '' : 'blue')}<span class="tag">${l}/${HALL.max}</span><div class="grow"><b>${n}</b><br><span class="mut">Şu an +%${Math.round(l * HALL.pct * 100)}${l < HALL.max ? ` → +%${Math.round((l + 1) * HALL.pct * 100)}` : ''}</span></div>${l < HALL.max ? `<button class="btn" data-a="hallUp" data-k="${k}" ${S.san >= cost ? '' : 'disabled'}>${ri('san')} ${fmt(cost)} şan</button>` : '<span class="chip">En yüksek</span>'}</div>`; }).join('')}` });
ACT.hallUp = d => doAct('hall.up', { stat: d.k });

// ---------- Kader Çarkı: oranlar açık yazılır ----------
let wheelLast = null, wheelAnim = null; // wheelAnim: kırılmakta olan parçanın türü (animasyon sürerken)
// Parça kırma: kristal titrer, çatlar, parçalanır; ardından çıkan ödül belirir (index.html: .wbrk)
const SHARD_COL = { kor: ['#ff7a2a', '#ffd08a', '#a8240e'], ayaz: ['#6ec8ff', '#e6f7ff', '#1f5f9a'], simsek: ['#c9a0ff', '#fff3a0', '#5a2fa8'] };
const crystal = k => { const [c, l, d] = SHARD_COL[k] || SHARD_COL.kor;
  const frag = (pts, i) => `<polygon class="wf f${i}" points="${pts}" fill="${i % 2 ? c : l}" stroke="${d}" stroke-width="1.5"/>`;
  return `<div class="wbrk" style="--c:${c};--l:${l}"><svg viewBox="0 0 100 120" aria-hidden="true"><g class="wcr"><polygon points="50,6 82,40 70,104 30,104 18,40" fill="${c}" stroke="${d}" stroke-width="3"/><polygon points="50,6 64,40 50,104 36,40" fill="${l}" opacity=".55"/>
    <path class="wck" d="M50 30 L44 52 L56 64 L47 86 M44 52 L30 60 M56 64 L70 58" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/></g>
    <g class="wfr">${frag('50,6 66,24 50,40 36,24', 0)}${frag('66,24 82,40 66,56 54,40', 1)}${frag('36,24 50,40 36,56 18,40', 2)}${frag('54,40 70,58 58,80 46,62', 3)}${frag('36,56 46,62 44,104 30,104', 4)}${frag('58,80 70,104 50,104 52,84', 5)}</g>
    <circle class="wfl" cx="50" cy="55" r="40" fill="#fff"/></svg><b>Parça kırılıyor…</b></div>`; };
// Kader Çarkı: üç mücevher türü (Kor, Ayaz, Şimşek parçası) çarkın yerinde büyük görüntüleriyle durur. Birine dokununca
// o mücevher ortaya gelir ve kırılır; içinden çıkan ödül gösterilir. Oranlar aşağıdaki havuzda açıktır (WHEEL.pool).
const gemArt = (k, big) => { const [c, l, d] = SHARD_COL[k] || SHARD_COL.kor;
  return `<svg class="gem-art ${big ? 'big' : ''}" viewBox="0 0 100 120" aria-hidden="true"><defs><radialGradient id="gg${k}" cx=".5" cy=".55" r=".55"><stop offset="0" stop-color="${l}" stop-opacity=".9"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient></defs>
    <circle cx="50" cy="58" r="48" fill="url(#gg${k})"/><polygon points="50,6 82,40 70,104 30,104 18,40" fill="${c}" stroke="${d}" stroke-width="3"/><polygon points="50,6 64,40 50,104 36,40" fill="${l}" opacity=".55"/>
    <polygon points="18,40 82,40 64,40 50,6 36,40" fill="#fff" opacity=".18"/><path d="M28 30 L34 22" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8"/></svg>`; };
ACT.wheel = () => { wheelLast = null; openWin({ title: 'Kader Çarkı', render: () => {
  if (locked('wheel')) return lockPage('wheel');
  const has = k => (S.shards[k] || 0) >= WHEEL.cost && !wheelAnim;
  const stage = wheelAnim ? crystal(wheelAnim)
    : wheelLast ? `<div class="hint up wrev"><b>Çıkan: ${WHEEL.pool[wheelLast.index].name}</b>${lootBox(wheelLast.loot)}<button class="btn sm" data-a="wheelBack">Mücevherlere dön</button></div>`
    : `<div class="gem-row">${Object.entries(SHARDS).map(([k, n]) => `<button class="gem-card ${has(k) ? '' : 'off'}" data-a="spin" data-k="${k}" ${has(k) ? '' : 'disabled'}>${gemArt(k, true)}<b>${n}</b><small>${ri('shard_' + k)} ${S.shards[k] || 0}/${WHEEL.cost}</small><em>${has(k) ? 'Dokun: kır' : 'Parça yetmiyor'}</em></button>`).join('')}</div>`;
  return `<div class="hint">Gök Yarığı'ndan gelen parçalar burada mücevhere dönüşür. Bir mücevhere dokun: kırılır ve içinden bir ödül çıkar. Her kırma ${WHEEL.cost} parça ister.</div>
  <div class="gem-stage">${stage}</div>${wheelAnim ? '' : `<div class="ad-wheel">${S.daily.adSpin > 0 ? `<button class="btn green" data-a="spin" data-k="ad">${ri('star')} Ücretsiz çevir</button>` : adWheelBtn()}</div>`}`; } }); };
ACT.wheelBack = () => { wheelLast = null; redraw(); };
ACT.spin = async d => {
  if (wheelAnim) return;
  const quick = matchMedia('(prefers-reduced-motion: reduce)').matches;
  wheelAnim = d.k === 'ad' ? 'kor' : d.k; wheelLast = null; redraw(); // 'ad': reklamla kazanılan ücretsiz çevirme (parçasız); kristal animasyonu için bir renk seçilir
  const [r] = await Promise.all([run('wheel.spin', { k: d.k }), new Promise(res => setTimeout(res, quick ? 250 : 1350))]); // sunucu yanıtı kristal kırılmasıyla aynı anda beklenir
  wheelAnim = null; if (r) wheelLast = r; redraw();
};

// ---------- Kervan: ui-odeme.js (ACT.shop, ACT.shopBuy) ----------
ACT.devPremium = () => doAct('dev.premium');

// ---------- Premium üyelik: Bronz, Gümüş, Platin ----------
ACT.premium = () => openWin({ title: 'Premium', render: () => {
  const cur2 = myTier(), days = cur2 ? Math.max(1, Math.ceil((S.premium.until - now()) / 86400000)) : 0;
  const card = T => {
    const label = cur2 === T.id ? 'Uzat (+30 gün)' : cur2 > T.id ? 'Üst kademedesin' : cur2 ? 'Yükselt' : 'Al';
    return `<div class="tier t${T.id} ${cur2 === T.id ? 'on' : ''}"><h4>${svg('crown')}${T.name}</h4><b class="price">${T.yakut ? `${ri('gem')} ${fmt(T.cost)} yakut` : 'Gerçek parayla'}</b> <span class="mut">/ ${T.days} gün</span>
      <ul><li>Savaşta <b>+%${T.xp * 100}</b> deneyim ve akçe</li><li>Eşya düşme oranı <b>+%${T.drop * 100}</b></li><li>Maden <b>×${String(T.mine).replace('.', ',')}</b> cevher</li><li><b>+${T.slots}</b> pazar ilan yuvası</li><li><b>+${T.tickets}</b> günlük meydan hakkı <span class="mut">(normal ${ARENA.tickets})</span></li></ul>
      ${T.yakut ? `<button class="btn ${cur2 > T.id ? '' : 'red'}" data-a="premBuy" data-t="${T.id}" ${cur2 > T.id || S.yakut < T.cost ? 'disabled' : ''}>${label}</button>${cur2 <= T.id && S.yakut < T.cost ? `<br><span class="warn" style="font-size:11px">${fmt(T.cost - S.yakut)} yakut eksik</span>` : ''}`
        : `<button class="btn ${cur2 > T.id ? '' : 'red'}" data-a="shop" data-tab="money" ${cur2 > T.id ? 'disabled' : ''}>${cur2 > T.id ? label : 'Kervan\'da gör'}</button>`}</div>`;
  };
  return `<div class="hint">${cur2 ? `Etkin üyeliğin: <b>${PREMIUM[cur2].name} Premium</b> · ${days} gün kaldı.` : 'Şu an üyeliğin yok.'} Elinde ${ri('gem')} <b>${fmt(S.yakut)}</b> yakut var.</div>
    <div class="tiers">${PREMIUM.slice(1).map(card).join('')}</div>
    <p class="mut">Bronz yakutla, Gümüş ve Platin yalnızca gerçek parayla alınır. Aynı kademeyi yeniden almak süreyi 30 gün uzatır. Üst kademeye geçince alt kademenin kalan süresi devredilmez. Üyelik eşsiz eşya, boss hakkı ya da örs şansı vermez.</p>
    ${DEV ? '<div class="mbtns"><button class="btn sm" data-a="devPremium">Test: kademeyi değiştir</button></div>' : ''}`;
} });
ACT.premBuy = d => {
  const T = PREMIUM[+d.t], cur2 = myTier();
  const go = async () => { const r = await doAct('premium.buy', { tier: T.id }); if (r) toast(`${T.name} Premium etkin.`); };
  cur2 && cur2 < T.id ? confirmBox(`${T.name} Premium`, `${PREMIUM[cur2].name} üyeliğinin kalan süresi devredilmez. ${fmt(T.cost)} yakut karşılığında ${T.name} 30 gün başlasın mı?`, go, 'Yükselt') : go();
};

// ---------- Görevler ----------
// Gece yarısına kalan süre (görev panosunun başlığında)
const toMidnight = () => { const d = new Date(now()), m = new Date(d); m.setHours(24, 0, 0, 0); const s = Math.max(0, (m - d) / 1000 | 0); return `${Math.floor(s / 3600)} sa ${Math.floor(s / 60) % 60} dk sonra yenilenir`; };
export const dailyQuestsHtml = () => {
  const gift = `<div class="qb2-card gift ${S.daily.gift ? 'done' : 'ready'}"><div class="qb2-top">${med('gift', 'gold')}<span class="qb2-day">Bugün</span></div>
    <b class="qb2-name">Günlük giriş ödülü</b><div class="qb2-rw"><small>Ödül</small><span class="chips"><span class="chip rw">${ri('akce')}${fmt(RULES.gift.akce(S.lvl))}</span><span class="chip rw">${ri('energy')}${RULES.gift.energy}</span><span class="chip rw">${ri('gem')}${RULES.gift.yakut}</span></span></div>
    <div class="qb2-act">${S.daily.gift ? '<span class="qb2-got">Alındı</span>' : '<button class="btn green" data-a="gift">Ödülü al</button>'}</div>${S.daily.gift ? '<i class="qb2-stamp">TAMAM</i>' : '<i class="qb2-burst"></i>'}</div>`;
  return questBoard({ list: QUESTS, prog: q => questProgress(S, q), done: id => !!S.daily.qdone[id], claim: 'questClaim', go: 'questGo', icon: q => QUEST_ICON[q.id] || 'quest',
    allDone: QUESTS.every(q => S.daily.qdone[q.id]), allGot: !!S.daily.qdone.all, bonusAct: 'questBonus', bonus: [QUEST_ALL], bonusName: 'Altı görevi de bitir', timer: toMidnight(), extra: gift });
};
ACT.quests = () => openWin({ title: 'Günlük Görevler', render: dailyQuestsHtml }); // ui-kalicilik.js bunu sekmeli (Günlük / Haftalık) pencereyle değiştirir
// Görev satırının ikonu (görev kimliğine göre)
export const QUEST_ICON = { win: 'battle', up: 'forge', break: 'shatter', boss: 'boss', arena: 'arena', collect: 'wagon' };
// "Git": görevin yapıldığı ekranı açar
const QUEST_GO = {
  win: () => ACT.quick(),
  up: () => locked('anvil') ? toast(`Örs: ${lockNote('anvil')}`) : ACT.anvil({ tab: 'up' }),
  break: () => locked('anvil') ? toast(`Örs: ${lockNote('anvil')}`) : ACT.breakWin(),
  boss: () => {
    for (const Z of ZONES) for (const s of zoneStages(Z.id)) if (s.kind === 'boss' && stageOpen(S, s.id) && bossAvailable(S, s.id)) return ACT.stage({ id: s.id });
    toast('Şu an girebileceğin bir boss yok: önce boss kapısına kadar ilerle.'); ACT.gate({ tab: 'zones' });
  },
  arena: () => locked('arena') ? toast(`Meydan: ${lockNote('arena')}`) : ACT.gate({ tab: 'pvp' }),
  collect: () => {
    if (locked('mine')) return toast(`Maden: ${lockNote('mine')}`);
    ACT.mine();
  },
};
ACT.questGo = d => QUEST_GO[d.id]?.();
ACT.gift = async () => { const r = await doAct('daily.gift'); if (r) lootToast(r.loot); };
ACT.questClaim = async d => { const r = await doAct('quest.claim', { id: d.id }); if (r) lootToast(r.loot); };
ACT.questBonus = async () => { const r = await doAct('quest.bonus'); if (r) lootToast(r.loot); };

// ---------- Klan: Klan Karargâhı ekranı ui-klan.js'tedir · Ansiklopedi: ui-esya.js ----------
