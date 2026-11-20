// Oyuncular arası ekranlar: ana üsteki sohbet şeridi, tam ekran sohbet (genel, klan, özel), oyuncu kartı,
// sıralama (oyuncular, klanlar, ırk üstünlüğü) ve Taş Yemini (şampiyon, lider klan, üstün ırk).
import { S, now } from './api.js';
import { ACT, $, win, reload, esc, fmt, toast, run, showModal, closeModal, openWin, cur, heroImg, mobImg, loading, DEF_W, hooks, me, faceImg, titleIcon, titleChip, bonusBox, clockText, achTag, titleSvg, tName } from './ui-core.js';
import { FACTIONS, CLASSES, PREMIUM, CHAT, TITLES, WAR_BONUS, leagueOf, warBonusLine } from '../shared/content.js';
import { MOBS } from '../shared/zones.js';
import { svg, ri } from './icons.js';
import { ilvTag } from './esya-parts.js';
import { bannerSvg } from './banner.js';
import { can, RANKS } from '../shared/clan.js';
import { PERIODS, FRAMES, RANK_REWARDS } from '../shared/rankper.js';

const hhmm = t => { const d = new Date(t); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
// Sohbet satırı: gönderenin profil fotoğrafı (çerçevesiyle), adı, klan sancağı, unvan simgesi ve mesaj. Fotoğraf ya da ad kartı açar.
const line = m => `<div class="cm ${m.me ? 'me' : ''}"><button class="cav" data-a="pcard" data-id="${esc(m.from)}">${faceImg(m, 'xs')}</button><div class="cbody"><button class="cn" data-a="pcard" data-id="${esc(m.from)}" style="color:${FACTIONS[m.faction]?.color || '#ccc'}">${tName(m.name, m.ti, m.rk)}</button>${bannerSvg(m.banner, 'xs')}${titleIcon(m.title)}<span>${esc(m.text)}</span></div><time>${hhmm(m.at)}</time>${m.me ? '' : `<button class="cmore" data-a="msgMenu" data-id="${esc(m.from)}" data-name="${esc(m.name)}" data-msg="${esc(m.id)}" data-ch="${CH.tab}" data-to="${esc(CH.to || '')}" data-text="${esc(m.text)}" title="Alıntı yap, şikâyet et ya da engelle">⋯</button>`}</div>`;

// ---------- Ana üsteki sohbet şeridi: son mesajlar + yazma kutusu; dokununca tam ekran ----------
const bar = $('#chatbar');
let barTimer = null, barKey = '';
bar.innerHTML = `<div class="cb-tabs">${[['g', 'Genel'], ['f', 'Irk'], ['c', 'Klan'], ['p', 'Özel']].map(([t, n]) => `<button data-a="chatOpen" data-tab="${t}" class="${t === 'g' ? 'on' : ''}">${n}</button>`).join('')}</div><div class="cb-msgs" data-a="chatOpen"><div class="mut">Sohbet yükleniyor…</div></div>
  <div class="cb-in"><input type="text" id="cbtext" maxlength="${CHAT.max}" placeholder="Genel sohbete yaz…" autocomplete="off" data-enter="cbSend"><button class="cb-b cb-emo" data-a="emoOpen" data-for="cbtext" title="Emoji" aria-label="Emoji ekle">😊</button><button class="cb-b" data-a="cbSend" title="Gönder">${svg('send')}</button></div>
  <button class="cb-b cb-exp cb-min" data-a="chatMini" title="Sohbeti küçült" aria-label="Sohbeti küçült"><b class="cb-x">✕</b><b class="cb-p">+</b><span class="badge" id="cbunread" hidden></span></button>`;
// 19 Kas (kullanıcı): büyütme simgesi yerine kapatma işareti; basınca sohbet görev izleyicisi gibi tek satıra küçülür (dd_chatmini)
const MINI_KEY = 'dd_chatmini';
const setMini = on => { bar.classList.toggle('mini', on); const b = bar.querySelector('.cb-min'); if (b) { b.title = on ? 'Sohbeti aç' : 'Sohbeti küçült'; b.setAttribute('aria-label', b.title); } };
try { setMini((localStorage.getItem(MINI_KEY) ?? (Math.min(innerWidth, innerHeight) <= 480 ? '1' : '0')) === '1'); } catch {} // 20 Kas: telefonda (kısa ekran) ilk açılışta küçük: ana merkezin binalarını örtmesin
ACT.chatMini = () => { const on = !bar.classList.contains('mini'); setMini(on); try { localStorage.setItem(MINI_KEY, on ? '1' : '0'); } catch {} };
async function peek() {
  if (bar.hidden || !win.hidden || document.hidden) return;
  const r = await run('chat.peek').catch(() => null);
  if (!r) return;
  hooks.chatMute?.(r.mute || null, 'bar'); // susturma bildirimi (ui-guvenlik.js)
  if (r.title !== me.title || (r.req || 0) !== (me.req || 0)) { me.title = r.title; me.req = r.req || 0; hooks.hud(); } // unvan ya da bekleyen arkadaşlık isteği değişti: kart çerçevesi ve Menü rozeti yenilenir
  const key = r.msgs.map(m => m.id).join() + r.unread;
  if (key !== barKey) {
    barKey = key;
    bar.querySelector('.cb-msgs').innerHTML = r.msgs.slice(-3).map(m => `<div class="cl"><b style="color:${FACTIONS[m.faction]?.color || '#ccc'}">${esc(m.name)}:</b> ${esc(m.text)}</div>`).join('') || '<div class="mut">Henüz mesaj yok. İlk sen yaz.</div>';
    const u = $('#cbunread'); u.hidden = !r.unread; u.textContent = r.unread;
  }
}
export function showChatBar() { bar.hidden = false; clearInterval(barTimer); barTimer = setInterval(peek, 5000); peek(); }
export function hideChatBar() { bar.hidden = true; clearInterval(barTimer); }
ACT.cbSend = async () => {
  const el = $('#cbtext'), text = el.value.trim();
  if (!text) return ACT.chatOpen();
  const r = await run('chat.send', { ch: 'g', text });
  if (r) { el.value = ''; barKey = ''; if (r.sent === false) toast(r.muted.message); peek(); }
};

// ---------- Emoji paneli (şerit ve tam ekran sohbet) ----------
// Panel, düğmenin bulunduğu yazı satırının içine konur: telefon dik tutulup ekran döndürüldüğünde de yeri doğru kalır.
const EMOJI = ['😀', '😂', '🤣', '😍', '😎', '🤔', '😢', '😡', '😱', '😴', '👍', '👎', '👏', '🙏', '💪', '🤝', '🔥', '⚔️', '🛡️', '🏹', '🪓', '🗡️', '🧙', '💀', '👑', '💎', '🪙', '🎁', '🏆', '⭐', '❤️', '💔', '😈', '🐺', '🐉', '🍺'];
const closeEmo = () => document.querySelectorAll('.emopick').forEach(e => e.remove());
ACT.emoOpen = (d, el) => {
  const row = (el || document.querySelector(`[data-a="emoOpen"][data-for="${d.for}"]`))?.closest('.cb-in, .chin');
  if (!row) return;
  const open = row.querySelector('.emopick'); closeEmo(); if (open) return; // ikinci dokunuş kapatır
  const box = document.createElement('div');
  box.className = 'emopick'; box.setAttribute('role', 'listbox');
  box.innerHTML = EMOJI.map(e => `<button type="button" data-a="emoPick" data-for="${d.for}" data-e="${e}" aria-label="${e}">${e}</button>`).join('');
  row.appendChild(box);
};
ACT.emoPick = d => {
  const inp = document.getElementById(d.for); if (!inp) return;
  const max = +inp.maxLength > 0 ? +inp.maxLength : 200, a = inp.selectionStart ?? inp.value.length, b = inp.selectionEnd ?? a;
  const v = inp.value.slice(0, a) + d.e + inp.value.slice(b);
  if (v.length > max) return toast('Mesaj sınırına ulaşıldı.');
  inp.value = v; const at = a + d.e.length;
  try { inp.setSelectionRange(at, at); } catch { /* eski tarayıcı */ }
};
document.addEventListener('click', e => { if (!e.target.closest('.emopick, [data-a="emoOpen"]')) closeEmo(); }, true);

// ---------- Tam ekran sohbet ----------
const CH = { tab: 'g', to: null, toName: '', msgs: [], convs: null, timer: null, cfg: null };
const TABS = [{ id: 'g', label: 'Genel', small: 'Herkes' }, { id: 'f', label: 'Irk', small: 'Irkdaşların' }, { id: 'c', label: 'Klan', small: 'Klan üyeleri' }, { id: 'p', label: 'Özel', small: 'Birebir' }];
ACT.chatOpen = d => {
  if (d?.tab) CH.tab = d.tab;
  if (d?.to) { CH.tab = 'p'; CH.to = String(d.to); CH.toName = d.name || ''; }
  CH.msgs = []; CH.convs = null; CH.pin = undefined;
  CH.cfg = { title: 'Sohbet', tab: CH.tab, tabs: TABS, render: chatShell, onTab: t => { CH.tab = t; CH.to = null; CH.msgs = []; CH.convs = null; CH.pin = undefined; setTimeout(pull, 0); } };
  openWin(CH.cfg);
  clearInterval(CH.timer); CH.timer = setInterval(() => { if (cur() !== CH.cfg) return clearInterval(CH.timer); pull(); }, 3500);
  pull();
};
const canWrite = () => CH.tab === 'g' || CH.tab === 'f' || (CH.tab === 'c' && !!S.clan) || (CH.tab === 'p' && !!CH.to);
// Irk kanalının üstündeki sabit sarı çubuk: son ulufe ya da ferman (ui-dunya.js çizer; yenisi gelene kadar kalır)
const pinHtml = () => (CH.tab === 'f' && CH.pin !== undefined ? hooks.chatPin?.(CH.pin) || '' : CH.tab === 'g' && CH.ann ? annPinHtml(CH.ann) : '');
// Genel sohbetin sabit duyurusu (shared/duyuru.js pinOf): en az 5 dakika kalır, sonra en yenisi yerine geçer
const hhmmA = at => new Date(at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
const annPinHtml = a => `<div class="chpin annpin k-${a.k}"><i>✦</i><span><b>Duyuru:</b> ${esc(a.text)}</span><time>${hhmmA(a.at)}</time></div>`;
hooks.annPin = a => { if (JSON.stringify(a) === JSON.stringify(CH.ann)) return; CH.ann = a; if (CH.tab === 'g') { const el = $('#chpin'); if (el) el.innerHTML = pinHtml(); } };
// Kabuk bir kez çizilir; yeni mesajlar yalnızca listeyi günceller (yazı kutusu ve odak korunur)
function chatShell() {
  const head = CH.tab === 'p' && CH.to ? `<div class="sub"><button data-a="chBack">‹ Konuşmalar</button><b>${esc(CH.toName)}</b></div>` : '';
  return `<div class="chat">${head}<div id="chpin">${pinHtml()}</div><div class="chlist" id="chlist">${listHtml()}</div>
    ${canWrite() ? `<div class="chin"><input type="text" id="chtext" maxlength="${CHAT.max}" placeholder="${CH.tab === 'g' ? 'Genel sohbete yaz…' : CH.tab === 'f' ? 'Irkına yaz…' : CH.tab === 'c' ? 'Klanına yaz…' : 'Özel mesaj yaz…'}" autocomplete="off" data-enter="chSend"><button class="btn sm emo" data-a="emoOpen" data-for="chtext" title="Emoji" aria-label="Emoji ekle">😊</button><button class="btn red" data-a="chSend">Gönder</button></div>` : ''}</div>`;
}
function listHtml() {
  if (CH.tab === 'c' && !S.clan) return '<div class="hint">Bir klanda değilsin. Klan sohbeti için önce bir klana katıl ya da klan kur.</div>';
  if (CH.tab === 'p' && !CH.to) {
    if (!CH.convs) return loading;
    return CH.convs.length ? CH.convs.map(c => `<button class="ibtn" data-a="chConv" data-id="${esc(c.id)}" data-name="${esc(c.name)}"><span class="ico g1 sm">${svg('mail')}</span><span style="flex:1"><b style="color:${FACTIONS[c.faction]?.color}">${esc(c.name)}</b><br><span class="mut">${esc(c.last || '')}</span></span>${c.unread ? `<span class="badge" style="position:static">${c.unread}</span>` : ''}</button>`).join('')
      : '<div class="hint">Henüz özel konuşman yok. Sıralamada ya da sohbette bir oyuncunun adına dokun, açılan karttan “Özel mesaj” seç.</div>';
  }
  return CH.msgs.length ? CH.msgs.map(line).join('') : '<p class="mut" style="text-align:center">Henüz mesaj yok.</p>';
}
async function pull() {
  if (cur() !== CH.cfg) return;
  const tab = CH.tab, to = CH.to;
  if (tab === 'c' && !S.clan) return paint();
  if (tab === 'p' && !to) { const r = await run('chat.convs'); if (r && CH.tab === tab && !CH.to) { CH.convs = r.convs; paint(); } return; }
  const r = await run('chat.list', { ch: tab, to });
  if (!r || CH.tab !== tab || CH.to !== to) return;
  hooks.chatMute?.(r.mute || null, 'win'); // susturulmuşsa yazı kutusunun yerinde neden ve bitiş gösterilir (ui-guvenlik.js)
  const sig = l => l.map(m => m.id + (m.title || '') + m.tier).join();
  const changed = sig(r.msgs) !== sig(CH.msgs); // yeni mesaj ya da değişen unvan/çerçeve
  CH.msgs = r.msgs;
  if (tab === 'g' && 'ann' in r) hooks.annPin(r.ann);
  if (tab === 'f') { const was = JSON.stringify(CH.pin); CH.pin = r.pin ?? null; const el = $('#chpin'); if (el && was !== JSON.stringify(CH.pin)) el.innerHTML = pinHtml(); }
  if (changed) paint(true);
}
function paint(stick) {
  const el = $('#chlist'); if (!el || cur() !== CH.cfg) return;
  const atEnd = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
  el.innerHTML = listHtml();
  if (stick && atEnd || !el.dataset.init) { el.scrollTop = el.scrollHeight; el.dataset.init = 1; }
}
ACT.chSend = async () => {
  const el = $('#chtext'); if (!el) return;
  const text = el.value.trim(); if (!text) return;
  const r = await run('chat.send', { ch: CH.tab, to: CH.to, text });
  if (r) { el.value = ''; if (r.sent === false) toast(r.muted.message); await pull(); const l = $('#chlist'); if (l) l.scrollTop = l.scrollHeight; }
};
ACT.chConv = d => { CH.to = d.id; CH.toName = d.name; CH.msgs = []; ACT.chatOpen({ to: d.id, name: d.name }); };
ACT.chBack = () => { CH.to = null; CH.msgs = []; ACT.chatOpen({ tab: 'p' }); };

// ---------- Oyuncu kartı: sıralamada, sohbette ya da Taş Yemini'nde bir oyuncuya dokununca ----------
ACT.pcard = async d => {
  const r = await run('player.card', { id: d.id }); if (!r) return;
  const c = r.card, F = FACTIONS[c.faction];
  if (c.me && c.title !== me.title) { me.title = c.title; hooks.hud(); }
  showModal(`<h2>${esc(c.name)}</h2><div class="in pc">
    <div class="pc-head" style="--fc:${F.color}">${faceImg(c, 'lg')}<div><p class="pc-name" style="color:${F.color}">${tName(c.name, c.ti, c.rk)}</p><p>${F.name} · Seviye ${c.lvl}</p>
      <p>Klan: <b>${bannerSvg(c.banner, 'xs')}${c.clan ? esc(c.clan) : '—'}</b></p>
      <div class="pc-tags">${titleChip(c.title)}${c.tier ? `<span class="chip up">${PREMIUM[c.tier].name} Premium</span>` : ''}${c.fr ? `<span class="chip">${FRAMES[c.fr] || ''}</span>` : ''}</div></div></div>
    <div class="pc-kv"><div><small>Güç</small>${fmt(c.power)}</div><div><small>Eşya seviyesi</small>${c.il != null ? fmt(c.il) : '—'}</div><div><small>Meydan puanı</small>${c.rating != null ? c.rating : '—'}</div><div><small>Lig</small>${c.rating != null ? leagueOf(c.rating).name : '—'}</div></div>
    <div class="mbtns">${c.me ? '' : `<button class="btn red" data-a="pm" data-id="${esc(c.id)}" data-name="${esc(c.name)}">${ri('mail', '#fff')} Özel mesaj</button><button class="btn" data-a="mailTo" data-id="${esc(c.id)}" data-name="${esc(c.name)}">Posta yaz</button>`}${!c.me && !c.clan && S.clan && c.faction === S.faction && /^\d+$/.test(c.id) && can(S.clanTag?.r, 'invite') ? `<button class="btn green" data-a="klInvite" data-id="${esc(c.id)}">Klana davet et</button>` : ''}</div>${hooks.card?.(c) || ''}</div>`);
};
ACT.pm = d => { closeModal(); ACT.chatOpen({ to: d.id, name: d.name }); };

// ---------- Irk üstünlüğü (Sıralama ve Taş Yemini aynı görünümü kullanır): haftalık durum, kalıcı taraf bonusları, galip bonusu ----------
// D: war.view sonucu (now, last, winner, holder, buffUntil, mine, buff)
function raceHtml(D) {
  const O = FACTIONS.ocak, G = FACTIONS.sancak, total = Math.max(1, D.now.ocak + D.now.sancak), lead = D.now.ocak === D.now.sancak ? null : D.now.ocak > D.now.sancak ? 'ocak' : 'sancak';
  const side = (k, F) => `<div class="race ${lead === k ? 'lead' : ''}" style="--fc:${F.color}">${D.holder === k ? `<span class="rcrown">${titleChip('champ', WAR_BONUS.name)}</span>` : ''}<h3>${F.name}</h3><b>${fmt(D.now[k])}</b><small>puan${S.faction === k ? ' · senin tarafın' : ''}</small>
    ${bonusBox(k)}</div>`;
  const ms = D.buffUntil - now(), left = ms >= 86400000 ? `${Math.floor(ms / 86400000)} gün ${Math.floor(ms % 86400000 / 3600000)} sa` : clockText(ms);
  return `<div class="racevs">${side('ocak', O)}<div class="vsx">VS</div>${side('sancak', G)}</div>
    <div class="warbar"><i style="width:${100 * D.now.ocak / total}%;background:${O.color}"></i><i style="width:${100 * D.now.sancak / total}%;background:${G.color}"></i></div>
    <p>${D.mine != null ? `Bu haftaki katkın: <b>${fmt(D.mine)}</b> puan. ` : ''}${D.winner ? `Geçen haftanın galibi: <b style="color:${FACTIONS[D.winner].color}">${FACTIONS[D.winner].name}</b> (${fmt(D.last[D.winner])} – ${fmt(D.last[D.winner === 'ocak' ? 'sancak' : 'ocak'])}).` : 'Geçen hafta berabere bitti.'} ${D.buff ? '<b class="up">Galibiyet bonusun etkin.</b>' : ''}</p>
    ${hooks.race?.(D) || ''}
    <div class="hint"><b>${WAR_BONUS.name} bonusu:</b> haftayı kazanan taraf, hafta başından itibaren ${warBonusLine} düşürür. ${D.holder ? `Şu an <b style="color:${FACTIONS[D.holder].color}">${FACTIONS[D.holder].name}</b> tarafında (${left} kaldı).` : D.winner ? 'Bu haftaki süresi doldu; şu an kimsede değil.' : 'Şu an kimsede değil.'}
      Taraf bonusları (yukarıda) kalıcıdır ve haftalık sonuca bağlı değildir.</div>
    <p class="mut">Kazandığın her savaş tarafına puan yazar: stage 1, boss 5, meydan 2, sancak savaşı raunt başına 3. Puanlar pazartesi sıfırlanır.</p>`;
}

// ---------- Sıralama: oyuncular, klanlar, ırk üstünlüğü ----------
// R.per: 'now' (genel: Meydan puanı / klan gücü) | 'd' | 'w' | 'm' (dönem kazancı, UTC) · R.fac: yalnızca kendi ırkım
const R = { per: 'now', fac: false };
const rkLoot = l => l.map(x => x.t === 'yakut' ? `${x.n} Yakut` : x.t === 'stone' ? `${x.n} Bileği Taşı` : `${x.n} ${x.t}`).join(', ');
const giveText = give => give.map(x => x.t === 'yakut' ? `${x.n} Yakut` : x.t === 'stone' ? `${x.n} ${['Kaba', 'İnce', 'Usta'][x.g] || ''} Bileği Taşı` : `${x.n}`).join(' + ');
function rankBar(info) {
  return `<div class="rk-bar"><div class="rk-seg">${[['now', 'Genel'], ...Object.entries(PERIODS).map(([k, v]) => [k, v])].map(([k, v]) => `<button class="${R.per === k ? 'on' : ''}" data-a="rkPer" data-id="${k}">${v}</button>`).join('')}</div>
    <div class="rk-seg"><button class="${R.fac ? '' : 'on'}" data-a="rkFac" data-id="0">Tümü</button><button class="${R.fac ? 'on' : ''}" data-a="rkFac" data-id="1">Irkım</button></div>
    <span class="rk-sp"></span></div>`;
}
ACT.rank = d => openWin({ title: 'Sıralama', tab: d?.tab || 'players', tabs: [{ id: 'players', label: 'Oyuncular', small: 'Meydan puanı' }, { id: 'clans', label: 'Klanlar', small: 'Klan gücü' }, { id: 'race', label: 'Irk Üstünlüğü', small: 'Haftalık sefer' }],
  load: async t => {
    if (t === 'race') return run('war.view');
    const kind = t === 'players' ? 'p' : 'c', r = await (R.per === 'now' ? run(kind === 'p' ? 'rank.top' : 'clan.top', { fac: R.fac }) : run('rank.period', { kind, per: R.per, fac: R.fac }));
    return r && { ...r, info: await run('rank.info') };
  },
  render: t => {
    const D = cur().data;
    if (!D) return loading;
    if (t === 'race') return raceHtml(D);
    const bar = rankBar(D.info), per = R.per !== 'now', rng = per ? ` Dönem kazancı sıralanır (${PERIODS[R.per].toLowerCase()}, UTC).` : '';
    if (t === 'players') return `${bar}<p class="mut">Bir oyuncuya dokun: kartı açılır. Birinci, <b>${TITLES.champ.name}</b> unvanını taşır.${rng}</p><div class="board faces">${D.top.map((x, i) => `<button class="${x.me ? 'me' : ''}" data-a="pcard" data-id="${esc(x.id)}"><span>${i + 1}.</span>${faceImg(x, 'xs')}<b style="color:${FACTIONS[x.faction].color}">${tName(x.name, x.ti, x.rk)}${per ? '' : titleIcon(x.title)}</b><span>${per ? `Sv. ${x.lvl} · +${fmt(x.score)} puan` : `Sv. ${x.lvl} · ${ilvTag(x.il)} · ${x.rating} puan`}</span></button>`).join('') || '<p class="mut">Henüz kimse yok.</p>'}</div>`;
    return `${bar}<p class="mut">Bir klana dokun: sayfası açılır. Klan gücü, üyelerin güçlerinin toplamıdır.${rng}</p><div class="board">${D.top.map((x, i) => `<button class="${x.mine ? 'me' : ''}" data-a="clanPage" data-id="${esc(x.id)}"><span>${i + 1}.</span>${bannerSvg(x.banner, 'sm')}<b style="color:${FACTIONS[x.faction].color}">${esc(x.name)}${x.lead ? titleIcon('clan') : ''}</b><span>${per ? `Sv. ${x.lvl} · +${fmt(x.score)} güç` : `Sv. ${x.lvl} · ${x.members}/${x.max} üye · ${fmt(x.power)} güç`}</span></button>`).join('') || '<p class="mut">Henüz klan yok.</p>'}</div>`;
  } });
ACT.rkPer = d => { R.per = d.id; reload(); };
ACT.rkFac = d => { R.fac = d.id === '1'; reload(); };
ACT.rkClaim = async () => {
  const r = await run('rank.claim'); if (!r) return;
  toast(`Sıralama ödülü: ${rkLoot(r.loot)}`);
  const fr = r.claims.filter(c => c.frame).map(c => FRAMES[c.frame]);
  if (fr.length) toast(`Yeni çerçeve: ${fr.join(', ')}. Profilden takabilirsin.`);
  reload();
};
ACT.rkRewards = () => showModal(`<h2>Sıralama ödülleri</h2><div class="in"><p class="mut">Dönem bitince (gün, pazartesi, ayın 1'i; UTC) önceki dönemin sıralamasına göre sandıktan alınır. Klan sıralaması ödülünü klanın bütün üyeleri alır. Her sıralamanın birincisi ayrıca bir profil çerçevesi kazanır.</p>
  <div class="board rk-rw">${Object.entries(RANK_REWARDS).map(([per, bands]) => `<div class="rk-rwh"><b>${PERIODS[per]}</b></div>${bands.map((b, i) => `<div><span>${i === 0 ? '1.' : `${bands[i - 1].to + 1}-${b.to}.`}</span><b>${giveText(b.give)}</b></div>`).join('')}`).join('')}</div>
  <p class="mut">Çerçeveler: ${Object.values(FRAMES).join(', ')}.</p></div>`);
ACT.frameSel = () => {
  const own = S.rk?.fr || [], sel = S.rk?.sel || null;
  showModal(`<h2>Profil çerçevesi</h2><div class="in"><div class="rk-frames"><button class="${sel ? '' : 'on'}" data-a="frameSet" data-id="">${faceImg({ av: S.avatar, faction: S.faction }, 'ava')}<small>Çerçevesiz</small></button>${own.map(f => `<button class="${sel === f ? 'on' : ''}" data-a="frameSet" data-id="${f}">${faceImg({ av: S.avatar, faction: S.faction, fr: f }, 'ava')}<small>${FRAMES[f]}</small></button>`).join('')}</div>
    <div class="mbtns"><button class="btn" data-a="profile">Geri</button></div></div>`);
};
ACT.frameSet = async d => { if (await run('rank.frame', { id: d.id || null })) { hooks.hud(); ACT.frameSel(); } };
// Klan sayfası (sıralamadan): sancak, üyeler, tanıtım, seviye; klansız bakan başvurabilir
ACT.clanPage = async d => {
  const r = await run('clan.page', { id: d.id }); if (!r) return;
  const c = r.clan, F = FACTIONS[c.faction], ok = r.me.power >= c.minPower;
  const act = !r.me.clanless || !r.me.same || c.mine ? '' : c.members.length >= c.max ? '<button class="btn" disabled>Dolu</button>'
    : r.me.applied ? '<button class="btn" disabled>Başvurdun</button>'
    : `<button class="btn red cp-go ${ok ? '' : 'dim'}" data-a="cpGo" data-id="${esc(c.id)}" data-open="${c.open ? 1 : 0}" ${ok ? '' : 'disabled'}>${c.open ? 'Katıl' : 'Başvur'}</button>`;
  showModal(`<h2>${esc(c.name)}</h2><div class="in cp">
    <div class="phead" style="text-align:left">${bannerSvg(c.banner, 'lg')}<div><p><b style="color:${F.color}">${F.name}</b> · Klan seviyesi <b>${c.lvl}</b> · ${c.members.length}/${c.max} üye</p><p>Klan gücü: <b>${fmt(c.power)}</b> · ${c.open ? 'herkese açık' : 'başvuruyla'}</p></div></div>
    <h3>Tanıtım</h3><p class="kl-txt ${c.promo ? '' : 'mut'}"${c.promo ? ' translate="no"' : ''}>${c.promo ? esc(c.promo) : 'Tanıtım yok.'}</p>
    <h3>Üyeler</h3><div class="board kl-mem">${c.members.map(m => `<div><b>${esc(m.name)}</b><span>${RANKS[m.rank].name} · Sv. ${m.lvl} · ${fmt(m.power)} güç</span></div>`).join('')}</div>
    <div class="mbtns cp-act">${act ? `<span class="cp-req ${ok ? '' : 'low'}">Gereken güç: <b>${fmt(c.minPower)}</b>${ok ? '' : ` (sende ${fmt(r.me.power)})`}</span>` : ''}${act}</div></div>`, 'kl-wide');
};
ACT.cpGo = async d => {
  const r = await run(d.open === '1' ? 'clan.join' : 'clan.apply', { id: d.id }); if (!r && d.open === '1') return;
  closeModal(); toast(d.open === '1' ? 'Klana katıldın.' : 'Başvurun gönderildi.');
  if (d.open === '1') ACT.clan({ tab: 'genel' });
};

// ---------- Taş Yemini: şampiyon (meydan birincisi), lider klan (en güçlü klan), üstün ırk (haftalık sefer) ----------
const statueImg = c => { const [k, v] = (c.av || 'h:warrior').split(':'), cls = CLASSES[v] ? v : 'warrior'; return k === 'm' && MOBS[v] ? mobImg(v, true, 'full') : heroImg(cls, true, 'full', c.faction, DEF_W[cls]); };
function champHtml(c) {
  if (!c) return `<div class="hint"><b>Henüz şampiyon yok.</b> Meydan sıralamasının birincisi burada anılır; Meydan seviye 12'de açılır.</div>`;
  const F = FACTIONS[c.faction];
  return `<div class="mon"><button class="statue" data-a="pcard" data-id="${esc(c.id)}" style="--fc:${F.color}"><span class="sfig">${statueImg(c)}</span><span class="sped"><b>${TITLES.champ.name}</b><small>${esc(c.name)}</small></span></button>
    <div class="minfo"><h3><span style="color:${F.color}">${esc(c.name)}</span> ${titleChip('champ')}${c.me ? ' <span class="chip up">Bu sensin</span>' : ''}</h3>
      <div class="kv"><div><small>Taraf</small><span style="color:${F.color}">${F.name}</span></div><div><small>Seviye</small>${c.lvl}</div><div><small>Güç</small>${fmt(c.power)}</div><div><small>Klan</small>${c.clan ? esc(c.clan) : '—'}</div><div><small>Meydan puanı</small>${c.rating ?? '—'}</div><div><small>Lig</small>${c.rating != null ? leagueOf(c.rating).name : '—'}</div></div>
      <p class="mut">Meydan sıralamasının birincisi ${TITLES.champ.name} unvanını ve özel çerçevesini taşır. Unvan en geç 10 dakikada bir güncellenir.</p>
      <div class="mbtns"><button class="btn red" data-a="pcard" data-id="${esc(c.id)}">Kartını aç</button><button class="btn" data-a="rank" data-tab="players">Sıralama</button></div></div></div>`;
}
function topClanHtml(c) {
  if (!c) return `<div class="hint"><b>Henüz klan yok.</b> En güçlü klan burada anılır; klanlar seviye 20'de açılır.</div>`;
  const F = FACTIONS[c.faction];
  return `<div class="mon"><div class="crest" style="--fc:${F.color}">${c.banner ? bannerSvg(c.banner, 'xl') : `<i>${svg('clan')}</i><b>${esc(c.name.trim()[0].toLocaleUpperCase('tr-TR'))}</b>`}<small>${TITLES.clan.name}</small></div>
    <div class="minfo"><h3><span style="color:${F.color}">${esc(c.name)}</span> ${titleChip('clan')}${c.mine ? ' <span class="chip up">Senin klanın</span>' : ''}</h3>
      <div class="kv"><div><small>Taraf</small><span style="color:${F.color}">${F.name}</span></div><div><small>Lider</small>${c.leader ? esc(c.leader) : '—'}</div><div><small>Üye</small>${c.members}/${c.max}</div><div><small>Klan seviyesi</small>${c.lvl}</div><div><small>Klan gücü</small>${fmt(c.power)}</div></div>
      <p class="mut">Klan gücü en yüksek klanın bütün üyeleri ${TITLES.clan.name} unvanını ve çerçevesini taşır. Unvan en geç 10 dakikada bir güncellenir.</p>
      <div class="mbtns">${c.leaderId ? `<button class="btn red" data-a="pcard" data-id="${esc(c.leaderId)}">Lideri gör</button>` : ''}<button class="btn" data-a="rank" data-tab="clans">Klan sıralaması</button></div></div></div>`;
}
ACT.monument = d => openWin({ title: 'Taş Yemini', top: true, tab: d?.tab || 'champ', tabs: [{ id: 'champ', label: TITLES.champ.name, small: 'Meydan birincisi' }, { id: 'clan', label: TITLES.clan.name, small: 'En güçlü klan' }, { id: 'ruler', label: TITLES.ruler.name, small: 'Irk önderleri', pre: `<span class="tico">${titleSvg('ruler')}</span>` }, { id: 'race', label: WAR_BONUS.name, small: 'Haftalık sefer' }],
  // Üstün Irk sekmesi sefer ekranını da açar: bekleyen puan tarafa yazılır, galibiyet bonusu tanınır
  load: async t => { const mine = t === 'race' ? await run('war.view') : null, m = await run('monument.view'); return m && { ...m, mine }; },
  render: t => {
    const D = cur().data;
    if (!D) return loading;
    return t === 'champ' ? champHtml(D.champ) : t === 'clan' ? topClanHtml(D.clan) : t === 'ruler' ? hooks.rulers?.(D) || '' : raceHtml({ ...D.war, mine: D.mine?.mine, buff: D.mine?.buff });
  } });
