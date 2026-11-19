// Korant Online — oyun kimliği, taraflar, sınıflar ve temel kurallar.
// Dünyadaki bütün adlar (taraf, şehir, bölge, yaratık, eşya, yetenek) bu oyuna özgüdür ve
// shared/ altındaki içerik tablolarından okunur; ad değiştirmek için yalnızca bu tablolar düzenlenir.

export const GAME = { name: 'Korant Online', hub: 'Vahran Sınırı', maxLevel: 65 };
// Irk başkentleri (ana üs oyuncunun ırkının başkentidir); Yemin Pazarı iki ırkın buluştuğu tarafsız pazar kasabasıdır
export const CAPITALS = { ocak: 'Kragmir Dağ Salonları', sancak: 'Elentha Ak Kuleleri' };
export const capitalOf = f => CAPITALS[f] || GAME.hub;
// Şifacı sınıfının görünen adı tarafa göre değişir (VAHRAN): Kragmir'de Şaman, Elentha'da Şifacı. Kimlik 'priest' kalır.
export const PRIEST_NAME = { ocak: 'Şaman', sancak: 'Şifacı' };
export function applyFactionNames(f) { if (CLASSES?.priest) CLASSES.priest.name = PRIEST_NAME[f] || 'Şifacı'; }

// Dahili kimlikler kayıtlı durumu bozmamak için eski kalır: 'ocak' = Kragmir (koyu taraf), 'sancak' = Elentha (aydınlık taraf).
export const FACTIONS = {
  ocak:   { name: 'Kragmir', motto: 'Toprak, çekice boyun eğer.', color: '#c2321e', desc: 'Dağın kalbindeki salonlarda örs başında büyüyen orklar; Kral Volgar Demirdiş’in halkı.' },
  sancak: { name: 'Elentha', motto: 'Çelik bile bir gün paslanır.', color: '#3d6fb6', desc: 'Beyaz taştan kuleleri ve mavi sancaklarıyla ovanın insan krallığı; Kral Edran’ın halkı.' },
};

export const CURRENCY = {
  akce:  { name: 'Akçe',      note: 'Temel para: savaş, satış.' },
  toz:   { name: 'Örs Tozu',  note: 'Parçalanan eşyadan çıkar; bileği taşı üretir.' },
  kulce: { name: 'Külçe',     note: 'Pazar parası (Faz 2).' },
  yakut: { name: 'Yakut',     note: 'Premium para (Faz 2).' },
  san:   { name: 'Şan',       note: 'Arena puanı (Faz 2).' },
};

export const STATS = {
  str: { name: 'Güç',          desc: 'Savaşçı ve Rahibe saldırı. Öbür sınıflara etkisi yok.' },
  vit: { name: 'Dayanıklılık', desc: 'Bütün sınıflara azami can (ve biraz savunma).' },
  dex: { name: 'Çeviklik',     desc: 'Yalnız Suikastçıya: saldırı, hız ve kritik. Öbür sınıflara etkisi yok.' },
  int: { name: 'Zekâ',         desc: 'Bütün sınıflara mana; Rahibe ayrıca büyü gücü.' },
  mp:  { name: 'Büyü Gücü',    desc: 'Yalnız Büyücüye: büyü saldırısı.' }, // KO'daki MP niteliği (mana değil); 19 Kas
};
export const STAT_KEYS = Object.keys(STATS);
export const STAT_POINTS_PER_LEVEL = 3;
export const SKILL_POINTS_FROM_LEVEL = 10;   // 1. iş: yetenek ağaçları 10. seviyede açılır
export const SKILL_POINTS_PER_LEVEL = 2;
export const TREE_NODES = [5, 15, 25, 35, 45, 55, 70, 80]; // bir ağaçta yeteneklerin açıldığı puanlar
export const TREE_MAX = 60; // uzmanlık ağacı 60 puanda biter (70+ puanlıklar usta ağacında)

