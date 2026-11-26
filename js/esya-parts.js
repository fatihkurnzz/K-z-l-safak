// Eşya paketinin küçük görünüm parçaları: kahramanın katsayı tablosu, Eşya Seviyesi etiketi, VS ekranındaki
// "kim kime karşı ne kadar korunuyor" özeti ve drop oranı yazımı. Kural hesaplamaz: shared/ tablolarını okur.
// Yaprak modüldür (ui-* modüllerini içe aktarmaz); stilleri css/esya.css içindedir.
import { WEAPON_CLASS, ELEMENTS, RES_KEYS, STAT_LABEL, COEF, TIERS, CLASS_WC, resKey, fmtPct, fmtRate, oneIn,
  itemBase, itemStats, gradeOf, subsOf, subCount, fmtSub, SUBS, SUB_UP, SLOTS, ARMOR_SLOTS, setsOf, setBonus, SET_PIECES, fmtSetFx, fmtStat, isCoef } from '../shared/items.js';
import { gearItems } from '../shared/hero.js';
import { MOBS, mobClass } from '../shared/zones.js';
import { SKILLS } from '../shared/skills.js';

const NAME = { ...WEAPON_CLASS, ...ELEMENTS };
export const coefName = k => NAME[k] || k;
// Drop oranı yazımı (yüzde ve "kaçta bir") shared/items.js içindedir: sunucu testleri de aynı işlevi sınar
export { fmtRate, oneIn };

// Eşya Seviyesi etiketi (parti ekranı, oyuncu kartı, sıralama). n yoksa (eski kayıt) çizgi gösterilir.
export const ilvTag = (n, label = 'Eşya Sv.') => `<span class="ilv" title="Eşya Seviyesi: kuşanılan eşyaların kademe, nadirlik, artı ve su verme ortalaması">${label} <b>${n == null ? '—' : n}</b></span>`;

// Kahramanın katsayı tablosu (st: heroStats sonucu). Hiç katsayı yoksa ne zaman geleceğini söyler.
export function coefSheet(st) {
  const rows = RES_KEYS.filter(k => st.res[k] > 0).map(k => `<div class="${ELEMENTS[k] ? 'el ' + k : ''}"><small>${STAT_LABEL[resKey(k)]}</small>${fmtPct(st.res[k])}</div>`);
  if (st.pen > 0) rows.push(`<div class="pen"><small>${STAT_LABEL.pen}</small>${fmtPct(st.pen)}</div>`);
  const head = `<p class="cfh"><b>Savunma katsayıları</b> <span class="mut">Saldırı türü: <b>${coefName(st.wt)}</b></span></p>`;
  if (!rows.length) return `${head}<p class="mut cfn">Silah türüne karşı savunma, element direnci ve savunma delme ${TIERS[COEF.minTier].req}. seviye eşyalarından itibaren gelir.</p>`;
  return `${head}<div class="kv cfk">${rows.join('')}</div>`;
}

