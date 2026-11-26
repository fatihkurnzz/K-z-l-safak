# P35-05 — Avcı Seferi ve Koleksiyon: karar belgesi (Opus ilk tur)

**Değişmeyen sınırlar (kullanıcı kararı):**
- Koleksiyon Başarımlar sekmesinde kalır.
- Dipsiz Kuyu dönüştürülür; ek zindan açılmaz.
- 25. seviye kilidi, günlük 2 hak, 10 ilerleme birimi, 5/10 eşikleri ve savunma (DEF) başarımı korunur.
- Yeni menü, yeni para birimi ve kalıcı stat yok.

**Bu belgedeki sayılar:** Hiçbir zorluk sayısı önerilmedi. Sayılar yalnızca mevcut kaynağın ölçümüdür.

---

## A. Avcı Seferi

### A1. Mevcut aday (GPT modeli)

**Nasıl çalışıyor**
- Oyuncu üç ikili seçim yapar: 1–3, 4–5 ve 6–10. karşılaşmalar için; toplam 8 kombinasyon.
- Her seçim, bölge havuzunun ilk ya da ikinci yarısını kullanır.
- Ödül, taş dağılımı ve dalga bütçesi eski Kuyu ile aynıdır.
- Sunucu tohumu ile plan bağlanır.

**Ölçüm (`KANIT/cikti/ROTA_AYRISMA.json`)**
- İki yarı arasındaki ortalama can, saldırı ve savunma farkı dört bölgede ≤%9.
- GPT'nin `ek_test.mjs` testi, 8 rotanın ödülünün birebir aynı olduğunu doğruluyor.

**Değerlendirme (OP35-13, Yüksek):**
- Seçim bir **karar** değil. Sonuç ve risk değişmiyor.
- Üç ek dokunuş angarya olur.
- Oyuncuya "rota" diye sunulursa yanıltır.

### A2. Alternatifler

| # | Seçenek | Oyuncuya yararı | Maliyet | Kötüye kullanım | Motor bağımlılığı |
|---|---|---|---|---|---|
| R1 | **Zayıflık rotası:** havuzun yarıları baskın zayıflığa göre kurulur (ör. Kül Geçidi: ateşe zayıf 10/12 · buza zayıf 7/11). Önizlemede "Ateşe zayıf av / Buza zayıf av" yazar. | Seçim, oyuncunun element yeteneklerine ve ekipmanına göre anlam kazanır | Düşük: model `plan()` içinde yalnız havuz bölme kuralı değişir | Düşük: ödül aynı. Kolay rotayı seçmek amaçlanan davranış | Mevcut `weak` alanı ve element hasarı var. Ek motor değişikliği yok |
| R2 | **Tek seçim:** başta bir kez rota seçilir (2 seçenek), önizlemede gerçek tür listesi görünür | Dokunuş azalır, karar netleşir | Çok düşük | Yok | Yok |
| R3 | **Aile rotası:** hayvan / insansı / ölümsüz aileleri | Tema ve Koleksiyon kesim hedefleriyle bağlantı | Orta: bölge başına aile sayısı dengesiz olabilir | Düşük | Yok |
| R4 | **Mevcut aday (yarı/yarı)** | Yok | Var | — | Yok |

**Önerilen: R1 + R2.** Tek seçimle zayıflık rotası. Astra H-01 ile ölçülmeli: seçimin tamamlama oranını 8 uzmanlıkta gerçekten değiştirdiği gösterilmeli. Gösterilemezse R2 tek başına uygulanır.

### A3. Gerçek son boss · olay/risk · 65 usta modu (taslak; onaylanmamış)

