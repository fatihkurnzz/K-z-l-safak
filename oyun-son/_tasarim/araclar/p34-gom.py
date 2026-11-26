#!/usr/bin/env python3
# P34 teslimlerini oyuna gömer (26 Kas, 19-20. oturum). Kullanım (cwd fark etmez):
#   python3 -I p34-gom.py <GPT teslim klasörü> <Gemini teslim klasörü (P34-05/06/07 açılmış)> <oyun-son>
# Yaptıkları (OTOMATİK dosyalar elle düzenlenmez; bu aracı yeniden çalıştır):
#  P34-01 sahneler/zafer_aniti.webp  ← GPT 2048×868 (aynı kadraj; kullanıcı Gemini 1600×678 sürümünü KABUL ETMEDİ)
#  P34-08 js/karakter-png-veri.js yuz.ocak.m.4 ← GPT Kragmir erkek 5. yüz (koyu zemin #24160e, 176×176; diğer yuvalar gibi)
#  K-2    js/b2d-sancak.js savasci-kadin.buyu ← GPT düzeltilmiş büyü pozu (1086×1448 → 384×512)
#  P34-09 js/gorsel-png.js bran, bran-yuz, nessa, nessa-yuz ← GPT G4 biçimi portreler
#  P34-06 js/b2d-y1/y3/y4/yb.js <tür>.saldiri / .vurulma ← Gemini (1024 → 384); HARİÇ: lamia, snake_queen, dragon_lightning (kimlik sapması)
#  P34-07 js/b2d-y4/yb.js <boss>.bekleme2/saldiri2/vurulma2 ← Gemini (A+B 1536 → 448, C ejder 1024 → 384)
#  P34-05 js/npc-kare-png.js (YENİ) ← Gemini göz/ağız kareleri: yalnız değişen bölgenin kırpımı + konumu (528×704 tuvalinde)
#  P34-02/03/04 js/p34-katman-png.js (YENİ) ← GPT sahne hareket katmanları: eleman başına yatay kare şeridi + yerleşim
import sys, os, io, json, base64, glob
import numpy as np
from PIL import Image

GPT, GEM, G = sys.argv[1], sys.argv[2], sys.argv[3]
HARIC_P34_06 = {'lamia', 'snake_queen', 'dragon_lightning'}


def webp_b64(im, q=80, aq=90, lossless=False):
    b = io.BytesIO()
    im.save(b, 'WEBP', quality=q, method=6, alpha_quality=aq, lossless=lossless)
    return base64.b64encode(b.getvalue()).decode()


def b2d_oku(p):
    s = open(p, encoding='utf-8').read()
    i = s.index('export const B = ') + len('export const B = ')
    j = s.rindex('};') + 1
    return s[:i], json.loads(s[i:j]), s[j:]


def b2d_yaz(p, bas, B, son):
    open(p, 'w', encoding='utf-8').write(bas + json.dumps(B, ensure_ascii=False, separators=(',', ':')) + son)


def satir_degistir(p, anahtar, deger, ekle_sonra=None):
    """'"anahtar":"…",' satırını değiştirir; yoksa ekle_sonra satırından sonra ekler."""
    L = open(p, encoding='utf-8').read().split('\n')
    yeni = f'"{anahtar}":"{deger}",'
    for i, l in enumerate(L):
        if l.startswith(f'"{anahtar}":"'):
            L[i] = yeni if l.endswith(',') else yeni[:-1]
            break
    else:
        k = next(i for i, l in enumerate(L) if l.strip() == ekle_sonra)
        L.insert(k + 1, yeni)
    open(p, 'w', encoding='utf-8').write('\n'.join(L))


rapor = {}
# ---- P34-01
im = Image.open(f'{GPT}/P34-01/zafer_aniti.webp').convert('RGB')
assert im.size == (2048, 868), im.size
im.save(f'{G}/sahneler/zafer_aniti.webp', 'WEBP', quality=84, method=6)
rapor['P34-01'] = dict(hedef='sahneler/zafer_aniti.webp', olcu=list(im.size), bayt=os.path.getsize(f'{G}/sahneler/zafer_aniti.webp'))

