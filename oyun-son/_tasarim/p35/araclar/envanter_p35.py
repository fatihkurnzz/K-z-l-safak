# P35-UI: V42 gerçek ekran envanteri üretir.
# python3 -I envanter_p35.py <cek42 kökü> <v41 kökü> <ekran_envanteri.json> <kumeler.json> <çıktı klasörü>
#  cek42 kökü: içinde cek115-ocak / cek115-sancak (V42 çekimi, 880×406 mantıksal, dpr 2,66 = 2341×1080)
#  v41 kökü  : içinde cek115-ocak / cek115-sancak (önceki çekim; Gemini KABUL2 paketinde teslim edildi)
import sys, os, json, re, hashlib
import numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ekran_meta import M
C42, C41, ENV, KUME, OUT = sys.argv[1:6]
os.makedirs(OUT, exist_ok=True)
KUMELER = json.load(open(KUME))
ENVJ = json.load(open(ENV))
ACTS = {x['eylem']: x for x in ENVJ['eylemler']}
HALK = {'elentha': 'sancak', 'kragmir': 'ocak'}  # dosya klasörü adı ↔ halk
GRP = {'GIRIS': 'Giriş ve hesap', 'HUB': 'Ana ekran / dünya', 'KARAKTER': 'Karakter', 'GOREV': 'Görevler ve Destan', 'ENVANTER': 'Envanter', 'TICARET': 'Ticaret ve dükkânlar',
       'DUNYA': 'Dünya ve etkinlikler', 'SAVAS': 'Savaş ve zindanlar', 'PVP': 'PvP, Meydan, sıralama', 'KLAN': 'Klan ve Otağ', 'SOSYAL': 'Sosyal', 'KALICILIK': 'Kalıcılık ve ödüller',
       'AYAR': 'Ayarlar', 'SISTEM': 'Sistem, menü, bildirim'}

def act_of(name):
    # çekim adından ACT adı: C-bag~x → bag
    m = re.match(r'C-([A-Za-z0-9]+)', name)
    return m.group(1) if m else None
def small(p):
    return np.asarray(Image.open(p).convert('L').resize((220, 101), Image.BILINEAR), dtype=np.float32)
def sha(p):
    return hashlib.sha256(open(p, 'rb').read()).hexdigest()

ekranlar = []; eksik_meta = []
for i, K in enumerate(KUMELER):
    can = K[0]
    meta = M.get(can)
    if not meta:
        eksik_meta.append(can); meta = ('SISTEM', can, '(üst veri eksik)')
    grup, ad, islev = meta
    kid = f'P35-S{i + 1:03d}'
    aliaslar = K[1:]
    # kaynak referansları: kümedeki bütün çekim adlarına karşılık gelen ACT'lerin kaynakları
    acts = []
    for n in K:
        a = act_of(n)
        if a and a not in acts: acts.append(a)
    kaynak = []; tur = None
    for a in acts:
        x = ACTS.get(a)
        if x:
            for k in x['kaynak']:
                if k not in kaynak: kaynak.append(k)
            tur = tur or x['tur']
    kayit = {'kimlik': kid, 'grup': grup, 'grup_adi': GRP[grup], 'ad': ad, 'islev': islev, 'kanonik_cekim': can, 'ayni_gorunen_cekimler': aliaslar,
             'acan_eylemler': acts, 'kaynak': kaynak, 'katman_turu': tur,
             'ust_ekran_cekim': can.split('~')[0] if '~' in can else None, 'goruntu': {}}
    for hk, kl in HALK.items():
        f42 = f'{C42}/cek115-{kl}/{can}.png'; f41 = f'{C41}/cek115-{kl}/{can}.png'
        g = {'v42_dosya': f'{kl}/{can}.png', 'v42_var': os.path.exists(f42)}
        if os.path.exists(f42) and os.path.exists(f41):
            d = float(np.abs(small(f42) - small(f41)).mean()); g['v41_ile_fark'] = round(d, 2); g['v41_durum'] = 'ayni' if d < 2.0 else 'degisti'
            g['v41_teslim_yolu'] = f'01_EKRANLAR_880x406/{hk}/{can}.webp'  # Gemini KABUL2 paketi (GPT'ye teslim EDİLMEDİ)
        else:
            g['v41_durum'] = 'v41de_yok'
        kayit['goruntu'][hk] = g
    ekranlar.append(kayit)

