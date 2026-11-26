// 23 Kas: GPT görsel teslimlerinin yükleyicisi (yayın 511 dosya sınırı yüzünden tek dosyada).
//  · js/amblem-png.js (160 KB, G8): hemen iner → kök öğeye --amb-sancak, --amb-ocak, --logo-korant; html.amblemli
//  · js/gorsel-png.js (≈4 MB): G4 NPC portreleri (ad, ad-yuz), G5 sahneler ve Mini Dizi kapakları, G6 yetenek simgeleri (kimlik).
//    İlk kullanımda ya da ilk pencere açılınca iner (P26 O15); sahneler kök öğeye --sc-<anahtar> olarak yazılır, html.sahneli eklenir.
//    Yüklenene dek eski çizimler kalır (CSS değişkenleri yoktur, skillIcon siluet çizer, diyalog bekler).
// Sahne anahtarları: koru-sancak, koru-ocak, maden, dipsiz-kuyu, yeralti-ocagi, balik-tut, kristal-nobeti, dunya-baskini, minidizi-01…10
const root = document.documentElement;
let G = null, L = null;
/** G4–G6 paketi (gorsel-png.js) yüklüyse modülü döndürür; değilse indirmeyi başlatır ve null döner (P26 O15: ilk kullanımda iner). */
export const gorsel = () => G || (gorselYukle(), null);
/**
 * gorsel-png.js'i (≈4 MB) bir kez indirir: sahneleri --sc-* değişkenlerine yazar, html.sahneli ekler ve `dd-gorsel` olayı yayar
 * (ui-core açık pencereyi yeniden çizer). @returns {Promise<object|null>}
 */
export const gorselYukle = () => (L ||= import('./gorsel-png.js').then(m => {
  G = m;
  for (const k of m.KEYS) if (/^(koru-|maden$|dipsiz-|yeralti-|balik-|kristal-|dunya-|minidizi-)/.test(k)) root.style.setProperty('--sc-' + k, `url(${m.url(k)})`);
  root.classList.add('sahneli');
  try { window.dispatchEvent(new Event('dd-gorsel')); } catch { /* pencere yok */ }
  return m;
}).catch(() => { L = null; return null; }));
/** Sahne görseli URL'si (yoksa null; paket inmemişse indirmeyi başlatır). */
export const sahneUrl = k => G ? G.url(k) || null : (gorselYukle(), null);
/** NPC yüz portresi URL'si (yoksa null; paket inmemişse indirmeyi başlatır). */
export const npcYuz = k => G ? G.url(k + '-yuz') || null : (gorselYukle(), null);
// P26 O15: eskiden açılıştan 3,5 sn sonra iniyordu (4,2 MB, sunucu ekranında). Artık ilk kullanımda (yetenek simgesi, NPC yüzü)
// ya da ilk pencere/modal/öğretici örtüsü açılınca iner (--sc-* arka planları bu ekranlarda).
try {
  const acik = () => ['win'].some(id => // P28 yuk: yalnız pencere (öğretici/onay modalı 4 MB indirmesin; modaldaki NPC yüzü npcYuz ile ilk kullanımda iner)
    { const e = document.getElementById(id); return e && !e.hidden && e.childElementCount; });
  const mo = new MutationObserver(() => { if (acik()) { mo.disconnect(); gorselYukle(); } });
  mo.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['hidden'] });
} catch { setTimeout(gorselYukle, 3500); }
import('./amblem-png.js').then(m => {
  root.style.setProperty('--amb-sancak', `url(${m.url('amblem-sancak')})`); root.style.setProperty('--amb-ocak', `url(${m.url('amblem-ocak')})`); root.style.setProperty('--logo-korant', `url(${m.url('logo')})`);
  root.classList.add('amblemli');
}).catch(() => {});
// 23 Kas (C9/M3): Gemini C sınıfı arayüz glifleri (js/glif-png.js, 91 KB) → --gl-<ad>; html.glifli. Ana ekran rayları,
// alt menü ve Savaş düğmesi bunları CSS maskesiyle halk rengine boyar (v27-duzen.css "M3 glifleri"). Kapatmak: dd_glif='0' ya da ?glif=0.
const glifKapali = (() => { try { return localStorage.getItem('dd_glif') === '0' || /[?&]glif=0/.test(location.search); } catch { return false; } })();
if (!glifKapali) import('./glif-png.js').then(m => {
  for (const k of m.KEYS) root.style.setProperty('--gl-' + k, `url(${m.url(k)})`);
  root.classList.add('glifli');
}).catch(() => {});
// 23 Kas (C11): sanat kitabı düğme rolleri (duzen.css "Düğme rolleri"): birincil / ikincil / tehlike / satın alma.
// Kapatmak (eski görünüş): dd_rol='0' ya da ?rol=0.
try { if (!(localStorage.getItem('dd_rol') === '0' || /[?&]rol=0/.test(location.search))) root.classList.add('roller'); } catch { root.classList.add('roller'); }
// 23 Kas (C8): pencere başlıklarındaki küçük NPC başı — G4 yüzü hazırsa <img>, değilse eski SVG çizimi
export const npcBas = (k, yedek = '') => { const u = npcYuz(k); return u ? `<img class="npc-yuz" src="${u}" alt="" draggable="false">` : yedek; };
