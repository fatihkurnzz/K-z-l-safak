// "sinif" paketi: uzmanlık yolları (Parti → kahraman → Yetenek → Uzmanlık yolu). Yol seçilmemişse iki yolun yan yana
// karşılaştırması, seçilmişse yolun ağacı (seviye basamakları, açık / kilitli / düzende durumları), yol değiştirme onayı.
// Kural hesaplanmaz: seviyeler, bedel ve yetenek metinleri shared/paths.js ile shared/skills.js tablolarından okunur
// (sunucu aynı tabloları kullanır); seçim 'path.choose', düzen 'loadout.set' ile sunucuya sorulur.
import { S } from './api.js';
import { ACT, esc, fmt, toast, showModal, closeModal, redraw, run, cur } from './ui-core.js';
import { CLASSES, TREES } from '../shared/content.js';
import { SKILLS, describe, pathSkills } from '../shared/skills.js';
import { PATH, PATHS, pathsOf, pathOf, pathFee, specPoints } from '../shared/paths.js';
import { WEAPON_CLASS } from '../shared/items.js';
import { unlockedSkills, LOADOUT_ACTIVES } from '../shared/hero.js';
import { MASTERY } from '../shared/mastery.js';
import { clsOf, mainId } from '../shared/roster.js';
import { svg, ri } from './icons.js';
import { skillIcon } from './skill-icons.js';

// row: karşılaştırmada seçili basamak (iki yolda da aynı sıradaki yetenek açılır) · change: yolunu değiştirmekte olan kahraman
const YV = { row: 0, change: null };
const TRIAL_STEPS = 3; // Usta Sınavı'nın basamak sayısı (modes.js: trial)
const yico = (S2, cls = '') => `<span class="sico ${S2.type === 'passive' ? 'pas' : ''} ${cls}">${skillIcon(S2.id) || svg(S2.type === 'passive' ? 'passive' : S2.anim)}</span>`;
// Yolun simgesi: eski usta yeteneğinin çizimi (yetenek listelerde yok ama tanımı durur); yoksa yolun ilk yeteneği
const sigil = k => SKILLS[`${k}_m`] || pathSkills(k)[0];
const kindOf = S2 => (S2.pm ? 'Usta' : S2.type === 'passive' ? 'Pasif' : 'Aktif');
// Yeteneğin açılma koşulu (tablodan): seviye ya da Usta Sınavı
const needOf = (S2, cls) => (S2.pm ? `Sv. ${MASTERY.unlock} · ${S2.mreq} ustalık puanı` : `${(S2.req ?? S2.plv)} uzmanlık puanı`);
// Satır notu: tür ve koşul (usta yeteneğinde koşulun kendisi türü de söyler)
const noteOf = (S2, cls) => (S2.pm ? needOf(S2, cls) : `${kindOf(S2)} · ${needOf(S2, cls)}`);
const feeText = fee => (fee > 0 ? `${fmt(fee)} akçe` : 'bedelsiz');

// Seçilecek yolu olan kahraman (yetenek sekmesinde işaret, Yetenek görünümünün açılış sekmesi)
export const pathPending = hid => S.lvl >= PATH.level && !pathOf(S.heroes[hid]);
// Kilitli yol yeteneğine dokununca gösterilen neden
export function pathLockNote(hid, S2) {
  const h = S.heroes[hid], mine = pathOf(h);
  if (S.lvl < PATH.level) return `Uzmanlık yolu ${PATH.level}. seviyede seçilir.`;
  if (!mine) return 'Önce bir uzmanlık yolu seç.';
  if (S2.path !== mine) return `Bu yetenek ${PATHS[S2.path].name} yolunun. Kahramanın yolu: ${PATHS[mine].name}.`;
  return S2.pm ? `${MASTERY.unlock}. seviyede, ustalık ağacına ${S2.mreq} puan verince açılır.` : `${TREES[PATHS[mine].tree].name} ağacına ${(S2.req ?? S2.plv)} puan verince açılır (şu an ${specPoints(h)}).`;
}
// Savaş düzenindeki yol pasifi yuvası (ui-party.js düzen satırına ekler)
export function pathSlot(hid) {
  const h = S.heroes[hid], S2 = h.ppas && SKILLS[h.ppas];
  return `<div class="yslot">${S2 ? yico(S2) : `<span class="sico pas" style="opacity:.35">${svg('lock')}</span>`}<span>${S2 ? S2.name : pathOf(h) ? 'Boş yol pasifi' : 'Yol pasifi'}</span></div>`;
}

