// Karakter görünüşü seçenek tabloları (sürüm 12). Yalnızca veri: sunucu (roster.js normLook) ve istemci (js/gorunus.js,
// oluşturma ekranı ui-olustur.js) aynı tabloyu kullanır. Seçenekler ırka ve cinsiyete göre süzülür.
//   face / hair / beard / body : küçük tamsayı kimlikler (anlamı ırka göredir: insan yüzü 2 ile ork yüzü 2 farklı çizilir)
//   hairColor / eyeColor / skin : '#rrggbb', ırkın paletinden
//   height                     : 0.94-1.06 çarpan
// Yeni seçenek eklemek: listeye yeni kimlik + ad ekle (kimlik değiştirme: kayıtlarda yazılıdır), js/gorunus.js'te çizimini ver.
// Gerçek model/yüz/saç gelince js/gorunus.js registerLook ile aynı kimliğe bağlanır; bu tablo değişmez.

export const LOOK_RACES = ['sancak', 'ocak'];
export const LOOK_GENDERS = ['m', 'f'];
export const HEIGHT = [0.94, 1.06];

// Yüz tipleri (yüz hatları, göz yapısı, burun, çene). Ork yüzleri ork anatomisidir: ağır çene, alt dişler, kaş çıkıntısı.
export const FACES = {
  sancak: [
    { id: 0, name: 'Keskin', note: 'Dar çene, uzun burun, çekik kaş' },
    { id: 1, name: 'Yumuşak', note: 'Yuvarlak hatlar, küçük burun' },
    { id: 2, name: 'Geniş', note: 'Kare çene, geniş burun' },
    { id: 3, name: 'Asil', note: 'Uzun yüz, yüksek elmacık' },
    { id: 4, name: 'Yaralı', note: 'Sert hatlar, göz üstünde yara izi' },
  ],
  ocak: [
    { id: 0, name: 'Yaban', note: 'İleri çıkık çene, kalın dişler' },
    { id: 1, name: 'Kaya Çene', note: 'Kare, çok ağır çene; büyük dişler' },
    { id: 2, name: 'Yaralı', note: 'Kırık diş, yüzünde yara izi' },
    { id: 3, name: 'Kurt Bakışlı', note: 'Çekik gözler, uzun kulaklar' },
    { id: 4, name: 'Kartal Kaş', note: 'Ağır kaş çıkıntısı, kemerli burun' },
  ],
};

// Saç biçimleri: bir kimlik listesi, ırk ve cinsiyete göre izinli olanlar ayrıca (HAIR_OK)
export const HAIRS = [
  { id: 0, name: 'Kazınmış' },
  { id: 1, name: 'Kısa' },
  { id: 2, name: 'Dağınık' },
  { id: 3, name: 'Uzun' },
  { id: 4, name: 'At kuyruğu' },
  { id: 5, name: 'Tek örgü' },
  { id: 6, name: 'Topuz' },
  { id: 7, name: 'İbik', fancy: true },
  { id: 8, name: 'Savaş örgüleri', fancy: true },
  { id: 9, name: 'Alev perçem', fancy: true },
];
export const HAIR_OK = {
  sancak: { m: [1, 2, 3, 4, 6, 9, 7, 0], f: [3, 1, 4, 5, 6, 8, 9] },
  ocak: { m: [0, 7, 2, 4, 5, 6, 8], f: [5, 3, 4, 8, 7, 0] },
};

// Sakal: kadında yalnızca "yok". Ork erkeğinin sakalı seyrektir (bıyık, çene perçemi, örgü).
export const BEARDS = [
  { id: 0, name: 'Yok' },
  { id: 1, name: 'Kirli sakal' },
  { id: 2, name: 'Kısa sakal' },
  { id: 3, name: 'Uzun sakal' },
  { id: 4, name: 'Bıyık' },
  { id: 5, name: 'Örgülü sakal' },
  { id: 6, name: 'Çene perçemi' },
];
export const BEARD_OK = {
  sancak: { m: [0, 1, 2, 3, 4, 5], f: [0] },
  ocak: { m: [0, 6, 4, 5, 1], f: [0] },
};

export const BODIES = [
  { id: 0, name: 'İnce' },
  { id: 1, name: 'Orta' },
  { id: 2, name: 'İri' },
];

