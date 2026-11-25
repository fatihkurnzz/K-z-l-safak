// Han: içecek buff'ları ve Sıcak Çorba (P28; şartname TALIMAT.md §4.1–4.2).
// Kayıt: p.han = { buff: { id, exp: bitiş (ms), left: kalan savaş } | null, soupDay: gün anahtarı, soups: o günkü çorba sayısı }.
// Buff yalnız PvE savaşlarında işler (Oto İksir kuralıyla tutarlı): stat etkisi savaş kurulurken (modes.js startBattle →
// tavernUnits), EXP/Akçe etkisi kazançta (modes.js → p28Bonus). Her tamamlanan PvE savaşı `left`i 1 azaltır (p28AfterBattle);
// left ≤ 0 ya da süre dolunca buff temizlenir. Çorba buff yuvasını ezmez.
import { fail } from './util.js';
import { dayKey, ENERGY } from './content.js';
import { zaferBuffActive, ZAFER } from './zafer.js';

/** İçecek tablosu (id → tanım). effect yüzdeleri yüzde biriminde. Çorba: energy, perDay. */
export const DRINKS = {
  saldiri: { name: 'Kanlı Bal Şarabı', icon: 'img/p28/han_icecek_saldiri.webp', cost: 600, effect: { atkPct: 8 }, minutes: 45, battles: 5, desc: '+%8 Saldırı Gücü' },
  savunma: { name: 'Demir Kalkan Birası', icon: 'img/p28/han_icecek_savunma.webp', cost: 600, effect: { defPct: 10, hpPct: 10 }, minutes: 45, battles: 5, desc: '+%10 Savunma ve +%10 azami Can' },
  exp: { name: 'Baharatlı Dem', icon: 'img/p28/han_icecek_exp.webp', cost: 750, effect: { xpPct: 15, akcePct: 15 }, minutes: 45, battles: 5, desc: '+%15 EXP ve +%15 Akçe kazancı' },
  corba: { name: 'Hancı’nın Sıcak Çorbası', icon: 'img/p28/han_icecek_enerji.webp', cost: 500, energy: 35, perDay: 2, desc: 'Anında +35 Enerji (azami enerjiyi aşmaz)' },
};
const isBuff = id => typeof id === 'string' && Object.hasOwn(DRINKS, id) && !!DRINKS[id].effect;

/** Han kaydını kurar/onarır, süresi ya da hakkı biten buff'ı siler, gün dönmüşse çorba sayacını sıfırlar. */
export function hanOf(p, now) {
  const H = p.han && typeof p.han === 'object' ? p.han : (p.han = { buff: null, soupDay: 0, soups: 0 });
  if (H.buff && (!isBuff(H.buff.id) || !(H.buff.left > 0) || (now !== undefined && now >= H.buff.exp))) H.buff = null;
  if (now !== undefined && H.soupDay !== dayKey(now)) { H.soupDay = dayKey(now); H.soups = 0; }
  return H;
}
/** Geçerli buff ({ id, exp, left, ...DRINKS[id] }) ya da null. Kaydı değiştirmez. */
export function tavernBuff(p, now) {
  const b = p?.han?.buff;
  return b && isBuff(b.id) && b.left > 0 && now < b.exp ? { ...DRINKS[b.id], ...b } : null;
}
/** PvE kazanç çarpanları (Han Baharatlı Dem + Zafer buff'ı; toplanır): { xpPct, akcePct }. */
export function p28Bonus(p, now) {
  const e = tavernBuff(p, now)?.effect || {}, z = zaferBuffActive(p, now);
  return { xpPct: (e.xpPct || 0) + (z ? ZAFER.win.xpPct : 0), akcePct: (e.akcePct || 0) + (z ? ZAFER.win.akcePct : 0) };
}
/** PvE savaşı kurulurken kahraman birimlerine Han buff'ının stat etkisi (saldırı ve büyü, savunma, azami can). */
export function tavernUnits(p, now, party) {
  const e = tavernBuff(p, now)?.effect;
  if (!e || !(e.atkPct || e.defPct || e.hpPct)) return party;
  const m = k => 1 + (e[k] || 0) / 100;
  return party.map(u => (u.cls && !u.ai ? { ...u, atk: Math.round(u.atk * m('atkPct')), mag: Math.round((u.mag || 0) * m('atkPct')), def: Math.round(u.def * m('defPct')), maxHp: Math.round(u.maxHp * m('hpPct')) } : u));
}
/** Tamamlanan PvE savaşı sonrası: buff'ın kalan savaş hakkı 1 azalır; biterse temizlenir. */
export function p28AfterBattle(p, now) {
  const H = hanOf(p, now);
  if (H.buff) { H.buff.left--; if (H.buff.left <= 0) H.buff = null; }
}

/** Han eylemleri (WORLD tablosuna eklenir). */
export const HAN_HANDLERS = {
  // İç: buff içeceği tek yuvayı doldurur; başka buff etkinse confirm:true ister (needConfirm). Çorba: +energy, azamiyi aşmaz, günde perDay.
  'han.drink'(p, { id, confirm } = {}, env) {
    if (typeof id !== 'string' || !Object.hasOwn(DRINKS, id)) fail('bad-drink', 'Böyle bir içecek yok.');
    const D = DRINKS[id], H = hanOf(p, env.now);
    if (id === 'corba') {
      if (H.soups >= D.perDay) fail('daily-limit', `Bugünkü çorba hakkın bitti (${D.perDay}/${D.perDay}).`);
      if (p.energy >= ENERGY.max) fail('energy-full', 'Enerjin zaten dolu.');
      if (p.akce < D.cost) fail('no-akce', 'Akçen yetmiyor.');
      p.akce -= D.cost; H.soups++;
      const before = p.energy;
      p.energy = Math.min(ENERGY.max, p.energy + D.energy);
      if (p.energy >= ENERGY.max) p.energyAt = env.now;
      return { id, energy: p.energy - before, soups: H.soups };
    }
    if (p.battle) fail('in-battle', 'Savaş sürerken içilmez.');
    if (H.buff && confirm !== true) fail('needConfirm', `${DRINKS[H.buff.id].name} etkisi silinip ${D.name} etkisi başlayacak. Onaylıyor musun?`);
    if (p.akce < D.cost) fail('no-akce', 'Akçen yetmiyor.');
    p.akce -= D.cost;
    H.buff = { id, exp: env.now + D.minutes * 60000, left: D.battles };
    return { id, buff: { ...H.buff } };
  },
};
