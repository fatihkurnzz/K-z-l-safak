#!/usr/bin/env python3
# Fable girdisi: KANIT_DOSYALARI_INDEKSI.json + manifest.json + doğrulama + ZIP (≤30 MB, aşarsa numaralı parçalar)
# python3 -I paketle.py <hazırlık klasörü (out)> <zip klasörü> <depo kökü> <sürüm kimliği> <komit>
import sys, os, json, re, hashlib, zipfile, glob, datetime, subprocess
OUT, ZD, REPO, SURUM, KOMIT = sys.argv[1:6]
os.makedirs(ZD, exist_ok=True)
sha = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()

# komit yer tutucusu
p = os.path.join(OUT, 'CALISTIRMA_VE_TEST_TALIMATI.md'); s = open(p, encoding='utf-8').read().replace('{KOMIT}', KOMIT); open(p, 'w', encoding='utf-8').write(s)

# oyun dosyaları parmak izi (tasarım hariç): sıralı (yol, sha256) listesinin sha256'sı
files = subprocess.run(['git', '-C', REPO, 'ls-files', 'oyun-son'], capture_output=True, text=True).stdout.split()
oyun = sorted(f for f in files if not f.startswith('oyun-son/_tasarim/'))
h = hashlib.sha256()
for f in oyun: h.update((f[len('oyun-son/'):] + ' ' + sha(os.path.join(REPO, f)) + '\n').encode())
parmak = dict(yontem="sha256( her satır: '<oyun-son göreli yol> <dosya sha256>\\n', yola göre sıralı ); kapsam: git'teki oyun-son dosyaları, _tasarim hariç", dosya_sayisi=len(oyun), sha256=h.hexdigest(),
              yayin_notu='Yayın (claude.ai artefakt sürüm 42) 450 dosyadır: depoda olup yayına konmayanlar models/test/Xbot.glb.js, video/README.txt, img/items3d/*, bazı img/kd/simge3 dosyaları vb. (CLAUDE.md "Yayın").')

# kanıt indeksi: paket içi + depo içi referanslar
idx = []
def tur(f):
    return 'goruntu' if f.endswith(('.webp', '.png', '.jpg')) else 'json' if f.endswith('.json') else 'belge'
for f in sorted(glob.glob(os.path.join(OUT, 'kanit', '**', '*'), recursive=True)):
    if os.path.isfile(f):
        r = os.path.relpath(f, OUT)
        test = r.split('/')[2] if r.count('/') >= 2 else r
        idx.append(dict(yol=r, konum='paket', tur=tur(f), surum='v42', test=test, bayt=os.path.getsize(f), sha256=sha(f)))
for f in sorted(glob.glob(os.path.join(OUT, 'ek', '**', '*'), recursive=True)):
    if os.path.isfile(f):
        r = os.path.relpath(f, OUT)
        idx.append(dict(yol=r, konum='paket', tur='uzman_raporu' if '/gpt/' in r or '/gemini/' in r else 'opus_kaydi', surum='v41→v42 uzman teslimi', bayt=os.path.getsize(f), sha256=sha(f)))
