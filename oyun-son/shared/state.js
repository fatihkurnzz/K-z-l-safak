// Oyuncu kaydının biçimi: yeni hesap, eski kayıtları güncelleme, enerji ve günlük/haftalık sıfırlamalar.
import { FACTIONS, CLASSES, CLASS_KEYS, ENERGY, PREMIUM, dayKey, weekKey } from './content.js';
import { fixLoadout } from './hero.js';
import { gradeOf, minPlus } from './items.js';
import { fail, addItem } from './util.js';
import { newPay } from './pay.js';
import { stageDef } from './zones.js';
import { MAIN, mainId, defaultLook } from './roster.js';
import { power, heroUnit } from './hero.js';
import { pvpTick } from './pvp.js';
import { newSettings } from './settings.js';
import { monthKey, TUT_SV } from './meta.js';
import { POT } from './mana.js';

export const STATE_VERSION = 6;
const NAME_RE = /^[\p{L}\p{N}][\p{L}\p{N} _-]{2,15}$/u;
export const validName = name => typeof name === 'string' && NAME_RE.test(name.trim());

// Hile koruması kaydı (kurallar guard.js'te; bu dosya istemciye de sunulduğu için yalnızca biçim burada durur).
// score: 'at' anındaki ihlal puanı · until: yasağın bitişi (ms) · perm: kalıcı yasak · n: toplam ihlal · last: son ihlal
export const newGuard = () => ({ score: 0, at: 0, until: 0, perm: false, n: 0, last: null });
// Sonradan eklenen alanların varsayılanları (v1 kayıtları da bununla tamamlanır)
const DEFAULTS = now => ({
  freeReset: { stat: 3, skill: 3 }, // ücretsiz sıfırlama hakkı (19 Kas): her hesap (yeni ve eski) 3 nitelik + 3 yetenek sıfırlamasıyla başlar
  ore: 0, san: 0, seals: 0, embers: 0, shards: {}, depth: 0, kule: 0, wellBest: 0, trials: {}, premium: { tier: 0, until: 0 }, avatar: 'h:warrior', lastStage: '1-1',
  mine: { lvl: 1, at: now }, idle: { at: now },
  daily: { day: dayKey(now), q: {}, qdone: {}, boss: {} }, weekly: { week: weekKey(now) }, monthly: { month: monthKey(now), q: {}, done: {} },
  welcome: 0, rseen: now, // hoş geldin postası alındı mı; raporlar sekmesinde en son bakılan an (okunmamış rozeti)
  arena: { rating: 1000, wins: 0, losses: 0, opp: [], oppAt: 0 }, hall: { hp: 0, atk: 0, def: 0 },
  market: { ids: [] }, clan: null, pend: { clan: 0, war: 0, siege: 0 }, war: { week: 0, pts: 0, buffUntil: 0 },
  nisan: 0, clanTag: null, clanApps: [], hunt: null, csync: null, // klan: Oba Nişanı, klan özeti (pelerin), başvurular, bugünkü av kademesi (clanrules.js)
  upkeep: null, // Bakım: { t: kademe, until } (kurallar sinks.js)
  social: { block: [], spam: null }, // engel listesi ve spam sayaçları (kurallar social.js)
  pay: newPay(), // gerçek parayla satın alma: ilk alım bonusları, Yakut Kartı, iade sayısı (kurallar pay.js)
  guard: newGuard(), // istemciye gönderilmez
  // Kalıcılık katmanı (meta.js, metaops.js): başarım sayaçları ve kademeleri, takvimler, öğretici, bildirim merkezi.
  // Bu alanlar sonradan eklendi: var olan hesapta öğretici bitmiş sayılır (end: 'old'), yeni hesapta newPlayer açar.
  ach: { c: {}, t: {}, title: null }, cal: { n7: { n: 0, day: 0 }, m: { c: 0, got: [] } },
  tut: { s: 0, end: 'old', f: {}, sv: TUT_SV }, notif: { readAt: now, off: {}, list: [], dev: null },
  berat: 0, // eski kadro jetonu (sürüm 12'de işlevsiz; eski kayıtta sayı durur)
  // Irk ve diyar (realm.js, realmops.js): seçim oyu ve Başbuğluk; bölge zaferleri ve bu haftanın hâkimiyet özeti
  realm: { week: 0, vote: null, ruled: 0 }, terr: { week: 0, wins: 0, counted: false, pend: [0, 0, 0, 0], flushAt: 0, own: null },
  // "pvp" paketi (pvp.js, pvpops.js): zorluk kademelerinin yıldızları, Yeraltı Ocağı dönemi, Nöbet (uzun oto-farm)
  tstages: { 1: {}, 2: {} }, depthC: null, depthBest: 0, depthPrev: 0, farm: null,
  // "guvenlik" paketi (guard.js): etkin oturum { id, at } ve sonucu işlenmiş son savaş { id, at, r }; ikisi de istemciye gönderilmez
  sess: null, fin: null,
  settings: newSettings(), // "ayarlar" paketi (settings.js): hesapta saklanan ayarlar (dil)
  pots: { ...POT.start }, // savaş iksirleri (mana.js): Can ve Mana iksiri sayacı; eski kayda da başlangıç çantası bir kez verilir
  // P28 (ahir.js, han.js, zafer.js): yoldaşlar, Han buff'ı ve çorba sayacı, Zafer Anıtı günlük ödülü. Eski kayda boş eklenir (sürüm artmaz).
  ahir: { own: {}, active: null, feedDay: 0, feeds: 0 }, han: { buff: null, soupDay: 0, soups: 0 }, zafer: { claimDay: 0, buffUntil: 0 },
});
// Kapı kaptanı ve boss aşamalarının ilk geçişi birer Yoldaş Beratı verir (modes.js); eski kayıt, geçtiği kadarını bir kez alır
const beratEarned = p => Object.keys(p.stages || {}).filter(id => { const d = stageDef(id); return d && d.kind !== 'mob' && p.stages[id] > 0; }).length;

