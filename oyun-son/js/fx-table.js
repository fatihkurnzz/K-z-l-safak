// Savaş ve örs efektlerinin tablosu: hangi olay, silah, element ve durum hangi görsel efektle oynatılır.
// Bu modül saftır (three.js ya da sayfa gerektirmez); efektleri çizen taraf fx.js, olayları oynatan taraf combat.js'tir.
// Tablonun eksiksiz olduğu testle doğrulanır (server/test/isik.test.js): motorun ürettiği her olay türü, içerikteki her
// silah modeli, her silah sınıfı, her element, her durum etkisi ve her yetenek animasyonu burada karşılık bulmalıdır.
// Yalnızca görünümdür: hasarı, isabeti ve durumu sunucudaki motor belirler; burası onları renklendirir.

// ---------- Elementler ----------
// color / core: dış ve iç renk · cast: büyücünün elindeki hazırlık · proj: mermi · impact: çarpma · linger: çarpmadan sonra kalan iz
// light: efekt ışığının rengi (0 = ışık yok)
export const ELEMENT_FX = {
  phys:   { name: 'Çelik',    color: 0xffe2b8, core: 0xffffff, cast: 'none',   proj: 'none',     impact: 'spark',   linger: 'none',   light: 0 },
  arcane: { name: 'Efsun',    color: 0xb48aff, core: 0xf2e8ff, cast: 'orb',    proj: 'orb',      impact: 'burst',   linger: 'none',   light: 0x9a6aff },
  fire:   { name: 'Ateş',     color: 0xff6a1a, core: 0xffe08a, cast: 'flare',  proj: 'fireball', impact: 'blast',   linger: 'embers', light: 0xff7a2a },
  ice:    { name: 'Buz',      color: 0x6fd0ff, core: 0xeafaff, cast: 'frost',  proj: 'shard',    impact: 'shatter', linger: 'frost',  light: 0x7fd8ff },
  bolt:   { name: 'Yıldırım', color: 0xffe45a, core: 0xffffff, cast: 'charge', proj: 'zap',      impact: 'arc',     linger: 'static', light: 0xfff2a0 },
};
// Yeteneğin elementi: hasar satırındaki element; yoksa büyü gücüyle vuran yetenek "efsun", silahla vuran "çelik" sayılır
export function skillElement(S) {
  const el = S?.fx?.find?.(f => f.k === 'dmg' && f.el)?.el;
  if (el && Object.hasOwn(ELEMENT_FX, el)) return el;
  return S?.sc === 'mag' && S.fx?.some?.(f => f.k === 'dmg') ? 'arcane' : 'phys';
}

