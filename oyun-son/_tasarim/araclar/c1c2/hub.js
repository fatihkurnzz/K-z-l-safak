// ortak: oyunu aç, karakter oluştur, ana merkeze gel. module.exports = async (opts) => {b,p,err}
const {chromium}=require('playwright');
module.exports=async({race='sancak',W=880,H=406,dpr=1,q=''}={})=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:W,height:H},deviceScaleFactor:dpr});
const err=[];p.on('pageerror',e=>err.push(e.message));p.on('console',m=>{if(m.type()==='error')err.push('C '+m.text().slice(0,200))});
const tk=async(sel,ms=6000)=>{try{await p.waitForSelector(sel,{timeout:ms});await p.evaluate(s=>document.querySelector(s).click(),sel);return true}catch{err.push('yok: '+sel);return false}};
await p.goto('http://localhost:8765/?gfx=min'+q);await p.waitForTimeout(2500);
await tk('.ld-go',15000);await p.waitForTimeout(1200);await p.waitForSelector('[data-o="race"]',{timeout:15000});await p.evaluate(r=>[...document.querySelectorAll('[data-o="race"]')][r==='ocak'?1:0].click(),race);await p.fill('#olzname','Deneme');await tk('#olzgo');await p.waitForTimeout(2500);
await tk('#tkenter',10000);await p.waitForTimeout(2500);await p.evaluate(()=>[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Geç')?.click());await p.waitForTimeout(2000);
await p.evaluate(()=>document.querySelector('.tskip')?.click());await p.waitForTimeout(1500);
for(let i=0;i<3;i++){ if(await p.evaluate(()=>!!document.documentElement.dataset.hub2d)) break; await p.evaluate(()=>{for(const b of document.querySelectorAll('button')){if(/^(Atla|Evet|Tamam|Onayla|Evet, atla|Öğreticiyi atla)$/.test(b.textContent.trim())&&b.offsetParent){b.click();break}}}); await p.waitForTimeout(2500);}
const act=async(name,d={})=>{await p.evaluate(async([n,d])=>{const C=await import('/js/ui-core.js');await C.ACT[n]?.(d)},[name,d]);};
const closeAll=async()=>p.evaluate(()=>{const m=document.querySelector('#modal');if(m&&!m.hidden){m.hidden=true;m.innerHTML=''}document.querySelector('#win .x, [data-a="closeWin"]')?.click()});
return {b,p,err,tk,act,closeAll};};
