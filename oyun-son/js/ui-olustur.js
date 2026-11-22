// Karakter oluşturma ekranı (sürüm 23, 22 Kas: GPT "VAHRAN Claude Devir" onaylı referansı
// _tasarim/gelen/karakter-son/00_REFERANS/ONAYLI_KARAKTER_OLUSTUR.png). ACT.charCreate bu ekranı açar.
//   Üst orta: başlık levhası · Sol: TARAF SEÇ (Elentha / Kragmir sancakları) + yüz portresi sütunu (5 yüz = oyundaki yüz
//   seçeneği 0-4) · Orta: seçili taraf/sınıf/cinsiyetin 2B tam boy görseli (js/karakter-png.js; ayak çizgisinden hizalı,
//   görünür boy eşit) · Sağ: SINIF SEÇ (2×2) · CİNSİYET · GÖRÜNÜM (Yüz, Saç Stili, Saç/Göz/Ten Rengi, erkekte Sakal)
//   · Alt: Geri · Karakter adı (+ zar) · Oluştur → char.create (onay penceresi yok) → karakter seçme ekranı (charCreated).
// Bütün düğmeler gerçek DOM düğmeleridir (data-o). 2B görsel yüz/saç/renk seçimini GÖSTERMEZ: bu seçimler kaydedilir ve
// oyundaki 3B kahramana (gorunus.js) uygulanır; portre yalnızca seçilen yüz seçeneğinin simgesidir.
// Arka plan ırkın boyalı sahnesidir (karakter-sahne.js stageRace; 3B kahraman kurulmaz). Kalıcılık: CR (oturum içi) +
// char.create kaydı. Ad zarı: ad-zar.js üretir, char.nameFree depoda boş olanı seçer.
import { ACC, act, LOCAL, nufusInfo } from './api.js';
import { ACT, $, esc, toast, closeModal, closeWin, hud, hooks } from './ui-core.js';
import { CLASSES, CLASS_KEYS, FACTIONS, applyFactionNames } from '../shared/content.js';
import { CHAR, validCharName } from '../shared/roster.js';
import { FULL_TEXT, NUFUS_LINE } from '../shared/nufus.js';
import { lookOptions, lookDefault, faceName, hairName, beardName, colorName } from '../shared/gorunus.js';
import { rollNames } from './ad-zar.js';
import { IC } from './karakter-simge.js';
import { stageRace, wake } from './karakter-sahne.js';
import { setShift, setHfov } from './engine3d.js';
import { clearScene, setUpdater } from './world.js';
import { hideBattleUI } from './combat.js';
import { hideTown } from './town.js';
import { hideChatBar } from './ui-social.js';
import { onView } from './orient.js';
import { charCreated } from './ui-karakter.js';
import { svg } from './icons.js';
import { LANG_KEYS, lang } from './i18n.js';
import { sprUrl, sprBox, yuzUrl } from './karakter-png.js';

const setMood = f => { const r = document.documentElement; if (f) r.dataset.faction = f; else delete r.dataset.faction; };
const SIDE = { sancak: ['Elentha', 'İnsan Krallığı'], ocak: ['Kragmir', 'Ork İmparatorluğu'] };
const CLS_ORDER = ['warrior', 'rogue', 'mage', 'priest']; // referans: Savaşçı Suikastçı / Büyücü Rahip

