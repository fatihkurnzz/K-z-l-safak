// Ses paketinin arayüz bağlantıları. Sesler tek tek ekranlara serpiştirilmez; merkezî noktalardan bağlanır:
//  - tıklama yönlendirme, pencere / modal / kısa ileti (ui-core.js: hooks.sfx),
//  - her işlemin sonucu (api.js: taps): örs, ödül, satın alma, kuşanma, hata…
//  - savaşın olay akışı (combat.js → sfx.js: SFX),
//  - kayıttaki değişimler (seviye, yeni başarım) ve bildirim zili (notif.peek sonucu).
// Ayrıca: ilk dokunuşta ses bağlamını açar, yükleme ekranı ve cihazın bildirim izni penceresi açıkken sesi tutar,
// bulunulan yere (açılış, ana üs, savaş, boss) ve gün/gece ile havaya göre ortam ve ezgi döngülerini seçer,
// Menü'ye küçük bir hoparlör düğmesi koyar. Motor: audio.js · tanımlar ve eşlemeler: sfx.js.
import { ACT, hooks, hud, modal } from './ui-core.js';
import { S, onState, taps, onLock } from './api.js';
import './ui-hub.js'; // ACT.building tanımlandıktan sonra sarılır
import { phaseNow, weatherNow } from './daylight.js';
import { icmTur } from './ic-mekan.js'; // P33: iç mekân ortam sesi (GPT ses bağlamları)
import { initAudio, play, stop, hold, setLoops, mute, isMuted, onAudio, getAudio } from './audio.js';
import { SFX, tapSound, buildingSound, actionSounds, anvilSounds, errorSound, sceneLoops, ANVIL_TENSION_MS, setRace } from './sfx.js';

initAudio();

// ---------- Arayüz sesleri: aynı anda gelenlerden önemlisi çalar ----------
// Öncelik: 0 dokunuş · 1 kısa ileti · 2 pencere/modal · 3 işlem sonucu, hata, bina. 70 ms içinde gelen daha düşük öncelikli ses atlanır.
let lastAt = -1e9, lastPr = 0, closing = null;
function ui(name, pr = 1, opts) {
  if (!name) return null;
  const t = performance.now();
  if (t - lastAt < 70 && pr < lastPr) return null;
  lastAt = t; lastPr = pr; closing = null;
  return play(name, opts);
}
// Kapanma sesi bir an bekler: aynı dokunuş yeni bir pencere açıyorsa (ya da savaş başlıyorsa) yalnızca o duyulur
function closeLater(name) {
  if (closing) { closing = name; return; }
  closing = name;
  queueMicrotask(() => { const n = closing; closing = null; if (n) ui(n, 1); });
}

// ---------- Örs: gerilim (çekiç darbeleri) dokunuşta başlar, sonuç sesi gerilim bitince çalar ----------
let anvilAt = -1e9;
const anvilLeft = () => Math.max(0, ANVIL_TENSION_MS - (performance.now() - anvilAt)) / 1000;

hooks.sfx = (kind, a) => {
  if (kind === 'tap') {
    if (a === 'upgrade') { anvilAt = performance.now(); ui('anvil.tension', 3); return; }
    ui(tapSound(a), 0);
  } else if (kind === 'toast') ui('ui.toast', 1);
  else if (kind === 'win') ui('ui.open', 2);
  else if (kind === 'winClose') { if (a !== true) closeLater('ui.close'); }
  else if (kind === 'modal') { ui('ui.modal', 2); /* menüdeki ses düğmesi kaldırıldı: ses Ayarlar → Ses'te */ }
  else if (kind === 'modalClose') closeLater('ui.modalClose');
};

