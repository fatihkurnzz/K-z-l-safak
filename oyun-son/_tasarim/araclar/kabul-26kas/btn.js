const { chromium } = require('playwright'); const giris = require('/home/user/K-z-l-safak/oyun-son/_tasarim/araclar/kabul-26kas/giris.js');
(async () => { const b = await chromium.launch();
 for (const [W, H] of [[880, 406], [1180, 820], [667, 375]]) { const p = await b.newPage({ viewport: { width: W, height: H } }); await giris(p, 'ocak', '?gfx=low&store=1');
  await p.evaluate(async () => { const m = document.querySelector('#modal'); if (m) { m.hidden = true; m.innerHTML = ''; } const C = await import('/js/ui-core.js'); C.ACT.stage({ id: '1-1' }); }); await p.waitForTimeout(2000); await p.evaluate(() => document.querySelector('[data-a="vsStart"]')?.click()); await p.waitForTimeout(4000);
  console.log(W, JSON.stringify(await p.evaluate(() => { const r = {}; for (const id of ['bctl2', 'bapot', 'bauto', 'bspeed', 'bctl']) { const e = document.getElementById(id); if (!e) continue; const q = e.getBoundingClientRect(); const s = getComputedStyle(e); r[id] = [Math.round(q.left), Math.round(q.top), Math.round(q.width), Math.round(q.height), s.position, s.right, s.bottom]; } r.html = document.documentElement.className.slice(0, 120); return r; })));
  if (W === 1180) await p.screenshot({ path: 'bt1180.png' }); await p.close(); }
 await b.close(); })();
