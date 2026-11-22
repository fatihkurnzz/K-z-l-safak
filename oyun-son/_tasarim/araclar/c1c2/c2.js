const {chromium}=require('playwright');
const [,,gfx,race,stage,out]=process.argv;
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:880,height:406},deviceScaleFactor:1});
const err=[],reqs=[];p.on('pageerror',e=>err.push(e.message));p.on('request',r=>{const u=r.url();if(/\/models\//.test(u))reqs.push(u.replace(/.*\/models\//,''))});
const tk=async(sel,ms=6000)=>{try{await p.waitForSelector(sel,{timeout:ms});await p.evaluate(s=>document.querySelector(s).click(),sel);return true}catch{err.push('yok: '+sel);return false}};
await p.goto('http://localhost:8765/?gfx='+gfx);await p.waitForTimeout(3000);
await tk('.ld-go',15000);await p.waitForTimeout(1200);await p.waitForSelector('[data-o="race"]',{timeout:15000});await p.evaluate(r=>[...document.querySelectorAll('[data-o="race"]')][r==='ocak'?1:0].click(),race);await p.fill('#olzname','Deneme');await tk('#olzgo');await p.waitForTimeout(2500);
await tk('#tkenter',10000);await p.waitForTimeout(2500);await p.evaluate(()=>[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Geç')?.click());await p.waitForTimeout(2000);
await p.evaluate(()=>document.querySelector('.tskip')?.click());await p.waitForTimeout(1500);
for(let i=0;i<3;i++){ if(await p.evaluate(()=>!!document.documentElement.dataset.hub2d)) break; await p.evaluate(()=>{for(const b of document.querySelectorAll('button')){if(/^(Atla|Evet|Tamam|Onayla|Evet, atla|Öğreticiyi atla)$/.test(b.textContent.trim())&&b.offsetParent){b.click();break}}}); await p.waitForTimeout(2500);}
await p.evaluate(async()=>{const C=await import('/js/ui-core.js');for(let i=0;i<5;i++)await C.ACT.devLevel?.();await C.ACT.devUnlock?.();await C.ACT.devEnergy?.();});await p.waitForTimeout(1500);
await p.evaluate(()=>{const m=document.querySelector('#modal');if(m&&!m.hidden){m.hidden=true;m.innerHTML=''}});
await p.evaluate(async s=>{const C=await import('/js/ui-core.js');C.ACT.stage({id:s});},stage);await p.waitForTimeout(1500);
await tk('[data-a="vsStart"]');await p.waitForTimeout(6000);
const info=await p.evaluate(async()=>{const W=await import('/js/world.js');return {rigged:window.DD_RIGGED,gfx:window.DD_GFX?.get?.(),stats:window.DD_GFX?.stats?.(),actors:W.world.actors.map(a=>({name:a.unit?.name||a.name,side:a.unit?.side||a.side,tid:a.unit?.tid,mid:a.unit?.mid,kind:a.unit?.look?.kind,cls:a.char?.constructor?.name}))}});
console.log(JSON.stringify({gfx,race,stage,...info,modelReqs:reqs.length,sample:reqs.slice(0,30)},null,1));
await p.screenshot({path:out});console.log(err.slice(0,6).join('\n')||'hata yok');await b.close();})();
