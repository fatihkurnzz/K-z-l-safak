// Fable envanteri için oyun verisi (salt okunur): bölgeler, aşamalar, zindanlar, sınıflar, halklar, NPC'ler, yaratıklar, bosslar.
// envanter.py çağırır: shared/ geçici bir {"type":"module"} klasörüne kopyalanır, bu dosya oradan çalışır. Çıktı stdout JSON.
import * as C from './shared/content.js';
import * as Z from './shared/zones.js';
import * as B from './shared/bestiary.js';
import * as N from './shared/npc.js';
const out = {};
out.oyun = C.GAME; out.baskentler = C.CAPITALS; out.halklar = C.FACTIONS;
out.siniflar = Object.fromEntries(Object.entries(C.CLASSES).map(([k, v]) => [k, { ad: v.name, ad_halka_gore: k === 'priest' ? C.PRIEST_NAME : undefined }]));
out.bolgeler = (Z.ZONES || []).map(z => ({ id: z.id, ad: z.name, seviye: z.lv || z.levels || null, asama_sayisi: (z.blocks || []).length }));
const M = Z.MOBS || {};
out.yaratik_sayisi = Object.keys(M).length;
out.bosslar = Object.entries(M).filter(([, m]) => m.boss).map(([id, m]) => ({ id, ad: m.name, bolge: m.zone, olay: !!m.event, evre_metni: (m.phases || []).length }));
out.kaptanlar = Object.entries(M).filter(([, m]) => m.captain).map(([id, m]) => ({ id, ad: m.name, bolge: m.zone }));
out.dunya_bosslari = (B.WORLD_BOSSES || []).map(w => w[0]);
out.orman_yaratiklari = B.FOREST_MOBS;
out.yaratiklar = Object.entries(M).map(([id, m]) => ({ id, ad: m.name, bolge: m.zone, boss: !!m.boss, kaptan: !!m.captain }));
out.npc = Object.fromEntries(Object.entries(N.NPC || {}).map(([k, v]) => [k, typeof v === 'string' ? v : v?.name || null]));
for (const k of ['DUNGEONS', 'DUNGEON', 'MODES']) if (Z[k]) out['zindan_' + k.toLowerCase()] = Object.keys(Z[k]);
console.log(JSON.stringify(out));
