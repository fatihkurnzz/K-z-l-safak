// 3B Savaş Faz 1 · sonuç eşitliği testi (2B ↔ 3B). Aynı tohumla aynı savaşı iki kipte oynatır, motorun aldığı her hamleyi
// ve son durumu kaydeder. Kullanım (sunucu: python3 -m http.server 8765 -d oyun-son):
//   node esitlik.js <b3d: 0|1> <aşama> <çıktı.json> [gfx]
//   node esitlik.js karsilastir <a.json> <b.json>
// Tohum: tarayıcının crypto.getRandomValues ve Math.random'ı iki koşuda aynı sabit diziyle değiştirilir (init betiği);
// bu yüzden yerel sunucunun verdiği savaş tohumu iki kipte aynıdır (kayıtta doğrulanır: 'tohum').
// Kayıt: Battle.prototype.advance sarılır (motor dosyasına dokunulmaz) → her çağrının girdisi (oyuncu/OTO seçimi) ve
// dönen olayların özeti; savaş bitince bütün birimlerin son canı/MP'si/durumu.
const fs = require('fs'); const path = require('path');
if (process.argv[2] === 'karsilastir') {
  const [a, b] = process.argv.slice(3).map(f => JSON.parse(fs.readFileSync(f)));
  const s = x => JSON.stringify(x);
  const r = { tohum_ayni: a.tohum === b.tohum && a.tohum != null, tohum: [a.tohum, b.tohum], hamle_sayisi: [a.hamleler.length, b.hamleler.length], hamleler_ayni: s(a.hamleler) === s(b.hamleler), olay_ozeti_ayni: s(a.olaylar) === s(b.olaylar), son_durum_ayni: s(a.son) === s(b.son), kazanan: [a.kazanan, b.kazanan], cizim: [a.cizim, b.cizim] };
  r.SONUC = r.tohum_ayni && r.hamleler_ayni && r.olay_ozeti_ayni && r.son_durum_ayni && a.kazanan === b.kazanan ? 'GEÇTİ' : 'KALDI';
  console.log(JSON.stringify(r, null, 1)); process.exit(r.SONUC === 'GEÇTİ' ? 0 : 1);
}
const { chromium } = require('playwright'); const giris = require('./giris.js');
const [, , b3d, asama = '1-11', out = 'esitlik.json', gfx = 'high'] = process.argv;
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 880, height: 406 }, deviceScaleFactor: 1 });
  const err = []; p.on('pageerror', e => err.push(e.message.slice(0, 200)));
  await p.addInitScript(() => {
    let s = 0x2545f491; const nx = () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s; };
    const gr = crypto.getRandomValues.bind(crypto);
    crypto.getRandomValues = a => { if (a instanceof Uint32Array) { for (let i = 0; i < a.length; i++) a[i] = nx(); return a; } return gr(a); };
    let m = 0x9e3779b9; Math.random = () => { m ^= m << 13; m >>>= 0; m ^= m >>> 17; m ^= m << 5; m >>>= 0; return m / 4294967296; };
  });
  await giris(p, 'sancak', `?gfx=${gfx}&b3d=${b3d}`);
  await p.evaluate(() => { localStorage.setItem('dd_oto_hint', '0'); localStorage.setItem('dd_oto', '1'); });
  await p.waitForTimeout(9000);
  await p.evaluate(async () => {
    const { Battle } = await import('/shared/battle.js'); const W = window.__ES = { hamleler: [], olaylar: [], b: null };
    const ozet = e => [e.k, e.u, e.skill, e.target, e.dmg, e.hp, (e.fx || []).map(f => [f.k, f.u, f.v ?? f.dmg ?? f.amt ?? f.s ?? null])];
    const A = await import('/js/api.js'); A.taps.add((t, q, pr) => { if (t === 'battle.start') pr.then(r => { const f = o => o && typeof o === 'object' ? (Number.isInteger(o.seed) ? o.seed : Object.values(o).map(f).find(x => x != null)) : null; W.tohum = f(r); W.kurulum = JSON.stringify(r?.battle?.party || r?.setup?.party || null).length; }).catch(() => {}); });
    const asil = Battle.prototype.advance;
    Battle.prototype.advance = function (c) { W.b = this; W.hamleler.push(c ?? null); const r = asil.call(this, c); W.olaylar.push([r?.over ?? null, (r?.events || []).map(ozet)]); return r; };
  });
  await p.evaluate(async s => { const C = await import('/js/ui-core.js'); await C.ACT.stage({ id: s }); }, asama); await p.waitForTimeout(2000);
  await p.evaluate(() => document.querySelector('[data-a="vsStart"]')?.click());
  await p.waitForSelector('#battleUI:not([hidden])', { timeout: 20000 }); await p.waitForTimeout(1500);
  const cizim = await p.evaluate(async () => { const W = await import('/js/world.js'); return { b3d: window.DD_B3D?.neden, birimler: W.world.actors.map(a => a.char.constructor.name) }; });
  await p.evaluate(() => { for (let i = 0; i < 3; i++) { const s = [...document.querySelectorAll('#battleUI button')].find(b => /^[123]x$/.test(b.textContent.trim())); if (s && s.textContent.trim() !== '3x') s.click(); } });
  const ok = await p.waitForSelector('#modal .p25bres, #modal .rz2, #modal .bres', { timeout: 300000 }).then(() => true).catch(() => false);
  const R = await p.evaluate(async () => {
    const W = window.__ES, B = W.b;
    const son = B ? B.units.map(u => [u.id, u.side, u.name, u.hp, u.mp ?? null, u.alive, (u.st || []).map(x => x.s + ':' + x.t).join('|')]) : null;
    return { tohum: W.tohum ?? null, hamleler: W.hamleler, olaylar: W.olaylar, son, kazanan: W.olaylar.at(-1)?.[0] ?? null };
  });
  Object.assign(R, { b3d, asama, gfx, cizim, sonuc_ekrani: ok, js_hatalari: [...new Set(err)] });
  fs.writeFileSync(out, JSON.stringify(R));
  console.log(JSON.stringify({ b3d, cizim, hamle: R.hamleler.length, kazanan: R.kazanan, tohum: R.tohum, sonuc_ekrani: ok, hata: R.js_hatalari.length }));
  await b.close();
})().catch(e => { console.log('FATAL', e.stack); process.exit(1); });
