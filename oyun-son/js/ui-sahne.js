// Bina sahneleri (özgün SVG/CSS çizimleri, kural içermez):
//  mineScene(dolu, ırk): elinde kazmayla mavi kristalli kayaya vuran savaşçı, sıçrayan kırıntı ve büyüyen cevher yığını
//  wheelHtml(pool, aci): ağırlığına göre dilimlenmiş Kader Çarkı · spinTo(i): çarkı sunucunun seçtiği dilime döndürür
// Stiller css/v8.css (.mn-*, .wh-*).

// Maden: yarı çıplak bir savaşçı açık ocakta kazmayı iki eliyle başının üstüne kaldırır, gövdesini öne vererek yere
// indirir; vuruşta toprak ve taş parçaları sıçrar, toz kalkar, çukurda cevher parlar. Yanındaki cevher yığını depoyla büyür.
// Görünüm kutusunun üstünde 40 birim pay var: kazma başın üstüne kalkınca kesilmez; arka plan yanlara taşar (svg overflow
// görünür, .mn-stage keser), geniş ekranda yanlarda boş şerit kalmaz.
// faction: ten ve kuşak rengi (Kragmir yeşilimsi ten, kızıl kuşak · Elentha buğday ten, mavi kuşak). Stiller css/v9.css (.mz2-*).
// 23 Kas (C7, G5): boyalı maden resmi yüklendiyse (html.sahneli) SVG sahne gizlenir; ortadaki boşlukta oyuncunun kendi 2B
// karakteri (karakter-png.js tam boy) durur. Resim yokken eski SVG madenci oynar.
import { sprUrl } from './karakter-png.js';
import { S } from './api.js';
const mineHero = () => { const c = S?.char; if (!c) return ''; const u = sprUrl(c.race || S.faction, c.cls, c.gender); return u ? `<img class="mn-hero" src="${u}" alt="" draggable="false">` : ''; };
export function mineScene(fill = 0, faction = 'ocak') {
  const ork = faction === 'ocak', skin = ork ? '#7f9258' : '#d29a6c', skinD = ork ? '#5a6a3c' : '#a8744c', sash = ork ? '#a3261a' : '#2f62b8';
  const n = Math.round(Math.max(0, Math.min(1, fill)) * 9);
  const pile = Array.from({ length: 9 }, (_, k) => { const row = k < 4 ? 0 : k < 7 ? 1 : 2, col = k < 4 ? k : k < 7 ? k - 4 : k - 7; return `<circle cx="${68 + col * 13 + row * 6.5}" cy="${112 - row * 9}" r="7" class="${k < n ? '' : 'off'}"/>`; }).join('');
  const chunks = [[0, -34, -30], [1, 26, -40], [2, -12, -48], [3, 38, -22], [4, -40, -14], [5, 14, -56]].map(([k, dx, dy]) => `<path class="c${k}" style="--dx:${dx}px;--dy:${dy}px" d="M276 110 l5 -4 4 3 -2 5 -6 1z"/>`).join('');
  return `<div class="mn-stage mz2" aria-hidden="true">${mineHero()}<svg viewBox="0 -40 400 200" preserveAspectRatio="xMidYMax meet" style="overflow:visible">
    <defs><linearGradient id="m2sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#140c08"/><stop offset=".55" stop-color="#2a1a10"/><stop offset="1" stop-color="#3a2416"/></linearGradient>
      <linearGradient id="m2soil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5e4026"/><stop offset="1" stop-color="#1e140b"/></linearGradient>
      <linearGradient id="m2wood" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3a2212"/><stop offset=".5" stop-color="#6e4624"/><stop offset="1" stop-color="#2e1a0c"/></linearGradient>
      <linearGradient id="m2ray" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd27a" stop-opacity=".32"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></linearGradient>
      <radialGradient id="m2vig" cx=".5" cy=".55" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".72"/></radialGradient>
      <radialGradient id="m2vein" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#8fe0ff" stop-opacity=".75"/><stop offset="1" stop-color="#2a7cff" stop-opacity="0"/></radialGradient>
      <radialGradient id="m2cry" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#7fd0ff" stop-opacity=".7"/><stop offset="1" stop-color="#3a8cff" stop-opacity="0"/></radialGradient><radialGradient id="m2glow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffd27a" stop-opacity=".85"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient></defs>
    <rect x="-400" y="-40" width="1200" height="200" fill="url(#m2sky)"/>
    <!-- mağara arka duvarı: katmanlı kaya, damar kristalleri -->
    <path d="M-400 -40 H800 V20 L760 8 L700 26 L640 4 L580 22 L520 0 L470 18 L420 -4 L370 14 L330 -8 L280 10 L230 -10 L180 12 L130 -6 L80 16 L30 -4 L-20 18 L-80 2 L-140 20 L-200 0 L-260 22 L-330 4 L-400 20Z" fill="#0d0805"/>
    <g fill="#0d0805"><path d="M40 -6 L46 22 L52 -4Z"/><path d="M118 -4 L122 14 L127 -4Z"/><path d="M196 10 L201 34 L206 10Z"/><path d="M262 6 L266 22 L270 6Z"/><path d="M344 10 L350 36 L356 8Z"/><path d="M-60 6 L-54 30 L-48 6Z"/><path d="M470 16 L476 40 L482 16Z"/></g>
    <path d="M-400 66 L-330 46 L-250 62 L-170 40 L-90 58 L-40 44 L0 64 L40 48 L80 60 L130 36 L170 54 L230 32 L290 56 L340 40 L400 58 L460 42 L540 60 L620 38 L700 54 L800 46 V160 H-400Z" fill="#22160e"/>
    <g class="mz2-veins"><circle cx="58" cy="54" r="14" fill="url(#m2vein)"/><path d="M54 58 l4 -12 4 12z M60 60 l3 -8 3 8z" fill="#5ab8ff" stroke="#123060" stroke-width=".8"/>
      <circle cx="150" cy="44" r="11" fill="url(#m2vein)"/><path d="M147 48 l3 -10 3 10z" fill="#7cc8ff" stroke="#123060" stroke-width=".8"/>
      <circle cx="372" cy="50" r="12" fill="url(#m2vein)"/><path d="M368 54 l4 -11 4 11z M375 55 l2 -6 3 6z" fill="#4aa8ff" stroke="#123060" stroke-width=".8"/>
      <circle cx="-40" cy="52" r="10" fill="url(#m2vein)"/><path d="M-43 56 l3 -9 3 9z" fill="#6ac0ff" stroke="#123060" stroke-width=".8"/></g>
    <path d="M-400 92 L-200 84 L0 94 L60 84 L120 90 L200 82 L300 88 L400 84 L600 90 L800 86 V160 H-400Z" fill="#33231a"/>
    <!-- ahşap destek iskeleleri (ocak ağzı) -->
    <g class="mz2-beams"><g transform="translate(-2 0)"><rect x="18" y="8" width="11" height="126" fill="url(#m2wood)" stroke="#120a05" stroke-width="2"/><rect x="146" y="8" width="11" height="126" fill="url(#m2wood)" stroke="#120a05" stroke-width="2"/>
      <rect x="10" y="2" width="156" height="12" fill="url(#m2wood)" stroke="#120a05" stroke-width="2"/><path d="M29 14 L48 30 M146 14 L127 30" stroke="#4a2c14" stroke-width="5"/>
      <circle cx="24" cy="8" r="1.6" fill="#aaa"/><circle cx="152" cy="8" r="1.6" fill="#aaa"/></g>
      <g opacity=".55" transform="translate(424 22) scale(.7)"><rect x="0" y="0" width="11" height="160" fill="url(#m2wood)"/><rect x="120" y="0" width="11" height="160" fill="url(#m2wood)"/><rect x="-8" y="-6" width="148" height="12" fill="url(#m2wood)"/></g></g>
    <!-- asılı fener ve ışık huzmesi -->
    <g class="mz2-lamp"><path d="M88 14 V26" stroke="#2a1a0e" stroke-width="1.5"/><path d="M82 26 h12 l-2 12 h-8z" fill="#3a2614" stroke="#120a05" stroke-width="1.5"/><rect x="84.5" y="28" width="7" height="8" fill="#ffcf6a"/>
      <path d="M88 36 L40 134 H140Z" fill="url(#m2ray)"/><circle class="fl" cx="88" cy="32" r="22" fill="url(#m2glow)"/></g>
    <rect x="-400" y="132" width="1200" height="28" fill="url(#m2soil)"/>
    <!-- ray ve traversler -->
    <g class="mz2-rail"><g fill="#3a2414" stroke="#160d06" stroke-width="1">${Array.from({ length: 22 }, (_, k) => `<rect x="${-60 + k * 22}" y="139" width="14" height="5" rx="1"/>`).join('')}</g>
      <path d="M-400 140 H800" stroke="#6a6a72" stroke-width="2.2"/><path d="M-400 146 H800" stroke="#4a4a52" stroke-width="2"/></g>
    <!-- maden arabası: cevher yığını bunun içinde birikir -->
    <g class="mz2-cart"><path d="M48 112 L136 112 L128 136 L56 136Z" fill="#4a3424" stroke="#120a05" stroke-width="2.5" stroke-linejoin="round"/><path d="M52 118 H132 M56 128 H128" stroke="#2a1a10" stroke-width="2"/>
      <path d="M48 112 H136" stroke="#8a8a92" stroke-width="3"/><circle cx="72" cy="139" r="6" fill="#2a2a30" stroke="#0a0a0c" stroke-width="2"/><circle cx="112" cy="139" r="6" fill="#2a2a30" stroke="#0a0a0c" stroke-width="2"/><circle cx="72" cy="139" r="2" fill="#8a8a92"/><circle cx="112" cy="139" r="2" fill="#8a8a92"/></g>
    <g class="mz2-pebbles" fill="#24180f"><ellipse cx="172" cy="150" rx="5" ry="2"/><ellipse cx="236" cy="154" rx="4" ry="1.6"/><ellipse cx="318" cy="151" rx="6" ry="2"/><ellipse cx="20" cy="155" rx="5" ry="1.8"/><ellipse cx="384" cy="153" rx="4" ry="1.6"/></g>
    <g class="mz2-motes"><circle cx="70" cy="70" r="1"/><circle cx="110" cy="96" r=".8"/><circle cx="96" cy="58" r="1.2"/><circle cx="60" cy="104" r=".9"/><circle cx="124" cy="80" r="1"/><circle cx="300" cy="60" r=".8"/></g>
    <g class="mz2-rock"><path d="M262 134 L264 104 L274 80 L296 66 L322 72 L338 96 L340 134Z" fill="#6b6460" stroke="#1a110a" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M274 80 L296 66 L322 72 L308 92 L284 96Z" fill="#8a837d"/><path d="M308 92 L322 72 L338 96 L340 134 L318 134Z" fill="#4d4743"/><path d="M264 104 L284 96 L290 134 L262 134Z" fill="#5a534f"/>
      <path d="M284 96 L308 92 L318 134 L290 134Z M280 110 l12 8 M326 104 l-10 14" fill="#5d5652" stroke="#2a211b" stroke-width="1.3"/></g>
    <g class="mz2-cry"><g class="k1"><path d="M290 100 L296 74 L303 98 L297 108Z" fill="#4aa8ff" stroke="#14336b" stroke-width="1.5" stroke-linejoin="round"/><path d="M296 74 L303 98 L297 108Z" fill="#1f5fd0"/><path d="M296 78 l-3 18" stroke="#d6f0ff" stroke-width="1.5" stroke-linecap="round"/></g>
      <g class="k2"><path d="M303 100 L316 82 L322 104 L312 112Z" fill="#7cc8ff" stroke="#14336b" stroke-width="1.5" stroke-linejoin="round"/><path d="M316 82 L322 104 L312 112Z" fill="#2b72e0"/><path d="M315 87 l-4 14" stroke="#e8f8ff" stroke-width="1.4" stroke-linecap="round"/></g>
      <g class="k3"><path d="M272 112 L280 96 L287 114 L280 120Z" fill="#2f86f0" stroke="#14336b" stroke-width="1.5" stroke-linejoin="round"/><path d="M280 96 L287 114 L280 120Z" fill="#17489c"/><path d="M279 100 l-2 10" stroke="#cfeaff" stroke-width="1.3" stroke-linecap="round"/></g>
      <g class="k4"><path d="M322 116 L330 98 L337 118 L329 124Z" fill="#5db6ff" stroke="#14336b" stroke-width="1.5" stroke-linejoin="round"/><path d="M330 98 L337 118 L329 124Z" fill="#1d58c4"/></g>
      <g class="k5"><path d="M306 120 L311 108 L317 122Z" fill="#8bd2ff" stroke="#14336b" stroke-width="1.3" stroke-linejoin="round"/></g>
      <circle class="halo" cx="305" cy="98" r="34" fill="url(#m2cry)"/></g>
    <g class="mz2-shards"><path class="s0" style="--dx:-18px;--dy:-30px" d="M276 110 l3 -6 3 5 -3 4z"/><path class="s1" style="--dx:14px;--dy:-44px" d="M280 108 l3 -6 3 5 -3 4z"/><path class="s2" style="--dx:-30px;--dy:-10px" d="M274 114 l3 -5 3 4 -3 4z"/><path class="s3" style="--dx:30px;--dy:-26px" d="M282 112 l3 -5 3 4 -3 4z"/></g>
    <g class="mz2-torch"><path d="M352 132 V92" stroke="#4a2e18" stroke-width="5"/><path d="M346 92 Q352 74 358 92Z" fill="#ffb347"/><circle cx="352" cy="88" r="40" fill="url(#m2glow)"/></g>
    <g class="mz2-pile">${pile}</g><path d="M48 112 H136" stroke="#8a8a92" stroke-width="3"/>
    <g class="mz2-dust"><ellipse cx="270" cy="132" rx="20" ry="7"/><ellipse cx="262" cy="126" rx="12" ry="5"/><ellipse cx="284" cy="130" rx="12" ry="5"/></g>
    <g class="mz2-chunks">${chunks}</g>
    <g class="mz2-spark"><circle cx="276" cy="110" r="2.6"/><circle cx="270" cy="104" r="1.8"/><circle cx="281" cy="103" r="1.6"/></g>
    <ellipse cx="200" cy="134" rx="34" ry="5" fill="#0007"/>
    <g class="mz2-man">
      <path d="M194 100 L182 130 M206 100 L218 130" stroke="#1a0f06" stroke-width="13" stroke-linecap="round"/><path d="M194 100 L182 130 M206 100 L218 130" stroke="#7a5a3a" stroke-width="9" stroke-linecap="round"/><path d="M180 124 l4 6 M220 124 l-4 6" stroke="#4a3020" stroke-width="7" stroke-linecap="round"/>
      <path d="M176 132 h12 M212 132 h13" stroke="#1a110a" stroke-width="5" stroke-linecap="round"/>
      <g class="mz2-body">
        <path d="M188 101 L184 62 Q200 54 216 62 L212 101Z" fill="${skin}" stroke="#1a0f06" stroke-width="2"/>
        <path d="M200 66 V96 M190 74 Q200 79 210 74 M191 85 Q200 88 209 85" stroke="${skinD}" stroke-width="1.6" fill="none"/>
        <path d="M186 96 H214 V104 H186Z" fill="${sash}" stroke="#1a0f06" stroke-width="2"/><path d="M208 104 l5 12 -6 -1z" fill="${sash}"/>
        <g class="mz2-pick">
          <path d="M204 62 L222 75" stroke="${skin}" stroke-width="8" stroke-linecap="round"/><path d="M198 66 L232 84" stroke="${skinD}" stroke-width="7" stroke-linecap="round"/>
          <path d="M217 72 l5 3 M227 79 l5 3" stroke="#3a2414" stroke-width="5" stroke-linecap="round"/>
          <path d="M214 70 L274 111" stroke="#2a1608" stroke-width="8" stroke-linecap="round"/><path d="M214 70 L274 111" stroke="#9a6a3a" stroke-width="5.5" stroke-linecap="round"/><path d="M220 72 L268 105" stroke="#c89658" stroke-width="1.5" stroke-linecap="round"/>
          <path d="M262 98 l6 4" stroke="#3a2414" stroke-width="7.5" stroke-linecap="round"/>
          <path d="M262 126 Q286 126 285 98" stroke="#14181c" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M262 126 Q286 126 285 98" stroke="#aab4be" stroke-width="6.5" fill="none" stroke-linecap="round"/><path d="M265 123 Q282 122 282 102" stroke="#eef3f7" stroke-width="1.8" fill="none" stroke-linecap="round"/>
        </g>
        <circle cx="203" cy="47" r="10" fill="${skin}" stroke="#1a0f06" stroke-width="2"/>
        <path d="M193 44 Q197 34 208 37 Q205 31 198 33" fill="#1e140c" stroke="#1a0f06" stroke-width="1.5"/>
        ${ork ? '<path d="M209 52 l3 -4 1 5z" fill="#efe6c8"/>' : '<path d="M209 47 h3" stroke="#1a0f06" stroke-width="1.6"/>'}
      </g>
    </g>
    <rect x="-400" y="-40" width="1200" height="200" fill="url(#m2vig)" pointer-events="none"/>
  </svg></div>`;
}

