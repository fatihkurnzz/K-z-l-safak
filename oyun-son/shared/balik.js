// Balık tutma (Yemin Pazarı göleti). Sunucu-otoriter: atışın sonucunu (tür, nadirlik, ağırlık, bekleme süresi) sunucu belirler
// ve kayda gizli bekleyen atış olarak yazar; istemci yalnızca "çektim / kaçırdım" (zamanlama başarısı) bildirir.
// Kayıt: p.fish = { c: {tür: çantadaki sayı}, n: {tür: ömür boyu yakalanan}, w: {tür: en ağır (gram)}, rod: olta kademesi 0..3,
//   top: {id, w} en ağır balık, at: bekleyen atış {f, r, w, wait, t} } · günlük atış sayısı p.daily.fish
// Sayaç: başarılı yakalama bump(p, 'fish') (günlük / haftalık / başarım sayaçları; ana görev düğümü yok).
import { fail, grant, bump } from './util.js';
import { premTier } from './state.js';
import { weighted, pickFrom } from './rng.js';

// Nadirlik: [ad, şans ağırlığı, yeşil bölge (çubuğun payı), işaretçi hızı (tur/sn), taban fiyat (akçe)]
export const FISH_RAR = [
  { name: 'Sıradan', w: 56, zone: 0.30, speed: 0.55, price: 6, color: '#c9c3b4' },
  { name: 'Seçkin', w: 26, zone: 0.24, speed: 0.7, price: 18, color: '#6fd17a' },
  { name: 'Nadir', w: 12, zone: 0.18, speed: 0.85, price: 55, color: '#5aa8ff' },
  { name: 'Destansı', w: 5, zone: 0.13, speed: 1.0, price: 160, color: '#c47bff' },
  { name: 'Efsane', w: 1, zone: 0.09, speed: 1.2, price: 600, color: '#ffb340' },
];
// Türler (özgün adlar): r nadirlik, kg ağırlık aralığı, c gövde rengi (çizim)
export const FISH = {
  kizilgoz: { name: 'Kızılgöz', r: 0, kg: [0.1, 0.6], c: '#9aa3a8' },
  sazan: { name: 'Bulanık Sazan', r: 0, kg: [0.5, 3], c: '#8a7a4a' },
  turna: { name: 'Dişli Turna', r: 1, kg: [1, 6], c: '#5f7a4a' },
  yayin: { name: 'Bıyıklı Yayın', r: 1, kg: [2, 12], c: '#4a4e52' },
  alabalik: { name: 'Benekli Alabalık', r: 2, kg: [0.5, 4], c: '#7a9a8a' },
  bakir: { name: 'Bakır Pullu', r: 2, kg: [1, 5], c: '#b0703a' },
  koryuzgec: { name: 'Kor Yüzgeç', r: 3, kg: [2, 8], c: '#d0482a' },
  aysili: { name: 'Ay Sırtlı', r: 3, kg: [1, 6], c: '#b8c8e8' },
  demircene: { name: 'Demir Çeneli Dev', r: 4, kg: [15, 40], c: '#3a4048' },
  altinkadim: { name: 'Altın Pullu Kadim', r: 4, kg: [5, 20], c: '#e0b040' },
};
// Olta: kademe 0 başlangıç; 3 yükseltme akçeyle. wait: bekleme süresi aralığı (sn), zone: yeşil bölge çarpanı
export const RODS = [
  { name: 'Söğüt Oltası', cost: 0, wait: [4, 9], zone: 1 },
  { name: 'Kamış Olta', cost: 800, wait: [3.5, 7.5], zone: 1.15 },
  { name: 'Boynuz Olta', cost: 3000, wait: [3, 6], zone: 1.3 },
  { name: 'Demir Makaralı Olta', cost: 9000, wait: [2.5, 4.5], zone: 1.45 },
];
export const FISH_DAILY = 30, FISH_PREM = 10; // günlük atış; Premium üyelikte +10
export const BITE_MS = 1400;                   // şamandıra batınca "Çek!" için süre (istemci); sunucu toleransı aşağıda
const LATE_MS = 45000;                         // atıştan bu kadar sonra gelen çekiş geçersiz (balık kaçmış sayılır)
// Nadir balıktan küçük ihtimalle malzeme: nadirlik → [şans, ganimet]
const BONUS = { 2: [0.08, { t: 'dust', n: 15 }], 3: [0.15, { t: 'stone', g: 0, n: 1 }], 4: [0.35, { t: 'stone', g: 1, n: 1 }] };

