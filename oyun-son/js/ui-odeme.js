// "Yakut Al" ekranı (gerçek parayla satın alma), arkadaşlar penceresi ve sohbet denetimi arayüzü (şikâyet, engel).
// Arayüz tutar ya da ödül hesaplamaz: fiyat, bonus ve toplamlar pay.view yanıtından gelir; satın almayı sunucu doğrular.
//  - Mağaza paketi (Capacitor): mağaza faturalaması (pay-native.js) → kanıt sunucuda doğrulanır
//  - Web: sunucunun açtığı ödeme sayfasına gidilir; dönüşte (?pay=<sipariş>) sipariş onaylanır
//  - DEV: "test" sağlayıcısı para almadan tamamlar · Çevrimdışı deneme: satın alma yoktur, ekran bunu açıklar
import { S, now, DEV, LOCAL, payCall, onState } from './api.js';
import { ACT, $, hud, modal, esc, fmt, toast, run, showModal, closeModal, openWin, cur, redraw, reload, loading, hooks, lootToast, faceImg, achTag, tName, doAct, resTile, lootKind, med, ico, statText, myTier } from './ui-core.js';
import { ilvTag } from './esya-parts.js';
import { bannerSvg } from './banner.js';
import { FACTIONS, CLASSES, SHOP, PREMIUM } from '../shared/content.js';
import { itemBase, itemStats, STARTER_WEAPONS } from '../shared/items.js';
import { priceText } from '../shared/pay.js';
import { REPORT_REASONS, REPORT_NOTE_MAX } from '../shared/reasons.js';
import { svg, ri } from './icons.js';
import { nativeKind, storeReady, storePrices, storeBuy, storeFinish } from './pay-native.js';

const ls = { get: k => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch { } } };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const dateText = t => new Date(t).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });

// ====================================================================================================================
// Yakut Al
// ====================================================================================================================
const Y = { cur: 'USD', // tek para birimi
  busy: null, prices: {}, store: null, cfg: null, shop: null, D: null };
// Yarım kalan satın almalar (ödeme yapıldı ama onay yanıtı alınamadı): cihazda saklanır, ekran açılınca yeniden onaylanır
const K_PEND = 'dd_pay_pending';
const pendList = () => { try { const a = JSON.parse(ls.get(K_PEND) || '[]'); return Array.isArray(a) ? a.filter(x => x && UUID.test(x.order)).slice(-10) : []; } catch { return []; } };
const pendSave = a => ls.set(K_PEND, JSON.stringify(a.slice(-10)));
const pendAdd = x => pendSave([...pendList().filter(p => p.order !== x.order), { ...x, at: Date.now() }]);
const pendDrop = order => pendSave(pendList().filter(p => p.order !== order));

// Bu cihazda kullanılacak sağlayıcı. Mağaza paketinde yalnızca mağaza faturalaması sunulur (mağaza kuralı).
function pickProvider(list) {
  const nk = nativeKind();
  if (nk) return list.find(p => p.kind === nk) || (DEV ? list.find(p => p.kind === 'test') : null) || null;
  return list.find(p => p.kind === 'web') || list.find(p => p.kind === 'test') || null;
}
const provOf = D => (LOCAL ? null : pickProvider(D.providers || []));
const isStore = prov => prov && (prov.kind === 'android' || prov.kind === 'ios');
const canBuy = D => { const prov = provOf(D); return !!prov && (!isStore(prov) || Y.store === true); };
const priceOf = (D, P) => (isStore(provOf(D)) && Y.prices[P.storeId]) || priceText(P.price[Y.cur], Y.cur);

function banner(D) {
  const prov = provOf(D), nk = nativeKind();
  if (LOCAL) return `<div class="hint ynote"><b>Deneme sürümü:</b> bu sürüm sunucusuz çalışır, gerçek parayla satın alma yapılamaz. Paketler bilgi içindir; yakut burada görevlerden, meydandan ve test araçlarından gelir.</div>`;
  if (!prov) return `<div class="hint ynote"><b>Satın alma şu an kapalı.</b> ${nk ? 'Bu pakette mağaza satın alması henüz açılmadı.' : 'Bu sunucuda ödeme yöntemi henüz açılmadı.'} Yakut görevlerden, meydandan ve ilk geçişlerden kazanılmaya devam eder.</div>`;
  if (prov.kind === 'test') return `<div class="hint ynote"><b>Test sunucusu:</b> satın alma para alınmadan anında tamamlanır (yalnızca geliştirme içindir).</div>`;
  if (prov.kind === 'web') return `<div class="hint ynote">Ödeme, güvenli ödeme sayfasında kartla yapılır; tamamlanınca oyuna dönersin ve yakut hesabına yazılır. Makbuz postana gelir.</div>`;
  if (Y.store === false) return `<div class="hint ynote"><b>Mağaza satın alması bu cihazda kullanılamıyor.</b> ${prov.kind === 'android' ? 'Google Play' : 'App Store'} hesabını ve bağlantını denetleyip yeniden dene.</div>`;
  return `<div class="hint ynote">Ödeme ${prov.kind === 'android' ? 'Google Play' : 'App Store'} üzerinden yapılır; geçerli fiyatı mağaza gösterir. Yakut, satın alma doğrulanınca hesabına yazılır.</div>`;
}
const curSwitch = () => ''; // para birimi seçimi kaldırıldı: fiyatlar yalnızca USD
const buyBtn = (D, P, label) => `<button class="btn red ybuy" data-a="payBuy" data-sku="${esc(P.sku)}" ${canBuy(D) && !Y.busy ? '' : 'disabled'}>${Y.busy === P.sku ? 'Bekle…' : label || esc(priceOf(D, P))}</button>`;

