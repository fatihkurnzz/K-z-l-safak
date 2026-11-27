# Korant · 3B Savaş Faz 1 · Ortak Teknik Standart (sürüm 1, 27.11)

Hazırlayan: Opus (3B teknik entegrasyon sorumlusu). Taban: V42 (`claude/add-skill-repos-rne7at`, taban commit `c0aa487`).
Bu belge Gemini, GPT ve Fable'ın 3B savaş teslimlerinin **koda dokunmadan** kabul edilebilmesi için ortak kuralları tanımlar.

---

## 1. Mimari (tek bakışta)

```
combat.js (DEĞİŞMEDİ) ── runBattle ─┬─ savas-birim2d.onYukle(units) ──► savas3d/ayar3d.savasKarari(units)  → B3D.aktif
                                    ├─ place(u): b2dOf(u)  ── 3B aktifse null döner (2B birim kurulmaz)
                                    │            spawn()   ── world.js: B3D.aktif → savas3d/birim3d.birim3dYap() → Birim3D
                                    └─ KAM.focusSkill/Attack/Boss ── savas-kamera.js: K.ek → savas3d/kamera3d.js (RAID çekimleri)
shared/ (DEĞİŞMEDİ): savaş kuralı, tohum, hasar, sonuç. 3B katmanı yalnız çizer, savaş durumuna YAZMAZ.
```

| Dosya | Görev | Durum |
|---|---|---|
| `js/savas3d/ayar3d.js` | Açma/kapama bayrağı, cihaz uygunluğu, savaş başına 3B kararı, ön yükleme | yeni |
| `js/savas3d/varlik3d.js` | `models/b3d/models3d.json` okur; glTF/GLB/.glb.js indirir; klipleri kemik adına eşler, yerinde tutar; önbellek | yeni |
| `js/savas3d/birim3d.js` | `Birim3D`: iskeletli model + 11 klip + soketler + silah; combat arayüzü | yeni |
| `js/savas3d/silah3d.js` | Kodla PBR silah/kalkan (kılıç, hançer, topuz, asa, sopa, yay, kalkan) | yeni |
| `js/savas3d/kamera3d.js` | RAID tarzı sinematik çekimler (yalnız 3B savaşta) | yeni |
| `models/b3d/models3d.json` | 3B manifest (modeller + birim eşlemesi) | yeni |
| `js/world.js` | spawn kancası, sahne temizlenince 3B kararını sıfırlama | yama 01 |
| `js/savas-birim2d.js` | `onYukle` → savaş kararı; `cozum` 3B savaşta null; `cozumHam` (portre) | yama 02 |
| `js/savas-kamera.js` | `K.ek` eklenti kancası, `K.api` iç yardımcılar, `KAMERA` dışa aktarımı | yama 03 |

**Geri alma:** `git apply -R _tasarim/3d-faz1/yamalar/0*.patch` + `js/savas3d/` ve `models/b3d/` klasörlerini silmek. Yamalar 3B kapalıyken (varsayılan) davranışı değiştirmez.

## 2. Açma / kapama ve geri dönüş kuralları

| Ayar | Anlamı |
|---|---|
| `?b3d=1` / `?b3d=0` | adres (önceliklidir) |
| `localStorage dd_b3d = '1' / '0'` | kalıcı; `ayar3d.b3dAyarla(bool)` yazar (Ayarlar düğmesi bağlanacaksa bunu çağırsın) |
| varsayılan | **KAPALI** (kullanıcı kabulüne kadar) |
| `?b3dkam=0` / `dd_b3dkam='0'` | sinematik kamerayı kapatır (3B birimler kalır) |

Savaş **bütünüyle 2B** açılır (karışık görünüm yok) eğer: grafik kademesi `min`/`low`; WebGL bağlamı yok/kayıp; savaştaki herhangi bir birimin `birimler` kaydı yok; gereken model/klip dosyası inmemiş ya da inemedi; Anıt Savaşı. Karar nedeni: `window.DD_B3D.neden`. Birim tek tek kurulamazsa (istisna) o birim eski 3B zincirine (`createSkinned` / prosedürel) düşer ve `DD_B3D.sayac.dusme` artar.

## 3. Birim arayüzü (combat.js sözleşmesi) — her yeni birim sınıfı bunu taşımalı

```
alanlar : root (THREE.Group), pos (= root.position), scale, fx, weaponKind, dead, combatTarget, arcTint
konum   : headPos()/headTo(v), chestPos()/chestTo(v), handPos(), face(vec3)
hareket : async moveTo(vec3, dur), swing(), whirl(), castSpell(), raiseArms(), shoot(), stomp()
          hit(fromVec3, heavy), async die(), revive(face, home), cheer(), relax(), ready()
döngü   : update(dt, t), dispose()   ← dispose birime ait her GPU kaynağını bırakmalı
```
Promise dönen hareketler **darbe anında** çözülür (klip süresi × `darbe[klip]`); combat.js hasarı o an uygular.

