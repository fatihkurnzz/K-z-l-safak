// Hile koruması: ihlal kaydı, puan ve yasak; savaş süresi tabanı; istek biçimi, pazar fiyatı ve meydan sınırları.
// Saf JS'tir (çevrimdışı deneme sürümünde tarayıcıda da yüklenir); gerçek sunucu bu dosyayı istemciye sunmaz.
// Puanlama, yasak ve süre denetimi yalnızca env.guard açıkken çalışır (gerçek sunucuda varsayılan açık; testler,
// simülasyon ve yük testi env.guard vermez).
// Sınırlar (fiyat aralığı, aynı rakip sınırı, girdi denetimleri) oyun kuralıdır ve her zaman geçerlidir.
// Bütün eşikler aşağıdaki GUARD tablosundadır.
import { GameError, fail } from './util.js';
import { refPrice, upFee, stoneGrade, upOdds, normItem, SAFE_PLUS, UP_STONES, STONES, REFORGE, minPlus } from './items.js';
import { newGuard } from './state.js';

const HOUR = 3600000, DAY = 24 * HOUR;

export const GUARD = {
  // İhlal ağırlıkları (puan). replay: sunucu tekrarından geçmeyen hamle listesi · speed: imkânsız hızda biten savaş
  // dev: üretimde test komutu denemesi · rate: istek sınırına ısrarla çarpma
  // replay daha hafiftir: güncelleme sırasında açık kalmış eski bir sekme de (ikinci cihazda) aynı reddi üretebilir
  weight: { replay: 30, speed: 40, dev: 20, rate: 10 },
  decayPerDay: 10, // puan günde bu kadar erir; yasak süresince erimez
  staleFree: 5,    // sürüm güncellemesinden sonra, doğrulanmış ilk savaşa kadar puanlanmayan hamle listesi reddi sayısı
  // Puan eşikleri: bir ihlal puanı eşiğin üstüne taşıdığında (ya da üstündeyken yinelendiğinde) o eşiğin cezası başlar
  bans: [{ score: 100, ms: DAY }, { score: 200, ms: 7 * DAY }, { score: 300, perm: true }],
  // Savaş süresi tabanı. İstemci (public/js/combat.js) her turu oynatır: hamleli tur en az 0,6 sn (playSkill'deki iki
  // wait(0.3)), sersem/zehir turu 0,45 sn sürer; en yüksek hız 3×, oto mod yalnızca seçimi anında yapar. Yani gerçek bir
  // istemci tur başına en az 0,45 / 3 = 150 ms harcar (tipik: 300-500 ms). Taban bunun yarısıdır: 75 ms × tur.
  pace: { maxSpeed: 3, turnSec: 0.45, margin: 0.5 },
  // İstek sınırı ihlali: bir dakikada bu kadar reddedilen (429) istek bir işaret üretir (pencere başına en çok bir)
  rate: { strikes: 60, windowMs: 60000 },
  arenaSameOpp: 3, // aynı rakiple günde en çok bu kadar meydan savaşı (yan hesapla puan/şan kasmaya karşı)
  bossLossPaid: 5, // bir boss'a karşı yenilginin akçe tesellisi günde en çok bu kadar ödenir (geçilmemiş boss enerjisiz ve sınırsız denenir)
  // Pazar fiyat bandı (tek tablo). Adil değer V = fairValue: kademe + nadirlik + artı (+ su verme) maliyeti.
  // taban = V × lo · tavan = V × hi[nadirlik], ama en çok cap[nadirlik] akçe (Standart / Nadir / Eşsiz).
  // cap ≥ en pahalı eşyanın tabanı olmalı (aksi hâlde bant boş kalır): ~5,3 M / 11 M / 34 M adil değerin yarısı.
  price: { lo: 0.5, hi: [3, 3, 5], cap: [3000000, 6000000, 20000000] },
  // İstek gövdesi: alan sayısı, metin uzunluğu, dizi uzunluğu (hamle listesi ≤ tur sınırı 400), iç dizi uzunluğu
  req: { keys: 12, key: 32, str: 200, arr: 400, inner: 4 },
};

