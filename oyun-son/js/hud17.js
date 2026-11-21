// Ana merkez arayüzü (19 Kas, kullanıcının görsel referansı: karanlık, gerçekçi Orta Çağ MMORPG şehir ekranı).
// Bileşenler gerçek arayüz parçalarıdır (resim değil): birim çerçevesi (portre + Sv/ad + can/mana), sol simge rayı,
// mini harita (yer adı, koordinat, M = Diyar Haritası), görev paneli, alt yetenek çubuğu (1–0), deneyim şeridi, NPC ad
// levhaları. İki halk aynı yerleşimi kullanır; renkler html[data-faction] ile değişir (css/v17-hub.css).
import { svg } from './icons.js';
import { skillIcon } from './skill-icons.js';
import { SKILLS } from '../shared/skills.js';

const esc = t => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const num = n => Math.round(n).toLocaleString('tr-TR');

/** Sol üst birim çerçevesi: portre, "Sv.X Ad", can ve mana çubukları (şehirde dolu). name: tName çıktısı (kaçışlı HTML). */
export function unitFrame({ avatar, name, lvl, hp, mp }) {
  return `${avatar}<span class="uf-info"><b class="uf-nm"><em>Sv.${lvl}</em> ${name}</b>
    <span class="uf-bar hp"><i style="width:100%"></i><s>${num(hp)} / ${num(hp)}</s></span>
    ${mp > 0 ? `<span class="uf-bar mp"><i style="width:100%"></i><s>${num(mp)} / ${num(mp)}</s></span>` : ''}</span>`;
}

/** Alt yetenek çubuğu: 1–0 yuvaları; doluysa düzendeki yetenek (temel saldırı + aktifler). Dokunuş Karakter → Yetenek açar. */
export function hotbarHtml(skillIds) {
  const slots = Array.from({ length: 10 }, (_, i) => {
    const id = skillIds[i], S = id && SKILLS[id];
    return `<button class="hb-slot ${S ? 'on' : ''} ${i >= 6 ? 'hb-x' : ''}" data-a="hotbar" title="${S ? esc(S.name) : 'Boş yuva'}"><em>${(i + 1) % 10}</em>${S ? skillIcon(id) || svg('battle') : ''}</button>`;
  }).join('');
  return `<div class="hotbar"><i class="hb-end l" aria-hidden="true"></i>${slots}<i class="hb-end r" aria-hidden="true"></i></div>`;
}

/** En alttaki deneyim şeridi. */
export function expHtml(xp, need) {
  const p = need > 0 ? Math.max(0, Math.min(100, (100 * xp) / need)) : 0;
  return `<div class="expbar" title="Deneyim ${num(xp)} / ${num(need)}"><b>EXP %${p.toFixed(2).replace('.', ',')}</b><span><i style="width:${p}%"></i></span></div>`;
}

/** Mini harita kabı (çizim drawMinimap ile, kanvasa). */
export function minimapHtml(title, coords) {
  return `<div class="mmap"><div class="mm-hd"><b>${esc(title)}</b></div><canvas class="mm-cv" width="10" height="10" aria-label="Mini harita"></canvas>
    <div class="mm-ft"><span>${svg('zones')}</span><em>(${coords[0]}, ${coords[1]})</em><button data-a="diyarMap" title="Diyar Haritası">M</button></div></div>`;
}

// Bina türüne göre işaret rengi ve biçimi
const MARK = { gate: ['#7fd0ff', 'ring'], carsi: ['#ffd36a', 'ring'], clanhq: ['#ffd36a', 'crown'], anvil: ['#ff9a4a', 'sq'], mine: ['#c9a87c', 'sq'], iksir: ['#8fe08a', 'sq'], wheel: ['#e7c75a', 'sq'], monument: ['#d8d0c0', 'sq'], king: ['#ffd36a', 'crown'], merchant: ['#8fe08a', 'dot'] };
/**
 * Mini haritayı çizer. pts: [{ id, x, z }] (dünya koordinatı), me: { x, z } (oyuncu), faction: renk.
 * Harita oyuncuyu merkeze alır; meydan, yollar, binalar ve kuzeyi gösteren ok çizilir.
 */
