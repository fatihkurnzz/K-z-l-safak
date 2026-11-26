// Açılış: hesabı sunucudan al; karakteri yoksa oluşturmaya, varsa karakter seçme ekranına (sonra başkente) gir.
// İskeletli modeller (models/, ~0,9 MB) başkente varıştan sonra boşta yüklenir (P28 yuk-2; modelleriErtele). Kapatmak için: Profil → Grafik: Düşük ya da ?hd=0.
// Grafik kademesi (gfx.js) Düşük ise (oyuncu seçtiyse ya da cihaz zayıfsa) modeller hiç indirilmez.
// Dosyası olmayan birim (ve modelsiz deneme derlemesi) koddan üretilen prosedürel modelle çizilir.
import { boot, act, LOCAL, locked, hasToken } from './api.js';
import { showLogin } from './ui-giris.js';
import { showStart, startNote } from './ui-acilis.js'; // açılış: sunucu seçimi ve giriş // kullanıcı adı + şifre (yeni sunucu)
import { preloadModels } from './skinned.js';
import { ACT } from './ui-core.js';
import './adlar-tr.js'; // Türkçe eşya/yetenek adları (dil katmanı, M5)
import './ui.js';
import './p33-canli.js'; // P33: harita canlılığı, gün evresi tonu, örs/seviye/ganimet geri bildirimi, performans ayarları (yalnız sunum)
import { loadPortraitOverrides } from './portraits.js';
import { gfx } from './gfx.js';
import { initI18n } from './i18n.js';
import { kdGorsel } from './ui-kaplama.js'; // Kül ve Demir görselleri (kd-png.js) → CSS değişkenleri
import { karakterYukle } from './karakter-png.js'; // P26 O15: karakter çizimleri (karakter-png-veri.js) tembel
import { ipucu } from './yukleme-metin.js'; // P33: GPT ipuçları (açılış yüklemesi)

/** İskeletli modelleri (models/, ≈0,9 MB) ilk 3B ihtiyaca erteler: 2B başkent açıldıktan 6 sn sonra boşta (ya da en geç 60 sn). */
function modelleriErtele() {
  let bitti = false, mo = null;
  const yukle = () => { if (bitti) return; bitti = true; mo?.disconnect(); preloadModels().then(n => { window.DD_RIGGED = n > 0; }, () => {}); };
  const sonra = () => setTimeout(() => (window.requestIdleCallback || (f => f()))(yukle), 6000);
  mo = new MutationObserver(() => { if (document.documentElement.dataset.hub2d) { mo.disconnect(); sonra(); } });
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-hub2d'] });
  setTimeout(yukle, 60000);
}

(async () => {
  const L = document.getElementById('loading');
  // P33 (GPT yükleme metinleri): açılış yüklemesi sürerken bir ipucu (yalnız TR; yükleme ekranı kalkınca kendiliğinden gider)
  try { const ip = ipucu(), F = L?.querySelector('.ld-foot'); if (ip && F && !F.querySelector('.ld-ipucu')) F.insertAdjacentHTML('beforeend', `<div class="ld-ipucu">${ip}</div>`); } catch { }
  const LD = window.DDLoad || { set() {}, fail() {} };
  const say = (t, p) => LD.set(p ?? LD.pct ?? 0, t);
  say('Dil dosyaları yükleniyor', 8);
  await initI18n().catch(() => {}); // kayıtlı dil (dd_lang); İngilizce sözlük yalnızca seçiliyse indirilir
  const hd = new URLSearchParams(location.search).get('hd');
  const low = !gfx.T.rigged; // engine3d açılışta kademeyi belirledi (kayıt, ?gfx ya da cihaz ipuçları)
  say('Oyun dosyaları yükleniyor', 14);
  // window.DD_LOCAL: sunucusuz derleme. Deneme linki model taşımaz; uygulama derlemesi (DD_MODELS) taşır.
  // P26 O15 (açılış yükü): sunucu seçimi yalnız çekirdek JS + p23-sunucu görselleriyle açılır. Karakter ekranının gerekleri
  // (Kül ve Demir kabuğu kd-png, portreler, karakter çizimleri) karakter seçimi/oluşturmadan önce beklenir.
  const rig = (!window.DD_LOCAL || window.DD_MODELS) && (hd === '1' || (hd !== '0' && !low));
  say('Hazır', 100);
  let gerek = null;
  // P28 yuk-2: karakter ekranı paketleri (kd-png, portre-png, karakter-png-veri ≈4,3 MB) sunucu ekranında zamanlayıcıyla önden
  // inmez; yalnız "Oyuna gir"den sonra istenir. İskeletli modeller (yalnız 2B çizimi olmayan yaratıklar) başkente varınca boşta iner.
  const arka = () => (gerek ||= Promise.all([kdGorsel(), loadPortraitOverrides(), karakterYukle()]));
  if (rig) modelleriErtele();
  const bas = showStart(); // sunucu seçimi + giriş / oyuna gir (ui-acilis.js)
  await bas;
  arka();
  let s;
  if (!hasToken()) { L && (L.hidden = true); await showLogin(); if (L) L.hidden = false; } // sunucuya bağlı derleme: önce hesap
  for (;;) {
    try { s = await boot(); break; }
    catch (e) {
      if (e.code === 'auth') { L && (L.hidden = true); await showLogin('Oturumun sona erdi. Tekrar giriş yap.'); if (L) L.hidden = false; continue; }
      startNote(`${e.message} · Yeniden deneniyor…`); await new Promise(r => setTimeout(r, 3000));
    }
  }
  await gerek; // karakter ekranı görselleri hazır (kul-demir.css var(--kdg-…) tanımsızken çizilmesin)
  // P26 O15: seçili karakterin halkına ait başkent paketi (p23-sehir2-*, ≈0,6 MB) karakter ekranı açıkken arkada iner (başkent ilk karesi görselsiz kalmasın)
  { const c = s.chars.find(x => x.id === s.cur) || s.chars[0]; if (c) import(c.race === 'sancak' ? './p23-sehir2-sancak.js' : './p23-sehir2-ocak.js').catch(() => {}); }
  L?.remove();
  if (locked()) return; // yasaklı hesap: oyun açılmaz (ekranı ui-guvenlik.js gösterir)
  // Hesap var → karakter seçme ekranı; karakter yok → oluşturma (ui-karakter.js)
  if (!s.chars.length) ACT.charCreate(); else ACT.charSelect();
  if (LOCAL) console.info('[korant] yerel deneme modu');
})();
