// Oyunun kendi ekran klavyesi (yalnızca döndürülmüş kipte: dokunmatik telefon dik tutulurken oyun yatay çizilir,
// orient.js html.rot). O kipte sistem klavyesi dik açılırdı; bu yüzden yazı kutusuna dokununca kutu odak almaz
// (touchstart engellenir; yine de odak alırsa inputmode=none + blur), onun yerine #game içinde, mantıksal ekranın
// altında yatay bir klavye açılır.
//  - Türkçe Q düzeni (ç ğ ı i ö ş ü), büyük harf (bir dokunuş: tek harf, çift dokunuş: kilit), rakam/işaret sayfaları,
//    boşluk, silme (basılı tutunca tekrar), Gönder/Tamam, kapat. inputmode numeric/decimal ya da type=number: sayı düzeni.
//  - Yazılan metin asıl kutuya yazılır; input olayı her tuşta, Enter'da keydown/keyup (data-enter işlemleri, sohbet
//    gönder), kapanınca change tetiklenir. İmleç hep metnin sonundadır.
//  - Açıkken html.vkb + --vkb (klavye yüksekliği): sohbet çubuğu, pencereler ve modal klavyenin üstünde kalır (css/v12-klavye.css).
//  - Telefon gerçekten yataysa (döndürme yok) ve masaüstünde hiç devreye girmez: sistem klavyesi kullanılır.
import { view, onView } from './orient.js';

const root = document.documentElement;
const TEXT = /^(text|search|email|url|tel|password|number)$/;
const isText = el => !!el && ((el instanceof HTMLInputElement && TEXT.test(el.type || 'text')) || el instanceof HTMLTextAreaElement) && !el.disabled && !el.readOnly;
const on = () => view.rot;

const L1 = 'q w e r t y u ı o p ğ ü'.split(' '), L2 = 'a s d f g h j k l ş i'.split(' '), L3 = 'z x c v b n m ö ç'.split(' ');
const S1 = '1 2 3 4 5 6 7 8 9 0'.split(' '), S2 = '- / : ; ( ) ₺ & @ "'.split(' '), S3 = ". , ? ! ' * %".split(' ');
const T1 = '[ ] { } # ^ + = _ \\'.split(' '), T2 = '| ~ < > € $ £ • ` °'.split(' '), T3 = '. , ? ! \' * %'.split(' ');

const K = { el: null, id: '', page: 'abc', shift: 0, lastShift: 0, num: false, box: null, rep: 0, repT: 0 };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const up = c => c.toLocaleUpperCase('tr');
const ch = c => `<button type="button" class="vk-k" data-k="c" data-v="${esc(c)}" translate="no">${esc(c)}</button>`;
const fn = (k, label, cls = '', tr = false) => `<button type="button" class="vk-k vk-f ${cls}" data-k="${k}"${tr ? '' : ' translate="no"'}>${label}</button>`;

const BKSP = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 5H21v14H8.5L2 12zM11.6 9.1l5.8 5.8M17.4 9.1l-5.8 5.8" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/></svg>';
const SHIFT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5 3.5 12.5H8V20h8v-7.5h4.5z" fill="currentColor"/></svg>';
const DOWN = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 9l7 7 7-7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function target() { // yeniden çizilen pencerede kutu değişmiş olabilir: aynı kimlikli yeni kutu aranır
  let el = K.el;
  if (!el || !el.isConnected) { el = K.id ? document.getElementById(K.id) : null; if (el && !isText(el)) el = null; if (el) { K.el = el; el.classList.add('vk-hedef'); } }
  return el;
}
const enterLabel = el => (el instanceof HTMLTextAreaElement ? '↵' : /send/i.test(el.dataset.enter || '') ? 'Gönder' : 'Tamam');

