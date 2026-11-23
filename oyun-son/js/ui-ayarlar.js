// Ayarlar penceresi (Menü → Ayarlar, Profil → Ayarlar): Grafik, Ses, Dil, Bildirimler, Hesap.
// Kural içermez. Grafik kademesi gfx.js'ten, ses audio.js'ten, bildirim kategorileri kalıcılık paketinden (notif.set)
// sürülür; burası yalnızca düğmeleri ve kaydırıcıları çizer. Dil: i18n.js (cihazda dd_lang, hesapta settings.lang).
import { S, act, onState, LOCAL, DEV, now } from './api.js';
import { ACT, $, win, modal, hud, openWin, redraw, cur, run, toast, med, esc, closeModal, showModal, confirmBox, avatarImg, hooks } from './ui-core.js';
import { FACTIONS } from '../shared/content.js';
import { NOTIF_CATS } from '../shared/meta.js';
import { SETTING_LANGS } from '../shared/settings.js';
import { TIER_KEYS, TIER_NAMES, TIER_NOTES, TIERS, getGfx, setGfx } from './gfx.js';
import { BUSES, BUS_KEYS, getAudio, setVolume, mute, isMuted, play, hasSound, onAudio } from './audio.js';
import { svg } from './icons.js';
import { replayFragman } from './ui-fragman.js';
import { ICON_AUTHORS } from './item-icons.js';
import { SKILL_ICON_AUTHORS } from './skill-icons.js';
import { pageErisim } from './ui-erisim.js';
import { LANGS, LANG_KEYS, lang, setLang, savedLang, onLang, t, fmtDate, protectName, errText } from './i18n.js';
// Dil düğmelerindeki bayraklar (emoji bayraklar her cihazda görünmediği için çizim): Türkçe → Türkiye, English → Birleşik Krallık
const FLAG = {
  tr: '<svg viewBox="0 0 30 20" aria-hidden="true"><rect width="30" height="20" fill="#e30a17"/><circle cx="11" cy="10" r="5" fill="#fff"/><circle cx="12.25" cy="10" r="4" fill="#e30a17"/><path d="M16.2 10l3.6-1.17-2.23 3.06v-3.78l2.23 3.06z" fill="#fff"/></svg>',
  en: '<svg viewBox="0 0 60 30" aria-hidden="true"><clipPath id="fgb"><path d="M0 0v30h60V0z"/></clipPath><clipPath id="fgt"><path d="M30 15h30v15zv15H0zH0V0zV0h30z"/></clipPath><g clip-path="url(#fgb)"><path d="M0 0v30h60V0z" fill="#012169"/><path d="M0 0l60 30m0-30L0 30" stroke="#fff" stroke-width="6"/><path d="M0 0l60 30m0-30L0 30" clip-path="url(#fgt)" stroke="#c8102e" stroke-width="4"/><path d="M30 0v30M0 15h60" stroke="#fff" stroke-width="10"/><path d="M30 0v30M0 15h60" stroke="#c8102e" stroke-width="6"/></g></svg>',
};
const flag = k => (FLAG[k] ? `<span class="flag">${FLAG[k]}</span>` : '');

const LS = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch { } }, del(k) { try { localStorage.removeItem(k); } catch { } } };
const root = document.documentElement;

// ---------- Hareketi azalt (cihaza özgü; dd_motion = 'less') ----------
// Açıkken arayüzün geçişleri ve döngülü süslemeleri durur (css/ayarlar.css). Cihazın kendi "hareketi azalt" ayarı
// açıksa oyun zaten sakin çizer; bu düğme ona ek olarak oyuncunun oyun içi seçimidir.
const MOTION_KEY = 'dd_motion';
export const motionLess = () => LS.get(MOTION_KEY) === 'less';
const sysCalm = () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
function setMotion(less) { if (less) LS.set(MOTION_KEY, 'less'); else LS.del(MOTION_KEY); root.classList.toggle('motion-less', less); }
root.classList.toggle('motion-less', motionLess());

