# KORANT_GPT ve KORANT_GEMINI paketlerini kurar, manifest üretir, 30 MB altı bağımsız ZIP'lere böler.
# python3 -I paketle.py <oyun-son> <scratchpad> <çıktı klasörü>
import os, sys, json, hashlib, shutil, zipfile, re, datetime, math
G, S, OUT = sys.argv[1:4]
C = os.path.join(S, 'cikti'); A = os.path.join(S, 'arac')
SURUM = 'KORANT-v40-1dda167'
OYUN = {'ad': 'Korant Online (Demir Diyarı)', 'yayin_surumu': 40, 'git_commit': '1dda167', 'git_dal': 'claude/add-skill-repos-rne7at',
        'yayin_dosya_sayisi': 443, 'mantiksal_ekran': '880×406 (yalnız yatay)', 'hedef_telefon': '2340×1080, dpr 2.66'}
TARIH = '2026-11-26'
SINIR = 29_000_000
sha = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()
J = lambda p: json.load(open(p, encoding='utf-8'))
KAT = {k['kimlik']: k for k in J(os.path.join(C, 'katalog.json'))}
EKR = J(os.path.join(C, 'ekranlar', '_ekran_kaydi.json'))
VARL = {}
for h, hk in [('elentha', 'sancak'), ('kragmir', 'ocak')]:
    p = os.path.join(S, 'ekran-var', hk, '_varlik.json')
    if os.path.exists(p): VARL[h] = J(p)
# varlık → ekranlar (sha ya da yol)
KUL = {}
for h, v in VARL.items():
    for scr, lst in v.items():
        s2 = scr[2:] if scr.startswith('C-') else scr
        for x in lst: KUL.setdefault(x, set()).add(f'{h}:{s2}')
def kullanim(k):
    u = set(KUL.get('sha:' + k['sha256'], set()))
    if k['tur'] == 'dosya': u |= KUL.get('yol:' + k['yol'], set())
    return sorted(u)

class Paket:
    def __init__(s, ad):
        s.ad = ad; s.kok = os.path.join(OUT, ad); shutil.rmtree(s.kok, ignore_errors=True); os.makedirs(s.kok); s.dos = []; s.shas = {}
    def ekle(s, src, hedef, **meta):
        h = sha(src)
        if h in s.shas and not meta.get('tekrar_serbest'):
            s.shas[h].setdefault('ayni_icerikli_kimlikler', []).append(meta.get('varlik_kimligi') or hedef); return s.shas[h]['yol']
        meta.pop('tekrar_serbest', None)
        p = os.path.join(s.kok, hedef); os.makedirs(os.path.dirname(p), exist_ok=True); shutil.copyfile(src, p)
        e = {'yol': hedef, 'bayt': os.path.getsize(p), 'sha256': h, **meta}; s.dos.append(e); s.shas[h] = e; return hedef
    def yaz(s, hedef, metin, **meta):
        p = os.path.join(s.kok, hedef); os.makedirs(os.path.dirname(p), exist_ok=True)
        open(p, 'w', encoding='utf-8').write(metin if isinstance(metin, str) else json.dumps(metin, ensure_ascii=False, indent=1))
        e = {'yol': hedef, 'bayt': os.path.getsize(p), 'sha256': sha(p), **meta}; s.dos.append(e); return hedef

def gomulu(P, kimlik, hedef_klasor, kategori, onayli=True):
    k = KAT[kimlik]
    return P.ekle(os.path.join(C, 'gomulu', k['cikarilan_dosya']), f"{hedef_klasor}/{k['cikarilan_dosya']}", tur='görsel', kategori=kategori,
                  varlik_kimligi=kimlik, kaynak=f"{k['kaynak_js']} anahtar '{k['anahtar']}' (base64 {k['bicim']}, bayt bayt aynı çıkarıldı)",
                  olcu_px=k['olcu'], kullanim_ekranlari=kullanim(k), modulu_yukleyen=k['modulu_yukleyen'], onayli_oyundaki_hali=onayli, degistirildi=False)
def dosya(P, yol, hedef_klasor, kategori, onayli=True):
    k = KAT[yol]
    return P.ekle(os.path.join(G, yol), f"{hedef_klasor}/{yol}", tur='görsel' if k['olcu'] else 'dosya', kategori=kategori, varlik_kimligi=yol, kaynak=yol,
                  olcu_px=k['olcu'], kullanim_ekranlari=kullanim(k), kodda_gecen=k.get('kodda_dogrudan_gecen') or k.get('kodda_dolayli'), onayli_oyundaki_hali=onayli, degistirildi=False)
def mod(m): return sorted(k for k, v in KAT.items() if v['tur'] == 'gomulu' and v['kaynak_js'] == f'js/{m}.js')

def kolaj_ekran(P, ekranlar_tam):
    for f in sorted(os.listdir(os.path.join(C, 'ekranlar'))):
        if f.startswith('KOLAJ_'):
            P.ekle(os.path.join(C, 'ekranlar', f), f'01_KOLAJLAR/{f}', tur='kolaj', kategori='Ekran kolajı (9 Elentha + 9 Kragmir)',
                   icerik=[e['ekran_kimligi'] for h in EKR.values() for e in h['ekranlar'] if e.get('kolaj', '').endswith(f)], degistirildi='çekimden üretildi')
    if ekranlar_tam:
        for h, v in EKR.items():
            for e in v['ekranlar']:
                P.ekle(os.path.join(C, 'ekranlar', h, e['ekran_kimligi'] + '.webp'), e['dosya'], tur='ekran görüntüsü', kategori='Ekran (tam çözünürlük 2340×1080)',
                       varlik_kimligi=f"{h}:{e['ekran_kimligi']}", degistirildi='PNG çekim → WebP q92, çözünürlük aynı')

def kopya(P, kaynak, hedef, kategori):
    return P.ekle(kaynak, hedef, tur='belge', kategori=kategori, kaynak=os.path.relpath(kaynak, G) if kaynak.startswith(G) else os.path.basename(kaynak))

# ---------------------------------------------------------------- ortak belgeler
EKRAN_TABLO = J(os.path.join(C, 'ekranlar', '_ekran_kaydi.json'))
def ekran_md():
    s = f'# Ekran listesi ({SURUM})\n\nKaynak: oyunun kendisi, 880×406 mantıksal ölçüde dpr 2,66 ile (2340×1080) iki halkta otomatik dolaşılarak çekildi. Her ekranın kimliği, açan eylem (`ACT.<ad>`), pencere başlığı, sekmeleri ve işlevi aşağıdadır. Aynı görünen (aynı pencereyi açan) girişler “Aynı görüntü” sütununda birleştirildi.\n'
    for h, v in EKRAN_TABLO.items():
        s += f"\n## {h.capitalize()} — {v['ayri_ekran']} ayrı ekran ({v['cekilen_goruntu']} çekimden)\n\n| Kimlik | Ad | Pencere başlığı | Açılış | İşlev | Aynı görüntü |\n|---|---|---|---|---|---|\n"
        for e in v['ekranlar']:
            s += f"| `{e['ekran_kimligi']}` | {e['ad']} | {e['pencere_basligi'] or '—'} | `{e['acilis_eylemi']}` | {e['islev']} | {', '.join(e['ayni_goruntu']) or '—'} |\n"
        if v['acilmayan_veya_sorunlu']:
            s += '\nAçılmayan / sorunlu: ' + '; '.join(f"`{x['ekran']}` ({x['durum']})" for x in v['acilmayan_veya_sorunlu']) + '\n'
    return s

MEKAN = [('han', 'Han', 'ACT.han', 'Hancı ve içecekler (saldırı/savunma/EXP bonusu, enerji çorbası)'), ('ahir', 'Ahır', 'ACT.ahir', 'Yoldaş hayvanlar: aç, kuşan, besle'),
         ('taht-salonu', 'Taht Salonu (Otağ)', 'ACT.otag', 'Diyar haritası, hazine, bağış; kralın salonu'), ('karaborsa', 'Karaborsa', 'ACT.karaborsa', 'Gizli tüccar, nadir mallar'),
         ('maden', 'Maden', 'ACT.mine', 'Saatlik cevher, yükseltme, takas (panel altta)'), ('klan-karargahi', 'Klan Karargâhı', 'ACT.clanhq', 'Klan yönetimi; boş sancaklara klan arması bindirilir')]
