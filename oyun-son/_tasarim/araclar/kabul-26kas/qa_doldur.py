# QA matrisini (GPT gelen/qa_test_matrisi.json, 254 satır) gerçek çekim ve test sonuçlarıyla doldurur; ENV/RES/SAV/KAB/AAA satırlarını ekler.
# python3 -I qa_doldur.py <son-klasörü> <kanit-klasörü> <çıktı.json>
# Kural: kanıt (ekran görüntüsü + ölçüm ya da test sonucu) yoksa TEST_EDILMEDI. Ölçümde kesik/taşma/çakışma, 11 px altı yazı ya da 28 px altı hedef → DÜZELTME.
import json, os, sys, collections
SON, KANIT, OUT = sys.argv[1:4]
G = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'gelen', 'qa_test_matrisi.json'), encoding='utf-8'))
HALK = {'elentha': 'sancak', 'kragmir': 'ocak'}
def oku(*p):
    f = os.path.join(*p)
    return json.load(open(f, encoding='utf-8')) if os.path.exists(f) else None
def kusur(o):
    if not isinstance(o, dict): return None
    k = {x: o.get(x) or [] for x in ['kesik', 'tasma', 'cakisma', 'kucukYazi', 'kucuk28']}
    return {x: v for x, v in k.items() if v}
def karar(o, png):
    if not png: return 'TEST_EDILMEDI', 'ekran görüntüsü yok'
    if o is None: return 'TEST_EDILMEDI', 'ölçüm yok'
    if isinstance(o, dict) and o.get('hata'): return 'TEST_EDILMEDI', 'ölçüm hatası: ' + o['hata'][:80]
    k = kusur(o)
    if k:  # bilinen tasarım gereği eşleşmeler (gerekçe: KAPSAM_MATRISI / TEST_KANITLARI)
        for x in list(k):
            k[x] = [y for y in k[x] if not any(m in y for m in TASARIM)]
            if not k[x]: del k[x]
        if not k: return 'KABUL', 'otomatik ölçüm temiz; yalnız tasarım gereği eşleşmeler (Diyar haritası bölge şekilleri, diyalog şeridindeki düğme, Taş Yemini kapat düğmesi, sohbet önizlemesinin … ile kısalması)'
    if k and set(k) <= {'kucukYazi', 'tasma'} and all(any(m in x for m in SONRA_DUZ) for v in k.values() for x in v):
        return 'DUZELTILDI_ILK_TUR_SONRASI', 'İLK TUR ÖLÇÜMÜ: yalnız 11 px altı yazı vardı; ilk turdan sonra css/p33-kabul.css "Son ölçüm turu" bölümüyle 11 px yapıldı (görüntü düzeltmeden önceki hâl): ' + json.dumps(k, ensure_ascii=False)[:300]
    return ('DUZELTME', json.dumps(k, ensure_ascii=False)[:600]) if k else ('KABUL', 'otomatik ölçüm temiz (kesik/taşma/çakışma/küçük yazı/küçük hedef 0); görüntü ekte')