// ---------- Oyuncu kaydındaki koruma alanı (p.guard; biçimi state.js: newGuard) ----------
// Ek alanlar — rules: istemcisinin geçerli savaş motoruyla çalıştığı doğrulanan son sürüm · free: o günden beri puanlanmayan ret (bkz. punish)
const guardOf = p => p.guard || (p.guard = newGuard());
const round2 = x => Math.round(x * 100) / 100;
export function scoreNow(G, now) {
  if (!G) return 0;
  if (G.perm) return G.score;
  const idle = Math.max(0, now - Math.max(G.at, G.until)); // yasak süresi erimeye sayılmaz
  return Math.max(0, round2(G.score - idle / DAY * GUARD.decayPerDay));
}
export const banOf = (p, now) => { const G = p.guard; return G && (G.perm || G.until > now) ? { until: G.perm ? null : G.until, perm: !!G.perm } : null; };
const two = n => String(n).padStart(2, '0');
// Sunucu saatiyle (UTC+3) gg.aa.yyyy ss:dd
export const fmtTime = ms => { const d = new Date(ms + 3 * HOUR); return `${two(d.getUTCDate())}.${two(d.getUTCMonth() + 1)}.${d.getUTCFullYear()} ${two(d.getUTCHours())}:${two(d.getUTCMinutes())}`; };
export const banText = b => b.perm ? 'Hesabın hile koruması nedeniyle kalıcı olarak kapatıldı. İtiraz için destekle iletişime geç.'
  : `Hesabın hile koruması nedeniyle ${fmtTime(b.until)} tarihine kadar kapatıldı.`;
// Yasağın oyuncuya söylenen nedeni: ihlal türü değil, sade bir kategori (ayrıntı ve puan gösterilmez).
// G.by: kategori başına birikmiş ihlal puanı (puan sıfıra eridiğinde sıfırlanır) · G.why: yöneticinin seçtiği kategori
export const BAN_WHY = {
  cheat: 'Savaş sonuçların sunucuda doğrulanamadı ya da oyun dışı bir araç kullanıldığı tespit edildi.',
  flood: 'Hesabından sunucuya olağan dışı sıklıkta istek gönderildi.',
  pay: 'Bir satın alman için ödeme itirazı ya da yinelenen iade bildirildi.',
  conduct: 'Oyun kurallarına aykırı davranış nedeniyle yönetici kararıyla kapatıldı.',
};
const WHY_OF = { replay: 'cheat', speed: 'cheat', dev: 'cheat', rate: 'flood', chargeback: 'pay', refund: 'pay' };
export function banWhy(G) {
  if (G.why && Object.hasOwn(BAN_WHY, G.why)) return G.why;
  const top = Object.entries(G.by || {}).filter(([k]) => Object.hasOwn(BAN_WHY, k)).sort((a, b) => b[1] - a[1])[0];
  return top ? top[0] : (G.last && WHY_OF[G.last.kind]) || 'cheat';
}
// Yasak ekranının (public/js/ui-guvenlik.js) gösterdiği her şey: bitiş (ms ve sunucu saatiyle metin), neden, mesaj
export function banView(p, now, pid) {
  const b = banOf(p, now);
  if (!b) return null;
  const why = banWhy(p.guard);
  return { kind: 'ban', ...b, why, reason: BAN_WHY[why], end: b.perm ? null : fmtTime(b.until), message: banText(b), name: p.name, ...(pid !== undefined ? { id: pid } : {}) };
}
// Yasaklı hesap: ping dışında her işlem reddedilir
export function gate(p, action, now, pid) {
  const b = banOf(p, now);
  if (!b || (action && action.type === 'ping')) return;
  const e = new GameError('banned', banText(b));
  e.info = b;
  e.block = banView(p, now, pid);
  throw e;
}
// İstemciye giden kayıt: koruma alanı gösterilmez (puanını gören, eşiğin altında kalmayı ayarlar); oturum kimliği ve
// son savaşın saklanan sonucu da gönderilmez (yalnızca sunucunun işidir)
export const publicState = s => { const { guard, sess, fin, ...rest } = s; return rest; };

