# Korant · 3B Savaş Faz 1 · Opus bağımsız plan denetimi (27.11)

**KARAR: REVİZE.** Hedef doğru, ama bütçe dağılımı ve bazı varsayımlar yanlış. Üretime başlamadan önce tek modelle pilot yapılmalı.

## Depoda doğrulanan gerçekler
| Planda | Oyunun verisinde | Sonuç |
|---|---|---|
| Savaşçı kılıcı | Savaşçı: `sword`, `axe2`, `shield` (content.js) | Doğru; kalkan da gerekli |
| Suikastçı hançeri | Suikastçı: `dagger` ve `bow` (Yay ağacı 13 yetenek) | **Yay eksik** |
| Büyücü asası | Büyücü: `staff` | Doğru |
| Rahip topuzu | Rahip: `mace` + `shield` | Doğru; kalkan gerekli |
| Bandikut | `bandicoot` ailesi, Bölge 1 Blok 1 (6 tür, renk/boy farkıyla) | Doğru, yüksek getiri |
| **Kül Kurdu** | Ayrı yaratık DEĞİL. Yalnız öğretici savaşında `small_bandicoot`'un görünen adı (`js/orman.js`) | **Tek savaş için kredi harcanmaz** |
| Tepegöz | `tepegoz`: Bölge 1, klan avı etkinlik bossu, **iki ayaklı insansı** (sopa, dişler, ölçek 2,1) | İnsansı iskelet ve animasyonlarla çözülür; ucuz |
| Lav Yürek | `lavyurek`: **Bölge 4** etkinlik bossu, iki ayaklı, sopa, ışıyan kabuk | Faz 1 dilimine girmez; ertele |
| Yalnız Elentha | Oyuncuların yarısı Kragmir | Kragmir savaşları Faz 1'de 2B kalır (bilinçli karar olarak yaz) |

Mevcut 3B altyapı: three.js r160 gömülü; `js/skinned.js` zaten GLTFLoader + FBXLoader + SkeletonUtils + AnimationMixer ile Mixamo iskeletli model çiziyor; `models/anims/` altında **11 ortak klip** (idle, combatIdle, run, attack, special, cast, cast2, shoot, hit, death, victory) `mixamorig:*` kemikleriyle duruyor; dosyalar glTF-Transform ile üretilmiş. Kahramanlarda kapalı (`gorunus.js SKINNED_HERO=false`), çünkü eski hazır modeller görsel olarak zayıftı. Yani "bağımsız 3B katman" sıfırdan yazılmayacak; var olan `Character` arayüzü (swing / castSpell / hit / die / cheer) ve `skinned.js` genişletilecek. `combat.js` ve `shared/` değişmez.

Konteynerde doğrulandı: **başsız Blender (`bpy` 5.3) PyPI'dan iniyor**, Node 22 ve npm var (glTF-Transform kurulabilir). Yani kullanıcının Blender'ı olmasa da dönüştürme, küçültme, kemik adlandırma, animasyon aktarma, silah yuvası ekleme işleri bu bulut oturumunda betikle yapılabilir.

