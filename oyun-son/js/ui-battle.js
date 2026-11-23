// Kapı (bölgeler, zindanlar, etkinlikler, meydan), savaş öncesi "VS" ekranı, savaşı başlatma ve sonuç.
import { A as A11Y } from './a11y.js';
import { capitalOf } from '../shared/content.js';
import { S, act } from './api.js';
import { ACT, hud, esc, fmt, xpGain, pct, stars, toast, run, showModal, closeModal, confirmBox, openWin, redraw, closeWin, reload, cur, mobImg, heroImg, unitImg, DEF_W, lootBox, locked, lockNote, loading, ico, itemLine, myPerks, med, hooks } from './ui-core.js';
import { runBattle, otoPref, savasOnYukle } from './combat.js';
import { hisarOpen } from '../shared/hisar.js';
import { HISAR } from '../shared/content.js';
import { hideTown } from './town.js';
import { hideChatBar, showChatBar } from './ui-social.js';
import { ZONES, MOBS, zoneStages, stageDef, mobUnit } from '../shared/zones.js';
import { CLASSES, CLASS_KEYS, ENERGY, UNLOCK, ARENA, BOSS_PITY, FACTIONS, GAME, PREMIUM, leagueOf, weekDay, hourOf } from '../shared/content.js';
import { stageOpen, bossAvailable } from '../shared/calc.js';
import { partyUnits, heroUnit, partyPower, power, soloUnits } from '../shared/hero.js';
import { soloWaves } from '../shared/solo.js'; // tek kahramana göre budanmış ve ölçeklenmiş dalgalar (savaşta sunucu aynısını kurar)
import { itemBase } from '../shared/items.js';
import { HUNT_DIFF, huntDiffOf } from '../shared/clan.js';
import { now, DEV } from './api.js';
import { svg, ri } from './icons.js';
import { sprUrl } from './karakter-png.js'; // 2B tam boy (VS sol paneli)
import { vsCoefs, vsCoefTable, ilvTag } from './esya-parts.js';
import { PV, tierBar, tierNote, bagNote, modBanner, modVsNote, modResultLine, depthRow, depthVs, seasonHead, oppTags, oppRule, dimResult, levelUpNote } from './ui-pvp.js'; // sezon, zorluk kademeleri, zindan düzeni
import { STAGE_TIERS, starsOf, CLIMB, ARENA_PTS } from '../shared/pvp.js';
import { reportAside, reportClass, reportBtn, reportStrip } from './ui-rapor.js';
import { KULE, kuleRewards, isBossFloor, adsizName } from '../shared/kule.js'; // Kül Kulesi (20 Kas)
import { YEMIN, yeminLevel } from '../shared/yemin.js'; // Taş Yemini (20 Kas)
import { FRAMES } from '../shared/rankper.js';
import { RULES } from '../shared/rules.js'; // ekranda yazan ödül, bedel ve puanlar sunucuyla aynı tablodan okunur
import { warBonusLine } from '../shared/content.js';

const GV = { zone: 1, tab: 'zones' };
const used = k => S.daily[k] || 0;
const zoneOpen = z => stageOpen(S, `${z}-1`, PV.tier); // PV.tier: seçili zorluk kademesi (ui-pvp.js)

