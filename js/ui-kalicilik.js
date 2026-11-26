// Kalıcılık katmanının arayüzü: ana üsteki sağ sütun (zil, takvim, başarım), bildirim merkezi ve ayarları, giriş
// takvimleri, haftalık görevler, başarımlar ve unvanlar, öğretici ve cihaz bildirimleri.
// Kural hesaplamaz: içerik ve saf hesaplar shared/meta.js'ten okunur, her değişiklik sunucuya sorulur.
import { npcYuz } from './sahne.js'; // 23 Kas: anlatıcı yüz portresi (G4)
import { rescueCard } from './ui-ogretici.js';
import { placeNow } from './ui-hub.js';
import { ormanOn, ormanSahne } from './orman.js'; // P26 K4: açılış ormanı 2B; hikâye ve ilk savaş ormanda geçer
import { capitalOf } from '../shared/content.js';
import { S, act, now, devUI, onState } from './api.js';
import { ACT, $, hud, modal, esc, fmt, toast, run, showModal, closeModal, openWin, redraw, cur, closeWin, heroImg, lootChip, lootToast, lootKind, dropText, med, loading, clockText, achTag, hooks, locked } from './ui-core.js';
import { dailyQuestsHtml } from './ui-town.js';
import { questBoard } from './ui-gorev.js';
import './ui-hub.js'; // sıra: Profil penceresi (ACT.profile) bu modülden önce tanımlanmış olmalı
import { view } from './orient.js';
import { BT, TUTLOCK, OTO } from './combat.js';
OTO.ok = () => (S?.lvl | 0) >= OTO.lvl; // OTO 10. seviyede açılır
// 10. seviyeye girince ana ekranda bir kez OTO tanıtımı (pop-up)
const OTO_INTRO = 'dd_oto_intro';
function otoIntro() {
  try { if (localStorage.getItem(OTO_INTRO)) return; } catch { return; }
  if (!OTO.ok() || (S.tut && !S.tut.end) || !$('#battleUI').hidden || !$('#modal').hidden || !$('#win').hidden) return;
  try { localStorage.setItem(OTO_INTRO, '1'); } catch { }
  showModal(`<h2>OTO savaş</h2><p>Savaşta sağ alttaki <b>Otomatik</b> düğmesine dokunursan kahramanın yetenekleri ve iksirleri senin yerine kullanır.</p><p>Savaşa girmeden önceki ekranda <b>Oto: açık</b> seçersen savaş baştan otomatik başlar. İstediğin an Otomatik’e yeniden dokunup kontrolü geri alırsın.</p><div class="mbtns"><button class="btn green" data-a="closeModal">Anladım</button></div>`, 'oto-intro');
}
setInterval(() => { if (S && !hud.hidden) otoIntro(); }, 1500);
TUTLOCK.hold = () => !!(S?.tut && !S.tut.end && ['battle', 'bar'].includes(TUT_STEPS[S.tut.s])); // K2: ilk iki öğretici savaşında OTO kapalı başlar
TUTLOCK.pot = () => !!(S?.tut && !S.tut.end && TUT_STEPS[S.tut.s] === 'bar' && !S.tut.f?.pot && !BT.pot); // iksir içilmeden savaş sürmez (19 Kas) // savaşta oyuncunun yetenek ve iksir kullandığı (öğretici 'bar' adımı)
import { POT } from '../shared/mana.js';
import { svg, ri } from './icons.js';
import { CLASSES, FACTIONS, GAME, UNLOCK, QUESTS, IDLE, hourOf, weekDay } from '../shared/content.js';
import { seasonEndAt } from '../shared/pvp.js';
import { GRADES, itemBase } from '../shared/items.js';
import { ZONES } from '../shared/zones.js';
import { idleStock } from '../shared/calc.js';
import { farmStock } from '../shared/pvpcalc.js';
import { upkeepOf } from '../shared/sinks.js';
import {
  WEEKLY, WEEKLY_ALL, weeklyProgress, weeklyReady, MONTHLY, MONTHLY_ALL, monthlyProgress, monthlyReady, nextMonthAt, CAL7, CAL28, monthDay, monthGot, monthEndAt, cal7Ready, cal28Ready, calReady, nextDayAt, nextWeekAt,
  TUT_HUNT, ACH, ACH_CATS, ACH_STAT, ACH_CAP_STEPS, achValue, achHeld, achBonus, achOf, stepPct, TUT_STEPS, TUT_ITEM, TUT_GIFT, tutActive, tutItemHeld,
  NOTIF_CATS, NOTIF_KIND, hypeLine, energyFullAt, mineFullAt,
} from '../shared/meta.js';

// ---------- Kodla çizilmiş ikonlar (zil, takvim) ----------
const BELL = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.4a1.7 1.7 0 011.7 1.7v.5c2.9.8 4.8 3.3 4.8 6.4v3.5l1.9 2.8v1.3H3.600v-1.300l1.900-2.800V11c0-3.100 1.900-5.600 4.800-6.400v-.5A1.700 1.700 0 0112 2.400z"/><path d="M9.200 20h5.600a2.800 2.800 0 01-5.600 0z"/></svg>';
const CALI = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 2h2.200v2.400h5.600V2H17v2.400h3.600V21.600H3.400V4.400H7zM5.600 9v10.400h12.800V9z"/><path d="M7.600 11h2.600v2.400H7.600zm3.900 0h2.600v2.400h-2.600zm3.900 0h1.800v2.400h-1.800zM7.600 15h2.600v2.400H7.600zm3.900 0h2.600v2.400h-2.600z"/></svg>';
const SLID = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h8v2H3zm12 0h6v2h-6zM3 11h3v2H3zm7 0h11v2H10zM3 16h10v2H3zm14 0h4v2h-4z"/><circle cx="13" cy="7" r="2.400"/><circle cx="8" cy="12" r="2.400"/><circle cx="15" cy="17" r="2.400"/></svg>';
const tico = html => `<span class="tico">${html}</span>`;
const KIND_ICON = { energy: 'energy', mine: 'mine', idle: 'idle', farm: 'idle', sale: 'market', mail: 'mail', arena: 'arena', clan: 'clan', week: 'quest', daily: 'quest', ach: 'trophy', friend: 'party', card: 'gem', ruler: 'crown', ferman: 'chat', grant: 'akce', terr: 'zones', roster: 'party', upkeep: 'forge' };
const kindSvg = k => (k === 'cal' ? CALI : svg(KIND_ICON[k] || 'mail'));
const CAT_ICON = { energy: 'energy', stock: 'mine', market: 'market', arena: 'arena', clan: 'clan', reset: 'quest', ach: 'trophy', realm: 'crown' };
const ago = t => { const s = Math.max(0, now() - t) / 1000; return s < 90 ? 'şimdi' : s < 3600 ? `${Math.floor(s / 60)} dk önce` : s < 86400 ? `${Math.floor(s / 3600)} sa önce` : `${Math.floor(s / 86400)} gün önce`; };
const untilText = ms => (ms >= 86400000 ? `${Math.floor(ms / 86400000)} gün ${Math.floor(ms % 86400000 / 3600000)} sa` : clockText(ms));
const ls = { get: k => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch { } } };

// ---------- Ana üs: sağ üstte kaynakların altında Bildirim / Takvim / Başarım ----------
// Ana üs HUD'u her çizimde baştan yazılır (ui-hub.js); sütun, HUD yenilendikçe yeniden eklenir.
let unread = 0;
function railHtml() {
  const cal = calReady(S, now());
  return `<div class="krail">
    <button class="lbtn" data-a="notifs" title="Bildirimler"><i>${BELL}</i><span>Bildirim</span><span class="badge" id="kbell" ${unread ? '' : 'hidden'}>${unread}</span></button>
    <button class="lbtn" data-a="calendar" title="Giriş takvimi"><i>${CALI}</i><span>Takvim</span>${cal ? `<span class="badge">${cal}</span>` : ''}</button>
    <button class="lbtn" data-a="achs" title="Başarımlar ve unvanlar"><i>${svg('trophy')}</i><span>Başarım</span></button></div>`;
}
function dressHud() {
  if (!S || hud.hidden || !hud.querySelector('.dock') || hud.querySelector('.krail')) return;
  hud.insertAdjacentHTML('beforeend', railHtml());
  const nb = hud.querySelector('.lrail [data-a="news"]'); if (nb) hud.querySelector('.krail').prepend(nb); // 19 Kas: Duyuru, Bildirim'in solunda
  const wk = weeklyReady(S) + monthlyReady(S), q = hud.querySelector('.s2-dock [data-a="quests"], .dock [data-a="quests"]'); // haftalık ödüller Görevler rozetine eklenir
  if (wk && q) { let b = q.querySelector('.badge'); if (!b) { b = document.createElement('span'); b.className = 'badge'; b.textContent = '0'; q.appendChild(b); } b.textContent = (+b.textContent || 0) + wk; }
}
new MutationObserver(dressHud).observe(hud, { childList: true, attributes: true, attributeFilter: ['hidden'] });
function setUnread(n) { unread = n; const b = $('#kbell'); if (b) { b.hidden = !n; b.textContent = n; } }

// Zil: okunmamış sayısı sunucudan sorulur (ana üs görünürken 30 sn'de bir). Yeni bir kayıt varsa, kahramana seslenen
// sözü bir kez kısa ileti olarak gösterilir (öğretici sürerken gösterilmez).
let peekBusy = false;
async function peek() {
  if (!S || hud.hidden || document.hidden || peekBusy) return;
  peekBusy = true;
  const r = await act('notif.peek').catch(() => null);
  peekBusy = false;
  if (!r) return;
  setUnread(r.unread);
  if (r.top && !tutActive(S) && ls.get('dd_ntoast') !== r.top.id) { ls.set('dd_ntoast', r.top.id); if (r.top.k !== 'ach') later = later || r.top.title; }
}
setInterval(peek, 30000);
let hubWas = false;
let later = ''; // pencere ya da öğretici açıkken bekletilen kısa ileti (savaş sonucunun üstüne binmesin)
setInterval(() => {
  const on = !!S && !hud.hidden, front = on && $('#win').hidden;
  if (front && !hubWas) peek(); // ana üsse her dönüşte (savaştan, kapanan pencereden) bir kez
  hubWas = front;
  if (later && on && $('#modal').hidden && !tutActive(S) && !TU.card) { if (hooks.notifToast) hooks.notifToast({ title: later }); else toast(later); later = ''; } // bitiş kartının üstüne binmesin
  if (goLater && on && $('#modal').hidden && !tutActive(S) && !TU.card) jump(goLater);
}, 1500);
document.addEventListener('visibilitychange', () => { if (!document.hidden) peek(); });

// Yeni başarım: sunucu kaydı gelen kutusuna yazar; durum gelince kısa ileti gösterilir
let achSeen = null;
onState(s => {
  if (!s?.notif) return;
  const last = s.notif.list.at(-1), key = last ? `${last.a}:${last.n}:${last.at}` : '';
  if (achSeen !== null && key && key !== achSeen) { const A = achOf(last.a); if (A) later = `${hypeLine('ach', `ach:${last.a}:${last.n}`, s.faction).text} ${A.name}${last.n === 1 ? ` · unvan: ${A.title}` : ''}`; setTimeout(peek, 400); } // zil sayacı beklemeden güncellenir
  achSeen = key;
});

