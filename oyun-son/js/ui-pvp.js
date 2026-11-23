// "pvp" paketinin ekranları: meydan sezonu ve eşleştirme bilgisi, zorluk kademeleri, haftalık zindan düzeni, aylık
// Yeraltı Ocağı, Nöbet (uzun oto-farm), çanta dolu uyarısı ve "Dönüm noktaları". Arayüz kural hesaplamaz: tabloları
// shared/pvp.js ve shared/pvpcalc.js'ten okur, kazancı ve beklentiyi sunucuya sorar. Stiller css/pvp.css'te.
// Diğer modüller (ui-battle, ui-town, ui-hub) buradaki parçaları kendi sayfalarına yerleştirir; bu modül onları içe aktarmaz.
import { S, now } from './api.js';
import { ACT, hooks, hud, $, esc, fmt, xpGain, toast, run, showModal, closeModal, confirmBox, openWin, redraw, reload, cur, lootBox, lootChip, locked, lockNote, loading, clockText, med, myTier } from './ui-core.js';
import { LEAGUES, FACTIONS, BAG_LIMIT, PREMIUM, GAME, xpNeed } from '../shared/content.js';
import { ZONES, STAGES_PER_ZONE } from '../shared/zones.js';
import { SKILLS } from '../shared/skills.js';
import { itemLevel } from '../shared/hero.js';
import { STONES } from '../shared/items.js';
import { tierOpen, stageOpen } from '../shared/calc.js';
import { nextWeekAt } from '../shared/meta.js';
import {
  MATCH, ilBand, SEASON, seasonOf, seasonNo, seasonEndAt, seasonWeek, softWeek, softSeason, leagueIndex, ARENA_PTS, LEAGUE_REWARD, RANK_REWARD, SEASON_TITLES, seasonGive, markTitles,
  STAGE_TIERS, starsOf, CLIMB, climbLevel, climbRewards, MOD_MODES, modNow, modById, modLines, modBonusLines, FARM, farmActive,
} from '../shared/pvp.js';
import { farmZoneOpen, farmStock, farmCapHours } from '../shared/pvpcalc.js';
import { svg, ri } from './icons.js';
import { skillIcon } from './skill-icons.js';

