// Sohbet süzgecinin sözcük listesi (veri). Kurallar chatfilter.js'tedir; buraya yalnızca sözcük eklenir/çıkarılır.
// Yazım:  'sözcük'   yalnızca bu sözcük (ek almış hâli sayılmaz)
//         'kök*'     bu kökle başlayan her sözcük
//         '*kök*'    içinde bu kök geçen her sözcük
//         sondaki ~  Türkçe harfleri düz yazılmış hâli de sayılır (ş→s, ç→c, ğ→g, ı→i, ö→o, ü→u)
// Yanlış yakalamayı azaltmak için kısa ve başka sözcüklerin içinde geçen kökler ('göt' → götür, 'sik' → sikke,
// 'sık' → sık sık) yalnızca tam sözcük olarak yazılır ve ~ almaz. Hafif sataşmalar (salak, aptal…) listede yoktur.
export const BAD_WORDS = {
  tr: [
    'amk', 'amq', 'awk', 'aq', 'mk', 'oç', 'amına*~', 'amcık*~', 'amcığ*~',
    'sik', 'sike', 'siki', 'sikim', 'sikin', 'sikik*', 'siker*', 'sikey*', 'sikiş*~', 'sikil*', 'sikme*', 'sikt*', 'sktr*', 'sikko*',
    'yarrak*', 'yarak*', 'yarrağ*~', 'yarağ*~', 'dalyarak*', 'taşak*~', 'taşşak*~',
    '*orospu*', '*oruspu*', '*orosbu*', 'orspu*', 'piç*', 'pezevenk*', 'puşt*~', 'kahpe*', 'kaltak*', 'gavat*', 'ibne*', 'yavşak*~', 'şerefsiz*~',
    'göt', 'götün', 'götüne', 'götünü', 'götveren*~', 'götlek*~', 'götoş*~', 'ananıs*~', 'ananızıs*~', 'bacınıs*~',
  ],
  en: [
    '*fuck*', '*shit*', 'bitch*', 'asshole*', 'cunt*', 'dick', 'dickhead*', 'pussy', 'pussies', 'whore*', 'slut*', 'bastard*', 'faggot*', 'nigger*', 'nigga*', 'retard*', 'wanker*', 'cock', 'cocksucker*',
  ],
};
