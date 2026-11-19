// Sunucu bağlantısı. İstemci hiçbir sonucu kendi hesaplamaz: işlemi gönderir, dönen kaydı gösterir.
// Sürüm 12: HESAP → en çok 3 KARAKTER. boot() hesabı açar (karakter listesi: ACC), oyun kaydı (S) karakter seçilince gelir.
// Hesap işlemleri act('char.list' | 'char.create' | 'char.select' | 'char.delete', …) ile gider (shared/account.js);
// char.select ve char.create seçili karakterin kaydını S'ye yükler.
//  - Uzak mod (varsayılan): /api uçları, jeton localStorage'da.
//  - Yerel mod (?local=1 ya da deneme derlemesi): aynı kurallar (shared/game.js) tarayıcıda çalışır,
//    kayıt bu cihazda tutulur. Yalnızca çevrimdışı deneme içindir; ilerleme sunucuya taşınmaz.
import { applyFactionNames } from '../shared/content.js';
const params = new URLSearchParams(location.search);
export const LOCAL = window.DD_LOCAL === true || params.get('local') === '1';
const K_TOKEN = 'dd_token_v1';
const ls = { get: k => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch { } }, del: k => { try { localStorage.removeItem(k); } catch { } } };

export let S = null;      // seçili karakterin kaydı (sunucudan gelen son hâl); karakter seçilmeden null
export let ACC = null;    // hesap: { chars: [kart], max, cur } (char.list sonucu; karakter seçme ekranı bunu çizer)
export let DEV = false;   // test komutları açık mı
let offset = 0;
export const now = () => Date.now() + offset;
const subs = new Set();
export const taps = new Set(); // (tür, istek, söz): her işlemi ve sonucunu dinleyenler (ses paketi: ui-ses.js)
export const onState = fn => { subs.add(fn); return () => subs.delete(fn); };
function setState(state, time, dev) { S = state; if (S?.faction) applyFactionNames(S.faction); if (time) offset = time - Date.now(); DEV = !!dev; subs.forEach(fn => fn(S)); }

// info: reddin taşıdığı ek veri (ör. done: yinelenen savaş bildiriminde ilk sonuç · mute: susturmanın nedeni ve bitişi)
export class ApiError extends Error { constructor(code, message, info) { super(message || code); this.code = code; this.info = info || null; } }

// ---- Kilit: oyunun geri kalanını kapatan tam ekran durum (ekranı ui-guvenlik.js çizer) ----
//  kind 'ban': hesap yasaklı · 'session': hesap başka bir cihazda ya da sekmede açıldı · 'stale': oyun güncellendi, sekme eski
// Kilitliyken hiçbir işlem gönderilmez ve bekleyen çağrılar sonuçlanmaz (arkadaki ekranlar hata göstermez, sunucu yoklanmaz);
// kilitten yalnızca sayfa yenilenerek çıkılır.
let lock = null;
const lockSubs = new Set(), never = () => new Promise(() => {});
export const locked = () => lock;
export const onLock = fn => { lockSubs.add(fn); if (lock) fn(lock); return () => lockSubs.delete(fn); };
function setLock(b) { if (lock && !(lock.kind === 'ban' && b.kind === 'ban')) return; lock = b; lockSubs.forEach(fn => fn(lock)); }
// Oturum kimliği: sekme başına rastgele. Sunucu, açılışı (/api/me) en son yapan oturumu geçerli sayar (X-DD-Session);
// aynı tarayıcıdaki diğer sekmeler bunu localStorage olayıyla hemen, başka cihazlar ilk isteklerinde öğrenir.
const SID = Array.from(crypto.getRandomValues(new Uint8Array(12)), b => (b % 36).toString(36)).join('');
const K_SESS = 'dd_session_v1' + (LOCAL ? '_local' : '');
const claimTab = () => ls.set(K_SESS, SID);
window.addEventListener('storage', e => { if (e.key === K_SESS && e.newValue && e.newValue !== SID && S) setLock({ kind: 'session', message: 'Hesabın başka bir cihazda açıldı.' }); });
let build = ''; // sunucunun açılışta verdiği derleme kimliği; her isteğe eklenir (X-DD-Build), değiştiyse sunucu yenileme ister
const TIMEOUT = 20000; // yanıtsız kalan istek bağlantı hatası sayılır (çağıran yeniden dener; sunucu aynı savaşı bir kez öder)

