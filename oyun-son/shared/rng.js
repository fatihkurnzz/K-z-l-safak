// Belirlenimci rastgele sayı üreteci (mulberry32). Savaş motoru yalnızca bunu kullanır:
// aynı tohum + aynı hamleler = istemcide ve sunucuda bit bit aynı savaş.
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
export const pickFrom = (rand, arr) => arr[Math.floor(rand() * arr.length)];
// Ağırlıklı seçim: [[değer, ağırlık], ...]
export function weighted(rand, pairs) {
  let total = 0;
  for (const p of pairs) total += p[1];
  let r = rand() * total;
  for (const p of pairs) { r -= p[1]; if (r < 0) return p[0]; }
  return pairs[pairs.length - 1][0];
}
