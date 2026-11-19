// Grafik kademeleri (Düşük / Orta / Yüksek): hangi cihazın hangi kademede açılacağı, her kademenin bütçesi ve
// kare süresi uzun kalınca kademeyi düşüren denetçi. Bu modül saftır: three.js ya da sayfa gerektirmez (testleri
// server/test/isik.test.js içindedir); sahneye uygulayan taraf engine3d.js'tir.
//
// Kayıt: localStorage "dd_gfx" = 'low' | 'mid' | 'high' (oyuncunun kendi seçimi; yoksa kademe otomatiktir).
//   'low' eskiden beri aynı anlama gelir: koddan üretilen hafif karakterler, işlem sonrası (bloom) yok.
// Otomatik kademede denetçinin indirdiği kat "dd_gfx_auto" içinde saklanır: bir kez inen kademe kendiliğinden
// geri çıkmaz (gidip gelme olmaz); oyuncu ayardan yeniden "Otomatik" seçerse ölçüm baştan yapılır.
// Deneme için adres çubuğundan ?gfx=low|mid|high verilebilir (kayda yazılmaz, denetçi çalışmaz).

export const TIER_KEYS = ['min', 'low', 'mid', 'high'];
export const TIER_NAMES = { min: 'En Düşük', low: 'Düşük', mid: 'Orta', high: 'Yüksek' };
export const TIER_NOTES = {
  min: 'Hafif karakter modelleri, gölge yerine zemin lekesi, ışıma ve savaş süsleri kapalı. Çok eski telefonlar için.',
  low: 'Ayrıntılı karakterler; ışıma (bloom) ve gölge kapalı, düşük çözünürlük. 3 GB belleğe kadar Android telefonlar için.',
  mid: 'Ayrıntılı karakterler, yumuşak gölge, ışıma ve savaş efektleri. Çoğu telefon için.',
  high: 'En keskin görüntü: tam çözünürlük, ayrıntılı gölge, kenar yumuşatma, en yoğun efektler.',
};

// Kademe bütçeleri. Sayılar üst sınırdır; sahne bunların altında kalır.
//  dpr: piksel oranı tavanı · post: işlem sonrası (bloom) · bloomDiv: bloom çözünürlüğü böleni · msaa: kenar yumuşatma örneği
//  shadow: gölge haritası kenarı (0 = yok) · shadowEvery: gölge kaç karede bir yenilenir · blob: birim altı zemin lekesi koyuluğu
//  rigged: iskeletli modeller yüklensin mi · particles: havuzdaki parçacık sayısı · sprites: havuzdaki efekt levhası sayısı
//  fxLights: efektlerin kullanabileceği nokta ışığı · lamps: ortamdaki meşale ışığı · fx: savaş efekti düzeyi (0 = yalnızca vuruş tozu)
//  tex: zemin / desen / çimen dokusu kenarı · aniso: doku süzmesi · grass: çimen tutamı · drift: havada süzülen parçacık
//  dress: ana üs süsleri (duman, yaprak, dalgalanan sancak) · envMap: ortam yansıması her sahnede yeniden üretilsin mi
export const TIERS = {
  min:  { dpr: 1.25, post: false, bloomDiv: 0, msaa: 0, shadow: 0,    shadowEvery: 0, blob: 0.5,  rigged: false, particles: 96,  sprites: 0,  fxLights: 0, lamps: 1, fx: 0, tex: [512, 256, 256],   aniso: 1, grass: 450,  drift: 60,  dress: false, envMap: false },
  low:  { dpr: 1.25, post: false, bloomDiv: 0, msaa: 0, shadow: 0,    shadowEvery: 0, blob: 0.5,  rigged: true,  particles: 160, sprites: 12, fxLights: 0, lamps: 1, fx: 1, tex: [512, 256, 256],   aniso: 2, grass: 600,  drift: 80,  dress: false, envMap: false },
  mid:  { dpr: 1.5,  post: true,  bloomDiv: 3, msaa: 2, shadow: 1024, shadowEvery: 2, blob: 0.22, rigged: true,  particles: 320, sprites: 24, fxLights: 1, lamps: 2, fx: 1, tex: [1024, 512, 512],  aniso: 4, grass: 900,  drift: 110, dress: true,  envMap: true },
  high: { dpr: 2,    post: true,  bloomDiv: 2, msaa: 4, shadow: 2048, shadowEvery: 1, blob: 0.22, rigged: true,  particles: 720, sprites: 40, fxLights: 2, lamps: 4, fx: 2, tex: [1024, 512, 512],  aniso: 8, grass: 1400, drift: 160, dress: true,  envMap: true },
};
export const isTier = t => typeof t === 'string' && Object.hasOwn(TIERS, t);
const rank = t => TIER_KEYS.indexOf(t);
export const lowerOf = (a, b) => (rank(a) <= rank(b) ? a : b);
export const stepDown = t => TIER_KEYS[Math.max(0, rank(t) - 1)];

