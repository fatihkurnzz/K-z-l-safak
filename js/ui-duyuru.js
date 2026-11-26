// Sunucu duyuru şeridi, bildirim kartları ve duyuru pencereleri (sürüm 13: yeniden tasarım).
//  - Şerit: ekranın üstünde, türüne göre simgeli ve etiketli cam kart (shared/duyuru.js: ann.feed). Kayarak gelir; yazı
//    sığmıyorsa kartın içinde akar, sonra kayarak gider. Sıradakiler arka arkaya gelir.
//  - Kayan bildirim kartı (noteToast): sağ üstten kayarak gelir; zildeki okunmamış sayısı artınca en yeni bildirim gösterilir.
//  - Bildirimler penceresi (ui-kalicilik.js ACT.notifs) ve Duyurular penceresi (ui-destek.js ACT.news): veri ve okundu işlemleri
//    o modüllerde kalır; burada yalnızca liste çizimi değişir (kart, tür simgesi, zaman, okunmamış işareti, gün grupları, boş durum).
//    Duyurular penceresine "Diyar akışı" sekmesi eklenir (son sunucu duyuruları).
// Genel sohbetin üstündeki sabit duyuru ui-social.js'te (chat.list 'g' → ann).
import { S, act, now } from './api.js';
import { ACT, esc, hooks, hud, cur, redraw, loading, run } from './ui-core.js';
import { play } from './sfx.js';
import { FACTIONS } from '../shared/content.js';
import { view } from './orient.js';
import { svg } from './icons.js';
import { raidWindow } from '../shared/baskin.js';
import { nextHisar } from '../shared/hisar.js';
import { seasonEndAt } from '../shared/pvp.js';
import { NOBET, brOf, slotOf } from '../shared/nobet.js';
import { fmtDate, fmtTime } from './i18n.js';

// ---------- Ortak: tür simgeleri, renkler, zaman ----------
// Sunucu duyurusu türleri (shared/duyuru.js announce k)
const ANN_KIND = {
  plus: { tag: 'Basma', icon: 'anvil', c: '#ff9a3a' }, unique: { tag: 'Eşsiz', icon: 'gem', c: '#ffcf4a' },
  terr: { tag: 'Bölge', icon: 'clan', c: '#6fd18a' }, ruler: { tag: 'Başbuğ', icon: 'crown', c: '#ffd76a' },
  event: { tag: 'Etkinlik', icon: 'timer', c: '#6ec8ff' }, bot: { tag: 'Diyar', icon: 'star', c: '#c9b8ff' },
};
const annKind = k => ANN_KIND[k] || ANN_KIND.bot;
const SHOW_MUL = 0.75; // ekranda kalma süresi: öncekinin %75'i
// Bildirim türleri (shared/meta.js NOTIF_KIND k) → simge ve renk
const N_KIND = {
  energy: ['energy', '#5fd17a'], mine: ['mine', '#e0a84a'], idle: ['timer', '#e0a84a'], farm: ['timer', '#e0a84a'], sale: ['market', '#ffcf4a'],
  mail: ['mail', '#7fb8ff'], arena: ['arena', '#ff6a5a'], clan: ['clan', '#6ea8ff'], week: ['quest', '#9fd86a'], daily: ['quest', '#9fd86a'],
  ach: ['star', '#c98bff'], friend: ['party', '#6fd1c8'], card: ['gem', '#ff5a6a'], ruler: ['crown', '#ffd76a'], ferman: ['news', '#ffd76a'],
  grant: ['akce', '#ffcf4a'], terr: ['clan', '#6fd18a'], roster: ['party', '#6fd1c8'], upkeep: ['anvil', '#e0a84a'], cal: ['gift', '#ff9a3a'],
};
const nKind = k => N_KIND[k] || ['mail', '#9fb0c8'];
const tile = (icon, c, cls = '') => `<span class="v13-ic ${cls}" style="--kc:${c}">${svg(icon)}</span>`;
const DAY = 86400000;
const dayStart = t => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
export const ago = t => { const s = Math.max(0, now() - t) / 1000; return s < 60 ? 'şimdi' : s < 3600 ? `${Math.floor(s / 60)} dk` : s < DAY / 1000 ? `${Math.floor(s / 3600)} sa` : s < 7 * DAY / 1000 ? `${Math.floor(s / 86400)} gün` : fmtDate(t, { day: 'numeric', month: 'short' }); };
const dayLabel = t => { const d = dayStart(now()) - dayStart(t); return d <= 0 ? 'Bugün' : d <= DAY ? 'Dün' : d < 7 * DAY ? 'Bu hafta' : 'Daha önce'; };
// Listeyi gün gruplarına böler (sıra korunur): [[başlık, [kayıt]]]
const groupBy = (list, keyOf) => { const out = []; for (const x of list) { const k = keyOf(x), g = out.at(-1); if (g && g[0] === k) g[1].push(x); else out.push([k, [x]]); } return out; };