// ---- VS ekranı ----
// Birimin saldırı türleri: silah sınıfı + yeteneklerindeki elementler (savaş birimi ya da yalnızca { mob } olabilir)
function attackKinds(u) {
  const M = u.mob ? MOBS[u.mob] : null, wt = u.wt || (M ? mobClass(u.mob) : CLASS_WC[u.cls] || null), ids = (u.skills || M?.skills || []).map(s => (typeof s === 'string' ? s : s.id));
  const el = new Set();
  for (const id of ids) for (const f of SKILLS[id]?.fx || []) if (f.el) el.add(f.el);
  return { wt, el: [...el] };
}
const span = vals => { const a = Math.min(...vals), b = Math.max(...vals); return b <= 0 ? '—' : a === b ? fmtPct(a) : `${fmtPct(a)}–${fmtPct(b)}`; };
const byKey = (a, b) => RES_KEYS.indexOf(a) - RES_KEYS.indexOf(b);
const kindsOf = units => { const s = new Set(); for (const u of units) { const a = attackKinds(u); if (a.wt) s.add(a.wt); a.el.forEach(e => s.add(e)); } return [...s].sort(byKey); };
const tone = k => (ELEMENTS[k] ? 'el ' + k : '');
// Hesap: düşmanın saldırı türlerine karşı partinin katsayıları (def), partinin saldırı türlerine karşı düşmanın en yüksek
// direnci (foe), partinin savunma delmesi (pens). Gösterilecek hiçbir katsayı yoksa null.
function vsData(left, waves) {
  if (!waves || !left.length) return null;
  const foes = waves.flat();
  const def = kindsOf(foes).map(k => ({ k, v: left.map(h => h.res?.[k] || 0) }));
  const foe = kindsOf(left).map(k => ({ k, v: Math.max(0, ...foes.map(u => u.res?.[k] || 0)) }));
  const pens = left.map(h => h.pen || 0);
  if (!def.some(d => Math.max(...d.v) > 0) && !foe.some(d => d.v > 0) && Math.max(...pens) <= 0) return null;
  return { foes, def, foe, pens };
}
// VS ekranının ortasındaki kısa özet (en çok MAX çip; tamamı dokununca açılan tabloda). left: oyuncunun birimleri ·
// waves: düşman dalgaları (bilinmiyorsa null). Gösterilecek bir katsayı yoksa boş döner.
const MAX = 3;
export function vsCoefs(left, waves) {
  const D = vsData(left, waves);
  if (!D) return '';
  const chip = (k, txt, t) => `<span class="vc ${tone(k)} ${t}"><i>${coefName(k)}</i>${txt}</span>`, more = n => (n > 0 ? `<span class="vc more">+${n}</span>` : '');
  const def = [...D.def].sort((a, b) => Math.max(...b.v) - Math.max(...a.v)), foe = D.foe.filter(d => d.v > 0).sort((a, b) => b.v - a.v), pen = Math.max(...D.pens) > 0;
  return `<button class="vcoef" data-a="vsCoef" title="Saldırı türleri ve katsayılar">
    <span class="vh"><b>Savunman</b><small>ayrıntı ›</small></span><span class="vr">${def.slice(0, MAX).map(d => chip(d.k, span(d.v), Math.max(...d.v) > 0 ? 'good' : '')).join('')}${more(def.length - MAX)}</span>
    <span class="vh ln"><b>Düşman direnci</b></span><span class="vr">${foe.slice(0, pen ? MAX - 1 : MAX).map(d => chip(d.k, fmtPct(d.v), 'bad')).join('') || '<span class="mut">yok</span>'}${more(foe.length - (pen ? MAX - 1 : MAX))}${pen ? `<span class="vc pen"><i>Delmen</i>${span(D.pens)}</span>` : ''}</span></button>`;
}
// Ayrıntı tablosu (modal): her saldırı türüne karşı her kahramanın katsayısı; her kahramanın saldırı türü, delmesi ve
// o türlere karşı düşmanın direnci. Sayılar savaş motorunun kullandığı birim alanlarından (res, pen, wt) okunur.
export function vsCoefTable(left, waves) {
  const D = vsData(left, waves);
  if (!D) return '<p class="mut">Bu savaşta devreye giren bir katsayı yok.</p>';
  const cell = v => (v > 0 ? `<td class="on">${fmtPct(v)}</td>` : '<td>—</td>'), tag = k => `<span class="vc ${tone(k)}"><i>${coefName(k)}</i></span>`;
  const sum = h => D.def.length ? Math.max(...D.def.filter(d => !ELEMENTS[d.k]).map(d => h.res?.[d.k] || 0), 0) + Math.max(...D.def.filter(d => ELEMENTS[d.k]).map(d => h.res?.[d.k] || 0), 0) : 0;
  return `<p class="sec"><b>Düşmanın saldırıları</b> <span class="mut">senin savunman</span></p>
    <table class="cft"><tr><th>Saldırı türü</th>${left.map(h => `<th>${h.name}</th>`).join('')}</tr>
    ${D.def.map(d => `<tr><th>${tag(d.k)}</th>${d.v.map(cell).join('')}</tr>`).join('')}</table>
    <p class="sec"><b>Senin saldırıların</b> <span class="mut">düşmanın direnci</span></p>
    <table class="cft"><tr><th>Kahraman</th><th>Saldırı türü</th><th>Savunma delme</th><th>Düşman direnci</th></tr>
    ${left.map(h => { const a = attackKinds(h), ks = [a.wt, ...a.el].filter(Boolean), rs = ks.map(k => [k, Math.max(0, ...D.foes.map(u => u.res?.[k] || 0))]).filter(x => x[1] > 0);
      return `<tr><th>${h.name}</th><td class="l">${ks.map(tag).join(' ')}</td>${cell(h.pen || 0)}<td class="l ${rs.length ? 'bad' : ''}">${rs.map(([k, v]) => `${coefName(k)} ${fmtPct(v)}`).join(', ') || '—'}</td></tr>`; }).join('')}</table>
    <p class="mut">Silah türüne karşı savunma ile element direnci toplanır; toplam azaltma en çok ${fmtPct(COEF.resCap)} olur${left.some(h => sum(h) > COEF.resCap) ? ' (bu savaşta sınıra ulaşan kahramanın var)' : ''}. Savunma delme hedefin savunmasının o kadarını yok sayar (en çok ${fmtPct(COEF.penCap)}).</p>`;
}

