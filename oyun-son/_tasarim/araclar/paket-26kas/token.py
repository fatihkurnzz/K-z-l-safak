# CSS'te tanımlanan bütün tasarım değişkenleri (--ad: değer), seçiciyle; index.html yükleme sırasına göre
import re,sys,json,os
G,OUT=sys.argv[1],sys.argv[2]
sira=re.findall(r'href="(css/[^"]+)"',open(os.path.join(G,'index.html'),encoding='utf-8').read())
R=[]
for i,f in enumerate(sira):
    t=open(os.path.join(G,f),encoding='utf-8').read()
    t=re.sub(r'/\*.*?\*/','',t,flags=re.S)
    for m in re.finditer(r'([^{}]+)\{([^{}]*)\}',t):
        sel=' '.join(m.group(1).split())
        for d in re.finditer(r'(--[\w-]+)\s*:\s*([^;]+)',m.group(2)):
            v=d.group(2).strip()
            if 'data:' in v: v='[gömülü görsel]'
            R.append({'dosya':f,'yukleme_sirasi':i+1,'secici':sel[-160:],'degisken':d.group(1),'deger':v[:200]})
json.dump(R,open(OUT,'w'),ensure_ascii=False,indent=1)
ad=sorted(set(r['degisken'] for r in R))
print(len(R),'tanım',len(ad),'ayrı değişken; :root/html:',sum(1 for r in R if re.match(r'^(:root|html)',r['secici'])))