const remote = {
  async call(path, body) {
    let r;
    const ac = typeof AbortController === 'function' ? new AbortController() : null, t = ac && setTimeout(() => ac.abort(), TIMEOUT);
    try { r = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-DD-Session': SID, ...(build ? { 'X-DD-Build': build } : {}), ...(ls.get(K_TOKEN) ? { Authorization: 'Bearer ' + ls.get(K_TOKEN) } : {}) }, body: JSON.stringify(body || {}), signal: ac?.signal }); }
    catch { throw new ApiError('network', 'Sunucuya ulaşılamadı. Bağlantını kontrol et.'); }
    finally { clearTimeout(t); }
    const j = await r.json().catch(() => null);
    if (j && !j.ok && j.block) { if (j.time) offset = j.time - Date.now(); setLock({ ...j.block, code: j.code, message: j.message }); return never(); } // yasak, devredilen oturum, eski sürüm
    if (!j || !j.ok) throw new ApiError(j?.code || 'server', j?.message || 'Sunucu hatası.', j);
    return j;
  },
  async boot() {
    if (!ls.get(K_TOKEN)) return null;
    try {
      const j = await this.call('/api/me');
      if (j.build) build = j.build;
      if (j.result?.block) { setState(j.state, j.time, j.dev); setLock(j.result.block); return null; } // yasaklı hesap: oyun açılmaz, yasak ekranı gösterilir
      if (j.chars) return j.chars; // yeni sunucu: { chars, max, cur }
      // eski sunucu: hesabın tek kaydı tek karakter sayılır (seçilince bu kayıt yüklenir)
      this.legacy = j; const p = j.state;
      return { chars: p ? [{ id: '1', name: p.name, race: p.faction, cls: p.char?.cls || p.heroes?.h0?.cls || 'warrior', lvl: p.lvl, look: p.char || null, at: p.createdAt || 0 }] : [], max: 3, cur: '1' };
    }
    catch (e) { if (e.code === 'auth') ls.del(K_TOKEN); throw e; } // süresi dolmuş oturum: main.js giriş ekranını açar
  },
  // Hesap işlemleri: /api/char { type, … } → { result, state? }. Hesap yoksa (jeton yok) ilk char.create /api/register'a gider
  // ve jeton döner. ESKİ SUNUCU (char uçları yok): /api/me'nin kaydı tek karakter sayılır.
  async char(type, a) {
    if (!ls.get(K_TOKEN)) {
      if (type === 'char.list') return { chars: [], max: 3, cur: null };
      throw new ApiError('auth', 'Önce giriş yap.'); // yeni sunucu: hesap /api/auth ile açılır (ui-giris.js)
    }
    if (this.legacy && (type === 'char.select' || type === 'char.list')) { const L = this.legacy; if (type === 'char.list') return this.boot(); setState(L.state, L.time, L.dev); claimTab(); return { id: '1' }; } // eski sunucu
    const j = await this.call('/api/char', { type, ...a });
    if (j.state) { setState(j.state, j.time, j.dev); claimTab(); }
    return j.result;
  },
  async act(action) { const j = await this.call('/api/act', action); setState(j.state, j.time, j.dev); return j.result; },
  async nufus() { try { return (await this.call('/api/nufus')).result || null; } catch { return null; } }, // ırk nüfusu (sunucuda uç yoksa null: kartlar açık, ret sunucudan gelir)
};

// Yerel (deneme) arka ucu: sunucudaki dağıtıcı ve bellek deposu tarayıcıda çalışır; "dünya" yapay oyuncularla dolar.
let W = null, G = null, N = null, AC = null, store = null, pid = null, saveT = null;
const SAVE_V = 2, K_WORLD = 'dd_local_world_v2';
const local = {
  env: () => ({ now: Date.now(), rand: () => crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296, dev: true, bots: true }),
  async boot() {
    let M;
    try { [W, M, G, N, AC] = await Promise.all([import('../shared/world.js'), import('../shared/memstore.js'), import('../shared/game.js'), import('../shared/nufus.js'), import('../shared/account.js')]); }
    catch { throw new ApiError('local-off', 'Çevrimdışı deneme modu bu sunucuda kapalı.'); }
    store = new M.MemoryStore();
    try { const d = JSON.parse(ls.get(K_WORLD) || 'null'); if (d && d.v === SAVE_V) store.load(d.dump); } catch { }
    // Kayıt bu cihazdadır: başka bir sekme devraldıysa (K_SESS) bu sekme artık yazmaz, yoksa iki sekme birbirinin kaydını ezerdi
    store.dirty = () => { clearTimeout(saveT); saveT = setTimeout(() => { if (!lock && (ls.get(K_SESS) || SID) === SID) ls.set(K_WORLD, JSON.stringify({ v: SAVE_V, dump: store.dump() })); }, 250); };
    // Duyuru panosu çevrimdışı denemede boş kalmasın: iki örnek duyuru (yönetici yazısı değildir; yalnızca bu cihazda)
    if (!(await store.query('news', { k1: 'n', limit: 1 })).length) {
      const t = Date.now();
      await store.commit([
        { t: 'put', coll: 'news', id: 'ornek00001', doc: { title: 'Hoş geldin, yiğit!', body: 'Korant Online deneme sürümüne hoş geldin. Burada ilerlemen yalnızca bu cihazda tutulur.\nYeni bir şey çıktığında duyurular burada görünür.', at: t - 3600000 }, ver: null, k1: 'n', n1: t - 3600000 },
        { t: 'put', coll: 'news', id: 'ornek00002', doc: { title: 'Örnek duyuru: bakım notu', body: 'Gerçek sunucuda yöneticiler bu panoya haber ve güncelleme notu yazar. Bu iki yazı yalnızca örnektir.', at: t - 86400000 }, ver: null, k1: 'n', n1: t - 86400000 },
      ]);
    }
    return this.char('char.list'); // karakter seçilmeden oyun kaydı yüklenmez
  },
  // Hesap işlemleri (shared/account.js): hesap anahtarı 'local'; her karakter depoda ayrı kayıttır ('local#n' jetonu).
  // Eski deneme kaydı (tek oyuncu, jeton 'local') ilk açılışta hesabın ilk karakteri olur (acctAdopt).
  async char(type, a) {
    try {
      const r = await AC.charOp(store, 'local', type, a || {}, this.env());
      if (type === 'char.select' || type === 'char.create') { pid = +r.id; claimTab(); await this.act({ type: 'ping' }); }
      if (type === 'char.delete' && String(pid) === r.id) { pid = null; S = null; }
      return r;
    } catch (e) { if (e instanceof G.GameError) throw new ApiError(e.code, e.message, e.info); throw e; }
  },
  async nufus() { return N && store ? N.nufusView(await N.nufusStatus(store, this.env())) : null; },
  async act(action) {
    try { const r = await W.dispatch(store, pid, action, this.env()); setState(r.state, 0, true); return r.result; }
    catch (e) { if (e instanceof G.GameError) throw new ApiError(e.code, e.message, e.info); throw e; }
  },
};

const backend = LOCAL ? local : remote;
// Açılış: hesabın karakter listesi (ACC). Uzak modda jeton yoksa boş liste.
export const boot = async () => { const r = await backend.boot(); ACC = r && Array.isArray(r.chars) ? r : { chars: [], max: 3, cur: null }; return ACC; };
export const accountInfo = () => ACC;
export const nufusInfo = () => backend.nufus(); // kayıt ekranı: ırkların nüfusu, Bereket, dolu ırk
let queue = Promise.resolve();
// İşlemler sırayla gönderilir (çift dokunuş aynı kaynağı iki kez harcamaya çalışmasın)
export function act(type, payload = {}) {
  const charOp = typeof type === 'string' && type.startsWith('char.');
  const run = () => (lock ? never() : charOp ? backend.char(type, payload).then(async r => { ACC = type === 'char.list' ? r : await backend.char('char.list'); return r; }) : backend.act({ type, ...payload }));
  const p = queue.then(run, run);
  for (const fn of taps) { try { fn(type, payload, p); } catch { } } // dinleyenin hatası işlemi düşürmez
  queue = p.catch(() => {});
  return p;
}
// ---- Hesap girişi (yeni sunucu, sunucu/auth.js): kullanıcı adı + şifre → oturum jetonu (bu cihazda saklanır) ----
export const hasToken = () => LOCAL || !!ls.get(K_TOKEN);
export async function authCall(kind, user, pass) { // kind: 'login' | 'register'
  const j = await remote.call(`/api/auth/${kind}`, { user, pass });
  ls.set(K_TOKEN, j.token); if (j.build) build = j.build; if (j.time) offset = j.time - Date.now();
  return j.user;
}
export async function logout() { try { await remote.call('/api/auth/logout'); } catch { } ls.del(K_TOKEN); location.reload(); }
export async function changePassword(old, pass) { const j = await remote.call('/api/auth/password', { old, pass }); ls.set(K_TOKEN, j.token); return true; }
export function resetLocal() { clearTimeout(saveT); ls.del(K_WORLD); ls.del(K_TOKEN); location.reload(); }
// Gerçek parayla satın alma uçları (/api/pay/order, /api/pay/confirm): yalnızca sunucuda vardır. Çevrimdışı denemede
// ödeme alınamaz; arayüz bunu oyuncuya açıklar (ui-odeme.js). Diğer işlemlerle aynı sırada gönderilir.
export function payCall(path, body = {}) {
  const run = async () => {
    if (lock) return never();
    if (LOCAL) throw new ApiError('pay-off', 'Çevrimdışı deneme sürümünde satın alma yapılamaz.');
    const j = await remote.call('/api/pay/' + path, body);
    if (j.state) setState(j.state, j.time, j.dev);
    return j.result;
  };
  const p = queue.then(run, run);
  queue = p.catch(() => {});
  return p;
}
// Yasak ekranının yoklaması: yasak sürüyorsa güncel bilgisini, bittiyse null döndürür (sıra ve kilit dışında çalışır).
// Sunucuya ulaşılamazsa ApiError('network') fırlatır.
export async function recheckBan() {
  const j = await remote.call('/api/me');
  if (j.time) offset = j.time - Date.now();
  const b = j.result?.block || null;
  if (b) setLock(b);
  return b;
}
