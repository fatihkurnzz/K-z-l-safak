// P28 O9: mağaza TL fiyatlarının TEK kaynağı. Tutarlar tam lira (küsüratsız); kademeler ₺49 · ₺149 · ₺299 · ₺599 · ₺1.199 · ₺2.499.
// pay.js ürün kataloğu, sunucu siparişi (küçük birim = lira × 100) ve bütün gösterim yerleri buradan okur; başka yerde fiyat yazılmaz.
// Mağaza derlemesinde (Google Play / App Store) mağazanın kendi fiyat metni önceliklidir (ui-odeme.js); ürün kimlikleri pay.js'te.

/** Para birimi (ISO 4217). */
export const STORE_CUR = 'TRY';

/** Ürün → fiyat (tam TL). Yakut miktarları ve bonuslar pay.js'tedir, burada yalnız fiyat durur. */
export const STORE_PRICES = {
  yakut100: 49,    // Bir Avuç Yakut
  yakut320: 149,   // Yakut Kesesi
  yakut600: 299,   // Yakut Sandığı
  yakut1300: 599,  // Yakut Küpü
  yakut2800: 1199, // Yakut Hazinesi
  yakut7500: 2499, // Hakan Hazinesi (6. paket: 5 kademenin ritmiyle eklendi)
  kart30: 149,     // Yakut Kartı (30 gün)
  prem2: 149,      // Gümüş Premium (30 gün)
  prem3: 299,      // Platin Premium (30 gün)
  starter: 49,     // İlk Alım Paketi (dört silahın her biri aynı fiyat)
  kopya2: 149,     // satıştan kalktı; eski siparişin iadesi çözülebilsin diye
};

/** Premium kademesi (content.js PREMIUM indisi) → ürün anahtarı. */
export const PREMIUM_SKU = { 2: 'prem2', 3: 'prem3' };

/** Ürünün fiyatı (tam TL) ya da null. İlk Alım ürünleri (`starter_<silah>`) ortak `starter` fiyatını kullanır. */
export const storePrice = sku => {
  const k = typeof sku === 'string' && sku.startsWith('starter_') ? 'starter' : sku;
  return Object.hasOwn(STORE_PRICES, k) ? STORE_PRICES[k] : null;
};

/** Tam TL → gösterim metni: 1199 → "₺1.199" (binlik nokta, küsürat yok). Tek biçim işlevi budur. */
export const tl = lira => `₺${String(Math.round(+lira || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;

/** Küçük birim (kuruş) → gösterim metni: 119900 → "₺1.199" (sipariş kayıtları kuruşla durur). */
export const tlMinor = minor => tl(Math.round((+minor || 0) / 100));
