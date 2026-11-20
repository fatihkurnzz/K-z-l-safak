// Savaş raporu: sonuç ekranındaki çubuklu özet, tur tur kayıt ve profil → Savaş Raporları penceresi
// (son savaşlar + meydanda savunmana yapılan saldırılar). Rapor sunucudan gelir (battle.finish → report,
// report.list / report.get); bu modül yalnızca gösterir. Metin shared/report.js'te üretilir.
import { S, now } from './api.js';
import { ACT, modal, esc, fmt, run, showModal, closeModal, openWin, redraw, cur, heroImg, mobImg, DEF_W, loading, toast, resTile } from './ui-core.js';
import { ri } from './icons.js';
import { UPKEEP, upkeepOf, upkeepCost, taxRates, saleTax, saleNet, listFee } from '../shared/sinks.js';
import { describe, sideStats, REPORT_KEEP, DEF_KEEP, REPORT_DAYS, F_CRIT } from '../shared/report.js';
import { SKILLS } from '../shared/skills.js';
import { CLASSES, FACTIONS } from '../shared/content.js';
import { MOBS } from '../shared/zones.js';

const face = u => (u.c && CLASSES[u.c] ? heroImg(u.c, false, 'sm', u.f || S.faction, DEF_W[u.c], null) : MOBS[u.m] ? mobImg(u.m, false, 'sm') : '<span class="pt sm"></span>');
const bar = (k, v, max) => `<div class="rbar ${k}"><i style="width:${v > 0 ? Math.max(3, Math.round(100 * v / max)) : 0}%"></i><span>${fmt(v)}</span></div>`;
const LEGEND = '<div class="rleg"><span class="d">Verilen hasar</span><span class="t">Alınan hasar</span><span class="h">İyileştirme</span></div>';
// Bir tarafın satırları. Yaratıklar ada göre toplanır (12 ayrı yaratık yerine "Kor Bekçisi ×11"); kahramanlar tek tek yazılır.
function rows(rep, side, view) {
  const st = sideStats(rep, side, view);
  let list = st.rows;
  if (list.some(u => !u.c) && list.length > 5) {
    const g = new Map();
    for (const u of list) { const r = g.get(u.n) || g.set(u.n, { ...u, name: u.n, cnt: 0, d: 0, t: 0, h: 0, k: 0, x: 1 }).get(u.n); r.cnt++; r.d += u.d; r.t += u.t; r.h += u.h; r.k += u.k; r.x = r.x && u.x ? 1 : 0; }
    list = [...g.values()].sort((a, b) => b.d - a.d);
  }
  const max = k => Math.max(1, ...list.map(r => r[k]));
  const m = { d: max('d'), t: max('t'), h: max('h') };
  return list.map(u => `<div class="rrow ${u.x ? 'rdead' : ''}">${face(u)}<div class="rnm"><b>${esc(u.name)}${u.cnt > 1 ? ` ×${u.cnt}` : ''}</b><small>${u.x ? 'Düştü' : `Sv. ${u.l}`}${u.k ? ` · ${u.k} öldürme` : ''}</small></div><div class="rbars">${bar('d', u.d, m.d)}${bar('t', u.t, m.t)}${bar('h', u.h, m.h)}</div></div>`).join('');
}
const totals = (rep, side) => { const s = sideStats(rep, side).sum; return `Toplam: <b>${fmt(s.d)}</b> hasar verildi · <b>${fmt(s.t)}</b> alındı · <b>${fmt(s.h)}</b> iyileştirme`; };
function logHtml(rep, view) {
  return describe(rep, view).map(l => l.k === 'wave' || l.k === 'end' ? `<div class="rl rhd ${l.k === 'end' ? (l.win ? 'rwon' : 'rend') : ''}">${esc(l.x)}</div>`
    : `<div class="rl ${l.s === view ? 'rla' : 'rlb'}${l.crit ? ' rcrit' : ''}${l.kill ? ' rkill' : ''}${l.heal ? ' rheal' : ''}">${esc(l.x)}</div>`).join('');
}

