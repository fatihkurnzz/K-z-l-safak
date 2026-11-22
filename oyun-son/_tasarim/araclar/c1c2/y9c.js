const hub=require('./hub.js');(async()=>{const {b,p,err,act,closeAll}=await hub({race:'sancak'});
await closeAll();await p.waitForTimeout(500);
await p.evaluate(async()=>{const D=await import('/js/ui-duyuru.js');D.noteToast({title:'Enerjin doldu',icon:'energy',c:'#5fd17a'});});
await p.waitForTimeout(500);const a=await p.evaluate(()=>document.querySelectorAll('#v13toasts .v13-toast').length);
await act('bag');await p.waitForTimeout(500);const c=await p.evaluate(()=>document.querySelectorAll('#v13toasts .v13-toast').length);
await closeAll();await p.waitForTimeout(1600);const d=await p.evaluate(()=>document.querySelector('#v13toasts .v13-toast b')?.textContent);
console.log('önce',a,'pencere açılınca',c,'kapanınca',d);console.log(err.join('\n')||'hata yok');await b.close();})();
