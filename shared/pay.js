// Gerçek parayla satın alma: ürün kataloğu ve oyuncu kaydına etkisi (yakut verme, Yakut Kartı, iade).
// Saf JS'tir ve ağ bilmez: sipariş, sağlayıcı doğrulaması ve tek seferlik yazma sunucudadır (server/pay/).
// Bu dosya yalnızca "doğrulanmış bir ödeme oyuncuya ne verir, iade ne geri alır" sorusunu yanıtlar.
// Fiyatlar küçük birimle (kuruş / cent) tam sayı olarak durur; istemci tutar göndermez, sunucu buradan okur.
import { dayKey, PREMIUM } from './content.js';
import { fail, addItem, removeItems } from './util.js';
import { STARTER_WEAPONS } from './items.js';
import { STORE_CUR, storePrice, tlMinor } from './config/storePrices.js';
// Fiyat: storePrices.js tam TL → küçük birim (kuruş); sipariş ve sağlayıcı doğrulaması kuruşla çalışır
const P$ = sku => ({ [STORE_CUR]: storePrice(sku) * 100 });

const DAY = 86400000;
const premTier = (p, now) => (p.premium && p.premium.until > now ? p.premium.tier : 0); // state.js ile aynı (döngüsel içe aktarma olmasın)

export const PAY = {
  currencies: [STORE_CUR], // tek para birimi TL (P28 O9; tutarlar config/storePrices.js)
  firstBonus: 1,        // bir paketin ilk alımında paket yakutunun bu katı kadar ek yakut (1 = iki katı)
  cardMaxDays: 90,      // Yakut Kartı en çok bu kadar gün ileriye biriktirilebilir
  openOrders: 10,       // oyuncu başına 24 saatte açılabilen ödenmemiş sipariş
  orderReuseMs: 30 * 60000, // aynı ürün için bu süre içinde açılmış ödenmemiş sipariş yeniden kullanılır (vazgeçip yeniden deneyen oyuncu sınırı doldurmasın)
  orderKeepMs: 14 * DAY, // ödenmemiş sipariş bu süreden sonra silinir (bekleyen ödemeler günler sürebilir)
  history: 20,          // geçmişte gösterilen sipariş sayısı
  // İade ve ters ibraz (chargeback): verilen yakut geri alınır (bakiye eksiye düşebilir) ve hile korumasına işlenir.
  // refund: ilk `free` iade puansızdır, sonrakiler puan alır · chargeback: her biri puan alır
  refund: { free: 2, weight: 25, chargeback: 50 },
};

// Yakut paketleri ve Yakut Kartı. storeId: Google Play / App Store ürün kimliği (iki mağazada aynı ad kullanılır).
// yakut: hemen verilen · kart için daily: her gün alınabilen, days: süre
export const PRODUCTS = [
  { sku: 'yakut100',  kind: 'yakut', storeId: 'yakut_100',  name: 'Bir Avuç Yakut',  yakut: 100,  price: P$('yakut100') },
  { sku: 'yakut320',  kind: 'yakut', storeId: 'yakut_320',  name: 'Yakut Kesesi',    yakut: 320,  price: P$('yakut320') },
  { sku: 'yakut600',  kind: 'yakut', storeId: 'yakut_600',  name: 'Yakut Sandığı',   yakut: 600,  price: P$('yakut600') },
  { sku: 'yakut1300', kind: 'yakut', storeId: 'yakut_1300', name: 'Yakut Küpü',      yakut: 1300, price: P$('yakut1300') },
  { sku: 'yakut2800', kind: 'yakut', storeId: 'yakut_2800', name: 'Yakut Hazinesi',  yakut: 2800, price: P$('yakut2800') },
  { sku: 'yakut7500', kind: 'yakut', storeId: 'yakut_7500', name: 'Hakan Hazinesi',  yakut: 7500, price: P$('yakut7500') },
  // Premium: Bronz yakutla alınır (daily.js: premium.buy); Gümüş ve Platin YALNIZCA gerçek parayla (30 gün; tier: PREMIUM indisi)
  { sku: 'prem2', kind: 'premium', storeId: 'premium_gumus',  name: 'Gümüş Premium', tier: 2, yakut: 0, price: P$('prem2') },
  { sku: 'prem3', kind: 'premium', storeId: 'premium_platin', name: 'Platin Premium', tier: 3, yakut: 0, price: P$('prem3') },
  // İlk Alım Paketi: dört silahtan biri (tek seferlik, hesap başına). weapon: items.js STARTER_WEAPONS anahtarı
  ...Object.entries(STARTER_WEAPONS).map(([k, W]) => ({ sku: 'starter_' + k, kind: 'starter', storeId: 'ilk_alim_' + k, name: 'İlk Alım Paketi', weapon: k, yakut: 0, price: P$('starter_' + k) })),
  // İkinci kopya kahraman yeri: sürüm 12'de satıştan kalktı (tek karakter). Eski siparişlerin iadesi çözülebilsin diye durur.
  { sku: 'kopya2', kind: 'copy', storeId: 'ikinci_kopya', name: 'İkinci Kopya Yeri', yakut: 0, price: P$('kopya2'), retired: true },
  { sku: 'kart30',    kind: 'card',  storeId: 'yakut_karti_30', name: 'Yakut Kartı', yakut: 250, daily: 50, days: 30, price: P$('kart30') },
];
const BY_SKU = new Map(PRODUCTS.map(P => [P.sku, P]));
const BY_STORE = new Map(PRODUCTS.map(P => [P.storeId, P]));
export const productOf = sku => (typeof sku === 'string' && BY_SKU.has(sku) ? BY_SKU.get(sku) : null);
export const productByStoreId = id => (typeof id === 'string' && BY_STORE.has(id) ? BY_STORE.get(id) : null);
/** Küçük birimden gösterim metni: 119900 → "₺1.199" (P28 O9: tek biçim işlevi storePrices.js tlMinor; küsürat yok). */
export const priceText = minor => tlMinor(minor);