// ---------- Bildirim merkezi ----------
const GO = {
  gate: () => ACT.gate({ tab: 'zones' }), mine: () => ACT.mine(), usta: () => ACT.mine(), mail: () => ACT.mail(), arena: () => ACT.gate({ tab: 'pvp' }),
  clan: () => ACT.clan(), weekly: () => ACT.quests({ tab: 'weekly' }), calendar: () => ACT.calendar(), quests: () => ACT.quests(), ach: () => ACT.achs(),
  friends: () => ACT.friends({ tab: 'req' }), paycard: () => ACT.yakutAl({ tab: 'card' }), // ui-odeme.js
  farm: () => ACT.mine(), // Nöbet kaldırıldı: eski bildirim Maden'e açılır
  deflog: () => ACT.reports({ tab: 'def' }), // ui-rapor.js: savunmana yapılan saldırıların kaydı
  kadro: () => ACT.party(), // eski kadro bildirimi: Karakter ekranı (kadro sürüm 12'de kalktı)
  party: () => ACT.party(),
  bakim: () => ACT.anvil({ tab: 'bakim' }), // ui-rapor.js: Örs → Bakım
  yol: () => ACT.partyPath(), // ui-party.js: Karakter → Yetenek → Uzmanlık yolu
};
// Ana üs görünür değilse (açılış, savaş) istek bekletilir; ana üsse dönünce açılır
let goLater = null;
function jump(go) {
  const fn = typeof go !== 'string' ? null : Object.hasOwn(GO, go) ? GO[go] : hooks.go && Object.hasOwn(hooks.go, go) ? hooks.go[go] : null; // hooks.go: başka paketlerin ekranları (ui-dunya.js)
  if (!fn) return;
  if (!S || hud.hidden) { goLater = go; return; }
  goLater = null; closeModal(); fn();
}
ACT.notifGo = d => jump(d.go);
ACT.notifs = d => openWin({
  title: 'Bildirimler', scr: 'bildirim', tab: d?.tab || 'list', tabs: [{ id: 'list', label: 'Bildirimler', small: 'Son olaylar', pre: tico(BELL) }, { id: 'set', label: 'Ayarlar', small: 'Kategori ve cihaz', pre: tico(SLID) }],
  load: async t => {
    await DV.refresh();
    if (t !== 'list') return {};
    const r = await run('notif.list');
    if (r?.unread) await run('notif.read'); // liste açılınca okunmuş sayılır; "yeni" işaretleri bu açılışta görünür kalır
    if (r) setUnread(0);
    return r;
  },
  render: t => (t === 'list' ? notifList() : notifSettings()),
});
function notifList() {
  const D = cur().data;
  if (!D) return loading;
  const ask = S.notif.dev === null && DV.supported() && DV.perm !== 'denied' ? `<div class="row nask">${med('gift', 'gold')}<div class="grow"><b>${DV.native ? 'Oyun kapalıyken de haberin olsun' : 'Oyunda değilken de haberin olsun'}</b><br><span class="mut">Enerjin ya da maden depon dolunca telefonuna bildirim gelsin.</span></div><button class="btn sm green" data-a="devAsk">Aç</button></div>` : '';
  if (!D.list.length) return `${ask}<div class="hint">Henüz bildirim yok. Enerjin dolunca, eşyan satılınca, savunmana saldırılınca ya da klanında bir şey olunca burada görürsün.</div>`;
  return ask + D.list.map(e => `<button class="ibtn nrow ${e.unread ? 'new' : ''} ${e.muted ? 'muted' : ''}" data-a="notifGo" data-go="${esc(e.go)}">
      <span class="nface">${heroImg(CLASSES[e.cls] ? e.cls : 'warrior', false, 'sm')}<i class="nk">${kindSvg(e.k)}</i></span>
      <span class="nbody"><b>${esc(e.title)}</b><small>${esc(e.text)}${e.muted ? ' · sessiz' : ''}</small></span>
      <time>${ago(e.at)}</time></button>`).join('') + '<p class="mut">Bir bildirime dokun: ilgili ekran açılır. Kayıtlar 3 gün saklanır; posta, alınana kadar görünür.</p>';
}
// Açma-kapama anahtarı (19 Kas: Açık/Kapalı düğmesi yerine)
export const tgl = (on, a, extra = '', label = '') => `<button class="tgl${on ? ' on' : ''}" data-a="${a}" ${extra} role="switch" aria-checked="${on}" aria-label="${label}"><i></i></button>`;
function notifSettings() {
  const off = S.notif.off || {}, p = DV.perm, on = S.notif.dev === true && p === 'granted';
  const dev = !DV.supported() ? `<span class="mut">${FRAMED ? 'Gömülü deneme görünümünde cihaz bildirimi kullanılamaz; oyunu kendi sekmesinde ya da uygulama olarak açınca açabilirsin.' : 'Bu cihaz ya da tarayıcı bildirim gösteremiyor.'}</span>`
    : p === 'denied' ? '<span class="mut">Bildirim izni cihazda kapatılmış. Açmak için cihaz ayarlarından Korant Online’a bildirim izni ver.</span>'
      : on ? '<span class="mut">Açık. Zamanı gelen bildirimler bu cihazda gösterilir.</span>' : '<span class="mut">Kapalı. Açarsan önce ne göndereceğimizi anlatır, sonra cihazdan izin isteriz.</span>';
  return `<div class="hint">Kapalı kategori bildirim göndermez ve zil sayacına eklenmez; kayıtları listede sessiz olarak kalır. Ayarlar hesabında saklanır.</div>
    <div class="ntgrid">${Object.entries(NOTIF_CATS).map(([k, c]) => `<div class="row">${med(CAT_ICON[k], off[k] ? '' : 'green')}<div class="grow"><b>${c.name}</b><br><span class="mut">${c.note}</span></div>${tgl(!off[k], 'notifCat', `data-k="${k}"`, c.name)}</div>`).join('')}</div>
    <h3>Cihaz bildirimleri</h3>
    <div class="row">${med('timer', on ? 'green' : '')}<div class="grow"><b>${DV.native ? 'Oyun kapalıyken bildir' : 'Oyunda değilken bildir'}</b><br>${dev}</div>${!DV.supported() || p === 'denied' ? '' : on ? `<button class="btn sm" data-a="devTest">Dene</button>${tgl(true, 'devOff', '', 'Cihaz bildirimleri')}` : tgl(false, 'devAsk', '', 'Cihaz bildirimleri')}</div>
    <p class="mut">Cihaz bildirimleri sunucudan gönderilmez; oyunun bildiği zamanlar (enerjinin dolması, maden deposu, günlük ve haftalık yenilenme) bu cihazda kurulur. ${DV.native ? 'Uygulama kapalıyken de gelir.' : 'Tarayıcıda yalnızca oyun arka planda açık dururken gelir; Android uygulaması (APK) kapalıyken de gönderir.'}</p>
    ${devUI() ? '<div class="hint"><b>Test araçları</b><div class="mbtns"><button class="btn sm" data-a="devTut">Öğreticiyi yeniden başlat</button></div></div>' : ''}`;
}
ACT.notifCat = async d => { if (await run('notif.set', { cat: d.k, on: !!S.notif.off?.[d.k] })) { redraw(); planSoon(); } };
ACT.devTut = async () => { if (await run('dev.tut')) { closeWin(); TU.card = null; TU.sig = ''; tutTick(); } };