| Tasarım | Yarar | Maliyet / risk | Kötüye kullanım | Bağımlılık |
|---|---|---|---|---|
| **B1 · Son karşılaşma kapı kaptanı:** 10. dalgada bölgenin mevcut kaptanlarından biri, mevcut `bossFor()` ölçeğiyle | Sefer bir doruğa ulaşır; yeni varlık gerekmez (G3 boss çizimleri var) | Zorluk sıçraması 9. dalgadan sonra kısmi temizlemeyi düşürebilir | Yok: ödül aynı | Mevcut `bossFor` ve `scaled`. Astra H-02 |
| **B2 · Boss yok, 10. dalga 3 seçkin** | En ucuz seçenek | Doruk zayıf | Yok | Yok |
| **E1 · Olay: dalga arası tek seçim ("yaralılara yardım" → can yenileme ya da devam")** | Tempo ve risk algısı | Kullanıcı arayüzü ve kayıt adımı ister; yarım savaş/sekme senaryoları çoğalır | Can yenilemeyi istismar → ödülle bağlanmamalı | Savaş durumunun dalga arası değiştirilmesi: motorda yol yok, **P36'ya bağlı** |
| **U1 · 65 usta:** aynı plan, seviye 65 ve tüm dalgalar seçkin | Son oyunda tekrar değeri | Denge ölçümü gerekir | Ödül artmazsa yok | Astra H-02 ile ölçülür. **Kullanıcı onayı olmadan yayına girmez** |

**Önerilen sıra:**
1. R1/R2.
2. B1 (ölçümle).
3. U1 (ölçümle).
4. E1 P36'ya kadar beklesin.

### A4. Ad (OP35-14) — kullanıcı kararı

- **(a)** "Dipsiz Kuyu" adı kalır, "Kuyu Avı" alt başlığı eklenir. Görsel, unvan ve görev metinleri değişmez. **Önerim bu.**
- **(b)** Ad "Avcı Seferi" olur. Bunun için yeni boyalı sahne kartı (Gemini), m19/m31 metinleri ve unvan adı değişir. Unvan adı değişirse kazanılmış unvanlar korunmalı.
- **(c)** "Dipsiz Kuyu Seferi" (hibrit).

### A5. Korunması zorunlu olanlar

- `p.wellBest`, `A('well')`, m19=5, m31=10, `well` başarımı ([5,10], DEF), Kuyu Bekçisi unvanı.
- Günlük 2 hak; giriş onaylanmadan hak harcanmaz.
- Taş dağılımı: 4 standart, 4 nadir, 2 eşsiz.
- Altı yaratık (OP35-11) her rotada kendi bölge havuzunda kalmalı.

---

## B. Koleksiyon

### B1. Mevcut aday

- Kapsam: 1247 eşya kaydı, 145 yaratık (23 boss) ve 8 Destan bölümü.
- Kayıt yalnız eklenir; satış, parçalama ya da takas koleksiyondan kayıt silmez.
- Envanter her yüklemede kaydı birleştirir; geriye dönük sahiplik uydurulmaz.

### B2. Sorunlar

- **OP35-16:** 1247 kaydın 1098'i, aynı 549 tabanın Standart ve Nadir kopyası.
- **OP35-15:** Yerel kipte `dev.*` eylemleri açık (F-002), bu yüzden koleksiyon şişirilebilir.
- **Dolu çanta:** Çanta doluyken toza çevrilen düşüş `codex.d` sayacına yazılıyor; model bunu sahiplik saymıyor. Bu doğru.

### B3. Seçenekler

| # | İlerleme birimi | Yarar | Maliyet |
|---|---|---|---|
| K1 | 1247 kayıt (aday) | En ayrıntılı | Yorucu; nadirlik kopyaları ayırt edilmesi güç |
| **K2 (önerim)** | **698 taban.** Kart üstünde Standart ✓ / Nadir ✓ rozeti. Nadirlik isteğe bağlı alt hedef | Anlamlı, okunur hedef. Tamamlama hissi gerçekçi | Düşük: görünüm ve sayaç değişir, veri modeli aynı kalır |
| K3 | Yalnız eşsiz (149) + yaratık + Destan | En hafif | Ortak eşyanın keşif değeri kaybolur |

### B4. Prestij (güç veya para birimi yok)

- Kategori eşiklerinde yalnız görünür rozet ya da çerçeve. Mevcut kozmetik çerçeve sistemi `frameSel` kullanılabilir.
- Yeni kozmetik ödül ayrı kullanıcı onayı ister.
- Boss ve lore: yalnız mevcut Ansiklopedi metinleri gösterilir; **yeni lore yazılmaz**.

### B5. Filtre ve performans

- Filtreler: silah / zırh / takı, nadirlik, sahip olunan / eksik, arama.
- Liste sayfalı ya da sanal olmalı; 1247 kart tek seferde DOM'a basılmaz.
- 880×406'da tek satır filtre çubuğu olmalı.
- Ölçüm: açılış süresi ve bellek, önce/sonra.

---

## C. Kullanıcıdan istenecek kararlar (kısa)

1. **Avcı Seferi rota ekseni:** R1 (zayıflık) + R2 (tek seçim) mi, aday mı?
2. **Ad:** (a) Dipsiz Kuyu + "Kuyu Avı" / (b) Avcı Seferi + yeni sahne / (c) hibrit?
3. **Son karşılaşma:** B1 (kapı kaptanı, ölçümle) mi, B2 (boss yok) mu?
4. **65 usta modu:** ölçüm sonrası açılsın mı, ilk sürümde kapalı mı kalsın?
5. **Koleksiyon birimi:** K2 (698 taban + nadirlik rozeti) mi, K1 (1247) mi?
6. **F-002:** Koleksiyon açılmadan önce geliştirici eylemleri kapatılsın mı?

## D. Açık savaş ve ekonomi kararları (Astra ölçmeden karar yok)

- Kısmi temizleme oranı ve XP/akçe dağılımı (eski Kuyu ile aynı tohum ve ekipman): H-01, H-02.
- B1 boss eklenince 10. dalga başarı oranı: H-02.
- Altı yaratığın beklenen karşılaşma süresi: H-03.