// ---------- Silahlar (3B model türü) ----------
// arc: savurma izi · sweep: yayın açısı (radyan) · width: izin kalınlığı · reach: yarıçap · tilt: düzlemin eğimi (0 yatay, 1.57 dik)
// spark: çarpma kıvılcımı türü · sparks: kıvılcım sayısı (yüksek kademede) · weight: darbenin ağırlığı (sarsıntı ve toz)
// twin: iki kısa iz · ring: çarpmada zemin halkası · dust: toz kalkar · proj: mermi türü (yay)
export const WEAPON_FX = {
  sword:  { arc: 'slash',  sweep: 2.4, width: 0.55, reach: 1.35, tilt: 0.35, spark: 'slash',  sparks: 10, weight: 1.0 },
  dagger: { arc: 'stab',   sweep: 1.2, width: 0.26, reach: 0.95, tilt: 0.95, spark: 'pierce', sparks: 6,  weight: 0.6, twin: true },
  axe:    { arc: 'cleave', sweep: 2.9, width: 0.85, reach: 1.5,  tilt: 0.18, spark: 'chunk',  sparks: 14, weight: 1.5 },
  mace:   { arc: 'crush',  sweep: 1.7, width: 0.7,  reach: 1.15, tilt: 1.25, spark: 'crush',  sparks: 10, weight: 1.3, ring: true },
  club:   { arc: 'crush',  sweep: 1.9, width: 0.9,  reach: 1.3,  tilt: 1.25, spark: 'crush',  sparks: 12, weight: 1.7, ring: true, dust: true },
  staff:  { arc: 'arcane', sweep: 2.0, width: 0.4,  reach: 1.25, tilt: 0.6,  spark: 'arcane', sparks: 8,  weight: 0.7 },
  bow:    { arc: 'none',   sweep: 0,   width: 0,    reach: 0,    tilt: 0,    spark: 'pierce', sparks: 6,  weight: 0.6, proj: 'arrow' },
  scythe: { arc: 'reap',   sweep: 3.3, width: 0.7,  reach: 1.9,  tilt: 0.22, spark: 'slash',  sparks: 14, weight: 1.6 },
};
// Silah sınıfı (motorun wt alanı) → efekt satırı; modeli bilinmeyen birimde (ör. kendi silahını taşıyan iskeletli model) kullanılır
export const CLASS_WEAPON = { sword: 'sword', axe: 'axe', dagger: 'dagger', bow: 'bow', mace: 'mace', staff: 'staff' };
const own = (T, k) => (typeof k === 'string' && Object.hasOwn(T, k) ? T[k] : undefined);
export const weaponFx = (kind, wt) => own(WEAPON_FX, kind) || own(WEAPON_FX, own(CLASS_WEAPON, wt)) || WEAPON_FX.sword;
// Kıvılcım türleri: renk, hız, yerçekimi, yayılma (fx.js bunlarla parçacık saçar)
export const SPARK_FX = {
  slash:  { color: 0xfff0c8, speed: 4.6, gravity: -7,  spread: 0.9, life: 0.34, size: 0.05 },
  pierce: { color: 0xeaf4ff, speed: 6.0, gravity: -3,  spread: 0.35, life: 0.26, size: 0.04 },
  chunk:  { color: 0xffc070, speed: 4.0, gravity: -10, spread: 1.0, life: 0.44, size: 0.07 },
  crush:  { color: 0xffd9a0, speed: 3.4, gravity: -9,  spread: 1.1, life: 0.42, size: 0.08 },
  arcane: { color: 0xc8a8ff, speed: 2.8, gravity: 1.5, spread: 1.0, life: 0.5,  size: 0.06 },
};

// ---------- Durum etkileri ----------
// tone: buff (iyi) · debuff (kötü) · dot (tur başına hasar) · cc (sırasını kaybeder) · guard (kalkan) · hot (tur başına şifa)
// mark: uygulanınca oynayan işaret · hold: durum sürerken birimin üstünde kalan iz ('' = yok)
//  up/down: yükselen/alçalan oklar · dome: kalkan kubbesi · ring: zemin halkası · reticle: nişan çemberi · wisp: koyu duman
//  flame: alev · drip: kabarcık · orbit: başın çevresinde dönen noktalar · crystal: buz kristalleri · mote: yükselen yeşil zerreler
//  glint: keskin parıltı · gust: hız çizgileri
export const STATUS_FX = {
  atkUp:   { tone: 'buff',   color: 0xff9a3a, mark: 'up',      hold: '' },
  defUp:   { tone: 'buff',   color: 0x9ab8e0, mark: 'ring',    hold: '' },
  spdUp:   { tone: 'buff',   color: 0x8fffd0, mark: 'gust',    hold: '' },
  critUp:  { tone: 'buff',   color: 0xffe066, mark: 'glint',   hold: '' },
  regen:   { tone: 'hot',    color: 0x7dff8a, mark: 'mote',    hold: 'mote' },
  shield:  { tone: 'guard',  color: 0x7fc8ff, mark: 'dome',    hold: 'dome' },
  taunt:   { tone: 'buff',   color: 0xff5a3a, mark: 'ring',    hold: '' },
  provoked: { tone: 'debuff', color: 0xff5a3a, mark: 'ring',    hold: '' },
  atkDown: { tone: 'debuff', color: 0x9a8aa8, mark: 'down',    hold: '' },
  defDown: { tone: 'debuff', color: 0xc87a4a, mark: 'down',    hold: '' },
  spdDown: { tone: 'debuff', color: 0x7a9ab8, mark: 'down',    hold: '' },
  mark:    { tone: 'debuff', color: 0xff3a3a, mark: 'reticle', hold: '' },
  rot:     { tone: 'debuff', color: 0x7a8a3a, mark: 'wisp',    hold: '' },
  burn:    { tone: 'dot',    color: 0xff6a1a, mark: 'flame',   hold: 'flame' },
  poison:  { tone: 'dot',    color: 0x8aff3a, mark: 'drip',    hold: 'drip' },
  stun:    { tone: 'cc',     color: 0xffe066, mark: 'orbit',   hold: 'orbit' },
  freeze:  { tone: 'cc',     color: 0x8fdcff, mark: 'crystal', hold: 'crystal' },
  // uzmanlık yollarının etkileri (shared/paths.js)
  bleed:   { tone: 'dot',    color: 0xd0202a, mark: 'drip',    hold: 'drip' },
  guard:   { tone: 'guard',  color: 0xffc85a, mark: 'ring',    hold: '' },
  ward:    { tone: 'guard',  color: 0xbfe6ff, mark: 'dome',    hold: '' },
};
export const MARKS = ['up', 'down', 'dome', 'ring', 'reticle', 'wisp', 'flame', 'drip', 'orbit', 'crystal', 'mote', 'glint', 'gust'];

