# Kaynak koddaki bütün ACT işleyicilerini sınıflandırır: pencere/katman açan, okuma, yazma (durum değiştiren), parametreli
import re,os,sys,json
G=sys.argv[1]; R=[]
OKU=re.compile(r"\.(peek|list|view|get|convs|plan|top|mine|history|search|roster|ledger|map|item|read|info|state|board|card|status|log)['\"`]")
for f in sorted(os.listdir(os.path.join(G,'js'))):
    if not f.endswith('.js') or re.search(r'png|veri|b2d-|esya2',f): continue
    t=open(os.path.join(G,'js',f),encoding='utf-8').read(); L=t.split('\n')
    for i,l in enumerate(L):
        for m in re.finditer(r'\bACT\.([A-Za-z0-9_]+)\s*=(?!=)',l):
            ad=m.group(1); govde=[l[m.start():]]
            for j in range(i+1,min(i+60,len(L))):
                if re.match(r'^(ACT\.|export |function |const |let |//)',L[j]): break
                govde.append(L[j])
            g='\n'.join(govde)
            runs=re.findall(r"run\(\s*['\"`]([a-zA-Z0-9_.]+)",g)
            yaz=[r for r in runs if not OKU.search("."+r.split('.')[-1]+"'")]
            ac=sorted(set(re.findall(r'\b(openWin|showModal|binaAc|diyalog|say|confirmBox|openVs|startBattle|toast|ACT\.(?:go[A-Z]\w*|building|tab|stage))\b',g)))
            R.append({'eylem':ad,'dosya':'js/'+f,'satir':i+1,'acar':ac,'okuma':[r for r in runs if r not in yaz],'yazma':yaz,
                      'parametre':bool(re.search(r'\bd\??\.\w|\(\s*\{\s*\w',g)), 'dev':ad.startswith('dev'), 'ozet':l.strip()[:160]})
ad={}
for r in R: ad.setdefault(r['eylem'],[]).append(r)
json.dump(R,open('act_envanter.json','w'),ensure_ascii=False,indent=1)
print(len(R),'tanım',len(ad),'ayrı eylem')
pen=[r for r in R if r['acar'] and not r['yazma'] and not r['dev']]
print('pencere/katman açan ve yazmayan',len(pen))
print('yazan',sum(1 for r in R if r['yazma']),'dev',sum(1 for r in R if r['dev']))
