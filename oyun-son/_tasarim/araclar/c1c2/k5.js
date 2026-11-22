const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage();await p.goto('http://localhost:8765/?gfx=min');await p.waitForTimeout(3000);
const r=await p.evaluate(async()=>{const I=await import('/shared/items.js');const C=await import('/js/item-icons.js');const us=Object.keys(I.UNIQUES).map(a=>'u:'+a);
const all=I.allBases();let noPng=[];for(const b of [...all,...us]){const B=I.itemBase(b);if(!B)continue;if(!C.itemPng(b))noPng.push(b+' '+B.kind)}
return {eşsiz:us.length,zırh:us.filter(b=>I.itemBase(b)?.kind==='armor').length,boyalısız:noPng.length,tür:[...new Set(noPng.map(x=>x.split(' ')[0].split(':').slice(0,2).join(':')))]}});console.log(JSON.stringify(r));await b.close();})();
