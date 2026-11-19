// "guvenlik" paketi: oyunun geri kalanını kapatan tam ekran durumlar ve sohbetteki susturma bildirimi.
//  - Yasak: neden (sade kategori), bitiş (sunucu saati), geri sayım, ne yapılacağı. Süre dolunca kendiliğinden oyuna döner.
//  - Başka cihazda açılan oturum ve güncellemeden önce açılmış sekme: tek düğmeyle yenileme.
//  - Susturma: sohbette yazı kutusunun yerinde neden ve bitiş.
// Hiçbir şeyi kendisi hesaplamaz: metinler ve süreler sunucudan gelir (shared/guard.js: banView, shared/social.js: muteView);
// geri sayım sunucu saatine göre düzeltilmiş saatle (api.js: now) yapılır.
import { onLock, recheckBan, now } from './api.js';
import { hooks, esc } from './ui-core.js';
import { renderer } from './engine3d.js';

const two = n => String(n).padStart(2, '0');
// Kalan süre: "2 gün 03:12:45" ya da "03:12:45"
const left = ms => { const s = Math.max(0, Math.ceil(ms / 1000)), d = Math.floor(s / 86400); return `${d ? d + ' gün ' : ''}${two(Math.floor(s % 86400 / 3600))}:${two(Math.floor(s % 3600 / 60))}:${two(s % 60)}`; };

// Amblemler: kapalı hisar kapısı (yasak), iki cihaz (oturum), dönen ok ve örs (güncelleme). Özgün, düz çizgi çizimler.
const ART = {
  ban: '<svg viewBox="0 0 96 96" aria-hidden="true"><path class="s" d="M14 88V44C14 22 30 10 48 10s34 12 34 34v44"/><path class="f" d="M22 88V45c0-17 12-27 26-27s26 10 26 27v43z"/><path class="s t" d="M31 88V30M42.5 88V22M53.5 88V22M65 88V30M22 46h52M22 62h52M22 78h52"/><rect class="p" x="36" y="50" width="24" height="20" rx="4"/><path class="s" d="M41 50v-6a7 7 0 0 1 14 0v6"/><circle class="k" cx="48" cy="59" r="3"/><path class="k" d="M46.6 60h2.8l1 6h-4.8z"/></svg>',
  session: '<svg viewBox="0 0 96 96" aria-hidden="true"><rect class="f" x="8" y="26" width="46" height="30" rx="5"/><rect class="s" x="8" y="26" width="46" height="30" rx="5"/><path class="s" d="M22 64h18M31 56v8"/><rect class="p" x="60" y="34" width="26" height="46" rx="6"/><path class="s t" d="M68 73h10"/><path class="s a" d="M40 78c8 6 16 6 20 2M40 78l1.5 8M40 78l8-1"/><path class="s a" d="M56 22c6-6 14-6 20 0M76 22l-8 0M76 22l0-8"/></svg>',
  stale: '<svg viewBox="0 0 96 96" aria-hidden="true"><path class="s a" d="M20 44a29 29 0 0 1 52-14M72 30V16M72 30H58"/><path class="s a" d="M76 52a29 29 0 0 1-52 14M24 66v14M24 66h14"/><path class="p" d="M32 42h30c5 0 9 3 10 7H54v5h6v4H36v-4h6v-5c-6 0-10-3-10-7z"/></svg>',
};

