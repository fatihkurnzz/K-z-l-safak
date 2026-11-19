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
import { fmtDate, fmtTime } from './i18n.js';

// ---------- Ortak: tür simgeleri, renkler, zaman ----------
// Sunucu duyurusu türleri (shared/duyuru.js announce k)
const ANN_KIND = {
  plus: { tag: 'Basma', icon: 'anvil', c: '#ff9a3a' }, unique: { tag: 'Eşsiz', icon: 'gem', c: '#ffcf4a' },
  terr: { tag: 'Bölge', icon: 'clan', c: '#6fd18a' }, ruler: { tag: 'Başbuğ', icon: 'crown', c: '#ffd76a' },
  event: { tag: 'Etkinlik', icon: 'timer', c: '#6ec8ff' }, bot: { tag: 'Diyar', icon: 'star', c: '#c9b8ff' },
};
const annKind = k => ANN_KIND[k] || ANN_KIND.bot;
// Ekrana yalnız önemli duyurular düşer (19 Kas, kullanıcı: "zırt pırt bildirim geliyor"): başbuğ, bölge, etkinlik, eşsiz
// eşya ve +10 basma. Diyar sohbetleri ve küçük basmalar yalnız Duyuru penceresinde kalır.
const annImportant = a => ['ruler', 'terr', 'event', 'unique'].includes(a.k) || (a.k === 'plus' && a.plus >= 10);
// Kayan bildirim kartına yalnız önemli bildirim türleri düşer; öbürleri zilde (Bildirimler penceresinde) bekler
const NOTE_IMPORTANT = new Set(['mail', 'arena', 'clan', 'ruler', 'ferman', 'terr', 'grant', 'friend', 'sale', 'card']);
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
const groupHtml = (title, n, body) => `<section class="v13-grp"><h4><span>${title}</span><em>${n}</em></h4><div class="v13-cards">${body}</div></section>`;
// Boş durum: çizimli, ortalanmış kart
const EMPTY_BELL = '<svg viewBox="0 0 120 90" aria-hidden="true"><ellipse cx="60" cy="80" rx="34" ry="5" fill="#0003"/><path d="M60 14a5 5 0 0 1 5 5v2c11 3 18 12 18 24v13l7 10v4H30v-4l7-10V45c0-12 7-21 18-24v-2a5 5 0 0 1 5-5z" fill="var(--kc,#e7c75a)" opacity=".9"/><path d="M50 72h20a10 10 0 0 1-20 0z" fill="var(--kc,#e7c75a)"/><path d="M44 40c2-6 6-10 12-11" stroke="#fff8" stroke-width="3" fill="none" stroke-linecap="round"/><text x="88" y="30" font-size="13" font-weight="800" fill="#fff9">z</text><text x="97" y="20" font-size="10" font-weight="800" fill="#fff7">z</text></svg>';
const EMPTY_SCROLL = '<svg viewBox="0 0 120 90" aria-hidden="true"><ellipse cx="60" cy="82" rx="34" ry="5" fill="#0003"/><rect x="34" y="18" width="52" height="56" fill="#f1e2bc"/><rect x="28" y="12" width="64" height="10" rx="5" fill="#d9bf86"/><rect x="28" y="70" width="64" height="10" rx="5" fill="#d9bf86"/><path d="M44 34h32M44 44h26M44 54h20" stroke="#b49a62" stroke-width="3" stroke-linecap="round"/><circle cx="78" cy="60" r="7" fill="#c2321e"/></svg>';
const empty = (art, title, text) => `<div class="v13-empty">${art}<b>${title}</b><p>${text}</p></div>`;

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
async function poll() {
  if (!S || !S.tut?.end || document.hidden) return;
  let r;
  try { r = await act('ann.feed', D.since === undefined ? {} : { since: D.since }); } catch { return; }
  if (!r) return;
  D.since = r.now;
  for (const a of r.list || []) if (!D.seen.has(a.id)) { D.seen.add(a.id); if (D.q.length < 6 && annImportant(a)) D.q.push(a); }
  hooks.annPin?.(r.pin || null);
  next();
}
setTimeout(poll, 5000);
setInterval(poll, 20000);
// Deneme ve denetim için: elle duyuru geçir
export const annShow = (text, k = 'bot', plus = 0) => { D.q.push({ id: 'x' + Math.random(), k, text, plus }); next(); };