// ---------- Oyuncu kaydındaki ödeme alanı ----------
// first: ilk alım bonusu kullanılmış paketler · card: { end: kartın bittiği gün (dayKey, o gün dahil değil),
// day: son günlük alımın günü, n: bu kart döneminde alınan günlük sayısı } · n: toplam satın alma · refunds: iade sayısı
export const newPay = () => ({ first: {}, card: { end: 0, day: 0, n: 0 }, n: 0, refunds: 0, starter: null }); // starter: alınan İlk Alım Paketi silahı (anahtar) ya da null
export const payOf = p => p.pay || (p.pay = newPay());
export const cardDays = (p, now) => Math.max(0, payOf(p).card.end - dayKey(now));

// Bu paket şimdi alınırsa ne verir (ilk alım bonusu dahil)
export function quote(p, P) {
  const bonus = P.kind === 'yakut' && !Object.hasOwn(payOf(p).first, P.sku) ? Math.round(P.yakut * PAY.firstBonus) : 0;
  return { yakut: P.yakut, bonus, total: P.yakut + bonus };
}
// Sipariş açılabilir mi: kart, sınırın ötesine biriktirilemez
export function checkOrder(p, P, now) {
  if (P.kind === 'card' && cardDays(p, now) + P.days > PAY.cardMaxDays) fail('card-full', `Yakut Kartı en çok ${PAY.cardMaxDays} gün ileriye alınabilir.`);
  if (P.kind === 'premium' && premTier(p, now) > P.tier) fail('lower-tier', 'Daha yüksek bir üyeliğin sürüyor.');
  if (P.kind === 'starter' && payOf(p).starter) fail('starter-done', 'İlk Alım Paketi zaten alındı.');
  if (P.retired) fail('retired', 'Bu ürün artık satılmıyor.');
}
// Doğrulanmış ödemeyi oyuncuya işler. Dönen kayıt (grant) siparişe yazılır; iade tam olarak bunu geri alır.
export function applyPurchase(p, P, now) {
  const S = payOf(p), q = quote(p, P), grant = { yakut: q.total, bonus: q.bonus };
  p.yakut += q.total; S.n++;
  if (P.kind === 'premium') {
    const T = PREMIUM[P.tier], cur = premTier(p, now), DAYMS = DAY * T.days;
    p.premium = { tier: P.tier, until: (cur === P.tier ? p.premium.until : now) + DAYMS };
    grant.tier = P.tier; grant.pdays = T.days;
  }
  if (P.kind === 'starter') { // satın alınmış eşya çanta sınırına takılmaz
    const it = addItem(p, 's:' + P.weapon, 2, { nt: 1 });
    S.starter = P.weapon; grant.item = it.id; grant.weapon = P.weapon;
  }
  if (P.kind === 'copy') { S.copy = 1; grant.copy = 1; }
  if (q.bonus) S.first[P.sku] = 1;
  if (P.kind === 'card') {
    const today = dayKey(now);
    if (S.card.end <= today) S.card = { end: today, day: 0, n: 0 }; // yeni dönem
    S.card.end += P.days; grant.days = P.days;
  }
  return grant;
}
// İade / ters ibraz: verilen yakut geri alınır (harcanmışsa bakiye eksiye düşer; sonraki kazançlar önce açığı kapatır).
// Kartta kalan günler silinir ve bu dönemde alınmış günlükler de geri alınır. Geri alınan toplamı döndürür.
export function applyRefund(p, P, grant, now) {
  const S = payOf(p);
  let take = grant.yakut || 0;
  if (grant.bonus && P.kind === 'yakut') delete S.first[P.sku]; // bonus da geri alındı: ilk alım hakkı yeniden doğar
  if (grant.pdays && p.premium?.tier === grant.tier) { // Gümüş/Platin: verilen süre geri alınır; süre biterse üyelik kalkar
    const until = p.premium.until - grant.pdays * DAY;
    p.premium = until > now ? { tier: grant.tier, until } : { tier: 0, until: 0 };
  }
  if (grant.item != null) { // İlk Alım silahı: çantadan ve üzerindeki kahramandan alınır; paket yeniden alınabilir
    for (const h of Object.values(p.heroes || {})) for (const s in h.eq) if (h.eq[s] === grant.item) delete h.eq[s];
    removeItems(p, [grant.item]); S.starter = null;
  }
  if (grant.copy) { S.copy = 0; if (S.copyRefund) { if (p.solo?.refund && !p.solo.got) p.solo.got = 1; else take += S.copyRefund; S.copyRefund = 0; } } // tek karakter göçünün Yakut iadesi: alınmışsa geri alınır, alınmamışsa posta düşer
  if (grant.days) {
    const claimed = Math.min(S.card.n, grant.days);
    take += claimed * (P.daily || 0); S.card.n -= claimed;
    S.card.end = Math.max(dayKey(now), S.card.end - grant.days);
  }
  p.yakut -= take; S.refunds++;
  return take;
}

