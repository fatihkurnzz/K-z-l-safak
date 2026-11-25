// P30 — İç mekân katmanı (şartname docs/referans/p30-ic-mekan/TALIMAT.md, interiors.json).
// Han, Ahır, Taht Salonu (Otağ), Karaborsa, Maden, Klan Karargâhı ve Örs açılınca pencerenin arkasına o mekânın boyalı
// sahnesi gelir. NPC'ler görselle tek parçadır: ayrı sprite YOK; NPC'nin üstünde görünmez dokunma alanı paneli geri açar.
// Yalnız görünüş: kural, veri ve sekme mantığına dokunmaz. Görseller düz dosyadır (game/interiors/**), yalnız mekân
// açılınca iner ve tarayıcı önbelleğinde kalır. Efektler hafif CSS ışımalarıdır; düşük grafik / "hareketi azalt"ta durur.
import { ACT, hooks, cur, closeWin } from './ui-core.js';
import { S } from './api.js';

/** Geçiş süresi (ms): giriş/çıkış karartması ve panel gizleme (interiors.json transition_ms). css/p30-icmekan.css ile aynı. */
export const GECIS_MS = 250; // P31: ortak 250 ms (css --p31-gecis)
const KLASOR = { ocak: 'kragmir', sancak: 'elentha' };

// Efekt noktası: [x, y, çap (sahne genişliğinin %'si), tür]. Koordinatlar görselin (1584x672) oranıdır.
// Türler: ates (şömine/ocak), fener (fener/meşale/avize), kor (köz), kristal (soğuk ışıma), isik (pencere huzmesi).
const A = (x, y, r = 16) => [x, y, r, 'ates'], Fn = (x, y, r = 8) => [x, y, r, 'fener'], Ko = (x, y, r = 10) => [x, y, r, 'kor'],
  Kr = (x, y, r = 9) => [x, y, r, 'kristal'], Is = (x, y, r = 22) => [x, y, r, 'isik'];

/** Mekân tablosu. pan: panel genişliği (pencere yüzdesi; interiors.json panel_width_hint), min: panelin en dar hali (px;
 *  tablo/eşya yoğun ekranlar sıkışmasın diye), dosya: halktan bağımsız görsel klasörü, np: NPC dokunma noktası [x, y],
 *  fx: efekt noktaları, arma: klan armasının bindirileceği boş sancaklar [x, y, genişlik %], kv: örs kıvılcımı [x, y]. */
export const MEKAN = {
  han: { ad: 'Han', pan: 46,
    ocak: { np: [0.78, 0.52], fx: [A(0.13, 0.57, 20), Fn(0.26, 0.32), Fn(0.5, 0.3), Fn(0.86, 0.68, 7)] },
    sancak: { np: [0.78, 0.56], fx: [A(0.11, 0.62, 20), Fn(0.35, 0.18, 11), Fn(0.415, 0.33, 7), Fn(0.76, 0.16, 11), Fn(0.79, 0.7, 6)] } },
  ahir: { ad: 'Ahır', pan: 46,
    ocak: { np: [0.76, 0.58], fx: [Fn(0.54, 0.26), Fn(0.67, 0.36, 7), Fn(0.845, 0.36, 7), Fn(0.91, 0.25, 7)] },
    sancak: { np: [0.71, 0.58], fx: [Fn(0.24, 0.13, 9), Fn(0.49, 0.3, 7), Fn(0.565, 0.37, 5)] } },
  taht: { ad: 'Taht Salonu', pan: 60, min: 520,
    ocak: { np: [0.69, 0.55], fx: [A(0.04, 0.64, 18), Fn(0.185, 0.52, 7), Fn(0.335, 0.54, 7)] },
    sancak: { np: [0.74, 0.55], fx: [A(0.61, 0.63, 9), A(0.87, 0.63, 9), Is(0.72, 0.22, 26)] } },
  karaborsa: { ad: 'Karaborsa', pan: 60, min: 520,
    ocak: { np: [0.71, 0.5], fx: [Fn(0.22, 0.19, 7), Fn(0.345, 0.16, 8), Fn(0.575, 0.3, 8), Fn(0.945, 0.2, 9), Ko(0.2, 0.63, 6)] },
    sancak: { np: [0.73, 0.48], fx: [Fn(0.33, 0.15, 9), Fn(0.615, 0.18, 9), Fn(0.3, 0.33, 5), Kr(0.7, 0.5, 5)] } },
  maden: { ad: 'Maden', alt: 52, // compact_bottom: panel altta; madenci, cevher ve vagon katmanı sahnenin üstünde çalışır
    ocak: { fx: [Fn(0.165, 0.31, 9), Ko(0.75, 0.52, 22), Ko(0.29, 0.38, 7), Ko(0.67, 0.44, 7), Ko(0.92, 0.4, 7)] },
    sancak: { fx: [Fn(0.185, 0.28, 8), Fn(0.44, 0.33, 6), Fn(0.925, 0.37, 6), Kr(0.52, 0.36, 9), Kr(0.8, 0.2, 10), Kr(0.36, 0.31, 6), Kr(0.83, 0.55, 8)] } },
  klan: { ad: 'Klan Karargâhı', pan: 70, min: 600,
    ocak: { np: [0.67, 0.62], fx: [Fn(0.145, 0.27, 8), Fn(0.33, 0.36, 6), A(0.42, 0.59, 8), A(0.94, 0.74, 14)], arma: [[0.5, 0.31, 3.4], [0.895, 0.29, 4.2]] },
    sancak: { np: [0.68, 0.6], fx: [A(0.05, 0.67, 18), Fn(0.23, 0.13, 10), Fn(0.73, 0.13, 11), Fn(0.16, 0.42, 5)], arma: [[0.36, 0.3, 3.6], [0.955, 0.25, 3.4]] } },
  ors: { ad: 'Büyük Örs', pan: 76, min: 650, dosya: 'yemin-pazari/ors',
    ortak: { np: [0.5, 0.58], fx: [A(0.23, 0.6, 10), A(0.76, 0.62, 16)], kv: [0.5, 0.5] } },
};

