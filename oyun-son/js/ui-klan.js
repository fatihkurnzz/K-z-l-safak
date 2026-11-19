// Klan Karargâhı: klansız oyuncunun ekranı (klan arama, davetler, kurma) ve klan evi
// (Genel, Üyeler, Görevler, Dükkân, Sancak, Oba Avı). Kural hesaplamaz: tablolar shared/clan.js'ten okunur,
// her işlem sunucuya sorulur (clan.*), ekrandaki sayılar clan.view yanıtından ve oyuncu kaydından gelir.
import { S, now } from './api.js';
import { world } from './world.js';
import { ACT, $, hud, win, modal, esc, fmt, toast, run, showModal, closeModal, confirmBox, openWin, redraw, reload, cur, mobImg, lootToast, lootChip, lootKind, locked, lockNote, loading, med, resTile, achTag, tName, clockText } from './ui-core.js';
import { ilvTag } from './esya-parts.js';
import { CLAN, FACTIONS, dayKey } from '../shared/content.js';
import { CLAN_LEVELS, CLAN_MAX_LEVEL, CLAN_DONATE, CLAN_XP, NISAN, RANKS, RANK_KEYS, PERMS, can, SUCCESSION_DAYS, CLAN_QUESTS, CLAN_SHOP, HUNT_DIFF, HUNT_CHESTS, huntRankReward, donateCap,
  BANNER_PAIRS, CAPE_COLORS, EMBLEMS, EMBLEM_KEYS, CAPE_STEPS, capeStep, capeOf, HQ_FAC, HQ_KEYS, HQ_MAX, hqLvl, hqCost, hqTime } from '../shared/clan.js';
import { ri } from './icons.js';
import { bannerSvg, emblemSvg, capeSvg } from './banner.js';
import { hisarTab } from './ui-hisar.js';

const K = { tab: 'genel', draft: null, draftOf: null };
const TABS = [
  { id: 'hq', label: 'Karargâh', small: 'Ortak üs', icon: 'gate' },
  { id: 'genel', label: 'Genel', small: 'Seviye, bağış', icon: 'clan' }, { id: 'uyeler', label: 'Üyeler', small: 'Rütbeler', icon: 'party' },
  { id: 'gorev', label: 'Görevler', small: 'Ortak hedefler', icon: 'quest' }, { id: 'dukkan', label: 'Dükkân', small: NISAN.name, icon: 'market' },
  { id: 'sancak', label: 'Sancak', small: 'Renk, amblem, pelerin', icon: 'star' }, { id: 'av', label: 'Oba Avı', small: 'Tepegöz', icon: 'skull' },
  { id: 'hisar', label: 'Hisar', small: 'Kuşatma, ittifak', icon: 'siege' },
];
const TOP_TABS = ['hq', 'genel', 'uyeler', 'gorev', 'dukkan', 'av'];
const rankChip = r => `<span class="chip kl-rk ${r}">${RANKS[r].name}</span>`;
const rankByOrder = n => RANKS[RANK_KEYS.find(k => RANKS[k].order === n) || 'uye'].name;
const minRank = perm => rankByOrder(PERMS[perm].min);
const ago = t => { const d = dayKey(now()) - dayKey(t); return d <= 0 ? 'bugün' : d === 1 ? 'dün' : `${d} gün önce`; };
const when = t => { const ms = now() - t; return ms < 3600000 ? `${Math.max(1, Math.floor(ms / 60000))} dk önce` : ms < 86400000 ? `${Math.floor(ms / 3600000)} sa önce` : ago(t); };
const mark = () => { K.open = true; win.classList.add('klan'); }; // sekme şeridi altı sekmeyle kısa ekrana sığsın (klan.css)

// ---------- Giriş: klan varsa ev, yoksa arama ekranı ----------
ACT.clan = d => {
  if (d?.tab) K.tab = d.tab;
  if (S.clan) K.fromHq = false;
  if (locked('clan')) return openWin({ title: 'Klan Karargâhı', render: () => `<div class="hint">${ri('lock')} ${lockNote('clan')}</div>` });
  if (!S.clan) return openWin({ title: 'Klan Karargâhı', load: loadLobby, render: lobby });
  // 19 Kas: sekme şeridinde yalnız altı ana sekme, pencerenin üstünde (top). Sancak ve Hisar klan toprağındaki binalarından açılır;
  // onlardan biri açıksa şeritte geçici olarak görünür.
  const tabs = TABS.filter(t => TOP_TABS.includes(t.id) || t.id === K.tab);
  const cfg = { title: 'Klan Karargâhı', tab: K.tab, tabs, top: true, load: loadHome, render: home, onTab: t => { K.tab = t; } };
  openWin(cfg);
  // Oba Avı sekmesi açıkken toplam hasar, sandık kademeleri ve sıralama kendiliğinden yenilenir (canlı av)
  clearInterval(K.timer);
  K.timer = setInterval(() => { if (cur() !== cfg) return clearInterval(K.timer); if (cfg.tab === 'av' && modal.hidden && !document.hidden) reload(); }, 12000);
};
// Ana üsteki Klan Karargâhı binası: klan varsa ortak üs ekranı, yoksa klan arama (ui-hub.js BUILDINGS: act 'clanhq')
ACT.clanhq = () => { if (S.clan && !locked('clan')) return ACT.goKlan(); K.fromHq = !S.clan; ACT.clan({ tab: 'hq' }); }; // VAHRAN: klanı olan ayrı klan haritasına gider
async function loadLobby() {
  const r = await run('clan.search');
  if (S.clan) { setTimeout(() => ACT.clan(), 0); return null; } // bekleyen başvuru onaylanmış
  return r;
}
async function loadHome(tab) {
  const r = await run('clan.view');
  if (r && !r.gone && tab === 'hisar') r.hs = await run('hisar.view'); // Hisar sekmesi: kuşatma, vergi, ittifak, yardım (ui-hisar.js)
  if (r?.gone) toast('Artık bu klanın üyesi değilsin.');
  if (!r || r.gone) { if (!S.clan) setTimeout(() => ACT.clan(), 0); return null; }
  return r;
}

