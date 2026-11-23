// Dünya paketi ekranları: ana üsteki saat ve hava çipi, "Diyarın Hâli" (etkin bonuslar ve hava tahmini), Otağ (Başbuğ ve
// seçim, Irk Hazinesi ve ulufe defteri, ulufe ve ferman, Diyar Haritası), ırk sohbetinin sabit çubuğu, Taş Yemini'nin Başbuğ
// sekmesi, bölge ekranı ve ırk üstünlüğü görünümündeki hâkimiyet satırları.
// Arayüz kural hesaplamaz: sayılar sunucudan (realm.*) ya da ortak tablolardan (shared/realm.js) gelir.
import { S, now, DEV, act } from './api.js';
import { weekKey } from '../shared/content.js';
import { ACT, $, hud, win, esc, fmt, toast, run, showModal, closeModal, openWin, reload, cur, loading, hooks, me, faceImg, titleChip, titleSvg, clockText, myPerks, myTier } from './ui-core.js';
import { FACTIONS, FACTION_BONUS, WAR_BONUS, PREMIUM, bonusLines } from '../shared/content.js';
import { ZONES } from '../shared/zones.js';
import { stageOpen } from '../shared/calc.js';
const zAsh = id => !stageOpen(S, `${id}-1`, 0); // 20 Kas (Kül, oynanışta): oyuncunun henüz açmadığı bölge haritada küllü durur
import {
  KINGDOM, GRANT, DECREE, TERR, WEATHER, PHASES, phaseOf, clockOf, weatherAt, forecast, zoneBonusText, zoneBonusFor, zoneOwnerFor, HOUR, DAY,
} from '../shared/realm.js';
import { svg, ri } from './icons.js';
import { serverEmblem } from './ui-sunucu.js';
import { SERVER } from '../shared/content.js';
import { world, ensureEnv } from './world.js';
import { todKey, relightTown } from './daylight.js';
import { upkeepOf } from '../shared/sinks.js'; // Bakım (rapor paketi)
import { modNow, modLines, modBonusLines } from '../shared/pvp.js'; // haftanın zindan düzeni (pvp paketi)

// ---------- Simgeler (bu oyun için çizildi; inanç simgesi yoktur: gece, hilal değil kraterli ay tekeridir) ----------
const I = d => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const RAYS = [0, 45, 90, 135, 180, 225, 270, 315].map(a => `<rect x="11.1" y="1.2" width="1.8" height="3.6" rx=".9" transform="rotate(${a} 12 12)"/>`).join('');
const CLOUD = '<path d="M7.2 15.5a4.2 4.2 0 0 1 .5-8.4 5.4 5.4 0 0 1 10 1.6 3.5 3.5 0 0 1-.6 6.8z"/>';
const PHASE_ICON = {
  day: I(`<circle cx="12" cy="12" r="4.6"/>${RAYS}`),
  night: I('<path fill-rule="evenodd" d="M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM9.2 8.4a1.9 1.9 0 1 1 0 3.8 1.9 1.9 0 0 1 0-3.8zm5.6 4.4a1.4 1.4 0 1 1 0 2.8 1.4 1.4 0 0 1 0-2.8zM14.6 7.8a.9.9 0 1 1 0 1.8.9.9 0 0 1 0-1.8z"/>'),
  dawn: I('<path d="M2.5 17.2h19v2h-19z"/><path d="M6.4 15.4a5.6 5.6 0 0 1 11.2 0z"/><path d="M11.1 3h1.8v4h-1.8zM4.3 7.2l1.3-1.3 2.6 2.6-1.3 1.3zM19.7 7.2l-1.3-1.3-2.6 2.6 1.3 1.3z"/>'),
  dusk: I('<path d="M2.5 15.2h19v2h-19zM6 19h12v1.8H6z"/><path d="M7.4 13.4a4.6 4.6 0 0 1 9.2 0z"/>'),
};
const WX_ICON = {
  clear: I('<circle cx="12" cy="12" r="5.2" fill="none" stroke="currentColor" stroke-width="2.2"/>'),
  rain: I(`${CLOUD.replace('15.5', '13.5').replace('7.2 ', '7.2 ')}<path d="M8 16.5l-1.2 3.6h1.7l1.2-3.6zM12.2 16.5L11 20.1h1.7l1.2-3.6zM16.4 16.5l-1.2 3.6h1.7l1.2-3.6z"/>`),
  fog: I('<path d="M3 6.5h13a1.2 1.2 0 0 1 0 2.4H3zM6 11h15v2.4H6zM3 15.5h11a1.2 1.2 0 0 1 0 2.4H3zM17 15.5h4v2.4h-4z"/>'),
  wind: I('<path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" d="M3 9h10.5a2.6 2.6 0 1 0-2.4-3.6M3 13.5h15a2.8 2.8 0 1 1-2.6 3.9M3 18h7"/>'),
};
const SCROLL = I('<path d="M6 3h11a3 3 0 0 1 3 3v1h-4v11a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3v-1h11v1a1.2 1.2 0 0 0 2.2.6V6a3 3 0 0 0-.4-1.2H6.2A1.2 1.2 0 0 0 5 6v9H3V6a3 3 0 0 1 3-3z"/><path d="M7 8h6v1.6H7zM7 11h6v1.6H7z"/>');
const fcol = f => FACTIONS[f]?.color || '#6b6253';
const fname = f => FACTIONS[f]?.name || 'Sahipsiz';
const hm = t => clockOf(t);
const ago = t => { const s = Math.max(0, now() - t) / 1000; return s < 90 ? 'şimdi' : s < 3600 ? `${Math.floor(s / 60)} dk önce` : s < 86400 ? `${Math.floor(s / 3600)} sa önce` : `${Math.floor(s / 86400)} gün önce`; };
const left = ms => (ms >= DAY ? `${Math.floor(ms / DAY)} gün ${Math.floor(ms % DAY / HOUR)} sa` : clockText(ms));

