// P33 · Canlılık ve geri bildirim katmanı (AAA geliştirme planı bölüm 2, 3, 5, 6, 8, 9, 11). YALNIZ SUNUM:
// kural, hasar, ödül, oran, ekonomi, kayıt DEĞİŞMEZ (shared/ içe alınan tek şey realm.js'in salt okunur gün evresi işlevi).
//  1. Haritalarda süzülen zerreler (Kragmir kor ve kül, Elentha/çarşı ışık tozu ve uzak kuşlar) ve Işınlanma Kapısı'nda halk renginde
//     parçacıklar. Fotoğrafın üstünde AYRI, dokunulmaz tuval; bina, sancak, arma, resim değişmez (P28 "yalnız fotoğraf" ilkesi korunur).
//  2. Gün evresi tonu (sabah / gündüz / akşam / gece): oyun saatine (UTC+3, shared/realm.js phaseOf) göre resmin üstünde hafif renk.
//     Gece en çok %26 koyulaşır; etiketler ve HUD tonun üstündedir. Deneme: ?tod=dawn|day|dusk|night.
//  3. Örs sonucu (başarı kıvılcımı / başarısızlıkta sönen ışık / kırılma), seviye atlama ve başarım şeridi, para ve deneyim akışı.
//  4. Ayarlar: Çevre animasyonları (dd_canli), Efekt yoğunluğu (dd_efekt: 'az'), Kare hızı sınırı (dd_fps: '30'), Pil tasarrufu (dd_pil).
//     "Hareketi azalt" (dd_motion) açıkken 1 ve 3'ün hareketli kısımları çizilmez. Sekme arka plandayken tuval durur.
import { taps, onState, now } from './api.js';
import { phaseOf } from '../shared/realm.js';
import { S2 } from './hub2d.js';
import { ANVIL_TENSION_MS } from './sfx.js';

const LS = { get: k => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch { } } };
const root = document.documentElement, Q = new URLSearchParams(location.search);
const sakin = () => root.classList.contains('motion-less') || !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// ---------------- Ayarlar ----------------
export const AYAR = {
  get canli() { return LS.get('dd_canli') !== '0' && !this.pil; },
  get efektAz() { return LS.get('dd_efekt') === 'az' || this.pil; },
  get fps30() { return LS.get('dd_fps') === '30' || this.pil; },
  get pil() { return LS.get('dd_pil') === '1'; },
};
export function ayarla(k, on) {
  if (k === 'canli') LS.set('dd_canli', on ? null : '0');
  else if (k === 'efekt') LS.set('dd_efekt', on ? 'az' : null);
  else if (k === 'fps') LS.set('dd_fps', on ? '30' : null);
  else if (k === 'pil') LS.set('dd_pil', on ? '1' : null);
  uygula();
}
let FPS0 = null;
function uygula() {
  root.classList.toggle('p33-canli-yok', !AYAR.canli);
  root.classList.toggle('p33-efekt-az', AYAR.efektAz);
  root.classList.toggle('p33-pil', AYAR.pil);
  globalThis.DD_EFEKT = AYAR.efektAz ? 0.5 : 1; // fx.js N(): parçacık sayısı
  import('./engine3d.js').then(m => { // kare hızı sınırı: savaşta 60 → 30 (ana üs zaten 30, pencere arkası 15)
    const C = m.FPS_CAP; if (!C) return; FPS0 ??= { ...C };
    C.battle = AYAR.fps30 ? Math.min(30, FPS0.battle) : FPS0.battle;
    C.scene = AYAR.pil ? Math.min(20, FPS0.scene) : FPS0.scene;
  }).catch(() => { });
  zerreKur();
}

