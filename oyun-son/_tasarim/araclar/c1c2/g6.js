const hub=require('./hub.js');(async()=>{const [W,H,race,out]=[+process.argv[2],+process.argv[3],process.argv[4]||'sancak',process.argv[5]||'g6'];const {b,p,err,closeAll}=await hub({race,W,H});
await closeAll();await p.waitForTimeout(1500);await p.screenshot({path:out+'.png'});
const r=await p.evaluate(()=>{const R=s=>{const e=document.querySelector(s);if(!e||!e.getClientRects().length)return null;const r=e.getBoundingClientRect();return [r.x,r.y,r.right,r.bottom].map(Math.round)};
const dock=[...document.querySelectorAll('.dock button, .dock .dbtn, .dock > *')].map(e=>{const r=e.getBoundingClientRect();return [e.textContent.trim().slice(0,10),Math.round(r.x),Math.round(r.right),Math.round(r.y)]});
const res=[...document.querySelectorAll('.res > *, .pill, .rbar > *')].filter(e=>e.getClientRects().length).map(e=>{const r=e.getBoundingClientRect();return [e.className.slice(0,20),e.textContent.trim().slice(0,8),Math.round(r.x),Math.round(r.right)]});
return {vw:innerWidth,qtrk:R('.qtrk'),dock:R('.dock'),dockB:dock,chat:R('#chatbar'),res}});
console.log(JSON.stringify(r));console.log(err.join('\n')||'hata yok');await b.close();})();
