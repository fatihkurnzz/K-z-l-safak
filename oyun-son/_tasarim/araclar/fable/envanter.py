#!/usr/bin/env python3
# Fable girdisi · GUNCEL_OYUN_ENVANTERI.json üretir (kaynak koddan + mevcut test kayıtlarından; tahmin yok).
# python3 -I envanter.py <oyun-son> <oyun_verisi.json> <çıktı.json> [cek115 v42 klasörü (içinde cek115-<halk>/_denetim.json)]
import sys, os, re, json, glob, collections
G, OV, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
CEK = sys.argv[4] if len(sys.argv) > 4 else None
K = os.path.join(G, '_tasarim/araclar/kabul-26kas')
ov = json.load(open(OV, encoding='utf-8'))
E = {}

# 1. Ekran açan eylemler (kaynak kod taraması, act_tara.py — güncel kod)
act = json.load(open(os.path.join(K, 'act_envanter.json'), encoding='utf-8'))
ad = collections.OrderedDict()
for r in act:
    ad.setdefault(r['eylem'], []).append(r)
acan = {k: v for k, v in ad.items() if any(x['acar'] for x in v) and not any(x['dev'] for x in v)}
E['kaynak_kod_eylemleri'] = dict(
    yontem='_tasarim/araclar/kabul-26kas/act_tara.py (js/*.js içindeki ACT.<ad> = tanımları; gömülü görsel dosyaları hariç)',
    act_tanimi=len(act), ayri_eylem=len(ad), ekran_acan_gelistirici_haric=len(acan), gelistirici_eylemi=sum(1 for v in ad.values() if any(x['dev'] for x in v)),
    ekran_acanlar=[dict(eylem=k, acar=sorted({a for x in v for a in (x['acar'] if isinstance(x['acar'], list) else [x['acar']]) if a}), kaynak=[f"{x['dosya']}:{x['satir']}" for x in v], parametreli=any(x['parametre'] for x in v)) for k, v in acan.items()])

# 2. Çekim turu ekranları (benzersiz ekran kimliği + ırk varyantı) — P33 (sürüm 41) turu ve varsa v42 yeniden çekim
qa = json.load(open(os.path.join(K, 'QA_MATRISI_DOLU.json'), encoding='utf-8'))
ui = [r for r in qa['testler'] if r['test_id'].startswith('UI-')]
by = collections.defaultdict(set)
for r in ui: by[r['ekran']].add(r['halk'])
E['cekim_turu_p33_surum41'] = dict(
    kaynak='QA_MATRISI_DOLU.json UI-* satırları (cek115.js; 880×406, dpr 2,66; ilk tur)', toplam_cekim=len(ui),
    benzersiz_ekran=len(by), yalniz_elentha=sorted(k for k, v in by.items() if v == {'elentha'}), yalniz_kragmir=sorted(k for k, v in by.items() if v == {'kragmir'}),
    iki_halkta=len([k for k, v in by.items() if len(v) == 2]), ekranlar=sorted(by))
if CEK:
    v42 = {}
    for h in ('sancak', 'ocak'):
        p = os.path.join(CEK, f'cek115-{h}', '_denetim.json')
        if os.path.exists(p):
            d = json.load(open(p, encoding='utf-8'))
            L = d if isinstance(d, list) else d.get('ekranlar') or d.get('kayitlar') or []
            v42[h] = dict(kayit=len(L), acilan=sum(1 for x in L if x.get('acildi', True) and not x.get('hata')), kaynak=p)
    E['cekim_turu_v42'] = v42 or 'çalıştırılmadı'

