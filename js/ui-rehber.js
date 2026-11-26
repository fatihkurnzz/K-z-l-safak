// Rehber: Ansiklopedi penceresinin ilk sekmesi. Solda bölüm listesi, sağda seçilen bölümün sayfası.
// İçerik SECTIONS dizisindedir (kolay güncellensin); sayılar kural dosyalarından okunur, elle yazılmaz.
// Yazılmakta olan sistemler (Pazar ve Tüccar, Klan Karargâhı, ana görev ağacı, zırh parıltısı) kesin sayısız anlatılır.
import { NUFUS, NUFUS_LINE } from '../shared/nufus.js'; // nüfus dengesi maddesi
import { ACT, cur, redraw, closeWin, locked, toast, closeModal } from './ui-core.js';
import { svg } from './icons.js';
import { GAME, FACTIONS, FACTION_BONUS, CAPITALS, CLASSES, CLASS_KEYS, STATS, STAT_POINTS_PER_LEVEL, SKILL_POINTS_FROM_LEVEL, SKILL_POINTS_PER_LEVEL, TREE_NODES, TREE_MAX, TREES,
  xpNeed, ENERGY, BAG_LIMIT, RESET_COST, STATUS, TURN_CAP, UNLOCK, QUESTS, QUEST_ALL, SHOP, ARENA, ARENA_SHOP, LEAGUES, HALL, MINE, WHEEL, SHARDS, CLAN, PREMIUM, CHAT, WAR_BONUS, bonusLines } from '../shared/content.js';
import { SLOTS, GRADES, TIERS, MAX_PLUS, SAFE_PLUS, UP_CHANCE, UP_BREAK, UP_STONES, PLUS_MULT, EMBER_MULT, FOG_UP, STONES, REFORGE, SUBS, SUB_N, SUB_UP, COEF, IL, ARMOR_SETS, SET_PIECES,
  WEAPONS, WEAPON_NAMES, JEWELS, JEWEL_NAMES, setBonus, fmtSetFx, fmtPct, upFee } from '../shared/items.js';
import { MASTERY } from '../shared/mastery.js';
import { HISAR } from '../shared/content.js';
import { RANKS as SAN_RANKS } from '../shared/rutbe.js';
import { CHAR } from '../shared/roster.js';
import { RULES } from '../shared/rules.js';
import { WEEKLY, WEEKLY_ALL, MONTHLY, MONTHLY_ALL } from '../shared/meta.js';
import { CLAN_LEVELS, CLAN_XP, NISAN, CLAN_QUESTS, CLAN_SHOP, HUNT_DIFF, RANKS as CLAN_RANKS, SUCCESSION_DAYS, CLAN_DONATE } from '../shared/clan.js';
import { SEASON, STAGE_TIERS, DUNGEON_MODS, MATCH, ARENA_PTS, RACE_DAY } from '../shared/pvp.js';
import { FEUD_MAX } from '../shared/modes.js';
import { BASKIN } from '../shared/baskin.js'; // Dünya Baskını maddesi
import { KINGDOM, GRANT, DECREE, TERR } from '../shared/realm.js';
import { ZONES, MOBS } from '../shared/zones.js';
import { GLOW_LEVELS } from './fx-table.js';
import { FISH, FISH_RAR, RODS, FISH_DAILY, FISH_PREM } from '../shared/balik.js';
import { MANA, POT, potPrice, maxMpOf } from '../shared/mana.js'; // savaş çubuğu, mana ve iksirler (sürüm 12)
import { baseActives, mpBase, describe } from '../shared/skills.js';
import { LOADOUT_ACTIVES } from '../shared/hero.js';