// ---------- Ana üs: saat ve hava çipi ----------
// HUD her çizimde baştan yazılır (ui-hub.js); çip, HUD yenilendikçe yeniden eklenir (kalıcılık paketinin sütunu gibi).
const chipHtml = () => { const t = now(), w = weatherAt(t), p = phaseOf(t); return `<i class="wph ${p}">${PHASE_ICON[p]}</i><b>${clockOf(t)}</b><i class="wwx ${w}">${WX_ICON[w]}</i><small>${WEATHER[w].name}</small>`; };
// Çip üst ortada durur; oyuncu kartı ile kaynak çubuğu arasındaki boşluğa sığmıyorsa hava adı gizlenir ve boşluğa kaydırılır
// Bölge hâkimiyeti özeti: saatin yanında küçük düğme; bir dokunuşla Diyar Haritası açılır (Otağ → Harita ile aynı görünüm)
const terrChip = () => {
  const t = now(), mine = ZONES.filter(z => zoneOwnerFor(S, z.id, t) === S.faction).length;
  return `<i>${svg('clan')}</i><b>${mine}/${ZONES.length}</b>`;
};
const terrTitle = () => { const t = now(); return ZONES.map(z => { const o = zoneOwnerFor(S, z.id, t); return `${z.name}: ${o ? fname(o) : 'sahipsiz'}`; }).join(' · '); };
function place() {
  const el = hud.querySelector('.wclock'), pc = hud.querySelector('.pcard'), rs = hud.querySelector('.res');
  if (!el || !pc || !rs) return;
  const a = pc.offsetLeft + pc.offsetWidth + 6, b = rs.offsetLeft - 6;
  el.classList.remove('slim');
  if (el.offsetWidth > b - a) el.classList.add('slim');
  const w = el.offsetWidth;
  const cx = Math.round(Math.max(a + w / 2, Math.min(b - w / 2, hud.clientWidth / 2)));
  el.style.left = `${cx}px`; const sv = hud.querySelector('.wsrv'); if (sv) { sv.style.left = `${cx}px`; sv.style.top = `${el.offsetTop + el.offsetHeight + 6}px`; } // Sunucu etiketi saatin tam ortasında, biraz altında
  const tc = hud.querySelector('.wterr'), row = hud.querySelector('.premrow');
  if (tc && row) { if (tc.parentElement !== row) row.appendChild(tc); tc.hidden = false; tc.style.left = tc.style.top = ''; return; } // Otağ simgesi Premium ve Erişilebilirlik'in yanında
  if (tc) { // yanına sığmıyorsa (dar telefon ekranı) saatin altına iner: gizlenmez, ana ekrandan tek dokunuşla açılır
    tc.hidden = false; tc.style.top = '';
    if (cx + w / 2 + 5 + tc.offsetWidth <= b) tc.style.left = `${cx + Math.round(w / 2) + 5}px`;
    else { tc.style.left = `${cx - Math.round(tc.offsetWidth / 2)}px`; tc.style.top = `${el.offsetTop + el.offsetHeight + 4}px`; }
  }
}
function dress() {
  if (!S || hud.hidden || !hud.querySelector('.dock') || hud.querySelector('.wclock')) return;
  hud.insertAdjacentHTML('beforeend', `<button class="wclock" data-a="worldInfo" title="Saat, hava ve etkin bonuslar">${chipHtml()}</button><button class="wterr" data-a="diyarMap" title="${esc(terrTitle())}">${terrChip()}</button><button class="wsrv" data-a="server" title="Sunucu bilgileri">${serverEmblem()}<span>Sunucu: ${SERVER.name}</span></button>`); // 19 Kas: hava durumunun altında sunucu simgesi
  place();
}
new MutationObserver(dress).observe(hud, { childList: true, attributes: true, attributeFilter: ['hidden'] });
// Dakikada birkaç kez: saat yazısı tazelenir; evre ya da hava değiştiyse ana üssün ortamı yeniden kurulur
let syncAt = 0;
function tickWorld() {
  // Kayıttaki hâkimiyet özeti bu haftaya ait değilse (yeni hesap, oturum sürerken dönen hafta) sunucudan tazelenir
  if (S && !hud.hidden && S.terr?.own?.week !== weekKey(now()) && now() - syncAt > 60000) { syncAt = now(); act('ping').then(() => hooks.hud(), () => {}); }
  const el = hud.querySelector('.wclock');
  if (el && !hud.hidden) { el.innerHTML = chipHtml(); const tc = hud.querySelector('.wterr'); if (tc) { tc.innerHTML = terrChip(); tc.title = terrTitle(); } place(); }
  if (!S || hud.hidden || !world.env?.startsWith('hub:') || document.documentElement.dataset.hub2d) return; // 2B başkentte 3B sahne yok
  if (!world.env.endsWith(':' + todKey())) ensureEnv('hub', S.faction);
  relightTown(); // bina pencereleri evreye göre yanar ya da söner (ana üs her kuruluşta binaları yeniden yapar; işlem yinelenebilir)
}
setInterval(tickWorld, 5000);
// Ana üs yeniden çizildiğinde (HUD'un çocukları değişir) beklemeden uygula
let soon = 0;
new MutationObserver(() => { if (!hud.hidden && !soon) soon = setTimeout(() => { soon = 0; tickWorld(); }, 80); }).observe(hud, { childList: true, attributes: true, attributeFilter: ['hidden'] });