// ---------- Klansız: davetler, klan kurma, taraftaki klanlar ----------
function lobby() {
  K.open = true;
  const D = cur().data;
  if (!D) return loading;
  const row = (c, btn, note = '') => `<div class="row">${bannerSvg(c.banner, 'md')}<div class="grow"><b>${esc(c.name)}</b> <span class="chip">Sv. ${c.lvl}</span><br><span class="mut">${c.members}/${c.max} üye · ${c.open ? 'herkese açık' : 'başvuruyla'}${c.minPower ? ` · en az ${fmt(c.minPower)} güç` : ''}${note}</span></div>${btn}</div>`;
  const join = c => c.members >= c.max ? '<button class="btn sm" disabled>Dolu</button>'
    : c.open ? `<button class="btn sm green" data-a="clanJoin" data-id="${esc(c.id)}">Katıl</button>`
    : c.applied ? `<button class="btn sm" data-a="clanUnapply" data-id="${esc(c.id)}">Başvuruyu geri çek</button>`
    : `<button class="btn sm" data-a="clanApply" data-id="${esc(c.id)}">Başvur</button>`;
  return `${K.fromHq ? hqJoin() : ''}<div class="hint">Klan, aynı taraftan oyuncuların birliğidir: birlikte <b>Oba Avı</b>'na çıkar, klan görevlerini tamamlar, bağışla klanı büyütür. Klan seviyesi üye sınırını ve <b>pelerininin boyunu</b> belirler: klana girince karakterin klanın pelerinini kuşanır.</div>
    ${D.invites.length ? `<h3>Davetler</h3>${D.invites.map(c => row(c, `<button class="btn sm green" data-a="clanJoin" data-id="${esc(c.id)}" ${c.members < c.max ? '' : 'disabled'}>Katıl</button><button class="btn sm" data-a="clanDecline" data-id="${esc(c.id)}">Reddet</button>`, ` · davet eden: ${esc(c.by)}`)).join('')}` : ''}
    <div class="row">${med('clan', 'red')}<div class="grow"><b>Klan kur</b> <span class="mut">(${ri('akce')} ${fmt(CLAN.cost)} akçe)</span><br><input type="text" id="cname" maxlength="16" placeholder="Klan adı (3-16 harf)" autocomplete="off" data-enter="clanCreate" style="width:100%;margin-top:4px"></div><button class="btn red" data-a="clanCreate">Kur</button></div>
    <h3>${FACTIONS[S.faction].name} klanları</h3>${D.clans.map(c => row(c, join(c))).join('') || '<p class="mut">Henüz klan yok. İlkini sen kur.</p>'}`;
}
ACT.clanCreate = async () => { if (await run('clan.create', { name: $('#cname').value })) { toast('Klan kuruldu. Reis sensin.'); ACT.clan({ tab: 'genel' }); } };
ACT.clanJoin = async d => { if (await run('clan.join', { id: d.id })) { toast(`${S.clanName} klanına katıldın.`); ACT.clan({ tab: 'genel' }); } else reload(); };
ACT.clanApply = async d => { const r = await run('clan.apply', { id: d.id }); if (r) { toast(r.joined ? 'Başvurun onaylanmış.' : 'Başvurun gönderildi.'); S.clan ? ACT.clan() : reload(); } };
ACT.clanUnapply = async d => { if (await run('clan.unapply', { id: d.id })) reload(); };
ACT.clanDecline = async d => { if (await run('clan.decline', { id: d.id })) reload(); };