# grup sayıları
from collections import Counter
gs = Counter(e['grup'] for e in ekranlar)
ust = sum(1 for e in ekranlar if not e['ust_ekran_cekim']); alt = len(ekranlar) - ust
degisen = sum(1 for e in ekranlar if any(e['goruntu'][h].get('v41_durum') == 'degisti' for h in ('elentha', 'kragmir')))

# ---- görüntüsü olmayan ekran açan eylemler (kaynak koddan) ----
cekim_act = set(a for e in ekranlar for a in e['acan_eylemler'])
EKRAN_TUR = ('pencere', 'modal', 'bina katmanı', 'onay penceresi', 'onay penceresi + veri yazar', 'NPC diyaloğu', 'savaş / VS')
yok = []
for x in ENVJ['eylemler']:
    if x['tur'] in EKRAN_TUR and x['eylem'] not in cekim_act:
        yok.append({'eylem': x['eylem'], 'tur': x['tur'], 'kaynak': x['kaynak'], 'parametreli': x['parametreli'], 'okur': x['okur'], 'yazar': x['yazar']})
# bildirim ve yönlendirme eylemleri ayrı ek
bildirim = [{'eylem': x['eylem'], 'kaynak': x['kaynak']} for x in ENVJ['eylemler'] if x['tur'] == 'bildirim']
yonlendirme = [{'eylem': x['eylem'], 'kaynak': x['kaynak']} for x in ENVJ['eylemler'] if x['tur'].startswith('yönlendirme')]

OZET = {'surum': 'KORANT-v42-b9a0b21', 'cekim': 'V42 (cek115, 880x406 mantıksal, dpr 2.66 → 2341x1080), 26.11.2026', 'cekim_hesabi': 'Dev araçlarıyla yükseltilmiş TEST hesabı (Sv.53, bol eşya); ekrandaki sayılar oyun verisi DEĞİLDİR',
        'benzersiz_gorsel_durum': len(ekranlar), 'ust_ekran': ust, 'alt_durum_sekme_varyant': alt, 'v41_den_degisen_durum': degisen,
        'grup_dagilimi': {GRP[k]: v for k, v in gs.items()}, 'kaynak_ACT_tanimi': ENVJ['ozet']['kaynak_ACT_tanimi'], 'ekran_acan_eylem_toplam': ENVJ['ozet']['ekran_acan_eylem'],
        'cekimde_gorulen_ekran_acan_eylem': len([1 for x in ENVJ['eylemler'] if x['tur'] in EKRAN_TUR and x['eylem'] in cekim_act]),
        'goruntusu_olmayan_ekran_acan_eylem': len(yok), 'eksik_meta': eksik_meta}
json.dump({'ozet': OZET, 'ekranlar': ekranlar, 'goruntusu_olmayan_eylemler': yok, 'bildirim_eylemleri': bildirim, 'yonlendirme_eylemleri': yonlendirme}, open(f'{OUT}/ekran_envanteri.json', 'w'), ensure_ascii=False, indent=1)

# ---- Markdown ----
L = ['# P35-UI · V42 gerçek ekran envanteri', '',
     f'**Sürüm:** {OZET["surum"]} · **Çekim:** 880×406 mantıksal (dpr 2,66; 2341×1080) · iki halk', '',
     '> Ekran görüntüleri **dev araçlarıyla yükseltilmiş bir TEST hesabından** alındı (Sv.53, bol eşya). Görüntülerdeki sayı, ad ve eşyalar tasarım örneğidir; **gerçek oyun verisi sayılmaz**. Tasarımda hiçbir değer görsele gömülmeyecek.', '',
     '## Sayılar (karıştırma)', '',
     '| Ölçü | Sayı |', '|---|---:|',
     f'| Kaynak kodda ACT tanımı | {OZET["kaynak_ACT_tanimi"]} |', f'| Ekran açan eylem (kaynak koddan) | {OZET["ekran_acan_eylem_toplam"]} |',
     f'| Çekimde görülen ekran açan eylem | {OZET["cekimde_gorulen_ekran_acan_eylem"]} |', f'| **Görüntüsü OLMAYAN ekran açan eylem** | {OZET["goruntusu_olmayan_ekran_acan_eylem"]} |',
     f'| Görsel olarak benzersiz durum (iki halkta da aynı küme) | **{len(ekranlar)}** |', f'| — bunlardan üst ekran | {ust} |', f'| — bunlardan sekme/varyant (alt durum) | {alt} |',
     f'| V41’den görsel olarak değişen durum | {degisen} |', f'| Ham çekim dosyası (ekran görüntüsü) | 198 / halk |', '',
     '“Benzersiz durum” = iki halkta da piksel olarak aynı görünen çekimler tek sayıldı (ör. Meydan, Kapı→CZ-PK ve Meydan aynı pencerededir). 113, oyundaki TÜM ekranlar demek DEĞİLDİR: görüntüsü olmayan ekranlar bölüm 3’tedir.', '',
     '## 1. Benzersiz ekranlar (çekimle doğrulanmış)', '', 'Görüntü yolu: `03_EKRAN_GORUNTULERI/<halk>/<kanonik çekim>.webp` (1760×812 = 880×406 × 2). Halk: Elentha = `sancak`, Kragmir = `ocak`.', '']
