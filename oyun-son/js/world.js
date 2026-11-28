// 3D sahne yöneticisi: sahnedeki karakterler, ortam ve sahneye özel güncelleyici.
import { THREE, scene, camera, clock, onUpdate, clearTweens, clearParticles, clearFloaters, gfx, onTier, pauseGovernor, RENDER } from './engine3d.js';
import { Character, buildEnv, WormCharacter } from './models.js';
import { BeastCharacter, decorateMob } from './beasts.js';
import { BEAST_KINDS } from '../shared/bestiary.js';
import { createSkinned } from './skinned.js';
import { MonumentCharacter } from './anit-model.js';
import { Birim2D } from './savas-birim2d.js'; // 23 Kas: savaşta boyalı 2B birim (unit.b2d verilirse) // Anıt Savaşı'nın Sınır Anıtı
import { todEnv, todKey, afterEnv } from './daylight.js';
import { blobGeo, blobMaterial } from './scenery.js';
import { clearFx } from './fx.js';

export const world = { actors: [], token: 0, env: null };
let stopUpdater = null, envArgs = null;

export function setUpdater(fn) { stopUpdater?.(); stopUpdater = fn ? onUpdate(fn) : null; }
export function clearScene() {
  RENDER.off = false; delete document.documentElement.dataset.hub2d; // her sahne kurulumu 3B çizimi yeniden açar (2B başkent, kurduktan sonra kapatır)
  world.token++;
  clearTweens(); clearParticles(); clearFloaters(); clearFx();
  world.actors.forEach(drop);
  world.actors = [];
  setUpdater(null);
  clock.scale = 1;
  pauseGovernor(1500); // sahne kurulurken derlenen gölgelendiriciler kare süresi ölçümünü yanıltmasın
}
// Ortamı yalnızca değiştiyse yeniden kur. mood: taraf havası ('ocak' | 'sancak'); yalnızca ana üs ve açılış sahnesi verir
// Günün evresi ya da hava değiştiyse de yeniden kurulur (daylight.js: palet, ışıklar, yağmur)
export function ensureEnv(kind, mood = '') { const key = `${kind}:${mood}:${todKey()}:${document.documentElement.dataset.place || ''}`; /* yer: Yemin Pazarı'nın arka evleri iki ırkın tarzındadır (models.js) */ envArgs = [kind, mood]; if (world.env !== key) { afterEnv(buildEnv(kind, mood, todEnv)); world.env = key; pauseGovernor(1500); } }
// Grafik kademesi değişince ortam yeni bütçeyle (doku boyutu, çimen, meşale ışığı, süsler) yeniden kurulur
onTier(() => { blobM.opacity = gfx.T.blob; if (envArgs) { world.env = null; ensureEnv(...envArgs); } });
const drop = a => { a.char.dispose(); a.hud?.remove(); for (const o of [a.hitbox, a.ring]) { o.geometry.dispose(); o.material.dispose(); } };
export function removeActor(a) { drop(a); world.actors = world.actors.filter(x => x !== a); }
// Birimin altındaki yumuşak zemin lekesi: Düşük kademede gölgenin yerini tutar, öbür kademelerde birimi yere oturtur
const blobM = blobMaterial(gfx.T.blob);
export function spawn(unit, x, z, faceAngle) {
  // models.json'da iskeletli model varsa onu, yoksa prosedürel modeli kullan
  const K = unit.look?.kind; // insansı olmayan gövdeler: Dev Solucan ve canavar ansiklopedisi (beasts.js); insansılara ekler (kanat, kuyruk…)
  const char = unit.b2d ? new Birim2D(unit.b2d, unit.look, unit.side === 'A') : K === 'monument' ? new MonumentCharacter(unit.look) : K === 'worm' ? new WormCharacter(unit.look) : BEAST_KINDS.includes(K) ? new BeastCharacter(unit.look) : createSkinned(unit) || decorateMob(new Character(unit.look, unit.model), unit.look); // Dev Solucan: insansı olmayan model
  char.wt = unit.wt; // silah sınıfı (efekt tablosu, modelin silahı bilinmiyorsa buna bakar)
  char.pos.set(x, 0.1, z);
  char.root.rotation.y = faceAngle;
  scene.add(char.root);
  const hitbox = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 2.4, 8), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
  hitbox.position.y = 1.2;
  char.root.add(hitbox);
  // MMO tarzı seçim halkası (sıradaki birim: altın, hedeflenebilir: kırmızı)
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.62, 0.78, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffd36a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  ring.position.y = 0.04;
  char.root.add(ring);
  const blob = new THREE.Mesh(blobGeo(), blobM);
  blob.scale.set(1.9, 1, 1.5); blob.position.y = 0.025; blob.renderOrder = 1; blob.userData.shared = true;
  char.root.add(blob);
  const a = { char, unit, hitbox, ring, blob };
  hitbox.userData.actor = a;
  world.actors.push(a);
  return a;
}
onUpdate((dt, t) => { for (let i = 0; i < world.actors.length; i++) { const a = world.actors[i]; a.char.update(dt, t); a.blob.visible = !a.char.dead && !a.char.kendiGolge; } }); // P31-G3: boyalı 2B birim kendi temas gölgesini çizer
