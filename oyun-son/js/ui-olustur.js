// Karakter oluşturma ekranı (sürüm 12, 13'te yenilendi). ACT.charCreate bu ekranı açar.
//   Sol: ırk (açıklama) + seçili sınıfın tanıtımı · Orta: büyük 3B önizleme (sürükle: 360° döndür; iki parmak / tekerlek:
//   yakınlaştır; arka plan ırkın sahnesi: karakter-sahne.js) · Sağ: görünüş (cinsiyet, yüz, saç, renkler, sakal, vücut, boy)
//   · Alt: ad (canlı denetim + ad zarı) · sınıf kutuları · Oluştur → doğrudan char.create (onay penceresi yok)
//   → karakter seçme ekranı (charCreated). Ad zarı: ad-zar.js üretir, char.nameFree depoda boş olanı seçer.
// Seçenekler ırk ve cinsiyete göre süzülür (shared/gorunus.js lookOptions; sunucu roster.js normLook aynı tabloyla denetler).
// Bütün değişiklikler önizlemeye anında yansır: model gorunus.js ile yeniden kurulur (prosedürel; dürüst etiket PLACEHOLDER).
// Döndürülmüş kip (html.rot): sürükleme orient.js toLocalDelta ile mantıksal eksene çevrilir, alan data-drag taşır; ad kutusu
// oyunun yatay klavyesini (ui-klavye.js) kendiliğinden açar. Isınma: kare sınırı ve donma karakter-sahne.js'tedir.
import { ACC, act, LOCAL, nufusInfo } from './api.js';
import { ACT, $, esc, toast, closeModal, closeWin, hud, hooks, DEF_W } from './ui-core.js';
import { CLASSES, CLASS_KEYS, FACTIONS, applyFactionNames } from '../shared/content.js';
import { CHAR, validCharName } from '../shared/roster.js';
import { FULL_TEXT, NUFUS_LINE } from '../shared/nufus.js';
import { FACES, HAIRS, BODIES, HEIGHT, lookOptions, lookDefault, faceName, hairName, beardName, bodyName, colorName } from '../shared/gorunus.js';
import { rollNames } from './ad-zar.js';
import { IC } from './karakter-simge.js';
import { stageRace, stageHero, stageActor, wake } from './karakter-sahne.js';
import { PLACEHOLDER } from './gorunus.js';
import { camRig, camera, setShift, setHfov } from './engine3d.js';
import { clearScene, setUpdater } from './world.js';
import { unitLook, hideBattleUI } from './combat.js';
import { hideTown } from './town.js';
import { hideChatBar } from './ui-social.js';
import { serverTag, serverEmblem } from './ui-sunucu.js';
import { toLocalDelta, onView } from './orient.js';
import { charCreated } from './ui-karakter.js';
import { svg } from './icons.js';
import { LANG_KEYS, lang } from './i18n.js';

const setMood = f => { const r = document.documentElement; if (f) r.dataset.faction = f; else delete r.dataset.faction; };

const CLS_TXT = {
  warrior: { d: 'Yakın dövüşün ustası: güçlü saldırı, yüksek dayanıklılık.', w: 'Raptor ile başlar; kılıç, balta ve kalkan da kullanır', p: 'Ağır, sağlam savaşçı duruşu' },
  rogue: { d: 'Hız ve çeviklik; kritik vuruşla tek hedefi çabuk düşürür.', w: 'Hançer ve yay', p: 'Atletik, tetikte duruş' },
  priest: { d: 'Şifa, koruma ve destek; ışık temalı donanım.', w: 'Topuz ve kalkan', p: 'Asil, sakin duruş' },
  mage: { d: 'Ateş, buz ve yıldırım büyüleri; alan saldırısı ve kontrol.', w: 'Asa', p: 'Gizemli büyücü duruşu' },
};
const RACE_TXT = { sancak: 'İnsan', ocak: 'Ork' };
const STAT = [['hp', 'Can', 400], ['atk', 'Saldırı', 40], ['mag', 'Büyü', 40], ['def', 'Savunma', 26]]; // Hız gösterilmez (hız askıda)

// ---------- Durum ----------
const CR = { race: 'sancak', cls: 'warrior', gender: 'm', look: lookDefault('sancak', 'warrior', 'm'), name: '' };
const V = { yaw: 0, zoom: 0, box: null, nameIssue: null, anim: 0, raf: 0, frac: 0.7, offView: null, rolling: false };
let NF = null; // ırk nüfusu (dolu ırk, Bereket)
const look = () => ({ ...CR.look, race: CR.race, cls: CR.cls, gender: CR.gender, name: CR.name });

