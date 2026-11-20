// Canavar ansiklopedisi (VAHRAN, 18.11.2026). Adlar kullanıcının verdiği canavar listesinden telif taramasını geçmiş güvenli
// adlardır (gerçek hayvanlar, genel fantastik/folklor yaratıkları; rapor: docs/telif-riskli-canavarlar.pdf). Kaynak tabloda
// stat yoktur: bütün değerler, görünüşler ve yetenekler bu oyunun tasarımıdır.
//
// Her blok bir AİLEdir; üyeler rollerine göre kurulur:
//   b temel (standart saldırı/savunma) · w savaşçı (yüksek can ve savunma, standart saldırı) · m büyücü (yüksek hasar, düşük can
//   ve savunma) · r çevik (hızlı, kritik) · a okçu (uzaktan) · e seçkin (her yönden güçlü).
// Stage dizilimi zones.js stageDef'tedir: ör. bir blokun ilk stage'inde her rolden birer canavar gelir (temel + savaşçı + büyücü).
// Gövde (look.kind): yoksa insansı (models.js Character); 'worm' (WormCharacter); quad/spider/scorpion/bird/insect/centaur/
// serpent/dragon (beasts.js BeastCharacter). İnsansı ekler: wings, tail, horns, ghost, bark, snout (models.js decorate).

const ROLE = {
  b: { k: { hp: 1, atk: 1, def: 1 }, spd: 100, crit: 0.08 },
  w: { k: { hp: 1.45, atk: 0.95, def: 1.45 }, spd: 92, crit: 0.06 },
  m: { k: { hp: 0.68, atk: 1.5, def: 0.62 }, spd: 102, crit: 0.1 },
  r: { k: { hp: 0.85, atk: 1.2, def: 0.8 }, spd: 114, crit: 0.18 },
  a: { k: { hp: 0.8, atk: 1.25, def: 0.75 }, spd: 108, crit: 0.15 },
  e: { k: { hp: 1.3, atk: 1.2, def: 1.15 }, spd: 100, crit: 0.12 },
  c: { k: { hp: 5.5, atk: 1.3, def: 1.3 }, spd: 100, crit: 0.12 },  // kapı kaptanı
  B: { k: { hp: 30, atk: 1.5, def: 1.4 }, spd: 100, crit: 0.14 },   // boss
};
// Rol yetenekleri; aile teması (el: element) büyücünün asıl büyüsünü seçer
const MAGIC = { fire: ['x_bolt', 'x_fire', 'x_firestorm'], ice: ['x_bolt', 'x_frost', 'x_curse'], bolt: ['x_bolt', 'x_mark', 'x_hex'], poison: ['x_bolt', 'x_hex', 'x_mark'], dark: ['x_bolt', 'x_curse', 'x_drain'] };
const SKILLS = {
  b: () => ['x_hit', 'x_stab'], w: () => ['x_hit', 'x_guard', 'x_smash'], r: () => ['x_hit', 'x_stab', 'x_execute'], a: () => ['x_shot', 'x_aim', 'x_volley'],
  m: el => MAGIC[el] || MAGIC.bolt, e: () => ['x_hit', 'x_cleave', 'x_rage'],
  c: el => ['x_hit', 'x_smash', 'x_howl', ...(el === 'fire' ? ['x_fire'] : el === 'ice' ? ['x_frost'] : [])],
  B: el => ['x_hit', 'x_crush', 'x_roar', 'x_rage', ...(el === 'fire' ? ['x_firestorm'] : el === 'ice' ? ['x_blizzard'] : el === 'poison' ? ['x_hex'] : ['x_quake'])],
};
const SCALE = { b: 1, w: 1.1, m: 0.95, r: 0.95, a: 1, e: 1.12, c: 1.28, B: 1.6 };
// Rol görünüş farkı (insansı): savaşçı kalkanlı ve ağır, büyücü asalı ve ışıltılı, okçu yaylı
const ROLE_LOOK = { w: { shield: true }, m: { weapon: 'staff', robe: true }, a: { weapon: 'bow' } };
const tint = (c, k) => { const f = v => Math.max(0, Math.min(255, Math.round(v * k))); return (f(c >> 16 & 255) << 16) | (f(c >> 8 & 255) << 8) | f(c & 255); };