function packsHtml(D) {
  const packs = D.products.filter(P => P.kind === 'yakut');
  return `${banner(D)}${curSwitch(D)}
    <div class="ypacks">${packs.map((P, i) => `<div class="ypack${P.bonus ? ' first' : ''}">
      ${P.bonus ? `<span class="yrib">İlk alım: +${fmt(P.bonus)}</span>` : ''}
      <i class="ygem s${Math.min(5, i)}">${svg('gem')}</i>
      <b class="yname">${esc(P.name)}</b>
      <span class="yamt">${fmt(P.total)} <small>yakut</small></span>
      <span class="mut ysub">${P.bonus ? `${fmt(P.yakut)} + ${fmt(P.bonus)} bonus` : `${fmt(P.yakut)} yakut`}</span>
      ${buyBtn(D, P)}</div>`).join('')}</div>
    <p class="mut">İlk alım bonusu her paket için bir kez geçerlidir. İade edilen satın almanın yakutu hesaptan geri alınır.</p>`;
}
function cardHtml(D) {
  const P = D.products.find(x => x.kind === 'card'), C = D.card;
  if (!P) return '<div class="hint">Yakut Kartı şu an satışta değil.</div>';
  const full = C.days + P.days > C.max;
  return `${banner(D)}${curSwitch(D)}
    <div class="ycard"><div class="ycface"><i>${svg('gem')}</i><b>${esc(P.name)}</b><small>${P.days} gün</small></div>
      <div class="ycinfo"><h3>${esc(P.name)}</h3>
        <div class="kv"><div><small>Hemen</small>${fmt(P.yakut)} yakut</div><div><small>Her gün</small>${fmt(P.daily)} yakut</div><div><small>${P.days} günde toplam</small>${fmt(P.sum)} yakut</div></div>
        <p>${C.active ? `<b class="up">Kartın etkin:</b> ${C.days} gün kaldı.` : 'Şu an etkin kartın yok.'} ${C.active ? (C.claimed ? 'Bugünkü yakut alındı; yarın yeniden gel.' : `Bugünkü <b>${fmt(P.daily)} yakut</b> seni bekliyor.`) : ''}</p>
        <div class="mbtns">${C.active ? `<button class="btn green" data-a="payCard" ${C.claimed ? 'disabled' : ''}>${C.claimed ? 'Bugün alındı' : `Bugünkü ${fmt(P.daily)} yakutu al`}</button>` : ''}
          ${full ? `<button class="btn" disabled>En çok ${C.max} gün</button>` : buyBtn(D, P, `${C.active ? `Uzat (+${P.days} gün)` : 'Satın al'} · ${esc(priceOf(D, P))}`)}</div></div></div>
    <p class="mut">Günlük yakut, kart sürerken her gün bir kez bu ekrandan alınır; alınmayan günün yakutu yanar. Kart yeniden alınırsa süre uzar (en çok ${C.max} gün ileriye). Kart kendiliğinden yenilenmez, tek seferlik ödemedir.</p>`;
}
const STATUS = { paid: ['Ödendi', 'up'], refunded: ['İade edildi', ''], chargeback: ['Ödeme itirazı', ''] };
function histHtml(D) {
  if (!D.orders.length) return `<div class="hint">Henüz satın alman yok. Her satın almanın makbuzu ayrıca postana gönderilir.</div>`;
  return `<p class="mut">Son satın almaların. Makbuzlar ayrıca postana gönderilir; destek için sipariş numarasını ilet.</p>
    <div class="board yhist">${D.orders.map(o => { const st = STATUS[o.status] || [o.status, '']; return `<div><span>${dateText(o.at)}</span><b>${esc(o.name)} <small class="mut">No ${esc(o.id.toUpperCase())}</small></b><span>${o.status === 'paid' ? `+${fmt(o.yakut)} yakut` : `−${fmt(o.taken)} yakut`} · ${esc(o.price)}</span><span class="chip ${st[1]}">${st[0]}</span></div>`; }).join('')}</div>`;
}

