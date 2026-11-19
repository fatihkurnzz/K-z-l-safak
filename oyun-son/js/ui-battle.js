// Kapı (bölgeler, zindanlar, etkinlikler, meydan), savaş öncesi "VS" ekranı, savaşı başlatma ve sonuç.
import { A as A11Y } from './a11y.js';
import { capitalOf } from '../shared/content.js';
import { S, act } from './api.js';
import { ACT, hud, esc, fmt, xpGain, pct, stars, toast, run, showModal, closeModal, confirmBox, openWin, redraw, closeWin, reload, cur, mobImg, heroImg, unitImg, lootBox, locked, lockNote, loading, ico, itemLine, myPerks, med, hooks } from './ui-core.js';
import { runBattle } from './combat.js';
import { hisarOpen } from '../shared/hisar.js';
import { HISAR } from '../shared/content.js';
import { hideTown } from './town.js';
import { hideChatBar } from './ui-social.js';
import { ZONES, MOBS, zoneStages, stageDef, mobUnit } from '../shared/zones.js';
import { CLASSES, CLASS_KEYS, ENERGY, UNLOCK, ARENA, BOSS_PITY, FACTIONS, GAME, PREMIUM, leagueOf, weekDay, hourOf } from '../shared/content.js';
import { stageOpen, bossAvailable } from '../shared/calc.js';
import { partyUnits, heroUnit, partyPower, power, soloUnits } from '../shared/hero.js';
import { soloWaves } from '../shared/solo.js'; // tek kahramana göre budanmış ve ölçeklenmiş dalgalar (savaşta sunucu aynısını kurar)
import { itemBase } from '../shared/items.js';
import { HUNT_DIFF, huntDiffOf } from '../shared/clan.js';
import { now, DEV } from './api.js';
import { svg, ri } from './icons.js';
import { vsCoefs, vsCoefTable, ilvTag } from './esya-parts.js';
import { PV, tierBar, tierNote, bagNote, modBanner, modVsNote, modResultLine, depthRow, depthVs, seasonHead, oppTags, oppRule, dimResult, levelUpNote } from './ui-pvp.js'; // sezon, zorluk kademeleri, zindan düzeni
import { STAGE_TIERS, starsOf, CLIMB, ARENA_PTS } from '../shared/pvp.js';
import { reportAside, reportClass, reportBtn } from './ui-rapor.js';
import { RULES } from '../shared/rules.js'; // ekranda yazan ödül, bedel ve puanlar sunucuyla aynı tablodan okunur
import { warBonusLine } from '../shared/content.js';
import { adBtn } from './ui-reklam.js';

const GV = { zone: 1, tab: 'zones' };
const used = k => S.daily[k] || 0;
const zoneOpen = z => stageOpen(S, `${z}-1`, PV.tier); // PV.tier: seçili zorluk kademesi (ui-pvp.js)

// ---------- Kapı ----------
ACT.gate = d => {
  GV.tab = d?.tab || GV.tab;
  if (d?.zone) GV.zone = +d.zone; else if (!d?.tab) GV.zone = Math.max(...ZONES.filter(z => zoneOpen(z.id)).map(z => z.id));
  openWin({ title: 'Kapı', tab: GV.tab, tabs: [{ id: 'zones', label: 'Bölgeler', small: 'Sefer', icon: 'zones' }, { id: 'dungeons', label: 'Zindanlar', small: 'Günlük', icon: 'dungeon' }, { id: 'events', label: 'Etkinlikler', small: 'Sefer, akın', icon: 'events' }],
    render: renderGate, load: loadGate, onTab: t => { GV.tab = t; } });
};
async function loadGate(tab) {
  if (tab === 'pvp') return locked('arena') ? {} : { arena: await run('arena.list') };
  if (tab === 'events') return { war: await run('war.view'), akin: await run('akin.view'), siege: await run('siege.top'), baskin: await run('baskin.view') }; // baskin: Dünya Baskını (ui-baskin.js)
  return {};
}
function renderGate(tab) { return tab === 'zones' ? gateZones() : tab === 'dungeons' ? (hooks.dungeons ? hooks.dungeons() : gateDungeons()) : tab === 'events' ? gateEvents() : gatePvp(); }

