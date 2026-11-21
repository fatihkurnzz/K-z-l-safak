"""GPT Vahran teslimini oyuna hazırlar: arka plan WebP, bina kesitleri, dokunma kimlik haritası ve js/hub2d-data.js.
Kullanım: python3 kur.py <gelen/ac> <cikti (maske.py çıktıları)> <oyun-son>
"""
import sys, json, os, shutil
import numpy as np
from PIL import Image
from scipy import ndimage as nd

G, C, O = sys.argv[1:4]
SAHNE = {
    'ocak': (f'{G}/V1_Kragmir/harita/Sehir_Nihai.png', f'{G}/V1_Kragmir/harita/Bos_Sehir_Zemini.png'),
    'sancak': (f'{G}/V2_Elentha/harita/Sehir_Nihai.png', f'{G}/V2_Elentha/harita/Bos_Sehir_Zemini.png'),
    'carsi': (f'{G}/V1_5_Ortak_Carsi/harita/V1_5_Ortak_Carsi_Nihai_Sahne.png', f'{G}/V1_5_Ortak_Carsi/harita/V1_5_Bos_Alanli_Harita.png'),
}
# GPT bina kimliği → oyundaki bina kimliği (ui-hub.js BUILDINGS / CARSI)
ESLE = {
    'ocak': {'01_Kale': 'clanhq', '02_Mabet': 'monument', '03_Buyu_Kulesi': 'wheel', '04_Demirci': 'anvil', '05_Pazar': 'iksir',
             '06_Egitim_Alani': 'gate', '07_Lonca_Binasi': 'karaborsa', '08_Tapinak': 'king', '09_Kaynak_Binasi': 'mine', 'Teleport': 'carsi'},
    'carsi': {'01_Esya_Pazari': 'pazar', '02_Silah_Zirh_Tuccari': 'tuccar', '03_Taki_Dukkani': 'yashka', '04_Balikcilik': 'pier',
              '05_Karaborsa': 'karaborsa', '06_Teleport': 'carsi'},
}
ESLE['sancak'] = ESLE['ocak']
# gündüz sahneleri için elle konmuş ışıklar [x, y, yarıçap] (1536×1024 sahne pikseli)
ELLE = {
    'sancak': {'ates': [[504, 858, 34], [1016, 858, 34], [236, 474, 30], [790, 172, 14]], 'buz': [[768, 440, 46], [768, 505, 30]]},
    'carsi': {'ates': [[413, 290, 24], [1110, 330, 16], [1300, 540, 14], [180, 690, 14]], 'buz': [[768, 425, 48], [768, 505, 34]]},
}
HIT = 4  # kimlik haritası küçültme oranı
veri = {}
for yer, (nihai, zemin) in SAHNE.items():
    hedef = f'{O}/img/kd/sehir/{yer}'
    os.makedirs(hedef, exist_ok=True)
    M = json.load(open(f'{C}/{yer}/maske.json'))
    W, H = M['size']
    Image.open(nihai).convert('RGB').save(f'{hedef}/sahne.webp', 'WEBP', quality=84, method=6)
    # dokunma kimlik haritası: her binanın maskesi (fark) 1/HIT ölçekte, R kanalı = sıra+1
    A = np.asarray(Image.open(nihai).convert('RGB')).astype(np.int16)
    B = np.asarray(Image.open(zemin).convert('RGB')).astype(np.int16)
    m = np.abs(A - B).max(axis=2) > 28
    m = nd.binary_closing(nd.binary_opening(m, iterations=1), iterations=4)
    m = nd.binary_fill_holes(nd.binary_dilation(m, iterations=6))  # parmak payı
    idmap = np.zeros((H, W), np.uint8)
    bina = {}
    for i, (gid, oid) in enumerate(ESLE[yer].items()):
        it = M['items'][gid]
        x0, y0, x1, y1 = it['box']
        shutil.copy(f'{C}/{yer}/{it["file"]}', f'{hedef}/{oid}.webp')
        sub = np.zeros_like(m); sub[y0:y1, x0:x1] = m[y0:y1, x0:x1]
        idmap[sub & (idmap == 0)] = i + 1
        bina[oid] = {'box': it['box'], 'label': it['label']}
    Image.fromarray(idmap).resize((W // HIT, H // HIT), Image.NEAREST).save(f'{hedef}/hit.png', optimize=True)
    # ışık noktaları: alev (sıcak) ve kristal (soğuk) pikselleri kümelenir; oyunda titreşen parıltı olarak çizilir
    R, Gc, Bc = A[..., 0], A[..., 1], A[..., 2]
    isik = {}
    Hh = np.arange(H)[:, None] > H * 0.12  # gökyüzü şeridi hariç
    sicak = (R > 235) & (Gc > 140) & (Bc < 110) & (R - Bc > 150)
    akkor = (R > 250) & (Gc > 225) & (Bc > 150)  # alevin beyaz-sıcak çekirdeği (altın işlemede olmaz)
    soguk = (Bc > 235) & (R < 110) & (Bc - R > 140) & Hh
    buzc = (Bc > 250) & (Gc > 235) & (R > 170) & Hh
    for ad, k, cek, en in (('ates', sicak | akkor, akkor, 3), ('buz', soguk | buzc, buzc, 3)):
        k = nd.binary_dilation(k, iterations=2)
        lb, n = nd.label(k)
        if not n: isik[ad] = []; continue
        idx = range(1, n + 1)
        sz = nd.sum(k, lb, idx); cs = nd.sum(cek, lb, idx); cm = nd.center_of_mass(k, lb, idx)
        top = sorted([(int(s_), c) for s_, c_, c in zip(sz, cs, cm) if s_ >= 14 and c_ >= en and s_ < 6000], key=lambda t: -t[0])[:36]
        isik[ad] = [[int(c[1]), int(c[0]), int(min(60, 6 + s_ ** .5 * 1.6))] for s_, c in top]
    if yer in ELLE: isik = ELLE[yer]  # gün ışığı sahnelerinde parlak taş/işleme alev sanılıyor: elle
    veri[yer] = {'size': [W, H], 'ids': list(ESLE[yer].values()), 'b': bina, 'isik': isik}

js = ('// OTOMATİK ÜRETİLDİ (_tasarim/araclar/kur.py): GPT "Vahran Perspektif Son Teslim" sahneleri.\n'
      '// size: sahne pikseli · ids: hit.png R değeri-1 → oyundaki bina kimliği · b: kutu [sol,üst,sağ,alt] ve etiket noktası [x,y] (bina tepesi)\n'
      f'export const HIT_SCALE = {HIT};\nexport const SAHNE = ' + json.dumps(veri, separators=(',', ':')) + ';\n')
open(f'{O}/js/hub2d-data.js', 'w', encoding='utf-8').write(js)
print('tamam', {k: len(v['ids']) for k, v in veri.items()})
