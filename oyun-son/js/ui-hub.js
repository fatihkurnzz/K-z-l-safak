// Hesap açılışı ve Vahran Sınırı (ana üs). Yerleşim yataydır:
//  - meydanın ortasında Kapı (portal), çevresinde dokunulabilir binalar
//  - sol üstte oyuncu kartı, altında üyelik şeridi, onun altında Menü ve Kapı kısayolu
//  - sağ üstte kaynaklar, altta kısayol çubuğu (başta Sıralama, sonda Kervan), çubuğun üstünde sohbet şeridi
import { CAPITALS, capitalOf } from '../shared/content.js';
import { serverTag, serverEmblem } from './ui-sunucu.js';
import { rankIdx, rankName, nextRank } from '../shared/rutbe.js';
import { playFragman } from './ui-fragman.js';
import { S, now, DEV, LOCAL, resetLocal, onState, logout } from './api.js';
import { NUFUS_LINE, FULL_TEXT, blessed } from '../shared/nufus.js'; // nüfus dengesi: Bereket rozeti, dolu ırk kartı
import { ACT, $, hud, openWin, lockNote, chatbar, esc, fmt, toast, run, showModal, closeModal, confirmBox, closeWin, hooks, heroImg, mobImg, avatarImg, myTier, DEF_W, energyNow, locked, me, titleChip, bonusBox, tName, rkBadge, lootToast } from './ui-core.js';
import { camRig, project, setShift, setHfov, THREE, RENDER } from './engine3d.js';
import { show2d, pos2d, hub2dOn, active2d, onHit } from './hub2d.js'; // 20 Kas Aşama 3: 2B başkent
import { gfx, TIER_NAMES } from './gfx.js';
import { view } from './orient.js';
import { world, clearScene, ensureEnv, spawn, setUpdater } from './world.js';
import { hideBattleUI, unitLook } from './combat.js';
import { showTown, hideTown, updateTown, onTownTap, CARSI_SPOT, KLAN_SPOT } from './town.js';
import { botParty } from '../shared/bots.js';
import { childHere } from './ui-ogretici.js';
import { ilvTag } from './esya-parts.js';
import { showChatBar, hideChatBar } from './ui-social.js';
import { CLASSES, GAME, FACTIONS, CLASS_KEYS, UNLOCK, ENERGY, QUESTS, PREMIUM, xpNeed, BAG_LIMIT, FACTION_BONUS, WAR_BONUS, bonusLines, warBonusLine } from '../shared/content.js';
import { partyUnits, partyPower, statPointsFree, skillPointsFree, itemLevel, equippedIds, ownerOf } from '../shared/hero.js';
import { itemBase } from '../shared/items.js';
import { partyIds, clsOf } from '../shared/roster.js';
import { mineStock, mineRate, idleStock, questProgress, stageOpen } from '../shared/calc.js';
import { ZONES, MOBS, zoneStages } from '../shared/zones.js';
import { svg, ri } from './icons.js';
import { DESTAN, chapterOpen, chapterDone } from '../shared/destan.js'; // 20 Kas: Görevler panelinde sıradaki Destan bölümü
import { unitFrame, hotbarHtml, expHtml, minimapHtml, drawMinimap, plate, ROLE } from './hud17.js'; // 19 Kas ana merkez arayüzü (css/v17-hub.css)
import { bannerSvg } from './banner.js';
import { seriesNewCount } from '../shared/minidizi.js';
import { supportBadge } from './ui-destek.js'; // okunmamış duyuru / yanıt rozeti
import { starterBtn } from './ui-odeme.js'; // İlk Alım Paketi simgesi
import { achTitle, tutActive, WEEKLY, MONTHLY, weeklyProgress, monthlyProgress } from '../shared/meta.js';
import { mqReady, mqNext, mqState, mqProg } from '../shared/anagorev.js'; // ana görev ağacı: dock rozeti ve izleyici

// Binalar (açılış seviyeleri content.js UNLOCK tablosunda). Kapı meydanın ortasındadır.
// Sürüm 13: Kapı'nın yanında Yemin Pazarı'na götüren ışıklı geçit (Çarşı; eski sol sütun düğmesinin yerine). Pazar ve Tüccar Yemin Pazarı'na
// taşındı; başkentte onların yerinde İksir ve Parşömen dükkânı durur (ui-town.js: ACT.iksir).
const BUILDINGS = [
  { id: 'gate', name: 'Kapı', act: 'gateMenu' }, { id: 'carsi', name: 'Çarşı', act: 'goCarsi', cls: 'portal' },
  { id: 'clanhq', name: 'Kral Otağı', act: 'otag' }, // 19 Kas: başkentteki büyük çadır Kral Otağı'na açılır (eski Klan Karargâhı; klan evi Klan düğmesinden ve klan toprağından)
  { id: 'anvil', name: 'Örs', act: 'anvil', key: 'anvil' }, { id: 'mine', name: 'Maden', act: 'mine', key: 'mine' },
  { id: 'iksir', name: 'İksir ve Parşömen', act: 'iksir' },
  { id: 'wheel', name: 'Kader Çarkı', act: 'wheel', key: 'wheel' },
  { id: 'monument', name: 'Taş Yemini', act: 'monument' },
];