export function upgradeState(p, now) {
  const d = DEFAULTS(now), six = p.pots === undefined; // iksir alanı yoksa 6 yuvalı savaş düzeni de henüz kurulmamıştır
  for (const k in d) if (p[k] === undefined) p[k] = d[k];
  if (p.v < 2) { delete p.bossDay; delete p.bossDone; }
  // v3: dört kalite üç nadirliğe indi (İyi ve Üstün → Nadir, Eşsiz 3 → 2). Kural tabandan okunur ve yinelenebilir.
  if (p.v < 3) for (const it of p.items || []) it.g = gradeOf(it.b, it.g);
  // v4: kadro. Dört kahraman yerinde kalır (kimlikleri sınıf anahtarıdır), sınıf ve ad alanı eklenir; parti düzeni kurulur.
  if (p.v < 4) {
    for (const c of CLASS_KEYS) { const h = p.heroes?.[c]; if (h) { h.cls = c; if (typeof h.name !== 'string') h.name = CLASSES[c].name; } }
    p.berat = beratEarned(p);
  }
  // v5: uzmanlık yolları (paths.js). Kahramanlar yetenekleri ve düzenleriyle aynen kalır; yol alanları boş eklenir
  // (yol, 30. seviyeden sonra yetenek ekranında seçilir). Yinelenebilir.
  if (p.v < 5) for (const h of Object.values(p.heroes || {})) { if (h.path === undefined) h.path = null; if (h.pn === undefined) h.pn = 0; if (h.ppas === undefined) h.ppas = null; }
  if (p.v < 6 && p.heroes) soloMigrate(p, now);
  if (six && p.heroes?.[MAIN]) fixLoadout(p, MAIN); // sürüm 12: 3 yuvalı eski düzen açık yeteneklerle 6 yuvaya tamamlanır
  // Öğretici adım listesi sürüm 2: 'battle'dan sonra 'bar' eklendi; yarım kalmış öğreticide sonraki adımların indisi bir kayar
  if (p.tut && p.tut.sv !== TUT_SV) { if (!p.tut.end && p.tut.s >= 2) p.tut.s++; p.tut.sv = TUT_SV; }
  // MP niteliği (19 Kas): Büyücüde büyüyü artık INT değil MP verir; eski kayıtta Büyücünün INT puanı MP'ye taşınır (bir kez)
  for (const h of Object.values(p.heroes || {})) if (h.pts && h.pts.mp === undefined) { h.pts.mp = 0; if ((h.cls || 'warrior') === 'mage' && h.pts.int) { h.pts.mp = h.pts.int; h.pts.int = 0; } }
  for (const it of p.items || []) { const m = minPlus(it.b); if ((it.p || 0) < m) it.p = m; } // takı dışı eşya en az +1 (19 Kas; yinelenebilir)
  if (p.v < STATE_VERSION) p.v = STATE_VERSION;
  if (p.premiumUntil !== undefined) { if (p.premiumUntil > now) p.premium = { tier: 2, until: p.premiumUntil }; delete p.premiumUntil; } // eski tek kademeli üyelik
  return p;
}

