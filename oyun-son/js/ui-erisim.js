// Ayarlar → Erişilebilirlik sekmesi ve ana ekrandaki erişilebilirlik simgesi. Ayarlar cihazda saklanır (a11y.js);
// burası yalnızca düğmeleri çizer ve sesli ipuçlarının ekrandaki yazısını gösterir. Stiller css/v9.css (.ae-*, html.a-*).
import { ACT, redraw, med, toast } from './ui-core.js';
import { A, A11Y_DEFAULT, setA11y } from './a11y.js';
import { setPlayHook } from './audio.js';
import { replayFragman } from './ui-fragman.js';

const sw = (on, k) => `<button class="btn sm ${on ? 'green' : ''} aytog" data-a="aeTog" data-k="${k}" aria-pressed="${on}">${on ? 'Açık' : 'Kapalı'}</button>`;
const seg = (k, opts) => `<span class="ae-seg">${opts.map(([v, l]) => `<button class="${String(A[k]) === String(v) ? 'on' : ''}" data-a="aeSet" data-k="${k}" data-v="${v}">${l}</button>`).join('')}</span>`;
const row = (icon, name, note, ctl, on) => `<div class="row">${med(icon, on ? 'green' : '')}<div class="grow"><b>${name}</b><br><span class="mut">${note}</span></div><div class="qb">${ctl}</div></div>`;
const head = t => `<h3 class="ae-h">${t}</h3>`;

export function pageErisim() {
  const pct = Math.round(A.scale * 100);
  return `<div class="ae">
    <div class="row ae-scale">${med('expand', 'gold')}<div class="grow"><b>Oyunu ölçeklendir</b> <b class="ae-val">%${pct}</b><br><span class="mut">Pencereler, düğmeler ve ana ekran parçaları birlikte küçülür ya da büyür; 3B sahne değişmez.</span>
      <label class="aysl"><input type="range" min="80" max="115" step="5" value="${pct}" data-ae="scale" aria-label="Oyun ölçeği"><output>%${pct}</output></label></div><div class="qb"><button class="btn sm" data-a="aeSet" data-k="scale" data-v="${A11Y_DEFAULT.scale}">Varsayılan</button></div></div>
    ${head('Görme')}
    ${row('book', 'Yazı boyutu', 'Küçük yazılar (10–12 piksel) okunaklı hâle gelir.', seg('text', [['n', 'Normal'], ['l', 'Büyük'], ['xl', 'Çok büyük']]), A.text !== 'n')}
    ${row('gem', 'Renk körü modu', 'Nadirlik çerçeve deseni ve işaretle, olumlu/olumsuz etkiler ▲/▼ ile de ayrılır.', sw(A.cb, 'cb'), A.cb)}
    ${row('star', 'Yüksek kontrast', 'Parşömen üstündeki yazılar koyulaşır, kenarlar netleşir.', sw(A.hc, 'hc'), A.hc)}
    ${head('Işık ve hareket')}
    ${row('bolt', 'Ekran parlaması', 'Kritik, evre ve örs sonucundaki beyaz parlama.', sw(!A.noFlash, 'noFlash'), !A.noFlash)}
    ${row('stomp', 'Kamera sarsıntısı', 'Kritik vuruş, Boss ve büyü sarsıntıları.', sw(!A.noShake, 'noShake'), !A.noShake)}
    ${row('star', 'Işıma (bloom)', 'Parlayan yüzeylerin hâlesi. Kapatmak zayıf telefonda hızı da artırır.', sw(!A.noBloom, 'noBloom'), !A.noBloom)}
    ${row('timer', 'Vuruşta kısa donma', 'Her vuruştaki ve kritikteki anlık duraklama (hit-stop).', sw(!A.noStop, 'noStop'), !A.noStop)}
    ${head('Duyma')}
    ${row('send', 'Ses kanalları', 'Müzik ve ortam, efekt ve arayüz sesleri ayrı ayarlanır.', '<button class="btn sm" data-a="aeSes">Ses ayarları</button>', false)}
    ${row('send', 'Tek kanal (mono) ses', 'İki kulağa aynı ses gider; tek kulaklık kullananlar için.', sw(A.mono, 'mono'), A.mono)}
    ${row('news', 'Görsel karşılıklar', 'Örs sonucu, Boss girişi, zafer gibi sesli ipuçları ekranda yazıyla da görünür.', sw(A.captions, 'captions'), A.captions)}
    ${head('Dokunma ve zamanlama')}
    ${row('melee', 'Büyük dokunma alanı', 'Düğmeler en az 44 piksel olur (kaynak +, kapatma düğmesi…).', sw(A.bigTouch, 'bigTouch'), A.bigTouch)}
    ${row('timer', 'Süre uzatma', `Canlı Meydan’da hamle süresi iki katına çıkar.`, sw(A.slowTimer, 'slowTimer'), A.slowTimer)}
    ${row('party', 'Tek elle oynama', 'Alt menü ekranın bir yanına yaslanır.', seg('hand', [['l', 'Sola'], ['c', 'Orta'], ['r', 'Sağa']]), A.hand !== 'c')}
    ${row('lock', 'Yatay yönü sabitle', 'Oyun her zaman yatay çizilir (telefon dik tutulsa da). Bu seçenek o anki yatay yönü (sol/sağ) sabitler; yalnızca tam ekranda çalışır (iPhone Safari izin vermez).', sw(A.orient === 'lock', 'orient'), A.orient === 'lock')}
    ${head('Bilişsel')}
    ${row('battle', 'Savaş hızı', 'Savaşların açılış hızı; savaş içinde yine değiştirilebilir.', seg('speed', [['0.7', 'Yavaş'], ['1', 'Normal'], ['2', 'Hızlı']]), A.speed !== 1)}
    ${row('rank', 'Büyük sıra ve can çubukları', 'Savaştaki birimlerin üstündeki çubuklar büyür.', sw(A.bigTurn, 'bigTurn'), A.bigTurn)}
    ${row('quest', 'Öğretici ve fragman', 'Açılış anlatımını yeniden izle.', '<button class="btn sm" data-a="aeTut">İzle</button>', false)}
    ${row('mail', 'Sohbeti kapat', 'Ana ekrandaki sohbet şeridi gizlenir (Menü’den yine açılır). Engelleme ve küfür süzgeci açık kalır.', sw(A.noChat, 'noChat'), A.noChat)}
    ${row('news', 'Bildirim sınırı', 'Etkinlik hatırlatma bandı (başlamadan 1 saat ve 5 dakika önce) gösterilmez; etkinlik saatleri Sefer › Etkinlikler sekmesinde durur.', sw(A.noTicker, 'noTicker'), A.noTicker)}
    <p class="mut">Erişilebilirlik ayarları bu cihazda saklanır.</p></div>`;
}
const TOGGLE_INV = { noFlash: 1, noShake: 1, noBloom: 1, noStop: 1 };
ACT.aeTog = d => { const k = d.k; if (k === 'orient') setA11y({ orient: A.orient === 'lock' ? 'auto' : 'lock' }); else setA11y({ [k]: !A[k] }); redraw(); if (TOGGLE_INV[k] === undefined && k !== 'orient') toast(A[k] ? 'Açıldı.' : 'Kapandı.'); };
ACT.aeSet = d => { const k = d.k, v = k === 'scale' || k === 'speed' ? +d.v : d.v; setA11y({ [k]: v }); redraw(); };
ACT.aeSes = () => ACT.settings({ tab: 'ses' });
ACT.aeTut = () => { ACT.closeWin?.(); replayFragman(); };
ACT.erisim = () => ACT.settings({ tab: 'erisim' });
// Ölçek kaydırıcısı: bırakınca uygulanır (sürüklerken pencere küçülüp parmak kaymasın diye)
document.addEventListener('input', e => { if (e.target?.dataset?.ae === 'scale') { const o = e.target.parentElement.querySelector('output'); if (o) o.textContent = `%${e.target.value}`; } });
document.addEventListener('change', e => { if (e.target?.dataset?.ae === 'scale') { setA11y({ scale: Math.max(0.8, Math.min(1.15, +e.target.value / 100)) }); redraw(); } });

