// 23 Kas (C5 sürer): G3 yaratık/boss çizimlerinin ortak kaydı. three.js'e bağlı değildir; hem savaş (savas-birim2d.js)
// hem arayüz (ui-core mobImg: Ansiklopedi, VS, rapor, heykel…) buradan okur. Paketler (b2d-*.js) tembel yüklenir.
const off = (() => { try { return /[?&]b2d=0/.test(location.search) || localStorage.getItem('dd_b2d') === '0'; } catch { return false; } })();
export const B2D = { on: !off };

// Yaratık → çizim: [paket, tür, renk çarpanı]. Paketler: 'halk' (oyuncunun halk dosyası; G2 bandikutları), G3 bölgeleri
// y1 Vahran, y2 Kül Geçidi, y3 Kızıl Bahar, y4 Sisli Çukur, yb ana bosslar (_tasarim/araclar/b2d-g3-gom.py).
// Kendi çizimi olmayan türler yakın türün çizimini renk çarpanıyla kullanır. 23 Kas (M1 ek): son 13 tür (6 ejder, tavşan, doğan,
// eşek arısı, gargoyl, barbar önderi, lamia, yılan kraliçe) yalnız bekleme pozuyla geldi; saldırı/vurulmada bekleme pozu kullanılır.
const Y = (pk, s) => Object.fromEntries(s.trim().split(/\s+/).map(x => { const [m, t, c] = x.split(':'); return [m, [pk, t, c ? parseInt(c, 16) : 0xffffff]]; }));
export const YARATIK = {
  ...Y('halk', 'small_bandicoot:kucuk-bandikut bandicoot:bandikut wild_bandicoot:yaman-bandikut rabid_bandicoot:kuduz-bandikut'),
  ...Y('y1', `scavenger_bandicoot:lescil-bandikut cannibal_bandicoot:yamyam-bandikut worm:solucan earth_worm:toprak-solucani blood_worm:kan-solucani
    cave_leech:magara-sulugu wood_leech:orman-sulugu snatcher:kapkacci goblin:goblin goblin_bouncer:goblin-fedai goblin_necromancer:goblin-olucu
    kobold:kobold goblin_juggler:goblin-hokkabaz bugbear:ocu hobgoblin:hobgoblin skeleton:iskelet skeleton_warrior:iskelet-savasci
    burning_skeleton:yanan-iskelet skeleton_knight:iskelet-sovalye skeleton_champion:iskelet-er-basi dire_wolf:azman-kurt wolfhound:kurt-tazisi
    gloom_hound:kasvet-tazisi hell_hound:cehennem-tazisi werewolf:kurtadam lycan:kurtadam loup_garou:kurtadam:d8ccc0 rabbit:rabbit`),
  ...Y('y2', `tarantula:tarantula man_eating_tarantula:tarantula:ffb4a4 pincers_scorpion:kiskacli-akrep black_widow:karadul scorpion:akrep
    paralyzer:uyusturan stinger:igneli zombie:zombi undying:olmeyen rotten_eyes:curuk-goz decayed_zombie:curumus-zombi ash_knight:kul-sovalye
    lizardman:kertenkele-adam lizardman_warrior:kertenkele-savasci mudman:camur-adam sand_man:kum-adam lizardman_captain:kertenkele-yuzbasi
    flame_rock:alev-kayasi stone_golem:tas-golem volcanic_rock:volkan-kayasi giant_rock:dev-kaya dark_stone:kara-tas giant_golem:dev-golem
    tree_ghost:agac-hayaleti tree_ghost_variant:kara-agac-hayaleti titan_sapling:titan desert_golem:col-golemi tree_ghost_king:agac-hayaleti-krali`),
  ...Y('y3', `smilodon:bozkir-kilic-disi wild_smilodon:kizil-kilic-dis saber_tooth:kilic-dis machairodus:bozkir-kilic-disi:d8c8b8 meganthereon:megantereon
    troll:trol troll_warrior:trol-savasci troll_shaman:trol:c8d4ff troll_witch_doctor:trol:dcffd0 troll_berserker:kaya-trolu half_troll_warrior:trol-savasci:ffe0c8
    troll_captain:kaya-trolu:ffc8b0 half_troll_captain:trol-savasci:ffc8b0 troll_king:trol-krali centaur:sentor centaur_ranger:sentor-mizrakci
    centaur_archer:sentor-okcu centaur_sniper:sentor-okcu:d0d8e8 centaur_captain:sentor-yuzbasi crimson_wing:kizil-harpi harpy:harpi
    raven_harpy:firtina-harpisi harpy_queen:harpi-kralicesi ape:maymun twin_ape:maymun:ffd8c0 glyptodont:gliptodon mastodon:mastodon
    stegodon:mastodon:e8d8c8 minotaur:minotor manticore:mantikor falcon:falcon hornet:hornet gargoyle:gargoyle leader_of_barbarian:leader_of_barbarian`),
  ...Y('y4', `ghost:hayalet ghost_warrior:sis-hayaleti specter:sis-hayaleti:d0d8ff wraith:yas-ruhu phantom:hayalet:c8d0e0 shadow:yas-ruhu:9898a8
    red_ghost:hayalet:ffa8a0 wandering_spectre:sis-hayaleti:e8e4d0 shadow_spectre:yas-ruhu:a8a8b8 mana_spectre:yas-ruhu:b0c8ff
    mage_ghost:olu-buyucu:c8d8ff wandering_knight_ghost:lanetli-sovalye:c0d0e8 mana_predator:mana-avcisi dark_soldier:kul-muhafizi:b8b8b8
    black_guard:kul-muhafizi doom_soldier:kul-muhafizi:ffc0b0 dark_knight:kara-sovalye shade_knight:kara-sovalye:c0c0d0 shadow_knight:lanetli-sovalye
    dread_knight:lanetli-sovalye:ffc8c0 doom_knight:kara-sovalye:ffb8a8 revenge_knight:lanetli-sovalye:d8d0ff death_knight:olum-sovalyesi
    evil_wizard:tarikat-kahini skeleton_lord:kemik-buyucusu death_wizard:olu-buyucu reaper:pul-fanatigi screamer:yas-ruhu:ffd0d0 lamentation:yas-ruhu
    lich:lic dark_mare:kara-kisrak shade_mare:gece-kisragi death_mare:kabus-ati:c0c0c0 dread_mare:gece-kisragi:ffc0c0 nightmare:kabus-ati
    dragon_servant:ejder-kulu dragon_knight:kul-ejder-kulu erlik:maresal-marven bozdag:adsiz lamia:lamia snake_queen:snake_queen`),
  ...Y('yb', `devsolucan:dev-solucan tepegoz:tepegoz kristalbekci:kristal-muhafizi lavyurek:lav-yurek karaduman:kul-agasi-karadun
    red_dragon_hatchling:dragon_fire:ffd8c8 red_dragon:dragon_fire blue_dragon:dragon_ice bone_dragon:dragon_ice:f0e4d0
    dark_dragon:dragon_shadow gold_dragon:dragon_lightning:ffe6a0`),
};
export const halkAd = () => document.documentElement.dataset.faction === 'sancak' ? 'sancak' : 'ocak';

