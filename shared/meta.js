// Kalıcılık katmanının içeriği ve saf hesapları: haftalık görevler, giriş takvimleri, başarımlar ve unvanlar,
// öğretici adımları, bildirim kategorileri ve kahramanlara seslenen kısa sözler.
// Gizli tablo içermez; istemciye sunulur (arayüz aynı tabloları ve hesapları okur). Kurallar metaops.js'tedir.
import { CLASS_KEYS, ENERGY, UNLOCK, MINE, LEAGUES, dayKey, weekKey } from './content.js';
import { MOBS, STAGES_PER_ZONE, ZONES } from './zones.js';
import { itemBase } from './items.js';
import { seasonTitle, starsOf, TIER_MAX } from './pvp.js';

// ---------- Zaman (sunucu saati UTC+3; gün 00:00'da, hafta pazartesi 00:00'da başlar) ----------
export const DAY = 86400000, HOUR = 3600000;
export const dayStart = d => d * DAY - 3 * HOUR;       // dayKey → o günün başladığı an (ms)
export const weekStart = w => dayStart(w * 7 - 3);     // weekKey → o haftanın pazartesi 00:00'ı
export const nextDayAt = now => dayStart(dayKey(now) + 1);
export const nextWeekAt = now => weekStart(weekKey(now) + 1);

// ---------- Haftalık görevler ----------
// Sayaçlar günlük görevlerle aynı olaylardan beslenir (util.js: bump); hafta değişince p.weekly ile birlikte sıfırlanır.
export const WEEKLY = [
  { id: 'win',     name: '40 savaş kazan',                           key: 'win',      need: 40, reward: { t: 'energy', n: 60 } },
  { id: 'up',      name: 'Örste 20 deneme yap',                      key: 'up',       need: 20, reward: { t: 'stone', g: 1, n: 3 } },
  { id: 'break',   name: '30 eşya parçala ya da sat',                key: 'break',    need: 30, reward: { t: 'akce', n: 2500 } },
  { id: 'boss',    name: 'Günlük Boss’larla 7 kez savaş',            key: 'boss',     need: 7,  reward: { t: 'yakut', n: 30 } },
  { id: 'arena',   name: 'Meydanda 12 kez dövüş',                    key: 'arena',    need: 12, reward: { t: 'san', n: 250 } },
  { id: 'collect', name: 'Maden kazancını 7 kez topla',  key: 'collect',  need: 7,  reward: { t: 'stone', g: 2, n: 1 } },
  { id: 'daily',   name: 'Günlük görevlerin hepsini 5 gün bitir',    key: 'dailyAll', need: 5,  reward: { t: 'charm', n: 1 } },
];
export const WEEKLY_ALL = [{ t: 'yakut', n: 50 }, { t: 'seal', n: 1 }, { t: 'charm', n: 1 }]; // yedisi de bitince (sürüm 12: kadro jetonu yerine Uğur Muskası)
export const weeklyProgress = (p, q) => Math.min(q.need, p.weekly?.q?.[q.key] || 0);
export const weeklyReady = p => WEEKLY.filter(q => weeklyProgress(p, q) >= q.need && !p.weekly?.done?.[q.id]).length
  + (WEEKLY.every(q => p.weekly?.done?.[q.id]) && !p.weekly?.done?.all ? 1 : 0);

// ---------- Aylık görevler ----------
// Takvim ayı UTC'ye göredir (ayın 1'i 00:00 UTC'de sıfırlanır). Sayaçlar günlük/haftalık görevlerle aynı olaylardan beslenir
// (util.js: count); ay değişince p.monthly ile birlikte sıfırlanır.
export const monthKey = now => { const d = new Date(now); return d.getUTCFullYear() * 12 + d.getUTCMonth(); };
export const nextMonthAt = now => { const d = new Date(now); return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1); };
export const MONTHLY = [
  { id: 'win',     name: '150 savaş kazan',                          key: 'win',      need: 150, reward: { t: 'energy', n: 150 } },
  { id: 'up',      name: 'Örste 80 deneme yap',                      key: 'up',       need: 80,  reward: { t: 'stone', g: 2, n: 3 } },
  { id: 'break',   name: '120 eşya parçala ya da sat',               key: 'break',    need: 120, reward: { t: 'akce', n: 10000 } },
  { id: 'arena',   name: 'Meydanda 50 kez dövüş',                    key: 'arena',    need: 50,  reward: { t: 'san', n: 800 } },
  { id: 'collect', name: 'Maden kazancını 25 kez topla', key: 'collect',  need: 25,  reward: { t: 'yakut', n: 60 } },
  { id: 'daily',   name: 'Günlük görevlerin hepsini 20 gün bitir',   key: 'dailyAll', need: 20,  reward: { t: 'charm', n: 2 } },
];
export const MONTHLY_ALL = [{ t: 'yakut', n: 150 }, { t: 'seal', n: 2 }, { t: 'ember', n: 2 }]; // altısı da bitince
export const monthlyProgress = (p, q) => Math.min(q.need, p.monthly?.q?.[q.key] || 0);
export const monthlyReady = p => MONTHLY.filter(q => monthlyProgress(p, q) >= q.need && !p.monthly?.done?.[q.id]).length
  + (MONTHLY.every(q => p.monthly?.done?.[q.id]) && !p.monthly?.done?.all ? 1 : 0);

// ---------- Hoş geldin postası ----------
export const WELCOME_MAIL = { id: 'welcome', text: 'Hoş geldin, kahraman! Korant Online’a adım attığın için küçük bir armağan.', give: [{ t: 'energy', n: 30 }, { t: 'akce', n: 500 }, { t: 'stone', g: 0, n: 2 }] };

