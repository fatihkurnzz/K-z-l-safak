// Duyuru panosu ve Sorun / Teknik Destek: istemciyle ortak sabitler (kurallar destekops.js'te, o istemciye sunulmaz).
export const NEWS = { title: 80, body: 2000, keep: 30 };                // duyuru başlığı / metni uzunluğu · oyuncuya gösterilen son duyuru sayısı
export const SUPPORT = {
  subject: 60, text: 1000, maxOpen: 5, perDay: 8, gapMs: 10000, msgs: 40, // başlık / mesaj uzunluğu · açık talep sınırı · günlük yeni talep · mesaj aralığı · talep başına mesaj
  cats: { bug: 'Hata', account: 'Hesap', pay: 'Ödeme', other: 'Diğer' },
  status: { open: 'Açık', answered: 'Yanıtlandı', closed: 'Kapandı' },
};
