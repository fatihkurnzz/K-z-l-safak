// Ekran yönü. Oyun yalnızca yatay çizilir:
//  - Mantıksal ekran boyutu (view.w × view.h) burada ölçülür; bütün çizim ve yerleşim bunu kullanır.
//  - Dokunmatik cihaz dik tutuluyorsa sayfanın gövdesi (body: #game ve gövdeye eklenen bütün katmanlar) CSS ile 90°
//    döndürülür (html.rot, css/v10-yon.css). Engel katmanı yok: oyun dik telefonda da hemen yatay açılır.
//  - Döndürülmüş kipte sistem klavyesi dik açılacağı için yazı kutuları oyunun kendi yatay klavyesini açar (ui-klavye.js).
//  - Telefon gerçekten yatay tutuluyorsa döndürme yok; masaüstünde (ince işaretçi) hiç devreye girmez.
//  - İlk dokunuşta sessizce tam ekran + yatay kilit denenir (Android Chrome); olmazsa hiçbir şey gösterilmez.
export const view = { w: window.innerWidth, h: window.innerHeight, rot: false };
const subs = new Set();
export const onView = fn => { subs.add(fn); return () => subs.delete(fn); };
const coarse = () => !!window.matchMedia?.('(pointer: coarse)').matches;
const root = document.documentElement;

// Sayfa başka bir iskeletin içinde yayınlanırsa (deneme derlemesi) yakınlaştırmayı kapatan ayar eksik olabilir:
// iOS yazı kutusuna dokununca sayfayı büyütür ve öyle bırakır, ekranın kenarları taşar. Yazı kutuları bu yüzden
// 16 px'tir (index.html); burada da görünüm ayarı tamamlanır.
// Ayar hiç yoksa (yerel sunucu, iskeletsiz dosya) eklenir: yoksa telefon sayfayı 980 px genişliğinde masaüstü gibi çizer.
let mv = document.querySelector('meta[name="viewport"]');
if (!mv) { mv = document.createElement('meta'); mv.name = 'viewport'; mv.content = 'width=device-width, initial-scale=1'; document.head.appendChild(mv); }
if (!/maximum-scale/.test(mv.content)) mv.content += ', maximum-scale=1, user-scalable=no, viewport-fit=cover';

// Güvenli alan payını (çentik, ana ekran çizgisi) ölçmek için görünmez bir parça (döndürülmeyen kökte; html.rot
// güvenli alan değişkenlerini mantıksal kenarlara eşler)
const probe = document.createElement('div');
probe.style.cssText = 'position:fixed;left:0;top:0;width:0;visibility:hidden;pointer-events:none;height:calc(var(--sat) + var(--sab))';
root.appendChild(probe);

// ---- Döndürülmüş kipte stil kuralları: ortam sorgusu ve görüntü birimleri mantıksal eksene çevrilir ----
// Tarayıcı ortam sorgularını (max-width, max-height) ve vw/vh birimlerini dik ekrana göre hesaplar; döndürülmüş oyunda
// bunlar ters düşer (ör. "max-width:620px" dik telefonda yanlışlıkla devreye girer, "94vh" taşar). Döndürme açıkken
// kurallarda width↔height ve vw↔vh yer değiştirir (vmin/vmax iki kipte aynıdır); kapanınca özgün metin geri yazılır.
const ORIG = new WeakMap();
const VU = /(\d)(d|s|l)?v(w|h)\b/g, MQ = /\b(min-|max-)?(device-)?(width|height)\b/g;
const swapU = t => t.replace(VU, (m, d, p, a) => d + (p || '') + 'v' + (a === 'w' ? 'h' : 'w'));
const swapQ = t => t.replace(MQ, (m, a, d, b) => (a || '') + (d || '') + (b === 'width' ? 'height' : 'width')).replace(/\b(portrait|landscape)\b/g, m => (m === 'portrait' ? 'landscape' : 'portrait'));
function fixRules(list, rot) {
  for (const r of list) {
    if (r.media && r.cssRules) { // @media
      let o = ORIG.get(r);
      if (o === undefined) { o = r.media.mediaText; ORIG.set(r, /width|height|portrait|landscape/.test(o) ? o : ''); o = ORIG.get(r); }
      if (o) { const t = rot ? swapQ(o) : o; if (r.media.mediaText !== t) r.media.mediaText = t; }
    }
    if (r.style) { // stil ve anahtar kare kuralları
      let o = ORIG.get(r);
      if (o === undefined) { const c = r.style.cssText; VU.lastIndex = 0; o = VU.test(c) ? c : ''; ORIG.set(r, o); }
      if (o) { const t = rot ? swapU(o) : o; if (r.style.cssText !== t) r.style.cssText = t; }
    }
    if (r.cssRules) fixRules(r.cssRules, rot);
  }
}
let cssRot = false;
function fixCss(rot) {
  for (const s of document.styleSheets) { let rules; try { rules = s.cssRules; } catch { continue; } if (rules) fixRules(rules, rot); }
  cssRot = rot;
}

