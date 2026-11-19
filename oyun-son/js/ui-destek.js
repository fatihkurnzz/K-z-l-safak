// Duyurular (ana ekran, Menü'nün altındaki düğme) ve Sorun / Teknik Destek (Menü). Kural içermez: sunucudan okur
// (news.*, ticket.*, support.badge), yalnızca gösterir. Yönetici işleri yonetim.html sayfasındadır.
import { S, onState, now } from './api.js';
import { ACT, esc, run, closeModal, openWin, redraw, reload, cur, hooks, toast, loading, avatarImg } from './ui-core.js';
import { SUPPORT } from '../shared/destekdata.js';
import { fmtDate, fmtTime } from './i18n.js';

// ---------- Rozet: ana ekrandaki okunmamış sayıları ----------
const BADGE = { news: 0, tickets: 0 };
let polled = 0, busy = false;
export const supportBadge = () => ({ ...BADGE });
async function poll(force) {
  if (!S || busy || (!force && now() - polled < 90000)) return;
  busy = true; polled = now();
  try {
    const r = await run('support.badge');
    if (r && (r.news !== BADGE.news || r.tickets !== BADGE.tickets)) { BADGE.news = r.news; BADGE.tickets = r.tickets; hooks.hud(); }
  } finally { busy = false; }
}
let first = true;
onState(s => { if (s && first) { first = false; setTimeout(() => poll(true), 600); } });
setInterval(() => { if (!document.hidden) poll(); }, 120000);

const stamp = ts => `${fmtDate(ts)} ${fmtTime(ts)}`;

// ---------- Duyurular ----------
ACT.news = () => {
  closeModal();
  openWin({
    title: 'Duyurular', load: async () => {
      const d = await run('news.list');
      if (d?.unread) { BADGE.news = 0; run('news.read').then(() => hooks.hud()); }
      return d;
    },
    render: () => {
      const d = cur()?.data;
      if (!d) return loading;
      if (!d.items.length) return '<p class="mut" style="text-align:center;padding:20px">Henüz duyuru yok.</p>';
      return `<div class="dsk">${d.items.map(x => `<article class="dsk-n ${x.at > d.seen ? 'new' : ''}"><h3>${x.at > d.seen ? '<span class="dsk-dot"></span>' : ''}${esc(x.title)}</h3><small class="mut">${stamp(x.at)}${x.edited ? ' · güncellendi' : ''}</small><p class="dsk-body">${esc(x.body)}</p></article>`).join('')}</div>`;
    },
  });
};

