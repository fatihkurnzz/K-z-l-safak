// P26 K4 (24 Kas, kullanıcı talimatı docs/referans/p26-100-puan/TALIMAT.md Faz 1A): blursuz 2B Eğitim Ormanı.
// Yeni karakter oyuna başkentte değil, Kemikli Koru'da (Eğitim Ormanı) başlar. Eski 3B düşük poligonlu orman kaldırıldı.
// Dört sahne, öğretici adımlarıyla (shared/meta.js TUT_STEPS; kurallar ve adım kimlikleri değişmedi, yalnız sunum):
//  1. 'story'  : Ormanda Uyanış — Şaman Yashka'nın 4 repliği; son replikte tut.next ve ilk savaş (aşama 1-1) açılır.
//  2. 'battle' : Orman Pususu — gerçek savaş motoru, aşama 1-1 (3 dalga = 3 tur: temel saldırı, ilk yetenek, bitiriş).
//                Görünüm öğreticiye özel: arka plan bu orman (savas-arka.js OZEL_BG), düşman figürü ve adı Kül Kurdu
//                (yaratik2d.js ozelPaket; adlar yalnız istemci gösteriminde değişir). Yönlendirme ui-kalicilik.js guide().
//  3. 'battle' (zafer sonrası): İlk Ganimet ve Yemin — kazanılan ganimet + 2 replik (son replik halka göre).
//  4. Başkente geçiş: beyaz parlama yok; koyu kararma (fade) → tut.next ('bar') → başkent → kararma açılır.
// Diyalog açıkken arka plana blur / backdrop-filter / ağır karartma YOK (stiller css/p26-orman.css).
// Görseller p26-orman-png.js (tools/p26-orman-paketle.py): yalnız öğretici açılınca tembel yüklenir; arka plan hazır olmadan
// sahne içeriği çizilmez (kısa koyu bekleme). ?tut=0 ormanı kapatır. Ayarlar → Hesap "Öğreticiyi yeniden başlat" ormana döner.
import './ui-hub.js'; // sıra: ana üssün hooks.hud'u bu modülden önce bağlanmış olmalı (aşağıda sarılır)
import { RENDER } from './engine3d.js';
import { clearScene } from './world.js';
import { hideBattleUI, BT } from './combat.js';
import { hideChatBar } from './ui-social.js';
import { S, onState } from './api.js';
import { ACT, hud, hooks, esc, toast, run, closeWin, closeModal, ico, fmt } from './ui-core.js';
import { ri } from './icons.js';
import { TUT_STEPS, tutActive } from '../shared/meta.js';
import { itemBase } from '../shared/items.js';
import { YARATIK, ozelPaket } from './yaratik2d.js';
import { OZEL_BG } from './savas-arka.js';

// İzci tarafa göre (eski metinlerde geçer; ui-kalicilik.js ORMAN.name kullanır)
export const ORMAN = { name: 'Kemikli Koru', get scout() { return S?.faction === 'sancak' ? 'İzci Corin' : 'İzci Thrak'; } };
const TUT_OFF = new URLSearchParams(location.search).get('tut') === '0';
const LAST = TUT_STEPS.indexOf('battle'); // bu adım (ilk savaş ve ganimet) dahil orman sürer; 'bar' başkentte başlar
/** Öğretici ormanda mı (yeni karakter, 'story' ya da 'battle' adımı; ?tut=0 kapalı). */
export const ormanOn = () => !TUT_OFF && !!S && tutActive(S) && (S.tut.s | 0) <= LAST;
const STAGE = '1-1'; // öğretici savaşı: Vahran Ovası 1 (3 dalga)
const MOB = 'small_bandicoot', MOB_AD = 'Küçük Bandikut', KURT_AD = 'Kül Kurdu'; // aşama 1-1'in yaratığı → öğreticide Kül Kurdu