// ---------- Kayan bildirim kartı ----------
const stack = document.createElement('div');
stack.id = 'v13toasts'; stack.setAttribute('aria-live', 'polite');
(document.getElementById('game') || document.body).appendChild(stack);
// { icon, c, kicker, title, text, go } · go: dokununca çağrılacak işlem (ACT adı) ya da bildirim yönü (notifGo)
export function noteToast({ icon = 'mail', c = '#e7c75a', kicker = 'Bildirim', title = '', text = '', go = null, a = null }) {
  const el = document.createElement('button');
  el.type = 'button'; el.className = 'v13-toast';
  if (a) { el.dataset.ta = a; if (go) el.dataset.go = go; }
  el.innerHTML = `${tile(icon, c)}<span class="v13-tb"><small>${esc(kicker)} · şimdi</small><b>${esc(title)}</b>${text ? `<span>${esc(text)}</span>` : ''}</span><i class="v13-tx" aria-hidden="true">✕</i>`; // süre çubuğu kalktı: kart şeffaflaşıp kaybolur
  while (stack.children.length >= 3) stack.firstChild.remove();
  stack.appendChild(el);
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('in')));
  const close = () => { if (!el.isConnected || el.classList.contains('out')) return; el.classList.remove('in'); el.classList.add('out'); setTimeout(() => el.remove(), 360); };
  const t = setTimeout(close, Math.round(5200 * SHOW_MUL));
  el.addEventListener('click', e => { clearTimeout(t); close(); if (!e.target.closest('.v13-tx') && el.dataset.ta) ACT[el.dataset.ta]?.(el.dataset.go ? { go: el.dataset.go } : {}); });
  try { play('ann.ping', { gain: 0.45 }); } catch { /* sessiz */ }
  return el;
}
hooks.notifToast = noteToast; // başka paketler de kullanabilir

// Zil sayacı artınca (ui-kalicilik.js #kbell, sunucuya 30 sn'de bir sorulur) en yeni bildirim kart olarak kayar. O modülün düz
// iletisi (aynı başlık) gelirse yerine bu kart gösterildiği için gizlenir.
const BELL = { n: null, top: null, at: 0 };
async function bellChanged() {
  const el = document.getElementById('kbell'); if (!el) return;
  const n = el.hidden ? 0 : (+el.textContent || 0);
  if (BELL.n === null || n <= BELL.n) { BELL.n = n; return; }
  BELL.n = n;
  if (!S?.tut?.end) return;
  const r = await act('notif.peek').catch(() => null), e = r?.top; if (!e) return;
  BELL.top = e.title; BELL.at = Date.now();
  if (!NOTE_IMPORTANT.has(e.k)) return; // önemsiz bildirim yalnız zilde
  const [icon, c] = nKind(e.k);
  noteToast({ icon, c, kicker: 'Yeni bildirim', title: e.title, text: e.text, a: 'notifGo', go: e.go });
}
new MutationObserver(() => bellChanged()).observe(hud, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['hidden'] });
{ const t = document.getElementById('toast'); if (t) new MutationObserver(() => { if (BELL.top && Date.now() - BELL.at < 4000 && t.textContent === BELL.top) { t.style.opacity = 0; BELL.top = null; } }).observe(t, { childList: true, characterData: true, subtree: true }); }