// ---- Görsel karşılıklar: sesli ipucu çalınca ekranın altında kısa yazı ----
const CAP = {
  'anvil.ok': '♪ Örs: başarılı', 'anvil.fail': '♪ Örs: başarısız', 'anvil.drop': '♪ Örs: seviye düştü', 'anvil.break': '♪ Örs: kırıldı', 'anvil.safe': '♪ Örs: muska korudu',
  'bt.boss': '♪ Boss geliyor', 'bt.victory': '♪ Zafer', 'bt.defeat': '♪ Yenilgi', 'bt.wave': '♪ Yeni dalga', 'bt.enrage': '♪ Boss öfkelendi',
  'id.plus10': '♪ +10!', 'id.siege': '♪ Kuşatma borusu', 'id.ocak': '♪ Ork davulu', 'id.sancak': '♪ İnsan borusu', 'ann.ping': '♪ Sunucu duyurusu', 'ui.horn': '♪ Boru çaldı',
};
let capEl = null, capT = 0;
setPlayHook(name => {
  if (!A.captions || !CAP[name]) return;
  if (!capEl) { capEl = document.createElement('div'); capEl.id = 'aecap'; capEl.setAttribute('aria-live', 'polite'); (document.getElementById('game') || document.body).appendChild(capEl); }
  capEl.textContent = CAP[name]; capEl.classList.add('on');
  clearTimeout(capT); capT = setTimeout(() => capEl.classList.remove('on'), 1800);
});
