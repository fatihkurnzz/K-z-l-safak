// Destan: "VAHRAN: Tarihin Külleri"nin sekiz bölümü oynanabilir (20 Kas, kullanıcının belgesi "Destanı oynanabilir kılmak").
// Her bölümün bir oynanış biçimi var (savaş, bulmaca, iz sürme, ya da bulmaca + savaş). Aynı bölüm halka göre farklı anlatılır
// (`tale[ocak|sancak]`); bölüm bitince öteki halkın anlatısı "kilitli anı" olarak açılır (istemci: js/ui-destan.js).
// İlerleme: p.destan = { done: { [id]: 1 }, pz: { [id]: 1 } } (pz: bulmacası çözülmüş bölüm; VII'de savaşın önkoşulu).
// Ödül yalnız ilk bitirişte. Savaşlar modes.js `destan` modu üzerinden (args.ch), bulmacalar 'destan.solve' ile doğrulanır.
import { GAME, CLASS_KEYS } from './content.js';
import { MOBS, mobUnit, ZONES, zoneNormals } from './zones.js';
import { pickFrom } from './rng.js';
import { fail, grantAll } from './util.js';

const L = (o, s) => ({ ocak: o, sancak: s });
// Bölümler. lvl: açılış seviyesi · kind: battle | puzzle | trail | runes (bulmaca + boss) · reward: ilk bitiriş ödülü
// tale: { intro: [...], outro: [...] } halk başına. Metinler özgündür (VAHRAN evreni, docs/vahran-ad-esleme.md).
export const DESTAN = [
  { id: 1, roman: 'I', name: 'İki Taht', lvl: 3, kind: 'battle', play: 'Öğretici: kendi kralının sarayında başlarsın; iki taht aynı ovaya bakar.',
    reward: [{ t: 'akce', n: 1500 }, { t: 'yakut', n: 10 }],
    tale: L({ intro: ['Kragmir Dağ Salonları. Ocak taşları gece boyu kızıl yanar; Volgar Demirdiş tahtında, dizinde babasının çekici.', '“Bak,” der sana, pencereden aşağıdaki ovayı göstererek. “Vahran. Üç yüz yıldır kanla sulanır. Karşı tepede bir taht daha var; o da buraya bakar.”', 'Avluda talim başlar. Kral, ilk adımını izliyor.'],
                outro: ['Talim biter. Volgar başını sallar: “Elin ağır. İyi. Ova ağır ellere ihtiyaç duyar.”', 'Pencereden son kez bakarsın: ovanın öbür ucunda, Ak Kuleler’in ışıkları yanıp söner.'] },
              { intro: ['Elentha Ak Kuleleri. Mermer koridorlarda sabah türküsü değil, demirci çekici duyulur: barış uzun sürmedi.', 'Kral Edran seni balkona çağırır. “Şu ovayı görüyor musun? Vahran. Babam orada öldü, dedem de.” Uzakta, dağın yamacında ocak ateşleri.', '“Savaşı kazanmak istemiyorum,” der. “Bitirmek istiyorum. Önce kılıcını görelim.”'],
                outro: ['Talim biter. Edran gülümsemez ama gözleri yumuşar: “Söz verilecek kadar güçlüsün. Söz tutacak kadar da olmalısın.”', 'Balkondan son kez bakarsın: ovanın öbür ucunda, dağ salonlarının ocakları kızıl yanar.'] }) },
  { id: 2, roman: 'II', name: 'Kırılan Yemin', lvl: 10, kind: 'battle', play: 'Geçmişe dönüş savaşı: Dorrak ya da Seraine olarak Kızıl Ay gecesini oynarsın; sonda taş çatlar.',
    reward: [{ t: 'akce', n: 4000 }, { t: 'stone', g: 1, n: 2 }],
    hero: L('Dorrak', 'Seraine'),
    tale: L({ intro: ['Yashka’nın süt beyazı gözü sana döner: “Kızıl Ay gecesini görmeden bu savaşı anlayamazsın. Dorrak’ın gözünden bak.”', 'Üç yüz yıl önce. Taş Yemini’nin yanında, Kragmir’in kuyusu. Dorrak suyu içen çocukların düştüğünü görür. Kuyu zehirlenmiş.', 'Ova kızıl bir ayın altında yanmaya başlar. “Ak Kuleler’in işi,” der biri. Dorrak baltasını kaldırır.'],
                outro: ['Savaş bittiğinde Dorrak Taş Yemini’ne yaslanır. Taşın içinden bir ses gelir: kuru bir çıtırtı.', 'Dikilitaş yukarıdan aşağıya çatlar. O gece yemin kırılır; kimin kırdığını kimse bilmez.'] },
              { intro: ['Prenses Lira eski bir tutanağı önüne sürer: “Kızıl Ay gecesi. Seraine’in günlüğü. Onun gözünden oku.”', 'Üç yüz yıl önce. Elentha’nın elçisi barışı yenilemek için Taş Yemini’ne gider; sabah çadırında ölü bulunur, boğazında ork düğümü.', 'Seraine kılıcını çeker. Ova kızıl bir ayın altında yanmaya başlar.'],
                outro: ['Savaş bittiğinde Seraine Taş Yemini’ne dokunur. Taş, avucunun altında soğuk ve kuru bir sesle yarılır.', 'O gece yemin kırılır. Elçinin boğazındaki düğümü kimin attığını kimse sormaz.'] }) },
  { id: 3, roman: 'III', name: 'Demirdiş', lvl: 18, kind: 'battle', play: 'Genç Volgar’ın ilk savaşı: Ugrath düşer, Yerkıran el değiştirir.',
    reward: [{ t: 'akce', n: 7000 }, { t: 'yakut', n: 20 }],
    ally: L('Ugrath', 'Marven'),
    tale: L({ intro: ['Volgar on altı yaşında. Babası Ugrath, Yerkıran’ı omzuna atmış, oğlunu ilk savaşına götürüyor.', '“Önümde dur, arkamda değil,” der Ugrath. “Kral, kalkanın arkasından doğmaz.” Elentha’nın sancakları ovaya iner.'],
                outro: ['Ugrath bir mızrakla düşer. Yerkıran elinden kayar, çamura gömülür.', 'Genç Volgar çekici çamurdan çeker. Kabzası hâlâ ılıktır. O günden sonra ona Demirdiş derler; dişini sıkıp tek gözyaşı dökmediği için.'] },
              { intro: ['Genç Mareşal Marven ilk komutasında: ovanın ork tarafına bir öncü bölük.', '“Dev bir ork var,” der izciler, “elinde dağ gibi bir çekiç.” Marven gülümser: “Dağlar da düşer.”'],
                outro: ['Uzaktan görürsün: dev ork, Ugrath, bir mızrakla düşer. Yanındaki genç ork çekici çamurdan çeker ve bir an sana bakar.', 'Marven atını çevirir. “Yeter,” der. Yüzünde zafer yok; başka bir şey var, adını koyamadığın.'] }) },
  { id: 4, roman: 'IV', name: 'Sözün Bedeli', lvl: 25, kind: 'puzzle', play: 'Arşiv bulmacası: Lira ile çift tabanlı sandık ve yarı yanmış tutanak.',
    reward: [{ t: 'akce', n: 9000 }, { t: 'stone', g: 2, n: 1 }],
    // Yarı yanmış tutanağın üç satırı; her satır için doğru parçayı seç (sıra: index)
    puzzle: [
      { q: 'Tutanak, 1. satır: “Elçi gece yarısı … ”', opts: ['… ork çadırına gitti.', '… kimseyi kabul etmedi.', '… mareşalin çadırına çağrıldı.'], a: 2 },
      { q: 'Tutanak, 2. satır: “Boğazındaki düğüm … ”', opts: ['… sarayın ip atölyesinden.', '… Kragmir’in demir zinciri.', '… bir yay kirişi.'], a: 0 },
      { q: 'Sandığın çift tabanında: “Mühür sahibi … ”', opts: ['… Kral Edran.', '… gri bir cübbe giyer.', '… Dorrak’ın kardeşi.'], a: 1 },
    ],
    tale: L({ intro: ['Thrak, Ak Kuleler’den kaçırdığı bir sandığı Yashka’nın önüne koyar. “Prenses Lira bunu bize verdi,” der. “Gizlice.”', 'Sandığın tabanı ses yapar: çift tabanlı. İçinde yarı yanmış bir tutanak.'],
                outro: ['Yashka tutanağı ocak ateşine tutar; yazılar kararır ama okunur. “Elçiyi biz öldürmedik,” der. “Onlar da kuyuyu zehirlemedi.”', 'Gri cübbe. Yashka’nın yüzü ilk kez korkuyla gerilir.'] },
              { intro: ['Lira seni saray arşivinin en dibine götürür. “Kızıl Ay gecesinin tutanakları,” der. “Yarısı yakılmış. Yarısı da yalan.”', 'Tozlu bir sandık. Lira tabanına vurur: boş ses. Çift taban.'],
                outro: ['Satırlar birleşince Lira sararır. “Elçi mareşalin çadırına çağrılmış,” der. “Düğüm bizim atölyeden.”', 'Mührün altında küçük bir not: gri cübbe. “Bunu babama götüremem,” der Lira. “Henüz değil.”'] }) },
  { id: 5, roman: 'V', name: 'Üçüncü El', lvl: 32, kind: 'trail', play: 'İz sürme: Lira ve Thrak birlikte; gizlilik ve el işaretleri; ateşsiz kazan sahnesi.',
    reward: [{ t: 'akce', n: 12000 }, { t: 'yakut', n: 30 }],
    // İz sürme: her adımda Thrak’ın el işaretine doğru karşılığı ver (yanlış seçim gözcüyü uyandırır, adım baştan)
    puzzle: [
      { q: 'Thrak iki parmağını gözüne götürüp yere indiriyor.', opts: ['Eğil ve dur.', 'Koşarak öne geç.', 'Sesle seslen.'], a: 0 },
      { q: 'Lira avucunu açıp yana kaydırıyor.', opts: ['Sağdaki kayaya geç.', 'Olduğun yerde kal.', 'Ateş yak.'], a: 0 },
      { q: 'Thrak yumruğunu sıkıp kulağına götürüyor.', opts: ['Silahını çek.', 'Nefesini tut, dinle.', 'Geri dön.'], a: 1 },
      { q: 'Lira kazanı gösterip başını iki yana sallıyor.', opts: ['Kazana dokun.', 'Kazanı devir.', 'Uzaktan bak, yaklaşma.'], a: 2 },
    ],
    tale: L({ intro: ['Thrak ve Elentha prensesi Lira aynı kayanın arkasında. İki halk üç yüz yıldır ilk kez aynı gölgeye sığınıyor.', 'Kül Geçidi’nden gelen iz Sisli Çukur’a iniyor. Konuşmak yok; yalnız el işaretleri.'],
                outro: ['Çukurun dibinde bir kazan. Altında ateş yok ama içi kaynıyor. Gri cübbeliler etrafında, ağızlarında tek söz: “Adsız.”', 'Thrak dişlerini sıkar: “Üçüncü bir el varmış.” Lira başını sallar: “Hep varmış.”'] },
              { intro: ['Lira ve ork izci Thrak aynı kayanın arkasında. Saray bunu bilse ikisini de asar.', 'Arşivdeki gri cübbenin izi Sisli Çukur’a iniyor. Thrak eliyle konuşuyor; Lira öğreniyor.'],
                outro: ['Kazanın altında ateş yok, ama kaynıyor. Lira bir yüzü tanır: Mareşal Marven’in yaveri.', '“Üçüncü bir el,” der Thrak. Lira cevap vermez; titreyen elini kılıcının kabzasında tutar.'] }) },
  { id: 6, roman: 'VI', name: 'Kızıl Bahar', lvl: 40, kind: 'battle', play: 'Büyük meydan savaşı: dalga dalga; ortada iki kralın göz göze geldiği an.',
    reward: [{ t: 'akce', n: 18000 }, { t: 'stone', g: 2, n: 2 }],
    tale: L({ intro: ['Haber gecikti. Kızıl Bahar Meydanı’nda iki ordu yine karşı karşıya. Volgar, Yerkıran omzunda, en önde.', '“Bu son savaş olsun,” der kral. Kimse bunun ne anlama geldiğini sormaz.'],
                outro: ['Savaşın ortasında, toz bir an dağılır. Volgar ile Edran göz göze gelir; ikisinin de elinde bir haber var, ikisi de inanmamış.', 'Volgar çekicini indirir. Karşıda Edran da kılıcını. Meydan bir nefes boyu susar.'] },
              { intro: ['Kızıl Bahar Meydanı. Edran ordunun önünde; Lira’nın mektubu zırhının altında, okunmamış.', '“Bitirmek istiyorum,” demişti. Şimdi bitirmenin tek yolu kazanmak gibi görünüyor.'],
                outro: ['Toz dağıldığında Edran karşıda Volgar’ı görür. Yaşlı ork, çekicini yavaşça indirir.', 'Edran da kılıcını indirir. Arkasında Marven’in sesi: “Saldırın!” Kimse kımıldamaz.'] }) },
  { id: 7, roman: 'VII', name: 'Taşın Sırrı', lvl: 50, kind: 'runes', play: 'Rün okuma: taşın iki yüzü iki dilde; Marven’in ihaneti duyulur (zorlu boss: Marven).',
    reward: [{ t: 'akce', n: 25000 }, { t: 'yakut', n: 50 }],
    // Taşın iki yüzü: her Kragmir rününü Elentha yazısındaki eşiyle eşle (sıra: Kragmir yüzü; a = Elentha yüzündeki sıra)
    puzzle: [
      { q: 'Kragmir yüzü: “TOPRAK”', opts: ['SÖZ', 'TAŞ', 'KAN'], a: 1 },
      { q: 'Kragmir yüzü: “ÇEKİÇ”', opts: ['EL', 'ATEŞ', 'SÖZ'], a: 0 },
      { q: 'Kragmir yüzü: “BOYUN EĞMEZ”', opts: ['PASLANIR', 'BOZULMAZ', 'YANAR'], a: 1 },
    ],
    boss: 'erlik',
    tale: L({ intro: ['Taş Yemini’nin çatlağında iki yüz var: biri Kragmir rünleriyle, biri Elentha yazısıyla. Yashka ve Lira yan yana okuyor.', 'Son satırın altında bir ad kazınmış, sonradan: yemini bozanın mührü.'],
                outro: ['“Taş elden, söz bozulmaz.” Yemin buymuş. Altındaki mühür Marven’in.', 'Marven gölgeden çıkar. Gri cübbesini artık saklamıyor.'] },
              { intro: ['Taş Yemini’nin çatlağı iki yüzü ayırmış. Lira bir yüzü, Şaman Yashka öbürünü okuyor; ilk kez aynı metne bakıyorlar.', 'Son satırın altında sonradan kazınmış bir mühür.'],
                outro: ['Yemin: “Taş elden, söz bozulmaz.” Altındaki mühür Mareşal Marven’in.', 'Marven kılıcını çeker. “Üç yüz yıldır,” der, “savaşı ben besledim. Barış, Adsız’ın açlığıdır.”'] }) },
  { id: 8, roman: 'VIII', name: 'Tarihin Külleri', lvl: 60, kind: 'battle', play: 'Son Boss Adsız; iki kral yan yana. Açık son: taşın dibinde yeni bir rün.',
    reward: [{ t: 'akce', n: 40000 }, { t: 'yakut', n: 100 }],
    tale: L({ intro: ['Sisli Çukur. Ateşsiz kazanın başında Adsız bekliyor. Yanında Volgar Demirdiş ve Kral Edran; üç yüz yıldır ilk kez aynı safta.', 'Volgar Yerkıran’ı kaldırır: “Babam bu çekici bir savaşı bitirmek için taşırdı. Bugün bitiyor.”'],
                outro: ['Adsız dağılır; kül olur, sonra külü de kalmaz. Kazan söner.', 'Taş Yemini’nin dibinde, çatlağın en altında, kimsenin kazımadığı yeni bir rün belirir. Yashka’nın gözü titrer: “Bu bizim dilimiz değil.”'] },
              { intro: ['Ateşsiz kazanın başında Adsız. Edran’ın yanında Volgar; Lira ile Thrak arkalarında.', '“Söz tutacak kadar güçlü olmalısın,” demişti Edran. Bugün o söz tutuluyor.'],
                outro: ['Adsız dağılır, kazan söner. İki kral aynı taşa el basar.', 'Taşın dibinde yeni bir rün belirir; ne Kragmir’in ne Elentha’nın. Lira fısıldar: “Daha bitmedi.”'] }) },
];
export const DESTAN_BY = Object.fromEntries(DESTAN.map(c => [c.id, c]));
export const destanOf = p => { const d = (p.destan ||= {}); d.done ||= {}; d.pz ||= {}; return d; };
export const chapterOpen = (p, id) => { const C = DESTAN_BY[id]; return !!C && p.lvl >= C.lvl && (id === 1 || !!destanOf(p).done[id - 1]); };
export const chapterDone = (p, id) => !!destanOf(p).done[id];
export const otherFaction = f => (f === 'ocak' ? 'sancak' : 'ocak');
const isPuzzle = C => C.kind === 'puzzle' || C.kind === 'trail' || C.kind === 'runes';
export const needsBattle = C => C.kind === 'battle' || C.kind === 'runes';

