// Kristal Nöbeti (19 Kas; 2. sürüm): iki ırkın, 15 dakika boyunca dalga dalga gelen yaratıklara karşı Sönmüş Mabet'in
// ortasındaki Kül Kristali'ni savunduğu ortak PvE etkinliği. Türün "tapınak savunması" mekaniği; ad, yer ve yaratıklar özgündür.
//  - Saat yok (kullanıcı, şimdilik): nöbet her 20 dakikada bir başlar; kayıt başlangıçtan 5 dk önce açılır. Seviye grupları:
//    Sv. 46–59 ve Sv. 60+ (ayrı nöbetler). Giriş NPC'si Yemin Pazarı'nda Şaman Yashka. Ücret 100.000 akçe.
//  - Kayıtlı oyuncu geri sayım ve nöbet boyunca başka savaşa/etkinliğe giremez (modes.js startBattle).
//  - Partiler: nöbet başlarken katılımcılar KENDİ IRKLARIYLA otomatik partilere ayrılır; her partide bir Rahip (Şaman/Şifacı)
//    olur (rahip sayısı kadar parti; rahip yoksa rahipsiz parti; parti en çok 8 kişi).
//  - Pay: 55 dalganın her partiye düşen hedefi %10'dur; partiye dağıtılmamış pay (10'dan az parti) ve DÜŞEN partilerin
//    bitiremediği dalgalar, ayakta kalan partilere EŞİT paylaştırılır. Parti, üyeleri toplam 3 savaş kaybedince düşer.
//  - 5. ve 10. dakikada Kristal Muhafızı (kesilince herkese saldırı/savunma +%15). Bütün paylar bitince ya da 12. dakikadan
//    sonra Lav Yürek gelir (alan ateşi). Kazanmak için ayakta kalan bütün partilerin payı bitmeli ve Lav Yürek kesilmeli.
//  - Ödül (başarıda, ayakta kalan partilerin üyelerine): parti hasarı sıralamasında üst yarı Mavi, alt yarı Yeşil Sandık.
// Paylaşılan belge: nobet/<br>:<start> = { br, start, reg:{pid:{nm,f,lvl,cls}}, by:{pid:{d,w,lost}}, buffs, boss, end }
import { FACTIONS, CLASS_KEYS } from './content.js';
import { rng } from './rng.js';
import { botName } from './bots.js';
import { fail, grantAll } from './util.js';
import { clsOf, mainId } from './roster.js';
import { heroUnit } from './hero.js';

const MIN = 60000, HOUR = 3600000;
export const NOBET = {
  name: 'Kristal Nöbeti', place: 'Sönmüş Mabet', crystal: 'Kül Kristali', npc: 'Şaman Yashka',
  fee: 100000, regMin: 5, runMin: 15, every: 20, waves: 55,
  brackets: { low: { name: 'Sv. 46–59', min: 46, max: 59 }, high: { name: 'Sv. 60+', min: 60, max: 999 } },
  share: 0.10,                // her partinin hedefi: toplam dalganın %10'u
  partyMax: 8, partyFail: 3,  // parti en çok 8 kişi; üyeleri toplam 3 savaş kaybedince parti düşer
  buffAt: [5, 10], buff: 0.15,
  bossAt: 12, boss: 'lavyurek', guard: 'kristalbekci',
  bots: 18,                   // yerel/deneme kipinde iki ırktan yapay katılımcı
  chests: {
    blue: { name: 'Mavi Sandık', give: [{ t: 'akce', n: 60000 }, { t: 'yakut', n: 40 }, { t: 'stone', g: 2, n: 2 }, { t: 'ember', n: 3 }, { t: 'seal', n: 1 }] },
    green: { name: 'Yeşil Sandık', give: [{ t: 'akce', n: 30000 }, { t: 'yakut', n: 15 }, { t: 'stone', g: 1, n: 3 }, { t: 'ember', n: 1 }] },
  },
};
export const brOf = lvl => (lvl >= NOBET.brackets.high.min ? 'high' : lvl >= NOBET.brackets.low.min ? 'low' : null);
const PER = NOBET.every * MIN, REG = NOBET.regMin * MIN, RUN = NOBET.runMin * MIN;
export const slotAt = (br, start, now) => ({ br, start, key: `${br}:${start}`, regAt: start - REG, end: start + RUN, phase: now < start - REG ? 'wait' : now < start ? 'reg' : now < start + RUN ? 'run' : 'done' });
// Geçerli (ya da sıradaki) nöbet: başlangıçlar her 20 dakikanın başıdır
export function slotOf(br, now) {
  if (!br) return null;
  const k = Math.floor(now / PER) * PER, start = now < k + RUN ? k : k + PER;
  return slotAt(br, start, now);
}
export const minuteOf = (start, now) => Math.max(0, (now - start) / MIN);
export const nobetLocked = (p, now) => !!p.nobet && !p.nobet.left && !p.nobet.over && now >= p.nobet.start - REG && now < p.nobet.start + RUN;
export const newDoc = (br, start) => ({ br, start, reg: {}, by: {}, pw: {}, pl: {}, buffs: 0, boss: 0, end: 0 });