// ---------- Kapı ----------
ACT.gate = d => { savasOnYukle();
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
ACT.stage = d => { if (!d || !d.id) return; const t = +d.t || 0; if (!stageOpen(S, d.id, t)) return toast('Kilitli: önce bir önceki stage geçilmeli.'); openStageVs(d.id, t); };

const card = (pic, name, desc, chips, btn, tone = 'violet') => `<div class="row">${med(pic, tone)}<div class="grow"><b>${name}</b><br><span class="mut">${desc}</span><div class="chips">${chips.map(c => `<span class="chip">${c}</span>`).join('')}</div></div>${btn}</div>`;
const enter = (m, ok, label = 'Gir') => `<button class="btn red" data-a="mode" data-m="${m}" ${ok ? '' : 'disabled'}>${label}</button>`;
const lockChip = key => locked(key) ? [`Kilitli · Sv. ${UNLOCK[key]}`] : [];
function gateDungeons() {
  const weekend = weekDay(now()) >= 5 || DEV;
  return `${modBanner()}<div class="hint">Zindanlar enerji yerine günlük hak ya da anahtar ister. Düşmanlar seviyene göre kurulur.</div>
    ${card('well', 'Dipsiz Kuyu', `${RULES.well.waves} dalga dayan. Geçtiğin her dalga bir bileği taşı verir.`, [...lockChip('well'), `Bugün ${used('well')}/${RULES.well.daily}`, `En iyi ${S.wellBest}/${RULES.well.waves} dalga`], enter('well', !locked('well') && used('well') < RULES.well.daily))}
    ${depthRow(lockChip('depth'), enter('depth', !locked('depth') && S.depth < CLIMB.floors))}
    ${card('depth', 'Kül Kulesi', `Bölgelerin bittiği yerde başlar. Sonsuz kat; her ${KULE.bossEvery} katta Küllerin Tarikatı’nın bir adsızı bekler. Katlar sıfırlanmaz.`, [...(S.lvl < KULE.unlock ? [`Kilitli · Sv. ${KULE.unlock}`] : []), `Sıradaki kat ${(S.kule || 0) + 1}`, `${KULE.energy} enerji`, ...(isBossFloor((S.kule || 0) + 1) ? [adsizName((S.kule || 0) + 1)] : [])], enter('kule', S.lvl >= KULE.unlock), 'red')}
    ${card('rift', 'Gök Yarığı', 'Yalnızca cumartesi ve pazar açılır. Kader Çarkı için parça verir.', [...lockChip('rift'), weekend ? 'Açık' : 'Hafta sonu açılır', `Bugün ${used('rift')}/${RULES.rift.daily}`], enter('rift', !locked('rift') && weekend && used('rift') < RULES.rift.daily))}
    ${card('sealroom', 'Mühürlü Oda', `Bir Mühür Taşı harcar; rastgele bir boss çıkar. Eşsiz şansı ${RULES.seal.unique} kat, günlük sınır yok.`, [...lockChip('seal'), `${ri('seal')} Mühür Taşı ${S.seals}`], enter('seal', !locked('seal') && S.seals > 0))}`;
}
function gateEvents() {
  const D = cur().data;
  if (!D) return loading;
  const w = D.war, a = D.akin, sg = D.siege;
  const bar = w ? (() => { const t = Math.max(1, w.now.ocak + w.now.sancak), o = 100 * w.now.ocak / t; return `<div class="warbar"><i style="width:${o}%;background:${FACTIONS.ocak.color}"></i><i style="width:${100 - o}%;background:${FACTIONS.sancak.color}"></i></div><div class="sub"><b style="color:${FACTIONS.ocak.color}">${FACTIONS.ocak.name} ${fmt(w.now.ocak)}</b><span class="sp"></span><b style="color:${FACTIONS.sancak.color}">${fmt(w.now.sancak)} ${FACTIONS.sancak.name}</b></div>`; })() : '';
  return `${hooks.baskinCard?.(D.baskin) || ''}${hooks.yeminCard?.() || ''}<h3 style="margin-top:10px">Büyük Sefer <span class="mut">· haftalık taraf savaşı</span></h3>${bar}
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
function openVs(cfg) { savasOnYukle(); VS = { auto: otoPref() && !['arena', 'live', 'banner', 'anit'].includes(cfg.args?.mode), ...cfg }; openWin({ title: cfg.title, back: 'vsBack', scr: 'vs', render: renderVs }); } // 20 Kas: son OTO tercihi hatırlanır (PvP'de kapalı başlar)
// Öğretici: Dev Solucan'a karşı (ui-ogretici.js çocuğun diyaloğundan açar)
ACT.wormGo = () => openVs({ title: 'Dev Solucan', foe: 'Dev Solucan <span class="mut">· Nessa’yı yuttu</span>', waves: soloWaves([[mobUnit('devsolucan', Math.max(2, S.lvl))]], 'worm'), args: { mode: 'worm' }, rules: ['Ateş onu yakar (zayıflığı)', 'Yarı canında topraktan yeniden fırlar', 'Zafer: Nessa kurtulur, 600 akçe ve bileği taşları'] });
ACT.vsBack = () => (['arena', 'live', 'banner'].includes(VS?.args?.mode) ? ACT.meydan({ tab: 'fight' }) : ACT.gate({ tab: GV.tab === 'pvp' ? 'zones' : GV.tab, zone: GV.zone }));
// 20 Kas: VS ekranında yaratığın zayıf (▲, +%RULES.weak hasar alır) ve dirençli (▼) elementleri; yalnız yaratıklarda (PvE)
const EL_TXT = { fire: 'Ateş', ice: 'Buz', bolt: 'Yıldırım' };
const elChips = u => { if (u.cls) return ''; const w = u.weak && EL_TXT[u.weak] ? `<i class="elc w el-${u.weak}" title="Zayıflığı: ${EL_TXT[u.weak]} (+%${RULES.weak} hasar alır)">▲ ${EL_TXT[u.weak]}</i>` : '', r = Object.keys(EL_TXT).filter(k => (u.res?.[k] || 0) > 0 && k !== u.weak).map(k => `<i class="elc r el-${k}" title="${EL_TXT[k]} direnci %${Math.round(u.res[k] * 100)}">▼ ${EL_TXT[k]}</i>`).join(''); return w || r ? `<span class="elcs">${w}${r}</span>` : ''; };
// Sağ taraf: yaratıklar türe göre gruplanır; kahraman birimleri tek tek gösterilir (aynı sınıftan iki kahraman olabilir)
// 23 Kas (M4 maketi, olcu-vs.md): sol tam boy kahraman, orta VS arması + koşul kartı, sağ ana düşman çizimi, altta dalga kartları ve eylem şeridi
const vsMain = units => units.reduce((m, u) => !m ? u : (u.boss && !m.boss) || (u.captain && !m.boss && !m.captain) || ((!!u.boss === !!m.boss && !!u.captain === !!m.captain) && power(u) > power(m)) ? u : m, null);
const vsArt = (u, mine) => { if (!u) return ''; if (mine && S.char) { const s = sprUrl(S.char.race || S.faction, S.char.cls, S.char.gender); if (s) return `<img class="vs2-img hero2b" src="${s}" alt="" draggable="false">`; }
  return u.cls ? heroImg(u.cls, true, 'vs2-img', u.faction || S.faction, u.wm || DEF_W[u.cls], u.cape || null, u.v || 0) : mobImg(u.mob, true, 'vs2-img'); };
const rankTxt = u => u.boss ? 'Boss' : u.captain ? 'Dalga Lideri' : u.elite ? 'Seçkin' : u.cls ? (CLASSES[u.cls]?.name || '') : 'Yaratık';
const waveCard = (w, i) => { const g = {}; w.forEach((u, j) => { const k = u.cls ? 'h' + j : u.mob + (u.elite ? ':e' : ''); (g[k] || (g[k] = { u, n: 0 })).n++; }); const m = vsMain(w), lead = m.boss || m.captain;
  const txt = Object.values(g).map(x => x.u === m && lead ? 'Lider' : `×${x.n} ${esc(x.u.name)}`).join(' + ');
  return `<div class="vs2-wv${lead ? ' lead' : ''}">${unitImg(m, 'vs2-wp')}<span><b>${i + 1}. Dalga</b><small>${txt}</small></span></div>`; };
function renderVs() {
  const c = VS, left = vsLeft(), me = left[0];
  const pw = left.reduce((a, u) => a + power(u), 0);
  const all = c.waves ? c.waves.flat() : [], foe = all.length ? vsMain(all) : null, fpw = c.waves ? Math.max(...c.waves.map(w => w.reduce((a, u) => a + power(u), 0))) : 0;
  const can = c.can !== false, mine = !c.left;
  const meName = mine ? esc(S.name) : esc(me?.name || 'Senin tarafın'), meSub = me ? [me.lvl ? `Sv. ${me.lvl}` : '', FACTIONS[me.faction || S.faction]?.name, me.cls ? CLASSES[me.cls]?.name : ''].filter(Boolean).join(' · ') : '';
  const others = left.length > 1 ? `<div class="vs2-ek">${left.slice(1).map(u => unitImg(u)).join('')}</div>` : '';
  const foeName = foe ? esc(foe.name) : (c.foe || 'Düşman'), foeSub = foe ? [foe.lvl ? `Sv. ${foe.lvl}` : '', rankTxt(foe)].filter(Boolean).join(' · ') : '';
  return `<div class="vs vs2"><div class="vside a">${vsArt(me, mine)}${others}<div class="vs2-pl"><span><b>${meName}</b><small>${meSub}</small></span><em>Güç ${fmt(pw)}</em></div>${mine ? '<button class="vs2-kr" data-a="vsForm">Karakter</button>' : ''}</div>
    <div class="vmid"><b class="vsx">VS</b>${c.rules ? `<div class="vrules">${c.rules.map(r => `<div>${r}</div>`).join('')}</div>` : ''}${c.desc ? `<p class="vs2-not">${c.desc}</p>` : ''}${vsCoefs(left, c.waves)}</div>
    <div class="vside b">${foe ? vsArt(foe) : `<div class="hint vs2-bilinmez">${c.unknown || 'Düşmanlar savaş başlayınca belli olur.'}</div>`}<div class="vs2-pl"><span><b>${foeName}</b><small>${foeSub}${foe ? elChips(foe) : ''}</small></span>${fpw ? `<em>Güç ${fmt(fpw)}</em>` : ''}</div></div></div>
    ${c.extra ? `<div class="vs2-extra">${c.extra}</div>` : ''}
    <div class="vbtns vs2-alt">${c.waves ? `<span class="vs2-dl">${c.waves.length > 1 ? 'Dalgalar' : 'Düşman'}</span><div class="vs2-wvs">${c.waves.map(waveCard).join('')}</div>` : '<span class="sp"></span>'}
      ${c.sweep ? `<button class="btn vs2-b2" data-a="sweep" data-n="5">Seri ×5</button><button class="btn vs2-b2" data-a="sweep" data-n="10">×10</button>` : ''}
      <button class="btn vs2-b2 ${VS.auto ? 'on' : ''}" data-a="vsAuto" aria-pressed="${VS.auto}">Oto${VS.auto ? ' ✓' : ''}</button>
      <button class="btn red big vs2-b1" data-a="vsStart" ${can ? '' : 'disabled'}>${c.startLabel || 'Başla'}${c.energy ? ` ${ri('energy', '#fff')} ${c.energy}` : ''}</button></div>`;
}
ACT.vsAuto = () => { VS.auto = !VS.auto; try { localStorage.setItem('dd_oto', VS.auto ? '1' : '0'); } catch { } redraw(); };
ACT.vsCoef = () => showModal(`<h2>Saldırı Türleri</h2><div class="in" style="text-align:left">${vsCoefTable(vsLeft(), VS.waves)}</div>`, 'cxbox');
ACT.vsStart = () => startBattle(VS.args, VS.auto);
// Karakter ekranı (eşya, yetenek, nitelik); geri düğmesi bu ekrana döner
ACT.vsForm = () => ACT.party({ back: 'vsReturn' });
ACT.vsReturn = () => { if (VS) openWin({ title: VS.title, back: 'vsBack', scr: 'vs', render: renderVs }); else ACT.hub(); };
ACT.sweep = async d => {
  const lv = S.lvl, r = await run('battle.sweep', { stage: VS.args.stage, tier: VS.args.tier || 0, n: +d.n }); if (!r) return;
  showModal(`<h2>Seri Savaş</h2><div class="in"><p><b>${r.runs} savaş · ${r.wins} zafer</b></p><p>${ri('xp')} ${xpGain(r.xp, lv)} · ${ri('akce')} +${fmt(r.akce)} akçe</p>${r.levels ? levelUpNote(lv, S.lvl) : ''}${r.bagFull ? '<p class="warn">Çanta doldu: kalan savaşlar yapılmadı.</p>' : ''}${lootBox(r.loot) || '<p class="mut">Eşya düşmedi.</p>'}<div class="mbtns"><button class="btn" data-a="closeModal">Tamam</button></div></div>`);
  redraw();
};

function openStageVs(id, tier = 0) {
  const d = stageDef(id, tier), SS = starsOf(S, tier), boss = d.kind === 'boss', ready = bossAvailable(S, id, tier), marks = boss ? S.marks[d.gate] || 0 : 0;
  const sweep = !boss && SS[id] === 3 && !locked('sweep');
  openVs({ title: `${d.n}. ${d.name}${tier ? ` (${STAGE_TIERS[tier].name})` : ''}`, foe: `Düşman <span class="mut">· Sv. ${d.lvl}</span>`, waves: soloWaves(d.waves, 'stage'), args: tier ? { stage: id, tier } : { stage: id }, energy: d.energy, sweep, can: !boss || ready,
    rules: [`${stars(1)} Stage'i geç`, `${stars(2)} Can > %25`, `${stars(3)} Can > %50`],
    desc: d.lvl > S.lvl + 1 ? `<span class="warn">Seviyen (${S.lvl}) bu stage için düşük.</span>` : !boss && SS[id] === 3 && locked('sweep') ? `Seri savaş ${UNLOCK.sweep}. seviyede açılır.` : !boss && SS[id] !== 3 ? '3 yıldızla geçersen seri savaş açılır.' : '',
    extra: boss ? `<div class="hint">${SS[id] ? `Günlük hak: <b class="${ready ? 'up' : 'down'}">${ready ? '1/1' : '0/1 — 00:00’da yenilenir'}</b>` : 'İlk geçişe kadar serbestçe denenir; sonra günde 1 hak.'} · ${ri('mark')} İz: <b>${marks}/${BOSS_PITY}</b> ${marks >= BOSS_PITY ? `<button class="btn sm green" data-a="exchange" data-boss="${d.gate}">Eşsizle takas et</button>` : ''}<br>Eşsizler: ${MOBS[d.gate].uniques.map(u => `<b class="gn g2">${itemBase(u).name}</b>`).join(', ')}</div>` : '' });
}
ACT.exchange = d => {
  if (!d || !MOBS[d.boss]) return;
  const M = MOBS[d.boss];
  showModal(`<h2>İz Takası</h2><div class="in"><p>${BOSS_PITY} iz karşılığında birini seç:</p>${M.uniques.map(b => { const it = { b, g: 2, p: 0 }; return `<button class="ibtn" data-a="exchangeDo" data-boss="${d.boss}" data-b="${b}">${ico(it)}<span>${itemLine(it)}</span></button>`; }).join('')}<div class="mbtns"><button class="btn" data-a="closeModal">Vazgeç</button></div></div>`);
};
ACT.exchangeDo = async d => { const r = await run('boss.exchange', { boss: d.boss, b: d.b }); if (r) { closeModal(); toast(`${itemBase(d.b).name} çantana eklendi.`); redraw(); } };

