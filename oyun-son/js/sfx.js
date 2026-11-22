// Ses tanımları: oyunun bütün sesleri burada, kodla tarif edilir (ses dosyası yoktur). Motor audio.js'tedir.
// Palet bu dünyaya özgüdür: ocak, demir, deri, taş ve bozkır rüzgârı. Kragmir koyu ve ağır (alçak dem, davul, kopuz),
// Elentha aydınlık ve havadar (kaval, ince tel, rüzgâr). Hiçbir ses ya da ezgi başka bir oyundan, filmden ya da
// bilinen bir parçadan alınmadı ve onlara benzetilmedi; ezgiler aşağıdaki dizilerden ve tohumlu yürüyüşlerden üretilir.
//
// YAMA (tek seferlik ses): { b: veri yolu (ui | battle | amb), g: kazanç, gap: aynı sesin en kısa aralığı (ms),
//   pr: öncelik (0 düşük · 1 olağan · 2 kaçmamalı), rv: yankıya gönderim, n: çeşit sayısı (varsayılan 3),
//   pv: 0 ise perde çeşitlemesi yok, L: katman listesi ya da çeşit numarasından liste üreten işlev }
// KATMAN: { o: 'sine'|'tri'|'saw'|'sq' (osilatör) ya da n: 'w'|'p'|'b' (beyaz/pembe/kahverengi gürültü),
//   f: frekans ya da [baş, son] kayma, t: başlangıç (sn), a: atak, h: tutma, d: sönme, g: tepe kazancı,
//   lp/hp/bp: süzgeç frekansı ya da [baş, son, Q], st: kaymanın süresi, fm: [oran, derinlik, sönme], vib: [hız, cent],
//   det: cent, lin: doğrusal sönme }
// DÖNGÜ: { b, g, rv, fade, beds: sürekli katmanlar (süzgeç: [frekans, Q]; lfo: [hız, oran] kazancı, flfo: [hız, Hz] süzgeci oynatır),
//   ev: seyrek rastgele sesler [{ s: yama, every: [en az, en çok] sn, g: [..], pan, pj: perde oynaması }],
//   seq: ezgi { bpm, beats: ölçüdeki vuruş, bar(i) → [{ t: vuruş, L: katmanlar, g }] } }
import { register, play, stop, hasSound, hasLoop, preloadMusic } from './audio.js';
export const MUSIC_URL = 'audio/kizil-goz.mp3'; // 22 Kas: tema müziği (şehir, pazar, fragman)
// Bu modül shared/ tablolarını içe aktarmaz (yetenek ve birim kayıtları çağıranlardan gelir): böylece Node denemeleri de yükleyebilir.

const O = (o, f, a, h, d, g, x) => ({ o, f, a, h, d, g, ...x });
const N = (n, a, h, d, g, x) => ({ n, a, h, d, g, ...x });
const at = (t, Ls) => Ls.map(L => ({ ...L, t: (L.t || 0) + t }));
const semi = (f, n) => f * 2 ** (n / 12);
// Madenî çınlama: uyumsuz üç kısmi ses (örs, çan, para)
const ting = (f, g = 0.2, d = 0.4, t = 0) => [O('sine', f, 0.001, 0, d, g, { t }), O('sine', f * 2.71, 0.001, 0, d * 0.55, g * 0.4, { t }), O('sine', f * 4.93, 0.001, 0, d * 0.3, g * 0.2, { t })].filter(L => L.f < 12000); // duyulmayacak kadar tiz kısmi sesler atılır
const click = (g = 0.3, hp = 3000, t = 0, d = 0.014) => N('w', 0.001, 0, d, g, { t, hp });
const thud = (f0, f1, d, g, t = 0) => O('sine', [f0, f1], 0.002, 0, d, g, { t });
// Örs darbesi: çekiç tıkı + örsün çınlaması + gövde
const strike = (p = 1, g = 1, t = 0) => [N('w', 0.001, 0, 0.02, 0.5 * g, { t, hp: 2400 }), O('sine', 1480 * p, 0.001, 0, 0.42, 0.2 * g, { t }), O('sine', 1480 * 2.71 * p, 0.001, 0, 0.26, 0.1 * g, { t }), O('sine', 1480 * 4.3 * p, 0.001, 0, 0.14, 0.05 * g, { t }), O('sine', [170, 72], 0.001, 0, 0.09, 0.4 * g, { t })];
const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
// Telefon hoparlörü kabaca 300 Hz'in altını vermez. Pes sesler (davul, dem, boru, bas, gümlemeler) bu yüzden yalnızca alçak
// sinüsten kurulmaz: her birinde orta bölgede bir "gövde" katmanı da vardır (kulaklıkta pes, telefonda yine duyulur).
const mid = (f, lo) => Math.max(f, lo);