## 4. Manifest şeması — `models/b3d/models3d.json`

```jsonc
{
 "surum": 1,
 "klipler": { "idle": "anims/idle.json", ... 11 klip ... },      // ortak klipler (models/ köküne göre)
 "onYukle": ["paladin", "goblin"],                                // 3B açıksa açılıştan ~8 sn sonra boşta iner
 "modeller": {
  "<model>": {
   "dosya": "b3d/<model>/<model>.glb",       // .glb | .gltf | .json (glTF) | .glb.js (base64 modül)
   "boy": 2.3,                                // ölçek 1'de metre (kahraman 2.3)
   "olcek": 1,                                // isteğe bağlı ek çarpan
   "kemikOnEki": null, "kemikHaritasi": { "Hips": "Pelvis", ... },  // model ortak adları kullanmıyorsa
   "klipler": { "attack": "b3d/<model>/attack.json" },              // isteğe bağlı: modele özel klip (ortak klibi ezer)
   "darbe": { "attack": 0.45 },                                     // isteğe bağlı: vuruş anı oranları
   "hiz": { "attack": 1.1 },                                        // isteğe bağlı: klip hızı
   "kemik": { "bas": "Head", "gogus": "Spine2" },
   "malzeme": { "parlak": 1, "metal": 0.3, "puruz": 0.6, "normal": 1, "kendi": 0.12, "kenar": 0.35, "kenarRenk": "#9fb8ff", "ortam": 1 },
   "soket": {
    "sag": { "kemik": "RightHand", "konum": [-0.09, -0.02, 0], "donus": [1.5708, 0, 0] },
    "sol": { "kemik": "LeftHand",  "konum": [ 0.09, -0.02, 0], "donus": [1.5708, 0, 0], "kalkan": { "konum": [..], "donus": [..] } }
   },
   "govdeSilahli": false,                     // silah gövde ağının parçasıysa true (kod silah takmaz)
   "butce": { "ucgen": 15000, "kemik": 70, "doku": 1024 }
  }
 },
 "birimler": {                                // anahtar sırası: kahraman:<sınıf>:<halk> → kahraman:<sınıf> ; yaratik:<mob kimliği>
  "kahraman:warrior:sancak": { "model": "paladin", "sag": "kilic", "sol": "kalkan", "fxTur": "sword" },
  "yaratik:goblin_necromancer": { "model": "goblin", "sag": "asa", "tas": "mor", "ton": "#d0b0ff", "olcek": 1.0, "fxTur": "staff" }
 }
}
```
- Sınıf kimlikleri: `warrior`, `rogue`, `mage`, `priest`; halk: `sancak` (Elentha), `ocak` (Kragmir). Yaratık kimlikleri `shared/zones.js` / bestiary.
- `sag`/`sol`: `kilic | hancer | topuz | asa | sopa | yay | kalkan` ya da `false` (boş el). `tas`: asa taşı `mor|yesil|mavi|kizil`.
- `fxTur`: efekt tablosunun silah türü (`sword|dagger|mace|staff|club|bow`).

## 5. Varlık standartları (Gemini/GPT/Meshy teslimleri)

**Dosya yeri ve adı:** `models/b3d/<model>/<model>.glb` (küçük harf, Türkçe karaktersiz, `_` ile). Dokular GLB içinde gömülü. Yayın sınırı için model başına **tek dosya**.

| Tür | Üçgen | Kemik | Doku (en uzun kenar) | Dosya |
|---|---|---|---|---|
| Kahraman | ≤ 15 000 | ≤ 70 | 1 × 1024 renk (+ isteğe bağlı 1024 normal) | ≤ 1,5 MB |
| Sıradan yaratık | ≤ 8 000 | ≤ 70 | 1024 | ≤ 0,8 MB |
| Boss | ≤ 25 000 | ≤ 80 | 2048 | ≤ 2,5 MB |
| Silah (GLB verilirse) | ≤ 1 500 | 0 | 512 | ≤ 0,3 MB |
| Sahne toplamı | ≤ 150 000 | – | – | ≤ 60 çizim çağrısı |

