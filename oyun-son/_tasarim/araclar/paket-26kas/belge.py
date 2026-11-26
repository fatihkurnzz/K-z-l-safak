# Oyun verisinden (shared/ dökümü) Türkçe özet belgeleri üretir. Kaynak: veri-json/*.json (koddan, değiştirilmeden)
import json,sys,os,csv
V,OUT=sys.argv[1],sys.argv[2]; os.makedirs(OUT,exist_ok=True)
j=lambda f: json.load(open(os.path.join(V,f+'.json')))
c=j('content'); z=j('zones'); b=j('bestiary'); it=j('items'); sk=j('skills'); mq=j('anagorev'); de=j('destan')
npc=j('npc'); han=j('han'); ahir=j('ahir'); dr=j('drops'); sinks=j('sinks'); sp=j('config__storePrices'); mini=j('minidizi')
def ozet(x):
    if isinstance(x,dict):
        if 't' in x: return f"{x.get('n','')} {x['t']}" + (f" (kademe {x['g']})" if 'g' in x else '')
        return ', '.join(f'{k}: {ozet(v)}' for k,v in x.items())
    if isinstance(x,list): return ' + '.join(ozet(v) for v in x)
    return str(x)
def tablo(bas,rows): return '| '+' | '.join(bas)+' |\n|'+'---|'*len(bas)+'\n'+''.join('| '+' | '.join(str(v).replace('|','/').replace('\n',' ') for v in r)+' |\n' for r in rows)
W=lambda ad,s: open(os.path.join(OUT,ad),'w',encoding='utf-8').write(s)
KAY='\n\n> Kaynak: oyunun `shared/` modülleri (sürüm 40), değiştirilmeden JSON\'a dökülmüştür (`veri_json/`). Sayılar koddan okunmuştur; bu belge yalnız özettir, çelişkide JSON geçerlidir.\n'
# --- KARAKTER
s='# Karakter, sınıf, ırk ve cinsiyet\n'+KAY
s+='\n## Halklar (ırklar)\n'+tablo(['Kimlik','Ad','Slogan','Renk','Başkent','Açıklama'],[[k,v['name'],v['motto'],v['color'],c['CAPITALS'][k],v['desc']] for k,v in c['FACTIONS'].items()])
s+='\nKragmir = ork (`ocak`, ten YEŞİL), Elentha = insan (`sancak`). Kod kimlikleri `ocak`/`sancak`, görsel klasörleri `kragmir`/`elentha`.\n'
s+='\n## Sınıflar\n'+tablo(['Kimlik','Ad','Rol','Ana nitelik','Zırh','Silahlar','Ağaçlar','Temel can/saldırı/savunma/hız'],[[k,v['name'],v['role'],v['main'],v['armor'],', '.join(v['weapons']),', '.join(v['trees']),f"{v['base']['hp']}/{v['base']['atk'] or v['base']['mag']}/{v['base']['def']}/{v['base']['spd']}"] for k,v in c['CLASSES'].items()])
s+=f"\nRahip sınıfının halka göre adı: {c['PRIEST_NAME']}. Savaşçı silahı kılıç + kalkan (kullanıcı kararı).\n"
s+='\n## Yetenek ağaçları\n'+tablo(['Kimlik','Ad','Sınıf','Açıklama'],[[k,v['name'],v['cls'],v.get('desc','')] for k,v in c['TREES'].items()])
s+=f"\n## Nitelikler\n"+tablo(['Kimlik','Ad'],[[k,(v['name'] if isinstance(v,dict) else v)] for k,v in c['STATS'].items()])
s+=f"\nSeviye başına nitelik puanı {c['STAT_POINTS_PER_LEVEL']}; yetenek puanı {c['SKILL_POINTS_FROM_LEVEL']}. seviyeden itibaren seviye başına {c['SKILL_POINTS_PER_LEVEL']}; ağaç düğümleri {c['TREE_NODES']}, uzmanlık ağacı {c['TREE_MAX']} puanda biter. Azami seviye {c['GAME']['maxLevel']}.\n"
s+='\n## Cinsiyet ve görünüm\n- Her halk × sınıf için kadın (`f`) ve erkek (`m`): 2 × 4 × 2 = **16 oynanabilir görünüm**.\n- Varsayılan: Elentha → kadın Savaşçı, Kragmir → erkek Savaşçı.\n- 2B tam boy seçim görselleri: `js/karakter-png-veri.js` anahtar `ırk.sınıf.cinsiyet` (16) + 20 yüz portresi `yuz.ırk.cinsiyet.no`.\n- Savaş pozları: `js/b2d-sancak.js`, `js/b2d-ocak.js` (kahraman başına 7 poz: bekleme, saldırı, büyü, vurulma, ölüm, zafer, koşu/özel; anahtar `sinif-cinsiyet.poz`).\n- 3B eski görünüm renkleri `HERO_LOOKS` (yalnız `?b2d=0` kipinde).\n'
W('KARAKTER_SINIF_IRK.md',s)
# --- DÜNYA
s='# Bölgeler, zindanlar, canavarlar ve bosslar\n'+KAY
s+='\n## Bölgeler\n'+tablo(['No','Ad','Seviye','Ortam','Açık','Aşama sayısı','Açıklama'],[[x['id'],x['name'],f"{x['lv'][0]}–{x['lv'][1]}",x['env'],x.get('open'),c_ if (c_:=z['STAGES_PER_ZONE']) else '',x['desc']] for x in z['ZONES']])
mobs=z['MOBS']; ml=mobs if isinstance(mobs,list) else list(mobs.values())
s+=f"\nToplam canavar türü (`MOBS`): {len(mobs)}. Aile (`FAMILIES`): {len(b['FAMILIES'])}. Bölge başına {z['STAGES_PER_ZONE']} aşama (stage kimliği `bölge-no`, ör. `1-1`).\n"
s+='\n## Canavar aileleri\n'+tablo(['Aile','Bölge','Blok','Element','Zayıflık','Üyeler (kimlik → ad)'],[[f['id'],f['zone'],f.get('block',''),f.get('el',''),f.get('weak',''),'; '.join(f"{m[0]} → {b['TR_NAME'].get(m[0],m[1])}" for m in f['m'])] for f in b['FAMILIES']])
s+='\n## Dünya bossları (`WORLD_BOSSES`)\n'+tablo(['Kimlik','Ad (EN kaynak)','Kademe','Element'],[[w[0],w[1],w[2],w[4] if len(w)>4 else ''] for w in b['WORLD_BOSSES']])
best=dict(z['MOBS']) if isinstance(z['MOBS'],dict) else {}
for k,v in (z['BEST'].get('mobs',{}) if isinstance(z.get('BEST'),dict) else {}).items(): best.setdefault(k,v)
boss=[(k,v) for k,v in best.items() if v.get('boss')]
s+='\n## Bölge / hikâye bossları\n'+tablo(['Kimlik','Ad','Bölge','Etkinlik/öğretici','Zayıflık','Evreler'],[[k,v['name'],v.get('zone'),('etkinlik ' if v.get('event') else '')+('öğretici' if v.get('tut') else ''),v.get('weak',''),' / '.join(p.get('text','') for p in v.get('phases',[]))] for k,v in boss])
s+='\n## Zindanlar (Baskın / Kapı)\n'+tablo(['Kimlik','Ad','Açılış seviyesi','Önizleme sahnesi'],[['well','Dipsiz Kuyu',c['UNLOCK'].get('well'),'sahneler/zindan_dipsiz_kuyu.webp'],['depth','Yeraltı Ocağı',c['UNLOCK'].get('depth'),'sahneler/zindan_yeralti_ocagi.webp'],['rift','Gök Yarığı',c['UNLOCK'].get('rift'),'sahneler/zindan_gok_yarigi.webp'],['seal','Mühürlü Oda',c['UNLOCK'].get('seal'),'sahneler/zindan_muhurlu_oda.webp'],['kule','Kül Kulesi (kule.js)','—','sahneler/zindan_kul_kulesi.webp']])
s+='\nEk etkinlikler: Kristal Nöbeti (`nobet.js`), Dünya Baskını (`baskin.js`), Oba Avı: Tepegöz (klan), Karakaya/Yelkaya Hisarı (`hisar*.js`), Meydan (PvP, `pvp*.js`), Destan (`destan.js`), Balık Tut (`balik.js`). Açılış seviyeleri `UNLOCK`: '+json.dumps(c['UNLOCK'],ensure_ascii=False)+'\n'
W('BOLGE_ZINDAN_CANAVAR_BOSS.md',s)
# --- HİKÂYE
s='# Hikâye ve görev metinleri\n'+KAY+'\nAna destan metni: `VAHRAN_destan.txt` (aynı klasörde). Ana görev 64 adım (`shared/anagorev.js`), Destan 8 bölüm (`shared/destan.js`).\n'
s+='\n## Ana görev bölümleri\n'+tablo(['No','Ad','Açıklama'],[[x['id'],x['name'],x.get('desc','')] for x in mq['MQ_CHAPTERS']])
s+='\n## Ana görev adımları (64)\n'+tablo(['Kimlik','Bölüm','Ad','Açıklama','Gereken','Ödül','Gider'],[[x['id'],x['ch'],x['ad'],x.get('acik',''),x.get('need',''),ozet(x.get('reward',[])),x.get('go','')] for x in mq['MQ']])
s+='\n## Destan bölümleri (halka göre metin)\n'
for d in de['DESTAN']:
    s+=f"\n### {d['roman']}. {d['name']} (seviye {d.get('lvl')}, tür {d.get('kind')})\nOynanış: {d.get('play','')}\nÖdül: {ozet(d.get('reward',[]))}\n"
    for h,t in (d.get('tale') or {}).items():
        for k,v in t.items():
            s+=f"\n**{h} · {k}:**\n"+('\n'.join('> '+x for x in v) if isinstance(v,list) else '> '+str(v))+'\n'