function draw() {
  const el = target(); if (!el || !K.box) return;
  let rows;
  if (K.num) {
    const dec = el.inputMode === 'decimal' || el.type === 'number' && /\./.test(el.step || '');
    rows = [['1', '2', '3'].map(ch).join('') + fn('bs', BKSP, 'vk-bs'), ['4', '5', '6'].map(ch).join('') + (dec ? ch(',') : fn('none', '', 'vk-gap')),
      ['7', '8', '9'].map(ch).join('') + fn('ok', esc(enterLabel(el)), 'vk-ok', true), fn('none', '', 'vk-gap') + ch('0') + fn('none', '', 'vk-gap') + fn('x', DOWN, 'vk-x')];
  } else if (K.page === 'abc') {
    const c = K.shift ? up : s => s;
    rows = [L1.map(s => ch(c(s))).join(''), L2.map(s => ch(c(s))).join(''),
      fn('sh', SHIFT, 'vk-sh' + (K.shift ? ' on' : '') + (K.shift === 2 ? ' lock' : '')) + L3.map(s => ch(c(s))).join('') + fn('bs', BKSP, 'vk-bs'),
      fn('p123', '123', 'vk-pg') + ch(',') + fn('sp', 'boşluk', 'vk-sp', true) + ch('.') + fn('ok', esc(enterLabel(el)), 'vk-ok', true) + fn('x', DOWN, 'vk-x')];
  } else {
    const s2 = K.page === 'sym2';
    rows = [(s2 ? T1 : S1).map(ch).join(''), (s2 ? T2 : S2).map(ch).join(''),
      fn(s2 ? 'p123' : 'psym2', s2 ? '123' : '#+=', 'vk-pg') + (s2 ? T3 : S3).map(ch).join('') + fn('bs', BKSP, 'vk-bs'),
      fn('pabc', 'ABC', 'vk-pg') + ch(',') + fn('sp', 'boşluk', 'vk-sp', true) + ch('.') + fn('ok', esc(enterLabel(el)), 'vk-ok', true) + fn('x', DOWN, 'vk-x')];
  }
  K.box.className = K.num ? 'vk-num' : '';
  K.box.querySelector('.vk-rows').innerHTML = rows.map(r => `<div class="vk-r">${r}</div>`).join('');
  preview();
}
function preview() { // klavyenin üst şeridi: alanın etiketi ve yazılan metin (kutu örtülse de görünsün)
  const el = target(); if (!el || !K.box) return;
  const lab = K.box.querySelector('.vk-lab'), txt = K.box.querySelector('.vk-txt');
  lab.textContent = el.getAttribute('aria-label') || el.placeholder || '';
  const v = el.type === 'password' ? '•'.repeat(el.value.length) : el.value;
  txt.textContent = v.length > 60 ? '…' + v.slice(-59) : v;
  txt.classList.toggle('bos', !v);
  if (el instanceof HTMLInputElement) { try { el.scrollLeft = el.scrollWidth; } catch { /* yok */ } } else el.scrollTop = el.scrollHeight;
}
function fire(el, type, extra) {
  if (type === 'input') { let e; try { e = new InputEvent('input', { bubbles: true, ...extra }); } catch { e = new Event('input', { bubbles: true }); } el.dispatchEvent(e); return; }
  el.dispatchEvent(new Event(type, { bubbles: true }));
}
function insert(c) {
  const el = target(); if (!el) return close();
  const v = el.value, max = el.maxLength > 0 ? el.maxLength : Infinity;
  if ([...v].length >= max) return;
  if (el.type === 'number' && !/[0-9.,-]/.test(c)) return;
  el.value = v + (el.type === 'number' && c === ',' ? '.' : c);
  fire(el, 'input', { inputType: 'insertText', data: c });
  if (K.shift === 1) { K.shift = 0; draw(); } else preview();
}
function back() {
  const el = target(); if (!el) return close();
  if (!el.value) return;
  el.value = [...el.value].slice(0, -1).join('');
  fire(el, 'input', { inputType: 'deleteContentBackward' });
  preview();
}
function enter() {
  const el = target(); if (!el) return close();
  if (el instanceof HTMLTextAreaElement) return insert('\n');
  const opt = { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true };
  const kd = new KeyboardEvent('keydown', opt);
  el.dispatchEvent(kd);
  el.dispatchEvent(new KeyboardEvent('keyup', opt));
  if (!kd.defaultPrevented && el.form) { try { el.form.requestSubmit(); } catch { /* yok */ } }
  // sohbet gibi gönderince boşalan kutularda klavye açık kalır; öbürlerinde kapanır
  setTimeout(() => { const t = target(); if (!t || t.value !== '' || !el.dataset.enter) close(); else preview(); }, 0);
}
function build() {
  if (K.box) return;
  const b = document.createElement('div');
  b.id = 'vk';
  b.innerHTML = '<div class="vk-top"><span class="vk-lab"></span><span class="vk-txt" translate="no"></span></div><div class="vk-rows"></div>';
  (document.getElementById('game') || document.body).appendChild(b);
  K.box = b;
}
function open(el) {
  if (K.el && K.el !== el) commit();
  build();
  K.el = el; K.id = el.id || '';
  K.num = el.type === 'number' || /^(numeric|decimal)$/.test(el.dataset.vkMode || el.inputMode || '') || el.type === 'tel';
  K.page = 'abc'; K.shift = 0;
  document.querySelectorAll('.vk-hedef').forEach(x => x !== el && x.classList.remove('vk-hedef'));
  el.classList.add('vk-hedef');
  K.box.hidden = false;
  draw();
  root.classList.add('vkb');
  const h = () => { if (K.box && !K.box.hidden) root.style.setProperty('--vkb', K.box.offsetHeight + 'px'); };
  h();
  requestAnimationFrame(() => { h(); const t = target(); try { t?.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } catch { /* eski tarayıcı */ } });
}
function commit() { const el = K.el; if (el && el.isConnected) { fire(el, 'change'); el.classList.remove('vk-hedef'); } }
function close() {
  stopRep();
  if (!K.box || K.box.hidden) { K.el = null; return; }
  commit();
  K.el = null; K.id = '';
  K.box.hidden = true;
  root.classList.remove('vkb');
  root.style.setProperty('--vkb', '0px');
}
export const vkOpen = () => !!K.box && !K.box.hidden;
export const vkClose = close;