// base: 1. seviye değerleri · grow: seviye başına artış · k: nitelik puanının saldırıya katkısı
// bs: taban nitelik (KO düzeni; 19 Kas). Toplam nitelik = bs + dağıtılan puan + eşyadan gelen. Eşya şartı (items.js rqOf) toplamla
// karşılaştırılır. bs, 1. seviye değerlerine (base) zaten katılmış sayılır: formüllerde yalnız puan + eşya eklenir (denge değişmez).
export const CLASSES = {
  warrior: {
    name: 'Savaşçı', role: 'Ön hat: tank ya da ağır vuruş', main: 'str', armor: 'plate',
    bs: { str: 65, vit: 65, dex: 60, int: 50, mp: 50 },
    base: { hp: 440, atk: 30, mag: 0, def: 28, spd: 96, crit: 0.08 }, grow: { hp: 46, atk: 3.2, mag: 0, def: 2.9 },
    k: { str: 3, dex: 0 }, trees: ['hucum', 'siper', 'ofke'], weapons: ['sword', 'axe2', 'shield'],
  },
  rogue: {
    name: 'Suikastçı', role: 'Hız ve tek hedef hasarı', main: 'dex', armor: 'leather',
    bs: { str: 60, vit: 60, dex: 70, int: 50, mp: 50 },
    base: { hp: 260, atk: 34, mag: 0, def: 15, spd: 110, crit: 0.18 }, grow: { hp: 24, atk: 3.6, mag: 0, def: 1.5 },
    k: { str: 0, dex: 3 }, trees: ['hancer', 'yay', 'iz'], weapons: ['dagger', 'bow'],
  },
  priest: {
    name: 'Şifacı', role: 'Şifa, rün mührü ve kara rün', main: 'int', armor: 'chain',
    bs: { str: 60, vit: 60, dex: 55, int: 65, mp: 55 },
    base: { hp: 320, atk: 22, mag: 28, def: 20, spd: 100, crit: 0.06 }, grow: { hp: 32, atk: 2.2, mag: 3.0, def: 2.0 },
    k: { str: 3, dex: 0, int: 2 }, trees: ['sifa', 'kutsama', 'lanet'], weapons: ['mace', 'shield'],
  },
  mage: {
    name: 'Büyücü', role: 'Alan hasarı ve kontrol', main: 'int', armor: 'robe',
    bs: { str: 50, vit: 55, dex: 60, int: 60, mp: 70 },
    base: { hp: 250, atk: 10, mag: 38, def: 13, spd: 102, crit: 0.10 }, grow: { hp: 25, atk: 1.0, mag: 4.0, def: 1.3 },
    k: { str: 0, dex: 0, mp: 3 }, trees: ['ates', 'buz', 'yildirim'], weapons: ['staff'],
  },
};
export const CLASS_KEYS = Object.keys(CLASSES);

export const TREES = {
  hucum: { name: 'Hücum', cls: 'warrior', desc: 'Dengeli hasar ve zırh kırma.' },
  siper: { name: 'Siper', cls: 'warrior', desc: 'Tehdit çekme, kalkan ve savunma.' },
  ofke:  { name: 'Öfke',  cls: 'warrior', desc: 'Savunmadan verip hasara yüklenir.' },
  hancer: { name: 'Hançer', cls: 'rogue', desc: 'Tek hedefi eriten kritik vuruşlar.' },
  yay:    { name: 'Yay',    cls: 'rogue', desc: 'Çoklu hedef ve delici oklar.' },
  iz:     { name: 'İz',     cls: 'rogue', desc: 'Hız, kendini iyileştirme, sabotaj.' },
  sifa:    { name: 'Şifa',    cls: 'priest', desc: 'İyileştirme ve diriltme.' },
  kutsama: { name: 'Rün Mührü', cls: 'priest', desc: 'Güç ve dayanıklılık veren rün sözleri.' },
  lanet:   { name: 'Kara Rün',   cls: 'priest', desc: 'Düşmanı zayıflatan kara rünler.' },
  ates:     { name: 'Ateş',     cls: 'mage', desc: 'En yüksek alan hasarı ve yanık.' },
  buz:      { name: 'Buz',      cls: 'mage', desc: 'Yavaşlatma ve dondurma.' },
  yildirim: { name: 'Yıldırım', cls: 'mage', desc: 'Kritik hasar ve sersemletme.' },
};