Ölçülen V42 değerleri: paladin 14 660 üçgen / 67 kemik / 512² doku; goblin 13 276 / 69 / 512²; 1-11 savaşı 3B'de 104 çizim çağrısı, 112 bin üçgen (yüksek kademe, gölge dahil; 2B'de 77 / 103 bin). Çizim çağrısı hedefin üstünde → Faz 2: silah ağlarını birleştirme, gölgeyi yalnız kahramanda.

**Geometri kuralları (glTF):** +Y yukarı, +Z ileri (yüz), ayak tabanı y=0, metre; A- ya da T-pozu dinlenme duruşu; tek iskelet; köşe başına ≤ 4 kemik etkisi; **Draco / meshopt / KTX2 YOK** (oyunda çözücü yok; `butce.mjs` uyarır). Malzeme: metallic-roughness PBR; ışık dokuya gömülmemiş (düz ışık).

**İskelet:** ortak ad seti Mixamo (`mixamorig:Hips … RightHand, LeftHand`). Zorunlu 20 kemik `arac/donustur.py ZORUNLU`. Farklı adlar `donustur.py` ile çevrilir ya da manifestte `kemikHaritasi` verilir.

**11 ortak klip (ad = sözleşme):** `idle, combatIdle, run, attack, special, cast, cast2, shoot, hit, death, victory`. Meshy animasyonuna kredi harcanmaz; klipler `models/anims/*.json`.

| Hareket (combat) | Klip | Darbe anı |
|---|---|---|
| bekleme / savaş beklemesi | idle / combatIdle | – |
| moveTo | run | – |
| swing (yakın dövüş) | attack | 0,45 |
| whirl, stomp | special (yoksa attack) | 0,55 |
| castSpell | cast (yoksa attack) | 0,55 |
| raiseArms (şifa, güçlendirme, meteor) | cast2 (yoksa cast) | 0,50 |
| shoot (yay) | shoot (yoksa cast/attack) | 0,60 |
| hit / die / cheer | hit / death / victory | – |

**Silah yerel uzayı (kodla ya da GLB):** başlangıç noktası = kavrama noktası; uzun eksen +Y; ağız ±X; düz yüz +Z; metre. Kalkan: başlangıç = kol sapı, ön yüz +Z. Soket `donus` bu yerel uzayı elin T-pozundaki model uzayına çevirir (varsayılan `[π/2,0,0]`: namlu ileri).

**Soket adları:** `sok_sag`, `sok_sol` (çalışma anında el kemiklerine eklenir; modelin içine konması gerekmez).

## 6. Kalite kademeleri ve mobil

| Kademe | 3B savaş | Gölge | Not |
|---|---|---|---|
| min (En Düşük) | 2B | – | |
| low (Düşük) | 2B | – | kabul ölçütü 11 |
| mid (Orta) | 3B | 1024, iki karede bir | dpr ≤ 1,5 |
| high (Yüksek) | 3B | 2048 | dpr ≤ 2 (telefon 2,66 → 2) |

Kare süresi denetçisi (gfx.js) kademeyi düşürürse sonraki savaş kendiliğinden 2B açılır. Telefonda savaş 30 FPS sınırlıdır (engine3d `FPS_CAP.battleLow`). **Gerçek telefonda ölçüm yapılmadı.**

## 7. Kamera (kamera3d.js `SINEMA`)
`YAW_MAX 0,38 rad` (boyalı arka plan projektörden çizildiği için açı sınırlı), `dMin 4,2`, geniş güvenli alan. Çekimler: saldırı (vuran+hedef), yetenek 2 vuruşlu, usta yetenek 3 vuruşlu, boss alttan → geniş. Sayaçlar `window.DD_B3D_KAM.sayac`.

## 8. Teslim kuralları (her yapay zekâ)
1. ZIP ≤ 30 MB; içinde `manifest.json` (her dosya: yol, SHA-256, bayt, yeni/değişti).
2. Ortak dosyaya değişiklik → `yamalar/NN_<dosya>.patch` (git diff), doğrudan üzerine yazma yok.
3. Model teslimi: `<model>.glb` + `butce.mjs --json` çıktısı + vitrin ekran görüntüleri (T-pozu, 11 klip ızgarası).
4. `combat.js` ve `shared/` için git farkı 0 olmalı.
5. Yapılmayan/denenmeyen açıkça yazılır.

## 9. Fable için uyarlama (V49+)
Yalnız üç kanca noktası var (yamalar 01–03). V49'da `world.js spawn`, `savas-birim2d.js cozum/onYukle/portre`, `savas-kamera.js focus*` değiştiyse yama elle uygulanır; `js/savas3d/` ve `models/b3d/` olduğu gibi kopyalanır. combat.js'in birim arayüzü (§3) değiştiyse `Birim3D`'ye aynı yöntem eklenir.