// ---- Başkent ve Yemin Pazarı ----
// Ana üs ırkın başkentidir (Kragmir: Kragmir Dağ Salonları, isli ocaklar · Elentha: Elentha Ak Kuleleri, beyaz surlar). Yemin Pazarı iki ırkın buluştuğu
// tarafsız pazar kasabasıdır: Pazar (oyuncu ilanları) ve Tüccar (NPC dükkânı) iki ayrı tezgâhtır; Taş Yemini ve iskele de oradadır;
// ortadaki geçit başkente döndürür. Tüccar tezgâhının etiketi yoktur: önünde duran Tüccar Halvor'un etiketi onu açar (nolabel).
export const CAPITAL = CAPITALS;
// 19 Kas: Yemin Pazarı'nda da ışıklı geçit (Başkente dön) ve Karaborsa (ui-karaborsa.js)
const CARSI = [{ id: 'gate', name: 'Kapı', act: 'gateMenu' }, { id: 'carsi', name: 'Başkente dön', act: 'goCapital', cls: 'portal' }, { id: 'karaborsa', name: 'Karaborsa', act: 'karaborsa' }, { id: 'yashka', name: 'Şaman Yashka', act: 'yashka' }, { id: 'pazar', name: 'Pazar', act: 'pazar', key: 'market' }, { id: 'tuccar', name: 'Tüccar', act: 'tuccar', nolabel: true }, { id: 'monument', name: 'Taş Yemini', act: 'monument' }, { id: 'pier', name: 'Balık Tut', act: 'balik' }]; // iskele: balık tutma (ui-balik.js) · Kader Çarkı yalnız başkentte
const PLACE = { cur: 'capital' };
// NPC'ler (ui-ogretici.js): bina değil, meydanda duran kişiler; etiketleri binalarınki gibi dokunulabilir. Tüccar kendi tezgâhının önünde
const NPC_SPOT = { merchant: [5.6, -0.9, -0.6], child: [3.6, 1.2, -0.4] };
const npcs = () => [{ id: 'merchant', name: 'Tüccar Halvor', act: 'tuccar', npc: true }, ...(childHere() ? [{ id: 'child', name: 'Küçük Bran', act: 'npcChild', npc: true }] : [])];
// Krallar (VAHRAN): oyuncunun başkentinde kendi kralı durur. Kragmir'de Kral Volgar Demirdiş, Elentha'da Kral Edran.
// Şimdilik konuşma penceresi açar; kralların vereceği görevler sonra eklenecek (KING.quest boş).
export const KINGS = {
  ocak: { name: 'Kral Volgar Demirdiş', spot: [-5.6, 2.8, 0.7], cls: 'warrior', seed: 4101, color: '#c2321e',
    lines: ['Toprak, çekice boyun eğer. Bunu ocak başında öğrenir her Kragmir çocuğu.', 'Babam Ugrath o ovada yatıyor; dedem de, onun babası da. Üç yüz yıldır Vahran kanla sulanıyor.', 'Şamanım Yashka rünlerde bir el görüyor; ne ork eli ne insan eli, diyor. Kemikleri yaşlandı… belki de değil.', 'Şimdilik sana verecek bir işim yok, savaşçı. Örsünü bile, silahını hazır tut. Çağırdığımda gel.'] },
  sancak: { name: 'Kral Edran', spot: [-5.6, 2.8, 0.7], cls: 'warrior', seed: 4207, color: '#3d6fb6',
    lines: ['Derler ki kral, kılıcından çok verdiği söze güvenir. Kimi bunu övgü diye söyler, kimi yergi diye.', 'Savaşı kazanmak istemiyorum. Savaşı bitirmek istiyorum. Sarayda bu ikisinin aynı şey olmadığını bilen az.', 'Kız kardeşim Lira arşivde yarısı yanmış bir tutanak buldu. Kızıl Ay gecesi… kül renkli yabancılar. Kimseye söyleme.', 'Şimdilik sana verecek bir işim yok. Hazır ol; güvenebileceğim birine ihtiyacım olacak.'] },
};
const kingOf = () => KINGS[S?.faction] || null;
const kingNpc = () => { const k = kingOf(); return k ? [{ id: 'king', name: k.name, act: 'npcKing', npc: true }] : []; };
const KING_SVG = (c, orc) => `<svg viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="8" fill="#1a1612"/><path d="M8 64c3-14 12-19 24-19s21 5 24 19z" fill="${c}"/>${orc ? '<path d="M18 26l-6-4 7 8zM46 26l6-4-7 8z" fill="#5e7a3e"/>' : ''}<ellipse cx="32" cy="30" rx="11" ry="13" fill="${orc ? '#6f8a4a' : '#e2bf98'}"/><path d="M20 20l4-9 4 6 4-8 4 8 4-6 4 9z" fill="${orc ? '#8a8f96' : '#e8c25a'}" stroke="${orc ? '#3a3c40' : '#7a5a14'}"/><path d="M26 28l4 1M38 28l-4 1" stroke="#1a1612" stroke-width="1.6"/><circle cx="27.5" cy="31" r="1.5" fill="${orc ? '#e8b030' : '#2a3a5a'}"/><circle cx="36.5" cy="31" r="1.5" fill="${orc ? '#e8b030' : '#2a3a5a'}"/>${orc ? '<path d="M26 38q6 3 12 0" stroke="#2a1a10" fill="none" stroke-width="1.8"/><path d="M27 38l1-4 1 4M35 38l1-4 1 4" fill="#e8e0cc"/><rect x="31" y="37" width="2.4" height="2.6" fill="#8a8f96"/>' : '<path d="M27 38q5 3 10 0" stroke="#5a2a1a" fill="none" stroke-width="1.6"/><path d="M25 40q7 6 14 0" stroke="#8a6a3a" fill="none" stroke-width="2"/>'}</svg>`;
ACT.npcKing = () => { const k = kingOf(); if (!k) return; showModal(`<div class="npc-talk"><div class="npc-por">${KING_SVG(k.color, S.faction === 'ocak')}<b>${esc(k.name)}</b></div><div class="npc-txt">${k.lines.map(l => `<p>${l}</p>`).join('')}<div class="mbtns"><button class="btn red" data-a="gateDestan">Destan</button><button class="btn" data-a="closeModal">Emrindeyim</button></div></div></div>`); };
// Klan haritası: binalar klan penceresinin sekmelerini açar (ui-klan.js ACT.clan({ tab }))
const KLAN = [{ id: 'gate', name: 'Kapı', act: 'gateMenu' }, { id: 'k_hq', name: 'Karargâh', tab: 'hq' }, { id: 'k_salon', name: 'Klan Salonu', tab: 'genel' },
  { id: 'k_gorev', name: 'Görev Panosu', tab: 'gorev' }, { id: 'k_dukkan', name: 'Klan Dükkânı', tab: 'dukkan' }, { id: 'k_sancak', name: 'Sancak Direği', tab: 'sancak' },
  { id: 'k_av', name: 'Oba Avı', tab: 'av' }, { id: 'k_hisar', name: 'Hisar', tab: 'hisar' }, { id: 'k_hazine', name: 'Klan Hazinesi', tab: 'hq' }].map(b => b.tab ? { ...b, act: 'klanTab' } : b);
