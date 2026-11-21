# ui-denetim.js çıktısındaki yazıların kontrastını ölçer: zemin = yazı kutusunun çevresindeki piksellerin ortancası.
# Kullanım: python3 -I kontrast.py <denetim_klasörü> [eşik=2.4]  → düşük kontrastlı yazılar (ekran, öğe, yazı, oran)
import sys, json, os
from PIL import Image
D = sys.argv[1]; ESIK = float(sys.argv[2]) if len(sys.argv) > 2 else 2.4
def lum(c):
    def f(v): v /= 255; return v / 12.92 if v <= .03928 else ((v + .055) / 1.055) ** 2.4
    return .2126 * f(c[0]) + .7152 * f(c[1]) + .0722 * f(c[2])
def oran(a, b): la, lb = sorted((lum(a), lum(b)), reverse=True); return (la + .05) / (lb + .05)
def zemin(im, r, col):
    x, y, w, h = r; W, H = im.size; px = []
    for yy in range(max(0, y), min(H, y + h), max(1, h // 6)):
        for xx in range(max(0, x), min(W, x + w), max(1, w // 24)):
            p = im.getpixel((xx, yy))
            if oran(p, col) > 1.25: px.append(p)  # yazının kendi piksellerini at
    if not px: return None
    px.sort(key=lum); return px[len(px) // 2]
res = json.load(open(os.path.join(D, 'sonuc.json'))); kotu = []
for s in res['sonuc']:
    parca = [(s['ekran'], s)] + [(s['ekran'] + '~' + t, v) for t, v in s.get('sekmeler', {}).items()]
    for ad, v in parca:
        f = os.path.join(D, ad + '.png')
        if not os.path.exists(f) or not v.get('renk'): continue
        im = Image.open(f).convert('RGB')
        for e in v['renk']:
            z = zemin(im, e['r'], tuple(e['c']))
            if z is None: continue
            o = oran(tuple(e['c']), z)
            if o < ESIK: kotu.append((ad, e['a'], e['t'], round(o, 2), e['c'], z))
for k in kotu: print(*k, sep=' | ')
print('toplam', len(kotu))
