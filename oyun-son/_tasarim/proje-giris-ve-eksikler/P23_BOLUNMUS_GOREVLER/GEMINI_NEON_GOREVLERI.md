# Gemini Neon 4 · P23 tasarım, maket ve denetim görevleri (N1–N9)

**Kullanım:** Her sohbette önce ORTAK BÖLÜM'ü, sonra tek bir görevi yapıştır. Ekle: `REFERANS_EKRAN.zip` (bu klasördeki ekran görüntüleri), önceki paketten `REFERANS.zip` ve `SANAT_KITABI.md`.

---

## ORTAK BÖLÜM

Sen bir mobil oyunun **kıdemli arayüz/UX tasarımcısı ve sanat denetçisisin**. Önceki konuşmaları bilmiyorsun; gereken her şey burada.

- Oyun: **Korant**, telefonda YALNIZ YATAY oynanan, sıra tabanlı fantastik RPG. Mantıksal ekran **880×406** (telefon 2340×1080).
- İki halk: **Elentha** (insan; beyaz mermer, gümüş, lacivert, gök mavisi; güneş-kartal) ve **Kragmir** (ork, yeşil ten; kararmış demir, bronz, kızıl deri, kor; göz-örs).
- Tarz: yarı gerçekçi, elle boyanmış; sade, **az altın**, kalın kontur yok, neon yok. Arayüz koyu lacivert/kömür zemin, ince eski-altın kenar.
- Yazı tipleri: başlık Cinzel, gövde sistem sans. Dokunma alanı en az 40 px (ikincil 32 px).
- `REFERANS_EKRAN/` bugünkü ekranlar: 01 VS, 02 Profil, 03 İksir, 04 Çarşı haritası, 05 Otağ, 06 Maden, 07 Menü, 08 Ana ekran, 09 Savaş, 10 Karakter oluştur, 11 Karakter seçme.
- Kodu Claude yazar; senin işin **ölçülü maket + bileşen tarifi** ya da **kabul denetimi**. GPT boyalı parçaları üretir.

### Maket teslim biçimi (N1–N8)
1. `maket_<ad>.png` 880×406 (ve 2×: 1760×812). Gerçekçi içerik, iki halk için ayrı görüntü (renk değişiyorsa).
2. `olcu_<ad>.md`: her öğe için x, y, genişlik, yükseklik (880×406 ızgarasında), yazı boyu/kalınlığı, renk (hex), kenar/gölge, durumlar (normal/basılı/kapalı), dar ekran (760 px) davranışı.
3. GPT'nin çizeceği parçaların listesi (ad, piksel ölçüsü, 9-dilim kenar payları, saydam mı).
4. Mekaniği değiştiren hiçbir şey önerme (yeni para, yeni bonus yok); var olan bilgiyi daha iyi göster.

---

