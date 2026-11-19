// Ses motoru. Oyunda hiç ses dosyası yoktur: bütün sesler Web Audio API ile (osilatör, gürültü, süzgeç, zarf, küçük bir
// yankı) üretilir. Bu modül yalnızca motordur; ses tanımları (yamalar, ortam döngüleri, ezgi yatakları) sfx.js'ten
// register() ile gelir. Kural içermez, oyunun sonucuna dokunmaz.
//  - Tek AudioContext, ilk kullanıcı dokunuşunda kurulur ve açılır (mobil otomatik çalma kuralları: iOS Safari, Android
//    WebView). Dokunuş dinleyicisi takılı kalır: iOS arama ya da arka plan sonrası bağlamı "interrupted" bırakırsa sıradaki
//    dokunuş yeniden açar.
//  - Ana çıkış + üç veri yolu (ui: Arayüz, battle: Savaş, amb: Ortam ve müzik), ayrı ses düzeyi ve susturma.
//    Ana çıkışta sıkıştırıcı + yumuşak kırpıcı vardır: üst üste binen vuruşlar çıkışı taşırmaz (tepe < 1).
//  - Ses sınırı (toplam ve veri yolu başına) ve ses başına sıklık sınırı (Gate): 3x hızda oto savaş gürültüye dönmez.
//  - Sayfa gizlenince bağlam askıya alınır, görünür olunca sürer. hold(): yükleme ekranı ve cihazın bildirim izni
//    penceresi açıkken ses çıkmaz.
//  - Döngüler (ortam, ezgi) ses saatine göre önceden zamanlanır (120 ms'de bir kısa bir bakış); kare başına JS sentezi
//    ve kare başına bellek ayırma yoktur.
//  - Ayarlar tek anahtarda saklanır (localStorage: dd_audio). getAudio / setAudio / setVolume / mute / onAudio ayarlar
//    menüsünün kullanacağı arayüzdür.

export const BUSES = { ui: 'Arayüz', battle: 'Savaş', amb: 'Ortam ve müzik' };
export const BUS_KEYS = Object.keys(BUSES);
export const AUDIO_KEY = 'dd_audio';
export const AUDIO_DEFAULTS = Object.freeze({ v: 1, on: true, master: 0.7, vol: Object.freeze({ ui: 0.8, battle: 0.8, amb: 0.5 }), mute: Object.freeze({ ui: false, battle: false, amb: false }) });

// ---------- Ayarlar (saf) ----------
const own = (o, k) => (o && typeof o === 'object' && !Array.isArray(o) && Object.hasOwn(o, k) ? o[k] : undefined);
const num01 = (v, d) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : d);
// Bozuk, eksik ya da başka biçimli kayıt varsayılanlara döner; bilinmeyen alanlar atılır
export function cleanSettings(raw) {
  const out = { v: 1, on: typeof own(raw, 'on') === 'boolean' ? raw.on : AUDIO_DEFAULTS.on, master: num01(own(raw, 'master'), AUDIO_DEFAULTS.master), vol: {}, mute: {} };
  for (const b of BUS_KEYS) { out.vol[b] = num01(own(own(raw, 'vol'), b), AUDIO_DEFAULTS.vol[b]); out.mute[b] = own(own(raw, 'mute'), b) === true; }
  return out;
}
export function loadSettings(storage) { try { const s = storage.getItem(AUDIO_KEY); return cleanSettings(typeof s === 'string' && s.length < 2000 ? JSON.parse(s) : null); } catch { return cleanSettings(null); } }
export function saveSettings(storage, s) { try { storage.setItem(AUDIO_KEY, JSON.stringify(cleanSettings(s))); return true; } catch { return false; } }

// ---------- Sıklık ve ses sınırı (saf) ----------
// allow(): aynı ses en az "gap" ms arayla çalar; veri yolu başına jeton kovası saniyedeki ses sayısını sınırlar (öncelik 2
// kovayı atlar: zafer, seviye, örs sonucu gibi kaçmaması gereken sesler). Hemen yinelenen ses biraz kısılır.
// admit(): aynı anda çalan ses sayısı sınırı; yer yoksa en düşük öncelikli en eski ses susturulur ya da yeni ses çalmaz.
export class Gate {
  constructor(o = {}) {
    this.cap = o.cap ?? 20;
    this.busCap = { ui: 7, battle: 12, amb: 10, ...o.busCap };
    this.rate = { ui: 14, battle: 16, amb: 12, ...o.rate };   // saniyede dolan jeton
    this.burst = { ui: 6, battle: 8, amb: 8, ...o.burst };    // kovanın boyu
    this.last = new Map(); this.tok = {}; this.at = {}; this.voices = [];
  }
  // now: şimdiki an (ms) · when: sesin çalacağı an (gecikmeli seslerde ileride); aralık "when" ile, kova "now" ile ölçülür
  allow(name, bus, now, gap = 60, prio = 1, when = now) {
    const last = this.last.get(name);
    if (last !== undefined && when >= last && when - last < gap) return 0;
    if (prio < 2) {
      const cap = this.burst[bus] ?? 6, at = this.at[bus];
      let tok = at === undefined || now < at ? cap : Math.min(cap, this.tok[bus] + (now - at) / 1000 * (this.rate[bus] ?? 12));
      this.at[bus] = now;
      if (tok < 1) { this.tok[bus] = tok; return 0; }
      this.tok[bus] = tok - 1;
    }
    this.last.set(name, when);
    return last !== undefined && when >= last && when - last < gap * 4 ? 0.75 : 1;
  }
  // v: { bus, prio, end } · döner: { ok, steal } (steal: susturulacak ses)
  admit(v, now) {
    const vs = this.voices;
    for (let i = vs.length - 1; i >= 0; i--) if (vs[i].end <= now) vs.splice(i, 1);
    let nb = 0;
    for (const x of vs) if (x.bus === v.bus) nb++;
    const full = vs.length >= this.cap, busFull = nb >= (this.busCap[v.bus] ?? this.cap);
    if (!full && !busFull) { vs.push(v); return { ok: true, steal: null }; }
    let victim = null;
    for (const x of vs) if ((full || x.bus === v.bus) && (!victim || x.prio < victim.prio || (x.prio === victim.prio && x.end < victim.end))) victim = x;
    if (!victim || victim.prio > v.prio) return { ok: false, steal: null };
    vs.splice(vs.indexOf(victim), 1); vs.push(v);
    return { ok: true, steal: victim };
  }
  drop(v) { const i = this.voices.indexOf(v); if (i >= 0) this.voices.splice(i, 1); }
}

