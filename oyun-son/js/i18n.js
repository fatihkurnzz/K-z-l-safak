// Dil sistemi (Türkçe / English). Kaynak dil Türkçedir ve kodda yazılı durur; İngilizce, anahtarı Türkçe kaynak metnin
// kendisi olan sözlüklerden gelir (i18n/en-ui.js: arayüz · i18n/en-content.js: içerik tabloları; ikincisi yoksa Türkçe kalır).
//
//  t(metin, parametreler)  arayüz metni: {ad} biçiminde parametre, sayıya göre çoğul ("tekil|çoğul")
//  tr(metin)               içerik adı / açıklaması ya da hazır bir cümle: birebir, kalıpla ya da parça parça çevrilir
//  errText(hata)           sunucu hatası: önce iletinin çevirisi, yoksa kodun karşılığı, o da yoksa Türkçe ileti
//  fmtNum, fmtDate         seçili dilin biçimiyle sayı ve tarih (Intl)
//
// Ekran katmanı (watchDom): arayüz HTML'i şablon dizgileriyle kurulduğu için metinler tek tek sarılmaz; sayfaya düşen
// her metin düğümü ve title / placeholder / aria-label özniteliği burada çevrilir. Türkçe aslı düğümün yanında saklanır:
// dil değişince sayfa yeniden kurulmadan, hiçbir durum yitirilmeden çevrilir. Oyuncunun yazdığı metin (sohbet, duyuru)
// çevrilmez: translate="no" taşıyan ya da SKIP_SEL'e uyan öğelerin içine dokunulmaz.
// Saf çekirdek (sözlük, kalıp, çoğul, sayı) tarayıcı gerektirmez; testler Node'da çalıştırır.

export const LANG_KEY = 'dd_lang';
export const LANGS = {
  tr: { name: 'Türkçe', locale: 'tr-TR', dir: 'ltr' },
  en: { name: 'English', locale: 'en-US', dir: 'ltr' },
};
export const LANG_KEYS = Object.keys(LANGS);
export const SOURCE_LANG = 'tr';
export const isLang = l => typeof l === 'string' && Object.hasOwn(LANGS, l);
// Kayıtlı seçim geçerliyse o; değilse kaynak dil (tarayıcı diline göre kendiliğinden değişmez: seçim oyuncunundur)
export const pickLang = (stored, query) => (isLang(query) ? query : isLang(stored) ? stored : SOURCE_LANG);

let cur = SOURCE_LANG;
export const lang = () => cur;
export const locale = () => LANGS[cur].locale;

