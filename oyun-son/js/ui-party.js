// Karakter ekranı (sürüm 12; eski adı Parti): ortada karakter ve çevresinde gerçek dizilimli ekipman yuvaları (baş üstte,
// eller iki yanda, ayak altta), yanda ekipman / yetenek / nitelik / ustalık paneli. Oyuncunun tek kahramanı vardır
// (roster.js MAIN); sekmeler bu kahramanın bölümleridir. ACT.party adı eski çağıranlar için durur (= ACT.karakter).
import { S } from './api.js';
import { ACT, esc, fmt, pct, toast, confirmBox, openWin, redraw, doAct, cur, heroPic, heroArt, ico, itemLine, slotIco, med, hooks } from './ui-core.js';
import { CLASSES, STATS, STAT_KEYS, RESET_COST, TREE_MAX, BAG_LIMIT, SKILL_POINTS_FROM_LEVEL, SKILL_POINTS_PER_LEVEL } from '../shared/content.js';
import { SKILLS, describe, treeSkills, classSkills, BASIC, pathSkills } from '../shared/skills.js';
import { SLOTS, itemBase, setsOf, SET_PIECES, fmtSetFx } from '../shared/items.js';
import { heroStats, power, statPointsFree, skillPointsFree, unlockedSkills, equippedIds, ownerOf, itemOf, treeOf, LOADOUT_ACTIVES, heroItemLevel, itemLevel, gearItems, statTotals } from '../shared/hero.js';
import { clsOf, mainId } from '../shared/roster.js';
import { MASTERY, MASTERY_KEYS, masteryOf, masteryOpen, masteryFree, masterySpent, heroMastery, nodeText } from '../shared/mastery.js';
import { svg, ri } from './icons.js';
import { coefSheet, subSection, setSection, cmpLine, subTotals, fmtSubTot, SUB_TIP } from './esya-parts.js';
import { skillIcon } from './skill-icons.js';
import { pathPanel, pathSlot, pathPending, pathLockNote } from './ui-sinif.js'; // uzmanlık yolları: karşılaştırma, yol ağacı, yol değiştirme

import { PATH, PATHS, pathOf, pathsOf, specTrees } from '../shared/paths.js';
import { kxView } from './ui-kahraman.js';
import { ytView } from './ui-yetenek.js'; // 19 Kas gece: yetenek ağacı görünümü (üç dal, bağlı düğümler, sağda bilgi) // 19 Kas gece: Karakter görünümü (yuvalar + 3B + özellikler + envanter)
const PV = { sub: 'eq', slot: null, sk: {} }; // sub: açık bölüm · sk: yetenek görünümü ('tree' ağaçlar · 'path' uzmanlık yolu)
export const HID = () => mainId(S); // karakterin tek kahramanı
const nameOf = () => S.name;
const SUBS = ['eq', 'skill', 'stat', 'mst', 'unvan'];
const subTabs = hid => { const sp = statPointsFree(S, hid), kp = skillPointsFree(S, hid), mf = masteryOpen(S) ? masteryFree(S, S.heroes[hid]) : 0;
  return [{ id: 'eq', label: 'Karakter', small: 'Ekipman, nitelik, envanter', icon: 'party', dot: sp > 0 }, { id: 'skill', label: `Yetenek${kp ? ` (${kp})` : ''}`, small: pathPending(hid) ? 'Yol seçilmedi' : 'Ağaç ve yol', icon: 'skills', dot: kp > 0 }, { id: 'mst', label: `Ustalık${mf ? ` (${mf})` : ''}`, small: `${MASTERY.unlock}. seviyeden`, icon: 'trophy' }, { id: 'unvan', label: 'Unvan', small: 'Başarım unvanları', icon: 'crown' }]; }; // Aşama 5: Unvan sekmesi (ui-kalicilik.js titlesHtml) // 19 Kas gece: Nitelik bölümü Karakter görünümüne katıldı (sekme 'stat' de Karakter'i açar) };
