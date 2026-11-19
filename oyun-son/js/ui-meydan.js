// Meydan (CZ - PK binası): Raid tarzı arena merkezi. Sol menü: Savaş · Savunma · Meydan Marketi · Şan Dükkânı.
// Kural yok: rakip listesi, savaş, satın alma ve bonuslar sunucuya sorulur (arena.list, battle.start, arena.shop, hall.up).
// Kapı'daki eski Meydan sekmesi kaldırıldı; Meydan'a giden bütün yollar (bildirim, takvim, sonuç ekranı) buraya yönlenir.
import { S, now, DEV } from './api.js';
import { ACT, esc, fmt, run, openWin, redraw, cur, loading, locked, lockNote, unitImg, heroPic, heroArt, med, resTile, lootKind, lootToast, toast, doAct, myPerks, tName } from './ui-core.js';
import { ARENA, ARENA_SHOP, HALL, LEAGUES, FACTIONS, UNLOCK, hourOf } from '../shared/content.js';
import { leagueIndex, ARENA_PTS, RACE_DAY } from '../shared/pvp.js';
import { partyUnits, partyPower, power, soloUnits } from '../shared/hero.js';
import { partyIds } from '../shared/roster.js';
import { RULES } from '../shared/rules.js';
import { svg, ri } from './icons.js';
import { seasonHead, oppTags } from './ui-pvp.js';

const MZ = { tab: 'fight' };
const used = k => S.daily[k] || 0;
const ticketsLeft = () => ARENA.tickets + (S.daily.arenaBonus || 0) + myPerks().tickets - used('arena');
const ticketsMax = () => ARENA.tickets + (S.daily.arenaBonus || 0) + myPerks().tickets;
const mmss = ms => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const LG_COL = ['#b07a4a', '#c9d2dc', '#f2c24a', '#e0563c'];

ACT.meydan = d => {
  if (locked('arena')) return toast(`Meydan: ${lockNote('arena')}`);
  MZ.tab = d?.tab || MZ.tab;
  openWin({ title: 'Meydan', tab: MZ.tab, onTab: t => { MZ.tab = t; },
    tabs: [{ id: 'fight', label: 'Savaş', small: 'Rakip seç', icon: 'arena' }, { id: 'feud', label: 'Kan Davası', small: 'Seni yenenler', icon: 'sword' }, { id: 'def', label: 'Savunma', small: 'Karakterin savunur', icon: 'shield' },
      { id: 'shop', label: 'Meydan Marketi', small: 'Şan ile', icon: 'market' }, { id: 'san', label: 'Şan Dükkânı', small: 'Kalıcı bonus', icon: 'san', off: locked('hall') }],
    load: t => (t === 'fight' ? run('arena.list') : t === 'feud' ? run('feud.list') : null),
    render: t => `<div class="mz mz-${t}">${t === 'feud' ? feudPage() : t === 'def' ? defPage() : t === 'shop' ? shopPage() : t === 'san' ? sanPage() : fightPage()}</div>` });
};