// ---------- Duyuru şeridi ----------
// Yerleşim: ana ekranda oyuncu kartının sağıyla bildirim simgesinin solu arasında, saatin altında. Ana ekran yokken (savaş)
// üst ortada durur. Ölçüler mantıksal koordinattadır (döndürülmüş ekranda da doğru yere düşer).
const lrect = el => { const r = el.getBoundingClientRect(); return view.rot ? { x: r.top, y: window.innerWidth - r.right, w: r.height, h: r.width } : { x: r.left, y: r.top, w: r.width, h: r.height }; };
function placeBar() {
  const pc = !hud.hidden && hud.querySelector('.pcard'), bell = !hud.hidden && hud.querySelector('[data-a="notifs"]'), clk = hud.querySelector('.wclock');
  if (!pc || !bell || !pc.getClientRects().length || !bell.getClientRects().length) { bar.style.cssText = ''; bar.classList.add('free'); return; }
  bar.classList.remove('free');
  const P = lrect(pc), B = lrect(bell), C = clk && clk.getClientRects().length ? lrect(clk) : null, gap = 8;
  // Premium satırı (ve yanındaki bölge çipi) şeridin hizasına iniyorsa şerit onların sağından başlar
  const SV = hud.querySelector('.wsrv'), SR = SV && SV.getClientRects().length ? lrect(SV) : null; // saatin altındaki sunucu simgesi
  const top = SR ? SR.y + SR.h + 4 : C ? C.y + C.h + 4 : P.y, row = hud.querySelector('.premrow'), R = row && row.getClientRects().length ? lrect(row) : null;
  const left = Math.max(P.x + P.w, R && R.y < top + 30 ? R.x + R.w : 0) + gap, w = Math.max(160, Math.min(560, B.x - gap - left));
  Object.assign(bar.style, { left: `${left + Math.max(0, (B.x - gap - left - w) / 2)}px`, right: 'auto', width: `${w}px`, top: `${top}px` });
}
window.addEventListener('resize', () => setTimeout(placeBar, 50));

const D = { since: undefined, seen: new Set(), q: [], busy: false };
const bar = document.createElement('div');
bar.id = 'annbar'; bar.hidden = true; bar.setAttribute('aria-live', 'polite');
(document.getElementById('game') || document.body).appendChild(bar); // oyun kabının içinde: döndürülmüş ekranda da yatay görünür

