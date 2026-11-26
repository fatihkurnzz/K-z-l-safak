// Tek karakter (sürüm 12). Oyuncu kaydı (p) bir KARAKTERDİR; karakterin tek kahramanı vardır ve kimliği sabittir: MAIN ('h0').
// PvE ve PvP her zaman bu kahramanla oynanır. Eski parti / kadro / kopya (k1, k2) sistemi kalktı; eski kayıtlar state.js
// upgradeState içinde tek kahramana göçer (soloMigrate). Hesap → karakter yerleri: account.js.
//
// Kayıt biçimi:
//   p.heroes.h0 = { cls, name, pts, tree, act, pas, eq, path, pn, ppas, mst? }   (tek kayıt)
//   p.char = { id, name, race, cls, gender, face, hair, hairColor, eyeColor, skin, beard, body, height, createdAt }  (görünüş)
// Aşağıdaki heroIds / partyIds / ownIds gibi adlar eski çağıranlar için durur: hepsi tek kahramanı döndürür.
import { CLASSES, CLASS_KEYS, FACTIONS } from './content.js';
import { HAIRS, BEARDS, BODIES, HEIGHT, lookDefault, lookFieldOk } from './gorunus.js';

export const MAIN = 'h0';
// Kaydın tek kahramanının kimliği (göç öncesi ya da bozuk kayıtta ilk kahraman)
export const mainId = p => (p?.heroes && Object.hasOwn(p.heroes, MAIN) ? MAIN : Object.keys(p?.heroes || {})[0] || MAIN);
export const mainHero = p => p.heroes[mainId(p)];
export const hasHero = (p, id) => typeof id === 'string' && Object.hasOwn(p.heroes, id);
// Sınıf: kayıtta yazılıdır; çok eski (sürüm 3) kayıtta kimliğin kendisidir
export const clsOf = (p, id = mainId(p)) => p.heroes[id].cls || id;
// ---- Eski adlar (tek kahramana indirgenmiş) ----
export const heroIds = p => (p?.heroes && Object.keys(p.heroes).length ? [mainId(p)] : []);
export const ownIds = heroIds;
export const partyIds = p => heroIds(p);
export const isCopy = () => false;
export const srcId = (p, id) => id;
export const isStarter = () => true;

// ---- Karakter yerleri ve görünüş (sözleşme: scratchpad/v12/tasarim.md) ----
export const CHAR = {
  slots: 3,                                  // hesap başına en çok karakter
  name: { min: 3, max: 12 },                 // ad uzunluğu (harf ve rakam; Türkçe harfler dahil; boşluk yok)
  gender: ['m', 'f'],
  face: 5, hair: HAIRS.length, beard: BEARDS.length, body: BODIES.length, // kimlik aralığı (0 … n-1); ırk + cinsiyete izinli olanlar shared/gorunus.js
  height: HEIGHT,
};
// Irk + sınıfa göre varsayılan görünüş (oluşturma ekranının açılış değerleri; eski kayıt göçünde de bu kullanılır): shared/gorunus.js
export const defaultLook = (race, cls, gender = 'm') => lookDefault(race, cls, gender);
// Ad kuralı: 3-12 harf ya da rakam (Unicode harfleri: ç, ğ, ı, İ, ö, ş, ü); harfle başlar. Küfür süzgeci ve teklik account.js'te.
const CHAR_NAME_RE = /^\p{L}[\p{L}\p{N}]{2,11}$/u;
export const validCharName = name => typeof name === 'string' && CHAR_NAME_RE.test(name);
export const charNameKey = name => String(name).trim().toLocaleLowerCase('tr-TR');
// İstemciden gelen görünüşü denetler ve eksik alanları varsayılanla doldurur. Her alan ırk + cinsiyete izinli değerlerden
// olmalıdır (shared/gorunus.js lookOptions: yüz, saç, sakal, vücut kimlikleri ve renk paletleri; boy 0.94-1.06).
// Hata metni fırlatmak çağıranın işidir: geçersiz alan için { err } döner.
export function normLook(look) {
  const L = look && typeof look === 'object' ? look : {};
  if (!Object.hasOwn(FACTIONS, L.race)) return { err: 'Irk seçilmedi.' };
  if (!Object.hasOwn(CLASSES, L.cls)) return { err: 'Sınıf seçilmedi.' };
  const gender = L.gender === undefined ? 'm' : L.gender;
  if (!CHAR.gender.includes(gender)) return { err: 'Geçersiz cinsiyet.' };
  const out = defaultLook(L.race, L.cls, gender);
  for (const k of ['face', 'hair', 'beard', 'body']) if (L[k] !== undefined) { if (!lookFieldOk(L.race, gender, k, L[k])) return { err: 'Bu görünüş seçeneği bu ırk ve cinsiyete uygun değil.' }; out[k] = L[k]; }
  for (const k of ['hairColor', 'eyeColor', 'skin']) if (L[k] !== undefined) { if (!lookFieldOk(L.race, gender, k, L[k])) return { err: 'Geçersiz renk.' }; out[k] = L[k].toLowerCase(); }
  if (L.height !== undefined) { if (!lookFieldOk(L.race, gender, 'height', L.height)) return { err: 'Geçersiz boy.' }; out.height = Math.round(L.height * 100) / 100; }
  return out;
}
// Karakter seçme ekranındaki kart (char.list): kayıttan okunur
export const charCard = (id, p) => ({ id, name: p.name, race: p.faction, cls: p.char?.cls || clsOf(p), lvl: p.lvl, look: p.char || defaultLook(p.faction, clsOf(p)), at: p.seenAt || p.createdAt || 0, clan: p.clanName || null });
