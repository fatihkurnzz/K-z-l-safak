// Hesap ve karakter yerleri (sürüm 12). Hesap (account) en çok CHAR.slots karakter taşır; her karakter depoda AYRI bir oyuncu
// kaydıdır (kendi seviyesi, çantası, akçesi, görevleri, klanı; ırk karakter başınadır). Oyun işlemleri (world.js dispatch)
// seçili karakterin kaydı üzerinde çalışır; bu dosya yalnızca hesap düzeyindeki işlemleri verir:
//   char.list                → { chars: [kart], max, cur }
//   char.create { look }     → yeni karakter (ad + ırk + sınıf + görünüş; roster.js normLook: her alan ırk + cinsiyete
//                              izinli olmalı, tablolar shared/gorunus.js) · { id, char }
//   char.select { id }       → seçili karakter değişir · { id }
//   char.nameFree { names }  → ad zarı: önerilerden boşta olanlar · { free } (char.delete sürüm 13'te kaldırıldı)
// Depo arayüzü (memstore.js): hesap belgesi coll 'acct' (anahtar: hesap anahtarı) { chars: [id], cur }; karakter kayıtları
// create(token, state) ile açılır (token: `${hesap}#${n}`); karakter kaydı silinmez.
// Sunucu: aynı işlevleri hesabın jeton özetiyle çağırır (uçları game/ dışındadır; rapora bakın). Yerel kip: api.js.
import { fail, GameError } from './util.js';
import { CHAR, normLook, validCharName, charNameKey, charCard } from './roster.js';
import { hasProfanity } from './chatfilter.js';
import { isBotName } from './bots.js';
import { newPlayer, upgradeState } from './state.js';
import { nufusGate } from './nufus.js';

export const ACCT_COLL = 'acct';
const ids = A => (Array.isArray(A?.chars) ? A.chars.filter(x => x != null) : []);
export async function acctGet(store, key) {
  const r = await store.get(ACCT_COLL, key);
  return { ver: r ? r.ver : null, doc: r ? { chars: ids(r.doc), cur: r.doc.cur ?? null, next: r.doc.next || 1 } : { chars: [], cur: null, next: 1 } };
}
const acctPut = (store, key, A) => store.commit([{ t: 'put', coll: ACCT_COLL, id: key, doc: A.doc, ver: A.ver, k1: key, n1: 0 }]);
const own = (A, id) => A.doc.chars.some(x => String(x) === String(id));
// Eski (tek kayıtlı) hesap: jetonun bağlı olduğu kayıt hesabın ilk karakteri olur (belge yoksa bir kez kurulur)
export async function acctAdopt(store, key, legacyToken = key) {
  const A = await acctGet(store, key);
  if (A.doc.chars.length || A.ver !== null) return A;
  const rec = await store.byToken(legacyToken);
  if (!rec) return A;
  A.doc = { chars: [rec.id], cur: rec.id, next: 2 };
  if (!(await acctPut(store, key, A))) return acctGet(store, key);
  return acctGet(store, key);
}
// Ad: biçim, küfür süzgeci, yapay oyuncu adları ve depodaki bütün karakterler arasında (büyük-küçük harf duyarsız) teklik
export function checkCharName(name) {
  const n = typeof name === 'string' ? name.trim() : '';
  if (!validCharName(n)) fail('bad-name', `Ad ${CHAR.name.min}-${CHAR.name.max} harf ya da rakam olmalı, harfle başlamalı (boşluk ve işaret yok).`);
  if (hasProfanity(n)) fail('bad-name', 'Bu ad kullanılamaz.');
  if (isBotName(n)) fail('name-taken', 'Bu ad alınmış.');
  return n;
}
// Canlı ad denetimi (oluşturma ekranı, yazarken): hatanın nedenini metin olarak döndürür, uygunsa null. Kural checkCharName ile
// aynıdır; teklik burada yalnızca bilinen adlarla (yapay oyuncular + hesabın kendi karakterleri: taken) bakılır, kesin teklik
// char.create'te depodaki ad dizinindedir.
export function nameIssue(name, taken = []) {
  const n = typeof name === 'string' ? name.trim() : '';
  if (!n) return 'Ad zorunlu.';
  if (/\s/.test(n)) return 'Adda boşluk olamaz.';
  if (!/^\p{L}/u.test(n)) return 'Ad harfle başlamalı.';
  if (/[^\p{L}\p{N}]/u.test(n)) return 'Yalnızca harf ve rakam kullan (işaret yok).';
  if (n.length < CHAR.name.min) return `Ad en az ${CHAR.name.min} harf olmalı.`;
  if (n.length > CHAR.name.max) return `Ad en çok ${CHAR.name.max} harf olabilir.`;
  if (!validCharName(n)) return `Ad ${CHAR.name.min}-${CHAR.name.max} harf ya da rakam olmalı.`;
  if (hasProfanity(n)) return 'Bu ad kullanılamaz.';
  if (isBotName(n) || taken.some(t => charNameKey(t) === charNameKey(n))) return 'Bu ad alınmış.';
  return null;
}

