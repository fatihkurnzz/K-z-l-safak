// Eşya varyantları (esya3): aynı tür ve kademede asıl tabanın yanına gelen ek adlar. Adlar kullanıcının listesinden telif
// taramasını geçmiş güvenli adlardır, birebir. Statlar asıl tabanın formülünden gelir; varyant yalnızca küçük bir eğilim taşır
// (items.js: LEAN). Taban kimliği: silah "w:<tür>:<kademe>:<n>", zırh "a:<sınıf>:<kademe>:<parça>:<n>", takı "j:<tür>:<kademe>:<n>"
// (n = 1'den başlayan sıra). SIRA DEĞİŞMEZ, yalnızca sona eklenir: kayıtlardaki eşyalar bu kimlikleri taşır.
// Kademe ve eğilim sırası listedeki sayılardan yalnızca SIRALAMA için çıkarıldı; sayılar kopyalanmadı.
// Üretim: scratchpad v12/esya3/gen.mjs
export const W_VAR = {
  spear: { 0: [['Spike', 'hiz']] },
  mace: { 0: [['Training Mace', 'guc'], ['Morning Star', 'kritik'], ['Priest Maul', 'hiz']], 1: [['Hero Mace', 'guc'], ['Priest Mace', 'kritik'], ['Priest Morning Star', 'hiz']], 2: [['Novice Paladin Mace', 'guc'], ['Spiked Club', 'hiz'], ['Priest Iron Star', 'kritik']], 3: [['Priest Breaker', 'delme'], ['Priest War Hammer', 'kritik'], ['Priest Spike Club', 'hiz']], 4: [['Mace of Novice Paladin', 'guc'], ['Bone Breaker', 'kritik'], ['Priest Hacker', 'hiz']], 5: [['Priest Cracker', 'hiz']], 6: [['Priest Bone crasher', 'delme']], 7: [['Priest Impact', 'kritik']] },
  sword2: { 0: [['Training Warrior\'s Two-Handed Sword', 'guc'], ['Two-Handed Training Sword', 'kritik'], ['Combined Blade', 'hiz']], 1: [['Hero Sword', 'guc']], 2: [['War Sword', 'kritik']], 3: [['Two-handed Sword of Novice', 'guc'], ['Giant Sword', 'kritik']], 7: [['Mirage', 'guc']] },
  dagger: { 0: [['Training Knife', 'guc'], ['Practice Dagger', 'hiz']], 1: [['Dirk', 'kritik']], 3: [['Dagger of Novice Assassin', 'guc']] },
  staff: { 0: [['Training Staff', 'guc'], ['Orc Staff', 'kritik'], ['Wooden Staff', 'hiz']], 2: [['Horned Staff', 'hiz']], 3: [['Staff of Novice Rudimentary Magic', 'guc'], ['Novice Evil Sage Staff', 'delme']], 5: [['Eerie Skull Cane', 'guc']], 6: [['Monk\'s Staff of Destruction', 'guc'], ['Viper Staff', 'delme']], 7: [['Oasis Staff', 'kritik']] },
  shield: { 6: [['Sacred Defender', 'siper'], ['Round Kite Shield', 'govde']], 7: [['Hidden Secret Holy Shield', 'siper'], ['Defender of the Lord', 'direnc'], ['Sacred Shield', 'govde']] },
  sword: { 0: [['Short Blade', 'guc']], 3: [['Sword of Novice Mercenary', 'guc']], 5: [['Skeleton Sword', 'kritik']] },
  axe1: { 1: [['Wood Cutter', 'kritik']], 2: [['Large Axe', 'hiz']], 3: [['Warrior Axe', 'delme']], 6: [['Wrist Cutter', 'delme']] },
  axe2: { 1: [['Lumber Axe', 'hiz']] },
  mace2: { 0: [['Giant Maul', 'hiz']], 3: [['Giant Morning Star', 'hiz']], 7: [['Hell Breaker', 'delme']] },
  lance: { 0: [['Spear Axe', 'kritik'], ['Pole Axe', 'guc']] }, // Pole Axe: kademe adı Raptor olunca varyanta taşındı (sona eklendi)
  xbow: { 4: [['Bow of Novice Assassin', 'guc']] },
};
// Ek zırh setleri: [set adı, [Baş, Gövde, Bacak, El, Ayak], eğilim]. Set bonusu kademe ve sınıftan gelir (asıl setle aynı tablo);
// parçaları aynı kademenin asıl setiyle birlikte sayılır (items.js setsOf).
export const A_VAR = {
  warrior: {
    2: [['Training warriors\'', ['Training warriors\' Helmet', 'Training warriors\' Pauldron', 'Training warriors\' Pants', 'Training warriors\' Gauntlets', 'Training warriors\' Boots'], 'govde']],
    3: [['Skilled Warrior\'s', ['Skilled Warrior\'s Helmet', 'Skilled Warrior\'s Pauldron', 'Skilled Warrior\'s Pants', 'Skilled Warrior\'s Gauntlets', 'Skilled Warrior\'s Boots'], 'siper']],
    7: [['Subjugation Force\'s', ['Subjugation Force\'s Hat', 'Subjugation Force\'s Pauldron', 'Subjugation Force\'s Pants', 'Subjugation Force\'s Gloves', 'Subjugation Force\'s Shoes'], 'cevik']],
  },
  rogue: {
    3: [['Novice Mercenary', ['Helmet of Novice Mercenary', 'Pauldron of Novice Mercenary', 'Pads of Novice Mercenary', 'Gauntlets of Novice Mercenary', 'Boots of Novice Mercenary'], 'cevik']],
  },
  mage: {
    1: [['Novice Magician\'s', ['Novice Magician\'s Helmet', 'Novice Magician\'s Robe', 'Novice Magician\'s Pants', 'Novice Magician\'s Gauntlets', 'Novice Magician\'s Boots'], 'govde']],
    2: [['Training Magician\'s', ['Training Magician\'s Helmet', 'Training Magician\'s Robe', 'Training Magician\'s Pants', 'Training Magician\'s Gauntlets', 'Training Magician\'s Boots'], 'siper']],
    3: [['Skilled Magician\'s', ['Skilled Magician\'s Helmet', 'Skilled Magician\'s Robe', 'Skilled Magician\'s Pants', 'Skilled Magician\'s Gauntlets', 'Skilled Magician\'s Boots'], 'cevik']],
    4: [['Novice Rudimentary Magic', ['Helmet of Novice Rudimentary Magic', 'Robe of Novice Rudimentary Magic', 'Pants of of Novice Rudimentary Magic', 'Gauntlets of Novice Rudimentary', 'Boots of Novice Rudimentary Magic'], 'govde']],
  },
  priest: {
    1: [['Novice Priest\'s', ['Novice Priest\'s Helmet', 'Novice Priest\'s Pauldron', 'Novice Priest\'s Pants', 'Novice Priest\'s Gauntlets', 'Novice Priest\'s Boots'], 'siper']],
    2: [['Training Priest\'s', ['Training Priest\'s Helmet', 'Training Priest\'s Pauldron', 'Training Priest\'s Pants', 'Training Priest\'s Gauntlets', 'Training Priest\'s Boots'], 'govde']],
    3: [['Skilled Priest\'s', ['Skilled Priest\'s Helmet', 'Skilled Priest\'s Pauldron', 'Skilled Priest\'s Pants', 'Skilled Priest\'s Gauntlets', 'Skilled Priest\'s Boots'], 'cevik']],
    4: [['Novice Paladin', ['Helmet of Novice Paladin', 'Pauldron of Novice Paladin', 'Pads of Novice Paladin', 'Gauntlets of Novice Paladin', 'Boots of Novice Paladin'], 'siper']],
  },
};
export const J_VAR = {
  ear: { 1: [['Mage Earring', 'mag'], ['Mercenary Earring', 'atk']], 2: [['Assassin Earring', 'crit'], ['Priest Earring', 'hp']], 3: [['White Silver Earring', 'def']], 4: [['Grand Mage Earring', 'mag']], 5: [['Warrior\'s Earring', 'atk']], 6: [['Rogue\'s Earring', 'crit']], 7: [['Priest\'s Earring', 'hp']] },
  neck: { 0: [['Cleric Pendant', 'mag']], 1: [['Necklace of Life', 'hp']], 2: [['Elemental Necklace', 'mag'], ['Strength Necklace', 'atk']], 3: [['Agility Necklace', 'crit'], ['Health Necklace', 'hp']], 4: [['Intelligence Necklace', 'mag'], ['Warrior Pendant', 'atk']], 5: [['Curse Necklace', 'crit'], ['Elemental Pendant', 'mag']], 6: [['Priest Pendant', 'hp'], ['Goddess Necklace', 'def']], 7: [['Necklace of the Lost One', 'crit']] },
  ring: { 0: [['Messenger Ring', 'hp']], 1: [['Mercenary Ring', 'atk'], ['Assassin Ring', 'crit']], 2: [['Priest Ring', 'hp']], 3: [['Ring of Purity', 'def']], 4: [['Crystal Ring', 'mag']], 5: [['Ring of Life', 'hp']], 6: [['Grand Flame Ring', 'atk']] },
  belt: { 2: [['Mana Belt', 'mag']], 3: [['Curse Belt', 'crit']], 5: [['Intelligence Belt', 'mag']], 6: [['Holy Ghost Belt', 'hp']] },
};
