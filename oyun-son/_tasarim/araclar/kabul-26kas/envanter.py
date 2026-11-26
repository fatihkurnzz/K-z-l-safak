# Kaynak kod + dinamik tarama → tam ekran envanteri. python3 -I envanter.py <is klasörü> <çıktı klasörü>
import json, os, re, sys, collections
IS, OUT = sys.argv[1], sys.argv[2]; os.makedirs(OUT, exist_ok=True)
ENV = json.load(open(os.path.join(IS, 'act_envanter.json'), encoding='utf-8'))
TARA = {r: json.load(open(os.path.join(IS, f'tara-{r}', 'durumlar.json'), encoding='utf-8')) for r in ['sancak', 'ocak']}
ESKI = json.load(open('/tmp/claude-0/-home-user-K-z-l-safak/9e10c614-e18c-4eb3-a639-1ca9f04ed31c/scratchpad/cikti/ekranlar/_ekran_kaydi.json', encoding='utf-8'))
HALK = {'sancak': 'elentha', 'ocak': 'kragmir'}
def tur(r):
    a = r['acar']
    if r['eylem'] in ('tab',): return 'sekme değiştirme'
    if re.match(r'^(go[A-Z]|gate[A-Z]|travel|hub$)', r['eylem']): return 'yönlendirme (yer değiştirir)'
    if 'openWin' in a: return 'pencere'
    if 'binaAc' in a: return 'bina katmanı'
    if 'diyalog' in a or 'say' in a: return 'NPC diyaloğu'
    if 'confirmBox' in a: return 'onay penceresi' + (' + veri yazar' if r['yazma'] else '')
    if 'showModal' in a: return 'modal'
    if 'openVs' in a or 'startBattle' in a or 'ACT.stage' in a: return 'savaş / VS'
    if r['yazma']: return 'işlem (veri yazar, ekran açmaz ya da yalnız bildirim)'
    if r['dev']: return 'geliştirici aracı'
    if 'toast' in a: return 'bildirim'
    return 'diğer (yardımcı/iç eylem)'
gor = collections.defaultdict(lambda: collections.defaultdict(list))  # eylem → halk → durum no
for r, T in TARA.items():
    for d in T['durumlar']:
        for st in d['tarif'][-1:]: gor[st['a']][r].append(d['no'])
CAG = json.load(open(os.path.join(IS, 'act_cagrilar.json'), encoding='utf-8'))
ACAN = ('pencere', 'bina katmanı', 'NPC diyaloğu', 'modal', 'onay penceresi', 'onay penceresi + veri yazar', 'savaş / VS', 'yönlendirme (yer değiştirir)')
_t0 = {}
for r in ENV: _t0.setdefault(r['eylem'], tur(r))
def etkin(a, d=0, seen=None):
    t = _t0.get(a, 'tanımsız'); seen = seen or set()
    if t in ACAN or d > 4: return t, None
    for c in CAG.get(a, []):
        if c in seen: continue
        seen.add(c); tc, via = etkin(c, d + 1, seen)
        if tc in ACAN: return tc, (via or c)
    return t, None
rows = []
for a, defs in sorted(collections.defaultdict(list, {}).items()): pass
by = collections.defaultdict(list)
for r in ENV: by[r['eylem']].append(r)
for a, defs in sorted(by.items()):
    r0 = defs[0]; t, via = etkin(a)
    rows.append({'eylem': a, 'tur': t, 'kaynak': [f"{d['dosya']}:{d['satir']}" for d in defs], 'okur': sorted({x for d in defs for x in d['okuma']}), 'yazar': sorted({x for d in defs for x in d['yazma']}),
                 'parametreli': any(d['parametre'] for d in defs), 'uzerinden': via, 'taramada_ulasilan_durum': {HALK[h]: v for h, v in gor.get(a, {}).items()}})
durumlar = []
for r, T in TARA.items():
    for d in T['durumlar']:
        durumlar.append({'halk': HALK[r], 'no': d['no'], 'imza': d['sig'], 'derinlik': len(d['tarif']), 'tarif': ' → '.join(f"{s['a']}({','.join(f'{k}={v}' for k, v in s['ds'].items() if k != 'a')})" for s in d['tarif']) or 'açılış (başkent)', 'kanit_dpr1': f"tara-{r}/k/{d['no']:04d}.jpg"})