// Yeni karakter. cls: sınıf (verilmezse Savaşçı; yapay oyuncular kendi seçer) · look: görünüş (roster.js normLook'tan geçmiş;
// verilmezse ırk + sınıf varsayılanı). Adın biçimi burada gevşek denetlenir (validName); karakter adı kuralı ve teklik account.js'te.
// Savaşçı şimdilik eli boş başlar (kullanıcı kararı 19 Kas: Raptor STR 182+ ister, başlangıçta giyilemez)
export const STARTER_GEAR = { warrior: [], rogue: ['w:dagger:0', 'w:dagger:0'], priest: ['w:mace:0', 'w:shield:0'], mage: ['w:staff:0'] };
// Başlangıç eşyasının artısı (eşya kimliği → artı); şu an boş
export const STARTER_PLUS = {};
export function newPlayer({ name, faction, cls = 'warrior', look }, now) {
  if (!validName(name)) fail('bad-name', 'İsim 3-16 karakter olmalı (harf, rakam, boşluk).');
  if (!Object.hasOwn(FACTIONS, faction)) fail('bad-faction', 'Taraf seçilmedi.');
  if (!Object.hasOwn(CLASSES, cls)) fail('bad-class', 'Sınıf seçilmedi.');
  const p = {
    v: STATE_VERSION, name: name.trim(), faction, createdAt: now,
    lvl: 1, xp: 0, akce: 500, toz: 0, yakut: 0, stones: [3, 0, 0], charms: 0,
    energy: ENERGY.max, energyAt: now,
    heroes: {}, items: [], nextItem: 1, nextBattle: 1,
    stages: {}, marks: {}, codex: {}, battle: null,
    stats: { battles: 0, wins: 0, upOk: 0, upFail: 0, rejected: 0 },
    ...DEFAULTS(now),
  };
  p.tut.end = null; // yeni hesap öğreticiyle başlar
  p.avatar = 'h:' + cls;
  p.char = { ...(look || defaultLook(faction, cls)), race: faction, cls, name: p.name, createdAt: now };
  const h = p.heroes[MAIN] = { cls, name: p.name, pts: { str: 0, vit: 0, dex: 0, int: 0, mp: 0 }, tree: {}, act: [], pas: null, eq: {}, path: null, pn: 0, ppas: null };
  STARTER_GEAR[cls].forEach((b, i) => { const it = addItem(p, b, 0, { nt: 1, ...(STARTER_PLUS[b] ? { p: STARTER_PLUS[b] } : {}) }); h.eq[i ? 'wl' : 'wr'] = it.id; });
  fixLoadout(p, MAIN);
  return p;
}

