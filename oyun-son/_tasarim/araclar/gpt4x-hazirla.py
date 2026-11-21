import sys,os
import numpy as np, cv2
from PIL import Image
A,O=sys.argv[1],sys.argv[2]
H={'Kragmir':'ocak','Elentha':'sancak'}
def kaydet(im,yol,boy=None,q=90):
    os.makedirs(os.path.dirname(yol),exist_ok=True)
    if boy: im=im.resize(boy,Image.LANCZOS)
    im.save(yol,'WEBP',quality=q,method=6); print(yol, im.size, os.path.getsize(yol))
P48=A+'/Vahran_4_8_4_9_NIHAI_TEK_TESLIM/varliklar'
for k,h in H.items():
    for src,dst in [('crest','arma'),('banner','sancak'),('seal','muhur')]:
        kaydet(Image.open(f'{P48}/YENI_4_8/{k}/{src}_256.png'),f'{O}/arma/{h}-{dst}.webp')
    for n in ['ayarlar','bildirim','kapat','kilit','muzik','onay','ses','yardim']:
        kaydet(Image.open(f'{P48}/4_9_YENI/{k}/{n}_128.png'),f'{O}/sistem/{h}-{n}.webp')
    V2=A+'/Vahran_Canta_Magaza_Bagimsiz_Sprite_V2/Vahran_Canta_Magaza_Bagimsiz_Sprite_V2/sprites'
    for n in ['silah','zirh','taki','tuketim']:
        kaydet(Image.open(f'{V2}/{k}_kategori_{n}.png'),f'{O}/canta/{h}-kat-{n}.webp',(96,96))
    kaydet(Image.open(f'{V2}/{k}_esya_yuvasi_locked.png'),f'{O}/canta/{h}-yuva-kilit.webp',(128,128))
# Kahramanlar
K=A+'/Vahran_4_11_Karakter_Animasyon_Konsept_Set'
el=np.array(Image.open(K+'/Elentha_On_Gorunum_Referans.png').convert('RGB'))
# beyaz zemin: kenardan taşkın doldurma
g=(el.astype(int).min(2)>238).astype(np.uint8)
n,lab=cv2.connectedComponents(g)
kenar=set(lab[0,:])|set(lab[-1,:])|set(lab[:,0])|set(lab[:,-1]); kenar.discard(0)
bg=np.isin(lab,list(kenar))
a=np.where(bg,0,255).astype(np.uint8); a=cv2.GaussianBlur(cv2.erode(a,np.ones((3,3))),(3,3),0)
im=Image.fromarray(np.dstack([el,a]),'RGBA'); im=im.crop(im.getbbox())
kaydet(im,f'{O}/kahraman/sancak.webp',(round(im.width*900/im.height),900),85)
kr=np.array(Image.open(K+'/Iki_Taraf_Donus_Referansi.png').convert('RGB'))
x0,y0,x1,y1=90,470,560,1012
sub=kr[y0:y1,x0:x1].copy()
mask=np.zeros(sub.shape[:2],np.uint8); bgd=np.zeros((1,65),np.float64); fgd=np.zeros((1,65),np.float64)
cv2.grabCut(cv2.cvtColor(sub,cv2.COLOR_RGB2BGR),mask,(30,12,x1-x0-60,y1-y0-20),bgd,fgd,8,cv2.GC_INIT_WITH_RECT)
m=np.where((mask==1)|(mask==3),255,0).astype(np.uint8)
n,lab,st,_=cv2.connectedComponentsWithStats(m); big=1+np.argmax(st[1:,4]); m=np.where(lab==big,255,0).astype(np.uint8)
m=cv2.GaussianBlur(m,(5,5),0)
im=Image.fromarray(np.dstack([sub,m]),'RGBA'); im=im.crop(im.getbbox())
kaydet(im,f'{O}/kahraman/ocak.webp',None,85)
# Kervan salonu (mağaza referansı): sol mavi = sancak, sağ kırmızı = ocak
mg=Image.open(A+'/Vahran_4_14_Canta_Magaza_Gorsel_Entegrasyon/magaza_referans.png').convert('RGB')
kaydet(mg.crop((236,152,706,336)),f'{O}/kervan/sancak.webp',None,82)
kaydet(mg.crop((990,152,1460,336)),f'{O}/kervan/ocak.webp',None,82)