// ---------- Giriş takvimleri ----------
// Ödül: grant() biçiminde ganimet listesi. { t: 'gear', g } = oyuncunun seviyesine uygun kademeden rastgele eşya (sunucu seçer).
// Yedi Gün (yeni oyuncu): gün başına bir ödül; kaçırılan gün sıfırlamaz, sıradaki ödülden devam edilir; yedi ödülle biter.
// ---------- Çevrimiçi ödülleri ----------
// Sıralı (sürüm 13): sandıklar sırayla açılır. Bir sandığın sayacı ancak bir önceki alındıktan SONRA işlemeye başlar
// (o.ms: son alımdan beri oyunda geçen süre; alınınca sıfırlanır). min: o sandık için beklenen dakika (5 + 10 + 15 + 30 + 60
// = hemen alınırsa 2 saat). Sayaç her gün 00:00'da sıfırlanır.
// Süre sunucuda sayılır: istemci açıkken dakikada bir "online.tick" gönderir, iki bildirim arası en çok ONLINE.gapMs sayılır
// (kapalı ya da arka plandaki sekme süre kazanmaz).
export const ONLINE = {
  gapMs: 90000, v: 2,
  steps: [
    { min: 5, give: [{ t: 'akce', n: 300 }, { t: 'energy', n: 10 }] },
    { min: 10, give: [{ t: 'akce', n: 600 }, { t: 'energy', n: 15 }] },
    { min: 15, give: [{ t: 'stone', g: 0, n: 3 }, { t: 'akce', n: 900 }] },
    { min: 30, give: [{ t: 'energy', n: 30 }, { t: 'stone', g: 1, n: 2 }] },
    { min: 60, give: [{ t: 'yakut', n: 15 }, { t: 'charm', n: 1 }] },
  ],
};
// Oyuncunun bugünkü çevrimiçi kaydı (gün değiştiyse sıfırdan). Eski (paralel sayaçlı) kayıt: o günün birikmiş süresi sıradaki
// sandığın süresiyle sınırlanır (bir kez); sıradaki sandık en çok "hazır" olur, sonrakiler baştan sayar.
export const onlineOf = (p, now) => {
  const d = dayKey(now), o = p.online;
  if (!o || o.day !== d) return { day: d, ms: 0, at: 0, got: [], v: ONLINE.v };
  if (o.v !== ONLINE.v) { const n = onlineNext(o); o.ms = n < 0 ? 0 : Math.min(o.ms || 0, ONLINE.steps[n].min * 60000); o.v = ONLINE.v; }
  return o;
};
// Sıradaki (alınmamış ilk) sandık; hepsi alındıysa -1
export const onlineNext = o => ONLINE.steps.findIndex((s, i) => !(o.got || []).includes(i));
export const onlineReady = (p, now) => { const o = onlineOf(p, now), n = onlineNext(o); return n >= 0 && o.ms >= ONLINE.steps[n].min * 60000 ? 1 : 0; };

export const CAL7 = [
  [{ t: 'akce', n: 500 }, { t: 'stone', g: 0, n: 3 }],
  [{ t: 'energy', n: 40 }, { t: 'yakut', n: 10 }],
  [{ t: 'akce', n: 800 }, { t: 'stone', g: 1, n: 2 }],
  [{ t: 'charm', n: 1 }, { t: 'yakut', n: 15 }],
  [{ t: 'energy', n: 60 }, { t: 'akce', n: 1500 }],
  [{ t: 'stone', g: 2, n: 1 }, { t: 'yakut', n: 20 }],
  [{ t: 'gear', g: 1 }, { t: 'yakut', n: 50 }, { t: 'seal', n: 1 }],
];
// Aylık (28 gün, yinelenir): takvim günü herkes için aynıdır; her günün kendi ödülü vardır ve yalnızca o gün alınır
// (kaçırılan günün ödülü gelmez). 7., 14., 21. günler büyük, 28. gün en büyük ödüldür.
const WEEK_ROW = [
  [{ t: 'akce', n: 300 }, { t: 'energy', n: 20 }, { t: 'stone', g: 0, n: 2 }, { t: 'yakut', n: 5 },  { t: 'akce', n: 500 },  { t: 'energy', n: 30 }],
  [{ t: 'akce', n: 600 }, { t: 'energy', n: 30 }, { t: 'stone', g: 1, n: 1 }, { t: 'yakut', n: 8 },  { t: 'akce', n: 900 },  { t: 'energy', n: 40 }],
  [{ t: 'akce', n: 1000 }, { t: 'energy', n: 40 }, { t: 'stone', g: 1, n: 2 }, { t: 'yakut', n: 10 }, { t: 'akce', n: 1400 }, { t: 'energy', n: 50 }],
  [{ t: 'akce', n: 1500 }, { t: 'energy', n: 50 }, { t: 'stone', g: 2, n: 1 }, { t: 'yakut', n: 15 }, { t: 'akce', n: 2000 }, { t: 'energy', n: 60 }],
];
const WEEK_END = [
  [{ t: 'yakut', n: 15 }, { t: 'stone', g: 1, n: 1 }],
  [{ t: 'yakut', n: 25 }, { t: 'charm', n: 1 }],
  [{ t: 'yakut', n: 35 }, { t: 'stone', g: 2, n: 1 }],
  [{ t: 'yakut', n: 80 }, { t: 'gear', g: 1 }, { t: 'seal', n: 1 }, { t: 'charm', n: 1 }],
];
export const CAL28 = WEEK_ROW.flatMap((row, w) => [...row.map(d => [d]), WEEK_END[w]]);
export const CAL_KEYS = ['n7', 'm28'];
export const monthCycle = now => Math.floor((dayKey(now) + 3) / 28); // döngü pazartesi başlar
export const monthDay = now => (dayKey(now) + 3) % 28;               // 0 … 27
export const monthEndAt = now => dayStart((monthCycle(now) + 1) * 28 - 3);
// Bu döngüde alınan günler (kayıttaki döngü eskiyse boş)
export const monthGot = (p, now) => (p.cal?.m?.c === monthCycle(now) ? p.cal.m.got : []);
export const cal7Ready = (p, now) => !!p.cal && p.cal.n7.n < CAL7.length && p.cal.n7.day !== dayKey(now);
export const cal28Ready = (p, now) => !!p.cal && !monthGot(p, now).includes(monthDay(now));
export const calReady = (p, now) => +cal7Ready(p, now) + +cal28Ready(p, now);