const tr = n => Math.round(n).toLocaleString('tr-TR');
const pct = v => `%${Math.round(v * 1000) / 10}`.replace('.', ',');
const tbl = (head, rows) => `<div class="rh-tw"><table class="rh-t"><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
const give = g => (g.t === 'energy' ? `${g.n} enerji` : g.t === 'yakut' ? `${g.n} Yakut` : g.t === 'akce' ? `${tr(g.n)} akçe` : g.t === 'san' ? `${tr(g.n)} Şan` : g.t === 'charm' ? `${g.n} Uğur Muskası` : g.t === 'seal' ? `${g.n} Mühür Taşı` : g.t === 'berat' ? `${g.n} Yoldaş Beratı` : g.t === 'stone' ? `${g.n} ${STONES[g.g].name}` : '?');
const stoneNames = STONES.map(s => s.name).join(', ');

// Her bölüm: id, icon, title, intro, items (madde ya da hazır HTML blok), tip, go { act, label, key (UNLOCK anahtarı) }
// Madde '#' ile başlıyorsa ara başlık, '<' ile başlıyorsa hazır HTML, değilse madde işaretli satırdır.
export const SECTIONS = [
  { id: 'baslarken', icon: 'gate', title: 'Başlarken', go: { act: 'gateZones', label: 'Bölgelere git' },
    intro: `${GAME.name}, yatay ekranda oynanan, sıra tabanlı bir rol oyunudur. Tek bir karakter oluşturur, bölgeleri geçer, eşyalarını örste güçlendirir ve ${GAME.maxLevel}. seviyeye kadar ilerlersin.`,
    items: () => ['# Irklar',
      `Kragmir: ${FACTIONS.ocak.desc} Irk bonusu "${FACTION_BONUS.ocak.name}": ${bonusLines('ocak').join(', ')}. Başkenti ${CAPITALS.ocak}.`,
      `Elentha: ${FACTIONS.sancak.desc} Irk bonusu "${FACTION_BONUS.sancak.name}": ${bonusLines('sancak').join(', ')}. Başkenti ${CAPITALS.sancak}.`,
      `Her hafta bir ırk "${WAR_BONUS.name}" olabilir: ${WAR_BONUS.days} gün boyunca %${WAR_BONUS.drop} fazla eşya düşer. Yemin Pazarı, iki ırkın da girebildiği tarafsız pazar kasabasıdır.`,
      `Nüfus dengesi: ırklar arasındaki nüfus farkı %5'i aşarsa sayıca azınlıkta kalan ırk kendiliğinden "${NUFUS.name}" alır: ${NUFUS_LINE} (savaş ve görev kazancına). Bir ırkın sayısı ötekinin %${NUFUS.capPct}'sini geçerse o ırka yeni hesap açılmaz; var olan oyuncular etkilenmez. ${NUFUS.minTotal} kişinin altındaki sunucuda kapama uygulanmaz.`,
      '# Ana ekran',
      'Sol üstte oyuncu kartı, altında Menü, Duyuru ve kasaba kısayolu durur. Sağ üstte Enerji, Akçe ve Yakut görünür. Alttaki çubukta Karakter, Çanta, Klan, Sıralama, Görevler, Posta, Ansiklopedi ve Kervan vardır. Binalara (Örs, Maden, Pazar…) dokunarak girersin.',
      '# Enerji',
      `Aşamalara girmek enerji harcar. En çok ${ENERGY.max} enerji birikir, her ${ENERGY.regenMs / 60000} dakikada 1 yenilenir, seviye atlamak ${ENERGY.levelUpBonus} enerji verir. Her gün bir giriş ödülü alırsın: ${RULES.gift.energy} enerji, ${RULES.gift.yakut} Yakut ve seviyene göre akçe.`,
      '# Kaynaklar', 'Akçe (temel para), Yakut (premium para), Şan (Meydan puanı), Örs Tozu ve bileği taşları (örs için), Oba Nişanı (klan dükkânı).'],
    tip: 'Önce Vahran Ovası’ndaki aşamaları geç; seviye atladıkça yeni binalar ve oyun kipleri açılır (Seviye ve Statlar bölümündeki tablo).' },

  { id: 'savas', icon: 'battle', title: 'Savaş', go: { act: 'gateZones', label: 'Bir aşamaya git' },
    intro: 'Savaşlar sıra tabanlıdır ama sıra herkesin hızına göre akar. Hamleni sen seçersin; istersen oto savaşa bırakırsın.',
    items: () => ['# Sıra ve hız',
      'Her birimin bir sıra çubuğu vardır ve hız kadar hızlı dolar; çubuğu dolan birim oynar. Hız yüksekse daha sık oynarsın. Eşitlikte dizilişte önde olan oynar.',
      'Yaratıklara karşı savaşlarda açılış turu senindir: karakterin, düşman oynamadan önce bir hamle yapar. Oyuncuya karşı savaşlarda (Meydan, Sancak, Kuşatma) sırayı yalnızca hız belirler.',
      '# Savaş çubuğu',
      `Ekranın altında savaş çubuğu durur: en solda temel saldırı, yanında ${LOADOUT_ACTIVES} yetenek yuvası, sağda Can ve Mana iksiri. Üstündeki iki gösterge canını ve manana gösterir. Henüz açılmamış yuvada kilit ve açılacağı seviye yazar.`,
      'Temel saldırı her zaman kullanılır ve bedelsizdir. Yeteneklerin bekleme süresi (tur) vardır: kullanınca bir süre kullanılamaz. Hedefini yetenek simgesine dokunup sonra düşmana dokunarak seç; kendine ya da hedefsiz yeteneği ikinci dokunuşla kullanırsın.',
      '# Mana',
      `Her yetenek mana harcar; bedeli simgenin altındaki mavi rozettir. Mana her kendi turunun başında biraz dolar; yetmezse yetenek sönük kalır ve temel saldırıyla dövüşürsün. Havuz sınıfa göre değişir, seviyeyle ve Zekâ puanıyla büyür; bedeller de seviyeyle aynı oranda büyür.`,
      tbl(['Sınıf', '1. sv. mana', '40. sv. mana', 'Tur başı yenilenme', 'Zekâ puanı başına'], CLASS_KEYS.map(k => [CLASSES[k].name, maxMpOf(k, 1), maxMpOf(k, 40), `%${Math.round(MANA[k].regen * 100)}`, `+${MANA[k].int}`])),
      '# İksirler',
      `Can İksiri azami canının %${Math.round(POT.hp.pct * 100)}’ini, Mana İksiri azami mananın %${Math.round(POT.mp.pct * 100)}’ini hemen yeniler. İksir içmek turunu bitirmez: içer, aynı turda yeteneğini de kullanırsın. Savaş başına her türden en çok ${POT.cap} tane içilir; aynı türü içtikten sonra ${POT.cd} tur beklersin.`,
      `İksirler başkentteki “İksir ve Parşömen” dükkânından akçeyle alınır (fiyat seviyeyle artar: 1. seviyede ${potPrice('hp', 1)}, 40. seviyede ${tr(potPrice('hp', 40))} akçe). Çantada yer kaplamaz, en çok ${POT.max} tane taşınır; satılamaz ve takas edilemez. Yeni karaktere ${POT.start.hp} Can ve ${POT.start.mp} Mana iksiri verilir.`,
      'İksirler yaratıklara karşı savaşlarda (bölgeler, zindanlar, Akın, Oba Avı, Dünya Baskını) içilir. Meydan, Canlı Meydan, Sancak Savaşı, Hisar Kuşatması ve seri savaşta iksir yoktur. Oto savaş canın %40’ın altına inince Can, mana yetmeyince Mana iksiri içer.',
      `Zayıf olduğu elementle vurulan yaratık %${RULES.weak} fazla hasar alır; yaratığın kendi silah türüne ve elementine direnci olabilir. Ansiklopedi’deki Yaratıklar sekmesi bunları gösterir.`,
      `# Öfke`, `Boss’lar uzun süren savaşta öfkelenir (aşama ve Mühürlü Oda Boss’ları 110. turdan sonra); her öfke basamağında verdikleri hasar %50 artar. ${TURN_CAP} turda bitmeyen savaş kaybedilir.`,
      '# Durum etkileri', tbl(['Etki', 'Ne yapar'], Object.values(STATUS).map(s => [`${s.icon} ${s.name}`, s.desc])),
      '# Oto savaş ve hız', 'Savaş ekranındaki "Oto" düğmesi hamleleri yapay zekâya bırakır; seçimleri savaşın tohumuna bağlıdır, yani sonuç sunucuda aynen doğrulanır. Hız düğmesi 1x, 2x ve 3x arasında döner (Ayarlar’dan varsayılan hız seçilebilir). Bazı kiplerde hamle süresi vardır (Canlı Meydan’da ' + RULES.live.timer + ' sn).'],
    tip: 'Hız, savaşta en değerli statlardan biridir: rakipten önce oynamak çoğu zaman savaşı belirler.' },

  { id: 'siniflar', icon: 'party', title: 'Sınıflar ve Karakter', go: { act: 'party', label: 'Karakter' },
    intro: `Dört sınıf vardır. Oyunu tek karakterle oynarsın: ırkını ve sınıfını oluştururken seçersin, sonradan değişmez. Bir hesapta en çok ${CHAR.slots} karakter olabilir; her karakterin seviyesi, çantası, akçesi ve görevleri ayrıdır.`,
    items: () => ['# Sınıflar (1. seviye değerleri)',
      tbl(['Sınıf', 'Rol', 'Ana stat', 'Can', 'Saldırı', 'Büyü', 'Savunma', 'Hız'], CLASS_KEYS.map(k => { const C = CLASSES[k]; return [C.name, C.role, STATS[C.main].name, C.base.hp, C.base.atk, C.base.mag, C.base.def, C.base.spd]; })),
      '# Karakter yerleri', `Açılışta karakter seçme ekranı gelir: karakterine dokunup "Oyuna gir"e bas. Yeni karakter boş bir yerden açılır; ad ${CHAR.name.min}-${CHAR.name.max} harf ya da rakamdır ve sunucuda benzersizdir. Silme kalıcıdır ve ad yazılarak onaylanır. Oyun içinden Menü → Karakter değiştir ile seçme ekranına dönülür.`,
      '# Tek başına savaş', 'Bütün savaşlara (bölgeler, zindanlar, Boss’lar, etkinlikler ve Meydan) karakterinle tek başına girersin. Yaratık dalgaları tek karaktere göre kuruludur: bir dalgada en çok üç yaratık olur; eksilen yaratıkların deneyimi, akçesi ve eşya şansı kalanlara pay edilir.'],
    tip: 'Şifacı kendini iyileştirebildiği için uzun savaşlarda, Büyücü ve Suikastçı ise çabuk bitirdiği savaşlarda öne çıkar.' },

  { id: 'seviye', icon: 'star', title: 'Seviye ve Statlar', go: { act: 'party', label: 'Karakter' },
    intro: `Savaşlardan deneyim kazanırsın. En yüksek seviye ${GAME.maxLevel}.`,
    items: () => ['# Deneyim', `Bir sonraki seviye için gereken deneyim: 50 × seviye + 8 × seviye². Örnek: 10. seviyede ${tr(xpNeed(10))}, 40. seviyede ${tr(xpNeed(40))}, 79. seviyede ${tr(xpNeed(79))}.`,
      '# Nitelik puanları', `Her seviye ${STAT_POINTS_PER_LEVEL} nitelik puanı verir. Dört nitelik vardır:`, tbl(['Nitelik', 'Etkisi'], Object.values(STATS).map(s => [s.name, s.desc])),
      `Puanları sıfırlamak, seviyen × ${RESET_COST(1)} akçedir (65. seviyede ${tr(RESET_COST(65))}).`,
      '# Seviyeyle açılanlar', tbl(['Özellik', 'Seviye'], [['Örs', UNLOCK.anvil], ['Meydan', UNLOCK.arena], ['Maden', UNLOCK.mine], ['Pazar', UNLOCK.market], ['Klan', UNLOCK.clan], ['Dipsiz Kuyu', UNLOCK.well], ['Şan Divanı', UNLOCK.hall],
        ['Kader Çarkı', UNLOCK.wheel], ['Yeraltı Ocağı', UNLOCK.depth], ['Mühürlü Oda', UNLOCK.seal], ['Canlı Meydan', UNLOCK.live], ['Gök Yarığı', UNLOCK.rift], ['Sancak Savaşı', UNLOCK.banner], ['Hisar Kuşatması', UNLOCK.siege], ['Usta Sınavı', UNLOCK.trial]])],
    tip: 'Yeni bir kilit açıldığında ana ekrandaki ilgili bina ya da düğme canlanır.' },

  { id: 'yetenek', icon: 'usta', title: 'Yetenekler ve Ustalık', go: { act: 'party', label: 'Karakter' },
    intro: `Yetenek ağaçları ${SKILL_POINTS_FROM_LEVEL}. seviyede açılır. Ustalık ise ${MASTERY.unlock}. seviyeden sonraki uzun vadeli güçlenme yoludur.`,
    items: () => ['# Temel yetenekler', `Her sınıfın seviyeyle açılan altı temel yeteneği vardır; açılan yetenek savaş çubuğundaki boş yuvaya kendiliğinden girer. Mana bedeli 1. seviyedeki değerdir.`,
      tbl(['Sınıf', 'Sv.', 'Yetenek', 'Mana', 'Ne yapar'], CLASS_KEYS.flatMap(k => baseActives(k).map((S, i) => [i ? '' : CLASSES[k].name, S.lvl, `<b>${S.name}</b>`, mpBase(S), describe(S)]))),
      `Ağaç ve yol yetenekleri açıldıkça Karakter → Yetenek ekranında ${LOADOUT_ACTIVES} yuvaya istediğini koyarsın; bedeli verilmemiş yeteneğin manası bekleme süresinden ve hedef sayısından türer.`,
      '# Yetenek ağaçları', `Her seviye ${SKILL_POINTS_PER_LEVEL} yetenek puanı verir. Her sınıfın üç ağacı vardır; bir ağaçta yetenekler ${TREE_NODES.join(', ')}. puanlarda açılır (ağaç tavanı ${TREE_MAX}).`,
      tbl(['Sınıf', 'Ağaçlar'], CLASS_KEYS.map(k => [CLASSES[k].name, CLASSES[k].trees.map(t => `<b>${TREES[t].name}</b>: ${TREES[t].desc}`).join('<br>')])),
      '# Ustalık', `${MASTERY.unlock}. seviyeye ulaşınca kazandığın her deneyim ustalığa da yazılır (en çok ${MASTERY.maxLvl} seviye). Her ustalık seviyesi 1 puan verir; puanını ustalık ağacına dağıtırsın. Puanları geri almak ustalık seviyesi başına ${tr(MASTERY.resetCost)} akçedir.`,
      tbl(['Düğüm', 'Seviye başı', 'En çok'], Object.values(MASTERY.nodes).map(n => [n.name, n.pct ? `+%${(n.per * 100).toFixed(1).replace('.0', '').replace('.', ',')} ${n.note}` : n.note === 'Hız' ? `+${n.per} Hız` : `+%${(n.per * 100).toFixed(1).replace('.', ',')} ${n.note}`, n.max]))],
    tip: 'Puanları dağıtmadan önce karakterinin zayıf yanına bak: hız ve can çoğu zaman en güvenli seçimdir.' },

  { id: 'esya', icon: 'chest', title: 'Eşyalar ve Nadirlik', go: { act: 'bag', label: 'Çanta' },
    intro: `Karakterin ${Object.keys(SLOTS).length} yuvaya eşya takar: silah, kalkan, beş zırh parçası, iki küpe, kolye, iki yüzük ve kemer. Çanta en çok ${BAG_LIMIT} eşya alır.`,
    items: () => ['# Nadirlik', tbl(['Nadirlik', 'Özellik'], [[`<b style="color:${GRADES[0].color}">${GRADES[0].name}</b>`, `Temel statlar, yan stat yok.`], [`<b style="color:${GRADES[1].color}">${GRADES[1].name}</b>`, `Ana statlar ×${GRADES[1].mult}, savunma katsayıları ×${GRADES[1].coef}, ${SUB_N[1]} yan stat.`], [`<b style="color:${GRADES[2].color}">${GRADES[2].name}</b>`, `Statları tabanında yazılıdır, nadir yaratıklar ve Boss’lardan düşer; ${SUB_N[2]} yan stat.`]]),
      '# Kademeler', tbl(['Kademe', 'Gereken seviye', 'Kılıç', 'Yüzük'], TIERS.map((t, i) => [i + 1, t.req, WEAPON_NAMES.sword[i], JEWEL_NAMES.ring[i]])),
      '# Silah türleri', tbl(['Tür', 'Sınıf', 'El', 'Kademe sırasıyla adlar'], Object.values(WEAPONS).map(W => [W.name, W.cls.map(c => CLASSES[c].name).join(', '), W.hands === 2 ? 'Çift' : 'Tek', W.names.filter(Boolean).join(' · ')])),
      '# Takı türleri', tbl(['Tür', 'Kademe sırasıyla adlar'], Object.entries(JEWELS).map(([k, J]) => [J.name, JEWEL_NAMES[k].join(' · ')])),
      'Eşya adları özgün İngilizce adlarıyla kullanılır; statları kademe ve türden gelir. Arbalet 5., Jamadar 2. kademeden başlar.',
      '# Eşya seviyesi', `Eşya seviyesi kademe, nadirlik, artı ve suyla hesaplanan tek sayıdır (nadirlik çarpanı: ${IL.rarity.join(' / ')}; her artı +%${IL.plus * 100}; su verilmiş ×${IL.reforge}). Meydan’da rakipler eşya seviyene yakın seçilir.`,
      '# Direnç ve savunma delme', `${TIERS[COEF.minTier].req}. seviye ve üstü eşyalarda küçük silah/element direnci ve savunma delme katsayıları bulunur (toplam direnç en çok ${pct(COEF.resCap)}, delme en çok ${pct(COEF.penCap)}).`,
      '# Su verme', `+${REFORGE.minPlus} ve üstü bir eşya artısını sıfırlayıp kalıcı olarak güçlenebilir (tabanı ×${REFORGE.mult}); ${REFORGE.stones} bileği taşı ve ücret ister, sonra yeniden basılabilir.`],
    tip: 'Eşya hiçbir koşulda yok olmaz: örste kötü sonuç en kötü +5’e düşürür.' },

  { id: 'yan', icon: 'ring', title: 'Yan Statlar', go: { act: 'bag', label: 'Çanta' },
    intro: 'Nadir ve Eşsiz eşyaların ana statlarının yanında rastgele yan statları vardır. Yan statlar eşya düştüğü anda belirlenir ve sonradan değişmez.',
    items: () => ['# Nadirliğe göre yan stat sayısı', tbl(['Nadirlik', 'Yan stat'], GRADES.map((g, i) => [g.name, SUB_N[i]])),
      '# Artıyla güçlenme', `Eşya ${SUB_UP.map(x => '+' + x).join(', ')} artıya ulaşınca yan statlarından biri güçlenir (her eşikte bir kez).`,
      '# Yan stat türleri', tbl(['Yan stat', '1. kademe', '8. kademe'], Object.values(SUBS).map(s => [s.name, s.name === 'Hız' ? `+${s.v(0)}` : fmtPct(s.v(0)), s.name === 'Hız' ? `+${s.v(7)}` : fmtPct(s.v(7))])),
      'Gösterilen değerler ortalamadır; her zar bunun %80–120’si arasında çıkar.'],
    tip: 'Aynı eşyanın iki kopyası farklı yan statlara sahip olabilir; Pazar’da alırken yan statlara bak.' },

  { id: 'set', icon: 'helm', title: 'Set Bonusları', go: { act: 'bag', label: 'Çanta' },
    intro: `Aynı sınıfın aynı kademeden zırh parçalarını giyince set bonusu açılır: ${SET_PIECES.join(', ')} parça. İkili Bonus sınıfın ana statını, dörtlü setin özel etkisini, beşli can ve savunmayı verir. Bonuslar birikir.`,
    items: () => CLASS_KEYS.flatMap(k => [`# ${CLASSES[k].name} setleri`, tbl(['Set', 'Kademe', '2 parça', '4 parça', '5 parça'], ARMOR_SETS[k].map((name, t) => { const b = setBonus(k, t); return [name, t + 1, b[2].map(fmtSetFx).join(', '), b[4].map(fmtSetFx).join(', '), b[5].map(fmtSetFx).join(', ')]; }))]),
    tip: 'Karışık kademeli zırh yerine tek set tamamlamak çoğu zaman daha güçlüdür; çanta ekranında hangi bonusun açık olduğu görünür.' },

  { id: 'ors', icon: 'anvil', title: 'Örs ve Artı Basma', go: { act: 'anvil', label: 'Örs', key: 'anvil' },
    intro: `Örste eşyaya artı basarsın (en çok +${MAX_PLUS}). Her artı eşyanın statlarını büyütür; deneme başına bileği taşı ve akçe harcanır.`,
    items: () => ['# Oranlar', tbl(['Basamak', 'Başarı', 'Taş', 'Başarısızlıkta', 'Ücret (1. kademe, Standart)'], UP_CHANCE.map((c, p) => [`+${p} → +${p + 1}`, pct(c), UP_STONES[p], p <= SAFE_PLUS ? 'Eşya değişmez' : `Bir artı düşer${UP_BREAK[p] ? `, %${UP_BREAK[p] * 100} kırılır (+${SAFE_PLUS}’e döner)` : ''}`, tr(upFee({ b: 'w:sword:0', p, g: 0 }))])),
      '# Kurallar', `+${SAFE_PLUS} ve altında başarısızlık yalnızca taş ve akçeye mal olur. Hiçbir sonuç eşyayı +${SAFE_PLUS}’in altına düşürmez, eşya yok olmaz.`,
      `Uğur Muskası, +${SAFE_PLUS + 1} ve üstündeki denemede seviye kaybını ve kırılmayı önler. Tav Közü başarı şansını ×${EMBER_MULT} yapar. Sisli havada başarı şansı ×${1 + FOG_UP.rel} olur (en çok +%${FOG_UP.cap * 100} puan).`,
      `Artı çarpanları: ${PLUS_MULT.map((m, i) => `+${i} ×${m}`).join(', ')}.`,
      '# Taşlar', tbl(['Taş', 'Örs Tozu', 'Akçe', 'Hangi eşya için'], STONES.map((s, i) => [s.name, s.dust, tr(s.akce), GRADES[i].name])),
      `Eşyayı parçalamak Örs Tozu verir, tozdan bileği taşı üretilir. Kragmir’in örs ücreti %${-FACTION_BONUS.ocak.anvilFee} azdır.`],
    tip: 'Oranlar bu tablodan canlı okunur: ekranda gördüğün şans, sunucunun kullandığı şansın aynısıdır.' },

  { id: 'parilti', icon: 'ember', title: 'Parıltı', go: { act: 'anvil', label: 'Örs', key: 'anvil' },
    intro: 'Yüksek artılı eşyalar ışıldar: parıltı artıyla büyür ve eşyanın nadirlik rengini alır (Standart beyaz, Nadir mavi, Eşsiz altın).',
    items: () => ['# Silah parıltısı', tbl(['Artı', 'Görünüm'], [[`+7`, 'Hafif kor: ısınmış metal ışıması'], ['+8', `Kıvılcımlar (saniyede ${GLOW_LEVELS[8].sparks})`], ['+9', 'Alev kılıfı ve iç ışık'], ['+10', 'Irk renginde aura: Kragmir kızıl, Elentha mavi; uzaktan tanınır']]),
      'Eşsiz silah, artısı ne olursa olsun kendine özgü bir ışık süzmesi taşır.',
      '# Zırh parıltısı', 'Kuşanılan 5 zırh parçasının artı ortalaması (boş yuva 0 sayılır) zırhın parıltısını belirler; renk, giyilen en yüksek nadirlikten gelir. Silahtakinden daha incedir.', tbl(['Ortalama artı', 'Görünüm'], [['+7', 'Zırhta hafif kor ışıması'], ['+8', 'Zırhtan seyrek kıvılcımlar'], ['+9', 'İnce alev kenarı'], ['+10', 'Irk renginde ışıma ve ayak altında nabız atan halka']])],
    tip: 'Parıltıyı Karakter ekranında ve savaşta, silahta ve zırhta görürsün. Tam zırh parıltısı için 5 parçanın hepsini giy.' },

  { id: 'maden', icon: 'mine', title: 'Maden', go: { act: 'mine', label: 'Maden', key: 'mine' },
    intro: `Maden, sen çevrimdışıyken de cevher üretir (en çok ${MINE.capHours} saatlik birikir). ${UNLOCK.mine}. seviyede açılır.`,
    items: () => ['# Üretim', `Saatte seviye × ${MINE.perHour(1)} cevher; seviye ${MINE.max} en yüksektir. Yükseltme bedeli: seviye² × 500 akçe (örn. 1→2: ${tr(MINE.upCost(1))}, 9→10: ${tr(MINE.upCost(9))}). Maden seviyesi n+1 için seviye n × 6 gerekir.`,
      `Cevheri topla; premium üyelikte üretim artar (Bronz ×${PREMIUM[1].mine}, Gümüş ×${PREMIUM[2].mine}, Platin ×${PREMIUM[3].mine}). Kragmir %${FACTION_BONUS.ocak.mine} fazla cevher üretir.`,
      '# Takas', tbl(['Cevher', 'Karşılığı'], [[MINE.trade.akce.ore, `${MINE.trade.akce.give.n} akçe`], [MINE.trade.stone0.ore, STONES[0].name], [MINE.trade.stone1.ore, STONES[1].name]])],
    tip: 'Günlük ve haftalık görevler “Maden kazancını topla” ister; her gün bir kez toplamak yeter.' },

  { id: 'pazar', icon: 'market', title: 'Yemin Pazarı: Pazar ve Tüccar', go: { act: 'market', label: 'Pazar', key: 'market' },
    intro: `Pazar, oyuncular arasında eşya alım satımı içindir (${UNLOCK.market}. seviyede açılır). Tüccar ise ayrı bir tezgâhtır; ikisi de Yemin Pazarı’ndadır. Tüccar akçeyle temel silah satar, iksir satmaz.`,
    items: () => ['# Pazar', 'Eşyanı fiyat koyarak ilana verirsin, başka oyuncular satın alır. İlan ve satışta küçük kesintiler vardır; ırkına göre vergi değişir. Ayrıntılar ve sınırlar güncellenebilir, Pazar ekranı güncel hâlini gösterir.',
      '# Tüccar Halvor', 'Yemin Pazarı’nda bulunur. Seviyene uygun kademeden her sınıfın silahını Standart nadirlikte akçeyle satar; ilk silahını buradan alırsın.'],
    tip: 'Parçalamak ya da satmak yerine Pazar fiyatına bakmak değerli eşyalarda kazandırır.' },

  { id: 'balik', icon: 'market', title: 'Balık Tutma', go: { act: 'goCarsi', label: 'Yemin Pazarı' },
    intro: `Yemin Pazarı göletinin iskelesinde (Balık Tut) oltanı atarsın. Günde ${FISH_DAILY} atış hakkın vardır; Premium üyelikte +${FISH_PREM}.`,
    items: () => ['# Nasıl tutulur', 'Olta at, şamandırayı izle. Şamandıra batınca kısa süre içinde Çek! düğmesine dokun; erken çekersen balık ürker.',
      'Ardından zamanlama çubuğunda gidip gelen işaretçi yeşil bölgedeyken dokun. Balık ne kadar nadirse bölge o kadar dar, işaretçi o kadar hızlıdır.',
      '# Balıklar', tbl(['Nadirlik', 'Şans', 'Türler'], FISH_RAR.map((R, i) => [R.name, `%${R.w}`, Object.values(FISH).filter(F => F.r === i).map(F => F.name).join(', ')])),
      'Nadir ve üstü balıktan küçük ihtimalle Örs Tozu ya da bileği taşı da çıkar. Balıklarını Tüccar Halvor’a satarsın (Tüccar › Tüccara sat ya da gölde).',
      '# Olta', tbl(['Olta', 'Bedel', 'Bekleme'], RODS.map(R => [R.name, R.cost ? `${tr(R.cost)} akçe` : 'Başlangıç', `${R.wait.join('–').replace(/\./g, ',')} sn`]))],
    tip: 'Defter, her türden kaç tane tuttuğunu ve en ağır balığını saklar.' },

  { id: 'carki', icon: 'wheel', title: 'Kader Çarkı', go: { act: 'wheel', label: 'Kader Çarkı', key: 'wheel' },
    intro: `${UNLOCK.wheel}. seviyede açılır. Çarkı ${Object.values(SHARDS).join(', ')} ile çevirirsin (bir çevirme ${WHEEL.cost} parça). Parçalar Gök Yarığı ve Meydan sezon ödüllerinden gelir.`,
    items: () => ['# Ödül havuzu', tbl(['Ödül', 'Şans'], WHEEL.pool.map(w => [w.name, `%${w.w}`]))],
    tip: 'Çark yalnızca parçalarla çevrilir; Yakut harcamazsın.' },

  { id: 'gorev', icon: 'quest', title: 'Görevler', go: { act: 'quests', label: 'Görevler' },
    intro: 'Dört görev türü vardır: ana görevler (hikâye), günlük, haftalık ve aylık. Sayaçlar aynı olaylardan beslenir.',
    items: () => ['# Ana görevler', 'Ana görev ağacı seni oyunun sistemleriyle sırayla tanıştırır ve ödüller verir. Adımlar oyun geliştikçe genişler.',
      '# Günlük (sunucu saatiyle 00:00’da yenilenir)', tbl(['Görev', 'Ödül'], [...QUESTS.map(q => [q.name, give(q.reward)]), [`Altısı da bitince`, give(QUEST_ALL)]]),
      '# Haftalık (pazartesi 00:00)', tbl(['Görev', 'Ödül'], [...WEEKLY.map(q => [q.name, give(q.reward)]), ['Hepsi bitince', WEEKLY_ALL.map(give).join(', ')]]),
      '# Aylık (ayın 1’i)', tbl(['Görev', 'Ödül'], [...MONTHLY.map(q => [q.name, give(q.reward)]), ['Hepsi bitince', MONTHLY_ALL.map(give).join(', ')]])],
    tip: 'Ödüller görev tamamlanınca kendiliğinden gelmez; Görevler ekranında “Al”a dokun.' },

  { id: 'klan', icon: 'clan', title: 'Klan ve Klan Karargâhı', go: { act: 'clan', label: 'Klan', key: 'clan' },
    intro: `Klan, oyuncuların ortak topluluğudur (${UNLOCK.clan}. seviyede açılır). Kurmak ${tr(CLAN.cost)} akçedir; katılmak ücretsizdir. Klanın sancağı Klan Karargâhı’nın direğinde dalgalanır.`,
    items: () => ['# Seviye', tbl(['Klan seviyesi', 'Üye sınırı', 'Oba Avı akçesi', 'Sonrakine'], CLAN_LEVELS.map((l, i) => [i + 1, l.cap, l.huntAkce ? `+%${l.huntAkce}` : '—', l.xp ? `${tr(l.xp)} deneyim` : 'En yüksek'])),
      `Klan deneyimi: bağış (${CLAN_XP.donatePer} akçeye 1), Oba Avı saldırısı (${CLAN_XP.hunt}), kuşatma saldırısı (${CLAN_XP.siege}), her kazanılan savaş (${CLAN_XP.win}).`,
      '# Rütbeler', tbl(['Rütbe', 'En çok'], Object.values(CLAN_RANKS).map(r => [r.name, r.max === Infinity ? 'Sınırsız' : r.max])),
      `Reis ${SUCCESSION_DAYS} gün giriş yapmazsa reislik en kıdemli etkin üyeye geçer.`,
      '# Bağış ve Oba Nişanı', `Günlük bağış sınırı ${tr(CLAN_DONATE.cap)} akçe (seviyeyle büyür). Bağış, Oba Avı ve kuşatma ${NISAN.name} kazandırır; nişanla Oba Dükkânı’ndan eşya alınır.`,
      tbl(['Oba Dükkânı', 'Bedel', 'Klan seviyesi', 'Haftalık sınır'], CLAN_SHOP.map(s => [s.name, s.cost, s.lvl, s.max])),
      '# Oba Avı', `Her gün klanın ortak Boss’u Tepegöz’e saldırılır (günde 1 hak, ${CLAN.bossTurns} tur). Verilen hasar klanın sandığını doldurur; sandık eşikleri: ${CLAN.tiers.map(tr).join(', ')}.`,
      tbl(['Av', 'Klan seviyesi', 'Boss canı', 'Boss saldırısı', 'Hasar sayılır'], HUNT_DIFF.map(d => [d.name, d.lvl, `×${d.hp}`, `×${d.atk}`, `%${d.credit}`])),
      '# Klan görevleri', tbl(['Görev', 'Dönem', 'Hedef'], CLAN_QUESTS.map(q => [q.name, q.per === 'day' ? 'Günlük' : 'Haftalık', `${tr(q.need)} ${q.unit}`])),
      '# Hisar Kuşatması', 'Klan olarak haftada 3 hakla hisar muhafızlarına saldırılır; puan klanın sıralamasına yazılır.'],
    tip: 'Klan sıralaması önce ırka, sonra klan gücüne ve kuşatma puanına bakar.' },

  { id: 'hisar', icon: 'gate', title: 'Hisar Kuşatması ve İttifak', go: { act: 'clanHisar', label: 'Klan: Hisar', key: 'clan' },
    intro: `Her ırkın bir hisarı vardır. Hisar Kuşatması haftada bir, ${['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'][HISAR.day]} ${HISAR.hour}:00’dan ${HISAR.len} dakika sürer (UTC+3). Pencerede yapılan kuşatma savaşları (ayrı ${HISAR.tries} hak) klanın hisar puanına yazılır; en yüksek puanlı klan bir sonraki kuşatmaya kadar hisarın sahibidir.`,
    items: () => ['# Vergi dağılımı', 'Hisarın sahibi varsa ırkın pazar vergisi üçe bölünür: 1/3 hisar sahibi klanın hazinesine, 1/3 o klanın ittifak ortaklarına (eşit; ortak yoksa sahibe), 1/3 Irklar Arası Vergi Havuzu’na. Hisar sahipsizken vergi Irk Hazinesi’ne gider.',
      '# Irklar Arası Vergi Havuzu', 'Havuz her hafta sonunda Büyük Sefer’i kazanan ırkın, o hafta savaşa katılan üyelerine eşit bölünür ve posta ile gelir. Beraberlikte havuz devreder.',
      '# İttifak', `Aynı ırktan en çok ${HISAR.allyMax} klan ittifak kurar. Teklif, kabul ve ayrılma Reis ile Yardımcıların işidir.`,
      '# İttifak Yardımı', `Süreli işlerde (Karargâh tesis yükseltmesi) “Yardım iste” basılır. Klanındaki ve müttefik klanlardaki her oyuncu bir işe bir kez yardım eder; her yardım özgün sürenin %${HISAR.helpPct}’u kadar kısaltır, süre en az üçte birine iner. Yardım edene ${HISAR.helpAkce} akçe (günde ${HISAR.helpDaily} kez).`],
    tip: 'Kuşatma penceresinde klanınla birlikte çevrimiçi ol: bütün hakların hisar puanına yazılır.' },

  { id: 'meydan', icon: 'arena', title: 'Meydan', go: { act: 'meydan', label: 'Meydan', key: 'arena' },
    intro: `Meydan, oyuncularla (ve yapay rakiplerle) karakterinle tek başına dövüştüğün PvP alanıdır (${UNLOCK.arena}. seviyede açılır). Günde ${ARENA.tickets} hakkın vardır.`,
    items: () => ['# Karşı ırk', 'Meydan’da yalnızca karşı ırktan rakiplerle dövüşürsün: rakip listesi, Canlı Meydan, Kan Davası ve yapay rakipler hep öbür ırktandır.',
      '# Puan ve lig', `Her saldırı zaferi +${ARENA_PTS.win} Meydan puanı verir; karakterin savunmada sana saldıranı püskürtürse +${ARENA_PTS.def} puan alırsın (Meydan’ı açınca işlenir). Yenilgide puan düşmez; aynı rakibi tekrar yenmek de tam puan verir. Galibiyet ${RULES.arena.san[0]} Şan, yenilgi ${RULES.arena.san[1]} Şan verir; günün ilk galibiyeti ${RULES.arena.firstWinYakut} Yakut verir. Canlı Meydan’da Şan ${RULES.live.san[0]}/${RULES.live.san[1]}’dir.`,
      tbl(['Lig', 'En düşük puan'], LEAGUES.map(l => [l.name, l.min])),
      `Rakipler eşya seviyene yakın seçilir (önce ±%${MATCH.steps[0] * 100}, gerekirse ±%${MATCH.steps[1] * 100} ve ±%${MATCH.steps[2] * 100}). Sezon ${SEASON.days} gün sürer; sezon sonunda lig ve sıra ödülleri postayla gelir.`,
      '# Günün Üstün Irkı', `Her gün iki ırkın Meydan’da kazandığı puanlar toplanır; gün bitince fazla olan ırk Günün Üstün Irkı olur. O gün en az bir Meydan savaşı yapan herkese ertesi gün postayla katılım ödülü gelir: üstün ırk ${RACE_DAY.top} kat (${RACE_DAY.unit.yakut * RACE_DAY.top} Yakut, ${RACE_DAY.unit.san * RACE_DAY.top} Şan), diğer ırk ${RACE_DAY.low} kat; beraberlikte iki ırk ${RACE_DAY.tie} kat alır.`,
      '# Şan rütbesi', 'Ömür boyu kazandığın Şan rütbeni belirler ve adının yanında nişan olarak görünür; Şan harcamak rütbeni düşürmez.',
      tbl(['Rütbe', 'Gereken toplam Şan'], SAN_RANKS.map(r => [r.name, tr(r.san)])),
      '# Kan Davası', `Seni yenen rakipler Kan Davası listesine yazılır (en çok ${FEUD_MAX}). Onları yenersen kayıt “öç alındı” olur. Savunmanı düşürenler de savaş raporundan görünür.`,
      '# Şan Dükkânı ve Market', `Şan Dükkânı’nda Can, Saldırı ve Savunma için kalıcı Bonus alınır (her seviye karaktere +%${HALL.pct * 100}, en çok ${HALL.max} seviye). Meydan Marketi günlük sınırlı ürünler satar: ${ARENA_SHOP.map(s => s.name).filter((n, i, a) => a.indexOf(n) === i).join(', ')}.`],
    tip: 'Meydan’da savunmanı yapay zekâ oynar; savunma için eşyalarını ve yeteneklerini sağlam tut.' },

  { id: 'zindan', icon: 'portal', title: 'Zindanlar ve Etkinlikler', go: { act: 'gateEvents', label: 'Kapı: Etkinlikler' },
    intro: 'Bölge aşamalarından sonra gelen zindanlar kaynak ve eşya kazandırır; çoğunun günlük hakkı ya da zamanı vardır.',
    items: () => ['# Bölgeler', tbl(['Bölge', 'Seviye'], ZONES.map(z => [z.name, `${z.lv[0]}–${z.lv[1]}`])),
      `Her bölgede 25 aşama vardır; bölge son Boss’uyla biter. Tur kademeleri: ${STAGE_TIERS.map(t => t.name).join(', ')}; sonraki tur önceki turun son Boss’u geçilince açılır ve daha zorlu ama daha çok ödüllüdür. Günlük Boss’lar ilk geçişten sonra günde bir kez ödül verir.`,
      '# Zindanlar', tbl(['Zindan', 'Seviye', 'Kural'], [
        ['Dipsiz Kuyu', UNLOCK.well, `${RULES.well.waves} dalga, günde ${RULES.well.daily} hak`],
        ['Yeraltı Ocağı', UNLOCK.depth, `${RULES.depth.floors} katlı aylık tırmanış; her ${RULES.depth.bossEvery}. katta boss`],
        ['Gök Yarığı', UNLOCK.rift, `Yalnızca cumartesi ve pazar; günde ${RULES.rift.daily} hak; parça kazandırır`],
        ['Mühürlü Oda', UNLOCK.seal, 'Mühür Taşı ile girilir; Boss’ta eşsiz düşme şansı yüksektir'],
        ['Akın', 12, `4 saatte bir bir saat açılır; ${RULES.akin.waves} dalgada en çok yaratığı kes`],
        ['Sancak Savaşı', UNLOCK.banner, 'Karakterinle, yapay müttefiklerle; günde 5 hak'],
        ['Hisar Kuşatması', UNLOCK.siege, 'Klan gerekir; haftada 3 hak'],
        ['Dünya Baskını', BASKIN.lvl, `Cumartesi ve pazar; günde ${BASKIN.tries} hak; iki ırk ortak havuz`]]),
      '# Dünya Baskını', `Hafta sonu (cumartesi 00:00 – pazar 23:59, sunucu saati) Küllerin Tarikatı’nın ${MOBS[BASKIN.boss].name} Boss’u gelir. ${Object.values(FACTIONS).map(f => f.name).join(' ve ')} aynı havuza hasar yazar; havuz %${BASKIN.bars.join(' / %')} barajlarını geçtikçe kademe açılır. Hafta sonu bitince en az bir kez saldırmış herkes, iki ırktan da, açılan kademelerin ödülünü postayla alır. Hedef sunucunun etkin nüfusuna göre ölçeklenir; savaş ${BASKIN.turns} tur sürer, kazanma/kaybetme yoktur.`,
      '# Haftalık düzen', 'Her hafta Dipsiz Kuyu, Yeraltı Ocağı, Gök Yarığı ve Mühürlü Oda’nın yaratıklarına sıradaki düzen uygulanır:',
      tbl(['Düzen', 'Yaratıklara etkisi'], DUNGEON_MODS.map(m => [m.name, [m.mob.hp && `can ×${m.mob.hp}`, m.mob.atk && `saldırı ×${m.mob.atk}`, m.mob.def && `savunma ×${m.mob.def}`, m.mob.spd && `hız +${m.mob.spd}`, m.mob.crit && `kritik +%${m.mob.crit * 100}`, m.mob.res && 'direnç', m.mob.weak && 'yeni zayıflık'].filter(Boolean).join(', ')]))],
    tip: 'Enerji ve haklar boşa gitmesin: günlük hakları sıfırlanmadan önce kullan.' },

  { id: 'otag', icon: 'crown', title: 'Otağ, Başbuğ ve Bölge', go: { act: 'otagMenu', label: 'Otağ' },
    intro: `${KINGDOM.court}, ırkının yönetim yeridir. Her ırkın bir ${KINGDOM.title}’ı vardır; ${KINGDOM.treasury}’ni o yönetir.`,
    items: () => ['# Başbuğ', `Adaylık için en az ${KINGDOM.candLvl}. seviye, ${KINGDOM.candSan} Şan ve ${KINGDOM.candAgeDays} günlük hesap gerekir; ${tr(KINGDOM.deposit)} akçe teminat yatırılır. Oy vermek için ${KINGDOM.voteLvl}. seviye ve ${KINGDOM.voteAgeDays} günlük hesap yeter. Başbuğ haftalıktır.`,
      '# Ulufe ve Ferman', `Başbuğ hazineden ${GRANT.name} dağıtabilir: tek ulufe hazinenin binde ${GRANT.perGrantPm}’ünü, bir haftadaki toplam %${GRANT.weeklyPct}’ini geçemez. Ferman, ırk sohbetine sabitlenen en çok ${DECREE.max} karakterlik duyurudur (günde en çok ${DECREE.perDay}).`,
      '# Bölge hâkimiyeti', `Dört bölge her hafta, orada kazanılan zaferlere göre el değiştirir (yaratık aşaması ${TERR.pts.mob}, kapı ${TERR.pts.gate}, günlük boss ${TERR.pts.boss} puan; puan ırkın etkin oyuncu sayısına bölünür, büyük ırk sırf kalabalık diye kazanmaz). Hâkim ırk o bölgede %${TERR.bonusPct} Bonus alır: Vahran Ovası ve Kızıl Bahar Meydanı’nda akçe, Kül Geçidi ve Sisli Çukur’da eşya düşme oranı.`],
    tip: 'Diyar Haritası, bölgelerin kimde olduğunu ve hafta sonuna kalan süreyi gösterir.' },

  { id: 'kervan', icon: 'cart', title: 'Kervan, Premium ve Ödüller', go: { act: 'shop', label: 'Kervan' },
    intro: 'Kervan, Yakut karşılığı günlük sınırlı ürünler satar. Premium üyelik savaş kazançlarını artırır. Yakut oyun içinde de kazanılır; Yakut Al ekranı gerçek parayla alım içindir.',
    items: () => ['# Kervan ürünleri', tbl(['Ürün', 'Bedel (Yakut)', 'Günlük sınır'], SHOP.map(s => [`${s.name} <span class="mut">${s.desc}</span>`, s.cost, s.max])),
      '# Premium üyelik (30 gün)', tbl(['Kademe', 'Deneyim', 'Akçe', 'Eşya düşme', 'Maden', 'Pazar yuvası', 'Meydan hakkı'], PREMIUM.slice(1).map(p => [`<b style="color:${p.color}">${p.name}</b>`, `+%${p.xp * 100}`, `+%${p.akce * 100}`, `+%${p.drop * 100}`, `×${p.mine}`, `+${p.slots}`, `+${p.tickets}`])),
      'Bronz Yakutla alınır; Gümüş ve Platin yalnızca gerçek parayla alınır.',
      '# Promosyon kodu', 'Etkinlik ve duyurularda paylaşılan kodları Menü’deki “Promosyon kodu kullan”a yazarsın; her kod hesap başına bir kez geçerlidir.'],
    tip: 'Uğur Muskası ve Usta Bileği Taşı gibi örs ürünleri Kervan’da pahalıdır; önce Meydan Marketi’ne bak.' },

  { id: 'sohbet', icon: 'news', title: 'Sohbet ve Duyurular', go: { act: 'chatOpen', label: 'Sohbet' },
    intro: 'Sohbet kanalları: Genel, ırk, klan, arkadaşlar ve özel mesajlar. Duyurular ise sunucudan gelen haberlerdir.',
    items: () => ['# Sohbet', `Mesajlar en çok ${CHAT.max} karakter olabilir, iki mesaj arası en az ${CHAT.gapMs / 1000} sn beklenir. Küfür otomatik yıldızlanır, bağlantı ve telefon numarası ayıklanır. Rahatsız eden oyuncuyu susturabilir, engelleyebilir ya da bildirebilirsin.`,
      '# Duyurular', 'Ekranın üstünden geçen sarı şerit, sunucu duyurularını ve etkinlik hatırlatmalarını (örneğin Canlı Meydan pencereleri) gösterir; sabit duyuru en az 5 dakika kalır. Duyuru şeridini ve sohbet şeridini Ayarlar’daki Erişilebilirlik sekmesinden gizleyebilirsin. Menü’deki “Duyuru” eski haberleri listeler.',
      '# Sorun bildirme', 'Menü’deki “Sorun / Teknik Destek” ile destek talebi açabilirsin.'],
    tip: 'Sohbette kişisel bilgi (adres, numara) paylaşma.' },

  { id: 'ayarlar', icon: 'menu', title: 'Ayarlar ve Erişilebilirlik', go: { act: 'settings', label: 'Ayarlar' },
    intro: 'Ayarlar; Grafik, Ses, Erişilebilirlik, Dil, Bildirimler ve Hesap sekmelerinden oluşur. Oyun yalnızca yatay ekranda oynanır.',
    items: () => ['# Grafik ve ses', 'Grafik kalitesi kademelidir (Düşük, Orta, Yüksek); telefon ısınıyor ya da kasıyorsa kademeyi düşür. Ses sekmesinde ana ses, müzik ve efektler ayrı ayarlanır.',
      '# Erişilebilirlik', 'Arayüz ölçeği, yazı boyutu (normal, büyük, çok büyük), renk körü modu, yüksek kontrast, ışık çakması / sarsıntı / parlama azaltma, tek kanal ses, ses altyazıları, büyük dokunma alanı, Canlı Meydan hamle süresini ikiye katlama, tek elle oynama (alt menü sola/sağa), varsayılan savaş hızı, büyütülmüş sıra çubuğu ve sohbet / duyuru şeridini gizleme seçenekleri vardır.',
      '# Dil ve hesap', 'Dil sekmesinden Türkçe ve İngilizce arasında geçersin. Hesap sekmesi kimlik, profil ve cihaz bilgilerini gösterir.'],
    tip: 'Ayarlar cihazında saklanır; başka cihazda yeniden seçmen gerekebilir.' },
];