s+='\n## Mini Dizi\n'+tablo(['Bölüm','Ad','Video yolu (yayında YOK)'],[[x['ep'],x['ad'],x['video']] for x in mini['SERIES']])
s+='\n## Günlük görevler (`QUESTS`)\n'+tablo(['Kimlik','Ad','Gereken','Ödül'],[[q['id'],q['name'],q['need'],ozet(q['reward'])] for q in c['QUESTS']])+f"\nAltısı bitince: {ozet(c['QUEST_ALL'])}\n"
W('HIKAYE_VE_GOREVLER.md',s)
# --- EKONOMİ
s='# Ekonomi ve ödül kuralları\n'+KAY
s+='\n## Para birimleri\n'+tablo(['Kimlik','Ad','Not'],[[k,v['name'],v['note']] for k,v in c['CURRENCY'].items()])
s+='\n## Dükkân (`SHOP`, yakut)\n'+tablo(['Kimlik','Ad','Açıklama','Bedel','Günlük en çok','Verir'],[[x['id'],x['name'],x['desc'],x['cost'],x.get('max'),ozet(x.get('give'))] for x in c['SHOP']])
s+='\n## Meydan dükkânı (`ARENA_SHOP`, şan)\n'+tablo(['Kimlik','Ad','Bedel','Verir'],[[x.get('id'),x.get('name'),x.get('cost'),ozet(x.get('give'))] for x in c['ARENA_SHOP']])
s+='\n## Üyelik (`PREMIUM`)\n'+tablo(['No','Ad','Bedel','Gün','XP','Akçe','Düşüş','Boşta saat','Maden çarpanı'],[[x['id'],x['name'],x['cost'],x['days'],x['xp'],x['akce'],x['drop'],x['idleHours'],x['mine']] for x in c['PREMIUM']])
s+='\n## Mağaza fiyatları (`shared/config/storePrices.js`; ilk sürümde gerçek para YOK, ekran "Yakında")\n'+tablo(['Ürün','Fiyat ('+sp['STORE_CUR']+')'],sp['STORE_PRICES'].items())
s+='\n## Çark (`WHEEL`)\n'+f"Bedel {c['WHEEL']['cost']} yakut.\n"+tablo(['Ağırlık','Ödül'],[[x['w'],x['name']] for x in c['WHEEL']['pool']])
s+='\n## Pazar (`MARKET`)\n'+ozet(c['MARKET'])+'\n\n## Maden (`MINE`)\n'+f"En çok {c['MINE']['max']} seviye, saatte 30×seviye cevher, {c['MINE']['capHours']} saat birikir, yükseltme 500×seviye² akçe. Takas: "+ozet(c['MINE']['trade'])+'\n'
s+='\n## Örs (yükseltme)\n'+f"Başarı oranı +1…+10: {it['UP_CHANCE']}; güvenli seviye +{it['SAFE_PLUS']}, en çok +{it['MAX_PLUS']}. Taşlar: {ozet(it['STONES'])}\n"
s+='\n## Eşya dereceleri\n'+tablo(['Ad','Çarpan','Renk'],[[g['name'],g['mult'],g['color']] for g in it['GRADES']])+'\n## Kademeler\n'+tablo(['No','Gereken seviye','Malzeme','Taş'],[[i,t['req'],t['mat'],t['gem']] for i,t in enumerate(it['TIERS'])])
s+='\n## Düşüş oranları\n'+f"Boss: {ozet(dr['BOSS_RATES'])}. Nadir eşsiz düşüşleri (`RARE`, {len(dr['RARE'])} canavar): "+'; '.join(f"{k} → {', '.join(x['b']+' %'+str(round(x['rate']*100,4)) for x in v)}" for k,v in dr['RARE'].items())+'\n'
s+='\n## Han içecekleri\n'+tablo(['Kimlik','Ad','Bedel','Etki','Süre (dk)','Savaş'],[[k,v['name'],v['cost'],v.get('desc',''),v.get('minutes','anında'),v.get('battles',v.get('perDay','')) ] for k,v in han['DRINKS'].items()])
s+='\n## Ahır yoldaşları\n'+tablo(['Kimlik','Halk','Ad','Seviye şartı','Bedel','Taban'],[[k,v['faction'],v['name'],v['lvReq'],ozet(v['cost']),ozet(v['base'])] for k,v in ahir['COMPANIONS'].items()])
s+='\n## Bakım ve lüks vergisi (`sinks.js`)\n'+ozet(sinks.get('UPKEEP',{}))+'\nLüks vergisi: '+ozet(sinks.get('LUX_TAX',[]))+'\n'
s+='\n## Diğer\n'+f"Enerji: {ozet(c['ENERGY'])}. Çanta: {c['BAG_LIMIT']}. Boss izi takası: {c['BOSS_PITY']}. Klan: {ozet(c['CLAN'])}. Salon: en çok {c['HALL']['max']}. Meydan: {ozet(c['ARENA'])}.\n"
W('EKONOMI_VE_ODULLER.md',s)
# --- MEKANİK
s='# Oyun mekanikleri ve kuralları\n'+KAY
s+='\n## Temel döngü\nSıra tabanlı, belirlenimci (tohumlu `rng.js`) savaş. Oyuncu Kapı’dan bölge/aşama seçer → VS ekranı → savaş (temel saldırı + 5 yetenek + 2 iksir; OTO ve hız 1x–3x) → sonuç (yıldız, ödül). Ana merkez başkent (2B boyalı şehir) + Yemin Pazarı + Klan Obası. Yerel kayıt (localStorage, `DD_LOCAL`); sunucu sonra.\n'
s+=f"\n## Formüller\n- Seviye için XP: `50·sv + 8·sv²` (`xpNeed`).\n- Savaş tur sınırı {c['TURN_CAP']} (Meydan {c['ARENA']['turnCap']}); aşınca kaybedilir.\n- Nitelik/yetenek sıfırlama: `200·sv` akçe.\n- Gün sınırı UTC+3 gece yarısı; hafta pazartesi 00:00.\n"
s+='\n## Durum etkileri (`STATUS`)\n'+tablo(['Kimlik','Ad','İyi?','Açıklama'],[[k,v['name'],'evet' if v.get('good') else 'hayır',v.get('desc','')] for k,v in c['STATUS'].items()])
s+='\n## Elementler\n'+ozet(it['ELEMENTS'])+'\n\n## Yuvalar\n'+tablo(['Yuva','Ad'],[[k,v] for k,v in (it['SLOTS'].items() if isinstance(it['SLOTS'],dict) else enumerate(it['SLOTS']))])
s+='\n## Yetenekler\n'+f"{len(sk['SKILLS'])} yetenek; tam liste `veri_json/yetenekler.json` (kimlik, TR ad, ağaç, puan, mana, etki). Ustalık şartı `MREQ`: {ozet(sk['MREQ'])}.\n"
s+='\n## Modüller\n`veri_json/_moduller.json` her `shared/` dosyasının veri ve fonksiyon adlarını listeler. Kural kodu GPT tarafından DEĞİŞTİRİLMEZ; yeni içerik yalnız bu şemalara uyan veri olarak önerilir (`17_SEMALAR`).\n'
W('MEKANIK_VE_KURALLAR.md',s)
# --- NPC
npcs=[('edran','Kral Edran','Elentha kralı','Elentha başkenti (king)','hikaye-png#edran, gorsel-png#edran(-yuz), p23-npc-png#npc-edran_1/2'),('volgar','Kral Volgar Demirdiş','Kragmir kralı','Kragmir başkenti (king)','hikaye-png#volgar, gorsel-png#volgar(-yuz), p23-npc-png#npc-volgar_1/2'),
 ('halvor','Tüccar Halvor','Silah/zırh tüccarı, öğretici','Yemin Pazarı Elentha (merchant)','gorsel-png#halvor(-yuz), p23-npc-png#npc-halvor_*'),('tuccar-kragmir','Kragmir tüccarı','Tüccar (Kragmir karşılığı)','Yemin Pazarı Kragmir (merchant)','p23-npc-png#npc-tuccar-kragmir_*'),
 ('maelis','İksirci Maelis','İksir/sarf satıcısı','Elentha başkenti (iksir), Pazar (c_sarf)','gorsel-png#maelis(-yuz), p23-npc-png#npc-maelis_*'),('iksirci-kragmir','Kragmir iksircisi','İksir/sarf satıcısı','Kragmir başkenti (iksir), Pazar (c_sarf)','p23-npc-png#npc-iksirci-kragmir_*'),
 ('corin','İzci Corin','Kapı/bölge rehberi (Elentha)','Elentha başkenti (gate), orman','gorsel-png#corin(-yuz), p23-npc-png#npc-corin_*'),('thrak','İzci Thrak','Kapı/bölge rehberi (Kragmir)','Kragmir başkenti (gate), orman','gorsel-png#thrak(-yuz), p23-npc-png#npc-thrak_*'),
 ('lira','Lira','Arşivci; Anıt ve takı tezgâhı','Başkent (monument), Pazar (c_taki)','gorsel-png#lira(-yuz), p23-npc-png#npc-lira_*'),('yashka','Şaman Yashka','Kemik okuyucu (Elentha pazarı)','Yemin Pazarı (yashka)','gorsel-png#yashka(-yuz), p23-npc-png#npc-yashka_*, p26-orman-png#yashka'),
 ('saman-kragmir','Kragmir şamanı','Yashka karşılığı','Yemin Pazarı Kragmir (yashka)','p23-npc-png#npc-saman-kragmir_*'),('hanci','Hancı','Han içecekleri','Han iç mekânı','img/p28/han_hanci.webp'),
 ('bran','Küçük Bran','Öğretici çocuk (kardeşi Nessa)','Öğretici','yedek SVG (boyalı portre YOK)')]