// Irk / cinsiyet değişince izinli olmayan seçenek varsayılana döner; renk paletleri ırka özgüdür
function fitLook(keepColors) {
  const O = lookOptions(CR.race, CR.gender), D = lookDefault(CR.race, CR.cls, CR.gender), L = CR.look;
  for (const k of ['face', 'hair', 'beard', 'body']) if (!O[k].includes(L[k])) L[k] = D[k];
  for (const k of ['hairColor', 'eyeColor', 'skin']) if (!keepColors || !O[k].includes(L[k])) L[k] = O[k].includes(L[k]) ? L[k] : D[k];
  if (CR.gender === 'f') L.beard = 0;
}

// ---------- Ekran ----------
ACT.charCreate = () => {
  document.getElementById('tksel')?.remove();
  hud.hidden = true; closeWin(true); closeModal(); hideTown(); hideChatBar(); hideBattleUI();
  clearScene(); setShift(); setHfov(56);
  if (NF?.closed === CR.race) CR.race = CR.race === 'sancak' ? 'ocak' : 'sancak'; applyFactionNames(CR.race);
  fitLook(true);
  open();
  nufusInfo().then(n => { NF = n; if (NF?.closed === CR.race) { const o = CR.race === 'sancak' ? 'ocak' : 'sancak'; if (NF.closed !== o) { CR.race = o; fitLook(false); scene(); } } drawL(); }).catch(() => {});
  import('../shared/account.js').then(m => { nameCheck = m.nameIssue; checkName(); }).catch(() => {});
};
let nameCheck = null;
function open() {
  close(true);
  const b = V.box = document.createElement('div');
  b.id = 'olz'; b.className = 'olz';
  const back = (ACC?.chars || []).length ? '<button class="btn olz-back" data-o="back">Geri</button>' : '';
  b.innerHTML = `<div class="olz-shade" aria-hidden="true"></div><header class="olz-top"><b>Karakter oluştur</b><span class="olz-srv">${serverEmblem('srv-emb sm')} ${serverTag()}</span><span class="olz-sp"></span><span class="olz-lang" translate="no">${LANG_KEYS.map(k => `<button data-o="lang" data-l="${k}" class="${lang() === k ? 'on' : ''}" lang="${k}">${k.toUpperCase()}</button>`).join('')}</span><span class="olz-slots">Hesapta ${(ACC?.chars || []).length}/${ACC?.max || CHAR.slots} karakter${LOCAL ? '<small>Deneme sürümü: karakterler yalnızca bu cihazda saklanır.</small>' : ''}</span>${back}</header>
    <aside class="olz-l olz-pan"><div class="olz-scroll" id="olzl"></div></aside>
    <div class="olz-c" data-drag id="olzc">
      <div class="olz-tools"><button data-o="zoom" data-d="1" aria-label="Yakınlaştır">+</button><button data-o="zoom" data-d="-1" aria-label="Uzaklaştır">−</button><button data-o="rot" data-d="-1" aria-label="Sola döndür">⟲</button><button data-o="rot" data-d="1" aria-label="Sağa döndür">⟳</button><button data-o="view" aria-label="Görünümü sıfırla">◎</button></div>
      <p class="olz-hint">Sürükle: döndür · İki parmak ya da tekerlek: yakınlaştır</p>
      <p class="olz-ph" id="olzph"></p>
    </div>
    <aside class="olz-r olz-pan"><div class="olz-scroll" id="olzr"></div></aside>
    <footer class="olz-b"><div class="olz-nmw"><label class="olz-nm"><span>Karakter adı</span><input type="text" id="olzname" maxlength="${CHAR.name.max}" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Karakter adı" value="${esc(CR.name)}" data-enter="olzCreate"></label>
        <button class="olz-dice" data-o="dice" id="olzdice" aria-label="Rastgele ad" title="Rastgele ad">${IC.zar}</button>
        <span class="olz-msg" id="olzmsg" aria-live="polite"></span></div>
      <div class="olz-classes" id="olzcls" role="radiogroup" aria-label="Sınıf"></div>
      <button class="olz-go" data-o="create" id="olzgo"><span>Oluştur</span></button></footer>
`;
  const g = document.getElementById('game'); // #game içinde: modal (özet) ve bildirim bu katmanın üstünde kalır
  if (g) g.insertBefore(b, document.getElementById('win')); else document.body.appendChild(b);
  b.addEventListener('click', onClick);
  const inp = $('#olzname');
  inp.addEventListener('input', () => { CR.name = inp.value; checkName(); });
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); ACT.olzCreate(); } });
  bindView($('#olzc'));
  drawL(); drawC(); drawR(); checkName(); scene();
  frame(); V.offView = onView(() => requestAnimationFrame(frame));
  requestAnimationFrame(() => V.box?.classList.add('in'));
}
// Önizleme alanı panellerin arasında kalır: görüş merkezi o alanın ortasına kaydırılır (setShift), kadraj yüksekliğine göre
// (yerleşim ölçüsü: offset*, döndürülmüş kipte de mantıksal eksende)
function frame() {
  const b = V.box, c = b?.querySelector('#olzc'); if (!c || !b.offsetWidth) return;
  const W = b.offsetWidth, H = b.offsetHeight, cx = c.offsetLeft + c.offsetWidth / 2, cy = c.offsetTop + c.offsetHeight / 2;
  V.frac = Math.max(0.45, Math.min(1, c.offsetHeight / H));
  setShift(cx / W - 0.5, cy / H - 0.5);
}
// Kapatma: ekran kalkar; sahne (karakter-sahne.js) seçme ekranına geçerken korunur, iki ekran da yoksa kendini bırakır
function close(keepScene) {
  V.offView?.(); V.offView = null; setShift();
  cancelAnimationFrame(V.raf);
  if (V.box) { V.box.remove(); V.box = null; }
  if (!keepScene) setUpdater(null);
}