function next() {
  if (D.busy || !D.q.length) return;
  const a = D.q.shift(), K = annKind(a.k);
  D.busy = true; placeBar();
  const col = a.f && FACTIONS[a.f] ? FACTIONS[a.f].color : null;
  bar.innerHTML = `<div class="ann2 k-${esc(a.k)}${a.plus >= 10 ? ' p10' : ''}" style="--kc:${K.c}">${tile(K.icon, K.c, 'ann2-ic')}<span class="ann2-tag">${a.plus ? `+${a.plus}` : K.tag}</span>
    <span class="ann2-txt"><span class="ann2-run">${col ? `<b class="ann2-f" style="--fc:${col}"></b>` : ''}${esc(a.text)}</span></span><time>şimdi</time></div>`;
  bar.hidden = false;
  const card = bar.firstChild, box = card.querySelector('.ann2-txt'), run = card.querySelector('.ann2-run');
  // Sığmayan yazı kartın içinde akar (hız sabit: ~55 px/sn); sığan yazı birkaç saniye durur
  requestAnimationFrame(() => {
    const over = run.scrollWidth - box.clientWidth;
    const hold = (over > 4 ? Math.min(40, 2.4 + (over + 30) / 55) : Math.min(9, 4.5 + a.text.length * 0.03)) * (over > 4 ? 1 : SHOW_MUL);
    if (over > 4) { run.style.setProperty('--dx', `${-over - 12}px`); run.style.animationDuration = `${hold - 1.6}s`; run.classList.add('roll'); }
    card.classList.add('in');
    clearTimeout(D.t1); D.t1 = setTimeout(() => { card.classList.remove('in'); card.classList.add('out'); D.t2 = setTimeout(done, 380); }, hold * 1000);
  });
  try { play(a.plus >= 10 ? 'id.plus10' : 'ann.ping', { gain: 0.7 }); } catch { /* ses kapalıysa sessiz geçer */ }
  const done = () => { if (bar.firstChild !== card) return; D.busy = false; bar.hidden = !D.q.length; bar.innerHTML = ''; next(); };
  setTimeout(() => { if (D.busy && bar.firstChild === card) done(); }, 60000); // görünmez sekmede zamanlayıcı durursa kuyruk tıkanmasın
}
// P28 bildirim (25 Kas, kullanıcı): sunucu duyuru akışı (ann.feed: eşsiz eşya, basma, bölge, Başbuğ, Diyar/sahte oyuncu
// duyuruları) artık ekrana DÜŞMEZ ve sorgulanmaz; liste yalnız Duyurular → "Diyar akışı" sekmesinde, sabit duyuru genel sohbette
// (chat.list 'ann'). Şerit (#annbar) yalnız ETKİNLİK HATIRLATMASI gösterir (aşağıda).
/** Deneme ve denetim için: şeritten elle tek satır geçirir (yalnız konsoldan; oyun akışı çağırmaz). */
export const annShow = (text, k = 'event', plus = 0) => { D.q.push({ id: 'x' + Math.random(), k, text, plus }); next(); };

// ---------- Etkinlik hatırlatması (P28) ----------
// Zamanlı etkinliklere başlamasına (ya da sezonun bitmesine) HATIRLAT.at eşiklerinde birer kez üstte ince bant. Her etkinlik örneği
// ve eşik için yalnız bir kez (localStorage). Savaşta, pencere/modal açıkken bekler; açılınca hâlâ eşiğin geçerlilik aralığındaysa
// gösterilir. Tek setInterval (HATIRLAT.every), sayfa gizliyken iş yapmaz. Saat: api.js now() (sunucu zaman farkı dahil).
const MIN = 60000, HOUR = 60 * MIN;
const HATIRLAT = {
  at: [{ ms: HOUR, win: 10 * MIN, txt: '1 saat' }, { ms: 5 * MIN, win: 2 * MIN, txt: '5 dakika' }], // eşik, geçerlilik aralığı, yazı
  every: 30000, show: 6000, key: 'dd_hatirlat', keepMs: 2 * 86400000,
};
// Etkinlik tablosu: next(now) sıradaki başlangıç (ms), ok(S) bu oyuncuya uygun mu, go: dokununca açılan ekran (ACT), on: açık mı
const ETKINLIK = [
  { id: 'baskin', name: 'Dünya Baskını', verb: 'başlıyor', go: 'mnBaskin', next: t => { const w = raidWindow(t); return t < w.start ? w.start : raidWindow(w.end).start; } },
  { id: 'hisar', name: 'Hisar Kuşatması', verb: 'başlıyor', go: 'clanHisar', ok: s => !!s.clan, next: t => { const w = nextHisar(t); return t < w.start ? w.start : nextHisar(w.end).start; } },
  { id: 'sezon', name: 'Meydan sezonu', verb: 'bitiyor', go: 'meydan', next: t => seasonEndAt(t) },
  // Kristal Nöbeti her 20 dakikada bir başlar: her örneğe 1 sa/5 dk hatırlatma saatte ~6 bant demek ("zırt pırt" şikâyeti); kapalı.
  { id: 'nobet', name: NOBET.name, verb: 'başlıyor', go: 'nobet', on: false, ok: s => !!brOf(s.lvl), next: t => slotOf('low', t + NOBET.runMin * MIN)?.start },
];
const H = { shownAt: 0 };
const hatLoad = () => { try { return JSON.parse(localStorage.getItem(HATIRLAT.key) || '{}') || {}; } catch { return {}; } };
const hatSave = m => { try { localStorage.setItem(HATIRLAT.key, JSON.stringify(m)); } catch { /* gizli kip: yinelenme koruması oturumla sınırlı */ } };
const hatBusy = () => !!document.querySelector('#battleUI:not([hidden])') || !document.getElementById('win')?.hidden || !document.getElementById('modal')?.hidden || !S?.tut?.end || hud.hidden;
/**
 * Hatırlatma denetimi. Zamanlayıcı her HATIRLAT.every'de çağırır; deneme için sahte "şimdi" ile doğrudan çağrılabilir.
 * @param {number} [t] şimdiki an (ms, sunucu saati); verilmezse api.js now()
 * @returns {object|null} gösterilen hatırlatma { id, start, at, text } ya da null
 */
