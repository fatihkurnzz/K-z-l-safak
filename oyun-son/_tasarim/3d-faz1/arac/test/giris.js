// ortak giriş: node -e ile değil, require edilir. module.exports = async (p, race) => hub'a kadar götürür
module.exports = async (p, race, q = '?gfx=low&dev=0') => {
  const tk = async (s, ms = 8000) => { try { await p.waitForSelector(s, { timeout: ms }); await p.evaluate(s => document.querySelector(s).click(), s); return true } catch { return false } };
  await p.goto('http://localhost:8765/' + q); await tk('.sv-go', 60000); await p.waitForSelector('[data-o="race"]', { timeout: 60000 });
  await p.evaluate(r => document.querySelectorAll('[data-o="race"]')[r === 'ocak' ? 1 : 0].click(), race); await p.fill('#olzname', 'Denetci'); await tk('#olzgo'); await p.waitForTimeout(2500);
  await tk('#tkenter', 10000); await p.waitForTimeout(2500); await p.evaluate(() => [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Geç')?.click()); await p.waitForTimeout(2000);
  for (let i = 0; i < 8; i++) { const d = await p.evaluate(() => { const v = s => [...document.querySelectorAll(s)].some(e => e.offsetParent && e.getBoundingClientRect().width > 0); for (const b of document.querySelectorAll('button')) if (/^(Evet, atla|Tamam|Atla)$/.test(b.textContent.trim()) && b.offsetParent) { b.click(); return 'b' } if (v('.p26o-x')) { document.querySelector('.p26o-x').click(); return 'o' } return v('.blabel') ? 'hub' : '?' }); if (d === 'hub') break; await p.waitForTimeout(1500) }
  const og = await p.evaluate(async () => (await import('/js/orman.js')).ormanOn()); if (og) throw new Error('öğretici atlanamadı');
  await p.evaluate(async () => { const C = await import('/js/ui-core.js'); for (let i = 0; i < 10; i++) await C.ACT.devLevel(); await C.ACT.devGive(); await C.ACT.devGear(); await C.ACT.devUnlock(); await C.ACT.devEnergy(); const m = document.querySelector('#modal'); if (m && !m.hidden) { m.hidden = true; m.innerHTML = '' } C.closeWin(true) });
  await p.waitForTimeout(1500);
};
