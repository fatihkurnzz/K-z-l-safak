// Ad zarı (sürüm 13): karakter oluşturma ekranındaki zar düğmesi için özgün takma ad üreticisi.
// Ses dünyası: eski Türkçe / Anadolu esintili karanlık fantastik. Hazır ad listesi yoktur; adlar hece havuzlarından kurulur:
//   İnsan erkek — yumuşak ve vakur (Gök-, Tar-, -bars, -demir), İnsan kadın — akıcı (Ay-, Sel-, -nur, -su),
//   Ork erkek — sert ve kısa (Gor-, Krag-, -tuk, -gaz), Ork kadın — keskin ama ritmik (Zar-, Ruk-, -şa, -ka).
// Kural: CHAR.name (3-12 harf/rakam, harfle başlar). Yaygın gerçek kişi adları (Tarkan, Ayten…) ve tanınmış kurgu/marka adları
// küçük bir engel listesiyle elenir; küfür ve teklik denetimi çağıranda (account.js nameIssue + char.nameFree).
import { CHAR, validCharName } from '../shared/roster.js';

const POOL = {
  'sancak:m': {
    a: ['Al', 'Ay', 'Bar', 'Ber', 'Dur', 'Er', 'Gök', 'Il', 'Kay', 'Kut', 'Ok', 'Or', 'Sav', 'Tar', 'Tol', 'Tun', 'Ur', 'Yal', 'Yağ', 'Kor', 'Sun', 'Bil', 'Ars', 'Tem', 'Ulu'],
    m: ['', '', '', 'V', 'V'],
    b: ['bars', 'demir', 'dar', 'han', 'kan', 'tay', 'tekin', 'tuğ', 'alp', 'kol', 'yar', 'temür', 'bek', 'çur', 'göl', 'tal', 'kar', 'yurt', 'sancar', 'tuna', 'kaya'],
  },
  'sancak:f': {
    a: ['Ay', 'Al', 'Bal', 'Çi', 'Il', 'Nar', 'Sel', 'Su', 'Tan', 'Yıl', 'İn', 'Ak', 'Gün', 'Ela', 'Ulu', 'Kar', 'Ser', 'Tom', 'Bü', 'Ya'],
    m: ['', '', 'V'],
    b: ['su', 'nur', 'ay', 'sel', 'çin', 'lay', 'dem', 'çe', 'nay', 'ren', 'yaz', 'saç', 'ruy', 'tul', 'liz', 'beg', 'mira', 'kız', 'şen', 'lin'],
  },
  'ocak:m': {
    a: ['Gor', 'Kar', 'Bruk', 'Zar', 'Ur', 'Grah', 'Mok', 'Tuz', 'Krag', 'Boz', 'Duh', 'Zag', 'Tok', 'Urk', 'Kır', 'Muz', 'Gaz', 'Haz', 'Kor', 'Zul', 'Vrak', 'Goz', 'Dur', 'Gruz'],
    m: ['', '', '', 'V', 'V'],
    b: ['dağ', 'tuk', 'gaz', 'kul', 'rak', 'moz', 'zar', 'dar', 'kut', 'bek', 'hun', 'tış', 'ruk', 'gor', 'mak', 'daş', 'koz', 'zug', 'baş', 'kır', 'toh'],
  },
  'ocak:f': {
    a: ['Za', 'Ur', 'Gul', 'Kar', 'Ruk', 'Maz', 'Vor', 'Az', 'Şar', 'Tuz', 'Bur', 'Ka', 'Zu', 'Hur', 'Gra', 'Yaz', 'Dra', 'Kaz', 'Mor'],
    m: ['', '', 'V'],
    b: ['ka', 'ra', 'şa', 'nık', 'zeh', 'ha', 'ya', 'ruk', 'mık', 'gul', 'sa', 'zın', 'rah', 'tuğ', 'kız', 'laş', 'buk', 'ça', 'vra'],
  },
};
// Yaygın gerçek adlar ve tanınmış kurgu adları (tam eşleşme, küçük harf). Liste kısa tutulur: üretici bunları zaten nadiren kurar.
const BLOCK = new Set(('alper erkan ayhan tarkan erdem ercan aydın gökhan oktay orhan ilhan erhan tolga tuncay koray serkan sertan tayfun kayhan '
  + 'alpay aytekin tekin ertekin dursun bilal kaya baran barkan berkan durkan gökay gökalp oktar ursun sunay sunar tuna yalkın '
  + 'akçe selçin altuna bilhan korhan korkut bursa kars tuzla urla kozan tarsus karaman kazan alkan okan orkan tarhan ayten aysel aynur aysu ayça ayla selin selda sena nur nuray gülay gülsu suna sunay tansu tanay yıldız elanur aksu ilkay '
  + 'gunay günay günsu inci nursel sevgi seren serin sevim ilknur aylin aylinsu belinay balsu '
  + 'thrall grom garrosh durotan orgrim azog bolg gorbag shagrat ugluk gulcan gul gulan zarah').split(/\s+/).filter(Boolean));