// ---------- Dil ----------
// Seçim hemen uygulanır (sayfa yeniden kurulmaz), cihazda saklanır ve hesaba yazılır. Açılışta: cihazda seçim yoksa
// hesaptaki dil alınır; cihazdaki seçim hesaptakinden farklıysa hesap güncellenir.
let synced = false;
async function pushLang(l) { if (S && S.settings?.lang !== l && SETTING_LANGS.includes(l)) await act('settings.set', { key: 'lang', value: l }).catch(() => {}); }
async function syncLang() {
  if (synced || !S) return;
  synced = true;
  const own = savedLang(), srv = S.settings?.lang;
  if (!own && srv && srv !== lang()) await setLang(srv);
  else if (lang() !== srv) pushLang(lang());
}
onState(s => { if (s) { protectName(s.name); syncLang(); } });
if (S) { protectName(S.name); syncLang(); }
async function chooseLang(l) {
  if (!Object.hasOwn(LANGS, l) || l === lang()) return;
  const got = await setLang(l);
  if (got !== l) return toast(t('Dil dosyası yüklenemedi. Bağlantını kontrol et.'));
  pushLang(l);
  toast(t('Dil: {name}', { name: LANGS[l].name }));
}
// Dil değişince açık ekranlar yerinde çevrilir; ayrıca biçimi dile bağlı parçalar (tarih, sayı) yeniden çizilsin
onLang(() => { if (cur()) redraw(); else hooks.hud(); });

// ---------- Pencere ----------
const GEAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10.3 2h3.4l.5 2.6 1.9.8 2.2-1.5 2.4 2.4-1.5 2.2.8 1.9 2.6.5v3.4l-2.6.5-.8 1.9 1.5 2.2-2.4 2.4-2.2-1.5-1.9.8-.5 2.6h-3.4l-.5-2.6-1.9-.8-2.2 1.5-2.4-2.4 1.5-2.2-.8-1.9L2 13.7v-3.4l2.6-.5.8-1.9-1.5-2.2 2.4-2.4 2.2 1.5 1.9-.8zM12 8.4a3.6 3.6 0 1 0 0 7.2 3.6 3.6 0 0 0 0-7.2z"/></svg>';
const ICON = {
  gfx: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4.5h18v12H3zM5 6.5v8h14v-8zM8.5 18h7v2h-7zM7 13l3-3.4 2.4 2.2 2.2-2.6L17.2 13z"/></svg>',
  ses: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9.5h4l5-4.2v13.4l-5-4.2H3z"/><path d="M15 8.6a4.6 4.6 0 0 1 0 6.8M17.6 6a8.4 8.4 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  dil: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h11v9H8.5L5 16v-3H3zM12 10.5h9v8h-2v2.6L15.8 18.5H12v-3.6h3.8V10.5z"/></svg>',
  notif: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5a6 6 0 0 1 6 6v4.2l2 3.3v1H4v-1l2-3.3V8.5a6 6 0 0 1 6-6zM9.6 19h4.8a2.4 2.4 0 0 1-4.8 0z"/></svg>',
  erisim: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="4.2" r="2.2"/><path d="M4 7.5l8 1.6 8-1.6.5 1.8-6 1.6v4.2l2.4 6.3-1.9.7L12 16l-3 6.1-1.9-.7 2.4-6.3v-4.2l-6-1.6z"/></svg>',
  acc: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9zM4 21c.4-4.6 3.6-7 8-7s7.600 2.400 8 7z"/></svg>',
};
const tico = s => `<span class="tico">${s}</span>`;
const sw = (on, a, extra = '', label) => `<button class="btn sm ${on ? 'green' : ''} ktog aytog" data-a="${a}" ${extra} aria-pressed="${on}">${label || (on ? 'Açık' : 'Kapalı')}</button>`;
const pctText = v => `%${Math.round(v * 100)}`;

