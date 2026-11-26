// G2-12 (P34): çoklu sekme — aynı tarayıcıda ikinci sekme aynı karakteri seçince ilk sekme kilitlenmeli ve kaydı ezmemeli. node sekme_test.js <çıktı>
const { chromium } = require('playwright'); const fs = require('fs'); const giris = require('./giris.js');
const out = process.argv[2]; fs.mkdirSync(out, { recursive: true }); const R = { hatalar: [] };
(async () => { const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 880, height: 406 } });
  const A = await ctx.newPage(); A.on('pageerror', e => R.hatalar.push('A ' + e.message.slice(0, 160))); await giris(A, 'ocak');
  R.A_once = await A.evaluate(async () => { const { S, locked } = await import('/js/api.js'); return { akce: S.akce, kilit: locked() }; });
  const B = await ctx.newPage(); B.on('pageerror', e => R.hatalar.push('B ' + e.message.slice(0, 160)));
  await B.goto('http://localhost:8765/?gfx=low&dev=0');
  const tk = async (P, sel, ms = 30000) => { try { await P.waitForSelector(sel, { timeout: ms }); await P.evaluate(s => document.querySelector(s).click(), sel); return true; } catch { return false; } };
  R.B_secim = { sunucu: await tk(B, '.sv-go', 60000) }; R.B_secim.gir = await tk(B, '#tkenter', 30000);
  await B.waitForTimeout(4000); R.B_secim.oyunda = await B.evaluate(async () => !!(await import('/js/api.js')).S);
  await B.waitForTimeout(2500);
  R.A_sonra = await A.evaluate(async () => { const { locked } = await import('/js/api.js'); const k = locked(); return { kilit: k ? { kind: k.kind, message: k.message } : null, ekranda: document.body.innerText.includes('başka bir cihazda') }; });
  // A'da işlem dene: kilitliyken run() asla çözülmez, kayıt yazılmaz
  R.A_islem = await A.evaluate(async () => { const C = await import('/js/ui-core.js'); const p = C.run('anvil.upgrade', {}); const t = await Promise.race([p.then(() => 'cozuldu'), new Promise(r => setTimeout(() => r('beklemede (kilitli)'), 2500))]); return t; });
  await A.screenshot({ path: out + '/A_kilit.png' });
  fs.writeFileSync(out + '/sonuc.json', JSON.stringify(R, null, 1)); console.log(JSON.stringify(R)); await b.close(); })();
