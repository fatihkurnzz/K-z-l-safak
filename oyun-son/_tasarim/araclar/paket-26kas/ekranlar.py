# Ekran görüntülerini işler: halk başına aynı görünenleri ayıklar, tam çözünürlükte WebP'ye çevirir, kayıt ve 9+9 kolaj üretir.
# python3 -I ekranlar.py <ekran-hd> <tanim.json> <çıktı>
import os, sys, json, math, re
from PIL import Image, ImageDraw, ImageFont
SRC, TANIM, OUT = sys.argv[1:4]
T = json.load(open(TANIM, encoding='utf-8'))
HALK = {'sancak': 'elentha', 'ocak': 'kragmir'}
SEKME = {'titles': 'Unvanlar', 'dungeons': 'Zindanlar', 'events': 'Etkinlikler', 'm28': '28 gün', 'n7': '7 gün', 'c': 'Klan', 'f': 'Arkadaş', 'p': 'Özel',
         'items': 'Eşyalar', 'mobs': 'Canavarlar', 'def': 'Savunma', 'feud': 'Kan davası', 'san': 'Şan', 'shop': 'Dükkân', 'money': 'Para', 'grant': 'Bağış',
         'map': 'Harita', 'treasury': 'Hazine', 'acc': 'Hesap', 'dil': 'Dil', 'erisim': 'Erişilebilirlik', 'notif': 'Bildirim', 'ses': 'Ses', 'blocked': 'Engellenenler',
         'req': 'İstekler', 'mst': 'Ustalık', 'skill': 'Yetenek', 'unvan': 'Unvan', 'rep': 'Raporlar', 'yaz': 'Yaz', 'daily': 'Günlük', 'weekly': 'Haftalık',
         'monthly': 'Aylık', 'clan': 'Klan', 'race': 'Irk', 'ruler': 'Önder', 'feed': 'Akış', 'set': 'Ayarlar', 'clans': 'Klanlar', 'hist': 'Geçmiş', 'rew': 'Ödüller', 'card': 'Aylık kart'}
try: FONT = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 22)
except Exception: FONT = ImageFont.load_default()

def dhash(im):
    g = im.convert('L').resize((33, 16)); px = g.load(); b = 0
    for y in range(16):
        for x in range(32): b = b << 1 | (px[x, y] > px[x + 1, y])
    return b

kayit_tum = {}
for h in ['sancak', 'ocak']:
    d = os.path.join(SRC, h)
    log = [l.split('\t') for l in open(os.path.join(d, '_log.txt'), encoding='utf-8').read().split('\n') if '\t' in l]
    den = json.load(open(os.path.join(d, '_denetim.json'), encoding='utf-8'))
    dm = {x['ekran']: x for x in den['sonuc']}
    # çekim sırası = dosya zamanı
    pngs = sorted([f for f in os.listdir(d) if f.endswith('.png')], key=lambda f: os.path.getmtime(os.path.join(d, f)))
    hs, gr = {}, []
    for f in pngs:
        with Image.open(os.path.join(d, f)) as im: hs[f] = dhash(im)
        for g in gr:
            if bin(hs[g[0]] ^ hs[f]).count("1") <= 4: g.append(f); break
        else: gr.append([f])
    od = os.path.join(OUT, HALK[h]); os.makedirs(od, exist_ok=True)
    kay = []
    for g in gr:
        f = g[0]; kim = f[:-4]; ekran = kim[2:] if kim.startswith('C-') else kim
        base, _, sek = ekran.partition('~')
        tk = re.sub(r'-(warrior|rogue|mage|priest)-(f|m)$', '', base) if base.startswith('A05') else base
        ad, islev = T.get(tk, T.get(base, [base, '']))
        if base.startswith('A05'):
            m = re.search(r'-(warrior|rogue|mage|priest)-(f|m)$', base); ad = f"{ad}: {m.group(1)} / {'kadın' if m.group(2)=='f' else 'erkek'}"
        if sek: ad = f"{ad} › {SEKME.get(sek, sek)}"
        dx = dm.get(base, {}); sx = dx.get('sekmeler', {}).get(sek, {}) if sek else dx
        with Image.open(os.path.join(d, f)) as im:
            W, H = im.size; im.convert('RGB').save(os.path.join(od, ekran + '.webp'), 'WEBP', quality=92, method=6)
        kay.append({'ekran_kimligi': ekran, 'halk': HALK[h], 'halk_kodu': h, 'dosya': f'02_EKRANLAR/{HALK[h]}/{ekran}.webp', 'olcu_px': [W, H],
                    'mantiksal_olcu': [880, 406], 'dpr': 2.66, 'ad': ad, 'islev': islev,
                    'acilis_eylemi': (f"ACT.{base}()" if kim.startswith('C-') else 'akış adımı (bkz. çekim betiği)') + (f" → ACT.tab({{id:'{sek}'}})" if sek else ''),
                    'pencere_basligi': sx.get('baslik') or dx.get('baslik'), 'tur': dx.get('tur'), 'sekmeler': dx.get('sekme', []) if not sek else None,
                    'ayni_goruntu': [x[:-4].replace('C-', '', 1) for x in g[1:]],
                    'otomatik_denetim': {k: sx.get(k, []) for k in ['kesik', 'tasma', 'kucuk', 'cakisma']}})
    acilmayan = [{'ekran': l[0].replace('C-', ''), 'durum': l[1]} for l in log if 'açılmadı' in l[1] or 'zaman' in l[1] or 'HAYALET' in l[1]]
    kayit_tum[HALK[h]] = {'ekranlar': kay, 'cekilen_goruntu': len(pngs), 'ayri_ekran': len(kay), 'acilmayan_veya_sorunlu': acilmayan, 'js_hatalari': den.get('err', [])}
    # kolaj: 9 adet
    n = len(kay); per = math.ceil(n / 9); cols = 3; tw, th, lab = 780, 360, 34
    for k in range(9):
        part = kay[k * per:(k + 1) * per]
        if not part: continue
        rows = math.ceil(len(part) / cols)
        C = Image.new('RGB', (cols * tw + (cols + 1) * 8, rows * (th + lab) + (rows + 1) * 8), (14, 11, 16)); D = ImageDraw.Draw(C)
        for i, e in enumerate(part):
            x = 8 + (i % cols) * (tw + 8); y = 8 + (i // cols) * (th + lab + 8)
            with Image.open(os.path.join(od, e['ekran_kimligi'] + '.webp')) as im: C.paste(im.resize((tw, th), Image.LANCZOS), (x, y + lab))
            D.text((x + 6, y + 5), f"{e['ekran_kimligi']} · {e['ad']}"[:62], fill=(233, 225, 211), font=FONT)
        C.save(os.path.join(OUT, f'KOLAJ_{HALK[h]}_{k+1:02d}.webp'), 'WEBP', quality=90, method=6)
        for e in part: e['kolaj'] = f'01_KOLAJLAR/KOLAJ_{HALK[h]}_{k+1:02d}.webp'
json.dump(kayit_tum, open(os.path.join(OUT, '_ekran_kaydi.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
for h, v in kayit_tum.items(): print(h, 'çekilen', v['cekilen_goruntu'], 'ayrı', v['ayri_ekran'], 'sorunlu', len(v['acilmayan_veya_sorunlu']))
ids = set(e['ekran_kimligi'] for v in kayit_tum.values() for e in v['ekranlar'])
print('iki halkta ayrı ekran kimliği (birleşik):', len(ids))
