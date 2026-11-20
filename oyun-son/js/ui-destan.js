// Destan penceresi (20 Kas): "VAHRAN: Tarihin Külleri"nin sekiz bölümü. Kurallar shared/destan.js.
// Bölüm: giriş sahnesi (halkına göre) → oynanış (savaş: modes.js 'destan' · bulmaca/iz sürme/rün okuma: 'destan.solve') →
// bitiş sahnesi. Bitmiş bölümde öteki halkın anlatısı "kilitli anı" olarak açılır.
// Giriş: Kapı → Destan, kralın konuşması → Destan.
import { S } from './api.js';
import { ACT, esc, openWin, showModal, closeModal, redraw, toast, lootToast, run } from './ui-core.js';
import { FACTIONS } from '../shared/content.js';
import { DESTAN, DESTAN_BY, chapterOpen, chapterDone, otherFaction, needsBattle } from '../shared/destan.js';
import { startBattle } from './ui-battle.js';

const KIND = { battle: 'Savaş', puzzle: 'Arşiv bulmacası', trail: 'İz sürme', runes: 'Rün okuma + boss' };
const fac = f => FACTIONS[f]?.name || f;
const done = id => chapterDone(S, id);
function listHtml() {
  const n = DESTAN.filter(c => done(c.id)).length;
  return `<div class="ds-head"><b>VAHRAN: Tarihin Külleri</b><span class="mut">${n}/${DESTAN.length} bölüm · ${fac(S.faction)} anlatısı</span></div>
    <div class="ds-list">${DESTAN.map(C => { const open = chapterOpen(S, C.id), ok = done(C.id);
      return `<div class="ds-ch ${ok ? 'ok' : open ? 'open' : 'lock'}"><span class="ds-rom">${C.roman}</span><div class="grow"><b>${esc(C.name)}</b><span class="ds-kind">${KIND[C.kind]}</span><br><span class="mut">${esc(C.play)}</span>
        <div class="chips">${ok ? '<span class="chip up">Tamam</span>' : open ? '<span class="chip">Açık</span>' : `<span class="chip">Kilitli · Sv. ${C.lvl}${C.id > 1 && !done(C.id - 1) ? ' · önceki bölüm' : ''}</span>`}${ok ? `<span class="chip">Kilitli anı açıldı: ${fac(otherFaction(S.faction))}</span>` : ''}</div></div>
        <div class="ds-btns">${open ? `<button class="btn ${ok ? '' : 'red'}" data-a="destanPlay" data-id="${C.id}">${ok ? 'Yeniden oyna' : 'Oyna'}</button>` : ''}${ok ? `<button class="btn sm" data-a="destanMemory" data-id="${C.id}">Anı</button>` : ''}</div></div>`; }).join('')}</div>`;
}
ACT.destan = () => openWin({ title: 'Destan', render: listHtml });
// Sahne: satırlar sırayla belirir; sonda düğme
const scene = (C, f, part, btn) => showModal(`<div class="ds-scene ${f}" style="--fc:${FACTIONS[f]?.color || '#d9b04a'}"><small>${C.roman} · ${esc(C.name)}${f !== S.faction ? ' · kilitli anı' : ''}</small><h2>${part === 'intro' ? esc(C.name) : 'Bölüm sonu'}</h2>
  ${C.tale[f][part].map((l, i) => `<p style="animation-delay:${0.25 + i * 0.9}s">${esc(l)}</p>`).join('')}<div class="mbtns">${btn}</div></div>`, 'ds-box');
ACT.destanPlay = d => { const C = DESTAN_BY[+d.id]; if (!C) return; closeModal(); scene(C, S.faction, 'intro', `<button class="btn red" data-a="destanGo" data-id="${C.id}">${C.kind === 'battle' ? 'Savaşa' : 'Başla'}</button>`); };
ACT.destanGo = d => { const C = DESTAN_BY[+d.id]; closeModal(); if (C.kind === 'battle') return startBattle({ mode: 'destan', ch: C.id }); PZ = { id: C.id, picks: [], step: 0 }; puzzle(); };
ACT.destanOutro = d => { const C = DESTAN_BY[+d.id]; if (!C) return; scene(C, S.faction, 'outro', `<button class="btn" data-a="destanMemory" data-id="${C.id}">Öteki tarafın anısı</button><button class="btn red" data-a="destanBack">Destan</button>`); };
ACT.destanMemory = d => { const C = DESTAN_BY[+d.id]; if (!C || !done(C.id)) return toast('Bu anı bölüm bitince açılır.'); const o = otherFaction(S.faction);
  showModal(`<div class="ds-scene ${o}" style="--fc:${FACTIONS[o].color}"><small>${C.roman} · ${esc(C.name)} · kilitli anı: ${fac(o)}</small><h2>Öteki taraftan</h2>${[...C.tale[o].intro, ...C.tale[o].outro].map((l, i) => `<p style="animation-delay:${0.2 + i * 0.6}s">${esc(l)}</p>`).join('')}<div class="mbtns"><button class="btn" data-a="destanBack">Destan</button></div></div>`, 'ds-box'); };
ACT.destanBack = () => { closeModal(); ACT.destan(); };

// ---------- Bulmacalar ----------
// puzzle (Arşiv) ve runes (Rün okuma): bütün satırlar seçilir, sonra doğrulanır. trail (İz sürme): her adımda yanlış işaret
// gözcüyü uyandırır; adım baştan (doğru cevap seçilene dek ilerlenmez).
let PZ = null;
function puzzle() {
  const C = DESTAN_BY[PZ.id], T = C.kind === 'trail', st = C.puzzle[PZ.step];
  const head = T ? `Adım ${PZ.step + 1}/${C.puzzle.length} · işarete karşılık ver` : C.kind === 'runes' ? `Taşın iki yüzü · ${PZ.step + 1}/${C.puzzle.length}` : `Yarı yanmış tutanak · ${PZ.step + 1}/${C.puzzle.length}`;
  showModal(`<div class="ds-pz"><small>${C.roman} · ${esc(C.name)}</small><h2>${KIND[C.kind]}</h2><p class="mut">${head}</p><p class="ds-q">${esc(st.q)}</p>
    <div class="ds-opts">${st.opts.map((o, i) => `<button class="btn" data-a="destanPick" data-i="${i}">${esc(o)}</button>`).join('')}</div>${PZ.msg ? `<p class="ds-msg">${PZ.msg}</p>` : ''}
    <div class="mbtns"><button class="btn sm" data-a="destanBack">Vazgeç</button></div></div>`, 'ds-box');
}
ACT.destanPick = async d => {
  const C = DESTAN_BY[PZ.id], i = +d.i, T = C.kind === 'trail';
  if (T && i !== C.puzzle[PZ.step].a) { PZ.msg = 'Bir gözcü kıpırdadı. Nefesini tut; işarete yeniden bak.'; return puzzle(); }
  PZ.msg = ''; PZ.picks.push(i); PZ.step++;
  if (PZ.step < C.puzzle.length) return puzzle();
  const r = await run('destan.solve', { id: C.id, picks: PZ.picks });
  if (!r) { PZ = { id: C.id, picks: [], step: 0, msg: 'Parçalar yerine oturmadı. Baştan, daha dikkatli.' }; return puzzle(); }
  closeModal();
  if (r.battle) { toast('Taş okundu. Mührün sahibi gölgeden çıkıyor…'); return startBattle({ mode: 'destan', ch: C.id }); }
  if (r.loot?.length) lootToast?.(r.loot);
  ACT.destanOutro({ id: C.id });
};
