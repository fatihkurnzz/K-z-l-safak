// Eşya paketinin ekranları: Örs'ün "Bas" sayfası (olasılık tablosu, Uğur Muskası / Tav Közü, beş ayrı sonuç) ve
// Ansiklopedi (kilitsiz yaratık listesi + bütün eşyaların kataloğu). Kural hesaplamaz: olasılıklar shared/items.js
// içindeki upOdds'tan (sunucunun kullandığı tablo), drop oranları sunucudan (codex.get, codex.item) gelir.
import { S, now } from './api.js';
import { fogNow } from '../shared/realm.js';
import { ACT, $, esc, fmt, pct, run, showModal, closeModal, openWin, redraw, mobImg, ico, rarTag, coefChips, statText, dropLabel, dropIco, ELEMENT, resTile, DEF_W, heroImg } from './ui-core.js';
import { plusCls } from './kaplama-parts.js';
import { sico } from './ui-party.js';
import { fmtRate, oneIn, coefName, subSection, setSection } from './esya-parts.js';
import { ownIds } from '../shared/roster.js';
import { invGrid } from './ui-envanter.js';
import { CLASSES, CLASS_KEYS } from '../shared/content.js';
import { SKILLS, describe } from '../shared/skills.js';
import { G_UNIQUE, STONES, TIERS, WEAPONS, JEWELS, ARMOR_SLOTS, SLOTS, RES_KEYS, STAT_LABEL, MAX_PLUS, maxPlusOf, SAFE_PLUS, UP_CHANCE, UP_STONES, EMBER_MULT,
  itemBase, itemStats, itemName, upOdds, upFee, stoneGrade, fmtStat, fmtPct, isCoef, resKey, allBases, minPlus } from '../shared/items.js';
import { ZONES, MOBS, zoneMobs, mobStages, mobClass, mobElements, mobRes, MOB_RES_LEVEL } from '../shared/zones.js';
import { equippedIds, itemOf, ownerOf } from '../shared/hero.js';
import { ri } from './icons.js';
import { RULES } from '../shared/rules.js';

// ======================= Örs: Bas =======================
const UP = { id: null, charm: false, ember: false, busy: false, last: null };
export const resetUp = () => { UP.last = null; };
const sorted = () => { const eq = equippedIds(S); return [...S.items].sort((a, b) => (eq.has(b.id) - eq.has(a.id)) || (b.g - a.g) || (itemBase(b.b).tier - itemBase(a.b).tier) || (b.p - a.p)); };
// Türkçe ekler: "+6'ya düşer", "+5'te kalır"
const DAT = ["0'a", "1'e", "2'ye", "3'e", "4'e", "5'e", "6'ya", "7'ye", "8'e", "9'a", "10'a"], LOC = ["0'da", "1'de", "2'de", "3'te", "4'te", "5'te", "6'da", "7'de", "8'de", "9'da", "10'da"];
// Seçili sarf malzemelerinden bu denemede gerçekten kullanılabilecek olanlar (sunucu da aynı koşulları arar)
const flags = it => ({ charm: UP.charm && S.charms > 0 && it.p > SAFE_PLUS, ember: UP.ember && (S.embers || 0) > 0 && UP_CHANCE[it.p] < 1 });
const OUT = {
  ok: r => `Başarılı! Eşya +${r.plus} oldu.`,
  fail: r => `Başarısız. Eşyan +${LOC[r.plus]} duruyor; yalnızca taş ve akçe gitti.`,
  drop: r => `Başarısız: eşya +${r.from} seviyesinden +${DAT[r.plus]} düştü.`,
  break: r => `Kırılma! Eşya +${r.from} seviyesinden +${DAT[r.plus]} döndü.`,
  safe: r => `Başarısız, ama Uğur Muskası korudu: eşyan +${LOC[r.plus]} kaldı.`,
};
const OUT_ICON = { ok: 'forge', fail: 'shatter', drop: 'shatter', break: 'shatter', safe: 'charm' };
function oddsHtml(it, f) {
  const fog = fogNow(now()), o = upOdds(it, { ...f, fog }), p = it.p; // sisli havada başarı şansı artar (realm.js; sunucu da aynı tabloyu kullanır)
  const cell = (cls, v, name, note) => v > 0 ? `<div class="od ${cls}" style="flex-grow:${Math.max(0.1, v)}"><b>${pct(v)}</b><small>${name}</small><em>${note}</em></div>` : '';
  return `<div class="odds">${cell('ok', o.ok, 'Başarı', `+${p + 1} olur`)}${cell(o.safe ? 'safe' : 'stay', o.stay, o.safe ? 'Korunur' : 'Başarısız', `+${LOC[p]} kalır`)}${cell('drop', o.drop, 'Seviye kaybı', `+${DAT[Math.max(SAFE_PLUS, p - 1)]} düşer`)}${cell('brk', o.brk, 'Kırılma', `+${DAT[SAFE_PLUS]} döner`)}</div>${fog && o.ok > upOdds(it, f).ok ? `<p class="fogn">Sisli hava: başarı şansı ${pct(upOdds(it, f).ok)} yerine ${pct(o.ok)}.</p>` : ''}`;
}



