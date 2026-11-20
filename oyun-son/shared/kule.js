// Kül Kulesi (20 Kas, kullanıcı): bölgeler 65. seviyede bitiyor (Sisli Çukur, 60–65); sonrası için sonsuz katlı kule.
// Katlar oyuncu başına kalıcıdır (sezonla sıfırlanmaz): p.kule = geçilen en yüksek kat. Her kat Küllerin Tarikatı'nın
// yaratıklarıyla (bestiary.js `cult` aileleri) kurulur ve kat kat sertleşir; her 10. katta Tarikat'ın bir "adsız"ı bekler.
// Kat ödülü yalnız ilk geçişte (kat yalnızca bir kez geçilebildiği için ayrıca kayıt gerekmez).
import { MOBS, mobUnit } from './zones.js';
import { GAME } from './content.js';
import { pickFrom } from './rng.js';

export const KULE = {
  unlock: 65,          // açılış seviyesi (bölgelerin bittiği yer)
  energy: 8,           // kat başına enerji
  bossEvery: 10,       // her 10 katta bir adsız
  hp0: 0.6, atk0: 0.7, // 1. katın çarpanı (Sisli Çukur'un son stage'lerinden biraz hafif; Sv.65 test botlarıyla ayarlandı)
  hpStep: 0.04,        // kat başına yaratık canı artışı
  atkStep: 0.025,      // kat başına yaratık saldırısı artışı
  bossHp: 0.85, bossAtk: 0.9, // adsızın aile bossu (Adsız, Tarikat Lideri) üstündeki payı; kat çarpanı ayrıca uygulanır
  akce: [2400, 180],   // kat ödülü: taban + kat × artış
  stone: [2, 10],      // her kat taban taş, +1 her bu kadar katta
  bossYakut: 15,       // adsız katı ilk geçiş yakutu
};
// Adsızların lakapları (her 10 katta sıradaki; liste bitince Roma rakamıyla yeniden başlar)
export const ADSIZ = ['Kül Dilli', 'Sönmüş Ocak', 'Yemin Yiyen', 'Gölge Kâtibi', 'Kırık Mühür', 'Soğuk Kazan', 'Sisli Gözcü', 'Kör Rün', 'Taş Yarığı', 'Son Kül'];
const ROMAN = ['', ' II', ' III', ' IV', ' V', ' VI', ' VII', ' VIII', ' IX', ' X'];
export const adsizName = f => { const k = f / KULE.bossEvery - 1; return `Adsız · ${ADSIZ[k % ADSIZ.length]}${ROMAN[Math.floor(k / ADSIZ.length)] || ` ${Math.floor(k / ADSIZ.length) + 1}`}`; };
export const isBossFloor = f => f % KULE.bossEvery === 0;
export const kuleScale = f => ({ hp: KULE.hp0 * (1 + KULE.hpStep * (f - 1)), atk: KULE.atk0 * (1 + KULE.atkStep * (f - 1)) });
export const kuleRewards = f => [{ t: 'akce', n: KULE.akce[0] + KULE.akce[1] * f }, { t: 'stone', n: KULE.stone[0] + Math.floor(f / KULE.stone[1]) }, ...(isBossFloor(f) ? [{ t: 'yakut', n: KULE.bossYakut }, { t: 'gear' }] : [])];

const CULT = () => Object.entries(MOBS).filter(([, m]) => m.cult && !m.boss && !m.event).map(([id]) => id);
const sc = (u, hp, atk) => ({ ...u, maxHp: Math.round(u.maxHp * hp), atk: Math.round(u.atk * atk), mag: Math.round(u.mag * atk) });
// Katın dalgaları (deterministik: tohum zarı çağıranın)
export function kuleWaves(rand, f) {
  const lvl = GAME.maxLevel, S = kuleScale(f), pool = CULT();
  const mob = (rank = 'n') => sc(mobUnit(pickFrom(rand, pool), lvl, rank), S.hp, S.atk);
  if (!isBossFloor(f)) return [[mob('e'), mob(), mob(), mob()], [mob('e'), mob('e'), mob(), mob()]];
  const boss = { ...sc(mobUnit('bozdag', lvl), KULE.bossHp * S.hp, KULE.bossAtk * S.atk), name: adsizName(f), cult: true };
  return [[mob('e'), mob(), mob()], [mob('e'), boss, mob('e')]];
}
