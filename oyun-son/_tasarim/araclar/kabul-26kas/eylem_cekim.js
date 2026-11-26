// Kaynak koddaki ekran açan HER eylemi (ekran_envanteri.json) doğrudan çağırır; açılan pencerenin her sekmesini dolaşır;
// ekran görüntüsü + ölçüm. Onay penceresinde "Evet"e basılmaz. Klan ekranları klan kurulduktan sonra ayrıca çekilir.
// node eylem_cekim.js <halk> <ekran_envanteri.json> <çıktı> [W H dpr] [sorgu]
const { chromium } = require('playwright'); const fs = require('fs'); const giris = require('./giris.js'); const DENETCI = require('./denetci.js');
const [, , race, envYol, out, W = '880', H = '406', DPR = '2.66', Q = '?gfx=high&store=1'] = process.argv; fs.mkdirSync(out, { recursive: true });
const ENV = JSON.parse(fs.readFileSync(envYol, 'utf8'));
const ACAN = new Set(['pencere', 'bina katmanı', 'NPC diyaloğu', 'modal', 'onay penceresi', 'onay penceresi + veri yazar', 'savaş / VS']);
const RED = /^(logout|charSwitch|charDelete|dev|reset|sifirla|fullscreen|tkEnter|tkPick|charCreate|server$|serverPick|vsStart|startBattle|again|next|nbGo|anitGo|baskinGo|destanGo|ormanFight|payBuy|odeme)/i;
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: +W, height: +H }, deviceScaleFactor: +DPR });
  const err = []; p.on('pageerror', e => err.push(e.message.slice(0, 200)));
  await giris(p, race, Q);
  const ev = (f, a) => p.evaluate(f, a);
  const sig = () => ev(() => { const vis = e => e && !e.hidden && e.getClientRects().length > 0 && getComputedStyle(e).display !== 'none';
    const t = e => (e?.textContent || '').replace(/[0-9.,/×✕+%:]+/g, ' ').trim().replace(/\s+/g, ' ').slice(0, 40); const P = [];
    if (vis(document.querySelector('#battleUI'))) P.push('SAVAŞ'); const w = document.querySelector('#win'); if (vis(w)) { const on = w.querySelector('nav.tabs button.on'); P.push('W:' + t(w.querySelector('h2')) + '|' + (w.dataset.scr || '') + (on ? '~' + on.dataset.id : '')); }
    const bn = document.querySelector('#p28bina'); if (vis(bn)) P.push('B:' + t(bn.querySelector('.kb-h'))); const m = document.querySelector('#modal'); if (vis(m)) { const dl = m.querySelector('.dlg-ad b'); P.push('M:' + (dl ? 'DİYALOG ' + t(dl) : ((m.querySelector('.box')?.className || '').split(/\s+/).filter(c => !/^(box|still)$/.test(c)).join('.') + '|' + t(m.querySelector('h2,h3,b,strong'))))); }
    for (const e of document.body.children) { if (/^(game|stage|overlay|hud|chatbar|battleUI|win|modal|toast|loading|p28bina)$/.test(e.id) || e.tagName === 'SCRIPT') continue; const s = getComputedStyle(e); if (vis(e) && /fixed|absolute/.test(s.position) && e.getBoundingClientRect().width > 200 && e.getBoundingClientRect().height > 120) P.push('K:' + (e.id || String(e.className).split(' ')[0])); }
    const pl = document.documentElement.dataset.place || 'capital'; return (P.length ? P.join(' / ') : 'HUB') + ' @' + pl; });
  const kapat = async () => { await ev(async () => { const m = document.querySelector('#modal'); if (m && !m.hidden) { m.hidden = true; m.innerHTML = '' } const C = await import('/js/ui-core.js'); try { C.closeWin(true) } catch { } try { (await import('/js/ui-ahir.js')).binaKapat() } catch { } try { (await import('/js/combat.js')).hideBattleUI() } catch { } }); await p.waitForTimeout(300); };
  const yereGit = async yer => { await kapat(); const pl = await ev(() => document.documentElement.dataset.place || 'capital'); if (pl === yer) return;
    await ev(async y => { const C = await import('/js/ui-core.js'); if (y === 'capital') await C.ACT.goCapital(); else if (y === 'carsi') await C.ACT.goCarsi(); else await C.ACT.goKlan(); }, yer); await p.waitForTimeout(3600); await kapat(); };
  const K = []; let n = 0;
  const cek = async (etiket, yer, act, d = {}) => {
    await yereGit(yer); const s0 = await sig();
    const r = await ev(async ([a, d]) => { const C = await import('/js/ui-core.js'); if (!C.ACT[a]) return 'tanımsız'; try { await C.ACT[a]({ ...d }); return 'ok' } catch (x) { return 'hata: ' + String(x.message).slice(0, 100) } }, [act, d]);
    await p.waitForTimeout(1500); const s1 = await sig(); const ad = String(n++).padStart(4, '0');
    const kayit = { no: ad, etiket, yer, eylem: act, d, cagri: r, durum: s1, acildi: s1 !== s0, sekmeler: [] };
    await p.screenshot({ path: `${out}/${ad}.png` }); kayit.olcum = await ev(DENETCI).catch(e => ({ hata: e.message }));
    const tabs = await ev(() => [...document.querySelectorAll('#win:not([hidden]) nav.tabs button:not(.on):not([disabled])')].map(x => x.dataset.id));
    for (const t of tabs) { await ev(async t => { const C = await import('/js/ui-core.js'); C.ACT.tab({ id: t }) }, t); await p.waitForTimeout(1100); const a2 = `${ad}~${t}`; await p.screenshot({ path: `${out}/${a2}.png` }); kayit.sekmeler.push({ sekme: t, dosya: a2 + '.png', durum: await sig(), olcum: await ev(DENETCI).catch(e => ({ hata: e.message })) }); }
    K.push(kayit); console.log(ad, etiket, r, kayit.acildi ? s1.slice(0, 70) : 'AÇILMADI', tabs.length ? '+' + tabs.length + ' sekme' : '');
  };
  // 1) ekran açan bütün eylemler (parametresiz)
  const L = ENV.eylemler.filter(x => ACAN.has(x.tur) && !RED.test(x.eylem));
  for (const x of L) await cek(`eylem:${x.eylem}`, 'capital', x.eylem);
  // 2) parametreli varyantlar: bütün binalar (başkent, pazar), kipler/zindanlar, örnek aşama
  for (const yer of ['capital', 'carsi']) { await yereGit(yer); const ids = await ev(() => [...new Set([...document.querySelectorAll('[data-a="building"]')].map(e => e.dataset.id))]); for (const id of ids) await cek(`bina:${yer}:${id}`, yer, 'building', { id }); }
  for (const m of ['well', 'depth', 'rift', 'seal', 'kule', 'akin', 'siege', 'banner', 'yemin']) await cek(`kip:${m}`, 'capital', 'mode', { m });
  await cek('asama:1-1', 'capital', 'stage', { id: '1-1' }); await cek('asama:4-5 (boss)', 'capital', 'stage', { id: '4-5' });
  // 3) klan kur → klan toprağı ve klan ekranları
  await yereGit('capital');
  const kur = await ev(async () => { const C = await import('/js/ui-core.js'); await C.ACT.clan({}); await new Promise(r => setTimeout(r, 1200)); const i = document.querySelector('#cname'); if (!i) return 'form yok'; i.value = 'Denetci Obasi'; await C.ACT.clanCreate(); await new Promise(r => setTimeout(r, 1500)); return (await import('/js/api.js')).S.clan ? 'kuruldu' : 'kurulamadı'; });
  console.log('klan', kur);
  await yereGit('klan'); { const s = await sig(); const ad = String(n++).padStart(4, '0'); await p.screenshot({ path: `${out}/${ad}.png` }); K.push({ no: ad, etiket: 'yer:klan (Klan Obası dış haritası)', yer: 'klan', eylem: 'goKlan', durum: s, acildi: true, olcum: await ev(DENETCI) }); }
  const kids = await ev(() => [...new Set([...document.querySelectorAll('[data-a="building"]')].map(e => e.dataset.id))]);
  for (const id of kids) await cek(`bina:klan:${id}`, 'klan', 'building', { id });
  for (const a of ['clan', 'clanhq', 'czHall', 'gateKlan']) await cek(`klanli:${a}`, 'capital', a);
  await cek('kip:clanboss (Oba Avı)', 'klan', 'mode', { m: 'clanboss' });
  fs.writeFileSync(`${out}/_eylem.json`, JSON.stringify({ race, W: +W, H: +H, dpr: +DPR, sorgu: Q, klan: kur, err: [...new Set(err)], kayit: K }, null, 1));
  console.log('BİTTİ', K.length, 'açılan', K.filter(k => k.acildi).length, 'sekme', K.reduce((a, k) => a + (k.sekmeler?.length || 0), 0), 'JS hata', err.length); await b.close();
})().catch(e => { console.log('FATAL', e.stack); process.exit(1) });