function gateZones() {
  const T = PV.tier, SS = starsOf(S, T);
  if (!zoneOpen(GV.zone)) GV.zone = Math.max(1, ...ZONES.filter(z => zoneOpen(z.id)).map(z => z.id)); // kademe değişince açık olan en ileri bölge
  const Z = ZONES[GV.zone - 1], stages = zoneStages(Z.id, T), total = stages.reduce((a, s) => a + (SS[s.id] || 0), 0);
  const tiles = stages.map(s => {
    const open = stageOpen(S, s.id, T), st = SS[s.id] || 0;
    return `<button class="st ${s.kind} ${s.gate ? 'pic' : ''} ${open ? '' : 'lock'}" data-a="stage" data-id="${s.id}" data-t="${T}">${s.gate ? mobImg(s.gate, false, 'tile') : ''}<b>${s.n}</b>${open ? (s.kind === 'boss' && !bossAvailable(S, s.id, T) ? '<span>YARIN</span>' : stars(st)) : `<span class="ri">${svg('lock')}</span>`}</button>`;
  }).join('');
  // Bölgeler en üstte, tek satırda; seçili bölgenin manzarası sayfanın arka planı olur (index.html: .zbg)
  return `<div class="zbg z${Z.id}"><div class="sub zonerow">${ZONES.map(z => `<button data-a="zone" data-z="${z.id}" class="${z.id === GV.zone ? 'on' : ''}" ${zoneOpen(z.id) ? '' : 'disabled'}>${ri(zoneOpen(z.id) ? 'zone' + z.id : 'lock')}<span>${z.name}</span></button>`).join('')}</div>${tierBar()}${bagNote()}
    <h3>${Z.name}${T ? ` (${STAGE_TIERS[T].name})` : ''} <span class="mut">· Sv. ${T ? STAGE_TIERS[T].lvl : `${Z.lv[0]}-${Z.lv[1]}`} · ${total}/${stages.length * 3} ★</span></h3>${T ? tierNote(T) : `<p class="mut">${Z.desc}</p>`}${hooks.zoneInfo?.(Z.id) || ''}
    <div class="stg wide">${tiles}</div><p class="mut">Bir stage'e dokun. 5, 10, 15, 20 ve 25 kapı stage'idir; taçlı olanlar günlük boss'tur (eşsiz eşya ve iz verir).</p></div>`;
}
ACT.zone = d => { GV.zone = +d.z; redraw(); };
ACT.stage = d => { const t = +d.t || 0; if (!stageOpen(S, d.id, t)) return toast('Kilitli: önce bir önceki stage geçilmeli.'); openStageVs(d.id, t); };

