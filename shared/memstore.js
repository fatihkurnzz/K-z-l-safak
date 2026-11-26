// Bellek içi depo. Testlerde, geliştirme sunucusunda (FileStore bunu genişletir) ve çevrimdışı deneme
// sürümünde (tarayıcıda) aynı arayüzle kullanılır. Üretim deposu server/store.js içindeki PgStore'dur.
//
// Arayüz (bütün depolar):
//   create(tokenHash, state) → { id }             isim alınmışsa GameError('name-taken')
//   byToken(tokenHash) / byId(id) → { id, state, ver } | null
//   remove(id) → true | false                     karakter silme (account.js): kayıt, jetonu ve ad dizinindeki adı gider
//   get(coll, id) → { id, doc, ver } | null        paylaşılan belgeler: pazar ilanı, meydan kaydı, klan, posta…
//   query(coll, { k1, n1min, n1max, order, limit }) → [{ id, doc, ver }]   order: 'n1' | '-n1' | 'n2' | '-n2'
//   commit(ops) → true | false                    hepsi ya da hiçbiri; sürüm uyuşmazsa false
//     { t: 'player', id, state, ver }
//     { t: 'put', coll, id, doc, ver, k1, n1, n2 }   ver: null = yeni olmalı · sayı = o sürüm olmalı · yok = üzerine yaz
//     { t: 'del', coll, id, ver }
import { GameError } from './util.js';

export const nameKey = n => n.trim().toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ');

export class MemoryStore {
  constructor() { this.players = new Map(); this.tokens = new Map(); this.names = new Set(); this.docs = new Map(); this.nextId = 1; }
  coll(c) { let m = this.docs.get(c); if (!m) this.docs.set(c, m = new Map()); return m; }
  async create(tokenHash, state) {
    const k = nameKey(state.name);
    if (this.names.has(k)) throw new GameError('name-taken', 'Bu isim alınmış.');
    const id = this.nextId++;
    this.names.add(k); this.tokens.set(tokenHash, id);
    this.players.set(id, { json: JSON.stringify(state), ver: 1, token: tokenHash });
    this.dirty?.();
    return { id };
  }
  async remove(id) {
    const r = this.players.get(id);
    if (!r) return false;
    try { this.names.delete(nameKey(JSON.parse(r.json).name)); } catch { }
    if (this.tokens.get(r.token) === id) this.tokens.delete(r.token);
    this.players.delete(id);
    this.dirty?.();
    return true;
  }
  async byId(id) { const r = this.players.get(id); return r ? { id, state: JSON.parse(r.json), ver: r.ver } : null; }
  async byToken(tokenHash) { const id = this.tokens.get(tokenHash); return id ? this.byId(id) : null; }
  async save(id, state, ver) { return this.commit([{ t: 'player', id, state, ver }]); }
  async get(coll, id) { const r = this.coll(coll).get(String(id)); return r ? { id: String(id), doc: JSON.parse(r.json), ver: r.ver } : null; }
  async query(coll, { k1, n1min = -Infinity, n1max = Infinity, order, limit = 50 } = {}) {
    let rows = [...this.coll(coll)].filter(([, r]) => (k1 === undefined || r.k1 === k1) && r.n1 >= n1min && r.n1 <= n1max);
    if (order) { const f = order.replace('-', ''), s = order[0] === '-' ? -1 : 1; rows.sort((a, b) => s * (a[1][f] - b[1][f])); }
    return rows.slice(0, Math.min(limit, 200)).map(([id, r]) => ({ id, doc: JSON.parse(r.json), ver: r.ver }));
  }
  async commit(ops) {
    for (const o of ops) { // önce hepsini denetle
      if (o.t === 'player') { const r = this.players.get(o.id); if (!r || r.ver !== o.ver) return false; continue; }
      const r = this.coll(o.coll).get(String(o.id));
      if (o.t === 'del') { if (!r || (o.ver !== undefined && r.ver !== o.ver)) return false; }
      else if (o.ver === null) { if (r) return false; }
      else if (o.ver !== undefined && (!r || r.ver !== o.ver)) return false;
    }
    for (const o of ops) {
      if (o.t === 'player') { const r = this.players.get(o.id); r.json = JSON.stringify(o.state); r.ver++; continue; }
      const m = this.coll(o.coll), id = String(o.id);
      if (o.t === 'del') m.delete(id);
      else m.set(id, { json: JSON.stringify(o.doc), ver: (m.get(id)?.ver || 0) + 1, k1: o.k1 ?? null, n1: o.n1 ?? 0, n2: o.n2 ?? 0 });
    }
    this.dirty?.();
    return true;
  }
  async count() { return this.players.size; }
  async close() {}
  // Kalıcılık (dosya / localStorage)
  dump() {
    return {
      nextId: this.nextId,
      players: [...this.players].map(([id, r]) => ({ id, ver: r.ver, token: r.token, state: JSON.parse(r.json) })),
      docs: [...this.docs].map(([c, m]) => [c, [...m].map(([id, r]) => ({ id, ...r }))]),
    };
  }
  load(d) {
    this.nextId = d.nextId || 1;
    for (const r of d.players || []) { this.players.set(r.id, { json: JSON.stringify(r.state), ver: r.ver, token: r.token }); this.tokens.set(r.token, r.id); this.names.add(nameKey(r.state.name)); }
    for (const [c, rows] of d.docs || []) { const m = this.coll(c); for (const { id, ...r } of rows) m.set(id, r); }
    return this;
  }
}