function onClick(e) {
  const b = e.target.closest('[data-o]'); if (!b || !V.box?.contains(b) || b.disabled) return;
  hooks.sfx?.('tap', 'olz'); wake();
  const d = b.dataset, L = CR.look;
  switch (d.o) {
    case 'race': if (NF?.closed === d.v) return toast(FULL_TEXT); if (CR.race === d.v) return; CR.race = d.v; applyFactionNames(CR.race); fitLook(false); drawL(); drawR(); drawC(); scene(); return;
    case 'cls': if (CR.cls === d.v) return; CR.cls = d.v; drawL(); drawC(); scene(true); return;
    case 'dice': rollDice(); return;
    case 'gender': if (CR.gender === d.v) return; CR.gender = d.v; CR.look.hair = lookDefault(CR.race, CR.cls, CR.gender).hair; fitLook(true); drawR(); scene(); return; // cinsiyete uygun saç
    case 'set': L[d.k] = d.k === 'body' ? +d.v : d.v; drawR(); scene(); return;
    case 'step': { const O = lookOptions(CR.race, CR.gender)[d.k], i = O.indexOf(L[d.k]); L[d.k] = O[(Math.max(0, i) + (+d.d) + O.length) % O.length]; drawR(); scene(); return; }
    case 'hstep': { L.height = Math.round(Math.min(HEIGHT[1], Math.max(HEIGHT[0], (L.height || 1) + 0.02 * d.d)) * 100) / 100; drawR(); scene(); return; }
    case 'rand': randomize(); drawR(); scene(); return;
    case 'reset': CR.look = lookDefault(CR.race, CR.cls, CR.gender); drawR(); scene(); return;
    case 'zoom': V.zoom = Math.min(1, Math.max(0, V.zoom + 0.25 * d.d)); return;
    case 'rot': V.yaw += (Math.PI / 4) * d.d; return;
    case 'view': V.yaw = 0; V.zoom = 0; return;
    case 'back': close(); ACT.charSelect(); return;
    case 'create': ACT.olzCreate(); return;
    case 'lang': Promise.resolve(ACT.ayLang?.({ l: d.l })).finally(() => { if (!V.box) return; V.box.querySelectorAll('[data-o=lang]').forEach(x => x.classList.toggle('on', x.dataset.l === lang())); drawL(); drawC(); drawR(); checkName(); }); return;
  }
}
function randomize() {
  const O = lookOptions(CR.race, CR.gender), pick = a => a[Math.floor(Math.random() * a.length)];
  CR.look = { ...CR.look, face: pick(O.face), hair: pick(O.hair), hairColor: pick(O.hairColor), eyeColor: pick(O.eyeColor), skin: pick(O.skin), beard: pick(O.beard), body: pick(O.body), height: Math.round((HEIGHT[0] + Math.floor(Math.random() * 7) * 0.02) * 100) / 100 };
}