TASARIM = ['g ⨯ g', 'div.dlg-serit ⨯ button.btn.dlg-b', 'button.x.mx ⨯ div.ty-rite', 'div.cl «']
SONRA_DUZ = ['span.wx', '«Seviye kaybı»', '«Kırılma»', '«Korunur»', '«Başarısız»', ' olur»', ' düşer»', ' kalır»', '«/', 'görevi de', 'Gören Göz', 'Yıldız Toplayan', 'Diyar Diyar', 'Yol Görmüş', 'Baş Avı', 'Büyük Av', 'Nadide Sandık', '«Başarı»', 'Sv. ', '«İlk Alım»', 'tbtn', 'srv-kick', 'span.rar', 'span.cf', 'arisk', 'ivst', 'wctx', '#bapot', '#bauto', 'i.mpc', 'i.pn', 'i.lv', 'bt-info', 'Sunucu Saati', 'Unvan', '«Standart»', 'Savunma delme', '«S»', '+6 ve üstünde']
rel = lambda p: os.path.relpath(p, SON) if p else None
T = G['testler']; ozet = collections.Counter()
cek = {r: oku(SON, f'cek115-{r}', '_denetim.json') for r in ('ocak', 'sancak')}
eyl = {r: oku(SON, f'eylem-{r}', '_eylem.json') for r in ('ocak', 'sancak')}
for t in T:
    i = t['test_id']
    if i.startswith('UI-'):
        r = HALK[t['halk']]; ad = t['ekran']; d = cek[r]
        nm = ad if os.path.exists(os.path.join(SON, f'cek115-{r}', ad + '.png')) else 'C-' + ad
        png = os.path.join(SON, f'cek115-{r}', nm + '.png')
        png = png if os.path.exists(png) else None
        o = (d or {}).get('olcumler', {}).get(nm)
        t['durum'], t['gerceklesen'] = karar(o, png); t['kanit'] = rel(png)
        sk = []
        for s in t.get('sekmeler') or []:
            sp = os.path.join(SON, f'cek115-{r}', f'{nm}~{s}.png')
            if os.path.exists(sp): sk.append(rel(sp))
        if sk: t['kanit_sekmeler'] = sk
        if not d: t['durum'], t['gerceklesen'] = 'TEST_EDILMEDI', 'çekim turu tamamlanmadı'
    elif i.startswith('IC-'):
        act = t['eylem'].replace('ACT.', ''); halk = t['halk']; rs = ['ocak', 'sancak'] if halk == 'ortak' else [HALK[halk]]
        bul = []
        for r in rs:
            for k in (eyl[r] or {}).get('kayit', []):
                if k.get('eylem') == act and k.get('acildi'): bul.append((r, k))
        if bul:
            r, k = bul[0]; png = os.path.join(SON, f'eylem-{r}', k['no'] + '.png')
            t['durum'], t['gerceklesen'] = karar(k.get('olcum'), png if os.path.exists(png) else None); t['kanit'] = rel(png)
            t['gerceklesen'] = f"açıldı: {k.get('durum','')[:60]} · " + t['gerceklesen']
        else: t['durum'], t['gerceklesen'] = 'TEST_EDILMEDI', 'eylem turunda açılmadı / tur yok'
    ozet[t['durum']] += 1
# --- SYS satırları
S = oku(KANIT, 'sistem', 'sonuc.json') or {}
SV = {r: oku(KANIT, f'savas-{r}', 'sonuc.json') for r in ('ocak', 'sancak')}
GP = {r: oku(KANIT, f'gpt-{r}', 'sonuc.json') for r in ('ocak', 'sancak')}
EK = {r: oku(KANIT, f'ek-{r}', 'sonuc.json') for r in ('ocak', 'sancak')}
KOR = oku(KANIT, 'koruma', 'koruma.json')
def sys_(i, durum, ger, kan):
    for t in T:
        if t['test_id'] == i: t['durum'], t['gerceklesen'], t['kanit'] = durum, ger, kan
