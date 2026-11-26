// Taş Yemini ortak baskını (20 Kas): Kapı → Etkinlikler kartı, girişte kısa tören, sonra VS ekranı (ui-battle.js MODE_VS.yemin).
// Kurallar shared/yemin.js; savaş modes.js `yemin`. Tören yalnız görünüştür (2,6 sn; dokununca geçilir).
import { S, now } from './api.js';
import { ACT, esc, fmt, showModal, closeModal, hooks } from './ui-core.js';
import { FACTIONS, weekKey } from '../shared/content.js';
import { YEMIN, yeminDone, yeminRewards, yeminLevel } from '../shared/yemin.js';

const other = () => (S.faction === 'ocak' ? 'sancak' : 'ocak');
// Kapı → Etkinlikler kartı
hooks.yeminCard = () => {
  const done = yeminDone(S, weekKey(now())), lock = S.lvl < YEMIN.unlock, o = FACTIONS[other()];
  return `<h3 style="margin-top:10px">Taş Yemini <span class="mut">· haftalık ortak baskın</span></h3>
    <div class="row ty-card"><span class="ty-stone" aria-hidden="true"><i class="h a"></i><i class="h b"></i></span><div class="grow"><b>İki halk, tek taş</b><br><span class="mut">${esc(o.name)} yoldaşlarınla aynı gruptasın. Küllerin Tarikatı’nın Yemin Bozan’ını devir. İlk zafer iki halkın malzemesini birleştiren <b>Taş Yemini</b> çerçevesini verir.</span>
      <div class="chips">${lock ? `<span class="chip">Kilitli · Sv. ${YEMIN.unlock}</span>` : ''}<span class="chip">${done ? 'Bu hafta tutuldu' : 'Bu hafta açık'}</span><span class="chip">${YEMIN.waves} dalga</span><span class="chip">${fmt(yeminRewards(yeminLevel(S))[0].n)} akçe</span></div></div>
      <button class="btn red" data-a="yeminGo" ${lock || done ? 'disabled' : ''}>Yemin et</button></div>`;
};
// Giriş töreni: iki el taşa basılır, taşın iki yüzü iki halkın rengiyle yanar
let tmr = 0;
ACT.yeminGo = () => {
  const a = FACTIONS[S.faction], b = FACTIONS[other()];
  showModal(`<div class="ty-rite" data-a="yeminRite" style="--ca:${a.color};--cb:${b.color}"><div class="ty-big"><i class="h a"></i><i class="h b"></i><b class="rune">◈</b></div>
    <h2>Taş Yemini</h2><p>${esc(a.name)} ile ${esc(b.name)} aynı taşa el basar.<br><i class="mut">“Kül de olsak, yemin taşta kalır.”</i></p><small class="mut">Geçmek için dokun</small></div>`, 'ty-box');
  clearTimeout(tmr); tmr = setTimeout(() => ACT.yeminRite(), 2600);
};
ACT.yeminRite = () => { clearTimeout(tmr); closeModal(); ACT.mode({ m: 'yemin' }); };
