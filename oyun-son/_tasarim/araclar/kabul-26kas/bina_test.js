// P34: Han / Ahır / Zafer Anıtı bina katmanı yeniden çizim testi (binaAcik gerilemesi). node bina_test.js <halk> <çıktı>
const { chromium } = require('playwright'); const fs = require('fs'); const giris = require('./giris.js');
const [, , race, out] = process.argv; fs.mkdirSync(out, { recursive: true }); const R = { race, hatalar: [] };
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 880, height: 406 }, deviceScaleFactor: 2 });
  p.on('pageerror', e => R.hatalar.push(e.message.slice(0, 200))); await giris(p, race);
  const ev = (f, a) => p.evaluate(f, a);
  for (const a of ['zaferAniti', 'han', 'ahir']) {
    await ev(async a => { const C = await import('/js/ui-core.js'); try { (await import('/js/ui-ahir.js')).binaKapat(); } catch { } await C.ACT[a]({}); }, a); await p.waitForTimeout(3500);
    R[a] = await ev(async () => { const M = await import('/js/ui-ahir.js'); const b = document.querySelector('#p28bina .kb-body'); return { acik: M.binaAcik(), yukleniyor: /Yükleniyor/.test(b?.innerText || ''), icerik_uzunlugu: (b?.innerText || '').length }; });
    await p.screenshot({ path: `${out}/${a}.png` });
  }
  // Han: içecek al → gövde yeniden çizilmeli (akçe değişir)
  R.han_islem = await ev(async () => { const C = await import('/js/ui-core.js'); const M = await import('/js/ui-ahir.js'); M.binaKapat(); await C.ACT.han({}); await new Promise(r => setTimeout(r, 2500));
    const once = document.querySelector('#p28bina .kb-body')?.innerHTML || ''; const btn = [...document.querySelectorAll('#p28bina [data-a]')].find(x => !x.disabled && /hanIc|hanAl|drink|icecek/i.test(x.dataset.a)); if (!btn) return { dugme: null };
    btn.click(); await new Promise(r => setTimeout(r, 2500)); const sonra = document.querySelector('#p28bina .kb-body')?.innerHTML || ''; return { dugme: btn.dataset.a, yeniden_cizildi: once !== sonra }; });
  fs.writeFileSync(`${out}/sonuc.json`, JSON.stringify(R, null, 1)); console.log(JSON.stringify(R)); await b.close(); })();
