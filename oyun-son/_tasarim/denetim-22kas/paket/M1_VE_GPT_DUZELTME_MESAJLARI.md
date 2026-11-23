# M1 kabul denetimi ve GPT düzeltme mesajları (23 Kasım)

Bu belge iki yapıştırılabilir mesaj ve kısa bir yol haritası içerir. Önce bölüm 1'i Gemini'ye, bölüm 2'yi GPT'ye gönder. Bölümler arasındaki çizgiler mesajın parçası değildir.

---

## 1. Gemini'ye: GÖREV M1 (kabul denetimi)

**Yapıştırmadan önce:** Gemini sohbetine `GEMINI_NEON_4_GOREVLERI.md` içindeki **ortak bölümü** ekle (yasaklar, tarz, ölçüler). Ardından aşağıdaki mesajı yapıştır. Her mesajda yalnız **bir ZIP** ver.

**Gerekli ekler:**
- `REFERANS.zip` (içinde `01_ONAYLI_TARZ` klasörü bulunur)
- `01_ONAYLI_TARZ` klasörü (ayrıca açık; karşılaştırma ölçüsü bu)
- Denetlenecek GPT ZIP'i ve içindeki `manifest.json`: G1, G2, G3 (5 ZIP), G4, G5, G6, G7, G8
- `Korant_Online_Guncel_01…06.zip` (G1, G2, G4, G5, G7, G8 için; hangi teslimin hangi pakette olduğu manifestte yazar)
- `Korant_Online_G6.zip` (yetenek simgeleri)
- G3'ün 5 ZIP'i (her biri ayrı mesajda)

### Mesaj

```
GÖREV M1 · GPT teslimlerinin bağımsız kabul denetimi

Ekler: GPT'nin teslim ZIP'i (ya da içindeki görseller ve manifest.json) ve REFERANS.zip (01_ONAYLI_TARZ dahil).

Ne yapacaksın: Teslimdeki her görseli tek tek aşağıdaki 8 ölçüte göre puanla. Her ölçüt için 0 (yok), 1 (kısmen) veya 2 (tam) ver.

1. Tarz eşleşmesi: 01_ONAYLI_TARZ görsellerinin yanında aynı ekipten çıkmış gibi mi? Fırça dokusu, kontursuzluk, ışık.
2. Işık: sol üstten sıcak anahtar ışık, sağdan soğuk dolgu var mı?
3. Kimlik: karakter ya da yaratık referansıyla aynı mı (yüz, saç, zırh, renk)? Halk kimliği doğru mu?
4. Yasak yok: fotoğraf gerçekliği, çizgi film, düz vektör, kontur, görselde yazı, başka oyuna benzerlik var mı?
5. Okunurluk: 880×406 ekranda gerçek boyutuna küçültüldüğünde (kahraman yaklaşık 260 px boy, yaratık 200 px, simge 48 px) siluet ve sınıf hâlâ anlaşılıyor mu?
6. Teknik: saydam zemin gerçek mi, kenarda halo var mı, ölçü manifestle aynı mı, zemin çizgisi tutarlı mı?
7. Poz tutarlılığı: aynı karakterin pozları üst üste konduğunda ölçek ve ayak noktası sabit mi?
8. Eşlik: iki halkın eşi ve bütün pozlar eksiksiz mi?

Karar kuralı:
- Toplam 13 ve üzeri ve hiçbir ölçüt 0 değil → KABUL.
- Toplam 10–12 → DÜZELTME: neyin düzeltileceğini somut yaz. Örnek: "sağ kolun gölgesi sağdan düşüyor, sola al". "Daha iyi yap" gibi genel ifadeler kullanma.
- Toplam 10'un altında ya da 4. ölçüt 0 → RET.

EK KURALLAR (bu denetime özel):

A) Teknik kabulü Claude zaten yaptı: biçim, alfa kanalı, ölçü, zemin çizgisi, hale (halo), halk eşliği ve dosya sayısı denetlendi. Sen 6. ve 8. ölçütleri yalnız gözle fark ettiğin açık bir sorun varsa düşür; piksel piksel teknik denetim yapma. Asıl işin TARZ, KİMLİK ve OKUNURLUK (ölçüt 1, 2, 3, 4, 5, 7). Bu ölçütlere zaman ayır.

B) ORK/KRAGMIR TENİ YEŞİL olmalı. Kragmir kahramanları, orksu yaratıklar ve orksu NPC'ler gri, kahverengi ya da insan teni renginde ise ölçüt 3'ten (kimlik) puan kır ve bunu "somut düzeltme" sütununa yaz. Ton: doygunluğu düşük, doğal zeytin-orman yeşili; neon yeşil değil.

C) BİLİNEN SORUNLAR: aşağıdakileri yeni bulgu olarak sayma, ama ilgili dosya satırında "bilinen" diye tabloda belirt ve puanı buna göre ver:
   - G1: Elentha kadın savaşçı `buyu` pozunda yüz diğer pozlardan farklı.
   - G2: 5 sette (sancak-buyucu-kadin, sancak-savasci-erkek, ocak-savasci-kadin, ocak-sifaci-erkek, ocak-suikastci-kadin) opak beyaz zemin yamaları var (kodla temizlendi).
   - G5: dunya-baskini sahnesinde Kül Ağası Karadun silüeti yok.
   Bunların dışında bir sorun görürsen yeni bulgudur.

D) DENETİM SIRASI ve ZIP SAYISI: Her mesajda yalnız bir ZIP gelecek. Sıra:
   1. G1 + G2
   2. G4 + G5
   3. G6 + G7 + G8
   4. G3 (5 ZIP, her biri ayrı mesajda)
   Her ZIP için ayrı tablo ve ayrı karar ver. Çok dosyalı ZIP'lerde (G3, G6) tür başına örnekleme serbest: bir ailenin 3 pozunu denetlemen ve aynı ailenin kalan türlerinde yalnız renk/aksesuar tutarlılığına bakman yeter. Hangi dosyaları örneklediğini tabloda belirt ("örneklendi: ...").

Teslim biçimi (yalnız bu tabloyu ve sonunda kısa bir özeti yaz):

| dosya | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | toplam | karar | somut düzeltme |
|---|---|---|---|---|---|---|---|---|---|---|---|

Sonuna şunları ekle:
1. GPT'ye gönderilecek düzeltme mesajı: kopyalanıp doğrudan yapıştırılabilir, yalnız düzeltilecek dosyaları ve düzeltmeleri içeren kısa bir metin.
2. Bütün paket için tek satırlık genel karar.

Emin olmadığın bir noktada tahmin etme; açıkça "DOĞRULANAMADI" yaz ve nedenini söyle.
```