const card = (pic, name, desc, chips, btn, tone = 'violet') => `<div class="row">${med(pic, tone)}<div class="grow"><b>${name}</b><br><span class="mut">${desc}</span><div class="chips">${chips.map(c => `<span class="chip">${c}</span>`).join('')}</div></div>${btn}</div>`;
const enter = (m, ok, label = 'Gir') => `<button class="btn red" data-a="mode" data-m="${m}" ${ok ? '' : 'disabled'}>${label}</button>`;
const lockChip = key => locked(key) ? [`Kilitli · Sv. ${UNLOCK[key]}`] : [];
function gateDungeons() {
  const weekend = weekDay(now()) >= 5 || DEV;
  return `${modBanner()}<div class="hint">Zindanlar enerji yerine günlük hak ya da anahtar ister. Düşmanlar seviyene göre kurulur.</div>
    ${card('well', 'Dipsiz Kuyu', `${RULES.well.waves} dalga dayan. Geçtiğin her dalga bir bileği taşı verir.`, [...lockChip('well'), `Bugün ${used('well')}/${RULES.well.daily}`, `En iyi ${S.wellBest}/${RULES.well.waves} dalga`], enter('well', !locked('well') && used('well') < RULES.well.daily))}
    ${depthRow(lockChip('depth'), enter('depth', !locked('depth') && S.depth < CLIMB.floors))}
    ${card('rift', 'Gök Yarığı', 'Yalnızca cumartesi ve pazar açılır. Kader Çarkı için parça verir.', [...lockChip('rift'), weekend ? 'Açık' : 'Hafta sonu açılır', `Bugün ${used('rift')}/${RULES.rift.daily}`], enter('rift', !locked('rift') && weekend && used('rift') < RULES.rift.daily))}
    ${card('sealroom', 'Mühürlü Oda', `Bir Mühür Taşı harcar; rastgele bir boss çıkar. Eşsiz şansı ${RULES.seal.unique} kat, günlük sınır yok.`, [...lockChip('seal'), `${ri('seal')} Mühür Taşı ${S.seals}`], enter('seal', !locked('seal') && S.seals > 0))}`;
}
function gateEvents() {
  const D = cur().data;
  if (!D) return loading;
  const w = D.war, a = D.akin, sg = D.siege;
  const bar = w ? (() => { const t = Math.max(1, w.now.ocak + w.now.sancak), o = 100 * w.now.ocak / t; return `<div class="warbar"><i style="width:${o}%;background:${FACTIONS.ocak.color}"></i><i style="width:${100 - o}%;background:${FACTIONS.sancak.color}"></i></div><div class="sub"><b style="color:${FACTIONS.ocak.color}">${FACTIONS.ocak.name} ${fmt(w.now.ocak)}</b><span class="sp"></span><b style="color:${FACTIONS.sancak.color}">${fmt(w.now.sancak)} ${FACTIONS.sancak.name}</b></div>`; })() : '';
  return `${hooks.baskinCard?.(D.baskin) || ''}<h3>Büyük Sefer <span class="mut">· haftalık taraf savaşı</span></h3>${bar}
    <p class="mut">Kazandığın her savaş tarafına puan yazar (bu hafta katkın: <b>${w ? fmt(w.mine) : 0}</b>). Haftayı kazanan taraf ${warBonusLine} düşürür.
    ${w?.winner ? `Geçen haftanın galibi: <b style="color:${FACTIONS[w.winner].color}">${FACTIONS[w.winner].name}</b>.` : ''} ${w?.buff ? '<b class="up">Drop bonusun etkin.</b>' : ''}</p>
    <h3 style="margin-top:10px">Akın <span class="mut">· 4 saatte bir, 1 saat açık</span></h3>
    <div class="row">${med('akin', 'red')}<div class="grow"><b>12 dalgada en çok yaratığı kes</b><br><span class="mut">Skorun tabloya yazılır; şan ve taş verir.</span><div class="chips"><span class="chip">${a?.open ? 'Açık' : 'Kapalı'}</span><span class="chip">Bugün ${a?.used || 0}/3</span></div></div>${enter('akin', !!a?.open && (a.used || 0) < 3 && !locked('arena'), 'Katıl')}</div>
    ${a ? `<div class="board">${a.top.map((r, i) => `<div class="${r.me ? 'me' : ''}"><span>${i + 1}.</span><b style="color:${FACTIONS[r.faction].color}">${esc(r.name)}</b><span>${fmt(r.score)}</span></div>`).join('')}</div>` : ''}
    <h3 style="margin-top:10px">Hisar Kuşatması <span class="mut">· haftalık klan yarışı</span></h3>
    <div class="row">${med('siege', 'red')}<div class="grow"><b>Hisar muhafızlarına saldır</b><br><span class="mut">4 dalga savunucu. Puanın klanının kuşatma skoruna yazılır.</span><div class="chips">${lockChip('siege').map(c => `<span class="chip">${c}</span>`).join('')}${hisarOpen(Date.now()) != null ? `<span class="chip up">Kuşatma penceresi ${S.weekly.hisar || 0}/${HISAR.tries}</span>` : `<span class="chip">Bu hafta ${S.weekly.siege || 0}/3</span>`}${S.clan ? '' : '<span class="chip">Klan gerekli</span>'}</div></div>${enter('siege', !locked('siege') && !!S.clan && (hisarOpen(Date.now()) != null ? (S.weekly.hisar || 0) < HISAR.tries : (S.weekly.siege || 0) < 3), 'Saldır')}</div>
    ${sg?.top.length ? `<div class="board">${sg.top.map((r, i) => `<div class="${r.mine ? 'me' : ''}"><span>${i + 1}.</span><b style="color:${FACTIONS[r.faction].color}">${esc(r.name)}</b><span>${fmt(r.score)}</span></div>`).join('')}</div>` : '<p class="mut">Bu hafta henüz kuşatma puanı yok.</p>'}`;
}
function gatePvp() {
  if (locked('arena')) return `<div class="hint">${ri('lock')} Meydan: ${lockNote('arena')}</div>`;
  const D = cur().data;
  if (!D) return loading;
  const A = S.arena, left = ARENA.tickets + (S.daily.arenaBonus || 0) + myPerks().tickets - used('arena'), free = !A.opp.length || now() - A.oppAt >= ARENA.refreshMs;
  const h = hourOf(now()), liveOpen = h === 13 || h === 21 || DEV;
  return `<h3>Meydan <span class="mut">· ${leagueOf(A.rating).name} ligi · ${A.rating} puan · toplam ${A.wins} galibiyet / ${A.losses} yenilgi</span></h3>${seasonHead()}
    <div class="sub"><b>Bugünkü hakkın: ${left}</b><span class="sp"></span><button data-a="rank">${ri('rank')}Sıralama</button><button data-a="arenaRefresh">Rakipleri yenile${free ? '' : ` (${ri('akce')}${ARENA.refreshCost} akçe)`}</button></div>
    ${A.opp.map((o, i) => `<div class="row"><div class="prow">${o.units.map(u => unitImg(u)).join('')}</div><div class="grow"><b style="color:${FACTIONS[o.faction].color}">${esc(o.name)}</b><br><span class="mut">Sv. ${o.lvl} · Güç ${fmt(o.power)} · ${ilvTag(o.il)} · ${o.rating} puan</span>${oppTags(o)}</div><button class="btn red" data-a="arenaVs" data-i="${i}" ${left > 0 ? '' : 'disabled'}>Dövüş</button></div>`).join('') || '<p class="mut">Rakip kalmadı. Listeyi yenile.</p>'}
    <p class="mut">Rakibin karakterini yapay zekâ oynar. Sana saldırılınca da karakterini yapay zekâ savunur: eşyanı ve yeteneklerini Karakter ekranında düzenle. <button class="btn sm" data-a="party">Karakter</button></p>
    <h3 style="margin-top:10px">Canlı Meydan <span class="mut">· 13:00 ve 21:00 · hamle süresi 15 sn</span></h3>
    <div class="row">${med('timer', 'blue')}<div class="grow"><b>Süreli düello</b> <span class="chip">${S.arena.live ?? 1000} puan</span><br><span class="mut">Ayrı sıralama, daha çok şan. Bu sürümde rakibi yapay zekâ oynar.</span><div class="chips">${lockChip('live').map(c => `<span class="chip">${c}</span>`).join('')}<span class="chip">${liveOpen ? 'Pencere açık' : 'Pencere kapalı'}</span></div></div><button class="btn red" data-a="liveFind" ${!locked('live') && liveOpen && left > 0 ? '' : 'disabled'}>Eşleş</button></div>
    <h3 style="margin-top:10px">Sancak Savaşı <span class="mut">· 3 raunt, tek kahramanla</span></h3>
    <div class="row">${med('banner', 'red')}<div class="grow"><b>Karakterinle sancağını savun</b><br><span class="mut">3 yapay müttefik ve karşı taraf. Kazandığın her raunt şan ve sefer puanı verir. Müttefikleri ve rakipleri bu sürümde yapay zekâ oynar.</span><div class="chips">${lockChip('banner').map(c => `<span class="chip">${c}</span>`).join('')}<span class="chip">Bugün ${used('banner')}/5</span></div></div>${enter('banner', !locked('banner') && used('banner') < 5, 'Seç')}</div>`;
}
ACT.arenaRefresh = async () => { const r = await run('arena.list', { refresh: true }); if (r) redraw(); };
// ---------- VS ekranı ----------
// cfg: { title, left:[birim], waves:[[birim]]|null, desc, rules:[html], args, energy, cost, sweep, pick, back, extra }
// Sol taraf: karakterin tek kahramanı (sürüm 12: parti ve dizilim yok)
let VS = null;
const vsLeft = () => VS.left || partyUnits(S);
function openVs(cfg) { VS = { auto: false, ...cfg }; openWin({ title: cfg.title, back: 'vsBack', render: renderVs }); }
// Öğretici: Dev Solucan'a karşı (ui-ogretici.js çocuğun diyaloğundan açar)
ACT.wormGo = () => openVs({ title: 'Dev Solucan', foe: 'Dev Solucan <span class="mut">· Nessa’yı yuttu</span>', waves: soloWaves([[mobUnit('devsolucan', Math.max(2, S.lvl))]], 'worm'), args: { mode: 'worm' }, rules: ['Ateş onu yakar (zayıflığı)', 'Yarı canında topraktan yeniden fırlar', 'Zafer: Nessa kurtulur, 600 akçe ve bileği taşları'] });
ACT.vsBack = () => (['arena', 'live', 'banner'].includes(VS?.args?.mode) ? ACT.meydan({ tab: 'fight' }) : ACT.gate({ tab: GV.tab === 'pvp' ? 'zones' : GV.tab, zone: GV.zone }));
const unitCard = (u, big) => `<div class="uc">${unitImg(u, big ? 'lg' : '')}<small>${u.lvl ? 'Sv. ' + u.lvl : ''}</small></div>`;
// Sağ taraf: yaratıklar türe göre gruplanır; kahraman birimleri tek tek gösterilir (aynı sınıftan iki kahraman olabilir)
function renderVs() {
  const c = VS, left = vsLeft();
  const pw = left.reduce((a, u) => a + power(u), 0);
  const right = c.waves ? c.waves.map((w, i) => { const g = {}; w.forEach((u, j) => { const k = u.cls ? 'h' + j : u.mob + (u.elite ? ':e' : ''); (g[k] || (g[k] = { u, n: 0 })).n++; }); return `<div class="vwave">${c.waves.length > 1 ? `<small>${i + 1}. dalga</small>` : ''}<div class="vrow">${Object.values(g).map(x => `<div class="uc">${unitImg(x.u)}<small>${x.u.boss || x.u.captain || x.u.cls ? esc(x.u.name) : (x.n > 1 ? '×' + x.n + ' ' : '') + esc(x.u.name)}</small></div>`).join('')}</div></div>`; }).join('') : `<div class="hint">${c.unknown || 'Düşmanlar savaş başlayınca belli olur.'}</div>`;
  const can = c.can !== false;
  return `<div class="vs"><div class="vside a"><h4>${c.left ? 'Senin tarafın' : esc(S.name)} <span class="mut">· Güç ${fmt(pw)}</span></h4><div class="vrow">${left.map(u => unitCard(u, false)).join('')}</div>${c.left ? '' : '<div class="vsform"><button class="btn sm" data-a="vsForm">Karakter</button></div>'}</div>
    <div class="vmid"><b class="vsx">VS</b>${c.rules ? `<div class="vrules">${c.rules.map(r => `<div>${r}</div>`).join('')}</div>` : ''}${c.desc ? `<p class="mut" style="text-align:center;max-width:190px">${c.desc}</p>` : ''}${vsCoefs(left, c.waves)}</div>
    <div class="vside b"><h4>${c.foe || 'Düşman'}</h4>${right}</div></div>
    ${c.extra || ''}
    <div class="vbtns">${c.sweep ? `<button class="btn blue" data-a="sweep" data-n="5">Seri ×5</button><button class="btn blue" data-a="sweep" data-n="10">×10</button>` : ''}
      ${(S.lvl | 0) >= 10 ? `<button class="btn ${VS.auto ? 'green' : ''}" data-a="vsAuto">Oto: ${VS.auto ? 'açık' : 'kapalı'}</button>` : ''}
      <button class="btn red big" data-a="vsStart" ${can ? '' : 'disabled'}>${c.startLabel || 'Başla'}${c.energy ? ` ${ri('energy', '#fff')} ${c.energy}` : ''}</button></div>`;
}
ACT.vsAuto = () => { if ((S.lvl | 0) < 10) return; VS.auto = !VS.auto; redraw(); };
ACT.vsCoef = () => showModal(`<h2>Saldırı Türleri</h2><div class="in" style="text-align:left">${vsCoefTable(vsLeft(), VS.waves)}</div>`, 'cxbox');
ACT.vsStart = () => startBattle(VS.args, VS.auto);
// Karakter ekranı (eşya, yetenek, nitelik); geri düğmesi bu ekrana döner
ACT.vsForm = () => ACT.party({ back: 'vsReturn' });
ACT.vsReturn = () => { if (VS) openWin({ title: VS.title, back: 'vsBack', render: renderVs }); else ACT.hub(); };
ACT.sweep = async d => {
  const lv = S.lvl, r = await run('battle.sweep', { stage: VS.args.stage, tier: VS.args.tier || 0, n: +d.n }); if (!r) return;
  showModal(`<h2>Seri Savaş</h2><div class="in"><p><b>${r.runs} savaş · ${r.wins} zafer</b></p><p>${ri('xp')} ${xpGain(r.xp, lv)} · ${ri('akce')} +${fmt(r.akce)} akçe</p>${r.levels ? levelUpNote(lv, S.lvl) : ''}${r.bagFull ? '<p class="warn">Çanta doldu: kalan savaşlar yapılmadı.</p>' : ''}${lootBox(r.loot) || '<p class="mut">Eşya düşmedi.</p>'}<div class="mbtns"><button class="btn" data-a="closeModal">Tamam</button></div></div>`);
  redraw();
};