// ---------- Diyarın Hâli: saat, hava, etkin bonuslar, tahmin ----------
function activeBonuses() {
  const t = now(), out = [], w = weatherAt(t), P = myPerks();
  out.push({ icon: svg('clan'), src: `${FACTION_BONUS[S.faction].name} (ırk bonusu)`, text: bonusLines(S.faction).join(' · '), tone: 'f' });
  if (w !== 'clear') { out.push({ icon: WX_ICON[w], src: `Hava bonusu: ${WEATHER[w].name}`, text: WEATHER[w].bonus, tone: 'w' }); out.push({ icon: WX_ICON[w], src: `Hava bedeli: ${WEATHER[w].name}`, text: WEATHER[w].cost, tone: 'c' }); }
  for (const z of ZONES) if (zoneBonusFor(S, z.id, t)) out.push({ icon: svg('zone' + z.id), src: `Bölge hâkimiyeti: ${z.name}`, text: `${zoneBonusText(z.id)} (o bölgenin aşamalarında)`, tone: 't' });
  if (S.war?.buffUntil > t) out.push({ icon: svg('crown'), src: WAR_BONUS.name, text: `Eşya düşme oranı +%${WAR_BONUS.drop} (${left(S.war.buffUntil - t)} kaldı)`, tone: 'g' });
  if (myTier()) out.push({ icon: svg('san'), src: `${PREMIUM[myTier()].name} Premium`, text: `Savaşta deneyim +%${Math.round(P.xp * 100)}, akçe +%${Math.round(P.akce * 100)}, eşya +%${Math.round(P.drop * 100)}`, tone: 'p' });
  // Öbür paketlerin süreli etkileri de aynı listede: Bakım (Örs) ve haftanın zindan düzeni
  const U = upkeepOf(S, t); if (U) out.push({ icon: svg('forge'), src: `Bakım: ${U.name}`, text: `Eşya düşme oranı +%${U.drop} (${left(U.until - t)} kaldı)`, tone: 'g' });
  const M = modNow(t); if (M) out.push({ icon: svg('depth'), src: `Zindan düzeni: ${M.name}`, text: [...modLines(M), ...modBonusLines(M)].join(' · '), tone: 'w' });
  return out;
}
ACT.worldInfo = () => {
  const t = now(), w = weatherAt(t), p = phaseOf(t), F = forecast(t), today = Math.floor((t + 3 * HOUR) / DAY);
  const row = b => `<div class="wrow ${b.tone}"><i>${b.icon}</i><div><b>${b.src}</b><span>${b.text}</span></div></div>`;
  const slot = f => `<div class="wslot ${f.now ? 'now' : ''} ${f.k}"><time>${hm(f.from)}–${hm(f.to)}</time><i>${WX_ICON[f.k]}</i><b>${WEATHER[f.k].name}</b><span>${WEATHER[f.k].short}</span></div>`;
  const day = d => F.filter(f => Math.floor((f.from + 3 * HOUR) / DAY) === d);
  showModal(`<h2>Diyarın Hâli</h2><div class="in wxin"><div class="wxg">
    <div><div class="whead"><i class="wph ${p}">${PHASE_ICON[p]}</i><div><b>${clockOf(t)} · ${PHASES[p].name}</b><span>${WEATHER[w].name}${w === 'clear' ? '' : ` · ${WEATHER[w].line}`}</span></div><i class="wwx ${w}">${WX_ICON[w]}</i></div>
      <h3>Etkin bonuslar</h3>${activeBonuses().map(row).join('')}</div>
    <div><h3>Hava tahmini <span class="mut">· herkes için aynı</span></h3>
      <div class="wfc"><em>Bugün</em>${day(today).map(slot).join('')}</div><div class="wfc"><em>Yarın</em>${day(today + 1).map(slot).join('')}</div>
      <p class="mut">Saat sunucu saatidir (UTC+3). Hava altı saatte bir değişir; bonusları sunucu uygular.</p></div></div>
    <div class="mbtns"><button class="btn" data-a="diyarMap">Diyar Haritası</button><button class="btn" data-a="otag">${KINGDOM.court}</button></div></div>`, 'wx');
};

// ---------- Otağ ----------
const OT = { amRuler: false };
const TABS = () => [{ id: 'ruler', label: KINGDOM.title, small: 'Taht ve seçim', pre: `<span class="tico">${titleSvg('ruler')}</span>` }, { id: 'treasury', label: 'Hazine', small: 'Ulufe defteri', icon: 'akce' }, { id: 'grant', label: GRANT.name, small: 'Dağıt, ferman yaz', icon: 'gift' }, { id: 'map', label: 'Harita', small: 'Bölge hâkimiyeti', icon: 'zones' }];
async function loadOtag(tab) {
  if (tab === 'map') { try { DIYAR_IMG = (await import('./hikaye-png.js')).url('diyar'); } catch { } return { map: await run('realm.map') }; } // 22 Kas: GPT Diyar Haritası resmi
  const v = await run('realm.view'); if (!v) return null;
  OT.amRuler = v.isRuler;
  return { v, led: tab === 'treasury' ? await run('realm.ledger') : null, ros: tab === 'grant' && v.isRuler ? await run('realm.roster') : null };
}
ACT.otag = d => { closeModal(); openWin({ title: `${KINGDOM.court} · ${fname(S.faction)}`, tab: d?.tab || 'ruler', tabs: TABS(), load: loadOtag, render: renderOtag }); };
ACT.diyarMap = () => ACT.otag({ tab: 'map' });
ACT.otagMenu = () => ACT.otag();
function renderOtag(tab) {
  const D = cur().data;
  if (!D) return loading;
  return tab === 'map' ? mapHtml(D.map) : tab === 'treasury' ? treasuryHtml(D) : tab === 'grant' ? grantHtml(D) : rulerHtml(D.v);
}
const ledgerRows = list => (list.length ? `<div class="board led">${list.map(e => `<div><span>${ago(e.at)}</span><b>${esc(e.toName)}</b><span>${ri('akce')} <b>${fmt(e.n)}</b> · ${esc(e.byName)}</span></div>`).join('')}</div>` : '<p class="mut">Henüz ulufe verilmedi.</p>');

