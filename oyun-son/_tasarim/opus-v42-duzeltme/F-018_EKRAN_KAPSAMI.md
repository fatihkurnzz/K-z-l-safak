# F-018 — Ekran arşivi eksik grupları (Sonnet, 26.11)

Araç: `arac/cap.mjs` (rt.mjs'in çıkış akışı + çekim kipleri). Yerel kip, yazılım GL, JPEG q55. Çekimler `EKRAN_EKSIGI/`. Kapsamın tamamı DEĞİL; gerçek cihaz değil.

| Eksik grup (F-018) | Durum | Dosya / not |
|---|---|---|
| Normal savaş (VS, savaş ortası, Zafer sonucu) | VAR, iki halk | `*_zafer_*` (880×406, Sv.53 geliştirici karakteriyle 1-1) |
| Yenilgi ekranı | VAR, iki halk | `*_yenilgi_*` (Sv.1 karakter, Kül Geçidi 10 · Kül Şövalye) |
| Zindan / Kapı / Meydan / Nöbet / Baskın girişleri | VAR (açılış ekranları), iki halk | `*_gatePvp`, `*_czArena`, `*_gateZones`, `*_gateEvents`, `*_nobet`, `*_baskin` |
| Zindan savaşları (Dipsiz Kuyu, Gök Yarığı, Mühürlü Oda, Kül Kulesi, Yeraltı Ocağı) | ERTELENDİ (kullanıcı kararı, 26.11) | Yayın öncesi test aşamasında çekilecek; `arac/cap.mjs` `zindan` kipi hazır (`node cap.mjs <halk> 880x406 tr <çıktı> zindan`). Yapılmayacak değil, ertelendi |
| Boss (1-10, 2-10, 3-10, 4-10) ve PvP savaşı | KISMEN | VS ekranı ve savaş ortası çekildi (`EKRAN_EKSIGI/ek2/*_boss_*`, `*_pvp_*`); sonuç ekranı 120 sn içinde gelmediği için çekilemedi (yazılım GL) |
| İç mekân, "mekânı gör" hali | VAR, 5 bina × 2 halk (`*_goz_*_once` / `*_mekan_gorunur`) |  `*_bina_*` (Örs, İksir, Maden, Kader Çarkı, Taş Yemini, Çarşı, Pazar, Kral); `king`, bazı halk/bina çiftlerinde başlıksız açıldı — bkz. `log_*_ic.json` |
| İngilizce | VAR | 880×406 EN, 67 eylem/ekran, iki halk (63'ü başlıklı pencere açıldı, 4'ü pencere açmayan eylem) |
| 667×375 | VAR | 67 eylem/ekran, iki halk |
| 1180×820 | VAR | 67 eylem/ekran, iki halk |
| Öğretici adımları | KISMEN | `F-024/` altında ilk adımlar (Kragmir) |

Bu tur başlıkları: Karakter, Çanta, Görevler, Kervan, Meydan, Ayarlar, Klan, Karaborsa, Sıralama, Haberler, Profil, Kapı, Pazar, Tüccar (kurulmayan/açılmayan kimlikler `log_*_ekran.json`'da).

## Açılamayan 13 eylem — gerekçe
Ekran değil, parametre/veri isteyen eylem işleyicileri; `A.<ad>({})` ile pencere açmazlar:
- Ödül/işlem (bildirim verir, pencere yok): `monthlyBonus`, `weeklyBonus`, `gift`, `arenaRefresh`, `tp` (`d.n`), `calInfo` (`d.k`, `d.i`, yalnız toast), `spin` (parametre).
- Parametreli açılır: `msgMenu` (`d.name` yoksa sessiz döner), `skill`, `exchange`, `tierInfo`, `emoOpen` (öğe `el` ister).
- `sandikOpen`: hata değil. `ui-sandik.js` `ui.js`'te yorum satırı ("19 Kas kullanıcı isteğiyle oyundan kaldırıldı"), bu yüzden `ACT.sandikOpen` hiç tanımlanmıyor.

## Yapılmayan
K002 tek kimlik eşlemesi `F-018_K002_TEK_KIMLIK.json` (198 görüntü − 86/87 yinelenen = 112/111 benzersiz). Yapılmayan: zindan savaşları (ertelendi), boss/PvP sonuç ekranı, öğretici adımlarının tamamı (yalnız ilk adımlar `F-024/`'te).
