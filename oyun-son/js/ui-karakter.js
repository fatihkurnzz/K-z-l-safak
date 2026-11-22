// Hesap ve karakter yerleri (sürüm 13): karakter seçme ekranı. Oluşturma ekranı ui-olustur.js'tedir (ACT.charCreate).
// Kurallar shared/account.js (char.list / char.create / char.select / char.nameFree); istemci api.js act('char.*').
// Karakter silme oyundan kaldırıldı (sürüm 13): ne düğmesi ne kuralı vardır.
//   run('char.create', look)    → look = { name, race: 'sancak'|'ocak', cls, gender, face, hair, hairColor, eyeColor, skin,
//                                 beard, body, height } (roster.js normLook + shared/gorunus.js tabloları)
//   başarıda: charCreated(id)   → karakter seçme ekranı yeni karakter seçili açılır (dışa aktarılır)
//   ACT.charSelect()            → karakter seçme ekranı · ACT.charSwitch() → oyundan seçme ekranına dönüş
// Ekran: tam ekran ırk sahnesi (karakter-sahne.js: boyalı arka plan, kürsü, ışık) ortada seçili kahraman; solda karakter
// kartları (boş yer = "Yeni karakter"), sağda ad levhası ve "Oyuna gir". Kart değişince sahne yeniden kurulmaz (yalnızca
// kahraman değişir); ırk değişirse kısa bir karartmayla yeni sahne kurulur.
// Görünüş 3B modele gorunus.js ile uygulanır: seçme ekranında kartın görünüşü (unit.charLook), oyunda seçili karakterin
// kahramanı (setLookSource → S.char; skinned.js createSkinned bağlar).
import { S, ACC, act, LOCAL } from './api.js';
import { ACT, $, hud, esc, toast, run, closeModal, closeWin, heroImg, DEF_W, hooks } from './ui-core.js';
import { CLASSES, FACTIONS, GAME, capitalOf } from '../shared/content.js';
import { CHAR } from '../shared/roster.js';
import { camRig, camera, setShift, setHfov } from './engine3d.js';
import { clearScene, setUpdater } from './world.js';
import { unitLook, hideBattleUI } from './combat.js';
import { hideTown } from './town.js';
import { hideChatBar } from './ui-social.js';
import { serverTag, serverEmblem } from './ui-sunucu.js';
import { playFragman } from './ui-fragman.js';
import { showHub } from './ui-hub.js';
import { setLookSource, PLACEHOLDER } from './gorunus.js';
import { stageRace, stageHero, stageClose } from './karakter-sahne.js';
import { IC } from './karakter-simge.js';
import { sprUrl, sprBox, yuzUrl } from './karakter-png.js'; // 22 Kas gece: GPT 'VAHRAN Claude Devir' 2B tam boy + yüz portreleri
import { onView } from './orient.js';

setLookSource(() => (S?.char ? { ...S.char, name: S.char.name || S.name } : null)); // oyundaki kahraman: seçili karakterin görünüşü

const setMood = f => { const r = document.documentElement; if (f) r.dataset.faction = f; else delete r.dataset.faction; };
const RACE = { sancak: 'İnsan', ocak: 'Ork' };
let SEL = null; // seçili kart kimliği
let box = null; // seçme ekranının kabı
const cards = () => ACC?.chars || [];
const max = () => ACC?.max || CHAR.slots;
const unitOf = c => ({ key: 'h0', cls: c.cls, faction: c.race, wm: DEF_W[c.cls], name: '', lvl: c.lvl, ...(c.look?.race ? { charLook: { ...c.look, cls: c.cls, race: c.race } } : {}) });

