const {chromium}=require('playwright');
const [,,race,out]=process.argv;
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:846,height:412},deviceScaleFactor:2});
const err=[];p.on('pageerror',e=>err.push(e.message));p.on('requestfailed',r=>err.push('FAIL '+r.url()));p.on('console',m=>{if(m.type()==='error')err.push('C '+m.text())});
const tk=async(sel,ms=6000)=>{try{await p.waitForSelector(sel,{timeout:ms});await p.evaluate(s=>document.querySelector(s).click(),sel);return true}catch{err.push('yok: '+sel);return false}};
await p.goto('http://localhost:8765/?gfx=high');await p.waitForTimeout(3000);
await tk('.ld-go',10000);await p.waitForTimeout(1200);await p.waitForSelector('[data-o="race"]',{timeout:15000});await p.evaluate(r=>[...document.querySelectorAll('[data-o="race"]')][r==='ocak'?1:0].click(),race);await p.fill('#olzname','Deneme');await tk('#olzgo');await p.waitForTimeout(2500);
await tk('#tkenter',10000);await p.waitForTimeout(2500);await p.evaluate(()=>[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Geç')?.click());await p.waitForTimeout(2000);
await p.waitForSelector('.tskip',{timeout:10000}).catch(()=>err.push('tskip yok'));await p.evaluate(()=>document.querySelector('.tskip')?.click());await p.waitForTimeout(1500);
for(let i=0;i<3;i++){ if(await p.evaluate(()=>!!document.documentElement.dataset.hub2d)) break; await p.evaluate(()=>{for(const b of document.querySelectorAll('button')){if(/^(Atla|Evet|Tamam|Onayla|Evet, atla|Öğreticiyi atla)$/.test(b.textContent.trim())&&b.offsetParent){b.click();break}}}); await p.waitForTimeout(2500);}
console.log('hub2d=',await p.evaluate(()=>document.documentElement.dataset.hub2d||null));
await p.waitForTimeout(1500);await p.screenshot({path:out+'-1.png'});
// bina basılı tut (parlama)
const pt=await p.evaluate(async()=>{const m=await import('./js/hub2d.js');return m.pos2d('anvil')});
if(pt){await p.mouse.move(pt.x,pt.y+40);await p.mouse.down();await p.waitForTimeout(300);await p.screenshot({path:out+'-2.png'});await p.mouse.up();await p.waitForTimeout(1200);await p.screenshot({path:out+'-3.png'});await p.keyboard.press('Escape');await p.evaluate(()=>document.querySelector('.modal .x, [data-a="closeWin"], .win .x')?.click());}
// kaydır: aşağı sürükle
await p.waitForTimeout(500);await p.mouse.move(420,200);await p.mouse.down();await p.mouse.move(420,320,{steps:8});await p.mouse.up();await p.waitForTimeout(600);await p.screenshot({path:out+'-4.png'});
await p.evaluate(()=>document.querySelector('.blabel[data-id="carsi"]')?.click());await p.waitForTimeout(3500);console.log('yer=',await p.evaluate(()=>document.documentElement.dataset.hub2d));await p.screenshot({path:out+'-5.png'});
console.log(err.slice(0,8).join('\n')||'hata yok');await b.close();})();