// Aileler zayıftan güçlüye. zone/block: yerleştiği bölge ve blok · el: büyü teması · weak: zayıf olduğu element
// look: ailenin ortak görünüşü · m: üyeler [kimlik, ad, rol, görünüş farkı] · gate: [kimlik, ad, 'c' | 'B', görünüş farkı, aşamalar]
export const FAMILIES = [
  // ---------- 1. bölge: Vahran Ovası (1–20) ----------
  { id: 'bandicoot', zone: 1, block: 1, el: 'poison', weak: 'fire', look: { kind: 'quad', body: 0x8a6a4a, belly: 0xc9a77a, snout: 1.4, tail: 1.2, ears: 0.6, scale: 0.8 },
    m: [['small_bandicoot', 'Small bandicoot', 'b', { scale: 0.62 }], ['bandicoot', 'Bandicoot', 'b'], ['wild_bandicoot', 'Wild Bandicoot', 'w', { body: 0x6a4a32, spikes: 1 }],
        ['rabid_bandicoot', 'Rabid Bandicoot', 'm', { body: 0x6a7a3a, eyes: 0x9dff4a, fx: 0x9dff4a }], ['scavenger_bandicoot', 'Scavenger Bandicoot', 'r', { body: 0x5a5048 }]],
    gate: ['cannibal_bandicoot', 'Cannibal Bandicoot', 'c', { body: 0x7a2a1a, eyes: 0xff3a1a, spikes: 1 }] },
  { id: 'worm', zone: 1, block: 2, el: 'poison', weak: 'fire', look: { kind: 'worm', skin: 0xb07a6a, belly: 0xd8a890, scale: 0.55 },
    m: [['worm', 'Worm', 'b'], ['earth_worm', 'Earth worm', 'w', { skin: 0x7a5a3a, belly: 0x9a7a5a, scale: 0.68 }], ['blood_worm', 'Blood worm', 'm', { skin: 0x8a1a2a, belly: 0xc84a4a, fx: 0xff3a4a }],
        ['cave_leech', 'Cave leech', 'r', { skin: 0x3a3440, belly: 0x6a5a6a, scale: 0.5 }], ['wood_leech', 'Wood Leech', 'b', { skin: 0x4a5a2a, belly: 0x7a8a4a, scale: 0.48 }]],
    gate: ['snatcher', 'Snatcher', 'c', { skin: 0x5a3a5a, belly: 0x9a6a8a, scale: 0.95 }] },
  { id: 'goblin', zone: 1, block: 3, el: 'dark', weak: 'bolt', look: { skin: 0x6f9b3c, armor: 0x5a4630, trim: 0x3a2c1e, weapon: 'dagger', helmet: 'none', ears: true, scale: 0.78, armorType: 'leather' },
    m: [['goblin', 'Goblin', 'b'], ['goblin_bouncer', 'GOBLIN bouncer', 'w', { weapon: 'club', armor: 0x4a3a2a, scale: 0.95 }], ['goblin_necromancer', 'Goblin Necromancer', 'm', { armor: 0x3a2a4a, helmet: 'hood', fx: 0xb05aff }],
        ['kobold', 'KOBOLD', 'r', { skin: 0x8a6a4a, snout: true, tail: 0x8a6a4a, scale: 0.7 }], ['goblin_juggler', 'GOBLIN juggler', 'a', { armor: 0x8a3a2a }], ['bugbear', 'BUGBEAR', 'e', { skin: 0x8a6a3a, hair: 0x5a3a1a, weapon: 'club', scale: 1.15 }]],
    gate: ['hobgoblin', 'HOBGOBLIN', 'c', { skin: 0xc0703a, armor: 0x5a2a1a, weapon: 'axe', helmet: 'horned' }] },
  { id: 'skeleton', zone: 1, block: 4, el: 'ice', weak: 'fire', env: 'graveyard', look: { skin: 0xe8e2d0, armor: 0xc9c2ae, trim: 0x5a5448, weapon: 'sword', helmet: 'none', glowEyes: 0x4affff, armorType: 'bones' },
    m: [['skeleton', 'Skeleton', 'b'], ['skeleton_warrior', 'Skeleton warrior', 'w', { helmet: 'horned' }], ['burning_skeleton', 'Burning Skeleton', 'm', { glowEyes: 0xff7a1a, fx: 0xff7a1a, weapon: 'staff' }],
        ['skeleton_knight', 'Skeleton knight', 'e', { armor: 0x6a6a72, cape: 0x3a2a4a, weapon: 'sword' }]],
    gate: ['skeleton_champion', 'Skeleton champion', 'c', { armor: 0x8a8f96, trim: 0xd4a93a, cape: 0x6a1a1a, helmet: 'crown', weapon: 'axe' }] },
  { id: 'wolf', zone: 1, block: 5, el: 'dark', weak: 'fire', bossEnv: 'arena', look: { kind: 'quad', body: 0x6a6460, belly: 0x9a948c, snout: 1.2, tail: 1, ears: 0.7, mane: 0x4a4440, scale: 0.95 },
    m: [['dire_wolf', 'Dire wolf', 'b'], ['wolfhound', 'Wolfhound', 'w', { body: 0x8a7a6a, scale: 1.08 }], ['gloom_hound', 'Gloom hound', 'm', { body: 0x2a2a3a, eyes: 0x9a6aff, fx: 0x9a6aff }],
        ['hell_hound', 'Hell hound', 'r', { body: 0x3a1a14, eyes: 0xff5a1a, fx: 0xff5a1a }]],
    gate: ['werewolf', 'Werewolf', 'B', { kind: null, skin: 0x6a5a4a, hair: 0x4a3a2a, armor: 0x3a2a1a, weapon: 'axe', helmet: 'none', snout: true, ears: true, tail: 0x5a4a3a, armorType: 'leather', glowEyes: 0xffd36a },
      [{ at: 0.5, text: 'Werewolf uluyor; ay ışığı kanını kaynatıyor!' }]] },

  // ---------- 2. bölge: Kül Geçidi (20–40) ----------
  { id: 'arachnid', zone: 2, block: 1, el: 'poison', weak: 'fire', look: { kind: 'spider', body: 0x3a2a24, belly: 0x6a4a3a, eyes: 0xff3a3a, scale: 0.9 },
    m: [['tarantula', 'Tarantula', 'b'], ['pincers_scorpion', 'Pincers scorpion', 'w', { kind: 'scorpion', body: 0x6a4a2a, scale: 1 }], ['black_widow', 'Black widow', 'm', { body: 0x141218, belly: 0xc81a1a, fx: 0xff2a3a }],
        ['scorpion', 'Scorpion', 'r', { kind: 'scorpion', body: 0x8a6a3a }], ['paralyzer', 'Paralyzer', 'm', { kind: 'scorpion', body: 0x3a4a6a, fx: 0x6ad8ff, eyes: 0x6ad8ff }]],
    gate: ['stinger', 'Stinger', 'c', { kind: 'scorpion', body: 0x5a1a1a, eyes: 0xffd36a, scale: 1.25 }] },
  { id: 'zombie', zone: 2, block: 2, el: 'dark', weak: 'fire', env: 'graveyard', look: { skin: 0x7a8a6a, armor: 0x4a4038, trim: 0x2a2420, weapon: 'club', helmet: 'none', hair: 0x2a2a20, glowEyes: 0xb0ff6a, armorType: 'leather' },
    m: [['zombie', 'Zombie', 'b'], ['undying', 'Undying', 'w', { skin: 0x6a7a5a, armor: 0x3a3a3a, scale: 1.1 }], ['rotten_eyes', 'Rotten Eyes', 'm', { skin: 0x8a8a6a, glowEyes: 0xd0ff3a, fx: 0xb0ff6a, helmet: 'hood' }],
        ['decayed_zombie', 'Decayed Zombie', 'r', { skin: 0x5a6a4a }], ['man_eating_tarantula', 'Man Eating Tarantula', 'e', { kind: 'spider', body: 0x4a1a14, belly: 0x8a3a2a, eyes: 0xffd36a, scale: 1.15 }]],
    gate: ['ash_knight', 'Ash knight', 'c', { skin: 0x9a9a9a, armor: 0x4a4a4e, trim: 0xff7a1a, cape: 0x2a2a2a, weapon: 'sword', shield: true, helmet: 'horned', glowEyes: 0xff7a1a, armorType: 'plate' }] },
  { id: 'lizardman', zone: 2, block: 3, el: 'poison', weak: 'ice', look: { skin: 0x4a8a5a, armor: 0x5a4a2a, trim: 0x2a3a2a, weapon: 'spear', helmet: 'none', snout: true, tail: 0x3a7a4a, armorType: 'leather' },
    m: [['lizardman', 'Lizardman', 'b'], ['lizardman_warrior', 'Lizardman warrior', 'w', { armor: 0x6a5a3a, weapon: 'axe' }], ['mudman', 'Mudman', 'm', { skin: 0x6a4a2a, armor: 0x4a3018, snout: false, tail: false, fx: 0xb08a4a }],
        ['sand_man', 'Sand Man', 'r', { skin: 0xc8a870, armor: 0x8a6a3a, snout: false, tail: false }]],
    gate: ['lizardman_captain', 'Lizardman captain', 'B', { skin: 0x3a6a3a, armor: 0x8a6a2a, trim: 0xd4a93a, cape: 0x1a3a2a, weapon: 'axe', helmet: 'horned', scale: 1.5 },
      [{ at: 0.5, text: 'Lizardman captain kuyruğunu yere vuruyor!' }]] },
  { id: 'golem', zone: 2, block: 4, el: 'fire', weak: 'ice', look: { skin: 0x7a7a7a, armor: 0x5a5a5a, trim: 0x3a3a3a, weapon: 'club', helmet: 'none', armorType: 'plate', rock: true, scale: 1.15 },
    m: [['flame_rock', 'Flame Rock', 'b', { skin: 0x4a3a34, rock: 0xff6a1a, fx: 0xff6a1a }], ['stone_golem', 'Stone golem', 'w', { scale: 1.3 }], ['volcanic_rock', 'Volcanic Rock', 'm', { skin: 0x2a2220, rock: 0xff3a0a, fx: 0xff5a1a }],
        ['giant_rock', 'Giant Rock', 'e', { skin: 0x8a8070, scale: 1.4 }], ['dark_stone', 'Dark stone', 'r', { skin: 0x2a2a34, rock: 0x9a6aff, fx: 0x9a6aff }]],
    gate: ['giant_golem', 'Giant golem', 'B', { skin: 0x6a6a72, rock: 0x6ad8ff, scale: 1.9 }, [{ at: 0.5, text: 'Giant golem çatlaklarından ışık saçıyor!' }]] },
  { id: 'treeghost', zone: 2, block: 5, el: 'poison', weak: 'fire', env: 'forest', look: { skin: 0x5a4030, armor: 0x4a3420, trim: 0x2a3a1a, weapon: 'club', helmet: 'none', bark: 0x3a6a2a, glowEyes: 0xb0ff6a, scale: 1.2, armorType: 'leather' },
    m: [['tree_ghost', 'Tree ghost', 'b'], ['tree_ghost_variant', 'Tree ghost variant', 'w', { bark: 0x6a5a2a, scale: 1.35 }], ['titan_sapling', 'Titan', 'e', { kind: null, skin: 0x9a8a7a, armor: 0x6a5a4a, trim: 0xd4a93a, bark: false, weapon: 'mace', scale: 1.5, armorType: 'plate', glowEyes: 0xffd36a }],
        ['desert_golem', 'Desert Golem', 'm', { skin: 0xc8a070, bark: false, rock: 0xffd36a, fx: 0xffd36a, armorType: 'plate' }]],
    gate: ['tree_ghost_king', 'Tree ghost King', 'B', { bark: 0x2a5a2a, helmet: 'crown', scale: 1.9 }, [{ at: 0.5, text: 'Tree ghost King köklerini topraktan söküyor!' }]] },

  // ---------- 3. bölge: Kızıl Bahar Meydanı (40–60) ----------
  { id: 'sabertooth', zone: 3, block: 1, el: 'bolt', weak: 'ice', look: { kind: 'quad', body: 0xb08a4a, belly: 0xe0c89a, snout: 0.9, tail: 1, ears: 0.5, fangs: 1, scale: 1.05 },
    m: [['smilodon', 'Smilodon', 'b'], ['wild_smilodon', 'Wild smilodon', 'w', { body: 0x9a6a3a, scale: 1.15 }], ['saber_tooth', 'Saber tooth', 'r', { body: 0xd0b07a }], ['machairodus', 'Machirodus', 'm', { body: 0x5a4a3a, eyes: 0x6ad8ff, fx: 0x6ad8ff }]],
    gate: ['meganthereon', 'Meganthereon', 'B', { body: 0x3a2a1a, belly: 0x8a6a4a, eyes: 0xffd36a, scale: 1.55 }, [{ at: 0.5, text: 'Meganthereon dişlerini gösteriyor!' }]] },
  { id: 'troll', zone: 3, block: 2, el: 'ice', weak: 'fire', look: { skin: 0x5a7a6a, armor: 0x4a3a2a, trim: 0x8a8f96, weapon: 'club', helmet: 'none', tusks: true, hair: 0x2a3a2a, scale: 1.3, armorType: 'leather' },
    m: [['troll', 'Troll', 'b'], ['troll_warrior', 'Troll Warrior', 'w', { armor: 0x5a5a5e, weapon: 'axe' }], ['troll_shaman', 'Troll Shaman', 'm', { helmet: 'hood', fx: 0x6ad8ff }], ['troll_witch_doctor', 'Troll Witch-Doctor', 'm', { fx: 0x9dff4a, helmet: 'horned' }],
        ['troll_berserker', 'Troll Berserker', 'r', { skin: 0x7a5a4a, spikes: true }], ['half_troll_warrior', 'Half-Troll Warrior', 'w', { scale: 1.1 }], ['troll_captain', 'Troll Captain', 'e', { cape: 0x5a1a1a, helmet: 'horned' }], ['half_troll_captain', 'Half-Troll Captain', 'e', { scale: 1.15, cape: 0x2a3a5a }]],
    gate: ['troll_king', 'Troll King', 'B', { helmet: 'crown', cape: 0x6a1a1a, trim: 0xd4a93a, scale: 1.85 }, [{ at: 0.5, text: 'Troll King yaralarını kapatıyor!' }]] },
  { id: 'centaur', zone: 3, block: 3, el: 'bolt', weak: 'ice', look: { kind: 'centaur', body: 0x7a5a3a, skin: 0xc89a7a, armor: 0x5a4a3a, hair: 0x3a2a1a, weapon: 'spear', scale: 1.05 },
    m: [['centaur', 'Centaur', 'b'], ['centaur_ranger', 'Centaur ranger', 'w', { armor: 0x6a6a6e, weapon: 'spear' }], ['centaur_archer', 'Centaur archer', 'a', { weapon: 'bow' }], ['centaur_sniper', 'Centaur sniper', 'r', { weapon: 'bow', body: 0x4a3a2a }]],
    gate: ['centaur_captain', 'Centaur captain', 'B', { body: 0x3a2a1a, armor: 0x8a8f96, trim: 0xd4a93a, scale: 1.45 }, [{ at: 0.5, text: 'Centaur captain şahlanıyor!' }]] },
  { id: 'flyer', zone: 3, block: 4, el: 'bolt', weak: 'bolt', look: { kind: 'bird', body: 0x6a4a2a, wing: 0x8a6a4a, beak: 0xd4a93a, scale: 0.9 },
    m: [['falcon', 'Falcon', 'b'], ['crimson_wing', 'Crimson Wing', 'w', { body: 0x8a1a1a, wing: 0xc82a2a, scale: 1.1 }], ['hornet', 'Hornet', 'r', { kind: 'insect', body: 0xe8b020, stripe: 0x1a1a1a, scale: 0.8 }],
        ['harpy', 'Harpy', 'm', { kind: null, skin: 0xd8b8a0, armor: 0x5a3a2a, hair: 0x3a2a1a, weapon: 'staff', helmet: 'none', wings: 0x6a4a2a, longHair: true, fx: 0x6ad8ff }],
        ['raven_harpy', 'Raven Harpy', 'e', { kind: null, skin: 0xb8a0a0, armor: 0x1a1a24, hair: 0x0a0a10, weapon: 'dagger', helmet: 'none', wings: 0x14141c, longHair: true }],
        ['gargoyle', 'Gargoyle', 'w', { kind: null, skin: 0x6a6a72, armor: 0x4a4a52, weapon: 'club', helmet: 'horned', wings: 0x5a5a62, rock: true, glowEyes: 0xff3a3a }]],
    gate: ['harpy_queen', 'Harpy Queen', 'B', { kind: null, skin: 0xe0c0a8, armor: 0x5a1a3a, trim: 0xd4a93a, hair: 0x2a1a1a, weapon: 'staff', helmet: 'crown', wings: 0x8a2a4a, longHair: true, scale: 1.6, fx: 0xff6ad8 },
      [{ at: 0.5, text: 'Harpy Queen çığlığıyla gökyüzünü yırtıyor!' }]] },
  { id: 'beast', zone: 3, block: 5, el: 'ice', weak: 'fire', look: { kind: 'quad', body: 0x6a5a4a, belly: 0x8a7a6a, snout: 0.8, tail: 0.5, ears: 0.9, scale: 1.4 },
    m: [['ape', 'Ape', 'b', { kind: null, skin: 0x4a3a2a, armor: 0x3a2a1a, hair: 0x3a2a1a, weapon: 'club', helmet: 'none', armorType: 'leather', scale: 1.2 }], ['glyptodont', 'Glyptodont', 'w', { shell: 0x7a6a4a, snout: 0.6, scale: 1.3 }],
        ['twin_ape', 'Twin Ape', 'r', { kind: null, skin: 0x5a4a3a, armor: 0x2a1a14, hair: 0x2a1a14, weapon: 'axe', helmet: 'none', armorType: 'leather', scale: 1.25 }], ['stegodon', 'Stegodon', 'e', { tusks: 1, trunk: 1, scale: 1.6 }],
        ['mastodon', 'Mastodon', 'w', { body: 0x5a3a24, tusks: 1.3, trunk: 1, mane: 0x4a2a14, scale: 1.75 }], ['lycan', 'Lycan', 'r', { kind: null, skin: 0x5a5a5a, hair: 0x3a3a3a, armor: 0x2a2a2a, weapon: 'dagger', helmet: 'none', snout: true, ears: true, tail: 0x4a4a4a, armorType: 'leather', glowEyes: 0x6ad8ff }],
        ['loup_garou', 'Loup-garou', 'm', { kind: null, skin: 0x4a3a3a, hair: 0x2a1a1a, armor: 0x2a1a1a, weapon: 'staff', helmet: 'none', snout: true, ears: true, tail: 0x3a2a2a, armorType: 'leather', glowEyes: 0xff3a6a, fx: 0xff3a6a }],
        ['minotaur', 'Minotaur', 'e', { kind: null, skin: 0x6a4a3a, armor: 0x4a3a2a, weapon: 'axe', helmet: 'none', horns: 0xe8e0cc, snout: true, armorType: 'leather', scale: 1.45 }],
        ['leader_of_barbarian', 'Leader of Barbarian', 'e', { kind: null, skin: 0xc8946a, armor: 0x5a3a24, hair: 0x8a3a1a, beard: true, weapon: 'axe', helmet: 'horned', cape: 0x5a1a1a, armorType: 'leather', scale: 1.3 }]],
    gate: ['manticore', 'Manticore', 'B', { body: 0xb0703a, belly: 0xd8a870, mane: 0x7a3a1a, wings: 0x8a4a2a, stingTail: 1, fangs: 1, scale: 1.7 }, [{ at: 0.5, text: 'Manticore kuyruğundaki iğneyi kaldırıyor!' }]] },

  // ---------- 4. bölge: Sisli Çukur (60–80) · Küllerin Tarikatı ----------
  { id: 'spectre', zone: 4, block: 1, el: 'ice', weak: 'fire', look: { skin: 0xc8d8e8, armor: 0x3a4a5a, trim: 0x9ae8ff, weapon: 'scythe', helmet: 'hood', robe: true, ghost: 0x9ae8ff, glowEyes: 0x9ae8ff },
    m: [['ghost', 'Ghost', 'b'], ['ghost_warrior', 'Ghost warrior', 'w', { weapon: 'sword', robe: false, armorType: 'plate' }], ['specter', 'Specter', 'm', { ghost: 0xb08aff, glowEyes: 0xb08aff, fx: 0xb08aff }],
        ['wraith', 'Wraith', 'r', { ghost: 0x6a7a8a, armor: 0x1a1a24 }], ['phantom', 'Phantom', 'b', { ghost: 0xd8e8ff }], ['shadow', 'Shadow', 'r', { ghost: 0x2a2a3a, armor: 0x0a0a10, glowEyes: 0xff3a3a }],
        ['red_ghost', 'Red Ghost', 'm', { ghost: 0xff4a4a, glowEyes: 0xff4a4a, fx: 0xff4a4a }], ['wandering_spectre', 'Wandering Spectre', 'b'], ['shadow_spectre', 'Shadow Spectre', 'e', { ghost: 0x3a3a5a }],
        ['mana_spectre', 'Mana Spectre', 'm', { ghost: 0x6ab0ff, fx: 0x6ab0ff }], ['mage_ghost', 'Mage Ghost', 'm', { weapon: 'staff' }], ['wandering_knight_ghost', 'Wandering Knight Ghost', 'w', { weapon: 'sword', shield: true, robe: false, armorType: 'plate' }]],
    gate: ['mana_predator', 'Mana Predator', 'B', { ghost: 0x4a8aff, glowEyes: 0x4affff, fx: 0x4affff, scale: 1.7 }, [{ at: 0.5, text: 'Mana Predator büyüyü emiyor!' }]] },
  { id: 'darkknight', zone: 4, block: 2, cult: true, el: 'dark', weak: 'bolt', look: { skin: 0x8a8a8a, armor: 0x1c1c22, trim: 0x8a1a1a, cape: 0x14141a, weapon: 'sword', helmet: 'horned', glowEyes: 0xff3a3a, armorType: 'plate' },
    m: [['dark_soldier', 'Dark Soldier', 'b'], ['black_guard', 'Black Guard', 'w', { shield: true }], ['doom_soldier', 'Doom Soldier', 'b', { trim: 0x5a1a8a }], ['dark_knight', 'Dark Knight', 'e'], ['shade_knight', 'Shade Knight', 'r', { ghost: 0x3a3a4a }],
        ['shadow_knight', 'Shadow Knight', 'r', { armor: 0x0a0a10 }], ['dread_knight', 'Dread Knight', 'w', { weapon: 'axe' }], ['doom_knight', 'Doom Knight', 'e', { trim: 0x5a1a8a, weapon: 'scythe' }], ['revenge_knight', 'Revenge Knight', 'm', { weapon: 'staff', fx: 0xff3a3a }]],
    gate: ['death_knight', 'Death knight', 'B', { armor: 0x0e0e14, trim: 0x9ae8ff, glowEyes: 0x9ae8ff, helmet: 'crown', scale: 1.7, fx: 0x9ae8ff }, [{ at: 0.5, text: 'Death knight kılıcına ölüleri çağırıyor!' }]] },
  { id: 'darkmage', zone: 4, block: 3, cult: true, el: 'dark', weak: 'fire', look: { skin: 0xd8c8b8, armor: 0x2a1a3a, trim: 0x9a6aff, weapon: 'staff', helmet: 'hood', robe: true, glowEyes: 0x9a6aff, fx: 0x9a6aff },
    m: [['evil_wizard', 'Evil Wizard', 'm'], ['skeleton_lord', 'Skeleton lord', 'w', { skin: 0xe8e2d0, armorType: 'bones', robe: false, weapon: 'sword', helmet: 'crown' }], ['death_wizard', 'Death Wizard', 'm', { armor: 0x0a0a10, trim: 0x4affff, fx: 0x4affff }],
        ['reaper', 'Reaper', 'r', { weapon: 'scythe', armor: 0x0a0a0a, ghost: 0x2a2a2a }], ['screamer', 'Screamer', 'm', { ghost: 0xd8d8ff, longHair: true }], ['lamentation', 'Lamentation', 'b', { ghost: 0xa8b8d8, longHair: true }]],
    gate: ['lich', 'LICH', 'B', { skin: 0xd8d0b0, armorType: 'bones', armor: 0x1a2a3a, trim: 0x4affff, helmet: 'crown', glowEyes: 0x4affff, fx: 0x4affff, scale: 1.65 }, [{ at: 0.5, text: 'LICH ruh taşını yükseltiyor!' }]] },
  { id: 'mare', zone: 4, block: 4, el: 'fire', weak: 'ice', env: 'graveyard', look: { kind: 'quad', body: 0x1a1418, belly: 0x2a2228, snout: 1.1, tail: 1.1, ears: 0.6, mane: 0xff5a1a, legs: 1.5, eyes: 0xff5a1a, fx: 0xff5a1a, scale: 1.25 },
    m: [['dark_mare', 'Dark Mare', 'b'], ['shade_mare', 'Shade Mare', 'r', { mane: 0x6a6aff, eyes: 0x6a6aff, fx: 0x6a6aff }], ['death_mare', 'Death Mare', 'm', { body: 0xd8d0c0, mane: 0x9ae8ff, eyes: 0x9ae8ff, fx: 0x9ae8ff }], ['dread_mare', 'Dread Mare', 'w', { scale: 1.4 }]],
    gate: ['erlik', null, 'keep'] },   // 4. bloğun kapısı: Mareşal Marven (hikâye bossu, zones.js'te kalır)
  { id: 'serpent', zone: 4, block: 5, el: 'poison', weak: 'ice', look: { kind: 'serpent', body: 0x3a6a4a, belly: 0xc8b87a, skin: 0xb8c8a0, armor: 0x2a4a3a, hair: 0x1a2a1a, weapon: 'spear', scale: 1.1 },
    m: [['lamia', 'Lamia', 'm', { weapon: 'staff', fx: 0x9dff4a }], ['nightmare', 'Nightmare', 'r', { kind: 'quad', body: 0x0a0a10, belly: 0x1a1a24, snout: 1.1, tail: 1.1, ears: 0.6, mane: 0x9a3aff, legs: 1.5, eyes: 0x9a3aff, fx: 0x9a3aff }],
        ['dragon_servant', 'Dragon Servant', 'b', { kind: null, skin: 0x8a3a2a, armor: 0x3a1a14, trim: 0xd4a93a, weapon: 'spear', helmet: 'horned', snout: true, tail: 0x8a3a2a, armorType: 'leather' }],
        ['dragon_knight', 'Dragon Knight', 'w', { kind: null, skin: 0x6a2a1a, armor: 0x3a3a42, trim: 0xd4a93a, weapon: 'sword', shield: true, helmet: 'horned', snout: true, tail: 0x6a2a1a, armorType: 'plate', wings: 0x5a1a14 }],
        ['snake_queen', 'Snake Queen', 'e', { body: 0x1a4a3a, belly: 0xe0c070, armor: 0x5a1a3a, weapon: 'staff', fx: 0x9dff4a, scale: 1.3 }]],
    gate: ['bozdag', null, 'keep'] },  // 5. bloğun kapısı: Adsız, Tarikat Lideri (hikâye bossu)
];
// Dünya bossları (kapısı yok): zindan ve etkinliklerin boss havuzuna girer (zones.js allBosses). Ejderhalar en güçlüdür.
export const WORLD_BOSSES = [
  ['red_dragon_hatchling', 'Red Dragon Hatchling', 3, { kind: 'dragon', body: 0xa82a1a, belly: 0xe0a060, wing: 0x8a1a10, eyes: 0xffd36a, fx: 0xff6a1a, scale: 1.2 }, 'fire'],
  ['bone_dragon', 'Bone Dragon', 4, { kind: 'dragon', body: 0xe0d8c0, belly: 0xc8c0a8, wing: 0xb0a890, eyes: 0x4affff, fx: 0x4affff, bones: 1, scale: 1.7 }, 'ice'],
  ['blue_dragon', 'Blue dragon', 4, { kind: 'dragon', body: 0x2a5aa8, belly: 0x9ac8e8, wing: 0x1a3a7a, eyes: 0xffffff, fx: 0x6ad8ff, scale: 1.8 }, 'ice'],
  ['dark_dragon', 'Dark Dragon', 4, { kind: 'dragon', body: 0x1a1420, belly: 0x4a3a5a, wing: 0x0a0a14, eyes: 0xb05aff, fx: 0xb05aff, scale: 1.9 }, 'dark'],
  ['gold_dragon', 'Gold Dragon', 4, { kind: 'dragon', body: 0xc8a030, belly: 0xf0e0a0, wing: 0xa07a20, eyes: 0xffffff, fx: 0xffe08a, scale: 1.95 }, 'bolt'],
  ['red_dragon', 'Red Dragon', 4, { kind: 'dragon', body: 0x8a1a10, belly: 0xd88a50, wing: 0x5a0a08, eyes: 0xffd36a, fx: 0xff5a1a, scale: 2.05 }, 'fire'],
];
// Kemikli Koru (öğretici ormanı): en zayıf canavarlar
export const FOREST_MOBS = ['rabbit', 'small_bandicoot', 'wood_leech'];
const EXTRA = { rabbit: ['Rabbit', 1, 'b', { kind: 'quad', body: 0xc8b8a0, belly: 0xf0e8e0, snout: 0.5, tail: 0.3, ears: 1.6, scale: 0.4 }, 'fire'] };

