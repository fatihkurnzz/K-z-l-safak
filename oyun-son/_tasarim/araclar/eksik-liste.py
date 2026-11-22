# "Nereler kaldı?" tablosu: GPT Paket 5'in 59 işlev kaydını (EKRAN_KONTROL_LISTESI.csv) oyundaki giriş noktalarına bağlar ve
# ui-denetim.js sonuçlarından (iki halk) her satırın durumunu yazar.
# Kullanım: python3 -I eksik-liste.py <csv> <denetim_sancak_klasörü> <denetim_ocak_klasörü> <çıktı.md>
import sys, csv, json, os

CSV, DS, DO, OUT = sys.argv[1:5]
# kayıt → (oyundaki giriş noktaları (ui-denetim ekran adları), nasıl açılır, oyunda kullanılan GPT grafiği, not)
M = {
    '1': (['_akis'], 'Oyunu aç', 'Açılış görseli (eski), P1 düğmeleri', ''),
    '2': (['_akis'], 'Açılışta ilk kez', 'Eski fragman sahneleri', 'P5 fragman maketi uygulanmadı'),
    '3': (['_akis'], 'Açılış → Oyuna gir', 'P1 düğme/panel', ''),
    '12': (['mnMain'], 'Sol ray → Menü', 'P1 + 4.9 simgeleri', ''),
    '13': (['_harita'], 'Işınlanma Kapısı → Yemin Pazarı', 'Haritalar: çarşı sahnesi (22 Kas)', 'dört tezgâh + Pazar/Karaborsa/Yashka/Balık'),
    '14': (['_harita'], 'Işınlanma Kapısı → Klan toprağı', 'Haritalar: Klan Otağı sahnesi (22 Kas)', 'klan üyeliği gerekir'),
    '15': (['gateMenu'], 'Haritada Kapı (sur)', 'P1', 'yer değiştirme artık ışınlanma kapısında'),
    '16': (['gate', 'gateZones'], 'Kapı → Sefer', 'P1', ''),
    '17': (['diyarMap'], 'Sol ray → Diyar Haritası', 'Eski harita çizimi', 'P5 pusula amblemi başlıkta'),
    '18': (['_sonuc'], 'Savaş sonu', 'P1', 'otomatik doğrulanamadı'),
    '19': (['anvil'], 'Haritada Örs', 'P1 + P5 örs amblemi', ''),
    '20': (['skill'], 'Karakter → Yetenek', 'P1, mevcut 204 yetenek simgesi', ''),
    '21': (['quests'], 'Alt şerit → Görevler', 'P1 + P5 defter amblemi', ''),
    '22': (['questLog', 'monthlyBonus', 'weeklyBonus'], 'Görevler sekmeleri', 'P1 + P5 defter', ''),
    '23': (['destan'], 'Kapı → Destan', 'P1 + P5 defter', ''),
    '24': (['destan'], 'Destan → Mini dizi', 'Eski çizgi roman kareleri', 'P5 maketi uygulanmadı'),
    '25': (['_diyalog'], 'Haritada Kral / NPC', 'Eski SVG yüz', 'P3 portre kral için yok'),
    '26': (['_akis'], 'Yeni oyuncu', 'P1', ''),
    '27': (['clan', 'clanhq'], 'Alt şerit → Klan', 'P1 + flama amblemi', 'klan içi sekmeler üyelikle'),
    '28': (['clan'], 'Klan toprağı → Hisar', 'P1 + flama', ''),
    '29': (['meydan'], 'Kapı → CZ-PK → Meydan', 'P1 + flama', 'canlı PvP test edilemedi'),
    '30': (['hall', 'rank'], 'Meydan → Şan Divanı / Sıralama', 'P1 + P3 portreler', ''),
    '31': (['czArena', 'czHall', 'czMarket'], 'Kapı → CZ-PK', 'P1', ''),
    '32': (['otag'], 'Haritada Kral Otağı', 'P1 + flama', ''),
    '33': (['monument'], 'Haritada Taş Yemini', 'P1 + flama', ''),
    '34': (['baskin'], 'Kapı → Sefer → Zindanlar', 'P1 + P5 fener', ''),
    '35': (['baskin'], 'Kapı → Sefer → Etkinlikler', 'P1', ''),
    '36': (['nobet'], 'Çarşı → Şaman Yashka', 'P1', ''),
    '37': (['wheel'], 'Haritada Kader Çarkı', 'P5 Kor/Ayaz/Şimşek parçaları', ''),
    '38': (['mine'], 'Haritada Maden', 'P1 + P5 fener', ''),
    '39': (['sandikOpen'], '—', '—', 'Ödül Sandığı 19 Kas\'ta oyundan kaldırıldı (kullanıcı isteği)'),
    '40': (['balik'], 'Çarşı → Balık Tut', 'P1 + P5 makara', ''),
    '41': (['premium', 'premiumMenu'], 'Premium', 'P1', ''),
    '42': (['starterOpen'], 'Sağ ray → İlk alım', 'P1 + P2 simgeler', 'ödeme test edilemedi'),
    '43': (['market'], 'Çarşı → Pazar / Takı', 'P1 + P2 simgeler', ''),
    '44': (['tuccar'], 'Çarşı → Silah/Zırh/Sarf', 'P1 + P2 simgeler', ''),
    '45': (['karaborsa'], 'Haritada Karaborsa', 'P1 + P2', ''),
    '46': (['exchange'], 'İz Takası', 'P1', ''),
    '47': (['chatOpen', 'chatMenu'], 'Sohbet kutusu', 'P1 + P5 mektup', ''),
    '48': (['friends', 'friendsMenu'], 'Menü → Arkadaşlar', 'P1', ''),
    '49': (['party'], 'Alt şerit → Karakter → Kadro', 'P1 + P3 kadro portreleri', ''),
    '50': (['mail'], 'Sağ üst → Posta', 'P1 + P5 mektup', ''),
    '51': (['news', 'notifs', 'calendar'], 'Sağ üst → Duyuru / Bildirim / Takvim', 'P1 + P5 mektup/defter', ''),
    '52': (['codex', 'rehber'], 'Menü → Ansiklopedi / Rehber', 'P1 + P5 defter', ''),
    '53': (['achs', 'titles'], 'Sağ üst → Başarımlar', 'P1 + P5 defter', ''),
    '54': (['profile'], 'Oyuncu kartı', 'P1 + P3 portre + 4.8 arma', ''),
    '55': (['settings'], 'Menü → Ayarlar', 'P1 + 4.9 sekme simgeleri', ''),
    '56': (['supportMenu'], 'Menü → Destek', 'P1 + P5 mektup', ''),
    '57': (['promoMenu'], 'Menü → Promosyon kodu', 'P1', ''),
    '58': (['_kilit'], 'Düşük seviyede kilitli bina', 'P1 rozet-kilit', 'ilk denetim turunda (Sv. düşük) görüldü'),
    '59': (['logoutMenu'], 'Menü → Çıkış (onay)', 'P1', ''),
    '67': (['hub'], 'Ana ekran sağ üst', 'P1', ''),
}
YANLIS = ('span «Savaş»',)  # denetimin yanlış alarmı: büyük Savaş düğmesinin gizli yazısı

