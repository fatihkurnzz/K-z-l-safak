// Bütün eşya tabanları (shared/items.js allBases → itemBase) + yetenekler; TR ad tablosu (adlar-m5.csv) eklenir
import fs from 'fs'; import { pathToFileURL } from 'url'; import path from 'path';
const [, , sh, csv, out] = process.argv;
const I = await import(pathToFileURL(path.resolve(sh, 'items.js')));
const SK = await import(pathToFileURL(path.resolve(sh, 'skills.js')));
const A = fs.readFileSync(csv, 'utf8'); const tr = { ...JSON.parse(A.match(/const ITEM_TR = (\{.*\});/)[1]), ...JSON.parse(A.match(/const SKILL_TR = (\{.*\});/)[1]) };
const temiz = v => JSON.parse(JSON.stringify(v, (k, x) => typeof x === 'function' ? undefined : x));
const esya = I.allBases().map(id => { const b = temiz(I.itemBase(id)); return { kimlik: id, ad_tr: tr[id] || null, ...b }; });
fs.writeFileSync(path.join(out, 'esya_tabanlari.json'), JSON.stringify(esya, null, 1));
const yet = Object.entries(SK.SKILLS).map(([id, s]) => ({ kimlik: id, ad_tr: tr[id] || null, ...temiz(s) }));
fs.writeFileSync(path.join(out, 'yetenekler.json'), JSON.stringify(yet, null, 1));
console.log('eşya', esya.length, 'TR adlı', esya.filter(e => e.ad_tr).length, 'yetenek', yet.length, 'TR', yet.filter(e => e.ad_tr).length);
console.log(JSON.stringify(esya[0]).slice(0, 300));
