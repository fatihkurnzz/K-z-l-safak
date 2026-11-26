# F-026 · GitHub kaynak ve sürüm bütünlüğü (26.11.2026)

Durum: **KISMEN ÇÖZÜLDÜ.**

## Yapılan (gerçek komut çıktısıyla)
- `git ls-remote origin` okuma erişimi var. Uzak `main` = `4deffc8` (yerel geçmişin atası DEĞİL; ayrı başlangıç commit'i). Ana dala dokunulmadı.
- Geliştirme dalı `claude/add-skill-repos-rne7at` **push edildi** (önceki oturumlardaki 403 bu oturumda yok). Uzak dal ucu `7883c1e`.
- Bu dal V42 yayın commit'lerini içerir: `b9a0b21` (Sürüm 42 yayında) ve `d5320b5` (P34 entegrasyonu). Yerelde `git cat-file -t` ikisi için `commit`. Uzak depoda bu commit'ler artık dalın geçmişinde.
- `v42` açıklamalı etiketi yerelde `b9a0b21` üzerine kondu.

## Açık kalan
- **`v42` etiketi uzak depoya gönderilemedi.** `git push origin refs/tags/v42` üç denemede "the remote end hung up unexpectedly" ile kesildi. Bu oturumun git vekili yalnız atanmış dala yazmaya izin veriyor gibi görünüyor (dal push'u aynı anda başarılı). Çözüm: kullanıcı GitHub arayüzünden `b9a0b21` için `v42` etiketi/sürümü oluşturur ya da yetkili bir ortamdan `git push origin v42` çalıştırılır.
- Fable kabul ölçütü (`git cat-file -t b9a0b21` uzak depoda başarılı; etiket `v42`): commit kısmı karşılandı, etiket kısmı karşılanmadı.
- Ana dal ile geliştirme dalı ortak geçmiş paylaşmıyor; birleştirme kararı kullanıcınındır (PR açılmadı).