// ---- Grafik ----
const hd = new URLSearchParams(location.search).get('hd');
const canRig = () => (!window.DD_LOCAL || window.DD_MODELS) && hd !== '0';
const wantReload = () => hd !== '1' && canRig() && TIERS[getGfx().tier].rigged !== !!window.DD_RIGGED;
function pageGfx() {
  const g = getGfx(), T = TIERS[g.tier], less = motionLess();
  const opt = (id, name, note) => `<button class="ayopt ${g.choice === id ? 'on' : ''}" data-a="aySetGfx" data-t="${id}"><b>${name}</b><small>${note}</small></button>`;
  return `<div class="ayopts">${opt('auto', 'Otomatik', `Cihazına göre seçilir; oyun takılırsa bir kademe iner. Şu an: ${TIER_NAMES[g.tier]}.`)}${TIER_KEYS.map(k => opt(k, TIER_NAMES[k], TIER_NOTES[k])).join('')}</div>
    <p class="mut aynow">${TIER_NAMES[g.tier]}: çözünürlük en çok ×${String(T.dpr).replace('.', ',')} · ${T.shadow ? `gölge ${T.shadow} piksel` : 'zemin lekesi'} · ${T.post ? 'ışıma açık' : 'ışıma kapalı'} · ${T.rigged ? 'ayrıntılı karakterler' : 'hafif karakterler'}${g.forced ? ' · adres çubuğundan zorlanmış' : ''}</p>
    ${wantReload() ? `<div class="hint ayrel"><span>Karakter modelleri oyun yeniden açılınca ${T.rigged ? 'ayrıntılı (yaklaşık 3,5 MB indirilir)' : 'hafif'} olur.</span><button class="btn sm" data-a="gfxReload">Yeniden aç</button></div>` : ''}
    <div class="row">${med('timer', less ? 'green' : '')}<div class="grow"><b>Hareketi azalt</b><br><span class="mut">Geçişleri, parlamaları ve döngülü süslemeleri durdurur.${sysCalm() ? ' Cihazının kendi ayarı zaten açık.' : ''}</span></div>${sw(less, 'ayMotion')}</div>
    <div class="row">${med('timer', 'blue')}<div class="grow"><b>Oyun Denetçisi</b><br><span class="mut">Kare hızını (FPS), kare süresini, belleği ve çizim yükünü köşede gösterir; 30 saniyelik ölçüm özeti alır.</span></div><button class="btn sm" data-a="denetci">Aç / kapat</button></div>
    <p class="mut">Telefon ısınmasın diye kare hızı sınırlıdır: savaşta 60 (Düşük kademede 30), ana üste 30, açık pencerenin arkasında 15. Otomatik kademe takılmayı kendisi giderir.</p>`;
}
ACT.aySetGfx = d => { setGfx(d.t); redraw(); };
ACT.ayMotion = () => { setMotion(!motionLess()); redraw(); };

