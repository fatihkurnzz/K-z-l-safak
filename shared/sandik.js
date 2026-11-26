// Çevrimdışı ödül sandığı: oyuncu yokken dolar, 12 saatte tamamen dolar (daha fazla birikmez). Eylem: ofc.claim
import { fail, grantAll } from './util.js';
import { addXp } from './modes.js';
import { mobXp, mobAkce } from './zones.js';
import { UNLOCK } from './content.js';

export const SANDIK = { hours: 12, min: 0.05, ticks: 40 }; // dolum süresi (sa), en az alınabilir oran, tam sandık = 40 sıradan yaratık kazancı
const HOUR = 3600000;

// Son boşaltma zamanı: p.ofc → yoksa hesap açılışı → yoksa şimdi (eski kayıt çökmesin)
export const sandikAt = (p, now) => Number.isFinite(p.ofc) ? p.ofc : Number.isFinite(p.createdAt) ? p.createdAt : now;
export const sandikRatio = (p, now) => Math.max(0, Math.min(1, (now - sandikAt(p, now)) / (SANDIK.hours * HOUR)));
export const sandikLeft = (p, now) => Math.max(0, SANDIK.hours * HOUR - (now - sandikAt(p, now)));

// Verilen orandaki ödül: seviyene göre akçe + tecrübe, az taş ve cevher/toz
export function sandikReward(p, ratio) {
  const lvl = Math.max(1, p.lvl || 1), r = Math.max(0, Math.min(1, ratio));
  const akce = Math.round(mobAkce(lvl, 'n') * SANDIK.ticks * r), xp = Math.round(mobXp(lvl, 'n') * SANDIK.ticks * r);
  const stone = Math.floor(3 * r), dust = Math.round((4 + lvl / 2) * r), ore = lvl >= UNLOCK.mine ? Math.round((6 + lvl / 3) * r) : 0;
  return { akce, xp, give: [{ t: 'akce', n: akce }, ...(stone ? [{ t: 'stone', g: 0, n: stone }] : []), ...(dust ? [{ t: 'dust', n: dust }] : []), ...(ore ? [{ t: 'ore', n: ore }] : [])].filter(d => d.n > 0) };
}

export const SANDIK_WORLD = {
  async 'ofc.claim'(ctx, p) {
    const now = ctx.now, r = sandikRatio(p, now);
    if (r < SANDIK.min) fail('not-ready', 'Sandık henüz dolmadı.');
    const R = sandikReward(p, r), out = {};
    const loot = grantAll(p, R.give, { nt: 1 });
    if (R.xp > 0) addXp(p, R.xp, out);
    p.ofc = now;
    return { loot, xp: R.xp, ratio: r, ...(out.levels ? { levels: out.levels } : {}) };
  },
};
