// Sayfa içinde çalışan arayüz ölçümü (page.evaluate(DENETCI)). Kırpan/kaydıran atalar hesaba katılır: yalnız GÖRÜNEN alandaki
// çakışma ve taşma sayılır; kaydırılabilir kaptaki ekran dışı öğe "kaydırılabilir" diye ayrı tutulur (kusur sayılmaz).
// Dokunma hedefi: öğenin kendisi + konumlu ::after/::before genişletmesi (negatif inset) → etkin alan.
module.exports = `(() => {
  const vis = e => { if (!e || !e.getClientRects().length) return false; const s = getComputedStyle(e); return s.visibility !== 'hidden' && s.display !== 'none' && +s.opacity > 0.05; };
  const ad = e => (e.id ? '#' + e.id : e.tagName.toLowerCase()) + (typeof e.className === 'string' && e.className.trim() ? '.' + e.className.trim().split(/\\s+/).slice(0, 2).join('.') : '');
  const kes = (a, b) => ({ l: Math.max(a.l, b.l), t: Math.max(a.t, b.t), r: Math.min(a.r, b.r), b: Math.min(a.b, b.b) });
  const R = e => { const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom }; };
  const alan = x => Math.max(0, x.r - x.l) * Math.max(0, x.b - x.t);
  const VW = innerWidth, VH = innerHeight;
  // görünür dikdörtgen: kırpan atalarla kesişim; kaydırılabilir ata varsa işaretle
  const gorunur = e => { let v = R(e), kay = false; for (let a = e.parentElement; a && a !== document.documentElement; a = a.parentElement) { const s = getComputedStyle(a); if (s.overflowX !== 'visible' || s.overflowY !== 'visible') { v = kes(v, R(a)); if (/(auto|scroll)/.test(s.overflowX + s.overflowY) && (a.scrollWidth > a.clientWidth + 1 || a.scrollHeight > a.clientHeight + 1)) kay = true; } } return { v: kes(v, { l: 0, t: 0, r: VW, b: VH }), kay }; };
  const etkin = e => { const r = R(e); let x = { ...r }; for (const ps of ['::after', '::before']) { const s = getComputedStyle(e, ps); if (s.content === 'none' || s.position !== 'absolute') continue; const px = k => parseFloat(s[k]); const t = px('top'), l = px('left'), rr = px('right'), bb = px('bottom'); if ([t, l, rr, bb].every(n => !isNaN(n))) x = { l: Math.min(x.l, r.l + l), t: Math.min(x.t, r.t + t), r: Math.max(x.r, r.r - rr), b: Math.max(x.b, r.b - bb) }; } return x; };
  const katman = [...document.querySelectorAll('#p28bina, #modal:not([hidden]) .box, #win:not([hidden]) .frame, #battleUI:not([hidden])')].filter(vis);
  const kok = katman.length ? katman : [document.querySelector('#hud'), document.querySelector('#chatbar')].filter(vis);
  const o = { kesik: [], tasma: [], kucuk44: [], kucuk28: [], cakisma: [], kucukYazi: [], kaydirilabilir: 0, renk: [] };
  const txt = e => [...e.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim();
  for (const K of kok) {
    const els = [...K.querySelectorAll('*')].filter(vis);
    for (const e of els) {
      const s = getComputedStyle(e), t = txt(e), G = gorunur(e);
      if (alan(G.v) < 4) { if (G.kay) o.kaydirilabilir++; continue; }
      if (t && t.length > 1) {
        const yatayKes = e.scrollWidth > e.clientWidth + 2 && s.overflowX !== 'visible' && !/(auto|scroll)/.test(s.overflowX);
        const dikeyKes = s.webkitLineClamp !== 'none' && +s.webkitLineClamp > 0 ? false : e.scrollHeight > e.clientHeight + 3 && s.overflowY === 'hidden' && e.clientHeight > 0;
        if (yatayKes || dikeyKes || (s.textOverflow === 'ellipsis' && e.scrollWidth > e.clientWidth + 1)) o.kesik.push(ad(e) + ' «' + t.slice(0, 30) + '»');
        const r = R(e); if (!G.kay && (r.r > G.v.r + 3 || r.l < G.v.l - 3) && alan(G.v) < alan(r) * 0.9) o.tasma.push(ad(e) + ' «' + t.slice(0, 30) + '»');
        const fs = parseFloat(s.fontSize); if (fs < 10.5) { o.kucukYazi.push(ad(e) + ' ' + fs + 'px «' + t.slice(0, 24) + '»'); const yol = [e, e.parentElement, e.parentElement?.parentElement].filter(Boolean).map(x => x.tagName.toLowerCase() + (typeof x.className === 'string' && x.className.trim() ? '.' + x.className.trim().split(/\s+/).filter(c => !/^(on|sel|cur|active|open|ready|locked|hot)$/.test(c)).slice(0, 2).join('.') : '')).reverse().join(' > '); (o.kucukYol ||= []).push(yol + ' @' + fs); }
        if (o.renk.length < 400 && !(s.backgroundClip === 'text')) { const m = s.color.match(/[\\d.]+/g).map(Number); if (!(m[3] !== undefined && m[3] < .5)) o.renk.push({ t: t.slice(0, 30), a: ad(e), r: [G.v.l, G.v.t, G.v.r - G.v.l, G.v.b - G.v.t].map(Math.round), c: m.slice(0, 3), fs, fw: +s.fontWeight || 400 }); }
      }
      if ((e.tagName === 'BUTTON' || e.dataset.a) && !e.disabled && !e.closest('.blabel')) { const x = etkin(e), w = x.r - x.l, h = x.b - x.t; const etiket = ad(e) + ' ' + Math.round(w) + 'x' + Math.round(h) + ' «' + e.textContent.trim().slice(0, 16) + '»'; if (w < 28 || h < 28) o.kucuk28.push(etiket); else if (w < 44 || h < 44) o.kucuk44.push(etiket); }
    }
    const btn = els.filter(e => (e.tagName === 'BUTTON' || e.dataset.a) && !e.disabled);
    const gv = btn.map(e => gorunur(e).v);
    for (let i = 0; i < btn.length; i++) for (let j = i + 1; j < btn.length; j++) {
      const A = btn[i], B = btn[j]; if (A.contains(B) || B.contains(A)) continue; if (A.dataset.a && A.dataset.a === B.dataset.a && JSON.stringify(A.dataset) === JSON.stringify(B.dataset)) continue; // aynı eylem: çakışma değil
      const x = kes(gv[i], gv[j]), ar = alan(x);
      if (ar > 16 && ar > 0.2 * Math.min(alan(gv[i]), alan(gv[j]))) {
        // üstteki gerçekten öndeki mi: ortadaki nokta hangi öğeye düşüyor
        const cx = (x.l + x.r) / 2, cy = (x.t + x.b) / 2, en = document.elementFromPoint(cx, cy);
        if (en && (A.contains(en) || B.contains(en))) o.cakisma.push(ad(A) + ' ⨯ ' + ad(B));
      }
    }
  }
  for (const k of ['kesik', 'tasma', 'kucuk44', 'kucuk28', 'cakisma', 'kucukYazi']) o[k] = [...new Set(o[k])].slice(0, 15); o.kucukYol = [...new Set(o.kucukYol || [])].slice(0, 60);
  const w = document.querySelector('#win:not([hidden]) h2'), m = document.querySelector('#modal:not([hidden]) h2'), b = document.querySelector('#p28bina .kb-h');
  o.baslik = (b || w || m)?.textContent.trim() || null;
  return o;
})()`;