// ---------- Klan evi ----------
function home(tab) {
  mark();
  const D = cur().data;
  if (!D) return loading;
  return tab === 'hq' ? hq(D) : tab === 'uyeler' ? members(D) : tab === 'gorev' ? quests(D) : tab === 'dukkan' ? shop(D) : tab === 'sancak' ? bannerTab(D) : tab === 'av' ? huntTab(D) : tab === 'hisar' ? hisarTab(D) : general(D);
}
const myCape = D => ({ c: D.clan.banner.c, a: D.clan.banner.a, s: D.clan.banner.s, l: capeStep(D.clan.lvl) });
// Bir seviyenin getirdikleri (tablolardan)
function perksOf(l) {
  const L = CLAN_LEVELS[l - 1], out = [`${L.cap} üye`];
  if (L.huntAkce) out.push(`Oba Avı akçesi +%${L.huntAkce}`);
  for (const it of CLAN_SHOP) if (it.lvl === l) out.push(`Dükkân: ${it.name}`);
  HUNT_DIFF.forEach((h, i) => { if (i && h.lvl === l) out.push(h.name); });
  for (const s of CAPE_STEPS) if (s.lvl === l) out.push(s.name);
  return out;
}
const LOG = {
  create: l => `<b>${esc(l.a)}</b> klanı kurdu`, join: l => `<b>${esc(l.a)}</b> klana katıldı${l.b ? ` (onaylayan: ${esc(l.b)})` : ''}`, leave: l => `<b>${esc(l.a)}</b> klandan ayrıldı`,
  kick: l => `<b>${esc(l.b)}</b>, ${esc(l.a)} adlı üyeyi klandan çıkardı`, rank: l => `<b>${esc(l.b)}</b>, ${esc(l.a)} adlı üyeye ${rankByOrder(l.n)} rütbesi verdi`,
  reis: l => `<b>${esc(l.b)}</b> reisliği ${esc(l.a)} adlı üyeye devretti`, succ: l => l.b ? `Reislik ${esc(l.b)} adlı üyeden <b>${esc(l.a)}</b> adlı üyeye geçti` : `<b>${esc(l.a)}</b> yeni reis oldu`,
  lvl: l => `Klan <b>${l.n}. seviyeye</b> yükseldi`, don: l => `<b>${esc(l.a)}</b> ${fmt(l.n)} akçe bağışladı`, chest: l => `Oba Avı: <b>${l.n}. sandık</b> açıldı${l.a ? ` (son vuruş: ${esc(l.a)})` : ''}`,
  hunt: l => `<b>${esc(l.a)}</b> ${HUNT_DIFF[l.n]?.name || 'avı'} başlattı`, quest: l => `Klan görevi tamamlandı: <b>${esc(l.a)}</b>`, banner: l => `<b>${esc(l.a)}</b> sancağı değiştirdi`,
  tax: l => `Hisar vergisinden klan hazinesine <b>${fmt(l.n)} akçe</b> geçti`,
  fac: l => `<b>${esc(l.a)}</b> ${l.n}. seviyeye yükseldi`, facs: l => `<b>${esc(l.b)}</b>, <b>${esc(l.a)}</b> tesisini ${l.n}. seviyeye yükseltmeye başladı`,
};
function general(D) {
  const C = D.clan, max = C.lvl >= CLAN_MAX_LEVEL, don = S.daily.cdon || 0, left = donateCap(S.lvl) - don;
  const power = C.members.reduce((a, m) => a + m.power, 0);
  return `<div class="kl-head">${bannerSvg(C.banner, 'lg')}<div class="grow">
      <h3 class="kl-name"><span style="color:${FACTIONS[C.faction].color}">${esc(C.name)}</span> <span class="chip kl-lv">Seviye ${C.lvl}</span> ${rankChip(D.me.rank)}</h3>
      <div class="pbar"><i style="width:${max ? 100 : Math.min(100, 100 * C.xp / C.need)}%"></i></div>
      <p class="mut">${max ? `En yüksek seviye · ${fmt(C.xp)} klan deneyimi` : `Klan deneyimi <b>${fmt(C.xp)}/${fmt(C.need)}</b> · ${C.lvl + 1}. seviye: ${perksOf(C.lvl + 1).join(', ')}`}</p>
      <div class="kv kl-kv"><div><small>Üye</small>${C.members.length}/${C.cap}</div><div><small>Klan gücü</small>${fmt(power)}</div><div><small>${NISAN.name}</small>${fmt(S.nisan || 0)}</div></div></div></div>
    <div class="row">${med('quest')}<div class="grow"><b>Klan içi duyuru</b><br><span class="kl-txt ${C.notice ? '' : 'mut'}"${C.notice ? ' translate="no"' : ''}>${C.notice ? esc(C.notice) : 'Duyuru yok.'}</span><br><b>Tanıtım</b> <span class="mut">(herkese açık · en az güç: ${fmt(C.minPower || 0)})</span><br><span class="kl-txt ${C.promo ? '' : 'mut'}"${C.promo ? ' translate="no"' : ''}>${C.promo ? esc(C.promo) : 'Tanıtım yok.'}</span></div>${can(D.me.rank, 'notice') ? '<button class="btn sm" data-a="klNotice">Düzenle</button>' : ''}</div>
    <div class="row">${resTile('akce')}<div class="grow"><b>Klan kasasına bağış</b> <span class="chip cnt">Bugün ${fmt(don)}/${fmt(donateCap(S.lvl))}</span><br><span class="mut">Her ${CLAN_XP.donatePer} akçe 1 klan deneyimi, her ${NISAN.donatePer} akçe 1 ${NISAN.name} kazandırır.</span>
      <div class="kl-don">${CLAN_DONATE.steps.map(n => `<button class="btn sm" data-a="klDonate" data-n="${n}" ${n <= left && S.akce >= n ? '' : 'disabled'}>${ri('akce')} ${fmt(n)}</button>`).join('')}</div></div></div>
    <h3>Bağış sıralaması <span class="mut">· yalnızca klan içinde görünür</span></h3><div class="board kl-mem">${[...C.members].filter(m => m.don > 0).sort((a, b) => b.don - a.don).slice(0, 10).map((m, i) => `<div class="${m.me ? 'me' : ''}"><span>${i + 1}.</span><b>${esc(m.name)}</b><span>${ri('akce')}${fmt(m.don)}</span></div>`).join('') || '<p class="mut">Henüz bağış yok.</p>'}</div>
    <h3>Seviye ayrıcalıkları</h3><div class="board kl-lvls">${CLAN_LEVELS.map((_, i) => `<div class="${i + 1 === C.lvl ? 'me' : i + 1 < C.lvl ? 'kl-past' : ''}"><span>Sv. ${i + 1}</span><b>${perksOf(i + 1).join(' · ')}</b></div>`).join('')}</div>
    <h3>Klan günlüğü</h3><div class="board kl-log">${C.log.map(l => `<div><b>${(LOG[l.t] || (() => ''))(l)}</b><span>${when(l.at)}</span></div>`).join('') || '<p class="mut">Henüz kayıt yok.</p>'}</div>`;
}
ACT.klHq = () => ACT.clan({ tab: 'hq' });
ACT.klDonate = async d => {
  const r = await run('clan.donate', { n: +d.n }); if (!r) return;
  toast(`+${fmt(r.xp)} klan deneyimi, +${fmt(r.nisan)} ${NISAN.name}${r.up ? ` · Klan ${r.lvl}. seviyeye yükseldi!` : ''}`); reload();
};
ACT.klNotice = () => {
  const C = cur().data?.clan; if (!C) return;
  showModal(`<h2>Duyuru ve tanıtım</h2><div class="in kl-notes">
    <label><b>Klan içi duyuru</b><small>Yalnızca üyeler görür</small><textarea id="klnote" maxlength="400" rows="8" placeholder="Üyelere duyuru">${esc(C.notice)}</textarea></label>
    <label><b>Tanıtım</b><small>Herkese açık: sıralamadaki klan sayfasında görünür</small><textarea id="klpromo" maxlength="400" rows="8" placeholder="Klanını tanıt">${esc(C.promo || '')}</textarea></label>
    <label class="kl-minp"><b>Başvuru için en düşük güç</b><input type="number" id="klmin" min="0" max="99999999" value="${C.minPower || 0}" inputmode="numeric"></label>
    <div class="mbtns"><button class="btn red" data-a="klNoticeSave">Kaydet</button><button class="btn" data-a="closeModal">Vazgeç</button></div></div>`, 'kl-wide');
};
ACT.klNoticeSave = async () => { if (await run('clan.settings', { notice: $('#klnote').value, promo: $('#klpromo').value, minPower: Math.max(0, Math.floor(+$('#klmin').value || 0)) })) { closeModal(); reload(); } };