DEPO = [
 ('oyun-son/_tasarim/araclar/kabul-26kas/QA_MATRISI_DOLU.json', 'v41 QA matrisi (974 satır; özet G2-11 ile düzeltildi)', 'v41'),
 ('oyun-son/_tasarim/araclar/kabul-26kas/TEST_KANITLARI.md', 'v41 test kanıtları', 'v41'),
 ('oyun-son/_tasarim/araclar/kabul-26kas/KAPSAM_MATRISI.md', '23+9 yeniden kurulmuş kapsam (özgün belge değil)', 'v41'),
 ('oyun-son/_tasarim/araclar/kabul-26kas/DEGISIKLIK_RAPORU.md', 'P33 değişiklik raporu', 'v41'),
 ('oyun-son/_tasarim/araclar/kabul-26kas/EKRAN_ENVANTERI.md', 'v41 ekran envanteri (kaynak + tarama)', 'v41'),
 ('oyun-son/_tasarim/araclar/kabul-26kas/ekran_envanteri.json', 'v41 dinamik durumlar ve sekmeler', 'v41'),
 ('oyun-son/_tasarim/araclar/kabul-26kas/act_envanter.json', 'güncel ACT taraması (v42)', 'v42'),
 ('oyun-son/_tasarim/araclar/kabul-26kas/p34_gom_raporu.json', 'P34 gömme raporu (hedef anahtar, ölçü)', 'v42'),
 ('oyun-son/_tasarim/araclar/kabul-26kas/kanit', 'v41 kanıt klasörü (koruma, kayıt uyumluluğu, GPT entegrasyonu)', 'v41'),
 ('oyun-son/_tasarim/araclar/kabul-26kas/gelen', 'GPT P33 teslimi + Gemini 1. görsel kabul raporu', 'v40/v41'),
 ('oyun-son/_tasarim/denetim-22kas', '22.11 görev paketi, C1/C2/C3–C10 teslim raporları, sanat kitabı', 'v26–v33'),
 ('oyun-son/_tasarim/proje-23kas', 'P23 görev paketi (K/N/A)', 'v38'),
 ('CLAUDE.md', 'Oturum hafızası (bütün kararlar ve sürümler)', 'hepsi'),
]
for y, a, v in DEPO:
    var = os.path.exists(os.path.join(REPO, y))
    assert var, y
    idx.append(dict(yol=y, konum='depo', tur='klasor' if os.path.isdir(os.path.join(REPO, y)) else tur(y), surum=v, aciklama=a))