// ---- Sürüm 6: tek karakter göçü ----
// Eski parti kaydı: ana kahraman = Sefer düzeninin lideri (kopya değilse), yoksa en güçlü kendi kahramanı. Bu kahraman 'h0'
// kimliğine taşınır; sınıfı karakterin sınıfı olur, görünüş ırk + sınıf varsayılanıdır. Öbür kahramanlar silinir; üzerlerindeki
// eşyalar zaten çantadaki kayıtlardır (çanta sayımı kuşanılanları da içerir), yalnızca kuşanılmış olmaktan çıkar, kaybolmaz.
// Kopya yerleri ve parti düzenleri kalkar. İkinci kopya yeri gerçek parayla alınmışsa p.solo.refund kadar Yakut postası
// (world.js mail.list, sanal posta) bekler. Yinelenebilir: sürüm 6 olan kayıt bir daha göçmez.
export const COPY_REFUND = 600; // 'kopya2' ($4.99) karşılığı: aynı fiyatlı Yakut Sandığı
export function soloMigrate(p, now) {
  const ids = Object.keys(p.heroes).filter(id => p.heroes[id] && !p.heroes[id].copy);
  if (!ids.length) return;
  let main = mainId(p) === MAIN && p.heroes[MAIN] && !p.heroes[MAIN].copy ? MAIN : null;
  const lead = Array.isArray(p.party?.pve) ? p.party.pve.find(id => ids.includes(id)) : null;
  if (!main) main = lead || ids.reduce((a, id) => { const pa = power(heroUnit(p, a)), pb = power(heroUnit(p, id)); return pb > pa ? id : a; }, ids[0]);
  const h = p.heroes[main], cls = h.cls || main;
  h.cls = cls; h.name = p.name; // karakterin adı oyuncunun adıdır (kahramana verilmiş eski ad bırakılır)
  const others = ids.filter(id => id !== main).length;
  p.heroes = { [MAIN]: h };
  delete p.party; delete p.nextHero;
  p.char = p.char || { ...defaultLook(p.faction, cls), race: p.faction, cls, name: p.name, createdAt: p.createdAt || now };
  if (typeof p.avatar !== 'string' || p.avatar.startsWith('h:')) p.avatar = 'h:' + cls;
  const S = p.solo = { at: now, from: main, others, refund: 0, got: 0 };
  if (p.pay?.copy) { S.refund = COPY_REFUND; p.pay.copyRefund = COPY_REFUND; }
  fixLoadout(p, MAIN);
  if (p.battle) p.battle = null; // eski partiyle başlamış yarım savaş kapatılır (bedeli iade edilmez; istemci de açılışta kapatır)
}

export function regen(p, now) {
  if (p.energy >= ENERGY.max) { p.energyAt = now; return; }
  const n = Math.floor((now - p.energyAt) / ENERGY.regenMs);
  if (n > 0) { p.energy = Math.min(ENERGY.max, p.energy + n); p.energyAt = p.energy >= ENERGY.max ? now : p.energyAt + n * ENERGY.regenMs; }
}
// Her işlemden önce: kayıt biçimi, enerji, gün ve hafta sıfırlamaları
export function tick(p, now) {
  upgradeState(p, now);
  regen(p, now);
  const d = dayKey(now), w = weekKey(now);
  if (p.daily.day !== d) p.daily = { day: d, q: {}, qdone: {}, boss: {} };
  if (p.weekly.week !== w) p.weekly = { week: w };
  const mk = monthKey(now);
  if (!p.monthly || p.monthly.month !== mk) p.monthly = { month: mk, q: {}, done: {} };
  pvpTick(p, now); // meydan sezonu ve haftalık yumuşak sıfırlama, sezon unvanı, Yeraltı Ocağı dönemi
}
// Etkin üyelik kademesi (0 = yok) ve o kademenin ayrıcalıkları
export const premTier = (p, now) => p.premium && p.premium.until > now ? p.premium.tier : 0;
export const perks = (p, now) => PREMIUM[premTier(p, now)];
