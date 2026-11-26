// Ortak baskın "Taş Yemini" (20 Kas, kullanıcı): haftada bir, iki halktan kahramanların aynı grupta girdiği tek baskın.
// Grup: oyuncunun kahramanı + öteki halktan iki, kendi halkından bir yoldaş (şimdilik yapay zekâ; eşleştirme gelince gerçek
// oyuncu). Girişte iki el taşa basılır (istemcide kısa tören, ui-yemin.js). Düşman Küllerin Tarikatı; son dalgada "Yemin Bozan".
// Ödül: iki halkın malzemesini birleştiren "Taş Yemini" çerçevesi (ilk zaferde; rankper.js çerçeve listesine `ty` olarak eklenir)
// ve haftalık akçe + taş. Hak haftada bir ZAFERdir; kaybeden aynı hafta yeniden dener.
import { MOBS, mobUnit } from './zones.js';
import { GAME } from './content.js';
import { pickFrom } from './rng.js';

export const YEMIN = {
  unlock: 30,
  waves: 3,
  allies: { other: 2, own: 1 },  // öteki halktan / kendi halkından yoldaş sayısı
  allyQ: 0.55,                   // yoldaşların donanım niteliği (bots.js)
  bossHp: 2.4, bossAtk: 1.0,     // Yemin Bozan: aile bossu (Adsız, Tarikat Lideri) gövdesi, 4 kişilik gruba göre can
  akce: [3000, 120],             // zafer akçesi: taban + seviye × artış
  stone: 4,
  frame: 'ty',                   // ilk zaferin kaplaması (çerçeve kimliği)
};
const CULT = () => Object.entries(MOBS).filter(([, m]) => m.cult && !m.boss && !m.event).map(([id]) => id);
const sc = (u, hp, atk) => ({ ...u, maxHp: Math.round(u.maxHp * hp), atk: Math.round(u.atk * atk), mag: Math.round(u.mag * atk) });
export const yeminLevel = p => Math.max(YEMIN.unlock, Math.min(GAME.maxLevel, p.lvl));
// Tarikat yaratıkları 4. bölgenin çarpanlarını taşır; düşük seviyede grup ezilmesin diye Sv.30'da can ×0,6 / saldırı ×0,66,
// Sv.60'ta ×1 (test: 8 uzmanlık × 3, Sv.30–65)
export const yeminK = lvl => { const k = Math.max(0, Math.min(1, (lvl - 30) / 30)); return { hp: 0.6 + 0.4 * k, atk: 0.66 + 0.34 * k }; };
export function yeminWaves(rand, lvl) {
  const pool = CULT(), K = yeminK(lvl), m = (r = 'n') => sc(mobUnit(pickFrom(rand, pool), lvl, r), K.hp, K.atk);
  const boss = { ...sc(mobUnit('bozdag', lvl), YEMIN.bossHp * K.hp, YEMIN.bossAtk * K.atk), name: 'Yemin Bozan', cult: true };
  return [[m('e'), m(), m(), m()], [m('e'), m('e'), m(), m()], [m('e'), boss, m('e')]];
}
export const yeminDone = (p, wk) => p.yemin?.w === wk;
export const yeminRewards = lvl => [{ t: 'akce', n: YEMIN.akce[0] + YEMIN.akce[1] * lvl }, { t: 'stone', n: YEMIN.stone }];
