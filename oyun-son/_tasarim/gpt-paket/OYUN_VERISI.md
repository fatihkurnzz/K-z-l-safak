# OYUN VERİSİ (kaynak koddan otomatik çıkarıldı, 20.11.2026)

Bu dosya `shared/*.js` dosyalarından üretildi. Görsel üretirken buradaki adları, türleri ve sayıları esas al; olmayan bir eşya, yetenek ya da yaratık ekleme.

## Halklar (kodda `ocak` = Kragmir, `sancak` = Elentha)
- **Kragmir** (`ocak`): Dağın kalbindeki salonlarda örs başında büyüyen orklar; Kral Volgar Demirdiş’in halkı. Slogan: “Toprak, çekice boyun eğer.”
- **Elentha** (`sancak`): Beyaz taştan kuleleri ve mavi sancaklarıyla ovanın insan krallığı; Kral Edran’ın halkı. Slogan: “Çelik bile bir gün paslanır.”

## Para birimleri
- Akçe (`akce`): Temel para: savaş, satış.
- Örs Tozu (`toz`): Parçalanan eşyadan çıkar; bileği taşı üretir.
- Külçe (`kulce`): Pazar parası (Faz 2).
- Yakut (`yakut`): Premium para (Faz 2).
- Şan (`san`): Arena puanı (Faz 2).

## Nitelikler
- Güç (`str`): Savaşçı ve Rahibe saldırı. Öbür sınıflara etkisi yok.
- Dayanıklılık (`vit`): Bütün sınıflara azami can (ve biraz savunma).
- Çeviklik (`dex`): Yalnız Suikastçıya: saldırı, hız ve kritik. Öbür sınıflara etkisi yok.
- Zekâ (`int`): Bütün sınıflara mana; Rahibe ayrıca büyü gücü.
- Büyü Gücü (`mp`): Yalnız Büyücüye: büyü saldırısı.

## Sınıflar ve yetenek dalları
- **Savaşçı** (`warrior`): Ön hat: tank ya da ağır vuruş. Zırh: plate. Silah: sword, axe2, shield. Dallar: Hücum, Siper, Öfke
- **Suikastçı** (`rogue`): Hız ve tek hedef hasarı. Zırh: leather. Silah: dagger, bow. Dallar: Hançer, Yay, İz
- **Şifacı** (`priest`): Şifa, rün mührü ve kara rün. Zırh: chain. Silah: mace, shield. Dallar: Şifa, Rün Mührü, Kara Rün
- **Büyücü** (`mage`): Alan hasarı ve kontrol. Zırh: robe. Silah: staff. Dallar: Ateş, Buz, Yıldırım