// Yükseltme penceresi (çizilmiş örs yok): ortada büyük eşya yuvası ve çevresinde dönen işaret halkası, altında malzeme
// yuvaları (bileği taşı, Uğur Muskası, Tav Közü). Basma sürerken halka hızlanır ve yuva nabız gibi atar; sonuçta yuva altın
// ışınla patlar (başarı), dumanla söner (başarısız), kızıl çatlakla sarsılır (kırılma) ya da kalkanla korunur (muska).
// Görsel tamamen özgün CSS'tir (css/v9.css: .up2-*); ad, simge ve görünüş başka bir oyundan alınmadı.
function forgeStage(it, g, need, f, max) {
  const rays = Array.from({ length: 12 }, (_, i) => `<i style="--a:${i * 30}deg"></i>`).join('');
  const slot = (cls, icon, name, n, on) => `<div class="up2-mat ${cls} ${on ? 'on' : ''}" title="${name}">${ri(icon)}<small>${n}</small></div>`;
  return `<div class="up2" aria-hidden="true"><div class="up2-bg"></div>
    <div class="up2-core"><div class="up2-ring"></div><div class="up2-ring r2"></div><div class="up2-rays">${rays}</div>
      <div class="up2-slot">${ico(it, 'lg')}<b class="up2-plus">+${it.p}</b></div><div class="up2-smoke"><i></i><i></i><i></i></div><div class="up2-crack"></div><div class="up2-shield"></div></div>
    ${max ? '<div class="up2-mats"><span class="mut">En yüksek seviye</span></div>' : `<div class="up2-mats">${slot('m1', 'stone' + g, 'Bileği taşı', need + '×', true)}${slot('m2', 'charm', 'Uğur Muskası', f.charm ? '1×' : '—', f.charm)}${slot('m3', 'ember', 'Tav Közü', f.ember ? '1×' : '—', f.ember)}</div>`}</div>`;
}
export function anvilUp() {
  const eq = equippedIds(S), items = sorted();
  if (!itemOf(S, UP.id)) UP.id = items[0]?.id ?? null;
  const it = itemOf(S, UP.id);
  const list = invGrid(items, { act: 'pickUp', sel: UP.id, empty: 'Çantanda eşya yok.' });
  let panel = '<p class="mut">Basılacak eşya yok.</p>';
  if (it) {
    const g = stoneGrade(it), max = it.p >= maxPlusOf(it), c = itemStats(it), nxt = max ? c : itemStats({ ...it, p: it.p + 1 }), f = flags(it);
    const need = max ? 0 : UP_STONES[it.p], fee = max ? 0 : upFee(it, S), ok = !max && S.stones[g] >= need && S.akce >= fee, L = UP.last;
    const risky = it.p > SAFE_PLUS, sure = !max && UP_CHANCE[it.p] >= 1;
    const tg = (k, on, off, icon, name, note, n) => `<button class="tg ${on ? 'on' : ''}" data-a="upOpt" data-k="${k}" ${off || UP.busy ? 'disabled' : ''}>${ri(icon)}<span><b>${name} <i>×${n}</i></b><small>${note}</small></span></button>`;
    panel = `<div class="anvil ${L ? 'o-' + L.out : ''}" id="anv">
      ${forgeStage(it, g, need, f, max)}
      <div class="ahead">${ico(it)}<div><span class="gn g${it.g}${plusCls(it.p)}">${esc(itemName(it))}</span> ${rarTag(it.g)}${max ? '<br><b>En yüksek seviye</b>' : `<br><b class="anext">+${it.p} → +${it.p + 1}</b>`}</div></div>
      ${max ? '' : `${oddsHtml(it, f)}
      <div class="tgs">${tg('charm', f.charm, !risky || S.charms < 1, 'charm', 'Uğur Muskası', !risky ? `+${SAFE_PLUS + 1} ve üstünde gerekir` : S.charms < 1 ? 'Elinde yok' : 'Kayıp ve kırılma yok', S.charms)}
        ${tg('ember', f.ember, sure || !(S.embers > 0), 'ember', 'Tav Közü', sure ? 'Başarı zaten kesin' : !(S.embers > 0) ? 'Elinde yok' : `Başarı şansı ×${String(EMBER_MULT).replace('.', ',')}`, S.embers || 0)}</div>
      <div class="abar"><p class="acost"><span class="nw">${ri('stone' + g)} ${need}× ${STONES[g].name.replace(' Bileği Taşı', ' Taş')} <span class="${S.stones[g] >= need ? 'mut' : 'warn'}">(elinde ${S.stones[g]})</span></span><i> · </i><span class="nw">${ri('akce')} ${fmt(fee)} <span class="${S.akce >= fee ? 'mut' : 'warn'}">akçe</span></span></p>
      <button class="btn red abtn" data-a="upgrade" ${ok && !UP.busy ? '' : 'disabled'}>BAS</button></div><div class="tens"><i></i></div>
      ${L ? `<p class="ares ${L.out}">${ri(OUT_ICON[L.out])}<b>${OUT[L.out](L)}</b></p>` : `<p class="mut arisk">${!risky ? 'Bu denemede eşyan seviye kaybetmez: başarısız olursa yalnızca taş ve akçe gider.' : f.charm ? 'Uğur Muskası bu denemede harcanır; başarısız olursa eşyan aynı kalır.' : `+${SAFE_PLUS + 1} ve üstünde başarısız deneme eşyayı bir artı düşürür${it.p >= 8 ? ', kırılma +5\'e döndürür' : ''}. Eşya asla yok olmaz.`}</p>`}`}
      <div class="kv">${Object.keys(c).filter(k => !isCoef(k)).map(k => `<div><small>${STAT_LABEL[k]}</small>${fmtStat(k, c[k])}${nxt[k] !== c[k] ? ` <span class="up">→ ${fmtStat(k, nxt[k])}</span>` : ''}</div>`).join('')}</div>${coefChips(c)}${subSection(it)}${setSection(S, it, ownerOf(S, it.id), ownIds(S))}</div>`;
  }
  return `<div class="forge up"><div>${panel}</div><div class="ivpick"><p class="mut ivhint">Basılacak eşyayı seç</p>${list}</div></div>`;
}
ACT.pickUp = d => { if (UP.busy) return; UP.id = +d.id; UP.last = null; redraw(); };
ACT.upOpt = d => { if (UP.busy) return; UP[d.k] = !UP[d.k]; UP.last = null; redraw(); };
const TENSION_MS = 2400; // yükseltme halkası hızlanır, yuva nabız gibi atar (css/v9.css: .anvil.forging .up2-*)
ACT.upgrade = async () => {
  if (UP.busy) return;
  const it = itemOf(S, UP.id); if (!it) return;
  const f = flags(it);
  UP.busy = true; UP.last = null;
  const el = $('#anv');
  if (el) { el.className = 'anvil forging'; el.querySelectorAll('button').forEach(b => { b.disabled = true; }); const res = el.querySelector('.ares'); if (res) res.style.visibility = 'hidden'; }
  const [r] = await Promise.all([run('anvil.upgrade', { id: UP.id, charm: f.charm, ember: f.ember }), new Promise(res => setTimeout(res, TENSION_MS))]);
  UP.busy = false; UP.last = r;
  if (S.charms < 1) UP.charm = false;
  if (!(S.embers > 0)) UP.ember = false;
  if (r) { const fl = document.createElement('div'); fl.className = 'flash af-' + r.out; document.body.appendChild(fl); setTimeout(() => fl.remove(), r.out === 'break' ? 900 : 550); }
  redraw();
};

