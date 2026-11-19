// Oyuncu ayarlarının sunucuda saklanan bölümü (p.settings). Şimdilik yalnızca dil: sunucunun ürettiği metin (ileride
// gönderilecek bildirimler dahil) okuyanın dilini bilsin diye hesapta tutulur. Grafik ve ses ayarları cihaza özgüdür,
// sunucuya gönderilmez (localStorage: dd_gfx, dd_audio). Bildirim kategorileri metaops.js'te (notif.set) durur.
// İstemciye sunulur: ayar ekranı aynı tabloyu okur.
import { fail } from './util.js';

export const SETTING_LANGS = ['tr', 'en']; // public/js/i18n.js: LANGS ile aynı olmalı (testte denetlenir)
export const SETTINGS_DEFAULT = Object.freeze({ lang: 'tr' });
const KEYS = { lang: v => typeof v === 'string' && SETTING_LANGS.includes(v) };
export const SETTING_KEYS = Object.keys(KEYS);
export const newSettings = () => ({ ...SETTINGS_DEFAULT });
// Kayıttaki ayarları onarır: bilinmeyen alan atılır, geçersiz değer varsayılana döner (eski ya da bozuk kayıt)
export function settingsOf(p) {
  const s = p.settings, out = newSettings();
  if (s && typeof s === 'object' && !Array.isArray(s)) for (const k of SETTING_KEYS) if (Object.hasOwn(s, k) && KEYS[k](s[k])) out[k] = s[k];
  return out;
}

export const SETTINGS_HANDLERS = {
  // { key, value }: yalnızca bilinen anahtar, yalnızca geçerli değer (istek düzdür: guard.js checkShape iç içe nesne kabul etmez)
  'settings.set'(p, { key, value }) {
    if (typeof key !== 'string' || !Object.hasOwn(KEYS, key) || !KEYS[key](value)) fail('bad-setting', 'Ayar tanınmadı.');
    const s = settingsOf(p);
    s[key] = value;
    p.settings = s;
    return { settings: { ...s } };
  },
};
// Hesap sekmesi: oyuncunun kimliği (destek için) ve saklanan ayarları. Kayıt yazmaz (dispatch: READ_ONLY).
export const SETTINGS_WORLD = {
  async 'settings.view'(ctx, p) { return { id: String(ctx.pid), createdAt: p.createdAt || 0, settings: settingsOf(p) }; },
};
export const SETTINGS_READ_ONLY = ['settings.view'];
