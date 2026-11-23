# G3 yaratık/boss pozları (GPT G3 teslimi, 5 ZIP, WebP) → gömülü JS (WebP base64), bölge başına bir dosya, savaşta tembel yüklenir
# Kullanım: python3 -I b2d-g3-gom.py <ZIP'lerin açıldığı klasör (alt klasörler bolge1_vahran … ana_bosslar)> <oyun-son>
# Çıktı (OTOMATİK, elle düzenleme): js/b2d-y1.js … js/b2d-y4.js (bölgeler), js/b2d-yb.js (ana bosslar)
# Yaratık 1024x1024 → 384x384 (zemin alttan 48/1024): bekleme, saldiri, vurulma + portre (bekleme pozundan baş kırpması, 128)
# Boss 1536x1536 → 448x448: evre1 → bekleme/saldiri/vurulma, evre2 → bekleme2/saldiri2/vurulma2; portre = teslimdeki 512 portre → 128
import sys, os, io, glob, base64, json
from PIL import Image

SRC, OUT = sys.argv[1], sys.argv[2]
KLASOR = {'bolge1_vahran': 'y1', 'bolge2_kul_gecidi': 'y2', 'bolge3_kizil_bahar': 'y3', 'bolge4_sisli_cukur': 'y4', 'ana_bosslar': 'yb'}


def webp(im, size, q=78):
    im = im.convert('RGBA').resize(size, Image.LANCZOS)
    b = io.BytesIO(); im.save(b, 'WEBP', quality=q, method=6, alpha_quality=85)
    return base64.b64encode(b.getvalue()).decode()


def bas(f):  # düşman çerçevesi için baş kırpması (yaratık sola bakar: baş sol yarıda)
    im = Image.open(f).convert('RGBA'); x0, y0, x1, y1 = im.getchannel('A').point(lambda v: 255 if v > 40 else 0).getbbox()
    a = int(min(y1 - y0, x1 - x0) * 0.75); cx = x0 + int((x1 - x0) * 0.32); cy = y0 + int(a * 0.5)
    return webp(im.crop((cx - a // 2, cy - a // 2, cx + a // 2, cy + a // 2)), (128, 128))


for kl, ad in KLASOR.items():
    dd = glob.glob(os.path.join(SRC, '*', kl))
    if not dd: print('YOK', kl); continue
    d0 = dd[0]; veri = {}
    for f in sorted(glob.glob(os.path.join(d0, '*.webp')) + glob.glob(os.path.join(d0, '*.png'))):  # 23 Kas: M1 ek teslim 13 tür PNG, yalnız bekleme
        n = os.path.splitext(os.path.basename(f))[0]
        if n.startswith('yaratik-'):
            t, p = n[8:].rsplit('-', 1)
            e = veri.setdefault(t, {}); e[p] = webp(Image.open(f), (384, 384))
            if p == 'bekleme': e['portre'] = bas(f)
        elif n.startswith('boss-'):
            r = n[5:]
            if r.endswith('-portre'):
                veri.setdefault(r[:-7], {'boss': 1})['portre'] = webp(Image.open(f), (128, 128)); continue
            t, ev, p = r.rsplit('-', 2)
            e = veri.setdefault(t, {'boss': 1}); e['boss'] = 1
            e[p + ('2' if ev == 'evre2' else '')] = webp(Image.open(f), (448, 448))
    yol = os.path.join(OUT, 'js', f'b2d-{ad}.js')
    with open(yol, 'w') as fo:
        fo.write('// OTOMATİK (_tasarim/araclar/b2d-g3-gom.py) — elle düzenleme. G3 ' + kl + ': yaratıklar (3 poz + portre, 384) ve bosslar (2 evre × 3 poz + portre, 448)\n')
        fo.write('export const B = ' + json.dumps(veri, separators=(',', ':')) + ';\n')
    print(yol, os.path.getsize(yol) // 1024, 'KB', len(veri), 'tür', sorted(veri))
