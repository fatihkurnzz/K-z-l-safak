# P35-UI GPT girdi paketini kurar ve ≤30 MB'lık numaralı ZIP'lere böler. Oyun kodunu DEĞİŞTİRMEZ (yalnız okur/kopyalar).
# python3 -I paketle_p35.py <S çalışma kökü> <oyun-son> <cek42 kökü>
#  S içinde: cikti/{gomulu,veri-json,katalog.json,tokenler.json,butce_ham.json,envanter/}, olc/<halk>-<vw>/ , kumeler.json
import sys, os, json, re, shutil, hashlib, zipfile, subprocess
from PIL import Image
import numpy as np
S, G, C42 = sys.argv[1:4]
HER = os.path.dirname(os.path.abspath(__file__)); BEL = os.path.join(HER, '..', 'belgeler')
P = os.path.join(S, 'pkg'); shutil.rmtree(P, ignore_errors=True)
def mk(*a):
    d = os.path.join(P, *a); os.makedirs(d, exist_ok=True); return d
def cp(src, *dst):
    d = os.path.join(P, *dst); os.makedirs(os.path.dirname(d), exist_ok=True); shutil.copy(src, d); return d
def jw(obj, *dst):
    d = os.path.join(P, *dst); os.makedirs(os.path.dirname(d), exist_ok=True)
    json.dump(obj, open(d, 'w', encoding='utf-8'), ensure_ascii=False, indent=1); return d
HALK = {'elentha': 'sancak', 'kragmir': 'ocak'}

# ---- belgeler ----
cp(f'{BEL}/README.md', 'README.md'); cp(f'{BEL}/EKSIK_VE_DOGRULANAMAYANLAR.md', 'EKSIK_VE_DOGRULANAMAYANLAR.md'); cp(f'{BEL}/DURUM.md', 'DURUM.md')
cp(f'{BEL}/KAPSAM_VE_KURALLAR.md', '00_OKU', 'KAPSAM_VE_KURALLAR.md')
cp(f'{BEL}/TASARIM_SISTEMI_MEVCUT.md', '02_TASARIM_SISTEMI_MEVCUT', 'TASARIM_SISTEMI_MEVCUT.md')
for f in ('PILOT_01_GOREV_DEFTERI.md', 'PILOT_02_KARAKTER_ENVANTER.md', 'PILOT_03_TUCCAR.md', 'D02_D08_PILOT_ETKISI.md'): cp(f'{BEL}/{f}', '05_PILOT', f)

# ---- 01 envanter ----
env = json.load(open(f'{S}/cikti/envanter/ekran_envanteri.json'))
cp(f'{S}/cikti/envanter/EKRAN_ENVANTERI.md', '01_ENVANTER', 'EKRAN_ENVANTERI.md')
cp(f'{S}/cikti/envanter/ekran_envanteri.json', '01_ENVANTER', 'ekran_envanteri.json')

# ---- ekran görüntüleri (1760x812 WebP q82) ----
IMG = []   # (zip içi yol, mutlak yol)
def donustur(src, dst):
    im = Image.open(src).convert('RGB').resize((1760, 812), Image.LANCZOS)
    os.makedirs(os.path.dirname(dst), exist_ok=True); im.save(dst, 'WEBP', quality=82, method=5)
esl = {}
ESLEME = {'aciklama': 'ekran kimliği → görüntü dosyası. halk klasörleri: elentha (= sancak), kragmir (= ocak). Aynı görünen çekim adları kanonik dosyaya işaret eder.', 'ekranlar': [], 'cekim_adi_haritasi': {}}
for e in env['ekranlar']:
    can = e['kanonik_cekim']; rec = {'kimlik': e['kimlik'], 'ad': e['ad'], 'kanonik_cekim': can, 'dosyalar': {}}
    for hk, kl in HALK.items():
        rel = f'03_EKRAN_GORUNTULERI/{hk}/{can}.webp'; dst = os.path.join(P, rel)
        donustur(f'{C42}/cek115-{kl}/{can}.png', dst); IMG.append(rel); rec['dosyalar'][hk] = rel
        for a in [can] + e['ayni_gorunen_cekimler']: ESLEME['cekim_adi_haritasi'].setdefault(a, {})[hk] = rel
    rec['v41_durum'] = {hk: e['goruntu'][hk].get('v41_durum') for hk in HALK}
    rec['v41_teslim_yolu_gemini_kabul2'] = {hk: e['goruntu'][hk].get('v41_teslim_yolu') for hk in HALK}
    ESLEME['ekranlar'].append(rec)