s='# NPC isimleri, görevleri ve mevcut replikleri\n\n'+tablo(['Kimlik','Ad','Görev','Yer (dokunma eylemi)','Görseller'],npcs)
s+='\nYerleşim koordinatları `js/hub2d.js NPC_HAR` (sahne pikseli). Diyalog bileşeni `js/ui-diyalog.js diyalog({kim, ad, unvan, halk, satirlar, son})`.\n\n## Mevcut replikler (koddan, olduğu gibi)\n'
W('NPC_VE_REPLIKLER.md',s)
# eşya/yetenek CSV
es=json.load(open(os.path.join(V,'esya_tabanlari.json')))
with open(os.path.join(OUT,'esya_listesi.csv'),'w',newline='',encoding='utf-8') as f:
    w=csv.writer(f); w.writerow(['kimlik','ad_tr','ad_en','tur','alt_tur','kademe','gereken_sv','siniflar','yuvalar','nitelikler','simge'])
    for e in es: w.writerow([e['kimlik'],e.get('ad_tr') or '',e.get('name',''),e.get('kind',''),e.get('type',''),e.get('tier',''),e.get('req',''),'/'.join(e.get('cls') or []),'/'.join(e.get('slots') or []),json.dumps(e.get('stats',{}),ensure_ascii=False),e.get('icon','')])
ye=json.load(open(os.path.join(V,'yetenekler.json')))
with open(os.path.join(OUT,'yetenek_listesi.csv'),'w',newline='',encoding='utf-8') as f:
    w=csv.writer(f); keys=['kimlik','ad_tr','name','cls','type','target','cd','anim','fx','sc']; w.writerow(keys)
    for e in ye: w.writerow([e.get(k,'') if not isinstance(e.get(k),(dict,list)) else json.dumps(e.get(k),ensure_ascii=False) for k in keys])
print('ok')