## Yetenekler (dala göre)
- **Hücum** (Savaşçı): Dengeli hasar ve zırh kırma. → Hash, Hoodwink, Shear, Pierce, Leg Cutting, Carving, Sever, Prick, Multiple Shock, Cleave, Mangling, Thrust, Sword Aura, Sword Dancing
- **Siper** (Savaşçı): Tehdit çekme, kalkan ve savunma. → Hinder, Resist, Arrest, Endure, Binding, Bulwark, Provoke, Sacrifice
- **Öfke** (Savaşçı): Savunmadan verip hasara yüklenir. → Gain, Wink, Rise, Pain Killer, Outrage, Shock
- **Hançer** (Suikastçı): Tek hedefi eriten kritik vuruşlar. → Stab, Stab2, Jab, Blood Drain, Pierce, Shock, Thrust, Cut, Vampiric Touch, Bloody Beast, Blinding, Beast Hiding, Spike
- **Yay** (Suikastçı): Çoklu hedef ve delici oklar. → Archery, Arrow Shower, Fire Arrow, Poison Arrow, Multiple Shot, Guided Arrow, Perfect Shot, Ice Arrow, Arc Shot, Explosive Shot, Viper, Counter Strike, Shadow Shot
- **İz** (Suikastçı): Hız, kendini iyileştirme, sabotaj. → Hide, Light Feet, Evade, Safety, Scaled Skin, Minor Healing, Lupine Eyes, Taunt, Invisibility
- **Şifa** (Şifacı): İyileştirme ve diriltme. → Minor Heal, Heal, Cure Curse, Greater Heal, Restore, Group Heal, Complete Heal, Group Complete Heal
- **Rün Mührü** (Şifacı): Güç ve dayanıklılık veren rün sözleri. → Strength, Armor, Grace, Resist, Heapness, Superioris, Imposingness, Undying, Massiveness, Mace Strike, Crushing Blow, Shock Wave, Iron Skin, Steel Skin, Holy Bulwark
- **Kara Rün** (Şifacı): Düşmanı zayıflatan kara rünler. → Holy Strike, Slow, Malice, Confusion, Parasite, Weaken, Dispel, Sleep, Helis, Torment, Atak Kır, Dark Strike, Shadow Blast, Curse Wave
- **Ateş** (Büyücü): En yüksek alan hasarı ve yanık. → Flame Strike, Fire Ball, Burn, Fire Spear, Fire Blast, Hell Fire, Pillar of Fire, Fire Thorn, Fire Impact, Flame Nova, Fire Staff, Fire Wall, Meteor Fall
- **Buz** (Büyücü): Yavaşlatma ve dondurma. → Freeze, Chill, Solid, Ice Arrow, Glacier Beam, Frostbite, Ice Comet, Glacier Nova
- **Yıldırım** (Büyücü): Kritik hasar ve sersemletme. → Lightning, Shock, Charge, Lightning Bolt, Counter Spell, Static Hemisphere, Paralyze, Thunder, Static Thorn, Lightning Nova, Chain Lightning, Thunder Blast, Thunder Impact
- Diğer (temel saldırı, canavar yetenekleri vb., 69 adet): Kılıç Darbesi, Hançer Darbesi, Topuz Darbesi, Kıvılcım, Stroke, Sprint, Slash, Crash, Defense, Piercing, Howling Sword, Blooding, Hell Blade, Iron Skin, Wall Of Iron, Iron Body, Stab, Sprint, Thrust, Critical Point, Cold Wave, Eskrima, Power Shot, Blinding Strafe, Super Archer, Holy Attack, Sprint, Collision, Resurrection, Blessing of Light, Divine Guard, Curse of Ruin, Dark Pact, Staff Attack, Sprint, Staff Mastery, Inferno, Dragon Tooth, Blizzard, Arc Lightning, Saldırı, Kara Kıvılcım, Pusu, Bataklık Bedduası, Çamur Merhemi, Ezici Darbe, Yer Sarsıntısı, Kemik Siperi, Akın Çığlığı, Geniş Savuruş, Mezar Soğuğu, Sazlık Fırtınası, Bey Yumruğu, Ok, Ok Sağanağı, Nişanlı Atış, Kor Topu, Lav Dalgası, Kül Fırtınası, Ayaz Oku, Buz Kesen, Yayla Tipisi, Kan Öfkesi, Can Sömüren, Tuğ Gölgesi, Ata Rünü, Kem Göz, Kelle Alan, Yıldıran Nara

## Ekipman yuvaları
Sağ El (`wr`) · Sol El (`wl`) · Baş (`helm`) · Gövde (`chest`) · Bacak (`legs`) · El (`gloves`) · Ayak (`boots`) · Küpe (`ear1`) · Küpe (`ear2`) · Kolye (`neck`) · Yüzük (`ring1`) · Yüzük (`ring2`) · Kemer (`belt`)