def ic_mekan():
    L = []
    for h, hk in [('kragmir', 'ocak'), ('elentha', 'sancak')]:
        for kid, ad, act, isl in MEKAN:
            y = f'interiors/{h}/{kid}/bg.webp'; k = KAT[y]
            L.append({'kimlik': f'{h}/{kid}', 'ad': ad, 'halk': h, 'acan_eylem': act, 'islev': isl, 'gorsel': y, 'olcu_px': k['olcu'], 'sha256': k['sha256'], 'kod': 'js/ic-mekan.js MEKAN, css/p30-icmekan.css', 'kullanim_ekranlari': kullanim(k)})
    y = 'interiors/yemin-pazari/ors/bg.webp'; k = KAT[y]
    L.append({'kimlik': 'yemin-pazari/ors', 'ad': 'Büyük Örs', 'halk': 'ortak', 'acan_eylem': 'ACT.anvil', 'islev': 'Eşya yükseltme ve parçalama (Örs, Parçala ya da Sat)', 'gorsel': y, 'olcu_px': k['olcu'], 'sha256': k['sha256'], 'kod': 'js/ic-mekan.js MEKAN.ors', 'kullanim_ekranlari': kullanim(k)})
    return L
IC = ic_mekan()
def ic_md():
    s = f'# 13 iç mekân ({SURUM})\n\nKatman `js/ic-mekan.js`: pencere açılınca arkasına mekânın boyalı resmi iner, panel sağda (Maden\'de altta) durur; NPC dokunma noktası ve efekt noktaları `MEKAN` tablosunda. Görseller düz dosya `interiors/<halk>/<mekân>/bg.webp` (onaylı, değiştirilmez).\n\n| Kimlik | Ad | Halk | Açan eylem | İşlev | Görsel | Ölçü |\n|---|---|---|---|---|---|---|\n'
    for m in IC: s += f"| `{m['kimlik']}` | {m['ad']} | {m['halk']} | `{m['acan_eylem']}` | {m['islev']} | `{m['gorsel']}` | {m['olcu_px'][0]}×{m['olcu_px'][1]} |\n"
    return s

SAHNE_ACIK = {'banner_dunya_baskini': 'Dünya Baskını afişi (ui-baskin)', 'banner_karaborsa': 'Karaborsa afişi', 'banner_karakaya_hisari': 'Karakaya/Yelkaya Hisarı afişi (ui-hisar)',
    'banner_kervan': 'Kervan (dükkân) afişi (ui-odeme)', 'banner_kristal_nobeti': 'Kristal Nöbeti afişi', 'banner_oba_avi_tepegoz': 'Oba Avı: Tepegöz afişi (klan)',
    'baskent_elentha': 'Elentha başkenti ana ekran', 'baskent_kragmir': 'Kragmir başkenti ana ekran', 'diyar_haritasi': 'Diyar Haritası ve Kapı bölge haritası',
    'karakter_secim_elentha': 'Karakter oluştur/seç zemini (Elentha) ve Karakter penceresi kaidesi', 'karakter_secim_kragmir': 'Karakter oluştur/seç zemini (Kragmir)',
    'klan_obasi_elentha': 'Klan Obası ana ekranı (Elentha)', 'klan_obasi_kragmir': 'Klan Obası ana ekranı (Kragmir)', 'sahne_balik_tutma': 'Balık Tut', 'savas_boss_magarasi': 'Savaş zemini: boss mağarası',
    'savas_kizil_bahar': 'Savaş zemini: Kızıl Bahar Meydanı', 'savas_kul_gecidi': 'Savaş zemini: Kül Geçidi', 'savas_oba_avi_arena': 'Savaş zemini: Oba Avı', 'savas_pvp_arena': 'Savaş zemini: Meydan (PvP)',
    'savas_sisli_cukur': 'Savaş zemini: Sisli Çukur', 'savas_sonuc_arkaplan': 'Savaş sonucu penceresi zemini', 'savas_vahran_ovasi': 'Savaş zemini: Vahran Ovası', 'yemin_pazari': 'Yemin Pazarı ana ekranı',
    'zafer_aniti': 'Zafer Anıtı penceresi zemini', 'zindan_dipsiz_kuyu': 'Zindan önizleme: Dipsiz Kuyu', 'zindan_gok_yarigi': 'Zindan önizleme: Gök Yarığı', 'zindan_kul_kulesi': 'Zindan önizleme: Kül Kulesi',
    'zindan_muhurlu_oda': 'Zindan önizleme: Mühürlü Oda', 'zindan_yeralti_ocagi': 'Zindan önizleme: Yeraltı Ocağı'}
def sahne42():
    L = []
    for f in sorted(os.listdir(os.path.join(G, 'sahneler'))):
        y = 'sahneler/' + f; k = KAT[y]
        L.append({'varlik_kimligi': f[:-5], 'yol': y, 'bicim': 'webp', 'olcu_px': k['olcu'], 'bayt': k['bayt'], 'sha256': k['sha256'], 'kullanim': SAHNE_ACIK.get(f[:-5], ''), 'kodda': k.get('kodda_dogrudan_gecen') or k.get('kodda_dolayli'), 'kullanim_ekranlari': kullanim(k), 'onayli': True})
    for m in IC:
        L.append({'varlik_kimligi': 'interiors/' + m['kimlik'], 'yol': m['gorsel'], 'bicim': 'webp', 'olcu_px': m['olcu_px'], 'bayt': KAT[m['gorsel']]['bayt'], 'sha256': m['sha256'], 'kullanim': f"İç mekân: {m['ad']} ({m['halk']})", 'kodda': ['js/ic-mekan.js'], 'kullanim_ekranlari': m['kullanim_ekranlari'], 'onayli': True})
    return L
S42 = sahne42()

def ses():
    t = open(os.path.join(G, 'js/sfx.js'), encoding='utf-8').read()
    sent = re.findall(r"^\s*'([a-z]+\.[a-zA-Z0-9._]+)'\s*:\s*\{\s*b:\s*'(\w+)'", t, re.M)
    mp3 = [{'kimlik': 'audio/kizil-goz.mp3', 'sabit': 'MUSIC_URL', 'kullanim': 'Tema müziği: başkent, pazar, fragman', 'sure_sn': 157.6},
           {'kimlik': 'audio/intro.mp3', 'sabit': 'INTRO_URL', 'kullanim': 'Yükleme ekranı müziği', 'sure_sn': 154.6},
           {'kimlik': 'audio/arka-plan.mp3', 'sabit': 'HUB_URL', 'kullanim': 'Ana ekran arka plan müziği', 'sure_sn': 174.9},
           {'kimlik': 'audio/boss.mp3', 'sabit': 'BOSS_URL', 'kullanim': 'Patron savaşı müziği', 'sure_sn': 105.7}]
    for m in mp3: m.update({'bayt': KAT[m['kimlik']]['bayt'], 'sha256': KAT[m['kimlik']]['sha256'], 'bicim': 'mp3'})
    return {'muzik_dosyalari': mp3, 'sentez_sesleri': [{'kimlik': a, 'kanal': b, 'kaynak': 'js/sfx.js (WebAudio ile anlık üretilir; dosyası YOK)'} for a, b in sent]}
SES = ses()
def ses_md():
    s = f"# Ses varlıkları ({SURUM})\n\nDosya olarak yalnız 4 müzik var (`audio/`). Bütün efekt ve arayüz sesleri `js/sfx.js` içinde WebAudio ile sentezlenir ({len(SES['sentez_sesleri'])} anahtar); ses dosyası yoktur. Savaş/boss ezgilerinin bir kısmı da sentezdir.\n\n## Müzik\n| Dosya | Sabit | Kullanım | Süre (sn) | Bayt |\n|---|---|---|---|---|\n"
    for m in SES['muzik_dosyalari']: s += f"| `{m['kimlik']}` | `{m['sabit']}` | {m['kullanim']} | {m['sure_sn']} | {m['bayt']} |\n"
    s += '\n## Sentez ses anahtarları (kanal)\n' + ', '.join(f"`{x['kimlik']}` ({x['kanal']})" for x in SES['sentez_sesleri']) + '\n'
    return s

