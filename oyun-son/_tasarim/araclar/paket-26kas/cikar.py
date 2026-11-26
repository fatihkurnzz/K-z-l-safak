# Gömülü base64 görselleri JS dosyalarından çıkarır: "anahtar":"base64" çiftleri (iç içe nesnelerde yol takibi)
import re,sys,os,base64,json,hashlib
src,out=sys.argv[1],sys.argv[2]
SIG={'UklGR':'webp','iVBOR':'png','/9j/':'jpg'}
man=[]
for fn in sorted(os.listdir(src)):
    if not fn.endswith('.js'): continue
    t=open(os.path.join(src,fn),encoding='utf-8').read()
    if not re.search(r'"(UklGR|iVBOR|/9j/)',t): continue
    # yol takibi: her eşleşmeden önceki açık anahtarlar
    stack=[];i=0;n=len(t);cnt=0
    tok=re.compile(r'(?:"((?:[^"\\]|\\.)*)"|\b([A-Za-z0-9_$]+))\s*:\s*(\{|"(?:data:image/[a-z]+;base64,)?((?:UklGR|iVBOR|/9j/)[A-Za-z0-9+/=]+)")|\{|\}')
    for m in tok.finditer(t):
        g=m.group(0)
        key=m.group(1) if m.group(1) is not None else m.group(2)
        if key is None:
            if g=='{': stack.append(None)
            else:
                if stack: stack.pop()
            continue
        if m.group(3)=='{': stack.append(key); continue
        b=m.group(4); ext=next(v for k,v in SIG.items() if b.startswith(k))
        path=[s for s in stack if s]+[key]
        raw=base64.b64decode(b)
        name='__'.join(path)
        name=re.sub(r'[^A-Za-z0-9._\-~]+','_',name)[:150]
        d=os.path.join(out,fn[:-3]); os.makedirs(d,exist_ok=True)
        p=os.path.join(d,name+'.'+ext)
        open(p,'wb').write(raw); cnt+=1
        man.append({'kaynak_js':'js/'+fn,'anahtar':'.'.join(path),'dosya':os.path.relpath(p,out),'bicim':ext,'bayt':len(raw),'sha256':hashlib.sha256(raw).hexdigest()})
    print(fn,cnt)
json.dump(man,open(os.path.join(out,'_cikarilan.json'),'w'),ensure_ascii=False,indent=1)
print('toplam',len(man))
