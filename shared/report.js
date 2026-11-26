// Savaş raporu: savaş motorunun olay akışından (battle.js: events) birim başına toplamları ve tur tur kaydı üretir.
// İstemcinin oynattığı olaylarla sunucunun tekrar ederken ürettiği olaylar aynıdır (aynı tohum + aynı hamleler); rapor
// sunucuda, hamle listesi doğrulanırken tutulur ve savaş sonucuyla birlikte döner. Saf JS'tir, istemciye sunulur:
// kayıt dilden bağımsız, küçük dizilerle saklanır; metni (describe) gösterirken bu modül üretir.
import { SKILLS } from './skills.js';
import { STATUS } from './content.js';

export const REPORT_V = 1;
export const REPORT_KEEP = 5;  // oyuncunun saklanan son savaş sayısı (profil → Savaş Raporları)
export const DEF_KEEP = 8;     // savunmana yapılan saldırılardan saklanan son kayıt sayısı (Meydan)
export const REPORT_DAYS = 7;  // bundan eski rapor listede gösterilmez ve ilk yazmada silinir

// Hasar bayrakları (kayıttaki 'd' satırının son alanı)
// (uzmanlık yolları, battle.js sürüm 2) F_DET: süren hasarın patlatılması · F_GUARD: himaye edenin üstlendiği pay · F_COMBO: fırsat vuruşu
export const F_CRIT = 1, F_KILL = 2, F_WEAK = 4, F_CUT = 8, F_DET = 16, F_GUARD = 32, F_COMBO = 64;
const DOT = { burn: 1, poison: 1, regen: 1, bleed: 1 };
// Ahır yoldaşı satırı: 's' satırında yetenek yerine PET + yoldaş adı durur (ör. 'pet:Kurt'); gösterimde '[Kurt]' olur.
export const PET = 'pet:';
/** Kayıttaki hamle kimliği yoldaş hamlesi mi? @param {string} id @returns {boolean} */
export const isPet = id => typeof id === 'string' && id.startsWith(PET);
/** Hamle adı: yoldaş için '[Ad]', yetenek için SKILLS adı. @param {string} id @returns {string} */
export const moveName = id => (isPet(id) ? `[${id.slice(PET.length)}]` : SKILLS[id]?.name || 'Hamle');
// Yoldaş etkisi ('y' satırı) metni; v yüzde
const PET_FX = { atkUp: v => `saldırı +%${v}`, atkDown: v => `saldırı −%${v}` };

