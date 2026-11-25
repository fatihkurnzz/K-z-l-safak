// Ahır: halk yoldaşları (P28; şartname docs/referans/p28-ahir-han-anit/TALIMAT.md §3.1–3.3).
// Kayıt: p.ahir = { own: { [id]: { lv, xp } }, active: id | null, feedDay: gün anahtarı, feeds: o günkü besleme sayısı }.
// Pasif statlar hero.js heroStats içinde toplam Can/Saldırı/Savunma/Kritik'e eklenir (karakter ekranı ve savaş aynı işlevden okur);
// destek hamlesi savaş motorunda (battle.js petMove, ENGINE_V ≥ 10) sahibinin her `skill.every`. turunda kendiliğinden işler.
// Yoldaş her savaş türünde (PvE ve PvP) geçerlidir. Bu dosya hero.js'i içe aktarmaz (döngü olmasın).
import { fail } from './util.js';
import { dayKey } from './content.js';

/** Yoldaş seviyesinin üst sınırı. */
export const MAX_LV = 10;
/** Günde en çok besleme sayısı (bütün yoldaşlar için toplam; 00:00'da sıfırlanır). */
export const FEEDS_PER_DAY = 3;
/** Bir beslemenin verdiği yoldaş deneyimi. */
export const FEED_XP = 40;
/** Yoldaşın şimdiki seviyesine göre besleme bedeli (Akçe). */
export const feedCost = lv => 400 * lv;
/** Bir sonraki seviyeye gereken yoldaş deneyimi. */
export const xpNeed = lv => 100 * lv;

// Yüzdeler tam yüzde birimindedir (3 = %3). skill: every = kaç turda bir; kind: shield | strike | rally | bleed | shake.
// pct: sahibinin azami canının (shield) ya da saldırı gücünün (strike/bleed/shake) yüzdesi; t: etkinin tur sayısı.
/** Yoldaş tablosu (id → tanım). Arayüz ve kurallar buradan okur. */
export const COMPANIONS = {
  elentha_at: { faction: 'sancak', name: 'Zırhlı Savaş Atı', img: 'img/p28/pet_elentha_at.webp', lvReq: 5, cost: { akce: 2500 },
    base: { hp: 100, atkPct: 0, defPct: 3, critPct: 0 }, perLv: { hp: 25, atkPct: 0, defPct: 0.5, critPct: 0 },
    skill: { every: 4, kind: 'shield', pct: 8, t: 2, desc: 'Her 4 turda sahibine azami canının %8’i kadar kalkan.' } },
  elentha_sahin: { faction: 'sancak', name: 'Gümüş Şahin', img: 'img/p28/pet_elentha_sahin.webp', lvReq: 15, cost: { akce: 8000 },
    base: { hp: 0, atkPct: 4, defPct: 0, critPct: 3 }, perLv: { hp: 0, atkPct: 0.6, defPct: 0, critPct: 0.4 },
    skill: { every: 3, kind: 'strike', pct: 35, desc: 'Her 3 turda düşmana saldırı gücünün %35’i kadar Keskin Dalma.' } },
  elentha_aslan: { faction: 'sancak', name: 'Safir Aslan', img: 'img/p28/pet_elentha_aslan.webp', lvReq: 25, cost: { akce: 18000, yakut: 150 },
    base: { hp: 180, atkPct: 6, defPct: 0, critPct: 0 }, perLv: { hp: 35, atkPct: 0.8, defPct: 0, critPct: 0 },
    skill: { every: 4, kind: 'rally', healPct: 10, atkPct: 10, t: 1, desc: 'Her 4 turda sahibine %10 can yenileme ve 1 tur +%10 saldırı.' } },
  kragmir_kurt: { faction: 'ocak', name: 'Kara Savaş Kurdu', img: 'img/p28/pet_kragmir_kurt.webp', lvReq: 5, cost: { akce: 2500 },
    base: { hp: 0, atkPct: 4, defPct: 0, critPct: 2 }, perLv: { hp: 0, atkPct: 0.6, defPct: 0, critPct: 0.4 },
    skill: { every: 3, kind: 'bleed', pct: 20, t: 2, desc: 'Her 3 turda düşmana 2 tur süren kanama (tur başına saldırının %20’si).' } },
  kragmir_domuz: { faction: 'ocak', name: 'Demir Yaban Domuzu', img: 'img/p28/pet_kragmir_domuz.webp', lvReq: 15, cost: { akce: 8000 },
    base: { hp: 140, atkPct: 0, defPct: 4, critPct: 0 }, perLv: { hp: 30, atkPct: 0, defPct: 0.5, critPct: 0 },
    skill: { every: 4, kind: 'shake', pct: 30, weakPct: 10, t: 1, desc: 'Her 4 turda düşmanı sarsar: %30 hasar ve 1 tur −%10 düşman saldırısı.' } },
  kragmir_ejder: { faction: 'ocak', name: 'Kül Ejderi', img: 'img/p28/pet_kragmir_ejder.webp', lvReq: 25, cost: { akce: 18000, yakut: 150 },
    base: { hp: 150, atkPct: 7, defPct: 0, critPct: 0 }, perLv: { hp: 30, atkPct: 0.8, defPct: 0, critPct: 0 },
    skill: { every: 4, kind: 'strike', pct: 45, magic: true, desc: 'Her 4 turda Kül Alevi: saldırı gücünün %45’i kadar büyü hasarı.' } },
};