// Renk paletleri (ilk renk varsayılan; eski kayıtların varsayılanı da listededir)
export const SKINS = {
  sancak: ['#e2b48c', '#f3d3b6', '#c8915f', '#a36a3e', '#7a4a2a', '#4f3020'],
  ocak: ['#7f9a5a', '#5e7a3e', '#8a8f6a', '#6e7266', '#8a5a40', '#4a5a3a'], // yeşil, zeytin, kül, kızıl kahve: yalnızca yeşil değil
};
export const HAIR_COLORS = {
  sancak: ['#3a2a1c', '#1c1a18', '#6b4226', '#8e3b1f', '#c9a050', '#e3cf8f', '#8c8a86', '#e8e4dc'],
  ocak: ['#1e1a16', '#3b2a20', '#5a1e14', '#7a6a58', '#d8d0c0', '#2e3a22', '#a8321e'],
};
export const EYE_COLORS = {
  sancak: ['#4a6a8a', '#5b3a1e', '#7a5a2a', '#3f7a4a', '#2f5fb0', '#8a8f96'],
  ocak: ['#c9a23a', '#d23c1e', '#e8d84a', '#8fd05a', '#b8e8ff', '#3a1a10'],
};
export const COLOR_NAMES = {
  '#e2b48c': 'Buğday', '#f3d3b6': 'Açık', '#c8915f': 'Esmer', '#a36a3e': 'Bronz', '#7a4a2a': 'Koyu', '#4f3020': 'Abanoz',
  '#7f9a5a': 'Yosun', '#5e7a3e': 'Orman', '#8a8f6a': 'Zeytin', '#6e7266': 'Kül', '#8a5a40': 'Kızıl kahve', '#4a5a3a': 'Bataklık',
  '#3a2a1c': 'Koyu kahve', '#1c1a18': 'Siyah', '#6b4226': 'Kestane', '#8e3b1f': 'Kızıl', '#c9a050': 'Sarı', '#e3cf8f': 'Açık sarı', '#8c8a86': 'Kır', '#e8e4dc': 'Ak',
  '#1e1a16': 'Kömür', '#3b2a20': 'Toprak', '#5a1e14': 'Kan', '#7a6a58': 'Kül', '#d8d0c0': 'Kemik', '#2e3a22': 'Yosun', '#a8321e': 'Kor',
  '#4a6a8a': 'Gri mavi', '#5b3a1e': 'Kahve', '#7a5a2a': 'Ela', '#3f7a4a': 'Yeşil', '#2f5fb0': 'Mavi', '#8a8f96': 'Gri',
  '#c9a23a': 'Kehribar', '#d23c1e': 'Kızıl', '#e8d84a': 'Sarı', '#8fd05a': 'Zehir yeşili', '#b8e8ff': 'Buz', '#3a1a10': 'Kara',
};

const r_ = race => (Object.hasOwn(SKINS, race) ? race : 'sancak');
const g_ = g => (g === 'f' ? 'f' : 'm');
// Irk + cinsiyete göre izinli seçenekler (oluşturma ekranı bunları listeler; normLook bunlarla denetler)
export function lookOptions(race, gender) {
  const r = r_(race), g = g_(gender);
  return {
    face: FACES[r].map(x => x.id), hair: HAIR_OK[r][g].slice(), beard: BEARD_OK[r][g].slice(), body: BODIES.map(x => x.id),
    hairColor: HAIR_COLORS[r].slice(), eyeColor: EYE_COLORS[r].slice(), skin: SKINS[r].slice(), height: HEIGHT.slice(),
  };
}
export const faceName = (race, id) => FACES[r_(race)].find(x => x.id === id)?.name || '';
export const hairName = id => HAIRS.find(x => x.id === id)?.name || '';
export const beardName = id => BEARDS.find(x => x.id === id)?.name || '';
export const bodyName = id => BODIES.find(x => x.id === id)?.name || '';
export const colorName = hex => COLOR_NAMES[String(hex).toLowerCase()] || String(hex);

// Irk + sınıf + cinsiyete göre varsayılan görünüş (izinli değerlerden)
const CLS_I = { warrior: 0, rogue: 1, priest: 2, mage: 3 };
export function lookDefault(race, cls, gender = 'm') {
  const r = r_(race), g = g_(gender), i = CLS_I[cls] ?? 0, O = lookOptions(r, g);
  const beard = g === 'm' && cls === 'warrior' ? (r === 'ocak' ? 6 : 2) : 0;
  return { race: r, cls, gender: g, face: O.face[i % O.face.length], hair: O.hair[i % O.hair.length], hairColor: O.hairColor[0], eyeColor: O.eyeColor[0], skin: O.skin[0], beard, body: 1, height: 1 };
}
// Tek alanın denetimi (normLook): değer ırk + cinsiyete izinli mi
export function lookFieldOk(race, gender, k, v) {
  const O = lookOptions(race, gender);
  if (k === 'hairColor' || k === 'eyeColor' || k === 'skin') return typeof v === 'string' && O[k].includes(v.toLowerCase());
  if (k === 'height') return typeof v === 'number' && v >= HEIGHT[0] && v <= HEIGHT[1];
  return Number.isInteger(v) && O[k].includes(v);
}
