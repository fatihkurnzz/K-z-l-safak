// Ustalık: 60. seviyeden sonraki uzun vadeli güçlenme yolu.
// 60. seviyeye ulaşınca kazanılan her deneyim aynı zamanda ustalık deneyimi olarak da birikir (parti geneli: p.mastery).
// Her ustalık seviyesi, partideki her kahramana 1 ustalık puanı verir; her kahraman puanını kendi ağacına dağıtır (h.mst).
// Düğümler stat yüzdesi (Saldırı, Büyü, Can, Savunma) ya da düz değer (Hız, Kritik) verir. Etki hero.js heroStats'ta uygulanır.
export const MASTERY = {
  unlock: 60,          // açıldığı seviye
  maxLvl: 60,          // en yüksek ustalık seviyesi (6 düğüm × 10 kademe = 60 puan)
  need: lvl => 4000 + 600 * lvl, // bir sonraki ustalık seviyesi için gereken deneyim
  resetCost: 2000,     // bir kahramanın puanlarını geri almanın akçe bedeli (ustalık seviyesi başına)
  nodes: {
    atk: { name: 'Silah Ustalığı', icon: 'atk', per: 0.012, pct: true, max: 10, note: 'Saldırı' },
    mag: { name: 'Büyü Ustalığı', icon: 'mag', per: 0.012, pct: true, max: 10, note: 'Büyü' },
    hp: { name: 'Dayanıklılık', icon: 'hp', per: 0.015, pct: true, max: 10, note: 'Can' },
    def: { name: 'Zırh Ustalığı', icon: 'def', per: 0.012, pct: true, max: 10, note: 'Savunma' },
    spd: { name: 'Çeviklik', icon: 'spd', per: 1, pct: false, max: 10, note: 'Hız' },
    crit: { name: 'Keskin Göz', icon: 'crit', per: 0.004, pct: false, max: 10, note: 'Kritik' },
  },
};
export const MASTERY_KEYS = Object.keys(MASTERY.nodes);
// Partinin ustalık kaydı (yoksa sıfırdan)
export const masteryOf = p => (p.mastery && typeof p.mastery === 'object' ? p.mastery : { lvl: 0, xp: 0 });
export const masteryOpen = p => p.lvl >= MASTERY.unlock;
// Kahramanın düğümlere dağıttığı puanlar ve kalan puanı
export const heroMastery = h => (h && h.mst && typeof h.mst === 'object' ? h.mst : {});
export const masterySpent = h => MASTERY_KEYS.reduce((a, k) => a + (heroMastery(h)[k] || 0), 0);
export const masteryFree = (p, h) => Math.max(0, masteryOf(p).lvl - masterySpent(h));
// Deneyim ekle (modes.js addXp çağırır): kazanılan ustalık seviyesi sayısını döndürür
export function addMasteryXp(p, xp) {
  if (!masteryOpen(p) || !(xp > 0)) return 0;
  const M = p.mastery = masteryOf(p);
  M.xp += xp; let n = 0;
  while (M.lvl < MASTERY.maxLvl && M.xp >= MASTERY.need(M.lvl)) { M.xp -= MASTERY.need(M.lvl); M.lvl++; n++; }
  if (M.lvl >= MASTERY.maxLvl) M.xp = Math.min(M.xp, MASTERY.need(M.lvl));
  return n;
}
// heroStats için çarpanlar ve düz eklemeler
export function masteryMods(h) {
  const r = heroMastery(h), N = MASTERY.nodes, pc = k => 1 + (r[k] || 0) * N[k].per;
  return { atk: pc('atk'), mag: pc('mag'), hp: pc('hp'), def: pc('def'), spd: (r.spd || 0) * N.spd.per, crit: (r.crit || 0) * N.crit.per };
}
// Düğümün o kademedeki toplam etkisinin metni
export const nodeText = (k, rank) => { const N = MASTERY.nodes[k], v = rank * N.per; return N.pct ? `+%${(v * 100).toFixed(1).replace('.0', '')} ${N.note}` : k === 'crit' ? `+%${(v * 100).toFixed(1).replace('.0', '')} ${N.note}` : `+${v} ${N.note}`; };
