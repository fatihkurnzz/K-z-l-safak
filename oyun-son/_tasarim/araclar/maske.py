"""Son sahne ile boş zemin farkından bina maskelerini çıkarır.
Kullanım: python3 maske.py <nihai.png> <zemin.png> <yerlesim.json> <cikti_klasoru> <onek>
Çıktı: <onek>-<id>.webp (sahneden kesilmiş RGBA, tam yerinde), maske.json (kutu, etiket noktası), kontrol.jpg
"""
import sys, json, os
import numpy as np
from PIL import Image, ImageFilter, ImageDraw
from scipy import ndimage as nd

nihai_p, zemin_p, yer_p, out, onek = sys.argv[1:6]
os.makedirs(out, exist_ok=True)
A = np.asarray(Image.open(nihai_p).convert('RGB')).astype(np.int16)
B = np.asarray(Image.open(zemin_p).convert('RGB')).astype(np.int16)
H, W = A.shape[:2]
d = np.abs(A - B).max(axis=2)
m = d > 28
m = nd.binary_opening(m, iterations=1)
m = nd.binary_closing(m, iterations=4)
m = nd.binary_fill_holes(m)
lab, n = nd.label(m)
sizes = nd.sum(m, lab, range(1, n + 1))

Y = json.load(open(yer_p))
items = Y.get('buildings') or Y.get('areas')
spots = []
for b in items:
    if 'center_px' in b:
        spots.append((b['id'], b['center_px'][0], b['center_px'][1]))
    else:
        # binalarda y ≈ taban; merkez = taban - yükseklik/2
        spots.append((b['id'], b['x'], b['y'] - b['display_height'] / 2))
if 'teleport' in Y:
    spots.append(('Teleport', Y['teleport']['center'][0], Y['teleport']['center'][1]))

# her parçayı (yeterince büyükse) en yakın binaya ver
cent = nd.center_of_mass(m, lab, range(1, n + 1))
own = {}
for i, (s, c) in enumerate(zip(sizes, cent)):
    if s < 400:
        continue
    cy, cx = c
    best = min(spots, key=lambda p: (p[1] - cx) ** 2 + (p[2] - cy) ** 2)
    dist = ((best[1] - cx) ** 2 + (best[2] - cy) ** 2) ** .5
    if dist > 260:
        continue
    own.setdefault(best[0], []).append(i + 1)

res = {'size': [W, H], 'items': {}}
kont = Image.open(nihai_p).convert('RGB')
dr = ImageDraw.Draw(kont)
rgb = Image.open(nihai_p).convert('RGB')
for bid, labs in own.items():
    mk = np.isin(lab, labs)
    ys, xs = np.nonzero(mk)
    x0, y0, x1, y1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
    pad = 6
    x0, y0, x1, y1 = max(0, x0 - pad), max(0, y0 - pad), min(W, x1 + pad), min(H, y1 + pad)
    al = Image.fromarray((mk * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))
    cut = rgb.copy(); cut.putalpha(al)
    cut = cut.crop((x0, y0, x1, y1))
    fn = f'{onek}-{bid}.webp'
    cut.save(os.path.join(out, fn), 'WEBP', quality=88, method=6)
    # etiket noktası: maskenin üst kenarının ortası (en üstteki %8'lik şeritte ortalama x)
    top = ys.min(); band = ys < top + max(8, (ys.max() - top) * 0.08)
    lx = int(xs[band].mean())
    res['items'][bid] = {'box': [int(x0), int(y0), int(x1), int(y1)], 'label': [lx, int(top)], 'file': fn, 'px': int(mk.sum())}
    dr.rectangle([x0, y0, x1, y1], outline=(0, 255, 0), width=3)
    dr.text((x0 + 6, y0 + 4), bid, fill=(0, 255, 0))
json.dump(res, open(os.path.join(out, 'maske.json'), 'w'), indent=1)
kont.save(os.path.join(out, 'kontrol.jpg'), quality=80)
Image.fromarray((m * 255).astype(np.uint8)).save(os.path.join(out, 'fark.png'))
print(onek, 'parca', n, 'eslesen', {k: len(v) for k, v in own.items()}, 'eslesmeyen', [s for s in spots if s[0] not in own])
