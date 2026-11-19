// Kural modüllerinin ortak yardımcıları: hata türü, doğrulama, çantaya ekleme, ganimet verme, günlük sayaçlar.
import { BAG_LIMIT } from './content.js';
import { dustYield, gradeOf, minPlus } from './items.js';

export class GameError extends Error { constructor(code, message) { super(message || code); this.code = code; } }
export const fail = (code, message) => { throw new GameError(code, message); };
export const int = (v, min, max) => Number.isInteger(v) && v >= min && v <= max;

// Nadirlik tabandan düzeltilir (gradeOf): eski kaynaklardan gelen 3 (Eşsiz) ya da 2 (Üstün) değeri de doğru yazılır
export function addItem(p, b, g, extra) { const it = { id: p.nextItem++, b, p: 0, ...extra, g: gradeOf(b, g) }; it.p = Math.max(it.p || 0, minPlus(b)); p.items.push(it); return it; } // takı dışı eşya +1'den başlar
export function removeItems(p, ids) { const s = new Set(ids); p.items = p.items.filter(it => !s.has(it.id)); }
export function busy(p) { if (p.battle) fail('in-battle', 'Savaş sürerken bu işlem yapılamaz.'); }
export function pay(p, cur, n, msg) { if (p[cur] < n) fail('no-' + cur, msg || 'Yeterli kaynak yok.'); p[cur] -= n; }

// Tek bir ganimeti oyuncuya işler ve loot listesine (aynı türleri birleştirerek) yazar.
// drop: {t:'item',b,g} | {t:'stone',g,n} | {t:'dust'|'charm'|'ember'|'akce'|'yakut'|'san'|'ore'|'seal'|'energy'|'nisan'|'berat',n} | {t:'mark',boss,n} | {t:'shard',k,n}
const WALLET = { dust: 'toz', charm: 'charms', ember: 'embers', akce: 'akce', yakut: 'yakut', san: 'san', ore: 'ore', seal: 'seals', energy: 'energy', nisan: 'nisan', berat: 'berat' };
// opt.nt (ya da drop.nt): eşya Satılamaz işaretlenir (görev ödülü, oyunun hediyesi; items.js isTradable)
export function grant(p, loot, drop, opt) {
  if (drop.t === 'item') {
    const g = gradeOf(drop.b, drop.g), nt = drop.nt || opt?.nt ? { nt: 1 } : {};
    if (p.items.length >= BAG_LIMIT) { const toz = dustYield({ b: drop.b, g, p: 0 }); p.toz += toz; loot.push({ ...drop, g, dusted: toz }); }
    else { const it = addItem(p, drop.b, g, nt); loot.push({ ...drop, ...nt, g, id: it.id }); }
    return;
  }
  if (drop.t === 'stone') p.stones[drop.g] += drop.n;
  else if (drop.t === 'mark') p.marks[drop.boss] = (p.marks[drop.boss] || 0) + drop.n;
  else if (drop.t === 'shard') p.shards[drop.k] = (p.shards[drop.k] || 0) + drop.n;
  else if (WALLET[drop.t]) p[WALLET[drop.t]] = (p[WALLET[drop.t]] || 0) + drop.n;
  if (drop.t === 'san' && drop.n > 0) p.sanTop = Math.max(p.sanTop || 0, (p.san || 0) - drop.n) + drop.n; // rütbe (rutbe.js) ömür boyu Şan'dan
  const same = loot.find(l => l.t === drop.t && l.g === drop.g && l.boss === drop.boss && l.k === drop.k);
  if (same) same.n += drop.n; else loot.push({ ...drop });
}
export const grantAll = (p, drops, opt) => { const loot = []; for (const d of drops) grant(p, loot, d, opt); return loot; };

// Günlük görev sayaçları (gün değişince state.ensureDay sıfırlar)
export function bump(p, key, n = 1) { p.daily.q[key] = (p.daily.q[key] || 0) + n; count(p, key, n); }
// Haftalık görev sayacı (hafta değişince p.weekly ile sıfırlanır) ve başarımların kalıcı sayacı (p.ach.c)
export function count(p, key, n = 1) {
  const w = p.weekly.q || (p.weekly.q = {}), a = p.ach || (p.ach = {}), c = a.c || (a.c = {});
  w[key] = (w[key] || 0) + n; c[key] = (c[key] || 0) + n;
  if (p.monthly) { const m = p.monthly.q || (p.monthly.q = {}); m[key] = (m[key] || 0) + n; } // aylık görev sayacı
}
export const used = (p, key) => p.daily[key] || 0;
export function useDaily(p, key, max, msg) { if (used(p, key) >= max) fail('daily-limit', msg || 'Bugünkü hakkın bitti.'); p.daily[key] = used(p, key) + 1; }