// ---------- Üyeler: başvurular, rütbeler, yönetim ----------
function members(D) {
  const C = D.clan, me = D.me.rank, mine = RANKS[me].order;
  const list = [...C.members].sort((a, b) => RANKS[b.rank].order - RANKS[a.rank].order || b.power - a.power);
  const manage = m => !m.me && RANKS[m.rank].order < mine && (can(me, 'kick') || can(me, 'rank'));
  return `${C.apps.length ? `<h3>Başvurular <span class="mut">· ${C.apps.length}</span></h3>${C.apps.map(a => `<div class="row">${med('party', 'sm')}<div class="grow"><b>${esc(a.name)}</b><br><span class="mut">Sv. ${a.lvl} · güç ${fmt(a.power)}</span></div><button class="btn sm green" data-a="klAccept" data-id="${esc(a.id)}">Onayla</button><button class="btn sm" data-a="klReject" data-id="${esc(a.id)}">Reddet</button></div>`).join('')}` : ''}
    <h3>Üyeler <span class="mut">· ${C.members.length}/${C.cap}</span></h3>
    <div class="row kl-open"><div class="grow"><b>Üye alımı:</b> ${C.open ? 'herkese açık (isteyen doğrudan katılır)' : 'başvuruyla (yetkili onaylar ya da davet eder)'}</div>${can(me, 'notice') ? `<button class="btn sm" data-a="klOpen" data-open="${C.open ? 0 : 1}">${C.open ? 'Başvuruya çevir' : 'Herkese aç'}</button>` : ''}</div>
    <div class="board kl-mem">${list.map(m => `<div class="${m.me ? 'me' : ''}">${rankChip(m.rank)}<b>${m.bot && !String(m.id).startsWith('bot:') ? tName(m.name, m.ti, m.rk) : `<button class="kl-link" data-a="pcard" data-id="${esc(m.id)}">${tName(m.name, m.ti, m.rk)}</button>`}</b><span class="kl-mi">Sv. ${m.lvl} · ${fmt(m.power)} güç · ${ri('akce')}${fmt(m.don)} · ${ago(m.seen)}</span>${manage(m) ? `<button class="btn sm" data-a="klMember" data-id="${esc(m.id)}">Yönet</button>` : ''}</div>`).join('')}</div>
    <p class="mut">Satırdaki akçe, üyenin bugüne dek yaptığı toplam bağıştır. Reis ${SUCCESSION_DAYS} gün hiç giriş yapmazsa reislik en yüksek rütbeli etkin üyeye kendiliğinden geçer.</p>
    <h3>Yetkiler</h3><div class="board kl-perm">${Object.entries(PERMS).map(([k, P]) => `<div class="${can(me, k) ? 'me' : ''}"><b>${P.name}</b><span>${minRank(k)}${P.min < 3 ? ' ve üstü' : ''}</span></div>`).join('')}</div>
    <p class="mut">Çıkarma ve rütbe verme yalnızca kendinden düşük rütbedeki üyelere uygulanır. En çok ${RANKS.yardimci.max} ${RANKS.yardimci.name}, ${RANKS.kidemli.max} ${RANKS.kidemli.name} olabilir.</p>
    <div class="mbtns"><button class="btn sm" data-a="clanLeave">Klandan ayrıl</button></div>`;
}
ACT.klAccept = async d => { const r = await run('clan.accept', { id: d.id }); if (r) { toast(r.gone ? 'Bu oyuncu başka bir klana katılmış; başvuru silindi.' : 'Başvuru onaylandı.'); reload(); } };
ACT.klReject = async d => { if (await run('clan.reject', { id: d.id })) reload(); };
ACT.klOpen = async d => { if (await run('clan.settings', { open: d.open === '1' })) reload(); };
ACT.klMember = d => {
  const D = cur().data, m = D?.clan.members.find(x => String(x.id) === d.id); if (!m) return;
  const me = D.me.rank, opts = can(me, 'rank') ? RANK_KEYS.filter(k => k !== 'reis' && k !== m.rank && RANKS[k].order < RANKS[me].order) : [];
  showModal(`<h2>${tName(m.name, m.ti, m.rk)}</h2><div class="in"><p>${rankChip(m.rank)} Sv. ${m.lvl} · ${fmt(m.power)} güç${m.il ? ` · ${ilvTag(m.il)}` : ''}</p><p class="mut">Klana katılış: ${ago(m.joined)} · son giriş: ${ago(m.seen)} · toplam bağış: ${fmt(m.don)} akçe</p>
    <div class="mbtns">${opts.map(k => `<button class="btn sm" data-a="klRank" data-id="${esc(m.id)}" data-rank="${k}">${RANKS[k].name} yap</button>`).join('')}
      ${can(me, 'kick') ? `<button class="btn sm red" data-a="klKick" data-id="${esc(m.id)}" data-name="${esc(m.name)}">Klandan çıkar</button>` : ''}
      ${can(me, 'transfer') && !m.bot ? `<button class="btn sm blue" data-a="klTransfer" data-id="${esc(m.id)}" data-name="${esc(m.name)}">Reisliği devret</button>` : ''}</div>
    </div>`);
};
// Üye kimliği: gerçek oyuncu sayı, yapay üye metin olarak gönderilir (sunucu ikisini de doğrular)
const mid = id => (/^\d+$/.test(id) ? +id : id);
ACT.klRank = async d => { if (await run('clan.rank', { id: mid(d.id), rank: d.rank })) { closeModal(); reload(); } };
ACT.klKick = d => confirmBox('Klandan çıkar', `${esc(d.name)} klandan çıkarılsın mı? Bugünkü av hasarı klanın toplamında kalır, sıralamadan düşer.`, async () => { if (await run('clan.kick', { id: mid(d.id) })) reload(); }, 'Çıkar');
ACT.klTransfer = d => confirmBox('Reisliği devret', `Reislik ${esc(d.name)} adlı üyeye geçecek; sen ${RANKS.yardimci.name} olacaksın. Bu işlemi yalnızca yeni reis geri alabilir.`, async () => { if (await run('clan.transfer', { id: mid(d.id) })) reload(); }, 'Devret');
ACT.clanLeave = () => confirmBox('Klandan ayrıl', 'Pelerinin ve bugünkü Oba Avı sıralama ödülün gider; kazandığın Oba Nişanları sende kalır. Son üye ayrılırsa klan dağılır.', async () => { if (await run('clan.leave')) ACT.clan(); }, 'Ayrıl');

// ---------- Görevler: günlük ve haftalık ortak hedefler ----------
function quests(D) {
  const st = Object.fromEntries(D.quests.map(q => [q.id, q]));
  const row = Q => {
    const s = st[Q.id] || { have: 0 }, rew = [...(Q.give || []), { t: 'nisan', n: Q.nisan }];
    const btn = s.claimed ? '<span class="chip up">Alındı</span>' : `<button class="btn sm green" data-a="klQuest" data-id="${Q.id}" ${s.done && !D.me.fresh ? '' : 'disabled'}>Al</button>`;
    return `<div class="row ${s.claimed ? 'dim' : ''}">${med(Q.key === 'don' ? 'akce' : Q.key === 'siege' ? 'gate' : Q.key === 'wins' ? 'battle' : 'skull', Q.per === 'week' ? 'violet' : '')}<div class="grow"><b>${Q.name}</b> <span class="chip cnt">${fmt(s.have)}/${fmt(Q.need)}</span><br><span class="mut">Klanca ${fmt(Q.need)} ${Q.unit}</span>
      <div class="pbar" style="margin:3px 0"><i style="width:${Math.min(100, 100 * s.have / Q.need)}%"></i></div><div class="chips"><span class="chip">Klana +${fmt(Q.xp)} deneyim</span>${rew.map(lootChip).join('')}</div></div>${btn}</div>`;
  };
  return `<div class="hint">Hedefe bütün klan birlikte ulaşır. Görev tamamlanınca klan deneyim kazanır ve <b>her üye</b> kendi ödülünü bir kez alır.${D.me.fresh ? ' <b>Klana bugün katıldın: ödüller yarından itibaren açılır.</b>' : ''}</div>
    <h3>Günlük görevler <span class="mut">· gece yarısı yenilenir</span></h3>${CLAN_QUESTS.filter(q => q.per === 'day').map(row).join('')}
    <h3>Haftalık görevler <span class="mut">· pazartesi yenilenir</span></h3>${CLAN_QUESTS.filter(q => q.per === 'week').map(row).join('')}`;
}
ACT.klQuest = async d => { const r = await run('clan.quest', { id: d.id }); if (r) { lootToast(r.loot); reload(); } };

