# F-025 — Pazar ve klan senaryosu (yerel simülasyon)

Çalıştırma: `cd <bu klasör> && GAME_DIR=<oyun-son yolu> node senaryo25.mjs` (Node 22). Oyun dosyalarına yazmaz; `shared/` kural katmanını bellek içi `MemoryStore` ile çalıştırır.
**Bu gerçek çok oyunculu sunucu değildir**; eşzamanlı istekler (yarış) sınanmadı, sıralı istekler sınandı.

Sonuç (tohum 25): 26 geçti, 0 bulgu, 9 bilgi.
- Pazar: takas edilebilir eşya (`!it.nt`) ile ilan → satın alma → ödeme postası. Alıcı akçesi tam fiyat kadar düştü (−19408), eşya 1 arttı. Satıcı postadan 18438 aldı (= fiyat − %5 vergi; vergi 970). Aynı ilan ikinci kez alınamadı, satılmış ilan iptal edilemedi, postayı ikinci kez almak reddedildi, ödeme sonrası ilan yuvası boşaldı, kendi ilanını alma reddedildi.
- İlan → iptal (alıcıdaki ikinci eşya ile): eşya geri döndü, ilan ücreti iade EDİLMEDİ (tasarım gereği), ikinci iptal ve iptal edilmiş ilanı alma reddedildi, yuva boşaldı.
- Klan: kur, açık klana katıl, üye yetkisiz işlemler (atma, devir, rütbe, ayar, sancak, davet) `no-perm`. Bağış: geçersiz tutarlar `bad-amount`; geçerli adım (1000) kabul, akçe tam düştü; 20000 bağış hazineyi tam 20000 artırdı ve günlük sınır (`daily-limit`) 40000'de devreye girdi.
- Bilgi: ayrıldıktan sonra klana hemen yeniden katılmak mümkün (bekleme yok; tasarım kararı olabilir).
- Sınanmadı: eşzamanlı (yarış) istekler, gerçek sunucu, bot alıcılar (`bots:false`).