def token_md():
    T = J(os.path.join(C, 'tokenler.json')); s = f'# Tasarım değişkenleri ({SURUM})\n\nCSS özel özellikleri; `index.html` yükleme sırasıyla. Sonraki dosya öncekini ezer. Tam liste `tokenler.json` ({len(T)} tanım). Görsel taşıyan değişkenler `[gömülü görsel]` diye kısaltıldı.\n\n'
    cur = None
    for t in T:
        if not re.match(r'^(:root|html)', t['secici']) or t['deger'] == '[gömülü görsel]': continue
        if t['dosya'] != cur: cur = t['dosya']; s += f"\n## {cur}\n| Seçici | Değişken | Değer |\n|---|---|---|\n"
        s += f"| `{t['secici'][:60]}` | `{t['degisken']}` | `{t['deger'][:80]}` |\n"
    return s

# JSON şeması çıkarımı (gerçek veriden)
def sema(ornekler, ad):
    def tip(v):
        return {bool: 'boolean', int: 'number', float: 'number', str: 'string', list: 'array', dict: 'object', type(None): 'null'}[type(v)]
    def cikar(vs, derin=0):
        ts = sorted(set(tip(v) for v in vs)); sc = {'type': ts[0] if len(ts) == 1 else ts}
        ds = [v for v in vs if isinstance(v, dict)]
        if ds and derin < 4:
            keys = sorted(set(k for d in ds for k in d))
            if len(keys) <= 60:
                sc['properties'] = {k: cikar([d[k] for d in ds if k in d], derin + 1) for k in keys}
                sc['required'] = [k for k in keys if all(k in d for d in ds)]
            else: sc['additionalProperties'] = True
        ls = [x for v in vs if isinstance(v, list) for x in v]
        if ls and derin < 4: sc['items'] = cikar(ls, derin + 1)
        st = [v for v in vs if isinstance(v, str)]
        if st and len(set(st)) <= 12 and len(st) >= 6: sc['ornek_degerler'] = sorted(set(st))
        return sc
    return {'$schema': 'https://json-schema.org/draft/2020-12/schema', 'title': ad, 'description': f'{SURUM} oyun verisinden çıkarıldı ({len(ornekler)} örnek). Yeni içerik bu şekle uymalı.', **cikar(ornekler)}

V = lambda f: J(os.path.join(C, 'veri-json', f + '.json'))
def semalar():
    z = V('zones'); mobs = z['MOBS']; c = V('content')
    return {
        'esya_tabani.schema.json': sema(V('esya_tabanlari'), 'Eşya tabanı (shared/items.js itemBase)'),
        'yetenek.schema.json': sema(V('yetenekler'), 'Yetenek (shared/skills.js SKILLS)'),
        'canavar.schema.json': sema(list(mobs.values()) if isinstance(mobs, dict) else mobs, 'Canavar (shared/zones.js MOBS)'),
        'canavar_ailesi.schema.json': sema(V('bestiary')['FAMILIES'], 'Canavar ailesi (shared/bestiary.js FAMILIES)'),
        'bolge.schema.json': sema(z['ZONES'], 'Bölge (shared/zones.js ZONES)'),
        'ana_gorev.schema.json': sema(V('anagorev')['MQ'], 'Ana görev adımı (shared/anagorev.js MQ)'),
        'destan_bolumu.schema.json': sema(V('destan')['DESTAN'], 'Destan bölümü (shared/destan.js DESTAN)'),
        'sinif.schema.json': sema(list(c['CLASSES'].values()), 'Sınıf (shared/content.js CLASSES)'),
        'gunluk_gorev.schema.json': sema(c['QUESTS'], 'Günlük görev (shared/content.js QUESTS)'),
        'dukkan_urunu.schema.json': sema(c['SHOP'], 'Dükkân ürünü (shared/content.js SHOP)'),
        'han_icecegi.schema.json': sema(list(V('han')['DRINKS'].values()), 'Han içeceği (shared/han.js DRINKS)'),
        'yoldas.schema.json': sema(list(V('ahir')['COMPANIONS'].values()), 'Ahır yoldaşı (shared/ahir.js COMPANIONS)'),
        'npc_diyalog.schema.json': {'$schema': 'https://json-schema.org/draft/2020-12/schema', 'title': 'NPC diyaloğu (js/ui-diyalog.js diyalog() bağımsız değişkeni)', 'type': 'object',
            'properties': {'kim': {'type': 'string', 'description': 'NPC görsel kimliği (ör. halvor, maelis, yashka, edran, volgar)'}, 'ad': {'type': 'string'}, 'unvan': {'type': 'string'},
                           'halk': {'enum': ['ocak', 'sancak']}, 'satirlar': {'type': 'array', 'items': {'type': 'string'}, 'description': 'Sırayla gösterilen replikler'},
                           'son': {'type': 'array', 'items': {'type': 'object', 'properties': {'t': {'type': 'string', 'description': 'düğme yazısı'}, 'a': {'type': 'string', 'description': 'ACT eylem adı'}, 'ana': {'type': 'boolean'}}}},
                           'html': {'type': 'boolean'}}, 'required': ['kim', 'ad', 'satirlar']},
        'varlik_manifest_kaydi.schema.json': {'$schema': 'https://json-schema.org/draft/2020-12/schema', 'title': 'Paket manifesti dosya kaydı', 'type': 'object',
            'properties': {'yol': {'type': 'string'}, 'bayt': {'type': 'integer'}, 'sha256': {'type': 'string'}, 'tur': {'type': 'string'}, 'kategori': {'type': 'string'}, 'varlik_kimligi': {'type': 'string', 'description': 'düz dosyada oyun yolu; gömülüde js/<modül>.js#<anahtar>'},
                           'kaynak': {'type': 'string'}, 'olcu_px': {'type': ['array', 'null']}, 'kullanim_ekranlari': {'type': 'array', 'items': {'type': 'string', 'description': '<halk>:<ekran_kimligi>'}}, 'onayli_oyundaki_hali': {'type': 'boolean'}, 'degistirildi': {}}, 'required': ['yol', 'sha256']},
    }

def kimlikler():
    z = V('zones'); c = V('content'); b = V('bestiary')
    mobs = z['MOBS']
    return {'esya': [e['kimlik'] for e in V('esya_tabanlari')], 'yetenek': [e['kimlik'] for e in V('yetenekler')],
            'canavar': list(mobs.keys()) if isinstance(mobs, dict) else [m.get('id') for m in mobs], 'canavar_ailesi': [f['id'] for f in b['FAMILIES']],
            'dunya_bossu': [w[0] for w in b['WORLD_BOSSES']], 'bolge': [x['id'] for x in z['ZONES']],
            'asama': [f"{x['id']}-{i}" for x in z['ZONES'] for i in range(1, z['STAGES_PER_ZONE'] + 1)],
            'ana_gorev': [x['id'] for x in V('anagorev')['MQ']], 'destan': [x['id'] for x in V('destan')['DESTAN']], 'gunluk_gorev': [q['id'] for q in c['QUESTS']],
            'sinif': list(c['CLASSES']), 'halk': list(c['FACTIONS']), 'para': list(c['CURRENCY']), 'durum_etkisi': list(c['STATUS']),
            'ic_mekan': [m['kimlik'] for m in IC], 'sahne_42': [x['varlik_kimligi'] for x in S42],
            'ekran': {h: [e['ekran_kimligi'] for e in v['ekranlar']] for h, v in EKR.items()},
            'ses': [m['kimlik'] for m in SES['muzik_dosyalari']] + [x['kimlik'] for x in SES['sentez_sesleri']],
            'gomulu_gorsel': sorted(k for k, v in KAT.items() if v['tur'] == 'gomulu'), 'dosya_varlik': sorted(k for k, v in KAT.items() if v['tur'] == 'dosya')}