// ---------- İstemci kapısı: eski sürüm sekmesi ve başka cihazda açılmış oturum ----------
// Hile işareti DEĞİLDİR: hiçbir şey yazılmadan reddedilir, puan işlenmez; istemci yenileme ekranı gösterir (block.kind).
//  - env.cbuild: istemcinin açılışta sunucudan aldığı derleme kimliği · env.build: sunucunun şimdiki kimliği.
//    Farklıysa sekme güncellemeden önce açılmıştır ('stale-client'). Kimlik bildirmeyen istek (araçlar, eski sekme) denetlenmez.
//  - env.sid: sekmenin oturum kimliği · env.claim: açılış isteği (/api/me). Açılış oturumu devralır (p.sess); sonra başka
//    kimlikle gelen işlem 'session-moved' alır. Oturum bildirmeyen istek denetlenmez.
function refuse(code, message, kind) { const e = new GameError(code, message); e.block = { kind }; e.status = 409; throw e; }
export function clientGate(p, env) {
  if (env.cbuild && env.build && env.cbuild !== env.build) refuse('stale-client', 'Oyun güncellendi. Devam etmek için sayfayı yenile.', 'stale');
  if (!env.sid) return;
  const s = p.sess;
  if (env.claim || !s) { if (!s || s.id !== env.sid) p.sess = { id: env.sid, at: env.now }; return; }
  if (s.id !== env.sid) refuse('session-moved', 'Hesabın başka bir cihazda açıldı.', 'session');
}

// ---------- Savaş süresi ----------
export const minBattleMs = turns => Math.floor(turns * GUARD.pace.turnSec * 1000 / GUARD.pace.maxSpeed * GUARD.pace.margin);
// Savaş, tur sayısına göre gerçek bir istemcinin oynatabileceğinden hızlı bittiyse kısa bir açıklama döndürür.
// Sunucu saati geri alınmışsa (negatif süre) karar verilmez.
export function tooFast(b, turns, now) {
  if (!Number.isFinite(b.at)) return null;
  const took = now - b.at, floor = minBattleMs(turns);
  return took >= 0 && took < floor ? `${b.mode} · ${turns} tur ${took} ms (taban ${floor} ms)` : null;
}
// Geçerli bir savaş: istemcinin bu sürümün motoruyla çalıştığı doğrulanmış olur
export function verified(p, env) { const G = guardOf(p); if (env.rules && G.rules !== env.rules) G.rules = env.rules; if (G.free) G.free = 0; }