const MODE_VS = {
  well: () => ({ title: 'Dipsiz Kuyu', rules: [`${RULES.well.waves} dalga`, `Dalga başına ${RULES.well.stonePerWave} bileği taşı`, 'Kaybetsen de geçtiğin dalgalar sayılır'], unknown: `Seviyene göre karışık yaratıklar (Sv. ${Math.max(1, S.lvl - 3)}-${Math.min(80, S.lvl + 6)}).` }),
  depth: () => depthVs(), // kat ödülü ve haftanın düzeni: ui-pvp.js
  yemin: () => ({ title: 'Taş Yemini', foe: 'Küllerin Tarikatı', rules: ['İki halktan dört kahraman aynı grupta (yoldaşları yapay zekâ oynar)', `${YEMIN.waves} dalga, son dalgada Yemin Bozan`, 'Haftada bir zafer; kaybedersen aynı hafta yeniden denersin'], unknown: `Tarikat yaratıkları · Sv. ${yeminLevel(S)}`, left: null, back: null }),
  kule: () => { const f = (S.kule || 0) + 1, B = isBossFloor(f); return { title: `Kül Kulesi · ${f}. kat`, rules: [B ? `${adsizName(f)} bekliyor` : '2 dalga Tarikat yaratığı', `Kat kat sertleşir (can +%${Math.round(KULE.hpStep * 100)}/kat)`, 'Kat ödülü yalnız ilk geçişte'], unknown: `Küllerin Tarikatı · Sv. ${KULE.unlock}`, extra: `<div class="hint"><b>${f}. kat ödülü:</b> ${kuleRewards(f).map(d => d.t === 'akce' ? `${fmt(d.n)} akçe` : d.t === 'stone' ? `${d.n} taş` : d.t === 'yakut' ? `${d.n} yakut` : 'Nadir eşya').join(' · ')}</div>` }; },
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
// 2x/3x hız yalnız PvE ve tek oyunculu savaşta (kullanıcı 19 Kas): oyuncuya karşı modlarda kapalı (ortak savaş combat.js'te coop ile kapanır)
const FAST_OFF = new Set(['arena', 'live', 'banner', 'siege', 'feud', 'duel', 'pk', 'anit']);
export async function startBattle(args, auto = false) { savasOnYukle();
  const r = await run('battle.start', args);
  if (!r) return;
  const b = r.battle;
  closeWin(true); closeModal(); hud.hidden = true; hideTown(); hideChatBar(); // 22 Kas (kullanıcı): savaşta sohbet yok
  runBattle({
    setup: { party: b.party, waves: b.waves, seed: b.seed, enrageTurn: b.enrageTurn, turnCap: b.turnCap, restoreOnWave: !!b.opts.restoreOnWave, lead: !!b.lead, v: b.eng || 1, bdw: b.opts.bdw || null }, env: b.env, title: b.title, auto, timer: (b.opts.timer || 0) * (A11Y.slowTimer ? 2 : 1), fast: !FAST_OFF.has(args.mode),
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
  const again = (m === 'nobet' && r.nobet && !r.nobet.won && !r.nobet.lost && !r.nobet.party?.failed) || (m === 'stage' && stage.kind !== 'boss') || (m === 'depth' && r.win && S.depth < CLIMB.floors) || (m === 'kule' && r.win) || (m === 'well' && (S.daily.well || 0) < 2);
  ACT.again = () => (m === 'nobet' ? ACT.nbGo() : startBattle(m === 'depth' || m === 'kule' ? { mode: m } : args, auto)); // Kristal Nöbeti: parti savaşına (ui-nobet.js)
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
    r.anit && `Puan: <b>${r.anit.pts.A}–${r.anit.pts.B}</b> · Anıt ${r.anit.monDown ? '<b>kesildi</b>' : 'ayakta kaldı'} · anıta senin tarafının hasarı <b>%${String(r.anit.share).replace('.', ',')}</b> · ${r.anit.round} raunt`,
    r.mod && modResultLine(r),
    r.mastery && `<b class="up">Ustalık seviyesi +${r.mastery}</b>`, // 60. seviyeden sonra (mastery.js)
    hooks.resultLine?.(r), // bölge hâkimiyeti bonusu (ui-dunya.js)
    r.destan ? `Destan bölümü tamamlandı · <b class="up">kilitli anı açıldı</b> <button class="btn sm red" data-a="destanOutro" data-id="${r.destan}">Bölüm sonu</button>` : r.chapter && r.win ? `<button class="btn sm" data-a="destanOutro" data-id="${r.chapter}">Bölüm sonu</button>` : '',
    r.frame ? `Yeni kaplama: <b class="up">${FRAMES[r.frame] || r.frame} çerçevesi</b> <button class="btn sm green" data-a="frameSet" data-id="${r.frame}">Kullan</button>` : '', // Taş Yemini ilk zaferi (20 Kas)
    r.raid && hooks.baskinLine?.(r), // Dünya Baskını: ortak havuz ve baraj (ui-baskin.js)
    r.bossDamage && !r.win && `Boss'a verilen hasar: ${pct(r.bossDamage)}`,
    r.pots && (r.pots.hp || r.pots.mp) && `İçilen iksir: ${[r.pots.hp && `${r.pots.hp} Can`, r.pots.mp && `${r.pots.mp} Mana`].filter(Boolean).join(', ')} <span class="mut">(kalan ${S.pots?.hp ?? 0} Can, ${S.pots?.mp ?? 0} Mana)</span>`,
  ].filter(Boolean);
  // 20 Kas (Aşama 4): sonuç ekranı — büyük başlık, amblem, ödül kartları (akçe · TP · eşya), tek satır savaş dökümü; düğmeler ve işlevleri aynı.
  // Ana üs düğmesi oyuncunun en son bulunduğu yere döner (başkent / Yemin Pazarı / klan toprağı; açılış ormanında Kemikli Koru).
  const home = hooks.ormanOn?.() ? 'Kemikli Koru’ya dön' : (hooks.placeName?.() || capitalOf(S.faction));
  const won = r.win || m === 'clanboss' || m === 'baskin';
  const EMB = won ? '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M17 33l10 10 21-24" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>' : '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M20 20l24 24M44 20L20 44" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round"/></svg>';
  const loot = lootBox(r.loot);
  showModal(`<i class="rz2-arma ${won ? '' : 'kirik'}" aria-hidden="true"></i><h2>${title}</h2><div class="in">${reportAside(r)}
    <div class="rz-head"><i class="rz-emb">${EMB}</i><div><p class="rz-sub">${won ? 'Savaş tamamlandı' : 'Bu savaş burada sona erdi'}</p><p class="rz-name"><b>${esc(r.title || b.title)}</b></p>${r.stars ? `<p class="bres-stars">${stars(r.stars)}</p>` : ''}</div></div>
    <p class="rz2-alt">${esc(r.title || b.title)}${r.stars ? ` · ${r.stars} Yıldızla Tamamlandı` : won ? ' · Savaş tamamlandı' : ' · Bu savaş burada sona erdi'}</p>${m === 'stage' ? `<div class="rz2-yil" aria-label="${r.stars || 0}/3 yıldız">${[1, 2, 3].map(k => `<i class="${(r.stars || 0) >= k ? 'on' : ''}"></i>`).join('')}</div>` : ''}
    <div class="rz-cards"><div class="rz-card ak"><small>Akçe</small><b>${ri('akce')} +${fmt(r.akce || 0)}</b>${r.first ? '<em>ilk geçiş ödülü dahil</em>' : ''}</div><div class="rz-card xp"><small>Deneyim</small><b>${ri('xp')} ${r.xp ? xpGain(r.xp, S.lvl - (r.levels || 0)) : '—'}</b>${r.premium ? `<em>${PREMIUM[r.premium].name} Premium +%${Math.round(PREMIUM[r.premium].xp * 100)}</em>` : ''}</div><div class="rz-card es"><small>Eşya</small>${loot || `<b class="rz-none">${r.win && m === 'stage' ? 'Bu sefer düşmedi' : '—'}</b>`}</div></div>
    ${extra.map(x => `<p>${x}</p>`).join('')}
    ${r.levels ? levelUpNote(S.lvl - r.levels, S.lvl, `+${r.levels * ENERGY.levelUpBonus} enerji, +${r.levels * 3} nitelik puanı`) : ''}
    ${!r.win && m === 'stage' ? '<p class="mut">Karakterini güçlendirip tekrar dene: Örs’te bas, nitelik ve yetenek puanlarını dağıt, İksir ve Parşömen dükkânından iksir al.</p>' : ''}
    ${r.win && m === 'stage' && r.stars < 3 ? `<p class="mut">${r.stars < 2 ? 'Canın %25\'in üstündeyken bitirirsen 2 yıldız.' : 'Canın %50\'nin üstündeyken bitirirsen 3 yıldız ve seri savaş açılır.'}</p>` : ''}
    ${reportStrip(r)}
    <div class="mbtns">${again ? `<button class="btn" data-a="again">${m === 'depth' || m === 'kule' ? 'Sonraki kat' : m === 'nobet' ? 'Sonraki dalga' : 'Tekrar'}</button>` : ''}${r.win && next && stageOpen(S, next.id, tier) ? '<button class="btn green" data-a="next">Devam</button>' : ''}
      ${m === 'arena' || m === 'live' || m === 'banner' ? '<button class="btn" data-a="backPvp">Meydan</button>' : ''}${m === 'clanboss' || m === 'siege' ? '<button class="btn" data-a="backClan">Klan</button>' : ''}
      ${reportBtn(r)}<button class="btn ${won ? 'blue' : 'red'}" data-a="hub">${home}</button></div></div>`, (r.win ? 'bres win' : 'lose bres') + ' rz2' + reportClass(r)); // bres: savaş sonucu görünümü (css/v15-savas.css, v23-ekranlar.css)
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