// ---------- Başarımlar ve unvanlar ----------
// Her başarım: kademeler (tiers), ilerleme değeri v(p) (yalnızca sunucuda tutulan kayıttan okunur), kazandırdığı unvan
// (ilk kademede) ve kademe başına kalıcı bonus (stat: hp | atk | def). Olay sayaçları p.ach.c'dedir (metaops.js yazar).
// Toplam bonus stat başına ACH_CAP ile sınırlıdır: eski oyuncu yeni oyuncuyu sınırsız geçemez.
export const ACH_STEP = 0.005, ACH_CAP_STEPS = 10, ACH_CAP = ACH_STEP * ACH_CAP_STEPS; // kademe başına +%0,5 · stat başına en çok +%5
export const ACH_CATS = { anvil: 'Örs', mine: 'Maden', battle: 'Savaş', boss: 'Boss', arena: 'Meydan', clan: 'Klan', market: 'Pazar', coll: 'Koleksiyon', loyal: 'Sadakat', realm: 'Irk' };
export const ACH_STAT = { hp: 'Can', atk: 'Saldırı ve büyü', def: 'Savunma' };
const nf = n => n.toLocaleString('tr-TR');
const C = (p, k) => p.ach?.c?.[k] || 0;
const BOSSES = Object.keys(MOBS).filter(m => MOBS[m].boss && !MOBS[m].event);
const sumOf = o => { let a = 0; for (const k in o) a += o[k] || 0; return a; };
const bossKills = p => BOSSES.reduce((a, m) => a + (p.codex[m]?.k || 0), 0);
const uniquesHeld = p => new Set(p.items.filter(it => itemBase(it.b)?.unique).map(it => it.b)).size;
export const ACH = [
  // Örs
  { id: 'upok',    cat: 'anvil', name: 'Çekiç Sesi',       title: 'Çekiç Ustası',   stat: 'atk', tiers: [10, 100, 500],          text: n => `Örste ${nf(n)} başarılı basma yap`,              v: p => p.stats.upOk },
  { id: 'uptry',   cat: 'anvil', name: 'Yılmayan Bilek',   title: 'Yılmaz Bilek',   stat: 'def', tiers: [25, 250, 1500],         text: n => `Örste ${nf(n)} deneme yap`,                      v: p => p.stats.upOk + p.stats.upFail },
  { id: 'plus',    cat: 'anvil', name: 'Artının Peşinde',  title: 'Keskin Demir',   stat: 'atk', tiers: [5, 7, 9],               text: n => `Bir eşyayı +${n} yap`,                           v: p => C(p, 'plus') },
  { id: 'reforge', cat: 'anvil', name: 'Suyun Sırrı',      title: 'Su Ustası',      stat: 'def', tiers: [1, 5, 15],              text: n => `${nf(n)} eşyaya su ver`,                         v: p => C(p, 'reforge') },
  { id: 'break',   cat: 'anvil', name: 'Hurda Dağı',       title: 'Hurdacıbaşı',    stat: 'hp',  tiers: [50, 500, 2500],         text: n => `${nf(n)} eşya parçala ya da sat`,                v: p => C(p, 'break') },
  { id: 'craft',   cat: 'anvil', name: 'Taş Yontan',       title: 'Taş Yontucu',    stat: 'def', tiers: [10, 100, 500],          text: n => `${nf(n)} bileği taşı üret`,                      v: p => C(p, 'craft') },
  // Maden
  { id: 'minelvl', cat: 'mine',  name: 'Derin Damar',      title: 'Damar Bulucu',   stat: 'hp',  tiers: [3, 6, MINE.max],        text: n => `Madeni ${n}. seviyeye çıkar`,                    v: p => p.mine.lvl },
  { id: 'ore',     cat: 'mine',  name: 'Cevher Yükü',      title: 'Cevher Beyi',    stat: 'def', tiers: [2000, 20000, 150000],   text: n => `Madenden ${nf(n)} cevher topla`,                 v: p => C(p, 'ore') },
  // Savaş
  { id: 'wins',    cat: 'battle', name: 'Cenk Meydanı',    title: 'Cenk Eri',       stat: 'atk', tiers: [1, 50, 500, 3000],      text: n => `${nf(n)} savaş kazan`,                           v: p => p.stats.wins },
  { id: 'stars',   cat: 'battle', name: 'Yıldız Toplayan', title: 'Yıldızlı',       stat: 'hp',  tiers: [30, 150, ZONES.length * STAGES_PER_ZONE * 3], text: n => `Aşamalardan ${nf(n)} yıldız topla`, v: p => sumOf(p.stages) },
  { id: 'zones',   cat: 'battle', name: 'Diyar Diyar',     title: 'Diyar Fatihi',   stat: 'atk', tiers: ZONES.map((_, i) => i + 1), text: n => `${n} bölgenin son Boss’unu yen`,               v: p => ZONES.filter(z => p.stages[`${z.id}-${STAGES_PER_ZONE}`]).length },
  { id: 'level',   cat: 'battle', name: 'Yol Görmüş',      title: 'Yol Görmüş',     stat: 'hp',  tiers: [10, 30, 50, 65],        text: n => `Seviye ${n} ol`,                         v: p => p.lvl },
  { id: 'well',    cat: 'battle', name: 'Dipsiz Yürek',    title: 'Kuyu Bekçisi',   stat: 'def', tiers: [5, 10],                 text: n => `Dipsiz Kuyu’da ${n} dalga temizle`,              v: p => p.wellBest },
  { id: 'depth',   cat: 'battle', name: 'Yerin Dibi',      title: 'Derin Yürüyen',  stat: 'hp',  tiers: [10, 25, 50],            text: n => `Yeraltı Ocağı’nda ${n}. kata in`,                v: p => Math.max(p.depth, p.depthBest || 0) },
  { id: 'tiers',   cat: 'battle', name: 'Zorun Zoru',      title: 'Çetin Ceviz',    stat: 'def', tiers: [1, ZONES.length, ZONES.length * TIER_MAX], text: n => `Çetin ve Yaman kademelerde ${n} bölgenin son Boss’unu yen`, v: p => { let a = 0; for (let t = 1; t <= TIER_MAX; t++) a += ZONES.filter(z => starsOf(p, t)[`${z.id}-${STAGES_PER_ZONE}`]).length; return a; } },
  // Boss
  { id: 'bosskill', cat: 'boss', name: 'Baş Avı',          title: 'Baş Avcısı',     stat: 'atk', tiers: [5, 50, 300],            text: n => `${nf(n)} boss kes`,                              v: bossKills },
  { id: 'bosskind', cat: 'boss', name: 'Büyük Av',         title: 'Av Beyi',        stat: 'def', tiers: [3, 8, BOSSES.length],   text: n => `${n} farklı Boss’u yen`,                         v: p => BOSSES.filter(m => p.codex[m]?.k > 0).length },
  { id: 'seal',    cat: 'boss',  name: 'Mühür Kıran',      title: 'Mühür Kıran',    stat: 'atk', tiers: [1, 10, 50],             text: n => `Mühürlü Oda’yı ${n} kez kazan`,                  v: p => C(p, 'seal') },
  // Meydan
  { id: 'awins',   cat: 'arena', name: 'Meydan Tozu',      title: 'Meydan Eri',     stat: 'atk', tiers: [1, 50, 300],            text: n => `Meydanda ${nf(n)} zafer kazan`,                  v: p => p.arena.wins },
  { id: 'rating',  cat: 'arena', name: 'Lig Basamakları',  title: 'Lig Yıldızı',    stat: 'def', tiers: LEAGUES.slice(1).map(l => l.min), text: n => `Meydan puanını ${nf(n)}’e çıkar (${LEAGUES.findLast(l => n >= l.min).name} ligi)`, v: p => C(p, 'rating') },
  { id: 'hall',    cat: 'arena', name: 'Divan Kürsüsü',    title: 'Divan Üyesi',    stat: 'hp',  tiers: [5, 15, 30],             text: n => `Şan Divanı’nda toplam ${n} seviye al`,           v: p => sumOf(p.hall) },
  { id: 'live',    cat: 'arena', name: 'Göz Göze',         title: 'Gözü Pek',       stat: 'atk', tiers: [1, 25],                 text: n => `Canlı Meydan’da ${n} zafer kazan`,               v: p => C(p, 'live') },
  { id: 'season',  cat: 'arena', name: 'Sezon Emektarı',   title: 'Sezon Eri',      stat: 'hp',  tiers: [1, 3, 12],              text: n => `${n} meydan sezonunu ödülle kapat`,              v: p => C(p, 'season') },
  // Klan
  { id: 'clan',    cat: 'clan',  name: 'Oba Ateşi',        title: 'Obalı',          stat: 'hp',  tiers: [1],                     text: () => 'Bir klana katıl ya da klan kur',                v: p => C(p, 'clan') },
  { id: 'clandmg', cat: 'clan',  name: 'Dev Deviren',      title: 'Dev Deviren',    stat: 'atk', tiers: [10000, 100000, 1000000], text: n => `Oba Avı’nda toplam ${nf(n)} hasar ver`,          v: p => C(p, 'clanDmg') },
  { id: 'siege',   cat: 'clan',  name: 'Burç Döven',       title: 'Burç Yıkan',     stat: 'def', tiers: [1000, 10000, 60000],    text: n => `Hisar Kuşatması’nda toplam ${nf(n)} puan topla`, v: p => C(p, 'siege') },
  { id: 'banner',  cat: 'clan',  name: 'Sancak Altında',   title: 'Sancaktar',      stat: 'hp',  tiers: [9, 90, 450],            text: n => `Sancak Savaşı’nda toplam ${n} kontrol noktası al`, v: p => C(p, 'banner') },
  // Pazar
  { id: 'sold',    cat: 'market', name: 'Tezgâh Açan',     title: 'Tezgâh Beyi',    stat: 'def', tiers: [1, 20, 100],            text: n => `Pazarda ${n} eşya sat`,                          v: p => C(p, 'sold') },
  { id: 'bought',  cat: 'market', name: 'Pazar Gezen',     title: 'Pazar Kurdu',    stat: 'hp',  tiers: [1, 20, 100],            text: n => `Pazardan ${n} eşya satın al`,                    v: p => C(p, 'bought') },
  { id: 'sale',    cat: 'market', name: 'Dolu Kese',       title: 'Dolu Kese',      stat: 'def', tiers: [5000, 50000, 500000],   text: n => `Pazar satışlarından ${nf(n)} akçe kazan`,        v: p => C(p, 'sale') },
  // Koleksiyon
  { id: 'codex',   cat: 'coll',  name: 'Gören Göz',        title: 'Bilge Gezgin',   stat: 'def', tiers: [10, 25, Object.keys(MOBS).length], text: n => `Ansiklopedide ${n} yaratık keşfet`,   v: p => Object.keys(p.codex).filter(m => Object.hasOwn(MOBS, m)).length },
  { id: 'kills',   cat: 'coll',  name: 'Bin Kesim',        title: 'Bin Kesen',      stat: 'atk', tiers: [500, 5000, 30000],      text: n => `Toplam ${nf(n)} yaratık kes`,                    v: p => { let a = 0; for (const m in p.codex) a += p.codex[m].k || 0; return a; } },
  { id: 'uniq',    cat: 'coll',  name: 'Nadide Sandık',    title: 'Hazine Bekçisi', stat: 'hp',  tiers: [1, 5, 12],              text: n => `Aynı anda ${n} farklı Eşsiz eşyaya sahip ol`,    v: uniquesHeld },
  { id: 'slots',   cat: 'coll',  name: 'Tam Donanım',      title: 'Tam Donanımlı',  stat: 'def', tiers: [7, 13],                 text: n => `Karakterinin ${n} yuvasını doldur`,            v: p => Math.max(...Object.values(p.heroes).map(h => Object.keys(h.eq).length)) },
  { id: 'wheel',   cat: 'coll',  name: 'Çark Çeviren',     title: 'Kader Ortağı',   stat: 'hp',  tiers: [5, 50],                 text: n => `Kader Çarkı’nı ${n} kez çevir`,                  v: p => C(p, 'wheel') },
  // Sadakat
  { id: 'dailyall', cat: 'loyal', name: 'Sözünün Eri',     title: 'Sözünün Eri',    stat: 'hp',  tiers: [3, 30, 100],            text: n => `Günlük görevlerin hepsini ${n} gün bitir`,       v: p => C(p, 'dailyAll') },
  { id: 'weeklyall', cat: 'loyal', name: 'Haftanın Hakkı', title: 'Hafta Bekçisi',  stat: 'def', tiers: [1, 10, 40],             text: n => `Haftalık görevlerin hepsini ${n} hafta bitir`,   v: p => C(p, 'weeklyAll') },
  { id: 'cal',     cat: 'loyal', name: 'Kapıyı Aşındıran', title: 'Müdavim',        stat: 'hp',  tiers: [7, 28, 100],            text: n => `Takvimden ${n} ödül al`,                         v: p => C(p, 'cal') },
  // Irk (realm.js): bölge hâkimiyeti için kazanılan zafer puanı, Başbuğ seçiminde kullanılan oy, Başbuğ olunan hafta
  { id: 'terr',    cat: 'realm', name: 'Sınır Boyu',       title: 'Uç Beyi',        stat: 'atk', tiers: [25, 500, 5000],         text: n => `Bölgelerde ırkın için ${nf(n)} zafer puanı topla`, v: p => C(p, 'terr') },
  { id: 'vote',    cat: 'realm', name: 'Söz Hakkı',        title: 'Otağ Eri',       stat: 'def', tiers: [1, 8, 30],              text: n => `Başbuğ seçiminde ${n} hafta oy kullan`,          v: p => C(p, 'vote') },
  { id: 'ruled',   cat: 'realm', name: 'Tuğ Sahibi',       title: 'Tuğ Sahibi',     stat: 'hp',  tiers: [1, 4],                  text: n => `${n} hafta ırkının Başbuğu ol`,                  v: p => C(p, 'ruled') },
];
export const ACH_BY = Object.fromEntries(ACH.map(A => [A.id, A]));
export const achOf = id => (typeof id === 'string' && Object.hasOwn(ACH_BY, id) ? ACH_BY[id] : null);
export const achValue = (p, A) => Math.max(0, Math.floor(+A.v(p) || 0));
export const achTier = (p, A) => { const v = achValue(p, A); return A.tiers.filter(n => v >= n).length; };
// Kazanılmış kademe (kayıtta saklanır; değer sonradan düşse de geri alınmaz)
export const achHeld = (p, id) => (p.ach?.t && Object.hasOwn(p.ach.t, id) ? p.ach.t[id] : 0);
// Başarımlardan gelen kalıcı bonus: stat başına kazanılmış kademe sayısı (steps) ve sınırlanmış oran (pct)
export function achBonus(p) {
  const steps = { hp: 0, atk: 0, def: 0 };
  if (p.ach?.t) for (const A of ACH) steps[A.stat] += achHeld(p, A.id);
  const pct = {};
  for (const k in steps) pct[k] = Math.min(ACH_CAP_STEPS, steps[k]) * ACH_STEP;
  return { steps, pct };
}
// Yüzde metni: 3 kademe → "%1,5"
export const stepPct = n => '%' + String(Math.round(n * ACH_STEP * 1000) / 10).replace('.', ',');
// Seçili unvanın adı (geçersiz ya da kazanılmamış kimlik için null)
export const achTitle = id => achOf(id)?.title || seasonTitle(id) || null; // sezon unvanları: pvp.js

