// Klan içeriği: seviyeler, rütbeler ve yetkiler, klan görevleri, Oba Dükkânı, bağış, Oba Avı kademeleri ve
// sıralama ödülleri, sancak (renk çifti + amblem) ve pelerin tabloları. Saf veridir ve istemciye sunulur:
// sunucu kuralları (shared/clanrules.js) ile arayüz aynı tabloyu okur, yani ekrandaki sayı sunucunun hesabıdır.
import { dayKey } from './content.js';

// ---- Seviye: xp = bir sonraki seviye için gereken klan deneyimi · cap = üye sınırı · huntAkce = Oba Avı akçesine ek yüzde ----
export const CLAN_LEVELS = [
  { xp: 2000,   cap: 20, huntAkce: 0 },
  { xp: 5000,   cap: 22, huntAkce: 5 },
  { xp: 10000,  cap: 24, huntAkce: 5 },
  { xp: 20000,  cap: 26, huntAkce: 10 },
  { xp: 40000,  cap: 30, huntAkce: 10 },
  { xp: 70000,  cap: 32, huntAkce: 15 },
  { xp: 120000, cap: 35, huntAkce: 15 },
  { xp: 200000, cap: 38, huntAkce: 20 },
  { xp: 350000, cap: 42, huntAkce: 20 },
  { xp: 0,      cap: 50, huntAkce: 25 },
];
export const CLAN_MAX_LEVEL = CLAN_LEVELS.length;
const lvlOk = lvl => (Number.isInteger(lvl) && lvl >= 1 && lvl <= CLAN_MAX_LEVEL ? lvl : 1);
export const clanLevel = lvl => CLAN_LEVELS[lvlOk(lvl) - 1];
// fac: karargâh tesisleri ({ sancak: seviye, ... }); Sancak Salonu üye sınırını büyütür
export const clanCap = (lvl, fac) => clanLevel(lvl).cap + hqLvl(fac, 'sancak') * HQ_FAC.sancak.per;
// Klan deneyiminin kaynakları: bağış (akçe başına), Oba Avı saldırısı, kuşatma saldırısı, kazanılan savaş
export const CLAN_XP = { donatePer: 20, hunt: 40, siege: 30, win: 2 };
// Oba Nişanı (klan katkı parası): bağış (akçe başına), Oba Avı ve kuşatma saldırısı, görev ve sıralama ödülleri
export const NISAN = { name: 'Oba Nişanı', donatePer: 100, hunt: 20, siege: 15 };
// Bağış: akçe; kişi başına günlük sınır (akçe çıkış kapısı)
export const CLAN_DONATE = { steps: [1000, 5000, 20000], cap: 20000, caps: [{ lvl: 50, cap: 40000 }, { lvl: 70, cap: 60000 }] };
// Günlük sınır seviyeyle büyür (ekonomi modeli: geç oyunda akçe gelirinin yanında 20.000 küçük kalıyordu)
export const donateCap = lvl => CLAN_DONATE.caps.findLast(c => lvl >= c.lvl)?.cap || CLAN_DONATE.cap;

// ---- Rütbeler ve yetkiler ----
// order: büyük olan üstündür · max: o rütbeden en çok kaç üye olabilir
export const RANKS = {
  reis:     { name: 'Reis',     order: 3, max: 1 },
  yardimci: { name: 'Yardımcı', order: 2, max: 2 },
  kidemli:  { name: 'Kıdemli',  order: 1, max: 6 },
  uye:      { name: 'Üye',      order: 0, max: Infinity },
};
export const RANK_KEYS = Object.keys(RANKS);
export const rankOf = m => (m && typeof m.rank === 'string' && Object.hasOwn(RANKS, m.rank) ? m.rank : 'uye');
// Yetki → gereken en düşük rütbe sırası. kick ve rank ayrıca yalnızca KENDİNDEN DÜŞÜK rütbeye uygulanır.
export const PERMS = {
  invite:   { min: 1, name: 'Davet etme, başvuru onaylama' },
  hq:       { min: 2, name: 'Karargâh tesislerini yükseltme' },
  hunt:     { min: 1, name: 'Azgın Av başlatma' },
  kick:     { min: 2, name: 'Üye çıkarma' },
  rank:     { min: 2, name: 'Rütbe verme' },
  notice:   { min: 2, name: 'Duyuru ve üye alım ayarı' },
  banner:   { min: 3, name: 'Sancak ve pelerin' },
  transfer: { min: 3, name: 'Reisliği devretme' },
};
export const can = (rank, perm) => RANKS[Object.hasOwn(RANKS, rank) ? rank : 'uye'].order >= PERMS[perm].min;
// Reis bu kadar gün hiç giriş yapmazsa reislik kendiliğinden en kıdemli etkin üyeye geçer
export const SUCCESSION_DAYS = 14;