// ---------- Cihaz ipuçlarından kademe ----------
// h: { memory: GB (navigator.deviceMemory), cores, dpr, mobile, gpu: sürücü adı (WEBGL_debug_renderer_info), saveData }
// Bilinmeyen alanlar yok sayılır; hiçbir ipucu yoksa orta kademe seçilir (denetçi gerekirse indirir).
const SOFT = /swiftshader|llvmpipe|software|softpipe|basic render|microsoft basic/i;
const WEAK = /mali-(4|t[0-9]|g3[01]|g51\b)|adreno \(tm\) [2-4]\d\d|adreno \(tm\) 50\d|powervr (sgx|rogue ge)|videocore|tegra [23]|intel\(r\) hd graphics [2-4]\d{3}\b|gma /i;
const MIDGPU = /mali-g(5[27]|6[18]|7[126]\b)|adreno \(tm\) (5[1-4]\d|6[01]\d)|powervr rogue g|apple a(9|1[01])\b|intel\(r\) (u?hd|iris)/i;
export function pickTier(h = {}) {
  if (!h || typeof h !== 'object') h = {};
  const num = v => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : 0); // yalnızca düz sayı; başka her şey "bilinmiyor"
  const gpu = typeof h.gpu === 'string' ? h.gpu : '', mem = num(h.memory), cores = num(h.cores);
  if (SOFT.test(gpu) || h.saveData === true || (mem && mem <= 1) || (cores && cores <= 2)) return 'min';
  if (WEAK.test(gpu) || (mem && mem <= 3)) return 'low'; // deviceMemory 3 GB'lık telefonda 2 bildirir: bu telefonlar Düşük'te açılır (ışıma ve gölge kapalı)
  if (MIDGPU.test(gpu) || (mem && mem <= 4) || (cores && cores <= 4)) return 'mid';
  if (h.mobile === true) return mem >= 6 && cores >= 8 ? 'high' : 'mid'; // telefonda yalnızca belleği ve çekirdeği bol cihaz yüksek açılır
  return cores >= 4 || mem >= 8 ? 'high' : 'mid';
}

// ---------- Kare süresi denetçisi ----------
// Ölçüm pencereler hâlinde yapılır: bir pencerenin ortalama kare süresi kademenin bütçesini aşarsa "uzun" sayılır;
// art arda `strikes` uzun pencere görülünce kademe bir basamak iner. Arada bütçeye uyan tek pencere sayacı sıfırlar
// (kısa takılmalar kademe düşürmez). Denetçi kademeyi yalnızca indirir, asla çıkarmaz: bu yüzden gidip gelme olamaz.
// İndirdikten sonra `cooldown` süresince ölçmez (gölgelendiriciler yeniden derlenir, ilk kareler yanıltıcıdır).
// Sahne kurulurken pause() çağrılır; 1 saniyeden uzun kare (arka plana atılmış sekme) hiç sayılmaz.
export const GOV = { budget: { high: 22, mid: 28, low: 32 }, // ≈45 / ≈36 FPS'nin altı uzun sayılır (hafif kasmayı da yakalar)
  window: 3000, strikes: 2, warmup: 5000, cooldown: 6000, gap: 1000 };
export class Governor {
  constructor(tier, opt = {}) {
    this.tier = isTier(tier) ? tier : 'mid';
    this.o = { ...GOV, ...opt, budget: { ...GOV.budget, ...(opt.budget || {}) } };
    this.sum = 0; this.n = 0; this.bad = 0; this.hold = this.o.warmup; this.steps = 0;
  }
  // Ölçümü ms kadar ertele (sahne kurulumu, model yükleme); süren pencere atılır
  pause(ms = 1500) { this.hold = Math.max(this.hold, ms); this.sum = 0; this.n = 0; }
  // Bir karenin gerçek süresi (ms). Kademe indiyse yeni kademeyi, inmediyse null döndürür.
  sample(dt) {
    if (this.tier === 'min' || !(dt > 0) || dt > this.o.gap) return null;
    if (this.hold > 0) { this.hold -= dt; return null; }
    this.sum += dt; this.n++;
    if (this.sum < this.o.window) return null;
    const avg = this.sum / this.n;
    this.sum = 0; this.n = 0;
    this.bad = avg > this.o.budget[this.tier] ? this.bad + 1 : 0;
    if (this.bad < this.o.strikes) return null;
    this.bad = 0; this.hold = this.o.cooldown; this.steps++;
    return (this.tier = stepDown(this.tier));
  }
}

