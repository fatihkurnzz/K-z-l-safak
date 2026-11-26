// G2-12 (P34): haftalık sıfırlama — pazartesi 00:00 UTC+3 sınırında p.weekly yenilenir mi. node hafta_test.js <çıktı>
// Yöntem: Playwright saat denetimi (sanal saat), yerel kip. Pazar 23:58 UTC+3 (= 2026-11-29T20:58Z) → 3 dk ileri.
const { chromium } = require('playwright'); const fs = require('fs'); const giris = require('./giris.js');
const out = process.argv[2]; fs.mkdirSync(out, { recursive: true }); const R = { hatalar: [] };
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 880, height: 406 } }); p.on('pageerror', e => R.hatalar.push(e.message.slice(0, 160)));
  await giris(p, 'ocak', '?gfx=low&store=1'); await p.clock.install({ time: new Date('2026-11-29T20:58:00Z') }); await p.waitForTimeout(500);
  const bak = () => p.evaluate(async () => { const A = await import('/js/api.js'); const C = await import('/shared/content.js'); try { await A.act('ping', {}); } catch { } return { hafta_anahtari_istemci: C.weekKey(A.now()), S_weekly: A.S?.weekly ? JSON.stringify(A.S.weekly).slice(0, 120) : null }; });
  R.once = await bak(); await p.clock.fastForward('03:00'); await p.waitForTimeout(500); R.sonra = await bak();
  R.gecti = R.once.hafta_anahtari_istemci + 1 === R.sonra.hafta_anahtari_istemci;
  fs.writeFileSync(out + '/sonuc.json', JSON.stringify(R, null, 1)); console.log(JSON.stringify(R)); await b.close(); })();