// ---------------- 1 + 2. Harita katmanı ----------------
const RENK = {
  ocak: { zerre: ['255,150,60', '255,96,32', '150,140,130'], portal: ['220,50,40', '150,60,200', '255,140,60'], kus: false, yukari: true },
  sancak: { zerre: ['255,236,180', '210,230,255'], portal: ['90,160,255', '255,210,110', '200,230,255'], kus: true, yukari: false },
  carsi: { zerre: ['255,226,170', '240,220,200'], portal: null, kus: true, yukari: false },
  klan: { zerre: ['255,170,90', '230,220,200'], portal: null, kus: false, yukari: true },
};
const EVRE_TON = { // gradyan, karışım; gündüz ton yok
  dawn: 'linear-gradient(180deg, rgba(255,170,140,.16), rgba(255,200,160,.05) 55%, rgba(0,0,0,0))',
  dusk: 'linear-gradient(180deg, rgba(255,120,60,.18), rgba(140,60,90,.10) 60%, rgba(30,10,30,.10))',
  night: 'linear-gradient(180deg, rgba(10,20,60,.30), rgba(10,16,40,.22) 60%, rgba(0,0,10,.26))',
};
let kutu = null, cv = null, ctx = null, raf = 0, P = [], son = 0, yer = '', kusT = 0, kuslar = [];
const evre = () => { const f = Q.get('tod'); return ['dawn', 'day', 'dusk', 'night'].includes(f) ? f : phaseOf(now()); };
function tonKur() {
  if (!kutu) return;
  let t = kutu.querySelector('.p33-ton'); if (!t) { t = document.createElement('div'); t.className = 'p33-ton'; t.setAttribute('aria-hidden', 'true'); kutu.appendChild(t); }
  const e = evre(); t.dataset.evre = e; t.style.background = EVRE_TON[e] || 'none';
  root.dataset.p33Evre = e;
}
function yerOf() { const h = root.dataset.hub2d || ''; return h === 'klan' ? 'klan' : h === 'carsi' ? 'carsi' : root.dataset.faction === 'sancak' ? 'sancak' : 'ocak'; }
function zerreKur() {
  kutu = document.querySelector('#hub2d .s2-box.s2-foto');
  if (!kutu) return dur();
  tonKur();
  const ac = AYAR.canli && !sakin();
  if (!ac) { cv?.remove(); cv = ctx = null; return dur(); }
  if (!cv || !kutu.contains(cv)) { cv = document.createElement('canvas'); cv.className = 'p33-zerre'; cv.setAttribute('aria-hidden', 'true'); kutu.appendChild(cv); ctx = cv.getContext('2d'); P = []; }
  yer = yerOf(); boyut(); if (!raf) raf = requestAnimationFrame(ciz);
}
function dur() { if (raf) cancelAnimationFrame(raf); raf = 0; }
function boyut() { if (!cv || !kutu) return; const r = kutu.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1); cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d); cv.style.width = r.width + 'px'; cv.style.height = r.height + 'px'; }
const R = (a, b) => a + Math.random() * (b - a);
function yeni(W, H, portal) {
  const c = RENK[yer] || RENK.ocak;
  if (portal) { const pc = c.portal; const a = R(0, Math.PI * 2), r = R(.006, .03) * W; return { x: portal.x + Math.cos(a) * r, y: portal.y + Math.sin(a) * r * .9, vx: R(-.004, .004) * W, vy: -R(.006, .02) * H, o: 0, life: R(1, 2.2), t: 0, s: R(.0012, .0026) * W, c: pc[(Math.random() * pc.length) | 0], p: 1 }; }
  return { x: R(0, W), y: c.yukari ? R(H * .35, H * 1.02) : R(0, H), vx: R(-.006, .006) * W, vy: (c.yukari ? -R(.012, .03) : R(-.006, .006)) * H, o: 0, life: R(4, 9), t: 0, s: R(.0008, .0022) * W, c: c.zerre[(Math.random() * c.zerre.length) | 0], p: 0 };
}
function ciz(t) {
  raf = 0;
  if (!cv || !cv.isConnected || !AYAR.canli || sakin()) return;
  raf = requestAnimationFrame(ciz);
  if (document.hidden || document.querySelector('#win:not([hidden]), #p28bina:not([hidden]), .icm')) { son = t; return; } // pencere/iç mekân açıkken durur (pil)
  const aralik = AYAR.pil ? 66 : 33; if (t - son < aralik) return; // en çok 30 (pil: 15) kare/sn
  const dt = Math.min(.1, (t - (son || t)) / 1000); son = t;
  const W = cv.width, H = cv.height, c = RENK[yer] || RENK.ocak, az = AYAR.efektAz ? .5 : 1;
  const hedef = Math.round((W > 1400 ? 46 : 32) * az), pq = S2.portal && c.portal ? { x: S2.portal[0] / 100 * W, y: (S2.portal[1] + 6) / 100 * H } : null;
  const pHedef = pq ? Math.round(14 * az) : 0;
  let nz = 0, np = 0; for (const p of P) p.p ? np++ : nz++;
  for (; nz < hedef; nz++) P.push(yeni(W, H, null));
  for (; np < pHedef; np++) P.push(yeni(W, H, pq));
  ctx.clearRect(0, 0, W, H); ctx.globalCompositeOperation = 'lighter';
  for (let i = P.length - 1; i >= 0; i--) {
    const p = P[i]; p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx += Math.sin(t / 900 + i) * .0004 * W * dt;
    const k = p.t / p.life; if (k >= 1 || p.y < -10 || p.y > H + 10) { P.splice(i, 1); continue; }
    const o = Math.sin(Math.PI * k) * (p.p ? .75 : .45);
    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.s * 3);
    g.addColorStop(0, `rgba(${p.c},${o})`); g.addColorStop(1, `rgba(${p.c},0)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.s * 3, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';
  // uzak kuş sürüsü (Elentha, çarşı): gündüz/sabah, 25–45 sn'de bir, gökyüzü bandında
  if (c.kus && evre() !== 'night') {
    kusT -= dt; if (kusT <= 0 && !kuslar.length) { kusT = R(25, 45); const n = 3 + (Math.random() * 3 | 0), y0 = R(.06, .2) * H, sag = Math.random() < .5; for (let i = 0; i < n; i++) kuslar.push({ x: sag ? -20 - i * 14 : W + 20 + i * 14, y: y0 + R(-8, 8), v: (sag ? 1 : -1) * R(.05, .07) * W, f: R(0, 6) }); }
    ctx.strokeStyle = 'rgba(30,30,40,.55)'; ctx.lineWidth = Math.max(1, W / 1400);
    for (let i = kuslar.length - 1; i >= 0; i--) { const b = kuslar[i]; b.x += b.v * dt; b.f += dt * 9; const w = W * .006, h = Math.sin(b.f) * w * .5; ctx.beginPath(); ctx.moveTo(b.x - w, b.y - h); ctx.lineTo(b.x, b.y); ctx.lineTo(b.x + w, b.y - h); ctx.stroke(); if (b.x < -40 || b.x > W + 40) kuslar.splice(i, 1); }
  }
}
// hub2d sahneyi her yer değişiminde yeniden kurar: katmanı izleyip yeniden bağlan
const izle = new MutationObserver(() => { const k = document.querySelector('#hub2d .s2-box.s2-foto'); if (k !== kutu || (k && !k.querySelector('.p33-ton'))) zerreKur(); });
function izleBasla() { const h = document.getElementById('hub2d'); if (h) { izle.observe(h, { childList: true }); zerreKur(); return true; } return false; }
if (!izleBasla()) { const mo = new MutationObserver(() => { if (izleBasla()) mo.disconnect(); }); mo.observe(document.body, { childList: true, subtree: true }); }
new MutationObserver(() => zerreKur()).observe(root, { attributes: true, attributeFilter: ['class', 'data-hub2d', 'data-faction'] });
addEventListener('resize', () => requestAnimationFrame(boyut));
document.addEventListener('visibilitychange', () => { if (!document.hidden) { tonKur(); zerreKur(); } });
setInterval(tonKur, 60000); // evre değişimi (geçiş CSS'te 4 sn)

// ---------------- 3. Geri bildirimler ----------------
function serit(ust, alt, tur) { // seviye / başarım şeridi: 2,2 sn, dokunulmaz, işlem sonucunu örtmez (üst bant)
  const d = document.createElement('div'); d.className = 'p33-serit ' + tur; d.setAttribute('role', 'status');
  d.innerHTML = '<b></b><small></small>'; d.firstChild.textContent = ust; d.lastChild.textContent = alt;
  document.body.appendChild(d); setTimeout(() => d.remove(), 2400);
}
function orsSonuc(r) {
  const w = document.querySelector('#win:not([hidden]) .frame') || document.querySelector('#win:not([hidden])'); if (!w || !r?.out) return;
  const k = r.out === 'ok' ? (r.plus >= 7 ? 'ok buyuk' : 'ok') : r.out === 'break' ? 'kirik' : r.out === 'safe' ? 'korundu' : 'sondu';
  const f = document.createElement('div'); f.className = 'p33-ors ' + k; f.setAttribute('aria-hidden', 'true');
  if (r.out === 'ok' && !sakin()) for (let i = 0; i < (AYAR.efektAz ? 8 : 16); i++) { const s = document.createElement('i'); s.style.setProperty('--a', `${Math.round(R(0, 360))}deg`); s.style.setProperty('--d', `${Math.round(R(40, 110))}px`); s.style.animationDelay = `${Math.round(R(0, 120))}ms`; f.appendChild(s); }
  w.appendChild(f); setTimeout(() => f.remove(), 1300);
}
// Görev tamamlama, sandık/ödül paketi, unvan: gerçek başarılı sonuçtan sonra kısa şerit (ödül miktarı ve içerik değişmez; ganimet penceresi kendi ekranında)
const SERIT = { 'quest.claim': ['Görev tamamlandı', 'Ödülün alındı', 'gorev'], 'weekly.claim': ['Haftalık görev tamamlandı', 'Ödülün alındı', 'gorev'], 'clan.quest': ['Klan görevi tamamlandı', 'Katkın yazıldı', 'gorev'],
  'quest.bonus': ['Sandık açıldı', 'Görev sandığı', 'sandik'], 'weekly.bonus': ['Sandık açıldı', 'Haftalık sandık', 'sandik'], 'clan.claim': ['Sandık açıldı', 'Klan sandığı', 'sandik'], 'cal.claim': ['Günün ödülü', 'Takvim', 'sandik'],
  'season.title': ['Unvan kazanıldı', 'Sezon unvanı', 'unvan'] };
taps.add((type, payload, p) => {
  const T = SERIT[type]; if (!T) return;
  p.then(r => { if (r && r.ok !== false && !r.error) setTimeout(() => serit(T[0], T[1], T[2]), 250); }).catch(() => { });
});
taps.add((type, payload, p) => {
  if (type !== 'anvil.upgrade') return;
  const t0 = performance.now();
  p.then(r => setTimeout(() => orsSonuc(r), Math.max(0, ANVIL_TENSION_MS - (performance.now() - t0)))).catch(() => { });
});
let lv = null, ad = null, ach = null;
onState(s => {
  if (!s) { lv = ad = ach = null; return; }
  if (ad === s.name && lv !== null && s.lvl > lv) { const n = s.lvl; setTimeout(() => serit(`Seviye ${n}`, 'Yeni güç kazandın', 'seviye'), document.getElementById('battleUI')?.hidden === false ? 1300 : 150); }
  const last = s.notif?.list?.at?.(-1), key = last ? `${last.a}:${last.n}:${last.at}` : '';
  if (ad === s.name && ach !== null && key && key !== ach && last?.k === 'ach') setTimeout(() => serit('Başarım', String(last.n || last.a || ''), 'basarim'), 600);
  lv = s.lvl; ad = s.name; ach = key;
});

// Para ve deneyim akışı (200–400 ms): HUD yeniden çizilse de önceki değerden akar
const sayi = t => Number(String(t).replace(/[^\d]/g, '')) || 0, fmtTR = n => n.toLocaleString('tr-TR');
const onceki = new Map();
let yaziyor = 0; // kendi yazdığımız ara değerler gözlemciyi tetiklemesin
const yaz = (el, v) => { yaziyor++; el.textContent = v; Promise.resolve().then(() => yaziyor--); };
function akit(el, key) {
  const yeniV = sayi(el.textContent), eski = onceki.get(key); onceki.set(key, yeniV);
  if (eski === undefined || eski === yeniV || sakin() || Math.abs(yeniV - eski) > 1e9) return;
  const t0 = performance.now(), D = 360, metin = el.textContent;
  el.classList.add(yeniV > eski ? 'p33-art' : 'p33-azal');
  const adim = () => { if (!el.isConnected) return; const k = Math.min(1, (performance.now() - t0) / D), v = Math.round(eski + (yeniV - eski) * (1 - (1 - k) ** 3)); if (k < 1) { yaz(el, fmtTR(v)); requestAnimationFrame(adim); } else { yaz(el, metin); setTimeout(() => el.classList.remove('p33-art', 'p33-azal'), 250); } };
  requestAnimationFrame(adim);
}
function expAkit(i) { const w = parseFloat(i.style.width), e = onceki.get('exp'); onceki.set('exp', w); if (e === undefined || e === w || sakin() || !(w >= e)) return; i.style.transition = 'none'; i.style.width = e + '%'; requestAnimationFrame(() => requestAnimationFrame(() => { i.style.transition = 'width 380ms cubic-bezier(.2,.8,.2,1)'; i.style.width = w + '%'; })); }
function hudBak() {
  for (const k of ['akce', 'yakut']) { const b = document.querySelector(`#hud .s2-cap-${k} > b`); if (b) akit(b, k); }
  const i = document.querySelector('#hud .s2-exp i'); if (i && i.dataset.p33x !== i.style.width) { i.dataset.p33x = i.style.width; expAkit(i); }
}
{ const h = document.getElementById('hud'); if (h) new MutationObserver(() => { if (!yaziyor) hudBak(); }).observe(h, { childList: true, subtree: true, characterData: true }); }

uygula();