// ---------- Öğretici ----------
// Adımlar sırayla ilerler (p.tut.s = bulunulan adımın indisi). Bir adımdan çıkmak için gereken gerçek ilerleme
// sunucuda aranır (TUT_NEED); bitiren hediye alır (bir kez), atlayan almaz. Bitince ya da atlanınca bir daha açılmaz.
// Akış (sürüm 13: 'story'…'carsi' adımları açılış ormanında, js/orman.js): ormanda patikayı tutan birkaç yaratık kes → izci seni Yemin Pazarı'na götürür → tüccardan ilk paranla silah al ve kuşan → çocuk kardeşini
// yutan Dev Solucan'ı anlatır → solucanı kes, kardeşi kurtar (illüstrasyon) → Yemin Pazarı'na dön → yetenek, görev, sohbet.
// 'bar' (sürüm 12): savaş çubuğu: bir savaşta en az bir yetenek ve bir iksir kullanılır (game.js battle.finish p.tut.f.sk / pot).
// Kayıttaki adım indisi bu adım eklenmeden önceki listeye göre yazılmışsa (p.tut.sv yok) state.js bir kez kaydırır.
export const TUT_STEPS = ['story', 'battle', 'bar', 'hunt', 'carsi', 'merchant', 'equip', 'child', 'worm', 'rescue', 'skills', 'quests', 'chat'];
export const TUT_SV = 2; // adım listesinin sürümü
export const TUT_HUNT = 3; // öğreticide kazanılacak savaş sayısı (ilk savaş dahil)
export const TUT_NEED = {
  battle: { ok: p => p.stats.wins >= 1, hint: 'Önce ilk savaşını kazan.' },
  // iksiri hiç kalmamışsa (hepsini içmiş, almamış) yalnızca yetenek yeter: adım kilitlenmez
  bar:    { ok: p => !!p.tut.f.pot || !((p.pots?.hp | 0) + (p.pots?.mp | 0)), hint: 'Önce bir savaşta bir iksir iç.' }, // 19 Kas: yetenek isteğe bağlı; iksirsiz savaş kilitliydi (combat.js TUTLOCK)
  hunt:   { ok: p => p.stats.wins >= TUT_HUNT, hint: `Önce ${TUT_HUNT} savaş kazan.` },
  merchant: { ok: p => !!p.tut.f.buy, hint: 'Önce tüccardan bir silah al.' },
  // alınan silah elden çıkarılmışsa (satıldı, parçalandı) adım kilitlenmez
  equip:  { ok: p => !tutItemHeld(p) || Object.values(p.heroes).some(h => Object.values(h.eq).includes(p.tut.f.buyId)), hint: 'Önce yeni silahını kuşan.' },
  worm:   { ok: p => !!p.tut.f.worm, hint: 'Önce Dev Solucan’ı yen.' },
  quests: { ok: p => !!p.tut.f.q,       hint: 'Önce Görevler’den bir ödül al.' },
};
export const TUT_ITEM = { t: 'item', b: 'a:warrior:0:helm', g: 1 }; // eski ad (Savaşçı miğferi); kural tutItem'i kullanır
export const tutItem = p => ({ t: 'item', b: `a:${p.char?.cls || p.heroes?.h0?.cls || 'warrior'}:0:helm`, g: 1 }); // öğreticide verilen miğfer: karakterin sınıfına göre
export const TUT_GIFT = [{ t: 'yakut', n: 30 }, { t: 'akce', n: 1000 }, { t: 'energy', n: 40 }, { t: 'stone', g: 0, n: 5 }, { t: 'charm', n: 1 }];
export const tutActive = p => !!p.tut && !p.tut.end;
export const tutItemHeld = p => p.items.some(it => it.id === p.tut?.f?.buyId); // tüccardan alınan öğretici silahı çantada mı

