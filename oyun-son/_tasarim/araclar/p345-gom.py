# GPT Paket 3 (portreler), Paket 4 (savaş efekt şeritleri) ve Paket 5 (nesne grafikleri) görsellerini oyuna gömer.
# Yayın 511 dosya sınırında olduğu için her grup tek JS modülüdür (WebP → base64; tarayıcıda Blob URL'ye çevrilir).
# Kullanım:  python3 -I p345-gom.py <paket3_klasörü> <paket4_klasörü> <paket5_klasörü> <oyun-son>
# Çıktı: js/portre-png.js, js/vfx-png.js, js/grafik5-png.js  (OTOMATİK — elle düzenleme)
import sys, os, io, json, base64
from PIL import Image

P3, P4, P5, G = sys.argv[1:5]
SINIF = ['warrior', 'rogue', 'mage', 'priest']
HALK = ['ocak', 'sancak']


def webp(im, q=82):
    b = io.BytesIO(); im.save(b, 'WEBP', quality=q, method=6); return b.getvalue()


def modul(ad, baslik, veri, ek=''):
    top = sum(len(v) for v in veri.values())
    out = [f'// OTOMATİK ÜRETİLİR (_tasarim/araclar/p345-gom.py) — elle düzenleme. {baslik}',
           f'// {len(veri)} görsel, WebP base64 ({top // 1024} KB); ilk kullanımda Blob URL\'ye çevrilir.',
           'const D = {']
    out += [f'"{k}":"{base64.b64encode(v).decode()}",' for k, v in veri.items()]
    out += ['};', 'const U = {};',
            '// Anahtarın Blob URL\'si; yoksa null',
            'export const url = k => { if (U[k]) return U[k]; const s = D[k]; if (!s) return null;',
            '  try { const b = atob(s), a = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return (U[k] = URL.createObjectURL(new Blob([a], { type: \'image/webp\' }))); }',
            '  catch { return (U[k] = \'data:image/webp;base64,\' + s); } };',
            'export const KEYS = Object.keys(D);', ek, '']
    open(os.path.join(G, 'js', ad), 'w').write('\n'.join(out))
    print(ad, len(veri), 'görsel,', top // 1024, 'KB')


# ---- Paket 3: portreler ----
# "sınıf.halk" = küçük büst (192), "sınıf.halk:f" = tam boy (300×400), "art.sınıf.halk" = kadro (450×600)
pr = {}
for c in SINIF:
    for h in HALK:
        pr[f'{c}.{h}'] = webp(Image.open(f'{P3}/portre/portre-{c}-{h}.webp').convert('RGB').resize((192, 192), Image.LANCZOS), 84)
        pr[f'{c}.{h}:f'] = webp(Image.open(f'{P3}/portre/tam-boy-{c}-{h}.webp').convert('RGB').resize((300, 400), Image.LANCZOS), 82)
        pr[f'art.{c}.{h}'] = webp(Image.open(f'{P3}/portre/kadro-{c}-{h}.webp').convert('RGB').resize((450, 600), Image.LANCZOS), 82)
modul('portre-png.js', 'GPT Paket 3 kahraman portreleri (sınıf × halk).', pr)

# ---- Paket 4: efekt şeritleri (12 kare, soldan sağa) ----
F = 160
kay = json.load(open(f'{P4}/Efektler/KAYNAKLAR.json'))
yol = {}
for r in (kay if isinstance(kay, list) else kay.get('kaynaklar') or kay.get('dosyalar') or list(kay.values())):
    if isinstance(r, dict):
        k = r.get('kod_anahtari') or r.get('anahtar') or r.get('kod') or r.get('key')
        p = r.get('yol') or r.get('dosya') or r.get('path')
        if k and p: yol[k] = p
if len(yol) < 19:  # MANIFEST.md tablosundan
    for ln in open(f'{P4}/Efektler/MANIFEST.md'):
        s = [x.strip(' `') for x in ln.split('|')]
        if len(s) > 3 and s[2].startswith('vfx/'): yol[s[1]] = s[2]
vf = {}
for k, p in sorted(yol.items()):
    im = Image.open(f'{P4}/Efektler/{p}').convert('RGBA')
    assert im.size == (3072, 256), (p, im.size)
    vf[k] = webp(im.resize((F * 12, F), Image.LANCZOS), 80)
modul('vfx-png.js', 'GPT Paket 4 savaş efekt şeritleri (12 kare × 24 fps).', vf, f'export const FRAME = {F}, FRAMES = 12;')

# ---- Paket 5: nesne grafikleri ----
g5 = {}
for n in ['ors', 'pusula', 'defter', 'mektup', 'makara', 'fener']:
    g5[n] = webp(Image.open(f'{P5}/grafik/{n}.png').convert('RGBA').resize((192, 192), Image.LANCZOS), 84)
for h in HALK:
    g5[f'flama-{h}'] = webp(Image.open(f'{P5}/grafik/merkez-flama-{h}.png').convert('RGBA').resize((176, 240), Image.LANCZOS), 84)
for n in ['kor', 'ayaz', 'simsek']:
    im = Image.open(f'{P5}/grafik/simge-parca-{n}.png').convert('RGBA')
    a = im.getchannel('A').point(lambda v: 0 if v < 48 else min(255, (v - 48) * 255 // 160))  # Kor'daki soluk kutu (alfa ~5–40) temizlenir
    im.putalpha(a)
    g5[f'parca-{n}'] = webp(im.resize((160, 160), Image.LANCZOS), 86)
# sandik-acilis.png kullanılmıyor: çevrimdışı ödül sandığı 19 Kas'ta oyundan kaldırıldı (ui.js)
modul('grafik5-png.js', 'GPT Paket 5 nesne grafikleri (örs, pusula, defter, mektup, makara, fener, flamalar, Kader Çarkı parçaları).', g5)