// ---------- Sol panel: ırk + sınıf ----------
const nfTag = k => (NF?.closed === k ? `<span class="olz-nf">${svg('lock')} ${FULL_TEXT}</span>` : NF?.minor === k ? `<span class="olz-bl">Bereket ${NUFUS_LINE}</span>` : '');
function drawL() {
  const el = $('#olzl'); if (!el) return;
  const C = CLASSES[CR.cls], T = CLS_TXT[CR.cls];
  el.innerHTML = `<h3 class="olz-h">Irk</h3><div class="olz-races">${['sancak', 'ocak'].map(k => `<button class="olz-race ${CR.race === k ? 'on' : ''}${NF?.closed === k ? ' lock' : ''}" data-o="race" data-v="${k}" style="--fc:${FACTIONS[k].color}"><i class="olz-ic">${IC[k]}</i><b>${RACE_TXT[k]}</b><small>${FACTIONS[k].name}</small>${nfTag(k)}</button>`).join('')}</div>
    <p class="olz-desc">${FACTIONS[CR.race].desc} <i>“${FACTIONS[CR.race].motto}”</i></p>
    <h3 class="olz-h">Sınıf</h3>
    <div class="olz-cinfo"><p class="olz-cname"><i class="olz-ic">${IC[CR.cls]}</i><b>${C.name}</b><small>${C.role}</small></p><p>${T.d}</p><p class="mut">Silah: ${T.w} · ${T.p}</p>
      <div class="olz-stats">${STAT.map(([k, n, m]) => `<span><em>${n}</em><i style="--v:${Math.min(1, (C.base[k] || 0) / m).toFixed(2)}"></i></span>`).join('')}</div></div>`;
}

// ---------- Alt çubuk: sınıf kutuları ----------
function drawC() {
  const el = $('#olzcls'); if (!el) return;
  el.innerHTML = CLASS_KEYS.map(k => `<button class="olz-cls ${CR.cls === k ? 'on' : ''}" data-o="cls" data-v="${k}" role="radio" aria-checked="${CR.cls === k}"><i class="olz-ic">${IC[k]}</i><b>${CLASSES[k].name}</b></button>`).join('');
}

// ---------- Sağ panel: görünüş ----------
const row = (label, body, cls = '') => `<div class="olz-row ${cls}"><span class="olz-lab">${label}</span>${body}</div>`;
const stepper = (k, text, i, n) => `<div class="olz-step"><button data-o="step" data-k="${k}" data-d="-1" aria-label="Önceki">‹</button><b>${text}</b><small>${i + 1}/${n}</small><button data-o="step" data-k="${k}" data-d="1" aria-label="Sonraki">›</button></div>`;
const swatches = (k, list, cur) => `<div class="olz-sw">${list.map(c => `<button data-o="set" data-k="${k}" data-v="${c}" class="${c === cur ? 'on' : ''}" style="--c:${c}" title="${esc(colorName(c))}" aria-label="${esc(colorName(c))}"></button>`).join('')}<small>${esc(colorName(cur))}</small></div>`;
function drawR() {
  const el = $('#olzr'); if (!el) return;
  const L = CR.look, O = lookOptions(CR.race, CR.gender), orc = CR.race === 'ocak';
  const hgt = L.height || 1, hn = hgt < 0.98 ? 'Kısa' : hgt > 1.02 ? 'Uzun' : 'Orta';
  const fe = FACES[CR.race].find(x => x.id === L.face);
  el.innerHTML = `<h3 class="olz-h">Görünüş</h3>
    ${row('Cinsiyet', `<div class="olz-seg">${[['m', 'Erkek'], ['f', 'Kadın']].map(([g, n]) => `<button data-o="gender" data-v="${g}" class="${CR.gender === g ? 'on' : ''}">${n}</button>`).join('')}</div>`)}
    ${row('Yüz', stepper('face', faceName(CR.race, L.face), O.face.indexOf(L.face), O.face.length) + (fe ? `<small class="olz-note">${fe.note}</small>` : ''))}
    ${row('Saç', stepper('hair', hairName(L.hair) + (HAIRS.find(h => h.id === L.hair)?.fancy ? ' ✦' : ''), O.hair.indexOf(L.hair), O.hair.length))}
    ${row('Saç rengi', swatches('hairColor', O.hairColor, L.hairColor))}
    ${row('Göz rengi', swatches('eyeColor', O.eyeColor, L.eyeColor))}
    ${row(orc ? 'Deri rengi' : 'Ten rengi', swatches('skin', O.skin, L.skin))}
    ${CR.gender === 'f' ? row('Sakal', '<span class="olz-off">Kadın karakterde yok</span>') : row('Sakal', stepper('beard', beardName(L.beard), O.beard.indexOf(L.beard), O.beard.length))}
    ${row('Vücut', `<div class="olz-seg">${BODIES.map(x => `<button data-o="set" data-k="body" data-v="${x.id}" class="${L.body === x.id ? 'on' : ''}">${bodyName(x.id)}</button>`).join('')}</div>`)}
    ${row('Boy', `<div class="olz-step"><button data-o="hstep" data-d="-1" aria-label="Kısalt" ${hgt <= HEIGHT[0] ? 'disabled' : ''}>‹</button><b>${hn}</b><small>${hgt.toFixed(2)}</small><button data-o="hstep" data-d="1" aria-label="Uzat" ${hgt >= HEIGHT[1] ? 'disabled' : ''}>›</button></div>`)}
    <div class="olz-acts"><button class="btn" data-o="rand">Rastgele</button><button class="btn" data-o="reset">Varsayılan</button></div>
    <p class="olz-honest">${PLACEHOLDER.model}${CR.gender === 'f' ? ' ' + PLACEHOLDER.female : ''}</p>`;
  const ph = $('#olzph'); if (ph) ph.textContent = CR.gender === 'f' ? 'Geçici model · kadın gövdesi geçici' : 'Geçici model';
}