// ---------- Kayıt: ses tanımları ----------
// patches: tek seferlik sesler · loops: ortam ve ezgi döngüleri (biçimler sfx.js başında anlatılır)
const REG = { patches: {}, loops: {} };
export function register(t) { Object.assign(REG.patches, t.patches || {}); Object.assign(REG.loops, t.loops || {}); }
export const hasSound = name => Object.hasOwn(REG.patches, name);
export const hasLoop = name => Object.hasOwn(REG.loops, name);
export const soundNames = () => Object.keys(REG.patches);
export const loopNames = () => Object.keys(REG.loops);
const PV = [1, 1.06, 0.943]; // çeşitleme: yamanın perdesi her çalışta üç değerden biriyle çarpılır (pv: 0 ise sabit perde)
export const variantsOf = name => (hasSound(name) ? REG.patches[name].n ?? 3 : 0);
export function layersOf(name, v = 0) { const P = REG.patches[name]; return typeof P.L === 'function' ? P.L(v) : P.L; }
const layerEnd = (L, ts = 1) => (L.t || 0) * ts + Math.max(0.001, L.a ?? 0.004) + (L.h || 0) * ts + Math.max(0.01, (L.d ?? 0.1) * ts);
// Yamanın tasarlanan süresi (sn): katmanların en geç biteni (yankı kuyruğu hariç)
export const patchDur = (name, v = 0) => layersOf(name, v).reduce((m, L) => Math.max(m, layerEnd(L)), 0);