def esleme():
    tab = {}
    for h, v in EKR.items():
        for e in v['ekranlar']:
            scr = e['ekran_kimligi']; ham = VARL.get(h, {}).get(('C-' + scr) if not re.match(r'^[ABD]\d\d', scr) else scr, [])
            ad = []
            for x in ham:
                if x.startswith('yol:'): ad.append(x[4:])
                else:
                    m = [k for k, kv in KAT.items() if kv['sha256'] == x[4:]]
                    ad.append(m[0] if m else 'bilinmeyen (çalışma anında üretilmiş/renklendirilmiş görsel) ' + x[4:16])
            tab[f'{h}:{scr}'] = {'ad': e['ad'], 'varliklar': sorted(set(ad))}
    return tab

EKSIK = []
def eksik(s): EKSIK.append(s)

# ======================================================================== GPT
def gpt():
    P = Paket('KORANT_GPT')
    kolaj_ekran(P, False)
    P.yaz('02_EKRAN_LISTESI/EKRAN_LISTESI.md', ekran_md(), tur='belge', kategori='Ekran listesi')
    P.yaz('02_EKRAN_LISTESI/ekranlar.json', EKR, tur='veri', kategori='Ekran listesi (makine okunur)')
    P.yaz('03_IC_MEKANLAR/IC_MEKANLAR.md', ic_md(), tur='belge', kategori='İç mekânlar')
    P.yaz('03_IC_MEKANLAR/ic_mekanlar.json', IC, tur='veri', kategori='İç mekânlar')
    P.yaz('04_SAHNE_MANIFESTI/sahneler_42.json', S42, tur='veri', kategori='42 onaylı sahne manifesti')
    s = f'# 42 onaylı sahne ({SURUM})\n\n29 düz sahne (`sahneler/`) + 13 iç mekân (`interiors/`). Hepsi WebP, onaylı, DEĞİŞTİRİLMEZ. Görsellerin kendisi Gemini paketinde.\n\n| Kimlik | Yol | Ölçü | Kullanım |\n|---|---|---|---|\n' + ''.join(f"| `{x['varlik_kimligi']}` | `{x['yol']}` | {x['olcu_px'][0]}×{x['olcu_px'][1]} | {x['kullanim']} |\n" for x in S42)
    P.yaz('04_SAHNE_MANIFESTI/SAHNELER_42.md', s, tur='belge', kategori='42 onaylı sahne manifesti')
    T = os.path.join(G, '_tasarim')
    kopya(P, os.path.join(T, 'ANA_EKRAN_VE_KONSEPT.md'), '05_KONSEPT/ANA_EKRAN_VE_KONSEPT.md', 'Güncel oyun konsepti')
    kopya(P, os.path.join(T, 'KONSEPT_BRIEF.md'), '05_KONSEPT/KONSEPT_BRIEF.md', 'Güncel oyun konsepti')
    kopya(P, os.path.join(T, 'denetim-22kas/paket/SANAT_KITABI.md'), '05_KONSEPT/SANAT_KITABI.md', 'Güncel oyun konsepti')
    kopya(P, os.path.join(T, 'YERLESIM_SPEC.md'), '05_KONSEPT/YERLESIM_SPEC.md', 'Arayüz yerleşim kuralları')
    B = os.path.join(C, 'belge')
    kopya(P, os.path.join(B, 'MEKANIK_VE_KURALLAR.md'), '06_MEKANIK/MEKANIK_VE_KURALLAR.md', 'Oyun mekanikleri ve kuralları')
    kopya(P, os.path.join(B, 'EKONOMI_VE_ODULLER.md'), '07_EKONOMI/EKONOMI_VE_ODULLER.md', 'Ekonomi ve ödül kuralları')
    for f in ['esya_listesi.csv', 'yetenek_listesi.csv']: kopya(P, os.path.join(B, f), '08_ESYA/' + f, 'Eşya veri listeleri')
    for f in ['esya_tabanlari.json', 'yetenekler.json']: kopya(P, os.path.join(C, 'veri-json', f), '08_ESYA/' + f, 'Eşya veri listeleri')
    kopya(P, os.path.join(B, 'KARAKTER_SINIF_IRK.md'), '09_KARAKTER/KARAKTER_SINIF_IRK.md', 'Karakter, sınıf, ırk, cinsiyet')
    rep = J(os.path.join(C, 'replikler.json'))
    npc = open(os.path.join(B, 'NPC_VE_REPLIKLER.md'), encoding='utf-8').read() + ''.join(f"\n### `{r['dosya']}:{r['satir']}`\n```js\n{r['kaynak']}\n```\n" for r in rep)
    npc += '\nDestan bölümlerindeki krallarla geçen konuşmalar `12_HIKAYE/HIKAYE_VE_GOREVLER.md` içinde. İngilizce karşılıklar `js/i18n/en-*.js` (pakette yok).\n'
    P.yaz('10_NPC/NPC_VE_REPLIKLER.md', npc, tur='belge', kategori='NPC isimleri, görevleri ve replikleri')
    P.yaz('10_NPC/replikler.json', rep, tur='veri', kategori='NPC replikleri (kaynak satırları)')
    kopya(P, os.path.join(B, 'BOLGE_ZINDAN_CANAVAR_BOSS.md'), '11_DUNYA/BOLGE_ZINDAN_CANAVAR_BOSS.md', 'Bölge, zindan, canavar, boss')
    kopya(P, os.path.join(B, 'HIKAYE_VE_GOREVLER.md'), '12_HIKAYE/HIKAYE_VE_GOREVLER.md', 'Hikâye ve görev metinleri')
    kopya(P, os.path.join(T, 'VAHRAN_destan.txt'), '12_HIKAYE/VAHRAN_destan.txt', 'Hikâye ve görev metinleri')
    P.yaz('13_SES/SES_LISTESI.md', ses_md(), tur='belge', kategori='Ses varlıkları listesi')
    P.yaz('13_SES/ses.json', SES, tur='veri', kategori='Ses varlıkları listesi')
    sira = re.findall(r'href="(css/[^"]+)"', open(os.path.join(G, 'index.html'), encoding='utf-8').read())
    for f in sira: P.ekle(os.path.join(G, f), '14_CSS/' + f, tur='css', kategori='Ortak HUD ve arayüz CSS', varlik_kimligi=f, kaynak=f, degistirildi=False)
    P.yaz('14_CSS/YUKLEME_SIRASI.md', '# CSS yükleme sırası (index.html)\n\nSonraki dosya öncekini ezer; çok `!important` var. Otomatik üretilenler (elle düzenlenmez): `v26-gpt4.css`, `v31-savas-hud.css`, `v32-p2340.css`, `v33-karakter.css` (şablonları `_tasarim/araclar/`).\n\n' + ''.join(f'{i+1}. `{f}`\n' for i, f in enumerate(sira)), tur='belge', kategori='Ortak HUD ve arayüz CSS')
    P.yaz('15_TASARIM_DEGISKENLERI/TASARIM_DEGISKENLERI.md', token_md(), tur='belge', kategori='Tasarım değişkenleri')
    kopya(P, os.path.join(C, 'tokenler.json'), '15_TASARIM_DEGISKENLERI/tokenler.json', 'Tasarım değişkenleri')
    P.yaz('16_EKRAN_VARLIK_ESLESME/ekran_varlik.json', esleme(), tur='veri', kategori='Ekran ↔ varlık eşleşmesi (çalışma anında ölçüldü)')
    kat = [{k: v for k, v in x.items() if k not in ('cikarilan_dosya',)} | {'kullanim_ekranlari': kullanim(x)} for x in KAT.values()]
    P.yaz('16_EKRAN_VARLIK_ESLESME/varlik_katalogu.json', kat, tur='veri', kategori='Bütün varlıklar (dosya + gömülü) kataloğu')
    P.yaz('16_EKRAN_VARLIK_ESLESME/OKU.md', '# Ekran ↔ varlık eşleşmesi\n\n- `ekran_varlik.json`: her ekranda ekranda GÖRÜNEN öğelerin resimleri (CSS arka planı, maske, `<img>`) çalışan oyundan toplandı; gömülü (blob/data) görseller sha256 ile `varlik_katalogu.json` kimliğine bağlandı. “bilinmeyen” = çalışma anında renklendirilmiş/üretilmiş resim. Yarı saydam katmanlı ekranlarda (Han, Ahır, VS…) arkada görünen ana ekranın parçaları da listelenir.\n- Ölçüm yalnız çekilen 226 ekranı kapsar: bir varlığın `kullanim_ekranlari` alanının boş olması “kullanılmıyor” demek değildir (ör. bir eşya simgesi yalnız o eşya çantadayken görünür).\n- `varlik_katalogu.json`: yayındaki bütün görsel/ses varlıkları. `kimlik` düz dosyada oyun yolu, gömülüde `js/<modül>.js#<anahtar>`. `kodda_dogrudan_gecen` / `kodda_dolayli` kaynak koddaki geçişler; `modulu_yukleyen` gömülü modülü içe aktaran dosyalar.\n', tur='belge', kategori='Ekran ↔ varlık eşleşmesi')
    rap(P, '17_DENETIM_RAPORLARI')
    for ad, sc in semalar().items(): P.yaz('18_SEMALAR/' + ad, sc, tur='şema', kategori='Gerçek JSON şemaları')
    P.yaz('18_SEMALAR/kimlik_listeleri.json', kimlikler(), tur='veri', kategori='Gerçek varlık ve içerik kimlikleri')
    for f in sorted(os.listdir(os.path.join(C, 'veri-json'))):
        if f not in ('esya_tabanlari.json', 'yetenekler.json'): P.ekle(os.path.join(C, 'veri-json', f), '19_VERI_JSON/' + f, tur='veri', kategori='shared/ modüllerinin JSON dökümü', kaynak='shared/' + f.replace('__', '/').replace('.json', '.js'))
    return P