// ---------- İşlem sonuçları ----------
let unread = null;
taps.add((type, payload, p) => {
  p.then(r => {
    if (type === 'anvil.upgrade') { const left = anvilLeft(); for (const [n, o] of anvilSounds(r)) play(n, { ...o, delay: left + (o?.delay || 0) }); return; }
    if (type === 'notif.peek') { // zil: okunmamış sayısı arttıysa (pazar satışı kendi sesiyle çalar; yeni başarımın sesi ayrıca gelir)
      if (r && Number.isInteger(r.unread)) { if (unread !== null && r.unread > unread && r.top && r.top.k !== 'ach') ui(r.top.k === 'sale' ? 'ui.sale' : 'ui.bell', 3); unread = r.unread; }
      return;
    }
    if (type === 'notif.read') { unread = 0; return; }
    for (const [n, o] of actionSounds(type, r, payload)) ui(n, 3, o);
  }, () => {
    if (type === 'anvil.upgrade') stop('anvil.tension', 0.05);
    ui(errorSound(type), 3);
  }).catch(() => { }); // ses kancasındaki bir hata oyuna "yakalanmamış hata" olarak yansımaz
});

// ---------- Kayıttaki değişimler: seviye atlama, yeni başarım ----------
let lvlWas = null, nameWas = null, achWas = null;
onState(s => {
  setRace(s?.faction); if (document.body.dataset.faction !== (s?.faction || '')) document.body.dataset.faction = s?.faction || ''; // ırk: arayüz renkleri (css/irk.css) ve UI sesi çeşidi
  if (s?.faction && document.documentElement.dataset.faction !== s.faction) document.documentElement.dataset.faction = s.faction; // 20 Kas: tema her ekranda kayıttaki halka bağlı (css html[data-faction])
  if (!s) { lvlWas = nameWas = achWas = null; return; }
  const inBattle = hud.hidden; // savaş sonucu ekranında zafer ezgisinin ardından
  if (nameWas === s.name && lvlWas !== null && s.lvl > lvlWas) play('ui.levelup', { delay: inBattle ? 1.3 : 0.15 });
  const last = s.notif?.list?.at?.(-1), key = last ? `${last.a}:${last.n}:${last.at}` : '';
  if (nameWas === s.name && achWas !== null && key && key !== achWas) play('ui.ach', { delay: inBattle ? 2.4 : 0.4 });
  lvlWas = s.lvl; nameWas = s.name; achWas = key;
});

// ---------- Binalar: etikete de 3B modele de dokunulsa aynı yerden geçer ----------
// ACT.building bir erişimciyle sarılır; başka bir modül işlevi yeniden tanımlasa da ses yerinde kalır.
{
  let fn = ACT.building;
  const wrapped = (d, b) => { ui(buildingSound(d?.id), 3); return fn?.(d, b); };
  Object.defineProperty(ACT, 'building', { configurable: true, enumerable: true, get: () => wrapped, set: f => { fn = f; } });
}
// Savaş arayüzünün düğmeleri (hız, oto, çekil, yetenekler) data-a kullanmaz
document.getElementById('battleUI')?.addEventListener('click', e => { if (e.target.closest?.('button')) ui('ui.tap', 0); });

// ---------- Ses çıkmaması gereken anlar ----------
// Yükleme ekranı: intro müziği çalar; ekran kalkınca ana ekran müziğine geçilir
{
  const L = document.getElementById('loading');
  if (L?.parentNode) {
    const mo = new MutationObserver(() => { if (!L.isConnected) { mo.disconnect(); refresh(); } });
    mo.observe(L.parentNode, { childList: true });
  }
}
// Cihazın bildirim izni penceresi: tarayıcıda Notification.requestPermission, Android paketinde LocalNotifications eklentisi
const during = async (reason, fn) => { hold(reason, true); try { return await fn(); } finally { hold(reason, false); } };
try {
  const N = window.Notification;
  if (N && typeof N.requestPermission === 'function') { const orig = N.requestPermission.bind(N); N.requestPermission = (...a) => during('izin', () => orig(...a)); }
  const C = window.Capacitor;
  if (C && typeof C.nativePromise === 'function') { const orig = C.nativePromise.bind(C); C.nativePromise = (plugin, method, ...a) => (method === 'requestPermissions' ? during('izin', () => orig(plugin, method, ...a)) : orig(plugin, method, ...a)); }
} catch { }

// Yasak, başka cihazda açılan oturum ya da eski sürüm ekranı (ui-guvenlik.js): oyun kilitliyken ses çıkmaz
onLock(() => hold('kilit', true));

