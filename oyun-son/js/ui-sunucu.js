// Sunucu paneli (Ares): yalnızca oyunda var olan verileri okuyup gösterir; veri yoksa satır gizlenir.
// Kaynaklar: S, api.now/LOCAL, monument.view (Başbuğ, en güçlü klan, şampiyon, Büyük Sefer), realm.map (bölgeler, aktif oyuncu),
// realm.view (kendi ırkının hazinesi), season.view (PvP sezonu), shared/realm.js (hafta, saat), shared/pvp.js (zindan düzeni).
import { S, now, LOCAL } from './api.js';
import { SERVER, FACTIONS, HISAR } from '../shared/content.js';
const GUN = ['pazartesi', 'salı', 'çarşamba', 'perşembe', 'cuma', 'cumartesi', 'pazar']; // HISAR.day: haftanın günü (0 = pazartesi)
import { weekStartAt, clockOf, DAY } from '../shared/realm.js';
import { weekKey } from '../shared/content.js';
import { modNow } from '../shared/pvp.js';
import { NUFUS, NUFUS_LINE } from '../shared/nufus.js'; // nüfus dengesi (Bereket, dolu ırk)
import { ACT, esc, fmt, run, showModal } from './ui-core.js';
import { p24Img, p24ImgSync } from './ui-kaplama.js';

const LEFT = ms => { const m = Math.max(0, Math.floor(ms / 60000)); return m >= 1440 ? `${Math.floor(m / 1440)} gün ${Math.floor(m % 1440 / 60)} sa` : m >= 60 ? `${Math.floor(m / 60)} sa ${m % 60} dk` : `${m} dk`; };
const row = (k, v) => (v === null || v === undefined || v === '' ? '' : `<div class="srv-row"><span>${k}</span><b>${v}</b></div>`);

// Özgün amblem: dört dilimli demir kalkan, ortada örs ve iki kıvrık hat (dini simge yok)
export const serverEmblem = (cls = 'srv-emb') => `<svg class="${cls}" viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="srvg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9c9a0"/><stop offset="1" stop-color="#8a6f3b"/></linearGradient></defs><path d="M32 4 56 12v20c0 14-10 23-24 28C18 55 8 46 8 32V12z" fill="#241f1a" stroke="url(#srvg)" stroke-width="3"/><path d="M32 4v56" stroke="#8a6f3b" stroke-width="1.5" opacity=".6"/><path d="M18 34h28l-3 5H21zM22 30h22c0-4-3-6-8-6h-8c-3 0-5 1-6 6z" fill="url(#srvg)"/><path d="M28 39h8v6h4v3H24v-3h4z" fill="url(#srvg)"/><circle cx="32" cy="17" r="3" fill="#c2321e"/></svg>`;

// Etiket ("Ares"): giriş ekranı ve profil için; dokununca panel açılır
export const serverTag = () => `<span class="srv-tag" data-a="server" title="Sunucu: ${SERVER.name}">${SERVER.name}</span>`;

