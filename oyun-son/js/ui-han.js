// P28 Han arayüzü (TALIMAT.md §4.2–4.3): içecek buff'ları, Sıcak Çorba, başkent ve savaş HUD rozeti.
// Kurallar game/shared/han.js'tedir (tek buff yuvası, needConfirm, çorba günde 2). Bu dosya yalnız gösterir ve `han.drink` gönderir.
import { ACT, esc, fmt, run, toast, hooks, energyNow } from './ui-core.js';
import { S, now } from './api.js';
import { dayKey, ENERGY } from '../shared/content.js';
import { DRINKS, tavernBuff } from '../shared/han.js';
import { ZAFER, zaferBuffActive } from '../shared/zafer.js';
import { binaAc, binaCiz, binaAcik, kbRes } from './ui-ahir.js';

const HANCI = 'Cepheye çıkmadan önce boğazını ıslat savaşçı; tek seferde bir kadeh etki eder.'; // şartname §4.3 (aynen)
let pending = null; // onay bekleyen yeni buff içeceği
const soupsToday = () => (S.han?.soupDay === dayKey(now()) ? S.han.soups || 0 : 0);
const dk = ms => Math.max(1, Math.ceil(ms / 60000));
/** Buff'ın kalan hakkı: "N savaş · M dk". */
export const buffLeft = b => `${b.left} savaş · ${dk(b.exp - now())} dk`;

function drinkHtml([id, D]) {
  const b = tavernBuff(S, now()), on = b?.id === id, soup = id === 'corba', used = soupsToday();
  const meta = soup ? `Günde ${D.perDay} kez · bugün ${used}/${D.perDay}` : on ? `Etkin · ${buffLeft(b)} kaldı` : `${D.minutes} dk veya ${D.battles} savaş`;
  const off = soup && used >= D.perDay;
  return `<article class="kh-card${on ? ' on' : ''}${pending === id ? ' bekle' : ''}">
    <img class="kh-ic" src="${D.icon}" alt="" width="256" height="256" decoding="async">
    <div class="kh-tx"><h3>${esc(D.name)}</h3><p>${esc(D.desc)}</p><small class="${on ? 'kh-etkin' : ''}">${meta}</small></div>
    <button class="kb-btn gold" data-a="hanIc" data-id="${id}" ${off ? 'disabled' : ''}>${off ? 'Bugünkü hak bitti' : `İç · ${fmt(D.cost)} Akçe`}</button>
  </article>`;
}
function confirmHtml() {
  const b = tavernBuff(S, now());
  if (!pending || !b) return '';
  return `<div class="kh-onay" role="alertdialog"><span>${esc(DRINKS[b.id].name)} etkisi silinip ${esc(DRINKS[pending].name)} etkisi başlayacak.</span><button class="kb-btn gold" data-a="hanOnay">Onayla</button><button class="kb-btn" data-a="hanVazgec">Vazgeç</button></div>`;
}
const hanHead = () => `<h2 class="kb-h">Han</h2><div class="kb-rs">${kbRes('akce', 'Akçe', fmt(S.akce))}${kbRes('energy', 'Enerji', `${energyNow().e}/${ENERGY.max}`)}</div>`;
const hanBody = () => `<div class="kh-hanci"><img src="img/p28/han_hanci.webp" alt="Hancı" width="64" height="64" decoding="async"><p>${HANCI}</p></div>
  ${confirmHtml()}<div class="kh-grid">${Object.entries(DRINKS).map(drinkHtml).join('')}</div>`;
const hanRedraw = () => { if (binaAcik() === 'korant-modal-tavern') binaCiz(hanHead(), hanBody()); };

async function drink(id, confirm) {
  const r = await run('han.drink', confirm ? { id, confirm: true } : { id });
  pending = null;
  if (r) toast(id === 'corba' ? `+${r.energy} Enerji` : `${DRINKS[id].name} etkisi başladı.`);
  hanRedraw(); hooks.hud();
}
/** Han penceresini açar (başkent hotspot'u `han`). */
ACT.han = () => { pending = null; binaAc('korant-modal-tavern', 'Han', hanHead(), hanBody(), () => { pending = null; }); };
/** İç: başka buff etkinse önce tek satırlık onay gösterilir; çorba buff yuvasını ezmez. */
ACT.hanIc = d => {
  const id = d.id, b = tavernBuff(S, now());
  if (!Object.hasOwn(DRINKS, id)) return;
  if (id !== 'corba' && b) { pending = id; return hanRedraw(); }
  drink(id, false);
};
ACT.hanOnay = () => { if (pending) drink(pending, true); };
ACT.hanVazgec = () => { pending = null; hanRedraw(); };
/** Şartnamedeki ad (takma ad). */
export const openTavernModal = () => ACT.han();

/** HUD rozeti (başkent ve savaş): etkin Han içeceğinin 28×28 ikonu + kalan savaş/süre; Zafer buff'ı etkinse küçük rozet.
 *  Etkin buff yoksa boş döner (ikon inmez). */
export function p28BuffRozet() {
  if (!S) return '';
  const b = tavernBuff(S, now()), z = zaferBuffActive(S, now());
  if (!b && !z) return '';
  return `<div class="p28-rz">${b ? `<span class="p28-rz-han" title="${esc(b.name)}: ${esc(b.desc)}"><img src="${b.icon}" alt="${esc(b.name)}" width="28" height="28"><b>${buffLeft(b)}</b></span>` : ''}${z ? `<span class="p28-rz-zf" title="${esc(ZAFER.win.name)}: +%${ZAFER.win.xpPct} EXP / +%${ZAFER.win.akcePct} Akçe">Zafer · ${Math.max(1, Math.ceil((S.zafer.buffUntil - now()) / 3600000))} sa</span>` : ''}</div>`;
}
hooks.p28Hud = p28BuffRozet;