// Kahraman görünümleri (prosedürel 3D model parametreleri), tarafa göre renk paleti
export const HERO_LOOKS = {
  ocak: {
    warrior: { armor: 0x8a2b22, trim: 0xd4a93a, accent: 0x1a1a1a, skin: 0xd9a47c, cape: 0x5e1414, helmet: 'horned' },
    rogue:   { armor: 0x4a2a22, trim: 0xb08d3a, skin: 0xe2b48c, cape: 0x3a1512, helmet: 'hood' },
    priest:  { armor: 0xe8dcc8, trim: 0xc2321e, skin: 0xf0c49e, cape: 0x8a2018, helmet: 'none', hair: 0x4a2a18, fx: 0xffd9a0 },
    mage:    { armor: 0xa8321e, trim: 0x2a1a12, skin: 0xd9a47c, cape: 0x5e170c, helmet: 'wizard', fx: 0xff5a00 },
  },
  sancak: {
    warrior: { armor: 0xdfe4ec, trim: 0xd9b04a, accent: 0x1f4fd1, skin: 0xe2b48c, cape: 0x1c3c9c, helmet: 'knight' },
    rogue:   { armor: 0x2f4a5a, trim: 0x9ab6c9, skin: 0xf0c49e, cape: 0x1d3040, helmet: 'hood' },
    priest:  { armor: 0xf2f0e6, trim: 0x3d6fb6, skin: 0xf3cba6, cape: 0x2d4f8a, helmet: 'none', hair: 0xe8c66a, fx: 0xfff7c0 },
    mage:    { armor: 0x2f4fa0, trim: 0xd4a93a, skin: 0xf0c49e, cape: 0x1d3270, helmet: 'wizard', fx: 0x66ccff },
  },
};

// ---- Seviye, enerji ----
export const xpNeed = lvl => 50 * lvl + 8 * lvl * lvl;
export const ENERGY = { max: 120, regenMs: 5 * 60 * 1000, levelUpBonus: 30 };
export const BAG_LIMIT = 120;
export const RESET_COST = lvl => 200 * lvl; // nitelik ya da yetenek sıfırlama (akçe)

