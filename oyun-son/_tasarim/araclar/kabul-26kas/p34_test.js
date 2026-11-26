// P34 entegrasyon testi (26 Kas): sahne hareket katmanları, NPC göz/ağız kareleri, Bran/Nessa, zafer anıtı, Kragmir 5. yüz,
// yaratık/boss yeni pozları (veri + çözülme), K-2 büyü pozu, ayar kapatmaları. node p34_test.js <ocak|sancak> <çıktı> [W H]
// Sunucu: python3 -m http.server 8765 -d oyun-son. Tarayıcı: Playwright Chromium (masaüstü; GERÇEK CİHAZ DEĞİL).
const { chromium } = require('playwright'); const fs = require('fs'); const giris = require('./giris.js');
const [, , race, out, W = 880, H = 406] = process.argv; fs.mkdirSync(out, { recursive: true });
const R = { race, viewport: [+W, +H], hatalar: [], testler: {} };
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: +W, height: +H }, deviceScaleFactor: 2 });
  p.on('pageerror', e => R.hatalar.push(e.message.slice(0, 200)));
  const ev = (f, a) => p.evaluate(f, a), bek = ms => p.waitForTimeout(ms);
  const kapat = () => ev(async () => { const m = document.querySelector('#modal'); if (m && !m.hidden) { m.hidden = true; m.innerHTML = ''; } const C = await import('/js/ui-core.js'); try { C.closeWin(true); } catch { } document.querySelectorAll('.tcard, .tscrim').forEach(e => e.remove()); });
  await giris(p, race); await kapat();
  // ---- 1. Sahne katmanları: başkent, çarşı, klan (klan için sahne doğrudan kurulur: klan üyeliği gerekmesin)
  const katman = async ad => ev(async () => {
    const cv = document.querySelector('#hub2d .s2-box .p34-katman'); if (!cv) return { var: false, bg: document.querySelector('#hub2d .s2-bg')?.getAttribute('src') || null };
    const g = cv.getContext('2d'), al = () => { const d = g.getImageData(0, 0, cv.width, cv.height).data; let s = 0, n = 0; for (let i = 3; i < d.length; i += 64) { if (d[i]) n++; s += d[i - 1] + d[i - 2]; } return { s, n }; };
    const a = al(); await new Promise(r => setTimeout(r, 450)); const c = al();
    const r = cv.getBoundingClientRect(), k = cv.parentElement.getBoundingClientRect(), cs = getComputedStyle(cv);
    // dokunma: katman olay almaz, bina etiketi hâlâ tıklanır
    const lbl = document.querySelector('.blabel'); let ust = null; if (lbl) { const lr = lbl.getBoundingClientRect(); const e = document.elementFromPoint(lr.left + lr.width / 2, lr.top + lr.height / 2); ust = e ? (e.closest('.blabel') ? 'etiket' : e.className || e.tagName) : null; }
    const sira = [...cv.parentElement.children].map(e => e.className.split(' ')[0] || e.tagName);
    return { var: true, bg: document.querySelector('#hub2d .s2-bg')?.getAttribute('src'), kutu_ayni: Math.abs(r.width - k.width) < 1 && Math.abs(r.height - k.height) < 1, pointer_events: cs.pointerEvents, dolu_ornek: a.n, hareket_var: a.s !== c.s, etiket_ustte: ust, dom_sirasi: sira };
  });
  await ev(async () => { const C = await import('/js/ui-core.js'); try { await C.ACT.hub?.(); } catch { } if (document.documentElement.dataset.place !== 'capital') await C.ACT.goCapital?.(); }); await bek(3500);
  R.testler.katman_baskent = await katman(); await p.screenshot({ path: `${out}/01_baskent_katman_a.png` }); await bek(350); await p.screenshot({ path: `${out}/01_baskent_katman_b.png` });
  await ev(async () => { const C = await import('/js/ui-core.js'); await C.ACT.goCarsi?.(); }); await bek(3500);
  R.testler.katman_carsi = await katman(); await p.screenshot({ path: `${out}/02_carsi_katman.png` });
  await ev(async (h) => { (await import('/js/hub2d.js')).show2d('klan-' + h); }, race); await bek(3500);
  R.testler.katman_klan = await katman(); await p.screenshot({ path: `${out}/03_klan_katman.png` });
  await ev(async () => { const C = await import('/js/ui-core.js'); try { await C.ACT.hub?.(); } catch { } await C.ACT.goCapital?.(); }); await bek(2500);
  // ---- 2. NPC kareleri (8 G4 portresi): 7 sn boyunca portre kaynağı değişiyor mu
  R.testler.npc_kare = {};
  for (const kim of ['halvor', 'maelis', 'corin', 'thrak', 'edran', 'volgar', 'yashka', 'lira']) {
    await kapat();
    await ev(async kim => { const D = await import('/js/ui-diyalog.js'); await D.diyalog({ kim, ad: kim, satirlar: ['Deneme satırı: konuşma ağız karesini tetikler, biraz uzun bir cümle.'], halk: 'sancak' }); }, kim);
    const r = await ev(async () => { const s = new Set(); const t0 = performance.now(); while (performance.now() - t0 < 7000) { const i = document.querySelector('#modal .dlg-por img'); if (i) s.add(i.getAttribute('src').slice(0, 30)); await new Promise(r => setTimeout(r, 40)); } return s.size; });
    R.testler.npc_kare[kim] = { farkli_kare: r };
    if (kim === 'thrak' || kim === 'halvor') await p.screenshot({ path: `${out}/04_dlg_${kim}.png` });
  }
  // hareketi azalt açıkken kare değişmemeli
  await kapat(); await ev(() => document.documentElement.classList.add('motion-less'));
  await ev(async () => { const D = await import('/js/ui-diyalog.js'); await D.diyalog({ kim: 'maelis', ad: 'Maelis', satirlar: ['Hareket azaltılmış.'] }); });
  R.testler.npc_kare_hareket_azalt = await ev(async () => { const s = new Set(); const t0 = performance.now(); while (performance.now() - t0 < 6000) { const i = document.querySelector('#modal .dlg-por img'); if (i) s.add(i.getAttribute('src').slice(0, 30)); await new Promise(r => setTimeout(r, 50)); } return s.size; });
  await ev(() => document.documentElement.classList.remove('motion-less'));
  // ---- 3. Bran / Nessa
  await kapat();
  await ev(async () => { const D = await import('/js/ui-diyalog.js'); await D.diyalog({ kim: 'bran', ad: 'Küçük Bran', satirlar: ['Kardeşim Nessa…'] }); }); await bek(1200);
  R.testler.bran_diyalog = await ev(() => !!document.querySelector('#modal .dlg-por img')); await p.screenshot({ path: `${out}/05_bran_diyalog.png` });
  await kapat();
  R.testler.kurtarma_karti = await ev(async () => { const O = await import('/js/ui-ogretici.js'); const S = await import('/js/sahne.js'); await S.gorselYukle(); document.body.insertAdjacentHTML('beforeend', O.rescueCard()); return !!document.querySelector('.tcard.resc .resc-por img'); });
  await bek(1800); await p.screenshot({ path: `${out}/06_kurtarma_karti.png` }); await kapat();
  // ---- 4. Zafer anıtı (iç mekân, 2048×868)
  await ev(async () => { const C = await import('/js/ui-core.js'); await C.ACT.zaferAniti?.({}); }); await bek(6000);
  R.testler.zafer = await ev(() => { const i = [...document.querySelectorAll('img')].find(x => /zafer_aniti/.test(x.src)) || null; const bg = [...document.querySelectorAll('*')].find(e => /zafer_aniti/.test(getComputedStyle(e).backgroundImage)); return { img: i ? [i.naturalWidth, i.naturalHeight] : null, arka_plan: !!bg, yukleniyor_kaldi: /Yükleniyor/.test(document.body.innerText) }; });
  await p.screenshot({ path: `${out}/07_zafer.png` }); await kapat(); await ev(async () => { try { (await import('/js/ui-ahir.js')).binaKapat?.(); } catch { } });
  // ---- 5. Veri düzeyi: Kragmir 5. yüz, K-2, yaratık/boss yeni pozlar çözülüyor mu (tarayıcıda decode) + kontakt sayfası
  R.testler.veri = await ev(async () => {
    const K = await import('/js/karakter-png.js'); await K.karakterYukle?.();
    const dec = async u => { if (!u) return null; const i = new Image(); i.src = u; try { await i.decode(); return [i.naturalWidth, i.naturalHeight]; } catch { return 'HATA'; } };
    const o = { yuz_ocak_m: [] }; for (let f = 0; f < 5; f++) o.yuz_ocak_m.push(await dec(K.yuzUrl('ocak', 'm', f)));
    const b64 = s => 'data:image/webp;base64,' + s;
    const S = (await import('/js/b2d-sancak.js')).B; o.k2_buyu = await dec(b64(S['savasci-kadin'].buyu));
    const P = { y1: ['rabbit'], y3: ['falcon', 'gargoyle', 'hornet', 'leader_of_barbarian'], y4: ['lamia', 'snake_queen', 'maresal-marven', 'adsiz'], yb: ['dragon_fire', 'dragon_ice', 'dragon_shadow', 'dragon_lightning', 'dev-solucan', 'tepegoz', 'kristal-muhafizi', 'lav-yurek', 'kul-agasi-karadun'] };
    o.pozlar = {}; const sheet = document.createElement('div'); sheet.id = 'p34sheet'; sheet.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#555;display:flex;flex-wrap:wrap;align-content:flex-start;gap:2px;overflow:hidden';
    for (const [pk, L] of Object.entries(P)) { const B = (await import(`/js/b2d-${pk}.js`)).B; for (const a of L) { const d = B[a] || {}; o.pozlar[a] = {}; for (const z of ['bekleme', 'saldiri', 'vurulma', 'bekleme2', 'saldiri2', 'vurulma2']) { o.pozlar[a][z] = d[z] ? await dec(b64(d[z])) : null; if (d[z]) { const im = document.createElement('img'); im.src = b64(d[z]); im.style.cssText = 'width:52px;height:52px;object-fit:contain'; im.title = a + ' ' + z; sheet.appendChild(im); } } } }
    for (let f = 0; f < 5; f++) { const im = document.createElement('img'); im.src = K.yuzUrl('ocak', 'm', f); im.style.cssText = 'width:52px;height:52px'; sheet.appendChild(im); }
    const im = document.createElement('img'); im.src = b64(S['savasci-kadin'].buyu); im.style.cssText = 'height:104px'; sheet.appendChild(im);
    document.body.appendChild(sheet); return o;
  });
  await bek(800); await p.screenshot({ path: `${out}/08_veri_kontakt.png` }); await ev(() => document.getElementById('p34sheet')?.remove());
  // ---- 6. Ayarlar: çevre animasyonu kapalı / pil tasarrufu / hareketi azalt → katman tuvali kaldırılır; geri açınca yeniden kurulur.
  // (Sayfa yeniden yüklenmez: p33-canli kök sınıf değişimini izler; ayar değişimini aynı yoldan tetikleriz.)
  await kapat(); await ev(async () => { const C = await import('/js/ui-core.js'); try { await C.ACT.hub?.(); } catch { } await C.ACT.goCapital?.(); }); await bek(2500);
  const durum = () => ev(() => ({ katman: !!document.querySelector('#hub2d .s2-box .p34-katman'), sahne: !!document.querySelector('#hub2d .s2-bg') }));
  const tetikle = () => ev(() => { const c = document.documentElement.classList; c.toggle('p34-tetik'); c.toggle('p34-tetik'); });
  R.testler.kapatma = { once: await durum() };
  for (const [ad, k, v] of [['canli_kapali', 'dd_canli', '0'], ['pil', 'dd_pil', '1']]) {
    await ev(([k, v]) => localStorage.setItem(k, v), [k, v]); await tetikle(); await bek(1200); R.testler.kapatma[ad] = await durum();
    await ev(k => localStorage.removeItem(k), k); await tetikle(); await bek(1500); R.testler.kapatma[ad + '_geri'] = await durum();
  }
  await ev(() => document.documentElement.classList.add('motion-less')); await bek(1200); R.testler.kapatma.hareket_azalt = await durum();
  await ev(() => document.documentElement.classList.remove('motion-less')); await bek(1500); R.testler.kapatma.hareket_azalt_geri = await durum();
  fs.writeFileSync(`${out}/sonuc.json`, JSON.stringify(R, null, 1)); console.log(JSON.stringify(R, null, 1)); await b.close();
})();
