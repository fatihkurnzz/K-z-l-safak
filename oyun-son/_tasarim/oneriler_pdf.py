import sys
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.platypus import (BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, Table,
                                TableStyle, PageBreak, KeepTogether)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

F = '/usr/share/fonts/truetype/dejavu/'
pdfmetrics.registerFont(TTFont('S', F + 'DejaVuSans.ttf'))
pdfmetrics.registerFont(TTFont('SB', F + 'DejaVuSans-Bold.ttf'))
pdfmetrics.registerFont(TTFont('SE', F + 'DejaVuSerif-Bold.ttf'))
pdfmetrics.registerFontFamily('S', normal='S', bold='SB', italic='S', boldItalic='SB')

INK = colors.HexColor('#1A1519'); EMBER = colors.HexColor('#C2471E'); GOLD = colors.HexColor('#B9822F')
ASH = colors.HexColor('#6E6870'); LIGHT = colors.HexColor('#F4F0EA'); BLUE = colors.HexColor('#1C3C9C')
LINE = colors.HexColor('#D8D1C6')

st = {
    'title': ParagraphStyle('t', fontName='SE', fontSize=24, leading=29, textColor=INK),
    'sub': ParagraphStyle('s', fontName='S', fontSize=11, leading=15, textColor=ASH),
    'h1': ParagraphStyle('h1', fontName='SE', fontSize=15, leading=19, textColor=EMBER, spaceBefore=10, spaceAfter=6),
    'h2': ParagraphStyle('h2', fontName='SB', fontSize=11, leading=14.5, textColor=INK, spaceBefore=8, spaceAfter=2),
    'p': ParagraphStyle('p', fontName='S', fontSize=9.5, leading=13.6, textColor=INK, alignment=TA_LEFT),
    'why': ParagraphStyle('w', fontName='S', fontSize=9, leading=12.8, textColor=ASH, leftIndent=8,
                          borderPadding=0),
    'cell': ParagraphStyle('c', fontName='S', fontSize=8.6, leading=11.2, textColor=INK),
    'cellb': ParagraphStyle('cb', fontName='SB', fontSize=8.6, leading=11.2, textColor=colors.white),
    'note': ParagraphStyle('n', fontName='S', fontSize=9, leading=12.8, textColor=INK, backColor=LIGHT,
                           borderPadding=(7, 8, 7, 8), spaceBefore=6, spaceAfter=8),
}

def P(t, s='p'): return Paragraph(t, st[s])

def item(title, body, why):
    return KeepTogether([P(title, 'h2'), P(body), Spacer(1, 2), P('<b>Neden:</b> ' + why, 'why'), Spacer(1, 4)])

def table(rows, widths, head=True):
    data = [[P(c, 'cellb' if (head and i == 0) else 'cell') for c in r] for i, r in enumerate(rows)]
    t = Table(data, colWidths=widths, repeatRows=1 if head else 0)
    style = [('VALIGN', (0, 0), (-1, -1), 'MIDDLE'), ('LINEBELOW', (0, 0), (-1, -1), 0.4, LINE),
             ('TOPPADDING', (0, 0), (-1, -1), 4), ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
             ('LEFTPADDING', (0, 0), (-1, -1), 5), ('RIGHTPADDING', (0, 0), (-1, -1), 5)]
    if head: style += [('BACKGROUND', (0, 0), (-1, 0), INK)]
    for i in range(1 if head else 0, len(rows)):
        if i % 2 == 0: style.append(('BACKGROUND', (0, i), (-1, i), LIGHT))
    t.setStyle(TableStyle(style)); return t

def frame_page(c, d):
    c.saveState()
    w, h = A4
    c.setFillColor(INK); c.rect(0, h - 9 * mm, w, 9 * mm, fill=1, stroke=0)
    c.setFillColor(EMBER); c.rect(0, h - 9.8 * mm, w, 0.8 * mm, fill=1, stroke=0)
    c.setFont('S', 7.5); c.setFillColor(colors.HexColor('#BFB9BE'))
    c.drawString(18 * mm, h - 6 * mm, 'DEMİR DİYARI  ·  ÖNERİLER (2. SÜRÜM)')
    c.setFillColor(ASH); c.setFont('S', 7.5)
    c.drawString(18 * mm, 10 * mm, 'Vahran: Tarihin Külleri · son sürüm (oyun-son/) incelemesine dayanır')
    c.drawRightString(w - 18 * mm, 10 * mm, f'Sayfa {d.page}')
    c.restoreState()