// Savaş dökümü (19 Kas, kullanıcı: "tur tur kayıt yerine savaş dökümü"): kayıttan tarafın özet sayıları, kullanılan
// yetenekler (kaç kez, toplam hasar) ve en büyük vuruş çıkarılır; tur tur kayıt yalnız katlanır "Ayrıntılı kayıt" olarak kalır.
function digest(rep, view) {
  const side = Object.fromEntries(rep.units.map(u => [u.id, u.s])), sk = new Map();
  let crit = 0, hits = 0, best = null, waves = 0;
  for (const e of rep.log) {
    if (e[0] === 'w') waves = Math.max(waves, e[2] || 1);
    if (e[0] !== 's' || side[e[2]] !== view) continue;
    const r = sk.get(e[3]) || sk.set(e[3], { n: 0, d: 0, h: 0 }).get(e[3]); r.n++;
    for (const f of e[4] || []) {
      if (f[0] === 'd' && side[f[1]] !== view) { hits++; r.d += f[2]; if (f[4] & F_CRIT) crit++; if (!best || f[2] > best.v) best = { v: f[2], id: e[3] }; }
      if (f[0] === 'h') r.h += f[2];
    }
  }
  const sum = sideStats(rep, view, view).sum, kills = rep.units.filter(u => u.s === view).reduce((a, u) => a + (u.k || 0), 0);
  const nm = id => SKILLS[id]?.name || id;
  const tiles = [['Süre', `${rep.turns} tur${waves > 1 ? ` · ${waves} dalga` : ''}`], ['Verilen hasar', fmt(sum.d)], ['Alınan hasar', fmt(sum.t)], ['İyileştirme', fmt(sum.h)],
    ['Kritik vuruş', `${crit}${hits ? ` / ${hits}` : ''}`], ['Öldürme', fmt(kills)], ...(best ? [['En büyük vuruş', `${fmt(best.v)} · ${esc(nm(best.id))}`]] : [])];
  const used = [...sk.entries()].sort((a, b) => b[1].d + b[1].h - a[1].d - a[1].h);
  return `<div class="dk-tiles">${tiles.map(([k, v]) => `<div class="dk-t"><small>${k}</small><b>${v}</b></div>`).join('')}</div>
    ${used.length ? `<h4 class="dk-h">Kullanılan yetenekler</h4><div class="dk-sk">${used.map(([id, r]) => `<span class="dk-c"><b>${esc(nm(id))}</b> ×${r.n}${r.d ? ` · ${fmt(r.d)} hasar` : ''}${r.h ? ` · ${fmt(r.h)} şifa` : ''}</span>`).join('')}</div>` : ''}`;
}
const dokum = (rep, view) => `${digest(rep, view)}${LEGEND}<div class="rcols"><div><h4>${view === 'B' ? 'Savunman' : 'Sen'}</h4>${rows(rep, view, view)}</div><div><h4>${view === 'B' ? 'Saldıran' : 'Düşman'}</h4>${rows(rep, view === 'A' ? 'B' : 'A', view)}</div></div>
  <details class="dk-log"><summary>Ayrıntılı kayıt (tur tur)</summary><div class="rlog inwin">${logHtml(rep, view)}</div></details>`;

// ---------- Sonuç ekranı ----------
let LAST = null, PREV = null;
// showResult (ui-battle.js) çağırır: partinin çubuklu özeti ve kayıt düğmesi (sonuç kutusunun sağ sütunu)
export function reportAside(r) {
  const rep = r?.report;
  if (!rep?.units?.length) { LAST = null; return ''; }
  LAST = { rep, view: 'A', title: r.title || '' };
  return `<aside class="rside"><h4>Savaş Raporu <span class="mut">· ${rep.turns} tur</span></h4>${LEGEND}${rows(rep, 'A', 'A')}<p class="mut rtot">${totals(rep, 'A')}</p></aside>`;
}
// 20 Kas (Aşama 4): sonuç ekranındaki tek satır savaş özeti (bizim taraf): hasar · şifa · alınan · tur
export const reportStrip = r => { const rep = r?.report; if (!rep?.units?.length) return ''; const s = sideStats(rep, 'A').sum; return `<div class="rz-strip"><b>Savaş dökümü</b><span>Hasar <i>${fmt(s.d)}</i></span><span>Şifa <i>${fmt(s.h)}</i></span><span>Alınan hasar <i>${fmt(s.t)}</i></span><span>Tur <i>${rep.turns}</i></span></div>`; };
// Sonuç kutusunun düğme sırasına eklenen kayıt düğmesi
export const reportBtn = r => (r?.report?.units?.length ? '<button class="btn" data-a="repLog">Savaş dökümü</button>' : '');
export const reportClass = r => (r?.report?.units?.length ? ' rbox' : '');
ACT.repLog = () => {
  if (!LAST) return;
  PREV = { html: modal.innerHTML };
  showModal(`<h2>Savaş Dökümü</h2><div class="in dokum"><p class="mut">${esc(LAST.title)}</p>${dokum(LAST.rep, LAST.view)}<div class="mbtns"><button class="btn" data-a="repBack">Geri</button></div></div>`, 'rbox');
};
ACT.repBack = () => { if (PREV) { modal.innerHTML = PREV.html; PREV = null; } };

