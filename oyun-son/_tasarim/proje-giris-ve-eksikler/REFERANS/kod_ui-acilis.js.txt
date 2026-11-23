// Açılış ekranı (Korant Online, 19 Kas): yükleme çubuğu %100 olunca altta sunucu seçimi ve giriş düğmesi çıkar.
// Sunucuya bağlı derlemede oturum yoksa düğme "Giriş yap" der ve ardından giriş/kayıt penceresi (ui-giris.js) açılır;
// çevrimdışı deneme kipinde (LOCAL) hesap yerel olduğundan düğme "Oyuna gir" der.
import { LOCAL, hasToken } from './api.js';
import { SERVER } from '../shared/content.js';

const SERVERS = [{ id: 'ares', name: SERVER.name, state: 'Açık' }]; // ileride birden çok sunucu: liste buradan
const KEY = 'dd_server';

/** Yükleme bittikten sonra sunucu seçimi + giriş düğmesini gösterir; oyuncu düğmeye basınca çözülür. */
export function showStart() {
  const L = document.getElementById('loading'), foot = L?.querySelector('.ld-foot');
  if (!foot) return Promise.resolve();
  L.classList.add('ready');
  let sel = SERVERS.find(s => s.id === localStorage.getItem(KEY))?.id || SERVERS[0].id;
  const label = LOCAL || hasToken() ? 'Oyuna gir' : 'Giriş yap';
  return new Promise(resolve => {
    const draw = () => {
      foot.innerHTML = `<div class="ld-start"><div class="ld-srv"><small>Sunucu</small>${SERVERS.map(s =>
        `<button type="button" class="ld-sv ${s.id === sel ? 'on' : ''}" data-s="${s.id}"><b>${s.name}</b><i>${s.state}</i></button>`).join('')}</div>
        <button type="button" class="ld-go">${label}</button></div><div class="ld-note"></div>`;
      foot.querySelectorAll('[data-s]').forEach(b => (b.onclick = () => { sel = b.dataset.s; draw(); }));
      foot.querySelector('.ld-go').onclick = () => {
        try { localStorage.setItem(KEY, sel); } catch {}
        foot.innerHTML = '<div class="ld-txt">Sunucuya bağlanılıyor</div><div class="ld-bar full"><i style="width:100%"></i><b>100%</b></div><div class="ld-note"></div>';
        resolve(sel);
      };
    };
    draw();
  });
}
/** Açılış ekranının altına kısa bir durum notu yazar (bağlantı hatası vb.). */
export function startNote(t) { const n = document.querySelector('#loading .ld-note'); if (n) n.textContent = t; }
