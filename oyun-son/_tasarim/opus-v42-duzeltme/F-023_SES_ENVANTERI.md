# F-023 · Ses envanteri ve dinleme kontrol listesi (V42)

Durum: **AÇIK — DİNLENMEDİ.** Bu ortamda ses çıkışı yok; Opus hiçbir sesi dinlemedi. Aşağıdaki bilgiler
dosya üst verisinden (ffprobe) ve kaynak incelemesinden (`js/sfx.js`) alındı. Kabul, kullanıcının dinlemesiyle verilir.

## 1. Dosya olarak gelen müzikler (4 dosya, `oyun-son/audio/`)

| Dosya | Süre | Biçim | SHA-256 (ilk 16) | Olay anahtarı | Nerede çalar |
|---|---|---|---|---|---|
| intro.mp3 | 2:34,6 | MP3 128 kbps, 44,1 kHz, stereo | 9fabfbc0d7abb897 | `mus.intro` | Yükleme ekranı; ana ekrana geçince çapraz solar |
| arka-plan.mp3 | 2:54,9 | MP3 128 kbps, 44,1 kHz, stereo | 0692c3298a9391fd | `mus.tema` | Ana ekran (başkent, pazar) arka planı |
| kizil-goz.mp3 | 2:37,6 | MP3 112 kbps, 44,1 kHz, stereo | 7225053de37b717d | `mus.fragman` | Tema müziği; fragman (`ui-fragman.js`) |
| boss.mp3 | 1:45,7 | MP3 128 kbps, 44,1 kHz, stereo | c24d07082e7d4823 | `mus.boss` | Patron savaşı |

Lisans durumu F-015 kapsamında ERTELENDİ (kapanmış sayılmaz).

## 2. Sentezle üretilen sesler (dosya yok; `js/sfx.js`, WebAudio, 141 olay anahtarı)

- Kimlik/duyuru: id.ocak, id.sancak, id.plus10, id.siege, ann.ping
- Arayüz (30): ui.tap, ui.tab(.sancak/.ocak), ui.toggle, ui.confirm(.sancak/.ocak), ui.back, ui.open, ui.close, ui.modal, ui.modalClose, ui.error, ui.toast, ui.bell, ui.coins, ui.sale, ui.reward, ui.levelup, ui.quest, ui.ach, ui.chest, ui.equip, ui.unequip, ui.dismantle, ui.send, ui.point, ui.upgrade, ui.stamp, ui.horn
- Nadirlik: rar.0, rar.1, rar.2
- Ana ekran binaları: hub.knock, hub.gate, hub.mine, hub.wheel, hub.hall, hub.stone
- Örs: anvil.strike, anvil.tension, anvil.ok, anvil.fail, anvil.drop, anvil.break, anvil.safe, anvil.sparkle
- Silah savurma/vuruş: swing.* ve hit.* (sword, axe, dagger, bow, mace, staff)
- Büyü: cast.fire/ice/bolt/arcane/heal/buff, imp.fire/ice/bolt/arcane
- Savaş olayları (29): bt.meteor … bt.defeat (crit, resist, stun, freeze, poison, burn, tick.*, death, revive, boss, phase, victory, defeat…)
- Ortam (31): amb.* (gün/gece iki halk, hava: yağmur/rüzgâr/sis, portal, savaş, başlık, pazar, iç mekânlar han/ahır/örs/maden/klan, bölgeler zkuyu/zyarik/zmuhur/zkule/zocak)
- Sentez müzik: mus.hub.ocak, mus.hub.sancak, mus.battle

**Teslim edilmeyen (P34-11):** bölgesel müzik dosyaları, ortam kayıtları, NPC sesleri. Gemini manifestinde `ses: []`. Ortam sesleri bugün yalnız sentezle var.

## 3. Dinleme kontrol listesi (kullanıcı dolduracak)

Her satır için: ✅ kabul · ⚠️ düzeltilsin (not) · ❌ reddedildi. Telefonda, kulaklıkla ve hoparlörle ayrı ayrı.

| # | Nerede | Ne dinlenecek | Sonuç | Not |
|---|---|---|---|---|
| 1 | Açılış/yükleme | intro.mp3 başlıyor mu, ana ekrana geçişte kesilmeden soluyor mu | | |
| 2 | Ana ekran (Kragmir) | arka-plan.mp3 döngü noktası duyulur mu; ses düzeyi | | |
| 3 | Ana ekran (Elentha) | aynı dosya; iki halkta aynı müziğin uygunluğu | | |
| 4 | Fragman | kizil-goz.mp3 görüntüyle eşleşiyor mu | | |
| 5 | Patron savaşı | boss.mp3 girişi, savaş bitince kesilme/solma | | |
| 6 | Sıradan savaş | sentez savaş müziği (mus.battle) rahatsız edici mi | | |
| 7 | Arayüz | dokunma, sekme, aç/kapat, hata sesi: çok sık/yüksek mi | | |
| 8 | Ödül/seviye | ui.reward, ui.levelup, ui.chest, rar.0–2 ayırt ediliyor mu | | |
| 9 | Örs | strike/ok/fail/break farkı anlaşılıyor mu | | |
| 10 | Savaş efektleri | vuruş, kritik, büyü, ölüm, zafer/yenilgi | | |
| 11 | Ortam | gün/gece, yağmur, iç mekânlar (han/ahır/maden) | | |
| 12 | Ayarlar | müzik/efekt kaydırıcıları ve sessiz kip gerçekten etkili mi | | |
| 13 | Arka plana alma | uygulama arka plana gidince ses duruyor mu, dönünce geri geliyor mu | | |

Dinleme yapılmadan F-023 kapatılmaz.
