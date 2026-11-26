// F-025: geçerli tabanlı pazar + klan senaryosu (iki karakter, takas edilebilir eşya). Yerel simülasyon; gerçek çok oyunculu DEĞİL.
import fs from 'node:fs'; import { dunya, imp } from './h25.mjs';
const IT = await imp('items.js'); const GD = await imp('guard.js');
const d = await dunya(25);
const A = await d.kar({ name: 'Satici', race: 'ocak', cls: 'warrior' }, 'hesapA'), B = await d.kar({ name: 'Alici', race: 'ocak', cls: 'warrior' }, 'hesapB');
for (const k of [A, B]) for (const [t, a] of [['tut.skip', {}], ['dev.level', { lvl: 60 }], ['dev.gear', {}], ['dev.unlock', {}], ['dev.give', {}]]) await k.dene(t, a);
d.st.now += 40 * 86400000; await A.act('ping'); await B.act('ping'); d.st.dev = false;
const R = []; const kay = (ad, sonuc, not) => { R.push({ ad, sonuc, not }); console.log((sonuc === 'GECTI' ? 'ok  ' : sonuc === 'BULGU' ? '!!  ' : '..  ') + ad + ' — ' + not); };
const kus = k => new Set(Object.values(k.S.heroes).flatMap(h => Object.values(h.eq || h.gear || {})));
const serbest = k => k.S.items.filter(it => !kus(k).has(it.id) && IT.isTradable(it));
// ---- PAZAR ----
const it = serbest(A)[0];
kay('takas edilebilir eşya bulundu', it ? 'GECTI' : 'BULGU', it ? `id ${it.id}, baz ${it.b}` : 'A karakterinde takas edilebilir serbest eşya yok');
if (it) {
  const B0 = GD.priceBounds(it); const fiyat = B0.min;
  const aK = A.S.akce, bK = B.S.akce, aN = A.S.items.length, bN = B.S.items.length;
  const s = await A.dene('market.sell', { id: it.id, price: fiyat });
  kay('ilan aç', s.ok ? 'GECTI' : 'BULGU', s.ok ? `ilan ${s.r.id}, ücret ${s.r.fee}; A akçe ${aK}→${A.S.akce}, eşya ${aN}→${A.S.items.length}` : `${s.code} ${s.msg}`);
  if (s.ok) {
    const lid = s.r.id;
    kay('kendi ilanını alma reddi', (await A.dene('market.buy', { id: lid })).ok ? 'BULGU' : 'GECTI', 'own-listing beklenir');
    const l = await B.dene('market.list', {}); kay('alıcı ilanı listede görür', l.ok && l.r.listings.some(x => x.id === lid) ? 'GECTI' : 'BULGU', l.ok ? `${l.r.listings.length} ilan` : l.code);
    const b1 = await B.dene('market.buy', { id: lid });
    kay('satın alma', b1.ok ? 'GECTI' : 'BULGU', b1.ok ? `B akçe ${bK}→${B.S.akce} (fark ${B.S.akce - bK}, beklenen -${fiyat}), eşya ${bN}→${B.S.items.length}` : `${b1.code} ${b1.msg}`);
    const b2 = await B.dene('market.buy', { id: lid }); kay('aynı ilanı ikinci kez alma', b2.ok ? 'BULGU' : 'GECTI', b2.ok ? 'İKİ KEZ ALINDI' : b2.code);
    const c = await A.dene('market.cancel', { id: lid }); kay('satılmış ilanı iptal (eşya çoğalması?)', c.ok ? 'BULGU' : 'GECTI', c.ok ? `İPTAL KABUL: A eşya ${A.S.items.length}` : c.code);
    const m = await A.dene('market.mine', {}); const posta = await A.dene('mail.list', {}).catch(() => ({ ok: false }));
    kay('satıcı posta/yuva durumu', 'BILGI', `mine ${m.ok ? JSON.stringify(m.r).slice(0, 120) : m.code}; posta ${posta.ok ? JSON.stringify(posta.r).slice(0, 120) : posta.code}`);
    { const ml = (await A.dene('mail.list', {})).r.mail.find(x => x.text.startsWith('Satıldı')); const a0 = A.S.akce; const cl = await A.dene('mail.claim', { id: ml.id }); const net = ml.give[0].n; kay('satıcı ödemeyi postadan alır', cl.ok && A.S.akce - a0 === net && net === fiyat - Math.floor(fiyat * 0.05) ? 'GECTI' : 'INCELE', cl.ok ? `akçe ${a0}→${A.S.akce} (+${A.S.akce - a0}); posta ${net}; fiyat ${fiyat}; vergi ${fiyat - net}` : cl.code); const cl2 = await A.dene('mail.claim', { id: ml.id }); kay('postayı ikinci kez alma', cl2.ok ? 'BULGU' : 'GECTI', cl2.ok ? 'İKİ KEZ ÖDENDİ' : cl2.code); const m2 = await A.dene('market.mine', {}); kay('ödeme sonrası ilan yuvası boşalır', m2.ok && m2.r.used === 0 ? 'GECTI' : 'INCELE', JSON.stringify(m2.r).slice(0, 80)); }
    // toplam kontrol: B'nin akçesi -fiyat, A'nın akçesi şimdilik -ücret (ödeme postada)
  }
  // ikinci ilan: açıp iptal et
  const it2 = serbest(A)[0];
  if (it2) { const n0 = A.S.items.length; const s2 = await A.dene('market.sell', { id: it2.id, price: fiyat }); if (s2.ok) { const c2 = await A.dene('market.cancel', { id: s2.r.id }); kay('ilan aç → iptal: eşya geri döner', c2.ok && A.S.items.length === n0 ? 'GECTI' : 'BULGU', `eşya ${n0}→${A.S.items.length}; ücret iade edilmez (beklenen)`); const c3 = await A.dene('market.cancel', { id: s2.r.id }); kay('iptali ikinci kez', c3.ok ? 'BULGU' : 'GECTI', c3.ok ? 'İKİ KEZ GERİ ALINDI (eşya çoğalır)' : c3.code); const b3 = await B.dene('market.buy', { id: s2.r.id }); kay('iptal edilmiş ilanı alma', b3.ok ? 'BULGU' : 'GECTI', b3.ok ? 'ALINDI' : b3.code); } }
}
// ---- KLAN ----
const cr = await A.dene('clan.create', { name: 'Senaryo Klani' }); kay('klan kur', cr.ok ? 'GECTI' : 'BILGI', cr.ok ? JSON.stringify(cr.r).slice(0, 100) : `${cr.code} ${cr.msg}`);
if (cr.ok) {
  const cid = cr.r.id ?? A.S.clan?.id; const ap = await B.dene('clan.join', { id: cid }); kay('açık klana katılma', ap.ok ? 'GECTI' : 'BULGU', ap.ok ? 'ok' : `${ap.code} ${ap.msg}`);
  for (const [ad, k, t, a] of [['üye yetkisiz: klan atma (lideri)', B, 'clan.kick', { id: A.pid }], ['üye yetkisiz: devir', B, 'clan.transfer', { id: B.pid }], ['üye yetkisiz: rütbe', B, 'clan.rank', { id: B.pid, rank: 3 }], ['üye yetkisiz: ayar', B, 'clan.settings', { notice: 'x' }], ['üye yetkisiz: sancak', B, 'clan.banner', { a: 1, s: 1, c: 1 }], ['üye yetkisiz: davet', B, 'clan.invite', { id: 999 }]]) { const r = await k.dene(t, a); kay(ad, r.ok ? 'BULGU' : 'GECTI', r.ok ? 'KABUL EDİLDİ' : r.code); }
  const adim = (await imp('clan.js')).CLAN_DONATE.steps; for (const n of [0, -50, 1.5, 1e12, 100, adim[0], adim[0]]) { const a0 = B.S.akce; const r = await B.dene('clan.donate', { n }); kay('bağış ' + n, 'BILGI', r.ok ? `kabul: akçe ${a0}→${B.S.akce}` : `${r.code}`); }
  const lv = await B.dene('clan.leave', {}); kay('üye ayrılır', lv.ok ? 'GECTI' : 'BILGI', lv.ok ? 'ok' : lv.code);
  const rj = await B.dene('clan.join', { id: cid }); kay('ayrıldıktan sonra yeniden katılma (bekleme?)', 'BILGI', rj.ok ? 'hemen katıldı' : rj.code);
}
fs.mkdirSync('kanit', { recursive: true }); fs.writeFileSync('kanit/F025_senaryo_sonuc.json', JSON.stringify({ tohum: 25, not: 'Yerel simülasyon (MemoryStore); gerçek çok oyunculu sunucu değildir.', sonuclar: R }, null, 1));
console.log('\nözet:', R.filter(r => r.sonuc === 'GECTI').length, 'geçti,', R.filter(r => r.sonuc === 'BULGU').length, 'bulgu,', R.filter(r => r.sonuc === 'BILGI').length, 'bilgi');