// ---- katılımcılar ve partiler ----
// Yapay katılımcılar (yerel/deneme kipi): kimlik, ad, ırk, sınıf ve hız nöbetin anahtarından türer (her ırkta 2–3 rahip)
function botsOf(doc) {
  const r = rng(Math.floor(doc.start / MIN) * 13 + (doc.br === 'high' ? 7 : 3)), f = Object.keys(FACTIONS), lv = NOBET.brackets[doc.br], others = CLASS_KEYS.filter(c => c !== 'priest');
  return Array.from({ length: NOBET.bots }, (_, i) => ({ id: `bot:${9100 + i}`, nm: botName(r), f: f[i % 2], cls: [2, 3, 8, 13, 14].includes(i) ? 'priest' : others[Math.floor(r() * others.length)],
    lvl: Math.min(65, lv.min + Math.floor(r() * (Math.min(65, lv.max) - lv.min + 1))), sp: 0.6 + r() * 0.6, bot: 1 }));
}
export function people(doc, bots) {
  return [...Object.entries(doc.reg).map(([id, x]) => ({ id, nm: x.nm, f: x.f, cls: x.cls || 'warrior', lvl: x.lvl })), ...(bots ? botsOf(doc) : [])];
}
// Irk ırk otomatik parti: her rahip bir parti açar, öbürleri sırayla dağılır; parti 8'i aşarsa rahipsiz yeni parti açılır
export function partiesOf(doc, bots) {
  const out = [];
  for (const f of Object.keys(FACTIONS)) {
    const L = people(doc, bots).filter(x => x.f === f).sort((a, b) => String(a.id).localeCompare(String(b.id)));
    if (!L.length) continue;
    const pr = L.filter(x => x.cls === 'priest'), rest = L.filter(x => x.cls !== 'priest');
    const P = (pr.length ? pr : [null]).map(x => ({ f, members: x ? [x] : [] }));
    let i = 0;
    for (const x of rest) {
      let g = P[i % P.length];
      if (g.members.length >= NOBET.partyMax) g = P.find(q => q.members.length < NOBET.partyMax) || (P.push({ f, members: [] }), P.at(-1));
      g.members.push(x); i++;
    }
    out.push(...P.filter(g => g.members.length));
  }
  return out.map((g, i) => ({ ...g, id: i, name: `${i + 1}. Parti` }));
}

