# İkinci kabul paketleri: KORANT_GPT_KABUL2 ve KORANT_GEMINI_KABUL2. Ekranlar WebP q92 (çözünürlük aynı), README + manifest.json,
# ≤29 MB bağımsız ZIP parçaları. python3 -I paketle2.py <son-klasörü> <kabul-26kas klasörü> <çıktı-klasörü>
import os, sys, json, hashlib, zipfile, shutil, datetime, subprocess
from concurrent.futures import ProcessPoolExecutor
def _cevir(a):
    src, d, q = a; im = Image.open(src); w, h = im.size; im.convert('RGB').save(d, 'WEBP', quality=q, method=4); return f'{w}x{h}'
from PIL import Image
SON, KAB, OUT = [os.path.abspath(x) for x in sys.argv[1:4]]
SURUM = 'KORANT-v40-1dda167+P33'; LIM = 29 * 1024 * 1024
os.makedirs(OUT, exist_ok=True)
def sha(p): return hashlib.sha256(open(p, 'rb').read()).hexdigest()
class Paket:
    def __init__(s, ad, q=92): s.ad = ad; s.q = q; s.kok = os.path.join(OUT, ad); shutil.rmtree(s.kok, ignore_errors=True); os.makedirs(s.kok); s.m = []; s.isler = []
    def kopya(s, src, hedef, tur):
        if not os.path.exists(src): s.m.append({'yol': hedef, 'tur': tur, 'EKSIK': True, 'kaynak': src}); return
        d = os.path.join(s.kok, hedef); os.makedirs(os.path.dirname(d), exist_ok=True); shutil.copy2(src, d)
        s.m.append({'yol': hedef, 'tur': tur, 'bayt': os.path.getsize(d), 'sha256': sha(d)})
    def webp(s, src, hedef, tur, **meta):
        if not os.path.exists(src): s.m.append({'yol': hedef, 'tur': tur, 'EKSIK': True}); return
        d = os.path.join(s.kok, hedef); os.makedirs(os.path.dirname(d), exist_ok=True)
        s.isler.append((src, d, s.q)); s.m.append({'yol': hedef, 'tur': tur, 'kalite': s.q, **meta})
    def klasor(s, src, hedef, tur, desen=('.png',)):
        if not os.path.isdir(src): s.m.append({'yol': hedef, 'tur': tur, 'EKSIK': True}); return
        for f in sorted(os.listdir(src)):
            p = os.path.join(src, f)
            if f.endswith(desen): s.webp(p, f'{hedef}/{f.rsplit(".", 1)[0]}.webp', tur)
            elif f.endswith('.json') or f.endswith('.txt'): s.kopya(p, f'{hedef}/{f}', tur + '-veri')
    def yaz(s, hedef, metin, tur):
        d = os.path.join(s.kok, hedef); os.makedirs(os.path.dirname(d), exist_ok=True); open(d, 'w', encoding='utf-8').write(metin)
        s.m.append({'yol': hedef, 'tur': tur, 'bayt': os.path.getsize(d), 'sha256': sha(d)})
    def bitir(s, readme):
        with ProcessPoolExecutor(4) as X: olc = list(X.map(_cevir, s.isler, chunksize=8))
        yol2 = {d: o for (src, d, q), o in zip(s.isler, olc)}
        for x in s.m:
            d = os.path.join(s.kok, x['yol'])
            if d in yol2: x.update({'olcu': yol2[d], 'bayt': os.path.getsize(d), 'sha256': sha(d)})
        s.yaz('README.md', readme, 'belge')
        man = {'paket': s.ad, 'surum_kimligi': SURUM, 'tarih': datetime.date.today().isoformat(), 'dosya_sayisi': len(s.m), 'eksik': [x for x in s.m if x.get('EKSIK')], 'dosyalar': s.m}
        json.dump(man, open(os.path.join(s.kok, 'manifest.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
        # parçalara böl (her parça README + manifest içerir, bağımsız açılır)
        tum = [x['yol'] for x in s.m if not x.get('EKSIK') and x['yol'] != 'README.md']
        parca, cur, boy = [], [], 0
        for y in tum:
            b = os.path.getsize(os.path.join(s.kok, y))
            if cur and boy + b > LIM - 400_000: parca.append(cur); cur, boy = [], 0
            cur.append(y); boy += b
        if cur: parca.append(cur)
        n = len(parca); ad = []
        for i, pc in enumerate(parca, 1):
            z = os.path.join(OUT, f'{s.ad}.zip' if n == 1 else f'{s.ad}_{i:02d}of{n:02d}.zip')
            with zipfile.ZipFile(z, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as Z:
                Z.write(os.path.join(s.kok, 'README.md'), 'README.md'); Z.write(os.path.join(s.kok, 'manifest.json'), 'manifest.json')
                for y in pc: Z.write(os.path.join(s.kok, y), y)
            ad.append((os.path.basename(z), os.path.getsize(z), len(pc)))
        return ad
# ---------------- GPT ----------------
G = Paket('KORANT_GPT_KABUL2')
for f in ['KAPSAM_MATRISI.md', 'DEGISIKLIK_RAPORU.md', 'TEST_KANITLARI.md', 'GPT_ISTEK_P34.md', 'EKRAN_ENVANTERI.md', 'ekran_envanteri.json', 'KAPSAM_KAYNAK_AAA.txt', 'DEVIR.md']: G.kopya(os.path.join(KAB, f), f'01_BELGELER/{f}', 'belge')
G.kopya(os.path.join(SON, 'QA_MATRISI_DOLU.json'), '02_QA/QA_MATRISI_DOLU.json', 'qa')
G.kopya(os.path.join(SON, 'olcum_ozeti.txt'), '02_QA/olcum_ozeti.txt', 'qa')
G.kopya(os.path.join(SON, 'kanit', 'koruma', 'koruma_p33.json'), '03_TEST_SONUCLARI/koruma_p33.json', 'test'); G.kopya(os.path.join(SON, 'kanit', 'sistem', 'en.json'), '03_TEST_SONUCLARI/sistem_en.json', 'test')
for d in ['baskin-ocak', 'baskin-sancak', 'sistem', 'gpt-ocak', 'gpt-sancak', 'ek-ocak', 'ek-sancak', 'savas-ocak', 'savas-sancak', 'cesitli']:
    G.kopya(os.path.join(SON, 'kanit', d, 'sonuc.json'), f'03_TEST_SONUCLARI/{d}.json', 'test')
for f in ['koruma/koruma.json', 'guvenlik_tarama.txt', 'gpt_entegrasyon_sonuc.json', 'devui_t3_sonuc.json', 'hud11-ocak.json']: G.kopya(os.path.join(KAB, 'kanit', f), f'03_TEST_SONUCLARI/{f.replace("/", "_")}', 'test')
G.kopya(os.path.join(SON, 'p33.patch'), '04_KAYNAK/p33.patch', 'kaynak')
for f in ['js/p33-canli.js', 'js/npc-soz.js', 'js/yukleme-metin.js', 'css/p33-kabul.css']: G.kopya(os.path.join(KAB, '..', '..', '..', f), f'04_KAYNAK/{f}', 'kaynak')
gpt_parca = G.bitir(f"""# KORANT_GPT_KABUL2 — {SURUM}

GPT 6.2 ikinci kabul denetimi için. İçerik:
- `01_BELGELER/KAPSAM_MATRISI.md`: 23+9 görev paketi (AAA planı) + 25.11 bulguları + Gemini 17+3 + GPT talimatı 1–10, her satır durumlu.
- `01_BELGELER/DEGISIKLIK_RAPORU.md` (kök neden grupları), `TEST_KANITLARI.md`, `GPT_ISTEK_P34.md` (izinsiz üretilmeyen, istenen varlıklar).
- `02_QA/QA_MATRISI_DOLU.json`: GPT'nin 254 satırı doldurulmuş + ENV/DYN/SAV/BAS/RES satırları (974). KABUL = otomatik ölçüm + ekran görüntüsü; TEST_EDILMEDI gerekçeli.
- `03_TEST_SONUCLARI/`: sistem (kayıt, çift tık, bozuk kayıt, EN, gece yarısı sıfırlama, masaüstü bellek), savaş, GPT içerik, canlılık, koruma (sha), güvenlik taraması.
- `04_KAYNAK/p33.patch`: 1dda167 → P33 tam fark (shared/ değişmedi) + yeni dosyalar.
Ekran görüntüleri Gemini paketindedir (KORANT_GEMINI_KABUL2). Gerçek cihaz, FPS/pil/ısı, sunucu güvenliği TEST EDİLMEDİ.
""")
# ---------------- GEMINI ----------------
M = Paket('KORANT_GEMINI_KABUL2')
for r, h in [('ocak', 'kragmir'), ('sancak', 'elentha')]:
    M.klasor(os.path.join(SON, f'cek115-{r}'), f'01_EKRANLAR_880x406/{h}', 'ekran')
    M.klasor(os.path.join(SON, f'once-{r}'), f'02_ONCE_SONRA/{h}/once_1dda167', 'once')
    M.klasor(os.path.join(SON, 'kanit', f'savas-{r}'), f'03_SAVAS_KLAN/{h}', 'savas'); M.klasor(os.path.join(SON, 'kanit', f'baskin-{r}'), f'03_SAVAS_KLAN/{h}/baskin_cumartesi', 'savas')
    M.klasor(os.path.join(SON, 'kanit', f'ek-{r}'), f'04_CANLILIK_GERIBILDIRIM/{h}', 'canlilik')
    for W in ('667', '1180'): M.klasor(os.path.join(SON, f'res{W}-{r}'), f'05_COZUNURLUK_{W}/{h}', 'cozunurluk')

M.klasor(os.path.join(SON, 'kanit', 'sistem'), '08_SISTEM', 'sistem'); M.klasor(os.path.join(SON, 'kanit', 'cesitli'), '08_SISTEM/cesitli', 'sistem')
M.kopya(os.path.join(SON, 'QA_MATRISI_DOLU.json'), 'QA_MATRISI_DOLU.json', 'qa'); M.kopya(os.path.join(KAB, 'KAPSAM_MATRISI.md'), 'KAPSAM_MATRISI.md', 'belge')
M.kopya(os.path.join(KAB, 'GPT_ISTEK_P34.md'), 'GPT_ISTEK_P34.md', 'belge')
E = Paket('KORANT_GEMINI_KABUL2_EK', q=70)
for r, h in [('ocak', 'kragmir'), ('sancak', 'elentha')]:
    E.klasor(os.path.join(SON, f'eylem-{r}'), f'06_EYLEM_TURU/{h}', 'eylem')
    E.klasor(os.path.join(SON, f'dyn-{r}'), f'07_DINAMIK_DURUMLAR/{h}', 'dinamik')
ek_parca = E.bitir(f"""# KORANT_GEMINI_KABUL2_EK — {SURUM}

İsteğe bağlı ek kanıt (asıl paket KORANT_GEMINI_KABUL2). Çözünürlük aynı (2341×1080), boyut için WebP q70.
- `06_EYLEM_TURU/<halk>/NNNN.webp`: kaynak koddaki ekran açan her eylem (QA ENV-<halk>-NNNN-<eylem> satırları; `_eylem.json` ölçümleri).
- `07_DINAMIK_DURUMLAR/<halk>/NNNN.webp`: gezinti taramasında bulunan durumlar yeniden oynatıldı (QA DYN-* satırları; `_cekim.json`).
Ölçümler ilk turdan; ilk tur sonrası düzeltilenler QA'da DUZELTILDI_ILK_TUR_SONRASI.
""")
gem_parca = M.bitir(f"""# KORANT_GEMINI_KABUL2 — {SURUM}

Gemini Neon ikinci görsel kabul denetimi için. Bütün ekranlar WebP q92, ÇÖZÜNÜRLÜK DÜŞÜRÜLMEDİ (880×406 mantıksal × dpr 2,66 = 2341×1080).
- `01_EKRANLAR_880x406/<halk>/`: 226 çekimlik tur (QA UI-* satırları; aynı adlar). `~sekme` = alt sekme.
- `02_ONCE_SONRA/<halk>/once_1dda167/`: Gemini'nin 17 bulgusundan etkilenen 22 ekranın ESKİ sürümden çekimi; "sonra" = aynı adla 01 klasöründe.
- `03_SAVAS_KLAN/`: 4 bölge, boss, 5 zindan, PvP, Oba Avı savaşları (VS, iki savaş anı, sonuç) + klan kurulumu, Klan Obası (N4-06, N5-02).
- `04_CANLILIK_GERIBILDIRIM/`: 4 gün evresi, örs başarı/başarısızlık, görev şeridi, ganimet nadirlik, ses ayarı, A10 karakter seçme.
- `05_COZUNURLUK_667/1180/`: 667×375 ve 1180×820 (dpr 1, gfx düşük) (N6-08).
- Eylem turu ve dinamik durum ekranları ayrı pakette: KORANT_GEMINI_KABUL2_EK.
- EKRANLAR İLK TURDAN: ilk turdan sonra düzeltilen küçük yazılar QA'da DUZELTILDI_ILK_TUR_SONRASI; görüntüde eski hâl görünebilir.
- `08_SISTEM/`: bozuk kayıt, EN dili, test paneli (devUI), T3 kapalı.
Gerçek telefon FPS/pil/ısı TEST EDİLMEDİ. Onaylı görseller değişmedi (sha: GPT paketi 03_TEST_SONUCLARI/koruma_koruma.json).
""")
print(json.dumps({'gpt': gpt_parca, 'gemini': gem_parca, 'gemini_ek': ek_parca}, ensure_ascii=False))