// ---- Klan görevleri (ortak hedefler). per: 'day' | 'week' · key: klan sayacı · xp: klana · nisan/give: ödülü alan her üyeye ----
export const CLAN_QUESTS = [
  { id: 'av',      per: 'day',  name: 'Av Seferi',       key: 'hunts', need: 5,       unit: 'Oba Avı saldırısı',       xp: 150, nisan: 30 },
  { id: 'zafer',   per: 'day',  name: 'Savaş Borusu',    key: 'wins',  need: 40,      unit: 'kazanılan savaş',         xp: 150, nisan: 30 },
  { id: 'kese',    per: 'day',  name: 'Ortak Kese',      key: 'don',   need: 20000,   unit: 'akçe bağış',              xp: 100, nisan: 20 },
  { id: 'buyukav', per: 'week', name: 'Büyük Av',        key: 'dmg',   need: 2000000, unit: 'Oba Avı hasarı',          xp: 800, nisan: 120, give: [{ t: 'stone', g: 1, n: 2 }] },
  { id: 'hisar',   per: 'week', name: 'Hisar Yolu',      key: 'siege', need: 6000,    unit: 'kuşatma puanı',           xp: 800, nisan: 120, give: [{ t: 'charm', n: 1 }] },
  { id: 'bereket', per: 'week', name: 'Bereketli Hafta', key: 'don',   need: 150000,  unit: 'akçe bağış',              xp: 600, nisan: 100, give: [{ t: 'stone', g: 0, n: 5 }] },
];

// ---- Oba Dükkânı: Oba Nişanı ile; lvl = rafın açıldığı klan seviyesi · max = kişi başına haftalık sınır ----
export const CLAN_SHOP = [
  { id: 'tas0',  name: '3 Kaba Bileği Taşı', lvl: 1, cost: 30,  max: 10, give: { t: 'stone', g: 0, n: 3 } },
  { id: 'erzak', name: 'Oba Erzağı',         lvl: 1, cost: 50,  max: 7,  give: { t: 'energy', n: 30 }, desc: '+30 enerji' },
  { id: 'tas1',  name: 'İnce Bileği Taşı',   lvl: 3, cost: 60,  max: 6,  give: { t: 'stone', g: 1, n: 1 } },
  { id: 'muska', name: 'Uğur Muskası',       lvl: 5, cost: 120, max: 3,  give: { t: 'charm', n: 1 }, desc: 'Örste seviye kaybını ve kırılmayı önler' },
  { id: 'muhur', name: 'Mühür Taşı',         lvl: 7, cost: 150, max: 2,  give: { t: 'seal', n: 1 }, desc: 'Mühürlü Oda anahtarı' },
  { id: 'tas2',  name: 'Usta Bileği Taşı',   lvl: 9, cost: 250, max: 2,  give: { t: 'stone', g: 2, n: 1 } },
];

// ---- Oba Avı ----
// Kademe: lvl = açıldığı klan seviyesi · hp/atk = Tepegöz'ün çarpanları · credit = verilen hasarın klana yazılan yüzdesi.
// Olağan Av her gün kendiliğinden açıktır; Azgın ve Kudurmuş Av'ı yetkili bir üye, o gün ilk hasar yazılmadan önce başlatır.
export const HUNT_DIFF = [
  { name: 'Olağan Av',   lvl: 1, hp: 1,   atk: 1,    credit: 100 },
  { name: 'Azgın Av',    lvl: 4, hp: 1.6, atk: 1.3,  credit: 125 },
  { name: 'Kudurmuş Av', lvl: 8, hp: 2.4, atk: 1.65, credit: 160 },
];
// Günlük hasar sıralaması ödülü (gün dönümünde postayla). to = bu sıraya kadar · min = o gün hasar yazan en az üye sayısı
// (tek kişilik klan kendi kendine birincilik ödülü üretemesin). Koşulu tutmayan basamak bir alttakine düşer.
export const HUNT_RANK = [
  { to: 1,  min: 5, nisan: 60, give: [{ t: 'yakut', n: 15 }, { t: 'stone', g: 1, n: 2 }] },
  { to: 3,  min: 5, nisan: 40, give: [{ t: 'yakut', n: 8 }, { t: 'stone', g: 1, n: 1 }] },
  { to: 10, min: 8, nisan: 25, give: [{ t: 'stone', g: 0, n: 3 }] },
  { to: Infinity, min: 1, nisan: 10, give: [{ t: 'stone', g: 0, n: 1 }] },
];
// Oyuncunun bugünkü av kademesi: klan ekranını açınca kaydına yazılır (p.hunt); başka klanın ya da dünün kaydı geçmez
export const huntDiffOf = (p, now) => (p.hunt && p.hunt.day === dayKey(now) && p.hunt.clan === p.clan && Number.isInteger(p.hunt.diff) && p.hunt.diff > 0 && p.hunt.diff < HUNT_DIFF.length ? p.hunt.diff : 0);
export const huntRankReward = (place, dealers) => HUNT_RANK.find(r => place <= r.to && dealers >= r.min);
// Sandık kademelerinin ödülleri (eşikler content.js CLAN.tiers)
export const HUNT_CHESTS = [
  [{ t: 'stone', g: 0, n: 3 }],
  [{ t: 'stone', g: 1, n: 2 }],
  [{ t: 'stone', g: 2, n: 1 }, { t: 'charm', n: 1 }],
  [{ t: 'yakut', n: 20 }, { t: 'seal', n: 1 }],
];

