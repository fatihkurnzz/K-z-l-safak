// Görünüm paketinin arayüzü: grafik kademesi seçimi (Profil → Grafik) ve Örs'teki "bas" anının kıvılcımları.
// Kural içermez. Örs'ün sonucu sunucudan gelir (ui-esya.js); burası yalnızca iki saniyelik gerilimi ve sonucu süsler:
// ACT.upgrade sarılır, özgün akış ve olay noktaları olduğu gibi kalır.
import { ACT, $, showModal } from './ui-core.js';
import { TIER_KEYS, TIER_NAMES, TIER_NOTES, TIERS, getGfx, setGfx } from './gfx.js';
import { ANVIL_FX } from './fx-table.js';

// ======================= Grafik kademesi =======================
// Kademe hemen uygulanır (çözünürlük, gölge, ışıma, efektler). Karakter modellerinin türü (ayrıntılı / hafif) açılışta
// yüklenir: seçilen kademe yüklenenle uyuşmuyorsa oyunun yeniden açılması önerilir.
const hd = new URLSearchParams(location.search).get('hd');
const canRig = () => (!window.DD_LOCAL || window.DD_MODELS) && hd !== '0';
const wantReload = () => hd !== '1' && canRig() && TIERS[getGfx().tier].rigged !== !!window.DD_RIGGED;
const num = v => String(v).replace('.', ',');
function gfxModal() {
  const g = getGfx(), T = TIERS[g.tier];
  const opt = (id, name, note) => `<button class="gfxo ${g.choice === id ? 'on' : ''}" data-a="gfxSet" data-t="${id}"><b>${name}</b><small>${note}</small></button>`;
  showModal(`<h2>Grafik</h2><div class="in">
    <div class="gfxopts">${opt('auto', 'Otomatik', `Cihazına göre seçilir; oyun takılırsa bir kademe iner. Şu an: ${TIER_NAMES[g.tier]}.`)}${TIER_KEYS.map(k => opt(k, TIER_NAMES[k], TIER_NOTES[k])).join('')}</div>
    <p class="mut gfxnow">${TIER_NAMES[g.tier]}: çözünürlük en çok ×${num(T.dpr)} · ${T.shadow ? `gölge ${T.shadow} piksel` : 'zemin lekesi'} · ${T.post ? 'ışıma açık' : 'ışıma kapalı'} · ${T.rigged ? 'ayrıntılı karakterler' : 'hafif karakterler'}${g.forced ? ' · adres çubuğundan zorlanmış' : ''}</p>
    ${wantReload() ? `<p class="hint">Karakter modelleri oyun yeniden açılınca ${T.rigged ? 'ayrıntılı (yaklaşık 3,5 MB indirilir)' : 'hafif'} olur.</p>` : ''}
    <div class="mbtns">${wantReload() ? '<button class="btn" data-a="gfxReload">Yeniden aç</button>' : ''}<button class="btn" data-a="profile">Geri</button></div></div>`, 'gfxbox');
}
ACT.gfx = gfxModal;
ACT.gfxSet = d => { setGfx(d.t); gfxModal(); };
ACT.gfxReload = () => location.reload();