// ---------- Savaş ----------
function leagueCrest(l) {
  return `<div class="mz-crest l${l}" style="--lc:${LG_COL[l]}"><svg viewBox="0 0 64 72" aria-hidden="true"><path d="M32 2 60 12v24c0 18-12 28-28 34C16 64 4 54 4 36V12z" fill="var(--lc)" stroke="#1a0f06" stroke-width="3"/><path d="M32 10 52 17v19c0 13-8 21-20 26-12-5-20-13-20-26V17z" fill="#0004"/><g fill="#fff8">${svg('crown').replace(/<\/?svg[^>]*>/g, '')}</g></svg><b>${LEAGUES[l].name}</b></div>`;
}
function fightPage() {
  const D = cur().data; if (!D) return loading;
  const A = S.arena, l = leagueIndex(A.rating), next = LEAGUES[l + 1], base = LEAGUES[l].min;
  const prog = next ? Math.max(0, Math.min(1, (A.rating - base) / (next.min - base))) : 1;
  const left = ticketsLeft(), max = ticketsMax(), free = !A.opp.length || now() - A.oppAt >= ARENA.refreshMs;
  const h = hourOf(now()), liveOpen = h === 13 || h === 21 || DEV;
  const tok = Array.from({ length: Math.min(max, 12) }, (_, i) => `<i class="${i < left ? 'on' : ''}"></i>`).join('');
  const opp = A.opp.map((o, i) => {
    const pw = o.power;
    return `<div class="mz-opp" style="--fc:${FACTIONS[o.faction].color}">
      <div class="mz-who">${unitImg(o.units[0], 'sm')}<span><b>${tName(o.name, o.ti, o.rk)}</b><small>Sv. ${o.lvl} · ${o.rating} puan</small>${oppTags(o)}</span></div>
      <div class="mz-team">${soloUnits(o.units).map(u => `<span class="mz-u">${unitImg(u, '')}<small>Sv.${u.lvl || o.lvl}</small></span>`).join('')}</div>
      <div class="mz-pow"><small>Güç</small><b>${fmt(pw)}</b><em>+${RULES.arena.san[0]} ${ri('san')} · +${ARENA_PTS.win} puan</em></div>
      <button class="btn red mz-go" data-a="arenaVs" data-i="${i}" ${left > 0 ? '' : 'disabled'}>Savaş</button></div>`;
  }).join('') || '<p class="mut" style="text-align:center">Rakip kalmadı. Listeyi yenile.</p>';
  return `<div class="mz-head">${leagueCrest(l)}
      <div class="mz-rate"><b>${A.rating}</b><small>Meydan puanı</small><div class="pbar"><i style="width:${prog * 100}%"></i></div><span class="mut">${next ? `${next.name} ligine ${next.min - A.rating} puan` : 'En üst lig'} · ${A.wins} G / ${A.losses} M</span></div>
      <div class="mz-tok"><small>Meydan hakkı</small><div class="mz-tk">${tok}</div><b>${left}/${max}</b></div>
      <div class="mz-hbtn"><button class="btn sm" data-a="season">${ri('gift')} Sezon</button><button class="btn sm" data-a="rank">${ri('rank')} Sıralama</button></div></div>
    ${raceBar(D.race, D.defGain)}
    <div class="mz-bar"><b>Rakipler</b><small class="mut mz-foe">yalnız karşı ırk</small><span class="sp"></span><button class="btn sm ${free ? 'green' : ''}" data-a="mzRefresh">${free ? 'Rakipleri yenile' : `Yenile ${ri('akce')}${ARENA.refreshCost}`}</button>${free ? '' : `<span class="mut mz-cd" data-mzcd="${A.oppAt + ARENA.refreshMs}">Ücretsiz: ${mmss(A.oppAt + ARENA.refreshMs - now())}</span>`}</div>
    <div class="mz-list">${opp}</div>
    <details class="mz-more"><summary>Sezon ve eşleştirme</summary>${seasonHead()}</details>
    <div class="mz-modes">
      <div class="mz-mode live"><span>${med('timer', 'blue')}</span><div class="grow"><b>Canlı Meydan</b><small>13:00 ve 21:00 · hamle süresi ${RULES.live.timer} sn · +${RULES.live.san[0]} şan</small><span class="chip">${S.arena.live ?? 1000} puan</span>${locked('live') ? ` <span class="chip">Sv. ${UNLOCK.live}</span>` : ''}</div><button class="btn red" data-a="liveFind" ${!locked('live') && liveOpen && left > 0 ? '' : 'disabled'}>Eşleş</button></div>
      <div class="mz-mode ban"><span>${med('banner', 'red')}</span><div class="grow"><b>Sancak Savaşı</b><small>3 raunt, tek kahramanla · bugün ${used('banner')}/5</small>${locked('banner') ? `<span class="chip">Sv. ${UNLOCK.banner}</span>` : ''}</div><button class="btn red" data-a="mode" data-m="banner" ${!locked('banner') && used('banner') < 5 ? '' : 'disabled'}>Seç</button></div>
    </div>`;
}
// Günlük ırk yarışı: bugün iki ırkın kazandığı Meydan puanı, dünün üstün ırkı (pvp.js: RACE_DAY)
function raceBar(R, defGain) {
  if (!R) return '';
  const ks = Object.keys(FACTIONS), a = R.t[ks[0]] || 0, b = R.t[ks[1]] || 0, pa = a + b ? Math.round(a / (a + b) * 100) : 50;
  const yw = R.yw ? `Dün üstün: <b style="color:${FACTIONS[R.yw].color}">${FACTIONS[R.yw].name}</b> (${R.y[R.yw]} – ${R.y[ks.find(k => k !== R.yw)]})` : (R.y[ks[0]] || R.y[ks[1]] ? `Dün berabere (${R.y[ks[0]]} – ${R.y[ks[1]]})` : 'Dün Meydan’da puan yazılmadı');
  return `<div class="mz-race"><div class="mz-rhead"><b>${ri('crown')} Günün ırk yarışı</b><span class="mut">Zafer +${ARENA_PTS.win} · savunma +${ARENA_PTS.def} puan ırkına yazılır</span>${defGain ? `<span class="chip up">Savunmadan +${defGain} puan</span>` : ''}</div>
    <div class="mz-rbar"><span class="f0" style="--fc:${FACTIONS[ks[0]].color}">${FACTIONS[ks[0]].name} <b>${a}</b></span><div class="mz-rtrack"><i style="width:${pa}%;background:${FACTIONS[ks[0]].color}"></i><i style="width:${100 - pa}%;background:${FACTIONS[ks[1]].color}"></i></div><span class="f1" style="--fc:${FACTIONS[ks[1]].color}"><b>${b}</b> ${FACTIONS[ks[1]].name}</span></div>
    <div class="mz-rfoot"><span>Üstün ırk ${RACE_DAY.top} kat ödül alır (${RACE_DAY.top}:${RACE_DAY.low})</span><span>${R.n ? `Bugün ${R.n} savaşın var; ödül yarın postada` : 'Ödül için bugün en az 1 Meydan savaşı yap'}</span><span class="mut">${yw}</span></div></div>`;
}
ACT.mzRefresh = async () => { const r = await run('arena.list', { refresh: true }); if (r) { cur().data = r; redraw(); } };
// Ücretsiz yenileme sayacı (pencere açıkken)
setInterval(() => { const el = document.querySelector('[data-mzcd]'); if (!el) return; const ms = +el.dataset.mzcd - now(); if (ms <= 0) redraw(); else el.textContent = `Ücretsiz: ${mmss(ms)}`; }, 1000);