## Eşya dereceleri
Standart (#b9c0c8) · Nadir (#4aa3ff) · Eşsiz (#ffb52e)

Not: Oyundaki gerçek dereceler bunlardır. KONSEPT_BRIEF'teki 6 nadirlik rengi görsel dildir; eşleme Claude tarafından yapılacak.

## Malzeme kademeleri (seviye şartı · malzeme · taş)
Sv.1 Paslı / Bakır · Sv.10 Demir / Pirinç · Sv.20 Çelik / Gümüş · Sv.30 Dövme / Akik · Sv.40 Kızıl / Altın · Sv.50 Tunç / Zümrüt · Sv.60 Kara / Safir · Sv.63 Efsunlu / Elmas

## Silah türleri ve her kademenin adı (8 kademe, soldan sağa güçlenir)
- **Kılıç** (`sword`, tek el; sınıf: Savaşçı): Short Sword, Long Sword, Scimitar, Sabre, Rapier, Crescent, Blade, Slayer
- **Balta** (`axe1`, tek el; sınıf: Savaşçı): Stone Axe, Hand Axe, Double Axe, Bipennis, Military Pick, Cleaver Axe, Tomahawk, Deep Scar
- **Çift El Kılıç** (`sword2`, çift el; sınıf: Savaşçı): Bastard Sword, Two-Handed Sword, Battle Sword, Great Sword, Claymore, Flamberge, Double Blade, Destroyer
- **Çift El Balta** (`axe2`, çift el; sınıf: Savaşçı): Battle Axe, Timber Axe, Twin Axe, Great Axe, Broad Axe, Bone Axe, Bone Cleaver, Blade Axe
- **Mızrak** (`spear`, çift el; sınıf: Savaşçı): Spear, Cross Spear, Spetum, Long Spear, Pike, Trident, Harpoon, Totemic Spear
- **Uzun Mızrak** (`lance`, çift el; sınıf: Savaşçı): Raptor, Battle Scythe, War Scythe, Grim Scythe, Bill, Halberd, Bardish, Glaive
- **Çift El Topuz** (`mace2`, çift el; sınıf: Savaşçı): Great Maul, Battle Mace, War Club, Great Mace, Weight Hammer, Large Breaker, Large Hacker, Iron Impact
- **Hançer** (`dagger`, tek el; sınıf: Suikastçı): Dagger, Knife, Stiletto, Assassin Dagger, Sword breaker, Kukry, Mirage Dagger, Shard
- **Jamadar** (`jamadar`, tek el; sınıf: Suikastçı): , Jamadar, Half moon Jamadar, Ripper's Jamadar, Wind storm, Abyss Jamadar, Blood finger, True silver
- **Yay** (`bow`, çift el; sınıf: Suikastçı): Training Bow, Bow, Short Bow, Bamboo Bow, Hunter's Bow, Composite Bow, Horn Bow, Iron Bow
- **Arbalet** (`xbow`, çift el; sınıf: Suikastçı): , , , , Crossbow, Cross Bow, Horn Crossbow, Iron Crossbow
- **Topuz** (`mace`, tek el; sınıf: Şifacı): Maul, Mace, War Hammer, Breaker, Hacker, Cracker, Bone Crasher, Impact
- **Asa** (`staff`, çift el; sınıf: Büyücü): Wood Staff, Wizard Staff, Bone Staff, Mage Staff, Alchemy Staff, Elemental Staff, Salamander Staff, Elixir Staff
- **Kalkan** (`shield`, tek el; sınıf: Savaşçı/Şifacı): Wooden Shield, Small Shield, Round Shield, Large Shield, Kite Shield, Octagon Shield, Large Kite Shield, Plate Shield

## Elementler
Ateş · Buz · Yıldırım (+ şifa, Rün Mührü, Kara Rün yetenek renkleri)

## Bölgeler
- **Vahran Ovası** (Sv. 1–20, ortam: forest): Üç yüz yıldır kanla sulanan ova. Uzun otun altında kırık mızraklar ve unutulmuş kemikler; yaban sürüleri, goblinler, iskeletler ve kurtlar.
- **Kül Geçidi** (Sv. 20–40, ortam: castle): Sönmüş yanardağın eteğindeki dar geçit. Akrepler, zombiler, kertenkele adamlar, ateşli kayalar ve ağaç hayaletleri; yerde hiçbir ateşe ait olmayan ince gri kül.
- **Kızıl Bahar Meydanı** (Sv. 40–60, ortam: arena): Kızıl Bahar’da iki ordunun çarpıştığı alan; o yıl burada çiçek açmadı. Kılıç dişli kediler, troller, sentorlar, harpiler ve dev yaratıklar; ölülerin başında eğilen gri gölgeler.
- **Sisli Çukur** (Sv. 60–65, ortam: shrine): Ovanın kuzeyinde, eski bir muharebenin kemikleriyle dolu sisli çukur. Hayaletler, kara şövalyeler, ölü büyücüler ve kâbus atları; ateşsiz kazanın çevresinde Küllerin Tarikatı toplanır.

## Bosslar ve adlı yaratıklar
- **Dev Solucan** (bölge 1, zayıflık: fire; görünüm türü: worm)
- **Mareşal Marven** (bölge 4, zayıflık: fire; görünüm türü: -)
- **Adsız, Tarikat Lideri** (bölge 4, zayıflık: fire; görünüm türü: -)
- **Tepegöz** (bölge 1, zayıflık: bolt; görünüm türü: -)
- **Lav Yürek** (bölge 4, zayıflık: ice; görünüm türü: -)
- **Kül Ağası Karadun** (bölge 1, zayıflık: ice; görünüm türü: -)
- **Kurtadam** (bölge 1, zayıflık: fire; görünüm türü: -)
- **Kertenkele Yüzbaşı** (bölge 2, zayıflık: ice; görünüm türü: -)
- **Dev Golem** (bölge 2, zayıflık: ice; görünüm türü: -)
- **Ağaç Hayaleti Kralı** (bölge 2, zayıflık: fire; görünüm türü: -)
- **Megantereon** (bölge 3, zayıflık: ice; görünüm türü: quad)
- **Trol Kralı** (bölge 3, zayıflık: fire; görünüm türü: -)
- **Sentor Yüzbaşı** (bölge 3, zayıflık: ice; görünüm türü: centaur)
- **Harpi Kraliçesi** (bölge 3, zayıflık: bolt; görünüm türü: -)
- **Mantikor** (bölge 3, zayıflık: fire; görünüm türü: quad)
- **Mana Avcısı** (bölge 4, zayıflık: fire; görünüm türü: -)
- **Ölüm Şövalyesi** (bölge 4, zayıflık: bolt; görünüm türü: -)
- **Liç** (bölge 4, zayıflık: fire; görünüm türü: -)
- **Kızıl Ejder Yavrusu** (bölge 3, zayıflık: fire; görünüm türü: dragon)
- **Kemik Ejder** (bölge 4, zayıflık: ice; görünüm türü: dragon)
- **Mavi Ejder** (bölge 4, zayıflık: ice; görünüm türü: dragon)
- **Kara Ejder** (bölge 4, zayıflık: bolt; görünüm türü: dragon)
- **Altın Ejder** (bölge 4, zayıflık: bolt; görünüm türü: dragon)
- **Kızıl Ejder** (bölge 4, zayıflık: fire; görünüm türü: dragon)

## Normal yaratıklar (bölgeye göre; aile · görünüm türü)
- **Vahran Ovası** (29): Küçük Bandikut [quad], Bandikut [quad], Yaban Bandikut [quad], Kuduz Bandikut [quad], Leşçil Bandikut [quad], Yamyam Bandikut [quad], Solucan [worm], Toprak Solucanı [worm], Kan Solucanı [worm], Mağara Sülüğü [worm], Orman Sülüğü [worm], Kapkaççı [worm], Goblin [?], Goblin Fedai [?], Goblin Ölücü [?], Kobold [?], Goblin Hokkabaz [?], Öcü [?], Hobgoblin [?], İskelet [?], İskelet Savaşçı [?], Yanan İskelet [?], İskelet Şövalye [?], İskelet Er Başı [?], Azman Kurt [quad], Kurt Tazısı [quad], Kasvet Tazısı [quad], Cehennem Tazısı [quad], Tavşan [quad]
- **Kül Geçidi** (25): Tarantula [spider], Kıskaçlı Akrep [scorpion], Karadul [spider], Akrep [scorpion], Uyuşturan [scorpion], İğneli [scorpion], Zombi [?], Ölmeyen [?], Çürük Göz [?], Çürümüş Zombi [?], Yamyam Tarantula [spider], Kül Şövalye [?], Kertenkele Adam [?], Kertenkele Savaşçı [?], Çamur Adam [?], Kum Adam [?], Alev Kayası [?], Taş Golem [?], Volkan Kayası [?], Dev Kaya [?], Kara Taş [?], Ağaç Hayaleti [?], Kara Ağaç Hayaleti [?], Titan [?], Çöl Golemi [?]
- **Kızıl Bahar Meydanı** (32): Kristal Muhafızı [?], Smilodon [quad], Yaban Smilodon [quad], Kılıç Diş [quad], Mahirodus [quad], Trol [?], Trol Savaşçı [?], Trol Kamı [?], Trol Otacısı [?], Trol Gözü Dönmüş [?], Yarı Trol Savaşçı [?], Trol Yüzbaşı [?], Yarı Trol Yüzbaşı [?], Sentor [centaur], Sentor İzci [centaur], Sentor Okçu [centaur], Sentor Keskin Nişancı [centaur], Doğan [bird], Al Kanat [bird], Eşek Arısı [insect], Harpi [?], Kuzgun Harpi [?], Gargoyl [?], Maymun [?], Gliptodon [quad], İkiz Maymun [?], Stegodon [quad], Mastodon [quad], Likan [?], Kurt Kılıklı [?], Minotor [?], Barbar Önderi [?]
- **Sisli Çukur** (36): Hayalet [?], Hayalet Savaşçı [?], Hortlak [?], Gölge Ruh [?], Hayal [?], Gölge [?], Kızıl Hayalet [?], Gezgin Hortlak [?], Gölge Hortlak [?], Mana Hortlağı [?], Büyücü Hayalet [?], Gezgin Şövalye Hayaleti [?], Kara Asker [?], Kara Muhafız [?], Kıyamet Askeri [?], Kara Şövalye [?], Gölge Şövalye [?], Karanlık Şövalye [?], Dehşet Şövalyesi [?], Kıyamet Şövalyesi [?], İntikam Şövalyesi [?], Kötü Büyücü [?], İskelet Bey [?], Ölüm Büyücüsü [?], Orakçı [?], Çığlıkçı [?], Ağıtçı [?], Kara Kısrak [quad], Gölge Kısrak [quad], Ölüm Kısrağı [quad], Dehşet Kısrağı [quad], Lamia [serpent], Karabasan [quad], Ejder Hizmetkârı [?], Ejder Şövalyesi [?], Yılan Kraliçe [serpent]

## Dünya bossları (ejderler vb.)
Red Dragon Hatchling [dragon, fire] · Bone Dragon [dragon, ice] · Blue dragon [dragon, ice] · Dark Dragon [dragon, dark] · Gold Dragon [dragon, bolt] · Red Dragon [dragon, fire]