// ---------- İhlal ----------
// Hile işareti taşıyan ret. Kural hatası olduğu için kayıt yazılmaz; dispatch işareti görür ve ihlali ayrıca işler.
export function cheat(kind, detail, code, message, extra) {
  const e = new GameError(code, message);
  e.flag = { kind, detail, ...extra };
  throw e;
}
// Savaş başka bir motor sürümünde başlamış ve hamle listesi şimdiki motorla doğrulanamamışsa (güncelleme sırasında açık
// kalmış sekme): sonuç yine ödülsüz reddedilir ve savaş kapanır, ama kayıt puansızdır ve istemciye yenilemesi söylenir.
// Sürümü sunucu yazar (game.js: battle.start → b.rules); istemci bunu seçemez.
export function staleBattle(b, reason) {
  const e = new GameError('stale-client', 'Oyun güncellendi; bu savaş eski sürümde başladığı için doğrulanamadı. Sayfayı yenile.');
  e.flag = { kind: 'replay', detail: `${b.mode} · ${reason} · puansız: savaş eski sürümde başlamış`, battle: b.id, w: 0, stale: true };
  e.block = { kind: 'stale' }; e.status = 409;
  throw e;
}
// Hatanın taşıdığı işaret; test komutları (dev.*) kapalıyken denenirse bu da bir işarettir
export function flagOf(e, action) {
  if (!(e instanceof GameError)) return null;
  if (e.flag) return e.flag;
  if (e.code === 'forbidden' && typeof action?.type === 'string' && action.type.startsWith('dev.')) return { kind: 'dev', detail: action.type.slice(0, 40) };
  return null;
}
// İhlali oyuncu kaydına işler: puan, (eşik aşıldıysa) yasak, işaretli savaşın kapanması. Kayıt belgesini döndürür.
// Kaydedilecek bir şey yoksa null: savaşa bağlı işaret o savaş hâlâ açıksa sayılır (bir savaş en çok bir ihlal üretir);
// kalıcı yasaklı hesabın istek seli ayrıca kaydedilmez.
export function punish(p, flag, env, pid) {
  const G = guardOf(p), now = env.now;
  if (flag.battle !== undefined && !(p.battle && p.battle.id === flag.battle)) return null;
  if (flag.kind === 'rate' && G.perm) return null;
  let w = flag.w ?? GUARD.weight[flag.kind] ?? 0, detail = String(flag.detail ?? '').slice(0, 160);
  // Sürüm güncellemesinden sonra eski sekmedeki dürüst istemci de tekrar denetiminden geçemez. Bu yüzden hesap, geçerli
  // sürümde doğrulanmış bir savaş bitirene kadar ilk birkaç hamle listesi reddi kaydedilir ama puanlanmaz.
  if (flag.kind === 'replay' && !flag.stale && env.rules && G.rules !== env.rules && (G.free || 0) < GUARD.staleFree) { w = 0; G.free = (G.free || 0) + 1; detail += ' · puansız: bu sürümde doğrulanmış savaşı yok'; }
  const before = scoreNow(G, now);
  if (!before || !G.by) G.by = {}; // puan sıfıra eridiyse yasak nedeni sayacı da baştan başlar
  if (w > 0) { const k = WHY_OF[flag.kind] || 'cheat'; G.by[k] = round2((G.by[k] || 0) + w); }
  G.score = round2(before + w); G.at = now; G.n++; G.last = { kind: flag.kind, at: now };
  if (flag.battle !== undefined) { p.battle = null; p.stats.rejected++; } // aynı savaş yeniden gönderilemez
  const tier = w > 0 ? GUARD.bans.findLast(t => G.score >= t.score) : null;
  if (tier) { delete G.why; if (tier.perm) G.perm = true; else G.until = Math.max(G.until, now + tier.ms); } // neden: puanların kategorisinden (banWhy)
  const ban = tier ? banOf(p, now) : null;
  return { ban, doc: { pid, name: p.name, kind: flag.kind, detail, w, score: G.score, at: now, ban } };
}
const flagId = (env, at) => at.toString(36).padStart(9, '0') + Array.from({ length: 2 }, () => Math.floor(env.rand() * 65536).toString(16).padStart(4, '0')).join('');
const flagPut = (env, doc) => ({ t: 'put', coll: 'flag', id: flagId(env, doc.at), doc, ver: null, k1: String(doc.pid), n1: doc.at });
// Yasaklanan oyuncunun meydan savunma kaydı silinir: rakip listelerinde ve sıralamada görünmez
async function hideOps(store, pid) { const a = await store.get('arena', String(pid)); return a ? [{ t: 'del', coll: 'arena', id: String(pid), ver: a.ver }] : []; }
// Oyuncu kaydını değiştirip kayıt belgesiyle birlikte atomik yazar; araya yazma girdiyse baştan dener
async function amend(store, pid, env, change) {
  for (let i = 0; i < 4; i++) {
    const rec = await store.byId(pid);
    if (!rec) return null;
    const out = change(rec.state);
    if (!out) return null;
    const ops = [{ t: 'player', id: pid, state: rec.state, ver: rec.ver }, flagPut(env, out.doc), ...(out.ban ? await hideOps(store, pid) : [])];
    if (await store.commit(ops)) return out;
  }
  return null;
}
// Başka bir atomik işlemin içinden (ör. ödeme iadesi) ihlal işlemek için: cezayı p'ye uygular, birlikte yazılacak belgeleri verir
export async function punishOps(store, p, flag, env, pid) { const out = punish(p, flag, env, pid); return out ? { ...out, ops: [flagPut(env, out.doc), ...(out.ban ? await hideOps(store, pid) : [])] } : null; }
// Bir ihlali kaydeder ('flag' koleksiyonu: yalnızca eklenir; k1 oyuncu kimliği, n1 zaman) ve cezayı uygular
export const report = (store, pid, flag, env) => amend(store, pid, env, p => punish(p, flag, env, pid));

