// Görev panosu: Günlük, Haftalık ve Aylık görevlerin ortak görünümü (ui-town.js dailyQuestsHtml, ui-kalicilik.js).
// Üstte sandığa giden ilerleme yolu (bitirilen görev sayısı; hepsi bitince sandık parlar ve açılır), altında görev kartları:
// büyük simge, halka biçimli ilerleme, öne çıkan ödül, "Hazır" kartı nabız gibi parlar, biten görev mühürle damgalanır.
// Kural hesaplamaz; ilerleme ve ödüller çağıranın verdiği tablolardan okunur. Stiller css/v9.css (.qb2-*).
import { med, lootChip, esc } from './ui-core.js';

const CHEST = (open) => `<svg viewBox="0 0 64 52" aria-hidden="true">
  <path d="M6 22 H58 V48 H6Z" fill="#7a4a22" stroke="#1a0f06" stroke-width="3"/><path d="M6 30 H58 M6 40 H58" stroke="#4a2a12" stroke-width="2"/>
  <path d="M12 22 V48 M52 22 V48" stroke="#c99a2e" stroke-width="4"/>
  ${open ? '<path d="M6 22 L10 4 H54 L58 22Z" fill="#8a5a2a" stroke="#1a0f06" stroke-width="3"/><path d="M14 20 Q32 2 50 20" fill="#ffe9a0" opacity=".85"/>'
    : '<path d="M6 22 Q6 6 32 6 Q58 6 58 22Z" fill="#8a5a2a" stroke="#1a0f06" stroke-width="3"/><path d="M12 21 Q12 9 32 9 Q52 9 52 21" fill="none" stroke="#c99a2e" stroke-width="3"/>'}
  <rect x="27" y="24" width="10" height="12" rx="2" fill="#e7c75a" stroke="#1a0f06" stroke-width="2"/></svg>`;

const ring = (n, need) => { const p = Math.min(1, n / need); return `<div class="qb2-ring" style="--c:${p >= 1 ? '#7ed36a' : '#e7c75a'}"><svg viewBox="0 0 36 36"><circle cx="18" cy="18" r="15.9" class="bg"/><circle cx="18" cy="18" r="15.9" class="fg" stroke-dasharray="${(p * 100).toFixed(1)} 100"/></svg><b>${n}<small>/${need}</small></b></div>`; };

// o: { list:[{id,name,need,reward}], prog(q), done(id), claim: işlem adı, go: işlem adı ya da null, icon(q), noGo(q),
//      allDone, allGot, bonusAct, bonus: [ödül], bonusName, timer: metin, extra: listenin başına eklenecek kartlar (HTML) }
export function questBoard(o) {
  const finished = o.list.filter(q => o.done(q.id)).length, total = o.list.length;
  const steps = o.list.map((_, i) => `<i class="${i < finished ? 'on' : ''}" style="left:${(100 * (i + 1)) / (total + 0.4)}%"></i>`).join('');
  const ready = o.allDone && !o.allGot;
  const card = q => {
    const n = o.prog(q), ok = o.done(q.id), can = n >= q.need && !ok, st = ok ? 'done' : can ? 'ready' : '';
    return `<div class="qb2-card ${st}">
      <div class="qb2-top">${med(o.icon(q), ok ? 'green' : can ? 'gold' : '')}${ring(n, q.need)}</div>
      <b class="qb2-name">${esc(q.name)}</b>
      <div class="qb2-rw"><small>Ödül</small>${lootChip(q.reward)}</div>
      <div class="qb2-act">${ok ? '<span class="qb2-got">Alındı</span>' : can ? `<button class="btn green" data-a="${o.claim}" data-id="${q.id}">Ödülü al</button>` : o.go && !o.noGo?.(q) ? `<button class="btn blue" data-a="${o.go}" data-id="${q.id}">Git</button>` : `<span class="qb2-wait">${q.need - n} kaldı</span>`}</div>
      ${ok ? '<i class="qb2-stamp">TAMAM</i>' : can ? '<i class="qb2-burst"></i>' : ''}</div>`;
  };
  return `<div class="qb2">
    <div class="qb2-track ${ready ? 'ready' : ''}">
      <div class="qb2-head"><b>${finished}/${total} görev</b><span class="mut">${o.timer}</span></div>
      <div class="qb2-path"><div class="qb2-fill" style="width:${(100 * finished) / (total + 0.4)}%"></div>${steps}</div>
      <button class="qb2-chest ${ready ? 'rdy' : ''} ${o.allGot ? 'got' : ''}" data-a="${o.bonusAct}" ${ready ? '' : 'disabled'} title="${esc(o.bonusName)}">${CHEST(o.allGot)}</button>
      <div class="qb2-bonus"><small>${esc(o.bonusName)}</small>${o.bonus.map(lootChip).join(' ')}</div>
    </div>
    <div class="qb2-grid">${o.extra || ''}${o.list.map(card).join('')}</div></div>`;
}
