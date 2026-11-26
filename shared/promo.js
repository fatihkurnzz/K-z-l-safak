// Promosyon kodları: her kod hesap başına bir kez kullanılır (p.promo[kod özeti] = zaman). Kodlar düz yazı olarak
// tutulmaz (istemciye sunulan dosyada okunmasın): büyük harfe çevrilmiş kodun FNV-1a özeti anahtardır. Yeni kod eklemek
// için: node -e "…" ile özetini al, aşağıya ödülüyle yaz. until: son kullanım (ms, 0 = süresiz).
import { fail, grantAll } from './util.js';

export const promoKey = code => { let x = 2166136261; for (const c of String(code).trim().toLocaleUpperCase('tr-TR').replace(/İ/g, 'I').replace(/\s+/g, '')) { x ^= c.charCodeAt(0); x = Math.imul(x, 16777619); } return (x >>> 0).toString(36); };
const CODES = {
  '3r8rv2':  { give: [{ t: 'yakut', n: 100 }, { t: 'stone', g: 1, n: 3 }], until: 0 },   // açılış kodu
  '1k9ojij': { give: [{ t: 'akce', n: 20000 }, { t: 'charm', n: 1 }], until: 0 },         // Yemin Pazarı kodu
};

export const PROMO_HANDLERS = {
  'promo.redeem'(p, { code }, env) {
    if (typeof code !== 'string' || code.length < 3 || code.length > 32) fail('bad-code', 'Kodu doğru yaz.');
    const k = promoKey(code), C = CODES[k];
    if (!C || (C.until && env.now > C.until)) fail('bad-code', 'Bu kod geçersiz ya da süresi dolmuş.');
    p.promo ||= {};
    if (p.promo[k]) fail('used-code', 'Bu kodu zaten kullandın.');
    p.promo[k] = env.now;
    return { loot: grantAll(p, C.give, { nt: 1 }) };
  },
};