def rap(P, kl, gorsel=False):
    T = os.path.join(G, '_tasarim')
    for f, ad in [('UI_DENETIM_RAPORU.md', 'Arayüz denetim raporu'), ('EKSIK_LISTESI_SON.md', 'Eksik listesi (son)'), ('denetim-22kas/C1_HIZLI_DUZELTMELER.md', 'C1 hızlı düzeltmeler'),
                  ('denetim-22kas/C2_HD_MODEL_RAPORU.md', 'C2 HD model raporu'), ('denetim-22kas/C3_C10_TESLIM_23KAS.md', 'C3–C10 teslim'), ('proje-23kas/00_PROJE_VE_SIRA.md', 'P23 proje istekleri U1–U14, bulgular E1–E11'),
                  ('denetim-22kas/paket/DEMIR_DIYARI_ANA_DENETIM.html', 'Ana denetim raporu (22 Kas, 47 sorun)')]:
        kopya(P, os.path.join(T, f), f'{kl}/' + os.path.basename(f), 'Hata ve denetim raporları')
    if gorsel:
        for f in ['C1_once_sonra.webp', 'C2_kademe_karsilastirma.webp']: kopya(P, os.path.join(T, 'denetim-22kas', f), f'{kl}/{f}', 'Görsel hata raporları (görsel kanıt)')
    oto = {h: {'js_hatalari': v['js_hatalari'], 'acilmayan_veya_sorunlu': v['acilmayan_veya_sorunlu'], 'ekran_bulgulari': {e['ekran_kimligi']: e['otomatik_denetim'] for e in v['ekranlar'] if any(e['otomatik_denetim'].values())}} for h, v in EKR.items()}
    P.yaz(f'{kl}/otomatik_arayuz_denetimi.json', oto, tur='veri', kategori='Bu sürümün otomatik arayüz denetimi')
    s = f'# Otomatik arayüz denetimi ({SURUM}, {TARIH})\n\nÇekim sırasında her ekranda ölçüldü: **kesik** (taşan/kırpılan yazı), **taşma** (kabın dışına çıkan yazı), **küçük** (26 px altı dokunma hedefi), **çakışma** (üst üste binen düğmeler). Ölçü yaklaşık; her bulgu gözle doğrulanmalı.\n'
    for h, v in oto.items():
        s += f"\n## {h}\nJS hatası: {', '.join(v['js_hatalari']) or 'yok'}\n\n| Ekran | Kesik | Taşma | Küçük | Çakışma |\n|---|---|---|---|---|\n"
        for e, b in v['ekran_bulgulari'].items(): s += f"| `{e}` | {'<br>'.join(b['kesik'][:4])} | {'<br>'.join(b['tasma'][:4])} | {'<br>'.join(b['kucuk'][:4])} | {'<br>'.join(b['cakisma'][:4])} |\n"
    P.yaz(f'{kl}/OTOMATIK_ARAYUZ_DENETIMI.md', s, tur='belge', kategori='Bu sürümün otomatik arayüz denetimi')

