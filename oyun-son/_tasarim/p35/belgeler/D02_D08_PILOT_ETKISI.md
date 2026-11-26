# P35 D02 / D08 kararlarının pilot tasarıma etkisi

**Durum:** D02 (64 görevin yeniden gruplanması), D03/D04 (sıra ve metin düzeltmeleri), D05 (min_lvl), D06/D07 (dönem bonusu), D08 (görev paneli gruplaması), D11 (tek ana hedef) hakkında **kullanıcı henüz nihai karar vermedi** (bağımsız uzman görüşleri toplanıyor). Bu belge karar vermez; pilot tasarımın hangi sonuçta da bozulmaması için gerekenleri yazar.

## Mevcut (V42, kaynaktan)
64 görev, 16 bölüm × 4 (`a`,`b`/`c`,`d`), `pre` ile bağlı; sayaçlar canlı; ödüller Bağlı. Panel: 16 sütunluk yatay kaydırmalı ağaç + ayrıntı kartı.

## Önerilen / tartışılan değişim (hepsi ONAYSIZ)
| Konu | GPT (P35-02) | Opus değerlendirmesi (önerilen revizyon) |
|---|---|---|
| Gruplama | 17 ana sefer · 9 rehber · 1 Destan bağlantısı · 37 isteğe bağlı | ~16 sefer · ~10 rehber · 2 Destan bağlantısı · ~36 isteğe bağlı |
| Panel | Sefer için 17 sıralı kart + yardımcı ayrı liste | Mevcut ağaç kalsın; **“Ana yol / Tümü” süzgeci** + `mqNext` önceliği |
| Sıra düzeltmeleri | m25 → m28 → m24; m32 Destan IV köprüsü; m52 Marven 4-20; m56 Adsız 4-25 | Aynı (ek: m43 tekrarı, m57 rehbere, m64 adı) |
| Seviye kilidi | görev başına `min_lvl` | Veri kopyası yerine mevcut `UNLOCK` tablosundan **bilgi**; görev "kilitli" duruma geçmez |
| Dönem bonusu | 4/6 · 5/7 · 4/6 | Kilitli görev eşikten düşsün + 1 esnek hak (ekonomi onayı şart) |
| HUD / defter | Tek ana hedef + tek yardımcı öneri; Destan x/8, sefer x/17 | Aynı fikir, sade biçim |

## Tasarım için ZORUNLU sonuçlar (karar ne olursa olsun)
1. **Grup sayısı ve ad sayısı sabit değildir:** bileşen N grup başlığı + M görev satırı/düğümü kabul etmeli (grup adları ve sayaçlar veriden).
2. **İki ayrı ilerleme göstergesi** (Destan `x/8`, sefer `x/N`) için yer ayır; N = sefer düğümü sayısı değişebilir (16 / 17).
3. **Kategori rozeti** (Ana sefer / Rehber / İsteğe bağlı / Destan bağlantısı) için küçük, renk-körü dostu bir işaret; kategori YOKSA gizlenebilmeli (karar çıkmazsa bugünkü 16 bölüm).
4. **Süzgeç şeridi** (Ana yol / Tümü) için yer ayır; yoksa gizlenebilmeli.
5. **Kilitli ≠ kapalı:** “seviye/özellik koşulu” bilgisi (ör. “Meydan 12. seviyede açılır”) görev durumundan ayrı bir bilgi satırı olmalı.
6. **Dönem sandığı** eşik metni “hepsi” veya “N / M” olabilir (6/6 mı 4/6 mı belli değil): sayıları gömme.
7. Destan bağlantısı satırı (“Destan IV'ü tamamla”) bir ekran açar (`ACT.destan`), ödül almaz.
8. Referans görseldeki örnek görev adları ve sayılar KULLANILMAYACAK; her metin veriden gelecek (`07_VERI/anagorev.json`).

## Ne zaman netleşir
Kullanıcı kararı sonrası bu belge güncellenir. Kararlar gelmeden pilot tasarım “karar-bağımsız” (yukarıdaki 8 madde) üretilmeli; karar sonrası veri etiketleri (kategori, sıra) eklenir.