// ---------- Giriş takvimleri ----------
const gearName = d => `${GRADES[d.g].name} eşya`;
const dropFull = d => (d.t === 'gear' ? `${gearName(d)} (seviyene uygun, rastgele)` : dropText(d));
const dropChip = d => (d.t === 'gear' ? `<span class="chip rw">${ri('gear')}${gearName(d)}</span>` : lootChip(d));
// Hücredeki kısa gösterim: ikon + sayı (tam metin, hücreye dokununca ve bugünün satırında yazılır)
const dropMini = d => `<span class="kd">${ri(d.t === 'gear' ? 'gear' : lootKind(d))}<b>${d.t === 'gear' ? GRADES[d.g].name : fmt(d.n)}</b></span>`;
ACT.calendar = d => openWin({
  // alınacak giriş ödülü varsa o sekme, yoksa etkinlikler açılır
  title: 'Takvim', tab: d?.tab || (calReady(S, now()) ? (S.cal.n7.n < CAL7.length && cal7Ready(S, now()) ? 'n7' : 'm28') : 'ev'),
  tabs: [{ id: 'ev', label: 'Etkinlikler', small: evOpenCount() ? `${evOpenCount()} etkinlik açık` : 'Program', pre: tico(svg('timer')) }, { id: 'n7', label: 'Yedi Gün', small: S.cal.n7.n >= CAL7.length ? 'Tamamlandı' : 'Hoş geldin', pre: tico(CALI) }, { id: 'm28', label: 'Aylık', small: '28 günlük döngü', pre: tico(CALI) }],
  // 19 Kas: koyu, altın işlemeli takvim (.calx; css/v14-arayuz.css) ve sekmeye göre başlık şeridi
  render: t => `<div class="calx calx-${t}"><div class="calx-band"><span class="calx-ic">${svg(t === 'ev' ? 'timer' : 'gift')}</span><div><small>${t === 'ev' ? 'Sunucu saatiyle etkinlik programı' : t === 'n7' ? 'Yeni gelenlere yedi günlük hediye' : '28 günlük giriş döngüsü'}</small><b>${t === 'ev' ? 'Etkinlikler' : t === 'n7' ? 'Yedi Gün' : 'Aylık Takvim'}</b></div></div>${t === 'ev' ? eventsHtml() : t === 'n7' ? cal7Html() : cal28Html()}</div>`,
});
// ---------- Takvim › Etkinlikler: bütün zamanlı etkinlikler tek yerde ----------
// Her satır: şu an açık mı (ne kadar kaldı) ya da ne zaman başlar; "Git" ilgili ekranı açar. Saatler sunucu saatidir (UTC+3).
const H = 3600000;
const hourStart = t => t - (((t + 3 * H) % H + H) % H);
function eventList(t) {
  const h = hourOf(t), wd = weekDay(t), dayEnd = nextDayAt(t), wk = nextWeekAt(t);
  const akinOpen = h % 4 === 0, akinEnd = hourStart(t) + H, akinNext = hourStart(t) + (4 - (h % 4)) * H;
  const riftOpen = wd >= 5, riftNext = dayEnd + (4 - wd) * 24 * H; // cumartesi 00:00
  return [
    { id: 'akin', icon: 'akin', name: 'Akın', desc: '12 dalgada en çok yaratığı kes; şan ve taş verir. Günde 3 hak.', open: akinOpen, at: akinOpen ? akinEnd : akinNext, every: '4 saatte bir · 1 saat', go: () => ACT.gate({ tab: 'events' }), lock: 'arena' },
    { id: 'rift', icon: 'rift', name: 'Gök Yarığı', desc: 'Kader Çarkı parçası verir. Yalnızca cumartesi ve pazar.', open: riftOpen, at: riftOpen ? wk : riftNext, every: 'Hafta sonu', go: () => ACT.gate({ tab: 'dungeons' }), lock: 'rift' },
    { id: 'war', icon: 'banner', name: 'Büyük Sefer', desc: 'Kazandığın her savaş tarafına puan yazar; kazanan taraf 3 gün fazla eşya düşürür.', open: true, at: wk, every: 'Haftalık', go: () => ACT.gate({ tab: 'events' }) },
    { id: 'siege', icon: 'siege', name: 'Hisar Kuşatması', desc: 'Klanınla muhafızlara saldır; haftalık klan sıralaması.', open: true, at: wk, every: 'Haftalık · klan', go: () => ACT.gate({ tab: 'events' }), lock: 'siege' },
    { id: 'terr', icon: 'zones', name: 'Bölge hâkimiyeti', desc: 'Bölgelerde kazandığın zaferler ırkına puan yazar; hafta sonunda bölgeler el değiştirir.', open: true, at: wk, every: 'Haftalık', go: () => ACT.diyarMap() },
    { id: 'ruler', icon: 'crown', name: 'Başbuğ seçimi', desc: 'Irkının yeni önderi seçilir; ulufe ve ferman onun elindedir.', open: true, at: wk, every: 'Haftalık', go: () => ACT.otag() },
    { id: 'season', icon: 'arena', name: 'Meydan sezonu', desc: 'Sezon sonunda ligine göre ödül ve unvan alırsın.', open: true, at: seasonEndAt(t), every: `${28} günde bir`, go: () => ACT.gate({ tab: 'pvp' }), lock: 'arena' },
    { id: 'daily', icon: 'quest', name: 'Günlük görevler', desc: 'Günlük görevler ve giriş ödülü yenilenir.', open: true, at: dayEnd, every: 'Her gün 00:00', go: () => ACT.quests() },
    { id: 'weekly', icon: 'quest', name: 'Haftalık görevler', desc: 'Haftalık görevler yenilenir.', open: true, at: wk, every: 'Pazartesi 00:00', go: () => ACT.quests({ tab: 'weekly' }) },
    { id: 'monthly', icon: 'quest', name: 'Aylık görevler', desc: 'Aylık görevler yenilenir.', open: true, at: nextMonthAt(t), every: 'Ayın 1\'i', go: () => ACT.quests({ tab: 'monthly' }) },
  ];
}
const evOpenCount = () => eventList(now()).filter(e => e.open && !['daily', 'weekly', 'monthly'].includes(e.id) && !(e.lock && locked(e.lock))).length;
const EVGO = {};
const DAYN = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
function eventsHtml() {
  const t = now(), L = eventList(t), wd = weekDay(t);
  L.forEach(e => { EVGO[e.id] = e.go; });
  const strip = DAYN.map((n, i) => { const mark = [i >= 5 ? '<i class="ev-dot rift" title="Gök Yarığı"></i>' : '', i === 0 ? '<i class="ev-dot week" title="Haftalık yenilenme, Başbuğ ve bölgeler"></i>' : '', '<i class="ev-dot akin" title="Akın: 4 saatte bir"></i>'].join('');
    return `<div class="ev-day ${i === wd ? 'today' : ''}"><b>${n}</b><span>${mark}</span></div>`; }).join('');
  const rows = L.map(e => { const lk = e.lock && locked(e.lock);
    return `<div class="ev-row ${e.open ? 'on' : ''} ${lk ? 'lock' : ''}">${med(e.icon, e.open ? 'green' : '')}<div class="grow"><b>${e.name}</b> <span class="chip">${e.every}</span><br><span class="mut">${e.desc}</span></div>
      <div class="ev-when">${lk ? `<span class="chip">Kilitli · Sv. ${UNLOCK[e.lock]}</span>` : e.open ? `<b class="up">Açık</b><small>${clockText(e.at - t)} kaldı</small>` : `<b>Kapalı</b><small>${clockText(e.at - t)} sonra</small>`}</div>
      <button class="btn sm ${e.open && !lk ? 'green' : ''}" data-a="evGo" data-id="${e.id}" ${lk ? 'disabled' : ''}>Git</button></div>`; }).join('');
  return `<div class="ev-strip">${strip}</div><p class="mut ev-leg"><i class="ev-dot akin"></i>Akın <i class="ev-dot rift"></i>Gök Yarığı <i class="ev-dot week"></i>Haftalık yenilenme · Saatler sunucu saatidir.</p><div class="ev-list">${rows}</div>`;
}
ACT.evGo = d => { closeWin(); EVGO[d.id]?.(); };
function cal7Html() {
  const n = S.cal.n7.n, done = n >= CAL7.length, ready = cal7Ready(S, now());
  return `<div class="hint"><b>Hoş geldin takvimi:</b> her gün bir ödül, yedi ödülle tamamlanır. Gün kaçırırsan sıfırlanmaz; kaldığın günden devam edersin.</div>
    <div class="cal7">${CAL7.map((drops, i) => `<button class="kc ${i < n ? 'got' : i === n && ready ? 'now' : ''} ${i === CAL7.length - 1 ? 'big' : ''}" data-a="calInfo" data-k="n7" data-i="${i}"><small>${i + 1}. gün</small><span class="kr">${drops.map(dropMini).join('')}</span>${i < n ? '<em>Alındı</em>' : ''}</button>`).join('')}</div>
    ${done ? '<p class="mut">Yedi ödülün hepsini aldın. Aylık takvim her gün yeni bir ödül verir.</p>' : `<div class="row">${med('gift', 'gold')}<div class="grow"><b>${n + 1}. gün ödülü</b><div class="chips">${CAL7[n].map(dropChip).join('')}</div></div><button class="btn green" data-a="calClaim" data-k="n7" ${ready ? '' : 'disabled'}>${ready ? 'Al' : `${clockText(nextDayAt(now()) - now())} sonra`}</button></div>`}`;
}
function cal28Html() {
  const t = now(), i = monthDay(t), got = monthGot(S, t), ready = cal28Ready(S, t);
  return `<div class="row">${med('gift', 'gold')}<div class="grow"><b>Bugün: ${i + 1}. gün</b><div class="chips">${CAL28[i].map(dropChip).join('')}</div></div><button class="btn green" data-a="calClaim" data-k="m28" ${ready ? '' : 'disabled'}>${ready ? 'Al' : 'Alındı'}</button></div>
    <div class="cal28">${CAL28.map((drops, d) => `<button class="kc ${got.includes(d) ? 'got' : d < i ? 'miss' : d === i ? 'now' : ''} ${d % 7 === 6 ? 'big' : ''}" data-a="calInfo" data-k="m28" data-i="${d}"><small>${d + 1}</small><span class="kr">${dropMini(drops[0])}${drops.length > 1 ? `<i>+${drops.length - 1}</i>` : ''}</span></button>`).join('')}</div>
    <p class="mut">Her günün ödülü yalnızca o gün alınır; kaçırılan günün ödülü gelmez. 7., 14., 21. ve 28. günler büyük ödüldür. Takvim ${untilText(monthEndAt(t) - t)} sonra baştan başlar. Bir güne dokun: ödülün tamamını görürsün.</p>`;
}
ACT.calInfo = d => { const T = d.k === 'n7' ? CAL7 : CAL28, i = +d.i; if (T[i]) toast(`${i + 1}. gün: ${T[i].map(dropFull).join(', ')}`); };
ACT.calClaim = async d => { const r = await run('cal.claim', { k: d.k }); if (r) { lootToast(r.loot); redraw(); } };

// ---------- Görevler: Günlük (ui-town.js) + Haftalık ----------
const QUEST_ICON = { win: 'battle', up: 'forge', break: 'shatter', boss: 'boss', arena: 'arena', collect: 'wagon', daily: 'quest' };
const questTabs = () => { const d = QUESTS.filter(q => Math.min(q.need, S.daily.q[q.key] || 0) >= q.need && !S.daily.qdone[q.id]).length + (S.daily.gift ? 0 : 1), w = weeklyReady(S), m = monthlyReady(S); return [{ id: 'daily', label: 'Günlük', small: d ? `${d} ödül hazır` : '00:00’da yenilenir', icon: 'quest' }, { id: 'weekly', label: 'Haftalık', small: w ? `${w} ödül hazır` : 'Pazartesi yenilenir', icon: 'trophy' }, { id: 'monthly', label: 'Aylık', small: m ? `${m} ödül hazır` : 'Ayın 1’inde yenilenir', icon: 'trophy' }]; };
ACT.quests = d => openWin({ title: 'Görevler', tab: d?.tab === 'weekly' || d?.tab === 'monthly' ? d.tab : 'daily', tabs: questTabs(), render: t => (t === 'weekly' ? weeklyHtml() : t === 'monthly' ? monthlyHtml() : dailyQuestsHtml()) });
function weeklyHtml() {
  const done = S.weekly.done || {};
  return questBoard({ list: WEEKLY, prog: q => weeklyProgress(S, q), done: id => !!done[id], claim: 'weeklyClaim', go: 'questGo', noGo: q => q.id === 'daily', icon: q => QUEST_ICON[q.id] || 'quest',
    allDone: WEEKLY.every(q => done[q.id]), allGot: !!done.all, bonusAct: 'weeklyBonus', bonus: WEEKLY_ALL, bonusName: 'Yedi haftalık görevi de bitir', timer: `Pazartesi 00:00 · ${untilText(nextWeekAt(now()) - now())}` });
}
function monthlyHtml() {
  const done = S.monthly?.done || {};
  return questBoard({ list: MONTHLY, prog: q => monthlyProgress(S, q), done: id => !!done[id], claim: 'monthlyClaim', go: 'questGo', noGo: q => q.id === 'daily', icon: q => QUEST_ICON[q.id] || 'quest',
    allDone: MONTHLY.every(q => done[q.id]), allGot: !!done.all, bonusAct: 'monthlyBonus', bonus: MONTHLY_ALL, bonusName: 'Altı aylık görevi de bitir', timer: `Ayın 1'i · ${untilText(nextMonthAt(now()) - now())}` });
}
ACT.monthlyClaim = async d => { const r = await run('monthly.claim', { id: d.id }); if (r) { lootToast(r.loot); redraw(); } };
ACT.monthlyBonus = async () => { const r = await run('monthly.bonus'); if (r) { lootToast(r.loot); redraw(); } };
ACT.weeklyClaim = async d => { const r = await run('weekly.claim', { id: d.id }); if (r) { lootToast(r.loot); redraw(); } };
ACT.weeklyBonus = async () => { const r = await run('weekly.bonus'); if (r) { lootToast(r.loot); redraw(); } };