// ---------- Ortam ve ezgi: bulunulan yere göre ----------
const battleUI = document.getElementById('battleUI'), root = document.documentElement;
let wasBattle = false, sceneKey = '', scenePlace = '';
function scene() {
  if (document.getElementById('loading')) return { place: 'loading' };
  if (document.getElementById('fragman')) return { place: 'fragman' }; // 22 Kas: fragmanda tema müziği çalar
  const wx = { phase: phaseNow(), weather: weatherNow() };
  if (battleUI && !battleUI.hidden) { wasBattle = true; return { place: SFX.over ? 'result' : SFX.boss ? 'boss' : 'battle', zemin: globalThis.DD_ZEMIN?.aktif, ...wx }; }
  { const it = icmTur(); if (S && ['han', 'ahir', 'ors', 'maden', 'klan'].includes(it)) { wasBattle = false; return { place: 'icm', tur: it, faction: S.faction, ust: root.dataset.place === 'carsi' ? 'carsi' : 'hub', ...wx }; } }
  if (!hud.hidden && S) { wasBattle = false; return { place: document.documentElement.dataset.place === 'carsi' ? 'carsi' : 'hub', faction: S.faction, ...wx }; }
  if (S) return wasBattle ? { place: 'result', ...wx } : null; // geçiş anı (savaş kuruluyor): olduğu gibi kalsın
  return root.dataset.faction ? { place: 'hub', faction: root.dataset.faction, ...wx } : { place: 'title' }; // açılış: dokunulan tarafın havası önizlenir
}
function refresh() {
  const sc = scene();
  if (!sc) return;
  const list = sceneLoops(sc), key = list.join(), place = (sc.ust || sc.place) + (sc.faction || ''); // P33: iç mekâna girince ezgi baştan başlamasın (yalnız ortam değişir)
  if (key !== sceneKey || place !== scenePlace) { const moved = !!scenePlace && place !== scenePlace; sceneKey = key; scenePlace = place; setLoops(list, moved); } // yer değişince ezgi baştan
}
SFX.onScene = refresh;
hooks.sesSahne = refresh; // P33: iç mekân açılıp kapanınca (ic-mekan.js)
{
  const mo = new MutationObserver(refresh);
  mo.observe(hud, { attributes: true, attributeFilter: ['hidden'] });
  if (battleUI) mo.observe(battleUI, { attributes: true, attributeFilter: ['hidden'] });
  mo.observe(root, { attributes: true, attributeFilter: ['data-faction'] });
  onState(() => queueMicrotask(refresh));
  setInterval(refresh, 20000); // günün evresi ve hava değişince
  refresh();
}

// ---------- Menü: hoparlör düğmesi ----------
const SPK = on => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9.5h4l5-4.2v13.4l-5-4.2H3z"/>${on ? '<path d="M15 8.6a4.6 4.6 0 0 1 0 6.8M17.6 6a8.4 8.4 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>' : '<path d="M15.5 9.5l5 5m0-5l-5 5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/>'}</svg>`;
const sesLabel = () => (isMuted() ? 'Ses kapalı. Açmak için dokun.' : 'Ses açık. Kapatmak için dokun.');
function menuButton() {
  const box = modal.querySelector('.box.menu');
  if (!box || box.querySelector('.sesbtn')) return;
  box.insertAdjacentHTML('afterbegin', `<button class="sesbtn${isMuted() ? ' off' : ''}" data-a="sesToggle" title="${sesLabel()}" aria-label="${sesLabel()}">${SPK(!isMuted())}</button>`);
}
ACT.sesToggle = () => { mute(!isMuted()); if (!isMuted()) play('ui.toggle'); };
onAudio(() => { for (const b of document.querySelectorAll('.sesbtn')) { b.classList.toggle('off', isMuted()); b.title = sesLabel(); b.setAttribute('aria-label', sesLabel()); b.innerHTML = SPK(!isMuted()); } });

// Hata ayıklama ve otomatik denemeler için (kural içermez)
window.DD_AUDIO = { getAudio, scene: () => sceneKey };