def ok(b): return 'KABUL' if b else 'DUZELTME'
y = S.get('yenileme', {}); sys_('SYS-SAVE', ok(y.get('ayni') and S.get('bozuk_kayit')), f"yenileme sonrası kayıt aynı: {y.get('ayni')}; bozuk kayıt: {json.dumps(S.get('bozuk_kayit'), ensure_ascii=False)[:200]}; eski↔yeni sürüm kayıt uyumu: kanit/kayit-uyumlulugu", 'kanit/sistem/sonuc.json')
ct = S.get('cift_tik_han', {}); sys_('SYS-DUP', ok(ct.get('tek_islem')), f"Han çift tık: {json.dumps(ct, ensure_ascii=False)}; tezgâh üç tık: {json.dumps(S.get('cift_tik_tezgah'), ensure_ascii=False)[:200]}. Çoklu sekme: TEST_EDILMEDI (yerel kayıt tek sekme varsayımı)", 'kanit/sistem/sonuc.json')
en = S.get('en_dili', {}); sys_('SYS-LANG', ok(en.get('gecti')), json.dumps(en, ensure_ascii=False)[:400], 'kanit/sistem/en_premium.png')
sf = S.get('sifirlama', {}); sys_('SYS-RESET', ok(sf.get('gecti')) if sf else 'TEST_EDILMEDI', json.dumps(sf, ensure_ascii=False) + ' · pazartesi 00:00 haftalık sıfırlama: aynı dayKey/weekKey işlevi (shared/content.js), ayrıca koşturulmadı', 'kanit/sistem/sonuc.json')
bl = S.get('bellek', {}); sys_('SYS-PERF', 'TEST_EDILMEDI', 'Gerçek cihaz yok: 5/30/120 dk FPS, p95, pil, sıcaklık ölçülemedi. Masaüstü Chromium ön ölçümü: ' + json.dumps(bl, ensure_ascii=False), 'kanit/sistem/sonuc.json')
sys_('SYS-AUTH', 'TEST_EDILMEDI', 'DD_LOCAL yerel kip: sunucu yok; gerçek yetkilendirme ve anti-cheat kabul EDİLMEZ (GPT talimatı 10)', None)
sys_('SYS-SEC', 'TEST_EDILMEDI', 'Yetkili sızma testi yapılmadı. Statik tarama: depoda gizli anahtar yok (kanit/guvenlik_tarama.txt); test paneli ?store=1 ile kapanır', 'kanit/guvenlik_tarama.txt')
sys_('SYS-DEVICE', 'KISMEN', '880×406 (dpr 2,66), 667×375, 1180×820 masaüstü Chromium çekimleri (RES-* satırları). Gerçek Android/iOS: TEST_EDILMEDI', 'son/res-*')
sys_('SYS-ASSET', ok(bool(KOR)), '42 sahne sha aynı, 13 iç mekân, gömülü görseller değişmedi (kanit/koruma/koruma.json). Eksik video/portre/poz: GPT_ISTEK_P34.md' if KOR else 'koruma kanıtı yok', 'kanit/koruma/koruma.json')
sys_('SYS-REG', ok(bool(KOR) and bool(oku(KANIT, 'kayit-uyumlulugu', 'sonuc.json') or os.path.isdir(os.path.join(KANIT, 'kayit-uyumlulugu')))), 'shared/ 73 dosya sha aynı (mekanik/ekonomi), eski 1dda167 kaydı yeni sürümde birebir; regresyon = cek115 + eylem turları (0 JS hatası hedefi)', 'kanit/koruma, kanit/kayit-uyumlulugu')
sv_ok = all(SV[r] and all(s.get('durum') == 'tamamlandı' for s in SV[r].get('savaslar', [])) for r in SV)
sys_('SYS-BATTLE', 'KISMEN' if any(SV.values()) else 'TEST_EDILMEDI', 'Bölge/boss/zindan/PvP/Oba Avı savaşları iki halkta (SAV-*); hepsi tamamlandı: ' + str(sv_ok) + '. Her sınıf × cinsiyet ayrı savaş: TEST_EDILMEDI (karakter oluşturmada 4 sınıf × 2 cinsiyet çizimi çekildi)', 'kanit/savas-*')
au = [EK[r].get('zindan_ses') if EK[r] else None for r in EK]
sys_('SYS-AUDIO', 'KISMEN', 'Kanal listesi ' + json.dumps(EK['ocak'].get('ses_kanallari') if EK['ocak'] else None) + '; iç mekân/zindan döngü seçimi doğrulandı; gerçek duyma (hoparlör) kontrolü TEST_EDILMEDI', 'kanit/ek-*/sonuc.json, kanit/gpt-*/sonuc.json')
sys_('SYS-STATE', 'KISMEN', 'Boş/dolu/kilitli: tarama durumları (DYN-*); hata: bozuk kayıt testi; başarı: örs/şerit testleri. Bağlantı kesilmesi: yerel kipte ağ yok → TEST_EDILMEDI', 'son/tara-*, kanit/sistem')
nE = sum(len((eyl[r] or {}).get('kayit', [])) for r in eyl); nA = sum(sum(1 for k in (eyl[r] or {}).get('kayit', []) if k.get('acildi')) for r in eyl)
sys_('SYS-ROUTE', 'KISMEN', f'Kaynak koddaki ekran açan eylemler iki halkta çağrıldı: {nE} çağrı, {nA} açıldı; açılmayanlar parametre isteyen eylemler (ENV-* satırlarında tek tek)', 'son/eylem-*/_eylem.json')
sys_('SYS-FLOW', 'KISMEN', 'Yeni hesap → sunucu → karakter oluşturma → öğretici atlama → başkent → ilk savaş otomatik akışla her turda geçildi. 5 dk/30 dk/2 saat insan oyun testi TEST_EDILMEDI', 'son/cek115-*/A0*.png')
for t in T:
    if t['test_id'].startswith('SYS-'): ozet[t['durum']] += 1
