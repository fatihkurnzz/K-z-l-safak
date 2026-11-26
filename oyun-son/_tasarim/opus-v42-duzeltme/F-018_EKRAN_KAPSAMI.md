# F-018 — Ekran arşivi eksik grupları (Sonnet, 26.11)

Araç: `arac/cap.mjs` (rt.mjs'in çıkış akışı + çekim kipleri). Yerel kip, yazılım GL, JPEG q55. Çekimler `EKRAN_EKSIGI/`. Kapsamın tamamı DEĞİL; gerçek cihaz değil.

| Eksik grup (F-018) | Durum | Dosya / not |
|---|---|---|
| Normal savaş (VS, savaş ortası, Zafer sonucu) | VAR, iki halk | `*_zafer_*` (880×406, Sv.53 geliştirici karakteriyle 1-1) |
| Yenilgi ekranı | VAR, iki halk | `*_yenilgi_*` (Sv.1 karakter, Kül Geçidi 10 · Kül Şövalye) |
| Zindan / Kapı / Meydan / Nöbet / Baskın girişleri | VAR (açılış ekranları), iki halk | `*_gatePvp`, `*_czArena`, `*_gateZones`, `*_gateEvents`, `*_nobet`, `*_baskin` |
| Boss ve PvP **savaşının kendisi** | YOK | yalnız giriş ekranları çekildi; boss/PvP savaşı çekilmedi |
| İç mekân (bina pencereleri) | VAR | `*_bina_*` (Örs, İksir, Maden, Kader Çarkı, Taş Yemini, Çarşı, Pazar, Kral); `king`, bazı halk/bina çiftlerinde başlıksız açıldı — bkz. `log_*_ic.json` |
| İngilizce | KISMEN | 880×406 EN, 14 ana ekran, iki halk |
| 667×375 | KISMEN | 14 ana ekran, iki halk |
| 1180×820 | KISMEN | 14 ana ekran, iki halk |
| Öğretici adımları | KISMEN | `F-024/` altında ilk adımlar (Kragmir) |

Bu tur başlıkları: Karakter, Çanta, Görevler, Kervan, Meydan, Ayarlar, Klan, Karaborsa, Sıralama, Haberler, Profil, Kapı, Pazar, Tüccar (kurulmayan/açılmayan kimlikler `log_*_ekran.json`'da).

## Açılamayan 13 eylem — gerekçe
Ekran değil, parametre/veri isteyen eylem işleyicileri; `A.<ad>({})` ile pencere açmazlar:
- Ödül/işlem (bildirim verir, pencere yok): `monthlyBonus`, `weeklyBonus`, `gift`, `arenaRefresh`, `tp` (`d.n`), `calInfo` (`d.k`, `d.i`, yalnız toast), `spin` (parametre).
- Parametreli açılır: `msgMenu` (`d.name` yoksa sessiz döner), `skill`, `exchange`, `tierInfo`, `emoOpen` (öğe `el` ister).
- `sandikOpen`: `ACT`'ta tanımlı (`ui-sandik.js:32`); rt.mjs bağlamında `A.sandikOpen` fonksiyon olarak görünmedi — bu betik bağlamında yüklenmemiş olabilir, ayrıca incelenmeli.

## Yapılmayan
K002 112/111 yinelenen girişleri tek kimlikte toplama yapılmadı. Boss ve PvP savaşı çekimi yapılmadı. Her halk için tam 667/1180/EN turu (68 ekran) çekilmedi, yalnız 14 ana ekran.