# ======================================================================== GEMINI
def gemini():
    P = Paket('KORANT_GEMINI')
    kolaj_ekran(P, True)
    P.yaz('02_EKRANLAR/EKRAN_LISTESI.md', ekran_md(), tur='belge', kategori='Ekran listesi')
    P.yaz('02_EKRANLAR/ekranlar.json', EKR, tur='veri', kategori='Ekran listesi')
    for f in sorted(os.listdir(os.path.join(G, 'sahneler'))): dosya(P, 'sahneler/' + f, '03_SAHNELER_42', '42 onaylı sahne')
    for m in IC: dosya(P, m['gorsel'], '03_SAHNELER_42', '42 onaylı sahne (iç mekân)')
    P.yaz('03_SAHNELER_42/sahneler_42.json', S42, tur='veri', kategori='42 onaylı sahne manifesti')
    P.yaz('03_SAHNELER_42/IC_MEKANLAR.md', ic_md(), tur='belge', kategori='13 iç mekân')
    # haritalar
    for h in ['sancak', 'ocak', 'carsi', 'klan-sancak', 'klan-ocak']:
        for f in ['sahne.webp', 'atlas.webp']: dosya(P, f'img/kd/sehir/{h}/{f}', '04_HARITALAR', 'Ana harita (eski 2B şehir kaynağı + bina kesit atlası)')
    gomulu(P, 'js/hikaye-png.js#diyar', '04_HARITALAR', 'Diyar haritası (hikâye)')
    P.yaz('04_HARITALAR/OKU.md', '# Ana haritalar\n\nOyunda şu an kullanılan ana ekran resimleri `03_SAHNELER_42/sahneler/`: `baskent_elentha`, `baskent_kragmir`, `yemin_pazari`, `klan_obasi_elentha`, `klan_obasi_kragmir`, `diyar_haritasi` (tekrar olmasın diye burada kopyası yok).\n\nBu klasörde: `img/kd/sehir/<yer>/sahne.webp` ve `atlas.webp` = eski boyalı şehir kaynağı ve bina kesit atlası (`hub2d.js`, `js/hub2d-data.js` dokunma bölgeleri). `hikaye-png/diyar` = hikâye ekranındaki diyar haritası.\n', tur='belge', kategori='Ana haritalar')
    for m in ['karakter-png-veri', 'portre-png', 'p23-giris-png', 'p23-profil-png']:
        for k in mod(m): gomulu(P, k, '05_KARAKTER_OLUSTURMA_SECIM', 'Karakter oluşturma/seçim görseli')
    P.yaz('05_KARAKTER_OLUSTURMA_SECIM/OKU.md', '# Karakter oluşturma ve seçim\n\n- `karakter-png-veri/`: 16 tam boy (`ırk.sınıf.cinsiyet`, 512×768) + 20 yüz (`yuz.ırk.cinsiyet.no`). Kragmir = YEŞİL tenli ork.\n- `portre-png/`: sınıf portreleri (`sınıf.halk[_f]`) ve sınıf resimleri (`art.sınıf.halk`).\n- `p23-giris-png/`: giriş levhaları ve mühürler; `p23-profil-png/`: profil kartı zemini.\n- Zemin: `03_SAHNELER_42/sahneler/karakter_secim_elentha|kragmir.webp`.\n', tur='belge', kategori='Karakter oluşturma/seçim')
    bandi = re.compile(r'bandikut')
    for m in ['b2d-sancak', 'b2d-ocak']:
        for k in mod(m):
            if not bandi.search(k): gomulu(P, k, '06_SAVAS_SPRITE_KAHRAMAN', 'Oynanabilir karakter savaş pozu')
    for k in ['js/p26-savas-png.js#t3_ocak', 'js/p26-savas-png.js#t3_sancak']: gomulu(P, k, '06_SAVAS_SPRITE_KAHRAMAN', 'Oyuncu T3 savaş görünümü (yaratik2d.js)')
    P.yaz('06_SAVAS_SPRITE_KAHRAMAN/OKU.md', '# Oynanabilir karakter savaş pozları\n\n`b2d-sancak/` (Elentha) ve `b2d-ocak/` (Kragmir): `sinif-cinsiyet__poz.webp`, 384×512, zemin çizgisi alttan 64 px. Pozlar: bekleme, saldiri, buyu, vurulma, olum, zafer, kosu (kahraman başına 7). Kod `js/savas-birim2d.js`. Aynı JS dosyalarındaki bandikut yaratıkları `10_CANAVAR_BOSS/` altında (tek kopya).\n', tur='belge', kategori='Savaş pozları')
    for k in mod('p23-npc-png'): gomulu(P, k, '07_NPC', 'NPC görseli')
    for k in mod('gorsel-png'):
        if re.search(r'#(corin|edran|halvor|lira|maelis|thrak|volgar|yashka)(-yuz)?$', k): gomulu(P, k, '07_NPC', 'NPC portresi (G4)')
    for k in ['js/hikaye-png.js#edran', 'js/hikaye-png.js#volgar', 'js/p26-orman-png.js#yashka'] + mod('p23-taht-png'): gomulu(P, k, '07_NPC', 'NPC / kral görseli')
    dosya(P, 'img/p28/han_hanci.webp', '07_NPC', 'NPC: Hancı')
    for f in sorted(os.listdir(os.path.join(G, 'img/silah'))): dosya(P, 'img/silah/' + f, '08_EKIPMAN', 'Silah/ekipman görseli (rehber, mağaza)')
    for m in ['esya2-silah', 'esya2-zirh', 'esya2-taki', 'esya-png-veri']:
        for k in mod(m): gomulu(P, k, '09_ESYA_IKONLARI', 'Eşya ikonu')
    for f in ['han_icecek_saldiri', 'han_icecek_savunma', 'han_icecek_exp', 'han_icecek_enerji']: dosya(P, f'img/p28/{f}.webp', '09_ESYA_IKONLARI', 'Han içeceği ikonu')
    for k in mod('grafik5-png'):
        if not re.search(r'flama', k): gomulu(P, k, '09_ESYA_IKONLARI', 'Eşya/nesne çizimi (grafik5)')
    P.yaz('08_EKIPMAN/OKU.md', '# Silah, zırh ve ekipman\n\n- `img/silah/`: halk başına asa, hançer, kalkan, tırpan görselleri.\n- Eşya simgeleri (silah/zırh/takı, kimliğe bağlı) `09_ESYA_IKONLARI/` altında; anahtar = eşya kimliği (ör. `w:sword:0`, `a:warrior:0:helm`, `u:sazkiran`). Dosya adlarında `:` yerine `_` var; asıl kimlik manifestte.\n- 3B silah modelleri (`models/items/*.glb.js`) görsel değil, pakete alınmadı.\n', tur='belge', kategori='Ekipman')
    for m in ['b2d-y1', 'b2d-y2', 'b2d-y3', 'b2d-y4', 'b2d-yb']:
        for k in mod(m): gomulu(P, k, '10_CANAVAR_BOSS', 'Canavar/boss savaş görseli')
    for k in mod('b2d-sancak'):
        if bandi.search(k): gomulu(P, k, '10_CANAVAR_BOSS', 'Canavar (bandikut; b2d-sancak ve b2d-ocak içinde aynı)')
    for k in mod('p23-savas-png') + [k for k in mod('p26-savas-png') if '#boss_' in k] + [k for k in mod('p26-orman-png') if '#kurt_' in k]: gomulu(P, k, '10_CANAVAR_BOSS', 'Canavar/boss görseli')
    for f in sorted(os.listdir(os.path.join(G, 'img/p28'))):
        if f.startswith('pet_'): dosya(P, 'img/p28/' + f, '10_CANAVAR_BOSS', 'Ahır yoldaşı (hayvan)')
    P.yaz('10_CANAVAR_BOSS/OKU.md', '# Canavar ve boss görselleri\n\n`b2d-y1..y4` = bölge 1–4 yaratıkları, `b2d-yb` = ana bosslar (448 px). Anahtar `tür__poz` (bekleme, saldiri, vurulma, portre; bosslarda 2. evre `*2`). Eşleme `js/yaratik2d.js YARATIK`: [paket, tür, renk çarpanı]; bazı canavarlar aynı çizimi renk çarpanıyla kullanır (çarpan çalışma anında uygulanır). 13 tür yalnız bekleme pozlu (bkz. EKSIKLER). `pet_*` = ahır yoldaşları.\n', tur='belge', kategori='Canavar/boss')
    P.yaz('11_ZINDAN_ONIZLEME/OKU.md', '# Zindan önizlemeleri\n\nOnaylı önizlemeler `03_SAHNELER_42/sahneler/zindan_*.webp` (Dipsiz Kuyu `well`, Yeraltı Ocağı `depth`, Gök Yarığı `rift`, Mühürlü Oda `seal`, Kül Kulesi `kule`; `js/ui-zindan.js ZSAHNE`). Bu klasörde ek olarak G5 kart sahneleri (eski, `gorsel-png`).\n', tur='belge', kategori='Zindan önizleme')
    for k in ['js/gorsel-png.js#dipsiz-kuyu', 'js/gorsel-png.js#yeralti-ocagi']: gomulu(P, k, '11_ZINDAN_ONIZLEME', 'Zindan kart sahnesi (G5)')
    for k in mod('savas-arka-png'): gomulu(P, k, '12_SAVAS_ARKA_PLANLARI', 'Savaş arka planı (iki resim üst üste)')
    for f in ['vs_bg_ally', 'vs_bg_enemy']: dosya(P, f'img/p27/{f}.webp', '12_SAVAS_ARKA_PLANLARI', 'VS ekranı zemini')
    for k in mod('p26-orman-png'):
        if k.endswith('#bg'): gomulu(P, k, '12_SAVAS_ARKA_PLANLARI', 'Orman (öğretici) savaş zemini')
    P.yaz('12_SAVAS_ARKA_PLANLARI/OKU.md', '# Savaş arka planları\n\nGüncel zeminler düz dosya `03_SAHNELER_42/sahneler/savas_*.webp` (`js/savas-arka.js`, `sah:<ad>`). Burada: `savas-arka-png/1..5` (eski gömülü zeminler, her resim iki zemin üst üste), VS zeminleri, orman zemini.\n', tur='belge', kategori='Savaş arka planları')
    for k in mod('amblem-png') + [k for k in mod('grafik5-png') if 'flama' in k] + [k for k in mod('p23-giris-png') if re.search('levha|muhur', k)]: gomulu(P, k, '13_SANCAK_ARMA', 'Resmî sancak/arma')
    for f in ['img/p28/anit_bayrak_elentha.webp', 'img/p28/anit_bayrak_kragmir.webp', 'img/p27/vs_amblem.webp', 'img/p27/lider_klan_sancak.webp', 'img/p27/yakut_karti_arma.webp']: dosya(P, f, '13_SANCAK_ARMA', 'Resmî sancak/arma')
    T = os.path.join(G, '_tasarim')
    kopya(P, os.path.join(A, 'GORSEL_KONSEPT.md'), '14_GORSEL_KONSEPT/GORSEL_KONSEPT.md', 'Görsel konsept')
    kopya(P, os.path.join(T, 'denetim-22kas/paket/SANAT_KITABI.md'), '14_GORSEL_KONSEPT/SANAT_KITABI.md', 'Görsel konsept')
    kopya(P, os.path.join(T, 'YERLESIM_SPEC.md'), '14_GORSEL_KONSEPT/YERLESIM_SPEC.md', 'Arayüz yerleşim kuralları')
    rap(P, '15_GORSEL_HATA_RAPORLARI', gorsel=True)
    K = os.path.join(S, 'kayit')
    if os.path.isdir(K):
        for f in sorted(os.listdir(K)):
            if f.endswith('.webm'): P.ekle(os.path.join(K, f), '16_SAVAS_KAYITLARI/' + f, tur='video', kategori='Savaş ve animasyon kaydı (bu sürümden)', degistirildi='bu sürümden Playwright kaydı, 880×406, VP9, sessiz')
    P.yaz('16_EKRAN_VARLIK/ekran_varlik.json', esleme(), tur='veri', kategori='Ekran ↔ varlık eşleşmesi')
    return P