// İki ırk arasında çapraz kılıçlar (19 Kas: ırklar yan yana)
const SWORDS = '<svg viewBox="0 0 48 48"><g fill="none" stroke-linecap="round"><path d="M9 7l26 26M39 7L13 33" stroke="#e8edf3" stroke-width="3.2"/><path d="M9 7l26 26M39 7L13 33" stroke="#9aa6b4" stroke-width="1.2"/><path d="M30 36l6-6M12 30l6 6" stroke="#d9b04a" stroke-width="3.4"/><path d="M35 35l5 5M13 35l-5 5" stroke="#6a4526" stroke-width="3.4"/></g><circle cx="40.5" cy="40.5" r="2.4" fill="#d9b04a"/><circle cx="7.5" cy="40.5" r="2.4" fill="#d9b04a"/></svg>';
const body = (m, map, rv, sv, wv) => {
  const t = now(), day = Math.max(1, Math.floor((t - SERVER.openAt) / DAY) + 1);
  const W = weekKey(t), weekEnd = weekStartAt(W + 1), M = modNow(t);
  const ban = p24ImgSync('ban_sunucu_vs'); // P24: üst banner (Elentha vs Kragmir) + ortada SUNUCU · ARES rozeti
  const head = ban ? `<div class="srv-head srv-ban" style="background-image:url(${ban})"><div class="srv-badge"><small class="srv-kick">Sunucu</small><h2>${SERVER.name}</h2><small>Korant Online · ${esc(SERVER.tz)}</small></div></div>`
    : `<div class="srv-head">${serverEmblem()}<div><small class="srv-kick">Sunucu</small><h2>${SERVER.name}</h2><small>Korant Online · ${esc(SERVER.tz)}</small></div></div>`;
  const stat = `    <div class="srv-stat"><span class="${LOCAL ? 'off' : 'on'}">${LOCAL ? 'Yerel deneme kipi' : 'Çevrimiçi'}</span><span>Sunucu saati ${clockOf(t)}</span><span>Açılıştan beri ${day}. gün</span></div>`;
  // Irklar
  const rulers = m?.rulers || {}, zones = map?.zones || m?.war?.terr || [];
  const races = ['sancak', 'ocak'].map(f => {
    const F = FACTIONS[f], r = rulers[f], own = zones.filter(z => z.owner === f).length, act = map?.act?.[f];
    const tre = rv && rv.faction === f ? rv.treasury : null, N = map?.nufus;
    const rows = row('Başbuğ', r ? esc(r.name) : null) + row('Başbuğ seviyesi', r?.lvl ? `Sv. ${r.lvl}` : null)
      + row('Hâkim bölge', zones.length ? `${own} / ${zones.length}` : null) + row('Bu hafta etkin oyuncu', !N && Number.isFinite(act) ? fmt(act) : null) // nüfus verisi varsa tek etkinlik satırı: 'Son 7 günde giren'
      + (N ? row('Kayıtlı oyuncu', fmt(N.reg[f])) + row('Son 7 günde giren', fmt(N.act[f]))
        + row('Nüfus durumu', N.closed === f ? '<span class="nf-off">Yeni hesaba kapalı</span>' : N.minor === f ? `<span class="nf-on">Bereket ${NUFUS_LINE}</span>` : 'Dengede') : '')
      + row('Irk hazinesi', tre ? `${fmt(tre.gold)} akçe` : null) + (m?.war?.holder === f ? row('Büyük Sefer', 'Üstün ırk') : '');
    return `<div class="srv-card f-${f}" style="--fc:${F.color}"><h4>${F.name}</h4>${rows || '<span class="mut">Veri yok</span>'}</div>`;
  }).join('');
  // Dönem ve takvim
  const sea = sv ? row('PvP sezonu', `Sezon ${sv.no}`) + row('Sezon sonuna', LEFT(sv.end - t)) + (sv.rank ? row('Senin sıran', `${sv.rank}.`) : '') : '';
  const cal = row('Hafta sonuna (Büyük Sefer, bölge hâkimiyeti, Başbuğ seçimi)', LEFT(weekEnd - t))
    + row('Dünya Baskını', 'cumartesi 00:00 – pazar 23:59; iki ırk ortak havuz, ödül pazartesi postayla') + row('Akın', 'her 4 saatte bir, 1 saat açık (00:00, 04:00, 08:00…)') + row('Hisar Kuşatması', `haftada bir klan yarışı: ${GUN[HISAR.day]} ${String(HISAR.hour).padStart(2, '0')}:00, ${HISAR.len} dk`)
    + (M ? row('Zindan düzeni (bu hafta)', esc(M.name)) : '') + row('Hava', 'altı saatte bir değişir');
  const lead = [m?.champ ? row('Meydan şampiyonu', `<span style="color:${FACTIONS[m.champ.faction]?.color || 'inherit'}">${esc(m.champ.name)}</span>${m.champ.lvl ? ` · Sv. ${m.champ.lvl}` : ''}`) : '',
    m?.clan ? row('En güçlü klan', `${esc(m.clan.name)}${m.clan.faction && FACTIONS[m.clan.faction] ? ` · ${FACTIONS[m.clan.faction].name}` : ''}`) : '',
    m?.clan?.power ? row('Klan gücü', fmt(m.clan.power)) : ''].join('');
  const N = map?.nufus, nf = N ? `<p class="mut srv-nf"><span>${N.by === 'act' ? 'Nüfus dengesi son 7 günde giren oyuncu sayısına bakar.' : 'Nüfus dengesi kayıtlı oyuncu sayısına bakar.'}</span> <span>Nüfus farkı %5'i aşarsa azınlıktaki ırk Bereket alır; bir ırk ötekinin %${NUFUS.capPct}'sini geçerse ona yeni hesap açılmaz.</span>${N.small ? ` <span>Sunucu küçük (toplam ${fmt(N.total)} < ${NUFUS.minTotal}): giriş kapama uygulanmıyor.</span>` : ''}</p>` : '';
  return `${head}${stat}<div class="srv-grid srv-vs">${races.replace('</div><div class="srv-card f-ocak"', `</div><div class="srv-x" aria-hidden="true">${SWORDS}</div><div class="srv-card f-ocak"`)}</div>${nf}
    ${sea || cal ? `<div class="srv-sec"><h3>Dönem ve takvim</h3>${sea}${cal}</div>` : ''}
    ${lead ? `<div class="srv-sec"><h3>Sıralama</h3>${lead}</div>` : ''}
    <div class="srv-sec"><h3>Sunucu kuralları</h3><ul class="srv-rules">${SERVER.rules.map(x => `<li>${x}</li>`).join('')}</ul></div>
    <div class="mbtns"><button class="btn" data-a="supportMenu">Sorun / Teknik Destek</button><button class="btn" data-a="otagMenu">Otağ</button><button class="btn" data-a="closeModal">Kapat</button></div>`;
};

ACT.server = async () => {
  showModal(`<h2>${SERVER.name}</h2><div class="in"><p class="mut">Sunucu bilgileri yükleniyor…</p></div>`, 'wide');
  await p24Img('ban_sunucu_vs').catch(() => ''); // P24 banner
  const g = n => run(n).catch(() => null);
  const [m, map, rv, sv] = await Promise.all([g('monument.view'), g('realm.map'), S ? g('realm.view') : null, g('season.view')]);
  showModal(`<div class="in srv">${body(m, map, rv, sv)}</div>`, 'wide');
};