// Bölüm savaşının kurulumu (modes.js destan.build). lvl: oyuncunun seviyesi (bölüm sınırında). Yardımcılar: botTeam (modes.js'ten)
const sc = (u, hp, atk) => ({ ...u, maxHp: Math.round(u.maxHp * hp), atk: Math.round(u.atk * atk), mag: Math.round(u.mag * atk) });
const zoneMobs = z => zoneNormals(ZONES[z - 1]);
export function destanSetup(p, C, env, { hero, botTeam }) {
  // Düşman seviyesi bölüm kuşağında kalır (açılış seviyesi … +8): yüksek seviyede yeniden oynanan bölüm kolaylaşır, zorlaşmaz
  const lvl = Math.max(C.lvl, Math.min(GAME.maxLevel, C.lvl + 8, p.lvl)), f = p.faction, foe = otherFaction(f), rand = env.rand;
  const mob = (z, r = 'n', k = 0.8) => sc(mobUnit(pickFrom(rand, zoneMobs(z)), lvl, r), k, k);
  const soldiers = (n, q, k = 0.75) => botTeam(env, lvl, q, foe, CLASS_KEYS.slice(0, n)).map(u => ({ ...sc(u, k, k), ai: true, name: `${foe === 'ocak' ? 'Kragmir' : 'Elentha'} ${u.name.split(' ')[0]}` }));
  const ally = (name, cls, side = f) => ({ ...botTeam(env, lvl, 0.6, side, [cls])[0], ai: true, name });
  switch (C.id) {
    case 1: return { waves: [[{ ...mob(1, 'n', 0.7), name: 'Talim Hasmı' }, { ...mob(1, 'n', 0.7), name: 'Talim Hasmı' }]], party: [hero], env: 'castle', title: `Destan I · ${C.name}` };
    case 2: return { waves: [soldiers(2, 0.35, 0.4), soldiers(3, 0.35, 0.4)], party: [{ ...sc(hero, 1.25, 1.15), name: C.hero[f] }], env: 'ashland', title: `Destan II · Kızıl Ay gecesi` };
    case 3: return { waves: [soldiers(2, 0.35, 0.45), soldiers(3, 0.35, 0.45), soldiers(3, 0.4, 0.5)], party: [hero, ally(C.ally[f], 'warrior')], env: 'steppe', title: `Destan III · ${C.name}` };
    case 6: return { waves: [soldiers(2, 0.35, 0.35), [mob(3, 'e', 0.55), mob(3, 'n', 0.55), mob(3, 'n', 0.55)], soldiers(3, 0.35, 0.35), [mob(3, 'e', 0.6), mob(3, 'n', 0.6), mob(3, 'n', 0.6)], soldiers(3, 0.4, 0.4)], party: [hero, ally(f === 'ocak' ? 'Thrak' : 'Lira', 'rogue')], env: 'steppe', title: `Destan VI · ${C.name}`, opts: {} };
    case 7: return { waves: [[mob(4, 'e', 0.75), mob(4, 'n', 0.75), mob(4, 'n', 0.75)], [{ ...sc(mobUnit(C.boss, lvl), 0.7, 0.8), name: 'Mareşal Marven', cult: true }, mob(4, 'e', 0.75)]], party: [hero, ally(f === 'ocak' ? 'Şaman Yashka' : 'Prenses Lira', f === 'ocak' ? 'priest' : 'rogue')], env: 'graveyard', title: `Destan VII · ${C.name}` };
    case 8: return { waves: [[mob(4, 'e', 0.8), mob(4, 'e', 0.8), mob(4, 'n', 0.8), mob(4, 'n', 0.8)], [{ ...sc(mobUnit('bozdag', lvl), 1.25, 0.85), name: 'Adsız', cult: true }, mob(4, 'e', 0.8)]], party: [hero, ally('Kral Volgar Demirdiş', 'warrior', 'ocak'), ally('Kral Edran', 'warrior', 'sancak')], env: 'graveyard', title: `Destan VIII · ${C.name}` };
    default: fail('bad-chapter', 'Bu bölüm savaşla oynanmaz.');
  }
}
export function finishChapter(p, C, out) {
  const d = destanOf(p);
  if (d.done[C.id]) return false;
  d.done[C.id] = 1;
  const got = grantAll(p, C.reward);
  if (out) { out.loot = [...(out.loot || []), ...got]; out.destan = C.id; }
  return got;
}
export const DESTAN_HANDLERS = {
  // Bulmaca / iz sürme / rün okuma: seçimler doğruysa bölüm (rün bölümünde yalnız bulmaca adımı) tamamlanır
  'destan.solve'(p, { id, picks }) {
    const C = DESTAN_BY[+id];
    if (!C || !isPuzzle(C)) fail('bad-chapter', 'Bu bölümde bulmaca yok.');
    if (!chapterOpen(p, C.id)) fail('locked', `Bu bölüm ${C.lvl}. seviyede ve bir önceki bölümden sonra açılır.`);
    if (!Array.isArray(picks) || picks.length !== C.puzzle.length || picks.some((x, i) => +x !== C.puzzle[i].a)) fail('wrong', 'Bir parça yerine oturmadı. Yeniden dene.');
    const d = destanOf(p);
    d.pz[C.id] = 1;
    if (C.kind === 'runes') return { id: C.id, battle: true };
    const loot = finishChapter(p, C) || [];
    return { id: C.id, done: true, loot };
  },
};
