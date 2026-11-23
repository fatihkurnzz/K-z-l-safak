// Klan penceresinin Hisar sekmesi: Hisar Kuşatması (haftalık), vergi dağılımı, Irklar Arası Vergi Havuzu, İttifak ve
// İttifak Yardımı. Kural hesaplamaz: sayılar hisar.view yanıtından (hisarops.js), sabitler shared/content.js HISAR.
import { S, now } from './api.js';
import { ACT, esc, fmt, toast, run, showModal, closeModal, confirmBox, reload, cur, med, clockText } from './ui-core.js';
import { FACTIONS, HISAR } from '../shared/content.js';
import { ri } from './icons.js';
import { bannerSvg } from './banner.js';

const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
const hm = t => { const d = new Date(t + 3 * 3600000); return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`; };
const slot = `${DAYS[HISAR.day]} ${String(HISAR.hour).padStart(2, '0')}:00–${hm(Date.UTC(2000, 0, 1, HISAR.hour - 3, HISAR.len))}`;
const bn = b => (b ? bannerSvg(b, 'sm') : `<span class="ico">${ri('clan')}</span>`);

// Hisar çizimi: ırk rengiyle sur ve burçlar; sahibi varsa burçta onun sancağı dalgalanır
function castle(f, owner) {
  const c = FACTIONS[f]?.color || '#8a7a66';
  return `<svg class="hs-castle" viewBox="0 0 160 96" aria-hidden="true">
    <path d="M0 88h160v8H0z" fill="#2a1d12"/>
    <g stroke="#2b2118" stroke-width="1.6" fill="#9a8a74"><path d="M14 88V40h14v-6h6v6h6v-6h6v6h6V40h4v48z"/><path d="M106 88V40h4v-6h6v6h6v-6h6v6h6v-6h6v6h4v48z"/>
      <path d="M44 88V30h72v58z" fill="#a89782"/><path d="M42 30h76v-8h-6v4h-6v-4h-6v4h-6v-4h-6v4h-6v-4h-6v4h-6v-4h-6v4h-6v-4h-6v4h-6v-4h-4z" fill="#8f7f6a"/>
      <path d="M70 88V66a10 10 0 0120 0v22z" fill="#1a1208"/><rect x="56" y="40" width="7" height="12" fill="#1a1208"/><rect x="97" y="40" width="7" height="12" fill="#1a1208"/></g>
    <path d="M80 22V2" stroke="#2b2118" stroke-width="1.8"/><path d="M80 3h24l-6 6 6 6H80z" fill="${owner ? c : '#5a5048'}" stroke="#1a1208" stroke-width=".8" opacity="${owner ? 1 : 0.55}"/>
  </svg>`;
}
const table = (rows, empty) => (rows?.length ? `<div class="board hs-board">${rows.map((r, i) => `<div class="${r.mine ? 'me' : ''}"><span>${i + 1}.</span>${bn(r.banner)}<b>${esc(r.name)}</b><span>${fmt(r.score)}</span></div>`).join('')}</div>` : `<p class="mut">${empty}</p>`);

export function hisarTab(D) {
  const H = D.hs;
  if (!H) return `<p class="mut">Hisar bilgisi alınamadı.</p>`;
  const O = H.owner, w = H.win, t = now(), settling = !w.open && t >= w.end && t < w.resolveAt;
  const head = `<div class="hs-head">${castle(H.f, O)}<div class="grow"><b class="hs-name">${esc(H.name)}</b>
      <div class="hs-own">${O ? `${bn(O.banner)}<span>Sahibi: <b>${esc(O.name)}</b>${O.mine ? ' <span class="chip up">Senin klanın</span>' : O.ally ? ' <span class="chip">Müttefikin</span>' : ''}</span>` : '<span class="mut">Hisar sahipsiz: vergi Irk Hazinesi’ne gider.</span>'}</div>
      <div class="hs-when">${w.open ? `<span class="chip hs-live">Kuşatma sürüyor</span> Bitişe <b data-hsend="${w.end}">${clockText(w.end - t)}</b>`
        : settling ? `<span class="chip">Sonuç hesaplanıyor</span> <b data-hsend="${w.resolveAt}">${clockText(w.resolveAt - t)}</b>`
        : `Sonraki kuşatma: <b>${slot}</b> · <b data-hsend="${w.start}">${clockText(w.start - t)}</b>`}</div></div>
    ${w.open ? `<button class="btn red" data-a="mode" data-m="siege" ${H.tries.used < H.tries.max ? '' : 'disabled'}>Kuşat · ${H.tries.used}/${H.tries.max}</button>` : ''}</div>`;
  const board = H.live ? `<h3>Kuşatma puanları <span class="mut">· bu hafta, canlı</span></h3>${table(H.live, 'Henüz puan yazan klan yok.')}<p class="mut">Klanının puanı: <b>${fmt(H.myScore)}</b> · senin katkın: <b>${fmt(H.myPart)}</b></p>`
    : `<h3>Son kuşatma <span class="mut">· ${H.last ? `${H.last.week}. hafta` : 'henüz yok'}</span></h3>${table(H.last?.top, 'Henüz sonuçlanmış kuşatma yok.')}`;
  const inc = H.inc || { own: 0, ally: 0, pool: 0 };
  const part = (cls, icon, title, who, n) => `<div class="hs-part ${cls}"><span class="ico">${ri(icon)}</span><b>1/3</b><span>${title}</span><small>${who}</small><em>${ri('akce')} ${fmt(n)}</em></div>`;
  const split = `<h3>Vergi dağılımı <span class="mut">· bu hafta</span></h3>
    <div class="hs-split">${part('own', 'gate', 'Hisar sahibi', O ? esc(O.name) : 'sahipsiz', inc.own)}${part('ally', 'clan', 'İttifak ortakları', O ? (H.ownerAllies ? `${H.ownerAllies} klan, eşit` : 'ortak yok: sahibe') : '—', inc.ally)}${part('pool', 'chest', 'Irklar arası havuz', 'Büyük Sefer galibine', inc.pool)}</div>
    <p class="mut">Irkın pazar vergisi ve ilan ücretleri hisarın sahibi varsa üçe bölünür: klan payları klan hazinesine geçer (klan ekranı açılınca), yuvarlama küsuratı havuza gider. Hisar sahipsizken vergi eskisi gibi Irk Hazinesi’ne akar.</p>`;
  const L = H.pool.last;
  const pool = `<div class="row hs-pool">${med('chest')}<div class="grow"><b>Irklar Arası Vergi Havuzu: ${ri('akce')} ${fmt(H.pool.now)} akçe</b><br>
    <span class="mut">Her hafta sonunda Büyük Sefer’i kazanan ırkın o hafta savaşa katılan üyelerine eşit bölünür, posta ile gelir.</span><br>
    <span class="chip ${H.pool.joined ? 'up' : ''}">${H.pool.joined ? 'Bu hafta Büyük Sefer’e katıldın' : 'Bu hafta henüz katılmadın'}</span>
    ${L ? `<span class="mut">Son dağıtım: ${!L.f ? 'galip yok, havuz devretti' : L.each > 0 ? `${esc(FACTIONS[L.f].name)} · ${L.count} kişi · kişi başı ${fmt(L.each)} akçe` : `${esc(FACTIONS[L.f].name)} kazandı; havuz boştu`}</span>` : ''}</div></div>`;
  const A = H.ally;
  const ally = `<h3>İttifak <span class="mut">· aynı ırktan en çok ${A.max} klan</span></h3>
    ${A.id ? `<div class="hs-ally">${A.clans.map(c => `<div class="hs-ac ${c.me ? 'me' : ''}">${bn(c.banner)}<b>${esc(c.name)}</b><small>Sv. ${c.lvl} · ${c.members} üye</small></div>`).join('')}</div>` : '<p class="mut">Klanın bir ittifakta değil. Müttefikler hisar vergisinin üçte birini paylaşır ve süreli işlere yardım eder.</p>'}
    ${A.inv.length ? `<h3>Gelen teklifler</h3>${A.inv.map(x => `<div class="row"><div class="grow"><b>${esc(x.name)}</b> <span class="mut">ittifak teklif etti</span></div>${A.can ? `<button class="btn sm green" data-a="hsAccept" data-id="${esc(x.cid)}" ${A.id ? 'disabled' : ''}>Kabul</button><button class="btn sm" data-a="hsDecline" data-id="${esc(x.cid)}">Reddet</button>` : ''}</div>`).join('')}` : ''}
    <div class="mbtns">${A.can ? `<button class="btn sm" data-a="hsInvite" ${A.clans.length >= A.max ? 'disabled' : ''}>Klana ittifak teklif et</button>${A.id ? '<button class="btn sm red tehlike" data-a="hsLeave">İttifaktan ayrıl</button>' : ''}` : '<span class="mut">İttifak işlerini Reis ve Yardımcılar yapar.</span>'}</div>`;
  const J = H.myJob;
  const help = `<h3>Yardım <span class="mut">· bugünkü ödül ${H.helpToday}/${H.helpMax}</span></h3>
    ${J ? `<div class="row">${med('anvil')}<div class="grow"><b>Klanının işi sürüyor</b> <span class="mut">· bitişe <b data-hsend="${J.end}">${clockText(J.end - t)}</b></span></div>${J.asked ? '<span class="chip up">Yardım istendi</span>' : '<button class="btn sm green" data-a="hsAsk">Yardım iste</button>'}</div>` : ''}
    ${H.help.length ? H.help.map(r => `<div class="row hs-help"><div class="grow"><b>${esc(r.job)}</b> <span class="mut">· ${esc(r.clan)}${r.who ? ` · ${esc(r.who)}` : ''}</span><br>
      <span class="mut">Kalan <b data-hsend="${r.end}">${clockText(r.end - t)}</b> · ${r.n} yardım · kısaltılan ${clockText(r.cut)} / en çok ${clockText(r.max)}</span>
      <div class="pbar hs-cut"><i style="width:${Math.min(100, 100 * r.cut / Math.max(1, r.max))}%"></i></div></div>
      <button class="btn sm ${r.done || r.self || r.cut >= r.max ? '' : 'green'}" data-a="hsHelp" data-id="${esc(r.cid)}" ${r.done || r.self || r.cut >= r.max ? 'disabled' : ''}>${r.done ? 'Yardım ettin' : r.self ? 'Senin isteğin' : r.cut >= r.max ? 'En kısa sürede' : 'Yardım et'}</button></div>`).join('') : '<p class="mut">Şu an yardım bekleyen iş yok.</p>'}
    <p class="mut">Süreli işler (Karargâh tesis yükseltmesi) için yardım istenebilir. Klanındaki ve müttefik klanlardaki her oyuncu bir işe bir kez yardım eder; her yardım özgün sürenin %${HISAR.helpPct}’u kadar kısaltır, toplam kısaltma en çok üçte ikidir (süre en az üçte birine iner). Yardım edene ${fmt(HISAR.helpAkce)} akçe (günde ${HISAR.helpDaily} kez).</p>`;
  const rules = `<p class="mut">Hisar Kuşatması her hafta ${slot} (UTC+3) arasında yapılır. Bu pencerede Hisar Kuşatması savaşları ayrı ${HISAR.tries} hak verir ve puanı klanının hisar puanına yazılır; pencere bitince en yüksek puanlı klan bir sonraki kuşatmaya kadar hisarın sahibi olur.</p>`;
  return `${head}${board}${rules}${split}${pool}${ally}${help}`;
}

ACT.hsInvite = async () => {
  const r = await run('ally.list'); if (!r) return;
  showModal(`<h3>İttifak teklifi</h3><p class="mut">Aynı ırktan, ittifakı olmayan klanlar.</p><div class="hs-list">${r.clans.map(c => `<div class="row">${bn(c.banner)}<div class="grow"><b>${esc(c.name)}</b><br><span class="mut">Sv. ${c.lvl} · ${c.members} üye</span></div><button class="btn sm green" data-a="hsSend" data-id="${esc(c.id)}" ${c.sent ? 'disabled' : ''}>${c.sent ? 'Gönderildi' : 'Teklif et'}</button></div>`).join('') || '<p class="mut">Uygun klan yok.</p>'}</div><div class="mbtns"><button class="btn" data-a="closeModal">Kapat</button></div>`, 'kl-wide');
};
ACT.hsSend = async d => { const r = await run('ally.invite', { id: d.id }); if (r) { closeModal(); toast(r.accepted ? `${r.name} ittifaka katıldı.` : `${r.name} klanına teklif gönderildi.`); reload(); } };
ACT.hsAccept = async d => { const r = await run('ally.accept', { id: d.id }); if (r) { toast(`${r.name} ile ittifak kuruldu.`); reload(); } };
ACT.hsDecline = async d => { if (await run('ally.decline', { id: d.id })) reload(); };
ACT.hsLeave = () => confirmBox('İttifaktan ayrıl', 'Klanın ittifaktan ayrılır; vergi payı ve yardımlaşma biter. İki klanlık ittifak dağılır.', async () => { if (await run('ally.leave')) { toast('İttifaktan ayrıldınız.'); reload(); } }, 'Ayrıl');
ACT.hsAsk = async () => { if (await run('help.ask')) { toast('Yardım istendi.'); reload(); } };
ACT.hsHelp = async d => { const r = await run('help.give', { id: d.id }); if (r) { toast(`Süre ${clockText(r.cut)} kısaldı.${r.akce ? ` +${fmt(r.akce)} akçe` : ''}`); reload(); } };
// Geri sayımlar; süre dolunca sekme tazelenir
setInterval(() => {
  const els = document.querySelectorAll('[data-hsend]'); if (!els.length) return;
  for (const el of els) { const left = +el.dataset.hsend - now(); el.textContent = clockText(left); if (left <= 0 && !el.dataset.done) { el.dataset.done = 1; setTimeout(() => { if (cur()?.tab === 'hisar') reload(); }, 1500); } }
}, 1000);
// Rehber'den (ui-rehber.js) doğrudan Hisar sekmesine
ACT.clanHisar = () => ACT.clan({ tab: 'hisar' });