export const fishOf = p => p.fish || { c: {}, n: {}, w: {}, rod: 0 };
const ensure = p => { if (!p.fish) p.fish = { c: {}, n: {}, w: {}, rod: 0 }; const f = p.fish; f.c ||= {}; f.n ||= {}; f.w ||= {}; f.rod |= 0; return f; };
export const fishMax = (p, now) => FISH_DAILY + (premTier(p, now) > 0 ? FISH_PREM : 0);
export const fishLeft = (p, now) => Math.max(0, fishMax(p, now) - ((p.daily && p.daily.fish) || 0));
export const fishZone = (r, rod) => Math.min(0.6, FISH_RAR[r].zone * RODS[rod | 0].zone);
// Satış fiyatı: taban × (0,75 … 1,25, ağırlığa göre). Çantadaki balık için ortalama ağırlıkla (orta nokta) hesaplanır.
export const fishPrice = (id, kg) => { const F = FISH[id], [a, b] = F.kg, k = kg == null ? 0.5 : Math.max(0, Math.min(1, (kg - a) / (b - a))); return Math.round(FISH_RAR[F.r].price * (0.75 + 0.5 * k)); };
export const fishBagValue = p => Object.entries(fishOf(p).c).reduce((a, [id, n]) => a + (FISH[id] ? fishPrice(id) * n : 0), 0);
// Tür seçimi (rastgele kaynağı verilir: sunucuda env.rand; denemede tohumlu rng)
export function rollFish(rand) {
  const r = weighted(rand, FISH_RAR.map((x, i) => [i, x.w]));
  const id = pickFrom(rand, Object.keys(FISH).filter(k => FISH[k].r === r)), [a, b] = FISH[id].kg;
  const kg = Math.round((a + (b - a) * Math.pow(rand(), 1.6)) * 100) / 100; // ağır balık daha seyrek
  return { id, r, kg };
}

export const FISH_HANDLERS = {
  // Olta at: atış hakkı düşer, sonuç sunucuda belirlenir. İstemciye bekleme süresi ve yeşil bölge döner (tür gizli).
  'fish.cast'(p, _a, env) {
    if (p.battle) fail('in-battle', 'Savaş sürerken balık tutulamaz.');
    const f = ensure(p), now = env.now;
    if (fishLeft(p, now) <= 0) fail('daily-limit', 'Bugünkü atış hakkın bitti. Yarın göl yine burada.');
    p.daily.fish = (p.daily.fish || 0) + 1;
    const R = RODS[f.rod], fish = rollFish(env.rand), wait = Math.round((R.wait[0] + (R.wait[1] - R.wait[0]) * env.rand()) * 1000);
    f.at = { ...fish, wait, t: now };
    return { wait, zone: fishZone(fish.r, f.rod), speed: FISH_RAR[fish.r].speed, r: fish.r, left: fishLeft(p, now) };
  },
  // Çek: ok = istemcinin zamanlama başarısı. Şamandıra batmadan (bekleme bitmeden) gelen çekiş ya da çok geç gelen çekiş kaçar.
  'fish.reel'(p, { ok }, env) {
    const f = ensure(p), at = f.at;
    if (!at) fail('no-cast', 'Önce oltayı at.');
    delete f.at;
    const dt = env.now - at.t, inTime = dt >= at.wait - 300 && dt <= LATE_MS;
    if (ok !== true || !inTime) return { ok: false, r: at.r };
    f.c[at.id] = (f.c[at.id] || 0) + 1; f.n[at.id] = (f.n[at.id] || 0) + 1;
    const g = Math.round(at.kg * 1000), prev = f.w[at.id] || 0, rec = prev > 0 && g > prev; // ilk yakalanış rekor sayılmaz
    if (g > prev) f.w[at.id] = g;
    if (!f.top || g > f.top.w) f.top = { id: at.id, w: g };
    bump(p, 'fish');
    const loot = [], B = BONUS[at.r];
    if (B && env.rand() < B[0]) grant(p, loot, B[1]);
    return { ok: true, id: at.id, r: at.r, kg: at.kg, rec, loot };
  },
  // Olta yükselt (akçe): bir sonraki kademe
  'fish.rod'(p) {
    const f = ensure(p), next = RODS[f.rod + 1];
    if (!next) fail('max', 'Oltan zaten en iyisi.');
    if (p.akce < next.cost) fail('no-akce', 'Akçen yetmiyor.');
    p.akce -= next.cost; f.rod += 1;
    return { rod: f.rod };
  },
  // Balıkları Tüccar Halvor'a sat: id verilirse o türün hepsi, verilmezse çantadaki bütün balıklar
  'fish.sell'(p, { id } = {}) {
    if (p.battle) fail('in-battle', 'Savaş sürerken alışveriş yapılamaz.');
    const f = ensure(p);
    if (id !== undefined && (typeof id !== 'string' || !Object.hasOwn(FISH, id))) fail('bad-item', 'Böyle bir balık yok.');
    let akce = 0, n = 0;
    for (const k of id ? [id] : Object.keys(f.c)) { if (!Object.hasOwn(FISH, k)) continue; const c = f.c[k] | 0; if (c <= 0) continue; akce += fishPrice(k) * c; n += c; delete f.c[k]; }
    if (!n) fail('no-fish', 'Satacak balığın yok.');
    p.akce += akce;
    return { akce, n };
  },
};