const cap = s => s.charAt(0).toLocaleUpperCase('tr-TR') + s.slice(1);
// Ünlü uyumu kabaca korunur: ara ünlü (V) önceki hecenin son ünlüsüne uyar (a/ı → a, o/u → u, e/i → e, ö/ü → ü);
// ünlüyle biten hecenin ardına ara ünlü girmez, iki ünlü yan yana gelmez; iki ünsüz kümesi arasına ünlü girer.
const VOW = /[aeıioöuü]/i, HARM = { a: 'a', ı: 'a', o: 'u', u: 'u', e: 'e', i: 'e', ö: 'ü', ü: 'ü' };
const lastV = s => { for (let i = s.length - 1; i >= 0; i--) { const c = s[i].toLocaleLowerCase('tr-TR'); if (HARM[c]) return HARM[c]; } return 'a'; };
function join(a, m, b) {
  const endV = VOW.test(a.slice(-1)), startV = VOW.test(b.charAt(0));
  if ((endV && startV) || a.toLocaleLowerCase('tr-TR').startsWith(b.slice(0, 3)) || b.startsWith(a.toLocaleLowerCase('tr-TR').slice(0, 3))) return null; // ikileme yok (Ayay, Rukruk)
  let s = a;
  if (m && !endV && !startV) s += lastV(a);
  else if (!endV && !startV && (/[^aeıioöuü]{2}$/i.test(a) || /^[^aeıioöuü]{2}/i.test(b))) s += lastV(a);
  return cap((s + b).toLocaleLowerCase('tr-TR'));
}
const ok = n => !!n && validCharName(n) && n.length >= CHAR.name.min && n.length <= Math.min(CHAR.name.max, 10)
  && !/(.)\1\1/i.test(n) && !/[^aeıioöuü]{4}/i.test(n) && !BLOCK.has(n.toLocaleLowerCase('tr-TR'));

// Bir ad üretir. rand: [0,1) üreten işlev (sınama için verilebilir). race: 'sancak' | 'ocak', gender: 'm' | 'f'.
export function rollName(race = 'sancak', gender = 'm', rand = Math.random) {
  const P = POOL[`${race === 'ocak' ? 'ocak' : 'sancak'}:${gender === 'f' ? 'f' : 'm'}`];
  const pick = a => a[Math.floor(rand() * a.length)];
  for (let i = 0; i < 60; i++) {
    const n = join(pick(P.a), pick(P.m), pick(P.b));
    if (ok(n)) return n;
  }
  return join(P.a[1], '', P.b[0]);
}
// Birbirinden farklı birkaç aday (teklik sunucuda/depoda tek seferde sorulur)
export function rollNames(race, gender, count = 6, rand = Math.random, skip = []) {
  const seen = new Set(skip.map(x => x.toLocaleLowerCase('tr-TR'))), out = [];
  for (let i = 0; i < count * 8 && out.length < count; i++) {
    const n = rollName(race, gender, rand), k = n.toLocaleLowerCase('tr-TR');
    if (!seen.has(k)) { seen.add(k); out.push(n); }
  }
  return out;
}
