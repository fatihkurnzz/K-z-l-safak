// P33 ek kanıtlar: canlılık katmanı (4 evre × 2 halk), geri bildirimler (örs/şerit/ganimet), A10 karakter seçme zemini,
// zindan ortam sesi seçimi, müzik kanalı, ayarlar. node kanit_ek.js <halk> <çıktı>
const { chromium } = require('playwright'); const fs = require('fs'); const giris = require('./giris.js');
const [, , race, out] = process.argv; fs.mkdirSync(out, { recursive: true }); const R = { race };
(async () => {
  const b = await chromium.launch(); const err = [];
  const yeni = async q => { const p = await b.newPage({ viewport: { width: 880, height: 406 }, deviceScaleFactor: 2 }); p.on('pageerror', e => err.push(e.message.slice(0, 200))); await giris(p, race, q); await p.evaluate(() => { const m = document.querySelector('#modal'); if (m) { m.hidden = true; m.innerHTML = ''; } }); await p.waitForTimeout(1500); return p; };
  // 1. dört evre
  for (const tod of ['dawn', 'day', 'dusk', 'night']) {
    const p = await yeni(`?gfx=high&store=1&tod=${tod}`); await p.waitForTimeout(2500);
    R['evre_' + tod] = await p.evaluate(() => { const c = document.querySelector('#hub2d .p33-zerre'); let dolu = 0; if (c) { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; for (let i = 3; i < d.length; i += 4 * 97) if (d[i] > 8) dolu++; } return { ton: document.querySelector('#hub2d .p33-ton')?.dataset.evre, tuval: !!c, boyali_ornek: dolu, pointer: c ? getComputedStyle(c).pointerEvents : null }; });
    await p.screenshot({ path: `${out}/evre_${tod}.png` });
    if (tod === 'day') {
      // 2. geri bildirimler (yalnız sunum katmanı; mekanik çağrılmaz)
      await p.evaluate(async () => { const C = await import('/js/ui-core.js'); C.ACT.anvil({}); }); await p.waitForTimeout(1500);
      await p.evaluate(async () => { const { taps } = await import('/js/api.js'); for (const f of taps) try { f('anvil.upgrade', {}, Promise.resolve({ out: 'ok', plus: 8 })); } catch { } });
      await p.waitForTimeout(2350); R.ors_ok = await p.evaluate(() => ({ katman: document.querySelector('.p33-ors')?.className || null, kivilcim: document.querySelectorAll('.p33-ors > i').length }));
      await p.screenshot({ path: `${out}/ors_basari.png` });
      await p.waitForTimeout(1500);
      await p.evaluate(async () => { const { taps } = await import('/js/api.js'); for (const f of taps) try { f('anvil.upgrade', {}, Promise.resolve({ out: 'fail', plus: 3 })); } catch { } });
      await p.waitForTimeout(2300); R.ors_fail = await p.evaluate(() => document.querySelector('.p33-ors')?.className || null); await p.screenshot({ path: `${out}/ors_basarisiz.png` });
      await p.evaluate(async () => { const C = await import('/js/ui-core.js'); C.closeWin(true); const { taps } = await import('/js/api.js'); for (const f of taps) try { f('quest.claim', {}, Promise.resolve({ ok: true })); } catch { } });
      await p.waitForTimeout(700); R.serit_gorev = await p.evaluate(() => document.querySelector('.p33-serit')?.textContent || null); await p.screenshot({ path: `${out}/serit_gorev.png` });
      // ganimet parlaması: lootBox ile
      await p.evaluate(async () => { const C = await import('/js/ui-core.js'); const { S } = await import('/js/api.js'); const it = S.items?.slice(0, 3) || []; C.showModal(`<h2>Ganimet</h2><div class="in">${C.lootBox(it.map((x, i) => ({ t: 'item', b: x.b, g: i })))}<div class="mbtns"><button class="btn" data-a="closeModal">Tamam</button></div></div>`); });
      await p.waitForTimeout(450); R.ganimet = await p.evaluate(() => [...document.querySelectorAll('#modal .li > .ico')].map(e => getComputedStyle(e).animationName)); await p.screenshot({ path: `${out}/ganimet_nadirlik.png` });
      await p.evaluate(() => { const m = document.querySelector('#modal'); m.hidden = true; m.innerHTML = ''; });
      // sayaç akışı
      R.sayac = await p.evaluate(async () => { const { S } = await import('/js/api.js'); const el = document.querySelector('#hud .s2-cap-akce > b'); const once = el?.textContent; const C = await import('/js/ui-core.js'); await C.ACT.devGive?.(); await new Promise(r => setTimeout(r, 120)); const ara = el?.isConnected ? el.textContent : document.querySelector('#hud .s2-cap-akce > b')?.textContent; await new Promise(r => setTimeout(r, 700)); return { once, ara, son: document.querySelector('#hud .s2-cap-akce > b')?.textContent, S: S.akce }; });
      // ayarlar → müzik kanalı
      await p.evaluate(async () => { const C = await import('/js/ui-core.js'); C.ACT.settings({ tab: 'ses' }); }); await p.waitForTimeout(1200);
      R.ses_kanallari = await p.evaluate(() => [...document.querySelectorAll('#win [data-sl]')].map(e => e.dataset.sl)); await p.screenshot({ path: `${out}/ayar_ses.png` });
      await p.evaluate(async () => { const C = await import('/js/ui-core.js'); C.closeWin(true); });
      // A10: karakter seçme zemini (bu halkın kendi sahnesi mi)
      await p.evaluate(async () => { const C = await import('/js/ui-core.js'); C.ACT.charSwitchMenu(); }); await p.waitForTimeout(4000);
      R.A10_karakter_secme = await p.evaluate(async () => { const E = await import('/js/engine3d.js'); const bg = E.scene?.background; return { arka: bg?.image?.src?.split('/').slice(-2).join('/') || String(bg?.constructor?.name || bg), halk: document.documentElement.dataset.faction }; });
      await p.screenshot({ path: `${out}/A10_karakter_secme.png` });
    }
    await p.close();
  }
  // 3. zindan ortam sesi seçimi (sceneLoops; ses çalınmadan liste denetimi)
  { const p = await yeni('?gfx=low&store=1'); R.zindan_ses = await p.evaluate(async () => { const X = await import('/js/sfx.js'); const o = {}; for (const z of ['zkuyu', 'zyarik', 'zmuhur', 'zkule', 'zocak', 'vahran', '']) o[z || 'yok'] = X.sceneLoops({ place: 'battle', faction: 'ocak', phase: 'day', weather: 'clear', zemin: z }); return o; }); await p.close(); }
  R.js_hata = [...new Set(err)];
  fs.writeFileSync(`${out}/sonuc.json`, JSON.stringify(R, null, 1)); console.log(JSON.stringify(R)); await b.close();
})().catch(e => { console.log('FATAL', e.message); process.exit(1); });
