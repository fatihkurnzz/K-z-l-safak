// UI denetimi: oyunu açar, her ekranı (ACT.<ad>) ve sekmelerini dolaşır; kesik yazı, taşma, küçük dokunma hedefi,
// çakışan düğme ölçer; her ekranın görüntüsünü alır. Kullanım (sunucu: python3 -m http.server 8765 -d oyun-son):
//   node ui-denetim.js <ocak|sancak> <çıktı_klasörü> [genişlik=846] [yükseklik=412] [ekran listesi virgüllü]
// Dik telefon (gerçek kullanım, Claude uygulaması): genişlik 411 yükseklik 722 → oyun 722×411 yatay çizilir.
const { chromium } = require('playwright'); const fs = require('fs');
const [, , race = 'sancak', out = 'denetim', W = '846', H = '412', only] = process.argv;
const EKRAN = (only ? only.split(',') : ['bag', 'karakter', 'party', 'quests', 'shop', 'clan', 'mail', 'market', 'pazar', 'settings', 'rank', 'friends', 'notifs', 'calendar', 'codex', 'rehber', 'achs', 'titles', 'premium', 'profile', 'server', 'wheel', 'anvil', 'mine', 'iksir', 'monument', 'karaborsa', 'tuccar', 'yashka', 'meydan', 'nobet', 'baskin', 'destan', 'diyarMap', 'gate', 'hall', 'balik', 'savas', 'season', 'reports', 'news', 'skill', 'onlineOpen', 'sandikOpen', 'starterOpen', 'yakutMenu', 'premiumMenu', 'supportMenu', 'logoutMenu', 'rankMenu', 'titlesMenu', 'friendsMenu', 'gateMenu', 'otag', 'clanhq', 'erisim', 'questLog', 'monthlyBonus', 'weeklyBonus', 'promoMenu', 'chatOpen', 'drawer', 'msgMenu', 'otagMenu', 'mnMain', 'arenaRefresh', 'czArena', 'czHall', 'czMarket', 'gateZones', 'gatePvp', 'gateEvents', 'gateDestan', 'gateKlan', 'hotbar', 'modInfo', 'worldInfo', 'tierInfo', 'calInfo', 'chatMenu', 'emoOpen', 'gift', 'exchange', 'tp', 'spin', 'charSwitchMenu', 'quick']); // son ikisi tam ekran katman açar
fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: +W, height: +H }, deviceScaleFactor: 1, ...(+H > +W ? { isMobile: true, hasTouch: true } : {})}); // dik ölçü verilirse dokunmatik telefon: oyun gövdeyi 90° döndürür
  const err = []; p.on('pageerror', e => err.push(e.message.slice(0, 160)));
  const tk = async (sel, ms = 6000) => { try { await p.waitForSelector(sel, { timeout: ms }); await p.evaluate(s => document.querySelector(s).click(), sel); } catch { } };
  await p.goto('http://localhost:8765/?gfx=low'); await p.waitForTimeout(3000);
  await tk('.ld-go', 10000); await p.waitForTimeout(1200); await p.waitForSelector('[data-o="race"]', { timeout: 15000 });
  await p.evaluate(r => [...document.querySelectorAll('[data-o="race"]')][r === 'ocak' ? 1 : 0].click(), race); await p.fill('#olzname', 'Denetci'); await tk('#olzgo'); await p.waitForTimeout(2500);
  await tk('#tkenter', 10000); await p.waitForTimeout(2500); await p.evaluate(() => [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Geç')?.click()); await p.waitForTimeout(2000);
  await p.evaluate(() => document.querySelector('.tskip')?.click()); await p.waitForTimeout(1500);
  for (let i = 0; i < 3; i++) { await p.evaluate(() => { for (const b of document.querySelectorAll('button')) { if (/^(Atla|Evet|Tamam|Onayla|Evet, atla|Öğreticiyi atla)$/.test(b.textContent.trim()) && b.offsetParent) { b.click(); break } } }); await p.waitForTimeout(1500); }
  await p.evaluate(() => { const m = document.querySelector('#modal'); if (m && !m.hidden) m.querySelector('[data-a="closeModal"]')?.click(); });
  await p.waitForTimeout(1000);
  // DD_GELISMIS=1: oyunun kendi test araçlarıyla seviye kilitli ekranları aç (Sv. 51, kaynak, eşya, bütün stage'ler)
  if (process.env.DD_GELISMIS) { await p.evaluate(async () => { const C = await import('/js/ui-core.js'); for (let i = 0; i < 10; i++) await C.ACT.devLevel(); await C.ACT.devGive(); await C.ACT.devGear(); await C.ACT.devUnlock(); await C.ACT.devEnergy(); }); await p.waitForTimeout(2500); await p.evaluate(() => { const m = document.querySelector('#modal'); if (m && !m.hidden) { m.hidden = true; m.innerHTML = ''; } }); }
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
  const kapat = () => p.evaluate(() => { const m = document.querySelector('#modal'); if (m && !m.hidden) { m.hidden = true; m.innerHTML = ''; } import('/js/ui-core.js').then(C => C.closeWin(true)); });
  const sonuc = [];
  const shot = async n => p.screenshot({ path: `${out}/${n}.png` });
  sonuc.push({ ekran: 'hub', ...(await olc()), sekmeler: {} }); await shot('hub');
  for (const e of EKRAN) {
    const ok = await p.evaluate(async e => { const C = await import('/js/ui-core.js'); if (!C.ACT[e]) return 'yok'; try { await C.ACT[e]({}); return 'ok'; } catch (x) { return 'hata: ' + String(x.message).slice(0, 80); } }, e);
    await p.waitForTimeout(1300);
    const m = await olc(); const kayit = { ekran: e, acilis: ok, ...m, sekmeler: {} };
    if (m.tur !== 'yok') await shot(e);
    if (m.tur === 'pencere' && m.sekme.length > 1) for (const t of m.sekme.slice(1)) {
      await p.evaluate(async t => { const C = await import('/js/ui-core.js'); try { C.ACT.tab({ id: t }); } catch { } }, t); await p.waitForTimeout(1000);
      const s = await olc(); kayit.sekmeler[t] = { kesik: s.kesik, tasma: s.tasma, kucuk: s.kucuk, cakisma: s.cakisma, renk: s.renk }; await shot(e + '~' + t);
    }
    sonuc.push(kayit); await kapat(); await p.waitForTimeout(500);
  }
  fs.writeFileSync(`${out}/sonuc.json`, JSON.stringify({ race, W, H, err: [...new Set(err)].slice(0, 30), sonuc }, null, 1));
  console.log('ekran', sonuc.length, 'açılan', sonuc.filter(s => s.tur !== 'yok').length, 'hata', err.length); await b.close();
})();