function stopRep() { clearTimeout(K.repT); clearInterval(K.rep); K.repT = K.rep = 0; K.box?.querySelector('.vk-k.down')?.classList.remove('down'); }
function press(b) {
  const k = b.dataset.k;
  if (k === 'c') return insert(b.dataset.v);
  if (k === 'sp') return insert(' ');
  if (k === 'bs') { back(); K.repT = setTimeout(() => { K.rep = setInterval(back, 70); }, 420); return; }
  if (k === 'ok') return enter();
  if (k === 'x') return close();
  if (k === 'sh') { const now = Date.now(); K.shift = K.shift === 2 ? 0 : (K.shift === 1 && now - K.lastShift < 350) ? 2 : K.shift ? 0 : 1; K.lastShift = now; return draw(); }
  if (k === 'p123') { K.page = 'sym'; return draw(); }
  if (k === 'psym2') { K.page = 'sym2'; return draw(); }
  if (k === 'pabc') { K.page = 'abc'; return draw(); }
}

// Klavyeye dokunuş: pencere kapama (ui-core) ve döndürülmüş kaydırma (orient) gibi belge düzeyi dinleyicilere ulaşmasın
window.addEventListener('pointerdown', e => {
  if (!K.box || K.box.hidden) return;
  if (K.box.contains(e.target)) {
    e.preventDefault(); e.stopPropagation();
    const b = e.target.closest('.vk-k');
    if (b && b.dataset.k !== 'none') { stopRep(); b.classList.add('down'); press(b); }
    return;
  }
  if (!on()) return close();
  if (isText(e.target)) return; // başka bir kutuya geçiş: touchstart/focusin açar
  close(); // dışarı dokunuş: klavye kapanır (dokunuş arkadaki düğmeye gider)
}, true);
for (const t of ['pointerup', 'pointercancel']) window.addEventListener(t, e => { if (K.rep || K.repT || K.box?.contains(e.target)) { stopRep(); if (K.box?.contains(e.target)) { e.stopPropagation(); } } }, true);
window.addEventListener('click', e => { if (K.box?.contains(e.target)) { e.preventDefault(); e.stopPropagation(); } }, true);

// Yazı kutusuna dokunuş (döndürülmüş kipte): odak ve sistem klavyesi engellenir, oyun klavyesi açılır
window.addEventListener('touchstart', e => {
  if (K.box && K.box.contains(e.target)) { if (e.cancelable) e.preventDefault(); return; }
  if (!on()) return;
  const el = e.target.closest?.('input, textarea');
  if (!isText(el) || !el.closest('#game')) return;
  if (e.cancelable) e.preventDefault();
  if (document.activeElement === el) el.blur();
  open(el);
}, { capture: true, passive: false });
// Yedek: kutu yine de odak aldıysa (etiket, Tab, programla focus()) sistem klavyesi kapatılır, oyun klavyesi açılır
document.addEventListener('focusin', e => {
  const el = e.target;
  if (!on() || !isText(el) || !el.closest('#game')) return;
  if (el.inputMode !== 'none') { el.dataset.vkMode = el.inputMode || ''; el.inputMode = 'none'; }
  el.blur();
  if (K.el !== el) open(el);
  setTimeout(() => { if (el.dataset.vkMode !== undefined) { el.inputMode = el.dataset.vkMode; delete el.dataset.vkMode; } }, 400);
});
// Gerçek klavye (masaüstüne bağlı dik tablet vb.) açıkken tuşlar da çalışsın
window.addEventListener('keydown', e => {
  if (!vkOpen() || e.target !== document.body && e.target !== document.documentElement || e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
  else if (e.key === 'Backspace') { e.preventDefault(); back(); }
  else if (e.key === 'Enter') { e.preventDefault(); enter(); }
  else if (e.key.length === 1) { e.preventDefault(); insert(e.key); }
}, true);
// Yön değişti (telefon gerçekten yataya döndü): oyun klavyesi kapanır, sistem klavyesi kullanılır
onView(v => { if (!v.rot) close(); else if (vkOpen()) root.style.setProperty('--vkb', K.box.offsetHeight + 'px'); });
// Hedef kutu pencereyle birlikte kalktıysa klavye de kapansın
setInterval(() => { if (vkOpen() && !target()) close(); }, 500);