// d.tab: açılacak bölüm (eq · skill · stat · mst); verilmezse en son bakılan · d.back: geri düğmesinin işlemi
ACT.party = d => {
  const tab = SUBS.includes(d?.tab) ? d.tab : PV.sub;
  PV.sub = tab;
  openWin({ title: 'Karakter', tab: tab === 'stat' ? 'eq' : tab, tabs: subTabs(HID()), tabsFn: () => subTabs(HID()), back: (typeof d?.back === 'string' && d.back) || undefined, render: renderParty, onTab: t => { PV.slot = null; PV.sub = t; } });
};
ACT.karakter = ACT.party;
ACT.sub = d => ACT.party({ tab: d.id });
// Bildirimden: Yetenek bölümü, uzmanlık yolu görünümüyle
ACT.partyPath = () => { PV.sk[HID()] = 'path'; ACT.party({ tab: 'skill' }); };

function statsKv(st, cls = HID()) {
  const rows = [['Can', 'maxHp', 'hp'], ['Saldırı', 'atk', 'atk'], ['Büyü', 'mag', 'mag'], ...(st.fire || st.bolt ? [['Alev Hasarı', 'fire', 'mag'], ['Yıldırım Hasarı', 'bolt', 'mag']] : []), ['Savunma', 'def', 'def']]; // Hız gösterilmez (19 Kas: hız savaşta askıda)
  return `<div class="kv">${rows.map(([l, k, i]) => `<div><small>${ri(i)}${l}</small>${fmt(st[k])}</div>`).join('')}<div><small>${ri('crit')}Kritik</small>${pct(st.crit)}</div><div><small>${ri('power')}Güç</small>${fmt(power(st))}</div><div class="ilvc" title="Eşya Seviyesi: kuşanılan eşyaların kademe, nadirlik, artı ve su verme ortalaması"><small>${ri('gear')}Eşya Sv.</small>${heroItemLevel(S, cls)}</div></div>${coefSheet(st)}`;
}
// Kâğıt bebek: yuvalar karakterin üstünde durduğu yere göre dizilir.
// Sol sütun karakterin SAĞ tarafıdır (bize bakıyor): sağ el solda, sol el sağda.
const DOLL_L = ['ear1', 'neck', 'wr', 'gloves', 'ring1'], DOLL_R = ['ear2', 'chest', 'wl', 'belt', 'ring2'];
function doll(hid) {
  const h = S.heroes[hid];
  const slot = (s, extra = '') => { const it = itemOf(S, h.eq[s]); return `<button class="ds ${PV.slot === s ? 'sel' : ''} ${extra}" data-a="slot" data-s="${s}" title="${SLOTS[s]}">${it ? ico(it) : slotIco(s)}<small>${SLOTS[s]}</small></button>`; };
  return `<div class="doll"><div class="dcol">${DOLL_L.map(s => slot(s)).join('')}</div>
    <div class="dmid">${heroArt(hid, 'dimg')}${slot('helm', 'dtop')}<div class="dbot">${slot('legs')}${slot('boots')}</div></div>
    <div class="dcol">${DOLL_R.map(s => slot(s)).join('')}</div></div>`;
}
// ---------- Ustalık (mastery.js): 60. seviyeden sonra kahramanın kendi ağacı ----------
function partyMastery(hid) {
  const h = S.heroes[hid], M = masteryOf(S), open = masteryOpen(S), free = open ? masteryFree(S, h) : 0, r = heroMastery(h), spent = masterySpent(h);
  const need = MASTERY.need(M.lvl), maxed = M.lvl >= MASTERY.maxLvl;
  const top = open ? `<div class="mst-head"><span class="mst-lv"><small>Ustalık</small><b>${M.lvl}</b><small>/ ${MASTERY.maxLvl}</small></span>
      <div class="grow"><b>${maxed ? 'En yüksek ustalık seviyesi' : `Sonraki seviye: %${Math.floor(100 * M.xp / need)}`}</b><div class="pbar"><i style="width:${maxed ? 100 : Math.min(100, 100 * M.xp / need)}%"></i></div>
      <span class="mut">Her ustalık seviyesi 1 puan verir. Savaşlardan kazandığın deneyim ustalığa da yazılır.</span></div>
      <div class="mst-pts"><b>${free}</b><small>puan</small></div></div>`
    : `<div class="hint">${ri('lock')} <b>Ustalık ${MASTERY.unlock}. seviyede açılır</b> (şu an Sv. ${S.lvl}). O seviyeden sonra kazandığın deneyim ustalık seviyeni yükseltir; her seviye bir puan verir.</div>`;
  const cards = MASTERY_KEYS.map(k => { const N = MASTERY.nodes[k], n = r[k] || 0, full = n >= N.max, ok = open && free > 0 && !full;
    return `<div class="mst-c ${n ? 'on' : ''} ${full ? 'full' : ''}">${ri(N.icon)}<div class="grow"><b>${N.name}</b><small>${n ? nodeText(k, n) : `Kademe başına ${nodeText(k, 1).replace('+', '+')}`}</small>
      <span class="mst-pips">${Array.from({ length: N.max }, (_, i) => `<i class="${i < n ? 'f' : ''}"></i>`).join('')}</span></div>
      <button class="btn sm ${ok ? 'green' : ''}" data-a="mstUp" data-k="${k}" ${ok ? '' : 'disabled'}>${full ? 'Tam' : '+1'}</button></div>`; }).join('');
  const reset = open && spent ? `<div class="mbtns" style="justify-content:flex-start"><button class="btn sm" data-a="mstReset">Puanları geri al (${fmt(MASTERY.resetCost * M.lvl)} akçe)</button></div>` : '';
  return `${top}<div class="mst-grid ${open ? '' : 'lock'}">${cards}</div>${reset}${masterSkills(hid)}`;
}
// Usta ağacı: 60. seviyede açılan usta yetenekleri; ustalık ağacına verilen puan sırayla açar (skills.js MREQ)
function masterSkills(hid) {
  const cls = clsOf(S, hid), h = S.heroes[hid], path = pathOf(h), open = unlockedSkills(S, hid), spent = masteryOpen(S) ? masterySpent(h) : 0;
  const list = Object.values(SKILLS).filter(s => s.cls === cls && (s.master || (s.pm && s.path === path))).sort((a, b) => a.mreq - b.mreq);
  return `<div class="tree" style="margin-top:8px"><h4>Usta yetenekleri<span>ustalık puanı: ${spent}</span></h4><p class="mut">${MASTERY.unlock}. seviyede açılır. Ustalık ağacına verdiğin puanlar usta yeteneklerini sırayla açar${path ? '' : '; uzmanlığının usta yeteneği için önce uzmanlık seç'}.</p>
    ${list.map(S2 => { const ok = open.includes(S2.id), on = h.act.includes(S2.id); return `<button class="node ${ok ? '' : 'lock'} ${on ? 'on' : ''}" data-a="skill" data-id="${S2.id}">${sico(S2)}<span><b>${S2.name}${S2.pm ? ` · ${PATHS[path].role}` : ''}</b>${describe(S2)}</span><small>${on ? 'Düzende' : ok ? 'Açık' : `${S2.mreq} puan`}</small></button>`; }).join('')}</div>`;
}
ACT.mstUp = d => doAct('mastery.up', { hero: HID(), k: d.k });
ACT.mstReset = () => confirmBox('Ustalık puanlarını geri al', `Ustalık puanların boşa çıkar; yeniden dağıtabilirsin. Bedeli ${fmt(MASTERY.resetCost * masteryOf(S).lvl)} akçe.`, async () => { const r = await doAct('mastery.reset', { hero: HID() }); if (r) toast(`${r.refunded} ustalık puanı geri alındı.`); }, 'Geri al');

