// GPT içerik entegrasyonu testi: NPC balonu + gerçek sonuç satırı, savaş perdesi metni, açılış ipucu, ses döngüleri. node gpt_test.js <halk> <çıktı>
const { chromium } = require('playwright'); const fs = require('fs'); const giris = require('./giris.js');
const [, , race, out] = process.argv; fs.mkdirSync(out, { recursive: true }); const R = {};
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 880, height: 406 }, deviceScaleFactor: 2 });
  // açılış ipucu: yükleme ekranı sürerken
  await p.goto('http://localhost:8765/?gfx=low&dev=0');
  // G2-05 (P34): ipucu yükleme perdesine eklenene dek bekle (600 ms sabit bekleme bazen erken okuyordu)
  await p.waitForSelector('#loading .ld-ipucu', { timeout: 8000 }).catch(() => { });
  R.acilis_ipucu = await p.evaluate(() => document.querySelector('#loading .ld-ipucu')?.textContent || null); await p.screenshot({ path: out + '/01_acilis_ipucu.png' });
  await giris(p, race);
  R.ses_dongu_kayitli = await p.evaluate(async () => { const A = await import('/js/audio.js'); return ['han', 'ahir', 'ors', 'maden', 'klan'].map(t => [t, A.hasLoop('amb.icm.' + t)]); });
  R.ses_sahne_listesi = await p.evaluate(async () => { const X = await import('/js/sfx.js'); return { han: X.sceneLoops({ place: 'icm', tur: 'han' }), hub: X.sceneLoops({ place: 'hub', faction: document.documentElement.dataset.faction, phase: 'day' }), halk: document.documentElement.dataset.faction }; });
  // Han: selamlama balonu, sonra içecek iç → başarı satırı (gerçek sonuç)
  await p.evaluate(async () => { const C = await import('/js/ui-core.js'); await C.ACT.han({}) }); await p.waitForTimeout(1500);
  R.han_selamlama = await p.evaluate(() => document.querySelector('#p28bina .icm-soz')?.textContent || null); await p.screenshot({ path: out + '/02_han_selamlama.png' });
  const akce0 = await p.evaluate(async () => (await import('/js/api.js')).S.akce);
  await p.evaluate(() => document.querySelector('#p28bina [data-a="hanIc"][data-id="saldiri"]')?.click()); await p.waitForTimeout(1500);
  R.han_basari = await p.evaluate(() => document.querySelector('#p28bina .icm-soz')?.textContent || null);
  R.han_akce_once_sonra = [akce0, await p.evaluate(async () => (await import('/js/api.js')).S.akce)];
  await p.screenshot({ path: out + '/03_han_basari.png' });
  // Tezgâh: silah satın al → NPC satırı
  await p.evaluate(async () => { (await import('/js/ui-ahir.js')).binaKapat(); const C = await import('/js/ui-core.js'); await C.ACT.goCarsi(); }); await p.waitForTimeout(3500);
  await p.evaluate(async () => { const C = await import('/js/ui-core.js'); await C.ACT.building({ id: 'c_silah' }) }); await p.waitForTimeout(1800);
  R.tezgah_once = await p.evaluate(() => document.querySelector('#win .pz-head p')?.textContent || null);
  await p.evaluate(() => document.querySelector('#win [data-a="tcBuy"]:not(:disabled)')?.click()); await p.waitForTimeout(1500);
  R.tezgah_sonra = await p.evaluate(() => document.querySelector('#win .pz-head p')?.textContent || null); await p.screenshot({ path: out + '/04_tezgah_basari.png' });
  // Savaş perdesi: Vahran 1-1 → yükleme sırasında bölge metni
  await p.evaluate(async () => { const C = await import('/js/ui-core.js'); C.closeWin(true); await C.ACT.goCapital(); }); await p.waitForTimeout(3000);
  await p.evaluate(async () => { const C = await import('/js/ui-core.js'); await C.ACT.stage({ id: '2-3' }) }); await p.waitForTimeout(1500);
  await p.evaluate(() => document.querySelector('[data-a="vsStart"]')?.click());
  let perde = null; for (let i = 0; i < 40 && !perde; i++) { await p.waitForTimeout(50); perde = await p.evaluate(() => { const e = document.querySelector('#p26perde.on .p33-yuk'); return e ? e.innerText : null; }); if (perde) await p.screenshot({ path: out + '/05_savas_perdesi.png' }); }
  R.savas_perdesi = perde;
  fs.writeFileSync(out + '/sonuc.json', JSON.stringify(R, null, 1)); console.log(JSON.stringify(R, null, 1)); await b.close();
})().catch(e => { console.log('FATAL', e.message); process.exit(1) });