// ======================= Yan statlar ve set bonusları (eşya kartı, ızgara, parti) =======================
// Yalnızca gösterim: kural shared/items.js (subsOf, setsOf, setBonus) ve shared/hero.js (heroStats) içindedir.
const escH = v => String(v).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const SUB_TIP = 'Yan statlar Nadir eşyada 2, Eşsiz eşyada 3 tanedir; +3, +6 ve +9 artıda biri güçlenir.';
// Yan stat bölümü: başlıklı, her stat bir satır; güçlenenler ▲ ve güçlendiği artıyla; güçlenecekler için ipucu
export function subSection(it, { title = 'Yan Statlar' } = {}) {
  const n = subCount(it), p = it.p || 0;
  if (!n) return `<div class="sbx none"><h4>${title}</h4><p class="mut">Yan stat yok — Nadir ve üstünde çıkar.</p></div>`;
  const sb = subsOf(it), nx = SUB_UP.find(x => p < x);
  if (!sb.length) return `<div class="sbx"><h4>${title} <small>${n}</small></h4><p class="mut">${n} rastgele yan stat (eşya çantaya girince belli olur).</p></div>`;
  const rows = sb.map(x => `<div class="sbr${x.up ? ' upd' : ''}"><b>${SUBS[x.k].name}</b><span>${escH(fmtSub(x).replace(SUBS[x.k].name + ' ', ''))}</span>${x.up ? `<i class="ar" title="${x.at.map(a => `+${a}`).join(', ')} artıda güçlendi">${'▲'.repeat(x.up)}</i><small>${x.at.map(a => `+${a}`).join(' ')}'te güçlendi</small>` : '<small class="mut">—</small>'}</div>`).join('');
  const marks = SUB_UP.map(a => `<span class="${p >= a ? 'dn' : a === nx ? 'nx' : ''}">+${a}${p >= a ? ' ✓' : ''}</span>`).join('');
  return `<div class="sbx"><h4>${title} <small>${sb.length}</small></h4>${rows}<p class="sbh">${nx ? `+${nx}'te bir yan stat güçlenir` : 'Bütün güçlenmeler alındı'}<span class="sbm">${marks}</span></p></div>`;
}
// Bir parçanın seti: { B, cls, t, worn (parça sayısı), hero } — kuşanıldıysa sahibi, değilse en çok parçası olan aynı sınıf kahramanı
function setCtx(S, it, owner, ids) {
  const B = itemBase(it.b); if (B.kind !== 'armor' || !B.set) return null;
  const key = x => { const b = itemBase(x.b); return b.kind === 'armor' && b.set && b.cls[0] === B.cls[0] && b.tier === B.tier; };
  let best = null;
  for (const id of owner ? [owner] : ids) { const w = gearItems(S, id).filter(key); if (!best || w.length > best.w.length) best = { id, w }; }
  return { B, w: best?.w || [], hero: best?.id || null, mine: !!owner };
}
// Set bölümü: "Set: ad (x/5)", 2/4/5 bonusları (etkin yeşil, olmayan soluk), parça yuvaları. owner: eşyayı kuşanan kahraman
export function setSection(S, it, owner, ids = []) {
  const C = setCtx(S, it, owner, ids); if (!C) return '';
  const { B, w } = C, have = w.some(x => x.id === it.id), n = w.length, bn = setBonus(B.cls[0], B.tier);
  const swap = !have && w.some(x => itemBase(x.b).slots.some(sl => B.slots.includes(sl))), n2 = have || swap ? n : n + 1; // aynı setin aynı yuvadaki parçasıyla yer değiştirirse sayı artmaz
  const slots = ARMOR_SLOTS.map(sl => { const x = w.find(y => itemBase(y.b).slots.includes(sl)), me = B.slots.includes(sl); return `<span class="${x ? 'on' : ''}${me ? ' me' : ''}" title="${SLOTS[sl]}${x ? ' (kuşanılı)' : ''}">${SLOTS[sl]}</span>`; }).join('');
  const rows = SET_PIECES.map(x => { const on = n >= x, soon = !on && !have && n2 >= x; return `<div class="str ${on ? 'on' : soon ? 'soon' : ''}"><i>${x}</i><span>${bn[x].map(fmtSetFx).join(' · ')}</span>${on ? '<em>etkin</em>' : soon ? '<em>kuşanırsan</em>' : ''}</div>`; }).join('');
  return `<div class="stx"><h4>Set: ${escH(B.set)} <small>(${n}/5)</small></h4><div class="sts">${slots}</div>${rows}${n2 > n ? `<p class="sbh">Kuşanırsan set ${Math.min(5, n2)}/5 olur.</p>` : ''}</div>`;
}
// Satılamaz (nt) eşyanın küçük kilit rozeti (sağ altta; stili css/v11-pazarbant.css)
const NT_LOCK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 10V7.5a5 5 0 0110 0V10h1.5v11.5h-13V10zm2.2 0h5.6V7.5a2.8 2.8 0 00-5.6 0z"/></svg>';
// Izgara rozetleri: sol altta yan stat noktaları (sayıları kadar), sol üstte set parçası işareti
export function gridBadges(it) {
  const n = subCount(it), B = itemBase(it.b);
  return `${n ? `<i class="ivs" title="${n} yan stat">${'<b></b>'.repeat(n)}</i>` : ''}${B.kind === 'armor' && B.set ? `<i class="ivst" title="Set parçası: ${escH(B.set)}">S</i>` : ''}${it.nt ? `<i class="ivnt" title="Bağlı eşya: pazara konamaz, devredilemez">${NT_LOCK}</i>` : ''}`;
}
// Karşılaştırma: yeni eşya − kuşanılı (ana ve yan statlar dahil; katsayılar hariç); yeşil ▲ / kırmızı ▼
export function cmpLine(nw, cu) {
  if (!cu) return '';
  const a = itemStats(nw), b = itemStats(cu), keys = [...new Set([...Object.keys(a), ...Object.keys(b)])].filter(k => !isCoef(k));
  const out = keys.map(k => [k, (a[k] || 0) - (b[k] || 0)]).filter(([, d]) => Math.abs(d) > 1e-9).map(([k, d]) => `<span class="${d > 0 ? 'up' : 'dn'}">${d > 0 ? '▲' : '▼'} ${STAT_LABEL[k]} ${d > 0 ? '+' : '-'}${fmtStat(k, Math.round(Math.abs(d) * 10000) / 10000)}</span>`);
  const sa = subsOf(nw).map(x => x.k), sb = subsOf(cu).map(x => x.k);
  const nws = sa.filter(k => !sb.includes(k)).map(k => SUBS[k].name);
  return `<div class="cmpl"><b>Kuşanılıya göre:</b> ${out.join('') || '<span class="mut">fark yok</span>'}${nws.length ? `<br><small class="mut">Yeni yan stat: ${nws.join(', ')}</small>` : ''}</div>`;
}
// Kahramanın toplam yan stat katkısı ({ anahtar → değer } toplamı) ve kaç yan statlı parça kuşandığı
export function subTotals(items) {
  const tot = {}; let n = 0;
  for (const it of items) { const sb = subsOf(it); n += sb.length; for (const x of sb) tot[x.k] = (tot[x.k] || 0) + x.v; }
  return { tot, n };
}
export const fmtSubTot = (k, v) => (k === 'spd' ? `${SUBS[k].name} +${Math.round(v)}` : `${SUBS[k].name} +${fmtPct(Math.round(v * 10000) / 10000)}`);
