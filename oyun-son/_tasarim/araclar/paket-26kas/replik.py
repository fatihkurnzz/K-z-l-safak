# NPC replikleri: diyalog/say çağrılarının ve kral satırlarının kaynak satırları (olduğu gibi), dosya:satır ile
import re,sys,os,json
G,OUT=sys.argv[1],sys.argv[2]
R=[]
for f in sorted(os.listdir(os.path.join(G,'js'))):
    if not f.endswith('.js') or re.search(r'png|veri|b2d-|esya2|i18n|en-content|adlar',f): continue
    L=open(os.path.join(G,'js',f),encoding='utf-8').read().split('\n'); i=0
    while i<len(L):
        l=L[i]
        if re.search(r'\bsay\(\s*[A-Z_]+_SVG|diyalog\(\{|^\s*lines\s*:|ormanIzci|satirlar\s*:\s*\[',l) and not re.search(r'^\s*(export\s+)?(function|const)\s+(say|diyalog)\b',l):
            j=i; blok=[l]
            while not re.search(r'\]\s*[,)}]|\);\s*$',L[j]) and j-i<14 and j+1<len(L): j+=1; blok.append(L[j])
            R.append({'dosya':'js/'+f,'satir':i+1,'kaynak':'\n'.join(x[:1500] for x in blok)}); i=j+1; continue
        i+=1
json.dump(R,open(OUT,'w'),ensure_ascii=False,indent=1); print(len(R), sorted(set(r['dosya'] for r in R)))