export function hatirlatDenetle(t = now()) {
  if (!S || hatBusy() || D.busy) return null;
  const seen = hatLoad();
  for (const k of Object.keys(seen)) if (seen[k] < t - HATIRLAT.keepMs) delete seen[k]; // eski kayıtlar budanır
  for (const e of ETKINLIK) {
    if (e.on === false || (e.ok && !e.ok(S))) continue;
    const start = e.next(t); if (!start || start <= t) continue;
    const left = start - t;
    for (const th of HATIRLAT.at) {
      if (left > th.ms || left <= th.ms - th.win) continue;
      const k = `${e.id}:${start}:${th.ms}`; if (seen[k]) continue;
      seen[k] = start; hatSave(seen);
      const text = `${e.name} ${th.txt} sonra ${e.verb}`;
      hatShow(text, e.go); H.shownAt = t;
      return { id: e.id, start, at: th.ms, text };
    }
  }
  hatSave(seen);
  return null;
}
// İnce tek satır bant (#annbar, .ann2.hat); HATIRLAT.show sonra kayarak gider, dokununca ilgili ekran açılır
function hatShow(text, go) {
  D.busy = true; placeBar();
  // Zil yoksa (2B başkent) şerit serbest kalır ve kaynak satırına biner: oyuncu kartıyla kaynak çipleri arasına yerleşir
  // P28: sehir2 HUD'unda .pcard yok; sol sınır kaynak çipleriyle aynı satırdaki sol öğelerin (profil, ad, can/mana, sancak) sağ kenarı, sağ sınır çiplerin solu
  const shown = e => e.getClientRects().length && e.getBoundingClientRect().width, rs = [...hud.querySelectorAll('.s2-caps, .res')].find(shown);
  bar.classList.remove('dar');
  if (bar.classList.contains('free') && rs) {
    const R = lrect(rs), H = 26, gap = 8, top = R.y + Math.max(0, (R.h - H) / 2);
    const sol = [...hud.querySelectorAll('.pcard, .s2-pf, .s2-nm, .s2-bar, .s2-prem, .s2-sancak')].filter(shown).map(lrect).filter(q => q.y < top + H && q.y + q.h > top);
    const left = Math.max(0, ...sol.map(q => q.x + q.w)) + gap, w = R.x - gap - left;
    if (sol.length && w >= 140) { bar.classList.remove('free'); bar.classList.toggle('dar', w < 260); Object.assign(bar.style, { left: `${left}px`, right: 'auto', width: `${w}px`, top: `${top}px` }); }
  }
  const K = annKind('event');
  bar.innerHTML = `<div class="ann2 k-event hat" role="button" tabindex="0" style="--kc:${K.c}">${tile(K.icon, K.c, 'ann2-ic')}<span class="ann2-tag">${K.tag}</span><span class="ann2-txt"><span class="ann2-run">${esc(text)}</span></span></div>`;
  bar.hidden = false;
  const card = bar.firstChild;
  const done = () => { if (bar.firstChild !== card) return; D.busy = false; bar.hidden = true; bar.innerHTML = ''; };
  const close = () => { card.classList.remove('in'); card.classList.add('out'); setTimeout(done, 380); };
  const open = () => { clearTimeout(D.t1); close(); if (go) ACT[go]?.({}); };
  card.addEventListener('click', open);
  card.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); open(); } });
  requestAnimationFrame(() => card.classList.add('in'));
  clearTimeout(D.t1); D.t1 = setTimeout(close, HATIRLAT.show);
  try { play('ann.ping', { gain: 0.5 }); } catch { /* ses kapalıysa sessiz geçer */ }
}
setInterval(() => { if (!document.hidden) hatirlatDenetle(); }, HATIRLAT.every);