// ---- durum: partilerin payı, ilerlemesi, düşenlerin payının paylaştırılması ----
// Yapay üyelerin ilerlemesi zamandan gelir. Deneme kipinde yalnız yapaylardan oluşan son parti 8. dakikada düşer: paylaştırma görünsün.
// Deneme kipinde yapay üyeler: yalnız yapaylardan oluşan parti payını kendi hızıyla 11–14. dakikada bitirir; gerçek oyuncunun
// partisindeki yapaylar payın yarısını taşır (öbür yarısı oyuncunun). Yalnız yapaylardan oluşan son parti 8. dakikada düşer.
const botFrac = (m, sp) => Math.min(1, m * sp / 12.5);
export function stateOf(doc, now, bots) {
  const m = minuteOf(doc.start, now), P = partiesOf(doc, bots), total = NOBET.waves - 1; // son dalga Lav Yürek
  const base = total * NOBET.share, allBot = P.filter(g => g.members.every(x => x.bot)), doomed = bots && allBot.length > 1 ? allBot.at(-1).id : -1;
  for (const g of P) {
    g.lost = 0; g.hw = 0; g.dmg = 0; g.allBot = g.members.every(x => x.bot);
    g.sp = g.members.filter(x => x.bot).reduce((a, x) => a + x.sp, 0) / Math.max(1, g.members.filter(x => x.bot).length) || 1;
    for (const x of g.members) if (!x.bot) { const B = doc.by[x.id] || {}; x.w = B.w || 0; x.d = B.d || 0; }
    g.hw = doc.pw?.[g.id] || 0; g.lost = doc.pl?.[g.id] || 0; // partinin dalgası ve kaybı (ortak savaş ya da tek savaş, parti adına)
    if (g.id === doomed && m >= 8) g.lost = Math.max(g.lost, NOBET.partyFail);
    g.failed = g.lost >= NOBET.partyFail;
  }
  const botPart = (g, q, mm) => (g.allBot ? 1 : g.members.some(x => x.bot) ? 0.5 : 0) * q * botFrac(mm, g.sp);
  // düşen partiler: düştükleri ana kadar yaptıkları sayılır (yapay parti 8. dakikada)
  for (const g of P.filter(x => x.failed)) { g.quota = base; g.done = Math.min(base, g.hw + botPart(g, base, g.allBot ? 8 : m)); }
  // paylar: her partiye %10; dağıtılmamış pay ve düşenlerin bitiremediği dalgalar ayaktakilere eşit
  const alive = P.filter(g => !g.failed), n = Math.max(1, alive.length);
  const extra = (Math.max(0, total - base * P.length) + P.filter(g => g.failed).reduce((a, g) => a + (base - g.done), 0)) / n;
  for (const g of alive) { g.quota = base + extra; g.done = Math.min(g.quota, g.hw + botPart(g, g.quota, m)); }
  for (const g of P) {
    if (g.failed) g.quota = g.done; // düşenin bitiremediği kısım ayaktakilere geçti
    g.pct = g.quota ? Math.min(100, Math.floor(100 * g.done / g.quota + 1e-6)) : 0; g.ok = !g.failed && g.done >= g.quota - 1e-6;
    for (const x of g.members) if (x.bot) { x.w = botPart(g, g.quota, g.failed ? 8 : m) / Math.max(1, g.members.filter(y => y.bot).length); x.d = Math.round(x.w * 3 * 2600 * (doc.br === 'high' ? 1.5 : 1)); }
    g.dmg = g.members.reduce((a, x) => a + (x.d || 0), 0);
  }
  const waves = Math.min(total, Math.floor(P.reduce((a, g) => a + g.done, 0) + 1e-6)) + (doc.boss ? 1 : 0);
  const buffs = Math.max(doc.buffs, bots ? NOBET.buffAt.filter(t => m >= t + 0.75).length : 0);
  const quotasDone = alive.length > 0 && alive.every(g => g.ok);
  const won = !!doc.boss && quotasDone, lost = !won && (alive.length === 0 || now >= doc.start + RUN);
  return { m, P, waves, buffs, quotasDone, bossReady: quotasDone || m >= NOBET.bossAt, won, lost, over: won || lost };
}
export const partyOf = (S, pid) => S.P.find(g => g.members.some(x => x.id === String(pid))) || null;
export function view(doc, now, pid, bots, slot) {
  const S = stateOf(doc, now, bots), my = partyOf(S, pid);
  const regN = Object.keys(doc.reg).length + (bots ? Math.round(NOBET.bots * Math.min(1, Math.max(0.3, 1 - (slot.start - now) / REG))) : 0);
  const r1 = x => Math.round(x * 10) / 10;
  const pv = g => ({ id: g.id, name: g.name, f: g.f, n: g.members.length, quota: r1(g.quota), done: r1(g.done), pct: g.pct, failed: g.failed, ok: g.ok, lost: g.lost, dmg: g.dmg,
    members: g.members.map(x => ({ name: x.nm, cls: x.cls, lvl: x.lvl, dmg: x.d, me: x.id === String(pid) || undefined })) });
  return { ...slot, minute: S.m, waves: S.waves, of: NOBET.waves, buffs: S.buffs, boss: !!doc.boss, bossReady: S.bossReady, won: S.won, lost: S.lost, over: S.over,
    joined: !!doc.reg[String(pid)], regN, parties: slot.phase === 'wait' || slot.phase === 'reg' ? [] : S.P.map(pv), mine: my ? my.id : null, failAt: NOBET.partyFail };
}
// Ödül: nöbet kazanılmış, partisi ayakta ve en az bir savaş kazanmış üyeye; parti hasarına göre üst yarı Mavi, alt yarı Yeşil
export function chestFor(doc, now, pid, bots) {
  const S = stateOf(doc, now, bots), g = partyOf(S, pid), me = doc.by[String(pid)];
  if (!S.over) return { why: 'Nöbet sürüyor.' };
  if (!S.won) return { why: 'Nöbet başarısız oldu.' };
  if (!g || g.failed) return { why: 'Partin nöbette düştü: sandık ayakta kalan partilere verilir.' };
  if (!me || !(me.w > 0)) return { why: 'Ödül için nöbette en az bir savaş kazanmalısın.' };
  const L = S.P.filter(x => !x.failed).sort((a, b) => b.dmg - a.dmg), i = L.indexOf(g);
  return { chest: i < Math.ceil(L.length / 2) ? 'blue' : 'green', rank: i + 1, of: L.length };
}

