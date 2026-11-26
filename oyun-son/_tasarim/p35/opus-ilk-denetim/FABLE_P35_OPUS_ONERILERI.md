# Opus entegrasyonu için öneriler (bağımlılık sırasıyla)

Bu bölüm yalnız öneridir; bu turda kod yazılmadı. Her adım tek entegrasyon dalında, önce ve sonra testle yapılır.

| Sıra | İş | Bağımlılık | Kabul | Bulgular |
|---:|---|---|---|---|
| 0 | F-001 (bozuk kayıt yedeği) ve F-021 (sekme devri) | — | V42 şartnamesi | OP35-08'in ön şartı |
| 1 | Üç P35 yamasını birlikte uygula (P35-02/04, D09, P35-01). Yeni CSS'i son katmana (`p35.css`) taşı | 0 | Çakışmasız; 274 + 40 + 184 test yeniden geçer | OP35-23 |
| 2 | Metin düzeltmeleri: m25 (Bran'sız), m37 (çatlak geçmişte), m61 adı; P35-01 görsel eşlemesi (II intro → minidizi-02); figcaption kaldırılır | Kullanıcı metin onayı | Metinler özgün olayla çelişmez; EN karşılığı F-004 sözlüğünde | OP35-01, 03, 06, 07 |
| 3 | D06/D07 A politikasını gerçek dispatch'e bağla: tick anlık görüntüsü, bonus işleyicileri, dailyBonus sayacı, arayüz, eski kayıt | 0, 1 | H-06; çift ödül 0; Sv.11 oyuncu sandık alır | OP35-08 |
| 4 | Ana ekran izleyicisine "n yan ödül hazır" rozeti (yeni panel yok) | 1 | Hazır yan ödül görünür | OP35-09 |
| 5 | Kullanıcı kararlarını al: OP35-05 (Destan uyarlaması), OP35-12 (atlayan Savaşçı), P35-05 C1–C6 | — | Karar kaydı | — |
| 6 | P35-05 Koleksiyon: K2 görünümü, sanal liste, bütün ekleme yolları, `dev` işaretli işlemleri atla | 5, F-002 kararı | H-05; 1247 kayıt DOM'a tek seferde basılmaz | OP35-15, 16 |
| 7 | P35-05 Avcı Seferi: seçilen rota ekseni ve ad; well kimliği ve sayaçları korunur | 5, H-01 | Eski wellBest ve unvan korunur; hak yalnız onaylı girişte düşer | OP35-13, 14 |
| 8 | Gemini varlıkları gelince: alfa türevleri, `varlik_kontrol.py` eklentileri, dosya olarak teslim, rubrik denetimi | Gemini teslimi | ≤8 MB; rubrik §7 | OP35-17, 18, 21, 22 |
| 9 | Ekran kabulü: 240 satır (yinelenenler birleşik), 122 eylem sınıfı elle doğrulanmış, 667/880/1180 × TR/EN × iki halk | 1–8 | Satır başına kanıt | OP35-19, 20 |
| 10 | Fable ikinci tur | 9 | Bu paketteki 23 bulgunun durumu güncellenir | — |

**Dokunulmayacaklar:** savaş motoru (P36), yayın/mağaza, özgün destan metni, kullanıcı onaylı ödül tutarları ve görev adetleri.