// ---------- Bildirimler ----------
// Kategori: oyuncunun ayrı ayrı kapatabildiği gruplar (ayar sunucuda p.notif.off'ta saklanır).
export const NOTIF_CATS = {
  energy: { name: 'Enerji',                note: 'Enerji tamamen dolunca' },
  stock:  { name: 'Maden ve Bakım',        note: 'Maden deposu dolunca, Bakım süresi bitince' },
  market: { name: 'Pazar ve posta',        note: 'Eşyan satılınca, postana bir şey düşünce' },
  arena:  { name: 'Meydan',                note: 'Savunmana saldırılınca' },
  clan:   { name: 'Klan',                  note: 'Katılan, ayrılan, rütbe ve seviye değişimi, açılan sandık' },
  reset:  { name: 'Yenilenme ve takvim',   note: 'Günlük ve haftalık görevler yenilenince, takvim ödülü hazır olunca' },
  ach:    { name: 'Başarımlar',            note: 'Yeni başarım ve unvan kazanınca' },
  social: { name: 'Arkadaşlar',            note: 'Arkadaşlık isteği gelince' },
  realm:  { name: 'Irk ve diyar',          note: 'Yeni Başbuğ seçilince, ferman yazılınca, ulufe gelince, bölgeler el değiştirince' },
};
// Tür: bildirimin kategorisi, dokununca açılan ekran (go) ve cihaz bildiriminin başlığı
export const NOTIF_KIND = {
  energy: { cat: 'energy', go: 'gate',     head: 'Enerji doldu' },
  mine:   { cat: 'stock',  go: 'mine',     head: 'Maden deposu doldu' },
  idle:   { cat: 'stock',  go: 'mine',     head: 'Çırak deposu doldu' }, // Çırak kaldırıldı; tür eski kayıtlar için durur
  farm:   { cat: 'stock',  go: 'farm',     head: 'Nöbet deposu doldu' },      // pvpops.js: Nöbet (uzun oto-farm) tavana ulaşınca
  sale:   { cat: 'market', go: 'mail',     head: 'Eşyan satıldı' },
  mail:   { cat: 'market', go: 'mail',     head: 'Postan var' },
  arena:  { cat: 'arena',  go: 'deflog',   head: 'Meydanda sınandın' },         // rapor paketi: saldırının tur tur kaydı açılır
  clan:   { cat: 'clan',   go: 'clan',     head: 'Klan haberi' },
  week:   { cat: 'reset',  go: 'weekly',   head: 'Haftalık görevler yenilendi' },
  cal:    { cat: 'reset',  go: 'calendar', head: 'Takvim ödülün hazır' },
  daily:  { cat: 'reset',  go: 'quests',   head: 'Günlük görevler yenilendi' },
  ach:    { cat: 'ach',    go: 'ach',      head: 'Yeni başarım' },
  friend: { cat: 'social', go: 'friends',  head: 'Arkadaşlık isteği' },       // social.js: bekleyen istekler
  card:   { cat: 'reset',  go: 'paycard',  head: 'Yakut Kartı payın hazır' }, // pay.js: kart sürerken günün alınmamış yakutu
  // realmops.js: ırkın haftalık seçimi, Başbuğun fermanı, hazineden gelen ulufe (posta), bu haftanın bölge hâkimiyeti
  ruler:  { cat: 'realm',  go: 'otag',     head: 'Yeni Başbuğ' },
  ferman: { cat: 'realm',  go: 'irk',      head: 'Başbuğ fermanı' },
  grant:  { cat: 'realm',  go: 'mail',     head: 'Ulufe geldi' },
  terr:   { cat: 'realm',  go: 'map',      head: 'Bölgeler paylaşıldı' },
  roster: { cat: 'ach',    go: 'party',    head: 'Kadroda yer açıldı' },      // sürüm 12'de üretilmez (kadro kalktı); eski kayıttaki bildirim için durur
  upkeep: { cat: 'stock',  go: 'bakim',    head: 'Bakım süresi doldu' },      // sinks.js: Örs'teki Bakım hizmeti bitince
  path:   { cat: 'ach',    go: 'yol',      head: 'Uzmanlık yolu açıldı' },    // paths.js: parti 30. seviyeye gelince (yolu seçilmemiş kahraman kaldıkça)
};
export const NOTIF_KEEP = 3 * DAY; // bundan eski kayıt listede gösterilmez (posta, alınana kadar görünür)

