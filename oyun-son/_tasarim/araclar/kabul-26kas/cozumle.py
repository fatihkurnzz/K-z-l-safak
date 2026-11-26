# Ön tur ölçümlerini toplar: küçük yazı / 28 px altı hedef / kesik / taşma / çakışma; seçiciye göre sıklık. python3 -I cozumle.py <klasör>...
import json, sys, os, re, collections
C = {k: collections.Counter() for k in ['kucukYazi', 'kucuk28', 'kucuk44', 'kesik', 'tasma', 'cakisma']}; ORN = collections.defaultdict(set)
def ekle(o, yer):
    if not isinstance(o, dict): return
    for k in C:
        for x in o.get(k, []):
            key = re.sub(r' \d+(\.\d+)?px', '', re.sub(r' \d+x\d+', '', x)); key = re.sub(r' «.*', '', key)
            C[k][key] += 1; ORN[(k, key)].add(yer)
for d in sys.argv[1:]:
    for f in ['_eylem.json', '_cekim.json', '_denetim.json']:
        p = os.path.join(d, f)
        if not os.path.exists(p): continue
        J = json.load(open(p, encoding='utf-8'))
        for n, o in (J.get('olcumler') or {}).items(): ekle(o, f"{d.split('/')[-1]}:{n}")
        for k in J.get('kayit', []):
            ekle(k.get('olcum'), f"{d.split('/')[-1]}:{k.get('etiket') or k.get('no')}")
            for s in k.get('sekmeler', []) if isinstance(k.get('sekmeler'), list) else []: ekle(s.get('olcum'), f"{d.split('/')[-1]}:{k.get('etiket')}~{s['sekme']}")
for k, c in C.items():
    print(f'\n== {k} ({sum(c.values())})')
    for key, n in c.most_common(40): print(f'  {n:4d}  {key}   örn: {sorted(ORN[(k, key)])[:3]}')