// ---- Ses ----
const BUS_NOTE = { ui: 'Düğme, pencere, ödül ve örs sesleri', battle: 'Vuruş, büyü ve savaş sonu', amb: 'Ortam sesleri ve ezgi' };
const BUS_TEST = { ui: ['reward.coin', 'ui.toggle'], battle: ['hit.sword', 'bt.crit'], amb: ['amb.chime', 'amb.clink'] };
const slider = (bus, v, off) => `<label class="aysl ${off ? 'off' : ''}"><input type="range" min="0" max="100" step="5" value="${Math.round(v * 100)}" data-sl="${bus}" aria-label="${bus === 'master' ? 'Ana ses' : BUSES[bus]}"><output data-so="${bus}">${pctText(v)}</output></label>`;
function pageSes() {
  const a = getAudio(), all = !a.on;
  return `<div class="row aymaster">${med('send', all ? '' : 'green')}<div class="grow"><b>Ana ses</b><br><span class="mut">Bütün sesleri birlikte kısar ya da kapatır.</span>${slider('master', a.master, all)}</div>${sw(!all, 'ayMute')}</div>
    ${BUS_KEYS.map(b => `<div class="row">${med(b === 'ui' ? 'menu' : b === 'battle' ? 'battle' : 'buff', a.mute[b] || all ? '' : 'green')}<div class="grow"><b>${BUSES[b]}</b><br><span class="mut">${BUS_NOTE[b]}</span>${slider(b, a.vol[b], a.mute[b] || all)}</div><div class="qb"><button class="btn sm" data-a="ayTest" data-b="${b}" ${all || a.mute[b] ? 'disabled' : ''}>Dene</button>${sw(!a.mute[b], 'ayMute', `data-b="${b}"`)}</div></div>`).join('')}
    <p class="mut">Ses ayarları bu cihazda saklanır. Telefonun sessize alındıysa ya da başka bir uygulama ses çalıyorsa oyun sesi duyulmayabilir.</p>`;
}
ACT.ayMute = d => { if (d.b) mute(!getAudio().mute[d.b], d.b); else mute(!isMuted()); redraw(); if (!isMuted()) play('ui.toggle'); };
ACT.ayTest = d => { const n = (BUS_TEST[d.b] || []).find(hasSound); if (n) play(n); };
// Kaydırıcı: sürüklerken yalnızca ses ve yüzde yazısı güncellenir (sayfa yeniden çizilmez, parmak kaydırıcıdan kopmaz)
win.addEventListener('input', e => {
  const el = e.target, b = el.dataset?.sl;
  if (!b) return;
  const v = Math.max(0, Math.min(100, Number(el.value) || 0)) / 100;
  setVolume(b, v);
  const o = win.querySelector(`[data-so="${b}"]`); if (o) o.textContent = pctText(v);
  el.style.setProperty('--v', `${v * 100}%`);
});
win.addEventListener('change', e => { const b = e.target.dataset?.sl; if (b && b !== 'amb' && b !== 'master') ACT.ayTest({ b }); else if (b === 'master') play('ui.toggle'); });
onAudio(() => { if (cur() === AY && AY.tab === 'ses' && !win.querySelector('[data-sl]:active')) syncSes(); });
function syncSes() { const a = getAudio(); for (const el of win.querySelectorAll('[data-sl]')) { const v = el.dataset.sl === 'master' ? a.master : a.vol[el.dataset.sl]; el.style.setProperty('--v', `${v * 100}%`); } }

// ---- Dil ----
const LANG_NOTE = { tr: 'Oyunun asıl dili.', en: 'Arayüz ve içerik İngilizce gösterilir; özel adlar Türkçe kalır.' };
function pageDil() {
  const l = lang();
  return `<div class="ayopts two">${LANG_KEYS.map(k => `<button class="ayopt lg ${l === k ? 'on' : ''}" data-a="ayLang" data-l="${k}" lang="${k}" translate="no">${flag(k)}<b>${LANGS[k].name}</b><small>${k === 'tr' ? 'Türkçe' : 'English'} · ${k.toUpperCase()}</small></button>`).join('')}</div>
    <div class="hint">${LANG_NOTE[l]}</div>
    <p class="mut">Dil hemen değişir; oyun yeniden açılmaz, yarım kalan işin sürer. Seçimin bu cihazda ve hesabında saklanır.</p>
    <p class="mut">Sohbet mesajları, oyuncu ve klan adları, klan duyuruları çevrilmez: yazıldığı gibi görünür.</p>`;
}
ACT.ayLang = d => chooseLang(d.l);

// ---- Bildirimler (kalıcılık paketinin kategorileri: ACT.notifCat sunucuya yazar ve bu pencereyi yeniden çizer) ----
const CAT_ICON = { energy: 'energy', stock: 'mine', market: 'market', arena: 'arena', clan: 'clan', reset: 'quest', ach: 'trophy', realm: 'crown' };
function pageNotif() {
  const off = S.notif?.off || {};
  return `<div class="hint">Kapalı kategori bildirim göndermez ve zil sayacına eklenmez; kayıtları listede sessiz olarak kalır. Ayarlar hesabında saklanır.</div>
    <div class="ntgrid">${Object.entries(NOTIF_CATS).map(([k, c]) => `<div class="row">${med(CAT_ICON[k] || 'quest', off[k] ? '' : 'green')}<div class="grow"><b>${c.name}</b><br><span class="mut">${c.note}</span></div><button class="tgl${off[k] ? '' : ' on'}" data-a="notifCat" data-k="${k}" role="switch" aria-checked="${!off[k]}" aria-label="${c.name}"><i></i></button></div>`).join('')}</div>
    <div class="row">${med('gift', '')}<div class="grow"><b>Cihaz bildirimleri</b><br><span class="mut">Oyunda değilken telefonuna gelen bildirimler ve deneme düğmesi Bildirimler penceresindedir.</span></div><button class="btn sm" data-a="ayNotifs">Aç</button></div>`;
}
ACT.ayNotifs = () => ACT.notifs?.({ tab: 'set' });