hooks.placeName = () => PLACE.cur === 'carsi' ? 'Yemin Pazarı' : PLACE.cur === 'klan' ? 'Klan toprağı' : (CAPITAL[S.faction] || GAME.hub); // sonuç ekranının dönüş düğmesi (en son bulunulan yer)
const blds = () => (PLACE.cur === 'carsi' ? [...CARSI, ...npcs()] : PLACE.cur === 'klan' ? KLAN : [...BUILDINGS, ...(hub2dOn() ? [{ id: 'karaborsa', name: 'Karaborsa', act: 'karaborsa' }] : []), ...kingNpc()]); // 2B başkentte Karaborsa da var (Aşama 3; işlev Çarşı'dakiyle aynı)
// Etiketin ekran noktası: 2B başkentte resim koordinatından, 3B'de sahne izdüşümünden
const posOf = id => active2d() ? pos2d(id) : (anchors[id] ? project(anchors[id]) : null);
ACT.klanTab = d => { const b = KLAN.find(x => x.id === (d?.id || LAST_BLD)); ACT.clan({ tab: b?.tab || 'hq' }); };
let LAST_BLD = null;
ACT.goKlan = () => { if (!S.clan) return ACT.clanhq(); if (PLACE.cur === 'klan') return showHub(); portalFlash(); PLACE.cur = 'klan'; document.documentElement.dataset.place = 'klan'; showHub(); toast(`Klan toprağı: ${S.clanTag?.n || 'klanının'} binaları.`); };
export const placeNow = () => PLACE.cur;
ACT.goCarsi = () => { if (PLACE.cur !== 'carsi') ACT.travel(); else showHub(); };
// Geçiş: kısa bir geçit parıltısı (yalnızca görünüm; v13-hub.css .tp-flash)
const portalFlash = () => { const g = document.getElementById('game') || document.body, el = document.createElement('div'); el.className = 'tp-flash'; el.setAttribute('aria-hidden', 'true'); g.appendChild(el); setTimeout(() => el.remove(), 900); };
ACT.travel = () => { portalFlash(); PLACE.cur = PLACE.cur === 'carsi' ? 'capital' : 'carsi'; document.documentElement.dataset.place = PLACE.cur; showHub(); toast(PLACE.cur === 'carsi' ? 'Yemin Pazarı: iki ırkın buluştuğu tarafsız pazar kasabası.' : `${CAPITAL[S.faction] || GAME.hub}: ırkının başkenti.`); };
// Kapı (VAHRAN): her yerde ortadaki geçit; nereye gidileceği seçilir. CZ - PK'ya da buradan girilir (ayrı binası yok).
// Öğretici sürerken doğrudan sefere açılır (öğretici ipuçları 'Kapı'ya dokun' der).
ACT.gateMenu = () => { // 19 Kas: her yerde ve öğreticide de önce seçim penceresi açılır (otomatik ışınlama yok)
  const here = PLACE.cur, cz = locked('arena');
  const opt = (a, ic, t, sub, off) => `<button class="btn ${off ? '' : 'red'}" data-a="${a}" ${off ? 'disabled' : ''} style="display:flex;align-items:center;gap:10px;justify-content:flex-start"><span class="ico g1 sm">${svg(ic)}</span><span style="text-align:left"><b>${t}</b><br><small>${sub}</small></span></button>`;
  showModal(`<h2>Kapı</h2><div class="in"><div class="mbtns" style="flex-direction:column;align-items:stretch">${[
    opt('gateGo', 'battle', 'Sefer', 'Bölgeler ve zindanlar'),
    opt('gateDestan', 'book', 'Destan', 'Tarihin Külleri: sekiz bölüm'),
    here !== 'capital' ? opt('gateCapital', 'gate', esc(CAPITAL[S.faction] || GAME.hub), 'Irkının başkenti') : '',
    here !== 'carsi' ? opt('gateCarsi', 'market', 'Yemin Pazarı', 'İki ırkın buluştuğu tarafsız pazar') : '',
    S.clan && here !== 'klan' ? opt('gateKlan', 'clan', 'Klan toprağı', 'Klanının binaları') : '',
    opt('gateCz', 'arena', 'CZ - PK', cz ? lockNote('arena') : 'Meydan ve Şan Divanı', cz),
  ].join('')}</div></div>`, 'gatemenu');
};
ACT.gateGo = () => { closeModal(); ACT.gate(); };
ACT.gateDestan = () => { closeModal(); ACT.destan(); };
ACT.gateCapital = () => { closeModal(); ACT.goCapital(); };
ACT.gateCarsi = () => { closeModal(); ACT.goCarsi(); };
ACT.gateKlan = () => { closeModal(); ACT.goKlan(); };
ACT.gateCz = () => { if (locked('arena')) return toast(`CZ - PK: ${lockNote('arena')}`); closeModal(); ACT.czpk(); };
ACT.goCapital = () => { if (PLACE.cur === 'carsi') return ACT.travel(); if (PLACE.cur === 'klan') { portalFlash(); PLACE.cur = 'capital'; document.documentElement.dataset.place = 'capital'; showHub(); toast(`${CAPITAL[S.faction] || GAME.hub}: ırkının başkenti.`); } };

// Taraf havası: arayüz kabuğu kök öznitelikle (html[data-faction]) renklenir; 3B sahne ensureEnv'e verilen havayla kurulur.
// Hesap varken oyuncunun tarafı geçerlidir; açılış ekranında dokunulan taraf önizlenir.
const setMood = f => { const r = document.documentElement; if (f) { if (r.dataset.faction !== f) r.dataset.faction = f; } else delete r.dataset.faction; };
onState(s => { if (s) setMood(s.faction); });

// ---------- Hesap açılışı ----------
// Karakter oluşturma ve seçme ui-karakter.js'tedir (sürüm 12). Eski ad: showCreate.
export const showCreate = () => ACT.charCreate();

