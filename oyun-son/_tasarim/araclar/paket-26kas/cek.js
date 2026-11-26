// Çekim: iki halk, 880×406 mantıksal, dpr 2.66 (= 2340×1080 telefon). node cek.js <ocak|sancak> <çıktı>
const { chromium } = require('playwright'); const fs = require('fs');
const [, , race, out] = process.argv; fs.mkdirSync(out, { recursive: true });
const EKRAN = process.env.LISTE ? process.env.LISTE.split(',') : ['bag', 'karakter', 'party', 'quests', 'shop', 'clan', 'mail', 'market', 'pazar', 'settings', 'rank', 'friends', 'notifs', 'calendar', 'codex', 'rehber', 'achs', 'titles', 'premium', 'profile', 'server', 'wheel', 'anvil', 'mine', 'iksir', 'monument', 'karaborsa', 'tuccar', 'yashka', 'meydan', 'nobet', 'baskin', 'destan', 'diyarMap', 'gate', 'hall', 'balik', 'savas', 'season', 'reports', 'news', 'skill', 'onlineOpen', 'sandikOpen', 'starterOpen', 'yakutMenu', 'premiumMenu', 'supportMenu', 'logoutMenu', 'rankMenu', 'titlesMenu', 'friendsMenu', 'gateMenu', 'otag', 'clanhq', 'erisim', 'questLog', 'monthlyBonus', 'weeklyBonus', 'promoMenu', 'chatOpen', 'drawer', 'msgMenu', 'otagMenu', 'mnMain', 'arenaRefresh', 'czArena', 'czHall', 'czMarket', 'gateZones', 'gatePvp', 'gateEvents', 'gateDestan', 'gateKlan', 'hotbar', 'modInfo', 'worldInfo', 'tierInfo', 'calInfo', 'chatMenu', 'emoOpen', 'gift', 'exchange', 'tp', 'spin', 'quick'].concat(['han','ahir','zaferAniti']);
const log = []; const L = (n, d) => { log.push(n + '\t' + d); console.log(n, d); };
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 880, height: 406 }, deviceScaleFactor: process.env.VARLIK ? 1 : 2.66 });
  const err = []; p.on('pageerror', e => err.push(e.message.slice(0, 160)));
  const VARLIK = {}; const VAR = !!process.env.VARLIK;
  const topla = () => p.evaluate(async () => {
    const urls = new Set(); const re = /url\(["']?([^"')]+)["']?\)/g;
    const vis = e => { const r = e.getBoundingClientRect(); return r.width > 2 && r.height > 2 && r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth; };
    for (const e of document.querySelectorAll('body *')) {
      if (!vis(e)) continue; const s = getComputedStyle(e); if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity === 0) continue;
      for (const v of [s.backgroundImage, s.maskImage || s.webkitMaskImage, s.borderImageSource, s.content]) if (v && v.includes('url(')) for (const m of v.matchAll(re)) urls.add(m[1]);
      if (e.tagName === 'IMG' && e.currentSrc) urls.add(e.currentSrc);
      for (const ps of ['::before', '::after']) { const q = getComputedStyle(e, ps); for (const v of [q.backgroundImage, q.maskImage || q.webkitMaskImage]) if (v && v.includes('url(')) for (const m of v.matchAll(re)) urls.add(m[1]); }
    }
    const out = [];
    for (const u of urls) {
      if (u.startsWith('blob:') || u.startsWith('data:')) { try { const b = await (await fetch(u)).arrayBuffer(); const h = await crypto.subtle.digest('SHA-256', b); out.push('sha:' + [...new Uint8Array(h)].map(x => x.toString(16).padStart(2, '0')).join('')); } catch { } }
      else { try { out.push('yol:' + new URL(u, location.href).pathname.replace(/^\//, '')); } catch { } }
    }
    return [...new Set(out)];
  });
  const shot = async n => { if (VAR) { VARLIK[n] = await topla(); return; } await p.screenshot({ path: `${out}/${n}.png` }); };
  const tk = async (s, ms = 8000) => { try { await p.waitForSelector(s, { timeout: ms }); await p.evaluate(s => document.querySelector(s).click(), s); return true } catch { return false } };
  const act = (n, d = {}) => p.evaluate(async ([n, d]) => { const C = await import('/js/ui-core.js'); if (!C.ACT[n]) return 'yok'; try { await C.ACT[n](d); return 'ok' } catch (x) { return 'hata ' + String(x.message).slice(0, 80) } }, [n, d]);
  const closeAll = () => p.evaluate(async () => { const m = document.querySelector('#modal'); if (m && !m.hidden) { m.hidden = true; m.innerHTML = '' } const C = await import('/js/ui-core.js'); C.closeWin(true); try { const B = await import('/js/ui-ahir.js'); B.binaKapat() } catch { } });
  const olc = () => p.evaluate(() => {
    const vis = e => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && +s.opacity > 0.05; };
    const kok = [...document.querySelectorAll('#win:not([hidden]) .frame, #modal:not([hidden]) .box')];
    if (!kok.length) kok.push(document.querySelector('#hud'));
    const ad = e => (e.id ? '#' + e.id : e.tagName.toLowerCase()) + (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\s+/).slice(0, 2).join('.') : '');
    const txt = e => [...e.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim();
    const VW = innerWidth, VH = innerHeight, o = { kesik: [], tasma: [], kucuk: [], cakisma: [] };
    for (const K of kok) {
      const KR = K.getBoundingClientRect();
      const els = [...K.querySelectorAll('*')].filter(vis);
      for (const e of els) {
        const t = txt(e), s = getComputedStyle(e), r = e.getBoundingClientRect();
        const tt = e.textContent.trim();
        if (!t && tt.length > 1 && (s.overflowX === 'hidden' || s.overflowX === 'clip') && e.scrollWidth > e.clientWidth + 2 && e.children.length < 6) o.kesik.push(ad(e) + ' «' + tt.slice(0, 28) + '»▸');
        if (t && t.length > 1) {
          if (e.scrollWidth > e.clientWidth + 2 && s.overflowX !== 'visible' && s.overflowX !== 'auto' && s.overflowX !== 'scroll') o.kesik.push(ad(e) + ' «' + t.slice(0, 28) + '»');
          else if (s.textOverflow === 'ellipsis' && e.scrollWidth > e.clientWidth + 1) o.kesik.push(ad(e) + ' «' + t.slice(0, 28) + '»…');
          // en yakın kırpan ata dışında kalan yazı
          let a = e.parentElement, kes = null;
          while (a && a !== K.parentElement) { const as = getComputedStyle(a); if (as.overflowX === 'auto' || as.overflowX === 'scroll') { kes = 'kaydir'; break; } if (as.overflowX === 'hidden' || as.overflowX === 'clip') { kes = a; break; } a = a.parentElement; }
          if (kes === 'kaydir') continue; // yatay kaydırılan şeritteki öğe: bilerek ekranın dışında
          const R = kes ? kes.getBoundingClientRect() : KR;
          if (r.right > Math.min(R.right, VW) + 3 || r.left < Math.max(R.left, 0) - 3) o.tasma.push(ad(e) + ' «' + t.slice(0, 28) + '» x' + Math.round(r.left) + '-' + Math.round(r.right));
        }
        if ((e.tagName === 'BUTTON' || e.dataset.a) && !e.disabled && e.closest('.wbody,.box,.frame header')) {
          if (r.width < 26 || r.height < 26) o.kucuk.push(ad(e) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height) + ' «' + (e.textContent.trim().slice(0, 16)) + '»');
        }
      }
      const btn = els.filter(e => e.tagName === 'BUTTON' || e.dataset.a);
      for (let i = 0; i < btn.length; i++) for (let j = i + 1; j < btn.length; j++) {
        const A = btn[i], B = btn[j]; if (A.contains(B) || B.contains(A)) continue;
        const a = A.getBoundingClientRect(), c = B.getBoundingClientRect();
        const w = Math.min(a.right, c.right) - Math.max(a.left, c.left), h = Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top);
        if (w > 4 && h > 4 && w * h > 0.25 * Math.min(a.width * a.height, c.width * c.height)) o.cakisma.push(ad(A) + ' ⨯ ' + ad(B));
      }
    }
    // kontrast için: doğrudan yazı taşıyan görünür öğelerin kutusu ve yazı rengi (zemin, ekran görüntüsünden ölçülür: kontrast.py)
    o.renk = [];
    for (const K of kok) for (const e of K.querySelectorAll('*')) {
      if (o.renk.length > 500) break;
      const t = txt(e); if (!t || t.length < 2 || !vis(e)) continue;
      const r = e.getBoundingClientRect(); if (r.width < 6 || r.height < 6 || r.bottom < 0 || r.top > VH || r.right < 0 || r.left > VW) continue;
      const s = getComputedStyle(e), m = s.color.match(/[\d.]+/g).map(Number); if (m[3] !== undefined && m[3] < .5) continue;
      if (s.backgroundClip === 'text' || /^(transparent|rgba\(0, 0, 0, 0\))$/.test(s.webkitTextFillColor || '')) continue; // degrade yazı ölçülemez
      o.renk.push({ t: t.slice(0, 30), a: ad(e), r: [r.left, r.top, r.width, r.height].map(Math.round), c: m.slice(0, 3), fs: parseFloat(s.fontSize) });
    }
    for (const k in o) if (k !== 'renk') o[k] = [...new Set(o[k])].slice(0, 12);
    const w = document.querySelector('#win:not([hidden]) h2'), m = document.querySelector('#modal:not([hidden]) h2');
    return { baslik: (w || m)?.textContent.trim() || null, tur: w ? 'pencere' : m ? 'modal' : 'yok', sekme: [...document.querySelectorAll('#win:not([hidden]) nav.tabs button')].map(x => x.dataset.id), ...o };
  });
  const sonuc = [];
  await p.goto('http://localhost:8765/?gfx=high'); await p.waitForTimeout(1200); await shot('A01-yukleme'); L('A01-yukleme', 'ok');
  await p.waitForSelector('.sv-go', { timeout: 20000 }); await p.waitForTimeout(1200); await shot('A02-sunucu-secimi'); L('A02-sunucu-secimi', 'ok');
  await tk('.sv-go'); await p.waitForTimeout(1500); await p.waitForSelector('[data-o="race"]', { timeout: 20000 }); await p.waitForTimeout(1500);
  await shot('A03-olustur-acilis'); L('A03-olustur-acilis', 'ok');
  await p.evaluate(r => document.querySelectorAll('[data-o="race"]')[r === 'ocak' ? 1 : 0].click(), race); await p.waitForTimeout(1500); await shot('A04-olustur-halk'); L('A04-olustur-halk', 'ok');
  for (const g of ['f', 'm']) {
    await p.evaluate(g => document.querySelector(`[data-o="gender"][data-v="${g}"]`)?.click(), g); await p.waitForTimeout(700);
    const cls = await p.evaluate(() => [...document.querySelectorAll('[data-o="cls"]')].map(e => e.dataset.v));
    for (const c of cls) { await p.evaluate(c => document.querySelector(`[data-o="cls"][data-v="${c}"]`).click(), c); await p.waitForTimeout(1100); await shot(`A05-olustur-${c}-${g}`); L(`A05-olustur-${c}-${g}`, 'ok'); }
  }
  await p.evaluate(() => document.querySelector('[data-o="cls"][data-v="warrior"]')?.click()); await p.waitForTimeout(500);
  await p.fill('#olzname', 'Denetci'); await tk('#olzgo'); await p.waitForTimeout(2800); await shot('A06-karakter-secme'); L('A06-karakter-secme', 'ok');
  await tk('#tkenter', 10000); await p.waitForTimeout(2800); await shot('A07-giris-sonrasi'); L('A07-giris-sonrasi', 'ok');
  await p.evaluate(() => [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Geç')?.click()); await p.waitForTimeout(2200); await shot('A08-ogretici'); L('A08-ogretici', 'ok');
  await p.evaluate(() => document.querySelector('.tskip')?.click()); await p.waitForTimeout(1500);
  await p.evaluate(() => document.querySelector('.p26o-x')?.click()); await p.waitForTimeout(1500);
  for (let i = 0; i < 3; i++) { await p.evaluate(() => { for (const b of document.querySelectorAll('button')) { if (/^(Atla|Evet|Tamam|Onayla|Evet, atla|Öğreticiyi atla)$/.test(b.textContent.trim()) && b.offsetParent) { b.click(); break } } }); await p.waitForTimeout(1300) }
  await closeAll(); await p.waitForTimeout(1000);
  await p.evaluate(async () => { const C = await import('/js/ui-core.js'); for (let i = 0; i < 10; i++) await C.ACT.devLevel(); await C.ACT.devGive(); await C.ACT.devGear(); await C.ACT.devUnlock(); await C.ACT.devEnergy() }); await p.waitForTimeout(2500); await closeAll(); await p.waitForTimeout(1000);
  for (let i = 0; i < 6; i++) { const d = await p.evaluate(() => { const v = s => [...document.querySelectorAll(s)].some(e => e.offsetParent && e.getBoundingClientRect().width > 0); if (v('.ks-enter')) { document.querySelector('.ks-enter').click(); return 'ks' } if (v('.p26o-x')) { document.querySelector('.p26o-x').click(); return 'ogr' } for (const b of document.querySelectorAll('button')) if (/^(Evet, atla|Tamam|Atla)$/.test(b.textContent.trim()) && b.offsetParent) { b.click(); return 'btn' } return v('.blabel') ? 'hub' : '?' }); L('hub-bekle', d); if (d === 'hub') break; await p.waitForTimeout(1500) }
  if (process.env.SADECE_GIRIS) { await shot('B01-hub-baskent'); await b.close(); return; }
  await shot('B01-hub-baskent'); sonuc.push({ ekran: 'hub', ...(await olc()) }); L('B01-hub-baskent', 'ok');
  let r = await act('goCarsi'); await p.waitForTimeout(3500); await shot('B02-hub-yemin-pazari'); L('B02-hub-yemin-pazari', r);
  await act('goCapital'); await p.waitForTimeout(2500);
  r = await act('goKlan'); await p.waitForTimeout(3500); await shot('B03-hub-klan'); L('B03-hub-klan', r); await closeAll(); await act('goCapital'); await p.waitForTimeout(2500);
  for (const e of EKRAN) {
    const ok = await act(e); await p.waitForTimeout(1500);
    const m = await olc(); const kayit = { ekran: e, acilis: ok, ...m, sekmeler: {} };
    const bina = await p.evaluate(() => !!document.querySelector('#p28bina:not([hidden]), .p28bina, [id^="korant-modal"]'));
    const hayalet = await p.evaluate(() => [...document.querySelectorAll('.ks-enter,.p26o-x')].some(e => e.offsetParent && e.getBoundingClientRect().width > 0));
    if (m.tur !== 'yok' || bina) { await shot('C-' + e); L('C-' + e, ok + ' ' + m.tur + (hayalet ? ' HAYALET-KATMAN' : '')); } else L('C-' + e, 'açılmadı ' + ok);
    if (m.tur === 'pencere' && m.sekme.length > 1) for (const t of m.sekme.slice(1)) {
      await p.evaluate(async t => { const C = await import('/js/ui-core.js'); try { C.ACT.tab({ id: t }) } catch { } }, t); await p.waitForTimeout(1100);
      const s = await olc(); kayit.sekmeler[t] = { baslik: s.baslik, kesik: s.kesik, tasma: s.tasma, kucuk: s.kucuk, cakisma: s.cakisma }; await shot('C-' + e + '~' + t);
    }
    delete kayit.renk; sonuc.push(kayit); await closeAll(); await p.waitForTimeout(600);
  }
  await act('goCapital'); await p.waitForTimeout(1500);
  r = await act('stage', { id: '1-1' }); await p.waitForTimeout(2500); await shot('D01-vs-1-1'); L('D01-vs-1-1', r);
  await tk('[data-a="vsStart"]'); await p.waitForTimeout(3500); await shot('D02-savas-a'); await p.waitForTimeout(3000); await shot('D03-savas-b'); L('D02-03-savas', 'ok');
  await p.evaluate(() => { const s = [...document.querySelectorAll('#battleUI button')].find(b => /Otomatik/.test(b.textContent)); s?.click() });
  for (let i = 0; i < 3; i++) { await p.waitForTimeout(1500); await p.evaluate(() => { const s = [...document.querySelectorAll('#battleUI button')].find(b => /^[123]x$/.test(b.textContent.trim())); if (s && s.textContent.trim() !== '3x') s.click() }) }
  const ok = await p.waitForSelector('.bres, #modal .p25bres, #modal .rz2', { timeout: 300000 }).then(() => true).catch(() => false);
  await p.waitForTimeout(2500); await shot('D04-savas-sonucu'); L('D04-savas-sonucu', ok ? 'ok' : 'zaman aşımı');
  fs.writeFileSync(`${out}/_denetim.json`, JSON.stringify({ race, W: 880, H: 406, dpr: 2.66, err: [...new Set(err)], sonuc }, null, 1));
  if (VAR) fs.writeFileSync(`${out}/_varlik.json`, JSON.stringify(VARLIK, null, 1));
  fs.writeFileSync(`${out}/_log.txt`, log.join('\n') + '\nJS-HATA\t' + ([...new Set(err)].join(' | ') || 'yok'));
  await b.close();
})().catch(e => { console.log('FATAL', e.message.slice(0, 300)); process.exit(1) });
