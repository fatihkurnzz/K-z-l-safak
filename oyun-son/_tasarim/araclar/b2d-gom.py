# Savaş birimi 2B pozları (GPT G1/G2 teslimi) → gömülü JS (WebP base64)
# Kullanım: python3 -I b2d-gom.py <paket klasörü (G1, G2_Elentha, G2_Kragmir alt klasörleri)> <oyun-son>
# Çıktı (OTOMATİK, elle düzenleme): js/b2d-sancak.js, js/b2d-ocak.js (her biri o halkın 8 kahramanı + bütün yaratıklar;
# yayın dosya sınırı yüzünden ayrı yaratık dosyası yok: savaş oyuncunun halk dosyasını yükler)
# - Beyaz zemin artığı olan setler (HALE) temizlenir: saydam alana bağlı açık/nötr pikseller silinir.
# - Kahraman 1086x1448 → 384x512 (zemin çizgisi alttan 64/1448), yaratık 1024x1024 → 384x384 (zemin alttan 48/1024).
# - YEDEK: sorunlu pozun yerine geçici olarak başka poz kullanılır (GPT yeniden çizene dek).
import sys, os, io, glob, base64, json
import numpy as np
from PIL import Image
from scipy import ndimage as nd

SRC, OUT = sys.argv[1], sys.argv[2]
POZ = ['bekleme', 'saldiri-hazirlik', 'saldiri-vurus', 'buyu', 'vurulma', 'yere-dusus', 'zafer']
MPOZ = ['bekleme', 'saldiri', 'vurulma']
# 23 Kas (M1 ek düzeltmeler): beyaz artıklı 5 set GPT'den temiz geldi → temizlemeye gerek kalmadı (beyaz giysiyi silmesin)
HALE = set()
YEDEK = {}  # 23 Kas: Elentha kadın savaşçı büyü pozu düzeltilmiş geldi
TURLER = ['bandikut', 'kucuk-bandikut', 'kuduz-bandikut', 'yaman-bandikut']


def temizle(im, thr=200, sat=28):
    a = np.array(im.convert('RGBA')).astype(np.int16)
    rgb, al = a[..., :3], a[..., 3]
    light = (rgb.min(axis=2) > thr) & ((rgb.max(axis=2) - rgb.min(axis=2)) < sat) & (al > 0)
    trans = al < 10
    lab, _ = nd.label(light | trans)
    seeds = np.unique(lab[trans]); seeds = seeds[seeds > 0]
    al2 = al.copy(); al2[np.isin(lab, seeds) & light] = 0
    for _ in range(2):
        edge = nd.binary_dilation(al2 < 10) & (al2 >= 10)
        al2[edge & (rgb.min(axis=2) > thr - 35) & ((rgb.max(axis=2) - rgb.min(axis=2)) < sat + 10)] = 0
    bl = nd.uniform_filter((al2 > 0).astype(np.float32), 3)
    a[..., 3] = np.where(al2 > 0, np.maximum(np.minimum(al2, (bl * 255).astype(np.int16)), al2 * 0.6).astype(np.int16), 0)
    return Image.fromarray(a.astype(np.uint8), 'RGBA')


def webp(im, size, q=80):
    im = im.convert('RGBA').resize(size, Image.LANCZOS)
    b = io.BytesIO(); im.save(b, 'WEBP', quality=q, method=6, alpha_quality=90)
    return base64.b64encode(b.getvalue()).decode()


def bul(ad):
    f = glob.glob(os.path.join(SRC, '*', ad + '.png'))
    return f[0] if f else None


def yaz(yol, aciklama, veri):
    with open(yol, 'w') as f:
        f.write('// OTOMATİK (_tasarim/araclar/b2d-gom.py) — elle düzenleme. ' + aciklama + '\n')
        f.write('export const B = ' + json.dumps(veri, separators=(',', ':')) + ';\n')
    print(yol, os.path.getsize(yol) // 1024, 'KB')


eksik = []
YV = {}
for t in TURLER:
    d = {}
    for p in MPOZ:
        f = bul(f'yaratik-{t}-{p}')
        if not f: eksik.append(t + '-' + p); continue
        d[p] = webp(Image.open(f), (384, 384))
        if p == 'bekleme':  # düşman çerçevesi için baş kırpması (yaratık sola bakar: baş sol yarıda)
            im = Image.open(f).convert('RGBA'); x0, y0, x1, y1 = im.getchannel('A').point(lambda v: 255 if v > 40 else 0).getbbox()
            a = int((y1 - y0) * 0.95); cx = x0 + int((x1 - x0) * 0.3); cy = y0 + a // 2
            d['portre'] = webp(im.crop((cx - a // 2, cy - a // 2, cx + a // 2, cy + a // 2)), (128, 128))
    YV[t] = d
for halk in ['sancak', 'ocak']:
    veri = {}
    for sinif in ['savasci', 'suikastci', 'buyucu', 'sifaci']:
        for cins in ['kadin', 'erkek']:
            k = f'{halk}-{sinif}-{cins}'; d = {}
            for p in POZ:
                p2 = YEDEK.get((k, p), p)
                f = bul(f'kahraman-{k}-{p2}')
                if not f: eksik.append(k + '-' + p); continue
                im = Image.open(f)
                if k in HALE: im = temizle(im)
                d[p] = webp(im, (384, 512))
            veri[f'{sinif}-{cins}'] = d
    veri.update(YV)
    yaz(os.path.join(OUT, 'js', f'b2d-{halk}.js'), f'{halk} kahramanları (7 poz, 384x512, zemin alttan 64/1448) + yaratıklar (3 poz + portre, 384x384, zemin alttan 48/1024)', veri)

# Karakter seçme/oluşturma tam boyu için savaşçıların temizlenmiş bekleme pozu (kullanıcı kararı: kılıç + kalkan) → karakter-gom.py okur
SV = os.path.join(OUT, '_tasarim', 'gelen', 'g1g2-savasci'); os.makedirs(SV, exist_ok=True)
for halk in ['sancak', 'ocak']:
    for cins in ['kadin', 'erkek']:
        k = f'{halk}-savasci-{cins}'; im = Image.open(bul(f'kahraman-{k}-bekleme'))
        if k in HALE: im = temizle(im)
        im = im.convert('RGBA').resize((512, 683), Image.LANCZOS); c = Image.new('RGBA', (512, 768)); c.paste(im, (0, 85)); c.save(os.path.join(SV, k + '.png'))
print('eksik:', eksik)
