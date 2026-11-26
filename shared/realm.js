// Irk ve diyar: Irk Hazinesi, Başbuğ seçimi, ulufe, bölge hâkimiyeti, gün/gece ve hava.
// Bu dosya içerik tablolarını ve saf hesapları taşır; gizli bir şey içermez ve istemciye sunulur (arayüz aynı sayıları
// okur). Kurallar (kim neyi yapabilir, paylaşılan belgeler) realmops.js'tedir.
import { FACTIONS, dayKey, weekKey, hourOf, withPct } from './content.js';
import { ZONES } from './zones.js';
import { rng } from './rng.js';
import { FOG_UP } from './items.js';

export const HOUR = 3600000, DAY = 24 * HOUR;
export const isFaction = f => typeof f === 'string' && Object.hasOwn(FACTIONS, f);
export const otherFaction = f => (f === 'ocak' ? 'sancak' : 'ocak');
const dayStart = d => d * DAY - 3 * HOUR;
export const weekStartAt = w => dayStart(w * 7 - 3); // weekKey → o haftanın pazartesi 00:00'ı (UTC+3)

// ---------- Başbuğ (ırkın haftalık seçilen önderi) ----------
// Bir haftanın oyları ertesi haftanın Başbuğunu belirler; sonuç pazartesi 00:00'da (UTC+3) kesinleşir.
//  aday: en az candLvl seviye, elinde en az candSan Şan, candAgeDays günlük hesap ve deposit akçe depozito
//  seçmen: en az voteLvl seviye ve voteAgeDays günlük hesap; hesap başına haftada tek oy, oy değiştirilemez
//  depozito: kazanan ve oyların en az refundPct'ini alan adaylara geri döner; kalanı Irk Hazinesi'ne kalır
export const KINGDOM = {
  title: 'Başbuğ', court: 'Otağ', treasury: 'Irk Hazinesi',
  candLvl: 40, candSan: 500, candAgeDays: 7, deposit: 20000, maxCands: 12, sloganMax: 60,
  voteLvl: 20, voteAgeDays: 7, refundPct: 10,
};
// ---------- Ulufe (Başbuğun hazineden dağıttığı akçe) ----------
//  perGrantPm: tek ulufe, o anki hazinenin binde 3'ünü geçemez · weeklyPct: bir haftada dağıtılan toplam, hafta başındaki
//  hazinenin %20'sini geçemez · recipientPct: bir alıcının haftalık toplamı, hafta başındaki hazinenin %1'ini geçemez
//  gapMs: iki ulufe arası bekleme · recipientGapMs: aynı alıcıya iki ulufe arası bekleme
//  alıcı: aynı ırktan, en az minLvl seviye ve minAgeDays günlük, yasaklı olmayan başka bir hesap
export const GRANT = { name: 'Ulufe', perGrantPm: 3, weeklyPct: 20, recipientPct: 1, min: 100, gapMs: 60000, recipientGapMs: DAY, minLvl: 20, minAgeDays: 3, ledger: 50 };
export const grantMax = gold => Math.floor(Math.max(0, gold) * GRANT.perGrantPm / 1000);
export const weeklyCap = base => Math.floor(Math.max(0, base) * GRANT.weeklyPct / 100);
export const recipientCap = base => Math.floor(Math.max(0, base) * GRANT.recipientPct / 100);
// Şu an verilebilecek en büyük ulufe (alıcıdan bağımsız üst sınır): tek ulufe sınırı ve haftadan kalan pay
export const grantRoom = R => Math.max(0, Math.min(grantMax(R.gold), weeklyCap(R.base) - R.given, R.gold));
// ---------- Ferman (Başbuğun ırk sohbetine sabitlenen kısa duyurusu) ----------
export const DECREE = { name: 'Ferman', max: 120, gapMs: 30 * 60000, perDay: 6 };

