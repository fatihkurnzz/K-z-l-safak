// UI akış testi: açılış → ırk seçimi → ad → giriş → ana ekran → eşya ayrıntısı → savaş öncesi → savaş HUD → sonuç.
// Her adımda ekran görüntüsü + sayfa hatası kaydı. Kullanım: node ui-akis.js <ocak|sancak> <çıktı> [gen=722] [yük=411]
const { chromium } = require('playwright'); const fs = require('fs');
const [, , race = 'sancak', out = 'akis', W = '722', H = '411'] = process.argv; fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: +W, height: +H }, ...(+H > +W ? { isMobile: true, hasTouch: true } : {}) });
  const err = []; p.on('pageerror', e => err.push(e.message.slice(0, 160)));
  let n = 0; const shot = async ad => { await p.screenshot({ path: `${out}/${String(++n).padStart(2, '0')}-${ad}.png` }); };
  const tk = async (sel, ms = 8000) => { try { await p.waitForSelector(sel, { timeout: ms }); await p.evaluate(s => document.querySelector(s).click(), sel); return true; } catch { err.push('yok: ' + sel); return false; } };
  await p.goto('http://localhost:8765/?gfx=low'); await p.waitForTimeout(1200); await shot('yukleme');
  await p.waitForTimeout(2500); await shot('acilis');
  await tk('.ld-go', 10000); await p.waitForTimeout(1500); await shot('irk-secimi');
  await p.evaluate(r => [...document.querySelectorAll('[data-o="race"]')][r === 'ocak' ? 1 : 0]?.click(), race); await p.waitForTimeout(800); await shot('irk-secildi');
  await p.fill('#olzname', 'Akis').catch(() => err.push('ad kutusu yok')); await shot('ad');
  await tk('#olzgo'); await p.waitForTimeout(2500); await shot('giris-oncesi');
  await tk('#tkenter', 10000); await p.waitForTimeout(2500); await shot('giris');
  await p.evaluate(() => [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Geç')?.click()); await p.waitForTimeout(2000); await shot('ogretici');
  await p.evaluate(() => document.querySelector('.tskip')?.click()); await p.waitForTimeout(1500);
  for (let i = 0; i < 3; i++) { await p.evaluate(() => { for (const b of document.querySelectorAll('button')) { if (/^(Atla|Evet|Tamam|Onayla|Evet, atla|Öğreticiyi atla)$/.test(b.textContent.trim()) && b.offsetParent) { b.click(); break } } }); await p.waitForTimeout(1500); }
  await p.evaluate(() => { const m = document.querySelector('#modal'); if (m && !m.hidden) m.querySelector('[data-a="closeModal"]')?.click(); }); await p.waitForTimeout(1200); await shot('ana-ekran');
  await p.evaluate(async () => { const C = await import('/js/ui-core.js'); await C.ACT.devGear(); C.ACT.bag({}); }); await p.waitForTimeout(1500); await shot('canta-dolu');
  await p.evaluate(() => { const e = document.querySelector('#page .ivbag [data-a], #page .ivgrid [data-a], #page [data-a="bagPick"]'); e?.click(); }); await p.waitForTimeout(1200); await shot('esya-secili');
  await p.evaluate(() => { const e = [...document.querySelectorAll('#page button')].find(b => /Kuşan|Sat|Parçala/.test(b.textContent)); e?.click(); }); await p.waitForTimeout(1200); await shot('esya-eylem');
  await p.evaluate(async () => { const C = await import('/js/ui-core.js'); const m = document.querySelector('#modal'); m.hidden = true; m.innerHTML = ''; C.closeWin(true); await C.ACT.quick({}); }); await p.waitForTimeout(2000); await shot('savas-oncesi');
  await p.evaluate(() => { const e = [...document.querySelectorAll('#win button, #modal button')].find(b => /^Başla/.test(b.textContent.trim())); e?.click(); }); await p.waitForTimeout(3500); await shot('savas-hud');
  await p.evaluate(() => { const e = document.querySelector('[data-a="spd"], .spd, [data-a="speed"]'); e?.click(); e?.click(); }); await p.waitForTimeout(2500); await shot('savas-orta');
  for (let i = 0; i < 40; i++) { const bitti = await p.evaluate(() => { const m = document.querySelector('#modal'); return m && !m.hidden && /Zafer|Yenilgi|Kazandın|Kaybettin|Savaş sonu/i.test(m.textContent); }); if (bitti) break; await p.evaluate(() => { const s = [...document.querySelectorAll('#battleUI button:not([disabled])')].find(b => b.offsetParent && /skill|atk|base/.test(b.className + (b.dataset.a || ''))); s?.click(); }); await p.waitForTimeout(1500); }
  await shot('savas-sonu');
  fs.writeFileSync(`${out}/hatalar.json`, JSON.stringify([...new Set(err)], null, 1)); console.log('adım', n, 'hata', err.length, err.slice(0, 5)); await b.close();
})();
