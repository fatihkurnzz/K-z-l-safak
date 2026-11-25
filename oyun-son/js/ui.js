// Arayüz girişi. Modüller: ui-core (ortak) · ui-hub (ana üs) · ui-battle (kapı, VS, sonuç) · ui-party · ui-town (binalar)
import './ui-battle.js';
import './ui-party.js';
import './ui-town.js';
import './ui-esya.js';
import './ui-envanter.js'; // envanter ızgarası ve Çanta (Örs ve Pazar da kullanır)
import './ui-social.js';
import './ui-kalicilik.js';
import './ui-klan.js';
import './ui-odeme.js'; // Yakut Al, arkadaşlar, şikâyet ve engel
import './ui-karakter.js'; // karakter seçme ekranı, char.* işlemleri
import './ui-olustur.js'; // karakter oluşturma ekranı (ırk, sınıf, görünüş, 3B önizleme; gorunus.js)
import './ui-dunya.js'; // saat ve hava, Otağ (Başbuğ, hazine, ulufe), Diyar Haritası, ırk sohbetinin sabit çubuğu
import './ui-pvp.js'; // sezon, zorluk kademeleri, Nöbet, çanta uyarısı, dönüm noktaları
import './ui-rapor.js'; // savaş raporu, Savaş Raporları penceresi
import './ui-ses.js'; // ses: arayüz, örs, ödül ve savaş seslerinin bağlantıları, ortam ve ezgi, Menü'deki hoparlör düğmesi
import './ui-kaplama.js'; // arayüz kabuğu: gün evresi, sekme geçişi, başlık ikonları, kaynak sayımı (stiller css/kaplama.css)
import './ui-isik.js'; // grafik kademesi seçimi, Örs anının kıvılcımları
import './ui-guvenlik.js'; // yasak, başka cihazda açılan oturum ve eski sürüm ekranları; sohbette susturma bildirimi
import './ui-destek.js'; // Duyurular, Sorun / Teknik Destek
import './ui-ayarlar.js'; // Ayarlar penceresi (grafik, ses, dil, bildirimler, hesap); dil sistemi i18n.js
import './ui-cevrimici.js';
import './ui-meydan.js';
import './ui-zindan.js';
import './ui-baskin.js'; // Dünya Baskını: hafta sonu iki ırkın ortak boss'u (Kapı → Etkinlikler)
import './ui-duyuru.js'; // sunucu duyuru şeridi
import './ui-ogretici.js'; // Yemin Pazarı NPC'leri ve öğreticinin hikâyesi
import './a11y.js'; // erişilebilirlik ayarları (html sınıfları açılışta uygulanır)
import './ui-rehber.js'; // Rehber (ansiklopedi bölümleri)
import './ui-anagorev.js'; // ana görev ağacı
import './ui-minidizi.js'; // Mini Dizi: 10 bölüm, ödül, menü rozeti
// import './ui-sandik.js'; // çevrimdışı ödül sandığı: 19 Kas kullanıcı isteğiyle oyundan kaldırıldı (kurallar shared/sandik.js duruyor)
import './ui-balik.js'; // Yemin Pazarı göleti: balık tutma
import './ui-sunucu.js'; // sunucu (Ares) bilgi paneli
import './ui-karaborsa.js';
import './ui-nobet.js';
import './ui-yemin.js'; // Taş Yemini ortak baskını (20 Kas)
import './ui-destan.js'; // Destan: sekiz hikâye bölümü (20 Kas)
import './ui-anit.js'; // Anıt Savaşı: Şaman Yashka'dan (19 Kas) // Kristal Nöbeti: Yemin Pazarı'nda Şaman Yashka (19 Kas) // Yemin Pazarı Karaborsası (19 Kas)
import './ui-klavye.js'; // döndürülmüş kipte (dik telefon) oyunun yatay ekran klavyesi
import './ui-denetci.js'; // Oyun Denetçisi: FPS, kare süresi, bellek ölçümü // Zindanlar: mini sahneler ve ilerleme yolları // Meydan (CZ - PK): Savaş, Savunma, Meydan Marketi, Şan Dükkânı // çevrimiçi ödülleri (15 dk · 30 dk · 1 sa · 2 sa)
import './ui-ahir.js'; // P28: Ahır (yoldaşlar) ve üç binanın ortak tam ekran katmanı
import './ui-han.js'; // P28: Han (içecek buff'ları, Sıcak Çorba, HUD rozeti)
import './ui-zafer.js'; // P28: Zafer Anıtı (son halk savaşı, günlük ödül)
export { showHub, showCreate } from './ui-hub.js';
export { toast } from './ui-core.js';