out = sys.argv[1]
doc = BaseDocTemplate(out, pagesize=A4, leftMargin=18 * mm, rightMargin=18 * mm, topMargin=18 * mm,
                      bottomMargin=18 * mm, title='Demir Diyarı · Öneriler (2. sürüm)', author='Claude')
fr = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id='f')
doc.addPageTemplates([PageTemplate(id='p', frames=[fr], onPage=frame_page)])
W = doc.width
S = []

S += [P('Demir Diyarı · Öneriler', 'title'), Spacer(1, 3),
      P('2. sürüm · Oyunun son hâli, Vahran destanı ve yeni görsel yön üzerine', 'sub'), Spacer(1, 8),
      P('Bu belge, oyunun son hâlinin (293 dosya) kodu, oyuna kısmen işlenmiş <i>Vahran: Tarihin Külleri</i> destanı '
        've diğer yapay zekâya gönderilen konsept ile yerleşim belgeleri üzerine kuruldu. İlk öneri belgesindeki '
        'maddeler (sunucu, mağaza ve yasal hazırlık, pazar fiyat aralığı, Kader Çarkı garantisi) hâlâ geçerli. '
        'Burada onları tekrarlamıyorum, yalnızca yenileri ve önceliği değişenleri yazıyorum.'),
      Spacer(1, 8), P('Öncelik tablosu', 'h1')]

rows = [['Öneri', 'Öncelik', 'Emek', 'Bölüm'],
        ['Kaydı dışa/içe aktarma (sunucu gelene kadar)', 'Yüksek', 'Küçük', '1'],
        ['Xbot modelini CDN yerine pakete göm', 'Yüksek', 'Küçük', '1'],
        ['31 stil dosyasını tek tema sistemine indir', 'Yüksek', 'Büyük', '2'],
        ['Yeni tasarımı önce pilot ekranlarla dene', 'Yüksek', 'Orta', '2'],
        ['Destanın 8 bölümünü oynanabilir bölümlere çevir', 'Yüksek', 'Büyük', '3'],
        ['Mini dizi: video yerine sahne içi hareketli çizgi roman', 'Orta', 'Orta', '3'],
        ['İki halk için iki bakış açısı (aynı olay, farklı anlatı)', 'Orta', 'Orta', '3'],
        ['Kin Ölçeği ve Tarikat istilası (dünya olayı)', 'Orta', 'Orta', '4'],
        ['Ortak düşmana karşı iki halkın birlikte baskını', 'Orta', 'Büyük', '4'],
        ['Kül Kulesi: 65. seviye sonrası sonsuz kat', 'Orta', 'Orta', '4'],
        ['Süpürme, 2x/3x hız ve tek dokunuşla tekrar', 'Orta', 'Küçük', '4'],
        ['Kül Sezonu: hikâyeye bağlı sezon karnesi ve kaplamalar', 'Orta', 'Orta', '5'],
        ['Paylaşım/biçim denetim listesi (AVIF, SVG, .glb)', 'Yüksek', 'Küçük', '1']]
S += [table(rows, [W * 0.58, W * 0.14, W * 0.14, W * 0.14])]

