// Savaş kaydı: node vid.js <ocak|sancak> <çıktı klasörü>  → <halk>-1-1.webm, <halk>-1-25.webm (VS → savaş (OTO, 2x) → sonuç)
const { chromium } = require('playwright'); const fs = require('fs');
const [, , race, out] = process.argv; fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 880, height: 406 }, deviceScaleFactor: 1, recordVideo: { dir: out + '/_ham', size: { width: 880, height: 406 } } });
  const T0 = Date.now(); const p = await ctx.newPage(); const err = []; p.on('pageerror', e => err.push(e.message.slice(0, 160)));
  const tk = async (s, ms = 8000) => { try { await p.waitForSelector(s, { timeout: ms }); await p.evaluate(s => document.querySelector(s).click(), s); return true } catch { return false } };
  const act = (n, d = {}) => p.evaluate(async ([n, d]) => { const C = await import('/js/ui-core.js'); if (!C.ACT[n]) return 'yok'; try { await C.ACT[n](d); return 'ok' } catch (x) { return 'hata ' + x.message } }, [n, d]);
  await p.goto('http://localhost:8765/?gfx=high'); await tk('.sv-go', 20000); await p.waitForSelector('[data-o="race"]', { timeout: 20000 });
  await p.evaluate(r => document.querySelectorAll('[data-o="race"]')[r === 'ocak' ? 1 : 0].click(), race); await p.fill('#olzname', 'Denetci'); await tk('#olzgo'); await p.waitForTimeout(2500);
  await tk('#tkenter', 10000); await p.waitForTimeout(2500); await p.evaluate(() => [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Geç')?.click()); await p.waitForTimeout(2000);
  for (let i = 0; i < 6; i++) { const d = await p.evaluate(() => { const v = s => [...document.querySelectorAll(s)].some(e => e.offsetParent && e.getBoundingClientRect().width > 0); if (v('.ks-enter')) { document.querySelector('.ks-enter').click(); return 'ks' } if (v('.p26o-x')) { document.querySelector('.p26o-x').click(); return 'ogr' } for (const b of document.querySelectorAll('button')) if (/^(Evet, atla|Tamam|Atla)$/.test(b.textContent.trim()) && b.offsetParent) { b.click(); return 'btn' } return v('.blabel') ? 'hub' : '?' }); if (d === 'hub') break; await p.waitForTimeout(1500) }
  for (let i = 0; i < 3; i++) { await p.evaluate(() => { for (const b of document.querySelectorAll('button')) { if (/^(Atla|Evet|Tamam|Onayla|Evet, atla|Öğreticiyi atla)$/.test(b.textContent.trim()) && b.offsetParent) { b.click(); break } } }); await p.waitForTimeout(1200) }
  await p.evaluate(async () => { const m = document.querySelector('#modal'); if (m && !m.hidden) { m.hidden = true; m.innerHTML = '' } const C = await import('/js/ui-core.js'); for (let i = 0; i < 10; i++) await C.ACT.devLevel(); await C.ACT.devGive(); await C.ACT.devGear(); await C.ACT.devUnlock(); await C.ACT.devEnergy(); C.closeWin(true) });
  await p.waitForTimeout(2000); await p.evaluate(() => { const m = document.querySelector('#modal'); if (m && !m.hidden) { m.hidden = true; m.innerHTML = '' } });
  const zaman = {};
  for (const st of ['1-1', '1-25']) {
    zaman[st] = { bas: Date.now() };
    const r = await act('stage', { id: st }); await p.waitForTimeout(2500);
    await tk('[data-a="vsStart"]'); await p.waitForTimeout(2500);
    if (st === '1-1') await p.evaluate(() => { const s = [...document.querySelectorAll('#battleUI button')].find(b => /Otomatik/.test(b.textContent)); s?.click() });
    for (let i = 0; i < 3; i++) { await p.waitForTimeout(700); await p.evaluate(() => { const s = [...document.querySelectorAll('#battleUI button')].find(b => /^[123]x$/.test(b.textContent.trim())); if (s && s.textContent.trim() !== '3x') s.click() }) }
    const ok = await p.waitForSelector('.bres, #modal .p25bres, #modal .rz2', { timeout: 300000 }).then(() => true).catch(() => false);
    await p.waitForTimeout(3000); zaman[st].bit = Date.now(); zaman[st].sonuc = ok ? 'sonuç ekranı' : 'zaman aşımı'; zaman[st].stage = r;
    await p.evaluate(async () => { const m = document.querySelector('#modal'); if (m && !m.hidden) { m.hidden = true; m.innerHTML = '' } const C = await import('/js/ui-core.js'); C.closeWin(true); try { C.ACT.goCapital() } catch { } }); await p.waitForTimeout(2000);
  }
  const t0 = zaman['1-1'].bas; const v = p.video(); await ctx.close(); const yol = await v.path();
  fs.writeFileSync(out + `/${race}-zaman.json`, JSON.stringify({ video: yol, kayit_baslangici_ms: T0, zaman, err }, null, 1)); await b.close();
  console.log(race, JSON.stringify(zaman), err.length);
})().catch(e => { console.log('FATAL', e.message); process.exit(1) });
