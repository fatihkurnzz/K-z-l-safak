// Mana (MP) ve savaş iksirleri (sürüm 12). Saf tablolar ve hesaplar: sunucu, savaş motoru ve arayüz aynı sayıları okur.
//
// MANA: kahramanın mana havuzu sınıfa göre (büyücü ve rahip daha geniş), seviyeyle (mpScale) ve Zekâ puanıyla büyür. Her kendi
//   turunun başında havuzun regen kadarı yenilenir. Yeteneklerin bedeli (skills.js mpBase) de aynı ölçekle büyür; böylece
//   bedel/havuz oranı her seviyede aynı kalır. Temel saldırı bedelsizdir: mana bitince karakter temel saldırıyla dövüşür.
// POT: Can ve Mana iksiri. Tüccar'dan akçeyle alınır (npc.js), çantada yer kaplamaz (p.pots sayaç; takas edilemez, satılamaz).
//   Savaşta serbest hamledir: içmek turu bitirmez (aynı turda yetenek de kullanılır). Kötüye kullanmaya karşı: savaş başına
//   her türden en çok POT.cap, aynı türü içtikten sonra POT.cd kendi turu bekleme. Yalnızca oyuncunun yaratıklara karşı
//   savaşlarında (PvE ve etkinlik); Meydan, Canlı Meydan, Sancak Savaşı, Kuşatma ve seri savaşta iksir yoktur.
//   Kullanılan iksir savaş sonunda sunucunun tekrar oynatmasından sayılır ve sayaçtan düşülür (game.js battle.finish).
export const MANA = {
  warrior: { base: 50, int: 2, regen: 0.10 },
  rogue:   { base: 55, int: 2, regen: 0.10 },
  priest:  { base: 85, int: 3, regen: 0.13 },
  mage:    { base: 95, int: 3, regen: 0.12 },
  grow: 0.045, // seviye başına ölçek artışı
};
export const mpScale = L => 1 + MANA.grow * (Math.max(1, L || 1) - 1);
export const maxMpOf = (cls, L, int = 0) => { const M = MANA[cls] || MANA.warrior; return Math.round(M.base * mpScale(L) + (int || 0) * M.int); };
export const mpRegenOf = (cls, maxMp) => Math.max(1, Math.round(maxMp * (MANA[cls] || MANA.warrior).regen));
export const mpCost = (base, L) => (base > 0 ? Math.max(1, Math.round(base * mpScale(L))) : 0);

// pct: azami can/mananın yenilenen payı · cap: savaş başına en çok · cd: içtikten sonra beklenen kendi turu · max: taşınabilen
export const POT = {
  hp: { name: 'Can İksiri', pct: 0.3, icon: 'potHp' },
  mp: { name: 'Mana İksiri', pct: 0.4, icon: 'potMp' },
  cap: 2, cd: 3, max: 99,
  start: { hp: 5, mp: 5 }, // yeni karakterin başlangıç çantası (eski kayda da bir kez verilir)
};
export const POT_KEYS = ['hp', 'mp'];
// Tüccar fiyatı (akçe): seviyeyle büyür; bir iksir, o seviyedeki bir stage'in akçesinin kabaca beşte biri
export const potPrice = (k, L) => Math.max(10, Math.round((10 + 3 * L + 0.18 * L * L) * (k === 'mp' ? 0.9 : 1) / 5) * 5);
export const potsOf = p => ({ hp: Math.max(0, p?.pots?.hp | 0), mp: Math.max(0, p?.pots?.mp | 0) });