// ---------- Yol kartı (karşılaştırma) ----------
function card(hid, k, mine, open) {
  const P = PATHS[k], h = S.heroes[hid], list = pathSkills(k), sel = list[Math.min(YV.row, list.length - 1)], cls = P.cls;
  const fee = mine ? pathFee(S.lvl, h) : 0;
  const btn = k === mine ? '<span class="chip up">Şu anki yol</span>'
    : !open ? `<span class="chip">${ri('lock')}Sv. ${PATH.level}</span>`
    : `<button class="btn sm green" data-a="pathPick" data-k="${k}">${mine ? `Bu yola geç · ${feeText(fee)}` : 'Bu yolu seç'}</button>`;
  return `<div class="ycard ${k === mine ? 'mine' : ''}">
    <div class="ych">${yico(sigil(k), 'big')}<div class="grow"><b>${P.name}</b><span class="chip">${P.role}</span><br><span class="mut">${P.desc}</span></div></div>
    <div class="chips yuses"><span class="chip yw">${ri('gear')}${WEAPON_CLASS[P.weapon]} silahı</span>${P.uses.map(u => `<span class="chip">${u}</span>`).join('')}</div>
    <div class="yrows">${list.map((s, i) => `<button class="yrow ${i === YV.row ? 'on' : ''} ${s.type === 'passive' ? 'pas' : ''}" data-a="pathRow" data-i="${i}">${yico(s)}<span><b>${s.name}</b><small>${noteOf(s, cls)}</small></span></button>`).join('')}</div>
    <div class="ydet"><b>${sel.name}</b> <span class="mut">${noteOf(sel, cls)}</span><br>${describe(sel)}</div>
    <div class="yfoot">${btn}</div></div>`;
}
function compare(hid) {
  const cls = clsOf(S, hid), h = S.heroes[hid], mine = pathOf(h), open = S.lvl >= PATH.level, fee = mine ? pathFee(S.lvl, h) : 0;
  const head = mine ? `<b>Yol değiştir</b> <span class="mut">Bu değişiklik: <b>${feeText(fee)}</b>. Öbür uzmanlığın ağacına verdiğin puanlar geri döner; eşyaların yerinde kalır.</span>`
    : open ? `<b>Uzmanlık yolunu seç</b> <span class="mut">İlk seçim bedelsizdir; sonradan değiştirilebilir.</span>`
    : `<b>Uzmanlık yolu ${PATH.level}. seviyede seçilir</b> <span class="mut">${CLASSES[cls].name} sınıfının iki yolu aşağıda; şimdiden inceleyebilirsin.</span>`;
  return `<div class="yhead cmp"><div class="grow">${head}<br><span class="mut">Bir basamağa dokun: iki yolun o basamaktaki yeteneği yan yana açılır.</span></div>${mine ? '<button class="btn sm" data-a="pathBack">Vazgeç</button>' : ''}</div>
    <div class="ycmp">${pathsOf(cls).map(k => card(hid, k, mine, open)).join('')}</div>`;
}

// ---------- Yol ağacı ----------
function tree(hid, k) {
  const P = PATHS[k], h = S.heroes[hid], cls = P.cls, open = unlockedSkills(S, hid), list = pathSkills(k), fee = pathFee(S.lvl, h);
  const node = S2 => {
    const ok = open.includes(S2.id), on = h.act.includes(S2.id) || h.ppas === S2.id;
    return `<div class="ystep ${ok ? 'ok' : 'lock'} ${on ? 'on' : ''} ${S2.type === 'passive' ? 'pas' : ''} ${S2.pm ? 'pm' : ''}"><span class="ylv">${S2.pm ? 'Usta' : `${(S2.req ?? S2.plv)} puan`}</span>
      <button class="node ${ok ? '' : 'lock'} ${on ? 'on' : ''}" data-a="skill" data-id="${S2.id}">${yico(S2)}<span><b>${S2.name}</b>${describe(S2)}</span><small>${on ? 'Düzende' : ok ? 'Açık' : `${ri('lock')}${needOf(S2, cls)}`}</small></button></div>`;
  };
  const act = list.filter(s => s.type === 'active'), pas = list.filter(s => s.type === 'passive'), nOpen = list.filter(s => open.includes(s.id)).length;
  return `<div class="yhead">${yico(sigil(k), 'big')}<div class="grow"><b>${P.name}</b><span class="chip">${P.role}</span><span class="chip cnt">${nOpen}/${list.length} açık</span><span class="chip">${TREES[P.tree].name} ağacı: ${specPoints(h)} puan</span><br><span class="mut">${P.desc}</span>
      <div class="chips yuses"><span class="chip yw">${ri('gear')}${WEAPON_CLASS[P.weapon]} silahı</span>${P.uses.map(u => `<span class="chip">${u}</span>`).join('')}</div></div>
      <button class="btn sm" data-a="pathChange">Yol değiştir<small>${feeText(fee)}</small></button></div>
    <div class="ywrap"><div class="ytree"><div class="ycol"><h4>Aktif yetenekler <span>düzende ${LOADOUT_ACTIVES} aktif yuva</span></h4>${act.map(node).join('')}</div>
      <div class="ycol"><h4>Pasifler <span>açılınca hep etkin</span></h4>${pas.map(node).join('')}</div></div></div>`;
}