// Olay toplayıcı. feed(battle, events): motorun advance() çağrısından dönen olaylar sırayla verilir.
// Birim satırı: { id, s: taraf, n: ad, c: sınıf | m: yaratık, f: taraf rengi, l: seviye, w: dalga,
//                 d: verilen hasar, t: alınan hasar, h: yaptığı iyileştirme, a: kalkanının emdiği, k: öldürdüğü, x: öldü mü,
//                 pd / ph: d / h içindeki Ahır yoldaşı payı (yalnız yoldaş bir şey yaptıysa vardır) }
// Sayılar ekranda uçan sayılarla aynıdır (kalkandan sonra kalan hasar); yanık ve zehir onu bulaştırana, yenilenme onu verene yazılır.
// Kayıt satırları:
//   ['w', dalga, toplam, yenilendi]                      yeni dalga / raunt
//   ['t', tur, birim, [[etki, miktar, öldü]], atlanan etki | 0, öfke | 0]   tur başı (yalnızca bir şey olduysa)
//   ['s', tur, birim, yetenek, [etkiler]]                hamle; etkiler:
//        ['d', hedef, hasar, emilen, bayrak] · ['h', hedef, can] · ['b', hedef, etki] · ['r', hedef, etki] (direndi)
//        ['c', hedef] (arındı) · ['v', hedef, can] (dirildi) · ['p', hedef, metin] (boss evresi) · ['m', hedef, oran] (sıra)
//        ['x', hedef, sayı] (güçlendirmesi söküldü) · ['g', hedef, etki] (Sakınma savuşturdu) · ['y', hedef, etki, yüzde] (yoldaş etkisi)
//        yoldaş hamlesi de 's' satırıdır: birim sahibidir, yetenek yerine PET + yoldaş adı
//        patlatma ve himaye payı da 'd' satırıdır (bayrak F_DET / F_GUARD; himayede hedef, payı üstlenen birimdir)
//   ['e', kazanan, tur]
export function recorder() {
  const units = new Map(), src = new Map(), petDot = new Set(), log = [];
  let turn = 0, winner = null;
  const reg = u => {
    if (!u || units.has(u.id)) return;
    units.set(u.id, { id: u.id, s: u.side, n: String(u.name).slice(0, 40), ...(u.cls ? { c: u.cls, f: u.faction || null } : { m: u.mob }), l: u.lvl, w: Math.max(0, u.wave), d: 0, t: 0, h: 0, a: 0, k: 0, x: 0 });
  };
  const U = id => units.get(id) || { d: 0, t: 0, h: 0, a: 0, k: 0, x: 0 };
  return {
    feed(b, events) {
      for (const u of b.units) reg(u);
      for (const ev of events) {
        if (ev.t === 'wave') {
          log.push(['w', ev.n, ev.of, ev.restore ? 1 : 0]);
          if (ev.restore) for (const r of units.values()) if (r.s === 'A') r.x = 0;
        } else if (ev.t === 'turn') {
          turn++;
          const ticks = [];
          for (const tk of ev.ticks) {
            const me = U(ev.u), by = src.get(ev.u + ':' + tk.s);
            if (tk.s === 'regen') { (by !== undefined ? U(by) : me).h += tk.amt; }
            else {
              me.t += tk.amt;
              if (by !== undefined) { const B = U(by); B.d += tk.amt; if (petDot.has(ev.u + ':' + tk.s)) B.pd = (B.pd || 0) + tk.amt; if (tk.killed) B.k++; }
              if (tk.killed) me.x = 1;
            }
            ticks.push([tk.s, tk.amt, tk.killed ? 1 : 0]);
          }
          if (ticks.length || ev.skip || ev.enrage) log.push(['t', turn, ev.u, ticks, ev.skip || 0, ev.enrage || 0]);
        } else if (ev.t === 'skill' || ev.t === 'pet') {
          // Ahır yoldaşı hamlesi ('pet' olayı) aynı biçimdedir: sayılar SAHİBİNE yazılır, ayrıca sahibin pd (yoldaş hasarı)
          // ve ph (yoldaş iyileştirmesi) alt toplamları tutulur (yalnız yoldaş bir şey yaptıysa alan eklenir; eski kayıtlar değişmez).
          const fx = [], A = U(ev.u), pet = ev.t === 'pet';
          const pd = n => { if (pet && n) A.pd = (A.pd || 0) + n; };
          for (const f of ev.fx) {
            const T = U(f.u);
            if (f.k === 'pet') { fx.push(['y', f.u, f.s, f.v]); continue; } // yoldaş etkisi (atkUp / atkDown, yüzde)
            if (f.k === 'dmg') {
              const n = f.amt - f.abs;
              A.d += n; T.t += n; T.a += f.abs; pd(n);
              if (f.killed) { A.k++; T.x = 1; }
              fx.push(['d', f.u, n, f.abs, (f.crit ? F_CRIT : 0) | (f.killed ? F_KILL : 0) | (f.weak ? F_WEAK : 0) | (f.cut ? F_CUT : 0) | (f.combo ? F_COMBO : 0)]);
            } else if (f.k === 'det') { // patlatılan süren hasar: patlatana yazılır (kalkan emmez)
              A.d += f.amt; T.t += f.amt; pd(f.amt);
              if (f.killed) { A.k++; T.x = 1; }
              for (const st of f.s) src.delete(f.u + ':' + st);
              fx.push(['d', f.u, f.amt, 0, F_DET | (f.killed ? F_KILL : 0)]);
            } else if (f.k === 'guard') { // himaye: payı üstlenen birim hasarı alır (kalkanı emer), hasar vurana yazılır
              const n = f.amt - f.abs;
              A.d += n; T.t += n; T.a += f.abs; pd(n);
              if (f.killed) { A.k++; T.x = 1; }
              fx.push(['d', f.u, n, f.abs, F_GUARD | (f.killed ? F_KILL : 0)]);
            } else if (f.k === 'strip') { fx.push(['x', f.u, f.s.length]);
            } else if (f.k === 'ward') { fx.push(['g', f.u, f.s]);
            } else if (f.k === 'heal') { A.h += f.amt; if (pet) A.ph = (A.ph || 0) + f.amt; fx.push(['h', f.u, f.amt]); }
            else if (f.k === 'st') {
              if (DOT[f.s]) { const key = f.u + ':' + f.s; src.set(key, ev.u); if (pet) petDot.add(key); else petDot.delete(key); }
              fx.push(['b', f.u, f.s]);
            }
            else if (f.k === 'resist') fx.push(['r', f.u, f.s]);
            else if (f.k === 'cleanse') fx.push(['c', f.u]);
            else if (f.k === 'revive') { T.x = 0; fx.push(['v', f.u, f.hp]); }
            else if (f.k === 'phase') fx.push(['p', f.u, String(f.text).slice(0, 80)]);
            else if (f.k === 'tm') fx.push(['m', f.u, f.v]);
          }
          log.push(['s', turn, ev.u, pet ? PET + String(ev.name).slice(0, 40) : ev.skill, fx]);
        } else if (ev.t === 'end') { winner = ev.winner; log.push(['e', ev.winner, turn]); }
      }
    },
    done() { return { v: REPORT_V, turns: turn, winner, units: [...units.values()], log }; },
  };
}