function measure() {
  const w = window.innerWidth, h = window.innerHeight, rot = h > w && coarse();
  view.rot = rot; view.w = rot ? h : w; view.h = rot ? w : h;
  root.classList.toggle('rot', rot);
  if (rot !== cssRot) fixCss(rot);
  root.classList.toggle('short', view.h <= 480); // telefon yüksekliği: sıkı yerleşim kuralları (.short)
  root.style.setProperty('--lw', view.w + 'px');
  root.style.setProperty('--lh', view.h + 'px');
  root.style.setProperty('--s', Math.min(view.h / 1080, 1).toFixed(4)); // KD tasarım ölçeği: 1080 dp referans yükseklik (css --dp)
  root.style.setProperty('--wz', Math.max(1, Math.min(view.h / 660, view.w / 1180, 1.6)).toFixed(3)); // Aşama 5: büyük ekranda pencere ölçeği (css zoom)
  // Ana üste sol sütun (kart, üyelik, Menü, Kapı) ile sohbet şeridi üst üste binmesin: önizleme satır sayısı
  // kalan yüksekliğe göre 2-5 arasıdır; çok basık ekranda (.tiny) Menü ve Kapı yan yana dizilir.
  const free = view.h - probe.offsetHeight, tiny = free < 358;
  root.classList.toggle('tiny', tiny);
  root.style.setProperty('--cbl', 3); // ana ekran sohbet şeridi her ekranda son 3 mesajı gösterir
  subs.forEach(fn => fn(view));
}
window.addEventListener('resize', measure);
window.addEventListener('orientationchange', () => { measure(); setTimeout(measure, 80); setTimeout(measure, 400); }); // iOS ölçüyü dönüşten sonra günceller
window.addEventListener('load', () => { if (cssRot) fixCss(true); measure(); }); // geç yüklenen stil dosyaları da çevrilsin
measure();

// Ekran klavyesi (yalnızca gerçek yatayda: sistem klavyesi): örttüğü şerit --kb olarak yayınlanır (alttan).
// Android Chrome düzen penceresini küçültmeden yalnızca görsel pencereyi kısaltır, iOS Safari ise ayrıca sayfayı kaydırıp
// görsel pencerenin üstünü (offsetTop) öteler: ikisi için de görsel pencere ölçülür. --vvt görsel pencerenin üst payıdır
// (iOS'ta sabit konumlu parçalar buna göre yerleşir). Yazı kutusu odaktayken eşik düşer, odak bırakılınca her şey eski haline döner.
// Döndürülmüş kipte oyunun kendi klavyesi kullanılır (ui-klavye.js, --vkb).
const vv = window.visualViewport;
const typing = () => { const a = document.activeElement; return !!a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.isContentEditable) && !/^(checkbox|radio|button|range|submit)$/.test(a.type || ''); };
let kbTimer = 0;
function keyboard() {
  const hidden = vv && !view.rot ? Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop)) : 0;
  const on = hidden > (typing() ? 40 : 80);
  root.classList.toggle('kb', on);
  root.style.setProperty('--kb', (on ? hidden : 0) + 'px');
  root.style.setProperty('--vvt', (on && vv ? Math.max(0, Math.round(vv.offsetTop)) : 0) + 'px');
}
function settle() { // klavye animasyonu bitene kadar birkaç kez ölç; odaktaki kutuyu görünür kıl
  [0, 120, 300, 600].forEach(ms => setTimeout(() => {
    keyboard();
    const a = document.activeElement;
    if (root.classList.contains('kb') && typing()) { try { a.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } catch { /* eski tarayıcı */ } }
  }, ms));
}
if (vv) { vv.addEventListener('resize', keyboard); vv.addEventListener('scroll', keyboard); }
document.addEventListener('focusin', () => { if (typing()) settle(); });
document.addEventListener('focusout', () => {
  clearTimeout(kbTimer);
  kbTimer = setTimeout(() => { // odak başka bir yazı kutusuna geçtiyse klavye açık kalır; yoksa sayfa konumu da sıfırlanır
    if (typing()) return;
    keyboard();
    if (!root.classList.contains('kb') && (window.scrollX || window.scrollY)) window.scrollTo(0, 0);
  }, 150);
});
window.addEventListener('resize', keyboard);

// İstemci (parmak) koordinatı → oyunun mantıksal koordinatı. Döndürme: rotate(90deg) translateY(-100%), köken sol üst.
export const toLocal = (x, y) => (view.rot ? { x: y, y: window.innerWidth - x } : { x, y });
// Ekran üstündeki bir kaymayı (dx, dy) mantıksal eksene çevirir (sürükleyerek döndürme vb. için)
export const toLocalDelta = (dx, dy) => (view.rot ? { x: dy, y: -dx } : { x: dx, y: dy });

