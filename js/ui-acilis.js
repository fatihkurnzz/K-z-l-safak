// Açılış ekranı (Korant Online, 19 Kas): yükleme çubuğu %100 olunca altta sunucu seçimi ve giriş düğmesi çıkar.
// Sunucuya bağlı derlemede oturum yoksa düğme "Giriş yap" der ve ardından giriş/kayıt penceresi (ui-giris.js) açılır;
// çevrimdışı deneme kipinde (LOCAL) hesap yerel olduğundan düğme "Oyuna gir" der.
import { LOCAL, hasToken } from './api.js';
import { SERVER } from '../shared/content.js';
import PNG from './p23-sunucu-png.js'; // sunucu ekranı görselleri (WebP base64)

// P23 G1: dört sunucu görünür; yalnız Ares gerçekten çalışır (shared/content.js SERVER). Karar yok: Zeus/Hera seçilebilir ama
// giriş Ares'e yönlenir (seçilince not düşer); Titan kapalıdır, seçilemez. Çoklu sunucu mantığı 2C-5'te; burası yalnız görünüş.
// 24 Kas: yeni paketle yalnız Ares listelenir; diğerleri açılınca satırlar geri eklenir (row2 = koyu "normal" plaka hazır).
const SERVERS = [
  { id: 'ares', name: SERVER.name, state: 'aktif', pop: 'yuksek', real: true },
  // { id: 'zeus', name: 'Zeus', state: 'aktif', pop: 'orta' },
  // { id: 'hera', name: 'Hera', state: 'aktif', pop: 'orta' },
  // { id: 'titan', name: 'Titan', state: 'kapali', pop: null },
];
const MIN_LOADING_MS = 3000; // ilk yükleme ekranı en az bu kadar görünür (sayfa açılışından itibaren)
const KEY = 'dd_server';
const STATE = { aktif: 'Aktif', kapali: 'Kapalı' }, POP = { yuksek: 'Yüksek', orta: 'Orta', dusuk: 'Düşük' };
const g2 = () => document.documentElement.classList.contains('giris2'); // ?giris=0 / dd_giris=0 → eski görünüş
const pickable = s => s.state === 'aktif';
/** Giriş formunun göstereceği sunucu adı: seçilen sunucu çalışmıyorsa (Zeus/Hera) giriş Ares'e yönlenir. */
export function serverName() {
  let id = null; try { id = localStorage.getItem(KEY); } catch {}
  const s = SERVERS.find(x => x.id === id);
  return (s?.real ? s : SERVERS[0]).name;
}