let root = null, timer = null, state = null, busy = false;
function mount() {
  if (root) return root;
  root = document.createElement('div');
  root.id = 'gvlock';
  root.setAttribute('role', 'alertdialog');
  (document.getElementById('game') || document.body).appendChild(root);
  root.addEventListener('click', e => {
    const b = e.target.closest('[data-gv]');
    if (!b || b.disabled) return;
    if (b.dataset.gv === 'reload') location.reload();
    if (b.dataset.gv === 'check') check(true);
  });
  return root;
}
const row = (k, v, cls = '') => `<div class="gv-row ${cls}"><span>${k}</span><b>${v}</b></div>`;
function body(L) {
  if (L.kind === 'session') return { art: ART.session, title: 'Hesabın başka bir cihazda açıldı', html: `
    <p>Bu hesap az önce başka bir cihazda ya da sekmede açıldı. Aynı anda yalnızca bir yerde oynanabilir.</p>
    <p class="gv-sub">İlerlemen sunucuda kayıtlı. Bu ekranda yarım kalmış bir savaş varsa sonucu sayılmaz.</p>
    <div class="gv-btns"><button class="btn red" data-gv="reload">Buradan devam et</button></div>
    <p class="gv-foot">Burada devam edersen diğer cihazdaki oyun kapanır.</p>` };
  if (L.kind === 'stale') return { art: ART.stale, title: 'Oyun güncellendi', html: `
    <p>Bu sekme güncellemeden önce açılmış. Devam etmek için sayfayı yenile.</p>
    <p class="gv-sub">İlerlemen sunucuda kayıtlı. Güncellemeden önce başlamış bir savaş varsa sonucu sayılmaz.</p>
    <div class="gv-btns"><button class="btn red" data-gv="reload">Yenile</button></div>` };
  const who = `${L.name ? `Oyuncu: <b>${esc(L.name)}</b>` : ''}${L.id !== undefined ? ` · Numara: <b>${esc(L.id)}</b>` : ''}`;
  const appeal = L.contact ? `Bir yanlışlık olduğunu düşünüyorsan oyuncu adın ve numaranla yaz: <b class="gv-sel">${esc(L.contact)}</b>` : 'Bir yanlışlık olduğunu düşünüyorsan oyunun destek adresine oyuncu adın ve numaranla yaz.';
  return { art: ART.ban, title: L.perm ? 'Hesabın kalıcı olarak kapatıldı' : 'Hesabın geçici olarak kapatıldı', html: `
    ${row('Neden', esc(L.reason || ''), 'why')}
    ${L.perm ? row('Bitiş', 'Süresiz: yönetici kararı kaldırana dek') : row('Bitiş', `${esc(L.end || '')} <small>sunucu saati (UTC+3)</small>`) + row('Kalan', `<span id="gvleft">${left(L.until - now())}</span>`, 'left')}
    <p class="gv-sub">${L.perm ? 'Bu hesapla oyuna girilemez.' : 'Süre dolduğunda oyun bu ekrandan kendiliğinden açılır; ilerlemen ve eşyaların yerinde durur.'} ${appeal}</p>
    <div class="gv-btns"><span class="gv-who">${who}</span><button class="btn" data-gv="check">Şimdi denetle</button></div>
    <p class="gv-foot" id="gvnote"></p>` };
}
function draw(L) {
  const B = body(L), el = mount();
  el.className = `gv-${L.kind}${L.perm ? ' gv-perm' : ''}`;
  el.innerHTML = `<div class="gv-panel"><div class="gv-art">${B.art}</div><div class="gv-main"><h2>${B.title}</h2><div class="gv-in">${B.html}</div></div></div>`;
}
const note = t => { const n = document.getElementById('gvnote'); if (n) n.textContent = t; };
// Yasak sürüyor mu: süre dolunca, dakikada bir (yönetici erken kaldırmış olabilir) ve düğmeyle sorulur
let nextAt = 0;
async function check(manual) {
  if (busy || state?.kind !== 'ban') return;
  busy = true;
  if (manual) note('Denetleniyor…');
  try {
    const b = await recheckBan();
    if (!b) { note('Yasağın bitti. Oyun açılıyor…'); clearInterval(timer); return location.reload(); }
    if (manual) note(b.perm ? 'Yasak sürüyor.' : `Yasak sürüyor. Bitiş: ${b.end} (sunucu saati).`);
  } catch { note('Sunucuya ulaşılamadı. Birazdan yeniden denenecek.'); }
  finally { busy = false; nextAt = now() + (state?.perm ? 300000 : 60000); }
}
function tick() {
  if (state?.kind !== 'ban') return;
  const el = document.getElementById('gvleft'), ms = state.perm ? Infinity : state.until - now();
  if (el) el.textContent = left(ms);
  if (!document.hidden && (ms <= 0 || now() >= nextAt)) { if (ms <= 0) nextAt = now() + 5000; check(false); }
}

