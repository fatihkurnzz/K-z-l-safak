// 3B Savaş Faz 1 · model bütçe denetleyicisi (tarayıcısız, bağımlılıksız).
// Kullanım:  node butce.mjs <model.glb | model.gltf | model.json> [--tur kahraman|yaratik|boss|silah] [--json]
// glTF/GLB dosyasını okur; üçgen, köşe, kemik (deri eklemi), köşe başına etki, doku sayısı/boyutu, animasyon klipleri,
// dosya boyutu ölçer ve STANDART.md bütçeleriyle karşılaştırır. Çıkış kodu: 0 = bütçe içinde, 1 = aşım, 2 = okunamadı.
import fs from 'node:fs';
import path from 'node:path';

const BUTCE = { // STANDART.md §5
  kahraman: { ucgen: 15000, kemik: 70, doku: 1024, dosyaMB: 1.5, etki: 4 },
  yaratik: { ucgen: 8000, kemik: 70, doku: 1024, dosyaMB: 0.8, etki: 4 },
  boss: { ucgen: 25000, kemik: 80, doku: 2048, dosyaMB: 2.5, etki: 4 },
  silah: { ucgen: 1500, kemik: 0, doku: 512, dosyaMB: 0.3, etki: 0 },
};
const arg = process.argv.slice(2), dosya = arg.find(a => !a.startsWith('--'));
const tur = arg.includes('--tur') ? arg[arg.indexOf('--tur') + 1] : 'kahraman', jsonCik = arg.includes('--json');
if (!dosya || !BUTCE[tur]) { console.error('kullanım: node butce.mjs <dosya> [--tur kahraman|yaratik|boss|silah] [--json]'); process.exit(2); }

function oku(f) {
  const ham = fs.readFileSync(f);
  if (ham.readUInt32LE(0) === 0x46546c67) { // 'glTF' ikili
    let o = 12, json = null, bin = null;
    while (o < ham.length) { const n = ham.readUInt32LE(o), t = ham.readUInt32LE(o + 4), d = ham.subarray(o + 8, o + 8 + n); if (t === 0x4e4f534a) json = JSON.parse(d.toString('utf8')); else if (t === 0x004e4942) bin = d; o += 8 + n; }
    return { json, bin, boyut: ham.length };
  }
  const json = JSON.parse(ham.toString('utf8'));
  let boyut = ham.length; // dış dosyalar (doku, .bin) da sayılır
  for (const x of [...(json.images || []), ...(json.buffers || [])]) if (x.uri && !x.uri.startsWith('data:')) { try { boyut += fs.statSync(path.join(path.dirname(f), x.uri)).size; } catch { } }
  return { json, bin: null, boyut };
}
// Görsel boyutu: PNG / JPEG / WebP başlığından
function gorselBoyut(b) {
  if (!b || b.length < 30) return null;
  if (b[0] === 0x89 && b[1] === 0x50) return [b.readUInt32BE(16), b.readUInt32BE(20)];
  if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
    const k = b.toString('ascii', 12, 16);
    if (k === 'VP8X') return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
    if (k === 'VP8 ') return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
    if (k === 'VP8L') { const v = b.readUInt32LE(21); return [1 + (v & 0x3fff), 1 + ((v >> 14) & 0x3fff)]; }
  }
  if (b[0] === 0xff && b[1] === 0xd8) { let o = 2; while (o < b.length) { if (b[o] !== 0xff) break; const m = b[o + 1], n = b.readUInt16BE(o + 2); if (m >= 0xc0 && m <= 0xc3) return [b.readUInt16BE(o + 7), b.readUInt16BE(o + 5)]; o += 2 + n; } }
  return null;
}
const { json: G, bin, boyut } = oku(dosya);
const acc = G.accessors || [];
let ucgen = 0, kose = 0, etkiMax = 0;
for (const m of G.meshes || []) for (const p of m.primitives || []) {
  const mod = p.mode ?? 4; if (mod !== 4) continue;
  const n = p.indices != null ? acc[p.indices].count : acc[p.attributes.POSITION].count;
  ucgen += n / 3; kose += acc[p.attributes.POSITION].count;
  etkiMax = Math.max(etkiMax, p.attributes.JOINTS_1 != null ? 8 : p.attributes.JOINTS_0 != null ? 4 : 0);
}
const kemik = Math.max(0, ...(G.skins || []).map(s => s.joints.length));
const dokular = [];
for (const im of G.images || []) {
  let b = null;
  if (im.uri?.startsWith('data:')) b = Buffer.from(im.uri.split(',')[1], 'base64');
  else if (im.uri) { try { b = fs.readFileSync(path.join(path.dirname(dosya), im.uri)); } catch { } }
  else if (im.bufferView != null && bin) { const v = G.bufferViews[im.bufferView]; b = bin.subarray(v.byteOffset || 0, (v.byteOffset || 0) + v.byteLength); }
  dokular.push({ ad: im.name || im.uri || `#${dokular.length}`, tur: im.mimeType || path.extname(im.uri || '').slice(1), boyut: gorselBoyut(b) });
}
const kemikAdlari = (G.skins?.[0]?.joints || []).map(j => G.nodes[j]?.name || '');
const B = BUTCE[tur], dokuMax = Math.max(0, ...dokular.map(d => Math.max(...(d.boyut || [0]))));
const R = {
  dosya: path.basename(dosya), tur, ucgen: Math.round(ucgen), kose, kemik, etki: etkiMax, doku: dokular, dokuMax, dosyaMB: +(boyut / 1048576).toFixed(2),
  klipler: (G.animations || []).map(a => a.name), mixamorig: kemikAdlari.length ? kemikAdlari.filter(n => /^mixamorig:?/.test(n)).length + '/' + kemikAdlari.length : '-',
  eldeKemik: { sag: kemikAdlari.some(n => /RightHand$/.test(n)), sol: kemikAdlari.some(n => /LeftHand$/.test(n)) },
  uzantilar: G.extensionsUsed || [],
};
const asim = [];
if (R.ucgen > B.ucgen) asim.push(`üçgen ${R.ucgen} > ${B.ucgen}`);
if (R.kemik > B.kemik) asim.push(`kemik ${R.kemik} > ${B.kemik}`);
if (dokuMax > B.doku) asim.push(`doku ${dokuMax} > ${B.doku}`);
if (R.dosyaMB > B.dosyaMB) asim.push(`dosya ${R.dosyaMB} MB > ${B.dosyaMB}`);
if (R.etki > B.etki && B.etki) asim.push(`köşe başına etki ${R.etki} > ${B.etki}`);
if (tur !== 'silah' && !(R.eldeKemik.sag && R.eldeKemik.sol)) asim.push('el kemiği bulunamadı (soket kurulamaz)');
if (R.uzantilar.some(u => /meshopt|draco|KHR_texture_basisu/i.test(u))) asim.push(`çözücü gerektiren uzantı: ${R.uzantilar.join(', ')} (oyunda çözücü yok)`);
R.butce = B; R.asim = asim; R.SONUC = asim.length ? 'AŞIM' : 'BÜTÇE İÇİNDE';
if (jsonCik) console.log(JSON.stringify(R, null, 1));
else { console.log(`${R.dosya} [${tur}] üçgen ${R.ucgen} · kemik ${R.kemik} (mixamorig ${R.mixamorig}) · doku ${dokular.length} adet, en büyük ${dokuMax} · ${R.dosyaMB} MB · klip ${R.klipler.length}`); console.log(R.SONUC + (asim.length ? ': ' + asim.join('; ') : '')); }
process.exit(asim.length ? 1 : 0);