// ---------- Kan Davası: seni yenenler, tek dokunuşla rövanş ----------
const ago = at => { const m = Math.max(1, Math.round((now() - at) / 60000)); return m < 60 ? `${m} dk önce` : m < 1440 ? `${Math.round(m / 60)} sa önce` : `${Math.round(m / 1440)} gün önce`; };
function feudPage() {
  const D = cur().data; if (!D) return loading;
  const left = ticketsLeft();
  const rows = D.feud.map(f => `<div class="fdrow ${f.ok ? 'ok' : ''}" style="--fc:${FACTIONS[f.faction]?.color || '#999'}">
      <span class="fd-ic">${f.ok ? ri('trophy') : ri('sword')}</span>
      <div class="grow"><b>${tName(f.name, f.ti, f.rk)}</b><small>${f.src === 'def' ? 'Savunmanı düşürdü' : 'Seni meydanda yendi'}${f.n > 1 ? ` · ${f.n} kez` : ''} · ${ago(f.at)}${f.lvl ? ` · Sv. ${f.lvl}` : ''}${f.rating != null ? ` · ${f.rating} puan` : ''}</small></div>
      ${f.ok ? '<span class="chip yw">Öç alındı</span>' : ''}
      <button class="btn red" data-a="feudGo" data-id="${esc(f.id)}" ${!f.gone && left > 0 ? '' : 'disabled'}>${f.gone ? 'Kaydı yok' : 'Rövanş'}</button></div>`).join('');
  return `<div class="mz-feudhead">${ri('sword')}<div><b>Kan Davası</b><small>Seni yenen ya da savunmanı düşüren son ${D.feud.length || ''} rakip. Rövanş bir meydan hakkı harcar; yenersen öç alınmış sayılır.</small></div><b class="mz-tkn">${left} hak</b></div>
    <div class="mz-list">${rows || '<p class="mut" style="text-align:center;padding:18px">Henüz kimse seni yenmedi. Meydan’da kaybettiğin ya da savunmanı düşüren rakipler burada birikir.</p>'}</div>`;
}
ACT.feudGo = async d => { const r = await run('feud.revenge', { id: d.id }); if (r) ACT.arenaVs({ i: 0 }); };