const WH_COL = ['#8a5a2a', '#5a3a7a', '#2f6a4a', '#7a2a2a', '#2a4a7a', '#9a7a1a'];
let angle = 0;
export function wheelHtml(pool) {
  const tot = pool.reduce((a, x) => a + x.w, 0); let a0 = 0;
  const seg = pool.map((x, i) => {
    const a1 = a0 + 360 * x.w / tot, mid = (a0 + a1) / 2, r = 92, rad = d => (d - 90) * Math.PI / 180;
    const p = (d, rr) => `${100 + rr * Math.cos(rad(d))},${100 + rr * Math.sin(rad(d))}`;
    const big = a1 - a0 > 180 ? 1 : 0, path = `M100,100 L${p(a0, r)} A${r},${r} 0 ${big} 1 ${p(a1, r)}Z`;
    const label = x.name.length > 14 ? x.name.split(' ').slice(-2).join(' ') : x.name;
    const out = `<path d="${path}" fill="${WH_COL[i % WH_COL.length]}" stroke="#1a0f06" stroke-width="2"/><text x="${p(mid, 60).split(',')[0]}" y="${p(mid, 60).split(',')[1]}" transform="rotate(${mid} ${p(mid, 60).replace(',', ' ')})" text-anchor="middle" dominant-baseline="middle">${label}</text>`;
    a0 = a1; return out;
  }).join('');
  const pegs = Array.from({ length: 24 }, (_, i) => { const d = i * 15 * Math.PI / 180; return `<circle cx="${100 + 96 * Math.cos(d)}" cy="${100 + 96 * Math.sin(d)}" r="2.6"/>`; }).join('');
  return `<div class="wh-wrap"><div class="wh-ptr"></div><svg class="wh" viewBox="0 0 200 200" style="transform:rotate(${angle}deg)"><circle cx="100" cy="100" r="99" fill="#2a1a10" stroke="#e7c75a" stroke-width="3"/>${seg}<g class="wh-peg" fill="#e7c75a">${pegs}</g><circle cx="100" cy="100" r="18" fill="#3a2414" stroke="#e7c75a" stroke-width="3"/></svg></div>`;
}
// Çarkı i. dilimin ortası işaretçinin (üst) altına gelecek şekilde döndür; Promise çark durunca çözülür
export function spinTo(pool, i, ms = 3200) {
  const el = document.querySelector('.wh-wrap .wh'); if (!el) return Promise.resolve();
  const tot = pool.reduce((a, x) => a + x.w, 0); let a0 = 0; for (let j = 0; j < i; j++) a0 += 360 * pool[j].w / tot;
  const mid = a0 + 180 * pool[i].w / tot, jitter = (Math.random() - 0.5) * 360 * pool[i].w / tot * 0.6;
  const target = angle - (angle % 360) + 360 * 5 + (360 - mid - jitter);
  el.style.transition = `transform ${ms}ms cubic-bezier(.12,.6,.1,1)`;
  requestAnimationFrame(() => { el.style.transform = `rotate(${target}deg)`; });
  angle = target;
  return new Promise(res => setTimeout(res, ms + 80));
}
