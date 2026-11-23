# Korant · Paket: Oyuna Giriş Ekranı + GPT Sonrası Eksiklerin Tamamlanması

Bu paket bir sonraki Claude oturumuna (Opus 5.5 / Sonnet 5.5) verilir. İki iş var:

1. **Oyuna Giriş / Sunucu Seçimi ekranı** → `CLAUDE_GIRIS_EKRANI.md` (referans: `REFERANS/giris_ekrani_sunucu_secimi.png`)
2. **GPT'den gelecek görseller ve eksiklerin tamamlanması** → `CLAUDE_GPT_SONRASI_EKSIKLER.md`
3. GPT'ye gidecek görsel isteği (giriş ekranı parçaları) → `GPT_GIRIS_GORSEL_ISTEGI.md`

## Önce oku
- `REFERANS/CLAUDE_hafiza.md` (= depo kökündeki CLAUDE.md: kurallar, yayın, 511 dosya sınırı, `node --check` dersi)
- `REFERANS/EKSIK_LISTESI_SON.md` (tek kaynak eksik listesi)

## Sabit kurallar (kısaca)
- Yanıt/arayüz Türkçe. `shared/` = mekanik, DOKUNMA.
- Yeni CSS → `css/duzen.css` SONUNA. Yeni görsel → gömülü JS (`_tasarim/araclar/gom.py`). Yayında 485/511 dosya.
- Her JS'i `.mjs` kopyasıyla `node --check` et.
- Kullanıcı: TEST YAPMA; yalnız tek ekran düzen kontrolü (880×406, dpr 2.66). Denenecekleri `EKSIK_LISTESI_SON.md` 2B'ye yaz.
- Eski görünüşe dönüş bayrağı: `html.giris2` / `?giris=0` / `localStorage dd_giris='0'`.
- Bitince commit + yayın + CLAUDE.md "SON DURUM" güncelle.

## Sıra
1. Giriş ekranı (G1–G6, `CLAUDE_GIRIS_EKRANI.md`) — GPT görseli beklemeden, CSS ile ve mevcut `img/korant-acilis.jpg` üstünde bitir.
2. GPT görselleri geldikçe `CLAUDE_GPT_SONRASI_EKSIKLER.md` tablosundaki sırayla bağla.
3. Yayın (sürüm 39) ve kullanıcıya bağlantı + eksik test listesi.

## Ek: P23 bölünmüş görevler (`P23_BOLUNMUS_GOREVLER/`)
Önceki proje paketi (11 telefon ekranı, istekler U1–U14, bulgular E1–E11) bu klasörde:
- `00_PROJE_VE_SIRA.md` — istekler ve sıra
- `CLAUDE_OPUS_GOREVLERI.md` — K1–K12 (kod)
- `GEMINI_NEON_GOREVLERI.md` — N1–N9 (maket/denetim)
- `GPT_ASTRA_GOREVLERI.md` — A1–A8 (görsel); `GPT_TEK_ZIP_GOREVI.md`
- `REFERANS_EKRAN/` — döndürülmüş 11 ekran
Sıra: önce K1–K12 (Opus), giriş ekranı bunlarla birlikte ya da hemen sonra; GPT/Gemini teslimleri geldikçe bağlanır.
