// Temiz çekim: tara.js'in bulduğu her durumu (tarif = başkentten adım listesi) yeniden oynatır; ekran görüntüsü + ölçüm + görünen varlıklar.
// node cekim.js <ocak|sancak> <durumlar.json> <çıktı> <W> <H> <dpr> [sorgu=?gfx=high&store=1] [başlangıç] [bitiş]
const { chromium } = require('playwright'); const fs = require('fs'); const giris = require('./giris.js'); const DENETCI = require('./denetci.js');
const [, , race, durumYol, out, W, H, DPR, Q = '?gfx=high&store=1', BAS = '0', BIT = '99999'] = process.argv;
fs.mkdirSync(out, { recursive: true });
const DUR = JSON.parse(fs.readFileSync(durumYol, 'utf8')).durumlar.filter(d => d.no >= +BAS && d.no <= +BIT && !d.ulasilamadi);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: +W, height: +H }, deviceScaleFactor: +DPR });
  const err = []; p.on('pageerror', e => err.push(e.message.slice(0, 200)));
  await giris(p, race, Q);
  const sig = () => p.evaluate(() => {
    const vis = e => e && !e.hidden && e.getClientRects().length > 0 && getComputedStyle(e).visibility !== 'hidden' && getComputedStyle(e).display !== 'none';
    const t = e => (e?.textContent || '').replace(/[0-9.,/×✕+%:]+/g, ' ').trim().replace(/\s+/g, ' ').slice(0, 40);
    const parts = []; const pl = document.documentElement.dataset.place || 'capital'; const yer = pl === 'capital' ? 'baskent' : pl;
    const bui = document.querySelector('#battleUI'); if (vis(bui)) parts.push('SAVAŞ');
    const w = document.querySelector('#win'); if (vis(w)) { const on = w.querySelector('nav.tabs button.on'); parts.push('W:' + t(w.querySelector('h2')) + '|' + (w.dataset.scr || '') + (on ? '~' + on.dataset.id : '')); }
    const bn = document.querySelector('#p28bina'); if (vis(bn)) parts.push('B:' + t(bn.querySelector('h2,.kb-title,header')));
    const m = document.querySelector('#modal'); if (vis(m)) { const bx = m.querySelector('.box'); const dl = m.querySelector('.dlg-ad b'); parts.push('M:' + (dl ? 'DİYALOG ' + t(dl) : ((bx?.className || '').split(/\s+/).filter(c => !/^(box|still)$/.test(c)).join('.') + '|' + t(m.querySelector('h2,h3,b,strong'))))); }
    for (const e of document.body.children) { if (/^(game|stage|overlay|hud|chatbar|battleUI|win|modal|toast|loading|p28bina)$/.test(e.id) || e.tagName === 'SCRIPT') continue; const s = getComputedStyle(e); if (vis(e) && (s.position === 'fixed' || s.position === 'absolute') && e.getBoundingClientRect().width > 200 && e.getBoundingClientRect().height > 120) parts.push('K:' + (e.id || e.className.toString().split(' ')[0])); }
    if (!parts.length) parts.push('HUB:' + yer);
    return { sig: parts.join(' / ') + (parts[0].startsWith('HUB') ? '' : ' @' + yer), yer };
  });
  const kapat = async () => { await p.evaluate(async () => { const m = document.querySelector('#modal'); if (m && !m.hidden) { m.hidden = true; m.innerHTML = '' } const C = await import('/js/ui-core.js'); try { C.closeWin(true) } catch { } try { (await import('/js/ui-ahir.js')).binaKapat() } catch { } for (const e of document.querySelectorAll('.p26o-x')) e.click(); }); await p.waitForTimeout(350); };
  const adim = st => p.evaluate(async st => { try {
    const es = [...document.querySelectorAll(`[data-a="${st.a}"]`)].filter(e => Object.entries(st.ds).every(([k, v]) => e.dataset[k] === v) && e.getClientRects().length);
    if (es.length) { const e = es[es.length - 1]; if (typeof e.click === 'function') e.click(); else e.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })); return 'tık'; }
    const C = await import('/js/ui-core.js'); if (!C.ACT[st.a]) return 'yok'; await C.ACT[st.a]({ ...st.ds }); return 'çağrı';
  } catch (x) { return 'hata ' + x.message } }, st).catch(e => 'hata ' + e.message);
  const git = async tarif => { await kapat(); if ((await sig()).yer !== 'baskent') { await p.evaluate(async () => { const C = await import('/js/ui-core.js'); await C.ACT.goCapital?.() }); for (let i = 0; i < 10; i++) { await p.waitForTimeout(700); if ((await sig()).yer === 'baskent') break; } await p.waitForTimeout(800); await kapat(); }
    for (const st of tarif) { await adim(st); await p.waitForTimeout(/^(go|gate[A-Z]|travel)/.test(st.a) ? 3400 : 1000); } };
  const topla = () => p.evaluate(async () => {
    const urls = new Set(); const re = /url\(["']?([^"')]+)["']?\)/g;
    for (const e of document.querySelectorAll('body *')) { const r = e.getBoundingClientRect(); if (r.width < 3 || r.height < 3 || r.bottom < 0 || r.right < 0 || r.top > innerHeight || r.left > innerWidth) continue; const s = getComputedStyle(e); if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity === 0) continue;
      for (const v of [s.backgroundImage, s.maskImage || s.webkitMaskImage, s.borderImageSource]) if (v && v.includes('url(')) for (const m of v.matchAll(re)) urls.add(m[1]);
      if (e.tagName === 'IMG' && e.currentSrc) urls.add(e.currentSrc); if (e.tagName === 'image') urls.add(e.href?.baseVal || ''); }
    const outv = []; for (const u of urls) { if (!u) continue; if (u.startsWith('blob:') || u.startsWith('data:')) { try { const bb = await (await fetch(u)).arrayBuffer(); const h = await crypto.subtle.digest('SHA-256', bb); outv.push('sha:' + [...new Uint8Array(h)].map(x => x.toString(16).padStart(2, '0')).join('')); } catch { } } else { try { outv.push('yol:' + new URL(u, location.href).pathname.replace(/^\//, '')); } catch { } } }
    return [...new Set(outv)];
  });
  const kayit = [];
  for (const D of DUR) {
    await git(D.tarif); await p.waitForTimeout(700);
    const s = await sig(); const ok = s.sig === D.sig;
    const ad = String(D.no).padStart(4, '0');
    await p.screenshot({ path: `${out}/${ad}.png` });
    const olcum = await p.evaluate(DENETCI).catch(e => ({ hata: e.message }));
    const varlik = await topla().catch(() => []);
    kayit.push({ no: D.no, beklenen: D.sig, bulunan: s.sig, eslesti: ok, tarif: D.tarif, olcum, varlik });
    console.log(ad, ok ? 'ok' : 'FARKLI', s.sig.slice(0, 90));
  }
  fs.writeFileSync(`${out}/_cekim.json`, JSON.stringify({ race, W: +W, H: +H, dpr: +DPR, sorgu: Q, err: [...new Set(err)], kayit }, null, 1));
  console.log('BİTTİ', kayit.length, 'eşleşen', kayit.filter(k => k.eslesti).length, 'JS hata', err.length); await b.close();
})().catch(e => { console.log('FATAL', e.stack); process.exit(1) });