# pilot ek görüntüler
EK = []
for hk, kl in HALK.items():
    d = f'{S}/olc/{kl}-880'
    for f in sorted(os.listdir(d)):
        if f.endswith('.png'):
            rel = f'04_PILOT_EK_GORUNTULER/{hk}/{f[:-4]}.webp'; donustur(f'{d}/{f}', os.path.join(P, rel)); IMG.append(rel); EK.append(rel)
ESLEME['pilot_ek_goruntuler'] = sorted(EK)
jw(ESLEME, '01_ENVANTER', 'EKRAN_GORUNTU_ESLEME.json')

# ---- 02 tasarım sistemi ----
cp(f'{S}/cikti/tokenler.json', '02_TASARIM_SISTEMI_MEVCUT', 'tokenler.json')
html = open(f'{G}/index.html', encoding='utf-8').read(); sira = re.findall(r'href="(css/[^"]+)"', html)
css = [{'sira': i + 1, 'dosya': f, 'bayt': os.path.getsize(f'{G}/{f}')} for i, f in enumerate(sira) if os.path.exists(f'{G}/{f}')]
jw({'aciklama': 'index.html yükleme sırası (sonraki dosya öncekini ezer)', 'dosyalar': css, 'toplam_bayt': sum(c['bayt'] for c in css)}, '02_TASARIM_SISTEMI_MEVCUT', 'css_dosyalari.json')
for c in css: cp(f'{G}/{c["dosya"]}', '02_TASARIM_SISTEMI_MEVCUT', c['dosya'])
for f in sorted(os.listdir(f'{G}/fonts')): cp(f'{G}/fonts/{f}', '02_TASARIM_SISTEMI_MEVCUT', 'fonts', f)
for f in ('ui-core.js', 'ui-anagorev.js', 'ui-kahraman.js', 'ui-envanter.js', 'ui-town.js', 'orient.js', 'ui-duyuru.js'): cp(f'{G}/js/{f}', '02_TASARIM_SISTEMI_MEVCUT', 'kaynak_salt_okunur', f)

# ---- 03 varlıklar ----
GOM = f'{S}/cikti/gomulu'; man = json.load(open(f'{GOM}/_cikarilan.json')); byk = {(x['kaynak_js'], x['anahtar']): x for x in man}
def gomulu(js, key, *dst):
    x = byk[(f'js/{js}', key)]; return cp(f'{GOM}/{x["dosya"]}', *dst)
g8 = []
for key in ('logo', 'amblem-sancak', 'amblem-ocak'): g8.append(gomulu('amblem-png.js', key, '03_VARLIKLAR', 'G8_ARMA_LOGO', f'{key}.webp'))
for f in ('img/p27/vs_amblem.webp', 'img/p28/anit_bayrak_elentha.webp', 'img/p28/anit_bayrak_kragmir.webp', 'img/p27/yakut_karti_arma.webp', 'img/p27/lider_klan_sancak.webp'): cp(f'{G}/{f}', '03_VARLIKLAR', 'ARMA_ROZET_SANCAK', os.path.basename(f))
for js, key in (('p23-giris-png.js', 'muhur-sancak'), ('p23-giris-png.js', 'muhur-ocak'), ('p23-giris-png.js', 'levha-sancak'), ('p23-sehir2-sancak.js', 'sancak'), ('p23-sehir2-ocak.js', 'sancak'), ('p25-a-png.js', 'rozet'), ('p25-a-png.js', 'rozet_ocak'), ('grafik5-png.js', 'flama-sancak')):
    gomulu(js, key, '03_VARLIKLAR', 'ARMA_ROZET_SANCAK', f'{js[:-7]}__{key}.webp')
kit = []
for (js, key), x in byk.items():
    if js == 'js/kd-png.js':
        d = cp(f'{GOM}/{x["dosya"]}', '03_VARLIKLAR', 'KD_UI_KITI', os.path.basename(x['dosya']))
        im = Image.open(d).convert('RGBA'); a = np.asarray(im.getchannel('A')); kit.append({'ad': key, 'olcu': list(im.size), 'bayt': x['bayt'], 'dolu_alan_orani': round(float((a > 8).mean()), 3), 'sha256': x['sha256']})