// ---- Görünüm ----
let sel = 'baslarken';
const html = s => `<h3 class="rh-h">${svg(s.icon)}<span>${s.title}</span></h3><p class="rh-intro">${s.intro}</p>${s.items().map(x => (x[0] === '#' ? `<h4 class="rh-sub">${x.slice(2)}</h4>` : x[0] === '<' ? x : `<p class="rh-li">${x}</p>`)).join('')}${s.tip ? `<div class="hint rh-tip"><b>İpucu.</b> ${s.tip}</div>` : ''}${s.go ? `<div class="mbtns rh-go"><button class="btn green" data-a="rhGo" data-id="${s.id}">${s.go.label} ›</button></div>` : ''}`;
export function renderRehber() {
  const s = SECTIONS.find(x => x.id === sel) || SECTIONS[0];
  return `<div class="rh"><nav class="rh-nav" aria-label="Rehber bölümleri">${SECTIONS.map(x => `<button data-a="rhSel" data-id="${x.id}" class="${x.id === s.id ? 'on' : ''}"><i>${svg(x.icon)}</i><span>${x.title}</span></button>`).join('')}</nav><article class="rh-page">${html(s)}</article></div>`;
}
ACT.rhSel = d => { sel = d.id; redraw(); const p = document.querySelector('#page'); if (p) p.scrollTop = 0; };
ACT.rhGo = d => {
  const s = SECTIONS.find(x => x.id === d.id);
  if (!s?.go) return;
  if (s.go.key && locked(s.go.key)) return toast(`${s.title} seviye ${UNLOCK[s.go.key]} olunca açılır.`);
  closeWin();
  ACT[s.go.act]?.();
};

// Ansiklopedi penceresi: ui-esya.js'in penceresine "Rehber" sekmesi eklenir (ilk sekme, varsayılan)
const codex0 = ACT.codex;
ACT.codex = d => {
  const want = d?.tab || 'rehber';
  codex0({ ...d, tab: want === 'rehber' ? 'mobs' : want });
  const w = cur();
  if (!w || w.title !== 'Ansiklopedi') return;
  if (!w.tabs.some(t => t.id === 'rehber')) {
    w.tabs = [{ id: 'rehber', label: 'Rehber', small: `${SECTIONS.length} bölüm`, icon: 'book' }, ...w.tabs.map(t => (t.id === 'mobs' ? { ...t, label: 'Canavarlar' } : t))];
    const r0 = w.render; w.render = t => (t === 'rehber' ? renderRehber() : r0(t));
  }
  if (want === 'rehber') ACT.tab({ id: 'rehber' });
};
ACT.rehber = d => { closeModal(); if (d?.id) sel = d.id; ACT.codex({ tab: 'rehber' }); };
