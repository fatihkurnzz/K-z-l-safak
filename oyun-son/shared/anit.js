// Anıt Savaşı (19 Kas, kullanıcı: sınır savunma savaşı uyarlaması; özgün ad ve kurgu): iki ırkın birer partisi karşı karşıya,
// sahanın sağında iki tarafın da vurabildiği Sınır Anıtı. Kurallar savaş motorunda (battle.js bdw):
//  · Raunt = sahadaki her canlı kahramanın bir hamlesi. Ölen kahraman `respawn` raunt sonra tam canla döner.
//  · Rakip kahraman öldürmek 1 puan. Anıt her `regenEvery` rauntta azami canının %1'ini yeniler.
//  · Anıt kesilirse anıta verilen toplam hasarın en az %50,1'ini vermiş taraf kazanır.
//  · Kesilmezse `rounds` raunt sonunda puanı çok olan, puan eşitse anıta çok hasar veren kazanır (hepsi eşitse savunan taraf).
// Bu sürümde iki parti de (oyuncunun kahramanı dışında) yapay zekâyla oynar; giriş Kristal Nöbeti'nin NPC'sinden (Şaman Yashka).
export const ANIT = {
  name: 'Anıt Savaşı', mon: 'Sınır Anıtı',
  minLevel: 20,                                          // seviye kuşakları (eşleşme seviyesi oyuncunun seviyesi)
  // kullanıcı 19 Kas: beş kuşak; k = kuşağın anıt canı çarpanı (benzetimde anıt savaşların yaklaşık yarısında kesilsin)
  brackets: [{ min: 20, max: 29, k: 0.55 }, { min: 30, max: 39, k: 0.8 }, { min: 40, max: 49, k: 1 }, { min: 50, max: 59, k: 1 }, { min: 60, max: 65, k: 0.88 }],
  side: 4,                                               // parti büyüklüğü (oyuncu + 3 yoldaş, karşıda 4)
  rounds: 20, respawn: 5, regenEvery: 5, regenPct: 0.01, monPick: 0.3,
  monHp: 8,                                              // 21 Kas (kullanıcı): 30 → 20 raunt, can 12 → 8 (kesilme oranı aynı kalsın). Anıtın canı: sahadaki kahramanların ortalama vuruş gücü × kahraman sayısı × monHp
  daily: 5,
  reward: { win: { akcePer: 60, san: 40 }, lose: { akcePer: 20, san: 10 }, perKill: 2 }, // akçe = seviye × akcePer; öldürme başına +şan
};
export const bracketOf = lvl => ANIT.brackets.find(b => lvl >= b.min && lvl <= b.max) || null;
// Anıt birimi (savaşta 'N' tarafı; sıra almaz, saldırmaz). Can ve savunma sahadaki kahramanlara göre ölçeklenir.
// Anıtın canı kuşağın çarpanıyla (k) ölçeklenir: kuşaklar arasında vuruş/savunma oranı farklı, kesilme oranı yakın kalsın.
export function monUnit(lvl, heroes) {
  const n = Math.max(1, heroes.length), pow = heroes.reduce((a, u) => a + Math.max(u.atk || 0, u.mag || 0), 0) / n, def = heroes.reduce((a, u) => a + u.def, 0) / n;
  return { key: 'anit', mob: null, name: ANIT.mon, lvl, maxHp: Math.round(pow * n * ANIT.monHp * (bracketOf(lvl)?.k ?? 1)), atk: 0, mag: 0, def: Math.round(def * 0.3), spd: 0, crit: 0, critDmg: 1, ccRes: 1, mods: {}, res: {}, wt: 'none', look: { kind: 'monument', scale: 1.15 } };
}