// ---------- Ad ----------
function checkName() {
  const msg = $('#olzmsg'), go = $('#olzgo'); if (!msg) return;
  const n = CR.name.trim(), taken = (ACC?.chars || []).map(c => c.name);
  V.nameIssue = nameCheck ? nameCheck(n, taken) : (n ? (validCharName(n) ? null : `Ad ${CHAR.name.min}-${CHAR.name.max} harf ya da rakam olmalı, harfle başlamalı.`) : 'Ad zorunlu.');
  msg.className = 'olz-msg ' + (V.nameIssue ? (n ? 'bad' : '') : 'ok');
  msg.textContent = V.nameIssue ? (n ? V.nameIssue : `${CHAR.name.min}-${CHAR.name.max} harf ya da rakam`) : `Ad uygun (${n.length}/${CHAR.name.max})`;
  if (go) go.classList.toggle('dim', !!V.nameIssue);
}

// ---------- 3B önizleme ----------
// Arka plan ırkın sahnesidir (karakter-sahne.js). Değişiklik aynı karede birleştirilir (bir karede tek yeniden kurulum);
// model eski açısıyla yerine konur.
function scene(clsChanged) {
  setMood(CR.race); stageRace(CR.race);
  V.box && (V.box.dataset.race = CR.race);
  cancelAnimationFrame(V.raf);
  V.raf = requestAnimationFrame(() => {
    if (!V.box) return;
    const u = { key: 'h0', cls: CR.cls, faction: CR.race, wm: DEF_W[CR.cls], name: '', lvl: 1, charLook: look() };
    const a = stageHero({ ...u, ...unitLook(u) }, V.yaw), c = a.char;
    c.combatTarget = CR.cls === 'warrior' || CR.cls === 'rogue' ? 1 : 0; // sınıf duruşu
    if (clsChanged) { const n = ++V.anim; setTimeout(() => { if (n !== V.anim || stageActor()?.char !== c) return; ({ warrior: () => c.swing(), rogue: () => c.swing(), priest: () => c.raiseArms(), mage: () => c.castSpell() })[CR.cls]?.(); }, 250); }
    wake();
  });
  setUpdater(() => {
    const a = stageActor(); if (a) a.char.root.rotation.y = V.yaw;
    // kadraj: önizleme alanının (panellerin arasında kalan bölüm) yüksekliğine göre; tam boy ↔ yüz yakın çekimi
    const z = V.zoom, k = Math.tan((camera.fov * Math.PI) / 360) || 0.38, h = CR.look.height || 1;
    const half = (1.42 + (0.3 - 1.42) * z) / V.frac, dist = Math.max(1.2, half / k), ly = (1.18 + (2.04 - 1.18) * z) * h;
    camRig.pos.set(0, ly + 0.3 * (1 - z) + 0.04, dist); camRig.look.set(0, ly, 0);
  });
}
// Sürükleme (360°), iki parmak ve tekerlek (yakınlaştırma). Döndürülmüş kipte kayma mantıksal eksene çevrilir.
function bindView(el) {
  const P = new Map(); let pinch = 0;
  el.addEventListener('pointerdown', e => { if (e.target.closest('button')) return; el.setPointerCapture?.(e.pointerId); P.set(e.pointerId, { x: e.clientX, y: e.clientY }); pinch = 0; wake(); });
  el.addEventListener('pointermove', e => {
    const p = P.get(e.pointerId); if (!p) return;
    if (P.size >= 2) {
      p.x = e.clientX; p.y = e.clientY;
      const [a, b] = [...P.values()], dd = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinch) V.zoom = Math.min(1, Math.max(0, V.zoom + (dd - pinch) * 0.004));
      pinch = dd; wake(); return;
    }
    const d = toLocalDelta(e.clientX - p.x, e.clientY - p.y); p.x = e.clientX; p.y = e.clientY;
    V.yaw += d.x * 0.012; wake();
  });
  const up = e => { P.delete(e.pointerId); if (P.size < 2) pinch = 0; };
  el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  el.addEventListener('wheel', e => { e.preventDefault(); V.zoom = Math.min(1, Math.max(0, V.zoom - e.deltaY * 0.0015)); wake(); }, { passive: false });
}

