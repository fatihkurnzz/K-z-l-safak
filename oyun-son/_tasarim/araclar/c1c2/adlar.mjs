const R='/home/user/K-z-l-safak/oyun-son/shared/';
const I=await import(R+'items.js'), K=await import(R+'skills.js'), C=await import(R+'content.js');
const fs=await import('fs');
const q=v=>{v=v==null?'':String(v);return /[",\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v};
const rows=[['kimlik','tur','sinif','derece','mevcut_ad']];const seen=new Set();
const DER=['Standart','Nadir','Eşsiz'];
const add=(b)=>{const B=I.itemBase(b);if(!B||seen.has(b))return;seen.add(b);
 const tur=B.kind==='armor'?'zirh:'+B.type:B.kind==='jewel'?'taki:'+B.type:B.kind==='shield'?'kalkan':'silah:'+B.type;
 const cls=(B.cls||[]).map(c=>C.CLASSES?.[c]?.name||c).join('/');
 rows.push([b,tur,cls,B.unique?'Eşsiz':'k'+B.tier,B.name]);};
for(const b of I.allBases())add(b);for(const a of Object.keys(I.UNIQUES))add('u:'+a);
let ns=0;for(const [id,s] of Object.entries(K.SKILLS)){if(!s?.name)continue;const cls=(s.cls?[].concat(s.cls):[]).map(c=>C.CLASSES?.[c]?.name||c).join('/');rows.push(['skill:'+id,'yetenek',cls,'',s.name]);ns++;}
fs.writeFileSync(process.argv[2],'﻿'+rows.map(r=>r.map(q).join(',')).join('\n')+'\n');
console.log('satır',rows.length-1,'yetenek',ns);
