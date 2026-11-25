// Ana Görevler: oyunu öğreten ve ilerleten 64 adımlık görev ağacı (16 bölüm × 4; 7–16 hikâye bölümleri). Kural burada; arayüz js/ui-anagorev.js.
// Her düğüm: id, ch (bölüm sırası), ad, acik (neyi öğretir), need + v(p) (ilerleme: gerçek durumdan okunur), reward,
// pre (önkoşul düğümler), go (arayüzdeki ACT adı), pos (bölüm içindeki yeri: a üst, b/c orta, d alt). Alınanlar p.mq = { done: { id: 1 } }.
import { STAGES_PER_ZONE } from './zones.js';
import { blessDrops } from './nufus.js'; // nüfus Bereketi: görev ödülünün akçesi
import { fail, grantAll } from './util.js';
import { ACH_BY } from './meta.js';

const C = (p, k) => p.ach?.c?.[k] || 0;
const A = id => p => ACH_BY[id].v(p);
const heroes = p => Object.values(p.heroes || {});
const spent = p => heroes(p).reduce((a, h) => a + Object.values(h.tree || {}).reduce((x, n) => x + n, 0), 0);
const maxSlots = p => Math.max(0, ...heroes(p).map(h => Object.keys(h.eq || {}).length));
const zoneDone = n => p => ((p.stages || {})[`${n}-${STAGES_PER_ZONE}`] > 0 ? 1 : 0);
const hasStage = id => p => ((p.stages || {})[id] > 0 ? 1 : 0);

export const MQ_CHAPTERS = [
  { id: 1, name: 'Çıraklık', desc: 'İlk adımlar' },
  { id: 2, name: 'Örs ve Maden', desc: 'Demir işlemek' },
  { id: 3, name: 'Diyar Yolu', desc: 'Seferin başı' },
  { id: 4, name: 'Çarşı ve Meydan', desc: 'Pazar, klan ve artı' },
  { id: 5, name: 'Şan ve Talih', desc: 'Divan, kuyu ve çark' },
  { id: 6, name: 'Usta Yolu', desc: 'Zirveye doğru' },
  // 19 Kas: hikâye bölümleri (VAHRAN: Tarihin Külleri) — Kül Geçidi'nden Sisli Çukur'a, Küllerin Tarikatı'na
  { id: 7, name: 'Külün İzi', desc: 'Gri cübbeli gölgeler' },
  { id: 8, name: 'Yashka’nın Kehaneti', desc: 'Süt beyazı göz' },
  { id: 9, name: 'Kızıl Bahar', desc: 'İki ordunun meydanı' },
  { id: 10, name: 'Taş Yemini', desc: 'Çatlayan barış' },
  { id: 11, name: 'Kralın Buyruğu', desc: 'Volgar ve Edran' },
  { id: 12, name: 'Sisli Çukur', desc: 'Kemik ve sis' },
  { id: 13, name: 'Ateşsiz Kazan', desc: 'Tarikatın kalbi' },
  { id: 14, name: 'Mareşalin Düşüşü', desc: 'Son hesaplaşma' },
  { id: 15, name: 'Külden Doğan', desc: 'Diyarın yeni yüzü' },
  { id: 16, name: 'Efsane', desc: 'Adın taşa kazınır' },
];