// ---------- Gösterim ----------
// Aynı adı taşıyan birimler numaralanır; iki tarafta da aynı ad varsa (oyuncuya karşı modlar) karşı taraf önek alır.
// view: raporu okuyanın tarafı ('A' saldıran / savaşı oynayan · 'B' savunan)
export function unitNames(rep, view = 'A') {
  const out = {}, groups = new Map(), sideNames = { A: new Set(), B: new Set() };
  for (const u of rep.units) { sideNames[u.s]?.add(u.n); const k = `${u.s}|${u.w}|${u.n}`; (groups.get(k) || groups.set(k, []).get(k)).push(u); }
  const other = view === 'A' ? 'B' : 'A', prefix = view === 'A' ? 'Rakip ' : 'Saldıran ';
  for (const g of groups.values()) g.forEach((u, i) => {
    const clash = u.s === other && sideNames[view].has(u.n);
    out[u.id] = (clash ? prefix : '') + u.n + (g.length > 1 ? ` ${i + 1}` : '');
  });
  return out;
}
const sName = moveName;
const stName = s => (Object.hasOwn(STATUS, s) ? STATUS[s].name : s);
const num = n => Math.round(n).toLocaleString('tr-TR');

// Bir hamlenin etkilerini hedef başına toplar (çok vuruşlu yetenekte hedefe tek parça yazılır)
function byTarget(fx) {
  const m = new Map();
  for (const f of fx) {
    const t = m.get(f[1]) || m.set(f[1], { id: f[1], dmg: 0, hits: 0, abs: 0, flags: 0, heal: 0, healed: false, st: [], res: [], cleanse: false, revive: 0, phase: null, tm: 0, det: 0, guard: 0, gabs: 0, guarded: false, strip: 0, ward: [], pet: [] }).get(f[1]);
    if (f[0] === 'd' && f[4] & F_DET) { t.det += f[2]; t.flags |= f[4] & F_KILL; }
    else if (f[0] === 'd' && f[4] & F_GUARD) { t.guard += f[2]; t.gabs += f[3]; t.guarded = true; t.flags |= f[4] & F_KILL; }
    else if (f[0] === 'x') t.strip += f[2];
    else if (f[0] === 'y') t.pet.push(PET_FX[f[2]] ? PET_FX[f[2]](f[3]) : f[2]);
    else if (f[0] === 'g') { if (!t.ward.includes(f[2])) t.ward.push(f[2]); }
    else if (f[0] === 'd') { t.dmg += f[2]; t.hits++; t.abs += f[3]; t.flags |= f[4]; }
    else if (f[0] === 'h') { t.heal += f[2]; t.healed = true; }
    else if (f[0] === 'b') { if (!t.st.includes(f[2])) t.st.push(f[2]); }
    else if (f[0] === 'r') { if (!t.res.includes(f[2])) t.res.push(f[2]); }
    else if (f[0] === 'c') t.cleanse = true;
    else if (f[0] === 'v') t.revive = f[2];
    else if (f[0] === 'p') t.phase = f[2];
    else if (f[0] === 'm') t.tm += f[2];
  }
  return [...m.values()];
}
// Tur tur kayıt. Satır: { n: tur (0 = başlık satırı), s: hamleyi yapanın tarafı, k: 'wave' | 'tick' | 'skill' | 'end',
//                        x: metin, crit, kill, heal: satırın vurgusu }
export function describe(rep, view = 'A') {
  const names = unitNames(rep, view), side = Object.fromEntries(rep.units.map(u => [u.id, u.s])), N = id => names[id] || '?';
  const lines = [];
  for (const e of rep.log) {
    if (e[0] === 'w') {
      lines.push({ n: 0, s: '', k: 'wave', x: e[3] ? `Raunt ${e[1] + 1}/${e[2]} · parti yenilendi` : e[1] ? `Dalga ${e[1] + 1}/${e[2]} · yeni düşmanlar` : e[2] > 1 ? `Savaş başladı · Dalga 1/${e[2]}` : 'Savaş başladı' });
    } else if (e[0] === 't') {
      const parts = e[3].map(([s, amt]) => (s === 'regen' ? `${stName(s)} +${num(amt)} can` : `${stName(s)} ${num(amt)} hasar`));
      const dead = e[3].some(t => t[2]);
      if (dead) parts.push('öldü');
      if (e[5]) parts.push(`öfkelendi ×${e[5]}`);
      if (e[4]) parts.push(`sırasını kaybetti (${stName(e[4])})`);
      lines.push({ n: e[1], s: side[e[2]] || '', k: 'tick', x: `Tur ${e[1]}: ${N(e[2])} · ${parts.join(', ')}`, kill: dead, heal: !dead && e[3].length > 0 && e[3].every(t => t[0] === 'regen') });
    } else if (e[0] === 's') {
      const T = byTarget(e[4]), parts = [], me = e[2];
      const partyHeal = T.filter(t => t.healed && !t.dmg).length >= 2;
      let crit = false, kill = false, dmg = false;
      if (partyHeal) parts.push(`partiyi ${num(T.reduce((a, t) => a + (t.dmg ? 0 : t.heal), 0))} iyileştirdi`);
      for (const t of T) {
        const p = [], self = t.id === me;
        if (t.hits) {
          dmg = true;
          const full = t.dmg === 0 && t.abs > 0;
          p.push(full ? `kalkan ${num(t.abs)} hasarı emdi` : `${num(t.dmg)} hasar${t.hits > 1 ? ` (${t.hits} vuruş)` : ''}${t.flags & F_CRIT ? ' (kritik)' : ''}${t.flags & F_WEAK ? ' (zayıf nokta)' : ''}${t.flags & F_CUT ? ' (direnç)' : ''}${t.flags & F_COMBO ? ' (fırsat)' : ''}${t.abs ? `, kalkan ${num(t.abs)} emdi` : ''}`);
          if (t.flags & F_CRIT && !full) crit = true;
        }
        if (t.det) { dmg = true; p.push(`süren hasarı patlattı: ${num(t.det)} hasar`); }
        if (t.guarded) { dmg = true; p.push(`${num(t.guard)} hasarı üstlendi${t.gabs ? ` (kalkan ${num(t.gabs)} emdi)` : ''}`); }
        if (t.flags & F_KILL) { p.push('öldü'); kill = true; }
        if (t.strip) p.push(`${t.strip} güçlendirmesi söküldü`);
        if (t.ward.length) p.push(`savuşturdu (${t.ward.map(stName).join(', ')})`);
        if (t.healed && !(partyHeal && !t.dmg)) p.push(`+${num(t.heal)} can`);
        if (t.revive) p.push(`dirildi (${num(t.revive)} can)`);
        if (t.st.length) p.push(t.st.map(stName).join(', '));
        if (t.res.length) p.push(`direndi (${t.res.map(stName).join(', ')})`);
        if (t.cleanse) p.push('arındı');
        if (t.tm) p.push(t.tm > 0 ? 'sırası öne alındı' : 'sırası geriye itildi');
        if (t.pet.length) p.push(t.pet.join(', '));
        if (t.phase) p.push(`öfkelendi: “${t.phase}”`);
        if (p.length) parts.push(`${self ? 'kendisi' : N(t.id)}: ${p.join(', ')}`);
      }
      const head = isPet(e[3]) ? `Tur ${e[1]}: ${N(me)} · ${sName(e[3])}` : `Tur ${e[1]}: ${N(me)} (${sName(e[3])})`;
      lines.push({ n: e[1], s: side[me] || '', k: 'skill', ...(isPet(e[3]) ? { pet: 1 } : {}), x: parts.length ? `${head} → ${parts.join('; ')}` : `${head} → etkisiz`, crit, kill, heal: !dmg && T.some(t => t.healed || t.revive) });
    } else if (e[0] === 'e') {
      const won = e[1] === view;
      lines.push({ n: 0, s: '', k: 'end', x: `${view === 'B' ? (won ? 'Savunman tuttu' : 'Savunman düştü') : won ? 'Zafer' : 'Savaş bitti'} · ${e[2]} tur`, win: won });
    }
  }
  return lines;
}
// Çubuklu özet: bir tarafın birimleri ve o taraftaki en büyük değerler (çubuk genişliği için)
export function sideStats(rep, side = 'A', view = 'A') {
  const names = unitNames(rep, view), rows = rep.units.filter(u => u.s === side).map(u => ({ ...u, name: names[u.id] }));
  const max = k => Math.max(1, ...rows.map(r => r[k]));
  const add = k => rows.reduce((a, r) => a + (r[k] || 0), 0);
  return { rows, max: { d: max('d'), t: max('t'), h: max('h') }, sum: { d: add('d'), t: add('t'), h: add('h'), pd: add('pd'), ph: add('ph') } };
}
