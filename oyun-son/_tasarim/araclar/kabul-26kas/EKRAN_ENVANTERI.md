# Ekran envanteri (kaynak kod + dinamik tarama) — KORANT-v40-1dda167 + P33

Kaynak kodda **455 ACT tanımı / 439 ayrı eylem** var (`js/*.js`; tarayıcı `act_tara.py`). Ekran açanlar (pencere, bina katmanı, modal, diyalog, onay, savaş/VS, yer değişimi): **202**. Dinamik tarama (`tara.js`, başkentten 3 adım derinliğe kadar her görünen `[data-a]` öğesine dokunur; veri yazan eylemlere dokunmaz) iki halkta **120 / 120 ayrı durum** buldu; ekran açan eylemlerin **34**'ine taramada ulaşıldı. Önceki otomatik çekimin 115 kimliği (Elentha 112, Kragmir 114) oyunun tamamı DEĞİLDİR; aşağıdaki tablo kapsamı gösterir.

## Eylem türleri

| Tür | Sayı |
|---|---|
| diğer (yardımcı/iç eylem) | 133 |
| pencere | 86 |
| işlem (veri yazar, ekran açmaz ya da yalnız bildirim) | 79 |
| modal | 53 |
| bildirim | 22 |
| yönlendirme (yer değiştirir) | 17 |
| savaş / VS | 16 |
| onay penceresi + veri yazar | 13 |
| onay penceresi | 8 |
| NPC diyaloğu | 6 |
| bina katmanı | 3 |
| geliştirici aracı | 2 |
| sekme değiştirme | 1 |

## Ekran açan eylemler (kaynak → tarama)

