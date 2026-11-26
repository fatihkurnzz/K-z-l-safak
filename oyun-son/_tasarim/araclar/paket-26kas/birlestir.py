# ekran-hd (ana tur) + ekran-hd2 (hayalet katmansız yeniden çekim) + ekran-hd3 (savaş sonucu) → ekran-son
import os,shutil,json,sys
S=sys.argv[1]
YENI2=['C-quick','C-han','C-ahir','C-zaferAniti','D01-vs-1-1','D02-savas-a','D03-savas-b']
for r in ['sancak','ocak']:
    o=os.path.join(S,'ekran-son',r); shutil.rmtree(o,ignore_errors=True); os.makedirs(o)
    a,b,c=[os.path.join(S,x,r) for x in ['ekran-hd','ekran-hd2','ekran-hd3']]
    for f in sorted(os.listdir(a),key=lambda f:os.path.getmtime(os.path.join(a,f))):
        if f.endswith('.png') and f[:-4] not in YENI2+['D04-savas-sonucu']: shutil.copy2(os.path.join(a,f),o)
    for f in YENI2: shutil.copy2(os.path.join(b,f+'.png'),o)
    shutil.copy2(os.path.join(c,'D04-savas-sonucu.png'),o)
    den=json.load(open(os.path.join(a,'_denetim.json'))); d2={x['ekran']:x for x in json.load(open(os.path.join(b,'_denetim.json')))['sonuc']}
    den['sonuc']=[d2.get(x['ekran'],x) if x['ekran'] in ('quick','han','ahir','zaferAniti') else x for x in den['sonuc'] if x['ekran']!='charSwitchMenu']
    json.dump(den,open(os.path.join(o,'_denetim.json'),'w'),ensure_ascii=False,indent=1)
    L=[l for l in open(os.path.join(a,'_log.txt')).read().split('\n') if not l.startswith(('C-charSwitchMenu','C-quick','C-han','C-ahir','C-zaferAniti','D0','JS-HATA'))]
    L2=[l for l in open(os.path.join(b,'_log.txt')).read().split('\n') if l.startswith(('C-quick','C-han','C-ahir','C-zaferAniti','D01','D02'))]
    L3=[l for l in open(os.path.join(c,'_log.txt')).read().split('\n') if l.startswith(('D04','JS-HATA'))]
    open(os.path.join(o,'_log.txt'),'w').write('\n'.join(L+L2+L3))
    print(r,len([f for f in os.listdir(o) if f.endswith('.png')]),L3)