json.dump(dict(surum=SURUM, aciklama='Paket içi kanıtlar (sha256 ile) ve depodaki kanıt/kayıt yolları. surum=v41 olanlar v42 kanıtı DEĞİLDİR.', kayitlar=idx),
          open(os.path.join(OUT, 'KANIT_DOSYALARI_INDEKSI.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

# doğrulamalar
hata = []
for f in glob.glob(os.path.join(OUT, '**', '*.json'), recursive=True):
    try: json.load(open(f, encoding='utf-8'))
    except Exception as e: hata.append(f'JSON geçersiz: {f}: {e}')
# belgelerdeki paket içi yollar var mı
for f in glob.glob(os.path.join(OUT, '*.md')) + glob.glob(os.path.join(OUT, '*.json')):
    t = open(f, encoding='utf-8').read()
    for m in set(re.findall(r'(kanit/v42/[A-Za-z0-9_./*{},-]+)', t)):
        m = m.rstrip('.,)')
        if '*' in m or '{' in m:
            if not glob.glob(os.path.join(OUT, m.replace('{ocak,sancak}', '*'))) and not glob.glob(os.path.join(OUT, m.split('*')[0] + '*')): hata.append(f'{os.path.basename(f)}: yol yok {m}')
        elif not os.path.exists(os.path.join(OUT, m)) and not glob.glob(os.path.join(OUT, m + '*')): hata.append(f'{os.path.basename(f)}: yol yok {m}')
    for m in set(re.findall(r'`(oyun-son/[A-Za-z0-9_./-]+)`', t)):
        if m.endswith('...'): continue
        if not os.path.exists(os.path.join(REPO, m.rstrip('/'))): hata.append(f'{os.path.basename(f)}: depo yolu yok {m}')
# sayı tutarlılığı
P = json.load(open(os.path.join(OUT, 'P34_NIHAI_DURUM.json'), encoding='utf-8')); M = json.load(open(os.path.join(OUT, 'BIRLESIK_HATA_VE_GOREV_MATRISI.json'), encoding='utf-8'))
assert P['ozet']['talep'] == len(P['talepler']) == 11
assert M['ozet']['kayit'] == len(M['kayitlar'])
assert len({x['kimlik'] for x in M['kayitlar']}) == len(M['kayitlar']), 'yinelenen kimlik'
rd = open(os.path.join(OUT, 'README_FABLE.md'), encoding='utf-8').read()
assert f"{M['ozet']['kayit']} kayıt" in rd, 'README kayıt sayısı'
ac = open(os.path.join(OUT, 'ACIK_SORUNLAR_VE_YAYIN_RISKLERI.md'), encoding='utf-8').read()
assert f"{M['ozet']['kayit']} kayıt" in ac and f"**{M['ozet']['acik_kismen_testedilmedi_KAB_haric']}**" in ac and f"**{M['ozet']['acik_tekil_kok_neden']}**" in ac, 'açık sorun sayıları'
if hata: print('\n'.join(hata)); raise SystemExit('DOĞRULAMA HATASI')

# manifest
ICERIK = {'README_FABLE.md': 'Giriş, okuma sırası, durum dili', 'GPT_NIHAI_TESLIM_VE_KABUL.md': 'GPT bütün işleri', 'GEMINI_NIHAI_TESLIM_VE_KABUL.md': 'Gemini bütün işleri',
          'OPUS_NIHAI_ENTEGRASYON.md': 'Opus geliştirme/entegrasyon, teknik borç, riskler', 'P34_NIHAI_DURUM.json': '11 P34 talebi', 'BIRLESIK_HATA_VE_GOREV_MATRISI.json': 'Birleşik bulgu matrisi',
          'GUNCEL_OYUN_ENVANTERI.json': 'Güncel envanter (kaynak koddan)', 'TEST_KANITLARI_VE_SONUCLARI.md': 'Testler', 'ESKI_YENI_SURUM_KIYASLAMASI.md': 'v41 → v42',
          'KULLANICI_KARARLARI_VE_STANDARTLAR.md': 'Kararlar + telif', 'ACIK_SORUNLAR_VE_YAYIN_RISKLERI.md': 'Açık sorunlar', 'CALISTIRMA_VE_TEST_TALIMATI.md': 'Çalıştırma/test', 'KANIT_DOSYALARI_INDEKSI.json': 'Kanıt indeksi'}
for k in ICERIK: assert os.path.exists(os.path.join(OUT, k)), k
dosyalar = []
for f in sorted(glob.glob(os.path.join(OUT, '**', '*'), recursive=True)):
    if os.path.isfile(f) and os.path.basename(f) != 'manifest.json':
        dosyalar.append(dict(yol=os.path.relpath(f, OUT), bayt=os.path.getsize(f), sha256=sha(f)))
man = dict(paket='KORANT_FABLE_DENETIM_GIRDISI', surum=SURUM, komit=KOMIT, onceki_surum='KORANT-v40-1dda167+P33 (komit 1e17c80, yayın 41)', olusturma=datetime.date.today().isoformat(),
           hazirlayan='Claude Opus 5.5 (entegrasyon kaydı; kabul kararı değildir)', surum_parmak_izi=parmak, ana_dosyalar=ICERIK,
           ozet=dict(p34=P['ozet'], matris=M['ozet']), dosya_sayisi=len(dosyalar) + 1, toplam_bayt=sum(d['bayt'] for d in dosyalar), dosyalar=dosyalar,
           kapsam_disi='Oyun kaynak kodu, görseller, sesler ve önceki ekran görüntüsü paketleri pakete konmadı (depodan erişilir).')
json.dump(man, open(os.path.join(OUT, 'manifest.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

# ZIP
ad = 'KORANT_FABLE_DENETIM_GIRDISI'
zp = os.path.join(ZD, ad + '.zip')
with zipfile.ZipFile(zp, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
    for f in sorted(glob.glob(os.path.join(OUT, '**', '*'), recursive=True)):
        if os.path.isfile(f): z.write(f, ad + '/' + os.path.relpath(f, OUT))
boyut = os.path.getsize(zp)
assert boyut < 30 * 1000 * 1000, 'parçalama gerekli'
with zipfile.ZipFile(zp) as z:
    assert z.testzip() is None
    n = len(z.namelist())
print(dict(zip=zp, bayt=boyut, dosya=n, parmak=parmak['sha256'][:16], oyun_dosyasi=len(oyun)))