// Durum etkileri: savaş motoru ve arayüz aynı tabloyu okur
export const STATUS = {
  atkUp:   { name: 'Güçlenme',   good: true,  icon: '⬆', desc: 'Saldırı ve büyü +%30' },
  armorUp: { name: 'Zırh',       good: true,  icon: '🛡', desc: 'Fiziksel hasara karşı düz savunma (zırh gibi). Birikmez; Kırık Zırh gelince silinir, temizlemeyle geri gelmez' },
  defUp:   { name: 'Sağlamlık',  good: true,  icon: '🛡', desc: 'Savunma +%40 (yalnız fiziksel hasara karşı; büyü hasarında işlemez)' },
  spdUp:   { name: 'Çabukluk',   good: true,  icon: '»', desc: 'Hız +%25' },
  critUp:  { name: 'Keskinlik',  good: true,  icon: '✦', desc: 'Kritik şansı +%25' },
  regen:   { name: 'Yenilenme',  good: true,  icon: '♥', desc: 'Her tur can yeniler' },
  shield:  { name: 'Kalkan',     good: true,  icon: '◈', desc: 'Hasarı emer' },
  taunt:   { name: 'Meydan Okuma', good: true, icon: '⚑', desc: 'Düşmanlar bu hedefe saldırmak zorunda' },
  provoked: { name: 'Kışkırtılmış', good: false, icon: '⚑', desc: 'Yalnız onu kışkırtana saldırabilir' },
  atkDown: { name: 'Zayıflık',   good: false, icon: '⬇', desc: 'Saldırı ve büyü −%30' },
  defDown: { name: 'Kırık Zırh', good: false, icon: '⛓', desc: 'Savunma −%40' },
  spdDown: { name: 'Yavaşlık',   good: false, icon: '«', desc: 'Hız −%25' },
  mark:    { name: 'Nişan',      good: false, icon: '◎', desc: 'Alınan hasar +%20' },
  rot:     { name: 'Çürüme',     good: false, icon: '☠', desc: 'Alınan şifa yarıya iner' },
  burn:    { name: 'Yanık',      good: false, icon: '🔥', desc: 'Her tur ateş hasarı' },
  poison:  { name: 'Zehir',      good: false, icon: '☣', desc: 'Her tur zehir hasarı' },
  stun:    { name: 'Sersemleme', good: false, icon: '✶', desc: 'Sırasını kaybeder', cc: true },
  freeze:  { name: 'Donma',      good: false, icon: '❄', desc: 'Sırasını kaybeder', cc: true },
  // uzmanlık yollarıyla gelen etkiler (paths.js, battle.js sürüm 2)
  bleed:   { name: 'Kanama',     good: false, icon: '✂', desc: 'Her tur kanama hasarı' },
  guard:   { name: 'Himaye',     good: true,  icon: '❖', desc: 'Aldığı hasarın bir kısmını onu koruyan üstlenir' },
  hpUp:    { name: 'Can Artışı', good: true,  icon: '✚', desc: 'Azami can artar (süre bitince geri iner)' },
  strUp:   { name: 'Güç Artışı', good: true,  icon: '✊', desc: 'Saldırıya düz ekleme (STR)' },
  resUp:   { name: 'Büyü Direnci', good: true, icon: '✧', desc: 'Ateş ve yıldırım hasarı azalır; yıldırım kilidi %25 az tutar' },
  weakP:   { name: 'Atak Kırığı', good: false, icon: '⤓', desc: 'Fiziksel saldırı hasarı azalır' },
  hpDown:  { name: 'Can Kaybı', good: false, icon: '✖', desc: 'Azami can azalır; süre bitince azami can geri gelir, kaybedilen can gelmez' },
  ward:    { name: 'Sakınma',    good: true,  icon: '◉', desc: 'Bir sonraki zararlı etkiyi savuşturur' },
};

// Günlük haklar sunucu saatiyle (UTC+3) 00:00'da yenilenir
export const dayKey = now => Math.floor((now + 3 * 3600 * 1000) / 86400000);
export const BOSS_PITY = 60; // bu kadar boss izi, o boss'un eşsizlerinden seçilen biriyle takas edilir
export const TURN_CAP = 400;  // bu kadar turda bitmeyen savaş kaybedilir
export const weekKey = now => Math.floor((dayKey(now) + 3) / 7); // hafta pazartesi 00:00'da (UTC+3) başlar
export const weekDay = now => (dayKey(now) + 3) % 7;             // 0 pazartesi … 5 cumartesi, 6 pazar
export const hourOf = now => Math.floor(((now + 3 * 3600 * 1000) % 86400000) / 3600000);

// Bina ve mod açılış seviyeleri (seviye)
export const UNLOCK = { anvil: 1, mine: 1, usta: 10, sweep: 15, idle: 15, market: 1, clan: 20, arena: 12, hall: 25, well: 25, wheel: 1, depth: 30, rift: 35, seal: 30, live: 30, banner: 40, siege: 40, trial: 60 };
 // 19 Kas (kullanıcı): binaların (Örs, Maden, Pazar, Kader Çarkı) seviye sınırı yok

