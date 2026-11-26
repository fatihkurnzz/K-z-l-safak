// Oyuncu kaydı uyumluluğu: eski sürümde (1dda167, :8766) oluşturulan yerel kayıt yeni sürüme (:8765) taşınır; değerler aynı mı, oyun açılıyor mu.
const { chromium } = require('playwright'); const fs = require('fs');
const out = process.argv[2]; fs.mkdirSync(out, { recursive: true });
const tk = async (p, s, ms = 8000) => { try { await p.waitForSelector(s, { timeout: ms }); await p.evaluate(s => document.querySelector(s).click(), s); return true } catch { return false } };
const ozet = p => p.evaluate(async () => { const { S } = await import('/js/api.js'); return S ? { faction: S.faction, lvl: S.lvl, xp: S.xp, akce: S.akce, yakut: S.yakut, energy: S.energy, items: S.items?.length, buff: !!S.han || !!S.tavern, stage: S.stage || S.prog, ad: S.name || S.char?.name, cls: S.char?.cls, gender: S.char?.gender } : null; });
(async () => { const b = await chromium.launch(); const R = {};
  const c1 = await b.newContext({ viewport: { width: 880, height: 406 } }); const p = await c1.newPage(); const err1 = []; p.on('pageerror', e => err1.push(e.message));
  await p.goto('http://localhost:8766/?gfx=low&dev=0'); await tk(p, '.sv-go', 20000); await p.waitForSelector('[data-o="race"]', { timeout: 20000 });
  await p.evaluate(() => document.querySelectorAll('[data-o="race"]')[1].click()); await p.fill('#olzname', 'Kayitci'); await tk(p, '#olzgo'); await p.waitForTimeout(2500);
  await tk(p, '#tkenter'); await p.waitForTimeout(2500); await p.evaluate(() => [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Geç')?.click()); await p.waitForTimeout(2000);
  for (let i = 0; i < 8; i++) { const d = await p.evaluate(() => { const v = s => [...document.querySelectorAll(s)].some(e => e.offsetParent); if (v('.p26o-x')) { document.querySelector('.p26o-x').click(); return 'o' } for (const b of document.querySelectorAll('button')) if (/^(Evet, atla|Tamam|Atla)$/.test(b.textContent.trim()) && b.offsetParent) { b.click(); return 'b' } return v('.blabel') ? 'hub' : '?' }); if (d === 'hub') break; await p.waitForTimeout(1500) }
  await p.evaluate(async () => { const C = await import('/js/ui-core.js'); await C.ACT.devLevel(); await C.ACT.devGive(); await C.ACT.han({}); });
  await p.waitForTimeout(1200); await p.evaluate(() => document.querySelector('#p28bina [data-a="hanIc"][data-id="saldiri"]')?.click()); await p.waitForTimeout(1500);
  R.eski_ozet = await ozet(p);
  const ls = await p.evaluate(() => Object.fromEntries(Object.keys(localStorage).map(k => [k, localStorage.getItem(k)])));
  R.kayit_anahtarlari = Object.keys(ls).sort(); R.eski_hata = err1; await c1.close();
  const c2 = await b.newContext({ viewport: { width: 880, height: 406 } }); const q = await c2.newPage(); const err2 = []; q.on('pageerror', e => err2.push(e.message));
  await q.goto('http://localhost:8765/blank-yok'); await q.evaluate(ls => { localStorage.clear(); for (const [k, v] of Object.entries(ls)) localStorage.setItem(k, v); }, ls);
  await q.goto('http://localhost:8765/?gfx=low&dev=0'); await tk(q, '.sv-go', 20000); await q.waitForTimeout(2500); await tk(q, '#tkenter', 10000); await q.waitForTimeout(3500);
  for (let i = 0; i < 4; i++) { await q.evaluate(() => { for (const b of document.querySelectorAll('button')) if (/^(Geç|Evet, atla|Tamam)$/.test(b.textContent.trim()) && b.offsetParent) { b.click(); return } }); await q.waitForTimeout(1200); }
  R.yeni_ozet = await ozet(q); R.yeni_hata = err2;
  R.ayni_mi = JSON.stringify(R.eski_ozet) === JSON.stringify(R.yeni_ozet);
  await q.screenshot({ path: out + '/yeni_surumde_acilan_eski_kayit.png' });
  fs.writeFileSync(out + '/sonuc.json', JSON.stringify(R, null, 1)); console.log(JSON.stringify(R, null, 1)); await b.close();
})().catch(e => { console.log('FATAL', e.message); process.exit(1) });
