# 23 Kas — GPT G7 efekt şeritleri (16 kare × 256 px, gerçek alfa) → js/vfx-png.js içindeki karşılık gelen anahtarlar değiştirilir.
# Oyunun şerit sistemi (fx.js) 12 kare × 24 fps (0.5 sn) bekler: 16 kareden eşit aralıklı 12'si seçilir, kare 160 px'e küçültülür.
# Kullanım: python3 -I vfx-g7-gom.py <G7 klasörü> <oyun-son>
# Değiştirilmeyenler (eski Paket 4): arc, blast, burst, crystal, mote, orb, orbit, shard, zap (G7'de karşılığı yok ya da yönü uymuyor:
# şimşek şeridi çapraz çizilmiş; fx.js zap'ı iki nokta arasına gerer).
import sys, io, re, base64
from PIL import Image
G7, R = sys.argv[1], sys.argv[2]
ESLE = {'fireball': 'ates-topu', 'flame': 'alev', 'shatter': 'buz-kirilma', 'drip': 'zehir', 'spark': 'vurus', 'critHit': 'kritik-vurus',
        'heal': 'sifa', 'dome': 'kalkan-kubbe', 'bossEntrance': 'boss-giris', 'dissolve': 'parcalanma'}
F = 160
yol = R + '/js/vfx-png.js'; s = open(yol).read()
for k, ad in ESLE.items():
    im = Image.open(f'{G7}/vfx-{ad}.png').convert('RGBA'); n = im.width // 256
    sec = [round(i * (n - 1) / 11) for i in range(12)]
    out = Image.new('RGBA', (F * 12, F))
    for j, i in enumerate(sec): out.paste(im.crop((i * 256, 0, i * 256 + 256, 256)).resize((F, F), Image.LANCZOS), (j * F, 0))
    b = io.BytesIO(); out.save(b, 'WEBP', quality=80, method=6, alpha_quality=90)
    v = base64.b64encode(b.getvalue()).decode()
    s, c = re.subn(r'^"' + k + r'":"[^"]*"', f'"{k}":"{v}"', s, flags=re.M)
    assert c == 1, k
s = s.replace('GPT Paket 4 savaş efekt şeritleri (12 kare × 24 fps).', 'GPT Paket 4 savaş efekt şeritleri (12 kare × 24 fps); 23 Kas: 10 şerit GPT G7 (vfx-g7-gom.py).', 1)
open(yol, 'w').write(s); print('tamam', len(s) // 1024, 'KB')
