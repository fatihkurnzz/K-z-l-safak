import { dunya, imp } from './h.mjs'; const I = await imp('items.js');
for (const cls of ['warrior','rogue']) { const d = await dunya(7); d.st.dev=false; const k = await d.kar({ name: 'Deneme'+(cls==='warrior'?'A':'B'), race:'ocak', cls }); await k.dene('tut.skip', {});
 console.log(cls, JSON.stringify(k.S.items), 'kuşam', JSON.stringify(Object.values(k.S.heroes)[0].eq));
 for (const it of k.S.items) console.log('  ', it.b, I.itemBase(it.b)?.name, 'g', it.g, 'p', it.p); }
