# Savaş arka planlarını (ikişer üst üste 5 WebP) tek JS modülüne gömer: js/savas-arka-png.js (OTOMATİK, elle düzenleme).
# Sebep: yayın sürüm başına 511 dosya sınırı. Kullanım: python3 -I savas-arka-gom.py <webp klasörü> <oyun-son>
import sys, os, base64
src, dst = sys.argv[1], sys.argv[2]
out = ['// OTOMATİK: _tasarim/araclar/savas-arka-gom.py üretir (kaynak _tasarim/gelen/savas-arka/webp). Elle düzenleme.',
       '// Savaş arka planları: dosya no → WebP (ikişer resim üst üste). savas-arka.js ilk savaşta yükler.', 'export const PNG = {']
for n in range(1, 6):
    b = base64.b64encode(open(os.path.join(src, f'arka-{n}.webp'), 'rb').read()).decode()
    out.append(f'  {n}: "{b}",')
out.append('};')
p = os.path.join(dst, 'js', 'savas-arka-png.js'); open(p, 'w').write('\n'.join(out) + '\n'); print(p, os.path.getsize(p) // 1024, 'KB')