// ---------- Oyuncu işlemleri (world.js WORLD tablosuna eklenir) ----------
// ctx.pay: sunucunun ödeme servisi bilgisi ({ providers: [{ id, kind }] }); çevrimdışı denemede yoktur.
const cardView = (p, now) => { const C = payOf(p).card, days = cardDays(p, now); return { active: days > 0, days, claimed: C.day === dayKey(now), max: PAY.cardMaxDays }; };
export const PAY_WORLD = {
  // Katalog: fiyatlar, bu oyuncu için ilk alım bonusu, kart durumu ve açık sağlayıcılar (salt-okur)
  async 'pay.view'(ctx, p) {
    return {
      cur: PAY.currencies, firstBonus: PAY.firstBonus,
      starter: payOf(p).starter || null, tier: premTier(p, ctx.now),
      products: PRODUCTS.filter(P => !P.retired).map(P => ({ sku: P.sku, kind: P.kind, name: P.name, storeId: P.storeId, price: P.price, ...quote(p, P), ...(P.kind === 'premium' ? { ptier: P.tier } : {}), ...(P.kind === 'starter' ? { weapon: P.weapon } : {}), ...(P.kind === 'card' ? { daily: P.daily, days: P.days, sum: P.yakut + P.daily * P.days } : {}) })),
      card: cardView(p, ctx.now), providers: ctx.pay?.providers || [], yakut: p.yakut,
    };
  },
  // Yakut Kartı'nın günlük yakutu: kart sürerken günde bir kez; alınmayan gün yanar
  async 'pay.card'(ctx, p) {
    const S = payOf(p), P = productOf('kart30'), today = dayKey(ctx.now);
    if (S.card.end <= today) fail('no-card', 'Etkin bir Yakut Kartın yok.');
    if (S.card.day === today) fail('claimed', 'Bugünkü kart yakutu alındı.');
    S.card.day = today; S.card.n++; p.yakut += P.daily;
    return { loot: [{ t: 'yakut', n: P.daily }], card: cardView(p, ctx.now) };
  },
  // Satın alma geçmişi: ödenmiş ve iade edilmiş siparişler (salt-okur)
  async 'pay.history'(ctx) {
    const rows = await ctx.store.query('order', { k1: String(ctx.pid), order: '-n1', limit: 60 });
    return { orders: rows.filter(r => r.doc.status !== 'new').slice(0, PAY.history).map(r => ({ id: r.id.slice(0, 8), sku: r.doc.sku, name: productOf(r.doc.sku)?.name || r.doc.sku, status: r.doc.status, at: r.doc.paidAt || r.doc.at, price: priceText(r.doc.amount, r.doc.cur), yakut: r.doc.grant?.yakut || 0, bonus: r.doc.grant?.bonus || 0, taken: r.doc.taken || 0 })) };
  },
};
export const PAY_READ_ONLY = ['pay.view', 'pay.history'];