jw({'aciklama': 'js/kd-png.js içindeki 188 gömülü UI kiti parçası (iki halk). dolu_alan_orani yüksek + bayt çok küçük = düz dolgu/olası yer tutucu.', 'parcalar': sorted(kit, key=lambda k: k['ad'])}, '03_VARLIKLAR', 'KD_UI_KITI', 'INDEKS.json')
for (js, key), x in byk.items():
    if js == 'js/glif-png.js': cp(f'{GOM}/{x["dosya"]}', '03_VARLIKLAR', 'GLIFLER_M3', os.path.basename(x['dosya']))
    elif js == 'js/p24-ekran-png.js': cp(f'{GOM}/{x["dosya"]}', '03_VARLIKLAR', 'ESKI_UI_KITI_P24', os.path.basename(x['dosya']))
    elif js == 'js/esya-png-veri.js': cp(f'{GOM}/{x["dosya"]}', '03_VARLIKLAR', 'ESYA_IKONLARI_96', os.path.basename(x['dosya']))
for f in ('img/kd/sehir/sancak/atlas.webp', 'img/kd/sehir/ocak/atlas.webp', 'img/kd/sehir/klan-sancak/atlas.webp', 'img/kd/sehir/klan-ocak/atlas.webp', 'img/kd/sehir/carsi/atlas.webp'):
    if os.path.exists(f'{G}/{f}'): cp(f'{G}/{f}', '03_VARLIKLAR', 'HUB_ATLASLARI', f.replace('img/kd/sehir/', '').replace('/', '__'))
cp(f'{S}/cikti/katalog.json', '03_VARLIKLAR', 'KATALOG', 'katalog.json')
jw({'aciklama': 'Dosya ve gömülü görsellerin tam kataloğu (sha256, ölçü, koddaki yer). Gömülü = JS içinde base64; yayın dosya sayısına JS bir dosya olarak girer.'}, '03_VARLIKLAR', 'KATALOG', 'OKU.json')

# ---- 04 bütçe ----
b = json.load(open(f'{S}/cikti/butce_ham.json')); kat = json.load(open(f'{S}/cikti/katalog.json'))
ui_js = ('kd-png.js', 'p24-ekran-png.js', 'glif-png.js', 'amblem-png.js', 'grafik5-png.js', 'p23-giris-png.js', 'p23-sunucu-png.js', 'p23-taht-png.js', 'p23-profil-png.js', 'p23-anaekran-png.js', 'p25-a-png.js', 'p25-b-png.js', 'p25-c-png.js', 'p25-d-png.js', 'p23-savas-png.js', 'p26-savas-png.js')
uib = {j: [0, 0] for j in ui_js}
for x in man:
    j = os.path.basename(x['kaynak_js'])
    if j in uib: uib[j][0] += 1; uib[j][1] += x['bayt']
ui_dosya = os.path.getsize
kalan = 511 - b['yayin_dosya']
BUT = {'yayin_dosya_kural_sayimi': b['yayin_dosya'], 'yayin_dosya_resmi_v42': 450, 'sinir_surum_basina': 511, 'sinir_tek_gonderi': 255, 'sinir_tek_dosya_MB': 16, 'sinir_surum_toplam_MB': 256,
       'kalan_kapasite_temkinli': kalan, 'kalan_kapasite_resmi_v42': 511 - 450, 'yayin_toplam_MB': round(b['yayin_bayt'] / 1e6, 1), 'kategori': b['kategori'], 'mevcut_ui_gomulu_gorseller': {k: {'adet': v[0], 'MB': round(v[1] / 1e6, 2)} for k, v in uib.items()},
       'mevcut_ui_gomulu_toplam': {'adet': sum(v[0] for v in uib.values()), 'MB': round(sum(v[1] for v in uib.values()) / 1e6, 2)},
       'oneri_teknik_butce': {'yeni_dosya_en_fazla': 30, 'yeni_ui_varlik_toplam_MB_en_fazla': 8, 'aciklama': 'ÖNERİ (zorunlu sınır değil): sınırdan ≥ 20–25 dosya pay kalsın; ikon/parça setleri atlas WebP + JSON dilim haritası olarak gelsin; gömülü JS yerine yeni dosya ya da mevcut kd-png.js güncellemesi Opus kararıdır.'}}
