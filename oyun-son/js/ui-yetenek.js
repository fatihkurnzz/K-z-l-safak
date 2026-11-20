// Yetenek ağacı ekranı (19 Kas gece, kullanıcının referansı). Veri ve kurallar değişmez: her sınıfın üç ağacı
// (content.js TREES; Savaşçı Hücum/Siper/Öfke, Suikastçı Hançer/Yay/İz, Şifacı Şifa/Rün Mührü/Kara Rün, Büyücü Ateş/Buz/Yıldırım),
// ağaca verilen puan yeteneği açar (skills.js req). Düğümler açılış puanına göre sıralı ve birbirine bağlı (yılan dizilimi).
// Puan yalnız uzmanlık ağacına ve ortak ağaca verilir (paths.js specTrees); öbür uzmanlığın ağacı kilitli görünür.
// Solda dört sınıf: kendi sınıfın düzenlenir, öbürleri yalnız önizlenir. Sağda seçili yeteneğin bilgisi.
import { S } from './api.js';
import { ACT, esc, redraw } from './ui-core.js';
import { ri, svg } from './icons.js';
import { skillIcon } from './skill-icons.js';
import { CLASSES, TREE_MAX, SKILL_POINTS_FROM_LEVEL } from '../shared/content.js';
import { SKILLS, describe, treeSkills, classSkills, BASIC, mpBase } from '../shared/skills.js';
import { skillPointsFree, unlockedSkills, LOADOUT_ACTIVES, treeOf } from '../shared/hero.js';
import { mpCost } from '../shared/mana.js';
import { clsOf } from '../shared/roster.js';
import { PATH, PATHS, pathOf, pathsOf, specTrees } from '../shared/paths.js';

export const YV = { cls: null, sel: null };
const COLS = 3, CLS_ICON = { warrior: 'atk', rogue: 'crit', priest: 'hp', mage: 'mag' };
const TGT = { enemy: 'Tek düşman', enemies: 'Bütün düşmanlar', self: 'Kendisi', ally: 'Tek müttefik', allies: 'Bütün müttefikler', random: 'Rastgele düşmanlar' };
const ico = S2 => `<span class="yt-ic ${S2.type === 'passive' ? 'pas' : ''}">${skillIcon(S2.id) || svg(S2.type === 'passive' ? 'passive' : S2.anim)}</span>`;

// Düğüm konumu: COLS sütunlu yılan dizilimi (1. satır soldan sağa, 2. satır sağdan sola …); yüzde olarak
function pos(i, rows) { const r = Math.floor(i / COLS), c0 = i % COLS, c = r % 2 ? COLS - 1 - c0 : c0; return [(c + 0.5) * 100 / COLS, (r + 0.5) * 100 / rows]; }

function treeCol(t, ctx) {
  const list = treeSkills(t.key), rows = Math.ceil(list.length / COLS), pts = ctx.own ? (ctx.h.tree[t.key] || 0) : 0;
  const ok = ctx.trees.includes(t.key), own = pathsOf(ctx.cls).find(k => PATHS[k].tree === t.key);
  const P = list.map((_, i) => pos(i, rows));
  const lines = list.slice(1).map((s2, i) => { const a = P[i], b = P[i + 1], lit = ctx.own && ctx.open.includes(s2.id); return `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" class="${lit ? 'lit' : ''}"/>`; }).join('');
  const nodes = list.map((s2, i) => {
    const on = ctx.own && ctx.open.includes(s2.id), inL = ctx.own && ctx.h.act.includes(s2.id);
    return `<button class="yt-n ${on ? 'on' : 'lock'} ${inL ? 'eq' : ''} ${YV.sel === s2.id ? 'sel' : ''} ${s2.type === 'passive' ? 'pas' : ''}" style="left:${P[i][0]}%;top:${P[i][1]}%" data-a="ytSel" data-id="${s2.id}" title="${esc(s2.name)}">${ico(s2)}${on ? '' : `<i class="yt-lk">${svg('lock')}</i>`}<em>${s2.req}</em></button>`;
  }).join('');
  const can = ctx.own && ok && ctx.free > 0 && pts < TREE_MAX;
  const head = `<div class="yt-th"><span class="yt-ti">${skillIcon(list[0]?.id) || ri('skills')}</span><b>${esc(t.name)}</b><small>${ctx.own ? `${pts}/${TREE_MAX}` : ''}</small></div>`;
  const add = ctx.own ? `<div class="yt-add">${[1, 5].map(n => `<button data-a="tp" data-t="${t.key}" data-n="${n}" ${can && ctx.free >= n ? '' : 'disabled'}>+${n}</button>`).join('')}</div>` : '';
  const lock = !ok && ctx.own ? `<div class="yt-shut">${ri('lock')}<span>${own ? `Yalnız ${esc(PATHS[own].role)} uzmanlığında` : `${PATH.level}. seviyede`}</span></div>` : '';
  return `<div class="yt-tree ${ok || !ctx.own ? '' : 'shut'}" data-t="${t.key}">${head}<div class="yt-map" style="--rows:${rows}"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${lines}</svg>${nodes}${lock}</div>${add}</div>`;
}

