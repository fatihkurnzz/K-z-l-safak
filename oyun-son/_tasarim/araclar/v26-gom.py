# v26-sablon.css içindeki ../img/kd/v4/... yollarını data: URI olarak gömüp css/v26-gpt4.css yazar.
# (Yayında bir sürüm en çok 511 dosya alır; görseller ayrı dosya olarak eklenemiyor.)
# Kullanım: python3 v26-gom.py <oyun-son>
import sys,re,base64,os
R=sys.argv[1]; T=open(R+'/_tasarim/araclar/v26-sablon.css').read()
def gom(m):
    p=R+'/_tasarim/gelen/gpt-4x/webp/'+m.group(1)
    return 'url("data:image/webp;base64,'+base64.b64encode(open(p,'rb').read()).decode()+'")'
out=re.sub(r'url\("\.\./img/kd/v4/([^"]+)"\)',gom,T)
out='/* OTOMATİK ÜRETİLİR: _tasarim/araclar/v26-gom.py (kaynak v26-sablon.css) — elle düzenleme */\n'+out
open(R+'/css/v26-gpt4.css','w').write(out); print(len(out))
