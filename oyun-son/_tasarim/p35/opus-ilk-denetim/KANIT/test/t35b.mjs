// H: geliştirici aracı olmadan yeni karakter m05 (Örs denemesi) yapabilir mi; başlangıç kaynakları.
import { dunya, imp } from './h.mjs'; const AG = await imp('anagorev.js');
for (const race of ['ocak','sancak']) for (const cls of ['warrior','rogue','mage','priest']) {
  const d = await dunya(7); d.st.dev = false; const k = await d.kar({ name: 'Deneme'+['A','B','C','D'][['warrior','rogue','mage','priest'].indexOf(cls)], race, cls }); await k.dene('tut.skip', {});
  const S = k.S; const items = S.items || []; const stones = JSON.stringify(S.stones); let r = null;
  for (const it of items) { r = await k.dene('anvil.upgrade', { id: it.id }); if (r.ok) break; }
  console.log(race, cls, 'akçe', S.akce, 'taş', stones, 'eşya', items.length, '→', r ? (r.ok ? 'deneme OK ' + r.r.out : r.code + ' ' + r.msg) : 'eşya yok', '| m05', AG.mqProg(k.S, AG.MQ_BY.m05));
}
