const { chromium } = require('playwright'); const giris = require('/home/user/K-z-l-safak/oyun-son/_tasarim/araclar/kabul-26kas/giris.js');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 880, height: 406 } }); await giris(p, 'sancak', '?gfx=low&store=1');
  await p.evaluate(async () => { const C = await import('/js/ui-core.js'); await C.ACT.ayLang({ l: 'en' }); }); await p.waitForTimeout(1500);
  console.log(await p.evaluate(async () => { const I = await import('/js/i18n.js'); const C = await import('/js/ui-core.js'); C.closeWin(true); await C.ACT.premium({}); await new Promise(r => setTimeout(r, 1200)); return JSON.stringify({ t: I.t('Yakında'), lang: I.lang(), price: [...document.querySelectorAll('.tier .price')].map(e => e.innerHTML.slice(0, 120)), btn: [...document.querySelectorAll('.tier button')].map(e => e.textContent) }); }));
  await b.close(); })();
