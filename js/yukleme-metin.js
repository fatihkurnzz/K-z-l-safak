// Veri: GPT 6.2 yükleme metinleri (KORANT_GPT_TESLIM yukleme_metinleri.json, sürüm KORANT-v40-1dda167): 4 bölge, 5 zindan, 20 ipucu.
// P33 kuralları (GPT): yalnız GERÇEK yükleme sırasında gösterilir (açılış yükleme ekranı; savaş öncesi perde savasHazirla beklerken),
// sahte gecikme eklenmez; zindan metni yeni lore/mekanik iddiası değildir; EN dilinde Türkçe metin gösterilmez (çeviri gelene dek boş).
export const BOLGE = {
 "1": {
  "ad": "Vahran Ovası",
  "metin": "Üç yüz yıldır kanla sulanan ovanın uzun otları, unutulmuş kemikleri saklar. Yaban sürüleri ve kurtlar eski savaşların izinde dolaşır."
 },
 "2": {
  "ad": "Kül Geçidi",
  "metin": "Sönmüş yanardağın eteğinde ince gri kül birikir. Dar geçitte taş ve gölge arasındaki tehlikeler yolcuları bekler."
 },
 "3": {
  "ad": "Kızıl Bahar Meydanı",
  "metin": "İki ordunun çarpıştığı bu yerde o yıl çiçek açmadı. Gri gölgeler hâlâ eski muharebenin izlerini takip eder."
 },
 "4": {
  "ad": "Sisli Çukur",
  "metin": "Ovanın kuzeyindeki sis, eski muharebenin kemiklerini örter. Küllerin Tarikatı ateşsiz kazanın çevresinde toplanır."
 }
};
export const ZINDAN = {
 "well": {
  "ad": "Dipsiz Kuyu",
  "metin": "Kuyunun derinliğinde yankılar birbirine karışır. Aşağıya inenler karanlığa karşı hazırlıklı olmalıdır."
 },
 "depth": {
  "ad": "Yeraltı Ocağı",
  "metin": "Taşın altında eski ocakların sessizliği hüküm sürer. Derinliklere hazırlıksız girme."
 },
 "rift": {
  "ad": "Gök Yarığı",
  "metin": "Yarığın eşiğinde gökyüzü uzak görünür. Yoluna çıkacak tehlikelere karşı hazırlığını tamamla."
 },
 "seal": {
  "ad": "Mühürlü Oda",
  "metin": "Mührün ardında sessiz bir oda bekler. Eşiği aşmadan önce donanımını gözden geçir."
 },
 "kule": {
  "ad": "Kül Kulesi",
  "metin": "Külün örttüğü kule, yükseldikçe yeni sınavlar vaat eder. Her adımda gücünü ölç."
 }
};
export const IPUCU = [
 "Çantandaki silahı kuşanmadan savaşta kullanamazsın.",
 "Yeteneklerini savaştan önce gözden geçir.",
 "Mana tüketimini takip et.",
 "İksirlerini savaş öncesinde hazırla.",
 "Düşmanın zayıflıklarını incele.",
 "Kalkan etkisi alınan hasarı emer.",
 "Sersemleme ve Donma hedefin sırasını kaybetmesine neden olur.",
 "Çürüme alınan şifayı yarıya indirir.",
 "Kırık Zırh savunmayı azaltır.",
 "Sağlamlık fiziksel hasara karşı etkilidir.",
 "Yetenek ağacını sınıfının rolüne göre seç.",
 "Örs işleminin olası sonuçlarını onaylamadan önce oku.",
 "Kullanmadığın eşyaları satmadan veya parçalamadan önce kontrol et.",
 "Han içeceklerinin bonuslarını karşılaştır.",
 "Ahırda yoldaşlarını yönetebilirsin.",
 "Kapı üzerinden bölge ve aşama seçebilirsin.",
 "Savaş hızını 1x ile 3x arasında ayarlayabilirsin.",
 "Görev Defteri üzerinden ilerlemeni takip et.",
 "Günlük sıfırlama UTC+3 gece yarısında gerçekleşir.",
 "Haftalık sıfırlama pazartesi 00.00 UTC+3 saatindedir."
];
const trMi = () => { try { const l = document.documentElement.lang || localStorage.getItem('dd_lang') || 'tr'; return !l || l === 'tr'; } catch { return true; } };
/** Rastgele ipucu ya da '' (TR dışı dilde). */
export const ipucu = () => (trMi() ? IPUCU[Math.floor(Math.random() * IPUCU.length)] : '');
/** Savaş bağlamının yükleme metni: { ad, metin } ya da null. args: startBattle bağımsız değişkeni ({ stage: 'bölge-no' } ya da { mode }). */
export function savasMetni(args) {
  if (!trMi() || !args) return null;
  if (args.mode && ZINDAN[args.mode]) return ZINDAN[args.mode];
  const z = (!args.mode || args.mode === 'stage') && args.stage ? +String(args.stage).split('-')[0] : 0;
  return BOLGE[z] || null;
}