// ---------- Vahran Sınırı ----------
let hudTimer = null, anchors = {};
// Kadraj: yatay görüş açısı sabittir (binalar her ekran oranında aynı yatay konuma düşer); sahne, sol sütuna yer
// açmak için biraz sağa alınır. Dikeyde, Karargâh etiketinden meydanın ön kenarına kadar olan blok kaynak çubuğu
// ile alt çubuk arasına ortalanır; sığmıyorsa üste yaslanır (meydanın önü alt çubuğun arkasında kalır).
const HUB_FOV = 79, HUB_X = -0.07, FRONT = { x: 0, y: 0, z: 5.6 };
let fitY = -0.02;
// Omuz üstü kadraj (19 Kas, kullanıcının referansı): kamera karakterin arkasında, kapıya ve kale duvarına bakar
const HUB_CAM = [0.6, 7, 14.8], HUB_LOOK = [0, 2.2, -4];
function drawMm() {
  const cv = hud.querySelector('.mm-cv'); if (!cv) return;
  const pts = Object.entries(anchors).filter(([id]) => id !== 'me').map(([id, v]) => ({ id, x: v.x, z: v.z }));
  drawMinimap(cv, pts, { x: HERO_SPOT[0][0], z: HERO_SPOT[0][1] }, PLACE.cur === 'carsi' ? 'orta' : S.faction);
}
function fitHub() {
  const top0 = PLACE.cur === 'carsi' ? 'monument' : PLACE.cur === 'klan' ? 'k_hq' : 'clanhq';
  const el = hud.querySelector(`.blabel[data-id="${top0}"]`), res = hud.querySelector('.res'), dock = hud.querySelector('.dock');
  if (!el || !res || !dock) return;
  const top = project(anchors[top0]).y - el.offsetHeight, bottom = project(FRONT).y;
  const a = res.offsetTop + 32, b = dock.offsetTop - 6, want = a + Math.max(0, (b - a - (bottom - top)) / 2);
  if (Math.abs(top - want) > 2) { fitY = Math.max(-0.25, Math.min(0.25, fitY + (want - top) / view.h)); setShift(HUB_X, fitY); }
}
// Bina etiketleri binanın ekrandaki yerine konur; bir arayüz parçasının (sohbet kutusu, şeritler, kaynak çubuğu) ya da
// başka bir etiketin üstüne düşen etiket en kısa yoldan kenara itilir. Plan birkaç karede bir yapılır, itme yumuşakça uygulanır.
const NUDGE_UI = ['.pcard', '.premrow', '.lrail', '.krail', '.res', '.wclock', '.wterr', '.dock', '.mmap', '.hotbar', '.qtrk', '.expbar'], NUDGE_GAP = 3, NUDGE_MAX = 140;
let nudges = {};
function planNudges() {
  const rot = document.documentElement.classList.contains('rot'), iw = innerWidth;
  const box = e => { const r = e.getBoundingClientRect(); return rot ? [r.top, iw - r.right, r.bottom, iw - r.left] : [r.left, r.top, r.right, r.bottom]; };
  const ui = [...NUDGE_UI.map(q => hud.querySelector(q)), chatbar].filter(e => e && !e.hidden && e.getClientRects().length).map(box);
  const L = [...hud.querySelectorAll('.blabel')].filter(el => posOf(el.dataset.id)).map(el => { const q = posOf(el.dataset.id), w = el.offsetWidth, h = el.offsetHeight; return { id: el.dataset.id, r: [q.x - w / 2, q.y - h, q.x + w / 2, q.y], dx: 0, dy: 0 }; });
  const hit = (a, b) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];
  const move = (l, dx, dy) => { l.dx += dx; l.dy += dy; l.r = [l.r[0] + dx, l.r[1] + dy, l.r[2] + dx, l.r[3] + dy]; };
  const fits = (l, dx, dy) => l.r[0] + dx >= 2 && l.r[1] + dy >= 2 && l.r[2] + dx <= view.w - 2 && l.r[3] + dy <= view.h - 2 && Math.abs(l.dx + dx) <= NUDGE_MAX && Math.abs(l.dy + dy) <= NUDGE_MAX;
  for (const l of L) for (let pass = 0; pass < 3; pass++) for (const u of ui) { // bir parçadan kaçan etiket komşusuna girebilir: birkaç tur
    if (!hit(l.r, u)) continue;
    const way = [[u[0] - l.r[2] - NUDGE_GAP, 0], [u[2] - l.r[0] + NUDGE_GAP, 0], [0, u[1] - l.r[3] - NUDGE_GAP], [0, u[3] - l.r[1] + NUDGE_GAP]].filter(d => fits(l, d[0], d[1])).sort((a, b) => Math.abs(a[0] + a[1]) - Math.abs(b[0] + b[1]))[0];
    if (way) move(l, way[0], way[1]);
  }
  for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) {
    const a = L[i], b = L[j];
    if (!hit(a.r, b.r)) continue;
    const ox = Math.min(a.r[2], b.r[2]) - Math.max(a.r[0], b.r[0]), oy = Math.min(a.r[3], b.r[3]) - Math.max(a.r[1], b.r[1]);
    const v = oy <= ox, k = v ? 1 : 0, d = (v ? oy : ox) / 2 + NUDGE_GAP / 2, first = a.r[k] <= b.r[k] ? a : b, second = first === a ? b : a;
    const d1 = v ? [0, -d] : [-d, 0], d2 = v ? [0, d] : [d, 0];
    if (fits(first, d1[0], d1[1])) move(first, d1[0], d1[1]);
    if (fits(second, d2[0], d2[1])) move(second, d2[0], d2[1]);
  }
  for (const l of L) { const n = nudges[l.id] || (nudges[l.id] = { x: 0, y: 0, tx: 0, ty: 0 }); n.tx = l.dx; n.ty = l.dy; }
}
// Karakter portalın önünde durur
const HERO_SPOT = [[0, 2.8]]; // 19 Kas: kapının önünde ortada, biraz ileride (sohbet kutusu sola uzadı)
export function showHub() {
  if (hooks.orman?.()) return; // açılış ormanı (orman.js): öğreticinin ilk görevi bitene dek ana üs yerine orman kurulur
  closeWin(true); hideBattleUI(); closeModal();
  clearScene(); if (PLACE.cur === 'klan' || !hub2dOn()) ensureEnv('hub', S.faction); setMood(S.faction); // 2B başkentte 3B ortam kurulmaz
  if (S.battle) run('battle.abandon'); // sonucu gönderilemeyen savaş kaydı açık kalmasın
  if (PLACE.cur === 'klan' && !S.clan) { PLACE.cur = 'capital'; document.documentElement.dataset.place = 'capital'; } // klandan çıkınca
  const carsi = PLACE.cur === 'carsi', klan = PLACE.cur === 'klan';
  if (!klan && hub2dOn()) { // 20 Kas Aşama 3: 2B başkent (21 Kas: Yemin Pazarı da 2B) — şehir resmi + dokunma alanları; 3B sahne çizilmez (pil)
    hideTown(); anchors = {}; show2d(carsi ? 'carsi' : S.faction); RENDER.off = true; nudges = {};
    let f2 = 0;
    setUpdater(() => {
      if (++f2 > 1 && f2 % 6 === 2) planNudges();
      for (const el of hud.querySelectorAll('.blabel')) {
        const p = posOf(el.dataset.id), n = nudges[el.dataset.id];
        if (!p) { if (el.style.display !== 'none') el.style.display = 'none'; continue; }
        if (el.style.display === 'none') el.style.display = '';
        if (n) { n.x += (n.tx - n.x) * 0.5; n.y += (n.ty - n.y) * 0.5; }
        const tf = `translate(${Math.round((p.x + (n ? n.x : 0)) * 2) / 2}px, ${Math.round((p.y + (n ? n.y : 0)) * 2) / 2}px) translate(-50%,-100%)`;
        if (el._tf !== tf) { el._tf = tf; el.style.transform = tf; }
      }
    });
    hud.hidden = false; renderHud(); showChatBar();
    clearInterval(hudTimer); hudTimer = setInterval(() => { if (!hud.hidden) renderEnergy(); }, 1000);
    return;
  }
  anchors = showTown(blds().filter(b => !b.npc).map(b => b.id), carsi ? 'orta' : S.faction, S.clan ? S.clanTag?.b : null, carsi ? CARSI_SPOT : klan ? KLAN_SPOT : null); setHfov(HUB_FOV); setShift(HUB_X, fitY);
  if (carsi) for (const n of npcs()) { // tüccar: kaftanlı yetişkin · çocuk: küçük boylu; ikisi de silahsız, yalnızca görünüm
    const [x, z, f] = NPC_SPOT[n.id], u = botParty(n.id === 'child' ? 77 : 55, 10, 0.3, 'sancak').units[0], L = unitLook(u);
    const k = n.id === 'child' ? 0.6 : 1.05;
    spawn({ ...u, look: { ...L.look, scale: k, weapon: 'none', shield: false, helmet: n.id === 'child' ? 'none' : 'hood' }, model: { ...L.model, weapon: 'none', shield: false, hero: false } }, x, z, f);
    anchors[n.id] = new THREE.Vector3(x, 0.4 + 2.5 * k, z);
  }
  if (!carsi && !klan && kingOf()) { // kral: tarafının savaşçısı, iri ve taçlı görünüm (yalnızca görünüm; konuşma ACT.npcKing)
    const k = kingOf(), [x, z, f] = k.spot, u = botParty(k.seed, 80, 0.9, S.faction).units[0], L = unitLook(u);
    spawn({ ...u, look: { ...L.look, scale: 1.25 }, model: { ...L.model, hero: false } }, x, z, f);
    anchors.king = new THREE.Vector3(x, 0.4 + 2.5 * 1.25, z);
  }
  partyUnits(S).slice(0, 1).forEach((u, i) => { spawn({ ...u, ...unitLook(u) }, HERO_SPOT[i][0], HERO_SPOT[i][1], Math.PI); }); // karakter: sırtı kameraya, yüzü kapıya (19 Kas omuz üstü kadraj)
  if (!carsi && !klan && anchors.wheel) anchors.wheel = anchors.wheel.clone().setY(1.6); // omuz üstü kadrajda çark etiketi sağ üst panellerin altına düşsün
  anchors.me = new THREE.Vector3(HERO_SPOT[0][0], 3.25, HERO_SPOT[0][1]);
  if (carsi) { // Yemin Pazarı'nda iki ırktan gezginler tezgâhların önünde durur (yalnızca görünüm)
    const spots = [[-5.2, 1.8, 0.6], [-4.6, -2.4, 0.9], [6.8, 2.2, -0.6], [9.6, 0.4, -0.9]];
    ['sancak', 'sancak', 'ocak', 'ocak'].forEach((f, i) => { const u = botParty(900 + i * 37 + (S.lvl | 0), Math.max(5, S.lvl), 0.5, f).units[0]; spawn({ ...u, ...unitLook(u) }, spots[i][0], spots[i][1], spots[i][2]); });
  }
  let next = 2, frame = 0;
  nudges = {};
  setUpdater((dt, t) => {
    camRig.pos.set(HUB_CAM[0] + Math.sin(t * 0.12) * 0.35, HUB_CAM[1], HUB_CAM[2]); camRig.look.set(HUB_LOOK[0], HUB_LOOK[1], HUB_LOOK[2]);
    updateTown(dt, t);
    if (++frame > 2 && frame % 20 === 3) planNudges();
    if (mmDirty || frame % 45 === 0) { mmDirty = false; drawMm(); }
    for (const el of hud.querySelectorAll('.blabel')) {
      if (!anchors[el.dataset.id]) { if (el.style.display !== 'none') el.style.display = 'none'; continue; } // sahnesi henüz kurulmamış NPC etiketi (öğretici adımı değişti; ui-ogretici yeniden kurar)
      const p = project(anchors[el.dataset.id]), n = nudges[el.dataset.id];
      if (n) { n.x += (n.tx - n.x) * 0.3; n.y += (n.ty - n.y) * 0.3; }
      // yarım piksele yuvarlanır ve yalnızca değişince yazılır: her karede stil yazmak sürekli stil hesabı demektir
      const tf = `translate(${Math.round((p.x + (n ? n.x : 0)) * 2) / 2}px, ${Math.round((p.y + (n ? n.y : 0)) * 2) / 2}px) translate(-50%,-100%)`;
      if (el._tf !== tf) { el._tf = tf; el.style.transform = tf; }
    }
    next -= dt;
    if (next < 0 && world.actors.length) { next = 2.5 + Math.random() * 2; const c = world.actors[Math.floor(Math.random() * world.actors.length)].char; Math.random() < 0.5 ? c.swing() : c.cheer(); }
  });
  hud.hidden = false; renderHud(); showChatBar();
  clearInterval(hudTimer); hudTimer = setInterval(() => { if (!hud.hidden) renderEnergy(); }, 1000);
}
ACT.hub = showHub;
function renderEnergy() {
  const el = $('#enr'); if (!el) return;
  const { e, left } = energyNow();
  const h = `<b>${e}/${ENERGY.max}</b>${left ? `<small>${Math.floor(left / 60000)}:${String(Math.floor(left / 1000) % 60).padStart(2, '0')}</small>` : ''}`;
  if (el._h !== h) { el._h = h; el.innerHTML = h; }
}
const freePoints = () => partyIds(S).reduce((a, c) => a + statPointsFree(S, c) + skillPointsFree(S, c), 0); // karakterin dağıtılmamış puanı
const questReady = () => QUESTS.filter(q => questProgress(S, q) >= q.need && !S.daily.qdone[q.id]).length + (S.daily.gift ? 0 : 1) + mqReady(S);
function buildingBadge(id) {
  if (id === 'mine' && !locked('mine')) return mineStock(S, now()) >= mineRate(S, now()) * 2;
  return false;
}
// Oyuncu kartının hemen altında üyelik şeridi: kademe ve kalan gün, yoksa çağrı
function premBar() {
  const t = myTier(), days = t ? Math.max(1, Math.ceil((S.premium.until - now()) / 86400000)) : 0;
  return `<div class="premrow"><button class="prem t${t}" data-a="premium"><i>${svg(t ? 'san' : 'gem')}</i><b>${t ? PREMIUM[t].name + ' Premium' : 'Premium'}</b><small>${t ? `${days} gün kaldı` : `+%${Math.round(PREMIUM.at(-1).xp * 100)} kazanç`}</small></button></div>`; // yanındaki bayraklı çip (.wterr, ui-dunya.js) bölge hâkimiyetidir: Diyar Haritası'nı açar. Premium'un geniş dokunma alanı (::after) çipin üstüne taşmasın diye v13-hub.css .prem'i konumlu yapar
}
// Görev izleyici (19 Kas, 2. sürüm): sol üstte, Premium şeridinin altında. Kapalıyken (varsayılan) yalnız ana görev satırı;
// açıkken geniş ve alçak bir pano: ana görev + iki sütunda günlük görevler + Tümünü gör. Durum dd_qtrk'ta saklanır.
let qOpen = (() => { try { return localStorage.getItem('dd_qtrk') === '1'; } catch { return false; } })();
// Ana görevin istediği iş (acik alanının ilk cümlesi): izleyicide görevin adı değil ne istediği yazar (kullanıcı 19 Kas)
const mqAsk = n => String(n.acik || n.ad).split(/[;.]/)[0].trim();
const qRow = (a, id, label, cur, need, rd, cls = '') => `<button class="qt-row ${cls} ${rd ? 'rdy' : ''}" data-a="${a}" data-id="${id}"><b>${esc(label)}</b><em>${rd ? 'Al' : `${cur}/${need}`}</em><i style="width:${Math.min(100, 100 * cur / need)}%"></i></button>`;
function questBox() {
  if (!S.tut?.end) return '';
  const n = mqNext(S);
  const dq = QUESTS.filter(q => !S.daily.qdone?.[q.id]).map(q => ({ q, c: questProgress(S, q) })).sort((a, b) => (b.c >= b.q.need) - (a.c >= a.q.need) || b.c / b.q.need - a.c / a.q.need);
  const ready = dq.filter(x => x.c >= x.q.need).length;
  const main = n ? qRow('mqTrack', n.id, mqAsk(n), mqProg(S, n), n.need, mqState(S, n) === 'ready', 'main') : `<span class="qt-none">Ana görevler tamam</span>`;
  const tog = `<button class="qt-tog" data-a="qboxToggle" title="${qOpen ? 'Küçült' : 'Görevleri aç'}">${qOpen ? '−' : '+'}${!qOpen && ready ? `<span class="badge">${ready}</span>` : ''}</button>`;
  return `<div class="qtrk ${qOpen ? 'open' : ''}"><div class="qt-hd" data-a="questLog">Görevler</div><div class="qt-top"><span class="qt-k"><i>${svg('quest')}</i>Ana görev</span>${main}${tog}</div>${(() => { const C = DESTAN.find(c => chapterOpen(S, c.id) && !chapterDone(S, c.id)); return C ? `<div class="qt-top qt-ds" data-a="destanPlay" data-id="${C.id}"><span class="qt-k"><i>${svg('book')}</i>Destan</span><span class="qt-dsn">${C.roman} · ${esc(C.name)} <b>açık</b></span></div>` : ''; })()}${qOpen ? `<div class="qt-grid">${dq.slice(0, 4).map(({ q, c }) => qRow(c >= q.need ? 'quests' : 'questGo', q.id, q.name, c, q.need, c >= q.need)).join('')}</div><button class="qt-all" data-a="questLog">Tümünü gör</button>` : ''}</div>`;
}
// görev izleyici sohbet kutusunun hemen üstünde durur: sohbetin yüksekliği CSS'e --chath olarak verilir
try { new ResizeObserver(() => document.documentElement.style.setProperty('--chath', `${chatbar.offsetHeight || 92}px`)).observe(chatbar); } catch {}
ACT.qboxToggle = () => { qOpen = !qOpen; try { localStorage.setItem('dd_qtrk', qOpen ? '1' : '0'); } catch {} renderHud(); };
// Savaş düğmesi: savaş kapılarını tek pencerede toplar
ACT.savas = () => {
  const cz = locked('arena');
  const opt = (a, ic, t, sub, off) => `<button class="sv-opt ${off ? 'off' : ''}" data-a="${a}" ${off ? 'disabled' : ''}><i>${svg(ic)}</i><span><b>${t}</b><small>${sub}</small></span></button>`;
  showModal(`<h2>Savaş</h2><div class="in"><div class="sv-grid">${[
    opt('svGo', 'battle', 'Sefer', 'Bölgeler, bosslar ve zindanlar'),
    opt('svQuick', 'energy', 'Hızlı Av', 'Açık en yüksek bölümde tek savaş'),
    opt('svCz', 'arena', 'Meydan', cz ? lockNote('arena') : 'Oyunculara karşı (PvP)', cz),
    opt('svDivan', 'trophy', 'Şan Divanı', cz ? lockNote('arena') : 'CZ - PK ve rütbe', cz),
  ].join('')}</div></div>`);
};
ACT.svGo = () => { closeModal(); ACT.gateGo(); };
ACT.svQuick = () => { closeModal(); ACT.quick(); };
ACT.svCz = () => { closeModal(); ACT.gate({ tab: 'pvp' }); };
ACT.svDivan = () => { closeModal(); ACT.czHall ? ACT.czHall() : ACT.czpk(); };
// Tümünü gör: alınmış bütün görevler (ana + günlük + haftalık + aylık) tek listede
ACT.questLog = () => openWin({ title: 'Görev Defteri', render: questLogHtml });
function questLogHtml() {
  const sec = (t, sub, rows) => rows.length ? `<section class="ql-sec"><h3>${t}<small>${sub}</small></h3>${rows.join('')}</section>` : '';
  const row = (a, tab, id, name, cur, need, done, ask = '') => `<button class="ql-row ${done ? 'done' : cur >= need ? 'rdy' : ''}" data-a="${a}" data-tab="${tab}" data-id="${id}"><b>${esc(name)}${ask ? `<small>${esc(ask)}</small>` : ''}</b><span class="ql-bar"><i style="width:${Math.min(100, 100 * cur / need)}%"></i></span><em>${done ? 'Alındı' : cur >= need ? 'Ödül hazır' : `${fmt(cur)}/${fmt(need)}`}</em></button>`;
  const n = mqNext(S);
  const wd = S.weekly?.done || {}, md = S.monthly?.done || {};
  return `<div class="qlog">${[
    sec('Ana görev', 'Hikâye sırasıyla', n ? [row('mqTrack', 'main', n.id, n.ad, mqProg(S, n), n.need, false, n.acik)] : []),
    sec('Günlük', '00:00’da yenilenir', QUESTS.map(q => row('qlOpen', 'daily', q.id, q.name, questProgress(S, q), q.need, !!S.daily.qdone?.[q.id]))),
    sec('Haftalık', 'Pazartesi yenilenir', WEEKLY.filter(q => q.id !== 'daily').map(q => row('qlOpen', 'weekly', q.id, q.name, weeklyProgress(S, q), q.need, !!wd[q.id]))),
    sec('Aylık', 'Ayın 1’inde yenilenir', MONTHLY.filter(q => q.id !== 'daily').map(q => row('qlOpen', 'monthly', q.id, q.name, monthlyProgress(S, q), q.need, !!md[q.id]))),
  ].join('')}</div>`;
}
ACT.qlOpen = d => ACT.quests({ tab: d.tab });
// Mini harita başlığı ve koordinatı (görsel: "Kragmir – Demirçukur (349, 611)"); koordinat yere göre sabit
const MAP_NAME = { ocak: 'Kragmir – Demirçukur', sancak: 'Elentha – Işık Meydanı' };
const mapTitle = () => PLACE.cur === 'carsi' ? 'Yemin Pazarı – Ortaçarşı' : PLACE.cur === 'klan' ? `Klan Toprağı – ${S.clanTag?.n || 'Karargâh'}` : MAP_NAME[S.faction] || capitalOf(S.faction);
const mapXY = () => PLACE.cur === 'carsi' ? [512, 498] : PLACE.cur === 'klan' ? [208, 377] : S.faction === 'ocak' ? [349, 611] : [664, 402];
let mmDirty = true;
ACT.hotbar = () => ACT.party({ tab: 'skill' });
function renderHud() {
  if (hud.hidden || !S) return;
  const pts = freePoints(), qr = questReady();
  const btn = (a, icon, label, badge, cls = '') => `<button class="dbtn ${cls}" data-a="${a}"><i>${svg(icon)}</i><span>${label}</span>${badge ? `<span class="badge">${badge}</span>` : ''}</button>`;
  const u0 = partyUnits(S)[0] || {}, carsi = PLACE.cur === 'carsi', klan = PLACE.cur === 'klan';
  const lbl = b => { const lk = b.key && locked(b.key); return `<button class="blabel ${lk ? 'lock' : ''} ${b.cls || ''}" data-a="building" data-id="${b.id}">${b.cls === 'portal' ? '<i class="bl-glow" aria-hidden="true"></i>' : ''}${plate(ROLE[b.id] ?? '', b.name)}${lk ? `<small><i>${svg('lock')}</i>Sv. ${UNLOCK[b.key]}</small>` : ''}${!lk && buildingBadge(b.id) ? '<span class="dot"></span>' : ''}</button>`; };
  hud.innerHTML = `
    <div id="blabels">${blds().filter(b => !b.nolabel).map(lbl).join('')}<button class="blabel plate me" data-a="profile" data-id="me"><b><i class="me-sh">${svg('shield')}</i>${esc(S.name)}</b><span class="me-bar"><i></i></span></button></div>
    <button class="pcard uf" data-a="profile">${unitFrame({ avatar: avatarImg('ava'), name: tName(S.name, S.ach?.title, rankIdx(S)), lvl: S.lvl, hp: u0.maxHp || 0, mp: u0.maxMp || 0 })}</button>
    ${premBar()}
    <div class="lrail"><button class="lbtn" data-a="drawer"><i>${svg('grid')}</i><span>Menü</span>${me.req ? `<span class="badge">${me.req}</span>` : supportBadge().tickets || seriesNewCount(S) ? '<span class="badge dot md-dot"></span>' : ''}</button><button class="lbtn" data-a="news"><i>${svg('news')}</i><span>Duyuru</span>${supportBadge().news ? '<span class="badge dot"></span>' : ''}</button><button class="lbtn" data-a="mail"><i>${svg('mail')}</i><span>Posta</span></button><button class="lbtn" data-a="codex"><i>${svg('book')}</i><span>Ansiklopedi</span></button><button class="lbtn" data-a="diyarMap" title="Diyar Haritası"><i>${svg('map')}</i><span>Harita</span></button></div>
    <div class="res">
      <div class="pill" title="Enerji" data-a="shop">${ri('energy', '#7fe08a')}<span id="enr" style="display:contents"></span><button data-a="shop">+</button></div>
      <div class="pill" title="Akçe">${ri('akce')}<b>${fmt(S.akce)}</b></div>
      <div class="pill" title="Yakut" data-a="yakutAl">${ri('gem', '#ff5a6a')}<b>${fmt(S.yakut)}</b><button data-a="yakutAl" title="Yakut al">+</button></div>
    </div>
    ${''/* 20 Kas (kullanıcı): mini harita ana ekrandan kalktı; Diyar Haritası sol rayda */}
    ${active2d() ? '<button class="savas2d" data-a="savas" aria-label="Savaş" title="Savaş"><span>Savaş</span></button>' : ''}<div class="dock">${btn('party', 'party', 'Karakter', pts || '')}${btn('bag', 'bag', 'Çanta', S.items.length >= BAG_LIMIT ? '!' : '')}${btn('quests', 'quest', 'Görevler', qr || '')}${btn('clan', 'clan', 'Klan')}${btn('shop', 'cart', 'Kervan', '', 'shop')}${btn('savas', 'battle', 'Savaş', '', 'savas-d')}</div>
    ${''/* 20 Kas (kullanıcı): alttaki yetenek çubuğu kalktı (yetenekler Karakter → Yetenek'te) */}
    ${expHtml(S.xp, xpNeed(S.lvl))}
    ${starterBtn()}
    ${questBox()}
    ${DEV ? `<div class="dev">${LOCAL ? 'DENEME SÜRÜMÜ<span> · kayıt bu cihazda</span>' : 'TEST SUNUCUSU'}</div>` : ''}`;
  mmDirty = true;
  renderEnergy();
}
hooks.hud = renderHud;
// Binanın 3B modeline dokunmak da etiketine dokunmakla aynıdır (town.js seçimi yapar; pencere ya da modal açıkken çalışmaz)
onHit(id => { if (!hud.hidden && blds().some(b => b.id === id)) { ACT.building({ id }); hooks.sfx?.('tap', 'building'); } });
onTownTap(id => { if (!hud.hidden && blds().some(b => b.id === id)) ACT.building({ id }); });
ACT.czpk = () => showModal(`<h2>CZ - PK</h2><div class="in"><div class="mbtns" style="flex-direction:column;align-items:stretch"><button class="btn red" data-a="czHall">Şan Divanı</button><button class="btn" data-a="czArena">Meydan</button><button class="btn" data-a="czMarket">Meydan Marketi</button></div></div>`);
ACT.czHall = () => { closeModal(); ACT.hall(); };
ACT.czArena = () => { closeModal(); ACT.gate({ tab: 'pvp' }); };
ACT.czMarket = () => { closeModal(); ACT.shop(); };
ACT.building = d => { const b = blds().find(x => x.id === d.id); LAST_BLD = d.id; if (b.key && locked(b.key)) return toast(`${b.name}, seviye ${UNLOCK[b.key]} olunca açılır.`); ACT[b.act](); };
// Sıradaki (geçilmemiş ilk açık) stage'in savaş öncesi ekranı — "5 savaş kazan" görevinin Git düğmesi kullanır
ACT.quick = () => {
  for (const Z of ZONES) for (const s of zoneStages(Z.id)) if (!S.stages[s.id] && stageOpen(S, s.id)) return ACT.stage({ id: s.id });
  ACT.stage({ id: S.lastStage });
};
// Çanta penceresi: ui-envanter.js
ACT.drawer = () => showModal(`<h2>Menü</h2><div class="in">
  ${[['rankMenu', 'rank', 'Sıralama'], ['rehber', 'book', 'Rehber: oyunun bütün sistemleri'], ['friendsMenu', 'party', `Arkadaşlar${me.req ? ` · ${me.req} yeni istek` : ''}`], ['promoMenu', 'gift', 'Promosyon kodu kullan'], ['supportMenu', 'mail', 'Sorun / Teknik Destek'], ['seriesOpen', 'film', 'Mini Dizi'], ['server', 'clan', 'Sunucu: Ares'], ['fullscreen', 'expand', 'Tam ekran'], ...(LOCAL ? [] : [['logoutMenu', 'lock', 'Çıkış yap']]), ['charSwitchMenu', 'party', 'Karakter değiştir']].map(([a, i, t]) => `<button class="ibtn" data-a="${a}"><span class="ico g1 sm">${svg(i)}</span><span><b>${t}</b></span>${a === 'seriesOpen' && seriesNewCount(S) ? '<span class="badge dot md-dot"></span>' : ''}</button>`).join('')}
  </div>`, 'menu');