// ---------- Savunma ----------
function defPage() {
  const ids = partyIds(S), units = partyUnits(S), pw = partyPower(S);
  return `<div class="mz-defhead"><div><b>Savunma</b><small>Meydanda sana saldıranlara karşı karakterin dövüşür; onu yapay zekâ oynar.</small></div>
      <div class="mz-pow big"><small>Savunma gücü</small><b>${fmt(pw)}</b></div></div>
    <div class="mz-defrow">${ids.map((id, i) => `<div class="mz-dslot"><span class="mz-dn">${i + 1}</span>${heroArt(id, 'mz-big')}<b>${esc(S.heroes[id].name || '')}</b><small>Güç ${fmt(power(units[i]))}</small></div>`).join('')}</div>
    <div class="mbtns"><button class="btn red" data-a="party" data-back="mzBackDef">Karakteri düzenle</button><button class="btn" data-a="reports" data-tab="def">Savunma kayıtları</button></div>
    <p class="mut" style="text-align:center">İpucu: teke tekte hız ve dayanıklılık belirleyicidir; yan statlarda Hız ve Direnç ara.</p>`;
}
ACT.mzBackDef = () => ACT.meydan({ tab: 'def' });

// ---------- Meydan Marketi (Şan ile, günlük sınırlı) ----------
function shopPage() {
  return `<div class="mz-wallet">${ri('san')} <b>${fmt(S.san)}</b> şan <span class="mut">· Şan meydan zaferlerinden, sezon ödüllerinden ve seferden gelir. Ürünler her gün yenilenir.</span></div>
    <div class="kv-grid mz-shop">${ARENA_SHOP.map(x => { const n = used('ashop_' + x.id), ok = S.san >= x.cost && n < x.max; return `<div class="kv-card ${n >= x.max ? 'sold' : ''}">
      <span class="kv-badge">Günde ${x.max}</span>${resTile(x.give ? lootKind(x.give) : 'ticket', 'kv-ico')}
      <b class="kv-name">${x.name}</b><span class="mut kv-desc">${x.desc}</span><span class="chip">Bugün ${n}/${x.max}</span>
      <button class="btn kv-buy" data-a="mzBuy" data-id="${x.id}" ${ok ? '' : 'disabled'}>${ri('san')} ${fmt(x.cost)}</button></div>`; }).join('')}</div>`;
}
ACT.mzBuy = async d => { const r = await doAct('arena.shop', { id: d.id }); if (r) { if (r.loot?.length) lootToast(r.loot); else toast('+2 meydan hakkı'); } };

// ---------- Şan Dükkânı (eski Şan Divanı: kalıcı parti bonusu) ----------
function sanPage() {
  if (locked('hall')) return `<div class="hint">${ri('lock')} Şan Dükkânı: ${lockNote('hall')}</div>`;
  return `<div class="mz-wallet">${ri('san')} <b>${fmt(S.san)}</b> şan <span class="mut">· Her seviye karakterine kalıcı +%${HALL.pct * 100} verir.</span></div>
    <div class="mz-hall">${Object.entries(HALL.stats).map(([k, n]) => { const l = S.hall[k], cost = HALL.cost(l); return `<div class="mz-hc ${k}">
      <span class="mz-hi">${med(k, k === 'hp' ? 'red' : k === 'atk' ? '' : 'blue')}</span><b>${n}</b>
      <div class="mz-pips">${Array.from({ length: HALL.max }, (_, i) => `<i class="${i < l ? 'on' : ''}"></i>`).join('')}</div>
      <span class="mut">+%${Math.round(l * HALL.pct * 100)}${l < HALL.max ? ` → +%${Math.round((l + 1) * HALL.pct * 100)}` : ''}</span>
      ${l < HALL.max ? `<button class="btn" data-a="hallUp" data-k="${k}" ${S.san >= cost ? '' : 'disabled'}>${ri('san')} ${fmt(cost)}</button>` : '<span class="chip up">En yüksek</span>'}</div>`; }).join('')}</div>`;
}

// ---------- Eski Meydan yollarını buraya yönlendir ----------
const gate0 = ACT.gate;
ACT.gate = d => (d?.tab === 'pvp' ? ACT.meydan({ tab: 'fight' }) : gate0(d));
ACT.czpk = () => ACT.meydan({ tab: 'fight' });
ACT.hall = () => ACT.meydan({ tab: 'san' });
ACT.seasonBack = () => ACT.meydan({ tab: 'fight' });