// ---------- Başarımlar ve unvanlar ----------
const AC = { cat: 'all' };
const ACH_ICON = { anvil: 'forge', mine: 'mine', battle: 'battle', boss: 'boss', arena: 'arena', clan: 'clan', market: 'market', coll: 'book', loyal: 'quest' };
const bonusLine = () => { const b = achBonus(S); return Object.keys(ACH_STAT).map(k => `${ACH_STAT[k]} +${stepPct(Math.min(ACH_CAP_STEPS, b.steps[k]))}`).join(' · '); };
ACT.achs = d => openWin({
  title: 'Başarımlar', top: true, tab: d?.tab === 'titles' ? 'titles' : 'list',
  tabs: [{ id: 'list', label: 'Başarımlar', small: `${ACH.reduce((a, A) => a + achHeld(S, A.id), 0)}/${ACH.reduce((a, A) => a + A.tiers.length, 0)} kademe`, icon: 'trophy' }, { id: 'titles', label: 'Unvan ve Bonus', small: 'Kalıcı güç', icon: 'crown' }],
  render: t => (t === 'titles' ? titlesHtml() : achListHtml()),
});
ACT.titles = () => ACT.achs({ tab: 'titles' });
// P25-a (referans 02_basarimlar): satır = dairesel madalyon (boyalı örs/maden ya da boş altın halka + simge) · ad · unvan ·
// ilerleme çubuğu (sayı çubuğun içinde) · sağda kurdeleli kademe rozeti (held/max). Rozet madalyona binmez (css/p25-a.css .pa-ach).
const ACH_ART = { anvil: 'ors', mine: 'maden' };
function achRow(A) {
  const held = achHeld(S, A.id), max = A.tiers.length, v = achValue(S, A), full = held >= max, goal = A.tiers[Math.min(held, max - 1)];
  return `<div class="pa-ach ${full ? 'full' : ''} ${held ? 'got' : ''}"><span class="pa-md ${ACH_ART[A.cat] ? `art-${ACH_ART[A.cat]}` : ''}" aria-hidden="true">${ACH_ART[A.cat] ? '' : svg(ACH_ICON[A.cat])}</span>
    <div class="pa-ab"><b>${A.name} · <em class="${held ? '' : 'off'}">${A.title}</em></b><small>${full ? 'Bütün kademeler tamamlandı' : A.text(goal)} · kademe başına ${ACH_STAT[A.stat]} +${stepPct(1)}</small>
      <div class="pa-bar"><i style="width:${Math.min(100, 100 * v / goal)}%"></i><span>${fmt(Math.min(v, goal))}/${fmt(goal)}</span></div></div>
    <span class="pa-roz" title="Kademe ${held}/${max}"><b>${held}/${max}</b></span></div>`;
}
function achListHtml() {
  const list = ACH.filter(A => AC.cat === 'all' || A.cat === AC.cat);
  return `<p class="pa-bonus"><b>Kalıcı bonus:</b> ${bonusLine()} <span>(sınır: nitelik başına +${stepPct(ACH_CAP_STEPS)})</span></p>
    <div class="pa-cats">${[['all', 'Tümü'], ...Object.entries(ACH_CATS)].map(([k, n]) => `<button data-a="achCat" data-k="${k}" class="${AC.cat === k ? 'on' : ''}">${n}</button>`).join('')}</div>
    <div class="pa-achs">${list.map(achRow).join('')}</div>`;
}
ACT.achCat = d => { AC.cat = d.k === 'all' || Object.hasOwn(ACH_CATS, d.k) ? d.k : 'all'; redraw(); };
function titlesHtml() {
  const b = achBonus(S), cur0 = S.ach.title, own = ACH.filter(A => achHeld(S, A.id) > 0), rest = ACH.filter(A => achHeld(S, A.id) < 1);
  return `<div class="hint">Kazandığın her başarım kademesi bir niteliğe <b>+${stepPct(1)}</b> ekler. Toplam Bonus her nitelikte <b>en çok +${stepPct(ACH_CAP_STEPS)}</b> olur: sınır dolunca yeni kademeler yalnızca unvan ve ilerleme kazandırır. Bonus bütün partine, bütün savaşlarda uygulanır.</div>
    <div class="kbon">${Object.keys(ACH_STAT).map(k => { const n = Math.min(ACH_CAP_STEPS, b.steps[k]); return `<div><small>${ACH_STAT[k]}</small><b>+${stepPct(n)}</b><span class="mut">sınır +${stepPct(ACH_CAP_STEPS)} · ${b.steps[k]} kademe</span><div class="pbar"><i style="width:${100 * n / ACH_CAP_STEPS}%"></i></div></div>`; }).join('')}</div>
    <h3>Unvanın</h3>
    <p class="mut">Seçtiğin unvan profilinde, oyuncu kartında, sohbette ve sıralamada adının yanında görünür.</p>
    <p>${cur0 && achOf(cur0) ? `Seçili: ${achTag(cur0)} <button class="btn sm" data-a="titleSet" data-id="">Kaldır</button>` : own.length ? 'Henüz unvan seçmedin. Aşağıdan birine dokun.' : 'Henüz unvanın yok. Bir başarımın ilk kademesini tamamlayınca unvanı açılır.'}</p>
    <div class="tgrid">${own.map(A => `<button class="tbtn ${cur0 === A.id ? 'on' : ''}" data-a="titleSet" data-id="${A.id}"><b>${A.title}</b><small>${A.name}</small></button>`).join('')}${rest.map(A => `<button class="tbtn lock" data-a="titleLock" data-id="${A.id}"><b>${A.title}</b><small>${A.text(A.tiers[0])}</small></button>`).join('')}</div>`;
}
hooks.titlesHtml = titlesHtml; // Aşama 5: Karakter penceresinin Unvan sekmesi de aynı görünümü kullanır
ACT.titleSet = async d => { const r = await run('title.set', { id: d.id || null }); if (r) { toast(r.title ? `Unvanın: ${achOf(r.title).title}` : 'Unvan kaldırıldı.'); redraw(); } };
ACT.titleLock = d => { const A = achOf(d.id); if (A) toast(`${A.title}: ${A.text(A.tiers[0])}.`); };

// Profil penceresi (ui-hub.js): seçili unvan ve Unvan düğmesi eklenir
const baseProfile = ACT.profile;
ACT.profile = () => {
  baseProfile();
};
// Profilde adın önündeki [Unvan]: dokununca kazanılmış unvanlar ve "Ünvansız" seçeneği açılır.
// Ünvansız seçilirse unvan hiçbir yerde görünmez; yalnızca kendi profilinde yer tutucu "[Ünvan]" kalır.
ACT.titlePick = () => {
  const cur0 = S.ach?.title || null, own = ACH.filter(A => achHeld(S, A.id) > 0);
  const opt = (id, name, sub) => `<button class="tbtn ${(cur0 || '') === id ? 'on' : ''}" data-a="titlePickSet" data-id="${id}"><b>${name}</b><small>${sub}</small></button>`;
  showModal(`<h2>Unvan seç</h2><div class="in"><p class="mut">Seçtiğin unvan adının önünde <b>[Unvan] Ad</b> biçiminde her yerde görünür: sohbet, sıralama, klan, oyuncu kartı.</p>
    <div class="tgrid">${opt('', 'Ünvansız', 'Unvan gösterilmez')}${own.map(A => opt(A.id, `[${A.title}]`, A.name)).join('')}</div>
    ${own.length ? '' : '<p class="mut">Henüz unvanın yok. Başarımların ilk kademesini tamamladıkça unvanlar açılır.</p>'}
    <div class="mbtns"><button class="btn sm" data-a="titlesMenu">Bütün unvanlar</button><button class="btn" data-a="profile">Geri</button></div></div>`);
};
ACT.titlePickSet = async d => { const r = await run('title.set', { id: d.id || null }); if (r) { hooks.hud(); ACT.profile(); } };
ACT.titlesMenu = () => { closeModal(); ACT.titles(); };

// ---------- Cihaz bildirimleri ----------
// Sunucudan bildirim gönderilmez. Oyunun bildiği zamanlar (enerji, maden, çırak, günlük ve haftalık yenilenme) cihazda
// kurulur: Android paketinde Capacitor LocalNotifications (uygulama kapalıyken de gelir), tarayıcıda Notifications API
// (yalnızca sayfa arka planda açıkken; tarayıcılar kapalı sayfa için zamanlama sunmaz).
const CAPN = (() => { const c = window.Capacitor; return c && c.isNativePlatform?.() && c.isPluginAvailable?.('LocalNotifications') && typeof c.nativePromise === 'function' ? c : null; })();
const LN = 'LocalNotifications', PLAN_IDS = { energy: 7101, mine: 7102, idle: 7103, daily: 7104, week: 7105, farm: 7106, upkeep: 7107 };
// Başka bir sayfanın içine gömülü çerçevede (deneme linki) tarayıcılar bildirim izni vermez: desteklenmiyor sayılır
const FRAMED = (() => { try { return window.top !== window; } catch { return true; } })();
const DV = {
  native: !!CAPN, perm: 'default',
  supported: () => !!CAPN || (!FRAMED && 'Notification' in window),
  async refresh() {
    try { DV.perm = CAPN ? ({ granted: 'granted', denied: 'denied' }[(await CAPN.nativePromise(LN, 'checkPermissions')).display] || 'default') : 'Notification' in window ? Notification.permission : 'denied'; } catch { DV.perm = 'default'; }
    return DV.perm;
  },
  async request() {
    try { DV.perm = CAPN ? ({ granted: 'granted', denied: 'denied' }[(await CAPN.nativePromise(LN, 'requestPermissions')).display] || 'default') : await Notification.requestPermission(); } catch { DV.perm = 'denied'; }
    return DV.perm;
  },
};
// Kurulacak bildirimler: yalnızca gelecekteki, kategorisi açık olanlar
function plan() {
  if (!S || S.notif?.dev !== true) return [];
  const L = x => window.DD_I18N?.tr(x) ?? x; // cihaz bildirimi ekrana metin düğümü olarak düşmez: seçili dile burada çevrilir (i18n.js)
  const t = now(), off = S.notif.off || {}, out = [], put = (k, at) => { if (at > t + 5000 && !off[NOTIF_KIND[k].cat]) out.push({ k, at, id: PLAN_IDS[k], title: L(NOTIF_KIND[k].head), body: L(hypeLine(k, `${k}:${at}`, S.faction).text), go: NOTIF_KIND[k].go }); };
  put('energy', energyFullAt(S)); put('mine', mineFullAt(S));
  put('upkeep', upkeepOf(S, t)?.until || 0); // Bakım (sinks.js) bitince
  const day = nextDayAt(t), week = nextWeekAt(t);
  if (day !== week) put('daily', day + 60000);
  put('week', week + 60000);
  return out;
}
let webTimers = [], planT = null;
async function applyPlan() {
  const P = DV.perm === 'granted' ? plan() : [];
  if (CAPN) {
    try {
      await CAPN.nativePromise(LN, 'cancel', { notifications: Object.values(PLAN_IDS).map(id => ({ id })) });
      if (P.length) await CAPN.nativePromise(LN, 'schedule', { notifications: P.map(n => ({ id: n.id, title: n.title, body: n.body, schedule: { at: new Date(n.at - (now() - Date.now())).toISOString(), allowWhileIdle: true }, extra: { go: n.go } })) });
    } catch { }
    return;
  }
  webTimers.forEach(clearTimeout); webTimers = [];
  if (!document.hidden) return; // sayfa görünürken oyunun kendi zili ve iletileri yeter
  for (const n of P) { const ms = n.at - now(); if (ms < 2 ** 31 - 1) webTimers.push(setTimeout(() => { if (document.hidden) showWeb(n); }, ms)); }
}
async function showWeb(n) {
  const opt = { body: n.body, tag: 'dd-' + n.k, icon: 'img/icons/icon-192.png', data: { go: n.go } };
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg?.showNotification) return void await reg.showNotification(n.title, opt);
    const x = new Notification(n.title, opt); x.onclick = () => { window.focus(); x.close(); jump(n.go); };
  } catch { }
}
const planSoon = () => { clearTimeout(planT); planT = setTimeout(applyPlan, 1500); };
onState(planSoon);
document.addEventListener('visibilitychange', () => { clearTimeout(planT); applyPlan(); });
DV.refresh().then(planSoon);
// Bildirime dokunma: ilgili ekran açılır (tarayıcıda servis çalışanı haber verir, pakette eklenti)
// (kum havuzundaki gömülü çerçevede navigator.serviceWorker'a erişmek hata fırlatabilir: modül yüklenmesini kesmesin)
try { navigator.serviceWorker?.addEventListener?.('message', e => { if (e.data?.dd === 'notif') jump(e.data.go); }); } catch { }
try { CAPN?.addListener?.(LN, 'localNotificationActionPerformed', e => jump(e?.notification?.extra?.go)); } catch { }

