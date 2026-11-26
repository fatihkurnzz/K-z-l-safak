// F-025 yerel kural-katmanı koşumu (oyun dosyalarına yazmaz). Depo: GAME_DIR env ya da varsayılan.
const G = (process.env.GAME_DIR) + '/shared/';
export const W = await import(G + 'world.js'), M = await import(G + 'memstore.js'), GM = await import(G + 'game.js'), AC = await import(G + 'account.js');
export const imp = f => import(G + f);
export function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export async function dunya(seed = 1, t0 = Date.UTC(2026, 10, 26, 9, 0, 0)) {
  const store = new M.MemoryStore(); const st = { now: t0, rand: rng(seed), dev: true, bots: true };
  const env = () => ({ now: st.now, rand: st.rand, dev: st.dev, bots: st.bots });
  async function kar(look, hesap = 'local') { const r = await AC.charOp(store, hesap, 'char.create', look, env()); const pid = +r.id; const o = { pid,
      async act(type, a = {}) { const r = await W.dispatch(store, pid, { type, ...a }, env()); o.S = r.state; return r.result; },
      async dene(type, a = {}) { try { return { ok: true, r: await o.act(type, a) }; } catch (e) { return { ok: false, code: e.code || e.name, msg: String(e.message).slice(0, 90) }; } } };
    await o.act('ping'); return o; }
  return { store, st, env, kar };
}