function rulerHtml(v) {
  const E = v.election, top = Math.max(1, ...E.cands.map(c => c.votes)), R = v.ruler;
  const head = R ? `<div class="okart" style="--fc:${fcol(v.faction)}"><button class="oface" data-a="pcard" data-id="${esc(R.id)}">${faceImg({ av: R.av, faction: v.faction, title: 'ruler' }, 'lg')}</button>
      <div><h3>${esc(R.name)} ${titleChip('ruler')}${v.isRuler ? ' <span class="chip up">Bu sensin</span>' : ''}</h3><p>${fname(v.faction)} ırkının bu haftaki ${KINGDOM.title}u. Seçimi <b>${fmt(R.votes)}</b> oyla kazandı (toplam ${fmt(R.total)} oy).</p>
      <p class="mut">${KINGDOM.title}, ${KINGDOM.treasury}'nden ırkdaşlarına ulufe dağıtır ve ırk sohbetine ferman yazar. Görevi pazartesi 00:00'da biter.</p></div></div>`
    : `<div class="hint"><b>Taht boş.</b> Geçen hafta kimse seçilmedi. Bu haftanın seçimini kazanan, pazartesi 00:00'da ${KINGDOM.title} olur.</div>`;
  const cand = c => `<div class="row cand ${c.me ? 'me' : ''}">${faceImg({ av: c.av, faction: v.faction }, 'sm')}<div class="grow"><b>${esc(c.name)}</b> <span class="mut">Sv. ${c.lvl}${c.me ? ' · sen' : ''}</span>${c.slogan ? `<br><span class="cslo">“${esc(c.slogan)}”</span>` : ''}
      <div class="pbar"><i style="width:${Math.round(100 * c.votes / top)}%"></i></div></div><span class="tag">${fmt(c.votes)}<small>oy</small></span>
      ${E.voted === c.id ? '<span class="chip up">Oyun</span>' : `<button class="btn sm red" data-a="rVote" data-id="${esc(c.id)}" data-name="${esc(c.name)}" ${E.voteBlock ? 'disabled' : ''}>Oy ver</button>`}</div>`;
  return `${head}
    <h3>Gelecek haftanın seçimi <span class="mut">· sandık ${left(v.endsAt - now())} sonra kapanır · ${fmt(E.total)} oy</span></h3>
    ${E.cands.map(cand).join('') || '<p class="mut">Henüz aday yok. İlk aday sen ol.</p>'}
    ${E.voteBlock ? `<p class="mut">${E.voteBlock}</p>` : '<p class="mut">Haftada tek oy kullanılır ve oy değiştirilemez.</p>'}
    <div class="row runrow"><div class="grow"><b>Aday ol</b><br><span class="mut">${E.runBlock || `Depozito ${fmt(KINGDOM.deposit)} akçe; kazanırsan ya da oyların en az %${KINGDOM.refundPct}'unu alırsan geri döner.`}</span>
      ${E.runBlock ? '' : `<input type="text" id="rslogan" maxlength="${KINGDOM.sloganMax}" placeholder="Sözün (isteğe bağlı, en çok ${KINGDOM.sloganMax} harf)" autocomplete="off">`}</div>
      <button class="btn green" data-a="rRun" ${E.runBlock ? 'disabled' : ''}>Aday ol</button></div>
    <div class="hint"><b>Kurallar:</b> aday olmak için seviye ${KINGDOM.candLvl}, elde ${fmt(KINGDOM.candSan)} Şan ve ${KINGDOM.candAgeDays} günlük hesap; oy vermek için seviye ${KINGDOM.voteLvl} ve ${KINGDOM.voteAgeDays} günlük hesap gerekir. Oylar pazartesi 00:00'da (UTC+3) sayılır; eşitlikte önce aday olan kazanır.</div>`;
}
ACT.rVote = d => showModal(`<h2>Oy ver</h2><div class="in"><p>Oyunu <b>${esc(d.name)}</b> için kullanmak üzeresin.</p><p class="mut">Haftada tek oy kullanılır ve oy değiştirilemez.</p>
  <div class="mbtns"><button class="btn red" data-a="rVoteGo" data-id="${esc(d.id)}">Oyumu ver</button><button class="btn" data-a="closeModal">Vazgeç</button></div></div>`);
ACT.rVoteGo = async d => { closeModal(); if (await run('realm.vote', { id: d.id })) { toast('Oyun sayıldı.'); reload(); } };
ACT.rRun = async () => {
  const slogan = ($('#rslogan')?.value || '').trim();
  if (await run('realm.run', { slogan })) { toast(`Adaylığın açıklandı. Depozito: ${fmt(KINGDOM.deposit)} akçe.`); reload(); }
};

