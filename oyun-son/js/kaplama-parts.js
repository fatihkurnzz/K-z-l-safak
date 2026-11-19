// "kaplama" paketinin saf yardımcıları: DOM'a ve oyun durumuna dokunmaz (testlerde Node'da da çalışır).
// Kural içermez; yalnızca görünüm için sınıf adı, ikon türü ve sayı sayımı hesaplar.

// Artı seviyesinin görünüm sınıfları: +7'den itibaren ışıma başlar ve seviyeyle büyür.
// p7 / p9 eski iki basamaklı sınıflardır (rozet rengi); q7…q10 her seviyenin kendi ışıma basamağıdır (css/kaplama.css).
export function plusCls(p) {
  p = Math.floor(Number(p));
  if (!(p >= 7)) return '';
  return ` ${p >= 9 ? 'p9' : 'p7'} q${Math.min(10, p)}`;
}

// Pencere ve bölüm başlığının ikonu: başlığın ilk sözcüklerinde geçen anahtar söze göre icons.js türü. Sıra önemlidir (özel olan önce).
// Eşleşme sözcük başında aranır ("bas" → "Basma", ama "başarım" değil). Bulunamazsa boş döner; başlık süsüyle kalır.
const HEAD = [
  ['kapı', 'portal'], ['ansiklopedi', 'book'], ['sohbet', 'chat'], ['anıt', 'trophy'], ['otağ', 'crown'], ['menü', 'grid'],
  ['canlı meydan', 'timer'], ['sancak savaş', 'banner'], ['meydan', 'arena'], ['sezon', 'trophy'], ['lig', 'trophy'], ['sıra ödül', 'rank'],
  ['akın', 'akin'], ['hisar', 'siege'], ['kuşatma', 'siege'], ['büyük sefer', 'events'], ['sefer', 'events'],
  ['oba av', 'boss'], ['oba dükkân', 'cart'], ['klan', 'clan'], ['üye', 'party'], ['başvuru', 'mail'], ['davet', 'mail'], ['yetki', 'key'], ['rütbe', 'rank'], ['bağış', 'akce'],
  ['haftalık', 'quest'], ['günlük', 'quest'], ['görev', 'quest'], ['giriş takvim', 'timer'], ['takvim', 'timer'], ['başarım', 'trophy'], ['unvan', 'crown'],
  ['bildirim', 'mail'], ['posta', 'mail'], ['pazar', 'market'], ['ilan', 'pricetag'], ['satış', 'pricetag'], ['dükkân', 'cart'], ['kervan', 'wagon'],
  ['premium', 'san'], ['yakut', 'gem'], ['satın', 'gem'], ['maden', 'mine'], ['çırak', 'idle'], ['nöbet', 'idle'], ['usta', 'usta'],
  ['su ver', 'quench'], ['parçala', 'shatter'], ['bakım', 'gear'], ['örs', 'anvil'], ['bas', 'forge'], ['bileği', 'stone'],
  ['kuşan', 'armor'], ['ekipman', 'armor'], ['eşya', 'bag'], ['çanta', 'bag'], ['yetenek', 'skills'], ['nitelik', 'stats'],
  ['kadro', 'party'], ['kahraman', 'party'], ['yedek', 'party'], ['dizilim', 'list'], ['parti', 'party'],
  ['zindan', 'dungeon'], ['dipsiz kuyu', 'well'], ['yeraltı', 'depth'], ['katlar', 'depth'], ['gök yarığı', 'rift'], ['mühür', 'sealroom'], ['kader çark', 'wheel'], ['çark', 'wheel'],
  ['şan divan', 'hall'], ['divan', 'hall'], ['başbuğ', 'crown'], ['seçim', 'crown'], ['aday', 'crown'], ['ferman', 'quest'], ['hazine', 'akce'], ['ulufe', 'akce'], ['defter', 'list'],
  ['diyar', 'zones'], ['bölge', 'zones'], ['harita', 'zones'], ['hâkim', 'banner'], ['üstün ırk', 'crown'], ['ırk', 'events'], ['taraf', 'events'],
  ['hava', 'timer'], ['saat', 'timer'], ['etkin bonus', 'star'], ['bonus', 'star'], ['ayrıcalık', 'star'],
  ['savaş rapor', 'list'], ['son savaş', 'battle'], ['savunma kayıt', 'shield'], ['tur tur', 'list'], ['rapor', 'list'], ['hasar', 'atk'], ['şifa', 'hp'],
  ['sıralama', 'rank'], ['şampiyon', 'crown'], ['lider', 'crown'], ['arkadaş', 'party'], ['istek', 'mail'], ['engel', 'lock'], ['şikâyet', 'lock'],
  ['dönüm', 'xp'], ['seviye', 'xp'], ['katsayı', 'def'], ['savunma', 'def'], ['direnç', 'def'], ['saldırı', 'atk'],
  ['yaratık', 'boss'], ['boss', 'boss'], ['ganimet', 'gift'], ['nereden', 'zones'], ['ödül', 'gift'], ['sandık', 'gift'], ['hediye', 'gift'],
  ['zorluk', 'skull'], ['kademe', 'star'], ['düzen', 'list'], ['kural', 'book'], ['geçmiş', 'list'], ['istatistik', 'stats'],
];
const LETTER = 'a-zçğıöşüâîû';
const HEAD_RE = HEAD.map(([k, icon]) => [new RegExp(`(^|[^${LETTER}])${k}`), icon]);
export function headIcon(text) {
  const t = String(text ?? '').toLocaleLowerCase('tr').replace(/\s+/g, ' ').trim().slice(0, 48);
  if (!t) return '';
  for (const [re, icon] of HEAD_RE) if (re.test(t)) return icon;
  return '';
}
export const HEAD_ICONS = [...new Set(HEAD.map(x => x[1]))]; // testler: hepsi icons.js'te var mı

// Ekrandaki sayı ("51.930", "1.430 akçe"): binlik noktaları atılır; sayı yoksa null. Yalnızca tam sayı beklenir.
export function parseNum(text) {
  const m = /-?\d[\d.,]*/.exec(String(text ?? '')); // binlik ayırıcı: Türkçede nokta, İngilizce görünümde virgül
  if (!m) return null;
  const n = Number(m[0].replace(/[.,]/g, ''));
  return Number.isSafeInteger(n) ? n : null;
}
// Sayı sayımı: t 0→1 ilerlerken from'dan to'ya (sonu yumuşak). t ≥ 1'de tam olarak to döner: ekranda kalan sayı
// her zaman sunucunun verdiği değerdir.
export function tweenNum(from, to, t) {
  if (!(t < 1)) return to;
  if (!(t > 0)) return from;
  const e = 1 - (1 - t) * (1 - t) * (1 - t);
  return Math.round(from + (to - from) * e);
}
export const fmtNum = n => Math.round(n).toLocaleString(globalThis.document?.documentElement.lang === 'en' ? 'en-US' : 'tr-TR'); // sayım, ekrandaki dilin biçimiyle yazar (i18n.js)