// ---------- Replikler (TALIMAT.md Faz 1A, AYNEN) ----------
const KIM = { ad: 'ŞAMAN YASHKA', unvan: 'Orman Kâhini' };
const SAHNE1 = [
  'Sis çöktüğünde rün taşları uyanır. Başkente varmadan önce kılıcının ağırlığını burada tartmalısın.',
  'Kragmir\'in ocakları ile Elentha\'nın surları arasında eski yeminler yeniden sınanıyor.',
  'Şu ağaçların gölgesinde kıpırdayanı duyuyor musun? Kül kokusu taşıyan bir avcı yaklaşıyor.',
  'Silahını kavra. İlk darbeni burada indir ki başkentin kapıları sana açık kalsın.',
];
// Sahne 3: ilk replik talimatta verilmedi (P26 yazdı); ikincisi halka göre AYNEN
const SAHNE3 = f => [
  'Kül Kurdu yere serildi. Postundaki kor sönmeden ilk ganimetini al; bu orman sana borcunu ödedi.',
  f === 'ocak' ? 'Ateşin sönmedi. Şimdi Kragmir\'in ocaklarına in — demir seni çağırıyor.' : 'Yeminin sağlam. Şimdi Elentha\'nın surlarına yürü — sancak seni bekliyor.',
];

// ---------- Görsel paketi (tembel) ----------
let PK = null, PKP = null;
const paketYukle = () => (PKP ||= import('./p26-orman-png.js').then(m => (PK = m.default)).catch(() => { PKP = null; return null; }));
const url = k => (PK?.[k] ? 'data:image/webp;base64,' + PK[k] : '');
const resimHazir = src => new Promise(ok => { if (!src) return ok(); const im = new Image(); im.onload = im.onerror = () => ok(); im.src = src; if (im.decode) im.decode().then(ok, ok); });

// ---------- Öğretici savaşının görünümü (Kül Kurdu, orman arka planı) ----------
const OZ = { on: false, eski: null, mo: null };
OZEL_BG.yukle = () => paketYukle().then(() => url('bg') || null);
// Görünen ad: savaş ve VS ekranındaki "Küçük Bandikut" metinleri yalnız istemcide "Kül Kurdu" olur (shared ad değişmez)
function adDegistir(kok) {
  const w = document.createTreeWalker(kok, NodeFilter.SHOW_TEXT);
  for (let n; (n = w.nextNode());) if (n.data.includes(MOB_AD)) n.data = n.data.split(MOB_AD).join(KURT_AD);
}
function ozelAc() {
  if (OZ.on) return;
  OZ.on = true; OZ.eski = YARATIK[MOB];
  YARATIK[MOB] = ['p26orman', 'kurt', 0xffffff];
  ozelPaket('p26orman', paketYukle().then(P => ({ kurt: { bekleme: P?.kurt_bekleme, portre: P?.kurt_portre } })), [MOB]);
  OZEL_BG.id = 'orman';
  adDegistir(document.body);
  OZ.mo = new MutationObserver(L => { for (const r of L) adDegistir(r.target.nodeType === 3 ? r.target.parentNode || document.body : r.target); });
  OZ.mo.observe(document.body, { subtree: true, childList: true, characterData: true });
}
function ozelKapa() {
  if (!OZ.on) return;
  OZ.on = false; OZ.mo?.disconnect(); OZ.mo = null;
  if (OZ.eski) YARATIK[MOB] = OZ.eski; else delete YARATIK[MOB];
  ozelPaket('p26orman', null, [MOB]); // arayüz önbelleği bandikutun kendi çizimine döner
  OZEL_BG.id = '';
}

// ---------- Sahne ----------
const O = { on: false, el: null, i: 0, onay: false, pre: null, mesgul: false, gecis: false, sig: '', w0: null };
const $g = () => document.getElementById('game');
const vis = id => { const e = document.getElementById(id); return !!e && !e.hidden; };
const wins = () => S?.stats?.wins | 0;
// Zafer: hikâye başlarken sayılan zaferden fazlası (öğretici yeniden oynanınca eski zaferler sayılmaz); sayfa yenilendiyse en az 1
const sahneNo = () => (TUT_STEPS[S.tut.s] === 'story' ? 1 : wins() > (O.w0 ?? 0) ? 3 : 2);
/** Orman sahnesi şu an en üstte mi (pencere, savaş ya da modal yok). ui-kalicilik.js öğretici katmanını buna göre gizler. */
export const ormanSahne = () => O.on && !!O.el && !vis('win') && !vis('modal') && !vis('battleUI');