def bitir(P, roller):
    toplam = sum(d['bayt'] for d in P.dos)
    # bölme: klasör sırasıyla açgözlü
    parca = []; cur = []; boy = 0
    for d in sorted(P.dos, key=lambda d: d['yol']):
        if cur and boy + d['bayt'] > SINIR - 600_000: parca.append(cur); cur = []; boy = 0
        cur.append(d); boy += d['bayt']
    if cur: parca.append(cur)
    n = len(parca)
    for i, p in enumerate(parca):
        for d in p: d['zip_parcasi'] = f'{P.ad}_{i+1:02d}of{n:02d}.zip' if n > 1 else f'{P.ad}.zip'
    man = {'paket': P.ad, 'surum_kimligi': SURUM, 'olusturma_tarihi': TARIH, 'oyun': OYUN, 'rol': roller['rol'], 'toplam_dosya': len(P.dos) + 2, 'toplam_bayt': toplam,
           'zip_parcalari': [{'ad': (f'{P.ad}_{i+1:02d}of{n:02d}.zip' if n > 1 else f'{P.ad}.zip'), 'dosya_sayisi': len(p), 'bayt': sum(d['bayt'] for d in p)} for i, p in enumerate(parca)],
           'kurallar': roller['kurallar'], 'eksikler_ve_notlar': EKSIK, 'dosyalar': P.dos}
    json.dump(man, open(os.path.join(P.kok, 'manifest.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    open(os.path.join(P.kok, 'README.md'), 'w', encoding='utf-8').write(roller['readme'](man))
    zips = []
    for i, p in enumerate(parca):
        z = os.path.join(OUT, man['zip_parcalari'][i]['ad'])
        with zipfile.ZipFile(z, 'w') as Z:
            for ek in ['README.md', 'manifest.json']: Z.write(os.path.join(P.kok, ek), ek, compress_type=zipfile.ZIP_DEFLATED)
            for d in p:
                ct = zipfile.ZIP_STORED if d['yol'].endswith(('.webp', '.png', '.jpg', '.webm', '.mp3')) else zipfile.ZIP_DEFLATED
                Z.write(os.path.join(P.kok, d['yol']), d['yol'], compress_type=ct)
        zips.append((z, os.path.getsize(z)))
    return man, zips

# ======================================================================== eksikler, README, çalıştır
n_e = {h: v['ayri_ekran'] for h, v in EKR.items()}
birlesik = len(set(e['ekran_kimligi'] for v in EKR.values() for e in v['ekranlar']))
eksik(f"Ekran sayısı: istekteki “157 ekran” sayısı bu sürümde ölçülerek doğrulanamadı. Çekilen ayrı (birbirinin aynısı olmayan) ekran: Elentha {n_e.get('elentha')}, Kragmir {n_e.get('kragmir')}; iki halkın birleşik ekran kimliği {birlesik}. Aynı pencereyi açan kısayollar (ör. rankMenu = rank) tekrar sayılmadı, `ayni_goruntu` alanında listelendi.")
for h, v in EKR.items():
    if v['acilmayan_veya_sorunlu']: eksik(f"{h}: açılmayan/eylem olmayan ekran girişleri: " + ', '.join(f"{x['ekran']} ({x['durum']})" for x in v['acilmayan_veya_sorunlu']) + ". Bunlar ya parametresiz çağrıda bilerek sessiz döner (skill, exchange, msgMenu), ya bu sürümde eylemi yoktur (sandikOpen), ya da yalnız bir işlem yapar (spin, arenaRefresh, tp).")
eksik("Mini Dizi videoları (`video/bolum-01..10.mp4`) oyun verisinde tanımlı ama yayında dosyası YOK.")
eksik("Ses: dosya olarak yalnız 4 müzik var; efekt/arayüz sesleri `js/sfx.js` içinde sentezlenir, ses dosyası yoktur.")
eksik("Küçük Bran (öğretici çocuk) ve kardeşi Nessa'nın boyalı portresi yok (SVG yedek kullanılıyor).")
eksik("13 yaratık türü yalnız bekleme pozlu (saldırı/vurulma yok): rabbit, falcon, hornet, gargoyle, leader_of_barbarian, lamia, snake_queen ve 6 ejder (red_dragon, red_dragon_hatchling, blue_dragon, bone_dragon, dark_dragon, gold_dragon).")
eksik("Boss 2. evreleri gerçek dönüşüm çizimi değil; Kragmir 5. yüz yuvası yok (yuva 4 savaşçı yüzünün aynası).")
eksik("Gemini paketine istenen listede olmayan gömülü arayüz grafikleri alınmadı: kd-png (188 arayüz parçası), glif-png (40 glif), p23-anaekran/p23-sehir2-* (HUD parçaları), p24-ekran, p25-a..d, p23-maden, p23-sunucu, vfx-png ve G7 efekt şeritleri, gorsel-png yetenek kartları (203) ve G5 sahne kartları, img/p27 mağaza (yakut) görselleri, img/icons uygulama simgeleri. Kimlikleri GPT paketindeki `16_EKRAN_VARLIK_ESLESME/varlik_katalogu.json` içinde.")
eksik("Yayında olmayan yerel dosyalar pakete alınmadı: img/items3d/*, models/test/*, video/README.txt. 3B modeller (models/**, .glb.js) görsel olmadığı için Gemini paketinde yok.")
eksik("`js/ic-mekan.js` yorumlarında anılan `docs/referans/p30-ic-mekan/TALIMAT.md` ve `interiors.json` (dış sürümün belge klasörü) depoda yok; iç mekân bilgisi doğrudan koddan (MEKAN tablosu) alındı.")
eksik("Ekran görüntüleri gerçek oyundan 880×406 mantıksal, dpr 2,66 (2340×1080) çekildi; test hesabı oyunun kendi geliştirici araçlarıyla Sv. 51'e çıkarıldı, kaynak/eşya verildi, bütün aşamalar açıldı (gerçek oyuncu verisi yok). Sohbetteki adlar oyunun yapay sohbet botlarıdır.")
eksik("Eski denetim raporları (22–23 Kas) önceki sürümleri anlatır; o tarihten sonra düzeltilen maddeler olabilir. Bu sürümün ölçümü `OTOMATIK_ARAYUZ_DENETIMI.md`.")

KURAL = ['Onaylı görseller (42 sahne ve oyundaki bütün gömülü görseller) değiştirilmeden, bayt bayt aynı konuldu; sha256 manifestte.', 'Dosya adları ve varlık kimlikleri korundu (gömülü: js/<modül>.js#<anahtar>; düz dosya: oyun yolu). Gömülü dosya adlarında yalnız `:` gibi dosya sistemine uymayan karakterler `_` oldu; asıl kimlik manifestte.',
         'Çözünürlük düşürülmedi. Ekran görüntüleri 2340×1080 PNG çekildi, boyut için aynı çözünürlükte WebP q92 kaydedildi.', 'Aynı içerikli dosyalar bir kez konuldu; diğer kimlikleri `ayni_icerikli_kimlikler` alanında.',
         'Şifre, API anahtarı, erişim bilgisi ve gerçek oyuncu verisi yok.', 'Her ZIP parçası bağımsız açılır; her birinde README.md ve tam manifest.json var.', '`kullanim_ekranlari` çalışan oyunda çekilen 226 ekranda ölçüldü; boş olması varlığın kullanılmadığı anlamına gelmez (yalnız belirli durumda görünür).']
DONUS = """## Teslim (geri gönderim) kuralları
- Yeni ya da düzeltilmiş her dosyada **aynı varlık kimliğini** ve dosya adını kullan; yeni varlık için yeni kimlik öner.
- Görsel biçimi yalnız PNG / WebP / JPEG; AVIF, SVG, BMP, TGA, TIFF yok.
- İki halk (Elentha/Kragmir) eşliğini koru.
- Oyun mekaniğine (`shared/`) dokunan öneri kod olarak değil, `18_SEMALAR` şemasına uyan veri olarak gelsin.
- Teslimin kökünde bir `manifest.json` olsun: her dosya için `yol`, `varlik_kimligi`, `sha256`, `aciklama`.
"""
def readme(man, giris, yapi):
    p = man['zip_parcalari']
    s = f"# {man['paket']} — {SURUM}\n\n{giris}\n\n**Sürüm kimliği:** `{SURUM}` (iki pakette aynı). Oyun: {OYUN['ad']}, yayın sürümü {OYUN['yayin_surumu']} (git `{OYUN['git_commit']}`, {OYUN['yayin_dosya_sayisi']} dosya). Hazırlanma: {TARIH}. Ekran: {OYUN['mantiksal_ekran']}, telefon {OYUN['hedef_telefon']}.\n\n"
    s += f"**Parçalar ({len(p)}):** " + ', '.join(f"`{x['ad']}` ({x['dosya_sayisi']} dosya, {x['bayt']/1e6:.1f} MB)" for x in p) + ". Her parça tek başına açılır; README ve manifest hepsinde aynıdır. `manifest.json → dosyalar[].zip_parcasi` hangi dosyanın hangi parçada olduğunu söyler.\n\n"
    s += "## Klasörler\n" + yapi + "\n\n## Paketleme kuralları\n" + ''.join(f'- {k}\n' for k in KURAL) + '\n' + DONUS + "\n## Eksikler ve notlar (açıkça)\n" + ''.join(f'- {e}\n' for e in EKSIK)
    return s
GPT_YAPI = """| Klasör | İçerik |
|---|---|
| `01_KOLAJLAR/` | Elentha 9 + Kragmir 9 = 18 ekran kolajı (her karede ekran kimliği ve adı) |
| `02_EKRAN_LISTESI/` | Bütün ekranlar ve alt sekmeler: kimlik, açan eylem, pencere başlığı, işlev, aynı görünen girişler (`EKRAN_LISTESI.md`, `ekranlar.json`) |
| `03_IC_MEKANLAR/` | 13 iç mekânın adı, halkı, açan eylemi, işlevi, görsel yolu |
| `04_SAHNE_MANIFESTI/` | 42 onaylı sahnenin manifesti (yol, ölçü, sha256, kullanım) |
| `05_KONSEPT/` | Güncel oyun konsepti, ana ekran envanteri, sanat kitabı, yerleşim kuralları |
| `06_MEKANIK/` | Oyun mekanikleri ve kuralları (koddan) |
| `07_EKONOMI/` | Ekonomi ve ödül kuralları (koddan) |
| `08_ESYA/` | 698 eşya tabanı + 203 yetenek (CSV + JSON, TR adlarıyla) |
| `09_KARAKTER/` | Halk, sınıf, cinsiyet, yetenek ağaçları |
| `10_NPC/` | NPC adları, görevleri, yerleri, görselleri ve koddaki replikleri |
| `11_DUNYA/` | Bölgeler, canavar aileleri, bosslar, zindanlar, etkinlikler |
| `12_HIKAYE/` | Ana görev (64 adım), Destan (8 bölüm, iki halkın metni), günlük görevler, `VAHRAN_destan.txt` |
| `13_SES/` | Ses varlıkları listesi (4 müzik + sentez ses anahtarları) |
| `14_CSS/` | Oyunun bütün CSS dosyaları, yükleme sırasıyla |
| `15_TASARIM_DEGISKENLERI/` | CSS tasarım değişkenleri (token) tablosu |
| `16_EKRAN_VARLIK_ESLESME/` | Her ekranda görünen varlıklar (çalışma anında ölçüldü) + bütün varlıkların kataloğu |
| `17_DENETIM_RAPORLARI/` | Bu sürümün otomatik arayüz denetimi + önceki hata/denetim raporları |
| `18_SEMALAR/` | Gerçek veriden çıkarılmış JSON şemaları + bütün kimlik listeleri |
| `19_VERI_JSON/` | `shared/` oyun modüllerinin değiştirilmemiş JSON dökümü (73 modül) |"""
GEM_YAPI = """| Klasör | İçerik |
|---|---|
| `01_KOLAJLAR/` | Elentha 9 + Kragmir 9 = 18 ekran kolajı |
| `02_EKRANLAR/` | Her ayrı ekranın tam çözünürlüklü (2340×1080) görüntüsü, `elentha/` ve `kragmir/`, + ekran listesi |
| `03_SAHNELER_42/` | 42 onaylı WebP sahne: `sahneler/` (29) + `interiors/` (13 iç mekân) |
| `04_HARITALAR/` | Şehir kaynak resimleri ve bina atlasları, diyar haritası (güncel ana ekranlar 03'te) |
| `05_KARAKTER_OLUSTURMA_SECIM/` | 16 tam boy, 20 yüz, sınıf portreleri, giriş levhaları |
| `06_SAVAS_SPRITE_KAHRAMAN/` | 16 oynanabilir karakterin savaş pozları (7'şer) + T3 görünümü |
| `07_NPC/` | NPC tam boy/gölge, portre ve yüzler, krallar, tahtlar, hancı |
| `08_EKIPMAN/` | Silah/kalkan görselleri |
| `09_ESYA_IKONLARI/` | Eşya simgeleri (kimliğe bağlı), han içecekleri, nesne çizimleri |
| `10_CANAVAR_BOSS/` | Bölge 1–4 yaratıkları, ana bosslar, ahır yoldaşları |
| `11_ZINDAN_ONIZLEME/` | Zindan kartları (onaylı önizlemeler 03'te) |
| `12_SAVAS_ARKA_PLANLARI/` | Gömülü savaş zeminleri, VS ve orman zeminleri (güncel savaş zeminleri 03'te) |
| `13_SANCAK_ARMA/` | Halk amblemleri, logo, flamalar, anıt bayrakları, VS arması, klan sancağı |
| `14_GORSEL_KONSEPT/` | `GORSEL_KONSEPT.md`, sanat kitabı, yerleşim kuralları |
| `15_GORSEL_HATA_RAPORLARI/` | Bu sürümün otomatik arayüz denetimi + önceki görsel denetimler |
| `16_SAVAS_KAYITLARI/` | Bu sürümden savaş kayıtları (WebM, 880×406, sessiz): iki halk × Vahran 1-1 (zafer) ve 1-25 Kurtadam boss savaşı (Elentha zafer, Kragmir yenilgi); VS → savaş (OTO, 3x) → sonuç |
| `16_EKRAN_VARLIK/` | Hangi varlığın hangi ekranda göründüğü |

`manifest.json → dosyalar[]` her görsel için: `varlik_kimligi`, `kaynak` (oyundaki yer), `olcu_px`, `sha256`, `kullanim_ekranlari` (`<halk>:<ekran>`), `modulu_yukleyen`/`kodda_gecen`, `onayli_oyundaki_hali`, `degistirildi`."""

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    P1 = gpt(); m1, z1 = bitir(P1, {'rol': 'GPT 6.2: içerik, metin, veri ve tasarım işleri', 'kurallar': KURAL, 'readme': lambda m: readme(m, 'GPT 6.2 için görev paketi: oyunun ekranları, kuralları, verisi, metinleri ve tasarım değişkenleri. Görsellerin kendisi (kolajlar hariç) Gemini paketindedir.', GPT_YAPI)})
    P2 = gemini(); m2, z2 = bitir(P2, {'rol': 'Gemini Neon: görsel denetim ve görsel işler', 'kurallar': KURAL, 'readme': lambda m: readme(m, 'Gemini Neon için görsel paket: bütün ekranlar tam çözünürlükte, onaylı sahneler ve oyundaki bütün karakter, NPC, eşya, canavar, arka plan ve arma görselleri, kullanıldıkları ekranlarla.', GEM_YAPI)})
    for z, b in z1 + z2: print(os.path.basename(z), round(b / 1e6, 1), 'MB')
    print('GPT dosya', m1['toplam_dosya'], 'Gemini dosya', m2['toplam_dosya'])