function detail(ctx) {
  const S2 = SKILLS[YV.sel];
  if (!S2) return '<div class="yt-det"><p class="mut">Bir yeteneğe dokun: bilgisi burada açılır.</p></div>';
  const on = ctx.own && ctx.open.includes(S2.id), inL = ctx.own && ctx.h.act.includes(S2.id), T = S2.tree ? treeOf(ctx.cls).find(t => t.key === S2.tree) : null;
  const pts = ctx.own && S2.tree ? (ctx.h.tree[S2.tree] || 0) : 0, mp = S2.type === 'active' ? mpCost(mpBase(S2), S.lvl) : 0;
  const need = S2.tree ? `${T ? esc(T.name) + ' ağacına' : 'Ağaca'} ${S2.req} puan${ctx.own ? ` (şu an ${pts})` : ''}` : S2.lvl ? `${S2.lvl}. seviye` : S2.mreq != null ? `Ustalık puanı ${S2.mreq}` : '—';
  const rows = [['Tür', S2.type === 'passive' ? 'Pasif' : S2.type === 'basic' ? 'Temel saldırı' : 'Aktif'], ...(S2.target && S2.type !== 'passive' ? [['Hedef', TGT[S2.target] || S2.target]] : []), ...(mp ? [['Mana Bedeli', mp]] : []), ...(S2.cd ? [['Bekleme Süresi', `${S2.cd} tur`]] : []), ['Açılış', need]];
  const btn = !ctx.own ? '<p class="mut yt-prev">Önizleme: bu sınıfın yetenekleri.</p>'
    : S2.type === 'passive' ? `<p class="mut">${on ? 'Açık pasifler her zaman etkindir; düzene alınmaz.' : 'Açılınca kendiliğinden etkin olur.'}</p>`
    : on ? `<button class="yt-btn ${inL ? '' : 'go'}" data-a="skill" data-id="${S2.id}">${inL ? 'Düzenden çıkar' : 'Savaş düzenine ekle'}</button>` : `<div class="yt-req">${ri('lock')} Kilitli · ${need}</div>`;
  return `<div class="yt-det"><div class="yt-dh">${ico(S2)}<div><b>${esc(S2.name)}</b><small>${on ? (inL ? 'Düzende' : 'Açık') : ctx.own ? 'Kilitli' : ''}</small></div></div>
    <p class="yt-desc">${esc(describe(S2))}</p><h5>Bilgiler</h5><div class="yt-kv">${rows.map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`).join('')}</div>${btn}</div>`;
}

export function ytView(hid) {
  const myCls = clsOf(S, hid), cls = YV.cls && CLASSES[YV.cls] ? YV.cls : myCls, own = cls === myCls, h = S.heroes[hid];
  const ctx = { cls, own, h, open: own ? unlockedSkills(S, hid) : [], free: own ? skillPointsFree(S, hid) : 0, trees: own ? specTrees(cls, S.lvl >= PATH.level ? pathOf(h) : null) : treeOf(cls).map(t => t.key) };
  if (!SKILLS[YV.sel] || (SKILLS[YV.sel].cls && SKILLS[YV.sel].cls !== cls)) YV.sel = (own && h.act[0]) || treeSkills(treeOf(cls)[0].key)[0]?.id || null;
  const left = `<div class="yt-left">${Object.keys(CLASSES).map(k => `<button class="yt-cls ${k === cls ? 'on' : ''}" data-a="ytCls" data-id="${k}"><span>${ri(CLS_ICON[k] || 'atk')}</span><b>${esc(CLASSES[k].name)}<small>${k === myCls ? `Sv. ${S.lvl}` : 'Önizleme'}</small></b></button>`).join('')}
    <h5>Temel yetenekler</h5><div class="yt-base">${classSkills(cls).filter(s => s.lvl && !s.hidden).map(s => { const on = own && ctx.open.includes(s.id); return `<button class="yt-b ${on ? 'on' : 'lock'} ${YV.sel === s.id ? 'sel' : ''}" data-a="ytSel" data-id="${s.id}" title="${esc(s.name)} · Sv. ${s.lvl}">${ico(s)}<em>${s.lvl}</em></button>`; }).join('')}</div></div>`;
  const slot = id => { const s = SKILLS[id]; return `<span class="yt-ls ${s ? '' : 'nil'}" title="${s ? esc(s.name) : 'Boş'}">${s ? ico(s) : ''}</span>`; };
  const bar = own ? `<div class="yt-bar"><span class="yt-pts">${ri('star')}Yetenek Puanı: <b class="${ctx.free ? 'on' : ''}">${ctx.free}</b></span>
      <span class="yt-load"><small>Savaş düzeni</small>${slot(BASIC[cls])}${Array.from({ length: LOADOUT_ACTIVES }, (_, i) => slot(h.act[i])).join('')}</span>
      <button class="yt-bb" data-a="skv" data-id="path">${ri('star')}Uzmanlık yolu</button><button class="yt-bb" data-a="skillReset">${ri('list')}Sıfırla</button></div>`
    : `<div class="yt-bar"><span class="mut">Önizleme · kendi sınıfına dönmek için soldan ${esc(CLASSES[myCls].name)}'yı seç.</span></div>`;
  const note = own && S.lvl < SKILL_POINTS_FROM_LEVEL ? `<div class="yt-note">${ri('lock')} Ağaçlara puan ${SKILL_POINTS_FROM_LEVEL}. seviyede başlar.</div>` : '';
  return `<div class="yt">${left}<div class="yt-mid">${note}<div class="yt-trees">${treeOf(cls).map(t => treeCol(t, ctx)).join('')}</div>${bar}</div>${detail(ctx)}</div>`;
}
ACT.ytSel = d => { YV.sel = d.id; redraw(); };
ACT.ytCls = d => { YV.cls = d.id; YV.sel = null; redraw(); };