function renderParty(tab) {
  const hid = HID();
  if (!S.heroes[hid]) return '<p class="mut">Karakter bulunamadı.</p>';
  if (SUBS.includes(tab)) PV.sub = tab;
  const C = CLASSES[clsOf(S, hid)];
  // 19 Kas: karakter değiştirme kalktı; başlık kahraman şeridi (ad, sınıf ve uzmanlık, seviye, güç, eşya seviyesi)
  const st0 = heroStats(S, hid), P0 = pathOf(S.heroes[hid]), CI = { warrior: 'atk', rogue: 'crit', priest: 'hp', mage: 'mag' }[clsOf(S, hid)] || 'atk';
  const head = `<div class="chx-band"><span class="chx-crest">${ri(CI)}</span><div class="chx-id"><small>${esc(C.name)}${P0 && PATHS[P0] ? ` · ${esc(PATHS[P0].role)}` : ''}</small><b>${esc(S.name)}</b></div>
    <div class="chx-pills"><span><small>Seviye</small><b>${S.lvl}</b></span><span><small>Güç</small><b>${fmt(power(st0))}</b></span><span><small>Eşya Sv.</small><b>${heroItemLevel(S, hid)}</b></span></div></div>`;
  if (PV.sub === 'skill') return (PV.sk[hid] || (pathPending(hid) ? 'path' : 'tree')) === 'tree' ? ytView(hid) : `<div class="chx">${head}${partySkill(hid)}</div>`;
  if (PV.sub === 'mst') return `<div class="chx">${head}${partyMastery(hid)}</div>`;
  if (PV.sub === 'unvan') return `<div class="chx chx-unvan">${head}${hooks.titlesHtml?.() || ''}</div>`;
  return kxView(hid); // eski görünüm (doll + partyEq/partyStat) yedek olarak duruyor
}
// Zırh seti bonusları (items.js): giyilen parça sayısı, açık ve kapalı eşikler
function setPanel(hid) {
  const items = gearItems(S, hid), sets = setsOf(items), { tot, n } = subTotals(items);
  const act = sets.reduce((a, x) => a + x.on.length, 0);
  const subs = `<div class="setp sbtot"><b>Yan Stat Katkısı</b> <span class="mut">${n ? `${n} yan stat` : 'yok'}</span>${n ? `<div class="subs">${Object.keys(tot).map(k => `<span class="sb">${esc(fmtSubTot(k, tot[k]))}</span>`).join('')}</div>` : `<div class="mut">${SUB_TIP}</div>`}</div>`;
  const head = `<h4 class="setH">Setler <small class="${act ? 'on' : ''}">${act ? `${act} bonus etkin` : 'etkin bonus yok'}</small></h4>`;
  if (!sets.length) return `${subs}${head}<div class="setp mut">Aynı setten 2, 4 ve 5 parça giyersen set bonusu açılır. Her parçanın bilgi kartında hangi sete ait olduğu yazar.</div>`;
  return subs + head + sets.map(s => `<div class="setp ${s.on.length ? 'act' : ''}"><b>${esc(s.set)} seti</b> <span class="mut">${s.n}/5 parça · ${s.on.length}/3 bonus</span>${SET_PIECES.map(x => `<div class="setr ${s.n >= x ? 'on' : ''}"><i>${x}</i>${s.bonus[x].map(fmtSetFx).join(' · ')}${s.n >= x ? ' <em>etkin</em>' : ''}</div>`).join('')}</div>`).join('');
}
function partyEq(hid) {
  const cls = clsOf(S, hid), h = S.heroes[hid], st = heroStats(S, hid);
  if (!PV.slot) return `${statsKv(st)}${setPanel(hid)}<div class="hint">Karakterin üzerindeki bir yuvaya dokun: o yuvaya kuşanabileceğin eşyalar burada listelenir.<br>Çanta: ${S.items.length}/${BAG_LIMIT}</div>`;
  const s = PV.slot, curIt = itemOf(S, h.eq[s]), eqAll = equippedIds(S);
  const owner = id => ownerOf(S, id);
  const cands = S.items.filter(it => { const B = itemBase(it.b); return it !== curIt && B.slots.includes(s) && (!B.cls || B.cls.includes(cls)) && !(eqAll.has(it.id) && owner(it.id) === hid); })
    .sort((a, b) => (itemBase(b.b).tier * 10 + b.g * 3 + b.p + (b.r ? 8 : 0)) - (itemBase(a.b).tier * 10 + a.g * 3 + a.p + (a.r ? 8 : 0)));
  return `<h3>${SLOTS[s]}</h3>${curIt ? `<div class="row">${ico(curIt)}<div class="grow">${itemLine(curIt)}</div><button class="btn sm" data-a="unequip" data-s="${s}">Çıkar</button></div>${subSection(curIt)}${setSection(S, curIt, hid, [hid])}` : '<p class="mut">Bu yuva boş.</p>'}
    ${cands.length ? cands.map(it => {
      const B = itemBase(it.b), low = S.lvl < B.req, o = eqAll.has(it.id) ? owner(it.id) : null;
      return `<div class="row ${low ? 'dim' : ''}">${ico(it)}<div class="grow">${itemLine(it)}${o ? `<br><span class="mut">Şu an ${esc(nameOf(o))} üzerinde</span>` : ''}${cmpLine(it, curIt)}${setSection(S, it, null, [hid])}</div><button class="btn sm green" data-a="equip" data-id="${it.id}" data-s="${s}" ${low ? 'disabled' : ''}>${low ? `Sv. ${B.req}` : 'Kuşan'}</button></div>`;
    }).join('') : '<p class="mut">Çantanda bu yuvaya uygun başka eşya yok. Eşyalar stage’lerden düşer ya da Pazar’dan alınır.</p>'}`;
}
ACT.slot = d => { PV.sub = 'eq'; PV.slot = PV.slot === d.s ? null : d.s; redraw(); };
ACT.equip = d => doAct('item.equip', { hero: HID(), id: +d.id, slot: d.s });
ACT.unequip = d => doAct('item.unequip', { hero: HID(), slot: d.s });