// ---- Döndürülmüş kipte kaydırma: tarayıcıların dönmüş kapta parmakla kaydırma yönü tutarsız olduğu için elle yapılır ----
// (html.rot'ta touch-action:none). Kaydırma çubuğu (range), 3B sahne ve oyun klavyesi sürüklemeyi kendisi kullanır.
let drag = null, glide = 0;
const OWN = 'input[type=range], canvas, #vk, [data-drag]';
const scroller = el => {
  for (; el && el !== document.body && el.nodeType === 1; el = el.parentElement) {
    const cs = getComputedStyle(el);
    if (/(auto|scroll)/.test(cs.overflowY + cs.overflowX) && (el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1)) return el;
  }
  return null;
};
window.addEventListener('pointerdown', e => {
  cancelAnimationFrame(glide);
  if (!view.rot || e.pointerType === 'mouse' || e.target.closest?.(OWN)) { drag = null; return; }
  const el = scroller(e.target);
  drag = el ? { el, id: e.pointerId, x: e.clientX, y: e.clientY, moved: 0, vx: 0, vy: 0 } : null;
}, true);
window.addEventListener('pointermove', e => {
  if (!drag || e.pointerId !== drag.id) return;
  const d = toLocalDelta(e.clientX - drag.x, e.clientY - drag.y);
  drag.x = e.clientX; drag.y = e.clientY;
  drag.el.scrollLeft -= d.x; drag.el.scrollTop -= d.y;
  drag.vx = d.x; drag.vy = d.y; drag.moved += Math.abs(d.x) + Math.abs(d.y);
}, true);
const release = e => {
  const d = drag;
  if (!d || (e && e.pointerId !== d.id)) return;
  drag = null;
  if (d.moved < 10) return;
  // sürüklemenin sonundaki dokunuş tıklama sayılmasın
  const stop = ev => { ev.stopPropagation(); ev.preventDefault(); };
  window.addEventListener('click', stop, { capture: true, once: true });
  setTimeout(() => window.removeEventListener('click', stop, true), 350);
  const step = () => { d.vx *= 0.94; d.vy *= 0.94; d.el.scrollLeft -= d.vx; d.el.scrollTop -= d.vy; if (Math.abs(d.vx) + Math.abs(d.vy) > 0.6) glide = requestAnimationFrame(step); };
  glide = requestAnimationFrame(step);
};
window.addEventListener('pointerup', release, true);
window.addEventListener('pointercancel', release, true);
// iOS: touch-action desteği eksik kalırsa sayfa esneyip kaymasın (kaydırma çubuğu hariç)
window.addEventListener('touchmove', e => { if (view.rot && e.cancelable && !e.target.closest?.('input[type=range]')) e.preventDefault(); }, { passive: false, capture: true });

// ---- Tam ekran + yatay kilit (sessiz) ----
// Dokunmatik cihazda ilk dokunuşta denenir: Android Chrome tam ekranda yön kilidine izin verir, kilit tutunca telefon
// gerçekten yataya döner ve döndürme kendiliğinden kapanır. iOS Safari (iPhone) tam ekran vermez: hata yutulur, oyun
// döndürülmüş çizilmeye devam eder. Ana Ekran'a eklenmiş (standalone) ve yerel uygulama (Capacitor) zaten tam ekrandır.
const native = !!window.Capacitor?.isNativePlatform?.();
const lockWanted = () => { try { return JSON.parse(localStorage.getItem('dd_a11y') || '{}').orient === 'lock'; } catch { return false; } };
const standalone = () => navigator.standalone === true || !!window.matchMedia?.('(display-mode: fullscreen), (display-mode: standalone)').matches;
async function lockLand() {
  try { // erişilebilirlik "yönü sabitle": o anki yatay yön; yoksa serbest yatay
    const t = screen.orientation?.type || '';
    await screen.orientation.lock(lockWanted() && t.startsWith('landscape') ? t : 'landscape');
  } catch { /* desteklenmiyor ya da tam ekran değil */ }
}
let fsTried = false;
async function tryFull() {
  if (fsTried || native || !coarse()) return;
  fsTried = true;
  try {
    const el = document.documentElement;
    if (!document.fullscreenElement && !document.webkitFullscreenElement && !standalone()) {
      if (el.requestFullscreen) await el.requestFullscreen({ navigationUI: 'hide' });
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    }
  } catch { /* izin yok (iOS, gömülü çerçeve): sessizce geç */ }
  lockLand();
}
window.addEventListener('pointerup', e => { if (e.pointerType !== 'mouse') tryFull(); }, true);
window.addEventListener('dd-a11y', () => { if (!lockWanted()) { try { screen.orientation.unlock(); } catch { /* yok */ } } lockLand(); });
