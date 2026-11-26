// OTOMATİK DEĞİL, veri: GPT 6.2 NPC replikleri (KORANT_GPT_TESLIM npc_replikleri.json, sürüm KORANT-v40-1dda167; 15 rol, 105 replik).
// P33 adaptörü: anahtar = "<eylem>:<halk>" (halk: sancak | ocak | ortak). gpt-npc-* yalnız içerik kimliğidir, oyun NPC kimliği değildir.
// Kurallar (GPT talimatı): selamlama rastgele tek satır; başarı/başarısızlık yalnız GERÇEK işlem sonucundan sonra; kral ve komutan
// için işlem yoksa başarı satırı bağlanmaz; Kragmir tüccarına Halvor satırları kopyalanmaz; EN dilinde Türkçe satır gösterilmez
// (çeviri gelene dek mevcut metin kalır). Yalnız görünüş: kural, ekonomi ve kayıt değişmez.
import { lang } from './i18n.js';
export const SOZ = {
 "han:sancak": {
  "kimlik": "gpt-npc-01",
  "ad": "Hancı",
  "selamlama": [
   "Hoş geldin, yolcu.",
   "Ocağımız yorgunlara açıktır.",
   "Kadehini seç, yolun uzun."
  ],
  "basari": [
   "Gücün yerine gelsin.",
   "Yolun açık olsun."
  ],
  "basarisizlik": [
   "Kesen buna yetmiyor.",
   "Şimdilik başka bir içecek seç."
  ]
 },
 "ahir:sancak": {
  "kimlik": "gpt-npc-02",
  "ad": "Seyis",
  "selamlama": [
   "Yoldaşın seni bekler.",
   "Her dost emek ister.",
   "Ahırımıza hoş geldin."
  ],
  "basari": [
   "Yoldaşın hazır.",
   "Bağın kuvvetlendi."
  ],
  "basarisizlik": [
   "Henüz şartları karşılamıyorsun.",
   "Önce gerekli malzemeyi getir."
  ]
 },
 "otag:sancak": {
  "kimlik": "gpt-npc-03",
  "ad": "Kral Edran",
  "selamlama": [
   "Sözünün eri ol, savaşçı.",
   "Ak Kuleler seni selamlar.",
   "Diyarın halini gör."
  ],
  "basari": [
   "Hizmetin unutulmayacak.",
   "Elentha adına teşekkür ederim."
  ],
  "basarisizlik": [
   "Bu işin şartları henüz tamam değil.",
   "Hazır olduğunda yeniden gel."
  ]
 },
 "karaborsa:sancak": {
  "kimlik": "gpt-npc-04",
  "ad": "Kaçakçı",
  "selamlama": [
   "Sessiz ol, yolcu.",
   "Burada gözler değil keseler konuşur.",
   "Mallarıma bak, adımı sorma."
  ],
  "basari": [
   "Alışveriş tamam.",
   "Seçimin isabetli."
  ],
  "basarisizlik": [
   "Bu bedel karşılanmadı.",
   "Şimdilik anlaşamadık."
  ]
 },
 "clanhq:sancak": {
  "kimlik": "gpt-npc-05",
  "ad": "Komutan",
  "selamlama": [
   "Sancağını onurla taşı.",
   "Birlik olmadan zafer olmaz.",
   "Karargâha hoş geldin."
  ],
  "basari": [
   "Emir yerine getirildi.",
   "Birliğin güç kazandı."
  ],
  "basarisizlik": [
   "Yetkin veya şartların yetersiz.",
   "Önce hazırlığını tamamla."
  ]
 },
 "han:ocak": {
  "kimlik": "gpt-npc-06",
  "ad": "Ork Hancı",
  "selamlama": [
   "Ocağa yaklaş, savaşçı.",
   "Yorgun kemikler ateş ister.",
   "Ne içeceksin, söyle."
  ],
  "basari": [
   "Gücün geri dönsün.",
   "Dişini sık, yoluna devam et."
  ],
  "basarisizlik": [
   "Kesen hafif kalmış.",
   "Başka bir içecek seç."
  ]
 },
 "ahir:ocak": {
  "kimlik": "gpt-npc-07",
  "ad": "Ork Binek Bakıcısı",
  "selamlama": [
   "Yoldaşını yalnız bırakma.",
   "Diş ve pençe sadakat ister.",
   "Ahıra gir, savaşçı."
  ],
  "basari": [
   "Yoldaşın hazır.",
   "Bağınız demir gibi olsun."
  ],
  "basarisizlik": [
   "Şartları tamamlamadın.",
   "Gerekli malzemeyle dön."
  ]
 },
 "otag:ocak": {
  "kimlik": "gpt-npc-08",
  "ad": "Kral Volgar Demirdiş",
  "selamlama": [
   "Ocağın gücü seninle olsun.",
   "Toprak, çekice boyun eğer.",
   "Diyarın yükünü gör, savaşçı."
  ],
  "basari": [
   "Hizmetin demire kazınsın.",
   "Kragmir bunu unutmaz."
  ],
  "basarisizlik": [
   "Henüz hazır değilsin.",
   "Şartları tamamla, sonra dön."
  ]
 },
 "karaborsa:ocak": {
  "kimlik": "gpt-npc-09",
  "ad": "Ork Kaçakçı",
  "selamlama": [
   "Az konuş, malı incele.",
   "Karanlıkta iyi mallar bulunur.",
   "Kesen hazır mı, savaşçı?"
  ],
  "basari": [
   "Anlaştık, mal senin.",
   "İyi pazarlık ettin."
  ],
  "basarisizlik": [
   "Bedeli karşılamadın.",
   "Bu iş bugün olmaz."
  ]
 },
 "clanhq:ocak": {
  "kimlik": "gpt-npc-10",
  "ad": "Ork Komutan",
  "selamlama": [
   "Safını sıkı tut.",
   "Oba, tek yumruk olmalı.",
   "Karargâha gir, savaşçı."
  ],
  "basari": [
   "Emir tamamlandı.",
   "Obanın gücü arttı."
  ],
  "basarisizlik": [
   "Yetkin ya da şartların eksik.",
   "Hazırlan ve geri dön."
  ]
 },
 "anvil:ortak": {
  "kimlik": "gpt-npc-11",
  "ad": "Büyük Örs Ustası",
  "selamlama": [
   "Demir sabır ister.",
   "Örsün başında acele etme.",
   "İşlenecek eşyayı göster."
  ],
  "basari": [
   "Örs işini gördü.",
   "Çekiç boşa inmedi."
  ],
  "basarisizlik": [
   "Bu işlem sonuç vermedi.",
   "Örs bugün istediğini vermedi."
  ]
 },
 "c_silah:ortak": {
  "kimlik": "gpt-npc-12",
  "ad": "Silah Tüccarı",
  "selamlama": [
   "Silahını dikkatle seç.",
   "Her el aynı çeliği taşımaz.",
   "Tezgâhıma hoş geldin."
  ],
  "basari": [
   "Alışveriş tamam.",
   "Silahın yoluna eşlik etsin."
  ],
  "basarisizlik": [
   "Bu alışveriş tamamlanamadı.",
   "Şartları karşılayınca dön."
  ]
 },
 "c_zirh:ortak": {
  "kimlik": "gpt-npc-13",
  "ad": "Zırh Tüccarı",
  "selamlama": [
   "Sağlam zırh, uzun yol demektir.",
   "Tezgâhımdaki işçiliğe bak.",
   "Kendine uygun zırhı seç."
  ],
  "basari": [
   "Alışveriş tamam.",
   "Zırhın seni korusun."
  ],
  "basarisizlik": [
   "İşlem tamamlanamadı.",
   "Önce şartları karşıla."
  ]
 },
 "c_taki:ortak": {
  "kimlik": "gpt-npc-14",
  "ad": "Takı Tüccarı",
  "selamlama": [
   "Her taşın bir hikâyesi var.",
   "İşçiliği dikkatle incele.",
   "Tezgâhıma hoş geldin."
  ],
  "basari": [
   "Seçimin tamamlandı.",
   "Güle güle kullan."
  ],
  "basarisizlik": [
   "Bu alışveriş tamamlanamadı.",
   "Şartları tamamlayıp dön."
  ]
 },
 "merchant:sancak": {
  "kimlik": "gpt-npc-15",
  "ad": "Tüccar Halvor",
  "selamlama": [
   "Yemin Pazarı seni karşılar.",
   "İyi donanım, iyi hazırlıktır.",
   "Ne aradığını söyle, yolcu."
  ],
  "basari": [
   "Alışverişin hayırlı olsun.",
   "Seçimin yoluna yarasın."
  ],
  "basarisizlik": [
   "Bu işlem tamamlanamadı.",
   "Şartları karşılayınca yeniden gel."
  ]
 }
};
/** Rastgele tek satır ya da null (TR dışı dilde, rol yoksa ya da tür boşsa). eylem: han|ahir|otag|karaborsa|clanhq|anvil|c_silah|c_zirh|c_taki|merchant */
export function soz(eylem, tur, halk) {
  try { if (lang() !== 'tr') return null; } catch { return null; }
  const R = SOZ[`${eylem}:${halk}`] || SOZ[`${eylem}:ortak`]; const L = R?.[tur];
  return L?.length ? L[Math.floor(Math.random() * L.length)] : null;
}
