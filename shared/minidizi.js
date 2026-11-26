// Mini Dizi: oyunun hikâyesini anlatan 10 bölüm. Her bölüm izlenince küçük bir ödül, bölüm başına bir kez. Eylem: series.watch {ep}
// Not: "yeterince izlendi" denetimi (videonun %80'i, video yoksa 10 sn) yalnızca istemcide (ui-minidizi.js) yapılır; sunucu bölüm sırasını ve tek seferlik ödülü zorlar.
import { fail, grantAll } from './util.js';
import { addXp } from './modes.js';
import { mobXp, mobAkce } from './zones.js';

export const SERIES_MIN_SEC = 10; // video dosyası yoksa yer tutucuda beklenen süre
export const SERIES_RATIO = 0.8;  // videonun en az bu kadarı oynatılmış olmalı
export const SERIES = Array.from({ length: 10 }, (_, i) => ({ ep: i + 1, ad: `Bölüm ${i + 1}`, video: `video/bolum-${String(i + 1).padStart(2, '0')}.mp4` }));

// Ödül: seviyene göre akçe + tecrübe; 5. ve 10. bölümde 1 taş. Bölüm ilerledikçe biraz artar.
export function seriesReward(p, ep) {
  const lvl = Math.max(1, p.lvl || 1), k = 5 + ep * 2;
  const akce = Math.round(mobAkce(lvl, 'n') * k), xp = Math.round(mobXp(lvl, 'n') * k);
  return { akce, xp, give: [{ t: 'akce', n: akce }, ...(ep % 5 === 0 ? [{ t: 'stone', g: 0, n: 1 }] : [])].filter(d => d.n > 0) };
}
export const seriesWatched = (p, ep) => !!(p.series && p.series.w && p.series.w[ep]);
export const seriesOpen = (p, ep) => ep === 1 || seriesWatched(p, ep - 1);
export const seriesNewCount = p => SERIES.filter(e => !seriesWatched(p, e.ep) && seriesOpen(p, e.ep)).length;

export const SERIES_WORLD = {
  async 'series.watch'(ctx, p, a) {
    const ep = a && a.ep | 0;
    if (!SERIES.some(e => e.ep === ep)) fail('bad-ep', 'Böyle bir bölüm yok.');
    const s = p.series || (p.series = { w: {} }); s.w = s.w || {};
    if (s.w[ep]) fail('done', 'Bu bölümün ödülünü aldın.');
    if (!seriesOpen(p, ep)) fail('locked', 'Önce önceki bölümü izle.');
    const R = seriesReward(p, ep), out = {};
    const loot = grantAll(p, R.give);
    if (R.xp > 0) addXp(p, R.xp, out);
    s.w[ep] = 1;
    return { ep, loot, xp: R.xp, ...(out.levels ? { levels: out.levels } : {}) };
  },
};
