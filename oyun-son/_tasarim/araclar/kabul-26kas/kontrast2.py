# Kontrast ölçümü: cekim.js _cekim.json'daki her yazı (renk + görünür kutu) için zemin rengi ekran görüntüsünden ölçülür
# (kutudaki, yazı renginden belirgin farklı piksellerin medyanı). WCAG oranı; < 4.5 (küçük yazı) / < 3 (≥18 px ya da ≥14 px kalın) bulgu.
# python3 -I kontrast2.py <çekim klasörü> → <klasör>/_kontrast.json
import json, sys, os
from PIL import Image
D = sys.argv[1]; _f = '_cekim.json' if os.path.exists(os.path.join(D, '_cekim.json')) else '_eylem.json'; C = json.load(open(os.path.join(D, _f), encoding='utf-8')); dpr = C['dpr']
# _eylem.json: sekmeler de ayrı kayıt olarak ölçülür
_K = []
for k in C['kayit']:
    _K.append({'no': k['no'], 'beklenen': k.get('etiket') or k.get('beklenen'), 'olcum': k.get('olcum'), 'png': f"{k['no']}.png" if isinstance(k['no'], str) else f"{k['no']:04d}.png"})
    for s2 in k.get('sekmeler', []) if isinstance(k.get('sekmeler'), list) else []: _K.append({'no': s2['dosya'][:-4], 'beklenen': (k.get('etiket') or '') + '~' + s2['sekme'], 'olcum': s2.get('olcum'), 'png': s2['dosya']})
C['kayit'] = _K
def lum(c):
    def ch(v):
        v /= 255; return v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4
    r, g, b = c[:3]; return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b)
def oran(a, b):
    la, lb = lum(a), lum(b); hi, lo = max(la, lb), min(la, lb); return (hi + 0.05) / (lo + 0.05)
out = {'race': C['race'], 'ekranlar': []}; tum = []
for k in C['kayit']:
    p = os.path.join(D, k['png'])
    if not os.path.exists(p) or not isinstance(k.get('olcum'), dict): continue
    im = Image.open(p).convert('RGB'); W, H = im.size; bul = []
    for t in k['olcum'].get('renk', []):
        x, y, w, h = t['r']
        if w < 4 or h < 4: continue
        bx = (int(x * dpr), int(y * dpr), int(min(W, (x + w) * dpr)), int(min(H, (y + h) * dpr)))
        if bx[2] - bx[0] < 3 or bx[3] - bx[1] < 3: continue
        px = list(im.crop(bx).resize((max(1, (bx[2] - bx[0]) // 3), max(1, (bx[3] - bx[1]) // 3))).getdata())
        tc = t['c']; uz = [q for q in px if sum((q[i] - tc[i]) ** 2 for i in range(3)) > 60 ** 2]
        if len(uz) < max(4, len(px) * 0.25): continue
        uz.sort(key=lum); bg = uz[len(uz) // 2]
        o = oran(tc, bg); buyuk = t['fs'] >= 18 or (t['fs'] >= 14 and t.get('fw', 400) >= 700); esik = 3 if buyuk else 4.5
        tum.append(o)
        if o < esik: bul.append({'yazi': t['t'], 'oge': t['a'], 'renk': tc, 'zemin': list(bg), 'oran': round(o, 2), 'esik': esik, 'px': t['fs']})
    out['ekranlar'].append({'no': k['no'], 'ekran': k['beklenen'], 'dusuk_kontrast': bul})
out['ozet'] = {'olculen_yazi': len(tum), 'ortalama_oran': round(sum(tum) / max(1, len(tum)), 2), 'esik_alti': sum(len(e['dusuk_kontrast']) for e in out['ekranlar'])}
json.dump(out, open(os.path.join(D, '_kontrast.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(C['race'], out['ozet'])
