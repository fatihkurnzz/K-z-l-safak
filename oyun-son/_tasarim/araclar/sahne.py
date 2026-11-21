"""Tek parça boyanmış şehir sahnelerini (GPT, 21 Kas) oyuna hazırlar.
Her binanın kaba kutusu elle verilir (BOLGE); bina şekli GrabCut ile kutunun içinden ayrılır.
Çıktı: img/kd/sehir/<yer>/sahne.webp, atlas.webp (bina kesitleri; basınca parlar), js/hub2d-data.js (OTOMATİK; dokunma
haritası RLE olarak içinde: değer = bölge sırası+1, 1/4 ölçek).
Kullanım: python3 sahne.py <kaynak_klasoru (ocak.jpg sancak.jpg carsi.jpg)> <oyun-son> [kontrol_klasoru]
"""
import sys, os, json
import numpy as np, cv2
from PIL import Image, ImageFilter

SRC, O = sys.argv[1:3]
KONT = sys.argv[3] if len(sys.argv) > 3 else None
HIT = 4
# yer → [(oyun kimliği, [sol, üst, sağ, alt])]; aynı kimlik birden çok bölgede olabilir (etiket ilkinde)
BOLGE = {
    'ocak': [
        ('king', [590, 0, 1090, 330]), ('arena', [262, 160, 512, 335]), ('iksir', [148, 325, 445, 485]),
        ('monument', [136, 478, 348, 645]), ('clanhq', [492, 505, 735, 695]), ('mine', [936, 495, 1185, 702]),
        ('karaborsa', [1330, 478, 1590, 648]), ('anvil', [1255, 295, 1550, 485]), ('wheel', [1172, 160, 1410, 328]),
        ('carsi', [698, 330, 985, 518]), ('gate', [688, 688, 1018, 941]),
    ],
    'sancak': [
        ('king', [500, 0, 1132, 245]), ('clanhq', [352, 82, 578, 248]), ('wheel', [1122, 82, 1318, 248]),
        ('arena', [192, 248, 458, 388]), ('karaborsa', [62, 356, 348, 508]), ('iksir', [1232, 232, 1488, 392]),
        ('mine', [1372, 362, 1603, 508]), ('monument', [382, 536, 568, 765]), ('anvil', [1282, 496, 1548, 668]),
        ('carsi', [676, 318, 994, 562]), ('gate', [636, 776, 1024, 941]),
    ],
    'carsi': [
        ('tuccar', [172, 18, 472, 288]), ('tuccar', [1178, 18, 1618, 240]), ('monument', [52, 238, 302, 468]),
        ('pazar', [0, 492, 648, 848]), ('pazar', [502, 146, 728, 288]), ('yashka', [926, 142, 1218, 308]),
        ('karaborsa', [1312, 238, 1660, 488]), ('pier', [1106, 496, 1672, 824]), ('carsi', [598, 216, 1102, 572]),
        ('gate', [636, 0, 1012, 196]),
    ],
}
# Işıklar [x, y, yarıçap]: Kragmir otomatik (alev pikselleri), diğerleri elle
ELLE = {
    'sancak': {'ates': [[1405, 615, 22], [457, 790, 14], [1212, 790, 14], [1633, 808, 14], [298, 805, 12]], 'buz': [[838, 455, 50], [838, 520, 34], [470, 640, 30], [1260, 140, 26], [1490, 432, 18]]},
    'carsi': {'ates': [[302, 210, 20], [418, 360, 14], [1255, 352, 14], [1025, 622, 16], [651, 625, 16], [742, 785, 12], [945, 785, 12], [1520, 610, 14]], 'buz': [[835, 330, 52], [838, 455, 40], [1490, 415, 16]]},
}
# Etiketi olmayan ek noktalar (hub2d.js EK ile aynı anlam): sahne pikseli
EK = {'ocak': {}, 'sancak': {}, 'carsi': {'child': [838, 640]}}

