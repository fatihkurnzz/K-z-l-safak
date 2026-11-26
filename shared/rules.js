// Arayüzün oyuncuya SAYIYLA söylediği mod kuralları (ödül, bedel, puan, oran). Tek kaynak burasıdır: sunucu kuralları
// (modes.js, daily.js, drops.js, battle.js) ve arayüz metinleri (public/js/ui-*.js) aynı tabloyu okur; böylece ekranda
// yazan sayı ile sunucunun hesabı ayrışamaz (server/test/rapor.test.js bunu iki taraf için de sınar).
// Gizli tablo içermez; istemciye sunulur.
export const RULES = {
  gift:  { akce: lvl => 200 + 30 * lvl, energy: 20, yakut: 5 },            // günlük giriş ödülü
  well:  { waves: 10, stonePerWave: 1, daily: 2 },                         // Dipsiz Kuyu (daily: günlük hak)
  depth: { floors: 60, energy: 8, bossEvery: 5, bossYakut: 5 },            // Yeraltı Ocağı (aylık tırmanış; kat ödülleri ve kor katları pvp.js: CLIMB, climbRewards)
  rift:  { waves: 3, shards: [3, 5], daily: 3 },                           // Gök Yarığı: zaferde parça sayısı (en az, en çok)
  seal:  { unique: 3 },                                                    // Mühürlü Oda: boss'un eşsiz düşürme çarpanı
  arena: { san: [30, 8], firstWinYakut: 5 },                               // Meydan: şan (zafer, yenilgi)
  live:  { san: [45, 12], timer: 15 },                                     // Canlı Meydan: şan, hamle süresi (sn)
  akin:  { waves: 12, turnCap: 130, perKill: 10, win: 200, stoneAt: 300, emberAt: 500 },
  siege: { waves: 4, perWave: 250, win: 500 },                             // Hisar Kuşatması puanı
  weak:  25,                                                               // zayıf olduğu elementten alınan ek hasar (%)
};