// ---------- Kayıt ----------
// read: { get(k), set(k, v), del(k) } · query: adres çubuğundaki ?gfx değeri
// Dönen: { tier: etkin kademe, choice: 'auto' | 'low' | 'mid' | 'high', forced: adresle zorlandı mı }
export function resolveGfx(store, hints, query) {
  if (isTier(query)) return { tier: query, choice: query, forced: true };
  const own = store?.get('dd_gfx');
  if (isTier(own)) return { tier: own, choice: own, forced: false };
  const floor = store?.get('dd_gfx_auto'), picked = pickTier(hints);
  return { tier: isTier(floor) ? lowerOf(floor, picked) : picked, choice: 'auto', forced: false };
}

// ---------- Çalışan durum (tarayıcıda) ----------
const mem = new Map(); // localStorage yoksa (gizli sekme, gömülü çerçeve) oturum boyunca bellekte tutulur
const LS = { get(k) { try { return globalThis.localStorage?.getItem(k) ?? mem.get(k) ?? null; } catch { return mem.get(k) ?? null; } },
  set(k, v) { mem.set(k, v); try { globalThis.localStorage?.setItem(k, v); } catch { } },
  del(k) { mem.delete(k); try { globalThis.localStorage?.removeItem(k); } catch { } } };
const subs = new Set();
const state = { tier: 'mid', choice: 'auto', forced: false, hints: {}, gov: null };
export const gfx = {
  get tier() { return state.tier; },          // etkin kademe
  get choice() { return state.choice; },      // oyuncunun seçimi ('auto' dahil)
  get T() { return TIERS[state.tier]; },      // etkin kademenin bütçesi
  get hints() { return state.hints; },
};
const apply = (tier, why) => { if (tier === state.tier) return; const from = state.tier; state.tier = tier; subs.forEach(fn => fn(tier, from, why)); };
// engine3d açılışta bir kez çağırır (ekran kartının adı ancak WebGL bağlamından öğrenilir)
export function initGfx(hints = {}) {
  let q = null; try { q = new URLSearchParams(globalThis.location?.search || '').get('gfx'); } catch { }
  const r = resolveGfx(LS, hints, q);
  Object.assign(state, r, { hints, gov: r.choice === 'auto' && !r.forced ? new Governor(r.tier) : null });
  return state.tier;
}
// Ayar ekranı için: getGfx() → { tier, choice, forced, names } · setGfx('auto' | 'low' | 'mid' | 'high') → etkin kademe
// Kademe hemen uygulanır (çözünürlük, gölge, ışıma, efektler); iskeletli modellerin yüklenip yüklenmemesi oyun
// yeniden açılınca değişir (needsReload bunu söyler).
export const getGfx = () => ({ tier: state.tier, choice: state.choice, forced: state.forced, names: TIER_NAMES });
export function setGfx(choice) {
  if (choice !== 'auto' && !isTier(choice)) return state.tier;
  if (choice === 'auto') { LS.del('dd_gfx'); LS.del('dd_gfx_auto'); } else LS.set('dd_gfx', choice);
  const r = resolveGfx(LS, state.hints, null);
  state.choice = r.choice; state.forced = false; state.gov = r.choice === 'auto' ? new Governor(r.tier) : null;
  apply(r.tier, 'user');
  return state.tier;
}
// Açılışta yüklenen model türü (iskeletli / hafif) seçilen kademeyle uyuşmuyorsa oyun yeniden açılmalıdır
export const needsReload = loadedRigged => TIERS[state.tier].rigged !== !!loadedRigged;
export const onTier = fn => { subs.add(fn); return () => subs.delete(fn); };
// Ana döngü her karede gerçek kare süresini bildirir; kademe inerse kayda yazılır ve dinleyenlere haber verilir
export function frameSample(dtMs) {
  const t = state.gov?.sample(dtMs);
  if (t) { LS.set('dd_gfx_auto', t); apply(t, 'auto'); }
  return t || null;
}
export const pauseGovernor = ms => state.gov?.pause(ms);