// ---------- Yönetim ----------
export const guardView = (p, now) => { const G = p.guard || newGuard(), b = banOf(p, now); return { score: scoreNow(G, now), until: G.until, perm: !!G.perm, banned: !!b, n: G.n, last: G.last, rules: G.rules ?? null }; };
export async function flagList(store, { player, limit = 50 } = {}) {
  const rows = await store.query('flag', { ...(player !== undefined && player !== null ? { k1: String(player) } : {}), order: '-n1', limit: Math.max(1, Math.min(200, limit)) });
  return rows.map(r => ({ id: r.id, ...r.doc }));
}
// Elle yasak: hours (saat) ya da perm; gerekçe kayda yazılır
// why: oyuncuya gösterilecek neden kategorisi (BAN_WHY anahtarı; verilmezse 'conduct'). reason yalnızca kayda yazılır.
export function adminBan(store, pid, { hours, perm = false, reason = '', why }, env) {
  if (!perm && !(typeof hours === 'number' && hours > 0 && hours <= 24 * 3650)) fail('bad-ban', 'Süre (hours) ya da perm gerekli.');
  if (why !== undefined && !(typeof why === 'string' && Object.hasOwn(BAN_WHY, why))) fail('bad-ban', `Neden (why) şunlardan biri olmalı: ${Object.keys(BAN_WHY).join(', ')}.`);
  return amend(store, pid, env, p => {
    const G = guardOf(p);
    G.why = why || 'conduct';
    if (perm) G.perm = true; else { G.perm = false; G.until = env.now + Math.round(hours * HOUR); }
    const ban = banOf(p, env.now);
    return { ban, guard: guardView(p, env.now), doc: { pid, name: p.name, kind: 'admin-ban', detail: String(reason).slice(0, 160), w: 0, score: G.score, at: env.now, ban } };
  });
}
// Yasağı kaldırır; keepScore verilmezse puan da sıfırlanır
export function adminUnban(store, pid, { keepScore = false, reason = '' }, env) {
  return amend(store, pid, env, p => {
    const G = guardOf(p), score = keepScore ? scoreNow(G, env.now) : 0;
    Object.assign(G, { until: 0, perm: false, score, at: env.now }); delete G.why; if (!score) delete G.by;
    return { ban: null, guard: guardView(p, env.now), doc: { pid, name: p.name, kind: 'admin-unban', detail: String(reason).slice(0, 160), w: 0, score, at: env.now, ban: null } };
  });
}