// ---------- Durum ----------
// Varsayılan (kullanıcı isteği 22 Kas gece): Elentha → kadın Savaşçı, Kragmir → erkek Savaşçı. Taraf değişince bu ikili gelir.
const SIDE_DEF = { sancak: { cls: 'warrior', gender: 'f' }, ocak: { cls: 'warrior', gender: 'm' } };
const CR = { race: 'sancak', ...SIDE_DEF.sancak, look: lookDefault('sancak', 'warrior', 'f'), name: '' };
const V = { box: null, nameIssue: null, offView: null, rolling: false, busy: false };
let NF = null; // ırk nüfusu (dolu ırk, Bereket)

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
  clearScene(); setShift(); setHfov(56); setUpdater(null);
  if (NF?.closed === CR.race) { CR.race = CR.race === 'sancak' ? 'ocak' : 'sancak'; Object.assign(CR, SIDE_DEF[CR.race]); } applyFactionNames(CR.race);
  fitLook(true);
  open();
  nufusInfo().then(n => { NF = n; if (NF?.closed === CR.race) { const o = CR.race === 'sancak' ? 'ocak' : 'sancak'; if (NF.closed !== o) { CR.race = o; Object.assign(CR, SIDE_DEF[o]); fitLook(false); redraw(); } } drawL(); }).catch(() => {});
  import('../shared/account.js').then(m => { nameCheck = m.nameIssue; checkName(); }).catch(() => {});
};
let nameCheck = null;
function open() {
  close();
  const b = V.box = document.createElement('div');
  b.id = 'olz'; b.className = 'vz';
  const n = (ACC?.chars || []).length;
  b.innerHTML = `<div class="vz-shade" aria-hidden="true"></div>
    <div class="vz-hero" id="vzhero" aria-hidden="true"><img alt="" draggable="false"></div>
    <h1 class="vz-title"><span>Karakter Oluştur</span></h1>
    <div class="vz-meta"><span class="vz-lang" translate="no">${LANG_KEYS.map(k => `<button data-o="lang" data-l="${k}" class="${lang() === k ? 'on' : ''}" lang="${k}">${k.toUpperCase()}</button>`).join('')}</span><span class="vz-slots" title="${LOCAL ? 'Deneme sürümü: karakterler yalnızca bu cihazda saklanır.' : ''}">Hesap ${n}/${ACC?.max || CHAR.slots}</span></div>
    <section class="vz-side" aria-label="Taraf seç"><h2 class="vz-h">Taraf Seç</h2><div class="vz-banners" id="olzl" role="radiogroup"></div></section>
    <nav class="vz-faces" id="vzfaces" role="radiogroup" aria-label="Yüz"></nav>
    <section class="vz-right" aria-label="Sınıf ve görünüm"><div id="olzr"></div></section>
    <button class="vz-back" data-o="back"><i aria-hidden="true">←</i><span>Geri</span></button>
    <div class="vz-name"><label><i class="vz-quill" aria-hidden="true"></i><input type="text" id="olzname" maxlength="${CHAR.name.max}" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Karakter Adı" aria-label="Karakter adı" value="${esc(CR.name)}" data-enter="olzCreate"></label>
      <button class="vz-dice" data-o="dice" id="olzdice" aria-label="Rastgele ad" title="Rastgele ad"></button>
      <span class="olz-msg" id="olzmsg" aria-live="polite"></span></div>
    <button class="vz-go" data-o="create" id="olzgo"><span>Oluştur</span></button>`;
  const g = document.getElementById('game'); // #game içinde: modal ve bildirim bu katmanın üstünde kalır
  if (g) g.insertBefore(b, document.getElementById('win')); else document.body.appendChild(b);
  b.addEventListener('click', onClick);
  const inp = $('#olzname');
  inp.addEventListener('input', () => { CR.name = inp.value; checkName(); });
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); ACT.olzCreate(); } });
  redraw(); checkName();
  V.offView = onView(() => requestAnimationFrame(placeHero));
  requestAnimationFrame(() => V.box?.classList.add('in'));
}
function close() {
  V.offView?.(); V.offView = null;
  if (V.box) { V.box.remove(); V.box = null; }
}
const redraw = () => { drawL(); drawF(); drawR(); hero(); };

