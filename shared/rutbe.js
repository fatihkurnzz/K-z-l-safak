// Şan rütbeleri: ömür boyu kazanılan Şan'a göre (harcamak rütbeyi düşürmez). Adın yanında nişan olarak görünür.
// Kayıtta p.sanTop (util.js grant) tutulur; eski kayıtta o yoksa eldeki Şan sayılır.
export const RANKS = [
  { name: 'Er',         san: 0 },
  { name: 'Onbaşı',     san: 300 },
  { name: 'Çavuş',      san: 1000 },
  { name: 'Yüzbaşı',    san: 3000 },
  { name: 'Binbaşı',    san: 7000 },
  { name: 'Alp',        san: 14000 },
  { name: 'Bey',        san: 25000 },
  { name: 'Beylerbeyi', san: 45000 },
  { name: 'Han',        san: 80000 },
];
export const sanTotal = p => Math.max(p?.sanTop || 0, p?.san || 0);
export const rankIdx = p => RANKS.findLastIndex(r => sanTotal(p) >= r.san);
export const rankName = i => RANKS[Math.max(0, Math.min(RANKS.length - 1, i | 0))].name;
// Bir sonraki rütbe için gereken Şan (en üsttekinde null)
export const nextRank = p => { const i = rankIdx(p); return i < RANKS.length - 1 ? { i: i + 1, need: RANKS[i + 1].san - sanTotal(p) } : null; };
// Yapay oyuncu: seviyesinden türeyen rütbe
export const botRank = lvl => Math.max(0, Math.min(RANKS.length - 1, Math.floor(((lvl | 0) - 5) / 9)));