onLock(L => {
  const fresh = !state;
  state = L;
  if (fresh || L.kind !== 'ban') draw(L);
  else { // yasak bilgisi yenilendi (süre uzamış ya da kalıcıya dönmüş olabilir)
    const n = document.getElementById('gvnote')?.textContent || '';
    draw(L); note(n);
  }
  if (!fresh) return;
  // Oyunun geri kalanı kapanır: arayüz katmanları gizlenir, 3B sahne çizimi durur (kilitten yalnızca yenilemeyle çıkılır)
  document.documentElement.classList.add('gv-locked');
  try { renderer.setAnimationLoop(null); } catch { }
  document.activeElement?.blur?.();
  if (L.kind === 'ban') { nextAt = now() + (L.perm ? 300000 : 60000); timer = setInterval(tick, 1000); document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); }); }
});

// ---------- Sohbette susturma bildirimi ----------
// ui-social.js sohbet listesini ve önizlemeyi her yenilediğinde çağırır (mute: { until, end, why } ya da null)
const MUTE_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-8l-5 4v-4H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><path class="x" d="M8.5 7.5l7 6M15.5 7.5l-7 6"/></svg>';
const short = ms => { const s = Math.max(0, Math.ceil(ms / 1000)); return s >= 3600 ? `${Math.floor(s / 3600)} sa ${two(Math.floor(s % 3600 / 60))} dk` : `${two(Math.floor(s / 60))}:${two(s % 60)}`; };
let mute = null, muteT = null;
function paintMute() {
  const on = mute && mute.until > now() ? mute : null;
  // tam ekran sohbet: yazı kutusunun yerinde
  const chin = document.querySelector('#win .chat .chin');
  let box = document.querySelector('#win .chat .gv-mute');
  if (chin) {
    chin.classList.toggle('gv-off', !!on);
    if (on && !box) { box = document.createElement('div'); box.className = 'gv-mute'; chin.before(box); }
    if (!on && box) box.remove();
    if (on) box.innerHTML = `${MUTE_ICON}<div><b>Sohbetin kapalı.</b> ${esc(on.why)}<br><span>Bitiş: <b>${esc(on.end)}</b> (sunucu saati) · Kalan: <b>${short(on.until - now())}</b></span></div>`;
  }
  // ana üsteki sohbet şeridi: yazı kutusunun yerinde kısa bildirim (dokununca sohbet açılır)
  const cin = document.querySelector('#chatbar .cb-in'), inp = document.getElementById('cbtext');
  let tag = document.querySelector('#chatbar .gv-cbm');
  if (cin && inp) {
    inp.classList.toggle('gv-off', !!on);
    if (on && !tag) { tag = document.createElement('button'); tag.className = 'gv-cbm'; tag.dataset.a = 'chatOpen'; cin.prepend(tag); }
    if (!on && tag) tag.remove();
    if (on) tag.innerHTML = `${MUTE_ICON}<span>Sohbetin kapalı · kalan ${short(on.until - now())}</span>`;
  }
  if (!on) { clearInterval(muteT); muteT = null; mute = null; }
}
function setMute(m) {
  mute = m && m.until > now() ? m : null;
  paintMute();
  if (mute && !muteT) muteT = setInterval(paintMute, 1000);
}
hooks.chatMute = m => setMute(m);
// Susturulmuşken gönderilen mesajın reddi de nedeni ve bitişi taşır: bildirim hemen çizilir (bildirim yazısı ayrıca görünür)
{ const prev = hooks.err; hooks.err = e => { if (e?.code === 'muted' && e.info?.mute) setMute(e.info.mute); return prev?.(e) || false; }; }
