// Oyun Denetçisi: kare hızı (FPS), kare süresi, bellek ve çizim yükü. Ayarlar → Grafik → "Oyun Denetçisi" ya da ?denetci=1.
// Köşede küçük bir panel açar; "Ölçüm al" 30 saniye kayıt yapıp özet çıkarır (ortalama/en düşük %1 FPS, p95 kare süresi,
// en yüksek JS belleği, tahmini ekran kartı belleği). Özet panoya kopyalanabilir. Kural içermez, sunucuya bir şey göndermez.
import { ACT, toast } from './ui-core.js';

const D = { on: false, el: null, frames: [], last: 0, raf: 0, rec: null, peakHeap: 0 };
const heap = () => (performance.memory ? performance.memory.usedJSHeapSize / 1048576 : null); // yalnızca Chromium tabanlı tarayıcılar
const gpu = () => { try { return window.DD_GFX?.stats(); } catch { return null; } };
const r1 = v => Math.round(v * 10) / 10;

function summarize(ms) {
  if (!ms.length) return null;
  const s = [...ms].sort((a, b) => a - b), avg = ms.reduce((a, b) => a + b, 0) / ms.length;
  const p = q => s[Math.min(s.length - 1, Math.floor(q * s.length))];
  const low1 = s.slice(Math.floor(s.length * 0.99)); const low1ms = low1.reduce((a, b) => a + b, 0) / Math.max(1, low1.length);
  return { fps: r1(1000 / avg), low1: r1(1000 / low1ms), avgMs: r1(avg), p95: r1(p(0.95)), max: r1(s.at(-1)), n: ms.length };
}
function loop(t) {
  if (!D.on) return;
  // ekran yenilemesi değil, oyunun gerçekten çizdiği kareler sayılır (engine3d kare sınırı: ana üs 30, savaş 60)
  const fn = window.DD_GFX?.frameNo?.();
  if (fn === undefined || fn !== D.fn) {
    D.fn = fn;
    if (D.last) { const dt = t - D.last; if (dt < 1000) { D.frames.push(dt); if (D.frames.length > 240) D.frames.shift(); D.rec?.push(dt); } }
    D.last = t;
  }
  const h = heap(); if (h && h > D.peakHeap) D.peakHeap = h;
  D.raf = requestAnimationFrame(loop);
}
function paint() {
  if (!D.on || !D.el) return;
  const s = summarize(D.frames), g = gpu(), h = heap();
  const gpuMB = g ? r1(g.textureMB + g.targetMB + g.bloomMB + g.envMB + g.shadowMB) : null, cap = g?.fpsCap || 60;
  D.el.querySelector('.ddi-b').innerHTML = `
    <div><small>FPS / sınır</small><b class="${s && s.fps < cap * 0.75 ? 'bad' : s && s.fps < cap * 0.9 ? 'mid' : 'ok'}">${s ? s.fps : '–'} / ${cap}</b></div>
    <div><small>%1 düşük</small><b>${s ? s.low1 : '–'}</b></div>
    <div><small>Kare</small><b>${s ? s.avgMs : '–'} ms</b></div>
    <div><small>JS bellek</small><b>${h ? r1(h) + ' MB' : 'ölçülemez'}</b></div>
    <div><small>Ekran kartı ≈</small><b>${gpuMB !== null ? gpuMB + ' MB' : '–'}</b></div>
    <div><small>Çizim</small><b>${g ? g.calls : '–'}</b></div>
    <div><small>Üçgen</small><b>${g ? Math.round(g.triangles / 1000) + 'K' : '–'}</b></div>
    <div><small>Kademe</small><b>${g ? g.tier : '–'}</b></div>`;
  const rb = D.el.querySelector('.ddi-rec');
  if (D.rec) rb.textContent = `Ölçülüyor… ${Math.max(0, Math.ceil((D.recEnd - performance.now()) / 1000))} sn`;
}
function open() {
  if (D.on) return;
  D.on = true; D.frames = []; D.last = 0; D.peakHeap = heap() || 0;
  D.el = document.createElement('div'); D.el.className = 'ddi';
  D.el.innerHTML = `<header><b>Oyun Denetçisi</b><button class="ddi-x" aria-label="Kapat">✕</button></header><div class="ddi-b"></div><div class="ddi-f"><button class="ddi-rec">Ölçüm al (30 sn)</button></div><pre class="ddi-out" hidden></pre>`;
  document.body.appendChild(D.el);
  D.el.querySelector('.ddi-x').onclick = close;
  D.el.querySelector('.ddi-rec').onclick = record;
  D.raf = requestAnimationFrame(loop); D.tick = setInterval(paint, 500);
}
function close() { D.on = false; cancelAnimationFrame(D.raf); clearInterval(D.tick); D.el?.remove(); D.el = null; D.rec = null; }
// Ölçüm: 30 sn boyunca her kare kaydedilir; sonuçta özet panelde ve panoda olur. window.DD_DENETCI.report son özeti verir.
function record() {
  if (D.rec) return;
  D.rec = []; D.peakHeap = heap() || 0; D.recEnd = performance.now() + 30000;
  setTimeout(() => {
    const s = summarize(D.rec || []), g = gpu(), ua = navigator.userAgent.replace(/\s+/g, ' ');
    D.rec = null;
    const rep = s ? { tarih: new Date().toISOString(), kademe: g?.tier, kareSiniri: g?.fpsCap, ekran: g ? `${g.buffer[0]}×${g.buffer[1]} (dpr ${g.dpr})` : null, fps: s.fps, dusuk1: s.low1, kareMs: s.avgMs, p95Ms: s.p95, enUzunMs: s.max, kare: s.n,
      jsBellekMB: heap() ? r1(heap()) : null, jsBellekTepeMB: D.peakHeap ? r1(D.peakHeap) : null, cihazBellekGB: navigator.deviceMemory ?? null, cekirdek: navigator.hardwareConcurrency ?? null,
      gpuTahminiMB: g ? r1(g.textureMB + g.targetMB + g.bloomMB + g.envMB + g.shadowMB) : null, dokuMB: g?.textureMB, cizim: g?.calls, ucgen: g?.triangles, golge: g?.shadowMap, tarayici: ua } : null;
    window.DD_DENETCI.report = rep;
    if (!D.el) return;
    D.el.querySelector('.ddi-rec').textContent = 'Yeniden ölç (30 sn)';
    const out = D.el.querySelector('.ddi-out'); out.hidden = false; out.textContent = rep ? JSON.stringify(rep, null, 1) : 'Kare kaydedilemedi.';
    try { navigator.clipboard?.writeText(out.textContent); toast('Ölçüm özeti panoya kopyalandı.'); } catch { }
  }, 30000);
}
window.DD_DENETCI = { open, close, record, report: null, summarize };
ACT.denetci = () => (D.on ? close() : open());
try { if (new URLSearchParams(location.search).get('denetci') === '1') setTimeout(open, 1500); } catch { }
