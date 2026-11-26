// H-P35-03: altı yaratığın gerçek doğum yolları (zoneNormals, aşama tanımları, boss/olay) — statik değil, modül verisinden.
const R=process.argv[2]; const Z=await import(R+'/shared/zones.js');
const ids=['stegodon','shadow_spectre','mana_spectre','mage_ghost','wandering_knight_ghost','dread_knight'];
const out={};
for(const id of ids){ const m=Z.MOBS[id]; const o={tanimli:!!m, ad:m?.name, aile_bolge:m?.zone, normal_havuz:[], asama:[]};
  for(const z of Z.ZONES){ if(Z.zoneNormals(z).includes(id)) o.normal_havuz.push(z.id);
    for(const s of Z.zoneStages(z.id)){ const d=Z.stageDef?Z.stageDef(s.id||s):null; const t=JSON.stringify(d||s); if(t.includes('"'+id+'"')) o.asama.push(s.id||s); } }
  o.asama=o.asama.slice(0,5); out[id]=o; }
console.log(JSON.stringify(out,null,1));