// ---- Sancak: renk çifti (zemin, desen) + amblem; pelerin rengi ayrı seçilir ----
export const BANNER_PAIRS = [
  ['#8a1c1c', '#f2c84b'], ['#1c3c9c', '#e8eef6'], ['#1f5a32', '#f0d890'], ['#2a2a30', '#d94a3a'],
  ['#5a2a7a', '#e7c75a'], ['#b8621a', '#2a1a10'], ['#0f5a6a', '#f4e9c8'], ['#e8dcc8', '#8a1c1c'],
  ['#3a2616', '#e7a84a'], ['#6a1030', '#f0c0c8'], ['#16324a', '#7fd1ff'], ['#4a5a1a', '#f6f0d0'],
  ['#d9b04a', '#2a2018'], ['#7a8794', '#16202a'], ['#101418', '#c8ccd2'], ['#a83a5a', '#fff0d0'],
];
export const CAPE_COLORS = ['#7a1616', '#1c3c9c', '#1f5a32', '#24242a', '#5a2a7a', '#a8581a', '#0f5a6a', '#d8ccb4', '#4a2c18', '#6a1030', '#16324a', '#b89a3a'];
// Amblemler (kimlik → ad). Şekil yolları public/js/emblems.js içindedir (tools/build-emblem-icons.js üretir).
// Yalnızca hayvan, silah, alet ve doğa motifleri: inanç simgesi yoktur.
export const EMBLEMS = {
  kurt: 'Kurt', kartal: 'Kartal', at: 'At', boynuz: 'Boynuz', geyik: 'Geyik', ayi: 'Ayı', domuz: 'Yaban Domuzu', yilan: 'Yılan',
  aslan: 'Aslan', tilki: 'Tilki', baykus: 'Baykuş', kuzgun: 'Kuzgun', ejder: 'Ejder', pence: 'Pençe',
  balta: 'Balta', yay: 'Yay', mizrak: 'Mızraklar', temren: 'Temren', migfer: 'Miğfer',
  ors: 'Örs', cekic: 'Çekiç', boru: 'Av Borusu', nal: 'Nal',
  dag: 'Dağ', cam: 'Çam', yaprak: 'Meşe Yaprağı', alev: 'Alev', gunes: 'Güneş', basak: 'Başak', simsek: 'Şimşek',
  burc: 'Burç', cadir: 'Oba Çadırı',
};
export const EMBLEM_KEYS = Object.keys(EMBLEMS);
// Sancak kaydı: { a: renk çifti indisi, s: amblem kimliği, c: pelerin rengi indisi }
export const validBanner = b => !!b && Number.isInteger(b.a) && b.a >= 0 && b.a < BANNER_PAIRS.length && typeof b.s === 'string' && Object.hasOwn(EMBLEMS, b.s)
  && Number.isInteger(b.c) && b.c >= 0 && b.c < CAPE_COLORS.length;
// Klan adından türeyen varsayılan sancak (her klanın kurulduğu an bir sancağı olur)
export function defaultBanner(name) {
  let h = 2166136261;
  for (const ch of String(name)) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619) >>> 0; }
  const a = h % BANNER_PAIRS.length;
  return { a, s: EMBLEM_KEYS[(h >>> 8) % EMBLEM_KEYS.length], c: a % CAPE_COLORS.length };
}

// ---- Pelerin: boyu klan seviyesiyle basamak basamak uzar. len = omuzdan aşağı uzunluk (omuz yüksekliğinin oranı) ----
export const CAPE_STEPS = [
  { lvl: 1,  len: 0.30, name: 'Omuz pelerini' },
  { lvl: 3,  len: 0.44, name: 'Sırt pelerini' },
  { lvl: 5,  len: 0.58, name: 'Bel pelerini' },
  { lvl: 7,  len: 0.74, name: 'Diz pelerini' },
  { lvl: 9,  len: 0.90, name: 'Topuk pelerini' },
  { lvl: 10, len: 1.12, name: 'Yer süpüren pelerin' },
];
export const capeStep = lvl => CAPE_STEPS.findLastIndex(s => lvlOk(lvl) >= s.lvl);
// Oyuncu kaydındaki klan özeti (p.clanTag) → kahraman biriminin taşıdığı pelerin: { c: renk, a: çift, s: amblem, l: boy basamağı }
export const capeOf = tag => (tag && validBanner(tag.b) ? { c: tag.b.c, a: tag.b.a, s: tag.b.s, l: capeStep(tag.lvl) } : null);

