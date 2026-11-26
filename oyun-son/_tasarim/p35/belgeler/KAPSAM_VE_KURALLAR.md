# Kapsam ve kurallar (kullanıcı talimatından damıtıldı)

## Değiştirilmesi YASAK
Vahran Destanı'nın özgün hikâyesi, olayları, karakterleri, diyalogları, finali · mevcut oyun konsepti · Elentha ve Kragmir kimlikleri · onaylı şehirler/bölgeler/iç mekânlar · mevcut karakter/silah/zırh/eşya tasarımları · oyun mekanikleri, ekonomi değerleri, oyuncu kayıtları · mevcut sistemlerin işlevleri. Hiçbir içeriği izinsiz kaldırma; hikâye, görev, NPC, eşya, ödül, para birimi, mekanik UYDURMA.

## Sanat yönü
Gerçekçi, boyalı, karanlık fantastik 2B RPG. **Elentha:** koyu lacivert, mat eskitilmiş altın, onaylı çift başlı kartal arması, asil metal işçiliği, doğal mavi vurgu, kumaş/parşömen. **Kragmir:** koyu bordo, karartılmış demir, eskitilmiş bronz, onaylı alevli göz arması, sert metal, doğal kızıl vurgu, **yeşil tenli orklar**. İki halkın ışık, kontrast, keskinlik, gerçekçilik, malzeme kalitesi ve hiyerarşisi EŞİT olacak; yalnız renk/arma/doku/dekor farklılaşır.

## Arayüz kuralları
Aynı tasarım dili, aynı yerleşim DEĞİL: her menüye işlevine özel yerleşim · menüler gereksiz tam ekran olmasın, oyun dünyası görünsün · sık işlemler hızlı · gereksiz süs/büyük boşluk/aşırı parlaklık yok · yazı, buton, ikon, boşluk tutarlı · normal/seçili/kilitli/pasif/başarılı/hatalı durumlar ayrı · güzellik uğruna kullanım kolaylığından ödün verme. Son onaylanan görev arayüzü (`Elenthia_Gorev_Arayuzu_Ortalandi.png` — **dosya adındaki yazım yanlış; ırk Elentha'dır**) bağlayıcı yaklaşım referansıdır; içindeki örnek görev adları/sayılar gerçek veri DEĞİLDİR. R3'teki "eski görev arayüzünü koru" kararı geçersizdir.

## Kullanıcı kararı (bu pakette kesin)
- **G8 onaylı çift başlı kartal (Elentha) ve alevli göz (Kragmir) armaları geçerlidir.** Taraf Seç ekranındaki ESKİ semboller (güneş / kızıl göz) görsel dönüşüm sırasında bunlarla değiştirilecek. (Kaynakta: `js/ui-olustur.js:124` `.vz-ban > i.vz-emb`; eski sembol notu `css/duzen.css` ~230. satır.)
- Savaş regresyon testleri, P34-10 Mini Dizi videosu, P35-05 oyun sonu çeşitliliği KAPSAM DIŞI.
- GIF yok. Görsel: WebP; gerçek alfa gerekirse alfa destekli WebP/PNG.
- Opus tek yetkili nihai entegratör; GPT = tasarım/sanat/şartname; Neon = ek görsel + bağımsız sanat denetimi; Fable = nihai kabul.

## P35-06 … P35-09 hakkında NOT (açık)
Kullanıcının ana talimatı "P35-06, P35-07, P35-08 ve P35-09 çalışmalarını gerçekleştir" diyor ama bu dört numaranın **her birinin kapsamı yazılı olarak tanımlanmadı**. Bu paket dördünün ORTAK girdisidir ve numaraları KENDİ KAFANA GÖRE bölme. Bölüm tanımı kullanıcıdan istenmelidir (öneri: 06 = tasarım sistemi + envanter, 07 = pilot üç ekran, 08 = diğer ekranlar, 09 = mobil/performans/belgeler — YALNIZ ÖNERİ, onaylanmadı).

## Önceki P35 kararları (bağlam)
P35-01…04 (Destan metni, görev yapısı D02/D03/D04, dönem bonusu D06/D07, görev paneli D08) hakkında kullanıcı henüz nihai karar vermedi. Pilot tasarım bu kararlardan **bağımsız çalışacak** biçimde istenir (`05_PILOT/D02_D08_PILOT_ETKISI.md`).