// ---------- Oba Dükkânı ----------
function shop(D) {
  const C = D.clan, bought = S.weekly.cshop || {};
  return `<div class="row">${resTile('nisan')}<div class="grow"><b>${NISAN.name}: ${fmt(S.nisan || 0)}</b><br><span class="mut">Bağış (${NISAN.donatePer} akçe = 1), Oba Avı saldırısı (+${NISAN.hunt}), kuşatma saldırısı (+${NISAN.siege}), klan görevleri ve av sıralaması kazandırır. Sınırlar haftalıktır.</span></div></div>
    <div class="cards kl-shop">${CLAN_SHOP.map(it => {
      const n = bought[it.id] || 0, lock = C.lvl < it.lvl, ok = !lock && n < it.max && (S.nisan || 0) >= it.cost;
      return `<div class="card ${lock ? 'soon' : ''}">${resTile(lootKind(it.give))}<b>${it.name}</b><span class="mut">${it.desc || '&nbsp;'}</span>
        <span class="chip cnt">${lock ? `${ri('lock')} Klan Sv. ${it.lvl}` : `Bu hafta ${n}/${it.max}`}</span>
        <button class="btn sm ${ok ? 'green' : ''}" data-a="klBuy" data-id="${it.id}" ${ok ? '' : 'disabled'}>${ri('nisan')} ${it.cost}</button></div>`;
    }).join('')}</div>`;
}
ACT.klBuy = async d => { const r = await run('clan.buy', { id: d.id }); if (r) { lootToast(r.loot); redraw(); } };

// ---------- Sancak ve pelerin ----------
function bannerTab(D) {
  const C = D.clan, edit = can(D.me.rank, 'banner'), step = capeStep(C.lvl), next = CAPE_STEPS[step + 1];
  if (!K.draft || K.draftOf !== C.id + JSON.stringify(C.banner)) { K.draft = { ...C.banner }; K.draftOf = C.id + JSON.stringify(C.banner); }
  const B = edit ? K.draft : C.banner, changed = edit && JSON.stringify(B) !== JSON.stringify(C.banner);
  const sw = (i, on, a, inner) => `<button class="kl-sw ${on ? 'on' : ''}" data-a="${a}" data-i="${i}" ${edit ? '' : 'disabled'}>${inner}</button>`;
  return `<div class="kl-ban"><div class="kl-prev">${bannerSvg(B, 'xl')}<p><b>${EMBLEMS[B.s]}</b> sancağı</p>
      ${edit ? `<button class="btn sm red" data-a="klBannerSave" ${changed ? '' : 'disabled'}>Kaydet</button>` : ''}
      ${capeSvg({ c: B.c, a: B.a, s: B.s, l: step }, 'lg')}<p class="mut">${CAPE_STEPS[step].name} · klan Sv. ${C.lvl}${next ? `<br>Sv. ${next.lvl}: ${next.name}` : ''}</p></div>
    <div class="grow">${edit ? '' : `<div class="hint">Sancağı ve pelerin rengini yalnızca ${RANKS.reis.name} değiştirir. Klandaki herkesin karakteri bu pelerini kuşanır; sırtında sancağın arması durur.</div>`}
      <h3>Renk çifti <span class="mut">· zemin ve desen</span></h3><div class="kl-sws">${BANNER_PAIRS.map(([bg, fg], i) => sw(i, B.a === i, 'klPair', `<i style="background:linear-gradient(135deg,${bg} 0 58%,${fg} 58%)"></i>`)).join('')}</div>
      <h3>Amblem <span class="mut">· ${EMBLEM_KEYS.length} seçenek</span></h3><div class="kl-ems">${EMBLEM_KEYS.map(k => `<button class="kl-em ${B.s === k ? 'on' : ''}" data-a="klSym" data-i="${k}" title="${EMBLEMS[k]}" ${edit ? '' : 'disabled'}>${emblemSvg(k)}</button>`).join('')}</div>
      <h3>Pelerin rengi</h3><div class="kl-sws">${CAPE_COLORS.map((c, i) => sw(i, B.c === i, 'klCape', `<i style="background:${c}"></i>`)).join('')}</div>
      <h3>Pelerin boyu <span class="mut">· klan seviyesiyle uzar</span></h3><div class="kl-steps">${CAPE_STEPS.map((s, i) => `<div class="${i === step ? 'on' : i < step ? 'past' : ''}">${capeSvg({ c: B.c, a: B.a, s: B.s, l: i }, 'sm')}<small>Sv. ${s.lvl}<br>${s.name}</small></div>`).join('')}</div></div></div>`;
}
ACT.klPair = d => { K.draft.a = +d.i; redraw(); };
ACT.klSym = d => { K.draft.s = d.i; redraw(); };
ACT.klCape = d => { K.draft.c = +d.i; redraw(); };
ACT.klBannerSave = async () => { if (await run('clan.banner', { ...K.draft })) { toast('Sancak değişti. Üyelerin pelerini bir sonraki girişlerinde yenilenir.'); reload(); } };