// ---------- Sözlük ----------
// exact: Türkçe → karşılık · pats: {…} içeren anahtarlardan derlenen kalıplar (baş ve son harflerine göre kovalanmış)
const newDict = () => ({ exact: new Map(), head: new Map(), tail: new Map(), loose: [], prefix: [], ctx: new Map(), codes: {}, n: 0 });
const DICT = {};
const PH = /\{(\w+)\}/g;
const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const norm = s => s.replace(/\s+/g, ' ').trim();
const letters = s => (s.match(/\p{L}/gu) || []).length;
function compile(key, val) {
  // Bitişik parametreler ("{0}{1}") tek parça yakalanır ve sonradan dağıtılır (aşağıda spread): aralarında sabit yazı
  // olmadığı için hangisinin ne aldığı metinden bilinemez. groups: yakalama sırasıyla parametre adları.
  const groups = [], names = [], parts = key.split(PH); // [düz, ad, düz, ad, … düz]
  let re = '^', lit = 0;
  for (let i = 0; i < parts.length; i++) {
    if (i % 2) { names.push(parts[i]); if (i > 1 && parts[i - 1] === '') groups[groups.length - 1].push(parts[i]); else { groups.push([parts[i]]); re += '([\\s\\S]*?)'; } } // parametre boş da olabilir ("Arkadaşlar{0}")
    else { re += reEsc(parts[i]); lit += letters(parts[i]); }
  }
  return { key, val, names, groups, re: new RegExp(re + '$'), lit, lead: parts[0], trail: parts[parts.length - 1] };
}
// Bitişik parametrelerin paylaşımı: baştaki sayı ilk parametreye ("+%{0}{1}": 4 ve " (En yüksek)"), kalan ikinciye;
// sayıyla başlamıyorsa hepsi ilkine (ilki çoğu kez ekranda görünmeyen bir ikondur: "{0}{1}: {2} → Çevir").
function spread(p, m) {
  const vals = {};
  p.groups.forEach((g, i) => {
    const t = m[i + 1];
    for (const n of g) vals[n] = '';
    const num = g.length > 1 ? /^[+−-]?[\d.,]+/.exec(t) : null;
    if (num && num[0].length < t.length) { vals[g[0]] = num[0]; vals[g[1]] = t.slice(num[0].length); } else vals[g[0]] = t;
  });
  return vals;
}
// Şablonun başındaki ya da sonundaki parametre çoğu kez bir ikondur (HTML): ekranda metin düğümüne girmez. Bu yüzden
// "{0} Parçala ya da sat" anahtarı "Parçala ya da sat" olarak da kaydedilir (karşılığın aynı ucu da kırpılır).
const EDGE_L = /^\{(\w+)\}\s?/, EDGE_R = /\s?\{(\w+)\}$/;
function edges(key, val) {
  const out = [], forms = val.split('|'); // çoğul biçimlerin her biri aynı uçtan kırpılır
  const cut = (k, re, left) => { const m = re.exec(k); if (!m) return null; const fs = []; for (const f of forms) { const fm = re.exec(f); if (!fm || fm[1] !== m[1]) return null; fs.push(left ? f.slice(fm[0].length) : f.slice(0, -fm[0].length)); } return [left ? k.slice(m[0].length) : k.slice(0, -m[0].length), fs.join('|')]; };
  const L = cut(key, EDGE_L, true), R = cut(key, EDGE_R, false);
  if (L) out.push(L);
  if (R) out.push(R);
  if (key.startsWith('· ') && forms.every(f => f.startsWith('· '))) out.push([key.slice(2), forms.map(f => f.slice(2)).join('|')]); // "· {0} öldürme": ayraç başka bir parçayla birleşince de bulunsun
  return out.filter(([k, v]) => k && v && letters(k) >= 2);
}
const push = (map, k, p) => { const a = map.get(k); if (a) a.push(p); else map.set(k, [p]); };
// Sözlüğe ekler (sonradan eklenen, aynı anahtarı ezmez: arayüz sözlüğü içerik sözlüğünden önce yüklenir)
export function addDict(l, table, codes) {
  if (!isLang(l) || l === SOURCE_LANG) return 0;
  const D = DICT[l] || (DICT[l] = newDict());
  let n = 0;
  const late = [];
  for (const k of Object.keys(table || {})) {
    const v = table[k], key = norm(k);
    if (typeof v !== 'string' || !v || !key) continue;
    // Anahtarı boşlukla biten kayıt ön ektir ("Azılı " → "Savage "): ardından gelen ad ayrıca çevrilir
    if (/\S\s$/.test(k) && !k.includes('{')) { if (!D.prefix.some(x => x[0] === key + ' ')) { D.prefix.push([key + ' ', v]); D.prefix.sort((x, y) => y[0].length - x[0].length); n++; } continue; }
    if (D.exact.has(key)) continue;
    n++;
    const put = (key, v, weak) => {
      if (D.exact.has(key)) return;
      D.exact.set(key, v);
      if (!key.includes('{')) return;
      const p = compile(key, v);
      if (!p.names.length || p.lit < 2) return; // yalnız parametreden oluşan anahtar kalıp olmaz
      if (weak) p.lit -= 0.5; // kırpılmış biçim, aynı uzunluktaki asıl kalıbın ardından denenir
      if (p.lead.length >= 2) push(D.head, p.lead.slice(0, 2), p);
      else if (p.trail.length >= 2) push(D.tail, p.trail.slice(-2), p);
      else D.loose.push(p);
    };
    put(key, v);
    if (key.includes('{') || key.startsWith('· ')) late.push(() => { for (const [k2, v2] of edges(key, v)) put(k2, v2, true); });
  }
  for (const f of late) f(); // kırpılmış biçimler, tablonun kendi anahtarlarını ezmesin diye en sona eklenir
  for (const m of [D.head, D.tail]) for (const a of m.values()) a.sort((x, y) => y.lit - x.lit);
  D.loose.sort((x, y) => y.lit - x.lit);
  if (codes) Object.assign(D.codes, codes);
  D.n += n; cache.clear();
  return n;
}
// Bağlama göre karşılık: aynı Türkçe sözcüğün iki anlamı varsa ("Güç": parti gücü / Güç niteliği, "Açık": açık / açık hava)
// { 'Güç': [['.seçici', 'Strength']] }. Yalnızca ekran katmanı kullanır (metnin durduğu öğeye bakar).
export function addContext(l, table) {
  if (!isLang(l) || l === SOURCE_LANG) return;
  const D = DICT[l] || (DICT[l] = newDict());
  for (const k of Object.keys(table || {})) D.ctx.set(norm(k), table[k]);
}
export const dictSize = (l = cur) => DICT[l]?.n || 0;
export const hasKey = (text, l = cur) => !!DICT[l]?.exact.has(norm(String(text)));

