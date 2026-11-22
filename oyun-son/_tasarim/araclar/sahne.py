"""Tek parça boyanmış şehir sahnelerini (GPT, 21 Kas) oyuna hazırlar.
Her binanın kaba kutusu elle verilir (BOLGE); bina şekli GrabCut ile kutunun içinden ayrılır.
Çıktı: img/kd/sehir/<yer>/sahne.webp, atlas.webp (bina kesitleri; basınca parlar), js/hub2d-data.js (OTOMATİK; dokunma
haritası RLE olarak içinde: değer = bölge sırası+1, 1/4 ölçek).
Kullanım: python3 sahne.py <kaynak_klasoru (ocak, sancak, carsi, klan: .webp ya da .jpg)> <oyun-son> [kontrol_klasoru]
"""
import sys, os, json
import numpy as np, cv2
from PIL import Image, ImageFilter

SRC, O = sys.argv[1:3]
KONT = sys.argv[3] if len(sys.argv) > 3 else None
HIT = 4
# yer → [(oyun kimliği, [sol, üst, sağ, alt])]; aynı kimlik birden çok bölgede olabilir (etiket ilkinde)
BOLGE = {
    # 22 Kas: GPT "VAHRAN Haritalar" (dört harita, 1672×941). gate = sur kapısı (sefer), portal = ışınlanma kapısı (yer seçimi)
    'ocak': [
        ('wheel', [100, 20, 410, 270]), ('clanhq', [590, 0, 1150, 300]), ('anvil', [370, 270, 790, 520]),
        ('iksir', [1200, 90, 1610, 330]), ('karaborsa', [1090, 330, 1400, 510]), ('mine', [0, 390, 360, 690]),
        ('monument', [560, 510, 800, 750]), ('carsi', [20, 650, 600, 870]), ('portal', [880, 540, 1150, 820]),
        ('gate', [1280, 480, 1672, 860]),
    ],
    'sancak': [
        ('wheel', [100, 40, 410, 290]), ('clanhq', [470, 0, 1110, 300]), ('anvil', [290, 270, 660, 480]),
        ('iksir', [1230, 100, 1610, 330]), ('karaborsa', [1190, 330, 1500, 500]), ('carsi', [330, 490, 710, 640]),
        ('mine', [0, 560, 340, 900]), ('monument', [600, 590, 860, 880]), ('portal', [920, 560, 1260, 820]),
        ('gate', [1290, 500, 1672, 800]),
    ],
    'carsi': [
        ('c_silah', [100, 100, 680, 410]), ('c_zirh', [700, 40, 1260, 290]), ('c_taki', [1260, 180, 1650, 460]),
        ('c_sarf', [20, 400, 600, 790]), ('yashka', [575, 505, 705, 620]), ('pazar', [1000, 370, 1320, 485]),
        ('karaborsa', [1000, 530, 1180, 670]), ('pier', [0, 110, 135, 340]), ('portal', [1240, 450, 1560, 830]),
    ],
    'klan': [
        ('k_salon', [610, 0, 1010, 200]), ('k_hq', [690, 200, 1000, 450]), ('k_hazine', [90, 260, 520, 470]),
        ('k_dukkan', [220, 510, 610, 740]), ('k_hisar', [1190, 230, 1600, 420]), ('k_av', [1200, 410, 1610, 520]),
        ('k_gorev', [950, 440, 1120, 570]), ('k_sancak', [310, 100, 560, 260]), ('gate', [730, 710, 990, 900]),
        ('portal', [1220, 520, 1500, 780]),
    ],
}
# Işıklar [x, y, yarıçap]: Kragmir ateşi otomatik (alev pikselleri), diğerleri elle; buz = soğuk ışık (geçit, kristal)
ELLE = {
    'ocak': {'buz': [[1030, 680, 58]]},
    'sancak': {'ates': [[945, 710, 16], [1160, 712, 16], [620, 745, 14], [822, 740, 14], [1367, 745, 14], [1568, 745, 14], [1098, 215, 14], [637, 238, 14], [787, 305, 12], [975, 300, 12], [185, 205, 12], [330, 190, 12], [425, 410, 18]],
               'buz': [[1035, 690, 60], [180, 480, 20], [30, 750, 24], [150, 740, 22]]},
    'carsi': {'ates': [[1275, 700, 18], [1535, 740, 16], [655, 470, 12], [735, 530, 12], [340, 815, 12], [900, 850, 12], [1160, 355, 12], [930, 335, 10], [435, 130, 10], [1565, 460, 10], [290, 330, 14]],
              'buz': [[1400, 650, 60]]},
    'klan': {'ates': [[150, 180, 12], [578, 95, 10], [1035, 105, 10], [1585, 215, 12], [1360, 265, 12], [1530, 285, 12], [750, 385, 14], [912, 385, 14], [180, 690, 12], [770, 730, 14], [940, 730, 14], [1245, 635, 14], [1480, 650, 14], [1180, 705, 10], [1440, 705, 10], [420, 680, 18]],
             'buz': [[1355, 660, 60]]},
}
# Etiketi olmayan ek noktalar (hub2d.js EK ile aynı anlam): sahne pikseli. king = Kral (saray merdiveni), merchant = Tüccar Halvor (meydan)
EK = {'ocak': {'king': [870, 330]}, 'sancak': {'king': [870, 330]}, 'carsi': {'merchant': [905, 440], 'child': [870, 640]}, 'klan': {}}

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
    kay = f'{SRC}/{yer}.webp' if os.path.exists(f'{SRC}/{yer}.webp') else f'{SRC}/{yer}.jpg'
    im = Image.open(kay).convert('RGB'); W, H = im.size
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
            c = (0, 255, 0) if oid not in ('portal', 'gate') else (255, 0, 255)
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
    isik = dict(ELLE.get(yer) or {})
    if 'ates' not in isik:  # alev tespiti (karanlık sahne)
        A = rgb.astype(np.int16); R, G, B = A[..., 0], A[..., 1], A[..., 2]
        k = ((R > 235) & (G > 140) & (B < 110) & (R - B > 150)).astype(np.uint8)
        k = cv2.dilate(k, np.ones((5, 5), np.uint8))
        n, lab, st, cen = cv2.connectedComponentsWithStats(k)
        top = sorted([(st[i, cv2.CC_STAT_AREA], cen[i]) for i in range(1, n) if 14 <= st[i, cv2.CC_STAT_AREA] < 6000], key=lambda t: -t[0])[:40]
        isik['ates'] = [[int(c[0]), int(c[1]), int(min(55, 6 + a ** .5 * 1.5))] for a, c in top]
        isik.setdefault('buz', [])
    veri[yer] = {'size': [W, H], 'hit': hit, 'r': bolge, 'isik': isik, 'ek': EK[yer]}
    if KONT: Image.fromarray(kont).save(f'{KONT}/maske-{yer}.jpg', quality=80)

js = ('// OTOMATİK ÜRETİLDİ (_tasarim/araclar/sahne.py): tek parça boyanmış GPT şehir sahneleri (21 Kas).\n'
      '// size: sahne pikseli · hit: dokunma haritası (w×h, RLE [değer, uzunluk]…; değer-1 = bölge sırası) · r: bölgeler (id = oyundaki bina kimliği;\n// box [sol,üst,sağ,alt]; label [x,y] bina tepesi; a [x,y] kesitin atlas.webp içindeki yeri)\n'
      '// isik: titreyen ışıklar [x,y,yarıçap] · ek: binasız etiket noktaları\n'
      f'export const HIT_SCALE = {HIT};\nexport const SAHNE = ' + json.dumps(veri, separators=(',', ':')) + ';\n')
open(f'{O}/js/hub2d-data.js', 'w', encoding='utf-8').write(js)
print('tamam', {k: len(v['r']) for k, v in veri.items()}, {k: len(v['isik']['ates']) for k, v in veri.items()})
