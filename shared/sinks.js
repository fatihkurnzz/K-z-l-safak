// Akçe giderleri (paket "rapor"). Ekonomi modeli (tools/economy.js, docs/ekonomi.md) akçenin tek büyük gider kapısının
// örs olduğunu gösterdi: basmayı bırakan oyuncuda akçe birikiyor. Buradaki kapılar cezalandırmaz; isteğe bağlıdır ya da
// yalnızca büyük tutarlara dokunur:
//   Bakım          Örs'te günlük, isteğe bağlı hizmet: akçe karşılığı 24 saat eşya düşme oranı artar (yıpranma YOKTUR)
//   Lüks vergisi   Pazarda yüksek fiyatlı satışın eşik üstündeki dilimi daha yüksek oranla vergilenir
// (Klan bağışının seviyeyle büyüyen günlük sınırı clan.js: donateCap'tedir.)
// Saf JS'tir ve istemciye sunulur: arayüz aynı tabloları ve işlevleri okur, yani ekrandaki sayı sunucunun hesabıdır.
import { UNLOCK, MARKET, factionBonus } from './content.js';
import { fail, pay, busy } from './util.js';

const HOUR = 3600000;

// ---------- Bakım ----------
// per: bedel = per × seviye (akçe) · drop: eşya düşme oranına eklenen yüzde (premium ve sefer bonusuyla çarpılır)
export const UPKEEP = {
  hours: 24,
  tiers: [
    { id: 'yag',  name: 'Yağlama',     per: 100, drop: 5,  note: 'Silahlar yağlanır, kayışlar sıkılır.' },
    { id: 'bile', name: 'Bileme',      per: 250, drop: 10, note: 'Ağızlar bilenir, zırh perçinleri yenilenir.' },
    { id: 'usta', name: 'Usta Bakımı', per: 600, drop: 15, note: 'Ustabaşı bütün takımı elden geçirir.' },
  ],
};
export const upkeepTier = id => (typeof id === 'string' ? UPKEEP.tiers.findIndex(t => t.id === id) : -1);
export const upkeepCost = (i, lvl) => UPKEEP.tiers[i].per * lvl;
// Süren bakım: { i: kademe indisi, until } ya da null (kayıt bozuksa ya da süresi dolduysa)
export function upkeepOf(p, now) {
  const u = p.upkeep;
  return u && Number.isInteger(u.t) && u.t >= 0 && u.t < UPKEEP.tiers.length && u.until > now ? { i: u.t, until: u.until, ...UPKEEP.tiers[u.t] } : null;
}
// Savaş ganimetine uygulanan yüzde (modes.js: killRewards); bakım yoksa 0
export const upkeepDrop = (p, now) => upkeepOf(p, now)?.drop || 0;

// ---------- Lüks vergisi (pazar) ----------
// Satış vergisi dilimlidir: fiyatın ilk dilimi satıcının taban oranıyla (taraf bonusu dahil), eşiklerin üstünde kalan
// kısım taban + add ile vergilenir. Eşiğin altındaki satışta hiçbir şey değişmez.
export const LUX_TAX = [{ from: 50000, add: 0.02 }, { from: 500000, add: 0.05 }];
export const taxRates = faction => { const base = factionBonus(faction).marketTax; return [{ from: 0, rate: base }, ...LUX_TAX.map(b => ({ from: b.from, rate: Math.round((base + b.add) * 1000) / 1000 }))]; };
// Yakılan vergi (akçe): dilimler binde cinsinden tam sayıyla toplanır (kayan nokta sapması olmasın), sonda yuvarlanır
export function saleTax(price, faction) {
  const R = taxRates(faction);
  let milli = 0;
  for (let i = 0; i < R.length; i++) { const to = i + 1 < R.length ? R[i + 1].from : Infinity; if (price > R[i].from) milli += (Math.min(price, to) - R[i].from) * Math.round(R[i].rate * 1000); }
  return Math.round(milli / 1000);
}
export const saleNet = (price, faction) => price - saleTax(price, faction);
export const listFee = price => Math.max(1, Math.ceil(price * MARKET.listFee));

// ---------- Kurallar ----------
export const SINK_HANDLERS = {
  // Bakım: süren bakımdan düşük ya da aynı kademe alınamaz (akçe boşa gitmesin); üst kademe hemen başlar ve süreyi yeniler
  'upkeep.buy'(p, { tier }, env) {
    busy(p);
    if (p.lvl < UNLOCK.anvil) fail('locked', `Örs ${UNLOCK.anvil}. seviyede açılır.`);
    const i = upkeepTier(tier);
    if (i < 0) fail('bad-tier', 'Böyle bir bakım yok.');
    const cur = upkeepOf(p, env.now);
    if (cur && cur.i >= i) fail('upkeep-active', cur.i === i ? 'Bu bakım zaten sürüyor.' : 'Daha üstün bir bakım sürüyor.');
    const cost = upkeepCost(i, p.lvl);
    pay(p, 'akce', cost, 'Yeterli akçe yok.');
    p.upkeep = { t: i, until: env.now + UPKEEP.hours * HOUR };
    return { tier: UPKEEP.tiers[i].id, cost, until: p.upkeep.until, drop: UPKEEP.tiers[i].drop };
  },
};

// ---------- Ekonomi modeli (tools/economy.js): kalem adları ve örnek oyuncunun davranışı ----------
export const LEDGER = { upkeep: 'Bakım (Örs)' };
// Günün ilk oturumunda, yedek akçenin üç katı elde kalacaksa alınabilen en üstün bakım alınır
export async function simulate({ act, state, reserve, session }) {
  if (session !== 0) return;
  for (let i = UPKEEP.tiers.length - 1; i >= 0; i--) {
    const S = state();
    if (S.lvl >= UNLOCK.anvil && S.akce - upkeepCost(i, S.lvl) >= reserve() * 3) { if (await act({ type: 'upkeep.buy', tier: UPKEEP.tiers[i].id }, 'upkeep')) return; }
  }
}