# 1
S += [P('1. Teknik: Hemen yapılacaklar', 'h1'),
      item('Kaydı dışa ve içe aktarma',
           'Oyun yerel kipte çalışıyor (<font name="SB">DD_LOCAL = true</font>): bütün ilerleme tarayıcının localStorage\'ında. '
           'Ayarlar\'a "Kaydı dışa aktar" (bir kod ya da dosya) ve "Kaydı içe aktar" düğmeleri eklenebilir. Sunucu gelene kadar en ucuz güvence bu.',
           'Tarayıcı verisi silinince, cihaz değişince ya da yapıt yeni bir adrese taşınınca oyuncunun bütün emeği gider. Yapıt sayfaları her ziyaretçinin '
           'kendi tarayıcısında ayrı saklanır; bağlantıyı başkasıyla paylaşınca kayıt da taşınmaz.'),
      item('Xbot modelini pakete göm',
           '<font name="SB">js/skinned.js</font> hâlâ <font name="SB">cdn.jsdelivr.net</font> adresinden Xbot.glb indiriyor. Bu dosya diğer '
           'modeller gibi <font name="SB">.glb.js</font> biçimine çevrilip oyunun içine konmalı.',
           'Yapıt ortamı dış adresleri engelleyebilir; engellenirse karakter görünmez ya da yükleme takılır. APK yapılırken de dış bağımlılık sorun çıkarır.'),
      item('Paylaşım ve biçim denetim listesi',
           'Her yayından önce otomatik çalışan küçük bir betik: AVIF, BMP, TGA, TIFF, SVG ve gömülü <font name="SB">data:image/avif</font> '
           'dizgelerini arasın, <font name="SB">.glb</font> ve uzantısız dosyaları bulsun, 255 dosya sınırını saysın.',
           'Herkese açık paylaşım daha önce tam olarak GLTFLoader içindeki gömülü bir AVIF yüzünden takıldı. Yeni tasarım paketi yüzlerce '
           'görsel getirecek; tek bir yanlış biçim yine paylaşımı durdurur.'),
      item('İlk açılış ağırlığı',
           'Son sürüm yaklaşık 13 MB. <font name="SB">index.html</font> tek başına 309 KB ve içinde 19 ayrı stil bloğu var. '
           'İngilizce dil dosyaları (yaklaşık 390 KB) yalnızca İngilizce seçilince, yetenek simgeleri (262 KB) ilk ihtiyaçta yüklenebilir.',
           'Mobil veride her megabayt, ilk açılışta oyuncu kaybı demek.')]

# 2
S += [P('2. Yeni görsel tasarımı oyuna nasıl alalım', 'h1'),
      item('Önce temizlik, sonra yeni kat',
           'Oyun şu an 31 stil dosyası (v8\'den v16\'ya) yüklüyor ve bunlarda 90 <font name="SB">!important</font> var: her sürüm bir öncekinin '
           'üstüne yamanmış. Yeni tasarım bunların üstüne bir kat daha eklenirse çakışmalar çıkar. Öneri: yeni '
           '<font name="SB">tokens.css</font> + bileşen dosyaları gelince eski katmanlar ekran ekran kaldırılsın.',
           'Yerleşim belgesindeki "her şey aynı yerde, aynı ölçüde" ahengi ancak tek bir ölçü kaynağıyla sağlanır.'),
      item('Pilot: üç ekran',
           'Diğer yapay zekâdan önce yalnızca sanat panosu + Ana Merkez + Savaş HUD\'u + Karakter oluşturma istensin. Bu üçü oyuna takılıp '
           'telefonda denensin; ölçüler ve tema onaylanınca geri kalan ekranlar aynı kalıpla gelsin.',
           'Yanlış bir ölçü ya da renk kararı 30 ekranda değil 3 ekranda düzeltilir. Ayrıca gelen işin bu oyunun kodu ve sınırlarıyla '
           'gerçekten çalıştığı erkenden görülür.'),
      item('Tema halka bağlı',
           'Arayüz <font name="SB">html[data-faction]</font> ile Kragmir ya da Elentha temasına geçer. Oyuncunun halkı zaten kayıtta var '
           '(<font name="SB">p.faction</font>); tek satırlık bir bağlantı yeter.',
           'Aynı yerleşim, iki malzeme: oyuncu kendi halkının dünyasında olduğunu her ekranda hisseder.')]

# 3
S += [P('3. Hikâye: Destanı oynanabilir kılmak', 'h1'),
      P('Destan oyuna kısmen işlenmiş: bölge ve boss adları (Vahran Ovası, Kül Geçidi, Kızıl Bahar Meydanı, Sisli Çukur, Mareşal Marven, '
        'Adsız) ve Taş Yemini, Thrak, Yashka, Tarikat adları kodda geçiyor. Ana görev ağacında 16 bölüm var (7–16 hikâye bölümleri). '
        'Ama destanın sekiz bölümü henüz oyuncunun <i>yaşadığı</i> anlara dönüşmüş değil. Öneri, her bölüme bir oynanış biçimi vermek:'),
      Spacer(1, 4)]
