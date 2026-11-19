// Açılış: hesabı sunucudan al; karakteri yoksa oluşturmaya, varsa karakter seçme ekranına (sonra başkente) gir.
// İskeletli modeller (models/, ~3,5 MB) açılışta yüklenir. Kapatmak için: Profil → Grafik: Düşük ya da ?hd=0.
// Grafik kademesi (gfx.js) Düşük ise (oyuncu seçtiyse ya da cihaz zayıfsa) modeller hiç indirilmez.
// Dosyası olmayan birim (ve modelsiz deneme derlemesi) koddan üretilen prosedürel modelle çizilir.
import { boot, act, LOCAL, locked, hasToken } from './api.js';
import { showLogin } from './ui-giris.js';
import { showStart, startNote } from './ui-acilis.js'; // açılış: sunucu seçimi ve giriş // kullanıcı adı + şifre (yeni sunucu)
import { preloadModels } from './skinned.js';
import { ACT } from './ui-core.js';
import './ui.js';
import { loadPortraitOverrides } from './portraits.js';
import { gfx } from './gfx.js';
import { initI18n } from './i18n.js';

(async () => {
  const L = document.getElementById('loading');
  const LD = window.DDLoad || { set() {}, fail() {} };
  const say = (t, p) => LD.set(p ?? LD.pct ?? 0, t);
  say('Dil dosyaları yükleniyor', 8);
  await initI18n().catch(() => {}); // kayıtlı dil (dd_lang); İngilizce sözlük yalnızca seçiliyse indirilir
  const hd = new URLSearchParams(location.search).get('hd');
  const low = !gfx.T.rigged; // engine3d açılışta kademeyi belirledi (kayıt, ?gfx ya da cihaz ipuçları)
  say('Oyun dosyaları yükleniyor', 14);
  // window.DD_LOCAL: sunucusuz derleme. Deneme linki model taşımaz; uygulama derlemesi (DD_MODELS) taşır.
  if ((!window.DD_LOCAL || window.DD_MODELS) && (hd === '1' || (hd !== '0' && !low))) window.DD_RIGGED = (await preloadModels((d, t) => { if (t) say(`Karakter modelleri yükleniyor (${d}/${t})`, 14 + 72 * d / t); })) > 0;
  say('Portreler hazırlanıyor', 88);
  await loadPortraitOverrides();
  say('Hazır', 100);
  await showStart(); // sunucu seçimi + giriş / oyuna gir (ui-acilis.js)
  let s;
  if (!hasToken()) { L && (L.hidden = true); await showLogin(); if (L) L.hidden = false; } // sunucuya bağlı derleme: önce hesap
  for (;;) {
    try { s = await boot(); break; }
    catch (e) {
      if (e.code === 'auth') { L && (L.hidden = true); await showLogin('Oturumun sona erdi. Tekrar giriş yap.'); if (L) L.hidden = false; continue; }
      startNote(`${e.message} · Yeniden deneniyor…`); await new Promise(r => setTimeout(r, 3000));
    }
  }
  L?.remove();
  if (locked()) return; // yasaklı hesap: oyun açılmaz (ekranı ui-guvenlik.js gösterir)
  // Hesap var → karakter seçme ekranı; karakter yok → oluşturma (ui-karakter.js)
  if (!s.chars.length) ACT.charCreate(); else ACT.charSelect();
  if (LOCAL) console.info('[korant] yerel deneme modu');
})();