| Eylem | Tür | Kaynak | Parametreli | Taramada ulaşılan durum (Elentha / Kragmir) |
|---|---|---|---|---|
| `npcBuy` | NPC diyaloğu | `js/ui-ogretici.js:35` | evet | — / — |
| `npcChild` | NPC diyaloğu | `js/ui-ogretici.js:44` |  | — / — |
| `npcKing` | NPC diyaloğu | `js/ui-hub.js:90` | evet | — / — |
| `seriesPlay` | NPC diyaloğu | `js/ui-minidizi.js:24` | evet | — / — |
| `spSay` | NPC diyaloğu | `js/ui-destek.js:100` | evet | — / — |
| `yashka` | NPC diyaloğu | `js/ui-anit.js:11` | evet | — / — |
| `ahir` | bina katmanı | `js/ui-ahir.js:95` |  | — / — |
| `han` | bina katmanı | `js/ui-han.js:44` |  | — / — |
| `zaferAniti` | bina katmanı | `js/ui-zafer.js:49` |  | — / — |
| `again` | modal | `js/ui-battle.js:249` | evet | — / — |
| `anit` | modal | `js/ui-anit.js:17` |  | — / — |
| `avatarPick` | modal | `js/ui-hub.js:610` |  | 38, 97 / 38, 97 |
| `avatarSet` | modal | `js/ui-hub.js:618` | evet | — / — |
| `ayEmek` | modal | `js/ui-ayarlar.js:151` |  | — / — |
| `ayProfile` | modal | `js/ui-ayarlar.js:155` |  | — / — |
| `backClan` | modal | `js/ui-battle.js:252` | evet | — / — |
| `backPvp` | modal | `js/ui-battle.js:251` | evet | — / — |
| `balik` | modal | `js/ui-balik.js:70` |  | — / — |
| `balikDefter` | modal | `js/ui-balik.js:115` |  | — / — |
| `blockAsk` | modal | `js/ui-odeme.js:308` | evet | — / — |
| `clanPage` | modal | `js/ui-social.js:237` | evet | — / — |
| `cxItem` | modal | `js/ui-esya.js:176` | evet | 112, 113 / 112, 113 |
| `czpk` | modal | `js/ui-hub.js:477` | evet | — / — |
| `depthFloors` | modal | `js/ui-pvp.js:118` | evet | — / — |
| `destanMemory` | modal | `js/ui-destan.js:29` | evet | — / — |
| `devAsk` | modal | `js/ui-kalicilik.js:373` |  | — / — |
| `exchange` | modal | `js/ui-battle.js:184` | evet | — / — |
| `frRemoveAsk` | modal | `js/ui-odeme.js:302` | evet | — / — |
| `frameSel` | modal | `js/ui-social.js:230` | evet | — / — |
| `frameSet` | modal | `js/ui-social.js:235` | evet | — / — |
| `hsInvite` | modal | `js/ui-hisar.js:73` |  | — / — |
| `klMember` | modal | `js/ui-klan.js:173` | evet | — / — |
| `klNotice` | modal | `js/ui-klan.js:146` |  | — / — |
| `kxPick` | modal | `js/ui-kahraman.js:84` | evet | — / — |
| `mnFish` | modal | `js/ui-hub.js:528` |  | — / — |
| `mnHisar` | modal | `js/ui-hub.js:530` | evet | — / — |
| `mob` | modal | `js/ui-esya.js:135` | evet | 110, 111 / 110, 111 |
| `modInfo` | modal | `js/ui-pvp.js:91` | evet | — / — |
| `msgMenu` | modal | `js/ui-odeme.js:314` | evet | — / — |
| `next` | modal | `js/ui-battle.js:250` | evet | — / — |
| `onlineClaim` | modal | `js/ui-cevrimici.js:80` | evet | — / — |
| `onlineOpen` | modal | `js/ui-cevrimici.js:79` |  | 44, 100, 102 / 44, 100, 102 |
| `pathPick` | modal | `js/ui-sinif.js:96` | evet | 58 / 58 |
| `pcard` | modal | `js/ui-social.js:165` | evet | 35, 68, 69, 70, 106, 107 / 35, 68, 69, 70, 106, 107 |
| `portalMenu` | modal | `js/ui-hub.js:128` |  | — / — |
| `profile` | modal | `js/ui-hub.js:552` |  | 13, 80, 95 / 13, 80, 95 |
| `promoMenu` | modal | `js/ui-hub.js:545` |  | 47, 101, 103 / 47, 101, 103 |
| `rGrant` | modal | `js/ui-dunya.js:219` | evet | — / — |
| `rVote` | modal | `js/ui-dunya.js:173` | evet | 30 / 30 |
| `repLog` | modal | `js/ui-rapor.js:75` |  | — / — |
| `rkRewards` | modal | `js/ui-social.js:227` |  | — / — |
| `sandikOpen` | modal | `js/ui-sandik.js:32` |  | — / — |
| `savas` | modal | `js/ui-hub.js:352` |  | 26, 92 / 26, 92 |
| `server` | modal | `js/ui-sunucu.js:60` |  | — / — |
| `sweep` | modal | `js/ui-battle.js:170` | evet | — / — |
| `tierInfo` | modal | `js/ui-pvp.js:61` | evet | — / — |
| `titlePick` | modal | `js/ui-kalicilik.js:298` |  | 39, 98 / 39, 98 |
| `titlePickSet` | modal | `js/ui-kalicilik.js:306` | evet | — / — |
| `upPrev` | modal | `js/ui-esya.js:87` |  | 31 / 31 |
| `vsCoef` | modal | `js/ui-battle.js:165` |  | — / — |
| `worldInfo` | modal | `js/ui-dunya.js:109` |  | — / — |
| `yeminGo` | modal | `js/ui-yemin.js:19` |  | — / — |
| `bagOne` | onay penceresi | `js/ui-envanter.js:72` | evet | 59, 60 / 59, 60 |
| `devReset` | onay penceresi | `js/ui-hub.js:625` |  | — / — |
| `kxSell` | onay penceresi | `js/ui-kahraman.js:88` | evet | — / — |
| `logoutMenu` | onay penceresi | `js/ui-hub.js:513` |  | — / — |
| `mstReset` | onay penceresi | `js/ui-party.js:79` |  | — / — |
| `premBuy` | onay penceresi | `js/ui-town.js:397` | evet | — / — |
| `skillReset` | onay penceresi | `js/ui-party.js:154` |  | — / — |
| `statReset` | onay penceresi | `js/ui-party.js:174` |  | — / — |
| `balikRod` | onay penceresi + veri yazar | `js/ui-balik.js:105` |  | — / — |
| `clanLeave` | onay penceresi + veri yazar | `js/ui-klan.js:187` |  | — / — |
| `depthSweep` | onay penceresi + veri yazar | `js/ui-pvp.js:128` |  | — / — |
| `hsLeave` | onay penceresi + veri yazar | `js/ui-hisar.js:80` |  | — / — |
| `kbBuy` | onay penceresi + veri yazar | `js/ui-karaborsa.js:47` | evet | — / — |
| `klFac` | onay penceresi + veri yazar | `js/ui-klan.js:355` | evet | — / — |
| `klHunt` | onay penceresi + veri yazar | `js/ui-klan.js:269` | evet | — / — |
| `klKick` | onay penceresi + veri yazar | `js/ui-klan.js:185` | evet | — / — |
| `klTransfer` | onay penceresi + veri yazar | `js/ui-klan.js:186` | evet | — / — |
| `nbGo` | onay penceresi + veri yazar | `js/ui-nobet.js:68` | evet | — / — |
| `nbJoin` | onay penceresi + veri yazar | `js/ui-nobet.js:56` |  | — / — |
| `nbLeave` | onay penceresi + veri yazar | `js/ui-nobet.js:57` |  | — / — |
| `tcPlain` | onay penceresi + veri yazar | `js/ui-town.js:240` |  | — / — |
| `achs` | pencere | `js/ui-kalicilik.js:255` | evet | 43 / 43 |
| `aeSes` | pencere | `js/ui-erisim.js:47` | evet | — / — |
| `anvil` | pencere | `js/ui-town.js:39` | evet | — / — |
| `bag` | pencere | `js/ui-envanter.js:62` | evet | 23, 89 / 23, 89 |
| `bagBreak` | pencere | `js/ui-pvp.js:41` |  | — / — |
| `bagGo` | pencere | `js/ui-envanter.js:66` | evet | — / — |
| `bagMarket` | pencere | `js/ui-pvp.js:42` |  | — / — |
| `breakWin` | pencere | `js/ui-town.js:41` | evet | 61 / 61 |
| `calendar` | pencere | `js/ui-kalicilik.js:174` | evet | 42 / 42 |
| `cbFull` | pencere | `js/ui-social.js:40` | evet | 27, 93 / 27, 93 |
| `cbSend` | pencere | `js/ui-social.js:70` | evet | — / — |
| `chBack` | pencere | `js/ui-social.js:162` | evet | — / — |
| `chConv` | pencere | `js/ui-social.js:161` | evet | — / — |
| `chatMenu` | pencere | `js/ui-hub.js:542` |  | — / — |
| `chatOpen` | pencere | `js/ui-social.js:103` | evet | — / — |
| `clan` | pencere | `js/ui-klan.js:47` | evet | 25, 40, 91 / 25, 40, 91 |
| `clanApply` | pencere | `js/ui-klan.js:95` | evet | — / — |
| `clanCreate` | pencere | `js/ui-klan.js:93` | evet | — / — |
| `clanHisar` | pencere | `js/ui-hisar.js:89` | evet | — / — |
| `clanJoin` | pencere | `js/ui-klan.js:94` | evet | — / — |
| `clanhq` | pencere | `js/ui-klan.js:63` | evet | — / — |
| `codex` | pencere | `js/ui-esya.js:127` | evet | 17, 84 / 17, 84 |
| `cpGo` | pencere | `js/ui-social.js:249` | evet | — / — |
| `czArena` | pencere | `js/ui-hub.js:479` | evet | — / — |
| `czHall` | pencere | `js/ui-hub.js:478` |  | — / — |
| `czMarket` | pencere | `js/ui-hub.js:480` |  | — / — |
| `destan` | pencere | `js/ui-destan.js:22` | evet | — / — |
| `destanBack` | pencere | `js/ui-destan.js:31` |  | — / — |
| `diyarMap` | pencere | `js/ui-dunya.js:133` | evet | 18, 85 / 18, 85 |
| `erisim` | pencere | `js/ui-erisim.js:49` | evet | — / — |
| `friends` | pencere | `js/ui-odeme.js:292` | evet | — / — |
| `friendsMenu` | pencere | `js/ui-odeme.js:294` |  | 46 / 46 |
| `gate` | pencere | `js/ui-battle.js:39` | evet | — / — |
| `gfx` | pencere | `js/ui-ayarlar.js:197` | evet | — / — |
| `hall` | pencere | `js/ui-meydan.js:127` | evet | — / — |
| `hotbar` | pencere | `js/ui-hub.js:386` | evet | 22 / 22 |
| `iksir` | pencere | `js/ui-town.js:280` | evet | — / — |
| `karaborsa` | pencere | `js/ui-karaborsa.js:37` | evet | — / — |
| `klHq` | pencere | `js/ui-klan.js:141` | evet | — / — |
| `klanTab` | pencere | `js/ui-hub.js:101` | evet | — / — |
| `kxUp` | pencere | `js/ui-kahraman.js:87` | evet | — / — |
| `mail` | pencere | `js/ui-town.js:292` | evet | 16, 83 / 16, 83 |
| `mailTo` | pencere | `js/ui-town.js:325` | evet | — / — |
| `market` | pencere | `js/ui-town.js:134` | evet | — / — |
| `marketKindOpen` | pencere | `js/ui-town.js:159` |  | — / — |
| `meydan` | pencere | `js/ui-meydan.js:21` | evet | — / — |
| `mine` | pencere | `js/ui-town.js:73` | evet | — / — |
| `mnBaskin` | pencere | `js/ui-baskin.js:55` | evet | — / — |
| `mnFree` | pencere | `js/ui-hub.js:537` | evet | — / — |
| `monument` | pencere | `js/ui-social.js:275` | evet | — / — |
| `mzBackDef` | pencere | `js/ui-meydan.js:100` | evet | — / — |
| `news` | pencere | `js/ui-destek.js:27` | evet | — / — |
| `nobet` | pencere | `js/ui-nobet.js:52` | evet | — / — |
| `npcMerchant` | pencere | `js/ui-ogretici.js:29` | evet | — / — |
| `otag` | pencere | `js/ui-dunya.js:132` | evet | — / — |
| `otagMenu` | pencere | `js/ui-dunya.js:134` |  | — / — |
| `party` | pencere | `js/ui-party.js:27` | evet | 21, 88 / 21, 88 |
| `partyPath` | pencere | `js/ui-party.js:39` | evet | — / — |
| `pazar` | pencere | `js/ui-town.js:139` | evet | — / — |
| `pm` | pencere | `js/ui-social.js:176` | evet | — / — |
| `premium` | pencere | `js/ui-town.js:383` | evet | 14, 81 / 14, 81 |
| `premiumMenu` | pencere | `js/ui-hub.js:543` |  | — / — |
| `questLog` | pencere | `js/ui-hub.js:367` | evet | — / — |
| `rank` | pencere | `js/ui-social.js:204` | evet | — / — |
| `rankMenu` | pencere | `js/ui-hub.js:512` |  | 45 / 45 |
| `rehber` | pencere | `js/ui-rehber.js:290` | evet | — / — |
| `reports` | pencere | `js/ui-rapor.js:86` | evet | — / — |
| `season` | pencere | `js/ui-pvp.js:159` | evet | — / — |
| `seasonBack` | pencere | `js/ui-meydan.js:128` | evet | — / — |
| `settings` | pencere | `js/ui-ayarlar.js:185` | evet | 37 / 37 |
| `shop` | pencere | `js/ui-odeme.js:209` | evet | 19, 41, 86 / 19, 41, 86 |
| `sub` | pencere | `js/ui-party.js:37` | evet | — / — |
| `supportMenu` | pencere | `js/ui-destek.js:84` | evet | 48 / 48 |
| `svCz` | pencere | `js/ui-hub.js:364` | evet | — / — |
| `svDivan` | pencere | `js/ui-hub.js:365` |  | — / — |
| `titles` | pencere | `js/ui-kalicilik.js:260` | evet | — / — |
| `titlesMenu` | pencere | `js/ui-kalicilik.js:307` |  | 96 / 96 |
| `tuccar` | pencere | `js/ui-town.js:149` |  | — / — |
| `tuccarSub` | pencere | `js/ui-town.js:158` |  | — / — |
| `vsBack` | pencere | `js/ui-battle.js:125` | evet | — / — |
| `vsForm` | pencere | `js/ui-battle.js:168` | evet | — / — |
| `vsReturn` | pencere | `js/ui-battle.js:169` | evet | — / — |
| `wheel` | pencere | `js/ui-town.js:361` | evet | — / — |
| `yakutAl` | pencere | `js/ui-odeme.js:105` | evet | 20, 87 / 20, 87 |
| `yakutMenu` | pencere | `js/ui-odeme.js:112` |  | — / — |
| `yashkaNobet` | pencere | `js/ui-anit.js:16` |  | — / — |
| `anitGo` | savaş / VS | `js/ui-anit.js:32` | evet | — / — |
| `arenaVs` | savaş / VS | `js/ui-battle.js:204` | evet | — / — |
| `baskinGo` | savaş / VS | `js/ui-baskin.js:54` | evet | — / — |
| `destanGo` | savaş / VS | `js/ui-destan.js:27` | evet | — / — |
| `destanPick` | savaş / VS | `js/ui-destan.js:44` | evet | — / — |
| `feudGo` | savaş / VS | `js/ui-meydan.js:89` | evet | — / — |
| `liveFind` | savaş / VS | `js/ui-battle.js:205` | evet | — / — |
| `mode` | savaş / VS | `js/ui-battle.js:203` | evet | — / — |
| `npcWorm` | savaş / VS | `js/ui-ogretici.js:52` |  | — / — |
| `ormanFight` | savaş / VS | `js/orman.js:204` | evet | — / — |
| `quick` | savaş / VS | `js/ui-hub.js:484` | evet | — / — |
| `stage` | savaş / VS | `js/ui-battle.js:72` | evet | 116 / 116 |
| `svQuick` | savaş / VS | `js/ui-hub.js:363` |  | — / — |
| `vsStart` | savaş / VS | `js/ui-battle.js:166` |  | — / — |
| `wormGo` | savaş / VS | `js/ui-battle.js:124` | evet | — / — |
| `yeminRite` | savaş / VS | `js/ui-yemin.js:25` | evet | — / — |
| `gateCapital` | yönlendirme (yer değiştirir) | `js/ui-hub.js:144` |  | — / — |
| `gateCarsi` | yönlendirme (yer değiştirir) | `js/ui-hub.js:145` |  | 36 / 36 |
| `gateCz` | yönlendirme (yer değiştirir) | `js/ui-hub.js:147` |  | — / — |
| `gateDestan` | yönlendirme (yer değiştirir) | `js/ui-hub.js:143` |  | — / — |
| `gateEvents` | yönlendirme (yer değiştirir) | `js/ui-hub.js:540` | evet | — / — |
| `gateGo` | yönlendirme (yer değiştirir) | `js/ui-hub.js:124` |  | — / — |
| `gateKlan` | yönlendirme (yer değiştirir) | `js/ui-hub.js:146` |  | — / — |
| `gateMenu` | yönlendirme (yer değiştirir) | `js/ui-hub.js:111` |  | — / — |
| `gatePvp` | yönlendirme (yer değiştirir) | `js/ui-hub.js:541` | evet | — / — |
| `gateZones` | yönlendirme (yer değiştirir) | `js/ui-hub.js:539` | evet | — / — |
| `goCapital` | yönlendirme (yer değiştirir) | `js/ui-hub.js:148` |  | — / — |
| `goCarsi` | yönlendirme (yer değiştirir) | `js/ui-hub.js:105` |  | — / — |
| `goKlan` | yönlendirme (yer değiştirir) | `js/ui-hub.js:103` |  | — / — |
| `goStage` | yönlendirme (yer değiştirir) | `js/ui-esya.js:150` | evet | — / — |
| `hub` | yönlendirme (yer değiştirir) | `js/ui-hub.js:277` |  | — / — |
| `svGo` | yönlendirme (yer değiştirir) | `js/ui-hub.js:362` |  | — / — |
| `travel` | yönlendirme (yer değiştirir) | `js/ui-hub.js:108` |  | — / — |