def kes(rgb, box):
    x0, y0, x1, y1 = box
    H, W = rgb.shape[:2]
    p = 24  # GrabCut yalnız kutu + pay kadar kırpıntıda çalışır (hızlı)
    cx0, cy0, cx1, cy1 = max(0, x0 - p), max(0, y0 - p), min(W, x1 + p), min(H, y1 + p)
    sub = np.ascontiguousarray(rgb[cy0:cy1, cx0:cx1])
    m = np.zeros(sub.shape[:2], np.uint8)
    bg, fg = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
    r = (x0 - cx0 + 2, y0 - cy0 + 2, max(4, x1 - x0 - 4), max(4, y1 - y0 - 4))
    cv2.grabCut(cv2.cvtColor(sub, cv2.COLOR_RGB2BGR), m, r, bg, fg, 4, cv2.GC_INIT_WITH_RECT)
    k = ((m == cv2.GC_FGD) | (m == cv2.GC_PR_FGD)).astype(np.uint8)
    k = cv2.morphologyEx(k, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(k)
    if n > 1:  # en büyük parça + ona göre büyük sayılan parçalar
        big = 1 + np.argmax(st[1:, cv2.CC_STAT_AREA]); keep = np.zeros_like(k)
        for i in range(1, n):
            if st[i, cv2.CC_STAT_AREA] >= 0.06 * st[big, cv2.CC_STAT_AREA]: keep[lab == i] = 1
        k = keep
    cnt, _ = cv2.findContours(k, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    loc = np.zeros_like(k); cv2.drawContours(loc, cnt, -1, 1, -1)  # delikleri doldur
    full = np.zeros((H, W), np.uint8); full[cy0:cy1, cx0:cx1] = loc
    # GrabCut bazen binanın bir kısmını alır: kutuya oturan elipsle birleştir (parlama bütün binayı kaplasın; kuleler GrabCut'tan gelir)
    e = np.zeros((H, W), np.uint8)
    cv2.ellipse(e, ((x0 + x1) // 2, (y0 + y1) // 2 + (y1 - y0) // 20), (int((x1 - x0) * 0.46), int((y1 - y0) * 0.44)), 0, 0, 360, 1, -1)
    full = (full | e).astype(bool)
    return full

veri = {}
for yer, bl in BOLGE.items():
    hedef = f'{O}/img/kd/sehir/{yer}'
    os.makedirs(hedef, exist_ok=True)
    for f in os.listdir(hedef): os.remove(os.path.join(hedef, f))  # eski teslimin dosyaları
    im = Image.open(f'{SRC}/{yer}.jpg').convert('RGB'); W, H = im.size
    rgb = np.asarray(im)
    im.save(f'{hedef}/sahne.webp', 'WEBP', quality=88, method=6)
    idmap = np.zeros((H, W), np.uint8); bolge = []; kesit = []
    kont = rgb.copy() if KONT else None
    for i, (oid, box) in enumerate(bl):
        mk = kes(rgb, box)
        ys, xs = np.nonzero(mk)
        bx = [int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1]
        al = Image.fromarray((mk * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2.5))
        cut = im.copy(); cut.putalpha(al); kesit.append(cut.crop(bx))
        dil = cv2.dilate(mk.astype(np.uint8), np.ones((15, 15), np.uint8)).astype(bool)  # parmak payı
        kutu = np.zeros_like(dil); kutu[box[1]:box[3], box[0]:box[2]] = True  # dokunma: kutunun tamamı
        idmap[(dil | kutu) & (idmap == 0)] = i + 1
        top = bx[1]; band = ys < top + max(8, (bx[3] - top) * 0.08)
        bolge.append({'id': oid, 'box': bx, 'label': [int(xs[band].mean()), top]})
        if KONT is not None:
            c = (0, 255, 0) if oid not in ('carsi', 'gate') else (255, 0, 255)
            ov = kont.copy(); ov[mk] = (0.55 * ov[mk] + 0.45 * np.array(c)).astype(np.uint8); kont = ov
            cv2.putText(kont, f'{i}:{oid}', (bx[0] + 4, bx[1] + 18), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 2)
    # atlas: kesitler raf raf tek resimde (yayında dosya sayısı sınırı); bölgeye 'a' = atlastaki sol üst köşe
    AW, x, y, rh = 2048, 0, 0, 0
    for b, c in zip(bolge, kesit):
        if x + c.width > AW: x, y, rh = 0, y + rh + 2, 0
        b['a'] = [x, y]; x += c.width + 2; rh = max(rh, c.height)
    atlas = Image.new('RGBA', (AW, y + rh), (0, 0, 0, 0))
    for b, c in zip(bolge, kesit): atlas.paste(c, tuple(b['a']))
    atlas.save(f'{hedef}/atlas.webp', 'WEBP', quality=86, method=6)
    # dokunma haritası: 1/HIT ölçek, satır satır [değer, uzunluk] çiftleri (RLE) veri dosyasına gömülü
    sm = np.asarray(Image.fromarray(idmap).resize((W // HIT, H // HIT), Image.NEAREST)).ravel()
    rle, i0 = [], 0
    for j in range(1, len(sm) + 1):
        if j == len(sm) or sm[j] != sm[i0]: rle += [int(sm[i0]), j - i0]; i0 = j
    hit = {'w': W // HIT, 'h': H // HIT, 'rle': rle}
    isik = ELLE.get(yer)
    if isik is None:  # alev tespiti (karanlık sahne)
        A = rgb.astype(np.int16); R, G, B = A[..., 0], A[..., 1], A[..., 2]
        k = ((R > 235) & (G > 140) & (B < 110) & (R - B > 150)).astype(np.uint8)
        k = cv2.dilate(k, np.ones((5, 5), np.uint8))
        n, lab, st, cen = cv2.connectedComponentsWithStats(k)
        top = sorted([(st[i, cv2.CC_STAT_AREA], cen[i]) for i in range(1, n) if 14 <= st[i, cv2.CC_STAT_AREA] < 6000], key=lambda t: -t[0])[:40]
        isik = {'ates': [[int(c[0]), int(c[1]), int(min(55, 6 + a ** .5 * 1.5))] for a, c in top], 'buz': [[838, 410, 40]]}
    veri[yer] = {'size': [W, H], 'hit': hit, 'r': bolge, 'isik': isik, 'ek': EK[yer]}
    if KONT: Image.fromarray(kont).save(f'{KONT}/maske-{yer}.jpg', quality=80)

js = ('// OTOMATİK ÜRETİLDİ (_tasarim/araclar/sahne.py): tek parça boyanmış GPT şehir sahneleri (21 Kas).\n'
      '// size: sahne pikseli · hit: dokunma haritası (w×h, RLE [değer, uzunluk]…; değer-1 = bölge sırası) · r: bölgeler (id = oyundaki bina kimliği;\n// box [sol,üst,sağ,alt]; label [x,y] bina tepesi; a [x,y] kesitin atlas.webp içindeki yeri)\n'
      '// isik: titreyen ışıklar [x,y,yarıçap] · ek: binasız etiket noktaları\n'
      f'export const HIT_SCALE = {HIT};\nexport const SAHNE = ' + json.dumps(veri, separators=(',', ':')) + ';\n')
open(f'{O}/js/hub2d-data.js', 'w', encoding='utf-8').write(js)
print('tamam', {k: len(v['r']) for k, v in veri.items()}, {k: len(v['isik']['ates']) for k, v in veri.items()})