rows = [['Destan bölümü', 'Oynanış önerisi'],
        ['I. İki Taht', 'Öğretici: halk seçimine göre Volgar ya da Edran\'ın sarayında başlanır; iki tahtın aynı ovaya baktığı ara sahne.'],
        ['II. Kırılan Yemin', 'Geçmişe dönüş savaşı: oyuncu Dorrak ya da Seraine olarak Kızıl Ay gecesini oynar; sonda taş çatlar.'],
        ['III. Demirdiş', 'Genç Volgar\'ın ilk savaşı: Ugrath düşer, Yerkıran el değiştirir (ork tarafı için duygusal çapa).'],
        ['IV. Sözün Bedeli', 'Arşiv bulmacası: Lira ile çift tabanlı sandık, yarı yanmış tutanak (insan tarafı için).'],
        ['V. Üçüncü El', 'İz sürme bölümü: Lira ve Thrak birlikte; gizlilik ve el işaretleri; ateşsiz kazan sahnesi.'],
        ['VI. Kızıl Bahar', 'Büyük meydan savaşı: dalga dalga; ortada iki kralın göz göze geldiği an.'],
        ['VII. Taşın Sırrı', 'Rün okuma: taşın iki yüzü iki dilde; Marven\'in ihaneti duyulur (zorlu boss: Marven).'],
        ['VIII. Tarihin Külleri', 'Son boss Adsız; iki kral yan yana. Açık son: taşın dibinde yeni bir rün, 2. sezonun kancası.']]
S += [table(rows, [W * 0.24, W * 0.76])]
S += [Spacer(1, 6),
      item('İki halk, iki bakış',
           'Aynı bölüm halka göre farklı anlatılır: ork oyuncu Kızıl Ay\'ı zehirlenen kuyudan, insan oyuncu öldürülen elçiden görür. '
           'Bölüm sonunda öteki tarafın sahnesi "kilitli anı" olarak açılır.',
           'Destanın özü "iki taraf da yanlış düşmana kin güttü". Bunu oyuncuya söylemek yerine yaşatmak, ikinci karakter açmaya da sebep olur.'),
      item('Mini dizi: video yerine hareketli çizgi roman',
           '<font name="SB">video/</font> klasöründe 10 bölüm videosu bekleniyor ama yok. Bunları video yerine oyun motorunda, konsept '
           'çizimleri + kamera hareketi + altyazı + kül efektiyle anlatılan sahneler olarak yapmak öneriliyor.',
           '10 video kolayca 100 MB\'ı aşar ve yapıt sınırlarını zorlar. Hareketli çizgi roman birkaç yüz KB tutar, yeni tasarım görselleriyle aynı dili konuşur ve dile çevrilebilir.'),
      item('Kül, oynanışta da görünsün',
           'Tarikat düşmanı sahneye girince ortamın renk doygunluğu düşsün; açılmamış bölgeler haritada küllü dursun, açıldıkça renk geri gelsin.',
           'Konsept brifindeki "kül = üçüncü el" fikrini yalnızca boyada değil, ilerleme hissinde de kullanır.')]

# 4
S += [P('4. Oyun tasarımı: Temaya bağlı yeni sistemler', 'h1'),
      item('Kin Ölçeği ve Tarikat istilası',
           'İki halk arasındaki PvP ve Hisar savaşları ortak bir "Kin Ölçeği"ni doldursun. Ölçek dolunca bütün sunucuda Tarikat istilası başlasın: '
           'Vahran\'da kül yağar, gri cübbeliler iki halkın şehirlerine de saldırır.',
           'Destandaki "savaş Tarikat\'ın sofrası" fikri doğrudan mekaniğe dönüşür. PvP\'ye anlam, PvE\'ye düzenli bir olay takvimi verir.'),
      item('Ortak baskın: "Taş Yemini"',
           'Haftada bir, iki halktan oyuncuların aynı grupta girdiği tek baskın. Girişte iki oyuncu taşa el basar (kısa tören). Ödülü iki halkın '
           'parçalarını birleştiren özel bir kaplama.',
           'Hikâyenin doruk noktası (iki kral yan yana) oyuncu deneyimine dönüşür; topluluğu ikiye bölen değil, birleştiren bir an olur.'),
      item('Kül Kulesi',
           'Bölgeler 65. seviyede bitiyor (Sisli Çukur, 60–65). Sonrası için sonsuz katlı, her 10 katta Tarikat\'ın bir "adsız"ının beklediği, haftalık '
           'sıralamalı bir kule.',
           'Seviye tavanındaki oyuncunun "sırada ne var" sorusuna uzun vadeli cevap verir; ilk belgedeki 60+ hedef önerisinin temaya oturmuş hâli.'),
      item('Gri Cübbe: Klanlarda gizli hain olayı',
           'Klan etkinliğinde üyelerden biri gizlice "Tarikat ajanı" olur; sınırlı sürede ipuçlarıyla bulunur (yalnızca oyun içi eğlence, ödül kaybı yok).',
           'Destanda Tarikat iki ordunun içinden çıkıyordu. Bu, klan sohbetini canlandıran ucuz bir sosyal olay.'),
      item('Konfor: süpürme, hız, tekrar',
           'Üç yıldızla geçilen aşama tek dokunuşla "süpürülebilsin"; savaşta 2x/3x hız ve otomatik kalıcı olsun; sonuç ekranında "Tekrar" sağ altta.',
           'Sıra tabanlı mobil RPG\'de oyuncu zamanının çoğu tekrar savaşlarına gider; bu üçü günlük oturumu kısaltır, bırakma oranını düşürür.'),
      item('Element zayıflığı gözle görülsün',
           'VS ekranında düşmanın zayıf ve dirençli olduğu elementler simgeyle; savaşta zayıf noktaya vuruşta ayrı renkli "ZAYIF!" sayısı.',
           'Savaş motorunda element zayıflığı ve direnç zaten var; görünmeyen kural oyuncu için yok sayılır.')]