// ---------- Savaş Raporları penceresi (profil ve bildirimden açılır) ----------
const RV = { doc: null, sub: 'mine' };
const ago = at => { const m = Math.max(0, Math.floor((now() - at) / 60000)); return m < 1 ? 'az önce' : m < 60 ? `${m} dk önce` : m < 1440 ? `${Math.floor(m / 60)} sa önce` : `${Math.floor(m / 1440)} gün önce`; };
// Eski giriş noktası (profil, bildirim): Posta penceresinin Raporlar sekmesine açılır
ACT.reports = d => ACT.mail({ tab: 'rep', sub: d?.tab === 'def' ? 'def' : 'mine' });
ACT.repOpen = async d => { const r = await run('report.get', { id: d.id }); if (r) { RV.doc = r; redraw(); const pg = document.querySelector('#page'); if (pg) pg.scrollTop = 0; } };
ACT.repList = () => { RV.doc = null; redraw(); };
ACT.repSub = d => { RV.sub = d.k === 'def' ? 'def' : 'mine'; RV.doc = null; redraw(); };
export const repReset = (sub, fresh) => { RV.doc = null; if (sub) RV.sub = sub; else if (fresh) RV.sub = 'mine'; };
// Okunmamış: son bakıştan (p.rseen) sonra yazılmış raporlar
export const unreadReports = (rep, seen) => (rep ? [...rep.mine, ...rep.def].filter(x => x.at > (seen || 0)).length : 0);
// Raporlar sekmesi açılınca bir kez "görüldü" işaretlenir; satırlardaki "Yeni" etiketi önceki bakışa göre çizilir
let SEEN_MARK = null;
export function repSeen(D) {
  if (SEEN_MARK !== D && unreadReports(D.rep, D.rseen)) { SEEN_MARK = D; run('mail.seen'); }
}
export function reportsTab(D) {
  if (RV.doc) return renderDetail(RV.doc);
  const tab = RV.sub, list = tab === 'def' ? D.rep.def : D.rep.mine;
  const sub = `<div class="sub"><button data-a="repSub" data-k="mine" class="${tab === 'mine' ? 'on' : ''}">Savaşlarım</button><button data-a="repSub" data-k="def" class="${tab === 'def' ? 'on' : ''}">Savunmalar</button></div>`;
  const head = tab === 'def'
    ? `<div class="hint">Meydanda savunmana yapılan son ${DEF_KEEP} saldırı. Savunmanı yapay zekâ oynar; kayıt, saldıranın doğrulanmış hamlelerinden tutulur. Kayıtlar ${REPORT_DAYS} gün saklanır.</div>`
    : `<div class="hint">Oynadığın son ${REPORT_KEEP} savaşın raporu (seri savaşlar raporlanmaz). Meydan savaşlarının raporu da buraya düşer. Kayıtlar ${REPORT_DAYS} gün saklanır.</div>`;
  if (!list.length) return sub + head + `<p class="mut" style="text-align:center;padding:16px">${tab === 'def' ? 'Henüz kimse savunmana saldırmadı.' : 'Henüz kayıtlı bir savaşın yok.'}</p>`;
  return sub + head + list.map(x => {
    const good = tab === 'def' ? !x.win : x.win, res = tab === 'def' ? (x.win ? 'Savunman düştü' : 'Savunman tuttu') : x.mode === 'clanboss' ? 'Av bitti' : x.win ? 'Zafer' : 'Yenilgi';
    const name = tab === 'def' ? `<b style="color:${FACTIONS[x.faction]?.color || 'inherit'}">${esc(x.by)}</b> saldırdı${x.mode === 'live' ? ' <span class="chip">Canlı Meydan</span>' : ''}` : `<b>${esc(x.title)}</b>`;
    return `<div class="row rrep"><div class="grow">${name}${x.at > (D.rseen || 0) ? ' <span class="chip up">Yeni</span>' : ''}<br><span class="mut"><b class="${good ? 'up' : 'down'}">${res}</b> · ${x.turns} tur · ${ago(x.at)}</span></div><button class="btn" data-a="repOpen" data-id="${esc(x.id)}">Raporu aç</button></div>`;
  }).join('');
}
function renderDetail(x) {
  const view = x.kind === 'd' ? 'B' : 'A', other = view === 'A' ? 'B' : 'A', rep = x.rep;
  const title = x.kind === 'd' ? `${esc(x.by)} savunmana saldırdı` : esc(x.title);
  return `<div class="sub"><button data-a="repList">‹ Liste</button><b>${title}</b><span class="sp"></span><span class="mut">${rep.turns} tur · ${ago(x.at)}</span></div>
    <div class="dokum">${dokum(rep, view)}</div>`;
}

