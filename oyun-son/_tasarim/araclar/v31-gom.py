# 22 Kas — GPT 2340×1080 teslimi savaş parçaları: v31-sablon.css içindeki url("@ad") yer tutucularını
# _tasarim/gelen/p2340/parcalar/<ad>.png → WebP data: URI olarak gömüp css/v31-savas-hud.css yazar (yayın dosya sınırı).
# Kullanım: python3 v31-gom.py <oyun-son>
import sys, re, base64, io
from PIL import Image
R = sys.argv[1]; T = open(R + '/_tasarim/araclar/v31-sablon.css', encoding='utf-8').read()
cache = {}
def gom(m):
    ad = m.group(1)
    if ad not in cache:
        im = Image.open(f'{R}/_tasarim/gelen/p2340/parcalar/{ad}.png').convert('RGBA')
        b = io.BytesIO(); im.save(b, 'WEBP', quality=88, method=6)
        cache[ad] = 'url("data:image/webp;base64,' + base64.b64encode(b.getvalue()).decode() + '")'
    return cache[ad]
out = re.sub(r'url\("@([\w-]+)"\)', gom, T)
out = '/* OTOMATİK ÜRETİLİR: _tasarim/araclar/v31-gom.py (kaynak v31-sablon.css) — elle düzenleme */\n' + out
open(R + '/css/v31-savas-hud.css', 'w', encoding='utf-8').write(out); print(len(cache), 'görsel,', len(out) // 1024, 'KB')