// ======================= Örs anı =======================
// Tuval Örs panelinin (#anv) içine yerleşir, panelle birlikte sarsılır; iş bitince kaldırılır. Parçacıklar küçük sayıdadır
// (en çok ~150) ve yalnızca efekt sürerken çizilir. "Hareketi azalt" ayarı açıksa hiç çizilmez.
const still = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
function mount(anv) {
  const cv = document.createElement('canvas'), dpr = Math.min(window.devicePixelRatio || 1, 1.5), w = anv.clientWidth, h = anv.clientHeight;
  cv.className = 'anvfx'; cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
  anv.appendChild(cv);
  const x = cv.getContext('2d'); x.scale(dpr, dpr);
  // eşya ikonunun panele göre merkezi (döndürülmüş ekranda da doğru: ölçüm yerleşimden alınır, ekrandan değil)
  let ox = w / 2, oy = 40;
  const ico = anv.querySelector('.ahead .ico');
  if (ico) { ox = ico.offsetWidth / 2; oy = ico.offsetHeight / 2; for (let e = ico; e && e !== anv; e = e.offsetParent) { ox += e.offsetLeft; oy += e.offsetTop; } }
  return { cv, x, w, h, ox, oy };
}
const rnd = (a, b) => a + Math.random() * (b - a);
// Ortak çizim döngüsü: parts = parçacıklar; draw(t, dt) ek çizim (halka, çatlak…) · ms: toplam süre
// Panel açık renklidir: toplamalı karışım görünmez, bu yüzden her kıvılcım koyu-doygun bir dış çizgi ve parlak bir iç
// çizgiyle (olağan karışım) çizilir.
function run(S, ms, parts, draw) {
  const { cv, x, w, h } = S;
  let t0 = 0, last = 0;
  const step = now => {
    if (!cv.isConnected) return;
    if (!t0) t0 = last = now;
    const t = now - t0, dt = Math.min(50, now - last) / 1000; last = now;
    x.clearRect(0, 0, w, h);
    draw?.(t, dt);
    x.lineCap = 'round';
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      if (p.wait > 0) { p.wait -= dt * 1000; continue; }
      p.life -= dt;
      if (p.life <= 0) { parts.splice(i, 1); continue; }
      const k = p.life / p.max, sp = Math.hypot(p.vx, p.vy) || 1, tl = Math.min(16, sp * 0.045) / sp, px = p.x - p.vx * tl, py = p.y - p.vy * tl;
      p.vy += p.g * dt; p.vx *= 1 - p.drag * dt; p.vy *= 1 - p.drag * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      x.globalAlpha = Math.min(1, k * 1.8) * (p.a ?? 1);
      if (p.kind === 'smoke') { x.fillStyle = p.c; x.beginPath(); x.arc(p.x, p.y, p.r * (2 - k), 0, 6.283); x.fill(); }
      else if (p.kind === 'shard') { p.rot += p.spin * dt; x.fillStyle = p.c; x.save(); x.translate(p.x, p.y); x.rotate(p.rot); x.beginPath(); x.moveTo(-p.r, -p.r * 0.5); x.lineTo(p.r, 0); x.lineTo(-p.r * 0.6, p.r * 0.7); x.closePath(); x.fill(); x.restore(); }
      else {
        x.strokeStyle = p.c; x.lineWidth = p.r + 1.6; x.beginPath(); x.moveTo(px, py); x.lineTo(p.x, p.y); x.stroke();
        if (p.c2) { x.strokeStyle = p.c2; x.lineWidth = Math.max(0.8, p.r - 0.4); x.beginPath(); x.moveTo((px + p.x) / 2, (py + p.y) / 2); x.lineTo(p.x, p.y); x.stroke(); }
      }
    }
    x.globalAlpha = 1;
    if ((t < ms || parts.length) && t < ms + 2500) requestAnimationFrame(step); else cv.remove();
  };
  requestAnimationFrame(step);
}
const spark = (S, c, o = {}) => { const a = o.ang ?? rnd(0, 6.283), v = o.v ?? rnd(80, 260); return { x: S.ox + (o.dx || 0), y: S.oy + (o.dy || 0), vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: o.g ?? 420, drag: o.drag ?? 1.2, life: o.life ?? rnd(0.35, 0.8), max: 0, r: o.r ?? rnd(1.2, 2.4), c, c2: o.c2, wait: o.wait || 0, kind: o.kind, rot: rnd(0, 6), spin: rnd(-9, 9), a: o.a }; };
const fix = ps => { for (const p of ps) p.max = p.life; return ps; };
// Yumuşak parıltı: rengin saydamına doğru açılan dairesel geçiş
const rgba = (hex, a) => `rgba(${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)},${a})`;
const glowAt = (x, cx, cy, r, c, a) => { const g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, rgba(c, a)); g.addColorStop(0.5, rgba(c, a * 0.45)); g.addColorStop(1, rgba(c, 0)); x.fillStyle = g; x.fillRect(cx - r, cy - r, r * 2, r * 2); };

