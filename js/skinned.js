// İskeletli (Mixamo / glTF) karakterler.
// models/models.json içinde tanımlı model dosyası olan kahraman/canavar bu sınıfla çizilir;
// olmayanlar prosedürel Character sınıfına düşer. API iki sınıfta aynıdır.
import { THREE, scene, tween, wait, ease, particle, gfx, selfLitK } from './engine3d.js';
import { FBXLoader } from '../vendor/three/examples/jsm/loaders/FBXLoader.js';
import { GLTFLoader } from '../vendor/three/examples/jsm/loaders/GLTFLoader.js';
import * as SkeletonUtils from '../vendor/three/examples/jsm/utils/SkeletonUtils.js';
const MeshoptDecoder = null;
import { Mats, buildWeapon, buildShield, ClanCape, raceBodyGear, armorGlowSetup, armorGlowTint, armorGlowTick } from './models.js';
import { bakeRigid, patchStd } from './scenery.js';
import { weaponGlow, armorGlow, EVENT_FX } from './fx-table.js';
import { swingArc, whirlRing, play as fxPlay } from './fx.js';
import { charLookFor, SKINNED_HERO } from './gorunus.js';

const BASE = 'models/';
// Irk zırh tonu (konsept tablosu): Kragmir kararmış demir + kızıl, Elentha cilalı gümüş + gök mavisi
const RACE_TINT = { ocak: '#b48478', sancak: '#e6eeff' };
const HEIGHT = 2.3; // normal boyut (prosedürel karakterle aynı)
const fbx = new FBXLoader(), gltf = new GLTFLoader();
gltf.setMeshoptDecoder(MeshoptDecoder); // modeller meshopt ile sıkıştırılmıştır (tools/convert-models.sh)
const ready = new Map();   // url -> {scene, clips} | null
let manifest = { characters: {}, anims: {} };

// ?test=xbot → three.js örneklerindeki Mixamo iskeletli Xbot ile boru hattını dene (sadece geliştirme için)
const TEST = new URLSearchParams(location.search).get('test');
const XBOT = 'models/test/Xbot.glb.js'; // pakete gömülü (dış CDN yok); base64 .glb.js modülü

const url = u => /^https?:/.test(u) || u.startsWith(BASE) ? u : BASE + u;

async function load(u) {
  u = url(u);
  if (ready.has(u)) return ready.get(u);
  const isG = /\.(glb|gltf|json)$/i.test(u), isB = /\.glb\.js$/i.test(u);
  const v = await (isB ? import('../' + u).then(m => { const t = atob(m.default), b = new Uint8Array(t.length); for (let i = 0; i < t.length; i++) b[i] = t.charCodeAt(i); return gltf.parseAsync(b.buffer, ''); }).then(g => ({ scene: g.scene, clips: g.animations }))
                 : isG ? gltf.loadAsync(u).then(g => ({ scene: g.scene, clips: g.animations }))
                       : fbx.loadAsync(u).then(o => ({ scene: o, clips: o.animations })))
    .catch(() => { console.warn('[model] yüklenemedi, prosedürel modele dönülüyor:', u); return null; });
  ready.set(u, v);
  return v;
}

export async function preloadModels(onProgress) {
  try { const r = await fetch(BASE + 'models.json', { cache: 'no-cache' }); if (r.ok) manifest = await r.json(); } catch { }
  if (TEST === 'xbot') {
    const ids = Object.keys(manifest.characters || {});
    manifest = { anims: { idle: 'clip:idle', combatIdle: 'clip:idle', run: 'clip:run', victory: 'clip:agree' }, characters: Object.fromEntries(ids.map(id => [id, { file: XBOT }])) };
  }
  const chars = Object.values(manifest.characters || {}).filter(c => c.file);
  const charUrls = [...new Set(chars.map(c => url(c.file)))];
  let done = 0, animUrls = [];
  const total = () => charUrls.length + animUrls.length;
  onProgress?.(0, charUrls.length);
  await Promise.all(charUrls.map(u => load(u).then(() => onProgress?.(++done, total()))));
  // En az bir karakter yüklendiyse animasyon dosyalarını da yükle (yoksa boşuna istek atma)
  if (charUrls.some(u => ready.get(u))) {
    const specs = [...Object.values(manifest.anims || {}), ...chars.flatMap(c => Object.values(c.anims || {}))];
    animUrls = [...new Set(specs.filter(s => !s.startsWith('clip:')).map(url))];
    await Promise.all(animUrls.map(u => load(u).then(() => onProgress?.(++done, total()))));
  }
  return charUrls.filter(u => ready.get(u)).length;
}

