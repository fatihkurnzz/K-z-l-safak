// 23 Kas: GPT görsel teslimlerinin yükleyicisi (yayın 511 dosya sınırı yüzünden tek dosyada).
//  · js/amblem-png.js (160 KB, G8): hemen iner → kök öğeye --amb-sancak, --amb-ocak, --logo-korant; html.amblemli
//  · js/gorsel-png.js (≈4 MB): G4 NPC portreleri (ad, ad-yuz), G5 sahneler ve Mini Dizi kapakları, G6 yetenek simgeleri (kimlik).
//    Giriş ekranı açıldıktan 3,5 sn sonra arkada iner; sahneler kök öğeye --sc-<anahtar> olarak yazılır, html.sahneli eklenir.
//    Yüklenene dek eski çizimler kalır (CSS değişkenleri yoktur, skillIcon siluet çizer, diyalog bekler).
// Sahne anahtarları: koru-sancak, koru-ocak, maden, dipsiz-kuyu, yeralti-ocagi, balik-tut, kristal-nobeti, dunya-baskini, minidizi-01…10
const root = document.documentElement;
let G = null, L = null;
export const gorsel = () => G;
export const gorselYukle = () => (L ||= import('./gorsel-png.js').then(m => {
  G = m;
  for (const k of m.KEYS) if (/^(koru-|maden$|dipsiz-|yeralti-|balik-|kristal-|dunya-|minidizi-)/.test(k)) root.style.setProperty('--sc-' + k, `url(${m.url(k)})`);
  root.classList.add('sahneli');
  return m;
}).catch(() => null));
export const sahneUrl = k => G?.url(k) || null;
export const npcYuz = k => G?.url(k + '-yuz') || null;
setTimeout(gorselYukle, 3500);
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