// ---------- Oba Avı: canlı sandık kademeleri, kademe seçimi, günlük hasar sıralaması ----------
function huntTab(D) {
  const C = D.clan, H = HUNT_DIFF[D.hunt.diff] || HUNT_DIFF[0], claimed = S.daily.clanChest || 0, mine = C.members.find(m => m.me);
  const blocked = D.me.fresh && !(mine?.dmg > 0), canClaim = D.tier > claimed && !blocked, top = CLAN.tiers.at(-1);
  const dealers = C.members.filter(m => m.dmg > 0);
  const chests = CLAN.tiers.map((t, i) => `<div class="kl-chest ${i < claimed ? 'got' : i < D.tier ? 'open' : ''}"><b>${i + 1}/${CLAN.tiers.length}</b><small>${fmt(t)}</small><span>${HUNT_CHESTS[i].map(lootChip).join('')}</span><em>${i < claimed ? 'Alındı' : i < D.tier ? 'Açıldı' : 'Kilitli'}</em></div>`).join('');
  const startable = can(D.me.rank, 'hunt') && !D.hunt.diff && C.dmg === 0;
  const diffRow = HUNT_DIFF.map((h, i) => {
    const on = i === D.hunt.diff, lock = C.lvl < h.lvl;
    return `<div class="kl-diff ${on ? 'on' : ''} ${lock ? 'lock' : ''}"><b>${h.name}</b><small>${i ? `Tepegöz: can ×${String(h.hp).replace('.', ',')}, saldırı ×${String(h.atk).replace('.', ',')}` : 'Tepegöz olağan gücünde'}<br>Hasarın %${h.credit}'i klana yazılır</small>
      ${on ? `<em>Bugünkü av${D.hunt.by ? ` · başlatan: ${esc(D.hunt.by)}` : ''}</em>` : lock ? `<em>${ri('lock')} Klan Sv. ${h.lvl}</em>` : i && startable ? `<button class="btn sm red" data-a="klHunt" data-d="${i}">Başlat</button>` : i ? `<em>${D.hunt.diff || C.dmg > 0 ? 'Bugün av başladı' : `${minRank('hunt')} ve üstü başlatır`}</em>` : ''}</div>`;
  }).join('');
  const rankRow = (m, i) => { const R = m.dmg > 0 ? huntRankReward(i + 1, dealers.length) : null; return `<div class="${m.me ? 'me' : ''}"><span>${m.dmg > 0 ? `${i + 1}.` : '—'}</span><b>${esc(m.name)}</b><span class="kl-rw">${R ? [...R.give, { t: 'nisan', n: R.nisan }].map(lootChip).join('') : ''}</span><span>${m.dmg > 0 ? fmt(m.dmg) : 'saldırmadı'}</span></div>`; };
  const L = D.hunt.last;
  return `<div class="row">${mobImg('tepegoz', false, '')}<div class="grow"><b>Oba Avı: Tepegöz</b> <span class="chip cnt">Bugün ${D.bossUsed}/1</span> <span class="chip">${H.name}</span><br>
      <span class="mut">Klanın bugünkü toplam hasarı: <b>${fmt(C.dmg)}</b> · açılan sandık ${D.tier}/${CLAN.tiers.length}</span><div class="pbar" style="margin-top:3px"><i style="width:${Math.min(100, 100 * C.dmg / top)}%"></i></div></div>
      <button class="btn sm green" data-a="clanClaim" ${canClaim ? '' : 'disabled'}>Sandık</button><button class="btn red" data-a="mode" data-m="clanboss" ${D.bossUsed < 1 ? '' : 'disabled'}>Saldır</button></div>
    <div class="kl-chests">${chests}</div>
    ${blocked ? '<p class="mut"><b>Klana bugün katıldın:</b> sandık için bugün ava hasar yazmalısın ya da yarını beklemelisin.</p>' : ''}
    <h3>Av kademesi</h3><div class="kl-diffs">${diffRow}</div>
    <p class="mut">Olağan Av her gün kendiliğinden açıktır. Azgın ve Kudurmuş Av'ı ${minRank('hunt')} ve üstü, o gün klana ilk hasar yazılmadan önce başlatır. 60 tur boyunca verdiğin hasar savaş biter bitmez klana yazılır; günde 1 saldırı hakkın vardır.</p>
    <h3>Bugünkü hasar sıralaması <span class="mut">· ödül gün dönümünde postayla</span></h3>
    <div class="board kl-hrank">${C.members.map(rankRow).join('')}</div>
    <p class="mut">Sıralama ödülü, o gün hasar yazan üye sayısına bağlıdır (en üst basamaklar için en az 5 saldıran). Ödül gün dönümünde klanda olan üyelere gider.</p>
    ${L ? `<h3>Önceki av</h3><div class="board">${L.top.slice(0, 5).map((m, i) => `<div class="${String(m.id) === String(mine?.id) ? 'me' : ''}"><span>${i + 1}.</span><b>${esc(m.name)}</b><span>${fmt(m.dmg)}</span></div>`).join('')}</div><p class="mut">Toplam ${fmt(L.dmg)} hasar · ${L.tier}/${CLAN.tiers.length} sandık.</p>` : ''}
    <div class="row">${med('siege', 'red')}<div class="grow"><b>Hisar Kuşatması</b> <span class="chip cnt">Bu hafta ${D.siegeUsed}/3</span><br><span class="mut">Klanın kuşatma puanı: <b>${fmt(C.siege)}</b></span></div><button class="btn" data-a="gate" data-tab="events">Etkinlikler</button></div>`;
}
// Oyuncu kartındaki "Klana davet et" (ui-social.js)
ACT.klInvite = async d => { const r = await run('clan.invite', { id: d.id }); if (r) { closeModal(); toast(`${r.name} klana davet edildi.`); } };
ACT.clanClaim = async () => { const r = await run('clan.claim'); if (r) { lootToast(r.loot); reload(); } };
ACT.klHunt = d => { const h = HUNT_DIFF[+d.d]; confirmBox(h.name, `Bugünkü av ${h.name} olarak başlasın mı? Tepegöz sertleşir, verilen hasarın %${h.credit}'i klana yazılır. Gün dönümüne kadar geri alınamaz.`, async () => { if (await run('clan.hunt', { diff: +d.d })) reload(); }, 'Başlat'); };

// ---------- Pelerin değişince (klana giriş/çıkış, sancak, seviye) ana üsteki kahramanlar yeniden kuşanır ----------
// Karşılaştırılan şey ana üste O AN duran kahramanların pelerinidir (savaştan dönüş gibi başka yollar da ana üssü yeniden kurar).
const capeSig = () => JSON.stringify((S && S.clan && capeOf(S.clanTag)) || null);
const shownSig = () => { const a = world.actors.find(x => x.unit?.cls); return a ? JSON.stringify(a.unit.cape || null) : null; };
// Yalnızca klan penceresi kapanınca bakılır (K.open); ana üs kendi kurulurken de pencereyi "kapattığı" için başka durumda dokunulmaz.
new MutationObserver(() => {
  if (!win.hidden || !K.open) return;
  K.open = false;
  const shown = hud.hidden || !S ? null : shownSig();
  if (shown !== null && shown !== capeSig()) ACT.hub();
}).observe(win, { attributes: true, attributeFilter: ['hidden'] });

