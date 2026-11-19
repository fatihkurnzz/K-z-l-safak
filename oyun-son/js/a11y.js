// Erişilebilirlik ayarları (cihazda saklanır: dd_a11y). Yalnızca veri: motor (engine3d, audio, orient, combat) buradan okur,
// arayüz (ui-erisim.js) yazar. Değişince html sınıfları ve CSS değişkenleri güncellenir, 'dd-a11y' olayı yayılır.
const KEY = 'dd_a11y';
// Erişilebilirlik simgesi (Ayarlar sekmesi ve ana ekrandaki düğme)
export const A11Y_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="4.2" r="2.2"/><path d="M4 7.5l8 1.6 8-1.6.5 1.8-6 1.6v4.2l2.4 6.3-1.9.7L12 16l-3 6.1-1.9-.7 2.4-6.3v-4.2l-6-1.6z"/></svg>';
export const A11Y_DEFAULT = {
  scale: 0.95,        // arayüz ölçeği (pencereler, kartlar, düğmeler); 3B sahne değişmez
  text: 'n',          // yazı boyutu: n normal · l büyük · xl çok büyük
  cb: false,          // renk körü modu: nadirlik ve olumlu/olumsuz etkiler biçimle de ayrılır
  hc: false,          // yüksek kontrast
  noFlash: false, noShake: false, noBloom: false, noStop: false, // efektleri azalt (ayrı ayrı)
  mono: false,        // tek kanal ses
  captions: false,    // sesli ipuçlarının ekranda yazısı
  bigTouch: false,    // en az 44 piksel dokunma alanı
  slowTimer: false,   // Canlı Meydan hamle süresi ×2
  hand: 'c',          // tek elle oynama: c orta · l sola · r sağa yaslı alt menü
  orient: 'auto',     // ekran yönü: auto · lock (o anki yön sabitlenir)
  orientRot: null,    // sabitlenen yön: true döndürülmüş, false düz
  speed: 1,           // varsayılan savaş hızı: 0.7 yavaş · 1 normal · 2 hızlı
  bigTurn: false,     // büyütülmüş sıra çubuğu
  noChat: false,      // ana ekran sohbet şeridini gizle
  noTicker: false,    // duyuru şeridini gizle (sohbetteki sabit duyuru kalır)
};
const load = () => { try { return { ...A11Y_DEFAULT, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return { ...A11Y_DEFAULT }; } };
export const A = load();
export function applyA11y() {
  const r = document.documentElement, c = r.classList;
  r.style.setProperty('--uis', String(A.scale));
  r.style.setProperty('--uit', String(A.text === 'xl' ? 1.25 : A.text === 'l' ? 1.12 : 1));
  c.toggle('a-cb', A.cb); c.toggle('a-hc', A.hc); c.toggle('a-nofl', A.noFlash); c.toggle('a-big', A.bigTouch);
  c.toggle('a-hl', A.hand === 'l'); c.toggle('a-hr', A.hand === 'r'); c.toggle('a-bigturn', A.bigTurn); c.toggle('a-nochat', A.noChat); c.toggle('a-noticker', A.noTicker);
  c.toggle('a-text', A.text !== 'n');
}
export function setA11y(patch) {
  Object.assign(A, patch);
  try { localStorage.setItem(KEY, JSON.stringify(A)); } catch { /* gizli pencere: yalnızca bu oturum */ }
  applyA11y();
  window.dispatchEvent(new Event('dd-a11y'));
}
if (typeof document !== 'undefined') applyA11y();