// İki saniyelik gerilim: çekiç ikona her indiğinde (CSS'teki vuruşla aynı an) kıvılcım saçılır ve örs parlar; eşya giderek kızarır
function forgeFx(anv) {
  if (still()) return;
  const S = mount(anv), F = ANVIL_FX, parts = [];
  for (let i = 0; i < F.hits; i++) {
    const at = i * F.hitMs + F.hitMs * 0.4, n = F.spark.n + i * 3; // her vuruş bir öncekinden biraz daha gür
    for (let k = 0; k < n; k++) parts.push(spark(S, F.spark.color, { c2: F.spark.core, ang: rnd(-Math.PI * 0.95, -Math.PI * 0.05), v: rnd(110, 260 + i * 30), wait: at, life: rnd(0.35, 0.75), r: rnd(1.4, 2.6) }));
  }
  fix(parts);
  const total = F.hits * F.hitMs;
  run(S, total, parts, t => {
    const heat = Math.min(1, t / total), ph = (t % F.hitMs) / F.hitMs, hit = ph >= 0.4 ? Math.max(0, 1 - (ph - 0.4) / 0.25) : 0;
    glowAt(S.x, S.ox, S.oy, 44 + heat * 30, heat > 0.8 ? '#ffb030' : '#ff6a1a', 0.2 + heat * 0.45); // eşya ısınır
    if (hit > 0) glowAt(S.x, S.ox, S.oy + 6, 54 + heat * 36, '#fff0b0', hit * 0.95);                 // çekiç parlaması
  });
}
// Sonuç: beş ayrı patlama (fx-table.js: ANVIL_FX.out)
function resultFx(anv, out) {
  const O = Object.hasOwn(ANVIL_FX.out, out) ? ANVIL_FX.out[out] : null;
  if (!O || still()) return;
  const S = mount(anv), parts = [], x = S.x;
  const cracks = [];
  for (let i = 0; i < O.cracks; i++) { const a = i / O.cracks * 6.283 + rnd(-0.3, 0.3), seg = []; let px = S.ox, py = S.oy; for (let k = 0; k < 5; k++) { px += Math.cos(a + rnd(-0.6, 0.6)) * rnd(14, 30); py += Math.sin(a + rnd(-0.6, 0.6)) * rnd(14, 30); seg.push([px, py]); } cracks.push(seg); }
  for (let i = 0; i < O.n; i++) {
    if (O.burst === 'star') parts.push(spark(S, O.color, { c2: O.core, ang: rnd(-Math.PI, 0) + (i % 3 ? 0 : rnd(0, Math.PI)), v: rnd(140, 420), g: 300, life: rnd(0.55, 1.15), r: rnd(1.6, 3.2) }));
    else if (O.burst === 'puff') parts.push(i % 2 ? spark(S, O.color, { kind: 'smoke', v: rnd(10, 50), g: -30, drag: 2, life: rnd(0.5, 0.9), r: rnd(8, 16), a: 0.3 }) : spark(S, O.color, { ang: rnd(0.2, Math.PI - 0.2), v: rnd(30, 110), g: 500, life: rnd(0.3, 0.6), r: 1.4, a: 0.8 }));
    else if (O.burst === 'fall') parts.push(spark(S, O.color, { c2: O.core, ang: rnd(0.15, Math.PI - 0.15), v: rnd(40, 170), g: 520, dx: rnd(-22, 22), life: rnd(0.5, 0.95), wait: rnd(0, 180), r: rnd(1.4, 2.6) }));
    else if (O.burst === 'shards') parts.push(i % 3 ? spark(S, i % 2 ? O.color : '#5a0d08', { kind: 'shard', v: rnd(140, 420), g: 600, drag: 0.6, life: rnd(0.5, 1.0), r: rnd(3, 7) }) : spark(S, O.color, { c2: O.core, v: rnd(200, 480), g: 200, life: rnd(0.25, 0.5), r: 1.8 }));
    else parts.push(spark(S, O.color, { c2: O.core, ang: rnd(-Math.PI * 0.85, -Math.PI * 0.15), v: rnd(30, 120), g: -60, drag: 1.5, dx: rnd(-40, 40), dy: rnd(-10, 30), life: rnd(0.6, 1.0), r: rnd(1.4, 2.4), wait: rnd(0, 250) }));
  }
  fix(parts);
  run(S, O.ms, parts, t => {
    const k = Math.min(1, t / O.ms), e = 1 - (1 - k) * (1 - k);
    if (O.burst === 'star') { // altın ışınlar ve parlama
      glowAt(x, S.ox, S.oy, 50 + e * 90, O.core, (1 - k) * 0.95);
      x.save(); x.translate(S.ox, S.oy); x.rotate(k * 0.9); x.globalAlpha = (1 - k) * 0.7; x.fillStyle = O.color;
      for (let i = 0; i < 10; i++) { x.rotate(0.6283); x.beginPath(); x.moveTo(0, 0); x.lineTo(-7, -(40 + e * 120)); x.lineTo(7, -(40 + e * 120)); x.closePath(); x.fill(); }
      x.restore();
    } else if (O.burst === 'shards') { // kızıl parlama ve çatlaklar
      glowAt(x, S.ox, S.oy, 40 + e * 70, O.color, (1 - k) * 0.7);
      x.strokeStyle = '#4a0a06'; x.lineWidth = 2.4; x.lineJoin = 'bevel'; x.globalAlpha = Math.min(1, (1 - k) * 2);
      const upto = Math.min(5, Math.ceil(k * 18));
      for (const seg of cracks) { x.beginPath(); x.moveTo(S.ox, S.oy); for (let i = 0; i < upto; i++) x.lineTo(seg[i][0], seg[i][1]); x.stroke(); }
    } else if (O.burst === 'fall') { // turuncu sönme ve aşağı inen oklar
      glowAt(x, S.ox, S.oy, 44, O.color, (1 - k) * 0.6);
      x.strokeStyle = O.color; x.lineWidth = 3.5; x.lineCap = 'round'; x.lineJoin = 'round';
      for (let i = 0; i < 2; i++) { const y = S.oy + 20 + e * 34 + i * 13; x.globalAlpha = (1 - k) * (1 - i * 0.4); x.beginPath(); x.moveTo(S.ox - 11, y); x.lineTo(S.ox, y + 9); x.lineTo(S.ox + 11, y); x.stroke(); }
    } else if (O.burst === 'ward') { // koruma halkaları: dönen iki yay
      glowAt(x, S.ox, S.oy, 46 + e * 30, O.core, (1 - k) * 0.7);
      x.strokeStyle = O.color; x.lineWidth = 3.5; x.lineCap = 'round';
      for (let i = 0; i < 2; i++) { const r = 30 + i * 9 + e * 6, a0 = k * (i ? -5 : 5); x.globalAlpha = (1 - k) * (i ? 0.6 : 0.95); for (let j = 0; j < 3; j++) { x.beginPath(); x.arc(S.ox, S.oy, r, a0 + j * 2.094, a0 + j * 2.094 + 1.5); x.stroke(); } }
    } else glowAt(x, S.ox, S.oy, 40, O.color, (1 - k) * 0.3);
    if (O.ring) { x.strokeStyle = O.color; x.lineWidth = 3.5 * (1 - k) + 0.8; x.globalAlpha = (1 - k) * 0.9; x.beginPath(); x.arc(S.ox, S.oy, 16 + e * 110, 0, 6.283); x.stroke(); }
    x.globalAlpha = 1;
  });
}
// ACT.upgrade'i sar: özgün işlev basmayı başlattıysa panel "forging" sınıfını alır (gerilim), bitince sonuç sınıfını (o-…)
const upgrade = ACT.upgrade;
if (upgrade) ACT.upgrade = async d => {
  const p = upgrade(d), anv = $('#anv'), started = !!anv?.classList.contains('forging') && !anv.querySelector('.anvfx');
  if (started) forgeFx(anv);
  await p;
  if (!started) return;
  const now = $('#anv'), out = now && [...now.classList].find(c => c.startsWith('o-'))?.slice(2);
  if (out) resultFx(now, out);
};
// Deneme kısa yolu (ekran görüntüsü betikleri beş sonucu da gösterebilsin; kural içermez, kaynak harcamaz)
window.DD_ANVIL = { forge: () => { const a = $('#anv'); if (a) forgeFx(a); }, result: out => { const a = $('#anv'); if (a) resultFx(a, out); } };
