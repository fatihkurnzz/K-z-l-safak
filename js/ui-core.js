// Arayüz çekirdeği: ortak yardımcılar, tıklama yönlendirme, pencere ve modal sistemi, eşya/portre parçaları.
// Arayüz kural hesaplamaz: gösterim için shared/ tablolarını okur, her değişikliği api.act ile sunucuya sorar.
import { rankName } from '../shared/rutbe.js';
import { url as g5url } from './grafik5-png.js';
import { S, act, now } from './api.js';
import { CLASSES, ENERGY, UNLOCK, SHARDS, PREMIUM, TITLES, FACTION_BONUS, bonusLines, xpNeed, SERVER, FACTIONS, WAR_BONUS } from '../shared/content.js';
import { KINGDOM } from '../shared/realm.js';
import { premTier } from '../shared/state.js';
import { achTitle, ACH, achHeld, achBonus } from '../shared/meta.js';
import { seasonTitle } from '../shared/pvp.js';
import { weaponFx, WEAPON_FX, WFX_PCT, SLOTS, GRADES, STONES, itemBase, itemStats, mainStats, subsOf, subCount, fmtSub, SUB_UP, itemName, STAT_LABEL, fmtStat, gradeOf, isCoef, rqOf, meetsRq, RQ_LABEL, allBases } from '../shared/items.js';
import { MOBS } from '../shared/zones.js';
import { weaponModel, statTotals, elxTo } from '../shared/hero.js';
import { clsOf, mainId } from '../shared/roster.js';
import { capeOf } from '../shared/clan.js';
import { svg, ri, RES_COLOR } from './icons.js';
import { itemIcon } from './item-icons.js';
import { portraitAttrs } from './portraits.js';
import { mobResim, mobCizim } from './yaratik2d.js'; // G3 boyalı yaratık portreleri (Ansiklopedi, VS, rapor…)
import { unitLook } from './combat.js';
import { plusCls } from './kaplama-parts.js'; // artı seviyesinin ışıma sınıfları (+7 ve üstü)

