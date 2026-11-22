// ---- Uygulama (şablon: _tasarim/araclar/adlar-kod.js) ----
// Dil katmanı (kullanıcı kararı 23.11): kimlikler ve mekanik değişmez; yalnız görünen ad alanları Türkçeye çevrilir.
// Oyunun kaynak dili Türkçedir: İngilizce seçiliyken eski (İngilizce) adlar i18n sözlüğünden geri gelir.
// Sıra önemli: itemBase önce asıl adla kurulur (ITEM_GLB ada bakar), sonra ad değiştirilir.
import { itemBase, WEAPON_NAMES, JEWEL_NAMES, ARMOR_SETS } from '../shared/items.js';
import { SKILLS } from '../shared/skills.js';
import { addDictLate } from './i18n.js';

const EN = {};
const put = (tr, en) => { if (tr && en && tr !== en && !Object.hasOwn(EN, tr)) EN[tr] = en; };
const sets = new Map(); // sınıf|İngilizce set adı → { en, tr: [parça adları], defs }
const T_ARR = { w: WEAPON_NAMES, j: JEWEL_NAMES };
let nI = 0, nS = 0;
for (const [id, tr] of Object.entries(ITEM_TR)) {
  const B = itemBase(id);
  if (!B) continue;
  const en = B.name;
  put(tr, en); B.name = tr; nI++;
  const P = id.split(':'), A = T_ARR[P[0]]?.[P[1]];
  if (A && P.length === 3 && A[+P[2]] === en) A[+P[2]] = tr; // Rehber tabloları dizilerden okur
  if (B.kind === 'armor' && B.set) {
    const k = B.cls[0] + '|' + B.set, r = sets.get(k) || sets.set(k, { en: B.set, tr: [], defs: [] }).get(k);
    r.tr.push(tr); r.defs.push(B);
  }
}
// Set adı: parçaların Türkçe adlarının ortak baş sözcükleri ("Yarım Plaka Miğfer" … → "Yarım Plaka")
for (const [k, r] of sets) {
  const W = r.tr.map(s => s.split(' '));
  let n = 0;
  while (W.every(w => n < w.length - 1 && w[n] === W[0][n])) n++;
  const name = n ? W[0].slice(0, n).join(' ') : W[0].slice(0, -1).join(' ') || r.tr[0];
  put(name, r.en);
  for (const B of r.defs) B.set = name;
  const L = ARMOR_SETS[k.split('|')[0]], i = L ? L.indexOf(r.en) : -1;
  if (i >= 0) L[i] = name;
}
for (const [id, tr] of Object.entries(SKILL_TR)) { const S = SKILLS[id]; if (S) { put(tr, S.name); S.name = tr; nS++; } }
addDictLate('en', EN);
if (typeof window !== 'undefined') window.DD_ADLAR = { EN, esya: nI, yetenek: nS, set: sets.size, en: Object.keys(EN).length };
