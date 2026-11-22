# 22 Kas — GPT 2340×1080 teslimi savaş parçaları: v31-sablon.css içindeki url("@ad") yer tutucularını
# _tasarim/gelen/p2340/parcalar/<ad>.png → WebP data: URI olarak gömüp css/v31-savas-hud.css yazar (yayın dosya sınırı).
# Kullanım: python3 v31-gom.py <oyun-son>  (v31-sablon → css/v31-savas-hud.css ve v32-sablon → css/v32-p2340.css)
import sys, re, base64, io
from PIL import Image
R = sys.argv[1]
cache = {}
def gom(m):
    ad = m.group(1)
    if ad not in cache:
        im = Image.open(f'{R}/_tasarim/gelen/p2340/parcalar/{ad}.png').convert('RGBA')
        b = io.BytesIO(); im.save(b, 'WEBP', quality=88, method=6)
        cache[ad] = 'url("data:image/webp;base64,' + base64.b64encode(b.getvalue()).decode() + '")'
    return cache[ad]
for sab, cik in (('v31-sablon.css', 'v31-savas-hud.css'), ('v32-sablon.css', 'v32-p2340.css')):
    T = open(R + '/_tasarim/araclar/' + sab, encoding='utf-8').read(); n0 = len(cache)
    out = re.sub(r'url\("@([\w-]+)"\)', gom, T)
    out = f'/* OTOMATİK ÜRETİLİR: _tasarim/araclar/v31-gom.py (kaynak {sab}) — elle düzenleme */\n' + out
    open(R + '/css/' + cik, 'w', encoding='utf-8').write(out); print(cik, len(out) // 1024, 'KB')