// ---------- Ad zarı ----------
// Irk ve cinsiyete uygun birkaç aday üretilir; yerel denetimden (biçim, küfür, yapay oyuncu, hesabın kendi adları) geçenler
// char.nameFree ile depoda sorulur, ilk boş olan yazılır. Sunucu soruyu yanıtlayamazsa (hesapsız ilk kayıt) yerel denetim
// yeter: kesin teklik char.create'tedir.
async function rollDice() {
  if (V.rolling) return;
  V.rolling = true;
  const btn = $('#olzdice'); btn?.classList.remove('roll'); void btn?.offsetWidth; btn?.classList.add('roll');
  try {
    const taken = (ACC?.chars || []).map(c => c.name);
    let pick = null;
    for (let round = 0; round < 3 && !pick; round++) {
      const cand = rollNames(CR.race, CR.gender, 6, Math.random, [CR.name]).filter(n => !(nameCheck ? nameCheck(n, taken) : !validCharName(n)));
      if (!cand.length) continue;
      let free = cand;
      try { const r = await act('char.nameFree', { names: cand }); if (Array.isArray(r?.free)) free = r.free; } catch { }
      pick = free[0] || null;
    }
    if (!pick || !V.box) return;
    CR.name = pick;
    const inp = $('#olzname'); if (inp) { inp.value = pick; inp.classList.remove('olz-flash'); void inp.offsetWidth; inp.classList.add('olz-flash'); }
    checkName();
  } finally { V.rolling = false; }
}

// ---------- Kayıt ----------
// Oluştur: denetimden geçerse doğrudan kaydedilir (onay penceresi yok); karakter seçme ekranı yeni karakter seçili açılır.
ACT.olzCreate = async () => {
  if (!V.box || V.busy) return;
  checkName();
  if (NF?.closed === CR.race) return toast(FULL_TEXT);
  if (V.nameIssue) { toast(V.nameIssue); $('#olzname')?.focus(); return; }
  const L = CR.look, name = CR.name.trim(), go = $('#olzgo');
  V.busy = true; if (go) go.disabled = true;
  try {
    const r = await act('char.create', { name, race: CR.race, cls: CR.cls, gender: CR.gender, face: L.face, hair: L.hair, hairColor: L.hairColor, eyeColor: L.eyeColor, skin: L.skin, beard: CR.gender === 'f' ? 0 : L.beard, body: L.body, height: L.height });
    toast(`${name} oluşturuldu.`);
    CR.name = ''; close(true); charCreated(r.id);
  } catch (e) {
    toast(hooks.errText?.(e) ?? e.message);
    if (e.code === 'name-taken') { const m = $('#olzmsg'); if (m) { m.className = 'olz-msg bad'; m.textContent = 'Bu ad alınmış.'; } V.nameIssue = 'Bu ad alınmış.'; }
    if (e.code === 'faction-full') { NF = { ...(NF || {}), closed: CR.race }; drawL(); }
  } finally { V.busy = false; if (go) go.disabled = false; }
};