// ---------- Ses grafiği ----------
const WAVE = { sine: 'sine', tri: 'triangle', saw: 'sawtooth', sq: 'square' };
const FILTERS = [['hp', 'highpass'], ['lp', 'lowpass'], ['bp', 'bandpass']];
// Belirlenimci gürültü üreteci (çevrimdışı ölçümler her seferinde aynı sonucu versin)
const xs = seed => { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; };
function softClip() { // |x| ≤ 0,7 doğrusal, üstü yumuşakça 0,93'e yaklaşır: çıkış hiçbir girdide 1'e ulaşmaz
  const n = 2049, c = new Float32Array(n);
  for (let i = 0; i < n; i++) { const x = i / (n - 1) * 2 - 1, a = Math.abs(x); c[i] = Math.sign(x) * (a <= 0.7 ? a : 0.7 + 0.3 * Math.tanh((a - 0.7) / 0.3)); }
  return c;
}
function impulse(ctx) { // küçük taş avlu yankısı: üstel sönen, giderek koyulaşan gürültü (1,1 sn, iki kanal)
  const sr = ctx.sampleRate, n = Math.floor(sr * 1.1), buf = ctx.createBuffer(2, n, sr);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch), r = xs(0x51ab3 + ch * 977); let lp = 0;
    for (let i = 0; i < n; i++) { const t = i / sr; lp += ((r() * 2 - 1) - lp) * (0.8 - 0.55 * t / 1.1); d[i] = lp * Math.exp(-t * 5.4) * Math.min(1, t / 0.006); }
  }
  return buf;
}
function noiseBuf(g, color) { // 2 sn'lik, ek yeri yumuşatılmış döngü: w beyaz · p pembe · b kahverengi
  if (g.noise[color]) return g.noise[color];
  const sr = g.ctx.sampleRate, n = sr * 2, k = Math.floor(sr * 0.05), raw = new Float32Array(n + k), r = xs(color === 'w' ? 11 : color === 'p' ? 23 : 37);
  let b0 = 0, b1 = 0, b2 = 0, br = 0, peak = 0;
  for (let i = 0; i < n + k; i++) {
    const w = r() * 2 - 1;
    if (color === 'w') raw[i] = w;
    else if (color === 'p') { b0 = 0.99765 * b0 + w * 0.0990460; b1 = 0.96300 * b1 + w * 0.2965164; b2 = 0.57000 * b2 + w * 1.0526913; raw[i] = b0 + b1 + b2 + w * 0.1848; }
    else { br = (br + 0.02 * w) / 1.02; raw[i] = br; }
    peak = Math.max(peak, Math.abs(raw[i]));
  }
  const buf = g.ctx.createBuffer(1, n, sr), d = buf.getChannelData(0), s = 0.9 / (peak || 1);
  for (let i = 0; i < n; i++) d[i] = (i < k ? raw[i] * (i / k) + raw[n + i] * (1 - i / k) : raw[i]) * s;
  return (g.noise[color] = buf);
}
// raw: sıkıştırıcısız ve kırpıcısız (yamanın kendi tepe değerini ölçmek için)
// Tek kanal ses (erişilebilirlik: dd_a11y.mono): çıkış tek kanala indirilir, iki kulağa aynı ses gider
const monoOn = () => { try { return !!JSON.parse(globalThis.localStorage?.getItem('dd_a11y') || '{}').mono; } catch { return false; } };
function monoOut(ctx) { try { const d = ctx.destination; if (monoOn()) { d.channelCount = 1; d.channelCountMode = 'explicit'; } else { d.channelCount = Math.min(2, d.maxChannelCount || 2); d.channelCountMode = 'explicit'; } } catch { /* eski tarayıcı */ } }
if (typeof window !== 'undefined') window.addEventListener('dd-a11y', () => { if (G?.ctx) monoOut(G.ctx); });
function buildGraph(ctx, s, raw = false) {
  const g = { ctx, bus: {}, noise: {}, rand: Math.random };
  g.master = ctx.createGain();
  if (raw) g.master.connect(ctx.destination);
  else {
    // Sıkıştırıcının kendi telafi kazancı vardır (eşik altındaki sesi de yükseltir); post bunu geri alır
    const c = g.comp = ctx.createDynamicsCompressor(), post = g.post = ctx.createGain(), sh = g.shaper = ctx.createWaveShaper();
    c.threshold.value = -9; c.knee.value = 8; c.ratio.value = 12; c.attack.value = 0.003; c.release.value = 0.16;
    post.gain.value = POST_GAIN; sh.curve = softClip();
    g.master.connect(c); c.connect(post); post.connect(sh); sh.connect(ctx.destination);
  }
  if (!raw) monoOut(ctx);
  g.rev = ctx.createConvolver(); g.rev.buffer = impulse(ctx);
  g.revOut = ctx.createGain(); g.revOut.gain.value = 0.9; g.rev.connect(g.revOut); g.revOut.connect(g.master);
  for (const b of BUS_KEYS) { const dry = ctx.createGain(), wet = ctx.createGain(); dry.connect(g.master); wet.connect(g.rev); g.bus[b] = { dry, wet }; }
  applyTo(g, s, 0);
  return g;
}
export const POST_GAIN = 0.9;
function applyTo(g, s, tc = 0.03) {
  const t = g.ctx.currentTime, set = (p, v) => (tc ? p.setTargetAtTime(v, t, tc) : (p.value = v));
  set(g.master.gain, s.on && !holds.size ? s.master : 0);
  for (const b of BUS_KEYS) { const v = s.mute[b] ? 0 : s.vol[b]; set(g.bus[b].dry.gain, v); set(g.bus[b].wet.gain, v); }
}
// Sabit değer doğrudan yazılır (zaman çizelgesi olmayan parametre en ucuzudur); kayma ses saatine göre zamanlanır
function sweep(param, v, pm, t, end) {
  if (typeof v === 'number') param.value = v * pm;
  else { param.setValueAtTime(v[0] * pm, t); param.exponentialRampToValueAtTime(Math.max(1, v[1] * pm), end); }
}
// Süzgeç frekansı oynuyorsa (kayma ya da yavaş salınım) katsayılar örnek başına değil, 128 örnekte bir hesaplanır:
// kulağa aynıdır, ses iş parçacığında süzgecin yükünü birkaç kat azaltır. Desteklemeyen tarayıcıda olduğu gibi kalır.
const kRate = param => { try { param.automationRate = 'k-rate'; } catch { } };
// Tek katman: kaynak (osilatör ya da gürültü) → süzgeçler → zarf (a: atak · h: tutma · d: sönme) → out
// Katman alanları sfx.js başında anlatılır. Bitiş zamanını döndürür; kaynakları srcs'e ekler.
function addLayer(g, L, t0, out, pm, ts, srcs) {
  const ctx = g.ctx, t = t0 + (L.t || 0) * ts, a = Math.max(0.001, L.a ?? 0.004), h = (L.h || 0) * ts, d = Math.max(0.01, (L.d ?? 0.1) * ts), peak = L.g ?? 0.5, end = t + a + h + d;
  const env = ctx.createGain(), p = env.gain;
  p.setValueAtTime(0, t); p.linearRampToValueAtTime(peak, t + a);
  if (h) p.setValueAtTime(peak, t + a + h);
  if (L.lin) p.linearRampToValueAtTime(0, end); else p.exponentialRampToValueAtTime(Math.max(1e-5, peak * 0.001), end);
  let src, node;
  if (L.o) {
    src = ctx.createOscillator(); src.type = WAVE[L.o] || 'sine';
    sweep(src.frequency, L.f, pm, t, L.st ? t + L.st * ts : end);
    if (L.det) src.detune.value = L.det;
    if (L.fm) { // frekans kiplemesi: [oran, derinlik, sönme süresi] (çan, metal, cızırtı)
      const f0 = (typeof L.f === 'number' ? L.f : L.f[0]) * pm, m = ctx.createOscillator(), mg = ctx.createGain();
      m.frequency.value = f0 * L.fm[0]; mg.gain.setValueAtTime(f0 * L.fm[1], t); mg.gain.exponentialRampToValueAtTime(Math.max(0.5, f0 * L.fm[1] * 0.02), t + (L.fm[2] ? L.fm[2] * ts : a + h + d));
      m.connect(mg); mg.connect(src.frequency); m.start(t); m.stop(end + 0.03); srcs.push(m);
    }
    if (L.vib) { const v = ctx.createOscillator(), vg = ctx.createGain(); v.frequency.value = L.vib[0]; vg.gain.value = L.vib[1]; v.connect(vg); vg.connect(src.detune); v.start(t); v.stop(end + 0.03); srcs.push(v); }
    src.start(t);
  } else {
    src = ctx.createBufferSource(); src.buffer = noiseBuf(g, L.n); src.loop = true;
    src.start(t, ((L.t || 0) * 7.13 + pm * 0.37 + (L.g ?? 0.5)) % 1.9);
  }
  src.stop(end + 0.03); srcs.push(src);
  node = src;
  for (const [k, type] of FILTERS) if (L[k] !== undefined) {
    const f = ctx.createBiquadFilter(), v = L[k]; f.type = type;
    sweep(f.frequency, typeof v === 'number' || v[0] === v[1] ? (typeof v === 'number' ? v : v[0]) : v.slice(0, 2), pm, t, L.st ? t + L.st * ts : end);
    if (typeof v !== 'number' && v[0] !== v[1]) kRate(f.frequency);
    f.Q.value = (typeof v !== 'number' && v[2]) || L.q || 0.8;
    node.connect(f); node = f;
  }
  node.connect(env); env.connect(out);
  return end;
}
// Bir yamayı t0 anına kurar. dest: { dry, wet } (veri yolu ya da döngünün kendi çıkışı)
function makeVoice(g, P, vi, t0, dest, o) {
  const ctx = g.ctx, vg = ctx.createGain(), srcs = [], layers = typeof P.L === 'function' ? P.L(vi) : P.L;
  const pm = (P.pv === 0 ? 1 : PV[vi % 3]) * (o.pitch || 1), ts = o.ts || 1;
  vg.gain.value = (P.g ?? 1) * (o.gain ?? 1);
  let end = t0, tail = vg, send = null;
  for (const L of layers) end = Math.max(end, addLayer(g, L, t0, vg, pm, ts, srcs));
  if (o.pan && ctx.createStereoPanner) { tail = ctx.createStereoPanner(); tail.pan.value = Math.max(-1, Math.min(1, o.pan)); vg.connect(tail); }
  tail.connect(dest.dry);
  const rv = P.rv ?? 0;
  if (rv > 0 && dest.wet) { send = ctx.createGain(); send.gain.value = rv; tail.connect(send); send.connect(dest.wet); }
  const v = { bus: P.b, prio: P.pr ?? 1, end: end + 0.05 + (rv > 0 ? 0.6 : 0), vg, srcs, name: '' }; // süresi dolunca reap() bağlantılarını söker
  v.free = () => { try { vg.disconnect(); if (tail !== vg) tail.disconnect(); send?.disconnect(); } catch { } };
  return v;
}
function killVoice(g, v, fade = 0.03) {
  const t = g.ctx.currentTime;
  try { v.vg.gain.cancelScheduledValues(t); v.vg.gain.setTargetAtTime(0, t, fade / 3); for (const s of v.srcs) s.stop(t + fade + 0.05); } catch { }
  v.end = t + fade + 0.05;
}