function openStageVs(id, tier = 0) {
  const d = stageDef(id, tier), SS = starsOf(S, tier), boss = d.kind === 'boss', ready = bossAvailable(S, id, tier), marks = boss ? S.marks[d.gate] || 0 : 0;
  const sweep = !boss && SS[id] === 3 && !locked('sweep');
  openVs({ title: `${d.n}. ${d.name}${tier ? ` (${STAGE_TIERS[tier].name})` : ''}`, foe: `Düşman <span class="mut">· Sv. ${d.lvl}</span>`, waves: soloWaves(d.waves, 'stage'), args: tier ? { stage: id, tier } : { stage: id }, energy: d.energy, sweep, can: !boss || ready,
    rules: [`${stars(1)} Stage'i geç`, `${stars(2)} Canın %25'in üstündeyken geç`, `${stars(3)} Canın %50'nin üstündeyken geç`],
    desc: d.lvl > S.lvl + 1 ? `<span class="warn">Seviyen (${S.lvl}) bu stage için düşük.</span>` : !boss && SS[id] === 3 && locked('sweep') ? `Seri savaş ${UNLOCK.sweep}. seviyede açılır.` : !boss && SS[id] !== 3 ? '3 yıldızla geçersen seri savaş açılır.' : '',
    extra: boss ? `<div class="hint">${SS[id] ? `Günlük hak: <b class="${ready ? 'up' : 'down'}">${ready ? '1/1' : '0/1 — 00:00’da yenilenir'}</b>` : 'İlk geçişe kadar serbestçe denenir; sonra günde 1 hak.'} · ${ri('mark')} İz: <b>${marks}/${BOSS_PITY}</b> ${marks >= BOSS_PITY ? `<button class="btn sm green" data-a="exchange" data-boss="${d.gate}">Eşsizle takas et</button>` : ''}<br>Eşsizler: ${MOBS[d.gate].uniques.map(u => `<b class="gn g2">${itemBase(u).name}</b>`).join(', ')}</div>` : '' });
}
ACT.exchange = d => {
  const M = MOBS[d.boss];
  showModal(`<h2>İz Takası</h2><div class="in"><p>${BOSS_PITY} iz karşılığında birini seç:</p>${M.uniques.map(b => { const it = { b, g: 2, p: 0 }; return `<button class="ibtn" data-a="exchangeDo" data-boss="${d.boss}" data-b="${b}">${ico(it)}<span>${itemLine(it)}</span></button>`; }).join('')}<div class="mbtns"><button class="btn" data-a="closeModal">Vazgeç</button></div></div>`);
};
ACT.exchangeDo = async d => { const r = await run('boss.exchange', { boss: d.boss, b: d.b }); if (r) { closeModal(); toast(`${itemBase(d.b).name} çantana eklendi.`); redraw(); } };

