// SYS-SAVE / SYS-DUP / SYS-LANG / SYS-STATE (yerel kip) testleri. node sistem_test.js <çıktı>
const { chromium } = require('playwright'); const fs = require('fs'); const giris = require('./giris.js');
const out = process.argv[2]; fs.mkdirSync(out, { recursive: true }); const R = {};
const ozet = p => p.evaluate(async () => { const { S } = await import('/js/api.js'); return S ? { lvl: S.lvl, akce: S.akce, yakut: S.yakut, energy: S.energy, items: S.items?.length, ad: S.char?.name } : null; });
(async () => { const b = await chromium.launch();
  // 1) Yenileme: kayıt korunur mu
  { const c = await b.newContext({ viewport: { width: 880, height: 406 } }); const p = await c.newPage(); const er = []; p.on('pageerror', e => er.push(e.message));
    await giris(p, 'ocak', '?gfx=low&store=1'); const once = await ozet(p);
    await p.reload(); await p.evaluate(() => document.querySelector('.sv-go')?.click()).catch(() => {}); await p.waitForTimeout(3000); await p.evaluate(() => document.querySelector('#tkenter')?.click()).catch(() => {}); await p.waitForTimeout(3500);
    for (let i = 0; i < 4; i++) { await p.evaluate(() => { for (const b of document.querySelectorAll('button')) if (/^(Geç|Evet, atla|Tamam)$/.test(b.textContent.trim()) && b.offsetParent) { b.click(); return } }); await p.waitForTimeout(1000); }
    const sonra = await ozet(p); R.yenileme = { once, sonra, ayni: JSON.stringify(once) === JSON.stringify(sonra), js_hata: er };
    // 2) Çift tıklama: Han içeceği iki kez hızlı → akçe bir kez mi düşer (aynı içecek etkinken ikinci istek onay ister / reddedilir)
    await p.evaluate(async () => { const C = await import('/js/ui-core.js'); await C.ACT.han({}) }); await p.waitForTimeout(1200);
    const a0 = (await ozet(p)).akce;
    await p.evaluate(() => { const b = document.querySelector('#p28bina [data-a="hanIc"][data-id="savunma"]'); b?.click(); b?.click(); }); await p.waitForTimeout(1800);
    const a1 = (await ozet(p)).akce; R.cift_tik_han = { once: a0, sonra: a1, dusen: a0 - a1, beklenen_tek_bedel: 600, tek_islem: a0 - a1 <= 600 };
    // tezgâh: aynı ürünü iki kez hızlı al → stok/akçe tutarlı mı (iki ayrı alım meşrudur; stok sınırı aşılmamalı)
    await p.evaluate(async () => { (await import('/js/ui-ahir.js')).binaKapat(); const C = await import('/js/ui-core.js'); await C.ACT.goCarsi(); }); await p.waitForTimeout(3500);
    await p.evaluate(async () => { const C = await import('/js/ui-core.js'); await C.ACT.building({ id: 'c_silah' }) }); await p.waitForTimeout(1800);
    const t0 = await ozet(p); const id = await p.evaluate(() => document.querySelector('#win [data-a="tcBuy"]:not(:disabled)')?.dataset.id);
    await p.evaluate(() => { const b = document.querySelector('#win [data-a="tcBuy"]:not(:disabled)'); b?.click(); b?.click(); b?.click(); }); await p.waitForTimeout(2000);
    const t1 = await ozet(p); R.cift_tik_tezgah = { urun: id, once: t0, sonra: t1, alinan_esya: t1.items - t0.items, dusen_akce: t0.akce - t1.akce, not: 'üç hızlı tık; her alım ayrı ve ücretli olmalı, stok sınırı (günlük 3) aşılmamalı' };
    await c.close(); }
  // 3) Bozuk kayıt: oyun çöker mi, ne yapar
  { const c = await b.newContext({ viewport: { width: 880, height: 406 } }); const p = await c.newPage(); const er = []; p.on('pageerror', e => er.push(e.message));
    await p.goto('http://localhost:8765/yok'); await p.evaluate(() => { localStorage.setItem('dd_local_world_v2', '{bozuk json'); });
    await p.goto('http://localhost:8765/?gfx=low&store=1'); await p.waitForTimeout(6000);
    R.bozuk_kayit = { js_hata: er.slice(0, 5), yukleme_hata_mesaji: await p.evaluate(() => document.querySelector('#loading .ld-err:not([hidden])')?.textContent || null), sunucu_secimi_acildi: await p.evaluate(() => !!document.querySelector('.sv-go')), kayit_sonra: await p.evaluate(() => (localStorage.getItem('dd_local_world_v2') || '').slice(0, 20)) };
    await p.screenshot({ path: out + '/bozuk_kayit.png' }); await c.close(); }
  // 4) EN dili: P33 metinleri (NPC satırı, ipucu, perde) Türkçe sızdırmamalı
  { const c = await b.newContext({ viewport: { width: 880, height: 406 } }); const p = await c.newPage(); await giris(p, 'sancak', '?gfx=low&store=1&lang=en');
    const dil = await p.evaluate(() => document.documentElement.lang);
    await p.evaluate(async () => { const C = await import('/js/ui-core.js'); await C.ACT.han({}) }); await p.waitForTimeout(1500);
    const balon = await p.evaluate(() => document.querySelector('#p28bina .icm-soz')?.textContent || null);
    const ip = await p.evaluate(async () => (await import('/js/yukleme-metin.js')).ipucu()); const pm = await p.evaluate(async () => (await import('/js/yukleme-metin.js')).savasMetni({ stage: '2-3' }));
    const premium = await p.evaluate(async () => { (await import('/js/ui-ahir.js')).binaKapat(); const C = await import('/js/ui-core.js'); await C.ACT.premium({}); await new Promise(r => setTimeout(r, 1200)); return [...document.querySelectorAll('#win .tier .price')].map(e => e.textContent.trim()); });
    R.en_dili = { lang: dil, han_balonu: balon, ipucu: ip, perde_metni: pm, premium_fiyat: premium, gecti: dil === 'en' && !balon && !ip && !pm };
    await p.screenshot({ path: out + '/en_premium.png' }); await c.close(); }
  fs.writeFileSync(out + '/sonuc.json', JSON.stringify(R, null, 1)); console.log(JSON.stringify(R, null, 1)); await b.close();
})().catch(e => { console.log('FATAL', e.stack); process.exit(1) });