/** Yükleme bittikten sonra sunucu seçimi + giriş düğmesini gösterir; oyuncu düğmeye basınca çözülür. */
export async function showStart() {
  const L = document.getElementById('loading'), foot = L?.querySelector('.ld-foot');
  if (!foot) return;
  // en az 3 sn kuralı: yükleme ekranının ilk boyandığı andan (index.html DDLoad.shownAt) sayılır; +50 ms kare payı
  const shown = window.DDLoad?.shownAt ?? 0;
  await new Promise(r => setTimeout(r, Math.max(0, MIN_LOADING_MS + 50 - (performance.now() - shown))));
  L.classList.add('ready');
  let sel = SERVERS.find(s => s.id === localStorage.getItem(KEY) && pickable(s))?.id || SERVERS[0].id;
  const label = g2() || LOCAL || hasToken() ? 'Oyuna gir' : 'Giriş yap'; // P23 G1: yeni ekranda düğme hep "Oyuna gir" (giriş penceresi ardından açılır)
  return new Promise(resolve => {
    const draw = () => {
      if (g2()) return drawG2();
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
    // ---- P23 giriş ekranı: hazır PNG katmanları (arka plan, logo, panel, düğme) + CSS ile yazılan liste ----
    const go = () => {
      const s = SERVERS.find(x => x.id === sel), btn = foot.querySelector('.sv-go');
      try { localStorage.setItem(KEY, sel); } catch {}
      // ikinci yükleme ekranı yok: aynı ekranda düğme "Yükleniyor..." olur; ana ekrana main.js geçer (#loading kalkınca)
      if (btn) { if (btn.disabled) return; btn.disabled = true; btn.setAttribute('aria-busy', 'true'); btn.innerHTML = '<i class="sv-spin" aria-hidden="true"></i><span lang="tr">Yükleniyor...</span>'; }
      resolve(s?.real ? sel : SERVERS[0].id);
    };
    const drawG2 = () => {
      L.style.setProperty('--sv-bg', `url(data:image/webp;base64,${PNG.bg})`); L.style.setProperty('--sv-logo', `url(data:image/webp;base64,${PNG.logo})`);
      L.style.setProperty('--sv-row', `url(data:image/webp;base64,${PNG.row})`); L.style.setProperty('--sv-row2', `url(data:image/webp;base64,${PNG.row2})`);
      L.style.setProperty('--sv-panel', `url(data:image/webp;base64,${PNG.panel})`); L.style.setProperty('--sv-btn', `url(data:image/webp;base64,${PNG.btn})`);
      startFx(L);
      const row = s => `<button type="button" class="sv-row ${s.id === sel ? 'on' : 'off'} ${s.state}" role="radio" aria-checked="${s.id === sel}" ${pickable(s) ? '' : 'aria-disabled="true" tabindex="-1"'} data-s="${s.id}">
        <b translate="no"><i class="sv-dot" aria-hidden="true"></i>${s.name}</b><span class="sv-st">${STATE[s.state]}</span><span class="sv-pop ${s.pop || 'yok'}">${s.pop ? POP[s.pop] : '–'}</span></button>`;
      foot.innerHTML = `<div class="sv-logo" role="img" aria-label="Korant Online"></div>
        <section class="sv-panel" aria-labelledby="svh"><h2 id="svh" class="sv-head">Sunucu Seçimi</h2><div class="sv-in">
          <div class="sv-list" role="radiogroup" aria-labelledby="svh">${SERVERS.map(row).join('')}</div>
          <p class="sv-note" aria-live="polite"></p></div></section>
        <button type="button" class="sv-go"><span lang="tr">Oyuna gir</span></button><div class="ld-note"></div>`;
      const note = foot.querySelector('.sv-note');
      foot.querySelectorAll('[data-s]').forEach(b => (b.onclick = () => {
        const s = SERVERS.find(x => x.id === b.dataset.s);
        if (!pickable(s)) { note.textContent = 'Bu sunucu kapalı.'; return; }
        sel = s.id; foot.querySelectorAll('[data-s]').forEach(x => { const on = x.dataset.s === sel; x.classList.toggle('on', on); x.setAttribute('aria-checked', on); });
        note.textContent = s.real ? '' : 'Bu sunucu yakında açılıyor; giriş Ares\'e yönlenir.';
      }));
      foot.querySelector('.sv-go').onclick = go;
      foot.querySelector('.sv-list').addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
      foot.querySelector(`[data-s="${sel}"]`)?.focus({ preventScroll: true });
    };
    draw();
  });
}
/** P27 1.3 arka plan canlandırması (yalnız CSS/DOM, yeni görsel yok): sağda (volkan/ork) yukarı süzülen 30 turuncu-kızıl kor
 *  kıvılcımı + lav ışık nabzı, solda (kale/şövalye) 18 mavi-altın ışık tozu + hafif alt sis. UI katmanının arkasındadır
 *  (p27-acilis.css `.p27-fx`). "Az hareket" tercihinde ve Düşük grafikte kurulmaz; #loading kaldırılınca DOM'dan birlikte kalkar. */
function startFx(L) {
  if (L.querySelector('.p27-fx') || matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('gfx-low')) return;
  const fx = document.createElement('div'); fx.className = 'p27-fx'; fx.setAttribute('aria-hidden', 'true');
  const R = (a, b) => a + Math.random() * (b - a), f = n => n.toFixed(2);
  let h = '<b class="lav"></b><b class="sis"></b>';
  for (let i = 0; i < 30; i++) { // kor: sağ %55–%99, hızlı, sıcak
    const d = R(5, 10);
    h += `<i class="k" style="--x:${f(R(55, 99))}%;--s:${f(R(2.6, 5.6))}px;--d:${f(d)}s;--dl:${f(-R(0, d))}s;--dx:${f(R(-40, 25))}px;--a:${f(R(.55, 1))}"></i>`;
  }
  for (let i = 0; i < 18; i++) { // toz: sol %1–%42, yavaş, soluk; mavi ya da altın
    const d = R(11, 18);
    h += `<i class="t" style="--x:${f(R(1, 42))}%;--s:${f(R(2, 3.6))}px;--d:${f(d)}s;--dl:${f(-R(0, d))}s;--dx:${f(R(-24, 24))}px;--a:${f(R(.35, .7))};--c:${Math.random() < .55 ? '#9cc4ff' : '#ffd98a'}"></i>`;
  }
  fx.innerHTML = h;
  L.insertBefore(fx, L.querySelector('.ld-foot'));
}
/** Açılış ekranının altına kısa bir durum notu yazar (bağlantı hatası vb.). */
export function startNote(t) { const n = document.querySelector('#loading .ld-note'); if (n) n.textContent = t; }
