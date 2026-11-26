// K040: çalışma zamanı taraması (V42 yayın dosyaları, yerel kip). Kullanım: node rt.mjs <irk> <WxH> <tr|en> <cikti.json>
import { createRequire } from 'node:module'; import fs from 'node:fs';
const require = createRequire(import.meta.url); const { chromium } = require('/opt/node-tools/node_modules/playwright');
const [irk, boyut, dil, cikti, mod] = process.argv.slice(2); const [w, h] = boyut.split('x').map(Number);
const ACTS = 'achs titles bag balik baskin calendar chatMenu clan clanhq codex czArena czHall czMarket destan diyarMap drawer erisim friends gate gateDestan gateEvents gatePvp gateZones hall hotbar iksir karaborsa karakter mail market meydan mine mnMain modInfo monument news nobet notifs onlineOpen otag party pazar premium profile promoMenu questLog quests quick rank rehber reports savas season server settings shop starterOpen supportMenu tuccar wheel worldInfo yakutMenu yashka anvil han ahir zaferAniti'.split(' ');
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await b.newContext({ viewport: { width: w, height: h } }); const pg = await ctx.newPage(); pg.setDefaultTimeout(20000);
const R = { irk, boyut, dil, hatalar: [], http: [], ekranlar: {}, ag: { n: 0, bayt: 0 } };
pg.on('pageerror', e => R.hatalar.push('SAYFA ' + String(e.message).slice(0, 200))); pg.on('console', m => { if (m.type() === 'error' && !/favicon/.test(m.text())) R.hatalar.push('KONSOL ' + m.text().slice(0, 200)); });
pg.on('response', async r => { R.ag.n++; if (r.status() >= 400 && !/favicon/.test(r.url())) R.http.push(r.status() + ' ' + r.url().replace(/^https?:\/\/[^/]+/, '')); try { const l = +(r.headers()['content-length'] || 0); R.ag.bayt += l; } catch { } });
const W = ms => pg.waitForTimeout(ms); const K = sel => pg.evaluate(s => { const e = document.querySelector(s); if (e) { e.click(); return true; } return false; }, sel).catch(() => false);
const Kb = async sel => { await pg.waitForSelector(sel, { timeout: 150000, state: 'attached' }); await K(sel); };
const J = js => pg.evaluate(async code => { const AF = Object.getPrototypeOf(async function () { }).constructor; const C = await import('/js/ui-core.js'); const m = await import('/js/api.js'); return await new AF('C', 'A', 'm', 'S', code)(C, C.ACT, m, m.S); }, js);
const t0 = Date.now(); await pg.goto(`http://127.0.0.1:8770/index.html?local=1&giris=0&gfx=low&lang=${dil}`);
await Kb('.ld-go'); R.yuklemeMs = Date.now() - t0; R.agYukleme = { ...R.ag }; await W(2500); await Kb(`[data-o="race"][data-v="${irk}"]`); await W(1000);
await pg.evaluate(() => { const i = document.querySelector('#olzname'); i.value = 'Denetci'; i.dispatchEvent(new Event('input', { bubbles: true })); });
await Kb('#olzgo'); await W(3000); await Kb('#tkenter'); await W(3000); for (let i = 0; i < 6; i++) { if (!(await K('.fskip'))) break; await W(1200); }
const atla = t => pg.evaluate(t => { const x = [...document.querySelectorAll('button')].find(x => t.some(s => x.textContent.includes(s))); if (x) { x.click(); return true; } return false; }, t);
await W(1500); R.atla1 = await atla(['Öğreticiyi atla', 'Skip']); await W(900); R.atla2 = await atla(['Evet, atla', 'Yes']); await W(3500);
await J("localStorage.setItem('dd_oto_intro','1'); await m.act('dev.level',{lvl:"+(process.env.NOLEVEL?1:53)+"}); await m.act('dev.gear'); await m.act('dev.unlock'); try{await m.act('dev.energy')}catch(e){} C.closeWin(); C.closeModal();"); await W(1500);

fs.mkdirSync(cikti,{recursive:true});
const shot=async n=>{await pg.screenshot({path:`${cikti}/${irk}_${boyut}_${dil}_${n}.jpg`,type:'jpeg',quality:55}).catch(e=>R.hatalar.push('SHOT '+n))};
const baslik=()=>pg.evaluate(()=>{const w=document.querySelector('#win:not([hidden]) h2'),m=document.querySelector('#modal:not([hidden]) h2');return (w&&w.textContent)||(m&&m.textContent)||null});
const log={};
const dene=async(ad,js,w=1300)=>{try{await J("C.closeWin(); C.closeModal(); try{A.binaKapat()}catch(e){}; "+js);await W(w);const t=await baslik();await shot(ad);log[ad]={baslik:t}}catch(e){log[ad]={hata:String(e.message).slice(0,100)}}};
if(mod==='ekran'){for(const a of 'karakter bag quests shop meydan settings clan karaborsa rank news profile gate market tuccar'.split(' '))await dene(a,`A['${a}']&&A['${a}']({})`);}
if(mod==='ic'){for(const a of 'anvil iksir mine king wheel monument carsi pazar'.split(' '))await dene('bina_'+a,`A.building({id:'${a}'})`,1800);}
if(mod==='savas'||mod==='yenilgi'){
 await dene('vs',`A.stage({id:'${mod==='yenilgi'?'2-10':'1-1'}'})`,1800);
 const ok=await pg.evaluate(()=>!!document.querySelector('[data-a="vsStart"]'));log.vsStartVar=ok;
 if(ok){await K('[data-a="vsAuto"]');await W(300);await K('[data-a="vsStart"]');await W(6000);await shot('savas_ortasi');
  for(let i=0;i<40;i++){await W(3000);for(let h=0;h<2;h++)await pg.evaluate(()=>{const s=[...document.querySelectorAll('#battleUI button')].find(b=>/^[123]x$/.test(b.textContent.trim()));if(s&&s.textContent.trim()!=='3x')s.click()});if(await pg.evaluate(()=>!!document.querySelector('#modal .p25bres, .bres, #modal .rz2')))break;}
  await W(2500);await shot('sonuc');log.sonuc=await baslik();}
}
if(mod==='pvp'){for(const a of ['gatePvp','czArena','gateZones','gateEvents','nobet','baskin'])await dene(a,`A['${a}']&&A['${a}']({})`);}
fs.writeFileSync(cikti+`/log_${irk}_${boyut}_${dil}_${mod}.json`,JSON.stringify({log,hatalar:R.hatalar},null,1));await b.close();console.log(mod,irk,boyut,dil,JSON.stringify(log).slice(0,600));