// İzin, önce oyunun içinde anlatılır; cihazın izin penceresi yalnızca oyuncu "İzin ver" derse açılır
ACT.devAsk = () => {
  if (!DV.supported()) return toast('Bu cihaz bildirim gösteremiyor.');
  showModal(`<h2>Bildirimler</h2><div class="in kask">
    <p>Oyunda değilken haber verelim mi?</p>
    <ul><li>${ri('energy')} Enerjin tamamen dolunca</li><li>${ri('ore')} Maden deposu dolunca</li><li>${ri('gift')} Günlük görevler ve takvim ödülü yenilenince</li><li>${ri('trophy')} Haftalık görevler yenilenince</li></ul>
    <p class="mut">Bildirimler bu cihazda kurulur; sunucudan gönderilmez. İstediğin kategoriyi Bildirimler → Ayarlar’dan kapatabilirsin.${DV.native ? '' : ' Tarayıcıda bildirim yalnızca oyun arka planda açık dururken gelir.'}</p>
    <div class="mbtns"><button class="btn green" data-a="devYes">İzin ver</button><button class="btn" data-a="devNo">Şimdi değil</button></div></div>`);
};
const backToSettings = () => { if (cur()?.title === 'Bildirimler') redraw(); };
ACT.devYes = async () => {
  closeModal();
  const p = await DV.request(), ok = p === 'granted';
  await run('notif.set', { cat: 'device', on: ok });
  toast(ok ? 'Bildirimler açıldı.' : 'Bildirim izni verilmedi. İstersen cihaz ayarlarından açabilirsin.');
  backToSettings(); planSoon();
};
ACT.devNo = async () => { closeModal(); await run('notif.set', { cat: 'device', on: false }); backToSettings(); planSoon(); };
ACT.devOff = async () => { if (await run('notif.set', { cat: 'device', on: false })) { redraw(); planSoon(); } };
ACT.devTest = async () => {
  const L = x => window.DD_I18N?.tr(x) ?? x, n = { k: 'energy', id: 7199, title: L(NOTIF_KIND.energy.head), body: L(hypeLine('energy', 'test:' + now(), S.faction).text), go: 'gate' };
  if (CAPN) { try { await CAPN.nativePromise(LN, 'schedule', { notifications: [{ id: n.id, title: n.title, body: n.body, schedule: { at: new Date(Date.now() + 3000).toISOString(), allowWhileIdle: true }, extra: { go: n.go } }] }); } catch { } } else await showWeb(n);
  toast('Deneme bildirimi gönderildi.');
};
// Öğretici bittikten (ya da atlandıktan) sonra, daha önce sorulmadıysa bir kez sorulur
async function askAfterTutorial() {
  if (!S || S.notif.dev !== null || !DV.supported()) return false;
  if (await DV.refresh() === 'denied') return false;
  ACT.devAsk();
  return true;
}

// ---------- Öğretici ----------
// Ayrı bir katmanda (#tut) çizilir ve hiçbir dokunuşu engellemez (yalnızca kendi kutusu dokunulabilir): oyuncu
// istediği an başka bir şey yapabilir. Atlama yalnızca açılış kartında sunulur; "Başla"dan sonra atla düğmesi yoktur. Hedef öğenin yeri oyunun mantıksal
// koordinatlarında ölçülür; telefon dik tutulurken (döndürülmüş çizim) de doğru yere düşer.
// Adımın gerçekten tamamlandığına sunucu karar verir (tut.next); ?tut=0 katmanı gizler (otomatik denemeler için).
const TUT_OFF = new URLSearchParams(location.search).get('tut') === '0';
const layer = document.createElement('div');
layer.id = 'tut'; layer.hidden = true;
document.getElementById('game').appendChild(layer);
const TU = { sig: '', busy: false, card: null, mode: '', g: null, el: null, typed: '', tyT: 0, scrolled: '', st: 0, lr: '' };
// Görünür ilk eşleşme (sehir2'de eski .dock gizli, yerine .s2-dock düğmeleri görünür); yoksa ilk eşleşme
const q1 = s => { const l = document.querySelectorAll(s); for (const e of l) if (e.getClientRects().length) return e; return l[0] || null; };
const vis = el => !!el && el.getClientRects().length > 0;
// Hedef kaydırılan bir kabın (ör. Parti'nin sağ sütunu) kenarından taşıyorsa ekranda olsa da dokunuş kaba düşer: önce görünür alana kaydırılır
const clipped = el => { const r = el.getBoundingClientRect(); for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) { if (!/(auto|scroll|hidden)/.test(getComputedStyle(a).overflowY)) continue; const b = a.getBoundingClientRect(); if (r.top < b.top - 1 || r.bottom > b.bottom + 1) return true; } return false; };
const lrect = el => { const r = el.getBoundingClientRect(); return view.rot ? { x: r.top, y: window.innerWidth - r.right, w: r.height, h: r.width } : { x: r.left, y: r.top, w: r.width, h: r.height }; };
const Z1 = ZONES[0].name;
// Anlatıcılar (özgün, sadeleştirilmiş çizimler): Elentha'da örgülü saçlı izci Prenses Lira, Kragmir'de savaş boyalı, kemik takılı kadın şaman
const NARR = {
  sancak: { k: 'lira', name: 'Prenses Lira', svg: '<svg viewBox="0 0 48 48"><rect width="48" height="48" rx="6" fill="#16264a"/><path d="M6 48c2-12 10-16 18-16s16 4 18 16z" fill="#3e4a2c"/><path d="M14 40h20" stroke="#5a3a22" stroke-width="2"/><path d="M33 36l5 4" stroke="#8a5a14" stroke-width="2"/><path d="M13 22c0-9 5-14 11-14s11 5 11 14c0 3-1 9-3 12H16c-2-3-3-9-3-12z" fill="#5a3a22"/><ellipse cx="24" cy="23" rx="8" ry="10" fill="#f0c9a4"/><path d="M13 18c2-9 8-12 11-12s9 3 11 12l-3 1c-1-5-5-7-8-7s-7 2-8 7z" fill="#7a3a1e"/><path d="M34 20c2 5 2 10 0 15" stroke="#7a3a1e" stroke-width="3" stroke-dasharray="2 1" fill="none"/><circle cx="20.5" cy="23" r="1.2" fill="#2a3a5a"/><circle cx="27.5" cy="23" r="1.2" fill="#2a3a5a"/><path d="M21 29q3 2 6 0" stroke="#a0463a" fill="none" stroke-width="1.4"/><circle cx="24" cy="38" r="3" fill="#6fb8ff" stroke="#fff4c2"/></svg>' },
  ocak: { k: 'yashka', name: 'Şaman Yashka', svg: '<svg viewBox="0 0 48 48"><rect width="48" height="48" rx="6" fill="#3a0f10"/><path d="M5 48c2-12 10-16 19-16s17 4 19 16z" fill="#3a3436"/><path d="M8 36l4-5 2 6M40 36l-4-5-2 6" fill="#e8dcc0"/><path d="M12 20c0-9 5-15 12-15s12 6 12 15c0 4-2 10-4 13H16c-2-3-4-9-4-13z" fill="#1c1416"/><ellipse cx="24" cy="23" rx="8.5" ry="10" fill="#6f8f58"/><path d="M15 21l-4-6M33 21l4-6" stroke="#e8dcc0" stroke-width="2.4" stroke-linecap="round"/><path d="M16.5 22h5M26.5 22h5" stroke="#c0281c" stroke-width="2.6"/><circle cx="19" cy="22.5" r="1.1" fill="#ffd45a"/><circle cx="29" cy="22.5" r="1.1" fill="#ffd45a"/><path d="M20 30l1 3 1.5-3M26 30l1.5 3 1-3" fill="#f4ecd8"/><path d="M18 27h12" stroke="#e8dcc0" stroke-width="1.6" stroke-dasharray="2 2"/><path d="M12 12l-3-6M36 12l3-6" stroke="#e8dcc0" stroke-width="3" stroke-linecap="round"/></svg>' },
};
const nPor = n => { const u = npcYuz(n.k); return u ? `<img class="npc-yuz" src="${u}" alt="" draggable="false">` : n.svg; }; // 23 Kas: GPT G4 boyalı yüz (yüklenmediyse eski çizim)
const onHub = () => !hud.hidden && $('#win').hidden && $('#modal').hidden;
// Ana üsteki hedef bir pencerenin arkasında kalıyorsa önce pencerenin kapatma düğmesi gösterilir
const CLOSE_WIN = '#win header [data-a="closeWin"]';
const hubOr = (sel, text, away) => (onHub() && vis(q1(sel)) ? { text, target: sel } : $('#modal').hidden && !$('#win').hidden && vis(q1(CLOSE_WIN)) ? { text: away, target: CLOSE_WIN } : { text: away });
const withBtn = (g, btn) => (g.target === CLOSE_WIN ? g : { ...g, btn }); // pencere kapanınca Devam/Bitir gelir
// P28: sehir2 başkentinde Kapı/Meydan etiketi yok; savaşa sağ alttaki SAVAŞ düğmesi (.s2-savas) → Sefer götürür. Savaş seçim
// modalı açıkken Sefer kartı gösterilir. Eski HUD/3B başkentte (?sehir=0) Kapı etiketi yedek kalır.
const SV_GO = '#modal [data-a="svGo"]', PT_CARSI = '#modal [data-a="gateCarsi"]';
/** Savaşa çıkış ipucu: pre = adıma özgü giriş ("… sağ alttaki " ile biter); text/away = eski Kapı etiketi metinleri. */
const toGate = (pre, text, away) => (vis(q1(SV_GO)) ? { text: '<b>Sefer</b>’i seç: bölgeler ve aşamalar orada.', target: SV_GO }
  : !vis(q1('.blabel[data-id="gate"]')) && q1('.s2-savas') ? hubOr('.s2-savas', `${pre}<b>SAVAŞ</b> düğmesine dokun, <b>Sefer</b>’i seç.`, 'Ana ekrana dön: sağ alttaki SAVAŞ düğmesine dokun, Sefer’i seç.')
  : hubOr('.blabel[data-id="gate"]', text, away));