// Irk sahnesi (boyalı arka plan, karakter-sahne.js) + ortada seçili karakterin 2B tam boy görseli (22 Kas gece; önceki 3B
// geçici model kaldırıldı — oyundaki 3B kahraman değişmedi). Görsel ırk + sınıf + cinsiyete göre; yüz/saç seçimini göstermez.
const gOf = c => (c?.look?.gender === 'f' ? 'f' : 'm');
function stage(c, first) {
  if (first) { hud.hidden = true; closeWin(true); closeModal(); hideTown(); hideChatBar(); hideBattleUI(); clearScene(); }
  setShift(0, 0.02); setHfov(46); setMood(c.race); setUpdater(null);
  stageRace(c.race); stageHero(null);
  const im = box?.querySelector('#kshero img'), u = sprUrl(c.race, c.cls, gOf(c));
  if (im && im.getAttribute('src') !== u) { im.classList.remove('swap'); void im.offsetWidth; im.src = u || ''; im.classList.add('swap'); }
  placeHero(c);
}
// Ayak hizası: görünür alt sınır ortak ayak çizgisinde, görünür yükseklik eşit (oluşturma ekranıyla aynı kural)
function placeHero(c = cards().find(x => x.id === SEL)) {
  const h = box?.querySelector('#kshero'); if (!h || !c || !box.offsetWidth) return;
  const W = box.offsetWidth, H = box.offsetHeight, bx = sprBox(c.race, c.cls, gOf(c)) || [0, 0, 512, 768];
  const u = Math.min(H / 406, W / 880), foot = H * 0.86, top = H * 0.1;
  let s = (foot - top) / (bx[3] - bx[1]); s = Math.min(s, Math.max(120, W - 2 * 255 * u) / (bx[2] - bx[0]));
  h.style.cssText = `width:${512 * s}px;height:${768 * s}px;left:${W * 0.5 - ((bx[0] + bx[2]) / 2) * s}px;top:${foot - bx[3] * s}px`;
}
let offView = null;
const closeSel = () => { offView?.(); offView = null; box?.remove(); box = null; };

// ---------- Karakter seçme ----------
ACT.charSelect = async d => {
  if (!ACC) await act('char.list').catch(() => {});
  if (!cards().length) return ACT.charCreate();
  if (d?.id) SEL = String(d.id);
  if (!cards().some(c => c.id === SEL)) SEL = ACC.cur && cards().some(c => c.id === ACC.cur) ? ACC.cur : cards()[0].id;
  document.getElementById('olz')?.remove();
  drawSel();
  stage(cards().find(x => x.id === SEL), true);
};
const card = (x, i) => x
  ? `<button class="ks-card ${x.id === SEL ? 'on' : ''}" data-a="tkPick" data-id="${esc(x.id)}" data-race="${x.race}" style="--fc:${FACTIONS[x.race]?.color || '#888'};--i:${i}">
      <span class="ks-pt ks-yuz"><img src="${yuzUrl(x.race, gOf(x), x.look?.face) || ''}" alt="" draggable="false"></span>
      <span class="ks-info"><b translate="no">${esc(x.name)}</b><small><i class="ks-ri">${IC[x.race] || ''}</i>${RACE[x.race] || ''} · ${CLASSES[x.cls]?.name || ''}</small>${x.clan ? `<small class="ks-clan">${esc(x.clan)}</small>` : ''}</span>
      <span class="ks-lv"><small>Sv.</small><b>${x.lvl}</b></span></button>`
  : `<button class="ks-card ks-new" data-a="charCreate" style="--i:${i}"><span class="ks-plus"><i></i></span><span class="ks-info"><b>Yeni karakter</b><small>Boş yer</small></span></button>`;
