// Gemini N5-02 / N4-06: bütün bölge, boss, zindan, Meydan, Baskın ve klan (Oba Avı + Klan Obası) savaşları/ekranları.
// node savas_test.js <ocak|sancak> <çıktı>   (880×406, dpr 2.66, ?gfx=high&store=1)
const { chromium } = require('playwright'); const fs = require('fs'); const giris = require('./giris.js');
const [, , race, out] = process.argv; fs.mkdirSync(out, { recursive: true });
const R = { race, savaslar: [], klan: {} };
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 880, height: 406 }, deviceScaleFactor: 2.66 });
  const err = []; p.on('pageerror', e => err.push(e.message.slice(0, 200)));
  await giris(p, race, '?gfx=high&store=1');
  const ev = (f, a) => p.evaluate(f, a);
  const kapat = () => ev(async () => { const m = document.querySelector('#modal'); if (m && !m.hidden) { m.hidden = true; m.innerHTML = '' } const C = await import('/js/ui-core.js'); try { C.closeWin(true) } catch { } try { (await import('/js/ui-ahir.js')).binaKapat() } catch { } });
  const hub = async () => { await kapat(); await ev(async () => { const C = await import('/js/ui-core.js'); try { await C.ACT.hub?.() } catch { } if (document.documentElement.dataset.place !== 'capital') await C.ACT.goCapital?.(); }); await p.waitForTimeout(2500); await kapat(); };
  // boss aşamaları (kaynak koddan)
  const bossAsama = await ev(async () => { const Z = await import('/shared/zones.js'); const o = {}; const def = Z.stageDef || Z.STAGE_DEF; for (let z = 1; z <= 4; z++) for (let n = 1; n <= 30; n++) { try { const d = def(`${z}-${n}`); if (d?.kind === 'boss' && !o[z]) o[z] = `${z}-${n}`; } catch { } } return o; }).catch(() => ({}));
  R.boss_asamalari = bossAsama;
  const olcHud = () => ev(() => {
    const bb = document.getElementById('bboss'); const bossUst = bb && !bb.hidden && bb.getClientRects().length; const hs = [...document.querySelectorAll('#overlay .hud.B, #overlay .hud.N')].filter(e => e.getClientRects().length && +getComputedStyle(e).opacity > 0.05 && !(bossUst && e.classList.contains('boss'))).map(e => e.getBoundingClientRect());
    let min = null; for (let i = 0; i < hs.length; i++) for (let j = i + 1; j < hs.length; j++) { const a = hs[i], c = hs[j]; if (Math.min(a.right, c.right) - Math.max(a.left, c.left) <= 0) continue; const gap = a.top >= c.bottom ? a.top - c.bottom : c.top >= a.bottom ? c.top - a.bottom : -Math.min(a.bottom - c.top, c.bottom - a.top); min = min === null ? gap : Math.min(min, gap); }
    const tip = document.querySelector('#battleUI .oto-tip'), tr = tip?.getBoundingClientRect(); let tipCak = [];
    if (tr) for (const id of ['bauto', 'bapot', 'bspeed', 'bexit']) { const e = document.getElementById(id); if (!e) continue; const r = e.getBoundingClientRect(); if (Math.min(r.right, tr.right) - Math.max(r.left, tr.left) > 1 && Math.min(r.bottom, tr.bottom) - Math.max(r.top, tr.top) > 1) tipCak.push(id); }
    return { dusman_hud: hs.length, en_kucuk_dikey_bosluk_px: min, oto_tip_var: !!tr, oto_tip_cakisan: tipCak };
  });
  const savas = async (ad, ac) => {
    const K = { ad, durum: 'başlamadı' }; R.savaslar.push(K);
    try {
      await hub(); await ev(ac.f, ac.a); await p.waitForTimeout(2200);
      const vs = await ev(() => !!document.querySelector('#win[data-scr="vs"]:not([hidden]) [data-a="vsStart"]'));
      const dogrudan = await ev(() => !document.querySelector('#battleUI').hidden || !!document.getElementById('p26perde'));
      if (!vs && !dogrudan) { K.durum = 'VS açılmadı'; await p.screenshot({ path: `${out}/${ad}_0_acilmadi.png` }); return; }
      if (vs) { await p.screenshot({ path: `${out}/${ad}_1_vs.png` }); await ev(() => document.querySelector('[data-a="vsStart"]').click()); }
      await p.waitForSelector('#battleUI:not([hidden])', { timeout: 20000 }); await p.waitForTimeout(2600);
      K.zemin = await ev(async () => { const A = await import('/js/savas-arka.js'); return { id: A.ZEMIN.aktif, dosya: (A.BGS[A.ZEMIN.aktif] || [])[0] || null }; });
      K.hud_ilk = await olcHud();
      await p.screenshot({ path: `${out}/${ad}_2_savas.png` });
      await ev(() => { for (let i = 0; i < 3; i++) { const s = [...document.querySelectorAll('#battleUI button')].find(b => /^[123]x$/.test(b.textContent.trim())); if (s && s.textContent.trim() !== '3x') s.click(); } });
      await p.waitForTimeout(5000); K.hud_sonra = await olcHud(); await p.screenshot({ path: `${out}/${ad}_3_savas.png` });
      const ok = await p.waitForSelector('#modal .p25bres, #modal .rz2, #modal .bres', { timeout: 240000 }).then(() => true).catch(() => false);
      await p.waitForTimeout(2500); await p.screenshot({ path: `${out}/${ad}_4_sonuc.png` });
      K.sonuc = ok ? await ev(() => document.querySelector('#modal .box h2, #modal .box .rz2-h, #modal .box b')?.textContent.trim().slice(0, 40)) : 'sonuç ekranı 240 sn içinde gelmedi';
      K.durum = ok ? 'tamamlandı' : 'zaman aşımı';
    } catch (e) { K.durum = 'hata: ' + e.message.slice(0, 120); }
  };
  const AC = { stage: id => ({ f: async id => { const C = await import('/js/ui-core.js'); await C.ACT.stage({ id }) }, a: id }), mode: m => ({ f: async m => { const C = await import('/js/ui-core.js'); await C.ACT.mode({ m }) }, a: m }) };
  // OTO: ilk savaşta açılır, sonra açık kalır (ikinci kez basılmaz)
  await ev(async () => { localStorage.setItem('dd_oto_hint', '0'); localStorage.setItem('dd_oto', '1'); }); // OTO tercihi açık: her savaş OTO başlar
  await savas('bolge1_vahran_1-5', AC.stage('1-5'));
  for (const [z, ad] of [[2, 'kulgecidi'], [3, 'kizilbahar'], [4, 'sisli']]) await savas(`bolge${z}_${ad}_${z}-3`, AC.stage(`${z}-3`));
  for (const [z, id] of Object.entries(bossAsama)) await savas(`boss_bolge${z}_${id}`, AC.stage(id));
  for (const m of ['well', 'depth', 'rift', 'seal']) await savas(`zindan_${m}`, AC.mode(m));
  R.kule_kilidi = await ev(async () => { const { act } = await import('/js/api.js'); try { await act('battle.start', { mode: 'kule' }); return 'açık' } catch (e) { return e.message } }); // Sv.53: 65'te açılır (kural)
  await ev(async () => { const C = await import('/js/ui-core.js'); for (let i = 0; i < 3; i++) await C.ACT.devLevel(); }); await p.waitForTimeout(1500);
  await savas('zindan_kule (Sv.65)', AC.mode('kule'));
  // Meydan (PvP): rakip listesi Meydan açılınca gelir
  await hub(); await ev(async () => { const C = await import('/js/ui-core.js'); await C.ACT.meydan({}) }); await p.waitForTimeout(2000);
  await savas('meydan_pvp', { f: async () => { const C = await import('/js/ui-core.js'); await C.ACT.meydan({}); await new Promise(r => setTimeout(r, 1500)); await C.ACT.arenaVs({ i: 0 }) }, a: null });
  await savas('baskin', { f: async () => { const C = await import('/js/ui-core.js'); await C.ACT.baskin?.({}); await new Promise(r => setTimeout(r, 1200)); C.ACT.baskinGo(); }, a: null });
  // Klan: kur → Klan Obası (dış harita), Klan Karargâhı (arma), Oba Avı savaşı
  await hub();
  R.klan.kurma = await ev(async () => { const C = await import('/js/ui-core.js'); await C.ACT.clan({}); await new Promise(r => setTimeout(r, 1200)); const i = document.querySelector('#cname'); if (!i) return 'kurma formu yok'; i.value = 'Denetci Obasi'; await C.ACT.clanCreate(); await new Promise(r => setTimeout(r, 1500)); return (await import('/js/api.js')).S.clan ? 'kuruldu' : 'kurulamadı'; });
  await p.screenshot({ path: `${out}/klan_0_kurma_sonrasi.png` });
  await hub(); await ev(async () => { const C = await import('/js/ui-core.js'); await C.ACT.goKlan() }); await p.waitForTimeout(3500);
  R.klan.oba_yer = await ev(() => document.documentElement.dataset.place + ' / hub2d=' + document.documentElement.dataset.hub2d);
  R.klan.oba_binalar = await ev(() => [...document.querySelectorAll('[data-a="building"]')].map(e => e.dataset.id));
  R.klan.oba_zemin = await ev(() => getComputedStyle(document.documentElement).getPropertyValue('--s2-bg').trim().slice(0, 80) || [...document.querySelectorAll('img')].map(i => i.currentSrc).filter(s => /klan_obasi/.test(s))[0] || null);
  await p.screenshot({ path: `${out}/klan_1_oba_dis_harita.png` });
  for (const id of ['k_hq', 'k_salon', 'k_hazine', 'k_dukkan', 'k_hisar', 'k_av', 'k_gorev', 'k_sancak', 'portal', 'gate']) {
    await kapat(); await ev(async id => { const C = await import('/js/ui-core.js'); await C.ACT.building({ id }) }, id); await p.waitForTimeout(1800);
    await p.screenshot({ path: `${out}/klan_2_${id}.png` });
  }
  await kapat(); await ev(async () => { const C = await import('/js/ui-core.js'); await C.ACT.building({ id: 'k_hq' }) }); await p.waitForTimeout(1800);
  R.klan.arma_sayisi = await ev(() => document.querySelectorAll('.icm-arma').length);
  R.klan.arma_dolu = await ev(() => [...document.querySelectorAll('.icm-arma')].filter(e => e.innerHTML.trim().length > 0).length);
  await savas('oba_avi_tepegoz', { f: async () => { const C = await import('/js/ui-core.js'); await C.ACT.goKlan(); await new Promise(r => setTimeout(r, 2500)); await C.ACT.mode({ m: 'clanboss' }) }, a: null });
  R.js_hatalari = [...new Set(err)];
  fs.writeFileSync(`${out}/sonuc.json`, JSON.stringify(R, null, 1)); console.log(JSON.stringify(R.savaslar.map(s => [s.ad, s.durum, s.zemin?.id, s.hud_ilk?.en_kucuk_dikey_bosluk_px, s.hud_ilk?.oto_tip_cakisan])), JSON.stringify(R.klan)); await b.close();
})().catch(e => { console.log('FATAL', e.stack); process.exit(1) });