// ---------- İstek biçimi ----------
// İstemciden gelen gövde: düz nesne; değerler sayı, metin, mantıksal ya da (en çok bir kat iç içe) dizi olabilir.
// Hiçbir işlem nesne parametre almaz; __proto__ gibi anahtarlar ve sınırı aşan metin/diziler baştan reddedilir.
const BAD_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
export function checkShape(a) {
  const L = GUARD.req, bad = () => fail('bad-request', 'Geçersiz istek.');
  const prim = v => v === null || typeof v === 'boolean' || (typeof v === 'number' && Number.isFinite(v)) || (typeof v === 'string' && v.length <= L.str);
  if (!a || typeof a !== 'object' || Array.isArray(a)) bad();
  const keys = Object.keys(a);
  if (keys.length > L.keys) bad();
  for (const k of keys) {
    const v = a[k];
    if (BAD_KEYS.has(k) || k.length > L.key) bad();
    if (prim(v)) continue;
    if (!Array.isArray(v) || v.length > L.arr) bad();
    for (const x of v) if (!prim(x) && !(Array.isArray(x) && x.length <= L.inner && x.every(prim))) bad();
  }
  return a;
}

// ---------- Pazar fiyat aralığı ----------
// Bir eşyayı +0'dan +p'ye getirmenin beklenen akçe bedeli (deneme ücreti + taşların üretim bedeli). Seviye kaybı ve
// kırılma hesaba katılır: C[k] = (deneme bedeli + drop × C[k−1] + brk × (C[5] + … + C[k−1])) / başarı oranı
export function upgradeCost(it) {
  const akce = STONES[stoneGrade(it)].akce, C = [];
  let sum = 0;
  for (let k = minPlus(it.b); k < it.p; k++) { // en düşük artıya kadar basma yok (takı dışı eşya +1 doğar)
    const o = upOdds({ ...it, p: k });
    let back = o.drop * (C[k - 1] || 0);
    for (let j = SAFE_PLUS; j < k; j++) back += o.brk * C[j];
    C[k] = (upFee({ ...it, p: k }) + UP_STONES[k] * akce + back) / o.ok;
    sum += C[k];
  }
  return Math.round(sum);
}
// Adil değer: +0 hâlinin referans fiyatı + artı basmaya (ve su vermeye) harcanan beklenen akçe
export function fairValue(it) {
  const reforge = it.r ? upgradeCost({ ...it, p: REFORGE.minPlus }) + REFORGE.fee(it) + REFORGE.stones * STONES[2].akce : 0;
  return refPrice({ ...it, p: 0 }) + upgradeCost(it) + reforge;
}
// İlan fiyatı bu aralıkta olmalı: saçma ilanlarla hesaplar arası akçe aktarılamaz
export const priceBounds = it0 => {
  const it = normItem(it0), P = GUARD.price, v = fairValue(it), g = it.g in P.cap ? it.g : 0;
  const min = Math.max(1, Math.ceil(v * P.lo));
  return { min, max: Math.max(min, Math.min(P.cap[g], Math.ceil(v * P.hi[g]))) };
};
export const inBand = (it, price) => { const B = priceBounds(it); return Number.isInteger(price) && price >= B.min && price <= B.max; };

// ---------- Meydan: aynı rakip sınırı ----------
// p.daily.vs: rakip kimliği → bugünkü savaş sayısı (gün değişince p.daily ile birlikte sıfırlanır)
export const vsUsed = (p, id) => { const m = p.daily.vs; return m && Object.hasOwn(m, String(id)) ? m[String(id)] : 0; };
export function countVs(p, o) {
  if (o.id === undefined || o.id === null) return;
  if (vsUsed(p, o.id) >= GUARD.arenaSameOpp) fail('same-opponent', `Aynı rakiple günde en çok ${GUARD.arenaSameOpp} kez dövüşebilirsin. Listeyi yenile.`);
  (p.daily.vs || (p.daily.vs = {}))[String(o.id)] = vsUsed(p, o.id) + 1;
}

// ---------- Boss yenilgisi tesellisi ----------
// p.daily.lost: stage → bugün tesellisi ödenen yenilgi sayısı. Sınır dolduysa false döner (ödeme yapılmaz).
export function lossPaid(p, id) {
  const m = p.daily.lost || (p.daily.lost = {}), n = Object.hasOwn(m, id) ? m[id] : 0;
  if (n >= GUARD.bossLossPaid) return false;
  m[id] = n + 1; return true;
}