// ---------- Yetenek animasyonları ----------
// travel: dash (hedefe koşar) · shot (mermi atar) · sky (gökten düşer) · self (yerinde)
// cast: hazırlıkta element parıltısı · area: alan efekti (ring: dönen halka, blast: patlama, quake: yer sarsıntısı)
export const ANIM_FX = {
  melee:    { travel: 'dash', cast: false, area: '',      proj: '' },
  whirl:    { travel: 'dash', cast: false, area: 'ring',  proj: '' },
  arrow:    { travel: 'shot', cast: false, area: '',      proj: 'arrow' },
  arrowBig: { travel: 'shot', cast: true,  area: '',      proj: 'arrow' },
  bolt:     { travel: 'shot', cast: true,  area: '',      proj: 'element' },
  meteor:   { travel: 'sky',  cast: true,  area: 'blast', proj: 'element' },
  stomp:    { travel: 'self', cast: false, area: 'quake', proj: '' },
  heal:     { travel: 'self', cast: true,  area: '',      proj: '' },
  buff:     { travel: 'self', cast: true,  area: '',      proj: '' },
};

// ---------- Olaylar ----------
// Motorun olayları (shared/battle.js) ve onlardan türeyen anlar → fx.js'teki efektin adı.
// skill olayının fx satırları: dmg, heal, st, resist, tm, cleanse, revive, phase · tur olayı: tick.<durum>, skip, enrage
// dalga olayı: wave, restore, boss (dalgada boss ya da kaptan varsa) · bitiş: victory / defeat · türeyenler: crit, kill, absorb, weak
export const EVENT_FX = {
  dmg: 'hit', crit: 'critHit', kill: 'dissolve', absorb: 'shieldHit', weak: 'weakHit',
  heal: 'heal', st: 'status', resist: 'resist', tm: 'tempo', cleanse: 'cleanse', revive: 'revive', phase: 'phase',
  'tick.burn': 'burnTick', 'tick.poison': 'poisonTick', 'tick.regen': 'regenTick', skip: 'skipTurn', enrage: 'enrage',
  wave: 'waveIn', restore: 'revive', boss: 'bossEntrance', turn: 'turnMark', skill: 'cast',
  victory: 'victory', defeat: 'defeat',
  // uzmanlık yollarının olayları (battle.js sürüm 2): patlatma, himaye payı, sökme, sakınma, kanama tiki
  det: 'detonate', guard: 'guardHit', strip: 'strip', ward: 'wardOff', 'tick.bleed': 'bleedTick',
};
// fx.js bu adların her birini uygulamak zorundadır (açılışta denetler; eksik varsa konsola yazar)
export const FX_NAMES = [...new Set(Object.values(EVENT_FX))];
// Motor olayının türünden tablo anahtarı: skill fx satırı ya da tur içi tik
export const fxOfTick = s => (typeof s === 'string' && Object.hasOwn(EVENT_FX, 'tick.' + s) ? EVENT_FX['tick.' + s] : null);

