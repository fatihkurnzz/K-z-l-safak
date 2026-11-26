// Yalnız EN dili bloğu (sistem_test.js 4. adım). node en_test.js <çıktı>
const src = require('fs').readFileSync(__dirname + '/sistem_test.js', 'utf8');
const blok = src.slice(src.indexOf('  // 4) EN dili'), src.indexOf('  // 5) SYS-RESET'));
const kod = src.slice(0, src.indexOf('  // 1) Yenileme')) + blok + src.slice(src.indexOf("  fs.writeFileSync(out + '/sonuc.json'")).replace("'/sonuc.json'", "'/en.json'");
require('fs').writeFileSync(__dirname + '/.en_tmp.js', kod); require(__dirname + '/.en_tmp.js');