function treasuryHtml(D) {
  const T = D.v.treasury, pctW = T.weeklyCap ? Math.round(100 * T.given / T.weeklyCap) : 0;
  return `<div class="tre"><div class="tgold">${ri('akce')}<b>${fmt(T.gold)}</b><small>${KINGDOM.treasury} · ${fname(D.v.faction)}</small></div>
      <div class="kv"><div><small>Hafta başında</small>${fmt(T.base)}</div><div><small>Bu hafta dağıtılan</small>${fmt(T.given)}</div><div><small>Haftalık sınır (%${GRANT.weeklyPct})</small>${fmt(T.weeklyCap)}</div>
        <div><small>Tek ulufe en çok</small>${fmt(T.grantMax)}</div><div><small>Alıcı başına haftalık</small>${fmt(T.recipientCap)}</div><div><small>Bugüne dek giren</small>${fmt(T.tin)}</div></div></div>
    <div class="pbar"><i style="width:${Math.min(100, pctW)}%"></i></div><p class="mut">Haftalık dağıtım: ${fmt(T.given)} / ${fmt(T.weeklyCap)} akçe (%${pctW}).</p>
    <div class="hint"><b>Hazine nasıl dolar?</b> Pazarda satılan her eşyanın satış vergisi ve ilan ücreti yanmaz; satıcının ırk hazinesine girer. Oyların %${KINGDOM.refundPct}'unu alamayan adayların depozitosu da hazineye kalır.
      <b>Nasıl dağıtılır?</b> Yalnızca ${KINGDOM.title} dağıtır: tek ulufe o anki hazinenin binde ${GRANT.perGrantPm}'ünü, haftalık toplam hafta başındaki hazinenin %${GRANT.weeklyPct}'sini, bir oyuncunun haftalık payı %${GRANT.recipientPct}'ini geçemez.</div>
    <h3>Ulufe defteri <span class="mut">· ırkın bütün üyelerine açık, son ${GRANT.ledger} kayıt</span></h3>${D.led ? ledgerRows(D.led.list) : loading}`;
}
function grantHtml(D) {
  const v = D.v, T = v.treasury;
  const rules = `<div class="hint"><b>${GRANT.name} kuralları:</b> alıcı aynı ırktan, en az ${GRANT.minLvl}. seviye ve ${GRANT.minAgeDays} günlük başka bir hesap olmalı; en az ${fmt(GRANT.min)} akçe verilir. İki ulufe arasında ${Math.round(GRANT.gapMs / 1000)} saniye, aynı alıcıya ${Math.round(GRANT.recipientGapMs / HOUR)} saat beklenir. Her ulufe deftere yazılır ve ırk sohbetine sabitlenir.</div>`;
  if (!v.isRuler) return `<div class="hint"><b>Ulufeyi yalnızca ${KINGDOM.title} dağıtır.</b> ${v.ruler ? `Bu haftanın ${KINGDOM.title}u: <b>${esc(v.ruler.name)}</b>.` : 'Bu hafta taht boş.'} Dağıtılan her akçeyi Hazine sekmesindeki defterde görebilirsin.</div>${rules}
    <h3>Son ulufeler</h3>${ledgerRows(v.ledger)}`;
  const t = now(), wait = v.decree.nextAt > t, canDecree = v.decree.left > 0 && !wait;
  const rost = D.ros ? (D.ros.list.length ? D.ros.list.map(x => {
    const room = Math.max(0, Math.min(T.grantMax, D.ros.cap - x.got)), cool = x.waitUntil > t, ok = x.ok && !cool && room >= GRANT.min;
    return `<div class="row">${faceImg({ av: x.av, faction: v.faction }, 'sm')}<div class="grow"><b>${esc(x.name)}</b> <span class="mut">Sv. ${x.lvl} · ${ago(x.at)}</span><br><span class="mut">Bu hafta aldığı: ${fmt(x.got)} / ${fmt(D.ros.cap)}${!x.ok ? ` · seviyesi düşük (en az ${GRANT.minLvl})` : cool ? ` · ${left(x.waitUntil - t)} sonra yeniden` : ''}</span></div>
      <button class="btn sm green" data-a="rGrant" data-id="${esc(x.id)}" data-name="${esc(x.name)}" data-max="${room}" ${ok ? '' : 'disabled'}>Ulufe ver</button></div>`;
  }).join('') : '<p class="mut">Son günlerde görülen başka ırkdaş yok. Oyuncu kartından da ulufe verebilirsin.</p>') : loading;
  return `<div class="kv"><div><small>Hazine</small>${fmt(T.gold)}</div><div><small>Bu hafta kalan pay</small>${fmt(T.left)}</div><div><small>Şu an tek ulufe en çok</small>${fmt(T.grantMax)}</div></div>
    <div class="fer-scroll" style="--fc:${FACTIONS[v.faction]?.color || '#9a3412'}"><div class="fer-rod"></div>
      <div class="fer-sheet"><div class="fer-head"><span class="fer-sign"></span><b>${DECREE.name}</b><span class="fer-sign"></span></div>
        <p class="fer-sub">Irk sohbetinin üstüne sabitlenir; bütün ırkdaşların görür.</p>
        <textarea id="rdecree" maxlength="${DECREE.max}" rows="3" placeholder="Ey ${FACTIONS[v.faction]?.name || 'ırkdaşlar'}! Bu akşam Kuşatma'da buluşuyoruz…" autocomplete="off"></textarea>
        <div class="fer-foot"><span class="fer-meta"><span class="chip">Bugün ${v.decree.left} hak</span>${wait ? `<span class="chip warn">${left(v.decree.nextAt - t)} sonra</span>` : ''}<span class="chip fer-cnt" id="rdecreeN">0/${DECREE.max}</span></span>
          <span class="fer-sig"><i>${esc(v.ruler?.name || S.name)}</i><small>${KINGDOM.title}</small></span><span class="fer-seal" aria-hidden="true"></span></div>
        <div class="mbtns"><button class="btn red" data-a="rDecree" ${canDecree ? '' : 'disabled'}>Mühürle ve yayınla</button></div></div>
      <div class="fer-rod"></div></div>
    <h3>Irkdaşlar <span class="mut">· son görülenler</span></h3>${rost}${rules}`;
}
// Ferman yazılırken karakter sayacı
document.addEventListener('input', e => { if (e.target.id === 'rdecree') { const n = document.getElementById('rdecreeN'); if (n) n.textContent = `${e.target.value.length}/${e.target.maxLength}`; } });
ACT.rDecree = async () => {
  const text = ($('#rdecree')?.value || '').replace(/\s+/g, ' ').trim(); if (!text) return toast('Önce fermanı yaz.'); // ferman tek satır gider
  if (await run('realm.announce', { text })) { toast('Ferman ırk sohbetine sabitlendi.'); reload(); }
};
ACT.rGrant = d => {
  const max = Math.max(0, +d.max || 0);
  showModal(`<h2>${GRANT.name} ver</h2><div class="in"><p><b>${esc(d.name)}</b> adlı ırkdaşına ${KINGDOM.treasury}'nden akçe ver.</p>
    <div class="crow"><input type="text" id="gamt" inputmode="numeric" maxlength="9" value="${max}" autocomplete="off" data-enter="rGrantGo" data-id="${esc(d.id)}"><span class="mut">akçe${max ? ` · en çok ${fmt(max)}` : ''}</span></div>
    <p class="mut">Tutar hazineden düşer, alıcının postasına gider ve deftere yazılır. Geri alınamaz.</p>
    <div class="mbtns"><button class="btn green" data-a="rGrantGo" data-id="${esc(d.id)}">Ver</button><button class="btn" data-a="closeModal">Vazgeç</button></div></div>`);
};
ACT.rGrantGo = async d => {
  const n = Number(($('#gamt')?.value || '').replace(/[^\d]/g, ''));
  if (!Number.isInteger(n) || n < 1) return toast('Geçerli bir tutar gir.');
  const r = await run('realm.grant', { to: d.id, n });
  if (r) { closeModal(); toast(`${r.to}: ${fmt(r.n)} akçe ulufe verildi.`); if (cur()?.title?.startsWith(KINGDOM.court)) reload(); }
};
// Oyuncu kartı: Başbuğ, aynı ırktan gerçek bir oyuncunun kartından da ulufe verebilir (kartın öbür ekleri korunur)
{ const prev = hooks.card; hooks.card = c => `${prev?.(c) || ''}${!c.me && (OT.amRuler || me.title === 'ruler') && c.faction === S.faction && /^\d+$/.test(String(c.id)) ? `<div class="mbtns"><button class="btn sm green" data-a="rGrant" data-id="${esc(c.id)}" data-name="${esc(c.name)}" data-max="0">${ri('akce')} ${GRANT.name} ver</button></div>` : ''}`; }