# 3. Dinamik durumlar ve eylem turu (P33 taraması; v42'de bu tarama YENİDEN ÇALIŞTIRILMADI — envanter kaynak koddan güncel)
env = json.load(open(os.path.join(K, 'ekran_envanteri.json'), encoding='utf-8'))
c = collections.Counter(x['halk'] for x in env['durumlar'])
E['dinamik_durumlar_p33'] = dict(kaynak='ekran_envanteri.json (tara.js, derinlik 3, sürüm 41)', halk_basina=dict(c), toplam=sum(c.values()),
                                 sekmeler={k: len(v) for k, v in env['sekmeler'].items()}, not_='v42 değişiklikleri yeni ekran eklemedi (yalnız görsel katman, diyalog karesi, kurtarma kartı portresi); tarama v42’de tekrarlanmadı.')
E['eylem_turu_p33'] = dict(kaynak='QA ENV-* satırları', satir=sum(1 for r in qa['testler'] if r['test_id'].startswith('ENV-')))

# 4. Iç mekânlar, sahneler, haritalar
icm = open(os.path.join(G, 'js/ic-mekan.js'), encoding='utf-8').read()
E['ic_mekanlar'] = dict(klasor=sorted(os.path.relpath(p, G) for p in glob.glob(os.path.join(G, 'interiors/*/*'))),
                        sayi=len(glob.glob(os.path.join(G, 'interiors/*/*'))), kod_tanimlari=re.findall(r'^  ([a-z]+): \{ ad: \'([^\']+)\'', icm, re.M))
E['sahneler'] = dict(sayi=len(glob.glob(os.path.join(G, 'sahneler/*.webp'))), dosyalar=sorted(os.path.basename(p) for p in glob.glob(os.path.join(G, 'sahneler/*.webp'))),
                     onayli_toplam='29 sahneler/ + 13 interiors/ = 42 (kullanıcı kararı: değişmez; P34-01 yalnız zafer_aniti çözünürlüğü)')
E['haritalar'] = dict(varsayilan_gorunum='sahneler/baskent_elentha.webp, baskent_kragmir.webp, yemin_pazari.webp, klan_obasi_*.webp (js/hub2d.js S2_BG / S2_CARSI_BG / S2_KLAN_BG)',
                      eski_kip='img/kd/sehir/*/sahne.webp (yalnız ?sehir=0 / dd_sehir=0)', diyar_haritasi='sahneler/diyar_haritasi.webp',
                      hareket_katmani='js/p34-katman.js + js/p34-katman-png.js (P34-02/03/04)')
E['bolgeler'] = ov['bolgeler']
# 5. NPC, sınıf, halk
gp = open(os.path.join(G, 'js/gorsel-png.js'), encoding='utf-8').read()
por = sorted(k for k in re.findall(r'^"([a-z]+)":"', gp, re.M) if f'"{k}-yuz":"' in gp)
nk = re.findall(r'"([a-z]+)":\{"(?:goz|agiz)', open(os.path.join(G, 'js/npc-kare-png.js'), encoding='utf-8').read())
soz = re.findall(r'^ "([a-z_]+:[a-z]+)": \{', open(os.path.join(G, 'js/npc-soz.js'), encoding='utf-8').read(), re.M)
E['npc'] = dict(oyun_npc_kayitlari=ov['npc'], g4_portreli=por, goz_konusma_kareli=sorted(set(nk) & set(por)), replik_baglamlari=soz)
E['halklar'] = ov['halklar']; E['siniflar'] = ov['siniflar']; E['baskentler'] = ov['baskentler']; E['oyun'] = ov['oyun']
# 6. Yaratıklar ve bosslar (+ 2B çizim kapsamı)
y2 = open(os.path.join(G, 'js/yaratik2d.js'), encoding='utf-8').read()
blok = y2[y2.index('export const YARATIK'):y2.index('// P26 (K3)')]
harita = {m.group(1): m.group(2) for m in re.finditer(r"([a-z_0-9]+):([a-z_0-9-]+)(?::[0-9a-f]{6})?(?=[\s`'])", blok)}
poz = {}
for f in glob.glob(os.path.join(G, 'js/b2d-y*.js')):
    s = open(f, encoding='utf-8').read(); i = s.index('export const B = ') + 17; B = json.loads(s[i:s.rindex('};') + 1])
    for art, d in B.items(): poz[art] = sorted(k for k in d if k != 'boss')