// ---- Hesap ----
function pageAcc() {
  const F = FACTIONS[S.faction], D = AY.data || {};
  return `<div class="ayacc">${avatarImg('lg')}<div class="grow"><h3 translate="no">${esc(S.name)}</h3><p><b style="color:${F.color}">${F.name}</b> · Seviye ${S.lvl}</p>
      <p class="mut">${D.createdAt ? `Hesap açılışı: ${fmtDate(D.createdAt)}` : ''}</p></div></div>
    <div class="row">${med('key', '')}<div class="grow"><b>Oyuncu kimliği</b><br><span class="mut">Destek isterken bu kimliği yaz.</span><br><code class="ayid" translate="no">${D.id ? esc(D.id) : '…'}</code></div><button class="btn sm" data-a="ayCopy" ${D.id ? '' : 'disabled'}>Kopyala</button></div>
    <div class="row">${med('party', '')}<div class="grow"><b>Profil</b><br><span class="mut">Fotoğraf, unvan, istatistikler ve savaş raporları.</span></div><button class="btn sm" data-a="ayProfile">Aç</button></div>
    <div class="row">${med('events', '')}<div class="grow"><b>Fragmanı izle</b><br><span class="mut">Açılış sinematiğini yeniden oynat.</span></div><button class="btn sm" data-a="ayFragman">İzle</button></div>
    <div class="row">${med('crown', '')}<div class="grow"><b>Emeği Geçenler</b><br><span class="mut">Simge yazarları ve lisans (CC BY 3.0).</span></div><button class="btn sm" data-a="ayEmek">Aç</button></div>
    ${LOCAL ? `<div class="row">${med('lock', '')}<div class="grow"><b>Deneme kaydı</b><br><span class="mut">Bu sürümde ilerleme yalnızca bu cihazda saklanır; oturum kapatma yoktur. Kaydı silersen oyun baştan başlar.</span></div><button class="btn sm red" data-a="devReset">Kaydı sıfırla</button></div>`
      : '<p class="mut">Hesabın bu cihaza bağlıdır; oturum kapatma ve hesap taşıma henüz yoktur. Tarayıcı verilerini silersen hesaba erişimin kaybolur.</p>'}`;
}
ACT.ayCopy = async () => { const id = AY.data?.id; if (!id) return; try { await navigator.clipboard.writeText(id); toast(t('Kimlik kopyalandı.')); } catch { toast(t('Kopyalanamadı. Kimliği elle seç.')); } };
ACT.ayEmek = () => {
  const ad = [...new Set([...ICON_AUTHORS, ...SKILL_ICON_AUTHORS])].sort((a, b) => a.localeCompare(b));
  showModal(`<h3>Emeği Geçenler</h3><p class="mut">Oyundaki bazı simgeler game-icons.net katkıcılarına aittir ve CC BY 3.0 lisansıyla kullanılmıştır (<span translate="no">creativecommons.org/licenses/by/3.0</span>).</p><p translate="no"><b>${ad.map(esc).join(' · ')}</b></p><p class="mut">Eşya, yetenek, sahne, karakter ve efekt görselleri oyuna özel boyanmıştır.</p>`);
};
ACT.ayProfile = () => { ACT.closeWin(); ACT.profile(); };
ACT.ayFragman = () => { ACT.closeWin?.(); replayFragman(); };