export const $ = s => document.querySelector(s);
export const hud = $('#hud'), win = $('#win'), modal = $('#modal'), chatbar = $('#chatbar');
export const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const fmt = n => Math.round(n).toLocaleString('tr-TR');
// Türkçe ondalık virgülü (denetim D3): bütün yüzde yazıları bu iki biçimleyiciden geçer
export const pct = v => '%' + String(v * 100 >= 10 || v === 0 ? Math.round(v * 100) : +(v * 100).toFixed(2)).replace('.', ',');
export const stars = n => (n >= 1 && n <= 3 ? `<span class="kstars k${n}" title="${n}/3 yıldız" aria-label="${n}/3 yıldız"></span>` : `<span><span class="stars off">★★★</span></span>`); // Aşama 2 kit yıldız rozeti
// Deneyim (TP) yalnızca yüzde olarak gösterilir: kazanç, seviyenin gerektirdiği TP'nin yüzdesidir
export const pctTxt = v => `%${v >= 10 ? Math.floor(v) : (v >= 1 ? v.toFixed(1) : v.toFixed(2)).replace('.', ',')}`;
export const xpGain = (xp, lvl) => `+${pctTxt(100 * xp / Math.max(1, xpNeed(lvl ?? S.lvl)))} TP`;
export const clockText = ms => { const s = Math.max(0, Math.floor(ms / 1000)); return s >= 3600 ? `${Math.floor(s / 3600)}sa ${Math.floor(s % 3600 / 60)}dk` : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
// P28 bildirim (25 Kas, kullanıcı: "yukarıda çıkan bildirimleri kaldır"): eylem geri bildirimi artık üstte değil, ALT ortada
// tek satır (#toastAlt). Ölçüler tek tabloda.
const TOAST = { ms: 1600, gap: 8, freePct: 0.12 };
let toastT;
// Satırın alttan uzaklığı (px): savaşta yetenek çubuğunun, açık modal/pencerede kutunun alt kenarının içinde, ana ekranda dock'un üstünde
function toastBottom() {
  const vh = window.innerHeight, vis = el => el && el.getClientRects().length ? el.getBoundingClientRect() : null;
  const bt = $('#battleUI:not([hidden])') && vis($('#skills'));
  if (bt && bt.height) return vh - bt.top + TOAST.gap;
  const box = (!modal.hidden && vis(modal.querySelector('.box, .frame') || modal.firstElementChild)) || (!win.hidden && vis(win.querySelector('.frame') || win.firstElementChild));
  if (box && box.height) return Math.max(TOAST.gap, vh - box.bottom + TOAST.gap);
  const dock = !hud.hidden && [...hud.querySelectorAll('.s2-dock, .dock')].map(vis).find(r => r && r.height);
  if (dock) return vh - dock.top + TOAST.gap;
  return Math.round(vh * TOAST.freePct);
}
/**
 * Oyuncunun kendi eylemine kısa geri bildirim ("Yeterli akçe yok", "Satın alındı"). İmza değişmedi.
 * Ekranın alt ortasında tek satır, TOAST.ms sonra kalkar. Eski #toast'a metin uyumluluk için yazılır (gözlemciler) ama gösterilmez.
 * @param {string} msg gösterilecek kısa metin
 */
export function toast(msg) {
  hooks.sfx?.('toast');
  const t = $('#toast'); if (t) t.textContent = msg;
  let el = document.getElementById('toastAlt');
  if (!el) { el = document.createElement('div'); el.id = 'toastAlt'; el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite'); (t?.parentNode || document.body).insertBefore(el, t ? t.nextSibling : null); }
  el.textContent = msg; el.style.bottom = `${toastBottom()}px`; el.classList.add('on');
  clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('on'), TOAST.ms);
}
export const hooks = { hud() {} }; // sfx(tür, ad): ses paketi buraya bağlanır (ui-ses.js) · ana üs kendi çizimini buraya bağlar · err(e): hatayı kendi kutusuyla gösteren modül true döner (ui-pvp.js: çanta dolu)
export async function run(type, payload) { try { return await act(type, payload); } catch (e) { if (!hooks.err?.(e)) toast(hooks.errText?.(e) ?? e.message); return null; } }

// ---- Tıklama yönlendirme: data-a="işlem" ----
// P26 G3: parametresiz çağrı koruması. Her ACT eylemi sarılır: (1) `A.x()` / `A.x(null)` → `A.x({})` (güvenli varsayılan);
// (2) eylem boş parametreyle ({} ya da hiç) çağrılıp gerekli bir alanı (kimlik vb.) bulamadığı için TypeError atarsa eylem
// sessizce yok sayılır (yalnız konsol uyarısı). Tıklamadan gelen dataset (DOMStringMap) asla yutulmaz: gerçek hatalar görünür kalır.
const bosMu = d => d == null || (Object.getPrototypeOf(d) === Object.prototype && !Object.keys(d).length);
const yut = (k, e) => { if (e instanceof TypeError) { console.warn(`ACT.${String(k)}: parametresiz çağrı yok sayıldı (${e.message})`); return null; } throw e; };
/** Eylemi parametresiz çağrıya karşı korur (bkz. yukarı). İç yardımcı; ACT tablosuna atanan her işleve uygulanır. */
function korumali(k, f) {
  const g = function (d, ...r) {
    const bos = bosMu(d);
    if (!bos) return f.call(this, d, ...r);
    try { const v = f.call(this, d ?? {}, ...r); return v && typeof v.then === 'function' ? v.catch(e => yut(k, e)) : v; } catch (e) { return yut(k, e); }
  };
  g.asil = f;
  return g;
}
/** Eylem tablosu: data-a="ad" → ACT.ad(dataset, düğme). Atanan işlevler `korumali` ile sarılır. */
export const ACT = new Proxy({}, { set(t, k, v) { t[k] = typeof v === 'function' && !v.asil ? korumali(k, v) : v; return true; } });
for (const root of [hud, win, modal, chatbar]) {
  root.addEventListener('click', e => {
    const b = e.target.closest('[data-a]');
    if (root === modal && performance.now() - modalOpenedAt < 400) return; // 19 Kas: sahneye dokunuşla açılan pencerede aynı dokunuşun 'hayalet tıklaması' ilk seçeneğe (ör. Kapı → Sefer/ışınlanma) basmasın
    if (b && root.contains(b) && !b.disabled) { ACT[b.dataset.a]?.(b.dataset, b); hooks.sfx?.('tap', b.dataset.a); }
  });
  // yazı kutusunda Enter: data-enter="işlem"
  root.addEventListener('keydown', e => { const t = e.target; if (e.key === 'Enter' && t.dataset?.enter) { e.preventDefault(); ACT[t.dataset.enter]?.(t.dataset, t); } });
}

// ---- Kilit: bina ve modların açılış seviyesi ----
export const locked = key => S.lvl < (UNLOCK[key] || 1);
export const lockNote = key => `Seviye ${UNLOCK[key]} olunca açılır.`;

// ---- Eşya ve ganimet ----
export const SLOT_ICON = { wr: 'sword', wl: 'shield', helm: 'helm', chest: 'chest', legs: 'legs', gloves: 'gloves', boots: 'boots', ear1: 'ear', ear2: 'ear', neck: 'neck', ring1: 'ring', ring2: 'ring', belt: 'belt' };
// Eşya karesi: ikon tabana göre (item-icons.js), çerçeve ve zemin kaliteye göre; eşsizde parıltı, +7 ve +9'da hale (index.html)
export const ico = (it, cls = '') => { const B = itemBase(it.b); it = { ...it, g: gradeOf(it.b, it.g) }; return `<span class="ico it g${it.g} ${cls}${it.r ? ' rf' : ''}${B.unique ? ' uq' : ''}${plusCls(it.p)}"><span class="ig">${itemIcon(it.b) || svg(B.icon)}</span>${it.p ? `<em>+${it.p}</em>` : ''}</span>`; };
// Boş yuva ikonu: o yuvaya takılan en sade eşyanın silüeti
const SLOT_BASE = { wr: 'w:sword:0', wl: 'w:shield:3', helm: 'a:warrior:0:helm', chest: 'a:warrior:4:chest', legs: 'a:rogue:0:legs', gloves: 'a:mage:0:gloves', boots: 'a:rogue:0:boots', ear1: 'j:ear:0', ear2: 'j:ear:0', neck: 'j:neck:0', ring1: 'j:ring:0', ring2: 'j:ring:0', belt: 'j:belt:0' };
export const slotIco = s => `<span class="ico empty">${itemIcon(SLOT_BASE[s]) || svg(SLOT_ICON[s])}</span>`;
// Satır başı ikonları: yuvarlak madalyon (bina, mod, görev) ve kaynak karesi (taş, toz, muska…)
export const med = (kind, cls = '', badge = '') => `<span class="med ${cls}">${svg(kind)}${badge === '' ? '' : `<em>${badge}</em>`}</span>`; // badge: köşe sayısı (ör. verilen nitelik puanı)
export const resTile = (kind, cls = '') => `<span class="ico rs ${cls}" style="--gc:${RES_COLOR[kind] || '#e7c75a'}">${svg(kind)}</span>`;
// Eşya satırı: ad nadirlik renginde, yanında nadirlik etiketi; temel statlar düz yazı, savunma katsayıları / dirençler /
// savunma delme ayrı çipler (cfs) olarak gösterilir (css/esya.css)
// Asanın element hasarı (elx) karakterin uzmanlığına göre yazılır: Yıldırım uzmanında Yıldırım Hasarı, öbürlerinde Alev Hasarı
const elxLabel = () => { try { return elxTo(S.heroes[mainId(S)]) === 'bolt' ? 'Yıldırım Hasarı' : 'Alev Hasarı'; } catch { return STAT_LABEL.elx; } };
// pdmg: eşyanın sabit element hasarı; eşya verilirse türü adıyla yazılır (Zehir / Alev / Şimşek / Buzul Hasarı)
const pdmgLabel = it => { const f = it && weaponFx(it); return f && WEAPON_FX[f] ? `${WEAPON_FX[f].name} Hasarı` : STAT_LABEL.pdmg; };
export const statText = (st, it) => Object.entries(st).filter(([k]) => !isCoef(k)).map(([k, v]) => `${k === 'elx' ? elxLabel() : k === 'pdmg' ? pdmgLabel(it) : STAT_LABEL[k]} ${fmtStat(k, v)}`).join(' · ');
export const coefChips = st => { const c = Object.entries(st).filter(([k, v]) => isCoef(k) && v > 0); return c.length ? `<span class="cfs">${c.map(([k, v]) => `<span class="cf ${k === 'pen' ? 'pen' : ''}">${STAT_LABEL[k]} ${fmtStat(k, v)}</span>`).join('')}</span>` : ''; };
export const rarTag = g => `<span class="rar g${g}">${GRADES[g].name}</span>`;
// Yan statlar (items.js subsOf): güçlenenler ▲ ile; sonraki güçlenmenin artısı ipucunda
export const subChips = it => { const sb = subsOf(it), n = subCount(it); if (!sb.length) return n ? `<span class="subs"><span class="sb">${n} rastgele yan stat</span></span>` : ''; const nx = SUB_UP.find(x => (it.p || 0) < x); return `<span class="subs" title="${nx ? `+${nx}'te bir yan stat güçlenir` : 'Bütün güçlenmeler alındı'}">${sb.map(x => `<span class="sb${x.up ? ' upd' : ''}">${esc(fmtSub(x))}${x.up ? ` <i>${'▲'.repeat(x.up)}</i>` : ''}</span>`).join('')}</span>`; };
// Eşya şartı: nitelik şartı varsa (items.js rqOf) seviye yerine o yazılır; ana kahraman karşılamıyorsa kırmızı
const rqText = it => { const r = rqOf(it), B = itemBase(it.b); if (!r) return `Sv. ${B.req}`; let ok = true; try { ok = meetsRq(it, statTotals(S, mainId(S))); } catch { /* kayıt yok */ } return `<b class="${ok ? '' : 'bad'}" style="${ok ? '' : 'color:#ff6b5b'}">Gerekli ${Object.entries(r).map(([k, v]) => `${RQ_LABEL[k]} ${v}`).join(', ')}</b>`; };
const itemLine0 = it => { const B = itemBase(it.b), g = gradeOf(it.b, it.g), st = mainStats(it); return `<span class="gn g${g}${plusCls(it.p)}">${esc(itemName(it))}</span> ${rarTag(g)}<br><span class="mut">${rqText(it)}${B.hands === 2 ? ' · Çift el' : ''} · ${statText(st, it)}</span>${coefChips(st)}${subChips(it)}`; };
// Silah efekti (shared/items.js WEAPON_FX, weaponFx): kartta efekt renginde çip
export const itemLine = it => { const k = weaponFx(it), E = k && WEAPON_FX[k]; return itemLine0(it) + (E ? ` <span class="cfs"><span class="cf efx-${k}" style="background:#2a1a33;color:#fff;border-color:#${E.color.toString(16).padStart(6, '0')}">${E.icon} ${E.name}: isabette hasarın %${Math.round(WFX_PCT * 100)}'i${mainStats(it).pdmg ? ` + ${mainStats(it).pdmg}` : ''} kadar ${E.name.toLowerCase()} hasarı</span></span>` : ''); };
export const ELEMENT = { fire: 'Ateş', ice: 'Buz', bolt: 'Yıldırım' };
export const dropLabel = key => key === 'gear' ? 'Kademe eşyası (rastgele)' : key === 'dust' ? 'Örs Tozu' : key === 'ember' ? 'Tav Közü' : key === 'charm' ? 'Uğur Muskası' : key === 'mark' ? 'Boss izi' : key === 'seal' ? 'Mühür Taşı' : key.startsWith('stone') ? STONES[+key[5]].name : itemBase(key)?.name || key;
const WALLET = { dust: ['toz', 'Örs Tozu'], charm: ['charm', 'Uğur Muskası'], ember: ['ember', 'Tav Közü'], mark: ['mark', 'Boss izi'], akce: ['akce', 'Akçe'], yakut: ['gem', 'Yakut'], san: ['san', 'Şan'], ore: ['ore', 'Cevher'], seal: ['seal', 'Mühür Taşı'], energy: ['energy', 'Enerji'], nisan: ['nisan', 'Oba Nişanı'], berat: ['berat', 'Yoldaş Beratı'] };
// Ganimet kaydının (l.t) ve ansiklopedi drop anahtarının kaynak ikonu türü
export const lootKind = l => l.t === 'stone' ? `stone${l.g}` : l.t === 'shard' ? `shard_${l.k}` : WALLET[l.t]?.[0] || 'gift';
export const dropIco = key => itemBase(key) ? ico({ b: key, g: itemBase(key).unique ? 2 : 0, p: 0 }, 'sm') : resTile(key === 'dust' ? 'toz' : key, 'sm');
export const dropText = l => l.t === 'item' ? itemBase(l.b).name : l.t === 'stone' ? `${l.n}× ${STONES[l.g].name}` : l.t === 'shard' ? `${l.n}× ${SHARDS[l.k]}` : `${fmt(l.n)} ${WALLET[l.t]?.[1] || l.t}`;
export function lootHtml(loot) {
  return loot.map(l => {
    if (l.t === 'item') return `<div class="g${l.g} li">${ico({ b: l.b, g: l.g, p: 0 }, 'sm')}<span class="gn g${l.g}">${esc(itemBase(l.b).name)}</span>${l.dusted ? `<span class="mut">→ ${l.dusted} toz</span>` : ''}</div>`;
    if (l.t === 'stone') return `<div>${ri(lootKind(l))} ${STONES[l.g].name} ×${l.n}</div>`;
    if (l.t === 'shard') return `<div>${ri(lootKind(l))} ${SHARDS[l.k]} ×${l.n}</div>`;
    return `<div>${ri(lootKind(l))} ${WALLET[l.t]?.[1] || l.t} ×${fmt(l.n)}</div>`;
  }).join('');
}
// Ödül çipi: ikon + dropText (görev ödülü, posta içeriği)
export const lootChip = l => `<span class="chip rw${l.t === 'item' ? ` gn g${gradeOf(l.b, l.g)}` : ''}">${l.t === 'item' ? ico({ b: l.b, g: l.g, p: l.p || 0 }, 'xs') : ri(lootKind(l))}${dropText(l)}</span>`; // eşya: küçük eşya karesi (kaplama)
export const lootBox = loot => loot?.length ? `<div class="loot">${lootHtml(loot)}</div>` : '';
export const lootToast = loot => { if (loot?.length) toast('+ ' + loot.map(dropText).join(', ')); };

// ---- 2B portreler (3B modelden üretilir; bkz. portraits.js) ----
export const DEF_W = { warrior: { weapon: 'none', shield: false, plus: 0 }, // Savaşçı eli boş başlar (state.js STARTER_GEAR)
   rogue: { weapon: 'dagger', shield: false, plus: 0 }, priest: { weapon: 'mace', shield: true, plus: 0 }, mage: { weapon: 'staff', shield: false, plus: 0 } };
export const mobRank = M => M.boss ? 'boss' : M.captain ? 'captain' : 'mob';
export function mobImg(id, full = false, cls = '') {
  const M = MOBS[id], bg = mobRank(M), u = mobResim(id, full);
  if (u) return `<img class="pt ${bg} ${cls} m2d${full ? ' m2df' : ''}" alt="${esc(M.name)}" src="${u}">`; // G3 çizimi hazır
  const bek = mobCizim(id) ? ` data-m2d="${id}:${full ? 1 : 0}"` : ''; // paket inince yerinde değişir (yaratik2d.js)
  return `<img class="pt ${bg} ${cls}"${bek} alt="${esc(M.name)}" ${portraitAttrs(`m:${id}:${full ? 'f' : 'b'}`, id, { look: M.look, model: {}, bg, full, mid: id })}>`;
}
// cape: klan pelerini ({ c, a, s, l }). Kendi kahramanın için (taraf ve silah verilmeden) çağrılınca kendi pelerinin kullanılır.
// v: görünüm tonu (kadro: aynı sınıftan ikinci kahraman renk tonuyla ayrışır; 0 = sınıfın özgün renkleri)
export function heroImg(cls, full = false, c2 = '', faction, w, cape, v = 0) {
  if (faction === undefined && w === undefined && cape === undefined) cape = S.clan ? capeOf(S.clanTag) : null;
  faction ??= S.faction; w ??= S?.heroes?.[cls] ? weaponModel(S, cls) : S && clsOf(S) === cls ? weaponModel(S, mainId(S)) : DEF_W[cls]; // sınıf anahtarı: karakterin sınıfıysa kendi silahı, değilse varsayılan
  const L = unitLook({ cls, faction, wm: w, cape, v }), glow = (w.plus || 0) >= 7 ? `${w.plus}.${w.g || 0}` : w.g === 2 ? '0.2' : 0, ck = (cape ? `:c${cape.c}.${cape.a}.${cape.s}.${cape.l}` : '') + (v ? `:v${v}` : '');
  return `<img class="pt hero ${c2}" alt="${CLASSES[cls].name}" ${portraitAttrs(`h:${faction}:${cls}:${w.weapon}${w.glb ? '~' + w.glb : ''}${w.sglb ? '~' + w.sglb : ''}:${+!!w.shield}:${glow}:${full ? 'f' : 'b'}${(w.ap || 0) >= 7 ? `:A${w.ap}.${w.ag || 0}` : ''}${ck}`, v ? '' : `${cls}.${faction}${full ? ':f' : ''}`, { look: L.look, model: L.model, bg: faction, full, tid: cls })}>`; // glow: artılı silahın parıltısı (artı ve nadirlik) portrede de görünür
}
// Büyük illüstrasyon portresi (Kadro, kahraman ekranı, Meydan savunması): boydan, boyalı görünüm (portraits.js: paintArt).
// Elle çizilmiş görsel eklemek için img/portraits.json'a "art.<sınıf>.<taraf>" anahtarıyla dosya yolu yazılır.
export function heroArt(id, c2 = '') {
  const cls = clsOf(S, id), w = weaponModel(S, id), cape = S.clan ? capeOf(S.clanTag) : null, v = S.heroes[id]?.v || 0;
  const L = unitLook({ cls, faction: S.faction, wm: w, cape, v }), ck = (cape ? `:c${cape.c}.${cape.a}.${cape.s}.${cape.l}` : '') + (v ? `:v${v}` : '');
  return `<img class="pt hero art ${c2}" alt="${CLASSES[cls].name}" ${portraitAttrs(`a:${S.faction}:${cls}:${w.weapon}${w.glb ? '~' + w.glb : ''}${w.sglb ? '~' + w.sglb : ''}:${+!!w.shield}:${w.plus || 0}${(w.ap || 0) >= 7 ? `:A${w.ap}.${w.ag || 0}` : ''}${ck}`, v ? '' : `art.${cls}.${S.faction}`, { look: L.look, model: L.model, bg: S.faction, full: true, art: true, tid: cls })}>`;
}
// Karakter ekranının 3B görünümü (19 Kas gece): boyasız, büyük çizim; rot = 0..7 (45° adım). Anahtarda silah, kalkan,
// artı ışıması, pelerin ve ton var: ekipman değişince yeniden çizilir.
export function heroView(id, rot = 0) {
  const cls = clsOf(S, id), w = weaponModel(S, id), cape = S.clan ? capeOf(S.clanTag) : null, v = S.heroes[id]?.v || 0;
  const L = unitLook({ cls, faction: S.faction, wm: w, cape, v }), ck = (cape ? `:c${cape.c}.${cape.a}.${cape.s}.${cape.l}` : '') + (v ? `:v${v}` : '');
  const glow = (w.plus || 0) >= 7 ? `${w.plus}.${w.g || 0}` : w.g === 2 ? '0.2' : 0;
  return `<img class="pt hero h3d" alt="${CLASSES[cls].name}" ${portraitAttrs(`v:${S.faction}:${cls}:${w.weapon}${w.glb ? '~' + w.glb : ''}${w.sglb ? '~' + w.sglb : ''}:${+!!w.shield}:${glow}${(w.ap || 0) >= 7 ? `:A${w.ap}.${w.ag || 0}` : ''}${ck}:r${rot}`, '', { look: L.look, model: L.model, bg: S.faction, big: true, rot: -0.38 + rot * Math.PI / 4, tid: cls })}>`;
}
// Kendi kadrondaki bir kahramanın portresi (kimlikle): sınıfı, silahı, pelerini ve tonu kayıttan okunur
export const heroPic = (id, full = false, c2 = '') => heroImg(clsOf(S, id), full, c2, S.faction, weaponModel(S, id), S.clan ? capeOf(S.clanTag) : null, S.heroes[id].v || 0);
// Üyelik kademesi (0 = yok)
export const myTier = () => premTier(S, now());
export const myPerks = () => PREMIUM[myTier()];
// ---- Unvan simgeleri ve profil fotoğrafı çerçeveleri ----
// Unvan: 'champ' (şampiyon: taç) · 'clan' (lider klan üyesi: flama). Çerçeve önceliği: şampiyon > lider klan > premium
// kademesi (pr1..3, yalnızca üyelik sürerken). Hiçbiri yoksa portre eskisi gibi düz <img> kalır.
const TITLE_SVG = {
  champ: '<svg viewBox="0 0 24 24"><path d="M2.5 7.5l5 4L12 4l4.5 7.5 5-4-1.6 9.5H4.1zM4.3 18.6h15.4V21H4.3z"/></svg>',
  clan: '<svg viewBox="0 0 24 24"><path d="M4.5 2h2.4v20H4.5zM8 3.4h12.5l-3.6 4.5 3.6 4.5H8z"/></svg>',
  // Başbuğ: tuğ (topuzlu direk, iki yanında at kılı püskül). Stili css/dunya.css'te.
  ruler: '<svg viewBox="0 0 24 24"><path d="M10.9 6.2h2.2V22h-2.2zM12 1.4a2.7 2.7 0 1 1 0 5.4 2.7 2.7 0 0 1 0-5.4zM13.6 7.4c4.6.2 7.4 3.4 6.4 10-1.8-2.2-3.8-3.2-6.4-3.2zM10.4 7.4c-4.6.2-7.4 3.4-6.4 10 1.8-2.2 3.8-3.2 6.4-3.2z"/></svg>',
};
export const titleSvg = t => (Object.hasOwn(TITLE_SVG, t) ? TITLE_SVG[t] : ''); // sekme ikonu olarak da kullanılır (Taş Yemini ve Otağ: Başbuğ)
export const titleIcon = t => (TITLES[t] ? `<i class="tsym ${t}" title="${TITLES[t].name}">${TITLE_SVG[t]}</i>` : '');
export const titleChip = (t, text) => (TITLES[t] ? `<span class="tchip ${t}">${TITLE_SVG[t]}${text || TITLES[t].name}</span>` : '');
// Oyuncunun seçtiği başarım unvanı (meta.js ACH kimliği; geçersiz kimlik boş döner). Stili css/kalicilik.css'te.
export const achTag = id => { const t = achTitle(id); return t ? `<em class="atag">${t}</em>` : ''; };
// Ad önündeki unvan: "[Unvan] Ad". Unvan seçilmemişse yalnızca ad (yer tutucu "[Unvan]" yalnızca kendi profilinde görünür).
export const tPre = id => { const t = achTitle(id); return t ? `<em class="tpre">[${t}]</em> ` : ''; };
// Şan rütbesi nişanı (rutbe.js): 0-2 köşeli şerit, 3-4 baklava, 5-6 yıldız, 7-8 taç; renk kademeyle değişir
const RK_COL = ['#b87942', '#b87942', '#b87942', '#c9d2dc', '#c9d2dc', '#e7c75a', '#e7c75a', '#ff6a4a', '#ff6a4a'];
const chev = y => `<path d="M3 ${y}l5 -3 5 3v2.2l-5 -3 -5 3z"/>`;
function rkShape(i) {
  if (i <= 2) return Array.from({ length: i + 1 }, (_, k) => chev(13 - k * 4)).join('');
  if (i <= 4) return `<path d="M8 1.5l4.5 5 -4.5 5 -4.5 -5z"/>${i === 4 ? chev(15) : ''}`;
  if (i <= 6) return `<path d="M8 1l1.9 3.9 4.3.6 -3.1 3 .7 4.3L8 10.8 4.2 12.8l.7 -4.3 -3.1 -3 4.3 -.6z"/>${i === 6 ? '<rect x="3" y="14" width="10" height="1.6"/>' : ''}`;
  return `<path d="M2 12.5l1 -8 3 3.2L8 3l2 4.7 3 -3.2 1 8z"/><rect x="2" y="13.6" width="12" height="1.8"/>${i === 8 ? '<circle cx="8" cy="9" r="1.3" fill="#0006"/>' : ''}`;
}
export const rkBadge = rk => { const i = Math.max(0, Math.min(8, rk | 0)); return `<i class="rkb" title="${rankName(i)}" style="--rc:${RK_COL[i]}"><svg viewBox="0 0 16 16">${rkShape(i)}</svg></i>`; };
export const tName = (name, id, rk) => `${rk != null ? rkBadge(rk) : ''}${tPre(id)}${esc(name)}`;
// who: { av: 'h:sınıf' | 'm:yaratık', faction, tier, title, wm? } · size: 'xs' | 'sm' | '' | 'lg' | 'ava'
export function faceImg(who, size = 'sm') {
  const [k, v] = (who.av || 'h:warrior').split(':'), c = CLASSES[v] ? v : 'warrior';
  let frame = TITLES[who.title] ? who.title : seasonTitle(who.ti) ? `sz ${who.ti}` : who.tier ? `pr${who.tier}` : ''; // sezon unvanı (pvp.js) kendi çerçevesini takar: css/pvp.css
  if (who.fr && /^([pc][dwm]|ty)$/.test(who.fr)) frame = `rf-${who.fr}`; // sıralama çerçevesi (shared/rankper.js): oyuncunun seçtiği, diğer çerçevelerin önünde
  const img = k === 'm' && MOBS[v] ? mobImg(v, false, frame ? '' : size) : heroImg(c, false, frame ? '' : size, who.faction || S.faction, who.wm || DEF_W[c]);
  return frame ? `<span class="avf ${frame} ${size}">${img}${TITLES[who.title] ? `<i class="avb">${TITLE_SVG[who.title]}</i>` : ''}</span>` : img;
}
// Taraf bonusu kutusu (açılış ekranı, ırk üstünlüğü): satırlar tablodan gelir, her biri kendi içinde bölünmez
export const bonusBox = f => `<span class="fbon"><em>${FACTION_BONUS[f].name}</em>${bonusLines(f).map(l => `<span>${l}</span>`).join(' · ')}</span>`;
// Oyuncunun kendi unvanı sunucudan gelir (ana üste sohbet önizlemesiyle birlikte yenilenir)
export const me = { title: null };
export function avatarImg(cls = 'ava') {
  const c = (S.avatar || '').split(':')[1];
  return faceImg({ av: S.avatar, faction: S.faction, tier: myTier(), title: me.title, ti: S.ach?.title || null, fr: S.rk?.sel || null, wm: CLASSES[c] ? (c === clsOf(S) ? weaponModel(S, mainId(S)) : DEF_W[c]) : null }, cls);
}
// Savaş birimi (kahraman ya da yaratık) için küçük portre
export const unitImg = (u, cls = 'sm') => u.cls ? heroImg(u.cls, false, cls, u.faction || S.faction, u.wm || DEF_W[u.cls], u.cape || null, u.v || 0) : mobImg(u.mob, false, cls);

// ---------- Modal ----------
let modalOpenedAt = 0;
export function showModal(html, cls = '') { if (modal.hidden) modalOpenedAt = performance.now(); const again = !modal.hidden || performance.now() - modalClosedAt < 120; modal.innerHTML = `<div class="box ${cls}${again ? ' still' : ''}"><button class="x mx" data-a="closeModal" aria-label="Kapat">✕</button>${html}</div>`; modal.hidden = false; modalCtx(); hooks.sfx?.('modal', cls); }
let modalClosedAt = 0; // kapatılıp hemen (aynı dokunuşta) yeniden açılan pencere açılış animasyonunu yeniden oynatmaz
export function closeModal() { if (!modal.hidden) { hooks.sfx?.('modalClose'); modalClosedAt = performance.now(); } modal.hidden = true; modal.innerHTML = ''; }
ACT.closeModal = closeModal;
let confirmYes = null;
export function confirmBox(title, text, yes, label = 'Evet') {
  confirmYes = yes;
  showModal(`<h2>${title}</h2><div class="in"><p>${text}</p><div class="mbtns"><button class="btn red" data-a="yes">${label}</button><button class="btn" data-a="closeModal">Vazgeç</button></div></div>`);
}
ACT.yes = () => { const f = confirmYes; confirmYes = null; closeModal(); f?.(); };

// ---------- Pencere sistemi ----------
// cfg: { title, tabs:[{id,label,small,pre,icon,off}], tab, render(tab) → html, onTab, load: async () → veri (cfg.data'ya yazılır), back }
// Sekme ikonu: pre (hazır HTML, ör. portre) ya da icon (icons.js türü); ikisi de yoksa sekme kimliğine göre TAB_ICON'dan bulunur.
const TAB_ICON = { g: 'chat', c: 'clan', p: 'mail', f: 'party', players: 'rank', clans: 'clan', race: 'events', champ: 'crown', clan: 'clan' };
const tabPre = t => { const k = t.icon || TAB_ICON[t.id]; return k ? `<span class="tico">${svg(k)}</span>` : ''; };
let W = null;
export const cur = () => W;
export function energyNow() {
  if (S.energy >= ENERGY.max) return { e: S.energy, left: 0 };
  const n = Math.floor((now() - S.energyAt) / ENERGY.regenMs), e = Math.min(ENERGY.max, S.energy + n);
  return { e, left: e >= ENERGY.max ? 0 : ENERGY.regenMs - ((now() - S.energyAt) % ENERGY.regenMs) };
}
export function openWin(cfg) { hooks.sfx?.('win'); W = cfg; win.hidden = false; drawWin(); reload(); }
export async function reload() { const w = W; if (!w?.load) return; w.data = await w.load(w.tab); if (W === w) redraw(); }
const tabsHtml = () => `${W.tabs.map(t => `<button data-a="tab" data-id="${t.id}" class="${t.id === W.tab ? 'on' : ''}" ${t.off ? 'disabled style="opacity:.5"' : ''}>${t.pre || tabPre(t)}<span>${t.label}${t.small ? `<small>${t.small}</small>` : ''}</span>${t.dot ? '<i class="tdot" aria-label="Bekleyen puan"></i>' : ''}</button>`).join('')}`;
// GPT Paket 5 (21 Kas): pencere başlığında işlevin nesnesi (örs, defter, mektup, fener, makara, pusula)
// P27 4.4: Takvim ve Ansiklopedi'de kitap simgesi çerçeve köşesine biniyordu → bu iki pencereden kaldırıldı
const EMB = [['Örs', 'ors'], ['Görev', 'defter'], ['Günlük Görevler', 'defter'], ['Destan', 'defter'], ['Başarımlar', 'defter'],
  ['Posta', 'mektup'], ['Sorun', 'mektup'], ['Sohbet', 'mektup'], ['Duyurular', 'mektup'], ['Bildirimler', 'mektup'],
  ['Yeraltı Ocağı', 'fener'], ['Kül Kulesi', 'fener'], ['Maden', 'fener'], ['Dipsiz Kuyu', 'fener'], ['Mühürlü Oda', 'fener'], ['Zindanlar', 'fener'],
  ['Balık', 'makara'], ['Kapı', 'pusula'], ['Sefer', 'pusula'], ['Diyar', 'pusula'],
  ['Klan', 'flama'], ['Hisar', 'flama'], ['Taş Yemini', 'flama'], ['Sancak Savaşı', 'flama'], ['Otağ', 'flama'], ['Meydan', 'flama'], ['Canlı Meydan', 'flama'], ['Şan Divanı', 'flama'], ['Sıralama', 'flama']];
const embOf = t => { const e = EMB.find(([p]) => String(t).startsWith(p)); const u = e && g5url(e[1] === 'flama' ? 'flama-' + (S?.faction === 'sancak' ? 'sancak' : 'ocak') : e[1]); return u ? `<img class="wemb" src="${u}" alt="" aria-hidden="true">` : ''; };
const SCR = { 'Çanta': 'canta', 'Karakter': 'karakter', 'Görevler': 'gorev', 'Görev Defteri': 'gorev', 'Takvim': 'gorev', 'Klan Karargâhı': 'klan', 'Sıralama': 'siralama', 'Meydan': 'siralama', 'Başarımlar': 'basarim' };
function drawWin() {
  // Aynı pencere açıksa kabuğu yıkma: yalnız sekme çubuğunu yerinde güncelle (titreme olmasın)
  const key = W.title + '|' + (W.back || '') + '|' + (W.tabs ? 1 : 0) + (W.scr || '');
  if (!win.hidden && win._key === key && win.querySelector('#page')) {
    const nav = win.querySelector('nav.tabs');
    if (nav && W.tabs) nav.innerHTML = tabsHtml();
    return redraw();
  }
  win._key = key;
  win.dataset.scr = W.scr || SCR[W.title] || 'genel'; // Aşama 5: ekran kimliği (css/v24-asama5.css büyük pencere ve tema)
  win.className = 'win full'; // 22 Kas (kullanıcı): bütün pencerelerde sekmeler solda (eski 'top' seçeneği yok sayılır)
  win.innerHTML = `<div class="scrim" data-a="closeWin"></div><div class="frame"><header>${W.back ? `<button class="x bk" data-a="${W.back}">‹</button>` : ''}${embOf(W.title)}<h2>${W.title}</h2><div class="wres"></div><button class="x" data-a="closeWin">✕</button></header>
    <div class="wbody">${W.tabs ? `<nav class="tabs">${tabsHtml()}</nav>` : ''}<section class="page" id="page"></section></div></div>`;
  hooks.icmWin?.(win, W); // P30: iç mekân sahnesi (js/ic-mekan.js); mekânı olmayan pencerede hiçbir şey yapmaz
  redraw();
}
const BLD_WALLET = {
  'Örs': () => [['toz', S.toz, 'Örs Tozu'], ['stone0', S.stones[0], 'Kaba Bileği Taşı'], ['stone1', S.stones[1], 'İnce Bileği Taşı'], ['stone2', S.stones[2], 'Usta Bileği Taşı'], ['charm', S.charms, 'Uğur Muskası'], ['ember', S.embers || 0, 'Tav Közü']],
  'Maden': () => [['ore', S.ore, 'Cevher']],
  'Meydan': () => [['san', S.san, 'Şan']],
  'Kader Çarkı': () => Object.entries(SHARDS).map(([k, n]) => ['shard_' + k, S.shards[k] || 0, n]),
  'Klan Karargâhı': () => [['nisan', S.nisan || 0, 'Oba Nişanı'], ...(W?.data?.clan?.hq ? [['clan', W.data.clan.hq.tre || 0, 'Klan Hazinesi']] : [])], // P24: Oba Nişanı + Klan Hazinesi (pencere verisinden)
  'Klan': () => [['nisan', S.nisan || 0, 'Oba Nişanı']],
  'Kapı': () => [['seal', S.seals, 'Mühür Taşı']],
};
export function redraw() {
  if (!W || win.hidden) return hooks.hud();
  const page = $('#page'), y = page.scrollTop;
  page.innerHTML = W.render(W.tab);
  if (W.tabsFn) { W.tabs = W.tabsFn(); const nav = win.querySelector('nav.tabs'); if (nav) { const h = tabsHtml(); if (nav._h !== h) { nav._h = h; nav.innerHTML = h; } } } // sekme etiketleri durumdan (ör. Karakter: dağıtılmamış puan)
  page.scrollTop = y;
  // P27 Bölüm 2: başlık şeridi bağlamsaldır (CTX tablosu): binaya özgü kaynaklar (BLD_WALLET) + o ekranda harcanan genel kaynak ya da durum etiketi
  const el = win.querySelector('.wres'), C = ctxOf(W);
  const extra = (BLD_WALLET[W.title]?.() || []).map(([i, v, t]) => `<span class="wx" title="${t}">${ri(i)} ${fmt(v)}</span>`).join('');
  const gen = (C.res || []).map(k => `<span class="wg" title="${RES_PILL[k][1]}">${ri(RES_PILL[k][0])} ${RES_PILL[k][2]()}</span>`).join('');
  let tag = ''; if (C.tag) { try { tag = C.tag(W) || ''; } catch { tag = ''; } tag ||= serverTag(); }
  el.classList.toggle('wtag', !!tag && !extra && !gen);
  el.innerHTML = `${extra}${gen}${tag ? `<span class="wctx">${esc(tag)}</span>` : ''}`;
  fitRes();
  hooks.hud();
}
// ---- P27 Bölüm 2: bağlamsal üst şerit (TALIMAT.md tablosu) ----
const RES_PILL = { energy: ['energy', 'Enerji', () => energyNow().e], akce: ['akce', 'Akçe', () => fmt(S.akce)], yakut: ['gem', 'Yakut', () => fmt(S.yakut)] };
const serverTag = () => `Sunucu: ${SERVER.name}`;
const plainTitle = t => String(t ?? '').replace(/<[^>]*>/g, '').trim();
const pad2 = n => String(n).padStart(2, '0');
/** Sunucu saati (SERVER.tz = UTC+3) "SS:DD". */
const serverClock = () => { const d = new Date(now() + 3 * 3600000); return `Sunucu Saati ${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}`; };
const dayLeft = ms => (ms >= 86400000 ? `${Math.floor(ms / 86400000)}g ${Math.floor(ms % 86400000 / 3600000)}s` : `${Math.floor(ms / 3600000)}s ${Math.floor(ms % 3600000 / 60000)}dk`);
const TAGS = {
  server: serverTag,
  clock: serverClock,
  ach: () => { const held = ACH.reduce((a, A) => a + achHeld(S, A.id), 0), all = ACH.reduce((a, A) => a + A.tiers.length, 0); return `${held}/${all} Kademe · +${pct(achBonus(S).pct.atk)} Güç`; },
  codex: () => `${Object.keys(MOBS).length} Yaratık · ${fmt(allBases().reduce((a, b) => a + (itemBase(b).unique ? 1 : 2), 0))} Eşya`, // ui-esya.js ENTRY_COUNT ile aynı sayım
  yemin: w => { const D = w?.data?.war; if (!D?.now) return ''; const h = D.holder ? FACTIONS[D.holder]?.name : null; return `${WAR_BONUS.name}: ${h || 'yok'} · ${fmt(D.now.ocak)} – ${fmt(D.now.sancak)}`; },
  otag: w => { const e = w?.data?.v?.endsAt; return e ? `${SERVER.name} · Seçime ${dayLeft(Math.max(0, e - now()))}` : ''; },
  hero: () => `${SERVER.name} · Sv. ${S.lvl}`,
};
/** P27 Bölüm 2 bağlam tablosu: [başlık öneki (HTML'siz) | 'scr:<kimlik>', { res: genel kaynaklar, tag: durum etiketi }].
 *  İlk eşleşen satır geçerlidir; eşleşme yoksa CTX_DEF (yalnız "Sunucu: Ares"). Modallarda MODAL_CTX (h2 metni). */
const CTX = [
  ['scr:vs', { res: ['energy'] }],
  ...['Silah ve Kalkan', 'Zırh', 'Takı', 'Tüccar', 'Pazar', 'İksir ve Parşömen', 'Parçala ya da Sat', 'Örs', 'Maden', 'Çanta'].map(t => [t, { res: ['akce'] }]),
  ...['Karaborsa', 'Premium', 'Yakut Al', 'Kervan'].map(t => [t, { res: ['yakut'] }]),
  ...['Kapı', 'Destan', 'Kristal Nöbeti', 'Meydan Sezonu'].map(t => [t, { res: ['energy'] }]),
  ['Meydan', { res: ['energy'] }],
  ...['Kader Çarkı', 'Klan', 'Şan Divanı'].map(t => [t, {}]), // yalnız binaya özgü cüzdan
  ['Ansiklopedi', { tag: TAGS.codex }], ['Başarımlar', { tag: TAGS.ach }], ['Taş Yemini', { tag: TAGS.yemin }], [KINGDOM.court, { tag: TAGS.otag }],
  ['Takvim', { tag: TAGS.clock }], ['Görev', { tag: TAGS.clock }], ['Görevler', { tag: TAGS.clock }], ['Günlük Görevler', { tag: TAGS.clock }], ['Karakter', { tag: TAGS.hero }],
];
const CTX_DEF = { tag: TAGS.server }; // Ayarlar, Sorun / Teknik Destek, Posta, Sohbet, Sıralama, Arkadaşlar, Bildirimler, Duyurular…
/** Pencerenin bağlam satırını döner ({ res?, tag? }). */
export function ctxOf(w) {
  const t = plainTitle(w?.title);
  const row = CTX.find(([k]) => (k.startsWith('scr:') ? w?.scr === k.slice(4) : t === k || t.startsWith(k + ' ')));
  return row ? row[1] : CTX_DEF;
}
// Modal (showModal) başlıkları: Kaynak kutusu YOK satırları durum etiketi alır; Kapı seçimi yalnız Enerji. Menü kendi "Sunucu: Ares" düğmesini taşır.
const MODAL_CTX = { 'Kapı': { res: ['energy'] }, 'Işınlanma Kapısı': { tag: TAGS.server }, 'Mini Dizi': { tag: TAGS.server }, 'Çevrimiçi ödülleri': { tag: TAGS.clock }, 'Ödül Sandığı': { tag: TAGS.clock } };
function modalCtx() {
  const box = modal.querySelector('.box'), h = box?.querySelector(':scope > h2'), C = h && MODAL_CTX[h.textContent.trim()];
  if (!C || box.querySelector(':scope > .mctx')) return;
  const gen = (C.res || []).map(k => `<span class="wg" title="${RES_PILL[k][1]}">${ri(RES_PILL[k][0])} ${RES_PILL[k][2]()}</span>`).join('');
  h.insertAdjacentHTML('afterend', `<div class="mctx${gen ? '' : ' wtag'}">${gen || `<span class="wctx">${esc(C.tag())}</span>`}</div>`);
}
/** Başlık şeridi dar ekranda X düğmesine taşmasın: sığmayan BİNAYA ÖZGÜ kapsüller (.wx, soldakiler) bütün olarak gizlenir;
 *  genel kaynak (.wg) ve durum etiketi (.wctx) hep kalır. Band sağa yaslıdır (flex-end), soldan gizlemek ötekileri kaydırmaz. */
export function fitRes() {
  const el = win.querySelector('.frame > header .wres'); if (!el) return;
  const sp = [...el.children]; sp.forEach(x => { x.style.display = ''; });
  const L = el.getBoundingClientRect().left;
  sp.filter(x => x.classList.contains('wx')).forEach(x => { if (x.getBoundingClientRect().left < L - 1) x.style.display = 'none'; });
}
if (typeof window !== 'undefined') window.addEventListener('resize', () => { try { if (W && !win.hidden) fitRes(); } catch { /* pencere yok */ } });
export function closeWin(silent) { if (!win.hidden) { hooks.sfx?.('winClose', silent); hooks.icmWinKapat?.(win); } W = null; win.hidden = true; win._key = null; win.innerHTML = ''; win.classList.remove('icm-var', 'icm-kapali'); delete win.dataset.icm; if (silent !== true) hooks.hud(); }
ACT.closeWin = () => closeWin();
ACT.tab = d => { W.tab = d.id; W.data = null; W.onTab?.(d.id); drawWin(); const pg = $('#page'); if (pg) pg.scrollTop = 0; reload(); };
// Tembel görsel paketleri yüklendi (P26 O15): eşya simgeleri (item-icons/esya-png), karakter (karakter-png), G4–G6 (sahne.js) → açık pencere yeniden çizilir
if (typeof window !== 'undefined') for (const ev of ['dd-esya2', 'dd-karakter', 'dd-gorsel']) window.addEventListener(ev, () => { try { if (W && !win.hidden) redraw(); } catch { /* pencere yok */ } });
export async function doAct(type, payload) { const r = await run(type, payload); if (r) redraw(); return r; }
export const loading = '<p class="mut" style="text-align:center;padding:20px">Yükleniyor…</p>';

// ---- Çerçevenin dışına dokunmak açık pencereyi kapatır ----
// Modal: kutunun dışındaki karartmaya dokununca (kapatma düğmesi olan modallarda; zorunlu seçim ekranları kapanmaz).
// Pencere: karartma (scrim) zaten closeWin'e bağlı; ek olarak çerçevenin dışında kalan her dokunuş (HUD üstü dahil) yakalanır.
modal.addEventListener('click', e => { if (e.target === modal && modal.querySelector('[data-a="closeModal"]')) closeModal(); });
document.addEventListener('pointerdown', e => {
  if (win.hidden || !modal.hidden) return;
  const f = win.querySelector('.frame');
  if (!f || f.contains(e.target) || chatbar?.contains(e.target) || e.target.closest?.('#toast,#battleUI,.ddi,.ad-ov,#tut')) return; // .ad-ov: ödüllü reklam katmanı (ui-reklam.js); #tut: öğretici paneli ve karartması pencereyi kapatmaz
  if (W?.keep) return; // pencere kendisi dışarı dokunmayı kullanıyorsa
  e.preventDefault(); e.stopPropagation();
  const once = ev => { ev.stopPropagation(); ev.preventDefault(); };
  document.addEventListener('click', once, { capture: true, once: true }); // aynı dokunuş arkadaki düğmeye geçmesin
  setTimeout(() => document.removeEventListener('click', once, { capture: true }), 400);
  closeWin();
}, true);

// ---- Geri tuşu / Esc: açık modalı ya da pencereyi kapatır (kapatma düğmesine ulaşılamasa da çıkış yolu olsun) ----
function goBack() {
  if (!modal.hidden) { if (!modal.querySelector('[data-a="closeModal"]')) return false; closeModal(); return true; }
  if (!win.hidden) { if (W?.back) ACT[W.back]?.(); else closeWin(); return true; }
  return false;
}
window.addEventListener('keydown', e => { if (e.key === 'Escape' && !/^(INPUT|TEXTAREA)$/.test(e.target.tagName)) goBack(); });
// Telefonun geri tuşu/hareketi: yalnızca sayfa kendi sekmesinde ya da uygulama olarak açıkken (gömülü çerçevede
// gezinme geçmişine dokunulmaz). Açık pencere varken geçmişe bir nöbetçi kayıt konur; geri gelince pencere kapanır.
const TOP = (() => { try { return window.top === window; } catch { return false; } })();
let armed = false;
const arm = () => { if (TOP && !armed && (!win.hidden || !modal.hidden)) { try { history.pushState({ dd: 1 }, ''); armed = true; } catch { } } };
if (TOP) {
  window.addEventListener('popstate', () => { armed = false; goBack(); arm(); });
  new MutationObserver(arm).observe(document.getElementById('game') || document.body, { attributes: true, attributeFilter: ['hidden'], subtree: true });
}
