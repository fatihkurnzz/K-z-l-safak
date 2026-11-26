// Hem kuralların hem arayüzün kullandığı saf hesaplar (birikim, görev ilerlemesi, kilitler).
// Gizli tablo içermez; istemciye sunulur.
import { MINE, IDLE, UNLOCK, factionBonus, withPct } from './content.js';
import { hqPct } from './clan.js';
import { stageDef, stageId, mobXp, mobAkce, STAGES_PER_ZONE } from './zones.js';
import { perks } from './state.js';
import { WEATHER, weatherHours } from './realm.js';
import { starsOf, tierKey, farmActive } from './pvp.js';
import { ZONES } from './zones.js';

const HOUR = 3600000;
// tier: zorluk kademesi (pvp.js). Üst kademenin ilk aşaması, önceki kademenin son boss'u geçilince açılır.
export const stageOpen = (p, id, tier = 0) => {
  const [z, n] = id.split('-').map(Number), st = starsOf(p, tier);
  if (n > 1) return !!st[stageId(z, n - 1)];
  if (z > 1) return !!st[stageId(z - 1, STAGES_PER_ZONE)];
  return !tier || !!starsOf(p, tier - 1)[stageId(ZONES.length, STAGES_PER_ZONE)];
};
export const tierOpen = (p, tier) => stageOpen(p, stageId(1, 1), tier);
export const bossAvailable = (p, id, tier = 0) => !starsOf(p, tier)[id] || !p.daily.boss[tierKey(id, tier)];
// Madenin saatlik üretimi: seviye × premium çarpanı × taraf bonusu (sunucu ve arayüz aynı sayıyı kullanır)
export const mineRate = (p, now, lvl = p.mine.lvl) => withPct(MINE.perHour(lvl), factionBonus(p.faction).mine + hqPct(p, 'ambar')) * perks(p, now).mine;
// Yağmurlu saatlerde biriken cevher WEATHER.rain.minePct kadar fazla, poyrazlı saatlerde WEATHER.wind.minePct kadar eksiktir (hava takvimi realm.js'te; herkes için aynıdır)
export const mineStock = (p, now) => { const h = Math.min(MINE.capHours, (now - p.mine.at) / HOUR); return Math.floor(mineRate(p, now) * (h + (weatherHours('rain', p.mine.at, p.mine.at + h * HOUR) * WEATHER.rain.minePct + weatherHours('wind', p.mine.at, p.mine.at + h * HOUR) * WEATHER.wind.minePct) / 100)); };
// Çırak: 3 yıldızla geçilmiş en ileri yaratık aşamasının kazancının bir kısmını üretir (eşya üretmez)
export function idleStage(p) {
  let best = null;
  for (const id in p.stages) if (p.stages[id] === 3) { const d = stageDef(id); if (d && d.kind === 'mob' && (!best || d.zone * 100 + d.n > best.zone * 100 + best.n)) best = d; }
  return best;
}
export function idleStock(p, now) {
  return null; // Çırak oyundan kaldırıldı: birikim yok (bildirim, rozet ve görev sayacı da kendiliğinden susar)
  const d = idleStage(p);
  if (!d || p.lvl < UNLOCK.idle) return null;
  const cap = perks(p, now).idleHours * HOUR / IDLE.tickMs;
  const ticks = farmActive(p) ? 0 : Math.min(cap, Math.floor((now - p.idle.at) / IDLE.tickMs)); // Nöbet sürerken olağan birikim durur (pvp.js)
  let xp = 0, akce = 0;
  for (const u of d.waves.flat()) { xp += mobXp(u.lvl, u.rank); akce += mobAkce(u.lvl, u.rank); }
  return { stage: d.id, ticks, cap, xp: Math.round(xp * IDLE.share * ticks), akce: Math.round(akce * IDLE.share * ticks) };
}
// Pazar satış vergisi oranı: satıcının tarafına göre (taraf bonusu)
export const marketTax = faction => factionBonus(faction).marketTax;
export const questProgress = (p, q) => Math.min(q.need, p.daily.q[q.key] || 0);
// Yıldız: 1 geçti · 2 kayıpsız · 3 kayıpsız ve tur sınırı içinde
export const parTurns = def => def.kind === 'boss' ? 100 : def.kind === 'gate' ? 85 : 70;