// ---------- Diyar Haritası ----------
// Dört bölge, Vahran Sınırı'nın çevresinde stilize bir kara parçası olarak çizilir; rengi o hafta hâkim olan ırkın rengidir.
const MAP_SHAPE = {
  1: { d: 'M22 196 L150 150 L196 196 L182 268 L92 286 L30 252 Z', lx: 104, ly: 214 },   // Vahran Ovası: güneybatı ovası
  2: { d: 'M30 60 L130 30 L196 74 L150 150 L22 196 L12 120 Z', lx: 96, ly: 104 },        // Kül Geçidi: kuzeybatı yanardağ eteği
  3: { d: 'M196 196 L250 150 L378 176 L388 250 L300 286 L182 268 Z', lx: 290, ly: 222 }, // Kızıl Bahar Meydanı: güneydoğu bozkırı
  4: { d: 'M196 74 L270 26 L370 56 L378 176 L250 150 Z', lx: 300, ly: 96 },              // Sisli Çukur: kuzeydoğu yaylası
};
// Diyar Haritası: parşömen kara, dalgalı deniz, her bölgenin kendi arazi çizimi (kırpılmış), hâkim ırkın renk örtüsü ve
// sınırı, kurdele etiketler ve hâkim ırkın imzası, Vahran Sınırı kalesi, yollar ve pusula. Oyuncunun bölgeleri altın çizgiyle işaretlenir.
const SIGN_SVG = {
  sancak: (x, y) => `<g transform="translate(${x} ${y})"><circle r="7" fill="none" stroke="#f2c84a" stroke-width="2"/>${[0, 45, 90, 135, 180, 225, 270, 315].map(a => `<path d="M0 -12 L1.6 -8.6 L-1.6 -8.6 Z" fill="#f2c84a" transform="rotate(${a})"/>`).join('')}<path d="M0 -5 L4 0 L0 5 L-4 0 Z" fill="#58b4ff" stroke="#e6f7ff" stroke-width=".8"/></g>`,
  ocak: (x, y) => `<g transform="translate(${x} ${y})"><circle r="9" fill="none" stroke="#c9963a" stroke-width="2"/><ellipse rx="5.5" ry="7" fill="#e0241a"/><rect x="-1" y="-5.5" width="2" height="11" rx="1" fill="#120404"/></g>`,
};
const TERRAIN = {
  1: () => { let g = '<rect x="0" y="0" width="400" height="300" fill="#8fb27a"/>'; for (let k = 0; k < 9; k++) g += `<path d="M${30 + k * 20} ${230 + (k % 3) * 14} q14 -6 28 0" stroke="#4f86a0" stroke-width="2" fill="none" opacity=".7"/>`;
    for (let k = 0; k < 22; k++) { const x = 30 + (k * 37) % 170, y = 170 + (k * 23) % 110; g += `<path d="M${x} ${y} l2 -11 M${x + 3} ${y} l1 -8 M${x - 3} ${y} l-1 -9" stroke="#3d5e2c" stroke-width="1.6"/><ellipse cx="${x + 2}" cy="${y - 11}" rx="1.6" ry="3.5" fill="#6a4a26"/>`; } return g; },
  2: () => { let g = '<rect x="0" y="0" width="400" height="300" fill="#8a7a72"/>'; for (const [x, y, w] of [[60, 120, 34], [120, 90, 42], [80, 170, 28], [160, 130, 30], [40, 80, 26]]) g += `<path d="M${x - w} ${y + w * .55} L${x} ${y - w * .45} L${x + w} ${y + w * .55} Z" fill="#5a4c48" stroke="#3a302c" stroke-width="1.5"/><path d="M${x - w * .18} ${y - w * .3} L${x} ${y - w * .45} L${x + w * .18} ${y - w * .3}" stroke="#ff7a2a" stroke-width="2.5" fill="none"/><path d="M${x} ${y - w * .5} q-6 -10 2 -18 q6 -8 0 -16" stroke="#6b6360" stroke-width="3" fill="none" opacity=".55"/>`; return g; },
  3: () => { let g = '<rect x="0" y="0" width="400" height="300" fill="#c99464"/>'; for (let k = 0; k < 40; k++) { const x = 190 + (k * 41) % 200, y = 150 + (k * 29) % 140; g += `<path d="M${x} ${y} l2 -6 l2 6 M${x + 5} ${y} l1 -4" stroke="#8a4a24" stroke-width="1.3" fill="none"/>`; }
    g += '<path d="M200 230 q60 -24 120 -6 t70 -10" stroke="#a8542a" stroke-width="5" fill="none" opacity=".35"/>'; return g; },
  4: () => { let g = '<rect x="0" y="0" width="400" height="300" fill="#c8dbea"/>'; for (const [x, y, w] of [[230, 90, 36], [300, 70, 44], [350, 120, 30], [270, 130, 26], [320, 150, 22]]) g += `<path d="M${x - w} ${y + w * .55} L${x} ${y - w * .5} L${x + w} ${y + w * .55} Z" fill="#7d98b4" stroke="#56708c" stroke-width="1.5"/><path d="M${x - w * .38} ${y - w * .05} L${x} ${y - w * .5} L${x + w * .38} ${y - w * .05} L${x + w * .15} ${y - w * .15} L${x} ${y - w * .02} L${x - w * .15} ${y - w * .15} Z" fill="#f4fbff"/>`; return g; },
};
const RIBBON = (x, y, text, w) => `<g class="rib"><path d="M${x - w / 2 - 8} ${y - 9} h${w + 16} l-5 9 l5 9 h-${w + 16} l5 -9 Z" class="rib-b"/><text x="${x}" y="${y + 4}">${text}</text></g>`;
// 22 Kas (GPT 2340 teslimi): boyalı Diyar Haritası — soldan sağa Vahran Ovası, Kül Geçidi, Kızıl Bahar Meydanı, Sisli Çukur.
// Resim üstünde bölge şeridi (hâkim ırk rengi), kurdele etiket ve hâkim imzası. Resim yüklenemezse eski çizim (mapSvg).
let DIYAR_IMG = null;
const BAND = { 1: [0, 585, 300, 600], 2: [585, 1095, 840, 760], 3: [1095, 1720, 1390, 300], 4: [1720, 2340, 2030, 560] }; // [sol, sağ, etiket x, etiket y]
function mapImg(zs) {
  const k = 6.6;
  const lands = zs.map(z => { const [x0, x1] = BAND[z.id] || [0, 0], mine = z.owner === S.faction, col = fcol(z.owner);
    return `<g class="mzf ${z.owner || 'none'} ${mine ? 'mine' : ''} ${zAsh(z.id) ? 'ash' : ''}"><rect x="${x0}" y="0" width="${x1 - x0}" height="1080" fill="${col}" fill-opacity="${z.owner ? .16 : 0}"/>${zAsh(z.id) ? `<rect x="${x0}" y="0" width="${x1 - x0}" height="1080" fill="#1a1612" fill-opacity=".55"/>` : ''}<rect x="${x0 + 6}" y="1046" width="${x1 - x0 - 12}" height="22" rx="6" fill="${col}" fill-opacity="${z.owner ? .9 : .35}"/>${mine ? `<rect x="${x0 + 6}" y="6" width="${x1 - x0 - 12}" height="1068" rx="14" fill="none" stroke="#f2cf6a" stroke-width="7" stroke-dasharray="26 14"/>` : ''}</g>`; }).join('');
  const labels = zs.map(z => { const [, , lx, ly] = BAND[z.id] || [0, 0, 0, 0], w = Math.max(56, z.name.length * 6.6);
    return `<g transform="translate(${lx} ${ly}) scale(${k})">${RIBBON(0, 0, esc(z.name), w)}<g class="mo-own">${z.owner ? SIGN_SVG[z.owner](-30, 22) : ''}<text x="${z.owner ? 6 : 0}" y="26" class="mo">${z.owner ? fname(z.owner) : 'Sahipsiz'}</text></g></g>`; }).join('');
  return `<svg class="dmap fancy img" viewBox="0 0 2340 1080" role="img" aria-label="Diyar Haritası"><image href="${DIYAR_IMG}" x="0" y="0" width="2340" height="1080" preserveAspectRatio="none"/>${lands}${labels}</svg>`;
}
function mapSvg(zs) {
  const hub = [198, 172];
  const defs = zs.map(z => `<clipPath id="mc${z.id}"><path d="${MAP_SHAPE[z.id].d}"/></clipPath>`).join('');
  const lands = zs.map(z => { const M = MAP_SHAPE[z.id], mine = z.owner === S.faction, col = fcol(z.owner);
    return `<g class="mzf ${z.owner || 'none'} ${mine ? 'mine' : ''} ${zAsh(z.id) ? 'ash' : ''}"><g clip-path="url(#mc${z.id})">${TERRAIN[z.id]()}<path d="${M.d}" fill="${col}" fill-opacity="${z.owner ? .32 : .12}"/></g>
      <path d="${M.d}" class="mz-edge" stroke="${col}"/>${mine ? `<path d="${M.d}" class="mz-mine"/>` : ''}</g>`; }).join('');
  const roads = zs.map(z => { const M = MAP_SHAPE[z.id]; return `<path d="M${hub[0]} ${hub[1]} Q${(hub[0] + M.lx) / 2 + 12} ${(hub[1] + M.ly) / 2 - 10} ${M.lx} ${M.ly - 14}" class="road"/>`; }).join('');
  const labels = zs.map(z => { const M = MAP_SHAPE[z.id], w = Math.max(56, z.name.length * 6.6);
    return `${RIBBON(M.lx, M.ly - 14, esc(z.name), w)}<g class="mo-own">${z.owner ? SIGN_SVG[z.owner](M.lx - 30, M.ly + 8) : ''}<text x="${M.lx + (z.owner ? 6 : 0)}" y="${M.ly + 12}" class="mo">${z.owner ? fname(z.owner) : 'Sahipsiz'}</text></g>`; }).join('');
  const waves = Array.from({ length: 14 }, (_, k) => `<path d="M${(k * 61) % 380 + 8} ${k % 2 ? 14 + (k % 3) * 4 : 286 - (k % 3) * 4} q6 -4 12 0 t12 0" class="wave"/>`).join('');
  return `<svg class="dmap fancy" viewBox="0 0 400 300" role="img" aria-label="Diyar Haritası"><defs>${defs}
      <radialGradient id="mvig" cx="50%" cy="50%" r="65%"><stop offset="60%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#2a1608" stop-opacity=".55"/></radialGradient>
      <linearGradient id="msea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2f5d6c"/><stop offset="1" stop-color="#1c3a46"/></linearGradient></defs>
    <rect x="0" y="0" width="400" height="300" rx="14" fill="url(#msea)"/>${waves}
    <path d="M30 60 L130 30 L270 26 L370 56 L378 176 L388 250 L300 286 L182 268 L92 286 L30 252 L22 196 L12 120 Z" fill="#e6d3a8" stroke="#6a4a24" stroke-width="5" stroke-linejoin="round"/>
    ${lands}${roads}
    <g class="hubm"><circle cx="${hub[0]}" cy="${hub[1]}" r="20" fill="#e7c75a"/><path d="M${hub[0] - 12} ${hub[1] + 8} v-12 h4 v-4 h3 v4 h3 v-8 h4 v8 h3 v-4 h3 v4 h4 v12 Z" fill="#3a2206"/><path d="M${hub[0] - 2} ${hub[1] + 8} v-5 a2 2 0 0 1 4 0 v5" fill="#e7c75a"/>${RIBBON(hub[0], hub[1] + 32, 'Vahran Sınırı', 58)}</g>
    ${labels}
    <g class="compass" transform="translate(360 36)"><circle r="17" fill="#e6d3a8" stroke="#6a4a24" stroke-width="2"/><path d="M0 -15 L4 0 L0 15 L-4 0 Z" fill="#6a4a24"/><path d="M0 -15 L4 0 L-4 0 Z" fill="#b0361e"/><path d="M-15 0 L0 4 L15 0 L0 -4 Z" fill="#6a4a24" opacity=".6"/><text y="-19" class="cmp">K</text></g>
    <rect x="0" y="0" width="400" height="300" rx="14" fill="url(#mvig)" pointer-events="none"/></svg>`;
}
function mapHtml(M) {
  if (!M) return loading;
  // Bölge kartı: bölgenin manzarası, hâkim ırkın rengi ve imzası, bonus, iki ırkın puan çekişmesi
  const card = z => {
    const tot = Math.max(1, z.score.ocak + z.score.sancak), lead = z.score.ocak === z.score.sancak ? null : z.score.ocak > z.score.sancak ? 'ocak' : 'sancak', mine = z.owner === S.faction, po = Math.round(100 * z.score.ocak / tot);
    return `<div class="zcard z${z.id} ${mine ? 'mine' : ''} ${z.owner ? 'own-' + z.owner : 'own-none'} ${zAsh(z.id) ? 'ash' : ''}" style="--fc:${fcol(z.owner)}">${zAsh(z.id) ? '<span class="zc-ash">Küllü · henüz açmadın</span>' : ''}
      <div class="zc-top"><span class="zc-name">${ri('zone' + z.id)}<b>${esc(z.name)}</b></span><span class="zc-own"><i class="zc-sign"></i>${z.owner ? fname(z.owner) : 'Sahipsiz'}</span></div>
      <div class="zc-bon ${mine ? 'on' : ''}">${zoneBonusText(z.id)}${mine ? ' · <b>sende etkin</b>' : ''}</div>
      <div class="zc-war"><b style="color:${FACTIONS.ocak.color}">${fmt(z.score.ocak)}</b><div class="zc-bar"><i style="width:${po}%;background:${FACTIONS.ocak.color}"></i><i style="width:${100 - po}%;background:${FACTIONS.sancak.color}"></i><em style="left:${po}%"></em></div><b style="color:${FACTIONS.sancak.color}">${fmt(z.score.sancak)}</b></div>
      <small class="zc-next">${lead ? `Gelecek hafta: <b style="color:${fcol(lead)}">${fname(lead)}</b>` : 'Eşit: bölge sahibinde kalır'}</small></div>`;
  };
  const mineN = M.zones.filter(z => z.owner === S.faction).length;
  return `<div class="dm-sum" style="--fc:${fcol(S.faction)}"><span class="dm-big"><b>${mineN}</b>/${M.zones.length}</span><span><b>bölge ${fname(S.faction)} hâkimiyetinde</b><br><span class="mut">Hafta ${left(M.endsAt - now())} sonra biter; puanı yüksek ırk gelecek hafta bölgeyi alır.</span></span></div>
    <div class="dmw"><div class="dml">${DIYAR_IMG ? mapImg(M.zones) : mapSvg(M.zones)}</div>
    <div class="dmr zcards">${M.zones.map(card).join('')}</div></div>
    <p>Bu haftaki zaferin: <b>${fmt(M.mine.wins)}</b>${M.mine.active ? ' · ırkının etkin oyuncularından sayılıyorsun' : ` · ${TERR.activeWins} zaferde etkin oyuncu sayılırsın`}. Etkin oyuncu: <span style="color:${FACTIONS.ocak.color}"><b>${fmt(M.act.ocak)}</b> ${FACTIONS.ocak.name}</span> · <span style="color:${FACTIONS.sancak.color}"><b>${fmt(M.act.sancak)}</b> ${FACTIONS.sancak.name}</span>.</p>
    <div class="hint"><b>Bölge puanı</b> = 1000 × ırkın o bölgedeki zafer puanı ÷ ırkın etkin oyuncu sayısı (en az ${TERR.minPop}). Yaratık aşaması ${TERR.pts.mob}, kapı ${TERR.pts.gate}, günlük boss ${TERR.pts.boss} puandır. Böylece kalabalık ırk sırf kalabalık olduğu için kazanmaz: kişi başına daha çok zafer kazanan alır.
      Puanı yüksek olan ırk gelecek hafta bölgeye hâkim olur ve orada <b>+%${TERR.bonusPct}</b> akçe ya da eşya düşürür. Eşitlikte bölge sahibinde kalır.</div>`;
}