# ---- P34-08
y = Image.open(f'{GPT}/P34-08/kragmir_erkek_yuz_5.png').convert('RGBA')
z = Image.new('RGBA', y.size, (36, 22, 14, 255)); z.alpha_composite(y)
satir_degistir(f'{G}/js/karakter-png-veri.js', 'yuz.ocak.m.4', webp_b64(z.convert('RGB').resize((176, 176), Image.LANCZOS), 82))
rapor['P34-08'] = dict(hedef='js/karakter-png-veri.js › yuz.ocak.m.4', olcu=[176, 176])

# ---- K-2
p = f'{G}/js/b2d-sancak.js'; bas, B, son = b2d_oku(p)
k2 = Image.open(f'{GPT}/K-2/kahraman-sancak-savasci-kadin-buyu.png').convert('RGBA')
assert k2.size == (1086, 1448)
B['savasci-kadin']['buyu'] = webp_b64(k2.resize((384, 512), Image.LANCZOS), 80, 90)
b2d_yaz(p, bas, B, son)
rapor['K-2'] = dict(hedef='js/b2d-sancak.js › savasci-kadin.buyu', olcu=[384, 512])

# ---- P34-09
for k in ('bran', 'bran-yuz', 'nessa', 'nessa-yuz'):
    im = Image.open(f'{GPT}/P34-09/{k}.webp').convert('RGBA')
    satir_degistir(f'{G}/js/gorsel-png.js', k, webp_b64(im, 84, 90), ekle_sonra='const D = {')
rapor['P34-09'] = dict(hedef='js/gorsel-png.js › bran, bran-yuz, nessa, nessa-yuz')

# ---- P34-06 / P34-07 (b2d bölge dosyaları)
DOS = {d: f'{G}/js/b2d-{d}.js' for d in ('y1', 'y2', 'y3', 'y4', 'yb')}
OKU = {d: b2d_oku(p) for d, p in DOS.items()}
def nerede(art):
    for d, (_, B, _) in OKU.items():
        if art in B: return d
    raise KeyError(art)
r6, r7 = [], []
for f in sorted(glob.glob(f'{GEM}/P34-06/*.png')):
    art, poz = os.path.basename(f)[:-4].split('__')
    if art in HARIC_P34_06: r6.append(dict(dosya=os.path.basename(f), durum='HARIC_kimlik_sapmasi')); continue
    im = Image.open(f).convert('RGBA'); assert im.size == (1024, 1024)
    d = nerede(art); OKU[d][1][art][poz] = webp_b64(im.resize((384, 384), Image.LANCZOS), 78, 85)
    r6.append(dict(dosya=os.path.basename(f), hedef=f'js/b2d-{d}.js › {art}.{poz}', olcu=[384, 384]))
for f in sorted(glob.glob(f'{GEM}/P34-07/*.png')):
    art, poz = os.path.basename(f)[:-4].split('__')
    im = Image.open(f).convert('RGBA')
    hed = 448 if im.size == (1536, 1536) else 384
    assert im.size in ((1536, 1536), (1024, 1024))
    d = nerede(art); eski = poz in OKU[d][1][art]
    OKU[d][1][art][poz] = webp_b64(im.resize((hed, hed), Image.LANCZOS), 78, 85)
    r7.append(dict(dosya=os.path.basename(f), hedef=f'js/b2d-{d}.js › {art}.{poz}', olcu=[hed, hed], onceki='degisti' if eski else 'yeni'))
for d, (bas, B, son) in OKU.items(): b2d_yaz(DOS[d], bas, B, son)
rapor['P34-06'] = r6; rapor['P34-07'] = r7

# ---- P34-05 NPC kareleri (kırpım)
GOR = {}
src = open(f'{G}/js/gorsel-png.js', encoding='utf-8').read().split('\n')
for l in src:
    if l.startswith('"') and '":"' in l:
        k, v = l.split('":"', 1); GOR[k[1:]] = v.rstrip(',').rstrip('"')