// ---------- Sayı, çoğul, tarih ----------
const NF = {}, PR = {};
const nf = (l, opt) => { const k = l + (opt ? JSON.stringify(opt) : ''); return NF[k] || (NF[k] = new Intl.NumberFormat(LANGS[l].locale, opt)); };
export const fmtNum = (n, opt) => nf(cur, opt).format(n);
export const fmtPct = (v, digits = 0) => nf(cur, { style: 'percent', maximumFractionDigits: digits }).format(v);
export const fmtDate = (ts, opt = { day: '2-digit', month: '2-digit', year: 'numeric' }) => new Intl.DateTimeFormat(locale(), opt).format(new Date(ts));
export const fmtTime = (ts, opt = { hour: '2-digit', minute: '2-digit', hour12: false }) => new Intl.DateTimeFormat(locale(), opt).format(new Date(ts));
export const pluralOf = (n, l = cur) => (PR[l] || (PR[l] = new Intl.PluralRules(LANGS[l].locale))).select(Math.abs(Number(n)) || 0);
// Türkçe biçimli sayıyı (1.234 · 3,5 · %15) seçili dile çevirir; metnin geri kalanına dokunmaz
const RE_NUM = /%\s?(\d+(?:[.,]\d+)?)|(?<![\d.,])(\d{1,3}(?:\.\d{3})+)(?:,(\d+))?(?![\d.,])|(?<![\d.,])(\d+),(\d{1,2})(?![\d.,])/g; // ondalık: en çok iki hane ("1,234" İngilizce binlik olabilir: dokunulmaz)
export function locNum(s, l = cur) {
  if (l === SOURCE_LANG || !/\d/.test(s)) return s;
  return s.replace(RE_NUM, (m, pct, grp, dec, a, b) => (pct !== undefined ? pct.replace(',', '.') + '%' : grp !== undefined ? grp.replace(/\./g, ',') + (dec ? '.' + dec : '') : a + '.' + b));
}
const numOf = v => (typeof v === 'number' ? v : typeof v === 'string' && /^[\d.,\s]+$/.test(v) ? Number(v.replace(/[.\s]/g, '').replace(',', '.')) : NaN);
// "tekil|çoğul": sayıya göre biçim seçer (İngilizce: one / other). Tek biçim varsa aynen döner.
function pickForm(val, vals, l) {
  if (!val.includes('|')) return val;
  const forms = val.split('|');
  let n = NaN;
  for (const v of vals) { n = numOf(v); if (!Number.isNaN(n)) break; }
  return Number.isNaN(n) ? forms[forms.length - 1] : (pluralOf(n, l) === 'one' ? forms[0] : forms[Math.min(1, forms.length - 1)]);
}
const fill = (tpl, get) => tpl.replace(PH, (m, k) => { const v = get(k); return v === undefined || v === null ? m : String(v); });

