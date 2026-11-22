# 22 Kas — GPT 2340 teslimi: kral portreleri (volgar, edran), dört hikâye karesi (yemin-1..4) ve Diyar Haritası
# → js/hikaye-png.js (WebP base64; ilk kullanımda Blob URL). Yayın dosya sınırı yüzünden ayrı dosya yok.
# Kullanım: python3 hikaye-gom.py <oyun-son>
import sys, io, base64
from PIL import Image
R = sys.argv[1]; G = R + '/_tasarim/gelen/p2340/'
IS = {'volgar': ('volgar.webp', 384, 84), 'edran': ('edran.webp', 384, 84),
      **{f'yemin-{i}': (f'hikaye/yemin-{i}.webp', 1800, 72) for i in range(1, 5)},
      'diyar': ('../sehir-2340/diyar.webp', 2340, 78)}
D = {}
for k, (f, w, q) in IS.items():
    im = Image.open(G + f).convert('RGB')
    if im.width > w: im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, 'WEBP', quality=q, method=6); D[k] = base64.b64encode(b.getvalue()).decode()
js = ('// OTOMATİK ÜRETİLİR (_tasarim/araclar/hikaye-gom.py) — elle düzenleme. GPT 2340 teslimi: kral portreleri, dört hikâye karesi\n'
      '// (köprü, yemin, bozulan mühür, şafakta karşılaşma) ve Diyar Haritası. WebP base64; ilk kullanımda Blob URL.\n'
      'const D = {\n' + ''.join(f'"{k}":"{v}",\n' for k, v in D.items()) + '};\nconst U = {};\n'
      "export const url = k => { if (U[k]) return U[k]; const s = D[k]; if (!s) return null;\n"
      "  try { const b = atob(s), a = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return (U[k] = URL.createObjectURL(new Blob([a], { type: 'image/webp' }))); }\n"
      "  catch { return (U[k] = 'data:image/webp;base64,' + s); } };\n")
open(R + '/js/hikaye-png.js', 'w').write(js); print({k: len(v) * 3 // 4 // 1024 for k, v in D.items()}, 'KB')