// Bulunulan adım ve ekrana göre gösterilecek ipucu: { text, target?, btn?, top?, strip? }
// strip: ince şerit — 'battle' savaşta altta (düğmelerle yetenekler arasında), 'modal' açık pencerenin dışında
function guide() {
  const step = TUT_STEPS[S.tut.s], title = cur()?.title, inBattle = !$('#battleUI').hidden, result = vis(q1('#modal [data-a="hub"]'));
  // Savaş çubuğundaki ilk kullanılabilir yetenek ve iksir (sıra oyuncuda değilken düğmeler kapalıdır, hedef görünmez)
  const SK = '#skills .skill.act:not([disabled])', POTB = '#skills .skill.pot:not([disabled])';
  const forest = ormanOn(); // P26 K4: açılış ormanı (2B, orman.js) yalnız hikâye ve ilk savaş; savaş Yashka'nın sahnesinden açılır
  if (step === 'battle') {
    if (inBattle && BT.auto) return { text: 'Otomatik açık: kendin oynamak için sağ alttaki <b>OTO</b>’yu kapat.', target: '#bauto', strip: 'battle' };
    if (!inBattle) TU.fTur = 0;
    if (inBattle && forest) { // P28 M5: tek Kül Kurdu, tek dalga; tur = oyuncunun sırasının kaçıncı kez geldiği (temel saldırı, ilk yetenek, bitiriş)
      const BAS = '#skills .skill.basic:not([disabled])', sira = vis(q1(BAS));
      if (sira && !TU.fOn) TU.fTur = (TU.fTur | 0) + 1;
      TU.fOn = sira; const tur = Math.max(1, TU.fTur | 0);
      if (tur <= 1) return vis(q1(BAS)) ? { text: '<b>1. tur · Temel saldırı</b>: soldaki ilk yuvaya dokun, sonra Kül Kurdu’na.', target: BAS, strip: 'battle' } : { text: '<b>1. tur · Temel saldırı</b>: sıran gelince temel saldırıyı seç.', target: '#skills', strip: 'battle' };
      if (tur === 2) return vis(q1(SK)) ? { text: '<b>2. tur · İlk yetenek</b>: yanındaki yetenek yuvasına dokun, sonra hedefe. Mavi rozet mana bedelidir.', target: SK, strip: 'battle' }
        : vis(q1(POTB)) ? { text: '<b>2. tur · İlk yetenek</b>: yetenek yuvaların seviye atladıkça dolar. Bu turda sağdaki <b>iksiri</b> dene; içmek turunu bitirmez.', target: POTB, strip: 'battle' } : { text: '<b>2. tur</b>: sıran gelince temel saldırıyla devam et.', target: '#skills', strip: 'battle' };
      return { text: '<b>3. tur · Bitiriş</b>: Kül Kurdu’nu yere ser!', target: '#skills', strip: 'battle' };
    }
    if (inBattle) return vis(q1(SK)) ? { text: 'Alttaki <b>savaş çubuğu</b>: solda temel saldırı, yanında yetenek yuvaların. Bir yeteneğe dokun, sonra bir düşmana.', target: SK, strip: 'battle' } : { text: 'Sıra sendeyken alttaki çubuktan bir yetenek seç, sonra bir düşmana dokun.', target: '#skills', strip: 'battle' };
    if (S.stats.wins >= 1 && forest && result) return { text: 'İlk zafer! Ganimetin çantana girdi. <b>Kemikli Koru’ya dön</b>: Yashka seni bekliyor.', strip: 'modal' }; // Sahne 3 ormanda (adımı orman.js ilerletir)
    if (S.stats.wins >= 1 && !forest) return { text: result ? 'İlk zafer! Savaşın ganimeti (akçe ve düşen eşyalar) çantana girer; deneyim seviyeni yükseltir.' : 'İlk zaferini kazandın. Savaşlardan akçe, deneyim ve eşya kazanırsın; ganimet çantana girer.', btn: 'Devam', ...(result ? { strip: 'modal' } : { top: true }) };
    if (result) return { text: 'Bu kez olmadı. Yeniden dene; zorlanırsan önce iksir iç.', strip: 'modal' };
    if (vis(q1('[data-a="vsStart"]'))) return { text: 'Solda sen, sağda düşmanlar. Hazırsan savaşı başlat.', target: '[data-a="vsStart"]', side: 'left' }; // N3: balon düşman kartını örtmez (düğmenin solunda, dalga satırında)
    if (title === 'Kapı') return vis(q1('[data-a="stage"][data-id="1-1"]')) ? { text: 'İlk aşamaya dokun.', target: '[data-a="stage"][data-id="1-1"]' } : { text: 'Bölgeler sekmesine geç.', target: '.tabs [data-id="zones"]' };
    return toGate('Savaşa çıkmak için sağ alttaki ', 'Savaşa Kapı’dan çıkılır. Ortadaki <b>Kapı</b>’ya dokun.', 'Savaşa Kapı’dan çıkılır: ana üsse dön ve Kapı’ya dokun.');
  }
  if (step === 'bar') { // savaş çubuğu: 6 yetenek yuvası, mana, iksirler; bir savaşta yetenek ve iksir kullanılır
    const f = S.tut.f || {}, potsLeft = (S.pots?.hp | 0) + (S.pots?.mp | 0), done = !!(f.pot || !potsLeft), next = `1-${Math.min(TUT_HUNT, S.stats.wins + 1)}`;
    if (inBattle) {
      const left = !(BT.pot || f.pot) && potsLeft;
      if (BT.auto && (left || !BT.sk)) return { text: 'Bu savaşı kendin oyna: <b>OTO</b>’yu kapat, çubuğu birlikte kullanalım.', target: '#bauto', strip: 'battle' };
      if (!BT.pot && !f.pot && potsLeft) return { text: vis(q1(POTB)) ? `<b>Önce iksir!</b> Sağdaki yanıp sönen Can ya da Mana iksirine dokun; iksir içmeden saldıramaz, savaştan çıkamazsın. İçmek turunu bitirmez; savaş başına her türden en çok ${POT.cap} tane.` : 'Sıran gelince önce sağdaki <b>iksirlerden</b> birine dokun: iksir içmeden saldıramazsın.', target: vis(q1(POTB)) ? POTB : undefined, strip: 'battle' };
      // P28 doğrulama: düşük seviyede hiç açık yetenek yuvası yoksa (#skills .skill.act yok) "yeteneğe dokun" istenemez; temel saldırıya yönlendir
      if (!BT.sk && !f.sk && !q1('#skills .skill.act')) return { text: 'Yetenek yuvaların seviye atladıkça açılır. Şimdilik soldaki <b>temel saldırıyla</b> savaşı bitir.', target: vis(q1('#skills .skill.basic:not([disabled])')) ? '#skills .skill.basic:not([disabled])' : undefined, strip: 'battle' };
      if (!BT.sk && !f.sk) return { text: vis(q1(SK)) ? '<b>Yetenek</b>: yuvalardan birine dokun, sonra hedefine (düşmana; şifa ve güçlendirmede kendine ya da yuvaya yeniden). Mavi rozet <b>mana</b> bedelidir; mana (mavi çubuk) her turunun başında biraz dolar.' : 'Sıranı bekle; sonra bir <b>yetenek</b> yuvasına dokun.', target: vis(q1(SK)) ? SK : undefined, strip: 'battle' };
      return { text: 'Harika! Kilitli yuvalar seviye atladıkça açılır. Şimdi savaşı bitir.', strip: 'battle' };
    }
    if (done) return { text: `Savaş çubuğunu öğrendin: <b>6 yetenek yuvası</b> seviye atladıkça dolar, iksirleri <b>dükkânlardan</b> alırsın.`, btn: 'Devam', ...(result ? { strip: 'modal' } : { top: true }) };
    if (result) return { text: 'Sıradaki savaşta alttaki <b>savaş çubuğunu</b> birlikte kullanalım: önce bir <b>iksir</b> iç.', strip: 'modal' };
    if (vis(q1('[data-a="vsStart"]'))) return { text: 'Bu savaşta alttaki çubuğu kendin kullan: <b>önce bir iksir iç</b>, sonra saldır. Hazırsan başlat.', target: '[data-a="vsStart"]' };
    if (title === 'Kapı') return vis(q1(`[data-a="stage"][data-id="${next}"]`)) ? { text: `Sıradaki aşamaya (${next.replace('-', '.')}) dokun.`, target: `[data-a="stage"][data-id="${next}"]` } : { text: 'Bölgeler sekmesine geç.', target: '.tabs [data-id="zones"]' };
    return toGate('Savaşta altta bir <b>savaş çubuğu</b> var: temel saldırı, 6 yetenek yuvası, Can ve Mana iksiri. Denemek için sağ alttaki ', 'Savaşta altta bir <b>savaş çubuğu</b> var: temel saldırı, 6 yetenek yuvası, Can ve Mana iksiri. Denemek için <b>Kapı</b>’ya dokun.', 'Ana üsse dön ve Kapı’ya dokun: savaş çubuğunu deneyelim.');
  }
  // Hedefler çalışırken aranır (sürüm 13: ana üste Yemin Pazarı'na Kapı'nın yanındaki Çarşı geçidi götürür; eski kayıtta sol sütun düğmesi)
  const pick = (...sels) => sels.find(x => vis(q1(x))) || sels[0];
  // P28: Çarşı etiketi kalktı; Yemin Pazarı'na Işınlanma Kapısı (portal etiketi → kart) götürür. Eski başkentte Çarşı geçidi/sol düğme yedek.
  const inCarsi = placeNow() === 'carsi', toCarsi = () => (vis(q1(PT_CARSI)) ? { text: '<b>Yemin Pazarı</b>’nı seç.', target: PT_CARSI }
    : !vis(q1('.blabel[data-id="carsi"]')) && q1('.blabel[data-id="portal"]') ? hubOr('.blabel[data-id="portal"]', '<b>Işınlanma Kapısı</b>’na dokun, <b>Yemin Pazarı</b>’nı seç.', 'Ana ekrana dön: Işınlanma Kapısı’na dokun, Yemin Pazarı’nı seç.')
    : vis(q1('.blabel[data-id="carsi"]')) || !q1('.lrail .travel')
    ? hubOr('.blabel[data-id="carsi"]', '<b>Yemin Pazarı</b>’na geç: Kapı’nın yanındaki <b>Çarşı</b> geçidine dokun.', 'Ana ekrana dön ve Çarşı geçidinden Yemin Pazarı’na geç.')
    : hubOr('.lrail .travel', '<b>Yemin Pazarı</b>’na geç: soldaki düğmeye dokun.', 'Ana ekrana dön ve Yemin Pazarı’na geç.'));
  if (step === 'hunt') {
    const w = S.stats.wins, next = `1-${Math.min(TUT_HUNT, w + 1)}`;
    if (inBattle) return { text: `Kes onları! Zafer ${w}/${TUT_HUNT}. Her savaş akçe ve deneyim getirir.`, target: '#skills', strip: 'battle' };
    if (w >= TUT_HUNT) return { text: `Eline ısındın: ${TUT_HUNT} zafer, cebinde akçe. Seviye de atladın.`, btn: 'Devam', ...(result ? { strip: 'modal' } : { top: true }) };
    if (result) return { text: `Güzel! Zafer ${w}/${TUT_HUNT}. Sıradaki yaratıklara geçelim.`, strip: 'modal' };
    if (vis(q1('[data-a="vsStart"]'))) return { text: 'Hazırsan savaşı başlat.', target: '[data-a="vsStart"]' };
    if (title === 'Kapı') return vis(q1(`[data-a="stage"][data-id="${next}"]`)) ? { text: `Sıradaki aşamaya (${next.replace('-', '.')}) dokun.`, target: `[data-a="stage"][data-id="${next}"]` } : { text: 'Bölgeler sekmesine geç.', target: '.tabs [data-id="zones"]' };
    if (inCarsi && !q1('.s2-savas')) return toCarsi();
    return toGate(`Birkaç yaratık daha kes (${w}/${TUT_HUNT}): sağ alttaki `, `Birkaç yaratık daha kes (${w}/${TUT_HUNT}): ortadaki <b>Kapı</b>’ya dokun.`, 'Ana üsse dön ve Kapı’ya dokun.');
  }
  if (step === 'carsi') return { text: 'Seni şimdi iki ırkın buluştuğu tarafsız pazar kasabası <b>Yemin Pazarı</b>’na bırakıyorum. Tüccarlar, gezginler ve yardım bekleyenler orada.', btn: 'Yemin Pazarı’na git', top: true };
  if (step === 'merchant') {
    if (S.tut.f?.buy) return { text: 'İlk alışverişin tamam! Kestiğin yaratıkların akçesi işe yaradı.', btn: 'Devam', top: true };
    if (title === 'Tüccar Halvor' || vis(q1('#page [data-a="npcBuy"]'))) return { text: 'İlk akçenle sınıfına uygun yeni bir silah al.', target: '#page [data-a="npcBuy"]:not([disabled])' };
    if (!inCarsi) return toCarsi();
    return hubOr(pick('.blabel[data-id="merchant"]', '.blabel[data-id="tuccar"]'), 'Tezgâhın başında duran <b>Tüccar Halvor</b>’a dokun.', 'Pencereyi kapat ve Tüccar Halvor’a dokun.');
  }
  if (step === 'equip') {
    const it = S.items.find(x => x.id === S.tut.f?.buyId), name = it ? itemBase(it.b).name : 'Yeni silahın';
    if (!tutItemHeld(S) || Object.values(S.heroes).some(h => Object.values(h.eq).includes(S.tut.f?.buyId))) return { text: 'Yeni silahın elinde! Kuşanılan her eşya karakterini güçlendirir.', btn: 'Devam', top: true };
    if (title === 'Karakter') {
      const eqSel = `#page [data-a="equip"][data-id="${S.tut.f.buyId}"]:not([disabled])`;
      if (vis(q1(eqSel))) return { text: `${name}: “Kuşan”a dokun.`, target: eqSel };
      if (!vis(q1('.ds[data-s="wr"]'))) return { text: 'Ekipman sekmesine geç.', target: '.tabs [data-id="eq"]' };
      return { text: 'Karakterin <b>Sağ El</b> yuvasına dokun.', target: '.ds[data-s="wr"]' };
    }
    return hubOr('.s2-dock [data-a="party"], .dock [data-a="party"]', `<b>${name}</b> çantanda. Kuşanmak için <b>Karakter</b>’i aç.`, `Ana ekranda Karakter’i açıp ${name} kuşan.`);
  }
  const goWorm = vis(q1('#modal [data-a="npcWorm"]')) ? { text: 'Bran kardeşi için yalvarıyor. <b>Göreve çık</b>’a dokun.', target: '#modal [data-a="npcWorm"]', strip: 'modal' } : null; // Bran'ın sözü açık: şerit, sözü örtmesin
  if (step === 'child') {
    if (goWorm) return goWorm;
    if (!inCarsi) return toCarsi();
    return hubOr('.blabel[data-id="child"]', 'Biri sana sesleniyor! Koşarak gelen <b>Küçük Bran</b>’ya dokun.', 'Pencereyi kapat: Küçük Bran sana sesleniyor.');
  }
  if (step === 'worm') {
    if (inBattle) return { text: '<b>Dev Solucan</b>’ı yen! Zayıflığı ateş; yarı canında yeniden fırlar.', target: '#skills', strip: 'battle' };
    if (result) return S.tut.f?.worm ? { text: 'Solucan yere serildi!', strip: 'modal' } : { text: 'Solucan seni geri püskürttü. Yeniden dene!', strip: 'modal' };
    if (vis(q1('[data-a="vsStart"]'))) return { text: 'Nessa’yı kurtarmak için savaşı başlat.', target: '[data-a="vsStart"]' };
    if (goWorm) return goWorm;
    if (!inCarsi) return toCarsi();
    return hubOr('.blabel[data-id="child"]', 'Bran seni bekliyor: ona dokun ve göreve çık.', 'Pencereyi kapat ve Bran’a dokun.');
  }
  if (step === 'rescue') {
    if (!inCarsi) return toCarsi();
    return withBtn(hubOr('.blabel[data-id="child"]', `Bran ve Nessa sana teşekkür ediyor; Bran’a dokunup konuşabilirsin. <b>Sıradaki görevin:</b> SAVAŞ düğmesinden Sefer’e çıkıp ${Z1} bölgesinde yaratık kesmeye devam et. Önce yeteneklerine bir bakalım.`, 'Bran ve Nessa sana teşekkür ediyor.'), 'Devam');
  }
  if (step === 'skills') {
    if (title === 'Karakter' && vis(q1('.tabs [data-id="skill"].on'))) return { text: 'Karakterin savaşa temel saldırı, <b>6 aktif</b> ve 1 pasif yetenekle girer; altı temel yetenek 1, 2, 4, 6, 9 ve 12. seviyede açılır. 10. seviyeden sonra gelen puanları ağaçlara dağıtır, güçlü yetenekleri yuvalara koyarsın.', btn: 'Devam', top: true };
    if (title === 'Karakter') return { text: 'Şimdi <b>Yetenek</b> sekmesine dokun.', target: '.tabs [data-id="skill"]' };
    return hubOr('.s2-dock [data-a="party"], .dock [data-a="party"]', 'Yeteneklere bakalım: <b>Karakter</b>’i aç.', 'Yetenekler Karakter ekranındadır.');
  }
  if (step === 'anvil') return { ...hubOr('.blabel[data-id="anvil"]', `<b>Örs</b> ${UNLOCK.anvil}. seviyede açılır. Eşyana artı basarsın: eşyan asla yanmaz; yüksek artılarda başarısızlık bir artı düşürebilir.`, `Örs ${UNLOCK.anvil}. seviyede açılır: eşyana artı basarsın, eşya asla yanmaz.`), btn: 'Devam' };
  if (step === 'quests') {
    if (S.tut.f?.q) return { text: 'Görevler her gün 00:00’da, haftalık görevler pazartesi yenilenir. Sağ üstteki Takvim de her gün bir ödül verir.', btn: 'Devam', top: true };
    if (title === 'Görevler') return vis(q1('#page [data-a="gift"]')) ? { text: 'Günlük giriş ödülünü al.', target: '#page [data-a="gift"]' } : { text: 'Günlük sekmesine geç.', target: '.tabs [data-id="daily"]' };
    return hubOr('.s2-dock [data-a="quests"], .dock [data-a="quests"]', '<b>Görevler</b>’i aç: bugünün giriş ödülü seni bekliyor.', 'Ana üste Görevler’i aç ve giriş ödülünü al.');
  }
  return withBtn(hubOr('#chatbar', 'Burası <b>sohbet</b>: genel kanala yaz, klan kur, oyunculara özel mesaj at. Artık hazırsın.', 'Ana üsteki sohbet şeridinden diğer oyunculara yazabilirsin. Artık hazırsın.'), 'Bitir');
}
// ---- Anlatıcı paneli: harf harf yazılır, dokununca tamamlanır ----
// Görünen metin (.ttxt) sözlük katmanınca çevrilir ve yerini tutar (kutu yazılırken büyüyüp kaymaz); üstündeki
// kopya (.ttype, translate="no") harf harf doldurulur, bitince kaldırılır.
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const typeStop = () => { clearInterval(TU.tyT); TU.tyT = 0; const p = layer.querySelector('.ttxt'); if (p) p.style.visibility = ''; layer.querySelector('.ttype')?.remove(); };
const typing = () => !!TU.tyT || !!layer.querySelector('.ttype');
function typeStart(key) {
  const p = layer.querySelector('.ttxt');
  if (!p) return;
  if (key === TU.typed || reduced() || document.documentElement.classList.contains('gfx-low')) { TU.typed = key; return; }
  TU.typed = key; clearInterval(TU.tyT); p.style.visibility = 'hidden';
  TU.tyT = setTimeout(() => { // sözlük katmanı metni çevirsin, sonra kopyala
    if (!p.isConnected) return;
    const c = p.cloneNode(true); c.className = 'ttype'; c.setAttribute('translate', 'no'); c.style.visibility = 'visible';
    const nodes = [], w = document.createTreeWalker(c, 4); for (let n; (n = w.nextNode());) { nodes.push([n, n.data]); n.data = ''; }
    p.after(c);
    let i = 0, k = 0; const total = nodes.reduce((a, [, s]) => a + s.length, 0);
    TU.tyT = setInterval(() => {
      k += 2;
      if (k >= total) return typeStop();
      for (; i < nodes.length; i++) { const [n, s] = nodes[i], before = nodes.slice(0, i).reduce((a, [, t]) => a + t.length, 0); if (k < before + s.length) { n.data = s.slice(0, k - before); break; } n.data = s; }
      i = 0;
    }, 24);
  }, 30);
}
const ARROW = '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M2 12h16V5l12 11-12 11v-7H2z"/></svg>';
function skel() {
  if (TU.mode === 'guide') return;
  typeStop(); TU.mode = 'guide'; TU.typed = ''; TU.sig = '';
  layer.innerHTML = `<div class="tblk"></div><div class="tblk"></div><div class="tblk"></div><div class="tblk"></div><div class="tdim"></div><div class="thole" hidden></div><div class="tpulse" hidden></div><div class="tring" hidden></div><div class="tarrow" hidden><i>${ARROW}</i></div><div class="tbub"></div>`;
}
function setCard(sig, html) { if (TU.sig === sig) return; typeStop(); TU.mode = 'card'; TU.sig = sig; layer.innerHTML = html; }
function tutTick() {
  const story = !!S && tutActive(S) && TUT_STEPS[S.tut.s] === 'story' && !TU.card;
  // P26 K4: açılış hikâyesi ve ilk savaşın ganimeti 2B orman sahnesinde (orman.js) anlatılır; sahne en üstteyken katman gizli
  const on = !!S && !TUT_OFF && !document.getElementById('loading') && (tutActive(S) || !!TU.card) && !story && !ormanSahne();
  if (!on) { if (!layer.hidden) { typeStop(); layer.hidden = true; layer.innerHTML = ''; TU.sig = ''; TU.mode = ''; TU.g = null; } return; }
  layer.hidden = false;
  // Kart: kurtarma illüstrasyonu ve bitiş kutlaması (ortada, arkası karartılmış)
  if (TUT_STEPS[S.tut.s] === 'worm' && S.tut.f?.worm && onHub()) return setCard('card:rescue', rescueCard()); // Dev Solucan yenildi
  if (TU.card) return setCard('card:done', `<div class="tscrim"></div><div class="tcard tdone"><h2>Tebrikler</h2><div class="tin"><p><b>Tebrikler, öğreticiyi tamamladın.</b></p><p>${capitalOf(S.faction)} ve Yemin Pazarı artık senin. Hediyen çantanda:</p><div class="chips">${TU.card.loot.map(lootChip).join('')}</div><p class="tnext"><b>Sıradaki görevin:</b> SAVAŞ düğmesinden Sefer’e çıkıp ${Z1} bölgesinin aşamalarını geç ve Boss’una ulaş. Görevler ekranı her gün yeni ödüller verir.</p><div class="tb"><button class="btn red" data-t="close">Maceraya devam</button></div></div></div>`);
  // Rehber: anlatıcı paneli + hedefin çevresi delikli karartma, parlak çerçeve, nabız halkası ve hedefe dönük ok.
  // "Başla"dan sonra atla düğmesi yoktur (kullanıcı kararı).
  skel();
  let g = guide();
  // Bilgi adımı (Devam) açık bir pencerenin (ör. tüccarın sözü) üstüne binmez: pencere kapanana dek şerit olarak bekler
  if (g.btn && !g.strip && vis(q1('#modal .box'))) g = { text: `${g.text} <small class="twait">Pencereyi kapatınca devam edelim.</small>`, strip: 'modal' };
  TU.g = g;
  const sig = `${S.tut.s}|${g.text}|${g.btn || ''}|${g.strip || ''}`;
  if (sig !== TU.sig) {
    TU.sig = sig; TU.el = null; TU.scrolled = '';
    const n = ormanOn() ? NARR.ocak : NARR[S.faction] || NARR.sancak, bub = layer.querySelector('.tbub'), total = TUT_STEPS.length - 1; // P26 K4: ormanda rehber Şaman Yashka
    bub.className = `tbub ${g.strip ? 'strip' : ''}`;
    bub.innerHTML = `<div class="tpor">${nPor(n)}</div><div class="tbody"><div class="thead"><b class="tname">${n.name}</b><span class="tprog"><small>Adım ${S.tut.s}/${total}</small><i><b style="width:${Math.round(S.tut.s / total * 100)}%"></b></i></span></div><div class="tline"><p class="ttxt">${g.text}</p></div>${g.btn ? `<div class="tb"><button class="tgo" data-t="next"><span>${g.btn}</span><i aria-hidden="true">›</i></button></div>` : ''}</div>`;
    bub.classList.remove('tin-anim'); void bub.offsetWidth; bub.classList.add('tin-anim');
    typeStart(`${S.tut.s}|${g.text}`);
  }
  const go = layer.querySelector('[data-t="next"]'); if (go) go.disabled = TU.busy;
  place();
}
// Yerleşim her karede güncellenir (boyut değişimi, kaydırma, kamera): halka hedefin üstünde; kutu hedefin altında,
// üstünde ya da yanında ve ekranın içinde; hedef yoksa üstte ortada. Savaşta/açık penceredeki şerit hiçbir şeyi örtmez.
function place() {
  const g = TU.g, bub = layer.querySelector('.tbub');
  if (TU.mode !== 'guide' || !g || !bub) return;
  if (g.target && !(TU.el && TU.el.isConnected && TU.el.matches(g.target) && vis(TU.el))) { TU.el = q1(g.target); TU.st = 0; TU.lr = ''; }
  const el = g.target ? TU.el : null;
  const W = view.w, H = view.h, pad = 6;
  let R = vis(el) ? lrect(el) : null;
  // yeni hedef ancak yeri birkaç kare oturunca gösterilir (3B etiketler ilk karede köşede durur, çerçeve oradan uçmasın)
  if (R && TU.st < 3) { const k = `${Math.round(R.x)},${Math.round(R.y)},${Math.round(R.w)}`; TU.st = k === TU.lr ? TU.st + 1 : 0; TU.lr = k; if (TU.st < 3) R = null; }
  if (R && (R.x < 0 || R.y < 0 || R.x + R.w > W || R.y + R.h > H || clipped(el)) && TU.scrolled !== TU.sig) { TU.scrolled = TU.sig; el.scrollIntoView({ block: 'nearest', inline: 'nearest' }); R = lrect(el); } // ekran dışındaki hedef görünür alana getirilir
  if (R && !(R.x < W && R.y < H && R.x + R.w > 0 && R.y + R.h > 0 && R.w > 0)) R = null;
  const css = (e, v) => { if (e._css !== v || !e.style.cssText) { e._css = v; e.style.cssText = v; } }; // tarayıcının cssText'i yazılan metinden farklı biçimlenir: son yazılanla karşılaştır (her karede yeniden yazma)
  const [hole, ring, pulse, arrow, dim] = ['.thole', '.tring', '.tpulse', '.tarrow', '.tdim'].map(s => layer.querySelector(s));
  const blk = layer.querySelectorAll('.tblk');
  const setB = (i, l, t, w, h) => css(blk[i], w > 0 && h > 0 ? `left:${l}px;top:${t}px;width:${w}px;height:${h}px` : 'display:none');
  const m = 5, F = R && { x: R.x - m, y: R.y - m, w: R.w + 2 * m, h: R.h + 2 * m };
  // Dokunma engeli: hedefin etrafı dolu, hedef açık; hedefsiz bilgi adımında her yer kapalı; şeritte serbest.
  if (!g.strip && F) { const x0 = Math.max(0, F.x), y0 = Math.max(0, F.y), x1 = Math.min(W, F.x + F.w), y1 = Math.min(H, F.y + F.h); setB(0, 0, 0, W, y0); setB(1, 0, y1, W, H - y1); setB(2, 0, y0, x0, y1 - y0); setB(3, x1, y0, W - x1, y1 - y0); }
  else if (!g.strip && g.btn) { setB(0, 0, 0, W, H); for (let i = 1; i < 4; i++) setB(i, 0, 0, 0, 0); }
  else for (let i = 0; i < 4; i++) setB(i, 0, 0, 0, 0);
  dim.classList.toggle('on', !g.strip && !F && !!g.btn);
  const rad = F ? Math.min(18, Math.max(8, Math.min(F.w, F.h) / 2)) : 0, box = F ? `left:${F.x}px;top:${F.y}px;width:${F.w}px;height:${F.h}px;border-radius:${rad}px` : '';
  hole.hidden = !F || !!g.strip; ring.hidden = pulse.hidden = !F;
  if (F) { css(hole, box); css(ring, box); css(pulse, box); }
  let x, y;
  const bw = bub.offsetWidth, bh = bub.offsetHeight, rbox = s => { const e = q1(s); return vis(e) ? lrect(e) : null; };
  if (g.strip === 'battle') { // savaş (19 Kas düzeni): soldaki dikey yetenek çubuğuyla sağ alttaki hız/OTO düğmelerinin arası, altta
    const a = rbox('#skills'), b = rbox('#bctl2'), x0 = (a ? a.x + a.w : 0) + 8, x1 = (b ? b.x : W) - 8;
    const mw = `${Math.max(200, x1 - x0)}px`; if (bub.style.maxWidth !== mw) bub.style.maxWidth = mw;
    x = Math.max(x0, x0 + (x1 - x0 - bw) / 2); y = H - bh - pad;
  } else if (g.strip) { // açık pencere (savaş sonucu): altında yer varsa altına, yoksa üstüne; ikisi de yoksa en üste
    if (bub.style.maxWidth) bub.style.maxWidth = '';
    const A = rbox('#modal .box'), below = A ? H - (A.y + A.h) : 0;
    x = (W - bw) / 2;
    y = A && below >= bh + 4 ? A.y + A.h + (below - bh) / 2 : A && A.y >= bh + 4 ? (A.y - bh) / 2 : pad;
  } else {
    if (bub.style.maxWidth) bub.style.maxWidth = '';
    if (F && !g.top) { // sırayla: altında, üstünde, sağında, solunda; hedefi örtmeyen ilk yer
      const gap = 42, cx = F.x + F.w / 2, cy = F.y + F.h / 2, cl = (v, a, b) => Math.max(a, Math.min(b, v));
      const opts = [[cl(cx - bw / 2, pad, W - bw - pad), F.y + F.h + gap], [cl(cx - bw / 2, pad, W - bw - pad), F.y - bh - gap],
        [F.x + F.w + gap, cl(cy - bh / 2, pad, H - bh - pad)], [F.x - bw - gap, cl(cy - bh / 2, pad, H - bh - pad)]];
      if (g.side === 'left') opts.unshift(opts.pop()); // P26 N3: önce hedefin solu (VS'de düşman kartı üstte-sağda kalır)
      const fit = opts.find(([a, b]) => a >= pad && b >= pad && a + bw <= W - pad && b + bh <= H - pad);
      const WB = rbox('#win:not([hidden]) .page'); [x, y] = fit || [cx > W / 2 ? pad : W - bw - pad, cy > H / 2 ? (WB && WB.y > pad ? WB.y + 4 : pad) : H - bh - pad];
    } else { x = (W - bw) / 2; const WB = rbox('#win:not([hidden]) .page'); y = !F && g.btn ? (H - bh) / 2 - 16 : WB && WB.y > pad ? WB.y + 4 : pad; } // pencere açıkken başlığı örtme (23 Kas) // bilgi adımı ortada; hedefsiz yön tarifi üstte
  }
  x = Math.max(pad, Math.min(W - bw - pad, x)); y = Math.max(pad, Math.min(H - bh - pad, y));
  css(bub, `left:${Math.round(x)}px;top:${Math.round(y)}px${bub.style.maxWidth ? `;max-width:${bub.style.maxWidth}` : ''}${bub.style.left ? '' : ';transition:none'}`); // ilk yerleşim kaymadan
  // Ok: kutudan hedefe doğru, çerçevenin hemen dışında durur ve hedefi gösterir
  if (F && !g.strip) {
    const cx = F.x + F.w / 2, cy = F.y + F.h / 2, dx = x + bw / 2 - cx, dy = y + bh / 2 - cy, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
    const t = Math.min(Math.abs(ux) > 1e-3 ? (F.w / 2 + 4) / Math.abs(ux) : 1e9, Math.abs(uy) > 1e-3 ? (F.h / 2 + 4) / Math.abs(uy) : 1e9);
    const ax = cx + ux * (t + 19), ay = cy + uy * (t + 19), ang = Math.atan2(-uy, -ux) * 180 / Math.PI;
    arrow.hidden = false; css(arrow, `left:${Math.round(ax)}px;top:${Math.round(ay)}px;transform:translate(-50%,-50%) rotate(${Math.round(ang)}deg)`);
  } else arrow.hidden = true;
}
let rafOn = false;
let placeAt = 0; // yerleşim ~30 kare/sn yeter (3B sahne de ana üste 30 kare/sn çizilir)
const loop = t => { if (layer.hidden || TU.mode !== 'guide') { rafOn = false; return; } if (!(t - placeAt < 30)) { placeAt = t; place(); } requestAnimationFrame(loop); };
const kick = () => { if (!rafOn && !layer.hidden && TU.mode === 'guide') { rafOn = true; requestAnimationFrame(loop); } };
layer.addEventListener('click', async e => {
  const b = e.target.closest('[data-t]');
  if (!b) { if (e.target.closest('.tbub') && typing()) typeStop(); return; } // panele dokunmak yazıyı tamamlar
  if (TU.busy) return;
  const t = b.dataset.t;
  if (t === 'next' && TU.mode === 'guide' && typing()) return typeStop(); // ilk dokunuş yazıyı tamamlar
  if (t === 'close') { TU.card = null; tutTick(); return askAfterTutorial(); }
  TU.busy = true; if (b.tagName === 'BUTTON') b.disabled = true;
  try {
    if (t === 'rescue') { await act('tut.next', { s: S.tut.s + 1 }); ACT.goCarsi?.(); }
    else if (t === 'next') await tutNextStep();
  } catch (err) { toast(err.message); }
  TU.busy = false; tutTick();
});
// Sıradaki öğretici adımı (sunucu tut.next karar verir); bitişte kutlama kartı, ara hediyeler ileti olarak
async function tutNextStep() {
  const from = TUT_STEPS[S.tut.s];
  const r = await act('tut.next', { s: S.tut.s + 1 });
  if (from === 'carsi') ACT.goCarsi?.(); // öğretici seni Yemin Pazarı'na bırakır
  if (r.done) TU.card = { loot: r.loot };
  else if (r.loot.length) toast(`Hediye: ${r.loot.map(dropText).join(', ')} çantana eklendi.`);
  if (cur()) redraw();
}
/** P26 K4 (orman.js sahneleri): öğreticiyi bir adım ilerletir. Başarılıysa true, hata iletisi gösterilirse false. */
hooks.tutNext = async () => { if (TU.busy) return false; TU.busy = true; try { await tutNextStep(); return true; } catch (err) { toast(err.message); return false; } finally { TU.busy = false; tutTick(); } };
/** P26 K4 (orman.js sağ üst X → "Evet, atla"): öğreticiyi atlar; hediye çantaya eklenir, gerekirse bildirim izni sorulur. */
hooks.tutSkip = async () => {
  try {
    const sr = await act('tut.skip'); const gift = sr?.loot?.length ? `Hediye: ${sr.loot.map(dropText).join(', ')} çantana eklendi.` : '';
    if (!(await askAfterTutorial())) toast(`Öğretici kapatıldı. ${gift || 'İyi seferler.'}`); else if (gift) toast(gift); // izin penceresi açılıyorsa ileti üstüne binmesin
  } catch (err) { toast(err.message); }
  tutTick();
};
setInterval(() => { tutTick(); kick(); }, 300);
onState(() => setTimeout(() => { tutTick(); kick(); }, 0));
window.addEventListener('resize', () => setTimeout(() => { if (TU.mode === 'guide') place(); }, 50));