function onClick(e) {
  const b = e.target.closest('[data-o]'); if (!b || !V.box?.contains(b) || b.disabled) return;
  hooks.sfx?.('tap', 'olz'); wake();
  const d = b.dataset, L = CR.look;
  switch (d.o) {
    case 'race': if (NF?.closed === d.v) return toast(FULL_TEXT); if (CR.race === d.v) return; CR.race = d.v; Object.assign(CR, SIDE_DEF[d.v]); CR.look.hair = lookDefault(CR.race, CR.cls, CR.gender).hair; applyFactionNames(CR.race); fitLook(false); redraw(); return;
    case 'cls': if (CR.cls === d.v) return; CR.cls = d.v; drawR(); hero(); return;
    case 'gender': if (CR.gender === d.v) return; CR.gender = d.v; CR.look.hair = lookDefault(CR.race, CR.cls, CR.gender).hair; fitLook(true); drawF(); drawR(); hero(); return;
    case 'face': L.face = +d.v; drawF(); drawR(); return;
    case 'step': { const O = lookOptions(CR.race, CR.gender)[d.k], i = O.indexOf(L[d.k]); L[d.k] = O[(Math.max(0, i) + (+d.d) + O.length) % O.length]; if (d.k === 'face') drawF(); drawR(); return; }
    case 'dice': rollDice(); return;
    case 'back': return goBack();
    case 'create': ACT.olzCreate(); return;
    case 'lang': Promise.resolve(ACT.ayLang?.({ l: d.l })).finally(() => { if (!V.box) return; V.box.querySelectorAll('[data-o=lang]').forEach(x => x.classList.toggle('on', x.dataset.l === lang())); redraw(); checkName(); }); return;
  }
}
// Geri: hesapta karakter varsa seçme ekranı; yoksa açılış ekranına dönülecek yer olmadığından (oyun ilk karakterle başlar)
// bilgi verilir
function goBack() {
  if ((ACC?.chars || []).length) { close(); ACT.charSelect(); return; }
  toast('Oyuna başlamak için önce bir karakter oluştur.');
}

