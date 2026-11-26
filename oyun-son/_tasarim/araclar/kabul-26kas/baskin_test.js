// Baskın: penceresi cumartesi 00:00 – pazartesi 00:00 (UTC+3, shared/baskin.js raidOpen). Saat cumartesiye alınır. node baskin_test.js <halk> <çıktı>
const { chromium } = require('playwright'); const fs = require('fs'); const giris = require('./giris.js');
const [, , race, out] = process.argv; fs.mkdirSync(out, { recursive: true });
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 880, height: 406 }, deviceScaleFactor: 2 }); const err = []; p.on('pageerror', e => err.push(e.message));
  await p.clock.install({ time: new Date('2026-11-28T09:00:00Z') }); // cumartesi 12:00 UTC+3
  await giris(p, race, '?gfx=low&store=1&dd_oto=1');
  await p.evaluate(() => { try { localStorage.setItem('dd_oto', '1'); } catch { } const m = document.querySelector('#modal'); if (m) { m.hidden = true; m.innerHTML = ''; } });
  await p.evaluate(async () => { const C = await import('/js/ui-core.js'); await C.ACT.baskin?.({}); }); await p.waitForTimeout(1500); await p.screenshot({ path: `${out}/baskin_1_pencere.png` });
  const R = { acik: await p.evaluate(async () => (await import('/shared/baskin.js')).raidOpen((await import('/js/api.js')).now())) };
  await p.evaluate(async () => { const C = await import('/js/ui-core.js'); C.ACT.baskinGo?.(); }); await p.waitForTimeout(2500); await p.screenshot({ path: `${out}/baskin_2_vs.png` });
  const vs = await p.evaluate(() => !!document.querySelector('[data-a="vsStart"]')); if (vs) await p.evaluate(() => document.querySelector('[data-a="vsStart"]').click());
  R.savas = await p.waitForSelector('#battleUI:not([hidden])', { timeout: 20000 }).then(() => true).catch(() => false); await p.waitForTimeout(3000);
  R.zemin = await p.evaluate(async () => (await import('/js/savas-arka.js')).ZEMIN.aktif); await p.screenshot({ path: `${out}/baskin_3_savas.png` });
  R.sonuc = await p.waitForSelector('#modal .p25bres, #modal .rz2, #modal .bres', { timeout: 300000 }).then(() => true).catch(() => false); await p.waitForTimeout(2000); await p.screenshot({ path: `${out}/baskin_4_sonuc.png` });
  R.js_hata = err; fs.writeFileSync(`${out}/sonuc.json`, JSON.stringify(R, null, 1)); console.log(JSON.stringify(R)); await b.close(); })().catch(e => { console.log('FATAL', e.message); process.exit(1); });