// ====================================================================================================================
// Klan Karargâhı: klanın ortak üssü. Seviye klan seviyesidir; hazine bağışlarla dolar, tesisler hazineden yükseltilir.
// Kural sunucudadır (clanrules.js: clan.donate, clan.hqup); tesis tabloları shared/clan.js'ten okunur.
// ====================================================================================================================
const FAC_ICON = { talim: 'battle', demirhane: 'anvil', ambar: 'chest', gozcu: 'shield', sancak: 'clan' };
const facBonus = (id, l) => { const F = HQ_FAC[id], v = Math.abs(F.per) * l; return !l ? '—' : F.unit === '%' ? `${F.per < 0 ? '−' : '+'}%${v}` : `+${v} üye`; };
// Karargâh illüstrasyonu: yapılar tesis seviyesine göre canlanır (seviye 0: soluk temel çizgisi); ana bina klan seviyesiyle büyür
function hqScene(C) {
  const f = id => hqLvl(C.hq.fac, id), [bg, fg] = BANNER_PAIRS[C.banner.a], lv = C.lvl, ocak = C.faction === 'ocak';
  const sky = ocak ? ['#2a0c08', '#7a2a14', '#e08a3a'] : ['#0b1c38', '#2f5c93', '#e3c58a'], hill = ocak ? ['#3a1209', '#1d0905'] : ['#1f3a5c', '#0f2038'];
  const dim = l => (l ? '' : ' opacity=".32" stroke-dasharray="3 3"'), glow = l => (l ? `<ellipse cx="0" cy="0" rx="${6 + l * 2}" ry="${2 + l}" fill="#ffb347" opacity=".${3 + l}"/>` : '');
  const wall = lv >= 7 ? '<path d="M96 112h208v-18h-6v6h-8v-6h-8v6h-8v-6h-8v6h-8v-6H96z" fill="#8a7a66" stroke="#2b2118" stroke-width="1.5"/>' : '';
  const side = lv >= 4 ? [150, 250].map(x => `<g transform="translate(${x} 0)"><rect x="-9" y="62" width="18" height="50" fill="#9a8a74" stroke="#2b2118" stroke-width="1.5"/><path d="M-11 62h22v-6h-4v3h-4v-3h-6v3h-4v-3h-4z" fill="#8a7a66" stroke="#2b2118" stroke-width="1.2"/></g>`).join('') : '';
  const poles = Array.from({ length: Math.min(5, f('sancak')) }, (_, i) => `<g transform="translate(${164 + i * 18} ${86 - (i % 2) * 4})"><path d="M0 26V0" stroke="#2b2118" stroke-width="1.6"/><path d="M0 1h11l-3 4 3 4H0z" fill="${i % 2 ? fg : bg}" stroke="#1a1208" stroke-width=".8"/></g>`).join('');
  return `<svg class="hq-scene" viewBox="0 0 400 150" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Klan Karargâhı illüstrasyonu">
    <defs><linearGradient id="hqs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky[0]}"/><stop offset=".6" stop-color="${sky[1]}"/><stop offset="1" stop-color="${sky[2]}"/></linearGradient></defs>
    <rect width="400" height="150" fill="url(#hqs)"/><circle cx="${ocak ? 330 : 70}" cy="34" r="16" fill="${ocak ? '#ff9a3c' : '#fff3c4'}" opacity=".4"/>
    <path d="M0 98L50 62l36 28 52-44 50 48 56-52 62 50 44-34 50 40v54H0z" fill="${hill[0]}"/><path d="M0 120l70-24 60 16 80-22 70 20 60-14 60 18v36H0z" fill="${hill[1]}"/>
    <rect y="112" width="400" height="38" fill="#2a1d12"/><path d="M0 112h400" stroke="#4a3322" stroke-width="2"/>
    ${wall}${side}
    <g stroke="#2b2118" stroke-width="1.6"><rect x="174" y="50" width="52" height="62" fill="#a89782"/><path d="M170 50h60v-8h-6v4h-6v-4h-6v4h-6v-4h-6v4h-6v-4h-6v4h-6v-4h-6z" fill="#8f7f6a"/>
      <path d="M190 112v-20a10 10 0 0120 0v20z" fill="#1a1208"/><rect x="186" y="62" width="6" height="12" fill="#1a1208"/><rect x="208" y="62" width="6" height="12" fill="#1a1208"/>
      <path d="M200 42V14"/><path d="M200 14h22l-6 7 6 7h-22z" fill="${bg}"/><circle cx="209" cy="21" r="3" fill="${fg}" stroke="none"/>${lv >= 10 ? '<path d="M196 14l4-10 4 10z" fill="#f4d470" stroke="#7a5a12"/>' : ''}</g>
    ${poles}
    <g transform="translate(46 112)" stroke="#2b2118" stroke-width="1.4"${dim(f('talim'))}><path d="M-30 0v-12M-18 0v-12M-6 0v-12M6 0v-12M18 0v-12M30 0v-12" stroke-width="3"/><path d="M-32-9h64" stroke-width="2"/><path d="M0 0v-26" stroke-width="3"/><circle cx="0" cy="-30" r="6" fill="#c9a96a"/><path d="M-9-20h18" stroke-width="3"/></g>
    <g transform="translate(112 112)" stroke="#2b2118" stroke-width="1.4"${dim(f('demirhane'))}><rect x="-20" y="-24" width="40" height="24" fill="#6b4a30"/><path d="M-24-24l24-14 24 14z" fill="#4a3322"/><rect x="10" y="-44" width="7" height="16" fill="#6a6a6a"/><rect x="-8" y="-14" width="16" height="14" fill="#1a1208"/><g transform="translate(0 -6)">${glow(f('demirhane'))}</g></g>
    <g transform="translate(290 112)" stroke="#2b2118" stroke-width="1.4"${dim(f('ambar'))}><rect x="-26" y="-26" width="52" height="26" fill="#9c7a44"/><path d="M-30-26l30-18 30 18z" fill="#6b4a2a"/><rect x="-7" y="-16" width="14" height="16" fill="#3b2815"/><circle cx="-18" cy="-4" r="4" fill="#d9c58a"/><circle cx="18" cy="-4" r="4" fill="#d9c58a"/></g>
    <g transform="translate(352 112)" stroke="#2b2118" stroke-width="1.4"${dim(f('gozcu'))}><rect x="-9" y="-62" width="18" height="62" fill="#8f7f6a"/><path d="M-13-62h26l-3-14h-20z" fill="#6f5f4c"/><rect x="-3" y="-54" width="6" height="10" fill="#1a1208"/><g transform="translate(0 -70)">${f('gozcu') ? '<circle r="5" fill="#ffd45a" opacity=".85"/>' : ''}</g></g>
  </svg>`;
}
function hqJoin() {
  return `<div class="hq-join"><div class="hq-join-art">${ri('clan')}</div><div class="grow"><b>Karargâh yalnızca klan üyelerinin ortak üssüdür.</b><br><span class="mut">Bir klana katıl ya da kendi klanını kur: bağışlarla karargâhı büyütür, tesisleri yükseltir ve Talim Meydanı, Demirhane, Ambar, Gözcü Kulesi, Sancak Salonu bonuslarını kazanırsın.</span></div></div>`;
}
function hq(D) {
  const C = D.clan, H = C.hq, don = S.daily.cdon || 0, cap = donateCap(S.lvl), left = cap - don, max = C.lvl >= CLAN_MAX_LEVEL;
  const maxL = Math.max(1, ...C.members.map(m => m.don || 0));
  const card = id => {
    const F = HQ_FAC[id], l = hqLvl(H.fac, id), top = l >= HQ_MAX, capped = l >= H.cap, to = l + 1, cost = top ? 0 : hqCost(id, to);
    const U = H.up, busyMe = U && U.id === id, why = top ? 'En yüksek' : capped ? `Klan Sv. ${to * 2 - 1}` : !H.can ? `Yetki: ${minRank('hq')}+` : U ? 'Başka yükseltme sürüyor' : H.tre < cost ? 'Hazine yetmiyor' : '';
    return `<div class="hq-fac ${l ? 'on' : ''}"><div class="hq-fh"><span class="ico rs hq-fi">${ri(FAC_ICON[id] || 'star')}</span><b>${F.name}</b><span class="chip cnt">Sv. ${l}/${HQ_MAX}</span></div>
      <div class="hq-pips" aria-hidden="true">${Array.from({ length: HQ_MAX }, (_, i) => `<i class="${i < l ? 'on' : i < H.cap ? '' : 'lock'}"></i>`).join('')}</div>
      <span class="mut hq-desc">${F.desc}</span>
      <div class="hq-bon"><span>Şimdi <b>${facBonus(id, l)}</b></span>${top ? '' : `<span>Sonraki <b class="up">${facBonus(id, to)}</b></span>`}</div>
      ${busyMe ? `<div class="hq-run"><span>${ri('anvil')} Sv. ${U.to} yapılıyor · <b data-hqend="${U.end}">${clockText(U.end - now())}</b>${U.help?.ask ? ` · ${U.help.by.length} yardım` : ' <button class="btn sm green" data-a="hsAsk">Yardım iste</button>'}</span><div class="pbar"><i style="width:${Math.min(100, 100 * (now() - U.at) / Math.max(1, U.end - U.at))}%"></i></div></div>` : top ? '<span class="chip up">En yüksek seviye</span>' : `<span class="mut hq-dur">Süre ${clockText(hqTime(to))}</span><button class="btn sm ${why ? '' : 'green'}" data-a="klFac" data-id="${id}" ${why ? 'disabled' : ''}>${why ? `${capped || !H.can ? ri('lock') + ' ' : ''}${why}` : `Yükselt · ${ri('akce')} ${fmt(cost)}`}</button>${why === 'Hazine yetmiyor' ? `<span class="mut hq-cost">${ri('akce')} ${fmt(cost)} gerek</span>` : ''}`}</div>`;
  };
  const logs = C.log.filter(l => ['don', 'fac', 'facs', 'lvl', 'join', 'create', 'tax'].includes(l.t)).slice(0, 8);
  return `<div class="hq-top">${hqScene(C)}<div class="hq-ban">${bannerSvg(C.banner, 'lg')}</div>
      <div class="hq-title"><b style="--fc:${FACTIONS[C.faction].color}">${esc(C.name)}</b><span class="chip kl-lv">Karargâh Sv. ${C.lvl}/${CLAN_MAX_LEVEL}</span></div></div>
    <div class="pbar"><i style="width:${max ? 100 : Math.min(100, 100 * C.xp / C.need)}%"></i></div>
    <p class="mut">${max ? 'Karargâh en yüksek seviyede.' : `Klan deneyimi ${fmt(C.xp)}/${fmt(C.need)} · bir sonraki seviye tesis sınırını ve üye sınırını büyütür.`} Tesisler en çok <b>Sv. ${H.cap}</b> olabilir.</p>
    <div class="row hq-tre">${resTile('akce')}<div class="grow"><b>Klan hazinesi: ${ri('akce')} ${fmt(H.tre)} akçe</b> <span class="chip cnt">Bugün ${fmt(don)}/${fmt(cap)}</span><br><span class="mut">Üyelerin bağışı hazineye girer (toplam ${fmt(H.tot)}); tesisler buradan ödenir. Günlük bağış sınırı seviyenle büyür. Her ${CLAN_XP.donatePer} akçe ayrıca 1 klan deneyimi, her ${NISAN.donatePer} akçe 1 ${NISAN.name} kazandırır.</span>
      <div class="kl-don">${CLAN_DONATE.steps.map(n => `<button class="btn sm" data-a="klDonate" data-n="${n}" ${n <= left && S.akce >= n ? '' : 'disabled'}>${ri('akce')} ${fmt(n)}</button>`).join('')}</div></div></div>
    <h3>Tesisler <span class="mut">· ${H.can ? 'yükseltmeyi sen yapabilirsin' : `yükseltmeyi ${minRank('hq')} ve üstü yapar`}</span></h3><div class="hq-facs">${HQ_KEYS.map(card).join('')}</div>
    <p class="mut">Talim Meydanı yaratıklara karşı savaşta (stage, zindan, av) karakterinin saldırı ve büyü gücünü, Demirhane Örs akçe maliyetini, Ambar maden üretimini, Gözcü Kulesi Meydan savunma kaydındaki can ve savunmayı, Sancak Salonu üye sınırını (şimdi ${C.cap}) etkiler. Bonuslar girişte ve klan ekranı açılınca tazelenir.</p>
    <h3>Katkı sıralaması <span class="mut">· toplam bağış</span></h3><div class="board kl-mem hq-rank">${[...C.members].filter(m => m.don > 0).sort((a, b) => b.don - a.don).slice(0, 10).map((m, i) => `<div class="${m.me ? 'me' : ''}"><span>${i + 1}.</span><b>${esc(m.name)}</b><span class="hq-bar"><i style="width:${Math.max(4, 100 * m.don / maxL)}%"></i></span><span>${ri('akce')} ${fmt(m.don)}</span></div>`).join('') || '<p class="mut">Henüz bağış yok. İlk bağışı sen yap.</p>'}</div>
    <h3>Karargâh kaydı</h3><div class="board kl-log">${logs.map(l => `<div><b>${(LOG[l.t] || (() => ''))(l)}</b><span>${when(l.at)}</span></div>`).join('') || '<p class="mut">Henüz kayıt yok.</p>'}</div>`;
}
ACT.klFac = d => {
  const D = cur().data, id = d.id, F = HQ_FAC[id]; if (!F || !D) return;
  const l = hqLvl(D.clan.hq.fac, id);
  confirmBox(`${F.name} Sv. ${l + 1}`, `Klan hazinesinden ${fmt(hqCost(id, l + 1))} akçe harcanır, yapım ${clockText(hqTime(l + 1))} sürer. ${F.desc}: ${facBonus(id, l)} → ${facBonus(id, l + 1)}.`, async () => { const r = await run('clan.hqup', { id }); if (r) { toast(`${F.name} yükseltmesi başladı.`); reload(); } }, 'Yükselt');
};
// Süren yükseltmenin geri sayımı; bitince ekran tazelenir (bitişi sunucu işler)
setInterval(() => {
  const els = document.querySelectorAll('[data-hqend]'); if (!els.length) return;
  for (const el of els) { const left = +el.dataset.hqend - now(); el.textContent = clockText(left); if (left <= 0 && !el.dataset.done) { el.dataset.done = 1; setTimeout(reload, 1500); } }
}, 1000);
