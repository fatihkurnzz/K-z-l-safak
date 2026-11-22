// 23 Kas (görev C7, GPT G5): tek parça boyalı sahneler ve Mini Dizi kapakları. js/sahne-png.js ana üs açıldıktan sonra arkada
// iner (≈2.3 MB). Yüklenince her sahne kök öğeye CSS değişkeni olarak yazılır: --sc-<anahtar> (url). Pencereler bu değişkeni
// arka plan olarak kullanır (css/v27-duzen.css "Boyalı sahneler"); değişken yokken eski çizim kalır. Kural içermez.
// Anahtarlar: koru-sancak, koru-ocak, maden, dipsiz-kuyu, yeralti-ocagi, balik-tut, kristal-nobeti, dunya-baskini, minidizi-01…10
let P = null, L = null;
export const sahneUrl = k => P?.url(k) || null;
export const sahneYukle = () => (L ||= import('./sahne-png.js').then(m => {
  P = m; const st = document.documentElement.style;
  for (const k of m.KEYS) st.setProperty('--sc-' + k, `url(${m.url(k)})`);
  document.documentElement.classList.add('sahneli');
  return m;
}).catch(() => null));
setTimeout(sahneYukle, 3500);