// Bölüm içi şekil: a (üst) → b (sol) ve c (sağ) → d (alt); sonraki bölümün a'sı bu bölümün d'sine bağlanır.
const N = (id, ch, pos, ad, acik, need, v, reward, go, pre = []) => ({ id, ch, pos, ad, acik, need, v, reward, go, pre });
export const MQ = [
  N('m01', 1, 'a', 'İlk Kan', 'Kapı’dan bir bölgeye gir; savaş sırayla oynanır.', 1, p => p.stats?.wins || 0, [{ t: 'akce', n: 300 }], 'gate'),
  N('m02', 1, 'b', 'Donan', 'Çanta’dan bir eşya kuşan; eşya gücü artırır.', 1, p => Math.max(C(p, 'equip'), maxSlots(p) >= 3 ? 1 : 0), [{ t: 'energy', n: 20 }], 'party', ['m01']),
  N('m03', 1, 'c', 'Yetenek Puanı', 'Karakter ekranında bir yetenek ağacına puan harca.', 1, spent, [{ t: 'akce', n: 400 }], 'party', ['m01']),
  N('m04', 1, 'd', 'İlk Kapı', 'Vahran Ovası’nın 5. aşamasındaki kapı kaptanını yen.', 1, hasStage('1-5'), [{ t: 'yakut', n: 10 }], 'gate', ['m02', 'm03']),

  N('m05', 2, 'a', 'Örs’ün Sesi', 'Örs’te 3 kez başarılı artı bas.', 3, p => p.stats?.upOk || 0, [{ t: 'stone', g: 0, n: 2 }], 'anvil', ['m04']),
  N('m06', 2, 'b', 'Hurda Ayıkla', 'Örs’te 5 eşya parçala ya da sat; toz ve akçe kazan.', 5, A('break'), [{ t: 'akce', n: 500 }], 'anvil', ['m05']),
  N('m07', 2, 'c', 'Cevher Topla', 'Maden’de biriken cevheri topla.', 1, p => C(p, 'ore') > 0 ? 1 : 0, [{ t: 'energy', n: 25 }], 'mine', ['m05']),
  N('m08', 2, 'd', 'Derin Damar', 'Maden’i 2. seviyeye çıkar; kazanç artar.', 2, p => p.mine?.lvl || 0, [{ t: 'yakut', n: 10 }], 'mine', ['m06', 'm07']),

  N('m09', 3, 'a', 'Yol Görmüş', 'Seviyeni 10’a çıkar.', 10, p => p.lvl, [{ t: 'akce', n: 800 }], 'gate', ['m08']),
  N('m10', 3, 'b', 'Sözünü Tut', 'Günlük görevlerden birinin ödülünü al.', 1, p => Math.max(C(p, 'qclaim'), C(p, 'dailyAll'), Object.keys(p.daily?.qdone || {}).length ? 1 : 0), [{ t: 'energy', n: 30 }], 'quests', ['m09']),
  N('m11', 3, 'c', 'Baş Avı', 'Bir Boss yen; kapı kaptanları ve Boss’lar günde bir kez ödül verir.', 1, A('bosskill'), [{ t: 'stone', g: 0, n: 3 }], 'gate', ['m09']),
  N('m12', 3, 'd', 'Vahran Fatihi', 'Vahran Ovası’nı bitir: 25. aşamanın Boss’unu yen.', 1, zoneDone(1), [{ t: 'yakut', n: 20 }], 'gate', ['m10', 'm11']),

  N('m13', 4, 'a', 'Meydana Çık', 'Meydan’da bir dövüş yap (12. seviyede açılır).', 1, p => (p.arena?.wins || 0) + (p.arena?.losses || 0), [{ t: 'san', n: 60 }], 'meydan', ['m12']),
  N('m14', 4, 'b', 'Pazar Gezen', 'Pazar’dan bir eşya satın al.', 1, A('bought'), [{ t: 'akce', n: 1500 }], 'market', ['m13']),
  N('m15', 4, 'c', 'Oba Ateşi', 'Bir klana katıl ya da klan kur (20. seviyede açılır).', 1, A('clan'), [{ t: 'akce', n: 2000 }], 'clan', ['m13']),
  N('m16', 4, 'd', 'Artının Peşinde', 'Bir eşyayı +5 yap; bileği taşı ve emek ister.', 5, A('plus'), [{ t: 'stone', g: 1, n: 1 }], 'anvil', ['m14', 'm15']),

  N('m17', 5, 'a', 'Meydan Eri', 'Meydan’da 3 zafer kazan; şan toplanır.', 3, A('awins'), [{ t: 'san', n: 100 }], 'meydan', ['m16']),
  N('m18', 5, 'b', 'Şan Divanı', 'Şan Divanı’nda bir seviye al (25. seviyede açılır).', 1, A('hall'), [{ t: 'yakut', n: 20 }], 'hall', ['m17']),
  N('m19', 5, 'c', 'Dipsiz Kuyu', 'Dipsiz Kuyu’da 5 dalga temizle (25. seviye, Kapı → Zindanlar).', 5, A('well'), [{ t: 'stone', g: 1, n: 2 }], 'dungeons', ['m17']),
  N('m20', 5, 'd', 'Kader Çeviren', 'Kader Çarkı’nı bir kez çevir.', 1, A('wheel'), [{ t: 'energy', n: 40 }], 'wheel', ['m18', 'm19']),

  N('m21', 6, 'a', 'Uzmanlık Yolu', 'Uzmanlık yolunu seç (10. seviyede açılır).', 1, p => heroes(p).some(h => h.path) ? 1 : 0, [{ t: 'yakut', n: 30 }], 'partyPath', ['m20']),
  N('m22', 6, 'b', 'Mühür Kıran', 'Mühürlü Oda’yı bir kez kazan (Kapı → Zindanlar).', 1, A('seal'), [{ t: 'stone', g: 2, n: 1 }], 'dungeons', ['m21']),
  N('m23', 6, 'c', 'Sözünün Eri', 'Bir gün bütün günlük görevleri bitir ve sandığı aç.', 1, A('dailyall'), [{ t: 'yakut', n: 30 }], 'quests', ['m21']),
  N('m24', 6, 'd', 'Kül Geçidi', 'Kül Geçidi’ni bitir: 2. bölgenin son Boss’unu yen.', 1, zoneDone(2), [{ t: 'yakut', n: 60 }, { t: 'stone', g: 2, n: 2 }], 'gate', ['m22', 'm23']),
];
// 19 Kas: hikâye görevleri (7–16. bölüm). İlerleme gerçek durumdan okunur; ödüller Bağlı (nt) gelir.
const lvl = p => p.lvl || 0;
MQ.push(
  N('m25', 7, 'a', 'Küldeki Ayak İzleri', 'Thrak/Bran sınır karakolunda gri cübbeli gölgeler görmüş. Kül Geçidi’nin 5. aşamasına ulaş.', 1, hasStage('2-5'), [{ t: 'akce', n: 3000 }], 'gate', ['m24']),
  N('m26', 7, 'b', 'Sessiz Kılıçlar', 'Gölgelerin peşindeki yaratıkları sustur: toplam 500 düşman devir.', 500, A('kills'), [{ t: 'energy', n: 40 }], 'gate', ['m25']),
  N('m27', 7, 'c', 'Demiri Bile', 'Gölgelere karşı silahın keskin olsun: bir eşyayı +6 yap.', 6, A('plus'), [{ t: 'stone', g: 1, n: 2 }], 'anvil', ['m25']),
  N('m28', 7, 'd', 'Cübbenin Sahibi', 'Kül Geçidi’nin 15. aşamasını geç; cübbelilerin izini sür.', 1, hasStage('2-15'), [{ t: 'yakut', n: 25 }], 'gate', ['m26', 'm27']),

  N('m29', 8, 'a', 'Şamanın Çağrısı', 'Yashka seni bekliyor: seviyeni 25’e çıkar.', 25, lvl, [{ t: 'akce', n: 4000 }], 'gate', ['m28']),
  N('m30', 8, 'b', 'Kemik Fal', 'Yashka’nın falı için 3 farklı Boss türü yen.', 3, A('bosskind'), [{ t: 'stone', g: 1, n: 2 }], 'gate', ['m29']),
  N('m31', 8, 'c', 'Derinden Gelen Ses', 'Dipsiz Kuyu’da 10 dalga temizle; ses aşağıdan geliyor.', 10, A('well'), [{ t: 'energy', n: 50 }], 'dungeons', ['m29']),
  N('m32', 8, 'd', 'Kehanetin Kapısı', 'Kül Geçidi’ni baştan sona geç; kehanet yolu açar.', 1, zoneDone(2), [{ t: 'yakut', n: 40 }], 'gate', ['m30', 'm31']),

  N('m33', 9, 'a', 'Kızıl Bahar’a Adım', 'İki ordunun çarpıştığı meydana gir: Kızıl Bahar Meydanı’nın 1. aşamasını geç.', 1, hasStage('3-1'), [{ t: 'akce', n: 6000 }], 'gate', ['m32']),
  N('m34', 9, 'b', 'Meydanın Tozu', 'Meydan’da 10 zafer kazan; ordunun gözü sende.', 10, A('awins'), [{ t: 'san', n: 200 }], 'meydan', ['m33']),
  N('m35', 9, 'c', 'Kırık Mızraklar', 'Savaş alanından 20 eşya topla, işe yaramayanı parçala.', 20, A('break'), [{ t: 'akce', n: 5000 }], 'anvil', ['m33']),
  N('m36', 9, 'd', 'Bahar Komutanı', 'Kızıl Bahar Meydanı’nın 10. aşamasını geç.', 1, hasStage('3-10'), [{ t: 'yakut', n: 40 }], 'gate', ['m34', 'm35']),

  N('m37', 10, 'a', 'Çatlak Dikilitaş', 'Taş Yemini çatlıyor: seviyeni 40’a çıkar.', 40, lvl, [{ t: 'akce', n: 8000 }], 'gate', ['m36']),
  N('m38', 10, 'b', 'Yemin Pazarı’nda Fısıltı', 'Pazar’da 5 eşya sat; tüccarlar söylentileri satar.', 5, A('sold'), [{ t: 'energy', n: 50 }], 'market', ['m37']),
  N('m39', 10, 'c', 'Mühürlerin Ardı', 'Mühürlü Oda’yı 3 kez kazan.', 3, A('seal'), [{ t: 'stone', g: 2, n: 1 }], 'dungeons', ['m37']),
  N('m40', 10, 'd', 'Barışın Bekçisi', 'Kızıl Bahar Meydanı’nın 20. aşamasını geç.', 1, hasStage('3-20'), [{ t: 'yakut', n: 50 }], 'gate', ['m38', 'm39']),

  N('m41', 11, 'a', 'Taht Salonu', 'Kral seni huzuruna çağırıyor: Kızıl Bahar Meydanı’nı bitir.', 1, zoneDone(3), [{ t: 'yakut', n: 60 }], 'gate', ['m40']),
  N('m42', 11, 'b', 'Kralın Kılıcı', 'Krala layık ol: bir eşyayı +7 yap.', 7, A('plus'), [{ t: 'stone', g: 2, n: 1 }], 'anvil', ['m41']),
  N('m43', 11, 'c', 'Oba Sancağı', 'Bir klanda ol; kral klanların gücüne güvenir.', 1, A('clan'), [{ t: 'akce', n: 10000 }], 'clan', ['m41']),
  N('m44', 11, 'd', 'Buyruk', 'Seviyeni 50’ye çıkar; buyruk seni Sisli Çukur’a yollar.', 50, lvl, [{ t: 'yakut', n: 60 }], 'gate', ['m42', 'm43']),

  N('m45', 12, 'a', 'Sisin Eşiği', 'Sisli Çukur’un 1. aşamasını geç.', 1, hasStage('4-1'), [{ t: 'akce', n: 12000 }], 'gate', ['m44']),
  N('m46', 12, 'b', 'Kemik Yığını', 'Toplam 5000 düşman devir; çukur dolu.', 5000, A('kills'), [{ t: 'energy', n: 60 }], 'gate', ['m45']),
  N('m47', 12, 'c', 'Yerin Dibi', 'Kor katlarında 25. kata in.', 25, A('depth'), [{ t: 'stone', g: 2, n: 2 }], 'dungeons', ['m45']),
  N('m48', 12, 'd', 'Ateşsiz Kazanın Kokusu', 'Sisli Çukur’un 8. aşamasını geç.', 1, hasStage('4-8'), [{ t: 'yakut', n: 70 }], 'gate', ['m46', 'm47']),

  N('m49', 13, 'a', 'Tarikatın Kapısı', 'Seviyeni 58’e çıkar; tarikat güçlüye kapı açar.', 58, lvl, [{ t: 'akce', n: 15000 }], 'gate', ['m48']),
  N('m50', 13, 'b', 'Gri Cübbeler', 'Sisli Çukur’un 14. aşamasını geç.', 1, hasStage('4-14'), [{ t: 'yakut', n: 70 }], 'gate', ['m49']),
  N('m51', 13, 'c', 'Nadide Sandık', 'Bir eşsiz eşya bul.', 1, A('uniq'), [{ t: 'stone', g: 2, n: 2 }], 'gate', ['m49']),
  N('m52', 13, 'd', 'Kazanın Bekçisi', 'Sisli Çukur’un 20. aşamasını geç.', 1, hasStage('4-20'), [{ t: 'yakut', n: 80 }], 'gate', ['m50', 'm51']),

  N('m53', 14, 'a', 'Mareşalin Gölgesi', 'Seviyeni 62’ye çıkar.', 62, lvl, [{ t: 'akce', n: 20000 }], 'gate', ['m52']),
  N('m54', 14, 'b', 'Usta Demirci', 'Bir eşyayı +8 yap.', 8, A('plus'), [{ t: 'stone', g: 2, n: 3 }], 'anvil', ['m53']),
  N('m55', 14, 'c', 'Meydan Ustası', 'Meydan’da 50 zafer kazan.', 50, A('awins'), [{ t: 'san', n: 400 }], 'meydan', ['m53']),
  N('m56', 14, 'd', 'Mareşal Marven', 'Sisli Çukur’u bitir: Mareşal Marven’i yen.', 1, zoneDone(4), [{ t: 'yakut', n: 120 }], 'gate', ['m54', 'm55']),

  N('m57', 15, 'a', 'Külden Doğan', 'Azami seviyeye (65) ulaş.', 65, lvl, [{ t: 'yakut', n: 100 }], 'gate', ['m56']),
  N('m58', 15, 'b', 'Mühür Efendisi', 'Mühürlü Oda’yı 10 kez kazan.', 10, A('seal'), [{ t: 'stone', g: 2, n: 3 }], 'dungeons', ['m57']),
  N('m59', 15, 'c', 'Bilge Gezgin', 'Ansiklopedide 25 kayıt aç.', 25, A('codex'), [{ t: 'akce', n: 30000 }], 'gate', ['m57']),
  N('m60', 15, 'd', 'Diyar Fatihi', 'Bütün bölgelerin yıldızlarını topla: 150 yıldız.', 150, A('stars'), [{ t: 'yakut', n: 120 }], 'gate', ['m58', 'm59']),

  N('m61', 16, 'a', 'Bin Kesen', 'Toplam 30.000 düşman devir.', 30000, A('kills'), [{ t: 'energy', n: 100 }], 'gate', ['m60']),
  N('m62', 16, 'b', 'Hazine Bekçisi', '5 eşsiz eşya bul.', 5, A('uniq'), [{ t: 'stone', g: 2, n: 4 }], 'gate', ['m61']),
  N('m63', 16, 'c', 'Derin Yürüyen', 'Kor katlarında 50. kata in.', 50, A('depth'), [{ t: 'yakut', n: 100 }], 'dungeons', ['m61']),
  N('m64', 16, 'd', 'Taşa Kazınan Ad', 'Bir eşyayı +10 yap; adın Taş Yemini’ne kazınsın.', 10, A('plus'), [{ t: 'yakut', n: 200 }, { t: 'stone', g: 2, n: 5 }], 'anvil', ['m62', 'm63']),
);
export const MQ_BY = Object.fromEntries(MQ.map(n => [n.id, n]));

