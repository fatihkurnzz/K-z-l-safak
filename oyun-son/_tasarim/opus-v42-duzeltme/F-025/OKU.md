# F-025 — Pazar ve klan senaryosu (yerel simülasyon)

Çalıştırma: `cd <bu klasör> && GAME_DIR=<oyun-son yolu> node senaryo25.mjs` (Node 22). Oyun dosyalarına yazmaz; `shared/` kural katmanını bellek içi `MemoryStore` ile çalıştırır.
**Bu gerçek çok oyunculu sunucu değildir**; eşzamanlı istekler (yarış) sınanmadı, sıralı istekler sınandı.

Sonuç (tohum 25): 19 geçti, 0 bulgu, 9 bilgi.
- Pazar: takas edilebilir eşya (`!it.nt`) ile ilan → satın alma → ödeme postası. Alıcı akçesi tam fiyat kadar düştü (−19408), eşya 1 arttı. Satıcı postadan 18438 aldı (= fiyat − %5 vergi; vergi 970). Aynı ilan ikinci kez alınamadı, satılmış ilan iptal edilemedi, postayı ikinci kez almak reddedildi, ödeme sonrası ilan yuvası boşaldı. Kendi ilanını alma reddedildi.
- Klan: kur, açık klana katıl, üye yetkisiz işlemleri (atma, devir, rütbe, ayar, sancak, davet) `no-perm` ile reddedildi. Bağış: 0/−50/1,5/1e12/100 `bad-amount`; geçerli adım (1000) kabul, akçe tam 1000 düştü.
- Bilgi/açık: ayrıldıktan sonra klana hemen yeniden katılmak mümkün (bekleme yok; tasarım kararı olabilir). İlan → iptal dalı çalışmadı: satıcıda ikinci takas edilebilir serbest eşya bulunamadı (senaryo bunu atladı). Bağış hazine toplamı ve günlük bağış sınırı (`daily-limit`) doğrulanmadı.
