// Şikâyet nedenleri (anahtar → oyuncuya gösterilen ad). İstemciye de sunulur: şikâyet penceresi buradan okur,
// sunucu (social.js) aynı tabloyla doğrular. Eşikler ve sözcük listesi istemciye sunulmaz (social.js, badwords.js).
export const REPORT_REASONS = { kufur: 'Küfür ya da hakaret', spam: 'Spam ya da reklam', taciz: 'Taciz ya da tehdit', dolandirma: 'Dolandırıcılık', isim: 'Uygunsuz isim', diger: 'Diğer' };
export const REPORT_NOTE_MAX = 120; // açıklama uzunluğu