// Kahramanlara seslenen kısa sözler. Her olay için: herkese (any), tarafa (ocak / sancak) ve sınıfa özel çeşitler.
// Bildirim başlığı ve ara sıra çıkan kısa ileti olarak kullanılır; hepsi bu oyuna özgüdür.
export const HYPE = {
  energy: {
    any: ['Soluk tamam. Kapı açık, yol senin.', 'Enerji doldu. Boşa akmasın, sefere çık.'],
    ocak: ['Ocak harlandı. Demir tavında, vur.'], sancak: ['Rüzgâr arkanda. Sancağı kaldır.'],
    warrior: ['Savaşçı, kalkanın hazır. Ön saf seni bekliyor.'], rogue: ['Suikastçı, hançerler bilendi. Gölgeler seni soruyor.'],
    priest: ['Şifacı, ellerin dinlendi. Yol seni bekliyor.'], mage: ['Büyücü, zihnin berrak. Kıvılcım parmak ucunda.'],
  },
  mine: {
    any: ['Maden deposu doldu. Kazmalar boş beklemesin.', 'Cevher taşmak üzere. Bir uğra, yükü al.'],
    ocak: ['Kragmir’in körükleri cevher bekliyor. Depo dolu.'], sancak: ['Kervan yükünü bekliyor. Maden deposu dolu.'],
    warrior: ['Savaşçı, yeni zırhın cevheri hazır. Depoyu boşalt.'], rogue: ['Suikastçı, parıltıyı senden iyi kim sezer? Depo dolu.'],
    priest: ['Şifacı, madenciler mola istiyor. Depoyu boşalt.'], mage: ['Büyücü, damarlar ışıldıyor. Cevher seni bekliyor.'],
  },
  idle: {
    any: ['Çırak kesesini doldurdu. Emeğini teslim al.', 'Çırağın eli boş durmadı. Birikeni topla.'],
    ocak: ['Çırak ocak başında bekliyor. Kazancı hazır.'], sancak: ['Çırak nöbetten döndü. Heybesi dolu.'],
    warrior: ['Savaşçı, çırağın senin gibi dövüştü. Kazancı al.'], rogue: ['Suikastçı, çırak işini sessizce bitirdi. Pay zamanı.'],
    priest: ['Şifacı, çırağın yorgun ama kesesi dolu.'], mage: ['Büyücü, çırak defteri doldurdu. Bir göz at.'],
  },
  farm: {
    any: ['Nöbet bitti. Heybeler dolu, yol seni bekliyor.', 'Nöbet deposu doldu. Ganimeti teslim al.'],
    ocak: ['Ork akıncıları nöbetten döndü. Kazancı topla.'], sancak: ['İnsan nöbetçileri döndü. Kazancı topla.'],
    warrior: ['Savaşçı, nöbet yerinde tutuldu. Ganimet hazır.'], rogue: ['Suikastçı, nöbette boş durmadın. Torbaya bak.'],
    priest: ['Şifacı, nöbet kazasız bitti. Kazancı topla.'], mage: ['Büyücü, nöbet defteri kapandı. Ganimete bak.'],
  },
  sale: {
    any: ['Malın alıcısını buldu. Akçe postada.', 'Pazarda el sıkışıldı. Kesen ağırlaşacak.'],
    ocak: ['Ork işi mal kapış kapış. Akçen postada.'], sancak: ['Kervan yolu bereketli. Satışın akçesi postada.'],
    warrior: ['Savaşçı, tezgâhın boşaldı. Akçen postada bekliyor.'], rogue: ['Suikastçı, bu kez alnının akıyla kazandın. Akçe postada.'],
    priest: ['Şifacı, pazar yüzüne güldü. Akçen postada.'], mage: ['Büyücü, hesap tuttu. Satışın akçesi postada.'],
  },
  mail: {
    any: ['Ulak kapıda. Postanda seni bekleyen var.', 'Postana yeni bir kese düştü.'],
    ocak: ['Kragmir’den haber var. Postanı aç.'], sancak: ['İnsan ulağı geldi. Postanı aç.'],
    warrior: ['Savaşçı, ulak seni arıyor. Postana bak.'], rogue: ['Suikastçı, adına mühürlü bir paket var.'],
    priest: ['Şifacı, postanda bir emanet bekliyor.'], mage: ['Büyücü, ulak mektubunu bıraktı.'],
  },
  arena: {
    any: ['Meydanda adın geçti. Savunman sınandı.', 'Biri kapını çaldı. Meydan seni soruyor.'],
    ocak: ['Kragmir’e el uzatan oldu. Karşılığını meydanda ver.'], sancak: ['Elentha’ya meydan okundu. Cevabı sen ver.'],
    warrior: ['Savaşçı, kalkanına vuran oldu. Sıra sende.'], rogue: ['Suikastçı, izini süren biri var. Önce sen bul.'],
    priest: ['Şifacı, gücün meydanda sınandı. Safları sıklaştır.'], mage: ['Büyücü, biri ateşinle oynadı. Meydanda görüş.'],
  },
  clan: {
    any: ['Obada hareket var. Klanına bir uğra.', 'Klan ateşinin başında yeni haber var.'],
    ocak: ['Ork ateşi başı kalabalıklaştı. Klanına bak.'], sancak: ['Elentha’nın bayrağı altında yeni haber var. Klanına bak.'],
    warrior: ['Savaşçı, klanın omuz omuza. Yerini al.'], rogue: ['Suikastçı, obada fısıltı dolaşıyor. Kulak ver.'],
    priest: ['Şifacı, klanın seni soruyor.'], mage: ['Büyücü, klan meclisinde söz sende.'],
  },
  week: {
    any: ['Yeni hafta, yeni av. Haftalık görevler yenilendi.', 'Sayfa çevrildi. Bu hafta kimin adı anılacak?'],
    ocak: ['Kragmir yeni haftaya harlı giriyor. Görevler yenilendi.'], sancak: ['Elentha yeni haftaya dalgalanarak giriyor. Görevler yenilendi.'],
    warrior: ['Savaşçı, hafta yeni başladı. İlk darbe senden.'], rogue: ['Suikastçı, yeni hafta yeni ganimet demek.'],
    priest: ['Şifacı, önümüzde uzun bir hafta var. Diyar sana güveniyor.'], mage: ['Büyücü, haftanın ilk kıvılcımını sen çak.'],
  },
  cal: {
    any: ['Bugünkü takvim ödülün hazır. Almadan geçme.', 'Takvimde bugünün kutusu seni bekliyor.'],
    ocak: ['Kragmir’in payı ayrıldı. Takvim ödülünü al.'], sancak: ['Elentha’nın payı ayrıldı. Takvim ödülünü al.'],
    warrior: ['Savaşçı, bugünün payı hazır. Uzan ve al.'], rogue: ['Suikastçı, bedava ganimeti kaçırma. Takvime bak.'],
    priest: ['Şifacı, bugünün armağanı seni bekliyor.'], mage: ['Büyücü, takvimde bugünün kutusu açıldı.'],
  },
  daily: {
    any: ['Gün döndü. Görevler ve haklar yenilendi.', 'Yeni gün, taze haklar. Vahran Sınırı seni bekliyor.'],
    ocak: ['Kragmir bugün de yanıyor. Günlük görevler yenilendi.'], sancak: ['Gün ağardı, sancak göklerde. Görevler yenilendi.'],
    warrior: ['Savaşçı, yeni gün yeni cenk. Görevler hazır.'], rogue: ['Suikastçı, günün ilk avı seni bekliyor.'],
    priest: ['Şifacı, sefer hazırlığı başladı. Günlük görevler yenilendi.'], mage: ['Büyücü, bugünün sınavları hazır.'],
  },
  ach: {
    any: ['Adın Vahran Sınırı’nda dilden dile. Yeni başarım!', 'Bu iş destan olur. Yeni başarım kazandın.'],
    ocak: ['Kragmir seninle övünüyor. Yeni başarım!'], sancak: ['Elentha senin için dalgalanıyor. Yeni başarım!'],
    warrior: ['Savaşçı, bu zafer senin omuzlarında. Yeni başarım!'], rogue: ['Suikastçı, bu kez herkes gördü. Yeni başarım!'],
    priest: ['Şifacı, emeğin karşılığını buldu. Yeni başarım!'], mage: ['Büyücü, adın kitaplara geçti. Yeni başarım!'],
  },
  friend: {
    any: ['Biri seninle omuz omuza yürümek istiyor.', 'Kapında bir yoldaş adayı var. İsteğe bak.'],
    ocak: ['Ork ateşi başına bir konuk geldi. İsteğine bak.'], sancak: ['Elentha’nın bayrağı altına bir yoldaş geldi. İsteğine bak.'],
    warrior: ['Savaşçı, yanında dövüşmek isteyen biri var.'], rogue: ['Suikastçı, bu kez seni arayan dost eli.'],
    priest: ['Şifacı, seninle yola çıkmak isteyen biri var.'], mage: ['Büyücü, adını duyan biri dostluk istiyor.'],
  },
  card: {
    any: ['Yakut Kartı bugünün payını ayırdı. Al.', 'Kartının günlük yakutu hazır. Yanmasın.'],
    ocak: ['Kragmir’in kesesi açık. Kart payını al.'], sancak: ['Elentha’nın hazinesi payını ayırdı. Kartına bak.'],
    warrior: ['Savaşçı, bugünün yakutu seni bekliyor.'], rogue: ['Suikastçı, hazır yakut kaçmaz ama yanar. Al.'],
    priest: ['Şifacı, kartının bugünkü payı bekliyor.'], mage: ['Büyücü, kartın bugünün yakutunu ayırdı.'],
  },
  ruler: {
    any: ['Otağ kuruldu. Irkın yeni Başbuğunu seçti.', 'Oylar sayıldı, tuğ dikildi. Taht sahibini buldu.'],
    ocak: ['Kragmir’in başında yeni bir Başbuğ oturuyor.'], sancak: ['Elentha’yı bu hafta yeni bir Başbuğ taşıyor.'],
    warrior: ['Savaşçı, Başbuğ belli oldu. Saf tutma vakti.'], rogue: ['Suikastçı, otağda yeni bir ses var. Kulak kabart.'],
    priest: ['Şifacı, ırkın önderini seçti. Otağa bir uğra.'], mage: ['Büyücü, taht el değiştirdi. Otağda söz sırası sende.'],
  },
  ferman: {
    any: ['Otağdan ferman çıktı. Irk sohbetine bak.', 'Başbuğ seslendi. Sözü ırk sohbetinde asılı.'],
    ocak: ['Kragmir’in Başbuğu ferman yazdı. Oku.'], sancak: ['Elentha’nın Başbuğu ferman yazdı. Oku.'],
    warrior: ['Savaşçı, Başbuğun buyruğu var. Bir göz at.'], rogue: ['Suikastçı, fermanı okumadan yola çıkma.'],
    priest: ['Şifacı, Başbuğ ırka seslendi. Sözünü dinle.'], mage: ['Büyücü, otağdan yeni bir ferman geldi.'],
  },
  grant: {
    any: ['Hazineden payına ulufe düştü. Postana bak.', 'Başbuğ seni unutmadı. Ulufen postada.'],
    ocak: ['Kragmir’in hazinesi sana açıldı. Ulufeni al.'], sancak: ['Elentha’nın hazinesi sana açıldı. Ulufeni al.'],
    warrior: ['Savaşçı, kılıcının hakkı geldi. Ulufen postada.'], rogue: ['Suikastçı, bu akçe alın teri. Ulufeni al.'],
    priest: ['Şifacı, emeğin görüldü. Ulufen postada.'], mage: ['Büyücü, hazine sana pay ayırdı. Postana bak.'],
  },
  terr: {
    any: ['Sınırlar yeniden çizildi. Haritaya bir bak.', 'Yeni hafta, yeni sınır. Bölgeler paylaşıldı.'],
    ocak: ['Kragmir’in tuğları dikildi. Hangi bölge bizde, bak.'], sancak: ['Elentha’nın sancakları dikildi. Hangi bölge bizde, bak.'],
    warrior: ['Savaşçı, sınır boyu seni çağırıyor. Haritaya bak.'], rogue: ['Suikastçı, hangi yol bizim? Haritaya göz at.'],
    priest: ['Şifacı, bölgeler el değiştirdi. Haritaya bak.'], mage: ['Büyücü, harita yeniden çizildi. Bir incele.'],
  },
  roster: {
    any: ['Kadroda bir yer açıldı. Yeni yoldaşını seç.', 'Ateş başında boş bir yer var. Kadroya bak.'],
    ocak: ['Ork ateşi başına bir yiğit daha sığar. Kadroya bak.'], sancak: ['Elentha’nın bayrağı altında bir yer boş. Kadroya bak.'],
    warrior: ['Savaşçı, yanına bir omuz daha gelebilir.'], rogue: ['Suikastçı, gölgende bir kişilik yer açıldı.'],
    priest: ['Şifacı, bakacağın bir yoldaş daha olabilir.'], mage: ['Büyücü, çemberde boş bir yer var. Kadroya bak.'],
  },
  upkeep: {
    any: ['Bakımın süresi doldu. Örs seni bekliyor.', 'Yağ kurudu, ağızlar köreldi. Bakım bitti.'],
    ocak: ['Kragmir’in ustaları boşta. Bakım süresi doldu.'], sancak: ['Kervan ustası hazır. Bakım süresi doldu.'],
    warrior: ['Savaşçı, kılıcın bileği istiyor. Bakım bitti.'], rogue: ['Suikastçı, hançerlerin köreldi. Bakım bitti.'],
    priest: ['Şifacı, topuzun perçini gevşedi. Bakım bitti.'], mage: ['Büyücü, asanın bağları gevşedi. Bakım bitti.'],
  },
  path: {
    any: ['Yol ikiye ayrılıyor. Uzmanlığını seç.', 'Ustalar seni bekliyor: bir uzmanlık yolu seç.'],
    ocak: ['Kragmir’in ustaları iki yol gösteriyor. Birini seç.'], sancak: ['Elentha’nın bilgeleri iki yol gösteriyor. Birini seç.'],
    warrior: ['Savaşçı, sur mu olacaksın, zırh yaran mı? Yolunu seç.'], rogue: ['Suikastçı, ağu mu, keskin nişan mı? Yolunu seç.'],
    priest: ['Şifacı, otacı mı olacaksın, büyübozan mı? Yolunu seç.'], mage: ['Büyücü, alaz mı, boran mı? Yolunu seç.'],
  },
};
// Küçük, belirlenimci özet: aynı bildirim her sorguda aynı sözü ve aynı kahramanı gösterir
export function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
// Bir olay için söz ve sözün seslendiği kahraman: havuz = herkese + tarafa + (özetin seçtiği) sınıfa özel sözler
export function hypeLine(kind, key, faction) {
  const H = Object.hasOwn(HYPE, kind) ? HYPE[kind] : HYPE.mail, h = hashStr(`${kind}|${key}`);
  const cls = CLASS_KEYS[h % CLASS_KEYS.length];
  const pool = [...H.any, ...(faction === 'ocak' || faction === 'sancak' ? H[faction] : []), ...H[cls]];
  return { text: pool[(h >>> 4) % pool.length], cls };
}

// ---------- Cihaz bildirimleri için istemcinin de bildiği zamanlayıcılar ----------
// Enerjinin dolacağı an (doluysa 0). Sunucu da aynı hesabı kullanır.
export const energyFullAt = p => (p.energy >= ENERGY.max ? 0 : p.energyAt + (ENERGY.max - p.energy) * ENERGY.regenMs);
export const mineFullAt = p => (p.lvl >= UNLOCK.mine ? p.mine.at + MINE.capHours * HOUR : 0);