/** Ahır kaydını kurar/onarır ve gün dönmüşse besleme sayacını sıfırlar. */
export function ahirOf(p, now) {
  const A = p.ahir && typeof p.ahir === 'object' ? p.ahir : (p.ahir = { own: {}, active: null, feedDay: 0, feeds: 0 });
  if (!A.own || typeof A.own !== 'object') A.own = {};
  if (A.active !== null && !(A.active in A.own)) A.active = null;
  if (now !== undefined && A.feedDay !== dayKey(now)) { A.feedDay = dayKey(now); A.feeds = 0; }
  return A;
}
const r2 = x => Math.round(x * 100) / 100;
/** Bir yoldaşın verilen seviyedeki pasif statları ({hp, atkPct, defPct, critPct}; yüzdeler yüzde biriminde). */
export function statsAt(id, lv) {
  const C = COMPANIONS[id], n = Math.max(0, Math.min(MAX_LV, lv) - 1), out = {};
  for (const k of ['hp', 'atkPct', 'defPct', 'critPct']) out[k] = r2((C.base[k] || 0) + (C.perLv[k] || 0) * n);
  return out;
}
/** Etkin yoldaş (yalnız kendi halkının, sahip olunan) ya da null: { id, lv, ...COMPANIONS[id] }. */
export function activeCompanion(p) {
  const A = p?.ahir, id = A?.active;
  if (!id || !Object.hasOwn(COMPANIONS, id) || !A.own?.[id] || COMPANIONS[id].faction !== p.faction) return null;
  return { id, lv: A.own[id].lv || 1, ...COMPANIONS[id] };
}
/** Etkin yoldaşın pasif toplamı; yoldaş yoksa sıfırlar. heroStats ve arayüz bunu okur. */
export function companionStats(p) {
  const c = activeCompanion(p);
  return c ? statsAt(c.id, c.lv) : { hp: 0, atkPct: 0, defPct: 0, critPct: 0 };
}
/** Savaş birimine eklenecek destek hamlesi tanımı (battle.js `pet`) ya da null. */
export function petOf(p) {
  const c = activeCompanion(p);
  return c ? { id: c.id, name: c.name, lv: c.lv, ...c.skill, desc: undefined } : null;
}

const own = (A, id) => (A.own[id] || fail('not-owned', 'Bu yoldaş henüz açılmadı.'));
const known = (p, id) => {
  if (typeof id !== 'string' || !Object.hasOwn(COMPANIONS, id)) fail('bad-companion', 'Böyle bir yoldaş yok.');
  if (COMPANIONS[id].faction !== p.faction) fail('wrong-faction', 'Bu yoldaş öbür halkın ahırında.');
  return COMPANIONS[id];
};

/** Ahır eylemleri (world.js'te WORLD tablosuna eklenir). */
export const AHIR_HANDLERS = {
  // Yoldaş aç: seviye şartı + Akçe ya da (varsa) Yakut bedeli
  'ahir.unlock'(p, { id, pay = 'akce' } = {}, env) {
    const C = known(p, id), A = ahirOf(p, env.now);
    if (A.own[id]) fail('owned', 'Bu yoldaş zaten senin.');
    if (p.lvl < C.lvReq) fail('locked', `${C.lvReq}. seviyede açılır.`);
    if (pay !== 'akce' && pay !== 'yakut') fail('bad-pay', 'Geçersiz ödeme.');
    const n = C.cost[pay];
    if (!n) fail('bad-pay', 'Bu yoldaş bu bedelle açılmaz.');
    if ((p[pay] || 0) < n) fail('no-' + pay, pay === 'akce' ? 'Akçen yetmiyor.' : 'Yakutun yetmiyor.');
    p[pay] -= n;
    A.own[id] = { lv: 1, xp: 0 };
    return { id, pay, cost: n };
  },
  // Kuşan; etkin yoldaşı yeniden seçmek onu çıkarır. En çok 1 etkin yoldaş.
  'ahir.equip'(p, { id } = {}, env) {
    known(p, id); const A = ahirOf(p, env.now); own(A, id);
    if (p.battle) fail('in-battle', 'Savaş sürerken yoldaş değiştirilemez.');
    A.active = A.active === id ? null : id;
    return { active: A.active };
  },
  // Besle: günde FEEDS_PER_DAY kez (toplam), bedel feedCost(lv); FEED_XP deneyim, xpNeed(lv) dolunca seviye atlar (MAX_LV'de durur)
  'ahir.feed'(p, { id } = {}, env) {
    known(p, id); const A = ahirOf(p, env.now), c = own(A, id);
    if (c.lv >= MAX_LV) fail('max', 'Yoldaşın en üst seviyede.');
    if (A.feeds >= FEEDS_PER_DAY) fail('daily-limit', `Bugünkü besleme hakkın bitti (${FEEDS_PER_DAY}/${FEEDS_PER_DAY}).`);
    const cost = feedCost(c.lv);
    if (p.akce < cost) fail('no-akce', 'Akçen yetmiyor.');
    p.akce -= cost; A.feeds++;
    c.xp += FEED_XP;
    let up = 0;
    while (c.lv < MAX_LV && c.xp >= xpNeed(c.lv)) { c.xp -= xpNeed(c.lv); c.lv++; up++; }
    if (c.lv >= MAX_LV) c.xp = 0;
    return { id, lv: c.lv, xp: c.xp, up, cost, feeds: A.feeds };
  },
};