// ---------- t(): arayüz metni ----------
export function t(text, params) {
  const l = cur, src = String(text);
  const vals = params ? Object.values(params) : [];
  const show = v => (typeof v === 'number' ? nf(l).format(v) : v);
  if (l === SOURCE_LANG) return params ? fill(src, k => show(params[k])) : src;
  const hit = DICT[l]?.exact.get(norm(src));
  if (hit !== undefined) { const f = pickForm(hit, vals, l); return params ? fill(f, k => show(typeof params[k] === 'string' ? tr(params[k]) : params[k])) : f; }
  // sözlükte yok: Türkçe kurulur, hazır cümle olarak çevrilmeye çalışılır (olmazsa Türkçe kalır)
  return tr(params ? fill(src, k => (typeof params[k] === 'number' ? nf(SOURCE_LANG).format(params[k]) : params[k])) : src);
}

// ---------- tr(): hazır metnin çevirisi ----------
const cache = new Map(), CACHE_MAX = 6000;
const MISS = new Set(), MISS_MAX = 4000;
let ownName = ''; // oyuncunun kendi adı hiçbir zaman çevrilmez
export const protectName = n => { if (typeof n === 'string' && n !== ownName) { ownName = n; cache.clear(); } };
export const misses = () => [...MISS];
export const clearMisses = () => MISS.clear();

