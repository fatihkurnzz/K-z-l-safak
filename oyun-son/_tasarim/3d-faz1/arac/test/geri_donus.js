// 3B Savaş Faz 1 · geri dönüş (2B'ye düşme) ve bellek testi.
//   node geri_donus.js <senaryo> <çıktı.json> [ekran.png]
// Senaryolar:
//   kapali     ?b3d=0                      → 2B (Birim2D)
//   acik       ?b3d=1 (1-11 goblin)        → 3B (Birim3D)
//   dusuk      ?b3d=1&gfx=low              → 2B, neden: grafik kademesi
//   eksik      ?b3d=1, aşama 1-1 (bandikut) → 2B, neden: 3B kaydı yok
//   indirme    ?b3d=1, paladin.json isteği engellenir → 2B, neden: model inmedi
//   kragmir    ?b3d=1, Kragmir savaşçı      → 2B, neden: 3B kaydı yok
//   webgl      ?b3d=1, savaştan önce WebGL bağlamı kaybettirilir → 2B, neden: WebGL
//   bellek     ?b3d=1, aynı savaş iki kez; savaş sonrası çizim belleği (geometri/doku/program) karşılaştırılır
const fs = require('fs'); const { chromium } = require('playwright'); const giris = require('./giris.js');
const [, , sen, out = sen + '.json', png] = process.argv;
const S = { kapali: ['0', '1-11'], acik: ['1', '1-11'], dusuk: ['1', '1-11', 'low'], eksik: ['1', '1-1'], indirme: ['1', '1-11'], kragmir: ['1', '1-11', 'high', 'ocak'], webgl: ['1', '1-11'], bellek: ['1', '1-11'] }[sen];
if (!S) { console.log('bilinmeyen senaryo'); process.exit(2); }
const [b3d, asama, gfx = 'high', halk = 'sancak'] = S;
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 880, height: 406 }, deviceScaleFactor: 1, serviceWorkers: sen === 'indirme' ? 'block' : 'allow' })).newPage(); // engellenen istek service worker'dan geçmesin
  const err = []; p.on('pageerror', e => err.push(e.message.slice(0, 200)));
  if (sen === 'indirme') await p.route(/models\/characters\/paladin\.json/, r => r.abort());
  await giris(p, halk, `?gfx=${gfx}&b3d=${b3d}`);
  await p.evaluate(() => { localStorage.setItem('dd_oto_hint', '0'); localStorage.setItem('dd_oto', '1'); });
  await p.waitForTimeout(9000);
  const stat = () => p.evaluate(() => { const s = window.DD_GFX.stats(); return { geometri: s.geometries, doku: s.textures, program: s.programs }; });
  const R = { senaryo: sen, query: `?gfx=${gfx}&b3d=${b3d}`, asama, halk, savaslar: [] };
  R.once = await stat();
  const tur = sen === 'bellek' ? 3 : 1;
  for (let i = 0; i < tur; i++) {
    if (sen === 'webgl') await p.evaluate(async () => { const E = await import('/js/engine3d.js'); E.renderer.getContext().getExtension('WEBGL_lose_context')?.loseContext(); });
    await p.evaluate(async s => { const C = await import('/js/ui-core.js'); const m = document.querySelector('#modal'); if (m && !m.hidden) { m.hidden = true; m.innerHTML = ''; } try { C.closeWin(true); } catch { } await C.ACT.stage({ id: s }); }, asama); await p.waitForTimeout(2000);
    await p.evaluate(() => document.querySelector('[data-a="vsStart"]')?.click());
    const acildi = await p.waitForSelector('#battleUI:not([hidden])', { timeout: 20000 }).then(() => true).catch(() => false);
    await p.waitForTimeout(2500);
    const K = await p.evaluate(async () => { const W = await import('/js/world.js'); return { neden: window.DD_B3D?.neden, aktif: window.DD_B3D?.aktif, birimler: W.world.actors.map(a => a.char.constructor.name) }; });
    K.savas_acildi = acildi; K.sirasinda = await stat();
    if (png && i === 0) await p.screenshot({ path: png });
    if (sen === 'bellek' || sen === 'acik') {
      await p.evaluate(() => { for (let i = 0; i < 3; i++) { const s = [...document.querySelectorAll('#battleUI button')].find(b => /^[123]x$/.test(b.textContent.trim())); if (s && s.textContent.trim() !== '3x') s.click(); } });
      K.bitti = await p.waitForSelector('#modal .p25bres, #modal .rz2, #modal .bres', { timeout: 300000 }).then(() => true).catch(() => false);
      await p.evaluate(async () => { const m = document.querySelector('#modal'); if (m && !m.hidden) { m.hidden = true; m.innerHTML = ''; } const C = await import('/js/ui-core.js'); try { await C.ACT.hub?.(); } catch { } });
      await p.waitForTimeout(3000);
      K.sonra = await stat();
      K.sahnedeB3D = await p.evaluate(async () => { const E = await import('/js/engine3d.js'); let n = 0; E.scene.traverse(o => { if (/^b3d:/.test(o.name)) n++; }); return n; });
    }
    R.savaslar.push(K);
  }
  R.js_hatalari = [...new Set(err)];
  const k0 = R.savaslar[0];
  const bekle = { kapali: '2B', acik: '3B', dusuk: '2B', eksik: '2B', indirme: '2B', kragmir: '2B', webgl: '2B', bellek: '3B' }[sen];
  const gercek = k0.birimler.length && k0.birimler.every(x => x === 'Birim3D') ? '3B' : k0.birimler.every(x => x === 'Birim2D') ? '2B' : 'KARIŞIK:' + [...new Set(k0.birimler)].join('+');
  R.beklenen = bekle; R.gercek = gercek;
  R.SONUC = gercek === bekle && (sen === 'webgl' || k0.savas_acildi) && !R.js_hatalari.length ? 'GEÇTİ' : 'KALDI';
  if (sen === 'bellek') { const a = R.savaslar.map(x => x.sonra); R.bellek = { savas_sonrasi: a, sizinti: a[2].geometri > a[1].geometri || a[2].doku > a[1].doku, sahnede_kalan_3B: R.savaslar.map(x => x.sahnedeB3D) }; if (R.bellek.sizinti || R.savaslar.some(x => x.sahnedeB3D)) R.SONUC = 'KALDI'; }
  fs.writeFileSync(out, JSON.stringify(R, null, 1));
  console.log(sen, R.SONUC, gercek, k0.neden, JSON.stringify(R.bellek || ''), R.js_hatalari.slice(0, 3).join(' | '));
  await b.close();
})().catch(e => { console.log('FATAL', e.stack); process.exit(1); });