ACT.rankMenu = () => { closeModal(); ACT.rank(); };
ACT.logoutMenu = () => confirmBox('Çıkış yap', 'Bu cihazdaki oturumun kapanır. Karakterlerin sunucuda hesabında kalır.', () => logout(), 'Çıkış yap');
// Menü kısayolları: pencereyi kapatıp ilgili ekranı açar
// Tam ekran aç/kapa (tarayıcı izin vermezse, ör. iPhone Safari ya da gömülü çerçeve, kısa uyarı)
ACT.fullscreen = async () => {
  closeModal();
  const d = document, el = d.documentElement, on = d.fullscreenElement || d.webkitFullscreenElement;
  try {
    if (on) await (d.exitFullscreen || d.webkitExitFullscreen).call(d);
    else if (el.requestFullscreen) await el.requestFullscreen({ navigationUI: 'hide' });
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    else throw 0;
  } catch { toast('Bu tarayıcı tam ekrana izin vermiyor.'); }
};
ACT.mnMain = () => { closeModal(); ACT.quests({ tab: 'main' }); };
ACT.charSwitchMenu = () => { closeModal(); clearInterval(hudTimer); hideChatBar(); ACT.charSwitch(); };
ACT.mnFish = () => { closeModal(); ACT.balik ? ACT.balik() : toast('Balık tutma şu an açılamadı.'); };
// Klansız oyuncu: Hisar ve İttifak klan sistemidir; kırık/boş ekran yerine ne olduğunu anlatan, klana yönlendiren pencere
ACT.mnHisar = () => {
  closeModal();
  if (S.clan) return ACT.clanHisar ? ACT.clanHisar() : ACT.clan({ tab: 'hisar' });
  showModal(`<h2>Hisar ve İttifak</h2><div class="in"><p>Hisar kuşatması ve ittifak <b>klan</b> sistemidir; katılmak için bir klana üye olmalısın.</p>
    <ul class="mn-hs"><li>Kuşatma haftada bir yapılır; hisarı alan klan ırk vergisinin üçte birini alır.</li><li>Üçte biri hisar sahibinin ittifak ortaklarına, üçte biri ırklar arası vergi havuzuna gider.</li><li>İttifaktaki klanlar birbirinin süreli işlerini hızlandırabilir (en çok üçte birine kadar).</li></ul>
    <div class="mbtns"><button class="btn green" data-a="clan">${locked('clan') ? 'Klan (kilitli)' : 'Klan bul / kur'}</button><button class="btn" data-a="closeModal">Kapat</button></div></div>`);
};
ACT.mnFree = () => { closeModal(); ACT.shop({ tab: 'free' }); };