function plate(c) {
  const C = CLASSES[c.cls] || {};
  return `<div class="ks-pl-race"><i class="ks-ri">${IC[c.race] || ''}</i><span>${RACE[c.race] || ''}</span><em>${FACTIONS[c.race]?.name || ''}</em></div>
    <b class="ks-name" translate="no">${esc(c.name)}</b>
    <div class="ks-orn" aria-hidden="true"><i></i></div>
    <div class="ks-pl-cls"><i class="ks-ci" data-c="${c.cls}">${IC[c.cls] || ''}</i><span>${C.name || ''}</span></div>
    ${C.role ? `<small class="ks-role">${C.role}</small>` : ''}
    <div class="ks-pl-meta"><span>Seviye <em>${c.lvl}</em></span>${c.clan ? `<span>${esc(c.clan)}</span>` : ''}</div>`;
}
function drawSel() {
  closeSel();
  box = document.createElement('div');
  box.id = 'tksel'; box.className = 'ks';
  box.addEventListener('click', e => { const b = e.target.closest('[data-a]'); if (b && box?.contains(b) && !b.disabled) { ACT[b.dataset.a]?.(b.dataset, b); hooks.sfx?.('tap', b.dataset.a); } }); // ui-core yalnızca hud/win/modal/chatbar'ı dinler
  const list = cards(), c = list.find(x => x.id === SEL), slots = Array.from({ length: max() }, (_, i) => list[i] || null);
  box.dataset.race = c?.race || 'sancak';
  box.innerHTML = `<div class="ks-shade" aria-hidden="true"></div><div class="ks-hero" id="kshero" aria-hidden="true"><img alt="" draggable="false"></div>
    <header class="ks-top"><span class="ks-brand">${serverEmblem('srv-emb ks-crest')}<span><b>${GAME.name}</b><small>${serverTag()}</small></span></span><span class="ks-sp"></span>
      <span class="ks-count">Karakterler <em>${list.length}/${max()}</em></span></header>
    <nav class="ks-list">${slots.map(card).join('')}</nav>
    <section class="ks-plate" id="ksplate">${c ? plate(c) : ''}</section>
    <button class="ks-enter" data-a="tkEnter" id="tkenter" ${c ? '' : 'disabled'}><span>Oyuna gir</span></button>
    ${LOCAL ? '<p class="ks-local">Deneme sürümü: karakterler yalnızca bu cihazda saklanır.</p>' : ''}
    <div class="ks-veil" aria-hidden="true"></div>`;
  document.body.appendChild(box);
  offView = onView(() => requestAnimationFrame(() => placeHero()));
  requestAnimationFrame(() => box?.classList.add('in'));
}
// Kart seçimi: DOM yeniden kurulmaz (geçişler yumuşak kalsın); ırk değişirse kısa karartma ardından yeni sahne
ACT.tkPick = d => {
  if (SEL === d.id || !box) return;
  const c = cards().find(x => x.id === d.id); if (!c) return;
  const prev = cards().find(x => x.id === SEL); SEL = d.id;
  box.querySelectorAll('.ks-card[data-id]').forEach(b => b.classList.toggle('on', b.dataset.id === SEL));
  const pl = $('#ksplate'); if (pl) { pl.classList.remove('swap'); void pl.offsetWidth; pl.innerHTML = plate(c); pl.classList.add('swap'); }
  if (prev?.race !== c.race) {
    box.classList.add('veil'); box.dataset.race = c.race;
    setTimeout(() => { if (!box || SEL !== c.id) return; stage(c); requestAnimationFrame(() => box?.classList.remove('veil')); }, 180);
  } else stage(c);
};
ACT.tkEnter = async () => {
  const b = $('#tkenter'); if (b) b.disabled = true;
  const r = await run('char.select', { id: SEL });
  if (!r || !S) { if (b) b.disabled = false; return; }
  closeSel(); stageClose(); setUpdater(null);
  if (S.battle) { await act('battle.abandon').catch(() => {}); toast('Yarım kalan savaş kapatıldı.'); }
  const fresh = !S.tut?.end && !(S.stats?.battles > 0); // yeni karakter: fragman, sonra başkent
  const go = () => { showHub(); toast(`Hoş geldin ${S.name}. ${capitalOf(S.faction)} seni bekliyor.`); };
  if (fresh) playFragman(go); else go();
};
// Oyundan seçme ekranına: açık pencere ve ana üs kapanır (kayıt sunucudadır; bir şey kaybolmaz)
ACT.charSwitch = () => { SEL = S?.char?.id || ACC?.cur || SEL; ACT.charSelect(); };
export function charCreated(id) { SEL = String(id); ACT.charSelect(); }

// ---------- Karakter oluşturma: ui-olustur.js (ACT.charCreate) ----------