// Günlük görevler: sayaç anahtarı, hedef, ödül
export const QUESTS = [
  { id: 'win',     name: '5 savaş kazan',            key: 'win',     need: 5, reward: { t: 'energy', n: 25 } },
  { id: 'up',      name: 'Örste 3 deneme yap',       key: 'up',      need: 3, reward: { t: 'stone', g: 0, n: 2 } },
  { id: 'break',   name: '5 eşya parçala ya da sat', key: 'break',   need: 5, reward: { t: 'akce', n: 400 } },
  { id: 'boss',    name: 'Bir günlük boss ile savaş', key: 'boss',   need: 1, reward: { t: 'yakut', n: 10 } },
  { id: 'arena',   name: 'Meydanda 2 kez dövüş',     key: 'arena',   need: 2, reward: { t: 'san', n: 40 } },
  { id: 'collect', name: 'Maden kazancını topla', key: 'collect', need: 1, reward: { t: 'stone', g: 1, n: 1 } },
];
export const QUEST_ALL = { t: 'yakut', n: 15 }; // altısı da bitince

// Kervan (premium dükkân): yakut karşılığı, günlük sınırlı
export const SHOP = [
  { id: 'energy', name: 'Enerji Erzağı', desc: '+60 enerji', cost: 30, max: 3, give: { t: 'energy', n: 60 } },
  { id: 'ticket', name: 'Meydan Bileti', desc: '+5 meydan hakkı', cost: 20, max: 2, give: null },
  { id: 'charm',  name: 'Uğur Muskası', desc: 'Örste +6 ve üstünde seviye kaybını ve kırılmayı önler', cost: 40, max: 2, give: { t: 'charm', n: 1 } },
  { id: 'stone2', name: 'Usta Bileği Taşı', desc: 'Eşsiz eşyayı basmak ve su vermek için', cost: 60, max: 2, give: { t: 'stone', g: 2, n: 1 } },
  { id: 'seal',   name: 'Mühür Taşı', desc: 'Mühürlü Oda anahtarı', cost: 50, max: 2, give: { t: 'seal', n: 1 } },
];
// Meydan Marketi: meydanda kazanılan Şan ile alınır, günlük sınırlı (Raid tarzı arena dükkânı). Kalıcı bonuslar Şan Dükkânı'ndadır (HALL).
export const ARENA_SHOP = [
  { id: 'a_stone1', name: 'Usta İşi Bileği Taşı', desc: 'Nadir eşya basmak için', cost: 120, max: 3, give: { t: 'stone', g: 1, n: 1 } },
  { id: 'a_stone2', name: 'Usta Bileği Taşı', desc: 'Eşsiz eşyayı basmak ve su vermek için', cost: 400, max: 1, give: { t: 'stone', g: 2, n: 1 } },
  { id: 'a_charm',  name: 'Uğur Muskası', desc: '+6 ve üstünde kırılmayı önler', cost: 300, max: 1, give: { t: 'charm', n: 1 } },
  { id: 'a_dust',   name: 'Örs Tozu Kesesi', desc: '+150 Örs Tozu', cost: 90, max: 3, give: { t: 'dust', n: 150 } },
  { id: 'a_energy', name: 'Savaşçı Erzağı', desc: '+30 enerji', cost: 80, max: 2, give: { t: 'energy', n: 30 } },
  { id: 'a_seal',   name: 'Mühür Taşı', desc: 'Mühürlü Oda anahtarı', cost: 350, max: 1, give: { t: 'seal', n: 1 } },
  { id: 'a_ticket', name: 'Meydan Bileti', desc: '+2 meydan hakkı', cost: 150, max: 1, give: null, tickets: 2 },
];
export const ARENA = { tickets: 10, refreshMs: 15 * 60 * 1000, refreshCost: 100, turnCap: 150 };
// Eşikler zafer başına +3 puan ölçeğine göredir (pvp.js: ARENA_PTS; eski Elo ölçeğinde 1100/1300/1500 idi)
export const LEAGUES = [{ name: 'Bronz', min: 0 }, { name: 'Gümüş', min: 1050 }, { name: 'Altın', min: 1150 }, { name: 'Şampiyon', min: 1300 }];
export const leagueOf = r => LEAGUES.findLast(l => r >= l.min);
export const HALL = { max: 10, cost: lvl => 100 * (lvl + 1), pct: 0.02, stats: { hp: 'Can', atk: 'Saldırı ve büyü', def: 'Savunma' } };
export const MINE = { max: 10, perHour: lvl => 30 * lvl, capHours: 8, upCost: lvl => 500 * lvl * lvl, trade: { akce: { ore: 1, give: { t: 'akce', n: 4 } }, stone0: { ore: 60, give: { t: 'stone', g: 0, n: 1 } }, stone1: { ore: 200, give: { t: 'stone', g: 1, n: 1 } } } };
export const IDLE = { tickMs: 10 * 60 * 1000, capHours: 8, share: 0.3 };
export const MARKET = { slots: 8, hours: 48, listFee: 0.01, tax: 0.05, dailyTx: 20, minAgeDays: 3 };
export const SHARDS = { kor: 'Kor Parçası', ayaz: 'Ayaz Parçası', simsek: 'Şimşek Parçası' };
export const WHEEL = { cost: 10, pool: [
  { w: 30, name: 'Usta Bileği Taşı', give: { t: 'stone', g: 2, n: 1 } },
  { w: 25, name: '3 İnce Bileği Taşı', give: { t: 'stone', g: 1, n: 3 } },
  { w: 22, name: 'Nadir kademe eşyası', give: 'gear' },
  { w: 15, name: 'Uğur Muskası', give: { t: 'charm', n: 1 } },
  { w: 6,  name: '20 Yakut', give: { t: 'yakut', n: 20 } },
  { w: 2,  name: 'Eşsiz eşya', give: 'unique' },
] };
export const CLAN = { cost: 5000, max: 30, tiers: [50000, 150000, 400000, 1000000], bossTurns: 60 };