## Alt sekmeler (taramada açılan)

- **elentha**: `blocked (Arkadaşlar)`, `c (Sohbet)`, `card (Yakut Al)`, `champ (Taş Yemini)`, `clan (Taş Yemini)`, `clans (Sıralama)`, `daily (Görevler)`, `dungeons (Kapı)`, `eq (Karakter)`, `events (Kapı)`, `f (Sohbet)`, `g (Sohbet)`, `gfx (Ayarlar)`, `grant (Otağ · Elentha)`, `hist (Yakut Al)`, `items (Ansiklopedi)`, `list (Arkadaşlar)`, `list (Başarımlar)`, `main (Görevler)`, `map (Otağ · Elentha)`, `mobs (Ansiklopedi)`, `money (Kervan)`, `monthly (Görevler)`, `mst (Ustalık)`, `n7 (Takvim)`, `p (Sohbet)`, `packs (Yakut Al)`, `players (Sıralama)`, `race (Sıralama)`, `race (Taş Yemini)`, `rehber (Ansiklopedi)`, `rep (Posta)`, `req (Arkadaşlar)`, `ruler (Otağ · Elentha)`, `ruler (Taş Yemini)`, `ses (Ayarlar)`, `skill (Yetenek)`, `sys (Posta)`, `titles (Başarımlar)`, `treasury (Otağ · Elentha)`, `unvan (Unvan)`, `weekly (Görevler)`, `yakut (Kervan)`, `yaz (Posta)`, `zones (Kapı)`
- **kragmir**: `blocked (Arkadaşlar)`, `c (Sohbet)`, `card (Yakut Al)`, `champ (Taş Yemini)`, `clan (Taş Yemini)`, `clans (Sıralama)`, `daily (Görevler)`, `dungeons (Kapı)`, `eq (Karakter)`, `events (Kapı)`, `f (Sohbet)`, `g (Sohbet)`, `gfx (Ayarlar)`, `grant (Otağ · Kragmir)`, `hist (Yakut Al)`, `items (Ansiklopedi)`, `list (Arkadaşlar)`, `list (Başarımlar)`, `main (Görevler)`, `map (Otağ · Kragmir)`, `mobs (Ansiklopedi)`, `money (Kervan)`, `monthly (Görevler)`, `mst (Ustalık)`, `n7 (Takvim)`, `p (Sohbet)`, `packs (Yakut Al)`, `players (Sıralama)`, `race (Sıralama)`, `race (Taş Yemini)`, `rehber (Ansiklopedi)`, `rep (Posta)`, `req (Arkadaşlar)`, `ruler (Otağ · Kragmir)`, `ruler (Taş Yemini)`, `ses (Ayarlar)`, `skill (Yetenek)`, `sys (Posta)`, `titles (Başarımlar)`, `treasury (Otağ · Kragmir)`, `unvan (Unvan)`, `weekly (Görevler)`, `yakut (Kervan)`, `yaz (Posta)`, `zones (Kapı)`

