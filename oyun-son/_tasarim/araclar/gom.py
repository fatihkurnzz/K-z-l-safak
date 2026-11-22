# Genel gömme aracı: görselleri WebP base64 olarak tek bir JS modülüne yazar (yayın 511 dosya sınırı için).
# Kullanım: python3 -I gom.py <tarif.json> <çıktı.js>
# tarif.json: {"aciklama": "...", "q": 80, "ogeler": [{"k": "anahtar", "src": "yol.png", "w": 540, "h": 720, "fit": "cover|contain|stretch"}]}
#   w/h verilmezse ölçü korunur; yalnız biri verilirse oran korunur.
# Çıktı: export const KEYS, url(k) → Blob URL (ilk kullanımda üretilir), has(k)
import sys, io, json, base64, os
from PIL import Image

T = json.load(open(sys.argv[1])); OUT = sys.argv[2]
q = T.get('q', 80)
satir = []
for o in T['ogeler']:
    im = Image.open(o['src']); im.load()
    alfa = im.mode in ('RGBA', 'LA') or 'transparency' in im.info
    im = im.convert('RGBA' if alfa else 'RGB')
    w, h = o.get('w'), o.get('h')
    if w and not h: h = round(im.height * w / im.width)
    if h and not w: w = round(im.width * h / im.height)
    if w and h and (w, h) != im.size:
        if o.get('fit') == 'cover':
            k = max(w / im.width, h / im.height); im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
            x, y = (im.width - w) // 2, (im.height - h) // 2; im = im.crop((x, y, x + w, y + h))
        else:
            im = im.resize((w, h), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, 'WEBP', quality=o.get('q', q), method=6, **({'alpha_quality': 90} if alfa else {}))
    satir.append(f'"{o["k"]}":"{base64.b64encode(b.getvalue()).decode()}"')
with open(OUT, 'w') as f:
    f.write(f'// OTOMATİK ÜRETİLİR (_tasarim/araclar/gom.py) — elle düzenleme. {T.get("aciklama", "")}\n')
    f.write('const D = {\n' + ',\n'.join(satir) + '\n};\n')
    f.write('''const U = {};
export const KEYS = Object.keys(D);
export const has = k => !!D[k];
export const url = k => { if (U[k]) return U[k]; const s = D[k]; if (!s) return null;
  try { const b = atob(s), a = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return (U[k] = URL.createObjectURL(new Blob([a], { type: 'image/webp' }))); }
  catch { return (U[k] = 'data:image/webp;base64,' + s); } };
''')
print(OUT, os.path.getsize(OUT) // 1024, 'KB,', len(satir), 'öğe')