// Ortak durum: Kapı'nın bölgeler sekmesinde seçili zorluk kademesi (ui-battle.js okur)
export const PV = { tier: 0 };
const DAY = 86400000, HOUR = 3600000;
// Kalan süre: bir günden uzunsa "3g 5sa", değilse saat/dakika
const left = ms => (ms >= DAY ? `${Math.floor(ms / DAY)}g ${Math.floor(ms % DAY / HOUR)}sa` : clockText(ms));
const pc = v => '%' + Math.round(v * 100);
const tr = (n, d = 1) => n.toFixed(d).replace('.', ',');
const approx = n => (n >= 10 ? '~' + Math.round(n) : n >= 0.05 ? '~' + tr(n) : n > 0 ? '~' + tr(n, 2) : '0');
const MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
const dateText = ms => { const d = new Date(ms + 3 * HOUR); return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`; }; // sunucu saati UTC+3

// ======================= Çanta dolu =======================
// Sunucu 'bag-full' ile reddettiğinde düz bildirim yerine yer açma kısayollarını gösteren kutu çıkar (ui-core: run → hooks.err)
export function bagFullBox() {
  showModal(`<h2>Çanta dolu</h2><div class="in"><p><b>Çantanda yer yok: ${S.items.length}/${BAG_LIMIT} eşya.</b> Önce eşya sat ya da parçala.</p>
    <p class="mut">Çanta doluyken eşya düşüren savaşlara (bölgeler, Yeraltı Ocağı, Mühürlü Oda) girilmez; eşyalı ödüller toplanmaz. Posta ekleri postada bekler, kaybolmaz.</p>
    <div class="mbtns"><button class="btn red tehlike" data-a="bagBreak">${ri('toz', '#fff')} Parçala ya da sat</button>${locked('market') ? '' : `<button class="btn" data-a="bagMarket">${ri('market')} Pazarda ilana koy</button>`}</div></div>`, 'pv-bag');
}
hooks.err = e => { if (e?.code !== 'bag-full') return false; bagFullBox(); return true; };
ACT.bagBreak = () => { closeModal(); locked('anvil') ? ACT.party() : ACT.breakWin(); };
ACT.bagMarket = () => { closeModal(); ACT.market(); };
// Çanta dolmaya yakınken sayfa başında uyarı (bölgeler ve Nöbet sayfası)
export const bagNote = () => {
  const n = S.items.length;
  if (n < BAG_LIMIT - 10) return '';
  return `<div class="hint pv-bagn ${n >= BAG_LIMIT ? 'full' : ''}">${ri('bag')} <span><b>Çanta ${n}/${BAG_LIMIT}.</b> ${n >= BAG_LIMIT ? 'Yer açmadan eşya düşüren savaşa girilmez.' : 'Dolunca eşya düşüren savaşa girilmez.'}</span><button class="btn sm" data-a="bagBreak">Yer aç</button></div>`;
};

// ======================= Zorluk kademeleri =======================
const tierStars = t => { let a = 0; const st = starsOf(S, t); for (const k in st) a += st[k] || 0; return a; };
const lastStage = `${ZONES.length}-${STAGES_PER_ZONE}`;
// Kademenin oyuncuya gösterilen özeti: sayılar kuralların okuduğu tablodan gelir. Kısa hâli çip satırıdır, uzun hâli kutuda açılır.
const mul = v => '×' + tr(v).replace(/,0$/, '');
export function tierNote(t) {
  const T = STAGE_TIERS[t];
  if (!t) return '';
  const D = T.drop;
  return `<div class="chips pv-tnote"><span class="chip down">Direnç +${pc(T.res)}</span><span class="chip down">Delme ${pc(T.pen)}</span><span class="chip up">Eşya ${mul(D.gear)}</span><span class="chip up">Nadir ${pc(D.rare[0])}</span><span class="chip up">Eşsiz ${mul(D.unique)}</span><span class="chip up">İz ${mul(D.marks)}</span><button class="chip pv-more" data-a="tierInfo" data-t="${t}">Ayrıntı ›</button></div>`;
}
ACT.tierInfo = d => {
  const T = STAGE_TIERS[+d.t]; if (!T?.drop) return;
  const D = T.drop;
  showModal(`<h2>${T.name} kademe</h2><div class="in" style="text-align:left">
    <p>Aynı 100 aşama, aynı dizilimle; ama bütün yaratıklar <b>Sv. ${T.lvl}</b> ve bölgeden bölgeye sertleşir.</p>
    <p class="warn">Zorluk</p><p>Her yaratık kendi silah türüne ve zayıf olmadığı elementlere <b>+${pc(T.res)}</b> dirençlidir, vuruşları savunmanın <b>${pc(T.pen)}</b>’sini deler. Zayıf olduğu elemente direnç eklenmez: doğru elementle vurmak daha da önemlidir.</p>
    <p class="up"><b>Karşılığı</b></p><p>Eşya düşme oranı <b>${mul(D.gear)}</b>; sıradan yaratıktan düşen eşyanın <b>${pc(D.rare[0])}</b>’i, azılıdan düşenin <b>${pc(D.rare[1])}</b>’i Nadir. İnce taş <b>${mul(D.stone1)}</b>, Usta taş <b>${mul(D.stone2)}</b>, Tav Közü <b>${mul(D.ember)}</b>, eşsiz şansı <b>${mul(D.unique)}</b>, boss izi <b>${mul(D.marks)}</b>, kesim akçesi <b>${mul(T.akce)}</b>. İlk geçiş: kapı ${T.first.gate}, boss ${T.first.boss} yakut.</p>
    <p class="mut">Yaratık aşaması ${T.energy.mob}, kapı ${T.energy.gate} enerji; boss’lar enerjisizdir. Yıldızlar, seri savaş ve günlük boss hakkı bu kademeye özeldir. Bir sonraki kademe, bu kademede ${ZONES.at(-1).name} son boss’u geçilince açılır.</p>
    </div>`, 'pv-wide');
};
export function tierBar() {
  // üst kademeler son bölgeye gelene kadar hiç gösterilmez (yeni oyuncunun bölge ekranı sade kalsın)
  if (!tierOpen(S, 1) && !PV.tier) return !stageOpen(S, `${ZONES.length}-1`) ? '' : `<div class="pv-tiers one"><span class="mut">${ri('lock')} <b>${STAGE_TIERS[1].name}</b> ve <b>${STAGE_TIERS[2].name}</b> kademeler: ${ZONES.at(-1).name} son boss’u geçilince bütün bölgeler daha sert yaratıklar ve daha iyi ganimetle yeniden açılır.</span></div>`;
  return `<div class="pv-tiers">${STAGE_TIERS.map(T => { const open = tierOpen(S, T.id); return `<button data-a="tier" data-t="${T.id}" class="t${T.id} ${T.id === PV.tier ? 'on' : ''} ${open ? '' : 'lock'}">${open ? '' : ri('lock')}<b>${T.name}</b><small>${open ? `${tierStars(T.id)}/${ZONES.length * STAGES_PER_ZONE * 3} ★` : `${STAGE_TIERS[T.id - 1].name} bitince`}</small></button>`; }).join('')}</div>`;
}
ACT.tier = d => {
  const t = +d.t;
  if (!STAGE_TIERS[t]) return;
  if (!tierOpen(S, t)) return toast(`${STAGE_TIERS[t].name} kademe, ${STAGE_TIERS[t - 1].name} kademede ${ZONES.at(-1).name} son boss’u (${lastStage}) geçilince açılır.`);
  PV.tier = t; redraw();
};

// ======================= Haftalık zindan düzeni =======================
const MODE_NAME = { well: 'Dipsiz Kuyu', depth: 'Yeraltı Ocağı', rift: 'Gök Yarığı', seal: 'Mühürlü Oda' };
const modGain = M => [...modBonusLines(M).filter(l => !/ek ganimet/.test(l)), ...(M.loot ? [`Zaferde ek ganimet: ${lootChip(M.loot)}`] : [])];
export function modBanner() {
  const M = modNow(now());
  return `<div class="row pv-mod">${med('events', 'violet')}<div class="grow"><b>Haftanın düzeni: ${M.name}</b> <span class="chip">Bitişine ${left(nextWeekAt(now()) - now())}</span><br>
    <span class="mut">${modLines(M).join(' · ')}.</span><br><span class="up pv-gain">${modGain(M).join(' · ')}</span></div><button class="btn sm" data-a="modInfo">Düzenler</button></div>`;
}
ACT.modInfo = () => {
  const cur2 = modNow(now()).id, w0 = nextWeekAt(now());
  // sıradaki haftalar: bu haftadan başlayarak tablo sırası
  const order = Array.from({ length: 6 }, (_, i) => modNow(now() + i * 7 * DAY));
  showModal(`<h2>Zindan düzenleri</h2><div class="in" style="text-align:left"><p class="mut">Her pazartesi 00:00’da sıradaki düzen başlar; ${MOD_MODES.map(m => MODE_NAME[m]).join(', ')} yaratıklarına uygulanır. Karşılık yalnızca zaferde verilir.</p>
    ${order.map((M, i) => `<div class="row ${M.id === cur2 ? 'hit' : ''}"><span class="tag">${i ? dateText(w0 + (i - 1) * 7 * DAY) : 'Şimdi'}</span><div class="grow"><b>${M.name}</b><br><span class="mut">${modLines(M).join(' · ')}.</span><br><span class="up pv-gain">${modGain(M).join(' · ')}</span></div></div>`).join('')}
    </div>`, 'pv-wide');
};
// Savaş öncesi ekranında (zindan modları) ve sonuçta gösterilen satırlar
export const modVsNote = mode => { if (!MOD_MODES.includes(mode)) return ''; const M = modNow(now()); return `<div class="hint pv-modv"><b>Haftanın düzeni · ${M.name}:</b> ${modLines(M).join(' · ')}. <span class="up">${modGain(M).join(' · ')}</span></div>`; };
export const modResultLine = r => { const M = modById(r.mod); return M ? `Haftanın düzeni: <b>${M.name}</b>${r.win ? ` · <span class="up">${modBonusLines(M).map(l => l.replace('Zaferde ', '')).join(', ')}</span>` : ''}` : ''; };

// ======================= Yeraltı Ocağı: aylık tırmanış =======================
const giveChips = give => give.map(d => (d.t === 'gear' ? '<span class="chip rw gn g1">Nadir eşya</span>' : lootChip(d))).join('');
export function depthVs() {
  const f = S.depth + 1, boss = f % 5 === 0, M = modNow(now());
  return { title: `Yeraltı Ocağı · ${f}. kat`, energy: CLIMB.energy, rules: [boss ? 'Kapı boss’u katı' : '2 dalga', f > CLIMB.deep ? 'Kor katı: yaratıklar kat kat sertleşir' : 'Her 5 katta boss', `Düzen: ${M.name}`],
    unknown: `Sv. ${climbLevel(f)} yaratıklar.`, extra: `<div class="hint"><b>${f}. kat ödülü:</b> <span class="chips" style="display:inline-flex">${giveChips(climbRewards(f))}</span></div>${modVsNote('depth')}` };
}
// Zindanlar sekmesindeki satır. lockChips: kilit çipleri · enterBtn: "Gir" düğmesi (ui-battle üretir)
export function depthRow(lockChips, enterBtn) {
  const done = S.depth >= CLIMB.floors, canSweep = !locked('depth') && S.depth < (S.depthPrev || 0);
  const chips = [...lockChips, done ? `Dönem tamam: ${CLIMB.floors}/${CLIMB.floors}` : `Sıradaki kat ${S.depth + 1}/${CLIMB.floors}`, `${CLIMB.energy} enerji`, `Sıfırlanmasına ${left(seasonEndAt(now()) - now())}`, ...(S.depthBest ? [`En derin ${Math.max(S.depthBest, S.depth)}. kat`] : [])];
  return `<div class="row">${med('depth', 'violet')}<div class="grow"><b>Yeraltı Ocağı</b><br><span class="mut">Kat kat in; her kat ilk geçişte taş ve Nadir eşya verir. Katlar her sezon başında sıfırlanır, ödüller yeniden alınır.</span><div class="chips">${chips.map(c => `<span class="chip">${c}</span>`).join('')}</div></div>
    <div class="pv-dq">${enterBtn}<div>${canSweep ? `<button class="btn sm blue" data-a="depthSweep">Seri iniş</button>` : ''}<button class="btn sm" data-a="depthFloors">Katlar</button></div></div></div>`;
}
let floorSel = 0;
ACT.depthFloors = d => {
  floorSel = +d?.f || Math.min(CLIMB.floors, S.depth + 1);
  const tile = f => `<button data-a="depthFloors" data-f="${f}" class="${f <= S.depth ? 'done' : f === S.depth + 1 ? 'cur' : ''} ${f % 5 === 0 ? 'boss' : ''} ${f > CLIMB.deep ? 'deep' : ''} ${f === floorSel ? 'sel' : ''}">${f}</button>`;
  showModal(`<h2>Yeraltı Ocağı</h2><div class="in" style="text-align:left">
    <p class="mut">${CLIMB.floors} kat. Her sezon başında (${left(seasonEndAt(now()) - now())} sonra) sıfırlanır; her katın ödülü dönem başına bir kez alınır.${S.depthPrev ? ` Önceki dönemde <b>${S.depthPrev}. kata</b> indin: o kata kadar <b>seri iniş</b> yapabilirsin.` : ''}</p>
    <div class="pv-floors">${Array.from({ length: CLIMB.floors }, (_, i) => tile(i + 1)).join('')}</div>
    <div class="hint"><b>${floorSel}. kat</b> <span class="mut">· Sv. ${climbLevel(floorSel)}${floorSel % 5 === 0 ? ' · kapı boss’u' : ''}${floorSel > CLIMB.deep ? ' · kor katı' : ''}${floorSel <= S.depth ? ' · bu dönem geçildi' : ''}</span><div class="chips">${giveChips(climbRewards(floorSel))}</div></div>
    <p class="mut">Kalın çerçeveli katlar boss katıdır (ek Usta taş ve yakut). ${CLIMB.deep}. kattan sonraki kor katları 65. seviyededir, kat kat sertleşir ve parça verir.</p>
    </div>`, 'pv-wide');
};
ACT.depthSweep = () => confirmBox('Seri iniş', `Önceki dönemde indiğin ${S.depthPrev}. kata kadar katları sunucu senin yerine oynatır (en çok ${CLIMB.sweepMax} kat). Her kat ${CLIMB.energy} enerji harcar ve kendi ödülünü verir; yenilgide, enerji ya da çanta bitince durur.`, async () => {
  const r = await run('depth.sweep', { n: CLIMB.sweepMax }); if (!r) return;
  showModal(`<h2>Seri İniş</h2><div class="in"><p><b>${r.wins ? `${r.from + 1}. kattan ${r.floor}. kata inildi` : `${r.from + 1}. kat geçilemedi`}</b> · ${r.wins}/${r.runs} zafer</p><p>${ri('xp')} ${xpGain(r.xp)} · ${ri('akce')} +${fmt(r.akce)} akçe</p>${r.levels ? levelUpNote(S.lvl - r.levels, S.lvl) : ''}${r.bagFull ? '<p class="warn">Çanta doldu: kalan katlar oynanmadı.</p>' : ''}${lootBox(r.loot)}<div class="mbtns"><button class="btn" data-a="closeModal">Tamam</button></div></div>`);
  redraw();
}, 'İn');

// ======================= Meydan: sezon ve eşleştirme =======================
const isBot = id => typeof id === 'string' && id.startsWith('bot:');
const vsWins = o => (o && o.id !== undefined && !isBot(o.id) && S.arena.vs && Object.hasOwn(S.arena.vs, String(o.id)) ? S.arena.vs[String(o.id)] : 0);
const leagueBadge = (l, small) => `<span class="pv-lg l${l} ${small ? 'sm' : ''}">${svg('crown')}<b>${LEAGUES[l].name}</b></span>`;
const seasonGames = () => (S.arena.sw || 0) + (S.arena.sl || 0);
// Meydan sekmesinin başındaki sezon şeridi ve eşleştirme satırı
export function seasonHead() {
  const A = S.arena, t = now(), l = leagueIndex(A.rating), next = LEAGUES[l + 1], base = LEAGUES[l].min, g = seasonGames();
  const prog = next ? Math.max(0, Math.min(1, (A.rating - base) / (next.min - base))) : 1, il = itemLevel(S, 'arena'), band = ilBand(il);
  return `<div class="row pv-szn">${leagueBadge(l)}<div class="grow"><b>Sezon ${seasonNo(seasonOf(t))}</b> <span class="chip">Bitişine ${left(seasonEndAt(t) - t)}</span>${nextWeekAt(t) < seasonEndAt(t) ? ` <span class="chip">Haftalık sıfırlama ${left(nextWeekAt(t) - t)}</span>` : ''}
      <div class="pbar"><i style="width:${prog * 100}%"></i></div><span class="mut">${A.rating} puan · ${next ? `${next.name} ligine ${next.min - A.rating} puan` : 'en üst lig'} · bu sezon ${A.sw || 0} galibiyet / ${A.sl || 0} yenilgi${g < SEASON.minGames ? ` · ödül için ${SEASON.minGames - g} dövüş daha` : ''}</span></div>
    <button class="btn" data-a="season">${ri('gift')} Sezon</button></div>
    <p class="mut pv-match">${ri('rank')} Eşleştirme <b>Eşya Seviyesi</b>’ne göredir: seninki <b>${il}</b>, rakiplerin <b>${band.lo}–${band.hi}</b> arasından (±${pc(MATCH.steps[0])}) seçilir. Aralıkta yeterli oyuncu yoksa ±${pc(MATCH.steps[1])}, sonra ±${pc(MATCH.steps[2])}’ye genişler.</p>`;
}
// Rakip satırındaki çipler: genişlemiş aralık, bu sezon aynı rakibe karşı galibiyet sayısı (puan azalmaz)
export function oppTags(o) {
  const out = [], w = vsWins(o);
  if (o.band > 0 && MATCH.steps[o.band]) out.push(`<span class="chip">Geniş aralık ±${pc(MATCH.steps[o.band])}</span>`);
  if (w > 0) out.push(`<span class="chip">Bu sezon ${w} kez yendin</span>`);
  return out.length ? `<div class="chips">${out.join('')}</div>` : '';
}
export const oppRule = () => []; // aynı rakibe tekrar zaferde de +3 (azalma yok)
export const dimResult = () => '';

const SV = { tab: 'now' };
ACT.season = d => {
  SV.tab = d?.tab || 'now';
  openWin({ title: 'Meydan Sezonu', tab: SV.tab, back: 'seasonBack', tabs: [{ id: 'now', label: 'Sezon', small: 'Durum, sıralama', icon: 'arena' }, { id: 'rew', label: 'Ödüller', small: 'Lig ve sıra', icon: 'gift' }, { id: 'hist', label: 'Geçmiş', small: 'Kapanan sezonlar', icon: 'list' }],
    onTab: t => { SV.tab = t; }, load: t => (t === 'now' && !locked('arena') ? run('season.view') : null), render: t => (locked('arena') ? `<div class="hint">${ri('lock')} Meydan: ${lockNote('arena')}</div>` : t === 'rew' ? seasonRewards() : t === 'hist' ? seasonHist() : seasonNow()) });
};
ACT.seasonBack = () => ACT.gate({ tab: 'pvp' });
const boardRows = rows => rows.map((r, i) => `<div class="${r.me ? 'me' : ''}"><span>${i + 1}.</span><b style="color:${FACTIONS[r.faction]?.color || 'inherit'}">${esc(r.name)}</b><span>${r.rating} puan</span></div>`).join('');
function titleRows() {
  const ids = markTitles(S.arena.mark, now());
  if (!ids.length) return '';
  return `<h3>Sezon unvanın <span class="mut">· bu sezon boyunca seçilebilir</span></h3>${ids.map(id => `<div class="row">${med('crown', 'gold')}<div class="grow"><b>${SEASON_TITLES[id]}</b><br><span class="mut">Profilinde, sohbette ve sıralamada adının yanında görünür; fotoğrafına sezon çerçevesi takar.</span></div><button class="btn sm ${S.ach?.title === id ? '' : 'green'}" data-a="seasonTitle" data-id="${S.ach?.title === id ? '' : id}">${S.ach?.title === id ? 'Kaldır' : 'Seç'}</button></div>`).join('')}`;
}
ACT.seasonTitle = async d => { const r = await run('season.title', { id: d.id || null }); if (r) { toast(r.title ? `Unvanın: ${SEASON_TITLES[r.title]}` : 'Sezon unvanı kaldırıldı.'); redraw(); } };
function seasonNow() {
  const D = cur().data;
  if (!D) return loading;
  const A = S.arena, l = leagueIndex(A.rating), g = seasonGames(), weeksLeft = SEASON.weeks - 1 - seasonWeek(now());
  // hiç dövüşmezse: sezonun kalan pazartesilerinde haftalık sıfırlama, sonra sezon sıfırlaması (sunucuyla aynı işlevler)
  let fin = A.rating; for (let i = 0; i < weeksLeft; i++) fin = softWeek(fin);
  return `<div class="row pv-szn">${leagueBadge(l)}<div class="grow"><b>Sezon ${D.no}</b> <span class="mut">· ${dateText(D.start)} – ${dateText(D.end - 1)} · bitişine ${left(D.end - now())}</span><br>
      <span>${A.rating} puan · ${D.rank ? `<b>${D.rank}. sıra</b>` : g < SEASON.minGames ? `sıralama için ${SEASON.minGames - g} dövüş daha` : 'ilk 200’ün dışında'} · ${A.sw || 0} galibiyet / ${A.sl || 0} yenilgi</span></div></div>
    <div class="kv pv-kv"><div><small>Pazartesi puanın</small>${weeksLeft ? softWeek(A.rating) : 'sezon biter'}</div><div><small>Dövüşmezsen sezon sonu</small>${fin} · ${LEAGUES[leagueIndex(fin)].name}</div><div><small>Yeni sezona başlangıç</small>${softSeason(fin)}</div><div><small>Ödül için dövüş</small>${Math.min(g, SEASON.minGames)}/${SEASON.minGames}</div></div>
    ${titleRows()}
    <div class="hint"><b>Nasıl işler?</b> Sezon ${SEASON.days} gündür. Her pazartesi 1000’in üstündeki puanının ${pc(1 - SEASON.weekKeep)}’si silinir; sezon bitince ödül postana gelir ve yeni sezona 1000’in üstünün ${pc(SEASON.seasonKeep)}’ıyla başlarsın.
      Her zafer ve yenilmeden savunma +${ARENA_PTS.win} puandır; aynı oyuncuyu tekrar yenmek de tam puan verir.</div>
    <div class="pv-cols"><div><h3>Bu sezonun ilk onu</h3>${D.top.length ? `<div class="board">${boardRows(D.top)}</div>` : `<p class="mut">Henüz ${SEASON.minGames} dövüşü tamamlayan yok.</p>`}</div>
      <div><h3>Geçen sezon${D.last ? ` (${D.last.no})` : ''}</h3>${D.last?.top.length ? `<div class="board">${boardRows(D.last.top)}</div>` : '<p class="mut">Geçen sezonun dökümü yok.</p>'}</div></div>`;
}
function seasonRewards() {
  const l = leagueIndex(S.arena.rating), ranks = RANK_REWARD.map((R, i) => ({ R, from: i ? RANK_REWARD[i - 1].max + 1 : 1 }));
  return `<div class="hint">Ödül, sezon bitince <b>postayla</b> gelir; sezon içinde en az <b>${SEASON.minGames} dövüş</b> gerekir. Lig ödülü sezonu kapattığın puana, sıra ödülü ilk ${SEASON.topN} içindeki yerine göre verilir; ikisi toplanır. Parçalar Kader Çarkı’nda kırılır.</div>
    <h3>Lig ödülleri</h3>${LEAGUES.map((L, i) => `<div class="row ${i === l ? 'hit' : ''}">${leagueBadge(i, true)}<div class="grow"><span class="mut">${L.min ? `${L.min} puan ve üstü` : `${LEAGUES[1].min} puanın altı`}${i === l ? ' · şu anki ligin' : ''}</span><div class="chips">${seasonGive(i, 0).map(lootChip).join('')}${LEAGUE_REWARD[i].title ? `<span class="chip rw pv-tt">Unvan ve çerçeve: ${SEASON_TITLES[LEAGUE_REWARD[i].title]}</span>` : ''}</div></div></div>`).join('')}
    <h3>Sıra ödülleri <span class="mut">· lig ödülüne eklenir</span></h3>${ranks.map(({ R, from }) => `<div class="row"><span class="tag">${from === R.max ? `${from}.` : `${from}–${R.max}.`}</span><div class="grow"><div class="chips">${[{ t: 'yakut', n: R.yakut }, ...['kor', 'ayaz', 'simsek'].map(k => ({ t: 'shard', k, n: R.shard }))].map(lootChip).join('')}${R.title ? `<span class="chip rw pv-tt">Unvan ve çerçeve: ${SEASON_TITLES[R.title]}</span>` : ''}</div></div></div>`).join('')}
    <p class="mut">Unvan ve çerçeve bir sonraki sezon boyunca kullanılır.</p>`;
}
function seasonHist() {
  const H = S.arena.hist || [];
  return `${titleRows()}${H.length ? H.map(h => `<div class="row ${h.paid ? '' : 'dim'}">${leagueBadge(h.lg, true)}<div class="grow"><b>Sezon ${seasonNo(h.sn)}</b> <span class="mut">· ${h.r} puan · ${h.rank ? `${h.rank}. sıra` : 'sıralama dışı'} · ${h.w} galibiyet / ${h.l} yenilgi</span>
      <div class="chips">${h.paid ? seasonGive(h.lg, h.rank).map(lootChip).join('') : `<span class="chip">Ödülsüz: ${SEASON.minGames} dövüşten az</span>`}</div></div><span class="chip ${h.paid ? 'up' : ''}">${h.paid ? 'Postalandı' : '—'}</span></div>`).join('') : '<p class="mut">Henüz kapanmış bir sezonun yok. Sezon bitince ligin, sıran ve ödülün burada listelenir.</p>'}
    <p class="mut">Son ${SEASON.histMax} sezon saklanır.</p>`;
}

// Seviye atlayınca sonuç kutusunda gösterilen satır (dönüm noktaları kaldırıldı: yalnızca seviye ve kazanç)
export function levelUpNote(from, to, gain = '') {
  return `<p class="up"><b>Seviye atladın! Seviye ${to}</b>${gain ? ` · ${gain}` : ''}</p>`;
}
