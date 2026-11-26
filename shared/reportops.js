// Savaş raporlarının saklanması ve okunması. Rapor oyuncu kaydına yazılmaz (her yanıtla taşınmasın): paylaşılan depoda
// 'brep' koleksiyonunda durur ve yalnızca istenince okunur.
//   kendi savaşların   kimlik '<oyuncu>:<yuva>' (yuva = savaş no mod REPORT_KEEP: üzerine yazılır, silme gerekmez) · k1 'a:<oyuncu>'
//   savunma kayıtları  kimlik 'd:<savunan>:<zaman>' · k1 'd:<savunan>' (saldıran yazar; fazlası yazarken silinir)
// Raporu sunucu, hamle listesini doğrularken kendi tekrarından üretir (game.js: battle.finish → result.report);
// istemcinin gönderdiği hiçbir sayı rapora girmez.
import { fail } from './util.js';
import { isBot } from './bots.js';
import { REPORT_KEEP, DEF_KEEP, REPORT_DAYS } from './report.js';

const DAY = 86400000;
const COLL = 'brep';
const ID_RE = /^(\d{1,15}:\d|d:\d{1,15}:[0-9a-z]{9,20})$/;
const stamp = (ctx, at) => at.toString(36).padStart(9, '0') + Array.from({ length: 2 }, () => Math.floor(ctx.rand() * 65536).toString(16).padStart(4, '0')).join('');
const brief = r => ({ id: r.id, kind: r.doc.kind, at: r.doc.at, mode: r.doc.mode, title: r.doc.title, win: !!r.doc.win, turns: r.doc.turns, stars: r.doc.stars || 0, ...(r.doc.kind === 'd' ? { by: r.doc.by, byId: r.doc.byId || null, faction: r.doc.faction, rating: r.doc.rating ?? null } : {}) });

// dispatch, doğrulanmış her savaştan sonra çağırır: raporu yazar; meydanda gerçek bir oyuncuya saldırıldıysa bir kopyası
// savunanın okuyabileceği kayda düşer (savunan, kendisine yapılan saldırıyı tur tur görebilir).
export async function afterBattle(ctx, p, action, result) {
  if (action.type !== 'battle.finish' || !result.report || !Number.isInteger(action.id)) return;
  const now = ctx.now, me = String(ctx.pid), rep = result.report;
  const head = { at: now, mode: result.mode, title: String(result.title || '').slice(0, 80), win: !!result.win, turns: result.turns, stars: result.stars || 0 };
  ctx.ops.push({ t: 'put', coll: COLL, id: `${me}:${action.id % REPORT_KEEP}`, doc: { to: me, kind: 'a', ...head, rep }, k1: 'a:' + me, n1: now });
  const vs = String(result.vs ?? '');
  if ((result.mode !== 'arena' && result.mode !== 'live') || !/^\d{1,15}$/.test(vs) || isBot(vs) || vs === me) return;
  ctx.ops.push({ t: 'put', coll: COLL, id: `d:${vs}:${stamp(ctx, now)}`, ver: null, doc: { to: vs, kind: 'd', ...head, by: p.name, byId: me, faction: p.faction, rating: p.arena?.rating ?? null, rep }, k1: 'd:' + vs, n1: now });
  const old = await ctx.store.query(COLL, { k1: 'd:' + vs, order: '-n1', limit: 40 });
  for (const r of old.slice(DEF_KEEP - 1)) ctx.ops.push({ t: 'del', coll: COLL, id: r.id });
}

export const REPORT_WORLD = {
  // Son savaşların ve savunmana yapılan son saldırıların başlıkları (rapor gövdesi report.get ile ayrıca okunur)
  async 'report.list'(ctx) {
    const me = String(ctx.pid), since = ctx.now - REPORT_DAYS * DAY;
    const mine = await ctx.store.query(COLL, { k1: 'a:' + me, n1min: since, order: '-n1', limit: REPORT_KEEP });
    const def = await ctx.store.query(COLL, { k1: 'd:' + me, n1min: since, order: '-n1', limit: DEF_KEEP });
    return { mine: mine.map(brief), def: def.map(brief) };
  },
  async 'report.get'(ctx, p, { id }) {
    if (typeof id !== 'string' || id.length > 48 || !ID_RE.test(id)) fail('bad-report', 'Böyle bir rapor yok.');
    const r = await ctx.store.get(COLL, id);
    if (!r || String(r.doc.to) !== String(ctx.pid)) fail('no-report', 'Bu rapor artık saklanmıyor.');
    return { ...brief(r), rep: r.doc.rep };
  },
};
export const REPORT_READ_ONLY = ['report.list', 'report.get'];
