// Mağaza faturalaması köprüsü (Android: Google Play Billing, iOS: StoreKit). Oyun mağaza paketinde (Capacitor) çalışıyorsa
// ve pakete @capgo/native-purchases eklentisi eklenmişse (docs/odeme.md) eklenti window.Capacitor.Plugins.NativePurchases
// olarak görünür; bu dosya yalnızca onu çağırır. Tarayıcıda ve eklentisiz pakette her şey "yok" döner.
// Yakut burada verilmez: mağazadan dönen kanıt (Android satın alma jetonu, iOS işlem kimliği) sunucuya gönderilir,
// sunucu mağazada doğrular ve yakutu tek sefer yazar; Android'de jetonu da sunucu tüketir.
const cap = () => (typeof window !== 'undefined' ? window.Capacitor : null);
// 'android' | 'ios' | null (tarayıcı, ana ekrana eklenmiş web uygulaması)
export const nativePlatform = () => { const C = cap(); try { return C?.isNativePlatform?.() ? C.getPlatform() : null; } catch { return null; } };
const plugin = () => { const C = cap(); try { return C?.isPluginAvailable?.('NativePurchases') ? C.Plugins.NativePurchases : null; } catch { return null; } };
// Sağlayıcı türü (server/pay: kind) → bu cihazda kullanılabilir mi
export const nativeKind = () => ({ android: 'android', ios: 'ios' }[nativePlatform()] || null);
export async function storeReady() {
  const N = plugin(); if (!N) return false;
  try { return !!(await N.isBillingSupported()).isBillingSupported; } catch { return false; }
}
// Mağazanın oyuncunun ülkesine göre gösterdiği fiyat metinleri: { ürünKimliği: '₺179,99' }. Alınamazsa boş nesne.
export async function storePrices(ids) {
  const N = plugin(); if (!N) return {};
  try { const r = await N.getProducts({ productIdentifiers: ids, productType: 'inapp' }), out = {}; for (const p of r.products || []) if (p?.identifier && p.priceString) out[p.identifier] = p.priceString; return out; }
  catch { return {}; }
}
export class StoreError extends Error { constructor(code, message) { super(message); this.code = code; } }
// Mağaza satın alma penceresini açar. account: sipariş kimliği (UUID) — satın almaya iliştirilir, sunucu bununla eşler.
// Dönen: Android { token } · iOS { txn }. Otomatik onay kapalıdır: yakut sunucuda verildikten sonra kapatılır.
export async function storeBuy({ storeId, account }) {
  const N = plugin(), os = nativePlatform();
  if (!N) throw new StoreError('store-off', 'Mağaza satın alması bu sürümde kurulu değil.');
  let t;
  try { t = await N.purchaseProduct({ productIdentifier: storeId, productType: 'inapp', quantity: 1, appAccountToken: account, isConsumable: false, autoAcknowledgePurchases: false }); }
  catch (e) {
    const m = String(e?.message || e?.code || '');
    if (/cancel/i.test(m)) throw new StoreError('cancelled', 'Satın alma iptal edildi.');
    throw new StoreError('store', 'Mağaza satın almayı tamamlayamadı. Biraz sonra yeniden dene.');
  }
  if (os === 'android') { if (!t?.purchaseToken) throw new StoreError('store', 'Mağazadan satın alma kanıtı gelmedi.'); return { token: String(t.purchaseToken) }; }
  if (!t?.transactionId) throw new StoreError('store', 'Mağazadan işlem kimliği gelmedi.');
  return { txn: String(t.transactionId) };
}
// Yakut verildikten sonra: iOS'ta işlem kapatılır (kapatılmayan işlem sırada kalır). Android'de jetonu sunucu tüketir.
export async function storeFinish(proof) {
  const N = plugin();
  if (!N || nativePlatform() !== 'ios' || !proof?.txn) return;
  try { await N.acknowledgePurchase({ purchaseToken: proof.txn }); } catch { /* sonraki açılışta mağaza yeniden bildirir */ }
}