sayac = collections.Counter(x['tur'] for x in rows)
pencere_like = [x for x in rows if x['tur'] in ('pencere', 'bina katmanı', 'NPC diyaloğu', 'modal', 'onay penceresi', 'onay penceresi + veri yazar', 'savaş / VS', 'yönlendirme (yer değiştirir)')]
ulas = [x for x in pencere_like if x['taramada_ulasilan_durum']]
eski_ids = {h: {e['ekran_kimligi'] for e in v['ekranlar']} for h, v in ESKI.items()}
sig_say = {HALK[r]: len({d['sig'] for d in T['durumlar']}) for r, T in TARA.items()}
sekmeler = {HALK[r]: sorted({re.search(r'~([\w-]+)', d['sig']).group(1) + ' (' + d['sig'].split('|')[0][2:] + ')' for d in T['durumlar'] if '~' in d['sig']}) for r, T in TARA.items()}
ozet = {'kaynak_ACT_tanimi': len(ENV), 'ayri_eylem': len(rows), 'tur_dagilimi': dict(sayac), 'ekran_acan_eylem': len(pencere_like), 'taramada_ulasilan_ekran_acan_eylem': len(ulas),
        'tarama_durumu': sig_say, 'onceki_cekim_ekran_kimligi': {h: len(v) for h, v in eski_ids.items()}, 'birlesik_onceki': len(eski_ids['elentha'] | eski_ids['kragmir']),
        'not': 'Oyunun tamamı = kaynak koddaki bütün ekran açan eylemler + parametreli varyantlar + dinamik durumlar (onay, diyalog, savaş evresi, sonuç). 115 yalnız önceki otomatik çekimin kimlik sayısıdır.'}
json.dump({'ozet': ozet, 'eylemler': rows, 'durumlar': durumlar, 'sekmeler': sekmeler}, open(os.path.join(OUT, 'ekran_envanteri.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
md = ['# Ekran envanteri (kaynak kod + dinamik tarama) — KORANT-v40-1dda167 + P33\n',
      f"Kaynak kodda **{ozet['kaynak_ACT_tanimi']} ACT tanımı / {ozet['ayri_eylem']} ayrı eylem** var (`js/*.js`; tarayıcı `act_tara.py`). Ekran açanlar (pencere, bina katmanı, modal, diyalog, onay, savaş/VS, yer değişimi): **{ozet['ekran_acan_eylem']}**. "
      f"Dinamik tarama (`tara.js`, başkentten 3 adım derinliğe kadar her görünen `[data-a]` öğesine dokunur; veri yazan eylemlere dokunmaz) iki halkta **{sig_say['elentha']} / {sig_say['kragmir']} ayrı durum** buldu; ekran açan eylemlerin **{len(ulas)}**'ine taramada ulaşıldı. "
      f"Önceki otomatik çekimin 115 kimliği (Elentha {ozet['onceki_cekim_ekran_kimligi']['elentha']}, Kragmir {ozet['onceki_cekim_ekran_kimligi']['kragmir']}) oyunun tamamı DEĞİLDİR; aşağıdaki tablo kapsamı gösterir.\n",
      '## Eylem türleri\n', '| Tür | Sayı |', '|---|---|'] + [f'| {k} | {v} |' for k, v in sayac.most_common()] + [
      '\n## Ekran açan eylemler (kaynak → tarama)\n', '| Eylem | Tür | Kaynak | Parametreli | Taramada ulaşılan durum (Elentha / Kragmir) |', '|---|---|---|---|---|']
for x in sorted(pencere_like, key=lambda x: (x['tur'], x['eylem'])):
    u = x['taramada_ulasilan_durum']; md.append(f"| `{x['eylem']}` | {x['tur']} | `{x['kaynak'][0]}` | {'evet' if x['parametreli'] else ''} | {', '.join(map(str, u.get('elentha', [])[:6])) or '—'} / {', '.join(map(str, u.get('kragmir', [])[:6])) or '—'} |")
md += ['\n## Alt sekmeler (taramada açılan)\n'] + [f"- **{h}**: " + ', '.join(f'`{s}`' for s in v) for h, v in sekmeler.items()]
md += ['\n## Dinamik durumlar (tarama)\n', '| Halk | No | Durum imzası | Derinlik | Varış tarifi |', '|---|---|---|---|---|'] + [f"| {d['halk']} | {d['no']} | `{d['imza'][:70]}` | {d['derinlik']} | `{d['tarif'][:120]}` |" for d in durumlar]
open(os.path.join(OUT, 'EKRAN_ENVANTERI.md'), 'w', encoding='utf-8').write('\n'.join(md) + '\n')
print(json.dumps(ozet, ensure_ascii=False, indent=1))