function kur() {
  closeWin(true); hideBattleUI(); closeModal();
  clearScene(); RENDER.off = true; // 2B sahne: 3B çizim yok (pil)
  if (S.battle) run('battle.abandon'); // sonucu gönderilemeyen savaş kaydı açık kalmasın
  ozelAc();
  hud.hidden = false; hud.innerHTML = ''; hideChatBar();
  if (!O.el) {
    O.el = document.createElement('div'); O.el.id = 'p26orman'; O.el.className = 'p26o yukleniyor';
    O.el.innerHTML = '<div class="p26o-bek" aria-hidden="true"><i></i></div>';
    O.el.addEventListener('click', tikla);
    $g().appendChild(O.el);
  }
  if (!O.on) { O.on = true; O.i = 0; O.onay = false; O.sig = ''; }
  if (TUT_STEPS[S.tut.s] === 'story') O.w0 = wins();
  paketYukle().then(() => resimHazir(url('bg'))).then(() => {
    if (!O.on || !O.el) return;
    if (!O.el.classList.contains('yukleniyor')) return ciz(); // savaştan dönüş: sahne hazır
    O.el.classList.remove('yukleniyor'); O.sig = '';
    O.el.innerHTML = `<img class="p26o-bg" src="${url('bg')}" alt="" draggable="false"><div class="p26o-ic"></div>`; // arka plan bir kez çizilir (replikler arasında yanıp sönmez)
    ciz();
  });
}
function ciz() {
  if (!O.on || !O.el || !S || O.el.classList.contains('yukleniyor')) return;
  const n = sahneNo(), sig = `${n}|${O.i}|${O.onay}|${O.mesgul}|${S.faction}`;
  if (sig === O.sig) return;
  O.sig = sig; O.el.dataset.s = n;
  const satir = n === 1 ? SAHNE1 : n === 3 ? SAHNE3(S.faction) : null;
  if (satir && O.i >= satir.length) O.i = satir.length - 1;
  const son = satir && O.i === satir.length - 1;
  const ileri = n === 1 ? (son ? 'Silahını kavra' : 'İleri') : n === 3 ? (son ? 'Başkente yürü' : 'İleri') : 'Saldır';
  const metin = satir ? satir[O.i] : 'Kül kokusu taşıyan avcı patikada. Kül Kurdu seni bekliyor.';
  const dlg = O.onay
    ? `<div class="p26o-onay"><p>Atlarsan öğretici bir daha açılmaz; bitirme hediyesi yine de çantana eklenir.</p><div class="p26o-onb"><button class="btn sm" data-o="skipYes">Evet, atla</button><button class="btn sm green" data-o="skipNo">Devam et</button></div></div>`
    : `<p class="p26o-txt">${esc(metin)}</p>${satir ? `<small class="p26o-say">${O.i + 1} / ${satir.length}</small>` : ''}<button class="p26o-ileri" data-o="next" ${O.mesgul ? 'disabled' : ''}><span>${ileri}</span><i aria-hidden="true">›</i></button>`;
  O.el.querySelector('.p26o-ic').innerHTML = `${n === 2 ? `<img class="p26o-kurt" src="${url('kurt_bekleme')}" alt="${KURT_AD}" draggable="false"><b class="p26o-kurtad">${KURT_AD}</b>` : ''}
    ${n === 3 ? ganimet() : ''}
    <div class="p26o-dlg">
      ${url('yashka') ? `<img class="p26o-yashka" src="${url('yashka')}" alt="" draggable="false">` : ''}
      <div class="p26o-ad"><b>${KIM.ad}</b><span> · ${KIM.unvan}</span></div>
      <button class="p26o-x" data-o="skip" title="Öğreticiyi atla" aria-label="Öğreticiyi atla"><span class="p26o-sr">Öğreticiyi atla</span><i aria-hidden="true">×</i></button>
      ${dlg}
    </div>`;
}
// Sahne 3: savaştan önceki kayda göre kazanılan akçe ve eşyalar (sayfa yenilendiyse yalnız başlık)
function ganimet() {
  const p = O.pre, ak = p ? Math.max(0, (S.akce | 0) - p.akce) : 0, yeni = p ? S.items.filter(it => !p.ids.has(it.id)).slice(0, 4) : [];
  const ch = [ak ? `<span class="p26o-gch">${ri('akce')}<b>+${fmt(ak)}</b><small>Akçe</small></span>` : '',
    p && (S.lvl | 0) > p.lvl ? `<span class="p26o-gch"><b>Sv. ${S.lvl | 0}</b><small>Seviye atladın</small></span>` : '',
    ...yeni.map(it => `<span class="p26o-gch">${ico(it)}<small>${esc(itemBase(it.b)?.name || 'Eşya')}</small></span>`)].join('');
  return `<div class="p26o-gan"><small>İlk ganimet</small><b>Kül Kurdu yenildi</b>${ch ? `<div class="p26o-gl">${ch}</div>` : '<p>Ganimetin çantana girdi.</p>'}</div>`;
}
async function tikla(e) {
  const b = e.target.closest('[data-o]'), o = b?.dataset.o;
  if (O.mesgul || O.gecis) return;
  if (o === 'skip') { O.onay = true; return ciz(); }
  if (o === 'skipNo') { O.onay = false; return ciz(); }
  if (o === 'skipYes') return atla();
  if (O.onay) return;
  if (!o && !e.target.closest('.p26o-dlg')) { if (sahneNo() === 2) return; } // sahneye dokunmak da ilerletir (savaş sahnesinde yalnız düğme)
  const n = sahneNo(), satir = n === 1 ? SAHNE1 : n === 3 ? SAHNE3(S.faction) : null;
  if (satir && O.i < satir.length - 1) { O.i++; return ciz(); }
  if (n === 2) return ACT.ormanFight();
  O.mesgul = true; ciz();
  try {
    if (n === 1) { if (await hooks.tutNext?.() !== false) { O.i = 0; O.mesgul = false; O.sig = ''; ACT.ormanFight(); } }
    else await baskente(() => hooks.tutNext?.());
  } finally { O.mesgul = false; ciz(); }
}
// Sahne 4: koyu kararma → iş (adım ilerlet / atla) → başkent → kararma açılır. Ara karelerde beyaz yok (yalnız koyu katman).
async function baskente(is) {
  O.gecis = true;
  const f = document.createElement('div'); f.className = 'p26o-fade'; $g().appendChild(f);
  void f.offsetWidth; f.classList.add('on');
  await new Promise(r => setTimeout(r, 650));
  try { await is(); } catch (err) { toast(err.message); }
  O.gecis = false;
  if (!ormanOn()) { birak(); ACT.hub?.(); }
  // başkentin resmi yerleşsin (2B sahne kurulup çizilsin), sonra kararma açılır
  await new Promise(r => setTimeout(r, 700));
  f.classList.remove('on'); setTimeout(() => f.remove(), 900);
}
async function atla() {
  O.mesgul = true; ciz();
  await baskente(() => hooks.tutSkip?.());
  O.mesgul = false; O.onay = false;
}
function birak() {
  if (!O.on) return;
  O.on = false; O.sig = ''; O.pre = null; O.w0 = null; ozelKapa();
  O.el?.remove(); O.el = null;
  if (hud.innerHTML === '') hooks.hud?.();
}