async function loadPay(tab) {
  if (tab === 'hist') return (await run('pay.history')) || { orders: [] };
  const D = await run('pay.view');
  if (!D) return null;
  Y.D = D;
  const prov = provOf(D);
  if (isStore(prov) && Y.store === null) { // mağaza hazır mı ve yerel fiyatlar (bir kez sorulur)
    Y.store = await storeReady();
    if (Y.store) Y.prices = await storePrices(D.products.map(P => P.storeId));
  }
  return D;
}
ACT.yakutAl = d => {
  Y.cfg = { title: 'Yakut Al', tab: d?.tab || 'packs', tabs: [{ id: 'packs', label: 'Yakut Paketleri', small: 'Tek seferlik', icon: 'gem' }, { id: 'card', label: 'Yakut Kartı', small: 'Günlük yakut', icon: 'gift' }, { id: 'hist', label: 'Geçmiş', small: 'Satın almalar', icon: 'quest' }],
    load: loadPay,
    render: t => { const D = cur().data; return !D ? loading : t === 'hist' ? histHtml(D) : t === 'card' ? cardHtml(D) : packsHtml(D); } };
  openWin(Y.cfg);
  resumePending();
};
ACT.yakutMenu = () => { closeModal(); ACT.yakutAl(); };
ACT.payCur = () => {}; // eski düğmelerden gelirse yok sayılır
ACT.payCard = async () => { const r = await run('pay.card'); if (r) { lootToast(r.loot); reload(); } };

