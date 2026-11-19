// Sohbet süzgeci: küfür maskeleme (mesaj engellenmez, sözcük yıldızlanır), bağlantı ve telefon numarası ayıklama.
// Saf metin işlevleridir; sözcük listesi badwords.js'te veri olarak durur.
// Kaçamaklara karşı temel önlemler: büyük/küçük harf, harf yerine rakam/simge (s1kt1r, $ik), uzatma (siiiktir),
// harf arası nokta/boşluk (s.i.k.t.i.r, s i k t i r) ve (işaretli köklerde) Türkçe harfin düz yazımı.
import { BAD_WORDS } from './badwords.js';

const LEET = { 0: 'o', 1: 'i', 3: 'e', 4: 'a', 5: 's', 7: 't', '@': 'a', $: 's', '!': 'i' };
const FOLD = { ş: 's', ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ü: 'u' };
const LETTER = /\p{L}/u;
// Parça → yalnızca harfler (küçük, rakam/simge harfe çevrilmiş). Hiç harf içermeyen parça (sayı, noktalama) boş döner.
function norm(tok) {
  const low = tok.toLocaleLowerCase('tr-TR');
  if (!LETTER.test(low)) return '';
  let out = '';
  for (const ch of low) { const c = LEET[ch] || ch; if (LETTER.test(c)) out += c; }
  return out;
}
const squash = (s, n) => s.replace(/(.)\1+/gu, n === 1 ? '$1' : '$1$1'); // harf uzatmaları: 1'e ya da 2'ye indir
const fold = s => s.replace(/[şçğıöü]/g, c => FOLD[c]);

// Liste derlenir: çift harfli kökler (yarrak, pussy) "2'ye indirilmiş" hâlle, diğerleri "1'e indirilmiş" hâlle karşılaştırılır
// (böylece "niger" gibi tek harfli masum sözcükler çift harfli kökle eşleşmez)
const RULES = { exact: [new Set(), new Set()], pre: [[], []], sub: [[], []] };
for (const raw of [...BAD_WORDS.tr, ...BAD_WORDS.en]) {
  const ascii = raw.endsWith('~'), body = ascii ? raw.slice(0, -1) : raw;
  const kind = body.startsWith('*') ? 'sub' : body.endsWith('*') ? 'pre' : 'exact', word = body.replace(/\*/g, '').toLocaleLowerCase('tr-TR');
  for (const w of ascii ? [word, fold(word)] : [word]) {
    const dbl = /(.)\1/u.test(w) ? 1 : 0, key = dbl ? w : squash(w, 1);
    if (kind === 'exact') RULES.exact[dbl].add(key); else if (!RULES[kind][dbl].includes(key)) RULES[kind][dbl].push(key);
  }
}
function isBad(tok) {
  const n = norm(tok);
  if (n.length < 2) return false;
  // Tam sözcük kuralları yalnızca 3+ harflik uzatmayı indirir ("sikke" masum kalır); kökler her uzatmayı indirir ("fuuck")
  const one = squash(n, 1), two = squash(n, 2), three = n.replace(/(.)\1{2,}/gu, '$1');
  if (RULES.exact[0].has(three) || RULES.exact[1].has(two)) return true;
  return RULES.pre[0].some(p => one.startsWith(p)) || RULES.pre[1].some(p => two.startsWith(p)) || RULES.sub[0].some(p => one.includes(p)) || RULES.sub[1].some(p => two.includes(p));
}
// Metni boşluklara göre parçalar; art arda en az üç tek harfli parça ("s i k t i r") tek sözcük sayılır
function tokens(text) {
  const parts = [...text.matchAll(/\S+/gu)].map(m => ({ s: m.index, e: m.index + m[0].length, t: m[0] })), out = [];
  for (let i = 0; i < parts.length; i++) {
    let j = i;
    while (j < parts.length && norm(parts[j].t).length === 1) j++;
    if (j - i >= 3) { out.push({ s: parts[i].s, e: parts[j - 1].e, t: parts.slice(i, j).map(x => x.t).join('') }); i = j - 1; } else out.push(parts[i]);
  }
  return out;
}
export const hasProfanity = text => typeof text === 'string' && (tokens(text).some(t => isBad(t.t)) || isBad(text.replace(/\s+/g, '')));
// Küfürlü sözcüklerin harf ve rakamlarını yıldızlar; uzunluk ve noktalama korunur
export function maskProfanity(text) {
  let out = text, n = 0;
  for (const t of tokens(text)) if (isBad(t.t)) {
    const seg = out.slice(t.s, t.e), tail = seg.match(/[^\p{L}\p{N}@$]*$/u)[0].length, end = t.e - tail; // sondaki noktalama ("...!") olduğu gibi kalır
    n++; out = out.slice(0, t.s) + out.slice(t.s, end).replace(/[\p{L}\p{N}@$!]/gu, '*') + out.slice(end);
  }
  return { text: out, n };
}

// ---------- Bağlantı ve telefon numarası ----------
const TLD = 'com|net|org|io|gg|tr|co|xyz|me|ly|link|shop|site|app|info|biz|tk|ru|tv|club|online|store|live|fun|top|vip|cc|to';
const W = '[\\p{L}\\p{N}-]';
const DOT = '(?:\\.|\\s+\\.\\s+|\\s*[(\\[]\\s*(?:dot|nokta)\\s*[)\\]]\\s*|\\s+(?:dot|nokta)\\s+)'; // "site.com", "site . com", "site(dot)com", "site nokta com"
const LINK_RE = new RegExp(`(?:https?:\\/\\/|www\\.)\\S+|(?<!${W})${W}{2,}(?:${DOT}${W}{2,}){0,2}${DOT}(?:${TLD})(?!${W})(?:\\/\\S*)?`, 'giu');
const PHONE_RE = /(?<![\p{L}\p{N}])(?:\+|00)?\d(?:[\s().-]{0,2}\d){9,14}(?![\p{L}\p{N}])/gu;
export const LINK_MARK = '[bağlantı]', PHONE_MARK = '[numara]';
export function stripContacts(text) {
  let links = 0, phones = 0;
  let out = text.replace(LINK_RE, () => { links++; return LINK_MARK; });
  // binlik ayraçlı büyük sayılar (1.000.000.000 akçe) telefon sayılmaz
  out = out.replace(PHONE_RE, m => (/^\d{1,3}(?:[.\s]\d{3})+$/.test(m) ? m : (phones++, PHONE_MARK)));
  return { text: out, links, phones };
}

// Sohbet mesajının süzülmüş hâli. raw: değiştiyse özgün metin (yalnızca şikâyet incelemesi için saklanır, oyunculara gösterilmez)
export function cleanChat(text) {
  const a = stripContacts(text), b = maskProfanity(a.text);
  return { text: b.text, raw: b.text === text ? null : text, bad: b.n, links: a.links, phones: a.phones };
}

// Oyuncu postası metni (19 Kas): 1–400 karakter, iletişim bilgisi ve küfür maskelenir
export const MAIL_MAX = 400;
export function mailText(t, fail) { if (typeof t !== 'string') fail('bad-text', 'Posta metni olmalı.'); const v = t.replace(/\s+/g, ' ').trim(); if (!v) fail('bad-text', 'Posta boş olamaz.'); if (v.length > MAIL_MAX) fail('bad-text', `Posta en çok ${MAIL_MAX} karakter olabilir.`); return cleanChat(v).text; }