// ---------- Bildirimler penceresi: liste ----------
// Veri ui-kalicilik.js'ten (notif.list): { list: [{ k, title, text, at, unread, muted, go, cls }] }. "Cihaz bildirimi" çağrısı (.nask)
// o modülün çiziminden alınır, kalanı burada kart olarak çizilir.
function notifCards(w, base) {
  const D2 = w.data;
  if (!D2) return loading;
  const tmp = document.createElement('div'); tmp.innerHTML = base; const ask = tmp.querySelector('.nask')?.outerHTML || '';
  const list = D2.list || [], unread = list.filter(e => e.unread).length;
  const head = `<div class="v13-sum">${tile('mail', '#e7c75a')}<span><b>${unread ? `${unread} yeni bildirim` : 'Hepsi okundu'}</b><small>${list.length ? `Son ${list.length} kayıt · 3 gün saklanır` : 'Kayıt yok'}</small></span><button class="btn sm" data-a="tab" data-id="set">Ayarlar</button></div>`;
  if (!list.length) return `${ask}${head}${empty(EMPTY_BELL, 'Şimdilik sessiz', 'Enerjin dolunca, eşyan satılınca, savunmana saldırılınca ya da klanında bir şey olunca burada görürsün.')}`;
  const card = e => { const [icon, c] = nKind(e.k);
    return `<button class="v13-card ${e.unread ? 'new' : ''} ${e.muted ? 'muted' : ''}" data-a="notifGo" data-go="${esc(e.go || '')}" style="--kc:${c}">${tile(icon, c)}
      <span class="v13-cb"><b>${esc(e.title)}</b><span>${esc(e.text)}</span></span><span class="v13-cm"><time title="${esc(fmtDate(e.at))} ${esc(fmtTime(e.at))}">${ago(e.at)}</time>${e.unread ? '<i class="v13-dot" aria-label="okunmadı"></i>' : e.muted ? '<em>sessiz</em>' : ''}</span></button>`; };
  const fresh = list.filter(e => e.unread), old = list.filter(e => !e.unread);
  return `${ask}${head}${fresh.length ? groupHtml('Yeni', fresh.length, fresh.map(card).join('')) : ''}${groupBy(old, e => dayLabel(e.at)).map(([k, xs]) => groupHtml(k, xs.length, xs.map(card).join(''))).join('')}
    <p class="mut v13-foot">Bir bildirime dokun: ilgili ekran açılır.</p>`;
}
// ---------- Duyurular penceresi: duyurular ve Diyar akışı ----------
const NEWS_KIND = t => (/bakım|kesinti/i.test(t) ? ['anvil', '#e0a84a', 'Bakım'] : /etkinlik|turnuva|hafta sonu/i.test(t) ? ['timer', '#6ec8ff', 'Etkinlik'] : /sürüm|güncelleme|yeni/i.test(t) ? ['star', '#c98bff', 'Güncelleme'] : /kod|hediye|ödül/i.test(t) ? ['gift', '#ff9a3a', 'Hediye'] : ['news', '#e7c75a', 'Duyuru']);
function newsCards(d) {
  if (!d) return loading;
  if (!d.items?.length) return empty(EMPTY_SCROLL, 'Henüz duyuru yok', 'Güncellemeler, bakım saatleri ve etkinlikler burada yayımlanır.');
  const card = x => { const [icon, c, tag] = NEWS_KIND(`${x.title} ${x.body}`), fresh = x.at > d.seen;
    return `<article class="v13-card v13-news ${fresh ? 'new' : ''}" style="--kc:${c}">${tile(icon, c)}<span class="v13-cb"><small class="v13-tag">${tag}${x.edited ? ' · güncellendi' : ''}</small><b>${esc(x.title)}</b><span class="v13-body">${esc(x.body)}</span></span>
      <span class="v13-cm"><time title="${esc(fmtDate(x.at))} ${esc(fmtTime(x.at))}">${ago(x.at)}</time>${fresh ? '<i class="v13-dot" aria-label="yeni"></i>' : ''}</span></article>`; };
  return groupBy(d.items, x => dayLabel(x.at)).map(([k, xs]) => groupHtml(k, xs.length, xs.map(card).join(''))).join('');
}
function feedCards(d) {
  if (!d) return loading;
  const list = [...(d.list || [])].sort((a, b) => b.at - a.at);
  if (!list.length) return empty(EMPTY_SCROLL, 'Diyar sakin', 'Büyük basmalar, eşsiz eşyalar, bölge hâkimiyeti ve Başbuğ seçimleri burada görünür.');
  const card = a => { const K = annKind(a.k), col = a.f && FACTIONS[a.f] ? FACTIONS[a.f].color : null;
    return `<div class="v13-card v13-feed" style="--kc:${K.c}">${tile(K.icon, K.c)}<span class="v13-cb"><small class="v13-tag">${a.plus ? `+${a.plus} basma` : K.tag}${col ? ` · <i class="ann2-f" style="--fc:${col}"></i>${esc(FACTIONS[a.f].name)}` : ''}</small><span class="v13-body">${esc(a.text)}</span></span><span class="v13-cm"><time>${ago(a.at)}</time></span></div>`; };
  return groupBy(list, a => dayLabel(a.at)).map(([k, xs]) => groupHtml(k, xs.length, xs.map(card).join(''))).join('') + '<p class="mut v13-foot">Diyar akışı son sunucu duyurularını gösterir.</p>';
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