function paidBox(r) {
  const g = r.grant || {}, W = g.weapon && STARTER_WEAPONS[g.weapon], T = g.tier && PREMIUM[g.tier];
  showModal(`<h2>Satın alma tamam</h2><div class="in">${W ? `<p class="ydone">${ri('gift')} <b>${esc(W.name)}</b> çantana eklendi.</p><p>Karakter ekranından kuşanabilirsin.</p>`
    : T ? `<p class="ydone">${ri('san')} <b>${esc(T.name)} Premium</b> etkin: ${g.pdays} gün.</p>`
      : `<p class="ydone">${ri('gem')} <b>+${fmt(g.yakut || 0)} yakut</b>${g.bonus ? ` <span class="chip up">${fmt(g.bonus)} ilk alım bonusu dahil</span>` : ''}</p>`}
    ${g.days ? `<p>Yakut Kartı ${g.days} gün uzadı. Günlük yakutunu bu ekrandan almayı unutma.</p>` : ''}
    <p class="mut">Makbuz postana gönderildi. Yakut bakiyen: ${fmt(S.yakut)}</p>
    <div class="mbtns"><button class="btn red" data-a="closeModal">Tamam</button></div></div>`);
  hooks.hud();
}
// Onay sonucu: paid → yakut verildi · pending → ödeme henüz kesinleşmedi (sipariş cihazda bekletilir)
// quiet: arka planda yeniden onay (ekran açılırken); yalnızca yeni verilen yakut bildirilir
async function settled(order, r, proof, quiet) {
  if (r.status === 'paid') {
    pendDrop(order); storeFinish(proof);
    if (r.already) { if (quiet) return; await run('pay.view'); } // bildirim (webhook) önce davranmış: bakiye yenilenir
    return paidBox(r);
  }
  if (r.status === 'pending') { if (!quiet) toast('Ödeme onay bekliyor. Onaylanınca yakut hesabına yazılır.'); return; }
  pendDrop(order);
  if (!quiet) toast(r.status === 'refunded' || r.status === 'chargeback' ? 'Bu satın alma iade edilmiş.' : 'Satın alma tamamlanamadı.');
}
ACT.payBuy = async d => {
  const D = cur()?.data?.products ? cur().data : Y.D, P = D?.products?.find(x => x.sku === d.sku), prov = D && provOf(D);
  if (!P || !prov || Y.busy) return;
  Y.busy = P.sku; redraw(); starterRedraw();
  try {
    const o = await payCall('order', { sku: P.sku, provider: prov.id, ...(isStore(prov) ? {} : { cur: Y.cur }) });
    if (prov.kind === 'web') { if (!/^https:\/\//.test(o.url || '')) throw new Error('Ödeme sayfası açılamadı.'); pendAdd({ order: o.order }); location.href = o.url; return; } // ödeme sayfası; dönüşte resumePending onaylar
    let proof = {};
    if (isStore(prov)) { proof = await storeBuy({ storeId: o.storeId, account: o.account }); pendAdd({ order: o.order, ...proof }); }
    await settled(o.order, await payCall('confirm', { order: o.order, ...proof }), proof);
  } catch (e) { if (e.code !== 'cancelled') toast(e.message); }
  finally { Y.busy = null; if (cur() === Y.cfg || cur() === Y.shop) reload(); starterRedraw(); hooks.hud(); }
};
// Yarım kalanları onayla: ödeme sayfasından dönüş, uygulama kapanmış ya da bağlantı kopmuş olabilir
let resuming = false;
async function resumePending() {
  if (LOCAL || resuming) return;
  resuming = true;
  try {
    for (const p of pendList()) {
      try { await settled(p.order, await payCall('confirm', { order: p.order, ...(p.token ? { token: p.token } : {}), ...(p.txn ? { txn: p.txn } : {}) }), p, !p.loud); }
      catch (e) { if (['no-order', 'pay-void', 'pay-mismatch', 'bad-request'].includes(e.code) || Date.now() - (p.at || 0) > 14 * 86400000) pendDrop(p.order); else if (p.loud) toast(e.message); }
    }
    if (cur() === Y.cfg || cur() === Y.shop) reload();
  } finally { resuming = false; }
}
// Ödeme sayfasından dönüş: ?pay=<sipariş> (ya da ?pay=cancel). Adres temizlenir, oyun açılınca ekran gösterilir.
(() => {
  let v = null;
  try { const q = new URLSearchParams(location.search); v = q.get('pay'); if (v !== null) { q.delete('pay'); history.replaceState(history.state, '', location.pathname + (q.toString() ? '?' + q : '') + location.hash); } } catch { return; }
  if (v === null) return;
  if (UUID.test(v)) pendSave(pendList().map(p => (p.order === v ? { ...p, loud: true } : p)).concat(pendList().some(p => p.order === v) ? [] : [{ order: v, loud: true, at: Date.now() }]));
  const off = onState(s => {
    if (!s) return;
    off();
    const t = setInterval(() => { if (hud.hidden) return; clearInterval(t); if (UUID.test(v)) ACT.yakutAl(); else toast('Ödeme iptal edildi; hesabından para çekilmedi.'); }, 400);
  });
})();

// ====================================================================================================================
// Kervan (dükkân): "Yakut ile" ve "Gerçek para" sayfaları
// ====================================================================================================================
const used = k => S.daily[k] || 0;
const perkList = T => `<li>Savaşta <b>+%${Math.round(T.xp * 100)}</b> deneyim ve akçe</li><li>Eşya düşme oranı <b>+%${Math.round(T.drop * 100)}</b></li><li>Maden <b>×${String(T.mine).replace('.', ',')}</b> cevher</li><li><b>+${T.slots}</b> pazar ilan yuvası</li><li><b>+${T.tickets}</b> günlük meydan hakkı</li>`;
function shopYakut() {
  const T = PREMIUM[1], tier = myTier();
  return `<div class="hint">Kervan <b>Yakut</b> ile çalışır. Yakut günlük görevlerden, meydandan, ilk boss ve kapı geçişlerinden gelir. Eşsiz eşya ve boss hakkı satılmaz. (Elinde ${ri('gem')} ${fmt(S.yakut)})</div>
    <div class="kv-grid">${SHOP.map(x => { const n = used('shop_' + x.id), ok = S.yakut >= x.cost && n < x.max; return `<div class="kv-card">
      <span class="kv-badge">Günde ${x.max}</span>${resTile(x.give ? lootKind(x.give) : 'ticket', 'kv-ico')}
      <b class="kv-name">${x.name}</b><span class="mut kv-desc">${x.desc}</span><span class="chip">Bugün ${n}/${x.max}</span>
      <button class="btn kv-buy" data-a="shopBuy" data-id="${x.id}" ${ok ? '' : 'disabled'}>${ri('gem')} ${x.cost} yakut</button></div>`; }).join('')}
      <div class="kv-card kv-prem t1"><span class="kv-badge">30 gün</span>${`<span class="kv-ico">${med('crown', 'gold')}</span>`}<b class="kv-name">${T.name} Premium</b><ul class="kv-perks">${perkList(T)}</ul>
        <button class="btn red kv-buy" data-a="premBuy" data-t="1" ${tier > 1 || S.yakut < T.cost ? 'disabled' : ''}>${ri('gem')} ${fmt(T.cost)} yakut</button></div></div>
    <p class="mut">Gümüş ve Platin Premium yalnızca gerçek parayla alınır; “Gerçek para” sayfasına bak.</p>`;
}
function shopMoney(D) {
  const packs = D.products.filter(P => P.kind === 'yakut'), prem = D.products.filter(P => P.kind === 'premium'), tier = D.tier || 0;
  return `${banner(D)}${curSwitch(D)}
    ${D.starter ? '' : `<div class="kv-hero"><div class="kv-wpn">${Object.keys(STARTER_WEAPONS).map(k => wpnImg(k)).join('')}</div><div class="kv-herotx"><b>İlk Alım Paketi</b><span class="mut">Dört silahtan birini seç; yalnızca bir kez alınır.</span></div><button class="btn red" data-a="starterOpen">Silahları gör</button></div>`}
    <h3>Yakut paketleri</h3>
    <div class="kv-grid money">${packs.map((P, i) => `<div class="kv-card${P.bonus ? ' first' : ''}">
      ${P.bonus ? `<span class="kv-badge hot">İlk alım x${P.total / P.yakut} değer</span>` : ''}<i class="ygem s${Math.min(5, i)}">${svg('gem')}</i>
      <b class="kv-name">${esc(P.name)}</b><span class="yamt">${fmt(P.total)} <small>yakut</small></span>
      <span class="mut ysub">${P.bonus ? `${fmt(P.yakut)} + ${fmt(P.bonus)} bonus` : `${fmt(P.yakut)} yakut`}</span>${buyBtn(D, P)}</div>`).join('')}</div>
    <h3>Premium üyelik</h3>
    <div class="kv-grid two">${prem.map(P => { const T = PREMIUM[P.ptier]; return `<div class="kv-card kv-prem t${T.id}"><span class="kv-badge hot">Yalnızca gerçek para</span>${`<span class="kv-ico">${med('crown', 'gold')}</span>`}<b class="kv-name">${esc(P.name)}</b><ul class="kv-perks">${perkList(T)}</ul>
      ${tier > T.id ? '<button class="btn" disabled>Üst kademedesin</button>' : buyBtn(D, P, `${esc(priceOf(D, P))} / 30 gün`)}${tier === T.id ? '<span class="mut kv-desc">Etkin üyeliğin süresini uzatır.</span>' : ''}</div>`; }).join('')}</div>
    <h3>Yakut Kartı ve geçmiş</h3>
    <div class="row">${resTile('gem')}<div class="grow"><b>Yakut Kartı</b><br><span class="mut">30 gün boyunca her gün yakut.</span></div><button class="btn" data-a="yakutAl" data-tab="card">Kart</button><button class="btn" data-a="yakutAl" data-tab="hist">Geçmiş</button></div>`;
}
ACT.shop = d => {
  const free = false; // 20 Kas: reklam modülü kaldırıldı, "Ücretsiz" sekmesi yok
  Y.shop = { title: 'Kervan', top: true, tab: d?.tab === 'money' || d?.tab === 'copy' ? 'money' : d?.tab === 'free' && free ? 'free' : 'yakut', tabs: [{ id: 'yakut', label: 'Yakut ile', small: 'Günlük erzak', icon: 'gem' }, ...(free ? [{ id: 'free', label: 'Ücretsiz', small: 'Reklam ödülleri', icon: 'star' }] : []), { id: 'money', label: 'Gerçek para', small: 'Paket ve üyelik', icon: 'cart' }],
    load: t => (t === 'money' ? loadPay('packs') : null),
    render: t => { if (t !== 'money') return shopYakut(); const D = cur().data; return D ? shopMoney(D) : loading; } };
  openWin(Y.shop);
  if (Y.shop.tab === 'money') resumePending();
};
ACT.shopBuy = async d => { const r = await doAct('shop.buy', { id: d.id }); if (r) { lootToast(r.loot); if (d.id === 'ticket') toast('+5 meydan hakkı'); } };

// ====================================================================================================================
// İlk Alım Paketi: oyun başladıktan kısa süre sonra ana ekranda bir kez açılır; kapatılırsa sağda bir simge kalır
// ====================================================================================================================
const raceOf = () => (S.faction === 'ocak' ? 'ork' : 'insan'); // ocak: Kragmir · sancak: Elentha
const wpnImg = k => { const W = STARTER_WEAPONS[k]; return `<span class="kv-img">${ico({ b: 's:' + k, g: 2, p: 0 }, 'lg')}<img src="img/silah/${W.img}-${raceOf()}.webp" alt="${esc(W.name)}" loading="lazy" onerror="this.remove()"></span>`; };
const K_SEEN = () => 'dd_starter_' + (S?.name || '');
let seenMem = false;
const starterSeen = () => seenMem || ls.get(K_SEEN()) === '1';
const starterOwned = () => !!S?.pay?.starter;
// Ana ekrandaki sağ kenar simgesi (ui-hub.js renderHud çağırır): paket görüldü ama alınmadıysa durur
export const starterBtn = () => (S && starterSeen() && !starterOwned() ? `<div class="srail"><button class="lbtn" data-a="starterOpen" title="İlk Alım Paketi"><i>${svg('gift')}</i><span>İlk Alım</span><span class="badge">1</span></button></div>` : '');
function starterHtml(D) {
  const items = D.products.filter(P => P.kind === 'starter');
  return `<h2>İlk Alım Paketi</h2><div class="in"><p class="sk-lead">Bir silah seç; hesabına yalnızca bir kez eklenir. Her silah bir sınıf içindir.</p>
    <div class="sk-grid">${items.map(P => { const b = 's:' + P.weapon, B = itemBase(b);
      return `<div class="sk-card">${wpnImg(P.weapon)}<b class="kv-name">${esc(STARTER_WEAPONS[P.weapon].name)}</b>
        <span class="mut sk-cls">${B.cls.map(c => esc(CLASSES[c].name)).join(' · ')} · Sv. ${B.req}</span><span class="sk-stats">${statText(itemStats({ b, g: 2, p: 0 }))}</span>${buyBtn(D, P)}</div>`; }).join('')}</div>
    ${banner(D)}${curSwitch(D)}</div>`;
}
const starterX = () => modal.querySelector('.mx')?.setAttribute('data-a', 'starterLater'); // ✕ kapatınca sağ kenar simgesi görünsün
function starterRedraw() {
  if (modal.hidden || !modal.querySelector('.sk-grid') || !Y.D) return;
  const sc = modal.querySelector('.box')?.scrollTop || 0;
  showModal(starterHtml(Y.D), 'starter'); starterX(); modal.querySelector('.box').scrollTop = sc;
}
async function starterOpen() {
  showModal(`<h2>İlk Alım Paketi</h2><div class="in">${loading}</div>`, 'starter');
  const D = await loadPay('packs');
  if (!D) return closeModal();
  if (D.starter) { closeModal(); hooks.hud(); return; } // başka cihazdan alınmış
  if (!modal.hidden && modal.querySelector('.in')) showModal(starterHtml(D), 'starter'); starterX();
}
ACT.starterOpen = () => { seenMem = true; ls.set(K_SEEN(), '1'); starterOpen(); };
ACT.starterLater = () => { closeModal(); hooks.hud(); };
// Ana ekranda 20 sn sakin kalınca (öğretici bitmiş, pencere/savaş yok) paket kendiliğinden bir kez açılır
let calm = 0;
setInterval(() => {
  if (!S || hud.hidden || !modal.hidden || cur() || !S.tut?.end || S.battle || starterOwned() || starterSeen()) { calm = 0; return; }
  if ((calm += 2) >= 20) { calm = 0; ACT.starterOpen(); }
}, 2000);

// ====================================================================================================================
// Arkadaşlar
// ====================================================================================================================
const fcolor = f => FACTIONS[f]?.color || '#555';
function agoText(at) {
  if (at == null) return 'henüz görülmedi';
  const m = Math.max(0, Math.floor((now() - at) / 60000));
  return m < 1 ? 'az önce' : m < 60 ? `${m} dk önce` : m < 1440 ? `${Math.floor(m / 60)} sa önce` : `${Math.floor(m / 1440)} gün önce`;
}
const who = (x, sub) => `<button class="fwho" data-a="pcard" data-id="${esc(x.id)}"><b style="color:${fcolor(x.faction)}">${esc(x.name)}</b><span class="mut">${sub}</span></button>`;
// Arkadaş satırı: ad yanında klan sancağı ve başarım unvanı (son görülme belgesiyle yayınlanır)
const whoRich = (x, sub) => `<button class="fwho" data-a="pcard" data-id="${esc(x.id)}"><b style="color:${fcolor(x.faction)}">${tName(x.name, x.ti, x.rk)}${bannerSvg(x.banner, 'xs')}</b><span class="mut">${sub}</span></button>`;
function friendsHtml(D, tab) {
  if (tab === 'req') {
    const row = (x, btns) => `<div class="row frow">${who(x, `${FACTIONS[x.faction]?.name || ''} · ${agoText(x.at)}`)}${btns}</div>`;
    return `<h3>Gelen istekler (${D.in.length})</h3>${D.in.map(x => row(x, `<button class="btn sm green" data-a="frAccept" data-id="${esc(x.id)}">Kabul et</button><button class="btn sm" data-a="frDecline" data-id="${esc(x.id)}">Reddet</button>`)).join('') || '<p class="mut">Yanıt bekleyen istek yok.</p>'}
      <h3 style="margin-top:10px">Gönderdiklerin (${D.out.length}/${D.pending})</h3>${D.out.map(x => row(x, `<button class="btn sm" data-a="frCancel" data-id="${esc(x.id)}">Geri çek</button>`)).join('') || '<p class="mut">Gönderilmiş isteğin yok.</p>'}`;
  }
  if (tab === 'blocked') {
    return `<div class="hint">Engellediğin oyuncunun sohbet mesajlarını ve özel mesajlarını görmezsin; sana özel mesaj ve arkadaşlık isteği gönderemez. Engellemek için oyuncunun kartını aç.</div>
      ${D.blocked.map(x => `<div class="row frow"><span class="fwho"><b>${esc(x.name)}</b></span><button class="btn sm" data-a="unblock" data-id="${esc(x.id)}">Engeli kaldır</button></div>`).join('') || '<p class="mut">Engellediğin oyuncu yok.</p>'}`;
  }
  const on = D.friends.filter(x => x.online).length;
  return `<p class="mut">Arkadaşların: <b>${D.friends.length}/${D.max}</b> · şu an çevrimiçi: <b>${on}</b>${D.in.length ? ` · <button class="flink" data-a="tab" data-id="req">${D.in.length} yeni istek</button>` : ''}</p>
    ${D.friends.map(x => `<div class="row frow"><span class="fface">${faceImg(x, 'xs')}<i class="fdot ${x.online ? 'on' : ''}" title="${x.online ? 'Çevrimiçi' : 'Çevrimdışı'}"></i></span>${whoRich(x, `${x.lvl ? `Sv. ${x.lvl} · ` : ''}${x.il ? `${ilvTag(x.il)} · ` : ''}${x.online ? 'Çevrimiçi' : `Son görülme: ${agoText(x.seen)}`}`)}
      <button class="btn sm red" data-a="pm" data-id="${esc(x.id)}" data-name="${esc(x.name)}">Mesaj</button><button class="btn sm" data-a="frRemoveAsk" data-id="${esc(x.id)}" data-name="${esc(x.name)}">Çıkar</button></div>`).join('')
      || '<div class="hint"><b>Henüz arkadaşın yok.</b> Sohbette, sıralamada ya da Taş Yemini\'nde bir oyuncunun adına dokun; açılan karttan “Arkadaş ekle” seç.</div>'}`;
}
let FR = null;
ACT.friends = d => openWin(FR = { title: 'Arkadaşlar', tab: d?.tab || 'list', tabs: [{ id: 'list', label: 'Arkadaşlar', small: 'Son görülme', icon: 'party' }, { id: 'req', label: 'İstekler', small: 'Gelen ve giden', icon: 'mail' }, { id: 'blocked', label: 'Engellenenler', small: 'Engel listesi', icon: 'lock' }],
  load: () => run('friend.list'), render: t => { const D = cur().data; return D ? friendsHtml(D, t) : loading; } });
ACT.friendsMenu = () => { closeModal(); ACT.friends(); };
// İşlemden sonra: arkadaş penceresi açıksa yenilenir; oyuncu kartından geldiyse kart yeniden açılır
const after = (d, msg) => { if (msg) toast(msg); if (cur() === FR) reload(); if (d.card && !modal.hidden) ACT.pcard({ id: d.id }); }; // kart bu arada kapatıldıysa yeniden açılmaz
ACT.frAdd = async d => { const r = await run('friend.add', { id: d.id }); if (r) after(d, r.friend ? 'Artık arkadaşsınız.' : 'Arkadaşlık isteği gönderildi.'); };
ACT.frAccept = async d => { if (await run('friend.accept', { id: d.id })) after(d, 'Artık arkadaşsınız.'); };
ACT.frDecline = async d => { if (await run('friend.decline', { id: d.id })) after(d); };
ACT.frCancel = async d => { if (await run('friend.cancel', { id: d.id })) after(d, 'İstek geri çekildi.'); };
ACT.frRemove = async d => { const ok = await run('friend.remove', { id: d.id }); if (!d.card || !ok) closeModal(); if (ok) after(d, 'Arkadaş listenden çıkarıldı.'); };
ACT.frRemoveAsk = d => showModal(`<h2>Arkadaşlıktan çıkar</h2><div class="in"><p><b>${esc(d.name)}</b> arkadaş listenden çıkarılsın mı? Onun listesinden de silinirsin.</p>
  <div class="mbtns"><button class="btn red" data-a="frRemove" data-id="${esc(d.id)}" ${d.card ? 'data-card="1"' : ''}>Çıkar</button><button class="btn" data-a="closeModal">Vazgeç</button></div></div>`);

// ====================================================================================================================
// Engel ve şikâyet
// ====================================================================================================================
ACT.blockAsk = d => showModal(`<h2>Oyuncuyu engelle</h2><div class="in"><p><b>${esc(d.name)}</b> engellensin mi?</p><p class="mut">Sohbet mesajlarını ve özel mesajlarını görmezsin; sana özel mesaj ve arkadaşlık isteği gönderemez. Arkadaşsanız arkadaşlık biter. Engeli Menü → Arkadaşlar → Engellenenler'den kaldırabilirsin.</p>
  <div class="mbtns"><button class="btn red" data-a="block" data-id="${esc(d.id)}">Engelle</button><button class="btn" data-a="closeModal">Vazgeç</button></div></div>`);
ACT.block = async d => { closeModal(); if (await run('social.block', { id: d.id })) { toast('Oyuncu engellendi. Mesajları artık görünmeyecek.'); if (cur() === FR) reload(); } };
ACT.unblock = async d => { if (await run('social.unblock', { id: d.id })) after(d, 'Engel kaldırıldı.'); };

// Sohbet satırındaki "⋯": mesaj için şikâyet, gönderen için engel ve kart
ACT.msgMenu = d => !d ? undefined : showModal(`<h2>${esc(d.name)}</h2><div class="in"><p class="mquote">“${esc(d.text || '')}”</p>
  <div class="mgrid"><button class="btn" data-a="quoteMsg" data-name="${esc(d.name)}" data-text="${esc(d.text || '')}">Alıntı yap</button><button class="btn red" data-a="reportAsk" data-id="${esc(d.id)}" data-name="${esc(d.name)}" data-msg="${esc(d.msg)}" data-ch="${esc(d.ch)}" data-to="${esc(d.to || '')}" data-text="${esc(d.text || '')}">Mesajı şikâyet et</button>
    <button class="btn" data-a="blockAsk" data-id="${esc(d.id)}" data-name="${esc(d.name)}">Engelle</button><button class="btn" data-a="pcard" data-id="${esc(d.id)}">Kartını aç</button></div></div>`);
// Alıntı (19 Kas): mesajın kısaltılmış hâli yazı kutusunun başına eklenir; sohbet penceresi açıksa onun kutusuna, değilse alt sohbet çubuğuna
ACT.quoteMsg = d => {
  closeModal();
  const el = document.getElementById('chtext') || document.getElementById('cbtext'); if (!el) return;
  const t = String(d.text || '').replace(/\s+/g, ' ').trim(), q = `» ${d.name}: “${t.length > 40 ? t.slice(0, 39) + '…' : t}” `;
  el.value = (q + el.value).slice(0, +el.maxLength > 0 ? +el.maxLength : 200); el.focus(); try { el.setSelectionRange(el.value.length, el.value.length); } catch { /* bazı kutularda yok */ }
};
const REP = { id: null, name: '', msg: null, ch: null, to: null, text: '', reason: null };
function reportBox() {
  const note = $('#repnote')?.value || '';
  showModal(`<h2>Şikâyet et</h2><div class="in"><p><b>${esc(REP.name)}</b>${REP.msg ? ` · <span class="mquote">“${esc(REP.text)}”</span>` : ' adlı oyuncu'}</p>
    <div class="rgrid">${Object.entries(REPORT_REASONS).map(([k, v]) => `<button class="ibtn ${REP.reason === k ? 'sel' : ''}" data-a="repReason" data-k="${k}"><b>${v}</b></button>`).join('')}</div>
    <input type="text" id="repnote" maxlength="${REPORT_NOTE_MAX}" placeholder="Açıklama (isteğe bağlı)" autocomplete="off" value="${esc(note)}">
    <p class="mut">Şikâyetler yöneticilerce incelenir. Bir oyuncuyu günde bir kez şikâyet edebilirsin.</p>
    <div class="mbtns"><button class="btn red" data-a="repSend" ${REP.reason ? '' : 'disabled'}>Gönder</button><button class="btn" data-a="closeModal">Vazgeç</button></div></div>`, 'rep');
}
ACT.reportAsk = d => { Object.assign(REP, { id: d.id, name: d.name, msg: d.msg || null, ch: d.ch || null, to: d.to || null, text: d.text || '', reason: null }); const n = $('#repnote'); if (n) n.value = ''; reportBox(); };
ACT.repReason = d => { REP.reason = d.k; reportBox(); };
ACT.repSend = async () => {
  if (!REP.reason) return;
  const note = ($('#repnote')?.value || '').trim();
  const r = await run('chat.report', { id: REP.id, reason: REP.reason, ...(note ? { note } : {}), ...(REP.msg ? { msg: REP.msg, ch: REP.ch, ...(REP.to ? { to: REP.to } : {}) } : {}) });
  if (r) { closeModal(); toast('Şikâyetin alındı. Teşekkürler.'); }
};

// Oyuncu kartına eklenen düğmeler (ui-social.js: pcard çağırır). c.rel: { friend, in, out, blocked }
hooks.card = c => {
  if (c.me || !c.rel) return '';
  const id = `data-id="${esc(c.id)}" data-name="${esc(c.name)}" data-card="1"`, R = c.rel;
  const fr = R.blocked ? '' : R.friend ? `<button class="btn sm" data-a="frRemoveAsk" ${id}>Arkadaşlıktan çıkar</button>`
    : R.in ? `<button class="btn sm green" data-a="frAccept" ${id}>İsteği kabul et</button>`
      : R.out ? `<button class="btn sm" data-a="frCancel" ${id}>İsteği geri çek</button>` : `<button class="btn sm green" data-a="frAdd" ${id}>Arkadaş ekle</button>`;
  return `<div class="mbtns psoc">${R.friend ? '<span class="chip up">Arkadaşın</span>' : R.out ? '<span class="chip">İstek gönderildi</span>' : ''}${fr}${R.blocked ? `<button class="btn sm" data-a="unblock" ${id}>Engeli kaldır</button>` : `<button class="btn sm" data-a="blockAsk" ${id}>Engelle</button>`}<button class="btn sm" data-a="reportAsk" ${id}>Şikâyet et</button></div>`;
};