// ---------- Kayan bildirim kartı ----------
const stack = document.createElement('div');
stack.id = 'v13toasts'; stack.setAttribute('aria-live', 'polite');
(document.getElementById('game') || document.body).appendChild(stack);
// { icon, c, kicker, title, text, go } · go: dokununca çağrılacak işlem (ACT adı) ya da bildirim yönü (notifGo)
// Kuyruk (denetim Y9, 22 Kas): ekranda en çok 1 kart; pencere, diyalog ya da savaş açıkken kart sırada bekler (en çok 5),
// ekran boşalınca gösterilir. Kart üst ortada ince şerittir (v27-duzen.css sonu), 2,6 sn kalır.
const NQ = [];
const busy = () => !document.getElementById('modal')?.hidden || !document.getElementById('win')?.hidden || !!document.querySelector('#battleUI:not([hidden])');
let nqT = 0;
function pump() {
  clearTimeout(nqT); nqT = 0;
  if (!NQ.length || stack.children.length) return;
  if (busy()) { nqT = setTimeout(pump, 1000); return; }
  showNote(NQ.shift());
}
/**
 * Kayan bildirim kartı. P28 (25 Kas, kullanıcı): üstte kendiliğinden çıkan bildirim kalktı; çağrı kabul edilir ama kart gösterilmez,
 * bildirim zilde (Bildirimler penceresi) bekler. İmza korunur (hooks.notifToast kullanan modüller kırılmasın).
 * @returns {null}
 */
export function noteToast(o) { void o; return null; }
function showNote(opt) {
  const { icon = 'mail', c = '#e7c75a', kicker = 'Bildirim', title = '', text = '', go = null, a = null } = opt;
  const el = document.createElement('button');
  el._opt = opt;
  el.type = 'button'; el.className = 'v13-toast';
  if (a) { el.dataset.ta = a; if (go) el.dataset.go = go; }
  el.innerHTML = `${tile(icon, c)}<span class="v13-tb"><small>${esc(kicker)} · şimdi</small><b>${esc(title)}</b>${text ? `<span>${esc(text)}</span>` : ''}</span><i class="v13-tx" aria-hidden="true">✕</i>`; // süre çubuğu kalktı: kart şeffaflaşıp kay
  stack.appendChild(el);
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('in')));
  const close = () => { if (!el.isConnected || el.classList.contains('out')) return; el.classList.remove('in'); el.classList.add('out'); setTimeout(() => { el.remove(); pump(); }, 360); };
  const t = setTimeout(close, 2600);
  el.addEventListener('click', e => { clearTimeout(t); close(); if (!e.target.closest('.v13-tx') && el.dataset.ta) ACT[el.dataset.ta]?.(el.dataset.go ? { go: el.dataset.go } : {}); });
  try { play('ann.ping', { gain: 0.45 }); } catch { /* sessiz */ }
  return el;
}
// Kart görünürken pencere ya da diyalog açılırsa kart kalkar ve sıranın başına döner (içeriğin üstüne binmesin)
for (const id of ['win', 'modal']) { const el = document.getElementById(id); if (el) new MutationObserver(() => {
  const k = stack.querySelector('.v13-toast:not(.out)'); if (!k || !busy()) return;
  k.remove(); if (k._opt) NQ.unshift(k._opt); pump();
}).observe(el, { attributes: true, attributeFilter: ['hidden'] }); }
hooks.notifToast = noteToast; // başka paketler de kullanabilir

// P28: zil sayacı artınca kayan kart gösterme (bellChanged) ve #toast eşleştirme gözlemcisi kaldırıldı; sayı zilde kalır.