// ---------- Sorun / Teknik Destek ----------
const SP = { view: 'list', t: null, cat: 'bug' };
const CAT = c => SUPPORT.cats[c] || c;
// Küçük çizimler: kategori simgeleri, liste başı afişi, boş durum ve destek ekibi rozeti (renkler arayüz temasından)
const CI = {
  bug: '<svg viewBox="0 0 24 24"><path d="M8 6.5a4 4 0 0 1 8 0v.5H8z"/><rect x="7" y="8" width="10" height="11" rx="5"/><path d="M12 9v9M3 12h4M17 12h4M4 7l3 2M20 7l-3 2M4 18l3-2M20 18l-3-2" stroke="currentColor" stroke-width="1.6" fill="none"/></svg>',
  account: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7z"/></svg>',
  pay: '<svg viewBox="0 0 24 24"><path d="M6 3h12l4 6-10 12L2 9z"/><path d="M2 9h20M9 3l3 6 3-6M12 21 9 9M12 21l3-12" stroke="#0004" stroke-width="1" fill="none"/></svg>',
  other: '<svg viewBox="0 0 24 24"><path d="M4 4h16v12H9l-5 4z"/><circle cx="9" cy="10" r="1.3" fill="#0006"/><circle cx="12.5" cy="10" r="1.3" fill="#0006"/><circle cx="16" cy="10" r="1.3" fill="#0006"/></svg>',
};
const catIco = c => `<span class="dsk-ci c-${c}">${CI[c] || CI.other}</span>`;
const HERO_ART = '<svg class="dsk-art" viewBox="0 0 120 80" aria-hidden="true"><path d="M18 14h70c6 0 6 8 0 8H26v42c0 6-8 6-8 0z" fill="#e9d6a8" stroke="#8a6a3a" stroke-width="2"/><path d="M26 22h62v40c0 6 8 6 8 0V22" fill="#f4e6c2" stroke="#8a6a3a" stroke-width="2"/><path d="M34 32h44M34 40h40M34 48h30" stroke="#b08a52" stroke-width="2.5" stroke-linecap="round"/><path d="M98 6l14 6-30 46-7 4 1-8z" fill="#fff6dc" stroke="#6a4a24" stroke-width="2"/><path d="M80 52l-6 10" stroke="#3a2412" stroke-width="2"/><circle cx="96" cy="64" r="9" fill="#c0392b" stroke="#7a1a12" stroke-width="2"/><path d="M92 64h8M96 60v8" stroke="#ffd7a0" stroke-width="2"/></svg>';
const EMPTY_ART = '<svg class="dsk-empty-art" viewBox="0 0 120 80" aria-hidden="true"><rect x="22" y="20" width="76" height="48" rx="4" fill="#f4e6c2" stroke="#8a6a3a" stroke-width="2"/><path d="M22 22l38 28 38-28" fill="none" stroke="#8a6a3a" stroke-width="2"/><circle cx="60" cy="50" r="7" fill="#c0392b"/><path d="M14 14l4 4M106 14l-4 4M60 4v7" stroke="#d2a24a" stroke-width="2.5" stroke-linecap="round"/></svg>';
const TEAM = '<span class="dsk-av team"><svg viewBox="0 0 24 24"><path d="M12 2l8 3v6c0 5-3.4 9.3-8 11-4.6-1.7-8-6-8-11V5z"/><path d="M8.5 12l2.5 2.5 4.5-5" stroke="#fff" stroke-width="2" fill="none"/></svg></span>';
const ST = s => SUPPORT.status[s] || s;
function renderSupport() {
  const d = cur()?.data;
  if (SP.view === 'new') {
    return `<div class="dsk"><button class="btn sm" data-a="spList">‹ Geri</button>
      <h3>Yeni talep</h3>
      <p class="mut">Sorununu yaz; yanıtı burada, bu pencerede göreceksin. Şifreni ya da kişisel bilgilerini yazma.</p>
      <div class="dsk-cats">${Object.keys(SUPPORT.cats).map(c => `<button class="btn sm ${SP.cat === c ? 'green' : ''}" data-a="spCat" data-c="${c}">${catIco(c)}${CAT(c)}</button>`).join('')}</div>
      <input type="text" id="spsub" maxlength="${SUPPORT.subject}" placeholder="Başlık" autocomplete="off" style="width:100%">
      <textarea id="sptxt" maxlength="${SUPPORT.text}" rows="5" placeholder="Sorunu anlat" style="width:100%"></textarea>
      <div class="mbtns"><button class="btn red" data-a="spSend">Gönder</button></div></div>`;
  }
  if (SP.view === 'thread') {
    const t = SP.t;
    if (!t) return loading;
    return `<div class="dsk"><button class="btn sm" data-a="spList">‹ Geri</button>
      <div class="dsk-thh">${catIco(t.cat)}<div><h3>${esc(t.subject)}</h3><p class="mut">${CAT(t.cat)} · <span class="dsk-st ${t.status}">${ST(t.status)}</span></p></div></div>
      <div class="dsk-th">${t.msgs.map(m => `<div class="dsk-m ${m.f}">${m.f === 'a' ? TEAM : `<span class="dsk-av">${avatarImg('sm')}</span>`}<div class="dsk-mb"><b>${m.f === 'a' ? 'Destek Ekibi' : esc(S.name)}</b> <small class="mut">${stamp(m.at)}</small><p class="dsk-body">${esc(m.t)}</p></div></div>`).join('')}</div>
      ${t.status === 'closed' ? '<p class="mut">Bu talep kapandı. Gerekirse yeni bir talep aç.</p>' : `<textarea id="sptxt" maxlength="${SUPPORT.text}" rows="3" placeholder="Mesaj yaz" style="width:100%"></textarea>
      <div class="mbtns"><button class="btn red" data-a="spSay">Gönder</button><button class="btn" data-a="spClose">Talebi kapat</button></div>`}</div>`;
  }
  if (!d) return loading;
  return `<div class="dsk"><div class="dsk-hero">${HERO_ART}<div><b>Bir sorun mu var?</b><p class="mut">Hata, hesap ya da ödeme: talebini yaz, yanıt bu pencereye gelir. En çok ${SUPPORT.maxOpen} açık talebin olabilir.</p><button class="btn red" data-a="spNew">Yeni talep aç</button></div></div>
    ${d.tickets.length ? d.tickets.map(t => `<button class="ibtn dsk-t" data-a="spOpen" data-id="${t.id}">${catIco(t.cat)}<span class="grow"><b>${t.unread ? '<span class="dsk-dot"></span>' : ''}${esc(t.subject)}</b><br><small class="mut">${CAT(t.cat)} · ${stamp(t.upd)}</small></span><span class="dsk-st ${t.status}">${ST(t.status)}</span></button>`).join('')
      : `<div class="dsk-empty">${EMPTY_ART}<p class="mut">Henüz bir talebin yok. Her şey yolunda görünüyor.</p></div>`}</div>`;
}
ACT.supportMenu = () => { closeModal(); SP.view = 'list'; SP.t = null; openWin({ title: 'Sorun / Teknik Destek', load: () => run('ticket.list'), render: renderSupport }); };
ACT.spList = () => { SP.view = 'list'; SP.t = null; reload(); };
ACT.spNew = () => { SP.view = 'new'; redraw(); };
ACT.spCat = d => { const sub = document.getElementById('spsub')?.value, txt = document.getElementById('sptxt')?.value; SP.cat = d.c; redraw(); if (sub !== undefined) document.getElementById('spsub').value = sub; if (txt !== undefined) document.getElementById('sptxt').value = txt; };
ACT.spOpen = async d => {
  SP.view = 'thread'; SP.t = null; redraw();
  const r = await run('ticket.get', { id: d.id });
  if (!r) { SP.view = 'list'; return redraw(); }
  SP.t = r.ticket; redraw(); poll(true);
};
ACT.spSend = async () => {
  const r = await run('ticket.open', { cat: SP.cat, subject: document.getElementById('spsub')?.value || '', text: document.getElementById('sptxt')?.value || '' });
  if (!r) return;
  toast('Talebin gönderildi.');
  SP.view = 'list'; reload();
};
ACT.spSay = async () => {
  const r = await run('ticket.say', { id: SP.t.id, text: document.getElementById('sptxt')?.value || '' });
  if (!r) return;
  ACT.spOpen({ id: SP.t.id });
};
ACT.spClose = async () => { if (await run('ticket.close', { id: SP.t.id })) { toast('Talep kapandı.'); SP.view = 'list'; SP.t = null; reload(); } };