const MODE_VS = {
  well: () => ({ title: 'Dipsiz Kuyu', rules: [`${RULES.well.waves} dalga`, `Dalga başına ${RULES.well.stonePerWave} bileği taşı`, 'Kaybetsen de geçtiğin dalgalar sayılır'], unknown: `Seviyene göre karışık yaratıklar (Sv. ${Math.max(1, S.lvl - 3)}-${Math.min(80, S.lvl + 6)}).` }),
  depth: () => depthVs(), // kat ödülü ve haftanın düzeni: ui-pvp.js
  rift: () => ({ title: 'Gök Yarığı', rules: [`${RULES.rift.waves} dalga`, `Zafer: ${RULES.rift.shards[0]}-${RULES.rift.shards[1]} parça`, 'Parçalar Kader Çarkı’nda kırılır'], unknown: `Sv. ${S.lvl} yaratıklar.` }),
  seal: () => ({ title: 'Mühürlü Oda', rules: ['1 Mühür Taşı harcar', 'Rastgele bir boss', `Eşsiz şansı ${RULES.seal.unique} kat`], unknown: 'Hangi boss’un çıkacağı kapı açılınca belli olur.' }),
  akin: () => ({ title: 'Akın', rules: [`${RULES.akin.waves} dalga, ${RULES.akin.turnCap} tur`, `Kesilen her yaratık ${RULES.akin.perKill} puan`, `${RULES.akin.stoneAt}+ puan: İnce taş`], unknown: 'Kalabalık ama zayıf yaratıklar.' }),
  siege: () => ({ title: 'Hisar Kuşatması', rules: [`${RULES.siege.waves} dalga muhafız`, `Dalga başına ${RULES.siege.perWave} puan`, `Zafer: +${RULES.siege.win} puan`], unknown: 'Hisar muhafızları (kahraman sınıfları).' }),
  banner: () => ({ title: 'Sancak Savaşı', rules: ['3 raunt = 3 kontrol noktası', 'Rauntlar arası taraf yenilenir', '2 nokta: zafer'], unknown: `${FACTIONS[S.faction === 'ocak' ? 'sancak' : 'ocak'].name} savaşçıları.` }),
  clanboss: () => { const H = HUNT_DIFF[huntDiffOf(S, now())]; return { title: `Oba Avı · Tepegöz${H === HUNT_DIFF[0] ? '' : ` (${H.name})`}`, waves: [[{ mob: 'tepegoz', name: 'Tepegöz', lvl: S.lvl }]], rules: ['60 tur boyunca hasar ver', `Hasarın %${H.credit}'i klana yazılır`, 'Günde 1 hak'], back: 'clan' }; },
};
ACT.mode = d => { const c = MODE_VS[d.m](); openVs({ extra: modVsNote(d.m), ...c, args: { mode: d.m } }); if (c.back) VS.backTo = c.back; };
ACT.arenaVs = d => { const o = S.arena.opp[+d.i]; openVs({ title: `Meydan · ${o.name}`, foe: `${esc(o.name)} <span class="mut">· ${o.rating} puan</span>`, waves: [soloUnits(o.units)], args: { mode: 'arena', opp: +d.i }, rules: ['Rakibi yapay zekâ oynar', `${ARENA.turnCap} turda bitmezse savunan kazanır`, `Zafer: +${RULES.arena.san[0]} şan · +${ARENA_PTS.win} puan`, ...oppRule(o)] }); };
ACT.liveFind = async () => { const r = await run('live.find'); if (!r) return; const o = S.arena.liveOpp; openVs({ title: `Canlı Meydan · ${o.name}`, foe: `${esc(o.name)} <span class="mut">· ${o.rating} puan</span>`, waves: [soloUnits(o.units)], args: { mode: 'live' }, rules: [`Hamle süresi ${RULES.live.timer} sn`, 'Süre dolarsa yapay zekâ oynar', `Zafer: +${RULES.live.san[0]} şan · +${ARENA_PTS.win} puan`] }); };