// ---------- Bildirimler penceresi: liste ----------
// Veri ui-kalicilik.js'ten (notif.list): { list: [{ k, title, text, at, unread, muted, go, cls }] }. "Cihaz bildirimi" çağrısı (.nask)
// o modülün çiziminden alınır, kalanı burada kart olarak çizilir.
// P25-a (referans 13_bildirimler / 14_duyurular): bronz özet şeridi, ortalı süslü gün başlıkları ("BUGÜN · 7"), koyu metal
// satırlar ve madalyonlu duyuru kartları. Sınıflar pa-* (css/p25-a.css); eski v13 kart kuralları bu pencerelerde kullanılmaz.
const paGrp = (title, n, body) => `<section class="pa-grp"><h4><span>${title} · ${n}</span></h4><div class="pa-list">${body}</div></section>`;
const paEmpty = (cls, title, text) => `<div class="pa-empty"><span class="pa-eart ${cls}" aria-hidden="true"></span><b>${title}</b><p>${text}</p></div>`;
// Bildirim simgesi: başarım → mor yıldız, klan → mavi kalkan (referans karoları); öbürleri metal karoda altın simge
const N_ART = { ach: 'yildiz', clan: 'kalkan' };
function notifCards(w, base) {
  const D2 = w.data;
  if (!D2) return loading;
  const tmp = document.createElement('div'); tmp.innerHTML = base; const ask = tmp.querySelector('.nask')?.outerHTML || '';
  const list = D2.list || [], unread = list.filter(e => e.unread).length;
  const head = `<div class="pa-band"><span class="pa-env" aria-hidden="true"></span><span class="pa-bt"><b>${unread ? `${unread} yeni bildirim` : 'Hepsi okundu'}</b> · ${list.length ? `Son ${list.length} kayıt · 3 gün saklanır` : 'Kayıt yok'}</span><button class="btn sm" data-a="tab" data-id="set">Ayarlar</button></div>`;
  if (!list.length) return `${ask}${head}${paEmpty('zarf', 'Şimdilik sessiz', 'Enerjin dolunca, eşyan satılınca, savunmana saldırılınca ya da klanında bir şey olunca burada görürsün.')}`;
  const card = e => { const [icon, c] = nKind(e.k), art = N_ART[e.k];
    return `<button class="pa-nrow ${e.unread ? 'new' : ''} ${e.muted ? 'muted' : ''}" data-a="notifGo" data-go="${esc(e.go || '')}"><span class="pa-nic ${art ? `art-${art}` : ''}" style="--kc:${c}" aria-hidden="true">${art ? '' : svg(icon)}</span>
      <span class="pa-nb"><b>${esc(e.title)}</b><small>${esc(e.text)}</small></span><span class="pa-nm"><time title="${esc(fmtDate(e.at))} ${esc(fmtTime(e.at))}">${ago(e.at)}</time>${e.unread ? '<i class="pa-dot" aria-label="okunmadı"></i>' : e.muted ? '<em>sessiz</em>' : ''}</span></button>`; };
  const fresh = list.filter(e => e.unread), old = list.filter(e => !e.unread);
  return `${ask}${head}${fresh.length ? paGrp('Yeni', fresh.length, fresh.map(card).join('')) : ''}${groupBy(old, e => dayLabel(e.at)).map(([k, xs]) => paGrp(k, xs.length, xs.map(card).join(''))).join('')}
    <p class="mut pa-foot">Bir bildirime dokun: ilgili ekran açılır.</p>`;
}
// ---------- Duyurular penceresi: duyurular ve Diyar akışı ----------
// Tür → [simge, renk, etiket, madalyon]: Güncelleme mor yıldız, Bakım ve Duyuru boru madalyonu, öbürleri boş halka + simge
const NEWS_KIND = t => (/bakım|kesinti/i.test(t) ? ['anvil', '#e0a84a', 'Bakım', 'boru'] : /etkinlik|turnuva|hafta sonu/i.test(t) ? ['timer', '#6ec8ff', 'Etkinlik', ''] : /sürüm|güncelleme|yeni/i.test(t) ? ['star', '#c98bff', 'Güncelleme', 'yildiz'] : /kod|hediye|ödül/i.test(t) ? ['gift', '#ff9a3a', 'Hediye', ''] : ['news', '#e7c75a', 'Duyuru', 'boru']);
const paMed = (art, icon) => `<span class="pa-nmd ${art ? `art-${art}` : ''}" aria-hidden="true">${art ? '' : svg(icon)}</span>`;
function newsCards(d) {
  if (!d) return loading;
  if (!d.items?.length) return paEmpty('parsomen', 'Henüz duyuru yok', 'Güncellemeler, bakım saatleri ve etkinlikler burada yayımlanır.');
  const card = x => { const [icon, , tag, art] = NEWS_KIND(`${x.title} ${x.body}`), fresh = x.at > d.seen;
    return `<article class="pa-news ${fresh ? 'new' : ''}">${paMed(art, icon)}<div class="pa-nwb"><h3><em class="pa-tag">${tag}</em><span>${esc(x.title)}</span></h3><p>${esc(x.body)}</p>
      <span class="pa-nm"><time title="${esc(fmtDate(x.at))} ${esc(fmtTime(x.at))}">${ago(x.at)}${x.edited ? ' · güncellendi' : ''}</time>${fresh ? '<i class="pa-dot" aria-label="yeni"></i>' : ''}</span></div></article>`; };
  return groupBy(d.items, x => dayLabel(x.at)).map(([k, xs]) => paGrp(k, xs.length, xs.map(card).join(''))).join('');
}
function feedCards(d) {
  if (!d) return loading;
  const list = [...(d.list || [])].sort((a, b) => b.at - a.at);
  if (!list.length) return paEmpty('parsomen', 'Diyar sakin', 'Büyük basmalar, eşsiz eşyalar, bölge hâkimiyeti ve Başbuğ seçimleri burada görünür.');
  const card = a => { const K = annKind(a.k), col = a.f && FACTIONS[a.f] ? FACTIONS[a.f].color : null;
    return `<div class="pa-news pa-feed">${paMed('', K.icon)}<div class="pa-nwb"><h3><em class="pa-tag">${a.plus ? `+${a.plus} basma` : K.tag}</em>${col ? `<span class="pa-fc"><i class="ann2-f" style="--fc:${col}"></i>${esc(FACTIONS[a.f].name)}</span>` : ''}</h3><p>${esc(a.text)}</p><span class="pa-nm"><time>${ago(a.at)}</time></span></div></div>`; };
  return groupBy(list, a => dayLabel(a.at)).map(([k, xs]) => paGrp(k, xs.length, xs.map(card).join(''))).join('') + '<p class="mut pa-foot">Diyar akışı son sunucu duyurularını gösterir.</p>';
}
const NEWS_TABS = [{ id: 'news', label: 'Duyurular', small: 'Oyun haberleri', icon: 'news' }, { id: 'feed', label: 'Diyar akışı', small: 'Sunucu olayları', icon: 'star' }];

// Pencere açıcılarını sar: modüller yüklendikten sonra (sıra bağımsız) bir kez
setTimeout(() => {
  const n0 = ACT.notifs;
  if (n0 && !n0.v13) {
    ACT.notifs = d => { n0(d); const w = cur(); if (!w || w.v13) return; w.v13 = 1; const r0 = w.render; w.render = t => (t === 'list' ? notifCards(w, r0(t)) : r0(t)); w.title = 'Bildirimler'; redraw(); };
    ACT.notifs.v13 = 1;
  }
  const s0 = ACT.news;
  if (s0 && !s0.v13) {
    ACT.news = d => {
      s0(); const w = cur(); if (!w || w.v13) return;
      const l0 = w.load; w.v13 = 1; w.tabs = NEWS_TABS; w.tab = d?.tab === 'feed' ? 'feed' : 'news';
      w.load = t => (t === 'feed' ? run('ann.feed', { since: 0 }) : l0(t));
      w.render = t => (t === 'feed' ? feedCards(w.data) : newsCards(w.data));
      ACT.tab({ id: w.tab }); // sekmeli kabuk yeniden kurulur ve veri yüklenir
    };
    ACT.news.v13 = 1;
  }
}, 0);