## N1 · Karakter seçme/oluşturma başlığı ve işaret (U1–U3)
- "Korant Online" başlığının önündeki küçük sembol yerine **Korant işareti** tarifi (GPT A1 çizer): ne anlatacak, hangi biçim, 48/96/192 px'de okunurluk.
- "KARAKTER OLUŞTUR" bandı beğenilmedi: yeni başlık levhası maketi (ekran 10). Yazısız boyalı levha + kodla yazı. Seçme ekranındaki "KARAKTERLER 2/3" başlığıyla aynı aileden olsun.
- Karakterin zemindeki daireye göre yeni yeri: dairenin merkezi, karakter boyu (ekran yüksekliğinin %…'i), ayak çizgisi.

## N2 · Savaş yetenek çubuğu ölçüsü (U6)
- Ekran 09'daki üst sol blok (oyuncu çerçevesi + yetenek yuvaları + 2 iksir) için temiz ölçü: temel saldırı + 5 yetenek + 2 iksir, kilitli yuva görünüşü, bekleme süresi, mana yetmezliği, seçili durum. Dalga kutusu ve küçültülmüş X düğmesinin yeri.

## N3 · Ana ekran parçaları (U7)
Ekran 08/04. Dört bileşen, iki halk:
1. **Oyuncu kartı** (sol üst): portre, Sv., ad, can/mana çubukları.
2. **Görevler kutusu**: başlık, tek görev, ilerleme, ekle düğmesi.
3. **Hava kutusu**: saat, hava (Açık/Yağmur/Sis/Poyraz), bonusu ve bedeli (örn. "Poyraz · Deneyim +%5 · Maden −%5"), dokununca açılan açıklama balonu ve sonraki dilimin tahmini. Oyuncu "bu ne işe yarar"ı ilk bakışta anlamalı.
4. **Premium kutusu**: şu an kendini belli etmiyor; çağıran ama bağırmayan bir tasarım (simge + "Premium" + kısa fayda), sahip olunca kalan gün.
- Ayrıca sol üstteki 4 kare düğme için küçük etiket önerisi.

## N4 · Menü (U8)
- Ekran 07: iki sütun farklı kaynaktan gelmiş gibi. Tek kart biçimi + **tek glif takımı** maketi. Maddeler: Sıralama, Rehber, Arkadaşlar, Promosyon kodu, Sorun/Destek, Mini Dizi, Tam ekran, Ayarlar, Karakter değiştir; "Sunucu: Ares" bilgi satırı.
- Gerekirse eksik glifleri sen çiz (önceki M3 glif biçimi: 128×128 tek renk beyaz, saydam PNG, `glif-<ad>.png`).

## N5 · Madenci kare listesi denetimi (U9)
- GPT A5 isteğindeki poz/kare listesinin yeterli olduğunu denetle (kaz döngüsü, yürüyüş, boşaltma, bekleme; araba 5 dolum durumu). Eksik varsa listeyi düzeltip kullanıcıya ver; GPT'ye gönderilmeden önce.

## N6 · Haritalarda NPC yerleşimi (U11)
- Ekran 04 (Elentha çarşı) ve 08 (Elentha başkent) + Kragmir eşleri: her NPC için durduğu nokta (kaynak resim pikseli, kaynak 2340 px genişlik), bakış yönü, boy (piksel), etiketle ilişkisi.
- NPC'ler: Kral Edran / Volgar Demirdiş (Kral), Tüccar Halvor (çarşı), İksirci Maelis (İksir ve Parşömen), Şaman Yashka, Lira, izci Corin (Elentha) / Thrak (Kragmir). Hangi binanın önünde kimin duracağını tablo yap.

## N7 · İksir ve Parşömen tek sayfa (U12)
- Ekran 03: sol sekmeler kalkacak. Tek sayfa maketi: Maelis şeridi, "İksirler" (Can, Mana) ve "Parşömenler" (Enerji, Meydan…) grupları, ×1/×5/×10 düğmeleri para simgesiyle, "Elinde 5/99".

## N8 · Profil penceresi (U13)
- Ekran 02 baştan: kimlik şeridi (portre, ad, unvan seç, halk, sunucu), Güç + Eşya Seviyesi, rütbe ilerlemesi (TP), Üyelik/Klan/Ak Taş bilgileri, savaş istatistikleri (Savaş, Zafer, Başarılı/Başarısız basma, Çanta) ve **Test araçları** bölümü (yalnız test sürümünde görünür; düğmeler kodda hazır). Boş alan, anlamsız dağ silueti kalmasın.

## N9 · Kabul denetimi (her GPT teslimi)
Her P23 GPT ZIP'i için: tarz (onaylı referansların yanına konunca aynı ekip mi), ışık yönü (sol üst), gerçek alfa ve halo, ölçü/ad/manifest, iki halk eşliği, yeşil ork teni, yazı/logo/filigran yok, az altın, sahneye "boyanmış gibi" oturma (temas gölgesi, perspektif). Karar: **KABUL / DÜZELT (madde madde) / RET**. Sonucu tablo olarak ver.