// ---------- Bölge hâkimiyeti ----------
// Dört bölge her hafta, o hafta orada kazanılan zaferlere göre el değiştirir. Büyük ırk sırf kalabalık olduğu için
// kazanmasın diye puan etkin nüfusa bölünür:
//   bölge puanı = 1000 × (ırkın o bölgedeki zafer puanı) / max(minPop, ırkın etkin oyuncu sayısı)
//   zafer puanı: yaratık aşaması 1, kapı aşaması 2, günlük boss 5 (seri savaş dahil)
//   etkin oyuncu: o hafta bölgelerde en az activeWins zafer kazanmış hesap
// Puanı yüksek olan ırk ertesi hafta bölgeye hâkim olur; eşitlikte (ya da kimse savaşmadıysa) bölge sahibinde kalır.
// Hâkim ırkın oyuncuları o bölgenin aşamalarında bonusPct kadar fazla akçe ya da eşya düşürür (bölgeye göre: zones).
export const TERR = { bonusPct: 15, minPop: 5, activeWins: 3, flushMs: 5 * 60000, pts: { mob: 1, gate: 2, boss: 5 }, zones: { 1: 'akce', 2: 'drop', 3: 'akce', 4: 'drop' } };
export const ZONE_IDS = ZONES.map(z => z.id);
export const zoneBonusKind = z => (Object.hasOwn(TERR.zones, z) ? TERR.zones[z] : null);
export const zoneBonusText = z => (zoneBonusKind(z) === 'akce' ? `Akçe +%${TERR.bonusPct}` : `Eşya düşme oranı +%${TERR.bonusPct}`);
export const terrScore = (pts, active) => Math.round(1000 * Math.max(0, pts) / Math.max(TERR.minPop, active || 0));
export const zoneWinner = (so, ss, prev) => (so > ss ? 'ocak' : ss > so ? 'sancak' : prev || null);
// Oyuncunun kaydındaki hâkimiyet özeti (p.terr.own = { week, z: [sahip × 4] }) yalnızca yazıldığı hafta geçerlidir
export const zoneOwnerFor = (p, zone, now) => { const o = p.terr?.own; return o && o.week === weekKey(now) && Array.isArray(o.z) ? o.z[ZONE_IDS.indexOf(zone)] || null : null; };
// Bu oyuncu bu bölgede hâkimiyet bonusu alıyor mu: 'akce' | 'drop' | null (sunucu ve arayüz aynı işlevi kullanır)
export const zoneBonusFor = (p, zone, now) => (zoneOwnerFor(p, zone, now) === p.faction ? zoneBonusKind(zone) : null);
export const zoneMult = () => withPct(1, TERR.bonusPct);
// Oyuncu kaydındaki alanlar (biçim state.js DEFAULTS'ta; eski kayıtlarda eksikse burada tamamlanır)
export const realmState = p => { const K = p.realm || (p.realm = {}); if (!Number.isInteger(K.week)) K.week = 0; if (K.vote === undefined) K.vote = null; if (!Number.isInteger(K.ruled)) K.ruled = 0; return K; };
export function terrState(p) {
  const T = p.terr || (p.terr = {});
  if (!Number.isInteger(T.week)) T.week = 0;
  if (!Number.isInteger(T.wins)) T.wins = 0;
  if (!Array.isArray(T.pend) || T.pend.length !== ZONE_IDS.length) T.pend = ZONE_IDS.map(() => 0);
  T.counted = !!T.counted; if (!Number.isFinite(T.flushAt)) T.flushAt = 0; if (T.own === undefined) T.own = null;
  return T;
}
// Bölge aşamasında kazanılan zafer: puan oyuncu kaydında bekler, ırkın haftalık belgesine realmops.js yazar.
// Dönen değer zaferin puanıdır (yaratık 1, kapı 2, boss 5).
export function terrWin(p, def, now) {
  const i = ZONE_IDS.indexOf(def.zone), T = terrState(p), W = weekKey(now);
  if (i < 0) return 0;
  if (T.week !== W) { T.week = W; T.wins = 0; T.counted = false; T.pend = ZONE_IDS.map(() => 0); } // savaş hafta dönümünü aştıysa
  const pts = TERR.pts[def.kind] || TERR.pts.mob;
  T.pend[i] += pts; T.wins++;
  return pts;
}

// ---------- Oyun saati (UTC+3) ve günün evreleri ----------
export const PHASES = { dawn: { name: 'Şafak', from: 5 }, day: { name: 'Gündüz', from: 8 }, dusk: { name: 'Akşam', from: 18 }, night: { name: 'Gece', from: 21 } };
export const phaseOf = now => { const h = hourOf(now); return h >= PHASES.night.from || h < PHASES.dawn.from ? 'night' : h < PHASES.day.from ? 'dawn' : h < PHASES.dusk.from ? 'day' : 'dusk'; };
const two = n => String(n).padStart(2, '0');
export const clockOf = now => { const m = Math.floor((now + 3 * HOUR) / 60000); return `${two(Math.floor(m / 60) % 24)}:${two(m % 60)}`; };