export async function charList(store, key) {
  const A = await acctAdopt(store, key);
  const chars = [];
  for (const id of A.doc.chars) { const r = await store.byId(id); if (r) chars.push(charCard(String(id), upgradeState(r.state, Date.now()))); } // eski kayıt: kart göçmüş hâlinden (yazılmaz; ilk işlemde göçer)
  return { chars, max: CHAR.slots, cur: A.doc.cur != null ? String(A.doc.cur) : null };
}
export async function charCreate(store, key, look, env) {
  const A = await acctAdopt(store, key);
  if (A.doc.chars.length >= CHAR.slots) fail('slots-full', `Hesapta en çok ${CHAR.slots} karakter olabilir.`);
  const name = checkCharName(look?.name);
  const L = normLook(look);
  if (L.err) fail('bad-look', L.err);
  await nufusGate(store, L.race, env); // dolu ırka yeni karakter açılmaz (nufus.js)
  const p = newPlayer({ name, faction: L.race, cls: L.cls, look: L }, env.now);
  let id;
  try { id = (await store.create(`${key}#${A.doc.next}`, p)).id; } // ad dizini depodadır: alınmış ad GameError('name-taken')
  catch (e) { if (e instanceof GameError && e.code === 'name-taken') fail('name-taken', 'Bu ad alınmış.'); throw e; }
  p.char.id = String(id);
  const rec = await store.byId(id);
  await store.commit([{ t: 'player', id, state: p, ver: rec.ver }]);
  A.doc = { chars: [...A.doc.chars, id], cur: id, next: A.doc.next + 1 };
  if (!(await acctPut(store, key, A))) fail('conflict', 'Eşzamanlı işlem. Tekrar dene.');
  return { id: String(id), char: charCard(String(id), p) };
}
export async function charSelect(store, key, id) {
  const A = await acctAdopt(store, key);
  const cid = A.doc.chars.find(x => String(x) === String(id));
  if (cid === undefined) fail('no-char', 'Böyle bir karakter yok.');
  A.doc.cur = cid;
  if (!(await acctPut(store, key, A))) fail('conflict', 'Eşzamanlı işlem. Tekrar dene.');
  return { id: String(cid) };
}
// Karakter silme oyundan kaldırıldı (sürüm 13): kayıtlar hiçbir yoldan silinmez. Eski çağıranlar için işlev durur ama reddeder.
export async function charDelete() { fail('no-delete', 'Karakter silme kapalı.'); }
// Ad zarı (oluşturma ekranı): önerilen adlardan biçimi uygun ve depoda boş olanlar { free: [ad] }. Kesin teklik yine
// char.create'tedir (aradaki sürede başkası alabilir). Depo ad dizinini nameTaken(ad) ile ya da bellek deposunda names
// kümesiyle verir; ikisi de yoksa yalnızca biçim, küfür ve yapay oyuncu adlarına bakılır.
async function nameTaken(store, n) {
  if (typeof store.nameTaken === 'function') return !!(await store.nameTaken(n));
  if (store.names instanceof Set) return store.names.has(charNameKey(n));
  return false;
}
export async function charNameFree(store, names) {
  const free = [];
  for (const n of (Array.isArray(names) ? names : []).slice(0, 8)) {
    if (typeof n !== 'string' || nameIssue(n)) continue;
    if (!(await nameTaken(store, n.trim()))) free.push(n.trim());
  }
  return { free };
}
// Seçili karakterin depo kimliği (yoksa null): oyun işlemleri bu kayıtla çalışır
export async function charCurrent(store, key) {
  const A = await acctAdopt(store, key);
  return A.doc.cur != null && own(A, A.doc.cur) ? A.doc.cur : null;
}
// Tek giriş noktası (sunucu ve yerel kip): tür → işlev
export async function charOp(store, key, type, a, env) {
  if (type === 'char.list') return charList(store, key);
  if (type === 'char.create') return charCreate(store, key, a, env);
  if (type === 'char.select') return charSelect(store, key, a?.id);
  if (type === 'char.nameFree') return charNameFree(store, a?.names);
  fail('bad-action');
}
export const CHAR_ACTIONS = ['char.list', 'char.create', 'char.select', 'char.nameFree'];