export function drawMinimap(cv, pts, me, faction) {
  if (!cv) return;
  const r = cv.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1), W = Math.max(40, Math.round(r.width)), H = Math.max(40, Math.round(r.height));
  if (cv.width !== W * dpr) { cv.width = W * dpr; cv.height = H * dpr; }
  const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
  const sc = Math.min(W, H) / 30, cx = W / 2, cy = H * 0.62, P = (x, z) => [cx + (x - me.x) * sc, cy + (z - me.z) * sc];
  const stone = faction === 'sancak' ? ['#6d6a5e', '#3a3a34'] : ['#5a4434', '#241a14'];
  const bg = g.createRadialGradient(cx, cy, 4, cx, cy, Math.max(W, H)); bg.addColorStop(0, stone[0]); bg.addColorStop(1, stone[1]);
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  // doku: rastgele değil, sabit benekler (her çizimde aynı)
  g.fillStyle = 'rgba(0,0,0,.18)'; for (let i = 0; i < 70; i++) { const a = (i * 137.5) % 360, d = (i * 7.3) % 1; g.fillRect((Math.cos(a) * 0.5 + 0.5) * W * d + (i % 9) * 3, (Math.sin(a) * 0.5 + 0.5) * H * (1 - d) + (i % 5) * 4, 2, 2); }
  // meydan ve yollar
  const [px, pz] = P(0, 0);
  g.strokeStyle = 'rgba(232,210,160,.35)'; g.lineWidth = 3; g.lineCap = 'round';
  for (const p of pts) { const [x, y] = P(p.x, p.z); g.beginPath(); g.moveTo(px, pz); g.lineTo(x, y); g.stroke(); }
  g.fillStyle = 'rgba(232,210,160,.22)'; g.beginPath(); g.arc(px, pz, 5.5 * sc, 0, Math.PI * 2); g.fill();
  g.strokeStyle = 'rgba(232,210,160,.45)'; g.lineWidth = 1; g.stroke();
  // işaretler
  for (const p of pts) {
    const [x, y] = P(p.x, p.z), [col, kind] = MARK[p.id] || ['#e8dcc0', 'dot'];
    g.fillStyle = col; g.strokeStyle = '#120a05'; g.lineWidth = 1.2;
    g.beginPath();
    if (kind === 'ring') { g.arc(x, y, 4.2, 0, Math.PI * 2); g.fill(); g.stroke(); g.fillStyle = '#120a05'; g.beginPath(); g.arc(x, y, 1.6, 0, Math.PI * 2); g.fill(); }
    else if (kind === 'crown') { g.moveTo(x - 5, y + 3); g.lineTo(x - 5, y - 2); g.lineTo(x - 2.5, y + 0.5); g.lineTo(x, y - 4); g.lineTo(x + 2.5, y + 0.5); g.lineTo(x + 5, y - 2); g.lineTo(x + 5, y + 3); g.closePath(); g.fill(); g.stroke(); }
    else if (kind === 'sq') { g.rect(x - 3.4, y - 3.4, 6.8, 6.8); g.fill(); g.stroke(); }
    else { g.arc(x, y, 2.8, 0, Math.PI * 2); g.fill(); g.stroke(); }
  }
  // oyuncu oku (yukarı = kapıya doğru)
  const [mx, my] = P(me.x, me.z);
  g.fillStyle = '#fff3c4'; g.strokeStyle = '#120a05'; g.lineWidth = 1.4;
  g.beginPath(); g.moveTo(mx, my - 6); g.lineTo(mx + 4.5, my + 4.5); g.lineTo(mx, my + 2); g.lineTo(mx - 4.5, my + 4.5); g.closePath(); g.fill(); g.stroke();
  // çerçeve gölgesi
  const vg = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.55)');
  g.fillStyle = vg; g.fillRect(0, 0, W, H);
}

/** NPC ad levhası içeriği: yeşil rol etiketi + ad (görseldeki "[Demirci] Grom" düzeni). */
export const plate = (role, name) => `${role ? `<small class="rl">[${esc(role)}]</small>` : ''}<b>${esc(name)}</b>`;
export const ROLE = { arena: 'Savaş', gate: 'Geçit', carsi: 'Geçit', clanhq: 'Kral Otağı', anvil: 'Demirci', mine: 'Madenci', iksir: 'Simyacı', wheel: 'Talih', monument: 'Anıt', king: 'Kral', merchant: 'Tüccar', child: '', karaborsa: 'Kaçakçı', yashka: 'Şaman', pazar: 'Pazar', tuccar: 'Tüccar', pier: 'Balıkçı', k_hq: 'Klan', k_salon: 'Klan', k_gorev: 'Görev', k_dukkan: 'Dükkân', k_sancak: 'Sancak', k_av: 'Av', k_hisar: 'Hisar', k_hazine: 'Hazine' };