E['yaratiklar'] = dict(toplam=ov['yaratik_sayisi'], iki_boyutlu_cizim=sum(1 for y in ov['yaratiklar'] if y['id'] in harita), cizimsiz=[y['id'] for y in ov['yaratiklar'] if y['id'] not in harita],
                       poz_kapsami={a: poz.get(a) for a in sorted(set(harita.values()))}, liste=ov['yaratiklar'], orman=ov['orman_yaratiklari'])
E['bosslar'] = dict(liste=ov['bosslar'], dunya_bosslari=ov['dunya_bosslari'], kaptanlar=ov['kaptanlar'],
                    ikinci_evre_cizimi={b['id']: ('bekleme2' in (poz.get(harita.get(b['id'], ''), []) or [])) for b in ov['bosslar']})
# 7. Oyun sistemleri (shared/ = mekanik; dokunulmaz)
sis = []
for f in sorted(glob.glob(os.path.join(G, 'shared/*.js'))):
    ilk = next((l.strip('/ ').strip() for l in open(f, encoding='utf-8') if l.strip().startswith('//')), '')
    sis.append(dict(dosya=os.path.relpath(f, G), aciklama=ilk[:160]))
E['oyun_sistemleri'] = dict(not_='shared/ = mekanik/ekonomi/denge (P33 ve P34’te DEĞİŞMEDİ; sha kanıtı TEST_KANITLARI)', dosyalar=sis)
# 8. Varlık yolları
gom = []
for f in sorted(glob.glob(os.path.join(G, 'js/*.js'))):
    s = open(f, encoding='utf-8').read(80000) if os.path.getsize(f) > 200000 else open(f, encoding='utf-8').read()
    if os.path.getsize(f) > 200000 or 'base64' in s[:600] or 'OTOMATİK' in s[:300] and ('png' in f or 'b2d' in f or 'veri' in f):
        gom.append(dict(dosya=os.path.relpath(f, G), bayt=os.path.getsize(f), ilk_satir=s.split('\n')[0][:160]))
klas = {}
for d in ('sahneler', 'interiors', 'img', 'audio', 'video', 'models', 'css', 'js', 'shared'):
    p = os.path.join(G, d); fs = [x for x in glob.glob(p + '/**/*', recursive=True) if os.path.isfile(x)]
    klas[d] = dict(dosya=len(fs), bayt=sum(os.path.getsize(x) for x in fs))
E['varlik_yollari'] = dict(klasorler=klas, gomulu_gorsel_js=gom, ses=sorted(os.path.relpath(p, G) for p in glob.glob(os.path.join(G, 'audio/*'))),
                           not_='Görsellerin çoğu WebP base64 olarak js/*-png.js, js/b2d-*.js, js/*-veri.js içine gömülüdür; çıkarma aracı _tasarim/araclar/paket-26kas/cikar.py')
E['karsilastirma_115_226'] = dict(
    once='P33 (sürüm 41) çekim turu: 226 çekim, 115 benzersiz ekran kimliği (Elentha 112, Kragmir 114). Kullanıcının andığı "157 ekran" sayısı hiçbir kayıtla doğrulanamadı.',
    simdi=f"Kaynak kodda geliştirici araçları hariç {len(acan)} ekran açan eylem; çekim turunda {len(by)} benzersiz ekran kimliği. Bu iki sayı farklı şeyleri sayar (eylem ≠ benzersiz görüntü: birçok eylem aynı pencereye/sekmeye gider, parametreli eylemler bağlam ister).",
    hedefe_uydurma='yok')
json.dump(E, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(OUT, {k: (len(v) if isinstance(v, (list, dict)) else v) for k, v in E.items()})