// Yetenek görünümünün "Uzmanlık yolu" bölümü
export function pathPanel(hid) {
  const mine = pathOf(S.heroes[hid]);
  if (YV.change && YV.change !== hid) YV.change = null;
  return mine && YV.change !== hid ? tree(hid, mine) : compare(hid);
}

ACT.pathRow = d => { YV.row = +d.i || 0; redraw(); };
ACT.pathChange = () => { YV.change = mainId(S); redraw(); };
ACT.pathBack = () => { YV.change = null; redraw(); };
// Seçim / değişiklik onayı: bedel ve sonraki değişikliğin bedeli aynı işlevden (pathFee) gösterilir
ACT.pathPick = d => {
  const hid = mainId(S), h = S.heroes[hid], P = PATHS[d.k], mine = pathOf(h);
  if (!P || P.cls !== clsOf(S, hid)) return;
  const fee = mine ? pathFee(S.lvl, h) : 0, next = pathFee(S.lvl, { pn: (h.pn || 0) + 1 }), poor = S.akce < fee;
  const name = esc(h.name || CLASSES[P.cls].name);
  showModal(`<h2>${mine ? 'Yol değiştir' : 'Yol seç'}</h2><div class="in ypick">
    <div class="ypk">${mine ? `<span class="ypp">${yico(sigil(mine), 'big')}<b>${PATHS[mine].name}</b></span><i>→</i>` : ''}<span class="ypp to">${yico(sigil(d.k), 'big')}<b>${P.name}</b></span></div>
    <p><b>${name}</b> ${mine ? `${PATHS[mine].name} yolundan ${P.name} yoluna geçecek.` : `${P.name} yoluna girecek.`}</p>
    <div class="kv ykv"><div><small>Bedel</small>${fee > 0 ? `${ri('akce')}${fmt(fee)} akçe` : 'Bedelsiz'}</div><div><small>Akçen</small>${ri('akce')}${fmt(S.akce)}</div><div><small>Sonraki değişiklik</small>${next > 0 ? `${fmt(next)} akçe` : 'Bedelsiz'}</div></div>
    <p class="mut">${mine ? `${PATHS[mine].name} yetenekleri düzenden çıkar ve kapanır; ${P.name} yeteneklerinden seviyesi gelenler açılır.` : 'Yolun yetenekleri seviyeyle açılır.'} Yetenek ağaçların, nitelik puanların ve eşyaların aynen kalır.</p>
    ${poor ? '<p class="bad">Yeterli akçen yok.</p>' : ''}
    <div class="mbtns"><button class="btn green" data-a="pathGo" data-k="${d.k}" ${poor ? 'disabled' : ''}>${mine ? `Yolu değiştir (${feeText(fee)})` : 'Yolu seç'}</button><button class="btn" data-a="closeModal">Vazgeç</button></div></div>`, 'ybox');
};
ACT.pathGo = async d => {
  const hid = mainId(S);
  if (!hid) return;
  closeModal();
  const r = await run('path.choose', { hero: hid, path: d.k });
  if (!r) return;
  YV.change = null;
  toast(r.fee > 0 ? `${r.name} yoluna geçildi (−${fmt(r.fee)} akçe).` : `${r.name} yolu seçildi.`);
  redraw();
};
