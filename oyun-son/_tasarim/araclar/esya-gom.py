# GPT Paket 2 eşya simgelerini oyuna gömer: esya/*.png (256 RGBA) → 128 px WebP → base64 → js/esya-png.js
# (yayın 511 dosya sınırında olduğu için tek modül; tarayıcıda Blob URL'ye çevrilir). Kullanım:
#   python3 -I esya-gom.py <paket_klasörü (esya/ + esleme.json)> <oyun-son> [boyut=128] [kalite=88]
import sys, os, io, json, base64
from PIL import Image
P, G = sys.argv[1], sys.argv[2]
N = int(sys.argv[3]) if len(sys.argv) > 3 else 128
Q = int(sys.argv[4]) if len(sys.argv) > 4 else 88
es = json.load(open(os.path.join(P, 'esleme.json')))
files = sorted(os.listdir(os.path.join(P, 'esya')))
data, top = {}, 0
for f in files:
    im = Image.open(os.path.join(P, 'esya', f)).convert('RGBA').resize((N, N), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, 'WEBP', quality=Q, method=6); top += b.tell()
    data[f[5:-4]] = base64.b64encode(b.getvalue()).decode()  # 'esya-sword-k1.png' → 'sword-k1'
map_ = {k: v[5:-4] for k, v in sorted(es.items())}
out = ['// OTOMATİK ÜRETİLİR (_tasarim/araclar/esya-gom.py) — elle düzenleme. GPT Paket 2 eşya simgeleri (VAHRAN Çanta ve Kervan).',
       f'// {len(data)} simge, {N} px WebP, base64; ilk kullanımda Blob URL\'ye çevrilir. MAP: eşya tabanı (items.js) → simge adı.',
       'export const MAP = ' + json.dumps(map_, separators=(',', ':')) + ';',
       'const D = {']
out += [f'"{k}":"{v}",' for k, v in data.items()]
out += ['};',
        'const U = {};',
        '// Simge adının (ör. "sword-k4", "iksir-can") Blob URL\'si; yoksa null',
        'export const esyaUrl = ad => { if (U[ad]) return U[ad]; const s = D[ad]; if (!s) return null;',
        '  try { const b = atob(s), a = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return (U[ad] = URL.createObjectURL(new Blob([a], { type: \'image/webp\' }))); }',
        '  catch { return (U[ad] = \'data:image/webp;base64,\' + s); } };',
        'export const ESYA_ADLARI = Object.keys(D);', '']
open(os.path.join(G, 'js', 'esya-png.js'), 'w').write('\n'.join(out))
print(len(data), 'simge,', top // 1024, 'KB webp')