const STRONG = / → /;
// Çevrilmiş metinde aynen kalan kaynak sözcük sayısı (özel adlar iki adayda da kalır; fark çevrilmeyen sözcüklerdir)
function leftover(src, out) {
  const words = new Set(src.match(/\p{L}{3,}/gu) || []), seen = new Set(out.match(/\p{L}{3,}/gu) || []);
  let n = 0; for (const w of words) if (seen.has(w)) n++;
  return n;
}
function matchPat(D, core, depth) {
  // Birden çok kalıp tutabilir ("{0}/{1} açık" ile "{0}/{1} üye · {2}{3}"): metnin en çoğunu kendi sabit yazısıyla
  // karşılayan (yakaladığı parça en kısa olan) seçilir; eşitlikte sabit harfi çok olan.
  let best = null, bm = null, bcap = Infinity;
  const tryList = a => {
    if (!a) return;
    for (const p of a) {
      const m = p.re.exec(core);
      if (!m) continue;
      let cap = 0, strong = false;
      for (let i = 1; i < m.length; i++) { cap += m[i].length; if (STRONG.test(m[i])) strong = true; }
      if (strong) continue; // kalıp, kendi yazmadığı " → " ayracını yutamaz: o metin parçalara ayrılır
      if (cap < bcap || (cap === bcap && p.lit > best.lit)) { best = p; bm = m; bcap = cap; }
    }
  };
  tryList(D.head.get(core.slice(0, 2))); tryList(D.tail.get(core.slice(-2))); tryList(D.loose);
  if (!best) return null;
  if (bm.slice(1).some(v => v.includes(', '))) { // yakalanan parça virgüllü: metin bir liste olabilir ("1. galibiyet %100, 2. galibiyet %75")
    const parts = core.split(', '), outs = parts.map(x => one(D, x, depth + 1));
    if (outs.every((o, i) => o !== parts[i])) return [outs.join(', '), 1];
  }
  const V = spread(best, bm), O = {};
  for (const k of best.names) { const v = V[k], c = v.trim(); O[k] = c ? v.slice(0, v.indexOf(c)) + one(D, c, depth + 1) + v.slice(v.indexOf(c) + c.length) : v; } // parametrenin baş ve son boşluğu korunur
  return [fill(pickForm(best.val, best.names.map(k => V[k]), cur), k => O[k]), 1 - bcap / Math.max(1, core.length)];
}
const SEPS = [' → ', '; ', ' · ', ' — ', ' – ', ' | ', ' ‹ ', ' › '];
const WRAP = [['(', ')'], ['“', '”'], ['"', '"'], ['‘', '’'], ['[', ']'], ['«', '»']];
// Baştaki ve sondaki sayı / simge takıları: "3× Bileği Taşı", "Kılıç +7", "Akçe ×500", "✓ Tamam", "Kapı ›"
const RE_AFFIX = /^((?:[·•✓✔★☆›‹»«→←↑↓⚑]\s?)?(?:[\d.,]+\s?[×x]\s?|[+−-]?[\d.,/%]+\s|[+×✕-]\s?)?)([\s\S]*?)((?:\s?[×x]\s?[\d.,]+|\s\+\d+|\s?\([\d.,/%\s]+\)|\s?[›‹»«→←↑↓✓✔…:!?.·+]+|\s[+−-]?%?[\d.,/%]+)?)$/u;
// D: sözlük · s: metin · depth: iç içe çağrı sınırı. Çevrilemeyen metin aynen döner.
function one(D, s, depth = 0) {
  const core = norm(s);
  if (!core) return s;
  if (!/\p{L}/u.test(core)) return locNum(core);
  if (core === ownName) return s;
  const c = cache.get(core);
  if (c !== undefined) return c;
  let out = D.exact.get(core);
  if (out === undefined) {
    const P = matchPat(D, core, depth);
    if (P && P[1] >= 0.4) out = P[0];
    else {
      // baştaki / sondaki sayı ve simge takısı atılınca birebir bulunan metin ("Saldırı ve büyü +%30")
      const m = RE_AFFIX.exec(core), mid = m && (m[1] || m[3]) ? D.exact.get(m[2]) : undefined;
      if (mid !== undefined && !mid.includes('{')) out = locNum(m[1]) + mid + locNum(m[3]);
      else {
        // Kalıp metnin azını karşılıyorsa (çoğu yakalanan parça) parçalara ayırmak daha iyi sonuç verebilir: Türkçe
        // sözcüğü daha az kalan seçilir ("Büyücü: kalkan 50 hasarı emdi" → etiket + cümle).
        const Q = depth < 8 ? pieces(D, core, depth) : null;
        out = P && (Q === null || leftover(core, Q) >= leftover(core, P[0])) ? P[0] : Q;
      }
    }
  }
  const res = out === null || out === undefined ? core : out.includes('  ') ? out.replace(/ {2,}/g, ' ') : out;
  if (out === null || out === undefined) { if (depth === 0 && MISS.size < MISS_MAX) MISS.add(core); }
  if (cache.size >= CACHE_MAX) cache.clear();
  cache.set(core, res);
  return res;
}
// Birebir ve kalıpla bulunamayan metni parçalarına ayırıp dener. Hiçbir parça çevrilemezse null.
function pieces(D, core, depth) {
  for (const sep of SEPS) {
    if (!core.includes(sep)) continue;
    const parts = core.split(sep), outs = parts.map(p => one(D, p, depth + 1));
    return outs.some((o, i) => o !== parts[i]) ? outs.join(sep) : null;
  }
  for (const [pk, pv] of D.prefix) if (core.startsWith(pk) && core.length > pk.length) { const rest = core.slice(pk.length), o = one(D, rest, depth + 1); if (o !== rest || !/\p{L}/u.test(rest)) return pv + o; }
  const par = /^(.+) \(([^()]+)\)$/.exec(core); // "Ad (ek)": iki parça ayrı ayrı
  if (par) { const a = one(D, par[1], depth + 1), b = one(D, par[2], depth + 1); if (a !== par[1] || b !== par[2]) return `${a} (${b})`; }
  for (const [a, b] of WRAP) if (core.startsWith(a) && core.endsWith(b) && core.length > 2) { const inner = core.slice(1, -1), o = one(D, inner, depth + 1); return o !== inner ? a + o + b : null; }
  // Cümle içinde küçük harfle yazılmış terim ("büyü", "bileği taşı"): sözlükteki büyük harfli yazımı aranır
  if (core.length <= 40 && /^\p{Ll}/u.test(core)) {
    const cap = core[0].toLocaleUpperCase('tr') + core.slice(1), o = D.exact.get(cap) ?? D.exact.get(cap.replace(/\s(\p{Ll})/gu, (m, b) => ' ' + b.toLocaleUpperCase('tr')));
    if (o !== undefined && !o.includes('|') && !o.includes('{')) return o === cap || /[çğıöşüÇĞİÖŞÜ]/.test(o) ? o : o[0].toLowerCase() + o.slice(1); // özel ad büyük harfle kalır
  }
  // "A ve B": iki yan da çevrilebiliyorsa
  if (core.includes(' ve ')) { const parts = core.split(' ve '), outs = parts.map(x => one(D, x, depth + 1)); if (outs.every((o, i) => o !== parts[i])) return outs.join(' and '); }
  // BÜYÜK HARFLİ başlık ("ZAFER"): sözlükteki olağan yazımı aranır, karşılık büyük harfle verilir
  if (core.length <= 40 && core === core.toLocaleUpperCase('tr') && core !== core.toLocaleLowerCase('tr')) {
    const t2 = core.toLocaleLowerCase('tr').replace(/(^|\s)(\p{L})/gu, (m, a, b) => a + b.toLocaleUpperCase('tr')), o = D.exact.get(t2) ?? D.exact.get(t2[0] + core.slice(1).toLocaleLowerCase('tr'));
    if (o !== undefined && !o.includes('|') && !o.includes('{')) return o.toUpperCase();
  }
  const m = RE_AFFIX.exec(core);
  if (m && (m[1] || m[3]) && m[2] && m[2] !== core) { const o = one(D, m[2], depth + 1); if (o !== m[2]) return locNum(m[1]) + o + locNum(m[3]); }
  const ci = core.indexOf(': ');
  if (ci > 0) { // "Etiket: değer"
    const h = core.slice(0, ci), v = core.slice(ci + 2), ho = D.exact.get(h + ':')?.replace(/:$/, '') ?? D.exact.get(h), vo = one(D, v, depth + 1);
    if (ho !== undefined || vo !== v) return (ho ?? h) + ': ' + vo;
  }
  if (core.includes(', ')) { // liste: öğeler ayrı ayrı (çevrilemeyen öğe, ör. oyuncu adı, olduğu gibi kalır)
    const parts = core.split(', '), outs = parts.map(p => one(D, p, depth + 1));
    if (outs.some((o, i) => o !== parts[i])) return outs.join(', ');
  }
  return null;
}
export function tr(text) {
  if (cur === SOURCE_LANG || text === null || text === undefined) return text;
  const D = DICT[cur], s = String(text);
  if (!D) return s;
  const core = norm(s), out = one(D, s);
  if (out === core) return s; // çevrilmedi (ya da aynı): özgün boşluklarıyla kalsın
  if (out === s) return s;
  const lead = s.match(/^\s*/)[0], trail = s.match(/\s*$/)[0];
  return (lead && !/^[,.:;!?)’']/.test(out) ? ' ' : '') + out + (trail ? ' ' : ''); // noktalamayla başlayan parça önceki sözcüğe bitişir
}

// ---------- Sunucu hataları ----------
// Hata bir kod ve Türkçe bir ileti taşır. Önce iletinin çevirisi aranır (aynı kod birden çok iletiyle gelebilir),
// yoksa kodun genel karşılığı; ikisi de yoksa Türkçe ileti gösterilir.
export function errText(e) {
  const msg = String(e?.message ?? ''), code = typeof e?.code === 'string' ? e.code : '';
  if (cur === SOURCE_LANG) return msg;
  const D = DICT[cur];
  if (!D) return msg;
  if (msg && msg !== code) { const o = tr(msg); if (o !== msg) return o; }
  if (code && Object.hasOwn(D.codes, code)) return D.codes[code];
  if (/^bad-/.test(code) && Object.hasOwn(D.codes, 'bad-*')) return D.codes['bad-*'];
  return msg;
}

// ---------- Dil seçimi ----------
const subs = new Set();
export const onLang = fn => { subs.add(fn); return () => subs.delete(fn); };
const store = () => { try { return globalThis.localStorage || null; } catch { return null; } };
export const savedLang = () => { try { return store()?.getItem(LANG_KEY) || null; } catch { return null; } };
let loading = null;
// Sözlük dosyaları yalnızca o dil seçilince indirilir. İçerik sözlüğü (çeviri paketi) yoksa Türkçe adlar kalır.
export async function loadDict(l) {
  if (l === SOURCE_LANG || DICT[l]?.loaded) return true;
  if (!isLang(l)) return false;
  loading ||= (async () => {
    const ui = await import(`./i18n/${l}-ui.js`);
    const U = l.toUpperCase();
    addDict(l, ui.default || ui[`${U}_UI`], ui.CODES || ui[`${U}_CODES`]);
    addDict(l, ui[`${U}_EXTRA`]); addContext(l, ui[`${U}_CTX`]);
    try { const c = await import(`./i18n/${l}-content.js`); addDict(l, c.default || c[`${l.toUpperCase()}_CONTENT`]); } catch { /* içerik sözlüğü yok: Türkçe kalır */ }
    DICT[l].loaded = true;
  })().finally(() => { loading = null; });
  try { await loading; return true; } catch { return false; }
}
export async function setLang(l, { save = true } = {}) {
  if (!isLang(l)) return cur;
  if (l !== SOURCE_LANG && !(await loadDict(l))) return cur; // sözlük yüklenemedi: dil değişmez
  const was = cur;
  cur = l; cache.clear();
  if (save) { try { store()?.setItem(LANG_KEY, l); } catch { } }
  applyDoc();
  if (was !== l) for (const fn of subs) { try { fn(l, was); } catch { } }
  return cur;
}
// Sınama ve Node için: sözlük dosyası yüklemeden dili doğrudan kurar
export function forceLang(l) { if (isLang(l)) { cur = l; cache.clear(); applyDoc(); } return cur; }

// ---------- Ekran katmanı ----------
const ATTRS = ['title', 'placeholder', 'aria-label'];
// Oyuncunun yazdığı metnin durduğu yerler (sohbet satırı, konuşma önizlemesi, klan duyurusu, ad kutuları)
export const SKIP_SEL = '[translate="no"], .cm .cbody > span, .cm .cn, .cb-msgs .cl, [data-a="chConv"] .mut, .mquote, .cslo, .gv-sel, textarea, script, style, svg:not(.i18n)';
const SRC = new WeakMap(), OUT = new WeakMap(); // metin düğümü → Türkçe aslı / yazılan karşılık
const ASRC = new WeakMap();                      // öğe → { öznitelik: [asıl, yazılan] }
let mo = null, seen = false;
const doc = () => globalThis.document;
function textNode(n) {
  const v = n.nodeValue;
  if (OUT.get(n) !== v) SRC.set(n, v); // yeni ya da oyunun değiştirdiği düğüm: asıl budur
  const src = SRC.get(n);
  let out = src;
  if (cur !== SOURCE_LANG) {
    const C = DICT[cur]?.ctx, rules = C?.size ? C.get(norm(src)) : null, el = rules && n.parentElement;
    const hit = el && rules.find(r => el.closest(r[0]));
    out = hit ? hit[1] : tr(src);
  }
  OUT.set(n, out);
  if (out !== v) n.nodeValue = out;
}
function attrs(el) {
  let rec = ASRC.get(el);
  for (const a of ATTRS) {
    if (!el.hasAttribute(a)) continue;
    const v = el.getAttribute(a);
    if (!rec) ASRC.set(el, rec = {});
    if (!rec[a] || rec[a][1] !== v) rec[a] = [v, v];
    const out = cur === SOURCE_LANG ? rec[a][0] : tr(rec[a][0]);
    rec[a][1] = out;
    if (out !== v) el.setAttribute(a, out);
  }
}
function scan(root) {
  const d = doc();
  if (!root || !d) return;
  if (root.nodeType === 3) { if (!root.parentElement?.closest(SKIP_SEL)) textNode(root); return; }
  if (root.nodeType !== 1 || root.closest(SKIP_SEL)) return;
  attrs(root);
  const w = d.createTreeWalker(root, 5 /* ELEMENT | TEXT */, { acceptNode: n => (n.nodeType === 1 && n.matches(SKIP_SEL) ? (n.nodeName === 'TEXTAREA' && attrs(n), 2 /* REJECT */) : 1) });
  for (let n = w.nextNode(); n; n = w.nextNode()) { if (n.nodeType === 3) { if (n.nodeValue.trim()) textNode(n); } else attrs(n); }
}
function onMut(list) {
  for (const m of list) {
    if (m.type === 'childList') { for (const n of m.addedNodes) scan(n); }
    else if (m.type === 'characterData') { if (OUT.get(m.target) !== m.target.nodeValue && !m.target.parentElement?.closest(SKIP_SEL)) textNode(m.target); }
    else if (!m.target.closest(SKIP_SEL)) attrs(m.target);
  }
}
// Bir öğenin Türkçe aslı (çevrilmiş ekranda da): başlık ikonları gibi metne bakan süslemeler için
export function srcText(el) {
  const d = doc();
  if (!el || !d || cur === SOURCE_LANG) return '';
  let out = '';
  const w = d.createTreeWalker(el, 4);
  for (let n = w.nextNode(); n; n = w.nextNode()) out += OUT.get(n) === n.nodeValue ? SRC.get(n) : n.nodeValue;
  return out;
}
function applyDoc() {
  const d = doc();
  if (!d?.documentElement) return;
  const R = d.documentElement;
  R.lang = cur; R.dir = LANGS[cur].dir;
  for (const l of LANG_KEYS) R.classList.toggle('lang-' + l, l === cur);
  if (cur !== SOURCE_LANG) seen = true;
  // Kaynak dilde ve hiç çeviri yapılmadıysa izleyici kurulmaz (Türkçe oyuncuya hiçbir yük binmez)
  if (seen && !mo && typeof MutationObserver === 'function' && d.body) {
    mo = new MutationObserver(onMut);
    mo.observe(d.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  }
  if (seen && d.body) { scan(d.body); const tt = d.querySelector('title'); if (tt) scan(tt); mo?.takeRecords(); }
}
// Açılış: kayıtlı dili (ya da ?lang=) kurar. Sözlük gelene kadar sayfa Türkçe görünür, gelince yerinde çevrilir.
export async function initI18n() {
  let q = null;
  try { q = new URLSearchParams(globalThis.location?.search || '').get('lang'); } catch { }
  const l = pickLang(savedLang(), q);
  if (l === SOURCE_LANG) { applyDoc(); return cur; }
  return setLang(l, { save: isLang(q) });
}
if (doc()) globalThis.DD_I18N = { lang, misses, clearMisses, tr, t, setLang, dictSize, srcText };