## Dinamik durumlar (tarama)

| Halk | No | Durum imzası | Derinlik | Varış tarifi |
|---|---|---|---|---|
| elentha | 0 | `HUB:baskent` | 0 | `açılış (başkent)` |
| elentha | 1 | `W:Otağ · Elentha|genel~ruler @baskent` | 1 | `building(id=clanhq)` |
| elentha | 2 | `W:Örs|genel @baskent` | 1 | `building(id=anvil)` |
| elentha | 3 | `W:Maden|genel @baskent` | 1 | `building(id=mine)` |
| elentha | 4 | `W:İksir ve Parşömen|genel @baskent` | 1 | `building(id=iksir)` |
| elentha | 5 | `W:Kader Çarkı|genel @baskent` | 1 | `building(id=wheel)` |
| elentha | 6 | `W:Taş Yemini|genel~champ @baskent` | 1 | `building(id=monument)` |
| elentha | 7 | `B:Han @baskent` | 1 | `building(id=han)` |
| elentha | 8 | `B:Ahır @baskent` | 1 | `building(id=ahir)` |
| elentha | 9 | `B:ZAFER ANITI @baskent` | 1 | `building(id=zaferAniti)` |
| elentha | 10 | `M:gatemenu.portalm|Işınlanma Kapısı @baskent` | 1 | `building(id=portal)` |
| elentha | 11 | `W:Karaborsa|genel @baskent` | 1 | `building(id=karaborsa)` |
| elentha | 12 | `M:DİYALOG Kral Edran @baskent` | 1 | `building(id=king)` |
| elentha | 13 | `M:p23p.|Denetci @baskent` | 1 | `profile()` |
| elentha | 14 | `W:Premium|genel @baskent` | 1 | `premium()` |
| elentha | 15 | `M:p23m|Menü @baskent` | 1 | `drawer()` |
| elentha | 16 | `W:Posta|posta~sys @baskent` | 1 | `mail()` |
| elentha | 17 | `W:Ansiklopedi|genel~rehber @baskent` | 1 | `codex()` |
| elentha | 18 | `W:Otağ · Elentha|genel~map @baskent` | 1 | `diyarMap()` |
| elentha | 19 | `W:Kervan|genel~yakut @baskent` | 1 | `shop()` |
| elentha | 20 | `W:Yakut Al|genel~packs @baskent` | 1 | `yakutAl()` |
| elentha | 21 | `W:Karakter|karakter~eq @baskent` | 1 | `party()` |
| elentha | 22 | `W:Yetenek|karakter~skill @baskent` | 1 | `hotbar()` |
| elentha | 23 | `W:Çanta|canta @baskent` | 1 | `bag()` |
| elentha | 24 | `W:Görevler|gorev~main @baskent` | 1 | `quests()` |
| elentha | 25 | `W:Klan Karargâhı|klan @baskent` | 1 | `clan()` |
| elentha | 26 | `M:p27sv|Savaş @baskent` | 1 | `savas()` |
| elentha | 27 | `W:Sohbet|genel~f @baskent` | 1 | `cbFull()` |
| elentha | 28 | `W:Otağ · Elentha|genel~treasury @baskent` | 2 | `building(id=clanhq) → tab(id=treasury)` |
| elentha | 29 | `W:Otağ · Elentha|genel~grant @baskent` | 2 | `building(id=clanhq) → tab(id=grant)` |
| elentha | 30 | `W:Otağ · Elentha|genel~ruler / M:|Oy ver @baskent` | 2 | `building(id=clanhq) → rVote(id=bot:120099:49:60,name=AkKaya)` |
| elentha | 31 | `W:Örs|genel / M:|Önizleme @baskent` | 2 | `building(id=anvil) → upPrev()` |
| elentha | 32 | `W:Taş Yemini|genel~clan @baskent` | 2 | `building(id=monument) → tab(id=clan)` |
| elentha | 33 | `W:Taş Yemini|genel~ruler @baskent` | 2 | `building(id=monument) → tab(id=ruler)` |
| elentha | 34 | `W:Taş Yemini|genel~race @baskent` | 2 | `building(id=monument) → tab(id=race)` |
| elentha | 35 | `W:Taş Yemini|genel~champ / M:|YamanAyaz @baskent` | 2 | `building(id=monument) → pcard(id=bot:7013:65:50)` |
| elentha | 36 | `HUB:carsi` | 2 | `building(id=portal) → gateCarsi(pt=carsi)` |
| elentha | 37 | `W:Ayarlar|ayarlar~gfx @baskent` | 2 | `profile() → settings()` |
| elentha | 38 | `M:|Profil fotoğrafı @baskent` | 2 | `profile() → avatarPick()` |
| elentha | 39 | `M:|Unvan seç @baskent` | 2 | `profile() → titlePick()` |
| elentha | 40 | `W:Klan Karargâhı|klan / M:p23p.|Denetci @baskent` | 2 | `profile() → clan()` |
| elentha | 41 | `W:Kervan|genel~money @baskent` | 2 | `premium() → shop(tab=money)` |
| elentha | 42 | `W:Takvim|gorev~n7 / M:p23m|Menü @baskent` | 2 | `drawer() → calendar()` |
| elentha | 43 | `W:Başarımlar|basarim~list / M:p23m|Menü @baskent` | 2 | `drawer() → achs()` |
| elentha | 44 | `M:onl.p25b|Çevrimiçi ödülleri @baskent` | 2 | `drawer() → onlineOpen()` |
| elentha | 45 | `W:Sıralama|siralama~players @baskent` | 2 | `drawer() → rankMenu()` |
| elentha | 46 | `W:Arkadaşlar|arkadas~list @baskent` | 2 | `drawer() → friendsMenu()` |
| elentha | 47 | `M:|Promosyon kodu @baskent` | 2 | `drawer() → promoMenu()` |
| elentha | 48 | `W:Sorun Teknik Destek|destek @baskent` | 2 | `drawer() → supportMenu()` |
| elentha | 49 | `W:Posta|posta~yaz @baskent` | 2 | `mail() → tab(id=yaz)` |
| elentha | 50 | `W:Posta|posta~rep @baskent` | 2 | `mail() → tab(id=rep)` |
| elentha | 51 | `W:Ansiklopedi|genel~mobs @baskent` | 2 | `codex() → tab(id=mobs)` |
| elentha | 52 | `W:Ansiklopedi|genel~items @baskent` | 2 | `codex() → tab(id=items)` |
| elentha | 53 | `W:Kapı|genel~zones @baskent` | 2 | `codex() → rhGo(id=baslarken)` |
| elentha | 54 | `W:Yakut Al|genel~card @baskent` | 2 | `yakutAl() → tab(id=card)` |
| elentha | 55 | `W:Yakut Al|genel~hist @baskent` | 2 | `yakutAl() → tab(id=hist)` |
| elentha | 56 | `W:Ustalık|karakter~mst @baskent` | 2 | `hotbar() → tab(id=mst)` |
| elentha | 57 | `W:Unvan|karakter~unvan @baskent` | 2 | `hotbar() → tab(id=unvan)` |
| elentha | 58 | `W:Yetenek|karakter~skill / M:ybox|Yol seç @baskent` | 2 | `hotbar() → pathPick(k=sur)` |
| elentha | 59 | `W:Çanta|canta / M:|Eşyayı parçala @baskent` | 2 | `bag() → bagOne(op=dismantle)` |
| elentha | 60 | `W:Çanta|canta / M:|Eşyayı sat @baskent` | 2 | `bag() → bagOne(op=sell)` |
| elentha | 61 | `W:Parçala ya da Sat|genel @baskent` | 2 | `bag() → breakWin()` |
| elentha | 62 | `W:Görevler|gorev~daily @baskent` | 2 | `quests() → tab(id=daily)` |
| elentha | 63 | `W:Görevler|gorev~weekly @baskent` | 2 | `quests() → tab(id=weekly)` |
| elentha | 64 | `W:Görevler|gorev~monthly @baskent` | 2 | `quests() → tab(id=monthly)` |
| elentha | 65 | `W:Sohbet|genel~g @baskent` | 2 | `cbFull() → tab(id=g)` |
| elentha | 66 | `W:Sohbet|genel~c @baskent` | 2 | `cbFull() → tab(id=c)` |
| elentha | 67 | `W:Sohbet|genel~p @baskent` | 2 | `cbFull() → tab(id=p)` |
| elentha | 68 | `W:Sohbet|genel~f / M:|KızılYürek @baskent` | 2 | `cbFull() → pcard(id=bot:139:20:50)` |
| elentha | 69 | `W:Sohbet|genel~f / M:|KızılOzan @baskent` | 2 | `cbFull() → pcard(id=bot:235:30:50)` |
| elentha | 70 | `W:Taş Yemini|genel~clan / M:|UzunOzan @baskent` | 3 | `building(id=monument) → tab(id=clan) → pcard(id=bot:22001:65:50)` |
| elentha | 71 | `W:Silah ve Kalkan|dukkan @carsi` | 3 | `building(id=portal) → gateCarsi(pt=carsi) → building(id=c_silah)` |
| elentha | 72 | `W:Zırh|dukkan @carsi` | 3 | `building(id=portal) → gateCarsi(pt=carsi) → building(id=c_zirh)` |
| elentha | 73 | `W:Takı|dukkan @carsi` | 3 | `building(id=portal) → gateCarsi(pt=carsi) → building(id=c_taki)` |
| elentha | 74 | `W:Tüccar|genel @carsi` | 3 | `building(id=portal) → gateCarsi(pt=carsi) → building(id=c_sarf)` |
| elentha | 75 | `W:Pazar|genel @carsi` | 3 | `building(id=portal) → gateCarsi(pt=carsi) → building(id=pazar)` |
| elentha | 76 | `W:Karaborsa|genel @carsi` | 3 | `building(id=portal) → gateCarsi(pt=carsi) → building(id=karaborsa)` |
| elentha | 77 | `M:DİYALOG Şaman Yashka @carsi` | 3 | `building(id=portal) → gateCarsi(pt=carsi) → building(id=yashka)` |
| elentha | 78 | `M:blkw|Balık Tut @carsi` | 3 | `building(id=portal) → gateCarsi(pt=carsi) → building(id=pier)` |
| elentha | 79 | `M:gatemenu.portalm|Işınlanma Kapısı @carsi` | 3 | `building(id=portal) → gateCarsi(pt=carsi) → building(id=portal)` |
| elentha | 80 | `M:p23p.|Denetci @carsi` | 3 | `building(id=portal) → gateCarsi(pt=carsi) → profile()` |
| elentha | 81 | `W:Premium|genel @carsi` | 3 | `building(id=portal) → gateCarsi(pt=carsi) → premium()` |
| elentha | 82 | `M:p23m|Menü @carsi` | 3 | `building(id=portal) → gateCarsi(pt=carsi) → drawer()` |
| elentha | 83 | `W:Posta|posta~sys @carsi` | 3 | `building(id=portal) → gateCarsi(pt=carsi) → mail()` |
| elentha | 84 | `W:Ansiklopedi|genel~rehber @carsi` | 3 | `building(id=portal) → gateCarsi(pt=carsi) → codex()` |
| elentha | 85 | `W:Otağ · Elentha|genel~map @carsi` | 3 | `building(id=portal) → gateCarsi(pt=carsi) → diyarMap()` |
| elentha | 86 | `W:Kervan|genel~yakut @carsi` | 3 | `building(id=portal) → gateCarsi(pt=carsi) → shop()` |
| elentha | 87 | `W:Yakut Al|genel~packs @carsi` | 3 | `building(id=portal) → gateCarsi(pt=carsi) → yakutAl()` |
| elentha | 88 | `W:Yetenek|karakter~skill @carsi` | 3 | `building(id=portal) → gateCarsi(pt=carsi) → party()` |
| elentha | 89 | `W:Çanta|canta @carsi` | 3 | `building(id=portal) → gateCarsi(pt=carsi) → bag()` |
| elentha | 90 | `W:Görevler|gorev~main @carsi` | 3 | `building(id=portal) → gateCarsi(pt=carsi) → quests()` |
| elentha | 91 | `W:Klan Karargâhı|klan @carsi` | 3 | `building(id=portal) → gateCarsi(pt=carsi) → clan()` |
| elentha | 92 | `M:p27sv|Savaş @carsi` | 3 | `building(id=portal) → gateCarsi(pt=carsi) → savas()` |
| elentha | 93 | `W:Sohbet|genel~f @carsi` | 3 | `building(id=portal) → gateCarsi(pt=carsi) → cbFull()` |
| elentha | 94 | `W:Ayarlar|ayarlar~ses @baskent` | 3 | `profile() → settings() → tab(id=ses)` |
| elentha | 95 | `M:p23p|Denetci @baskent` | 3 | `profile() → avatarPick() → profile()` |
| elentha | 96 | `W:Başarımlar|basarim~titles @baskent` | 3 | `profile() → titlePick() → titlesMenu()` |
| elentha | 97 | `W:Klan Karargâhı|klan / M:|Profil fotoğrafı @baskent` | 3 | `profile() → clan() → avatarPick()` |
| elentha | 98 | `W:Klan Karargâhı|klan / M:|Unvan seç @baskent` | 3 | `profile() → clan() → titlePick()` |
| elentha | 99 | `W:Kervan|genel~money / M:starter|İlk Alım Paketi @baskent` | 3 | `premium() → shop(tab=money) → starterOpen()` |
| elentha | 100 | `W:Takvim|gorev~n7 / M:onl.p25b|Çevrimiçi ödülleri @baskent` | 3 | `drawer() → calendar() → onlineOpen()` |
| elentha | 101 | `W:Takvim|gorev~n7 / M:|Promosyon kodu @baskent` | 3 | `drawer() → calendar() → promoMenu()` |
| elentha | 102 | `W:Başarımlar|basarim~list / M:onl.p25b|Çevrimiçi ödülleri @baskent` | 3 | `drawer() → achs() → onlineOpen()` |
| elentha | 103 | `W:Başarımlar|basarim~list / M:|Promosyon kodu @baskent` | 3 | `drawer() → achs() → promoMenu()` |
| elentha | 104 | `W:Sıralama|siralama~clans @baskent` | 3 | `drawer() → rankMenu() → tab(id=clans)` |
| elentha | 105 | `W:Sıralama|siralama~race @baskent` | 3 | `drawer() → rankMenu() → tab(id=race)` |
| elentha | 106 | `W:Sıralama|siralama~players / M:|YamanAyaz @baskent` | 3 | `drawer() → rankMenu() → pcard(id=bot:7013:65:50)` |
| elentha | 107 | `W:Sıralama|siralama~players / M:|DeliPusat @baskent` | 3 | `drawer() → rankMenu() → pcard(id=bot:7012:65:50)` |
| elentha | 108 | `W:Arkadaşlar|arkadas~req @baskent` | 3 | `drawer() → friendsMenu() → tab(id=req)` |
| elentha | 109 | `W:Arkadaşlar|arkadas~blocked @baskent` | 3 | `drawer() → friendsMenu() → tab(id=blocked)` |
| elentha | 110 | `W:Ansiklopedi|genel~mobs / M:|Küçük Bandikut @baskent` | 3 | `codex() → tab(id=mobs) → mob(id=small_bandicoot)` |
| elentha | 111 | `W:Ansiklopedi|genel~mobs / M:|Bandikut @baskent` | 3 | `codex() → tab(id=mobs) → mob(id=bandicoot)` |
| elentha | 112 | `W:Ansiklopedi|genel~items / M:cxbox|Sancak Palası @baskent` | 3 | `codex() → tab(id=items) → cxItem(b=u:hanguk,g=2)` |
| elentha | 113 | `W:Ansiklopedi|genel~items / M:cxbox|Kül Dilimi Kılıç @baskent` | 3 | `codex() → tab(id=items) → cxItem(b=u:kuldilimi,g=2)` |
| elentha | 114 | `W:Kapı|genel~dungeons @baskent` | 3 | `codex() → rhGo(id=baslarken) → tab(id=dungeons)` |
| elentha | 115 | `W:Kapı|genel~events @baskent` | 3 | `codex() → rhGo(id=baslarken) → tab(id=events)` |
| elentha | 116 | `W:Tarantula|vs @baskent` | 3 | `codex() → rhGo(id=baslarken) → stage(id=2-1,t=0)` |
| elentha | 117 | `W:Küçük Bandikut|vs @baskent` | 3 | `quests() → tab(id=daily) → questGo(id=win)` |
| elentha | 118 | `W:Sohbet|genel~g / M:|AlpOzan @baskent` | 3 | `cbFull() → tab(id=g) → pcard(id=bot:199:57:50)` |
| elentha | 119 | `W:Sohbet|genel~g / M:|SarpAyaz @baskent` | 3 | `cbFull() → tab(id=g) → pcard(id=bot:22007:52:50)` |
| kragmir | 0 | `HUB:baskent` | 0 | `açılış (başkent)` |
| kragmir | 1 | `W:Otağ · Kragmir|genel~ruler @baskent` | 1 | `building(id=clanhq)` |
| kragmir | 2 | `W:Örs|genel @baskent` | 1 | `building(id=anvil)` |
| kragmir | 3 | `W:Maden|genel @baskent` | 1 | `building(id=mine)` |
| kragmir | 4 | `W:İksir ve Parşömen|genel @baskent` | 1 | `building(id=iksir)` |
| kragmir | 5 | `W:Kader Çarkı|genel @baskent` | 1 | `building(id=wheel)` |
| kragmir | 6 | `W:Taş Yemini|genel~champ @baskent` | 1 | `building(id=monument)` |
| kragmir | 7 | `B:Han @baskent` | 1 | `building(id=han)` |
| kragmir | 8 | `B:Ahır @baskent` | 1 | `building(id=ahir)` |
| kragmir | 9 | `B:ZAFER ANITI @baskent` | 1 | `building(id=zaferAniti)` |
| kragmir | 10 | `M:gatemenu.portalm|Işınlanma Kapısı @baskent` | 1 | `building(id=portal)` |
| kragmir | 11 | `W:Karaborsa|genel @baskent` | 1 | `building(id=karaborsa)` |
| kragmir | 12 | `M:DİYALOG Kral Volgar Demirdiş @baskent` | 1 | `building(id=king)` |
| kragmir | 13 | `M:p23p.|Denetci @baskent` | 1 | `profile()` |
| kragmir | 14 | `W:Premium|genel @baskent` | 1 | `premium()` |
| kragmir | 15 | `M:p23m|Menü @baskent` | 1 | `drawer()` |
| kragmir | 16 | `W:Posta|posta~sys @baskent` | 1 | `mail()` |
| kragmir | 17 | `W:Ansiklopedi|genel~rehber @baskent` | 1 | `codex()` |
| kragmir | 18 | `W:Otağ · Kragmir|genel~map @baskent` | 1 | `diyarMap()` |
| kragmir | 19 | `W:Kervan|genel~yakut @baskent` | 1 | `shop()` |
| kragmir | 20 | `W:Yakut Al|genel~packs @baskent` | 1 | `yakutAl()` |
| kragmir | 21 | `W:Karakter|karakter~eq @baskent` | 1 | `party()` |
| kragmir | 22 | `W:Yetenek|karakter~skill @baskent` | 1 | `hotbar()` |
| kragmir | 23 | `W:Çanta|canta @baskent` | 1 | `bag()` |
| kragmir | 24 | `W:Görevler|gorev~main @baskent` | 1 | `quests()` |
| kragmir | 25 | `W:Klan Karargâhı|klan @baskent` | 1 | `clan()` |
| kragmir | 26 | `M:p27sv|Savaş @baskent` | 1 | `savas()` |
| kragmir | 27 | `W:Sohbet|genel~f @baskent` | 1 | `cbFull()` |
| kragmir | 28 | `W:Otağ · Kragmir|genel~treasury @baskent` | 2 | `building(id=clanhq) → tab(id=treasury)` |
| kragmir | 29 | `W:Otağ · Kragmir|genel~grant @baskent` | 2 | `building(id=clanhq) → tab(id=grant)` |
| kragmir | 30 | `W:Otağ · Kragmir|genel~ruler / M:|Oy ver @baskent` | 2 | `building(id=clanhq) → rVote(id=bot:698211:53:60,name=YamanŞahin)` |
| kragmir | 31 | `W:Örs|genel / M:|Önizleme @baskent` | 2 | `building(id=anvil) → upPrev()` |
| kragmir | 32 | `W:Taş Yemini|genel~clan @baskent` | 2 | `building(id=monument) → tab(id=clan)` |
| kragmir | 33 | `W:Taş Yemini|genel~ruler @baskent` | 2 | `building(id=monument) → tab(id=ruler)` |
| kragmir | 34 | `W:Taş Yemini|genel~race @baskent` | 2 | `building(id=monument) → tab(id=race)` |
| kragmir | 35 | `W:Taş Yemini|genel~champ / M:|YamanAyaz @baskent` | 2 | `building(id=monument) → pcard(id=bot:7013:65:50)` |
| kragmir | 36 | `HUB:carsi` | 2 | `building(id=portal) → gateCarsi(pt=carsi)` |
| kragmir | 37 | `W:Ayarlar|ayarlar~gfx @baskent` | 2 | `profile() → settings()` |
| kragmir | 38 | `M:|Profil fotoğrafı @baskent` | 2 | `profile() → avatarPick()` |
| kragmir | 39 | `M:|Unvan seç @baskent` | 2 | `profile() → titlePick()` |
| kragmir | 40 | `W:Klan Karargâhı|klan / M:p23p.|Denetci @baskent` | 2 | `profile() → clan()` |
| kragmir | 41 | `W:Kervan|genel~money @baskent` | 2 | `premium() → shop(tab=money)` |
| kragmir | 42 | `W:Takvim|gorev~n7 / M:p23m|Menü @baskent` | 2 | `drawer() → calendar()` |
| kragmir | 43 | `W:Başarımlar|basarim~list / M:p23m|Menü @baskent` | 2 | `drawer() → achs()` |
| kragmir | 44 | `M:onl.p25b|Çevrimiçi ödülleri @baskent` | 2 | `drawer() → onlineOpen()` |
| kragmir | 45 | `W:Sıralama|siralama~players @baskent` | 2 | `drawer() → rankMenu()` |
| kragmir | 46 | `W:Arkadaşlar|arkadas~list @baskent` | 2 | `drawer() → friendsMenu()` |
| kragmir | 47 | `M:|Promosyon kodu @baskent` | 2 | `drawer() → promoMenu()` |
| kragmir | 48 | `W:Sorun Teknik Destek|destek @baskent` | 2 | `drawer() → supportMenu()` |
| kragmir | 49 | `W:Posta|posta~yaz @baskent` | 2 | `mail() → tab(id=yaz)` |
| kragmir | 50 | `W:Posta|posta~rep @baskent` | 2 | `mail() → tab(id=rep)` |
| kragmir | 51 | `W:Ansiklopedi|genel~mobs @baskent` | 2 | `codex() → tab(id=mobs)` |
| kragmir | 52 | `W:Ansiklopedi|genel~items @baskent` | 2 | `codex() → tab(id=items)` |
| kragmir | 53 | `W:Kapı|genel~zones @baskent` | 2 | `codex() → rhGo(id=baslarken)` |
| kragmir | 54 | `W:Yakut Al|genel~card @baskent` | 2 | `yakutAl() → tab(id=card)` |
| kragmir | 55 | `W:Yakut Al|genel~hist @baskent` | 2 | `yakutAl() → tab(id=hist)` |
| kragmir | 56 | `W:Ustalık|karakter~mst @baskent` | 2 | `hotbar() → tab(id=mst)` |
| kragmir | 57 | `W:Unvan|karakter~unvan @baskent` | 2 | `hotbar() → tab(id=unvan)` |
| kragmir | 58 | `W:Yetenek|karakter~skill / M:ybox|Yol seç @baskent` | 2 | `hotbar() → pathPick(k=sur)` |
| kragmir | 59 | `W:Çanta|canta / M:|Eşyayı parçala @baskent` | 2 | `bag() → bagOne(op=dismantle)` |
| kragmir | 60 | `W:Çanta|canta / M:|Eşyayı sat @baskent` | 2 | `bag() → bagOne(op=sell)` |
| kragmir | 61 | `W:Parçala ya da Sat|genel @baskent` | 2 | `bag() → breakWin()` |
| kragmir | 62 | `W:Görevler|gorev~daily @baskent` | 2 | `quests() → tab(id=daily)` |
| kragmir | 63 | `W:Görevler|gorev~weekly @baskent` | 2 | `quests() → tab(id=weekly)` |
| kragmir | 64 | `W:Görevler|gorev~monthly @baskent` | 2 | `quests() → tab(id=monthly)` |
| kragmir | 65 | `W:Sohbet|genel~g @baskent` | 2 | `cbFull() → tab(id=g)` |
| kragmir | 66 | `W:Sohbet|genel~c @baskent` | 2 | `cbFull() → tab(id=c)` |
| kragmir | 67 | `W:Sohbet|genel~p @baskent` | 2 | `cbFull() → tab(id=p)` |
| kragmir | 68 | `W:Sohbet|genel~f / M:|YalınKaya @baskent` | 2 | `cbFull() → pcard(id=bot:22005:38:50)` |
| kragmir | 69 | `W:Sohbet|genel~f / M:|AkAyaz @baskent` | 2 | `cbFull() → pcard(id=bot:22019:41:50)` |
| kragmir | 70 | `W:Taş Yemini|genel~clan / M:|UzunOzan @baskent` | 3 | `building(id=monument) → tab(id=clan) → pcard(id=bot:22001:65:50)` |
| kragmir | 71 | `W:Silah ve Kalkan|dukkan @carsi` | 3 | `building(id=portal) → gateCarsi(pt=carsi) → building(id=c_silah)` |
| kragmir | 72 | `W:Zırh|dukkan @carsi` | 3 | `building(id=portal) → gateCarsi(pt=carsi) → building(id=c_zirh)` |
| kragmir | 73 | `W:Takı|dukkan @carsi` | 3 | `building(id=portal) → gateCarsi(pt=carsi) → building(id=c_taki)` |
| kragmir | 74 | `W:Tüccar|genel @carsi` | 3 | `building(id=portal) → gateCarsi(pt=carsi) → building(id=c_sarf)` |
| kragmir | 75 | `W:Pazar|genel @carsi` | 3 | `building(id=portal) → gateCarsi(pt=carsi) → building(id=pazar)` |
| kragmir | 76 | `W:Karaborsa|genel @carsi` | 3 | `building(id=portal) → gateCarsi(pt=carsi) → building(id=karaborsa)` |
| kragmir | 77 | `M:DİYALOG Şaman Yashka @carsi` | 3 | `building(id=portal) → gateCarsi(pt=carsi) → building(id=yashka)` |
| kragmir | 78 | `M:blkw|Balık Tut @carsi` | 3 | `building(id=portal) → gateCarsi(pt=carsi) → building(id=pier)` |
| kragmir | 79 | `M:gatemenu.portalm|Işınlanma Kapısı @carsi` | 3 | `building(id=portal) → gateCarsi(pt=carsi) → building(id=portal)` |
| kragmir | 80 | `M:p23p.|Denetci @carsi` | 3 | `building(id=portal) → gateCarsi(pt=carsi) → profile()` |
| kragmir | 81 | `W:Premium|genel @carsi` | 3 | `building(id=portal) → gateCarsi(pt=carsi) → premium()` |
| kragmir | 82 | `M:p23m|Menü @carsi` | 3 | `building(id=portal) → gateCarsi(pt=carsi) → drawer()` |
| kragmir | 83 | `W:Posta|posta~sys @carsi` | 3 | `building(id=portal) → gateCarsi(pt=carsi) → mail()` |
| kragmir | 84 | `W:Ansiklopedi|genel~rehber @carsi` | 3 | `building(id=portal) → gateCarsi(pt=carsi) → codex()` |
| kragmir | 85 | `W:Otağ · Kragmir|genel~map @carsi` | 3 | `building(id=portal) → gateCarsi(pt=carsi) → diyarMap()` |
| kragmir | 86 | `W:Kervan|genel~yakut @carsi` | 3 | `building(id=portal) → gateCarsi(pt=carsi) → shop()` |
| kragmir | 87 | `W:Yakut Al|genel~packs @carsi` | 3 | `building(id=portal) → gateCarsi(pt=carsi) → yakutAl()` |
| kragmir | 88 | `W:Yetenek|karakter~skill @carsi` | 3 | `building(id=portal) → gateCarsi(pt=carsi) → party()` |
| kragmir | 89 | `W:Çanta|canta @carsi` | 3 | `building(id=portal) → gateCarsi(pt=carsi) → bag()` |
| kragmir | 90 | `W:Görevler|gorev~main @carsi` | 3 | `building(id=portal) → gateCarsi(pt=carsi) → quests()` |
| kragmir | 91 | `W:Klan Karargâhı|klan @carsi` | 3 | `building(id=portal) → gateCarsi(pt=carsi) → clan()` |
| kragmir | 92 | `M:p27sv|Savaş @carsi` | 3 | `building(id=portal) → gateCarsi(pt=carsi) → savas()` |
| kragmir | 93 | `W:Sohbet|genel~f @carsi` | 3 | `building(id=portal) → gateCarsi(pt=carsi) → cbFull()` |
| kragmir | 94 | `W:Ayarlar|ayarlar~ses @baskent` | 3 | `profile() → settings() → tab(id=ses)` |
| kragmir | 95 | `M:p23p|Denetci @baskent` | 3 | `profile() → avatarPick() → profile()` |
| kragmir | 96 | `W:Başarımlar|basarim~titles @baskent` | 3 | `profile() → titlePick() → titlesMenu()` |
| kragmir | 97 | `W:Klan Karargâhı|klan / M:|Profil fotoğrafı @baskent` | 3 | `profile() → clan() → avatarPick()` |
| kragmir | 98 | `W:Klan Karargâhı|klan / M:|Unvan seç @baskent` | 3 | `profile() → clan() → titlePick()` |
| kragmir | 99 | `W:Kervan|genel~money / M:starter|İlk Alım Paketi @baskent` | 3 | `premium() → shop(tab=money) → starterOpen()` |
| kragmir | 100 | `W:Takvim|gorev~n7 / M:onl.p25b|Çevrimiçi ödülleri @baskent` | 3 | `drawer() → calendar() → onlineOpen()` |
| kragmir | 101 | `W:Takvim|gorev~n7 / M:|Promosyon kodu @baskent` | 3 | `drawer() → calendar() → promoMenu()` |
| kragmir | 102 | `W:Başarımlar|basarim~list / M:onl.p25b|Çevrimiçi ödülleri @baskent` | 3 | `drawer() → achs() → onlineOpen()` |
| kragmir | 103 | `W:Başarımlar|basarim~list / M:|Promosyon kodu @baskent` | 3 | `drawer() → achs() → promoMenu()` |
| kragmir | 104 | `W:Sıralama|siralama~clans @baskent` | 3 | `drawer() → rankMenu() → tab(id=clans)` |
| kragmir | 105 | `W:Sıralama|siralama~race @baskent` | 3 | `drawer() → rankMenu() → tab(id=race)` |
| kragmir | 106 | `W:Sıralama|siralama~players / M:|YamanAyaz @baskent` | 3 | `drawer() → rankMenu() → pcard(id=bot:7013:65:50)` |
| kragmir | 107 | `W:Sıralama|siralama~players / M:|DeliPusat @baskent` | 3 | `drawer() → rankMenu() → pcard(id=bot:7012:65:50)` |
| kragmir | 108 | `W:Arkadaşlar|arkadas~req @baskent` | 3 | `drawer() → friendsMenu() → tab(id=req)` |
| kragmir | 109 | `W:Arkadaşlar|arkadas~blocked @baskent` | 3 | `drawer() → friendsMenu() → tab(id=blocked)` |
| kragmir | 110 | `W:Ansiklopedi|genel~mobs / M:|Küçük Bandikut @baskent` | 3 | `codex() → tab(id=mobs) → mob(id=small_bandicoot)` |
| kragmir | 111 | `W:Ansiklopedi|genel~mobs / M:|Bandikut @baskent` | 3 | `codex() → tab(id=mobs) → mob(id=bandicoot)` |
| kragmir | 112 | `W:Ansiklopedi|genel~items / M:cxbox|Sancak Palası @baskent` | 3 | `codex() → tab(id=items) → cxItem(b=u:hanguk,g=2)` |
| kragmir | 113 | `W:Ansiklopedi|genel~items / M:cxbox|Kül Dilimi Kılıç @baskent` | 3 | `codex() → tab(id=items) → cxItem(b=u:kuldilimi,g=2)` |
| kragmir | 114 | `W:Kapı|genel~dungeons @baskent` | 3 | `codex() → rhGo(id=baslarken) → tab(id=dungeons)` |
| kragmir | 115 | `W:Kapı|genel~events @baskent` | 3 | `codex() → rhGo(id=baslarken) → tab(id=events)` |
| kragmir | 116 | `W:Tarantula|vs @baskent` | 3 | `codex() → rhGo(id=baslarken) → stage(id=2-1,t=0)` |
| kragmir | 117 | `W:Küçük Bandikut|vs @baskent` | 3 | `quests() → tab(id=daily) → questGo(id=win)` |
| kragmir | 118 | `W:Sohbet|genel~g / M:|BozTuğ @baskent` | 3 | `cbFull() → tab(id=g) → pcard(id=bot:22004:47:50)` |
| kragmir | 119 | `W:Sohbet|genel~g / M:|KocaBilek @baskent` | 3 | `cbFull() → tab(id=g) → pcard(id=bot:165:36:50)` |