// ---------- Akçe giderleri (shared/sinks.js): Örs → Bakım sayfası ve pazarın dilimli satış vergisi ----------
// Sayılar sinks.js'in sunucuda da çalışan işlevlerinden okunur; burada yalnızca yazıya dökülür.
const pc = v => '%' + String(Math.round(v * 1000) / 10).replace('.', ',');
export const taxText = faction => { const R = taxRates(faction); return `satış vergisi ${pc(R[0].rate)}${R.slice(1).map(b => `, ${fmt(b.from)} akçenin üstündeki kısım için ${pc(b.rate)}`).join('')}`; };
export const netLine = (price, faction) => (Number.isInteger(price) && price > 0 ? `İlan ücreti ${fmt(listFee(price))} akçe · satılırsa vergi ${fmt(saleTax(price, faction))} akçe · eline geçecek: <b>${fmt(saleNet(price, faction))} akçe</b>` : 'Geçerli bir fiyat gir.');
// Fiyat kutusu değiştikçe "eline geçecek" satırı yenilenir
document.addEventListener('input', e => { if (e.target?.id !== 'mprice') return; const el = document.getElementById('mnet'); if (el) el.innerHTML = netLine(/^\d{1,10}$/.test(e.target.value.trim()) ? +e.target.value.trim() : NaN, S.faction); });
const leftText = ms => { const m = Math.max(1, Math.ceil(ms / 60000)); return m >= 60 ? `${Math.floor(m / 60)} sa ${m % 60} dk` : `${m} dk`; };
export function bakimPage() {
  const cur = upkeepOf(S, now());
  return `<div class="hint"><b>Bakım:</b> Örs ustası takımını elden geçirir; ${UPKEEP.hours} saat boyunca savaşlarda <b>eşya düşme oranı</b> artar. Eşyalar yıpranmaz: bakım yaptırmamak hiçbir şeyi kötüleştirmez. Bedel seviyene göredir (şu an ${S.lvl}).</div>
    ${cur ? `<div class="row bk-on">${resTile('gear')}<div class="grow"><b>${cur.name} sürüyor</b> <span class="chip up">Eşya düşme +%${cur.drop}</span><br><span class="mut">Kalan süre: ${leftText(cur.until - now())}. Daha üstün bir bakım alırsan süre baştan başlar.</span></div></div>` : ''}
    ${UPKEEP.tiers.map((T, i) => { const cost = upkeepCost(i, S.lvl), on = cur && cur.i === i, low = cur && cur.i > i; return `<div class="row">${resTile('anvil')}<div class="grow"><b>${T.name}</b> <span class="chip up">Eşya düşme +%${T.drop}</span> <span class="chip">${UPKEEP.hours} saat</span><br><span class="mut">${T.note} Bedel: ${ri('akce')} ${fmt(cost)} akçe (seviye başına ${T.per}).</span></div>
      <button class="btn sm${on || low ? '' : ' red'}" data-a="bakimBuy" data-tier="${T.id}" ${on || low || S.akce < cost ? 'disabled' : ''}>${on ? 'Sürüyor' : low ? 'Üstü sürüyor' : 'Yaptır'}</button></div>`; }).join('')}`;
}
ACT.bakimBuy = async d => { const r = await run('upkeep.buy', { tier: d.tier }); if (r) { toast(`${UPKEEP.tiers.find(t => t.id === r.tier).name} yapıldı: ${UPKEEP.hours} saat eşya düşme +%${r.drop}.`); redraw(); } };
