// Ödüllü reklam yerleri: günlük sınırlar, izlemeler arası bekleme ve ödüller. Kural tarafıdır; reklamın kendisi
// istemcide oynar (ui-reklam.js). 'ad.claim' izleme bitince çağrılır: sayaç gün anahtarıyla (p.daily) tutulur, iki izleme
// arası AD.gapMs beklenir (p.adAt). Üst premium kademe (Gümüş ve Platin) reklamsız alır: bekleme ve izleme atlanır.
// TODO(sunucu doğrulaması): gerçek reklam SDK'sında ödül, reklam ağının sunucu tarafı doğrulamasıyla (SSV) bağlanmalı;
// şimdiki istemci bildirimi yalnızca günlük sınır ve bekleme ile korunur.
import { ENERGY, UNLOCK } from './content.js';
import { fail, grantAll, used } from './util.js';
import { premTier } from './state.js';

// on: ödüllü reklamlar şimdilik kapalı (sürüm 13). Kapalıyken arayüz hiçbir reklam düğmesi göstermez, ad.claim reddedilir.
export const AD = { on: false, gapMs: 30000, adFreeTier: 2 };
// max: günlük izleme hakkı · key: p.daily sayacı. Ödül metinleri arayüzde gösterilir (rewardOf: aynı tablo)
export const AD_SPOTS = {
  sandik: { name: 'Günlük Sandık', max: 5, icon: 'chest', desc: 'Her izlemede daha dolu bir sandık: akçe, bileği taşı, son sandıkta yakut.' },
  enerji: { name: 'Enerji Doldur', max: 3, icon: 'energy', desc: `Enerjin ${ENERGY.max}'e tamamlanır.` },
  cark:   { name: 'Ücretsiz Çark', max: 1, icon: 'wheel', desc: 'Kader Çarkı\'nda parçasız bir çevirme hakkı.', unlock: 'wheel' },
  maden:  { name: 'Maden Hızlandır', max: 2, icon: 'mine', desc: 'Madende birikimi 1 saat ileri alır.', unlock: 'mine' },
  savas:  { name: 'Savaş Ödülü ×2', max: 3, icon: 'battle', desc: 'Son kazanılan savaşın akçesi bir kez daha verilir.' },
};
export const AD_KEYS = Object.keys(AD_SPOTS);
export const adUsed = (p, spot) => used(p, 'ad_' + spot);
export const adLeft = (p, spot) => Math.max(0, AD_SPOTS[spot].max - adUsed(p, spot));
export const adWait = (p, now) => Math.max(0, (p.adAt || 0) + AD.gapMs - now);
export const adFree = (p, now) => premTier(p, now) >= AD.adFreeTier;
// i. izlemenin sandığı (0'dan): akçe seviyeyle büyür
export const chestOf = (p, i) => {
  const mul = [1, 1.5, 2, 2.5, 3.5][Math.min(4, i)], out = [{ t: 'akce', n: Math.round((200 + 30 * p.lvl) * mul) }];
  if (i === 2) out.push({ t: 'stone', g: 0, n: 3 });
  if (i >= 4) out.push({ t: 'stone', g: 1, n: 2 }, { t: 'yakut', n: 5 });
  return out;
};

export const AD_HANDLERS = {
  'ad.claim'(p, { spot, battle }, env) {
    if (!AD.on) fail('ads-off', 'Reklam ödülleri şu an kapalı.');
    const S = typeof spot === 'string' && Object.hasOwn(AD_SPOTS, spot) ? AD_SPOTS[spot] : fail('bad-spot', 'Böyle bir ödül yok.');
    if (S.unlock && p.lvl < UNLOCK[S.unlock]) fail('locked', `${UNLOCK[S.unlock]}. seviyede açılır.`);
    const n = adUsed(p, spot);
    if (n >= S.max) fail('daily-limit', 'Bugünkü hakkın bitti.');
    const free = adFree(p, env.now);
    if (!free && adWait(p, env.now) > 0) fail('ad-wait', `Bir sonraki reklam için ${Math.ceil(adWait(p, env.now) / 1000)} sn bekle.`);
    let out;
    // Ödül koşulları önce denetlenir; bir koşul tutmazsa hak ve bekleme tüketilmez (fail yazmayı iptal eder)
    if (spot === 'sandik') out = { loot: grantAll(p, chestOf(p, n), { nt: 1 }) };
    else if (spot === 'enerji') {
      if (p.energy >= ENERGY.max) fail('energy-full', 'Enerjin zaten dolu.');
      p.energy = ENERGY.max; p.energyAt = env.now; out = { energy: ENERGY.max };
    } else if (spot === 'cark') { p.daily.adSpin = (p.daily.adSpin || 0) + 1; out = { spin: p.daily.adSpin }; }
    else if (spot === 'maden') { p.mine.at -= 3600000; out = { hours: 1 }; }
    else {
      const f = p.fin;
      if (!f || f.id !== battle || !f.r || !f.r.win || !(f.r.akce > 0)) fail('no-battle', 'Ödülü ikiye katlanacak bir zafer yok.');
      if (f.dbl) fail('claimed', 'Bu savaşın ödülü zaten ikiye katlandı.');
      f.dbl = 1; out = { loot: grantAll(p, [{ t: 'akce', n: f.r.akce }], { nt: 1 }) };
    }
    p.daily['ad_' + spot] = n + 1; p.adAt = env.now;
    return { spot, left: S.max - n - 1, ...out };
  },
};
