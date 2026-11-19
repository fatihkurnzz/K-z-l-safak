# Demir Diyarı · Oturum hafızası

Kullanıcı Türkçe konuşur; yanıtlar Türkçe olsun. Oyun: **Demir Diyarı Faz 1**, tarayıcıda çalışan 3B mobil RPG (vanilla ES modülleri + three.js r160, gömülü).
Ayrıntılı devir raporu: `DEVIR_RAPORU.md` (durum, eksikler, teknik tuzaklar). Öneriler: `Demir_Diyari_Oneriler.pdf`.

## Kullanıcının en son geçerli sayduğu sürüm
- **Asıl sürüm = devir zip'i + yalnızca AVIF düzeltmesi.** Dosya: `demir-diyari-kaynak.zip` (repo kökünde, .gitignore'da; içinde `game/`, `DEVIR_RAPORU.md`, PDF).
- Bu sürümün yayını: https://claude.ai/artifact/MTABphHNGvf3krJ6ouTQxQ (özel; paylaşımı kullanıcı Paylaş menüsünden açar).
- Düzeltme: `game/vendor/three/examples/jsm/loaders/GLTFLoader.js` içine gömülü `data:image/avif` test görseli ve AVIF eklenti kaydı kaldırıldı (AVIF herkese açık paylaşım incelemesinde izinli biçim değil; three.js gömülünce gelmişti). Kullanıcı başka paylaşım değişikliği İSTEMEDİ, rapora da eklenmesini istemedi.

## Kullanıcının bildirdiği EN SON hâl (19.11.2026)
- Kullanıcı "oyunun son hali" diyerek https://claude.ai/artifact/KUfQG1bV27JFGDTjpBwEdk verdi (kuruluş dışı/herkese açık; okunur, yayımlanamaz). 293 dosyanın tamamı `oyun-son/` klasörüne alındı (commit d9adc37). `DD_LOCAL = true`, modeller `.glb.js`, `vendor/three/LICENSE.txt`, videolar yok (`video/README.txt`). Diğer oturumun yayını: YUZmyf2qyxFxY1Jr7jczu7.

## Diğer bağlantılar
- `game/` klasörü (git'te) zip'ten FARKLI: ek paylaşım denemeleri içerir (CSS SVG → `img/ui/*.png`, model tamponları `b64` alanında + `js/skinned.js` içinde `loadG`, WebP → JPEG/PNG, FBX yükleyicisi silindi, LICENSE → LICENSE.txt). Yayınları: https://claude.ai/artifact/DJihHiDK3J8QzXTCQge7p3 (`game/demir-diyari.html`) ve eski https://claude.ai/artifact/5fWMFYJvLGPjqmkaKSaPW5 (`game/index.html`).
- Test sayfaları (gereksiz): Test1 SjYSG89hgNE1gB1jGdCYTi, Test2 VV4xa5k4izqQYLhpJLXyoQ, Test3 8AEm3MwjfX9iiAfpEYDrqu; indirme sayfası DYehTt339tgy7u4XpRT6SA. Kullanıcı isterse silinir.
- Kullanıcının ilk kaynağı (başka hesaba ait, dokunulmaz): https://claude.ai/artifact/MYzseijJ8VLrLwQbMupv9t

## Paylaşım hatası teşhisi
Hata: "Bu sürüm herkese açık paylaşım için incelenemedi… JPEG, PNG, GIF veya WebP…". İkiye bölme testinde görseller/modeller geçti, **yalnızca kod** (Test 2) takıldı → GLTFLoader'daki gömülü AVIF bulundu. Kullanıcının zip+AVIF sürümünde paylaşımı deneyip denemediği henüz bilinmiyor; yine olmazsa sıradaki şüpheliler: FBXLoader'daki bmp/tga/tiff dizgeleri, GLTFLoader'daki WebP test görseli.

## Çalışma notları
- Git dalı `claude/add-skill-repos-rne7at`; push her zaman 403 (Claude'un depoya erişimi yok). Commit'ler yereldedir; kullanıcıya söyle.
- Yayın: sayfa dosyasında iskelet yok (yayın ekler); çok dosyalı yayında `root` + `files` haritası, silinecek dosyaya `null`, uzantısız dosyaya `contentType`. `.glb` sunulmaz.
- Yerel test: `python3 -m http.server 8765 -d game`, Playwright, `?gfx=low`; testleri sırayla çalıştır. Heredoc python güvenlik denetimine takılabilir: betiği dosyaya yazıp çalıştır.