// ---------- Canlı motor ----------
let AC = globalThis.AudioContext || globalThis.webkitAudioContext || null;
let storage = (() => { try { return globalThis.localStorage || null; } catch { return null; } })();
let S = loadSettings(storage);
let ac = null, G = null, gate = new Gate(), hiddenPage = false, timer = null, opened = false, unlockAt = -1e9;
const holds = new Set(), subs = new Set(), wanted = new Map(), loops = new Map(), freeList = [];
const lastVar = new Map(), unknown = new Set(), ring = new Array(64).fill(''), stats = { played: 0, dropped: 0, ms: 0, ticks: 0, ring: 0 };
// Deneme ve ölçüm için: depolama, AudioContext sınıfı ve sınırlar dışarıdan verilebilir (yalnızca bağlam kurulmadan önce)
export function configure(o = {}) {
  if (o.reset) { // bağlamı kapatıp baştan başlar (denemeler)
    clearInterval(timer); timer = null; try { ac?.close?.(); } catch { }
    ac = null; G = null; opened = false; hiddenPage = false; gate = new Gate(); unlockAt = -1e9;
    holds.clear(); wanted.clear(); loops.clear(); dead.clear(); freeList.length = 0; lastVar.clear(); unknown.clear(); ring.fill('');
    stats.played = stats.dropped = stats.ms = stats.ticks = stats.ring = 0;
  }
  if ('storage' in o) { storage = o.storage; S = loadSettings(storage); }
  if ('AudioContext' in o) AC = o.AudioContext;
  if (o.gate) gate = new Gate(o.gate);
  if ('clock' in o) clockMs = o.clock || wallMs;
}
const wallMs = () => (globalThis.performance?.now ? performance.now() : Date.now());
let clockMs = wallMs;
// Ses çalınabilir mi: bağlam açık ve çalışıyor olmalı. Bağlam askıdayken (iOS'ta arama ya da arka plan sonrası "interrupted",
// otomatik çalma engeli) istenen sesler atılır; yoksa hepsi bağlam açıldığı anda üst üste çalardı. Tek ayrıcalık: bağlamı açan
// dokunuşun kendi sesi (açılma bir an sürer; o sırada zamanlanan ses, saat yürüyünce çalar).
const live = () => !!ac && opened && !hiddenPage && !holds.size && S.on && (ac.state === 'running' || clockMs() - unlockAt < 1500);