---

## 2. GPT'ye: tek düzeltme mesajı

**Yapıştırmadan önce:** GPT sohbetine `GPT_ASTRA_6.2_GOREVLERI.md` içindeki **ORTAK BÖLÜM'ü** yapıştır (tarz, yasaklar, teknik kurallar, kendi kendini denetleme tablosu). `REFERANS.zip` ve Gemini M1 kararlarıyla birlikte gelen örnek görselleri de ekle. Mesaj uzun olursa G3 maddesini ayrı bir sohbette gönder (G3 ayrı sohbette, bölge bölge zaten isteniyordu).

### Mesaj

```
DÜZELTME PAKETİ · önceki tesliminde yalnız aşağıdaki dosyalar yenilenecek. Başka dosyaya dokunma. Dosya adlarını ve ölçüleri aynen koru; yalnız belirtilen sorunu düzelt.

1) ORK TENİ YEŞİL (G1, G2, karakter oluşturma)
Kragmir halkının tüm kahramanları ve karakter oluşturma ekranındaki Kragmir tam boy ve yüz görselleri yeşil tenli olmalı. Şu an gri görünüyor. Ton: doygunluğu düşük, doğal zeytin-orman yeşili (neon değil); gölgede koyu yeşil, ışıkta sarıya çalan yeşil. Zırh, silah, saç, yüz hatları ve poz aynen kalsın; yalnız deri rengi değişsin.
- G1: kahraman-ocak-savasci-erkek-* (7 poz + bekleme-alternatif)
- G2: bütün Kragmir (ocak) kahramanlar, 7'şer poz: ocak-savasci-kadin, ocak-suikastci-erkek ve kadın, ocak-buyucu-erkek ve kadın, ocak-sifaci-erkek ve kadın (yani "kahraman-ocak-*-*-<poz>.png" ile başlayan her dosya)
- Karakter oluşturma: Kragmir için üretilmiş tam boy ve yüz (512×512) görsellerinin hepsi
Önce her sınıf için tek bir örnek poz göster; ton onaylandıktan sonra kalanları üret. Onay beklemeden bütün set gelirse de olur, ama ton bütün sette aynı olmalı.

2) G1 · Elentha kadın savaşçı `buyu` pozu
Dosya: kahraman-sancak-savasci-kadin-buyu.png
Sorun: yüz diğer pozlardaki kadın savaşçıdan farklı. Referanstaki `elentha_savasci_kadin` yüzünü, saçını ve zırhını bu pozda da birebir koru. Poz aynı kalsın (bir el ileri uzanmış, avuçta boş alan). Ayak noktası ve ölçek diğer 6 pozla aynı olmalı.

3) G2 · Beyaz zemin yamaları olan 5 set: gerçek alfa ile yeniden ver
Bu 5 setin her biri 7 pozla (bekleme, saldiri-hazirlik, saldiri-vurus, buyu, vurulma, yere-dusus, zafer) yeniden gelecek, toplam 35 dosya:
- kahraman-sancak-buyucu-kadin-*
- kahraman-sancak-savasci-erkek-*
- kahraman-ocak-savasci-kadin-*
- kahraman-ocak-sifaci-erkek-*
- kahraman-ocak-suikastci-kadin-*
Sorun: bu dosyalarda zemin opak beyaz yamalar halinde kalmış. Zemin GERÇEKTEN saydam olmalı (alfa kanalı). Dama deseni, beyaz ya da gri zemin, kenarda beyaz hale olmamalı. Teslimden önce her dosyayı koyu zemin üstünde kendin kontrol et. (Ocak setleri yukarıdaki yeşil ten düzeltmesiyle birlikte tek seferde üretilsin.)

4) G5 · dunya-baskini sahnesi
Dosya: dunya-baskini (G5'teki ad kalıbıyla). Sahnede Kül Ağası Karadun'un silueti yok. Uzak planda, sis ve külün içinde, ayakta duran iri bir silüt olarak ekle: uzun kül rengi pelerin, solgun kor parıltılı gözler, elinde uzun asa. Önde değil; sahnenin ana ağırlığını bozmasın, ışık yönü (sol üst sıcak) ve renk (soluk, küllü, doygunluğu düşük) sahneyle uyumlu olsun. Görselde yazı olmasın.

5) G3 · Çizimsiz kalan 13 yaratık
Aşağıdaki türler hâlâ yok. Her biri 3 pozla (bekleme, saldiri, vurulma) gelecek, 39 dosya. G1 bölüm 3'teki tuval, zemin çizgisi, sağa değil SOLA bakış (yaratık savaşta sağda durur, oyuncuya doğru) ve ad kalıbı (yaratik-<tur>-<poz>.png) aynen geçerli:
- falcon (şahin)
- hornet (eşek arısı)
- gargoyle
- leader_of_barbarian (barbar lideri; insansı, savaşçı)
- lamia
- snake_queen (yılan kraliçe)
- rabbit (tavşan)
- 6 ejder: dragon ailesinden 6 ayrı tür (ana ejder + renk ve ölçek farkıyla türetilmiş 5 tür; hangi 6 türün geleceğini manifestte `not` alanında yaz)
Orksu, ork ya da ork kökenli olan her yaratık (barbar lideri dahil) YEŞİL tenli olmalı; yukarıdaki ton kuralı geçerli.

6) G7 · simsek efekti
Dosya: vfx-simsek.png. Sorun: şimşek şeridi kullanılamıyor. Düz YATAY şerit olarak ver: 16 kare × 256 px = 4096×256, kareler soldan sağa, tek sıra, her karede zikzak aynı merkezde. Beyaz-menekşe zikzak, gerçek alfa, kare dışında gri ya da siyah dikdörtgen kalmayacak.

Teslim: tek ZIP, DD_DUZELTME_<tarih>.zip; manifest.json aynı alanlarla. Yalnız yenilenen dosyaları koy. Sonunda ortak bölümdeki kendi kendini denetleme tablosunu yaz.
```

---

## 3. Sonra ne olacak

1. Gemini M1 kararlarını (G1+G2 → G4+G5 → G6+G7+G8 → G3) sırayla Claude'a getir. Gemini'nin ürettiği düzeltme mesajlarını bölüm 2'ye eklemek yeterli; ayrı ayrı GPT'ye gitmeye gerek yok.
2. GPT düzeltme ZIP'i gelince Claude bunu önce teknik olarak denetler (biçim, alfa, ölçü, hale, sha), sonra oyuna yerleştirir.
3. Yeşil tenli Kragmir seti ve G3'ün 13 yaratığı oyuna girince bu sürümde 2B ve 3B karışık duran yaratıklar da 2B olur. Yayın bunlarla birlikte yapılır.
4. Gemini'nin kabul etmediği (RET) dosyalar oyuna girmez; mevcut 3B çizim kalır.
