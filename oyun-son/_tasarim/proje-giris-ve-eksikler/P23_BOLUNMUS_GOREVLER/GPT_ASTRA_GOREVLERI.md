# GPT Astra 6.2 · P23 boyalı görsel görevleri (A1–A8)

**Kullanım:** Her yeni sohbette önce önceki paketteki `GPT_ASTRA_6.2_GOREVLERI.md` dosyasının **ORTAK BÖLÜM**'ünü (tarz, yasaklar, teknik kurallar, öz denetim), ardından aşağıdaki **P23 EK KURALLAR**'ı, sonra **yalnız bir** A görevini yapıştır. Ekle: `REFERANS.zip`, `REFERANS_EKRAN.zip`, varsa Gemini maketi (`maket_*.png`, `olcu_*.md`).
Teslim ZIP adı: `P23_A<n>_<tarih>.zip` (+ `manifest.json`, `onizleme.png`). Teslimi Gemini denetler.

---

## P23 EK KURALLAR
- Oyunun adı **Korant**. Ekran 880×406 mantıksal, telefon 2340×1080 → görselleri **2× ya da 3×** çiz.
- Kullanıcı ayrı yapıştırılmış sprite görüntüsünü sevmiyor. Sahneye konacak her figür, konacağı sahnenin (REFERANS_EKRAN'daki görüntü) ışığına, perspektifine ve renk ısısına göre boyansın; ayakların altına ayrı katman olarak yumuşak **temas gölgesi** (`*_golge.png`) ver.
- Orklar **yeşil tenli** (Thrak gibi). Elentha: beyaz mermer, gümüş, lacivert. Kragmir: kararmış demir, bronz, kızıl deri, kor.
- Görselde yazı yok. Az altın.

---

## A1 · Korant işareti (U1)
- "Korant Online" başlığının önündeki yeni sembol. İki halkı birleştiren tarafsız bir işaret (örn. demir taç + kor/ışık), boyalı metal kabartma.
- Dosyalar: `korant-isaret-512.png` (saydam), ayrıca 192 ve 96 px'de okunur sade sürüm `korant-isaret-sade-192.png`.
- Gemini N1 tarifi varsa ona uy.

## A2 · Zemin mührü (U2)
- Karakter seçme/oluşturma ekranındaki zemin dairesinin içindeki sembol, iki halk için: `muhur-elentha.png` (güneş-kartal, mermere kakma gümüş/lacivert), `muhur-kragmir.png` (göz-örs, kararmış demire kor ışığı). Ekran 10'daki dairenin perspektifinde (yatay elips, yaklaşık 4,3:1), saydam, 2400×560.
- **A2-b (gerekirse, Claude isterse):** aynı arka planların daire içi sembolsüz sürümü.

## A3 · Başlık levhası (U3)
- "KARAKTER OLUŞTUR" yazısının konacağı yazısız levha, Gemini N1 maketindeki ölçüde, iki halk eşi (`levha-baslik-elentha.png`, `levha-baslik-kragmir.png`), 9-dilim kenar payları manifestte.

## A4 · Ana ekran çerçeveleri (U7)
- Gemini N3'te istenen parçalar: oyuncu kartı çerçevesi (portre halkası dahil), Görevler kutusu, hava kutusu, Premium kutusu; iki halk. Ayrıca 4 hava simgesi (`hava-acik/yagmur/sis/poyraz.png`, 128 px, boyalı) ve Premium simgesi (`premium-simge.png`, 128 px).

## A5 · Madenci ve maden sahnesi (U9) — en uzun iş, önce başla
Sahne: ekran 06. Oyuncu karakteri kalkıyor; yerine halka göre bir **madenci NPC**.
- **Madenciler:** `madenci-elentha` (insan, deri önlük, kazma, gümüş-lacivert ayrıntı), `madenci-kragmir` (yeşil tenli ork, kalın kollu, demir kazma). Yandan 3/4 görünüş, sahnedeki ışık. Kare kare, saydam, aynı tuval ve aynı ayak çizgisi (512×512, ayak y=480):
  - `kaz_01..06` (kazmayı kaldır → vur → geri çek; 6 kare döngü)
  - `yuru_01..06` (yürüme döngüsü, sağa bakış; Claude aynalayarak sola çevirir)
  - `bosalt_01..05` (arabayı devirip boşaltma)
  - `bekle_01..04` (depo dolu: kazmaya dayanıp soluklanma)
- **Kristal kayalar:** `kaya-mavi` (Elentha) ve `kaya-kirmizi` (Kragmir), her biri 3 aşama (`_1` tam, `_2` çatlak, `_3` yontulmuş), 512×384, saydam; vuruş anı için `kivilcim-mavi/kirmizi` 6 karelik şerit (her kare 128×128).
- **Maden arabası:** `araba_0, _25, _50, _75, _100` (boş → dolu; yük kristal rengi halka göre iki takım), 384×288, saydam.
- **Arka plan:** mevcut Elentha maden sahnesinin **karaktersiz** sürümü ve Kragmir eşi (kırmızı kristalli, kor ışıklı ocak), 2340×810 (ekran 06'daki şerit oranı), WebP.
- Kare listesini Gemini N5 denetler; düzeltme gelirse ona uy.

## A6 · Taht (U10)
- `taht-elentha.png` (beyaz mermer, lacivert kadife, gümüş güneş-kartal; az altın) ve `taht-kragmir.png` (kararmış demir, kemik, kızıl deri, göz-örs; kor ışığı). Önden hafif 3/4, boş, saydam, 768×768, temas gölgesi ayrı.

## A7 · Haritalardaki NPC'ler (U11)
- Tam boy, ayakta, saydam; haritadaki küçük boylarına uygun sade siluet ama boyalı (her biri 512 px yükseklik, 2 kare nefes: `_1`, `_2`). Mevcut yüz portreleriyle **aynı kişi** olmalı (REFERANS'taki G4 portreleri):
  - Elentha: Kral Edran, Tüccar Halvor, İksirci Maelis, Şaman Yashka, Lira, izci Corin.
  - Kragmir: Kral Volgar Demirdiş, izci Thrak, Kragmir haritalarındaki tüccar/iksirci/Yashka karşılıkları (Gemini N6 tablosu hangi NPC'nin hangi haritada durduğunu söyler; eksik kişi çıkarsa o tabloya göre çiz).
- Işık: haritaların gün ışığı (sol üst, sıcak). Temas gölgesi ayrı.

## A8 · Profil arka planı (U13)
- Gemini N8 maketine göre yazısız arka plan/levha (iki halk): koyu, sade, hafif doku; ortada boş alan bırakma. Ölçü maketten.
