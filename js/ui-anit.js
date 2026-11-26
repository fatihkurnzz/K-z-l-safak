// Anıt Savaşı (shared/anit.js): Yemin Pazarı'nda Şaman Yashka'nın penceresinden girilir (Kristal Nöbeti ile aynı NPC).
// Yashka'ya dokununca seçim: Kristal Nöbeti ya da Anıt Savaşı. Savaş ekranındaki puan/anıt şeridi combat.js'tedir.
import { S } from './api.js';
import { ACT, esc, showModal, closeModal } from './ui-core.js';
import { ANIT, bracketOf } from '../shared/anit.js';
import { NOBET } from '../shared/nobet.js';
import { FACTIONS } from '../shared/content.js';
import { startBattle } from './ui-battle.js';

// 23 Kas (C8): görsel roman diyaloğu, G4 Yashka portresi; iki yol son sayfanın düğmeleri
ACT.yashka = async () => { const { diyalog } = await import('./ui-diyalog.js');
  diyalog({ kim: 'yashka', ad: 'Şaman Yashka', unvan: 'Kemik okuyucu', halk: S?.faction === 'ocak' ? 'ocak' : 'sancak',
    satirlar: ['Kemiklerim iki yol gösteriyor, yiğit. Hangisine yürürsün?',
      `${NOBET.name}: partilerle dalgalara karşı nöbet. ${ANIT.name}: iki ırkın partisi Sınır Anıtı'nda karşılaşır (Sv. ${ANIT.minLevel}+).`],
    son: [{ t: NOBET.name, a: 'yashkaNobet' }, { t: ANIT.name, a: 'anit', ana: true }] }); };
ACT.yashkaNobet = () => { closeModal(); ACT.nobet(); };
ACT.anit = () => {
  const br = bracketOf(S.lvl), left = Math.max(0, ANIT.daily - (S.daily?.anit || 0)), foe = S.faction === 'ocak' ? 'sancak' : 'ocak';
  const lock = S.lvl < ANIT.minLevel;
  showModal(`<h2>${ANIT.name}</h2><div class="in anit-info">
    <p><b style="color:${FACTIONS[S.faction]?.color}">${esc(FACTIONS[S.faction]?.name || '')}</b> partin ile <b style="color:${FACTIONS[foe]?.color}">${esc(FACTIONS[foe]?.name || '')}</b> partisi sınırda karşılaşır. Sahanın sağında iki tarafın da vurabildiği <b>${ANIT.mon}</b> durur.</p>
    <ul class="anit-rules">
      <li>${ANIT.side}'e ${ANIT.side} · ${ANIT.rounds} raunt (raunt: sahadaki herkes bir kez oynar)</li>
      <li>Rakip öldürmek <b>1 puan</b> · düşen kahraman <b>${ANIT.respawn} raunt</b> sonra tam canla döner</li>
      <li>Anıt her ${ANIT.regenEvery} rauntta canının %${Math.round(ANIT.regenPct * 100)}'ini yeniler</li>
      <li>Anıt kesilirse anıta verilen hasarın <b>%50,1</b> ve fazlasını vuran taraf kazanır</li>
      <li>Kesilmezse çok puanlı taraf; puan eşitse anıta çok hasar veren kazanır</li>
    </ul>
    <p class="mut">${br ? `Kuşağın: Sv. ${br.min}–${br.max}` : ''} · Bugün kalan hak: <b>${left}/${ANIT.daily}</b> · Bu sürümde yoldaşların ve rakipler yapay zekâyla oynar.</p>
    <div class="mbtns"><button class="btn red" data-a="anitGo" ${lock || !left ? 'disabled' : ''}>${lock ? `Sv. ${ANIT.minLevel}'de açılır` : left ? 'Savaşa gir' : 'Bugünlük hak bitti'}</button><button class="btn" data-a="closeModal">Vazgeç</button></div></div>`, 'anit-box');
};
ACT.anitGo = () => { closeModal(); startBattle({ mode: 'anit' }); };