/** Pencere başlığı → mekân türü (aynı mekânın sekmeleri/yan pencereleri tek sahneyi paylaşır). */
const BASLIK = [['Örs', 'ors'], ['Parçala ya da Sat', 'ors'], ['Karaborsa', 'karaborsa'], ['Maden', 'maden'], ['Klan Karargâhı', 'klan'], ['Otağ', 'taht']];
/** Verilen pencere başlığının mekân türü ya da null. */
export const turOf = baslik => BASLIK.find(([b]) => String(baslik || '').startsWith(b))?.[1] || null;

const sakin = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches || /gfx=(min|low)/.test(location.search) || ['min', 'low'].includes(localStorage.getItem('dd_gfx')); } catch { return false; } };
const halk = () => (S.faction === 'sancak' ? 'sancak' : 'ocak');
/** Mekânın o halka ait görsel yolu (sayfa köküne göre). */
export const mekanYol = (tur, h = halk()) => { const M = MEKAN[tur]; if (!M) return ''; const k = { han: 'han', ahir: 'ahir', taht: 'taht-salonu', karaborsa: 'karaborsa', maden: 'maden', klan: 'klan-karargahi' }[tur]; return `interiors/${M.dosya || `${KLASOR[h]}/${k}`}/bg.webp`; };
const yuzde = v => (v * 100).toFixed(1) + '%';

/** İç mekân katmanının HTML'i (kabın içine konur). */
function katmanHtml(tur) {
  const M = MEKAN[tur], V = M.ortak || M[halk()];
  const fx = (V.fx || []).map(([x, y, r, t], i) => `<i class="icm-fx icm-${t}" style="left:${yuzde(x)};top:${yuzde(y)};width:${r}%;animation-delay:-${(i * 0.37).toFixed(2)}s"></i>`).join('');
  const kv = V.kv ? `<span class="icm-kv" style="left:${yuzde(V.kv[0])};top:${yuzde(V.kv[1])}">${Array.from({ length: 6 }, (_, i) => `<i style="--i:${i}"></i>`).join('')}</span>` : '';
  const arma = (V.arma || []).map(([x, y, w]) => `<span class="icm-arma" style="left:${yuzde(x)};top:${yuzde(y)};width:${w}%"></span>`).join('');
  const np = V.np ? `<button class="icm-np" data-a="icmAc" aria-label="${M.ad}: paneli aç" style="left:${yuzde(V.np[0])};top:${yuzde(V.np[1])}"></button>` : '';
  return `<div class="icm-sahne"><img class="icm-bg" src="${mekanYol(tur)}" alt="" decoding="async" draggable="false">${fx}${kv}${arma}${np}</div>
    <div class="icm-on"></div>
    <div class="icm-ust"><button class="icm-btn" data-a="icmAc">Paneli Aç</button><button class="icm-btn icm-cik" data-a="icmCik">Çıkış</button></div>`;
}
/** "Mekânı gör" düğmesi (panel başlığına eklenir). */
export const gozHtml = '<button class="icm-goz" data-a="icmGizle" aria-label="Mekânı gör" title="Mekânı gör"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg></button>';

let acik = null; // { kap, tur, el }
/** Açık iç mekânın türü ya da null. */
export const icmTur = () => (acik && acik.el.isConnected ? acik.tur : null);

