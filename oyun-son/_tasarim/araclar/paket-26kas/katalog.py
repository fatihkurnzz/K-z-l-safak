# Yayındaki (sürüm 40) bütün görsel/ses varlıklarının kataloğu: düz dosyalar + JS'e gömülü görseller.
import os,sys,json,hashlib,re
from PIL import Image
G,GOM,OUT=sys.argv[1],sys.argv[2],sys.argv[3]
YAYIN_DISI=lambda p: p.startswith(('img/items3d/','models/test/','video/','_tasarim/')) or re.match(r'img/icons/.*-512',p) and 'icon-512' not in p and 'maskable' not in p
def sha(b): return hashlib.sha256(b).hexdigest()
def boyut(p):
    try:
        with Image.open(p) as im: return list(im.size), im.mode
    except Exception: return None,None
# kaynak kodu (kullanım araması için)
kod={}
for d in ['js','css','shared']:
    for f in os.listdir(os.path.join(G,d)):
        if f.endswith(('.js','.css')) and not re.search(r'(-png|-veri|b2d-[a-z0-9]+|esya2-[a-z]+|kd-png)\.js$',f): kod[d+'/'+f]=open(os.path.join(G,d,f),encoding='utf-8').read()
kod['index.html']=open(os.path.join(G,'index.html'),encoding='utf-8').read()
def kullanan(ad):
    return sorted(k for k,v in kod.items() if ad in v)
K=[]
for d in ['img','sahneler','interiors','audio','models','fonts']:
    for r,_,fs in os.walk(os.path.join(G,d)):
        for f in fs:
            p=os.path.relpath(os.path.join(r,f),G)
            if YAYIN_DISI(p): continue
            b=open(os.path.join(G,p),'rb').read()
            wh,mode=boyut(os.path.join(G,p)) if f.lower().endswith(('.png','.webp','.jpg','.jpeg')) else (None,None)
            key=p if d=='interiors' else os.path.basename(p)
            K.append({'kimlik':p,'tur':'dosya','yol':p,'bicim':f.rsplit('.',1)[-1].lower(),'bayt':len(b),'sha256':sha(b),'olcu':wh,'renk_kipi':mode,'kodda_dogrudan_gecen':kullanan(key) or kullanan(p.split('/',1)[1]),'kodda_dolayli':(lambda a:a)([] if (kullanan(key) or kullanan(p.split('/',1)[1])) else sorted(set(kullanan(re.split(r'[_\-.]',os.path.basename(p))[0]+'_')+kullanan(p.split('/')[0]+'/'+(p.split('/')[1]+'/' if p.count('/')>1 else ''))+kullanan("'"+p.split('/')[0]+'/')) ))})
man=json.load(open(os.path.join(GOM,'_cikarilan.json')))
modkul={}
for m in set(x['kaynak_js'] for x in man):
    ad=os.path.basename(m)[:-3]
    modkul[m]=sorted(k for k,v in kod.items() if re.search(r"['\"/]"+re.escape(ad)+r"\.js",v))
for x in man:
    wh,mode=boyut(os.path.join(GOM,x['dosya']))
    K.append({'kimlik':x['kaynak_js']+'#'+x['anahtar'],'tur':'gomulu','kaynak_js':x['kaynak_js'],'anahtar':x['anahtar'],'cikarilan_dosya':x['dosya'],'bicim':x['bicim'],'bayt':x['bayt'],'sha256':x['sha256'],'olcu':wh,'renk_kipi':mode,'modulu_yukleyen':modkul[x['kaynak_js']]})
# aynı içerik (sha) tekrarları
from collections import defaultdict
by=defaultdict(list)
for k in K: by[k['sha256']].append(k['kimlik'])
for k in K:
    t=[i for i in by[k['sha256']] if i!=k['kimlik']]
    if t: k['ayni_icerik']=t
json.dump(K,open(OUT,'w'),ensure_ascii=False,indent=1)
print(len(K),'varlık;',sum(1 for k in K if k['tur']=='dosya'),'dosya;',sum(1 for v in by.values() if len(v)>1),'tekrar grubu')