// Bir savaşın sonucunu nöbete yazar: dalga ve kayıp PARTİNİN hanesine (bir kez), hasar katılan oyunculara eşit
// R: { w, d, lost, guard, boss } · pids: savaşı oynayan gerçek oyuncular
export function credit(d, ctx, partyId, pids, R) {
  d.pw ||= {}; d.pl ||= {};
  if (partyId != null) { d.pw[partyId] = (d.pw[partyId] || 0) + R.w; if (R.lost) d.pl[partyId] = (d.pl[partyId] || 0) + 1; }
  for (const k of pids) { const me = d.by[k] || (d.by[k] = { d: 0, w: 0, lost: 0 }); me.d += Math.round(R.d / pids.length); me.w += R.w; if (R.lost) me.lost++; }
  if (R.guard) d.buffs = Math.min(NOBET.buffAt.length, stateOf(d, ctx.now, ctx.bots).buffs + 1);
  if (R.boss) d.boss = 1;
}
// ---------- Dünya işlemleri (world.js'e eklenir) ----------
export const getNobet = async (ctx, slot) => { const r = await ctx.store.get('nobet', slot.key); return r ? { doc: r.doc, ver: r.ver } : { doc: newDoc(slot.br, slot.start), ver: null }; };
export function nobetWorld({ put }) {
  const get = async (ctx, slot) => { const r = await ctx.store.get('nobet', slot.key); return r ? { doc: r.doc, ver: r.ver } : { doc: newDoc(slot.br, slot.start), ver: null }; };
  const mySlot = (p, now) => { const N = p.nobet; if (N && !N.left && now < N.start + RUN + 6 * HOUR) return slotAt(N.br, N.start, now); return slotOf(brOf(p.lvl), now); };
  async function after(ctx, p, action, result) {
    if (action?.type !== 'battle.finish' || result?.mode !== 'nobet' || !result.nobet || !p.nobet) return;
    const R = result.nobet, G = await get(ctx, { key: p.nobet.key, br: p.nobet.br, start: p.nobet.start }), d = G.doc;
    if (d.end) return;
    const g0 = partyOf(stateOf(d, ctx.now, ctx.bots), ctx.pid);
    credit(d, ctx, g0?.id, [String(ctx.pid)], R);
    const S = stateOf(d, ctx.now, ctx.bots), g = partyOf(S, ctx.pid);
    if (S.won || S.lost) d.end = ctx.now;
    put(ctx, 'nobet', p.nobet.key, d, G.ver);
    p.nobet.buffs = S.buffs; p.nobet.over = S.over || g?.failed ? 1 : 0; p.nobet.boss = S.bossReady ? 1 : 0;
    Object.assign(R, { total: S.waves, buffs: S.buffs, won: S.won, lost: S.lost, party: g ? { name: g.name, pct: g.pct, failed: g.failed, lost: g.lost, quota: Math.round(g.quota * 10) / 10, done: Math.round(g.done * 10) / 10 } : null });
  }
  const HANDLERS = {
    async 'nobet.view'(ctx, p) {
      const slot = mySlot(p, ctx.now); if (!slot) return { br: null, min: NOBET.brackets.low.min };
      const G = await get(ctx, slot), V = view(G.doc, ctx.now, ctx.pid, ctx.bots, slot);
      return { ...V, fee: NOBET.fee, got: p.nobet?.key === slot.key ? !!p.nobet.got : false, left: p.nobet?.key === slot.key ? !!p.nobet.left : false, chest: V.over && V.joined ? chestFor(G.doc, ctx.now, ctx.pid, ctx.bots) : null };
    },
    // Savaş kurulumu için güncel durum (Lav Yürek hazır mı, güçlendirme): kayda yazılır, savaşı başlatmadan önce çağrılır
    async 'nobet.sync'(ctx, p) {
      if (!p.nobet) fail('not-joined', 'Kayıtlı değilsin.');
      const G = await get(ctx, { key: p.nobet.key, br: p.nobet.br, start: p.nobet.start }), S = stateOf(G.doc, ctx.now, ctx.bots), g = partyOf(S, ctx.pid);
      p.nobet.boss = S.bossReady ? 1 : 0; p.nobet.buffs = S.buffs; p.nobet.over = S.over || g?.failed ? 1 : 0;
      return { boss: !!p.nobet.boss, over: !!p.nobet.over, failed: !!g?.failed };
    },
    async 'nobet.join'(ctx, p) {
      const br = brOf(p.lvl); if (!br) fail('locked', `${NOBET.name} ${NOBET.brackets.low.min}. seviyede açılır.`);
      const slot = slotOf(br, ctx.now);
      if (slot.phase !== 'reg') fail('closed', 'Kayıt, nöbetten 5 dakika önce açılır.');
      const G = await get(ctx, slot), k = String(ctx.pid);
      if (G.doc.reg[k]) fail('joined', 'Bu nöbete zaten kayıtlısın.');
      if (p.akce < NOBET.fee) fail('no-akce', `Kayıt için ${NOBET.fee.toLocaleString('tr-TR')} akçe gerekir.`);
      p.akce -= NOBET.fee;
      G.doc.reg[k] = { nm: p.name, f: p.faction, lvl: p.lvl, cls: clsOf(p, mainId(p)) || 'warrior', u: heroUnit(p, mainId(p)) }; // u: ortak savaşta yokken yapay zekânın oynadığı kopyası // parti dağıtımı sınıfa bakar (her partide bir rahip)
      put(ctx, 'nobet', slot.key, G.doc, G.ver);
      p.nobet = { key: slot.key, br, start: slot.start, buffs: 0 };
      return { ok: 1, start: slot.start };
    },
    async 'nobet.leave'(ctx, p) { if (!p.nobet) fail('not-joined', 'Kayıtlı değilsin.'); p.nobet.left = 1; return { ok: 1 }; },
    async 'nobet.claim'(ctx, p) {
      if (!p.nobet) fail('not-joined', 'Bu nöbete katılmadın.');
      if (p.nobet.got) fail('claimed', 'Sandığını aldın.');
      const G = await get(ctx, { key: p.nobet.key }), C = chestFor(G.doc, ctx.now, ctx.pid, ctx.bots);
      if (!C.chest) fail('no-chest', C.why);
      p.nobet.got = 1;
      return { chest: C.chest, name: NOBET.chests[C.chest].name, rank: C.rank, of: C.of, loot: grantAll(p, NOBET.chests[C.chest].give) };
    },
  };
  return { HANDLERS, after, READ_ONLY: ['nobet.view'] };
}