// ---------- Öbür ekranlara eklenen satırlar ----------
// Kapı → Bölgeler: seçili bölgenin sahibi ve bonusu (oyuncu kaydındaki haftalık özetten; ayrıca sorgu gerekmez)
hooks.zoneInfo = z => {
  const t = now(), own = zoneOwnerFor(S, z, t), mine = own === S.faction;
  return `<button class="zinfo ${mine ? 'mine' : ''}" data-a="diyarMap" style="--fc:${fcol(own)}"><i></i><span>Bu hafta hâkim: <b>${own ? fname(own) : 'kimse'}</b> · ${zoneBonusText(z)}${mine ? ' <em>sende etkin</em>' : own ? ' (hâkim ırka)' : ''}</span><u>Harita ›</u></button>`;
};
// Savaş sonucu: bu savaşta hâkimiyet bonusu uygulandıysa (sunucunun sonucundaki "zone" alanı)
hooks.resultLine = r => (r.zone ? `Bölge hâkimiyeti: <b class="up">${r.zone === 'akce' ? 'akçe' : 'eşya düşme oranı'} +%${TERR.bonusPct}</b>` : '');
// Irk Üstünlüğü (Sıralama ve Taş Yemini): bölgelerin sahipleri
hooks.race = D => (D?.terr ? `<div class="zstrip"><b>Bölge hâkimiyeti</b>${D.terr.map(z => `<span class="zc" style="--fc:${fcol(z.owner)}">${ri('zone' + z.id)}${esc(z.name)}<em>${z.owner ? fname(z.owner) : 'sahipsiz'}</em></span>`).join('')}<button class="btn sm" data-a="diyarMap">Harita</button></div>` : '');
// Taş Yemini → Başbuğ: iki ırkın bu haftaki önderleri
hooks.rulers = D => {
  const one = f => { const r = D.rulers?.[f], F = FACTIONS[f];
    return `<div class="rcol" style="--fc:${F.color}"><h3>${F.name}</h3>${r ? `<button class="oface" data-a="pcard" data-id="${esc(r.id)}">${faceImg({ ...r, title: 'ruler' }, 'lg')}</button><b>${esc(r.name)}</b>${titleChip('ruler')}<small>Sv. ${r.lvl} · ${fmt(r.votes)}/${fmt(r.total)} oy</small>` : `<div class="rempty">${svg('crown')}</div><b>Taht boş</b><small>Geçen hafta kimse seçilmedi</small>`}</div>`; };
  return `<div class="rtwo">${one('ocak')}${one('sancak')}</div>
    <p class="mut">Her ırk, haftada bir ${KINGDOM.title}unu seçer. ${KINGDOM.title} ırkın hazinesinden ulufe dağıtır, ferman yazar ve unvanıyla çerçevesini bir hafta taşır.</p>
    <div class="mbtns"><button class="btn red" data-a="otag">${KINGDOM.court}'a git</button><button class="btn" data-a="diyarMap">Diyar Haritası</button></div>`;
};
// Irk sohbetinin sabit çubuğu (ui-social.js çağırır): son ulufe ya da ferman
hooks.chatPin = pin => {
  if (!pin) return `<button class="chpin none" data-a="otag" data-tab="treasury"><i>${SCROLL}</i><span>Henüz ferman ya da ulufe yok. ${KINGDOM.court}’da neler oluyor, bak.</span></button>`;
  const who = pin.by ? `${KINGDOM.title} ${esc(pin.by)}` : KINGDOM.title;
  return `<button class="chpin" data-a="otag" data-tab="${pin.k === 'grant' ? 'treasury' : 'ruler'}"><i>${pin.k === 'grant' ? svg('akce') : SCROLL}</i><span><b>${pin.k === 'grant' ? `${GRANT.name}:` : `${who}:`}</b> ${pin.k === 'grant' ? esc(pin.text) : `<span translate="no">${esc(pin.text)}</span>`}</span><time>${ago(pin.at)}</time></button>`;
};
// Bildirim merkezinin açtığı ekranlar (ui-kalicilik.js: GO)
hooks.go = { otag: () => ACT.otag(), irk: () => ACT.chatOpen({ tab: 'f' }), map: () => ACT.diyarMap() };

// Test sunucusu: profil penceresine "Başbuğ yap" düğmesi (dev.ruler)
if (typeof MutationObserver !== 'undefined') new MutationObserver(() => {
  const box = DEV && document.querySelector('#modal [data-a="devUnlock"]')?.parentElement;
  if (box && !box.querySelector('[data-a="devRuler"]')) box.insertAdjacentHTML('beforeend', `<button class="btn sm" data-a="devRuler">${KINGDOM.title} yap</button>`);
}).observe(document.getElementById('modal'), { childList: true });
ACT.devRuler = async () => { if (await run('dev.ruler')) { OT.amRuler = true; closeModal(); toast(`Irkının ${KINGDOM.title}u oldun; hazineye deneme akçesi kondu.`); } };
void win;
