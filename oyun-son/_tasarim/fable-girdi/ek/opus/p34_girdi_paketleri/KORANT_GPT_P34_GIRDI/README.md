# KORANT_GPT_P34_GIRDI — GPT için P34 girdi paketi
Sürüm kimliği: KORANT-v40-1dda167+P33. İçinde yalnız GPT'nin işi için gerekli girdiler var (oyunun tamamı DEĞİL).

**Önce oku:** `00_OKU/GPT_GOREVLERI.md` (görevler, ölçüler, teslim şeması) → `00_OKU/ORTAK_KURALLAR.md` → `00_OKU/KORUNACAK_VARLIKLAR.md`. Tam dosya listesi, boyut ve sha256: `manifest.json`.

| Klasör | İçerik |
|---|---|
| `00_OKU/` | Görev talimatı, ortak kurallar, korunacak (yeniden üretilmeyecek) varlıklar |
| `01_P34-01_ZAFER_ANITI/` | Orijinal 512×217 zafer_aniti + not |
| `02_P34-02-03-04_SAHNE_KATMANLARI/` | 5 onaylı sahne (DEĞİŞMEZ; yalnız ölçüm/hizalama girdisi), ızgaralı görüntüler, etiket konumları, mevcut canlılık notu |
| `03_P34-08_KRAGMIR_YUZ/` | Mevcut Kragmir yüzleri (512 PNG + oyundaki 176 yuvalar), ayna ölçümü, tam boy örnekler |
| `04_P34-09_BRAN_NESSA/` | G4 portre referansları (8 NPC), hikâye özeti ve illüstrasyonlar, yedek SVG, biçim şartı |
| `05_KONTROL_BEYAZ_ZEMIN_VE_BUYU/` | Beyaz zemin ölçümü, büyü pozu kontrol görüntüsü, Elentha kadın savaşçı 7 poz |
| `06_REFERANS_STIL/` | Sanat kitabı, onaylı/kaçınılacak örnekler, GPT standart dosyaları |

Paralel çalışma: Gemini ayrı pakette yaratık/boss pozları, NPC kareleri, ses ve ikinci görsel kabulü yapıyor; onun işlerini tekrar üretme. **Entegrasyon sonra, iki uzmanın teslimi ve ikinci kabul raporu geldikten sonra TEK aşamada yapılacak; sen oyun koduna dokunma.** Mini Dizi videosu, yetenek çizimi, mekanik/ekonomi/denge bu paketin dışında.