for g in GRP:
    es = [e for e in ekranlar if e['grup'] == g]
    if not es: continue
    L += [f'### {GRP[g]} ({len(es)})', '', '| Kimlik | Ad | İşlev | Kanonik çekim | Aynı görünen çekimler (diğer yollar) | Açan eylemler | Kaynak | V41→V42 |', '|---|---|---|---|---|---|---|---|']
    for e in es:
        dv = ','.join(sorted(set(e['goruntu'][h].get('v41_durum', '?') for h in e['goruntu'])))
        L.append(f'| {e["kimlik"]} | {e["ad"]} | {e["islev"]} | `{e["kanonik_cekim"]}` | {", ".join("`"+a+"`" for a in e["ayni_gorunen_cekimler"]) or "—"} | {", ".join(e["acan_eylemler"]) or "—"} | {", ".join(e["kaynak"][:3]) or "—"} | {dv} |')
    L.append('')
L += ['## 2. Ekran değiştirmeyen kardeş eylemler', '',
      f'- **Bildirim (toast) eylemleri:** {len(bildirim)} — ayrı ekran değil; tek bir bildirim bileşeni (`js/ui-duyuru.js` kuyruğu) tasarlanır. Liste `ekran_envanteri.json › bildirim_eylemleri`.',
      f'- **Yönlendirme eylemleri:** {len(yonlendirme)} — pencere açmaz, yer değiştirir (başkent/çarşı/klan).', '',
      '## 3. Görüntüsü OLMAYAN ekran açan eylemler (tasarım görevinden ÇIKARILMAZ)', '',
      'Bu eylemler kaynak kodda ekran açar ama V42 çekiminde görülmedi (veri yazar, ön koşul/rol/durum ister ya da parametrelidir). Tasarım, **ailesindeki görüntülü ekranın bileşenlerini yeniden kullanır**; görünümü Opus entegrasyonda doğrulanır.', '',
      '| Eylem | Tür | Kaynak | Parametreli | Okur | Yazar |', '|---|---|---|---|---|---|']
for y in yok:
    L.append(f'| `{y["eylem"]}` | {y["tur"]} | {", ".join(y["kaynak"][:2])} | {"evet" if y["parametreli"] else "hayır"} | {", ".join(y["okur"][:3]) or "—"} | {", ".join(y["yazar"][:3]) or "—"} |')
L += ['', '## 4. Bilinen dinamik durum boşlukları (görüntü yok)', '',
      '- Klan üyesiyken Klan Karargâhı alt sekmeleri (Salon, Hazine, Dükkân, Hisar, Oba Avı, Görev, Sancak) — test hesabı klansız çekildi.',
      '- Mini Dizi bölüm oynatıcısı ve kilitli bölüm durumu.', '- Destan bölüm hatırası/diyalog/bulmaca modalları ve Destan savaşları.', '- Onay pencereleri (confirmBox) ve hata/başarı bildirimleri durum varyantları.',
      '- Boss mağarası/Zindan savaş evreleri, Kristal Nöbeti savaşı, Dünya Baskını savaşı, PvP savaş evreleri.', '- Tüccar alt dükkânları (silah/zırh/takı) ve Parçala/Sat penceresi: bu pakette ayrıca çekildi (`04_PILOT_EK_GORUNTULER`).', '']
open(f'{OUT}/EKRAN_ENVANTERI.md', 'w', encoding='utf-8').write('\n'.join(L))
print(json.dumps(OZET, ensure_ascii=False, indent=1))
