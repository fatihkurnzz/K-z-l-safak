#!/usr/bin/env python3
# Fable girdisi · P34_NIHAI_DURUM.json + BIRLESIK_HATA_VE_GOREV_MATRISI.json (tek kaynak; sayılar buradan türetilir)
# python3 -I matris.py <çıktı klasörü> <sürüm kimliği>
import sys, os, json, collections
OUT, SURUM = sys.argv[1], sys.argv[2]
K = 'oyun-son/_tasarim/araclar/kabul-26kas'
KV = 'kanit/v42'

# ------------------------------------------------------------------ P34 (11 talep)
P34 = [
 dict(kimlik='P34-01', talep='sahneler/zafer_aniti.webp yüksek çözünürlük (aynı kadraj)', sorumlu='GPT',
      uretim='ÜRETİLDİ (GPT 2048×868). Not: Gemini de 1600×678 sürüm gönderdi; kullanıcı Gemini sürümünü KABUL ETMEDİ.',
      teslim='TESLİM EDİLDİ (KORANT_GPT_P34_NIHAI_TESLIM; sha256 manifestle eşleşti)', entegrasyon='ENTEGRE',
      yollar=['oyun-son/sahneler/zafer_aniti.webp', 'oyun-son/js/ic-mekan.js (MEKAN.zafer; oran 512/217 = 2048/868 aynı)'],
      test=f'GEÇTİ: tarayıcıda doğal ölçü 2048×868, iki halkta iç mekân arka planı ({KV}/p34_test/*/sonuc.json › zafer). Küçültülmüş hâli orijinalle ortalama 0,93/255 fark ({KV}/kontrol/zafer_kiyas.jpg Gemini sürümü için 3,85).',
      kabul='Opus entegrasyon testi geçti; uzman dışı bağımsız görsel kabul YOK (Fable).', acik=[]),
 dict(kimlik='P34-02', talep='Elentha başkent hareket katmanları (sancak, şelale, meşale)', sorumlu='GPT',
      uretim='ÜRETİLDİ: 14 eleman (5 sancak, 3 şelale, 6 alev), 6 kare, 10 kare/sn', teslim='TESLİM EDİLDİ',
      entegrasyon='ENTEGRE', yollar=['oyun-son/js/p34-katman-png.js › baskent-elentha', 'oyun-son/js/p34-katman.js', 'oyun-son/js/p33-canli.js (zerreKur → katmanKur)', 'oyun-son/css/p33-kabul.css (.p34-katman)'],
      test=f'GEÇTİ (masaüstü Chromium): tuval fotoğraf kutusunu birebir kaplıyor, pointer-events none, hareket var, etiket üstte, DOM sırası s2-bg → p34-katman → p33-ton → p33-zerre; dd_canli=0 / dd_pil=1 / hareketi azalt kaldırır, geri açınca kurulur ({KV}/p34_test/sancak/sonuc.json). Kare 00 = fotoğraf kırpımı (ölçüm 0,0 fark).',
      kabul='Opus testi geçti; görsel doğallık bağımsız kabulü YOK.', acik=['GPT atladı: uzak şelale kolları ("ilk taslakta işlenmedi"; yerlesim.json atlananlar)', 'Gerçek cihazda FPS/pil etkisi test edilmedi']),
 dict(kimlik='P34-03', talep='Kragmir başkent hareket katmanları (lav, alev, duman, sancak)', sorumlu='GPT',
      uretim='ÜRETİLDİ: 14 eleman (5 sancak, 2 lav, 1 duman, 6 alev)', teslim='TESLİM EDİLDİ', entegrasyon='ENTEGRE',
      yollar=['oyun-son/js/p34-katman-png.js › baskent-kragmir'], test=f'GEÇTİ ({KV}/p34_test/ocak/sonuc.json)',
      kabul='Opus testi geçti; bağımsız görsel kabul YOK.', acik=['GPT atladı: sağ uzak lav ("kesin ayrıştırılmadı")']),
 dict(kimlik='P34-04', talep='Yemin Pazarı tente/kumaş + iki Klan Obası sancak katmanları', sorumlu='GPT',
      uretim='ÜRETİLDİ: çarşı 13, klan-elentha 14 (çeşme dahil), klan-kragmir 14 (lav dahil)', teslim='TESLİM EDİLDİ', entegrasyon='ENTEGRE',
      yollar=['oyun-son/js/p34-katman-png.js › carsi, klan-elentha, klan-kragmir'],
      test=f'GEÇTİ iki halkta ({KV}/p34_test/*/sonuc.json › katman_carsi, katman_klan). Klan sahnesi test için doğrudan kuruldu (klan üyeliği olmadan, hub2d.show2d).',
      kabul='Opus testi geçti; bağımsız görsel kabul YOK.', acik=['Klan Obası katmanı gerçek klan akışında (klan kurup girerek) v42’de çekilmedi']),
 dict(kimlik='P34-05', talep='NPC göz kırpma / konuşma kareleri (8 G4 portresi)', sorumlu='Gemini',
      uretim='ÜRETİLDİ: 8 NPC × 3 kare (göz-yarı, göz-kapalı, ağız-açık); isteğe bağlı ağız-yarı gelmedi', teslim='TESLİM EDİLDİ ama teslim manifestinde YOK (Gemini manifesti yalnız P34-07’nin 18 dosyasını listeliyor)',
      entegrasyon='ENTEGRE (yalnız değişen bölgenin kırpımı gömüldü; tam kare tarayıcıda üretilir)', yollar=['oyun-son/js/npc-kare-png.js', 'oyun-son/js/ui-diyalog.js (canlan)'],
      test=f'GEÇTİ: 8 NPC’de diyalog portresi 7 sn içinde 2–4 farklı kare gösterdi (göz kırpma rastgele 2,5–6 sn), hareketi azalt açıkken 1 kare ({KV}/p34_test/*/sonuc.json › npc_kare). Kareler yalnız göz/ağız bölgesinde değişiyor (ölçüm: değişen piksel 93–297).',
      kabul='Opus entegrasyon testi geçti; görsel kalite bağımsız kabulü YOK.', acik=['Gözü kapalı karelerde göz kapağı bölgesi yumuşak/bulanık görünüyor (Opus gözlemi, {}/kontrol/npc_kare_kontrol.jpg)'.format(KV), 'Pencere başlığındaki küçük NPC yüzlerinde (192 px) kare yok; yalnız diyalog portresi']),
 dict(kimlik='P34-06', talep='13 kayıtlı yaratık çiziminin saldırı/vurulma pozları', sorumlu='Gemini',
      uretim='ÜRETİLDİ: kullanılan 11 tür × 2 = 22 (dragon_earth ve dragon_poison hiçbir yaratıkta kullanılmadığı için istenmedi)', teslim='TESLİM EDİLDİ ama teslim manifestinde YOK',
      entegrasyon='KISMEN: 8 tür (16 görsel) entegre; lamia, snake_queen, dragon_lightning (6 görsel) KİMLİK SAPMASI nedeniyle ENTEGRE EDİLMEDİ (bekleme pozuyla renk/desen farkı; savaşta poz değişiminde göze batar)',
      yollar=['oyun-son/js/b2d-y1.js (rabbit)', 'oyun-son/js/b2d-y3.js (falcon, gargoyle, hornet, leader_of_barbarian)', 'oyun-son/js/b2d-yb.js (dragon_fire, dragon_ice, dragon_shadow)'],
      test=f'GEÇTİ (veri): tarayıcıda 384×384 çözülüyor ({KV}/p34_test/*/sonuc.json › veri.pozlar). Gerçek savaşta bu türlerle poz geçişi v42’de ÇEKİLMEDİ (savaş regresyonu durduruldu).',
      kabul='Opus görsel kontrolü: 8 tür tutarlı; 3 tür reddedildi ({}/kontrol/yaratik_kontrol.jpg). Bağımsız kabul YOK.'.format(KV),
      acik=['lamia, snake_queen, dragon_lightning için kimliği bekleme pozuyla aynı yeni saldırı/vurulma çizimi gerekli', 'leader_of_barbarian ve gargoyle renkleri bekleme pozundan biraz farklı (kabul edildi, Fable değerlendirmeli)']),
 dict(kimlik='P34-07', talep='Boss 2. evre özgün dönüşüm çizimleri', sorumlu='Gemini',
      uretim='ÜRETİLDİ: A (5 ana boss) 15 + B (Marven, Adsız) 6 + C (4 ejder) 12 = 33 zorunlu; D (12 aile bossu, isteğe bağlı) ÜRETİLMEDİ', teslim='TESLİM EDİLDİ (manifest yalnız B+C 18 dosyayı listeliyor; A 15 dosya manifestte yok)',
      entegrasyon='ENTEGRE (33/33). Aile bossları eski evre-2 çizimiyle kaldı.', yollar=['oyun-son/js/b2d-yb.js (5 ana boss + 4 ejder)', 'oyun-son/js/b2d-y4.js (maresal-marven, adsiz)', 'oyun-son/js/savas-birim2d.js (evre-2 geçişi: can ≤ %50 / evre / öfke; DEĞİŞMEDİ)'],
      test=f'GEÇTİ (veri): 33 görsel tarayıcıda çözülüyor; ejderlerde evre-2 artık var ({KV}/p34_test/*/sonuc.json). Gerçek boss savaşında evre geçişi v42’de ÇEKİLMEDİ.',
      kabul='Opus görsel kontrolü: kimlik korunmuş, Tepegöz tek göz ({}/kontrol/boss_kontrol.jpg). Bağımsız kabul YOK.'.format(KV), acik=['D katmanı (12 aile bossu) isteğe bağlıydı, gelmedi', 'dragon_lightning evre-2 çizimi beyaz-mor bekleme pozundan mavi-altına dönüyor (dönüşüm olarak kabul edildi)']),
 dict(kimlik='P34-08', talep='Kragmir ERKEK 5. yüz (yuva 4 aynaydı)', sorumlu='GPT', uretim='ÜRETİLDİ (512×512 alfa)', teslim='TESLİM EDİLDİ', entegrasyon='ENTEGRE (176×176, diğer yuvalar gibi koyu zemine oturtuldu)',
      yollar=['oyun-son/js/karakter-png-veri.js › yuz.ocak.m.4'], test=f'GEÇTİ (veri): 5 yuva çözülüyor, yeni yüz özgün ({KV}/p34_test/*/08_veri_kontakt.webp). Karakter oluşturma ekranında seçimi v42’de çekilmedi.',
      kabul='Bağımsız kabul YOK.', acik=['Kragmir kadın yuva 4 ayna değil (ölçüldü) → istenmedi']),
 dict(kimlik='P34-09', talep='Bran ve Nessa portreleri (G4 biçimi)', sorumlu='GPT', uretim='ÜRETİLDİ (2 × 528×704 + 2 × 192×192)', teslim='TESLİM EDİLDİ', entegrasyon='ENTEGRE',
      yollar=['oyun-son/js/gorsel-png.js › bran, bran-yuz, nessa, nessa-yuz', 'oyun-son/js/ui-ogretici.js (Bran diyalogları kim=bran; kurtarma kartı rescueArt)', 'oyun-son/css/p33-kabul.css (.resc-por)'],
      test=f'GEÇTİ: Bran diyalog portresi, kurtarma kartında iki portre ({KV}/p34_test/*/05_bran_diyalog, 06_kurtarma_karti). Öğretici akışının içinde (gerçek adım) v42’de çekilmedi; test doğrudan çağrıyla.',
      kabul='Bağımsız kabul YOK.', acik=['Nessa’nın göz/ağız kareleri yok (P34-05 kapsamı dışında kaldı)']),
 dict(kimlik='P34-10', talep='Mini Dizi 10 video', sorumlu='—', uretim='KAPSAM DIŞI (kullanıcı kararı 26.11)', teslim='—', entegrasyon='—', yollar=['oyun-son/shared/minidizi.js', 'oyun-son/video/README.txt (korunuyor)'],
      test='—', kabul='Başarısızlık sayılmaz.', acik=[]),
 dict(kimlik='P34-11', talep='Özgün müzik, ortam sesleri, NPC seslendirmesi', sorumlu='Gemini',
      uretim='ÜRETİLMEDİ / TESLİM EDİLMEDİ (Gemini teslim manifesti "ses": [], pakette P34-11 klasörü yok). Gemini’nin ilk P34 yanıtında madde 6–11 "GPT görevleri / kapsam dışı" diye reddedilmişti.',
      teslim='TESLİM EDİLMEDİ', entegrasyon='YOK (oyunda yalnız mevcut 4 müzik + 131 sentez ses; NPC kanalı yok)', yollar=['oyun-son/js/sfx.js', 'oyun-son/js/audio.js', 'oyun-son/js/npc-soz.js'],
      test='Uygulanamaz', kabul='—', acik=['MUS-01 normal savaş müziği (zorunluydu)', '17 zorunlu ortam döngüsü', '45 zorunlu NPC selamlama seslendirmesi']),
]
tamam = sum(1 for p in P34 if p['entegrasyon'].startswith('ENTEGRE'))
json.dump(dict(surum=SURUM, aciklama='P34 talebi başına son durum. "Kabul" sütunu Opus’un entegrasyon testidir; bağımsız nihai kabul Fable’ındır. Kanıt yolları paket içi (kanit/...) ya da depo yoludur.',
               ozet=dict(talep=11, kapsam_disi=1, tam_entegre=tamam, kismen=sum(1 for p in P34 if p['entegrasyon'].startswith('KISMEN')), teslim_edilmedi=sum(1 for p in P34 if p['teslim'].startswith('TESLİM EDİLMEDİ'))),
               talepler=P34), open(os.path.join(OUT, 'P34_NIHAI_DURUM.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

# ------------------------------------------------------------------ Birleşik matris
M = []
def r(kimlik, eden, aciklama, sistem, onem, sorumlu, cozum, durum, kanit, tekrar, engel, kok=None):
    M.append(dict(kimlik=kimlik, tespit_eden=eden, aciklama=aciklama, etkilenen_sistem=sistem, onem=onem, sorumlu=sorumlu, cozum=cozum, durum=durum, kanit=kanit, tekrar_test=tekrar, yayina_engel=engel, kok_neden=kok))

# Gemini 1. tur 17 + 3 (kod tarafı durumları KAPSAM_MATRISI §15; v41'de çözüldü, v42'de dokunulmadı)
G1 = [('N4-01', 'Zafer Anıtı eski arka plan / ayrı tasarım dili', 'Bina katmanları', 'Yüksek', 'KAPANDI (v41) + P34-01 2048×868 + binaAcik gerilemesi v42’de düzeltildi', 'han-ahir-zafer-kabuk'),
      ('N4-02', 'Otağ › Harita önizlemesi küçük', 'Otağ', 'Orta', 'KAPANDI (v41)', None),
      ('N2-01', 'Premium "$" fiyat + AL', 'Mağaza', 'Yüksek', 'KAPANDI (v41; ₺ yanlış okunmuştu, yine de "Yakında")', 'gercek-para'),
      ('N1-01', 'Profilde test paneli', 'Profil', 'Orta', 'KULLANICI KARARI (görünür; ?dev=0 / store profili gizler)', 'test-paneli'),
      ('N3-01', 'T3 görünümü kimlik kuralına aykırı', 'Karakter', 'Yüksek', 'KAPANDI (T3 kapalı)', None),
      ('N6-01', 'Karakter + düğmeleri / çanta çakışması', 'Karakter', 'Orta', 'KISMEN: çakışma kapandı; + 22 px (v42: dokunma genişliği 44 px, yükseklik 21 px satırla sınırlı)', 'dokunma-hedefi'),
      ('N4-03', 'Örs sayaç taşması', 'Örs', 'Orta', 'KAPANDI (v41)', None), ('N4-04', 'Han/Ahır ayrı tasarım dili', 'Bina katmanları', 'Orta', 'KAPANDI (v41)', 'han-ahir-zafer-kabuk'),
      ('N5-01', 'Oto ipucu savaş boyu kalıyor', 'Savaş HUD', 'Orta', 'KAPANDI (v41)', None), ('N6-02', 'Görevler kesik', 'Görevler', 'Düşük', 'YANLIŞ POZİTİF', None),
      ('N6-03', 'VS Karakter düğmesi küçük', 'VS', 'Düşük', 'KAPANDI (v41)', None), ('N6-04', 'Meydan çakışma', 'Meydan', 'Düşük', 'YANLIŞ POZİTİF', None),
      ('N6-05', 'Nöbet alt kesik', 'Nöbet', 'Düşük', 'KAPANDI (v41)', None), ('N6-06', 'Ferman şeridi / sohbet', 'Sohbet', 'Düşük', 'KAPANDI (v41) / sohbet yanlış pozitif', None),
      ('N6-07', 'Karaborsa/Başarım kesik', 'Karaborsa', 'Düşük', 'KAPANDI (v41)', None), ('N4-05', 'Balık arka planı', 'Balık', 'Düşük', 'KAPANDI (v41)', None),
      ('N2-02', 'Elentha kapsül çizgisi / kontrast', 'HUD', 'Düşük', 'KAPANDI (v41)', None),
      ('N4-06', 'Klan Obası dış haritası test edilmedi', 'Klan', 'Orta', 'v41 TEST EDİLDİ; v42 katman doğrudan kurulumla test edildi', None),
      ('N5-02', 'Bölge/boss/zindan savaşları test edilmedi', 'Savaş', 'Yüksek', 'v41 TEST EDİLDİ; v42 savaş regresyonu DURDURULDU (yapılmadı)', 'v42-savas-regresyonu'),
      ('N6-08', '667×375 / 1180×820 + gerçek cihaz', 'Çözünürlük', 'Yüksek', 'KISMEN: v42’de 667 savaş HUD 11 px; gerçek cihaz TEST EDİLMEDİ', '667-okunurluk')]
for k, a, s, o, d, kok in G1:
    r(k, 'Gemini (1. görsel kabul)', a, s, o, 'Opus', d, 'KAPANDI' if d.startswith('KAPANDI') else 'YANLIŞ POZİTİF' if 'YANLIŞ' in d else 'KULLANICI KARARI' if 'KULLANICI' in d else 'KISMEN' if d.startswith('KISMEN') or 'DURDURULDU' in d else 'KAPANDI',
      f'{K}/KAPSAM_MATRISI.md §15; Gemini 2. rapor onceki_bulgu_durumlari (ek/gemini/)', 'Gemini 2. tur: kapandi/kismen/yanlış pozitif (uzman beyanı)', 'Hayır' if k not in ('N5-02', 'N6-08') else 'Belirsiz (Fable)', kok)
r('N-2-001', 'Gemini (2. görsel kabul)', '667×375’te savaş HUD ve yan menü 6–9,8 px; harita etiketleri kısmen üst üste', 'HUD / harita', 'Orta', 'Opus',
  'v42: savaş HUD yazıları daha özgül seçiciyle 11 px (etkin ölçüm en küçük 10,7 px dönüşüm ölçeğinden). Harita etiket üst üste binmesi DÜZELTİLMEDİ.', 'KISMEN',
  f'{KV}/olcum/etkin-*-667*.json, {KV}/olcum/etkin-savas-sancak-667.webp', 'Savaş HUD: Opus ölçümü geçti (iki halk). Etiketler: ölçülmedi.', 'Hayır (Fable)', '667-okunurluk')
r('N-2-002', 'Gemini (2. görsel kabul)', 'Karakter nitelik "+" düğmesi 22 px', 'Karakter', 'Düşük', 'Opus', 'Dokunma alanı genişliği 44 px; yükseklik satır aralığı (21 px) nedeniyle büyütülemedi — G2-07 ile aynı kök', 'KISMEN', 'oyun-son/css/p33-kabul.css (kx-plus::after)', 'Ölçülmedi (CSS)', 'Hayır', 'dokunma-hedefi')

G2 = [
 ('G2-01', 'Boss uyarısı 0,35 sn ek bekleme', 'Savaş sunumu', 'Yüksek', 'await wait(0.35) kaldırıldı; uyarı mevcut yetenek beklemesiyle birlikte görünür (combat.js)', 'KAPANDI (kod)', 'oyun-son/js/combat.js', 'Aynı tohumla süre karşılaştırması YAPILMADI (savaş regresyonu durduruldu)'),
 ('G2-02', 'orsSonuc gecikmeli geri çağırımda yanlış pencere', 'Örs geri bildirimi', 'Orta', 'İşlem başlarken pencere öğesi + data-scr yakalanır; değiştiyse çizilmez (p33-canli.js)', 'KAPANDI (kod)', 'oyun-son/js/p33-canli.js', 'Pencere değişim testi YAPILMADI'),
 ('G2-03', 'expAkit çift rAF eski genişliği yazabilir', 'HUD EXP çubuğu', 'Orta', 'Sayaç ile son güncelleme kazanır (p33-canli.js)', 'KAPANDI (kod)', 'oyun-son/js/p33-canli.js', 'Hızlı güncelleme testi YAPILMADI'),
 ('G2-04', 'Elentha oturumunda başkent ortam sesi amb.ocak.day', 'Ses', 'Yüksek', 'Oyun hatası DEĞİL: test betiği halkı sabit "ocak" veriyordu (gpt_test.js düzeltildi). Oyun S.faction kullanıyor (ui-ses.js).', 'YANLIŞ POZİTİF (test hatası)', f'{KV}/gpt_test/sancak/sonuc.json (hub: amb.sancak.day)', 'GEÇTİ (v42, iki halk)'),
 ('G2-05', 'Elentha açılış ipucu null', 'Yükleme', 'Orta', 'Test betiği 600 ms’de erken okuyordu; seçiciyi bekleyecek şekilde düzeltildi', 'YANLIŞ POZİTİF (test hatası)', f'{KV}/gpt_test/*/sonuc.json (acilis_ipucu dolu)', 'GEÇTİ (v42, iki halk)'),
 ('G2-06', 'Yerel kipte gerçek para fiyatı / mağaza yönlendirmesi', 'Ödeme', 'Orta', 'Yerel kipte sağlayıcı yok → satın alma zaten imkânsızdı; ACT.payBuy başına açık LOCAL koruması eklendi. Premium "Yakında" düğmesi Kervan’a gezinme olarak kaldı.', 'KAPANDI (kod)', 'oyun-son/js/ui-odeme.js', 'Satın alma denemesi testi YAPILMADI (kod incelemesi)'),
 ('G2-07', '22 px "+" ve küçük hedefler (44 px)', 'Erişilebilirlik', 'Orta', '"+" dokunma genişliği 44 px; diğer küçük hedefler ölçüm listesinde (cozumle.py) — tam 44 px tarama v42’de yapılmadı', 'KISMEN', 'oyun-son/css/p33-kabul.css', 'Ölçülmedi'),
 ('G2-08', '667×375 HUD 6–9,8 px, harita etiketleri çakışıyor', 'HUD', 'Yüksek', 'N-2-001 ile aynı kök: savaş HUD 11 px; etiket çakışması açık', 'KISMEN', f'{KV}/olcum/', 'Savaş HUD geçti; etiketler ölçülmedi'),
 ('G2-09', 'KAB-01…25 satırları yok', 'QA belgesi', 'Orta', 'KAPSAM_MATRISI.md’deki yanlış iddia düzeltildi; 25 ölçüt bu matriste KAB-01…25 olarak eşlendi', 'KAPANDI (belge)', 'bu dosya (KAB-*)', '—'),
 ('G2-10', 'Test paneli yayın profilinde kapalı ve URL ile açılamaz olmalı', 'Güvenlik/yayın', 'Yüksek', 'storeBuild() (DD_STORE / ?store=1) devUI’yi her durumda kapatır, ?dev=1 açamaz (kod); yorum düzeltildi. DD_STORE’u ayarlayan Play Store paketi henüz YOK.', 'KISMEN', 'oyun-son/js/api.js:19-24', 'v41 sistem testi: ?store=1’de panel gizli; v42 tekrar edilmedi'),
 ('G2-11', 'QA özeti 128 yerine 113', 'QA belgesi', 'Orta', 'Özet satırlardan otomatik sayıldı', 'KAPANDI (belge)', f'{K}/QA_MATRISI_DOLU.json › ozet', '—'),
 ('G2-12', 'SYS-DUP/SYS-RESET alt testleri (çoklu sekme, haftalık sıfırlama)', 'Veri bütünlüğü', 'Orta', 'Yeni testler: sekme_test.js (ikinci sekme girince ilk sekme kilitlenir, işlem yazmaz), hafta_test.js (pazartesi 00:00 UTC+3 hafta anahtarı yenilenir)', 'KAPANDI (test)', f'{KV}/sekme_test/sonuc.json, {KV}/hafta_test/sonuc.json', 'GEÇTİ (v42)'),
 ('G2-13', 'Özgün 32 maddelik görev listesi yok', 'Kapsam belgesi', 'Orta', 'Bulunamadı; kapsam özgün kaynaklardan (AAA planı vb.) YENİDEN KURULDU — özgün belge değildir', 'AÇIK (belge yok)', f'{K}/KAPSAM_MATRISI.md, KAPSAM_KAYNAK_AAA.txt', '—'),
]
for k, a, s, o, c, d, kn, t in G2:
    r(k, 'GPT (2. teknik kabul)', a, s, o, 'Opus', c, d, kn, t, 'Hayır' if k != 'G2-10' else 'Evet — Play Store paketi DD_STORE’u açmadan yayımlanırsa test paneli görünür', None)

# Opus P33 bulguları (BUL) — KAPSAM_MATRISI §14
for k, a, d in [('A1', 'Zafer Anıtı penceresi dokunuşları kapatıyor', 'YANLIŞ POZİTİF'), ('A2', 'Başkent hep Yashka diyaloğu', 'YANLIŞ POZİTİF'), ('A3', 'Kurt üstünde kırmızı çubuklar', 'YANLIŞ POZİTİF'),
                ('A4', 'Karakter seçmede VS kalıntısı', 'YANLIŞ POZİTİF'), ('A5', 'Karşılama yazısı diyaloğa biniyor', 'KAPANDI'), ('A6', 'Elentha hapında çizgi', 'KAPANDI'), ('A7', 'Oto ipucu kalıyor', 'KAPANDI'),
                ('A8', 'Nöbet altı kesik', 'KAPANDI'), ('A9', 'Profilde TEST ARAÇLARI', 'KULLANICI KARARI'), ('A10', 'Kragmir açılışında Elentha şehri', 'YANLIŞ POZİTİF'), ('B1', 'Han/Ahır/Zafer ayrı tasarım dili', 'KAPANDI'),
                ('B2', 'Premium $ + AL', 'KAPANDI'), ('B3', 'Kragmir ten kontrolü', 'KAPANDI'), ('B4', 'Aynı işe birden çok giriş (mağaza 5, unvan 3, görev 2, Meydan 4)', 'AÇIK (kullanıcı kararı bekliyor)'),
                ('C1', 'Sohbet Irk sekmesi sarı band', 'KAPANDI'), ('C2', 'Ansiklopedi altı kesik', 'YANLIŞ POZİTİF')]:
    r('BUL-' + k, 'Opus (P33 ekran incelemesi)', a, 'Arayüz', 'Orta' if d.startswith('AÇIK') else 'Düşük', 'Opus', d, d.split(' (')[0], f'{K}/KAPSAM_MATRISI.md §14', 'v41 kanıtı', 'Hayır', None)

# P34'te yeni bulunanlar
YENI = [
 ('P34-B01', 'Opus (P34 testi)', 'binaAcik() iç mekân sınıfı (icm-var) yüzünden yanlış: Han/Ahır işlem sonrası yeniden çizilmiyor, Zafer Anıtı "Yükleniyor…"da kalıyordu. Kaynak: dış sürüm v40 (P23–P32) ic-mekan.js; P33’te Zafer de iç mekâna geçince yayıldı.', 'Bina katmanları', 'Yüksek', 'Opus', 'binaAcik yalnız korant-modal-* sınıfını döndürür (ui-ahir.js)', 'KAPANDI', f'{KV}/bina_test/ocak/sonuc.json, zaferAniti.webp', 'GEÇTİ (Kragmir). Elentha’da tekrar edilmedi (aynı kod yolu).', 'Hayır (düzeltildi); düzeltilmeseydi Evet', 'han-ahir-zafer-kabuk'),
 ('P34-B02', 'Opus (teslim denetimi)', 'Gemini P34 teslim manifesti eksik: 61 görsel + rapor listede yok (yalnız P34-07’nin 18 dosyası). Dosyaların kendisi sağlam.', 'Teslim kaydı', 'Düşük', 'Gemini', 'Opus sha256’ları kendisi hesapladı (kanit/v42/teslim_butunluk.json)', 'AÇIK (uzman kaydı)', f'{KV}/teslim_butunluk.json', '—', 'Hayır', None),
 ('P34-B03', 'Opus (teslim denetimi)', 'P34-11 ses (müzik, ortam, NPC seslendirme) teslim edilmedi', 'Ses', 'Orta', 'Gemini', 'Yok', 'AÇIK', 'ek/gemini/p34_teslim_manifest.json (ses: [])', '—', 'Hayır (kullanıcı kararına bağlı)', None),
 ('P34-B04', 'Opus (görsel kontrol)', 'P34-06’da lamia, snake_queen, dragon_lightning pozları bekleme pozuyla aynı yaratık görünmüyor (renk/desen)', 'Savaş görselleri', 'Orta', 'Gemini', 'Entegre edilmedi; bu türler saldırı/vurulmada bekleme pozunu gösterir (önceki davranış)', 'AÇIK', f'{KV}/kontrol/yaratik_kontrol.jpg', '—', 'Hayır', None),
 ('P34-B05', 'Opus (görsel kontrol)', 'Tepegöz 1. evre "vurulma" pozunda beyaz leke (P34 öncesi G3 teslimi)', 'Savaş görselleri', 'Düşük', 'Gemini/GPT (G3)', 'Yok', 'AÇIK', f'{KV}/p34_test/ocak/08_veri_kontakt.webp', '—', 'Hayır', None),
 ('P34-B06', 'Opus', 'v42’de tam savaş regresyonu (12 savaş × 2 halk) ve 115 ekran çekim turu YAPILMADI (kullanıcı isteğiyle durduruldu). v42 değişikliklerinin savaşta (poz geçişi, boss evre-2, boss uyarısı süresi) gerçek akışta görünümü kanıtsız.', 'Regresyon', 'Yüksek', 'Opus/Fable', 'Yok', 'TEST EDİLMEDİ', '—', '—', 'Belirsiz — Fable karar verir', 'v42-savas-regresyonu'),
 ('P34-B07', 'Opus (rapor karşılaştırması)', 'Gemini 1. nihai KABUL-2 raporu 667×375’i "Kabul" sayıyor, 2. rapor aynı konuyu "kısmen/N-2-001" diyor; envanterde "Elentha 200 / Kragmir 200 benzersiz ekran" yazıyor, birleşik 115 ile çelişiyor', 'Uzman raporu', 'Düşük', 'Gemini', 'Matriste kanıta dayalı durum kullanıldı', 'AÇIK (rapor tutarsızlığı)', 'ek/gemini/', '—', 'Hayır', None),
 ('P34-B08', 'Opus', 'Gemini ilk P34 yanıtında P34-05 (NPC kareleri) "kullanıcı + Claude ortak kararıyla uygulanmadı" diye reddedildi — böyle bir karar yoktu; sonra P34 girdi paketiyle üretildi', 'Süreç', 'Düşük', 'Gemini', '—', 'KAPANDI', 'ek/gemini/nihai_kabul2/', '—', 'Hayır', None),
 ('P34-B09', 'Opus', 'GPT ikinci kabul raporu P34 görsellerini Gemini’ye yönlendirmeyi ve canavar park kararını korumayı öneriyordu; kullanıcı kararı farklı (görev bölüşümü kullanıcıdan, canavar işi yeniden açıldı)', 'Süreç', 'Düşük', '—', 'Kullanıcı kararı uygulandı', 'KAPANDI', 'ek/gpt/ikinci_kabul/', '—', 'Hayır', None),
 ('P34-B10', 'Opus', 'Telif/lisans: AI üretimi görsellerin kullanım koşulları, müzik dosyalarının lisans belgesi, EN dilinde başka bir MMO’dan alınmış görünen eşya adları', 'Hukuki', 'Yüksek', 'Kullanıcı', 'Yok', 'AÇIK', 'KULLANICI_KARARLARI_VE_STANDARTLAR.md §D', '—', 'Olası — mağaza yayını öncesi', None),
 ('P34-B11', 'Opus', 'Gerçek cihaz (Android), FPS/pil/ısı, 30/120 dk oturum, ağ kesilmesi, Play Store paketi test edilmedi; sunucu yok', 'Performans/yayın', 'Yüksek', 'Kullanıcı/Fable', 'Yok', 'TEST EDİLMEDİ', '—', '—', 'Evet — mağaza yayını için gerekli', None),
 ('P34-B13', 'Opus (sistem testi v42)', 'Bozuk kayıt (localStorage JSON bozuk) yüklenince oyun çökmüyor, sunucu seçimine dönüyor; ama bozuk kayıt KURTARILMIYOR ve yedek yok (oyuncu ilerlemesini kaybeder). GPT G2-12: SYS-SAVE kurtarma kanıtı değildir.', 'Veri bütünlüğü', 'Orta', 'Opus/kullanıcı (karar)', 'Yok (mekanik/kayıt biçimi değişikliği gerektirir; izinsiz yapılmadı)', 'AÇIK', 'kanit/v42/sistem_test/sonuc.json › bozuk_kayit', 'Çökme yok: GEÇTİ; kurtarma: YOK', 'Olası — Play Store için yedek/kurtarma önerilir', None),
 ('P34-B12', 'Opus', 'Kapsam belgesi: 32 maddelik özgün liste bulunamadı (G2-13 ile aynı)', 'Belge', 'Orta', 'Kullanıcı', '—', 'AÇIK', '—', '—', 'Hayır', None),
]
for x in YENI: r(*x)

# KAB-01…25 (AAA §14 nihai kabul ölçütleri) → durum ve kanıt
KAB = ['Mevcut ana haritaların orijinalliği', 'Bina mimarilerinin korunması', 'Elentha/Kragmir görsel kalite eşitliği', 'Çevre animasyonlarının doğallığı', 'Ses tasarımının profesyonelliği',
       'Bölgesel ses ve müzik uyumu', 'NPC animasyonlarının kalitesi', 'Savaş efektlerinin okunabilirliği', 'Karakter ve çevre bütünlüğü', 'Eşya kazanma deneyimi', 'Geliştirme animasyonlarının kalitesi',
       'Ödül sunumlarının kalitesi', 'HUD tutarlılığı', 'Mikro animasyonların akıcılığı', 'Harita ve iç mekân geçişleri', 'Yükleme ekranlarının doğruluğu', 'Mobil cihaz performansı', 'Bellek yönetimi',
       'FPS kararlılığı', 'Pil tüketimi', 'Cihaz ısınması', 'Bağlantı kararlılığı', 'Veri bütünlüğü', 'Mevcut oyun mekaniklerinin korunması', 'Mevcut 157 ekran durumu ve yeni iç mekânların regresyon testi']
KD = {1: ('KANITLI (otomatik)', 'Onaylı sahne dosyaları değişmedi; katmanlar ayrı tuval (sha karşılaştırması: kanit/v42/koruma.json)'),
      2: ('KANITLI (otomatik)', 'aynı'), 3: ('KISMEN', 'v41 iki halk turları; v42 P34 testleri iki halkta. Bağımsız görsel değerlendirme Fable'),
      4: ('KISMEN', 'P34 katmanları çalışıyor ve kapatılabiliyor; "doğallık" insan/uzman değerlendirmesi ister'), 5: ('TEST EDİLMEDİ', 'Yeni ses teslim edilmedi (P34-11); konteynerde dinleme yok'),
      6: ('KISMEN', 'Sahne → ses anahtarı eşlemesi kodda ve gpt_test’te doğrulandı; dinlenmedi'), 7: ('KISMEN', 'Göz/ağız kareleri çalışıyor (p34_test); kalite değerlendirmesi Fable'),
      8: ('TEST EDİLMEDİ (v42)', 'v41 savaş testi var; v42 savaş regresyonu durduruldu'), 9: ('KISMEN', 'yeşil ten, kılıç+kalkan kuralı korunuyor; 3 P34-06 türü kimlik sapması nedeniyle alınmadı'),
      10: ('v41 KANITLI', 'P33 ganimet parlaması testi'), 11: ('v41 KANITLI', 'P33 örs testi'), 12: ('v41 KANITLI', 'P33 şerit testi'), 13: ('KISMEN', '880 temiz (v41), 667 savaş HUD v42’de 11 px; etiket çakışması açık'),
      14: ('v41 KANITLI', 'P33'), 15: ('KISMEN', 'v42 bina_test: Han/Ahır/Zafer açılıyor; geçiş akıcılığı insan değerlendirmesi'), 16: ('KANITLI (v42)', 'gpt_test: açılış ipucu, Kül Geçidi perdesi iki halkta'),
      17: ('TEST EDİLMEDİ', 'gerçek cihaz yok'), 18: ('KISMEN', 'masaüstü Chromium bellek ölçümü (sistem_test); cihaz değil'), 19: ('TEST EDİLMEDİ', 'gerçek cihaz yok'), 20: ('TEST EDİLMEDİ', 'gerçek cihaz yok'),
      21: ('TEST EDİLMEDİ', 'gerçek cihaz yok'), 22: ('TEST EDİLMEDİ / KAPSAM DIŞI', 'sunucu yok (yerel kayıt)'), 23: ('KANITLI (v42)', 'sistem_test (kayıt, bozuk kayıt, çift tık), sekme_test, hafta_test'),
      24: ('KANITLI (otomatik)', 'shared/ dosyaları v41 ile aynı (kanit/v42/koruma.json)'), 25: ('KISMEN', '"157 ekran" sayısı hiçbir kayıtta yok; v41’de 115 benzersiz ekran/226 çekim; v42’de tam çekim turu YAPILMADI')}
for i, a in enumerate(KAB, 1):
    d, k = KD[i]
    r(f'KAB-{i:02d}', 'Kullanıcı AAA planı §14 (ölçüt)', a, 'Nihai kabul ölçütü', 'Yüksek' if i in (17, 18, 19, 20, 21, 23, 24, 25) else 'Orta', 'Fable (karar)', 'Opus yalnız kanıt eşledi; karar Fable’ın', d, k, '—', 'Fable karar verir', None)

say = collections.Counter(x['durum'].split(' (')[0].split(' /')[0] for x in M)
acik = [x for x in M if x['durum'].startswith(('AÇIK', 'KISMEN', 'TEST EDİLMEDİ')) and not x['kimlik'].startswith('KAB-')]
onem = collections.Counter(x['onem'] for x in acik)
json.dump(dict(surum=SURUM, aciklama='GPT, Gemini ve Opus bulguları tek matriste; önceki kimlikler korunmuştur. "durum" kanıta dayalı Opus kaydıdır; uzmanların kendi kabul beyanları "tekrar_test" alanında ayrıca belirtilir ve Fable’ın bağımsız kabulü değildir. KAB-* satırları karar değil, kanıt eşlemesidir.',
               ozet=dict(kayit=len(M), durum_dagilimi=dict(say), acik_kismen_testedilmedi_KAB_haric=len(acik), onem_dagilimi_acik=dict(onem),
                         yayina_engel_olasi=[x['kimlik'] for x in M if str(x['yayina_engel']).startswith(('Evet', 'Olası', 'Belirsiz'))]),
               kayitlar=M), open(os.path.join(OUT, 'BIRLESIK_HATA_VE_GOREV_MATRISI.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('P34', tamam, 'tam entegre; matris', len(M), 'kayıt', dict(say), 'açık', len(acik), dict(onem))