// ---------- Savaşı başlat ve sonucu göster ----------
export async function startBattle(args, auto = false) {
  const r = await run('battle.start', args);
  if (!r) return;
  const b = r.battle;
  closeWin(true); closeModal(); hud.hidden = true; hideTown(); hideChatBar();
  runBattle({
    setup: { party: b.party, waves: b.waves, seed: b.seed, enrageTurn: b.enrageTurn, turnCap: b.turnCap, restoreOnWave: !!b.opts.restoreOnWave, lead: !!b.lead, v: b.eng || 1 }, env: b.env, title: b.title, auto, timer: (b.opts.timer || 0) * (A11Y.slowTimer ? 2 : 1),
    onDone: async (won, actions) => {
      // Bağlantı koparsa sonuç kaybolmasın: birkaç kez yeniden dene (sunucu aynı savaşı yalnızca bir kez öder)
      let res = null;
      for (let i = 0; i < 4 && !res; i++) {
        try { res = await act('battle.finish', { id: b.id, actions }); }
        catch (e) { if (e.info?.done) { res = e.info.done; break; } // sonuç ilk gönderimde işlenmiş (yanıt yolda kaybolmuş): sunucu aynı sonucu geri verir
          if (e.code !== 'network') { toast(e.message); break; } toast('Bağlantı koptu, sonuç yeniden gönderiliyor…'); await new Promise(r2 => setTimeout(r2, 2000)); }
      }
      if (!res) return ACT.hub();
      showResult(b, res, args, auto);
    },
    onExit: () => confirmBox('Savaştan çekil', 'Harcanan enerji ve haklar geri gelmez.', async () => { await run('battle.abandon'); ACT.hub(); }, 'Çekil'),
  });
}
export function showResult(b, r, args, auto) {
  const m = r.mode, tier = (m === 'stage' && b.opts.tier) || 0, stage = m === 'stage' ? stageDef(b.ref, tier) : null, next = stage && stageDef(`${stage.zone}-${stage.n + 1}`, tier);
  const again = (m === 'nobet' && r.nobet && !r.nobet.won && !r.nobet.lost && !r.nobet.party?.failed) || (m === 'stage' && stage.kind !== 'boss') || (m === 'depth' && r.win && S.depth < CLIMB.floors) || (m === 'well' && (S.daily.well || 0) < 2);
  ACT.again = () => (m === 'nobet' ? ACT.nbGo() : startBattle(m === 'depth' ? { mode: 'depth' } : args, auto)); // Kristal Nöbeti: parti savaşına (ui-nobet.js)
  ACT.next = () => startBattle(tier ? { stage: next.id, tier } : { stage: next.id }, auto);
  ACT.backPvp = () => { ACT.hub(); ACT.meydan({ tab: 'fight' }); };
  ACT.backClan = () => { ACT.hub(); ACT.clan(m === 'clanboss' ? { tab: 'av' } : undefined); };
  const title = m === 'clanboss' ? 'AV BİTTİ' : m === 'baskin' ? 'BASKIN BİTTİ' : r.win ? 'ZAFER' : 'YENİLGİ';
  const extra = [
    r.cleared !== undefined && `Geçilen dalga: <b>${r.cleared}/10</b>`,
    r.floor && r.win && `<b>${r.floor}. kat</b> temizlendi`,
    r.damage !== undefined && `Klana yazılan hasar: <b>${fmt(r.damage)}</b>${r.clan ? ` · klan toplamı ${fmt(r.clan.dmg)} · sandık ${r.clan.tier}/4${r.clan.tier > r.clan.was ? ' <b class="up">Yeni sandık açıldı!</b>' : ''}` : ''}`,
    r.points !== undefined && `Alınan kontrol noktası: <b>${r.points}/3</b>`,
    r.score !== undefined && `Skor: <b>${fmt(r.score)}</b>`,
    r.rating !== undefined && `Puan: <b class="${r.rating >= 0 ? 'up' : 'down'}">${r.rating >= 0 ? '+' : ''}${r.rating}</b> → ${m === 'live' ? S.arena.live : S.arena.rating}${dimResult(r)}`,
    r.nobet && `Kristal Nöbeti: <b>${r.nobet.total}/55</b> dalga${r.nobet.party ? ` · ${r.nobet.party.name} payı ${r.nobet.party.done}/${r.nobet.party.quota}${r.nobet.party.failed ? ' <b class="down">(parti düştü)</b>' : ''}` : ''} · Güçlendirme ${r.nobet.buffs}${r.nobet.won ? ' · <b class="up">Nöbet kazanıldı! Sandığını Şaman Yashka’dan al.</b>' : r.nobet.lost ? ' · <b class="down">Nöbet düştü.</b>' : ''}`,
    r.mod && modResultLine(r),
    r.mastery && `<b class="up">Ustalık seviyesi +${r.mastery}</b>`, // 60. seviyeden sonra (mastery.js)
    hooks.resultLine?.(r), // bölge hâkimiyeti bonusu (ui-dunya.js)
    r.raid && hooks.baskinLine?.(r), // Dünya Baskını: ortak havuz ve baraj (ui-baskin.js)
    r.bossDamage && !r.win && `Boss'a verilen hasar: ${pct(r.bossDamage)}`,
    r.pots && (r.pots.hp || r.pots.mp) && `İçilen iksir: ${[r.pots.hp && `${r.pots.hp} Can`, r.pots.mp && `${r.pots.mp} Mana`].filter(Boolean).join(', ')} <span class="mut">(kalan ${S.pots?.hp ?? 0} Can, ${S.pots?.mp ?? 0} Mana)</span>`,
  ].filter(Boolean);
  showModal(`<h2>${title}</h2><div class="in">${reportAside(r)}
    <p><b>${esc(r.title || b.title)}</b></p>${r.stars ? `<p class="bres-stars">${stars(r.stars)}</p>` : ''}
    ${extra.map(x => `<p>${x}</p>`).join('')}
    <p>${r.xp ? `${ri('xp')} ${xpGain(r.xp, S.lvl - (r.levels || 0))} · ` : ''}${ri('akce')} +${fmt(r.akce)} akçe${r.first ? ' (ilk geçiş ödülü dahil)' : ''}${r.premium ? ` <span class="chip up">${PREMIUM[r.premium].name} Premium +%${Math.round(PREMIUM[r.premium].xp * 100)}</span>` : ''}</p>
    ${r.win && r.akce > 0 && m !== 'clanboss' ? `${adBtn('savas', `Akçeyi ×2 yap (+${fmt(r.akce)})`, { battle: b.id }, 'red') ? `<p class="ad-x2">${adBtn('savas', `Akçeyi ×2 yap (+${fmt(r.akce)})`, { battle: b.id }, 'red')}</p>` : ''}` : ''}
    ${r.levels ? levelUpNote(S.lvl - r.levels, S.lvl, `+${r.levels * ENERGY.levelUpBonus} enerji, +${r.levels * 3} nitelik puanı`) : ''}
    ${lootBox(r.loot) || (r.win && m === 'stage' ? '<p class="mut">Bu sefer eşya düşmedi.</p>' : '')}
    ${!r.win && m === 'stage' ? '<p class="mut">Karakterini güçlendirip tekrar dene: Örs’te bas, nitelik ve yetenek puanlarını dağıt, İksir ve Parşömen dükkânından iksir al.</p>' : ''}
    ${r.win && m === 'stage' && r.stars < 3 ? `<p class="mut">${r.stars < 2 ? 'Canın %25\'in üstündeyken bitirirsen 2 yıldız.' : 'Canın %50\'nin üstündeyken bitirirsen 3 yıldız ve seri savaş açılır.'}</p>` : ''}
    <div class="mbtns">${again ? `<button class="btn" data-a="again">${m === 'depth' ? 'Sonraki kat' : m === 'nobet' ? 'Sonraki dalga' : 'Tekrar'}</button>` : ''}${r.win && next && stageOpen(S, next.id, tier) ? '<button class="btn red" data-a="next">Sonraki</button>' : ''}
      ${m === 'arena' || m === 'live' || m === 'banner' ? '<button class="btn" data-a="backPvp">Meydan</button>' : ''}${m === 'clanboss' || m === 'siege' ? '<button class="btn" data-a="backClan">Klan</button>' : ''}
      ${reportBtn(r)}<button class="btn blue" data-a="hub">${hooks.ormanOn?.() ? 'Kemikli Koru’ya dön' : capitalOf(S.faction)}</button></div></div>`, (r.win ? 'bres win' : 'lose bres') + reportClass(r)); // bres: savaş sonucu görünümü (css/v15-savas.css)
  // Sonuç penceresi arenada açılır: kapatılırsa (✕, dışarı dokunma, geri tuşu) oyuncu düğmesiz bir sahnede kalırdı. Kapatma
  // düğmesi ana üsse döner; dışarı dokunma ve geri tuşu pencereyi kapatmaz (core: closeModal düğmesi olmayan modal kapanmaz).
  const x = document.querySelector('#modal .mx[data-a="closeModal"]');
  if (x) x.dataset.a = 'hub';
  AFTER.on = true;
}
// Güvenlik ağı: savaş sonrası sahnede (sonuç ya da tur tur kayıt penceresi) modal başka bir yoldan kapanırsa ve ekranda ne
// HUD ne pencere ne savaş arayüzü varsa ana üsse dönülür. Gözlemci mikro görevde çalışır: Tekrar/Sonraki yeni savaşı aynı
// adımda açtığı için tetiklenmez.
const AFTER = { on: false };
new MutationObserver(() => {
  if (!AFTER.on) return;
  const $id = id => document.getElementById(id);
  if (!$id('battleUI').hidden || !$id('hud').hidden) { AFTER.on = false; return; }
  if ($id('modal').hidden && $id('win').hidden) { AFTER.on = false; ACT.hub(); }
}).observe(document.getElementById('modal'), { attributes: true, attributeFilter: ['hidden'] });
