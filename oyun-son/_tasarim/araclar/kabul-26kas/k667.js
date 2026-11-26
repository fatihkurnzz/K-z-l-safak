const { chromium } = require('playwright'); const giris = require('/home/user/K-z-l-safak/oyun-son/_tasarim/araclar/kabul-26kas/giris.js'); const D = require('/home/user/K-z-l-safak/oyun-son/_tasarim/araclar/kabul-26kas/denetci.js');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 667, height: 375 }, deviceScaleFactor: 2 }); await giris(p, 'ocak', '?gfx=low&store=1');
  for (const [a, d, t] of [['shop', {}, 'money'], ['profile', { id: 'me' }], ['monument', {}], ['gateZones', {}], ['worldInfo', {}], ['karakter', {}], ['hub', {}], ['goCarsi', {}]]) {
    await p.evaluate(async ([a, d, t]) => { const C = await import('/js/ui-core.js'); const m = document.querySelector('#modal'); if (m) { m.hidden = true; m.innerHTML = ''; } C.closeWin(true); try { await C.ACT[a](d); } catch { } if (t) { await new Promise(r => setTimeout(r, 700)); C.ACT.tab({ id: t }); } }, [a, d, t]); await p.waitForTimeout(a === 'goCarsi' ? 3500 : 1400);
    const o = await p.evaluate(D);
    const yol = await p.evaluate(() => { const out = []; for (const e of document.querySelectorAll('#win *, #modal *, #hud *, .blabel')) { if (!e.getClientRects().length) continue; const s = getComputedStyle(e); if ((e.scrollWidth > e.clientWidth + 1 && (s.overflow === 'hidden' || s.textOverflow === 'ellipsis')) ) { const pth = []; let x = e; for (let i = 0; i < 4 && x; i++, x = x.parentElement) pth.unshift(x.tagName.toLowerCase() + (typeof x.className === 'string' && x.className ? '.' + x.className.trim().split(/\s+/).slice(0, 2).join('.') : '')); out.push(pth.join('>') + ' «' + e.textContent.trim().slice(0, 25) + '»'); } } return [...new Set(out)].slice(0, 8); });
    console.log('==', a, t || '', JSON.stringify({ kes: o.kesik, tas: o.tasma, cak: o.cakisma }), '\n  ', yol.join('\n   '));
    if (a === 'hub' || a === 'goCarsi') await p.screenshot({ path: `k667-${a}.png` });
  }
  await b.close(); })();