// İlk kullanıcı dokunuşunda çağrılır (initAudio dinleyicileri takar). Bağlam yalnızca burada kurulur.
export function unlock() {
  if (ac && opened && ac.state === 'running') return true;
  if (!AC) return false;
  try {
    if (!ac) {
      ac = new AC({ latencyHint: 'interactive' });
      G = buildGraph(ac, S);
      ac.onstatechange = () => { if (ac.state === 'running') pump(); };
    }
    if (ac.state !== 'running' && !hiddenPage) {
      unlockAt = clockMs();
      const p = ac.resume?.(); p?.then?.(pump, () => { });
      const b = ac.createBufferSource(); b.buffer = ac.createBuffer(1, 1, ac.sampleRate); b.connect(ac.destination); b.start(0); // iOS: dokunuş içinde çalınan sessiz örnek bağlamı açar
    }
    opened = true;
    pump();
    return true;
  } catch { return false; }
}
let inited = false;
export function initAudio(target = globalThis.window, doc = globalThis.document) {
  if (inited || !target?.addEventListener) return;
  inited = true;
  // Tarayıcının "kullanıcı hareketi" saydığı olaylar: dokunmada parmağın kalkışı (pointerup / touchend), tıklama, tuş.
  // pointerdown dokunmada hareket sayılmaz; orada kurulan bağlam uyarıyla askıda kalırdı.
  for (const ev of ['pointerup', 'touchend', 'keydown', 'click']) target.addEventListener(ev, unlock, { capture: true, passive: true });
  if (doc?.addEventListener) {
    hiddenPage = !!doc.hidden;
    doc.addEventListener('visibilitychange', () => setHidden(!!doc.hidden));
  }
}
// Sayfa gizlenince bağlam askıya alınır (ses saati durur, zamanlanmış her şey kaldığı yerden sürer)
export function setHidden(h) {
  hiddenPage = h;
  if (!ac) return;
  try { if (h) { ac.suspend?.(); clearInterval(timer); timer = null; } else if (opened) { ac.resume?.()?.then?.(pump, () => { }); pump(); } } catch { }
}
// Ses çıkmaması gereken anlar (yükleme ekranı, cihazın bildirim izni penceresi): ana çıkış kısılır, yeni ses çalmaz
export function hold(reason, on) {
  const was = holds.size;
  if (on) holds.add(reason); else holds.delete(reason);
  if (!!was !== !!holds.size) { if (G) applyTo(G, S); pump(); }
}

function pickVariant(name, n) {
  if (n <= 1) return 0;
  let v = Math.floor(Math.random() * n);
  if (v === lastVar.get(name)) v = (v + 1) % n; // aynı çeşit art arda gelmez
  lastVar.set(name, v);
  return v;
}
function reap(now) { for (let i = freeList.length - 1; i >= 0; i--) if (freeList[i].end <= now) { freeList[i].free(); freeList.splice(i, 1); } }
// Tek seferlik ses. opts: { v: çeşit, gain, pitch, pan (−1…1), delay (sn), ts: süre çarpanı } · döner: ses kaydı ya da null
// Sesli ipucunun ekrandaki karşılığı (erişilebilirlik: ui-erisim.js kurar); ses kapalıyken de çağrılır
let playHook = null;
export const setPlayHook = fn => { playHook = fn; };
export function play(name, opts) {
  if (playHook) try { playHook(name); } catch { /* yazı gösterilemezse ses yine çalar */ }
  const P = REG.patches[name];
  if (!P) { unknown.add(String(name)); return null; }
  if (!live() || S.mute[P.b]) return null;
  const t0 = clockMs(), now = ac.currentTime, o = opts || NO_OPTS;
  const k = gate.allow(name, P.b, now * 1000, P.gap ?? 60, P.pr ?? 1, (now + (o.delay || 0)) * 1000);
  if (!k) { stats.dropped++; return null; }
  reap(now);
  let v = null;
  try {
    v = makeVoice(G, P, o.v ?? pickVariant(name, P.n ?? 3), now + 0.004 + (o.delay || 0), G.bus[P.b], k === 1 ? o : { ...o, gain: (o.gain ?? 1) * k });
    v.name = name;
    const r = gate.admit(v, now);
    if (!r.ok) { killVoice(G, v, 0.001); v.free(); stats.dropped++; stats.ms += clockMs() - t0; return null; }
    if (r.steal) killVoice(G, r.steal);
    freeList.push(v);
    stats.played++; ring[stats.ring++ & 63] = name;
  } catch { v = null; }
  stats.ms += clockMs() - t0;
  return v;
}
const NO_OPTS = Object.freeze({});
// Çalan sesi (aynı adlı bütün sesleri) ve aynı adlı döngüyü durdurur
export function stop(name, fade = 0.08) {
  if (G) for (const v of freeList) if (v.name === name && v.end > ac.currentTime) killVoice(G, v, fade);
  if (wanted.delete(name)) pump();
}