# 5
S += [P('5. Gelir ve canlı yönetim', 'h1'),
      item('Kül Sezonu',
           'Her sezon destanın bir parçasına bağlı: ücretsiz ve ücretli iki ödül yolu, sezonun sonunda hikâyeden bir kaplama (örn. "Yerkıran\'ın '
           'Gölgesi" çekiç görünümü, "Lira\'nın İzci Pelerini").',
           'Kozmetik ödüller güç dengesini bozmaz; hikâyeye bağlanınca satın alma "karakterimi destanın bir parçası yapmak" olur.'),
      item('Halka özel kaplama çizgisi',
           'Yeni arayüz kitiyle uyumlu, her halk için ayrı kaplama setleri (Kragmir: dövme demir ve kor, Elentha: mermer ve mine).',
           'Görsel yeniden tasarımın emeği mağazada da karşılık bulur.'),
      item('Ödüllü reklam yalnızca isteğe bağlı',
           'Kodda reklam modülü var. Reklam yalnızca oyuncu isteyince ve açık bir ödül karşılığında gösterilsin, savaşın ortasında asla çıkmasın.',
           'Premium görünümlü bir oyunun hissini en hızlı bozan şey zorunlu reklamdır.')]

# 6
S += [P('6. Önerilen yol haritası', 'h1')]
rows = [['Aşama', 'İçerik', 'Çıktı'],
        ['A · Temel', 'Kayıt dışa/içe aktarma, Xbot gömme, biçim denetim betiği', 'Güvenli ve paylaşılabilir sürüm'],
        ['B · Tasarım pilotu', 'Sanat panosu + 3 ekran; tema değişkenleri; telefonda deneme', 'Onaylanmış görsel dil'],
        ['C · Tasarım yayılımı', 'Kalan ekranlar; eski 31 stil katmanının temizlenmesi', 'Yeni görünümlü bütün oyun'],
        ['D · Hikâye', '8 destan bölümü, iki bakış açısı, hareketli çizgi roman', '1. sezon: Vahran'],
        ['E · Canlı oyun', 'Kin Ölçeği, ortak baskın, Kül Kulesi, Kül Sezonu', 'Uzun vadeli oyuncu tutma'],
        ['F · Yayın', 'Sunucu, mağaza, yasal adımlar (ilk belgedeki liste)', 'Play Store sürümü']]
S += [table(rows, [W * 0.2, W * 0.5, W * 0.3])]

S += [Spacer(1, 10), P('Size sorular', 'h1'),
      P('Bu cevaplar önerilerin sırasını değiştirebilir:'), Spacer(1, 3),
      P('1. Asıl hedef Play Store\'da yayınlanan bir uygulama mı, yoksa şimdilik bağlantıyla paylaşılan tarayıcı oyunu mu?'),
      P('2. Gerçek oyuncular arası (sunuculu) oyun ne zaman isteniyor? Yerel kip ne kadar süre ana sürüm kalacak?'),
      P('3. Gerçek parayla satış planlanıyor mu? Planlanıyorsa kozmetik ağırlıklı mı, güç satışı da olacak mı?'),
      P('4. Destanın 2. sezonu (yeni rün) yazılacak mı? Yazılacaksa 1. sezonun sonu ona göre bağlanmalı.'),
      Spacer(1, 6),
      P('Bir maddeyi seçerseniz onu adım adım bir plana çevirip uygulamaya başlayabilirim.', 'note')]

doc.build(S)
print('ok')