/** Kabın (#win ya da #p28bina) içine iç mekân katmanını kurar. once: katmanın önüne konacağı öğe (yoksa en başa). */
export function icmKur(kap, tur, once) {
  if (!MEKAN[tur] || !kap) return null;
  const el = document.createElement('div');
  el.className = `icm icm-${tur}${sakin() ? ' icm-sakin' : ''}`; el.dataset.icm = tur;
  if (MEKAN[tur].alt) el.style.setProperty('--icm-altn0', MEKAN[tur].alt / 100);
  el.innerHTML = katmanHtml(tur);
  kap.insertBefore(el, once || kap.firstChild);
  kap.classList.add('icm-var'); kap.classList.remove('icm-kapali'); kap.dataset.icm = tur;
  acik = { kap, tur, el };
  return el;
}

// ---------- #win pencereleri (Örs, Karaborsa, Maden, Klan Karargâhı, Otağ) ----------
// ui-core.js drawWin pencere kabuğunu her kurduğunda çağırır. Çerçeve ölçüleri satır içi yazılır: eski katmanlardaki
// kurallar çerçeveyi ortalar ve bu dosyaya özel stil sayfası onları ezemez (yeni CSS'te important bildirimi kullanılmaz).
hooks.icmWin = (win, W) => {
  const tur = turOf(W?.title), fr = win.querySelector('.frame');
  win.classList.remove('icm-var', 'icm-kapali'); delete win.dataset.icm;
  if (!tur || !fr || document.documentElement.classList.contains('icm-yok')) return;
  W.keep = true; // çerçeve dışına dokunmak pencereyi kapatmasın: dışarısı artık mekânın kendisi (çıkış ✕ ya da Çıkış düğmesi)
  icmKur(win, tur, fr);
  const M = MEKAN[tur], st = (k, v) => fr.style.setProperty(k, v, 'important');
  if (M.alt) { st('top', 'auto'); st('bottom', 'max(8px, var(--sab, 0px))'); st('height', `calc(${M.alt}% - 12px)`); st('transform', 'translate(-50%, 0)'); }
  else { const w = `max(${M.pan}%, min(${M.min || 0}px, 100% - 16px))`; st('left', 'max(8px, var(--sal, 0px))'); st('width', w); st('max-width', w); st('transform', 'translate(0, -50%)'); }
  fr.querySelector('header .x:not(.bk)')?.insertAdjacentHTML('beforebegin', gozHtml);
};
/** Pencere kapanırken (ui-core.js closeWin): mekân sahnesi GECIS_MS içinde solarak haritaya döner. */
hooks.icmWinKapat = win => { if (acik?.kap === win) solarakCik(); };

/** Kapanan katmanın görselini #game üstünde kısa süre soldurur (haritaya yumuşak dönüş). */
function solarakCik() {
  const bg = acik?.el?.querySelector('.icm-bg'); acik = null;
  if (!bg || sakin()) return;
  const g = document.getElementById('game') || document.body, h = document.createElement('div');
  h.className = 'icm-hayalet'; h.style.backgroundImage = `url(${bg.currentSrc || bg.src})`;
  g.appendChild(h);
  requestAnimationFrame(() => h.classList.add('git'));
  setTimeout(() => h.remove(), GECIS_MS + 80);
}
/** #p28bina (Han/Ahır) kapanırken ui-ahir.js çağırır. */
export function icmBinaKapat(kap) { if (acik?.kap === kap) solarakCik(); }

// ---------- Panel gizle / aç / çıkış ----------
ACT.icmGizle = () => { if (acik) { acik.kap.classList.add('icm-kapali'); acik.el.querySelector('[data-a="icmAc"].icm-btn')?.focus({ preventScroll: true }); } };
ACT.icmAc = () => acik?.kap.classList.remove('icm-kapali');
ACT.icmCik = () => { if (!acik) return; if (acik.kap.id === 'p28bina') ACT.binaKapat?.(); else if (cur()) closeWin(); };

// ---------- Maden: madenci/cevher/vagon katmanı sahnenin üstünde ----------
/** Maden iç mekânı açıksa madenci sahnesini (ui-sahne.js mineScene HTML'i) katmana yerleştirir ve true döner; sayfa
 *  kendi şeridini çizmez. Katman yoksa ya da sahne eski SVG çizimiyse (?p23=0) false döner (sayfa eskisi gibi çizer). */
export function icmMaden(html) {
  if (icmTur() !== 'maden' || !/mn-p23/.test(html)) return false;
  const on = acik.el.querySelector('.icm-on');
  if (!on.querySelector('.mn-p23')) on.innerHTML = html;
  return true;
}

// ---------- Klan Karargâhı: boş sancaklara klan arması ----------
/** Klan sancağının amblemini (banner.js emblemSvg çıktısı) mekândaki boş sancaklara bindirir; boş verilirse kaldırır. */
export function icmArma(svg) {
  if (icmTur() !== 'klan') return;
  for (const a of acik.el.querySelectorAll('.icm-arma')) if (a._h !== svg) { a._h = svg; a.innerHTML = svg || ''; }
}
