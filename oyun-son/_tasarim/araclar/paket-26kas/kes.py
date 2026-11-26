# Ham kayıttan savaş kliplerini keser (VS → savaş → sonuç), VP9'a çevirir
import json,os,subprocess,sys,glob
S=sys.argv[1]; O=os.path.join(S,'kayit'); os.makedirs(O,exist_ok=True)
AD={'sancak':'elentha','ocak':'kragmir'}; ST={'1-1':'vahran-1-1_normal','1-25':'vahran-1-25_boss-kurtadam'}
for r in ['sancak','ocak']:
    z=json.load(open(os.path.join(S,'kayit-ham',r,f'{r}-zaman.json'))); t0=z['kayit_baslangici_ms']; v=glob.glob(os.path.join(S,'kayit-ham',r,'_ham','*.webm'))[0]
    for st,x in z['zaman'].items():
        a=max(0,(x['bas']-t0)/1000-0.5); b=(x['bit']-t0)/1000
        out=os.path.join(O,f"savas_{AD[r]}_{ST[st]}.webm")
        subprocess.run(['ffmpeg','-v','error','-y','-ss',f'{a:.2f}','-to',f'{b:.2f}','-i',v,'-c:v','libvpx-vp9','-crf','34','-b:v','0','-row-mt','1','-an',out],check=True)
        print(os.path.basename(out),round(b-a,1),'sn',round(os.path.getsize(out)/1e6,2),'MB',x['sonuc'])
