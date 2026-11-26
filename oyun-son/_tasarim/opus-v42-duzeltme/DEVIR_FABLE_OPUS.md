# Devir: Sonnet'in yapmadığı işler (Fable/Opus'a)

Kullanıcı kararı (26.11): Sonnet yalnızca düşük riskli işleri yaptı. Aşağıdakileri Fable oturumu üstlenir; uygun olanlar için Opus ajanı çalıştırır, sonuçları final teslime (`KORANT_V42_OPUS_DUZELTME.zip`) ekler. GPT ve Gemini'den gelen teslimlerin birleştirmesini de Fable oturumu yapar.

## Opus ajanına uygun (riskli: kayıt, mekanik)
- **F-001 kayıt kurtarma:** ham bozuk kaydı `dd_local_world_v2_bozuk_<zaman>` anahtarına yedekle; kullanıcı onayı olmadan asla ezme; dışa aktar; `v:1` göç; K045. GPT kurtarma şartnamesi gelmeden yalnız ham yedek.
- **F-021 sekme devri:** önce yeniden üret (`sekme_test`); gerekirse 2 sn içinde görünür uyarı; veri kaybı olmasın.
- **F-009 Weaken doğrulama:** önce kanıt (K020, tam test, etki sayacı ayrımı); yetenek/mekanik değiştirme yok, `shared/` değişmez.

## Fable'a (bağımsız kabul)
- F-024/F-025'in bağımsız kabulü ve düzeltmelerin yeniden ölçümü (Sonnet yalnız test ortamı/senaryo hazırladı; bkz. sonuç raporu).

## Dış bekleyenler
GPT: F-001 şartnamesi, F-004 TR/EN çeviri tablosu, F-020 tek terim, F-008/010/011/012 denge önerileri. Kullanıcı kararı: F-019, F-022. F-013 iptal; F-002/003/014/015/016/017 ertelendi.

## Notlar
- Opus ajanı denendi ve kullanıcı tarafından durduruldu; hiçbir değişiklik yazılmadı.
- Ölçüm aracı: `rt.mjs` (paketin `FABLE_ILK_TUR/arac/`); Playwright yolu bu ortamda `/opt/node-tools/node_modules/playwright`, sunucu `python3 -m http.server 8770 -d oyun-son`.