ACT.gateZones = () => { closeModal(); ACT.gate({ tab: 'zones' }); };
ACT.gateEvents = () => { closeModal(); ACT.gate({ tab: 'events' }); };
ACT.gatePvp = () => { closeModal(); ACT.gate({ tab: 'pvp' }); };
ACT.chatMenu = () => { closeModal(); ACT.chatOpen(); };
ACT.premiumMenu = () => { closeModal(); ACT.premium(); };
// Promosyon kodu: hesap başına bir kez; ödül hemen verilir (shared/promo.js)
ACT.promoMenu = () => showModal(`<h2>Promosyon kodu</h2><div class="in"><p class="mut">Etkinliklerde ve duyurularda paylaşılan kodu yaz. Her kod hesap başına bir kez kullanılır.</p>
  <div class="crow"><input type="text" id="promo" maxlength="32" placeholder="Kod" autocomplete="off" data-enter="promoDo" style="text-transform:uppercase"></div>
  <div class="mbtns"><button class="btn green" data-a="promoDo">Kullan</button><button class="btn" data-a="closeModal">Vazgeç</button></div></div>`);
ACT.promoDo = async () => { const code = ($('#promo')?.value || '').trim(); if (!code) return toast('Önce kodu yaz.'); const r = await run('promo.redeem', { code }); if (r) { closeModal(); lootToast(r.loot); toast('Kod kullanıldı, ödülün çantanda.'); } };
// Profil: kahraman kartı. Üstte avatar, ad, ırk, seviye, güç ve deneyim; sağ üstte ayarlar simgesi;
// ortada üyelik / klan / ırk bonusu şeridi; altta istatistik kutuları ve eylemler.
const PF_GEAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10.3 2h3.4l.5 2.6 1.9.8 2.2-1.5 2.4 2.4-1.5 2.2.8 1.9 2.6.5v3.4l-2.6.5-.8 1.9 1.5 2.2-2.4 2.4-2.2-1.5-1.9.8-.5 2.6h-3.4l-.5-2.6-1.9-.8-2.2 1.5-2.4-2.4 1.5-2.2-.8-1.9L2 13.7v-3.4l2.6-.5.8-1.9-1.5-2.2 2.4-2.4 2.2 1.5 1.9-.8zM12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z"/></svg>';
ACT.profile = () => {
  const st = S.stats, F = FACTIONS[S.faction], t = myTier(), need = xpNeed(S.lvl), xpPct = Math.min(100, 100 * S.xp / need);
  const winRate = st.battles ? Math.round(100 * st.wins / st.battles) : 0, upRate = st.upOk + st.upFail ? Math.round(100 * st.upOk / (st.upOk + st.upFail)) : 0;
  const tile = (icon, label, val, sub = '') => `<div class="pf-tile">${ri(icon)}<span><small>${label}</small><b>${val}</b>${sub ? `<em>${sub}</em>` : ''}</span></div>`;
  showModal(`<button class="x mx pf-gear" data-a="settings" title="Ayarlar" aria-label="Ayarlar">${PF_GEAR}</button>
    <div class="pf-hero">
      <button class="pf-ava" data-a="avatarPick" title="Fotoğrafı değiştir" aria-label="Fotoğrafı değiştir">${avatarImg('lg')}<i class="pf-cam">✎</i><span class="pf-lv"><small>Sv.</small>${S.lvl}</span></button>
      <div class="pf-id">
        <h2 class="pf-name">${rkBadge(rankIdx(S))}<button class="pf-ttl ${S.ach?.title ? '' : 'none'}" data-a="titlePick" title="Unvan seç">[${esc(achTitle(S.ach?.title) || 'Ünvan')}]</button> ${esc(S.name)}</h2>
        <div class="pf-tags"><span class="pf-fac" style="--fc:${F.color}">${F.name}</span>${serverTag()}${titleChip(me.title)}<span class="chip pf-rk" title="Rütbe ömür boyu kazandığın Şan’dan gelir; harcamak düşürmez.">${rankName(rankIdx(S))}${(n => n ? ` · ${rankName(n.i)} için ${fmt(n.need)} Şan` : '')(nextRank(S))}</span></div>
        <div class="pf-xp"><div class="pbar"><i style="width:${xpPct}%"></i></div><small>TP %${xpPct >= 10 ? Math.floor(xpPct) : xpPct.toFixed(1)}</small></div>
      </div>
      <div class="pf-pow"><small>Güç</small><b>${fmt(partyPower(S))}</b>${ilvTag(itemLevel(S), 'Eşya Seviyesi')}</div>
    </div>
    <div class="pf-strip">
      <button class="pf-chip ${t ? 'prem' : ''}" data-a="premiumMenu">${ri('crown')}<span><small>Üyelik</small><b>${t ? `${PREMIUM[t].name} Premium` : 'Yok'}</b></span></button>
      <button class="pf-chip" data-a="clan">${S.clanName ? bannerSvg(S.clanTag?.b, 'xs') : ri('clan')}<span><small>Klan</small><b>${S.clanName ? esc(S.clanName) : 'Klansız'}</b></span></button>
      <div class="pf-chip wide">${ri('power')}<span><small>${FACTION_BONUS[S.faction].name}</small><b>${bonusLines(S.faction).join(' · ')}</b></span></div>
    </div>
    <div class="pf-grid">
      ${tile('battle', 'Savaş', fmt(st.battles))}${tile('trophy', 'Zafer', fmt(st.wins), `%${winRate}`)}${tile('anvil', 'Başarılı basma', fmt(st.upOk), `%${upRate}`)}${tile('shatter', 'Başarısız basma', fmt(st.upFail))}
      ${tile('bag', 'Çanta', `${S.items.length}/${BAG_LIMIT}`)}
    </div>
    ${S.rk?.fr?.length ? '<div class="mbtns pf-acts"><button class="btn sm" data-a="frameSel">Çerçeve</button></div>' : ''}
    ${DEV ? `<div class="hint"><b>Test araçları</b><div class="mbtns"><button class="btn sm" data-a="devEnergy">Enerji doldur</button><button class="btn sm" data-a="devLevel">Seviye +5</button><button class="btn sm" data-a="devMastery">Ustalık +10</button><button class="btn sm" data-a="devGive">Kaynak ver</button><button class="btn sm" data-a="devGear">Eşya ver</button><button class="btn sm" data-a="devUnlock">Tüm stage'leri aç</button>${LOCAL ? '<button class="btn sm red" data-a="devReset">Kaydı sıfırla</button>' : ''}</div></div>` : ''}
  `, `prof pf-${S.faction}`);
};
// Grafik ayarı (ACT.gfx): ui-isik.js, kademeler gfx.js
// Profil fotoğrafı: kendi kahramanların ve ansiklopedide keşfettiğin yaratıklar arasından seçilir
ACT.avatarPick = () => {
  const opt = (id, img) => `<button class="avopt ${S.avatar === id ? 'on' : ''}" data-a="avatarSet" data-id="${id}">${img}</button>`;
  const mobs = Object.keys(S.codex).filter(m => MOBS[m]);
  showModal(`<h2>Profil fotoğrafı</h2><div class="in"><p class="mut">Karakterini ya da ansiklopedide keşfettiğin bir yaratığı seç.</p>
    <div class="avgrid">${[clsOf(S)].map(c => opt(`h:${c}`, heroImg(c))).join('')}${mobs.map(m => opt(`m:${m}`, mobImg(m))).join('')}</div>
    ${mobs.length ? '' : '<p class="mut">Yaratık keşfettikçe burada yeni seçenekler açılır.</p>'}
    <div class="mbtns"><button class="btn" data-a="profile">Geri</button></div></div>`);
};
ACT.avatarSet = async d => { if (await run('profile.avatar', { id: d.id })) { renderHud(); ACT.profile(); } };
ACT.devEnergy = async () => { if (await run('dev.energy')) { renderHud(); } };
ACT.devLevel = async () => { if (await run('dev.level', { lvl: Math.min(GAME.maxLevel, S.lvl + 5) })) { showHub(); } };
ACT.devMastery = async () => { if (await run('dev.mastery')) { renderHud(); toast('Ustalık +10 seviye.'); } };
ACT.devGive = async () => { if (await run('dev.give')) { renderHud(); toast('Test kaynakları eklendi.'); } };
ACT.devGear = async () => { if (await run('dev.gear')) { renderHud(); toast('Test eşyaları çantaya eklendi (artılı Nadirler ve bir Eşsiz).'); } };
ACT.devUnlock = async () => { if (await run('dev.unlock')) { renderHud(); toast('Bütün stage’ler 3 yıldızla açıldı.'); } };
ACT.devReset = () => confirmBox('Kaydı sıfırla', 'Bu cihazdaki deneme kaydı silinecek.', resetLocal, 'Sil');
