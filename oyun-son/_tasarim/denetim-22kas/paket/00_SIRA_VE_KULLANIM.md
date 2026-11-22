# Görev paketi: sıra ve kullanım

## Bu pakette ne var?
- `GPT_ASTRA_6.2_GOREVLERI.md`: boyalı görsel üretimi (G1–G8).
- `GEMINI_NEON_4_GOREVLERI.md`: bağımsız kabul denetimi, video analizi, arayüz glifleri, maketler ve Türkçe adlar (M1–M5).
- `CLAUDE_OPUS_5.5_GOREVLERI.md`: kod, entegrasyon, test ve yayın (C0–C16).
- `REFERANS/`: GPT ve Gemini'ye eklenecek onaylı tarz örnekleri, kaçınılacak örnekler ve bugünkü oyun ekranları. Bu klasörü ZIP'leyip `REFERANS.zip` olarak ekle.

## Akış (her görsel için)
GPT üretir → Gemini M1 ile denetler (kabul, düzeltme ya da ret) → kabul edilen ZIP Claude'a gelir → Claude oyuna koyar ve iki halkta test eder → sen telefonda bakar ve onay verirsin.

## Sıra
1. **Senin kararların:**
   - Oyunun tek adı (Korant mı, Demir Diyarı mı?).
   - Savaşçı tırpanla mı kalacak, yoksa kılıç ve kalkan mı alacak?
   - İngilizce eşya adları Türkçeleşsin mi?
   - Yaratıklar 3 pozla mı, tek pozla mı çizilsin? GPT G3 mesajında ilgili satırı işaretle.
2. Aynı anda başlayabilecek işler:
   - **Claude C1** (hızlı düzeltmeler) ve **C2** (HD model kök nedeni).
   - **GPT G1** (pilot).
   - **Gemini M2** (videolar). M2 için kullanıcının daha önce hazırladığı Korant denetim ZIP'indeki iki MP4 dosyası gerekir.
3. G1 gelince: **Gemini M1** denetler, ardından **Claude C3 ve C4** pilotları kurar. Sen iki savaş görüntüsünü karşılaştırıp yöntemi seçersin.
4. Seçimden sonra işler paralel yürür:
   - GPT: G2, G3, G4, G5.
   - Gemini: M3, M4, ve her GPT teslimi için M1.
   - Claude: C5 ve sonrası.
5. En son: G6 (yetenek simgeleri), G7 (efektler), C11 (CSS göçü), C12 (adlar), G8 (logo, ad kararından sonra).

## Süre
Toplam 4–8 hafta. Yaratıklar tek pozla çizilirse 3–5 hafta. En uzun iş GPT G3 (yaratıklar). Ayrıntı raporun "Süre tahmini" bölümünde.

## Kurallar
- Aynı dosyayı iki model aynı anda değiştirmez. Koda yalnız Claude dokunur.
- GPT kendi işini onaylamaz; kabul Gemini'de, oyun içi doğrulama Claude'da.
- Her teslimde ZIP adı, `manifest.json` ve önizleme görseli zorunlu.
