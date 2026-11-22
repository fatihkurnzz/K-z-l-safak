#!/usr/bin/env python3
# Türkçe eşya/yetenek adları (Gemini M5, kullanıcı onaylı) → js/adlar-tr.js (OTOMATİK; elle düzenleme).
# Kullanım: python3 -I _tasarim/araclar/adlar-gom.py <oyun-son>
# Girdi: _tasarim/denetim-22kas/adlar-m5.csv (kimlik, mevcut_ad, onerilen_ad, gerekce)
import csv, json, sys, os

root = sys.argv[1] if len(sys.argv) > 1 else '.'
src = os.path.join(root, '_tasarim/denetim-22kas/adlar-m5.csv')
rows = list(csv.DictReader(open(src, encoding='utf-8-sig')))
items, skills = {}, {}
for r in rows:
    k, en, tr = r['kimlik'].strip(), r['mevcut_ad'].strip(), r['onerilen_ad'].strip()
    if not k or not tr or tr == en:
        continue
    if k.startswith('skill:'):
        skills[k[6:]] = tr
    else:
        items[k] = tr
js = ('// OTOMATİK (_tasarim/araclar/adlar-gom.py ← _tasarim/denetim-22kas/adlar-m5.csv). Elle düzenleme.\n'
      'const ITEM_TR = ' + json.dumps(items, ensure_ascii=False, separators=(',', ':')) + ';\n'
      'const SKILL_TR = ' + json.dumps(skills, ensure_ascii=False, separators=(',', ':')) + ';\n'
      + open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'adlar-kod.js'), encoding='utf-8').read())
open(os.path.join(root, 'js/adlar-tr.js'), 'w', encoding='utf-8').write(js)
print('eşya', len(items), 'yetenek', len(skills))
