// shared/*.js modüllerindeki JSON'a çevrilebilir bütün dışa aktarımları döker (fonksiyonlar yalnız ad olarak)
import fs from 'fs'; import path from 'path'; import { pathToFileURL } from 'url';
const [, , dir, out] = process.argv; fs.mkdirSync(out, { recursive: true });
const ozet = {};
const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith('.js') ? [path.join(d, e.name)] : []);
const temiz = (v, seen = new WeakSet(), derin = 0) => {
  if (typeof v === 'function') return undefined;
  if (v === null || typeof v !== 'object') return v;
  if (seen.has(v) || derin > 40) return '[döngü]'; seen.add(v);
  if (v instanceof Map) return Object.fromEntries([...v].map(([k, x]) => [k, temiz(x, seen, derin + 1)]));
  if (v instanceof Set) return [...v].map(x => temiz(x, seen, derin + 1));
  if (Array.isArray(v)) return v.map(x => temiz(x, seen, derin + 1) ?? null);
  const o = {}; for (const k of Object.keys(v)) { const x = temiz(v[k], seen, derin + 1); if (x !== undefined) o[k] = x; } return o;
};
for (const f of walk(dir).sort()) {
  const rel = path.relative(dir, f);
  try {
    const m = await import(pathToFileURL(path.resolve(f)));
    const veri = {}, fn = [];
    for (const [k, v] of Object.entries(m)) { if (typeof v === 'function') fn.push(k); else veri[k] = temiz(v); }
    ozet[rel] = { veri: Object.keys(veri), fonksiyon: fn };
    if (Object.keys(veri).length) fs.writeFileSync(path.join(out, rel.replace(/[\\/]/g, '__').replace(/\.js$/, '.json')), JSON.stringify(veri, null, 1));
  } catch (e) { ozet[rel] = { hata: String(e.message).slice(0, 200) }; }
}
fs.writeFileSync(path.join(out, '_moduller.json'), JSON.stringify(ozet, null, 1));
console.log(Object.entries(ozet).filter(([, v]) => v.hata).map(([k, v]) => k + ': ' + v.hata).join('\n') || 'hatasız', Object.keys(ozet).length);