// Mixamo animasyonlarında kalça ileri kayıyorsa yerinde tut (x/z sabit, y serbest)
const fixed = new WeakSet();
function inPlace(clip) {
  if (fixed.has(clip)) return clip;
  for (const tr of clip.tracks) if (/Hips\.position$/.test(tr.name)) {
    const v = tr.values, x0 = v[0], z0 = v[2];
    for (let i = 0; i < v.length; i += 3) { v[i] = x0; v[i + 2] = z0; }
  }
  fixed.add(clip);
  return clip;
}
function getClip(spec, own) {
  if (!spec) return null;
  if (spec.startsWith('clip:')) {
    const n = spec.slice(5).toLowerCase();
    return own?.clips.find(c => c.name.toLowerCase() === n) || own?.clips.find(c => c.name.toLowerCase().includes(n)) || null;
  }
  const a = ready.get(url(spec));
  return a?.clips?.[0] ? inPlace(a.clips[0]) : null;
}

export function createSkinned(unit) {
  // Oyuncunun seçtiği görünüş (gorunus.js): iskeletli modelin kafası/saçı dokuya gömülüdür, görünüş uygulanamaz → prosedürel
  // modele düşülür (world.js / portraits.js `|| new Character(unit.look, unit.model)`); model.char görünüşü taşır.
  const ch = charLookFor(unit);
  if (ch) { unit.model = { ...(unit.model || {}), char: ch }; if (!SKINNED_HERO) return null; }
  // Irka özel model: "warrior.ocak" gibi bir kayıt varsa o kullanılır, yoksa sınıfın ortak modeli
  const f = unit.model?.faction, id = unit.tid || unit.mid;
  const cfg = (f && manifest.characters?.[`${id}.${f}`]) || manifest.characters?.[id];
  const asset = cfg?.file && ready.get(url(cfg.file));
  return asset ? new SkinnedCharacter(asset, cfg, unit) : null;
}

// T-pozunda silahın model uzayındaki yönü: kılıç/balta/tırpan ileri (+z), asa dik, yay dik.
const DEFAULT_ROT = { sword: [0, 0, 0], staff: [0, 0, 0], bow: [-Math.PI / 2, 0, 0] };