// ---------- Döngüler: ortam ve ezgi ----------
// loop(name): döngüyü ister (bağlam açılmamışsa ya da ses kapalıysa açılınca başlar). setLoops(list): istenen kümeyi
// değiştirir; kümede olmayanlar söner, yeniler belirir.
export function loop(name, opts) { if (!hasLoop(name)) { unknown.add(String(name)); return; } if (!wanted.has(name)) { wanted.set(name, opts || NO_OPTS); pump(); } }
export function setLoops(names, fresh = false) {
  let ch = false;
  // fresh (19 Kas, kullanıcı: "alan geçişlerinde müzik baştan başlasın"): çalan ezgi döngüleri (seq) kapatılıp baştan açılır
  if (fresh && ac) for (const [name, st] of loops) if (st.seq && names.includes(name)) { endLoop(G, st, ac.currentTime, 0.4); loops.delete(name); dead.add(st); ch = true; }
  for (const k of [...wanted.keys()]) if (!names.includes(k)) { wanted.delete(k); ch = true; }
  for (const n of names) if (!wanted.has(n)) { if (hasLoop(n)) { wanted.set(n, NO_OPTS); ch = true; } else unknown.add(String(n)); }
  if (ch) pump();
}
export const activeLoops = () => [...loops.keys()];
function startLoop(g, name, t, o = NO_OPTS) {
  const P = REG.loops[name], ctx = g.ctx, lg = ctx.createGain(), wet = ctx.createGain(), nodes = [];
  lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime((P.g ?? 1) * (o.gain ?? 1), t + (P.fade ?? 1.5));
  lg.connect(g.bus[P.b].dry); wet.gain.value = P.rv ?? 0; lg.connect(wet); wet.connect(g.bus[P.b].wet);
  // Sürekli katmanlar: döngüsel gürültü ya da osilatör → süzgeç → kazanç; yavaş salınımlar (lfo) kazancı ve süzgeci oynatır
  for (const L of P.beds || []) {
    let src, node;
    if (L.o) { src = ctx.createOscillator(); src.type = WAVE[L.o] || 'sine'; src.frequency.value = L.f; if (L.det) src.detune.value = L.det; }
    else { src = ctx.createBufferSource(); src.buffer = noiseBuf(g, L.n); src.loop = true; }
    node = src;
    for (const [k, type] of FILTERS) if (L[k] !== undefined) {
      const f = ctx.createBiquadFilter(), v = L[k]; f.type = type; f.frequency.value = typeof v === 'number' ? v : v[0]; f.Q.value = (typeof v !== 'number' && v[1]) || 0.7;
      if (L.flfo) { const lf = ctx.createOscillator(), lgn = ctx.createGain(); lf.frequency.value = L.flfo[0]; lgn.gain.value = L.flfo[1]; lf.connect(lgn); lgn.connect(f.frequency); kRate(f.frequency); lf.start(t); nodes.push(lf); }
      node.connect(f); node = f;
    }
    const gn = ctx.createGain(); gn.gain.value = L.g ?? 0.2;
    if (L.lfo) { const lf = ctx.createOscillator(), lgn = ctx.createGain(); lf.frequency.value = L.lfo[0]; lgn.gain.value = (L.g ?? 0.2) * L.lfo[1]; lf.connect(lgn); lgn.connect(gn.gain); lf.start(t); nodes.push(lf); }
    node.connect(gn);
    if (L.pan && ctx.createStereoPanner) { const pn = ctx.createStereoPanner(); pn.pan.value = L.pan; gn.connect(pn); pn.connect(lg); } else gn.connect(lg);
    if (L.o) src.start(t); else src.start(t, (L.g ?? 0.2) * 3.1 % 1.9);
    nodes.push(src);
  }
  const st = { name, P, lg, wet, nodes, dest: { dry: lg, wet: null }, evNext: (P.ev || []).map(e => t + e.every[0] * (0.3 + g.rand())), seq: null, dying: 0 };
  if (P.seq) st.seq = { t0: t + (P.seq.lead ?? 0.3), bar: -1, notes: null, ni: 0, barDur: P.seq.beats * 60 / P.seq.bpm };
  return st;
}
// Döngünün "until" anına kadarki olaylarını zamanlar (ortamın seyrek sesleri ve ezginin notaları)
function fillLoop(g, st, until, cap = 8) {
  const P = st.P, now = g.ctx.currentTime;
  if (P.ev) for (let i = 0; i < P.ev.length; i++) {
    const e = P.ev[i]; let n = 0;
    while (st.evNext[i] < until && n++ < cap) {
      if (st.evNext[i] < now - 0.08) { st.evNext[i] = now + e.every[0] * g.rand(); continue; } // ana iş parçacığı takıldıysa geride kalan sesler atlanır (hepsi birden çalmaz)
      const X = REG.patches[e.s];
      if (X) scheduled(makeVoice(g, X, Math.floor(g.rand() * (X.n ?? 3)), st.evNext[i], st.dest, { gain: e.g[0] + (e.g[1] - e.g[0]) * g.rand(), pan: (e.pan || 0) * (g.rand() * 2 - 1), pitch: 1 + (e.pj || 0) * (g.rand() * 2 - 1) }));
      st.evNext[i] += e.every[0] + (e.every[1] - e.every[0]) * g.rand();
    }
  }
  const q = st.seq;
  if (q) for (let guard = 0; guard < cap * 8; guard++) {
    if (!q.notes || q.ni >= q.notes.length) {
      const next = q.t0 + (q.bar + 1) * q.barDur;
      if (next >= until) break;
      q.bar++; q.notes = P.seq.bar(q.bar); q.ni = 0;
      continue;
    }
    const nt = q.notes[q.ni], at = q.t0 + q.bar * q.barDur + nt.t * 60 / P.seq.bpm;
    if (at >= until) break;
    q.ni++;
    if (at < now - 0.08) continue; // ana iş parçacığı takıldıysa geç kalan nota atlanır (üst üste yığılmaz)
    scheduled(makeVoice(g, nt, 0, Math.max(at, now), st.dest, NO_OPTS));
    st.heard = now;
  }
}
let sink = null; // çevrimdışı ölçümde temizlik gerekmez
function scheduled(v) { if (sink) sink.push(v); }
function endLoop(g, st, t, fade = 0.8) {
  st.dying = t + fade + 0.1;
  try { st.lg.gain.cancelScheduledValues(t); st.lg.gain.setTargetAtTime(0, t, fade / 4); for (const n of st.nodes) n.stop(st.dying); } catch { }
}
// İstenen döngülerle çalanları eşitler; zamanlayıcıyı yalnızca döngü varken çalıştırır. Sayfa gizliyken (bağlam askıda)
// döngüler yerinde kalır, ses saati durduğu için kaldıkları yerden sürerler.
function pump() {
  if (!ac) return;
  const now = ac.currentTime, keep = S.on && !S.mute.amb, run = opened && !hiddenPage && ac.state === 'running';
  for (const [name, st] of loops) if (!keep || !wanted.has(name)) { endLoop(G, st, now); loops.delete(name); dead.add(st); }
  for (const st of dead) if (st.dying <= now) { try { st.lg.disconnect(); st.wet.disconnect(); } catch { } dead.delete(st); }
  if (keep && run) for (const [name, o] of wanted) if (!loops.has(name)) { try { loops.set(name, startLoop(G, name, now + 0.02, o)); } catch { wanted.delete(name); } }
  const need = run && (loops.size > 0 || dead.size > 0);
  if (need && !timer) { timer = setInterval(tick, 120); timer.unref?.(); }
  else if (!need && timer) { clearInterval(timer); timer = null; }
}
const dead = new Set();
let tickAt = 0, ahead = 0.45;
function tick() {
  if (!ac || ac.state !== 'running') return;
  const t0 = clockMs(), now = ac.currentTime;
  // Bakış ufku: olağan 0,45 sn; bakışlar gecikiyorsa (ağır kare, yavaş cihaz) son aralığın iki katına kadar uzar
  ahead = Math.min(2, Math.max(0.45, tickAt ? (t0 - tickAt) / 1000 * 2.2 : 0.45, ahead * 0.9)); tickAt = t0;
  sink = freeList;
  try { for (const st of loops.values()) if (!st.dying) fillLoop(G, st, now + ahead, 24); } catch { }
  // Bekçi: ezgi döngüsü 3 ölçü boyunca hiç nota çalmadıysa (zaman kayması, takılan bağlam) baştan açılır — müzik kendiliğinden susmasın
  for (const [name, st] of loops) if (st.seq && !st.dying && now - (st.heard ?? st.seq.t0) > Math.max(6, st.seq.barDur * 3)) { endLoop(G, st, now, 0.2); loops.delete(name); dead.add(st); }
  sink = null;
  reap(now);
  if (dead.size) pump();
  stats.ticks++; stats.ms += clockMs() - t0;
}

