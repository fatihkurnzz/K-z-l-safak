const { chromium } = require('playwright'); const giris = require('/home/user/K-z-l-safak/oyun-son/_tasarim/araclar/kabul-26kas/giris.js'); const D = require('/home/user/K-z-l-safak/oyun-son/_tasarim/araclar/kabul-26kas/denetci.js');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 880, height: 406 }, deviceScaleFactor: 2.66 }); await giris(p, 'ocak', '?gfx=low&store=1');
  await p.evaluate(async () => { const m = document.querySelector('#modal'); if (m) { m.hidden = true; m.innerHTML = ''; } const C = await import('/js/ui-core.js'); C.ACT.anvil({}); }); await p.waitForTimeout(1500);
  await p.evaluate(() => document.querySelector('#win .ivc')?.click()); await p.waitForTimeout(800);
  const h = await p.evaluate(() => [document.querySelector('#win .frame > header h2').getBoundingClientRect().right, ...[...document.querySelectorAll('#win .frame > header .wres > span')].map(e => [e.className, e.textContent.trim(), Math.round(e.getBoundingClientRect().width), e.scrollWidth, Math.round(e.getBoundingClientRect().left)])]); console.log('wres', JSON.stringify(h));
  await p.screenshot({ path: 'ors-ana.png', clip: { x: 0, y: 0, width: 880, height: 50 } }); console.log('ana', JSON.stringify((await p.evaluate(D)).tasma));
  await p.evaluate(async () => { const C = await import('/js/ui-core.js'); C.ACT.upPrev(); }); await p.waitForTimeout(1200);
  const o = await p.evaluate(D); console.log('upPrev', JSON.stringify({ k: o.kucukYazi, t: o.tasma, kes: o.kesik })); await p.screenshot({ path: 'ors-prev.png' }); await b.close(); })();
