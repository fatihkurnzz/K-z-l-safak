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

fs.mkdirSync(cikti,{recursive:true});
const T0=Date.now(), SURE=(+process.env.SURE_DK||5)*60000, kayit=[];
const durum=()=>pg.evaluate(async()=>{const m=await import('/js/api.js');const S=m.S||{};const w=document.querySelector('#win:not([hidden]) h2'),mo=document.querySelector('#modal:not([hidden])');const gorunur=[...document.querySelectorAll('button')].filter(b=>b.offsetParent&&b.getBoundingClientRect().width>20).map(b=>b.textContent.trim().slice(0,20)).filter(Boolean).slice(0,8);return {lvl:S.lvl,xp:S.xp,akce:S.akce,items:(S.items||[]).length,win:w&&w.textContent,modal:mo?mo.textContent.slice(0,80):null,dyn:document.documentElement.dataset.hub2d||null,dugmeler:gorunur,savas:!!document.querySelector('#battleUI:not([hidden])')}});
let n=0;
while(Date.now()-T0<SURE){
  const d=await durum();kayit.push({t:Math.round((Date.now()-T0)/1000),...d});
  if(n%4===0)await pg.screenshot({path:`${cikti}/yeni_${irk}_${String(n).padStart(3,'0')}.jpg`,type:'jpeg',quality:50}).catch(()=>{});
  // geliştirici aracı YOK: yalnız oyuncunun görebileceği düğmeler. Öncelik: ileri/devam/tamam/başla/savaş
  const tik=await pg.evaluate(()=>{const ok=/^(Devam|İleri|Tamam|Başla|Başlat|Savaş|Saldır|Al|Topla|Kuşan|Giy|Kabul|Geç|Anladım|Sonraki|Hadi|Evet)/i;const adaylar=[...document.querySelectorAll('#modal button, #win button, .p26o button, .fskip, #hud button')].filter(b=>b.offsetParent&&!/Atla|atla|Skip|Kapat|✕|×/.test(b.textContent));const b=adaylar.find(x=>/›$/.test(x.textContent.trim()))||adaylar.find(x=>ok.test(x.textContent.trim()));if(b){b.click();return b.textContent.trim().slice(0,20)}return null});
  if(tik)kayit[kayit.length-1].tik=tik;
  n++;await W(2500);
}
fs.writeFileSync(cikti+`/yeni_${irk}_zaman.json`,JSON.stringify({sure_dk:SURE/60000,not:'Yazılım GL; savaş turu 20-75 sn. Geliştirici (dev.*) eylemi KULLANILMADI. Oyuncunun yerine karar vermeden yalnız ileri/devam düğmelerine basıldı.',kayit,hatalar:R.hatalar},null,1));
console.log('bitti',kayit.length,'ölçüm; son:',JSON.stringify(kayit[kayit.length-1]).slice(0,300));await b.close();