// ---------- Bağlar ----------
// Ana üs: öğretici ormandayken ana üs yerine orman sahnesi kurulur (ui-hub.js showHub'ın ilk satırı)
hooks.ormanOn = ormanOn; // savaş sonucu düğmesi (ui-battle.js) orman sürerken “Kemikli Koru’ya dön” yazar
hooks.orman = () => {
  if (!ormanOn()) { birak(); return false; }
  kur(); return true;
};
// HUD yenilemesi (dil, unvan, ödeme…) ormandayken ana üs çubuklarını çizmesin
const hubHud = hooks.hud;
hooks.hud = () => (O.on && ormanOn() ? undefined : hubHud());
onState(() => setTimeout(() => {
  if (O.gecis) return;
  if (O.on && !ormanOn()) { if (ormanSahne()) { birak(); ACT.hub?.(); } else if (!vis('battleUI') && !vis('win') && !vis('modal')) birak(); return; }
  if (O.on) return ciz();
  // öğretici yeniden başlatıldı (Ayarlar → Hesap): ana üs boştaysa orman kurulur
  if (ormanOn() && !BT.on && !hud.hidden && !vis('win') && !vis('modal') && !vis('battleUI')) ACT.hub?.();
}, 0));

// Sahne 2: öğretici savaşı (aşama 1-1). Ganimet için savaştan önceki akçe ve eşyalar saklanır.
ACT.ormanFight = () => {
  if (!ormanOn()) return ACT.hub?.();
  if (sahneNo() === 3) return toast('Kül Kurdu yenildi.');
  ozelAc();
  O.pre = { akce: S.akce | 0, lvl: S.lvl | 0, ids: new Set(S.items.map(it => it.id)) };
  // P28 M5: öğretici dövüşü doğrudan başlar (tek dalga, tek Kül Kurdu; shared/zones.js TUT_FIGHT). VS kartı 1-1'in 3 dalgasını
  // gösterdiği için atlanır; ödül ve ilerleme 1-1 akışıyla aynıdır.
  import('./ui-battle.js').then(m => m.startBattle({ stage: STAGE, tut: 1 }, false));
};
