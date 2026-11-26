// P35 Opus bağımsız yeni hipotez testleri (yamalı kaynak, gerçek world.dispatch, MemoryStore, bots:true = yerel kip).
import fs from 'node:fs'; import { dunya, imp } from './h.mjs';
const AG = await imp('anagorev.js');
const R = []; const kay = (id, ok, not) => { R.push({ id, sonuc: ok, not }); console.log(ok + '  ' + id + ' — ' + not); };
const st = (k, id) => AG.mqState(k.S, AG.MQ_BY[id]);
for (const [race, seed] of [['ocak', 351], ['sancak', 352]]) {
  const d = await dunya(seed); const k = await d.kar({ name: 'Yeni' + race, race, cls: 'warrior' });
  await k.dene('tut.skip', {});
  kay(`${race} T0 yeni oyuncu ilk ana hedef`, AG.mqNextMain(k.S)?.id === 'm01' ? 'GECTI' : 'INCELE', `mqNextMain=${AG.mqNextMain(k.S)?.id}`);
  // T1 klan erişimi: Sv.20'de bot klan listesi ve katılım (yerel kip)
  await k.dene('dev.level', { lvl: 20 });
  const s = await k.dene('clan.search', {}); const acik = s.ok ? s.r.clans.filter(c => c.open !== false) : [];
  kay(`${race} T1a Sv.20 klan listesi`, s.ok && s.r.clans.length ? 'GECTI' : 'BULGU', s.ok ? `${s.r.clans.length} klan; ilk: ${JSON.stringify(s.r.clans[0]).slice(0, 160)}` : s.code);
  let katildi = null; for (const c of (s.ok ? s.r.clans : [])) { const j = await k.dene('clan.join', { id: c.id }); if (j.ok) { katildi = c.id; break; } else katildi = katildi || ('ret:' + j.code); }
  kay(`${race} T1b açık klana katılım (akçe harcamadan)`, typeof katildi === 'string' && !katildi.startsWith('ret') ? 'GECTI' : 'BULGU', `sonuç ${katildi}; m15 ilerleme ${AG.mqProg(k.S, AG.MQ_BY.m15)}/1`);
  const lv = await k.dene('clan.leave', {}); kay(`${race} T1c klandan ayrılınca m15 ilerlemesi korunur`, AG.mqProg(k.S, AG.MQ_BY.m15) >= 1 ? 'GECTI' : 'BULGU', `ayrılma ${lv.ok ? 'ok' : lv.code}; p.clan=${!!k.S.clan}; ach.c.clan=${k.S.ach?.c?.clan}; ilerleme ${AG.mqProg(k.S, AG.MQ_BY.m15)}`);
  // T2 Örs başarısızlığı m05'i tamamlar
  await k.dene('dev.gear', {}); const it = k.S.items.find(x => (x.p || 0) >= 4) || k.S.items[0]; let son = null, n = 0;
  for (let i = 0; i < 300 && (k.S.stats.upFail || 0) === 0; i++) { const r = await k.dene('anvil.upgrade', { id: it.id }); n++; son = r.ok ? r.r.out : r.code; if (!r.ok) { await k.dene('dev.give', {}); } }
  kay(`${race} T2 başarısız Örs denemesi m05 ilerlemesini doldurur`, (k.S.stats.upFail || 0) > 0 && AG.mqProg(k.S, AG.MQ_BY.m05) >= 1 ? 'GECTI' : 'INCELE', `${n} deneme; upOk ${k.S.stats.upOk} upFail ${k.S.stats.upFail}; m05 ${AG.mqProg(k.S, AG.MQ_BY.m05)}/1; son ${son}`);
}
fs.writeFileSync('T35_SONUC.json', JSON.stringify({ kaynak: process.env.GAME_DIR, tohumlar: [351, 352], not: 'Yerel kural katmanı (MemoryStore, bots:true, dev:true). Tarayıcı/gerçek oyuncu değildir.', sonuclar: R }, null, 1));