// ---------- Ayar arayüzü ----------
export const getAudio = () => cleanSettings(S);
export function setAudio(patch) {
  S = cleanSettings({ ...S, ...(patch && typeof patch === 'object' ? patch : {}), vol: { ...S.vol, ...own(patch, 'vol') }, mute: { ...S.mute, ...own(patch, 'mute') } });
  if (storage) saveSettings(storage, S);
  if (G) applyTo(G, S);
  pump();
  for (const fn of subs) { try { fn(getAudio()); } catch { } }
  return getAudio();
}
// bus: 'master' ya da veri yolu anahtarı (ui, battle, amb) · v: 0…1
export function setVolume(bus, v) { return bus === 'master' ? setAudio({ master: v }) : Object.hasOwn(BUSES, bus) ? setAudio({ vol: { [bus]: v } }) : getAudio(); }
// mute(true): bütün ses kapanır · mute(true, 'amb'): yalnızca o veri yolu
export function mute(on, bus) { return bus === undefined ? setAudio({ on: !on }) : Object.hasOwn(BUSES, bus) ? setAudio({ mute: { [bus]: !!on } }) : getAudio(); }
export const isMuted = () => !S.on;
export function onAudio(fn) { subs.add(fn); return () => subs.delete(fn); }
// Durum özeti (denemeler ve hata ayıklama): bağlam var mı, kaç ses çaldı/atıldı, tanımsız istenen adlar, ana iş parçacığında harcanan süre
export const audioState = () => ({ ctx: !!ac, state: ac ? ac.state : 'none', opened, hidden: hiddenPage, holds: [...holds], voices: gate.voices.length, loops: [...loops.keys()], wanted: [...wanted.keys()], played: stats.played, dropped: stats.dropped, ticks: stats.ticks, ms: stats.ms, unknown: [...unknown], recent: ring.filter(Boolean), sampleRate: ac ? ac.sampleRate : 0, baseLatency: ac ? ac.baseLatency || 0 : 0 });
export const audioContext = () => ac;

