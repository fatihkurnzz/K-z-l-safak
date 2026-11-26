# Eksik ve doğrulanamayan şeyler (açık kayıt)

## Ekran görüntüleri
1. **Test hesabı:** dev araçlarıyla (Sv.53, bol eşya/akçe) alındı; oyun verisi değildir. Yuvalar boş görünüyor (kuşanma yapılmadı). Klansız hesap.
2. **Görüntüsü olmayan ekranlar:** `01_ENVANTER/EKRAN_ENVANTERI.md` bölüm 3'teki eylemler (122 ekran açan eylem). Klan-içi sekmeler, Destan bölüm modalları/savaşları, Mini Dizi oynatıcı, onay penceresi varyantları, boss/zindan/nöbet/baskın/PvP savaş evreleri, hata/boş/yükleniyor durumları.
3. **Çekilemeyen pilot ek:** `karakter-esya-karti` (eşya bilgi kartı modalı): otomatik kuşanma/seçme akışı çalışmadı; kaynak `js/ui-kahraman.js cardFor` ve `05_PILOT` yazısından tasarlanmalı. Bu ekran Opus entegrasyonunda ayrıca çekilecek.
4. V41'den V42'ye görsel olarak değişen 38 durum envanterde `v41_durum=degisti` ile işaretli; V41 görüntüleri GPT'ye teslim EDİLMEDİ (yalnız Gemini'ye gitti); bu pakette doğrudan V42 görüntüsü var. V41'den aynı kalanlar için Gemini KABUL2 paketindeki yol (`01_EKRANLAR_880x406/<halk>/<ad>.webp`) yalnız kayıt amaçlı yazıldı.
5. Görüntüler 1760×812 WebP (880×406 × 2). Orijinal çekim 2341×1080 PNG (dpr 2,66) kalite kaybıyla küçültüldü; ince yazı detayı için gerekirse orijinal çekim yeniden verilebilir.

## Ölçümler
6. 667/880/1180 ölçümü yalnız 19 pilot ekran × 2 halk; diğer ekranlar yalnız 880×406 (V42 çekimi `_denetim.json`) ölçüldü ve pakete DAHİL DEĞİL (özet sayılar envanterde yok).
7. `kaydirilabilir` değeri kaydırılabilir öğe SAYISIdır, piksel değil.
8. Dokunma hedefi ölçümü `denetci.js` (öğe + konumlu ::after/::before genişletmesi) ile; gerçek parmak testi yok.
9. Gerçek cihaz, performans (FPS, bellek, yükleme), PvP, ödeme, klan-içi, çoklu cihaz testleri YAPILMADI.

## Veri / kaynak
10. Görev `v(p)` ilerleme işlevleri JSON'a dökülemez (fonksiyon); `07_VERI/anagorev.json` yalnız statik alanları içerir.
11. “Taraf Seç” eski sembol dosyaları kesin tanımlanmadı (`.vz-emb` CSS'i ve `grafik5/flama` olasılığı); G8 armaları geçerli kabul edildi, eski sembollerin yeri Opus entegrasyonunda doğrulanacak.
12. `Elenthia_Gorev_Arayuzu_Ortalandi.png` referans dosyası bu paketin ELİNDE DEĞİL (GPT'de/kullanıcıda); paket onu varsaymıyor.
13. P35-06…09 numaralarının kapsamı kullanıcı tarafından yazılı tanımlanmadı (bkz. KAPSAM_VE_KURALLAR.md).
14. Yeni tasarım sistemi, prototipler, Neon/Opus paketleri BU PAKETTE YOK (GPT işi); bu yalnız girdidir.