// ======================= Çalgılar (ezgi yatakları ve kısa ezgiler) =======================
// (frekans, süre sn, kazanç) → katmanlar
export const INS = {
  kopuz: (f, d, g) => [O('saw', f, 0.004, 0, d, g * 0.5, { lp: [f * 7, f * 1.6, 1.5] }), O('tri', f * 2.003, 0.004, 0, d * 0.6, g * 0.16)],   // kalın telli, koyu
  tel: (f, d, g) => [O('tri', f, 0.003, 0, d, g * 0.5, { lp: [f * 9, f * 2.5, 1] }), O('sine', f * 3, 0.003, 0, d * 0.35, g * 0.08)],            // ince tel, parlak
  bas: (f, d, g) => [O('tri', f, 0.006, 0, d, g * 0.6, { lp: [f * 5, f * 2, 1] }), O('sine', f * 0.5, 0.006, 0, d, g * 0.3), O('saw', f * 2, 0.006, 0, d * 0.7, g * 0.13, { lp: [mid(f * 8, 900), mid(f * 3, 450), 1] })],
  kaval: (f, d, g) => [O('sine', [f * 0.972, f], 0.05, d * 0.55, d * 0.45, g * 0.42, { st: 0.07, vib: [5.2, 9] }), O('tri', f * 2, 0.06, d * 0.5, d * 0.4, g * 0.04), N('p', 0.04, d * 0.5, d * 0.45, g * 0.09, { bp: [f * 2, f * 2, 2.5] })],
  davul: (f, d, g) => [O('sine', [f * 1.9, f * 0.75], 0.002, 0, d, g * 0.9), N('p', 0.001, 0, 0.05, g * 0.35, { lp: 900 }), O('tri', [f * 6.2, f * 3.6], 0.001, 0, Math.min(d, 0.12), g * 0.24), N('p', 0.001, 0, 0.07, g * 0.3, { bp: [mid(f * 9, 520), mid(f * 5, 340), 1.2] })],   // deri: alçak gövde + orta bölgede tok vuruş
  tik: (f, d, g) => [N('w', 0.001, 0, d, g * 0.5, { bp: [f, f, 2] })],
  cin: (f, d, g) => ting(f, g * 0.5, d),
  dem: (f, d, g) => [O('saw', f, d * 0.3, d * 0.35, d * 0.35, g * 0.22, { lp: mid(f * 4, 640), det: -7, lin: 1 }), O('saw', f, d * 0.3, d * 0.35, d * 0.35, g * 0.22, { lp: mid(f * 4, 640), det: 8, lin: 1 })],  // uzun, yumuşak dem sesi
  boru: (f, d, g) => [O('saw', f, 0.09, d * 0.6, d * 0.3, g * 0.3, { lp: [mid(f * 3, 420), mid(f * 6, 900), 1] }), O('sq', f * 0.5, 0.1, d * 0.6, d * 0.3, g * 0.07, { lp: mid(f * 3, 420) })],        // alçak boru
  // koro (Elentha): iki "a" ünlüsü biçimleyicisinden geçen, hafif titreşimli iki ses + yumuşak temel
  koro: (f, d, g) => [O('saw', f, d * 0.35, d * 0.4, d * 0.25, g * 0.16, { bp: [800, 800, 1.6], det: -9, lin: 1, vib: [4.6, 6] }), O('saw', f, d * 0.35, d * 0.4, d * 0.25, g * 0.14, { bp: [1150, 1150, 2], det: 9, lin: 1, vib: [5.1, 6] }), O('sine', f, d * 0.3, d * 0.45, d * 0.25, g * 0.12, { lin: 1 })],
  // gırtlak şarkısı (Kragmir): kalın dem + dar süzgeçte yavaşça gezinen armonik ıslığı
  girtlak: (f, d, g) => [O('saw', f, d * 0.2, d * 0.6, d * 0.2, g * 0.26, { lp: mid(f * 4, 600), lin: 1 }), O('saw', f, d * 0.25, d * 0.5, d * 0.25, g * 0.2, { bp: [f * 8, f * 11, 9], lin: 1 }), O('sine', mid(f * 2, 300), d * 0.2, d * 0.6, d * 0.2, g * 0.08, { lin: 1 })],
};
const nt = (t, ins, f, d, g) => ({ t, L: INS[ins](f, d, 1), g, pv: 0 });
// Tohumlu üreteç (ezgiler her açılışta aynıdır; rastgelelik yalnızca çeşit seçimindedir)
const rngOf = seed => { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
// Diziler (yarım ses adımları). Bozkır: beş sesli minör · Yayla: beş sesli majör · Kor: alçaltılmış ikinci dereceli koyu dizi
export const SCALES = { bozkir: [0, 3, 5, 7, 10], yayla: [0, 2, 4, 7, 9], kor: [0, 1, 3, 5, 7] };
const deg = (root, sc, i) => root * 2 ** ((sc[((i % sc.length) + sc.length) % sc.length] + 12 * Math.floor(i / sc.length)) / 12);
// Dizi basamaklarında küçük adımlı yürüyüş: start'tan başlar, end'de biter, [lo, hi] dışına çıkmaz
function walk(seed, n, lo, hi, start, end) {
  const r = rngOf(seed), out = [], steps = [-2, -1, -1, 1, 1, 2, 0];
  let x = start;
  for (let i = 0; i < n; i++) { out.push(x); x = Math.max(lo, Math.min(hi, x + steps[Math.floor(r() * steps.length)])); }
  out[n - 1] = end;
  if (n > 2 && Math.abs(out[n - 2] - end) > 2) out[n - 2] = end + (out[n - 2] > end ? 1 : -1); // bitişe adım adım varılır
  return out;
}
// İki ölçülük cümle: ritim kalıbı (vuruş, süre) + basamaklar → notalar
const phrase = (bar, rhythm, degs, root, sc, ins, g, beat) => rhythm[bar].map(([t, d], i) => nt(t, ins, deg(root, sc, degs[(bar ? rhythm[0].length : 0) + i]), d * beat * 1.15, g));

// Yatak: { bpm, beats, len: çevrimdeki ölçü sayısı, gen(ölçü, çevrim) → notalar }
const beatOf = bpm => 60 / bpm;
export const BEDS = {
  // Kragmir ana üssü: ağır 6/8, kalın tel, davul, alçak dem. Sekiz ölçü ezgi, sekiz ölçü yalnızca dem ve yürek atışı.
  'mus.hub.ocak': (() => {
    const bpm = 132, B = beatOf(bpm), root = 146.83, sc = SCALES.bozkir, R = [[[0, 2], [2, 1], [3, 2], [5, 1]], [[0, 3], [3, 1.5], [4.5, 1.5]]];
    const A = walk(0x0c4a, 7, -2, 5, 0, 3), A2 = walk(0x0c4a, 7, -2, 5, 0, 0), Bp = walk(0x0c5b, 7, 0, 7, 5, 3), A3 = walk(0x0c4a, 7, -2, 5, 0, 0);
    const P = [A, A2, Bp, A3];
    return { bpm, beats: 6, len: 16, gen(bar) {
      const out = [nt(0, 'dem', 73.42, 6 * B, bar < 8 ? 0.22 : 0.16)];
      if (bar % 2) out.push(nt(0, 'dem', 110, 6 * B, 0.1));
      if (bar < 8) {
        out.push(nt(0, 'davul', 62, 0.3, 0.42), nt(3, 'davul', 70, 0.22, 0.2), ...phrase(bar % 2, R, P[bar >> 1], root, sc, 'kopuz', 0.34, B));
        if (bar === 7) { out.pop(); out.pop(); out.push(nt(3, 'kopuz', semi(root, 1), 1.4 * B, 0.3), nt(4.5, 'kopuz', root, 3 * B, 0.36)); } // karar: alçaltılmış ikinciden durağa
        if (bar === 4 || bar === 5) out.push(nt(3, 'cin', 1174.7, 0.5, 0.1));
      } else if (bar % 2 === 0) out.push(nt(0, 'davul', 58, 0.3, 0.26), nt(0, 'girtlak', 73.42, 6 * B, 0.15)); // ezgisiz yarı: davul + gırtlak şarkısı
      return out;
    } };
  })(),
  // Elentha ana üssü: 4/4, kaval ezgisi, ince tel eşlik, açık beşli dem
  'mus.hub.sancak': (() => {
    const bpm = 84, B = beatOf(bpm), root = 440, sc = SCALES.yayla, R = [[[0, 1.5], [1.5, 0.5], [2, 1], [3, 1]], [[0, 1], [1, 1], [2, 2]]];
    const A = walk(0x5a1c, 7, -1, 6, 2, 3), A2 = walk(0x5a1c, 7, -1, 6, 2, 0), Bp = walk(0x5a2d, 7, 1, 8, 5, 3), A3 = walk(0x5a1c, 7, -1, 6, 2, 5);
    const P = [A, A2, Bp, A3], ARP = [220, 329.63, 440, 329.63];
    return { bpm, beats: 4, len: 16, gen(bar) {
      const out = [];
      if (bar % 2 === 0) out.push(nt(0, 'dem', 220, 8 * B, 0.1), nt(0, 'dem', 329.63, 8 * B, 0.07));
      if (bar === 0 || bar === 4) out.push(nt(0, 'boru', 220, 0.9 * B, 0.15), nt(1, 'boru', 329.63, 0.6 * B, 0.13), nt(1.5, 'boru', 440, 1.8 * B, 0.15)); // boru fanfarı
      if (bar >= 8 && bar % 2 === 0) out.push(nt(0, 'koro', 220, 8 * B, 0.11), nt(0, 'koro', 277.18, 8 * B, 0.08), nt(0, 'koro', 329.63, 8 * B, 0.08)); // ezgisiz yarı: koro
      if (bar < 8) {
        out.push(...phrase(bar % 2, R, P[bar >> 1], root, sc, 'kaval', 0.3, B));
        for (let i = 0; i < 4; i++) out.push(nt(i, 'tel', ARP[i], 0.5, i ? 0.1 : 0.14));
        if (bar === 7) out.push(nt(2, 'cin', 1760, 0.7, 0.07));
      } else if (bar === 10 || bar === 13) out.push(nt(1, 'cin', semi(880, PENTA[(bar * 3) % 5]), 0.8, 0.06));
      return out;
    } };
  })(),
  // Savaş: 7/8 aksak (2+2+3), davul ve tik, bas ısrarı, ince telde kısa cümleler
  'mus.battle': (() => {
    const bpm = 252, B = beatOf(bpm), root = 329.63, sc = SCALES.bozkir, R = [[[0, 2], [2, 2], [4, 1.5], [5.5, 1.5]], [[0, 2], [2, 1], [3, 1], [4, 3]]];
    const A = walk(0xba71, 8, -1, 6, 0, 3), A2 = walk(0xba71, 8, -1, 6, 0, 0), Bp = walk(0xba82, 8, 2, 8, 5, 5);
    const P = [A, A2, Bp], BASS = [[0, 0, 7, 0], [0, 0, 5, 3], [0, 0, 7, 10], [0, 3, 5, 7]], BT = [0, 2, 4, 5.5];
    return { bpm, beats: 7, len: 8, gen(bar) {
      const out = [nt(0, 'davul', 60, 0.24, 0.5), nt(2, 'tik', 2400, 0.03, 0.2), nt(4, 'davul', 72, 0.2, 0.36), nt(5, 'tik', 3200, 0.02, 0.12), nt(6, 'tik', 3200, 0.02, 0.14)];
      if (bar % 4 === 3) out.push(nt(5, 'davul', 80, 0.14, 0.26), nt(6, 'davul', 90, 0.14, 0.3)); // geçiş vuruşları
      for (let i = 0; i < 4; i++) out.push(nt(BT[i], 'bas', semi(82.41, BASS[bar % 4][i]), 0.26, 0.3));
      if (bar % 2 === 0) out.push(nt(0, 'dem', 164.81, 14 * B, 0.07));
      if (bar < 6) out.push(...phrase(bar % 2, R, P[bar >> 1], root, sc, 'tel', 0.24, B));
      return out;
    } };
  })(),
  // Boss: ağır 5/4, kalın davul, alçak boru (durak ile alçaltılmış ikinci arasında gidip gelir), seyrek kopuz
  'mus.boss': (() => {
    const bpm = 96, B = beatOf(bpm), root = 146.83, sc = SCALES.kor, R = [[[0, 1], [1, 0.5], [1.5, 0.5], [2, 1], [3, 2]], [[0, 2], [2, 1], [3, 2]]];
    const A = walk(0xb055, 8, -1, 5, 3, 1), A2 = walk(0xb066, 8, -1, 5, 4, 0), BASS = [0, 0, 1, 0, -2];
    return { bpm, beats: 5, len: 8, gen(bar) {
      const out = [nt(0, 'davul', 50, 0.4, 0.62), nt(3, 'davul', 56, 0.32, 0.46), nt(4.5, 'davul', 64, 0.2, 0.26), nt(1, 'tik', 1800, 0.03, 0.12), nt(2, 'tik', 1800, 0.03, 0.12)];
      if (bar % 2) out.push(nt(0, 'boru', semi(73.42, 1), 3 * B, 0.3), nt(3, 'boru', 73.42, 2 * B, 0.3));
      else out.push(nt(0, 'boru', 73.42, 5 * B, 0.3));
      for (let i = 0; i < 5; i++) out.push(nt(i, 'bas', semi(73.42, BASS[i]), 0.4, 0.26));
      if (bar % 4 >= 2) out.push(...phrase(bar % 2, R, bar < 4 ? A : A2, root, sc, 'kopuz', 0.3, B));
      if (bar % 4 === 1) out.push(nt(4, 'cin', 1174.7, 0.6, 0.09));
      return out;
    } };
  })(),
};
const barCache = new Map();
// Bir yatağın i. ölçüsünün notaları (vuruş sırasına dizili). Aynı ölçü yeniden üretilmez.
export function bedBar(key, bar) {
  const B = BEDS[key], k = `${key}:${bar % B.len}`;
  let n = barCache.get(k);
  if (!n) { n = B.gen(bar % B.len).sort((x, y) => x.t - y.t); barCache.set(k, n); }
  return n;
}
// Kısa ezgi (zafer, yenilgi): [sn, çalgı, frekans, süre, kazanç] → tek yamanın katmanları
const tune = notes => notes.flatMap(([t, ins, f, d, g]) => at(t, INS[ins](f, d, g)));

// ======================= Yamalar =======================
export const PATCHES = {
  // ---- Ses kimliği: ırk imzaları ve büyük anlar (özgün, sentezlenmiş) ----
  // Kragmir: deri davul üçlemesi + kısa gırtlak demi · Elentha: iki notalı boru çağrısı + kısa koro
  'id.ocak': { b: 'ui', g: 0.7, gap: 800, pr: 2, rv: 0.3, pv: 0, n: 1, L: [...at(0, INS.davul(62, 0.45, 1)), ...at(0.2, INS.davul(62, 0.35, 0.8)), ...at(0.4, INS.davul(55, 0.6, 1.1)), ...at(0.42, INS.girtlak(73.4, 1.4, 0.9))] },
  'id.sancak': { b: 'ui', g: 0.62, gap: 800, pr: 2, rv: 0.35, pv: 0, n: 1, L: [...at(0, INS.boru(220, 0.45, 1)), ...at(0.42, INS.boru(329.6, 0.9, 1.1)), ...at(0.45, INS.koro(440, 1.3, 0.8)), ...at(0.45, INS.koro(554.4, 1.3, 0.6))] },
  // +10: örs çınlaması basamak basamak tırmanır, sonunda geniş bir patlama
  'id.plus10': { b: 'ui', g: 0.7, gap: 1500, pr: 2, rv: 0.45, pv: 0, n: 1, L: [...strike(1.2, 1.2), ...[0, 2, 4, 7, 9, 12, 16].flatMap((s, i) => ting(semi(880, s), 0.14, 0.7, 0.1 + i * 0.07)), N('w', 0.02, 0.2, 1.2, 0.08, { t: 0.6, hp: 5000 }), O('sine', [65, 98], 0.05, 0.4, 0.9, 0.3, { t: 0.55 })] },
  // Kuşatma borusu: uzun, alçak, iki boru üst üste ve uzakta davul
  'id.siege': { b: 'ui', g: 0.75, gap: 3000, pr: 2, rv: 0.5, pv: 0, n: 1, L: [...at(0, INS.boru(110, 2.2, 1.2)), ...at(0.5, INS.boru(164.8, 1.8, 0.9)), ...at(0.1, INS.davul(55, 0.6, 0.7)), ...at(0.9, INS.davul(55, 0.6, 0.7)), ...at(1.7, INS.davul(49, 0.8, 0.9))] },
  // Sunucu duyurusu: kısa, parlak iki tını
  'ann.ping': { b: 'ui', g: 0.5, gap: 1200, pr: 1, rv: 0.3, pv: 0, n: 1, L: [...ting(1318.5, 0.14, 0.5), ...ting(1760, 0.12, 0.7, 0.12)] },
  // ---------- Arayüz ----------
  'ui.tap': { b: 'ui', g: 0.85, gap: 45, pr: 0, L: [N('w', 0.001, 0, 0.018, 0.22, { bp: [2600, 2600, 1.2] }), O('sine', [620, 470], 0.001, 0, 0.045, 0.22)] },
  'ui.tab': { b: 'ui', g: 0.78, gap: 60, pr: 0, L: [click(0.16, 3200), O('tri', [860, 1000], 0.002, 0, 0.06, 0.2)] },
  'ui.toggle': { b: 'ui', g: 0.93, gap: 80, pv: 0, n: 1, L: [O('sine', 660, 0.002, 0, 0.05, 0.18), O('sine', 990, 0.002, 0, 0.07, 0.18, { t: 0.06 }), click(0.1, 4000)] },
  // ırk çeşitleri (tapSound seçer): Elentha parlak çan, Kragmir alçak davul
  'ui.confirm.sancak': { b: 'ui', g: 0.8, gap: 80, L: [thud(260, 170, 0.05, 0.2), ...ting(1760, 0.14, 0.2, 0.005), ...ting(2349, 0.07, 0.14, 0.05), click(0.1, 4200)] },
  'ui.confirm.ocak': { b: 'ui', g: 0.85, gap: 80, L: [thud(120, 62, 0.16, 0.5), thud(95, 55, 0.14, 0.35, 0.09), click(0.08, 1500)] },
  'ui.tab.sancak': { b: 'ui', g: 0.78, gap: 60, pr: 0, L: [click(0.14, 4200), O('tri', [1180, 1380], 0.002, 0, 0.06, 0.2)] },
  'ui.tab.ocak': { b: 'ui', g: 0.8, gap: 60, pr: 0, L: [thud(170, 110, 0.07, 0.3), click(0.1, 1800)] },
  'ui.confirm': { b: 'ui', g: 0.8, gap: 80, L: [thud(190, 120, 0.07, 0.3), ...ting(1320, 0.13, 0.14, 0.01), click(0.14, 2500)] },
  'ui.back': { b: 'ui', g: 0.91, gap: 60, pr: 0, L: [O('tri', [700, 430], 0.002, 0, 0.07, 0.2), click(0.1, 2500)] },
  'ui.open': { b: 'ui', g: 0.97, gap: 90, rv: 0.08, L: [N('p', 0.02, 0, 0.14, 0.26, { bp: [320, 1500, 1.2] }), O('sine', [230, 180], 0.002, 0, 0.06, 0.24, { t: 0.02 }), click(0.14, 3000, 0.11)] },
  'ui.close': { b: 'ui', g: 0.88, gap: 90, pr: 0, L: [N('p', 0.008, 0, 0.11, 0.26, { bp: [1500, 480, 1.2] }), O('sine', [200, 140], 0.002, 0, 0.07, 0.24, { t: 0.05 }), O('tri', [430, 310], 0.002, 0, 0.05, 0.1, { t: 0.05 })] },
  'ui.modal': { b: 'ui', g: 1.03, gap: 90, L: [O('sine', [300, 520], 0.004, 0, 0.09, 0.2), N('p', 0.005, 0, 0.06, 0.12, { bp: [900, 1800, 1.5] })] },
  'ui.modalClose': { b: 'ui', g: 1.01, gap: 90, pr: 0, L: [O('sine', [480, 280], 0.004, 0, 0.08, 0.18), N('p', 0.003, 0, 0.04, 0.08, { bp: [1500, 700, 1.5] })] },
  'ui.error': { b: 'ui', g: 1.28, gap: 250, pv: 0, n: 2, L: v => [O('sq', [150, 108], 0.003, 0, 0.1, 0.2, { lp: 700 }), O('sq', [v ? 124 : 132, 92], 0.003, 0, 0.13, 0.2, { t: 0.12, lp: 600 }), N('p', 0.002, 0, 0.04, 0.12, { lp: 500 })] },
  'ui.toast': { b: 'ui', g: 1.72, gap: 300, pv: 0, n: 2, L: v => [...INS.tel(587.33, 0.16, 0.26), ...at(0.075, INS.tel(v ? 880 : 783.99, 0.2, 0.24))] },
  // Bildirim zili: küçük el çanı, iki vuruş
  'ui.bell': { b: 'ui', g: 1.43, gap: 1500, pr: 2, rv: 0.25, n: 2, L: v => [...ting(1568, 0.16, 0.7), ...ting(1568, 0.12, 0.6, 0.17), ...ting(v ? 2093 : 1975.5, 0.05, 0.5, 0.17), click(0.12, 4500), click(0.08, 4500, 0.17)] },
  // Satın alma: avuçta para şıngırtısı
  'ui.coins': { b: 'ui', g: 0.85, gap: 120, rv: 0.1, pv: 0, L: v => [[0, 4200], [0.055, 5100], [0.12, 3900], [0.17, 4700], [0.25, 5400]].slice(0, 4 + (v % 2)).flatMap(([t, f]) => [O('sine', f * (1 + v * 0.04), 0.001, 0, 0.07, 0.13, { t }), O('sine', f * 1.51 * (1 + v * 0.04), 0.001, 0, 0.05, 0.06, { t }), click(0.1, 5000, t, 0.008)]) },
  // Pazar satışı: iki para + küçük çan
  'ui.sale': { b: 'ui', g: 1.74, gap: 1500, pr: 2, rv: 0.2, pv: 0, n: 2, L: v => [O('sine', 4300, 0.001, 0, 0.07, 0.13), O('sine', 5200, 0.001, 0, 0.07, 0.12, { t: 0.07 }), click(0.1, 5000), ...ting(v ? 1318.5 : 1174.7, 0.14, 0.5, 0.16), ...ting(1760, 0.07, 0.45, 0.3)] },
  // Ödül alma: yükselen üç tel + parıltı
  'ui.reward': { b: 'ui', g: 2.26, gap: 200, pr: 2, rv: 0.2, pv: 0, n: 2, L: v => [...[587.33, v ? 783.99 : 739.99, 880].flatMap((f, i) => at(i * 0.075, INS.tel(f, 0.28, 0.3))), N('w', 0.06, 0, 0.3, 0.035, { t: 0.12, hp: 6000 })] },
  // Seviye atlama: davul + yükselen beş ses + uzayan beşli
  'ui.levelup': { b: 'ui', g: 1.1, gap: 1200, pr: 2, rv: 0.3, pv: 0, n: 2, L: v => [...INS.davul(70, 0.3, 0.5), ...(v ? [293.66, 440, 587.33, 880, 1174.7] : [293.66, 440, 587.33, 739.99, 880]).flatMap((f, i) => at(0.05 + i * 0.085, INS.tel(f, 0.3, 0.3))), ...at(0.5, INS.kaval(880, 0.7, 0.3)), ...at(0.5, INS.tel(587.33, 0.8, 0.24)), ...ting(1760, 0.07, 0.8, 0.52), N('w', 0.1, 0.1, 0.6, 0.03, { t: 0.45, hp: 6500 })] },
  // Görev tamam: mühür vuruşu + parlak iki ses
  'ui.quest': { b: 'ui', g: 1.11, gap: 300, pr: 2, rv: 0.18, pv: 0, n: 2, L: v => [thud(150, 88, 0.09, 0.4), N('p', 0.001, 0, 0.05, 0.2, { lp: 1200 }), ...ting(880, 0.14, 0.35, 0.09), ...ting(v ? 1318.5 : 1174.7, 0.14, 0.5, 0.2)] },
  // Başarım: kısa boru + çan beşlisi
  'ui.ach': { b: 'ui', g: 1.57, gap: 1500, pr: 2, rv: 0.3, pv: 0, n: 2, L: v => [...INS.boru(220, 0.5, 0.5), ...at(0.04, INS.boru(330, 0.46, 0.3)), ...ting(880, 0.12, 0.7, 0.28), ...ting(1318.5, 0.1, 0.8, 0.4), ...ting(v ? 1760 : 1975.5, 0.07, 0.9, 0.52), ...INS.davul(66, 0.25, 0.3)] },
  // Sandık: gıcırtı + mandal + kapak + parıltı
  'ui.chest': { b: 'ui', g: 1.5, gap: 500, pr: 2, rv: 0.25, n: 2, L: v => [O('saw', [84, 150], 0.03, 0.05, 0.16, 0.12, { bp: [650, 950, 5] }), click(0.24, 2200, 0.22), thud(180, 90, 0.1, 0.34, 0.26), ...[0, 1, 2, 3].flatMap(i => ting(semi(1568, PENTA[i + v]), 0.06, 0.4, 0.32 + i * 0.07))] },
  'ui.equip': { b: 'ui', g: 0.8, gap: 100, L: [N('p', 0.005, 0, 0.06, 0.22, { bp: [500, 1600, 1.2] }), O('sine', 920, 0.001, 0, 0.09, 0.12, { t: 0.05 }), O('sine', 2140, 0.001, 0, 0.06, 0.06, { t: 0.05 }), thud(160, 100, 0.06, 0.3, 0.05), click(0.16, 2600, 0.05)] },
  'ui.unequip': { b: 'ui', g: 0.95, gap: 100, pr: 0, L: [O('sine', 760, 0.001, 0, 0.07, 0.1), click(0.14, 2400), N('p', 0.01, 0, 0.08, 0.18, { t: 0.02, bp: [1400, 450, 1.2] })] },
  // Parçalama: ezilme + saçılan kırıntılar
  'ui.dismantle': { b: 'ui', g: 0.81, gap: 150, L: v => [N('w', 0.002, 0, 0.16, 0.3, { bp: [3000, 500, 1] }), thud(170, 70, 0.1, 0.34), ...[0.1, 0.15, 0.21, 0.29].flatMap((t, i) => [click(0.14, 3500, t, 0.01), O('sine', 2600 + ((i * 7 + v * 3) % 5) * 380, 0.001, 0, 0.04, 0.05, { t })])] },
  'ui.send': { b: 'ui', g: 4.52, gap: 150, pr: 0, L: [N('p', 0.01, 0, 0.07, 0.14, { bp: [900, 2400, 1.5] })] },
  'ui.point': { b: 'ui', g: 1.27, gap: 70, L: [O('sine', [520, 780], 0.003, 0, 0.07, 0.18), ...ting(1560, 0.05, 0.12, 0.03)] },
  'ui.upgrade': { b: 'ui', g: 0.87, gap: 300, pr: 2, rv: 0.15, pv: 0, n: 2, L: v => [...strike(0.8, 0.5), ...strike(0.9, 0.6, 0.13), ...at(0.26, INS.tel(v ? 659.26 : 587.33, 0.25, 0.3)), ...at(0.34, INS.tel(880, 0.35, 0.3))] },
  'ui.stamp': { b: 'ui', g: 0.76, gap: 150, L: [thud(160, 84, 0.09, 0.42), N('p', 0.001, 0, 0.05, 0.22, { lp: 1100 }), N('p', 0.001, 0, 0.05, 0.26, { bp: [950, 520, 1.5] }), click(0.1, 2000)] },
  'ui.horn': { b: 'ui', g: 1.31, gap: 600, pr: 2, rv: 0.25, pv: 0, n: 2, L: v => [...INS.boru(196, 0.45, 0.5), ...at(0.03, INS.boru(v ? 293.66 : 261.63, 0.42, 0.26))] },
  // Nadirlik: Standart donuk demir tıkı · Nadir parlak çınlama · Eşsiz derin gong, yükselen çanlar ve uzun parıltı
  'rar.0': { b: 'ui', g: 0.88, gap: 200, L: [thud(210, 140, 0.08, 0.32), N('w', 0.001, 0, 0.04, 0.2, { bp: [1200, 1200, 1.2] }), O('sine', 700, 0.001, 0, 0.12, 0.1), O('sine', 1130, 0.001, 0, 0.07, 0.05)] },
  'rar.1': { b: 'ui', g: 1.25, gap: 300, pr: 2, rv: 0.25, pv: 0, n: 2, L: v => [click(0.2, 4000), ...ting(1174.7, 0.16, 0.55), ...ting(v ? 1568 : 1760, 0.13, 0.6, 0.09), N('w', 0.05, 0, 0.35, 0.035, { t: 0.05, hp: 5500 })] },
  'rar.2': { b: 'ui', g: 0.98, gap: 800, pr: 2, rv: 0.4, pv: 0, n: 2, L: v => [O('sine', 98, 0.003, 0.1, 1.5, 0.3), O('sine', 147, 0.003, 0.05, 1.2, 0.16), O('sine', 196.6, 0.003, 0, 1.0, 0.1), click(0.3, 2500), N('p', 0.002, 0, 0.12, 0.2, { lp: 1500 }),
    ...[0, 2, 3, 5, 6, 8].flatMap((k, i) => ting(semi(587.33, PENTA[k + v] ?? 24), 0.1, 0.7, 0.16 + i * 0.11)), ...at(0.85, INS.kaval(1174.7, 0.7, 0.2)), N('w', 0.3, 0.35, 1.0, 0.04, { t: 0.2, hp: 7000 })] },

  // ---------- Ana üs ----------
  'hub.knock': { b: 'ui', g: 0.91, gap: 150, L: [thud(250, 175, 0.05, 0.34), N('p', 0.001, 0, 0.03, 0.2, { bp: [900, 900, 1.5] }), thud(235, 165, 0.05, 0.26, 0.09), N('p', 0.001, 0, 0.03, 0.14, { t: 0.09, bp: [900, 900, 1.5] })] },
  // Kapı: iki alçak sesin yükselen uğultusu + ışıltı
  'hub.gate': { b: 'ui', g: 1.49, gap: 500, pr: 2, rv: 0.35, n: 2, L: v => [O('sine', [110, 165], 0.2, 0.15, 0.6, 0.2, { st: 0.6 }), O('sine', [112, 167], 0.2, 0.15, 0.6, 0.16, { st: 0.6 }), O('sine', [330, 495], 0.2, 0.15, 0.6, 0.09, { st: 0.6 }), O('tri', [443, 664], 0.22, 0.1, 0.55, 0.05, { st: 0.6 }), N('p', 0.25, 0.1, 0.6, 0.1, { bp: [1600, 3400, 6] }), O('sine', [660, v ? 1320 : 1174.7], 0.25, 0, 0.5, 0.05, { vib: [6, 14] })] },
  'hub.mine': { b: 'ui', g: 0.7, gap: 200, L: [click(0.3, 3000), ...ting(1900, 0.1, 0.16), thud(150, 80, 0.06, 0.3), N('p', 0.002, 0, 0.08, 0.1, { t: 0.04, lp: 1500 })] },
  'hub.wheel': { b: 'ui', g: 1.99, gap: 400, L: [0, 0.05, 0.11, 0.19, 0.3].flatMap((t, i) => [N('w', 0.001, 0, 0.016, 0.22, { t, bp: [1800 - i * 90, 1800 - i * 90, 2] }), O('tri', 620 - i * 30, 0.001, 0, 0.022, 0.12, { t })]) },
  'hub.hall': { b: 'ui', g: 0.79, gap: 400, rv: 0.2, L: [O('sine', [115, 58], 0.002, 0, 0.3, 0.5), N('p', 0.001, 0, 0.05, 0.22, { lp: 500 }), N('p', 0.001, 0, 0.09, 0.34, { bp: [760, 380, 1.2] }), O('tri', [340, 225], 0.002, 0, 0.13, 0.18)] },
  'hub.stone': { b: 'ui', g: 1.11, gap: 400, rv: 0.25, L: [O('sine', 196, 0.02, 0, 0.5, 0.14), O('sine', 294.5, 0.02, 0, 0.4, 0.09), N('b', 0.002, 0, 0.09, 0.4, { lp: 320 }), click(0.1, 1800)] },

  // ---------- Örs ----------
  'anvil.strike': { b: 'ui', g: 0.5, gap: 90, rv: 0.2, L: strike() },
  // Gerilim: iki saniye boyunca sıklaşan ve tizleşen çekiç darbeleri, alttan yükselen körük
  'anvil.tension': { b: 'ui', g: 0.56, gap: 1500, pr: 2, rv: 0.2, pv: 0, n: 1, L: [...[0, 0.48, 0.92, 1.3, 1.6, 1.82].flatMap((t, i) => strike(1 + i * 0.035, 0.65 + i * 0.07, t)), N('p', 1.85, 0, 0.12, 0.1, { bp: [300, 1500, 1.5] }), O('sine', [55, 84], 1.8, 0, 0.15, 0.12)] },
  'anvil.ok': { b: 'ui', g: 0.63, gap: 400, pr: 2, rv: 0.3, pv: 0, n: 2, L: v => [...strike(1.12, 1.1), ...ting(880, 0.12, 0.5, 0.07), ...ting(1318.5, 0.12, 0.6, 0.17), ...ting(v ? 1975.5 : 1760, 0.1, 0.8, 0.27), N('w', 0.05, 0.05, 0.5, 0.03, { t: 0.1, hp: 6000 })] },
  // Zararsız başarısızlık: donuk tık + sönen buhar
  'anvil.fail': { b: 'ui', g: 0.85, gap: 400, pr: 2, rv: 0.1, n: 2, L: [N('w', 0.001, 0, 0.05, 0.4, { lp: 1800 }), O('tri', [310, 236], 0.001, 0, 0.14, 0.3), O('sine', 523, 0.001, 0, 0.1, 0.1), N('w', 0.02, 0, 0.42, 0.09, { t: 0.08, hp: 3500 })] },
  // Seviye kaybı: tık + aşağı kayan çift ses
  'anvil.drop': { b: 'ui', g: 0.71, gap: 400, pr: 2, rv: 0.2, pv: 0, n: 2, L: v => [N('w', 0.001, 0, 0.05, 0.4, { lp: 2000 }), thud(180, 70, 0.12, 0.4), O('tri', [v ? 698 : 660, 330], 0.005, 0.04, 0.5, 0.2, { st: 0.45 }), O('tri', [668, 335], 0.005, 0.04, 0.5, 0.14, { st: 0.45 }), N('w', 0.02, 0, 0.3, 0.06, { t: 0.1, hp: 3500 })] },
  // Kırılma: çatırtı + gümleme + dökülen parçalar
  'anvil.break': { b: 'ui', g: 0.6, gap: 600, pr: 2, rv: 0.35, n: 2, L: v => [N('w', 0.001, 0, 0.06, 0.6, { hp: 1200 }), O('sine', [120, 38], 0.002, 0, 0.6, 0.5), N('p', 0.01, 0, 0.7, 0.14, { bp: [2500, 600, 1] }),
    ...[3100, 2600, 3500, 2200, 1900, 2800, 1500].flatMap((f, i) => [O('sine', f * (v ? 0.93 : 1), 0.001, 0, 0.09, 0.09, { t: 0.05 + i * 0.09 + (i % 2) * 0.03 }), click(0.14, 4000, 0.05 + i * 0.09 + (i % 2) * 0.03, 0.01)])] },
  // Muska korudu: donuk tık + sıcak, koruyan beşli
  'anvil.safe': { b: 'ui', g: 1.16, gap: 400, pr: 2, rv: 0.3, pv: 0, n: 2, L: v => [N('w', 0.001, 0, 0.05, 0.3, { lp: 1800 }), O('tri', [300, 240], 0.001, 0, 0.12, 0.22), O('sine', 392, 0.08, 0.15, 0.6, 0.18, { t: 0.06 }), O('sine', 587.33, 0.08, 0.15, 0.6, 0.12, { t: 0.1 }), ...ting(v ? 1174.7 : 1568, 0.07, 0.6, 0.2)] },
  // +7 ve üstü: yükselen parıltı. Çeşit = artı − 7 (0…3): artı büyüdükçe daha uzun ve daha tiz
  'anvil.sparkle': { b: 'ui', g: 1.36, gap: 300, pr: 2, rv: 0.4, pv: 0, n: 4, L: v => [...Array.from({ length: 5 + v * 2 }, (_, i) => ting(semi(1174.7, PENTA[i] ?? 24), 0.07 + v * 0.008, 0.35 + v * 0.05, i * (0.06 - v * 0.004))).flat(), N('w', 0.15, 0.1 + v * 0.1, 0.6, 0.03 + v * 0.006, { hp: 7000 })] },

  // ---------- Savaş: savurma ----------
  'swing.sword': { b: 'battle', g: 2.41, gap: 90, pr: 0, L: [N('p', 0.02, 0, 0.14, 0.4, { bp: [900, 3200, 1.4] })] },
  'swing.axe': { b: 'battle', g: 1.3, gap: 90, pr: 0, L: [N('p', 0.04, 0, 0.2, 0.42, { bp: [350, 1300, 1.2] }), N('b', 0.03, 0, 0.15, 0.3, { lp: 400 })] },
  'swing.dagger': { b: 'battle', g: 1.62, gap: 90, pr: 0, L: [N('w', 0.008, 0, 0.06, 0.26, { bp: [2400, 5200, 2] }), N('w', 0.008, 0, 0.05, 0.16, { t: 0.07, bp: [2800, 5600, 2] })] },
  'swing.bow': { b: 'battle', g: 1.01, gap: 90, pr: 0, L: [O('saw', [190, 150], 0.002, 0, 0.16, 0.24, { lp: [2400, 500, 1] }), O('tri', [380, 300], 0.002, 0, 0.1, 0.12), N('w', 0.01, 0, 0.14, 0.18, { t: 0.03, bp: [3000, 5500, 3] })] },
  'swing.mace': { b: 'battle', g: 2.22, gap: 90, pr: 0, L: [N('p', 0.05, 0, 0.2, 0.45, { bp: [220, 800, 1] })] },
  'swing.staff': { b: 'battle', g: 1.44, gap: 90, pr: 0, L: [N('p', 0.04, 0, 0.18, 0.25, { bp: [600, 1800, 2] }), O('sine', [330, 520], 0.03, 0, 0.18, 0.12, { vib: [18, 25] })] },
  // ---------- Savaş: isabet ----------
  'hit.sword': { b: 'battle', g: 0.56, gap: 70, rv: 0.12, L: [N('w', 0.001, 0, 0.05, 0.5, { hp: 1800 }), O('sine', 2300, 0.001, 0, 0.12, 0.13), O('sine', 3450, 0.001, 0, 0.08, 0.07), thud(200, 90, 0.07, 0.4)] },
  'hit.axe': { b: 'battle', g: 0.82, gap: 70, rv: 0.12, L: [thud(150, 55, 0.14, 0.6), N('p', 0.001, 0, 0.09, 0.45, { lp: 1400 }), N('w', 0.001, 0, 0.03, 0.22, { bp: [900, 900, 1] })] },
  'hit.dagger': { b: 'battle', g: 0.8, gap: 70, rv: 0.1, L: [N('w', 0.001, 0, 0.025, 0.42, { hp: 3000 }), O('tri', [900, 500], 0.001, 0, 0.04, 0.18), N('p', 0.004, 0, 0.05, 0.2, { lp: 900 })] },
  'hit.bow': { b: 'battle', g: 0.95, gap: 70, rv: 0.1, L: [N('p', 0.001, 0, 0.04, 0.5, { bp: [1100, 700, 1.5] }), thud(240, 120, 0.06, 0.4), O('tri', [1500, 1200], 0.001, 0, 0.03, 0.1)] },
  'hit.mace': { b: 'battle', g: 0.64, gap: 70, rv: 0.14, L: [thud(110, 42, 0.2, 0.65), N('b', 0.001, 0, 0.1, 0.5, { lp: 500 }), O('tri', [620, 560], 0.001, 0, 0.1, 0.18), N('p', 0.001, 0, 0.03, 0.2, { lp: 1600 }), N('p', 0.001, 0, 0.07, 0.32, { bp: [820, 440, 1.2] })] },
  'hit.staff': { b: 'battle', g: 1.34, gap: 70, rv: 0.12, L: [O('tri', [520, 380], 0.001, 0, 0.06, 0.3), N('w', 0.001, 0, 0.02, 0.28, { bp: [1500, 1500, 1] }), O('sine', [1200, 400], 0.005, 0, 0.12, 0.12)] },
  // ---------- Savaş: büyü hazırlığı ve isabeti ----------
  'cast.fire': { b: 'battle', g: 1.71, gap: 120, rv: 0.15, L: [N('p', 0.12, 0.05, 0.3, 0.38, { bp: [250, 1100, 0.8] }), N('w', 0.05, 0, 0.3, 0.08, { hp: 4000 }), O('saw', [70, 110], 0.1, 0, 0.3, 0.08, { lp: 300 })] },
  'cast.ice': { b: 'battle', g: 0.85, gap: 120, rv: 0.2, L: [O('sine', [1800, 2900], 0.08, 0.05, 0.3, 0.1), O('sine', [2700, 4300], 0.1, 0, 0.3, 0.05), N('w', 0.1, 0.05, 0.3, 0.1, { hp: 6000 })] },
  'cast.bolt': { b: 'battle', g: 0.94, gap: 120, rv: 0.12, L: [O('sq', [60, 95], 0.02, 0.15, 0.15, 0.2, { bp: [1800, 2600, 3] }), N('w', 0.01, 0.1, 0.2, 0.12, { bp: [4000, 7000, 2] }), click(0.24, 3000, 0.05), click(0.2, 3000, 0.11), click(0.24, 3000, 0.19)] },
  'cast.arcane': { b: 'battle', g: 1.05, gap: 120, rv: 0.2, L: [O('sine', [392, 588], 0.1, 0.05, 0.3, 0.16, { vib: [7, 12] }), O('sine', [587, 880], 0.12, 0.05, 0.3, 0.08), N('p', 0.1, 0, 0.3, 0.06, { bp: [2000, 3500, 3] })] },
  'cast.heal': { b: 'battle', g: 1.23, gap: 120, rv: 0.25, L: [O('sine', [440, 660], 0.1, 0.08, 0.3, 0.14), O('tri', [660, 990], 0.14, 0, 0.3, 0.06), N('w', 0.1, 0, 0.3, 0.03, { hp: 6500 })] },
  'cast.buff': { b: 'battle', g: 1.43, gap: 120, rv: 0.15, L: [O('tri', [300, 450], 0.05, 0.05, 0.2, 0.16), N('p', 0.06, 0, 0.2, 0.08, { bp: [1200, 2600, 2] })] },
  'imp.fire': { b: 'battle', g: 0.63, gap: 80, rv: 0.2, L: [N('p', 0.004, 0, 0.45, 0.5, { lp: [2600, 220, 0.7] }), thud(130, 45, 0.4, 0.5), N('w', 0.002, 0, 0.12, 0.2, { hp: 2500 }), click(0.16, 2500, 0.1), click(0.12, 2800, 0.18), click(0.1, 2400, 0.3)] },
  'imp.ice': { b: 'battle', g: 0.75, gap: 80, rv: 0.22, L: [N('w', 0.001, 0, 0.05, 0.45, { hp: 4500 }), O('sine', 3100, 0.001, 0, 0.14, 0.1), O('sine', 4200, 0.001, 0, 0.12, 0.08, { t: 0.03 }), O('sine', 5300, 0.001, 0, 0.1, 0.06, { t: 0.07 }), O('sine', [900, 400], 0.002, 0, 0.12, 0.2), O('sine', 3700, 0.001, 0, 0.1, 0.05, { t: 0.13 }), O('sine', 4700, 0.001, 0, 0.1, 0.04, { t: 0.21 })] },
  'imp.bolt': { b: 'battle', g: 0.89, gap: 80, rv: 0.2, L: [N('w', 0.001, 0, 0.03, 0.7, { hp: 800 }), O('saw', [3000, 180], 0.001, 0, 0.12, 0.2, { lp: 5000 }), N('b', 0.01, 0, 0.5, 0.6, { lp: 260 }), N('w', 0.001, 0, 0.012, 0.35, { t: 0.07, hp: 3000 })] },
  'imp.arcane': { b: 'battle', g: 1.02, gap: 80, rv: 0.2, L: [O('sine', [700, 250], 0.002, 0, 0.2, 0.35), O('sine', [1400, 1050], 0.002, 0, 0.25, 0.12), N('p', 0.002, 0, 0.1, 0.28, { bp: [1500, 900, 1] })] },
  'bt.meteor': { b: 'battle', g: 1.34, gap: 200, pr: 0, L: [O('sine', [1900, 300], 0.03, 0, 0.32, 0.16), N('p', 0.05, 0, 0.3, 0.2, { bp: [3000, 600, 2] })] },
  'bt.whirl': { b: 'battle', g: 2.5, gap: 300, L: [N('p', 0.06, 0, 0.2, 0.36, { bp: [500, 1800, 1.2] }), N('p', 0.05, 0, 0.2, 0.34, { t: 0.2, bp: [1800, 600, 1.2] }), N('p', 0.05, 0, 0.22, 0.36, { t: 0.38, bp: [600, 2000, 1.2] })] },
  'bt.stomp': { b: 'battle', g: 0.66, gap: 300, rv: 0.2, L: [thud(90, 32, 0.5, 0.7), N('b', 0.002, 0, 0.4, 0.6, { lp: 300 }), N('p', 0.002, 0, 0.15, 0.4, { lp: 1500 }), N('p', 0.002, 0, 0.22, 0.34, { bp: [640, 320, 1] }), click(0.14, 2000, 0.12), click(0.1, 2400, 0.2), click(0.08, 1800, 0.29)] },
  // ---------- Savaş: etkiler ----------
  'bt.heal': { b: 'battle', g: 1.38, gap: 150, rv: 0.3, pv: 0, n: 2, L: v => [O('sine', 523.25, 0.02, 0.05, 0.4, 0.14), O('sine', 659.26, 0.02, 0.05, 0.4, 0.13, { t: 0.09 }), O('sine', v ? 880 : 783.99, 0.02, 0.08, 0.5, 0.14, { t: 0.18 }), N('w', 0.08, 0, 0.5, 0.03, { hp: 7000 })] },
  'bt.shield': { b: 'battle', g: 0.85, gap: 150, rv: 0.2, L: [O('sine', [180, 260], 0.01, 0.05, 0.3, 0.3), O('sine', [720, 740], 0.01, 0.02, 0.35, 0.1), O('sine', 1080, 0.01, 0, 0.3, 0.06), N('p', 0.01, 0, 0.12, 0.14, { bp: [800, 800, 3] })] },
  'bt.buff': { b: 'battle', g: 1.76, gap: 150, rv: 0.15, L: [...[440, 587.33, 880].flatMap((f, i) => at(i * 0.06, INS.tel(f, 0.16, 0.26))), N('w', 0.03, 0, 0.2, 0.03, { t: 0.1, hp: 6000 })] },
  'bt.debuff': { b: 'battle', g: 1.11, gap: 150, rv: 0.12, L: [O('saw', [330, 233], 0.01, 0.04, 0.25, 0.16, { lp: [1400, 500, 1] }), O('saw', [349, 247], 0.01, 0.04, 0.25, 0.1, { lp: [1400, 500, 1] })] },
  'bt.burn': { b: 'battle', g: 1.21, gap: 150, L: [N('p', 0.01, 0, 0.25, 0.36, { bp: [600, 2200, 1] }), N('w', 0.02, 0, 0.25, 0.1, { hp: 3500 }), click(0.14, 2600, 0.12)] },
  'bt.poison': { b: 'battle', g: 1.06, gap: 150, L: [O('sine', [260, 160], 0.004, 0, 0.07, 0.26), O('sine', [320, 200], 0.004, 0, 0.07, 0.24, { t: 0.08 }), O('sine', [230, 140], 0.004, 0, 0.08, 0.24, { t: 0.15 }), N('p', 0.01, 0, 0.2, 0.1, { lp: 700 })] },
  'bt.stun': { b: 'battle', g: 0.66, gap: 200, L: [O('sine', [500, 470], 0.001, 0, 0.3, 0.24, { vib: [14, 60] }), thud(160, 80, 0.08, 0.36), click(0.2, 2000)] },
  'bt.freeze': { b: 'battle', g: 0.69, gap: 200, rv: 0.2, L: [N('w', 0.001, 0, 0.04, 0.42, { hp: 5000 }), O('sine', [2400, 3200], 0.002, 0, 0.2, 0.12), O('sine', 3900, 0.002, 0, 0.25, 0.07), O('tri', [700, 900], 0.01, 0, 0.1, 0.08)] },
  'bt.taunt': { b: 'battle', g: 0.76, gap: 200, rv: 0.15, L: [thud(120, 60, 0.2, 0.5), O('saw', 196, 0.03, 0.1, 0.15, 0.2, { lp: 1100 }), O('saw', 294, 0.03, 0.1, 0.15, 0.08, { lp: 1100 }), N('p', 0.001, 0, 0.05, 0.26, { bp: [700, 420, 1] })] },
  'bt.tick.poison': { b: 'battle', g: 1.05, gap: 150, pr: 0, L: [O('sine', [300, 170], 0.003, 0, 0.06, 0.2), O('sine', [250, 150], 0.003, 0, 0.06, 0.16, { t: 0.07 })] },
  'bt.tick.burn': { b: 'battle', g: 0.8, gap: 150, pr: 0, L: [N('w', 0.004, 0, 0.14, 0.2, { hp: 2800 }), N('p', 0.002, 0, 0.06, 0.16, { bp: [900, 900, 1] })] },
  'bt.tick.regen': { b: 'battle', g: 1.5, gap: 150, pr: 0, L: [O('sine', [660, 880], 0.01, 0, 0.14, 0.12)] },
  // Kritik: isabetin üstüne binen keskin çınlama + alt vuruş
  'bt.crit': { b: 'battle', g: 0.64, gap: 100, rv: 0.25, L: [O('sine', 3600, 0.001, 0, 0.22, 0.13), O('sine', 5250, 0.001, 0, 0.16, 0.08), N('w', 0.001, 0, 0.03, 0.28, { hp: 5000 }), thud(90, 40, 0.25, 0.5)] },
  'bt.resist': { b: 'battle', g: 1.02, gap: 120, L: [O('sine', [420, 300], 0.001, 0, 0.07, 0.3), N('p', 0.001, 0, 0.04, 0.25, { bp: [1000, 1000, 2] }), O('tri', [300, 360], 0.02, 0, 0.1, 0.08, { t: 0.05 })] },
  'bt.absorb': { b: 'battle', g: 0.79, gap: 120, rv: 0.15, L: [O('sine', [640, 600], 0.001, 0, 0.15, 0.2), O('sine', 960, 0.001, 0, 0.1, 0.1), click(0.2, 2500)] },
  'bt.death': { b: 'battle', g: 0.62, gap: 150, rv: 0.2, L: [O('sine', [220, 48], 0.005, 0, 0.55, 0.3), thud(80, 35, 0.3, 0.5), N('p', 0.02, 0, 0.5, 0.18, { lp: [1800, 300, 0.7] }), O('tri', [560, 190], 0.005, 0, 0.42, 0.15, { lp: 1500 }), N('p', 0.01, 0, 0.32, 0.14, { bp: [950, 420, 1] })] },
  'bt.revive': { b: 'battle', g: 1.29, gap: 300, pr: 2, rv: 0.35, L: [O('sine', [220, 440], 0.15, 0.1, 0.4, 0.16), O('sine', [330, 660], 0.15, 0.1, 0.4, 0.1), ...ting(1318.5, 0.08, 0.6, 0.3)] },
  'bt.cleanse': { b: 'battle', g: 1.51, gap: 200, rv: 0.2, L: [O('sine', [600, 1800], 0.02, 0, 0.25, 0.12), N('w', 0.03, 0, 0.25, 0.07, { hp: 5000 }), ...ting(2093, 0.05, 0.3, 0.15)] },
  'bt.enrage': { b: 'battle', g: 0.75, gap: 400, rv: 0.15, L: [O('saw', [80, 165], 0.2, 0.05, 0.2, 0.2, { lp: [500, 1600, 1] }), N('p', 0.2, 0, 0.2, 0.14, { bp: [400, 1200, 1] }), thud(100, 50, 0.2, 0.4, 0.25)] },
  'bt.special': { b: 'battle', g: 1.46, gap: 250, L: [N('p', 0.35, 0, 0.12, 0.26, { bp: [400, 3000, 2] }), O('sine', [220, 660], 0.3, 0, 0.1, 0.1)] },
  // Savaş başlar: davul + kapıdan geçiş
  'bt.start': { b: 'battle', g: 0.85, gap: 1000, pr: 2, rv: 0.3, L: [...INS.davul(72, 0.3, 0.6), N('p', 0.25, 0, 0.3, 0.2, { bp: [300, 2000, 1.5] }), O('sine', [165, 330], 0.2, 0, 0.3, 0.1), ...at(0.38, INS.davul(60, 0.35, 0.7))] },
  // Yeni dalga: iki davul + alçak boru
  'bt.wave': { b: 'battle', g: 0.73, gap: 800, pr: 2, rv: 0.25, L: [...INS.davul(68, 0.25, 0.6), ...at(0.22, INS.davul(60, 0.3, 0.7)), ...at(0.1, INS.boru(98, 0.75, 0.45))] },
  // Boss girişi: derin boru beşlisi, ağır davullar, uğultu
  'bt.boss': { b: 'battle', g: 0.78, gap: 3000, pr: 2, rv: 0.35, pv: 0, n: 2, L: v => [...INS.boru(65.41, 1.7, 0.7), ...at(0.05, INS.boru(98, 1.6, 0.4)), ...at(0.12, INS.boru(196, 1.4, 0.2)), O('saw', v ? 92.5 : 69.3, 0.4, 0.5, 0.6, 0.06, { lp: 700 }), ...INS.davul(52, 0.45, 0.8), ...at(0.5, INS.davul(52, 0.45, 0.7)), ...at(1.0, INS.davul(48, 0.6, 0.85)), N('b', 0.3, 0.8, 0.7, 0.4, { lp: 140 })] },
  // Boss evre değiştirir: sert, uyumsuz alçak vuruş
  'bt.phase': { b: 'battle', g: 0.76, gap: 1500, pr: 2, rv: 0.3, L: [O('saw', [110, 104], 0.01, 0.15, 0.5, 0.22, { lp: [1600, 500, 1] }), O('saw', [155.6, 147], 0.01, 0.15, 0.5, 0.13, { lp: [1600, 500, 1] }), thud(100, 36, 0.5, 0.6), N('b', 0.01, 0.1, 0.5, 0.4, { lp: 200 })] },
  // Zafer: yükselen beş sesli koşu, kaval, çan · Yenilgi: ağır davul, inen kopuz, alçaltılmış ikinciden durağa
  'bt.victory': { b: 'battle', g: 0.92, gap: 3000, pr: 2, rv: 0.3, pv: 0, n: 2, L: v => tune([[0, 'davul', 70, 0.3, 0.5], ...(v ? [440, 659.26, 554.37, 880] : [440, 554.37, 659.26, 880]).map((f, i) => [i * 0.11, 'tel', f, 0.3, 0.34]),
    [0.45, 'davul', 62, 0.35, 0.6], [0.45, 'tel', 440, 0.9, 0.26], [0.45, 'tel', 659.26, 0.9, 0.24], [0.47, 'kaval', 880, 1.3, 0.3], [0.47, 'cin', 1760, 0.9, 0.12], [0.45, 'dem', 220, 1.7, 0.14], [0.45, 'dem', 329.63, 1.7, 0.1], [0.95, 'tel', v ? 1108.7 : 1318.5, 0.6, 0.2]]) },
  'bt.defeat': { b: 'battle', g: 0.89, gap: 3000, pr: 2, rv: 0.3, pv: 0, n: 2, L: v => tune([[0, 'davul', 54, 0.5, 0.6], [0, 'dem', 73.42, 2.7, 0.24], [0, 'dem', 110, 2.7, 0.12], [0, 'kopuz', 293.66, 0.5, 0.34], [0.32, 'kopuz', v ? 233.08 : 261.63, 0.5, 0.32], [0.64, 'kopuz', 220, 0.55, 0.32], [1.0, 'kopuz', 155.56, 0.5, 0.3], [1.34, 'kopuz', 146.83, 1.3, 0.36], [1.34, 'davul', 50, 0.6, 0.5]]) },

  // ---------- Ortamın seyrek sesleri (döngüler çalar) ----------
  'amb.crackle': { b: 'amb', pr: 0, L: [N('w', 0.001, 0, 0.012, 0.5, { bp: [2200, 2200, 1.5] })] },
  'amb.pop': { b: 'amb', pr: 0, L: [N('p', 0.001, 0, 0.05, 0.5, { lp: 900 }), thud(240, 120, 0.05, 0.3)] },
  'amb.clink': { b: 'amb', pr: 0, L: strike(1, 0.5).map(L => ({ ...L, lp: 2600 })) },
  'amb.chirp': { b: 'amb', pr: 0, L: v => [[0, 2600, 3400], [0.1, 3000, 2500], [0.22, 2800, 3600], [0.34, 3200, 2900]].slice(0, 2 + v).map(([t, a, b]) => O('sine', [a, b], 0.01, 0, 0.08, 0.2, { t })) },
  'amb.cricket': { b: 'amb', pr: 0, L: [0, 0.045, 0.09].map(t => O('sine', 4300, 0.004, 0, 0.03, 0.12, { t })) },
  'amb.flap': { b: 'amb', pr: 0, L: [N('p', 0.01, 0, 0.09, 0.35, { bp: [500, 900, 0.8] }), N('p', 0.01, 0, 0.07, 0.2, { t: 0.12, bp: [600, 1000, 0.8] })] },
  'amb.gust': { b: 'amb', pr: 0, n: 2, L: [N('p', 0.5, 0.3, 0.9, 0.4, { bp: [400, 900, 1.2] })] },
  'amb.drip': { b: 'amb', pr: 0, L: [O('sine', [1400, 900], 0.001, 0, 0.03, 0.2), click(0.16, 3500, 0, 0.008)] },
  'amb.chime': { b: 'amb', pr: 0, L: ting(1568, 0.2, 0.9) },
};

// ======================= Döngüler =======================
const seq = key => ({ bpm: BEDS[key].bpm, beats: BEDS[key].beats, bar: i => bedBar(key, i) });
export const LOOPS = {
  // Kragmir: ocak uğultusu, körük soluğu, çıtırdayan köz, uzakta çekiç. Gece: daha sessiz, çekiç susar.
  'amb.ocak.day': { b: 'amb', rv: 0.25, beds: [{ n: 'b', lp: [150, 0.7], g: 0.3, lfo: [0.07, 0.35] }, { n: 'p', bp: [420, 0.9], g: 0.2, lfo: [0.21, 0.8] }, { n: 'w', hp: [5200, 0.7], g: 0.012, lfo: [0.9, 0.6] }],
    ev: [{ s: 'amb.crackle', every: [0.08, 0.6], g: [0.12, 0.4], pan: 0.6, pj: 0.25 }, { s: 'amb.pop', every: [2.5, 7], g: [0.25, 0.5], pan: 0.5, pj: 0.2 }, { s: 'amb.clink', every: [4, 11], g: [0.2, 0.45], pan: 0.7, pj: 0.06 }] },
  'amb.ocak.night': { b: 'amb', rv: 0.25, beds: [{ n: 'b', lp: [130, 0.7], g: 0.22, lfo: [0.05, 0.4] }, { n: 'p', bp: [260, 0.6], g: 0.16, lfo: [0.05, 0.7], flfo: [0.03, 90] }],
    ev: [{ s: 'amb.crackle', every: [0.3, 1.6], g: [0.1, 0.3], pan: 0.6, pj: 0.25 }, { s: 'amb.pop', every: [4, 11], g: [0.2, 0.4], pan: 0.5, pj: 0.2 }, { s: 'amb.cricket', every: [1.2, 4], g: [0.15, 0.35], pan: 0.8, pj: 0.04 }] },
  // Elentha: açık rüzgâr, dalgalanan sancak, gündüz kuş cıvıltısı; gece cırcır böcekleri
  'amb.sancak.day': { b: 'amb', rv: 0.2, beds: [{ n: 'p', bp: [700, 0.6], g: 0.34, lfo: [0.09, 0.6], flfo: [0.05, 260] }, { n: 'w', hp: [6500, 0.7], g: 0.012, lfo: [0.13, 0.7] }],
    ev: [{ s: 'amb.chirp', every: [1.8, 6], g: [0.12, 0.3], pan: 0.8, pj: 0.12 }, { s: 'amb.flap', every: [1.2, 4], g: [0.12, 0.3], pan: 0.5, pj: 0.1 }, { s: 'amb.chime', every: [7, 18], g: [0.1, 0.2], pan: 0.6, pj: 0.02 }] },
  'amb.sancak.night': { b: 'amb', rv: 0.2, beds: [{ n: 'p', bp: [520, 0.6], g: 0.24, lfo: [0.07, 0.6], flfo: [0.04, 180] }],
    ev: [{ s: 'amb.cricket', every: [0.35, 1.4], g: [0.15, 0.4], pan: 0.9, pj: 0.05 }, { s: 'amb.flap', every: [3, 8], g: [0.1, 0.22], pan: 0.5, pj: 0.1 }, { s: 'amb.chime', every: [12, 26], g: [0.08, 0.16], pan: 0.6, pj: 0.02 }] },
  // Hava katmanları: ana üste ve savaşta ortamın üstüne biner
  'amb.wx.rain': { b: 'amb', beds: [{ n: 'w', hp: [1700, 0.5], lp: [7000, 0.5], g: 0.11, lfo: [0.17, 0.25] }, { n: 'p', bp: [500, 0.7], g: 0.1 }], ev: [{ s: 'amb.drip', every: [0.12, 0.5], g: [0.1, 0.3], pan: 0.9, pj: 0.3 }] },
  'amb.wx.wind': { b: 'amb', beds: [{ n: 'p', bp: [520, 1.6], g: 0.42, lfo: [0.11, 0.75], flfo: [0.07, 300] }, { n: 'p', bp: [1500, 5], g: 0.06, lfo: [0.19, 0.9], flfo: [0.09, 500] }], ev: [{ s: 'amb.gust', every: [5, 12], g: [0.3, 0.6], pan: 0.6, pj: 0.2 }] },
  'amb.wx.fog': { b: 'amb', beds: [{ o: 'sine', f: 98, g: 0.035, lfo: [0.05, 0.8] }, { o: 'sine', f: 147.5, g: 0.025, lfo: [0.07, 0.8] }, { o: 'sine', f: 392.6, g: 0.009, lfo: [0.045, 0.85] }, { n: 'b', lp: [220, 0.7], g: 0.16, lfo: [0.04, 0.5] }, { n: 'p', bp: [620, 0.5], g: 0.075, lfo: [0.06, 0.6], flfo: [0.03, 140] }] },
  // Kapı: birbirine çok yakın iki alçak sesin vuruşu + ince ışıltı
  'amb.portal': { b: 'amb', beds: [{ o: 'sine', f: 110, g: 0.035 }, { o: 'sine', f: 110.7, g: 0.035 }, { o: 'sine', f: 220.4, g: 0.014, lfo: [0.13, 0.8] }, { o: 'sine', f: 330, g: 0.02 }, { o: 'sine', f: 331.1, g: 0.02 }, { o: 'sine', f: 441.3, g: 0.01, lfo: [0.17, 0.8] }, { n: 'p', bp: [2100, 7], g: 0.045, lfo: [0.31, 0.9], flfo: [0.11, 700] }] },
  'amb.battle': { b: 'amb', rv: 0.25, beds: [{ n: 'b', lp: [180, 0.7], g: 0.22, lfo: [0.06, 0.4] }, { n: 'p', bp: [600, 0.8], g: 0.17, lfo: [0.1, 0.7], flfo: [0.06, 200] }], ev: [{ s: 'amb.clink', every: [6, 15], g: [0.08, 0.2], pan: 0.9, pj: 0.1 }] },
  // Açılış ekranı (taraf seçilmeden): rüzgâr ve alçak dem
  'amb.title': { b: 'amb', rv: 0.2, beds: [{ n: 'p', bp: [600, 0.7], g: 0.24, lfo: [0.08, 0.6], flfo: [0.05, 220] }, { o: 'sine', f: 73.42, g: 0.04, lfo: [0.06, 0.6] }, { o: 'sine', f: 110.2, g: 0.025, lfo: [0.09, 0.7] }], ev: [{ s: 'amb.chime', every: [8, 20], g: [0.08, 0.18], pan: 0.6, pj: 0.02 }] },
  // Yemin Pazarı: uzak kalabalık uğultusu (iki dalgalı orta bölge gürültüsü), arada para ve teneke şıngırtısı, çan
  'amb.market': { b: 'amb', rv: 0.22, beds: [{ n: 'p', bp: [480, 1.1], g: 0.26, lfo: [0.23, 0.55], flfo: [0.17, 140] }, { n: 'p', bp: [950, 1.6], g: 0.1, lfo: [0.37, 0.7], flfo: [0.11, 220] }, { n: 'b', lp: [160, 0.7], g: 0.16 }],
    ev: [{ s: 'amb.clink', every: [1.5, 5], g: [0.15, 0.35], pan: 0.8, pj: 0.08 }, { s: 'amb.chime', every: [9, 22], g: [0.08, 0.16], pan: 0.6, pj: 0.03 }, { s: 'amb.flap', every: [2.5, 7], g: [0.1, 0.22], pan: 0.6, pj: 0.1 }] },
  'mus.hub.ocak': { b: 'amb', g: 1, rv: 0.3, fade: 2.5, seq: seq('mus.hub.ocak') },
  'mus.hub.sancak': { b: 'amb', g: 0.9, rv: 0.3, fade: 2.5, seq: seq('mus.hub.sancak') },
  // 22 Kas: kullanıcının verdiği parça ("Under the Crimson Eye"): şehir/pazar ezgisi ve fragman müziği (dosyadan, döngüde)
  'mus.tema': { b: 'amb', g: 0.62, rv: 0, fade: 2.5, url: MUSIC_URL },
  'mus.fragman': { b: 'amb', g: 0.8, rv: 0, fade: 0.4, url: MUSIC_URL },
  'mus.battle': { b: 'amb', g: 1.15, rv: 0.2, fade: 0.8, seq: seq('mus.battle') },
  'mus.boss': { b: 'amb', g: 1, rv: 0.25, fade: 0.8, seq: seq('mus.boss') },
};
register({ patches: PATCHES, loops: LOOPS });
preloadMusic(MUSIC_URL);

// ======================= Eşlemeler (saf) =======================
export const WEAPON_KEYS = ['sword', 'axe', 'dagger', 'bow', 'mace', 'staff'];
export const ELEMENT_KEYS = ['fire', 'ice', 'bolt'];
const tbl = (T, k, d) => (typeof k === 'string' && Object.hasOwn(T, k) ? T[k] : d);
// Durum etkisi → ses (content.js STATUS anahtarlarının tamamı)
export const STATUS_SFX = { atkUp: 'bt.buff', defUp: 'bt.buff', spdUp: 'bt.buff', critUp: 'bt.buff', regen: 'bt.heal', shield: 'bt.shield', taunt: 'bt.taunt', provoked: 'bt.taunt', atkDown: 'bt.debuff', defDown: 'bt.debuff', spdDown: 'bt.debuff', mark: 'bt.debuff', rot: 'bt.debuff', burn: 'bt.burn', poison: 'bt.poison', stun: 'bt.stun', freeze: 'bt.freeze', bleed: 'bt.debuff', guard: 'bt.shield', ward: 'bt.shield' };
export const TICK_SFX = { burn: 'bt.tick.burn', poison: 'bt.tick.poison', regen: 'bt.tick.regen', bleed: 'bt.tick.poison' };
export const skillElement = S => { for (const f of S?.fx || []) if (f.el) return f.el; return null; };
// Yeteneğin ses bağlamı: saldıranın silah türü, yeteneğin elementi, animasyonu, büyü mü
export function skillCtx(S, unit) {
  const el = skillElement(S);
  return { wt: WEAPON_KEYS.includes(unit?.wt) ? unit.wt : 'sword', el: ELEMENT_KEYS.includes(el) ? el : null, anim: S?.anim || 'melee', mag: S?.sc === 'mag', special: (S?.cd || 0) > 0 };
}
// Hazırlık sesi (büyü yapma, kol kaldırma): elementli → o elementin sesi; şifa / güçlendirme / elementsiz büyü ayrı
export const castSound = c => (c.el ? `cast.${c.el}` : c.anim === 'heal' ? 'cast.heal' : c.anim === 'buff' ? 'cast.buff' : c.mag ? 'cast.arcane' : 'cast.buff');
// İsabet sesi: elementli hasar → element isabeti; elementsiz büyü mermisi → büyü isabeti; öbürleri silah türüne göre
export const hitSound = c => (c.el ? `imp.${c.el}` : c.mag && (c.anim === 'bolt' || c.anim === 'meteor') ? 'imp.arcane' : `hit.${c.wt}`);
// Karakterin hareketi (combat.js animasyon çağrıları) → ses adları
export function motionSounds(m, c) {
  switch (m) {
    case 'swing': return [`swing.${c.wt}`];
    case 'shoot': return ['swing.bow'];
    case 'whirl': return ['bt.whirl'];
    case 'stomp': return ['bt.stomp'];
    case 'castSpell': return [castSound(c)];
    case 'raiseArms': return c.anim === 'meteor' ? [castSound(c), 'bt.meteor'] : [castSound(c)];
    default: return [];
  }
}
export const MOTIONS = ['swing', 'shoot', 'whirl', 'stomp', 'castSpell', 'raiseArms'];
// Savaş etkisi (battle.js fx kaydı) → ses adları
export function fxSounds(f, c) {
  switch (f?.k) {
    case 'dmg': { const out = [f.abs >= f.amt ? 'bt.absorb' : hitSound(c)]; if (f.crit) out.push('bt.crit'); if (f.killed) out.push('bt.death'); return out; }
    case 'heal': return f.amt > 0 ? ['bt.heal'] : [];
    case 'st': return [tbl(STATUS_SFX, f.s, 'bt.debuff')];
    case 'resist': return ['bt.resist'];
    case 'cleanse': return ['bt.cleanse'];
    case 'revive': return ['bt.revive'];
    case 'phase': return ['bt.phase'];
    // uzmanlık yollarının olayları: kendi yamaları yok, en yakın sesle çalar
    case 'det': { const out = [Array.isArray(f.s) && f.s.includes('burn') ? 'imp.fire' : 'bt.tick.poison']; if (f.killed) out.push('bt.death'); return out; }
    case 'guard': { const out = [f.abs >= f.amt ? 'bt.absorb' : 'bt.shield']; if (f.killed) out.push('bt.death'); return out; }
    case 'strip': return ['bt.debuff'];
    case 'ward': return ['bt.resist'];
    default: return []; // tm (sıra çubuğu) sessizdir
  }
}
// Tıklama türü (data-a adına göre): sessiz · sekme · anahtar · onay · geri · dokunuş
export function tapKind(a) {
  a = String(a || '');
  if (/^(closeWin|closeModal|building|upgrade|sesToggle)$/.test(a)) return 'silent'; // kendi sesi başka kancadan gelir
  if (/^(tab|sub|zone|tier|slot|pick|sp|tp|faction)$|^pick|(Cat|Kind|Zone|Type|Cls|Tier|Tone|Sym|Cur|Seat|Slot|Reason|Conv)$/.test(a)) return 'tab';
  if (/(Opt|Focus|Follow)$|^(vsAuto|notifCat|gfx)$/.test(a)) return 'toggle';
  if (/^(yes|create|vsStart|devYes)$|Do$/.test(a)) return 'confirm';
  if (/^(hub|devNo)$|Back$|^back/.test(a)) return 'back';
  return 'tap';
}
export const TAP_SFX = { silent: null, tab: 'ui.tab', toggle: 'ui.toggle', confirm: 'ui.confirm', back: 'ui.back', tap: 'ui.tap' };
const RACE_SFX = ['ui.confirm.sancak', 'ui.confirm.ocak', 'ui.tab.sancak', 'ui.tab.ocak'];
let RACE = '';
export const setRace = f => { RACE = f === 'sancak' || f === 'ocak' ? f : ''; };
export const tapSound = a => { const n = TAP_SFX[tapKind(a)]; return n && RACE && RACE_SFX.includes(`${n}.${RACE}`) ? `${n}.${RACE}` : n; };
// Bina → dokunma sesi
export const BUILDING_SFX = { gate: 'hub.gate', anvil: 'anvil.strike', mine: 'hub.mine', market: 'ui.coins', wheel: 'hub.wheel', hall: 'hub.hall', clanhq: 'ui.horn', monument: 'hub.stone' };
export const buildingSound = id => tbl(BUILDING_SFX, id, 'hub.knock');
// Örs sonucu → sesler. +7 ve üstündeki başarıda yükselen parıltı eklenir (çeşidi artıya göre).
export const ANVIL_OUT = { ok: 'anvil.ok', fail: 'anvil.fail', drop: 'anvil.drop', break: 'anvil.break', safe: 'anvil.safe' };
export const ANVIL_TENSION_MS = 2000; // ui-esya.js'teki gerilim süresiyle aynı
export function anvilSounds(r) {
  const out = [[tbl(ANVIL_OUT, r?.out, 'anvil.fail')]];
  if (r?.out === 'ok' && r.plus >= 7) out.push(['anvil.sparkle', { v: Math.min(3, r.plus - 7), delay: 0.25 }]);
  if (r?.out === 'ok' && r.plus >= 10) out.push(['id.plus10', { delay: 0.5 }]);
  if (RACE && ((r?.out === 'ok' && r.plus >= 8) || r?.out === 'break')) out.push([`id.${RACE}`, { delay: r.out === 'break' ? 0.7 : r.plus >= 10 ? 1.6 : 0.9, gain: r.out === 'break' ? 0.6 : 1 }]); // ırkın imzası: büyük başarıda zafer, kırılmada yas
  return out;
}
// Ganimetteki en yüksek nadirlik (eşya yoksa −1)
export function lootGrade(r) {
  let g = -1;
  for (const l of Array.isArray(r?.loot) ? r.loot : []) if (l?.t === 'item' && Number.isInteger(l.g)) g = Math.max(g, Math.min(2, Math.max(0, l.g)));
  return g;
}
// İşlem sonucu → sesler. Değer: ses adı ya da (sonuç, istek) → ad | [ad, seçenek][] | null
export const ACTION_SFX = {
  'item.equip': 'ui.equip', 'item.unequip': 'ui.unequip', 'item.dismantle': 'ui.dismantle', 'item.sell': 'ui.coins', 'loadout.set': 'ui.equip',
  'anvil.craft': 'anvil.strike', 'anvil.reforge': 'anvil.ok',
  'shop.buy': 'ui.coins', 'clan.buy': 'ui.coins', 'premium.buy': 'ui.reward', 'upkeep.buy': 'ui.coins', 'market.buy': 'ui.coins', 'mine.trade': 'ui.coins', 'clan.donate': 'ui.coins', 'realm.grant': 'ui.coins', 'pay.card': 'ui.reward',
  'market.sell': 'ui.stamp', 'market.cancel': 'ui.back', 'realm.vote': 'ui.stamp', 'realm.run': 'ui.stamp', 'chat.report': 'ui.stamp',
  'quest.claim': 'ui.quest', 'weekly.claim': 'ui.quest', 'clan.quest': 'ui.quest', 'quest.bonus': 'ui.chest', 'weekly.bonus': 'ui.chest', 'clan.claim': 'ui.chest',
  'cal.claim': 'ui.reward', 'mail.claim': 'ui.reward', 'daily.gift': 'ui.reward', 'idle.collect': 'ui.reward', 'mine.collect': 'ui.coins', 'farm.collect': 'ui.reward', 'farm.start': 'ui.confirm',
  'boss.exchange': 'rar.2', 'wheel.spin': 'ui.chest', 'battle.sweep': 'ui.reward', 'depth.sweep': 'ui.reward',
  'hall.up': 'ui.upgrade', 'mine.upgrade': 'ui.upgrade', 'stat.add': 'ui.point', 'skill.add': 'ui.point', 'stat.reset': 'ui.dismantle', 'skill.reset': 'ui.dismantle',
  'title.set': 'ui.equip', 'season.title': 'ui.equip', 'profile.avatar': 'ui.equip', 'clan.banner': 'ui.equip', 'hero.rename': 'ui.stamp',
  'hero.recruit': 'ui.horn', 'clan.create': 'ui.horn', 'clan.join': 'ui.horn', 'clan.accept': 'ui.horn', 'realm.announce': 'ui.horn', 'clan.hunt': 'ui.horn',
  'chat.send': 'ui.send', 'friend.add': 'ui.send', 'clan.invite': 'ui.send', 'clan.apply': 'ui.send',
  'battle.start': (r, a) => (a?.mode === 'siege' ? 'id.siege' : 'bt.start'),
  'battle.finish': r => (r?.mode === 'clanboss' ? 'ui.reward' : r?.win ? 'bt.victory' : 'bt.defeat'),
  'feud.revenge': () => (RACE ? `id.${RACE}` : 'ui.horn'),
};
// Salt sorgular (ve zamanlayıcıyla giden istekler) hata sesi çıkarmaz
const QUIET = /\.(peek|list|view|get|convs|plan|top|mine|history|search|roster|ledger|map|item|read)$|^ping$|^player\.card$|^battle\.abandon$/;
export const errorSound = type => (QUIET.test(String(type)) ? null : 'ui.error');
export function actionSounds(type, r, payload) {
  const out = [], T = tbl(ACTION_SFX, type, null), name = typeof T === 'function' ? T(r, payload) : T;
  if (name) out.push([name]);
  if (type !== 'item.dismantle' && type !== 'item.sell') { const g = lootGrade(r); if (g >= 0) out.push([`rar.${g}`, { delay: !name ? 0 : type === 'battle.finish' ? 0.9 : name === 'ui.chest' ? 0.5 : 0.3 }]); } // ganimette eşya varsa nadirliği duyulur
  return out;
}
// Yer → çalacak döngüler. place: 'title' | 'hub' | 'battle' | 'boss' | 'result' | 'none'
export function sceneLoops({ place, faction, phase, weather } = {}) {
  const f = faction === 'sancak' ? 'sancak' : 'ocak', night = phase === 'night' || phase === 'dusk', wx = ['rain', 'wind', 'fog'].includes(weather) ? [`amb.wx.${weather}`] : [];
  switch (place) {
    case 'title': return ['amb.title'];
    case 'fragman': return ['mus.fragman'];
    case 'hub': return [`amb.${f}.${night ? 'night' : 'day'}`, 'amb.portal', ...wx, 'mus.tema'];
    case 'carsi': return ['amb.market', ...wx, 'mus.tema']; // Yemin Pazarı: kalabalık uğultusu, tezgâh sesleri; ezgi oyuncunun ırkınınki
    case 'battle': return ['amb.battle', ...wx, 'mus.battle'];
    case 'boss': return ['amb.battle', ...wx, 'mus.boss'];
    case 'result': return ['amb.battle', ...wx];
    default: return [];
  }
}

// ======================= Savaş kancaları (combat.js tek satırlarla çağırır) =======================
const OPT = { pan: 0, gain: 1, ts: 1, delay: 0, v: undefined }; // tek, yeniden kullanılan seçenek nesnesi (çalarken kopyalanmaz)
const say = (name, pan = 0, delay = 0, gain = 1) => { OPT.pan = pan; OPT.delay = delay; OPT.gain = gain * (SFX.speed >= 3 ? 0.85 : 1); OPT.ts = SFX.speed >= 3 ? 0.75 : SFX.speed === 2 ? 0.88 : 1; OPT.v = undefined; return play(name, OPT); };
const panOf = a => Math.max(-0.6, Math.min(0.6, (a?.home?.x || 0) / 5));
export const SFX = {
  speed: 1, ctx: skillCtx(null, null), boss: false, over: false, onScene: null,
  // Sahneye konan birim: animasyon çağrıları (savurma, ok, büyü…) sesini kendisi çalar
  actor(a) {
    const c = a?.char; if (!c) return;
    c.sfxPan = panOf(a);
    for (const m of MOTIONS) {
      const f = c[m];
      if (typeof f !== 'function' || f.sfx) continue;
      const w = function (...args) { const ns = motionSounds(m, SFX.ctx); for (let i = 0; i < ns.length; i++) say(ns[i], this.sfxPan, i * 0.22); return f.apply(this, args); };
      w.sfx = true; c[m] = w;
    }
  },
  // Yetenek başlar: bağlam (silah türü, element) kurulur; özel yeteneklerde kısa yükseliş
  skill(ev, unit, S, speed = 1) { this.speed = speed; this.ctx = skillCtx(S, unit); if (this.ctx.special) say('bt.special'); },
  // Etki uygulanır (hasar, şifa, durum…): a = hedef aktör
  fx(f, a) { const ns = fxSounds(f, this.ctx), pan = a?.char?.sfxPan ?? 0; for (let i = 0; i < ns.length; i++) say(ns[i], pan, ns[i] === 'bt.death' ? 0.12 : 0); },
  // Olay akışı: dalga (boss girişi), tur başı (zehir/yanık, sersemleme, öfke)
  event(ev, battle, speed = 1) {
    this.speed = speed;
    if (ev.t === 'wave') {
      if (ev.n === 0) { this.boss = false; this.over = false; }
      const boss = ev.ids.some(id => battle.get(id)?.boss);
      if (boss) say('bt.boss'); else if (ev.n > 0) say('bt.wave');
      if (boss !== this.boss || ev.n === 0) { this.boss = boss; this.onScene?.(); }
    } else if (ev.t === 'turn') {
      for (const tk of ev.ticks) { const n = tbl(TICK_SFX, tk.s, null); if (n) say(n); if (tk.killed) say('bt.death', 0, 0.12); }
      if (ev.skip) say(tbl(STATUS_SFX, ev.skip, 'bt.stun'), 0, 0, 0.7);
      if (ev.enrage) say('bt.enrage');
    }
  },
  // Savaş biter: ezgi susar (zafer / yenilgi ezgisi sunucunun sonucu gelince çalar)
  end() { this.over = true; this.speed = 1; this.onScene?.(); },
};
export { play, stop, hasSound, hasLoop };
// Bir yeteneğin kullanabileceği bütün sesler (denemeler: tablo eksiksiz mi)
export function skillSoundNames(S, wt) {
  const c = skillCtx(S, { wt });
  return [...new Set([...MOTIONS.flatMap(m => motionSounds(m, c)), hitSound(c), castSound(c)])];
}