const WEAK_EL = { fire: 'fire', ice: 'ice', bolt: 'bolt', poison: 'fire', dark: 'bolt' };
export const BEAST_KINDS = ['quad', 'spider', 'scorpion', 'bird', 'insect', 'centaur', 'serpent', 'dragon'];
const isBeast = L => BEAST_KINDS.includes(L.kind);
// FAMILIES → MOBS kayıtları ve bölge blokları. uniquesByGate: boss kimliği → eşsiz eşyaları (zones.js eski bosslardan aktarır)
// Görünen adlar Türkçe (İngilizcesi i18n/en-content.js sözlüğünde; kaynak ad tablolardaki İngilizce ad).
export const TR_NAME = {"Small bandicoot": "Küçük Bandikut", "Bandicoot": "Bandikut", "Wild Bandicoot": "Yaban Bandikut", "Rabid Bandicoot": "Kuduz Bandikut", "Scavenger Bandicoot": "Leşçil Bandikut", "Cannibal Bandicoot": "Yamyam Bandikut", "Worm": "Solucan", "Earth worm": "Toprak Solucanı", "Blood worm": "Kan Solucanı", "Cave leech": "Mağara Sülüğü", "Wood Leech": "Orman Sülüğü", "Snatcher": "Kapkaççı", "Goblin": "Goblin", "GOBLIN bouncer": "Goblin Fedai", "Goblin Necromancer": "Goblin Ölücü", "KOBOLD": "Kobold", "GOBLIN juggler": "Goblin Hokkabaz", "BUGBEAR": "Öcü", "HOBGOBLIN": "Hobgoblin", "Skeleton": "İskelet", "Skeleton warrior": "İskelet Savaşçı", "Burning Skeleton": "Yanan İskelet", "Skeleton knight": "İskelet Şövalye", "Skeleton champion": "İskelet Er Başı", "Dire wolf": "Azman Kurt", "Wolfhound": "Kurt Tazısı", "Gloom hound": "Kasvet Tazısı", "Hell hound": "Cehennem Tazısı", "Werewolf": "Kurtadam", "Tarantula": "Tarantula", "Pincers scorpion": "Kıskaçlı Akrep", "Black widow": "Karadul", "Scorpion": "Akrep", "Paralyzer": "Uyuşturan", "Stinger": "İğneli", "Man Eating Tarantula": "Yamyam Tarantula", "Zombie": "Zombi", "Undying": "Ölmeyen", "Rotten Eyes": "Çürük Göz", "Decayed Zombie": "Çürümüş Zombi", "Ash knight": "Kül Şövalye", "Lizardman": "Kertenkele Adam", "Lizardman warrior": "Kertenkele Savaşçı", "Mudman": "Çamur Adam", "Sand Man": "Kum Adam", "Lizardman captain": "Kertenkele Yüzbaşı", "Flame Rock": "Alev Kayası", "Stone golem": "Taş Golem", "Volcanic Rock": "Volkan Kayası", "Giant Rock": "Dev Kaya", "Dark stone": "Kara Taş", "Giant golem": "Dev Golem", "Tree ghost": "Ağaç Hayaleti", "Tree ghost variant": "Kara Ağaç Hayaleti", "Titan": "Titan", "Desert Golem": "Çöl Golemi", "Tree ghost King": "Ağaç Hayaleti Kralı", "Smilodon": "Smilodon", "Wild smilodon": "Yaban Smilodon", "Saber tooth": "Kılıç Diş", "Machirodus": "Mahirodus", "Meganthereon": "Megantereon", "Troll": "Trol", "Troll Warrior": "Trol Savaşçı", "Troll Shaman": "Trol Kamı", "Troll Witch-Doctor": "Trol Otacısı", "Troll Berserker": "Trol Gözü Dönmüş", "Half-Troll Warrior": "Yarı Trol Savaşçı", "Troll Captain": "Trol Yüzbaşı", "Half-Troll Captain": "Yarı Trol Yüzbaşı", "Troll King": "Trol Kralı", "Centaur": "Sentor", "Centaur ranger": "Sentor İzci", "Centaur archer": "Sentor Okçu", "Centaur sniper": "Sentor Keskin Nişancı", "Centaur captain": "Sentor Yüzbaşı", "Falcon": "Doğan", "Crimson Wing": "Al Kanat", "Hornet": "Eşek Arısı", "Harpy": "Harpi", "Raven Harpy": "Kuzgun Harpi", "Gargoyle": "Gargoyl", "Harpy Queen": "Harpi Kraliçesi", "Ape": "Maymun", "Glyptodont": "Gliptodon", "Twin Ape": "İkiz Maymun", "Stegodon": "Stegodon", "Mastodon": "Mastodon", "Lycan": "Likan", "Loup-garou": "Kurt Kılıklı", "Minotaur": "Minotor", "Leader of Barbarian": "Barbar Önderi", "Manticore": "Mantikor", "Ghost": "Hayalet", "Ghost warrior": "Hayalet Savaşçı", "Specter": "Hortlak", "Wraith": "Gölge Ruh", "Phantom": "Hayal", "Shadow": "Gölge", "Red Ghost": "Kızıl Hayalet", "Wandering Spectre": "Gezgin Hortlak", "Shadow Spectre": "Gölge Hortlak", "Mana Spectre": "Mana Hortlağı", "Mage Ghost": "Büyücü Hayalet", "Wandering Knight Ghost": "Gezgin Şövalye Hayaleti", "Mana Predator": "Mana Avcısı", "Dark Soldier": "Kara Asker", "Black Guard": "Kara Muhafız", "Doom Soldier": "Kıyamet Askeri", "Dark Knight": "Kara Şövalye", "Shade Knight": "Gölge Şövalye", "Shadow Knight": "Karanlık Şövalye", "Dread Knight": "Dehşet Şövalyesi", "Doom Knight": "Kıyamet Şövalyesi", "Revenge Knight": "İntikam Şövalyesi", "Death knight": "Ölüm Şövalyesi", "Evil Wizard": "Kötü Büyücü", "Skeleton lord": "İskelet Bey", "Death Wizard": "Ölüm Büyücüsü", "Reaper": "Orakçı", "Screamer": "Çığlıkçı", "Lamentation": "Ağıtçı", "LICH": "Liç", "Dark Mare": "Kara Kısrak", "Shade Mare": "Gölge Kısrak", "Death Mare": "Ölüm Kısrağı", "Dread Mare": "Dehşet Kısrağı", "Nightmare": "Karabasan", "Lamia": "Lamia", "Dragon Servant": "Ejder Hizmetkârı", "Dragon Knight": "Ejder Şövalyesi", "Snake Queen": "Yılan Kraliçe", "Red Dragon Hatchling": "Kızıl Ejder Yavrusu", "Bone Dragon": "Kemik Ejder", "Blue dragon": "Mavi Ejder", "Dark Dragon": "Kara Ejder", "Gold Dragon": "Altın Ejder", "Red Dragon": "Kızıl Ejder", "Rabbit": "Tavşan"};

