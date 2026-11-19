// Hisar Kuşatması, vergi paylaşımı ve ittifak yardımı: saf hesaplar (sunucu ve arayüz aynı sayıyı kullanır).
// Kurallar hisarops.js'tedir; sabitler content.js HISAR.
import { HISAR, weekKey } from './content.js';
import { weekStartAt, HOUR, DAY } from './realm.js';

const MIN = 60000;
// W haftasının kuşatma penceresi: { week, start, end, resolveAt }
export const hisarWin = W => { const start = weekStartAt(W) + HISAR.day * DAY + HISAR.hour * HOUR; return { week: W, start, end: start + HISAR.len * MIN, resolveAt: start + (HISAR.len + HISAR.grace) * MIN }; };
// Şu an pencere açıksa haftanın anahtarı, değilse null
export const hisarOpen = now => { const w = hisarWin(weekKey(now)); return now >= w.start && now < w.end ? w.week : null; };
// Sıradaki (ya da süren) pencere
export const nextHisar = now => { const w = hisarWin(weekKey(now)); return now < w.end ? w : hisarWin(weekKey(now) + 1); };
// Sonucu kesinleşmesi gereken en son hafta: bu haftanınki çözüm anı geçtiyse bu hafta, değilse geçen hafta
export const hisarDue = now => { const W = weekKey(now); return now >= hisarWin(W).resolveAt ? W : W - 1; };

// Vergi üçe bölünür: 1/3 hisar sahibi klan, 1/3 ittifak ortakları (eşit; ortak yoksa sahibe), kalan havuza.
// Aşağı yuvarlanır; her yuvarlama kalanı Irklar Arası Vergi Havuzu'na gider. Toplam her zaman n'dir.
export function splitTax(n, allies = 0) {
  const third = Math.floor(n / 3);
  if (!(allies > 0)) return { own: 2 * third, each: 0, ally: 0, pool: n - 2 * third };
  const each = Math.floor(third / allies);
  return { own: third, each, ally: each * allies, pool: n - third - each * allies };
}
// Yardım: özgün süre dur, şimdiye dek kısaltılan cut → bu yardımın kısaltması (ms). Toplam en çok dur × helpMax.
export const helpMax = dur => Math.floor(dur * HISAR.helpMax);
export const helpCut = (dur, cut) => Math.max(0, Math.min(Math.round(dur * HISAR.helpPct / 100), helpMax(dur) - (cut || 0)));
// Havuzun eşit bölünmesi: kişi başı ve dağıtılamayan kalan (havuzda kalır)
export const poolShare = (n, count) => (count > 0 ? { each: Math.floor(n / count), rest: n - Math.floor(n / count) * count } : { each: 0, rest: n });