def oku(d):
    try: return {r['ekran']: r for r in json.load(open(os.path.join(d, 'sonuc.json')))['sonuc']}
    except Exception: return {}

R = {'sancak': oku(DS), 'ocak': oku(DO)}

def durum(ekranlar, halk):
    D = R[halk]; acik, sorun = 0, []
    for e in ekranlar:
        if e.startswith('_'): return 'ayrı test', []
        for k, r in D.items():
            if k == e or k.startswith(e + '~'):
                if r.get('tur') != 'yok' or k == 'hub': acik += 1
                for t in ('kesik', 'tasma'):
                    for x in r.get(t) or []:
                        if not any(y in x for y in YANLIS) and 'kb-off' not in x: sorun.append(f'{t}: {x[:60]}')
    if not acik: return 'test edilemedi', []
    return ('kısmi' if sorun else 'doğrulandı'), sorun

rows = list(csv.reader(open(CSV, encoding='utf-8-sig'), delimiter=';'))[1:]
out = ['# Eksik listesi — GPT Paket 5 işlev kayıtları ↔ çalışan oyun (22 Kas)', '',
       'Ölçü 722×411 (dik telefonda döndürülmüş oyun). "Görsel" sütunu: o ekranda bugün kullanılan GPT grafiği. P5 ekran maketlerinin',
       '**yerleşimi** hiçbir ekrana birebir uygulanmadı; ekranlar oyunun kendi düzeninde, P1 UI kitiyle çiziliyor. Bu yüzden "doğrulandı" =',
       'ekran açılıyor, iki halkta kesik/taşma yok, P1–P5 grafikleri yerinde; maket düzeni ayrı açık iş (bkz. sondaki sıra).', '',
       '| # | Ekran / durum | Nasıl açılır | Oyunda kullanılan grafik | Elentha | Kragmir | Not / görülen sorun |', '|---|---|---|---|---|---|---|']
say = {}
for r in rows:
    if len(r) < 3 or not r[0].strip().isdigit(): continue
    k = r[0].strip(); e = M.get(k, ([], '?', '?', 'eşlenmedi'))
    ds, ss = durum(e[0], 'sancak'); do, so = durum(e[0], 'ocak')
    if k == '39': ds = do = 'kaldırıldı'
    for d in (ds, do): say[d] = say.get(d, 0) + 1
    notlar = '; '.join(filter(None, [e[3]] + sorted(set(ss + so))[:3]))
    out.append(f'| {k} | {r[2][:60]} | {e[1]} | {e[2]} | {ds} | {do} | {notlar} |')
out += ['', 'Özet (iki halk birlikte, satır×halk): ' + ', '.join(f'{k} {v}' for k, v in sorted(say.items())), '']
open(OUT, 'w').write('\n'.join(out))
print(say)