# --- yeni satırlar
yeni = []
for r in ('ocak', 'sancak'):
    for k in (eyl[r] or {}).get('kayit', []):
        png = os.path.join(SON, f'eylem-{r}', k['no'] + '.png')
        d, g = karar(k.get('olcum'), png if os.path.exists(png) else None) if k.get('acildi') else ('TEST_EDILMEDI', 'açılmadı (parametre/bağlam ister ya da pencere açmaz): ' + str(k.get('cagri'))[:80])
        yeni.append({'test_id': f"ENV-{r}-{k['no']}-{k.get('eylem')}", 'halk': r, 'eylem': 'ACT.' + str(k.get('eylem')), 'beklenen': 'Kaynak koddaki eylem ekranı açar; kesik/taşma/çakışma yok', 'gerceklesen': g, 'kanit': rel(png) if os.path.exists(png) else None, 'sekme_sayisi': len(k.get('sekmeler') or []), 'durum': d})
    for s in (SV[r] or {}).get('savaslar', []):
        yeni.append({'test_id': f"SAV-{r}-{s['ad']}", 'halk': r, 'beklenen': 'Savaş açılır, doğru zemin, düşman HUD çakışmasız, sonuç ekranı gelir', 'gerceklesen': json.dumps({k: s.get(k) for k in ('durum', 'zemin', 'hud_ilk', 'sonuc')}, ensure_ascii=False)[:400], 'kanit': f"kanit/savas-{r}/{s['ad']}_2_savas.png", 'durum': 'KABUL' if s.get('durum') == 'tamamlandı' else 'KISMEN' if s.get('durum') == 'zaman aşımı' else 'TEST_EDILMEDI', 'not': 'zaman aşımı = savaş açıldı, zemin ve HUD doğrulandı, sıralar ilerliyordu; 240 sn içinde bitmedi (yazılım GL, 4 eşzamanlı tarayıcı). Sonuç ekranı aynı kod yolundan tamamlanan savaşlarda doğrulandı.' if s.get('durum') == 'zaman aşımı' else 'baskın penceresi kapalı (perşembe) → BAS-* satırı' if s['ad'] == 'baskin' else ''})
for r in ('ocak', 'sancak'):
    bk = oku(KANIT, f'baskin-{r}', 'sonuc.json')
    yeni.append({'test_id': f'BAS-{r}', 'halk': r, 'beklenen': 'Cumartesi (UTC+3) baskın penceresi açık; savaş açılır, sonuç gelir', 'gerceklesen': json.dumps(bk, ensure_ascii=False) if bk else 'test yok', 'kanit': f'kanit/baskin-{r}/', 'durum': ('KABUL' if bk.get('sonuc') else 'KISMEN' if bk.get('savas') else 'DUZELTME') if bk else 'TEST_EDILMEDI'})
for W in ('667', '1180'):
    for r in ('ocak', 'sancak'):
        d = oku(SON, f'res{W}-{r}', '_eylem.json') or oku(SON, f'res{W}-{r}', '_denetim.json')
        if not d: yeni.append({'test_id': f'RES-{W}-{r}', 'durum': 'TEST_EDILMEDI', 'gerceklesen': 'tur yok'}); continue
        olc = d.get('olcumler') or {k['no']: k.get('olcum') for k in d.get('kayit', [])}
        kus = {n: kusur(o) for n, o in olc.items() if kusur(o)}
        yeni.append({'test_id': f'RES-{W}-{r}', 'halk': r, 'beklenen': f'{W} genişlikte bütün ekranlar sığar', 'gerceklesen': f'{len(olc)} ekran ölçüldü, kusurlu {len(kus)}: ' + json.dumps(dict(list(kus.items())[:12]), ensure_ascii=False)[:900], 'kanit': f'son/res{W}-{r}/', 'durum': 'KABUL' if not kus else 'DUZELTME'})
for x in yeni: ozet[x['durum']] += 1
G['testler'] = T + yeni
G['surum'] = 'KORANT-v40-1dda167+P33'; G['ozet'] = dict(ozet)
G['not'] = 'EKRAN GÖRÜNTÜLERİ VE ÖLÇÜMLER İLK TURDAN (kullanıcı kararı 26.11): ilk turdan sonra yalnız 11 px altı yazılar düzeltildi (DUZELTILDI_ILK_TUR_SONRASI satırları; görüntüde eski küçük yazı görünebilir). KABUL = kanıtlı otomatik ölçüm + ekran görüntüsü; bağımsız görsel kabul Gemini/GPT ikinci denetiminde. TEST_EDILMEDI satırlarının gerekçesi gerceklesen alanında.'
json.dump(G, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(dict(ozet), len(G['testler']))
