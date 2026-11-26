const R=process.argv[2]; const I=await import(R+'/shared/items.js');
const b=I.allBases(); const by={}; for(const x of b){const k=x.split(':')[0]+':'+(I.itemBase(x).kind||'?'); by[k]=(by[k]||0)+1;}
console.log(b.length, JSON.stringify(by)); console.log(b.filter(x=>x.startsWith('u:')).slice(0,6), b.filter(x=>/linen|wool/.test(x)).length);