// Ödül kısıtı: klana bugün katılan üye o günün sandık ve günlük görev ödülünü alamaz (klandan klana gezerek ödül toplanmasın).
// Klanın kurulduğu gün ve o gün ava hasar yazmış üye bu kısıtın dışındadır.
export const joinedToday = (m, now) => dayKey(m.joined || 0) === dayKey(now);

// ---- Klan Karargâhı: ortak üs. Karargâh seviyesi klan seviyesidir; tesisler klan hazinesinden (bağışlanan akçe) yükseltilir ----
// per: seviye başına etki · cost: her seviyenin hazine akçesi bedeli · tesis seviyesi en çok hqCap(klan seviyesi) olur
// Etkiler: talim → PvE savaşta kahramanların saldırı/büyü gücü (modes.js startBattle) · demirhane → örs akçesi (items.js upFee)
// ambar → maden üretimi (calc.js mineRate) · gozcu → Meydan savunma kaydında can ve savunma (world.js arena.list) · sancak → üye sınırı
export const HQ_FAC = {
  talim:     { name: 'Talim Meydanı', per: 2,  unit: '%', desc: 'Savaşta (yaratıklara karşı) saldırı ve büyü gücü', cost: [15000, 45000, 120000, 270000, 600000] },
  demirhane: { name: 'Demirhane',     per: -2, unit: '%', desc: 'Örs akçe maliyeti',                                 cost: [12000, 36000, 96000, 216000, 480000] },
  ambar:     { name: 'Ambar',         per: 3,  unit: '%', desc: 'Maden üretimi',                                     cost: [12000, 36000, 96000, 216000, 480000] },
  gozcu:     { name: 'Gözcü Kulesi',  per: 2,  unit: '%', desc: 'Meydan savunmasında can ve savunma',                cost: [15000, 45000, 120000, 270000, 600000] },
  sancak:    { name: 'Sancak Salonu', per: 2,  unit: '',  desc: 'Klan üye sınırı',                                   cost: [20000, 60000, 160000, 360000, 800000] },
};
export const HQ_KEYS = Object.keys(HQ_FAC);
export const HQ_MAX = 5;
export const hqCap = lvl => Math.min(HQ_MAX, Math.ceil(lvlOk(lvl) / 2));
export const hqLvl = (fac, id) => { const v = fac && Object.hasOwn(HQ_FAC, id) ? fac[id] : 0; return Number.isInteger(v) && v > 0 ? Math.min(HQ_MAX, v) : 0; };
export const hqCost = (id, to) => HQ_FAC[id].cost[to - 1];
// Yükseltme SÜRELİDİR: hazineden ödenir, bitiş zamanı kayıtta (d.hq.up = { id, to, at, end }); aynı anda bir tesis yükselir.
// Süre hedef seviyeye göre: 10 dk, 40 dk, 2 sa, 4 sa, 8 sa (ileride ittifak yardımı bu süreyi kısaltabilir: up.end öne çekilir)
export const HQ_TIME = [10, 40, 120, 240, 480].map(m => m * 60000);
export const hqTime = to => HQ_TIME[Math.min(HQ_MAX, Math.max(1, to)) - 1];
// Süresi dolan yükseltmeyi işler; tamamlandıysa { id, to } döner
export const hqTick = (d, now) => {
  const u = d.hq && d.hq.up;
  if (!u || !(now >= u.end)) return null;
  d.hq.up = null;
  if (Object.hasOwn(HQ_FAC, u.id)) d.hq.fac[u.id] = Math.max(hqLvl(d.hq.fac, u.id), Math.min(HQ_MAX, u.to));
  return u;
};
// Oyuncunun klanının tesis etkisi (yüzde ya da sayı); klansız ya da eski kayıtta 0
export const hqPct = (p, id) => (p && p.clan && p.clanTag ? hqLvl(p.clanTag.f, id) * HQ_FAC[id].per : 0);
// Kayıt eski olabilir: hazine ve tesisler yoksa boş yazılır
export const hqNorm = d => {
  d.hq ||= { tre: 0, fac: {}, tot: 0 };
  if (!(d.hq.tre > 0)) d.hq.tre = 0;
  if (!d.hq.fac || typeof d.hq.fac !== 'object') d.hq.fac = {};
  if (d.hq.up && !(d.hq.up.end > 0 && Object.hasOwn(HQ_FAC, d.hq.up.id))) d.hq.up = null;
  d.hq.up ||= null;
  return d.hq;
};
