// P35-UI: pilot ekranların (Görev Defteri, Karakter/Envanter, Tüccar) çok boyutlu ölçümü + ek ekran görüntüleri.
// node olc.js <ocak|sancak> <VW> <VH> <çıktı> [dpr] — oyun kodunu DEĞİŞTİRMEZ; yalnız okur. Giriş akışı kabul-26kas/cek115.js ile aynıdır.
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const [, , race, VW, VH, out, DPR = '1'] = process.argv; fs.mkdirSync(out, { recursive: true });
const DENETCI = require(path.resolve(__dirname, '../../araclar/kabul-26kas/denetci.js'));
const SHOT = process.env.SHOT === '1';
const PILOT = [
  ['hub', null], ['gorev-ana', ['quests', { tab: 'main' }]], ['gorev-gunluk', ['quests', { tab: 'daily' }]], ['gorev-haftalik', ['quests', { tab: 'weekly' }]],
  ['gorev-defteri', ['questLog']], ['karakter', ['karakter']], ['karakter-yetenek', ['party', { tab: 'skill' }]], ['karakter-ustalik', ['party', { tab: 'mst' }]],
  ['karakter-unvan', ['party', { tab: 'unvan' }]], ['canta', ['bag']], ['orsa', ['anvil']], ['parcala', ['breakWin']],
  ['tuccar', ['tuccar']], ['tuccar-silah', ['npcSilah']], ['tuccar-zirh', ['npcZirh']], ['tuccar-taki', ['npcTaki']], ['iksir', ['iksir']], ['pazar', ['pazar']], ['karaborsa', ['karaborsa']],
];
const YAPI = `(() => {
  const r = e => { const b = e.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)]; };
  const ad = e => e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (typeof e.className === 'string' && e.className.trim() ? '.' + e.className.trim().split(/\\s+/).slice(0, 3).join('.') : '');
  const win = document.querySelector('#win:not([hidden])'), mod = document.querySelector('#modal:not([hidden])');
  const kok = win || mod; if (!kok) return null;
  const fr = kok.querySelector('.frame') || kok.querySelector('.box') || kok;
  const o = { kok: ad(kok), scr: kok.dataset?.scr || null, frame: r(fr), vw: innerWidth, vh: innerHeight };
  const q = s => { const e = kok.querySelector(s); return e ? r(e) : null; };
  o.header = q('header'); o.tabs = q('nav.tabs'); o.page = q('#page'); o.wres = q('.wres');
  const pg = kok.querySelector('#page'); if (pg) { o.pageKaydirma = { sh: pg.scrollHeight, ch: pg.clientHeight, sw: pg.scrollWidth, cw: pg.clientWidth };
    o.cocuklar = [...pg.children].slice(0, 12).map(e => ({ e: ad(e), r: r(e) }));
    o.cocuk2 = [...pg.querySelectorAll(':scope > * > *')].slice(0, 24).map(e => ({ e: ad(e), r: r(e) })); }
  o.sekmeDugmeleri = [...kok.querySelectorAll('nav.tabs button')].map(b => ({ id: b.dataset.id, r: r(b), t: b.textContent.trim().slice(0, 30) }));
  const fonts = new Map(); for (const e of kok.querySelectorAll('*')) { if (!e.childNodes.length || ![...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) continue; const s = getComputedStyle(e); const k = s.fontFamily.split(',')[0].replace(/["']/g, '') + '|' + s.fontSize + '|' + s.fontWeight; fonts.set(k, (fonts.get(k) || 0) + 1); }
  o.yaziKullanimi = [...fonts].sort((a, b) => b[1] - a[1]).slice(0, 14).map(([k, n]) => k + ' ×' + n);
  const bt = [...kok.querySelectorAll('button,[data-a],a')].filter(e => e.getClientRects().length); o.etkilesimli = bt.length;
  o.kucuk44 = bt.filter(e => { const b = e.getBoundingClientRect(); return b.width < 44 || b.height < 44; }).length;
  o.enKucukDokunma = bt.map(e => { const b = e.getBoundingClientRect(); return Math.round(Math.min(b.width, b.height)); }).sort((a, b) => a - b).slice(0, 3);
  return o;
})()`;
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: +VW, height: +VH }, deviceScaleFactor: +DPR });
  const err = []; p.on('pageerror', e => err.push(e.message.slice(0, 160)));
  const tk = async (s, ms = 8000) => { try { await p.waitForSelector(s, { timeout: ms }); await p.evaluate(s => document.querySelector(s).click(), s); return true } catch { return false } };
  const act = (n, d = {}) => p.evaluate(async ([n, d]) => { const C = await import('/js/ui-core.js'); if (!C.ACT[n]) return 'yok'; try { await C.ACT[n](d); return 'ok' } catch (x) { return 'hata ' + String(x.message).slice(0, 80) } }, [n, d]);
  const closeAll = () => p.evaluate(async () => { const m = document.querySelector('#modal'); if (m && !m.hidden) { m.hidden = true; m.innerHTML = '' } const C = await import('/js/ui-core.js'); C.closeWin(true); try { const B = await import('/js/ui-ahir.js'); B.binaKapat() } catch { } });
  await p.goto('http://localhost:' + (process.env.PORT || 8765) + '/?gfx=high&store=1'); await p.waitForTimeout(1200);
  await p.waitForSelector('.sv-go', { timeout: 20000 }); await p.waitForTimeout(800);
  await tk('.sv-go'); await p.waitForTimeout(1500); await p.waitForSelector('[data-o="race"]', { timeout: 20000 }); await p.waitForTimeout(1200);
  await p.evaluate(r => document.querySelectorAll('[data-o="race"]')[r === 'ocak' ? 1 : 0].click(), race); await p.waitForTimeout(1200);
  await p.evaluate(() => document.querySelector('[data-o="cls"][data-v="warrior"]')?.click()); await p.waitForTimeout(500);
  await p.fill('#olzname', 'Denetci'); await tk('#olzgo'); await p.waitForTimeout(2800);
  await tk('#tkenter', 10000); await p.waitForTimeout(2800);
  await p.evaluate(() => [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Geç')?.click()); await p.waitForTimeout(2200);
  await p.evaluate(() => document.querySelector('.tskip')?.click()); await p.waitForTimeout(1500);
  await p.evaluate(() => document.querySelector('.p26o-x')?.click()); await p.waitForTimeout(1500);
  for (let i = 0; i < 3; i++) { await p.evaluate(() => { for (const b of document.querySelectorAll('button')) { if (/^(Atla|Evet|Tamam|Onayla|Evet, atla|Öğreticiyi atla)$/.test(b.textContent.trim()) && b.offsetParent) { b.click(); break } } }); await p.waitForTimeout(1300) }
  await closeAll(); await p.waitForTimeout(1000);
  await p.evaluate(async () => { const C = await import('/js/ui-core.js'); for (let i = 0; i < 10; i++) await C.ACT.devLevel(); await C.ACT.devGive(); await C.ACT.devGear(); await C.ACT.devUnlock(); await C.ACT.devEnergy() }); await p.waitForTimeout(2500); await closeAll(); await p.waitForTimeout(1000);
  for (let i = 0; i < 6; i++) { const d = await p.evaluate(() => { const v = s => [...document.querySelectorAll(s)].some(e => e.offsetParent && e.getBoundingClientRect().width > 0); if (v('.ks-enter')) { document.querySelector('.ks-enter').click(); return 1 } return 0 }); await p.waitForTimeout(800); if (!d) break }
  await p.waitForTimeout(1500);
  const res = { race, vw: +VW, vh: +VH, dpr: +DPR, ekranlar: {} };
  for (const [id, a] of PILOT) {
    let ok = 'ok'; if (a) { ok = await act(a[0], a[1] || {}); await p.waitForTimeout(1500); }
    const tur = await p.evaluate(() => document.querySelector('#p28bina') ? 'bina' : !document.querySelector('#win').hidden ? 'pencere' : !document.querySelector('#modal').hidden ? 'modal' : 'yok');
    const m = await p.evaluate(DENETCI).catch(e => ({ hata: e.message })); const y = await p.evaluate(YAPI).catch(e => ({ hata: e.message }));
    res.ekranlar[id] = { acilis: ok, tur, olcum: { kesik: m.kesik, tasma: m.tasma, kucuk44: m.kucuk44, cakisma: m.cakisma, kucukYazi: m.kucukYazi, kaydirilabilir: m.kaydirilabilir }, yapi: y };
    if (SHOT && tur !== 'yok' && id !== 'hub') await p.screenshot({ path: `${out}/${id}.png` });
    // karakter ekranında bir eşya seç → bilgi kartı (kxPick modalı)
    if (id === 'canta' || id === 'karakter') { /* eşya kartı aşağıda */ }
    await closeAll(); await p.waitForTimeout(500);
  }
  // eşya bilgi kartı modalı (kxPick) ve çanta tek-eşya (bagOne)
  await act('karakter'); await p.waitForTimeout(1500);
  const iid = await p.evaluate(() => document.querySelector('.kx-grid [data-a="kxPick"]')?.dataset.id || null);
  if (iid) { await act('kxPick', { id: iid }); await p.waitForTimeout(900); res.ekranlar['karakter-esya-karti'] = { acilis: 'ok', tur: 'modal', yapi: await p.evaluate(YAPI), olcum: await p.evaluate(DENETCI) }; if (SHOT) await p.screenshot({ path: `${out}/karakter-esya-karti.png` }); }
  await closeAll();
  res.jsHata = [...new Set(err)];
  fs.writeFileSync(`${out}/olcum.json`, JSON.stringify(res, null, 1)); console.log(race, VW, VH, Object.keys(res.ekranlar).length, 'ekran, JS hata:', res.jsHata.length);
  await b.close();
})();