## 12 sorunun cevabı
1. **Dağılım doğru değil.** 4 silaha kredi harcamak israf: kılıç, hançer, asa, topuz katı cisimdir, iskelet istemez; kodla ya da başsız Blender betiğiyle (döndürme/çekme geometrisi + PBR) kaliteli yapılır. Kül Kurdu ayrı yaratık değil. Lav Yürek Bölge 4'te. Kalkan ve yay unutulmuş.
2. **Evet, ama Blender'ı kullanıcı değil bu oturum çalıştırır.** Meshy GLB/FBX → başsız Blender: kemikleri `mixamorig` adlarına eşle, 11 klibi aktar (gerekirse three `SkeletonUtils.retargetClip`), el kemiğine `sok_sag`/`sok_sol` boş düğümü ekle, ağı küçült → glTF-Transform: meshopt, dokuları WebP/1024'e indir. Yapamadığım: Meshy uygulamasını kullanmak, Mixamo'ya giriş yapmak, gerçek telefonda FPS ölçmek.
3. **Büyük olasılıkla evet; ilk iş bunu uygulamada doğrula.** Kaynaklar çelişiyor: ücretsiz planda indirmenin sınırlı/dokusuz olduğu ya da Meshy 6 çıktısının hiç indirilemediği yazıyor; dokulu üretim ve otomatik iskelet ayrıca kredi tutabiliyor (API'de iskelet ~5 kredi). 250 kredi ücretsiz planın aylık 100'üyle uyuşmuyor; planınızı ve şu üç fiyatı ekranda görün: dokulu görsel→3B, iskelet, indirme. Doku +10 ise 12 model zaten sığmaz.
4. **Evet, ve zorunlu olmalı.** Dört sınıf tek insansı iskelet (Mixamo adlı 65 kemik) + aynı 11 klip. Sınıf farkı klip seçimi ve hızla verilir (rahip/büyücü `cast`, suikastçı `shoot` yay için). Pelerin/etek iskeleti bozar: model görsellerinde pelerin olmasın, gerekirse kodla ayrı kumaş parçası.
5. Meshy'de dört ayaklı ("Quadruped Dog") iskelet var, ama hazır animasyon az. Çözüm: Meshy dört ayaklı iskelet + benim betikle yazacağım 5 klip (bekleme nefesi, yürüyüş, atılıp ısırma, sarsılma, devrilme). Dört ayaklı yürüyüş çevrimi betikle yapılabilir, kalitesi "orta-iyi" olur, bunu baştan kabul edin. Ücretsiz seçenek: CC0 animasyonlu hayvan paketleri (ör. Quaternius) kurt için — üslup uyarsa kredisiz.
6. **Kalkan: evet**, kodla iyi olur (çekme gövde + kenar + göbek + G8 amblem dokusu). **Arena: tam kodla RAID seviyesi olmaz.** Gerçekçi yol karma: mevcut boyalı savaş arka planı uzak fon; 3B zemin = GPT'den dikişsiz PBR doku + kodla taş/sütun/ağaç kümesi + sis + yönlü ışık + gölge diski. Bu, telefonda da hızlı olur.
7. **Sınırlar:** kahraman ≤15 bin üçgen, 1×1024² renk + (isteğe bağlı) 1024² normal, metal/pürüz tek değer ya da 512² ORM; ≤65 kemik, köşe başına 4 ağırlık; sıkıştırılmış ≤1,5 MB. Sıradan yaratık ≤8 bin üçgen, 1024², ≤40 kemik, ≤0,8 MB. Boss ≤25 bin üçgen, 2048² renk, ≤2,5 MB. Silah ≤1,5 bin üçgen, 512². Sahne toplamı ≤150 bin üçgen, ≤60 çizim çağrısı, piksel oranı 3B kipte en çok 1,5 (telefon dpr 2,66). Dosya sınırı: yayında sürüm başı 511 dosya, dosya başı 16 MB → her model tek .glb (dokular içinde).
8. **İlk üretimden önce:** (a) plan/indirme/lisans ve tam kredi fiyatları; (b) model görseli hazırlığı: tek figür, düz ışık, A-duruşu, önden + yandan + arkadan, **elinde silah yok**, pelerin yok, düz arka plan (mevcut 2B pozlar silahlı ve hareketli → doğrudan verilmemeli; GPT'den "model sayfası" istenmeli); (c) çok görselli giriş destekleniyor mu ve fiyatı; (d) aynı görseli önce ücretsiz bir görsel→3B denemesinde sınamak (Hugging Face'teki TRELLIS / Hunyuan3D alanları, erişim değişken); (e) **pilot: yalnız Elentha savaşçı**, bana GLB gönderilir, ben hattı uçtan uca çalıştırıp ekran çekimi + ölçü raporu veririm; geçerse kalan krediler harcanır.
9. **three.js.** Zaten gömülü (r160), iskelet/animasyon kodu ve 2B birim aynı arayüzle yazılmış. Babylon.js ikinci bir motor (~2 MB+), ikinci WebGL bağlamı ve her şeyin yeniden yazılması demek; getirisi yok. three r160'ta GLTFLoader, meshopt çözücü, KTX2 yükleyici, SkeletonUtils hazır.
10. **Fable'a verilecekler:** `savas-birim3d.js` arayüz şartnamesi (2B birimle aynı yöntemler), `models3d.json` şeması (dosya, kemik eşlemesi, klip adları, soket adları, ölçek, ton), başsız Blender dönüştürme betiği + glTF-Transform ayarı, test sahnesi (`?b3d=1&stage=1-1`), bütçe denetleyicisi (üçgen/kemik/doku/boyut sayan betik), geri dönüş kuralı. Bunları Faz 1 onayından sonra ben yazabilirim.
11. **En büyük riskler:** (1) indirme/lisans engeli — önce doğrula; (2) boyalı 2B sanattan üretilen modelde ışığın dokuya gömülmesi, yüzün bulanık, silahın gövdeye kaynaması — model sayfası ve pilotla azaltılır; (3) dört ayaklı animasyon kalitesi; (4) 3B birimlerin boyalı arayüz/portrelerle üslup çatışması; (5) telefonda iskeletli PBR + parçacık yükü (gerçek cihazda ölçülmeli, başsız Chromium FPS'i anlamsız); (6) ilk savaşta yükleme süresi; (7) Kragmir kapsamı. Ücretsiz seçenekler: Mixamo (iskelet + animasyon, Adobe hesabı; telefonda masaüstü sitesiyle zor), CC0 paketler, TRELLIS/Hunyuan3D, betikle silah/kalkan/arena.
12. **Evet, rezerv şart:** en az 2 üretimlik (~50 kredi). Pilot geçmeden kalan kredileri harcamayın.

## Düzeltilmiş üretim planı (doku dahil 20 + iskelet 5 kredi varsayımıyla; fiyat farklıysa yeniden hesapla)
| Sıra | Model | Kredi | Not |
|---|---|---|---|
| 1 | Elentha Savaşçı (PİLOT) | 25 | Geçmezse dur |
| 2 | Elentha Rahip | 25 | |
| 3 | Elentha Büyücü | 25 | |
| 4 | Elentha Suikastçı | 25 | |
| 5 | Bandikut (dört ayaklı) | 25 | 6 tür renk/boyla; Kül Kurdu öğretici görünümü de bundan (kor ışıması kodla) |
| 6 | Tepegöz (insansı) | 25 | ortak insansı klipler + boss ölçeği |
| 7 | Azman Kurt ailesi (dört ayaklı) | 25 | Bölge 1 Blok 5; CC0 kurt uyarsa kredisiz |
| — | Rezerv | 75 | 3 tekrar hakkı; kullanılmazsa Faz 2 (Lav Yürek / Kül Ağası Karadun) |
| — | Kılıç, kalkan, hançer, yay, asa, topuz | 0 | kod / başsız Blender |
| — | Arena (Vahran Ovası) | 0 | karma: boyalı fon + 3B zemin + kod sahne parçaları |
Toplam harcama 175, rezerv 75.

Faz 1 kapsamı: **Elentha, Bölge 1, Blok 1 savaşları (1-1…), öğretici dövüşü, Tepegöz.** Bir savaşta herhangi bir birimin 3B modeli yoksa savaşın tamamı 2B çizilir (karışık görünüm yok).

## Görev dağılımı
- **Kullanıcı:** Meshy'de plan/fiyat doğrulaması, üretimler, GLB indirme, gerçek telefonda FPS ve ısınma ölçümü.
- **GPT:** dört sınıf için A-duruşu model sayfaları (ön/yan/arka, silahsız, pelerinsiz, düz ışık), bandikut/kurt/Tepegöz yan ve ön görünüşleri, dikişsiz zemin dokuları, kalkan amblem dokuları.
- **Gemini:** model sayfalarını özgün 2B tasarımla karşılaştırma (silüet, renk, zırh), Meshy çıktısının sanat kabulü.
- **Opus/Fable (kod):** dönüştürme hattı, iskelet/klip aktarma, soketler, silah/kalkan/arena kodu, `savas-birim3d.js`, geri dönüş, testler.

## Kabul ölçütleri
- Model: bütçe sınırları içinde; 11 klip kopmadan oynuyor; el soketinde silah 5 klipte de elden kaymıyor; yüz ve zırh renkleri model sayfasıyla Gemini onayından geçmiş.
- Savaş: `combat.js` ve `shared/` değişmemiş (git farkı 0); aynı tohumla 2B ve 3B savaşın sonucu birebir aynı; HUD ölçümleri 880×406'da önceki değerlerle aynı.
- Performans: kullanıcının telefonunda 1-1 savaşında ≥30 FPS ortalama, 5 dk sonra ≥27; ilk 3B savaş yüklemesi ≤4 sn.
- Geri dönüş: WebGL hatası, model yüklenemezse ya da `?b3d=0` / Grafik: Düşük ise aynı savaş 2B açılır, oyuncu hata görmez.
- Yayın: dosya sayısı ≤511, tek dosya ≤16 MB.