// ======================= Ansiklopedi =======================
const CX = { zone: 1, type: 'sword', cls: 'all' };
// Eşya türleri (katalog grupları): silahlar, zırh parçaları, takılar
const TYPES = [...Object.entries(WEAPONS).map(([k, W]) => ({ k, name: W.name, icon: `w:${k}:${Math.max(3, W.from || 0)}` })), ...ARMOR_SLOTS.map(s => ({ k: s, name: SLOTS[s], icon: `a:warrior:3:${s}`, armor: true })), ...Object.entries(JEWELS).map(([k, J]) => ({ k, name: J.name, icon: `j:${k}:3` }))];
// Bir türün katalog girdileri: [taban, nadirlik]; nadirliğe (Eşsiz → Nadir → Standart), sonra kademeye göre sıralı
let BY_TYPE = null;
function entries(type) {
  if (!BY_TYPE) {
    BY_TYPE = {};
    for (const b of allBases()) { const B = itemBase(b); (BY_TYPE[B.type] ||= []).push(...(B.unique ? [[b, G_UNIQUE]] : [[b, 1], [b, 0]])); }
    for (const k in BY_TYPE) BY_TYPE[k].sort((x, y) => (y[1] - x[1]) || (itemBase(x[0]).req - itemBase(y[0]).req) || 0);
  }
  return BY_TYPE[type] || [];
}
const ENTRY_COUNT = () => allBases().reduce((a, b) => a + (itemBase(b).unique ? 1 : 2), 0);
const mobKind = M => M.boss ? (M.event ? 'Klan avı yaratığı' : 'Günlük boss') : M.captain ? 'Kapı kaptanı' : 'Yaratık';
ACT.codex = d => openWin({ title: 'Ansiklopedi', top: true, tab: d?.tab || 'mobs', tabs: [{ id: 'mobs', label: 'Yaratıklar', small: `${Object.keys(MOBS).length} yaratık`, icon: 'boss' }, { id: 'items', label: 'Eşyalar', small: `${ENTRY_COUNT()} eşya`, icon: 'gear' }], render: t => t === 'items' ? cxItems() : cxMobs() });
function cxMobs() {
  const mobs = [...zoneMobs(CX.zone), ...Object.keys(MOBS).filter(id => MOBS[id].event && !MOBS[id].tut && MOBS[id].zone === CX.zone)];
  return `<div class="sub">${ZONES.map(z => `<button data-a="cxZone" data-z="${z.id}" class="${z.id === CX.zone ? 'on' : ''}">${ri('zone' + z.id)}${z.name}</button>`).join('')}</div>
    <p class="mut">Bütün yaratıklar ve ganimet oranları açıktır. Bir yaratığa dokun: yetenekleri, saldırı türü, dirençleri ve düşürdükleri görünür.</p>
    <div class="cards">${mobs.map(id => { const M = MOBS[id], c = S.codex[id]; return `<button class="card" data-a="mob" data-id="${id}" style="color:var(--ink)">${mobImg(id, false, 'lg')}<b>${esc(M.name)}</b><span class="mut">${mobKind(M)} · ${c ? `${fmt(c.k)} kesim` : 'henüz kesilmedi'}</span></button>`; }).join('')}</div>`;
}
ACT.cxZone = d => { CX.zone = +d.z; redraw(); $('#page').scrollTop = 0; };
ACT.mob = async d => {
  const M = MOBS[d.id], r = await run('codex.get', { mob: d.id });
  if (!r) return;
  const st = mobStages(d.id), el = mobElements(d.id), res = mobRes(d.id, 99);
  showModal(`<h2>${esc(M.name)}</h2><div class="in" style="text-align:left">
    <div class="phead">${mobImg(d.id, true, 'full')}<div><p><b>${mobKind(M)}</b> · ${fmt(r.kills)} kesim</p>
    <p>Saldırı türü: <b>${coefName(mobClass(d.id))}</b>${el.length ? ` · elementleri: <b>${el.map(e => ELEMENT[e]).join(', ')}</b>` : ''}</p>
    <p>Zayıflığı: <b>${ELEMENT[M.weak] || 'yok'}</b> <span class="mut">(+%${RULES.weak} hasar alır)</span></p>
    <p>Dirençleri <span class="mut">(Sv. ${MOB_RES_LEVEL}+)</span>: ${Object.keys(res).length ? RES_KEYS.filter(k => res[k]).map(k => `<span class="cf">${STAT_LABEL[resKey(k)]} ${fmtPct(res[k])}</span>`).join(' ') : '<b>yok</b>'}</p>
    ${st.length ? `<p><b>Aşama:</b> ${st.map(s => s.replace('-', '.')).join(', ')}</p>` : ''}</div></div>
    <p class="sec"><b>Yetenekleri</b></p>${M.skills.map(s => `<div class="node">${sico(SKILLS[s])}<span><b>${SKILLS[s].name}</b>${describe(SKILLS[s])}</span></div>`).join('')}
    <p class="sec" style="margin-top:8px"><b>Ganimet</b> <span class="mut">kesim başına</span></p>${r.rows.map(x => `<div class="row">${dropIco(x.key)}<div class="grow"><b>${esc(dropLabel(x.key))}</b><br><span class="mut">${x.got} kez düşürdün</span></div><span class="tag rate">${fmtRate(x.rate)}<small>${oneIn(x.rate)}</small></span></div>`).join('')}
    ${r.elite?.length ? `<p class="sec" style="margin-top:8px"><b>Azılı hâli</b> <span class="mut">kesim başına</span></p><div class="chips elc">${r.elite.map(x => `<span class="chip">${esc(dropLabel(x.key))} <b>${fmtRate(x.rate)}</b></span>`).join('')}</div>` : ''}
    <div class="mbtns">${st[0] ? `<button class="btn red" data-a="goStage" data-id="${st[0]}">Git</button>` : ''}</div></div>`);
};
ACT.goStage = d => { closeModal(); ACT.gate({ tab: 'zones', zone: d.id.split('-')[0] }); };

