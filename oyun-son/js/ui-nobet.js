// Kristal Nöbeti penceresi (Yemin Pazarı → Şaman Yashka). Kurallar shared/nobet.js'tedir.
// Kayıtlı oyuncu nöbet başlayınca nereden olursa olsun (savaş dışındaysa) ilk dalga savaşına kendiliğinden çekilir.
import { S, now } from './api.js';
import { ACT, esc, fmt, toast, run, openWin, reload, cur, confirmBox, closeModal, closeWin, hud } from './ui-core.js';
import { FACTIONS, CLASSES } from '../shared/content.js';
import { STONES } from '../shared/items.js';
import { NOBET } from '../shared/nobet.js';
import { startBattle, showResult } from './ui-battle.js';
import { act } from './api.js';
import { runBattle } from './combat.js';
import { hideTown } from './town.js';
import { hideChatBar } from './ui-social.js';
import { showModal } from './ui-core.js';
import { BT } from './combat.js';

const MIN = 60000;
const clock = t => new Date(t).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' });
const mmss = ms => { ms = Math.max(0, ms); const s = Math.floor(ms / 1000); return s >= 3600 ? `${Math.floor(s / 3600)}sa ${Math.floor(s % 3600 / 60)}dk` : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const gName = g => (g.t === 'akce' ? `${fmt(g.n)} akçe` : g.t === 'yakut' ? `${g.n} Yakut` : g.t === 'stone' ? `${g.n} ${STONES[g.g]?.name || 'taş'}` : g.t === 'seal' ? `${g.n} Mühür Taşı` : g.t === 'ember' ? `${g.n} Tav Közü` : `${g.n}`);
// Özgün çizim: Sönmüş Mabet'in ortasında mavi Kül Kristali, iki yanda sütun kırıkları (dini simge yok)
const ART = `<svg class="nb-art" viewBox="0 0 320 120" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <defs><radialGradient id="nbG" cx=".5" cy=".55" r=".6"><stop offset="0" stop-color="#6ab8ff" stop-opacity=".55"/><stop offset=".55" stop-color="#1a2a5a" stop-opacity=".35"/><stop offset="1" stop-color="#07080f"/></radialGradient>
  <linearGradient id="nbC" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e6f6ff"/><stop offset=".5" stop-color="#6ab8ff"/><stop offset="1" stop-color="#1c4a9a"/></linearGradient></defs>
  <rect width="320" height="120" fill="#07080f"/><rect width="320" height="120" fill="url(#nbG)"/>
  <path d="M0 100 H320 V120 H0Z" fill="#141826"/><ellipse cx="160" cy="100" rx="90" ry="9" fill="#1e2a48"/>
  <g fill="#232a3e" stroke="#0a0c14" stroke-width="1.5"><path d="M40 100 V40 h16 V100Z"/><path d="M36 40 h24 v-6 h-24Z"/><path d="M264 100 V52 l8 -6 l8 4 V100Z"/><path d="M90 100 V70 h12 V100Z"/><path d="M218 100 V64 h12 V100Z"/></g>
  <g class="nb-cr"><path d="M160 22 L180 60 L160 98 L140 60Z" fill="url(#nbC)" stroke="#cfeaff" stroke-width="1.5"/><path d="M160 22 L166 60 L160 98" fill="#ffffff" opacity=".35"/></g>
  <g fill="#cfeaff" opacity=".7"><circle cx="120" cy="40" r="1.4"/><circle cx="204" cy="30" r="1.1"/><circle cx="188" cy="76" r="1.6"/><circle cx="132" cy="80" r="1"/><circle cx="150" cy="18" r="1"/></g>
</svg>`;

function html(D) {
  if (!D) return '<p class="mut">Yükleniyor…</p>';
  const b = NOBET.brackets, intro = `<div class="nb-head">${ART}<div class="nb-hd"><small>${esc(NOBET.npc)} · ${esc(NOBET.place)}</small><b>${esc(NOBET.name)}</b>
    <p>“Kristal söndüğü gün Tarikat geri döner. İki ırk da olsa, nöbeti birlikte tutacaksınız.”</p></div></div>`;
  const rules = `<div class="nb-rules"><span>Her <b>${NOBET.every} dakikada</b> bir</span><span><b>${b.low.name}</b> · <b>${b.high.name}</b> ayrı nöbet</span>
    <span>Ücret <b>${fmt(NOBET.fee)} akçe</b></span><span>${NOBET.runMin} dk · ${NOBET.waves} dalga</span><span>Irkınla otomatik parti · her partide bir ${esc(CLASSES.priest?.name || 'Rahip')}</span><span>Parti hedefi: dalgaların <b>%${Math.round(NOBET.share * 100)}</b>'u</span></div>`;
  if (!D.br) return `${intro}${rules}<p class="mut">Nöbete ${D.min}. seviyeden itibaren katılabilirsin.</p>`;
  const t = now(), my = (D.parties || []).find(g => g.id === D.mine);
  let body = '';
  if (D.phase === 'wait') body = `<div class="nb-st"><small>Sıradaki nöbet (${esc(b[D.br].name)})</small><b>${clock(D.start)}</b><em>Kayıt ${mmss(D.regAt - t)} sonra açılır</em></div>`;
  else if (D.phase === 'reg') body = `<div class="nb-st on"><small>Kayıt açık · ${D.regN} nöbetçi</small><b>${mmss(D.start - t)}</b><em>${D.joined ? 'Kayıtlısın. Geri sayım bitince nöbete çekileceksin; bu sürede başka savaşa giremezsin.' : 'Katılınca geri sayım bitene kadar başka savaşa ya da etkinliğe giremezsin.'}</em>
    ${D.joined ? '<div class="mbtns"><button class="btn" data-a="nbLeave">Kaydı bırak</button></div>' : `<div class="mbtns"><button class="btn red" data-a="nbJoin">Katıl · ${fmt(NOBET.fee)} akçe</button></div>`}</div>`;
  else if (D.phase === 'run' && !D.over) body = `<div class="nb-st run"><small>Nöbet sürüyor · ${Math.floor(D.minute) + 1}. dakika</small><b>${mmss(D.end - t)}</b>
    ${my ? `<div class="nb-bar cr"><i style="width:${my.pct}%"></i><span>${esc(my.name)} payı ${my.done}/${my.quota} dalga${my.failed ? ' · DÜŞTÜ' : ''}</span></div>` : ''}<div class="nb-bar wv"><i style="width:${100 * D.waves / D.of}%"></i><span>Dalga ${D.waves}/${D.of}</span></div>
    <em>Güçlendirme: ${D.buffs ? `saldırı ve savunma +%${Math.round(NOBET.buff * 100 * D.buffs)}` : 'yok (5. ve 10. dakikada Kristal Muhafızı çıkar)'}</em>${D.bossReady ? '<div class="nb-boss"><b>Lav Yürek geldi</b><span>Ateş direnci önemli</span></div>' : ''}
    ${D.joined && !D.left && !my?.failed ? '<div class="mbtns"><button class="btn red" data-a="nbGo">Nöbete gir</button></div>' : my?.failed ? '<p class="mut">Partin düştü: kalan payın öbür partilere geçti.</p>' : '<p class="mut">Bu nöbete kayıtlı değilsin.</p>'}</div>`;
  else body = `<div class="nb-st ${D.won ? 'win' : 'lose'}"><small>Nöbet bitti</small><b>${D.won ? 'Kristal ayakta' : 'Kristal düştü'}</b><em>${D.waves}/${D.of} dalga</em>
    ${D.joined ? (D.got ? '<p class="mut">Sandığını aldın.</p>' : D.chest?.chest ? `<div class="mbtns"><button class="btn green" data-a="nbClaim">${NOBET.chests[D.chest.chest].name}’nı al</button></div><p class="mut">Hasar sıran: ${D.chest.rank}/${D.chest.of}</p>` : `<p class="mut">${esc(D.chest?.why || '')}</p>`) : ''}</div>`;
  const CI = { warrior: 'W', rogue: 'S', priest: 'R', mage: 'B' };
  const parties = D.parties?.length ? `<div class="nb-pt"><small>Partiler (ırkına göre, otomatik) · düşen partinin kalan payı ayaktakilere eşit paylaşılır</small>${D.parties.map(g => `<div class="nb-p ${g.failed ? 'fail' : g.ok ? 'ok' : ''} ${g.id === D.mine ? 'mine' : ''}">
    <b style="color:${FACTIONS[g.f]?.color || '#fff'}">${esc(g.name)}</b><span class="nb-mm">${g.members.map(x => `<i class="c-${x.cls}${x.me ? ' me' : ''}" title="${esc(x.name)} · ${esc(CLASSES[x.cls]?.name || x.cls)} · Sv. ${x.lvl}">${CI[x.cls] || '?'}</i>`).join('')}</span>
    <span class="nb-pb"><i style="width:${g.pct}%"></i></span><em>${g.failed ? 'Düştü' : g.ok ? 'Tamam' : `${g.done}/${g.quota}`}</em></div>`).join('')}</div>` : '';
  const top = D.top?.length && (D.phase === 'run' || D.phase === 'done') ? `<div class="nb-top"><small>Hasar sıralaması (iki ırk)</small>${D.top.map((x, i) => `<div class="${x.me ? 'me' : ''}"><span>${i + 1}.</span><b style="color:${FACTIONS[x.faction]?.color || '#efe4cc'}">${esc(x.name)}</b><em>${fmt(x.dmg)}</em></div>`).join('')}${D.me && D.me.rank > 10 ? `<div class="me"><span>${D.me.rank}.</span><b>${esc(S.name)}</b><em>${fmt(D.me.dmg)}</em></div>` : ''}</div>` : '';
  const chests = `<div class="nb-ch">${['blue', 'green'].map(k => `<div class="${k}"><b>${NOBET.chests[k].name}</b><small>${k === 'blue' ? 'Parti hasarında üst yarı' : 'Parti hasarında alt yarı'}</small><span>${NOBET.chests[k].give.map(gName).join(' · ')}</span></div>`).join('')}</div>`;
  return `<div class="nb">${intro}${body}${parties}${rules}${top}${chests}<p class="mut nb-foot">Kazanmak için ayakta kalan bütün partilerin payı bitmeli ve Lav Yürek kesilmeli. Bir parti, üyeleri toplam ${NOBET.partyFail} savaş kaybedince düşer. Sandık ayakta kalan partilere verilir: parti hasarında üst yarı Mavi, alt yarı Yeşil.</p></div>`;
}

let tick = null;
ACT.nobet = () => {
  openWin({ title: NOBET.name, load: () => run('nobet.view'), render: () => html(cur()?.data) });
  clearInterval(tick); tick = setInterval(() => { if (cur()?.title !== NOBET.name || document.getElementById('win').hidden) { clearInterval(tick); return; } const el = document.querySelector('#page .nb'); if (el) reload(); }, 5000);
};
ACT.nbJoin = () => confirmBox(NOBET.name, `${fmt(NOBET.fee)} akçe ile katıl? Geri sayım ve nöbet boyunca başka savaşa giremezsin.`, async () => { closeModal(); const r = await run('nobet.join'); if (r) { toast('Nöbete kaydoldun. Geri sayım bitince çekileceksin.'); reload(); } });
ACT.nbLeave = () => confirmBox('Kaydı bırak', 'Kaydı bırakırsan ücret geri verilmez. Emin misin?', async () => { closeModal(); const r = await run('nobet.leave'); if (r) reload(); });
// ---- Ortak parti savaşı (shared/coop.js): partinin odasına katıl → lobi → aynı savaşı eş zamanlı oyna ----
const sleep = ms => new Promise(r => setTimeout(r, ms));
let lobbyOff = false;
function lobbyHtml(v) {
  const left = Math.max(0, Math.ceil((v.startAt - now()) / 1000));
  return `<h2>Parti toplanıyor</h2><div class="in nb-lobby"><p>Partinin gerçek oyuncuları aynı savaşa giriyor. Gelmeyen üyelerin kahramanları yapay zekâyla yanında savaşır.</p>
    <div class="nb-lb">${v.humans.map(h => `<span><i class="c-${h.cls || 'warrior'}">${({ warrior: 'W', rogue: 'S', priest: 'R', mage: 'B' })[h.cls] || '?'}</i>${esc(h.name)}</span>`).join('')}</div>
    <p class="mut">Savaş ${left} sn içinde başlar.</p><div class="mbtns"><button class="btn" data-a="nbLobbyOff">Vazgeç</button></div></div>`;
}
ACT.nbLobbyOff = () => { lobbyOff = true; closeModal(); };
ACT.nbGo = async () => {
  closeWin(true); closeModal(); lobbyOff = false;
  let v = await run('coop.join'); if (!v) return;
  while (v.status === 'lobby') {
    showModal(lobbyHtml(v));
    await sleep(1000);
    if (lobbyOff) { run('coop.leave', { id: v.id }); return; }
    v = await run('coop.view', { id: v.id, from: 0 }); if (!v) return;
  }
  closeModal();
  if (v.status === 'over' && !v.setup) return toast('Bu savaş bitti.');
  const id = v.id, acts = [...(v.acts || [])];
  const getAct = async i => { while (acts.length <= i) { await sleep(800); const r = await act('coop.view', { id, from: acts.length }).catch(() => null); if (r?.acts?.length && r.from === acts.length) acts.push(...r.acts); } return acts[i]; };
  const putAct = async (i, c) => { try { await act('coop.act', { id, i, c }); if (acts.length === i) acts.push(c); return true; } catch { return false; } };
  hud.hidden = true; hideTown(); hideChatBar();
  runBattle({ setup: v.setup, env: 'shrine', title: v.title, timer: 25, coop: { me: v.me, getAct, putAct },
    onDone: async () => { let res = null; for (let k = 0; k < 6 && !res; k++) { res = await act('coop.done', { id }).catch(e => (e.code === 'done' ? null : (k === 5 ? toast(e.message) : null))); if (!res) await sleep(700); } if (!res) return ACT.hub(); showResult({ id: 0, title: res.title }, res, { mode: 'nobet' }, false); },
    onExit: () => confirmBox('Parti savaşından çık', 'Kahramanın savaşta kalır; sıran gelince yapay zekâ oynar.', () => { closeModal(); ACT.hub(); }, 'Çık') });
};
ACT.nbClaim = async () => { const r = await run('nobet.claim'); if (r) { toast(`${r.name}: ${r.loot.map(gName).join(', ')}`); reload(); } };

// Otomatik çekilme: kayıtlıyken nöbet başlayınca (savaşta değilse) ilk dalgaya girer; her nöbet için bir kez
let pulled = null;
setInterval(() => {
  const N = S?.nobet; if (!N || N.left || N.over || pulled === N.key) return;
  const t = now(); if (t < N.start || t >= N.start + NOBET.runMin * MIN) return;
  if (BT.on || hud.hidden) return; // savaşta ya da tam ekran bir sahnede: bitince bir sonraki yoklamada
  pulled = N.key; closeWin(true); closeModal(); toast(`${NOBET.name} başladı: partinle Sönmüş Mabet’e çekiliyorsun!`); ACT.nbGo();
}, 2000);