K = {}; r5 = []
for f in sorted(glob.glob(f'{GEM}/P34-05/*.png')):
    kim, kare = os.path.basename(f)[:-4].split('_', 1)
    o = Image.open(io.BytesIO(base64.b64decode(GOR[kim]))).convert('RGBA')
    a = Image.open(f).convert('RGBA'); assert a.size == o.size == (528, 704)
    A, O = np.array(a).astype(int), np.array(o).astype(int)
    m = np.abs(A - O).max(2) > 6
    ys, xs = np.nonzero(m)
    x0, y0, x1, y1 = max(0, xs.min() - 4), max(0, ys.min() - 4), min(528, xs.max() + 5), min(704, ys.max() + 5)
    K.setdefault(kim, {})[kare] = [int(x0), int(y0), int(x1 - x0), int(y1 - y0), webp_b64(a.crop((x0, y0, x1, y1)), 90, 100)]
    r5.append(dict(dosya=os.path.basename(f), kirpim=[int(x0), int(y0), int(x1 - x0), int(y1 - y0)]))
with open(f'{G}/js/npc-kare-png.js', 'w', encoding='utf-8') as fo:
    fo.write('// OTOMATİK (_tasarim/araclar/p34-gom.py) — elle düzenleme. P34-05 (Gemini): G4 NPC portrelerinin göz kırpma / konuşma kareleri.\n'
             '// kim → kare → [x, y, w, h, WebP base64]: 528×704 portre tuvalinde YALNIZ değişen bölgenin kırpımı; ui-diyalog.js asıl portrenin üstüne çizip tam kare üretir.\n'
             'export const K = ' + json.dumps(K, ensure_ascii=False, separators=(',', ':')) + ';\n')
rapor['P34-05'] = r5

# ---- P34-02/03/04 sahne katmanları
SAH = {'baskent-elentha': 'P34-02', 'baskent-kragmir': 'P34-03', 'carsi': 'P34-04', 'klan-elentha': 'P34-04', 'klan-kragmir': 'P34-04'}
KAT = {}; rk = {}
for s, pk in SAH.items():
    d = json.load(open(f'{GPT}/{pk}/{s}/yerlesim.json', encoding='utf-8'))
    E = []
    for e in d['elemanlar']:
        fr = [Image.open(f'{GPT}/{pk}/{s}/{fn}').convert('RGBA') for fn in e['dosyalar']]
        w, h = e['w'], e['h']; assert all(x.size == (w, h) for x in fr)
        st = Image.new('RGBA', (w * len(fr), h))
        for i, x in enumerate(fr): st.paste(x, (i * w, 0))
        E.append(dict(id=e['kimlik'], t=e['tur'], x=e['x'], y=e['y'], w=w, h=h, n=len(fr), fps=e['fps'], m=e['karisim'], s=webp_b64(st, 82, 90)))
    KAT[s] = dict(tuval=d['tuval'], e=E)
    rk[s] = dict(eleman=len(E), kare=sum(x['n'] for x in E), atlanan=d.get('atlananlar', []))
with open(f'{G}/js/p34-katman-png.js', 'w', encoding='utf-8') as fo:
    fo.write('// OTOMATİK (_tasarim/araclar/p34-gom.py) — elle düzenleme. P34-02/03/04 (GPT): başkent, Yemin Pazarı ve Klan Obası hareket katmanları.\n'
             '// sahne → { tuval: [w, h] (sahneler/*.webp gerçek pikseli), e: [{ id, t (tür), x, y, w, h, n (kare), fps, m (normal|screen), s (yatay kare şeridi WebP base64) }] }.\n'
             '// Kare 0 = fotoğrafın birebir kırpımı (normal) / boş (screen). js/p34-katman.js tembel yükler.\n'
             'export const KATMAN = ' + json.dumps(KAT, ensure_ascii=False, separators=(',', ':')) + ';\n')
rapor['P34-02-03-04'] = rk
for f in ('npc-kare-png.js', 'p34-katman-png.js', 'b2d-y1.js', 'b2d-y3.js', 'b2d-y4.js', 'b2d-yb.js', 'b2d-sancak.js', 'gorsel-png.js', 'karakter-png-veri.js'):
    rapor.setdefault('boyut', {})[f'js/{f}'] = os.path.getsize(f'{G}/js/{f}')
json.dump(rapor, open(f'{G}/_tasarim/araclar/kabul-26kas/p34_gom_raporu.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(json.dumps(rapor['boyut'], indent=0), {k: (len(v) if isinstance(v, list) else '') for k, v in rapor.items()})