// ---------- Hava ----------
// Takvim herkes için aynıdır ve tarihten belirlenimci türetilir: gün, altışar saatlik dört dilime bölünür (00, 06, 12, 18;
// UTC+3) ve her dilimin havası dilim numarasının özetinden ağırlıklı seçilir. Yani yarının havası bugünden bellidir.
// Bonuslar küçüktür ve sunucuda uygulanır:
//   rain  Maden üretimi +%minePct (yalnızca yağmurlu saatlerde biriken cevhere)
//   fog   Örste başarı şansı ×(1 + rel), en çok +cap puan ve %100'ü geçmez (items.js: FOG_UP, upOdds)
//   wind  Bölge aşamalarından kazanılan deneyim +%stageXpPct
export const WEATHER = {
  clear: { name: 'Açık', w: 40, line: 'Bonus yok, kayıp yok.', bonus: '', cost: '' },
  rain:  { name: 'Yağmur', w: 22, minePct: 10, stageAkcePct: -5 },
  fog:   { name: 'Sis', w: 19, rel: FOG_UP.rel, cap: FOG_UP.cap, stageXpPct: -5 },
  wind:  { name: 'Poyraz', w: 19, stageXpPct: 5, minePct: -5 },
};
// Her havanın bir bonusu ve bir bedeli vardır (hepsi küçük, hepsi savaş dışı; savaş motoru etkilenmez).
//   rain  bonus: maden +%10 · bedel: bölge aşamalarında akçe -%5
//   fog   bonus: örs şansı · bedel: bölge aşamalarında deneyim -%5
//   wind  bonus: bölge aşamalarında deneyim +%5 · bedel: maden -%5 (yalnızca poyrazlı saatlerde biriken cevhere)
WEATHER.rain.bonus = `Maden üretimi +%${WEATHER.rain.minePct}`; WEATHER.rain.cost = `Bölge savaşlarında akçe -%${-WEATHER.rain.stageAkcePct}`;
WEATHER.fog.bonus = `Örste başarı şansı +%${Math.round(FOG_UP.rel * 100)} (oransal; en çok +${Math.round(FOG_UP.cap * 100)} puan)`; WEATHER.fog.cost = `Bölge savaşlarında deneyim -%${-WEATHER.fog.stageXpPct}`;
WEATHER.wind.bonus = `Bölge savaşlarında deneyim +%${WEATHER.wind.stageXpPct}`; WEATHER.wind.cost = `Maden üretimi -%${-WEATHER.wind.minePct}`;
for (const k of ['rain', 'fog', 'wind']) WEATHER[k].line = `${WEATHER[k].bonus} · Bedel: ${WEATHER[k].cost}`;
// Dar yerler (tahmin satırı) için kısa yazım
WEATHER.clear.short = ''; WEATHER.rain.short = `Maden +%${WEATHER.rain.minePct} · akçe -%5`; WEATHER.fog.short = `Örs +%${Math.round(FOG_UP.rel * 100)} · deneyim -%5`; WEATHER.wind.short = `Deneyim +%${WEATHER.wind.stageXpPct} · maden -%5`;
export const WEATHER_KEYS = Object.keys(WEATHER);
export const SLOT_HOURS = 6, SLOT_MS = SLOT_HOURS * HOUR;
export const slotOf = now => Math.floor((now + 3 * HOUR) / SLOT_MS);
export const slotStart = slot => slot * SLOT_MS - 3 * HOUR;
const W_TOTAL = WEATHER_KEYS.reduce((a, k) => a + WEATHER[k].w, 0);
export function weatherOfSlot(slot) {
  let r = rng(Math.imul(slot ^ 0x5bd1e995, 0x9e3779b1) >>> 0)() * W_TOTAL;
  for (const k of WEATHER_KEYS) { r -= WEATHER[k].w; if (r < 0) return k; }
  return 'clear';
}
export const weatherAt = now => weatherOfSlot(slotOf(now));
// [from, to] aralığında verilen havanın sürdüğü saat (kesirli). Maden birikimi bununla hesaplanır.
export function weatherHours(kind, from, to) {
  if (!(to > from)) return 0;
  let ms = 0;
  for (let s = slotOf(from), n = 0; slotStart(s) < to && n < 200; s++, n++) if (weatherOfSlot(s) === kind) ms += Math.min(to, slotStart(s + 1)) - Math.max(from, slotStart(s));
  return ms / HOUR;
}
// Bugünün kalan ve yarının bütün dilimleri: [{ k, from, to, now }]
export function forecast(now) {
  const out = [], end = dayStart(dayKey(now) + 2);
  for (let s = slotOf(now); slotStart(s) < end; s++) out.push({ k: weatherOfSlot(s), from: slotStart(s), to: slotStart(s + 1), now: s === slotOf(now) });
  return out;
}
// Örste sisin etkisi: taban şansa eklenen pay (sunucu ve arayüz aynı sayıyı kullanır)
export const fogNow = now => weatherAt(now) === 'fog';
export const stageXpPct = now => WEATHER[weatherAt(now)].stageXpPct || 0; // poyraz +, sis -
export const stageAkcePct = now => WEATHER[weatherAt(now)].stageAkcePct || 0; // yağmur -