// ---------- Kritik vuruş vurgusu ----------
// stop: kısa duraklama (gerçek saniye; oyun hızından bağımsız) · nudge: kameranın hedefe doğru küçük itişi (birim)
// shake: en çok sarsıntı. Değerler bilerek küçüktür: mide bulandırmamalı, 3x hızda da okunmalıdır.
export const CRIT_FX = { stop: 0.08, nudge: 0.3, shake: 0.32, special: { stop: 0.11, nudge: 0.42, shake: 0.45 } };

// ---------- Artılı silah parıltısı ----------
// Silah +7'den başlayarak parlar; parıltı artıyla büyür ve eşyanın nadirlik rengini alır (Standart: çelik beyazı,
// Nadir: mavi, Eşsiz: altın). Eşsiz silah artısı ne olursa olsun kendine özgü bir ışık süzmesi (shimmer) taşır.
//  emissive: silah gövdesinin ışıması · aura: çevresindeki halenin opaklığı · flame: alev kılıfının boyu (0 = yok)
//  sparks: saniyedeki kıvılcım · light: nokta ışığı (yalnızca yüksek kademe)
export const GLOW_MIN = 7;
export const GLOW_COLORS = [0xcfe0ff, 0x4aa3ff, 0xffb52e]; // nadirlik sırasıyla: Standart, Nadir, Eşsiz
// Kademeler: +7 hafif kor (ısınmış metal) · +8 kıvılcım · +9 alev · +10 ırk renginde aura (uzaktan tanınır)
export const GLOW_LEVELS = {
  7:  { emissive: 0.75, aura: 0.1,  flame: 0,   sparks: 0,  light: 0, ember: 0.55 },
  8:  { emissive: 1.1,  aura: 0.16, flame: 0,   sparks: 7,  light: 0, ember: 0.3 },
  9:  { emissive: 1.6,  aura: 0.24, flame: 0.8, sparks: 8,  light: 0.6 },
  10: { emissive: 2.3,  aura: 0.42, flame: 1.0, sparks: 12, light: 1.0 },
};
export const RACE_GLOW = { ocak: 0xff3a1e, sancak: 0x3aa6ff };
// Silah efekti (VAHRAN, shared/items.js WEAPON_FX): efektli silahın parıltısı ve ucundaki ışıma efektin rengindedir
import { WEAPON_FX as WFX } from '../shared/items.js';
const EMBER = 0xff7a2a;
const mix = (a, b, t) => { const c = k => Math.round(((a >> k) & 255) * (1 - t) + ((b >> k) & 255) * t); return (c(16) << 16) | (c(8) << 8) | c(0); };
// { color, level, shimmer, plus } ya da null (parlamaz). g: nadirlik (0-2), plus: artı (0-10), faction: +10'da aura rengi
export function weaponGlow(plus, g, faction, wfx = null) {
  const p = Math.max(0, Math.min(10, Math.floor(Number(plus) || 0))), gi = Math.max(0, Math.min(2, Math.floor(Number(g) || 0)));
  const shimmer = gi === 2;
  const E = WFX[wfx] || null;
  if (p < GLOW_MIN && !shimmer && !E) return null;
  const lv = p >= GLOW_MIN ? GLOW_LEVELS[p] : null;
  const color = p >= 10 && RACE_GLOW[faction] ? RACE_GLOW[faction] : lv?.ember ? mix(GLOW_COLORS[gi], EMBER, lv.ember) : GLOW_COLORS[gi];
  return { color: E ? E.color : color, level: lv, shimmer, plus: p, fx: E ? wfx : null };
}