// Premium: 30 günlük üyelik, üç kademe. Bronz yakutla alınır (cost); Gümüş ve Platin yalnızca gerçek parayla (yakut: false; shared/pay.js).
// xp/akce/drop: savaş kazancına ek oran · idleHours: (Çırak kaldırıldı; alan eski kayıt uyumu için duruyor) · mine: cevher çarpanı
// slots: ek pazar ilan yuvası · tickets: ek günlük meydan hakkı
export const PREMIUM = [
  { id: 0, name: 'Üyelik yok', color: '#8a8f96', cost: 0, yakut: false, days: 0, xp: 0, akce: 0, drop: 0, idleHours: 8, mine: 1, slots: 0, tickets: 0 },
  { id: 1, name: 'Bronz',  color: '#cd8a4a', cost: 500, yakut: true, days: 30, xp: 0.10, akce: 0.10, drop: 0.05, idleHours: 10, mine: 1.25, slots: 2, tickets: 2 },
  { id: 2, name: 'Gümüş',  color: '#cfd8e2', cost: 1200, yakut: false, days: 30, xp: 0.20, akce: 0.20, drop: 0.10, idleHours: 12, mine: 1.5,  slots: 4, tickets: 4 },
  { id: 3, name: 'Platin', color: '#8fe3ff', cost: 2500, yakut: false, days: 30, xp: 0.30, akce: 0.30, drop: 0.20, idleHours: 16, mine: 2,    slots: 6, tickets: 6 },
];

// Sohbet: mesaj uzunluğu, iki mesaj arası en az süre, kanal başına saklanan mesaj sayısı
export const CHAT = { max: 140, gapMs: 1500, keep: 60 };