function cxItems() {
  const T = TYPES.find(t => t.k === CX.type) || TYPES[0], rows = entries(T.k).filter(([b]) => !T.armor || CX.cls === 'all' || itemBase(b).cls[0] === CX.cls);
  const card = ([b, g]) => { const B = itemBase(b); return `<button class="icard g${g}" data-a="cxItem" data-b="${b}" data-g="${g}">${ico({ b, g, p: 0 })}<span><span class="gn g${g}">${esc(B.name)}</span><small>Sv. ${B.req}${B.kind === 'armor' ? ' · ' + CLASSES[B.cls[0]].name : ''}</small></span></button>`; };
  const group = g => { const list = rows.filter(r => r[1] === g); return list.length ? `<h3 class="cxh">${rarTag(g)} <span class="mut">${list.length} eşya</span></h3><div class="icards">${list.map(card).join('')}</div>` : ''; };
  return `<div class="cxtypes">${TYPES.map(t => `<button data-a="cxType" data-k="${t.k}" class="${t.k === T.k ? 'on' : ''}">${ico({ b: t.icon, g: 0, p: 0 }, 'sm')}<span>${t.name}</span></button>`).join('')}</div>
    ${T.armor ? `<div class="sub">${[['all', 'Tüm sınıflar'], ...CLASS_KEYS.map(c => [c, CLASSES[c].name])].map(([k, n]) => `<button data-a="cxCls" data-c="${k}" class="${CX.cls === k ? 'on' : ''}">${n}</button>`).join('')}</div>` : ''}
    <p class="mut">Oyundaki bütün eşyalar. Bir eşyaya dokun: statları, katsayıları ve nereden hangi oranla düştüğü görünür.</p>
    ${[2, 1, 0].map(group).join('')}`;
}
ACT.cxType = d => { CX.type = d.k; redraw(); $('#page').scrollTop = 0; };
ACT.cxCls = d => { CX.cls = d.c; redraw(); };
const RANK_NAME = { n: '', e: 'Azılı ', c: '', b: '' };
const stageSpan = (a, b) => a === b ? a.replace('-', '.') : `${a.replace('-', '.')} – ${b.replace('-', '.')}`;
function sourceRow(x, B) {
  const rate = (r, note = '') => `<span class="tag rate">${fmtRate(r)}<small>${note || oneIn(r)}</small></span>`;
  if (x.t === 'mob') return `<div class="row">${mobImg(x.mob, false, 'sm')}<div class="grow"><b>${RANK_NAME[x.rank]}${esc(MOBS[x.mob].name)}</b><br><span class="mut">${x.rank === 'b' ? 'Günlük boss' : x.rank === 'c' ? 'Kapı kaptanı' : x.rank === 'e' ? 'Azılı yaratık' : 'Yaratık'} · aşama ${stageSpan(x.from, x.to)}</span></div>${rate(x.rate)}</div>`;
  if (x.t === 'boss') return `<div class="row">${mobImg(x.mob, false, 'sm')}<div class="grow"><b>${esc(MOBS[x.mob].name)}</b><br><span class="mut">Günlük boss · aşama ${x.stage.replace('-', '.')} · Mühürlü Oda'da ${fmtRate(x.seal)}</span></div>${rate(x.rate)}</div>`;
  if (x.t === 'pity') return `<div class="row">${resTile('mark', 'sm')}<div class="grow"><b>İz takası</b><br><span class="mut">${esc(MOBS[x.mob].name)} izinden ${x.marks} tane biriktir; eşsizlerinden birini seç.</span></div><span class="tag rate">Kesin</span></div>`;
  if (x.t === 'depth') return `<div class="row">${resTile('key', 'sm')}<div class="grow"><b>Yeraltı Ocağı</b><br><span class="mut">Her kat bir Nadir eşya verir; kademesi seviyene göredir (bu eşya için Sv. ${B.req}–${(TIERS[B.tier + 1]?.req || 81) - 1}).</span></div>${rate(x.rate, 'kat başına')}</div>`;
  if (x.t === 'cal') return `<div class="row">${resTile('quest', 'sm')}<div class="grow"><b>Giriş takvimi</b><br><span class="mut">Yedi Gün takviminin 7. günü ve aylık takvimin 28. günü bir Nadir eşya verir; kademesi seviyene göredir (bu eşya için Sv. ${B.req}–${(TIERS[B.tier + 1]?.req || 81) - 1}).</span></div>${rate(x.rate, 'eşyalı ödül başına')}</div>`;
  if (x.t === 'wheel') return x.rate > 0 ? `<div class="row">${resTile('crystal', 'sm')}<div class="grow"><b>Kader Çarkı</b><br><span class="mut">${B.unique ? 'Eşsiz eşya dilimi, seviyene uygun eşsizlerden biri.' : `Nadir kademe eşyası dilimi; seviyen ${B.req}–${(TIERS[B.tier + 1]?.req || 81) - 1} iken.`}</span></div>${rate(x.rate, 'çevirme başına')}</div>`
    : `<div class="row dim">${resTile('crystal', 'sm')}<div class="grow"><b>Kader Çarkı</b><br><span class="mut">Seviyen ${x.lvl} olunca çarktan çıkabilir.</span></div><span class="tag rate">—</span></div>`;
  return '';
}
ACT.cxItem = async d => {
  const b = d.b, g = +d.g, B = itemBase(b), r = await run('codex.item', { b, g });
  if (!B || !r) return;
  const it = { b, g, p: minPlus(b) }, st = itemStats(it), top = itemStats({ ...it, p: maxPlusOf(it) }); // takı dışı eşya +1'den başlar
  const who = B.cls ? B.cls.map(c => CLASSES[c].name).join(', ') : 'Herkes', kind = B.kind === 'armor' ? `${SLOTS[B.type]} zırhı${B.set ? ` · ${B.set} seti` : ''}` : (WEAPONS[B.type] || JEWELS[B.type]).name;
  showModal(`<h2 class="gn g${g}">${esc(B.name)}</h2><div class="in" style="text-align:left">
    <div class="phead cxhead">${ico(it, 'xl')}<div><p>${rarTag(g)} <b>${kind}</b>${B.hands === 2 ? ' · Çift el' : ''}</p><p>Gereken seviye: <b>${B.req}</b> · Kuşanan: <b>${who}</b></p>
      <p>${statText(st, it)}</p>${coefChips(st)}<p class="mut">+${maxPlusOf(it)} hâli: ${statText(top)} · Bileği taşı: ${STONES[stoneGrade(it)].name}</p></div>
      ${B.cls && B.kind !== 'jewel' ? `<span class="cxwho">${B.cls.map(c => heroImg(c, false, 'sm', S.faction, DEF_W[c])).join('')}</span>` : ''}</div>
    <p class="sec"><b>Nereden düşer</b> <span class="mut">oranlar sunucunun drop tablosundan</span></p>
    ${r.rows.map(x => sourceRow(x, B)).join('')}
    <div class="row">${resTile('akce', 'sm')}<div class="grow"><b>Yemin Pazarı</b><br><span class="mut">Başka oyuncuların ilanlarından satın alınabilir. Tüccar ayrı bir tezgâhtır.</span></div></div>
    <p class="mut">Yaratık oranları kesim başınadır. Premium üyelik ve Üstün Irk bonusu kademe eşyası oranını artırır.</p>
    </div>`, 'cxbox');
};