export const mqDone = p => (p.mq && p.mq.done) || {};
export const mqProg = (p, n) => Math.min(n.need, Math.max(0, Math.floor(+n.v(p) || 0)));
export const mqState = (p, n) => {
  const d = mqDone(p);
  if (d[n.id]) return 'done';
  if (!n.pre.every(x => d[x])) return 'locked';
  return mqProg(p, n) >= n.need ? 'ready' : 'open';
};
export const mqReady = p => MQ.filter(n => mqState(p, n) === 'ready').length;
// Sıradaki görev: önce alınabilir olan, yoksa açık olan ilk düğüm (sırayla)
export const mqNext = p => MQ.find(n => mqState(p, n) === 'ready') || MQ.find(n => mqState(p, n) === 'open') || null;

export const MQ_WORLD = {
  async 'mq.claim'(ctx, p, { id }) {
    const n = (typeof id === 'string' && Object.hasOwn(MQ_BY, id)) ? MQ_BY[id] : fail('bad-quest', 'Böyle bir görev yok.');
    const st = mqState(p, n);
    if (st === 'done') fail('claimed', 'Bu ödül alındı.');
    if (st === 'locked') fail('locked', 'Önce önceki görevleri bitir.');
    if (st !== 'ready') fail('not-done', 'Görev henüz tamamlanmadı.');
    if (!p.mq) p.mq = { done: {} };
    if (!p.mq.done) p.mq.done = {};
    p.mq.done[n.id] = 1;
    return { loot: grantAll(p, blessDrops(p, n.reward), { nt: 1 }) };
  },
};