// ---- Taraf bonusları (kalıcı) ve haftalık "üstün ırk" bonusu ----
// Tek kaynak burasıdır: sunucu kuralları (örs ücreti, maden üretimi, savaş akçesi, pazar vergisi) ve arayüz
// metinleri aynı tabloyu okur. anvilFee / mine / battleAkce: yüzde farkı · marketTax: satış vergisi oranı.
export const FACTION_BONUS = {
  ocak:   { name: 'Körük Soluğu',  anvilFee: -10, mine: 10, battleAkce: 0, marketTax: MARKET.tax },
  sancak: { name: 'Ak Taş', anvilFee: 0,   mine: 0,  battleAkce: 8, marketTax: 0.04 },
};
const NO_BONUS = { name: '', anvilFee: 0, mine: 0, battleAkce: 0, marketTax: MARKET.tax };
export const factionBonus = f => (typeof f === 'string' && Object.hasOwn(FACTION_BONUS, f) ? FACTION_BONUS[f] : NO_BONUS);
export const withPct = (n, pct) => n * (100 + pct) / 100; // tam sayı yüzdeyle çarpma (kayan nokta sapması olmasın)
const signPct = v => `${v < 0 ? '−' : '+'}%${Math.abs(v)}`;
// Bonusun oyuncuya gösterilen satırları (sayılar tablodan üretilir; metin ile kural ayrışamaz)
export function bonusLines(f) {
  const B = factionBonus(f), out = [];
  if (B.anvilFee) out.push(`Örste basma ücreti ${signPct(B.anvilFee)}`);
  if (B.mine) out.push(`Maden üretimi ${signPct(B.mine)}`);
  if (B.battleAkce) out.push(`Savaş akçesi ${signPct(B.battleAkce)}`);
  if (B.marketTax !== MARKET.tax) out.push(`Pazar vergisi %${Math.round(MARKET.tax * 100)} yerine %${Math.round(B.marketTax * 100)}`);
  return out;
}
// Büyük Sefer'in haftalık galibi ("üstün ırk"): hafta başından itibaren days gün boyunca eşya düşme oranı +%drop
export const WAR_BONUS = { name: 'Üstün Irk', drop: 20, days: 3 };
export const warBonusLine = `${WAR_BONUS.days} gün boyunca %${WAR_BONUS.drop} fazla eşya`;

// Unvanlar (çerçeve önceliği: şampiyon > Başbuğ > lider klan > premium) ve Taş Yemini'nin önbellek süresi
export const TITLES = { champ: { name: 'Şampiyon', note: 'Meydan sıralamasının birincisi' }, clan: { name: 'Lider Klan', note: 'En güçlü klanın üyesi' }, ruler: { name: 'Başbuğ', note: 'Irkının o hafta seçilmiş önderi' } };
export const CHAMP_REFRESH_MS = 10 * 60 * 1000;

// Sunucu: adı, açılış günü (UTC+3 gece yarısı) ve kısa kurallar. Sunucu paneli (ui-sunucu.js) ve etiketler bunu okur.
export const SERVER = { name: 'Ares', openAt: Date.UTC(2026, 10, 1) - 3 * 3600 * 1000, tz: 'UTC+3', rules: ['Hile, hata istismarı ve üçüncü taraf yazılım yasaktır; hesap kalıcı kapatılabilir.', 'Sohbette hakaret, nefret, spam ve kişisel bilgi paylaşımı yasaktır; süzgeç kötü sözleri gizler.', 'Hesap ve eşya alım satımı yasaktır. Hesabını kimseyle paylaşma.', 'Sorun için Menü > Sorun / Teknik Destek; hileyi sohbetteki Şikâyet ile bildir.'] };
// Hisar Kuşatması (haftalık, ırk başına bir hisar; kurallar hisarops.js, saf hesaplar hisar.js). Pencere: her hafta
// day (0 pazartesi … 5 cumartesi) hour:00'dan len dakika (UTC+3). Pencerede yapılan Hisar Kuşatması savaşları hisar
// puanı da yazar (ayrı hak: tries); sonuç pencere bitiminden grace dakika sonra kesinleşir. Vergi üçe bölünür (hisar.js splitTax).
// İttifak: aynı ırktan en çok allyMax klan. Yardım: her yardım süreli işin özgün süresinin helpPct %'i kadar kısaltır,
// toplam kısaltma en çok helpMax (2/3: süre en az 1/3'üne iner); yardım edene helpAkce akçe (günde helpDaily kez).
export const HISAR = { day: 5, hour: 20, len: 30, grace: 15, tries: 5, allyMax: 3, helpPct: 10, helpMax: 2 / 3, helpAkce: 150, helpDaily: 10, names: { ocak: 'Karakaya Hisarı', sancak: 'Yelkaya Hisarı' } };