// ---- Paketler ----
const PAKET = {};
export const HAZIR = {}; // yüklenmiş paketler (eşzamanlı okuma)
export const paket = ad => (PAKET[ad] ||= import(`./b2d-${ad}.js`).then(m => (HAZIR[ad] = m.B)).catch(() => null));

// ---- Arayüz resimleri ----
// Yaratığın çizimi var mı: { ad, anahtar, tint } ya da null
export function mobCizim(id) {
  if (!B2D.on) return null;
  const Y = YARATIK[id]; if (!Y) return null;
  return { ad: Y[0] === 'halk' ? halkAd() : Y[0], anahtar: Y[1], tint: Y[2] };
}
// full: boydan bekleme pozu (saydam), değilse 128 px boyalı portre. Hazırsa URL, değilse null (indirme başlar, gelince
// sayfadaki img[data-m2d] resimleri yerinde değişir).
const URL_ = new Map(), ISLENIYOR = new Map();
export function mobResim(id, full = false) {
  const s = mobCizim(id); if (!s) return null;
  const k = `${id}:${full ? 1 : 0}`;
  if (URL_.has(k)) return URL_.get(k);
  hazirla(id, full);
  return null;
}
function hazirla(id, full) {
  const k = `${id}:${full ? 1 : 0}`;
  if (ISLENIYOR.has(k)) return ISLENIYOR.get(k);
  const s = mobCizim(id);
  const p = paket(s.ad).then(P => {
    const d = P?.[s.anahtar], b64 = d && (full ? d.bekleme : d.portre || d.bekleme);
    if (!b64) return null;
    const ham = 'data:image/webp;base64,' + b64;
    return s.tint === 0xffffff ? ham : boya(ham, s.tint);
  }).then(u => { if (u) { URL_.set(k, u); yerlestir(k, u); } return u; }).catch(() => null);
  ISLENIYOR.set(k, p);
  return p;
}
// Renk çarpanı (savaştaki malzeme rengiyle aynı etki): çarp, sonra özgün saydamlığı geri koy
function boya(src, tint) {
  return new Promise(ok => {
    const im = new Image();
    im.onload = () => {
      const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight;
      const g = c.getContext('2d');
      g.drawImage(im, 0, 0);
      g.globalCompositeOperation = 'multiply'; g.fillStyle = '#' + tint.toString(16).padStart(6, '0'); g.fillRect(0, 0, c.width, c.height);
      g.globalCompositeOperation = 'destination-in'; g.drawImage(im, 0, 0);
      c.toBlob(b => ok(b ? URL.createObjectURL(b) : src), 'image/webp', 0.9);
    };
    im.onerror = () => ok(src);
    im.src = src;
  });
}
function yerlestir(k, u) {
  document.querySelectorAll(`img[data-m2d="${k}"]`).forEach(img => { img.removeAttribute('data-pt'); img.removeAttribute('data-m2d'); img.classList.add('m2d'); if (k.endsWith(':1')) img.classList.add('m2df'); img.src = u; });
}