export function buildBestiary(uniquesByGate = {}) {
  const mobs = {}, blocks = {};
  const make = (id, name, role, look, zone, el, weak, extra = {}) => {
    name = TR_NAME[name] || name;
    const R = ROLE[role];
    let L = { ...look };
    if (L.kind == null) delete L.kind;
    if (!L.kind) L = { ...(ROLE_LOOK[role] || {}), ...L };                       // insansı: rol görünüşü, üyenin kendi değerleri önce gelir
    else if (!L.weapon) L.weapon = role === 'm' ? 'staff' : role === 'a' ? 'bow' : L.kind === 'worm' ? 'club' : 'dagger'; // savaşta silah sınıfı (mobClass)
    const skills = isBeast(L) && role === 'a' && L.kind !== 'centaur' ? SKILLS.r() : SKILLS[role](el);
    mobs[id] = { name, zone, ...(role === 'c' ? { captain: true } : role === 'B' ? { boss: true, uniques: uniquesByGate[id] || [] } : {}),
      k: { ...R.k }, spd: R.spd, crit: R.crit, weak: weak || WEAK_EL[el] || 'fire', skills, look: L, ...extra };
  };
  const sized = (base, over, role) => ({ ...base, ...over, scale: over.scale || (base.scale || 1) * SCALE[role] });
  for (const F of FAMILIES) {
    const ids = [], roleOf = {};
    const cx = F.cult ? { cult: true } : {}; // Küllerin Tarikatı ailesi
    for (const [id, name, role, over = {}] of F.m) { make(id, name, role, sized(F.look, over, role), F.zone, F.el, F.weak, cx); ids.push(id); roleOf[id] = role; }
    const [gid, gname, grole, gover = {}, phases] = F.gate;
    if (grole !== 'keep') make(gid, gname, grole, sized(F.look, gover, grole), F.zone, F.el, F.weak, phases ? { phases, ...cx } : cx);
    const pick = (...rs) => { for (const r of rs) { const id = ids.find(i => roleOf[i] === r); if (id) return id; } return ids[0]; };
    const b = pick('b'), w = pick('w', 'e'), m = pick('m', 'a', 'r');
    blocks[`${F.zone}-${F.block}`] = { fam: F.id, b, w, m, x: ids.filter(id => id !== b && id !== w && id !== m), all: ids, gate: gid, env: F.env, bossEnv: F.bossEnv };
  }
  for (const [id, name, zone, look, el] of WORLD_BOSSES)
    make(id, name, 'B', look, zone, el, null, { world: true, k: { hp: 26 + 4 * zone, atk: 1.5, def: 1.4 }, phases: [{ at: 0.5, text: `${name} kanatlarını açıyor!` }] });
  for (const [id, [name, zone, role, look, el]] of Object.entries(EXTRA)) make(id, name, role, look, zone, el, null);
  return { mobs, blocks };
}
