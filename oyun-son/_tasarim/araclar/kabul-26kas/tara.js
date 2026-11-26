// Dinamik ekran envanteri: oyunu gerçekten gezer. Her durumda görünen bütün [data-a] öğelerini dener; yeni durumu (pencere/sekme/
// modal/bina/diyalog/savaş/katman/ana ekran yeri) kaydeder, oraya varış tarifini (adım listesi) saklar. Veri yazan eylemler denenmez.
// node tara.js <ocak|sancak> <çıktı> [derinlik=3]
const { chromium } = require('playwright'); const fs = require('fs');
const [, , race, out, DER = '3'] = process.argv; fs.mkdirSync(out + '/k', { recursive: true });
const ENV = JSON.parse(fs.readFileSync(__dirname + '/act_envanter.json', 'utf8'));
const YAZAN = new Set(ENV.filter(r => r.yazma.length).map(r => r.eylem));
const RED = /^(dev|closeWin|closeModal|binaKapat|icmCik|icmGizle|icmAc|confirm|yes|evet|onay|logout|cikis|charDelete|charSwitch|reset|sifirla|fullscreen|tkEnter|tkPick|charCreate|olz|vsStart|startBattle|flee|abandon|buy|sell|send|claim|collect|spin|pay|share|copy|kopyala|dlgNext|dlgSon|chatSend|emo|server$|srv|sv|reload|yenile|refresh|arenaRefresh|exchange|gift|trade|kaydet|save|hanIc|hanOnay|ahirAc|ahirKusan|ahirBesle|zaferAl|mineCollect|upgrade|equip|unequip|lock|kilit|dismantle|parcala|sat$|al$|odul|bonus|daily|monthly|weekly|join|leave|kick|invite|accept|reject|block|unblock|report|sikayet|mute|vote|oy|donate|bagis|grant|feed|fish|cast|reel|olta|seri|sweep|idle|auto|oto)/i;
const SINIRSIZ = /^(building|tab|tuccarSub|go[A-Z]|gate[A-Z])/;
const log = [];
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 880, height: 406 }, deviceScaleFactor: 1 });
  const err = []; p.on('pageerror', e => err.push(e.message.slice(0, 200)));
  const tk = async (s, ms = 8000) => { try { await p.waitForSelector(s, { timeout: ms }); await p.evaluate(s => document.querySelector(s).click(), s); return true } catch { return false } };
  await p.goto('http://localhost:8765/?gfx=low'); await tk('.sv-go', 20000); await p.waitForSelector('[data-o="race"]', { timeout: 20000 });
  await p.evaluate(r => document.querySelectorAll('[data-o="race"]')[r === 'ocak' ? 1 : 0].click(), race); await p.fill('#olzname', 'Denetci'); await tk('#olzgo'); await p.waitForTimeout(2500);
  await tk('#tkenter', 10000); await p.waitForTimeout(2500); await p.evaluate(() => [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Geç')?.click()); await p.waitForTimeout(2000);
  for (let i = 0; i < 8; i++) { const d = await p.evaluate(() => { const v = s => [...document.querySelectorAll(s)].some(e => e.offsetParent && e.getBoundingClientRect().width > 0); for (const b of document.querySelectorAll('button')) if (/^(Evet, atla|Tamam|Atla)$/.test(b.textContent.trim()) && b.offsetParent) { b.click(); return 'b' } if (v('.p26o-x')) { document.querySelector('.p26o-x').click(); return 'o' } return v('.blabel') ? 'hub' : '?' }); if (d === 'hub') break; await p.waitForTimeout(1500) }
  if (await p.evaluate(async () => (await import('/js/orman.js')).ormanOn())) throw new Error('öğretici atlanamadı');
  await p.evaluate(async () => { const C = await import('/js/ui-core.js'); for (let i = 0; i < 10; i++) await C.ACT.devLevel(); await C.ACT.devGive(); await C.ACT.devGear(); await C.ACT.devUnlock(); await C.ACT.devEnergy(); });
  await p.waitForTimeout(2000);
  const sig = () => p.evaluate(() => {
    const vis = e => e && !e.hidden && e.getClientRects().length > 0 && getComputedStyle(e).visibility !== 'hidden' && getComputedStyle(e).display !== 'none';
    const t = e => (e?.textContent || '').replace(/[0-9.,/×✕+%:]+/g, ' ').trim().replace(/\s+/g, ' ').slice(0, 40);
    const parts = []; let top = null;
    const hub = [...document.querySelectorAll('[data-a="building"]')].map(e => e.dataset.id); const pl = document.documentElement.dataset.place || 'capital'; const yer = pl === 'capital' ? 'baskent' : pl;
    const bui = document.querySelector('#battleUI'); if (vis(bui)) { parts.push('SAVAŞ'); top = bui; }
    const w = document.querySelector('#win'); if (vis(w)) { const on = w.querySelector('nav.tabs button.on'); parts.push('W:' + t(w.querySelector('h2')) + '|' + (w.dataset.scr || '') + (on ? '~' + on.dataset.id : '')); top = w.querySelector('.frame') || w; }
    const bn = document.querySelector('#p28bina'); if (vis(bn)) { parts.push('B:' + t(bn.querySelector('h2,.kb-title,header'))); top = bn; }
    const m = document.querySelector('#modal'); if (vis(m)) { const bx = m.querySelector('.box'); const dl = m.querySelector('.dlg-ad b'); parts.push('M:' + (dl ? 'DİYALOG ' + t(dl) : ((bx?.className || '').split(/\s+/).filter(c => !/^(box|still)$/.test(c)).join('.') + '|' + t(m.querySelector('h2,h3,b,strong'))))); top = bx || m; }
    for (const e of document.body.children) { if (/^(game|stage|overlay|hud|chatbar|battleUI|win|modal|toast|loading|p28bina)$/.test(e.id) || e.tagName === 'SCRIPT') continue; const s = getComputedStyle(e); if (vis(e) && (s.position === 'fixed' || s.position === 'absolute') && e.getBoundingClientRect().width > 200 && e.getBoundingClientRect().height > 120) { parts.push('K:' + (e.id || e.className.toString().split(' ')[0])); top = e; } }
    if (!parts.length) parts.push('HUB:' + yer);
    const kok = top || document.body;
    const el = [...kok.querySelectorAll('[data-a]')].filter(e => vis(e) && !e.disabled && e.getBoundingClientRect().width > 0).map(e => ({ a: e.dataset.a, ds: { ...e.dataset } }));
    if (!top) for (const e of document.querySelectorAll('#hud [data-a], #chatbar [data-a], #stage [data-a], #overlay [data-a]')) if (vis(e)) el.push({ a: e.dataset.a, ds: { ...e.dataset } });
    return { sig: parts.join(' / ') + (parts[0].startsWith('HUB') ? '' : ' @' + yer), yer, el };
  });
  const kapat = async () => { await p.evaluate(async () => { const m = document.querySelector('#modal'); if (m && !m.hidden) { m.hidden = true; m.innerHTML = '' } const C = await import('/js/ui-core.js'); try { C.closeWin(true) } catch { } try { (await import('/js/ui-ahir.js')).binaKapat() } catch { } for (const e of document.querySelectorAll('.p26o-x')) e.click(); }); await p.waitForTimeout(300); };
  const adim = async st => p.evaluate(async st => { try {
    const sel = `[data-a="${st.a}"]`; const es = [...document.querySelectorAll(sel)].filter(e => Object.entries(st.ds).every(([k, v]) => e.dataset[k] === v) && e.getClientRects().length);
    if (es.length) { const e = es[es.length - 1]; if (typeof e.click === 'function') e.click(); else e.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })); return 'tık'; }
    const C = await import('/js/ui-core.js'); if (!C.ACT[st.a]) return 'yok'; try { await C.ACT[st.a]({ ...st.ds }); return 'çağrı' } catch (x) { return 'hata ' + x.message }
  } catch (x) { return 'hata ' + x.message } }, st).catch(e => 'hata ' + e.message);
  const git = async tarif => { await kapat(); const s0 = await sig(); if (s0.yer !== 'baskent') { await p.evaluate(async () => { const C = await import('/js/ui-core.js'); await C.ACT.goCapital?.() }); for (let i = 0; i < 10; i++) { await p.waitForTimeout(700); if ((await sig()).yer === 'baskent') break; } await p.waitForTimeout(800); await kapat(); } for (const st of tarif) { await adim(st); await p.waitForTimeout(/^(go|gate[A-Z]|travel)/.test(st.a) ? 3200 : 800); } };
  const DUR = new Map(); const kuyruk = [];
  const ekle = async (s, tarif) => { if (DUR.has(s.sig)) return false; const n = DUR.size; DUR.set(s.sig, { no: n, sig: s.sig, yer: s.yer, tarif, oge: [...new Set(s.el.map(x => x.a))] }); await p.screenshot({ path: `${out}/k/${String(n).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 60 }); kuyruk.push(s.sig); log.push(n + '\t' + s.sig + '\t' + JSON.stringify(tarif)); console.log(n, s.sig); return true; };
  await kapat(); await ekle(await sig(), []);
  let deneme = 0; const t0 = Date.now();
  while (kuyruk.length && Date.now() - t0 < 85 * 60 * 1000) {
    const k = kuyruk.shift(); const D = DUR.get(k); if (D.tarif.length >= +DER) continue;
    await git(D.tarif); let cur = await sig(); if (cur.sig !== k) { D.ulasilamadi = cur.sig; continue; }
    const say = {}; const aday = [];
    for (const x of cur.el) { if (RED.test(x.a) || YAZAN.has(x.a)) continue; const anah = x.a + JSON.stringify(x.ds); if (aday.some(y => y.k === anah)) continue; say[x.a] = (say[x.a] || 0) + 1; if (!SINIRSIZ.test(x.a) && say[x.a] > 2) continue; aday.push({ k: anah, st: { a: x.a, ds: x.ds } }); }
    D.denenen = aday.length;
    for (const { st } of aday) {
      deneme++; const r = await adim(st); await p.waitForTimeout(/^(go|gate[A-Z]|travel)/.test(st.a) ? 3200 : 850);
      const s = await sig();
      if (s.sig !== k) { await ekle(s, [...D.tarif, st]); await git(D.tarif); const c2 = await sig(); if (c2.sig !== k) break; }
    }
  }
  fs.writeFileSync(`${out}/durumlar.json`, JSON.stringify({ race, deneme, sure_sn: Math.round((Date.now() - t0) / 1000), err: [...new Set(err)], durumlar: [...DUR.values()] }, null, 1));
  fs.writeFileSync(`${out}/log.txt`, log.join('\n')); console.log('BİTTİ', DUR.size, 'durum', deneme, 'deneme', err.length, 'hata'); await b.close();
})().catch(e => { console.log('FATAL', e.stack); process.exit(1) });
