// Giriş ekranı (19 Kas): kullanıcı adı + şifreyle hesap açma ve giriş (yeni sunucu, sunucu/auth.js).
// Yalnızca sunucuya bağlı derlemede görünür; çevrimdışı deneme kipinde (LOCAL) hesap yerel olduğu için atlanır.
// showLogin() başarılı giriş/kayıt olunca çözülür; ardından açılış (main.js) karakter listesini alır.
import './sahne.js'; // 23 Kas: G8 logo/amblem hemen, G4–G6 görselleri arkada (CSS değişkenleri)
import { authCall } from './api.js';

const esc = t => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
export function showLogin(note = '') {
  return new Promise(resolve => {
    const el = document.createElement('div');
    el.id = 'giris';
    let mode = 'login', busy = false;
    const draw = (msg = note, err = false) => {
      el.innerHTML = `<div class="gr-bg" aria-hidden="true"></div><form class="gr-box" autocomplete="on">
        <div class="gr-logo"><small>Sunucu: Ares</small><b>Korant Online</b></div>
        <div class="gr-tabs"><button type="button" data-m="login" class="${mode === 'login' ? 'on' : ''}">Giriş yap</button><button type="button" data-m="register" class="${mode === 'register' ? 'on' : ''}">Hesap aç</button></div>
        <label><span>Kullanıcı adı</span><input name="user" autocomplete="username" autocapitalize="none" spellcheck="false" maxlength="20" required></label>
        <label><span>Şifre</span><input name="pass" type="password" autocomplete="${mode === 'login' ? 'current-password' : 'new-password'}" maxlength="72" required></label>
        ${mode === 'register' ? '<label><span>Şifre (tekrar)</span><input name="pass2" type="password" autocomplete="new-password" maxlength="72" required></label><p class="gr-hint">Kullanıcı adı 3–20 karakter (küçük harf, rakam, _ ya da .). Şifre en az 8 karakter, bir harf ve bir rakam içermeli.</p>' : ''}
        ${msg ? `<p class="gr-msg ${err ? 'err' : ''}">${esc(msg)}</p>` : ''}
        <button class="gr-go" type="submit" ${busy ? 'disabled' : ''}>${busy ? 'Bekle…' : mode === 'login' ? 'Giriş yap' : 'Hesabı aç'}</button>
        <p class="gr-foot">Karakterlerin, eşyaların ve ilerlemen sunucuda hesabına kayıtlıdır; başka cihazda aynı kullanıcı adı ve şifreyle devam edersin.</p></form>`;
      el.querySelectorAll('[data-m]').forEach(b => (b.onclick = () => { mode = b.dataset.m; draw(''); }));
      el.querySelector('form').onsubmit = async e => {
        e.preventDefault();
        if (busy) return;
        const f = new FormData(e.target), user = String(f.get('user') || '').trim(), pass = String(f.get('pass') || '');
        if (mode === 'register' && pass !== String(f.get('pass2') || '')) return draw('Şifreler aynı değil.', true);
        busy = true; draw('');
        try { await authCall(mode, user, pass); el.remove(); resolve(); }
        catch (err) { busy = false; draw(err.message || 'Bağlantı hatası.', true); const u = el.querySelector('[name=user]'); if (u) u.value = user; }
      };
      el.querySelector('[name=user]')?.focus();
    };
    draw();
    (document.getElementById('game') || document.body).appendChild(el);
  });
}