// ---------- Sol: taraf sancakları ----------
const nfTag = k => (NF?.closed === k ? `<small class="vz-nf">${svg('lock')} ${FULL_TEXT}</small>` : NF?.minor === k ? `<small class="vz-bl">Bereket ${NUFUS_LINE}</small>` : '');
function drawL() {
  const el = $('#olzl'); if (!el) return;
  el.innerHTML = ['sancak', 'ocak'].map(k => `<button class="vz-ban ${CR.race === k ? 'on' : ''}${NF?.closed === k ? ' lock' : ''}" data-o="race" data-v="${k}" role="radio" aria-checked="${CR.race === k}"><i class="vz-emb" aria-hidden="true"></i><b>${SIDE[k][0]}</b><small>${SIDE[k][1]}</small>${nfTag(k)}</button>`).join('');
}
// ---------- Yüz portreleri (ırk + cinsiyete göre 5) ----------
function drawF() {
  const el = $('#vzfaces'); if (!el) return;
  const O = lookOptions(CR.race, CR.gender).face;
  el.innerHTML = O.map(f => `<button class="vz-face ${CR.look.face === f ? 'on' : ''}" data-o="face" data-v="${f}" role="radio" aria-checked="${CR.look.face === f}" title="${esc(faceName(CR.race, f))}" aria-label="Yüz: ${esc(faceName(CR.race, f))}"><img src="${yuzUrl(CR.race, CR.gender, f) || ''}" alt="" draggable="false"></button>`).join('');
}
// ---------- Sağ: sınıf, cinsiyet, görünüm ----------
const stepRow = (k, label, body, i, n) => `<div class="vz-row"><span class="vz-lab">${label}</span><button data-o="step" data-k="${k}" data-d="-1" aria-label="${label}: önceki">◀</button><b>${body}</b><button data-o="step" data-k="${k}" data-d="1" aria-label="${label}: sonraki">▶</button>${n ? `<small class="vz-n">${i + 1}/${n}</small>` : ''}</div>`;
const pill = c => `<i class="vz-pill" style="--c:${c}" title="${esc(colorName(c))}"></i>`;
function drawR() {
  const el = $('#olzr'); if (!el) return;
  const L = CR.look, O = lookOptions(CR.race, CR.gender), orc = CR.race === 'ocak';
  el.innerHTML = `<h2 class="vz-h">Sınıf Seç</h2>
    <div class="vz-cls" role="radiogroup" aria-label="Sınıf">${CLS_ORDER.filter(k => CLASS_KEYS.includes(k)).map(k => `<button class="${CR.cls === k ? 'on' : ''}" data-o="cls" data-v="${k}" role="radio" aria-checked="${CR.cls === k}" title="${esc(CLASSES[k].role || '')}"><i class="vz-ci" data-c="${k}" aria-hidden="true">${IC[k] || ''}</i><span>${CLASSES[k].name}</span></button>`).join('')}</div>
    <h2 class="vz-h vz-h2">Cinsiyet</h2>
    <div class="vz-gen" role="radiogroup" aria-label="Cinsiyet">${[['m', '♂', 'Erkek'], ['f', '♀', 'Kadın']].map(([g, s, n]) => `<button class="${CR.gender === g ? 'on' : ''}" data-o="gender" data-v="${g}" role="radio" aria-checked="${CR.gender === g}" aria-label="${n}" title="${n}">${s}</button>`).join('')}</div>
    <h2 class="vz-h vz-h2">Görünüm</h2>
    <div class="vz-look">
      ${stepRow('face', 'Yüz', esc(faceName(CR.race, L.face)), O.face.indexOf(L.face), O.face.length)}
      ${stepRow('hair', 'Saç Stili', esc(hairName(L.hair)), O.hair.indexOf(L.hair), O.hair.length)}
      ${stepRow('hairColor', 'Saç Rengi', pill(L.hairColor))}
      ${stepRow('eyeColor', 'Göz Rengi', pill(L.eyeColor))}
      ${stepRow('skin', orc ? 'Deri Rengi' : 'Ten Rengi', pill(L.skin))}
      ${CR.gender === 'm' ? stepRow('beard', 'Sakal', esc(beardName(L.beard)), O.beard.indexOf(L.beard), O.beard.length) : ''}
    </div>`;
}
// ---------- Orta: 2B tam boy ----------
function hero() {
  const B = V.box; if (!B) return;
  setMood(CR.race); stageRace(CR.race); B.dataset.race = CR.race; B.dataset.cls = CR.cls; B.dataset.g = CR.gender;
  const im = B.querySelector('#vzhero img'), u = sprUrl(CR.race, CR.cls, CR.gender);
  if (im && im.getAttribute('src') !== u) { im.classList.remove('swap'); void im.offsetWidth; im.src = u || ''; im.classList.add('swap'); }
  placeHero(); wake();
}
// Ayak hizası: görünür alt sınır (BOX y1) ortak ayak çizgisine; görünür yükseklik eşit; genişlik orta alana sığar.
// Ölçüler kabın mantıksal boyutundan (döndürülmüş kipte de offset*), oranlar referans tuvalinden (1536×864).
function placeHero() {
  const B = V.box, h = B?.querySelector('#vzhero'); if (!h || !B.offsetWidth) return;
  const W = B.offsetWidth, H = B.offsetHeight, bx = sprBox(CR.race, CR.cls, CR.gender) || [0, 0, 512, 768];
  const u = Math.min(H / 406, W / 880), foot = H * 0.835, top = H * 0.085;
  const room = W - 2 * 205 * u; // sol sancak + portre sütunu ile sağ panel arası
  let s = (foot - top) / (bx[3] - bx[1]); s = Math.min(s, Math.max(120, room) / (bx[2] - bx[0]));
  const cx = W * 0.5 - 4 * u;
  h.style.cssText = `width:${512 * s}px;height:${768 * s}px;left:${cx - ((bx[0] + bx[2]) / 2) * s}px;top:${foot - bx[3] * s}px`;
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
