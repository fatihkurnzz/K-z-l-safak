const R=process.argv[2]; const Z=await import(R+'/shared/zones.js');
const s=Z.zoneStages(4); console.log(typeof s[0], JSON.stringify(s[0]).slice(0,200)); const d=Z.stageDef(s[0].id||s[0]); console.log(JSON.stringify(d).slice(0,300));
let say={}; for(const z of Z.ZONES) for(const st of Z.zoneStages(z.id)){ const t=JSON.stringify(Z.stageDef(st.id||st)); for(const m of t.match(/"mob":"[a-z_]+"/g)||[]) say[m]=(say[m]||0)+1; }
console.log(Object.keys(say).length,'farklı mob aşamalarda');