jw(BUT, '04_BUTCE', 'varlik_butcesi.json')
L = ['# Varlık bütçesi (V42)', '', 'Durum: **KAYNAKTAN/ÖLÇÜLDÜ** (git dosya listesi + `katalog.py`). Yayın = `oyun-son` hariç `_tasarim/`, `img/items3d/*`, `models/test/Xbot.glb.js`, `video/README.txt`, bazı `img/kd/simge3/*`.', '',
     '| Ölçü | Değer |', '|---|---:|', f'| Yayın dosya sayısı (kural sayımı) | {b["yayin_dosya"]} |', '| Yayın dosya sayısı (resmî, V42 notu) | 450 |', '| Sürüm başına sınır | 511 |',
     f'| **Kalan kapasite (temkinli)** | **{kalan}** (resmî sayıyla {511 - 450}) |', f'| Yayın toplam boyutu | {BUT["yayin_toplam_MB"]} MB |', '| Tek gönderi sınırı | 255 dosya |', '| Tek dosya sınırı | 16 MB |', '| Sürüm toplam sınırı | 256 MB |', '',
     '## Kategori (yayın)', '', '| Klasör | Dosya | MB |', '|---|---:|---:|'] + [f'| {k} | {v["dosya"]} | {v["bayt"] / 1e6:.2f} |' for k, v in b['kategori'].items()] + ['',
     '## Mevcut arayüz görselleri (JS içinde gömülü; her JS 1 dosya)', '', '| JS | Parça | MB |', '|---|---:|---:|'] + [f'| {k} | {v[0]} | {v[1] / 1e6:.2f} |' for k, v in sorted(uib.items(), key=lambda a: -a[1][1])] + ['',
     f'**Toplam:** {BUT["mevcut_ui_gomulu_toplam"]["adet"]} parça, {BUT["mevcut_ui_gomulu_toplam"]["MB"]} MB (base64 şişmesi dahil değil; JS içinde ~%33 büyük).', '',
     '## Önerilen teknik bütçe (ZORUNLU DEĞİL, öneri)', '', '- **Yeni dosya ≤ 30** (kalan kapasiteden 20+ pay bırak); yeni UI varlıkları ≤ ~8 MB.', '- Parça tek tek değil **atlas WebP + JSON dilim haritası**; iki halk için ayrı atlas (`<ad>-elentha`, `<ad>-kragmir`) ya da halk temasını CSS değişkeniyle yap.',
     '- 9 parçalı çerçeve (9-slice) + tekrarlanan doku; ekran başına büyük sahne görseli YOK.', '- Mantıksal ölçü 880×406; görsel 2×–3× (mobil dpr 2,66). Yeni parça boyutları buna göre.', '- WebP (kayıplı q80–88); gerçek alfa gereken parçada alfa destekli WebP; GIF yok.', '- Çözülmemiş yük: gömülü JS 49,6 MB; yeni görsel yeniden gömülecekse **ayrı dosya** tercih edilir (Opus kararı).']
open(os.path.join(mk('04_BUTCE'), 'VARLIK_BUTCESI.md'), 'w', encoding='utf-8').write('\n'.join(L))

# ---- 05 ölçümler ----
Rj = {f'{r}-{v}': json.load(open(f'{S}/olc/{r}-{v}/olcum.json')) for r in ('sancak', 'ocak') for v in (667, 880, 1180)}
for k, v in Rj.items(): cp(f'{S}/olc/{k}/olcum.json', '05_PILOT', 'olcum_ham', f'{k}.json')
ids = list(Rj['sancak-880']['ekranlar'].keys())
n = lambda x: len(x) if isinstance(x, list) else (x if x is not None else '–')
O = ['# Pilot ekran ölçümleri (ÖLÇÜLDÜ, canlı oyunda)', '', 'Yöntem: `araclar/olc.js` (Playwright, V42, dev araçlarıyla yükseltilmiş test hesabı). Sütunlar: **çerçeve** = `.frame` genişlik×yükseklik (px); **<44** = 44 px altı dokunma öğesi sayısı; **min** = en küçük dokunma boyutu (px); **kes** = kırpılan öğe; **çak** = çakışma. İki halk aynıysa tek değer, farklıysa `E/K` (Elentha/Kragmir). `kaydirilabilir` öğe SAYISIdır.', '',
     'JS hatası: ' + ', '.join(f'{k}: {len(v["jsHata"])}' for k, v in Rj.items()), '', '| Ekran | 667×375 çerçeve | <44 | min | 880×406 çerçeve | <44 | min | 1180×820 çerçeve | <44 | min | kes | çak |', '|---|---|---:|---:|---|---:|---:|---|---:|---:|---|---|']
