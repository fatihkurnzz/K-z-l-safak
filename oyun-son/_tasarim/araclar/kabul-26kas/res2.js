const { chromium } = require('playwright'); const giris = require('/home/user/K-z-l-safak/oyun-son/_tasarim/araclar/kabul-26kas/giris.js'); const D = require('/home/user/K-z-l-safak/oyun-son/_tasarim/araclar/kabul-26kas/denetci.js');
(async () => { const b = await chromium.launch();
 for (const [W, H] of [[880, 406], [1180, 820], [667, 375]]) { const p = await b.newPage({ viewport: { width: W, height: H } }); await giris(p, 'sancak', '?gfx=low&store=1');
  for (const [a, d, t] of [['karakter', {}, 'unvan'], ['karakter', {}, 'skill'], ['baskin', {}, 'dungeons'], ['drawer', {}], ['gateZones', {}]]) {
    await p.evaluate(async ([a, d, t]) => { const C = await import('/js/ui-core.js'); const m = document.querySelector('#modal'); if (m) { m.hidden = true; m.innerHTML = ''; } C.closeWin(true); try { await C.ACT[a](d); } catch { } if (t) { await new Promise(r => setTimeout(r, 800)); C.ACT.tab({ id: t }); } }, [a, d, t]); await p.waitForTimeout(1300);
    const o = await p.evaluate(D); console.log(W, a, t || '', JSON.stringify({ k: (o.kucukYazi || []).slice(0, 4), kes: o.kesik, tas: o.tasma, cak: o.cakisma })); }
  await p.close(); }
 await b.close(); })();