class SkinnedCharacter {
  constructor(asset, cfg, unit) {
    const look = unit.look, model = unit.model || {};
    this.cfg = cfg;
    this.faction = model.faction === 'ocak' || model.faction === 'sancak' ? model.faction : null; // kahraman ırkı (yaratıklarda yok)
    this.wglb = model.glb || null; this.sglb = model.sglb || null; // eşyanın hazır 3B modeli (models.js GLB_ITEM)
    this.M = new Mats();
    this.auras = []; this.spinners = [];
    this.fx = look.fx;
    this.dead = false; this.flash = 0; this.sparkT = 0;
    this.combatTarget = 0;
    this.root = new THREE.Group();
    this.scale = (look.scale || 1) * (cfg.scale || 1);

    // modeli kopyala ve boyunu normalize et (Mixamo FBX santimetre gelir)
    const m = this.model = SkeletonUtils.clone(asset.scene);
    m.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(m);
    const k = HEIGHT / Math.max(0.001, box.max.y - box.min.y);
    m.scale.multiplyScalar(k);
    m.position.y = -box.min.y * k;
    m.updateMatrixWorld(true);

    // malzemeleri örnek başına kopyala; Phong'ları PBR'a çevir (zırhlar ortamı yansıtsın)
    // Gövdenin ışıma çarpanı silahınkinden ayrıdır (bodyU.glow): dokudaki kendinden aydınlık pay sahnenin pozlamasına göre kısılır.
    const bodyU = this.bodyU = { dissolve: this.M.u.dissolve, flash: this.M.u.flash, glow: { value: selfLitK() } };
    const body = mt => this.M.add(patchStd(mt, { fx: bodyU }));
    const conv = mt => {
      if (mt.isMeshStandardMaterial) { const c = mt.clone(); c.metalness = cfg.metalness ?? 0.2; c.roughness = cfg.roughness ?? 0.55; c.envMapIntensity = cfg.env ?? 1; return body(c); }
      const s = new THREE.MeshStandardMaterial({
        map: mt.map || null, normalMap: mt.normalMap || null, emissiveMap: mt.emissiveMap || null,
        color: mt.color ? mt.color.clone() : new THREE.Color(1, 1, 1),
        emissive: mt.emissive ? mt.emissive.clone() : new THREE.Color(0),
        // Mixamo dokuları renkli albedo içerir; yüksek metaliklik onları karartır
        metalness: cfg.metalness ?? 0.2, roughness: cfg.roughness ?? 0.55, envMapIntensity: cfg.env ?? 1,
        transparent: mt.transparent, alphaTest: mt.alphaTest || 0, side: mt.side,
      });
      if (s.map) s.map.colorSpace = THREE.SRGBColorSpace;
      return body(s);
    };
    // Eski MMORPG görünümü: doku kendinden hafif aydınlık (gölgede kararmaz), zırh seti renk tonuyla ayrışır.
    // models.json: "tint" (renk çarpanı), "bright" (parlaklık), "selfLit" (0-1), "lift" (0-1), "accent" (ışıma rengi)
    const style = mt => {
      if (!mt.color) return;
      if (cfg.tint) mt.color.multiply(new THREE.Color(cfg.tint));
      if (model.tint) mt.color.multiply(new THREE.Color(model.tint)); // kahramanın görünüm tonu (combat.js: unitLook)
      if (this.faction) mt.color.multiply(new THREE.Color(RACE_TINT[this.faction])); // Kragmir kararmış demir ve kızıl, Elentha cilalı gümüş
      mt.color.multiplyScalar(cfg.bright ?? 1.25);
      const lit = cfg.selfLit ?? 0.22;
      // "lift": dokudan bağımsız sabit ışıma; çok koyu dokulu zırhların siyahlarını kaldırır
      if (cfg.lift && mt.emissive) { mt.emissiveMap = null; mt.emissive.set(cfg.accent || cfg.tint || 0xffffff); mt.emissiveIntensity = cfg.lift; }
      else if (lit > 0 && mt.map && mt.emissive) { mt.emissiveMap = mt.map; mt.emissive.set(cfg.accent || 0xffffff); mt.emissiveIntensity = lit; }
    };
    m.traverse(o => {
      if (!o.isMesh) return;
      o.castShadow = true;
      o.frustumCulled = false;
      o.material = Array.isArray(o.material) ? o.material.map(conv) : conv(o.material);
      (Array.isArray(o.material) ? o.material : [o.material]).forEach(style);
    });

    // Zırh parıltısı: gövde dokusu ışır (+7), +8'de kıvılcım, +9'da ince alev kenarı, +10'da ırk renginde aura (fx-table.js: armorGlow)
    this.glowMeshes = []; this.armGlowMats = [];
    const AG = armorGlow(model.ap, model.ag, model.faction);
    if (AG) { armorGlowSetup(this, AG); m.traverse(o => { if (o.isMesh) for (const mt of Array.isArray(o.material) ? o.material : [o.material]) armorGlowTint(this, mt); }); }

    const find = re => { let b = null; m.traverse(o => { if (!b && o.isBone && re.test(o.name)) b = o; }); return b; };
    this.bones = { hand: find(/RightHand$/i), handL: find(/LeftHand$/i), head: find(/Head$/i), chest: find(/Spine2$/i) || find(/Spine1$/i) || find(/Spine$/i) };

    // parlayan + silah (model kendi silahını taşıyorsa models.json'da "weapon": false)
    // (rengi nadirlikten, gücü artıdan gelir: fx-table.js weaponGlow; Eşsiz silah ışık süzmesi taşır)
    const plus = model.plus || 0, G = weaponGlow(plus, model.g, model.faction, model.fx);
    this.glowColor = G?.level ? G.color : null; this.glowMeshes ||= []; this.deathN = 0;
    const kind = this.weaponKind = cfg.weaponKind || look.weapon || model.weapon || 'sword';
    // Silahı kemiğe bağla: yön ve konum kemiğin kendi eksenlerine göre değil, modelin
    // dinlenme (T) pozundaki model uzayına göre verilir → her Mixamo modelinde aynı sonuç.
    const attach = (obj, bone, rot, pos) => {
      const ws = new THREE.Vector3(), wq = new THREE.Quaternion();
      bone.getWorldScale(ws); bone.getWorldQuaternion(wq);
      const inv = wq.clone().invert();
      const holder = new THREE.Group();
      holder.scale.setScalar(1 / ws.x);
      holder.quaternion.copy(inv).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)));
      holder.position.copy(new THREE.Vector3(...pos).applyQuaternion(inv).divideScalar(ws.x));
      holder.add(obj); bone.add(holder);
    };
    if (cfg.weapon !== false && this.bones.hand) {
      const left = kind === 'bow';
      const bone = left ? (this.bones.handL || this.bones.hand) : this.bones.hand;
      this.weapon = buildWeapon(kind, this, G);
      attach(this.weapon, bone, cfg.weaponRot || DEFAULT_ROT[kind] || DEFAULT_ROT.sword, cfg.weaponPos || (left ? [0.09, -0.02, 0] : [-0.09, -0.02, 0]));
      if ((look.shield ?? model.shield) && this.bones.handL && cfg.shield !== false) attach(this.shield = buildShield(this, look), this.bones.handL, cfg.shieldRot || [0, Math.PI, 0], cfg.shieldPos || [0.12, -0.04, 0]);
      // Sol eldeki tek el silah (iki silah taşıma, 19 Kas): yordamsal model, parıltısız
      else if (model.off && this.bones.handL && !left && cfg.shield !== false) { const c2 = Object.assign(Object.create(this), { wglb: null }); attach(this.offWeapon = buildWeapon(model.off, c2, null), this.bones.handL, DEFAULT_ROT[model.off] || DEFAULT_ROT.sword, [0.09, -0.02, 0]); }
    } else this.weapon = this.bones.hand || m;

    // klan pelerini: omurga (göğüs) kemiğine, omuz hizasından bağlanır; boyu omuz yüksekliğine göre ölçeklenir.
    // models.json "cape": { y, z, bulge, slant, width } ile modele göre ince ayar yapılabilir.
    if (model.cape && this.bones.chest) {
      const wp = b => b.getWorldPosition(new THREE.Vector3()), sh = find(/LeftArm$/i) || find(/LeftShoulder$/i), pc = wp(this.bones.chest), cp = cfg.cape || {};
      const H = (sh ? wp(sh).y : pc.y + 0.25) + 0.05 + (cp.y || 0);
      this.clanCape = new ClanCape(this, model.cape, { H, bulge: cp.bulge ?? 0.07, slant: cp.slant ?? 0.1, width: cp.width ?? 0.8 });
      attach(this.clanCape.group, this.bones.chest, [0, 0, 0], [0, H - pc.y, cp.z ?? -0.16]);
    }

    // Irk parçaları: Kragmir’de boynuzlu miğfer, dikenli omuzluk, diş kolye ve Kor Taşı; Elentha’da altın sorguç,
    // omuz halkaları ve Ak Taş. Kemik bulunamazsa o parça atlanır. models.json "race": false kapatır.
    this.raceParts = [];
    if (this.faction && cfg.race !== false && gfx.T.dress !== false) {
      const R = raceBodyGear(this.M, this.faction);
      const shL = find(/LeftShoulder$/i) || find(/LeftArm$/i), shR = find(/RightShoulder$/i) || find(/RightArm$/i);
      if (this.bones.head) attach(R.head, this.bones.head, [0, 0, 0], [0, 0, 0]);
      if (this.bones.chest) attach(R.chest, this.bones.chest, [0, 0, 0], [0, 0, 0]);
      if (shL) attach(R.shL, shL, [0, 0, 0], [0, 0.02, 0]);
      if (shR) attach(R.shR, shR, [0, 0, 0], [0, 0.02, 0]);
      for (const g of [R.head, R.chest, R.shL, R.shR]) if (g.parent) this.raceParts.push(g);
    }

    // animasyonlar: genel set + karaktere özel olanlar
    this.mixer = new THREE.AnimationMixer(m);
    this.actions = {};
    for (const [name, spec] of Object.entries({ ...(manifest.anims || {}), ...(cfg.anims || {}) })) {
      const clip = getClip(spec, asset);
      if (clip) this.actions[name] = this.mixer.clipAction(clip);
    }
    this.mixer.addEventListener('finished', e => { if (e.action === this.current && !this.dead) this.idle(0.25); });

    this.root.add(m);
    this.root.scale.setScalar(this.scale);
    // silah ve kalkanın parçaları tek ağda toplanır (çizim çağrısı azalır); kendi geometrileri karakterle birlikte silinir
    const dyn = new Set([this.orb, ...this.auras, ...this.spinners, ...this.glowMeshes].filter(Boolean)), keep = o => dyn.has(o);
    this.own = [];
    for (const part of [this.weapon, this.shield]) if (part?.isGroup) { this.own.push(...bakeRigid(part, [part], this.batchM ||= this.M.batch(), keep, { under: 0.3 })); part.traverse(o => { if (o.isMesh && !this.own.includes(o)) this.own.push(o); }); }
    if (this.clanCape) this.clanCape.group.traverse(o => { if (o.isMesh) this.own.push(o); });
    for (const o of [this.armShell, this.armAura]) if (o) this.own.push(o);
    for (const g of this.raceParts) g.traverse(o => { if (o.isMesh) { o.castShadow = false; this.own.push(o); } });
    if (new URLSearchParams(location.search).has('tpose')) this.actions = {}; // hata ayıklama: silah hizasını T-pozunda gör
    this.idle(0);
  }

  // ---- animasyon durum makinesi ----
  idleName() { return this.combatTarget && this.actions.combatIdle ? 'combatIdle' : 'idle'; }
  idle(fade = 0.25) { this.play(this.idleName(), { loop: true, fade }); }
  play(name, { loop = false, fade = 0.12, speed = 1 } = {}) {
    const a = this.actions[name];
    if (!a) return null;
    if (loop && this.current === a) return a;
    a.reset();
    a.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity);
    a.clampWhenFinished = !loop;
    a.timeScale = speed;
    a.play();
    if (this.current && this.current !== a) a.crossFadeFrom(this.current, fade, false);
    this.current = a;
    return a;
  }
  // Animasyonu başlat, darbe anına (klibin frac oranı) kadar bekle
  async act(names, frac, fallback = 0.3) {
    const n = names.find(x => this.actions[x]);
    const a = n && this.play(n, { fade: 0.1 });
    if (!a) return wait(fallback);
    const at = this.cfg.impact?.[n] ?? frac;
    await wait(a.getClip().duration * at / a.timeScale);
  }

  update(dt, t) {
    this.mixer.update(dt);
    this.bodyU.glow.value = selfLitK();
    if (this.clanCape) this.clanCape.update(dt, t, this.current && this.current === this.actions.run ? 1 : 0);
    const idleA = this.actions.idle, cIdle = this.actions.combatIdle;
    if (!this.dead && this.current && (this.current === idleA || this.current === cIdle) && this.current !== this.actions[this.idleName()]) this.idle(0.4);
    if (this.orb) { const s = 1 + Math.sin(t * 6) * 0.1; this.orb.scale.set(s, s * 1.5, s); this.orb.rotation.y = t * 2; }
    for (let i = 0; i < this.spinners.length; i++) { const r = this.spinners[i]; r.rotation.x = t * 1.7 + i; r.rotation.y = t * 1.1; }
    for (let i = 0; i < this.auras.length; i++) { const a = this.auras[i]; a.material.opacity = a.userData.base * (1 + Math.sin(t * 5) * 0.35); }
    armorGlowTick(this, dt, t);
    if (this.glowSparks && !this.dead && gfx.T.fx) {
      this.sparkT -= dt;
      if (this.sparkT < 0) { this.sparkT = 1 / this.glowSparks; const v = this.weapon.getWorldPosition(V0), k = this.scale; particle(v.x + (Math.random() - 0.5) * 0.4 * k, v.y + Math.random() * 0.6 * k, v.z + (Math.random() - 0.5) * 0.4 * k, 0, 0.25, 0, this.glowColor, 0.07, 0.6, 0.6, 0); }
    }
    if (this.flash > 0) { this.flash = Math.max(0, this.flash - dt * 4); this.M.u.flash.value = this.flash * 1.4; }
  }

  get pos() { return this.root.position; }
  boneWorld(b, fallbackY, v = new THREE.Vector3()) { if (b) b.getWorldPosition(v); else v.copy(this.root.position).y += fallbackY * this.scale; return v; }
  // …To(v): verilen vektöre yazar (kare başına çağıranlar bellek ayırmasın)
  headTo(v) { this.boneWorld(this.bones.head, 2.0, v); v.y += 0.45 * this.scale; return v; }
  chestTo(v) { return this.boneWorld(this.bones.chest, 1.45, v); }
  headPos() { return this.headTo(new THREE.Vector3()); }
  chestPos() { return this.chestTo(new THREE.Vector3()); }
  handPos() { const v = new THREE.Vector3(); (this.orb || this.weapon).getWorldPosition(v); return v; }
  face(target) { this.root.rotation.y = Math.atan2(target.x - this.pos.x, target.z - this.pos.z); }

  async moveTo(target, dur = 0.35) {
    this.face(target);
    this.play('run', { loop: true, fade: 0.1 });
    const from = this.pos.clone();
    await tween(dur, k => this.pos.lerpVectors(from, target, k), ease.inOut);
    this.idle(0.15);
  }
  async swing() { await this.act(['attack'], 0.45); swingArc(this, this.arcTint || this.glowColor); }
  async whirl() { const end = whirlRing(this, this.arcTint || this.glowColor || 0xdde6ff); await this.act(['special', 'attack'], 0.55); end(); }
  async castSpell() { await this.act(['cast', 'attack'], 0.55); }
  async raiseArms() { await this.act(['cast2', 'cast'], 0.5); }
  async shoot() { await this.act(['shoot', 'cast', 'attack'], 0.6); }
  async stomp() { await this.act(['special', 'attack'], 0.5); }
  hit(from, heavy = false) {
    this.flash = 1;
    const home = this.pos.clone();
    const dir = from ? this.pos.clone().sub(from).setY(0).normalize() : new THREE.Vector3();
    const k = (heavy ? 0.45 : 0.22) / this.scale;
    tween(0.08, e => this.pos.copy(home).addScaledVector(dir, k * e), ease.out).then(() => tween(0.3, e => this.pos.copy(home).addScaledVector(dir, k * (1 - e)), ease.inOut));
    if (!this.dead) this.play('hit', { fade: 0.05 });
  }
  // Ölüm: düşme animasyonu, sonra gövde eriyerek kor ve küle dönüşür. Arada diriltilirse (revive) erime yarıda kesilir.
  async die() {
    this.dead = true;
    const n = ++this.deathN, a = this.play('death', { fade: 0.1 });
    await wait(a ? a.getClip().duration * 0.85 : 0.6);
    if (n !== this.deathN) return;
    fxPlay(EVENT_FX.kill, this);
    this.root.traverse(o => { if (o.isMesh) o.castShadow = false; });
    for (const m of this.glowMeshes) m.visible = false; for (const x of this.auras) x.visible = false;
    await tween(0.9, e => { if (n === this.deathN) this.M.u.dissolve.value = e * 1.02; });
    if (n === this.deathN) this.root.visible = false;
  }
  revive(face, home) {
    this.deathN++; this.dead = false; this.M.u.dissolve.value = 0;
    this.root.visible = true; this.root.rotation.set(0, face, 0); if (home) this.pos.copy(home);
    this.root.traverse(o => { if (o.isMesh) o.castShadow = o.material.isMeshStandardMaterial === true; });
    for (const m of this.glowMeshes) m.visible = true; for (const x of this.auras) x.visible = true;
    this.idle(0.1);
  }
  cheer() { if (!this.dead) this.play('victory', { fade: 0.2 }); }
  // gövdenin geometrisi kopyalar arasında ortaktır (silinmez); silah, kalkan ve pelerin karaktere aittir
  // Kopyanın iskeleti (SkeletonUtils.clone her kopyaya yeni iskelet verir) kendi kemik dokusunu taşır: silinmezse her savaşta GPU'da birikir
  dispose() {
    this.mixer.stopAllAction(); this.mixer.uncacheRoot(this.model); scene.remove(this.root);
    for (const o of this.own) o.geometry.dispose(); this.M.list.forEach(m => m.dispose());
    const sk = new Set(); this.model.traverse(o => { if (o.isSkinnedMesh && o.skeleton) sk.add(o.skeleton); }); sk.forEach(k => k.dispose());
  }
}
const V0 = new THREE.Vector3();