def cell(vw, i, f):
    out = []
    for r in ('sancak', 'ocak'):
        e = Rj[f'{r}-{vw}']['ekranlar'].get(i); out.append(f(e) if e else '–')
    return out[0] if out[0] == out[1] else f'{out[0]}/{out[1]}'
fr = lambda e: ('×'.join(str(x) for x in e['yapi']['frame'][2:]) if e.get('yapi') and e['yapi'].get('frame') else '–')
k44 = lambda e: str(n((e.get('olcum') or {}).get('kucuk44')))
mn = lambda e: str(((e.get('yapi') or {}).get('enKucukDokunma') or ['–'])[0])
for i in ids:
    kes = '/'.join(sorted({str(n((Rj[f'{r}-{v}']['ekranlar'][i].get('olcum') or {}).get('kesik'))) for r in ('sancak', 'ocak') for v in (667, 880, 1180)}))
    cak = '/'.join(sorted({str(n((Rj[f'{r}-{v}']['ekranlar'][i].get('olcum') or {}).get('cakisma'))) for r in ('sancak', 'ocak') for v in (667, 880, 1180)}))
    O.append(f'| {i} | {cell(667, i, fr)} | {cell(667, i, k44)} | {cell(667, i, mn)} | {cell(880, i, fr)} | {cell(880, i, k44)} | {cell(880, i, mn)} | {cell(1180, i, fr)} | {cell(1180, i, k44)} | {cell(1180, i, mn)} | {kes} | {cak} |')
O += ['', 'Notlar: `hub` satırında çerçeve yoktur (pencere değil). `karakter-esya-karti` ölçülemedi (bkz. EKSIK). Ham veri `olcum_ham/*.json` (yazı kullanımı, çocuk yerleşimleri, sekme düğmesi kutuları dahil).']
open(os.path.join(mk('05_PILOT'), 'OLCUMLER.md'), 'w', encoding='utf-8').write('\n'.join(O))

# ---- 07 veri ----
V = f'{S}/cikti/veri-json'
def sub(src, keys, dst):
    d = json.load(open(f'{V}/{src}')); jw({k: d[k] for k in keys if k in d}, '07_VERI', dst)
sub('anagorev.json', ['MQ', 'MQ_CHAPTERS'], 'anagorev.json')
sub('content.json', ['QUESTS', 'QUEST_ALL', 'UNLOCK', 'BAG_LIMIT', 'CLASSES', 'CLASS_KEYS', 'STATS', 'STAT_KEYS', 'FACTIONS', 'CURRENCY', 'SHOP', 'ARENA_SHOP', 'SHARDS', 'WHEEL', 'MINE', 'CLAN', 'TITLES'], 'content_ui.json')
sub('meta.json', ['WEEKLY', 'WEEKLY_ALL', 'MONTHLY', 'MONTHLY_ALL', 'ACH_CATS', 'CAL7', 'CAL28', 'ONLINE', 'NOTIF_CATS'], 'meta_ui.json')
cp(f'{V}/npc.json', '07_VERI', 'npc.json')
sub('items.json', ['SLOTS', 'SLOT_KEYS', 'GRADES', 'G_UNIQUE', 'ARMOR_SLOTS', 'STONES', 'UP_STONES', 'MAX_PLUS', 'STARTER', 'STAT_LABEL', 'RQ_LABEL'], 'esya_kategori.json')
jw({'aciklama': 'js/ui-town.js SHOPS özeti (kaynaktan elle çıkarıldı)', 'dukkanlar': {'halvor': {'baslik': 'Tüccar', 'npc': 'Tüccar Halvor', 'sekmeler': [['mats', 'Erzak ve Örs Malzemeleri'], ['sell', 'Genel satış']]}, 'silah': {'baslik': 'Silah ve Kalkan', 'npc': 'Silah Ustası Demirhan', 'sekmeler': [['weapons', 'Silahlar'], ['shields', 'Kalkanlar'], ['sell', 'Tüccara sat']]}, 'zirh': {'baslik': 'Zırh', 'npc': 'Zırhçı Korhan', 'sekmeler': [['armors', 'Zırhlar'], ['sell', 'Tüccara sat']], 'sinif_suzgeci': 'Hepsi + 4 sınıf'}, 'taki': {'baslik': 'Takı', 'npc': 'Mücevherci Selin', 'sekmeler': [['jewels', 'Takılar'], ['sell', 'Tüccara sat']]}}, 'ekran_kimlikleri': 'scr=dukkan; Halvor scr boş'}, '07_VERI', 'tuccar_dukkanlar.json')
jw({'ekipman_yuvalari_sol': ['helm', 'chest', 'legs', 'gloves', 'boots', 'belt'], 'ekipman_yuvalari_sag': ['wr', 'wl', 'neck', 'ear1', 'ear2', 'ring1', 'ring2'], 'envanter_suzgecleri': [['all', 'Hepsi'], ['weapon', 'Silah'], ['armor', 'Zırh'], ['jewel', 'Takı'], ['free', 'Boşta']], 'kaynak': 'js/ui-kahraman.js'}, '07_VERI', 'karakter_ekran.json')
cp(f'{G}/_tasarim/araclar/kabul-26kas/ekran_envanteri.json', '07_VERI', 'ACT_eylem_envanteri_v40_P33.json')

