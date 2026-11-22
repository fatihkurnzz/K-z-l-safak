# 22 Kas — karakter ekranları paketi: v33-sablon.css içindeki url("@ad") yer tutucularını
# _tasarim/gelen/karakter-ekran/assets/arayuz/<ad>.png (ya da ikon/) → WebP data: URI olarak gömüp css/v33-karakter.css yazar.
# Kullanım: python3 v33-gom.py <oyun-son>
import sys, re, base64, io, os
from PIL import Image
R = sys.argv[1]; K = R + '/_tasarim/gelen/karakter-ekran/assets'
YOL = {'ik-elentha': K + '/ikon/elentha.png', 'ik-kragmir': K + '/ikon/kragmir.png', 'ik-zar': K + '/ikon/zar.png',
       # 22 Kas akşam — 'Karakter Kararlı Devir v2': başlık levhası ve sınıf simgeleri
       'levha-ocak': R + '/_tasarim/gelen/karakter-v2/arayuz/baslik-levha-ocak.png', 'levha-sancak': R + '/_tasarim/gelen/karakter-v2/arayuz/baslik-levha-sancak.png', 's-warrior': R + '/_tasarim/gelen/karakter-v2/arayuz/sinif-warrior.png', 's-rogue': R + '/_tasarim/gelen/karakter-v2/arayuz/sinif-rogue.png', 's-priest': R + '/_tasarim/gelen/karakter-v2/arayuz/sinif-priest.png', 's-mage': R + '/_tasarim/gelen/karakter-v2/arayuz/sinif-mage.png'}
def gom(m):
    ad = m.group(1); f = YOL.get(ad, f'{K}/arayuz/{ad}.png')
    b = io.BytesIO(); Image.open(f).convert('RGBA').save(b, 'WEBP', quality=90, method=6)
    return 'url("data:image/webp;base64,' + base64.b64encode(b.getvalue()).decode() + '")'
T = open(R + '/_tasarim/araclar/v33-sablon.css', encoding='utf-8').read()
out = '/* OTOMATİK ÜRETİLİR: _tasarim/araclar/v33-gom.py (kaynak v33-sablon.css) — elle düzenleme */\n' + re.sub(r'url\("@([\w-]+)"\)', gom, T)
open(R + '/css/v33-karakter.css', 'w', encoding='utf-8').write(out); print('v33-karakter.css', len(out) // 1024, 'KB')
