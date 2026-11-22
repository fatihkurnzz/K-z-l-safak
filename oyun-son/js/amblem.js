// 23 Kas (GPT G8): Korant Online logosu ve halk amblemleri (Elentha güneş-kartal, Kragmir göz-örs). js/amblem-png.js (160 KB)
// hemen arkada iner; yüklenince kök öğeye --amb-sancak, --amb-ocak, --logo-korant yazılır ve html.amblemli eklenir.
// Kullanan CSS: css/v27-duzen.css "Amblem ve logo". Değişken yokken eski çizimler kalır.
let P = null;
export const amblemUrl = k => P?.url(k) || null;
import('./amblem-png.js').then(m => {
  P = m; const st = document.documentElement.style;
  st.setProperty('--amb-sancak', `url(${m.url('amblem-sancak')})`); st.setProperty('--amb-ocak', `url(${m.url('amblem-ocak')})`); st.setProperty('--logo-korant', `url(${m.url('logo')})`);
  document.documentElement.classList.add('amblemli');
}).catch(() => {});