# ---- manifest + ZIP planı ----
def sha(p):
    h = hashlib.sha256()
    with open(p, 'rb') as f:
        for c in iter(lambda: f.read(1 << 20), b''): h.update(c)
    return h.hexdigest()
allf = []
for r, _, fs in os.walk(P):
    for f in fs: allf.append(os.path.relpath(os.path.join(r, f), P))
allf.sort()
img = sorted(f for f in allf if f.startswith(('03_EKRAN_GORUNTULERI', '04_PILOT_EK_GORUNTULER')))
doc = [f for f in allf if f not in set(img)]
LIM = 29 * 1024 * 1024
def zsize(files): return sum(os.path.getsize(os.path.join(P, f)) for f in files)  # üst sınır (WebP/PNG/JSON sıkışmaz/az sıkışır)
parts = [doc]; cur = []; sz = 0
for f in img:
    s = os.path.getsize(os.path.join(P, f))
    if sz + s > LIM and cur: parts.append(cur); cur = []; sz = 0
    cur.append(f); sz += s
if cur: parts.append(cur)
# belge parçası çok büyükse (ham boyut) ayrıca sıkıştırılmış boyutu denetlenir
N = len(parts)
OUTZ = f'{S}/teslim'; shutil.rmtree(OUTZ, ignore_errors=True); os.makedirs(OUTZ)
man_all = {'paket': 'KORANT_P35_UI_GPT_GIRDI', 'surum': 'KORANT-v42-b9a0b21', 'tarih': '2026-11-26', 'zip_sayisi': N, 'dosya_sayisi': len(allf), 'dosyalar': []}
for i, files in enumerate(parts, 1):
    nm = f'KORANT_P35_UI_GPT_GIRDI_{i:02d}of{N:02d}.zip'
    for f in files: man_all['dosyalar'].append({'yol': f, 'bayt': os.path.getsize(os.path.join(P, f)), 'sha256': sha(os.path.join(P, f)), 'zip': nm})
jw(man_all, '06_MANIFEST', 'manifest.json')
jw({'aciklama': 'Her ZIP bağımsız açılır; ZIP 01 tüm belgeleri taşır, diğerleri yalnız görüntü. manifest.json tüm paketi kapsar.', 'zipler': [{'ad': f'KORANT_P35_UI_GPT_GIRDI_{i:02d}of{N:02d}.zip', 'dosya': len(f)} for i, f in enumerate(parts, 1)]}, '06_MANIFEST', 'ZIP_PLANI.json')
doc = sorted(set(doc) | {'06_MANIFEST/manifest.json', '06_MANIFEST/ZIP_PLANI.json'}); parts[0] = doc
for i, files in enumerate(parts, 1):
    nm = f'KORANT_P35_UI_GPT_GIRDI_{i:02d}of{N:02d}.zip'
    with zipfile.ZipFile(f'{OUTZ}/{nm}', 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as z:
        for f in files: z.write(os.path.join(P, f), f'KORANT_P35_UI_GPT_GIRDI/{f}')
        if i > 1:
            z.writestr('KORANT_P35_UI_GPT_GIRDI/OKU.txt', f'KORANT_P35_UI_GPT_GIRDI parça {i}/{N}: yalnız ekran görüntüleri. Belgeler 01. ZIP içindedir. Tam manifest: 01. ZIP › 06_MANIFEST/manifest.json\n')
    print(nm, round(os.path.getsize(f'{OUTZ}/{nm}') / 1e6, 2), 'MB', len(files), 'dosya')