const PAGES = { gfx: pageGfx, ses: pageSes, erisim: pageErisim, dil: pageDil, notif: pageNotif, acc: pageAcc };
const AY = {
  title: 'Ayarlar', tab: 'gfx',
  get tabs() {
    return [{ id: 'gfx', label: 'Grafik', small: TIER_NAMES[getGfx().tier], pre: tico(ICON.gfx) }, { id: 'ses', label: 'Ses', small: isMuted() ? 'Kapalı' : pctText(getAudio().master), pre: tico(ICON.ses) },
      { id: 'erisim', label: 'Erişilebilirlik', small: 'Görme, duyma, dokunma', pre: tico(ICON.erisim) }, { id: 'dil', label: 'Dil', small: LANGS[lang()].name, pre: tico(ICON.dil) }, { id: 'notif', label: 'Bildirimler', small: 'Kategoriler', pre: tico(ICON.notif) }, { id: 'acc', label: 'Hesap', small: 'Kimlik, profil', pre: tico(ICON.acc) }];
  },
  load: async tab => (tab === 'acc' ? (await run('settings.view')) || {} : {}),
  render: tab => { const h = `<div class="aypage ay-${tab}">${(PAGES[tab] || pageGfx)()}</div>`; queueMicrotask(() => { syncSes(); syncTabs(); }); return h; },
};
// Sekmelerin küçük yazısı (etkin kademe, ses yüzdesi, dil) sayfa her çizildiğinde tazelenir
function syncTabs() { if (cur() !== AY) return; const T = AY.tabs; for (const b of win.querySelectorAll('.tabs button')) { const x = T.find(y => y.id === b.dataset.id), s = b.querySelector('small'); if (x && s && s.textContent !== x.small) s.textContent = x.small; } }
ACT.settings = d => { closeModal(); AY.tab = Object.hasOwn(PAGES, d?.tab) ? d.tab : AY.tab; openWin(AY); };

// ---------- Girişler: Menü ve Profil ----------
// Menü listesine "Ayarlar" satırı, Profil düğmelerine "Ayarlar" düğmesi eklenir (özgün pencereler olduğu gibi kalır).
const baseDrawer = ACT.drawer;
ACT.drawer = () => {
  baseDrawer?.();
  const box = modal.querySelector('.box.menu .in'), at = box?.querySelector('[data-a="profile"]');
  if (box && !box.querySelector('[data-a="settings"]')) (at || box.lastElementChild).insertAdjacentHTML('beforebegin', `<button class="ibtn" data-a="settings"><span class="ico g1 sm">${GEAR}</span><span><b>Ayarlar: grafik, ses, erişilebilirlik, dil</b></span></button>`);
};
// Profil penceresi ayarları sağ üstteki dişli simgesinden açar (ui-hub.js)
// Eski Grafik penceresi (Profil → Grafik) artık Ayarlar'ın Grafik sekmesini açar
ACT.gfx = () => ACT.settings({ tab: 'gfx' });

// ---------- Açılış ekranında dil seçimi (hesap açmadan önce de değiştirilebilsin) ----------
const LANG_BTN = () => `<div class="aylang" translate="no">${LANG_KEYS.map(k => `<button data-a="ayLang" data-l="${k}" class="${lang() === k ? 'on' : ''}" lang="${k}">${flag(k)}${LANGS[k].name}</button>`).join('')}</div>`;
function titleLang() {
  const box = modal.querySelector('.box.wide');
  if (!box || !box.querySelector('#pname')) return;
  const old = box.querySelector('.aylang');
  if (old) { for (const b of old.children) b.classList.toggle('on', b.dataset.l === lang()); return; }
  box.insertAdjacentHTML('afterbegin', LANG_BTN());
}
new MutationObserver(titleLang).observe(modal, { childList: true });
onLang(titleLang);
titleLang();

// Hata iletileri: sunucunun kodu ve Türkçe iletisi i18n.js'te çevrilir (ui-core.js: run)
hooks.errText = errText;