// ---------- Zırh parıltısı ----------
// Silahın parıltısının aynı basamakları, daha ince: karakteri boğmaz. Parıltıyı kuşanılan zırhın artı ortalaması belirler
// (5 zırh parçasının artıları toplanıp 5'e bölünür; boş yuva 0 sayılır, yani tam parıltı için hepsi giyili olmalı),
// rengi giyilen zırhların en yüksek nadirliğinden gelir. Gövdede ışıma: +7 hafif kor · +8 gövdeden kıvılcım ·
// +9 ince alev kenarı · +10 ırk renginde ışıma ve ayak altında halka. Düşük kademede alev kenarı yok, kıvılcım yarı.
//  emissive: gövde dokusunun ışıması · sparks: saniyedeki kıvılcım · edge: alev kenarının gücü (0 = yok) · aura: +10 ayak halkası (ırk rengi)
export const ARMOR_GLOW_LEVELS = {
  7:  { emissive: 0.07, sparks: 0, edge: 0,    aura: 0, ember: 0.55 },
  8:  { emissive: 0.1,  sparks: 2, edge: 0,    aura: 0, ember: 0.3 },
  9:  { emissive: 0.13, sparks: 3, edge: 0.3,  aura: 0 },
  10: { emissive: 0.16, sparks: 4, edge: 0.4,  aura: 1 },
};
// ap: zırh artısı ortalaması (0-10), ag: en yüksek nadirlik (0-2), faction: +10'da aura rengi → { color, level, plus } ya da null
export function armorGlow(ap, ag, faction) {
  const p = Math.max(0, Math.min(10, Math.floor(Number(ap) || 0))), gi = Math.max(0, Math.min(2, Math.floor(Number(ag) || 0)));
  if (p < GLOW_MIN) return null;
  const lv = ARMOR_GLOW_LEVELS[p];
  const color = p >= 10 && RACE_GLOW[faction] ? RACE_GLOW[faction] : lv.ember ? mix(GLOW_COLORS[gi], EMBER, lv.ember) : GLOW_COLORS[gi];
  return { color, level: lv, plus: p };
}

// ---------- Örs ----------
// İki saniyelik gerilim boyunca çekiç vuruşları (hits) kıvılcım saçar; sonuç kendi patlamasıyla gelir.
//  burst: patlamanın biçimi · color / core: renkler · n: parçacık sayısı · dir: parçacıkların yönü (1 yukarı, -1 aşağı, 0 her yöne)
//  ring: genişleyen halka · cracks: çatlak çizgisi sayısı · ms: patlamanın süresi
// Renkler Örs panelinin açık (parşömen) zemininde okunacak kadar doygundur: color dış çizgi, core iç parlak çizgi.
export const ANVIL_FX = {
  hits: 5, hitMs: 400, spark: { color: '#d9541a', core: '#ffd27a', n: 14 },
  out: {
    ok:    { burst: 'star',   color: '#e39a12', core: '#fff3b8', n: 64, dir: 1,  ring: true,  cracks: 0, ms: 1100 },
    fail:  { burst: 'puff',   color: '#6f665b', core: '#a89f92', n: 22, dir: -1, ring: false, cracks: 0, ms: 700 },
    drop:  { burst: 'fall',   color: '#d9641a', core: '#ffc27a', n: 36, dir: -1, ring: false, cracks: 0, ms: 900 },
    break: { burst: 'shards', color: '#c21e12', core: '#ff9a8a', n: 48, dir: 0,  ring: true,  cracks: 7, ms: 1200 },
    safe:  { burst: 'ward',   color: '#12988c', core: '#8ff0e4', n: 30, dir: 1,  ring: true,  cracks: 0, ms: 1000 },
  },
};
