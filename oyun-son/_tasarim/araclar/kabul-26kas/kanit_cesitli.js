// devUI (N1-01) ve T3 (N3-01) kanıtı. node kanit_cesitli.js <çıktı>
const { chromium } = require('playwright'); const fs = require('fs'); const giris = require('./giris.js');
const [, , out] = process.argv; fs.mkdirSync(out, { recursive: true }); const R = {};
(async () => { const b = await chromium.launch();
  for (const [ad, q] of [['varsayilan', '?gfx=low'], ['dev0', '?gfx=low&dev=0'], ['store1', '?gfx=low&store=1']]) {
    const p = await b.newPage({ viewport: { width: 880, height: 406 }, deviceScaleFactor: 2 }); await giris(p, 'sancak', q);
    await p.evaluate(async () => { const C = await import('/js/ui-core.js'); await C.ACT.profile({ id: 'me' }) }); await p.waitForTimeout(1500);
    R['devUI_' + ad] = await p.evaluate(() => ({ profil_test_araclari: !!document.querySelector('#modal .pp-dev'), deneme_rozeti: !![...document.querySelectorAll('.dev')].find(e => e.getClientRects().length) }));
    await p.screenshot({ path: `${out}/devui_${ad}_profil.png` }); await p.close();
  }
  for (const [ad, q] of [['t3_kapali_varsayilan', '?gfx=low&store=1'], ['t3_acik', '?gfx=low&store=1&t3=1']]) for (const race of ['ocak', 'sancak']) {
    const p = await b.newPage({ viewport: { width: 880, height: 406 }, deviceScaleFactor: 2 }); await giris(p, race, q);
    await p.evaluate(async () => { const C = await import('/js/ui-core.js'); await C.ACT.party({}) }); await p.waitForTimeout(2200);
    R[`${ad}_${race}`] = await p.evaluate(() => { const i = document.querySelector('#win .kx-hero2b'); return i ? { t3_sinifi: i.classList.contains('p26-t3'), kaynak_kisa: i.src.slice(0, 40) } : null; });
    await p.screenshot({ path: `${out}/${ad}_${race}_karakter.png` }); await p.close();
  }
  fs.writeFileSync(`${out}/sonuc.json`, JSON.stringify(R, null, 1)); console.log(JSON.stringify(R)); await b.close();
})().catch(e => { console.log('FATAL', e.message); process.exit(1) });