// Yetenek ikonu: yeteneğe özel ikon (skill-icons.js) varsa o, yoksa tür ikonu (pasif / animasyon türü)
export const sico = S2 => `<span class="sico ${S2.type === 'passive' ? 'pas' : ''}">${skillIcon(S2.id) || svg(S2.type === 'passive' ? 'passive' : S2.anim)}</span>`;
function partySkill(hid) {
  const cls = clsOf(S, hid), h = S.heroes[hid], open = unlockedSkills(S, hid), free = skillPointsFree(S, hid), mine = S.lvl >= PATH.level ? pathOf(h) : null, trees = specTrees(cls, mine);
  const node = (S2, need) => {
    const ok = open.includes(S2.id), on = h.act.includes(S2.id) || h.pas === S2.id;
    return `<button class="node ${ok ? '' : 'lock'} ${on ? 'on' : ''}" data-a="skill" data-id="${S2.id}">${sico(S2)}<span><b>${S2.name}${S2.type === 'passive' ? ' · pasif' : ''}</b>${describe(S2)}</span><small>${need}</small></button>`;
  };
  const slot = (id, label) => { const S2 = SKILLS[id]; return `<div>${S2 ? sico(S2) : `<span class="sico" style="opacity:.35">${svg('lock')}</span>`}<span>${S2 ? S2.name : label}</span></div>`; };
  const starters = classSkills(cls).filter(s => s.lvl && !s.hidden);
  // Görünüm: yol seçimi bekleyen kahramanda ilk açılışta "Uzmanlık yolu", yoksa en son bakılan
  const view = PV.sk[hid] || (pathPending(hid) ? 'path' : 'tree');
  const top = `<p><b>Savaş düzeni</b> <span class="mut">1 temel + ${LOADOUT_ACTIVES} aktif. Açık bir yeteneğe dokunarak ekle ya da çıkar. Açık pasiflerin hepsi her zaman etkindir.</span></p>
    <div class="load yload">${slot(BASIC[cls])}${Array.from({ length: LOADOUT_ACTIVES }, (_, i) => slot(h.act[i], 'Boş aktif')).join('')}</div>
    <div class="sub ysub"><button data-a="skv" data-id="tree" class="${view === 'tree' ? 'on' : ''}">${ri('skills')}Ağaçlar${free ? ` (${free})` : ''}</button><button data-a="skv" data-id="path" class="${view === 'path' ? 'on' : ''}">${ri('star')}Uzmanlık yolu${pathPending(hid) ? ' <i class="ydot"></i>' : ''}</button></div>`;
  if (view === 'path') return top + pathPanel(hid);
  return `${top}
    <div class="sub"><b>Yetenek puanı: ${free}</b><span class="sp"></span><button data-a="skillReset">${rsLabel('skill')}</button></div>
    ${S.lvl < SKILL_POINTS_FROM_LEVEL ? `<div class="hint">Yetenek ağaçları ${SKILL_POINTS_FROM_LEVEL}. seviyede açılır: o seviyede uzmanlığını seçersin, sonra her seviye ${SKILL_POINTS_PER_LEVEL} puan verir. Puanı uzmanlığının ağacına ya da ortak ağaca verirsin; uzmanlık ağacındaki puan yolun yeteneklerini de açar. Bir ağaç ${TREE_MAX} puana kadar doldurulur.</div>` : ''}
    <div class="tree"><h4>Başlangıç yetenekleri</h4>${starters.map(s => node(s, `Sv. ${s.lvl}`)).join('')}</div>
    ${S.lvl >= PATH.level && !mine ? `<div class="hint">${ri('star')} <b>Uzmanlığını seç</b>: sınıfının iki uzmanlığından birini seçince o uzmanlığın ağacı açılır (Uzmanlık yolu sekmesi). Ortak ağaca şimdiden puan verebilirsin.</div>` : ''}
    <div class="trees" style="margin-top:6px">${treeOf(cls).map(t => { const ok = trees.includes(t.key), own = pathsOf(cls).find(k => PATHS[k].tree === t.key), lab = own ? `${PATHS[own].role} uzmanlığı` : 'Ortak ağaç';
      if (!ok) return `<div class="tree lock" style="opacity:.55"><h4>${t.name}<span>${lab}</span></h4><p class="mut">${t.desc}</p><div class="hint">${ri('lock')} ${own ? `Yalnızca ${PATHS[own].role} (${PATHS[own].name}) uzmanlığında açılır.` : `${PATH.level}. seviyede açılır.`}</div></div>`;
      return `<div class="tree"><h4>${t.name}<span>${lab} · ${h.tree[t.key] || 0}/${TREE_MAX}</span></h4><p class="mut">${t.desc}</p>
      <div class="sub"><button data-a="tp" data-t="${t.key}" data-n="1" ${free >= 1 ? '' : 'disabled'}>+1</button><button data-a="tp" data-t="${t.key}" data-n="5" ${free >= 5 ? '' : 'disabled'}>+5</button><button data-a="tp" data-t="${t.key}" data-n="${Math.min(free, TREE_MAX - (h.tree[t.key] || 0))}" ${free >= 1 ? '' : 'disabled'}>Hepsi</button></div>
      ${treeSkills(t.key).map(s2 => node(s2, `${s2.req} puan`)).join('')}</div>`; }).join('')}</div>`;
}
ACT.skv = d => { PV.sk[HID()] = d.id === 'path' ? 'path' : 'tree'; redraw(); };
ACT.tp = d => +d.n > 0 && doAct('skill.add', { hero: HID(), tree: d.t, n: +d.n });
// Ücretsiz sıfırlama hakkı (state.js freeReset): hak varken bedel yazılmaz
const rsFree = k => S.freeReset?.[k] || 0;
const rsLabel = k => (rsFree(k) ? `Ücretsiz sıfırla (${rsFree(k)} hak)` : `Sıfırla (${fmt(RESET_COST(S.lvl))} akçe)`);
const rsCost = k => (rsFree(k) ? `Ücretsiz (kalan hak ${rsFree(k)})` : `${fmt(RESET_COST(S.lvl))} akçe karşılığında`);
ACT.skillReset = () => confirmBox('Yetenekleri sıfırla', `${rsCost('skill')} ağaç puanların geri verilir.`, () => doAct('skill.reset', { hero: HID() }));
ACT.skill = d => {
  if (!d || !SKILLS[d.id]) return;
  const hid = HID(), h = S.heroes[hid], S2 = SKILLS[d.id];
  if (!unlockedSkills(S, hid).includes(d.id)) return toast(S2.master || S2.pm ? `${MASTERY.unlock}. seviyede, ustalık ağacına ${S2.mreq} puan verince açılır.` : S2.path ? pathLockNote(hid, S2) : S2.lvl ? `${S2.lvl}. seviyede açılır.` : !specTrees(clsOf(S, hid), S.lvl >= PATH.level ? pathOf(S.heroes[hid]) : null).includes(S2.tree) ? 'Bu ağaç seçtiğin uzmanlığa ait değil.' : `Bu ağaca ${S2.req} puan gerekli.`);
  let act2 = [...h.act], pas = h.pas, ppas = h.ppas ?? null;
  if (S2.type === 'passive') return toast('Pasif yetenek: açıldığı için her zaman etkin, düzene alınmaz.');
  if (act2.includes(d.id)) act2 = act2.filter(x => x !== d.id);
  else if (act2.length >= LOADOUT_ACTIVES) return toast('Düzen dolu: önce bir aktif yeteneği çıkar.');
  else act2.push(d.id);
  doAct('loadout.set', { hero: hid, act: act2, pas, ppas });
};
function partyStat(hid) {
  const h = S.heroes[hid], free = statPointsFree(S, hid), C = CLASSES[clsOf(S, hid)], T = statTotals(S, hid), RQ = { str: 'STR', vit: 'HP', dex: 'DEX', int: 'INT', mp: 'MP' };
  return `<div class="sub"><b>Nitelik puanı: ${free}</b><span class="sp"></span><button data-a="statReset">${rsLabel('stat')}</button></div>
    ${STAT_KEYS.map(k => `<div class="row">${med(k, '', h.pts[k])}<div class="grow"><b>${STATS[k].name} (${RQ[k]} ${T[k]})</b>${C.main === k ? ' <span class="chip">ana</span>' : ''}<br><span class="mut">${STATS[k].desc}</span></div>
      <button class="btn sm" data-a="sp" data-k="${k}" data-n="1" ${free >= 1 ? '' : 'disabled'}>+1</button><button class="btn sm" data-a="sp" data-k="${k}" data-n="${Math.min(10, Math.max(1, free))}" ${free >= 2 ? '' : 'disabled'}>+${Math.min(10, Math.max(2, free))}</button></div>`).join('')}
    ${statsKv(heroStats(S, hid))}`;
}
ACT.sp = d => doAct('stat.add', { hero: HID(), stat: d.k, n: +d.n });
ACT.statReset = () => confirmBox('Nitelikleri sıfırla', `${rsCost('stat')} nitelik puanların geri verilir.`, () => doAct('stat.reset', { hero: HID() }));
