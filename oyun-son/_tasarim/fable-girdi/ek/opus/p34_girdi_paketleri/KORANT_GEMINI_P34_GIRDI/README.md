# KORANT_GEMINI_P34_GIRDI — Gemini için P34 girdi paketi
Sürüm kimliği: KORANT-v40-1dda167+P33. İçinde yalnız Gemini'nin işi için gerekli girdiler var (oyunun tamamı DEĞİL; ikinci kabul ekran görüntüleri aşağıda belirtildiği gibi önceki paketlerdedir).

**Önce oku:** `00_OKU/GEMINI_GOREVLERI.md` (görevler, ölçüler, teslim şeması) → `00_OKU/ORTAK_KURALLAR.md` → `00_OKU/KORUNACAK_VARLIKLAR.md`. Tam dosya listesi, boyut ve sha256: `manifest.json`.

| Klasör | İçerik |
|---|---|
| `00_OKU/` | Görev talimatı, ortak kurallar, korunacak varlıklar |
| `01_P34-05_NPC_PORTRE_KARELERI/` | 8 G4 NPC portresi (528×704) + yüzleri (192×192), kimlik tablosu |
| `02_P34-06_YARATIK_POZLARI/` | 11 türün mevcut bekleme + portre, tam setli referanslar, yaratık kaydı (kimlik, bölge, ölçek, renk çarpanı) |
| `03_P34-07_BOSS_EVRE2/` | 19 bossun mevcut evre 1 + evre 2 + portre (A/B/C zorunlu, D isteğe bağlı), boss kaydı (oyun içi evre metinleri) |
| `04_P34-11_SES/` | Ses sistemi, anahtar eşlemesi, istek tablosu, 105 NPC repliki + ses karakteri, mevcut 4 müzik |
| `05_IKINCI_GORSEL_KABUL/` | İkinci kabul talimatı, QA matrisi, kapsam/değişiklik/test belgeleri, birinci rapor (biçim), önceki bulgu durumları |
| `06_REFERANS_STIL/` | Sanat kitabı, onaylı/kaçınılacak örnekler, GPT standart dosyaları |

**İkinci kabul ekran görüntüleri bu pakette YOK:** `KORANT_GEMINI_KABUL2_01of08 … 08of08.zip` ve `KORANT_GEMINI_KABUL2_EK_01of05 … 05of05.zip` zaten teslim edildi; tekrar gönderilmedi. Gemini'ye zaten verilmiş görevler yeniden verilmedi.

Paralel çalışma: GPT ayrı pakette zafer anıtı, sahne hareket katmanları, Kragmir 5. yüz, Bran/Nessa portresi ve kontrolleri yapıyor; onun işlerini tekrar üretme. **Entegrasyon, iki uzmanın teslimi ve ikinci kabul raporu geldikten sonra TEK aşamada yapılacak; oyun koduna dokunma.** Mini Dizi videosu, yetenek çizimi, mekanik/ekonomi/denge bu paketin dışında.
