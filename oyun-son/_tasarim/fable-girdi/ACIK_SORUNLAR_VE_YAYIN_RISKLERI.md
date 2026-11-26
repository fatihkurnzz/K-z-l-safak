# Açık sorunlar ve yayın riskleri (sürüm 42)

Kaynak: `BIRLESIK_HATA_VE_GOREV_MATRISI.json` (88 kayıt). KAB-01…25 ölçütleri hariç açık/kısmi/test edilmemiş kayıt: **19**, tekil kök nedene indirgenince **14** (önem: Yüksek 5, Orta 6, Düşük 3). Önem Opus'un önerisidir; Fable yeniden değerlendirmelidir.

## Kök nedene göre
| Kök neden | Kayıtlar | Önem | Durum | Yayına engel? (Opus görüşü) |
|---|---|---|---|---|
| v42'de tam savaş regresyonu ve ekran turu yapılmadı | P34-B06, N5-02 | Yüksek | TEST EDİLMEDİ | Belirsiz — yeni savaş görselleri ve boss uyarısı süresi gerçek akışta gözlenmedi |
| Gerçek cihaz / performans / uzun oturum / ağ / Play Store yok | P34-B11, N6-08 (cihaz kısmı) | Yüksek | TEST EDİLMEDİ | Evet (mağaza yayını için) |
| Yayın profilinde test paneli | G2-10 | Yüksek | KISMEN (kod hazır, `DD_STORE` ayarlayan paket yok) | Evet, Play Store paketi `DD_STORE` olmadan çıkarsa |
| Telif / lisans / AI kullanım koşulları / EN eşya adları | P34-B10 | Yüksek | AÇIK | Olası |
| 667×375 okunurluk (savaş HUD düzeldi; harita etiketleri üst üste) | N-2-001, G2-08, N6-08 (çözünürlük kısmı) | Yüksek→Orta | KISMEN | Hayır (dar telefon sınıfı) |
| Bozuk kayıtta kurtarma/yedek yok | P34-B13 | Orta | AÇIK (mekanik/kayıt biçimi; izinsiz yapılmadı) | Olası |
| Ses teslim edilmedi (müzik, ortam, NPC) | P34-B03 | Orta | AÇIK | Hayır (mevcut ses çalışıyor) |
| P34-06'da 3 türün kimlik sapması | P34-B04 | Orta | AÇIK | Hayır |
| Dokunma hedefleri < 44 px | N6-01, N-2-002, G2-07 | Orta | KISMEN | Hayır |
| Özgün 32 maddelik kapsam belgesi yok | G2-13 | Orta | AÇIK | Hayır (belge) |
| Aynı işe birden çok giriş (mağaza 5, unvan 3, görev 2, Meydan 4) | BUL-B4 | Orta | AÇIK (kullanıcı kararı) | Hayır |
| Gemini teslim manifesti eksik | P34-B02 | Düşük | AÇIK (uzman kaydı) | Hayır |
| Tepegöz eski vurulma pozunda beyaz leke | P34-B05 | Düşük | AÇIK | Hayır |
| Uzman raporları arası tutarsızlık | P34-B07 | Düşük | AÇIK | Hayır |

## Bilinen ama "sorun" sayılmayanlar (kullanıcı kararı / kapsam dışı)
P34-10 Mini Dizi video (kapsam dışı) · T3 görünümü kapalı · test paneli web derlemesinde görünür · sunucu yok (ilk sürüm yerel kayıt) · gerçek para yok · P34-07 D katmanı isteğe bağlıydı.

## Fable'ın özellikle doğrulaması önerilen noktalar
1. Hareket katmanlarının doğallığı ve fotoğrafla dikişsizliği (özellikle Kragmir duman ve büyük sancak, kare geçişlerinde arka plan "kayması").
2. NPC göz kapalı karelerinin kalitesi.
3. Yeni boss evre-2 ve yaratık pozlarının savaşta zemin oturması ve ölçeği.
4. Zafer Anıtı / Han / Ahır'ın iki halkta yenilenmesi (düzeltme yalnız Kragmir'de test edildi).
5. v41 ekran turunun v42'de geçerliliği (v42'de ekran açan yeni eylem yok; değişiklikler katman, diyalog, kart, bina yenilenmesi).
