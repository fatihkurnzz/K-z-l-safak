// OTOMATİK ÜRETİLİR (_tasarim/araclar/karakter-gom.py) — elle düzenleme. GPT "VAHRAN Claude Devir" karakter paketi:
// 16 tam boy 2B seçim görseli (512×768; anahtar ırk.sınıf.cinsiyet) + 20 yüz portresi (yuz.ırk.cinsiyet.yüz). SANAT ONAYI BEKLİYOR.
// P26 O15 (açılış yükü): görsel verisi karakter-png-veri.js'te; bu modül yalnız BOX + API'dir ve veriyi
// ilk gereken anda (karakterYukle ya da ilk sprUrl/yuzUrl çağrısı) dinamik import ile indirir. Yüklenene dek URL'ler null döner;
// yüklenince 'dd-karakter' olayı yayılır ve açık pencere yeniden çizilir. main.js karakter ekranından önce bekler.
// BOX: görünür alfa sınırı [x0, y0, x1, y1] (512×768 tuvalde) — ayak hizası y1.
export const BOX = {"sancak.mage.m":[22,254,491,745],"sancak.mage.f":[22,222,491,745],"sancak.priest.m":[21,181,491,745],"sancak.priest.f":[23,151,491,745],"sancak.warrior.m":[93,241,419,738],"sancak.warrior.f":[60,145,452,737],"sancak.rogue.m":[21,166,491,745],"sancak.rogue.f":[21,134,489,745],"ocak.mage.m":[5,215,508,763],"ocak.mage.f":[6,5,506,764],"ocak.priest.m":[4,206,507,763],"ocak.priest.f":[5,180,508,763],"ocak.warrior.m":[26,125,486,738],"ocak.warrior.f":[114,238,398,738],"ocak.rogue.m":[4,211,507,764],"ocak.rogue.f":[4,195,508,763]};
let D = {}, KP = null;
/**
 * Karakter görsellerini (karakter-png-veri.js, ~1,8 MB) bir kez indirir. Yüklenince `dd-karakter` olayı yayılır.
 * @returns {Promise<boolean>} yüklendi mi
 */
export const karakterYukle = () => (KP ||= import('./karakter-png-veri.js').then(m => {
  D = m.default || {}; KEYS.splice(0, KEYS.length, ...Object.keys(D));
  try { window.dispatchEvent(new Event('dd-karakter')); } catch { /* pencere yok */ }
  return true;
}, () => { KP = null; return false; }));
/** Veri yüklendi mi (eşzamanlı). */
export const karakterHazir = () => KEYS.length > 0;
const U = {};
const url = k => { if (U[k]) return U[k]; const s = D[k]; if (!s) { if (!KEYS.length) karakterYukle(); return null; }
  try { const b = atob(s), a = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return (U[k] = URL.createObjectURL(new Blob([a], { type: "image/webp" }))); }
  catch { return (U[k] = "data:image/webp;base64," + s); } };
const r_ = r => (r === 'ocak' ? 'ocak' : 'sancak'), g_ = g => (g === 'f' ? 'f' : 'm');
// Tam boy: ırk (sancak|ocak), sınıf (warrior|rogue|mage|priest), cinsiyet (m|f)
export const sprKey = (race, cls, g) => `${r_(race)}.${BOX[`${r_(race)}.${cls}.m`] ? cls : 'warrior'}.${g_(g)}`;
export const sprUrl = (race, cls, g) => url(sprKey(race, cls, g));
export const sprBox = (race, cls, g) => BOX[sprKey(race, cls, g)];
// Yüz portresi: oyundaki yüz seçeneği (shared/gorunus.js FACES, 0-4) ile birebir
export const yuzUrl = (race, g, face) => url(`yuz.${r_(race)}.${g_(g)}.${Math.max(0, Math.min(4, face | 0))}`);
/** Yüklü anahtarlar (veri gelene dek boş; yüklenince doldurulur). */
export const KEYS = [];
