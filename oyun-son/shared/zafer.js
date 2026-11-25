// Zafer Anıtı: son halk savaşının sonucu ve günlük ödül (P28; şartname TALIMAT.md §5.1–5.2).
// Kayıt: p.zafer = { claimDay: ödülün alındığı gün anahtarı (0 = hiç), buffUntil: Zafer buff'ının bitişi (ms) }.
// Savaş sonucu: Büyük Sefer'in (world.js warStandings) geçen haftaki gerçek belgesi ('war' koleksiyonu, hafta anahtarı) puan
// taşıyorsa ondan; yoksa DEFAULT_WAR. Zafer buff'ı (+%5 EXP / +%5 Akçe) yalnız PvE savaş kazancına işler (han.js p28Bonus).
import { fail } from './util.js';
import { dayKey, weekKey, ENERGY } from './content.js';

const HOUR = 3600000, DAY = 24 * HOUR;
/** Ödül tablosu: kazanan halk (Zafer Lütufu) ve kaybeden halk (İntikam Yemini). Yüzdeler yüzde biriminde. */
export const ZAFER = {
  win: { name: 'Zafer Lütufu', akce: 1200, energy: 25, buffHours: 24, xpPct: 5, akcePct: 5 },
  lose: { name: 'İntikam Yemini', akce: 500, energy: 15 },
};
/** Sunucu verisi yokken gösterilen son savaş (şartnamedeki örnek; elentha → sancak, kragmir → ocak). */
export const DEFAULT_WAR = {
  source: 'default', winnerFaction: 'sancak', scores: { sancak: 14820, ocak: 13940 }, elenthaScore: 14820, kragmirScore: 13940, warDate: '2026-11-24',
  mvps: [
    { name: 'Kaelen', faction: 'sancak', level: 48, points: 2410 },
    { name: 'Vorgath', faction: 'ocak', level: 47, points: 2190 },
    { name: 'Lyra', faction: 'sancak', level: 46, points: 1985 },
  ],
};
/** Kaydı kurar/onarır. */
export function zaferOf(p) {
  const Z = p.zafer && typeof p.zafer === 'object' ? p.zafer : (p.zafer = { claimDay: 0, buffUntil: 0 });
  if (!Number.isFinite(Z.claimDay)) Z.claimDay = 0;
  if (!Number.isFinite(Z.buffUntil)) Z.buffUntil = 0;
  return Z;
}
/** Zafer buff'ı etkin mi (PvE kazanç çarpanı). */
export const zaferBuffActive = (p, now) => (p?.zafer?.buffUntil || 0) > now;
const ymd = ms => new Date(ms + 3 * HOUR).toISOString().slice(0, 10); // UTC+3 takvim günü
/** Son halk savaşı: geçen haftanın Büyük Sefer belgesi puan taşıyorsa ondan (mvps boş), yoksa DEFAULT_WAR. store: get(coll, id). */
export async function lastWar(store, now) {
  const w = weekKey(now) - 1, r = store && now !== undefined ? await store.get('war', String(w)) : null;
  const o = r?.doc?.ocak || 0, s = r?.doc?.sancak || 0;
  if (o + s <= 0) return DEFAULT_WAR;
  const end = (w * 7 + 4) * DAY - 3 * HOUR - 1; // o haftanın pazar 23:59'u (UTC+3; realm.js weekStartAt ile aynı takvim)
  return { source: 'sefer', winnerFaction: o === s ? null : o > s ? 'ocak' : 'sancak', scores: { sancak: s, ocak: o }, elenthaScore: s, kragmirScore: o, warDate: ymd(end), mvps: [] };
}
/** Bir sonraki 00:00'a (UTC+3) kalan süre (ms). */
export const msToReset = now => (dayKey(now) + 1) * DAY - 3 * HOUR - now;
/** Anıt ekranının durumu: { war, won, claimedToday, msToReset, buffActive, buffUntil }. */
export async function zaferState(p, store, now) {
  const war = await lastWar(store, now), Z = zaferOf(p);
  return { war, won: !!war.winnerFaction && war.winnerFaction === p.faction, claimedToday: Z.claimDay === dayKey(now), msToReset: msToReset(now), buffActive: Z.buffUntil > now, buffUntil: Z.buffUntil };
}

/** Anıt eylemleri (WORLD tablosu; ctx.store gerekir). */
export const ZAFER_WORLD = {
  async 'zafer.view'(ctx, p) { return { zafer: await zaferState(p, ctx.store, ctx.now) }; },
  // Günlük ödül: günde 1 kez (sunucu günü, 00:00 UTC+3). Kazanan: Akçe + Enerji + 24 saat buff; kaybeden: Akçe + Enerji.
  // Enerji, öbür ödüllerdeki gibi (util.js grant) azami enerjiyle sınırlanmaz.
  async 'zafer.claim'(ctx, p) {
    const Z = zaferOf(p), d = dayKey(ctx.now);
    if (Z.claimDay === d) fail('daily-limit', 'Bugünkü ödülü zaten aldın.');
    const war = await lastWar(ctx.store, ctx.now), won = !!war.winnerFaction && war.winnerFaction === p.faction, R = won ? ZAFER.win : ZAFER.lose;
    Z.claimDay = d;
    if (p.energy >= ENERGY.max) p.energyAt = ctx.now;
    p.akce += R.akce; p.energy += R.energy;
    if (won) Z.buffUntil = ctx.now + R.buffHours * HOUR;
    return { won, name: R.name, akce: R.akce, energy: R.energy, buffUntil: Z.buffUntil, zafer: await zaferState(p, ctx.store, ctx.now) };
  },
};
export const ZAFER_READ_ONLY = ['zafer.view'];
