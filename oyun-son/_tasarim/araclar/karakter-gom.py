# 22 Kas — GPT "VAHRAN Claude Devir" (4 parça) karakter paketi → js/karakter-png.js (OTOMATİK).
# 16 tam boy (05_OYUN_ICIN_OPTIMIZE_512x768, kaynak 01_KARAKTERLER; manifest.json eşleme kaynağı) + 20 yüz (02_YUZLER).
# WebP base64 (yayın dosya sınırı); görünür sınır (alfa > 24) burada ölçülür: ayak hizası ve ölçek için.
# Kullanım: python3 -I karakter-gom.py <oyun-son>
import sys, json, base64, io, os
from PIL import Image
R = sys.argv[1]; K = R + '/_tasarim/gelen/karakter-son'
M = json.load(open(K + '/05_OYUN_ICIN_OPTIMIZE_512x768/manifest.json', encoding='utf-8'))
FR = {'elentha': 'sancak', 'kragmir': 'ocak'}; CL = {'savasci': 'warrior', 'suikastci': 'rogue', 'buyucu': 'mage', 'rahip': 'priest'}; GE = {'erkek': 'm', 'kadin': 'f'}
def webp(im, q):
    b = io.BytesIO(); im.save(b, 'WEBP', quality=q, method=6, alpha_quality=90); return base64.b64encode(b.getvalue()).decode()
# Kullanıcı kararı (22 Kas gece): 09_SECILI_16_KARAKTER'deki 3 "YENİ ADAY - ONAYSIZ" görsel ana setin yerine kullanılır
# (1024×1536 → 512×768 LANCZOS; alfası en çok 254 olduğundan 254 → 255 tamamlanır). Sanat onayı hâlâ yok.
ADAY = {'elentha_savasci_kadin', 'kragmir_savasci_erkek', 'kragmir_buyucu_kadin'}
D, BOX = {}, {}
for s in M['sprites']:
    key = f"{FR[s['faction']]}.{CL[s['class']]}.{GE[s['gender']]}"
    if s['id'] in ADAY:
        im = Image.open(f"{K}/09_SECILI_16_KARAKTER/{s['id']}.png").convert('RGBA').resize((512, 768), Image.LANCZOS)
        r, g, b, a = im.split(); im = Image.merge('RGBA', (r, g, b, a.point(lambda v: 255 if v >= 250 else v)))
    else:
        im = Image.open(K + '/' + s['optimized']).convert('RGBA')
    # 23 Kas (kullanıcı kararı: savaşçı kılıç + kalkan): savaşçılar GPT G1/G2 bekleme pozundan (b2d-gom.py hazırlar)
    gs = f"{R}/_tasarim/gelen/g1g2-savasci/{FR[s['faction']]}-savasci-{s['gender']}.png"
    if s['class'] == 'savasci' and os.path.exists(gs): im = Image.open(gs).convert('RGBA')
    # 23 Kas (M1 ek): Kragmir yeşil tenle yeniden çizildi (_tasarim/gelen/kragmir-yesil/, 720×1080 → 512×768); savaşçı yine G1/G2'den
    ky = f"{R}/_tasarim/gelen/kragmir-yesil/{s['id']}.webp"
    if s['faction'] == 'kragmir' and s['class'] != 'savasci' and os.path.exists(ky): im = Image.open(ky).convert('RGBA').resize((512, 768), Image.LANCZOS)
    bb = im.getchannel('A').point(lambda v: 255 if v > 24 else 0).getbbox()
    D[key] = webp(im, 84); BOX[key] = list(bb)
assert len(D) == 16, len(D)
for f in ('elentha', 'kragmir'):
    for g in ('erkek', 'kadin'):
        for i in range(1, 6):
            im = Image.open(f'{K}/02_YUZLER/{f}_{g}_yuz_{i:02d}.png').convert('RGB').resize((176, 176), Image.LANCZOS)
            if f == 'kragmir':  # 23 Kas: yeşil tenli sınıf yüzleri (yuva 0-3 savaşçı, suikastçı, büyücü, rahip; 4 = savaşçının aynası)
                c = ['savasci', 'suikastci', 'buyucu', 'rahip', 'savasci'][i - 1]
                y = Image.open(f'{R}/_tasarim/gelen/kragmir-yesil/kragmir_{c}_{g}_yuz.png').convert('RGBA')
                z = Image.new('RGBA', y.size, (36, 22, 14, 255)); z.alpha_composite(y)
                im = z.convert('RGB').resize((176, 176), Image.LANCZOS)
                if i == 5: im = im.transpose(Image.FLIP_LEFT_RIGHT)
            D[f'yuz.{FR[f]}.{GE[g]}.{i - 1}'] = webp(im, 82)
out = ['// OTOMATİK ÜRETİLİR (_tasarim/araclar/karakter-gom.py) — elle düzenleme. GPT "VAHRAN Claude Devir" karakter paketi:',
       '// 16 tam boy 2B seçim görseli (512×768; anahtar ırk.sınıf.cinsiyet) + 20 yüz portresi (yuz.ırk.cinsiyet.yüz). SANAT ONAYI BEKLİYOR.',
       '// BOX: görünür alfa sınırı [x0, y0, x1, y1] (512×768 tuvalde) — ayak hizası y1.',
       'export const BOX = ' + json.dumps(BOX, separators=(',', ':')) + ';', 'const D = {']
out += [f'"{k}":"{v}",' for k, v in D.items()]
out += ['};', 'const U = {};',
        'const url = k => { if (U[k]) return U[k]; const s = D[k]; if (!s) return null;',
        '  try { const b = atob(s), a = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return (U[k] = URL.createObjectURL(new Blob([a], { type: "image/webp" }))); }',
        '  catch { return (U[k] = "data:image/webp;base64," + s); } };',
        "const r_ = r => (r === 'ocak' ? 'ocak' : 'sancak'), g_ = g => (g === 'f' ? 'f' : 'm');",
        '// Tam boy: ırk (sancak|ocak), sınıf (warrior|rogue|mage|priest), cinsiyet (m|f)',
        "export const sprKey = (race, cls, g) => `${r_(race)}.${D[`${r_(race)}.${cls}.m`] ? cls : 'warrior'}.${g_(g)}`;",
        'export const sprUrl = (race, cls, g) => url(sprKey(race, cls, g));',
        'export const sprBox = (race, cls, g) => BOX[sprKey(race, cls, g)];',
        '// Yüz portresi: oyundaki yüz seçeneği (shared/gorunus.js FACES, 0-4) ile birebir',
        "export const yuzUrl = (race, g, face) => url(`yuz.${r_(race)}.${g_(g)}.${Math.max(0, Math.min(4, face | 0))}`);",
        'export const KEYS = Object.keys(D);']
open(R + '/js/karakter-png.js', 'w', encoding='utf-8').write('\n'.join(out) + '\n')
print('karakter-png.js', sum(len(v) for v in D.values()) // 1024, 'KB', BOX)
