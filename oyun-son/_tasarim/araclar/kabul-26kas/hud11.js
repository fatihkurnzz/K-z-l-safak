const { chromium } = require('playwright'); const giris = require('/home/user/K-z-l-safak/oyun-son/_tasarim/araclar/kabul-26kas/giris.js');
(async () => { const race = process.argv[2] || 'ocak'; const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 880, height: 406 }, deviceScaleFactor: 1 });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await giris(p, race);
  const scan = () => p.evaluate(() => { const out = {}; for (const e of document.querySelectorAll('body *')) { if (e.closest('#win,#modal,#p28bina,#loading')) continue; const r = e.getBoundingClientRect(); if (!r.width || !e.offsetParent) continue; const t = [...e.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join(''); if (!t) continue; const fs = parseFloat(getComputedStyle(e).fontSize); if (fs < 11) { const sel = e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\s+/).join('.') : ''); const par = e.parentElement; const ps = par ? par.tagName.toLowerCase() + (par.id ? '#' + par.id : '') + (typeof par.className === 'string' && par.className ? '.' + par.className.trim().split(/\s+/)[0] : '') : ''; const k = ps + ' > ' + sel; out[k] = out[k] || { fs, t: t.slice(0, 30), n: 0 }; out[k].n++; } } return out; });
  const hub = await scan(); await p.screenshot({ path: "hud-" + race + ".png" });
  // savaş HUD
  await p.evaluate(async () => { const C = await import('/js/ui-core.js'); C.ACT.gate?.({}); });
  await p.waitForTimeout(1500);
  await p.evaluate(() => { const b = [...document.querySelectorAll('#win button')].find(x => /Savaş|Başla|Saldır/.test(x.textContent)); b?.click(); }); await p.waitForTimeout(2500);
  await p.evaluate(() => { const b = [...document.querySelectorAll('#win button, .vs2 button')].find(x => /Başla/.test(x.textContent)); b?.click(); }); await p.waitForTimeout(6000);
  const bt = await scan();
  console.log(JSON.stringify({ race, hub, bt, errs }, null, 1)); await b.close(); })();
