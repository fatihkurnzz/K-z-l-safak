// 3B Savaş Faz 1 · ayar ve savaş kararı (Opus, 27.11)
// Bu modül hangi savaşın gerçek 3B birimlerle (iskeletli model + animasyon) çizileceğine karar verir.
// Yalnız ÇİZİM katmanıdır: savaşın kuralı, sırası, hasarı ve sonucu (shared/, combat.js) bu karardan etkilenmez.
//
// Açma / kapama (öncelik sırasıyla):
//   adres  ?b3d=1  (aç)  ·  ?b3d=0  (kapat)
//   kayıt  localStorage dd_b3d = '1' | '0'
//   varsayılan: AÇIK (Faz 1b, 28.11 kullanıcı: yayınla). Düşük/En Düşük grafikte ve kayıtsız birimde yine 2B.
// Açıkken bile savaş 2B açılır, eğer:
//   - grafik kademesi 'min' ya da 'low' (Düşük / En Düşük),
//   - WebGL bağlamı yok ya da kaybolmuş,
//   - savaştaki birimlerden BİRİNİN bile 3B kaydı yoksa (karışık 2B/3B görünüm yok),
//   - gereken model / animasyon dosyaları henüz inmemiş ya da inemedi.
// Kararın nedeni window.DD_B3D.neden içinde okunur (test ve hata ayıklama).
import { gfx, renderer } from '../engine3d.js';
import { manifestYukle, manifest, kayitAnahtari, modelHazirMi, modelHazirla } from './varlik3d.js';

const qs = (() => { try { return new URLSearchParams(location.search); } catch { return new URLSearchParams(); } })();
function bayrak() {
  const q = qs.get('b3d');
  if (q === '1' || q === '0') return q === '1';
  try { const s = localStorage.getItem('dd_b3d'); if (s === '1' || s === '0') return s === '1'; } catch { }
  return true;
}

/** Ortak durum. aktif: ŞU ANKİ savaş 3B mi (her savaşın başında yeniden karar verilir, sahne temizlenince false). */
export const B3D = {
  acik: bayrak(),          // oyuncu / adres 3B'yi istedi mi
  aktif: false,            // bu savaş 3B mi
  neden: 'karar verilmedi',
  kademeler: ['mid', 'high'],
  sayac: { savas3B: 0, savas2B: 0, dusme: 0 }, // test için
  son: null,               // son kararın ayrıntısı { birimler: [{ad, anahtar, model}], ... }
};
if (typeof window !== 'undefined') window.DD_B3D = B3D;

/** 3B kalıcı olarak aç/kapat (Ayarlar düğmesi bağlanırsa bunu çağırır). */
export function b3dAyarla(acik) { B3D.acik = !!acik; try { localStorage.setItem('dd_b3d', acik ? '1' : '0'); } catch { } if (acik) isit(); }

/** Cihaz ve kademe 3B savaşa uygun mu (birimlere bakmadan). */
export function cihazUygun() {
  if (!B3D.acik) return 'kapalı (dd_b3d)';
  if (!B3D.kademeler.includes(gfx.tier)) return `grafik kademesi ${gfx.tier}`;
  try { const gl = renderer.getContext(); if (!gl || gl.isContextLost()) return 'WebGL bağlamı yok'; } catch { return 'WebGL hatası'; }
  return '';
}

/** Savaş başlarken (savas-birim2d.js onYukle → combat.js runBattle) bir kez çağrılır. units: parti + bütün dalgalar. */
export function savasKarari(units) {
  B3D.aktif = false; B3D.son = null;
  const red = n => { B3D.neden = n; B3D.sayac.savas2B++; return false; };
  const c = cihazUygun(); if (c) return red(c);
  if (!manifest()) { isit(); return red('manifest henüz yüklenmedi'); }
  const liste = [];
  for (const u of units || []) {
    if (!u) continue;
    if (u.mon) return red('Anıt Savaşı (3B kaydı yok)');
    const k = kayitAnahtari(u);
    if (!k) return red(`3B kaydı yok: ${u.cls ? `${u.cls}/${u.faction || '?'}` : u.mob}`);
    if (!modelHazirMi(k.model)) { modelHazirla(k.model); return red(`model inmedi: ${k.model}`); }
    liste.push({ ad: u.name, anahtar: k.anahtar, model: k.model });
  }
  if (!liste.length) return red('birim yok');
  B3D.aktif = true; B3D.neden = '3B'; B3D.sayac.savas3B++; B3D.son = { birimler: liste };
  return true;
}
/** Sahne temizlenince (world.js clearScene) çağrılır. */
export function savasBitti() { B3D.aktif = false; }

/** Birimin modelini önden indirmeye başla (savaş öncesi perde sırasında). Hızlı ve yan etkisiz; 3B kapalıysa hiçbir şey yapmaz. */
export function isitBirim(u) {
  if (!B3D.acik) return;
  manifestYukle().then(m => { if (!m) return; const k = kayitAnahtari(u); if (k) modelHazirla(k.model); });
}
/** Faz 1 modellerinin hepsini boşta indir (3B açıksa oyun açılışından ~8 sn sonra). */
export function isit() {
  if (!B3D.acik) return;
  manifestYukle().then(m => { if (!m) return; for (const ad of m.onYukle || Object.keys(m.modeller || {})) modelHazirla(ad); });
}
if (typeof window !== 'undefined' && B3D.acik) setTimeout(() => (window.requestIdleCallback || (f => f()))(isit), 8000);