// ---------- Çevrimdışı ölçüm ----------
// Bir yamayı ya da döngüyü OfflineAudioContext ile çizer (tarayıcı denemeleri: sessiz mi, taşıyor mu, süresi tutuyor mu).
// raw: ana çıkış zinciri olmadan, veri yolları tam açık (yamanın kendi düzeyi) · raw değilse varsayılan ayarlarla, canlıdaki zincirle
// loud: canlıdaki zincir, bütün ses düzeyleri sonuna kadar açık (en kötü durumda da taşmadığını görmek için)
// name bir döngü adları dizisi de olabilir (bir yerin bütün döngüleri birlikte); mix: üstüne bindirilecek sesler [[ad, sn], …]
export async function renderOffline(name, { v = 0, raw = false, sr = 44100, seconds = 0, tail = 1.2, gain = 1, pitch = 1, stack = 1, mix = [], loud = false } = {}) {
  const OAC = globalThis.OfflineAudioContext || globalThis.webkitOfflineAudioContext;
  // Sıkıştırıcı ilk anlarda kazancını sıfırdan toplar (canlıda bağlam açılırken olur biter); ölçüm bunu beklemeden başlamaz
  const many = Array.isArray(name), lead = raw ? 0.01 : 0.6, isLoop = many || (!hasSound(name) && hasLoop(name)), dur = lead + (isLoop ? seconds || 8 : patchDur(name, v) + tail);
  const ctx = new OAC(2, Math.ceil(dur * sr), sr), full = { ...cleanSettings(null), master: 1, vol: { ui: 1, battle: 1, amb: 1 } };
  const g = buildGraph(ctx, raw || loud ? full : cleanSettings(null), raw);
  g.rand = xs(977);
  const sts = [], made = [], todo = [...mix].sort((x, y) => x[1] - y[1]);
  let mi = 0, stepErr = null;
  if (isLoop) for (const n of many ? name : [name]) sts.push(startLoop(g, n, lead));
  else for (let i = 0; i < stack; i++) makeVoice(g, REG.patches[name], v, lead, g.bus[REG.patches[name].b], { gain, pitch });
  // Canlıdaki gibi adım adım: her çeyrek saniyede yalnızca yakındaki olaylar kurulur, biten sesler sökülür
  // (hepsi baştan kurulursa yüzlerce boş düğüm çizim süresini şişirir ve ölçüm canlıyı yansıtmaz)
  const step = t => {
    sink = made;
    for (const st of sts) fillLoop(g, st, t + 0.7, 1e4);
    sink = null;
    for (; mi < todo.length && todo[mi][1] + lead < t + 0.7; mi++) { const X = REG.patches[todo[mi][0]]; made.push(makeVoice(g, X, mi % (X.n ?? 3), Math.max(t, lead + todo[mi][1]), g.bus[X.b], NO_OPTS)); }
    for (let i = made.length - 1; i >= 0; i--) if (made[i].end <= t) { made[i].free(); made.splice(i, 1); }
  };
  if (sts.length || todo.length) { step(0); for (let t = 0.25; t < dur - 0.05; t += 0.25) ctx.suspend(t).then(() => { try { step(t); } catch (e) { stepErr = e; } ctx.resume(); }, () => { }); }
  const t0 = clockMs(), buf = await ctx.startRendering();
  if (stepErr) throw stepErr;
  return { sr, lead, ms: clockMs() - t0, dur: isLoop ? dur - lead : patchDur(name, v), ch: [buf.getChannelData(0), buf.getChannelData(1)] };
}
