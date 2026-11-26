// node olc.js <halk> '<json: [{act, d, tab, sel:[...], shot}]>' [W H]  → seçicilerin ölçüsü, yazı boyu, ebeveyn zinciri
const { chromium } = require('playwright'); const giris = require('./giris.js');
const [, , race, js, W = 880, H = 406] = process.argv; const L = JSON.parse(js);
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: +W, height: +H }, deviceScaleFactor: 2 });
  await giris(p, race);
  for (const it of L) {
    await p.evaluate(async it => { const C = await import('/js/ui-core.js'); const m = document.querySelector('#modal'); if (m && !m.hidden) { m.hidden = true; m.innerHTML = '' } C.closeWin(true); try { (await import('/js/ui-ahir.js')).binaKapat() } catch { } await C.ACT[it.act]?.(it.d || {}); }, it); await p.waitForTimeout(1500);
    if (it.tab) { await p.evaluate(async t => { const C = await import('/js/ui-core.js'); C.ACT.tab({ id: t }) }, it.tab); await p.waitForTimeout(1000); }
    const r = await p.evaluate(sel => sel.map(s => [s, [...document.querySelectorAll(s)].filter(e => e.getClientRects().length).slice(0, 6).map(e => { const r = e.getBoundingClientRect(), c = getComputedStyle(e); let a = e.parentElement, ch = []; for (let i = 0; i < 4 && a; i++, a = a.parentElement) ch.push(a.tagName.toLowerCase() + (a.id ? '#' + a.id : '') + (typeof a.className === 'string' && a.className ? '.' + a.className.trim().split(/\s+/).join('.') : ''));
      return { cls: e.className?.toString?.().slice(0, 60), t: e.textContent.trim().slice(0, 30), r: [r.left, r.top, r.width, r.height].map(Math.round), fs: c.fontSize, ov: e.scrollWidth > e.clientWidth + 1 ? 'TAŞ ' + e.scrollWidth + '>' + e.clientWidth : '', ws: c.whiteSpace, ch: ch.join(' < ') } })]), it.sel || []);
    console.log('== ' + it.act + (it.tab ? '~' + it.tab : '')); for (const [s, v] of r) { console.log(' ' + s + ' (' + v.length + ')'); for (const x of v) console.log('    ', JSON.stringify(x)); }
    if (it.shot) await p.screenshot({ path: it.shot });
  }
  await b.close(); })();
